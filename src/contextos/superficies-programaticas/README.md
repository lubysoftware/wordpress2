# Modulo de superficies programaticas — feature `013-superficies-programaticas`

Epico EP-13 do backlog: *"o que o sistema expoe a programas: API, abilities,
feeds, sitemaps"*. Tarefas fechadas com nota de entrega neste arquivo: **T001**
(esqueleto, o despachante com o registro de rotas vazio e inspecionavel, e a
porta de dados), **T002** (os dois formatos de declaracao, o ato de registrar, e
o aviso de uso indevido da rota sem declaracao de permissao) e **T015** (US-7, o
indice de sitemap conforme a opcao de indexacao).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem**
decidiu.

> 🔴 **Se a sua tarefa e T003, leia o item 1 de *O que ninguem decidiu* antes da
> primeira linha.** Ha uma frase de `UC-44` que manda **nao** copiar a falha
> aberta da camada de rotas, e a constituicao, `BR-HUMANA-008`, a `spec.md` e o
> cenario de paridade mandam copiar. **T002 preservou**, porque e o que o pacote
> manda e o que a propria linha da tarefa pede — e o conflito **continua aberto**:
> T003 executa a declaracao de permissao e topa nele de novo.

> 🔴 **Se a sua tarefa e T007, leia o item 2.** No legado o registro de rotas
> **nao nasce vazio** — o construtor semeia duas rotas meta, e uma delas,
> `/batch/v1`, nao tem historia nenhuma neste pacote. **T002 nao as semeou**: o
> formato ja existe, o que falta e a funcao de cada uma.

> 🔴 **Se a sua tarefa e T009, leia o item 3.** CA-4.4 pede *"prazo de retencao
> declarado"* para um registro que o legado nao tem, e a tabela *Nao negociavel*
> da constituicao poe *"introduzir limite de taxa, prazo de retencao ou qualquer
> numero que o legado nao tem"* entre o que este agente **nao** decide.

---

## Onde este modulo mora, e por que a pasta leva o nome da feature

Esta feature **nao e um contexto do desenho**: ela atravessa dois.

| historias | contexto de `target_architecture.md` |
|---|---|
| US-1 a US-6 — despacho, esquema, mapa da superficie, registro de acesso, token, operacao nomeada | `BC-09` *Superficies de Programacao* |
| US-7, US-8, US-9 — mapa do site, feeds, representacao embutivel | `BC-08` *Contratos de Leitura* |

`BC-09` existe porque `PERM-11` (BR-MIGRAR-097) registra **tres camadas
paralelas de autorizacao, cada uma com a sua propria falha padrao**, e *"hoje
elas moram em pastas separadas e **ninguem ve a divergencia**"*. Duas dessas tres
estao nesta feature, com defaults opostos. `BC-08` agrupa feeds, mapa do site e
oEmbed *"pelo criterio de aceite"*: os tres sao byte a byte.

A pasta leva o nome da feature, e nao o de um dos dois contextos, pelas mesmas
tres razoes que `004-leitura-publica` registrou: a tarefa nomeia *"o modulo de
superficies programaticas"*; `BC-08` e tambem destino da feature `004`, que esta
sendo construida em paralelo, e duas features escrevendo a mesma pasta e
conflito de merge e nao arquitetura; e a escolha nao muda nada do que o teste de
borda da Opcao 3 mede. Consolidar as pastas e trabalho de quem tiver as 15
features na mao, e e reversivel: nenhum nome publico depende do caminho do
arquivo.

---

## O que T001 entregou, e so isso

A linha da tarefa: *"o despachante de rotas carrega com o registro de rotas vazio
e inspecionavel, e a porta de dados declarada"*. `satisfaz: — (infraestrutura)`:
T001 **nao fecha nenhum criterio de aceite de nenhuma historia** e nao implementa
regra de negocio nenhuma.

```
superficies-programaticas/
├── index.ts                         a composicao: nome, portas, despachante
├── modulo.test.ts                   os 8 testes desta entrega
├── portas/
│   └── porta-de-dados.ts            a unica porta deste modulo em T001
└── despacho/
    ├── registro-de-rotas.ts         os dois armazens e os tres leitores
    └── despachante-de-rotas.ts      o que o carrega, e a ORDEM do atendimento
```

O que **T002** acrescentou esta na arvore da secao seguinte.

`criarModuloDeSuperficiesProgramaticas(portas)` devolve
`{ nome, portas, despachante }` e **mais nada**. Operacao de dominio entra na
tarefa da historia dela, com a declaracao de permissao que o P4 exige — a tabela
de quem entra, com a permissao de cada uma ja lida dos casos de uso, esta no
comentario de `ModuloDeSuperficiesProgramaticas` em `index.ts`.

### Os tres leitores do registro, e por que sao tres e nao um

O registro do legado tem **dois armazens** e **tres leitores**, e a diferenca
entre eles e observavel. As linhas sao de
`wp-includes/rest-api/class-wp-rest-server.php`:

| armazem | linha | leitor | linha | o que devolve com o registro vazio |
|---|---|---|---|---|
| `$namespaces` | `:64` | `get_namespaces()` | `:1035` | lista vazia |
| `$endpoints` | `:72` | `get_routes( $ns = '' )` | `:957` | mapa vazio |
| `$route_options` | `:80` | `get_route_options( $rota )` | `:1047` | **`null`**, nao mapa vazio |

Os dois primeiros parecem redundantes e nao sao: `register_route()` escreve nos
dois na mesma respiracao (`:924` e `:929`), logo concordam para tudo que passa
por ele — mas o construtor semeia `$endpoints` **direto**, e por isso as rotas
meta existem em `$endpoints` e nao em `$namespaces`. E por isso que
`get_routes( 'wp/v2' )` nunca devolve `/`.

Tres propriedades de `get_routes()` que ja estao documentadas em
`despacho/registro-de-rotas.ts` e que quem fechar T002 e T003 nao pode perder:

