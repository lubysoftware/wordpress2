/**
 * Os numeros, nomes e textos de fabrica do feed, cada um no seu ponto.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8, *"servir
 * feeds de conteudo e de comentarios a partir da mesma consulta publica"*).
 * Satisfaz a metade *"declarada"* de **CA-8.4** (*"o formato padrao e declarado
 * e usado quando o pedido nao nomeia um"*).
 *
 * O **P6** da constituicao manda cada valor de fabrica viver num ponto nomeado,
 * e a tabela *Nao negociavel* proibe inventar o que o legado nao tem. Todos os
 * abaixo **o legado tem**:
 *
 * | ponto | valor | ancora | ponto de extensao |
 * |---|---|---|---|
 * | formato padrao | `'rss2'` | `wp-includes/feed.php:89` | `default_feed` |
 * | `'rss'` pedido como padrao vira `'rss2'` | — | `feed.php:91` | (depois do filtro: nao se escapa dele) |
 * | tipo de conteudo por formato | 5 linhas | `feed.php:773`-`:779` | `feed_content_type` |
 * | tipo de conteudo de formato desconhecido | `application/octet-stream` | `feed.php:781` | `feed_content_type` |
 * | periodo de atualizacao | `'hourly'` | `feed-rss2.php:49`, `feed-rss2-comments.php:56`, `feed-rdf.php:40` | `rss_update_period` |
 * | frequencia de atualizacao | `'1'` | `feed-rss2.php:64`, `feed-rss2-comments.php:62`, `feed-rdf.php:46` | `rss_update_frequency` |
 * | base de atualizacao do RDF | `2000-01-01T12:00+00:00` | `feed-rdf.php:49` | **nenhum**: literal no modelo |
 * | `rss_use_excerpt` | `0` | `wp-admin/includes/schema.php:425` | (a opcao) |
 * | `blog_charset` | `'UTF-8'` | `schema.php:446` | (a opcao) |
 * | `html_type` | `'text/html'` | `schema.php:460` | (a opcao) |
 *
 * `posts_per_rss` (`schema.php:424`, `10`) **nao** esta aqui: o tamanho da
 * pagina do feed e decidido pela consulta publica, e ja mora em
 * `contextos/leitura-publica/consulta/paginacao-da-listagem.ts` (`:2032`-`:2039`
 * de `class-wp-query.php`). Declara-lo de novo seria um segundo dono para o
 * mesmo numero — e o feed **nao** decide quantos registros recebe (CA-8.2).
 *
 * Os pontos de extensao ficam **declarados**, e nao emitidos: o barramento de
 * ganchos nao tem tarefa neste pacote (REQ-162 esta em `do-not-rewrite.md`).
 */

/** O valor com que `default_feed` e aplicado (`feed.php:89`). */
export const FORMATO_DE_FEED_PADRAO = 'rss2';

/**
 * Os quatro formatos que o nucleo registra como tratador de `do_feed_{nome}`
 * (`wp-includes/default-filters.php:420`-`:423`), na ordem de registro.
 */
export const FORMATOS_DE_FEED_DO_NUCLEO = ['rdf', 'rss', 'rss2', 'atom'] as const;

/** Um dos quatro formatos do nucleo. */
export type FormatoDeFeedDoNucleo = (typeof FORMATOS_DE_FEED_DO_NUCLEO)[number];

/**
 * `feed_content_type()` (`feed.php:773`-`:779`). ⚠️ `rss-http` tem tipo e **nao**
 * tem tratador: pedir `?feed=rss-http` e `404` (conferido no oraculo), mas o
 * tipo existe para quem registrar o tratador.
 */
export const TIPOS_DE_CONTEUDO_DO_FEED: Readonly<Record<string, string>> = {
  rss: 'application/rss+xml',
  rss2: 'application/rss+xml',
  'rss-http': 'text/xml',
  atom: 'application/atom+xml',
  rdf: 'application/rdf+xml',
};

/** `feed.php:781` — o tipo de quem nao esta na tabela. */
export const TIPO_DE_CONTEUDO_DESCONHECIDO = 'application/octet-stream';

/** `rss_update_period`, com o valor de fabrica dos tres modelos que o emitem. */
export const PERIODO_DE_ATUALIZACAO_DO_FEED = 'hourly';

/** `rss_update_frequency`, texto e nao numero, como o legado o passa ao filtro. */
export const FREQUENCIA_DE_ATUALIZACAO_DO_FEED = '1';

/** `feed-rdf.php:49` — literal, sem filtro. */
export const BASE_DE_ATUALIZACAO_DO_RDF = '2000-01-01T12:00+00:00';

/** As tres opcoes de fabrica que os modelos leem. */
export const OPCOES_DE_FABRICA_DO_FEED = {
  /** `schema.php:425` — `0`: o feed leva o corpo inteiro, alem do resumo. */
  rss_use_excerpt: '0',
  /** `schema.php:446`. */
  blog_charset: 'UTF-8',
  /** `schema.php:460`. */
  html_type: 'text/html',
} as const;

/**
 * O valor de uma opcao como `get_option()` o devolve: o texto gravado, ou
 * `false` quando a opcao nao existe. Mesma forma de `ValorDeOpcao` em
 * `../mapa-do-site/`.
 */
export type ValorDeOpcaoDoFeed = string | false;

/**
 * `(bool) get_option( 'rss_use_excerpt' )` — o molde do PHP: `'0'`, texto vazio
 * e opcao ausente sao falsos, qualquer outro texto e verdadeiro.
 */
export function usarSoResumo(rssUseExcerpt: ValorDeOpcaoDoFeed): boolean {
  return rssUseExcerpt !== false && rssUseExcerpt !== '' && rssUseExcerpt !== '0';
}
