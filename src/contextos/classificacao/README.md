# Modulo de classificacao — BC-02

Entregue por **T001** (o esqueleto), **T002** (a forma de armazenamento),
**T003** (a separacao entre rotulo e contexto, US-1), **T005** (a classificacao
do conteudo, US-2), **T007** (o termo padrao do contexto, US-3) e **T009** (a
manutencao da lista, US-4) da feature `003-classificacao-do-conteudo`. Este
arquivo e a leitura obrigatoria de quem pegar **T011** em diante: ele diz o que
ja esta decidido, o que esta decidido **em outro lugar**, e o que ninguem
decidiu.

> ⚠️ **Se voce esta pegando T011, comece por dois lugares:** o bloco 🔴 de
> `manutencao-da-lista/apagar-rotulo-do-contexto.ts`, que e a cascata inteira
> **sem** o passo que T011 acrescenta e com a consequencia concreta dessa
> ausencia; e a secao 🔴 de `manutencao-da-lista/permissao-na-gestao-de-rotulos.ts`,
> que lista os **tres** portoes da tela que dependem do `case` de capacidade sobre
> o termo — o `case` que carrega a regra de T011.

## O que T001 entrega, e so isso

> *o modulo carrega com a porta de dados declarada e os oito contextos de
> classificacao do nucleo registrados, sem regra implementada*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T001

| arquivo | o que e |
|---|---|
| `index.ts` | a composicao: recebe a porta, devolve o modulo com os oito contextos dentro |
| `portas/porta-de-dados.ts` | a unica porta deste modulo para o banco |
| `registro/contexto-de-classificacao.ts` | a forma do contexto, e a parte **pura** de `set_props()` |
| `registro/contextos-do-nucleo.ts` | as **oito** declaracoes, na ordem de `create_initial_taxonomies()` |
| `registro/registro-de-contextos.ts` | o `$wp_taxonomies`, por composicao e nao por modulo |
| `registro/erro-de-registro.ts` | os dois codigos de `WP_Error`, com as mensagens do legado |
| `modulo.test.ts` | afirma a entrega de T001, T002, T003, T005 e T007 na superficie do modulo, e as invariantes de arquitetura |
| `registro/registro-de-contextos.test.ts` | afirma os oito, a ordem, os defaults e as duas recusas |

## O que T002 entrega, e so isso

> *as tres estruturas da secao Modelo de dados do plano existem, com a chave
> composta da juncao e a unicidade de rotulo por contexto, e sao lidas e gravadas
> pela porta de dados*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T002

| arquivo | o que e |
|---|---|
| `armazenamento/chaves-e-tabelas.ts` | os nomes das **tres** tabelas, e por que `termmeta` e `links` nao estao |
| `armazenamento/esquema.ts` | o DDL das tres, byte a byte, com as **duas** garantias de unicidade |
| `armazenamento/rotulo.ts` | `terms` — o rotulo, ignorante do contexto |
| `armazenamento/rotulo-no-contexto.ts` | `term_taxonomy` — o rotulo no contexto, a hierarquia e a contagem gravada |
| `armazenamento/vinculo.ts` | `term_relationships` — a juncao, por **chave composta** |
| `armazenamento/termo.ts` | a leitura **fundida** das duas primeiras: `AGG-Termo` sem fundir tabela |
| `armazenamento/leitura-de-linha.ts` | a tolerancia da borda: texto, numero ou bytes |
| `armazenamento/porta-falsa.ts` | porta de teste que **registra consulta**, para afirmar efeito no banco |
| `armazenamento/esquema.test.ts` | afirma o DDL byte a byte, as duas garantias e os quatro "zeros" |
| `armazenamento/armazenamento.test.ts` | afirma a cadeia que sai e a linha que entra, inclusive onde **nada sai** |

Tres coisas que T002 **nao** fez, e nao e esquecimento:

1. **Nao acrescentou coluna, tabela nem indice.** Nem discriminador na juncao,
   nem indice isolado em `object_id` (risco 4 do plano), nem `UNIQUE` em
   `terms.slug`. `target_data_model.md` fecha a secao de origem com *"zero
   tabelas acrescentadas, zero colunas acrescentadas, zero indices
   acrescentados"*, e a AD-11 nao permite mudanca de esquema nesta fase.
2. **Nao implementou regra nenhuma.** Nao recusa contexto nao registrado, nao
   cobra hierarquia em contexto plano, nao resolve colisao de identificador na
   URL, nao recalcula contagem, nao aplica termo padrao e nao apaga em cascata.
   Cada ausencia tem o motivo no arquivo da estrutura, com `arquivo:linha` do
   legado.
3. **Nao transcreveu a consulta de termos por filtro.** Ela e `WP_Term_Query`,
   montada **por fragmento com ponto de extensao entre os fragmentos** — e e de
   T009 e da camada de dados da feature 015. Uma versao simplificada dela aqui
   seria uma segunda consulta de termos **sem** os pontos de extensao, que o P2
   poe no contrato publico.

**Nenhum arquivo de `registro/` toca a porta** — ha teste que afirma isso
(`criar o modulo nao toca na porta`). A porta de dados e usada por
`armazenamento/`, que e T002, por `rotulo-e-contexto/`, que e T003, e por
`vinculo-de-objeto/`, que e T005 — e **so por elas**, sempre pelos repositorios de
T002 e nunca por consulta propria.

**Um numero so aparece neste modulo, e ele tem teste de borda nos dois lados:**
os **32 bytes** do nome do contexto (`LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO`), com
o valor de fabrica do legado, como o **P6** da constituicao exige — e com T002
ele ganhou um segundo teste, que afirma que a coluna `taxonomy` do DDL tem
exatamente esses 32 bytes. Os numeros que T002 trouxe sao os do esquema, todos com
teste: o **191** do teto de indice, e os sentinelas `0` de `term_group`, `parent`,
`count` e `term_order`. Os que ainda nao chegaram — o `1` com que a categoria
padrao e semeada e os dois criterios de contagem — entram nas tarefas que os
implementam. Numero que aparece aqui antes da tarefa dele e numero sem teste de
borda.

**T003 nao trouxe numero nenhum**, e isso e leitura e nao sorte: os quatro
criterios de US-1 nao tem prazo, contagem nem limite. O **P6** manda que onde o
legado nao tem numero o sistema novo tambem nao tenha.

## O que T003 entrega, e so isso

> *o comportamento de US-1 existe e os criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4
> passam contra o sistema novo*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T003

Tudo em `rotulo-e-contexto/`, e o `index.ts` dessa pasta e a leitura de entrada:

| arquivo | o que e |
|---|---|
| `rotulo-e-contexto/escopo-de-rotulo-e-contexto.ts` | o escopo por argumento, e as **cinco** ausencias dele — entre elas a juncao, que US-1 nao escreve |
| `rotulo-e-contexto/erro-de-termo.ts` | os **quatro** codigos de `WP_Error` deste caminho, com as mensagens do legado byte a byte |
| `rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts` | **CA-1.1**: as quatro saidas de `WP_Term::get_instance()`, os dois portoes de `get_term()` e o contexto `raw` de `sanitize_term()` |
| `rotulo-e-contexto/renomear-rotulo.ts` | **CA-1.2**: os dois `UPDATE` de uma renomeacao, os onze pontos de extensao de `wp_update_term()` e a 🔴 divergencia do rotulo compartilhado |
| `rotulo-e-contexto/remover-rotulo-do-contexto.ts` | **CA-1.3**: o `DELETE` da linha de contexto, o `DELETE` **condicional** do rotulo, e os oito passos de `wp_delete_term()` que vem antes, com dono |
| `rotulo-e-contexto/tipos-de-objeto-do-contexto.ts` | **CA-1.4**: `get_object_taxonomies()` nas duas formas e `is_object_in_taxonomy()`, com a recusa **silenciosa** |
| `rotulo-e-contexto/us-1-rotulo-e-contexto.test.ts` | 22 testes: os quatro criterios por efeito no banco, por sequencia e por ordem de comando |

**Cinco operacoes entraram na superficie do modulo**, cada uma com a declaracao
de permissao que o **P4** exige: `obterTermo`, `contextosDoTipoDeObjeto`,
`nomesDosContextosDoTipoDeObjeto`, `contextoAceitaTipoDeObjeto` e
`renomearRotulo`. As quatro primeiras declaram **nenhuma** permissao, porque o
legado nao cobra capacidade em `get_term()` nem em `get_object_taxonomies()`;
`renomearRotulo` declara `edit_terms` **e nao o verifica**, porque
`wp_update_term()` tambem nao verifica — quem cobra e a tela
(`wp-admin/edit-tags.php:112`, que e **CA-4.1**, de T009) e a API REST, e o
nucleo chama a funcao sem ator nenhum. Verificar aqui recusaria o que o legado
aceita (P1).

