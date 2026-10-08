/**
 * **CA-4.4**: o conteudo privado nao aparece em listagem publica, feed nem
 * sitemap.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). Os tres
 * lugares do criterio sao **dois** mecanismos no legado, e confundi-los produz
 * um sistema que vaza conteudo privado por uma das tres portas:
 *
 * | onde | como o legado decide | anonimo ve privado? | quem tem `read_private_posts` ve? |
 * |---|---|---|---|
 * | listagem publica e **feed** | a clausula de estado da consulta principal, montada a partir do **registro de estados** | nao | **sim** |
 * | sitemap | `post_status` **literal** no pedido da consulta | nao | **nao** |
 *
 * A diferenca e a razao de este arquivo existir: a listagem e o feed sao a mesma
 * consulta e **mostram** o privado a quem pode le-lo; o sitemap nao mostra a
 * ninguem, porque ele nao pergunta nada — ele fixa `publish` no pedido. Um porte
 * que unificasse os dois ou poria privado no mapa do site, o que entrega
 * endereco a buscador, ou esconderia privado da propria listagem de quem o pode
 * ler.
 *
 * ---
 *
 * # A listagem publica e o feed: o registro de estados decide, nao uma lista
 *
 * `WP_Query::get_posts()`, no ramo `! $this->is_singular`
 * (`wp-includes/class-wp-query.php:2717`-`:2778`), monta a clausula por tipo
 * consultado, nesta ordem:
 *
 * ```php
 * // Public statuses.                                              // :2738
 * $public_statuses = get_post_stati( array( 'public' => true ) );
 * foreach ( $public_statuses as $public_status ) { ... }
 *
 * // Add protected states that should show in the admin all list.  // :2746
 * if ( $this->is_admin ) { ... }
 *
 * // Add private states that are visible to current user.          // :2759
 * if ( is_user_logged_in() && $queried_post_type_object instanceof WP_Post_Type ) {
 *     $read_private_cap = $queried_post_type_object->cap->read_private_posts;
 *     $private_statuses = get_post_stati( array( 'private' => true ) );
 *     foreach ( $private_statuses as $private_status ) {
 *         $type_where .= current_user_can( $read_private_cap )
 *             ? " OR post_status = '$private_status'"
 *             : " OR ( post_author = $user_id AND post_status = '$private_status' )";
 *     }
 * }
 * ```
 *
 * Quatro coisas que isso fixa:
 *
 * 1. **Os estados publicos saem do registro, nao de um literal.**
 *    `get_post_stati( array( 'public' => true ) )`
 *    (`wp-includes/post.php:1579`) consulta `$wp_post_statuses`, que
 *    `register_post_status()` alimenta — e esse e ponto de extensao publico
 *    (**P2**). Por isso {@link estadosComAPropriedade} recebe o **registro** por
 *    argumento em lugar de devolver uma lista congelada: uma lista fixa deixaria
 *    de fora todo estado publico registrado por extensao, e o **P2** poe
 *    estreitar ponto de extensao na tabela *Nao negociavel*. Na instalacao de
 *    fabrica o resultado e `['publish']`, e e so.
 * 2. **O privado entra para quem esta autenticado, de um jeito ou de outro.**
 *    Nao ha ramo que o deixe de fora: com a capacidade, entram **todos** os
 *    privados; sem ela, entram os privados **do proprio autor**. O que nao
 *    existe e o ramo do anonimo — `is_user_logged_in()` e a condicao externa —, e
 *    e isso que faz CA-4.4 valer para o visitante.
 * 3. **O autor ve o proprio privado na listagem sem ter `read_private_posts`.**
 *    E a mesma assimetria da leitura (`read_post` resolve em `read` para o
 *    autor, `leitura-de-conteudo-privado.ts`), e aqui ela aparece como um
 *    recorte por `post_author` dentro da consulta. Um porte que a perdesse
 *    sumiria, da listagem do autor, o conteudo que ele mesmo tornou privado.
 * 4. **O nome da capacidade e do tipo consultado**, nao uma cadeia fixa:
 *    `$queried_post_type_object->cap->read_private_posts`. Listar paginas
 *    privadas exige `read_private_pages`.
 *
 * **O feed e esta mesma consulta.** `do_feed()`
 * (`wp-includes/functions.php:1612`) e despachada sobre a consulta principal ja
 * montada, e nao refaz clausula de estado nenhuma — logo nao ha regra de feed a
 * portar: ha a regra da listagem, e o feed a herda. Essa heranca e o que torna
 * *"listagem publica, feed"* uma linha so em CA-4.4. Um porte que escrevesse uma
 * consulta propria para o feed teria de repetir a clausula, e e ai que o vazamento
 * entra.
 *
 * ---
 *
 * # O sitemap: um literal, e por isso ele e diferente dos outros dois
 *
 * `WP_Sitemaps_Posts` fixa o estado no arranjo de pedido, duas vezes:
 *
 * | onde | pedido | para que |
 * |---|---|---|
 * | `class-wp-sitemaps-posts.php:123` | `'post_status' => 'publish'` | a data da ultima atualizacao da home |
 * | `class-wp-sitemaps-posts.php:244` | `'post_status' => array( 'publish' )` | a lista de enderecos de cada pagina do mapa |
 *
 * Pedido explicito de `post_status` desvia a consulta para o **primeiro** ramo
 * da clausula (`class-wp-query.php:2654`), que e outro codigo: ali o privado so
 * entraria se fosse **pedido** por nome, e o sitemap nao o pede. Logo o mapa do
 * site nao tem privado para ninguem — nem para o super administrador —, e nao
 * porque alguem verificou capacidade, mas porque ninguem perguntou. Esta e a
 * razao de {@link ESTADOS_DO_MAPA_DO_SITE} ser uma constante congelada enquanto
 * {@link estadosComAPropriedade} e uma funcao: no legado um e literal e o outro
 * e consulta ao registro.
 *
 * ⚠️ **Nao confundir com a senha de conteudo.** CA-6.6 da feature 004 e
 * explicito no sentido oposto — *"o conteudo protegido continua aparecendo em
 * sitemap e listagem: a protecao e do corpo, nao da existencia"*. Privado e
 * protegido por senha sao os dois mecanismos que o `switch` de visibilidade
 * separa (`visibilidade-do-conteudo.ts`), e eles escondem coisas diferentes: o
 * privado esconde a **existencia**, a senha esconde o **corpo**.
 *
 * ---
 *
 * # O que este arquivo NAO faz
 *
 * - **Nao monta SQL.** A clausula de estado e da consulta publica, que e a
 *   feature **004** (`contextos/leitura-publica/`), e a regra de dependencia 3
 *   proibe aquele contexto importar este. O que esta aqui e a **regra** que
 *   decide quais estados entram, do ponto de vista de BC-01, que e o dono do
 *   vocabulario de estado; quem a montar em SQL a reconstroi sobre a mesma
 *   `../estado-editorial.ts`.
 * - **Nao traz o ramo do painel.** Os estados protegidos que entram na lista
 *   "Todos" quando `is_admin` (`class-wp-query.php:2746`-`:2757`) decidem a
 *   **listagem do painel**, nao a publica, e nenhum criterio de US-4 fala dela.
 *   O sinalizador que os separa — `visivelNaListaDeTodos` — ja esta declarado em
 *   `../estado-editorial.ts`, para quem precisar.
 * - **Nao pergunta capacidade.** `podeLerConteudoPrivado` chega como booleano
 *   **ja respondido**, porque a pergunta e por tipo consultado e porque quem
 *   monta a consulta tem o tipo em maos. Perguntar aqui obrigaria este arquivo a
 *   receber o registro do tipo e a base de autorizacao para decidir uma coisa
 *   que o chamador ja sabe.
 */

