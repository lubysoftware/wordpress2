/**
 * `revisao/` — entregar o proprio texto para que alguem com poder de publicar o
 * avalie.
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao` (US-7), e e
 * [UC-06](../../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md)
 * menos o que pertence a outras historias (ver a lista no fim).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-revisao.ts` | o contexto, os **quatro** colaboradores que esta tarefa acrescenta e os **dois** pontos de extensao dela |
 * | `estado-na-submissao.ts` | **CA-7.1** e **CA-7.5**: os cinco passos da resolucao de estado, e o rebaixamento que T003 registrou e nao portou |
 * | `permissao-de-revisao.ts` | **CA-7.1** e **CA-7.6**: as tres perguntas de capacidade, e por que a falta de `publish_posts` nao recusa nada |
 * | `fila-de-revisao.ts` | **CA-7.2**: as quatro decisoes da fila do painel, e o portao que e `edit_posts` e nao `publish_posts` |
 * | `submeter-para-revisao.ts` | a operacao e `wp_update_post()` — as duas, e a razao de serem duas |
 * | `us-7-submeter-para-revisao.test.ts` | os seis criterios, afirmados por efeito no banco, por variavel de consulta e por decisao de capacidade |
 *
 * ---
 *
 * # Os seis criterios, e onde cada um se cumpre
 *
 * | criterio | o que o cumpre | ancora no legado |
 * |---|---|---|
 * | **CA-7.1** *quem escreve e nao publica envia para pendente* | {@link resolverEstadoDaSubmissao}, passo 4 — o rebaixamento | `wp-admin/includes/post.php:152`-`:159` |
 * | **CA-7.2** *o pendente aparece na fila de quem pode publicar aquele tipo* | {@link filaDeRevisao}, com o portao da tela e as variaveis de consulta | `wp-admin/edit.php:44`, `wp-admin/includes/post.php:1239` |
 * | **CA-7.3** *o pendente nao aparece em consulta publica alguma* | **a condicao**, e nao codigo novo: o estado gravado e `pending`, e o registro dele declara `public => false` e `publicly_queryable => false` | `wp-includes/post.php:704`, e `../estado-editorial.ts` |
 * | **CA-7.4** *quem nao pode publicar nao reserva endereco* | **ja estava em T007**: `identificadorDeQuemNaoPodePublicar()`. CA-3.4 e CA-7.4 sao a mesma linha | `wp-includes/post.php:4731`-`:4739` |
 * | **CA-7.5** *quem pode publicar e submete mantem o identificador* | a **mesma** linha, pelo outro ramo: a capacidade existe, o campo passa | `wp-includes/post.php:4736` |
 * | **CA-7.6** *ler o pendente alheio exige poder edita-lo* | {@link autorizarLeituraEmRevisao}, sobre o `case 'read_post'` da plataforma | `wp-includes/capabilities.php:369`-`:380` |
 *
 * ⚠️ **CA-7.3 nao se cumpre com codigo novo aqui, e nem poderia** — mesmo
 * precedente de CA-2.3 em T005, registrado em
 * `../gravacao/estado-na-gravacao.ts`. Quem filtra `post_status` na consulta
 * publica e `WP_Query`, que e **T009 da feature 004**
 * (`contextos/leitura-publica/`), e esta tarefa nao tem consulta publica para
 * alterar. O que ela entrega e a condicao do criterio, e ela esta afirmada por
 * teste.
 *
 * **As tres ancoras que `spec.md` da para US-7 sao estas:**
 * `wp-includes/post.php:4731`, `wp-includes/post.php:5561` e
 * `wp-includes/capabilities.php:369` — e as tres **ja estavam na arvore** quando
 * esta tarefa comecou: as duas primeiras sao de T007 (o identificador vazio e a
 * dispensa de unicidade em `pending`) e a terceira e de T017 da feature 001 (o
 * `case 'read_post'`). O que faltava era a **operacao**, que e o que o README
 * deste modulo reservou a esta tarefa em tres lugares diferentes, e e o que
 * `plan.md` lista na tabela *Contratos*: *"submeter para revisao | identificador
 * | conteudo pendente, com o identificador na URL esvaziado quando quem submete
 * nao pode publicar | sem permissao de editar"*.
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2), somado ao
 * **valor devolvido pelo ponto de extensao, byte a byte**, e a **ordem de
 * emissao** deles. A spec de paridade e
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 * e desta pasta e **o quinto cenario**, que descreve esta operacao palavra por
 * palavra:
 *
 * > **Cenario: Colaborador nao reserva slug do que esta em revisao**
 * > Dado um ator sem a capacidade de publicar
 * > Quando ele **submete um conteudo para revisao informando um slug**
 * > Entao as duas metades gravam o campo de slug vazio
 * > E nenhuma das duas reserva o slug
 *
 * T007 ja tinha as duas afirmacoes do **efeito**; o que faltava era o **Quando**
 * — a operacao de submeter. Com esta tarefa o cenario tem as duas metades no
 * sistema novo, e esta afirmado em `us-7-submeter-para-revisao.test.ts` pelo
 * valor que foi para a coluna.
 *
 * **Nenhum cenario e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que
 * esta pasta faz, e o que o README deste modulo manda fazer, e citar **arquivo e
 * linha** do legado em cada afirmacao, em vez de descrever comportamento de
 * memoria.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | os oito testes de `backlog/tests.md` (UT-025-1 a UT-025-8) | **T016**, a tarefa `[P]` que roda em paralelo com esta |
 * | devolver o conteudo ao autor, que e o caminho de volta de UC-06 | **T017** (US-8, CA-8.4). `atualizarConteudo` esta exportada para ela |
 * | o aviso ao autor quando o conteudo e devolvido ou publicado | **T019** (US-9) — e a parada registrada sobre ele esta em `../portas/porta-de-email.ts` |
 * | a visibilidade privada, que e o outro ramo do rebaixamento | **T009** (US-4) |
 * | a comparacao de 60 segundos de `publish` ⇄ `future` | **T013** (US-6). A lista `['publish','future']` desta pasta e a do rebaixamento, e esta nomeada para ela |
 * | o rascunho automatico que o editor cria ao abrir a tela | **T023** (US-11). Esta operacao nao o cria, e **apaga o estado dele** do pedido, como o legado |
 * | a versao anterior do conteudo submetido | **T021** (US-10): e ouvinte do ponto `post_updated`, que esta pasta nao emite |
 * | `sanitize_key()` | `plataforma/formatacao/`, feature 015 — chega pelo colaborador `ChaveSanitizada` |
 * | `WP_Query`, que materializa a fila | **T009 da feature 004** — chega pelo colaborador `ConsultaDeConteudo` |
 * | a opcao de paginacao por conta e a tela da listagem | `plataforma/opcoes/` e BC-10 (`painel/`) |
 * | registrar quem decidiu a transicao | **ninguem**: REQ-028 esta em `do-not-rewrite.md` |
 * | a sanitizacao do corpo (REQ-030) e o formato dele (REQ-032) | **ninguem** — e esta operacao nao grava corpo que o pedido nao traga |
 * | emitir ponto de extensao por um barramento | ninguem deste pacote: REQ-162 esta em `do-not-rewrite.md`. Os dois desta pasta chegam como interceptador opcional, e ponto sem interceptador e, no legado, um no-op |
 * | invalidar cache | nao ha cache nesta arvore (REQ-165 ficou fora do pacote) |
 */

