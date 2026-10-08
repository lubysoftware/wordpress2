/**
 * A regra que decide **se** o valor vai serializado para a coluna, e a que
 * decide se o que voltou da coluna vira estrutura outra vez.
 *
 * `serializar.ts` e `desserializar.ts` sao o formato. Este arquivo e a regra de
 * borda que o legado poe em volta dele, e ela mora aqui pelo mesmo motivo que
 * mora em `wp-includes/functions.php` no legado — ao lado do formato, longe de
 * qualquer tabela: `maybe_serialize()` (`:628`), `maybe_unserialize()` (`:653`)
 * e `is_serialized()` (`:674`) nao conhecem coluna, chave nem contexto. Quem
 * grava e quem le e que conhecem.
 *
 * BR-MIGRAR-082 (`DB-SER`) e quem obriga este arquivo a existir, e e literal
 * sobre a parte que surpreende:
 *
 * > A regra de `maybe_serialize()`: array e objeto sao serializados, **e uma
 * > string que ja pareca serializada e serializada de novo**, por compatibilidade
 * > retroativa. [...] A dupla serializacao e **observavel**: gravar a string
 * > `'a:1:{i:0;s:1:"b";}'` e le-la de volta devolve a string, nao o array.
 *
 * O comentario do legado no ponto da dupla serializacao e curto e vale
 * transcrito, porque explica por que isto nao se "conserta":
 * *"Double serialization is required for backward compatibility. See
 * https://core.trac.wordpress.org/ticket/12930. Also the world will end. See WP
 * 3.6.1."*
 *
 * ── TRES ASSIMETRIAS DO LEGADO QUE ESTAO AQUI DE PROPOSITO ──────────────────
 *
 * 1. **A escrita pergunta sem rigor e a leitura pergunta com rigor.**
 *    `maybe_serialize()` chama `is_serialized( $data, false )` e
 *    `maybe_unserialize()` chama `is_serialized( $data )`, que e o modo
 *    estrito. Sao dois criterios diferentes para a mesma cadeia: existe cadeia
 *    que a escrita serializa de novo e que a leitura **nao** tenta ler.
 * 2. **A leitura de cadeia malformada devolve `false`, nao a cadeia.**
 *    `@unserialize( trim( $data ) )` devolve `false` quando falha, e
 *    `maybe_unserialize()` devolve esse `false` — o valor original esta perdido
 *    para quem chamou. E o P7 da constituicao: *"preserve o modo de falha,
 *    inclusive o silencio"*. A arroba do legado e exatamente este silencio.
 * 3. **A pergunta e feita sobre a cadeia aparada, e `aparar` nao e o `trim` do
 *    JavaScript.** `trim()` do PHP remove sete bytes —
 *    `" \t\n\r\0\x0B"` — e nao toca em espaco Unicode; o `String.prototype.trim`
 *    daqui remove espaco Unicode e **nao** remove `\0` nem `\x0B`. Usar o nativo
 *    muda o resultado em valor que carrega byte nulo, que e justamente o que
 *    chega de coluna binaria.
 *
 * Nada aqui valida: `is_serialized()` e uma **farejada** sobre os primeiros
 * bytes, nao um analisador. Ela aceita cadeia que o formato nao le (`O:` de
 * objeto e `C:` de serializacao propria) e e por isso que o item 2 acima tem
 * consequencia: o legado farejou, tentou ler e guardou o `false`.
 */

import { desserializar } from './desserializar.js';
import { serializar } from './serializar.js';
import { booleano, texto, type ValorPhp } from './valor-php.js';

const CODIFICADOR = new TextEncoder();

/** Os sete bytes que o `trim()` da origem remove das duas pontas. */
const BYTES_APARADOS = new Set([0x20, 0x09, 0x0a, 0x0d, 0x00, 0x0b]);

const DOIS_PONTOS = 0x3a;
const PONTO_E_VIRGULA = 0x3b;
const FECHA_CHAVE = 0x7d;
const ASPAS = 0x22;

/**
 * `is_serialized()`, byte a byte (`wp-includes/functions.php:674`).
 *
 * `estrito` reproduz o segundo parametro, e o default e o do legado (`true`).
 * A conferencia e feita em **bytes** porque a origem usa `strlen()` e
 * `substr()`, que contam bytes: uma cadeia com caractere de mais de um byte tem
 * comprimento diferente nas duas contagens, e a comparacao de posicao mudaria
 * de resultado.
 */