1. **Devolve copia, nao o armazem** (`:958`). Tem teste.
2. **E ali que dispara `rest_endpoints`** (`:974`), que recebe o mapa e pode
   devolver outro — logo pode acrescentar, tirar e trocar rota **depois** do
   registro. E ponto de extensao, logo e produto (P2). Esta **declarado** no
   docblock do leitor e nao implementado, porque o barramento de ganchos nao tem
   tarefa neste pacote (REQ-162 esta em `do-not-rewrite.md`).
3. ⚠️ **No legado esse leitor ESCREVE.** Ele normaliza os tratadores com os
   defaults de `:977-983` e **popula `$this->route_options`** (`:992-994` e
   `:998-1002`). Consequencia observavel: antes da primeira chamada a `get_routes()`,
   `get_route_options()` devolve `null` **para toda rota**, inclusive para rota
   que declarou opcao. T001 nao reproduz a ordem porque nao tem o que
   normalizar; quem fechar T002 decide se reproduz o acoplamento ou se declara a
   divergencia — e, se declarar, precisa da referencia que o P1 cobra.
   ✅ **T002 decidiu: reproduz.** A referencia que uma divergencia exigiria nao
   existe — `questions.md` nao tem resposta sobre isto, nao ha ADR, e as tres
   divergencias autorizadas da constituicao sao outras. Tem teste do antes e do
   depois.

### Por que `registrar` nao existia, e onde ele esta agora

Em T001 nao existia porque registrar e a entrega de **T002**, e o que se registra
e uma declaracao no formato que T002 define. `DeclaracaoDeRota` e
`DeclaracaoDeOpcaoDeRota` ficaram `never` **de proposito**: enquanto o formato nao
existia, o compilador nao deixava nada entrar no registro.

✅ **T002 trocou os dois `never` pelas interfaces** — era a primeira linha da
tarefa — e `registrar` existe em **duas camadas**, porque no legado sao duas.
Ver a secao seguinte.

### Por que uma porta so, sendo cinco as bordas de AD-08

A entrega nomeia uma: *"a porta de dados declarada"*.

- **Dados:** a unica que alguma historia desta feature usa hoje. O cabecalho de
  `portas/porta-de-dados.ts` tem a tabela de quem usa e quem nao usa, com a
  linha em discordancia marcada.
- **HTTP:** ⚠️ **a borda HTTP desta feature e de ENTRADA, e borda de entrada nao
  e porta deste modulo.** E o roteador, que `target_architecture.md` poe em
  `entradas/`, e que esta arvore ainda nao tem. Saida HTTP so apareceria na rota
  `oembed/1.0/proxy`, que e consumidor e **nao tem criterio de aceite nenhum**
  (item 4 de *O que ninguem decidiu*).
- **Sistema de arquivos, cache de objeto e e-mail:** nenhuma historia desta
  feature grava arquivo, cacheia ou manda e-mail. A borda 5 de
  `target_architecture.md` ainda poe o cache de objeto **desligado nas duas
  metades** durante a coexistencia.

Quando uma tarefa adiante precisar de outra borda, ela declara a porta na tarefa
dela, como T002 de BC-05 fez com o prefixo base.

**T002 nao acrescentou porta, e o aviso de uso indevido nao e uma.** Ele chega
como funcao opcional — `RelatorDeUsoIndevido`, de `plataforma/autorizacao/`, a
mesma forma que `contextos/conteudo` ja usa — e e **so escrita**: nenhuma
ramificacao consulta o resultado dela, que e o que o **P7** cobra. Ausente, o
registro decide igual, e ha teste disso nas duas metades. O tipo mora em
`plataforma/autorizacao/` por ter nascido ali; declarar uma terceira copia da
mesma forma de tres campos seria pior do que o import de plataforma, que a regra
de dependencia 1 permite.

### As duas invariantes com teste proprio

- **`EXT-ORDEM` (BR-MIGRAR-106):** compor o modulo nao toca na porta. No legado o
  povoamento acontece em `rest_api_init`, que dispara **depois** de o servidor
  existir (`wp-includes/rest-api.php:644-657`), e `register_rest_route()`
  **avisa** quem registra fora daquele gancho (`:81-92`). Construir e povoar sao
  dois momentos, e os dois sao contrato publico.
- **`EXT-CONTEXTO` (BR-MIGRAR-105):** duas composicoes nao compartilham
  registro. Nesta feature isso pesa mais do que em qualquer outra, e por um
  motivo desconfortavel: **o legado de fato guarda o servidor num global**
  (`rest_get_server()`, `wp-includes/rest-api.php:629-631`). Ele sobrevive porque
  o processo morre com a resposta — no modelo de processo por requisicao aquele
  global **ja e** escopo de requisicao. Copia-lo como estado de modulo num
  processo longo-vivo faria as rotas de uma requisicao vazarem para a seguinte, e
  numa rede as de um site para outro. E a linha 5 da metrica primaria de
  `parity_specs.md`: tolerancia **zero, sem excecao**, e *no-go* declarado.

### A ordem do atendimento esta em codigo, e nao foi implementada

A tabela das seis etapas, com a ancora de cada uma no legado e o dono de cada uma
neste pacote, esta no cabecalho de `despacho/despachante-de-rotas.ts`. Ela esta
ali, e nao so aqui, porque a tabela *Nao negociavel* da constituicao poe *"mudar
a ordem de carregamento do arranque"* fora do que o agente de codificacao decide.
Dois pontos dela que se perdem com facilidade:

- **A etapa 1 e o filtro de autenticacao, e ele antecede TODO o despacho**
  (`:197`). `UC-44` registra que *"um plugin pode fechar ou abrir a API inteira"*
  por ali. E CA-1.2: *"num ponto unico"*.
- **Antes de casar a rota existe um desvio**, `rest_pre_dispatch` (`:1079`): se
  devolver qualquer coisa nao vazia, **aquilo passa a ser a resposta** — sem
  casar rota, sem permissao e sem validar parametro.

---

## O que T002 entregou

