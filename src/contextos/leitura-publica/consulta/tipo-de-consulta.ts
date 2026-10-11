/**
 * Os predicados de tipo de consulta — as **30** propriedades `is_*` de
 * `WP_Query`, declaradas em `wp-includes/class-wp-query.php:202`-`:436` e
 * zeradas por `init_query_flags()` (`:502-532`).
 *
 * Entrega de **T003** (US-1), e e **aqui que CA-1.4 vive**: *"endereco que
 * resolve para um unico conteudo e endereco que resolve para uma listagem sao
 * distinguiveis pela resposta"*. O que distingue os dois e {@link
 * TiposDeConsulta.singular} contra {@link TiposDeConsulta.arquivo} e
 * {@link TiposDeConsulta.inicio}, e **nao** a contagem de registros — que e o
 * que UT-038-5 cobra ao dizer *"sem depender da contagem devolvida"*. Uma
 * listagem de um item so continua sendo listagem, e um conteudo singular que nao
 * existe continua sendo singular.
 *
 * ---
 *
 * ## Sao 30, e `init_query_flags()` zera 29
 *
 * A que falta e `is_embed`, declarada em `:362` e **ausente** do corpo de
 * `init_query_flags()`. Isso nao e descuido deste porte, e tem consequencia
 * observavel: `set_404()` chama `init_query_flags()` e depois repoe `is_feed`
 * (`:1843-1849`), logo **`is_embed` atravessa o 404 sem ser zerada** — e a linha
 * seguinte de `parse_query`, `$this->is_embed = $this->is_embed && (
 * $this->is_singular || $this->is_404 )` (`:1152`), roda depois do `set_404()`
 * de `:1149` e aceita `is_404` como motivo para manter a incorporacao. Um porte
 * que zerasse as 30 juntas apagaria a resposta de incorporacao de um endereco
 * que nao existe, que no legado existe.
 *
 * ## Os nomes aqui sao em portugues, e o mapa para o legado esta nesta tabela
 *
 * Os predicados sao **superficie publicada** — `is_single()`, `is_archive()` e
 * companhia sao funcoes de `wp-includes/query.php` que todo tema de terceiro
 * chama, e o P8 proibe sumir com qualquer uma. Nenhuma esta sumindo: o nome
 * publico e da borda que expoe o tema (feature 009), e esta tabela e o contrato
 * entre as duas.
 *
 * | aqui | legado | o que significa |
 * |---|---|---|
 * | `unico` | `is_single` | um conteudo que nao e pagina |
 * | `pagina` | `is_page` | um conteudo do tipo pagina |
 * | `anexo` | `is_attachment` | um anexo, e tambem `is_single` |
 * | `singular` | `is_singular` | `unico \|\| pagina \|\| anexo` (`:1045` e `:1145`) |
 * | `arquivo` | `is_archive` | listagem por data, autor, termo ou tipo |
 * | `data`, `ano`, `mes`, `dia`, `hora` | `is_date`, `is_year`, `is_month`, `is_day`, `is_time` | os cinco recortes de data |
 * | `autor` | `is_author` | arquivo de autor |
 * | `categoria`, `etiqueta`, `taxonomia` | `is_category`, `is_tag`, `is_tax` | os tres recortes de termo |
 * | `arquivoDeTipoDeConteudo` | `is_post_type_archive` | a pagina de arquivo de um tipo |
 * | `busca` | `is_search` | consulta com termo de busca |
 * | `inicio` | `is_home` | a listagem inicial — o default quando nada mais casa |
 * | `paginaDeConteudos` | `is_posts_page` | a pagina estatica que **e** a listagem inicial |
 * | `politicaDePrivacidade` | `is_privacy_policy` | a pagina declarada como politica |
 * | `naoEncontrado` | `is_404` | a consulta marcada |
 * | `paginado` | `is_paged` | pagina de listagem acima da primeira |
 * | `previa` | `is_preview` | previa do editor |
 * | `feed`, `feedDeComentarios` | `is_feed`, `is_comment_feed` | as duas saidas de feed |
 * | `notificacaoDeLink` | `is_trackback` | o recebedor de notificacao de link |
 * | `incorporacao` | `is_embed` | a resposta de incorporacao |
 * | `painel` | `is_admin` | a consulta roda no painel |
 * | `robots`, `favicon`, `mapaDoSite` | `is_robots`, `is_favicon`, `is_sitemap` | as tres superficies que **nunca** 404am |
 */

/**
 * Os 30 predicados de uma consulta.
 *
 * Valor, nao objeto com metodos: a consulta corrente e escopo de REQUISICAO
 * (BR-MIGRAR-105, `EXT-CONTEXTO`) e duas leituras concorrentes nao podem
 * compartilhar instancia. No legado isso vinha do processo morrer no fim da
 * resposta.
 */
