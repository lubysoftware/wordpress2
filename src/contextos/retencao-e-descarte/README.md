# Modulo de retencao e descarte — feature `005-retencao-e-descarte`

Tarefas com nota de entrega neste arquivo: **T001** (esqueleto, as tres
portas e o prazo de retencao), **T002** (os marcadores de lixeira como
metadado), **T003** (o descarte para a lixeira, US-1), **T005** (a suspensao dos
comentarios em cascata, US-2), **T007** (a restauracao como rascunho, US-3),
**T009** (o que cada superficie diz antes de apagar em
definitivo, US-4), **T011** (a coleta do que
venceu, US-5 — **com dois dos cinco criterios declarados abertos**), **T015** (a
tolerancia a estado inconsistente, US-7) e **T017** (a exclusao definitiva com
reposicionamento de filhos e anexos, US-8). Este arquivo e
a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o que ja esta
decidido, o que esta decidido **em outro lugar**, e o que **ninguem decidiu**.

> 🔴 **Se a sua tarefa e T008 (os testes de US-3), ou qualquer uma que toque a
> gravacao do estado:** a ordem dos treze passos, a falha que deixa o conteudo
> preso na lixeira e o sufixo `__trashed` que **ninguem recebeu** estao em *O que
> T007 entrega*. A forma de `contexto-de-restauracao.ts` e a montagem de
> `us-3-restaurar-conteudo.test.ts` servem aos oito casos de UT-049.

> ✅ **T006 (os testes de US-2): decidido em 01/11/2026.** A regra e o UT-048-5
> passaram a falar de **um** estado inalcancavel, `post-trashed` — a saida "a regra
> se corrige" da secao *A contagem que T005 encontrou*. Nao invente um segundo.

> ⚠️ **Se a sua tarefa e T018 (os testes de US-8), ou qualquer uma que toque a
> cascata de exclusao:** **CA-8.4 nao e uma invariante universal, e T017 nao a
> transformou em uma.** O criterio — *"nenhum registro fica apontando para um
> conteudo que nao existe mais"* — vale, e esta afirmado por teste, para tudo o
> que a cascata do legado cobre. Fora dela o legado deixa vinculo pendurado **de
> proposito**, em tres casos com `arquivo:linha` registrado, e a Decisao 2 de
> `pending_decisions.md` poe esses orfaos **dentro** do que a paridade compara.
> Fechar qualquer um deles seria acrescentar limpeza que o legado nao tem, e cai
> na linha *"declarar restricao no armazenamento que mude a cascata observavel"*
> da tabela *Nao negociavel*. O censo esta na secao *O limite de CA-8.4* e no
> cabecalho de `exclusao/reposicionamento-no-avo.ts`.

> ⚠️ **Se a sua tarefa e T010 (os testes de US-4):** **CA-4.2 e UT-050-2 foram
> realinhados ao legado por decisao humana de 2026-10-29**: no caminho de conteudo
> **nao ha confirmacao nenhuma** ao apagar com a lixeira desligada. Transcreva
> UT-050-2 como ele esta hoje em `backlog/tests.md`, afirmando a ausencia. O censo
> esta na secao *A decisao sobre CA-4.2* e no cabecalho de
> `descarte/aviso-de-exclusao-definitiva.ts`.

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca o agendamento da coleta:** o
> conflito entre **CA-5.1** e a **resposta 10** de `questions.md` **continua
> aberto**, e nem T001 nem T011 o resolveram — nem podiam. T001 declarou a porta
> da fila de modo a servir os dois lados sem favorecer nenhum e afirmou por teste
> que **compor o modulo nao agenda nada**; **T011 portou o corpo do registro**
> (`coleta/agendamento-da-coleta.ts`) e **nao o chamou de lugar nenhum**. A
> explicacao inteira esta nas secoes *O conflito que T001 declarou e nao decidiu*
> e *O que T011 entrega, e so isso* deste arquivo, no cabecalho de
> `portas/porta-de-fila-agendada.ts` e no de `coleta/agendamento-da-coleta.ts`.
>
> **Se o que lhe interessa e so executar a coleta** — T013 (US-6) e T015 (US-7)
> dependem dela —, ela esta pronta e nao depende do conflito:
> `modulo.coletarALixeiraVencida( contexto )`.

> 🔴 **E se a sua tarefa toca a expiracao do rascunho automatico (T013, US-6):** o
> prazo de 7 dias do legado **nao e constante e nao e decidido pelo relogio do
> processo** — ele esta cravado dentro do SQL, comparado com o relogio do **banco**
> (`wp-includes/post.php:8377`). Usar a `PortaDeRelogio` ali muda o conjunto de
> linhas apagadas em toda instalacao cujo banco e cujo site nao estao no mesmo
> fuso. Ver a secao 🔴 de `portas/porta-de-relogio.ts`.

## O que T001 entrega, e so isso

> *o modulo carrega com as portas de dados, de relogio e de fila agendada
> declaradas, e o prazo de retencao lido de um ponto de configuracao nomeado com o
> valor de fabrica do legado*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T001

| arquivo | o que e |
|---|---|
| `index.ts` | a composicao: recebe as tres portas e devolve o modulo |
| `portas/porta-de-dados.ts` | a unica porta deste modulo para o banco |
| `portas/porta-de-relogio.ts` | o instante corrente, em segundos inteiros UTC |
| `portas/porta-de-fila-agendada.ts` | registrar e consultar o evento recorrente — **nao** disparar nem executar |
| `configuracao/prazo-de-retencao.ts` | `EMPTY_TRASH_DAYS`: 30 dias de fabrica, e o que zero significa |
| `modulo.test.ts` | afirma a entrega de T001 e as invariantes que um esqueleto quebra em silencio |
| `configuracao/prazo-de-retencao.test.ts` | a borda do numero, que o P6 cobra |

**Nenhuma regra de negocio esta implementada**, e nenhuma operacao esta exposta. A
superficie do modulo e `{ nome, portas, prazoDeRetencao, armazenamento }`, e
`modulo.test.ts` a congela nessas quatro chaves de proposito — **nenhuma delas e
operacao**: a lista de operacoes cresce **na tarefa de cada historia**, com a
declaracao explicita de permissao que o **P4** cobra.

**Um unico numero mora neste modulo hoje**, e e o que T001 pede: o prazo de
retencao. Os outros numeros desta feature entram nas tarefas que os implementam,
cada um com o teste de borda que o **P6** exige — os 7 dias do rascunho automatico
(T013), o que `MEDIA_TRASH` decide (nao e prazo, e a decisao dela ja foi tomada
pela resposta 9), e a trava de 60 segundos da fila (feature `011`). Numero que
aparece aqui antes da tarefa dele e numero sem teste de borda.

## As tres portas, e por que sao estas

`tasks.md` as pede pelo nome em T001: dados, relogio e fila agendada.

- **Dados** e uma das 5 portas de AD-08 e e o slot `persistencia` que `plan.md`
  lista para esta feature. Declara **so** `prefixoDeTabela`: as quatro tabelas
  desta feature (`posts`, `postmeta`, `comments`, `commentmeta`) sao todas de
  escopo **por site**, e o prefixo base serve `users`/`usermeta`, que nao sao
  daqui.
- **Fila agendada** nao esta entre as 5 de AD-08, e nao e invencao: ela e a
  fronteira com **BC-11**, que `target_architecture.md` poe como dono do
  `AGG-TarefaAgendada`, e `plan.md` declara a dependencia da feature `011` na
  secao *Sequencia*. No legado a fila e uma linha de `options`; trata-la como dado
  deste modulo duplicaria o formato em dois donos.
