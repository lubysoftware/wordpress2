/**
 * **CA-8.2**: a autoria original gravada no registro sobrevive a revisao e a
 * publicacao feitas por outra pessoa.
 *
 * Entrega de **T017** da feature `002-autoria-e-publicacao` (US-8). E o passo 6
 * de UC-07 — *"Sistema mantem o autor original no registro"* — e a pos-condicao
 * dele: *"o conteudo esta publicado com o autor original preservado"*.
 *
 * ---
 *
 * # A autoria nao e preservada por um `if`: ela e preservada por DOIS mecanismos
 *
 * Nao existe, no legado, uma linha que diga *"ao publicar, conserve o autor"*. O
 * autor original sobrevive porque **duas** coisas acontecem ao mesmo tempo, e as
 * duas estao reproduzidas nesta arvore:
 *
 * | # | mecanismo | ancora | onde esta aqui |
 * |---|---|---|---|
 * | 1 | **a mistura** de `wp_update_post()`: `array_merge( $post, $postarr )`, com o pedido vencendo a linha **chave por chave**. Chave ausente conserva o valor gravado | `wp-includes/post.php:5367` | `../revisao/submeter-para-revisao.ts`, em `atualizarConteudo()` (T015) |
 * | 2 | **a superficie devolve o autor da linha** antes de traduzir o pedido | `wp-admin/includes/post.php:691`-`:695` · `wp-admin/edit-form-advanced.php:491` | {@link autorNaRevisaoEditorial} |
 *
 * O mecanismo 1, sozinho, basta para a **API REST**: la o autor so entra no
 * pedido quando o cliente o envia (`! empty( $request['author'] )`,
 * `class-wp-rest-posts-controller.php:1393`-`:1410`), logo a chave **ausente**
 * atravessa a mistura e a coluna conserva o que tinha.
 *
 * O mecanismo 1, sozinho, **nao** basta para o painel, e e aqui que esta o
 * cuidado desta tarefa: `_wp_translate_postdata()` **sempre** devolve
 * `post_author` preenchido, e o ultimo dos tres ramos dela e
 * `(int) $post_data['user_ID']`, isto e, `get_current_user_id()`
 * (`wp-admin/includes/post.php:85`). Um pedido que chegasse a essa funcao **sem**
 * o campo sairia dela com o autor trocado por quem esta revisando — e a mistura
 * entao **gravaria** a troca, porque o pedido vence a linha.
 *
 * ---
 *
 * # O ramo 3 e codigo do legado, nao inferencia desta tarefa
 *
 * T015 portou os tres ramos de `_wp_translate_postdata()` tal e qual, em
 * `autorDaSubmissao()`, e deixou o aviso enderecado a esta tarefa: *"**CA-8.2**
 * passa por essa linha: quem pegar T017 precisa dele"*. O ramo que importa aqui
 * e o terceiro, e {@link autorNaRevisaoEditorial} o resolve pelo **autor da
 * linha** — porque e isso que o legado faz, na mesma funcao, logo acima:
 *
 * ```php
 * // bulk_edit_posts(), wp-admin/includes/post.php:691-:695
 * foreach ( array( 'comment_status', 'ping_status', 'post_author' ) as $field ) {
 *     if ( ! isset( $post_data[ $field ] ) ) {
 *         $post_data[ $field ] = $post->$field;
 *     }
 * }
 * $post_data = _wp_translate_postdata( true, $post_data );
 * ```
 *
 * Isto e: **a superficie de edicao em lote repoe o autor a partir da linha antes
 * de traduzir**, exatamente para que o ramo do ator nao seja alcancado. A
 * superficie de edicao de um so conteudo chega ao mesmo resultado por outro
 * caminho — manda o campo pronto:
 *
 * - o editor classico, como campo oculto:
 *   `<input type="hidden" id="post_author" name="post_author" value="<?php echo
 *   esc_attr( $post->post_author ); ?>" />` (`edit-form-advanced.php:491`);
 * - a edicao rapida da listagem, com o mesmo valor
 *   (`class-wp-posts-list-table.php:2226`);
 * - e o **seletor** de autor, que so e renderizado para quem tem
 *   `edit_others_posts` (`meta-boxes.php:1678`), chega
 *   `'selected' => $post->post_author` (`:974`) — quem pode trocar o autor
 *   recebe o autor **atual** pre-selecionado.
 *
 * Nenhuma superficie do sistema analisado, portanto, leva o ramo do ator a
 * decidir a autoria de um conteudo que **ja existe**: duas o preenchem com o
 * valor da linha e uma o omite. Reproduzir o ramo do ator aqui reproduziria um
 * chamador que o legado nao tem, e faria CA-8.2 e o passo 6 de UC-07 falharem
 * numa operacao em que o legado os cumpre.
 *
 * ⚠️ **O ramo do ator continua portado, e continua alcancavel por quem o legado
 * deixa alcanca-lo**: `autorDaSubmissao()` de `../revisao/` nao foi tocada por
 * esta tarefa, e e ela que `submeterParaRevisao()` usa — onde o efeito e nenhum,
 * porque quem submete conteudo proprio ja e o autor da linha.
 *
 * ⚠️ **Dos tres campos que `:691`-`:695` repoe, so o autor entra aqui**, e a
 * diferenca e do legado: `edit_post()` **nao** tem essa reposicao, e para ele
 * `comment_status` e `ping_status` ausentes viram `closed` (`:169`-`:175`), nao o
 * valor da linha. T015 portou esse par com o achado — *"submeter pelo painel sem
 * o campo de discussao FECHA os comentarios"* —, e esta tarefa nao o altera: a
 * reposicao de `:691`-`:695` e da edicao em lote, e dela esta operacao usa a
 * unica parte que as duas superficies de um so conteudo tambem produzem.
 *
 * ---
 *
 * # O que esta funcao NAO faz
 *
 * - **nao valida o autor informado.** O painel nao valida: `(int)` sobre o campo
 *   e nada mais (`:80` e `:83`), logo identificador de conta que nao existe e
 *   gravado na coluna, e a relacao fica **orfa** — que e o **P5** da
 *   constituicao e a resposta 2: *"a ausencia de chave estrangeira e
 *   comportamento do produto, nao defeito de dado"*. Quem valida e a **API**, e
 *   so ela: `get_userdata()` e `rest_invalid_author` com 400 (`:1398`-`:1406`),
 *   que e superficie de BC-09;
 * - **nao decide quem pode trocar o autor.** Isso e o portao de autoria alheia,
 *   em `../revisao/permissao-de-revisao.ts` (`autorizarAutoriaDaSubmissao`), e
 *   ele compara o autor **que o pedido carrega** com o ator — nao o da linha;
 * - **nao grava nada.** Devolve numero; quem grava e a mistura, pela porta de
 *   dados de T002.
 */

