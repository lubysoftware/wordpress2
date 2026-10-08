# Módulo de conteúdo — BC-01

Esqueleto entregue por **T001** da feature `002-autoria-e-publicacao`. Este
arquivo é a leitura obrigatória de quem pegar T002 em diante: ele diz o que já
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

**Não há estrutura de dados, consulta nem transição de estado neste módulo.**
T002 porta a forma de armazenamento (`posts`, `postmeta`, versão anterior) e T003
em diante portam o comportamento. Ver os conflitos abertos no fim deste arquivo
antes de começar.

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
`ESTADO_PADRAO_DO_ARMAZENAMENTO`) e **não resolve nenhum**: a resolução na escrita
é T005 (US-2) e o DDL é T002. A spec de paridade `PT-002` abre com o mesmo aviso e
tem cenário dedicado a afirmar que *"a divergência entre os dois defaults é
idêntica nas duas metades"*.

Dois irmãos deste achado, que também não se "consertam":

- **O identificador na URL muda sozinho na publicação** (BR-MIGRAR-005). A
  unicidade é dispensada em `draft`, `pending`, `auto-draft`, em revisão e no tipo
  `user_request`. Declarar `UNIQUE` no slug quebra o produto: a dispensa **é** a
  regra. É T007 (US-3).
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

Os quatro estão em `spec.md`, seção *Perguntas em aberto* (o primeiro, como
consequência de nada ali especificar o aviso). A tabela *Não negociável* da
constituição põe cada um deles fora do alcance do agente de codificação.

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

**Nenhuma delas é executável hoje:** `parity_specs.md` registra que não há
oráculo executável nesta árvore (o manifesto de telas declara
`oracleAvailable: false`, com 3 capturas para 113 telas), e levantá-lo é T001 da
feature 015.

Mas o **código-fonte** do sistema analisado está legível em disco, fora desta
árvore, em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versão do pacote), e
foi contra ele que cada afirmação deste módulo foi conferida. É por isso que todas
citam arquivo e linha em vez de descrever o comportamento de memória — e é o que
T002 em diante deve fazer antes de declarar que falta informação: a âncora do caso
de uso normalmente existe e está a uma leitura de distância.
