/**
 * O teste de borda que o **P6** cobra do prazo de retencao: *"cada numero vive num
 * ponto de configuracao nomeado, com o valor de fabrica do legado, e existe teste
 * que afirma o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"*.
 *
 * E o que `backlog/tests.md` registra em UT-050-5 — *"retem por 30 dias com a
 * lixeira ligada e torna o apagamento irreversivel com ela em zero"* — na metade
 * que T001 entrega: **o numero e a borda dele**. A outra metade, o apagamento
 * definitivo e o aviso de que a acao nao tem volta, e de T003 (US-1) e T009
 * (US-4), e a suite dela e T010.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  instanteLimiteDeRetencao,
  lixeiraEstaLigada,
} from './prazo-de-retencao.js';

test('o valor de fabrica e 30 dias, como o legado o define', () => {
  // `wp-includes/default-constants.php:388`:
  //   if ( ! defined( 'EMPTY_TRASH_DAYS' ) ) { define( 'EMPTY_TRASH_DAYS', 30 ); }
  assert.equal(PRAZO_DE_RETENCAO_DE_FABRICA.diasNaLixeira, 30);
  assert.equal(SEGUNDOS_POR_DIA, 86400);
});

test('a borda do numero: zero desliga a lixeira, e qualquer outro valor a liga', () => {
  assert.equal(lixeiraEstaLigada(), true);
  assert.equal(lixeiraEstaLigada(PRAZO_DE_RETENCAO_DE_FABRICA), true);
  assert.equal(lixeiraEstaLigada({ diasNaLixeira: 1 }), true);

  // Zero e o valor que troca "esconder" por "destruir" (`R1`, BR-MIGRAR-030):
  // `! EMPTY_TRASH_DAYS` na primeira linha de `wp_trash_post()`
  // (`wp-includes/post.php:4084`).
  assert.equal(lixeiraEstaLigada({ diasNaLixeira: 0 }), false);

  // E valor negativo NAO desliga: em PHP `-1` e verdadeiro. A lixeira continua
  // ligada e a consequencia aparece na coleta, onde o instante limite cai no
  // futuro. Nenhuma guarda foi acrescentada, porque o legado nao tem nenhuma (P1).
  assert.equal(lixeiraEstaLigada({ diasNaLixeira: -1 }), true);
});

test('o instante limite e a aritmetica do legado, na mesma unidade', () => {
  // `wp-includes/functions.php:6977`:
  //   $delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS );
  const agora = 1_700_000_000;

  assert.equal(instanteLimiteDeRetencao(agora), agora - 30 * 86400);
  assert.equal(
    instanteLimiteDeRetencao(agora, { diasNaLixeira: 1 }),
    agora - 86400,
  );
  // Com a lixeira desligada o limite e o proprio instante — e nao e por aqui que
  // o apagamento irreversivel acontece: ele acontece no descarte, antes de a
  // coleta existir (T003, T009). Nada chega a lixeira para coletar, que e o que
  // UC-11 diz na excecao "EMPTY_TRASH_DAYS e zero".
  assert.equal(instanteLimiteDeRetencao(agora, { diasNaLixeira: 0 }), agora);
});

test('a borda do prazo: o descarte no limite ainda nao venceu, o de um segundo antes venceu', () => {
  // A comparacao e de T011 — no legado `meta_value < %d`, ESTRITAMENTE menor
  // (`wp-includes/functions.php:6979` e `:6997`). O que se afirma aqui e o que
  // T001 entrega: o instante limite cai no lugar exato onde essa comparacao
  // separa o que vence do que nao vence, que e o que UT-052-2 cobra ("poupa o que
  // esta no limite") e o que PT-004 cobra ("um dia antes do prazo: nenhuma das
  // duas o apaga").
  const agora = 1_700_000_000;
  const limite = instanteLimiteDeRetencao(agora);

  const descartadoNoLimite = limite;
  const descartadoUmSegundoAntes = limite - 1;
  const descartadoUmSegundoDepois = limite + 1;

  assert.equal(descartadoNoLimite < limite, false);
  assert.equal(descartadoUmSegundoAntes < limite, true);
  assert.equal(descartadoUmSegundoDepois < limite, false);

  // Em dias inteiros, que e a unidade em que o prazo se configura: o descartado
  // ha exatamente 30 dias nao vence; o de 30 dias e um segundo, vence.
  const trintaDias = 30 * SEGUNDOS_POR_DIA;
  assert.equal(agora - trintaDias < limite, false);
  assert.equal(agora - trintaDias - 1 < limite, true);
});
