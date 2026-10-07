---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: parity_specs
producedBy: inspector
hash: "sha256:697d9b732f84ac3e679b990d241bc6efe5fbafd33dedac74cca1bf6290bf1fff"
---

# Parity Specs

> Estratégia de validação de equivalência comportamental entre o legado e o sistema novo, adaptada ao
> paradigma escolhido em [`paradigm_decision.md`](paradigm_decision.md).
> **Os artefatos desta etapa são specs de paridade, não testes executáveis.** Nenhum arquivo
> `parity_tests/*.feature` cita framework de teste; a tradução para a ferramenta escolhida é do agente de
> codificação.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Evidência direta em artefato do `_reversa_sdd/`, com seção citada |
| 🟡 INFERIDO | Padrão observado nos artefatos, sem afirmação explícita |
| 🔴 LACUNA | Não dedutível pelas specs disponíveis |

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental deste processo e não
entraram em nenhuma contagem deste documento.

---

## O chão desta etapa, antes da estratégia

Três fatos mudam como este documento deve ser lido. Nenhum foi contornado por invenção.

### 1. 🔴 O handoff ao Inspector está BLOQUEADO, e esta etapa rodou dentro do bloqueio

[`screen_deviation_log.md`](screen_deviation_log.md) declara **5 deviations, todas `pendente`**, e o
próprio documento fixa a regra: *"Deviations pendentes bloqueiam o handoff ao Inspector."* O pré-requisito
do SKILL desta etapa — `screen_deviation_log.md` **sem deviations pendentes** — **não está cumprido**.

O que foi feito: a instrução de execução desta etapa manda rodar do início ao fim sem pedir confirmação e
registrar a dúvida no artefato apropriado. Logo este documento **existe**, e a § *Exceções* propaga as
**cinco** deviations com o status real (`pendente`), em vez de propagar apenas as aprovadas, como o SKILL
previa. **Consequência prática, declarada para não ser descoberta depois:** a paridade visual das 14 telas
em modo literal (`DEV-002`) é **não verificável hoje** e os 14 cenários `@paridade-visual` nascem com
validação **manual**, não automatizada — ver § *Paridade de telas*.

> ⚠️ **Divergência entre dois artefatos, registrada porque muda a contagem.**
> [`.state.json`](.state.json) `currentAgent.handoffBlockReason` diz *"4 deviations pendentes (DEV-001 a
> DEV-004)"*; [`screen_deviation_log.md`](screen_deviation_log.md) § *Resumo* diz **5**, e lista `DEV-005`
> (`press-this`) com `Aprovação: pendente`. Este documento segue o log, que é o artefato de registro, e
> trata `DEV-005` como pendente. Quem for ratificar precisa responder **cinco**, não quatro.

### 2. 🔴 Dois outros pré-requisitos também estão em branco — e os dois são decisão humana, não lacuna técnica

| Pré-requisito do SKILL | Estado | Onde está a lacuna |
|---|---|---|
| `paradigm_decision.md` | 🟢 **cumprido** | Opção 3 (híbrido) decidida no gate `paradigm`, 2026-10-06 |
| `migration_strategy.md` **com estratégia confirmada** | 🔴 **não cumprido** | § 6 *Decisão humana* está **em branco**: `Estratégia escolhida: <A \| B \| C> — em branco` |
| `target_architecture.md` (**arquitetura aprovada**) | 🟡 **parcial** | o artefato existe e está completo; nenhum campo de aprovação humana existe nele |
| `screen_modernization_decision.md` | 🟡 **parcial** | modo `híbrido`, mas `decisionStatus` é `premissa-de-execucao-autonoma-pendente-de-ratificacao`, com `decidedBy` e `decidedAt` `null` |
| `screen_deviation_log.md` sem pendências | 🔴 **não cumprido** | 5 de 5 pendentes (item 1 acima) |

**Premissa de trabalho adotada, reversível e declarada:** a estratégia é a **recomendação** do Strategist —
**A (Strangler Fig por superfície HTTP com banco compartilhado) + B (Parallel Run obrigatório)** — porque é
a única que a § 4.2 de [`migration_strategy.md`](migration_strategy.md) recomenda e porque a § 9 do mesmo
documento endereça ao Inspector exatamente o *"critério de aceite por fatia da § 4.4"* e o *"arnês de
Parallel Run como obrigação permanente nos domínios regulados"*. **Se a resposta for B+C** (porque
`BR-HUMANA-003` veio como `(a)` e derrubou o banco compartilhado), **este documento muda em dois pontos
nomeados**: o *shadow mode* perde o espelho de leitura do *proxy* e a § *Data parity* ganha uma ETL com
janela por instalação. Ver § *O que muda se a decisão for outra*.

### 3. 🔴 O corpus de entrada do Parallel Run NÃO EXISTE, e sem ele nenhuma métrica percentual tem denominador

