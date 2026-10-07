---
schemaVersion: 1
generatedAt: 2026-10-06T18:30:00-03:00
reversa:
  version: "1.0.0"
kind: ambiguity_log
producedBy: curator
hash: "sha256:c324089f303cddf48d050e0330e6d33c82a67023fbc8a67b1804ae198d3d6f08"
---

# Ambiguity Log

> Consolidação de todos os itens ⚠️ AMBÍGUOS ou pendentes detectados pelos agentes ao longo do
> *pipeline*. Status final esperado quando o *pipeline* conclui: nenhum item PENDENTE.

> **Criado pelo Curator** em 2026-10-06, porque não existia: o SKILL desta etapa manda criá-lo se
> ausente. O campo `producedBy` diz `curator` e não `orchestrator` porque foi este agente que o
> gravou; a partir daqui o orquestrador `/reversa-migrate` é o dono do arquivo e os agentes seguintes
> acrescentam os seus itens.

## Resumo

- Total de itens: **15**
- PENDENTES: **9**
- RESOLVIDOS COM DECISÃO HUMANA: **3**
- REFERIDOS À CODIFICAÇÃO: **3**

| Detectado por | Itens | Status |
|---|---:|---|
| `paradigm_advisor` | 3 | resolvidos — as duas decisões de [`pending_decisions.md`](pending_decisions.md) estão respondidas |
| `curator` | 12 | 9 PENDENTES (um por item de DECISÃO HUMANA) e 3 referidos à codificação |

---

## Itens

### AMB-001
- **Descrição**: **Como tratar o gap de paradigma entre o legado e a stack alvo** — o legado é híbrido (procedural dominante com barramento síncrono, OO clássico em bolsões) e o paradigma natural do alvo TypeScript é event-driven assíncrono, com gap **alto** por duas causas somadas: sincronia → assincronismo, e processo por requisição → processo longo-vivo.
- **Detectado por**: paradigm_advisor
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Decisão do usuário* e [`pending_decisions.md`](pending_decisions.md) § *Decisão 1*
- **Status**: RESOLVIDO COM DECISÃO HUMANA
- **Decisão tomada**:
  - **Escolha**: **Opção 3 — híbrido.** Conservador no comportamento observável, idiomático na estrutura interna. `derived_appetite` = **`balanced`**.
  - **Decisor**: a pessoa que respondeu [`pending_decisions.md`](pending_decisions.md) — o arquivo não registra nome
  - **Quando**: 2026-10-06 (data da resposta gravada no arquivo; o horário não é registrado)
  - **Justificativa**: *"O alvo do porte é o WordPress em si, reescrito em TypeScript, e o critério é regra idêntica — não forma idêntica."* Não a Opção 2 porque forçar procedural com estado global numa runtime assíncrona reproduz a **forma** do PHP, e nenhuma das 23 respostas pediu isso. Não a Opção 1 porque ela desfaz o que as 23 respostas decidiram item por item, com `fit` 14 contra 86.
- **Nota do Curator**: ⚠️ **Corrige artefato anterior.** [`paradigm_decision.md`](paradigm_decision.md) declara, em três lugares, que a escolha está 🔴 PENDENTE e carrega `derived_appetite: conservative` como hipótese. A resposta foi gravada **depois** daquele artefato. O Curator operou com `balanced`, e é essa a premissa de todas as notas de compatibilidade de [`target_business_rules.md`](target_business_rules.md).

### AMB-002
- **Descrição**: **O critério de aceite de "idêntico"** — saída HTTP byte a byte, efeito no banco, ou comportamento de caso de uso. Sem ele a fronteira da Opção 3 não é verificável, porque é o teste que decide o que pode ser idiomático.
- **Detectado por**: paradigm_advisor
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Decisão 2* · [`refactor/architectures.md`](../refactor/architectures.md) §8 item 6
- **Status**: RESOLVIDO COM DECISÃO HUMANA
- **Decisão tomada**:
  - **Escolha**: **(d) combinação por área**, em cinco áreas: contrato de terceiro → **byte a byte**; valor devolvido por hook → **byte a byte no valor**; esquema e efeito de escrita → **efeito no banco**; HTML de tema e painel → **comportamento de caso de uso**; estado entre requisições concorrentes → **teste próprio, fora dos UCs**.
  - **Decisor**: a pessoa que respondeu [`pending_decisions.md`](pending_decisions.md) — o arquivo não registra nome
  - **Quando**: 2026-10-06 (data da resposta gravada no arquivo; o horário não é registrado)
  - **Justificativa**: A quinta área é acréscimo deliberado ao que o documento ofereceu: o critério (c) tem furo declarado — nenhum caso de uso descreve duas requisições ao mesmo tempo — e adotá-lo sem tapá-lo deixaria a troca de escopo de requisição por escopo de processo passar sem teste.
