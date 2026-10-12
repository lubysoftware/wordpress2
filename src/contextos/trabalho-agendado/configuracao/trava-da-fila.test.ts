/**
 * Os dois numeros da trava, e a borda de cada um — a metade da entrega de
 * **T002** que diz *"a trava de 60 segundos com descarte depois de 10 minutos
 * existe e e verificavel com relogio controlado"*.
 *
 * E o teste que o **P6** cobra, com as palavras dele: *"existe teste que afirma o
 * valor e o efeito da borda (no ultimo instante aceita, um instante depois
 * recusa)"*. O relogio nao e lido em lugar nenhum deste arquivo: o instante chega
 * por argumento, que e o que torna a borda conferivel.
 *
 * Nao sao os testes de nenhuma historia — os de US-2 sao **T006**, um por caso de
 * `backlog/tests.md`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SEGUNDOS_POR_MINUTO,
  TRAVA_DA_FILA_DE_FABRICA,
  travaBloqueiaNovoDisparo,
  travaDepoisDoDescarteDeAdiantada,
} from './trava-da-fila.js';

/** Um instante Unix realista. Ver a ressalva de `travaBloqueiaNovoDisparo`. */
const AGORA = 1_700_000_000.5;

test('os valores de fabrica sao os do legado: 60 segundos e 600 de adiantamento', () => {
  // `WP_CRON_LOCK_TIMEOUT` e `MINUTE_IN_SECONDS`
  // (`wp-includes/default-constants.php:399` e `:158`), e os dez minutos sao a
  // expressao `10 * MINUTE_IN_SECONDS` de `wp-includes/cron.php:917`.
  assert.equal(SEGUNDOS_POR_MINUTO, 60);
  assert.deepEqual(TRAVA_DA_FILA_DE_FABRICA, {
    tempoLimiteEmSegundos: 60,
    descarteDoAdiantamentoEmSegundos: 600,
  });
});

test('a borda dos 60 segundos: no instante exato aceita, um instante antes recusa', () => {
  // `if ( $lock + WP_CRON_LOCK_TIMEOUT > $gmt_time ) { return false; }`
  // (`wp-includes/cron.php:922`). A comparacao e `>`, logo `trava + 60` ja passa.
  const trava = AGORA - 60;

  assert.equal(travaBloqueiaNovoDisparo(trava, AGORA), false);
  assert.equal(travaBloqueiaNovoDisparo(trava, AGORA - 0.000001), true);
  assert.equal(travaBloqueiaNovoDisparo(AGORA - 59.999999, AGORA), true);
  // Trava de uma hora atras nao bloqueia nada: e esta linha que deixa passar a
  // trava velha, e nao o descarte dos dez minutos.
  assert.equal(travaBloqueiaNovoDisparo(AGORA - 3600, AGORA), false);
});

test('trava ausente nao bloqueia — e com relogio perto de zero, bloqueia', () => {
  // Trava ausente entra como `0`, que e o que `(float) false` devolve.
  assert.equal(travaBloqueiaNovoDisparo(0, AGORA), false);

  // ⚠️ `0 + 60 > 10` e verdadeiro. O legado nao tem guarda nenhuma contra isto, e
  // em instante Unix de verdade a situacao nao acontece; em teste, acontece com
  // facilidade. Esta assercao existe para que ninguem "conserte" a aritmetica ao
  // ver um teste com relogio pequeno falhando.
  assert.equal(travaBloqueiaNovoDisparo(0, 10), true);
});

test('🔴 o descarte dos 10 minutos e da trava ADIANTADA, nao da velha', () => {
  // `if ( $lock > $gmt_time + 10 * MINUTE_IN_SECONDS ) { $lock = 0; }`
  // (`wp-includes/cron.php:917`). A prosa do pacote diz "descartado se passar de
  // 10 minutos" — `spec.md`, BR-MIGRAR-053 e UC-39 usam as mesmas palavras —, e a
  // leitura natural dela ("trava com mais de 10 minutos de idade") NAO e o que o
  // codigo faz. O P1 decide: a ancora e o codigo.

  // Trava velha: o descarte nao a toca.
  assert.equal(travaDepoisDoDescarteDeAdiantada(AGORA - 601, AGORA), AGORA - 601);
  assert.equal(
    travaDepoisDoDescarteDeAdiantada(AGORA - 86_400, AGORA),
    AGORA - 86_400,
  );

  // Trava adiantada: a borda e `>`, logo dez minutos exatos NAO sao descartados.
  assert.equal(travaDepoisDoDescarteDeAdiantada(AGORA + 600, AGORA), AGORA + 600);
  assert.equal(travaDepoisDoDescarteDeAdiantada(AGORA + 600.000001, AGORA), 0);
  assert.equal(travaDepoisDoDescarteDeAdiantada(AGORA + 1800, AGORA), 0);
});

test('a trava adiantada em mais de 10 minutos destrava o disparo, pelas duas linhas juntas', () => {
  // E a consequencia observavel do par `:917` + `:922`: a trava do futuro vale
  // zero, e zero mais 60 nao alcanca um instante Unix de verdade.
  const adiantada = AGORA + 1800;

  assert.equal(travaBloqueiaNovoDisparo(adiantada, AGORA), true);
  assert.equal(
    travaBloqueiaNovoDisparo(
      travaDepoisDoDescarteDeAdiantada(adiantada, AGORA),
      AGORA,
    ),
    false,
  );
});

test('os dois numeros chegam por argumento: a instalacao os altera, como o `define()` do legado', () => {
  const trava = {
    tempoLimiteEmSegundos: 120,
    descarteDoAdiantamentoEmSegundos: 60,
  };

  // Com 120 segundos de trava, o que passava em `trava + 60` ainda bloqueia.
  assert.equal(travaBloqueiaNovoDisparo(AGORA - 60, AGORA, trava), true);
  assert.equal(travaBloqueiaNovoDisparo(AGORA - 120, AGORA, trava), false);

  // Com 60 segundos de adiantamento, descarta-se o que antes ficava.
  assert.equal(travaDepoisDoDescarteDeAdiantada(AGORA + 61, AGORA, trava), 0);
  assert.equal(
    travaDepoisDoDescarteDeAdiantada(AGORA + 60, AGORA, trava),
    AGORA + 60,
  );
});