[`migration_strategy.md`](migration_strategy.md) § 8 dúvida 7: *"O corpus de entrada do Parallel Run não
existe e nenhum dos 181 cards o cobre — é o maior custo escondido do projeto, e hoje não está em plano
nenhum."* Somado a isso: **zero arquivos de teste** em 3.381 (`state.json`, `tech_stack`) e os **985 testes**
de [`../backlog/tests.md`](../backlog/tests.md) são **especificação, não evidência** — é o que
[`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes* endereça a este agente.

**Efeito sobre a métrica primária:** *"índice de divergência funcional < X%"* é incomputável até que alguém
declare o corpus, porque o denominador é o número de execuções comparadas. Por isso a § *Critérios de
"paridade aceita"* abaixo fixa **a parte binária da métrica como obrigatória desde a primeira virada** (zero
divergência nas áreas de comparação exata) e marca a parte percentual como **parametrizada pelo corpus**,
com a construção do corpus declarada como **pré-requisito da fatia 0**.

---

## Estratégia geral

**Modos de validação aplicáveis** — marcados os que se aplicam a este sistema:

- [x] **Shadow mode** (espelhamento de tráfego com comparação assíncrona)
- [x] **Characterization tests** (suíte derivada do comportamento atual do legado)
- [x] **Contract tests** (interfaces externas)
- [x] **Data parity** (snapshots e checksums)
- [x] **Outro: golden file comparison** (`html-css-snapshot`) — exigido pelo modo **literal** das 14 telas
- [x] **Outro: contract test de tela** — exigido pelo modo **modernizado** das 99 telas
- [x] **Outro: teste de estado entre requisições concorrentes** — **5ª área da Decisão 2**, e nenhum dos
      quatro modos do catálogo a cobre
- [x] **Outro: teste de falha de disparo** — a fatia 5 é a única em que o comportamento correto é um
      **fracasso**, e o critério de aceite é a falha, não a latência
- [ ] ~~Fila, *broker*, DLQ ou *replay* de mensagem~~ — **não se aplica por decisão**: a stack alvo não tem
      mensageria (`AD-01`, `AD-06`, P10)

### Detalhe por modo

| Modo | Onde se aplica | Mecanismo | Fonte |
|---|---|---|---|
| **Shadow mode** | toda superfície **somente leitura** (fatias 2, 3, 4) | o *proxy* de virada espelha a leitura para o arnês de paridade, que compara as duas saídas de forma assíncrona; o oráculo **nunca serve tráfego** | [`target_architecture.md`](target_architecture.md) § *Diagrama* (`Proxy -.espelho de leitura.-> Arnes`) |
| **Characterization tests** | os 47 casos de uso e as 117 regras MIGRAR | suíte **derivada** do comportamento do legado executando, não do código lido — e **não existe base pronta**: `_reversa_sdd/characterization_specs/` não existe nesta árvore (ver § *Reuso*) | [`../use-cases/use-cases.md`](../use-cases/use-cases.md) · [`target_business_rules.md`](target_business_rules.md) |
| **Contract tests** | REST, XML-RPC, feeds RSS/Atom, `wp-sitemap.xml`, oEmbed, OPML, *abilities* via REST — **7 superfícies produzidas**, 29 integrações, 64 *endpoints* | comparação **byte a byte** da resposta; e, separadamente, **byte a byte no valor devolvido por hook** nos 2.460 pontos de filtro | [`../integrations/integrations.md`](../integrations/integrations.md) · `EXT-FILTROS` ([`BR-MIGRAR-102`](target_business_rules.md#br-migrar-102)) |
| **Data parity** | as 18 tabelas, 135 colunas, 59 índices, **zero chaves estrangeiras** | *snapshot* antes de cada virada + *checksum* por tabela depois; **e teste de ida e volta do codec de `serialize()`**, que é *no-go* se vermelho | [`../erd-complete.md`](../erd-complete.md) · `DB-SER` ([`BR-MIGRAR-082`](target_business_rules.md#br-migrar-082)) · [`cutover_plan.md`](cutover_plan.md) § 6.2 |
| **Golden file** | as **14** telas em modo literal | comparação do **HTML emitido** dentro das `normalizationRules` do manifest — **não pixel** | [`../screens/golden/manifest.yaml`](../screens/golden/manifest.yaml) · `DEV-002` |
| **Contract test de tela** | as **99** telas em modo modernizado | hierarquia de componentes, eventos declarados, conteúdo textual e os 4 estados (`idle`, `loading`, `error`, `success`); sem byte a byte | [`screen_modernization_decision.md`](screen_modernization_decision.md) § *Implicações para o Inspector* |
| **Concorrência** | toda superfície **autenticada** (fatias 6, 7, 8, 9, 11) | duas requisições simultâneas com identidades diferentes; o teste é **próprio**, fora dos 47 UCs | implicação 2 · `EXT-CONTEXTO` ([`BR-MIGRAR-105`](target_business_rules.md#br-migrar-105)) · `RISK-011` |
| **Falha de disparo** | fatia 5 — agendador e *loopback* | verificar que o disparo **falha**: *timeout* 0,01 s, `blocking` falso, `sslverify` falso; e que a lixeira do ambiente de referência **não** esvazia sem visita autenticada ao painel | `AD-07` · `A9` ([`BR-MIGRAR-053`](target_business_rules.md#br-migrar-053)) · `R5` ([`BR-MIGRAR-034`](target_business_rules.md#br-migrar-034)) · [ADR-0006](../adrs/0006-retencao-agendada-por-visita-ao-painel.md) |

### O oráculo, que é pré-condição de todos os modos

`ESC-ORACULO` ([`BR-MIGRAR-116`](target_business_rules.md#br-migrar-116)) já compra a **instalação de
referência executável do legado na mesma versão** (P16: *"sem execução do legado, equivalência é afirmada e
não verificada"*). Nesta árvore ele **não existe**:
[`../screens/golden/manifest.yaml`](../screens/golden/manifest.yaml) declara `oracleAvailable: false` com
quatro causas — sem `wp-config.php`, sem banco, sem `wp-includes/js/dist/`, zero *fixtures*.

**Logo nenhum arquivo `.feature` desta etapa pode ser executado hoje.** Eles são specs de um arnês que a
fatia 0 constrói. O passo 8 da § 4.2 de [`cutover_plan.md`](cutover_plan.md) mantém a referência no ar
**depois** do corte final, sem servir tráfego, e a razão está lá: com **0 arquivos de log** nesta árvore,
não há substituto para ela (`RISK-023`).

---

## Critérios de "paridade aceita"

A **Decisão 2** (respondida no gate `paradigm`, replicada em
[`target_business_rules.md`](target_business_rules.md) § 3) define o critério de "idêntico" como
**combinação por área**. A métrica primária deste documento **é** essa combinação, e não um número único —
relatório com número único é sintoma de falso verde e é *no-go* declarado
([`cutover_plan.md`](cutover_plan.md) § 6.2, `RISK-010`).

### Métrica primária

| # | Área | Critério | Tolerância | Corpus necessário |
|---|---|---|---|---|
| 1 | Contrato de terceiro: REST, XML-RPC, feeds, *sitemaps*, oEmbed, OPML | **saída byte a byte** | **zero** divergência | lista de *endpoints* × parâmetros |
| 2 | Valor devolvido por hook (2.460 `apply_filters`) | **byte a byte no valor** | **zero** divergência | um caso por ponto de filtro exercitado |
| 3 | Esquema e efeito de escrita no banco | **efeito no banco**, incluindo a cascata de 7 etapas e os órfãos que o legado deixa de propósito | **zero** divergência | *snapshot* + sequência de comandos |
| 4 | HTML de tema e painel | **comportamento de caso de uso** (os 47 UCs) | **< 1%** de divergência funcional | um percurso por UC |
| 5 | Estado entre requisições concorrentes | **teste próprio**, fora dos UCs | **zero** — **sem exceção** | pares de requisição simultânea por superfície autenticada |

> **Por que a linha 4 é a única com tolerância percentual.** As linhas 1 a 3 são comparação **exata**: não
> existe "99,99% byte a byte". A linha 5 não tem tolerância por decisão explícita — é o único risco do
> registro cujo campo *trigger* diz que **não há sinal natural**, porque nenhum dos 985 testes exercita
> concorrência (`RISK-011`), e `cutover_plan.md` § 6.2 o põe como *no-go* **sem exceção**. A linha 4 tolera
> porque "comportamento de caso de uso" não é comparação de bytes: é verificação de que o percurso produz o
> mesmo efeito observável.

> 🔴 **O valor de 1% da linha 4 é o único número deste documento que não vem de artefato anterior.** Ele é a
> linha *"Web app sem regulação forte → divergência funcional < 1% por 7 dias"* da matriz de referência do
> SKILL (`references/parity-coverage-matrix.md`), aplicada ao recorte de HTML de painel e de tema — que é a
> única área sem contrato de terceiro e sem dado regulado. **É parâmetro, não medida**, e muda com o corpus.
> Registrado em § *Lacunas* como `LACUNA-IN-02`.

### Janela de observação

| Marco | Janela | Fonte |
|---|---|---|
| *Go* de **cada** virada de superfície | **7 dias corridos** sem divergência nova, pelo critério da área da superfície | [`cutover_plan.md`](cutover_plan.md) § 6.1 |
| Observação estendida **por superfície virada** | **30 dias**, com o corpus rodando diariamente contra o oráculo | [`cutover_plan.md`](cutover_plan.md) § 7.1 |
| Corte final — lançamento da versão 1 | todas as superfícies viradas e sob observação estendida há **≥ 30 dias** sem divergência nova | [`cutover_plan.md`](cutover_plan.md) § 4.2 passo 1 |
| Domínios regulados (`D1`–`D6`, `R7`, `R8` — 7 regras LGPD/GDPR) | **Parallel Run permanente**, não temporário — não há janela que o encerre | [`cutover_plan.md`](cutover_plan.md) § 4.1, fatia 8 · caso de borda regulatório do SKILL |

### Critério de bloqueio do cutover

Qualquer um basta. Os primeiros oito são a § 6.2 de [`cutover_plan.md`](cutover_plan.md); os três últimos
são acréscimo desta etapa, derivados das implicações do paradigma.

| # | Bloqueio | Risco |
|---|---|---|
| 1 | **Teste de concorrência inexistente ou vermelho** em superfície autenticada — sem exceção | `RISK-011` |
| 2 | Codec de `serialize()` sem teste de ida e volta verde | `RISK-005` |
| 3 | Cookie, *nonce* ou sessão incompatíveis entre as metades | `RISK-006` |
| 4 | Cache de objeto persistente ligado em **qualquer** das duas metades | `RISK-009` |
| 5 | Extensão ativa na referência fora da lista congelada — contamina toda comparação | `RISK-008` |
| 6 | Relatório de paridade com **número único**, sem quebra por área | `RISK-010` |
| 7 | Divergência intermitente sem causa identificada | `RISK-009` |
| 8 | Fatia 5 com critério de aceite escrito em **latência** em vez de em **falha do disparo** | `RISK-015` |
| 9 | **Deviation de tela ainda `pendente`** na superfície que vai virar — hoje são 5 de 5 | § *Exceções* |
| 10 | Divergência em **ordem de emissão de HTML** atribuível a posição de `await` — é saída observável e nenhum teste de UC a apanha | implicações 1 e 6 · `AD-04` |
| 11 | Contagem de **e-mails ao administrador** divergente do oráculo em `A5`, `A6` ou `A7` | implicação 4 · `AD-06` |

---

## Cobertura adaptada ao paradigma

### A transição, nomeada

| | |
|---|---|
| **Paradigma do legado** | híbrido — **procedural dominante** com barramento de eventos **síncrono e com retorno de valor** (69,7% dos pontos), e **OO clássico em bolsões** |
| **Paradigma alvo** | **Opção 3 — híbrido** 🟢 DECIDIDA: *comportamento observável conservador, estrutura interna idiomática*, sobre runtime **assíncrona e longo-viva**. `derived_appetite: balanced` |
| **Severidade do gap** | **alto**, por duas causas independentes que se somam |
| **Teste de borda de toda decisão** | *muda a saída HTTP, o efeito no banco ou o comportamento de caso de uso?* Se não muda, pode ser idiomático |

### Quais linhas da tabela do SKILL se aplicam, e quais não

| Transição da tabela | Aplica? | Dimensões obrigatórias aqui |
|---|---|---|
| **sem mudança** | 🟢 **sim, como piso** | equivalência funcional padrão: mesma entrada → mesma saída → mesmo efeito colateral observável. É o piso porque a Opção 3 **decidiu** manter o comportamento observável conservador |
| **procedural → OO** | 🟢 **sim** | **invariantes em aggregates** e **validação em factories / construtores**: o legado *"não encapsula invariante"* e o alvo declara **21 aggregates** que ganham a invariante **sem mudar onde o dado mora** |
| **OO clássico → OO com DI** | 🟢 **sim, com adaptação** | a linha fala de *"sem dependência de Active Record, mocks de repositório"*. **Não há Active Record** aqui (zero ORM), mas há o defeito equivalente: **estado global** (`$wpdb`, `$wp_query`, `$wp_filter`, `$current_user`). A dimensão adaptada é **comportamento equivalente sem dependência de estado global**, com as **5 portas** substituídas por duplo de teste |
| **síncrono → event-driven** | ❌ **não** | **por decisão**, não por omissão: `AD-03` mantém o barramento síncrono e com retorno; `AD-01` e `AD-06` declaram zero *broker*, zero DLQ, zero *retry* genérico; a stack alvo **não tem mensageria** (P10). Logo `@dlq` e `@saga` **não existem** neste conjunto, e `@idempotencia` e `@ordem` aparecem só onde **a regra do legado** já era de idempotência ou de ordem |
| **OO → funcional** | ❌ não | o alvo não é funcional |
| **qualquer → actor model** | ❌ não | o alvo não tem atores |

### 🔴 Duas dimensões que a tabela do SKILL não tem, e que esta transição exige

É o achado desta etapa. A travessia muda **dois eixos** — sincronia e **tempo de vida do processo** — e o
segundo não está em nenhuma linha de nenhum catálogo, porque é específico desta árvore
([`paradigm_decision.md`](paradigm_decision.md) § *A ambiguidade que esta etapa existe para desfazer*).

| Dim. | Nome | Por que nenhuma linha da tabela a cobre | Como provar | Tag |
|---|---|---|---|---|
| **D-A** | **Escopo de requisição → escopo de processo** | no legado `$wpdb`, `$wp_query`, `$wp_filter` e `$current_user` **são de fato** variáveis de requisição, porque o processo é descartado no fim da resposta. Numa runtime longo-viva o mesmo módulo atende N requisições concorrentes e esse estado passa a ser **compartilhado**: duas requisições trocam de identidade entre si. São 1.121 `global $`, 3.410 usos de superglobal em 216 arquivos e 1.279 `current_user_can` em 224 | duas requisições **simultâneas** com identidades diferentes, em toda superfície autenticada, conferindo que a decisão de autorização de cada uma corresponde à sua própria identidade. Mais: entrar numa metade e navegar para a outra atravessando a fronteira do *proxy* | `@concorrencia` |
| **D-B** | **Fronteira de `await` e ordem do observável** | "idêntico" passa a depender de **onde se põe o `await`**. `await` no meio dos 1.463 `echo`/`print` muda a **ordem de emissão do HTML**, que é saída observável. E há um caso em que o alvo **acerta demais**: o disparo não bloqueante do agendador **aborta** em PHP e pode **completar** numa runtime assíncrona — o comportamento a preservar é a **falha** | ordem de emissão comparada byte a byte na saída completa, não só no conjunto de fragmentos; e, na fatia 5, verificar que o disparo **falha** e que a lixeira não esvazia sem visita autenticada | `@ordem-de-emissao` · `@falha-de-disparo` |

**E uma terceira, que não vira cenário Gherkin — e isso é declaração, não omissão:**

| Dim. | Nome | Por que não há `.feature` |
|---|---|---|
| **D-C** | **Ciclo de módulo ESM** | 68 dos 71 módulos num único componente fortemente conexo, com **254 ciclos de dois módulos**. No legado o ciclo atravessa de graça por `require`; em ESM, uma importação circular lida na avaliação do módulo é **erro de inicialização**. Mas isso é **falha de *build*, não divergência de comportamento**: é verificado pela regra de dependência que `AD-11` manda entrar no *build* **falhando** nas 175 violações conhecidas, com lista de exceções datada. Escrever um cenário Gherkin para isso seria teatro: o teste é o *build*, e o indicador é a contagem de violações publicada lado a lado com a cobertura de paridade (passo 12 da § 4.1 de [`cutover_plan.md`](cutover_plan.md), `RISK-027`) |

### Cenários mínimos por fluxo, derivados das linhas aplicáveis

| Dimensão | Tag | Obrigatória em |
|---|---|---|
| Equivalência principal | `@paridade` | **todos** os fluxos |
| Fluxo crítico (regulado, dado sensível, decisão de acesso) | `@critico` | os fluxos marcados como críticos no índice |
| Requisito formal externo (LGPD/GDPR) | `@regulatorio` | `12-solicitacao-de-dado-pessoal`, e a minimização de `17-` |
| Invariante de aggregate validado | `@invariante` | todo fluxo cujo aggregate tem invariante em [`target_domain_model.md`](target_domain_model.md) |
| Equivalente sem dependência de estado global | `@composicao` | todo fluxo que o legado só executa com `global $` ou função substituível |
| Estado entre requisições concorrentes | `@concorrencia` | toda superfície **autenticada** |
| Ordem de emissão do observável | `@ordem-de-emissao` | fluxos que emitem HTML ou que atravessam ponto de filtro com retorno |
| O disparo tem de **falhar** | `@falha-de-disparo` | fatia 5 e a coleta da lixeira |
| Reprocessamento não duplica efeito | `@idempotencia` | **só** onde a regra do legado já é de idempotência (`P7`, `A6`, `D3b`) |
| A ordem de avaliação é a regra | `@ordem-de-decisao` | a cascata de moderação (`C1`–`C12`) |
| A cascata de 7 etapas e os 3 contadores | `@cascata` | exclusão de conteúdo e de termo |
| Substituição por registro explícito ou presença de arquivo | `@substituicao` | as 38 funções, as 176 guardas e os 4 *drop-ins* |
| Dívida herdada **de propósito** | `@divida-herdada` | onde um adaptador bem escrito **consertaria por acidente** |
| Comparação de HTML emitido contra *golden file* | `@paridade-visual` | as **14** telas em modo literal |
| Contrato semântico de tela | `@paridade-contrato-de-tela` | as **99** telas em modo modernizado |

> ⚠️ **`@dlq`, `@saga`, `@supervisao` e `@imutabilidade` não aparecem em nenhum arquivo deste conjunto**, e a
> ausência é decisão: não há fila, não há passo remoto a compensar, não há ator e o alvo não é funcional. A
> matriz de referência do SKILL as traz para transições que **não** são esta.

---

## Paridade de telas

[`screen_modernization_decision.md`](screen_modernization_decision.md) declara modo **híbrido** e não está
em `skipped` — **o sistema tem UI** (113 telas). Logo esta seção se aplica, e aplica **as duas** estratégias,
tela por tela, conforme o campo `Modo aplicado` de cada seção de
[`target_screens.md`](target_screens.md).

| Medida | Valor |
|---|---|
| Telas no inventário | **113** |
| Em modo **literal** → *golden file comparison* | **14** |
| Em modo **modernizado** → *contract test* de tela | **99** |
| Telas marcadas `isCritical` | **55** |
| *Golden files* **presentes** | **0 de 113** (`present: false` em todas) |
| Capturas do legado existentes no pacote | **3** — e as 3 são conteúdo de vitrine do tema, não desta instalação |

### Modo literal — 14 telas, `@paridade-visual`

Exigência: comparação do **HTML emitido** entre a saída da implementação alvo e o *golden file*, dentro das
`normalizationRules` declaradas em [`../screens/golden/manifest.yaml`](../screens/golden/manifest.yaml).

> 🔴 **Não é comparação de pixel, e não é byte a byte cru.** O manifest fixa
> `format: html-css-snapshot` e cada seção fixa `compare: dom-and-field-names`. A razão está em `DEV-002`:
> **o observável da origem é texto, não pixel** — o alvo emite HTML no servidor, como a origem. Comparar
> texto é determinístico e não depende de fonte, de DPI nem de navegador.

**As `normalizationRules` fazem parte do critério de aceite**, não são conveniência. Sem elas o *diff* é
100% ruído:

| Regra | Valor | Por quê |
|---|---|---|
| `lineEndings` | `\n` | converter CRLF antes de comparar |
| `trimTrailingSpaces` | **false** | nunca trimar: espaço à direita é parte da saída |
| `normalizeUtf8` | true | normalizar *encoding* |
| `injectClock` | `2026-01-01T00:00:00Z` | relógio falso |
| `seedRandom` | `42` | semente fixa |
| `maskNonce` / `maskNonceFields` | `_wpnonce`, `_wp_http_referer`, `_ajax_nonce` | o *nonce* amarra tique, ação, usuário e token de sessão: duas capturas da **mesma** tela, no mesmo dia, diferem |
| `maskScriptVersionQuery` | true | `?ver=` em cada `src` de *script* e *style* muda a cada atualização do núcleo |
| `maskUserId` / `maskSessionToken` | true | 96 *nonces* distintos são derivados do usuário |
| `ignoreAttributeOrder` | **false** | ⚠️ **ordem de atributo FAZ parte do contrato** — é o que o cliente JavaScript empacotado lê |

> 🔴 **E a declaração que o caso de borda do SKILL exige.** O manifest lista **todas** as 113 entradas com
> `present: false`. O caso de borda manda *"emitir cenários `@paridade-visual` mesmo assim, mas declarar que
> a validação será manual até a captura ser executada"*. **Está declarado:** os 14 arquivos de
> `parity_tests/screens/01-` a `14-` existem, cada cenário nomeia o comando de captura do manifest, e **até
> que a captura rode a validação é manual** — conferência do HTML emitido contra a tabela de campos, de
> mensagens e de pontos de montagem de [`target_screens.md`](target_screens.md), que é o que existe de
> contrato verificável hoje. Somado ao bloqueio de `DEV-002`, a consequência é: **nenhuma das 14 tem
> paridade visual automatizável antes de alguém responder `DEV-002`.**

**As 14, com a razão de estar em literal** — o critério é *o HTML da tela, ou o nome dos campos, é lido por
um cliente que este porte não reescreve*:

| # | Tela | ID | Família | Contrato que a paridade protege |
|---|---|---|---|---|
| 01 | `login` | `SCR-001` | C | campos `log`, `pwd`, `rememberme`, `redirect_to` — e **0 de 8 campos têm `required`** |
| 02 | `recuperacao-de-senha-redefinicao` | `SCR-003` | C | campos `rp_key`, `pass1`, `pass2`, `pw_weak` |
| 03 | `registro-de-usuario` | `SCR-005` | C | campos `user_login`, `user_email` |
| 04 | `formulario-de-senha-de-conteudo` | `SCR-011` | C | campo `post_password`, embutido **de dentro do conteúdo** pelo tema |
| 05 | `editor-de-blocos-novo` | `SCR-040` | A | ponto de montagem + objeto de configuração do cliente do editor |
| 06 | `editor-de-blocos-edicao` | `SCR-041` | A | idem, com 7 transições por redirecionamento |
| 07 | `modal-de-selecao-de-midia` | `SCR-048` | B | *iframe* lido pelo modal de mídia empacotado |
| 08 | `editor-de-imagem` | `SCR-049` | B | HTML devolvido por ação assíncrona e injetado pelo JS de mídia |
| 09 | `editor-do-site` | `SCR-056` | A | `wp_enqueue_script( 'wp-edit-site' )` |
| 10 | `personalizador` | `SCR-058` | B | **10** pontos de montagem `#customize-*` lidos por Backbone |
| 11 | `menus-de-navegacao` | `SCR-059` | B | DOM de arrastar e soltar, 4 formulários, 96 *strings* |
| 12 | `widgets-em-blocos` | `SCR-062` | A | ponto de montagem `#widgets-editor` |
| 13 | `widgets-classico` | `SCR-063` | B | DOM de arrastar e soltar, 3 formulários |
| 14 | `autorizar-aplicacao` | `SCR-074` | C | fluxo negociado com **aplicação externa** |

### Modo modernizado — 99 telas, `@paridade-contrato-de-tela`

Exigência: a implementação respeita **hierarquia de componentes, eventos declarados, conteúdo textual e os
4 estados** (`idle`, `loading`, `error`, `success`). **Não há comparação byte a byte.**

Os 99 cenários estão em **6 arquivos por grupo de tela**, cada um com um `Esquema do Cenário` e uma tabela
de `Exemplos` que enumera as telas do grupo — uma instância de cenário por tela, com o `SCR-` e a origem no
legado em cada linha:

| Arquivo | Grupo | Telas modernizadas |
|---|---|---:|
| [`parity_tests/screens/90-contrato-entradas-publicas.feature`](parity_tests/screens/90-contrato-entradas-publicas.feature) | Entradas públicas | 7 |
| [`parity_tests/screens/91-contrato-front-end.feature`](parity_tests/screens/91-contrato-front-end.feature) | Front-end | 20 |
| [`parity_tests/screens/92-contrato-instalacao.feature`](parity_tests/screens/92-contrato-instalacao.feature) | Instalação | 4 |
| [`parity_tests/screens/93-contrato-painel.feature`](parity_tests/screens/93-contrato-painel.feature) | Painel | 54 |
| [`parity_tests/screens/94-contrato-rede.feature`](parity_tests/screens/94-contrato-rede.feature) | Rede | 12 |
| [`parity_tests/screens/95-contrato-erro-e-recuperacao.feature`](parity_tests/screens/95-contrato-erro-e-recuperacao.feature) | Erro e recuperação | 2 |
| | **Total** | **99** |

**Duas restrições que valem para as 99 e que não são de apresentação:**

1. **`diff` de *string* tem de ser zero.** 2.984 *strings* foram copiadas verbatim e **nenhuma revisão
   linguística foi aprovada**. Em modo modernizado o SKILL permitiria corrigir erro de rótulo e marcar
   `tipo=correcao`; aqui **não há nenhuma entrada `correcao`** no log de deviations, logo não há correção
   autorizada. O `msgid` inglês **é** a chave do catálogo (`EC-05`): as mensagens chegam ao alvo **em
   inglês**.
2. **A moldura do painel não é um envelope único.** Das 80 telas de `wp-admin/`, **68** carregam
   `admin-header.php` e **12 não** — entre elas o instalador, que abre o próprio `<head>`, e o reparo de
   banco, que roda **sem autenticação**. São **dois contratos de documento**. Um alvo que aplicar um
   *layout* único a `/wp-admin/*` quebra 12 telas, **e quebra calado**: o cenário de contrato do grupo
   Painel verifica o contrato de documento, e não só o corpo.

---

## Exceções

Toda deviation de [`screen_deviation_log.md`](screen_deviation_log.md), com referência ao `DEV-XXX`
original. **O SKILL previa que só deviations aprovadas chegassem aqui; nenhuma foi aprovada.** As cinco
estão propagadas com o status real, porque omiti-las esconderia o bloqueio em vez de registrá-lo.

| `DEV` | Status | Tipo | Alcance | Efeito sobre a paridade |
|---|---|---|---|---|
| [`DEV-001`](screen_deviation_log.md#dev-001) | 🔴 **pendente** | `plataforma` | **as 113 telas** | o par `php-server-rendered → node-ts-server-rendered` **não existe** no ferramental: as specs estão em `raw-prose`. **A paridade de tela tem de ser derivada seção por seção**, não de um esquema. Em compensação, toda *string* e todo nome de campo tem `arquivo:linha` conferível |
| [`DEV-002`](screen_deviation_log.md#dev-002) | 🔴 **pendente — é o bloqueio de RF-13** | `tecnica` | **as 14 em literal** | modo literal **sem captura** do legado. Comparação de **HTML emitido**, `compare: dom-and-field-names`, não pixel. **Destrava com (a)** capturar as 14 do legado rodando **ou (b)** aceitar explicitamente modernizado para elas — e **(b) tem custo**: o DOM que o cliente do editor e os 65 `.js` empacotados leem deixa de ser contrato |
| [`DEV-003`](screen_deviation_log.md#dev-003) | 🔴 **pendente** | `tecnica` | `SCR-112`, `SCR-004`, `SCR-113` | as três passam pelo mesmo renderizador, que **não carrega CSS algum do painel** e escreve a folha embutida. **A comparação de CSS nessas três usa [`../design-system/tokens-derived.md`](../design-system/tokens-derived.md) como fonte, não `tokens.md`.** Dois pontos sensíveis: `#f1f1f1` **não é** `$gray-100` (`#f0f0f0`) — difere em um ponto por canal, invisível a olho e detectável por `diff`; e a pilha de fonte **troca inteira** para `Tahoma, Arial` em RTL, o que é **comportamento observável, não estilo** |
| [`DEV-004`](screen_deviation_log.md#dev-004) | 🔴 **pendente** | `plataforma` | `SCR-057` `biblioteca-de-fontes` | a tela **nunca renderiza UI nesta árvore**: responde sempre 503. ⚠️ **Teste de paridade contra esta árvore seria enganoso — ele passaria reproduzindo o erro.** O cenário do grupo Painel exclui `SCR-057` da verificação de corpo e fixa **apenas** o 503 e as duas mensagens; o oráculo útil é uma instalação com os arquivos de *build* presentes |
| [`DEV-005`](screen_deviation_log.md#dev-005) | 🔴 **pendente** | `plataforma` | `SCR-084` `press-this` | a tela **nunca renderiza UI nesta árvore**, por causa diferente: a UI está num *plugin* que o núcleo não empacota. Paridade de UI é impossível **e seria enganosa**. O que **dá** para testar, e vale, é o **roteamento**: as três recusas, os códigos HTTP (`200` nos dois `wp_die` de instalação, `403` na recusa por capacidade) e as URLs de ativação/instalação com o *nonce* certo. **Candidata natural a card `wont`** |

### Exceções que não vêm do log de telas

Três exceções ao critério de "idêntico" foram abertas por decisão humana anterior e **valem como exceção de
paridade**, não como divergência a corrigir:

| Exceção | O que muda | Fonte |
|---|---|---|
| **Tempo limite do cliente de IA** | o adaptador **define** o tempo limite em vez de herdar o *default* curto de 5 s, curto demais para geração de texto. `AD-09` a nomeia como **a exceção única autorizada**, de propósito, para não abrir precedente | P18 · `AD-09` |
| **Minimização no envio ao classificador externo** | o envio ao serviço de reputação é portado **com minimização**, e não verbatim: hoje cada comentário submetido faz sair **todo campo *string* de `$_POST` e todo cabeçalho de `$_SERVER` exceto o cookie** | P13 · [`../integrations/integrations.md`](../integrations/integrations.md) |
| **As 5 bordas de infraestrutura** | `mysqli`, os 15 `fsockopen`, PHPMailer, PCLZip e phpass são trocados de qualquer forma, e é ali que vivem os 5 achados de segurança. `AD-09`: **o adaptador reproduz o modo de falha de propósito** — um adaptador bem escrito os **conserta por acidente e quebra o critério de idêntico**. É a razão de existir a tag `@divida-herdada` | `AD-09` · P11, P12 |

---

## Tipos de teste a aplicar

| Tipo | Descrição | Alvo / ferramenta |
|---|---|---|
| **Funcionais** | os 47 casos de uso, com 289 passos de fluxo principal, 120 fluxos alternativos e 135 exceções; e as 117 regras MIGRAR | ferramenta do agente de codificação; o **oráculo** é a instalação de referência, não um *snapshot* escrito à mão |
| **Contrato** | as 7 superfícies produzidas, 29 integrações, 64 *endpoints*; e **o valor devolvido pelos 2.460 pontos de filtro** | comparação byte a byte contra o oráculo. ⚠️ o contrato de hook é o que **nenhum teste de superfície apanha**: o filtro intercepta valor **no meio do domínio, de propósito** |
| **Concorrência** | **teste próprio**, fora dos UCs: pares de requisição simultânea com identidades diferentes | 🔴 **não existe no backlog**: nenhum dos 985 testes exercita duas requisições concorrentes |
| **Carga / performance** | 🔴 **sem alvo numérico**: não há volumetria (`A-7`), não há arquivo de log, não há produção. ⚠️ **E o raio de alcance mudou**: em PHP uma enxurrada custa um processo por requisição, que morre; **em Node ela bloqueia o laço de eventos único** — a regra `ESC-LIMITE-TAXA` é idêntica, a consequência não | limite de taxa é **decisão de implantação, fora do núcleo** (P19, `RISK-013`) |
| **Resiliência** | **sem fila e sem dependência de *broker*** a derrubar. O que há: oráculo indisponível, dependência externa fora do ar, TLS falhando — e neste último o comportamento correto é o **rebaixamento para `http://`** (`ESC-HTTP`), que é dívida herdada a **reproduzir** | `@divida-herdada` |
| **Dados** | ida e volta do codec de `serialize()`; *checksum* por tabela; conferência de que **nenhum `ALTER TABLE`** saiu da metade nova desde o *snapshot* | `RISK-005`, `RISK-007` |
| ***Build*** | regra de dependência núcleo ↛ domínio **começando vermelha** nas 175 violações, com lista de exceções datada; contagem publicada a cada virada e **não maior** que na anterior | `AD-11` · `RISK-027` |

---

## Reuso de characterization_specs do time de descoberta

- **Origem**: 🔴 **`_reversa_sdd/characterization_specs/` NÃO EXISTE nesta árvore.** Conferido por varredura
  da pasta `_reversa_sdd/`, que tem 72 subpastas e nenhuma com esse nome.
- **Caso de borda do SKILL aplicado**: *"derivar cenários a partir de `code-analysis.md` e `sequences/`.
  Sinalizar lacuna em `parity_specs.md`."* A lacuna está sinalizada aqui e em `LACUNA-IN-01`.
- **`sequences/` também não existe.** O que existe é
  [`../flowcharts/`](../flowcharts/) com **66 arquivos** — **53** por módulo e **13** de função
  específica, entre eles `comentarios-check_comment.md` (a cascata de moderação),
  `posts-e-tipos-de-conteudo-wp_insert_post.md`, `capacidades-e-papeis-map_meta_cap.md`,
  `autenticacao-e-sessoes-wp_check_password.md` e
  `application-passwords-wp_authenticate_application_password.md`. **São esses os `process_flows` que a
  rastreabilidade de cada `.feature` cita.**
- **Substitutos usados, em ordem de preferência**:
  1. [`../flowcharts/`](../flowcharts/) — 66 fluxogramas, para a sequência de passos;
  2. [`target_business_rules.md`](target_business_rules.md) — 117 regras MIGRAR, com âncora `arquivo:linha`
     e nota de *Compatibilidade com paradigma alvo* em cada;
  3. [`target_domain_model.md`](target_domain_model.md) — 21 aggregates, para as invariantes;
  4. [`../use-cases/use-cases.md`](../use-cases/use-cases.md) — 47 UCs, 415 referências `arquivo:linha`;
  5. [`../code-analysis.md`](../code-analysis.md) — 848 KB de análise por módulo, como última instância.
- **Adaptações necessárias para o sistema novo**: as entradas e saídas dos fluxogramas são assinaturas PHP;
  no alvo o observável é a **resposta HTTP, o efeito no banco e o valor devolvido pelo ponto de filtro**.
  Cada `.feature` deste conjunto está escrito nesse vocabulário, não no de função.
- **O que a ausência de `characterization_specs/` custa, em uma frase:** não há `spec-id` anterior a manter
  na rastreabilidade, logo os `spec-id` `PT-001` a `PT-020` e `PTS-001` a `PTS-020` **nascem aqui** e não
  herdam de ninguém — quem conferir precisa ir ao fluxograma e à regra, não a uma spec de caracterização.

---

## Fluxos críticos cobertos

20 fluxos de domínio, mais 14 telas em literal e 6 contratos de grupo de tela. **Cada arquivo carrega
front-matter de comentário com `spec-id`, `process_flows`, `target_architecture` e `paradigma_alvo`.**

### Fluxos de domínio — `parity_tests/*.feature`

| `spec-id` | Arquivo | Fatia | Regras cobertas | Tags |
|---|---|---|---|---|
| `PT-001` | [`01-cascata-de-moderacao-de-comentario`](parity_tests/01-cascata-de-moderacao-de-comentario.feature) | 7 | `C1`–`C12` | `@paridade` `@critico` `@invariante` `@ordem-de-decisao` |
| `PT-002` | [`02-publicacao-e-agendamento-de-conteudo`](parity_tests/02-publicacao-e-agendamento-de-conteudo.feature) | 7 | `P1`, `P3`–`P7` | `@paridade` `@critico` `@invariante` `@idempotencia` |
| `PT-003` | [`03-exclusao-de-conteudo-em-sete-etapas`](parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature) | 7 | `EXT-EXCLUSAO`, `DB-TRG1`–`DB-TRG4` | `@paridade` `@critico` `@cascata` `@invariante` |
| `PT-004` | [`04-retencao-e-coleta-da-lixeira`](parity_tests/04-retencao-e-coleta-da-lixeira.feature) | 5 · 7 | `R1`–`R6`, `ESC-RETENCAO` | `@paridade` `@critico` `@falha-de-disparo` `@invariante` |
| `PT-005` | [`05-agendador-e-loopback`](parity_tests/05-agendador-e-loopback.feature) | **5** | `A9`, `ESC-LIMITE-TAXA` | `@paridade` `@critico` `@falha-de-disparo` `@divida-herdada` |
| `PT-006` | [`06-autenticacao-e-sessao`](parity_tests/06-autenticacao-e-sessao.feature) | 6 | `U1`–`U6`, `ESC-ENUMERACAO`, `ESC-SESSAO` | `@paridade` `@critico` `@concorrencia` `@divida-herdada` |
| `PT-007` | [`07-autorizacao-por-capacidade`](parity_tests/07-autorizacao-por-capacidade.feature) | 6 | `PERM-1`–`PERM-13` | `@paridade` `@critico` `@concorrencia` `@composicao` |
| `PT-008` | [`08-contexto-por-requisicao-concorrente`](parity_tests/08-contexto-por-requisicao-concorrente.feature) | **0** | `EXT-CONTEXTO` | `@paridade` `@critico` `@concorrencia` |
| `PT-009` | [`09-contrato-de-extensao-por-filtro`](parity_tests/09-contrato-de-extensao-por-filtro.feature) | 0 · 1 | `EXT-FILTROS`, `EXT-ORDEM`, `ESC-FILTRAVEL` | `@paridade` `@critico` `@ordem-de-emissao` `@composicao` |
| `PT-010` | [`10-substituicao-pluggable-e-drop-in`](parity_tests/10-substituicao-pluggable-e-drop-in.feature) | 0 · 1 | `EXT-SUBST` | `@paridade` `@substituicao` `@composicao` |
| `PT-011` | [`11-contratos-de-leitura-de-terceiro`](parity_tests/11-contratos-de-leitura-de-terceiro.feature) | 2 · 4 | `ESC-ORACULO` (área 1) | `@paridade` `@critico` `@contrato` |
| `PT-012` | [`12-solicitacao-de-dado-pessoal`](parity_tests/12-solicitacao-de-dado-pessoal.feature) | **8** | `D1`–`D6`, `D3b`, `R7`, `R8` | `@paridade` `@critico` `@regulatorio` `@invariante` `@idempotencia` |
| `PT-013` | [`13-atualizacao-automatica-do-nucleo`](parity_tests/13-atualizacao-automatica-do-nucleo.feature) | 9 | `A1`–`A8`, `A10`–`A12` | `@paridade` `@critico` `@idempotencia` `@divida-herdada` |
| `PT-014` | [`14-ingestao-e-derivadas-de-midia`](parity_tests/14-ingestao-e-derivadas-de-midia.feature) | 7 · 9 | `M1`–`M4`, `P2`, `R3` | `@paridade` `@invariante` |
| `PT-015` | [`15-fronteira-do-banco-e-codec-serialize`](parity_tests/15-fronteira-do-banco-e-codec-serialize.feature) | **0** | `DB-SER`, `DB-SENT`, `DB-ENUM`, `DB-UNIQ`, `DB-DEG`, `DB-SEED`, `DB-MIG`, `DB-DEAD` | `@paridade` `@critico` `@dados` |
| `PT-016` | [`16-rede-multisite-e-cadastro`](parity_tests/16-rede-multisite-e-cadastro.feature) | **11** | `N1`–`N7`, `U7`–`U9`, `ESC-MULTISITE` | `@paridade` `@invariante` `@concorrencia` |
| `PT-017` | [`17-integracao-externa-e-rebaixamento-http`](parity_tests/17-integracao-externa-e-rebaixamento-http.feature) | 13 | `I1`–`I7`, `ESC-HTTP`, `ESC-IA` | `@paridade` `@critico` `@divida-herdada` `@regulatorio` |
| `PT-018` | [`18-superficies-de-escrita-paralelas`](parity_tests/18-superficies-de-escrita-paralelas.feature) | **10** | `ESC-SUPERFICIES`, `P8` | `@paridade` `@critico` `@contrato` `@concorrencia` |
| `PT-019` | [`19-maquinas-de-estado-e-changeset`](parity_tests/19-maquinas-de-estado-e-changeset.feature) | transversal | `SM-ALL`, `SM-CHANGESET` | `@paridade` `@critico` `@invariante` `@concorrencia` `@composicao` |
| `PT-020` | [`20-contrato-servidor-do-cliente-do-editor`](parity_tests/20-contrato-servidor-do-cliente-do-editor.feature) | 12 | `ESC-CLIENTE` | `@paridade` `@critico` `@contrato` `@ordem-de-emissao` |

### Telas — `parity_tests/screens/*.feature`

| `spec-id` | Arquivos | Modo | Tag |
|---|---|---|---|
| `PTS-001` a `PTS-014` | `01-login` a `14-autorizar-aplicacao` | literal (14 telas) | `@paridade-visual` |
| `PTS-015` a `PTS-020` | `90-contrato-*` a `95-contrato-*` | modernizado (99 telas em 6 grupos) | `@paridade-contrato-de-tela` |

### Cobertura, declarada com o que fica de fora

| Dimensão | Coberto | Total | Observação |
|---|---|---:|---|
| Regras MIGRAR | **117** | 117 | cada regra aparece em ao menos um `.feature`; o mapa está em § *Como reproduzir* |
| Telas | **113** | 113 | 14 em cenário próprio, 99 em `Exemplos` por grupo |
| Fatias de virada | **13** | 13 (0 a 12) | a fatia 12 (pontas de consumo) é coberta por `PT-009` e pelos contratos de tela |
| Áreas da Decisão 2 | **5** | 5 | a área 5 (concorrência) só existe em `PT-008`, `PT-006`, `PT-007`, `PT-016` e `PT-018` |
| Implicações do paradigma | **8** | 8 | a implicação 5 é verificada pelo *build*, não por `.feature` — ver `D-C` |
| Casos de uso com cenário de **fluxo** | **43** | 47 | por fluxo, não um `.feature` por UC: `PT-001` cobre UC-14 e UC-16 a UC-18, `PT-002` cobre UC-03 a UC-07. 🔴 **Os 4 que faltam** — UC-30, UC-31, UC-32 e UC-38 — têm só **contrato de tela**: ver `LACUNA-IN-12` |
| **Decisões humanas pendentes** | 🔴 **0 de 9** | 9 | `BR-HUMANA-001` a `-009` não têm cenário: **não se escreve teste de paridade para regra que ninguém decidiu** |

---

## Lacunas e dúvidas registradas

Nenhuma foi resolvida por invenção. Todas seguem para quem decide.

| # | Lacuna | Efeito se continuar aberta |
|---|---|---|
| `LACUNA-IN-01` | 🔴 `characterization_specs/` e `sequences/` **não existem**; `_reversa_sdd/flowcharts/` foi o substituto | nenhum `spec-id` deste conjunto herda rastreabilidade de uma spec de caracterização anterior: a conferência vai ao fluxograma e à regra |
| `LACUNA-IN-02` | 🔴 **o 1% da área 4 é parâmetro, não medida** — é a linha de referência do SKILL aplicada ao recorte de HTML, sem corpus que o calibre | o *go* da linha 4 fica negociável até que o corpus exista; as linhas 1, 2, 3 e 5 não, porque são binárias |
| `LACUNA-IN-03` | 🔴 **o corpus do Parallel Run não existe** e nenhum dos 181 cards o cobre | **toda métrica percentual é incomputável** e o arnês não tem entrada. É pré-requisito da fatia 0, e hoje não está em plano nenhum |
| `LACUNA-IN-04` | 🔴 **as 5 deviations de tela estão pendentes** | a paridade visual das 14 telas em literal não é automatizável; é bloqueio 9 da § *Critério de bloqueio* |
| `LACUNA-IN-05` | 🔴 **a estratégia não foi escolhida** (§ 6 de `migration_strategy.md` em branco) e `BR-HUMANA-003` pode derrubar o banco compartilhado | o *shadow mode* e a § *Data parity* mudam de forma; ver § *O que muda se a decisão for outra* |
| `LACUNA-IN-06` | 🔴 **não se sabe se a instalação é multisite** (`A-3`) | `PT-016` pode ser obrigatório ou sair inteiro. É o maior item de escopo em aberto |
| `LACUNA-IN-07` | 🔴 **`wp-includes/js/dist/` ausente**: o lado cliente dos 5 módulos do editor não está na árvore | as 4 telas da família A verificam **o ponto de montagem e o objeto de configuração**, que é o que o servidor entrega; o que o cliente desenha depois **não** tem cenário, e por `ESC-CLIENTE` não entra no porte |
| `LACUNA-IN-08` | ⚠️ **extensão ativa na instalação de referência** não está decidida | se a referência rodar com extensão ativa, **toda comparação de paridade fica contaminada** (`RISK-008`), e a contaminação é silenciosa |
| `LACUNA-IN-09` | ⚠️ **os 3 temas e os 2 plugins empacotados entram no porte?** | sem tema o site público não renderiza: `PTS-016` (Front-end) **não tem critério de aceite** até essa resposta. A tabela de `Exemplos` dele nomeia os 3 temas de propósito, para que a dependência fique visível |
| `LACUNA-IN-10` | ⚠️ **`LACUNA-ST-02`**: as 4 telas do gerenciador de links talvez não devam ser traduzidas | 4 das 54 linhas de `Exemplos` do grupo Painel saem, se a resposta for descartar |
| `LACUNA-IN-11` | ⚠️ **`DEV-004` e `DEV-005`**: duas telas **nunca renderizam UI nesta árvore** | teste de paridade contra esta árvore **passaria reproduzindo o erro**. Os cenários fixam só o código HTTP e as mensagens, e isso está declarado em cada um |
| `LACUNA-IN-12` | ⚠️ **Quatro casos de uso têm contrato de tela e nenhum cenário de fluxo**: UC-30 (montar menu), UC-31 (organizar widgets), UC-32 (trocar o tema ativo) e UC-38 (exportar e importar conteúdo) | em UC-30 e UC-31 o percurso é **arrastar e soltar lido por JavaScript empacotado**, e o que o porte entrega é o DOM: `PTS-011`, `PTS-012` e `PTS-013` o cobrem como contrato, mas **nenhum cenário verifica o efeito no banco** de reordenar um menu ou mover um widget. UC-32 tem só a tela `SCR-055` em `PTS-018`, e trocar o tema ativo **escreve opção** — é área 3. UC-38 é o mais grave: a exportação é **serialização do mesmo conteúdo** e um formato de arquivo é contrato de terceiro, logo mereceria **área 1 (byte a byte)** e hoje tem só o contrato de tela de `PTS-018`. **Os quatro precisam de cenário de fluxo antes das fatias 9 e 12** |

### O que muda se a decisão for outra

| Resposta | O que se refaz neste documento | O que **não** muda |
|---|---|---|
| **A + B** (ratifica a recomendação) | nada | tudo |
| `BR-HUMANA-003` = **(a)** (coluna anulável) | o **banco compartilhado cai**: o *shadow mode* perde o espelho de leitura do *proxy*, a § *Data parity* ganha uma **ETL com janela por instalação**, e os bloqueios 2, 3 e 4 mudam de natureza | os critérios por área, a cobertura de paridade e os 40 arquivos `.feature` |
| **B + C** (Parallel Run + Big Bang) | a coluna *Fatia* do índice perde sentido: não há virada por superfície, logo não há *go* de 7 dias por superfície — só o corte final. ⚠️ **E C está proibida** pelo caso de borda regulatório do SKILL, por causa de `D1`–`D6`, `R7` e `R8` | as 5 áreas da Decisão 2 e todos os cenários |
| `DEV-002` = **(a)** capturar as 14 | os 14 `@paridade-visual` passam de **manual** a automatizável; o manifest ganha `sha256` por tela | os 14 arquivos, que já nomeiam o comando de captura |
| `DEV-002` = **(b)** aceitar modernizado | as 14 saem de `screens/01-` a `14-` e entram nas tabelas de `Exemplos` dos grupos; `@paridade-visual` **desaparece** do conjunto. ⚠️ **Custo**: o DOM que o cliente do editor e os 65 `.js` empacotados leem **deixa de ser contrato** | os 20 fluxos de domínio |
| Alvo é **SPA** (`LACUNA-ST-01`) | o par passa a existir no ferramental, `DEV-001` deixa de existir, e **a área 4 da Decisão 2 muda de natureza**: HTML de painel deixa de ser saída do servidor | as áreas 1, 2, 3 e 5 |

---

## Saídas

- `parity_specs.md` — este documento.
- `parity_tests/*.feature` — **20** arquivos, um por fluxo crítico de domínio.
- `parity_tests/screens/*.feature` — **20** arquivos: 14 de modo literal (`@paridade-visual`) e 6 de
  contrato de grupo em modo modernizado (`@paridade-contrato-de-tela`), cobrindo as 99 restantes.
- **Total: 40 arquivos `.feature`**, 113 telas e 117 regras MIGRAR cobertas.

---

## Notas

**Para o agente de codificação, em uma frase:** o critério de "idêntico" deste porte **não é um número**, é
uma combinação de cinco áreas em que três são binárias, uma tolera 1% e **a quinta não existe em nenhum dos
985 testes do backlog** — e é essa quinta, a concorrência, que decide se o porte funciona, porque é a única
que o legado ganhava de graça do processo morrer no fim da resposta.

1. **A paridade mais difícil deste sistema não é de superfície, é de hook.** A área 2 da Decisão 2 pede
   **byte a byte no valor devolvido** pelos 2.460 pontos de filtro. Nenhum teste de superfície HTTP a
   apanha: o filtro intercepta valor **no meio do domínio, de propósito**, e `C11` é o caso que decide —
   reescreve `comment_status` para `closed` **em memória, e o banco não muda**. O efeito observável existe
   **só porque o retorno volta ao chamador**. Um alvo que publicasse evento aqui passaria em todo teste de
   superfície e falharia o produto.

2. **Há um lugar em que o alvo acerta demais, e acertar é o defeito.** O disparo do agendador e do
   *loopback* é **deliberadamente** não bloqueante — *timeout* 0,01 s, `blocking` falso, `sslverify` falso.
   Em PHP isso **aborta** a requisição de saída; numa runtime assíncrona o laço de eventos continua vivo
   depois da resposta e a requisição pode **completar**. O comportamento que `R5` e
   [ADR-0006](../adrs/0006-retencao-agendada-por-visita-ao-painel.md) descrevem — *um site que ninguém
   administra nunca executa a própria limpeza* — **depende de o disparo falhar**. É por isso que a fatia 5
   tem fatia própria, e por isso que critério de aceite escrito em **latência** é *no-go* (`RISK-015`).

3. **Cinco pontos decidem acesso sem consultar o modelo de capacidades, e quem portar lendo
   `permissions.md` produz um sistema mais fechado que o legado.** Senha de post em texto claro sem prazo e
   sem limite de tentativa; chave de confirmação com *hash* de 24 h; chave de recuperação **consumida antes
   de verificada**; autoria por remetente de e-mail, falsificável; chave de ativação de rede sem prazo que
   reabrir **não** invalida. Os cinco têm cenário (`PT-006`, `PT-007`, `PT-012`, `PT-016`), e os cinco são
   `@divida-herdada`: **endurecê-los é decisão separada e registrada**, nunca efeito colateral de reescrita.

4. **O que este documento não pode garantir, e vale dizer com clareza.** Todos os 40 arquivos são specs de
   um arnês que **não existe** e de um oráculo que **não está no ar**. O manifest declara
   `oracleAvailable: false` com quatro causas, há **3** capturas para 113 telas e **zero** arquivos de teste
   em 3.381. Até a fatia 0 existir, **nada aqui é verde nem vermelho: é especificação**. O SKILL já diz isso
   de outro jeito — *"arquivos `.feature` são specs, não testes executáveis"* — e aqui a frase tem uma
   segunda camada: nem o alvo nem a origem estão executáveis hoje.

5. **Uma convenção de vocabulário, declarada para não parecer inconsistência.** Os `.feature` usam
   `@idempotencia` e `@ordem` apenas onde **a regra do legado** já é de idempotência (`P7`: republicar é
   operação nula; `A6`: exatamente uma segunda chance; `D3b`: expiração) ou de ordem (`C1`–`C12`). Essas tags
   aparecem na matriz de referência do SKILL como **dimensões de transição para event-driven** — e esta
   transição **não é** para event-driven. Usá-las aqui é reaproveitar o nome, não importar a dimensão, e a
   § *Cobertura adaptada ao paradigma* registra a diferença.

---

## Como reproduzir cada número

| Script | O que faz |
|---|---|
| `.reversa/work/reversa-inspector/ler-manifest.py` | lê `golden/manifest.yaml` sem dependência externa: contagem por modo, telas críticas, `present` |
| `.reversa/work/reversa-inspector/telas-por-grupo.py` | agrupa as 113 telas por grupo e modo; grava `parts/telas.json`, fonte dos `Exemplos` dos 6 contratos de grupo |
| `.reversa/work/reversa-inspector/extrair-literais.py` | extrai de `target_screens.md` rota, origem, campos, formulários, *strings* e transições das 14 telas em literal; grava `parts/literais.json` |
| `.reversa/work/reversa-inspector/gerar-screens.py` | gera os **20** `.feature` de tela a partir de `parts/*.json` — os 14 de modo literal e os 6 contratos de grupo, com as tabelas de `Exemplos` montadas do manifest |
| `.reversa/work/reversa-inspector/patch-uc.py` | acrescenta ao *front-matter* os casos de uso que os cenários de cada arquivo de fato cobrem, e **só** esses |
| `.reversa/work/reversa-inspector/verify-refs.py` | confere **toda** referência `arquivo:linha` deste documento e dos 40 `.feature`: existência do arquivo e existência da linha |
| `.reversa/work/reversa-inspector/verify-links.py` | confere todo link relativo e toda âncora deste documento, pela regra de *slug* de cabeçalho |
| `.reversa/work/reversa-inspector/lint-gherkin.py` | confere os 40 `.feature`: palavra-chave de Gherkin em português, `Funcionalidade` única, todo `Cenário` com `Dado`/`Quando`/`Então`, front-matter com `spec-id` e as três linhas de rastreabilidade, tabela de `Exemplos` com largura constante, e **ausência de chamada a framework de teste** |
| `.reversa/work/reversa-inspector/cobertura.py` | confere que as 117 regras MIGRAR e as 113 telas aparecem em ao menos um `.feature`, e que todo `spec-id` do índice existe em arquivo |
| `.reversa/work/reversa-inspector/selar.py` | `sha256` do corpo abaixo do *front matter* deste documento |

**Fonte de verdade das tabelas de `Exemplos`**: `.reversa/work/reversa-inspector/parts/*.json`, gerados dos
artefatos e não escritos à mão.
