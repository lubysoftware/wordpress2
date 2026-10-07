---
schemaVersion: 1
generatedAt: 2026-10-06T20:10:00-03:00
reversa:
  version: "1.0.0"
kind: cutover_plan
producedBy: strategist
hash: "sha256:7d0e4b08beac7c7941811394384ded5e267da56eca7bca168c3d95e4fb4502ac"
---

# Plano de Corte (*cutover*)

> Plano de corte do legado para o sistema novo, alinhado à estratégia escolhida em
> [`migration_strategy.md`](migration_strategy.md).

> Gerado pelo **Strategist** (Time de Migração) em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> Sistema analisado: **wordpress 7.1.2** · `kind: cutover_plan`

---

## 1. Estratégia base

- **Estratégia confirmada**: 🔴 **nenhuma** — a § *Decisão humana* de
  [`migration_strategy.md`](migration_strategy.md) § 6 está **em branco**.
- **Estratégia base deste plano**: **A — Strangler Fig por superfície HTTP com banco compartilhado**, com
  **Parallel Run obrigatório**, conforme a **recomendação** do Strategist
  ([`migration_strategy.md`](migration_strategy.md) § 4.2). O SKILL manda construir o plano para a
  recomendada; **a estratégia que o usuário escolher substitui esta base**, se for diferente.
- **Se a escolha for B (Parallel Run isolado)**: as viradas da § 4 desaparecem e sobra apenas o corte único
  da § 4.2 — o plano encurta e o risco se concentra num dia.
- **Se a escolha for C (Big Bang)**: este plano é **descartado**, não adaptado. Big Bang não tem *rollback*
  neste projeto: não há estado anterior ao qual voltar, só um lançamento a adiar.
- **Se `BR-HUMANA-003` vier como (a)**: este plano precisa ser **reescrito**, não ajustado — sem esquema
  comum não há banco compartilhado, as viradas incrementais deixam de existir e reaparece ETL com janela
  por instalação (RISK-004).

### 1.1 "Cutover" tem dois significados neste projeto, e confundi-los é o erro mais caro disponível

[`questions.md`](../questions.md) **P19** declara: *"Não há log retido nem instalação em operação: **o alvo
é o CMS, não um site**"*. Logo:

| | O que é | Quando | Este documento |
|---|---|---|---|
| **Corte deste projeto** | as **12 viradas de superfície** no ambiente de referência, terminando no **lançamento da versão 1** do clone | ao longo do projeto, uma fatia por vez | §§ 2 a 7 — **é o plano real** |
| **Corte de uma instalação adotante** | uma pessoa que já usa WordPress migra a **sua** instalação para o clone | depois da versão 1, fora deste projeto | § 8 — **parametrizado**, porque depende de volumetria desconhecida (A-7) e de um brief que não existe |

> **Não há indisponibilidade a negociar no corte deste projeto**, porque não há disponibilidade a
> interromper: o ambiente afetado é o de **referência**, que não tem usuário real. Essa é a razão pela qual
> as durações abaixo são de **operação**, nunca de negociação com área de negócio.

---

## 2. Pré-requisitos

### 2.1 Globais — uma vez, antes da primeira virada

Cada um existe porque um risco o exige. Nenhum é opcional: são as condições sem as quais a coexistência
não é verificável.

- [ ] **Instalação de referência no ar, na mesma versão `7.1.2`**, servindo todas as superfícies — é o
      oráculo que a **P16** mandou levantar e que `ESC-ORACULO` gravou como regra (`BR-MIGRAR-116`).
- [ ] **Receita reproduzível do ambiente de referência**: versão de PHP, de MySQL, `wp-config.php` com os
      valores declarados, sais fixos. Sem container, por decisão adiada de propósito (RISK-022).
- [ ] **Lista de extensões congelada e declarada** na referência — idealmente nenhuma além das empacotadas,
      com o Akismet desativado, já que está fora de escopo por `BR-DESCARTAR-001/002/003` (RISK-008).
- [ ] **Cache de objeto persistente desligado nas duas metades** (RISK-009).
- [ ] **Dono único do esquema declarado**: a referência. A metade nova roda com a comparação de estrutura
      **desligada** e falha ruidosamente se detectar divergência, em vez de corrigi-la (RISK-007).
