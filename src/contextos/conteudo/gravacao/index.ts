/**
 * `gravacao/` — gravar conteudo, com o estado resolvido para rascunho quando
 * ninguem o informa e com o identificador na URL unico a partir da publicacao.
 *
 * Entrega de **T005** (US-2) e **T007** (US-3) da feature
 * `002-autoria-e-publicacao`, e e `wp_insert_post()` menos o que pertence a
 * outras historias (ver a tabela no fim). Os casos de uso sao os **tres** que a
 * tabela de rastreabilidade de `spec.md` liga as duas historias —
 * [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md), que abre
 * com *"duas regras para a mesma coluna"* e cujo passo 4 e *"cobra unicidade do
 * identificador na URL, que em rascunho era dispensada"*,
 * [UC-06](../../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md),
 * que e o mesmo caminho de escrita visto por quem nao pode publicar, e
 * [UC-07](../../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md),
 * cujo passo 5 e *"fixa o identificador de URL, que estava vazio"*.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-gravacao.ts` | o contexto, os **dez** colaboradores de ligacao tardia, as 21 colunas e os **onze** pontos de extensao |
 * | `verdade-de-php.ts` | o `empty()` e a verdade de PHP, que decidem `'0'` ao contrario deste runtime |
 * | `estado-na-gravacao.ts` | **CA-2.1**, **CA-2.2** e **CA-2.3**: as duas barreiras do `draft`, e a reescrita do anexo |
 * | `data-na-gravacao.ts` | as quatro colunas `datetime`, e a sentinela que o rascunho grava |
 * | `campos-na-gravacao.ts` | os 19 defaults e os campos cuja pergunta nao e `empty()` |
 * | `identificador-na-url.ts` | **CA-3.1** e **CA-3.2**: a dispensa, os tres escopos de unicidade, o laco do sufixo e os cinco pontos de extensao |
 * | `permissao-do-identificador.ts` | **CA-3.4**: o unico portao de capacidade deste caminho, e o `case 'publish_post'` que nao existia na plataforma |
 * | `identificador-de-amostra.ts` | **CA-3.3**: o endereco que o editor mostra antes de publicar, que ja e o da publicacao |
 * | `gravar.ts` | a operacao, os 24 passos com o dono de cada um, e os erros como valor |
 * | `us-2-gravar-rascunho.test.ts` | os tres criterios de US-2, afirmados por efeito no banco e por sequencia de pontos |
 * | `us-3-identificador-unico.test.ts` | os quatro criterios de US-3, afirmados pelos mesmos meios |
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2), somado ao
 * **valor devolvido pelo ponto de extensao, byte a byte**, e a **ordem de
 * emissao** deles. A spec de paridade e
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 * e desta pasta sao tres dos onze cenarios:
 *
 * - **o primeiro**, que e o motivo de esta pasta existir — *"Publicar e ato
 *   explicito, e o default do codigo nao e o default do DDL"*: *"as duas gravam o
 *   status `draft`"*, *"uma linha inserida diretamente na tabela, sem informar o
 *   status, recebe `publish`"*, *"e a divergencia entre os dois defaults e
 *   identica nas duas metades"*;
 * - **o quarto**, que e o de T007 — *"Rascunho pode ter slug duplicado,
 *   publicado nao — e o slug muda sozinho ao publicar"*: *"as duas metades
 *   aceitam o slug duplicado"*, *"o slug resultante e identico byte a byte nas
 *   duas"* e *"a dispensa de unicidade vale tambem para pendente, rascunho
 *   automatico, revisao e solicitacao de dado pessoal"*;
 * - **o quinto**, tambem de T007 — *"Colaborador nao reserva slug do que esta em
 *   revisao"*: *"as duas metades gravam o campo de slug vazio"* e *"nenhuma das
 *   duas reserva o slug"*;
 * - *"Nenhuma transicao para publicado acontece por efeito colateral"*, na
 *   metade *"o status permanece `draft` nas duas metades"*;
 * - o ultimo, *"a ordem dos pontos de filtro na gravacao e a mesma nas duas
 *   metades"*, que e o que a suite desta pasta afirma com a sequencia dos
 *   quatro filtros deste caminho.
 *
 * **Nenhum deles e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que
 * esta pasta faz, e o que o README deste modulo manda fazer, e citar **arquivo e
 * linha** do legado em cada afirmacao, em vez de descrever comportamento de
 * memoria.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * A tabela de passos do cabecalho de `gravar.ts` tem a lista completa, com a
 * linha do legado de cada um. Em resumo, por dono:
 *
 * | o que | de quem |
 * |---|---|
 * | a comparacao de 60 segundos que troca publicado por agendado | **T013**, US-6 |
 * | a **operacao** de submeter para revisao, que poe o conteudo em `pending` — a regra do identificador vazio dela **ja esta aqui** (CA-3.4 e CA-7.4 sao a mesma linha do legado) | **T015**, US-7 |
 * | a versao anterior, que e ouvinte do ponto `post_updated` | **T021**, US-10 |
 * | o rascunho automatico criado ao abrir o editor | **T023**, US-11 |
 * | a transicao de estado e a familia `save_post` deste caminho | ninguem deste pacote emite ponto: REQ-162 esta em `do-not-rewrite.md`. Declarados em `gravar.ts`, com nome, argumentos e posicao |
 * | a categoria padrao, o `tax_input` e a recontagem de termo | BC-02 (a metade de CA-1.4 ja esta em `../publicacao/`) |
 * | o anexo: o `inherit` esta aqui, o arquivo e o contexto nao | BC-04, feature 006 |
 * | o sufixo `__trashed` e o metadado de identificador desejado | feature 005 |
 * | `sanitize_post()`, o emoji, `wp_unslash()` e `sanitize_trackback_urls()` | `plataforma/`, feature 015 — cada um com a ancora em `campos-na-gravacao.ts` |
 * | a sanitizacao do corpo (REQ-030), o formato do corpo (REQ-032) e a trilha editorial (REQ-028) | **ninguem** — `do-not-rewrite.md` e as *Perguntas em aberto* de `spec.md` |
 * | o cache de objeto | REQ-165, fora do pacote |
 *
 * ## E uma funcao do legado que esta tarefa NAO portou, de proposito
 *
 * **`wp_update_post()`** (`wp-includes/post.php:5327`) nao esta aqui. Ela nao e
 * outra regra: e uma **mistura** — le a linha, sobrepoe o pedido sobre ela e
 * chama `wp_insert_post()` (`:5390`). Tres das suas quatro decisoes proprias
 * pertencem a outras tarefas, e por isso ela nao entrou nesta:
 *
 * - `if ( 'attachment' === $postarr['post_type'] ) return wp_insert_attachment( ... )`
 *   (`:5373`) — BC-04;
 * - o descarte de `tags_input` igual as etiquetas atuais (`:5377`-`:5389`) — BC-02;
 * - o `$clear_date` dos estados de data flutuante (`:5356`-`:5363`), que decide
 *   quando a data de um rascunho e **reposta para agora** — e vizinho direto do
 *   que **T013** resolve.
 *
 * ⚠️ **Isso nao deixa CA-2.2 em aberto**, e e importante dizer por que: o
 * criterio pede que *"nao exista caminho em que a omissao publique"*, e a
 * mistura de `wp_update_post()` faz o estado chegar a `wp_insert_post()`
 * **preenchido com o valor gravado** — logo omitir o estado ali **conserva** o
 * que a linha tinha, e nunca publica o que nao estava publicado. Quem a portar
 * (T015 ou T017, que a usam para devolver conteudo ao autor) encontra a
 * resolucao de estado pronta aqui e nao precisa duplica-la.
 */

