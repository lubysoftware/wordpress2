/**
 * O que o mapa do site recebe de quem compoe, por ligacao tardia.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7).
 *
 * O mapa do site **nao tem armazenamento** (`plan.md`, *Modelo de dados*: *"saem
 * da mesma consulta publica da feature 004"*), e tudo o que ele le e de outro
 * contexto: o conteudo e a consulta publica (`BC-01`, `004-leitura-publica`), os
 * termos (`BC-02`), as contas (`BC-05`), o endereco de cada um, e as opcoes do
 * site. A regra de dependencia 3 de `target_architecture.md` proibe o `import`
 * horizontal, logo cada coisa chega aqui como **campo do contexto da operacao**,
 * do jeito que `ClassificacaoNaPublicacao` chega a `conteudo/publicacao/` — e e o
 * cabecalho de `../portas/porta-de-dados.ts` que pede exatamente isso a T015:
 * montar a consulta por SQL daqui seria um segundo dono para a mesma consulta.
 *
 * **O que o mapa decide, e o que ele so pede.** Os criterios de cada consulta sao
 * do mapa, e tem o nome das chaves do legado porque sao eles que o ponto de
 * extensao recebe (`wp_sitemaps_posts_query_args`,
 * `wp_sitemaps_taxonomies_query_args`, `wp_sitemaps_users_query_args`) e porque o
 * criterio de CA-7.2 esta neles: `'post_status' => array( 'publish' )`
 * **literal** (`wp-includes/sitemaps/providers/class-wp-sitemaps-posts.php:244`).
 * Quem executa a consulta e o dono dela; o mapa nao filtra o resultado de novo.
 *
 * Os campos sao sincronos pela mesma razao da porta de dados (AD-04): a pilha do
 * atendimento do mapa e sincrona no legado de ponta a ponta.
 */

import type { ValorDeOpcao } from './pontos-de-configuracao.js';

/** As tres opcoes que o mapa le, e o estado da estrutura de links. */
export interface OpcoesDoMapaDoSite {
  /** `get_option( 'blog_public' )`. */
  readonly blogPublic: ValorDeOpcao;
  /**
   * `get_option( 'show_on_front' )` — decide a entrada da pagina inicial no
   * mapa das paginas (`class-wp-sitemaps-posts.php:109` e `:212`).
   */
  readonly showOnFront: ValorDeOpcao;
  /**
   * `$wp_rewrite->using_permalinks()`: `permalink_structure` nao vazia. Decide a
   * forma de todo endereco do mapa (`class-wp-sitemaps-provider.php:165`,
   * `class-wp-sitemaps-index.php:90`, `class-wp-sitemaps-renderer.php:70` e
   * `:101`).
   */
  readonly usandoLinksPermanentes: boolean;
}

/** `home_url( $caminho )` — o endereco do site com o caminho dado. */
export type EnderecoInicial = (caminho: string) => string;

/** `admin_url( $caminho )` — o endereco do painel com o caminho dado. */
export type EnderecoDoPainel = (caminho: string) => string;

/**
 * `wp_date( DATE_W3C, strtotime( $dataGmt ) )` — a data da coluna `_gmt`
 * escrita no fuso do site (`class-wp-sitemaps-posts.php:135` e `:152`).
 *
 * Chega como funcao pelo mesmo motivo de `DatasDoSite` em
 * `conteudo/gravacao/`: o fuso e opcao (`timezone_string` ou `gmt_offset`, via
 * `wp_timezone()`) e prefere zona nomeada, com horario de verao. Contra o
 * oraculo, `America/Sao_Paulo` escreve `2026-10-11T19:10:37-03:00` para a
 * coluna `2026-10-11 22:10:37`.
 */
export type DataW3cDoSite = (dataGmt: string) => string;

/**
 * Os criterios da consulta de conteudo, com as chaves de `WP_Query`.
 *
 * Sao duas formas no legado, e as duas passam por aqui: a das paginas do mapa
 * (`class-wp-sitemaps-posts.php:239`-`:249`, mais `paged` ou `fields`) e a do
 * conteudo mais recente da pagina inicial (`:121`-`:129`), que pede `'publish'`
 * como texto, ordena por data e **nao** declara tamanho — logo vale o
 * `posts_per_page` do site.
 */
export interface CriteriosDaConsultaDeConteudo {
  readonly orderby: 'ID' | 'date';
  readonly order: 'ASC' | 'DESC';
  readonly post_type: string;
  readonly posts_per_page?: number;
  readonly post_status: 'publish' | readonly ['publish'];
  readonly no_found_rows: boolean;
  readonly update_post_term_cache: false;
  readonly update_post_meta_cache: false;
  readonly ignore_sticky_posts?: true;
  readonly paged?: number;
  readonly fields?: 'ids';
}

