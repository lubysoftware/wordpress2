# Modulo de superficies programaticas — feature `013-superficies-programaticas`

Epico EP-13 do backlog: *"o que o sistema expoe a programas: API, abilities,
feeds, sitemaps"*. Tarefas fechadas com nota de entrega neste arquivo: **T001**
(esqueleto, o despachante com o registro de rotas vazio e inspecionavel, e a
porta de dados).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem**
decidiu.

> 🔴 **Se a sua tarefa e T002 ou T003, leia o item 1 de *O que ninguem decidiu*
> antes da primeira linha.** Ha uma frase de `UC-44` que manda **nao** copiar a
> falha aberta da camada de rotas, e a constituicao, `BR-HUMANA-008`, a `spec.md`
> e o cenario de paridade mandam copiar. T001 topou nisso e **nao resolveu**:
> T001 nao implementa camada de autorizacao nenhuma.

> 🔴 **Se a sua tarefa e T007, leia o item 2.** No legado o registro de rotas
> **nao nasce vazio** — o construtor semeia duas rotas meta, e uma delas,
> `/batch/v1`, nao tem historia nenhuma neste pacote.

> 🔴 **Se a sua tarefa e T009, leia o item 3.** CA-4.4 pede *"prazo de retencao
> declarado"* para um registro que o legado nao tem, e a tabela *Nao negociavel*
> da constituicao poe *"introduzir limite de taxa, prazo de retencao ou qualquer
> numero que o legado nao tem"* entre o que este agente **nao** decide.

---

## Onde este modulo mora, e por que a pasta leva o nome da feature

Esta feature **nao e um contexto do desenho**: ela atravessa dois.

| historias | contexto de `target_architecture.md` |
|---|---|
| US-1 a US-6 — despacho, esquema, mapa da superficie, registro de acesso, token, operacao nomeada | `BC-09` *Superficies de Programacao* |
| US-7, US-8, US-9 — mapa do site, feeds, representacao embutivel | `BC-08` *Contratos de Leitura* |

`BC-09` existe porque `PERM-11` (BR-MIGRAR-097) registra **tres camadas
paralelas de autorizacao, cada uma com a sua propria falha padrao**, e *"hoje
elas moram em pastas separadas e **ninguem ve a divergencia**"*. Duas dessas tres
estao nesta feature, com defaults opostos. `BC-08` agrupa feeds, mapa do site e
oEmbed *"pelo criterio de aceite"*: os tres sao byte a byte.

A pasta leva o nome da feature, e nao o de um dos dois contextos, pelas mesmas
tres razoes que `004-leitura-publica` registrou: a tarefa nomeia *"o modulo de
superficies programaticas"*; `BC-08` e tambem destino da feature `004`, que esta
sendo construida em paralelo, e duas features escrevendo a mesma pasta e
conflito de merge e nao arquitetura; e a escolha nao muda nada do que o teste de
borda da Opcao 3 mede. Consolidar as pastas e trabalho de quem tiver as 15
features na mao, e e reversivel: nenhum nome publico depende do caminho do
arquivo.

---

## O que T001 entregou, e so isso

A linha da tarefa: *"o despachante de rotas carrega com o registro de rotas vazio
e inspecionavel, e a porta de dados declarada"*. `satisfaz: — (infraestrutura)`:
T001 **nao fecha nenhum criterio de aceite de nenhuma historia** e nao implementa
regra de negocio nenhuma.

```
superficies-programaticas/
├── index.ts                         a composicao: nome, portas, despachante
├── modulo.test.ts                   os 8 testes desta entrega
├── portas/
│   └── porta-de-dados.ts            a unica porta deste modulo em T001
└── despacho/
    ├── registro-de-rotas.ts         os dois armazens e os tres leitores
    └── despachante-de-rotas.ts      o que o carrega, e a ORDEM do atendimento
```

`criarModuloDeSuperficiesProgramaticas(portas)` devolve
`{ nome, portas, despachante }` e **mais nada**. Operacao de dominio entra na
tarefa da historia dela, com a declaracao de permissao que o P4 exige — a tabela
de quem entra, com a permissao de cada uma ja lida dos casos de uso, esta no
comentario de `ModuloDeSuperficiesProgramaticas` em `index.ts`.

