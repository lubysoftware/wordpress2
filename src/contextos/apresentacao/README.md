# Modulo de apresentacao — BC-07, feature `009-apresentacao-e-personalizacao`

Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, as duas
portas e as tres areas do ciclo), **T002** (o conjunto de alteracoes como tipo de
conteudo proprio e a configuracao do tema como dado), **T003** (US-1, a
pre-visualizacao), **T011** (US-5, montar o menu) e **T015** (US-7, organizar os
componentes). Este arquivo e a leitura
obrigatoria de quem pegar a tarefa seguinte: ele diz o que ja esta decidido, o que
esta decidido **em outro lugar**, e o que **ninguem decidiu**.

> 🔴 **Antes de qualquer coisa, se a sua tarefa e T007 (US-3, informar o estado
> gravado):** **CA-3.3 contradiz o comportamento que o P1 manda reproduzir**, e
> T001 **nao resolveu** nem o podia. Secao *O que ninguem decidiu*, item 1.

> 🔴 **E se a sua tarefa e T009 (US-4, agendar a aplicacao):** o agendamento
> depende da fila da feature `011`, **cujas historias estao em conflito aberto com
> a resposta 10**. `spec.md` registra: *"enquanto esse conflito nao se resolver, o
> comportamento agendado desta historia fica indefinido"*. Secao *O que ninguem
> decidiu*, item 2.

> ⚠️ **E se a sua tarefa e T013 ou T019:** UC-30 e UC-31 **nao tem
> cenario de paridade de fluxo** — `parity_specs.md` conta 43 de 47, e os dois sao
> de fora da conta. O oraculo da sua tarefa e o contrato de tela mais o catalogo
> `backlog/tests.md`. Secao *Como esta entrega se confere*. **T013** comeca pela
> secao *O que T011 deixou de proposito para T013*.

> 🔴 **E se a sua tarefa e T019 (US-9):** `retrieve_widgets()` ficou de fora de
> T015 de proposito, e **a funcao que o legado usa para remapear devolve sozinha
> os componentes ao tema que volta** — o que UC-31 e CA-9.3 negam. Secao *O que
> T015 deixou de proposito para T019*, item 1, antes da primeira linha.

## O que T001 entrega, e so isso

> *personalizacao, menus e componentes de area carregam no mesmo passo, com as
> portas de dados e de cliente externo declaradas, porque o ciclo de dependencia
> entre eles nao permite ordem interna*
> — `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`, T001

| arquivo | o que e |
|---|---|
| `index.ts` | a composicao: recebe as duas portas e devolve o modulo com as tres areas |
| `ciclo-de-apresentacao.ts` | o ciclo medido entre as tres areas, as arestas com ancora, e a ligacao tardia que o corta |
| `portas/porta-de-dados.ts` | a unica porta deste modulo para o banco |
| `portas/porta-de-cliente-externo.ts` | a **unica** chamada de saida de BC-07, que e o catalogo de fontes |
| `personalizacao/area-de-personalizacao.ts` | a area do Customizer — US-1 a US-4 |
| `menus/area-de-menus.ts` | a area dos menus — US-5 e US-6 |
| `componentes-de-area/area-de-componentes-de-area.ts` | a area dos widgets em sidebars — US-7 e US-9 |
| `modulo.test.ts` | afirma a entrega de T001 e as invariantes que um esqueleto quebra em silencio |

## O que T002 entrega, e so isso

> *o conjunto de alteracoes existe como tipo de conteudo proprio e a configuracao
> declarada pelo tema e lida como dado, pela porta de dados, com a mesma forma do
> legado*
> — `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`, T002

As duas estruturas da secao *Modelo de dados* do `plan.md` que sao banco nesta
tarefa, e **nenhuma das duas tem tabela propria**:

| arquivo em `armazenamento/` | o que e |
|---|---|
| `tipo-do-conjunto.ts` | o registro de `customize_changeset` transcrito de `post.php:220`-`:264`, como **dado**, e a resolucao de capacidade que ele produz |
| `estado-do-conjunto.ts` | `SM-CHANGESET`: os cinco estados, os **quatro** aceitos na escrita, a lixeira como destino e o grafo de transicoes |
| `conjunto-de-alteracoes.ts` | a linha de `posts`, o identificador (UUID em `post_name`), o valor gravado em **JSON** e a unica escrita que este contexto faz em `posts` por conta propria |
| `configuracao-do-tema.ts` | `AGG-Tema` pelo lado do dado: o tema ativo e as modificacoes, com a cadeia de recurso de `get_theme_mods()` inteira |
| `opcao.ts` | a linha de `options`, com a sequencia de comandos de `get`/`add`/`update`/`delete_option` e o marcador de carga automatica |
| `chaves-e-tabelas.ts` | os nomes de tabela, de tipo, de opcao e de modificacao — nenhum se monta a mao fora dali |
| `leitura-de-linha.ts`, `porta-falsa.ts` | a leitura de coluna e o duplo que **registra comando** |
| `armazenamento.test.ts` | 50 afirmacoes de forma, byte e **sequencia de comandos** |

**Nenhuma regra de negocio esta implementada, e nenhuma operacao esta exposta**: a
superficie do modulo cresceu um campo (`armazenamento`), e `modulo.test.ts`
continua congelando as quatro listas. O armazenamento nao decide, nao recusa e nao
autoriza nada — `satisfaz: — (infraestrutura)`.

**Dois achados de forma que mudam o byte, e que um porte distraido troca:**

1. 🔴 **O conjunto guarda o valor em JSON, nao no formato serializado do PHP**
   (`class-wp-customize-manager.php:2921`), com `JSON_UNESCAPED_SLASHES` e
   `JSON_PRETTY_PRINT` — e **sem** `JSON_UNESCAPED_UNICODE`, logo todo caractere
   fora de ASCII sai como `\uXXXX` minusculo. As **outras** duas estruturas
   (`theme_mods_{folha}` e a opcao de componentes por area) guardam arranjo no
   formato nativo do PHP. E conjunto vazio grava `[]`, nao `{}`.
