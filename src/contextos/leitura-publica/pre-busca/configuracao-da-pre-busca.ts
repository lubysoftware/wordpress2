/**
 * A configuracao da pre-busca: `wp_get_speculation_rules_configuration()`
 * (`wp-includes/speculative-loading.php:26-101`),
 * `wp_get_speculation_rules_default_configuration()` (`:124-145`),
 * `wp_get_speculative_loading_override()` (`:158-178`) e as tres listas de
 * valores permitidos de `WP_Speculation_Rules`
 * (`wp-includes/class-wp-speculation-rules.php:34-61`).
 *
 * Entrega de **T015** (US-7). E aqui que mora CA-7.3 — *"a declaracao e
 * desligavel por configuracao, e desligada ela nao aparece na pagina"* —, e
 * CA-7.1 na metade da **agressividade**.
 *
 * ---
 *
 * ## 🔴 Numa instalacao nova de site unico a pre-busca nasce DESLIGADA
 *
 * E o achado mais consequente desta tarefa, e e irmao do de T002.
 * `wp_get_speculation_rules_configuration()` abre com
 *
 * ```php
 * if ( ! is_user_logged_in() && get_option( 'permalink_structure' ) ) {
 * ```
 *
 * (`:28`), e o instalador semeia `permalink_structure` como **texto vazio**
 * (`wp-admin/includes/schema.php:443`). Texto vazio e falso no interpretador,
 * logo a condicao nao vale, a configuracao e `null` e
 * `wp_print_speculation_rules()` retorna sem imprimir nada (`:332-334`).
 *
 * Ou seja: na premissa deste porte — instalacao nova de site unico, resposta 2
 * de `questions.md` — a pagina servida **nao** declara pre-busca nenhuma. Nao e
 * lacuna de implementacao: e o comportamento. Em instalacao de rede o default
 * de `permalink_structure` e outro (`schema.php:576`) e a declaracao aparece.
 *
 * ⚠️ **A consequencia que um porte "limpo" apagaria:** com a declaracao
 * desligada por default, o ramo de exclusao de `:224` — o padrao que casa
 * `nonce` na consulta — so e alcancavel quando um interceptador **forca** a
 * configuracao apesar da ausencia de enderecos amigaveis. Ele nao e codigo
 * morto, mas tambem nao e caminho de fabrica, e e por isso que o teste de
 * US-7 o exercita pelo filtro.
 *
 * ## O comentario do legado diz por que sao dois casos, e nao um
 *
 * *"By default, speculative loading is only enabled for sites with pretty
 * permalinks when no user is logged in"* (`:27`). A analise que veio com o
 * pacote registra a razao de cada um: quem esta autenticado ve pagina
 * personalizada e link de acao; site sem endereco amigavel tem tudo em consulta,
 * *"onde a exclusao por padrao de caminho nao funciona"*.
 *
 * ## `'auto'` e sentinela, e a ordem em que ele e resolvido e o contrato
 *
 * O filtro `wp_speculation_rules_configuration` recebe
 * `{ mode: 'auto', eagerness: 'auto' }` (`:29-32`) e **so depois** o `'auto'` e
 * trocado pelo default real (`:69-95`). O docblock de `:106-110` declara o que
 * essa ordem compra: *"This only changes what the 'auto' value resolves to, so
 * a plugin which supplies an explicit mode or eagerness via the filter
 * continues to take precedence."* Resolver o `'auto'` antes do filtro — que e o
 * arranjo que parece mais simples — inverteria a precedencia entre quem
 * hospeda e quem estende.
 */

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';

/**
 * Os dois modos, na ordem de `WP_Speculation_Rules::$mode_allowlist`
 * (`class-wp-speculation-rules.php:34-37`).
 */
export const MODOS_DA_PRE_BUSCA = Object.freeze([
  'prefetch',
  'prerender',
] as const);

/** `'prefetch'` ou `'prerender'` — o que o navegador faz com o destino. */
export type ModoDePreBusca = (typeof MODOS_DA_PRE_BUSCA)[number];

/**
 * As quatro agressividades, na ordem de
 * `WP_Speculation_Rules::$eagerness_allowlist` (`:45-50`).
 *
 * ⚠️ `'immediate'` esta na lista e e **recusada** em regra de documento — ver
 * {@link AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO}.
 */
export const AGRESSIVIDADES_DA_PRE_BUSCA = Object.freeze([
  'immediate',
  'eager',
  'moderate',
  'conservative',
] as const);

/** Com que agressividade o navegador antecipa o destino (CA-7.1). */
export type AgressividadeDaPreBusca =
  (typeof AGRESSIVIDADES_DA_PRE_BUSCA)[number];

