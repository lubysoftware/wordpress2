/**
 * Os nomes de criterio de consulta que o legado aceita — as duas listas de `WP`,
 * `wp-includes/class-wp.php:18` (publicos) e `:28` (privados).
 *
 * E a primeira metade da entrega de T002 (*"as regras de traducao do legado
 * estao declaradas como dado, nao como codigo"*): sem a lista de nomes, nenhum
 * criterio direto e coletado, porque a coleta de `class-wp.php:319` percorre
 * **esta** lista e nao o que veio na requisicao. Quem porta ao contrario — lendo
 * os parametros da requisicao e aceitando o que encontra — produz um sistema que
 * aceita criterio que o legado descarta, e isso e superficie de entrada nova.
 *
 * ---
 *
 * ## ⚠️ A contagem de `requisicao/endereco-pedido.ts` estava errada, e esta
 * corrigida ali tambem
 *
 * O cabecalho merged de T001 diz *"47 nomes publicos e 25 privados"*. A contagem
 * mecanica das duas linhas do legado da **46** e **26**. As duas listas abaixo
 * sao transcricao literal, e nenhum nome foi acrescentado nem tirado; o total
 * (72) e o mesmo, o que explica como o erro passou. A linha de
 * `endereco-pedido.ts` foi corrigida nesta tarefa, que e a que traz as listas.
 *
 * ## `post_type` esta nas DUAS listas, e isso e do legado
 *
 * Ele e o 45o publico e o 6o privado. A consequencia e observavel: `post_type`
 * entra pela requisicao (porque e publico) **e** pode ser reescrito na passagem
 * dos privados (`:392-396`), que le so `extra_query_vars`. Como a primeira
 * ramificacao da coleta publica tambem le `extra_query_vars` primeiro
 * (`:320-321`), o valor final e o mesmo — mas um porte que "limpasse" a
 * duplicacao perderia o fato de que o nome aparece duas vezes na ordem de
 * construcao, e a ordem e observavel (ver abaixo).
 *
 * ## A ordem destas listas e observavel, e nao e enfeite
 *
 * `WP::$query_vars` e construido percorrendo a lista publica na ordem dela, e
 * depois a privada na ordem dela (`:319` e `:392`). Essa ordem de insercao e lida
 * por `WP::build_query_string()`, que monta `WP::$query_string` percorrendo
 * `array_keys( $this->query_vars )` (`class-wp.php:612`) e a entrega ao ponto de
 * extensao `query_string`. Reordenar as listas troca o texto que esse ponto
 * recebe, e o **P2** poe argumento de ponto de extensao no contrato publico.
 *
 * ## O que cada lista decide, em uma linha
 *
 * | lista | de onde o valor pode vir | legado |
 * |---|---|---|
 * | publica | `extra_query_vars`, corpo da requisicao, consulta da requisicao, regra de traducao casada — nessa ordem de precedencia | `:319-336` |
 * | privada | **so** `extra_query_vars` | `:392-396` |
 *
 * 🔴 **A consequencia que a feature `004` inteira depende, e que e facil
 * perder:** `posts_per_page` e nome **privado**. O tamanho da pagina publica
 * (que nasce em 10, `wp-admin/includes/schema.php:434`, e que US-3 cobra) **nao
 * pode ser trocado pelo endereco**: quem visita nao tem caminho para ele, porque
 * a requisicao so alimenta nomes publicos. Um porte que colete criterio por
 * nome, sem as duas listas, entrega ao visitante o controle do tamanho da
 * listagem — e o legado nunca entregou.
 */

/**
 * O ponto de extensao `query_vars` (`wp-includes/class-wp.php:311`).
 *
 * Filtra a **lista de nomes** aceitos, nao os valores, e dispara **antes** da
 * coleta. Devolve valor: o retorno substitui a lista. O docblock do legado e
 * explicito sobre os tres usos — *"added, removed, or changed"* —, logo um porte
 * que so permitisse acrescentar fecharia o ponto.
 *
 * Ele existe para que regra de traducao de terceiro possa usar criterio proprio:
 * sem acrescentar o nome aqui, o valor que a regra produz e descartado na coleta,
 * porque `:334` so le a regra casada para nome que esta na lista.
 */
