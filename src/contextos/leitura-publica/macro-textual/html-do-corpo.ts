/**
 * Os dois analisadores de HTML de que a expansao dentro de elemento depende —
 * `wp_html_split()` (`wp-includes/formatting.php:615`) com
 * `get_html_split_regex()` (`:625`), e `wp_kses_attr_parse()`
 * (`wp-includes/kses.php:1763`) com `wp_kses_hair_parse()` (`:1813`).
 *
 * Entrega de **T017** (US-8), pelo caminho de **CA-8.4**. Os quatro sao
 * **analisadores puros**, e o legado o diz nos dois docblocks de `kses.php`:
 * *"Does not modify input. May return 'evil' output."* (`:1753` e `:1821`).
 * Nenhum deles consulta a lista de permissao, nenhum decide autorizacao e
 * nenhum depende de capacidade.
 *
 * ---
 *
 * ## ⚠️ Por que estes quatro estao portados aqui e `wp_kses_one_attr()` nao esta
 *
 * A fronteira e a autorizacao, e ela e nitida:
 *
 * | funcao | o que faz | onde foi |
 * |---|---|---|
 * | `wp_html_split` | corta o corpo em texto, elemento, comentario e CDATA | aqui |
 * | `wp_kses_attr_parse` | corta o elemento em abertura, atributos e fechamento | aqui |
 * | `wp_kses_hair_parse` | corta a lista de atributos em atributos | aqui |
 * | `wp_kses_one_attr` | **filtra** um atributo contra `wp_kses_allowed_html( 'post' )`, `wp_allowed_protocols()` e `esc_attr()` | ligacao tardia, em `./contexto-da-macro.ts` |
 *
 * `wp_kses_one_attr()` e fronteira de autorizacao e nao higiene de HTML — o
 * [plano](../../../../.specify/specs/004-leitura-publica/plan.md) desta feature
 * registra a frase: *"a outra metade, KSES, e fronteira de autorizacao, nao
 * higiene de HTML"*, e `permissions.md` registra que `editor` tem
 * `unfiltered_html`. Ela mora no slot `analise-de-html`, cujo candidato **nao
 * esta escolhido** (o plano: *"recomendacao e recomendacao; nada aqui esta
 * escolhido"*), e escolher a tecnologia de um slot esta na tabela *Nao
 * negociavel* da constituicao. Por isso ela entra por argumento, com a ausencia
 * declarada em {@link SaneadorDeAtributo}.
 *
 * Os quatro daqui, ao contrario, nao decidem nada: sao recortes de texto, e
 * portar o recorte agora e o que torna o caminho de CA-8.4 **existente** em vez
 * de declarado. Quando `plataforma/analise-de-html/` existir, eles descem para
 * la e nenhuma chamada muda de resultado — a mesma espera que
 * `./semantica-de-pcre.ts` registra para `plataforma/utilitarios/`.
 */

import {
  CLASSE_DE_ESPACO,
  ESPACO_DO_PCRE,
  separarComDelimitador,
} from './semantica-de-pcre.js';

/**
 * O ramo de comentario de `get_html_split_regex()`
 * (`wp-includes/formatting.php:629-636`), com os comentarios do legado.
 *
 * O `(?=!--)` na frente e a **guarda** que o subpadrao condicional do legado
 * punha em `$escaped` (`:649-658`); ver {@link FONTE_DA_SEPARACAO_DE_HTML}.
 */
const COMENTARIO_HTML =
  '(?=!--)' +
  '!' + //              Start of comment, after the <.
  '(?:' + //            Unroll the loop: Consume everything until --> is found.
  '-(?!->)' + //            Dash not followed by end of comment.
  '[^\\-]*' + //            Consume non-dashes.
  ')*' + //             Loop possessively.
  '(?:-->)?'; //        End of comment. If not found, match all input.

/** O ramo de CDATA (`wp-includes/formatting.php:638-645`). */
const CDATA_HTML =
  '(?=!\\[CDATA\\[)' +
  '!\\[CDATA\\[' + //   Start of comment, after the <.
  '[^\\]]*' + //        Consume non-].
  '(?:' + //            Unroll the loop: Consume everything until ]]> is found.
  '](?!]>)' + //            One ] not followed by end of comment.
  '[^\\]]*' + //            Consume non-].
  ')*' + //             Loop possessively.
  '(?:]]>)?'; //        End of comment. If not found, match all input.