/**
 * As duas fontes, na ordem de `WP_Speculation_Rules::$source_allowlist`
 * (`:58-61`).
 */
export const FONTES_DA_REGRA = Object.freeze(['list', 'document'] as const);

/** `'list'` (enderecos enumerados) ou `'document'` (seletor na pagina). */
export type FonteDaRegra = (typeof FONTES_DA_REGRA)[number];

/** O valor sentinela que a configuracao usa antes do filtro (`:30` e `:31`). */
export const VALOR_AUTOMATICO = 'auto';

/** O modo de fabrica do nucleo — `$default_mode = 'prefetch'` (`:125`). */
export const MODO_DE_FABRICA: ModoDePreBusca = 'prefetch';

/**
 * A agressividade de fabrica do nucleo —
 * `$default_eagerness = 'conservative'` (`:131`).
 *
 * A analise que veio com o pacote resume os dois defaults como *"a combinacao
 * mais conservadora possivel"*.
 */
export const AGRESSIVIDADE_DE_FABRICA: AgressividadeDaPreBusca = 'conservative';

/**
 * `'immediate'` — agressividade valida que o nucleo **nao** aceita em regra de
 * documento.
 *
 * O comentario do legado aparece **duas** vezes, e as duas sao ponto de
 * decisao: em `:91` (ao sanear a configuracao) e em `:135` (ao ler o default do
 * hospedeiro). *"'immediate' is a valid eagerness, but for safety WordPress
 * does not allow it for document-level rules."* Com ela, o navegador
 * especularia **todos** os links ao carregar a pagina.
 *
 * E ha um terceiro ponto, em `WP_Speculation_Rules::add_rule()`
 * (`class-wp-speculation-rules.php:193-204`), que recusa a regra inteira. Os
 * tres estao portados: dois aqui, um em `./regras-de-pre-busca.ts`.
 */
export const AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO: AgressividadeDaPreBusca =
  'immediate';

/**
 * Os nomes da constante e da variavel de ambiente que o hospedeiro usa para
 * mudar o que `'auto'` resolve (`:126` e `:132`, `@since 7.1.0`).
 *
 * Sao nome publicado (P8): ler outro nome, ou aceitar so um dos dois
 * mecanismos, e mudar contrato de implantacao.
 */
export const NOME_DA_SOBREPOSICAO_DE_MODO = 'WP_SPECULATIVE_LOADING_DEFAULT_MODE';
/** Ver {@link NOME_DA_SOBREPOSICAO_DE_MODO}. */
export const NOME_DA_SOBREPOSICAO_DE_AGRESSIVIDADE =
  'WP_SPECULATIVE_LOADING_DEFAULT_EAGERNESS';

/**
 * `WP_Speculation_Rules::is_valid_mode( $mode )` (`:269-271`).
 *
 * Aceita `mixed` desde a versao 7.1.0 do produto (`:262`), e e por isso que o
 * parametro aqui e `unknown`: a configuracao pos-filtro pode trazer qualquer
 * coisa no campo, e o legado pergunta `is_string()` antes de olhar a lista.
 */
export function modoValido(modo: unknown): modo is ModoDePreBusca {
  return (
    typeof modo === 'string' &&
    (MODOS_DA_PRE_BUSCA as readonly string[]).includes(modo)
  );
}

/** `WP_Speculation_Rules::is_valid_eagerness( $eagerness )` (`:284-286`). */
export function agressividadeValida(
  agressividade: unknown,
): agressividade is AgressividadeDaPreBusca {
  return (
    typeof agressividade === 'string' &&
    (AGRESSIVIDADES_DA_PRE_BUSCA as readonly string[]).includes(agressividade)
  );
}

/**
 * `WP_Speculation_Rules::is_valid_source( $source )` (`:296-298`).
 *
 * ⚠️ Esta **nao** virou `mixed` na versao 7.1.0: a assinatura do legado segue
 * `string $source` (`:296`), e quem a chama ja testou `isset( $rule['source'] )`.
 * O parametro aqui e `string` pelo mesmo motivo.
 */
export function fonteValida(fonte: string): fonte is FonteDaRegra {
  return (FONTES_DA_REGRA as readonly string[]).includes(fonte);
}

/** A configuracao resolvida: os dois campos de `:97-100`. */
export interface ConfiguracaoDaPreBusca {
  readonly modo: ModoDePreBusca;
  readonly agressividade: AgressividadeDaPreBusca;
}