- **Relogio** tambem nao esta em AD-08, e a tensao e a mesma que a feature `001`
  registrou na porta dela: o que AD-08 recusa e dar porta ao barramento de hooks,
  a traducao e ao escape, por custo de indirecao; o relogio nao substitui sistema
  externo, e sem ele o **P6** (*"no ultimo instante aceita, um instante depois
  recusa"*) e o contexto de PT-004 (*"um oraculo ... com relogio controlavel"*) nao
  sao conferiveis.

**As portas sao sincronas** (AD-04), e a porta de dados **nao tem transacao** — o
que nesta feature e o contrato, nao uma omissao: a coleta do legado percorre
registro por registro e, interrompida, deixa **parte** apagada, que e exatamente o
estado que CA-5.4 manda poder retomar.

**A porta de dados repete a forma da porta de `identidade-e-acesso`, e a
duplicacao e a regra:** AD-10 proibe contexto importar contexto no topo do modulo,
e a regra de dependencia 4 poe a porta no modulo que a consome. A camada de dados
de verdade e trabalho da feature `015` (T007).

## O prazo de retencao: onde ele mora e o que o altera

| | |
|---|---|
| valor de fabrica | **30 dias** (`wp-includes/default-constants.php:388`) |
| regra | `R1` / BR-MIGRAR-030 — *lixeira de 30 dias, e desliga-la torna apagar irreversivel* |
| ponto que o altera | o **argumento da composicao** (`criarModuloDeRetencaoEDescarte`) |
| forma no legado | **constante** redefinida antes do arranque, nao opcao e **nao ponto de extensao** |

Nao existe `apply_filters` sobre `EMPTY_TRASH_DAYS` no legado: nenhuma extensao
muda este prazo em execucao. Por isso o ponto de configuracao e a composicao, e
**nao** foi criado um ponto de extensao para ele — o P2 protege o que existe, e
inventar contrato publico que o legado nao tem e a mesma categoria de erro na
direcao oposta.

**O que o zero faz, e de quem e o efeito.** `lixeiraEstaLigada()` responde *"ha
lixeira?"*, lendo a primeira linha de `wp_trash_post()`
(`wp-includes/post.php:4084`). **Apagar em definitivo quando a resposta e nao**
ja esta no lugar: **T003** poe a delegacao na primeira linha da operacao
(`descarte/descartar-para-a-lixeira.ts`, desfecho `apagado-em-definitivo`).
**T009** (US-4) acrescentou a **pergunta** nas tres formas em que o legado a faz
(`descarte/lixeira-desligada.ts`) e o que a tela oferece antes da acao
(`descarte/acoes-de-descarte-na-tela.ts`), e **CA-4.2** afirma que nenhuma
confirmacao e pedida, porque o legado nao a pede — ver *A decisao sobre CA-4.2*.
O que ainda falta e de **T017** (US-8): a cascata que o campo
`exclusaoDefinitiva` do contexto espera.
**T017 a entregou**: `exclusao/apagar-em-definitivo.ts`, ligada a esse campo por
`exclusaoDefinitivaDe()` — ver *O que T017 entrega, e so isso*.

**Valor negativo nao desliga a lixeira** — em PHP `-1` e verdadeiro —, e nenhuma
guarda foi acrescentada contra isso, porque o legado nao tem nenhuma (P1). 🔴 **E
e so no painel:** a API REST pergunta `EMPTY_TRASH_DAYS > 0`
(`class-wp-rest-posts-controller.php:1099`), logo com `-1` ela **recusa** o
descarte que o painel aceita — achado de T009,
`descarte/lixeira-desligada.ts`. A
consequencia aparece na coleta: o instante limite cai no futuro.

**A comparacao do prazo nao esta neste modulo, e o operador esta escrito para quem
a for fazer:** no legado e `meta_value < %d`, **estritamente menor**, sobre
`_wp_trash_meta_time` (`wp-includes/functions.php:6979` e `:6997`). O registro
descartado **exatamente** no instante limite ainda **nao** vence — e a borda de
UT-052-2 (*"poupa o que esta no limite"*). Trocar por `<=` e mudanca de
comportamento observavel.
**T011 a fez assim**: as duas consultas, com o `<` estritamente menor, estao em
`coleta/varredura-do-vencido.ts` — ver *O que T011 entrega, e so isso*.

## O que T002 entrega, e so isso

> *o estado anterior e o instante do descarte sao gravados e lidos como metadado
> do registro, para conteudo e para comentario, pela porta de dados*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T002

| arquivo | o que e |
|---|---|
| `armazenamento/chaves-e-tabelas.ts` | as duas tabelas e as **tres** chaves de marcador, derivadas como o legado as deriva |
| `armazenamento/metadado.ts` | `add`, `get` e `delete` de `wp-includes/meta.php`, parametrizados pelo tipo de metadado |
| `armazenamento/marcadores-de-lixeira.ts` | os marcadores com nome, para conteudo e para comentario |
| `armazenamento/leitura-de-linha.ts` | leitura de coluna, repetida de BC-01 porque a regra de dependencia 3 a obriga |
| `armazenamento/porta-falsa.ts` | o duplo que **registra comando**, para que "nenhum comando" seja afirmavel |
| `armazenamento/armazenamento.test.ts` | as 19 afirmacoes de T002 |

**Sao tres chaves, nao duas.** `tasks.md` pede o estado anterior e o instante, que
sao duas chaves por registro; a terceira —
`_wp_trash_meta_comments_status` — e o mesmo estado anterior, *"para
comentario"*, gravado por `add_post_meta()` **no conteudo**
(`wp-includes/post.php:4299`). E o *"guardado, agrupado, junto do conteudo"* de
CA-2.2, e a forma dele e desta tarefa; a **cascata que o preenche** e T005.

| marcador | onde mora | quem o le no legado |
|---|---|---|
| `_wp_trash_meta_status` | `postmeta` e `commentmeta` | a restauracao, o mapeamento de capacidade (CA-3.5), o anexo que le o **pai**, a tela de moderacao |
| `_wp_trash_meta_time` | `postmeta` e `commentmeta` | **ninguem, por registro** — so o SQL da coleta |
| `_wp_trash_meta_comments_status` | so `postmeta` | a restauracao de comentarios |

**O que esta tarefa achou e vale para as seguintes:**

- **A ordem dos comandos nao e a mesma nos dois lados, e e por isso que este
  modulo oferece primitivas e nao uma chamada "registrar descarte".** O conteudo
  grava **dois** comandos (acrescenta estado, acrescenta instante); o comentario
  grava **quatro** (apaga os dois, acrescenta os dois), porque ele pode chegar da
  caixa de spam ja com marcador. E a restauracao do comentario apaga na ordem
  **inversa** da do descarte. A tabela completa, com arquivo:linha, esta no
  cabecalho de `marcadores-de-lixeira.ts`.
- **Ler um marcador e UM comando, nao um por chave.** `get_metadata_raw()` nao
  consulta por chave: carrega todas as linhas do registro
  (`wp-includes/meta.php:1204`) e filtra em memoria. Um porte que consultasse por
  chave multiplicaria os comandos que a area 3 da Decisao 2 compara.
- **Apagar marcador sao dois comandos, ou nenhum.** `SELECT meta_id` e so entao
  `DELETE ... IN( ... )`; quando o `SELECT` nao devolve linha, o `DELETE` **nao
  sai** (`wp-includes/meta.php:467`). E o caso comum de US-7, e esta afirmado.
- ⚠️ **Identificador negativo nao e recusado: ele e espelhado no positivo.**
  `absint( -5 )` e `5`, logo o marcador vai para o registro 5. O bloco de
  documentacao de `get_metadata_raw()` afirma o contrario, e **o codigo ganha**
  (P1). Reproduzido, com teste.
- **A ordem das entradas do marcador agrupado e observavel nos bytes** e nao e
  ordenada: no legado ela e a ordem de uma consulta **sem `ORDER BY`**
  (`wp-includes/post.php:4288`), e a chave do arranjo sai **inteira**. Ordenar ou
  reindexar quebraria `15-fronteira-do-banco-e-codec-serialize`.

🔴 **O que T002 deliberadamente NAO fez, e a tarefa seguinte nao deve procurar
aqui:** a varredura do que venceu. A unica comparacao de prazo do legado e
`SELECT post_id FROM postmeta WHERE meta_key = '_wp_trash_meta_time' AND
meta_value < %d` (`wp-includes/functions.php:6979`, e a gemea sobre `commentmeta`
em `:6997`) — ela atravessa **todos** os registros, nao e o marcador "do
registro" que T002 entrega, e o `%d` dela vem de `instanteLimiteDeRetencao()`, que
e o numero de T001. Ela e de **T011**, com a borda de UT-052-2. O leitor
`instanteDoDescarte()` existe para afirmar o byte gravado e **nao** substitui a
varredura: filtrar em memoria mudaria o conjunto de linhas apagadas.
T011 a entregou em `coleta/varredura-do-vencido.ts`, como consulta, e nao como filtro.

**E nao existe `esquema.ts` neste armazenamento, por decisao e nao por
esquecimento.** `plan.md` abre a secao *Modelo de dados* com *"Esta feature nao
acrescenta tabela"*: o DDL de `{p}postmeta` e de BC-01 e o de `{p}commentmeta` e
de BC-03. Emitir DDL daqui criaria dois donos para a mesma tabela — e o segundo
dono e exatamente quem declararia a cascata que o **P5** proibe.

## O que T003 entrega, e so isso

> *o comportamento de US-1 existe e os criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4,
> CA-1.5 passam contra o sistema novo*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T003

| arquivo | o que e |
|---|---|
| `descarte/descartar-para-a-lixeira.ts` | a operacao, e `wp_trash_post()` — os **doze** passos na ordem do legado |
| `descarte/permissao-de-descarte.ts` | CA-1.3, CA-1.4 e CA-1.5: a pergunta `delete_post`, e as tres superficies que recusam |
| `descarte/contexto-de-descarte.ts` | o que chega por argumento, e de quem cada peca e |
| `descarte/estado-de-lixeira.ts` | CA-1.2: o estado `trash` como o legado o **registra** |
| `descarte/us-1-descartar-conteudo.test.ts` | as 19 afirmacoes de T003 |

A operacao entrou na superficie do modulo (`descartar`), com a declaracao de
permissao que o **P4** cobra, e `modulo.test.ts` passou a congelar **cinco**
chaves. As outras tres operacoes da tabela *Contratos* continuam so citadas.

**Sao duas funcoes, e a de dentro nao tem portao.** `descartar()` e a superficie
— le, pergunta `delete_post` e so entao age; `descartarParaALixeira()` e
`wp_trash_post()`, que no legado **nao verifica capacidade nenhuma** e tem um
chamador sem ator (`wp_delete_post()`, `wp-includes/post.php:3855`). E a mesma
divisao que `conteudo/publicacao/publicar.ts` fez em BC-01, e e como o P4 se
cumpre sem fechar o sistema mais que o legado.

**O que esta tarefa achou e vale para as seguintes:**

- 🔴 **O descarte nao escreve a coluna de estado: ele atravessa o caminho de
  gravacao de BC-01.** `wp_trash_post()` chama `wp_update_post()` (`:4131`), que
  le a linha inteira, funde o pedido por cima e **delega a `wp_insert_post()`**
  (`:5335`, `:5367`, `:5392`). Logo descartar **reescreve `post_modified`**
  (`:4789`), **dispara os pontos de extensao da gravacao** (`save_post`,
  `post_updated`, a transicao para `trash`) e, para anexo, **desvia antes** para
  `wp_insert_attachment()` (`:5375`). Por isso a gravacao do estado e **porta**
  (`ConteudoNoDescarte.gravarEstado`) e nao um `UPDATE` montado neste modulo:
  montar o comando aqui criaria um segundo dono de `{site}posts`, perderia os
  pontos de extensao e deixaria `post_modified` parado.
- **Os marcadores sao gravados ANTES do estado, e a falha deixa o estado
  inconsistente de proposito.** Se `wp_update_post()` devolve `0`, o descarte
  devolve `false` (`:4138`) e os **dois marcadores ficam** no banco com o
  conteudo fora da lixeira. Nao ha transacao (BR-MIGRAR-104: zero
  `START TRANSACTION` em 1.467 arquivos), e esse e exatamente o estado que `R6`
  manda a coleta tolerar — **US-7 / T015**. Quem "consertar" isto com transacao
  apaga a historia.
- **O filtro `pre_trash_post` vem antes de toda escrita, e o valor dele E o
  retorno da funcao** (`:4111`-`:4114`): interceptado, nao sai marcador, nao sai
  estado, nao roda cascata e **nem a acao `wp_trash_post`** dispara.
- ⚠️ **O retorno carrega o estado ANTERIOR.** `return $post` (`:4155`) devolve o
  registro lido antes da gravacao: nada repassa `trash` ao objeto em memoria, e e
  por isso que a API REST reconsulta com `get_post( $id )`
  (`class-wp-rest-posts-controller.php:1171`). Reproduzido, com teste.
- **Sao duas leituras da mesma linha, e as duas sao do legado:** a superficie le
  (`wp-admin/post.php:253`) e `wp_trash_post()` le de novo (`:4089`). Com cache
  de objeto seriam menos; o cache fica **desligado nas duas metades** durante a
  coexistencia (borda 5 de `target_architecture.md`), e REQ-165 esta fora do
  pacote.
- **Os tres criterios de permissao sao um unico mecanismo, e ele ja existia.**
  CA-1.3, CA-1.4 e CA-1.5 sao tres ramos do `case 'delete_post'` de
  `map_meta_cap()`, portado em `plataforma/autorizacao/traducao-de-conteudo.ts`
  (T017 da feature `001`). Esta tarefa **pergunta** em lugar de reimplementar — e
  por isso o teste da versao anterior prova que a negacao vem da traducao, e nao
  de uma guarda local: nem o super administrador a vence.
- **A recusa do painel e o unico texto do legado que fala em lixeira.** A API e o
  XML-RPC dizem *"delete this post"*, e a API tem **dois** codigos de erro para o
  mesmo texto (`rest_cannot_delete` na guarda de rota, `rest_user_cannot_delete_post`
  dentro da operacao). Os tres estao declarados em `permissao-de-descarte.ts`.

🔴 **O que T003 deliberadamente NAO fez, e onde a tarefa seguinte encaixa:** os
dois pontos que a operacao **chama** sao campos obrigatorios do contexto, na
posicao exata do fluxo, e a posicao esta afirmada por teste.

| campo do contexto | o que e no legado | de quem e |
|---|---|---|
| `suspenderComentarios` | `wp_trash_post_comments( $post_id )` (`:4142`) | **T005** (US-2), neste modulo — **feito**, ligue-o com `cascataNoDescarte()` |
| `exclusaoDefinitiva` | `wp_delete_post( $post_id, true )` (`:4086`) | **T017** (US-8), neste modulo. O que a tela mostra antes dela e **T009**, feito; nenhuma confirmacao e pedida (CA-4.2) |

Ligar cada um e trocar o campo na composicao; **a ordem nao muda**. Eles sao
obrigatorios e nao opcionais de proposito: opcional, a ausencia seria um passo do
fluxo silenciosamente saltado, e nem o passo 5 de UC-09 nem a primeira linha de
`wp_trash_post()` sao opcionais no legado.
Os dois ja tem quem os preencha: `cascataNoDescarte()` (T005) e
`exclusaoDefinitivaDe()` (T017).

## O que T005 entrega, e so isso

> *o comportamento de US-2 existe e os criterios CA-2.1, CA-2.2, CA-2.3, CA-2.4
> passam contra o sistema novo*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T005

| arquivo | o que e | criterio |
|---|---|---|
| `cascata-de-comentarios/suspender-comentarios.ts` | `wp_trash_post_comments()` — os **oito** passos na ordem do legado | CA-2.1, CA-2.2 |
| `cascata-de-comentarios/restaurar-comentarios.ts` | `wp_untrash_post_comments()` — os **oito** passos na ordem do legado | CA-2.3 |
| `cascata-de-comentarios/estado-de-suspensao.ts` | `post-trashed`, e o vocabulario que a API de estado aceita | CA-2.4 |
| `cascata-de-comentarios/contexto-da-cascata.ts` | o que chega por argumento, e a **ausencia** de capacidade como declaracao | — |
| `cascata-de-comentarios/ligacao-com-o-descarte.ts` | o passo 11 de `wp_trash_post()`, preenchido | — |
| `armazenamento/comentarios-do-conteudo.ts` | os tres comandos crus sobre `{site}comments` | — |
| `cascata-de-comentarios/us-2-suspender-comentarios.test.ts` | as 21 afirmacoes de T005 | — |

As duas operacoes entraram na superficie do modulo (`suspenderComentarios` e
`restaurarComentarios`), e `modulo.test.ts` passou a congelar **oito** chaves.
`chaves-e-tabelas.ts` e `armazenamento/index.ts` ganharam a **terceira tabela**
desta feature, `{site}comments`.

**A declaracao de permissao destas duas operacoes e NENHUMA, e e declaracao e
nao esquecimento.** As duas funcoes do legado nao verificam capacidade, nao leem
o usuario corrente e sao **publicadas** — chamaveis direto por extensao e por
`wp_delete_post()`. Quem verifica e o chamador, com `delete_post` daquele
conteudo. O **P4** cobra *"declarar permissao explicita em toda operacao
exposta"* **e** *"preservar o default de cada camada, inclusive quando o default
e permissivo"*: a declaracao esta na interface do modulo e na secao de
`contexto-da-cascata.ts`, e e a mesma divisao que T003 fez entre `descartar` e
`descartarParaALixeira`. Por isso o contexto da cascata **nao tem `base` nem
`ator`**: a ausencia dos dois campos e a afirmacao.

**O que esta tarefa achou e vale para as seguintes:**

- 🔴 **A cascata nao usa a API de comentario, e a diferenca e grande.** As duas
  funcoes escrevem em `comment_approved` com `$wpdb` **direto**
  (`wp-includes/post.php:4302` e `:4367`), nao por `wp_set_comment_status()`.
  Logo **nada** do caminho de moderacao acontece: nem a acao
  `wp_set_comment_status` (`wp-includes/comment.php:2842`), nem a transicao
  `wp_transition_comment_status` (`:2844`), nem o recalculo de `comment_count`
  (`:2846`). Um porte "limpo" que passasse pela API emitiria **N** comandos em
  lugar de **um**, dispararia pontos de extensao que hoje nao disparam e
  recalcularia um contador que hoje fica parado — e o contador parado e
  comportamento declarado (`DB-TRG1`: o conteudo na lixeira continua contando os
  comentarios que acabaram de sair do ar). A tabela inteira esta em
  `armazenamento/comentarios-do-conteudo.ts`.
- **O numero de comandos e o resultado.** A suspensao e **um** `UPDATE` por
  conteudo (`:4302`); a restauracao e **um `UPDATE` por estado distinto**
  guardado (`:4367`) — nunca um por comentario. E o *"em cascata"* de CA-2.1 e o
  *"em lote por estado"* de CA-2.3, e e o que a area 3 da Decisao 2 compara.
- **O marcador agrupado e gravado ANTES do `UPDATE`** (`:4299` e `:4302`). Se
  fosse depois, o mapa guardado leria `post-trashed` para todo mundo e a memoria
  de CA-2.2 seria memoria de nada. E a razao de a leitura do `SELECT` existir
  separada da escrita.
- ⚠️ **Os quatro pontos de extensao sao acao, nenhum e filtro:** nada nesta
  cascata pode ser cancelado nem alterado por interceptador. Uma extensao
  consegue impedir o **descarte** (`pre_trash_post`) e **nao** consegue impedir
  que os comentarios o acompanhem.
- ⚠️ **As duas guardas estao em posicoes opostas em relacao a acao de abertura, e
  isso e observavel.** `trash_post_comments` dispara **antes** do `SELECT`
  (`:4286`), logo dispara tambem para conteudo **sem comentario nenhum** — caso
  em que nada e gravado (`:4290`). `untrash_post_comments` dispara **depois** da
  guarda (`:4342` e `:4353`), logo **nao** dispara para conteudo sem memoria
  gravada. Um porte que "regularizasse" a assimetria mudaria o que a extensao ve
  nos dois casos.
- ⚠️ **O retorno de `wp_untrash_post_comments()` esta invertido em relacao a
  intuicao:** o caminho **sem memoria** devolve `true` (`:4343`) e o caminho que
  fez todo o trabalho devolve `null` (`:4383`). Nenhum chamador do nucleo le o
  valor, e ele fica reproduzido porque e observavel por extensao (P8).
- **`post-trashed` guardado vira `'0'`, e o grupo continua sendo o do estado
  original.** O legado comenta a linha com *"Confidence check. This shouldn't
  happen."* (`:4362`) e **acontece**: basta chamar a suspensao duas vezes. A
  troca e do **valor escrito**, nao da chave de agrupamento, logo um marcador com
  `post-trashed` **e** com `'0'` emite **dois** `UPDATE` que gravam o mesmo
  `'0'`. Agrupar pelo valor ja trocado emitiria um comando so.
- **A memoria do comentario e usada; a do conteudo nao.** UC-10 nomeia a
  assimetria: *"os comentarios voltam melhor do que o conteudo"*. O conteudo volta
  como **rascunho** (`R2`, T007) embora o estado anterior esteja gravado; o
  comentario volta ao estado que tinha. Duas decisoes opostas sobre a mesma
  memoria, no mesmo fluxo.
- **A ordem do `SELECT` sem `ORDER BY` viaja ate os bytes.** `:4288` nao ordena, e
  a ordem das linhas e a ordem das entradas do marcador e, por consequencia, a
  ordem dos lotes da restauracao. Acrescentar um `ORDER BY` *"para estabilizar"*
  mudaria os bytes gravados.
- **A cascata nao pergunta se o conteudo esta na lixeira.** Ela le o registro e
  usa dele so o `ID` (`:4277` e `:4338`): chamada sobre conteudo publicado,
  suspende os comentarios dele do mesmo jeito. E superficie publicada, e e assim
  que `wp_delete_post()` a usa.

## O que T007 entrega, e so isso

**T007** — *"o comportamento de US-3 existe e os criterios CA-3.1, CA-3.2, CA-3.3,
CA-3.4, CA-3.5 passam contra o sistema novo"*.

| arquivo | o que e | criterio |
|---|---|---|
| `restauracao/restaurar-da-lixeira.ts` | `restaurar`, a acao `untrash`, e `restaurarDaLixeira`, que e `wp_untrash_post()` — os treze passos na ordem do legado | CA-3.3, CA-3.4 |
| `restauracao/estado-na-restauracao.ts` | `draft`, `inherit`, e `wp_untrash_post_set_previous_status()` | CA-3.1, CA-3.2 |
| `restauracao/permissao-de-restauracao.ts` | `delete_post`, as quatro superficies e os textos delas | CA-3.5 |
| `restauracao/contexto-de-restauracao.ts` | o que chega por argumento, e os quatro pontos de extensao | — |
| `cascata-de-comentarios/ligacao-com-a-restauracao.ts` | o passo 12 preenchido com a cascata de T005 | — |
| `restauracao/us-3-restaurar-conteudo.test.ts` | as 24 afirmacoes de T007 | — |

A operacao entrou na superficie do modulo (`restaurar`), com a declaracao de
permissao que o **P4** cobra, e `modulo.test.ts` passou a congelar **onze** chaves.
O nome dos tipos leva *"do conteudo"* porque `ResultadoDaRestauracao` ja e o da
cascata, e `export *` de dois barris com o mesmo nome o esconderia sem erro.

**De onde veio a leitura do legado.** `~/Downloads/wordpress` nao existe na
maquina em que T007 rodou, e nao ha PHP nem Docker. A leitura foi feita na arvore
da etiqueta `7.1.2` de `github.com/WordPress/WordPress`, conferida por
`version.php` (`$wp_version` 7.1.2, `$wp_db_version` 61833) e pelas ancoras que
este modulo ja citava. A execucao contra o oraculo de `scripts/oraculo` **nao
foi feita**.

**O que esta tarefa achou e vale para as seguintes:**

- 🔴 **A ordem de UC-10 nao e a do legado, e ficou a do legado.** O fluxo principal
  numera *"grava o status"* antes de *"apaga os metadados"*; o legado apaga em
  `wp-includes/post.php:4228`-`:4229` e grava em `:4231`. Nenhuma decisao humana
  fala da ordem, logo vale o **P1**, e a sequencia esta afirmada por teste.
- 🔴 **Falha de gravacao prende o conteudo na lixeira.** Com os marcadores ja
  apagados e sem transacao, o conteudo fica em `trash` sem `_wp_trash_meta_time`:
  a coleta varre por esse marcador e nunca mais o alcanca. A permissao do autor
  tambem cai para `delete_posts`. Os comentarios ficam `post-trashed` e a memoria
  deles fica gravada. E o inverso da falha do descarte, que sobra marcador, e
  **nao** e o estado que `R6` tolera: T015 nao passa por aqui.
- 🔴 **O sufixo `__trashed` nao tem dono.** `wp_insert_post()` acrescenta o sufixo
  ao identificador de URL no descarte (`:4903`), guarda o original em
  `_wp_desired_post_slug` (`:8621`) e os devolve na restauracao (`:4874`-`:4881`).
  `conteudo/gravacao/gravar.ts` deixa o passo para *"feature 005"* e `tasks.md`
  desta feature nao o recebe em tarefa nenhuma: T003 e T007 tratam a gravacao como
  porta de BC-01. Enquanto ninguem o portar, descartar **nao** libera o
  identificador e restaurar nao apaga esse metadado — que CA-3.3 pode ou nao
  incluir em *"os dados de descarte"*. T007 nao alargou para dentro de BC-01: o
  contrato esta escrito em `ConteudoNaRestauracao.gravarEstado`, e a decisao de
  onde ele mora e de quem abre tarefa.
- ⚠️ **O "Desfazer" devolve o estado anterior.** `R2` e default: `wp-admin/edit.php:151`
  pendura `wp_untrash_post_set_previous_status()` no filtro quando `doaction=undo`.
  A superficie da midia nao faz isso (`wp-admin/upload.php:312`), e o anexo
  "desfeito" volta `inherit`. O alvo oferece `estadoAnteriorNaRestauracao`; a tela
  que a pendura nao existe nesta arvore.
- ⚠️ **CA-3.5 vale para o conteudo do proprio ator.** Para o alheio o legado nao
  le o marcador, e publicado de outra pessoa exige so `delete_others_posts` na
  lixeira. Esta afirmado por teste, e e o limite que UT-049-6 e UT-049-8 precisam
  respeitar.
- ⚠️ **Sem o marcador agrupado os comentarios nao voltam.** A regra de US-2 *"volta
  para a fila de moderacao"* e a do valor guardado `post-trashed` (`:4363`); sem
  marcador nenhum, a cascata para em `:4342` e eles continuam `post-trashed` num
  conteudo ja em rascunho.
- **A acao `untrash` nao tem a trava de edicao** que a acao `trash` tem
  (`wp-admin/post.php:265`). A API REST e o XML-RPC nao chamam `wp_untrash_post()`:
  os quatro chamadores estao no painel, e a tabela esta em
  `restauracao/permissao-de-restauracao.ts`.

## A contagem que T005 encontrou e nao decidiu: os "dois estados"

> **Decidido em 01/11/2026 (delegado pelo dono do produto):** a regra se corrige
> para *"um estado"*. Specs 005 e 007, UC-16 e o catalogo (UT-048-5, BR3) foram
> ajustados; o `_discovery/discovery.md` ficou como estava (arquivo do Discover,
> travado por hash). O texto abaixo e o historico de por que.

US-2 carrega a regra de negocio *"Dois estados de comentario nao sao alcancaveis
pela API de status"*, e **a fonte dela nomeia um**:

> *"Dois estados nao sao alcancaveis pela API de status (state-machines.md secao
> 2)"*
> — `.specify/use-cases/UC-16-moderar-a-fila-de-comentarios.md:94`

