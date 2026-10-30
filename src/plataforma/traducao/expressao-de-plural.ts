/**
 * A expressao de plural do catalogo: **qual forma vale para cada numero.**
 *
 * Tarefa **T009** da feature `015-plataforma-transversal` — US-4. Satisfaz a
 * metade de numero de **CA-4.5**: *"texto com numero e com ordem de palavras
 * variavel e tratado por forma declarada, nao por concatenacao"*. A forma e
 * declarada **no catalogo**, pelo cabecalho `Plural-Forms`, e cada idioma tem a
 * sua: o portugues tem duas, o polones tres, o arabe seis. Quem traduz escolhe
 * a forma pelo numero; ninguem concatena `'s'`.
 *
 * E o *"avaliador de plural restrito"* da recomendacao do slot `traducao` do
 * `plan.md` — *"a metade que importa neste slot nao e ler o arquivo, e avaliar a
 * expressao de plural"* — e e o porte de duas pecas do legado:
 *
 * | legado | ancora | aqui |
 * |---|---|---|
 * | `Plural_Forms::parse()` | `wp-includes/pomo/plural-forms.php:99` | {@link compilarExpressaoDePlural} |
 * | `Plural_Forms::execute()` | `:261` | {@link ExpressaoDePlural.avaliar} |
 * | `WP_Translation_File::get_plural_form()` | `wp-includes/l10n/class-wp-translation-file.php:217` | {@link formaDePlural} |
 *
 * ---
 *
 * ## Restrito quer dizer: nada de `eval`
 *
 * A expressao vem de um arquivo que qualquer extensao pode instalar. O legado
 * nao a executa como codigo: converte para pos-fixa pelo algoritmo de patio de
 * manobras e avalia sobre uma pilha, com **dez operadores** e a variavel `n`.
 * Este arquivo faz o mesmo, na mesma ordem, e com os mesmos erros.
 *
 * ## ⚠️ Os dois tipos de falha do legado, e por que sao diferentes
 *
 * - **Falha de analise** (simbolo desconhecido, parentese sem par, `:` sem `?`)
 *   lanca `Exception` no construtor, e `make_plural_form_function()`
 *   (`class-wp-translation-file.php:267-275`) a captura e recai em `n != 1`.
 *   Aqui: {@link ErroNaExpressaoDePlural}, capturado por {@link formaDePlural}.
 * - **Falha de avaliacao** (sobra na pilha, operador que a analise deixou passar,
 *   modulo por zero) acontece em `get()`, **fora** de qualquer captura: no legado
 *   e erro fatal na hora de traduzir. Aqui: {@link ErroNaAvaliacaoDoPlural}, que
 *   ninguem captura. Engolir esse erro seria inventar um recuo que o legado nao
 *   tem (P1, P7).
 */

/** Erro de analise: o legado lanca `Exception` e recai em `n != 1`. */
export class ErroNaExpressaoDePlural extends Error {
  override readonly name = 'ErroNaExpressaoDePlural';
}

/** Erro de avaliacao: no legado, fatal. Ninguem o captura. */
export class ErroNaAvaliacaoDoPlural extends Error {
  override readonly name = 'ErroNaAvaliacaoDoPlural';
}

/** `const OP_CHARS = '|&><!=%?:';` (`plural-forms.php:17`). */
const CARACTERES_DE_OPERADOR = '|&><!=%?:';

/** `$op_precedence` (`plural-forms.php:38-58`). */
const PRECEDENCIA: Readonly<Record<string, number>> = {
  '%': 6,
  '<': 5,
  '<=': 5,
  '>': 5,
  '>=': 5,
  '==': 4,
  '!=': 4,
  '&&': 3,
  '||': 2,
  '?:': 1,
  '?': 1,
  '(': 0,
  ')': 0,
};

type Ficha =
  | { readonly tipo: 'var' }
  | { readonly tipo: 'valor'; readonly valor: number }
  | { readonly tipo: 'op'; readonly operador: string };

