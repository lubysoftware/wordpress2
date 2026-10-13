/**
 * A paginacao da listagem publica — o bloco de tamanho de pagina de
 * `WP_Query::get_posts()` (`wp-includes/class-wp-query.php:2013-2046`), a janela
 * de registros que ele monta (`:2809-2824`) e o total encontrado de
 * `WP_Query::set_found_posts()` (`:3692-3741`).
 *
 * Entrega de **T007** (US-3: CA-3.1, CA-3.2 e CA-3.3). A ordenacao declarada,
 * que e CA-3.4, esta em `./ordenacao-da-listagem.ts`.
 *
 * ---
 *
 * ## A ordem das sete etapas, que e a do legado e e observavel
 *
 * `get_posts()` abre com `$query_vars = &$this->query_vars` (`:1919`) — uma
 * **referencia**. Logo cada linha deste bloco escreve no conjunto de criterios
 * que `WP::register_globals()` publica para o tema (`class-wp.php:662-683`) e
 * que `get_query_var()` le. Trocar a ordem troca o resultado em tres pontos: o
 * feed sobrepoe o que `showposts` acabou de escrever, o arquivo de tipo sobrepoe
 * o default mas **nao** o feed, e o `nopaging` e decidido antes do feed e
 * desfeito por ele.
 *
 * | # | etapa | legado |
 * |---|---|---|
 * | 1 | tamanho vazio cai na opcao do site, que nasce em **10** | `:2013-2015` |
 * | 2 | `showposts`, o nome herdado, sobrepoe o tamanho | `:2016-2019` |
 * | 3 | `posts_per_archive_page` sobrepoe em arquivo e em busca | `:2020-2022` |
 * | 4 | `nopaging`, que nao chegando e `posts_per_page == -1` | `:2023-2030` |
 * | 5 | o feed sobrepoe tudo, com `posts_per_rss`, e desliga `nopaging` | `:2032-2039` |
 * | 6 | o molde `(int)`, o negativo que vira positivo e o zero que vira **um** | `:2041-2046` |
 * | 7 | `no_found_rows`, que desliga a contagem do total | `:2063-2068` |
 *
 * E depois delas, **a janela** (`:2809-2824`), que e a clausula `LIMIT`: so
 * existe quando `nopaging` esta desligado **e** a consulta nao e singular. Ela
 * vem no legado depois do bloco de ordenacao (`:2494-2556`) e esta resolvida
 * aqui junto com o tamanho porque nao le nada que a ordenacao escreva —
 * `paged`, `offset` e `posts_per_page`, e nada mais.
 *
 * ## P6: os dois numeros desta tarefa sao do legado, e nenhum outro foi inventado
 *
 * | numero | valor de fabrica | ponto de configuracao |
 * |---|---|---|
 * | itens por pagina da listagem publica | **10** | a opcao `posts_per_page` (`wp-admin/includes/schema.php:434`) |
 * | itens por pagina do feed | **10** | a opcao `posts_per_rss` (`wp-admin/includes/schema.php:424`) |
 *
 * Os dois chegam por {@link ConfiguracaoDoSiteNaConsulta}, nao por constante
 * lida aqui: o default do codigo E a especificacao (resposta 1 de
 * `questions.md`), e o valor em execucao e o da opcao. As constantes
 * {@link ITENS_POR_PAGINA_DE_FABRICA} e {@link ITENS_POR_FEED_DE_FABRICA} sao o
 * que o instalador semeia, e e so isso.
 *
 * **Nao ha limite maximo de itens por pagina, e nao se inventa um.** O legado
 * aceita `posts_per_page=100000` sem teto, e a tabela *Nao negociavel* da
 * constituicao poe "introduzir limite de taxa, prazo de retencao ou qualquer
 * numero que o legado nao tem" entre o que exige decisao humana. O unico teto do
 * produto e o do termo de busca, que ja esta em `./criterios-da-consulta.ts`.
 *
 * ## 🔴 A pagina vazia nao sabe quantas paginas existem, e isso e do legado
 *
 * `set_found_posts()` abre desistindo (`:3699-3701`):
 *
 * > *"Bail if posts is an empty array. Continue if posts is an empty string,
 * > null, or false to accommodate caching plugins that fill posts later."*
 *
 * Logo uma pagina **fora de faixa** — a 4 de uma listagem com 3 — sai com
 * `found_posts` em 0 e `max_num_pages` em 0, os dois valores de declaracao
 * (`:555-556`), e **nao** com o total real da tabela. Quem "corrigisse" isso
 * para informar o total verdadeiro trocaria o que o tema recebe em todo endereco
 * de pagina vazia. E e esse mesmo zero que o ramo 3 de `WP::handle_404()`
 * (`class-wp.php:784`) converte em 404, por `is_paged()`: CA-3.3 e consequencia
 * da lista vazia, nao de uma comparacao entre a pagina pedida e o total.
 *
 * ⚠️ E o ponto de filtro `found_posts` (`:3735`) **nao dispara** nesse caminho,
 * porque a desistencia e antes dele. Uma extensao que conte registros nao e
 * chamada na pagina vazia.
 *
 * ## ⚠️ O que fica fora do total, e por que: a consulta sem janela
 *
 * Sem janela — consulta singular, ou `nopaging` ligado — o legado conta a propria
 * lista (`:3717`) e **nao** calcula `max_num_pages`, que fica em zero (`:3737`).
 * Um conteudo singular responde `found_posts = 1` e `max_num_pages = 0`, e uma
 * listagem com `nopaging` responde o tamanho da lista e tambem zero. A divisao
 * so acontece onde houve `LIMIT`.
 *
 * ## O que este arquivo deliberadamente NAO tem
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | o texto `LIMIT $inicio, $tamanho` e o `SELECT FOUND_ROWS()` | `:2823` e `:3712` | do repositorio, por ligacao tardia — a razao esta em `./conteudo-consultado.ts` |
 * | o ponto de filtro `found_posts_query` | `:3712` | idem: o argumento dele e SQL |
 * | `comments_per_page`, que o legado resolve no meio deste bloco | `:2048-2050` | da paginacao de **comentario** (UC-14, feature `007`), que nao e a listagem publica. A opcao nasce em 50 (`schema.php:505`) e nenhuma linha desta feature a le |
 * | o criterio `page`, a paginacao **de corpo** | `:2059-2061` | da paginacao interna do `<!--nextpage-->`, que o ramo 2 de `handle_404` ja le dos criterios da **resolucao** (`../requisicao/situacao-da-resposta.ts`) |
 * | a correcao de `is_home` pela pagina da frente | `:2052-2057` | do bloco de predicados, que `./analisar-consulta.ts` ja tem na etapa 10 |
 * | o conteudo fixado no topo, que le a pagina corrente em `:3584` | `:3582-3629` | de quem tiver a opcao `sticky_posts`; nenhuma tarefa desta feature a nomeia |
 *
 * ## 🔴 Dois criterios que o legado grava como BOOLEANO, e aqui nao voltam aos criterios
 *
 * `nopaging` (`:2025-2028`) e `no_found_rows` (`:2064-2067`) sao escritos em
 * `query_vars` como booleano, e `ValorDaConsulta` de T003 nao tem booleano —
 * porque `parse_request` converte todo escalar com `(string)`
 * (`class-wp.php:338-347`) e `parse_query` nunca escreve um. Os dois valores
 * resolvidos saem em {@link PaginacaoResolvida} e **nao** sao gravados de volta.
 *
 * O que um tema observaria de diferente: `get_query_var( 'nopaging' )` devolve a
 * ausencia em lugar de `false`, e as duas sao falsas em `empty()`, em `if` e em
 * `== false` — nenhuma decisao do nucleo muda. Alargar `EscalarDaConsulta` com
 * booleano nao e ampliacao e sim troca de contrato ja mesclado: `(string) true`
 * e `'1'` no interpretador e `'true'` neste runtime, logo os sete `String(...)`
 * de T003 passariam a mentir. A decisao nao e desta tarefa, e esta registrada no
 * `README.md` do modulo.
 *
 * O que **volta** aos criterios, porque cabe no tipo e e o que o legado escreve:
 * `posts_per_page` (inteiro), `showposts` (inteiro) e `offset` (inteiro, so
 * quando a janela o usou).
 */

