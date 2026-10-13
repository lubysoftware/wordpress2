# Modulo de leitura publica — feature `004-leitura-publica`

Epico EP-4 do backlog: *"entregar o conteudo publicado a quem nao tem conta"*.
Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, a porta
de dados, a resolucao de endereco e a resposta de endereco inexistente),
**T002** (a tabela de regras de traducao como dado, o casamento do endereco
contra ela e a coleta dos criterios diretos), **T003** (US-1: a resolucao do
endereco numa consulta de conteudo, com os predicados de tipo de consulta e os
tres ramos de excecao do `handle_404`), **T005** (US-2: a hierarquia declarada
de modelos, as sete saidas de `template-loader.php` e a etapa 5 do atendimento),
**T013** (US-6: o portao de senha de conteudo, o atestado de dez dias, o
formulario `SCR-011` como dado e a recusa do comentario em conteudo protegido),
**T015** (US-7: a declaracao de pre-busca do proximo destino, com as oito
exclusoes, as dez recusas de `add_rule` e o prefixador de padrao de endereco)
e **T017** (US-8: a expansao de macro textual no corpo, com o registro de marcas
como dado e o caminho proprio da marca dentro de atributo).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que ninguem
decidiu.

---

## 🔴 O que quem pega T007, T009 ou T011 precisa saber antes de escrever a primeira linha

### 0. Numa instalacao nova a tabela de regras esta VAZIA, e isso muda como se le o resto

Achado de T002, e e o fato mais consequente desta feature.
`WP_Rewrite::rewrite_rules()` abre com `if ( empty( $this->permalink_structure ) )
{ return $rewrite; }` (`wp-includes/class-wp-rewrite.php:1279-1281`), e o
instalador semeia `permalink_structure` como **texto vazio**
(`wp-admin/includes/schema.php:443`, com `rewrite_rules` tambem vazio em `:444`).

Logo, na instalacao nova de **site unico** — que e a premissa deste porte
(resposta 2 de `questions.md`) — nao existe regra de traducao nenhuma, o bloco de
casamento inteiro de `class-wp.php:165-298` **nao roda**, e todo criterio vem dos
parametros da requisicao: `/?p=42`, e nao `/2026/10/ola-mundo/`. Em instalacao de
**rede** o default e outro, `/%year%/%monthnum%/%day%/%postname%/`
(`schema.php:576`).

Duas consequencias:

- o conjunto vazio de criterios que T001 entregava **era o comportamento de
  fabrica**, e nao um esboco; o que faltava era o outro lado, os criterios
  diretos, que T002 trouxe;
- o teste de paridade de US-1 tem de cobrir as duas entradas, e e exatamente o
  que CA-1.2 pede. Nenhuma das duas e "a forma certa" do endereco.

### 1. ✅ O 404 deixou de ser o default, e e por isso que a home responde 200

T001 entregava *"a resposta de endereco inexistente"* porque nao havia consulta:
o valor inicial do legado e `$set_404 = true` (`wp-includes/class-wp.php:747`) e
os **tres ramos de excecao** que o derrubam dependem do resultado da consulta e
dos predicados de tipo de consulta. T003 trouxe os dois.

Consequencia, e ela e a entrega: o conjunto vazio de criterios — que e o que uma
instalacao nova de site unico produz para **qualquer** endereco (secao 0) — e
`is_home()`, `is_home()` esta no terceiro ramo (`class-wp.php:792`), e o legado
declara **200** (`:804`). O teste de `modulo.test.ts` que afirmava 404 para
`atender` foi reescrito para afirmar isso, e o 404 continua afirmado onde ele e a
resposta certa: uma consulta sem predicado e sem resultado.

Os tres ramos estao transcritos, com linha do legado, no cabecalho de
`requisicao/situacao-da-resposta.ts`, e cada um tem teste proprio em
`consulta/us-1-resolver-endereco-em-consulta.test.ts`.

⚠️ **Ao 404ar, `set_404()` zera os predicados da consulta, e quem le isso e a
etapa 5.** `handle_404` chama `$wp_query->set_404()` (`class-wp.php:800`), que
zera os 29 predicados de `init_query_flags()` e repoe **so** `is_feed`
(`class-wp-query.php:1846-1849`). O efeito e observavel pelo tema: um endereco
que era `is_single` e virou 404 **deixa de ser** `is_single`. T001 nomeou este
zeramento como pertencente a T003, e ele esta em
`consulta/consultar-conteudo.ts` (`consultaMarcadaComoNaoEncontrada`), aplicado
em `requisicao/atender-leitura-publica.ts` entre as etapas 4 e 5, que e a posicao
do legado. ✅ T005 le o estado **ja zerado**, e `us-2-escolher-apresentacao.test.ts`
o afirma: um endereco que era `is_single` e virou 404 **nao** publica `$more` nem
`$single`. Quem precisar da distincao de CA-1.4 le a consulta na etapa 3, antes
da decisao.

⚠️ **Dois valores que `handle_404` le de lugares diferentes.** `page` vem dos
criterios da **resolucao** (`$this->query_vars`, `class-wp.php:763` e `:766`);
`author` e `sitemap-stylesheet` vem dos criterios **da consulta**
(`get_query_var()`, `:751` e `:785`). Os dois conjuntos nascem iguais e divergem
quando `parse_query` corrige a pagina da frente ou quando `pre_get_posts` mexe na
copia da consulta. Ler os tres do mesmo lugar e a simplificacao obvia, e ela
troca o 404 de um endereco de pagina da frente com paginacao interna.

### 2. Os dois caminhos de 404 do legado sao diferentes, e os dois estao aqui

| caminho | como o legado decide | quem o trouxe |
|---|---|---|
| **endereco que nao casa regra nenhuma** | `parse_request` poe o criterio `error` em `'404'` (`class-wp.php:167` e `:398-400`); a consulta le o criterio e se marca sozinha (`class-wp-query.php:1148-1150`); `handle_404` desiste no comeco; o codigo sai do envio de cabecalhos (`class-wp.php:455-466`) | ✅ **T002** (a marca) e **T003** (a consulta que a le, em `consulta/analisar-consulta.ts`, etapa 15) |
| **consulta que nao encontra conteudo** | `handle_404` olha o resultado e decide (`class-wp.php:724-805`) | ✅ **T003**, os tres ramos |

⚠️ Os dois chegam ao **mesmo** codigo HTTP por caminhos diferentes, e a diferenca
e observavel: no primeiro, `situacaoDaResposta` devolve `codigoHttp: null` —
porque o legado volta sem chamar `status_header` — e quem emite o 404 e o envio
de cabecalhos, a partir do criterio `error`. O primeiro **nao** passa pelos tres
ramos de excecao, e `set_404()` ja zerou os predicados quando ele chega ali.

### 3. A porta de dados tem `escrever`, numa feature de leitura, e isso e regra do legado — e nem T002 nem T003 a usaram

A pos-condicao de UC-01 diz *"nada muda no armazenamento"* e *"o contador de
visualizacoes nao existe"* — e vale para o conteudo e para a visita. Mas a tabela
de regras de traducao de endereco e um **cache gravado na configuracao do site**, e
o legado o reconstroi **durante uma leitura publica** quando a opcao esta vazia:
`WP_Rewrite::wp_rewrite_rules()` chama `refresh_rewrite_rules()`, que termina em
`update_option( 'rewrite_rules', ... )` (`wp-includes/class-wp-rewrite.php:1493-1500`
e `:1509-1524`).

⚠️ **Correcao do que T001 previu:** T002 **nao** chama a porta, e a razao e de
desenho, nao de preguica. Esse ler-reconstruir-gravar e de `WP_Rewrite`, que
`target_architecture.md` mapeia para `plataforma/rotas/`; `WP::parse_request()`
so **chama** `wp_rewrite_rules()` (`class-wp.php:163`) e recebe dado. Por isso a
tabela chega por `FonteDeRegrasDeTraducao`, que e **funcao** e nao valor: a
chamada acontece uma vez por requisicao, naquela posicao, e pode gravar. Quem
implementar a fonte sobre a porta preserva a ordem — ler a opcao, reconstruir se
vazia, e gravar **so depois de `wp_loaded`** (`:1515-1523`: antes dela a gravacao
e adiada, *"as the rules may be partial"*).

⚠️ **T003 tambem nao a usou, e isso surpreende.** A consulta de conteudo le
`posts`, que e tabela de **BC-01** (`target_architecture.md` § *BC-01:
Conteudo*), e a regra de dependencia 3 proibe `contextos/leitura-publica/`
importar `contextos/conteudo/` *"sempre, sem excecao"*. Logo o acesso ao conteudo
chega por **ligacao tardia**, no contexto da operacao — e e tambem o que o
catalogo de testes descreve: os cinco casos de `REQ-038`, os cinco de `REQ-040` e
os cinco de `REQ-041` declaram como duplo *"repositorio de conteudo"*, e nao um
duplo de banco. A razao inteira esta em `consulta/conteudo-consultado.ts`.

Os dois zeros de `modulo.test.ts` continuam valendo, e continuam sendo o teste que
apanha quem resolver dado no carregamento.

### 4. Os pontos de extensao chegam por argumento, porque o barramento nao existe

Sao **dezesseis** os pontos que o fluxo atravessa hoje, com o nome do legado e
na posicao do legado:

