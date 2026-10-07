---
schemaVersion: 1
generatedAt: 2026-10-06T20:10:00-03:00
reversa:
  version: "1.0.0"
kind: migration_strategy
producedBy: strategist
hash: "sha256:8cde83e32fa10aa347cd1fd421569dfad2349ef3e2b4784f85c2cd9b3b9478dd"
---

# Estratégia de Migração

> Estratégias de migração avaliadas com *trade-offs* explícitos. A estratégia recomendada é a sugestão do
> Strategist; **a decisão final é humana**.

> Gerado pelo **Strategist** (Time de Migração) em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> Sistema analisado: **wordpress 7.1.2** · `kind: migration_strategy`

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Evidência direta em artefato do `_reversa_sdd/`, com seção citada |
| 🟡 INFERIDO | Padrão observado nos artefatos, sem afirmação explícita |
| 🔴 LACUNA | Não dedutível pelas specs disponíveis |
| ⚠️ AMBÍGUO | As evidências apontam para mais de uma leitura |

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental deste processo e não
entraram em contagem alguma. O rascunho de trabalho desta etapa, com os scripts reproduzíveis, está em
`.reversa/work/reversa-strategist/`.

---

## O chão desta etapa, antes das estratégias

Três fatos decidem o leque inteiro, e dois deles contradizem premissas que artefatos anteriores deixaram
escritas. Ficam no começo porque ler as estratégias sem eles leva à escolha errada.

### 1. O pré-requisito do SKILL continua não cumprido — e não foi contornado por invenção

`_reversa_sdd/migration/migration_brief.md` **não existe**. É a terceira etapa seguida do Time de Migração
a registrar isso ([`paradigm_decision.md`](paradigm_decision.md) § *Notas* item 1,
[`target_business_rules.md`](target_business_rules.md) § *O chão desta etapa* item 1). O caso de borda deste
SKILL manda registrar as restrições ausentes como **"indefinidas"**, prosseguir, e dar à recomendação uma
nota de sensibilidade ao prazo. Foi o que se fez.

| Restrição do brief | Valor | Efeito na escolha |
|---|---|---|
| **Prazo** | 🔴 **indefinido** | é a restrição que mais mexeria no ranking: ver § *Nota de sensibilidade ao prazo* |
| **Orçamento** | 🔴 **indefinido** | nenhuma estratégia foi descartada por custo, só por adequação |
| ***Stakeholders*** | 🔴 **indefinidos** | todo *owner* deste pacote é **papel**, nunca pessoa — inclusive o patrocinador |
| **Regulação** | 🟡 LGPD/GDPR, como obrigação **da implantação** | [`questions.md`](../questions.md) P20: o núcleo não declara prazo de retenção e `registration_log` acumula IP e e-mail sem política. Dispara o caso de borda regulatório deste SKILL |
| **Objetivo** | 🟢 clonar o núcleo com **regra idêntica**, não forma idêntica | [`pending_decisions.md`](pending_decisions.md) Decisão 1 |
| **Métrica de sucesso** | 🟢 paridade por área contra o oráculo executável | Decisão 2 + P16 |
| **Escopo** | 🟢 o núcleo do CMS, **não** um site | P1, P4, P13, P14 |

### 2. Não existe sistema em produção — e isso reposiciona três das quatro estratégias do catálogo

É o achado desta etapa com maior efeito sobre a decisão, e nenhum artefato anterior o tratou como
restrição de estratégia. [`questions.md`](../questions.md) **P19** responde, textualmente: *"Não há log
retido nem instalação em operação: **o alvo é o CMS, não um site**"*. Somado a P1, P4 e P13, significa:

- **não há tráfego de produção** a desviar progressivamente;
- **não há usuários** a cortar numa janela;
- **não há dado de cliente** a migrar nesta etapa — os **183 passos de migração de dados** que o redator
  gravou em **68 das 74 units** são capacidade **do produto**, não trabalho deste projeto;
- **não há janela de indisponibilidade** a negociar, porque não há disponibilidade a interromper;
- e **o legado não está em *decommission***: é o WordPress *upstream*, que segue lançando versão. A
  referência está cravada em `7.1.2` (`wp-includes/version.php:19`), e o alvo persegue um alvo parado de
  propósito.

O catálogo consultivo (`references/migration-strategies.md`) qualifica as estratégias por condições que
pressupõem um sistema **vivo**: *"sistema em produção, não pode parar"*, *"janela tolerada"*, *"prova de
equivalência por longo período"*. Nenhuma dessas condições se lê literalmente aqui. **O que existe de vivo
neste projeto é uma única instância, e ela é a instalação de referência que a P16 manda levantar.** Toda
estratégia abaixo foi reapontada para ela — e quando uma condição do catálogo não se aplica, isso está
dito, não contornado.

> **Consequência prática:** "cutover" neste projeto tem **dois** significados, e confundi-los é o erro mais
> caro disponível. O corte **deste** projeto é o **lançamento da versão 1 do clone**. O corte de uma
> instalação que venha a adotá-lo é outro plano, parametrizado, que depende de volumetria desconhecida
> (A-7) e de um brief que não existe. [`cutover_plan.md`](cutover_plan.md) separa os dois.

### 3. CORREÇÃO ao mandato recebido — as 2 "raízes" estão **dentro** do ciclo, e a sequência prescrita não é ordem de dependência

