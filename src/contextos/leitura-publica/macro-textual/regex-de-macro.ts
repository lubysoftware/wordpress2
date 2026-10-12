/**
 * A delimitacao da marca como expressao regular — `get_shortcode_regex()`
 * (`wp-includes/shortcodes.php:324`) e a varredura de marcas presentes no corpo
 * (`:255-256`).
 *
 * Entrega de **T017** (US-8), e e aqui que a regra de negocio de US-8 —
 * *"shortcode e macro textual em colchetes expandida na renderizacao"*, o caso
 * `UT-171-6` do catalogo — deixa de ser frase e passa a ser dado: a delimitacao
 * esta declarada num lugar so, e
 * os quatro consumidores dela (`do_shortcode`, `has_shortcode`,
 * `get_shortcode_tags_in_content` e `strip_shortcodes`) a recebem montada.
 *
 * ---
 *
 * ## O aviso que o legado escreve em maiusculas, e que vale para este arquivo
 *
 * `:332-335`: *"WARNING! Do not change this regex without changing
 * do_shortcode_tag() and strip_shortcode_tag(). Also, see shortcode_unautop()
 * and shortcode.js."*
 *
 * Dos quatro, dois estao nesta tarefa (`./expandir-macros.ts`), `shortcode_unautop()`
 * e de `wp-includes/formatting.php:808` e `shortcode.js` e lado cliente — a
 * lacuna L4 de `soul.md`, que a resposta 15 manda construir a partir do
 * repositorio de origem. Quem mexer na expressao daqui mexe nos quatro.
 *
 * ## Os 6 grupos, com o nome que o legado lhes da em `:310-317`
 *
 * | # | o que e | quem le |
 * |---|---|---|
 * | 1 | o `[` extra do escape `[[marca]]` | `do_shortcode_tag:396` e `:434`, `strip_shortcode_tag:759` e `:763` |
 * | 2 | o nome da marca | `:400`, e a **referencia retroativa** `\2` dentro do grupo 5 |
 * | 3 | a lista de argumentos | `:401`, por `shortcode_parse_atts()` |
 * | 4 | a barra de auto-fechamento | ninguem le; existe para que o ramo exista |
 * | 5 | o conteudo que a marca envolve | `:432` |
 * | 6 | o `]` extra do escape `[[marca]]` | `:396` e `:434`, `:759` e `:763` |
 *
 * ⚠️ **O grupo 4 nao e lido por ninguem, e isso nao o torna removivel**: e ele
 * que faz `[marca /]` casar sem exigir `[/marca]`, e tirar o grupo mantendo a
 * alternativa mudaria a numeracao dos dois seguintes — que `:396` e `:432` leem
 * por numero.
 *
 * ## ⚠️ A ordem da alternancia e a ordem de registro, e ela e observavel
 *
 * `$tagnames = array_intersect( array_keys( $shortcode_tags ), $matches[1] )`
 * (`:256`): `array_intersect` devolve os elementos do **primeiro** arranjo,
 * preservando a ordem dele. Logo a alternancia sai na ordem em que as marcas
 * foram registradas, e nao na ordem em que aparecem no corpo nem em ordem
 * alfabetica.
 *
 * Isso importa porque a alternancia de PCRE e **ordenada**: a primeira
 * alternativa que casa na posicao vence. O `(?![\w-])` de `:343` conserta o caso
 * comum — com `foo` registrada antes de `foobar`, `[foobar]` nao casa `foo`
 * porque `b` e caractere de palavra, e o motor segue para a alternativa
 * seguinte. O que ele **nao** conserta e o par em que o prefixo termina numa
 * fronteira: com `a.b` e `a` registradas nessa ordem, a ordem decide. Reordenar
 * a alternancia por tamanho seria "consertar" o legado (P1).
 *
 * `array_intersect` tambem **repete** nada: a chave e unica no arranjo de
 * registro. E ele compara os valores **como texto**, que e indiferente aqui
 * porque chave de marca ja e texto.
 */

import {
  marcasRegistradas,
  type RegistroDeMacros,
} from './registro-de-macros.js';
import { protegerParaRegex } from './semantica-de-pcre.js';

/**
 * `preg_match_all( '@\[([^<>&/\[\]\x00-\x20=]++)@', $content, $matches )`
 * (`wp-includes/shortcodes.php:255` e `:717`).
 *
 * A varredura grosseira que colhe **todo** nome que parece marca, antes de saber
 * quais estao registradas. A classe negada e a **mesma** de
 * `CARACTERE_RECUSADO_NA_MARCA` em `./registro-de-macros.ts`, e nao por
 * coincidencia: um nome que `add_shortcode()` recusaria nunca seria achado aqui.
 *
 * ⚠️ Nao exige o `]` de fechamento e nao conhece o escape `[[`: ela existe para
 * **recortar** a alternancia, e um nome a mais nela so faz a expressao final
 * ficar maior. O `++` possessivo cai para `+` pela prova no cabecalho de
 * `./semantica-de-pcre.ts` — nao ha nada depois dele no padrao.
 */
const MARCA_APARENTE_NO_CORPO = '\\[([^<>&/\\[\\]\\x00-\\x20=]+)';