> *"Estado pedido fora dos **quatro** aceitos | `wp_set_comment_status()` devolve
> falso. **`post-trashed`** so e gravado pela cascata de lixeira do conteudo,
> nunca pela interface"*
> — o mesmo arquivo, `:81`

A secao 2 de `state-machines.md`, no espolio da reversa, repete o titulo e nomeia
na evidencia **um** estado so: `post-trashed`. A maquina daquela secao tem
**cinco** estados (`'0'`, `'1'`, `spam`, `trash`,
`post-trashed`) e o `switch` aceita **quatro** deles: o censo fecha em **um**
inalcancavel, nao dois. O titulo e a evidencia que ele cita discordam, e o
catalogo herdou o titulo — UT-048-5 pede *"cada um dos **dois** estados
inalcancaveis ... os dois pedidos sao recusados"* (`backlog/tests.md:749`) **sem
dizer quais**.

**T005 nao escolheu o segundo nome, e nao precisou.** CA-2.4, que e o criterio
desta tarefa, fala de **um** estado — *"esse estado de suspensao"* — e esta
satisfeito: `estadoAceitoPelaApiDeEstado( 'post-trashed' )` devolve `null`. E o
mecanismo reproduzido e o do legado, que **nao e uma lista de nomes proibidos**:
e o complemento de uma lista de seis nomes aceitos, logo qualquer nome fora dela
cai no mesmo `default`. Nesse sentido os "dois" sao recusados, e tambem os
duzentos.

