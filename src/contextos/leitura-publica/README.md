# Modulo de leitura publica — feature `004-leitura-publica`

Epico EP-4 do backlog: *"entregar o conteudo publicado a quem nao tem conta"*.
Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, a porta
de dados, a resolucao de endereco e a resposta de endereco inexistente).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que ninguem
decidiu.

---

## 🔴 O que quem pega T002 ou T003 precisa saber antes de escrever a primeira linha

### 1. O 404 que este esqueleto devolve e provisorio por tarefa, e nao regra

T001 entrega, por texto da tarefa, *"resolve o endereco pedido para um conjunto
vazio de criterios e devolve a resposta de endereco inexistente"*. Isso e
exatamente o valor inicial do legado — `$set_404 = true`
(`wp-includes/class-wp.php:747`) —, e o que derruba esse valor sao **tres ramos de
excecao que dependem do resultado da consulta**, que e T003.

Consequencia que precisa estar escrita: enquanto a consulta nao existir, **todo**
endereco responde 404 aqui, **inclusive a home**. No legado, conjunto vazio de
criterios e `is_home()`, e `is_home()` esta na lista que limpa o 404
(`class-wp.php:784-795`). Quem fechar T003 sem trazer os tres ramos deixa a cara
publica do produto respondendo 404 na primeira pagina. Os tres estao transcritos,
com linha do legado, no cabecalho de `requisicao/situacao-da-resposta.ts`.

### 2. Os dois caminhos de 404 do legado sao diferentes, e so um deles esta aqui

| caminho | como o legado decide | quem o traz |
|---|---|---|
| **endereco que nao casa regra nenhuma** | `parse_request` poe o criterio `error` em `'404'` (`class-wp.php:167` e `:398-400`); a consulta le o criterio e se marca sozinha (`class-wp-query.php:1148-1150`); `handle_404` desiste no comeco; o codigo sai do envio de cabecalhos (`class-wp.php:455-466`) | **T002** |
| **consulta que nao encontra conteudo** | `handle_404` olha o resultado e decide (`class-wp.php:724-805`) | **T003**, e e o que `situacaoDaResposta` ja esboca |

Confundir os dois produz um sistema que 404a no lugar certo pelo motivo errado — e
o motivo e observavel, porque o primeiro caminho **nao** passa pelos tres ramos de
excecao do segundo.

### 3. A porta de dados tem `escrever`, numa feature de leitura, e isso e regra do legado

A pos-condicao de UC-01 diz *"nada muda no armazenamento"* e *"o contador de
visualizacoes nao existe"* — e vale para o conteudo e para a visita. Mas a tabela
de regras de traducao de endereco e um **cache gravado na configuracao do site**, e
o legado o reconstroi **durante uma leitura publica** quando a opcao esta vazia:
`WP_Rewrite::wp_rewrite_rules()` chama `refresh_rewrite_rules()`, que termina em
`update_option( 'rewrite_rules', ... )` (`wp-includes/class-wp-rewrite.php:1493-1523`).

T001 nao chama nem `selecionar` nem `escrever` — ha teste afirmando os dois zeros.
T002 e a primeira tarefa a usar a porta.

### 4. Os pontos de extensao chegam por argumento, porque o barramento nao existe

Sao seis os pontos que o fluxo de T001 atravessa, com o nome do legado e na
posicao do legado:

| ponto | tipo | onde dispara | legado |
|---|---|---|---|
| `do_parse_request` | filtro, curto-circuita | antes da resolucao | `class-wp.php:148` |
| `request` | filtro, substitui os criterios | fim da resolucao | `class-wp.php:409` |
| `parse_request` | acao | depois da resolucao | `class-wp.php:418` |
| `pre_handle_404` | filtro, curto-circuita com qualquer valor `!== false` | antes da decisao de situacao | `class-wp.php:738` |
| `set_404` | acao | ao marcar a resposta | `class-wp-query.php:1858` |
| `wp` | acao | fim do atendimento, **sempre** | `class-wp.php:839` |

`plataforma/barramento/` nao existe nesta arvore, e inventa-lo em T001 seria
decidir no lugar da feature 015. Entao os interceptadores chegam por argumento,
com retorno valendo onde o legado deixa valer — que e o que o P2 manda poder
conferir. Quando o barramento existir, e ele que passa a alimenta-los; a forma do
ponto nao muda.

⚠️ **Falta a prioridade inteira, e e lacuna declarada e nao decisao.** O
inventario de pontos de extensao que o P2 exige — *"com nome, argumentos e
ordem"* — nao existe neste pacote; a feature 001 registrou a mesma lacuna na
cadeia de autenticacao. Hoje a ordem e a do arranjo recebido.

### 5. O ponto de extensao `query_vars` ainda nao esta em lugar nenhum

Ele filtra a **lista de nomes** de criterio aceitos (`class-wp.php:311`), e so tem
efeito quando existe coleta de criterio — que e T002. Esta nomeado aqui para nao
sumir: ele e o que permite a uma extensao acrescentar criterio proprio, e um porte
que colete criterios sem ele produz um sistema mais fechado que o legado.

---

## O que T001 entregou