A linha da tarefa: *"os dois formatos existem como declaracao, com validacao de
parametro ainda vazia, e o registro de uma rota sem declaracao de permissao
reproduz o aviso de uso indevido do legado"*. `satisfaz: — (infraestrutura)`:
**T002 nao fecha criterio de aceite nenhum** e nao implementa regra de negocio de
historia nenhuma.

```
superficies-programaticas/
├── despacho/
│   ├── esquema-de-rota.ts           O FORMATO 1: tratador, esquema de argumento,
│   │                                 atalhos de metodo, os dois conjuntos de default
│   ├── esquema-de-rota.test.ts      21 testes
│   ├── validacao-de-parametro.ts    declarada e VAZIA — T005 a preenche
│   ├── registro-de-rotas.ts         + `registrar` (o METODO: nao avisa nada)
│   └── registro-de-rota-de-api.ts   + a FUNCAO: seis avisos, e o de I7 nao recusa
└── operacao-nomeada/
    ├── esquema-de-operacao-nomeada.ts       O FORMATO 2: operacao e categoria
    ├── esquema-de-operacao-nomeada.test.ts  21 testes
    └── registro-de-operacoes-nomeadas.ts    os dois registros, e eles falham FECHADOS
```

`criarModuloDeSuperficiesProgramaticas(portas)` continua devolvendo
`{ nome, portas, despachante }` e **mais nada**: T002 e infraestrutura, e a
tabela de operacoes do `index.ts` cresce **na tarefa de cada historia**, que e o
que o **P4** cobra.

### As duas camadas de registro, e a razao de serem duas

| camada | no legado | confere? | aqui |
|---|---|---|---|
| o **metodo** | `WP_REST_Server::register_route()` (`class-wp-rest-server.php:899`) | **nada** | `RegistroDeRotas.registrar` |
| a **funcao** | `register_rest_route()` (`wp-includes/rest-api.php:34`) | seis coisas, seis avisos | `registrarRotaDeApi()` |

O proprio legado documenta o desvio em `rest-api.php:37`-`:40`: quem precisa de
rota sem espaco de nome *"chama `WP_REST_Server::register_route` direto"* — e com
isso contorna os seis avisos. Juntar as duas num lugar fecharia um caminho
publicado (P8).

### 🔴 O aviso de `I7`, que e a entrega desta tarefa

Rota registrada pela funcao **sem** declaracao de permissao **entra**, e o aviso
sai com o texto do legado, que ensina a liberacao explicita
(`rest-api.php:122`-`:133`, versao `5.5.0`). Tres detalhes com teste:

1. **`permissao: null` tambem avisa**, porque `isset()` e falso para nulo.
   Declarar a permissao como nula nao e declarar.
2. **O caminho no aviso nao tem a barra inicial** (`:128`), e o caminho com que a
   rota e registrada tem (`:153`).
3. **O indice de espaco de nome que o proprio nucleo registra nao tem declaracao
   de permissao e nao gera aviso nenhum**, porque ele entra pelo metodo
   (`class-wp-rest-server.php:900`-`:921`). E o caso mais limpo da falha aberta.

O conflito do item 1 de *O que ninguem decidiu* **nao foi resolvido**: T002
preservou, que e o que o pacote manda e o que a linha da tarefa pede, e preservar
nao exige referencia. Fechar exigiria, e a referencia nao existe.

### Os quatro achados de T002, que nao estavam escritos em lugar nenhum

1. **Sao DOIS conjuntos de default para o tratador, e `methods` os separa.** A
   funcao mescla `'GET'` (`rest-api.php:108`); o leitor mescla `''`
   (`class-wp-rest-server.php:978`). Rota registrada pela funcao sem metodo
   declarado responde a `GET`; rota semeada direto no armazem, sem metodo,
   **desaparece do indice** (`:1707`). O **P6** manda cada numero de fabrica
   viver no seu ponto, e sao dois pontos.
2. **Os dois armazens NAO concordam sempre, e o legado recorta pelo segundo.**
   T001 implementou o recorte por espaco de nome a partir do indice `$namespaces`
   e pediu a esta tarefa que conferisse: **nao concordam.** O legado recorta com
   `wp_list_filter( $endpoints, array( 'namespace' => $ns ) )` (`:961`), pelo
   valor estampado nos argumentos (`:926`). Com o mesmo caminho registrado sob
   dois espacos de nome, o indice fica com ele nas duas listas e o estampado so
   com o ultimo — logo `get_routes( <primeiro> )` **nao** o devolve. Como o
   recorte alimenta o mapa da superficie, cuja saida e byte a byte pela area 1 de
   `parity_specs.md`, T002 passou a recortar pelo estampado. Tem teste.
3. **`required` tem duas formas no mesmo formato**, e o legado aceita as duas:
   `true` na propria propriedade (draft 3, e e tambem a forma do parametro de
   topo, `class-wp-rest-request.php:917`) e lista de nomes dentro do esquema do
   objeto (draft 4). Escolher uma recusaria esquema que hoje passa.
4. **Chave presente com nulo vence o default**, porque `wp_parse_args()` e
   `array_merge( $defaults, $args )` — e `show_in_index: null` **esconde** a
   rota, ja que o indice testa com `empty()` (`:1662`). Por isso a normalizacao
   pergunta se a chave existe, e nao se o valor e nulo.

E um quinto, que vale para as duas metades: **`empty()` e verdadeiro para `'0'`**.
Espaco de nome `0`, caminho `0` e rotulo `0` sao recusados pelo legado, e um porte
que so comparasse com texto vazio registraria o que ele recusa.

### 🔴 As duas camadas de autorizacao agora estao lado a lado, com os defaults opostos

E o que `PERM-11` (BR-MIGRAR-097) queria tornar visivel — *"hoje elas moram em
pastas separadas e ninguem ve a divergencia"*:

| | camada de rotas | camada de operacao nomeada |
|---|---|---|
| declaracao de permissao ausente | **atende**, e avisa | **recusa**, e a operacao nao existe |
| regra | `I7` / BR-MIGRAR-074 | `I4` / BR-MIGRAR-071 |
| onde | `despacho/registro-de-rota-de-api.ts` | `operacao-nomeada/` |
| avisos que recusam | 2 de 6 (espaco de nome e caminho vazios) | **8 de 8** |

