# Modulo de apresentacao — BC-07, feature `009-apresentacao-e-personalizacao`

Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, as duas
portas e as tres areas do ciclo). Este arquivo e a leitura obrigatoria de quem
pegar a tarefa seguinte: ele diz o que ja esta decidido, o que esta decidido **em
outro lugar**, e o que **ninguem decidiu**.

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

**Nenhuma regra de negocio esta implementada**, e nenhuma operacao esta exposta. A
superficie do modulo e `{ nome, portas, personalizacao, menus, componentesDeArea }`
e a de cada area e `{ nome, noCiclo }` — `modulo.test.ts` congela as quatro listas
de proposito: elas crescem **na tarefa de cada historia**, com a declaracao
explicita de permissao que o **P4** cobra.

**Nenhum numero mora neste modulo.** T001 nao pede ponto de configuracao, e os
numeros desta feature entram nas tarefas que os usam, cada um com o teste de borda
que o **P6** exige — o tempo limite de 5 s e os 5 redirecionamentos da chamada
externa (T027), o prazo de um dia do cache do catalogo de fontes (T027), o teto de
167 caracteres da chave desse cache (T027). Os valores de fabrica estao **citados
em prosa** no cabecalho da porta, para que quem os for usar nao os invente. Numero
que aparece aqui antes da tarefa dele e numero sem teste de borda.

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
tarefa de cada uma, no cabecalho de `portas/index.ts`: sistema de arquivos (T002,
T027), cache de objeto (T025) e e-mail (**nenhuma** historia desta feature envia
e-mail).

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
  do legado ativa, e nenhum conjunto de alteracoes existe"*.

## Como esta entrega se confere

- `npm run typecheck` e `npm test` — as 8 afirmacoes de T001 estao em
  `modulo.test.ts`.
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
transicionar. Ela comeca a ser conferivel em T002, quando o conjunto de alteracoes
passa a existir como tipo de conteudo.