| ponto | tipo | onde dispara | legado |
|---|---|---|---|
| `do_parse_request` | filtro, curto-circuita | antes da resolucao | `class-wp.php:148` |
| `query_vars` | filtro, substitui a **lista de nomes** aceitos | depois do casamento de regra, antes da coleta | `class-wp.php:311` |
| `request` | filtro, substitui os criterios | fim da resolucao | `class-wp.php:409` |
| `parse_request` | acao | depois da resolucao | `class-wp.php:418` |
| `parse_query` | acao | fim da analise da consulta | `class-wp-query.php:1164` |
| `pre_get_posts` | acao **por referencia**, e por isso aqui ela devolve os criterios | depois da analise, antes da consulta | `class-wp-query.php:1916` |
| `the_posts` | filtro, substitui a lista de registros | depois da consulta | `class-wp-query.php:3641` |
| `pre_handle_404` | filtro, curto-circuita com qualquer valor `!== false` | antes da decisao de situacao | `class-wp.php:738` |
| `set_404` | acao | ao marcar a resposta | `class-wp-query.php:1858` |
| `wp` | acao | fim do atendimento, **sempre** | `class-wp.php:839` |
| `template_redirect` | acao, **so** com o tema em uso | antes da escolha de apresentacao | `template-loader.php:23` |
| `exit_on_http_head` | filtro, default **verdadeiro** | antes de tudo, em requisicao `HEAD` | `template-loader.php:36` |
| `do_robots` e `do_favicon` | acoes | nas duas superficies, antes do laco de modelos | `template-loader.php:47` e `:55` |
| `{$type}_template_hierarchy` | filtro, substitui a **lista de candidatos** | por regra consultada, antes da procura | `template.php:62` |
| `{$type}_template` | filtro, substitui o **caminho** | por regra consultada, depois da procura | `template.php:103` |
| `template_include` | filtro, substitui o caminho final | fim da escolha | `template-loader.php:114` |

⚠️ **`pre_get_posts` dispara DEPOIS de `parse_query`, e o legado nao reanalisa.**
Uma extensao que troque `post_type` ali muda a consulta e **nao** muda
`is_post_type_archive`: a unica coisa que o legado refaz e o preenchimento de
`:1922`. Reanalisar "para ficar coerente" troca o predicado que o tema le.

⚠️ **Quatro pontos de extensao estao declarados e NAO disparam**, com o motivo em
cada arquivo: `parse_tax_query` (`class-wp-query.php:1420`),
`is_post_type_viewable` (`post.php:2476`), `wp_checkdate`
(`functions.php:7541`) e `sanitize_key` (`formatting.php:2207`). Os tres ultimos
sao de funcoes da plataforma que este modulo portou por dentro; o primeiro e da
montagem de taxonomia. Quando `plataforma/barramento/` existir, e ele que os
alimenta — a forma dos pontos nao muda.

`plataforma/barramento/` nao existe nesta arvore, e inventa-lo em T001 seria
decidir no lugar da feature 015. Entao os interceptadores chegam por argumento,
com retorno valendo onde o legado deixa valer — que e o que o P2 manda poder
conferir. Quando o barramento existir, e ele que passa a alimenta-los; a forma do
ponto nao muda.

⚠️ **Falta a prioridade inteira, e e lacuna declarada e nao decisao.** O
inventario de pontos de extensao que o P2 exige — *"com nome, argumentos e
ordem"* — nao existe neste pacote; a feature 001 registrou a mesma lacuna na
cadeia de autenticacao. Hoje a ordem e a do arranjo recebido.

### 5. ✅ O ponto de extensao `query_vars` esta no lugar dele

T001 o registrou como *"ainda nao esta em lugar nenhum"*, porque so tem efeito
quando existe coleta de criterio. T002 trouxe a coleta e ele entrou com ela, em
`traducao-de-endereco/nomes-de-criterio.ts`, na posicao de `class-wp.php:311`:
depois do casamento e antes da coleta. Ele e o que permite a uma extensao
acrescentar criterio proprio — sem o nome na lista, o valor que a regra de
traducao produz e **descartado** (`:334`), e e por isso que o docblock do legado
fala dos tres usos, *"added, removed, or changed"*.

### 6. A recusa com 400 e uma parada de requisicao, nao um erro de valor

`:322-329`: mesmo nome de criterio pelo corpo **e** pela consulta, com valores
diferentes, e o legado encerra a requisicao com `wp_die( ..., 400 )`. Esta
portada como `RecusaDeVariavelDivergente`, **lancada** e nao devolvida, porque
nada depois dela acontece no legado: nem a coleta dos nomes seguintes, nem a
consulta, nem os pontos `request` e `parse_request`. Quem montar a borda HTTP
transforma a recusa em resposta; o codigo e os dois textos (em ingles, que e a
chave do catalogo) estao declarados em `traducao-de-endereco/criterios-diretos.ts`.

---

## O que T001 entregou

```
leitura-publica/
├── index.ts                               composicao e barril
├── portas/porta-de-dados.ts               a porta, somente declarada
└── requisicao/
    ├── endereco-pedido.ts                 o endereco e os criterios de consulta
    ├── resolver-endereco.ts               `parse_request`, no caminho sem regras
    ├── situacao-da-resposta.ts            `handle_404`, no valor inicial
    └── atender-leitura-publica.ts         `WP::main`, a ORDEM das etapas
```

A superficie do modulo, com a permissao de cada operacao declarada na interface
(P4):

| operacao | tarefa | permissao exigida |
|---|---|---|
| `resolverEndereco` | T001 | **nenhuma capacidade**, declarada |
| `situacaoDaResposta` | T001 | **nenhuma capacidade**, declarada |
| `atender` | T001 | **nenhuma capacidade**, declarada |
| `consultarConteudo` | T003 | **nenhuma capacidade**, declarada |
| `escolherApresentacao` | T005 | **nenhuma capacidade**, declarada |
| `senhaDoConteudoExigida` | T013 | **nenhuma capacidade**, e aqui isso e a regra |
| `liberarCorpoProtegido` | T013 | idem |
| `gravarAtestadoDeSenha` | T013 | idem |
| `recusarComentarioEmConteudoProtegido` | T013 | idem |
| `declararPreBusca` | T015 | **nenhuma capacidade**, declarada |
| `expandirMacros` | T017 | **nenhuma capacidade**, declarada |

As onze declaram "nenhuma" porque UC-01 e literal: *"nao ha verificacao de
capacidade. O portao e o `post_status`"*. O unico `current_user_can()` de
`template-loader.php` esta no ramo de **inclusao** (`:133`), que nao e desta
feature, e ele nao decide a apresentacao: decide se quem pode trocar tema ve os
erros do tema.

As duas portas de autorizacao desta feature, e nenhuma delas e uma capacidade
perguntada na entrada, sao o portao de `post_status` em **T009** (US-4), que
ainda nao entrou, e o atestado de senha de conteudo, que **T013 trouxe** — e que
BR-MIGRAR-098 (`PERM-12`) registra como um dos cinco pontos que decidem acesso
**sem consultar o modelo de capacidades**.

## O que T002 entregou

```
leitura-publica/traducao-de-endereco/
├── nomes-de-criterio.ts      as duas listas de nomes, e o ponto `query_vars`
├── tabela-de-regras.ts       a tabela como DADO, a fonte dela e as regras fixas
├── cadeia-de-consulta.ts     `parse_str`, `urlencode`, `urldecode`, `addslashes`
├── casar-endereco.ts         o bloco de casamento (`class-wp.php:165-298`)
├── criterios-diretos.ts      a coleta das quatro fontes, e a recusa com 400
└── index.ts                  o barril da area
```

Fora da pasta nova, T002 mexeu em tres arquivos de T001, e so neles:
`requisicao/resolver-endereco.ts` passou a ser a **ordem** das seis etapas de
`parse_request` (cada etapa mora na pasta acima); `requisicao/endereco-pedido.ts`
ganhou as cinco entradas do servidor que T001 havia anunciado; e `index.ts`
exporta a area nova. **Nenhuma operacao nova entrou na superficie do modulo** — a
tabela e o `extra_query_vars` sao argumento e leitura de `parse_request` no
legado, nao funcao separada, e a tabela de operacoes acima cresce na tarefa de
cada historia.

A entrega em uma frase conferivel: `traducao-de-endereco.test.ts` resolve
`/2026/10/ola-mundo/` por uma tabela declarada e resolve os mesmos criterios por
`parametrosDeConsulta` com a tabela vazia, e afirma que os dois conjuntos sao
iguais **inclusive na ordem de insercao** — que e o que `WP::build_query_string()`
percorre (`class-wp.php:612`).

### As quatro lacunas que T002 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| arranjo com **chave nomeada** (`nome[chave]=`) nao e representavel em `CriteriosDeConsulta`, e o criterio e descartado | `cadeia-de-consulta.ts` | de quem precisar: alargar o tipo que T001 declarou muda contrato merged, e nenhuma regra do nucleo usa essa forma. Colchete vazio, que produz lista, esta reproduzido |
| o `mangling` de nome de `parse_str` para **colchete sem par** | `cadeia-de-consulta.ts` | do oraculo executavel (`ESC-ORACULO`, `BR-MIGRAR-116`): essas quatro funcoes sao do interpretador, e o corpo delas nao esta na arvore analisada |
| **dialeto** de expressao regular: padrao que o runtime nao compila conta como nao casou, que e o que `preg_match` devolve | `casar-endereco.ts` | idem — e e caso para o Parallel Run, nao para decisao de agente |
| a conferencia da **regra verbosa de pagina** depende de procurar pagina por caminho | `tabela-de-regras.ts` (`PaginaNoCaminho`) | de `BC-01` mais `plataforma/tipos-de-conteudo`, por ligacao tardia. Ausente a ligacao, a regra nao confirma — que e o que o legado faz quando a pagina nao existe |

