/**
 * O **contexto de classificacao**: a `Taxonomy` do legado, e o `WP_Taxonomy` que
 * `register_taxonomy()` constroi.
 *
 * O vocabulario e o da spec, e ele e a feature inteira: *"Term e o rotulo e
 * Taxonomy e o contexto: o mesmo Term vive em duas taxonomias como duas linhas
 * de vinculo e uma de rotulo"* (`spec.md`, US-1). **Rotulo** e o termo;
 * **contexto** e onde ele classifica. Este arquivo trata so do contexto — o
 * rotulo e a juncao sao T002.
 *
 * `target_architecture.md` chama este objeto de parte de `AGG-Termo` (BC-02),
 * mas ele nao e entidade gravada: as oito declaracoes do nucleo vivem em codigo
 * e sao refeitas a cada requisicao, como `create_initial_taxonomies()` faz
 * (`wp-includes/taxonomy.php:25`). O que se grava e o rotulo dentro do contexto,
 * em `term_taxonomy.taxonomy`, por nome.
 *
 * ---
 *
 * ## A regra que decide o que entra neste tipo, e o que nao
 *
 * `set_props()` (`wp-includes/class-wp-taxonomy.php:303`) resolve **27**
 * propriedades. Umas se derivam so dos argumentos declarados; outras leem estado
 * que **nao mora em BC-02**. Este arquivo porta exatamente as primeiras, e a
 * fronteira e essa — nao e recorte de conveniencia:
 *
 * | propriedade do legado | por que nao esta aqui | de quem e |
 * |---|---|---|
 * | `labels`, `label` | dependem do catalogo gettext; `get_taxonomy_labels()` traduz cada rotulo | `plataforma/traducao`, feature 015 T009 |
 * | `rewrite` | depende de `is_admin()`, da opcao `permalink_structure`, de `$wp_rewrite` e de **o `init` ja ter disparado** — e por isso que `create_initial_taxonomies()` monta `$rewrite` de dois jeitos (`taxonomy.php:30` a `:60`) | `plataforma/rotas` e BC-08 |
 * | `query_var` | so se resolve com `is_admin()` (`class-wp-taxonomy.php:374`) | idem |
 * | `show_in_nav_menus` | em `post_format` o valor do legado e `current_theme_supports( 'post-formats' )` (`taxonomy.php:184`): estado de tema, nao de classificacao | BC-07 e `plataforma/tema` |
 * | `meta_box_cb`, `meta_box_sanitize_cb` | sao retorno de chamada de tela | BC-10 e `plataforma/telas` |
 * | `args` | repassado a consulta de conteudo | BC-01 e BC-08 |
 *
 * Inventar valor para qualquer uma delas aqui seria **decidir** o que o legado
 * calcula com dado que esta tarefa nao tem. Nenhuma delas e lida por US-1 a
 * US-5.
 *
 * ## O que este arquivo tambem nao faz: disparar os pontos de extensao
 *
 * 🔴 `register_taxonomy()` atravessa **quatro** pontos de extensao, e o **P2** da
 * constituicao os trata como contrato publico: os filtros
 * `register_taxonomy_args` e `register_{$taxonomy}_taxonomy_args`
 * (`class-wp-taxonomy.php:316` e `:337`), que podem **reescrever os argumentos
 * antes** desta resolucao, e as acoes `registered_taxonomy` e
 * `registered_taxonomy_{$taxonomy}` (`taxonomy.php:570` e `:588`). Mais
 * `unregistered_taxonomy` (`taxonomy.php:632`).
 *
 * **Nenhum deles e emitido aqui, e a razao nao e esquecimento:** o barramento de
 * hooks nao existe nesta arvore e **nenhuma tarefa do pacote o constroi** — a
 * busca por tarefa que entregue barramento nos 15 `tasks.md` nao devolve
 * nenhuma, e `plataforma/autorizacao/index.ts` registra a mesma ausencia por
 * conta de `REQ-162` estar em `do-not-rewrite.md`. A ordem em que os quatro
 * entram esta documentada acima para que a tarefa que construir o barramento os
 * encaixe na posicao do legado, que **e** o contrato (P2: *"com o nome, os
 * argumentos, a ordem de disparo e a capacidade de alterar o resultado"*). Ver
 * `../README.md`.
 */

import type { Capacidade } from '../../../plataforma/autorizacao/index.js';

