/**
 * Suite de conformidade da regra de borda do formato: `is_serialized()`,
 * `maybe_serialize()` e `maybe_unserialize()`.
 *
 * E a mesma regra de aceite de `conformidade.test.ts` — **os bytes gravados sao
 * os mesmos** — aplicada a decisao que vem antes do formato: *se* o valor vai
 * serializado. Os vetores sao **transcritos** da leitura de
 * `wp-includes/functions.php:628` a `:731`, porque nao ha oraculo executavel
 * nesta arvore (`parity_specs.md`; levanta-lo e T001 da feature 015).
 *
 * Cada vetor abaixo existe porque o legado responde de um jeito que a intuicao
 * nao da: cadeia que parece serializada e serializada **de novo**, cadeia
 * malformada que a farejada aceita e a leitura devolve `false`, e byte nulo que
 * o `trim()` da origem remove e o `trim()` deste runtime nao removeria.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  pareceSerializado,
  serializarComoTexto,
  talvezDesserializar,
  talvezSerializar,
} from './index.js';
import { lista, texto } from './valor-php.js';

const CODIFICADOR = new TextEncoder();

test('is_serialized: o que a farejada aceita no modo estrito', () => {
  // 'N;' passa antes da exigencia de 4 bytes (`functions.php:680`).
  assert.equal(pareceSerializado('N;'), true);
  assert.equal(pareceSerializado('b:1;'), true);
  assert.equal(pareceSerializado('i:5;'), true);
  assert.equal(pareceSerializado('d:1.5;'), true);
  assert.equal(pareceSerializado('d:1.0E+25;'), true);
  assert.equal(pareceSerializado('s:1:"b";'), true);
  assert.equal(pareceSerializado('a:1:{i:0;s:1:"b";}'), true);
  // 'O' de objeto e 'E' de enumeracao sao aceitos pela farejada — e o codec
  // deste modulo nao os le. Ver o teste da divergencia declarada, no fim.
  assert.equal(pareceSerializado('O:8:"stdClass":0:{}'), true);
});

test('is_serialized: o que ela recusa, e por qual das guardas', () => {
  assert.equal(pareceSerializado('hello'), false); // o byte 1 nao e ':'
  assert.equal(pareceSerializado('x:1;'), false); // marca desconhecida
  assert.equal(pareceSerializado('i:5'), false); // nao termina em ';' nem '}'
  assert.equal(pareceSerializado('a:1:'), false); // idem
  assert.equal(pareceSerializado('s:1:b;'), false); // sem a aspa em -2
  assert.equal(pareceSerializado('i:;'), false); // sem digito nenhum
  assert.equal(pareceSerializado('N;x'), false); // 'N;' so passa exato
  assert.equal(pareceSerializado(''), false);
});

test('is_serialized nao estrito: o que o modo da ESCRITA aceita a mais', () => {
  // `maybe_serialize()` pergunta sem rigor (`functions.php:638`), e a diferenca
  // e o fim da cadeia: sem rigor, sobra depois do valor nao desqualifica.
  assert.equal(pareceSerializado('i:5;sobra', false), true);
  assert.equal(pareceSerializado('i:5;sobra', true), false);
  assert.equal(pareceSerializado('s:1:"b";x', false), true);
  assert.equal(pareceSerializado('s:1:"b";x', true), false);
  assert.equal(pareceSerializado('a:1:{i:0;s:1:"b";}x', false), true);
  assert.equal(pareceSerializado('a:1:{i:0;s:1:"b";}x', true), false);

  // Mas nem sem rigor ela aceita ';' ou '}' perto do comeco da cadeia, e e por
  // isso que um arranjo truncado em '{' recusa nos DOIS modos: '{' nao e '}',
  // logo nenhum dos dois bytes exigidos existe (`functions.php:697` a `:706`).
  assert.equal(pareceSerializado('a:;:x', false), false);
  assert.equal(pareceSerializado('a:1:{', false), false);
  assert.equal(pareceSerializado('a:1:{', true), false);
});

test('o `trim` e o do PHP: sete bytes, inclusive o nulo e a tabulacao vertical', () => {
  assert.equal(pareceSerializado('  i:5;  '), true);
  assert.equal(pareceSerializado('\ti:5;\n'), true);

  // O caso que o `String.prototype.trim` deste runtime erraria: ele nao remove
  // `\0` nem `\x0B`, logo o ultimo byte nao seria ';' e a resposta viraria
  // `false`. Vem de coluna binaria, e e por isso que a conferencia e em bytes.
  assert.equal(pareceSerializado('i:5;\u0000'), true);
  assert.equal(pareceSerializado('i:5;\u000b'), true);
  // E a prova de que o nativo erraria: para ele, a cadeia nao termina em ';'.
  assert.equal('i:5;\u0000'.trim().endsWith(';'), false);
});

test('maybe_serialize: arranjo vai serializado, escalar vai inteiro', () => {
  const arranjo = lista([texto('b')]);

  assert.equal(
    serializarComoTexto(talvezSerializar(arranjo)),
    serializarComoTexto(texto('a:1:{i:0;s:1:"b";}')),
  );
  assert.deepEqual(talvezSerializar(texto('hello')), texto('hello'));
  assert.deepEqual(talvezSerializar({ tipo: 'inteiro', valor: 5 }), {
    tipo: 'inteiro',
    valor: 5,
  });
  assert.deepEqual(talvezSerializar({ tipo: 'nulo' }), { tipo: 'nulo' });
});

test('a DUPLA serializacao de BR-MIGRAR-082, nos dois sentidos', () => {
  // "gravar a string 'a:1:{i:0;s:1:"b";}' e le-la de volta devolve a string,
  // nao o array" — BR-MIGRAR-082 (`DB-SER`), palavra por palavra.
  const comoCadeia = 'a:1:{i:0;s:1:"b";}';

  const gravado = talvezSerializar(texto(comoCadeia));
  assert.equal(gravado.tipo, 'texto');
  const bytes = gravado.tipo === 'texto' ? gravado.valor : '';
  assert.equal(
    typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes),
    's:18:"a:1:{i:0;s:1:"b";}";',
  );

  const lido = talvezDesserializar('s:18:"a:1:{i:0;s:1:"b";}";');
  assert.deepEqual(lido, texto(comoCadeia));

  // E o contraponto: o mesmo arranjo, gravado como arranjo, volta arranjo.
  assert.deepEqual(
    talvezDesserializar('a:1:{i:0;s:1:"b";}'),
    lista([texto('b')]),
  );
});

test('maybe_unserialize: texto que nao parece serializado volta como esta', () => {
  assert.deepEqual(talvezDesserializar('hello'), texto('hello'));
  assert.deepEqual(talvezDesserializar(''), texto(''));

  const bytes = CODIFICADOR.encode('nao serializado');
  assert.deepEqual(talvezDesserializar(bytes), texto(bytes));
});

test('maybe_unserialize: cadeia que PARECE serializada e nao le devolve `false`', () => {
  // `@unserialize()` devolve `false` quando falha, e `maybe_unserialize()`
  // devolve esse `false` — o valor original esta perdido para quem chamou
  // (`functions.php:655`). A farejada nao confere o tamanho declarado da
  // cadeia; a leitura confere.
  assert.equal(pareceSerializado('s:3:"ab";'), true);
  assert.deepEqual(talvezDesserializar('s:3:"ab";'), {
    tipo: 'booleano',
    valor: false,
  });

  // E o `false` gravado de verdade e indistinguivel desse, como no legado.
  assert.deepEqual(talvezDesserializar('b:0;'), {
    tipo: 'booleano',
    valor: false,
  });
});

test('DIVERGENCIA DECLARADA: objeto serializado nao e lido por este codec', () => {
  // `is_serialized()` aceita `O:` (objeto) e `C:` (serializacao propria da
  // classe), e o `unserialize()` do PHP os devolve como objeto — aqui o codec
  // de `valor-php.ts` nao modela objeto, e a leitura falha, logo o resultado e
  // o `false` do item acima.
  //
  // A divergencia e **declarada e nao resolvida aqui**: modelar objeto exigiria
  // decidir o que fazer com classe desconhecida (no PHP, um
  // `__PHP_Incomplete_Class`), e nenhum documento do pacote decide isso. O
  // nucleo do legado nao grava objeto em metadado — quem grava e extensao —, e
  // a conferencia final deste modulo e contra o oraculo executavel da
  // Pergunta 16, que nao existe nesta arvore (`parity_specs.md`).
  assert.deepEqual(talvezDesserializar('O:8:"stdClass":0:{}'), {
    tipo: 'booleano',
    valor: false,
  });
});
