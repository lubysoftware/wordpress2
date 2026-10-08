# Módulo de conteúdo — BC-01

Esqueleto entregue por **T001** da feature `002-autoria-e-publicacao`, com a
forma de armazenamento entregue por **T002**, a publicação por ato explícito
(US-1) entregue por **T003**, a gravação com estado resolvido (US-2) entregue
por **T005**, o identificador na URL único só a partir da publicação (US-3)
entregue por **T007**, o conteúdo privado (US-4) entregue por **T009**, a
republicação nula (US-5) verificada por **T011**, o agendamento com verificação
dupla (US-6) entregue por **T013**, a submissão para revisão (US-7) entregue por
**T015**, a revisão do conteúdo alheio com a autoria preservada (US-8) entregue
por **T017** e as versões anteriores (US-10) entregues por **T021**. Este
arquivo é a leitura obrigatória de quem pegar T023 em diante: ele diz o que já
está decidido, o que está decidido **em outro lugar**, e o que ninguém decidiu.

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

> O primeiro deles já chegou: os **60 segundos** vivem em
> `FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS`
> (`agendamento/estado-pela-data.ts`), com a fonte no legado e teste nos dois
> lados da borda. O cabeçalho da constante registra por que ela **não** virou
> ponto de configuração alterável em execução: no legado não é.

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
## O que T009 entrega, e só isso

> *o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4
> passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T009

Tudo em `visibilidade/`. Os casos de uso são
[UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md), fluxo alternativo
*"Publicar como privado"*, e
[UC-01](../../../.specify/use-cases/UC-01-consultar-conteudo-publicado.md), fluxo
alternativo *"Conteúdo privado"* — os dois que a tabela de rastreabilidade de
`spec.md` liga a US-4.

| arquivo | o que é |
|---|---|
| `visibilidade/contexto-de-visibilidade.ts` | o contexto, e as **duas ausências** com motivo: nem porta de dados nem relógio |
| `visibilidade/visibilidade-do-conteudo.ts` | **CA-4.1**: o `switch` de visibilidade, os três ramos e os dois efeitos colaterais |
| `visibilidade/permissao-de-conteudo-privado.ts` | **CA-4.1**: a capacidade, que é a de publicar, e o rebaixamento **próprio** do painel |
| `visibilidade/leitura-de-conteudo-privado.ts` | **CA-4.2** e **CA-4.3**: o portão de duas alturas, e a resposta indistinguível |
| `visibilidade/presenca-em-consulta-publica.ts` | **CA-4.4**: listagem e feed por registro de estados, sitemap por literal |
| `visibilidade/escolher-visibilidade.ts` | a operação de US-4, e a razão de ela não gravar |
| `visibilidade/us-4-conteudo-privado.test.ts` | 26 testes dos quatro critérios, por efeito no banco e por decisão |

`escolherVisibilidade` é a segunda entrada de `ModuloDeConteudo` e declara a
permissão que o **P4** exige: a **mesma** capacidade de `publicar`, e exigida
**somente** quando a visibilidade resolve em `private`.

### As quatro coisas de T009 que um porte distraído faria diferente

1. **`private` não é "publicado com um atributo": é um valor da mesma coluna**, e
   os três critérios de leitura saem das propriedades com que o legado o
   registra (`wp-includes/post.php:718`-`:730`). A propriedade `privado` é o que
   faz a leitura exigir `read_private_posts`; a ausência de `publico` é o que o
   tira da consulta pública. Um porte que gravasse `publish` com uma marca ao
   lado passaria em CA-4.1 e falharia nos três outros **sem erro nenhum**.
2. **As três superfícies de CA-4.4 são DOIS mecanismos.** Listagem e feed são a
   mesma consulta, montada a partir do **registro de estados**, e **mostram** o
   privado a quem tem a capacidade (`class-wp-query.php:2738`-`:2766`); o mapa do
   site pede `publish` **por nome** (`class-wp-sitemaps-posts.php:244` e `:123`)
   e não o mostra a ninguém, nem ao super administrador. Unificar os dois ou põe
   endereço privado no mapa do site, ou esconde o privado da própria listagem de
   quem o pode ler. E o feed **não** tem regra própria: ele herda a da listagem
   (`wp-includes/functions.php:1612`) — quem lhe escrever consulta própria repete
   a cláusula, e é aí que o vazamento entra.
3. **O autor lê e lista o PRÓPRIO conteúdo privado sem ter `read_private_posts`.**
   Na leitura, `map_meta_cap()` devolve `read` para o autor
   (`wp-includes/capabilities.php:374`-`:375`); na listagem, a cláusula vira um
   recorte por `post_author` (`class-wp-query.php:2764`). É por isso que esta
   tarefa **pergunta por `read_post`** e deixa a plataforma traduzir, em vez de
   perguntar direto pela capacidade privada: perguntar direto perderia este ramo,
   o da revisão e os dois de degradação de `PERM-4`.
4. **A visibilidade privada apaga a senha de conteúdo e retira a fixação no
   topo** (`wp-admin/includes/post.php:326`-`:330`). Os dois mecanismos de
   restrição são exclusivos por construção — privado esconde a **existência**, a
   senha esconde o **corpo** —, e CA-6.6 da feature 004 diz o oposto para a senha:
   *"o conteúdo protegido continua aparecendo em sitemap e listagem"*.

### Por que T009 não emite comando de escrita

**No legado não existe função que leve conteúdo a privado.** Não há
`wp_private_post()`: o privado chega à coluna por duas peças, as duas **sem
escrita**, as duas rodando antes de `wp_insert_post()` — o `switch` de
visibilidade (`wp-admin/includes/post.php:318`-`:331` e `:950`-`:964`) e
`handle_status_param()` (`class-wp-rest-posts-controller.php:1569`-`:1583`). Quem
escreve é `wp_insert_post()`, com **um** `UPDATE` de 21 colunas que ela mesma
resolve, e esse caminho é **T005** em diante.

`tasks.md` dá a T009 as dependências T001, T002 e T003 — não T005 —, e `plan.md`
põe a gravação **antes** do conteúdo privado na *Sequência* interna da feature.
Emitir aqui um `UPDATE` de duas colunas pareceria mais completo e seria uma
divergência medida: a área 3 da Decisão 2 compara *"snapshot + sequência de
comandos"*, e o legado não tem comando de duas colunas neste caminho. Por isso a
operação resolve e devolve `CamposDeConteudo` — o mesmo tipo que a gravação
consome —, e a suíte fecha o circuito levando esses campos ao repositório real de
T002 e afirmando, nos bytes do parâmetro, que `post_status` carrega `private` e
não `publish`.

### 🔴 O que T009 encontrou aberto, e NÃO fechou