/**
 * Quantos **bytes** o nome de um contexto pode ter.
 *
 * O legado usa `strlen( $taxonomy ) > 32` (`wp-includes/taxonomy.php:527`), e
 * `strlen` em PHP conta **bytes**, nao caracteres. Nome com acento gasta dois
 * bytes por acento em UTF-8, logo contar unidades de UTF-16 aqui aceitaria nome
 * que o legado recusa. O ponto de configuracao nomeado que o **P6** exige e esta
 * constante, com o valor de fabrica do legado; o teste de borda esta em
 * `registro-de-contextos.test.ts`.
 *
 * ⚠️ O numero tambem esta **dentro** do `msgid` da mensagem de recusa — ver
 * `erro-de-registro.ts`.
 */
export const LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO = 32;

/**
 * Os quatro nomes de capacidade que um contexto declara — o `$tax->cap` do
 * legado.
 *
 * Sao **nomes**, nao decisoes: quem decide e `plataforma/autorizacao/`, que e
 * dependencia de 48 dos 71 modulos. E e la que mora o colapso que UC-08 avisa —
 * *"cinco nomes de capacidade de taxonomia resolvem todos para a mesma
 * capacidade real"* (`manage_post_tags`, `edit_categories`, `edit_post_tags`,
 * `delete_categories`, `delete_post_tags` para `manage_categories`,
 * `permissions.md` 5.4). **O colapso nao e aplicado aqui de proposito:** o
 * contexto declara o nome que declara, e achatar os nomes no registro apagaria
 * a distincao que uma extensao que registre contexto com capacidade propria
 * depende.
 */
export interface CapacidadesDoContexto {
  /** `manage_terms` — abrir e gerenciar a lista de rotulos. */
  readonly gerenciarRotulos: Capacidade;
  /** `edit_terms` — criar e renomear rotulo. */
  readonly editarRotulos: Capacidade;
  /** `delete_terms` — apagar rotulo. */
  readonly apagarRotulos: Capacidade;
  /** `assign_terms` — vincular rotulo a um objeto. */
  readonly atribuirRotulos: Capacidade;
}

/**
 * O default de `$tax->cap`, de `class-wp-taxonomy.php:430`.
 *
 * ⚠️ Repare na assimetria, que e regra e nao descuido: tres caem em
 * `manage_categories` e o quarto cai em **`edit_posts`**. E o que UC-05 resume —
 * *"atribuir termo e poder de conteudo, nao de classificacao"*. Um default
 * uniforme trancaria o autor fora da propria tela de edicao.
 */
export const CAPACIDADES_PADRAO_DO_CONTEXTO: CapacidadesDoContexto = {
  gerenciarRotulos: 'manage_categories',
  editarRotulos: 'manage_categories',
  apagarRotulos: 'manage_categories',
  atribuirRotulos: 'edit_posts',
};

/**
 * O rotulo padrao que o contexto declara ao se registrar — o `default_term` de
 * `register_taxonomy()`.
 *
 * ⚠️ **Nao e o mecanismo de US-3**, e confundir os dois e o erro mais facil
 * desta feature. Sao dois:
 *
 * 1. este argumento de registro, que faz `register_taxonomy()` **criar** o
 *    rotulo e gravar o identificador dele na opcao `default_term_{nome}`
 *    (`taxonomy.php:539` a `:558`). **Nenhum dos oito contextos do nucleo o
 *    declara** — e por isso que `termoPadrao` e `null` nos oito;
 * 2. a opcao gravada que a regra `P3` consulta, e o nome dela **depende do
 *    contexto**: `default_category` para `category`, `default_term_{nome}` para
 *    os demais (`taxonomy.php:2075` e `:2084`, `post.php:5435` e `:5437`).
 *
 * O caminho 2 e o de US-3, e e T007 que o implementa, com o rotulo semeado pelo
 * instalador — *"a instalacao nova cria o rotulo padrao do contexto de
 * categoria, como o instalador do legado faz"* (`plan.md`, Migracao de dados).
 * T001 nao le opcao nenhuma: nao ha porta de opcoes nesta tarefa.
 */
export interface RotuloPadraoDoContexto {
  readonly nome: string;
  readonly slug: string;
  readonly descricao: string;
}

/** A forma aceita na declaracao: so o nome, ou os tres campos. */
export type RotuloPadraoDeclarado =
  | string
  | {
      readonly nome?: string;
      readonly slug?: string;
      readonly descricao?: string;
    };

/**
 * O que se declara ao registrar um contexto. Campo ausente recebe o default do
 * legado, resolvido por {@link resolverContexto}.
 */
