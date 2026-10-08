# Módulo de conteúdo — BC-01

Esqueleto entregue por **T001** da feature `002-autoria-e-publicacao`, com a
forma de armazenamento entregue por **T002**, a publicação por ato explícito
(US-1) entregue por **T003**, a gravação com estado resolvido (US-2) entregue por
**T005** e o identificador na URL único só a partir da publicação (US-3) entregue
por **T007**. Este arquivo é a leitura obrigatória de quem pegar T009 em diante:
ele diz o que já está decidido, o que está decidido **em outro lugar**, e o que
ninguém decidiu.

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
| cobrar unicidade do identificador na URL | T007 (US-3) acrescentou as **três consultas** que fazem a pergunta e **nenhuma restrição**. A dispensa em rascunho **é** a regra (BR-MIGRAR-005), e `UNIQUE` no DDL quebraria o produto |
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

### 🔴 O achado de T003 que decidiu o trabalho de T007

**`wp_publish_post()` não toca `post_name`.** A unicidade do identificador na URL
é cobrada por `wp_unique_post_slug()`, chamada de `wp_insert_post()`
(`wp-includes/post.php:5561`) — isto é, no caminho de **gravação**. Logo *"o slug
do rascunho muda sozinho ao publicar"* (BR-MIGRAR-005, CA-3.2) acontece quando se
publica **salvando**, e **não** quando se publica por esta transição: por esta
porta, o identificador duplicado sobrevive à publicação. São dois caminhos para
publicado, e só um deles cobra unicidade. **T007 o confirmou e o preservou:** a
unicidade está no caminho de gravação, e por esta porta o identificador duplicado
continua sobrevivendo à publicação.

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

### A lacuna que T005 declarou, e que T007 fechou

T005 registrou que *"gravar conteúdo publicado sem informar identificador na URL
grava a coluna vazia"*, onde o legado gravaria o título sanitizado e único. **Os
três passos que faltavam são de T007 e estão no lugar** — `:4745`-`:4763`,
`:4906` e a segunda escrita de `:5047` —, e a tabela de 24 passos de
`gravacao/gravar.ts` marca os quatro como `sim`.

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
| sanitizar e tornar único o identificador na URL | **T007** (US-3) — feito, ver a seção de T007 |
| a comparação de 60 segundos que troca publicado por agendado | **T013** (US-6). É o único passo desta função que lê a porta de relógio |
| esvaziar o identificador de quem não pode publicar | **T007** (US-3, CA-3.4) — feito, e foi ela que acrescentou a `base` de autorização ao contexto. CA-7.4 é a mesma linha do legado |
| guardar a versão anterior | **T021** (US-10) — e o achado é que ela **não** é código de `wp_insert_post()`: é ouvinte do ponto `post_updated`, com prioridade 10 (`default-filters.php:450`) |
| o rascunho automático | **T023** (US-11), e a recusa de `auto-draft` pedido pela API (CA-11.3) não está nesta função: está na superfície REST |
| emitir a transição de estado e a família `save_post` deste caminho | ninguém deste pacote emite ponto (REQ-162 está em `do-not-rewrite.md`). Os sete estão declarados em `gravar.ts` com nome, argumentos e posição. A fronteira cai antes deles porque emitir **meia** transição — interceptadores sem o ouvinte do núcleo — perderia o `guid` e a limpeza do evento agendado em silêncio |
| a categoria padrão, o `tax_input` e a recontagem de termo do caminho de gravação | BC-02 (a metade que CA-1.4 cobra já está em `publicacao/`) |
| `sanitize_post()`, `wp_encode_emoji()`, `wp_unslash()` e `sanitize_trackback_urls()` | `plataforma/`, feature 015 — cada um com a âncora em `campos-na-gravacao.ts`. O primeiro carrega 🔴 REQ-030, que está **fora do pacote** |
| o arquivo e o contexto do anexo, a imagem destacada e o modelo de página | BC-04 e BC-07. O `inherit` do anexo **está** aqui, porque é a linha seguinte da função portada (mesmo precedente da guarda de republicação nula de T003) |
| o erro de banco (`db_insert_error`, `db_update_error`) | os dois códigos e os quatro textos estão declarados em `ERROS_DA_GRAVACAO`, e o ramo **não é alcançável**: a porta de dados de T002 não devolve o `false` de `$wpdb`. Quem construir a camada de dados (feature 015) liga a falha a eles |

