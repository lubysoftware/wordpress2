/**
 * O contexto da lista de origens responsivas: tudo que US-6 precisa e que
 * **nao e** regra desta pasta.
 *
 * Entrega de **T013** da feature `006-biblioteca-de-midia` (US-6). Mesma forma
 * e mesmas razoes de `../derivadas/contexto-de-derivadas.ts`: contexto por
 * argumento, nao estado de modulo (AD-02, `EXT-CONTEXTO`, BR-MIGRAR-105) —
 * cifra e `Host:` da requisicao sao escopo de REQUISICAO, e o teto e
 * configuravel por interceptador, que tambem e estado de requisicao.
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `wp_get_upload_dir()['baseurl']` (`wp-includes/functions.php:2355`) | URL da area de envios — **nao e fato de sistema de arquivos**, como `../envio/area-de-envios.ts` ja registrou | {@link ContextoDeOrigensResponsivas.enderecoBaseDeEnvios} |
 * | `is_ssl()` (`wp-includes/load.php:1659`) | requisicao | {@link RequisicaoNasOrigens.cifrada} |
 * | `$_SERVER['HTTP_HOST']` (`wp-includes/media.php:1520`) | requisicao | {@link RequisicaoNasOrigens.host} |
 * | `apply_filters( 'max_srcset_image_width', 2048, $size_array )` (`wp-includes/media.php:1545`) | interceptador | {@link ContextoDeOrigensResponsivas.filtrosDoTeto} |
 *
 * **Nenhuma porta.** `wp_calculate_image_srcset()` nao consulta banco, nao
 * toca disco e nao abre imagem: o metadado chega pronto no pedido, como no
 * legado, onde quem o le e o chamador (`wp_get_attachment_metadata()` em
 * `wp-includes/media.php:1415` e `:1237`).
 */

/** O ponto de filtro `max_srcset_image_width` (`wp-includes/media.php:1545`). */
export type FiltroDoTetoDeOrigens = (
  teto: number | false,
  dimensoes: readonly [number, number],
) => number | false;

/** O recorte da requisicao que a lista de origens le. */
export interface RequisicaoNasOrigens {
  /** `is_ssl()`. */
  readonly cifrada: boolean;
  /**
   * `$_SERVER['HTTP_HOST']`, com a porta quando o cliente a mandou.
   *
   * Omitido e o `! isset()` da execucao sem servidor: a comparacao de
   * `media.php:1520` e `===` contra cadeia, e falha.
   */
  readonly host?: string;
}

/** O contexto da lista de origens responsivas. */
export interface ContextoDeOrigensResponsivas {
  /** `$upload_dir['baseurl']` — o endereco publico da raiz da area de envios. */
  readonly enderecoBaseDeEnvios: string;
  readonly requisicao: RequisicaoNasOrigens;
  /**
   * `max_srcset_image_width`, na ordem em que os interceptadores foram dados,
   * cada um sobre o que o anterior devolveu.
   *
   * E **o** ponto de configuracao do teto (CA-6.2): o legado nao tem opcao nem
   * constante para ele. Omitido, vale o `2048` do legado (`M3`).
   */
  readonly filtrosDoTeto?: readonly FiltroDoTetoDeOrigens[];
}