```
leitura-publica/
├── index.ts                               composicao e barril
├── portas/porta-de-dados.ts               a porta, somente declarada
└── requisicao/
    ├── endereco-pedido.ts                 o endereco e os criterios de consulta
    ├── resolver-endereco.ts               `parse_request`, no caminho sem regras
    ├── situacao-da-resposta.ts            `handle_404`, no valor inicial
    └── atender-leitura-publica.ts         `WP::main`, a ORDEM das etapas
```

A superficie do modulo, com a permissao de cada operacao declarada na interface
(P4):

| operacao | tarefa | permissao exigida |
|---|---|---|
| `resolverEndereco` | T001 | **nenhuma capacidade**, declarada |
| `situacaoDaResposta` | T001 | **nenhuma capacidade**, declarada |
| `atender` | T001 | **nenhuma capacidade**, declarada |

As tres declaram "nenhuma" porque UC-01 e literal: *"nao ha verificacao de
capacidade. O portao e o `post_status`"*. As duas portas de autorizacao desta
feature chegam depois, e nenhuma delas e uma capacidade perguntada na entrada: o
portao de `post_status` em **T009** (US-4) e o atestado de senha de conteudo em
**T013** (US-6) — que BR-MIGRAR-098 (`PERM-12`) registra como um dos cinco pontos
que decidem acesso **sem consultar o modelo de capacidades**.

## O que esta decidido em outro lugar

- **A ordem das etapas do atendimento** e contrato publico (BR-MIGRAR-106,
  `EXT-ORDEM`) e a tabela *Nao negociavel* da constituicao a tira das maos do
  agente de codificacao. Ela esta declarada, com as etapas que faltam e a posicao
  de cada uma, em `requisicao/atender-leitura-publica.ts`. Acrescentar etapa no
  fim, em vez de na posicao marcada, e mudanca de contrato.
- **A identidade da requisicao** (etapa 1, `WP::init()`) e da feature 001,
  `sessaoDaRequisicao`. Este modulo nao a resolve e nao a guarda.
- **A decisao de capacidade** mora em `plataforma/autorizacao/`, abaixo de todo
  contexto. T009 a consome; nao a reimplemente aqui.
- **Os valores dos cabecalhos de nao-cache** saem de `wp_get_nocache_headers()`
  (`wp-includes/functions.php:1508-1530`), que e funcao da plataforma,
  substituivel e com ponto de extensao proprio. `RespostaDaLeitura.semCache` so
  registra que o legado os manda; os valores nao sao deste contexto.

## O que ninguem decidiu

- **Qual tema serve de oraculo para a hierarquia de modelos** (pergunta aberta da
  `spec.md`, US-2). Sem tema de referencia, a paridade de T005 nao e verificavel.
- **O lado cliente da pre-busca de navegacao** (US-7) esta ausente desta arvore
  (lacuna L4 de `soul.md`); a resposta 15 manda construir a partir do repositorio
  de origem.
- **O conflito do card de descarte REQ-046** (gerenciador de lista de links e
  indice OPML) esta registrado e **nao resolvido** na secao *Fora de escopo* da
  `spec.md`. Nada nesta arvore o resolve, e a tabela `links` nao e tocada por este
  modulo. A tabela *Nao negociavel* da constituicao poe "resolver um dos conflitos
  entre card `wont` e resposta humana" entre o que exige humano.
- **O prazo e o limite de tentativa do atestado de senha de conteudo**: REQ-044
  esta em `do-not-rewrite.md`, e a resposta 8 manda preservar os tres fatos do
  legado (dez dias no navegador, sem verificacao de idade no servidor, sem limite
  de tentativa). Quem fizer T013 nao inventa numero (P6).

## Onde esta pasta mora no desenho

Esta feature **nao** e um `bounded context` de `target_architecture.md`: ela
atravessa `BC-01` (a consulta e a macro textual), `plataforma/rotas` (a traducao
de endereco) e `plataforma/tema` (a hierarquia de modelos), e aquele artefato nao
declara mapa de feature para pasta. A pasta leva o nome da feature, como
`001-identidade-e-acesso` fez com a dela, por tres razoes: a tarefa nomeia *"o
modulo de leitura publica"*; `BC-01` e tambem o destino da feature `002`, que esta
sendo construida em paralelo, e duas features escrevendo a mesma pasta e conflito
de merge e nao arquitetura; e a escolha nao muda nada do que o teste de borda da
Opcao 3 mede — *"muda a saida HTTP, o efeito no banco ou o comportamento de caso
de uso?"*.

Consolidar as pastas no desenho de `target_architecture.md` e trabalho de quem
tiver as 15 features na mao, e e reversivel: nenhum nome publico depende do
caminho do arquivo.

## Como conferir

`npm test` na raiz. Os testes de T001 estao em `modulo.test.ts` e afirmam **so** o
que T001 entrega, mais tres invariantes que um esqueleto quebra em silencio:
estado de modulo (`EXT-CONTEXTO`), trabalho no carregamento (`EXT-ORDEM`) e ponto
de extensao que nao dispara ou nao altera o resultado (P2). Nenhum caso `UT-0xx`
de `backlog/tests.md` e afirmado ali: esses sao das tarefas de teste de cada
historia (T004, T006, T008, T010, T012, T014, T016, T018).