Quatro coisas que T003 **nao** fez, e nao e esquecimento:

1. **Nao publicou `removerRotuloDoContexto` como operacao do modulo.** Ela e o
   trecho final de `wp_delete_term()` (`wp-includes/taxonomy.php:2200`-`:2216`),
   e e onde CA-1.3 se decide — mas sem a protecao do termo padrao (US-5, T011) e
   sem a cascata (US-4, T009) ela seria um caminho de **apagar dado** que o
   legado nao expoe, e a tabela *Nao negociavel* da constituicao poe isso fora do
   alcance do agente. E exportada pelo modulo, para quem montar a exclusao
   inteira; operacao, nao.
2. **Nao transcreveu a consulta de termos por filtro** — e por isso `term_exists()`,
   `get_term_by()` e a recusa `duplicate_term_slug` **nao** entraram: as tres
   passam por `WP_Term_Query`, que e de T009 e da feature 015. A consequencia
   esta declarada em `renomear-rotulo.ts`: enquanto ela nao existe, renomear
   **aceita** o caso que o legado recusaria quando outro rotulo daquele contexto
   ja usa o mesmo slug.
3. **Nao criou rotulo, nao vinculou objeto e nao mexeu em hierarquia nem em
   contagem.** `wp_insert_term()` inteira e T009; a substituicao de vinculos e
   T005; o termo padrao e T007.
4. **Nao porta `sanitize_title()` nem a divisao de rotulo compartilhado.** A
   primeira nao existe nesta arvore e e a razao pela qual o ramo de slug vazio de
   `wp_update_term()` (`:3416`) ficou com T009. A segunda e o conflito aberto
   abaixo.

## O que T005 entrega, e so isso

> *o comportamento de US-2 existe e os criterios CA-2.1, CA-2.2, CA-2.3, CA-2.4
> passam contra o sistema novo*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T005

Tudo em `vinculo-de-objeto/`, e o `index.ts` dessa pasta e a leitura de entrada:

| arquivo | o que e |
|---|---|
| `vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts` | o escopo por argumento com as **quatro** pecas do armazenamento, a colaboracao com BC-01 por ligacao tardia, e as seis ausencias declaradas |
| `vinculo-de-objeto/rotulos-informados.ts` | a lista como ela chega, e onde **CA-2.2** se decide — com a 🔴 analise de onde o legado cobra a capacidade de criar termo |
| `vinculo-de-objeto/caso-de-atribuicao-de-rotulo.ts` | os **dois** atalhos de `PERM-6` desta historia: `assign_categories` e `assign_post_tags` para `edit_posts` |
| `vinculo-de-objeto/contagem-de-uso.ts` | **CA-2.3**: uma coluna, **tres** criterios de calculo, quem escolhe entre eles, e o adiamento declarado e nao construido |
| `vinculo-de-objeto/substituir-vinculos.ts` | **CA-2.1**: `wp_set_object_terms()`, com os oito passos da sequencia e os cinco que sao condicionais |
| `vinculo-de-objeto/remover-vinculos.ts` | a outra metade de CA-2.1: `wp_remove_object_terms()`, com a degradacao do legado declarada |
| `vinculo-de-objeto/classificar-conteudo.ts` | **CA-2.4** e o portao de CA-2.2: os tres `if` de `wp_insert_post()`, e as tres recusas **silenciosas** |
| `vinculo-de-objeto/us-2-classificar-conteudo.test.ts` | 32 testes: os quatro criterios por efeito no banco, por sequencia de comandos e por ausencia de comando |

**Quatro operacoes entraram na superficie do modulo**, cada uma com a declaracao
de permissao que o **P4** exige — e **so uma delas verifica capacidade**, porque
so uma corresponde a um ponto em que o legado verifica:

| operacao | no legado | permissao |
|---|---|---|
| `classificarConteudo` | o bloco de `wp_insert_post()` (`wp-includes/post.php:5053`-`:5109`) | a que o contexto declara em `assign_terms`, **verificada** (`:5105`) |
| `substituirVinculosDoObjeto` | `wp_set_object_terms()` (`taxonomy.php:2851`) | **nenhuma**: o nucleo a chama sem ator |
| `removerVinculosDoObjeto` | `wp_remove_object_terms()` (`:3038`) | **nenhuma**, idem |
| `recontarUsoDosRotulos` | `wp_update_term_count()` (`:3587`) | **nenhuma**, idem |

**Por que a historia e duas camadas e nao uma:** no legado os portoes estao
**todos** na camada de cima, e `wp_set_object_terms()` nao verifica nem capacidade
nem tipo de objeto. Fundi-las forcaria um erro em qualquer direcao — com portao,
recusaria a atribuicao que o proprio nucleo faz sem ator (o termo padrao na
publicacao, `post.php:5438`); sem portao, CA-2.2 e CA-2.4 nao teriam onde morar.

**T005 nao acrescentou porta**, e precisou de tres coisas que nao estao no banco
deste contexto: `post_type_exists()` e as duas contagens que atravessam `posts`.
As tres chegam por `ConteudoNaClassificacao`, declarada aqui e implementada em
BC-01 — a imagem espelhada de `ClassificacaoNaPublicacao`, que BC-01 declara e
este modulo implementa (AD-10, ligacao tardia; AD-08 poe portas somente nas cinco
bordas).

**T005 acrescentou duas leituras ao armazenamento de T002**, e as duas estao
declaradas no arquivo da estrutura com o conjunto de argumentos exato que as
justifica:

1. `vinculos.listarRotulosDoObjeto()` — a **leitura inversa**, que T002 havia
   deixado inteira para T009. O recorte entrou porque sem ela *"substituir
   integralmente"* nao existe: CA-2.1 depende de conhecer o conjunto anterior. E
   a cadeia que `WP_Term_Query` produz para os dois conjuntos de argumentos que
   `wp_set_object_terms()` passa, e **nada alem deles** — sem filtro por nome,
   apelido, pai, hierarquia ou contagem, e sem onde encaixar `terms_clauses`.
   Quando a consulta por fragmento chegar (T009 e feature 015, T007), este metodo
   passa a ser uma chamada a ela.
2. `rotulosNoContexto.listarRotulosPorIdsNoContexto()` — a volta de
   `term_taxonomy_id` para `term_id` que o legado da **de proposito** entre a
   diferenca e a remocao (`:2954`). Encurta-la apagaria uma leitura da sequencia.

**Dois numeros entraram com T005, os dois com teste de borda:** o `1` da primeira
posicao da escrita ordenada (`PRIMEIRA_ORDEM_DO_VINCULO`, de `++$term_order`
sobre `0`, `:2968`) e o `'publish'` unico de
`ESTADOS_CONTADOS_NO_CRITERIO_DE_CONTEUDO` (`:4214`) — que nao e numero mas e
valor de fabrica com ponto de configuracao nomeado, como o **P6** exige, e com o
filtro que o altera em execucao declarado e nao emitido.

Cinco coisas que T005 **nao** fez, e nao e esquecimento:

1. **Nao criou rotulo.** `wp_insert_term()` e a operacao *"criar ou renomear
   rotulo"* da tabela *Contratos* e e **T009**. A consequencia esta declarada e
   tem teste com 🔴 no nome: em contexto **plano**, o rotulo informado por nome
   que o legado criaria **nao e criado** — e em contexto hierarquico nao ha
   consequencia, porque a normalizacao do legado ja o transformou em `0`.
2. **Nao resolveu rotulo por apelido nem por nome.** `term_exists()` com cadeia
   tenta `sanitize_title()` e depois o nome, e as duas passam por
   `WP_Term_Query`: T003 ja havia declarado as duas ausencias, com dono em T009 e
   na feature 015.
3. **Nao aplicou termo padrao.** O laco que decide se a lista chega vazia ou com o
   padrao dentro roda **antes** desta chamada, em `wp_insert_post()` e em
   `wp_publish_post()`, e e **T007**. BC-01 ja declarou a porta que o faz
   (`ClassificacaoNaPublicacao.definirTermos`), e e esta tarefa que a implementa.
