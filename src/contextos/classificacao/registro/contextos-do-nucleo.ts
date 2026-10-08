/**
 * Os **oito** contextos de classificacao do nucleo — o
 * `create_initial_taxonomies()` do legado, `wp-includes/taxonomy.php:25`.
 *
 * E a metade declarativa da entrega de T001: *"o modulo carrega com a porta de
 * dados declarada e os oito contextos de classificacao do nucleo registrados,
 * sem regra implementada"*. Oito e a contagem do legado e da spec — *"e o que
 * permite ao produto ter oito contextos de nucleo, entre eles categoria,
 * etiqueta, menu de navegacao e tema, sem inventar uma tabela por contexto"* —
 * e cada um sai de uma chamada `register_taxonomy()` do mesmo arquivo, nas
 * linhas 63, 86, 109, 136, 170, 188, 207 e 226.
 *
 * ---
 *
 * ## A ordem desta lista e a do legado, e nao e enfeite
 *
 * `create_initial_taxonomies()` registra nesta ordem, e a ordem e observavel por
 * dois caminhos: `get_taxonomies()` devolve `$wp_taxonomies` **na ordem de
 * insercao** (`taxonomy.php:282`), e o **P2** poe *"a ordem de disparo"* dos
 * pontos de extensao no contrato — as acoes `registered_taxonomy` saem nesta
 * sequencia. A tabela *Nao negociavel* da constituicao fecha a questao:
 * *"mudar a ordem de carregamento do arranque"* exige humano.
 *
 * ## Tres leituras desta lista que a spec cobra
 *
 * 1. **Um menu de navegacao e um contexto de classificacao.** `nav_menu` esta
 *    aqui, e os itens dele sao conteudo do tipo `nav_menu_item` — e a regra de
 *    negocio que US-1 cita e `AGG-MenuDeNavegacao` de `target_domain_model.md`
 *    repete. Quem porta esperando uma tabela de menus nao a encontra.
 * 2. **Nem todo contexto classifica conteudo.** `link_category` se aplica a
 *    `link`. E o que da dono a coluna polimorfica e o que justificou fundir
 *    `taxonomias-e-termos` com `links-e-bookmarks` em BC-02 — *"separa-los
 *    deixaria a coluna polimorfica sem dono"*.
 * 3. **Nenhum dos oito declara rotulo padrao.** O `default_term` de registro e
 *    nulo nos oito; a categoria padrao chega pela opcao gravada que o instalador
 *    semeia. Ver `contexto-de-classificacao.ts`.
 *
 * ## O que foi deixado de fora de cada declaracao, e por que
 *
 * Os argumentos `labels`, `rewrite`, `query_var`, `show_in_nav_menus`,
 * `meta_box_cb` e `show_tagcloud`-por-tema que o legado passa aqui **nao** tem
 * campo neste modulo: a razao, propriedade por propriedade e com o dono de cada
 * uma, esta na tabela de `contexto-de-classificacao.ts`. Nenhuma delas e lida
 * por US-1 a US-5, e nenhuma se resolve sem estado que BC-02 nao tem.
 */

import type { DeclaracaoDeContexto } from './contexto-de-classificacao.js';

/** `category` — `wp-includes/taxonomy.php:63`. */
export const CONTEXTO_DE_CATEGORIA = 'category';
/** `post_tag` — `wp-includes/taxonomy.php:86`. */
export const CONTEXTO_DE_ETIQUETA = 'post_tag';
/** `nav_menu` — `wp-includes/taxonomy.php:109`. */
export const CONTEXTO_DE_MENU_DE_NAVEGACAO = 'nav_menu';
/** `link_category` — `wp-includes/taxonomy.php:136`. */
export const CONTEXTO_DE_CATEGORIA_DE_LINK = 'link_category';
/** `post_format` — `wp-includes/taxonomy.php:170`. */
export const CONTEXTO_DE_FORMATO = 'post_format';
/** `wp_theme` — `wp-includes/taxonomy.php:188`. */
export const CONTEXTO_DE_TEMA = 'wp_theme';
/** `wp_template_part_area` — `wp-includes/taxonomy.php:207`. */
export const CONTEXTO_DE_AREA_DE_PARTE_DE_MODELO = 'wp_template_part_area';
/** `wp_pattern_category` — `wp-includes/taxonomy.php:226`. */
export const CONTEXTO_DE_CATEGORIA_DE_PADRAO = 'wp_pattern_category';

/** Uma declaracao do nucleo: o nome e os argumentos, como o legado os passa. */
export interface ContextoDoNucleo {
  readonly nome: string;
  readonly declaracao: DeclaracaoDeContexto;
}

/**
 * As oito declaracoes, **na ordem de `create_initial_taxonomies()`**.
 *
 * Todas carregam `integradoAoNucleo: true`, que e o `_builtin` do legado: e o
 * unico campo que **impede a remocao** do contexto
 * (`unregister_taxonomy()`, `taxonomy.php:615`). Os oito sao irremoviveis, e o
 * **P8** quer que continuem sendo.
 */