Nenhuma das duas foi "corrigida" na direcao da outra. Os dois arquivos de teste
afirmam o par, e o cabecalho de cada um aponta para o outro.

### Duas ordens de conferencia que surpreendem, e estao reproduzidas

1. **A categoria e conferida antes do formato** da operacao
   (`class-wp-abilities-registry.php:142` contra `:174`): declaracao sem rotulo
   **e** com categoria inexistente sai com a mensagem da categoria.
2. **Categoria vazia cai na mensagem de "nao registrada"**, nao na de formato,
   porque o portao e `isset( $args['category'] )` e `isset('')` e verdadeiro.

E a ordem **entre** os dois registros de operacao e contrato: o legado garante
que o de categorias e inicializado primeiro, *"para permitir que categorias sejam
registradas antes das operacoes que dependem delas"* (`:299`). Por isso
`criarRegistroDeOperacoesNomeadas()` **recebe** o registro de categorias e nao o
cria: `EXT-ORDEM` (BR-MIGRAR-106) e a tabela *Nao negociavel* poem a ordem de
arranque fora do que este agente muda.

### Por que "validacao de parametro vazia" e um campo, e nao um comentario

Uma funcao que devolvesse "valido" sem conferir nada seria uma mentira que T003
poderia acreditar. `ConferenciaDeParametros` tem o campo `conferido`, e em T002
ele e **`false`**: quem usar o resultado sem olha-lo esta usando uma conferencia
que nao aconteceu. **T005** passa a devolver `true`, e a tabela do que ele tem de
cobrir, criterio por criterio e com a ancora de cada parte, esta no cabecalho de
`despacho/validacao-de-parametro.ts`.

### O que T002 declarou e NAO emitiu

Todos pelo mesmo motivo — o barramento de ganchos nao tem tarefa neste pacote,
REQ-162 esta em `do-not-rewrite.md` — e todos no arquivo que os emitiria, como
T001 fez com `rest_endpoints`:

| ponto | ancora | onde esta declarado |
|---|---|---|
| o aviso de registro de rota fora de `rest_api_init` | `rest-api.php:82` | `avisoDeRegistroForaDoGancho()` |
| os dois avisos de registro de operacao fora do gancho, que **recusam** | `abilities-api.php:291` | `MENSAGENS_DE_AVISO_DE_GANCHO_DE_OPERACAO` |
| `wp_json_schema_allowed_keywords`, que muda o que a superficie publica | `json-schema.php:68` | `PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS` |
| `wp_register_ability_args` e `wp_register_ability_category_args` | `class-wp-abilities-registry.php:139` | comentario na posicao exata de cada `registrar` |

E um que nao e gancho: **o escape de `esc_html()`** nas mensagens que interpolam
nome (`:101`, `:149`, `:205`, `:265`). Aqui o nome entra cru, porque `esc_html()`
e de `plataforma/formatacao/`, feature `015` — o mesmo tratamento que
`contextos/conteudo` registrou para as tres entradas de requisicao dele. Para
nome que casa com o padrao nao ha diferenca; para o nome recusado pelo padrao, ha.

---

## O que T015 entregou

A linha da tarefa: *"o comportamento de US-7 existe e os criterios CA-7.1 a
CA-7.6 passam contra o sistema novo"*. Casos de uso: `UC-47`.

```
superficies-programaticas/
└── mapa-do-site/
    ├── pontos-de-configuracao.ts      blog_public '1', 2000 por pagina, 50000 no indice
    ├── contexto-do-mapa-do-site.ts    o que chega por ligacao tardia: opcoes, consultas, enderecos
    ├── provedor-do-mapa-do-site.ts    o provedor, o registro, o indice e o endereco de cada pagina
    ├── provedores-do-nucleo.ts        posts, taxonomies, users — CA-7.2 e CA-7.6 moram aqui
    ├── xml-do-mapa-do-site.ts         os bytes, conferidos contra o oraculo
    ├── instrucoes-para-rastreadores.ts robots.txt e as diretivas de robos (CA-7.4)
    ├── servidor-do-mapa-do-site.ts    WP_Sitemaps: iniciar conforme a opcao, e atender
    └── us-7-servir-indice-do-mapa-do-site.test.ts   24 testes
```

O modulo ganhou a **primeira operacao**, `iniciarMapaDoSite(contexto)`, com a
declaracao de permissao *"nenhuma"* que a pauta do `index.ts` ja previa. O
contexto chega por argumento: conteudo, termos, contas, enderecos e a data no
fuso do site sao de outros contextos, e o cabecalho de
`portas/porta-de-dados.ts` pedia exatamente isso a T015 — **a porta de dados
nao e tocada**, e montar a consulta por SQL daqui seria um segundo dono da
consulta publica. O mapa decide os **criterios** (com as chaves do legado, que
sao as que o ponto de extensao recebe); quem executa e o dono.

### 🟢 Os bytes sairam do oraculo executavel, e nao da leitura

Foi a primeira tarefa desta feature com o oraculo de `scripts/oraculo/` no ar.
Indice, as quatro paginas, `robots.txt`, o `404` e a meta de robos foram pedidos
por `curl`; para os vetores com a opcao desligada, sem links permanentes, com
fuso `America/Sao_Paulo` e com conteudo protegido, opcao e conteudo foram
trocados no banco do oraculo, capturados, e o estado da instalacao foi
devolvido. O serializador XML foi conferido no PHP do conteiner
(`SimpleXMLElement::asXML()`): elemento vazio fecha nele mesmo (`<url/>`,
`<loc/>`), `>` vira `&gt;`, o retorno de carro vira `&#13;`, aspas saem cruas, e
a declaracao perde o espaco antes de `?>` enquanto a da folha de estilo o mantem.

### 🔴 Duas frases do pacote que o legado desmente — seguido o legado, sem parar