- **Nota do Curator**: ⚠️ **Corrige artefato anterior.** [`paradigm_decision.md`](paradigm_decision.md) § *Notas* item 7 e [`refactor/architectures.md`](../refactor/architectures.md) §8 item 6 ainda registram isto como lacuna 🔴 aberta. **Está respondido.** Registrado como regra em `BR-MIGRAR-116`, e o teste da quinta área **ainda não existe**: nenhum dos 985 testes de [`backlog/tests.md`](../backlog/tests.md) exercita concorrência.

### AMB-003
- **Descrição**: **O lado cliente dos 5 módulos do editor** — `wp-includes/js/dist/` está ausente desta árvore e P15 já dissera de onde tirar o fonte, mas ninguém havia dito **se ele entra no mesmo porte, com a mesma decisão de paradigma, ou se é dependência externa adotada como está**. Decidia o escopo do Screen Translator e se a Opção 3 tem uma ou duas fronteiras de paradigma.
- **Detectado por**: paradigm_advisor
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 2* · [`architecture.md`](../architecture.md) §10 A-4
- **Status**: RESOLVIDO COM DECISÃO HUMANA
- **Decisão tomada**:
  - **Escolha**: **Dependência externa adotada como está, com versão cravada — não reescrita.** O que entra no porte é o lado **servidor** que alimenta esse cliente, e o contrato servidor→cliente é **byte a byte**. Escopo do Screen Translator: as ~100 telas do painel, **sem** o editor.
  - **Decisor**: a pessoa que respondeu [`pending_decisions.md`](pending_decisions.md) — o arquivo não registra nome
  - **Quando**: 2026-10-06 (data da resposta gravada no arquivo; o horário não é registrado)
  - **Justificativa**: *"Não há porte de linguagem a fazer ali. O lado cliente já é JavaScript/TypeScript no upstream… reescrevê-los não aproxima do idêntico — **afasta**, porque garante divergência da única implementação de referência que existe."* A consequência foi aceita e declarada: a Opção 3 passa a ter **duas** fronteiras de paradigma, a de dentro híbrida e a de fora de adoção pura. O preço também: dependência de versão com o upstream.
- **Nota do Curator**: ⚠️ **Respondida DURANTE esta etapa**, entre a primeira leitura das entradas e a reconferência final. Virou regra a migrar em `BR-MIGRAR-117` (`ESC-CLIENTE`), e deixou de ser item de DECISÃO HUMANA. **Micro-correção de contagem:** a resposta fala em 116 blocos registrados por `block.json`; esta árvore tem **115** em `wp-includes/blocks/`.

### AMB-004
- **Descrição**: A stack alvo está incompleta e o brief não existe
- **Detectado por**: curator
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1* · [`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada* e § *Notas* item 1
- **Referência cruzada**: [`BR-HUMANA-001`](target_business_rules.md#br-humana-001) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: 🔴 GAP de pré-requisito — `migration_brief.md` não existe
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-001`, **não** aplicada)

