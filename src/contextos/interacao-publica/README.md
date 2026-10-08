# Modulo de interacao publica — BC-03

Feature `007-interacao-publica-e-moderacao`. Tarefas fechadas com nota de
entrega neste arquivo: **T001** (esqueleto, as quatro portas e os pontos de
configuracao de moderacao). Este arquivo e a leitura obrigatoria de quem pegar a
tarefa seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro
lugar**, e o que ninguem decidiu.

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca a ORDEM da cascata (T003,
> T010):** ha uma diferenca entre a ordem que `target_architecture.md` declara e
> a ordem em que o legado executa as etapas. Ela esta descrita na secao
> *O que ninguem decidiu*, item 1, com as duas fontes. T001 nao a resolveu e nao
> podia: T001 nao implementa etapa nenhuma.

> 🔴 **E se a sua tarefa toca o limite de vazao (T008):** o pacote e o legado
> discordam sobre quando o freio de `C2` dispara — segundo comentario na ultima
> hora, ou segundo comentario a menos de 15 segundos do anterior. Os dois numeros
> estao nomeados em `configuracao/configuracao-de-moderacao.ts`, no campo
> `intervaloMinimoEntreComentariosEmSegundos`, com as duas fontes citadas.
> Escolher um lado muda o que o visitante recebe, e o P1 exige decisao humana
> registrada.

---

## O que T001 entregou

```
interacao-publica/
├── index.ts                                  a composicao: nome, portas, configuracao
├── modulo.test.ts                            os testes desta entrega
├── portas/
│   ├── porta-de-dados.ts                     a unica porta deste modulo para o banco
│   ├── porta-de-relogio.ts                   segundos inteiros em UTC, como `time()`
│   ├── porta-de-email.ts                     transporte selecionavel; falha e VALOR
│   └── porta-de-cliente-externo.ts           HTTP de saida; a prova do pingback sai daqui
└── configuracao/
    └── configuracao-de-moderacao.ts          13 opcoes + 3 limites + 1 lista, de fabrica
```

`criarModuloDeInteracaoPublica(portas, configuracao?)` devolve
`{ nome, portas, configuracao }` e **mais nada**. Operacao de dominio entra na
tarefa da historia dela, com a declaracao de permissao que o P4 exige — a tabela
de quem entra, com a permissao de cada uma ja lida dos casos de uso, esta no
comentario de `ModuloDeInteracaoPublica` em `index.ts`.

Duas invariantes de arquitetura tem teste proprio aqui, porque um esqueleto as
quebra em silencio:

- **`EXT-ORDEM` (BR-MIGRAR-106):** compor o modulo nao toca em porta nenhuma.
  Nada se resolve no carregamento, porque a ordem de arranque e contrato publico.
- **`EXT-CONTEXTO` (BR-MIGRAR-105):** duas composicoes nao compartilham estado.
  Aqui isso tem cenario de paridade proprio (`@concorrencia`): *"o comentario do
  visitante nao recebe o atalho de confianca do moderador"*. O atalho de `C3`
  depende de quem submeteu.

### Os valores de fabrica, e de onde cada um veio

Todos lidos de `populate_options()` em `wp-admin/includes/schema.php`, do codigo
de `wp-includes/comment.php` ou de `wp-includes/default-constants.php`, com a
linha citada no campo. `modulo.test.ts` afirma os dezessete um por um.

| ponto | fabrica | etapa | ancora |
|---|---|---|---|
| `exigirConta` | desligada | portao de entrada (CA-1.2) | `schema.php:459` |
| `exigirNomeEEmail` | **ligada** | portao de entrada (CA-1.3) | `schema.php:422` |
| `moderacaoManual` | desligada | `C4` | `schema.php:441` |
| `maximoDeLinks` | **2** | `C5` | `schema.php:451` |
| `palavrasDeModeracao` | vazio | `C6` | `schema.php:447` |
| `listaDeProibicao` | vazio | `C9` | `schema.php:545` |
| `exigirAutorJaAprovado` | **ligada** | `C7` | `schema.php:546` |
| `fecharInteracaoEmConteudoAntigo` | desligada | `C11` | `schema.php:500` |
| `diasParaFecharInteracao` | **14** | `C11` | `schema.php:501` |
| `encadearRespostas` | **ligado** | US-7 | `schema.php:502` |
| `profundidadeMaximaDeEncadeamento` | **5** | US-7 | `schema.php:503` |
| `avisarAutorDoConteudo` | **ligado** | US-9 | `schema.php:423` |
| `avisarQuemModera` | **ligado** | US-9 | `schema.php:442` |
| `janelaDeVazaoEmSegundos` | **3600** | `C2` | `comment.php:922` |
| `intervaloMinimoEntreComentariosEmSegundos` | **15** 🔴 | `C2` | `comment.php:2319` |
| `lixeiraLigada` | **sim** | `C9` | `default-constants.php:388` |
| `TIPOS_..._DE_FABRICA` | `['post']` | `C11` | `comment.php:3853` |

**Dois campos sao comparados em modo ESTRITO contra a string `'1'` no legado, e
os outros por veracidade.** `comment_moderation` (`comment.php:47`) e
`comment_previously_approved` (`comment.php:133`) usam `'1' === ...`; os demais
entram direto num `if`. A diferenca e observavel: uma instalacao com
`comment_moderation = 'yes'` **nao** tem moderacao manual ligada, e a mesma
instalacao com `comment_registration = 'yes'` **tem** a exigencia de conta
ligada. Quem escrever a leitura da opcao reproduz essa assimetria.

---

## O que esta decidido em outro lugar

