# Modulo de leitura publica — feature `004-leitura-publica`

Epico EP-4 do backlog: *"entregar o conteudo publicado a quem nao tem conta"*.
Tarefas fechadas com nota de entrega neste arquivo: **T001** (esqueleto, a porta
de dados, a resolucao de endereco e a resposta de endereco inexistente) e
**T002** (a tabela de regras de traducao como dado, o casamento do endereco
contra ela e a coleta dos criterios diretos).

Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que ninguem
decidiu.

---

## 🔴 O que quem pega T003 precisa saber antes de escrever a primeira linha

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

### 1. O 404 que este esqueleto devolve e provisorio por tarefa, e nao regra

T001 entrega, por texto da tarefa, *"resolve o endereco pedido para um conjunto
vazio de criterios e devolve a resposta de endereco inexistente"*. Isso e
exatamente o valor inicial do legado — `$set_404 = true`
(`wp-includes/class-wp.php:747`) —, e o que derruba esse valor sao **tres ramos de
excecao que dependem do resultado da consulta**, que e T003.

Consequencia que precisa estar escrita: enquanto a consulta nao existir, **todo**
endereco responde 404 aqui, **inclusive a home**. No legado, conjunto vazio de
criterios e `is_home()`, e `is_home()` esta na lista que limpa o 404
(`class-wp.php:784-795`). Quem fechar T003 sem trazer os tres ramos deixa a cara
publica do produto respondendo 404 na primeira pagina. Os tres estao transcritos,
com linha do legado, no cabecalho de `requisicao/situacao-da-resposta.ts`.

### 2. Os dois caminhos de 404 do legado sao diferentes, e so um deles esta aqui

| caminho | como o legado decide | quem o traz |
|---|---|---|
| **endereco que nao casa regra nenhuma** | `parse_request` poe o criterio `error` em `'404'` (`class-wp.php:167` e `:398-400`); a consulta le o criterio e se marca sozinha (`class-wp-query.php:1148-1150`); `handle_404` desiste no comeco; o codigo sai do envio de cabecalhos (`class-wp.php:455-466`) | ✅ **T002**, em `traducao-de-endereco/casar-endereco.ts` |
| **consulta que nao encontra conteudo** | `handle_404` olha o resultado e decide (`class-wp.php:724-805`) | **T003**, e e o que `situacaoDaResposta` ja esboca |

⚠️ T002 entrega a **marca** (`error` em `'404'` nos criterios), nao o codigo
HTTP: quem le o criterio e se marca e a consulta, e quem emite o codigo e o envio
de cabecalhos. Quem fizer T003 precisa ligar os dois — e lembrar que o caminho de
cima **nao** passa pelos tres ramos de excecao de `handle_404`.

Confundir os dois produz um sistema que 404a no lugar certo pelo motivo errado — e
o motivo e observavel, porque o primeiro caminho **nao** passa pelos tres ramos de
excecao do segundo.

### 3. A porta de dados tem `escrever`, numa feature de leitura, e isso e regra do legado — mas T002 ainda nao a usou

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

Os dois zeros de `modulo.test.ts` continuam valendo, e continuam sendo o teste que
apanha quem resolver dado no carregamento.

### 4. Os pontos de extensao chegam por argumento, porque o barramento nao existe

Sao **sete** os pontos que o fluxo atravessa hoje, com o nome do legado e na
posicao do legado:

| ponto | tipo | onde dispara | legado |
|---|---|---|---|
| `do_parse_request` | filtro, curto-circuita | antes da resolucao | `class-wp.php:148` |
| `query_vars` | filtro, substitui a **lista de nomes** aceitos | depois do casamento de regra, antes da coleta | `class-wp.php:311` |
| `request` | filtro, substitui os criterios | fim da resolucao | `class-wp.php:409` |
| `parse_request` | acao | depois da resolucao | `class-wp.php:418` |
| `pre_handle_404` | filtro, curto-circuita com qualquer valor `!== false` | antes da decisao de situacao | `class-wp.php:738` |
| `set_404` | acao | ao marcar a resposta | `class-wp-query.php:1858` |
| `wp` | acao | fim do atendimento, **sempre** | `class-wp.php:839` |

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

As tres declaram "nenhuma" porque UC-01 e literal: *"nao ha verificacao de
capacidade. O portao e o `post_status`"*. As duas portas de autorizacao desta
feature chegam depois, e nenhuma delas e uma capacidade perguntada na entrada: o
portao de `post_status` em **T009** (US-4) e o atestado de senha de conteudo em
**T013** (US-6) — que BR-MIGRAR-098 (`PERM-12`) registra como um dos cinco pontos
que decidem acesso **sem consultar o modelo de capacidades**.

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

### O que T003 recebe pronto, e o que ela ainda tem de trazer

Pronto: os criterios de consulta, com as quatro fontes, a marca de `error`, as
quatro propriedades publicas do casamento (`request`, `matched_rule`,
`matched_query`, `did_permalink`) e os pontos de extensao de `parse_request`.

Ainda falta, **nas posicoes marcadas em comentario** no corpo de
`criterios-diretos.ts` (a ordem e contrato publico, BR-MIGRAR-106):

| o que | legado |
|---|---|
| os criterios de tipo de conteudo (`post_type` e `name` a partir do nome do tipo) | `class-wp.php:313-317` e `:349-352` |
| o espaco de volta para `+` no criterio de taxonomia | `:356-362` |
| os dois filtros de visibilidade (taxonomia e tipo de conteudo nao consultaveis publicamente) | `:364-389` |
| a colisao de identificador numerico com arquivo de data | `:390`, e `wp-includes/rewrite.php:381` |

⚠️ A conversao de escalar em texto (`:338-347`) **nao** e lacuna: sob
`ValorDeCriterio` como T001 o declarou — `string` ou lista de `string` — ela nao
tem o que converter. A razao inteira esta no cabecalho de `criterios-diretos.ts`.

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
  de tentativa). Quem fizer T013 nao inventa numero (P6).

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

Nenhum caso `UT-0xx` de `backlog/tests.md` e afirmado nas duas: esses sao das
tarefas de teste de cada historia (T004, T006, T008, T010, T012, T014, T016,
T018).