/**
 * `getenv( $nome )` (`:163`).
 *
 * Devolve ausencia no lugar do `false` do legado.
 *
 * ⚠️ **Ausente, a funcao nao existe no sistema**, que e o `function_exists(
 * 'getenv' )` falso de `:162` — e o efeito e o mesmo de uma variavel nao
 * definida, porque nos dois casos `$value` fica nulo.
 */
export type LeituraDeAmbiente = (nome: string) => string | undefined;

/**
 * `defined( $nome ) ? constant( $nome ) : <ausente>` (`:170-171`).
 *
 * Devolve `unknown` de proposito: o legado pergunta `is_string()` ao valor
 * (`:172`) e **ignora** a constante que nao for texto, deixando valer a
 * variavel de ambiente. Um tipo `string` aqui apagaria esse ramo.
 *
 * ⚠️ **Ausente, nenhuma constante esta definida.**
 */
export type LeituraDeConstante = (nome: string) => unknown;

/** O que a configuracao le da instalacao. */
export interface LeituraDaInstalacao {
  /** `is_user_logged_in()` (`:28`, `wp-includes/pluggable.php:1262`). */
  readonly alguemAutenticado: boolean;
  /**
   * `get_option( 'permalink_structure' )` (`:28` e `:221`).
   *
   * Lida **duas** vezes, e as duas decidem coisa diferente: aqui, se a
   * pre-busca existe; em `./declarar-pre-busca.ts`, qual dos dois padroes de
   * exclusao de consulta entra na lista.
   */
  readonly formaDosEnderecos: string;
  readonly variavelDeAmbiente: LeituraDeAmbiente;
  readonly constante: LeituraDeConstante;
}

/**
 * O filtro `wp_speculation_rules_configuration` (`:62`).
 *
 * Recebe e devolve `unknown`, e isso **e** o contrato: o docblock de `:56-60`
 * descreve o parametro como `array<string, string>|null`, e o codigo que vem
 * depois trata tres formas diferentes de retorno — `null` desliga (`:65`),
 * valor que nao e arranjo vira o default inteiro (`:74-79`) e arranjo e saneado
 * campo por campo (`:80-95`). Tipar como `ConfiguracaoDaPreBusca | null`
 * apagaria o segundo ramo, que a analise marca 🟡 justamente por ser o que
 * surpreende.
 */
export type IntercepcaoDaConfiguracao = (configuracao: unknown) => unknown;

/**
 * `wp_get_speculative_loading_override( $nome )` (`:158-178`).
 *
 * ⚠️ **A constante vence o ambiente, e so quando e texto.** A ordem e a do
 * legado e o docblock a declara deliberada: *"The constant takes precedence
 * over the environment variable, consistent with `wp_get_environment_type()`"*
 * (`:150`). Uma constante definida com numero ou booleano **nao** sobrepoe o
 * ambiente — ela e simplesmente ignorada (`:172`), e o valor do ambiente
 * sobrevive.
 */
export function sobreposicaoDaPreBusca(
  nome: string,
  ambiente: LeituraDeAmbiente,
  constante: LeituraDeConstante,
): string | undefined {
  let valor: string | undefined;

  // `if ( function_exists( 'getenv' ) ) { ... if ( false !== $has_env ) ... }`
  // (`:162-167`).
  const doAmbiente = ambiente(nome);
  if (doAmbiente !== undefined) {
    valor = doAmbiente;
  }

  // `if ( defined( $name ) ) { ... if ( is_string( $has_constant ) ) ... }`
  // (`:170-175`).
  const daConstante = constante(nome);
  if (typeof daConstante === 'string') {
    valor = daConstante;
  }

  return valor;
}

/**
 * `wp_get_speculation_rules_default_configuration()` (`:124-145`) — o que o
 * valor `'auto'` resolve.
 *
 * ⚠️ **O hospedeiro nao pode impor `'immediate'`.** O teste de `:136` repete a
 * proibicao de `:92`, e isso e de proposito: a regra vale nos dois pontos, nao
 * em um so. Um hospedeiro que configure `immediate` como default e ignorado e
 * fica com `'conservative'`.
 */
