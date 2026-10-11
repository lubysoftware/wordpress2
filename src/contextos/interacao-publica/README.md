# Modulo de interacao publica — BC-03

Feature `007-interacao-publica-e-moderacao`. Tarefas fechadas com nota de
entrega neste arquivo: **T001** (esqueleto, as quatro portas e os pontos de
configuracao de moderacao) e **T002** (a forma de armazenamento do comentario e
do metadado dele). Este arquivo e a leitura obrigatoria de quem pegar a tarefa
seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro
lugar**, e o que ninguem decidiu.

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca a ORDEM da cascata (T003,
> T010):** ha uma diferenca entre a ordem que `target_architecture.md` declara e
> a ordem em que o legado executa as etapas. Ela esta descrita na secao
> *O que ninguem decidiu*, item 1, com as duas fontes. T001 nao a resolveu e nao
> podia: T001 nao implementa etapa nenhuma.

> 🔴 **E se a sua tarefa toca o limite de vazao (T008):** o pacote e o legado
> discordam sobre quando o freio de `C2` dispara — segundo comentario na ultima
> hora, ou segundo comentario a menos de 15 segundos do anterior. Os dois numeros
> estao nomeados em `configuracao/configuracao-de-moderacao.ts`, no campo
> `intervaloMinimoEntreComentariosEmSegundos`, com as duas fontes citadas.
> Escolher um lado muda o que o visitante recebe, e o P1 exige decisao humana
> registrada.

---

## O que T001 entregou

```
interacao-publica/
├── index.ts                                  a composicao: nome, portas, configuracao, armazenamento
├── modulo.test.ts                            os testes desta entrega
├── portas/
│   ├── porta-de-dados.ts                     a unica porta deste modulo para o banco
│   ├── porta-de-relogio.ts                   segundos inteiros em UTC, como `time()`
│   ├── porta-de-email.ts                     transporte selecionavel; falha e VALOR
│   └── porta-de-cliente-externo.ts           HTTP de saida; a prova do pingback sai daqui
└── configuracao/
    └── configuracao-de-moderacao.ts          13 opcoes + 3 limites + 1 lista, de fabrica
```

`criarModuloDeInteracaoPublica(portas, configuracao?)` devolve
`{ nome, portas, configuracao }` e **mais nada** — T002 acrescentou
`armazenamento`, e nada mais. Operacao de dominio entra na tarefa da historia
dela, com a declaracao de permissao que o P4 exige — a tabela de quem entra, com
a permissao de cada uma ja lida dos casos de uso, esta no comentario de
`ModuloDeInteracaoPublica` em `index.ts`.

Duas invariantes de arquitetura tem teste proprio aqui, porque um esqueleto as
quebra em silencio:

- **`EXT-ORDEM` (BR-MIGRAR-106):** compor o modulo nao toca em porta nenhuma.
  Nada se resolve no carregamento, porque a ordem de arranque e contrato publico.
- **`EXT-CONTEXTO` (BR-MIGRAR-105):** duas composicoes nao compartilham estado.
  Aqui isso tem cenario de paridade proprio (`@concorrencia`): *"o comentario do
  visitante nao recebe o atalho de confianca do moderador"*. O atalho de `C3`
  depende de quem submeteu.

### Os valores de fabrica, e de onde cada um veio

Todos lidos de `populate_options()` em `wp-admin/includes/schema.php`, do codigo
de `wp-includes/comment.php` ou de `wp-includes/default-constants.php`, com a
linha citada no campo. `modulo.test.ts` afirma os dezessete um por um.

| ponto | fabrica | etapa | ancora |
|---|---|---|---|
| `exigirConta` | desligada | portao de entrada (CA-1.2) | `schema.php:459` |
| `exigirNomeEEmail` | **ligada** | portao de entrada (CA-1.3) | `schema.php:422` |
| `moderacaoManual` | desligada | `C4` | `schema.php:441` |
| `maximoDeLinks` | **2** | `C5` | `schema.php:451` |
| `palavrasDeModeracao` | vazio | `C6` | `schema.php:447` |
| `listaDeProibicao` | vazio | `C9` | `schema.php:545` |
| `exigirAutorJaAprovado` | **ligada** | `C7` | `schema.php:546` |
| `fecharInteracaoEmConteudoAntigo` | desligada | `C11` | `schema.php:500` |
| `diasParaFecharInteracao` | **14** | `C11` | `schema.php:501` |
| `encadearRespostas` | **ligado** | US-7 | `schema.php:502` |
| `profundidadeMaximaDeEncadeamento` | **5** | US-7 | `schema.php:503` |
| `avisarAutorDoConteudo` | **ligado** | US-9 | `schema.php:423` |
| `avisarQuemModera` | **ligado** | US-9 | `schema.php:442` |
| `janelaDeVazaoEmSegundos` | **3600** | `C2` | `comment.php:922` |
| `intervaloMinimoEntreComentariosEmSegundos` | **15** 🔴 | `C2` | `comment.php:2319` |
| `lixeiraLigada` | **sim** | `C9` | `default-constants.php:388` |
| `TIPOS_..._DE_FABRICA` | `['post']` | `C11` | `comment.php:3853` |

