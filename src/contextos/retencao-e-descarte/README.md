# Modulo de retencao e descarte — feature `005-retencao-e-descarte`

Tarefas com nota de entrega neste arquivo: **T001** (esqueleto, as tres
portas e o prazo de retencao), **T002** (os marcadores de lixeira como
metadado), **T003** (o descarte para a lixeira, US-1) e **T009** (o aviso de que
apagar nao tem volta, US-4 — **tres dos quatro criterios**, ver o 🔴 abaixo).
Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem
decidiu**.

> 🔴 **Se a sua tarefa e T010 (os testes de US-4), ou se alguem lhe pediu para
> "terminar T009":** **CA-4.2 esta parado**, e T009 **nao o resolveu** nem o
> podia. O criterio exige *"a confirmacao pedida ao ator"* dizendo que a acao nao
> tem volta; UC-09 afirma, palavra por palavra, que *"o ator nao e avisado da
> diferenca"*, e a arvore analisada confirma a ausencia — o unico
> `confirm()` do painel com essas palavras e governado por `MEDIA_TRASH`, nunca
> por `EMPTY_TRASH_DAYS`. **UT-050-2 do catalogo e a transcricao de CA-4.2, logo
> esbarra na mesma parada; os outros quatro casos de T010 nao esbarram em nada.**
> O censo inteiro esta na secao *O conflito que T009 encontrou e nao decidiu* e no
> cabecalho de `descarte/aviso-de-exclusao-definitiva.ts`.

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca o agendamento da coleta
> (T011, US-5):** o conflito entre **CA-5.1** e a **resposta 10** de
> `questions.md` **esta aberto**, e T001 **nao o resolveu** nem o podia. O que
> T001 fez foi declarar a porta da fila de modo a servir os dois lados sem
> favorecer nenhum, e escrever um teste que afirma que **compor o modulo nao
> agenda nada**. A explicacao inteira esta na secao *O conflito que T001 declarou
> e nao decidiu* deste arquivo e no cabecalho de
> `portas/porta-de-fila-agendada.ts`.

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
(`descarte/acoes-de-descarte-na-tela.ts`); o **aviso** que CA-4.2 cobra **nao
entrou**, porque o legado nao o tem — ver *O conflito que T009 encontrou e nao
decidiu*. O que ainda falta e de **T017** (US-8): a cascata que o campo
`exclusaoDefinitiva` do contexto espera.

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
| `suspenderComentarios` | `wp_trash_post_comments( $post_id )` (`:4142`) | **T005** (US-2), neste modulo |
| `exclusaoDefinitiva` | `wp_delete_post( $post_id, true )` (`:4086`) | **T017** (US-8), neste modulo. O que a tela mostra antes dela e **T009**, feito; a confirmacao de CA-4.2 **nao existe no legado** e esta parada |

Ligar cada um e trocar o campo na composicao; **a ordem nao muda**. Eles sao
obrigatorios e nao opcionais de proposito: opcional, a ausencia seria um passo do
fluxo silenciosamente saltado, e nem o passo 5 de UC-09 nem a primeira linha de
`wp_trash_post()` sao opcionais no legado.

## O que T009 entrega — e o que ela NAO entrega

> *"o comportamento de US-4 existe e os criterios CA-4.1, CA-4.2, CA-4.3, CA-4.4
> passam contra o sistema novo"*
> — `.specify/specs/005-retencao-e-descarte/tasks.md`, T009

| criterio | estado | onde esta |
|---|---|---|
| **CA-4.1** o pedido de descarte apaga em definitivo | **feito** | o efeito em `descarte/descartar-para-a-lixeira.ts` (passo 1, desde T003); a **pergunta** em `descarte/lixeira-desligada.ts` |
| **CA-4.2** a confirmacao diz que a acao nao tem volta | 🔴 **parado** | `descarte/aviso-de-exclusao-definitiva.ts`, caixa de PARADA |
| **CA-4.3** a diferenca e visivel na tela antes da acao | **feito** | `descarte/acoes-de-descarte-na-tela.ts` |
| **CA-4.4** a tela nao oferece acao de restaurar | **feito** | `descarte/acoes-de-descarte-na-tela.ts` |

