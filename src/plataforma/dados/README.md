# `plataforma/dados/` — a camada de dados

Feature `015-plataforma-transversal`. Tarefas fechadas com nota de entrega neste
arquivo: **T002** (esqueleto: a porta do driver declarada e nada mais). Este
arquivo e a leitura obrigatoria de quem pegar **T007** — US-3, *"acessar os dados
por uma camada que nao aceite consulta montada por concatenacao"* — e **T008**,
os sete testes do catalogo. Ele diz o que ja esta decidido, o que esta decidido
**em outro lugar**, e o que **ninguem** decidiu.

A pasta e `plataforma/dados/` porque e assim que `target_architecture.md` nomeia
o componente, com a responsabilidade escrita ao lado: *"montagem de SQL **por
fragmento, com ponto de filtro entre cada fragmento**"*, origem *"fundido —
`camada-de-dados-wpdb` (33 dependentes)"*.

---

> ## 🔴 PARE AQUI SE A SUA TAREFA E T007
>
> Tres coisas desta pasta nao sao decisao sua, e duas delas mudam o desenho da
> camada inteira:
>
> 1. **Qual banco.** `BR-HUMANA-002` esta **PENDENTE** e a tabela *Nao
>    negociavel* da constituicao poe *"escolher a tecnologia de qualquer slot do
>    plano"* fora do alcance do agente. O slot `persistencia` **recomenda** driver
>    MySQL em protocolo nativo; recomendacao e recomendacao.
> 2. **O sentinela de data.** `BR-HUMANA-003` esta **PENDENTE**:
>    `'0000-00-00 00:00:00'` e o default de dez colunas `datetime` e carrega
>    significado de negocio (rascunho com data flutuante, cadastro ainda
>    pendente). A escolha **depende** da decisao do banco e nao deve ser tomada
>    antes dela.
> 3. **Se a camada continua substituivel por presenca de arquivo.** Ver
>    *O que ninguem decidiu*, item 2.

---

## O que ja esta decidido, e onde

