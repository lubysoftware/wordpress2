# Modulo de apresentacao — BC-07, feature `009-apresentacao-e-personalizacao`

Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, as duas
portas e as tres areas do ciclo) e **T002** (o conjunto de alteracoes como tipo de
conteudo proprio e a configuracao do tema como dado). Este arquivo e a leitura
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

> ⚠️ **E se a sua tarefa e T011, T013, T015 ou T019:** UC-30 e UC-31 **nao tem
> cenario de paridade de fluxo** — `parity_specs.md` conta 43 de 47, e os dois sao
> de fora da conta. O oraculo da sua tarefa e o contrato de tela mais o catalogo
> `backlog/tests.md`. Secao *Como esta entrega se confere*.

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
  `modulo.test.ts` e as 50 de T002 em `armazenamento/armazenamento.test.ts`.
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
