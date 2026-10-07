---
schemaVersion: 1
generatedAt: 2026-10-06T17:52:31-03:00
reversa:
  version: "1.0.0"
kind: pending_decisions
producedBy: paradigm_advisor
hash: "sha256:86b6162fe03bdf50d23ee653e345f9acb2ec39fdedf6f56f8bb8a1c5213eeefd"
---

# Decisões pendentes — Paradigm Advisor

> Gerado pelo **Paradigm Advisor** em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> Sistema analisado: **wordpress 7.1.2**
>
> Este arquivo existe porque `state.json.answer_mode` é **`file`**: esta execução rodou sem chat
> interativo, e o caso de borda *"Engine sem chat interativo"* do SKILL manda escrever as três opções e
> aguardar leitura. **Nenhuma decisão foi tomada em nome de ninguém.**

O raciocínio completo, com as 8 implicações concretas e a evidência de cada uma, está em
[`paradigm_decision.md`](paradigm_decision.md). Este arquivo é só o formulário.

**Como responder:** preencha o campo **Resposta** de cada bloco e rode `/reversa-migrate` de novo (ou
`/reversa-paradigm-advisor`). A resposta da Decisão 1 é a que destrava o Curator.

---

## O resumo de uma tela, para decidir sem reler tudo

| | |
|---|---|
| **Paradigma do legado** | híbrido: **procedural dominante** com barramento de eventos **síncrono**, OO clássico em bolsões — 🟢 |
| **Stack alvo** | **TypeScript** — 🟡 (declarada em [`questions.md`](../questions.md) P15, **não** em um brief) |
| **Paradigma natural do alvo** | **event-driven assíncrono** (as duas linhas de TypeScript do catálogo convergem) |
| **Gap** | **alto**, por duas causas somadas: sincronia → assincronismo, **e** processo por requisição → processo longo-vivo |
| **A pegadinha** | o legado **parece** event-driven (3.373 ganchos), mas 69,7% do gancho **devolve valor**, a ordem é determinística e o processo morre no fim da resposta. Mesmo nome, semântica oposta |

---

## Decisão 1 — Como tratar o gap de paradigma

**Pergunta: qual opção você escolhe?**

### Opção 1 — Adotar o paradigma natural da stack (transformacional)

Event-driven assíncrono, idiomático em TypeScript.

- O barramento perde o retorno: os 2.460 pontos de filtro deixam de devolver valor ao chamador.
- A cascata de 13 regras de moderação perde ordem e curto-circuito; o visitante recebe 202 em vez de
  409/429.
- `wp-cron` vira fila ou *worker* real — e o comportamento "site sem visita nunca limpa a própria
  lixeira" **desaparece**.
- O retry do broker substitui a política escrita à mão (A5, A6, A7) e muda quantos e-mails o
  administrador recebe.
- As 7 etapas de exclusão de post precisam de compensação escrita de zero.
- **Conflito declarado:** colide com as 23 respostas já gravadas no
  [`questions.md`](../questions.md). `fit` **14** em
  [`refactor/architectures.md`](../refactor/architectures.md) §3 — e o documento diz que o motivo não é o
  grafo, é o portão que mede dependência de mudar comportamento observável.
- `derived_appetite` resultante: **`transformational`**

### Opção 2 — Forçar paradigma similar ao legado (conservador)

Procedural síncrono com barramento de valor, rodando sobre runtime assíncrona.

- Barramento síncrono, ordenado por prioridade, reentrante e com retorno de valor.
- **Contexto por requisição explícito** (`AsyncLocalStorage` ou parâmetro) para recriar o escopo que no
  PHP vinha de graça — é a tarefa que toca os 216 arquivos com superglobal e os 224 com
  `current_user_can`.
- `await` empurrado para as bordas; o domínio permanece síncrono.
- Registro explícito substituindo as 38 funções substituíveis, as 176 guardas `function_exists` e os 4
  *drop-ins*.
- **Custo:** o resultado não é TypeScript idiomático. Nenhum ORM, nenhum framework com DI, nenhuma fila.
  Dívida herdada de propósito: pacote sem assinatura verificada (P11), rebaixamento para HTTP (P12),
  enumeração de contas no login (P6).
- **É a única opção em que "comportamento observável idêntico" é alcançável**, e é o que as 23 respostas
  já pedem item por item. `fit` **86**.
- `derived_appetite` resultante: **`conservative`**

### Opção 3 — Híbrido (equilibrado)

Conservador no comportamento observável, natural na estrutura interna.