[`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes* endereça a este agente, na
implicação 5: *"a sequência viável é as 2 raízes (`hooks-e-plugin-api`, `html-api`), o ciclo inteiro como
unidade e as 3 pontas de consumo"*. A mesma frase aparece em
[`architecture.md`](../architecture.md) §9 risco 2 e no resumo do grafo medido.

Conferido contra o próprio `architecture-graph.json`, com Tarjan e fecho transitivo
(`.reversa/work/reversa-strategist/scc.py` e `fatias.py`):

| Módulo | Dentro do SCC de 68? | `fan_in` | `fan_out` | Fecho transitivo de dependências |
|---|---|---:|---:|---|
| `hooks-e-plugin-api` (dita raiz) | **sim** | 64 | 20 | **68 de 71 (96%)** |
| `html-api` (dita raiz) | **sim** | 16 | 6 | **68 de 71 (96%)** |
| `blocos-do-nucleo` (ponta) | não | 0 | 32 | **68 de 71 (96%)** |
| `plugins-empacotados` (ponta) | não | 0 | 23 | **68 de 71 (96%)** |
| `temas-empacotados` (ponta) | não | 0 | 11 | **68 de 71 (96%)** |

**As duas "raízes" não são separáveis do ciclo: elas são parte dele.** E as três pontas, que têm `fan_in`
zero, dependem transitivamente de 68 módulos — são o **fim** da ordem, não unidades que se construam
sozinhas. Medidos os 18 candidatos naturais a fatia (`sitemaps`, `feeds-rss-atom`, `oembed-e-embeds`,
`rest-api`, `xmlrpc`, `cron`, `wp-query`, `multisite`, `comentarios`, `privacidade-e-dados-pessoais`,
`editor-de-blocos`, as 2 raízes, as 3 pontas e os 2 módulos de maior `fan_in`), **todos os 18 têm fecho
transitivo de 68 de 71 módulos**. Nenhum discrimina nada.

> 🟢 **Portanto: existe exatamente UMA unidade construível neste grafo, e ela tem 68 dos 71 módulos.**
> A palavra "raiz" no artefato anterior descreve posição no grafo condensado, não precedência de
> construção. Nenhuma estratégia que dependa de incrementalidade **por módulo** está disponível neste
> sistema. A incrementalidade que existe é **por superfície HTTP** — e é sobre ela que a recomendação se
> apoia.

> **Divergência de contagem, reconciliada:** [`inventory.md`](../inventory.md) §2.1 registra 633.532 linhas
> de PHP e [`refactor/architectures.md`](../refactor/architectures.md) §2 registra 634.999. A diferença é
> **1.467** — exatamente o número de arquivos PHP, logo é critério de contagem da última linha de cada
> arquivo, não discordância de medida. Este documento usa **634.999** por ser a fonte que também publica o
> grafo de 71 módulos, e a divergência fica declarada em vez de escondida.

---

## 1. Contexto sintetizado

### 1.1 Tamanho do legado 🟢

| Medida | Valor | Fonte |
|---|---:|---|
| Arquivos do sistema analisado | **3.378** | [`inventory.md`](../inventory.md) §2.1 |
| Arquivos PHP · linhas de PHP | 1.467 · **634.999** | [`refactor/architectures.md`](../refactor/architectures.md) §2 |
| Linhas de JavaScript · CSS | 202.787 · 114.613 | [`inventory.md`](../inventory.md) §2.1 |
| Arquivos de teste | **0** | [`refactor/architectures.md`](../refactor/architectures.md) §2 |
| Módulos no grafo medido | **71** | [`architecture/architecture-graph.md`](../architecture/architecture-graph.md) |
| Maior componente fortemente conexo | **68 de 71 (95,8%)** | conferido em `scc.py` |
| Ciclos de dois módulos · com volta de peso 1 | 254 · **65** | conferido em `scc.py` |
| Pares de módulo · peso de chamada | 1.249 · 44.008 | conferido em `medir.py` |
| Fronteiras de processo · *front controllers* | **0** · 109 | [`architecture.md`](../architecture.md) §9 risco 1 |
| Tabelas · colunas · índices · chaves estrangeiras | 18 · 135 · 59 · **0** | [`erd-complete.md`](../erd-complete.md) |
| `START TRANSACTION` · `COMMIT` | **0** · **0** | [`refactor/architectures.md`](../refactor/architectures.md) §2.2 |
| Integrações externas · *endpoints* | **29** · 64 | [`integrations/integrations.md`](../integrations/integrations.md) |
| Superfícies de API produzidas | **7** | [`architecture.md`](../architecture.md) §7.2 |
| Casos de uso · atores | 47 · 18 | [`use-cases/use-cases.md`](../use-cases/use-cases.md) |
| Cards de backlog · critérios de aceite · testes especificados | 181 · 804 · 985 | [`backlog/backlog.md`](../backlog/backlog.md) |
| Módulos **sem spec alguma** | **15 de 71**, incluindo 5 dos 12 do núcleo proposto | [`gaps.md`](../gaps.md) A-01 |

**Leitura:** por tamanho, este sistema está na faixa em que o catálogo manda **excluir Big Bang**
("sistema pequeno"). Por topologia, está na faixa em que nenhuma fatia de código é pequena. As duas coisas
são verdade ao mesmo tempo, e é essa tensão que a § 4 resolve.

### 1.2 Apetite derivado 🟢

`derived_appetite`: **`balanced`** — definitivo, pela Decisão 1 (Opção 3, híbrido)
([`paradigm_decision.md`](paradigm_decision.md) § *Apetite derivado*).

A fronteira da Opção 3, que vale como contrato para esta estratégia: **comportamento observável fica
conservador, estrutura interna fica idiomática**, e toda decisão de borda passa pelo mesmo teste — *muda a
saída HTTP, o efeito no banco ou o comportamento de caso de uso?*

> ⚠️ Quatro vestígios da versão anterior do `paradigm_decision.md` ainda dizem `conservative` como hipótese
> de trabalho (aviso do topo, § *Hipótese de trabalho*, três linhas da tabela de apetite, § *Notas* item 7).
> Estão superados pela própria § *Decisão do usuário* do mesmo arquivo e pelo
> [`pending_decisions.md`](pending_decisions.md). **Este documento opera com `balanced`**, e não é deste
> agente corrigir aquele arquivo — a regra absoluta do SKILL proíbe.

### 1.3 Severidade do gap de paradigma 🟢

**Alto**, por duas causas independentes que se somam
([`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*):

1. `procedural → event-driven`: sincronia → assincronismo, erro vira *retry*/DLQ, ordem de evento passa a
   importar;
2. **e a causa que não está em catálogo nenhum**: o legado apoia o estado global no fato de o processo
   **morrer no fim da resposta**; o alvo é uma runtime **longo-viva**.

As 8 implicações estão naquele documento. As **três endereçadas a este agente** estão respondidas, uma a
uma, na § 5.

### 1.4 Restrições da stack alvo 🟢

TypeScript `strict` · Node.js LTS · **nenhum framework opinativo** · MySQL/MariaDB com **SQL à mão, sem
ORM** · **nenhuma mensageria** · **sem container na primeira fase** (adiamento declarado) · lado cliente do
editor como **dependência externa de versão cravada** ([`pending_decisions.md`](pending_decisions.md)
§ *Lacuna 1* e § *Lacuna 2*).

Três dessas decisões restringem a estratégia mais do que parece:

- **"Sem mensageria"** elimina, por decisão já tomada, qualquer estratégia que dependa de fila, *broker* ou
  DLQ como mecanismo de transição.
- **"MySQL/MariaDB, mesmo esquema"** é o que torna possível a coexistência das duas metades sobre **um
  banco só** — o enabler da estratégia recomendada. Ele é condicional: ver § 4.3.
- **"Sem framework opinativo"** significa que o container que as 42 substituições exigem é trabalho do
  time, e isso entra na capacidade organizacional (RISK-025).

### 1.5 Regras de negócio críticas identificadas pelo Curator 🟢

Das **117 regras MIGRAR** ([`target_business_rules.md`](target_business_rules.md)), as que determinam
estratégia — não apenas desenho:

| Recorte | Regras | Por que decide estratégia |
|---|---|---|
| **Privacidade e dados pessoais** (domínio regulado) | `D1`–`D6` + `R7`, `R8` — 7 regras | LGPD/GDPR. Dispara o caso de borda regulatório: **nunca recomendar Big Bang** e **sempre incluir Parallel Run** para estes domínios |
| **Moderação de interação pública** | `C1`–`C12` — 12 regras, com **ordem significativa e curto-circuito** | [`domain.md`](../domain.md) §2.2 é a área de maior densidade de regra do sistema. Não é fatiável: a regra **é** a ordem |
| **Autorização** | `PERM-1`–`PERM-13` — 13 regras, **3 camadas paralelas**, uma falhando **aberta** | qualquer coexistência das duas metades tem de produzir a mesma decisão de acesso nas duas, ou a fatia vira falha de segurança |
| **Contrato de extensão** | `EXT-FILTROS`, `EXT-SUBST`, `EXT-EXCLUSAO`, `EXT-CONTEXTO`, `EXT-ORDEM` | 2.460 pontos de filtro que **devolvem valor**; `EXT-CONTEXTO` é **pré-requisito**, não refinamento |
| **Fronteira do banco** | `DB-SER`, `DB-SENT`, `DB-MIG`, `DB-TRG1`–`DB-TRG4` — 12 regras | `DB-SER` (estrutura **PHP serializada** em 4 famílias de `longtext`) é o que decide se a coexistência sobre um banco é viável |
| **Escopo declarado** | `ESC-SUPERFICIES`, `ESC-ORACULO`, `ESC-CLIENTE`, `ESC-HTTP`, `ESC-LIMITE-TAXA` | `ESC-ORACULO` **já compra** a instalação de referência; `ESC-SUPERFICIES` proíbe cortar XML-RPC, `admin-ajax.php` e o editor de arquivos |

