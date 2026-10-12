/**
 * `strnatcasecmp()` portado, conferido contra o oraculo. Entrega de **T002**.
 *
 * Os vetores foram **medidos** no oraculo executavel da resposta 16
 * (`scripts/oraculo`, PHP 8.3), com `uksort( $a, 'strnatcasecmp' )` e com
 * `strnatcasecmp()` direto. Nenhum deles foi deduzido: a funcao e um porte de
 * algoritmo, e algoritmo portado sem vetor medido e algoritmo afirmado.
 *
 * Alem do que esta afirmado aqui, a funcao foi conferida **par a par** contra o
 * oraculo: 42 cadeias escolhidas pelas bordas do algoritmo (zero a esquerda,
 * espaco nas duas pontas e no meio, negativo, caixa, versao com ponto, notacao
 * exponencial, cadeia vazia) dao 1.764 pares, e o sinal devolvido foi **identico
 * nos 1.764**. A conferencia e reproduzivel com o oraculo no ar: computa-se
 * `Math.sign( compararNaturalSemCaixa( a, b ) )` deste lado e
 * `strnatcasecmp( $a, $b ) <=> 0` do outro, sobre a mesma lista. Os dez pares mais
 * ilustrativos dela estao transcritos no teste *as bordas do algoritmo*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { compararNaturalSemCaixa } from './comparacao-natural.js';

/** O `uksort( $a, 'strnatcasecmp' )` do legado sobre uma lista de chaves. */
function ordenar(chaves: readonly string[]): readonly string[] {
  return [...chaves].sort(compararNaturalSemCaixa);
}

test('as tres ordens medidas no oraculo', () => {
  // `uksort( array( 30 => 1, 100 => 1, 9 => 1, -5 => 1 ), 'strnatcasecmp' )`
  assert.deepEqual(ordenar(['30', '100', '9', '-5']), ['-5', '9', '30', '100']);
  assert.deepEqual(ordenar(['2', '10', '1']), ['1', '2', '10']);
  // 🔴 Instante negativo NAO ordena por numero: o `-` e comparado como byte.
  assert.deepEqual(ordenar(['-5', '-10', '-1']), ['-1', '-5', '-10']);
});

test('as tres comparacoes diretas medidas no oraculo', () => {
  assert.equal(compararNaturalSemCaixa('10', '9'), 1);
  assert.equal(compararNaturalSemCaixa('-5', '-10'), -1);
  // 🔴 Zero a esquerda EMPATA: o algoritmo os pula antes de comparar.
  assert.equal(compararNaturalSemCaixa('05', '5'), 0);
});

test('a ordem de instante Unix positivo coincide com a numerica, e e por isso que a diferenca nunca apareceu', () => {
  const instantes = ['1700000060', '1700000000', '1699999940', '1700000120'];

  assert.deepEqual(ordenar(instantes), [
    '1699999940',
    '1700000000',
    '1700000060',
    '1700000120',
  ]);
  assert.deepEqual(
    ordenar(instantes),
    [...instantes].sort((aqui, ali) => Number(aqui) - Number(ali)),
  );
});

test('a corrida de digitos mais longa ganha, e o desempate e o primeiro digito diferente', () => {
  // `compare_right()`: o comprimento decide, e o `bias` guarda a primeira
  // diferenca para o caso de os comprimentos empatarem.
  assert.equal(compararNaturalSemCaixa('1000', '999'), 1);
  assert.equal(compararNaturalSemCaixa('abc2', 'abc10'), -1);
  assert.equal(compararNaturalSemCaixa('a1b', 'a1c'), -1);
  assert.equal(compararNaturalSemCaixa('x9y', 'x9y'), 0);
});

test('a dobra de caixa e so de ASCII, como o `toupper()` da locale C', () => {
  assert.equal(compararNaturalSemCaixa('HOOK', 'hook'), 0);
  assert.equal(compararNaturalSemCaixa('wp_Scheduled', 'wp_scheduled'), 0);
  assert.equal(compararNaturalSemCaixa('a', 'B'), -1);
});

test('cadeia vazia compara por comprimento, e nao entra no laco', () => {
  assert.equal(compararNaturalSemCaixa('', ''), 0);
  assert.equal(compararNaturalSemCaixa('', 'a'), -1);
  assert.equal(compararNaturalSemCaixa('a', ''), 1);
});

test('as bordas do algoritmo, nos dez pares medidos no oraculo', () => {
  // Zero a esquerda **dentro** da cadeia nao e pulado (a marca `leading` ja caiu):
  // vale o ramo fracionario, e o primeiro digito diferente decide.
  const pares: readonly (readonly [string, string, number])[] = [
    ['a01b', 'a1b', -1],
    ['a0', 'a00', -1],
    ['a000b', 'a0b', 1],
    // Espaco a esquerda e pulado dentro da varredura; a direita, nao: ele compara
    // como byte contra o fim da outra cadeia.
    [' 10', '10', 0],
    ['1 0', '10', -1],
    ['10 ', '10', 1],
    // Versao com ponto nao e numero: cada corrida de digitos e comparada por si.
    ['v1.2', 'v1.10', -1],
    ['0.5', '0.50', -1],
    ['0', '00', 0],
    ['file9x', 'file10', -1],
  ];

  for (const [aqui, ali, esperado] of pares) {
    assert.equal(
      Math.sign(compararNaturalSemCaixa(aqui, ali)),
      esperado,
      `${aqui} contra ${ali}`,
    );
  }
});

test('a comparacao e em bytes: chave que nenhuma decodificacao recupera nao vira a mesma chave', () => {
  const umByte = new Uint8Array([0xff]);
  const outroByte = new Uint8Array([0xfe]);

  assert.equal(compararNaturalSemCaixa(umByte, outroByte), 1);
  assert.equal(compararNaturalSemCaixa(umByte, umByte), 0);
});
