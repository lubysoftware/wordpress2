/**
 * Os tres provedores que o nucleo registra: conteudo, taxonomias e contas.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7). Satisfaz
 * **CA-7.2** (*"cada pagina lista apenas conteudo publico, respeitando a
 * restricao de leitura"*), **CA-7.6** (*"conteudo protegido por senha entra no
 * indice, porque esta publicado: a protecao e do corpo"*) e a metade *"o tamanho
 * de pagina e declarado"* de **CA-7.5**.
 *
 * `WP_Sitemaps::register_sitemaps()` (`wp-includes/sitemaps/class-wp-sitemaps.php:112`)
 * os registra nesta ordem, `posts`, `taxonomies`, `users` (`:113`-`:117`), e a
 * ordem e a do indice.
 *
 * ## O criterio de CA-7.2 e um literal, e CA-7.6 e a ausencia de um
 *
 * A pagina de conteudo pede `'post_status' => array( 'publish' )` **por nome**
 * (`providers/class-wp-sitemaps-posts.php:244`), e nao consulta o registro de
 * estados: o privado nao entra nem para quem pode le-lo, e o rascunho tambem
 * nao. `conteudo/visibilidade/presenca-em-consulta-publica.ts` ja registrou a
 * mesma leitura do lado de `BC-01`.
 *
 * E os criterios **nao tem** `has_password` nem nada sobre `post_password`: o
 * conteudo publicado com senha entra, com endereco e data. Conferido contra o
 * oraculo: publicado com senha `x`, privado e rascunho — so o primeiro aparece
 * em `wp-sitemap-posts-post-1.xml`.
 *
 * ## O que cada provedor pergunta a quem compoe
 *
 * | provedor | subtipos | consulta | endereco |
 * |---|---|---|---|
 * | `posts` | tipos publicos **e** visiveis, menos `attachment` (`:36`-`:50`) | `WP_Query` (`:225`) | `get_permalink()` |
 * | `taxonomies` | taxonomias publicas e visiveis (`providers/class-wp-sitemaps-taxonomies.php:35`) | `WP_Term_Query`, `wp_count_terms()` (`:185`) | `get_term_link()`, e o erro e pulado (`:110`) |
 * | `users` | nenhum: uma pagina so de nome vazio | `WP_User_Query` (`providers/class-wp-sitemaps-users.php:132`) | `get_author_posts_url()` |
 *
 * ⚠️ O provedor de contas pergunta os tipos publicos **sem** o filtro de
 * visivel, e tira `attachment` **e** `page` (`users:133`-`:141`): conta que so
 * publicou pagina nao entra.
 *
 * Pontos de extensao **declarados e nao emitidos** (REQ-162 esta em
 * `do-not-rewrite.md`), cada um no ponto em que seria: `wp_sitemaps_post_types`,
 * `wp_sitemaps_posts_pre_url_list`, `wp_sitemaps_posts_show_on_front_entry`,
 * `wp_sitemaps_posts_entry`, `wp_sitemaps_posts_pre_max_num_pages`,
 * `wp_sitemaps_posts_query_args`; `wp_sitemaps_taxonomies`,
 * `wp_sitemaps_taxonomies_pre_url_list`, `wp_sitemaps_taxonomies_entry`,
 * `wp_sitemaps_taxonomies_pre_max_num_pages`,
 * `wp_sitemaps_taxonomies_query_args`; `wp_sitemaps_users_pre_url_list`,
 * `wp_sitemaps_users_entry`, `wp_sitemaps_users_pre_max_num_pages`,
 * `wp_sitemaps_users_query_args`.
 */

import { ENDERECOS_POR_PAGINA_DO_MAPA } from './pontos-de-configuracao.js';
import type {
  ContextoDoMapaDoSite,
  CriteriosDaConsultaDeContas,
  CriteriosDaConsultaDeConteudo,
  CriteriosDaConsultaDeTermos,
} from './contexto-do-mapa-do-site.js';
import type { EntradaDoMapaDoSite, ProvedorDoMapaDoSite } from './provedor-do-mapa-do-site.js';

