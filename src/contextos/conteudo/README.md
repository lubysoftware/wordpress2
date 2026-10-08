# Módulo de conteúdo — BC-01

Esqueleto entregue por **T001** da feature `002-autoria-e-publicacao`, com a
forma de armazenamento entregue por **T002**, a publicação por ato explícito
(US-1) entregue por **T003**, a gravação com estado resolvido (US-2) entregue
por **T005** e o rascunho automático reservado ao abrir o editor (US-11)
entregue por **T023**. Este arquivo é a leitura obrigatória de quem pegar T007 em
diante: ele diz o que já está decidido, o que está decidido **em outro lugar**, e
o que ninguém decidiu.

## O que T001 entrega, e só isso

> *o módulo carrega com as portas de dados, de relógio e de envio de e-mail
> declaradas, e o vocabulário de estado editorial do legado declarado como
> enumeração fechada*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T001

| arquivo | o que é |
|---|---|
| `index.ts` | a composição: recebe as três portas e devolve o módulo |
| `estado-editorial.ts` | os 12 estados de fábrica, a ordem de registro, as propriedades de cada um e os **dois** defaults que divergem |
| `portas/porta-de-dados.ts` | a única porta deste módulo para o banco |
| `portas/porta-de-relogio.ts` | o instante corrente, em segundos inteiros UTC |
| `portas/porta-de-email.ts` | envio com transporte selecionável, falha como valor — **com uma parada registrada no cabeçalho** |
| `modulo.test.ts` | afirma a entrega de T001 e as invariantes que um esqueleto quebra em silêncio |

**Nenhum prazo, contagem ou limite aparece neste módulo, e isso é proposital.**
Os números desta feature — os 60 segundos que separam publicado de agendado, o
intervalo do salvamento automático (`AUTOSAVE_INTERVAL`), a contagem de versões
guardadas (`WP_POST_REVISIONS`), os 7 dias do rascunho automático — entram nas
tarefas que os implementam (T013, T023, T021 e a feature 005), cada um num ponto
de configuração nomeado com o valor de fábrica do legado e com teste de borda,
como o **P6** da constituição exige. Número que aparece aqui antes da tarefa dele
é número sem teste de borda.

**Não há consulta nem transição de estado em T001.** A forma de armazenamento
entrou em T002 e a transição para publicado em T003, cada uma na seção abaixo.
Ver os conflitos abertos no fim deste arquivo antes de começar.

## O que T002 entrega, e só isso

> *as estruturas da seção Modelo de dados do plano existem e são lidas e gravadas
> pela porta de dados, incluindo a auto-referência que liga filho, anexo e versão
> ao registro pai*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T002

Tudo em `armazenamento/`, e **nenhuma regra de negócio desta feature ali**: o que
existe é a linha, a consulta e a sequência de comandos.

| arquivo | o que é |
|---|---|
| `armazenamento/index.ts` | a composição dos três repositórios sobre a porta de dados |
| `armazenamento/conteudo.ts` | `{site}posts`: as 23 colunas lidas, as **21** escritas, na ordem do legado |
| `armazenamento/metadado.ts` | `{site}postmeta`: a extensão aberta, com as cinco regras de efeito no banco |
| `armazenamento/versao.ts` | a versão anterior, que **não tem tabela**: é `posts` com `post_type = 'revision'` |
| `armazenamento/vinculo-com-o-pai.ts` | a auto-referência nas **três** semânticas que o plano manda separar |
| `armazenamento/esquema.ts` | o DDL das duas tabelas, byte a byte — e nada aqui o executa |
| `armazenamento/chaves-e-tabelas.ts` | os dois nomes de tabela, montados num lugar só |
| `armazenamento/leitura-de-linha.ts` | leitura de coluna, sem validar nada (`DB-DEG`) |
| `armazenamento/porta-falsa.ts` | a porta que **registra comando**, que T003 em diante vai usar |
| `armazenamento/armazenamento.test.ts` · `esquema.test.ts` | 38 testes de efeito no banco, com o DDL transcrito duas vezes de propósito |

### As três coisas de T002 que um porte distraído faria diferente

1. **Os dois defaults do estado continuam divergindo, e agora os dois existem.**
   T001 declarou as duas constantes; T002 põe o `publish` no DDL
   (`esquema.ts`) e deixa o `draft` para o caminho de escrita, que é T005. O
   teste `o default da coluna de estado no DDL e o do ARMAZENAMENTO` afirma que o
   default da aplicação **não** aparece no DDL. É BR-MIGRAR-001, e o alvo *"não
   pode unificar os dois defaults"*.
2. **`post_parent` virou três relacionamentos, como o plano manda** — página
   mãe, conteúdo anfitrião de anexo e conteúdo original de versão —, e o
   discriminador não foi inventado: é o `post_type` da linha filha, que é como
   `wp_delete_post()` pergunta pelas três, em três consultas sobre a mesma
   coluna (`wp-includes/post.php:3899`, `:3913` e `:3923`). O `0` continua sendo
   ausência, e não nulo.
3. **O metadado serializa pela regra do legado, com a dupla serialização.**
   `maybe_serialize()`, `maybe_unserialize()` e `is_serialized()` entraram em
   `../../plataforma/serializacao/talvez-serializar.ts` — ao lado do formato,
   onde o legado também os põe, e **não** dentro deste contexto, porque opções e
   os outros três metadados usam a mesma regra. BR-MIGRAR-082 é o teste:
   *"gravar a string `'a:1:{i:0;s:1:"b";}'` e lê-la de volta devolve a string,
   não o array"*.

### Uma divergência de T002, declarada e não fechada

⚠️ **A leitura que alimenta a comparação de "valor idêntico" passa pelo cache de
objeto no legado, e aqui não há cache.** `get_metadata_raw()` carrega *todas* as
linhas do conteúdo de uma vez e filtra a chave em memória; com o cache quente,
**nenhum** comando sai. O armazenamento reproduz a cadeia e o filtro em memória,
mas emite a consulta sempre — a sequência é a do legado **com cache frio**.