Nenhuma das duas esta no texto do criterio de aceite de um jeito que o legado
contradiga; as duas estao na **explicacao** em volta, e por isso T015 seguiu o
legado e registra aqui, como manda o P1.

1. **`UC-47`, fluxo *robots.txt virtual*: *"com a indexacao desligada, o
   robots.txt passa a pedir que ninguem indexe"*.** O 7.1.2 nao faz isso:
   `do_robots()` (`wp-includes/functions.php:1713`) escreve as mesmas tres linhas
   com a opcao em `'0'` ou `'1'`, e so a linha `Sitemap:` some. Quem pede que
   ninguem indexe e a meta de robos de toda pagina (`noindex, nofollow`,
   `wp-includes/robots-template.php:70` e `:140`), conferida no oraculo. CA-7.4
   fala em *"instrucoes para rastreadores"*, sem nomear o arquivo, e e satisfeito
   pelas diretivas. **O `robots.txt` nao ganhou `Disallow: /`** — tem teste que
   afirma a ausencia, com os 67 bytes do oraculo.
2. **CA-7.3, `UC-47` e o card: *"as rotas nao sao registradas"*.** No legado o
   que nao e registrado sao os provedores e a linha do `robots.txt`; as regras de
   reescrita sao registradas **sempre**, *"in order to properly send 404s"*
   (`wp-includes/sitemaps/class-wp-sitemaps.php:60`-`:61`). A metade observavel
   do criterio — *"o pedido cai na resposta de endereco inexistente"* — e a que o
   legado entrega, e so a entrega **por causa** das regras: sem a etiqueta
   `%sitemap%`, `sitemap` nem seria variavel de consulta. `regrasDeReescrita`
   existe com a opcao desligada, e tem teste.

### O que T015 nao portou, e onde cada coisa fica

| o que | por que | onde fica a pendencia |
|---|---|---|
| 🔴 o corpo da folha de estilo XSL (`class-wp-sitemaps-stylesheet.php`, 318 linhas) | nenhum criterio de US-7 o cobre. O atendimento **decide** a folha (`{ tipo: 'folha-de-estilo', qual }`, e `404` para tipo desconhecido); o corpo nao existe | aqui. E superficie publicada (P8): quem a portar escreve o corpo atras da decisao que ja existe |
| `sanitize_text_field()` nas variaveis do pedido, `esc_url()` em `loc` e no `Sitemap:`, `esc_xml()` | sao de `plataforma/formatacao/`, feature `015` — o mesmo tratamento que T002 deu ao `esc_html()` | cabecalhos de `servidor-do-mapa-do-site.ts` e `xml-do-mapa-do-site.ts`, com o caso em que a diferenca aparece |
| os pontos de extensao do mapa e do robots (`wp_sitemaps_enabled`, `wp_sitemaps_max_urls`, `wp_sitemaps_index_entry`, `robots_txt`, `wp_robots`...) | REQ-162 esta em `do-not-rewrite.md` | **declarados** no arquivo e na posicao em que seriam emitidos |
| a traducao de `/wp-sitemap.xml` em `sitemap=index` | e da tabela de regras de `004-leitura-publica` | o mapa **declara** as cinco regras e as tres etiquetas (`REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE`); quem compoe as entrega a tabela |
| o corpo do `404` | e a apresentacao de erro do tema (`template-loader`), da borda | o atendimento devolve `status` e os cabecalhos de nao guardar; a consulta fica marcada como `404` por quem compoe |
| a etiqueta `<meta name='robots' ...>` | a arvore nao monta HTML | `conteudoDaMetaDeRobos()` devolve o texto do atributo |

E um achado de passagem, que nao e desta feature: no oraculo **sem** links
permanentes, `/wp-sitemap.xml` continua servindo o indice (`200`), e
`/?sitemap=index` **com** links permanentes recebe `301` para `/wp-sitemap.xml`
(redirecionamento canonico). As duas coisas sao da traducao de endereco e do
redirecionamento canonico, nao do mapa.

---

## O que esta decidido em outro lugar

| assunto | onde mora | por que nao aqui |
|---|---|---|
| perguntar permissao | `plataforma/autorizacao/` | e chamada 1.279 vezes em 224 arquivos; fica abaixo de todo contexto. As duas camadas desta feature **consomem** a decisao, nao a tomam |
| a consulta publica que alimenta feeds e mapa do site | feature `004-leitura-publica` | CA-8.2 exige *"a mesma consulta publica que a pagina, sem regra de visibilidade propria"*. Dois donos para a mesma consulta e duas regras de visibilidade |
| ler o conteudo para a representacao embutivel | `BC-01`, por ligacao tardia | `get_oembed_response_data()` (`wp-includes/embed.php:561`) chama `get_post()`; conteudo e de `BC-01` |
| a identidade da chamada | feature `001-identidade-e-acesso` | e US-5 que a **exige**, nao que a resolve. E REQ-012, que nao entrou no pacote |
| `blog_public` e os pontos de configuracao | ✅ T015: `mapa-do-site/pontos-de-configuracao.ts` | o P6 cobra que cada numero viva num ponto de configuracao nomeado com teste de borda proprio. **Gravar** a opcao na instalacao continua sendo da instalacao; aqui mora o valor de fabrica (`'1'`, `schema.php:474`) e a leitura |
| as 2 operacoes nomeadas do Akismet | `discard_log.md` | descartadas por escopo: *"extensao empacotada, nao nucleo"*. As **3 do nucleo** (`core/get-site-info`, `core/get-user-info`, `core/get-environment-info`) migram, e sao de T013 |
| a ordem de arranque | D1, contrato publico | AD-10: nenhum contexto importa outro no topo do modulo |
| o barramento de ganchos | nao tem tarefa neste pacote | REQ-162 esta em `do-not-rewrite.md`. Os pontos de extensao desta area ficam **declarados** no arquivo que os emitiria |

