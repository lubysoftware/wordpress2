/**
 * A marca **dentro de elemento HTML** — `do_shortcodes_in_html_tags()`
 * (`wp-includes/shortcodes.php:465`) e `unescape_invalid_shortcodes()`
 * (`:574`).
 *
 * Entrega de **T017** (US-8), e e **CA-8.4** inteiro: *"marca dentro de atributo
 * de elemento e tratada por caminho proprio e declarado"*. O caminho e proprio
 * porque e outra funcao, com outra expressao de recorte e outra regra de
 * saneamento; e fica declarado em {@link PassoNoHtml}, que registra por qual dos
 * quatro ramos cada elemento passou e, no ramo de atributo, qual das tres regras
 * valeu para cada atributo.
 *
 * ---
 *
 * ## Por que esta funcao existe, nas palavras do legado
 *
 * O docblock de `:456-462`: *"Any [ or ] characters remaining inside elements
 * will be HTML encoded to prevent interference with shortcodes that are outside
 * the elements. Assumes $content processed by KSES already. Users with
 * unfiltered_html capability may get unexpected output if angle braces are
 * nested in tags."*
 *
 * Ou seja: ela roda **antes** da expansao do corpo (`:270`, antes do `:273`), e o
 * trabalho dela e duplo — expandir a marca que esta dentro de atributo, pelas
 * regras proprias, e **esconder** todo colchete que sobrou dentro de elemento,
 * para que a expansao do corpo nao o confunda com marca. O esconderijo e
 * desfeito no fim de `do_shortcode()`, por `unescape_invalid_shortcodes()`
 * (`:276`), e o comentario de uma linha diz por que sempre: *"Always restore
 * square braces so we don't break things like <!--[if IE ]>."* (`:275`).
 *
 * ## ⚠️ A normalizacao de entidade e observavel, e sobra depois do desfazer
 *
 * A primeira coisa que a funcao faz nao tem nada a ver com elemento: ela troca
 * `&#91;` por `&#091;` e `&#93;` por `&#093;` **no corpo inteiro** (`:466-471`),
 * com o comentario *"Normalize entities in unfiltered HTML before adding
 * placeholders"*. E e preciso, porque o esconderijo escolhido e justamente
 * `&#91;` — sem a normalizacao, um `&#91;` que o autor escreveu voltaria como `[`
 * no desfazer.
 *
 * A consequencia fica: **um corpo que continha `&#91;` sai de `do_shortcode()`
 * contendo `&#091;`**, ainda que nenhuma marca tenha sido expandida e ainda que
 * o `&#91;` estivesse em texto puro, longe de qualquer elemento. As duas
 * entidades renderizam o mesmo `[` no navegador, mas o texto gravado e o texto
 * servido deixam de ser iguais, e quem compara byte a byte ve a diferenca.
 *
 * ## As tres regras do laco de atributo, e a que NAO chama KSES
 *
 * | forma | teste do legado | regra |
 * |---|---|---|
 * | sem `[` ou sem `]` | `:519-522` | nao mexe; o colchete solto e escondido no fim do laco |
 * | `[marca]` ou `nome = [marca]` | `:523-539` | expande **sem** KSES |
 * | `nome="[marca]"` ou `nome='[marca]'` | `:540-553` | expande e **passa** por KSES |
 *
 * O teste que separa as duas ultimas e posicional e nao sintatico: `$open`
 * precisa vir **antes** da primeira aspa simples e da primeira aspa dupla
 * (`:528`). O comentario de cinco linhas do legado da a razao de nao filtrar a
 * segunda forma — *"$attr like '[shortcode]' or 'name = [shortcode]' implies
 * unfiltered_html. In this specific situation we assume KSES did not run because
 * the input was written by an administrator, so we should avoid changing the
 * output and we do not need to run KSES here"* (`:531-536`) — e a da terceira,
 * de filtrar: *"We do not know if $content was unfiltered. Assume KSES ran
 * before shortcodes"* (`:541-544`).
 */