- **Natural nas cinco bordas que o porte troca de qualquer forma** (`mysqli`, os 15 `fsockopen`,
  PHPMailer e POP3, PCLZip, phpass): assíncronas por dentro, fachada síncrona para o domínio. Ressalva do
  próprio artefato de arquiteturas: *"um adaptador bem escrito conserta por acidente"* os 5 achados de
  segurança que vivem nessas bordas — e P11 e P12 mandam **preservá-los**.
- **Legado no que é observável**: barramento de hooks, ordem de arranque, cascata de moderação,
  agendador por requisição, as 4 superfícies de escrita.
- **De graça**: o núcleo compartilhado de 12 módulos medido em
  [`refactor/architectures.md`](../refactor/architectures.md) §2.1 — acoplamento par-a-par cai de 35,0%
  para **8,4%**, efeito observável zero. Preço: admitir que `posts-e-tipos-de-conteudo` e
  `telas-do-painel` são núcleo, não domínio.
- **Teste de borda**: muda a saída HTTP, o efeito no banco ou o comportamento de caso de uso? Se não
  muda, pode ser idiomático.
- **Depende da Decisão 2**: sem o critério de aceite de "idêntico", a fronteira desta opção não é
  verificável.
- `derived_appetite` resultante: **`balanced`**

**Escolha (1 / 2 / 3):** **3 — Híbrido**

**Justificativa:** O alvo do porte é o WordPress em si, reescrito em TypeScript, e o critério é regra
idêntica — não forma idêntica. A fronteira é a que a própria Opção 3 declara: comportamento observável
fica conservador, estrutura interna fica idiomática, e o teste de toda decisão de borda é "muda a saída
HTTP, o efeito no banco ou o comportamento de caso de uso?".

Por que não a 2: forçar procedural com estado global numa runtime assíncrona reproduz a FORMA do PHP, e
nenhuma das 23 respostas pediu isso — elas pediram comportamento. Manter `$wpdb` global e 9 classes
montando SQL por fragmento não torna o sistema mais idêntico; torna o porte mais caro e menos verificável.

Por que não a 1: ela desfaz o que as 23 respostas decidiram item por item — o filtro que devolve valor
(2.460 pontos), o curto-circuito da cascata de moderação, o cron disparado por requisição. `fit` 14 contra
86 não é preferência de estilo, é medição.

**O que esta escolha NÃO afrouxa**, e precisa estar escrito para o agente seguinte: barramento de hooks
síncrono, reentrante, ordenado por prioridade inteira e com retorno de valor; ordem de arranque como
contrato público; cascata de 13 regras de moderação com curto-circuito; agendador por requisição ao
próprio host, com a consequência de que site sem visita não limpa a própria lixeira; as 4 superfícies de
escrita da P14; e as 38 funções substituíveis e 4 drop-ins, por registro explícito.

**E a armadilha das 5 bordas, nomeada:** `mysqli`, os 15 `fsockopen`, PHPMailer, PCLZip e phpass são
trocados de qualquer forma, e é exatamente ali que vivem os 5 achados de segurança. Adaptador novo
reproduz o modo de falha DE PROPÓSITO — um adaptador bem escrito os conserta por acidente e quebra o
critério de idêntico. Onde o conserto for desejado, ele é decisão separada e registrada, não efeito
colateral de reescrita.

**Resposta:** Opção 3 — híbrido. Ver a justificativa acima e o critério de aceite na Decisão 2, que é o
que torna a fronteira desta opção verificável.

---

## Decisão 2 — O critério de aceite de "idêntico"

**Contexto:** [`refactor/architectures.md`](../refactor/architectures.md) §8 item 6 registra, como dúvida
aberta e não fechada, que **ninguém declarou o que "idêntico" significa**. Ali isso muda o prazo das três
propostas na mesma proporção, logo não muda o *ranking*. Aqui **muda sim** a resposta: é o teste que
decide o que pode ser idiomático e o que não pode, e é por isso que a Opção 3 depende dele.

**Pergunta:** qual é o critério?

| | Critério | O que ele admite |
|---|---|---|
| a | **Saída HTTP byte a byte** | quase nada pode ser idiomático: a ordem de emissão do HTML entra no contrato (implicação 1) |
| b | **Efeito no banco** | a forma interna fica livre; a ordem de emissão, não garantida |
| c | **Comportamento de caso de uso** (os 47 UCs de [`use-cases/`](../use-cases/)) | o mais permissivo — e o que **não detecta** a implicação 2, porque nenhum caso de uso descreve duas requisições concorrentes |
| d | combinação por área | exige dizer qual área usa qual |

**Impacto:** P16 já respondeu que haverá instalação executável do legado como oráculo. O critério é o que
define **o que se compara** nesse oráculo. Sem ele, "idêntico" é afirmado e não verificado — exatamente a
ressalva que P16 levantou.

