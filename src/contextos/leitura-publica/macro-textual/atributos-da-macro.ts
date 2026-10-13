/**
 * Os atributos da marca — `get_shortcode_atts_regex()`
 * (`wp-includes/shortcodes.php:593`), `shortcode_parse_atts()` (`:613`) e
 * `shortcode_atts()` (`:664`).
 *
 * Entrega de **T017** (US-8). E o que transforma o grupo 3 da expressao — a
 * lista de argumentos crua, `' id="4" 3 largura=10'` — no arranjo que o tratador
 * recebe como primeiro argumento.
 *
 * ---
 *
 * ## Por que o arranjo e um `Map` e nao um objeto
 *
 * Porque o arranjo do interpretador tem tres propriedades que o objeto perderia,
 * e as tres sao observaveis para quem escreve tratador:
 *
 * 1. **A chave e texto OU inteiro.** `$atts[ strtolower( $m[1] ) ]` grava
 *    nomeada (`:620`); `$atts[] = ...` grava **posicional**, com indice inteiro
 *    que comeca em 0 (`:626`). Um tratador le `$atts['id']` e `$atts[0]` no mesmo
 *    arranjo, e `gallery_shortcode()` faz os dois.
 * 2. **A ordem de insercao sobrevive**, e um tratador que itere com `foreach` a
 *    enxerga.
 * 3. **Reescrever uma chave mantem a posicao dela.** `[m a=1 b=2 a=3]` deixa `a`
 *    na **primeira** posicao com o valor `3`, nao na terceira. O `Map` deste
 *    runtime faz exatamente isso; um objeto com chave numerica, nao — ele
 *    reordena a chave inteira para a frente.
 *
 * ## ⚠️ Os quatro quirks que um porte "limpo" apaga em silencio
 *
 * | o que | legado | o que acontece |
 * |---|---|---|
 * | `! empty( $m[1] )` e nao `isset()` nos tres primeiros ramos | `:619`, `:621`, `:623` | o nome `0` cai para o ramo seguinte, porque `'0'` e vazio no interpretador — e como os ramos posicionais nao estao fixados naquele achado, `[m 0=x]` **nao grava nada**: o atributo desaparece |
 * | `isset(...) && strlen(...)` nos ramos 7 e 8, e so `isset()` no 9 | `:625`, `:627`, `:629` | o valor entre aspas **vazio** nao grava nada: `[m ""]` deixa o arranjo intacto, porque `strlen('')` e 0 e os dois ramos seguintes nao estao fixados |
 * | o nome vai para minuscula, o valor **nao** | `:620` e `:622` | `[m ID="A"]` da a chave `id` com o valor `A` |
 * | `stripcslashes()` em **todo** valor | `:620`-`:630` | `[m id="a\\nb"]` grava uma quebra de linha de verdade; ver `textoSemBarraDeC` |
 *
 * ## ⚠️ E o quinto, que nao e quirk e sim decisao de seguranca do legado
 *
 * O laco de `:635-641` esvazia **todo** valor que contenha `<` e que nao seja
 * uma sequencia de elementos fechados: `/^[^<]*+(?:<[^>]*+>[^<]*+)*+$/`. O
 * comentario e de uma linha — *"Reject any unclosed HTML elements"* (`:634`) —
 * e o efeito e que `[m id="<b"]` chega ao tratador com `id` em texto vazio, e
 * **nao** com o texto original. Ele roda depois de todos os ramos, sobre o
 * arranjo inteiro, inclusive sobre os posicionais.
 */

import type { AtributosDaMacro } from './registro-de-macros.js';
import {
  CLASSE_DE_ESPACO,
  ESPACO_DO_PCRE,
  acharTodosComoNoPhp,
  textoSemBarraDeC,
} from './semantica-de-pcre.js';

/**
 * `get_shortcode_atts_regex()` (`wp-includes/shortcodes.php:593`), com os 9
 * grupos e as 6 alternativas que `shortcode_parse_atts()` le por numero.
 *
 * | alternativa | grupos | forma |
 * |---|---|---|
 * | 1 | 1, 2 | `nome="valor"` |
 * | 2 | 3, 4 | `nome='valor'` |
 * | 3 | 5, 6 | `nome=valor` sem aspas |
 * | 4 | 7 | `"valor"` posicional |
 * | 5 | 8 | `'valor'` posicional |
 * | 6 | 9 | `valor` posicional sem aspas |
 *
 * `\s` e `\S` saem como as classes de PCRE e nao como as deste runtime — a razao
 * esta em {@link ESPACO_DO_PCRE}, e aqui ela e concreta: com o `\s` do runtime o
 * espaco Unicode encerraria o valor sem aspas, e no interpretador ele faz parte
 * do valor.
 *
 * ⚠️ A alternativa 6 e `(\S+)`, que casa **qualquer** coisa sem espaco — logo a
 * ordem das seis importa, e a sexta e a rede que apanha o resto. E cada
 * alternativa termina em `(?:\s|$)`, o que significa que um valor sem aspas
 * precisa ser seguido de espaco ou do fim do texto para ser reconhecido.
 */