import {
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
  type PropriedadesDeEstadoEditorial,
} from '../estado-editorial.js';

/**
 * O registro de estados, como `$wp_post_statuses` — **aberto**, porque
 * `register_post_status()` e ponto de extensao publico.
 *
 * A chave e o nome do estado e o valor sao as propriedades efetivas dele. Na
 * instalacao de fabrica o registro e {@link REGISTRO_DE_FABRICA}; em execucao
 * ele tem tambem o que as extensoes registraram, e e por isso que este tipo e um
 * `Record` de chave aberta e nao `Record<EstadoEditorial, ...>`.
 */
export type RegistroDeEstados = Readonly<
  Record<string, PropriedadesDeEstadoEditorial>
>;

/**
 * O registro como a instalacao nova o tem: os 12 estados de fabrica.
 *
 * E o mesmo objeto de `../estado-editorial.ts`, com o nome do que ele e **neste
 * caminho** — o retrato do registro no fim de
 * `create_initial_post_types()`. Quem tiver o registro vivo
 * (`plataforma/tipos-de-conteudo/`, que nao existe nesta arvore) passa aquele, e
 * nao este.
 */
export const REGISTRO_DE_FABRICA: RegistroDeEstados =
  PROPRIEDADES_DO_ESTADO_EDITORIAL;

/**
 * Os estados que o sitemap pede, **literalmente** — `['publish']`.
 *
 * Congelado porque no legado e um literal, e nao uma consulta ao registro:
 * `'post_status' => array( 'publish' )`
 * (`wp-includes/sitemaps/providers/class-wp-sitemaps-posts.php:244`, e
 * `'post_status' => 'publish'` em `:123`). Ver a secao do sitemap no cabecalho.
 */