🔴 **Quem esbarra nisto e T006**, que **transcreve** UT-048-5 e nao o reconstroi:
o caso pede dois nomes e o catalogo nao os da. Duas saidas, e **nenhuma e de quem
porta**: ou a regra se corrige para *"um estado"* — e o teste passa a pedir um —,
ou quem a escreveu nomeia o segundo. Escolher um nome aqui seria inventar
comportamento, e o **P1** poe o comportamento observavel como especificacao: o
observavel e o `switch`, e ele esta portado inteiro em
`cascata-de-comentarios/estado-de-suspensao.ts`.

## O que T009 entrega

> *"o comportamento de US-4 existe e os criterios CA-4.1, CA-4.2, CA-4.3, CA-4.4
> passam contra o sistema novo"*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T009

| criterio | estado | onde esta |
|---|---|---|
| **CA-4.1** o pedido de descarte apaga em definitivo | **feito** | o efeito em `descarte/descartar-para-a-lixeira.ts` (passo 1, desde T003); a **pergunta** em `descarte/lixeira-desligada.ts` |
| **CA-4.2** nenhuma confirmacao e pedida ao ator | **feito** | `descarte/aviso-de-exclusao-definitiva.ts`, caixa de DECISAO e `CONFIRMACAO_PEDIDA_AO_ATOR` |
| **CA-4.3** a diferenca e visivel na tela antes da acao | **feito** | `descarte/acoes-de-descarte-na-tela.ts` |
| **CA-4.4** a tela nao oferece acao de restaurar | **feito** | `descarte/acoes-de-descarte-na-tela.ts` |

| arquivo | o que e |
|---|---|
| `descarte/lixeira-desligada.ts` | a pergunta *"ha lixeira?"* nas **tres** formas do legado, e a divergencia entre elas |
| `descarte/acoes-de-descarte-na-tela.ts` | os **seis** rotulos, os tres `aria-label`, a acao da rota, o `nonce` e os quatro pontos de extensao que reescrevem a lista |
| `descarte/aviso-de-exclusao-definitiva.ts` | o que cada superficie diz ao ator, a recusa de `501` da API e a **ausencia que CA-4.2 afirma** |
| `descarte/us-4-aviso-de-exclusao-definitiva.test.ts` | as 23 afirmacoes de T009 |

A superficie do modulo ganhou `avisoDeExclusaoDefinitiva`, e `modulo.test.ts`
passou a congelar **seis** chaves. **Nao e operacao**: e contrato de tela e de
API, e a capacidade que o governa e a **mesma** de `descartar` — `delete_post`
daquele registro —, recebida **respondida** no campo `podeApagar`, porque no
legado as tres superficies do painel ja estao dentro de
`current_user_can( 'delete_post', $post->ID )`
(`wp-admin/includes/meta-boxes.php:363`, `class-wp-posts-list-table.php:1613`) e
`get_delete_post_link()` pergunta **de novo** por conta propria, devolvendo
`null` a quem nao pode (`wp-includes/link-template.php:1573`).

**O que esta tarefa achou e vale para as seguintes:**

- 🔴 **A pergunta *"ha lixeira?"* nao tem uma forma so, e as formas nao
  concordam.** O censo de `EMPTY_TRASH_DAYS` na arvore da **36** linhas em
  **18** arquivos, e as decisoes usam tres formas: `! EMPTY_TRASH_DAYS` (o
  descarte, o endereco da acao, os rotulos do painel, o comentario, a midia),
  `EMPTY_TRASH_DAYS` verdadeiro (o desvio de `wp_delete_post()`, o anexo com
  `MEDIA_TRASH`) e **`EMPTY_TRASH_DAYS > 0`**, que existe **so na API REST**
  (`class-wp-rest-posts-controller.php:1099` e a gemea de comentario em
  `class-wp-rest-comments-controller.php:1083`). Com `EMPTY_TRASH_DAYS = -1` o
  painel **descarta** e a API **recusa o mesmo registro** com `501`. Esta
  afirmado por teste, e e divergencia observavel na area 1 da Decisao 2 (saida
  da REST, byte a byte, zero tolerancia).
- **CA-4.3 e verdadeiro, e UC-09 erra ao dizer que *"nada na tela distingue os
  dois"*.** O rotulo, a acao da rota e o `nonce` **todos** mudam antes da acao:
  `Move to Trash`/`Delete permanently` no editor (`meta-boxes.php:367` e
  `:365`), `Trash`/`Delete Permanently` na linha
  (`class-wp-posts-list-table.php:1628` e `:1638`), e
  `action=trash`/`action=delete` com o `nonce` correspondente
  (`link-template.php:1577` e `:1590`). **O que UC-09 acerta e a outra metade
  da frase** — *"o ator nao e avisado da diferenca"* —, e e essa metade que
  CA-4.2 afirma.
- ⚠️ **`Delete permanently` e `Delete Permanently` sao duas chaves de catalogo**,
  e a diferenca e a caixa do P: o editor e a acao em massa usam a minuscula, a
  acao da linha usa a maiuscula. `Trash` na linha e `_x( 'Trash', 'verb' )` — uma
  terceira chave, com contexto de desambiguacao. Unificar os seis rotulos em tres
  perderia traducao e mudaria o texto de uma das telas (`EC-05`, e a secao 4 de
  `target_screens.md` cobra `diff` de string **zero**).
- **CA-4.4 e verdadeiro por CONSEQUENCIA, nao por regra, e o porte reproduz o
  mecanismo.** Nenhuma superficie le o prazo para decidir se oferece restaurar:
  a linha olha `'trash' === $post->post_status`
  (`class-wp-posts-list-table.php:1614`), a acao em massa olha a **visao**
  (`:437`), a barra de estados olha a **contagem** (`:369`) e o editor **nunca**
  oferece restaurar porque a tela de um registro em `trash` nem abre
  (`wp-admin/post.php:154`, `409`). Com a lixeira desligada nada chega a `trash`,
  logo nada oferece restaurar. **Esconder o `Restore` testando a constante
  fecharia um caminho que o legado deixa aberto** numa instalacao que ja tinha
  conteudo na lixeira quando o prazo foi zerado.