- [ ] ***Snapshot* do banco de referência, com restauração testada** — o oráculo não pode ser corrompido
      (RISK-007).
- [ ] **Codec de `serialize()`/`unserialize()` do PHP, byte a byte**, com teste de ida e volta sobre amostra
      do oráculo: inteiro contra string numérica, `float`, booleano, `null`, aninhamento e referência
      (RISK-005).
- [ ] **Compatibilidade de cookie, *nonce* e sessão**: mesmos sais, mesmo armazenamento de token, e o
      fragmento de 4 caracteres do hash da senha na chave do HMAC (RISK-006).
- [ ] **`EXT-CONTEXTO` implementado**: contexto por requisição explícito, **antes** de qualquer módulo de
      domínio. É pré-requisito, não refinamento (RISK-011).
- [ ] **Barramento de hooks** síncrono, reentrante, ordenado por prioridade inteira e **com retorno de
      valor**; e a **ordem de arranque** como contrato público (`EXT-FILTROS`, `EXT-ORDEM`).
- [ ] **Arnês de Parallel Run** instrumentado nos dois lados — requisição, resposta, consulta SQL e valor
      devolvido por hook — reportando **por área da Decisão 2**, com as cinco linhas (RISK-010, RISK-023).
- [ ] **Corpus de entrada** derivado dos 804 critérios de aceite e dos 289 passos de fluxo principal dos 47
      casos de uso, com dono e estimativa próprios (RISK-002).
- [ ] **Teste de concorrência**, que não existe em nenhum dos 181 cards: duas requisições simultâneas com
      identidades diferentes atravessando os mesmos 1.279 pontos de `current_user_can` (RISK-011).
- [ ] ***Pipeline*** com a regra de dependência **começando vermelha** nas 175 violações de camada
      conhecidas, com lista de exceções datada (RISK-024).
- [ ] ***Proxy*** reverso no lugar, com as 12 superfícies de entrada mapeadas e **todas** apontando para a
      referência.

### 2.2 Decisões que travam a primeira virada 🔴

- [ ] **`BR-HUMANA-003`** — sentinela de data. **A estratégia pressupõe (c)**. Resposta (a) exige reescrever
      este plano (RISK-004).
- [ ] **`BR-HUMANA-004`** — os 15 módulos sem spec, 5 deles no núcleo de 12. A P21 **já autorizou** e não
      foi executada (RISK-003).
- [ ] **`BR-HUMANA-001`** — *framework*. Decide retroativamente parte do paradigma, e o Curator **não**
      recomenda adiar.

### 2.3 Por virada — repetido em cada uma das 12

- [ ] Paridade da superfície **verde pelo critério da sua área** (Decisão 2), sobre o corpus, por **7 dias
      corridos** sem divergência nova.
- [ ] Regra de *proxy* da virada **escrita e testada em ensaio**, com a regra de volta pronta.
- [ ] *Snapshot* do banco tomado **imediatamente antes**.
- [ ] A decisão humana que trava aquela fatia, se houver, **respondida**.

> **Por que 7 dias e não "tantos por cento":** o catálogo sugere *"paridade comportamental ≥ X% por N
> dias"*. Percentual de paridade **não** é mensurável aqui: não há fluxo de produção, logo a cobertura é
> exatamente o corpus que alguém escreveu, e um percentual sobre corpus próprio mede o corpus, não o
> sistema (RISK-002). O que é mensurável é **divergência nova em janela de tempo** sobre corpus fechado e
> declarado. 🟡 **Os 7 dias são escolha deste agente, não medida** — não há dado de operação nesta árvore
> que permita derivar o número, e isso fica declarado em vez de disfarçado de cálculo.

---

## 3. Janela de cutover

