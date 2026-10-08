# Modulo de classificacao — BC-02

Entregue por **T001** (o esqueleto), **T002** (a forma de armazenamento) e
**T003** (a separacao entre rotulo e contexto, US-1) da feature
`003-classificacao-do-conteudo`. Este arquivo e a leitura obrigatoria de quem
pegar T005 em diante: ele diz o que ja esta decidido, o que esta decidido **em
outro lugar**, e o que ninguem decidiu.

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
| `modulo.test.ts` | afirma a entrega de T001, T002 e T003 na superficie do modulo, e as invariantes de arquitetura |
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
`armazenamento/`, que e T002, e por `rotulo-e-contexto/`, que e T003 — e **so por
elas**, sempre pelos repositorios de T002 e nunca por consulta propria.

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
   `post.php:5435` e `:5437`). **O segundo e o de US-3, e e T007.**

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

## O que ninguem decidiu, e que T001, T002 e T003 nao decidiram tampouco

As duas primeiras estao em `spec.md`, secao *Perguntas em aberto*. **As duas
batiam em T002, e T002 as deixou abertas** — o que ela fez foi reproduzir o
legado, que e o unico caminho que nao antecipa a decisao. A terceira a lista
abaixo e **nova, e e de T003**: nenhum documento do pacote a menciona.

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

E havia uma quarta, que o plano chama de risco 3 e a spec nao poe entre as
perguntas: **a fusao de `terms` com `term_taxonomy`**. Esta T002 resolveu, e
resolveu por leitura e nao por escolha: a fusao e do *aggregate*, nao das tabelas
(`target_domain_model.md` e literal — *"o esquema fica intacto (AD-11), e as duas
tabelas continuam existindo"*; `target_data_model.md` repete na coluna de
transformacao de `term_taxonomy`). Logo existem **duas tabelas e uma consulta que
as junta** (`armazenamento/termo.ts`), e o identificador que a juncao referencia
continua sendo o `term_taxonomy_id` do legado — que e o que o risco 3 temia ver
mudar. **A fusao fisica nao foi feita, e ela e o item 3** daquela mesma secao de
`target_data_model.md`.

E uma quinta, que nenhuma das duas listas traz e que **vale dizer para a proxima
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
original. A arvore 7.1.2 analisada esta no disco; o que a leitura estatica nao
resolve — valor de opcao em execucao, efeito de cache, HTML emitido — fica
marcado como "fecha contra o oraculo".

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
