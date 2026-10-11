# Modulo de trabalho agendado — feature `011-trabalho-agendado`

Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, as quatro
portas e a fila vazia). Este arquivo e a leitura obrigatoria de quem pegar a
tarefa seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro
lugar**, e o que **ninguem decidiu**.

> 🔴 **Antes de qualquer coisa: tres das seis historias desta feature estao em
> conflito aberto, e as tarefas delas NAO COMECAM.** `tasks.md` abre com a
> advertencia: *"tres das historias desta feature (REQ-122, REQ-124 e REQ-125)
> estao em conflito aberto com a resposta 10 de `questions.md` ... Enquanto o
> conflito nao for decidido por uma pessoa, as tarefas delas nao comecam:
> construir qualquer um dos dois lados cria trabalho que o outro lado joga
> fora"*. Isso bloqueia **T003**, **T004**, **T007**, **T008**, **T009** e
> **T010**. A secao *O conflito que T001 declarou e nao decidiu* deste arquivo
> tem os dois lados, palavra por palavra.

> 🔴 **E se a sua tarefa toca o disparo (T003 em diante):** o comportamento
> correto do disparo e **falhar**. AD-07 e literal — *"o criterio de aceite
> verifica a falha, nao a latencia"* — e `parity_specs.md` marca criterio escrito
> em latencia como **no-go declarado (RISK-015)**. Numa runtime assincrona o laco
> de eventos sobrevive a resposta e a requisicao pode **completar**, o que apagaria
> a regra. Ver a secao 🔴 de `portas/porta-de-cliente-externo.ts`.

## O que T001 entrega, e so isso

> *o modulo carrega com as portas de dados, de relogio, de cache e de cliente
> externo declaradas, e a fila existe como dado inspecionavel e vazio*
> — `.specify/specs/011-trabalho-agendado/tasks.md`, T001

| arquivo | o que e |
|---|---|
| `index.ts` | a composicao: recebe as quatro portas e devolve o modulo |
| `portas/porta-de-dados.ts` | a unica porta deste modulo para o banco — a linha `cron` e a linha da trava |
| `portas/porta-de-relogio.ts` | o instante corrente, nas **duas** leituras que o legado faz |
| `portas/porta-de-cache.ts` | o cache de objeto, que e o **outro** lugar onde a trava mora |
| `portas/porta-de-cliente-externo.ts` | o disparo nao bloqueante — **declarado, nao chamado** |
| `fila/fila-agendada.ts` | a forma da fila e a fila vazia |
| `modulo.test.ts` | afirma a entrega de T001 e as invariantes que um esqueleto quebra em silencio |
| `fila/fila-agendada.test.ts` | afirma a forma do dado, a fila vazia e o congelamento dela |

