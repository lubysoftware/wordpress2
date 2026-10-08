# Modulo de classificacao — BC-02

Esqueleto entregue por **T001** da feature `003-classificacao-do-conteudo`. Este
arquivo e a leitura obrigatoria de quem pegar T002 em diante: ele diz o que ja
esta decidido, o que esta decidido **em outro lugar**, e o que ninguem decidiu.

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
| `modulo.test.ts` | afirma a entrega de T001 e as invariantes de arquitetura |
| `registro/registro-de-contextos.test.ts` | afirma os oito, a ordem, os defaults e as duas recusas |

**Nenhuma leitura nem escrita no banco acontece aqui.** A porta chega ao modulo
e nenhum arquivo de `registro/` a toca — ha teste que afirma isso
(`criar o modulo nao toca na porta`). As tres estruturas de armazenamento sao
**T002**.

**Um numero so aparece neste modulo, e ele tem teste de borda nos dois lados:**
os **32 bytes** do nome do contexto (`LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO`), com
o valor de fabrica do legado, como o **P6** da constituicao exige. Os numeros
desta feature que ainda nao chegaram — o `1` com que a categoria padrao e semeada
e os dois criterios de contagem — entram nas tarefas que os implementam. Numero
que aparece aqui antes da tarefa dele e numero sem teste de borda.

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

## O que ninguem decidiu, e que T001 nao decidiu tampouco

As duas estao em `spec.md`, secao *Perguntas em aberto*, e **as duas batem em
T002 primeiro**:

1. **O discriminador do objeto classificado.** `term_relationships.object_id` e
   polimorfico por convencao e nada na linha diz se o objeto e conteudo ou link.
   O `plan.md` escreve *"o modelo novo precisa de discriminador"* na tabela de
   Modelo de dados; a `spec.md` registra a mesma questao como **nao decidida**, e
   o risco 1 do plano repete. A resposta 2 proibe que a escolha recuse hoje o que
   o legado aceita. **T001 nao a tocou** — nao ha estrutura de armazenamento neste
   modulo —, e quem abrir T002 esbarra nela na primeira linha.
2. **A contagem gravada contra a recalculada na leitura.** Recalcular e mais
   correto e muda o que a interface devolve quando alguem escreve na juncao por
   fora. Manter o valor gravado, com a possibilidade de divergir, e o
   comportamento identico. Ninguem decidiu.

E ha uma terceira, que o plano chama de risco 3 e a spec nao poe entre as
perguntas: **a fusao de `terms` com `term_taxonomy`** e do *aggregate*, nao das
tabelas (`target_domain_model.md` e literal: *"o esquema fica intacto (AD-11), e
as duas tabelas continuam existindo"*), mas ela *"muda o identificador que a
juncao referencia"*, e a decisao fundadora de retrocompatibilidade sugere que o
ecossistema usa esse identificador. **Isto tambem e de T002.**

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