Isso não foi decidido aqui e não precisa ser: REQ-165 (*"decidir se o cache de
objeto nasce persistente"*) ficou fora do pacote, o slot `cache` do plano
recomenda cache por requisição, e a borda 5 de `target_architecture.md` manda o
cache **desligado nas duas metades** durante a coexistência — que é como a
comparação de paridade roda. Quando o cache existir, ele entra na frente desta
leitura sem mudar o que ela devolve. A nota está no cabeçalho de
`armazenamento/metadado.ts`.

### O que T002 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| executar o DDL | ninguém desta feature: a borda 4 diz que *"a metade nova lê e nunca escreve estrutura"*, e AD-11 proíbe mudança de esquema nesta fase |
| decidir o destino da sentinela `'0000-00-00 00:00:00'` | 🔴 `BR-HUMANA-003`, **pendente**. O armazenamento segue a premissa declarada por `target_data_model.md` (manter a cadeia literal) e registra a pendência em três arquivos |
| cobrar unicidade do identificador na URL | T007 (US-3). A dispensa em rascunho **é** a regra (BR-MIGRAR-005), e `UNIQUE` no DDL quebraria o produto |
| escrever `comment_count` | o contador é mantido por outro caminho e **pode ser suspenso durante lote** (`DB-TRG1`). Nenhuma escrita deste módulo o menciona |
| a cascata de exclusão | feature 005 (`PT-003`): `apagar` é só o `DELETE` da linha, e o P5 cobra o conjunto exato do que fica órfão |
| emitir ponto de extensão | não há barramento nesta árvore (REQ-162 está fora do pacote). Os quatro pontos do caminho de escrita estão **declarados** no cabeçalho de `armazenamento/conteudo.ts`, com argumentos e posição, para quem os for emitir |
| versionar objeto serializado | `O:` e `C:` passam pela farejada do legado e o codec deste repositório não os lê. A divergência está declarada no teste `DIVERGENCIA DECLARADA` de `talvez-serializar.test.ts` |

### Uma decisão de escopo que T001 tomou, e por quê

O vocabulário poderia ser só a lista de 12 nomes. Ele traz também **as
propriedades com que o legado registra cada estado** (`public`, `internal`,
`protected`, `private`, `publicly_queryable`, `exclude_from_search`,
`show_in_admin_all_list`, `show_in_admin_status_list`, `date_floating`), porque
elas são o conteúdo do registro no sistema analisado — não regra que T001 tenha
inventado. São elas que `wp_insert_post()` consulta para saber quais estados têm
data flutuante (`wp-includes/post.php:4780`) e elas que o endpoint REST de status
publica. Sem elas, cada uma das tarefas que precisa responder *"isto aparece em
consulta pública?"* (CA-2.3, CA-4.4, CA-7.3, CA-11.2) rederivaria a mesma tabela,
e a terceira derivação divergiria da primeira.

**Nenhuma regra deste módulo lê esses campos em T001**, e o que o arquivo não tem
é tão deliberado quanto o que ele tem: não há validador, não há guarda de tipo e
não há rótulo traduzível. A razão de cada ausência está no cabeçalho de
`estado-editorial.ts`.

## O que T003 entrega, e só isso

> *o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4,
> CA-1.5 passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T003

Tudo em `publicacao/`, e é a **primeira regra de negócio deste módulo**. O caso
de uso é [UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md), a que a
tabela de rastreabilidade de `spec.md` liga US-1, e a função do legado é
`wp_publish_post()` (`wp-includes/post.php:5404`-`:5468`).

| arquivo | o que é |
|---|---|
| `publicacao/contexto-de-publicacao.ts` | o contexto, as duas portas de ligação tardia e os **dez** pontos de extensão |
| `publicacao/permissao-de-publicacao.ts` | **CA-1.1**: a capacidade do tipo, as recusas literais, e a divergência de redação do critério |
| `publicacao/termo-padrao-na-publicacao.ts` | **CA-1.4**: os cinco ramos do laço, e a categoria como exceção por nome |
| `publicacao/transicao-de-estado.ts` | **CA-1.2**, **CA-1.3** e **CA-1.5**: os três pontos, a cadeia por prioridade e o ouvinte do núcleo |
| `publicacao/publicar.ts` | a operação `publicar` e `wp_publish_post()` — as duas, e a razão de serem duas |
| `publicacao/us-1-publicar-conteudo.test.ts` | 27 testes dos cinco critérios, por efeito no banco e por sequência de pontos |

`publicar` é a primeira entrada de `ModuloDeConteudo` e a primeira a declarar
permissão, como o **P4** exige. As outras cinco operações da tabela *Contratos*
do plano continuam fora: cada uma na tarefa dela.

### As quatro coisas de T003 que um porte distraído faria diferente

1. **Dois dos cinco critérios não estão em `wp_publish_post()`: estão num
   ouvinte.** CA-1.3 (o endereço definitivo) e CA-1.5 (o evento agendado
   removido) são efeito de `_transition_post_status()`, que o **próprio núcleo**
   registra no ponto `transition_post_status` com prioridade **5**
   (`wp-includes/default-filters.php:448`). Um porte que escrevesse
   `wp_publish_post()` "direto no banco" perderia os dois **em silêncio**. A
   cadeia inteira, com os outros cinco ouvintes de fábrica, a prioridade e o dono
   de cada um, está no cabeçalho de `publicacao/transicao-de-estado.ts`.
2. **A capacidade é o *slot* do registro do tipo, não a cadeia `publish_posts`.**
   O legado lê `$post_type->cap->publish_posts`, e é daí que vem a assimetria que
   US-8 descreve sem um único `if` sobre o nome `page`. Cravar a cadeia aqui
   publicaria página com capacidade de post.
3. **A categoria entra no laço do termo padrão por NOME, mesmo sem `default_term`
   declarado.** A condição é `'category' !== $taxonomy && empty(
   $tax_object->default_term )` (`:5422`): o padrão da categoria vive na opção
   `default_category`, semeada em `1` pelo instalador. E taxonomia que devolve
   erro é tratada como taxonomia que **já tem** termo, porque `! empty( WP_Error )`
   é verdadeiro no PHP.
4. **`wp_publish_post()` não tem portão de capacidade, e isso é superfície
   publicada.** Ela é chamada por `check_and_publish_future_post()`, onde não há
   ator nenhum — o disparo vem da fila. Por isso T003 entrega **duas** funções: a
   operação `publicar`, que declara a capacidade (CA-1.1), e
   `transitarParaPublicado`, que é a função do legado como ela é. Dar portão à
   segunda fecharia o sistema mais que o legado e quebraria T013.

### 🔴 O que T003 encontrou aberto, e NÃO fechou

**CA-1.1 diz "recusa explícita na tela", e o painel do legado não recusa: ele
rebaixa.** O critério escreve *"sem ela a ação é recusada com 403 na API e com
recusa explícita na tela"*, e a tabela de exceções de UC-03 repete — *"o painel
recusa com 'Você não tem permissão'"*. No código, `_wp_translate_postdata()`
reescreve o estado pedido para `pending` em vez de recusar
(`wp-admin/includes/post.php:150`-`:158`), com o comentário do próprio legado por
cima: *"Change status from 'publish' to 'pending' if user lacks permissions to
publish"*. E a tela também não **oferece** publicar: o vínculo
`wp:action-publish` só entra na resposta REST quando a capacidade existe
(`class-wp-rest-posts-controller.php:2352`). As únicas recusas por texto que o
legado tem para publicar estão na API REST e no XML-RPC.

T003 **não escolhe entre as duas leituras**, porque as duas levam ao mesmo lugar
nesta operação: sem a capacidade, a publicação não acontece. O que ela faz é
recusar como valor, com o código e o texto da API — a superfície que CA-1.1
nomeia com número —, **não** reproduzir aqui o rebaixamento (que é o `pending` de
CA-7.1, em T015) e registrar a divergência de redação para quem decide. O **P1**
exige decisão humana registrada para divergir, e nenhuma existe. Mesmo precedente
de T023 com CA-11.2 e de T017 com CA-8.4. A análise completa está no cabeçalho de
`publicacao/permissao-de-publicacao.ts`.

### 🔴 Um achado que muda o trabalho de T007

**`wp_publish_post()` não toca `post_name`.** A unicidade do identificador na URL
é cobrada por `wp_unique_post_slug()`, chamada de `wp_insert_post()`
(`wp-includes/post.php:5561`) — isto é, no caminho de **gravação**. Logo *"o slug
do rascunho muda sozinho ao publicar"* (BR-MIGRAR-005, CA-3.2) acontece quando se
publica **salvando**, e **não** quando se publica por esta transição: por esta
porta, o identificador duplicado sobrevive à publicação. São dois caminhos para
publicado, e só um deles cobra unicidade. Quem pegar **T007** precisa disso antes
de escrever a primeira linha.

### O que T003 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os oito testes de `backlog/tests.md` (UT-019-1 a UT-019-8) | **T004**, a tarefa `[P]` que roda em paralelo com esta |
| verificar os critérios da republicação nula (CA-5.1 a CA-5.3) | **T011** (US-5). A **guarda** está aqui porque é a terceira linha de `wp_publish_post()`: sem ela a transição dispararia duas vezes e CA-1.2 cairia |
| rebaixar para `pending` quem não pode publicar | **T015** (US-7), e passa pelo caminho de gravação |
| emitir os pontos de extensão por um barramento | ninguém deste pacote: REQ-162 está em `do-not-rewrite.md`. Os dez pontos deste caminho estão **declarados** em `publicacao/contexto-de-publicacao.ts`, com nome, argumentos, tipo (ação ou filtro) e posição, e chegam como interceptador opcional — ponto sem interceptador é, no legado, um no-op |
| invalidar cache | não há cache nesta árvore (REQ-165 ficou fora do pacote). `clean_post_cache()` e as onze chaves de `_transition_post_status()` estão nomeadas na posição exata do fluxo |
| gravar `_pingme` e `_encloseme`, e agendar `do_pings` | feature 007: é `_publish_post_hook()`, ouvinte do ponto `publish_post` com prioridade 5, declarado em `publicacao/transicao-de-estado.ts` |
| recontar termo | BC-02: é `_update_term_count_on_transition_post_status()`, prioridade 10 no mesmo ponto, com os dois curto-circuitos declarados |
| sanitizar o corpo | **ninguém**: REQ-030 está fora do pacote, e `wp_publish_post()` não toca `post_content` — esta tarefa não decide a sanitização de ninguém porque não grava corpo nenhum |

## O que T005 entrega, e só isso

> *o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3 passam
> contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T005

Tudo em `gravacao/`, e é `wp_insert_post()` (`wp-includes/post.php:4598`) menos o
que pertence a outras histórias. Os casos de uso são os dois que a tabela de
rastreabilidade de `spec.md` liga a US-2: [UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md),
que abre com *"duas regras para a mesma coluna"*, e
[UC-06](../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md), que
é o mesmo caminho de escrita visto por quem não pode publicar.

| arquivo | o que é |
|---|---|
| `gravacao/contexto-de-gravacao.ts` | o contexto, os cinco colaboradores de ligação tardia, as 21 colunas e os **seis** pontos de extensão |
| `gravacao/verdade-de-php.ts` | o `empty()` e a verdade de PHP, que decidem `'0'` ao contrário deste runtime |
| `gravacao/estado-na-gravacao.ts` | **CA-2.1**, **CA-2.2** e **CA-2.3**: as duas barreiras do `draft`, e a reescrita do anexo |
| `gravacao/data-na-gravacao.ts` | as quatro colunas `datetime`, e a sentinela que o rascunho grava |
| `gravacao/campos-na-gravacao.ts` | os 19 defaults e os campos cuja pergunta não é `empty()` |
| `gravacao/gravar.ts` | a operação, os **24 passos com o dono de cada um**, e os erros como valor |
| `gravacao/us-2-gravar-rascunho.test.ts` | 34 testes dos três critérios, por efeito no banco e por sequência de pontos |

`gravar` é a segunda entrada de `ModuloDeConteudo`, e é a primeira a declarar
**nenhuma** permissão — ver o item 1 abaixo.

### As cinco coisas de T005 que um porte distraído faria diferente

1. **`wp_insert_post()` não tem portão de capacidade, e isso não é brecha.** Ela
   é chamada pelo painel, pela API REST, pelo XML-RPC, pela publicação por
   e-mail, pelo importador e pelo próprio núcleo ao criar o rascunho automático
   (`:8373`) — cada superfície decide a permissão **antes**. O **P4** manda
   preservar *"o default de cada camada como ele é hoje, inclusive quando o
   default é permissivo"*, e o achado de QA de REQ-020 é literal: *"não há
   entrada inválida nem permissão ausente própria deste card"*. A única decisão
   de capacidade deste caminho é o identificador na URL de quem não pode
   publicar, que é CA-7.4, em **T015**.
2. **O `draft` do legado está em DOIS lugares, e os dois ficam.** No arranjo de
   defaults (`:4612`), que pega quem não manda a chave, e no `empty()` de
   `:4703`, que pega quem manda a chave vazia. Com os dois, não existe entrada
   que produza `publish` sem alguém pedir `publish` — que é o texto de CA-2.2.
3. **Os dois pontos que recebem o pedido veem o estado COMO ELE CHEGOU.**
   `wp_parse_args()` preenche chave ausente e o `empty()` trabalha numa variável
   local: quem manda `post_status: ''` continua com `''` no arranjo que chega a
   `wp_insert_post_empty_content` (`:4695`) e a `wp_insert_post_data` (`:4978`),
   enquanto a **coluna** recebe `draft`. O mesmo vale para o anexo: o pedido
   chega com `draft` e a coluna recebe `inherit`. Resolver o estado "uma vez só,
   no começo" muda o valor que dois pontos de extensão recebem, e o cenário
   `@ordem-de-emissao` de `PT-002` compara isso byte a byte.
4. **O rascunho grava a sentinela em `post_date_gmt`.** `draft` é um dos três
   estados com `date_floating`, logo a coluna GMT fica em
   `'0000-00-00 00:00:00'` enquanto `post_date` recebe agora, no fuso do site
   (`:4779`-`:4784`). Gravar a data GMT real num rascunho produz uma linha que o
   legado nunca produz. 🔴 O destino da sentinela é `BR-HUMANA-003`,
   **pendente**: T005 segue a mesma premissa de T002 — manter a cadeia literal —
   e **não decide nada**, importando a constante de `armazenamento/conteudo.ts`.
5. **Atualizar sem informar `comment_status` FECHA os comentários** (`:4814`), e
   atualizar sem informar o **estado** rebaixa o publicado para rascunho
   (`:4703`). As duas são do legado e as duas só não aparecem pela superfície
   porque `wp_update_post()` mistura a linha existente antes de chamar — e essa
   mistura **não** é desta tarefa (ver abaixo).

### 🔴 O que T005 declara, e que T007 herda

**Nesta tarefa, gravar conteúdo publicado sem informar identificador na URL grava
a coluna vazia.** O legado gravaria o título sanitizado e único
(`:4742`-`:4761`, `:4906` e a segunda escrita de `:5046`), e as três coisas são
**T007** (US-3). Para o rascunho de US-2 o valor coincide — o legado também grava
vazio, porque `draft`, `pending` e `auto-draft` dispensam o identificador —, e
para o publicado a diferença é exatamente o conteúdo da tarefa seguinte, que
depende desta. Está declarada em três lugares: no `@see` de
`resolverIdentificadorNaUrl`, na tabela de passos de `gravar.ts` e aqui.

Somado ao achado de T003 (`wp_publish_post()` não toca `post_name`), T007 chega
com o mapa pronto: **são dois caminhos para publicado, só um deles cobra
unicidade, e o que cobra é este.**

### A função do legado que T005 NÃO portou, de propósito

**`wp_update_post()`** (`:5327`) não está aqui. Ela não é outra regra: é uma
**mistura** — lê a linha, sobrepõe o pedido sobre ela e chama `wp_insert_post()`
(`:5390`). Três das suas quatro decisões próprias pertencem a outras tarefas: a
delegação do anexo a `wp_insert_attachment()` (BC-04), o descarte de
`tags_input` igual às etiquetas atuais (BC-02) e o `$clear_date` dos estados de
data flutuante, vizinho direto do que **T013** resolve.

⚠️ **Isso não deixa CA-2.2 em aberto:** a mistura faz o estado chegar a
`wp_insert_post()` **preenchido com o valor gravado**, logo omitir o estado ali
**conserva** o que a linha tinha e nunca publica o que não estava publicado. Quem
a portar (T015 ou T017, que a usam para devolver conteúdo ao autor) encontra a
resolução de estado pronta em `gravacao/estado-na-gravacao.ts`.

### O que T005 NÃO fez, e por quê

A tabela de 24 passos no cabeçalho de `gravacao/gravar.ts` tem a lista completa,
com a linha do legado de cada passo e um "sim" ou "não" por linha. Em resumo:

| não fez | de quem é |
|---|---|
| os quatro testes de `backlog/tests.md` (UT-020-1 a UT-020-4) | **T006**, a tarefa `[P]` que roda em paralelo com esta |
| sanitizar e tornar único o identificador na URL | **T007** (US-3) — ver a seção acima |
| a comparação de 60 segundos que troca publicado por agendado | **T013** (US-6). É o único passo desta função que lê a porta de relógio |
| esvaziar o identificador de quem não pode publicar | **T015** (US-7, CA-7.4), e é ela que acrescenta a `base` de autorização ao contexto |
| guardar a versão anterior | **T021** (US-10) — e o achado é que ela **não** é código de `wp_insert_post()`: é ouvinte do ponto `post_updated`, com prioridade 10 (`default-filters.php:450`) |
| o rascunho automático | **T023** (US-11), e a recusa de `auto-draft` pedido pela API (CA-11.3) não está nesta função: está na superfície REST |
| emitir a transição de estado e a família `save_post` deste caminho | ninguém deste pacote emite ponto (REQ-162 está em `do-not-rewrite.md`). Os sete estão declarados em `gravar.ts` com nome, argumentos e posição. A fronteira cai antes deles porque emitir **meia** transição — interceptadores sem o ouvinte do núcleo — perderia o `guid` e a limpeza do evento agendado em silêncio |
| a categoria padrão, o `tax_input` e a recontagem de termo do caminho de gravação | BC-02 (a metade que CA-1.4 cobra já está em `publicacao/`) |
| `sanitize_post()`, `wp_encode_emoji()`, `wp_unslash()` e `sanitize_trackback_urls()` | `plataforma/`, feature 015 — cada um com a âncora em `campos-na-gravacao.ts`. O primeiro carrega 🔴 REQ-030, que está **fora do pacote** |
| o arquivo e o contexto do anexo, a imagem destacada e o modelo de página | BC-04 e BC-07. O `inherit` do anexo **está** aqui, porque é a linha seguinte da função portada (mesmo precedente da guarda de republicação nula de T003) |
| o erro de banco (`db_insert_error`, `db_update_error`) | os dois códigos e os quatro textos estão declarados em `ERROS_DA_GRAVACAO`, e o ramo **não é alcançável**: a porta de dados de T002 não devolve o `false` de `$wpdb`. Quem construir a camada de dados (feature 015) liga a falha a eles |

## O que T023 entrega, e só isso

> *o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3,
> CA-11.4 passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T023

Tudo em `rascunho-automatico/`, e é `get_default_post_to_edit( $tipo, true )`
(`wp-admin/includes/post.php:758`) mais as três regras que mantêm o estado
`auto-draft` do jeito que ele é. O caso de uso é o único que a tabela de
rastreabilidade de `spec.md` liga a US-11:
[UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md), cuja primeira
pré-condição é literal — *"o registro existe, ainda que como `auto-draft` criado
pelo ato de abrir o editor"*.

| arquivo | o que é |
|---|---|
| `rascunho-automatico/contexto-de-rascunho-automatico.ts` | o contexto, o gancho e a recorrência da coleta, a fila, os **quatro** pontos de extensão e o ramo da função que **não** grava |
| `rascunho-automatico/permissao-do-editor.ts` | **CA-11.1**: as **duas** capacidades do tipo, e as três superfícies que recusam diferente |
| `rascunho-automatico/visibilidade-do-rascunho-automatico.ts` | **CA-11.2**: as três barreiras da invisibilidade, as seis exclusões literais e as 🔴 duas exceções |
| `rascunho-automatico/estado-pedido-pela-api.ts` | **CA-11.3**: a enumeração derivada do registro, o atalho de atualização e a 🔴 superfície que aceita |
| `rascunho-automatico/salvamento-automatico.ts` | **CA-11.4**: `AUTOSAVE_INTERVAL`, a borda do intervalo e para onde a escrita vai |
| `rascunho-automatico/abrir-editor.ts` | a operação, os **nove passos com o dono de cada um**, e os erros como valor |
| `rascunho-automatico/us-11-rascunho-automatico.test.ts` | 42 testes dos quatro critérios, por efeito no banco e por sequência de pontos |

`abrirEditor` é a terceira entrada de `ModuloDeConteudo`, e é a primeira a
declarar **duas** capacidades — ver o item 1 abaixo.

### As cinco coisas de T023 que um porte distraído faria diferente

1. **Abrir o editor exige DUAS capacidades, e de fábrica elas são a mesma.**
   `wp-admin/post-new.php:58` pergunta o slot de editar **e** o slot de criar do
   tipo, com `||` sobre as negações. E `get_post_type_capabilities()` faz
   `create_posts` cair em `edit_posts` quando o registro não o declara
   (`wp-includes/post.php:2070`), logo para `post` e `page` é a mesma cadeia
   perguntada duas vezes — um porte que cravasse uma passaria em todo teste feito
   com os tipos do núcleo e **quebraria o tipo de terceiro que as separa**.
2. **O título `Auto Draft` é o que faz a linha existir.** `wp_insert_post()`
   recusa a gravação quando título, corpo **e** resumo estão vazios e o tipo
   suporta os três (`wp-includes/post.php:4673`). Com `Auto Draft` no título a
   condição falha e a linha entra; sem ele, abrir o editor de um tipo completo
   **não reservaria nada**. O tipo que não suporta título passa pelo outro lado da
   mesma condição, e os dois caminhos estão testados.
3. **As três entradas de `$_REQUEST` NÃO vão para o banco.** `post_title`,
   `content` e `excerpt` (`:759`-`:771`) são argumento dos três filtros do fim da
   função, aplicados **depois** de a linha estar gravada. Levá-las ao
   `wp_insert_post()` gravaria corpo onde o legado grava vazio — e faria
   `UT-031-5` (*"cria o registro ... com corpo vazio"*) passar por acidente. É por
   isso que o resultado separa `gravado` de `paraOFormulario`.
4. **`wp_after_insert_post` é disparado À MÃO, e depois do formato de conteúdo.**
   A chamada a `wp_insert_post()` passa `$fire_after_hooks = false` (`:782`) **para
   desligar** o disparo automático, e o ponto sai 13 linhas depois (`:795`), já
   com `set_post_format()` aplicado. Quem deixasse o `true` do default veria o
   interceptador rodar antes do formato — e extensão que leia o formato ali leria
   vazio.
5. **O intervalo é publicado ao cliente em SEGUNDOS, e o cliente multiplica.**
   `autosaveL10n.autosaveInterval` (`wp-includes/script-loader.php:1962`) e
   `editor_settings.autosaveInterval` (`wp-admin/edit-form-blocks.php:283`)
   entregam o valor cru. Converter na saída quebraria os dois clientes — e um
   deles é dependência externa de versão cravada que este porte **não pode mudar**
   (BR-MIGRAR-117, `ESC-CLIENTE`). A terceira publicação do legado,
   `changesetAutoSave`, **já** multiplica, e é de BC-07.

### 🔴 O que T023 encontrou aberto, e NÃO fechou

Três divergências entre o texto dos critérios e o código do legado, as três
declaradas no código com âncora e nenhuma resolvida — o **P1** exige decisão
humana registrada para divergir, e nenhuma existe. Mesmo precedente de T003 com
CA-1.1 e de T017 com CA-8.4.

1. **CA-11.2 diz *"listagem alguma"*, e o legado tem duas exceções.** O
   personalizador faz `$wp_post_statuses['auto-draft']->protected = true` em
   execução, *"so that it can be queried"*
   (`wp-includes/class-wp-customize-nav-menus.php:1359`); e o parâmetro de
   **consulta** `status` da API REST tem `enum` com **todos** os estados
   registrados e aceita qualquer um de quem tem `edit_posts` do tipo
   (`class-wp-rest-posts-controller.php:3131` e `:3193`) — o oposto do parâmetro
   de **escrita**. As duas são superfícies que T023 não constrói. Em
   `visibilidade-do-rascunho-automatico.ts`.
2. **CA-11.3 diz que o estado *"não pode ser pedido"*, e o XML-RPC `wp_newPost`
   o aceita.** A guarda dele é `if ( ! get_post_status_object( $status ) )
   $status = 'draft'` (`class-wp-xmlrpc-server.php:1526`), e `auto-draft` **está**
   no registro: o valor atravessa. A API REST só não tem o mesmo buraco porque a
   validação de enumeração do esquema roda antes; o XML-RPC não tem esquema.
   Fechá-lo aqui tornaria o sistema novo mais fechado que o legado numa
   superfície que a resposta 14 manda portar inteira (`ESC-SUPERFICIES`). Em
   `estado-pedido-pela-api.ts`.
3. **`abrirEditor` não está na tabela *Contratos* de `plan.md`.** A tabela lista
   seis operações e nenhuma é esta, enquanto a entrega de T023 em `tasks.md` exige
   que *"o comportamento de US-11 exista"* e CA-11.1 descreve um ato que grava
   linha. É lacuna de `plan.md`, não permissão para não entregar: quem revisar a
   tabela acrescenta a sétima linha, com a entrada e a saída que a operação já
   tem. Em `abrir-editor.ts`.

### 🔴 Um conflito que não é de T023 e passa por ela

**BR-MIGRAR-034** (`R5`, ADR-0006, resposta 10) descreve o legado:
`wp_scheduled_auto_draft_delete` *"é registrado ao abrir a tela de edição"*, e
*"um site que ninguém administra nunca agenda sua própria limpeza"*. **CA-6.4 da
feature 005** pede o contrário: *"o agendamento não depende de alguém ter aberto
a tela de edição"*. São duas decisões humanas em sentidos opostos, o pacote
declara que não escolhe, e a constituição põe esse tipo de conflito na tabela do
que não se decide sozinho.

T023 reproduz o registro que o legado faz **aqui**, que é o único ponto que ela
porta — e isso **não** toma partido: se a decisão humana mandar registrar também
fora da tela de edição, aquele segundo ponto se **soma** a este sem contradizê-lo.
Quem pegar T011 ou T013 da feature 005 esbarra no conflito e deve parar.

### O que T023 NÃO fez, e por quê

A tabela de nove passos no cabeçalho de `rascunho-automatico/abrir-editor.ts` tem
a lista completa, com a linha do legado de cada passo e um "sim" ou "não" por
linha. Em resumo:

| não fez | de quem é |
|---|---|
| os seis testes de `backlog/tests.md` (UT-031-1 a UT-031-6) | **T024**, a tarefa `[P]` que roda em paralelo com esta |
| as quatro envolturas que chamam a operação: a tela de conteúdo novo, o rascunho rápido do painel e os dois métodos de XML-RPC | BC-09 (`ESC-SUPERFICIES`). As quatro estão nomeadas, com o que cada uma acrescenta — e a do rascunho rápido **reaproveita** o rascunho automático anterior em vez de criar outro, o que é a razão de *"abrir o editor"* não ser sinônimo de *"criar registro"* em toda tela |
| o formato de conteúdo aplicado ao registro novo | BC-02 (`set_post_format()`), BC-07 (suporte do tema) e `plataforma/tipos-de-conteudo/` (suporte do tipo). Em instalação de fábrica a condição é **falsa**, porque `default_post_format` nasce vazia |
| as seis consultas que excluem `auto-draft` por nome | BC-09 (duas telas), REQ-120 (três de exportação, em `do-not-rewrite.md`) e BC-07 (reescrita de endereço) |
| o portão de `post_status` da consulta pública | T009 da feature 004 (`contextos/leitura-publica/`) — mesma forma pela qual T005 afirmou CA-2.3 e T003 afirmou CA-1.3 |
| a expiração em 7 dias, e a execução da coleta | feature 005, T013 (`R4` / BR-MIGRAR-033). T023 **agenda** o evento e não o executa |
| a versão de salvamento automático por conta | **T021** (US-10). `salvamento-automatico.ts` nomeia o destino e não o constrói, e a forma do identificador (`{id}-autosave-v1`) já existe em `armazenamento/versao.ts`, de T002 |
| a leitura da trava de edição | BC-09 (`wp_check_post_lock()`, `wp-admin/includes/post.php:1729`), com a janela de 150 s que é número de outra tarefa |
| o laço do salvamento automático no cliente (cronômetro de 15 s, batimento, comparação de texto, suspensão por foco) | `ESC-CLIENTE` (BR-MIGRAR-117) — adotado como está, não reescrito. T023 porta a **decisão de intervalo**, não o agendador dela |
| emitir `wp_after_insert_post` e os três filtros do formulário | ninguém deste pacote emite ponto: REQ-162 está em `do-not-rewrite.md`. Os quatro estão declarados com nome, argumentos e posição |
| o escape de `esc_html()` nas três entradas de requisição | `plataforma/formatacao/`, feature 015 — os valores chegam já escapados, e é isso que o nome do campo diz |
| `wp_sprintf_l()` inteira, com o filtro dela | `plataforma/formatacao/`, feature 015. O recorte que a mensagem desta recusa usa está em `estado-pedido-pela-api.ts`, anotado para não ser confundido com a função |
| o cache de objeto | REQ-165, fora do pacote |

## O que "enumeração fechada" significa aqui — leia antes de usar o tipo

Fechada sobre o **vocabulário de fábrica**: os 12 estados que o núcleo registra
no arranque. Fechada **não** significa validação da coluna, e isso não é
preferência de estilo:

1. `posts.post_status` é `varchar(20)` **sem `ENUM` e sem `CHECK`**
   (`target_data_model.md`, `DB-ENUM`), e o próprio documento diz que *"as 9
   máquinas de estado são validadas na aplicação, e isso é o que o alvo
   reproduz"*.
2. `register_post_status()` é ponto de extensão público, e o **P2** da
   constituição põe remover ou estreitar ponto de extensão na tabela *Não
   negociável*. Um guarda que recusasse estado fora da lista quebraria todo
   estado registrado por extensão.
3. O legado **tolera** estado não registrado em vez de recusar: o mapeamento de
   capacidade degrada para `edit_others_posts` com aviso de uso indevido (UC-03,
   *Exceções*). Recusar seria "mais correto" e seria outro produto (**P1**).

O registro aberto — aquele em que a extensão se inscreve — é de
`plataforma/tipos-de-conteudo/`, não deste contexto.

## Por que estas três portas, e não outras

`target_architecture.md` **AD-08** conta cinco portas no sistema todo — dados,
HTTP, sistema de arquivos, cache de objeto e e-mail. Deste módulo, T001 pede
três: dados, relógio e e-mail.

- **Dados** e **e-mail** são duas das cinco de AD-08, e são dois dos slots de
  tecnologia que `plan.md` lista para esta feature (`persistencia`,
  `envio-de-email`).
- **Relógio** não está em AD-08. T001 o pede pelo nome, e aqui ele é mais do que
  conveniência de teste: nesta feature a data **decide estado** nos dois sentidos
  (`wp-includes/post.php:4798` a `:4808`) e é conferida de novo na hora de
  publicar (`:5482`). A tensão com AD-08 está registrada em
  `portas/porta-de-relogio.ts` e **não foi resolvida por conta própria** — é a
  mesma nota que BC-05 deixou no arquivo equivalente.

**As portas são síncronas.** AD-04 é literal: `adaptadores/` é assíncrono,
`contextos/` e `plataforma/` são **síncronos**, e a I/O é resolvida antes de
entrar no domínio ou exposta por fachada síncrona. `await` no domínio contamina o
chamador e muda a ordem de emissão, que AD-03 põe no contrato observável.

**A porta de dados repete a forma da de BC-05, e isso não é duplicação a
remover.** A regra de dependência 3 proíbe `contextos/<a>/` importar
`contextos/<b>/` *"sempre, sem exceção"*, e AD-08 põe a porta junto de quem a
consome.

### O que a porta de dados não tem, de propósito

Sem transação (BR-MIGRAR-104: zero `START TRANSACTION` em 1.467 arquivos), sem
chave estrangeira e sem restrição a declarar (REQ-169 ficou fora do pacote), e
sem o prefixo **base** de tabela — `posts` e `postmeta` são tabelas de escopo por
site, e quem precisar de tabela global acrescenta o campo na tarefa dele. As três
ausências estão justificadas uma por uma no cabeçalho do arquivo, com a âncora no
legado. **A mais cara é a primeira:** `wp_delete_post()` reparenteia página filha
e anexo para o avô (`wp-includes/post.php:3908` e `:3923`), e uma chave com
`ON DELETE CASCADE` os apagaria — o que o **P5** trata como violação, "mesmo
quando a restrição é mais correta".

## O achado que esta feature inteira existe para proteger

**Os dois defaults divergem.** `wp_insert_post()` grava `draft` quando o estado
não é informado (`wp-includes/post.php:4703`); o DDL declara `publish` como
default da coluna (`wp-admin/includes/schema.php:167`). São duas regras para a
mesma coluna, dependendo de quem escreve, e BR-MIGRAR-001 é literal: *"o alvo não
pode unificar os dois defaults"*.

T001 declara os dois como constante nomeada (`ESTADO_PADRAO_DA_APLICACAO`,
`ESTADO_PADRAO_DO_ARMAZENAMENTO`) e **não resolve nenhum**. T002 fechou a metade
do armazenamento — o DDL de `armazenamento/esquema.ts` carrega o `publish` — e
**T005 fechou a da escrita**, em `gravacao/estado-na-gravacao.ts`, com as duas
barreiras do legado e sem redeclarar nenhuma das duas constantes. A spec de
paridade `PT-002` abre com o mesmo aviso e tem cenário dedicado a afirmar que
*"a divergência entre os dois defaults é idêntica nas duas metades"* — as duas
metades agora existem, e o teste
`gravacao/us-2-gravar-rascunho.test.ts` afirma as duas lado a lado.

Dois irmãos deste achado, que também não se "consertam":

- **O identificador na URL muda sozinho na publicação** (BR-MIGRAR-005). A
  unicidade é dispensada em `draft`, `pending`, `auto-draft`, em revisão e no tipo
  `user_request`. Declarar `UNIQUE` no slug quebra o produto: a dispensa **é** a
  regra. É T007 (US-3) — e T003 apurou que isso só vale no caminho de
  **gravação**: `wp_publish_post()` não toca `post_name`, logo por aquela porta o
  identificador duplicado sobrevive à publicação. Ver a seção de T003.
- **O agendamento não é confiado** (BR-MIGRAR-006, ADR-0005). A verificação dupla
  recusa publicar o que não está agendado e reagenda quando a data não chegou.
  Num alvo com fila real ela pareceria redundante, e removê-la mudaria o
  comportamento no primeiro atraso. É T013 (US-6).

## O que este módulo não vai ter, por decisão de outra pessoa

De `do-not-rewrite.md` — escopo recusado, não trabalho pendente:

| card | o que não existe |
|---|---|
| `REQ-028` | registrar quem decidiu cada transição de estado editorial — UC-07 confirma: *"nenhum registro de quem aprovou foi gravado"* |
| `REQ-030` | sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado |
| `REQ-032` | formato declarado de armazenamento do corpo em blocos |
| `REQ-120` | exportar e importar o conteúdo do site num formato declarado |
| `REQ-169` | declarar a integridade referencial na estrutura de dados |
| `REQ-177` | tornar interativo o conteúdo renderizado sem recarregar a página |

`spec.md` registra que **nenhum card de descarte** há nesta feature: os seis acima
ficaram fora do pacote por coluna do Kanban, não por descarte autorizado. Nada
disto se decide no meio da implementação.

## O que ninguém decidiu, e que T001 não decidiu tampouco

> T003 acrescentou o item 5; T023 acrescentou o 6, o 7 e o 8. Os quatro
> primeiros são de T001.

1. 🔴 **US-9 pede notificação que o sistema analisado não tem.** CA-9.1 e CA-9.2
   exigem aviso ao autor quando o conteúdo é devolvido ou publicado por outra
   pessoa. O caso de uso que a tabela de rastreabilidade liga a US-9 diz o
   contrário, palavra por palavra: *"Nenhuma notificação é enviada ao autor: o
   sistema não avisa"* (`UC-07`, fluxo alternativo *Devolver ao autor*). Na árvore
   analisada as duas únicas funções de notificação do núcleo são de **comentário**
   (`wp-includes/pluggable.php:1749` e `:2009`), e a âncora que `spec.md` dá para
   US-9 — `wp-admin/post.php:236` — é a chamada de `edit_post()`, que não envia
   e-mail nenhum. O **P1** exige decisão humana registrada para divergir, e
   `pending_decisions.md` não tem nenhuma sobre isto. **É T019 que bate nisso: ela
   para e escreve, em vez de escolher um lado.** A parada está repetida no
   cabeçalho de `portas/porta-de-email.ts`, que é o arquivo que ela vai abrir
   primeiro.
2. **REQ-030 e a sanitização do corpo.** Quem construir US-1 a US-8 decide a
   sanitização sozinho, e a regra P8 do domínio põe o privilégio de marcação bruta
   também no papel de editor. Risco 1 de `plan.md`.
3. **REQ-032 e o formato do corpo em blocos.** Depende de código que não está na
   árvore analisada; a resposta 15 diz de onde ele vem. O card volta à seleção
   antes desta feature começar, ou o corpo é portado sem formato declarado?
4. **REQ-028 e a trilha editorial.** US-7 submete e US-8 publica preservando a
   autoria, e nada no pacote especifica o registro de quem decidiu a transição.
   Sem ele, a cadeia editorial existe e não é auditável.

5. 🔴 **CA-1.1 descreve uma recusa na tela que o painel do legado não tem.** O
   critério pede *"recusa explícita na tela"* e UC-03 repete, mas
   `_wp_translate_postdata()` **rebaixa** o estado para `pending` em vez de
   recusar (`wp-admin/includes/post.php:150`-`:158`), e o editor nem oferece
   publicar sem a capacidade. **T003 não escolheu entre as duas leituras**, porque
   as duas levam ao mesmo lugar — sem a capacidade, a publicação não acontece — e
   registrou a divergência de redação em
   `publicacao/permissao-de-publicacao.ts`, com o código, o texto e o número que
   o legado **tem** (os da API REST). O rebaixamento é o `pending` de CA-7.1, em
   T015, e chega pelo caminho de gravação.

6. 🔴 **CA-11.2 diz *"listagem alguma"*, e o legado tem duas exceções.** O
   personalizador torna `auto-draft` consultável em execução
   (`wp-includes/class-wp-customize-nav-menus.php:1359`), e o parâmetro de
   **consulta** da API REST o aceita de quem tem `edit_posts` do tipo
   (`class-wp-rest-posts-controller.php:3193`). **T023 não escolheu**: as duas são
   superfícies que ela não constrói, e o registro do estado as declara fora de
   toda listagem de fábrica. Em
   `rascunho-automatico/visibilidade-do-rascunho-automatico.ts`.
7. 🔴 **CA-11.3 diz que `auto-draft` *"não pode ser pedido"* pela API, e o
   XML-RPC `wp_newPost` o aceita.** A guarda dele pergunta se o estado **existe no
   registro**, e ele existe (`class-wp-xmlrpc-server.php:1526`). **T023 não
   fechou**: fechar tornaria o sistema novo mais fechado que o legado numa
   superfície que a resposta 14 manda portar inteira. Em
   `rascunho-automatico/estado-pedido-pela-api.ts`.
8. 🔴 **`abrirEditor` não está na tabela *Contratos* de `plan.md`.** São seis
   operações ali e nenhuma é esta, e a entrega de T023 exige o comportamento. É
   lacuna de `plan.md`, não permissão para não entregar. Em
   `rascunho-automatico/abrir-editor.ts`.

Os quatro primeiros estão em `spec.md`, seção *Perguntas em aberto* (o primeiro,
como consequência de nada ali especificar o aviso). A tabela *Não negociável* da
constituição põe cada um deles fora do alcance do agente de codificação. O quinto,
o sexto e o sétimo não estão em `spec.md`: são divergência entre o critério de
aceite e o código lido, e o **P1** os põe na mesma mesa. O oitavo é lacuna de
artefato, e vai para quem revisar `plan.md`.

E há um nono item que **não é divergência deste módulo e passa por ele**: o
conflito entre BR-MIGRAR-034 e CA-6.4 da feature 005 sobre **onde** a coleta do
rascunho automático é agendada. Ele é da feature 005 e está declarado em *"Um
conflito que não é de T023 e passa por ela"*, acima.

### Uma divergência menor, registrada e não corrigida aqui

`wp_mail()` tem **seis** parâmetros nesta versão do legado — `$embeds` entrou na
6.9.0 — e o ponto de filtro `wp_mail` entrega os seis à extensão
(`wp-includes/pluggable.php:189` e `:209`). A porta deste módulo declara os seis.
A porta de BC-05, entregue por T001 daquela feature, declara **cinco** e chama o
conjunto de *"os mesmos cinco argumentos de `wp_mail()`"*. Este módulo não mexe no
arquivo de BC-05: não é tarefa de T001 desta feature, e a regra de dependência 3
impediria os dois contextos de compartilhar o tipo de qualquer forma. Fica
registrado para quem revisar a paridade do slot `envio-de-email`.

## Como se confere que este módulo tem paridade

`parity_specs.md` fixa critério **por área** (Decisão 2), e desta feature o
critério é **efeito no banco** — é o que a spec de paridade `PT-002` declara no
cabeçalho (`area_da_decisao_2: efeito no banco`), somado ao valor devolvido pelos
pontos de filtro, byte a byte, e à ordem de emissão deles.

A spec de paridade desta feature é
`.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
com 11 cenários — os de rastreio direto desta feature são os dois defaults, a
transição que não acontece por efeito colateral, o slug duplicado que muda sozinho
ao publicar, o colaborador que não reserva slug, a verificação dupla do
agendamento, a republicação nula e a ordem dos pontos de filtro na gravação. Para
as telas do editor, `parity_tests/screens/05-editor-de-blocos-novo.feature` e
`06-editor-de-blocos-edicao.feature`.

⚠️ **US-11 não tem cenário de paridade próprio**, e isso está declarado em vez
de descoberto: `PT-002` cobre UC-03 pelo lado da publicação, e `PT-004` toca o
rascunho automático só pelo lado da **expiração** (*"Rascunho automático expira
pelo prazo próprio, por comparação de data"*, que é da feature 005). Quem revisar
a cobertura de `parity_specs.md` encontra aí a abertura do editor sem cenário —
e o que T023 pôs no lugar é arquivo e linha do legado em cada afirmação, mais a
suíte própria de `rascunho-automatico/`.

**Nenhuma delas é executável hoje:** `parity_specs.md` registra que não há
oráculo executável nesta árvore (o manifesto de telas declara
`oracleAvailable: false`, com 3 capturas para 113 telas), e levantá-lo é T001 da
feature 015.

Mas o **código-fonte** do sistema analisado está legível em disco, fora desta
árvore, em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versão do pacote), e
foi contra ele que cada afirmação deste módulo foi conferida. É por isso que todas
citam arquivo e linha em vez de descrever o comportamento de memória — e é o que
T003 em diante deve fazer antes de declarar que falta informação: a âncora do caso
de uso normalmente existe e está a uma leitura de distância. Foi assim que T002
apurou o que o legado faz com a coluna do pai, com o valor serializado e com a
versão: lendo `post.php`, `meta.php`, `revision.php` e `schema.php`, e citando
linha a linha.