4. **Nao portou o adiamento da contagem.** `wp_defer_term_counting()` e
   `wp_update_term_count()` guardam estado em `static`, que e exatamente a
   travessia **D-A** de `parity_specs.md`, e nenhum chamador desta historia o
   liga — quem liga e `wp_delete_post()` (BC-01) e os importadores (BC-12). Com
   ele desligado, que e o **default de fabrica**, o caminho e identico. A
   consequencia e declarada: a contagem e sempre imediata, que e garantia **mais
   forte** que a do legado.
5. **Nao executou o terceiro criterio de contagem.** `update_count_callback` e
   nome de funcao PHP, e o legado delega a contagem inteira a ele **sem emitir
   comando proprio** — e o que esta tarefa reproduz. Um despachante de nome de
   funcao seria o barramento que `REQ-162` poe fora de escopo.

## O que T007 entrega, e so isso

> *o comportamento de US-3 existe e os criterios CA-3.1, CA-3.2, CA-3.3, CA-3.4
> passam contra o sistema novo*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T007

Tudo em `termo-padrao/`, e o `index.ts` dessa pasta e a leitura de entrada. A
regra e `P3` / `BR-MIGRAR-003`, que `database/business-rules.md` §3.4 chama de
*"a regra de negocio mais claramente de dominio em todo o modelo de dados"*:

| arquivo | o que e |
|---|---|
| `termo-padrao/chave-do-termo-padrao.ts` | as **duas** chaves de opcao, os tres valores do legado que decidem a regra, e por que `category` e excecao **por nome** |
| `termo-padrao/escopo-de-termo-padrao.ts` | a leitura da opcao por ligacao tardia, e o 🔴 bloco que explica por que ela **nao** virou porta |
| `termo-padrao/termo-padrao-na-gravacao.ts` | **CA-3.1**, **CA-3.3** e **CA-3.4**: os dois caminhos da gravacao, as duas portas de escrita, e o 🔴 limite do oraculo |
| `termo-padrao/classificacao-na-publicacao.ts` | **CA-3.2**: os quatro metodos que BC-01 declarou e que este modulo tinha de implementar |
| `termo-padrao/us-3-termo-padrao.test.ts` | 24 testes: os quatro criterios por efeito no banco, por sequencia de comandos e por **ausencia** de comando |

**A historia e dois caminhos com mecanismos diferentes**, e tratar os dois como um
e o jeito mais rapido de aplicar a categoria padrao a `page`:

| | gravacao (`post.php:4719` e `:5062`-`:5087`) | publicacao (`:5419`-`:5439`) |
|---|---|---|
| quem tem o laco | **esta tarefa** | **BC-01**, merged em T003 da feature `002` |
| o que esta tarefa entrega | o laco e as duas escritas | os quatro metodos que o laco de BC-01 chama |
| cobra capacidade? | **sim** no mapa de contextos (`assign_terms`, `:5105`), **nao** na categoria | **nao**, em nenhum: o nucleo o chama sem ator |
| cobra o tipo de objeto (CA-2.4)? | **sim** nas duas portas, e na **escrita**, nao na decisao (`:5053`) | nao: o laco de BC-01 ja itera os contextos do tipo |
| o que dispara o padrao | o tipo ser `post` (categoria) ou o contexto **declarar** `default_term` | o nome ser `category` ou o contexto declarar `default_term` |

⚠️ **A linha da capacidade e a mais consequente, e e ela que explica por que CA-3.2
existe como criterio separado:** o termo padrao de um contexto que nao e
`category` passa pelo portao de `assign_terms` na gravacao, logo um ator sem ela
grava conteudo **sem** o padrao — e o laco da publicacao, que roda sem ator, e o
que apanha o caso depois. Ha teste para cada metade.

**Duas entradas novas na superficie do modulo, e so uma e operacao:**

| entrada | no legado | permissao |
|---|---|---|
| `aplicarTermoPadraoNaGravacao` | os dois ramos de `P3` em `wp_insert_post()` (`:4719` e `:5062`-`:5087`) mais as duas escritas | **depende da porta**: na categoria so o portao do tipo de objeto (`:5053`), no mapa de contextos tambem `assign_terms` (`:5105`) |
| `classificacaoNaPublicacao` | — | **nao e operacao**: e a fabrica da colaboracao que BC-01 consome, e ela nao decide nada |