### Duas contagens corrigidas

- Os nomes de criterio sao **46** publicos e **26** privados
  (`class-wp.php:18` e `:28`, contagem mecanica das duas linhas), e nao *"47 e
  25"*, como o cabecalho de `endereco-pedido.ts` dizia — a linha foi corrigida.
  `post_type` esta nas **duas** listas, e e assim no legado.
- Os pontos de extensao que este modulo atravessa sao **sete**, com a entrada do
  `query_vars`.

### ✅ As quatro pendencias que T002 deixou nomeadas, fechadas por T003

Todas **nas posicoes do legado** no corpo de `criterios-diretos.ts`, e nao no fim
(a ordem e contrato publico, BR-MIGRAR-106):

| o que | legado | onde |
|---|---|---|
| os criterios de tipo de conteudo (`post_type` e `name` a partir do nome do tipo) | `class-wp.php:313-317` e `:349-352` | `criterios-diretos.ts`, no laco |
| o espaco de volta para `+` no criterio de taxonomia | `:356-362` | `criterios-diretos.ts`, depois do laco |
| os dois filtros de visibilidade (taxonomia e tipo de conteudo nao consultaveis publicamente) | `:364-389` | `criterios-diretos.ts` |
| a colisao de identificador numerico com arquivo de data | `:390`, e `wp-includes/rewrite.php:381` | `traducao-de-endereco/colisao-de-identificador-numerico.ts` |

⚠️ A conversao de escalar em texto (`:338-347`) **nao** e lacuna: sob
`ValorDeCriterio` como T001 o declarou — `string` ou lista de `string` — ela nao
tem o que converter. A razao inteira esta no cabecalho de `criterios-diretos.ts`.
Mas atencao ao que T003 descobriu ali: o mapeamento de `:349-352` mora **dentro**
do `! empty()` de `:338`, logo `?livro=0` nao vira `post_type=livro`.

## O que T003 entregou

```
leitura-publica/consulta/
├── semantica-de-php.ts         empty, is_scalar, is_numeric, (int), absint, ==, sort, checkdate, sanitize_key
├── registro-consultavel.ts     os registros de tipo de conteudo e de taxonomia, como esta feature os le
├── conteudo-consultado.ts      a linha de `posts` que a leitura le, e o REPOSITORIO que a devolve
├── criterios-da-consulta.ts    `fill_query_vars` e a normalizacao dos criterios
├── tipo-de-consulta.ts         as 30 propriedades `is_*`, e o `set_404`
├── consulta-de-taxonomia.ts    `parse_tax_query` e o saneamento de `WP_Tax_Query`
├── contexto-da-consulta.ts     as colaboracoes tardias e as quatro opcoes do site
├── analisar-consulta.ts        `parse_query`, as dezesseis etapas
├── consultar-conteudo.ts       `WP_Query::query` — analisar mais buscar
└── index.ts                    o barril da area
```

Fora da pasta nova, T003 mexeu em seis arquivos, e so neles:
`traducao-de-endereco/criterios-diretos.ts` (as tres etapas inline que faltavam),
`traducao-de-endereco/colisao-de-identificador-numerico.ts` (a quarta, em arquivo
novo porque no legado tambem e funcao propria),
`requisicao/resolver-endereco.ts` (o contexto chega as opcoes),
`requisicao/situacao-da-resposta.ts` (os tres ramos de excecao e o 200),
`requisicao/atender-leitura-publica.ts` (a etapa 3, na posicao marcada) e
`index.ts` (a operacao nova e a area nova no barril).

A entrega em uma frase conferivel: `/2026/10/ola-mundo/` por uma tabela declarada
e `?year=2026&monthnum=10&name=ola-mundo` com a tabela vazia produzem a **mesma**
consulta — mesmos criterios na mesma ordem, mesmos 30 predicados, mesmos
registros —, o primeiro responde `is_single` e `/?cat=5` responde `is_archive`
**sem depender da contagem devolvida**, e a home de uma instalacao nova responde
200 em lugar de 404.

### As quatro lacunas que T003 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| o saneamento de identificador de termo (`sanitize_term_field` e `sanitize_title_for_query`) chega por ligacao tardia; ausente, o identificador e usado **como veio** | `consulta/consulta-de-taxonomia.ts` | de BC-02 mais o barramento de ganchos: as duas funcoes disparam ponto de extensao (`taxonomy.php:1846` e `:1849`), e P2 poe argumento de ponto no contrato |
| o criterio `tax_query`, que chega pronto como arranjo de arranjo, nao e representavel em `ValorDaConsulta` e e **ignorado** | `consulta/consulta-de-taxonomia.ts` | de quem tiver o chamador que o produza: `tax_query` nao e nome publico nem privado de criterio, logo nao vem da rede |
| `tag_id` em arranjo salta a clausula, e no legado `absint( array )` **derruba a requisicao** com erro de tipo | `consulta/consulta-de-taxonomia.ts` | do oraculo executavel (`ESC-ORACULO`): nenhuma regra do nucleo produz `tag_id` em arranjo, so `?tag_id[]=` |
| `page` resolvido pela colisao de identificador numerico e gravado como **texto**, e no legado e inteiro | `traducao-de-endereco/colisao-de-identificador-numerico.ts` | de quem precisar alargar `ValorDeCriterio`, que e contrato mesclado de T001. As tres leituras de `page` no nucleo convertem antes de comparar, logo nenhuma decisao muda; o que muda e o tipo do global que `register_globals()` publica |

### O que T007, T009 e T013 recebem pronto

| tarefa | o que ela acrescenta, e onde |
|---|---|
| **T007** (US-3) | o total encontrado e o numero de paginas em `ResultadoDaConsulta` (`set_found_posts`, `class-wp-query.php:3692`), e o tamanho de pagina, que nasce em 10 (`schema.php:434`). O ramo 3 de `handle_404` ja 404a a pagina de listagem fora de faixa, que e CA-3.3 |
| **T009** (US-4) | o estado e o autor em `ConteudoConsultado`, e o recorte por estado nos criterios que vao ao repositorio. ⚠️ **Enquanto T009 nao entrar, o repositorio decide sozinho o que e publico** — e e por isso que `REPOSITORIO_SEM_CONTEUDO` e o default, e nao um repositorio que devolve tudo |
| ✅ **T013** (US-6) | **fechada**: a senha entrou em `ConteudoConsultado` e o atestado esta em `senha-de-conteudo/`. A protecao e do **corpo**, nao da existencia: o conteudo protegido continua saindo nesta consulta, e o teste que afirma isso esta em `senha-de-conteudo/us-6-liberar-corpo-protegido.test.ts` |

## O que T005 entregou

```
leitura-publica/apresentacao/
├── caminho-de-modelo.ts        `wp_normalize_path`, `trailingslashit`, `validate_file`
├── objeto-consultado.ts        o `get_queried_object()` como a hierarquia o le, mais `is_front_page` e `is_page( $pagina )`
├── tema-ativo.ts               o tema como ligacao tardia: dois caminhos, dois nomes e tres perguntas
├── localizar-modelo.ts         `locate_template` e o portao de caminho permitido
├── contexto-da-apresentacao.ts as colaboracoes tardias desta etapa
├── hierarquia-de-modelos.ts    as dezessete regras como DADO, e `get_query_template`
├── escolher-apresentacao.ts    `template-loader.php` inteiro: a ordem, a reserva final e `template_include`
├── publicacao-para-o-tema.ts   `register_globals` — a etapa 5 do atendimento
└── index.ts                    o barril da area
```

Fora da pasta nova, T005 mexeu em tres arquivos, e so neles:
`requisicao/atender-leitura-publica.ts` (a etapa 5, na posicao marcada, mais o
contexto dela nas opcoes e a publicacao no resultado), `index.ts` (a operacao
nova e a area nova no barril) e `modulo.test.ts` (a superficie, que passou de
quatro operacoes a cinco).

A entrega em uma frase conferivel: a mesma consulta de um conteudo unico escolhe
`single-post.php` num tema e `index.php` noutro, sem que criterio, predicado ou
registro mude; a procura inteira fica legivel em `ApresentacaoEscolhida.procura`,
regra por regra; e a reserva final e sempre `index.php`.

### 🔴 Duas coisas que T005 **nao** e, e as duas surpreendem

1. **A escolha de apresentacao nao e etapa de `WP::main()`.** `wp-blog-header.php`
   tem duas linhas de corpo: `wp()` (`:16`) e o `require_once` de
   `wp-includes/template-loader.php` (`:19`). Ou seja a escolha roda **fora** do
   atendimento, depois da acao `wp` e depois do envio de cabecalhos. Por isso
   T005 entregou **duas** coisas em lugares diferentes: a etapa 5 (`register_globals`)
   dentro de `atender`, na posicao marcada desde T001, e a escolha como
   **operacao propria** do modulo. Po-la como etapa 6 de `atender` seria mudar a
   ordem de arranque, que a tabela *Nao negociavel* tira das maos do agente.
2. **A escolha para em `template_include`, e o que vem depois e inclusao.** O
   portao de `template-loader.php:115-122` — `realpath`, sufixo `.php` ou
   `.html`, `is_file`, `is_readable` —, o ponto `wp_before_include_template`
   (`:130`), o `include` com o `extract()` de `template.php:860` e o
   `wp_die( $theme->errors() )` de `:133-137` sao de `plataforma/tema`, feature
   009. ⚠️ **Consequencia:** o caminho que `escolherApresentacao` devolve **nao
   e** garantia de que algo sera servido — aquele portao pode recusa-lo.