**Nenhuma regra de negocio esta implementada**, e nenhuma operacao esta exposta. A
superficie do modulo e `{ nome, portas, fila }`, e `modulo.test.ts` a congela
nessas tres chaves de proposito: a lista cresce **na tarefa de cada historia**,
com a declaracao explicita de permissao que o **P4** cobra — inclusive quando a
permissao e **nenhuma**, que e o caso de avancar a fila (UC-39: *"o endpoint da
fila e publico e nao autenticado; o unico freio e uma trava de tempo de 60
segundos"*).

**Nenhum numero mora neste modulo hoje**, e a ausencia e deliberada. Os dois numeros
desta feature — **60 segundos** de trava e o **descarte dela depois de 10 minutos**
— entram com **T002**, que e a tarefa que os implementa e que escreve o teste de
borda que o **P6** exige (*"no ultimo instante aceita, um instante depois
recusa"*). Numero que aparece antes da tarefa dele e numero sem teste de borda.

## As quatro portas, e por que sao estas

`tasks.md` as pede pelo nome em T001. Tres estao entre as cinco de AD-08; o
relogio nao esta, e o motivo de estar aqui e o mesmo que as features `001` e `005`
registraram.

- **Dados** e o slot `persistencia` de `plan.md`. Esta feature nao tem tabela —
  tem **duas linhas** da tabela de opcoes: `cron`, que e a fila inteira
  (`wp-includes/cron.php:1262` e `:1304`), e `_transient_doing_cron`, que e a
  trava quando nao ha cache externo, lida por uma consulta **escrita a mao com
  `LIMIT 1`** (`wp-cron.php:75`).
- **Cache** e o slot `cache`, e uma das cinco de AD-08. Existe porque a trava e um
  transiente, e transiente no legado mora no cache **ou** no banco conforme
  `wp_using_ext_object_cache()` (`wp-includes/option.php:1455` e `:1541`). O ramo
  e observavel: com cache por requisicao em memoria do processo — o candidato
  recomendado —, a trava **nao sobrevive a requisicao** que a tomou.
- **Relogio** nao esta em AD-08, e a tensao e a mesma das outras features: o que
  AD-08 recusa e dar porta ao barramento, a traducao e ao escape, por custo de
  indirecao; o relogio nao substitui sistema externo, e sem ele a trava de T002
  nao e *"verificavel com relogio controlado"*, como a propria entrega da tarefa
  exige. **Ele tem duas leituras**, porque o legado tem duas, e elas nao sao a
  mesma coisa — ver a tabela em `portas/porta-de-relogio.ts`.
- **Cliente externo** e o slot `cliente-http`, a primeira porta do plano. Tem um
  uso so, que e o disparo, e esse uso esta no centro do conflito aberto.

**As portas sao sincronas** (AD-04), e aqui isso e mais do que estilo: AD-07 avisa
que numa runtime assincrona o disparo pode **completar**, e e a falha dele que o
criterio de aceite verifica.

**As portas repetem a forma das de outros contextos, e a duplicacao e a regra:** a
regra de dependencia 3 proibe contexto importar contexto no topo do modulo, e a 4
poe a porta no modulo que a **consome**. A camada de dados de verdade e trabalho
da feature `015`; enquanto ela nao existe, cada contexto declara a sua.

## A fila: o que T001 declarou dela

| | |
|---|---|
| forma | lista ordenada de instantes, cada um com ganchos, cada gancho com ocorrencias |
| identidade de uma ocorrencia | **gancho + argumentos**; a chave e `md5( serialize( args ) )` (`wp-includes/cron.php:132`, `:319`) |
| evento unico | grava `schedule` (falso) e `args` — **sem** `interval` (`wp-includes/cron.php:202`-`205`) |
| evento recorrente | grava `schedule`, `args` e `interval` (`wp-includes/cron.php:323`-`327`) |
| ordem | e **dado gravado**: `uksort( $crons, 'strnatcasecmp' )` na insercao (`:206`, `:328`) |
| versao | **nao existe em memoria**: `_get_cron_array()` a retira (`:1275`), `_set_cron_array()` a poe (`:1302`) |
| vazia | o que `_get_cron_array()` devolve quando a opcao nao e arranjo (`:1262`-`1265`) |

**Por que lista e nao dicionario.** Porque a ordem e dado, e PT-005 a cobra no
mesmo cenario em que cobra os bytes: *"a estrutura serializada lida e identica
byte a byte nas duas"* e *"a ordem das tarefas dentro da estrutura e a mesma nas
duas"*. Um dicionario deste runtime reordenaria chave numerica por conta propria e
esconderia justamente o que ha para conferir — e e a mesma razao pela qual
`plataforma/serializacao/valor-php.ts` escolheu *"uma lista ordenada de entradas,
e nao um mapa"*.

**Por que os argumentos sao `EntradaDeArranjo` do codec**, e nao valor nativo: a
identidade sai dos **bytes** do formato serializado, e no codec inteiro e decimal
sao tipos diferentes, a chave de arranjo e inteiro ou texto, e a ordem de insercao
e observavel. Ha um detalhe que engana: a documentacao do legado diz que *"as
chaves do arranjo sao ignoradas"* (`wp-includes/cron.php:239`), e isso vale para o
**despacho** (`do_action_ref_array( $hook, $v['args'] )`, `wp-cron.php:191`), nao
para a identidade — `array( 'a' => 1 )` e `array( 1 )` sao eventos **diferentes**
na fila.

**O que a fila ainda NAO faz, e de quem e:** gravar e ler no ponto de configuracao
e a trava sao **T002**; avancar a fila e **T003**; a exclusao entre processos e
**T005**; reagendar o recorrente antes de executar e **T011**.

## O conflito que T001 declarou e nao decidiu

`spec.md` registra, em *Perguntas em aberto*, duas decisoes humanas em sentidos
opostos sobre **o que faz a fila avancar**:

| lado | onde esta escrito | o que diz |
|---|---|---|
| a spec | **CA-1.1** e **CA-1.2**, e UT-122-1, UT-122-2, UT-122-6, UT-122-7, UT-122-8 em `backlog/tests.md` | o evento executa *"no instante marcado num site sem visita alguma"*, o gatilho *"nao e uma requisicao do proprio site para si mesmo"*, e a fila e *"componente proprio, e nao lista na configuracao do site"* |
| a analise | **resposta 10**, **AD-07**, BR-MIGRAR-053 (`A9`), PT-005 `@critico` | a fila *"so avanca quando chega requisicao HTTP"*, o disparo e nao bloqueante com 0,01 s e sem verificar TLS, e trocar por agendador do sistema *"produz um produto que se comporta diferente no primeiro dia"* |

A constituicao poe *"resolver um dos conflitos entre card `wont` e resposta
humana"* na tabela do que **nao** se decide sozinho, e o pacote declara que nao
escolhe. **T001 nao escolheu**, e fez quatro coisas para que a escolha continue de
quem decide:

1. **Declarou as quatro bordas que T001 pede pelo nome, e nao chamou nenhuma.**
   Nenhum codigo deste modulo dispara, agenda, le ou grava.
2. **Separou a forma da fila da morada dela.** O que `fila/fila-agendada.ts`
   declara e o **conteudo** — instante, gancho, argumentos, recorrencia —, que e o
   mesmo nos dois lados. **Onde** ele mora e o que esta em disputa, e e a entrega
   de T002 que o nomeia.
3. **Escreveu o disparo de modo a nao poder completar**: `ResultadoDeDisparo` nao
   tem resposta, porque com `blocking` falso nao existe resposta para ler. E a
   forma mais barata de impedir que o alvo acerte demais (AD-07).
4. **`modulo.test.ts` afirma que compor o modulo nao dispara nada.** Se o
   esqueleto emitisse o disparo ao ser criado, ele teria decidido o conflito por
   omissao.

**Quem pegar T003, T007 ou T009 para aqui e registra.** Tem mais tres perguntas
abertas na mesma spec, e nenhuma delas e deste modulo:

- **REQ-124 e REQ-125 contra a resposta 20.** O legado nao guarda registro de
  execucao nenhum (UC-39: *"nenhum registro do que rodou foi guardado"*), e
  `ESC-RETENCAO` (BR-MIGRAR-113) proibe inventar prazo de retencao. O **P7**
  permite acrescentar registro **desde que nenhuma decisao do sistema passe a
  depender dele**; tornar o registro e o aviso **obrigatorios** e divergencia que
  precisa de decisao humana registrada.
- **As quatro implementacoes do protocolo de retorno ao proprio site**
  (BR-HUMANA-005). A duplicacao esta **admitida em comentario** no legado
  (`wp-admin/includes/class-wp-site-health.php:3622`). A recomendacao registrada e
  unificar **com a conferencia antes, nao como formalidade**. Este modulo declara
  **uma** delas, a do agendador; as outras tres sao da feature `010`.
- **Se a resposta 10 prevalecer, a feature tem tres historias e nao seis.** Isso
  precisa ser dito por quem decide.

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Mensageria.** `plan.md` e a Lacuna 1 de `pending_decisions.md` sao explicitos:
  *"nenhuma"*, e *"num porte nao ha mensageria a migrar: ha uma a construir, e a
  resposta humana foi nao construir"*. AD-01 e AD-06 fecham a conta: zero broker,
  zero DLQ, zero *retry* generico.
- **O disparo por salto no navegador do visitante** (`ALTERNATE_WP_CRON`,
  `wp-includes/cron.php:937`). E o card **REQ-128**, de prioridade `wont`, e a
  secao *Sem tarefa* de `tasks.md` nao lhe da tarefa: *"os 3 criterios deste card
  afirmam a ausencia de um comportamento no sistema novo"*. 🔴 **Com uma
  peculiaridade registrada:** o descarte depende de REQ-122, que esta ele mesmo em
  conflito — *"se a resposta 10 prevalecer ... o modo alternativo volta a ter razao
  de ser"*. Ninguem decidiu, e portanto nem construir nem descartar e decisao deste
  modulo.
- **Limite de taxa.** BR-MIGRAR-112 (`ESC-LIMITE-TAXA`): *"nenhuma superficie de
  entrada tem limite de taxa, e os dois unicos freios sao travas de tempo"*. A
  constituicao poe inventar numero que o legado nao tem na tabela do que exige
  decisao humana, e a resposta 19 poe limite de taxa **fora do nucleo**, como
  decisao de implantacao.
- **Exclusao real entre processos.** `plan.md` e o risco 3 avisam: a trava do
  legado *"nao e trava de verdade: e marcacao otimista com prazo"*, e construir
  exclusao real e **melhoria**, logo divergencia — *"um evento que hoje roda duas
  vezes passa a rodar uma, e isso e observavel"*. REQ-123 (US-2) pede exclusao
  real; quem pegar **T005** le o risco 3 antes da primeira linha.
- **Transacao em torno da fila.** Zero `START TRANSACTION` e zero `COMMIT` em
  1.467 arquivos (BR-MIGRAR-104), e a nota 1 de `target_business_rules.md` trata o
  caso por nome: a trava pessimista e a transacao ACID **nao existem neste
  sistema**, e as travas de tempo *"sao observaveis, logo migram"*.
- **Registro do que rodou.** Ver a pergunta aberta de REQ-124 acima. E o cenario
  `@divida-herdada` de PT-005 cobra o silencio do disparo: *"nenhuma das duas
  escreve arquivo de log"*.

## Quem espera por este modulo

`plan.md` registra, na secao *Sequencia*: esta feature depende de `015` (registro
estruturado e camada de dados) e e dependencia de **seis** outras — `002`
(publicacao agendada), `005` (coleta da lixeira), `007` (descarte do spam
vencido), `008` (expiracao e varredura), `009` (aparencia agendada) e `010`
(atualizacao automatica). *"Seis das quinze features esperam por ela, o que faz
desta a feature mais urgente de decidir e a mais arriscada de comecar."*

Cada uma delas chega pela **porta de fila agendada dela**, nunca por `import`
deste modulo: a regra de dependencia 3 proibe `contextos/<a>` importar
`contextos/<b>` no topo do modulo, **sem excecao**.
`contextos/retencao-e-descarte/portas/porta-de-fila-agendada.ts` ja e esse
exemplo, e vale ler o cabecalho dele antes de desenhar a superficie publica desta
feature: ele declara, do lado do cliente, o que esta fila precisa oferecer
(`proximaOcorrencia`, `agendarRecorrente`) e **o que ela nao deve deixar o cliente
fazer** (disparar).

## Como esta entrega se confere

- `npm run typecheck` e `npm test` — as afirmacoes de T001 estao em
  `modulo.test.ts` (8) e `fila/fila-agendada.test.ts` (6).
- Pela paridade: **PT-005**
  (`.specify/migration/parity_tests/05-agendador-e-loopback.feature`), que e a
  **fatia 5, fatia propria por mandato do paradigma**. A metade dele que depende
  de T001 e a **forma** do dado e a superficie do disparo; a metade que depende da
  fila gravada, da trava e da execucao vem com T002, T003 e T005 — e os cenarios de
  US-1 sao cobrados dos dois lados do conflito, que e por que eles nao comecam
  antes da decisao.