**E 9 decisões humanas pendentes** (`BR-HUMANA-001` a `BR-HUMANA-009`,
[`ambiguity_log.md`](ambiguity_log.md)). Duas delas **travam** a estratégia e não apenas o desenho:
`BR-HUMANA-003` (sentinela de data) e `BR-HUMANA-004` (os 15 módulos sem spec). Ver § 4.3 e § 7.

---

## 2. Filtro de estratégias

Catálogo consultivo: `references/migration-strategies.md`, com 4 estratégias.

| Estratégia | Condição do catálogo | Este sistema | Veredito |
|---|---|---|---|
| **Strangler Fig** | sistema em produção, não pode parar; incrementalidade; roteamento possível | ⚠️ não há produção — **reapontada para a instalação de referência**. Roteamento é possível e barato: 109 *front controllers*, 7 superfícies produzidas, 12 superfícies de entrada, **0 fronteiras de processo** a respeitar, e um banco de 18 tabelas sem FK que as duas metades podem compartilhar | **avaliada (A)** |
| **Parallel Run** | lógica crítica; prova de equivalência por longo período | 🟢 aplica, e **já está comprada**: P16 manda levantar instalação executável como oráculo e a Decisão 2 define o que comparar por área. O que o catálogo não previu: não há fluxo de entrada de produção para espelhar — a entrada é **gerada** | **avaliada (B)** |
| **Big Bang** | sistema pequeno; janela tolerada; apetite transformacional; poucas integrações vivas | ⚠️ **3 das 4 condições falham**: 634.999 linhas, apetite `balanced`, 29 integrações. A única que passa, e passa de forma incomum, é a janela: não há disponibilidade a interromper. **Mas o caso de borda regulatório deste SKILL proíbe recomendá-lo** | **avaliada (C), não recomendável** |
| **Branch by Abstraction** | migração interna (linguagem ou framework muda, domínio fica); apetite conservador | 🟢 descrição casa com o projeto, ❌ **mecanismo não existe** aqui: ver abaixo | **filtrada** |

### 2.1 Por que Branch by Abstraction sai no filtro — e onde ela sobrevive

A linha do catálogo (*"linguagem muda, domínio fica"*) descreve este projeto melhor que qualquer outra. O
que não existe é o **mecanismo**: Branch by Abstraction exige que as duas implementações vivam atrás de uma
abstração **no mesmo processo**, alternáveis por configuração.

- [`architecture.md`](../architecture.md) §9 risco 1: **não há fronteira de processo em lugar nenhum**, e
  o alvo é outra runtime. Não existe ponto no legado onde se encaixe uma abstração que escolha entre PHP e
  TypeScript.
- Qualquer ponte entre as duas runtimes atravessa **2.460 `apply_filters` que devolvem valor** no meio do
  domínio. Serializar valor PHP → TypeScript → PHP em cada um deles muda referência, recurso e **ordem de
  emissão**, e a ordem de emissão convive com 1.463 `echo`/`print`. O critério da Decisão 2 é **byte a byte
  no valor devolvido por hook** — exatamente o que a ponte não consegue garantir.
- O custo da ponte não aparece em nenhum dos três documentos de arquitetura porque ela não foi considerada:
  seria infraestrutura nova, em dois lados, sem nenhuma contraparte no legado para comparar.

> **Onde ela sobrevive, e vale registrar:** *dentro* do código novo, como técnica de refatoração nas **5
> bordas** que o porte troca de qualquer forma (`mysqli`, os 15 `fsockopen`, PHPMailer, PCLZip, phpass) e
> nos **42 pontos de substituição** (38 funções de `pluggable.php` + 4 *drop-ins*). É o território da
> proposta `hexagonal` (`fit` 56) de [`refactor/architectures.md`](../refactor/architectures.md) §6 — e é
> **técnica interna**, não estratégia de migração. Fica registrada para o Designer, não aqui.

---

## 3. Estratégias avaliadas

### Estratégia A: Strangler Fig por superfície HTTP, com banco compartilhado

- **Descrição**: um *proxy* reverso na frente de duas implementações — a instalação de referência em PHP
  7.1.2 e o núcleo novo em TypeScript — **as duas sobre o mesmo banco MySQL**. Cada superfície HTTP pronta
  é virada no *proxy*, uma por vez. O que é estrangulado não é um sistema de produção: é a **instalação de
  referência**, que é a única instância viva do legado que este projeto vai ter.
- **Quando aplica**: quando existe costura de roteamento e o estado é compartilhável. Aqui as duas
  condições são medidas: **109 *front controllers*** e **7 superfícies de API produzidas** dão a costura;
  **18 tabelas, 0 chaves estrangeiras, 0 *triggers*, 0 *procedures*, 0 *views*** dão o estado — o banco
  deste sistema é armazenamento puro, e `DB-MIG` registra que o próprio sistema é sua ferramenta de
  migração por comparação de estrutura.
- **Custo**: **médio** (catálogo: médio). Ajuste para este sistema: o *proxy* e o banco compartilhado são
  **baratos**; o custo real está no arnês de paridade e no codec de compatibilidade da § 4.3 — não no
  roteamento.
- **Risco**: **baixo** (catálogo: baixo). Ajuste: baixo **no corte**, porque cada virada volta com uma
  regra de *proxy*; **médio na coexistência**, porque duas metades sobre um banco só criam riscos que não
  existem em nenhuma das duas sozinha (RISK-005 a RISK-009).
- **Tempo**: **longo** (catálogo: longo). Ajuste: o tempo **até a primeira virada** é longo e não é
  negociável — 68 módulos atrás de qualquer superfície. O tempo **entre** viradas é curto.
- **Adequação ao apetite derivado (`balanced`)**: 🟢 **direta**. O catálogo mapeia `balanced` →
  *Strangler Fig + Parallel Run*, e é a composição que a § 4 recomenda.
- **Adequação ao gap de paradigma (alto)**: 🟢 **é a única das três que o enfrenta em pedaços**. A
  implicação 2 (estado de requisição → estado de processo) é a mais grave e a que **nenhum dos 985 testes
  apanha**; com duas metades vivas, ela pode ser exercitada contra o oráculo numa superfície pequena antes
  de valer para as ~100 telas do painel.