| | Virada de superfície (×12) | Corte final — lançamento da versão 1 |
|---|---|---|
| **Data alvo** | 🔴 **sem data** — o brief não tem prazo | 🔴 **sem data** — mesmo motivo |
| **Duração estimada** | **≤ 1 hora** de operação por virada | **≤ 4 horas** de operação |
| **Ambiente afetado** | **referência** (não há produção) | **referência** + publicação do artefato |
| **Comunicação prévia** | time do porte; não há área de negócio a avisar, porque não há usuário | `PATROC` (🔴 não nomeado), `JUR` (parecer de RISK-028 **antes** de qualquer distribuição) |
| **Indisponibilidade** | **nenhuma** — o *proxy* alterna destino; a metade antiga continua servindo o que não foi virado | **nenhuma** |

> ⚠️ **A duração curta não mede o esforço.** Uma hora é o tempo de **operação** de uma virada. O tempo de
> **construção** da fatia que a antecede é outra coisa, e para a primeira ele é longo e não negociável: **68
> dos 71 módulos** estão atrás de qualquer superfície ([`migration_strategy.md`](migration_strategy.md)
> § *O chão desta etapa*, item 3). As duas grandezas aparecem separadas de propósito.

---

## 4. Passos do cutover

### 4.1 Procedimento padrão de uma virada de superfície — repetido 12 vezes

| # | Passo | Owner | Duração | Reversível? |
|---|---|---|---|---|
| 1 | Conferir os pré-requisitos da § 2.3 e a trava de decisão da fatia | `TL-PORTE` | 15 min | — (não altera nada) |
| 2 | Publicar o relatório de paridade da superfície, **com as cinco linhas por área** da Decisão 2 | `QA-PARIDADE` | 15 min | — |
| 3 | Tomar *snapshot* do banco de referência e **conferir a restauração** | `DONO-DADOS` | 20 min | — |
| 4 | Ensaiar a regra de *proxy* contra a metade nova **sem** tráfego real, e ensaiar a regra de volta | `SRE-IMPL` | 20 min | **sim** |
| 5 | Decidir *go* / *no-go* pelos critérios da § 6 | `TL-PORTE` + `QA-PARIDADE` | 10 min | — |
| 6 | **Virar a superfície no *proxy*** | `SRE-IMPL` | **≤ 2 min** | **sim** — uma regra de *proxy* |
| 7 | *Smoke test* da superfície virada contra o oráculo, mesmo corpus | `QA-PARIDADE` | 20 min | **sim** |
| 8 | *Smoke test* das superfícies **ainda não viradas**, para provar que a coexistência não as quebrou | `QA-PARIDADE` | 20 min | **sim** |
| 9 | **Caso de sessão atravessando a fronteira**: entrar numa metade, navegar para a outra, validar formulário aberto antes da virada | `ARQ-CONTEXTO` | 10 min | **sim** |
| 10 | **Caso de concorrência**: duas requisições simultâneas com identidades diferentes na superfície virada | `ARQ-CONTEXTO` | 10 min | **sim** |
| 11 | Conferir que **nenhum `ALTER TABLE`** saiu da metade nova desde o *snapshot* | `DONO-DADOS` | 10 min | **sim** |
| 12 | Publicar a contagem de **violações de camada** e a cobertura de paridade, lado a lado | `DONO-NUCLEO` | 10 min | — |
| 13 | Declarar a virada concluída e a superfície sob observação estendida (§ 7) | `TL-PORTE` | 5 min | — |

**Dois passos fora do padrão, por mandato do paradigma:**

| Fatia | Passo adicional | Owner | Duração | Por quê |
|---|---|---|---|---|
| **5** — agendador e *loopback* | Verificar que **o disparo FALHA**, e não que ele é rápido: a lixeira do ambiente de referência **não** esvazia sem visita autenticada ao painel | `TL-PORTE` | 1 dia de observação | implicação 6 do paradigma; `R5` e ADR-0006. Latência **não** é critério |
| **5** — agendador e *loopback* | Conferir a equivalência das **4 implementações independentes** do protocolo de *loopback* contra o oráculo **antes** de unificar | `TL-PORTE` | — | `BR-HUMANA-005`: a duplicação está admitida em comentário em `wp-admin/includes/class-wp-site-health.php:3622`, e a falha é silenciosa por projeto |
| **8** — privacidade | Manter o Parallel Run **permanente**, não temporário, nos 7 domínios regulados | `SEC-DPO` | contínuo | caso de borda regulatório do SKILL: domínio regulado exige prova de equivalência por período longo |