| assunto | onde mora | por que nao aqui |
|---|---|---|
| perguntar permissao | `plataforma/autorizacao/` | e chamada 1.279 vezes em 224 arquivos; fica abaixo de todo contexto. `C3` e `US-10` **consomem** a decisao, nao a tomam |
| os limites de coluna (`C10`) | T002 (forma de armazenamento) e T012 (a recusa) | sao o tamanho da coluna, nao configuracao de moderacao |
| o prazo da lixeira (30 dias) | feature `005-retencao-e-descarte` | `C9` le a constante **por veracidade**; aqui so o booleano `lixeiraLigada` e observavel. Duplicar o 30 criaria dois donos para o mesmo numero |
| a ordem de arranque | D1, contrato publico | AD-10: nenhum contexto importa outro no topo do modulo |
| a definicao de papel | ADR-0001, e BC-05 | P3: a autorizacao e por capacidade, e papel e dado mutavel |
| o disparo nao bloqueante | `BC-11`, AD-07 | nenhuma chamada deste modulo e nao bloqueante no legado: a busca da prova do pingback espera a resposta |

**Por que as portas reaparecem aqui com a forma que `BC-05` ja declara.** AD-08
poe a porta no contexto que a **consome** e AD-10 proibe um contexto importar
outro no topo do modulo. Importar a porta de identidade daqui criaria exatamente
a ligacao horizontal que a regra de dependencia recusa. O mesmo vale para
`SEGUNDOS_POR_HORA`: um numero de calendario nao vale uma ligacao entre
contextos.

---

## O que ninguem decidiu

### 1. A ordem da cascata tem duas leituras, e nenhuma e minha para escolher

`target_architecture.md` (AD-05 e os componentes de `BC-03`) e o cabecalho de
`parity_tests/01-cascata-de-moderacao-de-comentario.feature` declaram a ordem:

```
C1 → C4 → C3 → C2 → C9 → C6 → C5 → C7 → C10 → C8 → C11 → C12
```

O `plan.md` desta feature descreve a mesma sub-ordem com menos etapas:
*"moderacao manual vence tudo; o atalho de confianca... entra aprovado sem passar
por verificacao alguma; depois vem lista de proibicao, palavras de moderacao,
contagem de links e autor ja aprovado"*.

O legado executa em ordem diferente das duas: `check_comment()` roda
`C4 → C5 → C6 → C7` (`comment.php:47`, `:56`, `:80`, `:133`) e **depois**
`wp_allow_comment()` roda `C9`, que **sobrescreve** o resultado
(`comment.php:1384`, `:1392`). Nas duas leituras o destino final coincide,
porque `C9` encerra a decisao de qualquer forma — mas o cenario de paridade
`@ordem-de-decisao` afirma, textualmente, que *"nenhum dos dois consulta a lista
de proibicao nem conta links"* quando `C4` decide, e isso e sobre **o que foi
consultado**, nao so sobre o resultado.

T003 declara a cascata como sequencia nomeada e ordenada, e T010 a percorre.
Qual ordem a lista declara e decisao com efeito observavel (quantas consultas
saem, em que ordem os pontos de extensao disparam — e o ultimo cenario de
paridade cobra *"a ordem em que os pontos de extensao sao chamados e a mesma nas
duas"*). T001 nao escolheu, e nao escreveu a lista.

### 2. Os quatro conflitos que a `spec.md` ja registra em aberto

Nenhum deles e desta tarefa, e nenhum deles foi tocado. Ficam aqui porque cada
um cai numa tarefa adiante:

1. **REQ-081** (descartar o protocolo de notificacao sem prova) — o card descarta
   e a resposta 14 contradiz. **T032** encosta nisso.
2. **REQ-085** (descartar o rebaixamento para canal sem cifra) — o card descarta
   e a resposta 12 nomeia o card e manda manter. O campo
   `verificarCertificado` de `portas/porta-de-cliente-externo.ts` permite as
   duas leituras **e nenhum codigo deste modulo o altera**.
3. **O escopo do servico externo de reputacao** — a resposta 13 o poe fora do
   nucleo, e `discard_log.md` ja descartou `C13` e o envio integral. **T034** e
   **T036** dependem disso: a spec especifica as duas historias, a resposta diz
   que elas nao sao do nucleo. A porta de cliente externo nao declara nada
   especifico de classificador.
4. **REQ-069** (qual sanitizacao se aplica a quem entra pelo atalho de confianca
   de `C3`) — ficou `bloqueado` e nao entrou. **T004** e **T010** constroem a
   cascata cujo primeiro passo e esse atalho.

E uma quinta, que e divergencia deliberada e nao conflito: **US-18 / REQ-180**
serve a imagem de quem comenta sem enviar o dado a terceiro, o que diverge do
observavel do legado e precisa de decisao humana registrada (P1). Por isso
`show_avatars`, `avatar_default` e `avatar_rating` **nao** estao nos pontos de
configuracao: semear o valor de fabrica deles antes da decisao seria tomar a
decisao. **T038**.

---

## Como conferir esta entrega

```sh
npm test            # a suite inteira; 11 testes sao de T001
```

A paridade desta area se prova por
`.specify/migration/parity_tests/01-cascata-de-moderacao-de-comentario.feature`,
cujo criterio e *"efeito no banco + byte a byte no valor devolvido por hook"*
(Decisao 2 de `parity_specs.md`). T001 entrega os dois pre-requisitos daquele
arquivo: as portas que o cenario `@composicao` substitui por duplo, e os valores
de fabrica que os cenarios `Dado a opcao ... com o valor ...` pressupoem.
