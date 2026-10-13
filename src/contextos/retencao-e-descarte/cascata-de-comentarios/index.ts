/**
 * `cascata-de-comentarios/` — a area de comportamento da **suspensao dos
 * comentarios do conteudo descartado, com o estado de cada um** (US-2).
 *
 * Entrega de **T005**: *"o comportamento de US-2 existe e os criterios CA-2.1,
 * CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo"*
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * ── POR QUE ESTA AREA E SEPARADA DE `descarte/` ─────────────────────────────
 *
 * Porque as duas operacoes daqui tem **chamadores diferentes em historias
 * diferentes** e nao tem portao de capacidade nenhum. A suspensao e chamada por
 * `wp_trash_post()` (US-1, em `descarte/`) e a restauracao por
 * `wp_untrash_post()` (US-3, T007, que ainda nao existe) — e as duas sao funcoes
 * **publicadas** do nucleo, chamaveis direto por extensao, por
 * `wp_delete_post()` e pelas superficies. Meter a cascata dentro de `descarte/`
 * amarraria a metade de restauracao a uma pasta em que o chamador dela nao mora.
 *
 * | arquivo | o que e | criterio |
 * |---|---|---|
 * | `suspender-comentarios.ts` | `wp_trash_post_comments()`, os oito passos na ordem | CA-2.1, CA-2.2 |
 * | `restaurar-comentarios.ts` | `wp_untrash_post_comments()`, os oito passos na ordem | CA-2.3 |
 * | `estado-de-suspensao.ts` | `post-trashed`, e o vocabulario que a API de estado aceita | CA-2.4 |
 * | `contexto-da-cascata.ts` | o que chega por argumento, e a **ausencia** de capacidade como declaracao | — |
 * | `ligacao-com-o-descarte.ts` | o passo 11 de `wp_trash_post()`, preenchido | — |
 * | `us-2-suspender-comentarios.test.ts` | os quatro criterios, e a sequencia de comandos | — |
 *
 * **O que esta area nao tem:** a restauracao do **conteudo** (T007, US-3 — ela
 * chama `restaurarComentariosDoConteudo` na posicao de `:4242`), a coleta do que
 * venceu (T011), que apaga comentario descartado **por si** e nao suspenso em
 * cascata, e a operacao de moderacao `wp_set_comment_status()`, que e de BC-03 /
 * feature `007` — ver a caixa de `estado-de-suspensao.ts`.
 */

export {
  suspenderComentariosDoConteudo,
  type DesfechoDaSuspensao,
  type ResultadoDaSuspensao,
} from './suspender-comentarios.js';

export {
  restaurarComentariosDoConteudo,
  type DesfechoDaRestauracao,
  type LoteDaRestauracao,
  type ResultadoDaRestauracao,
} from './restaurar-comentarios.js';

export {
  ESTADO_DA_FILA_DE_MODERACAO,
  ESTADO_DE_SUSPENSAO_EM_CASCATA,
  VOCABULARIO_DA_API_DE_ESTADO,
  alcancavelPelaApiDeEstado,
  estadoAceitoPelaApiDeEstado,
} from './estado-de-suspensao.js';

export type {
  ArmazenamentoNaCascata,
  ContextoDaCascataDeComentarios,
  GanchosDaCascata,
  LeituraDeConteudoNaCascata,
} from './contexto-da-cascata.js';

export { cascataNoDescarte } from './ligacao-com-o-descarte.js';