| arquivo | o que e |
|---|---|
| `descarte/lixeira-desligada.ts` | a pergunta *"ha lixeira?"* nas **tres** formas do legado, e a divergencia entre elas |
| `descarte/acoes-de-descarte-na-tela.ts` | os **seis** rotulos, os tres `aria-label`, a acao da rota, o `nonce` e os quatro pontos de extensao que reescrevem a lista |
| `descarte/aviso-de-exclusao-definitiva.ts` | o que cada superficie diz ao ator, a recusa de `501` da API e a **parada de CA-4.2** |
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
  colide com CA-4.2.
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
  (`wp-admin/post.php:153`, `409`). Com a lixeira desligada nada chega a `trash`,
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
  CA-4.2 sem ser CA-4.2.
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

## O conflito que T009 encontrou e nao decidiu: CA-4.2

| lado | onde esta escrito | o que diz |
|---|---|---|
| a spec | **CA-4.2** (REQ-050), e `UT-050-2` em `backlog/tests.md` | *"nesse caso a confirmacao pedida ao ator diz, com estas palavras, que a acao nao tem volta"* |
| a analise | **UC-09**, fluxo alternativo *Lixeira desligada*, e a secao *O que um porte precisa saber* | *"apagar passa a ser irreversivel, e o ator **nao** e avisado da diferenca"* · *"o mesmo botao, dois comportamentos irreconciliaveis"* |

**E a arvore analisada esta do lado de UC-09 quanto a confirmacao.** O censo:

| o que foi procurado | resultado |
|---|---|
| `confirm(` em `wp-admin/js/*.js` | **uma** ocorrencia de exclusao de item do site: `showNotice.warn()`, `wp-admin/js/common.js:548` — *"You are about to permanently delete these items from your site.\nThis action cannot be undone..."* |
| quem chama `showNotice.warn` | **dois**, os dois governados por `MEDIA_TRASH`: `wp-admin/includes/meta-boxes.php:477` (caixa do anexo) e `wp-admin/includes/class-wp-media-list-table.php:835` |
| `onclick` nos links de conteudo | **nenhum**: `meta-boxes.php:370` (editor), `class-wp-posts-list-table.php:1623` e `:1633` (linha) sao links secos |
| ouvinte de `.submitdelete` em `.js` do painel | **nenhum** |
| confirmacao na acao em massa | **nenhuma** |
| o legado sabe confirmar nessa caixa? | **sim** — a tela de link herdada poe `onclick="return confirm( ... )"` no proprio `submitdelete` (`meta-boxes.php:1137`) |

Ou seja: a ausencia no conteudo **nao e limitacao tecnica**, e o produto. E e por
isso que nenhum dos dois caminhos esta aberto a este agente:

- **acrescentar a confirmacao** e acrescentar comportamento observavel que o
  original nao tem, e o **P1** exige *"uma decisao humana registrada, citada no
  codigo que divergiu"*. Nao existe: `pending_decisions.md` nao trata disto,
  `discard_log.md` nao descarta nada desta historia, e as cinco entradas de
  `screen_deviation_log.md` nao cobrem acrescentar dialogo a uma tela (`DEV-001`
  e formato de spec, `DEV-002` e captura, `DEV-003` a `DEV-005` sao outras
  telas);
- **nao acrescentar** deixa CA-4.2 e UT-050-2 falsos.

As duas fontes sao humanas e estao em sentidos opostos, que e o caso que a
constituicao poe na tabela *Nao negociavel*. **A forma da parada e a de T019 da
feature `002`** (US-9 pede aviso que UC-07 nega): o ledger de T009 fica **aberto**
em `tasks.md`, o resto da historia esta entregue e testado, e quem decidir
encontra em `descarte/aviso-de-exclusao-definitiva.ts` os **dois textos que o
legado ja tem** para isto — o de midia (`common.js:548`) e o de link
(`meta-boxes.php:1137`) —, para que a decisao nao precise inventar frase que o
produto nao tem.