### As dezessete regras, e os quatro pontos em que a ordem delas surpreende

A hierarquia e `HIERARQUIA_DE_MODELOS`, um arranjo de dezessete regras na ordem
de `template-loader.php:67-85`, cada uma com o nome do predicado do legado, o
`$type` que ela passa a `get_query_template()` e a lista de candidatos que ela
monta. Ela e **dado**, e nao `switch`: e isso que torna CA-2.3 conferivel sem ter
tema na mao.

| o que surpreende | onde |
|---|---|
| a ordem **nao** e a de especificidade: `is_single` vem antes de `is_singular`, `is_front_page` antes de `is_home`, `is_post_type_archive` antes de `is_archive` | `template-loader.php:67-85` |
| o laco **nao para** quando o predicado vale: ele para quando um modelo e **localizado**. Uma consulta de conteudo unico num tema que so tem `index.php` percorre as dezessete regras | `:94-100` |
| uma regra pode devolver vazio **sem consultar o tema** (`get_post_type_archive_template`), e o laco segue para a seguinte | `template.php:183-185` |
| duas regras compartilham o `$type` `archive`, logo compartilham o **mesmo** ponto de extensao | `template.php:161` e `:187` |

E duas que valem para `locate_template()`:

| o que surpreende | onde |
|---|---|
| o laco e **por candidato**, nao por diretorio: um tema pai com `single-post.php` vence um tema filho com `single.php` | `template.php:794-812` |
| candidato que existe e cujo caminho nao e permitido passa ao candidato **seguinte**, e nao ao diretorio seguinte | `template.php:808-811` |

### As tres lacunas que T005 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| `locate_block_template()` — o modelo em blocos — chega por ligacao tardia, **na posicao de `template.php:66`**; ausente, devolve o modelo classico sem toca-lo | `apresentacao/tema-ativo.ts` (`modeloEmBlocos`) | de `plataforma/tema`, feature 009. A ausencia e exatamente o que o legado faz num tema que nao declara `block-templates` (`block-template.php:65-67`), isto e num tema classico |
| `$query_string` e `$request`, dois dos sete globais que `register_globals` publica, nascem **vazios** | `apresentacao/publicacao-para-o-tema.ts` | o primeiro e de quem portar `WP::build_query_string()` (`class-wp.php:612`), que nenhuma tarefa desta feature nomeia; o segundo e o SQL, e e do repositorio. Os dois campos **existem** e nascem vazios, porque omiti-los faria o tema que le `$request` encontrar variavel ausente onde o legado tem texto |
| o objeto consultado e discriminado por **campo** e nao por classe, e `get_author_template()` e a unica regra do nucleo que usa `instanceof` | `apresentacao/objeto-consultado.ts` | do oraculo executavel (`ESC-ORACULO`): a divergencia possivel e um objeto que nao seja conta carregando `user_nicename` **e** `ID`, e nenhum dos seis colaboradores do legado produz um assim. Oito das nove regras ja decidem por campo no proprio legado |

⚠️ `ConsultaDeConteudo.objetoConsultado` **continua** `unknown`, que e o contrato
mesclado de T003: T005 nao o alargou. Quem le o conteudo dele passa pelo
reconhecedor `objetoConsultadoNoTema()`, e a **resolucao** — qual colaborador
produz qual objeto — continua fora deste modulo, no repositorio.

## O que T013 entregou

```
leitura-publica/senha-de-conteudo/
├── hash-do-atestado.ts                 `PasswordHash( 8, true )`: encode64, gensalt_private, crypt_private, HashPassword, CheckPassword
├── contexto-de-senha-de-conteudo.ts    as colaboracoes tardias, e o cookie que chegou
├── senha-exigida.ts                    `post_password_required`, e os dois interceptadores do pedido REST
├── atestado-de-senha.ts                o cookie: nome, dez dias, marca de cifrado, e a gravacao SEM conferencia
├── formulario-de-senha.ts              `SCR-011` como DADO: campos, mensagens, classes e a deteccao de senha errada
├── corpo-protegido.ts                  o corpo, o resumo, o titulo e as classes
├── recusa-de-comentario.ts             CA-6.5, e a unica peca cujo chamador e de BC-07
└── index.ts                            o barril da area
```

Fora da pasta nova, T013 mexeu em **tres** arquivos, e so neles:
`consulta/conteudo-consultado.ts` (o campo `senha`, que T003 havia anunciado),
`index.ts` (as quatro operacoes novas e a area no barril) e `modulo.test.ts` (a
lista da superficie). Mais uma linha em
`consulta/us-1-resolver-endereco-em-consulta.test.ts`: o default `senha: ''` no
montador de conteudo daquela suite, que e o valor da coluna numa instalacao nova
(`post_password varchar(255) NOT NULL default ''`, `schema.php:170`).

A entrega em uma frase conferivel: um conteudo com senha devolve **formulario** em
lugar do corpo enquanto nao ha atestado; o envio da senha certa produz um cookie
`wp-postpass_<md5 do endereco do site>` com hash `$P$B…` e vencimento de
**864.000 segundos**, e com esse cookie o **mesmo** conteudo devolve o corpo; a
senha errada produz cookie igualmente, o corpo continua oculto, e o formulario
volta com *"Invalid password."*; e em nenhum desses caminhos o portao pergunta
uma capacidade.

### 🔴 CA-6.4 nao acontece na pagina publica, e isso e leitura do oraculo

*"Quem pode editar o conteudo ve o corpo sem informar a senha"* existe no legado
em **um** mecanismo, e nao e um ramo de capacidade dentro do portao:
`post_password_required()` (`wp-includes/post-template.php:882-915`) **nao tem uma
unica chamada de `current_user_can()`**. Quem produz o comportamento de CA-6.4 e
a superficie REST, que instala `check_password_required()` como filtro do ponto
`post_password_required` (`class-wp-rest-posts-controller.php:455`, `:607` e
`:1994`), depois de `can_access_password_content()` decidir por duas portas:
contexto `edit` mais `edit_post`, ou a senha informada **no proprio pedido** e
comparada com `hash_equals` contra a coluna em texto claro (`:629-653`).

Consequencia observavel, reproduzida de proposito: **na pagina publica, um editor
autenticado tambem ve o formulario de senha.** Os dois interceptadores estao
portados em `senha-de-conteudo/senha-exigida.ts` — junto do ponto que eles
interceptam, porque o P2 poe nome, argumento, posicao e capacidade de alterar o
resultado no contrato do ponto, e porque a superficie REST nao existe nesta
arvore. Unificar as duas superficies num ramo de capacidade dentro do portao
mudaria a saida publica de toda instalacao com editor autenticado, e divergir do
observavel exige decisao humana registrada e citada no codigo (P1). Nao ha
nenhuma.

### Os tres fatos do atestado, e onde cada um esta afirmado

A resposta 8 de `questions.md` manda preservar os tres, e REQ-044 — o card que
pediria prazo, limite de tentativa e janela — esta em `do-not-rewrite.md`, logo e
escopo **recusado** e nao trabalho pendente (P6, e a tabela *Nao negociavel*).

| fato | onde esta | como esta afirmado |
|---|---|---|
| **dez dias** no navegador | `PRAZO_DO_ATESTADO_EM_SEGUNDOS`, de `wp-login.php:781` | o vencimento e `agora + 864000`, e o filtro `post_password_expires` o troca |
| **sem verificacao de idade no servidor** | a leitura nao recebe relogio | o contexto resolvido nao tem campo de tempo, e um atestado com vencimento no passado continua valendo |
| **sem limite de tentativa** | nao ha contador em lugar nenhum | a decima tentativa errada responde como a primeira |

### Tres achados de T013 que nao estavam em nenhum documento do pacote

1. **O atestado e gravado sem conferir a senha** (`wp-login.php:789`), e e essa
   presenca que o formulario le para dizer *"Invalid password."*
   (`post-template.php:1789`). A deteccao de senha errada e indireta — *"se o
   remetente e o proprio endereco e existe cookie, a senha falhou"* — e olha so a
   **presenca** do cookie, nunca o conteudo dele. Quem acertou a senha de outro
   conteudo e chega neste por um link interno ve o aviso sem ter digitado nada.
2. **A unica listagem do legado em que o protegido nao aparece e a busca.**
   `parse_search()` acrescenta `AND post_password = ''` quando o visitante nao
   esta autenticado (`class-wp-query.php:1534-1537`). E clausula de SQL, logo e
   do repositorio (BC-01) e **nao** deste modulo; esta registrada em
   `consulta/conteudo-consultado.ts` porque e a ressalva de CA-6.6 que um porte
   descobre tarde. Fora dela, nada no caminho publico recorta por senha:
   `has_password` e `post_password` sao criterios de `get_posts()`
   (`class-wp-query.php:2594-2600`) e nenhum dos dois esta nas listas de nome
   publico ou privado de `class-wp.php:18` e `:28`, logo nenhum vem da rede.
3. **Sair do sistema derruba o atestado.** `wp_clear_auth_cookie()` limpa
   `wp-postpass_` junto das credenciais de sessao, com o comentario *"Post
   password cookie"* (`wp-includes/pluggable.php:1245-1246`). Isso preenche, do
   outro lado, a lacuna que a feature 001 declarou em
   `contextos/identidade-e-acesso/sessao/saida.ts` — *"quais cookies exatamente a
   limpeza cobre... nao esta registrado em nenhum documento deste pacote"*. A
   linha fica aqui porque a regra de dependencia 3 proibe este contexto alcancar
   aquele; o nome esta em `nomeDoCookieDoAtestado`.

