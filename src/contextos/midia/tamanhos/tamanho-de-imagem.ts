/**
 * A forma de um tamanho de imagem registrado.
 *
 * E a forma normalizada que `wp_get_registered_image_subsizes()` devolve
 * (`wp-includes/media.php:930`): tres campos, `width`, `height` e `crop`, e nada
 * mais. Preservar os tres juntos importa porque `crop` nao e booleano por
 * acidente — ele aceita tambem o par de posicoes, e e por ele que uma extensao
 * registra tamanho recortado fora do centro.
 *
 * **Dois fatos do legado que esta forma carrega, e que nenhuma tarefa deste no
 * implementa:**
 *
 * - **Altura `0` e valor valido, nao ausencia.** `medium_large` nasce com
 *   `768x0` (`wp-admin/includes/schema.php:532-533`), e o `0` significa "a
 *   largura manda". Trocar o `0` por `null` ou por `undefined` nesta forma
 *   mudaria o que a porta de dados grava e o que o metadado da derivada guarda.
 * - **Tamanho com largura `0` E altura `0` e saltado**, com o comentario *"This
 *   size isn't set"* (`wp-includes/media.php:955`). Isso e **regra de quem gera
 *   as derivadas** (T007), nao desta forma: aqui o par `0, 0` e representavel,
 *   como e no legado.
 */

import type { Recorte } from '../portas/porta-de-processamento-de-imagem.js';

export type {
  PosicaoHorizontalDeRecorte,
  PosicaoVerticalDeRecorte,
  Recorte,
} from '../portas/porta-de-processamento-de-imagem.js';

export interface TamanhoDeImagem {
  /** Largura em pixel. `0` significa "a altura manda". */
  readonly largura: number;
  /** Altura em pixel. `0` significa "a largura manda". */
  readonly altura: number;
  readonly recorte: Recorte;
}