export {
  type ConsultaDeConteudo,
  type ContextoDeRevisao,
  type GanchosDaRevisao,
  type VariaveisDaConsultaDeConteudo,
} from './contexto-de-revisao.js';

export {
  ESTADOS_PUBLICADOS_NA_SUBMISSAO,
  ESTADO_DE_COMENTARIO_NA_SUBMISSAO,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  estadoDeComentarioNaSubmissao,
  estadoPedidoPelosBotoes,
  estadoSanitizadoDoPedido,
  resolverEstadoDaSubmissao,
  senhaNaSubmissao,
  type BotoesDoEditor,
  type ChaveSanitizada,
  type EstadoDaSubmissao,
  type PedidoDoEstadoNaSubmissao,
} from './estado-na-submissao.js';

export {
  CAPACIDADE_DE_EDITAR_ALHEIO,
  CAPACIDADE_DE_EDITAR_ESTE_CONTEUDO,
  CAPACIDADE_DE_LER_ESTE_CONTEUDO,
  CODIGO_DE_CONTEUDO_INEXISTENTE,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA,
  CODIGO_DE_RECUSA_DE_EDICAO,
  CODIGO_DE_RECUSA_DE_LEITURA,
  MENSAGEM_DE_CONTEUDO_INEXISTENTE,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA,
  MENSAGEM_DE_RECUSA_DE_EDICAO,
  MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
  MENSAGEM_DE_RECUSA_DE_LEITURA,
  TIPO_DE_PAGINA,
  autorizarAutoriaDaSubmissao,
  autorizarLeituraEmRevisao,
  autorizarSubmissao,
  podeEditarEsteConteudo,
  podePublicarEsteTipo,
  type CodigoDeRecusaDaRevisao,
  type RecusaDaRevisao,
} from './permissao-de-revisao.js';

export {
  CAMPOS_HIERARQUICOS_DA_FILA,
  CAPACIDADE_DE_EDITAR_CONTEUDOS,
  ITENS_POR_PAGINA_DA_FILA,
  MENSAGEM_DE_RECUSA_DA_FILA,
  ORDEM_DA_FILA_DE_REVISAO,
  ORDEM_HIERARQUICA_DA_FILA,
  ORDENACAO_DA_FILA_DE_REVISAO,
  ORDENACAO_HIERARQUICA_DA_FILA,
  PERMISSAO_DE_LEITURA_DA_FILA,
  PONTO_DE_ITENS_POR_PAGINA,
  PREFIXO_DA_CHAVE_DE_PAGINACAO,
  SEM_PAGINACAO_NA_FILA,
  SUFIXO_DA_CHAVE_DE_PAGINACAO,
  TIPO_PADRAO_DA_FILA,
  TITULO_DE_RECUSA_DA_FILA,
  filaDeRevisao,
  itensPorPaginaDaFila,
  tipoDaFilaDeRevisao,
  variaveisDaFilaDeRevisao,
  type PedidoDaFilaDeRevisao,
  type RecusaDaFilaDeRevisao,
  type ResultadoDaFilaDeRevisao,
} from './fila-de-revisao.js';

export {
  ESTADO_DESCARTADO_NA_EDICAO,
  atualizarConteudo,
  autorDaSubmissao,
  submeterParaRevisao,
  type DesfechoDaSubmissao,
  type PedidoDeSubmissao,
  type ResultadoDaSubmissao,
} from './submeter-para-revisao.js';