const FONTE_DA_EXPRESSAO_DE_ATRIBUTOS =
  `([\\w-]+)${CLASSE_DE_ESPACO}*=${CLASSE_DE_ESPACO}*"([^"]*)"(?:${CLASSE_DE_ESPACO}|$)` +
  `|([\\w-]+)${CLASSE_DE_ESPACO}*=${CLASSE_DE_ESPACO}*'([^']*)'(?:${CLASSE_DE_ESPACO}|$)` +
  `|([\\w-]+)${CLASSE_DE_ESPACO}*=${CLASSE_DE_ESPACO}*([^${ESPACO_DO_PCRE}'"]+)(?:${CLASSE_DE_ESPACO}|$)` +
  `|"([^"]*)"(?:${CLASSE_DE_ESPACO}|$)` +
  `|'([^']*)'(?:${CLASSE_DE_ESPACO}|$)` +
  `|([^${ESPACO_DO_PCRE}]+)(?:${CLASSE_DE_ESPACO}|$)`;

/**
 * `preg_replace( "/[\x{00a0}\x{200b}]+/u", ' ', $text )` (`:616`).
 *
 * Normaliza **corrida** de espaco sem quebra e de espaco de largura zero num
 * unico espaco comum, antes de qualquer analise. Com `/u`, e portanto sobre
 * caractere e nao sobre byte — por isso esta expressao liga a bandeira `u`, que
 * nenhuma outra desta tarefa liga.
 *
 * E o que torna o `\s` restrito de PCRE suportavel na pratica: os dois espacos
 * que um editor visual injeta ja chegam convertidos.
 */
const ESPACO_INVISIVEL = /[\u00a0\u200b]+/gu;

/** A rejeicao de `:637` — uma sequencia de elementos HTML **fechados**. */
const ELEMENTOS_FECHADOS = /^[^<]*(?:<[^>]*>[^<]*)*$/;

/**
 * `shortcode_parse_atts( $text )` (`wp-includes/shortcodes.php:613`).
 *
 * Devolve sempre um arranjo, **inclusive vazio** — e isso e a mudanca de 6.5.0
 * que o docblock registra: *"The function now always returns an array, even if
 * the original arguments string cannot be parsed or is empty"* (`:605-606`).
 * Nenhum chamador precisa testar nulo, e o docblock de `do_shortcode_tag()`
 * repete a garantia nos dois pontos de extensao (`:420` e `:440`).
 */
