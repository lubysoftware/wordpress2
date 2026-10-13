/**
 * A ordenacao declarada da listagem publica — o bloco de `order` e `orderby` de
 * `WP_Query::get_posts()` (`wp-includes/class-wp-query.php:2494-2556`) e o
 * `WP_Query::parse_order()` que ele chama (`:1826-1837`).
 *
 * Entrega de **T007** (US-3, CA-3.4: *"a ordenacao da listagem e declarada e
 * estavel entre paginas"*).
 *
 * ---
 *
 * ## Por que esta tarefa tem de resolver a ordenacao, e nao so a janela
 *
 * Porque **paginar sem ordem declarada nao pagina**: duas paginas pedidas com
 * ordens diferentes podem repetir um registro e esconder outro, e nenhuma das
 * duas estaria errada do ponto de vista do banco. A estabilidade de CA-3.4 nao
 * vem de uma garantia nova — vem de a ordenacao ser resolvida **a partir dos
 * criterios**, que nao dependem da pagina pedida. `paged` e `offset` entram na
 * janela (`./paginacao-da-listagem.ts`) e em lugar nenhum daqui.
 *
 * E `order`/`orderby` nao chegam resolvidos de T003: `fill_query_vars()` nao os
 * preenche (os 52 nomes estao em `./criterios-da-consulta.ts`, e os dois nao
 * estao entre eles), logo **so** este bloco de `get_posts()` os decide. Sem ele,
 * o default da listagem publica seria o que o repositorio escolhesse.
 *
 * ## As quatro decisoes do bloco, na ordem em que o legado as toma
 *
 * | # | decisao | legado |
 * |---|---|---|
 * | 1 | `rand` apaga a direcao — ordenar ao acaso nao tem sentido ascendente | `:2494` |
 * | 2 | a direcao, por `parse_order()`, e o default e **`DESC`** | `:2495-2499` |
 * | 3 | tres chaves ignoram a direcao, porque elas **sao** a ordem | `:2502-2505` |
 * | 4 | as chaves: o default `post_date`, o apagamento, ou a lista pedida | `:2507-2556` |
 *
 * A decisao 2 escreve em `$query_vars['order']`, que e referencia para
 * `$this->query_vars` (`:1919`): a direcao resolvida e **observavel** por
 * `get_query_var( 'order' )` e pelo que `WP::register_globals()` publica. A
 * decisao 1 e a 3 escrevem no mesmo lugar, e e por isso que as tres estao aqui e
 * nao no repositorio.
 *
 * ## ⚠️ `parse_order()` recusa o que nao e texto, e o default aparece em tres formas
 *
 * `! is_string( $order ) || empty( $order )` devolve `DESC` (`:1827-1829`). Logo
 * `order=0`, `order=''` e `order` ausente dao o mesmo `DESC` — e `order=asc`,
 * `order=ASC` e `order=Asc` dao `ASC`, porque a comparacao e depois de
 * `strtoupper()`. Qualquer outro texto, inclusive `order=descendente`, da `DESC`:
 * o legado nao recusa valor invalido, ele o trata como o default.
 *
 * ## 🔴 Arranjo de ordenacao: a CHAVE e o campo, e numa lista isso apaga a ordem
 *
 * No ramo de arranjo (`:2522-2531`) o legado percorre `$orderby as $_orderby =>
 * $order`: o **nome** vem da chave e a **direcao** do valor. Um arranjo
 * associativo — `array( 'title' => 'ASC' )` — nao e representavel em
 * `ValorDaConsulta`, e o que e representavel e a **lista**: ali as chaves sao os
 * indices `0`, `1`, `2`, nenhum deles passa por `parse_orderby()`, e a ordenacao
 * sai **vazia**. Esta funcao reproduz isso devolvendo as chaves `'0'`, `'1'`,
 * `'2'` — e e o repositorio que as descarta, porque e dele a lista de chaves
 * permitidas.
 *
 * ⚠️ O ramo de arranjo **nao** tem a volta ao `post_date` que o ramo de texto tem
 * (`:2548-2550`). Um arranjo que nao produza nenhuma chave valida apaga a
 * clausula de ordem; um texto que nao produza nenhuma volta ao `post_date`. Sao
 * dois caminhos diferentes para a mesma entrada invalida, e e assim no legado.
 *
 * ## O que este arquivo deliberadamente NAO tem
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | `parse_orderby()`: a lista de chaves permitidas, o prefixo de tabela, `RAND(x)`, os apelidos de `meta_query` e o `FIELD( ... )` de `post__in` | `:1698-1815` | do repositorio, que e quem monta SQL — a razao esta em `./conteudo-consultado.ts`. E dele tambem o descarte da chave nao permitida e a volta ao `post_date` quando todas caem (`:2548-2552`) |
 * | o texto `ORDER BY` montado, com o `implode` e a direcao repetida | `:2544` e `:2553` | idem |
 * | a ordenacao por relevancia de busca e o ponto de filtro `posts_search_orderby` | `:2558-2590`, `:1643-1685` | de quem portar a busca: ela depende de `search_orderby_title`, que `:1463-1515` monta com `wpdb->prepare` |
 */