- **Trade-offs**
  - **Prós**
    - Mantém um sistema **inteiro e funcionando** do primeiro dia: a metade PHP serve o que a metade
      TypeScript ainda não serve.
    - *Rollback* de granularidade fina e custo quase nulo: uma regra de *proxy*.
    - A paridade é verificada **por superfície**, contra o oráculo, e não só no fim — é o que transforma os
      985 testes de especificação em evidência, aos poucos.
    - Permite pôr o agendador e o *loopback* numa fatia própria, como a implicação 6 exige, sem travar o
      resto.
    - **Nenhuma migração de dados**: as duas metades leem e escrevem o mesmo esquema, revisão `61833`.
  - **Contras**
    - **A primeira fatia tem forma de Big Bang**: fecho transitivo de 68 de 71 módulos para *qualquer*
      superfície. A estratégia não reduz o tamanho do primeiro entregável — reduz o risco de **cortar**.
    - A coexistência custa o que a § 4.3 lista: codec de `serialize()` PHP, compatibilidade de cookie e
      *nonce*, dono único do esquema, cache de objeto desligado nas duas metades.
    - **Plugin PHP não roda na metade TypeScript.** Numa superfície já virada, todo filtro registrado por
      extensão PHP deixa de correr. Como `ESC-FILTRAVEL` declara que **toda** regra do catálogo é um
      *default* filtrável, a divergência é real — e é por isso que a instalação de referência precisa de
      **lista de extensões congelada e declarada** (RISK-008).
    - Exige disciplina de operação que esta árvore nunca teve: **`surface.json.ci_cd` está vazio**, não há
      `Dockerfile`, não há `composer.lock`, não há *pipeline*.

### Estratégia B: Parallel Run contra o oráculo executável

- **Descrição**: as duas implementações processam **a mesma entrada** e as saídas são comparadas pelo
  critério por área da Decisão 2. O legado permanece a autoridade até a paridade ser demonstrada.
- **Quando aplica**: lógica crítica — financeira, fiscal, regulatória — que precisa de prova de
  equivalência por período longo. Aqui aplica por dois caminhos: os **7 domínios regulados** de privacidade
  (LGPD/GDPR) e o fato de que **o projeto inteiro tem equivalência como critério de aceite**.
- **Custo**: **alto** (catálogo: alto). Confirmado, e com uma diferença deste sistema: o catálogo supõe que
  o fluxo de entrada já existe em produção. **Aqui não existe** (P19), logo a entrada tem de ser
  **construída** — corpus de caracterização, requisição a requisição. Esse corpus é o maior item de custo
  escondido do projeto e **nenhum dos 181 cards o cobre**.
- **Risco**: **médio** (catálogo: médio). Ajuste: o risco não é de corte, é de **falso verde** — comparar
  pelo critério errado numa área e declarar paridade que não existe. A Decisão 2 mitiga nomeando o critério
  por área.
- **Tempo**: **médio**. Ajuste: é o único tempo que **não encurta** com mais gente, porque depende de
  cobertura de comportamento, não de linhas escritas.
- **Adequação ao apetite derivado (`balanced`)**: 🟢 o catálogo mapeia `balanced` → *Strangler Fig +
  Parallel Run*. Esta é a metade de verificação do par.
- **Adequação ao gap de paradigma (alto)**: 🟢 **é a única que ataca a implicação 2 de frente**, porque
  permite incluir no arnês um caso que os UCs não descrevem: **duas requisições concorrentes**. A Decisão 2
  criou uma área de critério própria para isso e o teste **ainda não existe** em nenhum dos 985.
- **Trade-offs**
  - **Prós**
    - Transforma "idêntico" de afirmação em medida — é literalmente o que P16 pediu.
    - Independe de roteamento: pode começar **antes** de qualquer superfície existir, comparando valor
      devolvido por hook e efeito no banco. É isso que torna suportável a primeira fatia de 68 módulos.
    - Cobre os domínios regulados com a profundidade que o caso de borda regulatório deste SKILL exige.
  - **Contras**
    - **Não responde à pergunta que o Designer precisa**: em que ordem construir. É verificação, não
      sequência — e por isso não é recomendável como estratégia **principal**.
    - Sem fluxo de produção, a cobertura do arnês é **só** a que alguém escrever: a paridade medida nunca é
      maior que o corpus.
    - Duplica infraestrutura e trabalho por todo o período, sem entregar nada ao usuário no meio do caminho.
    - Em 5 bordas, o comportamento a comparar é um **modo de falha** que a instalação de referência produz
      sem registrar nada: **0 arquivos de log** nesta árvore.

### Estratégia C: Big Bang

- **Descrição**: escrever o clone inteiro e publicar a versão 1 quando estiver pronto, sem sistema composto
  no meio do caminho.
- **Quando aplica**: sistema pequeno, janela tolerada, apetite transformacional, poucas integrações vivas.
- **Custo**: **baixo** (catálogo: baixo) — e é o custo mais honesto das três, porque não paga coexistência
  nem arnês duplo.
- **Risco**: **alto** (catálogo: alto). Neste sistema o risco **não** é o que o catálogo descreve. Não há
  janela a estourar nem usuário a derrubar. O risco é outro, e é maior: **nenhuma verificação executável
  até o fim**, sobre 634.999 linhas, partindo de **0 arquivos de teste**, com 985 testes que são
  especificação e não evidência, e com um critério de aceite (byte a byte no contrato de terceiro) que
  **só** é conferível contra um oráculo que ninguém levantou ainda.
- **Tempo**: **curto** (catálogo). Ajuste: curto por não ter cerimônia, **e sem data**, porque o brief não
  tem prazo e o primeiro ponto de verificação é o último dia.
- **Adequação ao apetite derivado (`balanced`)**: ❌ **desalinhada**. O catálogo reserva Big Bang a
  `transformational` **em sistemas pequenos**, e este é `balanced` num sistema de 634.999 linhas.
- **Adequação ao gap de paradigma (alto)**: ❌ **é onde ela falha pior**. As implicações 2 e 6 são
  invisíveis sem execução comparada: a troca de identidade entre requisições concorrentes e o disparo não
  bloqueante que precisa **falhar** não aparecem em revisão de código. Descobri-las na véspera do
  lançamento é o pior momento possível.
- **Trade-offs**
  - **Prós**
    - **A topologia a favorece, e isso precisa estar escrito**: com SCC de 68 de 71 e fecho transitivo de
      96% em todos os candidatos, a primeira fatia útil já é quase o sistema. Big Bang é a descrição
      honesta da forma do primeiro entregável.
    - Sem produção, o custo clássico de cutover é **zero** — a condição que normalmente mata Big Bang não
      incide aqui.
    - Não paga nenhum dos custos de coexistência da § 4.3.
  - **Contras**
    - **Proibida pelo caso de borda deste SKILL**: há integrações e obrigações regulatórias (LGPD/GDPR via
      `D1`–`D6`, `R7`, `R8`), e a instrução é categórica — *nunca recomendar Big Bang*.
    - Sem ponto de verificação intermediário, o custo de um erro de paradigma cresce com o tempo:
      `EXT-CONTEXTO` toca **216 arquivos com superglobal** e **224 com `current_user_can`**. Descobrir que
      o contexto por requisição está errado depois de 60 módulos escritos é reescrever 60 módulos.
    - *Rollback* não existe como conceito: não há estado anterior ao qual voltar, só um lançamento a adiar.

---

## 4. Comparativo e recomendação

