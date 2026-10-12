/**
 * O contexto da expansao de macro textual: tudo que `wp-includes/shortcodes.php`
 * le de fora e que **nao** e porta deste modulo, mais os cinco pontos de
 * extensao que ele dispara.
 *
 * Entrega de **T017** (US-8). Mesma forma e mesmas razoes de
 * `../apresentacao/contexto-da-apresentacao.ts`:
 *
 * - **contexto por argumento, nao estado de modulo** (BR-MIGRAR-105,
 *   `EXT-CONTEXTO`): o registro de marcas e global montado no arranque, e numa
 *   feature publica o vazamento apareceria como um visitante recebendo o corpo
 *   expandido pelas extensoes de outro;
 * - **as colaboracoes entre contextos chegam aqui**, porque a regra de
 *   dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 *   `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * ## O que esta etapa precisa de fora, e de quem e cada coisa
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | o global `$shortcode_tags` (`shortcodes.php:41`) | o arranque, mais `media.php` e `class-wp-embed.php` | {@link ContextoDaMacro.registro} |
 * | `wp_kses_one_attr()` (`kses.php:984`, chamada em `shortcodes.php:547`) | `plataforma/analise-de-html`, slot nao escolhido | {@link ContextoDaMacro.sanearAtributo} |
 * | `_doing_it_wrong()` (`functions.php:6112`, chamada em `:67`, `:76` e `:404`) | `plataforma/barramento` | {@link ContextoDaMacro.avisar} |
 *
 * ## Tres coisas que NAO estao aqui, e cada uma tem motivo
 *
 * 1. **A autorizacao.** `shortcodes.php` nao tem uma chamada de
 *    `current_user_can()` em 764 linhas, e UC-01 e literal: *"nao ha verificacao
 *    de capacidade"*. A unica fronteira de autorizacao que o arquivo **toca** e
 *    `wp_kses_one_attr()`, e ela chega por {@link ContextoDaMacro.sanearAtributo}
 *    sem que este codigo pergunte nada a ninguem — exatamente como o legado, que
 *    tambem nao pergunta: e o docblock de `:525-529` que explica que o atributo
 *    sem aspas *"implies unfiltered_html"* e por isso **nao** passa por KSES.
 * 2. **O relogio.** O arquivo nao le o tempo em nenhuma das suas 764 linhas.
 * 3. **O cache.** `get_shortcode_regex()` remonta a expressao a cada chamada,
 *    sem cache; `get_html_split_regex()` tem o seu, `static` e por processo
 *    (`formatting.php:626`), e num processo por requisicao ele nasce e morre com
 *    a resposta. Reproduzi-lo nao muda resultado e guardaria estado de modulo
 *    onde BR-MIGRAR-105 nao o admite.
 */

import type {
  AtributosDaMacro,
  RegistroDeMacros,
  RelatorDeUsoIndevido,
} from './registro-de-macros.js';
import { REGISTRO_SEM_MACROS } from './registro-de-macros.js';
import type { AchadoDoPhp } from './semantica-de-pcre.js';

/**
 * `wp_kses_one_attr( $attr, $element )` (`wp-includes/kses.php:984`).
 *
 * Recebe o atributo **inteiro** — nome, `=` e valor, com o espaco das duas
 * pontas — e o nome do elemento a que ele pertence. Devolve o atributo filtrado,
 * ou **texto vazio** quando a lista de permissao recusa o atributo naquele
 * elemento.
 *
 * ⚠️ **Ela e a unica fronteira de autorizacao que `shortcodes.php` atravessa**, e
 * nao esta portada: depende de `wp_kses_allowed_html( 'post' )`,
 * `wp_allowed_protocols()`, `esc_attr()`, `wp_kses_bad_protocol()` e
 * `wp_kses_attr_check()`, isto e, da lista de permissao que decide o que cada
 * papel publica (`permissions.md`: `editor` tem `unfiltered_html`). Ver o
 * cabecalho de `./html-do-corpo.ts` para a fronteira inteira.
 */
export type SaneadorDeAtributo = (
  atributo: string,
  elemento: string,
) => string;