export function atributosDaMacro(texto: string): AtributosDaMacro {
  const atributos = new Map<string | number, string>();
  let proximoPosicional = 0;

  const normalizado = texto.replace(ESPACO_INVISIVEL, ' ');
  const achados = acharTodosComoNoPhp(
    new RegExp(FONTE_DA_EXPRESSAO_DE_ATRIBUTOS),
    normalizado,
  );

  // `if ( preg_match_all( ... ) )` (`:617`): zero ocorrencias e falso, e o laco
  // de rejeicao de `:635` fica DENTRO desse `if`. Logo um texto sem atributo
  // nenhum nao passa pela rejeicao — indiferente com o arranjo vazio, e
  // deliberado aqui para que a estrutura do porte seja a do legado.
  if (achados.length === 0) {
    return Object.freeze(atributos);
  }

  for (const achado of achados) {
    // `! empty( $m[N] )` — e nao `isset()`. O nome `'0'` e vazio no
    // interpretador e por isso escorrega para os ramos posicionais.
    if (!vazioNoNome(achado[1])) {
      atributos.set(
        (achado[1] as string).toLowerCase(),
        textoSemBarraDeC(achado[2] ?? ''),
      );
    } else if (!vazioNoNome(achado[3])) {
      atributos.set(
        (achado[3] as string).toLowerCase(),
        textoSemBarraDeC(achado[4] ?? ''),
      );
    } else if (!vazioNoNome(achado[5])) {
      atributos.set(
        (achado[5] as string).toLowerCase(),
        textoSemBarraDeC(achado[6] ?? ''),
      );
    } else if (achado[7] !== undefined && achado[7].length > 0) {
      // `isset( $m[7] ) && strlen( $m[7] )`: o valor entre aspas VAZIO nao
      // grava nada, porque os ramos 8 e 9 nao estao fixados neste achado.
      atributos.set(proximoPosicional, textoSemBarraDeC(achado[7]));
      proximoPosicional += 1;
    } else if (achado[8] !== undefined && achado[8].length > 0) {
      atributos.set(proximoPosicional, textoSemBarraDeC(achado[8]));
      proximoPosicional += 1;
    } else if (achado[9] !== undefined) {
      // Somente `isset()` no nono: aqui o texto vazio GRAVARIA — e a
      // alternativa 6 e `(\S+)`, que nunca casa vazio. Transcrito como esta
      // porque e o que a linha diz.
      atributos.set(proximoPosicional, textoSemBarraDeC(achado[9]));
      proximoPosicional += 1;
    }
  }

  // `// Reject any unclosed HTML elements.` (`:634-641`), sobre o arranjo
  // inteiro e depois de todos os ramos.
  for (const [chave, valor] of atributos) {
    if (valor.includes('<') && !ELEMENTOS_FECHADOS.test(valor)) {
      atributos.set(chave, '');
    }
  }

  return Object.freeze(atributos);
}

/** O `empty( $m[N] )` dos tres primeiros ramos, restrito ao que o grupo pode ser. */
function vazioNoNome(nome: string | undefined): boolean {
  return nome === undefined || nome === '' || nome === '0';
}

/**
 * O valor de um padrao de `shortcode_atts()`.
 *
 * O `$pairs` do legado e arranjo do interpretador e aceita qualquer tipo de
 * default — `media.php` passa texto, inteiro e booleano no mesmo arranjo. O que
 * chega **dos** atributos e sempre texto, porque e o que
 * {@link atributosDaMacro} grava.
 */
export type ValorDeAtributo = string | number | boolean | null;

/** O filtro `shortcode_atts_{$shortcode}` (`wp-includes/shortcodes.php:689`). */
export type IntercepcaoDosAtributos = (
  saida: ReadonlyMap<string, ValorDeAtributo>,
  padroes: ReadonlyMap<string, ValorDeAtributo>,
  atributos: AtributosDaMacro,
  marca: string,
) => ReadonlyMap<string, ValorDeAtributo>;

/**
 * `shortcode_atts( $pairs, $atts, $shortcode )`
 * (`wp-includes/shortcodes.php:664`).
 *
 * Combina os atributos informados com os suportados, **descartando** o que nao
 * esta em `$pairs` — o docblock e explicito: *"If the $atts list has unsupported
 * attributes, then they will be ignored and removed from the final returned
 * list"* (`:655-656`).
 *
 * ⚠️ **O teste e `array_key_exists` e nao `isset`** (`:669`), logo um atributo
 * informado como texto vazio **vence** o default. E a chave procurada e texto,
 * logo os posicionais nunca casam um par — eles sobrevivem no arranjo cru, que e
 * de onde o tratador os le.
 *
 * O filtro so dispara quando a marca e informada, e o legado testa
 * `if ( $shortcode )` (`:677`) — verdade do interpretador, logo marca `'0'` nao
 * dispara o filtro. O ponto de extensao chega por argumento enquanto
 * `plataforma/barramento/` nao existe, como os outros desta feature.
 */
export function atributosComPadrao(
  padroes: ReadonlyMap<string, ValorDeAtributo>,
  atributos: AtributosDaMacro,
  marca = '',
  pontos: readonly IntercepcaoDosAtributos[] = [],
): ReadonlyMap<string, ValorDeAtributo> {
  const saida = new Map<string, ValorDeAtributo>();
  for (const [nome, padrao] of padroes) {
    saida.set(nome, atributos.has(nome) ? (atributos.get(nome) as string) : padrao);
  }

  // `if ( $shortcode )` (`:677`) — verdade do interpretador: texto vazio e `'0'`
  // nao disparam o filtro.
  if (marca === '' || marca === '0') {
    return Object.freeze(saida);
  }

  let filtrada: ReadonlyMap<string, ValorDeAtributo> = saida;
  for (const intercepcao of pontos) {
    filtrada = intercepcao(filtrada, padroes, atributos, marca);
  }
  return filtrada;
}
