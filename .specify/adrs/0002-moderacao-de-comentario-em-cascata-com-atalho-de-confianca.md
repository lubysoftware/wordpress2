# ADR 0002 — Moderação de comentário em cascata, com atalho de confiança

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 1.5.0 (`check_comment()`), reorganizado na 6.7.0 (`wp_check_comment_data()`) |
| **Área** | moderação |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-includes/comment.php:43-189`, `:752-875`, `:909-989`, `:1319-1339`, `:1352-1408`, `:1423-1459` |

## Contexto

Um comentário que chega precisa ser classificado em um de quatro destinos — aprovado, fila
de moderação, spam, lixeira — ou recusado na porta. A decisão tem de ser tomada **antes**
de gravar, barata o suficiente para rodar em toda requisição de comentário, e configurável
por quem administra o site sem programar.

O sistema não tem motor de regras, não tem fila assíncrona e, na época da decisão, não
tinha serviço externo de classificação.

## Decisão

Uma **cascata de verificações em ordem fixa**, onde cada etapa pode encerrar a decisão, e
com um **atalho no topo** que dispensa a cascata inteira para quem já é confiável.

A ordem, lida de `wp_allow_comment()` e `wp_check_comment_data()`:

| Ordem | Verificação | Resultado | Linha |
|---|---|---|---|
| 1 | duplicata exata (post, pai, autor, e-mail, texto) | **recusa, HTTP 409** | `:759-818` |
| 2 | enxurrada: comentário do mesmo usuário/IP/e-mail na última hora | **recusa, HTTP 429** — salvo para quem tem `manage_options` ou `moderate_comments` | `:835-872`, `:909-989` |
| 3 | **atalho de confiança**: é o autor do post, ou tem `moderate_comments`? | **aprovado, sem mais nada** | `:1365-1367` |
| 4 | moderação manual ligada? | fila | `:46-49` |
| 5 | links `>=` `comment_max_links` (default 2) | fila | `:55-77` |
| 6 | palavra de `moderation_keys` em autor, e-mail, URL, texto, **IP ou user-agent** | fila | `:80-124` |
| 7 | autor com comentário anterior aprovado **e** e-mail limpo? | aprovado | `:133-167` |
| 8 | palavra de `disallowed_keys` | **lixeira**, ou spam se a lixeira estiver desligada | `:1384-1393` |
| 9 | filtro `pre_comment_approved` | o que o extensor decidir | `:1407` |

Duas assimetrias deliberadas dentro da cascata:

- **A etapa 3 é um curto-circuito total.** O comentário do autor do post ou de um
  moderador não passa por limite de link, por palavra de moderação, nem pela lista de
  proibição. O comentário no código é de uma linha: *"The author and the admins get
  respect."* (`:1366`)
- **A etapa 2 tem exceção por capacidade.** Quem modera não é limitado — o docblock diz
  *"Won't run, if current user can manage options, so to not block administrators."*
  (`:894-895`)

Os limites de tamanho de campo (etapa paralela, `:1319-1339`) são a única validação do
sistema que **devolve erro** em lugar de truncar silenciosamente, contrariando o padrão
geral descrito em [`database/business-rules.md`](../database/business-rules.md) §6.

## Alternativas consideradas

| Alternativa | Por que não foi adotada (inferência) | Conf. |
|---|---|---|
| **Pontuação acumulada** (cada sinal soma, um limiar decide) | daria graduação em vez de decisão binária por etapa, mas exigiria calibragem e explicação ao administrador. A cascata é legível na tela de configuração: cada opção é uma linha | 🟡 |
| **Classificação assíncrona**, gravando sempre em `'0'` e reclassificando depois | exigiria fila confiável, e o agendador do sistema só avança por requisição HTTP (ver [ADR 0006](0006-retencao-agendada-por-visita-ao-painel.md)). Um comentário poderia ficar horas invisível num site de pouco tráfego | 🟡 |
| **Serviço externo como padrão** | é o que o Akismet faz, e ele vem empacotado — mas **desativado**. Depender de rede para aceitar um comentário contraria o objetivo de instalar e funcionar sem conta em serviço nenhum ([`soul.md` §1](../soul.md)) | 🟢 o plugin está em `wp-content/plugins/akismet/` e não é ativado pelo instalador |
| **Sem atalho de confiança** (todos passam pela cascata) | o administrador do próprio site seria moderado pelas suas próprias regras — e, com `comment_moderation` ligado, moderaria a si mesmo | 🟡 |

## Consequências

**Desejadas**

- A configuração inteira cabe numa tela de opções, e cada ajuste tem efeito previsível. 🟡
- O caminho mais comum — comentário do autor respondendo a um leitor — não paga nenhuma
  consulta de verificação. 🟢
- A ordem permite que a regra mais barata (duplicata, por índice) venha antes da mais
  caras (regex sobre seis campos). 🟡

**Indesejadas, e ainda pagas**

- **A etapa 3 combinada com `unfiltered_html` é uma superfície real.** O autor do post e
  qualquer `editor` têm aprovação automática **e** `unfiltered_html`
  (`wp-admin/includes/schema.php:797`), o que significa comentário com HTML arbitrário sem
  nenhuma filtragem. Ver [`permissions.md`](../permissions.md) §2. 🟢
- **As palavras de moderação são aplicadas como expressão regular** sobre seis campos,
  inclusive IP e user-agent (`:104-122`). Uma linha mal escrita na configuração vira um
  padrão que casa com tudo — e `preg_quote` protege o `#` do delimitador, não o
  administrador de si mesmo. 🟢
- **A decisão não é registrada.** Nenhum dos nove passos grava por que o comentário foi
  para a fila. Quem administra vê o resultado e não a razão. 🟢
- **A ordem é contrato implícito.** Um plugin que se liga em `pre_comment_approved`
  assume que todas as etapas anteriores já rodaram — e rodaram, mas nada documenta a
  ordem fora do próprio código. 🟡
- **`disallowed_keys` manda para a lixeira, não para spam**, e isso depende de
  `EMPTY_TRASH_DAYS`. Com a lixeira desligada, a mesma regra passa a mandar para spam
  (`:1392`): a mesma configuração produz dois destinos diferentes conforme outra
  configuração. 🟢

## Para um porte

- Preserve a ordem. Ela não é arbitrária e não é documentada em lugar nenhum além do
  código: este ADR e a tabela acima são o registro.
- A oportunidade óbvia é **registrar a decisão**: gravar, junto com o comentário, qual
  etapa o classificou. Custa uma coluna e resolve a reclamação mais comum de quem modera.
- A etapa 3 merece decisão explícita: manter o atalho, mas **não** dispensar a filtragem
  de HTML, é compatível com o comportamento do produto e fecha a superfície.