**Por que a porta de dados reaparece aqui com a forma que BC-04 e BC-05 ja
declaram.** AD-08 poe a porta no contexto que a **consome** e AD-10 proibe um
contexto importar outro no topo do modulo. Importar a porta de outro contexto
daqui criaria exatamente a ligacao horizontal que a regra de dependencia 3
recusa. Duas declaracoes da mesma forma e o preco da regra, e o preco esta
declarado.

---

## O que ninguem decidiu

Nenhum destes itens e de T001, e nenhum deles foi tocado. Cada um cai numa tarefa
adiante.

### 1. 🔴 `UC-44` manda nao copiar a falha aberta; todo o resto manda copiar

Esta e a divergencia mais consequente desta feature, e T001 nao a resolveu.

**O lado "preservar"**, que e o que o pacote inteiro diz:

- `I7` / BR-MIGRAR-074: *"rota sem `permission_callback` **funciona**, emitindo
  apenas aviso de uso indevido desde a 5.5.0"*, e o texto do aviso ensina a
  declarar liberacao explicita. Ancora: `wp-includes/rest-api.php:121-133`.
- `BR-HUMANA-008`, em `target_architecture.md`: *"`BC-09` reproduz a falha
  **ABERTA** por padrao, como o legado. Mudar isso produz um sistema **mais
  fechado** que o legado, e e decisao humana"*.
- A `spec.md` desta feature, nos riscos: *"portar isso e portar uma brecha
  conhecida; fecha-la e divergir sem card que autorize, porque REQ-138 ficou
  fora"*.
- O cenario `@divida-herdada` de
  `parity_tests/18-superficies-de-escrita-paralelas.feature`: *"rota de escrita
  sem retorno de permissao declarado funciona, nas duas metades... nenhuma das
  duas nega por ausencia de declaracao"*.
- O P1 da constituicao: divergir do observavel exige decisao humana registrada e
  citada no codigo. Sao exatamente tres, e nenhuma e esta.

**O lado "nao copiar"**, que e uma frase so:

- `UC-44`, secao *O que um porte precisa saber*: *"a camada REST e a unica das
  tres camadas de autorizacao que falha aberta... Num porte, essa e a inversao
  mais importante a **nao copiar**"*.

As duas leituras nao se somam: uma delas produz um sistema mais fechado que o
original. **T002 e T003 encostam nisso** — T002 escreve o aviso, T003 executa a
declaracao de permissao. Ate alguem decidir, o que o pacote manda e preservar, e
quem preservar **nao** precisa de referencia nenhuma; quem fechar precisa da
referencia que o P1 cobra, e ela nao existe.

> **Onde T002 deixou isto.** Preservado, e o conflito continua aberto. A propria
> linha da tarefa manda reproduzir o aviso, e a tabela dos sete artefatos esta no
> cabecalho de `despacho/registro-de-rota-de-api.ts`, junto com a declaracao de
> divida herdada que o cenario `@divida-herdada` cobra das duas metades. **T003
> topa nisso de novo**, e com mais consequencia: e ele que executa a declaracao
> de permissao e decide o que acontece quando ela nao existe.

### 2. 🔴 No legado o registro nao nasce vazio, e uma das duas rotas meta nao tem historia

O construtor (`class-wp-rest-server.php:103-160`, com o comentario
`// Meta endpoints.` em `:105`) semeia `$endpoints` com **duas** rotas:

| rota | metodo | esquema | historia |
|---|---|---|---|
| `/` | `GET` | `context` com `default: 'view'` | **US-3** (T007): *"ha um endereco que lista as rotas registradas e os seus esquemas"* |
| `/batch/v1` | `POST` | `validation` (`enum: require-all-validate \| normal`, `default: normal`) e `requests` (`maxItems: get_max_batch_size()`) | 🔴 **nenhuma das nove** |

T001 nao semeia nenhuma das duas, e a razao e de divisao de tarefa: as duas tem
esquema de argumento declarado, e *"o formato de esquema de rota"* e a entrega de
**T002**. Semear aqui exigiria inventar o formato uma tarefa antes de quem o
especifica.

**T002 tambem nao semeou, e agora por outro motivo.** O formato existe —
`despacho/esquema-de-rota.ts` —, e o que falta e a **funcao** de cada uma:
`get_index` e T007 (US-3) e `serve_batch_request_v1` nao tem tarefa. Semear com
funcao nula trocaria o registro vazio que `modulo.test.ts` afirma por duas rotas
que nao respondem. Quem fechar T007 semeia `/` com a funcao na mao — o formato ja
esta pronto para isso, e `declaracaoDoIndiceDeEspacoDeNome()` e o exemplo de como
uma rota meta e montada.

**A pendencia e `/batch/v1`.** E superficie publicada, e o P8 e absoluto: *"nao
remova funcao, constante, tabela, rota, superficie nem comportamento
publicado"*, e a tabela *Nao negociavel* poe remover rota entre o que exige
humano. Ela nao esta em `do-not-rewrite.md`, nao esta em `discard_log.md`, nao
esta nos dois descartes de *Fora de escopo* da `spec.md` (REQ-148 e REQ-179) e
nao tem card. **Ou seja: nao e descarte, e ausencia.** Quem fechar T007 registra
a pergunta em vez de decidir.

E note o numero: `get_max_batch_size()` (`:1722`) devolve **25**, por tras do
ponto de extensao `rest_get_max_batch_size`. E numero que o legado **tem**, logo
o P6 manda reproduzi-lo com o ponto de configuracao — nao e o caso do item 3.

### 3. 🔴 CA-4.4 pede um prazo de retencao que a constituicao proibe inventar

US-4 (REQ-141) cria um registro de acesso que **nao existe no legado**. `UC-44`,
nas pos-condicoes: *"nenhum registro da chamada foi guardado: nao ha log de
acesso a API"*. A `spec.md` e explicita na regra de negocio da propria historia e
nas perguntas em aberto: *"registro novo e permitido, prazo de retencao novo nao
se inventa"*.