/**
 * O saneador de uma instalacao em que a lista de permissao **nao** respondeu.
 *
 * **Nao e "ainda nao implementado"**, e e por isso que ele devolve texto vazio e
 * nao o atributo: texto vazio e a resposta que `wp_kses_one_attr()` da para todo
 * atributo que a lista de permissao recusa, e o legado trata essa resposta num
 * ramo proprio — `if ( '' !== trim( $new_attr ) )` (`:548`), que **mantem o
 * atributo original** quando o saneador esvaziou. Ou seja: sem lista de
 * permissao, a marca dentro de atributo **entre aspas** permanece literal, que e
 * `[marca]` continuando no texto como foi escrita.
 *
 * 🔴 **Qual e o alcance desta ausencia, dito sem rodeio.** Das duas metades de
 * CA-8.4, a ausencia atinge **uma**:
 *
 * | forma do atributo | passa por KSES? | com o saneador ausente |
 * |---|---|---|
 * | `<img src=[marca]>` ou `<img src = [marca]>` | **nao** (`:530-539`) | expande, identico ao legado |
 * | `<img src="[marca]">` ou `<img src='[marca]'>` | **sim** (`:540-553`) | nao expande: o atributo fica como foi escrito |
 *
 * A metade que nao passa por KSES e a que o legado escolheu nao filtrar, com o
 * comentario de cinco linhas de `:531-536`: *"we assume KSES did not run because
 * the input was written by an administrator, so we should avoid changing the
 * output and we do not need to run KSES here"*. Ela esta identica. A outra fica
 * esperando o slot `analise-de-html`, cuja escolha de tecnologia esta na tabela
 * *Nao negociavel* da constituicao e nao e desta tarefa.
 *
 * Quem ligar KSES passa {@link ContextoDaMacro.sanearAtributo} e as duas metades
 * ficam iguais, sem que nada de `./macros-em-atributo.ts` mude.
 */
export const SEM_LISTA_DE_PERMISSAO: SaneadorDeAtributo = () => '';

/** O contexto completo da expansao de macro textual. */
export interface ContextoDaMacro {
  /**
   * `$shortcode_tags`.
   *
   * ⚠️ **Ausente, nenhuma marca esta registrada**, e o corpo atravessa a
   * renderizacao sem uma troca — o ramo de `:250`, que o docblock de
   * `do_shortcode()` documenta. As 7 marcas de fabrica do legado estao
   * declaradas como dado em `MARCAS_DE_FABRICA` e **nao** registradas; a razao
   * esta no cabecalho de `./registro-de-macros.ts`.
   */
  readonly registro?: RegistroDeMacros;
  /**
   * `wp_kses_one_attr()`.
   *
   * ⚠️ **Ausente, nenhum atributo e permitido**, e o legado mantem o atributo
   * original — ver {@link SEM_LISTA_DE_PERMISSAO}, que diz o que isso atinge e o
   * que nao atinge.
   */
  readonly sanearAtributo?: SaneadorDeAtributo;
  /**
   * `_doing_it_wrong()`.
   *
   * ⚠️ **Ausente, ninguem recebe o aviso, e nenhuma decisao muda** (P7): no
   * legado escrever o aviso depende do modo de depuracao, e as tres chamadas
   * deste arquivo ja decidiram o retorno antes de avisar.
   */
  readonly avisar?: RelatorDeUsoIndevido;
}

/** O contexto com todos os defaults da tabela acima resolvidos. */
export interface ContextoDaMacroResolvido {
  readonly registro: RegistroDeMacros;
  readonly sanearAtributo: SaneadorDeAtributo;
  readonly avisar: RelatorDeUsoIndevido;
}

/**
 * Resolve as ausencias do contexto nos defaults declarados acima.
 *
 * Nao toca em colaborador nenhum: resolver o contexto e so amarrar
 * dependencias, como `contextoDaApresentacaoResolvido` faz com o dele.
 */
export function contextoDaMacroResolvido(
  contexto: ContextoDaMacro = {},
): ContextoDaMacroResolvido {
  return {
    registro: contexto.registro ?? REGISTRO_SEM_MACROS,
    sanearAtributo: contexto.sanearAtributo ?? SEM_LISTA_DE_PERMISSAO,
    avisar: contexto.avisar ?? (() => undefined),
  };
}