import {
  nomeDoElemento,
  pedacosDoElemento,
  separarHtmlDoCorpo,
} from './html-do-corpo.js';
import type { ContextoDaMacroResolvido } from './contexto-da-macro.js';
import {
  substituirComCallback,
  traduzirComoNoPhp,
  type AchadoDoPhp,
} from './semantica-de-pcre.js';

/** `$trans` de `:467-470` — a normalizacao que roda no corpo inteiro. */
const NORMALIZAR_ENTIDADE: ReadonlyMap<string, string> = new Map([
  ['&#91;', '&#091;'],
  ['&#93;', '&#093;'],
]);

/** `$trans` de `:472-475` — o esconderijo do colchete dentro de elemento. */
const ESCONDER_COLCHETE: ReadonlyMap<string, string> = new Map([
  ['[', '&#91;'],
  [']', '&#93;'],
]);

/** `$trans` de `:576-579` — o desfazer de `unescape_invalid_shortcodes()`. */
const DESFAZER_ESCONDERIJO: ReadonlyMap<string, string> = new Map([
  ['&#91;', '['],
  ['&#93;', ']'],
]);

/** `%^<\s*\[\[?[^\[\]]+\]%` (`:505`) — a marca na posicao do nome do elemento. */
const MARCA_NA_POSICAO_DO_NOME = /^<[ \t\n\r\f\x0b]*\[\[?[^[\]]+\]/;

/** O conjunto de `trim()` do interpretador, usado no teste de `:548`. */
const ESPACO_DO_TRIM = /^[ \t\n\r\0\u000b]*$/;

/** Por qual dos quatro ramos do laco de elementos o elemento passou. */
export type CaminhoDoElemento =
  /** `$noopen || $noclose` (`:485-493`): falta `[` ou falta `]` no elemento. */
  | 'sem-par-de-colchetes'
  /** `$ignore_html`, `<!--` ou `<![CDATA[` (`:495-499`): esconde tudo. */
  | 'colchete-escapado'
  /** `false === wp_kses_attr_parse()` (`:503-511`): HTML que nao se analisa. */
  | 'html-inesperado'
  /** O laco de atributo (`:514-566`). */
  | 'atributo';

/** Qual das tres regras do laco de atributo valeu para um atributo. */
export type CaminhoDoAtributo =
  /** `false === $open || false === $close` (`:519-522`). */
  | 'sem-colchete'
  /** `[marca]` ou `nome = [marca]` (`:523-539`): expande sem KSES. */
  | 'sem-aspas'
  /** `nome="[marca]"` (`:540-553`): expande e passa por KSES. */
  | 'entre-aspas';

/** O que aconteceu com um atributo — o registro que CA-8.4 cobra. */
export interface PassoNoAtributo {
  /** O atributo como chegou, antes de qualquer troca. */
  readonly atributo: string;
  readonly caminho: CaminhoDoAtributo;
  /** O `$count` de `:544` — quantas marcas trocaram neste atributo. */
  readonly trocas: number;
  /**
   * Verdadeiro quando o saneador esvaziou a saida e o legado **manteve** o
   * atributo original — o `else` implicito de `if ( '' !== trim( $new_attr ) )`
   * (`:548`). So alcancavel no caminho `entre-aspas`.
   */
  readonly mantidoPeloSaneador: boolean;
}

/** O que aconteceu com um elemento — o registro que CA-8.4 cobra. */
export interface PassoNoHtml {
  /** O elemento como `wp_html_split()` o entregou. */
  readonly elemento: string;
  readonly caminho: CaminhoDoElemento;
  /** Um passo por atributo, so no caminho `atributo`. */
  readonly atributos: readonly PassoNoAtributo[];
}

/** O que {@link expandirMacrosNoHtml} devolve. */
export interface ExpansaoNoHtml {
  readonly texto: string;
  /**
   * Um passo por **elemento**, na ordem do corpo. Os pedacos de texto puro nao
   * entram: o laco do legado os descarta na primeira linha (`:481`), e um
   * registro deles seria o corpo repetido.
   */
  readonly passos: readonly PassoNoHtml[];
}

/**
 * `do_shortcodes_in_html_tags( $content, $ignore_html, $tagnames )`
 * (`wp-includes/shortcodes.php:465`).
 *
 * Recebe a expressao ja montada porque o legado a monta uma vez (`:477`) e a usa
 * em tres pontos de chamada diferentes dentro do laco (`:506`, `:537` e `:544`).
 *
 * `expandirUmaMarca` chega por argumento e nao por `import` para que este
 * arquivo e `./expandir-macros.ts` nao se importem em circulo: no legado os dois
 * estao no mesmo arquivo e `do_shortcode_tag` e chamada por nome.
 */
export function expandirMacrosNoHtml(
  corpo: string,
  ignorarHtml: boolean,
  expressao: RegExp,
  contexto: ContextoDaMacroResolvido,
  expandirUmaMarca: (achado: AchadoDoPhp) => string,
): ExpansaoNoHtml {
  // `// Normalize entities in unfiltered HTML before adding placeholders.`
  // (`:466-471`) — no corpo inteiro, antes de saber o que e elemento.
  const normalizado = traduzirComoNoPhp(corpo, NORMALIZAR_ENTIDADE);

  const pedacos = separarHtmlDoCorpo(normalizado);
  const passos: PassoNoHtml[] = [];

  const saida = pedacos.map((pedaco) => {
    // `if ( '' === $element || '<' !== $element[0] ) continue;` (`:481-483`)
    if (pedaco === '' || !pedaco.startsWith('<')) {
      return pedaco;
    }

    const semAbertura = !pedaco.includes('[');
    const semFechamento = !pedaco.includes(']');
    if (semAbertura || semFechamento) {
      passos.push(passoSimples(pedaco, 'sem-par-de-colchetes'));
      // `if ( $noopen xor $noclose )` (`:488`): esconde so quando falta UM dos
      // dois. Faltando os dois nao ha colchete nenhum a esconder.
      return semAbertura !== semFechamento
        ? traduzirComoNoPhp(pedaco, ESCONDER_COLCHETE)
        : pedaco;
    }

    if (
      ignorarHtml ||
      pedaco.startsWith('<!--') ||
      pedaco.startsWith('<![CDATA[')
    ) {
      passos.push(passoSimples(pedaco, 'colchete-escapado'));
      return traduzirComoNoPhp(pedaco, ESCONDER_COLCHETE);
    }

    const pedacosDoAlvo = pedacosDoElemento(pedaco);
    if (pedacosDoAlvo === false) {
      passos.push(passoSimples(pedaco, 'html-inesperado'));
      // `// Some plugins are doing things like [name] <[email]>.` (`:504-507`)
      const comMarcaNoNome = MARCA_NA_POSICAO_DO_NOME.test(pedaco)
        ? substituirComCallback(expressao, pedaco, expandirUmaMarca).texto
        : pedaco;
      // `// Looks like we found some unexpected unfiltered HTML. Skipping it for
      // confidence.` (`:509-510`) — e o esconderijo vale mesmo assim.
      return traduzirComoNoPhp(comMarcaNoNome, ESCONDER_COLCHETE);
    }

    // `array_shift` e `array_pop` de `:527-528`: o primeiro pedaco e o ultimo
    // nao sao atributos, sao a abertura e o fechamento.
    const frente = pedacosDoAlvo[0] as string;
    const tras = pedacosDoAlvo[pedacosDoAlvo.length - 1] as string;
    const atributos = pedacosDoAlvo.slice(1, -1);
    const nome = nomeDoElemento(frente);

    const passosDoAtributo: PassoNoAtributo[] = [];
    const tratados = atributos.map((atributo) => {
      const abre = atributo.indexOf('[');
      const fecha = atributo.indexOf(']');
      if (abre === -1 || fecha === -1) {
        // `continue; // Go to next attribute. Square braces will be escaped at
        // end of loop.` (`:521`)
        passosDoAtributo.push({
          atributo,
          caminho: 'sem-colchete',
          trocas: 0,
          mantidoPeloSaneador: false,
        });
        return atributo;
      }

      const aspaDupla = atributo.indexOf('"');
      const aspaSimples = atributo.indexOf("'");
      // `if ( ( false === $single || $open < $single ) && ( false === $double ||
      // $open < $double ) )` (`:528`) — o teste e POSICIONAL: o colchete vem
      // antes de qualquer aspa.
      const foraDeAspas =
        (aspaSimples === -1 || abre < aspaSimples) &&
        (aspaDupla === -1 || abre < aspaDupla);

      if (foraDeAspas) {
        const trocado = substituirComCallback(
          expressao,
          atributo,
          expandirUmaMarca,
        );
        passosDoAtributo.push({
          atributo,
          caminho: 'sem-aspas',
          trocas: trocado.trocas,
          mantidoPeloSaneador: false,
        });
        return trocado.texto;
      }

      const trocado = substituirComCallback(
        expressao,
        atributo,
        expandirUmaMarca,
      );
      // `if ( $count > 0 )` (`:545`): sem troca nenhuma, KSES nao roda — logo um
      // atributo entre aspas que nao tinha marca registrada **nao** e saneado.
      if (trocado.trocas === 0) {
        passosDoAtributo.push({
          atributo,
          caminho: 'entre-aspas',
          trocas: 0,
          mantidoPeloSaneador: false,
        });
        return atributo;
      }

      // `// Sanitize the shortcode output using KSES.` (`:546`)
      const saneado = contexto.sanearAtributo(trocado.texto, nome);
      // `if ( '' !== trim( $new_attr ) )` (`:548`) — saneador que esvaziou
      // **mantem o atributo original**, e nao o expandido nem o vazio.
      const aproveitado = !ESPACO_DO_TRIM.test(saneado);
      passosDoAtributo.push({
        atributo,
        caminho: 'entre-aspas',
        trocas: trocado.trocas,
        mantidoPeloSaneador: !aproveitado,
      });
      return aproveitado ? saneado : atributo;
    });

    passos.push(
      Object.freeze({
        elemento: pedaco,
        caminho: 'atributo' as const,
        atributos: Object.freeze(passosDoAtributo),
      }),
    );

    // `$element = $front . implode( '', $attributes ) . $back;` (`:566`) e
    // `// Now encode any remaining '[' or ']' chars.` (`:568-569`).
    return traduzirComoNoPhp(
      frente + tratados.join('') + tras,
      ESCONDER_COLCHETE,
    );
  });

  return Object.freeze({
    texto: saida.join(''),
    passos: Object.freeze(passos),
  });
}

/** Um passo de elemento que nao entrou no laco de atributo. */
function passoSimples(
  elemento: string,
  caminho: CaminhoDoElemento,
): PassoNoHtml {
  return Object.freeze({
    elemento,
    caminho,
    atributos: Object.freeze([]),
  });
}

/**
 * `unescape_invalid_shortcodes( $content )`
 * (`wp-includes/shortcodes.php:574`).
 *
 * Desfaz o esconderijo no corpo inteiro, sem reanalisar HTML — e o comentario do
 * legado registra a economia: *"Clean up entire string, avoids re-parsing
 * HTML"* (`:575`).
 *
 * ⚠️ **Roda sempre, inclusive quando nenhuma marca foi expandida**: `:275-276` e
 * `:731-732` a chamam fora de qualquer condicional, e o comentario das duas
 * linhas e o mesmo — *"Always restore square braces so we don't break things
 * like <!--[if IE ]>."*. Um porte que a tornasse condicional deixaria comentario
 * condicional do Internet Explorer quebrado em meia pagina.
 */
export function desfazerEsconderijoDeColchete(corpo: string): string {
  return traduzirComoNoPhp(corpo, DESFAZER_ESCONDERIJO);
}