2. **`theme_mods_{folha}` tem a folha de estilo DENTRO do nome da opcao**, e e
   isso que faz dois temas nunca colidirem e que torna *"a configuracao do tema
   anterior permanece nas opcoes"* (UC-32) verdade sem codigo nenhum.

⚠️ **Uma consequencia declarada, nao um defeito:** sem cache de objeto — porta de
AD-08 que esta feature so declara em **T025** —, a leitura que `update_option()`
faz para comparar o valor antigo sai como **consulta**, onde no legado ela e
acerto do grupo `options`. A sequencia de **escrita** e identica, que e o que a
area 3 compara (*"snapshot + sequencia de comandos"*), e o cenario de paridade
roda *"com o cache de objeto desligado nas duas metades"*. Esta escrito no
cabecalho de `armazenamento/opcao.ts` e afirmado nos testes que programam a mesma
linha duas vezes.

### A divisao que T002 fez — e que ajusta uma nota de T001

T001 escreveu, no cabecalho de `portas/index.ts`, que a porta de **sistema de
arquivos** entraria *"em T002, T027"*, para *"ler a configuracao declarada pelo
tema, que e arquivo no tema"*. **T002 nao a declarou**, e o motivo esta aqui para
que a proxima onda nao a procure:

| o que o `plan.md` lista em *Modelo de dados* | onde vive | quem porta |
|---|---|---|
| *"configuracao do tema"* — o tema ativo e as modificacoes | `options` | **T002**, pela porta de dados, que e o que a linha de `tasks.md` nomeia |
| *"configuracao declarada pelo tema: arquivo no tema, lido como dado"* | `style.css` e o contrato declarativo de estilos, no diretorio do tema | **T025** (US-12, *"o contrato declarativo do tema e resolvido numa folha de estilo"*) e **T031** (US-15) |

Duas razoes, as duas de texto do pacote: a entrega de T002 diz **"pela porta de
dados"**, com essas palavras; e no vocabulario do pacote *"configuracao do tema"* e
o que esta gravado em opcao — UC-32 (*"permanece **nas opcoes**, nao apagada"*),
CA-9.2, CA-10.3, CA-5.4, CA-7.2 e os casos `UT-103-2` e `UT-105-3` do catalogo
usam a expressao nesse sentido. Nenhuma tarefa desta feature resolve o contrato
declarativo antes de T025, e declarar a porta agora seria superficie que nenhuma
linha usa. **Quem pegar T025 declara a porta de sistema de arquivos ali**, com os
tres pontos em que `get_theme_mods()` e `remove_theme_mods()` recorreriam ao
cabecalho de `style.css` quando `current_theme` nao existe
(`wp-includes/theme.php:1033` e `:1168`) — nesses pontos o Nome do tema chega a
este armazenamento **por argumento**, e nao por leitura de disco.

**Nenhuma regra de negocio esta implementada**, e nenhuma operacao esta exposta. A
superficie do modulo e
`{ nome, portas, armazenamento, personalizacao, menus, componentesDeArea }` — o
ultimo campo entrou em T002 — e a de cada area e `{ nome, noCiclo }`;
`modulo.test.ts` congela as quatro listas de proposito: elas crescem **na tarefa
de cada historia**, com a declaracao explicita de permissao que o **P4** cobra.

**Um numero mora neste modulo, e e o da tarefa que o usa.** T001 nao pediu ponto
de configuracao nenhum; **T002 traz o primeiro** — o teto de **150000 bytes**
acima do qual a carga automatica de uma opcao e desligada por heuristica
(`wp-includes/option.php:1362`, filtro de fabrica em
`default-filters.php:299`), em `armazenamento/opcao.ts`, com o teste de borda que
o **P6** exige (no teto aceita, um byte acima recusa). Os outros numeros desta
feature entram nas tarefas que os usam, cada um com o teste de borda dele — o
tempo limite de 5 s e os 5 redirecionamentos da chamada externa (T027), o prazo
de um dia do cache do catalogo de fontes (T027), o teto de 167 caracteres da
chave desse cache (T027). Os valores de fabrica estao **citados em prosa** no
cabecalho da porta, para que quem os for usar nao os invente. Numero que aparece
aqui antes da tarefa dele e numero sem teste de borda.

⚠️ **E o numero que o legado NAO tem tambem e regra.** A area de inativos de
componentes e *"um deposito sem retencao"* (UC-31) e a constituicao poe *"introduzir
limite de taxa, prazo de retencao ou qualquer numero que o legado nao tem"* na
tabela *Nao negociavel*. CA-7.4 e **acao manual**, nunca coleta por prazo.

## O que T003 entrega, e so isso

> *o comportamento de US-1 existe e os criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4,
> CA-1.5, CA-1.6 passam contra o sistema novo*
> — `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`, T003

Tudo em `personalizacao/`, e a area passou a expor operacoes
(`OperacoesDaPersonalizacao`), cada uma com a permissao declarada em
`permissoes` (**P4**):

| arquivo | criterio | o que e |
|---|---|---|
| `contexto-da-personalizacao.ts` | — | o pedido (`$_GET`/`$_POST` separados) e as ligacoes tardias: o conjunto por `BC-01`, `get_post_stati()`, UUID, nonce, `sanitize_key`/`sanitize_text_field`, relogio e o registro de configuracoes |
| `permissao-da-personalizacao.ts` | CA-1.4 | o caso `customize` → `edit_theme_options` (`wp-includes/capabilities.php:698`), e as quatro verificacoes, **todas** lidas da declaracao do tipo |
| `abrir-a-personalizacao.ts` | CA-1.1, CA-1.3 | o portao, a forma do UUID, o identificador inexistente e o modo linear que **retoma** o conjunto guardado — **sem gravar nada** |
| `valores-da-previa.ts` | CA-1.2 | o estado personalizado: conjunto, depois `customized` com nonce; o visitante nao instancia nada |
| `gravar-o-conjunto.ts` | CA-1.3, CA-1.4, CA-1.6 | as guardas de `save()` ate o estado, e `save_changeset_post()` no ramo que **nao aplica** (`null`, `draft`, `pending` — pelo tipo) |
| `anexo-na-personalizacao.ts` | CA-1.5 | o pedido do anexo do conteudo inicial, `auto-draft`, com os dois metadados |
| `us-1-pre-visualizar-alteracoes.test.ts` | todos | 19 afirmacoes; os oito casos do catalogo (`UT-096-*`) sao **T004** |