### Os tres leitores do registro, e por que sao tres e nao um

O registro do legado tem **dois armazens** e **tres leitores**, e a diferenca
entre eles e observavel. As linhas sao de
`wp-includes/rest-api/class-wp-rest-server.php`:

| armazem | linha | leitor | linha | o que devolve com o registro vazio |
|---|---|---|---|---|
| `$namespaces` | `:64` | `get_namespaces()` | `:1035` | lista vazia |
| `$endpoints` | `:72` | `get_routes( $ns = '' )` | `:957` | mapa vazio |
| `$route_options` | `:80` | `get_route_options( $rota )` | `:1047` | **`null`**, nao mapa vazio |

Os dois primeiros parecem redundantes e nao sao: `register_route()` escreve nos
dois na mesma respiracao (`:924` e `:929`), logo concordam para tudo que passa
por ele — mas o construtor semeia `$endpoints` **direto**, e por isso as rotas
meta existem em `$endpoints` e nao em `$namespaces`. E por isso que
`get_routes( 'wp/v2' )` nunca devolve `/`.

Tres propriedades de `get_routes()` que ja estao documentadas em
`despacho/registro-de-rotas.ts` e que quem fechar T002 e T003 nao pode perder:

1. **Devolve copia, nao o armazem** (`:958`). Tem teste.
2. **E ali que dispara `rest_endpoints`** (`:974`), que recebe o mapa e pode
   devolver outro — logo pode acrescentar, tirar e trocar rota **depois** do
   registro. E ponto de extensao, logo e produto (P2). Esta **declarado** no
   docblock do leitor e nao implementado, porque o barramento de ganchos nao tem
   tarefa neste pacote (REQ-162 esta em `do-not-rewrite.md`).
3. ⚠️ **No legado esse leitor ESCREVE.** Ele normaliza os tratadores com os
   defaults de `:977-983` e **popula `$this->route_options`** (`:992-994` e
   `:998-1002`). Consequencia observavel: antes da primeira chamada a `get_routes()`,
   `get_route_options()` devolve `null` **para toda rota**, inclusive para rota
   que declarou opcao. T001 nao reproduz a ordem porque nao tem o que
   normalizar; quem fechar T002 decide se reproduz o acoplamento ou se declara a
   divergencia — e, se declarar, precisa da referencia que o P1 cobra.

### Por que `registrar` nao existe

Porque registrar e a entrega de **T002**: *"o registro de uma rota sem declaracao
de permissao reproduz o aviso de uso indevido do legado"*. O que se registra e
uma declaracao no formato que T002 define, e T001 nao define formato nenhum.

`DeclaracaoDeRota` e `DeclaracaoDeOpcaoDeRota` marcam os dois lugares e sao
`never` **de proposito**: enquanto o formato nao existe, o compilador nao deixa
nada entrar no registro. "Vazio" deixa de ser afirmacao do teste e passa a ser
propriedade do tipo. **Trocar esses dois `never` pelas interfaces e a primeira
linha de T002.**

### Por que uma porta so, sendo cinco as bordas de AD-08

A entrega nomeia uma: *"a porta de dados declarada"*.

- **Dados:** a unica que alguma historia desta feature usa hoje. O cabecalho de
  `portas/porta-de-dados.ts` tem a tabela de quem usa e quem nao usa, com a
  linha em discordancia marcada.
- **HTTP:** ⚠️ **a borda HTTP desta feature e de ENTRADA, e borda de entrada nao
  e porta deste modulo.** E o roteador, que `target_architecture.md` poe em
  `entradas/`, e que esta arvore ainda nao tem. Saida HTTP so apareceria na rota
  `oembed/1.0/proxy`, que e consumidor e **nao tem criterio de aceite nenhum**
  (item 4 de *O que ninguem decidiu*).
- **Sistema de arquivos, cache de objeto e e-mail:** nenhuma historia desta
  feature grava arquivo, cacheia ou manda e-mail. A borda 5 de
  `target_architecture.md` ainda poe o cache de objeto **desligado nas duas
  metades** durante a coexistencia.

