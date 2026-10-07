/**
 * Suite de conformidade do *codec* do formato serializado.
 *
 * O slot `serializacao-de-valor-persistido` do plano escolhe implementacao
 * propria **"com suite de conformidade"**, e e este arquivo. O que ele afirma e
 * o criterio do cenario de paridade
 * `15-fronteira-do-banco-e-codec-serialize.feature`: *"a cadeia de bytes
 * gravada e identica nas duas"* e *"nenhuma das duas normaliza, reordena nem
 * reindexa a estrutura"*. Enquanto o oraculo executavel nao existe
 * (`015-plataforma-transversal`, T001), os vetores sao **transcritos do
 * formato**, e a conferencia contra o legado em execucao continua devendo.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjo,
  arranjoPorNome,
  booleano,
  decimal,
  desserializar,
  inteiro,
  lista,
  serializar,
  serializarComoTexto,
  texto,
  NULO,
  type ValorPhp,
} from './index.js';

/** Vetores de escrita: valor de entrada contra os bytes que o legado grava. */
const VETORES: readonly (readonly [string, ValorPhp, string])[] = [
  ['nulo', NULO, 'N;'],
  ['booleano verdadeiro', booleano(true), 'b:1;'],
  ['booleano falso', booleano(false), 'b:0;'],
  ['inteiro zero', inteiro(0), 'i:0;'],
  ['inteiro negativo', inteiro(-12), 'i:-12;'],
  ['texto vazio', texto(''), 's:0:"";'],
  ['texto simples', texto('abc'), 's:3:"abc";'],
  // O comprimento e contado em BYTES: 'ação' tem 4 caracteres e 6 bytes.
  ['texto com acento', texto('ação'), 's:6:"ação";'],
  ['arranjo vazio', arranjo([]), 'a:0:{}'],
  ['lista', lista([inteiro(1), inteiro(2)]), 'a:2:{i:0;i:1;i:1;i:2;}'],
  [
    'arranjo por nome',
    arranjoPorNome([['administrator', booleano(true)]]),
    'a:1:{s:13:"administrator";b:1;}',
  ],
  [
    'chave de texto decimal canonica vira chave inteira',
    arranjoPorNome([['5', texto('x')]]),
    'a:1:{i:5;s:1:"x";}',
  ],
  [
    'chave de texto quase decimal continua texto',
    arranjoPorNome([['05', texto('x')]]),
    'a:1:{s:2:"05";s:1:"x";}',
  ],
  [
    'arranjo aninhado',
    arranjoPorNome([['x', lista([NULO])]]),
    'a:1:{s:1:"x";a:1:{i:0;N;}}',
  ],
  ['decimal inteiro', decimal(1), 'd:1;'],
  ['decimal fracionario', decimal(1.5), 'd:1.5;'],
  ['decimal curto', decimal(0.1), 'd:0.1;'],
  ['decimal exponencial', decimal(1e25), 'd:1.0E+25;'],
  ['decimal sem numero', decimal(Number.NaN), 'd:NAN;'],
  ['decimal infinito', decimal(Number.POSITIVE_INFINITY), 'd:INF;'],
  ['decimal zero negativo', decimal(-0), 'd:-0;'],
];

for (const [nome, valor, esperado] of VETORES) {
  test(`escrita: ${nome}`, () => {
    assert.equal(serializarComoTexto(valor), esperado);
  });

  test(`ida e volta: ${nome}`, () => {
    const bytes = serializar(valor);
    const lido = desserializar(bytes);
    assert.equal(lido.ok, true);
    if (lido.ok) {
      // O criterio e os BYTES, nao a igualdade estrutural: ler e escrever de
      // volta tem de devolver a mesma cadeia, byte a byte.
      assert.deepEqual(serializar(lido.valor), bytes);
    }
  });
}

test('a ordem de insercao e preservada, e nada e reordenado', () => {
  const emOrdem = arranjoPorNome([
    ['zeta', booleano(true)],
    ['alfa', booleano(true)],
  ]);

  assert.equal(
    serializarComoTexto(emOrdem),
    'a:2:{s:4:"zeta";b:1;s:4:"alfa";b:1;}',
  );
});

test('texto que nao e UTF-8 valido volta como bytes, sem perder nenhum', () => {
  const bytes = new Uint8Array([0xff, 0xfe]);
  const gravado = serializar(texto(bytes));

  assert.deepEqual(
    gravado,
    new Uint8Array([
      ...new TextEncoder().encode('s:2:"'),
      0xff,
      0xfe,
      ...new TextEncoder().encode('";'),
    ]),
  );

  const lido = desserializar(gravado);
  assert.equal(lido.ok, true);
  if (lido.ok && lido.valor.tipo === 'texto') {
    assert.deepEqual(lido.valor.valor, bytes);
  }
});

test('a estrutura lida preserva o tipo da chave', () => {
  const lido = desserializar('a:2:{i:5;b:1;s:1:"5";b:0;}');

  assert.equal(lido.ok, true);
  if (lido.ok && lido.valor.tipo === 'arranjo') {
    assert.deepEqual(
      lido.valor.entradas.map((entrada) => entrada.chave.tipo),
      ['inteiro', 'texto'],
    );
  }
});

test('o metadado de autorizacao do legado le e escreve nos mesmos bytes', () => {
  // `{prefixo}capabilities` de uma conta com um papel so (BR-MIGRAR-088).
  const bytes = 'a:1:{s:13:"administrator";b:1;}';
  const lido = desserializar(bytes);

  assert.equal(lido.ok, true);
  if (lido.ok) {
    assert.equal(serializarComoTexto(lido.valor), bytes);
  }
});

test('sobra de bytes e falha, e a falha volta como valor', () => {
  const lido = desserializar('i:1;sobra');

  assert.equal(lido.ok, false);
  if (!lido.ok) {
    assert.match(lido.motivo, /sobraram/);
  }
});

test('comprimento de texto mentiroso e falha', () => {
  assert.equal(desserializar('s:9:"abc";').ok, false);
});

test('marca de tipo nao lida por este codec falha dizendo qual e', () => {
  const lido = desserializar('O:8:"stdClass":0:{}');

  assert.equal(lido.ok, false);
  if (!lido.ok) {
    assert.match(lido.motivo, /marca de tipo nao reconhecida: O/);
  }
});

test('cadeia truncada falha em vez de lancar', () => {
  assert.equal(desserializar('a:2:{i:0;b:1;').ok, false);
});