/**
 * `get_posts_query_args( $post_type )` (`posts:225`-`:254`). O tamanho de
 * pagina e `wp_sitemaps_get_max_urls( 'post' )`.
 */
export function criteriosDaPaginaDeConteudo(tipo: string): CriteriosDaConsultaDeConteudo {
  return {
    orderby: 'ID',
    order: 'ASC',
    post_type: tipo,
    posts_per_page: ENDERECOS_POR_PAGINA_DO_MAPA,
    post_status: ['publish'],
    no_found_rows: true,
    update_post_term_cache: false,
    update_post_meta_cache: false,
    ignore_sticky_posts: true,
  };
}

/**
 * A consulta do conteudo mais recente, que da a data da pagina inicial
 * (`posts:120`-`:130`). Sem `posts_per_page`: vale o do site.
 */
export const CRITERIOS_DO_CONTEUDO_MAIS_RECENTE: CriteriosDaConsultaDeConteudo = {
  post_type: 'post',
  post_status: 'publish',
  orderby: 'date',
  order: 'DESC',
  no_found_rows: true,
  update_post_meta_cache: false,
  update_post_term_cache: false,
};

/** `WP_Sitemaps_Posts` (`posts:17`). */
export function criarProvedorDeConteudo(contexto: ContextoDoMapaDoSite): ProvedorDoMapaDoSite {
  const subtipos = (): readonly string[] =>
    contexto.tipos
      .tiposDeConteudoPublicos()
      .filter((tipo) => tipo !== 'attachment')
      .filter((tipo) => contexto.tipos.tipoDeConteudoVisivel(tipo));

  return {
    nome: 'posts',
    tipoDeObjeto: 'post',
    subtipos,

    // `get_url_list()` (`:64`-`:169`).
    listaDeEnderecos(pagina, tipo) {
      if (!subtipos().includes(tipo)) {
        return [];
      }

      const { conteudos } = contexto.consultarConteudo({
        ...criteriosDaPaginaDeConteudo(tipo),
        paged: pagina,
      });

      const lista: EntradaDoMapaDoSite[] = [];

      // A pagina inicial entra no mapa das paginas, so na primeira, quando a
      // inicial mostra os conteudos recentes (`:109`).
      if (tipo === 'page' && pagina === 1 && contexto.opcoes.showOnFront === 'posts') {
        const recentes = contexto.consultarConteudo(CRITERIOS_DO_CONTEUDO_MAIS_RECENTE).conteudos;
        const maisRecente = ordenarPorModificacaoDecrescente(recentes)[0];

        lista.push(
          maisRecente === undefined
            ? { loc: contexto.enderecoInicial('/') }
            : {
                loc: contexto.enderecoInicial('/'),
                lastmod: contexto.dataW3cDoSite(maisRecente.modificadoGmt),
              },
        );
      }

      for (const conteudo of conteudos) {
        const endereco = contexto.enderecoDoConteudo(conteudo.id);
        lista.push({
          loc: endereco === false ? '' : endereco,
          lastmod: contexto.dataW3cDoSite(conteudo.modificadoGmt),
        });
      }

      return lista;
    },

    // `get_max_num_pages()` (`:181`-`:214`).
    totalDePaginas(tipo) {
      if (tipo === '' || tipo === '0') {
        return 0;
      }

      const { totalDePaginas } = contexto.consultarConteudo({
        ...criteriosDaPaginaDeConteudo(tipo),
        fields: 'ids',
        no_found_rows: false,
      });

      // A pagina inicial garante uma pagina ao mapa das paginas (`:212`).
      const minimo = tipo === 'page' && contexto.opcoes.showOnFront === 'posts' ? 1 : 0;
      return Math.max(minimo, totalDePaginas);
    },
  };
}