**Resposta:** **(d) combinação por área.** A divisão, para ser testável contra o oráculo da P16:

| Área | Critério | Por quê |
|---|---|---|
| Contrato de terceiro: REST, XML-RPC, feeds, sitemaps, oEmbed | **saída byte a byte** | é consumido por cliente que não está nesta casa, e divergência aqui quebra software alheio |
| Valor devolvido por hook (os 2.460 `apply_filters`) | **byte a byte no valor** | é a interface de extensão do produto; um filtro que devolve diferente muda todo plugin que o usa |
| Esquema e efeito de escrita no banco | **efeito no banco** | inclui a cascata de exclusão das 7 etapas e os órfãos que o legado deixa de propósito |
| HTML de tema e painel | **comportamento de caso de uso** (os 47 UCs) | a ordem de emissão varia no próprio legado conforme tema; exigir byte a byte aqui congela acidente |
| Estado entre requisições concorrentes | **teste próprio, fora dos UCs** | furo conhecido do critério (c): nenhum caso de uso descreve duas requisições ao mesmo tempo, e é exatamente onde a implicação 2 morde |

A última linha é acréscimo deliberado ao que o documento ofereceu: o critério (c) tem furo declarado, e
adotá-lo sem tapá-lo deixaria a troca de escopo de requisição por escopo de processo passar sem teste.

---

## Lacuna 1 — A stack alvo não foi declarada em um brief

**Contexto:** o SKILL exige `_reversa_sdd/migration/migration_brief.md` com a `Stack alvo`. **O arquivo
não existe** — a pasta `_reversa_sdd/migration/` foi criada por esta execução. O caso de borda manda
*perguntar, não inventar*. Para não travar, a linguagem foi extraída da única resposta humana que declara
alvo de porte ([`questions.md`](../questions.md) P15: *"Num porte para TypeScript…"*), e o resto está em
branco.

**Pergunta:** confirme ou corrija cada campo.

| Campo | O que esta etapa assumiu | Conf. |
|---|---|---|
| **Linguagem** | TypeScript | 🟡 inferido de P15 |
| **Runtime** | — | 🔴 (o único sinal na árvore é Node `>=20.10.0` exigido pelo `package.json` de um tema, para minificar CSS — **não** é decisão de alvo) |
| **Framework** | — | 🔴 — e esta escolha **decide parte do paradigma**: o catálogo põe NestJS em *OO com DI* e Fastify/Express em *event-driven leve* |
| **Banco** | — | 🔴 — restrição conhecida: 9 classes montam SQL de MySQL por fragmento, **com um filtro entre cada fragmento**, e esses filtros são contrato de extensão ([`architecture.md`](../architecture.md) §9 risco 5) |
| **Mensageria** | **nenhuma** | 🟢 — não é lacuna: P10 manda manter o disparo por requisição ao próprio host |
| **Infra** | — | 🔴 — containerizar exige decidir antes o que fazer com o atualizador embutido, que sobrescreve o próprio código em execução ([`deployment.md`](../deployment.md) §8) |

**Também em branco, e sem substituto neste pacote:** objetivo da migração, métricas de sucesso, prazo,
orçamento, *stakeholders* e escopo declarado. Nenhum artefato do `_reversa_sdd/` contém esses campos. O
orquestrador `/reversa-migrate` é quem conduz o brief.

**Resposta:**

| Campo | Decisão | Por quê |
|---|---|---|
| **Linguagem** | **TypeScript**, `strict`, sem `any` implícito | confirmado: é o alvo declarado |
| **Runtime** | **Node.js LTS** | é a única runtime em que `AsyncLocalStorage` é maduro, e o contexto por requisição explícito é **pré-requisito** do Designer (implicação 2), não refinamento. Bun e Deno mudariam a conversa de compatibilidade de biblioteca sem comprar nada para o critério de idêntico |
| **Framework** | **nenhum opinativo.** Servidor HTTP mínimo; sem container de DI, sem ORM, sem ciclo de vida de framework | o catálogo põe NestJS em *OO com DI* e Fastify/Express em *event-driven leve* — os dois **mudam o paradigma natural** e obrigam a reavaliar as 8 implicações. Pior: a ordem de arranque do legado é contrato público, e framework com ciclo de vida próprio disputa com ela. O que se adota de biblioteca é pontual e sem opinião sobre arquitetura |
| **Banco** | **MySQL/MariaDB**, driver TypeScript, **SQL escrito à mão, sem ORM** | não é preferência: 9 classes montam SQL **por fragmento, com um filtro de extensão entre cada fragmento**. Um ORM esconde o fragmento e com ele o ponto de extensão — quebra o contrato que a P3 declarou ser o produto. 18 tabelas, zero chave estrangeira, zero *trigger*, *procedure* ou *view*: o banco é armazenamento puro e continua sendo |
| **Mensageria** | **nenhuma** | já decidido pela P10 |
| **Infra** | **sem container na primeira fase**, e isso é decisão adiada de propósito | o atualizador embutido **sobrescreve o próprio código em execução**. Containerizar exige decidir antes o que fazer com ele, e essa decisão muda comportamento observável do caso de uso de atualização. Fica registrada como pendência nomeada, não como omissão |
| **Objetivo** | clonar o núcleo do WordPress em TypeScript com **regra idêntica**, não forma idêntica | é o que as 23 respostas e a Decisão 1 declaram item por item |
| **Métrica de sucesso** | paridade pelo critério por área da **Decisão 2**, medida contra o oráculo executável da **P16** | é a única métrica que o pacote sustenta hoje |
| **Prazo, orçamento, *stakeholders*** | 🔴 **continuam em aberto** — não são dedutíveis de artefato nenhum, e não foram inventados | o `/reversa-migrate` conduz |