## O que T007 entrega, e só isso

> *o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4
> passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T007

Tudo em `gravacao/`, porque é lá que o legado tem a regra: **as duas chamadas de
`wp_unique_post_slug()` são `:4906` e `:5048`, dentro de `wp_insert_post()`**. Os
casos de uso são os três que a tabela de rastreabilidade de `spec.md` liga a
US-3: [UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md), cujo passo
4 é *"cobra unicidade do identificador na URL, que em rascunho era dispensada"*,
[UC-06](../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md),
cujo passo 3 é *"esvazia o identificador de URL"*, e
[UC-07](../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md),
cujo passo 5 é *"fixa o identificador de URL, que estava vazio"*.

| arquivo | o que é |
|---|---|
| `gravacao/identificador-na-url.ts` | **CA-3.1** e **CA-3.2**: a dispensa (seis casos), os três escopos de unicidade, o laço do sufixo, o truncamento e os **cinco** pontos de extensão |
| `gravacao/permissao-do-identificador.ts` | **CA-3.4**: o único portão de capacidade deste caminho, e o `case 'publish_post'` que não existia na plataforma |
| `gravacao/identificador-de-amostra.ts` | **CA-3.3**: o endereço que o editor mostra antes de publicar, que já é o da publicação |
| `gravacao/us-3-identificador-unico.test.ts` | 49 testes dos quatro critérios, por efeito no banco e por sequência de comandos |

Os quatro passos novos de `wp_insert_post()` — 10, 11, 18 e 20 — estão na posição
exata do legado em `gravacao/gravar.ts`, e `armazenamento/conteudo.ts` ganhou as
**três** consultas de unicidade (e nenhuma restrição).

### As seis coisas de T007 que um porte distraído faria diferente

1. **A dispensa tem SEIS casos, não três.** Além de `draft`, `pending` e
   `auto-draft` (`:5561`), `wp_unique_post_slug()` devolve o identificador como
   veio para revisão (`inherit` **e** tipo `revision`), para o tipo
   `user_request` e — mais tarde, dentro do ramo hierárquico — para
   `nav_menu_item`. Os três últimos não são desta feature e são **linhas desta
   função**: omitir qualquer um faria o sistema cobrar unicidade onde o legado
   não cobra. O cenário `@critico` de `PT-002` cobra os quatro primeiros juntos.
2. **São TRÊS escopos de unicidade, com três consultas diferentes.** Anexo é
   único em toda a tabela; página, dentro do próprio pai e disputando com anexo;
   conteúdo em linha do tempo, dentro do próprio tipo. O comentário do legado é
   a regra: *"Pages are in a separate namespace than posts so page slugs are
   allowed to overlap post slugs"*. Unificar as três em *"único na tabela"*
   mudaria o endereço de toda página cujo apelido coincide com o de um post.
3. **O identificador `'0'` escapa de tudo.** A condição de parada do laço é a
   **verdade de PHP** do valor devolvido (`while ( $post_name_check )`,
   `:5620`), e `'0'` é falso lá: um conteúdo gravado com `post_name = '0'` nunca
   provoca sufixo e nunca é empurrado por um. O mesmo zero é descartado na
   colisão com arquivo de data (`if ( $slug_num )`, `:5672`). Por isso a porta
   de dados devolve **o valor encontrado**, e não um booleano.
