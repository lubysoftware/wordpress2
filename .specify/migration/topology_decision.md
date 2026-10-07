---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: topology_decision
producedBy: designer
hash: "sha256:ba79198fa7f97762693233d5f8afd2416fe947e1f0645db92c77e7958c53714a"
---

# Topology Decision

> Decisão consciente sobre como organizar o sistema novo: preservar a topologia do legado, adotar uma
> topologia moderna ou aplicar um híbrido.
> Este artefato é leitura obrigatória do próprio Designer (para decompor bounded contexts) e do agente de
> codificação (para criar a árvore de pastas).

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Evidência direta, com artefato ou `arquivo:linha` citado |
| 🟡 INFERIDO | Padrão observado, sem afirmação explícita na fonte |
| 🔴 LACUNA | Não dedutível com o que existe |
| ⚠️ AMBÍGUO | As evidências apontam para mais de uma leitura |

**O que não é o sistema analisado:** `.claude/`, `.reversa/`, `_reversa_sdd/`, `_reversa_docs/` e
`_reversa_refactor/` são o ferramental deste processo e **não** entraram em contagem alguma deste
documento. Toda contagem de arquivo abaixo foi medida por
[`.reversa/work/reversa-designer/topologia.py`](../../.reversa/work/reversa-designer/topologia.py), que
exclui essas pastas explicitamente.

---

## O chão desta etapa, antes da topologia

Três coisas precisam ficar ditas antes de qualquer proposta, porque mudam como este documento deve ser
lido. Nenhuma foi contornada por invenção.

### 1. 🔴 O pré-requisito do SKILL continua não cumprido — terceira etapa seguida

`_reversa_sdd/migration/migration_brief.md` **não existe**. Objetivo formal, métricas de sucesso, prazo,
orçamento, *stakeholders* e escopo declarado da migração não foram lidos de lugar nenhum. É a mesma
lacuna que o Paradigm Advisor registrou ([`paradigm_decision.md`](paradigm_decision.md) § *Notas* item 1),
que o Curator gravou como `BR-HUMANA-001` / [`AMB-004`](ambiguity_log.md) e que o Strategist repetiu em
`prerequisite_missing`.