import {
  adicionarBarras,
  decodificarUrl,
} from '../traducao-de-endereco/cadeia-de-consulta.js';
import {
  escalarComoNoPhp,
  vazioComoNoPhp,
  type ValorDaConsulta,
} from './semantica-de-php.js';

/**
 * A direcao de uma ordenacao, nos tres valores que o legado grava em
 * `$query_vars['order']`.
 *
 * O texto vazio **nao** e ausencia de direcao invalida: e a direcao que `rand` e
 * as tres chaves de `:2502` produzem, e ele chega ao SQL como `ORDER BY RAND()`,
 * sem sufixo.
 */
export type DirecaoDeOrdenacao = 'ASC' | 'DESC' | '';

/** O default de `parse_order()` (`class-wp-query.php:1828`). */
export const DIRECAO_PADRAO: DirecaoDeOrdenacao = 'DESC';

/**
 * O campo que a listagem publica ordena quando ninguem pede outro
 * (`class-wp-query.php:2516`, `"{$wpdb->posts}.post_date "`).
 *
 * E a data de publicacao, e ela com `DESC` e a ordem da home de qualquer
 * instalacao nova: o mais recente primeiro.
 */
export const CAMPO_DE_ORDENACAO_PADRAO = 'post_date';

/** O valor de `orderby` que apaga a clausula de ordem (`:2518`). */
export const ORDENACAO_APAGADA = 'none';

/**
 * As tres chaves que ignoram a direcao pedida (`:2502`).
 *
 * *"These values of orderby should ignore the 'order' parameter"* — as tres
 * ordenam pela ordem dos identificadores informados, logo a ordem **e** o
 * criterio e nao ha ascendente nem descendente a aplicar.
 */
export const CHAVES_QUE_IGNORAM_A_DIRECAO: readonly string[] = Object.freeze([
  'post__in',
  'post_name__in',
  'post_parent__in',
]);

/** O valor de `orderby` que pede ordem ao acaso (`:2494`). */
export const ORDENACAO_AO_ACASO = 'rand';

/** Uma chave de ordenacao pedida, com a direcao que vale para ela. */
export interface ChaveDeOrdenacao {
  /**
   * O nome pedido, **ainda nao** filtrado por `parse_orderby()` — ver a ultima
   * tabela do cabecalho deste arquivo.
   */
  readonly chave: string;
  readonly direcao: DirecaoDeOrdenacao;
}

/** A ordenacao declarada de uma consulta de listagem. */
export interface OrdenacaoResolvida {
  /** `$query_vars['order']` depois de `parse_order()` e das duas excecoes. */
  readonly direcao: DirecaoDeOrdenacao;
  /** As chaves pedidas, na ordem em que o legado as percorre. */
  readonly chaves: readonly ChaveDeOrdenacao[];
  /**
   * A ordenacao e a de fabrica: ninguem pediu `orderby` e o legado caiu no
   * `post_date` de `:2516`.
   *
   * Nao e derivavel de {@link OrdenacaoResolvida.chaves}, porque `orderby=post_date`
   * explicito produz a mesma chave por outro caminho — e, ao contrario do
   * default, esse passa por `parse_orderby()`.
   */
  readonly peloPadrao: boolean;
}

/**
 * `WP_Query::parse_order()` (`class-wp-query.php:1826-1837`).
 *
 * ⚠️ `strtoupper()` do interpretador e so ASCII, e `toUpperCase()` deste runtime
 * nao e — a diferenca nao muda nada aqui, porque nenhum texto fora do ASCII
 * sobe para exatamente `ASC`.
 */
