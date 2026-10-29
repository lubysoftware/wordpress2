/**
 * Os numeros e a opcao de fabrica do mapa do site, cada um no seu ponto.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7, *"servir o
 * indice de sitemap conforme a opcao de indexacao"*). Satisfaz a metade
 * *"declarada"* de **CA-7.5** (*"o indice pagina os provedores, e o tamanho de
 * pagina e declarado"*) e a regra de negocio de **UT-145-7** (*"`blog_public`
 * nasce ligado"*).
 *
 * O **P6** da constituicao manda cada numero de fabrica viver num ponto de
 * configuracao nomeado, e a tabela *Nao negociavel* proibe inventar numero que o
 * legado nao tem. Os tres abaixo **o legado tem**, cada um no seu lugar:
 *
 * | ponto | valor | ancora | ponto de extensao |
 * |---|---|---|---|
 * | `blog_public` | `'1'` | `wp-admin/includes/schema.php:474` | (a opcao; e `wp_sitemaps_enabled`, `class-wp-sitemaps.php:104`) |
 * | enderecos por pagina do mapa | `2000` | `wp-includes/sitemaps.php:90` | `wp_sitemaps_max_urls`, com o tipo de objeto |
 * | paginas do mapa no indice | `50000` | `wp-includes/sitemaps/class-wp-sitemaps-index.php:35` | **nenhum**: `private $max_sitemaps` |
 *
 * ⚠️ A `spec.md` e o card citam `schema.php:416` para `blog_public`; nesta
 * arvore 7.1.2 a linha e `:474` (`:416` e o comeco do vetor `$defaults`).
 *
 * Os dois limites **nao sao o mesmo numero em dois lugares**: o primeiro e o
 * tamanho de cada pagina de cada provedor, e o segundo corta o indice inteiro.
 * O segundo nao e filtravel, e o primeiro recebe o tipo de objeto (`post`,
 * `term`, `user`), logo uma extensao pode dar tamanho diferente a cada
 * provedor. O barramento de ganchos nao tem tarefa neste pacote (REQ-162 esta em
 * `do-not-rewrite.md`), e `wp_sitemaps_max_urls` fica **declarado** aqui, no
 * ponto que o emitiria.
 */

/** `blog_public`: o nome da opcao e o valor com que a instalacao a semeia. */
export const OPCAO_DE_INDEXACAO = {
  nome: 'blog_public',
  /** `wp-admin/includes/schema.php:474` — o site nasce pedindo para ser indexado. */
  valorDeFabrica: '1',
} as const;

/**
 * `wp_sitemaps_get_max_urls( $object_type )` (`wp-includes/sitemaps.php:81`):
 * `apply_filters( 'wp_sitemaps_max_urls', 2000, $object_type )` (`:90`).
 */
export const ENDERECOS_POR_PAGINA_DO_MAPA = 2000;

/** `WP_Sitemaps_Index::$max_sitemaps` (`class-wp-sitemaps-index.php:35`). */
export const PAGINAS_DO_MAPA_NO_INDICE = 50000;

/**
 * O valor de uma opcao como `get_option()` o devolve: o texto gravado, ou
 * `false` quando a opcao nao existe.
 */
export type ValorDeOpcao = string | false;

/**
 * `(bool) get_option( 'blog_public' )` — `WP_Sitemaps::sitemaps_enabled()`
 * (`class-wp-sitemaps.php:89`), `do_robots()` (`wp-includes/functions.php:1726`)
 * e os filtros de robos (`wp-includes/robots-template.php:71`, `:143`, `:189`)
 * leem a opcao do mesmo jeito.
 *
 * O molde e o do PHP, e **nao** o de "igual a `'1'`": `'0'` e o texto vazio sao
 * falsos, e qualquer outro texto — `'2'`, `'nao'` — e verdadeiro.
 */
export function indexacaoLigada(blogPublic: ValorDeOpcao): boolean {
  return blogPublic !== false && blogPublic !== '' && blogPublic !== '0';
}