/**
 * `wp_list_sort( $posts, 'post_modified_gmt', 'DESC' )` (`posts:133`): a
 * coluna e texto e compara como texto; empate guarda a ordem da consulta.
 */
function ordenarPorModificacaoDecrescente<T extends { readonly modificadoGmt: string }>(
  conteudos: readonly T[],
): readonly T[] {
  return [...conteudos].sort((a, b) =>
    a.modificadoGmt === b.modificadoGmt ? 0 : a.modificadoGmt < b.modificadoGmt ? 1 : -1,
  );
}

/** `get_taxonomies_query_args( $taxonomy )` (`taxonomies:185`-`:212`). */
export function criteriosDaConsultaDeTermos(taxonomia: string): CriteriosDaConsultaDeTermos {
  return {
    taxonomy: taxonomia,
    orderby: 'term_order',
    number: ENDERECOS_POR_PAGINA_DO_MAPA,
    hide_empty: true,
    hierarchical: false,
    update_term_meta_cache: false,
  };
}

/** `WP_Sitemaps_Taxonomies`. */
export function criarProvedorDeTaxonomias(contexto: ContextoDoMapaDoSite): ProvedorDoMapaDoSite {
  const subtipos = (): readonly string[] =>
    contexto.tipos.taxonomiasPublicas().filter((t) => contexto.tipos.taxonomiaVisivel(t));

  return {
    nome: 'taxonomies',
    tipoDeObjeto: 'term',
    subtipos,

    // `get_url_list()` (`:61`-`:135`): paginado por deslocamento, nao por pagina.
    listaDeEnderecos(pagina, taxonomia) {
      if (!subtipos().includes(taxonomia)) {
        return [];
      }

      const termos = contexto.consultarTermos({
        ...criteriosDaConsultaDeTermos(taxonomia),
        fields: 'all',
        offset: (pagina - 1) * ENDERECOS_POR_PAGINA_DO_MAPA,
      });

      const lista: EntradaDoMapaDoSite[] = [];
      for (const termo of termos) {
        const endereco = contexto.enderecoDoTermo(termo.id, taxonomia);
        if (typeof endereco !== 'string') {
          continue;
        }
        lista.push({ loc: endereco });
      }
      return lista;
    },

    // `get_max_num_pages()` (`:147`-`:175`).
    totalDePaginas(taxonomia) {
      if (taxonomia === '' || taxonomia === '0') {
        return 0;
      }
      const total = contexto.contarTermos(criteriosDaConsultaDeTermos(taxonomia));
      return Math.ceil(total / ENDERECOS_POR_PAGINA_DO_MAPA);
    },
  };
}

/** `WP_Sitemaps_Users`. */
export function criarProvedorDeContas(contexto: ContextoDoMapaDoSite): ProvedorDoMapaDoSite {
  // `get_users_query_args()` (`users:132`-`:163`).
  const criterios = (): CriteriosDaConsultaDeContas => ({
    has_published_posts: contexto.tipos
      .tiposDeConteudoPublicos()
      .filter((tipo) => tipo !== 'attachment' && tipo !== 'page'),
    number: ENDERECOS_POR_PAGINA_DO_MAPA,
  });

  return {
    nome: 'users',
    tipoDeObjeto: 'user',
    subtipos: () => [],

    // `get_url_list()` (`:39`-`:86`). O subtipo e ignorado: e assim no legado.
    listaDeEnderecos(pagina) {
      const { contas } = contexto.consultarContas({ ...criterios(), paged: pagina });
      return contas.map((conta) => ({ loc: contexto.enderecoDoAutor(conta.id) }));
    },

    // `get_max_num_pages()` (`:100`-`:123`).
    totalDePaginas() {
      const { total } = contexto.consultarContas(criterios());
      return Math.ceil(total / ENDERECOS_POR_PAGINA_DO_MAPA);
    },
  };
}