Quando uma tarefa adiante precisar de outra borda, ela declara a porta na tarefa
dela, como T002 de BC-05 fez com o prefixo base.

### As duas invariantes com teste proprio

- **`EXT-ORDEM` (BR-MIGRAR-106):** compor o modulo nao toca na porta. No legado o
  povoamento acontece em `rest_api_init`, que dispara **depois** de o servidor
  existir (`wp-includes/rest-api.php:644-657`), e `register_rest_route()`
  **avisa** quem registra fora daquele gancho (`:81-92`). Construir e povoar sao
  dois momentos, e os dois sao contrato publico.
- **`EXT-CONTEXTO` (BR-MIGRAR-105):** duas composicoes nao compartilham
  registro. Nesta feature isso pesa mais do que em qualquer outra, e por um
  motivo desconfortavel: **o legado de fato guarda o servidor num global**
  (`rest_get_server()`, `wp-includes/rest-api.php:629-631`). Ele sobrevive porque
  o processo morre com a resposta — no modelo de processo por requisicao aquele
  global **ja e** escopo de requisicao. Copia-lo como estado de modulo num
  processo longo-vivo faria as rotas de uma requisicao vazarem para a seguinte, e
  numa rede as de um site para outro. E a linha 5 da metrica primaria de
  `parity_specs.md`: tolerancia **zero, sem excecao**, e *no-go* declarado.

### A ordem do atendimento esta em codigo, e nao foi implementada

A tabela das seis etapas, com a ancora de cada uma no legado e o dono de cada uma
neste pacote, esta no cabecalho de `despacho/despachante-de-rotas.ts`. Ela esta
ali, e nao so aqui, porque a tabela *Nao negociavel* da constituicao poe *"mudar
a ordem de carregamento do arranque"* fora do que o agente de codificacao decide.
Dois pontos dela que se perdem com facilidade:

- **A etapa 1 e o filtro de autenticacao, e ele antecede TODO o despacho**
  (`:197`). `UC-44` registra que *"um plugin pode fechar ou abrir a API inteira"*
  por ali. E CA-1.2: *"num ponto unico"*.
- **Antes de casar a rota existe um desvio**, `rest_pre_dispatch` (`:1079`): se
  devolver qualquer coisa nao vazia, **aquilo passa a ser a resposta** — sem
  casar rota, sem permissao e sem validar parametro.

---

## O que esta decidido em outro lugar

| assunto | onde mora | por que nao aqui |
|---|---|---|
| perguntar permissao | `plataforma/autorizacao/` | e chamada 1.279 vezes em 224 arquivos; fica abaixo de todo contexto. As duas camadas desta feature **consomem** a decisao, nao a tomam |
| a consulta publica que alimenta feeds e mapa do site | feature `004-leitura-publica` | CA-8.2 exige *"a mesma consulta publica que a pagina, sem regra de visibilidade propria"*. Dois donos para a mesma consulta e duas regras de visibilidade |
| ler o conteudo para a representacao embutivel | `BC-01`, por ligacao tardia | `get_oembed_response_data()` (`wp-includes/embed.php:561`) chama `get_post()`; conteudo e de `BC-01` |
| a identidade da chamada | feature `001-identidade-e-acesso` | e US-5 que a **exige**, nao que a resolve. E REQ-012, que nao entrou no pacote |
| `blog_public` e os pontos de configuracao | T015 (US-7) | o P6 cobra que cada numero viva num ponto de configuracao nomeado com teste de borda proprio. Semear aqui seria antecipar a tarefa que o le |
| as 2 operacoes nomeadas do Akismet | `discard_log.md` | descartadas por escopo: *"extensao empacotada, nao nucleo"*. As **3 do nucleo** (`core/get-site-info`, `core/get-user-info`, `core/get-environment-info`) migram, e sao de T013 |
| a ordem de arranque | D1, contrato publico | AD-10: nenhum contexto importa outro no topo do modulo |
| o barramento de ganchos | nao tem tarefa neste pacote | REQ-162 esta em `do-not-rewrite.md`. Os pontos de extensao desta area ficam **declarados** no arquivo que os emitiria |