export function configuracaoDeFabricaDaPreBusca(
  ambiente: LeituraDeAmbiente,
  constante: LeituraDeConstante,
): ConfiguracaoDaPreBusca {
  let modo: ModoDePreBusca = MODO_DE_FABRICA;
  const modoSobreposto = sobreposicaoDaPreBusca(
    NOME_DA_SOBREPOSICAO_DE_MODO,
    ambiente,
    constante,
  );
  if (modoValido(modoSobreposto)) {
    modo = modoSobreposto;
  }

  let agressividade: AgressividadeDaPreBusca = AGRESSIVIDADE_DE_FABRICA;
  const agressividadeSobreposta = sobreposicaoDaPreBusca(
    NOME_DA_SOBREPOSICAO_DE_AGRESSIVIDADE,
    ambiente,
    constante,
  );
  if (
    agressividadeValida(agressividadeSobreposta) &&
    agressividadeSobreposta !== AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO
  ) {
    agressividade = agressividadeSobreposta;
  }

  return Object.freeze({ modo, agressividade });
}

/**
 * `is_array( $config )` para o que o filtro pode devolver.
 *
 * 🔴 **Lacuna declarada, e ela e do alvo e nao do legado.** No interpretador de
 * origem arranjo e objeto sao tipos distintos, e `is_array()` recusa objeto;
 * neste runtime o arranjo associativo do legado e um objeto, e os dois nao sao
 * distinguiveis. O que esta reproduzido e a fronteira observavel que o legado
 * usa: **escalar** (texto, numero, booleano) cai no ramo de `:74-79` e produz o
 * default inteiro; estrutura cai no saneamento campo por campo. Um filtro que
 * devolva instancia de classe divergiria, e o caso e do oraculo executavel
 * (`ESC-ORACULO`, `BR-MIGRAR-116`, resposta 16).
 */
function arranjoComoNoPhp(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

/** `isset( $config[ $chave ] )` — chave ausente **ou** valor nulo. */
function definido(valor: unknown): boolean {
  return valor !== undefined && valor !== null;
}

/**
 * `wp_get_speculation_rules_configuration()` (`:26-101`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-01 e
 * literal: *"nao ha verificacao de capacidade"*. ⚠️ E `is_user_logged_in()`
 * **nao** e verificacao de capacidade: e a pergunta "ha alguem autenticado",
 * que o legado usa para **desligar** um recurso, nunca para conceder acesso.
 * Confundir as duas poria autorizacao numa operacao que nao tem nenhuma.
 *
 * Devolve ausencia no lugar do `null` do legado, e e a ausencia que CA-7.3
 * cobra: ela nao e "configuracao vazia", e **a pre-busca desligada**.
 */
export function configuracaoDaPreBusca(
  leitura: LeituraDaInstalacao,
  intercepcoes: readonly IntercepcaoDaConfiguracao[] = [],
): ConfiguracaoDaPreBusca | undefined {
  // `! is_user_logged_in() && get_option( 'permalink_structure' )` (`:28`), com
  // a verdade do interpretador no segundo termo: texto vazio e `'0'` sao falsos.
  let configuracao: unknown =
    !leitura.alguemAutenticado && !vazioComoNoPhp(leitura.formaDosEnderecos)
      ? { mode: VALOR_AUTOMATICO, eagerness: VALOR_AUTOMATICO }
      : null;

  // `apply_filters( 'wp_speculation_rules_configuration', $config )` (`:62`),
  // cada interceptador recebendo o que o anterior devolveu.
  for (const intercepcao of intercepcoes) {
    configuracao = intercepcao(configuracao);
  }

  // `if ( null === $config ) { return null; }` (`:65-67`) — e so `null`: o
  // teste e de identidade, logo `false`, zero e texto vazio **nao** desligam,
  // caem no ramo de `:74-79` e produzem o default.
  if (configuracao === null) {
    return undefined;
  }

  // Os defaults sao lidos DEPOIS do filtro (`:70-72`) — ver o cabecalho.
  const padrao = configuracaoDeFabricaDaPreBusca(
    leitura.variavelDeAmbiente,
    leitura.constante,
  );

  // `if ( ! is_array( $config ) ) { return <defaults>; }` (`:74-79`).
  if (!arranjoComoNoPhp(configuracao)) {
    return padrao;
  }

  // `:80-86` — ausente, `'auto'` ou invalido viram o default.
  const modoPedido = configuracao['mode'];
  const modo =
    !definido(modoPedido) ||
    modoPedido === VALOR_AUTOMATICO ||
    !modoValido(modoPedido)
      ? padrao.modo
      : modoPedido;

  // `:87-95` — as mesmas tres condicoes, mais a proibicao de `'immediate'`.
  const agressividadePedida = configuracao['eagerness'];
  const agressividade =
    !definido(agressividadePedida) ||
    agressividadePedida === VALOR_AUTOMATICO ||
    !agressividadeValida(agressividadePedida) ||
    agressividadePedida === AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO
      ? padrao.agressividade
      : agressividadePedida;

  return Object.freeze({ modo, agressividade });
}