/** O que a pilha do legado guarda: inteiro, booleano, ou `null` de pilha vazia. */
type ValorNaPilha = number | boolean | null;

/** A expressao compilada. */
export interface ExpressaoDePlural {
  /** A forma pos-fixa, como `$this->tokens`. */
  readonly fichas: readonly Ficha[];
  /**
   * `Plural_Forms::get( $num )` / `execute( $n )` (`plural-forms.php:243`,
   * `:261`): o indice da forma para este numero.
   *
   * @throws {ErroNaAvaliacaoDoPlural} onde o legado para com erro fatal.
   */
  avaliar(n: number): number;
}

/** `strspn( $str, $chars, $pos )`. */
function trechoDe(texto: string, caracteres: string, inicio: number): number {
  let fim = inicio;
  while (fim < texto.length && caracteres.includes(texto.charAt(fim))) {
    fim += 1;
  }
  return fim - inicio;
}

/**
 * `Plural_Forms::parse()` (`wp-includes/pomo/plural-forms.php:99`): infixa para
 * pos-fixa, pelo patio de manobras.
 *
 * Reproduz tambem o que o legado deixa passar: o `:` do ternario tira da pilha
 * **qualquer** coisa que nao seja `?` — inclusive `(` —, e o `)` tira inclusive
 * um `?` sem `:`. As duas sobras viram operador na forma pos-fixa e so explodem
 * na avaliacao, como no legado (`:185-206`, `:128-148`).
 *
 * @throws {ErroNaExpressaoDePlural} nas falhas que o legado lanca na analise.
 */
export function compilarExpressaoDePlural(texto: string): ExpressaoDePlural {
  let posicao = 0;
  const saida: Ficha[] = [];
  const pilha: string[] = [];

  while (posicao < texto.length) {
    const proximo = texto.charAt(posicao);

    switch (proximo) {
      case ' ':
      case '\t':
        posicao += 1;
        break;

      case 'n':
        saida.push({ tipo: 'var' });
        posicao += 1;
        break;

      case '(':
        pilha.push(proximo);
        posicao += 1;
        break;

      case ')': {
        let achou = false;
        while (pilha.length > 0) {
          const topo = pilha[pilha.length - 1] as string;
          if (topo !== '(') {
            saida.push({ tipo: 'op', operador: pilha.pop() as string });
            continue;
          }
          pilha.pop();
          achou = true;
          break;
        }
        if (!achou) {
          throw new ErroNaExpressaoDePlural('Mismatched parentheses');
        }
        posicao += 1;
        break;
      }

      case '|':
      case '&':
      case '>':
      case '<':
      case '!':
      case '=':
      case '%':
      case '?': {
        const fim = trechoDe(texto, CARACTERES_DE_OPERADOR, posicao);
        const operador = texto.slice(posicao, posicao + fim);
        const precedencia = PRECEDENCIA[operador];
        if (precedencia === undefined) {
          throw new ErroNaExpressaoDePlural(`Unknown operator "${operador}"`);
        }

        while (pilha.length > 0) {
          const topo = pilha[pilha.length - 1] as string;
          const doTopo = PRECEDENCIA[topo] as number;
          // "Ternary is right-associative in C." (`:168-175`)
          if (operador === '?:' || operador === '?') {
            if (precedencia >= doTopo) {
              break;
            }
          } else if (precedencia > doTopo) {
            break;
          }
          saida.push({ tipo: 'op', operador: pilha.pop() as string });
        }
        pilha.push(operador);
        posicao += fim;
        break;
      }

      case ':': {
        let achou = false;
        let indice = pilha.length - 1;
        while (indice >= 0) {
          const topo = pilha[indice] as string;
          if (topo !== '?') {
            saida.push({ tipo: 'op', operador: pilha.pop() as string });
            indice -= 1;
            continue;
          }
          pilha[indice] = '?:';
          achou = true;
          break;
        }
        if (!achou) {
          throw new ErroNaExpressaoDePlural('Missing starting "?" ternary operator');
        }
        posicao += 1;
        break;
      }

      default: {
        if (proximo >= '0' && proximo <= '9') {
          const fim = trechoDe(texto, '0123456789', posicao);
          saida.push({ tipo: 'valor', valor: Number(texto.slice(posicao, posicao + fim)) });
          posicao += fim;
          break;
        }
        throw new ErroNaExpressaoDePlural(`Unknown symbol "${proximo}"`);
      }
    }
  }

  while (pilha.length > 0) {
    const topo = pilha.pop() as string;
    if (topo === '(' || topo === ')') {
      throw new ErroNaExpressaoDePlural('Mismatched parentheses');
    }
    saida.push({ tipo: 'op', operador: topo });
  }

  return {
    fichas: saida,
    avaliar: (n) => avaliarFichas(saida, n),
  };
}