4. **O sufixo começa em `2` e encurta a base.** `200 - ( strlen( $suffix ) + 1 )`
   (`:5617`): ao passar de `-9` para `-10` o identificador base perde um
   caractere, logo o endereço do centésimo homônimo não é o do nono com outro
   número. E o `rtrim( $slug, '-' )` de `_truncate_post_slug()` vale **mesmo
   quando o identificador cabe**: `titulo-` mais sufixo dá `titulo-2`.
5. **Na inserção de tipo não registrado o colaborador CONSERVA o endereço.** A
   condição de `:4734` é `! $update && $post_type_object && ! current_user_can(
   ... )` — com o objeto de tipo falso a conjunção inteira cai, ninguém pergunta
   nada e o campo fica como veio. Na **atualização** do mesmo tipo a resposta é a
   oposta: `map_meta_cap()` degrada para `edit_others_posts`
   (`capabilities.php:421`), que o colaborador não tem. Duas portas, dois
   resultados.
6. **A dispensa de CA-3.1 é também sobre quantos comandos saem.** Gravar rascunho
   não emite consulta de unicidade nenhuma; gravar publicado emite uma por
   tentativa, mais a leitura do conteúdo no ramo plano (`:5665`, sem condição). A
   área 3 da Decisão 2 compara *"snapshot + **sequência de comandos**"*, e a
   tabela de leituras de `gravacao/gravar.ts` tem as nove, com o quando de cada
   uma.

### 🔴 O que T007 encontrou aberto, e NÃO fechou

**CA-3.3 diz que *"o autor é informado"*, e o legado não notifica ninguém.** Não
há e-mail, não há aviso de painel e não há registro quando o identificador muda:
`wp_insert_post()` troca o campo em silêncio. O **P1** exige decisão humana
registrada para divergir, e nenhuma existe — mesmo precedente de T003 com a
*"recusa explícita na tela"* de CA-1.1, e o mesmo que T019 vai encontrar em US-9.

O que T007 entregou são **os dois mecanismos pelos quais o legado informa**, e os
dois são resposta a quem pediu a gravação:

- **depois** de gravar, o resultado traz `identificadorPedido` e
  `identificadorNaUrl` lado a lado (e `identificadorMudouNaGravacao()` compara os
  dois) — é o campo `slug` da resposta REST e o endereço que o painel volta a
  renderizar, o passo 7 de UC-03;
- **antes** de gravar, `identificadorDeAmostra()` — a metade de
  `get_sample_permalink()` que é identificador (`wp-admin/includes/post.php:1479`).
  Ela **finge que o conteúdo está publicado** e passa pela mesma
  `wp_unique_post_slug()`, logo o endereço que o editor mostra num rascunho já é
  o da publicação, com sufixo e tudo. É o mecanismo mais direto do critério:
  *"em lugar de descobrir pelo endereço quebrado"*.

Inventar aqui um aviso seria inventar superfície. Quem decidir que o critério
pede notificação tem a decisão a registrar, e o ponto onde ela entra está
nomeado no cabeçalho de `gravacao/identificador-de-amostra.ts`.

### 🔴 O `case 'publish_post'` não existia na plataforma, e T007 não o moveu para lá

`target_architecture.md` põe os 86 `case` de `map_meta_cap()` em
`plataforma/autorizacao/`, e o README daquela pasta registra a divisão: o caso de
conteúdo e o de conta estão lá (feature 001), e *"os demais chegam com a feature
do objeto de cada um"*. `casoDeConteudo()` cobre **editar**, **apagar** e **ler**;
`publish_post` não está em nenhuma das três.

Ele foi declarado em `gravacao/permissao-do-identificador.ts`, na forma canônica
de `CasoDeTraducao`, e é exportado para quem montar a autorização da requisição
registrar junto dos outros. **A regra de dependência 2 proíbe `plataforma/`
importar `contextos/`, e não o contrário** — um caso declarado aqui é consumível
lá, por argumento, e um caso declarado lá por esta tarefa decidiria no lugar da
feature 001.

