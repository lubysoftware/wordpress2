/**
 * `strnatcasecmp()` do PHP, portado — a comparacao com que a fila e ordenada.
 *
 * Parte da entrega de **T002**. *satisfaz:* — (infraestrutura).
 *
 * ## Por que esta funcao existe, em vez de ordenacao numerica
 *
 * Porque a ordem da fila e **dado gravado**, e quem a escreve e esta comparacao.
 * O legado reordena a estrutura na insercao, nas duas operacoes de agendamento
 * (`wp-includes/cron.php:206` e `:328`):
 *
 * ```php
 * $crons[ $event->timestamp ][ $event->hook ][ $key ] = array( ... );
 * uksort( $crons, 'strnatcasecmp' );
 * ```
 *
 * e e nessa ordem que ela sai dos bytes da opcao. PT-005 cobra o resultado no
 * mesmo cenario em que cobra os bytes: *"a ordem das tarefas dentro da estrutura
 * e a mesma nas duas"*. `fila-agendada.ts` ja registrou em T001 que
 * *"`strnatcasecmp` nao e comparacao numerica: para instante Unix positivo as
 * duas coincidem, e e por isso que a diferenca nunca apareceu"* — e que conferir
 * isso era trabalho de T002, nao suposicao de T001. **Esta e a conferencia.**
 *
 * ## O que foi medido no oraculo, e onde as duas leituras divergem
 *
 * Medido no oraculo executavel da resposta 16 (`scripts/oraculo`, PHP 8.3), com
 * `uksort( $a, 'strnatcasecmp' )` sobre as chaves:
 *
 * | chaves | ordem que o PHP produz | ordenacao numerica produziria |
 * |---|---|---|
 * | `30, 100, 9, -5` | `-5, 9, 30, 100` | `-5, 9, 30, 100` — igual |
 * | `2, 10, 1` | `1, 2, 10` | `1, 2, 10` — igual |
 * | `-5, -10, -1` | `-1, -5, -10` | `-10, -5, -1` — **DIVERGE** |
 * | `"05", 5, "5x"` | `05, 5, 5x` | — `strnatcasecmp( "05", "5" )` devolve **0** |
 *
 * As duas ultimas linhas sao a razao de nao trocar por `a - b`:
 *
 * 1. **instante negativo nao ordena por numero.** O `-` nao e digito, logo ele e
 *    comparado como byte (`0x2D`), e so a parte depois dele entra na comparacao
 *    de digitos: `-1` vem antes de `-5`, que vem antes de `-10`. Instante Unix de
 *    verdade e positivo e `wp_schedule_event()` recusa o que nao e inteiro
 *    positivo (`wp-includes/cron.php:254`) — mas `_set_cron_array()` nao recusa
 *    nada, e quem gravar a opcao por fora (ou converter uma fila de versao 1) cai
 *    nesta ordem;
 * 2. **chave com zero a esquerda empata com a sem.** `strnatcasecmp( '05', '5' )`
 *    e `0`, porque o algoritmo pula zeros a esquerda antes de comparar. Duas
 *    chaves que empatam ficam na ordem em que estavam (a ordenacao do PHP e
 *    estavel desde a 8.0), e esse empate so existe porque a chave de texto
 *    `'05'` **nao** e normalizada para inteiro pelo arranjo de origem — ver
 *    `normalizarChaveDeTexto` em `plataforma/serializacao/valor-php.ts`.
 *
 * ## O porte e do algoritmo, nao de uma aproximacao dele
 *
 * O que esta abaixo reproduz `strnatcmp_ex()` de `ext/standard/strnatcmp.c` com
 * `fold_case` ligado, nas quatro partes que decidem resultado: pular zeros **a
 * esquerda**, pular espaco em branco **dentro** da varredura, comparar corrida de
 * digitos pela direita (a corrida mais longa ganha, com desempate pelo primeiro
 * digito diferente) e pela esquerda quando qualquer um dos dois comeca com zero
 * (fracionario — o primeiro digito diferente ganha).
 *
 * **Comparacao em bytes, e dobra de caixa so em ASCII.** A chave de arranjo do
 * formato de origem e cadeia de **bytes** (ver `valor-php.ts`), e o `toupper()`
 * que o PHP usa aqui e o da biblioteca C na locale corrente — que na locale `C`,
 * a do oraculo e a do produto, e so ASCII. Dobrar caixa com as regras de Unicode
 * deste runtime mudaria a ordem de chave acentuada.
 *
 * **Isto nao e so da fila.** `strnatcasecmp` aparece em outros pontos da arvore
 * analisada, e quando `plataforma/utilitarios/` existir (regra de dependencia 5:
 * *"funcao pura mora em `utilitarios/`"*) esta funcao desce para la sem nenhuma
 * chamada mudar de resultado. Enquanto nao existe, ela mora no modulo que a usa —
 * a regra de dependencia 3 proibe um contexto importar outro.
 */

const CODIFICADOR = new TextEncoder();

/** O byte que o C le depois do fim de uma cadeia terminada em `NUL`. */
const FIM = 0;

const ZERO = 0x30;
const NOVE = 0x39;
const A_MINUSCULO = 0x61;
const Z_MINUSCULO = 0x7a;
/** `'a' - 'A'`: a distancia entre as duas caixas em ASCII. */
const DISTANCIA_DE_CAIXA = 0x20;

/**
 * `strnatcasecmp( $a, $b )`: negativo, zero ou positivo, como o PHP devolve.
 *
 * Aceita texto ou bytes porque a chave do arranjo pode ser qualquer dos dois: o
 * formato de origem guarda bytes, e ha coluna que carrega byte que nenhuma
 * decodificacao recupera.
 */