### 4.2 Corte final — lançamento da versão 1

| # | Passo | Owner | Duração | Reversível? |
|---|---|---|---|---|
| 1 | Todas as 12 superfícies viradas e sob observação estendida há ≥ 30 dias sem divergência nova | `TL-PORTE` | — | — |
| 2 | Relatório de paridade final, **por área**, com cobertura de corpus declarada | `QA-PARIDADE` | 1 dia | — |
| 3 | **Parecer jurídico** de licença da obra derivada, licenças dos pacotes adotados e uso de marca | `JUR` | — | — (bloqueante, RISK-028) |
| 4 | Publicar o **registro de dívida herdada declarada**, item por item, junto do produto | `SEC-DPO` | 1 dia | — |
| 5 | Publicar a receita de implantação, com **limite de taxa como decisão de implantação** fora do núcleo | `SRE-IMPL` | 1 dia | — |
| 6 | Congelar a versão do lado cliente do editor e registrar o contrato servidor da **mesma** versão | `PO-PORTE` | 2 h | **sim** |
| 7 | Publicar o artefato da versão 1 | `PO-PORTE` | 2 h | **não** — publicação é irreversível na prática |
| 8 | Manter a instalação de referência **no ar como oráculo**, sem servir tráfego | `SRE-IMPL` | — | — |

> **O passo 8 não é zelo: é a única fonte de verdade de comportamento que este projeto tem.** A referência
> **não** é descomissionada no corte. Ela deixa de servir e continua existindo, porque toda correção
> posterior precisa comparar contra ela — e **0 arquivos de log** nesta árvore significam que não há
> substituto (RISK-023).

---

## 5. Plano de rollback

### 5.1 De uma virada de superfície

- **Critérios de acionamento** — qualquer um, sem discussão:
  - divergência de paridade na superfície virada, pelo critério da sua área;
  - sessão perdida ao atravessar a fronteira do *proxy* (RISK-006);
  - **qualquer** indício de identidade trocada entre requisições (RISK-011) — este não tem tolerância;
  - `ALTER TABLE` originado da metade nova (RISK-007);
  - superfície **ainda não virada** que parou de funcionar;
  - divergência que não se reproduz na segunda execução, até a causa ser achada (RISK-009).
- **Passos**:
  1. Aplicar a regra de volta no *proxy* — a superfície retorna à metade de referência.
  2. Confirmar por *smoke test* que a superfície voltou ao comportamento do oráculo.
  3. Comparar o banco contra o *snapshot* do passo 3 da § 4.1 e **registrar toda escrita** feita pela
     metade nova durante a janela.
  4. Restaurar o *snapshot* **somente** se houver escrita divergente — e nesse caso tratar como incidente,
     porque o oráculo foi tocado.
  5. Reabrir a fatia com a divergência como caso de teste do corpus.
- **Tempo máximo aceitável até rollback**: **15 minutos** da detecção. O passo 6 da § 4.1 dura ≤ 2 min, e
  a volta é a mesma operação na direção contrária.
- **Owner do rollback**: `SRE-IMPL`, com autoridade para acionar **sem** aprovação — o custo de uma volta
  indevida é uma regra de *proxy*; o de uma volta tardia, com banco compartilhado, é escrita divergente
  persistida.

### 5.2 Do corte final

- **Critérios de acionamento**: divergência em contrato de terceiro (byte a byte) descoberta depois da
  publicação, ou parecer jurídico desfavorável posterior.
- **Passos**: despublicar o artefato, reapontar o *proxy* da referência para ela mesma em todas as
  superfícies, publicar a divergência.
- **Tempo máximo aceitável até rollback**: **24 horas** — não há usuário em produção, logo a pressa é de
  reputação, não de operação.
- **Owner do rollback**: `PO-PORTE`.

> ⚠️ **O que não tem *rollback*:** a publicação da versão 1 (passo 7 da § 4.2) é irreversível na prática —
> um artefato publicado pode ser baixado por qualquer um antes de ser despublicado. É por isso que o
> parecer jurídico é **bloqueante** e vem antes.