**Por que a porta de dados reaparece aqui com a forma que BC-04 e BC-05 ja
declaram.** AD-08 poe a porta no contexto que a **consome** e AD-10 proibe um
contexto importar outro no topo do modulo. Importar a porta de outro contexto
daqui criaria exatamente a ligacao horizontal que a regra de dependencia 3
recusa. Duas declaracoes da mesma forma e o preco da regra, e o preco esta
declarado.

---

## O que ninguem decidiu

Nenhum destes itens e de T001, e nenhum deles foi tocado. Cada um cai numa tarefa
adiante.

### 1. 🔴 `UC-44` manda nao copiar a falha aberta; todo o resto manda copiar

Esta e a divergencia mais consequente desta feature, e T001 nao a resolveu.

**O lado "preservar"**, que e o que o pacote inteiro diz:

- `I7` / BR-MIGRAR-074: *"rota sem `permission_callback` **funciona**, emitindo
  apenas aviso de uso indevido desde a 5.5.0"*, e o texto do aviso ensina a
  declarar liberacao explicita. Ancora: `wp-includes/rest-api.php:121-133`.
- `BR-HUMANA-008`, em `target_architecture.md`: *"`BC-09` reproduz a falha
  **ABERTA** por padrao, como o legado. Mudar isso produz um sistema **mais
  fechado** que o legado, e e decisao humana"*.
- A `spec.md` desta feature, nos riscos: *"portar isso e portar uma brecha
  conhecida; fecha-la e divergir sem card que autorize, porque REQ-138 ficou
  fora"*.
- O cenario `@divida-herdada` de
  `parity_tests/18-superficies-de-escrita-paralelas.feature`: *"rota de escrita
  sem retorno de permissao declarado funciona, nas duas metades... nenhuma das
  duas nega por ausencia de declaracao"*.
- O P1 da constituicao: divergir do observavel exige decisao humana registrada e
  citada no codigo. Sao exatamente tres, e nenhuma e esta.

**O lado "nao copiar"**, que e uma frase so:

- `UC-44`, secao *O que um porte precisa saber*: *"a camada REST e a unica das
  tres camadas de autorizacao que falha aberta... Num porte, essa e a inversao
  mais importante a **nao copiar**"*.

As duas leituras nao se somam: uma delas produz um sistema mais fechado que o
original. **T002 e T003 encostam nisso** — T002 escreve o aviso, T003 executa a
declaracao de permissao. Ate alguem decidir, o que o pacote manda e preservar, e
quem preservar **nao** precisa de referencia nenhuma; quem fechar precisa da
referencia que o P1 cobra, e ela nao existe.

### 2. 🔴 No legado o registro nao nasce vazio, e uma das duas rotas meta nao tem historia

O construtor (`class-wp-rest-server.php:103-160`, com o comentario
`// Meta endpoints.` em `:105`) semeia `$endpoints` com **duas** rotas:

| rota | metodo | esquema | historia |
|---|---|---|---|
| `/` | `GET` | `context` com `default: 'view'` | **US-3** (T007): *"ha um endereco que lista as rotas registradas e os seus esquemas"* |
| `/batch/v1` | `POST` | `validation` (`enum: require-all-validate \| normal`, `default: normal`) e `requests` (`maxItems: get_max_batch_size()`) | 🔴 **nenhuma das nove** |

T001 nao semeia nenhuma das duas, e a razao e de divisao de tarefa: as duas tem
esquema de argumento declarado, e *"o formato de esquema de rota"* e a entrega de
**T002**. Semear aqui exigiria inventar o formato uma tarefa antes de quem o
especifica.

**A pendencia e `/batch/v1`.** E superficie publicada, e o P8 e absoluto: *"nao
remova funcao, constante, tabela, rota, superficie nem comportamento
publicado"*, e a tabela *Nao negociavel* poe remover rota entre o que exige
humano. Ela nao esta em `do-not-rewrite.md`, nao esta em `discard_log.md`, nao
esta nos dois descartes de *Fora de escopo* da `spec.md` (REQ-148 e REQ-179) e
nao tem card. **Ou seja: nao e descarte, e ausencia.** Quem fechar T007 registra
a pergunta em vez de decidir.