import type { ConteudoConsultado } from './conteudo-consultado.js';
import type { ConfiguracaoDoSiteNaConsulta } from './contexto-da-consulta.js';
import {
  escalarComoNoPhp,
  iguaisComoNoPhp,
  inteiroComoNoPhp,
  numericoComoNoPhp,
  vazioComoNoPhp,
  type ValorDaConsulta,
} from './semantica-de-php.js';
import type { TiposDeConsulta } from './tipo-de-consulta.js';

/**
 * O valor de fabrica da opcao `posts_per_page`
 * (`wp-admin/includes/schema.php:434`).
 *
 * E a regra de negocio que US-3 nomeia — *"`posts_per_page` nasce em 10 e define
 * o tamanho da pagina publica"* — e o default de `CONFIGURACAO_DE_FABRICA` em
 * `./contexto-da-consulta.ts`.
 */
export const ITENS_POR_PAGINA_DE_FABRICA = 10;

/**
 * O valor de fabrica da opcao `posts_per_rss`
 * (`wp-admin/includes/schema.php:424`).
 *
 * Mesmo numero da listagem, opcao diferente: o feed tem a sua, e e ela que vale
 * quando a consulta e de feed (`:2032-2039`).
 */
export const ITENS_POR_FEED_DE_FABRICA = 10;