- **`forcar` e OR, nao AND** (`link-template.php:1577`): a linha pede exclusao
  forcada **mesmo com a lixeira ligada** (`:1635`), e e assim que um registro que
  **esta** na lixeira se apaga de vez. Trocar por `&&` esconderia essa acao em
  toda instalacao com lixeira.
- **A API e a unica superficie que para antes de apagar, e nao para por
  irreversibilidade:** ela recusa o `DELETE` **sem** `force` com `501` e *"The
  post does not support trashing. Set 'force=true' to delete."*
  (`class-wp-rest-posts-controller.php:1148`-`:1154`) — texto que **ensina o
  parametro** e nao fala em "nao tem volta". Repetido com `force=true`, o pedido
  apaga **sem nenhuma mensagem** (`:1136`). E o mais perto que o legado chega de
  uma confirmacao sem ser uma.
- **O filtro `rest_{tipo}_trashable` decide nos dois sentidos** (`:1123`), e o
  bloco de documentacao do legado e literal: *"Pass false to disable Trash
  support for the post"*. Passar `true` **liga** a lixeira na API de uma
  instalacao com prazo zero — e ai o `DELETE` sem `force` chama
  `wp_trash_post()`, que apaga em definitivo na primeira linha. O **P2** manda
  preservar inclusive essa capacidade de alterar o resultado.
- ⚠️ **Com a lixeira desligada, o gancho `wp_trash_post` nunca dispara.** A
  primeira linha devolve antes dele (`post.php:4085`), e uma extensao que
  auditasse exclusao por esse gancho perderia **todas** as exclusoes de uma
  instalacao sem lixeira. Afirmado por teste.

🔴 **O que T009 deliberadamente NAO fez:**

- **Nao declarou `MEDIA_TRASH`.** A conjuncao `EMPTY_TRASH_DAYS && MEDIA_TRASH`
  (`post.php:6829`, `meta-boxes.php:470`,
  `class-wp-rest-posts-controller.php:1102`) e o descarte de **anexo**, decidido
  pela **resposta 9** (REQ-051 `bloqueado`). Numero que entra antes da tarefa
  dele entra sem o teste de borda que o **P6** cobra.
- **Nao tocou no destino do comentario proibido.** O risco 2 de `plan.md` —
  *"desligar a lixeira muda o destino do comentario proibido, que vai para spam
  em vez de para a lixeira"* — e a linha
  `$approved = EMPTY_TRASH_DAYS ? 'trash' : 'spam'` (`comment.php:1392`), que e
  de BC-03 e da feature `007`. Fica a ancora para quem a portar.
- **Nao montou HTML.** `DEV-001` poe as 113 telas em `raw-prose`, e a moldura do
  painel e de BC-10 (`telas-do-painel`): o que este modulo entrega e campo,
  rotulo, acao e `nonce` — montar o `<a>` e da borda.
- **Nao implementou a exclusao definitiva.** Ela continua chegando pelo contexto
  (`exclusaoDefinitiva`), e a cascata com reparenteamento e **T017**.

**E ha uma ancora que T011 vai querer, e foi esta tarefa que a achou:** existe uma
**segunda** aritmetica de instante limite no legado, fora de
`wp-includes/functions.php:6977` — `wp-admin/includes/nav-menu.php:1375` repete
`time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )` para os itens de menu orfaos. Nao
e desta feature, mas quem portar a coleta vai procurar por *"a"* coleta e achar
**duas**.

## A decisao sobre CA-4.2

T009 parou porque **CA-4.2** e `UT-050-2` pediam uma confirmacao dizendo que a
acao nao tem volta, e **UC-09**, fluxo *Lixeira desligada*, afirma o oposto:
*"apagar passa a ser irreversivel, e o ator nao e avisado da diferenca"*.

**Decisao humana registrada em 2026-10-29:** *"Siga o codigo do legado: no caminho
de conteudo nao ha confirmacao nenhuma ao apagar com a lixeira desligada (UC-09,
Lixeira desligada)."* `spec.md` e `backlog/tests.md` foram alinhados a ela, e
CA-4.2 passou a afirmar a ausencia. **O censo, conferido na arvore 7.1.2:**

| o que foi procurado | resultado |
|---|---|
| quem chama `showNotice.warn()` (`wp-admin/js/common.js:548`) | midia, sob `MEDIA_TRASH`: `wp-admin/includes/meta-boxes.php:477`, `wp-admin/includes/class-wp-media-list-table.php:835`; a acao em massa de midia, `wp-admin/js/media.js:197`; e a exclusao de termo, `wp-admin/js/tags.js:29` e `:168`. **Nenhum e de conteudo, e nenhum le `EMPTY_TRASH_DAYS`** |
| `onclick` nos links de conteudo | **nenhum**: `meta-boxes.php:370` (editor), `class-wp-posts-list-table.php:1623` e `:1633` (linha) sao links secos |
| ouvinte de `a.submitdelete` em `.js` do painel | **um**, e ele **nao confirma**: `wp-admin/js/post.js:352` so cancela o clique em botao `disabled` (`:355`), e com `submitdelete` devolve sem fazer mais nada (`:360`) |
| confirmacao na acao em massa de conteudo | **nenhuma** |
| o legado sabe confirmar nessa caixa? | **sim** — a tela de link herdada poe `onclick="return confirm( ... )"` no proprio `submitdelete` (`meta-boxes.php:1137`) |
| *"This action cannot be undone"* em `confirm` do painel | em `showNotice.warn()` e na revogacao de senha de aplicacao (`wp-admin/js/application-passwords.js:85` e `:116`) |

Ou seja: a ausencia no conteudo **nao e limitacao tecnica**, e o produto.

⚠️ **O editor de blocos fica fora das cinco superficies de
`CONFIRMACAO_PEDIDA_AO_ATOR`.** Ele pergunta *"Are you sure you want to move "%s"
to the trash?"* com lixeira ou sem (`wp-includes/js/dist/editor.js:28705` e
`:89034`), e esse dialogo nao fala em irreversibilidade. O pedido que segue e um
`DELETE` sem `force` (`:79029`), que a API recusa com `501` quando o prazo e zero:
nada se apaga, salvo com `rest_{tipo}_trashable` ligado por extensao. Esse lado
cliente e dependencia externa adotada como esta (Lacuna 2 de
`pending_decisions.md`), nao deste porte.

⚠️ **E a mesma leitura derruba meia frase de BR-MIGRAR-032 e da resposta 9.** As
duas dizem que apagar midia e *"definitivo, sem lixeira e sem aviso"*. **Sem
lixeira, sim; sem aviso, nao**: `showNotice.warn()` confirma a exclusao de midia.
A contradicao e de REQ-051, que esta `bloqueado`, e fica registrada aqui porque
foi esta tarefa que a encontrou.

## O que T017 entrega, e so isso

> *o comportamento de US-8 existe e os criterios CA-8.1, CA-8.2, CA-8.3, CA-8.4
> passam contra o sistema novo*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T017

| arquivo | o que e |
|---|---|
| `exclusao/apagar-em-definitivo.ts` | a operacao, e `wp_delete_post()` — tres desvios, **sete etapas** e um `DELETE` |
| `exclusao/reposicionamento-no-avo.ts` | CA-8.1, CA-8.2 e o **censo de CA-8.4** |
| `exclusao/comandos-da-exclusao.ts` | os nove comandos crus da cascata, sobre `{site}posts`, `{site}comments` e `{site}postmeta` |
| `exclusao/contexto-de-exclusao.ts` | o que chega por argumento, de quem cada peca e, e os **oito** pontos de extensao |
| `exclusao/permissao-de-exclusao.ts` | `delete_post` — **a mesma** capacidade do descarte — e os textos proprios da acao `delete` |
| `exclusao/us-8-reparentar-filhos-e-anexos.test.ts` | as 26 afirmacoes de T017 |

A operacao entrou na superficie do modulo (`apagarEmDefinitivo`), com a
declaracao de permissao que o **P4** cobra, e `modulo.test.ts` passou a congelar
**nove** chaves — a de T017 somada as duas operacoes de T005, que entraram em
paralelo. `armazenamento/chaves-e-tabelas.ts` ganhou `tabelaDeConteudo` — a
`tabelaDeComentarios` ja tinha entrado com T005 —, porque aquele arquivo declara
que *"nenhum nome de tabela e montado fora dele"* e esta e a primeira tarefa deste
modulo que monta comando sobre `{site}posts`.

**Pasta propria, e nao dentro de `descarte/`.** As duas areas sao duas funcoes do
legado que **chamam uma a outra** e cada uma tem o seu mundo: `wp_trash_post()`
nao monta SQL nenhum, `wp_delete_post()` monta nove comandos crus e tem oito
pontos de extensao proprios. O ciclo nao virou `import` circular — daqui para
`descarte/` ha `import`, e de la para ca ha o **campo de contexto** que T003
declarou (`exclusaoDefinitiva`), fechado por `exclusaoDefinitivaDe()`. **A
recursao nao se fecha em laco**: o desvio de `:3851` exige lixeira **ligada** e o
de `:4085` exige lixeira **desligada**, e nenhuma instalacao satisfaz os dois —
ha teste para as duas direcoes.

**O que esta tarefa achou e vale para as seguintes:**

- 🔴 **`wp_delete_post()` fala com o banco direto, e o descarte nao.** T003
  registrou que o descarte atravessa o caminho de gravacao de BC-01
  (`wp_update_post()`); esta cascata e o oposto — `$wpdb->update()` cru nos dois
  reposicionamentos (`:3908`, `:3923`) e `$wpdb->delete()` cru na linha
  (`:3969`). Reproduzir o reposicionamento por `wp_update_post()` trocaria **um**
  comando por uma travessia por filho, com `post_modified` reescrito e
  `save_post` disparando em cada um.
- **Os dois reposicionamentos sao o mesmo `UPDATE` com tres diferencas, e a do
  meio e a que se perde:** os filhos tem `SELECT` antes e o `UPDATE` **so sai se
  houver filho** (`:3907`); os anexos **nao tem leitura nem condicao de tipo** —
  o `UPDATE` sai sempre, afetando zero linha quando nao ha anexo. "Zero linha com
  comando emitido" e "comando nao emitido" sao estados diferentes, e a area 3 da
  Decisao 2 compara a sequencia.