### AMB-005
- **Descrição**: O banco alvo não foi declarado, e a restrição é estrutural
- **Detectado por**: curator
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*, campo **Banco** · [`architecture.md`](../architecture.md) §9 risco 5 · [`questions.md`](../questions.md) Pergunta 2
- **Referência cruzada**: [`BR-HUMANA-002`](target_business_rules.md#br-humana-002) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: 🔴 GAP — banco alvo não declarado, com restrição conhecida
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-002`, **não** aplicada)

### AMB-006
- **Descrição**: `'0000-00-00 00:00:00'` é o default de 10 colunas `datetime` e carrega significado de negócio: em `posts` marca um rascunho cujo status declara `da…
- **Detectado por**: curator
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §4 · [`state-machines.md`](../state-machines.md) §1
- **Referência cruzada**: [`BR-HUMANA-003`](target_business_rules.md#br-humana-003) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: ⚠️ AMBÍGUA — o sentinela de data tem significado de negócio e não tem destino óbvio
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-003`, **não** aplicada)

### AMB-007
- **Descrição**: Quinze dos 71 módulos do grafo medido não têm spec alguma, e entre eles estão cinco dos mais dependidos da árvore: `nucleo-utilitario-e-erro` (2º,…
- **Detectado por**: curator
- **Origem**: [`gaps.md`](../gaps.md) achado **A-01** · [`questions.md`](../questions.md) Pergunta 21 · [`.reversa/state.json`](../../.reversa/state.json) `redator_progress.units`
- **Referência cruzada**: [`BR-HUMANA-004`](target_business_rules.md#br-humana-004) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: dependência de stakeholder — a cobertura deste catálogo está limitada por 15 módulos sem spec
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-004`, **não** aplicada)

### AMB-008
- **Descrição**: O protocolo de *loopback* está implementado 4 vezes, com a duplicação admitida em comentário em `class-wp-site-health.php`. É a integração mais crí…
- **Detectado por**: curator
- **Origem**: [`integrations/integrations.md`](../integrations/integrations.md) · [`architecture.md`](../architecture.md) §10 · [`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes*, linha **Strategist / implicação 6**
- **Referência cruzada**: [`BR-HUMANA-005`](target_business_rules.md#br-humana-005) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: dependência de stakeholder — regra citada como problema, com duplicação admitida em comentário
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-005`, **não** aplicada)

### AMB-009
- **Descrição**: Seis bibliotecas vendorizadas estão abandonadas e não são usadas por nada: Snoopy, Services_JSON, Jcrop, json2, SWFUpload e Prototype/script.aculo.…
- **Detectado por**: curator
- **Origem**: [`tech/technologies.json`](../tech/technologies.json) `declared_unused_ids` · [`questions.md`](../questions.md) Pergunta 7
- **Referência cruzada**: [`BR-HUMANA-006`](target_business_rules.md#br-humana-006) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: ⚠️ AMBÍGUA — o precedente da Pergunta 7, lido ao pé da letra, obriga a portar código abandonado que nada chama
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-006`, **não** aplicada)

### AMB-010
- **Descrição**: O destravamento da atualização automática depende de uma invariante não declarada entre dois arquivos
- **Detectado por**: curator
- **Origem**: [`state-machines.md`](../state-machines.md) §11 lacuna **S4** · [ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md)
- **Referência cruzada**: [`BR-HUMANA-007`](target_business_rules.md#br-humana-007) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: ⚠️ AMBÍGUA — a regra existe, a invariante que a sustenta não está declarada em lugar nenhum
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-007`, **não** aplicada)

### AMB-011
- **Descrição**: Rota REST sem `permission_callback` funciona
- **Detectado por**: curator
- **Origem**: [`permissions.md`](../permissions.md) §8 camada 2 · [`domain.md`](../domain.md) §2.9 regra **I7** · unit [`rest-api/despacho-de-requisicao-rest`](../rest-api/despacho-de-requisicao-rest/design.md)
- **Referência cruzada**: [`BR-HUMANA-008`](target_business_rules.md#br-humana-008) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: ⚠️ AMBÍGUA — camada de autorização que falha ABERTA, e nenhuma das 23 perguntas a cobriu
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-008`, **não** aplicada)

### AMB-012
- **Descrição**: `posts.post_password` é senha em texto claro, não *hash*, e a comparação é literal
- **Detectado por**: curator
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §9 item 1 · [`domain.md`](../domain.md) §2.5 regra **D6**
- **Referência cruzada**: [`BR-HUMANA-009`](target_business_rules.md#br-humana-009) em [`target_business_rules.md`](target_business_rules.md)
- **Tipo**: dependência de stakeholder — a fonte pede decisão explícita e nenhuma resposta a cobriu
- **Status**: PENDENTE
- **Decisão tomada**: — (recomendação do Curator registrada em `BR-HUMANA-009`, **não** aplicada)

### AMB-013
- **Descrição**: **A faixa 61645–61833 de `db_version` não tem rotina de dados**, e a hipótese de que a diferença seja puramente estrutural — resolvida por comparação de estrutura — **não foi confirmada**. `$wp_db_version` é 61833 e o último portão de `upgrade_all()` é 61644.
- **Detectado por**: curator
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §8.3 item 1 e §10 item 4 · cruzado com `BR-DESCARTAR-006`
- **Status**: REFERIDO À CODIFICAÇÃO
- **O que a codificação precisa fazer**: Comparar o DDL desta versão com o da anterior, ou ler o *changelog* da release. É verificação mecânica, não decisão: se houver transformação de dados naquela faixa, ela **não** é portão histórico e `BR-DESCARTAR-006` precisa ser estreitado.

### AMB-014
- **Descrição**: **Nenhum dos 985 testes de unidade exercita duas requisições concorrentes.** A Decisão 2 criou uma área de critério própria para o estado entre requisições concorrentes, e a implicação 2 do paradigma é a mais grave da travessia — mas o caso de teste que a detectaria não existe em nenhum dos 181 cards do backlog.
- **Detectado por**: curator
- **Origem**: [`backlog/tests.md`](../backlog/tests.md) · [`paradigm_decision.md`](paradigm_decision.md) implicação 2 · cruzado com `BR-DESCARTAR-008`
- **Status**: REFERIDO À CODIFICAÇÃO
- **O que a codificação precisa fazer**: É trabalho novo, não refinamento de card existente. O `paradigm_decision.md` já o endereça ao Inspector: *"inspeção de paridade que rode uma requisição por vez **não detecta** a implicação 2"*. Sem esse teste, o descarte do estado global (`BR-DESCARTAR-008`) é feito sem rede de segurança — e são 1.279 verificações de capacidade em 224 arquivos.

### AMB-015
- **Descrição**: **O tempo limite real do cliente de IA é 30 s, não 5 s**, e isso estreita a exceção que a Pergunta 18 autorizou. O construtor de prompt define 30 s por padrão; os 5 s do cliente HTTP só valem para quem chamar o adaptador **sem** opções de requisição.
- **Detectado por**: curator
- **Origem**: [`questions.options.json`](../questions.options.json) · [`questions.md`](../questions.md) Pergunta 18 · cruzado com `BR-DESCARTAR-004`
- **Status**: REFERIDO À CODIFICAÇÃO
- **O que a codificação precisa fazer**: Muda o **tamanho** do conserto, não a decisão: a exceção continua autorizada e continua incondicional. Mas chamá-la de "o único ponto em que a resposta humana manda corrigir" é verdade **para o núcleo** — contando o que está fora dele, são duas (P18 e P13). Vale saber qual escopo se está usando.

---

## Itens referidos à codificação

> Lista somente itens com status `REFERIDO À CODIFICAÇÃO`. Aparecem destacados em `handoff.md`.

- **AMB-013**: confirmar que a faixa 61645–61833 de `db_version` é só estrutural, antes de confiar no descarte dos 38 portões históricos
- **AMB-014**: escrever o caso de teste de concorrência que a Decisão 2 exige e que o backlog não tem
- **AMB-015**: conferir qual dos dois caminhos o porte exercita antes de dimensionar o conserto do tempo limite do adaptador de IA

---

## Notas

1. **Os 9 itens PENDENTES não são 9 problemas independentes.** Três grupos, com dependência entre
   eles:

   - **Stack alvo** — `AMB-004` (runtime, framework, infra e o brief inteiro), `AMB-005` (banco) e
     `AMB-006` (sentinela de data). O terceiro **depende** do segundo, e o segundo não deve ser
     decidido sem o primeiro: o framework decide retroativamente parte do paradigma.
   - **Escopo** — `AMB-007`, os 15 módulos sem spec. É o item que mais afeta a **confiança** deste
     catálogo, e já tem autorização dada na Pergunta 21 sem execução. (O outro item de escopo, o lado
     cliente do editor, foi **respondido durante esta etapa** e está em `AMB-003`.)
   - **Postura herdada** — `AMB-011` (rota REST que falha aberta), `AMB-012` (senha de conteúdo em
     texto claro), `AMB-010` (invariante não declarada do destravamento de atualização), `AMB-008`
     (as 4 implementações do *loopback*) e `AMB-009` (o precedente da Pergunta 7 aplicado a
     biblioteca abandonada). Todos têm recomendação do Curator, e nenhum foi aplicado.

2. **Nenhum item ⚠️ ou 🔴 entrou silenciosamente em MIGRAR ou DESCARTAR**, como a regra absoluta do
   SKILL exige. Os dois itens de confiança 🟡 que migram (`PERM-10` e `DB-DEAD`) migram pela política
   5, com aviso explícito de validação no agente de codificação, e não por omissão.

3. **Os três itens RESOLVIDOS acima só estão resolvidos em [`pending_decisions.md`](pending_decisions.md).**
   `AMB-001` já foi replicado para a § *Decisão do usuário* de
   [`paradigm_decision.md`](paradigm_decision.md) — fora do gerador, durante esta etapa, e deixando
   **quatro vestígios** da versão anterior no mesmo arquivo (o aviso do topo, a subseção de hipótese,
   três linhas da tabela de apetite e o item 7 das notas), todos nomeados no início de
   [`target_business_rules.md`](target_business_rules.md). `AMB-002` e `AMB-003` **não** foram
   replicados para lugar algum: quem ler só o artefato de leitura obrigatória continua achando que o
   critério de "idêntico" é lacuna aberta e que o escopo do lado cliente é dúvida. É exatamente o
   padrão de falha que o achado A-04 de [`gaps.md`](../gaps.md) descreve — *"a correção existe, está
   certa, e vive num artefato que quem lê o outro não abre"*. Por isso as três estão repetidas no
   início de [`target_business_rules.md`](target_business_rules.md), e não só aqui.

4. **O que o orquestrador precisa fazer com este arquivo.** Ele foi criado aqui e o SKILL do Curator
   só pode escrever em `_reversa_sdd/migration/`. Replicar `AMB-002` e `AMB-003` para as seções
   correspondentes de [`paradigm_decision.md`](paradigm_decision.md), e limpar os quatro vestígios de
   `AMB-001`, é trabalho do `/reversa-migrate` — não deste agente.