/**
 * O molde `(int)` para o que um criterio pode ser, **inclusive arranjo**.
 *
 * `:2041` chama `(int) $query_vars['posts_per_page']` sem guarda de escalar, e
 * uma extensao pode ter posto arranjo ali pelo ponto `pre_get_posts`. No
 * interpretador, `(int)` de arranjo vazio e 0 e de arranjo com elemento e 1 —
 * nao e erro de tipo, e a conversao de arranjo para inteiro e permitida (ao
 * contrario da conversao para texto).
 */
function inteiroDeQualquerValor(valor: ValorDaConsulta | undefined): number {
  if (valor === undefined) {
    return 0;
  }
  if (escalarComoNoPhp(valor)) {
    return inteiroComoNoPhp(valor);
  }
  return valor.length === 0 ? 0 : 1;
}

/**
 * `absint()` (`wp-includes/load.php:1469`, `abs( (int) $maybeint )`) para o que
 * um criterio pode ser.
 *
 * ⚠️ A funcao do legado **nao** tem declaracao de tipo, logo `absint( array() )`
 * nao derruba a requisicao: o molde `(int)` corre primeiro e devolve 0 ou 1.
 * Importa aqui porque `:2811` chama `absint( $query_vars['paged'] )` **sem** o
 * `is_scalar( ... ) ?` que `parse_query` poe no mesmo criterio em `:845`.
 */
function inteiroAbsolutoDeQualquerValor(
  valor: ValorDaConsulta | undefined,
): number {
  return Math.abs(inteiroDeQualquerValor(valor));
}

/** `0 != $valor` e `-1 == $valor`, com a igualdade fraca e o arranjo. */
function igualAoInteiro(
  inteiro: number,
  valor: ValorDaConsulta | undefined,
): boolean {
  if (valor === undefined) {
    // `$x == null` com `$x` inteiro e verdadeiro so para zero.
    return inteiro === 0;
  }
  if (!escalarComoNoPhp(valor)) {
    // Arranjo nunca e igual a inteiro: na versao 8 do interpretador arranjo e
    // sempre maior do que escalar.
    return false;
  }
  return iguaisComoNoPhp(inteiro, valor);
}

/**
 * A janela de registros que a consulta pede — a clausula `LIMIT` do legado
 * (`class-wp-query.php:2823`), como **dado**.
 *
 * Ausente, no legado, e `$limits = ''` (`:1951`), e a ausencia decide duas
 * coisas: a consulta nao recorta e `set_found_posts()` conta a propria lista em
 * lugar de perguntar o total ao banco.
 */
export interface JanelaDaListagem {
  /** O deslocamento: `$pgstrt` de `:2818` ou de `:2821`. */
  readonly inicio: number;
  /** Quantos registros a janela pede: `$query_vars['posts_per_page']`. */
  readonly tamanho: number;
}

/** A paginacao de uma consulta, depois das sete etapas e da janela. */
export interface PaginacaoResolvida {
  /**
   * `$query_vars['posts_per_page']` resolvido — o tamanho da pagina.
   *
   * Nunca e zero depois de `:2044-2046`: o zero vira **um**. Pode ser `-1`, que
   * e o pedido de "tudo" e que liga {@link PaginacaoResolvida.semPaginacao}.
   */
  readonly itensPorPagina: number;
  /** `$query_vars['nopaging']` (`:2023-2030`), ja na forma que `:2810` le. */
  readonly semPaginacao: boolean;
  /** `$query_vars['no_found_rows']` (`:2063-2068`), lido por `:3699`. */
  readonly semTotalEncontrado: boolean;
  /**
   * A pagina corrente — o `$page` local de `get_posts()`.
   *
   * Comeca em **1** (`:1956`) e so e recalculado dentro do bloco da janela
   * (`:2811-2814`): consulta singular e consulta com `nopaging` respondem 1,
   * porque o legado nunca chega a ler `paged` nelas. Nao e propriedade publica
   * de `WP_Query` — o legado o guarda como variavel local e o le em dois
   * lugares, a janela e o conteudo fixado no topo (`:3584`) —, e e por isso que
   * ele mora aqui e nao em `ConsultaDeConteudo`.
   */
  readonly paginaCorrente: number;
  /**
   * A janela, ausente quando o legado deixa `$limits` vazio — `nopaging`
   * ligado, ou consulta singular (`:2810`).
   */
  readonly janela?: JanelaDaListagem;
}

