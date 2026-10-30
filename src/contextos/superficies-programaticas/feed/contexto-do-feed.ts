/**
 * O que o feed recebe de quem compoe, por ligacao tardia.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8, *"servir
 * feeds de conteudo e de comentarios a partir da mesma consulta publica"*).
 * Satisfaz o lado estrutural de **CA-8.2** (*"o feed e montado da mesma consulta
 * publica que a pagina, sem regra de visibilidade propria"*).
 *
 * ## Por que nao ha funcao de consulta aqui
 *
 * O mapa do site (`../mapa-do-site/contexto-do-mapa-do-site.ts`) recebe funcoes
 * de consulta porque `WP_Sitemaps` monta as **proprias** consultas. O feed nao:
 * no legado os modelos so percorrem o laco da consulta **principal** —
 * `have_posts()`/`the_post()` (`wp-includes/feed-rss2.php:85`) e
 * `have_comments()`/`the_comment()` (`wp-includes/feed-rss2-comments.php:73`) —,
 * a mesma que `WP::query_posts()` executou para a pagina
 * (`wp-includes/class-wp.php:703`). O tamanho da pagina do feed (`posts_per_rss`,
 * `class-wp-query.php:2032`-`:2039`) e a consulta de comentarios do feed
 * (`class-wp-query.php:2827` e `:3487`) sao de `WP_Query`, isto e, de
 * `004-leitura-publica`. Por isso {@link ConsultaNoFeed} chega como **resultado**
 * pronto, e nao como funcao: um feed que pudesse consultar teria como ter regra
 * de visibilidade propria, e CA-8.2 diz que ele nao tem.
 *
 * 🔴 **Os comentarios chegam separados dos conteudos, e o feed nao cruza um com o
 * outro.** No 7.1.2 a consulta de comentarios do feed singular roda **antes** da
 * conferencia de estado do conteudo (`class-wp-query.php:3487` contra `:3525`):
 * um conteudo nao publico tem `posts` esvaziado para o anonimo, mas os
 * comentarios aprovados dele ja estao em `$wp_query->comments`, e o modelo os
 * percorre. Filtrar aqui seria uma regra de visibilidade propria — exatamente o
 * que CA-8.2 nega — e corrigiria o legado (P1). ⚠️ O 7.1.4 moveu esse bloco para
 * depois da conferencia; o oraculo executavel se autoatualizou para 7.1.4 e por
 * isso **nao** reproduz este caso. Ver `../README.md`, *O que T017 entregou*.
 *
 * ## O que chega pronto, e por que
 *
 * Cada texto de item chega **ja como a funcao de modelo do legado o escreve** —
 * `the_title_rss()`, `the_permalink_rss()`, `the_excerpt_rss()`,
 * `get_the_content_feed()`, `comment_text()`... —, porque a cadeia de filtros
 * deles (`the_title_rss`: `strip_tags`, `ent2ncr`, `esc_html`,
 * `wp-includes/default-filters.php:257`-`:259`; `the_content`: blocos,
 * `wptexturize`, `wpautop`, macros...) e de `BC-01`, de `plataforma/formatacao/`
 * (feature `015`) e do tema. O feed e dono da **forma** do documento: a ordem, o
 * espaco em branco, as condicoes de cada elemento, a lista de categorias, os
 * anexos, a data de construcao e o gerador. Os escapes que essas partes usam
 * chegam em {@link FormatacaoNoFeed}, pelo mesmo motivo que T002 e T015 nao
 * portaram `esc_html()` nem `esc_url()`.
 *
 * Os campos sao sincronos pela mesma razao da porta de dados (AD-04): o laco do
 * feed e sincrono no legado de ponta a ponta.
 */

import type { ValorDeOpcaoDoFeed } from './pontos-de-configuracao.js';

/** As tres opcoes que os modelos leem. */
export interface OpcoesDoFeed {
  /** `get_option( 'blog_charset' )` — na declaracao XML e no tipo de conteudo. */
  readonly blogCharset: string;
  /** `get_option( 'rss_use_excerpt' )` — so o resumo, ou resumo e corpo. */
  readonly rssUseExcerpt: ValorDeOpcaoDoFeed;
  /** `get_bloginfo( 'html_type' )` — decide `html_type_rss()` (`feed.php:459`). */
  readonly htmlType: string;
}

/**
 * Os primitivos de formatacao que as partes portadas usam. Sao de
 * `plataforma/formatacao/` (feature `015`); chegam por argumento para que o
 * feed nao tenha uma segunda implementacao deles.
 */
export interface FormatacaoNoFeed {
  /** `esc_url()` (`wp-includes/formatting.php`). */
  escUrl(texto: string): string;
  /** `esc_attr()`. */
  escAttr(texto: string): string;
  /** `sanitize_url()` — o `esc_url()` sem a troca para exibicao. */
  sanitizarUrl(texto: string): string;
  /** `convert_chars()`. */
  converterCaracteres(texto: string): string;
  /** `ent2ncr()`. */
  entidadesParaNumericas(texto: string): string;
  /** `html_entity_decode( $texto, ENT_COMPAT, $charset )`. */
  decodificarEntidades(texto: string, charset: string): string;
}