### 4.1 Comparativo

| Critério | A — Strangler Fig | B — Parallel Run | C — Big Bang |
|---|---|---|---|
| **Custo** (catálogo) | médio | alto | baixo |
| **Custo** (ajustado a este sistema) | médio — e **não** está no *proxy*, está no codec e no arnês | alto — o corpus de entrada tem de ser **construído** (P19) | baixo — não paga coexistência |
| **Risco** | baixo no corte · **médio** na coexistência | médio — risco de **falso verde** | **alto** — nenhuma verificação até o fim |
| **Tempo** | longo até a 1ª virada · curto entre viradas | médio · **não encurta com mais gente** | curto · **sem data** (brief sem prazo) |
| **Aderência ao apetite `balanced`** | 🟢 direta (catálogo: `balanced` → A + B) | 🟢 direta (metade de verificação do par) | ❌ reservada a `transformational` em sistema pequeno |
| **Compatibilidade com mudança de paradigma (alto)** | 🟢 enfrenta a implicação 2 em superfície pequena antes das ~100 telas | 🟢 única que mede concorrência, área exigida pela Decisão 2 | ❌ implicações 2 e 6 invisíveis sem execução comparada |
| **Incrementalidade por módulo** | ❌ impossível (SCC de 68) | ❌ não se aplica | ❌ não pretende |
| **Incrementalidade por superfície HTTP** | 🟢 **é o mecanismo** | 🟡 só como ordem de comparação | ❌ nenhuma |
| ***Rollback*** | 🟢 uma regra de *proxy* | 🟢 o legado nunca deixou de ser autoridade | ❌ inexistente — só adiar o lançamento |
| **Migração de dados** | 🟢 **nenhuma** — mesmo esquema, revisão `61833` | 🟢 nenhuma | 🟢 nenhuma |
| **Atende ao caso de borda regulatório** | 🟢 sim, com B nos domínios regulados | 🟢 é o mecanismo exigido | ❌ **proibida** |
| **Responde "em que ordem construir?"** | 🟢 sim | ❌ não | 🟡 trivialmente: tudo de uma vez |

### 4.2 Recomendação do Strategist

- **Estratégia recomendada**: **A — Strangler Fig por superfície HTTP, com banco compartilhado**, tendo
  **B — Parallel Run como companheira obrigatória, não como alternativa**, começando **antes** da primeira
  virada e permanente nos domínios regulados.
- **Justificativa**, rastreável a brief + paradigma + apetite:
  1. **Apetite** (`balanced`, 🟢 Decisão 1): o catálogo mapeia `balanced` → *Strangler Fig + Parallel Run*.
     É a única das três leituras que não contraria a decisão humana já registrada.
  2. **Paradigma** (gap **alto**, 🟢): a implicação mais grave é a 2, e ela é invisível a uma requisição por
     vez. A composição A+B é a única que a expõe cedo, em superfície pequena, antes de valer para as ~100
     telas do painel e para os 224 arquivos com `current_user_can`.
  3. **Brief** (🔴 ausente, restrições indefinidas): sem prazo nem orçamento declarados, a escolha correta é
     a que **preserva opção**. A é a única que mantém um sistema inteiro funcionando em qualquer ponto de
     interrupção; se o projeto parar no meio, o resultado de A é um sistema composto que serve, e o de C é
     código que não roda.
  4. **Regras críticas** (🟢 Curator): o domínio regulado de privacidade e a cascata de 13 regras de
     moderação exigem prova de equivalência, não inspeção — e `ESC-ORACULO` já comprou o oráculo que a
     torna possível.
  5. **Topologia** (🟢 medida nesta etapa): A não finge que o grafo é fatiável. Ela desloca a
     incrementalidade de onde ela **não existe** (módulo) para onde ela **existe** (superfície HTTP), e
     declara que a primeira fatia tem forma de Big Bang.
- **O que a recomendação NÃO afirma**, para não ser lida além do que mede:
  - **não** afirma que a primeira entrega é pequena: são 68 módulos, medidos;
  - **não** afirma que a coexistência é gratuita: a § 4.3 lista quatro pré-requisitos que não existem hoje;
  - **não** afirma que C é tecnicamente inviável: ela é **proibida pela regra regulatória** deste SKILL e
    **desalinhada do apetite**, e a topologia a favorece — está escrito acima de propósito;
  - **não** substitui a decisão humana: a § 6 está em branco.

### 4.3 As quatro condições da coexistência — e a que pode derrubar a recomendação

A estratégia A se apoia em **um banco compartilhado**. Isso é cobrado em quatro itens, nenhum dos quais
existe hoje:

| # | Condição | Evidência de que é necessária | Se falhar |
|---|---|---|---|
| 1 | **Codec de `serialize()` do PHP, byte a byte** | `DB-SER`: 4 famílias de `longtext` guardam estrutura PHP serializada — opções, as 4 tabelas de metadados. E `PERM-2`: a autorização mora num **metadado serializado por site**, com o papel dentro do nome da `meta_key` ([`architecture.md`](../architecture.md) §9 risco 3) | a metade PHP não lê o que a metade TypeScript escreve. **Coexistência impossível** → a recomendação cai para B+C |
| 2 | **Compatibilidade de cookie, *nonce* e sessão** | a chave do HMAC do cookie embute um fragmento de **4 caracteres** do hash da senha (`wp-includes/pluggable.php:855-867`, [`gaps.md`](../gaps.md) A-05); o *nonce* amarra tick, ação, usuário e token de sessão; `TM-04` da unit de autenticação diz: *"transportar as chaves e sais, ou aceitar que todo cookie e todo nonce existente deixa de valer na virada"* | administrador que atravessa a fronteira do *proxy* é deslogado. A virada quebra o painel sem quebrar nenhum teste |
| 3 | **Dono único da evolução de esquema** | `DB-MIG`: o sistema é sua própria ferramenta de migração **por comparação de estrutura**; `db_version` = `61833` (`wp-includes/version.php:26`). `BR-DESCARTAR-006` tira os 38 portões históricos de `upgrade_all()` porque "instalação nova: o caso não ocorre" — e numa coexistência o caso **volta a ocorrer** | as duas metades disputam o esquema. Risco de corromper a instalação de referência, que é o oráculo |
| 4 | **Cache de objeto desligado nas duas metades** | `object-cache` tem **27 dependentes** e é *drop-in* **por presença de arquivo** ([`domain.md`](../domain.md) §1.6) | cada metade serve dado obsoleto escrito pela outra, e a divergência aparece como falha de paridade intermitente — a mais cara de diagnosticar |

> 🔴 **E uma decisão humana pendente pode derrubar a recomendação inteira: `BR-HUMANA-003`.**
> O sentinela `'0000-00-00 00:00:00'` é o *default* de 10 colunas `datetime` e **carrega significado de
> negócio**. A opção **(c)** — manter a string literal — preserva o esquema e com ele a coexistência e o
> **zero de migração de dados**. A opção **(a)** — coluna anulável com marcador explícito — **muda o
> esquema**, e nesse momento as duas metades deixam de poder compartilhar o banco: a estratégia A perde o
> seu enabler, reaparece uma ETL, e cada instalação adotante passa a precisar de janela.
> O Curator recomenda **(c)** quando o banco alvo é MySQL com `sql_mode` permissivo — e o banco alvo
> **é** MySQL/MariaDB (🟢 decidido). **Esta recomendação pressupõe (c).** Se a resposta for (a), esta
> estratégia precisa ser reavaliada, não ajustada.