/**
 * O ponto de filtro `found_posts` (`class-wp-query.php:3735`).
 *
 * `apply_filters_ref_array( 'found_posts', array( $this->found_posts, &$this ) )`,
 * e o retorno passa pelo molde `(int)`. Dispara **depois** da contagem e
 * **antes** do numero de paginas, logo uma extensao que mexa no total muda
 * `max_num_pages` sem trabalho extra — e nao dispara quando `set_found_posts()`
 * desistiu no comeco (ver o cabecalho deste arquivo).
 */
export type IntercepcaoDoTotalEncontrado = (total: number) => number;

/** O total encontrado e o numero de paginas — `$found_posts` e `$max_num_pages`. */
export interface TotalDaListagem {
  /** `WP_Query::$found_posts` (`:178`), o total que a consulta encontrou. */
  readonly totalEncontrado: number;
  /** `WP_Query::$max_num_pages` (`:186`), o numero de paginas da listagem. */
  readonly totalDePaginas: number;
}

/**
 * Os dois valores de declaracao de `WP_Query` (`:555-556`), que sao tambem o
 * resultado de toda consulta em que `set_found_posts()` desiste no comeco.
 */
export const LISTAGEM_SEM_TOTAL: TotalDaListagem = Object.freeze({
  totalEncontrado: 0,
  totalDePaginas: 0,
});

/**
 * Resolve o tamanho da pagina, a pagina corrente e a janela de registros.
 *
 * Trabalha **no lugar**, sobre o conjunto de criterios, porque no legado
 * `$query_vars` e referencia (`:1919`) e o que vem depois le os valores ja
 * resolvidos — e porque e esse conjunto que o tema recebe. E a mesma forma de
 * {@link normalizarCriterios} de `./criterios-da-consulta.ts`.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-01 e
 * literal: *"nao ha verificacao de capacidade. O portao e o `post_status`"*. Esta
 * funcao decide **quantos** registros a leitura pede, nunca **quais**: o recorte
 * por estado e T009 (US-4).
 */
