---
schemaVersion: 1
generatedAt: 2026-10-06T17:52:31-03:00
reversa:
  version: "1.0.0"
kind: paradigm_decision
producedBy: paradigm_advisor
hash: "sha256:28bc01c2f4683e88623e6f95c362e0e5926aaab510b00f13c2b1e9148efb2528"
---

# Paradigm Decision

> Decisão consciente sobre como tratar a mudança (ou ausência) de paradigma entre o legado e a stack alvo.
> Este artefato é leitura obrigatória primeiro para qualquer agente posterior e para o agente de codificação.

> ⚠️ **A decisão desta etapa está ABERTA.** `state.json.answer_mode` é `file`: esta execução não teve
> chat interativo, logo o passo 6 do SKILL não pôde coletar a escolha. As três opções estão em
> [`pending_decisions.md`](pending_decisions.md), com campo de resposta. Até alguém responder, a
> § "Decisão do usuário" deste arquivo é **hipótese de trabalho com proveniência declarada**, não decisão.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Evidência direta em artefato do `_reversa_sdd/`, com seção citada |
| 🟡 INFERIDO | Padrão observado nos artefatos, sem afirmação explícita |
| 🔴 LACUNA | Não dedutível pelas specs disponíveis |
| ⚠️ AMBÍGUO | As evidências apontam para mais de um paradigma |

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental deste processo e não
entraram em nenhuma contagem. Nenhum número deste documento foi lido do código-fonte do legado: o SKILL
desta etapa manda operar 100% no nível das specs, e todas as citações abaixo apontam para artefatos do
`_reversa_sdd/`.

---

## Paradigma do legado detectado

- **Paradigma principal**: **híbrido — procedural dominante com barramento de eventos síncrono, e OO clássico em bolsões**
- **Confiança**: 🟢 CONFIRMADO para o recorte procedural + barramento; ⚠️ AMBÍGUO no rótulo "event-driven" (ver § *A ambiguidade que esta etapa existe para desfazer*)

- **Evidências**:
  - **O artefato de arquitetura crava o estilo**: "monolito PHP procedural com estado global, bootstrap sequencial em ordem fixa e barramento de eventos como único mecanismo de extensão" — [`architecture.md`](../architecture.md) §1. 🟢
  - **Não há injeção de dependência nem container**, e as dependências são globais (`$wpdb`, `$wp_query`, `$wp_filter`): "qualquer unidade impossível de instanciar isolada sem subir meio ambiente" — [`architecture.md`](../architecture.md) §2.2. Isso **descarta OO com DI** como classificação. 🟢
  - **Não há camadas com interface, há ordem de carregamento — e ela é contrato público**: um plugin que registra gancho cedo ou tarde demais simplesmente não funciona — [`architecture.md`](../architecture.md) §2.2 e §4.1 D1. 🟢
  - **As contagens de forma procedural**: 1.121 declarações `global $`, 3.410 usos de superglobal em 216 arquivos, 1.342 `require`/`include` em 282 arquivos, 1.463 `echo`/`print`, **109 front controllers** e nenhum ponto único de entrada — [`refactor/architectures.md`](../refactor/architectures.md) §2. 🟢
  - **O barramento devolve valor na maioria dos casos**: 2.460 `apply_filters` contra 1.068 `do_action`, ou **69,7% do gancho devolvendo valor ao chamador** — [`refactor/architectures.md`](../refactor/architectures.md) §2. Um barramento que devolve valor é cadeia de transformação síncrona, não mensageria. 🟢
  - **Dado como array, não como aggregate**: SQL escrito à mão, sem ORM, 18 tabelas, **zero chaves estrangeiras**, zero *trigger*, *procedure* e *view* — "o banco é armazenamento puro" — [`architecture.md`](../architecture.md) §4.1 D3 e §6. 🟢
  - **O domínio não encapsula invariante**: papel "não é coluna: é uma chave dentro da opção `{prefixo}user_roles`"; widget e sidebar "vivem em opções, não em tabela"; bloco é "serializado em comentário HTML dentro de `post_content` — não em tabela" — [`domain.md`](../domain.md) §1.3 e §1.5. 🟢
  - **Despacho por tabela global de funções**, que é marca de procedural e não de OO: 38 funções do núcleo substituíveis inteiras em `pluggable.php` e 176 guardas `function_exists` em 67 arquivos — [`refactor/architectures.md`](../refactor/architectures.md) §2 e §4. 🟢
  - **E há OO clássico de verdade, em bolsões**: `WP_Filesystem_Base` com quatro implementações concretas e `Requests` com dois transportes são "interface com polimorfismo, escritos à mão" — [`refactor/architectures.md`](../refactor/architectures.md) §6; mais 9 classes que montam SQL por fragmento ([`architecture.md`](../architecture.md) §9 risco 5) e 5 classes de modo de recuperação ([`inventory.md`](../inventory.md) §4.3). 🟢 Os 47 controllers REST e o `WP_REST_Server` existem ([`architecture.md`](../architecture.md) §2.3), mas **nenhum artefato desta análise descreve a hierarquia de herança entre eles** — classificá-los como OO clássico é 🟡.

- **Variações observadas** (é híbrido; o paradigma **não é uniforme** e isso muda a conversa de porte):