export function compararNaturalSemCaixa(
  aqui: string | Uint8Array,
  ali: string | Uint8Array,
): number {
  const a = typeof aqui === 'string' ? CODIFICADOR.encode(aqui) : aqui;
  const b = typeof ali === 'string' ? CODIFICADOR.encode(ali) : ali;

  // `strnatcmp_ex()` abre com este caso e nao entra no laco: cadeia vazia
  // compara por comprimento.
  if (a.length === 0 || b.length === 0) {
    if (a.length === b.length) {
      return 0;
    }
    return a.length > b.length ? 1 : -1;
  }

  const posicao = { aqui: 0, ali: 0 };
  let primeiraVolta = true;

  for (;;) {
    let ca = byteEm(a, posicao.aqui);
    let cb = byteEm(b, posicao.ali);

    // Pula zeros a esquerda — so na primeira volta, que e o que a variavel
    // `leading` do original faz, e so quando ha outro digito depois.
    if (primeiraVolta) {
      while (ca === ZERO && ehDigito(byteEm(a, posicao.aqui + 1))) {
        posicao.aqui += 1;
        ca = byteEm(a, posicao.aqui);
      }
      while (cb === ZERO && ehDigito(byteEm(b, posicao.ali + 1))) {
        posicao.ali += 1;
        cb = byteEm(b, posicao.ali);
      }
      primeiraVolta = false;
    }

    // Pula espaco em branco consecutivo.
    while (ehEspaco(ca)) {
      posicao.aqui += 1;
      ca = byteEm(a, posicao.aqui);
    }
    while (ehEspaco(cb)) {
      posicao.ali += 1;
      cb = byteEm(b, posicao.ali);
    }

    // Corrida de digitos.
    if (ehDigito(ca) && ehDigito(cb)) {
      const fracionario = ca === ZERO || cb === ZERO;
      const resultado = fracionario
        ? compararPelaEsquerda(a, b, posicao)
        : compararPelaDireita(a, b, posicao);

      if (resultado !== 0) {
        return resultado;
      }
      if (posicao.aqui >= a.length && posicao.ali >= b.length) {
        return 0;
      }
      if (posicao.aqui >= a.length) {
        return -1;
      }
      if (posicao.ali >= b.length) {
        return 1;
      }
      ca = byteEm(a, posicao.aqui);
      cb = byteEm(b, posicao.ali);
    }

    const ma = emCaixaAlta(ca);
    const mb = emCaixaAlta(cb);
    if (ma < mb) {
      return -1;
    }
    if (ma > mb) {
      return 1;
    }

    posicao.aqui += 1;
    posicao.ali += 1;
    if (posicao.aqui >= a.length && posicao.ali >= b.length) {
      return 0;
    }
    if (posicao.aqui >= a.length) {
      return -1;
    }
    if (posicao.ali >= b.length) {
      return 1;
    }
  }
}

interface Posicao {
  aqui: number;
  ali: number;
}

/**
 * `compare_right()`: a corrida de digitos mais longa ganha; empatado o
 * comprimento, ganha o primeiro digito diferente, lembrado em `bias`.
 */
function compararPelaDireita(
  a: Uint8Array,
  b: Uint8Array,
  posicao: Posicao,
): number {
  let desvio = 0;

  for (;;) {
    const ca = byteEm(a, posicao.aqui);
    const cb = byteEm(b, posicao.ali);
    const digitoAqui = posicao.aqui < a.length && ehDigito(ca);
    const digitoAli = posicao.ali < b.length && ehDigito(cb);

    if (!digitoAqui && !digitoAli) {
      return desvio;
    }
    if (!digitoAqui) {
      return -1;
    }
    if (!digitoAli) {
      return 1;
    }
    if (ca < cb) {
      if (desvio === 0) {
        desvio = -1;
      }
    } else if (ca > cb) {
      if (desvio === 0) {
        desvio = 1;
      }
    }

    posicao.aqui += 1;
    posicao.ali += 1;
  }
}

/**
 * `compare_left()`: numeros alinhados pela esquerda — o primeiro a ter valor
 * diferente ganha. E o ramo "fracionario", escolhido quando um dos dois comeca
 * com zero.
 */
function compararPelaEsquerda(
  a: Uint8Array,
  b: Uint8Array,
  posicao: Posicao,
): number {
  for (;;) {
    const ca = byteEm(a, posicao.aqui);
    const cb = byteEm(b, posicao.ali);
    const digitoAqui = posicao.aqui < a.length && ehDigito(ca);
    const digitoAli = posicao.ali < b.length && ehDigito(cb);

    if (!digitoAqui && !digitoAli) {
      return 0;
    }
    if (!digitoAqui) {
      return -1;
    }
    if (!digitoAli) {
      return 1;
    }
    if (ca < cb) {
      return -1;
    }
    if (ca > cb) {
      return 1;
    }

    posicao.aqui += 1;
    posicao.ali += 1;
  }
}

function byteEm(bytes: Uint8Array, indice: number): number {
  return bytes[indice] ?? FIM;
}

function ehDigito(byte: number): boolean {
  return byte >= ZERO && byte <= NOVE;
}

/** `isspace()` da locale `C`: espaco, tabulacao, nova linha, tabulacao vertical, alimentacao de pagina e retorno. */
function ehEspaco(byte: number): boolean {
  return (
    byte === 0x20 || (byte >= 0x09 && byte <= 0x0d)
  );
}

/** `toupper()` da locale `C`: so as 26 letras de ASCII. */
function emCaixaAlta(byte: number): number {
  if (byte >= A_MINUSCULO && byte <= Z_MINUSCULO) {
    return byte - DISTANCIA_DE_CAIXA;
  }
  return byte;
}
