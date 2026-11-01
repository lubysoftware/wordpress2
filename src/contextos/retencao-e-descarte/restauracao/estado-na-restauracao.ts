/**
 * **CA-3.1, CA-3.2 e CA-3.4**: o estado com que o conteudo sai da lixeira.
 *
 * Entrega de **T007** da feature `005-retencao-e-descarte` (US-3). E a regra `R2`
 * / BR-MIGRAR-031 inteira, e ela cabe numa linha do legado
 * (`wp-includes/post.php:4209`):
 *
 * ```php
 * $new_status = ( 'attachment' === $post->post_type ) ? 'inherit' : 'draft';
 * ```
 *
 * ⚠️ **A memoria nao entra nesta conta.** `_wp_trash_meta_status` esta gravado, a
 * funcao o leu tres linhas antes (`:4181`) e ainda assim o default ignora o valor:
 * desde a 5.6 o conteudo publicado volta **invisivel** (`:4162`, `:4218`, ADR
 * 0004). E o risco 4 de `plan.md`: um porte "melhorado" que devolva o estado
 * anterior republica sem revisao e rompe a paridade.
 *
 * ── O ANEXO ─────────────────────────────────────────────────────────────────
 *
 * **CA-3.2** nao e uma segunda regra de restauracao: `inherit` nao e visibilidade,
 * e a **ausencia** dela. Quem resolve o que o anexo mostra e a leitura, em
 * `get_post_status()` (`:1290`), que devolve o estado do pai
 * (`:1322`). Nada aqui copia estado do pai, e copiar seria divergir: o anexo tem
 * de continuar acompanhando o pai depois de restaurado. Essa leitura e de BC-01.
 *
 * ── O CAMINHO QUE VOLTA AO ESTADO ANTERIOR ──────────────────────────────────
 *
 * {@link estadoAnteriorNaRestauracao} e `wp_untrash_post_set_previous_status()`
 * (`:8762`), funcao publicada (P8) e o proprio docblock de `:4215` a oferece. Nao
 * e so para extensao: **a acao "Desfazer" do aviso de descarte a usa**.
 * `wp-admin/edit.php:151` a pendura em `wp_untrash_post_status` quando
 * `doaction=undo` e a retira em `:167`, logo desfazer um descarte devolve o estado
 * anterior e restaurar pela lixeira devolve rascunho. As duas sao a mesma funcao
 * (`:4168`) com filtros diferentes, e CA-3.1 descreve o default.
 *
 * ⚠️ `upload.php:312` nao faz isso, embora o link de la tambem leve
 * `doaction=undo` (`wp-admin/upload.php:90`): o anexo "desfeito" volta `inherit`.
 */

import { TIPO_DE_ANEXO } from '../exclusao/index.js';

/** `draft` — o default de `R2` (`wp-includes/post.php:4209`). */
export const ESTADO_DE_RASCUNHO = 'draft';

/** `inherit` — o estado de quem nao tem visibilidade propria (`:4209`). */
export const ESTADO_HERDADO = 'inherit';

/**
 * O default de `$new_status` (`wp-includes/post.php:4209`), **antes** do filtro
 * `wp_untrash_post_status`.
 *
 * Recebe o **tipo** e nada mais: e a forma de afirmar que o estado anterior nao
 * participa da decisao.
 */
export function estadoPadraoDaRestauracao(tipo: string): string {
  return tipo === TIPO_DE_ANEXO ? ESTADO_HERDADO : ESTADO_DE_RASCUNHO;
}

/**
 * `wp_untrash_post_set_previous_status()` (`wp-includes/post.php:8762`): o
 * interceptador pronto para `wp_untrash_post_status`, com a assinatura do filtro.
 *
 * Marcador ausente chega aqui como texto vazio, e a gravacao o resolve: `:4703`
 * troca `post_status` vazio por `draft`.
 */
export function estadoAnteriorNaRestauracao(
  _novoEstado: string,
  _conteudoId: number,
  estadoAnterior: string,
): string {
  return estadoAnterior;
}