**"Abrir cria um conjunto" e um identificador, nao uma linha.** Abrir nao grava
em `posts`; a linha nasce na primeira gravacao, como `auto-draft`
(`class-wp-customize-manager.php:2931`). E por isso que o visitante nao e
afetado: nada que o site le mudou.

**Nenhum comando sai pela porta de dados deste modulo** em T003: o conjunto e
lido e gravado por `WP_Query`/`wp_insert_post()` no legado, e aqui pela ligacao
tardia `ConjuntosNaPersonalizacao`, como T002 deixou escrito.

### Tres achados que a proxima onda precisa ler

1. 🔴 **A "autorizacao pela diferenca" (RF-11 da unidade
   `customize/changeset-do-customizer`) nao existe no codigo.**
   `$changed_setting_ids` e calculado (`:2749`-`:2768`) e **nunca usado**: a
   validacao roda sobre todos os valores enviados mais as chaves de
   `customize_changeset_data` (`:2785`-`:2796`). O **P1** manda portar o
   comportamento, e a lista nao e calculada. **T005** le isto antes de confiar
   em RF-11.
2. ⚠️ **CA-1.2 e lido como o legado o faz.** *"Apenas para quem esta
   personalizando"*: o visitante comum nao instancia o Customizer e nao ve nada;
   mas **quem nao tem `customize` e carrega o UUID de um conjunto existente ve o
   conjunto** (so ele — `customized` e descartado). O legado diz por que: *"the
   UUID serves as a secret key"* (`:556`-`:560`). Nenhum documento do pacote
   descreve a previa (UC-29: *"nao foi possivel determinar o comportamento da
   previa"*), logo nao ha texto em conflito — ha o codigo, que o **P1** manda
   reproduzir. Se alguem ler CA-1.2 como "so com sessao e capacidade", e
   divergencia, e precisa de decisao humana.
3. ⚠️ **Tres comportamentos de abrir/gravar nao tem tarefa nesta feature**, e
   nao foram portados: a trava de edicao `_edit_lock`
   (`establish_loaded_changeset()`, `:656`-`:658`; `set_changeset_lock()`,
   `:3255`), o descarte dos outros rascunhos automaticos da conta na primeira
   gravacao (`dismiss_user_auto_draft_changesets()`, `:2571`-`:2574`) e a revisao
   de salvamento automatico (`customize_changeset_autosave`, `:2710`-`:2718`,
   `:2963`-`:2973`). Nenhum e criterio de US-1; o descarte esta na resposta de
   `save()`, que e de **T007**.

### O que T003 deixou de proposito para as tarefas seguintes

| o que | ancora | de quem |
|---|---|---|
| aplicar: `publish` com retorno de chamada, data zerada, troca de tema | `:2677`-`:2680`, `:2909`-`:2916`, `:2937`-`:2940` | **T005** / **T007** — `gravarSemAplicar` nao aceita `publish`/`future` pelo tipo |
| a data pedida e o agendamento; o agendamento vencido ao abrir | `:2488`-`:2512`, `:2682`-`:2708`; `customize.php:39`-`:75` | **T009** — a data viaja crua em `PedidoDeGravacaoValidado.dataPedida` |
| a resposta de `save()`: estado relatado, UUID seguinte | `:2564`-`:2615` | **T007**, com o conflito de CA-3.3 aberto |
| pre-visualizar outro tema; `customize_stashed_theme_mods` | `:574`-`:595`, `:1772`-`:1778` | **T017** |
| a concessao por filtro de `edit_post` | `:3239` | **T005**, em `plataforma/autorizacao/concessao-por-extensao.ts` |

⚠️ **O caso `customize` mora aqui**, em `casoDaPersonalizacao`, e as operacoes o
acrescentam aos casos da base. Outras superficies que perguntam `customize` (a
tela de menus, a de componentes, a barra de administracao) precisam dele na base
de autorizacao da composicao — `traducao-de-capacidade.ts` registra que os dez
atalhos de `PERM-6` *"chegam com os casos deles"*.

**Duas aproximacoes registradas, nenhuma alcancada pelo dado do nucleo:** a
identidade `===` do PHP nao distingue `1` de `1.0` depois de `JSON.parse`
(`identicoNoPhp`); e identificador de configuracao que seja um inteiro em texto
sai antes dos outros no objeto, a mesma armadilha que T002 registrou para
`conteudoDoConjunto`.

## O que T011 entrega, e so isso

> *o comportamento de US-5 existe e os criterios CA-5.1, CA-5.2, CA-5.3, CA-5.4,
> CA-5.5 passam contra o sistema novo*
> — `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`, T011

Tudo em `menus/`, e a area passou a expor operacoes (`OperacoesDosMenus`), cada
uma com a permissao declarada em `permissoes` (**P4**):

| arquivo | criterio | o que e |
|---|---|---|
| `contexto-dos-menus.ts` | — | o pedido e as ligacoes tardias: o menu por `BC-02` (`ClassificacaoNosMenus`), o item por `BC-01` (`ConteudoNosMenus`), as posicoes declaradas pelo tema, nonce, sanitizadores e relogio |
| `permissao-dos-menus.ts` | CA-5.1 | o portao de `nav-menus.php:18`-`:29` (tema **antes** da capacidade), os dois tokens e a permissao de cada operacao |
| `menu-de-navegacao.ts` | CA-5.2 | `wp_get_nav_menu_object()`, `is_nav_menu()`, `wp_update_nav_menu_object()`: o menu e um termo de `nav_menu` |
| `item-de-menu.ts` | CA-5.2, CA-5.3 | `wp_update_nav_menu_item()` inteiro: destino, posicao, hierarquia em metadado, rascunho orfao |
| `posicoes-de-menu.ts` | CA-5.4, CA-5.5 | as posicoes declaradas, `nav_menu_locations` dentro de `theme_mods_{folha}`, `has_nav_menu()` e os dois primeiros passos de `wp_nav_menu()` |
| `gravar-menu-pela-tela.ts` | todos | as acoes `update` e `locations` da tela e `wp_nav_menu_update_menu_items()` |
| `us-5-montar-menu.test.ts` | todos | 20 afirmacoes; os sete casos do catalogo (`UT-100-*`) sao **T012** |

**Nenhum comando sai pela porta de dados por conta dos menus, salvo um:** o
termo e o item sao `BC-02` e `BC-01`, e chegam por ligacao tardia, como a
tabela de `contexto-dos-menus.ts` lista funcao por funcao. O que este contexto
grava e o que e dele — `nav_menu_locations` (pela modificacao de tema de T002)
e `nav_menu_options` (opcao propria, regravada a cada gravacao de menu).

### Quatro achados que a proxima onda precisa ler

1. 🔴 **`posts.post_parent` do item nao e o item pai.** E o pai **do destino**
   (`wp-includes/nav-menu.php:496`, `:503`); o item pai mora em
   `_menu_item_menu_item_parent`, em texto (`:589`). O risco 3 de `plan.md` ja
   avisava da coluna; o que ele nao dizia e que a coluna **e usada**, para
   outra coisa.
2. ⚠️ **A posicao calculada tem um buraco de proposito.** O primeiro item de
   um menu vazio vai para `0`, o segundo para `2` (`:467`-`:473` com a
   renumeracao de `:753`-`:765`); e a contagem do termo so conta item
   **publicado** (`_update_post_term_count()`, `wp-includes/taxonomy.php:4214`),
   logo menu so de rascunhos calcula `0` para todo item novo. Afirmado nos
   testes; nao "corrigir".
3. ⚠️ **Gravar o menu pela tela e regravar a lista inteira:** item que nao veio
   no formulario e apagado, e item de titulo vazio e pulado e, por isso,
   apagado tambem (`wp-admin/includes/nav-menu.php:1443`-`:1446`,
   `:1473`-`:1480`). E `nav_menu_options` nasce `a:2:{i:0;b:0;s:8:"auto_add";a:0:{}}`
   numa instalacao nova, porque o instalador nao a semeia e `(array) false` e
   `array( false )` (`:1484`).
4. ⚠️ **A tabela *Contratos* de `plan.md` lista *"destino inexistente"* como erro
   de montar menu, e o legado nao recusa.** `wp_update_nav_menu_item()` grava o
   item com titulo e pai vazios quando o destino nao existe; os unicos erros
   dele sao menu inexistente (`invalid_menu_id`, `:429`-`:431`) e identificador
   que nao e item (`:423`-`:425`). **T011 seguiu o legado**, e nao por escolha:
   `plan.md` diz no proprio cabecalho que *"o que nao estiver na spec nao e
   requisito, e invencao"*, nenhum dos cinco criterios de US-5 pede a recusa, e
   UC-30 (*Excecoes*) e a regra de US-6 descrevem o item que aponta para o nada
   como estado normal. Recusar aqui tornaria CA-6.1 e CA-6.2 inverificaveis.
   Registrado, nao decidido: quem mantem o pacote deveria alinhar a linha.

### O que T011 deixou de proposito para T013

| o que | ancora | por que |
|---|---|---|
| o terceiro passo de `wp_nav_menu()` (o primeiro menu **com itens**) e o recurso `fallback_cb` | `wp-includes/nav-menu-template.php:138`-`:147`, `:167`-`:170` | "ter itens" fora do painel e a lista **depois** do filtro de item invalido (`nav-menu.php:749`-`:751`), que monta cada item por `wp_setup_nav_menu_item()` — e CA-6.4. `menuParaExibir` faz so os dois primeiros passos |
| `wp_setup_nav_menu_item()` e `_is_valid_nav_menu_item()` | `nav-menu.php:842`-`:1040`, `:676`-`:678` | e onde o item orfao ganha `_invalid` |
| apagar menu e item (`delete`, `delete_menus`, `delete-menu-item`) | `wp-admin/nav-menus.php:278`-`:367` | nao e criterio de US-5 |
| reordenar sem JavaScript (`move-up-menu-item`, `move-down-menu-item`) | `wp-admin/nav-menus.php:75`-`:276` | CA-5.3 chega pelos campos do item na acao `update`; nenhuma tarefa desta feature nomeia o caminho sem JavaScript |
| acrescentar pelo painel lateral (`add-menu-item`, o Ajax de item orfao) | `wp-admin/nav-menus.php:64`-`:73` | o estado que ele produz — item com menu `0` — ja e `gravarItemDeMenu` |

⚠️ **O caso `customize` nao entrou aqui:** a tela de menus pergunta pela
capacidade **primitiva** `edit_theme_options` (`nav-menus.php:23`), e UC-30 e
literal — *"nao ha capacidade propria de menu"*. O atalho para o Customizer que
a tela oferece *"quando o ator tem `customize`"* (UC-30, fluxo alternativo) e
montagem de tela.

## O que T015 entrega, e so isso

> *o comportamento de US-7 existe e os criterios CA-7.1, CA-7.2, CA-7.3, CA-7.4
> passam contra o sistema novo*
> — `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`, T015

Tudo em `componentes-de-area/`, e a area passou a expor operacoes
(`OperacoesDosComponentes`), cada uma com a permissao declarada em
`permissoes` (**P4**):

| arquivo | criterio | o que e |
|---|---|---|
| `contexto-dos-componentes.ts` | — | as opcoes de T002 e o que no legado e global do arranque: as areas registradas, os componentes registrados com o numero, o tipo de cada componente, nonce, `wp_hash()` |
| `permissao-dos-componentes.ts` | CA-7.1 | o portao da tela (capacidade **antes** do tema), os quatro tokens, o 403/200 do Ajax e o 401/403 da superficie programatica |
| `arranjo-do-php.ts` | — | as regras de chave do arranjo do PHP que vao para o byte: proxima chave livre, `array_diff()`, `array_splice()` |
| `mapa-de-areas.ts` | CA-7.2 | `sidebars_widgets`: `wp_get_sidebars_widgets()`, `wp_set_sidebars_widgets()`, `wp_find_widgets_sidebar()`, `wp_assign_widget_to_sidebar()` |
| `configuracao-do-componente.ts` | CA-7.2 | `widget_{id_base}`: `get_settings()`, `save_settings()` e `update_callback()` inteiro |
| `organizar-pela-tela.ts` | CA-7.1 a CA-7.4 | o formulario sem JavaScript (gravar, retirar, limpar inativos) e os Ajax `widgets-order` e `delete-inactive-widgets` |
| `organizar-pela-api.ts` | CA-7.1, CA-7.3 | `update_item()` do controlador de areas; `create_item()`, `update_item()`, `delete_item()` e `save_widget()` do de componentes |
| `organizar-pela-personalizacao.ts` | CA-7.1, CA-7.3 | as duas configuracoes de componente do Customizer, as sanitizacoes delas e `WP_Customize_Setting::save()` multidimensional |
| `us-7-organizar-componentes.test.ts` | todos | 22 afirmacoes; os seis casos do catalogo (`UT-102-*`) sao **T016** |

**Nenhum comando sai por outra tabela que nao `options`**, e e o que CA-7.2 e a
regra *"componente e area vivem em configuracao do site"* pedem: o mapa e uma
linha, a configuracao e uma linha por tipo, e o teste afirma o byte de cada uma
sobre o armazenamento de T002.

### Quatro achados que a proxima onda precisa ler

1. ⚠️ **CA-7.3 diz "com o mesmo resultado", e o legado da a mesma ESTRUTURA, nao
   o mesmo byte.** Mover um componente de area grava o mesmo mapa pelas tres
   superficies, byte a byte (afirmado). Mas a instancia **nova** gravada pela
   personalizacao entra **depois** de `_multiwidget`, porque
   `WP_Customize_Setting` troca a chave no lugar
   (`class-wp-customize-setting.php:916`), enquanto a tela e a superficie
   programatica passam por `update_callback()`, que tira a marca e a poe de
   volta no fim (`class-wp-widget.php:600`, `:637`). T015 seguiu o legado e
   afirmou as duas formas; nao ha texto do pacote pedindo identidade de byte, e
   o **P1** manda reproduzir.
2. ⚠️ **A tabela *Contratos* de `plan.md` nao tem linha para organizar
   componentes.** A permissao veio de UC-31 (*Autorizacao*: `edit_theme_options`)
   e de CA-7.1, e e a mesma nas quatro portas — tela, Ajax, superficie
   programatica e personalizacao. Registrado, nao decidido: quem mantem o
   pacote deveria acrescentar a linha.
3. ⚠️ **As tres superficies respondem diferente a mesma falta de capacidade**, e
   e o legado: a tela, 403 com titulo e mensagem; o Ajax, corpo `-1` com **200**
   (e o token vem **antes** da capacidade, com 403); a superficie programatica,
   `rest_cannot_manage_widgets` com **401** sem sessao e 403 com ela; a
   personalizacao, gravacao recusada em silencio. E as configuracoes de
   componente da personalizacao existem **para toda conta** — o filtro que as
   cria entra antes da guarda de capacidade
   (`class-wp-customize-widgets.php:104`, `:109`-`:111`).
4. ⚠️ **Tres comportamentos de forma que um porte "arruma"**, todos afirmados:
   tirar um componente deixa **buraco** na chave da lista (`array_diff()`), e
   so a area de destino e renumerada (`array_splice()`); a chave anexada aos
   inativos pela superficie programatica segue a **proxima livre**, que tirar
   uma entrada nao devolve; e atribuir um componente a area em que ele ja esta
   o **duplica** (`wp-includes/widgets.php:1987`-`:1989`). E o Ajax de ordenar
   grava **so** as areas que o cliente mandou: a que nao veio some do valor.

### O que T015 deixou de proposito para T019

| o que | ancora | por que |
|---|---|---|
| `retrieve_widgets()` — chamada pela tela ao abrir e pela superficie programatica ao atualizar e apagar componente | `wp-includes/widgets.php:1327`; `wp-admin/widgets-form.php:121`; `class-wp-rest-widgets-controller.php:310`, `:385` | e o remapeamento da troca de tema, o coracao de US-9. O ponto de entrada esta marcado em `mapaPreparadoPelaTela` |
| `wp_map_sidebars_widgets()` e `_wp_remove_unregistered_widgets()` | `wp-includes/widgets.php:1395`, `:1579` | idem |
| o mapa do tema que sai como theme mod `{ time, data }` | `wp-includes/theme.php:775`-`:782` | e a troca de tema (T017) mais a preservacao (T019) |

1. 🔴 **Antes de escrever T019: o legado devolve os componentes sozinho.**
   `wp_map_sidebars_widgets()` termina restaurando o mapa guardado do tema que
   volta — *"Restore widget settings from when theme was previously active"* —
   e grava (`wp-includes/widgets.php:1499`, `:1561`-`:1562`, gravado por
   `retrieve_widgets()` em `:1378`). UC-31, *Excecoes*, diz *"nada volta sozinho
   se o tema anterior voltar"*, e CA-9.3 pede que voltar ao tema anterior
   *"permite recolocar os componentes nas areas, **por acao explicita**"*. Os
   dois textos do pacote negam o que o codigo faz. **T015 nao decidiu nada**:
   nao portou a funcao. E conflito entre a spec e o legado, e a constituicao
   manda parar e escrever, nao escolher.
2. ⚠️ **Fora da tela a area de inativos nao esta registrada** — so
   `widgets-form.php:108` a registra —, e por isso a superficie programatica
   sempre toma o ramo que remapeia (`wp-includes/widgets.php:1351`-`:1381`),
   que **grava** quando o mapa nao esta na forma dele: inativos primeiro, as
   areas na ordem do registro, e toda instancia registrada com numero 2 ou mais
   que esteja fora do mapa puxada para os inativos (`:1362`-`:1374`). T015 se
   confere no mapa que ja esta nessa forma.

**Tres caminhos nao foram portados, com o motivo no cabecalho de cada
arquivo:** o Ajax `save-widget` da tela com JavaScript
(`ajax-actions.php:2395`, que termina desenhando o formulario), a conversao do
formato de antes da versao 2.8 (`wp_convert_widget_settings()`,
`wp-includes/widgets.php:1141`, inalcancavel em instalacao nova) e o componente
registrado por funcao, sem objeto de tipo (vem de extensao, nao do nucleo).

## Por que os tres entram juntos — e nao e opcao de desenho

`target_architecture.md` justifica a fusao dos 12 modulos de BC-07 em parte por
isto: *"`architecture.md` registra o ciclo secundario `customize ↔
menus-de-navegacao ↔ widgets-e-sidebars`: **ja estao no mesmo ciclo**, logo nao
existe fronteira entre eles a declarar — declarar uma seria inventar uma que o
codigo nao tem"*. `spec.md`: *"ou os tres entram juntos, ou nenhum fecha"*. E o
risco 2 de `plan.md` avisa o efeito de ignorar isso: *"estimar as tres partes
separadamente subestima o trabalho"*.

As arestas medidas, com ancora no legado, estao na tabela de
`ciclo-de-apresentacao.ts`. A mais surpreendente: **trocar de tema le o estado da
personalizacao** — `switch_theme()` busca `old_sidebars_widgets_data` dentro do
Customizer quando a acao corrente e o salvamento dele
(`wp-includes/theme.php:766`-`:771`).

**Como o ciclo foi cortado:** as tres areas **nao se importam**. Cada uma recebe,
na composicao, uma funcao que devolve as tres ja compostas. Duas razoes, nenhuma de
gosto — BR-DESCARTAR-010 (*"importacao circular lida na avaliacao do modulo e erro
de inicializacao"* em ESM, nao aviso como era no `require`) e AD-10, que ja escolheu
ligacao tardia como o idioma deste porte. `modulo.test.ts` afirma que a ligacao
**nao** e resolvida na composicao.

## As duas portas, e por que sao estas

`tasks.md` as pede pelo nome em T001: dados e cliente externo.

- **Dados** e uma das 5 portas de AD-08 e e o slot `persistencia` de `plan.md`.
  Declara **so** `prefixoDeTabela`: tudo que as tres areas tocam e de escopo **por
  site**. O unico uso de escopo de rede desta feature — o transient de site que
  guarda a resposta do catalogo de fontes
  (`wp-includes/fonts/class-wp-font-collection.php:179`, `:205`) — e de **T027**, e
  e quem a pegar que acrescenta o prefixo base.
- **Cliente externo** e o slot `cliente-http` e a **primeira** porta do plano de
  migracao. Existe por uma chamada: `wp_safe_remote_get()` em
  `class-wp-font-collection.php:182`, que serve **CA-13.3**. ⚠️ **Nenhum
  rebaixamento para canal sem cifra entra aqui**: os 7 endpoints de `ESC-HTTP` sao
  de `BC-11` e `BC-13`, e esta chamada usa o default `sslverify => true`. Traze-lo
  por simetria seria *acrescentar* divida herdada onde o legado nao a tem.

**As tres bordas de AD-08 que esta feature nao declarou** estao nomeadas, com a
tarefa de cada uma, no cabecalho de `portas/index.ts`: sistema de arquivos (ali
escrito como *"T002, T027"*; **T002 nao a declarou**, e a secao *A divisao que
T002 fez* acima diz por que — ela e de **T025**, **T027** e **T031**), cache de
objeto (T025) e e-mail (**nenhuma** historia desta feature envia e-mail).

**As portas sao sincronas** (AD-04), e a porta de dados **nao tem transacao** — que
nesta feature e o contrato: `switch_theme()` grava opcao por opcao em sequencia
(`wp-includes/theme.php:777` a `:861`) e, interrompida, deixa **parte** gravada.
Envolver a troca numa transacao desfaria o estado de que US-9 depende.

**A porta de dados repete a forma das portas de `conteudo`, `classificacao`,
`leitura-publica` e `retencao-e-descarte`, e a duplicacao e a regra:** AD-10 proibe
contexto importar contexto no topo do modulo, e a regra de dependencia 4 poe a porta
no modulo que a consome. A camada de dados de verdade e trabalho da feature `015`
(T007).

## Esta decidido em outro lugar

- **A permissao.** `customize` resolve para `edit_theme_options`
  (`wp-includes/capabilities.php:698`-`:699`), e `edit_theme_options` *"libera
  menus, componentes e personalizacao, e e exclusiva do papel de administracao"*.
  A decisao de capacidade e `plataforma/autorizacao` (feature `001`), nao daqui: o
  **P3** poe a decisao abaixo de todo contexto e o **dado** do papel na identidade.
- **A concessao por filtro.** A capacidade de editar o conjunto de alteracoes nao
  esta em papel algum: ela e injetada por `map_meta_cap`
  (`class-wp-customize-manager.php:3239`, registrada em `:2966`). O mecanismo ja
  existe e tem dono — `plataforma/autorizacao/concessao-por-extensao.ts`, entrega de
  T019 da feature `001`. Quem pegar **T005** declara a concessao **ali**; CA-2.3
  (*"declarada na matriz, e nao concedida por caminho indireto"*) e satisfeita por
  isso, que e o que o **P3** e a resposta 3 mandam fazer.
- **O ciclo de vida do conjunto de alteracoes.** `SM-CHANGESET` / BR-MIGRAR-101: e
  um `post` com **maquina de estado propria, sem intersecao com `post_status`**, e
  `target_domain_model.md` registra `AGG-Changeset` como **dividido** de `posts`.
  Os quatro estados aceitos na escrita estao em
  `class-wp-customize-manager.php:2479`, e o rascunho automatico **nao pode ser
  pedido pelo cliente** (CA-1.6, UC-29).
- **A serializacao do valor gravado.** `theme_mods_{stylesheet}` e
  `sidebars_widgets` guardam vetor no formato nativo do PHP, nao JSON. O codec e
  `plataforma/serializacao`, com suite de conformidade.
- **O lado cliente nao entra no porte.** BR-MIGRAR-117 (`ESC-CLIENTE`): o cliente
  dos 5 modulos do editor e *"dependencia externa adotada como esta, com versao
  cravada"*, e o que entra e o **lado servidor** que o alimenta. UC-29 fecha com
  *"nao foi possivel determinar o comportamento da previa: o lado cliente do
  Customizer nao esta nesta arvore"*. Quem pegar T003 constroi o que o servidor
  entrega, nao o que o navegador desenha.

## O que ninguem decidiu

Nenhum destes se resolve escolhendo um lado. Quem esbarrar para e escreve, como a
constituicao manda.

### 1. 🔴 CA-3.3 contradiz o comportamento que o P1 manda reproduzir (T007, US-3)

| lado | onde esta escrito | o que diz |
|---|---|---|
| a spec | **CA-3.3** | *"nenhuma resposta do sistema anuncia um estado diferente do gravado"* |
| a analise | UC-29 (pos-condicoes e *O que um porte precisa saber*), `state-machines.md` §5, `class-wp-customize-manager.php:2578` | depois de aplicado o conjunto vai para a **lixeira** e a resposta reporta **publicado** — *"a resposta ao ator diz 'publicado' — e nao e o que esta gravado"* |

A propria US-3 lista a regra do legado entre as *"regras de negocio que valem
aqui"*, e em seguida pede um criterio que a nega. O **P1** manda reproduzir *"inclusive
quando parecer defeito"* e exige, para divergir, *"uma decisao humana registrada,
citada no codigo que divergiu"* — e **nao existe resposta de `questions.md` nem ADR
sobre este caso**. As tres divergencias autorizadas sao outras (tempo limite do
adaptador de IA, minimizacao do servico de reputacao, oraculo executavel).

**CA-3.1 e CA-3.2 nao estao em conflito** e podem ser construidas: informar o estado
real **e** informar, em separado, que os valores foram aplicados ao site, sao dois
fatos que o legado tambem tem. O que esta aberto e so a terceira linha. T001 nao
decidiu nada aqui: nao ha operacao de resposta neste modulo.

### 2. 🔴 O agendamento depende de uma fila cujo conflito esta aberto (T009, US-4)

`spec.md`, *Perguntas em aberto*: *"US-4 (REQ-099) agenda a aplicacao de uma
alteracao de aparencia, e o agendamento depende da fila da feature 011, cujas
historias estao em conflito aberto com a resposta 10. Enquanto esse conflito nao se
resolver, o comportamento agendado desta historia fica indefinido"*.

E o mesmo conflito que `contextos/retencao-e-descarte/README.md` registra do outro
lado: a resposta 10 poe o disparo da fila como *"requisicao nao bloqueante ao
proprio host, com tempo limite de 0,01 s... logo a falha e invisivel por projeto"*,
e CA-4.2 cobra que *"a aplicacao acontece pela mesma rotina que publica conteudo
agendado"* — que no legado e `wp-includes/post.php:5482`, sujeita a chegar
requisicao depois da data (UC-29: *"o evento agendado o publica, **sujeito a chegar
requisicao HTTP depois da data**"*). T001 nao declarou porta de fila, e isso e
deliberado: `tasks.md` pediu duas portas, e declarar a terceira seria tomar partido
sobre como o agendamento chega aqui.

### 3. ⚠️ Nenhuma resposta humana disse qual tema e o de referencia (T031, US-15)

`spec.md`: *"a arvore analisada traz tres temas empacotados, e nenhuma resposta
humana disse qual deles e o tema de referencia do porte, nem se os tres entram"*. E
`parity_specs.md` registra o mesmo como `LACUNA-IN-09`: *"sem tema o site publico
nao renderiza: `PTS-016` (Front-end) **nao tem criterio de aceite** ate essa
resposta"*. A constante que nomeia o tema de reserva existe e e lida
(`wp-includes/default-constants.php:437`), e isso e fato; **qual** tema o porte
entrega, nao.

Isto atravessa a feature `004`: `index.md` registra a mesma pergunta por la — *"os
modelos vem do tema, que esta na feature 009. Qual tema serve de oraculo para o
teste de paridade desta historia?"*.

### 4. ⚠️ Cinco historias nao tem oraculo de paridade (T023 a T030)

`spec.md`: US-11 a US-14 dependem *"de codigo que nao esta nesta arvore: o lado
cliente do editor, dos recursos de interface, da biblioteca de fontes e do conjunto
de icones (lacuna L4 de `soul.md`)"*, e a resposta 15 manda construir a partir do
repositorio de origem. **Ate esse fonte estar em maos, as quatro nao tem oraculo.**
E REQ-177 — *"tornar interativo o conteudo renderizado sem recarregar a pagina"* —
ficou `bloqueado` pela mesma ausencia e esta em `do-not-rewrite.md`: nao e trabalho
pendente, e escopo recusado. `spec.md` registra que *"parte do comportamento de
US-11 e US-12 so faz sentido com ele"*.

## O que este modulo nao vai ter

- **Tabela de menu ou de widget.** O menu e termo mais `posts` mais opcao (tres
  mecanismos, UC-30); componente e area *"vivem em opcoes, nao em tabela"*
  (`domain.md` §1.3). Modelar tabela e a "correcao" que o **P5** recusa.
- **Coluna de pai para o item de menu.** A hierarquia vive em
  `_menu_item_menu_item_parent` (`wp-includes/nav-menu.php:589`), e o risco 3 de
  `plan.md` diz o preco de mudar: *"muda o que extensao de menu le"*.
- **Cascata declarada no armazenamento.** Item de menu que aponta para conteudo
  apagado **permanece** e aponta para o nada; nenhuma rotina limpa orfaos (UC-30).
  Declarar a cascata apagaria o item e tornaria CA-6.1 e CA-6.2 inverificaveis.
- **Prazo para a area de inativos**, nem limite de taxa em superficie nenhuma: a
  resposta 19 e o **P6** poem isso fora do nucleo.
- **O download do arquivo de fonte pelo servidor.** No legado *"o download e feito
  pelo navegador"* (US-13); so o JSON do catalogo passa pela porta de saida.
- **Migracao de dado.** `plan.md`, *Migracao de dados*: *"nada vem do sistema
  velho (resposta 2). O tema padrao da instalacao nova e ativado como o instalador
  do legado ativa, e nenhum conjunto de alteracoes existe"*. ⚠️ **O que T002
  portou de parecido nao e migracao de dado:** a localizacao obsoleta
  `mods_{Nome}` e lida e apagada **pelo legado**, em quatro caminhos
  (`wp-includes/theme.php:1036`, `:1038`-`:1039`, `:820`, `:1171`), e o **P8**
  mais a resposta 14 mandam portar o que o legado tem — *"o descarte vale como
  nao mudar, nunca como nao portar"*. Numa instalacao nova aquela opcao
  simplesmente nao existe, o que e um **estado**, nao ausencia de codigo.
- **O registro do tipo de conteudo acontecendo por efeito de carregamento.** A
  declaracao de `customize_changeset` e **dado** (`armazenamento/tipo-do-conjunto.ts`):
  quem a registra e o arranque, cuja ordem e contrato publico (`EXT-ORDEM`,
  BR-MIGRAR-106, e a tabela *Nao negociavel* da constituicao).
- **Transacao em volta da troca de tema.** `switch_theme()` grava opcao por opcao
  em sequencia e, interrompida, deixa **parte** gravada; e desse estado parcial
  que US-9 depende. O legado mede zero `START TRANSACTION` em 1.467 arquivos
  (BR-MIGRAR-104).

## Como esta entrega se confere

- `npm run typecheck` e `npm test` — as 8 afirmacoes de T001 estao em
  `modulo.test.ts`, as 50 de T002 em `armazenamento/armazenamento.test.ts`, as
  19 de T003 em `personalizacao/us-1-pre-visualizar-alteracoes.test.ts`, as 20
  de T011 em `menus/us-5-montar-menu.test.ts` e as 22 de T015 em
  `componentes-de-area/us-7-organizar-componentes.test.ts`.
- Pela paridade, e aqui a cobertura e **desigual entre as tres areas**:

| area | cenario de paridade | situacao |
|---|---|---|
| personalizacao | **PT-019** (`19-maquinas-de-estado-e-changeset.feature`), cenarios *"O changeset do personalizador e conteudo com ciclo de vida proprio"* e *"Publicar o changeset aplica os valores e encerra o ciclo de vida dele"* | existe, `@critico` |
| menus | 🔴 **nenhum cenario de fluxo** — `LACUNA-IN-12` | so contrato de tela (`PTS-011` a `PTS-013`) |
| componentes de area | 🔴 **nenhum cenario de fluxo** — `LACUNA-IN-12` | idem |

`LACUNA-IN-12` e explicita sobre o que isso custa: *"nenhum cenario verifica o
efeito no banco de reordenar um menu ou mover um widget... os quatro precisam de
cenario de fluxo antes das fatias 9 e 12"*. Escrever esses cenarios e trabalho de
quem mantem `parity_specs.md`; para T011 a T020 o oraculo e o contrato de tela mais
os casos do catalogo `backlog/tests.md`, copiados e nao reconstruidos.

A metade de PT-019 que depende de T001 e **nenhuma**: o esqueleto nao tem estado a
transicionar. Com **T002** ela comeca a ser conferivel, e o que ja da para
conferir e o que nao da esta separado:

| o que `PT-019` cobra | com T002 |
|---|---|
| *"as duas o gravam na mesma tabela do conteudo editorial"* | conferivel — `{site}posts` com `post_type = 'customize_changeset'` |
| *"as duas usam um conjunto de estados proprio, diferente do editorial"* | conferivel — `estado-do-conjunto.ts`, com os cinco estados e os quatro aceitos na escrita |
| *"nenhuma das duas aplica a maquina editorial ao changeset"* | conferivel — `transicaoPermitida()` recusa `publish → draft`, que o conteudo editorial aceita |
| *"cada transicao dispara os mesmos gatilhos, na mesma ordem"* | 🔴 **nao** — gatilho e ponto de extensao, e o barramento de *hooks* (REQ-162) esta em `do-not-rewrite.md`. Os nomes estao declarados nos arquivos que os emitiriam |
| *"publicar o changeset aplica os valores e encerra o ciclo de vida dele"* | **nao** — aplicar valores e **T005**; T002 entrega o comando que leva o registro a lixeira, nao a decisao de emiti-lo |
| *"o changeset abandonado segue a politica de retencao do legado"* | **nao** — a coleta e a varredura de rascunho automatico da feature `005` (T013), e **nenhum prazo nasce neste modulo** |

E a area 3 da Decisao 2 (*"efeito no banco... snapshot + sequencia de
comandos"*), que `LACUNA-IN-12` aponta para UC-32 — *"trocar o tema ativo
**escreve opcao** — e area 3"* —, passa a ter contra o que ser conferida: a
sequencia de comandos de cada operacao de opcao esta afirmada por teste,
**inclusive as tres que nao emitem comando nenhum**.
