/**
 * Leitura do formato serializado do legado.
 *
 * **A falha volta como valor, nunca como excecao.** No legado a leitura de um
 * valor malformado devolve `false` e quem chama decide — e o P7 da constituicao
 * manda preservar o modo de falha, inclusive o silencio. Uma leitura que
 * lancasse transformaria um estado que o produto tolera num fluxo de erro que
 * ele nao tem.
 *
 * **Sobra de bytes e falha**, como na origem: a leitura so aceita o que consome
 * a cadeia inteira.
 */

import {
  type ChaveDeArranjo,
  type EntradaDeArranjo,
  type ValorPhp,
} from './valor-php.js';

export type ResultadoDeLeitura =
  | { readonly ok: true; readonly valor: ValorPhp }
  | { readonly ok: false; readonly motivo: string };

const CODIFICADOR = new TextEncoder();

/** Le um valor serializado. Nao lanca: a falha volta em `ok: false`. */
export function desserializar(entrada: Uint8Array | string): ResultadoDeLeitura {
  const bytes =
    typeof entrada === 'string' ? CODIFICADOR.encode(entrada) : entrada;
  const leitor: Leitor = { bytes, posicao: 0 };

  try {
    const valor = lerValor(leitor);
    if (leitor.posicao !== bytes.length) {
      return {
        ok: false,
        motivo: `sobraram ${String(bytes.length - leitor.posicao)} bytes depois do valor`,
      };
    }
    return { ok: true, valor };
  } catch (erro) {
    if (erro instanceof ErroDeFormato) {
      return { ok: false, motivo: erro.message };
    }
    throw erro;
  }
}

interface Leitor {
  readonly bytes: Uint8Array;
  posicao: number;
}

class ErroDeFormato extends Error {}

function lerValor(leitor: Leitor): ValorPhp {
  const marca = String.fromCharCode(consumirByte(leitor));

  switch (marca) {
    case 'N':
      exigir(leitor, ';');
      return { tipo: 'nulo' };

    case 'b': {
      exigir(leitor, ':');
      const digito = String.fromCharCode(consumirByte(leitor));
      if (digito !== '0' && digito !== '1') {
        throw new ErroDeFormato(`booleano com digito invalido: ${digito}`);
      }
      exigir(leitor, ';');
      return { tipo: 'booleano', valor: digito === '1' };
    }

    case 'i': {
      exigir(leitor, ':');
      const bruto = lerAte(leitor, ';');
      if (!/^-?[0-9]+$/.test(bruto)) {
        throw new ErroDeFormato(`inteiro malformado: ${bruto}`);
      }
      return { tipo: 'inteiro', valor: Number(bruto) };
    }

    case 'd': {
      exigir(leitor, ':');
      const bruto = lerAte(leitor, ';');
      return { tipo: 'decimal', valor: lerDecimal(bruto) };
    }

    case 's':
      return { tipo: 'texto', valor: lerTexto(leitor) };

    case 'a': {
      exigir(leitor, ':');
      const quantidade = Number(lerAte(leitor, ':'));
      if (!Number.isInteger(quantidade) || quantidade < 0) {
        throw new ErroDeFormato('arranjo com quantidade invalida');
      }
      exigir(leitor, '{');
      const entradas: EntradaDeArranjo[] = [];
      for (let indice = 0; indice < quantidade; indice += 1) {
        entradas.push({ chave: lerChave(leitor), valor: lerValor(leitor) });
      }
      exigir(leitor, '}');
      return { tipo: 'arranjo', entradas };
    }

    default:
      // `O:` (objeto), `E:` (enumeracao) e `R:`/`r:` (referencia) existem no
      // formato e NAO sao lidos aqui: nenhum valor de conta, perfil, sessao ou
      // definicao de papel os usa, e reconhece-los sem oraculo seria inventar
      // comportamento. A falha e explicita, e e por isso que ela diz a marca.
      throw new ErroDeFormato(`marca de tipo nao reconhecida: ${marca}`);
  }
}

function lerChave(leitor: Leitor): ChaveDeArranjo {
  const marca = String.fromCharCode(consumirByte(leitor));
  if (marca === 'i') {
    exigir(leitor, ':');
    const bruto = lerAte(leitor, ';');
    if (!/^-?[0-9]+$/.test(bruto)) {
      throw new ErroDeFormato(`chave inteira malformada: ${bruto}`);
    }
    return { tipo: 'inteiro', valor: Number(bruto) };
  }
  if (marca === 's') {
    return { tipo: 'texto', valor: lerTexto(leitor) };
  }
  throw new ErroDeFormato(`chave de arranjo com marca invalida: ${marca}`);
}

/**
 * Le um texto do formato, que e cadeia de **bytes** com comprimento em bytes.
 *
 * Devolve `string` quando os bytes sao UTF-8 valido e `Uint8Array` quando nao
 * sao. A alternativa seria decodificar com substituicao, e ai a ida e volta
 * deixaria de devolver os mesmos bytes — que e o unico criterio que este codec
 * tem (`DB-SER`).
 */
function lerTexto(leitor: Leitor): string | Uint8Array {
  exigir(leitor, ':');
  const bruto = lerAte(leitor, ':');
  const comprimento = Number(bruto);
  if (!Number.isInteger(comprimento) || comprimento < 0) {
    throw new ErroDeFormato(`texto com comprimento invalido: ${bruto}`);
  }
  exigir(leitor, '"');
  if (leitor.posicao + comprimento > leitor.bytes.length) {
    throw new ErroDeFormato('texto mais curto que o comprimento declarado');
  }
  const bytes = leitor.bytes.slice(
    leitor.posicao,
    leitor.posicao + comprimento,
  );
  leitor.posicao += comprimento;
  exigir(leitor, '"');
  exigir(leitor, ';');

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return bytes;
  }
}

function lerDecimal(bruto: string): number {
  if (bruto === 'NAN') {
    return Number.NaN;
  }
  if (bruto === 'INF') {
    return Number.POSITIVE_INFINITY;
  }
  if (bruto === '-INF') {
    return Number.NEGATIVE_INFINITY;
  }
  const valor = Number(bruto);
  if (Number.isNaN(valor)) {
    throw new ErroDeFormato(`decimal malformado: ${bruto}`);
  }
  return valor;
}

function consumirByte(leitor: Leitor): number {
  const byte = leitor.bytes[leitor.posicao];
  if (byte === undefined) {
    throw new ErroDeFormato('cadeia terminou antes do esperado');
  }
  leitor.posicao += 1;
  return byte;
}

function exigir(leitor: Leitor, caractere: string): void {
  const byte = consumirByte(leitor);
  if (String.fromCharCode(byte) !== caractere) {
    throw new ErroDeFormato(
      `esperava ${caractere} na posicao ${String(leitor.posicao - 1)}`,
    );
  }
}

function lerAte(leitor: Leitor, caractere: string): string {
  const inicio = leitor.posicao;
  for (;;) {
    const byte = consumirByte(leitor);
    if (String.fromCharCode(byte) === caractere) {
      return new TextDecoder().decode(
        leitor.bytes.slice(inicio, leitor.posicao - 1),
      );
    }
  }
}