**Dois campos sao comparados em modo ESTRITO contra a string `'1'` no legado, e
os outros por veracidade.** `comment_moderation` (`comment.php:47`) e
`comment_previously_approved` (`comment.php:133`) usam `'1' === ...`; os demais
entram direto num `if`. A diferenca e observavel: uma instalacao com
`comment_moderation = 'yes'` **nao** tem moderacao manual ligada, e a mesma
instalacao com `comment_registration = 'yes'` **tem** a exigencia de conta
ligada. Quem escrever a leitura da opcao reproduz essa assimetria.

---

## O que T002 entregou

A forma de armazenamento das **duas** tabelas desta feature, lida e gravada
somente pela porta de dados. Nenhuma regra de negocio: a cascata e T003 e T010, e
cada historia e a tarefa dela.

```
interacao-publica/armazenamento/
├── chaves-e-tabelas.ts        os dois nomes de tabela, com o prefixo DO SITE
├── vocabulario.ts             estado (5 valores), tipo (4), os dois zeros e a sentinela
├── comentario.ts              a linha de 15 colunas, as DUAS listas de 14 gravaveis, a auto-referencia
├── metadado.ts                `commentmeta`, com os dois testes de PHP que decidem qual comando sai
├── esquema.ts                 o DDL das duas byte a byte + os 4 limites de coluna de `C10`
├── leitura-de-linha.ts        tolerancia de tipo de coluna, e nenhuma validacao
├── porta-falsa.ts             o duplo que REGISTRA comando, para afirmar o que nao sai
├── index.ts                   a composicao: `{ comentarios, metadados }`
├── armazenamento.test.ts      49 testes
└── esquema.test.ts            13 testes
```

### As quatro coisas que a entrega nomeia, e onde cada uma esta

| o que T002 entrega | onde | o que carrega |
|---|---|---|
| o **vocabulario de estado** | `vocabulario.ts` | os **cinco** valores (`'1'`, `'0'`, `spam`, `trash`, `post-trashed`), e quais **quatro** a interface de estado alcanca (`comment.php:2814`, CA-10.2) |
| o **vocabulario de tipo** | `vocabulario.ts` | os quatro (`comment`, `pingback`, `trackback`, `note`), mais a normalizacao do tipo **vazio** na leitura (`comment-template.php:1161`) |
| a **auto-referencia** | `comentario.ts` | `comment_parent`, com as duas pontas da cascata: ler as respostas diretas (`comment.php:1590`) e **subir** a ninhada um nivel (`:1592`) |
| o **vinculo opcional com conta** | `vocabulario.ts` e `comentario.ts` | `user_id`, com `0` = anonimo legitimo e orfao como estado normal — nenhum metodo confere a conta |

### As cinco coisas que ficaram como o legado as faz

1. **A escrita tem 14 colunas e DUAS ordens.** `comment_author_IP` e a segunda
   na insercao (`comment.php:2179`) e a quinta na atualizacao (`:2964`), porque
   o legado monta as duas listas de formas diferentes. A ordem e o comando que
   sai, e a area 3 da Decisao 2 compara *"snapshot + sequencia de comandos"*.
2. **`comment_karma` e escrita, sempre com zero.** BR-MIGRAR-086 (`DB-DEAD`) diz
   que o nucleo *"nunca escreve nada alem de `0`"* — e escrever zero e escrever.
3. **Nenhuma validacao na gravacao.** Nem estado, nem tipo, nem tamanho, nem
   existencia de conteudo, pai ou conta. `DB-DEG` e `DB-ENUM`, e a recusa do
   campo longo e `C10`/T012, do lado da aplicacao.
4. **Os tres casos em que nenhum comando sai** sao afirmados por teste: gravar
   metadado com valor identico, apagar metadado que nao existe, e apagar
   comentario sem respostas (sem `UPDATE` de reparenteamento).
