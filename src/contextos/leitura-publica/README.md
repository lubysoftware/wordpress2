# Modulo de leitura publica — feature `004-leitura-publica`

Epico EP-4 do backlog: *"entregar o conteudo publicado a quem nao tem conta"*.
Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, a porta
de dados, a resolucao de endereco e a resposta de endereco inexistente),
**T002** (a tabela de regras de traducao como dado, o casamento do endereco
contra ela e a coleta dos criterios diretos), **T003** (US-1: a resolucao do
endereco numa consulta de conteudo, com os predicados de tipo de consulta e os
tres ramos de excecao do `handle_404`) e **T013** (US-6: o portao de senha de
conteudo, o atestado de dez dias, o formulario `SCR-011` como dado e a recusa do
comentario em conteudo protegido).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que ninguem
decidiu.

---

## 🔴 O que quem pega T005, T007 ou T009 precisa saber antes de escrever a primeira linha

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
do legado. Quem fizer T005 le o estado **ja zerado**; quem precisar da distincao
de CA-1.4 le a consulta na etapa 3, antes da decisao.

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

Sao **dez** os pontos que o fluxo atravessa hoje, com o nome do legado e na
posicao do legado:

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
| `senhaDoConteudoExigida` | T013 | **nenhuma capacidade**, e aqui isso e a regra |
| `liberarCorpoProtegido` | T013 | idem |
| `gravarAtestadoDeSenha` | T013 | idem |
| `recusarComentarioEmConteudoProtegido` | T013 | idem |

As oito declaram "nenhuma" porque UC-01 e literal: *"nao ha verificacao de
capacidade. O portao e o `post_status`"*. As duas portas de autorizacao desta
feature sao o portao de `post_status` em **T009** (US-4), que ainda nao entrou, e
o atestado de senha de conteudo, que **T013 trouxe** — e que BR-MIGRAR-098
(`PERM-12`) registra como um dos cinco pontos que decidem acesso **sem consultar
o modelo de capacidades**.

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

### O que T005, T007 e T009 recebem pronto

| tarefa | o que ela acrescenta, e onde |
|---|---|
| **T005** (US-2) | a etapa 5 do atendimento, na posicao marcada em `requisicao/atender-leitura-publica.ts`. Os 30 predicados que a hierarquia de modelos le ja existem, em `consulta/tipo-de-consulta.ts`, com a tabela de nome publico para nome daqui — e ela le o estado **depois** do `set_404()`, que e o que o legado publica |
| **T007** (US-3) | o total encontrado e o numero de paginas em `ResultadoDaConsulta` (`set_found_posts`, `class-wp-query.php:3692`), e o tamanho de pagina, que nasce em 10 (`schema.php:434`). O ramo 3 de `handle_404` ja 404a a pagina de listagem fora de faixa, que e CA-3.3 |
| **T009** (US-4) | o estado e o autor em `ConteudoConsultado`, e o recorte por estado nos criterios que vao ao repositorio. ⚠️ **Enquanto T009 nao entrar, o repositorio decide sozinho o que e publico** — e e por isso que `REPOSITORIO_SEM_CONTEUDO` e o default, e nao um repositorio que devolve tudo |
| ✅ **T013** (US-6) | **fechada**: a senha entrou em `ConteudoConsultado` e o atestado esta em `senha-de-conteudo/`. A protecao e do **corpo**, nao da existencia: o conteudo protegido continua saindo nesta consulta, e o teste que afirma isso esta em `senha-de-conteudo/us-6-liberar-corpo-protegido.test.ts` |

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

- **Qual tema serve de oraculo para a hierarquia de modelos** (pergunta aberta da
  `spec.md`, US-2). Sem tema de referencia, a paridade de T005 nao e verificavel.
- **O lado cliente da pre-busca de navegacao** (US-7) esta ausente desta arvore
  (lacuna L4 de `soul.md`); a resposta 15 manda construir a partir do repositorio
  de origem.
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
de endereco) e `plataforma/tema` (a hierarquia de modelos), e aquele artefato nao
declara mapa de feature para pasta. A pasta leva o nome da feature, como
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

`npm test` na raiz. Duas suites, e elas nao se misturam:

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
- `senha-de-conteudo/us-6-liberar-corpo-protegido.test.ts` — os testes de T013:
  os seis criterios de aceite de US-6, os tres fatos do atestado, os quatro
  pontos de extensao que o fluxo atravessa, os quirks que um porte "limpo" apaga
  (a senha literal `0` que nao protege nada, o cookie gravado tambem com a senha
  errada, o atestado que vale para todo conteudo de mesma senha, o teto de 4096
  **bytes**), os vetores do hash portavel e o isolamento entre dois visitantes
  concorrentes.

Nenhum caso `UT-0xx` de `backlog/tests.md` e afirmado nas quatro: esses sao das
tarefas de teste de cada historia (T004, T006, T008, T010, T012, T014, T016,
T018).