- **A etapa das versoes e recursiva, e passa pela mesma funcao.** O legado o diz
  na linha de cima (*"Use wp_delete_post (via wp_delete_post_revision) again"*,
  `:3917`): cada versao roda as sete etapas dela, **inclusive o `UPDATE` de
  anexos**. Um porte que apagasse as versoes com um `DELETE ... WHERE post_parent
  = ? AND post_type = 'revision'` emitiria um comando no lugar de dezenas e
  deixaria o metadado das versoes orfao.
- **O `DELETE` da linha e o oitavo comando, e quando ele falha as sete etapas
  ficam.** Nao ha transacao (BR-MIGRAR-104: zero `START TRANSACTION` em 1.467
  arquivos), nada e desfeito e os tres ultimos pontos de extensao nao disparam
  (`:3970`). E o cenario `@critico` de PT-003 sobre o estado parcial, e ha teste
  que afirma o banco nesse ponto.
- **A capacidade e a mesma do descarte, e isso nao e economia:** as acoes
  `trash`, `untrash` e `delete` do painel perguntam `delete_post` do mesmo objeto
  (`wp-admin/post.php:261`, `:299`, `:328`). **Nao existe capacidade de exclusao
  definitiva no legado** — e e por isso que US-4 e historia de **tela**: a
  diferenca entre os dois pedidos e o rotulo, a acao da rota e o `nonce`, nunca a
  autorizacao. Ha teste que afirma a igualdade das duas constantes.
- ⚠️ **O XML-RPC pede exclusao e recebe lixeira.** `wp.deletePost` chama
  `wp_delete_post( $post_id )` **sem forca**
  (`class-wp-xmlrpc-server.php:1886`), logo com a lixeira ligada o registro vai
  para `trash` e o cliente recebe `true`. E por isso que `PedidoDeExclusao.forcar`
  e obrigatorio: um default esconderia a unica superficie em que o nome da
  operacao e o desfecho dela nao coincidem.
- ⚠️ **A lista de tipos que desviam para a lixeira e literal e fechada**:
  `'post'` e `'page'` (`:3852`). Tipo de terceiro pedido sem forca vai **direto**
  para a exclusao definitiva, mesmo aparecendo na lixeira do painel.
- **A ordem decrescente dos comentarios e observavel.** `ORDER BY comment_ID
  DESC` (`:3929`) apaga as respostas antes das perguntas, e como
  `wp_delete_comment()` reposiciona as respostas de quem ela apaga
  (`wp-includes/comment.php:1590`), trocar para `ASC` mudaria os `UPDATE` que
  aquela funcao emite.
- **A contagem de comentarios e adiada em volta da etapa 6** (`:3925`, `:3935`):
  sem o par, apagar um conteudo com 500 comentarios emitiria 500 recalculos de
  `comment_count`, o ultimo deles sobre uma linha que o passo seguinte apaga.
- 🔴 **O nucleo registra SETE escutas nos pontos desta funcao, e nenhuma roda
  aqui.** Tres delas mudam dado observavel: a que zera `page_on_front` /
  `page_for_posts` (`default-filters.php:593`), a que zera
  `wp_page_for_privacy_policy` (`:594`) e a que apaga o item de menu que aponta
  para o conteudo (`:472`). Sem o barramento — REQ-162, em `do-not-rewrite.md` —
  o alvo deixa pendurado o que o legado desfaz. Os pontos estao **emitidos na
  posicao exata**, com os nomes e os argumentos do legado, para que ligar o
  barramento feche os tres de uma vez; o censo esta em
  `exclusao/contexto-de-exclusao.ts`.

🔴 **O que T017 deliberadamente NAO fez:** apagar **midia** (o desvio de `:3858`
delega a BC-06, e a **resposta 9** ja decidiu que e definitivo, sem lixeira e sem
aviso), recalcular os tres contadores desnormalizados (`DB-TRG1`, `DB-TRG2`, que
vem de dentro das colaboracoes de BC-02 e BC-03), limpar cache (nao existe nesta
arvore) e **avisar o ator** — nenhuma confirmacao e pedida no caminho de conteudo
(CA-4.2).

## O limite de CA-8.4

**O criterio:** *"Nenhum registro fica apontando para um conteudo que nao existe
mais"*.

**Ele vale, e esta afirmado por teste, para tudo o que a cascata cobre.** No
cenario de US-8 — uma pagina com filha, anexo, versao, comentarios, metadado e
termos —, depois de `wp_delete_post()` nenhuma das quatro tabelas tem linha
apontando para o identificador apagado: a filha e o anexo foram para a **avo**, a
versao e o metadado dela sumiram, os comentarios e o metadado foram apagados e os
vinculos de termo removidos.

**O que ele nao pode significar e "o legado nao deixa vinculo pendurado em
nenhum caso", porque deixa — e por escolha registrada.** Tres documentos do
pacote poem o orfao **dentro** do que a paridade compara:

- o **P5** manda que o teste da cascata afirme *"o conjunto exato do que sumiu e
  do que permaneceu, **inclusive o que permaneceu orfao**"*;
- a **Decisao 2** de `pending_decisions.md` descreve a area *"efeito no banco"*
  como *"a cascata de exclusao das 7 etapas **e os orfaos que o legado deixa de
  proposito**"*;
- **PT-003** repete a frase no cabecalho (`area_da_decisao_2`) e em dois
  cenarios.

O censo, lido na arvore — os dois primeiros sao comportamento do legado e estao
reproduzidos **com teste que afirma o orfao**; o terceiro e da etapa de BC-02:

| # | caso | por que o vinculo sobrevive | ancora |
|---|---|---|---|
| 1 | **filho de outro tipo** | o `SELECT` e o `UPDATE` filtram `post_type = $post->post_type` | `:3900`, `:3908` |
| 2 | **filho de tipo nao hierarquico** | o bloco inteiro e saltado, e `post_parent` e gravavel em **qualquer** tipo | `:3897`, `:4845` |
| 3 | **vinculo de termo de taxonomia nao registrada no tipo** | o conjunto removido e `get_object_taxonomies( $post->post_type )` | `:3892` |

E um **quarto grupo, que nao e do legado**: as tres escutas do nucleo que mudam
dado e nao rodam sem o barramento (opcao da pagina inicial, opcao da politica de
privacidade, item de menu). E **lacuna declarada do alvo**, nao paridade.

**Nada disso e decisao desta tarefa, e nenhuma delas foi tomada aqui.** Fechar
qualquer um dos tres primeiros casos seria acrescentar limpeza que o legado nao
tem — a linha *"declarar restricao no armazenamento que mude a cascata
observavel"* da tabela *Nao negociavel*, que e o **P5** inteiro. O que T017 fez
foi reproduzir a cascata, afirmar o criterio no cenario que ele descreve e
**escrever o limite** com `arquivo:linha`, para que quem revisar o ledger saiba o
que *"CA-8.4 passa"* quer dizer: passa no escopo da cascata, e nao como
invariante universal do banco. Se alguem quiser a invariante universal, e card
novo e e decisao humana — ela muda o produto.

## O que T011 entrega, e so isso

> *o comportamento de US-5 existe e os criterios CA-5.1, CA-5.2, CA-5.3, CA-5.4,
> CA-5.5 passam contra o sistema novo*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T011

🔴 **Tres dos cinco criterios passam. Dois nao, e nao por falta de trabalho:**

| criterio | estado |
|---|---|
| **CA-5.2** apaga o conteudo vencido | **fechado** |
| **CA-5.3** apaga o comentario pelo mesmo criterio | **fechado** |
| **CA-5.4** retomada sem apagar duas vezes nem saltar registro | **fechado** |
| **CA-5.1** o agendamento existe sem visita ao painel | 🔴 **conflito aberto, nao resolvido** |
| **CA-5.5** cada execucao registra quantos apagou | 🔴 **pela metade, de proposito** |

| arquivo | o que e |
|---|---|
| `coleta/coletar-a-lixeira-vencida.ts` | a operacao, e `wp_scheduled_delete()` — os **nove** passos na ordem do legado |
| `coleta/varredura-do-vencido.ts` | as duas consultas do prazo, com o `<` **estritamente** menor |
| `coleta/contexto-de-coleta.ts` | o que chega por argumento, e de quem cada peca e — **sem ator** |
| `coleta/agendamento-da-coleta.ts` | 🔴 o **corpo** do registro do evento, que **ninguem chama** |
| `coleta/us-5-coletar-a-lixeira-vencida.test.ts` | as 23 afirmacoes de T011 |

A operacao entrou na superficie do modulo (`coletarALixeiraVencida`), com a
declaracao de permissao que o **P4** cobra — **nenhuma** —, e `modulo.test.ts`
passou a congelar **dez** chaves — a de T011 somada as de T005, T009 e T017, que
entraram em paralelo. A restauracao do conteudo (T007) entrou depois, e fechou a
tabela *Contratos*.

### A permissao e NENHUMA, e e por isso que ela esta escrita

UC-11, campo *Autorizacao*: *"nenhuma. A coleta roda sem usuario autenticado e sem
verificacao de capacidade: **o prazo e a autorizacao**"*. Por isso
`ContextoDeColeta` **nao tem `base` nem `ator`**, ao contrario de
`ContextoDeDescarte`, e `us-5-...test.ts` afirma a ausencia das duas chaves. O
**P4** e literal sobre isso: a coleta e uma das operacoes que *"decidem acesso sem
consultar capacidade alguma"*, e *"uma matriz que ignore esses cinco descreve um
sistema mais fechado do que o real"*.

### O que esta tarefa achou e vale para as seguintes

- 🔴 **O ramo de tolerancia de `R6` e uma das duas pernas do `if` desta funcao, e
  nao ha onde mais ele caiba.** `wp_scheduled_delete()` e um `if`/`else` por
  registro (`wp-includes/functions.php:6989`): **ou** apaga so os dois
  marcadores, **ou** apaga o registro. Logo **CA-7.1 e CA-7.2 de US-7 passam por
  consequencia** desta tarefa. **CA-7.3** ficou para **T015**, ver *O que T015
  entrega*.
- ⚠️ **A ordem das duas exclusoes de marcador e INVERTIDA entre os dois lacos.**
  Conteudo: estado (`:6990`) e depois instante (`:6991`). Comentario: instante
  (`:7008`) e depois estado (`:7009`). Sao quatro comandos por registro
  (`SELECT meta_id` + `DELETE` em cada chamada), logo a assimetria aparece inteira
  na sequencia que a area 3 da Decisao 2 compara. Normalizar as duas ordens e
  divergencia sem referencia autorizada.
- **O relogio e lido UMA vez por execucao.** As duas varreduras comparam o
  **mesmo** instante limite (`:6977`). Uma coleta longa nao move a propria borda,
  e relê-lo entre os dois lacos mudaria o conjunto de comentarios apagados para a
  mesma entrada.
