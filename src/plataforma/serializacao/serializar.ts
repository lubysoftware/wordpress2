/**
 * Escrita do formato serializado do legado, em bytes.
 *
 * Devolve `Uint8Array` e nao `string` de proposito: o criterio e byte a byte, o
 * comprimento do texto no formato e contado em **bytes** e nao em caracteres, e
 * a coluna de destino guarda bytes. Devolver texto obrigaria quem grava a
 * recodificar, e e na recodificacao que a divergencia de um byte nasce.
 *
 * Nenhuma funcao daqui conhece chave de metadado, tabela ou regra de negocio:
 * este arquivo e so o formato.
 */

import type { ChaveDeArranjo, ValorPhp } from './valor-php.js';

const CODIFICADOR = new TextEncoder();

/** Serializa um valor, na forma em que o legado o grava na coluna. */
export function serializar(valor: ValorPhp): Uint8Array {
  const pedacos: Uint8Array[] = [];
  escreverValor(valor, pedacos);
  return concatenar(pedacos);
}

/** O mesmo, decodificado como texto. Atalho de leitura: os bytes sao a verdade. */
export function serializarComoTexto(valor: ValorPhp): string {
  return new TextDecoder().decode(serializar(valor));
}

function escreverValor(valor: ValorPhp, pedacos: Uint8Array[]): void {
  switch (valor.tipo) {
    case 'nulo':
      pedacos.push(CODIFICADOR.encode('N;'));
      return;

    case 'booleano':
      pedacos.push(CODIFICADOR.encode(valor.valor ? 'b:1;' : 'b:0;'));
      return;

    case 'inteiro':
      if (!Number.isInteger(valor.valor)) {
        throw new TypeError(
          `valor marcado como inteiro nao e inteiro: ${String(valor.valor)}`,
        );
      }
      pedacos.push(CODIFICADOR.encode(`i:${String(valor.valor)};`));
      return;

    case 'decimal':
      pedacos.push(CODIFICADOR.encode(`d:${formatarDecimal(valor.valor)};`));
      return;

    case 'texto':
      escreverTexto(valor.valor, pedacos);
      return;

    case 'arranjo': {
      pedacos.push(CODIFICADOR.encode(`a:${String(valor.entradas.length)}:{`));
      for (const entrada of valor.entradas) {
        escreverChave(entrada.chave, pedacos);
        escreverValor(entrada.valor, pedacos);
      }
      pedacos.push(CODIFICADOR.encode('}'));
      return;
    }
  }
}

function escreverChave(chave: ChaveDeArranjo, pedacos: Uint8Array[]): void {
  if (chave.tipo === 'inteiro') {
    if (!Number.isInteger(chave.valor)) {
      throw new TypeError(
        `chave marcada como inteira nao e inteira: ${String(chave.valor)}`,
      );
    }
    pedacos.push(CODIFICADOR.encode(`i:${String(chave.valor)};`));
    return;
  }
  escreverTexto(chave.valor, pedacos);
}

function escreverTexto(valor: string | Uint8Array, pedacos: Uint8Array[]): void {
  const bytes = typeof valor === 'string' ? CODIFICADOR.encode(valor) : valor;
  pedacos.push(CODIFICADOR.encode(`s:${String(bytes.length)}:"`));
  pedacos.push(bytes);
  pedacos.push(CODIFICADOR.encode('";'));
}

/**
 * A forma decimal, com a mesma aparencia que o legado grava.
 *
 * O legado escreve o decimal pela representacao **mais curta que volta ao mesmo
 * valor** (a configuracao `serialize_precision = -1`, que e a de fabrica desde
 * a versao 7.1 do runtime de origem), e e por isso que `1.0` sai como `d:1;` e
 * `0.1` sai como `d:0.1;` — e nao com dezessete digitos.
 *
 * 🔴 **Lacuna declarada, e nomeada aqui para nao ser descoberta depois.** Na
 * faixa em que as duas implementacoes trocam de notacao — este runtime passa a
 * exponencial a partir de `1e21`, e a origem a partir do decimo quinto
 * expoente — a aparencia pode divergir, embora o valor nao. Nenhum valor desta
 * feature e decimal: conta, perfil, sessao e definicao de papel guardam texto,
 * inteiro e booleano. Fechar a equivalencia do decimal e trabalho de quem levar
 * este codec para `plataforma/opcoes/`, contra o oraculo executavel
 * (`015-plataforma-transversal`, T001), e esta registrado na suite de
 * conformidade.
 */
function formatarDecimal(valor: number): string {
  if (Number.isNaN(valor)) {
    return 'NAN';
  }
  if (valor === Number.POSITIVE_INFINITY) {
    return 'INF';
  }
  if (valor === Number.NEGATIVE_INFINITY) {
    return '-INF';
  }
  if (Object.is(valor, -0)) {
    return '-0';
  }

  const curta = String(valor);
  const corte = curta.indexOf('e');
  if (corte === -1) {
    return curta;
  }

  // Notacao exponencial: a origem escreve `1.0E+25`, com ao menos um digito
  // depois do ponto e o expoente em maiuscula.
  const mantissa = curta.slice(0, corte);
  const expoente = curta.slice(corte + 1);
  const comPonto = mantissa.includes('.') ? mantissa : `${mantissa}.0`;
  return `${comPonto}E${expoente}`;
}

function concatenar(pedacos: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const pedaco of pedacos) {
    total += pedaco.length;
  }
  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const pedaco of pedacos) {
    bytes.set(pedaco, posicao);
    posicao += pedaco.length;
  }
  return bytes;
}