export {
  RECURSOS_DO_CORPO_VAZIO,
  type ArmazenamentoNaGravacao,
  type ColunasDaGravacao,
  type ContextoDeGravacao,
  type DatasDoSite,
  type GanchosDaGravacao,
  type PedidoDeGravacao,
  type TipoDeComentarioNaGravacao,
} from './contexto-de-gravacao.js';

export {
  vazioComoNoPhp,
  verdadeiroComoNoPhp,
  type ValorDoPedido,
} from './verdade-de-php.js';

export {
  ESTADOS_PRESERVADOS_DO_ANEXO,
  ESTADO_HERDADO_DO_ANEXO,
  TIPO_PADRAO_DA_GRAVACAO,
  resolverEstadoNaGravacao,
  resolverTipoNaGravacao,
} from './estado-na-gravacao.js';

export {
  ESTADOS_DE_DATA_FLUTUANTE,
  eDataGregorianaValida,
  resolverDataDaGravacao,
  resolverDataGmtDaGravacao,
  resolverModificacaoDaGravacao,
  type ModificacaoDaGravacao,
} from './data-na-gravacao.js';

export {
  ESTADO_DE_COMENTARIO_NA_ATUALIZACAO,
  ESTADO_PRIVADO,
  aplicarDefaultsDoPedido,
  ehAnexo,
  resolverEstadoDeComentario,
  resolverEstadoDeNotificacao,
  resolverIdentificadorNaUrl,
  resolverSenhaDoConteudo,
} from './campos-na-gravacao.js';

export {
  ESTADOS_QUE_DISPENSAM_IDENTIFICADOR,
  IDENTIFICADOR_RESERVADO_DE_INCORPORACAO,
  PRIMEIRO_SUFIXO_DO_IDENTIFICADOR,
  TAMANHO_MAXIMO_DO_IDENTIFICADOR,
  TIPO_DE_ITEM_DE_MENU,
  TIPO_DE_SOLICITACAO_DE_DADO_PESSOAL,
  identificadorUnico,
  identificadorValido,
  urldecodeComoNoPhp,
  urlencodeComoNoPhp,
  type ContextoDeSanitizacaoDeTitulo,
  type ContextoDoIdentificadorUnico,
  type GanchosDoIdentificadorUnico,
  type PedidoDeIdentificadorUnico,
  type PedidoDeIdentificadorValido,
  type ReescritaNaGravacao,
  type TextoDoIdentificador,
} from './identificador-na-url.js';

export {
  AVISO_DE_PUBLICACAO_SEM_OBJETO,
  CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO,
  ESTADO_EM_REVISAO,
  VERSAO_DO_AVISO_DE_TIPO_NAO_REGISTRADO,
  avisoDeTipoNaoRegistrado,
  capacidadesParaPublicarEsteConteudo,
  casoDePublicacaoDeConteudo,
  identificadorDeQuemNaoPodePublicar,
  podeReservarIdentificador,
  type ConteudoNaPermissaoDePublicar,
  type ContextoDaPermissaoDoIdentificador,
  type FonteDaPermissaoDePublicar,
  type PedidoDeReservaDeIdentificador,
} from './permissao-do-identificador.js';

export {
  ESTADOS_SEM_ENDERECO_SERVIDO,
  ESTADO_FINGIDO_NA_AMOSTRA,
  identificadorDeAmostra,
  type GanchosDoIdentificadorDeAmostra,
  type PedidoDeIdentificadorDeAmostra,
} from './identificador-de-amostra.js';

export {
  ERROS_DA_GRAVACAO,
  ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
  gravarConteudo,
  identificadorMudouNaGravacao,
  type DesfechoDaGravacao,
  type ErroDaGravacao,
  type ResultadoDaGravacao,
} from './gravar.js';
