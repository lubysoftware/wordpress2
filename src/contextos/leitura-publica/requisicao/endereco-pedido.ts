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
 * 1. **A lista de nomes e extensivel em execucao.** Sao 47 nomes publicos e 25
 *    privados, declarados em `wp-includes/class-wp.php:18` e `:28`, e o ponto
 *    de extensao `query_vars` pode acrescentar, remover ou trocar qualquer um
 *    deles antes da coleta. P2 poe isso no contrato publico, e BR-MIGRAR-108
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
 * **So o que T001 usa.** O legado le seis entradas para resolver um endereco —
 * `REQUEST_URI`, `PATH_INFO`, `PHP_SELF`, o caminho de `home_url()`, os dois
 * arranjos de parametro da requisicao e o `extra_query_vars` passado pelo
 * chamador (`wp-includes/class-wp.php:165-200` e `:319-336`) —, e cinco delas
 * so tem efeito quando existe regra de traducao para casar ou criterio direto
 * para coletar. Esse e o trabalho de T002, e e a tarefa que as acrescenta,
 * junto com duas regras que vem com elas:
 *
 * - a recusa com codigo 400 quando o mesmo nome chega pelos dois arranjos com
 *   valores diferentes (`wp-includes/class-wp.php:322-329`);
 * - a precedencia do `extra_query_vars`, que e tambem o unico caminho dos 25
 *   nomes privados (`wp-includes/class-wp.php:320-321` e `:392-396`).
 *
 * Declarar os seis campos agora, sem nada que os leia, seria adivinhar a forma
 * da entrada de outra tarefa. Ampliar esta interface na tarefa que precisa dos
 * campos nao e refazer o esqueleto.
 */
export interface EnderecoPedido {
  /**
   * O endereco pedido, como o servidor o entrega: o `REQUEST_URI` do legado,
   * com a parte de consulta se houver.
   *
   * Nao e normalizado aqui. Quem recorta a query, tira o caminho da instalacao
   * e decide entre `PATH_INFO` e `REQUEST_URI` e o casamento de regra de T002,
   * porque no legado esse recorte acontece **dentro** do bloco que so roda
   * quando existe tabela de regras (`wp-includes/class-wp.php:165`).
   */
  readonly uriPedida: string;
}