/**
 * O recorte de `:255-256`: as marcas **registradas** que aparecem no corpo, na
 * ordem de registro.
 *
 * Devolve vazio quando nenhuma aparece, que e o `if ( empty( $tagnames ) )` de
 * `:258` — e a terceira das tres saidas antecipadas de `do_shortcode()`.
 */
export function marcasDoCorpoParaExpandir(
  registro: RegistroDeMacros,
  corpo: string,
): readonly string[] {
  return marcasDoCorpoEntre(marcasRegistradas(registro), corpo);
}

/**
 * `array_intersect( $tags_a_considerar, $matches[1] )` — o recorte com a lista
 * de marcas vinda de fora.
 *
 * Existe separada porque `strip_shortcodes()` passa pela lista **filtrada** por
 * `strip_shortcodes_tagnames` (`:726`) em lugar das chaves do registro, e o
 * recorte e o mesmo.
 */
export function marcasDoCorpoEntre(
  consideradas: readonly string[],
  corpo: string,
): readonly string[] {
  // Expressao nova a cada chamada: uma com `g` no escopo do modulo guardaria
  // `lastIndex` entre requisicoes, que e o estado que BR-MIGRAR-105 nao admite.
  const varredura = new RegExp(MARCA_APARENTE_NO_CORPO, 'g');
  const aparentes = new Set<string>();
  let achado = varredura.exec(corpo);
  while (achado !== null) {
    aparentes.add(achado[1] as string);
    achado = varredura.exec(corpo);
  }
  // `array_intersect` devolve os elementos do PRIMEIRO arranjo, na ordem dele, e
  // mantem as repeticoes que ele tiver — que e o que `filter` faz aqui.
  return Object.freeze(consideradas.filter((marca) => aparentes.has(marca)));
}

/**
 * `get_shortcode_regex( $tagnames )` (`wp-includes/shortcodes.php:324`),
 * transcrita linha a linha com os comentarios do legado.
 *
 * Os tres `*+` e `[^\[]*+` do grupo 5 saem como gulosos comuns, e a prova de que
 * o resultado nao muda esta no cabecalho de `./semantica-de-pcre.ts`.
 *
 * ⚠️ **Sem a bandeira `u`**, e de proposito: `protegerParaRegex()` emite
 * `\=`, `\!`, `\<`, `\>`, `\:`, `\-`, `\#` e `\/` como PCRE os emite, e esses
 * escapes de identidade sao erro de sintaxe numa expressao com `u`. Nenhuma
 * classe deste padrao e Unicode, logo a bandeira nao acrescentaria nada.
 */
export function fonteDaExpressaoDeMacro(marcas: readonly string[]): string {
  const alternancia = marcas.map(protegerParaRegex).join('|');

  return (
    '\\[' +                              // Opening bracket.
    '(\\[?)' +                           // 1: Optional second opening bracket for escaping shortcodes: [[tag]].
    `(${alternancia})` +                 // 2: Shortcode name.
    '(?![\\w-])' +                       // Not followed by word character or hyphen.
    '(' +                                // 3: Unroll the loop: Inside the opening shortcode tag.
    '[^\\]\\/]*' +                       //    Not a closing bracket or forward slash.
    '(?:' +
    '\\/(?!\\])' +                       //        A forward slash not followed by a closing bracket.
    '[^\\]\\/]*' +                       //        Not a closing bracket or forward slash.
    ')*?' +
    ')' +
    '(?:' +
    '(\\/)' +                            // 4: Self closing tag...
    '\\]' +                              //    ...and closing bracket.
    '|' +
    '\\]' +                              //    Closing bracket.
    '(?:' +
    '(' +                                // 5: Unroll the loop: Optionally, anything between the opening and closing shortcode tags.
    '[^\\[]*' +                          //        Not an opening bracket.
    '(?:' +
    '\\[(?!\\/\\2\\])' +                 //            An opening bracket not followed by the closing shortcode tag.
    '[^\\[]*' +                          //            Not an opening bracket.
    ')*' +
    ')' +
    '\\[\\/\\2\\]' +                     //        Closing shortcode tag.
    ')?' +
    ')' +
    '(\\]?)'                             // 6: Optional second closing bracket for escaping shortcodes: [[tag]].
  );
}

/**
 * A expressao de `"/$pattern/"`, como `:273`, `:506`, `:537`, `:544` e `:729` a
 * montam.
 *
 * Nasce sem `g`: quem precisa da varredura global e
 * `substituirComCallback()`, que clona a expressao com a bandeira — ver a razao
 * la, que e o `lastIndex` atravessando o laco de elementos e de atributos.
 *
 * ⚠️ **Nao a monte com a lista vazia.** `get_shortcode_regex()` com `$tagnames`
 * vazio usa **todas** as chaves do registro (`:326-328`), e com o registro
 * tambem vazio a alternancia fica vazia — `(|)`, que casa texto vazio em toda
 * posicao. Os quatro consumidores do legado saem antes disso, e cada um por uma
 * guarda propria: `do_shortcode()` em `:250` e `:258`, `strip_shortcodes()` em
 * `:712` e `:732`, e `has_shortcode()` e `get_shortcode_tags_in_content()` por
 * `shortcode_exists()` e pela varredura de `:255`. Quem acrescentar um quinto
 * consumidor repete a guarda.
 */
export function expressaoDeMacro(marcas: readonly string[]): RegExp {
  return new RegExp(fonteDaExpressaoDeMacro(marcas));
}