/**
 * `get_html_split_regex()` (`wp-includes/formatting.php:625`).
 *
 * ## ⚠️ O subpadrao condicional de PCRE, e a prova de que a alternancia o
 * substitui
 *
 * O legado usa `(?(?=COND)SIM|NAO)` duas vezes (`:649-658` e `:663-669`), e este
 * motor nao tem condicional. A diferenca entre condicional e alternancia e uma
 * so: no condicional, se o ramo `SIM` falha, **o todo falha** — ele nao cai para
 * o `NAO`. Numa alternancia ordenada, cairia.
 *
 * Aqui os dois ramos `SIM` **nao podem falhar** depois da guarda, e e por isso
 * que a troca e exata:
 *
 * - no ramo de comentario, depois do `!` obrigatorio tudo e `*` ou `?`, logo ele
 *   casa no minimo `!`;
 * - no ramo de CDATA, `!\[CDATA\[` e justamente o que a guarda `(?=!\[CDATA\[)`
 *   acabou de confirmar, e o resto e `*` ou `?`.
 *
 * As guardas tiveram de ser escritas de novo em cada ramo porque, no legado,
 * elas estavam uma no `(?=!--|!\[CDATA\[)` externo e outra no `(?(?=!-)` do
 * condicional. Sem elas o primeiro ramo aceitaria `<!x`, que o legado manda para
 * `[^>]*>?`.
 *
 * Os tres `*+` caem para `*` pela prova no cabecalho de `./semantica-de-pcre.ts`.
 */
const FONTE_DA_SEPARACAO_DE_HTML =
  '(' + //                 Capture the entire match.
  '<' + //                 Find start of element.
  '(?:' + //               Conditional expression follows.
  COMENTARIO_HTML + //         Find end of escaped element.
  '|' +
  CDATA_HTML +
  '|' + //                 ...else...
  '[^>]*>?' + //           Find end of normal element.
  ')' +
  ')';

/**
 * `wp_html_split( $input )` (`wp-includes/formatting.php:615`) —
 * `preg_split` com `PREG_SPLIT_DELIM_CAPTURE`.
 *
 * Devolve o corpo em pedacos alternados: texto, elemento, texto, elemento... O
 * pedaco vazio **fica** no arranjo, nas duas pontas e entre dois elementos
 * vizinhos, porque nao ha `PREG_SPLIT_NO_EMPTY` — e e isso que permite remontar
 * o corpo com uma concatenacao e obter exatamente a entrada.
 *
 * Quem reconhece um elemento e o primeiro caractere ser `<`, e **nao** este
 * arranjo: o laco de `do_shortcodes_in_html_tags()` testa
 * `'<' !== $element[0]` (`:481`). Um texto que comece com `<` nao existe, porque
 * a separacao cortaria ali.
 */
export function separarHtmlDoCorpo(corpo: string): readonly string[] {
  return separarComDelimitador(new RegExp(FONTE_DA_SEPARACAO_DE_HTML), corpo);
}

/**
 * O elemento de `wp_kses_attr_parse()` (`wp-includes/kses.php:1764`):
 * `%^(<\s*)(/\s*)?([a-zA-Z0-9]+\s*)([^>]*)(>?)$%`.
 *
 * O `$` de PCRE sem `/D` tolera uma quebra de linha final que o `$` deste motor
 * nao tolera. Nao ha divergencia alcancavel: `([^>]*)` e guloso e `(>?)` e
 * opcional, logo o padrao nunca precisa que `$` case antes do fim.
 */
const FONTE_DO_ELEMENTO =
  `^(<${CLASSE_DE_ESPACO}*)(/${CLASSE_DE_ESPACO}*)?` +
  `([a-zA-Z0-9]+${CLASSE_DE_ESPACO}*)([^>]*)(>?)$`;

/** `%\s*\/\s*$%` (`wp-includes/kses.php:1781`) — a barra XHTML do fim. */
const FONTE_DA_BARRA_XHTML = `${CLASSE_DE_ESPACO}*/${CLASSE_DE_ESPACO}*$`;

/**
 * O atributo de `wp_kses_hair_parse()` (`wp-includes/kses.php:1817-1844`), com
 * os comentarios do legado.
 *
 * ⚠️ O segundo ramo do nome e o que faz CA-8.4 funcionar, e o comentario do
 * legado explica por que: `\[\[?[^\[\]]+\]\]?` — *"Shortcode in the name
 * position implies unfiltered_html"* (`:1820`). Sem ele, `<[email]>` nao seria
 * analisavel e a marca na posicao do nome nunca chegaria ao tratador.
 *
 * O legado grita sobre o modificador: *"do NOT remove the `x` modifiers as they
 * are essential for the above regex!"* (`:1848`). O `x` so apaga espaco e
 * comentario da **fonte** do padrao; aqui a fonte ja nasce sem eles.
 */