E o fluxo **não depende de ele estar registrado na base**: no legado
`map_meta_cap()` tem os 86 casos embutidos, ninguém os registra, e perguntar
`publish_post` sempre resolve. `podeReservarIdentificador()` acrescenta o próprio
caso à lista que recebeu, no fim, onde ele não desloca nenhum caso que a base já
traga. Sem isso, uma composição que esquecesse o caso esvaziaria o identificador
de um editor.

### O que T007 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os seis testes de `backlog/tests.md` (UT-021-1 a UT-021-6) | **T008**, a tarefa `[P]` que roda em paralelo com esta |
| `sanitize_title()` e `utf8_uri_encode()` | `plataforma/formatacao/`, feature 015. Chegam pelo colaborador `TextoDoIdentificador`, com o aviso de **não as implementar "o suficiente"**: o identificador é comparado byte a byte contra o oráculo, e uma versão aproximada produz endereço diferente para todo título com acento, aspa curva ou travessão |
| `$wp_rewrite->feeds`, `->pagination_base` e `permalink_structure` | BC-07 / BC-08. Chegam pelo colaborador `ReescritaNaGravacao`, e são **leituras a cada chamada**, como no legado |
| `is_post_type_hierarchical()` | `plataforma/tipos-de-conteudo/`, que não existe nesta árvore. Tipo não registrado devolve `false` e cai no ramo plano, em vez de recusar |
| o molde do endereço de amostra, e o ponto `sample_permalink` | BC-07 / BC-08: sem o molde o par não existe para ser filtrado. O ponto `editable_slug`, que filtra o **identificador**, está aqui |
| a **operação** de submeter para revisão | **T015** (US-7). A regra do identificador vazio dela já está aqui: CA-3.4 e CA-7.4 são a mesma linha do legado |
| o sufixo `__trashed`, que também mexe no identificador | feature 005 (`PT-003`) |
| cobrar unicidade na transição de T003 | **ninguém**: `wp_publish_post()` não toca `post_name`, e por aquela porta o identificador duplicado sobrevive à publicação. Fechar isso seria fechar um duplicado que o legado deixa passar |
| limite de tentativa no laço do sufixo | **ninguém**: o legado não tem, e o **P6** proíbe inventar contagem que o produto não tem |
| invalidar cache depois da segunda escrita | não há cache nesta árvore (REQ-165 ficou fora do pacote). `clean_post_cache()` está nomeada na posição exata do fluxo |

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
  regra. **É T007 (US-3), e está fechada** — em `gravacao/identificador-na-url.ts`,
  com a dispensa, os três escopos de unicidade e o laço do sufixo. E só vale no
  caminho de **gravação**: `wp_publish_post()` não toca `post_name`, logo por
  aquela porta o identificador duplicado sobrevive à publicação.
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

> T003 acrescentou o item 5. Os quatro primeiros são de T001.

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

Os quatro primeiros estão em `spec.md`, seção *Perguntas em aberto* (o primeiro,
como consequência de nada ali especificar o aviso). A tabela *Não negociável* da
constituição põe cada um deles fora do alcance do agente de codificação. O quinto
não está em `spec.md`: ele é divergência entre o critério de aceite e o código
lido, e o **P1** a põe na mesma mesa.

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

Com T007, **dois desses cenários passam a ter as duas metades no sistema novo**:
*"Rascunho pode ter slug duplicado, publicado não — e o slug muda sozinho ao
publicar"*, inclusive a cláusula *"a dispensa de unicidade vale também para
pendente, rascunho automático, revisão e solicitação de dado pessoal"*, e
*"Colaborador não reserva slug do que está em revisão"*. Os dois estão afirmados
em `gravacao/us-3-identificador-unico.test.ts`, com o texto de cada consulta.

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