export function resolverPaginacao(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposDeConsulta,
  configuracao: ConfiguracaoDoSiteNaConsulta,
): PaginacaoResolvida {
  // Etapa 1 (`:2013-2015`) — o teste e `empty()`, nao `! isset()`: tamanho zero,
  // texto vazio e o texto `'0'` tambem caem na opcao do site.
  if (vazioComoNoPhp(criterios['posts_per_page'])) {
    criterios['posts_per_page'] = configuracao.itensPorPagina;
  }

  // Etapa 2 (`:2016-2019`) — `showposts` e o nome herdado, e o legado o grava de
  // volta como inteiro antes de copia-lo. P8: nome publicado nao sai.
  if (!vazioComoNoPhp(criterios['showposts'])) {
    const porMostrar = inteiroDeQualquerValor(criterios['showposts']);
    criterios['showposts'] = porMostrar;
    criterios['posts_per_page'] = porMostrar;
  }

  // Etapa 3 (`:2020-2022`) — so em arquivo e em busca, e o teste e `isset()` com
  // `0 != `, nao `! empty()`: `posts_per_archive_page=''` **passa**, porque na
  // versao 8 do interpretador `0 != ''` compara como texto.
  const porArquivo = criterios['posts_per_archive_page'];
  if (
    porArquivo !== undefined &&
    !igualAoInteiro(0, porArquivo) &&
    (tipos.arquivo || tipos.busca)
  ) {
    criterios['posts_per_page'] = porArquivo;
  }

  // Etapa 4 (`:2023-2030`) — nao chegando, `nopaging` e "o tamanho e -1"; tendo
  // chegado, vale como chegou, e quem o le e `empty()` em `:2810`.
  const semPaginacaoPedido = criterios['nopaging'];
  let semPaginacao =
    semPaginacaoPedido === undefined
      ? igualAoInteiro(-1, criterios['posts_per_page'])
      : !vazioComoNoPhp(semPaginacaoPedido);

  // Etapa 5 (`:2032-2039`) — *"This overrides 'posts_per_page'"*, e desliga o
  // `nopaging` que a etapa 4 pode ter ligado.
  if (tipos.feed) {
    const porFeed = criterios['posts_per_rss'];
    criterios['posts_per_page'] =
      porFeed !== undefined && !vazioComoNoPhp(porFeed)
        ? porFeed
        : configuracao.itensPorFeed;
    semPaginacao = false;
  }

  // Etapa 6 (`:2041-2046`) — o molde, o negativo abaixo de -1 que vira positivo
  // e o zero que vira **um**. O `-1` sobrevive: e o pedido de "tudo".
  let itensPorPagina = inteiroDeQualquerValor(criterios['posts_per_page']);
  if (itensPorPagina < -1) {
    itensPorPagina = Math.abs(itensPorPagina);
  } else if (itensPorPagina === 0) {
    itensPorPagina = 1;
  }
  criterios['posts_per_page'] = itensPorPagina;

  // Etapa 7 (`:2063-2068`) — o molde `(bool)`, que o legado grava e `:3699` le.
  const totalPedido = criterios['no_found_rows'];
  const semTotalEncontrado =
    totalPedido === undefined ? false : !vazioComoNoPhp(totalPedido);

  // A janela (`:2809-2824`). Fora dela, `$page` fica no valor de `:1956`.
  let paginaCorrente = 1;
  let janela: JanelaDaListagem | undefined;
  if (!semPaginacao && !tipos.singular) {
    // `:2811-2814` — `absint()` outra vez, porque `pre_get_posts` pode ter
    // trocado `paged` depois de `parse_query`.
    paginaCorrente = inteiroAbsolutoDeQualquerValor(criterios['paged']);
    if (paginaCorrente === 0) {
      paginaCorrente = 1;
    }

    // `:2816-2822` — *"If 'offset' is provided, it takes precedence over
    // 'paged'"*, e o teste e `is_numeric()`: `offset='abc'` nao tem precedencia.
    const deslocamento = criterios['offset'];
    let inicio: number;
    if (deslocamento !== undefined && numericoComoNoPhp(deslocamento)) {
      inicio = inteiroAbsolutoDeQualquerValor(deslocamento);
      criterios['offset'] = inicio;
    } else {
      inicio = Math.abs((paginaCorrente - 1) * itensPorPagina);
    }

    janela = Object.freeze({ inicio, tamanho: itensPorPagina });
  }

  return Object.freeze({
    itensPorPagina,
    semPaginacao,
    semTotalEncontrado,
    paginaCorrente,
    ...(janela === undefined ? {} : { janela }),
  });
}

/**
 * `WP_Query::set_found_posts()` (`class-wp-query.php:3692-3741`).
 *
 * Roda **antes** do ponto de filtro `the_posts` (`:3641`), e e por isso que o
 * total nao conta registro que uma extensao acrescente ali: `post_count` e
 * recalculado depois do filtro (`:3649`) e `found_posts` **nao**. Os dois
 * numeros discordarem e comportamento do produto.
 *
 * O total do banco chega por argumento porque o `SELECT FOUND_ROWS()` e do
 * repositorio (`:3712`). Ausente com janela presente, o resultado e zero — que e
 * o que `(int) $wpdb->get_var()` devolve quando nao ha linha de resposta.
 */
export function totalDaListagem(
  paginacao: PaginacaoResolvida,
  conteudos: readonly ConteudoConsultado[],
  totalDoRepositorio: number | undefined,
  filtros: readonly IntercepcaoDoTotalEncontrado[] = [],
): TotalDaListagem {
  // `:3699-3701` — a desistencia. O caso "lista vazia" e o da pagina fora de
  // faixa, e o ponto de filtro abaixo nao dispara nele.
  if (paginacao.semTotalEncontrado || conteudos.length === 0) {
    return LISTAGEM_SEM_TOTAL;
  }

  // `:3703-3728` — com janela, o total vem do banco; sem janela, e o tamanho da
  // propria lista. O ramo de lista nula do legado nao e representavel aqui: o
  // repositorio desta feature devolve sempre arranjo.
  let total =
    paginacao.janela === undefined
      ? conteudos.length
      : Math.trunc(totalDoRepositorio ?? 0);

  // `:3735` — o ponto de filtro `found_posts`, com o molde `(int)` do retorno.
  for (const filtro of filtros) {
    total = Math.trunc(filtro(total));
  }

  // `:3737-3739` — a divisao so acontece onde houve janela.
  const totalDePaginas =
    paginacao.janela === undefined
      ? 0
      : Math.ceil(total / paginacao.janela.tamanho);

  return Object.freeze({ totalEncontrado: total, totalDePaginas });
}