export const ESTADOS_DO_MAPA_DO_SITE: readonly string[] = Object.freeze([
  'publish',
]);

/**
 * `get_post_stati( array( $propriedade => true ) )`
 * (`wp-includes/post.php:1579`).
 *
 * **A ordem e a do registro**, e ela e dado: `$wp_post_statuses` e um arranjo
 * associativo alimentado por insercao e `wp_list_filter()` preserva a ordem,
 * logo a sequencia de `OR` da clausula segue a ordem de registro — e a area 3 da
 * Decisao 2 compara a sequencia de comandos. Iterar as chaves do registro
 * preserva essa ordem.
 *
 * Recebe o registro por argumento de proposito: ver o item 1 do cabecalho.
 */
export function estadosComAPropriedade(
  registro: RegistroDeEstados,
  propriedade: keyof PropriedadesDeEstadoEditorial,
): readonly string[] {
  const encontrados: string[] = [];
  for (const nome of Object.keys(registro)) {
    const propriedades = registro[nome];
    if (propriedades !== undefined && propriedades[propriedade]) {
      encontrados.push(nome);
    }
  }
  return encontrados;
}

/** Quem pergunta, do ponto de vista da clausula de estado. */
export interface AtorNaConsultaPublica {
  /** `is_user_logged_in()`. O visitante anonimo e `false`. */
  readonly autenticado: boolean;
  /**
   * `current_user_can( $queried_post_type_object->cap->read_private_posts )`,
   * **ja respondido** — ver o ultimo item do cabecalho.
   */
  readonly podeLerConteudoPrivado: boolean;
}

/**
 * O recorte de estados que a consulta publica admite para um ator.
 *
 * Sao duas listas e nao uma porque o legado produz duas clausulas diferentes:
 * uma solta e uma presa ao autor.
 */
export interface RecorteDaConsultaPublica {
  /**
   * Os estados admitidos **sem condicao de autoria** — a clausula
   * `post_status = '...'`.
   */
  readonly estados: readonly string[];
  /**
   * Os estados admitidos **somente nas linhas do proprio ator** — a clausula
   * `( post_author = $user_id AND post_status = '...' )`.
   *
   * Lista vazia e afirmacao: e o recorte do anonimo e o de quem tem a
   * capacidade, pelos dois motivos opostos do item 2 do cabecalho.
   */
  readonly estadosDoProprioAutor: readonly string[];
}

/**
 * **CA-4.4.** Os estados que a listagem publica e o feed admitem para aquele
 * ator — `class-wp-query.php:2738`-`:2766`.
 *
 * Os tres recortes que saem daqui, com o registro de fabrica:
 *
 * | ator | `estados` | `estadosDoProprioAutor` |
 * |---|---|---|
 * | visitante anonimo | `['publish']` | `[]` |
 * | autenticado sem `read_private_posts` | `['publish']` | `['private']` |
 * | autenticado com `read_private_posts` | `['publish', 'private']` | `[]` |
 *
 * A primeira linha e CA-4.4: para quem nao tem conta, privado nao esta em
 * nenhuma das duas listas, logo nenhuma clausula da consulta o alcanca.
 *
 * A **ordem** de `estados` e a do registro, e os publicos vem antes dos
 * privados, porque e nessa ordem que o legado concatena os `OR`.
 */
export function recorteDaConsultaPublica(
  registro: RegistroDeEstados,
  ator: AtorNaConsultaPublica,
): RecorteDaConsultaPublica {
  // `:2739`: os estados publicos, primeiro e para todo mundo.
  const estados = [...estadosComAPropriedade(registro, 'publico')];
  const estadosDoProprioAutor: string[] = [];

  // `:2746`-`:2757`: o ramo `is_admin`, que nao e desta historia. Ver o
  // cabecalho — ele entraria exatamente aqui, entre os dois.

  // `:2760`-`:2766`: os privados, e so para quem tem sessao.
  if (ator.autenticado) {
    for (const estado of estadosComAPropriedade(registro, 'privado')) {
      if (ator.podeLerConteudoPrivado) {
        estados.push(estado);
      } else {
        estadosDoProprioAutor.push(estado);
      }
    }
  }

  return {
    estados: Object.freeze(estados),
    estadosDoProprioAutor: Object.freeze(estadosDoProprioAutor),
  };
}

/**
 * Se aquele estado aparece no mapa do site.
 *
 * Nao consulta propriedade nenhuma, e e esse o ponto: o sitemap pede estado por
 * **nome**. Ver a secao do sitemap no cabecalho.
 */
export function estadoEntraNoMapaDoSite(estado: string): boolean {
  return ESTADOS_DO_MAPA_DO_SITE.includes(estado);
}