/** O que o mapa usa de cada conteudo devolvido. */
export interface ConteudoNoMapaDoSite {
  readonly id: number;
  /** `post_modified_gmt`, no formato da coluna. */
  readonly modificadoGmt: string;
}

/** `$query->posts` e `$query->max_num_pages`. */
export interface ResultadoDaConsultaDeConteudo {
  readonly conteudos: readonly ConteudoNoMapaDoSite[];
  readonly totalDePaginas: number;
}

/** `new WP_Query( $criterios )` — a consulta publica de `004-leitura-publica`. */
export type ConsultaPublicaDeConteudo = (
  criterios: CriteriosDaConsultaDeConteudo,
) => ResultadoDaConsultaDeConteudo;

/**
 * `get_permalink( $post )`, com o `false` do legado preservado (a mesma forma
 * de `EnderecoDoConteudo` em `conteudo/publicacao/`).
 */
export type EnderecoDoConteudo = (conteudoId: number) => string | false;

/** Os criterios da consulta de termos, com as chaves de `WP_Term_Query`. */
export interface CriteriosDaConsultaDeTermos {
  readonly taxonomy: string;
  readonly orderby: 'term_order';
  readonly number: number;
  readonly hide_empty: true;
  readonly hierarchical: false;
  readonly update_term_meta_cache: false;
  readonly fields?: 'all';
  readonly offset?: number;
}

/** `new WP_Term_Query( $criterios )->terms`, so com o identificador. */
export type ConsultaDeTermos = (
  criterios: CriteriosDaConsultaDeTermos,
) => readonly { readonly id: number }[];

/** `(int) wp_count_terms( $criterios )`. */
export type ContagemDeTermos = (criterios: CriteriosDaConsultaDeTermos) => number;

/** O `WP_Error` que `get_term_link()` pode devolver. */
export interface ErroDeEnderecoDeTermo {
  readonly codigoDoErro: string;
}

/** `get_term_link( $term, $taxonomy )`. */
export type EnderecoDoTermo = (
  termoId: number,
  taxonomia: string,
) => string | ErroDeEnderecoDeTermo;

/** Os criterios da consulta de contas, com as chaves de `WP_User_Query`. */
export interface CriteriosDaConsultaDeContas {
  readonly has_published_posts: readonly string[];
  readonly number: number;
  readonly paged?: number;
}

/** `$query->get_results()` e `$query->get_total()`. */
export interface ResultadoDaConsultaDeContas {
  readonly contas: readonly { readonly id: number }[];
  readonly total: number;
}

/** `new WP_User_Query( $criterios )`. */
export type ConsultaDeContas = (
  criterios: CriteriosDaConsultaDeContas,
) => ResultadoDaConsultaDeContas;

/** `get_author_posts_url( $contaId )`. */
export type EnderecoDoAutor = (contaId: number) => string;

/**
 * Os registros de tipo que o mapa pergunta. Cada lista vem **na ordem de
 * registro**, que e a ordem do indice.
 */
export interface TiposNoMapaDoSite {
  /** `array_keys( get_post_types( array( 'public' => true ) ) )`. */
  tiposDeConteudoPublicos(): readonly string[];
  /** `is_post_type_viewable( $tipo )`. */
  tipoDeConteudoVisivel(tipo: string): boolean;
  /** `array_keys( get_taxonomies( array( 'public' => true ) ) )`. */
  taxonomiasPublicas(): readonly string[];
  /** `is_taxonomy_viewable( $taxonomia )`. */
  taxonomiaVisivel(taxonomia: string): boolean;
}

/** Tudo o que o mapa do site recebe, numa requisicao. */
export interface ContextoDoMapaDoSite {
  readonly opcoes: OpcoesDoMapaDoSite;
  readonly enderecoInicial: EnderecoInicial;
  readonly enderecoDoPainel: EnderecoDoPainel;
  readonly dataW3cDoSite: DataW3cDoSite;
  readonly tipos: TiposNoMapaDoSite;
  readonly consultarConteudo: ConsultaPublicaDeConteudo;
  readonly enderecoDoConteudo: EnderecoDoConteudo;
  readonly consultarTermos: ConsultaDeTermos;
  readonly contarTermos: ContagemDeTermos;
  readonly enderecoDoTermo: EnderecoDoTermo;
  readonly consultarContas: ConsultaDeContas;
  readonly enderecoDoAutor: EnderecoDoAutor;
}