export function direcaoComoNoLegado(
  pedida: ValorDaConsulta | undefined,
): DirecaoDeOrdenacao {
  // `:1827-1829` — numero, arranjo e vazio caem no default, sem recusa.
  if (typeof pedida !== 'string' || vazioComoNoPhp(pedida)) {
    return DIRECAO_PADRAO;
  }
  return pedida.toUpperCase() === 'ASC' ? 'ASC' : DIRECAO_PADRAO;
}

/**
 * Resolve a ordenacao declarada da listagem.
 *
 * Trabalha **no lugar** sobre os criterios, como `resolverPaginacao`, porque a
 * direcao resolvida e o `orderby` decodificado sao escritos em `$query_vars` por
 * referencia (`:1919`) e e esse conjunto que o tema recebe.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). A ordem em que
 * o conteudo publico aparece nao e decisao de autorizacao: o portao de estado e
 * T009 (US-4).
 */
export function resolverOrdenacao(
  criterios: Record<string, ValorDaConsulta>,
): OrdenacaoResolvida {
  const pedida = criterios['orderby'];

  // `:2494` — a comparacao e ESTRITA: so o texto `'rand'`, e nao `'RAND'` nem
  // `'rand()'`.
  const aoAcaso = pedida === ORDENACAO_AO_ACASO;

  // `:2495-2499` — ausente ou presente, o resultado passa pelo mesmo `rand`.
  let direcao: DirecaoDeOrdenacao = aoAcaso
    ? ''
    : direcaoComoNoLegado(criterios['order']);

  // `:2502-2505` — `in_array( ..., true )`, tambem estrito.
  if (
    typeof pedida === 'string' &&
    CHAVES_QUE_IGNORAM_A_DIRECAO.includes(pedida)
  ) {
    direcao = '';
  }
  criterios['order'] = direcao;

  // `:2508-2520` — o vazio tem dois significados, e o proprio legado os separa
  // em comentario: *"Boolean false or empty array blanks out ORDER BY, while
  // leaving the value unset or otherwise empty sets the default"*.
  if (vazioComoNoPhp(pedida)) {
    if (pedida !== undefined && !escalarComoNoPhp(pedida)) {
      // `:2513-2514` — arranjo vazio apaga a ordem. O `false === $orderby` do
      // mesmo teste nao e representavel em `ValorDaConsulta` (ver a tabela de
      // `./paginacao-da-listagem.ts`), e nenhuma regra do nucleo o produz.
      return ordenacao(direcao, [], false);
    }
    // `:2516` — o default: a data de publicacao com a direcao resolvida.
    return ordenacao(
      direcao,
      [{ chave: CAMPO_DE_ORDENACAO_PADRAO, direcao }],
      true,
    );
  }

  // `:2518-2519`.
  if (pedida === ORDENACAO_APAGADA) {
    return ordenacao(direcao, [], false);
  }

  // `:2522-2531` — arranjo: a chave e o campo e o valor e a direcao. Ver o ramo
  // 🔴 do cabecalho.
  if (!escalarComoNoPhp(pedida)) {
    const chaves = (pedida ?? []).map((valorDaEntrada, indice) => ({
      chave: adicionarBarras(decodificarUrl(String(indice))),
      direcao: direcaoComoNoLegado(valorDaEntrada),
    }));
    return ordenacao(direcao, chaves, false);
  }

  // `:2533-2534` — as duas conversoes, gravadas de volta nos criterios **antes**
  // do recorte.
  const decodificada = adicionarBarras(decodificarUrl(String(pedida)));
  criterios['orderby'] = decodificada;

  // `:2536-2546` — `explode( ' ', ... )`, e a direcao e a mesma para todas as
  // chaves: o legado as junta com `implode( ' ' . $order . ', ', ... )` e repete
  // a direcao no fim (`:2544` e `:2553`).
  const chaves = decodificada
    .split(' ')
    .map((chave) => ({ chave, direcao }));
  return ordenacao(direcao, chaves, false);
}

/** Congela o resultado, que e lido pelo repositorio e pelo tema. */
function ordenacao(
  direcao: DirecaoDeOrdenacao,
  chaves: readonly ChaveDeOrdenacao[],
  peloPadrao: boolean,
): OrdenacaoResolvida {
  return Object.freeze({
    direcao,
    chaves: Object.freeze(chaves.map((entrada) => Object.freeze(entrada))),
    peloPadrao,
  });
}