E note o numero: `get_max_batch_size()` (`:1722`) devolve **25**, por tras do
ponto de extensao `rest_get_max_batch_size`. E numero que o legado **tem**, logo
o P6 manda reproduzi-lo com o ponto de configuracao — nao e o caso do item 3.

### 3. 🔴 CA-4.4 pede um prazo de retencao que a constituicao proibe inventar

US-4 (REQ-141) cria um registro de acesso que **nao existe no legado**. `UC-44`,
nas pos-condicoes: *"nenhum registro da chamada foi guardado: nao ha log de
acesso a API"*. A `spec.md` e explicita na regra de negocio da propria historia e
nas perguntas em aberto: *"registro novo e permitido, prazo de retencao novo nao
se inventa"*.

E ainda assim CA-4.4 e **"o registro tem prazo de retencao declarado"**. A tabela
*Nao negociavel* da constituicao poe *"introduzir limite de taxa, prazo de
retencao ou qualquer numero que o legado nao tem"* entre o que o agente de
codificacao **nao** decide sozinho, com a resposta 19 e a 20 por tras. Os quatro
criterios de US-4 se dividem assim:

| criterio | situacao |
|---|---|
| CA-4.1, CA-4.3, CA-4.5 | registro e consulta novos. O P7 **permite**, com uma condicao: *"nenhuma ramificacao do codigo testa o resultado de escrever log"* |
| CA-4.2 | nao guardar credencial, corpo com dado pessoal nem cabecalho de sessao. Compativel, e e o que o slot `observabilidade` do `plan.md` compra com redacao embutida |
| CA-4.4 | 🔴 **conflito direto com P6 e com a tabela *Nao negociavel*** |

**T009 nao escolhe um lado.** O numero nao sai de `questions.md`, nao sai de ADR
e nao sai do legado.

### 4. 🔴 Duas rotas registradas que nenhum criterio de aceite cobre

Alem de `/batch/v1`, a leitura do oEmbed em T001 topou com outra. O controlador
registra **duas** rotas no espaco de nome `oembed/1.0`
(`wp-includes/class-wp-oembed-controller.php:25`, com `/embed` em `:34` e `/proxy` em `:63`):

| rota | permissao no legado | historia |
|---|---|---|
| `/embed` | `__return_true` — publica por desenho (`:42`) | **US-9** (T019) |
| `/proxy` | `get_proxy_item_permissions_check`, que exige `edit_posts` (`:148-151`) | 🔴 **nenhuma** |

`/proxy` e o lado **consumidor** — busca a representacao de um site remoto para o
editor. Ela tem declaracao de permissao e chamada HTTP de saida, e nao esta em
nenhum dos dois descartes da `spec.md`. Mesmo tratamento do item 2: registra-se a
pergunta.

### 5. 🔴 O cache de representacao embutivel: o `plan.md` e a arvore discordam

O `plan.md`, em *Modelo de dados*, poe o *"cache de representacao embutivel"*
nesta feature e diz que ele *"continua sendo conteudo: outro caso em que o
discriminador de tipo economizou uma tabela"*. O tipo existe mesmo:
`oembed_cache`, em `wp-includes/post.php:267`.

Mas quem **escreve** aquele tipo e o lado CONSUMIDOR
(`wp-includes/class-wp-embed.php:328` e `:514`), e US-9 e o lado PROVEDOR: a rota
`oembed/1.0/embed` chama `get_oembed_response_data()`
(`wp-includes/embed.php:561`, que e a ancora que a propria `spec.md` cita), e
aquela funcao **le** o conteudo e nao grava cache nenhum.

Pelo que a arvore mostra, portanto, **US-9 nao tem armazenamento**: ela le
conteudo, que e `BC-01` e entra por ligacao tardia. Quem fechar T019 confere isso
antes de abrir tabela ou tipo de conteudo. Esta registrado no cabecalho de
`portas/porta-de-dados.ts`, na tabela de quem usa a porta.

### 6. As perguntas que a propria `spec.md` ja registra em aberto

Nenhuma e de T001; ficam listadas porque cada uma cai numa tarefa adiante:

1. **REQ-138** (exigir declaracao explicita de permissao em toda rota, e recusar
   o registro sem ela) ficou `bloqueado` e nao entrou. E o item 1 acima por outro
   caminho: sem ele, *"o pacote porta a falha aberta sem nenhuma historia que a
   declare"*. **T002**, **T003** e **T007** dependem dele.
2. **O curto-circuito da operacao nomeada** (`I6` / BR-MIGRAR-073; o filtro
   `wp_pre_execute_ability` esta em `class-wp-ability.php:809` nesta arvore, que e
   a ancora de `UC-46` — BR-MIGRAR-073 cita `:787`) contorna normalizacao, validacao, permissao,
   execucao e validacao de saida — cinco etapas de uma vez —, e o docblock do
   legado avisa que *"a integridade do insumo passa a ser de quem
   curto-circuitou"*. REQ-143 especifica a execucao e **nao diz se o
   curto-circuito entra**: porta-lo e reproduzir um caminho que contorna toda a
   validacao, nao porta-lo e divergir de comportamento declarado. **T013**.
3. **REQ-012** (autenticar chamada nao interativa por credencial de aplicacao)
   ficou em `refinamento` e nao entrou, e US-1 e US-5 dependem dele. CA-5.2 —
   *"chamada autenticada por credencial de aplicacao nao exige esse token"* — nao
   tem como ser afirmado sem o outro lado. **T003** e **T011**.
4. **Os dois descartes de *Fora de escopo*** — REQ-148 (a superficie herdada com
   credencial no corpo da chamada) e REQ-179 (o segundo canal de escrita do
   painel) — estao em **conflito aberto e explicito** com a resposta 14, que
   nomeia os dois e decide que nao saem, porque *"o descarte vale como 'nao
   mudar', nunca como 'nao portar'"*. `ESC-SUPERFICIES` (BR-MIGRAR-107) manda as
   **quatro** superficies entrarem com o comportamento atual, e o ultimo cenario
   de `parity_tests/18-...feature` registra a divergencia entre os dois
   artefatos e nao a resolve. A tabela *Nao negociavel* poe *"resolver um dos
   conflitos entre card `wont` e resposta humana"* fora do que este agente
   decide. **Nenhuma tarefa deste `tasks.md` as implementa**, e se o conflito for
   decidido para o lado da resposta as duas precisam de spec propria, *"que este
   pacote nao tem"* (`plan.md`, *Migracao de dados*).
5. **REQ-148 e REQ-179 em *Sem tarefa*:** os 4 criterios de cada um afirmam a
   **ausencia** de um comportamento, e *"nao ha o que construir para
   satisfaze-los"*. Sao conferidos na revisao de superficie.

---

## Como conferir esta entrega

```sh
npm test            # a suite inteira; 8 testes sao de T001
node --test dist/contextos/superficies-programaticas/modulo.test.js
```

A paridade desta area se prova por dois arquivos de
`.specify/migration/parity_tests/`:

- `18-superficies-de-escrita-paralelas.feature` (fatia 10, `casos_de_uso:
  UC-44, UC-45`), para US-1 a US-6;
- `11-contratos-de-leitura-de-terceiro.feature`, para US-7, US-8 e US-9.

Os dois declaram `area_da_decisao_2: AREA 1` no cabecalho, e a **area 1** da
Decisao 2 de `parity_specs.md` e *"contrato de terceiro: REST, XML-RPC, feeds,
sitemaps, oEmbed, OPML — **saida byte a byte**, zero divergencia"*. E o criterio
mais severo do pacote: nao existe "99,99% byte a byte".

**Nenhum dos dois arquivos pode ser executado hoje**, e nao e por falta de
codigo: `parity_specs.md` registra que o oraculo executavel *"nesta arvore **nao
existe**"*, e ele e T001 da feature `015`. Ate ele existir, aqueles cenarios sao
spec de um arnes, nao suite.

O que T001 entrega e o pre-requisito **estrutural** daqueles cenarios: a porta
que o duplo substitui, e **um registro por composicao** — que e o que o cenario
`@concorrencia` de `18-...feature` cobra, *"a decisao de cada uma corresponde a
sua propria identidade... nenhuma resposta contem dado da outra conta"*, e a
unica linha da metrica primaria com tolerancia zero **sem excecao**.