---

## 6. Critérios de go / no-go

### 6.1 *Go* — todos, não alguns

- Paridade da superfície **verde pelo critério da sua área** da Decisão 2, sobre o corpus declarado, por
  **7 dias corridos** sem divergência nova:
  - **contrato de terceiro** (REST, XML-RPC, feeds, *sitemaps*, oEmbed) → **saída byte a byte**;
  - **valor devolvido por hook** → **byte a byte no valor**;
  - **esquema e escrita no banco** → **efeito no banco**, incluindo a cascata de 7 etapas e os órfãos que o
    legado deixa de propósito;
  - **HTML de tema e painel** → **comportamento de caso de uso**;
  - **estado entre requisições concorrentes** → **teste próprio**, verde.
- Regra de *proxy* da virada **e a de volta** ensaiadas.
- *Snapshot* do banco tomado e restauração conferida.
- A decisão humana que trava a fatia, **respondida**.
- Nenhum risco **Crítico** do [`risk_register.md`](risk_register.md) com *trigger* ativo naquela
  superfície.
- Contagem de violações de camada publicada, **não maior** que na virada anterior (RISK-027).

### 6.2 *No-go* — qualquer um basta

- **Teste de concorrência inexistente ou vermelho** numa superfície autenticada. **Sem exceção**: é o
  único risco do registro cujo campo *trigger* diz que **não há sinal natural** — nenhum dos 985 testes
  exercita concorrência (RISK-011).
- Codec de `serialize()` sem teste de ida e volta verde (RISK-005).
- Cookie, *nonce* ou sessão incompatíveis entre as metades (RISK-006).
- Cache de objeto persistente ligado em qualquer das duas metades (RISK-009).
- Extensão ativa na referência fora da lista congelada (RISK-008).
- Relatório de paridade com **número único**, sem quebra por área — é o sintoma de falso verde (RISK-010).
- Divergência intermitente sem causa identificada.
- `BR-HUMANA-003` respondida como **(a)**: não é *no-go* de virada, é **reescrita deste plano** (RISK-004).
- Fatia 1 começando com `redator_progress.units` ainda em 74 unidades, ou seja, com 5 dos 12 módulos de
  núcleo sem spec (RISK-003).
- Para a fatia 5: critério de aceite escrito em **latência** em vez de em **falha do disparo** (RISK-015).
- Para o corte final: parecer jurídico ausente ou desfavorável (RISK-028).

---

## 7. Pós-cutover

### 7.1 Por virada

- [ ] **Observação estendida por 30 dias** da superfície virada, com o corpus rodando diariamente contra o
      oráculo.
- [ ] Validação de paridade conforme o `parity_specs.md` — 🔴 **ainda não existe**: é artefato do
      **Inspector**, que não rodou. Até existir, o critério que vale é o da § 6.1, derivado da Decisão 2 e
      gravado em `BR-MIGRAR-116`.
- [ ] Contagem de violações de camada e cobertura de paridade publicadas lado a lado (RISK-027).
- [ ] Toda divergência achada na observação entra no corpus como caso permanente — o corpus só cresce.

### 7.2 Depois do corte final

- [ ] **Decommission do legado**: 🔴 **não se aplica, e é achado.** O legado não está em *decommission* —
      é o WordPress *upstream*, que **segue lançando versão** (RISK-021). A instalação de referência
      **permanece no ar como oráculo**, sem servir tráfego, e não há data de desligamento.
- [ ] Parallel Run **permanente** nos 7 domínios regulados de privacidade (`D1`–`D6`, `R7`, `R8`) — caso de
      borda regulatório.
- [ ] Reinício programado e verificação de saúde como requisito de implantação, porque o alvo perdeu o
      reinício por requisição como válvula (RISK-012).
- [ ] Registro de dívida herdada declarada entregue com o produto, e **revisado** a cada versão (RISK-029).
- [ ] Cadência de acompanhamento do *upstream* decidida como **produto**, não como manutenção (RISK-021).

---

## 8. Anexo — cutover de uma instalação adotante