/** Verdade do interpretador: `0`, `false` e `null` sao falsos. */
function verdadeiro(valor: ValorNaPilha): boolean {
  return valor !== null && valor !== false && valor !== 0;
}

/** `(int)` do interpretador sobre o que a pilha guarda. */
function inteiro(valor: ValorNaPilha): number {
  if (valor === null || valor === false) {
    return 0;
  }
  if (valor === true) {
    return 1;
  }
  return valor;
}

/**
 * `<`, `<=`, `>` e `>=` do PHP 8 entre inteiro, booleano e `null`: se um dos
 * lados e booleano ou `null`, os dois sao comparados **como booleano**. Em JS,
 * `true < 2` e verdadeiro; no legado e falso (`true` contra `true`).
 */
function comparar(a: ValorNaPilha, b: ValorNaPilha): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  const x = verdadeiro(a) ? 1 : 0;
  const y = verdadeiro(b) ? 1 : 0;
  return x - y;
}

/**
 * `Plural_Forms::execute()` (`plural-forms.php:261`). `array_pop()` de pilha
 * vazia devolve `null`, e `null` segue na conta como no legado.
 *
 * ⚠️ `!=` e `==` sao **estritos** no legado (`!==` e `===`, `:323` e `:329`):
 * um booleano nunca e igual a um inteiro, e `(n > 1) == 1` e sempre falso.
 */
function avaliarFichas(fichas: readonly Ficha[], n: number): number {
  const pilha: ValorNaPilha[] = [];
  const tirar = (): ValorNaPilha => (pilha.length > 0 ? (pilha.pop() as ValorNaPilha) : null);

  for (const ficha of fichas) {
    if (ficha.tipo === 'var') {
      pilha.push(n);
      continue;
    }
    if (ficha.tipo === 'valor') {
      pilha.push(ficha.valor);
      continue;
    }

    const operador = ficha.operador;
    if (operador === '?:') {
      const v3 = tirar();
      const v2 = tirar();
      const v1 = tirar();
      pilha.push(verdadeiro(v1) ? v2 : v3);
      continue;
    }

    const v2 = tirar();
    const v1 = tirar();
    switch (operador) {
      case '%': {
        const divisor = inteiro(v2);
        if (divisor === 0) {
          // `DivisionByZeroError` do interpretador: nao e `Exception`, e nada o captura.
          throw new ErroNaAvaliacaoDoPlural('Modulo by zero');
        }
        const resto = inteiro(v1) % divisor;
        pilha.push(resto === 0 ? 0 : resto);
        break;
      }
      case '||':
        pilha.push(verdadeiro(v1) || verdadeiro(v2));
        break;
      case '&&':
        pilha.push(verdadeiro(v1) && verdadeiro(v2));
        break;
      case '<':
        pilha.push(comparar(v1, v2) < 0);
        break;
      case '<=':
        pilha.push(comparar(v1, v2) <= 0);
        break;
      case '>':
        pilha.push(comparar(v1, v2) > 0);
        break;
      case '>=':
        pilha.push(comparar(v1, v2) >= 0);
        break;
      case '!=':
        pilha.push(v1 !== v2);
        break;
      case '==':
        pilha.push(v1 === v2);
        break;
      default:
        throw new ErroNaAvaliacaoDoPlural(`Unknown operator "${operador}"`);
    }
  }

  if (pilha.length !== 1) {
    throw new ErroNaAvaliacaoDoPlural('Too many values remaining on the stack');
  }

  return inteiro(pilha[0] as ValorNaPilha);
}

