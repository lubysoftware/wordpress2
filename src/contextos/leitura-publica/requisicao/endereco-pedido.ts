/**
 * O endereco pedido e os criterios de consulta — as duas pontas da traducao
 * que UC-01 poe no passo 2: *"Sistema resolve a URL em variaveis de consulta
 * pelas regras de reescrita"*.
 *
 * **Nada aqui e estado de modulo, e isso e regra e nao estilo.** BR-MIGRAR-105
 * (`EXT-CONTEXTO`) poe identidade, consulta corrente, conexao e requisicao no
 * escopo da REQUISICAO: no legado isso vinha de graca do processo morrer no fim
 * da resposta, e numa runtime longo-viva o mesmo modulo atende N requisicoes
 * concorrentes. Por isso o endereco pedido e um valor que chega por argumento,
 * e nao um objeto que o modulo guarda.
 */

/**
 * Valor de um criterio de consulta.
 *
 * E `string` ou lista de `string` porque e isso que o legado produz: ao
 * coletar as variaveis de consulta, `WP::parse_request` converte cada valor
 * escalar com `(string)` — inclusive os de dentro de um arranjo
 * (`wp-includes/class-wp.php:338-347`). Numero nao chega aqui: `p=42` e a
 * string `'42'`, e quem compara numero e a consulta, na tarefa dela.
 */
export type ValorDeCriterio = string | readonly string[];

/**
 * O conjunto de criterios de consulta — o `WP::$query_vars` do legado.
 *
 * E um dicionario de nome para valor, e nao uma estrutura com campos fixos, por
 * duas razoes lidas do sistema analisado:
 *
 * 1. **A lista de nomes e extensivel em execucao.** Sao 46 nomes publicos e 26
 *    privados, declarados em `wp-includes/class-wp.php:18` e `:28` — T002
 *    transcreveu as duas listas em `../traducao-de-endereco/nomes-de-criterio.ts`
 *    e corrigiu ali a contagem que este cabecalho trazia (*"47 e 25"*) —, e o
 *    ponto de extensao `query_vars` pode acrescentar, remover ou trocar qualquer
 *    um deles antes da coleta. P2 poe isso no contrato publico, e BR-MIGRAR-108
 *    lembra que toda regra deste catalogo e um default filtravel.
 * 2. **Os mesmos criterios podem chegar sem endereco amigavel** (CA-1.2), e e
 *    essa equivalencia, e nao a forma do endereco, que a spec manda cobrir.
 *    Dicionario e a forma em que as duas entradas se encontram.
 */
export interface CriteriosDeConsulta {
  readonly [nome: string]: ValorDeCriterio | undefined;
}

/**
 * O conjunto vazio de criterios.
 *
 * E congelado porque e compartilhado: duas requisicoes concorrentes recebem
 * este mesmo valor, e um conjunto vazio mutavel seria exatamente o vazamento de
 * estado entre requisicoes que BR-MIGRAR-105 descreve e que nenhum dos 985
 * testes de `backlog/tests.md` apanharia.
 */
export const CRITERIOS_VAZIOS: CriteriosDeConsulta = Object.freeze({});

/** Verdadeiro quando nenhum criterio foi derivado. */
export function criteriosVazios(criterios: CriteriosDeConsulta): boolean {
  return Object.keys(criterios).length === 0;
}

/**
 * O endereco pedido por quem visita.
 *
 * **As cinco entradas do servidor, completas em T002.** O legado le seis coisas
 * para resolver um endereco: `REQUEST_URI`, `PATH_INFO`, `PHP_SELF`, o caminho
 * de `home_url()`, os dois arranjos de parametro da requisicao e o
 * `extra_query_vars` passado pelo chamador (`wp-includes/class-wp.php:170-200` e
 * `:319-336`). T001 declarou so a primeira, porque sem tabela de regras e sem
 * coleta nenhuma das outras tem efeito; T002 traz as duas metades e portanto
 * traz os campos, mais as duas regras que vem com eles:
 *
 * - a recusa com codigo 400 quando o mesmo nome chega pelos dois arranjos com
 *   valores diferentes (`wp-includes/class-wp.php:322-329`);
 * - a precedencia do `extra_query_vars`, que e tambem o unico caminho dos 26
 *   nomes privados (`wp-includes/class-wp.php:320-321` e `:392-396`).
 *
 * O `extra_query_vars` **nao** e campo desta interface: ele e argumento de
 * `WP::parse_request()` e chega por `OpcoesDaResolucao`, como no legado, onde
 * quem o fornece e `WP::main( $query_args )` (`:819` e `:822`) — ou seja, quem
 * chama, e nao a requisicao.
 *
 * ⚠️ **Campo ausente vale como texto vazio ou arranjo vazio**, que e o que o
 * legado faz com `PATH_INFO` (`$_SERVER['PATH_INFO'] ?? ''`, `:170`). Para
 * `PHP_SELF` o legado nao tem esse `??`, porque o servidor sempre o entrega;
 * aqui a ausencia dele so muda uma comparacao, a de `:287` (*"pedido para o
 * proprio arquivo"*), e esta registrada no campo.
 */
export interface EnderecoPedido {
  /**
   * O endereco pedido, como o servidor o entrega: o `REQUEST_URI` do legado,
   * com a parte de consulta se houver.
   *
   * Nao e normalizado aqui. Quem recorta a consulta, tira o caminho da
   * instalacao e decide entre `PATH_INFO` e `REQUEST_URI` e
   * `../traducao-de-endereco/casar-endereco.ts`, porque no legado esse recorte
   * acontece **dentro** do bloco que so roda quando existe tabela de regras
   * (`wp-includes/class-wp.php:165`).
   */
  readonly uriPedida: string;

  /**
   * O `PATH_INFO` do servidor (`wp-includes/class-wp.php:170`).
   *
   * Quando existe e nao termina no ponto de entrada do site, e **ele**, e nao a
   * URI, que vale como caminho pedido (`:204-205`).
   */
  readonly caminhoDeInfo?: string;

  /**
   * O `PHP_SELF` do servidor (`wp-includes/class-wp.php:175`).
   *
   * Decide duas coisas no casamento: se o pedido e para o proprio arquivo da
   * instalacao (`:287`) e se o pedido vem do painel — o teste e literal,
   * `str_contains( $_SERVER['PHP_SELF'], 'wp-admin/' )` (`:288`), e no painel os
   * criterios da regra casada sao **descartados** (`:292-294`).
   */
  readonly scriptPedido?: string;

  /**
   * O caminho de `home_url()` (`wp-includes/class-wp.php:177`).
   *
   * E o que permite ao site morar numa subpasta: o prefixo sai da frente da URI,
   * do caminho de informacao e do script, sem diferenciar maiuscula de minuscula
   * (`:181` e `:194-201`). Vazio, ou `/`, e instalacao na raiz.
   */
  readonly caminhoDaInstalacao?: string;

  /**
   * O arranjo da consulta da requisicao — o `$_GET` do legado.
   *
   * Chega **ja analisado**, porque no legado ele chega assim: o interpretador o
   * monta antes de a primeira linha rodar. Quem o monta a partir do texto da
   * requisicao e a borda HTTP.
   */
  readonly parametrosDeConsulta?: CriteriosDeConsulta;

  /**
   * O arranjo do corpo da requisicao — o `$_POST` do legado.
   *
   * Vence a consulta na precedencia da coleta (`:330-333`), e e com ele que a
   * guarda de `:322-329` compara.
   */
  readonly parametrosDeCorpo?: CriteriosDeConsulta;
}