E ainda assim CA-4.4 e **"o registro tem prazo de retencao declarado"**. A tabela
*Nao negociavel* da constituicao poe *"introduzir limite de taxa, prazo de
retencao ou qualquer numero que o legado nao tem"* entre o que o agente de
codificacao **nao** decide sozinho, com a resposta 19 e a 20 por tras. Os quatro
criterios de US-4 se dividem assim:

| criterio | situacao |
|---|---|
| CA-4.1, CA-4.3, CA-4.5 | registro e consulta novos. O P7 **permite**, com uma condicao: *"nenhuma ramificacao do codigo testa o resultado de escrever log"* |
| CA-4.2 | nao guardar credencial, corpo com dado pessoal nem cabecalho de sessao. Compativel, e e o que o slot `observabilidade` do `plan.md` compra com redacao embutida |
| CA-4.4 | 🔴 **conflito direto com P6 e com a tabela *Nao negociavel*** |

**T009 nao escolhe um lado.** O numero nao sai de `questions.md`, nao sai de ADR
e nao sai do legado.

### 4. 🔴 Duas rotas registradas que nenhum criterio de aceite cobre

Alem de `/batch/v1`, a leitura do oEmbed em T001 topou com outra. O controlador
registra **duas** rotas no espaco de nome `oembed/1.0`
(`wp-includes/class-wp-oembed-controller.php:25`, com `/embed` em `:34` e `/proxy` em `:63`):

| rota | permissao no legado | historia |
|---|---|---|
| `/embed` | `__return_true` — publica por desenho (`:42`) | **US-9** (T019) |
| `/proxy` | `get_proxy_item_permissions_check`, que exige `edit_posts` (`:148-151`) | 🔴 **nenhuma** |

`/proxy` e o lado **consumidor** — busca a representacao de um site remoto para o
editor. Ela tem declaracao de permissao e chamada HTTP de saida, e nao esta em
nenhum dos dois descartes da `spec.md`. Mesmo tratamento do item 2: registra-se a
pergunta.

### 5. 🔴 O cache de representacao embutivel: o `plan.md` e a arvore discordam

O `plan.md`, em *Modelo de dados*, poe o *"cache de representacao embutivel"*
nesta feature e diz que ele *"continua sendo conteudo: outro caso em que o
discriminador de tipo economizou uma tabela"*. O tipo existe mesmo:
`oembed_cache`, em `wp-includes/post.php:267`.

Mas quem **escreve** aquele tipo e o lado CONSUMIDOR
(`wp-includes/class-wp-embed.php:328` e `:514`), e US-9 e o lado PROVEDOR: a rota
`oembed/1.0/embed` chama `get_oembed_response_data()`
(`wp-includes/embed.php:561`, que e a ancora que a propria `spec.md` cita), e
aquela funcao **le** o conteudo e nao grava cache nenhum.

Pelo que a arvore mostra, portanto, **US-9 nao tem armazenamento**: ela le
conteudo, que e `BC-01` e entra por ligacao tardia. Quem fechar T019 confere isso
antes de abrir tabela ou tipo de conteudo. Esta registrado no cabecalho de
`portas/porta-de-dados.ts`, na tabela de quem usa a porta.

### 6. As perguntas que a propria `spec.md` ja registra em aberto

Nenhuma e de T001; ficam listadas porque cada uma cai numa tarefa adiante:

1. **REQ-138** (exigir declaracao explicita de permissao em toda rota, e recusar
   o registro sem ela) ficou `bloqueado` e nao entrou. E o item 1 acima por outro
   caminho: sem ele, *"o pacote porta a falha aberta sem nenhuma historia que a
   declare"*. **T002**, **T003** e **T007** dependem dele.
2. **O curto-circuito da operacao nomeada** (`I6` / BR-MIGRAR-073; o filtro
   `wp_pre_execute_ability` esta em `class-wp-ability.php:809` nesta arvore, que e
   a ancora de `UC-46` — BR-MIGRAR-073 cita `:787`) contorna normalizacao, validacao, permissao,
   execucao e validacao de saida — cinco etapas de uma vez —, e o docblock do
   legado avisa que *"a integridade do insumo passa a ser de quem
   curto-circuitou"*. REQ-143 especifica a execucao e **nao diz se o
   curto-circuito entra**: porta-lo e reproduzir um caminho que contorna toda a
   validacao, nao porta-lo e divergir de comportamento declarado. **T013**.
3. **REQ-012** (autenticar chamada nao interativa por credencial de aplicacao)
   ficou em `refinamento` e nao entrou, e US-1 e US-5 dependem dele. CA-5.2 —
   *"chamada autenticada por credencial de aplicacao nao exige esse token"* — nao
   tem como ser afirmado sem o outro lado. **T003** e **T011**.
4. **Os dois descartes de *Fora de escopo*** — REQ-148 (a superficie herdada com
   credencial no corpo da chamada) e REQ-179 (o segundo canal de escrita do
   painel) — estao em **conflito aberto e explicito** com a resposta 14, que
   nomeia os dois e decide que nao saem, porque *"o descarte vale como 'nao
   mudar', nunca como 'nao portar'"*. `ESC-SUPERFICIES` (BR-MIGRAR-107) manda as
   **quatro** superficies entrarem com o comportamento atual, e o ultimo cenario
   de `parity_tests/18-...feature` registra a divergencia entre os dois
   artefatos e nao a resolve. A tabela *Nao negociavel* poe *"resolver um dos
   conflitos entre card `wont` e resposta humana"* fora do que este agente
   decide. **Nenhuma tarefa deste `tasks.md` as implementa**, e se o conflito for
   decidido para o lado da resposta as duas precisam de spec propria, *"que este
   pacote nao tem"* (`plan.md`, *Migracao de dados*).
5. **REQ-148 e REQ-179 em *Sem tarefa*:** os 4 criterios de cada um afirmam a
   **ausencia** de um comportamento, e *"nao ha o que construir para
   satisfaze-los"*. Sao conferidos na revisao de superficie.

### 7. 🔴 Como uma classe propria de operacao nomeada chega num alvo sem classes de PHP