export interface TiposDeConsulta {
  /** `is_single` (`class-wp-query.php:202`). */
  readonly unico: boolean;
  /** `is_preview` (`:210`). */
  readonly previa: boolean;
  /** `is_page` (`:218`). */
  readonly pagina: boolean;
  /** `is_archive` (`:226`). */
  readonly arquivo: boolean;
  /** `is_date` (`:234`). */
  readonly data: boolean;
  /** `is_year` (`:242`). */
  readonly ano: boolean;
  /** `is_month` (`:250`). */
  readonly mes: boolean;
  /** `is_day` (`:258`). */
  readonly dia: boolean;
  /** `is_time` (`:266`). */
  readonly hora: boolean;
  /** `is_author` (`:274`). */
  readonly autor: boolean;
  /** `is_category` (`:282`). */
  readonly categoria: boolean;
  /** `is_tag` (`:290`). */
  readonly etiqueta: boolean;
  /** `is_tax` (`:298`). */
  readonly taxonomia: boolean;
  /** `is_search` (`:306`). */
  readonly busca: boolean;
  /** `is_feed` (`:314`) — a unica que `set_404()` preserva (`:1844` e `:1849`). */
  readonly feed: boolean;
  /** `is_comment_feed` (`:322`). */
  readonly feedDeComentarios: boolean;
  /** `is_trackback` (`:330`). */
  readonly notificacaoDeLink: boolean;
  /** `is_home` (`:338`). */
  readonly inicio: boolean;
  /** `is_privacy_policy` (`:346`). */
  readonly politicaDePrivacidade: boolean;
  /** `is_404` (`:354`). */
  readonly naoEncontrado: boolean;
  /**
   * `is_embed` (`:362`).
   *
   * A unica fora de `init_query_flags()`, e por isso a unica que sobrevive ao
   * `set_404()` junto com `feed`. Ver o cabecalho deste arquivo.
   */
  readonly incorporacao: boolean;
  /** `is_paged` (`:370`). */
  readonly paginado: boolean;
  /** `is_admin` (`:378`). */
  readonly painel: boolean;
  /** `is_attachment` (`:386`). */
  readonly anexo: boolean;
  /** `is_singular` (`:395`) — `unico || pagina || anexo`. */
  readonly singular: boolean;
  /** `is_robots` (`:403`). */
  readonly robots: boolean;
  /** `is_favicon` (`:411`). */
  readonly favicon: boolean;
  /** `is_sitemap` (`:419`). */
  readonly mapaDoSite: boolean;
  /** `is_posts_page` (`:428`). */
  readonly paginaDeConteudos: boolean;
  /** `is_post_type_archive` (`:436`). */
  readonly arquivoDeTipoDeConteudo: boolean;
}

/**
 * Os 30 predicados em falso — o estado depois de `init_query_flags()`
 * (`class-wp-query.php:502-532`) mais `is_embed` no valor de declaracao
 * (`:362`).
 *
 * Congelado porque e compartilhado entre requisicoes concorrentes.
 */
export const TIPOS_DE_CONSULTA_ZERADOS: TiposDeConsulta = Object.freeze({
  unico: false,
  previa: false,
  pagina: false,
  arquivo: false,
  data: false,
  ano: false,
  mes: false,
  dia: false,
  hora: false,
  autor: false,
  categoria: false,
  etiqueta: false,
  taxonomia: false,
  busca: false,
  feed: false,
  feedDeComentarios: false,
  notificacaoDeLink: false,
  inicio: false,
  politicaDePrivacidade: false,
  naoEncontrado: false,
  incorporacao: false,
  paginado: false,
  painel: false,
  anexo: false,
  singular: false,
  robots: false,
  favicon: false,
  mapaDoSite: false,
  paginaDeConteudos: false,
  arquivoDeTipoDeConteudo: false,
});

/**
 * `WP_Query::set_404()` (`wp-includes/class-wp-query.php:1843-1859`).
 *
 * Zera os 29 predicados de `init_query_flags()`, marca `is_404` e **repoe
 * `is_feed`**. `is_embed` sobrevive por nao estar na lista que se zera (ver o
 * cabecalho).
 *
 * ⚠️ O zeramento e observavel por quem le os predicados depois: um endereco que
 * era `is_single` e virou 404 **deixa de ser** `is_single`, e o tema que
 * perguntar vai ouvir nao. O ponto de acao `set_404` (`:1858`) nao dispara aqui
 * — ele e disparado por quem chama, com o retorno em maos, como os outros pontos
 * deste modulo.
 */
export function marcarNaoEncontrado(tipos: TiposDeConsulta): TiposDeConsulta {
  return Object.freeze({
    ...TIPOS_DE_CONSULTA_ZERADOS,
    naoEncontrado: true,
    feed: tipos.feed,
    incorporacao: tipos.incorporacao,
  });
}

/**
 * Verdadeiro quando a consulta resolveu para **um** conteudo, e nao para uma
 * listagem — o `is_singular()` do legado (`class-wp-query.php:1045` e `:1145`).
 *
 * E o lado "unico" de CA-1.4. O outro lado nao e a negacao deste: uma consulta
 * pode nao ser singular **e** nao ser listagem, que e o caso de `robots.txt` e
 * do mapa do site.
 */
export function consultaSingular(tipos: TiposDeConsulta): boolean {
  return tipos.singular;
}

/**
 * Verdadeiro quando a consulta resolveu para uma listagem de conteudo — o lado
 * "colecao" de CA-1.4.
 *
 * Sao os tres predicados pelos quais o legado entrega mais de um registro ao
 * laco do tema: `is_archive` (`:1010-1012`), `is_search` e `is_home`. O feed nao
 * entra: ele e **formato** de saida e aparece junto com qualquer um dos dois
 * lados — `is_comment_feed` de `:1047` depende justamente de `is_singular`.
 */
export function consultaDeListagem(tipos: TiposDeConsulta): boolean {
  return tipos.arquivo || tipos.busca || tipos.inicio;
}