export const CONTEXTOS_DO_NUCLEO: readonly ContextoDoNucleo[] = [
  {
    nome: CONTEXTO_DE_CATEGORIA,
    declaracao: {
      tiposDeObjeto: 'post',
      // O UNICO hierarquico dos oito. CA-4.2 depende disso.
      hierarquico: true,
      publico: true,
      mostrarNaInterface: true,
      mostrarColunaNoPainel: true,
      integradoAoNucleo: true,
      capacidades: {
        gerenciarRotulos: 'manage_categories',
        editarRotulos: 'edit_categories',
        apagarRotulos: 'delete_categories',
        atribuirRotulos: 'assign_categories',
      },
      mostrarNoRest: true,
      baseRest: 'categories',
      classeControladoraRest: 'WP_REST_Terms_Controller',
    },
  },
  {
    nome: CONTEXTO_DE_ETIQUETA,
    declaracao: {
      tiposDeObjeto: 'post',
      hierarquico: false,
      publico: true,
      mostrarNaInterface: true,
      mostrarColunaNoPainel: true,
      integradoAoNucleo: true,
      capacidades: {
        gerenciarRotulos: 'manage_post_tags',
        editarRotulos: 'edit_post_tags',
        apagarRotulos: 'delete_post_tags',
        atribuirRotulos: 'assign_post_tags',
      },
      mostrarNoRest: true,
      baseRest: 'tags',
      classeControladoraRest: 'WP_REST_Terms_Controller',
    },
  },
  {
    nome: CONTEXTO_DE_MENU_DE_NAVEGACAO,
    declaracao: {
      // O item do menu e conteudo, e o menu e o contexto que o classifica.
      tiposDeObjeto: 'nav_menu_item',
      publico: false,
      hierarquico: false,
      mostrarNaInterface: false,
      integradoAoNucleo: true,
      // As quatro no mesmo nome: quem edita o tema edita os menus.
      capacidades: {
        gerenciarRotulos: 'edit_theme_options',
        editarRotulos: 'edit_theme_options',
        apagarRotulos: 'edit_theme_options',
        atribuirRotulos: 'edit_theme_options',
      },
      mostrarNoRest: true,
      baseRest: 'menus',
      classeControladoraRest: 'WP_REST_Menus_Controller',
    },
  },
  {
    nome: CONTEXTO_DE_CATEGORIA_DE_LINK,
    declaracao: {
      // NAO e conteudo. Ver a leitura 2 do cabecalho.
      tiposDeObjeto: 'link',
      hierarquico: false,
      publico: false,
      // Invisivel ao publico e VISIVEL no painel: o legado declara os dois.
      mostrarNaInterface: true,
      integradoAoNucleo: true,
      capacidades: {
        gerenciarRotulos: 'manage_links',
        editarRotulos: 'manage_links',
        apagarRotulos: 'manage_links',
        atribuirRotulos: 'manage_links',
      },
    },
  },
  {
    nome: CONTEXTO_DE_FORMATO,
    declaracao: {
      tiposDeObjeto: 'post',
      publico: true,
      hierarquico: false,
      mostrarNaInterface: false,
      integradoAoNucleo: true,
      // Nenhuma capacidade declarada: recebe as quatro de fabrica, com o
      // `assign_terms` caindo em `edit_posts`.
    },
  },
  {
    nome: CONTEXTO_DE_TEMA,
    declaracao: {
      // Tres tipos de objeto, e e o unico dos oito com mais de um.
      tiposDeObjeto: ['wp_template', 'wp_template_part', 'wp_global_styles'],
      publico: false,
      hierarquico: false,
      mostrarNaInterface: false,
      integradoAoNucleo: true,
      mostrarNoRest: false,
    },
  },
  {
    nome: CONTEXTO_DE_AREA_DE_PARTE_DE_MODELO,
    declaracao: {
      tiposDeObjeto: ['wp_template_part'],
      publico: false,
      hierarquico: false,
      mostrarNaInterface: false,
      integradoAoNucleo: true,
      mostrarNoRest: false,
    },
  },
  {
    nome: CONTEXTO_DE_CATEGORIA_DE_PADRAO,
    declaracao: {
      tiposDeObjeto: ['wp_block'],
      publico: false,
      // O unico dos oito que declara `publicly_queryable` por conta propria —
      // e declara o mesmo valor que herdaria de `publico`.
      consultavelPublicamente: false,
      hierarquico: false,
      mostrarNaInterface: true,
      integradoAoNucleo: true,
      mostrarNuvemDeRotulos: false,
      mostrarColunaNoPainel: true,
      mostrarNoRest: true,
    },
  },
];

/** Os oito nomes, na ordem de registro. */
export const NOMES_DOS_CONTEXTOS_DO_NUCLEO: readonly string[] =
  CONTEXTOS_DO_NUCLEO.map((contexto) => contexto.nome);
