/**
 * A inspecao da marca no corpo — `has_shortcode()`
 * (`wp-includes/shortcodes.php:149`) e `get_shortcode_tags_in_content()`
 * (`:184`).
 *
 * Entrega de **T017** (US-8), e a outra metade de **CA-8.5**: *"a lista de marcas
 * registradas e inspecionavel por quem administra o site"*. A primeira metade e
 * o registro em si — `marcasRegistradas()` e `macroExiste()` em
 * `./registro-de-macros.ts`. Esta e a inspecao **cruzada com um corpo**: que
 * marcas aquele conteudo usa.
 *
 * ---
 *
 * ## ⚠️ As duas funcoes sao parecidas e discordam em dois pontos
 *
 * | | `has_shortcode` | `get_shortcode_tags_in_content` |
 * |---|---|---|
 * | exige que a marca esteja **registrada** | sim, por `shortcode_exists()` (`:151`) | **nao**: nao consulta o registro em linha nenhuma |
 * | com que expressao varre | `get_shortcode_regex()` **sem** argumento, isto e, com **todas** as marcas registradas (`:152`) | a mesma (`:189`) |
 * | o que devolve | verdadeiro ou falso | os nomes achados, com repeticao e na ordem do corpo |
 * | desce na marca aninhada | sim, recursivamente pelo grupo 5 (`:160`) | sim, e **concatena** (`:197-200`) |
 *
 * O segundo ponto e o que torna `get_shortcode_tags_in_content()` enganosa: o
 * docblock promete *"An array of registered shortcode names found in the given
 * content"* (`:179`) e o corpo nunca pergunta se o nome esta registrado — ele
 * nao precisa, porque a expressao e montada com as chaves do registro, e nome
 * nao registrado nao casa. A promessa vale **por consequencia da expressao**, e
 * nao por teste. Um porte que acrescentasse o teste nao mudaria resultado, e
 * mentiria sobre o codigo.
 *
 * ⚠️ **As duas montam a expressao com o registro INTEIRO**, e nao com o recorte
 * de `:255-256` que `do_shortcode()` usa. Com o registro vazio a alternancia
 * fica vazia — e e por isso que `get_shortcode_tags_in_content()` tem a guarda
 * de `str_contains( $content, '[' )` em `:185` e `has_shortcode()` a de
 * `:150` **mais** a de `shortcode_exists()`. A lista vazia com corpo contendo
 * `[` passaria das guardas em `get_shortcode_tags_in_content()`; ver a guarda que
 * esta funcao acrescenta abaixo.
 */

import { expressaoDeMacro } from './regex-de-macro.js';
import {
  macroExiste,
  marcasRegistradas,
  type RegistroDeMacros,
} from './registro-de-macros.js';
import { acharTodosComoNoPhp } from './semantica-de-pcre.js';

/**
 * `has_shortcode( $content, $tag )` (`wp-includes/shortcodes.php:149`).
 *
 * Tres guardas antes da varredura, na ordem do legado: o corpo precisa conter
 * `[` (`:150`), a marca precisa estar registrada (`:151`) e a varredura precisa
 * achar algo (`:153-155`).
 *
 * ⚠️ **Desce na marca aninhada pelo conteudo envolvido** (`:160`):
 * `! empty( $shortcode[5] ) && has_shortcode( $shortcode[5], $tag )`. Logo
 * `[fora][dentro][/fora]` responde verdadeiro para `dentro`, e o `! empty()` faz
 * com que um conteudo envolvido igual a `'0'` **nao** seja visitado, porque
 * `'0'` e vazio no interpretador.
 */
export function corpoTemMacro(
  registro: RegistroDeMacros,
  corpo: string,
  marca: string,
): boolean {
  if (!corpo.includes('[')) {
    return false;
  }
  if (!macroExiste(registro, marca)) {
    return false;
  }

  const todas = marcasRegistradas(registro);
  // Nao alcancavel pelo caminho acima — `macroExiste` ja garantiu uma chave —,
  // e esta aqui porque a expressao com alternancia vazia casa texto vazio.
  if (todas.length === 0) {
    return false;
  }

  const achados = acharTodosComoNoPhp(expressaoDeMacro(todas), corpo);
  for (const achado of achados) {
    if (marca === achado[2]) {
      return true;
    }
    const envolvido = achado[5];
    // `! empty( $shortcode[5] )` (`:160`): texto vazio e o texto `'0'` nao
    // levam a recursao.
    if (
      envolvido !== undefined &&
      envolvido !== '' &&
      envolvido !== '0' &&
      corpoTemMacro(registro, envolvido, marca)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * `get_shortcode_tags_in_content( $content )`
 * (`wp-includes/shortcodes.php:184`).
 *
 * O exemplo do proprio docblock (`:173-174`):
 * `get_shortcode_tags_in_content( '[audio src="file.mp3"][/audio] [foo] [gallery ids="1,2,3"]' )`
 * devolve `array( 'audio', 'gallery' )` — `foo` fica de fora porque nao esta
 * registrada, e portanto nao casa a expressao.
 *
 * ⚠️ **Nao remove repeticao e nao ordena**: a ordem e a do corpo e a marca usada
 * duas vezes aparece duas vezes. E a marca aninhada entra **depois** da marca que
 * a envolve, porque o `array_merge` de `:199` roda dentro da volta
 * (`:195-201`).
 */
export function marcasUsadasNoCorpo(
  registro: RegistroDeMacros,
  corpo: string,
): readonly string[] {
  if (!corpo.includes('[')) {
    return Object.freeze([]);
  }

  const todas = marcasRegistradas(registro);
  // O legado nao tem esta guarda: com o registro vazio a alternancia fica vazia
  // e `preg_match_all` casa texto vazio em toda posicao, devolvendo um arranjo
  // de nomes vazios. Aqui ela existe porque o resultado daquele caso nao e
  // comportamento que alguem conheca — e a guarda de `:250` de `do_shortcode()`
  // mostra que o legado trata registro vazio como "nada a fazer".
  if (todas.length === 0) {
    return Object.freeze([]);
  }

  const achados = acharTodosComoNoPhp(expressaoDeMacro(todas), corpo);
  const nomes: string[] = [];
  for (const achado of achados) {
    nomes.push(achado[2] as string);

    const envolvido = achado[5];
    // `if ( ! empty( $shortcode[5] ) )` (`:196`), e o `array_merge` so quando a
    // descida achou algo (`:198`) — indiferente para o resultado, e transcrito.
    if (envolvido !== undefined && envolvido !== '' && envolvido !== '0') {
      nomes.push(...marcasUsadasNoCorpo(registro, envolvido));
    }
  }
  return Object.freeze(nomes);
}