- ⚠️ **Os dois chamadores de exclusao recebem argumentos diferentes, e os dois
  importam.** `wp_delete_post( $post_id )` recebe o **identificador** (`:6993`) e
  `wp_delete_comment( $del_comment )` recebe o **registro** (`:7011`). E
  **nenhum dos dois passa forca**: a guarda que desviaria para a lixeira
  (`wp-includes/post.php:3851`, `wp-includes/comment.php:1574`) nao desvia porque
  o passo anterior ja confirmou `trash`. Por isso
  `ExclusaoDeConteudoNaColeta` e um tipo **distinto** de
  `ExclusaoDefinitivaNoDescarte` de T003, que e `wp_delete_post( $id, true )`,
  **com** forca — mesma funcao do legado, dois chamadores, dois contratos.
- **CA-5.4 nao precisou de mecanismo nenhum, e inventar um a quebraria.** A
  retomada e consequencia de **o marcador ser a fila**: a varredura olha
  `_wp_trash_meta_time`, e todo registro tratado perde o marcador — por dentro de
  `wp_delete_post()` (`wp-includes/post.php:3889`) ou pelo ramo de tolerancia.
  Logo a execucao seguinte varre exatamente o que falta. Esta funcao **nao guarda
  cursor, nao marca progresso e nao recebe ponto de partida**: cursor perdido na
  interrupcao salta registro, e cursor gravado fora de transacao (e nao ha
  transacao, BR-MIGRAR-104) apaga duas vezes.
- **Nao ha `try`/`catch`, e a falha no meio sobe.** O legado nao tem nenhum, e
  UC-11 registra o caso nas excecoes (*"a execucao e abandonada no meio"*).
  Envolver os lacos num `catch` que seguisse para o registro seguinte seria
  inventar resiliencia que o produto nao tem (**P7**).
- **Zero ponto de extensao nesta funcao.** `wp_scheduled_delete()` nao tem
  `apply_filters` nem `do_action`: nenhuma extensao observa, cancela ou altera a
  coleta. Os pontos que uma execucao dispara sao todos de **dentro** da exclusao
  definitiva, que e ligacao tardia. Acrescentar um gancho de coleta inventaria
  contrato publico que o legado nao tem — o erro que o **P2** proibe na direcao
  oposta.
- **A coleta NAO pergunta se a lixeira esta ligada.** Ela nao testa
  `EMPTY_TRASH_DAYS` por verdade, so o usa na aritmetica. Com o prazo em **zero** o
  limite cai no proprio agora e tudo que **ja estava** na lixeira vence; com prazo
  **negativo** o limite cai no **futuro** e tudo vence de imediato. Nenhuma guarda
  foi acrescentada, porque o legado nao tem nenhuma (P1).
- **A ordem dos dois lacos e observavel.** Conteudo primeiro, comentario depois:
  apagar um conteudo apaga os comentarios dele em cascata, logo o comentario que
  chega ao segundo laco e o que foi para a lixeira **por si**. Inverter os lacos
  mudaria qual exclusao emitiu qual cascata.

### 🔴 CA-5.1 — o que T011 fez, e o que deliberadamente nao fez

**Sao quatro registros humanos de um lado e um criterio de aceite do outro**, e a
constituicao poe *"resolver um dos conflitos entre card `wont` e resposta
humana"* na tabela do que nao se decide sozinho:

| lado | onde esta escrito |
|---|---|
| **a spec** | **CA-5.1**, e UT-052-6 / UT-052-7 em `backlog/tests.md` |
| **a analise** | **resposta 10** de `questions.md` · **ADR-0006** · **BR-MIGRAR-034** · a resposta da **Decisao 1** de `pending_decisions.md`, que poe *"agendador por requisicao ao proprio host, com a consequencia de que site sem visita nao limpa a propria lixeira"* na lista do que a escolha **nao afrouxa** · **PT-004**, cenario de abertura, `@critico` |

**O que T011 portou, porque os dois lados concordam nele letra por letra:** o
corpo de `wp-admin/admin.php:107`-`:109` —
`! wp_next_scheduled( 'wp_scheduled_delete' ) && ! wp_installing()`, entao
`wp_schedule_event( time(), 'daily', 'wp_scheduled_delete' )`. O nome do gancho, a
recorrencia, o instante do primeiro disparo e a guarda sao os mesmos se a chamada
ficar antes ou depois de `auth_redirect()`. **O que esta em disputa e so o ponto
de chamada**, e nenhum arquivo desta arvore chama `registrarAColeta()`.

Tres consequencias praticas, para quem vier:

1. `registrarAColeta` **nao** esta na superficie do modulo, de proposito:
   `modulo.test.ts` congela dez chaves e ela nao e uma delas. Poe-la ali diria
   que este modulo decide **quando** a coleta e agendada.
2. Quando a decisao chegar, ela e **uma linha** no ponto de entrada — nao uma
   reescrita deste modulo. ⚠️ E o ponto de entrada **nao existe nesta arvore**:
   nao ha `entradas/` e nao ha adaptador concreto.
3. ⚠️ **T013 nao deve copiar esta guarda de memoria.**
   `wp_scheduled_auto_draft_delete` e registrado em
   `wp-admin/includes/post.php:798`-`:799` com `! wp_next_scheduled( ... )` e
   **sem** `! wp_installing()`. A assimetria e do legado.

### 🔴 CA-5.5 — a contagem existe, o registro nao

`ResultadoDaColeta.registrosApagados` devolve quantos registros a coleta apagou,
como **valor de retorno**: nenhum comando sai para grava-lo, nenhum ramo da funcao
o le, e `us-5-...test.ts` afirma as duas coisas. E o que o **P7** permite —
*"registro e diagnostico novos podem ser acrescentados, mas nenhuma decisao do
sistema pode passar a depender deles"* —, e nao e divergencia observavel, porque
`wp_scheduled_delete()` devolve `void` e o barramento descarta retorno de acao
(`add_action( 'wp_scheduled_delete', 'wp_scheduled_delete' )`,
`wp-includes/default-filters.php:465`).