5. **O DDL e dado, nao acao.** A borda 4 de `target_architecture.md` diz que
   esta metade *"le e nunca escreve"* estrutura; `esquema.test.ts` falha se
   alguem "normalizar" tabulacao, espaco duplo ou ordem de indice, porque
   `DB-MIG` transforma diferenca de forma em `ALTER TABLE`.

### Os quatro limites de coluna, e por que eles nascem no DDL

`C10` (CA-5.3) pede o limite de cada campo **declarado**. O legado o declara
duas vezes e as duas tem de coincidir: `wp_get_comment_fields_max_lengths()`
escreve quatro numeros a mao (`comment.php:1267`) e depois **pergunta a coluna**,
subtraindo 10 quando o tipo e `byte` (`:1290`).

| campo | coluna | conta | limite |
|---|---|---|---|
| nome | `comment_author` `tinytext` | 255 − 10 | **245** |
| e-mail | `comment_author_email` `varchar(100)` | sem subtracao | **100** |
| endereco | `comment_author_url` `varchar(200)` | sem subtracao | **200** |
| texto | `comment_content` `text` | 65535 − 10 | **65525** |

⚠️ **Sao bytes, nao caracteres.** O legado compara com `mb_strlen($v, '8bit')` e
`strlen()` (`comment.php:1322` a `:1334`), e as duas contam bytes. Quem escrever
T012 nao pode usar comprimento de `string` em JavaScript: um caractere fora do
ASCII ocupa de 2 a 4 bytes.

### Duas diferencas deliberadas em relacao ao gemeo de BC-01

`armazenamento/metadado.ts` de BC-01 reproduz a mesma maquina de
`wp-includes/meta.php`, e **este arquivo nao e copia dele**: duas condicoes que
no gemeo viraram `=== undefined` sao, no legado, testes de PHP com resultado
diferente — e as duas mudam qual comando sai.

- a clausula `AND meta_value = ?` da **exclusao** entra pelo teste de tres
  valores (`'' !== && null !== && false !==`, `meta.php:462`), nao pela presenca
  do argumento: apagar com texto vazio e apagar sem valor emitem a **mesma**
  consulta, e `'0'` **entra** na clausula;
- a comparacao de valor identico da **gravacao** e desligada por
  `empty( $prev_value )` (`meta.php:256`), nao por ausencia: valor anterior
  `'0'` se comporta como se nenhum tivesse sido pedido.

As duas funcoes (`valorEntraNaClausula`, `vazioComoNoPhp`) ficam no arquivo e nao
em `plataforma/`: a regra de dependencia 3 proibe importar a `vazioComoNoPhp` que
ja existe em `contextos/leitura-publica/`, e descer para `plataforma/` e decisao
de quem construir `015-plataforma-transversal`.

---

## O que esta decidido em outro lugar

| assunto | onde mora | por que nao aqui |
|---|---|---|
| perguntar permissao | `plataforma/autorizacao/` | e chamada 1.279 vezes em 224 arquivos; fica abaixo de todo contexto. `C3` e `US-10` **consomem** a decisao, nao a tomam |
| os limites de coluna (`C10`) | ✅ T002 declarou os quatro em `armazenamento/esquema.ts`; a **recusa** e T012 | sao o tamanho da coluna, nao configuracao de moderacao |
| o prazo da lixeira (30 dias) | feature `005-retencao-e-descarte` | `C9` le a constante **por veracidade**; aqui so o booleano `lixeiraLigada` e observavel. Duplicar o 30 criaria dois donos para o mesmo numero |
| a ordem de arranque | D1, contrato publico | AD-10: nenhum contexto importa outro no topo do modulo |
| a definicao de papel | ADR-0001, e BC-05 | P3: a autorizacao e por capacidade, e papel e dado mutavel |
| o disparo nao bloqueante | `BC-11`, AD-07 | nenhuma chamada deste modulo e nao bloqueante no legado: a busca da prova do pingback espera a resposta |

**Por que as portas reaparecem aqui com a forma que `BC-05` ja declara.** AD-08
poe a porta no contexto que a **consome** e AD-10 proibe um contexto importar
outro no topo do modulo. Importar a porta de identidade daqui criaria exatamente
a ligacao horizontal que a regra de dependencia recusa. O mesmo vale para
`SEGUNDOS_POR_HORA`: um numero de calendario nao vale uma ligacao entre
contextos.

---

## O que ninguem decidiu

### 1. A ordem da cascata tem duas leituras, e nenhuma e minha para escolher