/**
 * Um anexo de midia gravado no metadado `enclosure`: o texto cru, com endereco,
 * tamanho e tipo separados por quebra de linha (`feed.php:489`).
 */
export type AnexoNoFeed = string;

/** Um conteudo da consulta principal, com os textos ja como os modelos os escrevem. */
export interface ConteudoNoFeed {
  readonly id: number;
  /** `get_the_title_rss()` / `the_title_rss()`. */
  readonly tituloRss: string;
  /** `the_permalink_rss()` — ja com `esc_url()`. */
  readonly enderecoRss: string;
  /** `comments_link_feed()` — ja com `esc_url()`. */
  readonly enderecoDosComentarios: string;
  /** `the_author()`. */
  readonly autor: string;
  /** `the_author_meta( 'url' )`; o texto vazio tira o `<uri>` do Atom. */
  readonly enderecoDoAutor: string;
  /** `post_date_gmt`, no formato da coluna. */
  readonly publicadoGmt: string;
  /** `post_modified_gmt`, no formato da coluna. */
  readonly modificadoGmt: string;
  /** `the_guid()` — ja com `esc_url()`. */
  readonly guid: string;
  /** `the_excerpt_rss()`. */
  readonly resumoRss: string;
  /** `get_the_content_feed( $tipo )` — o tipo e argumento do filtro `the_content_feed`. */
  conteudoDoFeed(tipo: string): string;
  /**
   * Os nomes de categoria e de etiqueta, **nessa ordem** e ja passados por
   * `sanitize_term_field( 'name', ..., $filtro )` — `'raw'` para o Atom e
   * `'rss'` para os outros (`feed.php:392`-`:409`). Repetidos ficam: o
   * `array_unique()` e do feed.
   */
  nomesDeCategoria(filtro: 'rss' | 'raw'): readonly string[];
  /** `get_comments_number()`. */
  readonly numeroDeComentarios: number;
  /** `comments_open()`. */
  readonly comentariosAbertos: boolean;
  /** `esc_url( get_post_comments_feed_link( $id, $tipo ) )`. */
  enderecoDoFeedDeComentarios(tipo: string): string;
  /** `post_password_required()` — sem senha, sem anexo (`feed.php:476` e `:520`). */
  readonly senhaExigida: boolean;
  /** `get_post_custom()['enclosure']`, na ordem gravada. */
  readonly anexos: readonly AnexoNoFeed[];
}

/** O comentario a que outro responde, como o Atom o cita (`feed-atom-comments.php:129`). */
export interface ComentarioRespondidoNoFeed {
  /** `comment_guid( $pai )` — ja com `esc_url()`. */
  readonly guid: string;
  /** `get_comment_link( $pai )` — **sem** `esc_url()`, como o modelo o escreve. */
  readonly endereco: string;
}

/** Um comentario da consulta principal de feed de comentarios. */
export interface ComentarioNoFeed {
  readonly id: number;
  /** `comment_post_ID`. */
  readonly conteudoId: number;
  /** `apply_filters( 'the_title_rss', get_the_title( $conteudo ) )`. */
  readonly tituloDoConteudoRss: string;
  /** `get_comment_author_rss()`. */
  readonly autorRss: string;
  /** `get_comment_author_url()`; texto vazio tira o `<uri>` do Atom. */
  readonly enderecoDoAutor: string;
  /** `comment_link()` — ja com `esc_url()`. */
  readonly endereco: string;
  /** `comment_date_gmt`, no formato da coluna. */
  readonly dataGmt: string;
  /** `comment_guid()` — ja com `esc_url()`. */
  readonly guid: string;
  /** `post_password_required( $conteudo )`. */
  readonly senhaDoConteudoExigida: boolean;
  /** `get_the_password_form()` do conteudo — so lido com a senha exigida. */
  readonly formularioDeSenha: string;
  /** `comment_text_rss()`. */
  readonly textoRss: string;
  /** `comment_text()`. */
  readonly texto: string;
  /**
   * `null` quando `'0' === $comment->comment_parent` (`feed-atom-comments.php:117`);
   * o comentario respondido, quando nao.
   */
  readonly respondeA: ComentarioRespondidoNoFeed | null;
  /** `the_guid()` e `the_permalink_rss()` do conteudo do comentario (`:119`). */
  readonly conteudo: { readonly guid: string; readonly enderecoRss: string };
}

/** Os predicados da consulta principal que os modelos leem. */
export interface TiposNoFeed {
  /** `is_singular()`. */
  readonly singular: boolean;
  /** `is_single()` — o `<link>` do RSS2 de comentarios (`feed-rss2-comments.php:50`). */
  readonly single: boolean;
  /** `is_search()`. */
  readonly busca: boolean;
  /** `is_comment_feed()`. */
  readonly feedDeComentarios: boolean;
}