### As duas divergencias entre documento gerado e oraculo, registradas e nao escolhidas

As duas sao sobre a tela `SCR-011`, as duas tem ancora, e nenhuma delas e decisao
de agente — estao aqui para quem revisar:

| # | o que o documento diz | o que o oraculo tem | o que este porte fez |
|---|---|---|---|
| 1 | o comentario de `PTS-004` afirma *"Nenhum deles tem atributo de obrigatoriedade no HTML do legado"* | `post-template.php:1828` emite `required` no campo `post_password`, e § 3 de `target_screens.md` registra *"Obrigatorio no HTML: sim"*, com *"1 de 3 campos com `required`"* em § 6 | emite o `required` do legado. O **passo executavel** do cenario nao contradiz nada: ele diz *"nenhum campo recebeu atributo de obrigatoriedade que o legado nao tem"* |
| 2 | § 2 de `target_screens.md` registra o `action` do formulario como *"(vazio: posta na propria URL)"* | `post-template.php:1826` tem `site_url( 'wp-login.php?action=postpass', 'login_post' )`; o analisador estatico nao resolveu a expressao, e o `spec.route` do mesmo documento diz o certo | segue o oraculo e o `spec.route` (P1) |

### As quatro lacunas que T013 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| a **montagem do HTML** do formulario, e com ela `esc_url()`, `esc_attr()` e `esc_attr_x()` | `senha-de-conteudo/formulario-de-senha.ts` | da borda e de `plataforma/formatacao` (feature 015). Esta arvore nao monta marcacao — `identidade-e-acesso/administracao-de-contas/mensagens-da-administracao.ts` ja registrou a mesma regra —, e `esc_attr()` roda `_wp_specialchars()` com `$double_encode = false`, que um escape ingenuo nao reproduz |
| o ponto de filtro `the_password_form` | idem | dispara sobre o **HTML montado** (`post-template.php:1847`), logo mora na montagem. Nome, argumentos e posicao estao declarados no tipo, como o P2 exige |
| os quatro ramos de `class-phpass.php` que o atestado nao percorre (`bcrypt`, `gensalt_blowfish`, o recuo para `crypt()` e o recuo de entropia) | `senha-de-conteudo/hash-do-atestado.ts` | da feature 015, no slot de hash — e e la que este arquivo deve ser consolidado com o `hashPortavel` que a feature 001 declarou e deixou ausente. **Nao sao remocao de superficie** (P8): sao ramos inalcancaveis com `portable_hashes = true`, que e como as duas pontas do atestado instanciam a classe |
| o **vetor de conformidade** do hash | `senha-de-conteudo/us-6-liberar-corpo-protegido.test.ts` | do oraculo executavel (`ESC-ORACULO`, BR-MIGRAR-116). Os quatro vetores transcritos saem da leitura do algoritmo, conferidos contra uma segunda implementacao independente da mesma leitura — **nao** de uma execucao do legado, que nao ha nesta maquina. Eles fixam o algoritmo contra regressao, e nada mais |

### O que T013 nao portou de `post-template.php`, e de quem e

`get_the_content()` tem 80 linhas e so as tres do portao sao de US-6. O resto —
`generate_postdata()`, a divisao do corpo pelo `<!--nextpage-->`, a correcao da
pagina pedida, o `<!--more-->` e o texto do link de continuacao — e **T007** (a
paginacao) e **T005** (o que o tema le). `liberarCorpoProtegido` ocupa exatamente
a posicao do portao, que no legado e a primeira decisao depois do texto default
do link (`:318-321`): quem acrescentar o resto acrescenta **depois** dela, porque
o legado devolve o formulario sem nunca olhar a pagina pedida.

⚠️ E o filtro `the_content` roda **sobre o formulario tambem** (`:246-258`, sem
ramo para o caso protegido): a expansao de macro textual de US-8 (T017) acontece
dentro do formulario de senha, e curto-circuitar o filtro no caminho protegido
mudaria a pagina.

⚠️ `plan.md` pede *"a restricao de leitura (REQ-041) antes da senha de conteudo
(REQ-043)"*, e **T009 nao entrou**. Isso nao bloqueou T013 — e `tasks.md` declara
`T013` dependendo so de T001, T002 e T003 — porque o portao de senha nao le
`post_status` em nenhum dos seus quatro ramos: as duas decisoes sao
independentes no legado. Onde elas se encontram e a **ordem** da cadeia de
`wp_handle_comment_submission()`, que esta declarada em
`senha-de-conteudo/recusa-de-comentario.ts`: um rascunho **com** senha e recusado
por `comment_on_draft`, e nao por `comment_on_password_protected`.

## O que T015 entregou

```
leitura-publica/pre-busca/
├── padrao-de-endereco.ts         `WP_URL_Pattern_Prefixer` inteira: os sete contextos, o escape e o prefixo
├── configuracao-da-pre-busca.ts  a configuracao, os defaults do nucleo e do hospedeiro, e as tres listas de valores permitidos
├── contexto-da-pre-busca.ts      as colaboracoes tardias desta etapa
├── regras-de-pre-busca.ts        `WP_Speculation_Rules`: o coletor, as dez recusas e a forma de saida
├── declarar-pre-busca.ts         a montagem e a saida: as oito exclusoes, as condicoes da regra do nucleo e o que vai para a borda
└── index.ts                      o barril da area
```

Fora da pasta nova, T015 mexeu em dois arquivos, e so neles: `index.ts` (a
operacao nova e a area nova no barril) e `modulo.test.ts` (a superficie, que
passou de cinco operacoes a seis).

A entrega em uma frase conferivel: num site com enderecos amigaveis e sem
ninguem autenticado, a declaracao sai com o padrao do proprio site, a
agressividade `conservative` e **oito** padroes de exclusao prefixados pela
instalacao; com os enderecos amigaveis de fabrica — texto vazio — ela nao sai.

### 🔴 Tres coisas que T015 **nao** e, e as tres surpreendem

1. **Numa instalacao nova a pre-busca nasce DESLIGADA, e isso e o achado da
   tarefa.** `wp_get_speculation_rules_configuration()` abre com
   `if ( ! is_user_logged_in() && get_option( 'permalink_structure' ) )`
   (`wp-includes/speculative-loading.php:28`), e o instalador semeia
   `permalink_structure` como **texto vazio**
   (`wp-admin/includes/schema.php:443`) — o mesmo fato de que a secao 0 deste
   arquivo depende. Logo, na premissa deste porte (instalacao nova de site
   unico, resposta 2), a pagina **nao declara pre-busca nenhuma**, e
   `wp_print_speculation_rules()` retorna em `:333` sem imprimir. Em instalacao
   de rede o default e outro (`schema.php:576`) e a declaracao aparece.
   ⚠️ **Consequencia:** o ramo de exclusao de consulta de `:224` — o padrao que
   casa `nonce` — so e alcancavel quando um interceptador **forca** a
   configuracao. Nao e codigo morto, mas tambem nao e caminho de fabrica.
2. **A declaracao nao e etapa de `atender` nem de `escolherApresentacao`.**
   `wp-includes/default-filters.php:367` a pendura em `wp_footer`, com
   prioridade default: ela roda quando o tema emite o rodape, isto e **depois**
   de tudo que as outras operacoes de leitura enxergam. Por isso ela e **operacao
   propria** do modulo, pela mesma razao que `escolherApresentacao` o e. O
   gancho e a prioridade saem como dado (`GANCHO_DA_DECLARACAO`,
   `PRIORIDADE_DA_DECLARACAO`), porque `plataforma/barramento/` nao existe nesta
   arvore e a posicao de disparo e contrato publico (P2).
3. **`is_user_logged_in()` nao e camada de autorizacao, e a declaracao de
   permissao desta operacao continua "nenhuma capacidade".** A pergunta e "ha
   alguem autenticado", e o legado a usa para **desligar** um recurso, nunca
   para conceder acesso. Trata-la como autorizacao poria autorizacao numa
   operacao que UC-01 registra como nao tendo nenhuma.

### O que fica fora da declaracao, e por quatro mecanismos diferentes

CA-7.2 pede tres grupos — administracao, saida de sessao, acao com efeito — e o
legado os cobre por **quatro** mecanismos, nao um. Quem for conferir paridade
precisa olhar os quatro:

| o que o criterio pede | como o legado o tira | legado |
|---|---|---|
| administracao | o padrao `/wp-admin/*` no contexto `site` | `speculative-loading.php:208` |
| saida de sessao | o padrao `/wp-*.php` no contexto `site`, que pega `wp-login.php` — e a saida de sessao do legado e `wp-login.php?action=logout` | `:207` |
| acao com efeito, por endereco | **toda** consulta com enderecos amigaveis (`:222`); so a que contenha `nonce` sem eles (`:224`) | `:216-225` |
| acao com efeito, por marcacao | `a[rel~="nofollow"]`, mais `.no-{modo}` e `.no-{modo} a` | `:275-286` |

E tres garantias que o filtro nao consegue furar (`:244-260`, com os tres
comentarios numerados do proprio legado): `array_merge` poe as oito base
**primeiro**, `array_unique` nao deixa duplicar, `array_values` reindexa. O
docblock do filtro e literal: *"those cannot be modified using the filter"*
(`:233-234`).