`ability_class` e argumento publicado do registro de operacao
(`abilities-api.php:283`-`:286`): quem registra pode pedir que o nucleo instancie
**outra** classe, que estenda `WP_Ability`.

T002 declarou o campo, porque remove-lo seria remover superficie publicada (P8),
e reproduziu o efeito dele que e decidivel: **as duas funcoes exigidas deixam de
ser exigidas**, porque o legado so as confere quando
`get_class( $this ) === self::class` (`class-wp-ability.php:302` e `:309`). Tem
teste.

O que **nao** foi reproduzido e a conferencia do valor: o legado recusa o registro
quando a classe nao estende `WP_Ability`
(`class-wp-abilities-registry.php:159`), e isso exige resolver um nome de classe
de PHP. A mensagem esta guardada em
`MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.classeInvalida` para que ninguem a
reescreva. **Decidir a forma e de T013**, que e a tarefa que executa a operacao e
portanto a unica que sabe o que uma "classe propria" precisa poder trocar. Nao e
descarte: nao esta em `do-not-rewrite.md` nem em `discard_log.md`.

### 8. 🔴 Tres caminhos do legado que o formato tipado torna inalcancaveis

Nenhum e descarte. Estao aqui porque sao consequencia do formato que T002
declarou, e porque quem um dia expuser estes registros a um chamador sem tipo —
e o slot de entrega desta stack e *"compilado para JavaScript"*, logo todo
chamador de terceiro e sem tipo — tem de decidir sobre eles.

1. **A promocao de tratador unico por `isset( $args['callback'] )`**
   (`rest-api.php:102`-`:105`). No legado `$args` e um vetor so, em que chave
   numerica e tratador e chave nao numerica e opcao da rota. Como o portao e
   `isset`, um tratador unico declarado com `'callback' => null` **nao** e
   promovido — e entao `callback` e `methods` viram **opcoes da rota**, nenhum
   tratador e registrado, e a rota existe sem atender nada.
   `ArgumentosDeRegistroDeRota` separa os dois e o caminho deixa de existir.
2. **`name` nos argumentos da operacao sobrescrevendo o nome do registro.**
   `$this->name` e atribuido antes de `prepare_properties()`
   (`class-wp-ability.php:181`) e o laco de atribuicao o sobrescreve se a chave
   vier nos argumentos, porque `property_exists()` e verdadeiro para ela
   (`:186`). Uma operacao registrada sob `a/b` pode responder `get_name() ===
   'c/d'`. `DeclaracaoDeOperacaoNomeada` nao tem campo de nome.
3. **A conferencia de "argumento que nao e vetor"** (`rest-api.php:136`-`:150`).
   Esta **mantida em execucao**, mesmo sendo inalcancavel por chamador com
   tipos, porque o aviso e contrato para quem estende — e a ressalva de
   BR-MIGRAR-091 — e porque remove-la trocaria o aviso por um erro de tipo mais
   adiante e menos informativo. O mesmo vale para o aviso de campo desconhecido
   na declaracao de operacao (`class-wp-ability.php:187`).

---

## Como conferir esta entrega

```sh
npm test            # a suite inteira; 8 testes sao de T001, 42 de T002 e 24 de T015
node --test dist/contextos/superficies-programaticas/modulo.test.js
node --test dist/contextos/superficies-programaticas/despacho/esquema-de-rota.test.js
node --test dist/contextos/superficies-programaticas/operacao-nomeada/esquema-de-operacao-nomeada.test.js
node --test dist/contextos/superficies-programaticas/mapa-do-site/us-7-servir-indice-do-mapa-do-site.test.js
```

⚠️ **T002 mexeu num teste de T001**, e so nele: o molde do mapa de rotas em
`modulo.test.ts` era `never`, e passou a ser `TratadorDeRota`. Era a troca que o
proprio T001 pediu — *"trocar esses dois `never` pelas interfaces e a primeira
linha de T002"*. As oito assercoes de T001 continuam valendo e continuam verdes.

A paridade desta area se prova por dois arquivos de
`.specify/migration/parity_tests/`:

- `18-superficies-de-escrita-paralelas.feature` (fatia 10, `casos_de_uso:
  UC-44, UC-45`), para US-1 a US-6;
- `11-contratos-de-leitura-de-terceiro.feature`, para US-7, US-8 e US-9.

Os dois declaram `area_da_decisao_2: AREA 1` no cabecalho, e a **area 1** da
Decisao 2 de `parity_specs.md` e *"contrato de terceiro: REST, XML-RPC, feeds,
sitemaps, oEmbed, OPML — **saida byte a byte**, zero divergencia"*. E o criterio
mais severo do pacote: nao existe "99,99% byte a byte".

**Nenhum dos dois arquivos pode ser executado hoje**, e nao e por falta de
codigo: `parity_specs.md` registra que o oraculo executavel *"nesta arvore **nao
existe**"*, e ele e T001 da feature `015`. Ate ele existir, aqueles cenarios sao
spec de um arnes, nao suite.

O que T001 entrega e o pre-requisito **estrutural** daqueles cenarios: a porta
que o duplo substitui, e **um registro por composicao** — que e o que o cenario
`@concorrencia` de `18-...feature` cobra, *"a decisao de cada uma corresponde a
sua propria identidade... nenhuma resposta contem dado da outra conta"*, e a
unica linha da metrica primaria com tolerancia zero **sem excecao**.

O que T002 acrescenta a prova de paridade e o **texto**: os seis avisos do
registro de rota e os oito dos registros de operacao estao em constante, com a
versao do legado, em ingles, e com teste que afirma cada mensagem. Quando o
oraculo executavel existir, a comparacao daqueles textos e um `diff`, nao uma
releitura. E o cenario `@divida-herdada` cobra uma coisa que ja esta feita: *"esta
divergencia de default esta declarada como divida herdada nas duas metades"* — a
metade nova e o cabecalho de `despacho/registro-de-rota-de-api.ts` mais o item 1
de *O que ninguem decidiu*.