**O que foi usado em vez de inventar:** a *stack* alvo decidida em
[`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*, o paradigma decidido na § *Decisão 1* e as
23 respostas de [`questions.md`](../questions.md). **Tamanho de time e prazo continuam desconhecidos** — e
os dois são entrada legítima de uma decisão de topologia, o que está declarado na § *Custo / risco*.

### 2. 🔴 A estratégia de migração não foi confirmada — e o SKILL manda encerrar

[`migration_strategy.md`](migration_strategy.md) § 6 está **em branco**:
`checkpoints.strategist.human_decision_status` é `PENDENTE`. A § *Pré-requisitos* do SKILL desta etapa diz:
*"Se a estratégia ainda não foi confirmada pelo usuário, encerre e instrua a aprovar antes de continuar."*

A instrução de execução desta etapa manda o contrário — *"do início ao fim, sem pular etapas"*,
*"trabalhe sem pedir confirmação"*, *"se faltar informação, registre a dúvida no artefato apropriado e
siga"*. **Seguiu-se a instrução de execução**, pelo mesmo critério que Curator e Strategist já aplicaram
neste pacote: os dois rodaram inteiros com o `migration_brief.md` ausente, registrando a lacuna em vez de
parar. A premissa fica declarada, não silenciosa:

> 📌 **PREMISSA DECLARADA.** Este desenho pressupõe a estratégia **A — Strangler Fig por superfície HTTP
> com banco compartilhado, com Parallel Run obrigatório**, que é a recomendação de
> [`migration_strategy.md`](migration_strategy.md) § 4.2. O que muda se a escolha for outra está na
> § *Sensibilidade à estratégia não confirmada*.

### 3. ⚠️ A decisão desta etapa também não pode ser coletada, e por quê

`state.json.answer_mode` é `file`: esta execução não tem conversa. O passo 5 do SKILL manda perguntar
*"qual opção você escolhe?"* e **nunca decidir em silêncio**. A pergunta está feita na
§ *Decisão do usuário*, com campo de resposta. Até ela ser respondida, a opção recomendada é **premissa
de trabalho com proveniência declarada**, e cada um dos quatro artefatos da Fase 2 abre com o aviso e com
a lista do que muda em cada opção. É assim que a Regra absoluta *"nunca aplicar topologia moderna em
silêncio"* é cumprida sem travar o pipeline.

---

## Topologia do legado detectada

- **Padrão organizacional**: **híbrido — *package-by-layer* no primeiro nível, *package-by-mechanism* e
  biblioteca vendorizada dentro de `wp-includes/`, e nenhuma pasta de domínio em lugar nenhum. O domínio
  mora em arquivo plano nomeado por entidade.**
- **Confiança**: 🟢 CONFIRMADO (medido nesta etapa e concordante com os três artefatos de entrada)

- **Evidências**:
  - **Primeiro nível é camada, não domínio** 🟢: `wp-includes/` 1.014 arquivos PHP, `wp-admin/` 242,
    `wp-content/` 197 e 14 na raiz do repositório — total **1.467**, que é exatamente a contagem de
    [`refactor/architectures.md`](../refactor/architectures.md) §2 e do
    [grafo medido](../architecture/architecture-graph.md). `wp-admin/` é a camada *painel*,
    `wp-content/` é a camada *extensão*, `wp-includes/` é *tudo o mais*.
  - **O achado que nenhum artefato anterior registrou: `wp-includes/` tem 28 subpastas e nenhuma delas é
    domínio de negócio** 🟢. Oito são biblioteca vendorizada (`php-ai-client`, `sodium_compat`,
    `SimplePie`, `Requests`, `ID3`, `IXR`, `Text`, `PHPMailer`) e somam **438 arquivos**; vinte são
    mecanismo ou API do próprio núcleo (`blocks`, `rest-api`, `customize`, `block-supports`, `html-api`,
    `sitemaps`, `style-engine`, `pomo`, `l10n`…) e somam **319**. **O domínio inteiro está nos 257
    arquivos planos da raiz de `wp-includes/`**: `post.php`, `comment.php`, `user.php`, `taxonomy.php`,
    `option.php`, `capabilities.php`, `media.php` — conferidos presentes um a um.
  - **O painel também é camada e não feature** 🟢: `wp-admin/` tem **95 telas planas** lado a lado, mais
    106 arquivos em `includes/`, 30 em `network/`, 10 em `user/` e 1 em `maint/`. As telas de conteúdo,
    de comentário, de usuário e de rede estão na mesma pasta, sem agrupamento.
  - **E a camada não é fronteira, é convenção de caminho** 🟢: *"não há camadas com interface, há ordem de
    carregamento — e ela é contrato público"* — [`architecture.md`](../architecture.md) §2.2 e §4.1 D1.
    Nada impede `wp-includes/` de chamar `wp-admin/`, e o grafo medido mostra que isso acontece: de
    `hooks-e-plugin-api`, `capacidades-e-papeis` e `telas-do-painel` — três dos doze módulos de maior
    peso de entrada — o `path` registrado está sob `wp-admin/includes/`.
  - **A pasta não é o módulo** 🟢: o grafo medido tem **71 módulos** contra 28 + 4 pastas, e
    [`architecture/architecture-graph.md`](../architecture/architecture-graph.md) registra que **61 das
    321 arestas declaradas pelo Arqueólogo não existem no código e 431 medidas estavam ausentes**, com a
    causa nomeada: 4 arquivos ubíquos tinham sido listados como `primary_file` de módulo de domínio.
    Quem derivar fronteira da árvore de pastas erra por essa margem.
  - **E o caminho de arquivo é API observável — o que impede tratar topologia como assunto puramente
    interno** 🟢: quatro componentes do núcleo são substituídos **pela simples presença de um arquivo num
    caminho**: `wp-content/advanced-cache.php` (`wp-settings.php:98`, `:100`),
    `wp-content/db.php` (`wp-includes/load.php:711`, `:712`) e `wp-content/object-cache.php`
    (`wp-includes/load.php:825`). [`questions.md`](../questions.md) P3 responde que esse ponto de
    extensão **é o produto**.

- **Mapa da árvore legada** (resumido, com as contagens medidas):

  ```
  ./                                   14 PHP planos — front controllers e arranque
  ├── wp-admin/                       242 PHP — a CAMADA painel
  │   ├── *.php                        95   uma tela por arquivo, todas lado a lado
  │   ├── includes/                   106   regra de negócio do painel
  │   ├── network/                     30
  │   ├── user/                        10
  │   └── maint/                        1
  ├── wp-includes/                  1.014 PHP — "tudo o mais"
  │   ├── *.php                       257   O DOMÍNIO INTEIRO, em arquivo plano:
  │   │                                     post.php · comment.php · user.php
  │   │                                     taxonomy.php · option.php · capabilities.php
  │   ├── 8 pastas de vendor          438   php-ai-client · sodium_compat · SimplePie
  │   │                                     Requests · ID3 · IXR · Text · PHPMailer
  │   └── 20 pastas de mecanismo      319   blocks · rest-api · customize · html-api
  │                                         block-supports · sitemaps · style-engine …
  └── wp-content/                     197 PHP — ponto de extensão E API por caminho
      ├── plugins/ · themes/                (Akismet, Hello Dolly, 3 temas)
      └── object-cache.php · db.php …       substitui componente do núcleo por presença
  ```

---

## Diagnóstico estrutural

- **Acoplamento**: **alto** 🟢. **68 dos 71 módulos num único componente fortemente conexo (95,8%)**, com
  **254 ciclos de dois módulos**, 1.249 pares de módulo distintos e peso somado de chamada 44.008 —
  reproduzido nesta etapa em
  [`medir.py`](../../.reversa/work/reversa-designer/medir.py). A aresta mais pesada da árvore é
  `l10n-e-traducoes`, com **13.335 pontos de entrada vindos de 68 dos 71 módulos**.
- **Coesão por módulo**: **baixa nos pesados, média nos periféricos** 🟢. `l10n-e-traducoes` e
  `formatacao-e-escape` são chamados por 68 e 65 dos 71 módulos: não são módulos, são capacidade
  ambiente. E a melhor fronteira de domínio que existe neste pacote — os 15 épicos do backlog, revisados
  por humano — deixa **87,1% dos pares e 92,5% do peso atravessando a si mesma**
  ([`refactor/architectures.md`](../refactor/architectures.md) §2.1).
- **Módulos órfãos / mortos**:
  - `links-e-bookmarks` — legado da versão 3.5; [`erd-complete.md`](../erd-complete.md) §8 registra
    *"nenhum módulo ativo"* como dono da tabela `links` 🟢
  - `deprecated-e-compatibilidade` — 10.160 linhas que existem para não quebrar quem chama 🟢
  - seis bibliotecas vendorizadas **que nada chama**: Snoopy, Services_JSON, Jcrop, json2, SWFUpload,
    Prototype/script.aculo.us ([`AMB-009`](ambiguity_log.md) / `BR-HUMANA-006`) 🟢
  - ator morto: `provedor-de-ia`, declarado em `wp-includes/connectors.php:290` e sem caso de uso algum,
    porque os *plugins* de provedor não existem nesta árvore 🟢
  - ⚠️ **os 3 módulos de `fan_in` zero NÃO são órfãos**: `blocos-do-nucleo`, `plugins-empacotados` e
    `temas-empacotados` são as pontas de consumo, e dependem transitivamente de 68 módulos
- **Camadas redundantes**:
  - **quatro superfícies de escrita paralelas**, cada uma autorizando de um jeito diferente: telas do
    painel (228 `check_admin_referer`/`check_ajax_referer`), REST (155 `permission_callback`), XML-RPC
    (66 `$this->login()`) e `admin-ajax` (108 ações) — e **nenhum** dos 95 arquivos de entrada de
    `wp-admin/` consome a API REST internamente
    ([`refactor/architectures.md`](../refactor/architectures.md) §7) 🟢
  - **o protocolo de *loopback* implementado 4 vezes**, com a duplicação admitida em comentário em
    `wp-admin/includes/class-wp-site-health.php:3622` ([`AMB-008`](ambiguity_log.md)) 🟢
  - **duas variantes de DDL para a mesma tabela `users`**, escolhidas por `$is_multisite`
    (`wp-admin/includes/schema.php:192` e `:210`) 🟢
- **Violações de fronteira**: **175 arestas núcleo → domínio** no corte de 12 módulos — medido nesta etapa
  em [`decompor.py`](../../.reversa/work/reversa-designer/decompor.py), **reproduzindo a §2.1 na casa
  decimal** (8,4% de peso par-a-par e 35,1% dos pares). E a fronteira de primeiro nível do legado é
  atravessada pela própria fronteira de módulo: 3 dos 12 módulos de núcleo têm `primary_file` sob
  `wp-admin/`.
- **Mistura de paradigmas / estilos**: **cinco estilos convivendo** 🟢, conforme a tabela de variações de
  [`paradigm_decision.md`](paradigm_decision.md) § *Paradigma do legado detectado*: procedural puro no
  arranque (A), *event-driven* síncrono no barramento (B), OO clássico nas superfícies (C), *dataflow*
  declarativo em `theme.json`/`block.json` (D) e pseudo-assíncrono no agendamento (E) — mais o lado
  cliente, 🔴 fora desta árvore (F).
- **Avaliação geral**: **problemática** — com uma qualificação que muda a conversa e que precisa estar
  junto do veredito:

  > A estrutura é problemática **como estrutura a manter** e **não** é o problema **como produto a
  > clonar**. É por isso que `manter-e-endurecer` tirou `fit` **86** em
  > [`refactor/architectures.md`](../refactor/architectures.md) §3, contra 77 do monólito modular e 56 do
  > hexagonal: as 23 respostas decidiram *comportamento idêntico*, e nesse enquadramento o déficit real é
  > de qualidade interna — **0 arquivos de teste em 3.378**, 205 marcadores TODO/FIXME em 96 arquivos,
  > 949 chamadas `$wpdb->` diretas, 1.121 declarações `global $`. Diagnóstico estrutural severo **não é**
  > licença para redesenho: é o preço de cada mudança futura, e quem decide se vale pagá-lo é o usuário,
  > na § *Decisão do usuário*.

---

## Topologia moderna proposta

- **Padrão**: **monólito modular em três camadas declaradas — plataforma (núcleo compartilhado de 12
  módulos) + utilitários puros (6) + 13 bounded contexts por *capability*** — com **portas e adaptadores
  aplicados somente às 5 bordas de infraestrutura** que o porte troca de qualquer forma, e com a
  **superfície de caminho público preservada** porque ela é observável.

- **Justificativa**:
  1. **O alvo compra a ferramenta de graça, e é a única mudança de estrutura com efeito observável zero.**
     Hoje o sistema se monta por 1.342 `require`/`include` em 282 arquivos, sem sistema de módulos e sem
     container. TypeScript traz sistema de módulos real, em que *"a regra de dependência é verificável no
     build"* ([`refactor/architectures.md`](../refactor/architectures.md) §5). Pela fronteira da Opção 3
     já decidida — *comportamento observável conservador, estrutura interna idiomática* — topologia é
     exatamente o lado idiomático, **salvo onde o caminho é API** (ver custo 5).
  2. **O número existe e é o joelho de uma curva medida, não gosto.** Declarar os 12 módulos de maior
     peso de entrada derruba o acoplamento par-a-par de **35,0% para 8,4%**; de 12 para 20 o ganho total
     é só 5,1 pontos, e depois de 20 começa a dissolução do domínio dentro do núcleo
     ([`refactor/architectures.md`](../refactor/architectures.md) §2.1, reproduzido nesta etapa).
  3. **A estratégia recomendada já exige esta topologia.** A fatia 1 de
     [`migration_strategy.md`](migration_strategy.md) § 4.4 é literalmente *"núcleo compartilhado — 12
     módulos, construídos como unidade"*, e a fatia 0 exige `EXT-CONTEXTO` e o barramento antes de
     qualquer domínio. Uma topologia que não declare o núcleo **não torna a fatia 1 construível**.
  4. **A implicação 5 do paradigma transforma o ciclo de dívida de estilo em erro de inicialização.** Em
     `require` os 254 ciclos de dois módulos atravessam de graça; em módulo ESM, importação circular lida
     na avaliação do módulo é **erro de inicialização**. Alguma fronteira declarada é obrigatória — a
     pergunta não é *se*, é *qual*.
  5. **Hexagonal só nas 5 bordas, e isso é decisão deliberada.**
     [`refactor/architectures.md`](../refactor/architectures.md) §6 avisa que hexagonal **no núcleo**
     produziria *"um domínio puro que ninguém pode estender — o oposto exato do que está sendo clonado"*,
     porque os 2.460 `apply_filters` interceptam valor no meio do domínio **de propósito**. As 5 portas
     são `camada-de-dados-wpdb`, `cliente-http`, `WP_Filesystem`, `object-cache` e o envio de e-mail —
     todas com mais de uma implementação já presente no legado.

- **Ganhos concretos esperados** (medidos nesta etapa, não estimados):
  - **O peso que atravessa fronteira cai 16×**: a decomposição proposta deixa **5,7% do peso total**
    atravessando fronteira de bounded context, contra **92,5%** dos 15 épicos do backlog
    ([`decompor.py`](../../.reversa/work/reversa-designer/decompor.py)).
  - **66,1% do peso vira dependência descendente legítima** (domínio → camada compartilhada), e só
    **3,0%** fica como violação de camada a cobrar.
  - **Testabilidade por contexto**, contra 0 arquivo de teste hoje: 11 dos 13 contextos têm 4 módulos ou
    menos, e 4 deles têm 1 só.
  - **Uma ordem de corte barata e nomeada**: 22 dos 42 pares de contexto mutuamente dependentes têm volta
    de peso ≤ 5 — o caso-resumo é `superfícies-de-programação → classificação`, com **149 chamadas num
    sentido e 2 no outro**.

- **Custo / risco** (todos declarados, nenhum escondido):
  1. **175 violações de camada entram como dívida datada, e são a primeira coisa a ser cortada quando o
     prazo aperta** — cada uma muda código sem mudar comportamento, logo é invisível para quem valida por
     critério de aceite ([`refactor/architectures.md`](../refactor/architectures.md) §5 item 3).
  2. **"Conteúdo é núcleo, não domínio" vai desagradar, e a medição não oferece alternativa.** Para
     chegar a 8,4% é preciso admitir `posts-e-tipos-de-conteudo`, `capacidades-e-papeis`,
     `temas-e-hierarquia-de-templates` e `telas-do-painel` como núcleo. Com um núcleo puro de
     infraestrutura (6 módulos) sobram **24,2%** e a fronteira não resolve nada.
  3. 🔴 **Cinco dos 12 módulos do núcleo não têm spec alguma** — achado A-01 de [`gaps.md`](../gaps.md),
     `BR-HUMANA-004`, [`AMB-007`](ambiguity_log.md). A fatia 1 da estratégia carrega a mesma trava.
  4. **Regra que ninguém mantém devolve o mesmo SCC com nomes de pasta melhores em dois anos** — e esta
     árvore **não tem pipeline algum**: `surface.json.ci_cd` está vazio, não há Dockerfile, não há
     `composer.lock` ([`refactor/architectures.md`](../refactor/architectures.md) §5).
  5. **Parte do caminho de arquivo é observável e não pode ser reorganizada**: os *drop-ins* por presença
     em `wp-content/`, a raiz de `plugins/` e `themes/`, e as URLs servidas
     (`/wp-admin/edit.php`, `/wp-login.php`, `/wp-cron.php`, `/xmlrpc.php`, `/wp-json/…`,
     `/wp-sitemap.xml`, `/wp-comments-post.php`). Topologia moderna aplicada sem essa reserva **muda
     contrato de terceiro**, que é área byte a byte pela Decisão 2.
  6. 🔴 **Curva de aprendizado e esforço de reorganização não são dimensionáveis**, porque
     `migration_brief.md` não declara tamanho de time nem prazo. O catálogo do refactor estima `alto`
     para o monólito modular e `médio` para o hexagonal nas bordas, com 2 a 4 times — e **nenhum número
     deste documento vale como cronograma**.

### ⚠️ O achado que muda a conclusão: a topologia moderna não produz ordem de construção

Medido em [`ciclo_bc.py`](../../.reversa/work/reversa-designer/ciclo_bc.py) e
[`limiar.py`](../../.reversa/work/reversa-designer/limiar.py), e é o resultado mais importante desta
etapa porque contraria a promessa habitual de um monólito modular:

| O que foi medido | Resultado |
|---|---|
| Maior SCC entre os 13 contextos propostos (+ a prateleira de compatibilidade) | **14** |
| Depois de cortar as 21 voltas de peso ≤ 5 | **14** — o ciclo não quebra |
| Varrido o limiar até 200, cortando **41 das 130** arestas BC→BC | **13** — e para ali |

**O ciclo se sustenta em pares simétricos pesados, não em voltas baratas.** O caso irredutível é
`conteúdo ↔ apresentação`, com **167 chamadas num sentido e 95 no outro** — que é a forma medida do que
[`refactor/architectures.md`](../refactor/architectures.md) §5 item 2 chama de *"não existe separação
entre domínio e apresentação para a fronteira respeitar"*.

**Consequência de desenho, e é mandato para o agente de codificação:** a regra de dependência do alvo
**não pode ser** *"os contextos formam um DAG"*, porque nenhum agrupamento deste sistema produz um DAG.
Tem de ser:

> **Nenhum contexto importa outro contexto no topo do módulo.** Toda chamada entre contextos é **ligação
> tardia** — resolvida no momento da chamada, pelo barramento de *hooks* da plataforma ou por porta
> injetada —, nunca por `import` avaliado na carga do módulo. A regra verificável no *build* é essa, e
> não a ausência de ciclo.

É assim que a implicação 5 de [`paradigm_decision.md`](paradigm_decision.md) é honrada sem mentir sobre
o que a fronteira compra: ela compra **16× menos peso atravessando** e **zero** ordem de construção.

- **Esboço da árvore proposta**:

  ```
  src/
  ├── plataforma/            12 módulos — o núcleo medido (joelho da curva, 8,4%)
  │   ├── contexto/              EXT-CONTEXTO · AsyncLocalStorage por requisição
  │   ├── barramento/            EXT-FILTROS · síncrono, reentrante, prioridade
  │   │                          inteira, COM retorno de valor
  │   ├── registro/              EXT-SUBST · as 38 substituíveis e os 4 drop-ins
  │   ├── arranque/              EXT-ORDEM · ordem de carregamento é contrato
  │   ├── dados/                 SQL à mão, por fragmento, com filtro entre eles
  │   ├── tipos-de-conteudo/     registro e registro de tipo (metade de posts)
  │   ├── opcoes/                opções e as 4 famílias de metadado
  │   ├── autorizacao/           a decisão de capacidade (metade de capacidades)
  │   ├── traducao/              13.335 pontos de entrada — não ganha porta
  │   ├── escape/                3.416 pontos de entrada — não ganha porta
  │   ├── rotas/                 rewrite e permalink
  │   ├── tema/                  resolução de hierarquia de template
  │   └── telas/                 arcabouço das ~100 telas
  ├── utilitarios/            6 módulos — puros, sem regra de negócio
  │                              html-api · kses · object-cache · view-config
  │                              registro-pluggable · text-diff
  ├── contextos/             13 bounded contexts (ver target_architecture.md)
  │   ├── conteudo/ classificacao/ interacao-publica/ midia/
  │   ├── identidade-e-acesso/ privacidade/ apresentacao/
  │   ├── contratos-de-leitura/ superficies-de-programacao/ painel/
  │   └── operacao-do-software/ rede/ integracao-externa/
  ├── adaptadores/            as 5 bordas hexagonais, com modo de falha
  │                              reproduzido de propósito
  ├── entradas/               os front controllers, por caminho público
  │                              PRESERVADO (roteador mapeia URL → módulo)
  └── compatibilidade/        deprecated-e-compatibilidade (BR-HUMANA-006)

  wp-content/                 🔒 PRESERVADO — o caminho é API observável
  ├── plugins/ · themes/ · uploads/
  └── advanced-cache.php · db.php · object-cache.php · fatal-error-handler.php
                                drop-in por PRESENÇA DE ARQUIVO
  ```

---

## Opções apresentadas ao usuário

1. **Preservar topologia legada** (conservador)
   - **Como seria**: `wp-includes/`, `wp-admin/` e `wp-content/` transliterados para TypeScript, com o
     domínio em arquivo plano por entidade e as 28 subpastas mantidas.
   - **Consequências**: mantém o mapa mental de quem conhece o produto e de quem escreve extensão, e
     reduz a distância conceitual do porte. Perpetua o SCC de 68 módulos, as 4 superfícies de escrita com
     3 autorizações diferentes e o *loopback* implementado 4 vezes.
   - ⚠️ **E é a opção cujo custo não é zero, o que inverte a leitura habitual**: a topologia plana é
     grátis em PHP porque `require` tolera ciclo; em módulo ESM os 254 ciclos de dois módulos viram
     **erro de inicialização** e não há fronteira declarada contra a qual resolvê-los. Preservar a
     topologia obriga a resolver os ciclos **sem** a camada que os organiza — ou a reproduzir o
     carregamento por `require` em cima de um sistema de módulos que não o tem.
2. **Adotar a topologia moderna proposta** (transformacional)
   - **Consequências**: rompe com o débito estrutural, torna a fatia 1 da estratégia construível, e
     derruba o peso que atravessa fronteira de 92,5% para 5,7%. Exige aprendizado, paga 175 violações
     como dívida datada e obriga a admitir conteúdo e painel como núcleo.
   - ⚠️ **Risco próprio desta opção**: aplicada sem reserva, reorganiza caminhos que são **API
     observável** — os *drop-ins* por presença em `wp-content/` e as URLs servidas. Isso quebra contrato
     de terceiro, que é área **byte a byte** pela Decisão 2.
3. **Híbrido** (equilibrado)
   - **Quais bordas preservam o legado** — exatamente as que são observáveis:
     - **`wp-content/` inteiro**, com `plugins/`, `themes/`, `uploads/` e os *drop-ins* na raiz: a
       presença do arquivo naquele caminho **é** a API (`wp-settings.php:98` · `wp-includes/load.php:711` e `:825`).
     - **Todo caminho servido**: `/wp-admin/*.php`, `/wp-login.php`, `/wp-cron.php`, `/xmlrpc.php`,
       `/wp-json/…`, `/wp-sitemap.xml`, `/wp-comments-post.php`, `/wp-activate.php`, `/wp-signup.php`,
       `/wp-trackback.php`, `/wp-mail.php`, `/wp-links-opml.php`.
     - **A ordem de arranque** como contrato público (`EXT-ORDEM` / `BR-MIGRAR-106`).
     - **As quatro superfícies de escrita**, com o comportamento atual (`ESC-SUPERFICIES` /
       `BR-MIGRAR-107`) — inclusive a camada que falha **aberta**.
   - **Quais bordas adotam o moderno** — tudo atrás do ponto de entrada:
     - a árvore de fonte (`src/plataforma/`, `src/utilitarios/`, `src/contextos/`);
     - a regra de dependência verificada no *build*, começando **vermelha** nas 175 violações conhecidas;
     - portas e adaptadores **somente** nas 5 bordas de infraestrutura;
     - a ligação tardia obrigatória entre contextos.
   - **Por que a borda cai exatamente aí, e de graça**: em PHP o caminho servido **é** o caminho de fonte
     — 109 *front controllers* e zero roteador no painel. No alvo existe roteador, logo **URL e caminho
     de fonte se separam sem custo**. A opção 3 não é um meio-termo negociado: é a consequência de a
     *stack* alvo ter uma indireção que o legado não tem.

---

## Decisão do usuário

> 🔴 **PENDENTE.** `state.json.answer_mode` é `file`: esta execução não teve conversa, logo o passo 5 do
> SKILL não pôde coletar a escolha. **Nenhuma opção foi escolhida em nome de ninguém.**

- **Escolha**: `<1 | 2 | 3>` — **em branco**
- **Justificativa do usuário**: `<texto livre>` — em branco
- **Decidido em**: `<ISO-8601>` — em branco

**A pergunta, em uma linha:** **qual opção você escolhe — (1) preservar a topologia legada, (2) adotar a
topologia moderna proposta, ou (3) híbrido?**

### Recomendação do Designer

**Opção 3 — híbrido**, e a razão é que ela **já está decidida uma camada acima**, não que seja o
meio-termo confortável.

[`pending_decisions.md`](pending_decisions.md) § *Decisão 1* respondeu Opção 3 com a fronteira escrita:
*comportamento observável fica conservador, estrutura interna fica idiomática*, e todo caso de borda passa
pelo mesmo teste — *muda a saída HTTP, o efeito no banco ou o comportamento de caso de uso?* Aplicado à
topologia, esse teste dá uma resposta determinada, não uma preferência:

| Elemento de topologia | Muda saída observável? | Logo |
|---|---|---|
| Árvore de fonte (`src/…`) | não | pode ser idiomática |
| Agrupamento em bounded context | não | pode ser idiomático |
| Regra de dependência no *build* | não | pode ser idiomática |
| Caminho servido (URL) | **sim** — contrato de terceiro, byte a byte | **preservar** |
| `wp-content/` e *drop-in* por presença | **sim** — a presença do arquivo é a API | **preservar** |
| Ordem de arranque | **sim** — `EXT-ORDEM`, contrato público | **preservar** |

A opção 2 falha o teste em três linhas; a opção 1 passa o teste mas paga os 254 ciclos ESM sem fronteira
para resolvê-los. **A opção 3 é a única que passa nas seis.**

> 📌 **PREMISSA ADOTADA PARA A FASE 2, declarada e reversível.** Como a instrução de execução manda
> seguir sem confirmação, os quatro artefatos da Fase 2 foram escritos **sob a opção 3**. Cada um abre
> com este aviso. Se a resposta for:
> - **opção 1** → `target_architecture.md` § *Honra à topologia escolhida* e o esboço de árvore são
>   refeitos; os 13 bounded contexts deixam de existir como pasta e passam a ser agrupamento lógico
>   apenas; **os aggregates, o modelo de dados e o plano de migração de dados não mudam**.
> - **opção 2** → muda somente a coluna *preservar* da tabela acima: `wp-content/`, as URLs e a ordem de
>   arranque passam a ser redesenhadas, e isso **quebra área byte a byte** da Decisão 2. Exige decisão
>   registrada de exceção ao idêntico, não efeito colateral.
> - **opção 3** → nada muda; a premissa vira decisão.

---

## Mapeamento legado → novo

Os 71 módulos do grafo medido, agrupados. A partição foi conferida **total e disjunta** em
[`decompor.py`](../../.reversa/work/reversa-designer/decompor.py): 71 atribuídos, nenhum duplicado,
nenhum fora.

| Módulo / pasta legada | Bounded context novo | Tipo | Observações |
|---|---|---|---|
| `l10n-e-traducoes`, `nucleo-utilitario-e-erro`, `hooks-e-plugin-api`, `formatacao-e-escape`, `bootstrap-e-carregamento`, `opcoes-e-metadados`, `rewrite-e-permalinks`, `camada-de-dados-wpdb` | `plataforma` | fundido | os 8 de maior peso de entrada sem regra de domínio própria; fundidos porque uma fronteira entre eles não tem o que policiar — 68 dos 71 módulos chamam cada um |
| `posts-e-tipos-de-conteudo` | `plataforma` (registro) **+** `BC-01-conteudo` (regra) | dividido | **divisão decidida aqui, não medida.** O registro de tipo e o acesso ao registro ficam na plataforma porque **42 dos 71 módulos** dependem deles; as invariantes `P1`–`P8` e a cascata de 7 etapas vão para o contexto. Risco declarado: se a linha estiver errada, as 175 violações crescem |
| `capacidades-e-papeis` | `plataforma` (decisão) **+** `BC-05-identidade-e-acesso` (dado) | dividido | a decisão de acesso é chamada 1.279 vezes em 224 arquivos e precisa estar abaixo de todo contexto; o **dado** do papel mora em metadado serializado por site (`PERM-2`) e pertence à identidade |
| `temas-e-hierarquia-de-templates` | `plataforma` (resolução) **+** `BC-07-apresentacao` (regra) | dividido | resolver qual template atende a requisição é roteamento; decidir o que o template mostra é apresentação |
| `telas-do-painel` | `plataforma` (arcabouço) **+** `BC-10-painel` (telas) | dividido | recebe a aresta mais pesada do sistema (1.075 chamadas de tradução) e é o 16º mais dependido: o arcabouço é núcleo, a tela não |
| `html-api`, `kses-e-sanitizacao`, `object-cache`, `view-config`, `funcoes-substituiveis-pluggable`, `comparacao-de-texto-diff` | `utilitarios` | fundido | ⚠️ admitidos por **classificação** (sem regra de negócio e sem estado de domínio), **não** por acoplamento: medido, compram 1,0 ponto em 6 módulos — **0,17 pt/módulo**, abaixo da regra de parada de 1 pt/módulo da §2.1. `object-cache` é a exceção dentro da exceção: **tem** estado, e entra porque é *drop-in* por presença com **27 dependentes** e porque a condição 4 da coexistência exige desligá-lo nas duas metades |
| `wp-query`, `editor-de-blocos`, `blocos-do-nucleo`, `block-supports`, `block-bindings`, `block-patterns`, `shortcodes`, `importacao-e-exportacao` | `BC-01-conteudo` | fundido | agrupados por coesão de invariante: todos escrevem ou leem `post_content`, e o bloco é *"serializado em comentário HTML dentro de `post_content` — não em tabela"* ([`domain.md`](../domain.md) §1.5). A exportação WXR entra aqui porque é serialização do mesmo conteúdo |
| `taxonomias-e-termos`, `links-e-bookmarks` | `BC-02-classificacao` | fundido | ⚠️ fusão **contraintuitiva e justificada**: `links` parece morto, mas `term_relationships.object_id` é polimórfico e serve `posts` **e** `links` ([`erd-complete.md`](../erd-complete.md) §7.1 relações 5 e 10). Separá-los deixaria a coluna polimórfica sem dono |
| `comentarios` | `BC-03-interacao-publica` | 1-para-1 | **separação justificada, não preguiça**: apesar de `comments.comment_post_ID`, a cascata de 12 regras `C1`–`C12` tem **ordem significativa e curto-circuito** e devolve 409 e 429 na mesma resposta. Fundir com conteúdo dissolveria a ordem, que **é** a regra (implicação 3) |
| `midia-e-anexos`, `edicao-de-imagem` | `BC-04-midia` | fundido | **separado de conteúdo apesar de o anexo ser um post**: `R3` diz que o anexo só vai para a lixeira se `MEDIA_TRASH` estiver ligada, e ela é `false` por padrão — a regra de retenção do anexo é o **oposto** da do post. Forma de armazenamento não decide contexto |
| `usuarios-e-perfis`, `autenticacao-e-sessoes`, `application-passwords` | `BC-05-identidade-e-acesso` | fundido | uma invariante só: a chave do HMAC do cookie embute **4 caracteres do hash da senha** ([`gaps.md`](../gaps.md) A-05), logo trocar senha e validade de sessão são o mesmo fato — e `ESC-SESSAO` manda **não** revogar |
| `privacidade-e-dados-pessoais` | `BC-06-privacidade` | 1-para-1 | **separação por regime, não por tamanho**: domínio regulado (LGPD/GDPR), `Parallel Run` **permanente** pelo caso de borda do SKILL do Strategist. `D1` diz *"a solicitação é um Post"* e ainda assim fica fora de conteúdo: o ciclo de vida `user_request` não tem interseção com `post_status` |
| `theme-json-e-estilos-globais`, `style-engine`, `widgets-e-sidebars`, `menus-de-navegacao`, `customize`, `interactivity-api`, `script-modules`, `script-e-style-loader`, `view-transitions`, `speculative-loading`, `icon-library`, `font-library` | `BC-07-apresentacao` | fundido | 12 módulos fundidos porque **todos resolvem contrato declarado em dado para saída** (estilo D de [`paradigm_decision.md`](paradigm_decision.md)) e porque [`architecture.md`](../architecture.md) registra o ciclo secundário `customize ↔ menus ↔ widgets`: estão no mesmo ciclo, não há fronteira entre eles a declarar |
| `feeds-rss-atom`, `sitemaps`, `oembed-e-embeds` | `BC-08-contratos-de-leitura` | fundido | agrupados **pelo critério de aceite**, que é a coesão mais afiada disponível: os três são contrato de terceiro **byte a byte** (Decisão 2) e são a fatia 2 da estratégia, a primeira virada |
| `rest-api`, `xmlrpc`, `ajax-do-painel`, `abilities-api` | `BC-09-superficies-de-programacao` | fundido | ⚠️ **a fusão com maior valor de diagnóstico deste mapa**: `PERM-11` registra **três camadas paralelas de autorização, cada uma com falha padrão diferente** — uma delas falhando **ABERTA** (`BR-HUMANA-008`). Hoje moram em pastas separadas e ninguém vê a divergência. Num contexto só, ela é comparável |
| `admin-list-tables`, `dashboard` | `BC-10-painel` | fundido | as ~100 telas e o canal assíncrono; é a fatia 9 da estratégia e o ponto em que a implicação 2 (concorrência) mais morde — 224 arquivos com `current_user_can` |
| `atualizacoes-e-upgrader`, `instalador-e-schema`, `sistema-de-arquivos-e-ftp`, `criptografia-e-assinaturas`, `site-health-e-diagnostico`, `recovery-mode-e-tratamento-de-erro-fatal`, `cron` | `BC-11-operacao-do-software` | fundido | **`cron` entra aqui de propósito, e isso é uma divergência deliberada da fatia 5** (ver nota 2): `A5`, `A6`, `A7` e `A9` são uma só invariante — a atualização é agendada pelo cron, o modo de recuperação é o tratador de falha da atualização, e os três escrevem pelo sistema de arquivos. É também o que dá **dono único** às 4 implementações do *loopback*, que é o pedido de `BR-HUMANA-005` |
| `multisite` | `BC-12-rede` | 1-para-1 | 6 tabelas próprias e a relação 24 (`blog_id` dentro do **nome** da tabela). `ESC-MULTISITE` diz que é **capacidade do produto**, logo o contexto tem de poder estar ausente — é a única fronteira do mapa que é também fronteira de instalação |
| `cliente-http`, `ai-client`, `connectors`, `envio-de-email` | `BC-13-integracao-externa` | fundido | a **política** (precedência de credencial `I1`/`I2`, o conector Akismet `I3`, o rebaixamento `ESC-HTTP`) mora aqui; o **adaptador** mora em `src/adaptadores/`. Divisão necessária porque [`refactor/architectures.md`](../refactor/architectures.md) §6 item 1 põe as 5 portas no núcleo compartilhado |
| `temas-empacotados`, `plugins-empacotados` | (nenhum) | **dependência adotada** | `fan_in` zero, e [`ESC-CLIENTE`](target_business_rules.md#br-migrar-117) já estabeleceu o precedente de adotar em vez de reescrever. É a fatia 12 da estratégia. 🔴 Escopo pendente — dúvida 3 da § 7 de [`migration_strategy.md`](migration_strategy.md) |
| `deprecated-e-compatibilidade` | (nenhum) | **prateleira** | 10.160 linhas que existem para não quebrar quem chama. Fica numa prateleira declarada, fora da partição de desenho, porque não tem invariante própria. 🔴 Destino depende de `BR-HUMANA-006` |
| 6 bibliotecas vendorizadas que nada chama | (descartado) | removido | Snoopy, Services_JSON, Jcrop, json2, SWFUpload, Prototype/script.aculo.us — ver [`AMB-009`](ambiguity_log.md) e [`discard_log.md`](discard_log.md). 🔴 `BR-HUMANA-006` pendente: a P7 lida ao pé da letra obriga a portá-las |
| lado cliente dos 5 módulos do editor | (fora do porte) | removido | [`BR-MIGRAR-117`](target_business_rules.md#br-migrar-117) (`ESC-CLIENTE`): dependência externa de versão cravada. `wp-includes/js/dist/` nem existe nesta árvore |

**Verificação da regra absoluta *"não reusar nome de arquivo do legado como nome de bounded context"***:
nenhum dos 13 nomes (`conteudo`, `classificacao`, `interacao-publica`, `midia`, `identidade-e-acesso`,
`privacidade`, `apresentacao`, `contratos-de-leitura`, `superficies-de-programacao`, `painel`,
`operacao-do-software`, `rede`, `integracao-externa`) é nome de arquivo, de pasta ou de módulo do legado.
🟢

**Verificação da regra absoluta *"decomposição 1-para-1 é proibida"***: dos 13 contextos, **9 são fusão**
de 2 a 12 módulos e **4 são 1-para-1** — `interacao-publica`, `privacidade`, `rede` e (por divisão)
`painel`. Cada um dos 4 tem justificativa de **separação** escrita na linha correspondente acima, como a
regra exige. E **4 módulos foram divididos** entre plataforma e contexto, com a divisão declarada como
decisão deste agente e não como medida. 🟢

---

## Sensibilidade à estratégia não confirmada

A § 2 do chão desta etapa declara que o desenho pressupõe a estratégia **A + B**. O que muda em cada
alternativa de [`migration_strategy.md`](migration_strategy.md) § 3:

| Se a estratégia escolhida for | O que muda nesta topologia |
|---|---|
| **A — Strangler Fig** (premissa) | nada: a fatia 1 é o núcleo de 12, a fatia 0 exige `EXT-CONTEXTO` e o barramento, e `BC-08` é a fatia 2 |
| **B — Parallel Run** isolada | a topologia **não muda**; muda o que se constrói primeiro. B não é alternativa: é companheira obrigatória de A |
| **C — Big Bang** | ⚠️ a topologia **ganha liberdade e perde a reserva da opção 3**: sem coexistência, `wp-content/` e as URLs ainda são contrato de terceiro, mas o *schema* compartilhado deixa de ser restrição. Big Bang está **PROIBIDA** pelo caso de borda regulatório (LGPD/GDPR em `D1`–`D6`, `R7`, `R8`) — está escrito de propósito |

🔴 **E uma decisão humana pode derrubar a premissa inteira: `BR-HUMANA-003`.** A opção **(a)** — coluna
`datetime` anulável com marcador explícito — **muda o esquema**, e com isso o banco compartilhado que é o
*enabler* da estratégia A. Este desenho pressupõe **(c)**, manter a string literal, que é a recomendação
do Curator para banco MySQL. Se for (a), `target_data_model.md` e `data_migration_plan.md` precisam ser
**reavaliados, não ajustados**.

---

## Implicações pendentes para próximos passos do Designer

| Etapa do Designer | Implicação | Como honrar |
|---|---|---|
| **Bounded contexts** | a partição é de 13 contextos sobre 53 módulos de domínio, com 4 módulos **divididos** entre plataforma e contexto | documentar cada contexto com a justificativa de fusão **ou** de separação já escrita no mapeamento acima; nenhum contexto pode ser 1-para-1 sem justificativa de separação |
| **Bounded contexts** | ⚠️ o grafo de contextos **tem um SCC de 14** e nenhum limiar de corte o quebra | declarar a regra de ligação tardia como propriedade do desenho, **não** prometer ordem de construção entre contextos |
| **`target_architecture`** | o alvo tem **três camadas declaradas** e **zero fronteira de processo** ([`architecture.md`](../architecture.md) §9 risco 1) | o diagrama mostra camadas e contextos, **não** serviços. Qualquer caixa com fronteira de processo seria desenho novo, não extração |
| **`target_architecture`** | implicação 2 — estado global vira estado de processo | `src/plataforma/contexto/` é o **primeiro** componente e pré-requisito de todos os outros: `AsyncLocalStorage` por requisição, antes de qualquer módulo de domínio |
| **`target_architecture`** | implicação 3 — a cascata tem ordem e curto-circuito | `BC-03` desenha a moderação como **cadeia síncrona de curto-circuito** com ordem declarada, preservando 409 e 429 na mesma resposta. Nunca como *pipeline* de eventos |
| **`target_architecture`** | implicações 1 e 6 — a assincronia contamina o chamador | declarar a **fronteira de `await`**: assíncrono em `src/adaptadores/`, síncrono dentro de `src/contextos/`. Sem essa linha a ordem de emissão de HTML muda |
| **`target_domain_model`** | 117 regras MIGRAR em 14 áreas, e as áreas `Fronteira do banco`, `Autorização`, `Contrato de extensão` e `Escopo declarado` são **transversais** | as 4 áreas transversais mapeiam para a plataforma e para política, **não** para um aggregate. As 10 áreas restantes mapeiam para contexto |
| **`target_domain_model`** | o legado **não encapsula invariante**: papel é chave dentro de opção, widget vive em opção, bloco é serializado em `post_content` ([`domain.md`](../domain.md) §1.3 e §1.5) | o aggregate novo encapsula a invariante **sem mudar onde o dado mora** — a forma de armazenamento é área *efeito no banco* da Decisão 2 |
| **`target_data_model`** | o esquema é **compartilhado** com a metade PHP durante toda a coexistência | **zero** mudança de esquema: 18 tabelas, 0 FK, as 4 famílias de `longtext` com estrutura PHP serializada e os sentinelas de data permanecem. Toda melhoria de modelagem é **proibida** nesta fase, e isso é requisito, não omissão |
| **`data_migration_plan`** | com (c) em `BR-HUMANA-003` e banco compartilhado, **não há migração de dados** | o plano documenta **zero ETL** como resultado, e documenta o que existiria se a resposta fosse (a). Mais: as consultas de órfão de [`erd-complete.md`](../erd-complete.md) §9 risco 4 entram como verificação de paridade, não como limpeza |

---

## Notas

**Para o agente de codificação, em uma frase:** crie `src/plataforma/` antes de qualquer outra pasta,
comece por `contexto/` e `barramento/`, e grave a regra de *build* como *"nenhum contexto importa outro
contexto no topo do módulo"* — porque os contextos **não** formam um DAG e uma regra de aciclicidade
falharia sem nada a propor.

1. **A regra de dependência começa vermelha, e isso é de propósito.** 175 violações núcleo → domínio no
   corte de 12, com lista de exceções datada.
   [`refactor/architectures.md`](../refactor/architectures.md) §5 item 2: *"regra que começa verde não
   pega nada e não é regra"*.

2. **Fatia ≠ bounded context, e confundi-los é erro caro.** `cron` está em `BC-11` por coesão de
   invariante; a fatia 5 de [`migration_strategy.md`](migration_strategy.md) § 4.4 o entrega **sozinho**,
   por mandato da implicação 6 (*o disparo precisa falhar*). As duas coisas são compatíveis: a fatia corta
   o contexto para entregar, e a fatia 5 passa por dentro de `BC-11`. Declarado aqui para que ninguém
   "corrija" um dos dois documentos achando que divergem.

3. **O que esta topologia NÃO compra, dito de novo porque é o erro mais fácil de cometer:** ela não
   torna o sistema fatiável por módulo. [`migration_strategy.md`](migration_strategy.md) § *O chão desta
   etapa* item 3 mediu que **todos os 18 candidatos naturais a fatia têm fecho transitivo de 68 de 71
   módulos, sem exceção**. A incrementalidade continua sendo **por superfície HTTP**, e a primeira virada
   continua tendo 68 módulos atrás dela. A topologia muda o custo de **manter**, não o de **chegar à
   primeira entrega**.

4. **Divergência de medida, reconciliada e não escondida.**
   [`refactor/architectures.md`](../refactor/architectures.md) §2.1 registra peso **990** nas 175
   violações do corte de 12; a medição desta etapa dá **1.442**. O número de violações (175) e os dois
   percentuais (8,4% e 35,1%) batem **exatamente**, logo a divergência está só na soma de peso — a causa
   provável é recorte diferente de tipo de aresta (`imports`, `calls`, `publishes`, `subscribes`, `reads`,
   `writes`, `extends`). Isso **não** muda nenhuma conclusão deste documento, que usa a contagem de
   violações e não o peso delas.

5. **Peso de aresta é piso, não teto.** [`architecture/architecture-graph.md`](../architecture/architecture-graph.md)
   registra que `$objeto->metodo()` não resolve nesta árvore, porque ela quase não declara tipo. Todo
   percentual de acoplamento deste documento é mínimo garantido — o que **reforça** a proposta, nunca a
   enfraquece.

6. 🔴 **Três lacunas de entrada que este documento não fecha e não contorna**: `migration_brief.md`
   ausente (`BR-HUMANA-001`), estratégia não confirmada (§ 6 de
   [`migration_strategy.md`](migration_strategy.md)) e a própria decisão de topologia (§ *Decisão do
   usuário*). As três estão declaradas no lugar em que a leitura esbarra nelas, não só nas notas.

7. **Como reproduzir cada número deste documento.** Todos os scripts rodam da raiz do *workspace*:

   | Script | O que mede |
   |---|---|
   | [`medir.py`](../../.reversa/work/reversa-designer/medir.py) | `fan_in`, `fan_out`, peso de entrada, SCC, ciclos de dois módulos, os 12 de maior peso |
   | [`topologia.py`](../../.reversa/work/reversa-designer/topologia.py) | arquivos PHP por pasta, plano contra subpasta, natureza das 28 subpastas de `wp-includes/` |
   | [`decompor.py`](../../.reversa/work/reversa-designer/decompor.py) | a partição (total e disjunta), a curva do núcleo nos cortes de 12 e 18, o peso que atravessa fronteira de BC |
   | [`ciclo_bc.py`](../../.reversa/work/reversa-designer/ciclo_bc.py) | SCC do grafo de bounded contexts, antes e depois de cortar as voltas baratas |
   | [`limiar.py`](../../.reversa/work/reversa-designer/limiar.py) | a varredura de limiar que mostra que nenhum corte torna o grafo de BC acíclico |