import type { Conteudo } from '../armazenamento/index.js';

/** Os dois campos de autoria que o formulario de revisao carrega. */
export interface AutoriaPedidaNaRevisao {
  /**
   * `post_author_override` (`wp-admin/includes/post.php:79`-`:80`).
   *
   * O seletor de autor, que o painel so renderiza para quem tem
   * `edit_others_posts` (`meta-boxes.php:1678`). A pergunta do legado e
   * `! empty()`, logo `0` e ausencia.
   */
  readonly autorEscolhido?: number;

  /**
   * `post_author` (`:82`-`:83`).
   *
   * O campo oculto que o editor envia com o autor **gravado**
   * (`edit-form-advanced.php:491`). `! empty()` tambem aqui: `0` cai para o
   * ramo seguinte.
   */
  readonly autorDoPedido?: number;
}

/**
 * **CA-8.2**: o autor que a revisao leva a coluna.
 *
 * Os tres ramos, na ordem do legado:
 *
 * | # | ramo | ancora |
 * |---|---|---|
 * | 1 | `post_author_override`, o seletor de autor | `wp-admin/includes/post.php:79`-`:80` |
 * | 2 | `post_author`, o campo que a tela preenche com o autor da linha | `:82`-`:83` · `edit-form-advanced.php:491` |
 * | 3 | **o autor da linha**, quando o campo nao vem | `:691`-`:695` |
 *
 * Os dois primeiros sao `! empty()` no legado, logo `0` **nao** e uma escolha: e
 * ausencia, e cai para o ramo seguinte. `undefined` e a mesma ausencia, pela
 * decisao ja declarada em `PedidoDeGravacao` de `../gravacao/` (*"`null` e
 * ausencia aqui, e isso e fidelidade"*).
 */
export function autorNaRevisaoEditorial(
  autoria: AutoriaPedidaNaRevisao,
  anterior: Conteudo,
): number {
  // Ramo 1 (`:79`-`:80`): `! empty( $post_data['post_author_override'] )`.
  const escolhido = autoria.autorEscolhido;
  if (escolhido !== undefined && escolhido !== 0) {
    return escolhido;
  }

  // Ramo 2 (`:82`-`:83`): `! empty( $post_data['post_author'] )`.
  const doPedido = autoria.autorDoPedido;
  if (doPedido !== undefined && doPedido !== 0) {
    return doPedido;
  }

  // Ramo 3 (`:691`-`:695`): `if ( ! isset( $post_data['post_author'] ) ) {
  // $post_data['post_author'] = $post->post_author; }`. Ver o cabecalho.
  return anterior.autorId;
}

/**
 * Se a autoria gravada depois da operacao e a mesma de antes dela — a leitura de
 * CA-8.2 *"a publicacao mantem o autor original gravado no registro"*.
 *
 * **Nao e dado gravado e nao existe no legado**: e leitura do que acabou de
 * acontecer, no mesmo desenho — e pela mesma razao — de
 * `identificadorMudouNaGravacao()` em `../gravacao/gravar.ts` e do `rebaixado`
 * de `../revisao/estado-na-submissao.ts`. O **P6** e literal sobre isto: *"onde
 * o legado nao tem numero, o sistema novo tambem nao tem"*, e um sinalizador
 * gravado seria coluna que o produto nao tem.
 *
 * Devolve `false` quando o autor foi trocado **de proposito**, pelo seletor de
 * autor do ramo 1 — e isso **nao** e CA-8.2 falhando: a pergunta e sobre a
 * coluna, e trocar o autor e o que aquele seletor existe para fazer, para quem
 * tem `edit_others_posts`. Quem precisa distinguir *"nao mudou"* de *"nao foi
 * pedido que mudasse"* compara {@link autorNaRevisaoEditorial} com o autor da
 * linha antes de chamar a operacao.
 */
export function autoriaPreservada(
  anterior: Conteudo,
  autorGravado: number,
): boolean {
  return anterior.autorId === autorGravado;
}