> Este anexo é **parametrizado de propósito**. Não há instalação em operação neste projeto (P19), não há
> volumetria (A-7), não há brief. Preencher com número inventado seria pior que entregar o esqueleto.

| Campo | Valor | O que falta para fechar |
|---|---|---|
| **Migração de dados** | 🟢 **nenhuma**, se `BR-HUMANA-003` for **(c)**: mesmo esquema, revisão `61833`, zero chaves estrangeiras | a resposta de `BR-HUMANA-003`. Se for **(a)**, há ETL e este anexo vira um plano próprio |
| **Janela** | `<horas>` | `SELECT COUNT(*)` por tabela e tamanho de `uploads/` (A-7) |
| **Modo** | virada por superfície, com *proxy*, igual à § 4.1 — **ou** corte único, se a instalação não puder manter duas metades | decisão de quem adota |
| **Extensões ativas** | 🔴 **o bloqueio real deste anexo** | plugin PHP **não roda** na metade nova (RISK-008). Uma instalação com extensões ativas não pode ser estrangulada: precisa de equivalente em TypeScript para cada uma, ou de corte único com perda declarada |
| **Multisite** | 🔴 indefinido | o valor de `MULTISITE` (A-3) |
| **Valores de constante e opção** | 🔴 indefinidos | o `wp-config.php` e um `SELECT option_name, option_value FROM wp_options` (A-2) |
| **Sais e sessões** | transportar as chaves e os sais, **ou** aceitar que todo cookie e todo *nonce* existente deixa de valer na virada | `TM-04` da unit de autenticação |
| **Hashes de senha** | migrar **como estão** — não é possível rehashear sem a senha em claro | `TM-01`; e `TM-02` para decidir entre migração no login e redefinição obrigatória |
| **Prazos de retenção** | 🟡 o núcleo não declara nenhum, e portá-lo idêntico é **não inventar um** | a implantação assume a obrigação de LGPD/GDPR, com rotina de descarte **configurável** (P20) |

> **O achado deste anexo:** a estratégia recomendada funciona para **este projeto** porque a instalação de
> referência roda com extensões congeladas. Para uma instalação real, **a lista de extensões ativas é o que
> decide** se o estrangulamento é possível — e é exatamente o dado que A-8 registra como desconhecido. Quem
> planejar adoção começa por aí, não pela volumetria.

---

## 9. Notas

1. **Nenhuma data neste plano, e isso é declarado e não esquecido.** O brief não existe
   ([`migration_strategy.md`](migration_strategy.md) § *O chão desta etapa*, item 1): prazo, orçamento e
   *stakeholders* estão em branco. As durações são de **operação** — minutos e horas de quem executa uma
   virada — e nunca de construção. A nota de sensibilidade ao prazo está em
   [`migration_strategy.md`](migration_strategy.md) § 4.5.

2. **Um número deste plano é escolha e não medida.** Os **7 dias** de paridade sem divergência nova (§ 2.3,
   § 6.1) são 🟡 escolha deste agente. Não há dado de operação nesta árvore que permita derivá-lo: **0
   arquivos de log**, nenhuma instalação em operação. O percentual de paridade que o catálogo sugere foi
   **recusado** de propósito, porque mediria o corpus e não o sistema.

3. **O *rollback* é a parte mais forte deste plano, e é de graça.** Uma virada volta com uma regra de
   *proxy*, em menos de 2 minutos, e o `SRE-IMPL` tem autoridade para acioná-la sem aprovação. É a razão
   principal pela qual a estratégia A foi recomendada sobre C: Big Bang, neste projeto, **não tem rollback
   algum** — não há estado anterior ao qual voltar.

4. **O que este plano não resolve, e não finge resolver.** A primeira virada tem **68 dos 71 módulos** atrás
   dela. O plano torna o **corte** incremental e reversível; ele **não** torna a construção incremental,
   porque o grafo medido não permite — e isso está demonstrado, não assumido
   (`.reversa/work/reversa-strategist/scc.py` e `fatias.py`).

5. **Nada fora de `_reversa_sdd/migration/` foi modificado.** Os três arquivos desta etapa são
   [`migration_strategy.md`](migration_strategy.md), [`risk_register.md`](risk_register.md) e este plano.