/**
 * O filtro `pre_do_shortcode_tag` (`wp-includes/shortcodes.php:427`).
 *
 * **Curto-circuita a marca inteira**: o docblock e literal — *"Returning a
 * non-false value from filter will short-circuit the shortcode generation
 * process, returning that value instead"* (`:410-411`). O tratador nao e
 * chamado, e o filtro `do_shortcode_tag` tambem nao dispara.
 *
 * ⚠️ **O default e `false` e o teste e `false !== $return`** (`:428`), logo
 * devolver texto vazio **tambem** curto-circuita, e a marca desaparece do corpo.
 * E por isso que o tipo tem `false` separado de `string` em lugar de usar texto
 * vazio como sinal.
 *
 * Recebe os quatro argumentos do legado, nesta ordem, e o quarto e o arranjo de
 * achado cru — com a forma do interpretador, ver `achadoComoNoPhp`.
 */
export type IntercepcaoAntesDaMacro = (
  saida: string | false,
  marca: string,
  atributos: AtributosDaMacro,
  achado: AchadoDoPhp,
) => string | false;

/**
 * O filtro `do_shortcode_tag` (`wp-includes/shortcodes.php:447`).
 *
 * O ultimo ponto antes de a saida entrar no corpo. Recebe a saida **ja com** o
 * `$m[1]` e o `$m[6]` concatenados (`:434`), que e detalhe observavel: um filtro
 * que troque a saida inteira apaga os colchetes extras do escape junto.
 */
export type IntercepcaoDaMacroExpandida = (
  saida: string,
  marca: string,
  atributos: AtributosDaMacro,
  achado: AchadoDoPhp,
) => string;

/** O filtro `strip_shortcodes_tagnames` (`wp-includes/shortcodes.php:726`). */
export type IntercepcaoDasMarcasRemovidas = (
  marcas: readonly string[],
  corpo: string,
) => readonly string[];

/**
 * O filtro `wp_get_attachment_image_context`, que `do_shortcode()` **registra e
 * desregistra em torno da propria expansao** (`:263-268` e `:278-281`).
 *
 * Nao e um ponto que esta operacao dispara: e um ponto de **outra** operacao que
 * esta operacao passa a interceptar enquanto expande. O interceptador e
 * `_filter_do_shortcode_context()` (`:297`), de tres linhas, e devolve a
 * constante {@link CONTEXTO_DA_MACRO_NA_IMAGEM}.
 *
 * O docblock explica para que serve: *"When wp_get_attachment_image() is called
 * during shortcode rendering, we need to make clear that the context is a
 * shortcode and not part of the theme's template rendering logic"*
 * (`:287-290`).
 *
 * ⚠️ **O registro e condicional e a remocao e condicional ao registro**, e o
 * comentario do legado diz por que: *"Ensure this context is only added once if
 * shortcodes are nested"* (`:262`) e *"Only remove the filter if it was added in
 * this scope"* (`:277`). Um porte que registrasse e removesse sem o teste faria
 * a expansao de dentro desligar o contexto da de fora — e a imagem de anexo
 * passaria a ser atribuida ao tema.
 */
export const FILTRO_DE_CONTEXTO_DE_IMAGEM = 'wp_get_attachment_image_context';

/** O retorno de `_filter_do_shortcode_context()` (`wp-includes/shortcodes.php:298`). */
export const CONTEXTO_DA_MACRO_NA_IMAGEM = 'do_shortcode';

/** Os pontos de extensao desta operacao, na ordem em que disparam. */
export interface PontosDaMacro {
  /** `pre_do_shortcode_tag`, antes do tratador (`:427`). */
  readonly antesDaMarca?: readonly IntercepcaoAntesDaMacro[];
  /** `do_shortcode_tag`, depois do tratador (`:447`). */
  readonly sobreAMarcaExpandida?: readonly IntercepcaoDaMacroExpandida[];
  /** `strip_shortcodes_tagnames`, so na remocao (`:726`). */
  readonly sobreAsMarcasRemovidas?: readonly IntercepcaoDasMarcasRemovidas[];
}

/**
 * Como o interceptador de {@link FILTRO_DE_CONTEXTO_DE_IMAGEM} ja estava, ou
 * nao, registrado quando a expansao comecou — o `$has_filter` de `:263`.
 *
 * Chega por argumento porque a lista de interceptadores de **outro** ponto e
 * estado de requisicao e vive no barramento, que nao existe nesta arvore.
 */
export interface EstadoDoContextoDeImagem {
  /** `has_filter( 'wp_get_attachment_image_context', '_filter_do_shortcode_context' )`. */
  readonly jaRegistrado?: boolean;
}