`target_architecture.md` (AD-05 e os componentes de `BC-03`) e o cabecalho de
`parity_tests/01-cascata-de-moderacao-de-comentario.feature` declaram a ordem:

```
C1 → C4 → C3 → C2 → C9 → C6 → C5 → C7 → C10 → C8 → C11 → C12
```

O `plan.md` desta feature descreve a mesma sub-ordem com menos etapas:
*"moderacao manual vence tudo; o atalho de confianca... entra aprovado sem passar
por verificacao alguma; depois vem lista de proibicao, palavras de moderacao,
contagem de links e autor ja aprovado"*.

O legado executa em ordem diferente das duas: `check_comment()` roda
`C4 → C5 → C6 → C7` (`comment.php:47`, `:56`, `:80`, `:133`) e **depois**
`wp_allow_comment()` roda `C9`, que **sobrescreve** o resultado
(`comment.php:1384`, `:1392`). Nas duas leituras o destino final coincide,
porque `C9` encerra a decisao de qualquer forma — mas o cenario de paridade
`@ordem-de-decisao` afirma, textualmente, que *"nenhum dos dois consulta a lista
de proibicao nem conta links"* quando `C4` decide, e isso e sobre **o que foi
consultado**, nao so sobre o resultado.

T003 declara a cascata como sequencia nomeada e ordenada, e T010 a percorre.
Qual ordem a lista declara e decisao com efeito observavel (quantas consultas
saem, em que ordem os pontos de extensao disparam — e o ultimo cenario de
paridade cobra *"a ordem em que os pontos de extensao sao chamados e a mesma nas
duas"*). T001 nao escolheu, e nao escreveu a lista.

### 2. Os quatro conflitos que a `spec.md` ja registra em aberto

Nenhum deles e desta tarefa, e nenhum deles foi tocado. Ficam aqui porque cada
um cai numa tarefa adiante:

1. **REQ-081** (descartar o protocolo de notificacao sem prova) — o card descarta
   e a resposta 14 contradiz. **T032** encosta nisso.
2. **REQ-085** (descartar o rebaixamento para canal sem cifra) — o card descarta
   e a resposta 12 nomeia o card e manda manter. O campo
   `verificarCertificado` de `portas/porta-de-cliente-externo.ts` permite as
   duas leituras **e nenhum codigo deste modulo o altera**.
3. **O escopo do servico externo de reputacao** — a resposta 13 o poe fora do
   nucleo, e `discard_log.md` ja descartou `C13` e o envio integral. **T034** e
   **T036** dependem disso: a spec especifica as duas historias, a resposta diz
   que elas nao sao do nucleo. A porta de cliente externo nao declara nada
   especifico de classificador.
4. **REQ-069** (qual sanitizacao se aplica a quem entra pelo atalho de confianca
   de `C3`) — ficou `bloqueado` e nao entrou. **T004** e **T010** constroem a
   cascata cujo primeiro passo e esse atalho.

E uma quinta, que e divergencia deliberada e nao conflito: **US-18 / REQ-180**
serve a imagem de quem comenta sem enviar o dado a terceiro, o que diverge do
observavel do legado e precisa de decisao humana registrada (P1). Por isso
`show_avatars`, `avatar_default` e `avatar_rating` **nao** estao nos pontos de
configuracao: semear o valor de fabrica deles antes da decisao seria tomar a
decisao. **T038**.

---

## Como conferir esta entrega

```sh
npm test            # a suite inteira; 11 testes sao de T001 e 63 de T002
```

A paridade desta area se prova por
`.specify/migration/parity_tests/01-cascata-de-moderacao-de-comentario.feature`,
cujo criterio e *"efeito no banco + byte a byte no valor devolvido por hook"*
(Decisao 2 de `parity_specs.md`). T001 entrega dois pre-requisitos daquele
arquivo — as portas que o cenario `@composicao` substitui por duplo, e os valores
de fabrica que os cenarios `Dado a opcao ... com o valor ...` pressupoem — e T002
entrega o terceiro: o **efeito no banco** que cada cenario afirma, com a porta
falsa que registra a sequencia de comandos em vez de simular banco.

Dos cenarios daquele arquivo, T002 cobre em parte os dois `@cascata`/`@invariante`
que nao dependem de regra: *"apagar o comentario pai propaga para a arvore de
respostas"* (as duas pontas do reparenteamento existem e tem teste; a **ordem**
entre elas e de quem apaga) e *"comentario orfao e estado normal"* (nenhum metodo
confere a existencia da conta). Os demais dependem da cascata, que nao existe.
