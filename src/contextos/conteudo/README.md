# Módulo de conteúdo — BC-01

Esqueleto entregue por **T001** da feature `002-autoria-e-publicacao`, com a
forma de armazenamento entregue por **T002**, a publicação por ato explícito
(US-1) entregue por **T003** e o conteúdo privado (US-4) entregue por **T009**.
Este arquivo é a leitura obrigatória de quem pegar T005 em diante: ele diz o que
já está decidido, o que está decidido **em outro lugar**, e o que ninguém
decidiu.

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
do armazenamento — o DDL de `armazenamento/esquema.ts` carrega o `publish` —, e a
resolução na escrita continua sendo T005 (US-2). A spec de paridade `PT-002` abre com o mesmo aviso e
tem cenário dedicado a afirmar que *"a divergência entre os dois defaults é
idêntica nas duas metades"*.

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

6. 🔴 **O rebaixamento da visibilidade privada é OUTRO, e ninguém o decidiu
   tampouco.** É o irmão do item 5, apurado por T009: sem a capacidade de
   publicar, o painel grava, para `private`, **o estado anterior** — ou `pending`
   quando não há (`wp-admin/includes/post.php:142`-`:144`) —, enquanto para
   `publish` e `future` grava `pending` (`:152`-`:159`). CA-4.1 não fala de
   rebaixamento, e uniformizar os dois poria em revisão rascunhos que o legado
   deixa quietos. **T009 não escolheu entre as duas leituras**, pelo mesmo
   precedente: recusa como valor com o código e o texto da API, rebaixamento
   declarado e não aplicado em `visibilidade/permissao-de-conteudo-privado.ts`.

Os quatro primeiros estão em `spec.md`, seção *Perguntas em aberto* (o primeiro,
como consequência de nada ali especificar o aviso). A tabela *Não negociável* da
constituição põe cada um deles fora do alcance do agente de codificação. O quinto
e o sexto não estão em `spec.md`: os dois são divergência entre o critério de
aceite e o código lido, e o **P1** os põe na mesma mesa.

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