/**
 * O resultado da consulta principal — `$wp_query` depois de `WP::query_posts()`.
 * E de `004-leitura-publica`; o feed so o le.
 */
export interface ConsultaNoFeed {
  readonly tipos: TiposNoFeed;
  /** `$wp_query->posts`, na ordem da consulta. */
  readonly conteudos: readonly ConteudoNoFeed[];
  /** `$wp_query->comments`, na ordem da consulta. Vazio fora de feed de comentarios. */
  readonly comentarios: readonly ComentarioNoFeed[];
  /**
   * `get_query_var( 'feed' )` — o formato **depois** de `WP_Query::parse_query()`
   * tirar o prefixo `comments-` (`class-wp-query.php:1040`-`:1043`). E o que
   * `do_feed()` le (`wp-includes/functions.php:1615`); o cabecalho le o cru.
   */
  readonly formato: string;
}

/** As datas que o feed le e que nao sao de item. */
export interface DatasDoFeed {
  /**
   * `get_lastpostmodified( 'GMT' )` (`wp-includes/post.php:7798`), no formato da
   * coluna, ou `false`. A data de construcao cai nele quando o laco esta vazio
   * (`feed.php:736`), e o `Last-Modified` sai dele (`class-wp.php:491`).
   */
  readonly ultimaModificacaoDeConteudoGmt: string | false;
  /** `get_lastcommentmodified( 'GMT' )` (`wp-includes/comment.php:410`), ou `false`. */
  readonly ultimaModificacaoDeComentarioGmt: string | false;
  /** `gmdate()` sem instante — so lido quando nao ha data nenhuma (`class-wp.php:504`). */
  agora(): Date;
}

/** O que os modelos leem do site, ja como `bloginfo_rss()` e afins o escrevem. */
export interface SiteNoFeed {
  /** `wp_title_rss()` / `get_wp_title_rss()`. */
  readonly tituloRss: string;
  /** `get_bloginfo_rss( 'name' )`. */
  readonly nomeRss: string;
  /** `bloginfo_rss( 'url' )`. */
  readonly enderecoRss: string;
  /** `bloginfo_rss( 'description' )`. */
  readonly descricaoRss: string;
  /** `bloginfo_rss( 'html_type' )` — o atributo `type` dos links do Atom. */
  readonly tipoHtmlRss: string;
  /** `bloginfo_rss( 'language' )`. */
  readonly idiomaRss: string;
  /** `get_bloginfo_rss( 'version' )` — no gerador RSS2, RDF e Atom. */
  readonly versaoRss: string;
  /** `get_bloginfo( 'version' )` — no gerador do RSS 0.92. */
  readonly versao: string;
  /** `bloginfo( 'atom_url' )`. */
  readonly enderecoAtom: string;
  /** `bloginfo_rss( 'comments_atom_url' )`. */
  readonly enderecoAtomDosComentariosRss: string;
  /** `home_url()`. */
  readonly enderecoInicial: string;
  /** `self_link()` — o endereco pedido, ja com `esc_url()` (`feed.php:670`-`:702`). */
  readonly enderecoProprio: string;
  /** `get_search_query()`. */
  readonly termoDeBusca: string;
  /** `get_search_comments_feed_link( '', 'atom' )`. */
  readonly enderecoDoFeedDeComentariosDaBusca: string;
  /** `get_site_icon_url( 32 )`; texto vazio e sem icone. */
  readonly enderecoDoIcone: string;
}

/** `__()` — os textos dos modelos, pelo identificador em ingles. */
export type TraducaoNoFeed = (texto: string) => string;

/** Tudo o que o feed recebe, numa requisicao. */
export interface ContextoDoFeed {
  readonly opcoes: OpcoesDoFeed;
  readonly site: SiteNoFeed;
  readonly consulta: ConsultaNoFeed;
  readonly datas: DatasDoFeed;
  readonly formatacao: FormatacaoNoFeed;
  /**
   * `get_allowed_mime_types()` — so os valores. `atom_enclosure()` so aceita
   * como tipo o que esta nesta lista (`feed.php:541`), e ela depende da conta
   * corrente, que nao e deste contexto.
   */
  readonly tiposMimePermitidos: readonly string[];
  /** Ausente, os textos saem no identificador em ingles, que e o `en_US` de fabrica. */
  readonly traduzir?: TraducaoNoFeed;
  /**
   * O valor que o filtro `default_feed` devolveu (`feed.php:89`). Ausente, vale
   * o de fabrica. O filtro fica declarado, e nao emitido: o barramento nao tem
   * tarefa (REQ-162 esta em `do-not-rewrite.md`).
   */
  readonly formatoPadraoFiltrado?: string;
}