export interface DeclaracaoDeContexto {
  /**
   * A que tipos de objeto este contexto se aplica — o `$object_type` de
   * `register_taxonomy()`, e o que CA-1.4 cobra: *"contexto de classificacao e
   * declarado e diz a quais tipos de conteudo se aplica"*.
   *
   * ⚠️ **"Objeto", nao "conteudo".** `link_category` se aplica a `link`, que nao
   * e conteudo, e e exatamente isso que faz a juncao polimorfica servir `posts`
   * **e** `links` (`erd-complete.md` 7.1, relacoes 5 e 10) e que justificou
   * fundir `taxonomias-e-termos` com `links-e-bookmarks` em BC-02. Prender este
   * campo a tipo de conteudo recusaria hoje o que o legado aceita, e a resposta 2
   * proibe.
   */
  readonly tiposDeObjeto: string | readonly string[];
  readonly hierarquico?: boolean;
  readonly descricao?: string;
  readonly publico?: boolean;
  readonly consultavelPublicamente?: boolean | null;
  readonly mostrarNaInterface?: boolean | null;
  readonly mostrarNoMenu?: boolean | null;
  readonly mostrarNuvemDeRotulos?: boolean | null;
  readonly mostrarNaEdicaoRapida?: boolean | null;
  readonly mostrarColunaNoPainel?: boolean;
  readonly capacidades?: Partial<CapacidadesDoContexto>;
  readonly callbackDeContagem?: string;
  readonly ordenar?: boolean | null;
  readonly mostrarNoRest?: boolean;
  readonly baseRest?: string | false;
  readonly namespaceRest?: string | false;
  readonly classeControladoraRest?: string | false;
  readonly rotuloPadrao?: RotuloPadraoDeclarado | null;
  /** `_builtin`: contexto do nucleo. Quem o tem **nao pode ser removido**. */
  readonly integradoAoNucleo?: boolean;
}

/** O contexto registrado, com todos os defaults do legado ja resolvidos. */
export interface ContextoDeClassificacao {
  /** A chave: `term_taxonomy.taxonomy` guarda este nome, nao um identificador. */
  readonly nome: string;
  /** Deduplicado, na ordem em que foi declarado (`class-wp-taxonomy.php:440`). */
  readonly tiposDeObjeto: readonly string[];
  /**
   * `hierarchical`. Default **`false`**, e o default importa: CA-4.2 cobra
   * *"contexto hierarquico aceita termo pai e mantem a arvore; contexto plano
   * recusa hierarquia"*, e dos oito do nucleo **so `category`** e hierarquico.
   */
  readonly hierarquico: boolean;
  readonly descricao: string;
  readonly publico: boolean;
  readonly consultavelPublicamente: boolean;
  readonly mostrarNaInterface: boolean;
  readonly mostrarNoMenu: boolean;
  readonly mostrarNuvemDeRotulos: boolean;
  readonly mostrarNaEdicaoRapida: boolean;
  readonly mostrarColunaNoPainel: boolean;
  readonly capacidades: CapacidadesDoContexto;
  /**
   * `update_count_callback`: o **terceiro** caminho de calculo do contador.
   *
   * ⚠️ `BR-MIGRAR-078` conta duas definicoes de "quantos" na mesma coluna
   * `term_taxonomy.count` — `_update_post_term_count()` conta so
   * `post_status = 'publish'` e `_update_generic_term_count()` e `COUNT(*)` sem
   * filtro — e acrescenta que *"a taxonomia pode declarar
   * `update_count_callback` proprio"*, caminho que a propria regra chama de
   * *"nao expressavel em SQL de jeito nenhum"*.
   *
   * **A escolha entre os dois primeiros nao e propriedade de registro, e por
   * isso nao esta neste tipo:** `wp_update_term_count_now()`
   * (`taxonomy.php:3625`) a decide **na hora de contar**, perguntando se *todos*
   * os `tiposDeObjeto` sao tipo de conteudo registrado (`post_type_exists`) —
   * leitura de `plataforma/tipos-de-conteudo`, por ligacao tardia. E o que faz
   * `link_category`, cujo tipo e `link`, cair no calculo generico. Quem resolve
   * isso e a tarefa do contador, nao T001.
   *
   * Vazio nos oito do nucleo.
   */
  readonly callbackDeContagem: string;
  /** `sort`: preserva `term_relationships.term_order`. Nulo nos oito. */
  readonly ordenar: boolean | null;
  readonly mostrarNoRest: boolean;
  readonly baseRest: string | false;
  readonly namespaceRest: string | false;
  readonly classeControladoraRest: string | false;
  /** Ver {@link RotuloPadraoDoContexto}: **nulo nos oito do nucleo**. */
  readonly rotuloPadrao: RotuloPadraoDoContexto | null;
  readonly integradoAoNucleo: boolean;
}