⚠️ **E a mesma leitura derruba meia frase de BR-MIGRAR-032 e da resposta 9.** As
duas dizem que apagar midia e *"definitivo, sem lixeira e sem aviso"*. **Sem
lixeira, sim; sem aviso, nao**: o aviso de `MEDIA_TRASH` e o unico que o legado
tem, e e exatamente a frase que CA-4.2 descreve. A contradicao e de REQ-051, que
esta `bloqueado`, e fica registrada aqui porque foi esta tarefa que a encontrou.

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

**Quem pegar T011 esbarra nisso.** Construir CA-5.1 como esta escrita rompe a
paridade que PT-004 cobra como `@critico`; construir a paridade deixa CA-5.1 falso.
Pare e registre, como a constituicao manda.

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
  sao **reparentados ao avo** (`wp-includes/post.php:3908`). Declarar restricao com
  cascata no destino e a violacao de P5 que `plan.md` nomeia como o primeiro risco
  do ERD.
- **Prazo de retencao para o que o legado nao tem** (registro editorial interno,
  solicitacao concluida, registro de cadastro em rede) e **limite de taxa**:
  `ESC-RETENCAO` e a resposta 19 poem isso fora do nucleo.

## Como esta entrega se confere

- `npm run typecheck` e `npm test` — as 10 afirmacoes de T001 estao em
  `modulo.test.ts` (6) e `configuracao/prazo-de-retencao.test.ts` (4), as 19 de
  T002 em `armazenamento/armazenamento.test.ts`, as 19 de T003 em
  `descarte/us-1-descartar-conteudo.test.ts` e as 23 de T009 em
  `descarte/us-4-aviso-de-exclusao-definitiva.test.ts`.
- Pela paridade: **PT-004**
  (`.specify/migration/parity_tests/04-retencao-e-coleta-da-lixeira.feature`), o
  cenario `@invariante` *"O prazo de retencao da lixeira e o do legado, e desliga-lo
  torna apagar irreversivel"*. A metade dele que depende de T001 e o **numero**; da
  ultima linha — *"conteudo e descartado com a lixeira desligada / as duas
  metades o apagam na hora, sem passar pela lixeira"* — T003 afirma o *"sem
  passar pela lixeira"*: a primeira linha delega, e nenhum marcador, nenhuma
  cascata e nenhum ponto de extensao acontece. O apagamento em si e a cascata de
  T017, e o resto do cenario depende da coleta (T011).
- A parte de **T009** entra no mesmo cenario `@invariante` de PT-004: a ultima
  linha — *"as duas metades o apagam na hora, sem passar pela lixeira"* — e CA-4.1,
  e T009 acrescenta a ela a **pergunta** que cada superficie faz
  (`descarte/lixeira-desligada.ts`). CA-4.3 e CA-4.4 sao conferidos pela **area 4
  da Decisao 2** (*"HTML de tema e painel: comportamento de caso de uso"*, um
  percurso por UC — aqui UC-09) com `compare: semantic-contract` de `SCR-039` e
  `SCR-041`, e os rotulos por `diff` de string **zero**. A recusa de `501` da API
  cai na **area 1** (*"contrato de terceiro: REST ... byte a byte, zero
  divergencia"*), e o filtro `rest_{tipo}_trashable` na **area 2** (*"valor
  devolvido por hook"*). 🔴 **CA-4.2 nao tem como ser conferido contra o oraculo:
  nao ha confirmacao no legado para comparar** — e a parada, nao a lacuna de
  teste.
- A parte de T002 e conferida pela **area 3 da Decisao 2** de `parity_specs.md`
  (*"efeito no banco ... snapshot + sequencia de comandos"*, **zero** divergencia)
  e, para os bytes do marcador agrupado, pelo cenario de
  `15-fronteira-do-banco-e-codec-serialize.feature`. A porta falsa registra
  comando justamente para que a sequencia seja comparavel linha por linha.
