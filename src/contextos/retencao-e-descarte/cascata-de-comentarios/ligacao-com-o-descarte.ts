/**
 * A ligacao que T003 deixou declarada e nao preenchida: o passo 11 de
 * `wp_trash_post()` apontando para a cascata desta tarefa.
 *
 * Entrega de **T005**. `contexto-de-descarte.ts` fechou com a frase *"ligar a
 * cascata e trocar este campo na composicao; **a posicao da chamada nao
 * muda**"*, e e isto que este arquivo faz — nada mais.
 *
 * Existe em lugar de a composicao escrever a lambda a mao por uma razao que e do
 * legado: **o retorno e descartado**, e descartar retorno de proposito merece
 * estar escrito uma vez, com a linha, em vez de reaparecer como um `void` solto
 * em cada composicao. `wp_trash_post_comments()` devolve `int|false|null` e a
 * linha que a chama nao olha o valor (`wp-includes/post.php:4142`): **nenhum
 * ramo do descarte depende do que aconteceu com os comentarios**. Conteudo sem
 * comentario nenhum, cascata que devolveu `null`, `UPDATE` que afetou zero
 * linhas — o descarte segue igual nos tres.
 */

import type { SuspensaoDeComentariosNoDescarte } from '../descarte/index.js';
import type { ContextoDaCascataDeComentarios } from './contexto-da-cascata.js';
import { suspenderComentariosDoConteudo } from './suspender-comentarios.js';

/**
 * A cascata de US-2 na forma que o contexto de US-1 pede.
 *
 * O contexto da cascata chega por argumento, como todo contexto deste modulo
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): esta funcao nao guarda nada e nao resolve
 * nada no carregamento.
 */
export function cascataNoDescarte(
  contexto: ContextoDaCascataDeComentarios,
): SuspensaoDeComentariosNoDescarte {
  return (conteudoId) => {
    // O retorno morre aqui, como no legado. Ver o cabecalho.
    suspenderComentariosDoConteudo(contexto, conteudoId);
  };
}