/** `array_unique( (array) $object_type )`: mantem a primeira ocorrencia e a ordem. */
function tiposDeObjetoDeclarados(
  declarado: string | readonly string[],
): readonly string[] {
  const lista = typeof declarado === 'string' ? [declarado] : declarado;
  return [...new Set(lista)];
}

/** `wp_parse_args( $args['default_term'], array( name, slug, description ) )`. */
function resolverRotuloPadrao(
  declarado: RotuloPadraoDeclarado | null | undefined,
): RotuloPadraoDoContexto | null {
  // `if ( ! empty( $args['default_term'] ) )`: string vazia nao conta como
  // declaracao, como nao conta no legado.
  if (declarado === null || declarado === undefined || declarado === '') {
    return null;
  }

  if (typeof declarado === 'string') {
    return { nome: declarado, slug: '', descricao: '' };
  }

  return {
    nome: declarado.nome ?? '',
    slug: declarado.slug ?? '',
    descricao: declarado.descricao ?? '',
  };
}

/**
 * Resolve a declaracao nos valores que o legado resolveria — a parte pura de
 * `set_props()`.
 *
 * A **ordem** das derivacoes e a do legado, e ela nao e comutativa:
 * `consultavelPublicamente` sai de `publico`, `mostrarNaInterface` sai de
 * `publico`, e `mostrarNoMenu`, `mostrarNuvemDeRotulos` e
 * `mostrarNaEdicaoRapida` saem de `mostrarNaInterface` **ja resolvido**
 * (`class-wp-taxonomy.php:370` a `:423`). Resolver numa ordem diferente muda o
 * resultado de um contexto que declare `publico: false` e nada mais.
 *
 * ⚠️ E `mostrarNoMenu` tem a condicao estranha do legado, reproduzida:
 * `if ( null === $args['show_in_menu'] || ! $args['show_ui'] )`. Com
 * `mostrarNaInterface` falso, **um `mostrarNoMenu: true` declarado e descartado**
 * — nao vence. Um porte que respeitasse a declaracao poria no menu um contexto
 * que o legado esconde.
 */
export function resolverContexto(
  nome: string,
  declaracao: DeclaracaoDeContexto,
): ContextoDeClassificacao {
  const publico = declaracao.publico ?? true;

  const consultavelPublicamente =
    declaracao.consultavelPublicamente ?? publico;

  const mostrarNaInterface = declaracao.mostrarNaInterface ?? publico;

  const mostrarNoMenuDeclarado = declaracao.mostrarNoMenu ?? null;
  const mostrarNoMenu =
    mostrarNoMenuDeclarado === null || !mostrarNaInterface
      ? mostrarNaInterface
      : mostrarNoMenuDeclarado;

  const mostrarNoRest = declaracao.mostrarNoRest ?? false;
  const namespaceRestDeclarado = declaracao.namespaceRest ?? false;

  return {
    nome,
    tiposDeObjeto: tiposDeObjetoDeclarados(declaracao.tiposDeObjeto),
    hierarquico: declaracao.hierarquico ?? false,
    descricao: declaracao.descricao ?? '',
    publico,
    consultavelPublicamente,
    mostrarNaInterface,
    mostrarNoMenu,
    mostrarNuvemDeRotulos:
      declaracao.mostrarNuvemDeRotulos ?? mostrarNaInterface,
    mostrarNaEdicaoRapida:
      declaracao.mostrarNaEdicaoRapida ?? mostrarNaInterface,
    mostrarColunaNoPainel: declaracao.mostrarColunaNoPainel ?? false,
    capacidades: {
      ...CAPACIDADES_PADRAO_DO_CONTEXTO,
      ...declaracao.capacidades,
    },
    callbackDeContagem: declaracao.callbackDeContagem ?? '',
    ordenar: declaracao.ordenar ?? null,
    mostrarNoRest,
    baseRest: declaracao.baseRest ?? false,
    // `if ( false === $args['rest_namespace'] && ! empty( $args['show_in_rest'] ) )`
    namespaceRest:
      namespaceRestDeclarado === false && mostrarNoRest
        ? 'wp/v2'
        : namespaceRestDeclarado,
    classeControladoraRest: declaracao.classeControladoraRest ?? false,
    rotuloPadrao: resolverRotuloPadrao(declaracao.rotuloPadrao),
    integradoAoNucleo: declaracao.integradoAoNucleo ?? false,
  };
}