export type IntercepcaoDeNomesDeCriterio = (
  nomes: readonly string[],
) => readonly string[];

/**
 * Os **46** nomes publicos, na ordem de `WP::$public_query_vars`
 * (`wp-includes/class-wp.php:18`).
 *
 * `error` esta aqui, e e por isso que uma regra de traducao consegue produzir
 * uma resposta de erro: a regra herdada de `wp-app.php` casa para
 * `index.php?error=403` (`wp-includes/class-wp-rewrite.php:1296`), o valor chega
 * aos criterios pela coleta e o envio de cabecalhos o transforma em codigo HTTP
 * (`class-wp.php:455-466`).
 */
export const NOMES_PUBLICOS_DE_CRITERIO: readonly string[] = Object.freeze([
  'm',
  'p',
  'posts',
  'w',
  'cat',
  'withcomments',
  'withoutcomments',
  's',
  'search',
  'exact',
  'sentence',
  'calendar',
  'page',
  'paged',
  'more',
  'tb',
  'pb',
  'author',
  'order',
  'orderby',
  'year',
  'monthnum',
  'day',
  'hour',
  'minute',
  'second',
  'name',
  'category_name',
  'tag',
  'feed',
  'author_name',
  'pagename',
  'page_id',
  'error',
  'attachment',
  'attachment_id',
  'subpost',
  'subpost_id',
  'preview',
  'robots',
  'favicon',
  'taxonomy',
  'term',
  'cpage',
  'post_type',
  'embed',
]);

/**
 * Os **26** nomes privados, na ordem de `WP::$private_query_vars`
 * (`wp-includes/class-wp.php:28`).
 *
 * Nenhum deles chega pela requisicao. Sao os nomes com que o proprio nucleo
 * monta a consulta por dentro — paginacao, estado, recorte por identificador —, e
 * o caminho deles e `extra_query_vars`, que e o argumento de
 * `WP::parse_request()` e vem de `WP::main( $query_args )` (`:819` e `:822`), ou
 * seja: de quem chama, nao de quem visita.
 */
export const NOMES_PRIVADOS_DE_CRITERIO: readonly string[] = Object.freeze([
  'offset',
  'posts_per_page',
  'posts_per_archive_page',
  'showposts',
  'nopaging',
  'post_type',
  'post_status',
  'category__in',
  'category__not_in',
  'category__and',
  'tag__in',
  'tag__not_in',
  'tag__and',
  'tag_slug__in',
  'tag_slug__and',
  'tag_id',
  'post_mime_type',
  'perm',
  'comments_per_page',
  'post__in',
  'post__not_in',
  'post_parent',
  'post_parent__in',
  'post_parent__not_in',
  'title',
  'fields',
]);

/**
 * Aplica o ponto de extensao `query_vars` sobre a lista publica
 * (`wp-includes/class-wp.php:311`).
 *
 * Cada interceptador recebe o que o anterior devolveu, como em `apply_filters`.
 * A lista de partida e {@link NOMES_PUBLICOS_DE_CRITERIO} quando ninguem a
 * informa — e ela chega por argumento, e nao por leitura de estado de modulo,
 * porque no legado `WP::$public_query_vars` e propriedade de **instancia** e o
 * filtro a reescreve por requisicao (BR-MIGRAR-105, `EXT-CONTEXTO`).
 */
export function nomesPublicosFiltrados(
  intercepcoes: readonly IntercepcaoDeNomesDeCriterio[] = [],
  nomes: readonly string[] = NOMES_PUBLICOS_DE_CRITERIO,
): readonly string[] {
  let lista = nomes;
  for (const intercepcao of intercepcoes) {
    lista = intercepcao(lista);
  }
  return lista;
}