| o que surpreende | onde |
|---|---|
| o filtro recebe a lista **vazia**, nao as oito base — e e por isso que nao consegue remove-las | `:241` |
| o que o filtro devolve e nao e texto desaparece em silencio | `:242` |
| em `prerender` a classe `.no-prefetch` **tambem** exclui, porque pre-renderizar implica pre-buscar | `:290-296` |
| `rel="nofollow"` esta reinterpretado: significa "nao transfira autoridade" e vale como "nao especule". Um link patrocinado perde a pre-busca | `:275-280` |
| `'immediate'` e agressividade **valida** e recusada em tres pontos diferentes: no saneamento, no default do hospedeiro e em `add_rule` | `:92`, `:135` e `class-wp-speculation-rules.php:193` |
| identificador de regra de **um** caractere e invalido (a expressao usa `+`, nao `*`) | `class-wp-speculation-rules.php:255` |
| 🔴 `template` e `stylesheet` estao **trocados** no prefixador: `template` recebe `get_stylesheet_directory_uri()` e vice-versa | `class-wp-url-pattern-prefixer.php:118-119` |

### ⚠️ Uma ancora da `spec.md` nao e desta historia, e a certa esta na mesma linha

A tabela de rastreabilidade da `spec.md` registra para US-7 duas ancoras:
`wp-includes/speculative-loading.php:330` e `wp-includes/functions.php:1612`. A
primeira esta certa — e `wp_print_speculation_rules()`. A segunda **nao e desta
historia**: `functions.php:1612` e `do_feed()`, e ela aparece na lista
*"Implementado em"* de UC-01 junto com `functions.php:1349` (`wp()`), de onde o
par foi copiado. As ancoras do modulo de pre-busca, conferidas no legado em
disco, sao:

| o que | ancora |
|---|---|
| a configuracao, o default e a sobreposicao | `speculative-loading.php:26`, `:124`, `:158` |
| a montagem e a saida | `:195`, `:330` |
| a estrutura e as validacoes | `class-wp-speculation-rules.php:73`, `:224`, `:236`, `:254`, `:269`, `:284`, `:296` |
| o prefixador | `class-wp-url-pattern-prefixer.php:64`, `:111`, `:132` |
| a posicao na pagina | `default-filters.php:367` |
| a saida em elemento de script | `script-loader.php:3021`, `:3079` |

Isto e **divergencia de documento, nao de comportamento**: nenhuma spec e nenhum
documento de migracao afirma coisa diferente do que o legado faz aqui, logo nao
ha conflito a parar. Fica registrado porque quem conferir paridade por
`functions.php:1612` vai conferir o feed.

### As tres lacunas que T015 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| a codificacao em JSON (`wp_json_encode` com `JSON_HEX_TAG \| JSON_UNESCAPED_SLASHES`) e a montagem do `<script type="speculationrules">` | `pre-busca/declarar-pre-busca.ts` | da plataforma e da borda: `wp_json_encode` tem limite de profundidade e saneamento de texto invalido proprios (`functions.php:4443`), e `wp_print_inline_script_tag` passa pelo filtro `wp_inline_script_attributes` e pelo `WP_HTML_Tag_Processor` (`script-loader.php:3021` e `:3079`). `DeclaracaoDaPreBusca` entrega o **valor**, as duas bandeiras **por nome** e o atributo do elemento — nada mais e nada menos. Mesma fronteira que T005 declarou para o portao de inclusao e que o README ja declarava para `wp_get_nocache_headers()` |
| `is_array()` sobre o retorno do filtro de configuracao: o alvo nao distingue arranjo de objeto | `pre-busca/configuracao-da-pre-busca.ts` | do oraculo executavel (`ESC-ORACULO`, resposta 16). A fronteira observavel esta reproduzida — escalar cai no default inteiro (`:74-79`), estrutura e saneada campo a campo —, e so instancia de classe divergiria |
| os sete caminhos da instalacao chegam como **caminho**, nao como endereco: `wp_parse_url( ..., PHP_URL_PATH )` nao e portado aqui | `pre-busca/padrao-de-endereco.ts` | de `plataforma/opcoes`, de BC-04 (uploads) e de `plataforma/tema` (feature 009). O default `CAMINHOS_SEM_PATH` e o que o proprio legado produz de endereco sem caminho (`(string) null` mais `trailingslashit`), e **nao** e um esboco — e tambem nao e o valor de fabrica, que nunca chega la porque a configuracao e ausente antes |

## O que T017 entregou

**US-8**, *"expandir macro textual no corpo do conteudo na renderizacao"*, em
`macro-textual/`. Nove arquivos, e o escopo e `wp-includes/shortcodes.php`
**inteiro** — 764 linhas, 18 funcoes publicadas — mais os quatro analisadores de
texto puro de que ele depende e que moram em outros dois arquivos do legado. A
tabela de qual nome do legado virou qual nome aqui, com as ancoras, esta no
cabecalho de `macro-textual/index.ts`; ela tem as 18 linhas, e a unica que nao e
funcao portada (`_filter_do_shortcode_context`) esta nomeada com o motivo.

A superficie do modulo ganhou **uma** operacao, `expandirMacros`, e ela declara
*"nenhuma capacidade"* como todas as outras da tabela. Aqui a declaracao e mais
forte do que um default aberto: `shortcodes.php` nao tem **uma** chamada de
`current_user_can()` em 764 linhas.

### 🔴 Tres coisas que quem for mexer nisto precisa saber

#### 1. O registro de marcas nasce VAZIO, e as 7 marcas de fabrica estao declaradas e nao registradas

Uma instalacao nova do legado registra sete marcas — `wp_caption`, `caption`,
`gallery`, `playlist`, `audio`, `video` (`media.php:2596`, `:2597`, `:2775`,
`:3435`, `:3710`, `:4005`) e `embed` (`class-wp-embed.php:69`). Nenhuma delas
esta em `REGISTRO_SEM_MACROS`, e **isso e P1 e nao atalho**: registrar a marca
sem o tratador cairia no ramo de `! is_callable()` (`:403`) e devolveria a marca
literal **com aviso de uso indevido**, que e visivel e e outro comportamento que
o de expandir. O registro vazio, ao contrario, cai num ramo que o legado tem e
documenta no proprio docblock de `do_shortcode()` (`:231-233`).

As sete estao em `MARCAS_DE_FABRICA` como dado, com a ancora e a feature que
porta cada tratador — seis em `006-biblioteca-de-midia` e uma em
`014-integracao-externa`. Quem as ligar chama `adicionarMacro` na ordem da
tabela, e nada do modulo muda.

#### 2. A metade de CA-8.4 que passa por KSES esta dormente, e a ausencia e declarada

`do_shortcodes_in_html_tags()` trata a marca dentro de atributo por **tres**
regras, e o legado so chama KSES numa delas:

| forma do atributo | passa por KSES? | estado nesta arvore |
|---|---|---|
| `<img src=[marca]>` ou `<img src = [marca]>` | **nao** (`:530-539`) | **identico ao legado** |
| `<img src="[marca]">` ou `<img src='[marca]'>` | **sim** (`:540-553`) | a marca fica literal, pelo default declarado |