/** `\s` do PCRE sem modo UTF: so os seis espacos ASCII. */
const S = '[ \\t\\n\\v\\f\\r]';

/**
 * `get_plural_expression_from_header()` (`class-wp-translation-file.php:250`),
 * com a expressao regular do legado (`:251`).
 *
 * ⚠️ **`;\s+plural` exige ao menos um espaco depois do ponto e virgula.** Um
 * cabecalho `nplurals=2;plural=n>1;` nao casa e cai em `n != 1` — que e o
 * plural do ingles, e nao o do frances que o cabecalho declarava. E o legado.
 */
const CABECALHO_DE_PLURAL = new RegExp(
  `^${S}*nplurals${S}*=${S}*([0-9]+)${S}*;${S}+plural${S}*=${S}*([^\\n]+)$`,
);

/** O recuo do legado: `'n != 1'` (`class-wp-translation-file.php:255` e `:273`). */
export const EXPRESSAO_DE_PLURAL_DE_RECUO = 'n != 1';

/** Os caracteres que o `trim()` do PHP tira por omissao. */
function aparado(texto: string): string {
  return texto.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
}

/** O texto da expressao, a partir do valor do cabecalho `Plural-Forms`. */
export function expressaoDoCabecalho(cabecalho: string): string {
  const casou = CABECALHO_DE_PLURAL.exec(cabecalho);
  if (casou !== null) {
    return aparado(casou[2] as string);
  }
  return EXPRESSAO_DE_PLURAL_DE_RECUO;
}

/**
 * `make_plural_form_function()` (`class-wp-translation-file.php:267`): tira os
 * `;` do fim e compila; falha de analise recai em `n != 1`.
 */
export function compilarComRecuo(expressao: string): ExpressaoDePlural {
  try {
    return compilarExpressaoDePlural(expressao.replace(/;+$/, ''));
  } catch (erro) {
    if (erro instanceof ErroNaExpressaoDePlural) {
      return compilarComRecuo(EXPRESSAO_DE_PLURAL_DE_RECUO);
    }
    throw erro;
  }
}

/**
 * `(int)` do interpretador sobre a contagem que o chamador passou
 * (`(int) $count`, `wp-includes/l10n/class-wp-translations.php:121` e `:127`):
 * trunca para zero, e o que nao e finito vira `0`.
 */
export function contagemInteira(numero: number): number {
  if (!Number.isFinite(numero)) {
    return 0;
  }
  const truncado = Math.trunc(numero);
  return truncado === 0 ? 0 : truncado;
}

/**
 * `WP_Translation_File::get_plural_form( $number )`
 * (`class-wp-translation-file.php:217`): o indice da forma.
 *
 * Com o cabecalho `Plural-Forms`, a expressao dele (`:222-236`). Sem o
 * cabecalho, a regra do ingles: *"only 'One' is considered singular"* (`:238-239`).
 */
export function formaDePlural(
  cabecalhoDePlural: string | undefined,
  numero: number,
): number {
  if (cabecalhoDePlural !== undefined) {
    return compilarComRecuo(expressaoDoCabecalho(cabecalhoDePlural)).avaliar(numero);
  }
  return numero === 1 ? 0 : 1;
}