### 4.4 Como a estratégia recomendada fatia este sistema

A ordem abaixo é de **entrega**, não de dependência — porque ordem de dependência não existe dentro do SCC
de 68. Cada fatia declara o que vira no *proxy*, o que está atrás dela e por qual critério da Decisão 2 é
aceita.

| # | Fatia | O que vira no *proxy* | Atrás dela | Critério de aceite (Decisão 2) | Trava |
|---|---|---|---|---|---|
| **0** | **Fundação verificável** | nada | oráculo P16 no ar · arnês de paridade · codec de `serialize()` · compatibilidade de cookie/*nonce* · `EXT-CONTEXTO` (contexto por requisição) · barramento de hooks síncrono, reentrante, por prioridade inteira, **com retorno de valor** · ordem de arranque como contrato | nenhum efeito observável: é pré-requisito | `BR-HUMANA-001` (framework), `BR-HUMANA-003` |
| **1** | **Núcleo compartilhado — 12 módulos** | nada | os 12 módulos de maior peso de entrada medido, construídos **como unidade**; dentro deles, os **65 ciclos de dois módulos com volta de peso 1** cortados primeiro (o caso-resumo é `nucleo-utilitario-e-erro ↔ rest-api`: **557 chamadas contra 1**) | efeito no banco + byte a byte no valor devolvido por hook | 🔴 **`BR-HUMANA-004`: 5 dos 12 não têm spec** |
| **2** | **Superfícies públicas somente de leitura** | `wp-sitemap.xml` · feeds RSS/Atom · oEmbed · OPML | **68 de 71 módulos** (medido) | **byte a byte** — contrato de terceiro | — |
| **3** | **Leitura de tema** | o site público | o mesmo ciclo + `temas-empacotados` | comportamento de caso de uso (UC-01, UC-02, UC-47) | escopo dos temas empacotados (§ 7, dúvida 3) |
| **4** | **REST somente de leitura** | rotas `GET` de `/wp-json` | ciclo + `rest-api` | **byte a byte** — contrato de terceiro | — |
| **5** | **Agendador e *loopback*** — **fatia própria, por mandato** | `wp-cron.php` | `cron` + as **4 implementações independentes** do protocolo de *loopback* | **a falha do disparo**, não a latência — ver § 5.2 | `BR-HUMANA-005` |
| **6** | **Identidade e autorização** | `wp-login.php` · cookie · *nonce* | `autenticacao-e-sessoes` + os 13 `PERM-*` + 3 camadas paralelas | efeito no banco + **teste próprio de concorrência** | `BR-HUMANA-008` (*default* da rota REST) |
| **7** | **Escrita de conteúdo e moderação** | `POST` de REST · `wp-comments-post.php` | a cascata de **13 regras com curto-circuito**, 409 e 429 na mesma resposta | efeito no banco + byte a byte no valor de hook | — |
| **8** | **Privacidade — domínio regulado** | as telas e rotas de `D1`–`D6` | `privacidade-e-dados-pessoais` | efeito no banco **+ Parallel Run permanente** (caso de borda regulatório) | `BR-HUMANA-009` |
| **9** | **Painel** | ~100 telas · `admin-ajax.php` | `telas-do-painel` (sem spec) + `admin-list-tables` + `dashboard` | comportamento de caso de uso + **teste próprio de concorrência** | `BR-HUMANA-004` |
| **10** | **Superfícies de escrita paralelas** | XML-RPC · editor de arquivos · canal assíncrono do painel | `ESC-SUPERFICIES` — **nenhuma sai**, apesar de o `backlog.json` marcar REQ-121, REQ-148 e REQ-179 como `wont` | **byte a byte** — contrato de terceiro | — |
| **11** | **Rede (multisite)** | segundo painel · 6 tabelas · 7 regras `N*` | `multisite` | efeito no banco | 🔴 A-3: não se sabe se a instalação é multisite |
| **12** | **Pontas de consumo** | — | `blocos-do-nucleo` · `plugins-empacotados` · `temas-empacotados` — `fan_in` 0, e por isso **últimas** | comportamento de caso de uso | § 7, dúvida 3 |

**Por que esta ordem, em três frases.** As fatias 2 e 4 vêm primeiro entre as viradas porque são
**somente leitura** e têm critério **byte a byte** contra o oráculo: uma divergência não pode corromper
estado compartilhado, e o *rollback* é uma regra de *proxy*. As fatias de escrita vêm depois porque, com
banco compartilhado, uma divergência **persiste**. E a fatia 5 está fora de ordem de propósito: é mandato
do paradigma (§ 5.2), não conveniência.

> ⚠️ **O que esta tabela não esconde:** a coluna *"atrás dela"* diz **68 de 71 módulos** já na fatia 2.
> **A primeira virada é barata; o código atrás dela não é.** É a consequência direta do SCC medido, e
> nenhuma estratégia a remove — A apenas faz com que, a partir daquele ponto, cada passo seguinte seja
> pequeno e reversível.

### 4.5 Nota de sensibilidade ao prazo 🔴

O brief não tem prazo (§ *O chão desta etapa*, item 1). A recomendação **muda** com ele, e é isso que o
caso de borda do SKILL manda registrar:

| Se o prazo for | A recomendação | Por quê |
|---|---|---|
| **indefinido** (o caso de hoje) | **A + B**, como acima | preserva opção: em qualquer ponto de interrupção existe sistema que serve |
| **folgado** (sem data de mercado) | **A + B**, sem mudança | o tempo longo até a primeira virada deixa de ser objeção |
| **curto e fixo** | ⚠️ **reavaliar** — A fica mais caro que C sem entregar antes, porque o tempo até a primeira virada é o mesmo e a coexistência é custo extra | nesse cenário o que se corta primeiro são as 175 violações de camada e o arnês de paridade — e cortar o arnês **desfaz o critério de aceite**, não o cronograma |
| **curto, com escopo negociável** | **A sobre um subconjunto declarado de superfícies**, e o restante fora da versão 1 | é a única forma de encurtar que não mente sobre paridade |

---

## 5. Os três mandatos do paradigma endereçados a este agente

[`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes* endereça três linhas ao Strategist.
Cada uma é respondida aqui, com o que foi feito.

### 5.1 Implicação 5 — os 254 ciclos de dois módulos e o SCC de 68

> *"A ordem de migração não existe dentro do ciclo… Se a estratégia propuser fatias do ciclo, declarar como
> resolve o ciclo ESM."*

**Resposta:** a estratégia recomendada **não propõe fatias do ciclo**. Ela declara que o ciclo é uma
unidade de construção (fatia 1) e desloca a incrementalidade para a superfície HTTP. E **corrige** o
mandato: as 2 raízes estão dentro do SCC e as 3 pontas dependem de 68 módulos — ver § *O chão desta etapa*,
item 3.

**Como o ciclo ESM é resolvido**, declarado porque o alvo transforma dependência circular de dívida de
estilo em **erro de inicialização**:

1. **Núcleo compartilhado de 12 módulos declarado antes de qualquer módulo de domínio.** É a mesma medida
   de [`refactor/architectures.md`](../refactor/architectures.md) §2.1: o acoplamento par-a-par cai de
   **35,0% para 8,4%**, com **175 violações de camada** (núcleo → domínio, peso 990) como dívida
   **explícita e datada**. O preço, nomeado: admitir que `posts-e-tipos-de-conteudo` e `telas-do-painel`
   são **núcleo, não domínio**.
2. **Regra de dependência verificada no *build*, começando vermelha** nas 175 violações conhecidas, com
   lista de exceções datada. Regra que começa verde não pega nada.
3. **Os 65 ciclos de dois módulos com volta de peso 1 cortados primeiro** — conferidos em `scc.py`. O
   caso-resumo é `nucleo-utilitario-e-erro ↔ rest-api`: **557 chamadas num sentido e 1 no outro**.
4. **`bootstrap-e-carregamento ↔ hooks-e-plugin-api` (515 contra 60) não é cortado**: entra inteiro no
   núcleo, como o grafo medido recomenda.
5. **Onde o ciclo sobrar, injeção tardia em vez de importação no topo** — avaliação de módulo não pode
   depender do outro lado do ciclo.

### 5.2 Implicação 6 — o disparo não bloqueante depende de **falhar**

> *"Pôr o agendador e o loopback numa fatia própria, com critério de aceite que verifique a falha, e não a
> latência. 4 implementações independentes do mesmo protocolo de loopback precisam de decisão única."*

**Resposta:** cumprido na **fatia 5** da § 4.4, com três declarações:

- **Fatia própria e isolada**, nem antes nem junto das fatias de leitura: é a única em que o
  comportamento correto é um **fracasso**. Em PHP, *timeout* 0,01 s + `blocking` falso + `sslverify` falso
  **abortam** a requisição de saída; numa runtime assíncrona o laço de eventos continua vivo depois da
  resposta e a requisição pode **completar** — e aí o produto passa a se comportar diferente no primeiro
  dia.
- **Critério de aceite da fatia**: *"o disparo falha"*, com a consequência observável de `R5`/ADR-0006
  conferida contra o oráculo — **um site que ninguém administra nunca executa a própria limpeza**, porque a
  coleta da lixeira só é agendada por visita **autenticada** ao painel (`wp-admin/admin.php:104`, depois de
  `auth_redirect()`). Latência **não** é critério.
- **Decisão única para as 4 implementações**: a fatia carrega `BR-HUMANA-005` como pré-requisito, não como
  formalidade — **conferir a equivalência das quatro contra o oráculo antes de unificar**. A duplicação
  está admitida em comentário em `wp-admin/includes/class-wp-site-health.php:3622`, e a falha é silenciosa
  por projeto: unificar sem conferir muda comportamento sem que nada acuse.

### 5.3 Implicação 4 — a política de *retry* escrita à mão, com efeito em e-mail

> *"Não adotar retry de infraestrutura antes de mapear A5, A6, A7 e ADR-0008; o número de e-mails ao
> administrador é critério de aceite."*

**Resposta:** cumprido por decisão de estratégia, e reforçado por uma decisão já tomada: **a stack alvo não
tem mensageria** (🟢 P10 e [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*). Logo **não existe
`retry` de infraestrutura a adotar** — não há *broker*, não há DLQ, e a fatia 5 constrói o agendador como
lista em `wp_options` disparada por requisição HTTP ao próprio host, como no legado.

O mapeamento exigido, antes de qualquer decisão de nova tentativa:

| Regra | O que fixa | Critério de aceite |
|---|---|---|
| `A5` / [ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md) | falha crítica **congela** a atualização automática até intervenção humana | o congelamento ocorre e **nada** o desfaz sozinho |
| `A6` | falha transitória tem **exatamente uma** segunda chance, em uma hora, e **não** notifica | **o número de e-mails**: zero na primeira falha, um na segunda |
| `A7` | o mesmo aviso **não** é repetido | contagem de e-mails por período, comparada ao oráculo |
| `BR-HUMANA-007` | o destravamento depende de uma **invariante não declarada** entre dois arquivos (`wp-admin/includes/update-core.php:1922`) | pendente: (a) reproduzir o acidente ou (b) declarar a invariante com teste |

> **A armadilha, nomeada:** um `retry` genérico sobrepõe `A5`, `A6` e `A7` e muda **quantos e-mails o
> administrador recebe** — que é comportamento observável e, pelo critério da Decisão 2, efeito a comparar.
> Quem tratar isso como "o *broker* resolve" quebra ADR-0008 e `A7` de uma vez. Não há *broker*.

---

## 6. Decisão humana

> 🔴 **PENDENTE.** Nenhuma estratégia foi escolhida em nome de ninguém. `state.json.answer_mode` é `file`:
> esta execução não teve chat interativo, logo a escolha fica neste campo, para ser preenchida.

- **Estratégia escolhida**: `<A | B | C>` — **em branco**
- **Quem decidiu**: `<nome>` — 🔴 em branco (o brief não nomeia *stakeholder* algum)
- **Quando**: `<ISO-8601>` — em branco
- **Justificativa do decisor**: `<texto livre>` — em branco

**A pergunta, em uma linha:** confirma **A — Strangler Fig por superfície HTTP com banco compartilhado, com
Parallel Run obrigatório**, ciente de que (i) a primeira fatia tem 68 módulos atrás dela, (ii) a
coexistência cobra as 4 condições da § 4.3 e (iii) a recomendação **pressupõe `BR-HUMANA-003` = (c)**?

**Duas respostas que mudam a estratégia, não o desenho** — e por isso vêm antes de tudo:

| Decisão | Se for | Efeito |
|---|---|---|
| `BR-HUMANA-003` sentinela de data | **(c)** manter a string literal | 🟢 recomendação vale como está: esquema compartilhado, **zero migração de dados** |
| `BR-HUMANA-003` sentinela de data | **(a)** coluna anulável | ⚠️ **A perde o enabler**: sem esquema comum não há banco compartilhado. Reaparece ETL e janela por instalação |
| `BR-HUMANA-004` os 15 módulos sem spec | **(a)** rodar o redator antes | 🟢 fatia 1 destravada; pipeline atrasa uma etapa |
| `BR-HUMANA-004` os 15 módulos sem spec | **(b)** seguir com a lacuna | ⚠️ a fatia 1 é construída sem spec para 5 dos 12 módulos de núcleo — e são as camadas em que, pela P21, *"'idêntico' se decide"* |

---

## 7. Sinais de alerta específicos

Os sinais que o SKILL manda verificar, com o que disparou e o que não disparou:

| Sinal | Disparou? | O que foi feito |
|---|---|---|
| Mudança grande de paradigma (gap **alto**) **+ apetite transformacional** → recomendar Parallel Run | ⚠️ **parcialmente**: o gap é **alto** 🟢, mas o apetite é **`balanced`**, não `transformational`. O sinal **não** dispara literalmente | **Parallel Run foi incluído de todo modo**, como companheira obrigatória — pelo gap alto, pela implicação 2 e porque `ESC-ORACULO` já o compra |
| Apetite conservador + sistema em produção → favorecer Strangler Fig + Branch by Abstraction | ❌ **não dispara**: o apetite é `balanced` e **não há produção** (P19) | registrado. Branch by Abstraction saiu no filtro por falta de mecanismo (§ 2.1) |
| Apetite transformacional + sistema pequeno → permitir Big Bang com *rollback* robusto | ❌ **não dispara**: nem `transformational` nem pequeno (634.999 linhas) | C avaliada e **não recomendada** |
| **Sistema com integrações regulatórias → nunca Big Bang; sempre Parallel Run como alternativa nos domínios regulados** | 🟢 **dispara**: `D1`–`D6`, `R7` e `R8` são LGPD/GDPR, e a P20 declara a obrigação herdada pela implantação | C **proibida**; a **fatia 8** tem Parallel Run **permanente**, não temporário |
| Sistema legado já em *decommission* → preferir Big Bang ou Strangler curta | ❌ **não dispara, e o inverso é verdade**: o legado é o WordPress *upstream*, que **segue lançando** | registrado como RISK-021 (deriva da referência), que nenhum artefato anterior tinha |
| Brief sem prazo / orçamento → restrição "indefinida" + nota de sensibilidade ao prazo | 🟢 **dispara** | § *O chão desta etapa* item 1 e § 4.5 |

### 7.1 Três sinais que este sistema acrescenta e o catálogo não prevê

1. **O "retry/DLQ" do gap de paradigma não tem onde morar.** A stack alvo **não tem mensageria** (🟢 P10).
   A metade do gap `procedural → event-driven` que o catálogo descreve como *"tratamento de erro vira
   retry/DLQ"* simplesmente **não acontece** — e isso é bom, porque `A5`, `A6` e `A7` sobrevivem. Mas
   significa que, num porte, **não há mensageria a migrar: há uma a construir**, caso alguém decida depois
   que precisa de uma.
2. **Reproduzir "nenhum limite de taxa" tem consequência diferente no alvo.** `ESC-LIMITE-TAXA` manda
   portar a ausência de limite, e os dois únicos freios são travas de tempo (60 s no `wp-cron.php`, 5 min no
   `wp-mail.php`). Em PHP, uma enxurrada custa um processo por requisição, que morre. **Em Node, ela bloqueia
   o laço de eventos único.** A regra é idêntica; o raio de alcance não é. P19 já resolve o rumo — limite de
   taxa é **decisão de implantação, fora do núcleo** — e isso vira RISK-013.
3. **Clonar um produto GPL é risco de estratégia, não detalhe de empacotamento.** `license.txt` da raiz e
   `readme.html:95` declaram **GPL v2 ou posterior**, e nenhuma etapa do pacote registrou a consequência de
   derivar um clone a partir da leitura desse código, nem o uso das marcas. Vira RISK-028 e precisa de
   parecer jurídico — não de opinião de engenharia.

---

## 8. Dúvidas registradas e não contornadas

Nenhuma destas foi resolvida por invenção. Todas seguem para quem decide.

| # | Dúvida | Efeito se continuar aberta |
|---|---|---|
| 1 | 🔴 **Prazo, orçamento e *stakeholders*** não existem (brief ausente, 3ª etapa seguida a registrar) | a recomendação carrega a nota de sensibilidade da § 4.5; **nenhum risco tem *owner* nomeado**, só papel |
| 2 | 🔴 **`BR-HUMANA-003`**: a resposta (a) **derruba** o enabler da estratégia recomendada | a § 4.2 declara que a recomendação pressupõe (c). Se vier (a), **reavaliar**, não ajustar |
| 3 | ⚠️ **Os 3 temas e os 2 plugins empacotados entram no porte?** `ESC-CLIENTE` fecha o escopo do Screen Translator em ~100 telas **sem o editor**; `BR-DESCARTAR-001/002/003` tiram o Akismet por escopo. **Nenhuma regra diz o que acontece com `temas-empacotados`** — e sem tema o site público não renderiza, logo a fatia 3 não tem critério de aceite | a fatia 3 fica sem *default* de renderização; a fatia 12 fica sem escopo |
| 4 | 🔴 **A-3**: não se sabe se a instalação é multisite | a fatia 11 (8 cards de EP-12) pode sair inteira ou ser obrigatória. É o maior item de escopo em aberto |
| 5 | 🔴 **A-7**: volumetria desconhecida | nenhuma janela de instalação adotante é dimensionável. [`cutover_plan.md`](cutover_plan.md) § *Anexo* fica parametrizado |
| 6 | ⚠️ **Plugin PHP na metade virada**: nenhuma decisão existe sobre compatibilidade de extensão durante a coexistência | se a instalação de referência rodar com extensão ativa, **toda comparação de paridade fica contaminada** (RISK-008) |
| 7 | 🔴 **O corpus de entrada do Parallel Run não existe e nenhum dos 181 cards o cobre** | é o maior custo escondido do projeto, e hoje não está em plano nenhum |
| 8 | ⚠️ **`BR-HUMANA-008`** (*default* aberto de rota REST sem `permission_callback`) é pré-requisito da fatia 6 | virar a fatia 6 sem resposta produz, numa metade, um sistema mais fechado que o legado — ou mais aberto |

---

## 9. Onde este documento continua

| Próximo agente | O que esta estratégia lhe entrega |
|---|---|
| **Designer** | que **não existe fatiamento por módulo** (SCC de 68, fecho de 96% em 18 candidatos medidos): o desenho é do **núcleo compartilhado de 12 módulos**, com regra de dependência no *build* começando vermelha nas 175 violações. E que `EXT-CONTEXTO` é a **fatia 0**, antes de qualquer domínio |
| **Designer** | a **fronteira de `await`** tem de ser declarada por fatia, não por módulo — a fatia 2 é somente leitura de propósito, para que a primeira comparação byte a byte não dependa de ordem de escrita |
| **Screen Translator** | o painel é a **fatia 9**, depois de identidade (fatia 6): traduzir tela antes do contexto por requisição produz vazamento de sessão entre usuários. E as superfícies de escrita paralelas são a **fatia 10**, nenhuma sai |
| **Inspector** | o critério de aceite **por fatia** da § 4.4, o arnês de Parallel Run como obrigação permanente nos domínios regulados (fatia 8), e o aviso de que o **corpus de entrada não existe** — os 985 testes são especificação, e nenhum exercita concorrência |
| **Quem decide** | a § 6 em branco, as 4 condições da § 4.3 e as 8 dúvidas da § 8 |

---

## 10. Como reproduzir cada número

| Script | O que mede |
|---|---|
| `.reversa/work/reversa-strategist/medir.py` | módulos, pares, peso, `fan_in`/`fan_out`, núcleo de 12, pontas, integrações, casos de uso, cards |
| `.reversa/work/reversa-strategist/scc.py` | Tarjan: SCC de 68, posição das 2 raízes e das 3 pontas, os 65 ciclos de dois módulos com volta de peso 1 |
| `.reversa/work/reversa-strategist/fatias.py` | fecho transitivo de dependências de cada fatia candidata — a medida que mostra os 96% em todos os 18 |
| `.reversa/work/reversa-strategist/selar.py` | `sha256` do corpo abaixo do *front matter* dos três artefatos |
| `.reversa/work/reversa-strategist/validar.py` | *front matter*, hash, links relativos, âncoras, largura de tabela, campos do template e *owner* por risco |