| decisao | onde foi tomada |
|---|---|
| a borda do banco e **porta**, e o adaptador fica fora de `plataforma/` | AD-08 (as cinco bordas) e regra de dependencia 4 de `target_architecture.md` |
| a porta e **sincrona** | AD-04: a fronteira de `await` fica em `adaptadores/`; `contextos/` e `plataforma/` sao sincronos |
| **nao ha transacao** | `EXT-EXCLUSAO` (BR-MIGRAR-104): zero `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos. P5 poe a cascata de apagamento no observavel |
| **nao ha chave estrangeira** a declarar | P5 e a resposta 2: 18 tabelas, 59 indices, **zero** FK, e *"a ausencia de chave estrangeira e comportamento do produto, nao defeito de dado"* |
| escrita invalida **degrada**, nao falha | `DB-DEG` (BR-MIGRAR-083): trunca pelo tamanho real (`class-wpdb.php:2993`), remove caractere que o charset nao comporta (`:3823`), coage o formato (`:2879`) — tudo em silencio. Por isso `ResultadoDeEscrita` nao tem campo de erro |
| o texto da consulta pode ser **a mesma string** que o legado envia | `plan.md`, slot `persistencia`: *"inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que e como se descobre quem e administrador"* |
| nada de ORM | `BR-HUMANA-002` e a Lacuna 1 de `pending_decisions.md`: *"um ORM esconde o fragmento e com ele o ponto de extensao — quebra o contrato que a P3 declarou ser o produto"* |

E o vocabulario (`Consulta`, `ValorDeParametro`, `LinhaDeResultado`,
`ResultadoDeEscrita`) **nao nasceu aqui**: e o que as features `004`, `005`,
`006`, `007`, `011`, `013` e `014` ja declararam nas portas de dados dos
contextos delas. Repeti-lo e o que permite a T007 convergir aquelas portas em vez
de criar uma terceira forma.

## O que esta decidido em outro lugar

- **A desserializacao do valor persistido** e `plataforma/serializacao/`, que ja
  existe nesta arvore (`DB-SER`, BR-MIGRAR-082). Esta camada entrega bytes; quem
  interpreta e aquele modulo, com os bytes gravados iguais como regra de aceite.
- **Quem pode ler o que** e `plataforma/autorizacao/`, que tambem ja existe. A
  camada de dados nao decide autorizacao: `PERM-3` traduz capacidade sobre
  objeto antes de qualquer consulta.
- **O nome de cada tabela e de cada coluna** esta em
  `.specify/migration/target_data_model.md`, e o esquema **nao muda nesta fase**
  (AD-11: *"nenhuma mudanca de esquema e permitida"*, porque as duas metades
  disputando o esquema arriscariam corromper o oraculo).
- **A conferencia** e o oraculo executavel de T001 (`scripts/oraculo/`), pelo
  criterio de area *"esquema e efeito de escrita no banco: efeito no banco"* de
  `parity_specs.md`.

## O que ninguem decidiu

1. **CA-3.2 e `EXT-FILTROS` podem ser lidos como opostos, e a leitura que T002
   adotou esta escrita aqui.** O criterio diz: *"a camada de dados recusa receber
   fragmento de consulta vindo de dado de entrada"*. O legado, por outro lado,
   **publica** pontos de filtro que recebem fragmento de SQL de terceiro —
   `posts_where` (`wp-includes/class-wp-query.php:2796`) e `posts_join` (`:2806`)
   sao dois dos que as nove classes emitem, e `EXT-FILTROS` (BR-MIGRAR-102) os
   poe em contrato de extensao *byte a byte no valor*.
   **A leitura de T002:** as duas frases falam de coisas diferentes — uma proibe
   que **dado de entrada** se torne texto de consulta, a outra preserva que
   **codigo de extensao** contribua fragmento. Nada no esqueleto depende dessa
   leitura, porque o esqueleto nao tem fragmento nenhum; quem fechar T007
   **depende** dela. Se a leitura certa for a outra — nenhum fragmento de
   ninguem —, isso remove ponto de extensao publicado, cai em P2 e P8 e na linha
   *"renomear ou remover ponto de extensao"* da tabela *Nao negociavel*: para, e
   pergunta.
2. **Se o *drop-in* da camada de dados continua existindo.** No legado
   `require_wp_db()` carrega `wp-content/db.php` se o arquivo existir
   (`wp-includes/load.php:711`, `:712`): a presenca do arquivo **e** a API, e e
   um dos quatro *drop-ins* de `EXT-SUBST` (BR-MIGRAR-103). REQ-170 declara que o
   sistema novo **nao** tera esse mecanismo; P2 e P8 mandam preserva-lo; a
   `spec.md` desta feature registra o conflito na secao *Fora de escopo* e **nao
   o resolve**, e a constituicao poe *"resolver um dos conflitos entre card
   `wont` e resposta humana"* na tabela *Nao negociavel*. Trocar o **adaptador**
   por esta porta e substituicao por declaracao explicita e nao depende da
   resposta; o **caminho de arquivo** depende.
3. **A camada de dados e um dos 15 modulos sem spec, e e o mais dependido dos
   cinco que a resposta 21 mandou cobrir primeiro.** `BR-HUMANA-004` registra:
   *"sem `camada-de-dados-wpdb`... nao existe porte fiel — sao exatamente as
   camadas em que 'identico' se decide"*, e *"precisa ser fechada antes de
   qualquer trabalho de porte"*. A autorizacao existe, a spec nao foi gerada, e
   `index.md` repete isso como a maior lacuna estrutural da entrega. Consequencia
   pratica para T007: regra que viva **somente** na camada de dados nao esta em
   `target_business_rules.md`, logo nao se deduz do pacote — sai do oraculo, com
   `arquivo:linha`.
4. **Onde mora o contador de consultas.** CA-3.5 pede o perfil por requisicao, e
   no legado ele e `num_queries` (`class-wpdb.php:93`) com a lista de consultas
   so sob `SAVEQUERIES` (`:719`, `:2348`, `:2358`). Que ele seja **por
   requisicao** e `EXT-CONTEXTO`; que a arvore ainda nao tenha
   `plataforma/contexto/` (o `AsyncLocalStorage` que AD-02 chama de
   *"pre-requisito de tudo"*) e fato, e nenhuma tarefa deste pacote o cria.
   T007 passa o contador por argumento ou declara a pendencia; nao inventa
   estado de modulo.

## Onde esta feature nao chegou

T002 entrega **quatro** modulos, que e o que a tarefa nomeia: este, mais
`../registro-de-operacao/`, `../traducao/` e `../sanitizacao/`. US-2 (suite de
paridade, **T005**) e US-6 (validacao de instalacao, **T013**) nao ganharam pasta
aqui: a primeira e condicao e nao modulo, e a segunda e o instalador, que nao
esta entre os quatro. Quem pegar T005 ou T013 decide onde eles moram, e registra.