---

## Lacuna 2 — O lado cliente dos 5 módulos do editor

**Contexto:** `wp-includes/js/dist/` está ausente desta árvore
([`architecture.md`](../architecture.md) §10 A-4). P15 já respondeu de onde tirar o fonte
(`github.com/WordPress/wordpress-develop` com os pacotes do Gutenberg) e notou que **esse fonte já é
JavaScript/TypeScript**.

**A consequência de paradigma, que ninguém registrou ainda:** para esse recorte **não há mudança de
paradigma** — há adoção do paradigma que o upstream já tem. O gap alto deste documento é do **servidor**,
não do sistema inteiro.

**Pergunta:** o lado cliente entra no mesmo porte, com a mesma decisão de paradigma, ou é tratado como
dependência externa adotada como está?

**Impacto:** decide se o Screen Translator traduz ~100 telas do painel mais o editor, ou só as telas. E
decide se a Opção 3 tem **duas** fronteiras de paradigma em vez de uma.

**Resposta:** **Dependência externa adotada como está, com versão cravada — não reescrita.** E a razão é a
mesma que decidiu o paradigma: o critério é regra idêntica.

- **Não há porte de linguagem a fazer ali.** O lado cliente já é JavaScript/TypeScript no upstream; os
  pacotes `@wordpress/*` são publicados como dependência. Reescrevê-los não aproxima do idêntico — **afasta**,
  porque garante divergência da única implementação de referência que existe.
- **O que entra no escopo do porte é o lado SERVIDOR que alimenta esse cliente**, e isso não é pouco: o
  registro de *scripts* e estilos com suas dependências, o registro dos 116 blocos por `block.json`, a
  resolução de `theme.json` e do *style engine*, os *endpoints* REST que o editor chama e a serialização
  de bloco em comentário HTML dentro de `post_content`. Esse contrato é byte a byte pelo critério da
  Decisão 2, porque é o que o cliente consome.
- **Consequência aceita**: a Opção 3 passa a ter **duas** fronteiras de paradigma, e isso fica declarado em
  vez de descoberto. A de dentro, servidor, é a fronteira híbrida da Decisão 1; a de fora, cliente, é
  adoção pura do paradigma upstream.
- **Escopo do Screen Translator**: as ~100 telas do painel, **sem** o editor. O editor chega pronto.
- **Preço, nomeado**: fica uma dependência de versão com o upstream — atualizar o cliente passa a exigir
  conferir o contrato servidor da mesma versão. É mais barato que manter um editor de blocos próprio, e
  é a mesma relação que o WordPress tem com o Gutenberg hoje.

---

## O que acontece quando isto for respondido

| Resposta | Efeito |
|---|---|
| Decisão 1 | grava `Escolha` e `Justificativa do usuário` em [`paradigm_decision.md`](paradigm_decision.md), e `derived_appetite` deixa de ser provisório |
| Decisão 2 | fecha a fronteira da Opção 3 e dá ao Inspector o que comparar no oráculo de P16 |
| Lacuna 1 | preenche a § *Stack alvo declarada*; se o framework mudar o paradigma natural, as 8 implicações são reavaliadas |
| Lacuna 2 | define o escopo do Screen Translator |

Enquanto a **Decisão 1** estiver em branco, [`paradigm_decision.md`](paradigm_decision.md) carrega
`derived_appetite: conservative` como **hipótese de trabalho** com a proveniência declarada — derivada das
23 respostas do [`questions.md`](../questions.md), que pedem porte idêntico item por item. Os agentes
posteriores devem declarar essa dependência nos seus próprios artefatos e não gravar decisão irreversível
que só se justifique por esse valor.