export function pareceSerializado(
  dados: string | Uint8Array,
  estrito = true,
): boolean {
  const bytes = aparar(comoBytes(dados));

  // 'N;' e o unico valor que passa sem ter os 4 bytes exigidos abaixo.
  if (bytes.length === 2 && bytes[0] === 0x4e && bytes[1] === PONTO_E_VIRGULA) {
    return true;
  }
  if (bytes.length < 4) {
    return false;
  }
  if (bytes[1] !== DOIS_PONTOS) {
    return false;
  }

  if (estrito) {
    const ultimo = bytes[bytes.length - 1];
    if (ultimo !== PONTO_E_VIRGULA && ultimo !== FECHA_CHAVE) {
      return false;
    }
  } else {
    const pontoEVirgula = bytes.indexOf(PONTO_E_VIRGULA);
    const chave = bytes.indexOf(FECHA_CHAVE);
    // Um dos dois tem de existir, e nenhum dos dois pode estar no comeco.
    if (pontoEVirgula === -1 && chave === -1) {
      return false;
    }
    if (pontoEVirgula !== -1 && pontoEVirgula < 3) {
      return false;
    }
    if (chave !== -1 && chave < 4) {
      return false;
    }
  }

  const marca = bytes[0];

  switch (marca) {
    case 0x73 /* s */: {
      if (estrito) {
        if (bytes[bytes.length - 2] !== ASPAS) {
          return false;
        }
      } else if (!bytes.includes(ASPAS)) {
        return false;
      }
      // E segue para o caso de baixo, como o `switch` da origem segue.
      return comecaComContagem(bytes, marca);
    }
    case 0x61 /* a */:
    case 0x4f /* O */:
    case 0x45 /* E */:
      return comecaComContagem(bytes, marca);
    case 0x62 /* b */:
    case 0x69 /* i */:
    case 0x64 /* d */:
      return comecaComEscalar(bytes, marca, estrito);
    default:
      return false;
  }
}

/**
 * `maybe_serialize()` (`wp-includes/functions.php:628`).
 *
 * Devolve um {@link ValorPhp} e nao bytes: o resultado da regra e *"este valor,
 * ou o texto que o representa"*, e e quem grava que converte texto em parametro
 * de coluna. Arranjo sempre vira texto serializado; texto que **parece**
 * serializado vira texto serializado de novo (a dupla serializacao); escalar
 * passa inteiro.
 *
 * A pergunta e feita no modo **nao estrito**, como na origem.
 */
export function talvezSerializar(valor: ValorPhp): ValorPhp {
  if (valor.tipo === 'arranjo') {
    return texto(serializar(valor));
  }
  if (valor.tipo === 'texto' && pareceSerializado(valor.valor, false)) {
    return texto(serializar(valor));
  }
  return valor;
}

/**
 * `maybe_unserialize()` (`wp-includes/functions.php:653`).
 *
 * Tres saidas, e a terceira e a que um porte distraido perde: o valor lido, o
 * texto como esta quando ele nao parece serializado, e **`false`** quando ele
 * parece e a leitura falha — porque e isso que `@unserialize()` devolve, e o
 * legado nao distingue esse `false` de um `false` gravado.
 */
export function talvezDesserializar(dados: string | Uint8Array): ValorPhp {
  if (!pareceSerializado(dados)) {
    return texto(dados);
  }
  const resultado = desserializar(aparar(comoBytes(dados)));
  return resultado.ok ? resultado.valor : booleano(false);
}

function comoBytes(dados: string | Uint8Array): Uint8Array {
  return typeof dados === 'string' ? CODIFICADOR.encode(dados) : dados;
}

/** O `trim()` da origem: os sete bytes, nas duas pontas, e nada mais. */
function aparar(bytes: Uint8Array): Uint8Array {
  let inicio = 0;
  let fim = bytes.length;
  while (inicio < fim && BYTES_APARADOS.has(bytes[inicio] as number)) {
    inicio += 1;
  }
  while (fim > inicio && BYTES_APARADOS.has(bytes[fim - 1] as number)) {
    fim -= 1;
  }
  return bytes.subarray(inicio, fim);
}

/** `/^{$token}:[0-9]+:/s` — marca, dois-pontos, contagem, dois-pontos. */
function comecaComContagem(bytes: Uint8Array, marca: number): boolean {
  if (bytes[0] !== marca || bytes[1] !== DOIS_PONTOS) {
    return false;
  }
  let posicao = 2;
  while (posicao < bytes.length && ehDigito(bytes[posicao] as number)) {
    posicao += 1;
  }
  return posicao > 2 && bytes[posicao] === DOIS_PONTOS;
}

/** `/^{$token}:[0-9.E+-]+;$/` — e sem o `$` quando a pergunta nao e estrita. */
function comecaComEscalar(
  bytes: Uint8Array,
  marca: number,
  estrito: boolean,
): boolean {
  if (bytes[0] !== marca || bytes[1] !== DOIS_PONTOS) {
    return false;
  }
  let posicao = 2;
  while (posicao < bytes.length && ehEscalar(bytes[posicao] as number)) {
    posicao += 1;
  }
  if (posicao === 2 || bytes[posicao] !== PONTO_E_VIRGULA) {
    return false;
  }
  return estrito ? posicao === bytes.length - 1 : true;
}

function ehDigito(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

/** A classe `[0-9.E+-]` da origem: digito, ponto, `E` maiusculo, sinal. */
function ehEscalar(byte: number): boolean {
  return (
    ehDigito(byte) ||
    byte === 0x2e /* . */ ||
    byte === 0x45 /* E */ ||
    byte === 0x2b /* + */ ||
    byte === 0x2d /* - */
  );
}