| # | Componente | Paradigma | Evidência | Conf. |
|---|---|---|---|---|
| A | Arranque e carregamento (`wp-settings.php`, os 109 front controllers) | **procedural puro**, com ordem fixa como contrato | [`architecture.md`](../architecture.md) §2.2, §4.1 D1 | 🟢 |
| B | Barramento de hooks (`plugin.php`, `class-wp-hook.php`) | **event-driven síncrono**: ordenado por prioridade inteira, reentrante e com retorno de valor em 69,7% dos casos | [`inventory.md`](../inventory.md) §2.4, [`refactor/architectures.md`](../refactor/architectures.md) §2 | 🟢 |
| C | Superfícies de API, consulta e sistema de arquivos | **OO clássico**: polimorfismo escrito à mão sobre classe base | [`architecture.md`](../architecture.md) §2.3 e §9 risco 5, [`refactor/architectures.md`](../refactor/architectures.md) §6 | 🟡 |
| D | `theme.json`, `block.json`, Interactivity API, *style engine*, `view-config` | **dataflow declarativo**: contrato declarado em dado e resolvido em CSS/HTML por estágios | [`domain.md`](../domain.md) §1.5 e §1.8, [`inventory.md`](../inventory.md) §4.3 | 🟡 |
| E | Agendamento e atualização (`wp-cron`, *upgrader*) | **pseudo-assíncrono**: fila numa tabela de opções, disparada por requisição HTTP não bloqueante ao próprio host, sem log | [`domain.md`](../domain.md) §2.6 A9, [`questions.md`](../questions.md) P10 | 🟢 |
| F | Lado cliente dos 5 módulos do editor | 🔴 **não dedutível**: `wp-includes/js/dist/` está ausente desta árvore | [`architecture.md`](../architecture.md) §10 A-4, [`questions.md`](../questions.md) P15 | 🔴 |

### A ambiguidade que esta etapa existe para desfazer

O legado tem 3.373 pontos de gancho ([`inventory.md`](../inventory.md) §2.4) e o vocabulário do próprio
produto é "ação", "filtro", "barramento de eventos". Lido rápido, isso faz o legado **parecer**
event-driven — e então o gap com uma stack TypeScript parece ser só de sintaxe. **Não é.** As duas coisas
têm o mesmo nome e semântica oposta:

| Propriedade | Gancho do legado | Evento no paradigma event-driven |
|---|---|---|
| Retorno ao emissor | **69,7% devolve valor** e o chamador usa na mesma expressão 🟢 | o *handler* não devolve nada a quem publicou |
| Sincronia | chamada de função, mesma pilha, mesma requisição 🟢 | entrega assíncrona, possivelmente em outro processo |
| Ordem | determinística, por prioridade inteira 🟢 | não garantida sem chave de ordenação |
| Falha | volta como `WP_Error` no mesmo retorno 🟢 ([`domain.md`](../domain.md) §2.5 D3) | DLQ, *retry*, idempotência obrigatória |
| Ciclo de vida | morre com o processo da requisição 🟢 ([`architecture.md`](../architecture.md) §1) | sobrevive ao emissor |

**A conclusão que importa:** trocar PHP por TypeScript aqui não é mudança de sintaxe. É mudança em dois
eixos simultâneos — **sincronia** e **tempo de vida do processo** — e o segundo não está em nenhuma linha
do catálogo de paradigmas, porque é específico desta árvore.

---

## Stack alvo declarada