A metade que nao passa por KSES e a que o legado escolheu nao filtrar, com um
comentario de cinco linhas que diz por que (*"implies unfiltered_html ... we
should avoid changing the output"*, `:531-536`). Ela esta completa.

A outra espera `wp_kses_one_attr()` (`kses.php:984`), que **nao** e higiene de
HTML e sim fronteira de autorizacao: ela depende de `wp_kses_allowed_html(
'post' )`, de `wp_allowed_protocols()` e de `esc_attr()`, isto e, da lista de
permissao que decide o que cada papel publica — `permissions.md` registra que
`editor` tem `unfiltered_html`. Ela mora no slot `analise-de-html`, cujo
candidato o [plano](../../../.specify/specs/004-leitura-publica/plan.md) desta
feature declara **nao escolhido** (*"recomendacao e recomendacao; nada aqui esta
escolhido"*), e escolher a tecnologia de um slot esta na tabela *Nao negociavel*
da constituicao.

O default, `SEM_LISTA_DE_PERMISSAO`, **nao e** "ainda nao implementado": ele
devolve texto vazio, que e a resposta de `wp_kses_one_attr()` para todo atributo
que a lista de permissao recusa, e o legado trata essa resposta num ramo proprio
(`if ( '' !== trim( $new_attr ) )`, `:548`) que **mantem o atributo original**.
Quem ligar KSES passa `ContextoDaMacro.sanearAtributo` e as duas metades ficam
iguais, sem que uma linha de `macros-em-atributo.ts` mude.

O que **esta** portado de `kses.php` sao `wp_kses_attr_parse()` e
`wp_kses_hair_parse()`, mais `wp_html_split()` de `formatting.php` — os tres sao
analisadores puros, e o legado o diz nos docblocks: *"Does not modify input. May
return 'evil' output."*. Nenhum consulta lista de permissao, nenhum decide
autorizacao. Quando `plataforma/analise-de-html/` existir, os tres descem para
la e nenhuma chamada muda de resultado.

#### 3. ⚠️ Uma afirmacao de paridade esta DERIVADA e nao conferida, e esta nomeada

`$content = $m[5] ?? null` (`:432`) e o segundo argumento de **todo** tratador de
marca. A derivacao, escrita por inteiro em `achadoComoNoPhp` de
`macro-textual/semantica-de-pcre.ts`: o grupo 6 da expressao e `(\]?)`, que casa
texto vazio em toda ocorrencia e portanto **sempre** participa; PCRE devolve "um
mais que o maior grupo fixado" e o interpretador preenche com texto vazio os
grupos anteriores que nao participaram. Logo `$m[5]` esta sempre fixado, o
`?? null` e codigo morto, e `[marca]` entrega **texto vazio** ao tratador.

O porte segue a *semantica* da linha e nao um palpite sobre a saida dela — e por
isso existe `achadoComoNoPhp`, que converte o achado deste runtime na forma do
arranjo do interpretador. O caso que encerra a questao e de uma linha no oraculo
executavel da resposta 16 (`scripts/oraculo/`): um tratador que registre
`var_export( $content )` para `[marca]`.

### Os quirks do legado que um porte "limpo" apaga em silencio, e onde cada um esta

| quirk | onde | o que acontece |
|---|---|---|
| a ordem da alternancia e a **ordem de registro** | `regex-de-macro.ts` | `array_intersect` preserva a ordem do primeiro arranjo (`:256`); reordenar por tamanho seria "consertar" o legado |
| `&#91;` sai como `&#091;` | `macros-em-atributo.ts` | a normalizacao de `:466-471` roda no corpo inteiro e o desfazer de `:576` nao a alcanca; o mesmo corpo sai **diferente** conforme alguma marca registrada apareca nele |
| o escape exige **os dois** colchetes | `expandir-macros.ts` | `[[marca]]` nao expande; `[[marca]` **expande**, e o `[` sobrevive por `:434` |
| o nome de atributo `0` desaparece | `atributos-da-macro.ts` | `! empty( $m[1] )` e nao `isset()`, e os ramos posicionais nao estao fixados naquele achado |
| o atributo entre aspas **vazio** nao grava | `atributos-da-macro.ts` | `isset(...) && strlen(...)` nos ramos 7 e 8 (`:625`, `:627`) |
| valor de atributo com `<` nao fechado vira vazio | `atributos-da-macro.ts` | *"Reject any unclosed HTML elements"* (`:634-641`) |
| `stripcslashes` em **todo** valor | `semantica-de-pcre.ts` | octal e o **default** e nao um caso proprio; `\x` sem digito devolve `x`; a barra final sobrevive |
| sem marca trocada, KSES **nao** roda | `macros-em-atributo.ts` | `if ( $count > 0 )` (`:545`) |
| `strip_shortcodes` leva o conteudo envolvido | `expandir-macros.ts` | `$m[1] . $m[6]` e nada mais (`:763`) |

### As tres lacunas que T017 declarou, e por que nenhuma delas e decisao

| lacuna | onde | de quem e |
|---|---|---|
| `wp_kses_one_attr()` chega por ligacao tardia; ausente, nenhum atributo e permitido e o legado mantem o original | `macro-textual/contexto-da-macro.ts` | de `plataforma/analise-de-html`, slot nao escolhido — ver o item 2 acima |
| `_doing_it_wrong()` chega por ligacao tardia e nao devolve nada; ausente, nenhuma decisao muda (P7) | `macro-textual/registro-de-macros.ts` | de `plataforma/barramento`. `AvisoDeUsoIndevido` e gemeo declarado do de `plataforma/autorizacao`, e a repeticao e deliberada: a regra de dependencia 3 proibe o import, e os dois descem juntos quando o barramento existir |
| os cinco pontos de extensao chegam por argumento, como os de T003 e T005 | `macro-textual/contexto-da-macro.ts` | idem. Sao `pre_do_shortcode_tag`, `do_shortcode_tag`, `strip_shortcodes_tagnames`, `shortcode_atts_{marca}` e o `wp_get_attachment_image_context` que `do_shortcode()` **registra e desregistra em torno de si** — este ultimo nao e disparado aqui, e `ExpansaoDeMacros.registrouContextoDeImagem` diz se esta chamada o registraria |

Tres diferencas de motor de expressao regular entre PCRE e este runtime foram
atravessadas, e cada uma tem a prova de equivalencia escrita no lugar em que ela
vale: o **quantificador possessivo** e o **`\s` restrito** no cabecalho de
`semantica-de-pcre.ts`, e o **subpadrao condicional** de `get_html_split_regex()`
no de `html-do-corpo.ts`. Nenhuma das tres e divergencia: as provas sao de que o
resultado nao muda. O que o possessivo tambem dava era **custo**, e isso fica
declarado e nao resolvido — por um teto de tamanho ou de tempo que o legado nao
tem, P6 e a tabela *Nao negociavel* recusariam (resposta 19).

### O que T018 recebe pronto

Os seis casos `UT-171-1` a `UT-171-6` do catalogo tem onde encostar: a expansao,
a marca literal, a pureza da operacao, o caminho de atributo com o registro de
`passosNoHtml`, a lista de marcas registradas e a delimitacao em colchetes. A
suite de T017 (`macro-textual/us-8-expandir-macro-textual.test.ts`) afirma os
**criterios de aceite** e nao transcreve nenhum caso do catalogo — T018 copia os
casos de `backlog/tests.md`, nao os reconstroi.

## O que esta decidido em outro lugar

- **A ordem das etapas do atendimento** e contrato publico (BR-MIGRAR-106,
  `EXT-ORDEM`) e a tabela *Nao negociavel* da constituicao a tira das maos do
  agente de codificacao. Ela esta declarada, com as etapas que faltam e a posicao
  de cada uma, em `requisicao/atender-leitura-publica.ts`. Acrescentar etapa no
  fim, em vez de na posicao marcada, e mudanca de contrato.
- **A identidade da requisicao** (etapa 1, `WP::init()`) e da feature 001,
  `sessaoDaRequisicao`. Este modulo nao a resolve e nao a guarda.
- **A decisao de capacidade** mora em `plataforma/autorizacao/`, abaixo de todo
  contexto. T009 a consome; nao a reimplemente aqui.
- **A GERACAO da tabela de regras de traducao** e `WP_Rewrite`
  (`rewrite-e-permalinks`), que `target_architecture.md` mapeia para
  `plataforma/rotas/` — *"Reescrita e permalink"* — e que o `plan.md` da feature
  `013` descreve como **codigo novo e nao porte**, porque num runtime de
  JavaScript nao ha `.htaccess` a escrever. Nenhuma tarefa desta feature a
  nomeia. Este modulo **consome** a tabela por `FonteDeRegrasDeTraducao` e nao
  gera nem reordena regra nenhuma; as regras que o legado tem como literal de
  codigo (`robots.txt`, `favicon.ico`, `sitemap.xml`, feed antigo, `wp-app.php`
  e as tres de cadastro) estao transcritas como dado em
  `traducao-de-endereco/tabela-de-regras.ts`, com a condicao de cada grupo.
- **Os valores dos cabecalhos de nao-cache** saem de `wp_get_nocache_headers()`
  (`wp-includes/functions.php:1508-1530`), que e funcao da plataforma,
  substituivel e com ponto de extensao proprio. `RespostaDaLeitura.semCache` so
  registra que o legado os manda; os valores nao sao deste contexto.

## O que ninguem decidiu

- **Qual tecnologia serve o slot `analise-de-html`**, e com ela se
  `wp_kses_one_attr()` e porte a mao ou biblioteca de terceiro. ⚠️ **T017 bateu
  nisto e nao decidiu**: e a metade de CA-8.4 que passa por KSES, e o
  [plano](../../../.specify/specs/004-leitura-publica/plan.md) desta feature
  declara o slot nao escolhido — *"recomendacao e recomendacao; nada aqui esta
  escolhido"*. *Escolher a tecnologia de qualquer slot do plano* esta na tabela
  **Nao negociavel** da constituicao, com a razao: *"o leque de candidatos de
  `refactor/tech-stack.json` e pesquisa, nao escolha; quem define e quem vai
  construir"*.

  O que a falta de decisao **nao** bloqueou: os tres analisadores puros
  (`wp_html_split`, `wp_kses_attr_parse`, `wp_kses_hair_parse`) estao portados,
  porque nenhum deles consulta lista de permissao nem decide autorizacao, e com
  eles a forma do atributo que o legado deliberadamente **nao** filtra esta
  identica. O que ela deixa dormente, e a ausencia esta declarada em
  `SEM_LISTA_DE_PERMISSAO`: a marca dentro de atributo **entre aspas**. Ver *O
  que T017 entregou*, item 2.

- **Qual tema serve de oraculo para a hierarquia de modelos** (pergunta aberta da
  `spec.md`, US-2). ⚠️ **Continua aberta depois de T005, e nada na arvore a
  resolve** — mas ela nao bloqueou a tarefa, e vale registrar por que, porque
  quem chegar aqui vai refazer a pergunta.

  O que ela decide esta em `parity_specs.md` § *Decisao 2*: HTML de tema e de
  painel e conferido por **comportamento de caso de uso** (os 47 UCs),
  explicitamente **nao** byte a byte, e `pending_decisions.md` registra o motivo
  — *"a ordem de emissao varia no proprio legado conforme tema; exigir byte a
  byte aqui congela acidente"*. Ou seja o tema de oraculo e necessario para
  comparar a **pagina renderizada**, que e trabalho da feature 009; a **ordem de
  procura** e nucleo, mora em `wp-includes/template-loader.php` e em
  `wp-includes/template.php`, e e o que T005 portou. Os quatro criterios de US-2
  sao conferiveis contra um tema declarado como duplo, que e tambem como os
  quatro casos de `UT-039` descrevem o cenario.

  O que **continua** sem resposta, e e de quem fizer a feature 009: contra qual
  dos tres temas empacotados (`twentytwentythree`, `twentytwentyfour`,
  `twentytwentyfive`) se compara a pagina servida — e dois dos tres sao temas em
  blocos, logo a resposta tambem decide quando `locate_block_template()` deixa de
  ser a ligacao tardia que T005 declarou. `parity_specs.md` registra a mesma
  lacuna como `LACUNA-IN-09`, *"os 3 temas e os 2 plugins empacotados entram no
  porte?"*.
- **O lado cliente da pre-busca de navegacao** (US-7). ⚠️ **Continua aberta
  depois de T015, e nada na arvore a resolve** — mas ela **nao bloqueou** a
  tarefa, e vale registrar por que, porque quem chegar aqui vai refazer a
  pergunta.

  A pergunta aberta da `spec.md` diz que *"metade do comportamento do modulo
  correspondente do legado esta no lado cliente, ausente desta arvore (lacuna L4
  de `soul.md`)"*, e que a resposta 15 manda construir a partir do repositorio
  de origem. Conferido no legado: **nao ha lado cliente deste modulo a buscar**.
  Uma busca por `speculation` em `wp-includes/js/` e `wp-admin/js/` devolve
  **zero** arquivo, e a unica ocorrencia fora dos tres arquivos de servidor e um
  comentario do analisador de HTML
  (`wp-includes/html-api/class-wp-html-tag-processor.php:4324`). Quem consome a
  declaracao e **o navegador**, pela Speculation Rules API, e o legado registra
  isso como degradacao graciosa: *"For browsers that do not support speculation
  rules yet, the `script[type="speculationrules"]` tag will be ignored"*
  (`speculative-loading.php:325`).

  Logo os tres criterios de US-7 sao sobre a declaracao **emitida pelo
  servidor**, e os tres sao conferiveis sem o repositorio de origem — e e isso
  que `pre-busca/us-7-pre-buscar-proximo-destino.test.ts` afirma. O que
  **continua** sem resposta, e nao e desta tarefa nem do agente: se o ganho
  parcial por desenho — a API e suportada so em navegadores baseados em Chromium
  — entra em algum criterio de paridade, e se a feature 009 ao trazer o
  repositorio de origem muda algo aqui. ⚠️ A pergunta **nao** foi marcada como
  resolvida em `spec.md` nem em `index.md`: aquele pacote e gerado, e resolver
  pergunta aberta nao e do agente de codificacao.
- **O conflito do card de descarte REQ-046** (gerenciador de lista de links e
  indice OPML) esta registrado e **nao resolvido** na secao *Fora de escopo* da
  `spec.md`. Nada nesta arvore o resolve, e a tabela `links` nao e tocada por este
  modulo. A tabela *Nao negociavel* da constituicao poe "resolver um dos conflitos
  entre card `wont` e resposta humana" entre o que exige humano.
- **O prazo e o limite de tentativa do atestado de senha de conteudo**: REQ-044
  esta em `do-not-rewrite.md`, e a resposta 8 manda preservar os tres fatos do
  legado (dez dias no navegador, sem verificacao de idade no servidor, sem limite
  de tentativa). ✅ T013 nao inventou numero nenhum (P6) — ver a tabela dos tres
  fatos na nota de entrega. O card continua **recusado**, e nao pendente.
- **Se a senha de conteudo continua em texto claro**: `BR-HUMANA-009` esta
  **PENDENTE** em `target_business_rules.md` e pergunta exatamente isso — texto
  claro, hash, ou cifrado com chave da instalacao. T013 **nao** resolveu a
  pergunta: reproduziu o observavel, que e a opcao (a), porque e o que o P1 manda
  fazer na ausencia de decisao humana, e as opcoes (b) e (c) mudam o produto (a
  (b) tira a exibicao a quem edita, que BR-MIGRAR-044 / `D6` poe como desenho).
  A pergunta esta citada em `senha-de-conteudo/senha-exigida.ts` e em
  `consulta/conteudo-consultado.ts`, no campo `senha`. Quem a responder mexe nos
  dois.

## Onde esta pasta mora no desenho

Esta feature **nao** e um `bounded context` de `target_architecture.md`: ela
atravessa `BC-01` (a consulta e a macro textual), `plataforma/rotas` (a traducao
de endereco), `plataforma/tema` (a hierarquia de modelos) e — desde T015 —
`BC-07` (a pre-busca: `topology_decision.md` funde o modulo
`speculative-loading` em `BC-07-apresentacao`, com os outros onze de estilo `D`),
e aquele artefato nao declara mapa de feature para pasta. A pasta leva o nome da feature, como
`001-identidade-e-acesso` fez com a dela, por tres razoes: a tarefa nomeia *"o
modulo de leitura publica"*; `BC-01` e tambem o destino da feature `002`, que esta
sendo construida em paralelo, e duas features escrevendo a mesma pasta e conflito
de merge e nao arquitetura; e a escolha nao muda nada do que o teste de borda da
Opcao 3 mede — *"muda a saida HTTP, o efeito no banco ou o comportamento de caso
de uso?"*.

Consolidar as pastas no desenho de `target_architecture.md` e trabalho de quem
tiver as 15 features na mao, e e reversivel: nenhum nome publico depende do
caminho do arquivo.

## Como conferir

`npm test` na raiz. Dois **tipos** de suite, e eles nao se misturam:

- `modulo.test.ts` — os testes de T001: **so** o que T001 entrega, mais tres
  invariantes que um esqueleto quebra em silencio, estado de modulo
  (`EXT-CONTEXTO`), trabalho no carregamento (`EXT-ORDEM`) e ponto de extensao
  que nao dispara ou nao altera o resultado (P2). T002 nao mudou nenhum deles:
  com a tabela vazia, que e o default de fabrica, a resolucao continua devolvendo
  o conjunto vazio de criterios.
- `traducao-de-endereco/traducao-de-endereco.test.ts` — os testes de T002: a
  tabela como dado, a ordem dela, as duas entradas que produzem os mesmos
  criterios, a marca de `error`, a precedencia das quatro fontes, a recusa com
  400, o ponto `query_vars`, as regras fixas transcritas, e os quirks do legado
  que um porte "limpo" apaga em silencio (o `empty()` que inclui o zero, o alvo
  que nao reinicia no laco, o recorte guloso da consulta, o `addslashes`).
- `consulta/us-1-resolver-endereco-em-consulta.test.ts` — os testes de T003: os
  quatro criterios de aceite de US-1, os tres ramos de excecao de `handle_404`,
  os tres pontos de extensao novos e o isolamento entre duas leituras
  concorrentes (`EXT-CONTEXTO`).
- `apresentacao/us-2-escolher-apresentacao.test.ts` — os testes de T005: os
  quatro criterios de aceite de US-2, as seis saidas de `template-loader.php` que
  nao passam pelo laco de modelos, a ordem dos tres diretorios de
  `locate_template()` contra um tema que **registra** o que lhe foi perguntado,
  os seis pontos de extensao novos, a etapa 5 do atendimento, e os quirks que um
  porte "limpo" apaga em silencio (o laco por candidato, o candidato recusado que
  nao tenta o diretorio seguinte, a regra que sai sem consultar o tema, o
  `remove_filter` do anexo, o arranjo interpolado como `Array`).
- `senha-de-conteudo/us-6-liberar-corpo-protegido.test.ts` — os testes de T013:
  os seis criterios de aceite de US-6, os tres fatos do atestado, os quatro
  pontos de extensao que o fluxo atravessa, os quirks que um porte "limpo" apaga
  (a senha literal `0` que nao protege nada, o cookie gravado tambem com a senha
  errada, o atestado que vale para todo conteudo de mesma senha, o teto de 4096
  **bytes**), os vetores do hash portavel e o isolamento entre dois visitantes
  concorrentes.
- `pre-busca/us-7-pre-buscar-proximo-destino.test.ts` — os testes de T015: os
  tres criterios de aceite de US-7, as oito exclusoes na ordem do legado com o
  prefixo de uma instalacao em subdiretorio, os quatro mecanismos de exclusao de
  CA-7.2, as dez recusas de `add_rule`, a sobreposicao do default por constante
  e por ambiente, os tres pontos de extensao novos, e os quirks que um porte
  "limpo" apaga em silencio (o `null` que desliga contra o `false` que nao
  desliga, o `'auto'` resolvido depois do filtro, a troca de `template` por
  `stylesheet`, o identificador de um caractere, a quebra de linha aceita no fim
  do identificador, o padrao cru prefixado duas vezes, o `(array)` que embrulha
  e o `array_filter` que descarta em silencio).
- `macro-textual/us-8-expandir-macro-textual.test.ts` — os testes de T017: os
  cinco criterios de aceite de US-8, as tres saidas antecipadas de
  `do_shortcode()`, o escape `[[marca]]` e o escape pela metade, os tres caminhos
  do laco de atributo com o registro de `passosNoHtml`, o registro condicional do
  filtro de contexto de imagem, as duas recusas de `add_shortcode()`,
  `strip_shortcodes()`, e os quirks que um porte "limpo" apaga em silencio (a
  ordem da alternancia, o `&#91;` que sai como `&#091;`, o nome de atributo `0`
  que desaparece, o valor entre aspas vazio que nao grava, `stripcslashes` com os
  sete casos do interpretador, o saneador que esvazia e mantem o original).

Nenhum caso `UT-0xx` ou `UT-171-x` de `backlog/tests.md` e afirmado nas sete:
esses sao das tarefas de teste de cada historia (T004, T006, T008, T010, T012,
T014, T016, T018).