const FONTE_DO_ATRIBUTO =
  '(?:' +
  '[_a-zA-Z][-_a-zA-Z0-9:.]*' + //      Attribute name.
  '|' +
  '\\[\\[?[^\\[\\]]+\\]\\]?' + //       Shortcode in the name position implies unfiltered_html.
  ')' +
  '(?:' + //                            Attribute value.
  `${CLASSE_DE_ESPACO}*=${CLASSE_DE_ESPACO}*` + //  All values begin with "=".
  '(?:' +
  '"[^"]*"' + //                            Double-quoted.
  '|' +
  "'[^']*'" + //                            Single-quoted.
  '|' +
  `[^${ESPACO_DO_PCRE}"']+` + //            Non-quoted.
  `(?:${CLASSE_DE_ESPACO}|$)` + //          Must have a space.
  ')' +
  '|' +
  `(?:${CLASSE_DE_ESPACO}|$)` + //      If attribute has no value, space is required.
  ')' +
  `${CLASSE_DE_ESPACO}*`; //            Trailing space is optional except as mentioned above.

/**
 * `wp_kses_hair_parse( $attr )` (`wp-includes/kses.php:1813`).
 *
 * Devolve a lista de atributos, ou `false` quando a lista nao e analisavel — e o
 * docblock diz por que nao e tolerante: *"In case of unexpected input, returns
 * false instead of stripping things"* (`:1806-1807`).
 *
 * ⚠️ **Duas passadas da mesma expressao, e o legado explica a razao**: *"Although
 * it is possible to reduce this procedure to a single regexp, we must run that
 * regexp twice to get exactly the expected result"* (`:1843-1845`). A primeira
 * passada e `/^(...)+$/`, que **valida** a lista inteira; a segunda e
 * `preg_match_all`, que **extrai**. Validar com a extracao seria aceitar lista
 * em que sobra texto no meio.
 */
export function atributosDoElemento(
  listaDeAtributos: string,
): readonly string[] | false {
  if (listaDeAtributos === '') {
    return Object.freeze([]);
  }

  const validacao = new RegExp(`^(?:${FONTE_DO_ATRIBUTO})+$`);
  if (!validacao.test(listaDeAtributos)) {
    return false;
  }

  const extracao = new RegExp(FONTE_DO_ATRIBUTO, 'g');
  return Object.freeze(listaDeAtributos.match(extracao) ?? []);
}

/**
 * `wp_kses_attr_parse( $element )` (`wp-includes/kses.php:1763`).
 *
 * Devolve o elemento em pedacos, e o legado garante que nada se perde:
 * *"Make sure all input is returned by adding front and back matter"*
 * (`:1793`). O primeiro pedaco e `<` mais o nome; o ultimo e a barra XHTML mais
 * o `>`; entre eles, um pedaco por atributo. Concatenar os pedacos devolve o
 * elemento original — e e assim que `do_shortcodes_in_html_tags()` o remonta
 * depois de trocar atributo por atributo (`:566`).
 *
 * Devolve `false` em tres casos, e os tres levam ao mesmo ramo de
 * `do_shortcodes_in_html_tags()` (`:503-511`):
 *
 * | caso | legado |
 * |---|---|
 * | o elemento nao casa a forma de abertura | `:1764-1767` |
 * | e elemento de **fechamento** | `:1775-1778`, *"Closing elements do not get parsed"* |
 * | a lista de atributos nao e analisavel | `:1786-1789` |
 */
export function pedacosDoElemento(elemento: string): readonly string[] | false {
  const achado = new RegExp(FONTE_DO_ELEMENTO).exec(elemento);
  if (achado === null) {
    return false;
  }

  const abertura = achado[1] as string;
  const barra = achado[2] ?? '';
  const nome = achado[3] as string;
  const fim = achado[5] ?? '';
  let lista = achado[4] ?? '';

  // `if ( '' !== $slash )` (`:1775`) — fechamento nao e analisado.
  if (barra !== '') {
    return false;
  }

  // `// Is there a closing XHTML slash at the end of the attributes?` (`:1780`)
  const barraXhtml =
    new RegExp(FONTE_DA_BARRA_XHTML).exec(lista)?.[0] ?? '';
  if (barraXhtml !== '') {
    lista = lista.slice(0, lista.length - barraXhtml.length);
  }

  const atributos = atributosDoElemento(lista);
  if (atributos === false) {
    return false;
  }

  return Object.freeze([
    abertura + barra + nome,
    ...atributos,
    barraXhtml + fim,
  ]);
}

/**
 * `preg_match( '%[a-zA-Z0-9]+%', $front, $matches ); $elname = $matches[0];`
 * (`wp-includes/shortcodes.php:528-530`).
 *
 * O nome do elemento, lido do **primeiro** pedaco e nao do elemento inteiro. E o
 * unico argumento que `do_shortcodes_in_html_tags()` passa ao saneador de
 * atributo.
 *
 * ⚠️ O legado le `$matches[0]` **sem** testar o retorno de `preg_match`, e aqui
 * isso nao e alcancavel: `pedacosDoElemento()` so devolve pedacos quando
 * `[a-zA-Z0-9]+` casou o nome, logo o primeiro pedaco sempre o contem.
 */
export function nomeDoElemento(primeiroPedaco: string): string {
  return /[a-zA-Z0-9]+/.exec(primeiroPedaco)?.[0] ?? '';
}
