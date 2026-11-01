/**
 * A cascata de US-2 no passo 12 de `wp_untrash_post()`, a gemea de
 * `ligacao-com-o-descarte.ts`.
 *
 * Entrega de **T007**. `wp_untrash_post_comments()` devolve `true|null` e a linha
 * que a chama nao olha o valor (`wp-includes/post.php:4242`): nenhum ramo da
 * restauracao depende do que aconteceu com os comentarios.
 */

import type { RestauracaoDeComentariosNaRestauracao } from '../restauracao/index.js';
import type { ContextoDaCascataDeComentarios } from './contexto-da-cascata.js';
import { restaurarComentariosDoConteudo } from './restaurar-comentarios.js';

/** A cascata de US-2 na forma que o contexto de US-3 pede. */
export function cascataNaRestauracao(
  contexto: ContextoDaCascataDeComentarios,
): RestauracaoDeComentariosNaRestauracao {
  return (conteudoId) => {
    // O retorno morre aqui, como no legado.
    restaurarComentariosDoConteudo(contexto, conteudoId);
  };
}