> 🔴 **LACUNA DE PRÉ-REQUISITO.** O SKILL desta etapa exige
> `_reversa_sdd/migration/migration_brief.md` com a stack alvo declarada. **Esse arquivo não existe**: a
> pasta `_reversa_sdd/migration/` foi criada por esta execução. O caso de borda do SKILL manda
> *"perguntar antes de prosseguir; não inventar"* — e não há chat nesta execução. O que foi feito, em vez
> de inventar: a stack foi extraída **das respostas humanas já gravadas** em
> [`questions.md`](../questions.md), que é a única fonte deste pacote onde uma pessoa declarou alvo de
> porte. A pergunta formal está em [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*.

| Campo | Valor | Fonte | Conf. |
|---|---|---|---|
| **Linguagem** | **TypeScript** `strict` | decidido (Lacuna 1); P15 já o declarava | 🟢 DECIDIDO |
| **Runtime** | **Node.js LTS** | decidido: é onde `AsyncLocalStorage` é maduro, e o contexto por requisição explícito é pré-requisito do Designer (implicação 2) | 🟢 DECIDIDO |
| **Framework** | **nenhum opinativo** — HTTP mínimo, sem container de DI, sem ORM, sem ciclo de vida de framework | decidido: NestJS puxaria para *OO com DI* e Fastify/Express para *event-driven leve*, e os dois reavaliariam as 8 implicações; além disso a **ordem de arranque é contrato público** e framework com ciclo de vida próprio disputa com ela | 🟢 DECIDIDO |
| **Banco** | **MySQL/MariaDB**, driver TypeScript, **SQL à mão, sem ORM** | decidido pela restrição que já estava registrada: 9 classes montam SQL por fragmento **com um filtro de extensão entre cada fragmento** ([`architecture.md`](../architecture.md) §9 risco 5). ORM esconde o fragmento e mata o ponto de extensão que a P3 declarou ser o produto | 🟢 DECIDIDO |
| **Mensageria** | **nenhuma** | P10 | 🟢 |
| **Infra** | **sem container na primeira fase** — decisão ADIADA e nomeada | o atualizador embutido sobrescreve o próprio código em execução ([`deployment.md`](../deployment.md) §8); containerizar muda o comportamento observável do caso de uso de atualização e precisa de decisão própria | 🟢 DECIDIDO (adiamento explícito) |
| **Lado cliente do editor** | **dependência externa com versão cravada, não reescrita** — o servidor que a alimenta entra no porte | o fonte upstream já é JS/TS: reescrever afasta do idêntico. Entram no porte o registro de *scripts*, o registro dos 116 blocos por `block.json`, `theme.json`, o *style engine*, os *endpoints* REST do editor e a serialização de bloco em `post_content` | 🟢 DECIDIDO (Lacuna 2) |
| **Escopo** | o núcleo do CMS, **não** um site | P1, P4, P13, P14 | 🟢 |
| **Objetivo / métrica** | clonar o núcleo com **regra idêntica**; paridade pelo critério por área da Decisão 2 contra o oráculo da P16 | Decisões 1 e 2 | 🟢 |
| **Prazo, orçamento, *stakeholders*** | 🔴 em aberto — não inventados | `/reversa-migrate` conduz | 🔴 LACUNA |

> ✍️ **Tabela escrita fora do gerador**, a partir das respostas da § *Lacuna 1* e *Lacuna 2* de
> [`pending_decisions.md`](pending_decisions.md). O aviso de pré-requisito acima permanece como registro
> histórico de como a etapa encontrou o pacote.

---

## Paradigma natural inferido

- **Paradigma**: **event-driven assíncrono**

- **Justificativa**: o catálogo consultivo tem duas linhas que cabem em TypeScript e **as duas convergem**
  — `Node.js 20 (Fastify, Express, NestJS) → event-driven assíncrono` e
  `TypeScript serverless (AWS Lambda, Cloudflare Workers) → event-driven`
  (`references/paradigm-catalog.md` § *Mapeamento stack → paradigma natural*). Como o framework não está
  declarado, a inferência vale para toda a faixa: **a escolha de framework muda a alternativa viável, não
  o natural**. A razão é de runtime, não de biblioteca: I/O não bloqueante por default, laço de eventos
  único, e — o ponto que mais pesa nesta árvore — **processo longo-vivo atendendo requisições
  concorrentes**, contra o processo por requisição que o legado monta e descarta
  ([`architecture.md`](../architecture.md) §1).

- **Alternativas viáveis**:

| Alternativa | O que muda | Custo | Benefício |
|---|---|---|---|
| **OO com DI** (NestJS, ou um container próprio) | o registro explícito que substitui as 38 funções substituíveis e os 4 *drop-ins* já é, de fato, um container | o legado declara **não ter** DI ([`architecture.md`](../architecture.md) §2.2): adotá-la é desenho novo em 216 arquivos | é a única forma de reproduzir *drop-in* e `pluggable` com verificação em tempo de *build* |
| **Funcional leve** (funções puras + tipos, sem classe) | casa com o recorte procedural do legado e com os 2.460 filtros, que já são transformação de valor | perde os bolsões OO (47 controllers, 4 implementações de sistema de arquivos) que hoje usam herança | o filtro do legado **é** uma função pura de valor → valor; é a tradução mais direta que existe |
| **Procedural assíncrono** (sem classe e sem container, só módulos) | mais próximo da forma atual | não resolve nem os ciclos de módulo nem o estado global; herda os dois problemas | menor distância conceitual para quem escreveu o legado |

> ⚠️ Nenhuma dessas alternativas remove a assincronia: ela é do runtime, não do estilo. **Qualquer** alvo
> em TypeScript paga as implicações 2, 5 e 6 da seção seguinte.

---

## Gap identificado

- **Severidade**: **alto** — e por duas causas independentes que se somam.

A linha do catálogo que se aplica é `procedural → event-driven`: *"sincronia → assincronismo; resposta
deixa de ser imediata; tratamento de erro vira retry/DLQ; idempotência obrigatória; ordem de eventos passa
a importar"* (`references/paradigm-catalog.md` § *Tabela de gaps típicos por par*). A segunda causa **não
está no catálogo**: o legado apoia o seu estado global no fato de o processo morrer no fim da resposta, e
nenhuma linha do catálogo cobre isso.

- **Implicações concretas** (cada uma com exemplo deste sistema, citando o artefato):

### Implicação 1 — O barramento deixa de devolver valor, e 2.460 pontos dependem de que ele devolva

No legado, 69,7% do gancho devolve valor e o chamador usa o retorno na mesma expressão: 2.460
`apply_filters` contra 1.068 `do_action` ([`refactor/architectures.md`](../refactor/architectures.md) §2).
Exemplo do próprio sistema: a regra **C11** de [`domain.md`](../domain.md) §2.2 — "comentário em post
antigo fecha sozinho" — reescreve `comment_status` e `ping_status` para `closed` **em memória, e o banco
não muda**. É um filtro alterando um valor em trânsito, e o efeito observável existe só porque o retorno
volta ao chamador. No paradigma alvo, um evento publicado não devolve nada ao emissor. Tornar o filtro
assíncrono obriga todo chamador a `await` — e `await` no meio dos 1.463 `echo`/`print` muda a **ordem de
emissão do HTML**, que é saída observável.

### Implicação 2 — Estado global deixa de ser escopo de requisição e passa a ser escopo de processo

É a implicação mais grave da travessia, e a que nenhum artefato anterior registrou como risco de
paradigma. No legado o processo é "montado do zero por `wp-settings.php` e descartado no fim da resposta"
([`architecture.md`](../architecture.md) §1), logo `$wpdb`, `$wp_query`, `$wp_filter` e `$current_user`
são, **de fato**, variáveis de requisição — são 1.121 `global $` e 3.410 usos de superglobal em 216
arquivos ([`refactor/architectures.md`](../refactor/architectures.md) §2). Numa runtime assíncrona e
longo-viva, o mesmo módulo atende N requisições concorrentes e esse estado passa a ser **compartilhado**.
Exemplo concreto: `current_user_can` aparece 1.279 vezes em 224 arquivos (mesma fonte); se a identidade
corrente virar estado de módulo, duas requisições concorrentes trocam de identidade entre si — e
[`permissions.md`](../permissions.md) descreve três camadas paralelas de autorização, uma delas falhando
**aberta**. Nenhum dos 985 testes de [`backlog/tests.md`](../backlog/tests.md) apanha isso: todos
descrevem uma requisição por vez.

### Implicação 3 — A cascata de moderação é curto-circuito; coreografia de eventos não tem curto-circuito

[`domain.md`](../domain.md) §2.2 é explícito: é "a área de maior densidade de regra de negócio do
sistema", com 13 regras em que "a ordem de avaliação importa, e cada etapa pode **encerrar** a decisão".
**C4**: com `comment_moderation = '1'`, `check_comment()` retorna falso na primeira linha e *"nenhuma
outra regra é consultada"*. **C3**: o comentário do autor do post ou de quem tem `moderate_comments` entra
aprovado *"sem passar por nenhuma verificação"*. **C1** devolve HTTP 409 e **C2** HTTP 429, na mesma
resposta ao visitante. [`architecture.md`](../architecture.md) §9 risco 10 classifica isso como regra que
não cabe em constraint. Publicar `comentario.submetido` e deixar 13 *handlers* reagirem perde as duas
propriedades que **são** a regra: a ordem e o encerramento. E o 409/429 deixa de existir, porque a
resposta vira 202.

### Implicação 4 — `WP_Error` como valor de retorno vira retry/DLQ, e o legado tem política de retry própria e observável

O legado não usa exceção para falha de negócio: [`domain.md`](../domain.md) §2.5 **D3** — "falha de envio
de e-mail é **estado**, não exceção": a solicitação vai para `request-failed` e pode ser reenviada. E a
política de nova tentativa é escrita à mão, caso a caso, com efeito visível: §2.6 **A6** — "falha
transitória tem **exatamente uma** segunda chance, em uma hora… e **não** notifica; só a segunda falha
manda e-mail"; **A5** — falha crítica **congela** a atualização automática até intervenção humana
([ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md)); **A7** — "o mesmo
aviso não é repetido". O `retry` genérico de uma fila sobrepõe a sua própria política e muda **quantos
e-mails o administrador recebe** — comportamento observável. Quem tratar isso como "o broker resolve"
quebra ADR-0008 e A7 de uma vez.

### Implicação 5 — Os 254 ciclos de dois módulos atravessam de graça em `require`; em módulo ESM, não

[`refactor/architectures.md`](../refactor/architectures.md) §2: **68 dos 71 módulos formam um único
componente fortemente conexo (95,8%)**, com **254 ciclos de dois módulos** dentro dele. No legado isso não
dói, porque o carregamento é por `require`/`include` — 1.342 em 282 arquivos — com 176 guardas
`function_exists`, e a ordem de carregamento é contrato público
([`architecture.md`](../architecture.md) §4.1 D1). Num sistema de módulos real — que é exatamente o ganho
que [`refactor/architectures.md`](../refactor/architectures.md) §5 atribui ao TypeScript, *"a regra de
dependência é verificável no build"* — uma importação circular lida na avaliação do módulo é **erro de
inicialização**, não aviso. O ciclo deixa de ser dívida de estilo e passa a ser bloqueio de execução. É o
que [`architecture.md`](../architecture.md) §9 risco 2 descreve como "nenhum pedaço compila sozinho".

### Implicação 6 — "Idêntico" passa a depender de onde se põe o `await` — e há um caso em que o alvo acerta demais

No legado toda a I/O é bloqueante e vive no meio do fluxo sem cerimônia: 949 chamadas `$wpdb->` em 86
arquivos, mais 15 `fsockopen` em 10 arquivos, PHPMailer, PCLZip, phpass e POP3
([`refactor/architectures.md`](../refactor/architectures.md) §2 e §6). Em TypeScript cada uma vira
`Promise` e a assincronia **contamina** todos os chamadores. O ponto que decide comportamento observável:
o *loopback* e o `wp-cron` são disparos **deliberadamente** não bloqueantes — *timeout* 0,01 s, `blocking`
falso, `sslverify` falso ([`domain.md`](../domain.md) §2.6 A9, [`questions.md`](../questions.md) P10). Em
PHP, isso **aborta** a requisição de saída. Numa runtime assíncrona, o laço de eventos continua vivo
depois da resposta e a requisição pode **completar**. O comportamento que a Pergunta 10 manda preservar —
*"um site que ninguém administra nunca executa a própria limpeza"*, ADR-0006 e
[`domain.md`](../domain.md) §2.4 R5 — depende de o disparo **falhar**, não de ele ser rápido. Um porte
fiel aqui precisa reproduzir a falha, não a intenção.

### Implicação 7 — As 38 funções substituíveis e os 4 *drop-ins* não têm equivalente em módulo ESM

[`refactor/architectures.md`](../refactor/architectures.md) §4 já apurou: *"TypeScript não permite
redefinir função importada, então o que hoje é **ausência de código** vira registro explícito"* — 38
funções em `pluggable.php` e 176 guardas `function_exists` em 67 arquivos. O mesmo vale para os 4
*drop-ins* de [`domain.md`](../domain.md) §1.6 (`advanced-cache.php`, `object-cache.php`,
`fatal-error-handler.php`, `blog-deleted.php`), que **substituem um componente inteiro do núcleo pela
simples presença de um arquivo**. E [`questions.md`](../questions.md) P3 responde que esse ponto de
extensão **é o produto**, não acidente de implementação. Consequência de paradigma: o alvo compra
injeção de dependência **por necessidade**, não por gosto — e é precisamente o que
[`architecture.md`](../architecture.md) §2.2 registra que o legado não tem.

### Implicação 8 — Sem transação a quebrar, a sequência de 7 passos vira saga sem compensação

[`refactor/architectures.md`](../refactor/architectures.md) §2.2: **zero `START TRANSACTION`, zero
`COMMIT`, zero `FOREIGN KEY`** em toda a árvore. Apagar um post são **7 passos sequenciais em PHP**
atravessando 4 tabelas, com semântica deliberada de **reparentamento** — página filha e anexo vão para o
avô, não são apagados — e **3 contadores desnormalizados** costurando os domínios candidatos, um deles
com dois critérios de cálculo diferentes. [`architecture.md`](../architecture.md) §6 registra que FK com
`ON DELETE CASCADE` no destino **muda** o comportamento observável. Se esses passos virarem eventos, a
sequência sem proteção passa a ser **saga sem compensação** — e o legado não tem lógica de compensação
porque nunca precisou de uma.

> **Onde o gap é zero, e isso também é achado:** o lado cliente dos 5 módulos do editor já é
> JavaScript/TypeScript na origem ([`questions.md`](../questions.md) P15: *"o fonte do editor de blocos e
> da Interactivity API já é JavaScript/TypeScript e é dele que o porte parte"*). Para esse recorte não há
> mudança de paradigma: há **adoção do paradigma que o upstream já tem**. O gap deste documento é do
> servidor, não do sistema inteiro. 🟢

---

## Opções apresentadas ao usuário

As três opções estão em [`pending_decisions.md`](pending_decisions.md) com campo de resposta. Repetidas
aqui porque este artefato é o de leitura obrigatória.

### 1. Adotar o paradigma natural da stack — event-driven assíncrono (transformacional)

- O barramento de 3.373 ganchos vira emissor de eventos assíncrono: os 2.460 filtros que devolvem valor
  **perdem o retorno** (implicação 1) e viram, no melhor caso, *middleware* com contrato novo.
- A cascata de 13 regras de moderação vira coreografia: perde ordem e curto-circuito; o visitante recebe
  202 em vez de 409/429 (implicação 3).
- `wp-cron` vira fila ou *worker* de verdade; a consequência que a Pergunta 10 chama de comportamento do
  produto — site sem visita nunca limpa a própria lixeira — **desaparece** (implicação 6).
- Retry e DLQ do broker substituem A5, A6 e A7, mudando quantos e-mails o administrador recebe
  (implicação 4).
- As 7 etapas de exclusão de post precisam de compensação escrita de zero (implicação 8).
- **Colide frontalmente com decisão humana já registrada.** [`refactor/architectures.md`](../refactor/architectures.md)
  §3 pontua `event-driven` com `fit` **14** e `serverless` com **7** — e declara que o motivo não é o
  grafo: é o portão de refinamento, que mede quanto do valor do estilo depende de mudar comportamento
  observável, justamente o que as 23 respostas proibiram.

### 2. Forçar paradigma similar ao legado — procedural síncrono sobre runtime assíncrona (conservador)

- **Como simular**: barramento síncrono, ordenado por prioridade e **reentrante**, com retorno de valor;
  contexto por requisição explícito (`AsyncLocalStorage` ou parâmetro) para recriar o escopo que no PHP
  vinha de graça (implicação 2); `await` empurrado para as bordas, de modo que o domínio permaneça
  síncrono; registro explícito substituindo `pluggable` e *drop-in* (implicação 7); ciclos de módulo
  resolvidos por núcleo compartilhado ou injeção tardia (implicação 5).
- **Custo idiomático**: o resultado **não** se parece com TypeScript idiomático. Nenhum ORM, nenhum
  framework com DI, nenhuma fila — a camada de dados reproduz 9 classes montando SQL por fragmento com um
  filtro entre cada fragmento, porque esses filtros são contrato de extensão
  ([`architecture.md`](../architecture.md) §9 risco 5).
- **Perda de ecossistema**: as bibliotecas que o alvo oferece de graça resolvem problemas que este porte
  é obrigado a resolver **diferente** para manter o comportamento.
- **Dívida herdada de propósito, e nomeada**: pacote instalado sem assinatura verificada (P11,
  [ADR-0010](../adrs/0010-tolerar-pacote-sem-assinatura-verificada.md)), rebaixamento para HTTP nos 13
  canais (P12), enumeração de contas na mensagem de login (P6), troca de senha que não revoga sessão (P7).
- **É a única opção em que "comportamento observável idêntico" é alcançável** — e é o que as 23 respostas
  do [`questions.md`](../questions.md) já pedem, item por item. `fit` **86** em
  [`refactor/architectures.md`](../refactor/architectures.md) §3.

### 3. Híbrido (equilibrado)

- **Adotar o natural nas cinco bordas que o porte é obrigado a trocar de qualquer forma**:
  [`refactor/architectures.md`](../refactor/architectures.md) §3 fala em *"as cinco bordas"* e §6 as lista
  — `mysqli` por *driver* TypeScript, os 15 `fsockopen` por socket de outra runtime, PHPMailer, PCLZip,
  phpass e POP3 — *"o porte é obrigado a trocar toda essa infraestrutura, quer alguém chame de hexagonal
  ou não"*. Nessas bordas o código é assíncrono por dentro e apresenta fachada síncrona para o domínio.
- **Mas o modo de falha dessas bordas é requisito, não acidente**:
  [`refactor/architectures.md`](../refactor/architectures.md) §6 avisa que os 5 achados de segurança do
  `integrations.json` vivem exatamente ali, e que *"um adaptador bem escrito os conserta por acidente e
  quebra o critério de idêntico"*. Adaptador novo precisa reproduzir a falha de propósito.
- **Manter o legado no que é comportamento observável**: barramento de hooks, ordem de arranque, cascata
  de moderação, agendador por requisição, as 4 superfícies de escrita (P14).
- **Ganhar estrutura interna de efeito observável zero**: declarar o núcleo compartilhado de **12
  módulos** que [`refactor/architectures.md`](../refactor/architectures.md) §2.1 mediu — o acoplamento
  par-a-par cai de 35,0% para **8,4%**, com 175 arestas núcleo→domínio como dívida explícita. O preço
  declarado: admitir que `posts-e-tipos-de-conteudo` e `telas-do-painel` são núcleo, não domínio.
- **Onde a borda fica**: a fronteira é entre *comportamento observável* (conservador) e *estrutura
  interna* (natural). Toda decisão de borda tem o mesmo teste: muda a saída HTTP, o efeito no banco ou o
  comportamento de caso de uso? Se não muda, pode ser idiomático.
- **A dúvida que esta opção herda e não fecha**:
  [`refactor/architectures.md`](../refactor/architectures.md) §8 item 6 registra que *ninguém declarou o
  critério de aceite de "idêntico"* — saída HTTP byte a byte, efeito no banco, ou comportamento de caso de
  uso. Sem esse critério, a fronteira da opção 3 não é verificável. Está em
  [`pending_decisions.md`](pending_decisions.md) § *Decisão 2*.

**Pergunta ao usuário: qual opção você escolhe?** → [`pending_decisions.md`](pending_decisions.md)

---

## Decisão do usuário

- **Escolha**: 🟢 **Opção 3 — HÍBRIDO** (`derived_appetite: balanced`).
- **Justificativa do usuário**: o alvo é o WordPress em si, reescrito em TypeScript, e o critério é **regra
  idêntica, não forma idêntica**. A fronteira é a que a própria Opção 3 declara: comportamento observável
  fica conservador, estrutura interna fica idiomática, e toda decisão de borda passa pelo mesmo teste —
  muda a saída HTTP, o efeito no banco ou o comportamento de caso de uso? Recusou-se a Opção 2 porque
  forçar procedural com estado global reproduz a FORMA do PHP, e nenhuma das 23 respostas pediu forma —
  pediram comportamento. Recusou-se a Opção 1 porque ela desfaz item por item o que as 23 respostas
  decidiram (`fit` 14 contra 86).
- **O que esta escolha NÃO afrouxa** — vale como contrato para todo agente posterior: barramento de hooks
  síncrono, reentrante, ordenado por prioridade inteira e **com retorno de valor**; ordem de arranque como
  contrato público; cascata de 13 regras de moderação **com curto-circuito**; agendador por requisição ao
  próprio host, inclusive a consequência de que site sem visita não limpa a própria lixeira; as 4
  superfícies de escrita da P14; as 38 funções substituíveis e os 4 *drop-ins*, por registro explícito.
- **A armadilha das 5 bordas, aceita de propósito**: `mysqli`, os 15 `fsockopen`, PHPMailer, PCLZip e
  phpass são trocados de qualquer forma, e é ali que vivem os 5 achados de segurança do
  `integrations.json`. O adaptador novo **reproduz o modo de falha de propósito** — um adaptador bem
  escrito os conserta por acidente e quebra o critério de idêntico. Onde o conserto for desejado, ele é
  decisão separada e registrada, nunca efeito colateral de reescrita.
- **Critério de aceite de "idêntico"** (Decisão 2, respondida junto): **combinação por área**. Byte a byte
  no contrato de terceiro (REST, XML-RPC, feeds, *sitemaps*, oEmbed) e no valor devolvido por hook; efeito
  no banco no esquema e nas escritas, incluindo a cascata de 7 etapas e os órfãos que o legado deixa de
  propósito; comportamento de caso de uso no HTML de tema e painel; e **um teste próprio para estado entre
  requisições concorrentes**, porque os 47 UCs não descrevem concorrência e é exatamente ali que a
  implicação 2 passaria sem ser vista.
- **Decidido em**: 2026-10-06, pelo gate `paradigm` do Luby Studio Legado (resposta de 2.468 caracteres
  gravada no run `run_muvp9wahprbsns`), e replicada em [`pending_decisions.md`](pending_decisions.md).

> ✍️ **Esta seção foi escrita fora do gerador.** A § *Decisão do usuário* e a § *Apetite derivado* foram
> atualizadas a partir da resposta do gate, porque seis skills posteriores leem este arquivo como leitura
> obrigatória e ele continuaria dizendo `PENDENTE` até `/reversa-migrate` rodar de novo. O `hash` do
> *front matter* corresponde ao corpo gerado, **não** a este acréscimo. O resto do documento está intacto.

### Hipótese de trabalho até a resposta chegar (não é a decisão)

Os agentes posteriores não podem ficar sem chão, então fica registrado o que a **evidência já gravada**
aponta — com a proveniência, para que seja contestável:

- **Opção provável: 2 (conservador).** As 23 respostas do [`questions.md`](../questions.md) foram
  preenchidas por uma pessoa e dizem "porte idêntico" item por item: P10 recusa trocar o agendador
  (*"trocar por agendador do sistema produz um produto que se comporta diferente no primeiro dia"*), P11
  mantém o pacote sem assinatura verificada, P12 mantém o rebaixamento para HTTP, P14 mantém as quatro
  superfícies de escrita, P7 manda portar até duas funções definidas e sem nenhum chamador (*"existir sem
  ser chamada é parte do que se clona"*), P8 e P9 recusam acrescentar prazo e lixeira que o legado não tem.
- **E há uma ressalva que a própria análise registrou**: as mesmas respostas abrem exceção explícita ao
  idêntico — P18 manda definir o tempo limite no adaptador de IA em vez de herdar o default curto, e P13
  manda portar o envio do classificador externo **com minimização** (ver Nota 6 sobre o escopo de cada
  uma). Ou seja: a pessoa que respondeu **não** tratou "idêntico" como absoluto. Isso é compatível com a
  opção 2 **e** com a opção 3, e é exatamente por isso que a escolha não pode ser deduzida: a diferença
  entre 2 e 3 está em quantas exceções são admitidas, e só quem decide sabe.
- **Por que isso não é a decisão**: nenhuma das 23 perguntas perguntou sobre paradigma. Elas decidiram
  *comportamento*; o paradigma é *como* esse comportamento é obtido na stack nova, e as implicações 2, 5,
  6 e 7 deste documento mostram que manter o comportamento **não** implica manter a forma.

---

## Apetite derivado

- `derived_appetite`: **`balanced`** — 🟢 **DEFINITIVO** (Opção 3, decidida no gate `paradigm`)

| | |
|---|---|
| Valor decidido | `balanced` — era `conservative` como hipótese de trabalho, substituída pela escolha declarada |
| De onde vem | hipótese de trabalho acima, derivada das 23 respostas de [`questions.md`](../questions.md); **não** de escolha declarada |
| Quando vira definitivo | quando [`pending_decisions.md`](pending_decisions.md) for respondido. Opção 1 → `transformational` · opção 2 → `conservative` · opção 3 → `balanced` |
| O que o agente posterior deve fazer | tratar como hipótese e **declarar** essa dependência nos seus próprios artefatos; não gravar decisão irreversível que só se justifique por este valor |

---

## Implicações pendentes para próximos agentes

Uma linha por implicação da seção *Gap identificado*. Este é o contrato que os próximos agentes cumprem.

| Agente | Implicação | Como honrar |
|---|---|---|
| **Curator** | 1 — o barramento devolve valor em 69,7% dos casos | classificar cada um dos 2.460 pontos de filtro como **contrato de extensão a preservar** e não como detalhe de implementação; P3 diz que o ponto de extensão é o produto |
| **Curator** | 7 — 38 funções substituíveis, 176 guardas `function_exists`, 4 *drop-ins* | inventariar as três formas de substituição como **requisito funcional**, com o critério de o que conta como "substituível" no alvo; não deixar isso virar decisão silenciosa de implementação |
| **Curator** | 8 — zero transação, 3 contadores desnormalizados, cascata que reparenteia | marcar as 7 etapas de exclusão de post e os 3 contadores como **comportamento observável**, não como dívida de modelagem |
| **Strategist** | 5 — 254 ciclos de dois módulos, 68 de 71 num só SCC | a ordem de migração **não existe dentro do ciclo**: a sequência viável é as 2 raízes (`hooks-e-plugin-api`, `html-api`), o ciclo inteiro como unidade e as 3 pontas de consumo. Se a estratégia propuser fatias do ciclo, declarar como resolve o ciclo ESM |
| **Strategist** | 6 — o disparo não bloqueante depende de **falhar** | pôr o agendador e o *loopback* numa fatia própria, com critério de aceite que verifique a falha, e não a latência. 4 implementações independentes do mesmo protocolo de *loopback* precisam de decisão única |
| **Strategist** | 4 — política de retry escrita à mão, com efeito em e-mail | não adotar retry de infraestrutura antes de mapear A5, A6, A7 e ADR-0008; o número de e-mails ao administrador é critério de aceite |
| **Designer** | 2 — estado global vira estado de processo | o desenho precisa de **contexto por requisição explícito** antes de qualquer módulo de domínio. É pré-requisito, não refinamento: toca os 216 arquivos com superglobal e os 224 com `current_user_can` |
| **Designer** | 3 — cascata com ordem significativa e curto-circuito | desenhar a moderação como **cadeia síncrona de curto-circuito** com ordem declarada, preservando 409 e 429 na mesma resposta; não como *pipeline* de eventos |
| **Designer** | 1 e 6 — assincronia contamina o chamador | declarar a **fronteira de `await`**: onde o código é assíncrono e onde o domínio permanece síncrono. Sem essa linha, a ordem de emissão de HTML muda em lugar que nenhum teste de caso de uso apanha |
| **Screen Translator** | 2 e 3 — identidade e autorização por requisição | as ~100 telas do painel e as 4 superfícies de escrita (P14, inclusive `admin-ajax.php`, *"por onde metade do painel conversa"*) dependem de identidade correta por requisição; traduzir tela sem o contexto da implicação 2 produz vazamento de sessão entre usuários |
| **Screen Translator** | 🔴 lacuna F — lado cliente ausente | os 5 módulos do editor não têm JavaScript nesta árvore (A-4). P15 manda partir do fonte upstream, que **já é TypeScript**: para esse recorte não há tradução de paradigma, há adoção. Declarar isso em vez de inventar o lado cliente |
| **Inspector** | todas as 8 | nenhuma implicação é verificável sem oráculo: P16 manda levantar instalação executável do legado na mesma versão, porque *"sem execução do legado, equivalência é afirmada e não verificada"*. Os 985 testes de [`backlog/tests.md`](../backlog/tests.md) são especificação, não evidência |
| **Inspector** | 2 — concorrência | **nenhum** dos 985 testes exercita duas requisições concorrentes. Inspeção de paridade que rode uma requisição por vez **não detecta** a implicação 2. Exige caso de teste novo, de concorrência, que o backlog não tem |

---

## Notas

**Para o agente de codificação, em uma frase:** o alvo é *procedural síncrono com barramento de valor*
sobre uma runtime que é *assíncrona e longo-viva* — logo as duas coisas que o legado ganhava de graça
(ordem síncrona e estado morrendo com a requisição) passam a ser **trabalho explícito**, e é aí que
"idêntico" se decide.

1. **Pré-requisito não cumprido, registrado e não contornado por invenção.** `migration_brief.md` não
   existe. Objetivo, métricas de sucesso, prazo, orçamento, *stakeholders* e escopo declarado da migração
   **não foram lidos de lugar nenhum** — não há substituto para eles neste pacote. A stack alvo foi
   extraída de resposta humana já gravada ([`questions.md`](../questions.md) P15), e o que falta está em
   [`pending_decisions.md`](pending_decisions.md). O orquestrador `/reversa-migrate` conduz esse brief.

2. **Divergência de configuração, registrada porque muda o comportamento desta etapa.**
   `.reversa/config.toml` declara `answer_mode = "chat"` e `doc_level = "completo"`;
   `.reversa/state.json` declara `answer_mode = "file"` e `doc_level = "detalhado"`. Esta etapa seguiu o
   `state.json`, como a instrução de execução determina — e é o `answer_mode = file` que faz a decisão
   ficar em arquivo em vez de ser coletada em conversa.

3. **O paradigma do alvo não está decidido por escolher TypeScript.** O catálogo põe NestJS em *OO com
   DI* e Fastify/Express em *event-driven leve*, e a implicação 7 mostra que o porte precisa de um
   registro que é, na prática, um container. Se o framework for escolhido depois, a escolha vai **decidir
   retroativamente** parte do paradigma. Vale decidir junto.

4. **O gap não é uniforme.** Servidor: gap alto (procedural síncrono → event-driven assíncrono). Lado
   cliente dos 5 módulos do editor: gap **nenhum**, porque o fonte upstream já é TypeScript. Camada
   declarativa (`theme.json`, `block.json`, Interactivity API): já é *dataflow* e atravessa quase sem
   atrito. Quem tratar o sistema como um bloco único paga três vezes o mesmo imposto.

5. **O teto de confiança desta análise não se move com esta etapa.**
   [`questions.md`](../questions.md) § *O que fica 🔴 mesmo com todas as respostas* lista quatro itens, e
   dois incidem direto nas implicações deste documento: **zero arquivos de teste em 3.378** (nenhuma
   equivalência antes/depois é verificável por execução) e **`wp-includes/js/dist/` ausente** (metade do
   comportamento de 5 módulos). A implicação 2 é a mais perigosa justamente porque é a que menos aparece
   em teste de caso de uso.

6. **As exceções ao "idêntico" já autorizadas por escrito — e uma divergência entre artefatos.** Os
   agentes posteriores devem tratá-las como precedente declarado, não como desvio:
   - **P18** — definir o tempo limite no adaptador de IA em vez de herdar o default curto. É exceção
     **incondicional e dentro do núcleo**. [`refactor/architectures.md`](../refactor/architectures.md) §6
     chama este de *"o único ponto em que a resposta humana manda corrigir"* e pede que seja registrado
     **como exceção, para não virar precedente**.
   - **P13** — portar o envio ao classificador externo de comentário **com minimização**, porque
     reproduzir o envio integral recriaria transferência internacional de dado pessoal de terceiro sem
     base legal. É exceção **condicional e fora do núcleo**: a mesma resposta tira o Akismet do clone
     ("extensão empacotada, não núcleo") e a minimização só vale *se e quando* ele for portado.
   - **A divergência, registrada e não silenciada**: chamar P18 de "único ponto" é verdade **para o
     núcleo**; contando o que está fora dele, são duas. Nenhuma das duas leituras está errada — elas
     contam escopos diferentes, e vale saber qual se está usando.
   - O argumento é o mesmo nas duas: *é defeito conhecido do legado, não regra do produto*. Esse é o
     **teste** que separa exceção legítima de conveniência.

7. **Lacuna 🔴 que esta etapa abriu e não pode fechar:** ninguém declarou o **critério de aceite de
   "idêntico"** — saída HTTP byte a byte, efeito no banco, ou comportamento de caso de uso.
   [`refactor/architectures.md`](../refactor/architectures.md) §8 item 6 registra que isso muda o prazo
   das três propostas na mesma proporção, logo não muda o *ranking* delas; mas **muda sim** a fronteira da
   opção 3 deste documento, porque é o teste que decide o que pode ser idiomático. Está em
   [`pending_decisions.md`](pending_decisions.md) § *Decisão 2*.

8. **Esta etapa não leu uma linha do código do legado**, como o SKILL manda. Todas as citações apontam
   para artefato e seção do `_reversa_sdd/`. Onde um número aparece (2.460 filtros, 1.121 `global $`, 254
   ciclos), ele vem medido por [`refactor/architectures.md`](../refactor/architectures.md) §2 ou
   [`inventory.md`](../inventory.md) §2.4, com script reproduzível declarado na fonte.

9. **Nada fora de `_reversa_sdd/migration/` foi modificado ou apagado.** Os dois arquivos desta pasta
   foram criados por esta execução; o rascunho de trabalho está em
   `.reversa/work/reversa-paradigm-advisor/`.