1. **O painel não recusa a visibilidade privada: ele a rebaixa, e de um jeito
   diferente do rebaixamento de `publish`.** Sem a capacidade de publicar, pedir
   `private` grava **o estado anterior**, ou `pending` quando não há
   (`wp-admin/includes/post.php:142`-`:144`); pedir `publish` ou `future` grava
   `pending` (`:152`-`:159`). A diferença é observável — um rascunho continua
   rascunho em vez de ir para a fila de revisão — e uniformizar os dois poria em
   revisão rascunhos que o legado deixa quietos. É o mesmo precedente de T003
   com CA-1.1: **a recusa sai como valor**, com o código e o texto da API
   (`rest_cannot_publish` e *"Sorry, you are not allowed to create private posts
   in this post type."*), o rebaixamento fica **declarado e não aplicado**, e a
   divergência de redação vai para quem decide. O **P1** exige decisão humana
   registrada para divergir, e nenhuma existe.
2. **Nenhuma das 20 specs de paridade deste pacote menciona conteúdo privado.**
   Uma busca por `private` e por `privad` em `.specify/migration/parity_tests/`
   devolve zero ocorrências: `PT-002` tem os onze cenários da publicação e do
   agendamento e nenhum do privado, e `PT-011` cobre a invariante só de lado, no
   cenário `@concorrencia` (*"a resposta anônima não contém nada que só a
   autenticada veria"*). Escrever cenário de paridade não é tarefa de T009 e
   `parity_specs.md` é artefato do Inspector — a lacuna fica declarada aqui e em
   `visibilidade/index.ts`.

### O que T009 NÃO fez, e de quem é

| não fez | de quem é |
|---|---|
| os quatro testes de `backlog/tests.md` (UT-022-1 a UT-022-4) | **T010**, a tarefa `[P]` que roda em paralelo com esta |
| o `UPDATE` que leva `private` à coluna | **T005** (US-2) em diante: é `wp_insert_post()`, e é um comando de 21 colunas |
| o rebaixamento do painel | **T005** e **T015** — declarado em `visibilidade/permissao-de-conteudo-privado.ts` |
| a cláusula SQL da consulta pública, o 404 e o modelo de erro do tema | feature **004**, `contextos/leitura-publica/` — a regra de dependência 3 proíbe aquele contexto importar este, logo ele monta o mesmo portão sobre a mesma `plataforma/autorizacao/` |
| o portão dos estados **protegidos** (rascunho, pendente, agendado) e o modo de pré-visualização | feature **004**, US-4 CA-4.2 de lá: o ramo vizinho do mesmo bloco do legado, e ele reescreve `post_date` em memória |
| a senha de conteúdo, que o ramo privado apaga | feature **004**, US-6 — REQ-044 está em `do-not-rewrite.md`, e a resposta 8 manda preservar os três fatos do legado |
| a fixação no topo, que o ramo privado retira | BC-07: é a opção `sticky_posts` |
| o mapa do site e o feed como **saída** | BC-08, feature 013 — aqui há só a regra de quais estados entram |
| a comparação de data que produz o agendado | **T013** (US-6) — e ela **não alcança `private`**: `wp_insert_post()` só troca `publish` por `future` e `future` por `publish` (`wp-includes/post.php:4797`-`:4808`), logo conteúdo privado com data à frente continua privado. Quem pegar T013 precisa disso |
| emitir ponto de extensão | ninguém deste pacote: REQ-162 está em `do-not-rewrite.md`. **Nenhum dos dois caminhos de T009 atravessa ponto de extensão no legado** — o `switch` de visibilidade não tem nenhum, e a cláusula de estado da consulta é filtrada só depois, por `posts_where` (`class-wp-query.php:2796`), que é da feature 004 |
## O que T011 entrega, e só isso

> *o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam
> contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T011

US-5 é **uma regra da mesma função de T003**: `wp_publish_post()` desiste quando
o estado já é `publish` (`wp-includes/post.php:5413`), e é a âncora que a tabela
de rastreabilidade de `spec.md` dá a US-5, que BR-MIGRAR-007 (`P7`) repete e que
o fluxo alternativo *"Conteúdo já estava publicado"* de UC-03 descreve.

| arquivo | o que é |
|---|---|
| `publicacao/republicacao-nula.ts` | a guarda com nome: o que cada um dos três critérios nega, com a linha do legado, e **por que a nulidade não se estende ao caminho de gravação** |
| `publicacao/us-5-republicacao-nula.test.ts` | 14 testes dos três critérios, afirmados pela **ausência** de comando, de ponto de extensão e de efeito |

**A guarda já estava no código, e isso é o esperado:** ela é a terceira linha de
`wp_publish_post()` e chegou com T003, porque sem ela a transição de US-1
dispararia duas vezes e CA-1.2 (*"uma única vez"*) cairia — o próprio `index.ts`
de `publicacao/` registrou a divisão. T011 faz o que faltava: dá nome à regra no
arquivo que a emite e **afirma os três critérios**, que é o que a entrega pede.
Nenhum comportamento muda nesta tarefa.

### O que "sem efeito" nega, criterio por critério

| critério | o que não acontece | linha do legado |
|---|---|---|
| CA-5.1 | nenhum `UPDATE` sai (nem do estado, nem do `guid`), e das três leituras do caminho completo só a primeira acontece | `:5446`, `:8160`, `:5417`, `:8159` |
| CA-5.2 | nenhum dos três pontos de `wp_transition_post_status()` dispara, e o ouvinte do núcleo não roda | `:5452`, `:5922`, `:5940`, `:5980`, `:8154` |
| CA-5.3 | o termo padrão não é consultado nem atribuído, a fila não é tocada, e `_publish_post_hook()` não roda — logo `_pingme` e `_encloseme` não são gravados e `do_pings` não é agendado | `:5420`-`:5443`, `:8189`, `:8220`-`:8249` |

**CA-5.3 é consequência de CA-5.2, não uma lista de omissões.** Tudo o que a
publicação automatiza no legado pende de um ponto da transição — inclusive o
aviso ao autor de US-9 (T019). Sem transição, nada disso dispara: é literalmente
o que a história pede, *"repetir a chamada sem disparar notificação ou automação
duas vezes"*. E a suíte prova que o zero vem da **guarda**, não de um cenário
vazio: o mesmo cenário em rascunho atribui o termo padrão e limpa o evento
agendado.

### ⚠️ A nulidade é desta porta, e NÃO do caminho de gravação

`wp_insert_post()` chama `wp_transition_post_status()` **sem comparar os dois
estados** (`:5176`), e o docblock do terceiro ponto avisa que ele dispara *"both
when a post is first transitioned to that status from something else, as well as
upon subsequent post updates (old and new status are both the same)"*
(`:5965`-`:5968`). Isto é: **salvar de novo um conteúdo publicado dispara
`publish_to_publish` e `publish_{tipo}` no legado.**

A história US-5 é escrita na voz do integrador — *"para poder repetir a chamada
sem disparar notificação ou automação duas vezes"* —, e quem ler só essa frase
pode esperar que **qualquer** pedido repetido de publicação seja nulo, inclusive
o `POST` da API que grava. Não é. Os três critérios falam de *"pedir a
publicação"*, a rastreabilidade e BR-MIGRAR-007 apontam `:5413`, e o cenário
`@idempotencia` de `PT-002` descreve esta porta. T011 implementa a regra na
âncora que o pacote dá e **não estende a nulidade ao caminho de gravação** —
estender seria divergir do legado sem decisão humana (**P1**), e sumiria com dois
pontos de extensão que terceiro escuta (**P2**). Quem pegar T005, T007 ou T013
precisa disso antes de escrever a primeira linha, e quem construir a superfície
REST é quem vê a diferença.

### E a fila nunca chega a esta guarda

`wp_publish_post()` tem **um** chamador no núcleo,
`check_and_publish_future_post()` (`:5503`), e ele desiste antes, no portão dele:
`if ( 'future' !== $post->post_status ) { return; }` (`:5489`), que é a
verificação dupla de BR-MIGRAR-006 (T013). Um conteúdo já publicado para no
portão de `future` quando vem pela fila, e nesta guarda quando vem por esta
porta. **Os dois silêncios existem, são de donos diferentes e nenhum registra
erro** — o cenário de paridade do agendamento cobra exatamente isso.

### O que T011 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os quatro testes de `backlog/tests.md` (UT-023-1 a UT-023-4) | **T012**, a tarefa `[P]` que roda em paralelo com esta |
| estender a nulidade ao caminho de gravação | **ninguém**: no legado ele não é nulo, e torná-lo nulo é mudar regra documentada |
| revisar as citações de linha de T003 em `publicacao/publicar.ts` | **ninguém ainda** — ver a nota abaixo |

**Nota de conferência, para quem revisar a paridade.** Algumas citações do
cabeçalho de `publicacao/publicar.ts` estão deslocadas em poucas linhas contra a
árvore em disco: a primeira leitura é `:5407` (não `:5415`), o retorno silencioso
de linha ausente é `:5409` (não `:5417`), o `UPDATE` do estado é `:5446` (não
`:5448`) e os três pontos da transição são `:5922`, `:5940` e `:5980`. O código
está certo e a sequência descrita também — o que está deslocado é o número ao
lado. T011 corrigiu apenas as três citações da **própria** âncora, `:5413`, que é
a regra desta tarefa; o resto é do arquivo de T003 e fica registrado aqui em vez
de reescrito por conta própria.
## O que T013 entrega, e só isso

> *o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4,
> CA-6.5 passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T013

Tudo em `agendamento/`, mais **duas** adições em `publicacao/` que são do caminho
que US-1 também atravessa. O caso de uso é
[UC-04](../../../.specify/use-cases/UC-04-agendar-publicacao-de-conteudo.md), que
*"estende UC-03"*, e a regra é BR-MIGRAR-006 (`P6`) com o
[ADR-0005](../../../.specify/adrs/0005-agendamento-por-comparacao-de-data-nao-por-transicao.md).

| arquivo | o que é |
|---|---|
| `agendamento/instante-da-data.ts` | o `strtotime()` das quatro comparações, com o `false` do PHP preservado como zero |
| `agendamento/estado-pela-data.ts` | **CA-6.1** e **CA-6.2**: a conversão bidirecional, a folga de 60 segundos e o anexo fora do bloco |
| `agendamento/evento-de-publicacao-agendada.ts` | `_future_post_hook()`: limpa e agenda ao entrar em agendado, prioridade 5 no ponto 3 |
| `agendamento/publicacao-agendada.ts` | **CA-6.3** e **CA-6.4**: `check_and_publish_future_post()`, as duas guardas e o reagendamento |
| `agendamento/us-6-agendar-publicacao.test.ts` | 31 testes dos cinco critérios, por efeito no banco e por sequência de chamadas à fila |
| `publicacao/transicao-de-estado.ts` | o ouvinte do **ponto 3** passou a existir, e `ESTADO_AGENDADO` nasceu ao lado de `ESTADO_PUBLICADO` |
| `publicacao/contexto-de-publicacao.ts` | a porta da fila ganhou `agendarEventoUnico`, e o contexto ganhou `get_gmt_from_date()` |

`publicarSeAindaAgendado` é a segunda entrada de `ModuloDeConteudo`, e a primeira
cuja **permissão exigida é nenhuma** — quem a chama é a fila, e no legado não há
ator no disparo (`wp-includes/default-filters.php:357`). O **P4** manda declarar
a permissão de toda operação exposta *e preservar o default de cada camada,
inclusive quando o default é permissivo*: declarar "nenhuma", com a âncora, é
declaração.

### Os três mecanismos de guarda, e por que nenhum deles se remove

ADR-0005 os tabela, e são eles que tornam REQ-024 construível sobre uma fila que
não é confiável — `plan.md` diz na seção *Sequência* que *"essa verificação dupla
é o que torna REQ-024 construível mesmo com a fila do legado"*.

| mecanismo | o que faz | onde está |
|---|---|---|
| `_future_post_hook()` (`:8205`) | ao entrar em agendado, limpa o evento pendente e agenda um novo na data | `agendamento/evento-de-publicacao-agendada.ts` |
| `_transition_post_status()` (`:8189`) | em **qualquer** transição, limpa o evento | `publicacao/transicao-de-estado.ts` (T003, CA-1.5) |
| `check_and_publish_future_post()` (`:5482`) | ao ser chamada pela fila, reconfere estado **e** data | `agendamento/publicacao-agendada.ts` |

A nota de compatibilidade de BR-MIGRAR-006 é endereçada a esta tarefa: *"Num alvo
com fila real a verificação dupla pareceria redundante — e removê-la mudaria o
comportamento no primeiro atraso."* É o risco 3 de `plan.md`, e as duas guardas
estão aqui mesmo que a fila do alvo venha a ser confiável.

### As cinco coisas de T013 que um porte distraído faria diferente

1. **Agendar não é um comando: é o efeito de salvar com data futura.** UC-04 é
   literal no gatilho (*"não há comando 'agendar'"*) e ADR-0005 descarta a
   alternativa pelo nome. Por isso T013 **não** criou uma operação `agendar`:
   criou a comparação de data que o caminho de gravação chama, e a conversão é
   **bidirecional** — data no passado publica na hora, pela mesma comparação
   (CA-6.2).
2. **A folga de 60 segundos não é configurável, e explicitá-la como configuração
   seria inventar ponto de extensão.** `MINUTE_IN_SECONDS` vem de um `define()`
   **sem** guarda `defined()` (`default-constants.php:158`) e aparece literal nas
   duas comparações, sem filtro. T013 deu a ela nome, fonte e teste de borda nos
   dois lados; torná-la alterável em execução é decisão de outra pessoa, e está
   registrada no cabeçalho de `agendamento/estado-pela-data.ts`.
3. **Entrar em agendado limpa o evento DUAS vezes e agenda uma.** São dois
   ouvintes do núcleo em dois pontos diferentes da mesma transição — o do ponto 1
   limpa incondicionalmente, o do ponto 3 limpa de novo e agenda. Fundir as duas
   numa "otimização" muda a sequência que o último cenário de `PT-002` compara.
4. **As duas metades do agendamento leem colunas diferentes.**
   `_future_post_hook()` parte de `post_date` e converte com
   `get_gmt_from_date()`; a verificação dupla parte de `post_date_gmt` cru. O
   docblock do legado diz o contrário do que o código faz (`:8195`), e o código
   venceu (**P1**). As duas fontes só coincidem enquanto o fuso do site não muda.
5. **As bordas de tempo são três, e são diferentes entre si.** Na gravação a
   comparação é `>=` 60 segundos num sentido e `<` 60 no outro; na hora de
   publicar é `>` **sem folga nenhuma**. Logo um conteúdo pode ser agendado na
   gravação por estar 60 segundos à frente e publicado pela fila no segundo exato
   da data.

### 🔴 O que T013 encontrou aberto, e NÃO fechou

**A tabela *Contratos* de `plan.md` descreve uma operação que o sistema analisado
não tem, com um erro que ele não comete.** A linha é
`| agendar publicação | identificador e instante futuro | conteúdo em estado
agendado, com evento na fila | instante no passado |`, e as duas metades
divergem da spec, do caso de uso, do ADR e da regra de negócio:

- **não há operação de agendar** — UC-04: *"o autor salva conteúdo publicado com
  data no futuro — não há comando 'agendar'"*; ADR-0005 descarta *"`future` como
  transição explícita"* com a consequência medida (*"exigiria que a interface e
  toda a API distinguissem publicar de agendar"*);
- **instante no passado não é erro: é publicação imediata** — é o que CA-6.2
  manda, é o que UC-04 repete (*"a conversão é bidirecional e ninguém a
  comanda"*) e é o que o `elseif` de `:4804` faz.

**T013 implementou o lado em que spec, caso de uso, ADR e BR-MIGRAR-006
concordam**, e não criou a operação que erra no passado — porque criá-la
derrubaria CA-6.2. A autoridade para resolver assim está no próprio `plan.md`,
que abre dizendo *"a spec diz **o quê** e **por quê**; este arquivo diz
**como**"* e *"nenhum requisito novo nasce aqui: o que não estiver na spec não é
requisito, é invenção"* — isto é, o plano se subordina à spec por regra escrita
nele mesmo, e não houve escolha entre duas decisões humanas. Mesmo assim fica
**registrado e não fechado**, em `agendamento/index.ts` e aqui: quem revisar a
tabela *Contratos* decide se a linha se reescreve. Mesmo precedente de T003 com
CA-1.1.

## O que T015 entrega, e só isso

> *o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4,
> CA-7.5, CA-7.6 passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T015

Tudo em `revisao/`, e o caso de uso é **um**: o que a tabela de rastreabilidade
de `spec.md` liga a US-7 é
[UC-06](../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md).

| arquivo | o que é |
|---|---|
| `revisao/contexto-de-revisao.ts` | o contexto, os **quatro** colaboradores novos e os **dois** pontos de extensão da paginação da fila |
| `revisao/estado-na-submissao.ts` | **CA-7.1** e **CA-7.5**: os cinco passos de `_wp_translate_postdata()`, e o rebaixamento que T003 registrou e não portou |
| `revisao/permissao-de-revisao.ts` | **CA-7.1** e **CA-7.6**: as três perguntas de capacidade, e por que a falta de `publish_posts` não recusa nada |
| `revisao/fila-de-revisao.ts` | **CA-7.2**: as quatro decisões de `wp_edit_posts_query()` e o portão da tela |
| `revisao/submeter-para-revisao.ts` | a operação, e `wp_update_post()` — que T005 declarou e não portou |
| `revisao/us-7-submeter-para-revisao.test.ts` | 36 testes dos seis critérios, por efeito no banco, por variável de consulta e por decisão de capacidade |

**As três âncoras que `spec.md` dá para US-7 já estavam na árvore quando esta
tarefa começou:** `wp-includes/post.php:4731` e `:5561` são de T007 (o
identificador vazio e a dispensa de unicidade em `pending`), e
`wp-includes/capabilities.php:369` é de T017 da feature 001 (o `case
'read_post'`). O que faltava era a **operação**, que este README reservou a T015
em três lugares diferentes e que `plan.md` declara na tabela *Contratos*:
*"submeter para revisão | identificador | conteúdo pendente, com o identificador
na URL esvaziado quando quem submete não pode publicar | sem permissão de
editar"*.

### As cinco coisas de T015 que um porte distraído faria diferente

1. **O painel não recusa quem não pode publicar: ele rebaixa.** Pedir publicação
   e pedir revisão são **a mesma requisição** no editor clássico, e o que separa
   as duas é a capacidade de quem pediu — o comentário do legado é literal:
   *"Posts 'submitted for approval' are submitted to $_POST the same as if they
   were being published"* (`wp-admin/includes/post.php:148`-`:159`). Quem
   transformar o rebaixamento em recusa apaga a história inteira.
2. **A falta de `publish_posts` não é erro: é a condição do caso.** UC-06 diz
   *"`edit_posts` basta. O que falta ao colaborador é `publish_posts`, e é essa
   falta que define o caso"*. A capacidade exigida é `edit_post` **com o
   objeto** (meta-capacidade); a de publicar é só **perguntada**, e decide duas
   coisas — o estado gravado (CA-7.1) e o identificador esvaziado (CA-7.4).
3. **O portão da fila é `edit_posts`, e não `publish_posts`** (`wp-admin/edit.php:44`).
   CA-7.2 diz *"a fila de quem pode publicar aquele tipo"*, e é verdade que quem
   publica a vê — porque todo papel de fábrica que tem `publish_posts` tem
   `edit_posts`. Trocar o portão fecharia a tela para o colaborador, que no
   legado a abre, e é nela que ele vê o próprio texto em revisão.
4. **A data de um rascunho caminha a cada salvamento.** É o `$clear_date` de
   `wp_update_post()` (`:5356`-`:5372`): estado de data flutuante + coluna GMT na
   sentinela + sem `edit_date` → `post_date` recebe agora. O comentário do legado
   dá a intenção (*"Drafts shouldn't be assigned a date unless explicitly done so
   by the user"*) e a coluna dá o efeito.
5. **Submeter pelo painel sem o campo de discussão FECHA os comentários**
   (`:169`-`:175`). O painel crava `closed` antes de a gravação ser chamada, e o
   valor cravado vence o default do **tipo** (`open` de fábrica para `post`). É
   irmão do achado 5 de T005, por outro caminho.

### 🔴 O que T015 encontrou aberto, e NÃO fechou

**Portar o rebaixamento não resolve a divergência de CA-1.1**, e isso é
deliberado. O item 5 de *O que ninguém decidiu* continua aberto: o critério de
US-1 pede *"recusa explícita na tela"*, o painel rebaixa, e as duas superfícies
seguem diferentes no sistema novo exatamente como são no legado — a API REST
recusa com `rest_cannot_publish` e 403 (T003, em
`publicacao/permissao-de-publicacao.ts`), o painel rebaixa para `pending` (T015,
em `revisao/estado-na-submissao.ts`). Nenhuma das duas tarefas escolhe qual
leitura do critério vale: o **P1** exige decisão humana registrada para divergir,
e nenhuma existe.

**E duas coisas que esta tarefa reproduziu com aviso, em vez de corrigir:**

- **o autor do pedido sobrepõe o autor da linha** no caminho do painel, porque
  `_wp_translate_postdata()` sempre devolve a chave preenchida (`:69`-`:85`) e
  `wp_update_post()` faz o pedido vencer a linha (`:5367`). Nesta história o
  efeito é nenhum — quem submete conteúdo próprio já é o autor —, e o aviso está
  no cabeçalho de `autorDaSubmissao()` porque **CA-8.2 passa por essa linha**:
  quem pegar T017 precisa dele;
- **a segunda pergunta de `edit_post`** de `_wp_translate_postdata()` (`:47`) tem
  outra mensagem que a do portão de `edit_post()` (`:298`), e não é alcançável
  depois dele. Ela está no código, na posição exata, com a mensagem que o legado
  tem — mesmo precedente dos dois últimos pares de `ERROS_DA_GRAVACAO`.

### O que T015 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os oito testes de `backlog/tests.md` (UT-025-1 a UT-025-8) | **T016**, a tarefa `[P]` que roda em paralelo com esta |
| avisar o autor, o editor ou quem for | **ninguém aqui.** UC-06 é literal: *"Nenhuma notificação sai daqui (…) A revisão depende de alguém abrir a tela"*. US-9 é T019, com a parada registrada |
| devolver o conteúdo ao autor — o caminho de volta de UC-06 | **T017** (US-8, CA-8.4). `atualizarConteudo` está exportada para ela, e é `wp_update_post()` |
| a visibilidade privada, que é o outro ramo do rebaixamento (`:142`-`:144`) | **T009** (US-4). O ramo está aqui porque o destino dele é o estado desta história |
| a comparação de 60 segundos de `publish` ⇄ `future` | **T013** (US-6). A lista `['publish','future']` do rebaixamento está nomeada para ela |
| `WP_Query`, que materializa a fila | **T009 da feature 004**. No legado a fila do painel **também não** escreve SQL: ela monta variáveis de consulta e entrega, e é isso que esta pasta porta |
| a consulta pública que CA-7.3 cobra | **T009 da feature 004** — mesmo precedente de CA-2.3 em T005. O que esta tarefa entrega é a **condição**: a linha carrega um estado que o registro declara não público e não consultável |
| `sanitize_key()` | `plataforma/formatacao/`, feature 015 — chega pelo colaborador `ChaveSanitizada` |
| a opção de paginação por conta, a barra de contagem por estado e a tela | `plataforma/opcoes/` e BC-10 (`painel/`) |
| a montagem da data pelos seis campos do formulário | BC-10. O `editarData` da operação é o `edit_date` que sai dali, e ele tem **um** efeito aqui: desligar o `$clear_date` |
| a atualização das versões de conteúdo pré-3.6 (`:302`-`:316`) | **ninguém**: é rotina de migração de dado, e a resposta 2 fixa *"instalação nova, sem dado a migrar"* |
| formato de conteúdo, metadado, anexo, `tax_input`, `_edit_last`, trava de edição e conteúdo fixado | BC-07, BC-04, BC-02 e BC-10 — cada um na posição exata em `submeter-para-revisao.ts` |
| a segunda tentativa de gravação com `strip_invalid_text_for_column()` (`:466`-`:476`) | a camada de dados, feature 015: a porta de T002 não reporta a falha que a dispara |
| registrar quem decidiu a transição | **ninguém**: REQ-028 está em `do-not-rewrite.md` |
| emitir ponto de extensão por um barramento | ninguém deste pacote (REQ-162). Os dois desta pasta chegam como interceptador opcional, e ponto sem interceptador é, no legado, um no-op |

## O que T017 entrega, e só isso

**US-8**: *"revisar e publicar conteúdo de outro autor preservando a autoria
original"* — os seis critérios CA-8.1 a CA-8.6, em `revisao-editorial/`.

| arquivo | o que é |
|---|---|
| `revisao-editorial/permissao-da-revisao-editorial.ts` | **CA-8.1**, **CA-8.5** e **CA-8.6**: a soma que a tradução devolve, lida como **valor**, e o portão que a compara |
| `revisao-editorial/autoria-na-revisao.ts` | **CA-8.2**: os dois mecanismos que preservam o autor, e o ramo que o legado resolve pela linha |
| `revisao-editorial/revisar-e-publicar.ts` | as duas operações — publicar o alheio e devolver ao autor — e o achado de que as duas são o **mesmo** campo do formulário |
| `revisao-editorial/us-8-revisar-e-publicar.test.ts` | 31 testes dos seis critérios, por efeito no banco e por lista de capacidades |

**As três âncoras que `spec.md` dá para US-8 são `wp-admin/post.php:236`,
`wp-includes/capabilities.php:149` e `:113`** — e as duas de `capabilities.php`
**já estavam na árvore** quando esta tarefa começou: são de T017 da feature 001,
em `plataforma/autorizacao/traducao-de-conteudo.ts`. O que faltava era
`wp-admin/post.php:236`, o `case 'editpost'`, que é `edit_post()` — e **ela
também já estava**, portada por T015. Esta tarefa, portanto, **não portou função
nova do legado**: ela declarou as duas operações que `plan.md` pede, com o que
falta para que as duas histórias se distingam.

### 🟢 O achado que decidiu o trabalho de T017

**O botão primário do editor é o mesmo campo para publicar e para submeter**
(`wp-admin/includes/meta-boxes.php:376`-`:398`): com `$can_publish` o rótulo é
*"Publish"*, sem ela é *"Submit for Review"*, e o `name` é `publish` nos **dois**
ramos. Muda o rótulo, não a requisição — e é o que o comentário de
`_wp_translate_postdata()` diz do outro lado: *"Posts 'submitted for approval'
are submitted to `$_POST` the same as if they were being published"* (`:148`).

Logo **US-7 e US-8 não são duas funções do legado, são uma**, e T017 chama a
porta de T015 em vez de escrever um segundo `edit_post()`. Nenhum arquivo de
`revisao/` foi alterado por esta tarefa.

### As quatro coisas de T017 que um porte distraído faria diferente

1. **A soma não é feita pela operação: ela é o que a tradução devolve.** CA-8.1
   diz *"a autorização soma a capacidade de mexer em conteúdo alheio à capacidade
   exigida pelo estado"*, e a pergunta que a operação faz é **uma**: `edit_post`
   com o objeto. Quem perguntasse `edit_others_posts` direto responderia "sim" a
   quem não pode mexer no conteúdo **daquele estado**. E `PERM-1` fecha o sentido
   do verbo: é preciso ter **todas**, não qualquer uma.
2. **A autoria não é preservada por um `if`.** São dois mecanismos somados — a
   superfície devolve o autor da linha antes de traduzir
   (`wp-admin/includes/post.php:691`-`:695`, literal em `bulk_edit_posts()`) e a
   mistura de `wp_update_post()` faz chave ausente conservar o valor gravado
   (`wp-includes/post.php:5367`). O terceiro ramo de `_wp_translate_postdata()` é
   `get_current_user_id()` (`:85`): um pedido que chegasse lá **sem** o campo
   sairia com o autor trocado por quem revisou, e a mistura gravaria a troca.
3. **Devolver ao autor é privilégio de quem podia publicar, e não é um botão.**
   Para um `pending` o botão de ação menor é *"Save as Pending"*, não *"Save
   Draft"* (`meta-boxes.php:58`-`:59`), e ele é `name="save"` — que não é um dos
   cinco campos que `_wp_translate_postdata()` lê. Quem volta um pendente para
   rascunho é o **seletor de estado** (`<select name="post_status">`, `:160`), e
   ele só é renderizado para quem pode publicar (`:129`).
4. **Publicar por aqui fixa o identificador; publicar pela transição não.** É o
   achado de T003 em ação: `wp_publish_post()` não toca `post_name`, logo *"o
   slug muda sozinho ao publicar"* (BR-MIGRAR-005) só acontece quando se publica
   **salvando** — que é este caminho, e é o que torna CA-8.3 verdadeiro sem uma
   linha de código nova.

### 🔴 O que T017 encontrou aberto, e NÃO fechou

**UC-07 atribui à edição uma proteção que, no legado, só existe na exclusão.**

- UC-07, tabela de exceções: *"O conteúdo é a página inicial ou a página de posts
  | exige `manage_options`, que o editor não tem"*, repetido em *O que um porte
  precisa saber* como *"🟢 O editor não edita a página inicial"*.
- `wp-includes/capabilities.php`: o ramo que troca a família por `manage_options`
  para `page_for_posts` e `page_on_front` está **somente** no
  `case 'delete_post'` (`:113`-`:118`). O `case 'edit_post'` (`:188`-`:285`) vai
  do objeto inexistente direto para a revisão, o tipo, a dispensa de tradução, a
  autoria e o estado, e termina na página de política de privacidade (`:282`) —
  **sem esse ramo**. BR-MIGRAR-091 diz *"página inicial e página de posts exigem
  `manage_options`"* sem nomear o verbo, e ancora justamente `:113`.
- `plataforma/autorizacao/traducao-de-conteudo.ts` (T017 da feature 001) aplica o
  ramo aos **dois** verbos, porque ele está em `resolverPorAutoriaEEstado()`.
  Nesta árvore, portanto, editar a página inicial exige `manage_options`, e no
  sistema analisado não exige.

**T017 não resolveu isso e não podia:** mexer naquele arquivo é mexer em regra de
negócio documentada e em entrega de outra tarefa, e a tabela *Não negociável* da
constituição põe isso entre o que o agente **não decide sozinho**. O que esta
tarefa fez é o que o **P1** manda fazer com divergência sem decisão humana:
registrá-la onde quem decide a encontre, e **não apoiar nenhum critério nela** —
por isso **CA-8.6 é cumprido pela página de política de privacidade**, que é a
função especial que o `case 'edit_post'` do legado tem.

**E as duas divergências que já estavam abertas continuam abertas:** US-9 pede
aviso ao autor onde UC-07 diz que *"o sistema não avisa"* (a PARADA de
`portas/porta-de-email.ts`, intocada: esta tarefa constrói o caminho de volta e
**não envia nada**), e o item 5 de *O que ninguém decidiu* segue de pé — quem tem
`edit_others_posts` e não tem `publish_posts` é **rebaixado** para `pending`, não
recusado.

### O que T017 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os oito testes de `backlog/tests.md` (UT-026-1 a UT-026-8) | **T018**, a tarefa `[P]` que roda em paralelo com esta |
| avisar o autor de que o texto foi devolvido ou publicado | **T019** (US-9) — ver acima |
| registrar quem revisou e quando | **ninguém**: REQ-028 está em `do-not-rewrite.md`, e UC-07 confirma na pós-condição — *"nenhum registro de quem aprovou foi gravado"* |
| a fila de onde o editor abre o pendente, que é o **gatilho** de UC-07 | **T015**, em `revisao/fila-de-revisao.ts` (CA-7.2) |
| a versão anterior do texto ajustado | **T021** (US-10) |
| a visibilidade privada, o outro destino do seletor de estado | **T009** (US-4) |
| o agendamento, que é o **mesmo** campo `publish` com outro rótulo (`meta-boxes.php:384`) | **T013** (US-6) |
| alterar o ramo de página especial da plataforma | **ninguém**: é decisão humana — ver 🔴 acima |
| fixar e desafixar o conteúdo (`sticky`), o único uso de `edit_others_posts` **fora** da autorização (`:483`-`:489`) | BC-07 |
| `_edit_last`, a trava de edição e a correção de vínculo de anexo | BC-10 e BC-04 |
| a sanitização do corpo que o editor ajustou (REQ-030) e o formato dele (REQ-032) | **ninguém** — e a operação não grava corpo que o pedido não traga |
## O que T021 entrega, e só isso

> *o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3,
> CA-10.4 passam contra o sistema novo*
> — `.specify/specs/002-autoria-e-publicacao/tasks.md`, T021

Tudo em `versoes/`, e é a **segunda** regra de negócio deste módulo. Os casos de
uso que a tabela de rastreabilidade de `spec.md` liga a US-10 são
[UC-03](../../../.specify/use-cases/UC-03-publicar-conteudo.md) e
[UC-07](../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md),
e o arquivo do legado é `wp-includes/revision.php` (1.139 linhas).

| arquivo | o que é |
|---|---|
| `versoes/contexto-de-versao.ts` | o contexto, as **três** gravações de ligação tardia, os **dez** pontos de extensão e os **cinco** ouvintes de fábrica |
| `versoes/configuracao-de-versoes.ts` | **CA-10.2**: `WP_POST_REVISIONS`, o `true` que vira `-1`, e as três bordas |
| `versoes/campos-da-versao.ts` | os três campos de fábrica, a ordem contra os nove protegidos, e a cópia |
| `versoes/mudanca-de-versao.ts` | a normalização de espaço em branco que decide se vale gravar |
| `versoes/metadado-versionado.ts` | os três ouvintes de fábrica do metadado versionado (6.4) |
| `versoes/leitura-de-versoes.ts` | *"listar versões"*, e as três perguntas sobre uma linha de versão |
| `versoes/guardar-versao.ts` | **CA-10.1** e a poda de **CA-10.2** |
| `versoes/restaurar-versao.ts` | **CA-10.4** |
| `versoes/permissao-de-versao.ts` | **CA-10.3**, e as duas metades que não são a mesma regra |
| `versoes/us-10-versoes-anteriores.test.ts` | 55 testes dos quatro critérios, por efeito no banco e por sequência de pontos |

T021 acrescenta **três** entradas a `ModuloDeConteudo` — `guardarVersao`,
`listarVersoes` e `restaurarVersao` —, e cada uma declara a permissão que o
**P4** exige, inclusive a primeira, cuja declaração é *"nenhuma, e é assim no
legado"*.

### As cinco coisas de T021 que um porte distraído faria diferente

1. 🔴 **A versão que o legado grava carrega o texto NOVO, não o antigo.**
   `wp_save_post_revision()` corre **depois** da escrita, lê `get_post(
   $post_id )` — logo o registro já atualizado — e versiona esse registro
   (`wp-includes/revision.php:140` e `:217`). O docblock da própria função diz a
   consequência: *"as every update is a revision, and **the most recent revision
   always matches the current post**"* (`:122`). Criar conteúdo com o corpo `A` e
   depois gravar `B` deixa **uma** versão, com `B` — e o corpo `A` não fica em
   versão nenhuma. Ver o item 6 de *O que ninguém decidiu*.
2. **A instalação de fábrica versiona em `wp_after_insert_post`, não em
   `post_updated`.** São **dois** ouvintes com guarda cruzada por `has_action()`
   (`:112` e `:136`), e a mudança é de 6.4.0: *"Saves revisions for a post after
   all changes have been made"* (`:99`). Quem versionar em `post_updated`
   versiona **antes** dos termos e dos metadados do conteúdo, e a comparação de
   metadado versionado passa a ler o estado errado.
3. **`WP_POST_REVISIONS` é `true` de fábrica, e `true` quer dizer `-1`**, isto é
   *"guardar todas"* (`wp-includes/default-constants.php:392`,
   `revision.php:813`). A comparação é **idêntica**: a cadeia `'true'`, que uma
   configuração mal escrita produz, cai no `(int)` e vira `0`, que **desliga** o
   versionamento. E `wp_revisions_enabled()` compara com **zero**, não com
   *"maior que zero"* — um porte que escrevesse `> 0` desligaria o versionamento
   da instalação de fábrica.
4. **Mexer só no espaço em branco não cria versão.** A comparação é
   `normalize_whitespace( maybe_serialize( … ) )` nos dois lados (`:190`), e o
   `trim()` do PHP apara `\0` e `\x0B` e **não** apara `\f` — o
   `String.prototype.trim()` do JavaScript apararia. E o `maybe_serialize` no
   meio não é inútil: para corpo que **parece** serializado, ele acrescenta o
   comprimento em bytes, que sobrevive à normalização.
5. **A poda guarda mais do que o limite quando há salvamento automático entre as
   mais antigas.** O `count( $revisions )` conta a linha de salvamento
   automático, e o `str_contains( …, 'autosave' )` a **pula** em vez de apagar
   outra no lugar (`:245` e `:254`). E esse teste é a cadeia **nua**
   `'autosave'`, não `"{$pai}-autosave"` como em `wp_is_post_autosave()`: são
   dois testes diferentes no mesmo arquivo do legado.

### 🔴 O que T021 encontrou aberto, e NÃO fechou

**CA-10.3 diz "uma versão não é editável e não é apagável por permissão de
conteúdo", e só a segunda metade é capacidade.** Lidos os três casos de objeto:

| caso pedido | o que o legado faz com uma linha `revision` | linha |
|---|---|---|
| `delete_post` | **`do_not_allow`**, e para ali | `capabilities.php:108` |
| `edit_post` | **segue para o conteúdo pai** e resolve nele | `capabilities.php:215` |
| `read_post` | **segue para o conteúdo pai** e resolve nele | `capabilities.php:314` |

Apagar é negado a todos, inclusive ao super administrador, porque `do_not_allow`
é o único nome que o atalho de rede de `PERM-9` não vence. **Editar não é
negado**: a pergunta é respondida como se fosse sobre o pai.
`BR-MIGRAR-091` e a tabela de exceções de UC-07 registram **só** a metade de
apagar; nada no pacote diz que editar é negado.

E o endpoint de exclusão de versão faz **três** perguntas, não duas
(`class-wp-rest-revisions-controller.php:460`-`:493`): `delete_post` do pai
(`:466`), **`edit_post` do pai** (`:480`) — que o legado não escreve com
`current_user_can`, porque reaproveita `get_items_permissions_check()` — e
`delete_post` da versão (`:484`). A do meio decide **qual recusa o ator recebe**:
quem pode apagar o conteúdo de outra pessoa e não pode editá-lo é barrado com
`rest_cannot_read` e *"…view revisions of this post."*, e não com a mensagem de
exclusão. É a pergunta que se perde ao ler a função procurando portões, e há
teste de mutação por ela.

*"Não é editável"* é verdade por outro caminho, e são três recusas
independentes: a API REST de versões não registra rota de escrita
(`class-wp-rest-revisions-controller.php:83`-`:140`);
`_wp_put_post_revision()` recusa versionar uma versão, com texto
(`revision.php:366`); e a restauração escreve no **pai**, nunca na versão
(`:496`). T021 **não escolhe** entre as duas leituras, porque as duas levam ao
mesmo lugar — a versão não é editada —, e o que ela faz é *perguntar*
`delete_post` a `plataforma/autorizacao/` em vez de cravar a negação, **não**
negar `edit_post` sobre a versão, e registrar a divergência de redação. A análise
completa está no cabeçalho de `versoes/permissao-de-versao.ts`.

### Uma divergência menor de T021, declarada e não corrigida

A comparação de metadado versionado do legado é `get_post_meta( … ) !==
get_post_meta( … )` sobre valores já desserializados; aqui ela é feita sobre o
valor **reserializado** pelo codec de `plataforma/serializacao/`, que é canônico
e conformado byte a byte. Os dois caminhos coincidem — inclusive no caso do
valor que parece serializado e não se lê, que vira `false` nos dois lados —
porque a reserialização é aplicada **depois** de `talvezDesserializar()`.
Comparar os **bytes crus** da coluna é o que divergiria, e é a economia que um
porte faria. A nota está no cabeçalho de `versoes/metadado-versionado.ts`.

### Uma mudança de T021 em arquivo de T002, e por quê

T021 acrescentou **duas** coisas ao armazenamento de T002, e nenhuma é regra de
negócio:

- **`campoDaColuna()`**, em `armazenamento/conteudo.ts`: a tradução de nome de
  coluna do legado para campo gravável. Existe porque
  `_wp_post_revision_fields` é **filtro público** e a extensão declara ali pelo
  **nome de coluna**; sem a tradução, o ponto de extensão existiria sem *"a
  capacidade de alterar o resultado que ele tem hoje"*, que o **P2** põe na
  tabela *Não negociável*. Mora em T002 porque `COLUNAS_GRAVAVEIS` é o único
  lugar deste módulo em que o par coluna-campo existe.
- **o parâmetro de ordem em `RepositorioDeVersoes.listar()`**: a poda chama a
  **mesma** função do legado com `array( 'order' => 'ASC' )` (`:229`), porque é a
  ordem crescente que põe a versão mais antiga na frente da lista que vai ser
  cortada. Inverter a lista em memória faria o comando que sai deixar de ser o do
  legado.

### O que T021 NÃO fez, e por quê

| não fez | de quem é |
|---|---|
| os seis testes de `backlog/tests.md` (UT-029-1 a UT-029-6) | **T022**, a tarefa `[P]` que roda em paralelo com esta |
| `wp_insert_post()` e `wp_update_post()`, que **criar e restaurar versão chamam** | **T005** (US-2) — chegam por `GravacaoNaVersao`, de ligação tardia |
| `wp_delete_post()`, que **a poda chama** | **feature 005** (`PT-003`): `EXT-EXCLUSAO` põe as sete etapas no comportamento observável, e o P5 cobra o conjunto exato do que fica órfão |
| o salvamento automático | **T023** (US-11), e ele reusa `gravarVersaoDoConteudo( …, autosave )` em vez de escrever outra função |
| a trava de edição e o nonce da tela de restauração | BC-07 e `plataforma/` — declarados **na posição exata do fluxo** em `versoes/restaurar-versao.ts` |
| o registro de tipos (`post_type_supports`) e o de metadados (`register_meta`) | `plataforma/` — chegam por ligação tardia, e o segundo com lista vazia por default, que é o que o legado faz para tipo sem metadado versionado declarado |
| `wp_get_latest_revision_id_and_total_count()` | features 004 e 015: a contagem sai do `FOUND_ROWS()` de `WP_Query` |
| o `$fields` opcional de `wp_restore_post_revision()` | ninguém: **nenhum** dos chamadores do legado o informa, e quem precisar dele passa a lista pelo ponto `_wp_post_revision_fields` |
| emitir ponto de extensão por um barramento | ninguém deste pacote: REQ-162 está em `do-not-rewrite.md`. Os dez pontos estão **declarados** em `versoes/contexto-de-versao.ts`, com nome, argumentos, tipo e posição |
| trilha de quem restaurou, além do `_edit_last` que o legado grava | **ninguém deste pacote**: REQ-028 está em `do-not-rewrite.md`, e UC-07 confirma que *"nenhum registro de quem aprovou foi gravado"* |

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
  comportamento no primeiro atraso. Entregue por **T013** (US-6) — ver a seção
  dela, inclusive a divergência de `plan.md` que ficou aberta.

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

> T003 acrescentou o item 5; T009, o 6; T013, o 7; T021, os itens 8 e 9. Os
> quatro primeiros são de T001.

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

6. 🔴 **O rebaixamento da visibilidade privada é OUTRO, e ninguém o decidiu
   tampouco.** É o irmão do item 5, apurado por T009: sem a capacidade de
   publicar, o painel grava, para `private`, **o estado anterior** — ou `pending`
   quando não há (`wp-admin/includes/post.php:142`-`:144`) —, enquanto para
   `publish` e `future` grava `pending` (`:152`-`:159`). CA-4.1 não fala de
   rebaixamento, e uniformizar os dois poria em revisão rascunhos que o legado
   deixa quietos. **T009 não escolheu entre as duas leituras**, pelo mesmo
   precedente: recusa como valor com o código e o texto da API, rebaixamento
   declarado e não aplicado em `visibilidade/permissao-de-conteudo-privado.ts`.

7. 🔴 **A tabela *Contratos* de `plan.md` descreve `agendar publicação` como
   operação com entrada e erro próprios, e o sistema analisado não tem nem a
   operação nem o erro.** T013 implementou o lado em que spec, UC-04, ADR-0005 e
   BR-MIGRAR-006 concordam — a comparação de data, bidirecional, sem comando — e
   registrou a linha divergente sem reescrevê-la. A análise completa está na
   seção de T013, acima, e no cabeçalho de `agendamento/index.ts`.
   **T015 portou o rebaixamento e NÃO fechou este item.** Ele está em
   `revisao/estado-na-submissao.ts`, na posição do legado, e com ele as duas
   superfícies do sistema novo ficam diferentes **do mesmo jeito** que as do
   legado: a API recusa, o painel rebaixa. Continua sem decisão humana qual das
   duas leituras de CA-1.1 vale — e nenhuma das duas tarefas pode tomá-la.

8. 🔴 **CA-10.1 e CA-10.4 descrevem "a versão anterior" e "guardar o corrente
   como versão nova", e o legado guarda o texto COMO ELE ACABOU DE SER
   GRAVADO.** A versão é criada depois da escrita, a partir da linha já
   atualizada (`wp-includes/revision.php:140` e `:217`), e o docblock da função é
   literal: *"the most recent revision always matches the current post"*. As duas
   leituras coincidem no que os critérios cobram de verificável — uma linha de
   versão por gravação de conteúdo que já existia, ligada ao conteúdo, e texto
   anterior recuperável — e **divergem no conteúdo da linha que cada gravação
   cria**. Na restauração, a versão nova carrega o texto **restaurado**, e o
   sobrescrito já era a versão mais recente antes dela. **T021 reproduz o legado
   e não escolhe**: `pending_decisions.md` não tem pergunta sobre versão, e
   `target_business_rules.md` não tem regra de versão além da cascata de exclusão
   (BR-MIGRAR-104) e da negação de capacidade (BR-MIGRAR-091). A análise está em
   `versoes/contexto-de-versao.ts`.

9. 🔴 **CA-10.3 dá como negada por permissão uma edição que o legado resolve pelo
   pai.** Ver a seção de T021: `delete_post` sobre versão é `do_not_allow`,
   `edit_post` **não** é. T021 não negou `edit_post`, porque negar fecharia o
   sistema mais que o legado e contradiria `capabilities.php:215`.

Os quatro primeiros estão em `spec.md`, seção *Perguntas em aberto* (o primeiro,
como consequência de nada ali especificar o aviso). A tabela *Não negociável* da
constituição põe cada um deles fora do alcance do agente de codificação. Do
quinto ao nono não estão em `spec.md`: são divergências entre o que o pacote
escreve e o código lido, e o **P1** as põe na mesma mesa.

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
⚠️ **E há uma lacuna declarada por T009: nenhuma das 20 specs de paridade deste
pacote menciona conteúdo privado.** Uma busca por `private` e por `privad` em
`.specify/migration/parity_tests/` devolve zero ocorrências — `PT-002` não tem
cenário do privado entre os onze, e a invariante de US-4 só aparece de lado em
`PT-011`, no cenário `@concorrencia` (*"a resposta anônima não contém nada que só
a autenticada veria"*). Para CA-4.2, CA-4.3 e CA-4.4 vale também a **área 1** do
critério — *saída byte a byte* —, porque feed, sitemap e API REST são contrato de
terceiro. Escrever cenário de paridade não é tarefa de implementação e
`parity_specs.md` é artefato do Inspector; a lacuna fica registrada aqui, em
`visibilidade/index.ts` e no relato de T009.

Com T015, o segundo deles ganha o **Quando** que faltava: o cenário diz *"quando
ele **submete um conteúdo para revisão** informando um slug"*, e até então a
árvore tinha o efeito sem a operação que chega nele. `revisao/us-7-submeter-para-revisao.test.ts`
afirma o cenário inteiro pela porta da submissão — o campo de slug vazio, e
nenhuma consulta de unicidade saindo.

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