**T007 NAO acrescentou a "porta de opcoes" que T001, T003 e T005 anunciaram**, e
isso e a unica nota de onda anterior que esta tarefa contraria. A razao inteira
esta no bloco 🔴 de `termo-padrao/escopo-de-termo-padrao.ts`, e sao cinco:
**AD-08** fixa *"portas somente nas 5 bordas"* e nomeia as cinco (*"dados, HTTP,
sistema de arquivos, cache de objeto e e-mail"*), e opcao nao e uma delas;
`options` e tabela de `plataforma/opcoes/`, que **nao existe nesta arvore e
nenhuma tarefa dos 15 `tasks.md` constroi**; a porta de dados deste contexto ja
recusou o atalho por escrito (*"a travessia e por ligacao tardia (AD-10), nao por
nome de tabela de outro contexto"*); o **outro lado da mesma chamada** ja declarou
a leitura como colaboracao e nao como porta
(`ClassificacaoNaPublicacao.opcaoDeTermoPadrao`, em BC-01, merged); e BC-05 ja
havia registrado a doutrina para o mesmo problema (*"aqui a opcao e **entrada lida
de fora**"*, `identidade-e-acesso/cadastro/configuracao-de-cadastro.ts`).

**T007 nao acrescentou porta, nem leitura ao armazenamento, nem escopo proprio.** O
laco le o registro e a leitura inversa que T005 ja havia acrescentado, e **escreve
pelas operacoes de US-2** — como no legado, em que o laco do termo padrao nao
grava nada: ele reescreve `$post_category` e `$postarr['tax_input']` e deixa os
dois blocos seguintes gravarem.

Cinco coisas que T007 **nao** fez, e nao e esquecimento:

1. **Nao criou o rotulo padrao.** Quem o cria e o instalador (*"a instalacao nova
   cria o rotulo padrao do contexto de categoria, como o instalador do legado
   faz"*, `plan.md` § *Migracao de dados*) e `register_taxonomy()`, para quem
   declara `default_term`. Aqui a opcao so e **lida**.
2. **Nao reimplementou o laco da publicacao.** Os cinco ramos dele sao de BC-01 e
   **estao merged**; este lado so responde as quatro perguntas. Duas copias da
   mesma regra divergiriam na primeira mudanca.
3. **Nao protegeu o termo padrao de ser apagado.** *"O termo padrao do contexto e
   indestrutivel"* (`BR-MIGRAR-091`) e **US-5**, T011; *"apagar um termo devolve o
   objeto ao termo padrao, se aquele era o unico"* (`DB-TRG4`, `BR-MIGRAR-080`) e
   **CA-4.4**, T009. As duas vao chamar `chaveDoTermoPadrao()` e
   `OpcoesNaClassificacao`, que e a razao de os dois nascerem publicados.
4. **Nao reproduziu o descarte de rotulo ambiguo na leitura do conjunto.** O
   legado completa cada termo por `populate_terms()`, que descarta o que
   `get_term()` nao resolve; a leitura daqui e a cadeia de um comando so. E o mesmo
   limite que T003 e T005 declararam, e o caso so se alcanca com rotulo
   compartilhado, que **nenhuma operacao do legado 7.1.2 cria** — ver o item 3 de
   *O que ninguem decidiu*.
5. **Nao escreveu os testes do catalogo.** `UT-035-1` a `UT-035-5` sao **T008**,
   que roda em paralelo com esta tarefa.

## O que T009 entrega, e so isso

> *o comportamento de US-4 existe e os criterios CA-4.1, CA-4.2, CA-4.3, CA-4.4,
> CA-4.5 passam contra o sistema novo*
> — `.specify/specs/003-classificacao-do-conteudo/tasks.md`, T009

Tudo em `manutencao-da-lista/`, e o `index.ts` dessa pasta e a leitura de
entrada. A historia e UC-08 inteiro menos a protecao do termo padrao, e esta em
quatro verbos — *"criar, renomear, reorganizar e apagar"* —, dos quais o segundo
ja era de T003:

| arquivo | o que e |
|---|---|
| `manutencao-da-lista/escopo-de-manutencao-da-lista.ts` | as duas colaboracoes, e por que esta historia **nao** tem escopo proprio |
| `manutencao-da-lista/caso-de-gestao-de-rotulo.ts` | **CA-4.1**: os **cinco** nomes de capacidade que resolvem para `manage_categories` (`PERM-6`, `capabilities.php:751`) |
| `manutencao-da-lista/permissao-na-gestao-de-rotulos.ts` | **CA-4.1**: os portoes da tela, com os cinco `msgid` do legado byte a byte — e os **tres** portoes de item que sao de T011 |
| `manutencao-da-lista/hierarquia-do-rotulo.ts` | **CA-4.2**: a regra de qual pai cada contexto aceita, o reposicionamento na arvore, e a 🔴 pergunta aberta do contexto plano |
| `manutencao-da-lista/criar-rotulo-no-contexto.ts` | `wp_insert_term()`: a sequencia que **insere antes de perguntar**, e **CA-4.5** no instante zero |
| `manutencao-da-lista/apagar-rotulo-do-contexto.ts` | **CA-4.3**, **CA-4.4** e **CA-4.5**: a cascata de `wp_delete_term()`, com `DB-TRG3` e `DB-TRG4` |
| `manutencao-da-lista/us-4-manutencao-da-lista.test.ts` | 32 testes: os cinco criterios por efeito no banco, por sequencia de comandos e por **ausencia** de comando |

**Quatro entradas novas na superficie do modulo, e duas delas verificam
capacidade** — as **primeiras** deste modulo depois de `classificarConteudo`:

| operacao | no legado | permissao |
|---|---|---|
| `permissaoDeGerenciarRotulos` | o portao de entrada da tela (`wp-admin/edit-tags.php:26`) | `manage_terms` do contexto, **verificada** |
| `permissaoDeCriarRotulo` | o portao da acao de criar (`:86`) | `edit_terms` do contexto, **verificada** |
| `criarRotuloNoContexto` | `wp_insert_term()` (`taxonomy.php:2458`) | `edit_terms`, **nao** verificada: a funcao do legado nao a verifica e o nucleo a chama sem ator |
| `reposicionarRotuloNaHierarquia` | `wp_update_term()` pelo caminho do `parent` | `edit_terms`, **nao** verificada, identica a `renomearRotulo` de T003 |

⚠️ **`apagarRotuloDoContexto` NAO entrou na superficie**, e e a unica peca de
US-4 que fica de fora. T003 nao publicou `removerRotuloDoContexto` por **duas**
razoes — *"sem a protecao do termo padrao (US-5, T011) e sem a cascata (US-4,
T009)"* —, e **T009 fechou a segunda e nao a primeira**: a protecao do termo
padrao e `CA-5.1` e `CA-5.2`, criterios de **T011**. Publicar agora exporia um
caminho que destroi a categoria padrao, e *"apagar dado"* esta na tabela *Nao
negociavel*. A consequencia concreta da ausencia do passo 2, que T011 fecha com
um `if`, esta no bloco 🔴 de `manutencao-da-lista/apagar-rotulo-do-contexto.ts`.

**T009 nao acrescentou porta**, e precisou de tres coisas que nao estao no banco
deste contexto: a decisao de capacidade, a opcao do termo padrao e as duas
contagens que atravessam `posts`. A primeira e `plataforma/autorizacao/` (regra de
dependencia 1 permite o `import`); as outras duas chegam por ligacao tardia
(AD-10), em `OpcoesNaClassificacao` e em `ConteudoNaClassificacao`, que T007 e
T005 ja haviam declarado. **E nao acrescentou escopo proprio**: as tres operacoes
de escrita reusam o escopo de US-2, pela mesma razao que T007 escreveu.

**T009 acrescentou UMA leitura ao armazenamento**, e o arquivo da estrutura ja a
tinha declarada: `termos.confirmarDuplicata()` (`armazenamento/termo.ts`), a
cadeia de `taxonomy.php:2664` que `wp_insert_term()` envia **depois** de inserir.
O cabecalho de `termo.ts` a havia transcrito byte a byte em T002, atribuido a
T003/T009, e separado a cadeia da regra — e e essa divisao que T009 manteve: a
**regra** (inserir, perguntar, desfazer) mora em `manutencao-da-lista/`.

**Nenhum numero novo entrou com T009**, e isso e leitura e nao sorte: os cinco
criterios de US-4 nao tem prazo, contagem nem limite. Os dois valores que a
historia escreve sao sentinelas que T002 ja havia nomeado com teste de borda —
`SEM_ROTULO_PAI` (`0`) e `CONTAGEM_INICIAL_DE_USO` (`0`) —, mais
`SEM_GRUPO_DE_SINONIMOS`. O **P6** manda que onde o legado nao tem numero o
sistema novo tambem nao tenha.

Oito coisas que T009 **nao** fez, e nao e esquecimento:

1. 🔴 **Nao entregou a consulta de termos por filtro**, que e a quinta linha da
   tabela *Contratos* de `plan.md` (*"listar rotulos | contexto, filtros | lista
   com hierarquia e contagem"*). A razao esta escrita desde T002, nesta pagina:
   ela e `WP_Term_Query`, montada *"por fragmento com ponto de extensao entre os
   fragmentos"*, e *"uma versao simplificada dela aqui seria uma segunda consulta
   de termos **sem** os pontos de extensao, que o P2 poe no contrato publico"*. A
   camada de dados por fragmento e **T007 da feature `015`** e nao existe nesta
   arvore, logo as duas saidas possiveis eram transcrever uma consulta sem os
   pontos de extensao (o **P2** trata isso como remover ponto de extensao, e a
   tabela *Nao negociavel* poe fora do alcance do agente) ou construir a camada de
   dados de outra feature dentro desta tarefa. **Nenhuma das duas e esta tarefa**,
   e a ausencia nao impede criterio nenhum: a *hierarquia* e a *contagem* que o
   titulo da historia cita sao as colunas `parent` e `count`, as duas escritas por
   esta pasta. O raciocinio inteiro esta no bloco 🔴 de
   `manutencao-da-lista/index.ts`.
2. **Nao portou `wp_unique_term_slug()` nem a derivacao do apelido a partir do
   nome.** A primeira depende de um laco cujo corpo **nao e legivel nesta arvore**
   (T002 portou as duas leituras dele, `:3188` e `:3190`, e chamou o laco de
   regra); a segunda depende de `sanitize_title()`, que nao existe nesta arvore e
   cuja ausencia T003 ja havia declarado no ramo gemeo. ⚠️ Consequencia: o apelido
   e gravado como veio, e com apelido vazio a linha fica com `''`. O caso de
   colisao **nao** fica sem rede — a confirmacao de duplicata o apanha depois do
   `INSERT` e desfaz as duas insercoes.
3. **Nao portou a recusa de nome duplicado no mesmo nivel nem `missing_parent`.**
   As duas passam por `WP_Term_Query` e os `msgid` delas nao sao reconferiveis
   aqui; `plan.md` **nao** as lista entre os erros do contrato. Consequencia
   declarada em cada arquivo: dois rotulos de mesmo nome e apelidos diferentes sao
   aceitos, e um pai que nao existe e gravado — o orfao que o **P5** chama de
   estado normal e que `target_data_model.md` registra como *"integridade
   **nenhuma**"*.
4. **Nao portou a verificacao de laco na arvore** (`wp_check_term_hierarchy_for_loops()`,
   `:5109`). O corpo dela nao e legivel aqui, ela delega a `wp_find_hierarchy_loop()`
   — de `plataforma/` — e nenhum documento do pacote a descreve. Que o ciclo e
   estado alcancavel no legado esta registrado no proprio pacote
   (`BR-DESCARTAR-007` descreve o laco infinito da exportacao *"com um ciclo de
   pais"*), e **esta tarefa nao estende aquele descarte**: ela so nao inventa a
   deteccao.
5. **Nao portou o agrupamento de sinonimos (`alias_of`).** T003 o atribuiu a T009,
   mas **nenhum criterio de US-4 o menciona** e nenhum caso de `UT-036-*` o
   exercita; o corpo dele nao e legivel aqui. O grupo nasce `0`, que e o valor do
   legado quando ninguem informa `alias_of` (`:2525`).
6. **Nao implementou a protecao do termo padrao nem os tres portoes de item da
   tela.** Os tres (`:117`, `:137`, `:173`) passam pelo `case` de capacidade
   **sobre o termo**, que carrega *"o termo padrao da taxonomia e indestrutivel"*
   (`BR-MIGRAR-091`, `capabilities.php:738`) e e **T011**.
7. **Nao reconta por conta propria.** CA-4.5 e CA-2.3 sao a mesma coluna e o mesmo
   calculo, e `wp_update_term_count()` ja era de T005: a recontagem sai **de
   dentro** da substituicao e da remocao, como no legado.
8. **Nao escreveu os testes do catalogo.** `UT-036-1` a `UT-036-7` sao **T010**,
   que roda em paralelo com esta tarefa.

## Por que uma porta so

`plan.md` desta feature lista tres slots de tecnologia, e so um vira porta:

- **`persistencia`** e porta, e e a segunda porta do plano de migracao: 1.128
  chamadas `$wpdb->` em 98 arquivos. REQ-164 exige que a camada de dados seja a
  unica porta para o banco.
- **`serializacao-de-valor-persistido`** nao e porta: e slot de *formato de
  dado*, e ja existe como modulo puro em `plataforma/serializacao/`. A regra de
  dependencia 1 permite `contextos/` para `plataforma/`.
- **`cache`** e uma das cinco portas de AD-08, mas a borda 5 de
  `target_architecture.md` manda que **nenhuma** metade o use durante a
  coexistencia, e o default de fabrica do slot e nao persistir nada entre
  requisicoes. Porta sem chamador nao entra em T001.

E **nao ha porta de relogio** nem de e-mail: nada nesta feature tem prazo nem
notifica ninguem. Compare com BC-05, que pediu as tres.

> **Isto cobra algo de T002.** O slot de persistencia recomendado fala protocolo
> nativo de MySQL, que neste runtime e assincrono, e AD-04 fixa `contextos/` como
> **sincrono**. Quem construir o adaptador resolve a I/O **antes** de o dominio
> ser chamado, ou expoe fachada sincrona — nao torna a porta uma `Promise`,
> porque isso desfaz AD-04 e AD-03 de uma vez. O mesmo aviso esta no README de
> BC-05, e vale igual aqui.
>
> **T002 respondeu isso do lado dela:** os tres repositorios sao **sincronos**, a
> porta nao devolve `Promise` nenhuma, e nenhum metodo e `async`. O que atravessa
> a fronteira continua sendo `Consulta` e `LinhaDeResultado` — resolver a I/O
> antes, ou por fachada sincrona, segue sendo trabalho de quem construir o
> adaptador.

## Os oito contextos, e as tres leituras que eles cobram

Os oito saem de `create_initial_taxonomies()`, `wp-includes/taxonomy.php:25`, nas
linhas 63, 86, 109, 136, 170, 188, 207 e 226:

| contexto | tipos de objeto | hierarquico | capacidades |
|---|---|---|---|
| `category` | `post` | **sim** | as quatro de categoria |
| `post_tag` | `post` | nao | as quatro de etiqueta |
| `nav_menu` | `nav_menu_item` | nao | `edit_theme_options` nas quatro |
| `link_category` | `link` | nao | `manage_links` nas quatro |
| `post_format` | `post` | nao | as de fabrica |
| `wp_theme` | `wp_template`, `wp_template_part`, `wp_global_styles` | nao | as de fabrica |
| `wp_template_part_area` | `wp_template_part` | nao | as de fabrica |
| `wp_pattern_category` | `wp_block` | nao | as de fabrica |

1. **Um menu de navegacao e um contexto de classificacao**, e cada item dele e
   conteudo do tipo `nav_menu_item`. E a regra de negocio que US-1 cita, e
   `AGG-MenuDeNavegacao` de `target_domain_model.md` a repete: o agregado e
   *"fundido de 2 tabelas de 2 contextos"*. Quem porta esperando uma tabela de
   menus nao a encontra. **A feature 009 depende disto** (`plan.md`, Sequencia).
2. **Nem todo contexto classifica conteudo.** `link_category` se aplica a `link`,
   e e isso que da dono a `term_relationships.object_id` — a coluna polimorfica
   que justificou fundir `taxonomias-e-termos` com `links-e-bookmarks` em BC-02.
   Prender o campo a tipo de conteudo recusaria hoje o que o legado aceita, e a
   resposta 2 proibe.
3. **Nenhum dos oito declara rotulo padrao.** Ha **dois** mecanismos de padrao, e
   confundi-los e o erro mais facil desta feature: o argumento `default_term` de
   registro (nulo nos oito) e a opcao gravada que a regra `P3` consulta, cujo
   nome depende do contexto — `default_category` para `category`,
   `default_term_{nome}` para os demais (`taxonomy.php:2075` e `:2084`,
   `post.php:5435` e `:5437`). **O segundo e o de US-3, e T007 o entregou** em
   `termo-padrao/chave-do-termo-padrao.ts`: e por isso que `category` tem termo
   padrao sem declarar `default_term`, e que o laco dos demais contextos e
   codigo sem chamador de fabrica — ele so age em contexto que uma extensao
   registre.

## O que este modulo nao resolve do registro, e de quem e

`set_props()` resolve 27 propriedades. Este modulo porta as que se derivam **so
dos argumentos declarados**; as que leem estado fora de BC-02 ficam de fora, uma
a uma, com dono:

| propriedade | por que nao aqui | de quem e |
|---|---|---|
| `labels`, `label` | dependem do catalogo gettext | `plataforma/traducao`, feature 015 T009 |
| `rewrite` | depende de `is_admin()`, de `permalink_structure`, de `$wp_rewrite` e de o `init` ja ter disparado | `plataforma/rotas`, BC-08 |
| `query_var` | so se resolve com `is_admin()` | idem |
| `show_in_nav_menus` | em `post_format` o valor e `current_theme_supports( 'post-formats' )` | BC-07, `plataforma/tema` |
| `meta_box_cb`, `meta_box_sanitize_cb` | retorno de chamada de tela | BC-10, `plataforma/telas` |
| `args` | repassado a consulta de conteudo | BC-01, BC-08 |

Inventar valor para qualquer uma seria **decidir** o que o legado calcula com
dado que esta tarefa nao tem. Nenhuma delas e lida por US-1 a US-5.

**E a escolha entre os dois criterios de contagem nao e propriedade de registro.**
`BR-MIGRAR-078` conta duas definicoes de "quantos" na mesma coluna
`term_taxonomy.count`, e `wp_update_term_count_now()` (`taxonomy.php:3625`)
escolhe **na hora de contar**, perguntando se *todos* os tipos de objeto sao tipo
de conteudo registrado (`post_type_exists`) — leitura de
`plataforma/tipos-de-conteudo`, por ligacao tardia. E o que faz `link_category`
cair no calculo generico. O registro carrega so o **terceiro** caminho
(`callbackDeContagem`, vazio nos oito).

## 🔴 Os pontos de extensao do registro, que este esqueleto nao emite

`register_taxonomy()` atravessa quatro pontos de extensao, e `unregister_taxonomy()`
um quinto. O **P2** da constituicao os trata como contrato publico — *"com o
nome, os argumentos, a ordem de disparo e a capacidade de alterar o resultado que
ele tem hoje"* — e a tabela *Nao negociavel* poe remove-los fora do alcance do
agente:

| ponto | onde | o que ele pode mudar |
|---|---|---|
| `register_taxonomy_args` (filtro) | `class-wp-taxonomy.php:316` | **reescreve os argumentos antes** da resolucao |
| `register_{$taxonomy}_taxonomy_args` (filtro) | `class-wp-taxonomy.php:337` | idem, por contexto |
| `registered_taxonomy` (acao) | `taxonomy.php:570` | — |
| `registered_taxonomy_{$taxonomy}` (acao) | `taxonomy.php:588` | — |
| `unregistered_taxonomy` (acao) | `taxonomy.php:632` | — |

**Nenhum deles e emitido, e nao e esquecimento:** o barramento de hooks nao
existe nesta arvore e **nenhuma tarefa do pacote o constroi**. `REQ-162`
(*"declarar os pontos de extensao com contrato explicito"*) esta em
[`do-not-rewrite.md`](../../../do-not-rewrite.md) linha 35, parado na coluna
`bloqueado` — *"nao e trabalho pendente, e escopo recusado"*. A mesma ausencia
esta registrada em `plataforma/autorizacao/index.ts`, que a contornou do mesmo
jeito.

O que T001 faz e **deixar a ordem documentada** no arquivo que a executaria
(`registro/contexto-de-classificacao.ts`), para que a tarefa que um dia construir
o barramento encaixe os cinco na posicao do legado. Isto e declaracao, nao
decisao: **a tensao entre o P2 e o `wont` de `REQ-162` e anterior a esta tarefa e
nao foi resolvida por ela.**

## O que ninguem decidiu, e que T001, T002, T003, T005, T007 e T009 nao decidiram tampouco

As duas primeiras estao em `spec.md`, secao *Perguntas em aberto*. **As duas
batiam em T002, e T002 as deixou abertas** — o que ela fez foi reproduzir o
legado, que e o unico caminho que nao antecipa a decisao. A terceira a setima sao
**novas**, e nenhum documento do pacote as menciona: a terceira e de T003, a
quarta de T005, a quinta de T007, e a **sexta e a setima sao de T009**.

1. **O discriminador do objeto classificado.** `term_relationships.object_id` e
   polimorfico por convencao e nada na linha diz se o objeto e conteudo ou link.
   O `plan.md` escreve *"o modelo novo precisa de discriminador"* na tabela de
   Modelo de dados; a `spec.md` registra a mesma questao como **nao decidida**, e
   o risco 1 do plano repete. A resposta 2 proibe que a escolha recuse hoje o que
   o legado aceita.
   **O que T002 fez:** a coluna ficou como esta — sem discriminador, aceitando
   conteudo e marcador —, o campo se chama `objetoId` e nao `conteudoId`, e nenhum
   metodo pergunta o tipo do objeto. O item 2 de *O que seria modelado diferente, e
   nao e* (`target_data_model.md`) chama o discriminador de *"o conserto certo e a
   mudanca de esquema errada **nesta fase**"*, e a AD-11 nao permite mudanca de
   esquema. O raciocinio inteiro, com a tabela de quem diz o que, esta no cabecalho
   de `armazenamento/vinculo.ts`. **A pergunta continua aberta.**
2. **A contagem gravada contra a recalculada na leitura.** Recalcular e mais
   correto e muda o que a interface devolve quando alguem escreve na juncao por
   fora. Manter o valor gravado, com a possibilidade de divergir, e o
   comportamento identico. Ninguem decidiu.
   **O que T002 fez:** le e grava o valor gravado, e **nao ha nenhuma leitura que
   recalcule** — a ausencia e a resposta de nao decidir. `target_data_model.md` poe
   a divergencia como estado normal: *"um sistema que os mantivesse sempre corretos
   teria comportamento **diferente** do legado"*. E a escolha entre os **dois
   criterios** de calculo (`DB-TRG2`) tambem nao foi feita: T002 entrega a coluna, a
   escrita dela e o criterio generico (`COUNT(*)` da juncao, uma tabela so); o
   criterio de conteudo atravessa `posts`, que e BC-01, e e da tarefa da contagem.
3. 🔴 **O rotulo compartilhado, e se a renomeacao propaga ou divide. E a unica
   contradicao direta entre um criterio de aceite desta feature e o codigo do
   legado, e T003 a encontrou lendo `wp_update_term()`.**

   **CA-1.2** e `UT-033-2` dizem *"renomear o rotulo muda o nome em todos os
   contextos em que ele serve"*. O legado, entre a leitura e o `UPDATE` do nome,
   chama `_split_shared_term()` (`wp-includes/taxonomy.php:3383`): se o rotulo
   serve mais de um contexto, ele **insere uma linha nova em `terms`**, repoe a
   linha daquele contexto nela, reposiciona os filhos, grava o par na opcao
   `_split_terms` e so entao renomeia. Ou seja: **desfaz o compartilhamento em
   vez de propagar o nome.**

   As duas leituras coincidem em tudo que uma instalacao nova alcanca, e e por
   isso que T003 entregou o criterio sem decidir nada: nenhuma operacao do legado
   7.1.2 cria rotulo compartilhado (o inventario, com as tres funcoes e as
   ancoras, esta em `rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts`), e
   para rotulo de um contexto so a divisao **devolve o identificador sem emitir
   comando nenhum** (`:4330`). O estado de CA-1.1 e representavel e legivel, e so
   aparece por escrita direta no armazenamento — que e como o legado tambem o
   aceita, por ser dado de instalacao antiga, e `upgrade_230()`, que o criou, esta
   entre os 38 portoes historicos de `discard_log.md`.

   **O que T003 fez:** renomeia pelo `UPDATE` em `terms`, que e o comportamento
   do legado para todo rotulo de um contexto so; **nao** portou a divisao (ela
   escreve em `options`, e a primeira porta de opcoes chega com T007); e deixou um
   teste com 🔴 no nome que **fixa** o comportamento de hoje, para que a
   divergencia nao passe em silencio. Nenhum dos 19 documentos de
   `.specify/migration/` menciona rotulo compartilhado, divisao de rotulo ou
   `_split_shared_term` — nem `target_business_rules.md`, nem `parity_specs.md`,
   nem `discard_log.md`, nem `pending_decisions.md`.

   **Para quem decidir:** se a resposta for *"o compartilhamento se preserva"*, a
   divisao sai do escopo e `renomear-rotulo.ts` fica como esta. Se for *"o legado
   manda"*, entram `_split_shared_term()`, `wp_get_split_term()`,
   `wp_term_is_shared()` e `_wp_batch_split_terms()` (tarefa agendada, BC-11), com
   porta de opcoes — e **CA-1.2 e UT-033-2 precisam de nova redacao**, porque
   passam a descrever o oposto do comportamento. O P1 e literal: *"Divergir exige
   uma decisao humana registrada, citada no codigo que divergiu"*.

4. 🔴 **Onde a capacidade de criar termo e cobrada no caminho de classificar, e
   essa e de T005.**

   **CA-2.2** diz *"criar termo novo pela tela de edicao exige a capacidade de
   criar termo daquele contexto; sem ela o rotulo desconhecido e ignorado, sem
   criar nada"*, e UC-05 repete no passo 3 e na excecao. A leitura do legado
   mostra que o portao de `edit_terms` existe — em **cinco** lugares, todos no
   caminho que **cria** o termo: `_wp_ajax_add_hierarchical_term()`
   (`wp-admin/includes/ajax-actions.php:613`), `wp_ajax_add_tag()` (`:1116`), a
   caixa de categoria da tela (`wp-admin/includes/meta-boxes.php:676`), o
   XML-RPC (`class-wp-xmlrpc-server.php:1685`) e a tela de lista de termos.

   **No caminho de atribuicao ele nao existe:** `wp_set_object_terms()` nao tem
   `current_user_can` no corpo e chama `wp_insert_term()` direto
   (`wp-includes/taxonomy.php:2896`), e a caixa de etiqueta da tela e cobrada por
   `assign_terms` e nao por `edit_terms` (`meta-boxes.php:582`). O efeito em
   papeis de fabrica e conhecido: **autor cria etiqueta e nao cria categoria**.

   **O que T005 fez:** nao cobra `edit_terms` ao atribuir, porque cobrar
   recusaria a etiqueta que o legado cria para o autor (P1, e a resposta 2). Em
   contexto **hierarquico** CA-2.2 vale pelo mecanismo do proprio legado — a
   normalizacao de `wp_set_post_terms()` transforma o nome em `0`
   (`wp-includes/post.php:5212`) e o `0` sai de `term_exists()` sem consultar o
   banco (`taxonomy.php:1651`), logo o rotulo desconhecido **e** ignorado sem
   criar nada —, e isso esta afirmado por teste. Em contexto **plano** a criacao
   depende de `assign_terms`, como no legado.
   **Para quem decidir:** a analise inteira, com as duas saidas possiveis e o que
   cada uma obriga a reescrever na redacao de CA-2.2, esta no cabecalho de
   `vinculo-de-objeto/rotulos-informados.ts`.

5. 🔴 **O corpo dos dois ramos de `P3` no caminho de gravacao nao pode ser
   reconferido nesta arvore, e essa e de T007.**

   **A instalacao do legado nao esta no disco desta maquina.** A ultima secao
   deste arquivo afirmava *"a arvore 7.1.2 analisada esta no disco"* — e isso
   deixou de valer: nao ha `wp-includes/post.php` para abrir, e nenhuma varredura
   da maquina encontra `wp-settings.php`. O oraculo **executavel** ja era ausente
   por registro (`oracleAvailable: false`, T001 da feature `015`); o que mudou e
   que a **leitura estatica** tambem nao e mais possivel aqui.

   O que T007 fez foi implementar a regra como o pacote a especifica
   (`BR-MIGRAR-003`, `UC-05`, `UC-03`, `spec.md` CA-3.1 a CA-3.4,
   `backlog/tests.md` `UT-035-1` a `UT-035-5`) mais a transcricao **merged** do
   laco da publicacao que T003 de BC-01 deixou em
   `../conteudo/publicacao/termo-padrao-na-publicacao.ts`, com os cinco ramos e as
   linhas. **Nada foi escrito de memoria**, e os dois pontos que o pacote nao
   especifica ficaram marcados:

   | ponto | o que T007 fez | por que esse lado |
   |---|---|---|
   | `post.php:4719` testa a opcao antes de usa-la? | **testa**: opcao `0` faz a regra desistir | a alternativa faria a substituicao integral resolver `0` como inexistente e **remover** os vinculos de `category`, que e o oposto de CA-3.4 — e a tabela *Nao negociavel* poe *"apagar dado"* fora do alcance do agente |
   | a ordem interna de `:5062`-`:5087` | lista informada vence, depois vinculos existentes, depois a opcao | e a unica ordem que satisfaz CA-3.1 **e** nao apaga termo ja atribuido, que e o ramo 2 do laco gemeo (*"Do not modify previously set terms"*) |

   Os dois tem teste, e o primeiro tem 🔴 no nome
   (`termo-padrao/us-3-termo-padrao.test.ts`), para que a troca nao passe em
   silencio. **Para quem tiver o oraculo:** confira as duas linhas; se o legado
   divergir, a mudanca vem com a referencia da decisao no codigo, como o **P1**
   exige. A analise inteira esta no bloco 🔴 de
   `termo-padrao/termo-padrao-na-gravacao.ts`.

6. 🔴 **Onde o contexto plano recusa a hierarquia, e essa e de T009.**

   **CA-4.2** diz *"contexto hierarquico aceita termo pai e mantem a arvore;
   contexto plano **recusa** hierarquia"*, e `plan.md` poe *"hierarquia em
   contexto plano"* na coluna de **erros** do contrato *criar ou renomear
   rotulo*. UC-08 diz a mesma coisa pelo avesso (*"Tags nao tem hierarquia e nao
   tem termo padrao"*), e T002 ja havia escrito, no arquivo da estrutura, que
   *"contexto plano grava `0` em toda linha, porque a hierarquia e recusada antes
   da gravacao (CA-4.2, regra de T009)"*.

   **As quatro fontes concordam no efeito no banco** — toda linha de um contexto
   plano tem `parent = 0` — **e nenhuma diz se o chamador recebe um erro ou se o
   pai e simplesmente descartado**. As duas leituras escrevem a mesma linha; o
   que muda e so o valor devolvido. E o ponto exato em que o legado recusa **nao
   e reconferivel nesta arvore**: nao ha `wp-includes/taxonomy.php` para abrir.

   **O que T009 fez:** descarta o pai e grava `0`, sem devolver erro. Tres
   razoes — devolver erro exigiria **inventar um codigo de `WP_Error` que o
   pacote nao nomeia** (e `resolucao-do-rotulo-no-contexto.ts` ja fixou que *"o
   P8 proibe remover superficie; nao autoriza acrescentar"*); recusar e a direcao
   que a resposta 2 proibe (*"recusar hoje o que o legado aceita"*); e nesta
   mesma historia a recusa de **CA-4.1 tambem mora na superficie** e nao no
   nucleo, o que da uma leitura que reconcilia as quatro fontes sem divergencia
   nenhuma — a tela de um contexto plano nem oferece campo de pai. Ha **dois**
   testes com 🔴 no nome, um por operacao que escreve a coluna.

   **Para quem decidir:** se o legado devolver `WP_Error`, entra um codigo em
   `rotulo-e-contexto/erro-de-termo.ts` **com o `msgid` do legado** e os dois
   pontos de entrada de `manutencao-da-lista/hierarquia-do-rotulo.ts` passam a
   devolve-lo; **o efeito no banco nao muda**. A analise inteira esta no bloco 🔴
   daquele arquivo.

7. 🔴 **O que a cascata faz com um termo padrao informado que nao existe, e essa
   tambem e de T009.**

   `wp_delete_term()` aceita `$args['default']`, e T003 descreveu o passo
   (`:2089`-`:2098`) como *"`$args['default']` e `force_default`, e **a validacao
   do padrao informado**"*. O que *"validacao"* faz com o padrao invalido — se o
   descarta, se recusa a operacao, ou se o grava mesmo assim — **nao esta em
   documento nenhum do pacote** e nao e reconferivel aqui.

   **O que T009 fez:** descarta o informado e volta para o da opcao do contexto.
   Aceitar um rotulo que nao existe faria a substituicao integral de US-2
   resolve-lo como inexistente e **remover** o vinculo em vez de troca-lo — o
   oposto de CA-4.4 —, e *"apagar dado"* esta na tabela *Nao negociavel*. Ha
   teste com 🔴 no nome.

   Junto com ela viaja uma terceira, menor e sem consequencia de resultado: o
   `orderby` da leitura inversa do passo 7 da cascata, que esta tarefa emite sem
   `ORDER BY`. O conjunto de linhas e o mesmo nas duas ordenacoes, porque o que a
   regra faz com ele e `count()` e diferenca de conjunto; o que muda e o texto da
   clausula. As duas estao na tabela 🔴 de
   `manutencao-da-lista/apagar-rotulo-do-contexto.ts`.

E havia uma quarta — agora oitava — que o plano chama de risco 3 e a spec nao poe
entre as perguntas: **a fusao de `terms` com `term_taxonomy`**. Esta T002 resolveu, e
resolveu por leitura e nao por escolha: a fusao e do *aggregate*, nao das tabelas
(`target_domain_model.md` e literal — *"o esquema fica intacto (AD-11), e as duas
tabelas continuam existindo"*; `target_data_model.md` repete na coluna de
transformacao de `term_taxonomy`). Logo existem **duas tabelas e uma consulta que
as junta** (`armazenamento/termo.ts`), e o identificador que a juncao referencia
continua sendo o `term_taxonomy_id` do legado — que e o que o risco 3 temia ver
mudar. **A fusao fisica nao foi feita, e ela e o item 3** daquela mesma secao de
`target_data_model.md`.

E uma nona, que nenhuma das duas listas traz e que **vale dizer para a proxima
onda**: `plan.md` escreve, na linha de `term_taxonomy`, que *"a hierarquia do
legado atravessa a tabela errada... Corrigir isso e interno e invisivel, e e a
parte que mais simplifica"*. **T002 nao corrigiu**, pela mesma razao de zero
colunas e AD-11: a coluna `parent` continua guardando um `term_id`, e o campo se
chama `rotuloPaiId` para que o erro fique visivel em vez de escondido num nome
curto. Ver o cabecalho de `armazenamento/rotulo-no-contexto.ts`.

## O que esta feature nao descarta

`spec.md` e literal: *"nenhum card de descarte nesta feature, e nada mais a
declarar fora de escopo"*. Nenhum `REQ-033` a `REQ-037` aparece em
[`do-not-rewrite.md`](../../../do-not-rewrite.md), e nenhuma linha de
`discard_log.md` alcanca classificacao. Logo aqui **nao** existe o conflito entre
card `wont` e resposta humana que o **P8** chama de *"o principio mais fragil
deste pacote"* — e isso e uma boa noticia que vale escrever, porque e a excecao
no pacote.

## Como se confere que este modulo tem paridade

`parity_specs.md` fixa criterio **por area** (Decisao 2), e desta feature saem
tres:

| o que | criterio |
|---|---|
| a substituicao integral dos vinculos e as contagens | **efeito no banco**, com `@cascata` — a tag e obrigatoria em *"exclusao de conteudo e de termo"* |
| as invariantes de `AGG-Termo` | `@invariante`, obrigatoria em *"todo fluxo cujo aggregate tem invariante"* |
| a tela de lista de termos | `@paridade-contrato-de-tela` — `SCR-044 lista-de-termos` (`wp-admin/edit-tags.php`) esta entre as 99 telas em **modo modernizado**, e e marcada como tela critica |

⚠️ **Nao existe `.feature` de classificacao em `parity_tests/`**: dos 20 arquivos
do conjunto, cinco citam termo ou taxonomia de passagem (`01`, `02`, `03`, `15`,
`19`) e nenhum e desta feature. **E nenhum deles e executavel hoje:** o oraculo executavel do legado nao existe nesta arvore
(`oracleAvailable: false`), e levanta-lo e T001 da feature `015-plataforma-transversal`.

Por isso os testes deste modulo conferem **a leitura estatica das ancoras** do
legado, com `arquivo:linha` no comentario de cada afirmacao, e nao a execucao do
original. O que a leitura estatica nao resolve — valor de opcao em execucao,
efeito de cache, HTML emitido — fica marcado como "fecha contra o oraculo".

🔴 **E desde T007 nem a leitura estatica e possivel nesta arvore de trabalho.**
Ate T005 este paragrafo dizia *"a arvore 7.1.2 analisada esta no disco"*; **ela
nao esta**: nao ha `wp-includes/post.php` para abrir nesta maquina, e nenhuma
varredura encontra `wp-settings.php`. As ancoras que os arquivos deste modulo
citam continuam valendo como **referencia registrada** — vem do pacote e das ondas
que as transcreveram quando a arvore estava legivel —, mas **nenhuma tarefa a
partir de T007 pode reconferi-las**. Quem retomar com a arvore em disco tem duas
coisas a fazer: reconferir os dois pontos do item 5 de *O que ninguem decidiu*, e
corrigir ou confirmar este paragrafo.

**O que T002 entrega para esse criterio, concretamente:** a area 3 da Decisao 2 e
*"esquema e efeito de escrita no banco"*, e compara *"snapshot + sequencia de
comandos"*. E por isso que `armazenamento/porta-falsa.ts` **registra consulta** em
vez de simular banco, e que os testes afirmam a cadeia e os parametros de cada
comando — inclusive os tres casos em que o legado **nao emite comando nenhum**
(lista de vinculos vazia na escrita ordenada e na remocao, e `atualizar` sem campo
informado). A unica diferenca de texto declarada contra o legado e a lista `IN` da
remocao de vinculo, que o legado monta por concatenacao e REQ-164 proibe; esta
registrada em `armazenamento/vinculo.ts`, no metodo.

**E o que T003 entrega para o mesmo criterio:** a suite de US-1 afirma **qual
comando sai, com quais parametros e em que ordem**, com a mesma porta falsa. Tres
afirmacoes dela sao de ordem e nao de conteudo, porque no legado a ordem e a
regra: os dois `UPDATE` da renomeacao saem **sempre** e nessa sequencia
(`taxonomy.php:3414` e `:3446`); a contagem de contextos e feita **depois** do
`DELETE` da linha de contexto e e ela que decide o segundo `DELETE` (`:2202` e
`:2214`); e a ordem dos contextos de um tipo de objeto e a de registro, porque e
ela que fixa a sequencia de comandos de quem itera a lista. Mais quatro
afirmacoes de que **nenhum comando sai** (contexto nao registrado nas duas
operacoes de escrita, nome vazio, e as tres leituras de declaracao, que nao tocam
o banco) e uma de que nenhum comando menciona `term_relationships`, porque a
cascata e de T009.

**E o que T005 entrega:** a primeira linha daquela tabela — *"a substituicao
integral dos vinculos e as contagens"*, com `@cascata`. A suite de US-2 afirma a
**sequencia inteira** da substituicao, passo a passo, com os textos dos dez
comandos na ordem do legado, e afirma o conjunto exato do que sumiu e do que ficou
que o **P5** cobra: o `DELETE` alcanca **so** a juncao, e nenhum comando toca
`terms` nem `term_taxonomy` a nao ser para gravar a contagem. Oito afirmacoes sao
de que **nenhum comando sai** — contexto nao registrado, tipo de objeto nao
declarado, capacidade ausente, identificador inexistente, rotulo por nome (nos
dois contextos), rotulo compartilhado no conjunto anterior, lista vazia na
recontagem e `acrescentar` nas tres coisas que ele protege. E tres sao de **qual
criterio de contagem** foi usado, porque `DB-TRG2` e o contador *"que mais
facilmente se unifica por engano"*: a colaboracao com BC-01 e um duble que
registra as chamadas, e e ele que torna a escolha afirmavel sem inspecionar o SQL
de outro contexto.

As diferencas de texto declaradas contra o legado, nesta tarefa, sao **tres**, e
as tres estao registradas no metodo que as emite: as duas listas `IN` que o legado
monta por concatenacao e REQ-164 proibe (`listarRotulosPorIdsNoContexto` e a
leitura inversa), e o espaco em branco da leitura inversa — o legado emite
`SELECT $distinct $fields` com `$distinct` vazio e quebra as clausulas em linhas
(`class-wp-term-query.php:752`). O conjunto de linhas e o mesmo nas tres.

**E o que T007 entrega para o mesmo criterio:** a segunda linha daquela tabela —
`@invariante`, porque **CA-3.4 e uma invariante**. O cenario de `PT-002` que cobre
esta regra e literal: *"Dado um conteudo do tipo padrao sem nenhum termo de
categoria, fora de rascunho automatico / Quando ele e gravado / Entao as duas
metades vinculam a categoria padrao / E na publicacao a regra se repete para toda
taxonomia que tenha termo padrao / E o vinculo gravado e o mesmo nas duas"*
(`.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
que cobre `P1` e `P3`-`P7`). A suite de US-3 afirma as cinco clausulas dele contra
o sistema novo, pela mesma porta falsa — e **nao** contra o original, pela razao
do bloco 🔴 acima.

Metade das afirmacoes de T007 e de que **nenhum comando sai**, porque metade dos
criterios e ausencia: rascunho automatico (nem juncao nem opcao sao lidas), tipo
que nao e o padrao, contexto que nao declara padrao, lista informada presente,
opcao que vale `0`, e capacidade ausente no mapa de contextos. E duas sao de
**qual identificador** a juncao grava — o `term_taxonomy_id` resolvido, e nunca o
`term_id` que `default_category` guarda —, porque essa e a troca que esta historia
convida a fazer. Nenhuma diferenca de texto nova contra o legado: T007 nao
acrescentou consulta alguma ao armazenamento.

**E o que T009 entrega:** a `@cascata`, que `parity_specs.md` torna
**obrigatoria** em *"exclusao de conteudo e de termo"* — e esta e a exclusao de
termo, a unica desta feature. A suite de US-4 afirma a sequencia inteira da
cascata, comando por comando na ordem do legado, e o conjunto exato do que sumiu
e do que ficou que o **P5** cobra: o `DELETE` alcanca **so** a juncao, nenhum
comando menciona `wp_posts`, e os tres `DELETE` da operacao sao exatamente o
vinculo, a linha de contexto e a linha de rotulo — este ultimo **condicional**,
como em CA-1.3. Mais a `@invariante`, porque `DB-TRG4` e a **terceira** das quatro
invariantes de `AGG-Termo`, afirmada pelos dois lados: o objeto que tinha so
aquele termo recebe o padrao, e o que tinha outro perde so o vinculo.

Tres afirmacoes de T009 sao de **ordem** e nao de conteudo, porque no legado a
ordem e a regra: a criacao **insere antes de perguntar**, e os dois `DELETE` do
desfazimento saem na ordem `terms` e depois `term_taxonomy` (`:2685` e `:2686`) —
o **inverso** da ordem da exclusao de verdade; o reposicionamento dos filhos sai
**antes** do laco dos objetos e depois da resolucao do par, porque e dela que vem
o avo; e a recontagem sai **de dentro** da substituicao e da remocao, nunca de
fora. Seis afirmacoes sao de que **nenhum comando sai**: os tres portoes de
CA-4.1 (que nao tocam o banco), contexto nao registrado e rotulo inexistente na
exclusao, nome vazio e contexto nao registrado na criacao, contexto plano na
leitura de filhos, e o `UPDATE` corretivo de apelido que esta tarefa nao emite.

A diferenca de texto declarada contra o legado, nesta tarefa, e **uma**, e ela e
de parentese: a confirmacao de duplicata emite `ON ( tt.term_id = t.term_id )`,
com os parenteses do legado, enquanto as outras duas cadeias fundidas deste
contexto nao os tem — esta registrada no metodo, em `armazenamento/termo.ts`. E
**uma diferenca de sequencia**, tambem declarada no metodo que a produz: no
caminho da exclusao o legado emite a leitura do termo **tres** vezes (`:2062`,
`:2115` e `:2149`) e este porte a emite **duas**, nas duas posicoes em que ha
consumidor.