**O que nao foi feito e o registro persistido que a palavra "registra" pede.**
UC-11 e literal nas pos-condicoes: *"nenhum registro do que foi apagado foi
guardado"*. `spec.md` declara CA-5.5 como *"divergencia a ser aceita
explicitamente"*, essa aceitacao **nao existe**, e `ESC-RETENCAO`
(BR-MIGRAR-113) proibe inventar o prazo de retencao que o registro novo
precisaria — o que a constituicao poe, textualmente, na tabela do que exige
decisao humana (*"introduzir limite de taxa, prazo de retencao ou qualquer numero
que o legado nao tem"*). Gravar um aqui seria decidir no lugar de quem decide.

## O que T015 entrega

> *o comportamento de US-7 existe e os criterios CA-7.1, CA-7.2, CA-7.3 passam
> contra o sistema novo*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T015

| criterio | estado |
|---|---|
| **CA-7.1** so a marca e removida | **fechado**: o ramo veio de T011, e T015 o afirma por teste |
| **CA-7.2** a rotina segue | **fechado**, pelo mesmo caminho |
| **CA-7.3** cada inconsistencia registrada | **fechado no contrato**, com o limite abaixo |

| arquivo | o que e |
|---|---|
| `coleta/registro-de-inconsistencia.ts` | o evento de CA-7.3, so escrita, sobre a porta de `plataforma/registro-de-operacao` |
| `coleta/us-7-tolerar-estado-inconsistente.test.ts` | as 17 afirmacoes de T015 |

`coletarALixeiraVencida()` ganhou uma chamada em cada ramo de `R6`, e
`ContextoDeColeta` ganhou o campo **opcional** `registroDeInconsistencia`. A
superficie do modulo nao mudou: nao ha operacao nova.

- **O registro e so escrita, e ausente e o legado (P7).** Sem a colaboracao a
  coleta e identica, no resultado e na sequencia de comandos, e ha teste para a
  igualdade. Nenhum comando sai pela porta de dados por causa do evento. O desenho
  e o de CA-9.4 em `contextos/midia/envio/registro-de-envio-sem-filtro.ts`.
- **CA-7.3 nao e CA-5.5, apesar de T011 te-los posto na mesma familia.** `spec.md`
  lista CA-5.5 como divergencia a aceitar e **nao** lista CA-7.3, e a frase de
  UC-11 que pesa contra CA-5.5 fala do que foi **apagado**, e o registro
  inconsistente nao foi. CA-5.5 **continua** como T011 o deixou.
- **O evento sai depois dos dois marcadores.** E o que faz ele significar
  "tratada": interrompida entre os dois, a coleta nao escreveu nada, a varredura
  seguinte reencontra o registro (CA-5.4) e so entao o evento sai, uma vez.
- **O instante nao vem de `ContextoDeColeta.relogio`.** Aquele e lido **uma** vez
  e dele sai o instante limite; o evento quer milissegundos do momento do
  tratamento, e chega pela colaboracao.
- **O identificador zero nao gera evento.** O salto de `:6983` vem antes da guarda
  de `R6` e nao ha registro a identificar.
- **O evento leva `tipo`** (`post` ou `comment`), porque as duas tabelas numeram
  por conta propria, **e `estadoEncontrado`**, que e `null` quando a linha nao
  existe. Nenhum dado pessoal entra.

🔴 **O limite de CA-7.3:** o evento chega a `PortaDeCanal`, e o que acontece
depois nao existe ainda. **T003 da feature `015` esta aberta**, nao ha adaptador
do canal e a escolha da borda e o prazo de guarda sao os itens 1 e 3 de *O que
ninguem decidiu* de `plataforma/registro-de-operacao/README.md`. E como o campo e
opcional, **quem compuser a coleta tem de passar o canal**, ou nada e registrado,
como no legado. A severidade `'informativo'` tambem e provisoria e vive numa
constante so, porque a escala e trabalho da mesma T003.

## O conflito que T001 declarou e nao decidiu

`spec.md` registra, em *Perguntas em aberto*, duas decisoes humanas em sentidos
opostos sobre **quando** a coleta e agendada:

| lado | onde esta escrito | o que diz |
|---|---|---|
| a spec | **CA-5.1**, e UT-052-6 / UT-052-7 em `backlog/tests.md` | o agendamento existe numa instalacao nova, *"sem depender de ninguem ter entrado no painel"*, registrado *"no caminho publico, antes de qualquer exigencia de autenticacao"* |
| a analise | **resposta 10**, **ADR-0006**, BR-MIGRAR-034, PT-004 `@critico` | o registro fica **depois** de `auth_redirect()` (`wp-admin/admin.php:104`), e *"um site que ninguem administra nunca agenda sua propria limpeza"* e comportamento do produto |

A constituicao poe *"resolver um dos conflitos entre card `wont` e resposta
humana"* na tabela do que **nao** se decide sozinho, e o pacote declara que nao
escolhe. **T001 nao escolheu**, e fez tres coisas para que a escolha continue de
quem decide:

1. A porta da fila diz **como** se pede o agendamento, e nao diz **quem** pede nem
   **sob que condicao** — os dois lados do conflito sao chamadas validas dela.
2. O nome dos dois ganchos e a condicao que o legado usa
   (`! wp_next_scheduled( ... ) && ! wp_installing()`) estao escritos no cabecalho
   da porta, para que nenhuma das duas tarefas os invente.
3. `modulo.test.ts` afirma que **compor o modulo nao agenda nada**: se o esqueleto
   agendasse a coleta ao ser criado, ele teria decidido o conflito por omissao.

**T011 esbarrou nisso, e nao escolheu.** Construir CA-5.1 como esta escrita rompe
a paridade que PT-004 cobra como `@critico`; construir a paridade deixa CA-5.1
falso. O que T011 fez foi separar o que o conflito **nao** alcanca — a tarefa de
coleta em si, que e CA-5.2, CA-5.3 e CA-5.4 e que T013 e T015 precisam — do que
ele alcanca, e entregar o primeiro deixando o segundo escrito e parado. Ver *O que
T011 entrega, e so isso* e `coleta/agendamento-da-coleta.ts`.

**E ha um segundo item aberto na mesma historia:** CA-5.5 exige que cada execucao
*"registre quantos registros apagou"*, e o legado nao guarda registro nenhum de
execucao (UC-11: *"nenhum registro do que foi apagado foi guardado"*). O **P7**
permite acrescentar registro — desde que **nenhuma decisao do sistema passe a
depender dele** —, mas o criterio o torna obrigatorio, o que `spec.md` registra
como divergencia a ser aceita explicitamente. E `ESC-RETENCAO` (BR-MIGRAR-113)
proibe inventar prazo de retencao para esse registro novo.

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Lixeira para midia.** REQ-051 esta `bloqueado` e a **resposta 9** ja decidiu: a
  exclusao de midia continua **definitiva, sem lixeira e sem aviso**
  (BR-MIGRAR-032, `MEDIA_TRASH` nasce `false`). US-8 reparenta anexos ao apagar
  conteudo em definitivo, logo a assimetria entre conteudo e midia e visivel e e
  **proposital**. `spec.md` pergunta se o card volta a selecao; nao e pergunta
  deste modulo.
- **Restauracao para o estado anterior.** `R2` / BR-MIGRAR-031: restaurar devolve
  como **rascunho**, e a memoria do estado anterior existe e **nao** e usada por
  default. E o risco 4 de `plan.md`: um porte "melhorado" que devolva ao estado
  anterior rompe a paridade de um comportamento que a pessoa que usa conhece.
- **Cascata declarada no armazenamento.** Ao apagar em definitivo, filhos e anexos
  sao **reparentados ao avo** (`wp-includes/post.php:3908`) — T017 o implementou
  assim, em `UPDATE`. Declarar restricao com cascata no destino e a violacao de
  P5 que `plan.md` nomeia como o primeiro risco do ERD, e o que ela apagaria esta
  afirmado por teste: a filha e o anexo **continuam existindo** depois de o pai
  morrer.
- **Limpeza dos orfaos que o legado deixa.** Ver *O limite de CA-8.4*: tres casos
  de vinculo pendurado sao comportamento do produto, e a Decisao 2 os poe dentro
  do que a paridade compara. Fecha-los e card novo, nao tarefa deste pacote.
- **Prazo de retencao para o que o legado nao tem** (registro editorial interno,
  solicitacao concluida, registro de cadastro em rede) e **limite de taxa**:
  `ESC-RETENCAO` e a resposta 19 poem isso fora do nucleo.

## Como esta entrega se confere

- `npm run typecheck` e `npm test` — as afirmacoes de T001 estao em
  `modulo.test.ts` e `configuracao/prazo-de-retencao.test.ts` (4), as 19 de
  T002 em `armazenamento/armazenamento.test.ts`, as 19 de T003 em
  `descarte/us-1-descartar-conteudo.test.ts`, as 21 de T005 em
  `cascata-de-comentarios/us-2-suspender-comentarios.test.ts`, as 24 de T007 em
  `restauracao/us-3-restaurar-conteudo.test.ts`, as 23 de T009 em
  `descarte/us-4-aviso-de-exclusao-definitiva.test.ts`, as 23 de T011 em
  `coleta/us-5-coletar-a-lixeira-vencida.test.ts`, as 17 de T015 em
  `coleta/us-7-tolerar-estado-inconsistente.test.ts` e as 26 de T017 em
  `exclusao/us-8-reparentar-filhos-e-anexos.test.ts`. `modulo.test.ts` ganhou de
  T011 a afirmacao de que **ter a coleta na superficie nao a agenda nem a
  executa** — a contraparte, na composicao, do que
  `coleta/agendamento-da-coleta.ts` declara.
- A parte de **T005** e conferida pela **area 3 da Decisao 2** (*"efeito no banco
  ... snapshot + sequencia de comandos"*, **zero** divergencia), e e nela que a
  contagem de comandos aparece: a suspensao emite um `INSERT` e **um** `UPDATE`,
  e a restauracao **um `UPDATE` por estado distinto** mais o `SELECT`+`DELETE` do
  metadado. Os bytes do marcador agrupado caem no cenario de
  `15-fronteira-do-banco-e-codec-serialize.feature` (*"nenhuma das duas
  normaliza, reordena nem reindexa a estrutura"*), que e o que torna a chave
  **inteira** do comentario — `a:1:{i:5;s:1:"1";}`, nao `s:1:"5"` — uma afirmacao
  e nao um detalhe. PT-004 nao tem cenario proprio de US-2: a cascata aparece
  nele como um dos efeitos do descarte, no passo 5 de UC-09, e a conferencia caso
  a caso contra o oraculo de `scripts/oraculo` e por **estado da tabela
  `comments`** antes e depois.
- Pela paridade: **PT-004**
  (`.specify/migration/parity_tests/04-retencao-e-coleta-da-lixeira.feature`), o
  cenario `@invariante` *"O prazo de retencao da lixeira e o do legado, e desliga-lo
  torna apagar irreversivel"*. A metade dele que depende de T001 e o **numero**; da
  ultima linha — *"conteudo e descartado com a lixeira desligada / as duas
  metades o apagam na hora, sem passar pela lixeira"* — T003 afirma o *"sem
  passar pela lixeira"*: a primeira linha delega, e nenhum marcador, nenhuma
  cascata e nenhum ponto de extensao acontece. O apagamento em si e a cascata de
  T017, e o resto do cenario depende da coleta (T011).
- **A coleta de T011 fecha a outra metade daquele cenario** — *"o tempo avanca ate
  um dia antes do prazo / entao nenhuma das duas metades o apaga"* e *"o tempo
  avanca alem do prazo ... entao as duas o apagam"* —, que e o `<` estritamente
  menor de `coleta/varredura-do-vencido.ts`, com o relogio controlado que o **P6**
  exige. E fecha o cenario `@critico @invariante` *"A coleta tolera estado
  inconsistente e nao aborta"*. ⚠️ **As duas entradas dele NAO caem no ramo de
  `R6`**, como esta nota dizia ate T015: *"conteudo na lixeira sem o metadado de
  estado anterior"* e *"com metadado apontando para um estado que nao existe
  mais"* continuam em `trash`, a guarda de `:6989` so olha o estado do registro e
  a coleta nao le esse metadado. Os dois seguem para `wp_delete_post()`, se tiverem
  o instante vencido, e nenhuma das duas metades aborta. `R6` e o caso de CA-7.1,
  em que o registro **saiu** de `trash`, e ali **nenhum `DELETE` sai quando o
  `SELECT meta_id` nao devolve linha**.
- 🔴 **O que a paridade NAO pode conferir de T011, e por que:** o cenario de
  abertura de PT-004, *"Um site que ninguem administra nunca executa a propria
  coleta de lixeira"*, e o conflito de **CA-5.1**. Ele e afirmavel nos dois
  sentidos — *"nenhuma das duas tem a tarefa de coleta registrada na fila"* e *"as
  duas metades registram a tarefa de coleta"* — assim que a decisao humana
  escolher o ponto de chamada de `registrarAColeta()`. Enquanto ela nao vier, o
  cenario fica **sem a metade do alvo**: o lado legado roda, o lado novo nao tem
  quem registre. E e assim de proposito.
- A parte de **T009** entra no mesmo cenario `@invariante` de PT-004: a ultima
  linha — *"as duas metades o apagam na hora, sem passar pela lixeira"* — e CA-4.1,
  e T009 acrescenta a ela a **pergunta** que cada superficie faz
  (`descarte/lixeira-desligada.ts`). CA-4.3 e CA-4.4 sao conferidos pela **area 4
  da Decisao 2** (*"HTML de tema e painel: comportamento de caso de uso"*, um
  percurso por UC — aqui UC-09) com `compare: semantic-contract` de `SCR-039` e
  `SCR-041`, e os rotulos por `diff` de string **zero**. A recusa de `501` da API
  cai na **area 1** (*"contrato de terceiro: REST ... byte a byte, zero
  divergencia"*), e o filtro `rest_{tipo}_trashable` na **area 2** (*"valor
  devolvido por hook"*). **CA-4.2 se confere contra o oraculo pela ausencia:**
  nenhum dialogo antes da exclusao, nos percursos do painel.
- A parte de **T017** se confere por **PT-003**
  (`.specify/migration/parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature`),
  e por quatro cenarios dele: *"Apagar reparenteia pagina filha e anexo para o
  avo, e nao os apaga"* (`@critico @cascata @invariante`) e *"As sete etapas rodam
  na mesma ordem e deixam o mesmo estado intermediario"* sao CA-8.1, CA-8.2 e
  CA-8.3; *"Interromper a exclusao no meio deixa o MESMO estado parcial"* e o
  desfecho `nao-apagado`; e *"A sequencia e equivalente com a porta de dados
  substituida por duplo"* e o que a suite faz, com a porta que **registra todo
  comando e falha em consulta nao prevista**. CA-8.4 se confere pelo mesmo
  cenario, com o limite da secao *O limite de CA-8.4* — o oraculo deixa os
  mesmos orfaos, e e o estado dele que a comparacao exige. O cenario
  `@concorrencia` (*"duas exclusoes simultaneas em ramos vizinhos"*) **nao e
  conferivel nesta arvore**: ele compara duas execucoes no mesmo processo contra o
  oraculo, e nao ha processo nem adaptador ainda.
- A parte de T002 e conferida pela **area 3 da Decisao 2** de `parity_specs.md`
  (*"efeito no banco ... snapshot + sequencia de comandos"*, **zero** divergencia)
  e, para os bytes do marcador agrupado, pelo cenario de
  `15-fronteira-do-banco-e-codec-serialize.feature`. A porta falsa registra
  comando justamente para que a sequencia seja comparavel linha por linha.
