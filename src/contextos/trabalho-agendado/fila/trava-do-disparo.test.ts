/**
 * A trava como valor: a chave de 22 casas, a leitura dela e as duas decisoes.
 * Entrega de **T002**.
 *
 * **Os vetores desta suite foram medidos no oraculo**, nao supostos: o oraculo
 * executavel da resposta 16 (`scripts/oraculo`, PHP 8.3) respondeu
 * `sprintf( '%.22F', $v )` e `(float) $v` para cada valor abaixo. E a conferencia
 * que `porta-de-relogio.ts` deixou pedida em T001 — *"quem escrever o adaptador
 * confere a formatacao contra o oraculo antes de afirmar paridade"* —, feita para
 * a metade que e **formatacao**. A outra metade (quantas casas o relogio informa)
 * continua sendo do adaptador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CASAS_DECIMAIS_DA_CHAVE_DA_TRAVA,
  TRAVA_AUSENTE_NO_CACHE,
  TRAVA_AUSENTE_SEM_CACHE,
  chaveDaTrava,
  mesmaChaveDeTrava,
  travaComoDecimalDoPhp,
  travaEhVerdadeiraNoPhp,
  travaImpedeEmitirDisparo,
  travaImpedeTomarNoEndpoint,
  type TravaLida,
} from './trava-do-disparo.js';

const AGORA = 1_700_000_000.5;

function travaDe(chave: string): TravaLida {
  return { presente: true, chave };
}

test('a chave da trava e o `sprintf( %.22F )` do legado, byte a byte', () => {
  // Medido no oraculo, em PHP 8.3. `sprintf( '%.22F', microtime( true ) )` esta
  // em `wp-cron.php:101` e `wp-includes/cron.php:942` e `:958`.
  assert.equal(CASAS_DECIMAIS_DA_CHAVE_DA_TRAVA, 22);
  assert.equal(
    chaveDaTrava(1_700_000_000.123456),
    '1700000000.1234560012817382812500',
  );
  assert.equal(chaveDaTrava(1_700_000_000), '1700000000.0000000000000000000000');
  assert.equal(chaveDaTrava(1_700_000_000.5), '1700000000.5000000000000000000000');
  assert.equal(chaveDaTrava(0.1), '0.1000000000000000055511');
  assert.equal(chaveDaTrava(1.0e-7), '0.0000001000000000000000');
});

test('a identidade da trava e textual: comparar numeros confundiria dois processos', () => {
  // `$doing_cron_transient !== $doing_wp_cron` (`wp-cron.php:113`), e o `===` de
  // `:201`. Duas chaves que diferem na 17a casa sao dois processos diferentes, e
  // os dois numeros correspondentes sao o MESMO `double`.
  const minha = chaveDaTrava(1_700_000_000.123456);
  const doOutro = '1700000000.1234560012817382812501';

  assert.notEqual(minha, doOutro);
  assert.equal(Number.parseFloat(minha), Number.parseFloat(doOutro));
  assert.equal(mesmaChaveDeTrava(travaDe(minha), minha), true);
  assert.equal(mesmaChaveDeTrava(travaDe(doOutro), minha), false);
  assert.equal(mesmaChaveDeTrava(TRAVA_AUSENTE_SEM_CACHE, minha), false);
  assert.equal(mesmaChaveDeTrava(TRAVA_AUSENTE_NO_CACHE, minha), false);
});

test('a ausencia tem as duas formas que o legado tem: zero e falso', () => {
  // `_get_cron_lock()` nasce com `$value = 0` (`wp-cron.php:67`) e devolve o que
  // `wp_cache_get()` devolveu no ramo de cache externo (`:73`), que e `false` na
  // falta. Nenhuma das duas e identica a chave alguma.
  assert.deepEqual(TRAVA_AUSENTE_SEM_CACHE, { presente: false, valorDoLegado: 0 });
  assert.deepEqual(TRAVA_AUSENTE_NO_CACHE, {
    presente: false,
    valorDoLegado: false,
  });
  assert.equal(travaComoDecimalDoPhp(TRAVA_AUSENTE_SEM_CACHE), 0);
  assert.equal(travaComoDecimalDoPhp(TRAVA_AUSENTE_NO_CACHE), 0);
});

test('a conversao para numero e o `(float)` do PHP, com os valores medidos no oraculo', () => {
  // `(float) get_transient( 'doing_cron' )` (`wp-includes/cron.php:915`).
  assert.equal(
    travaComoDecimalDoPhp(travaDe('1700000000.1234567165374755859375')),
    1_700_000_000.1234567,
  );
  assert.equal(travaComoDecimalDoPhp(travaDe('')), 0);
  assert.equal(travaComoDecimalDoPhp(travaDe('abc')), 0);
  assert.equal(travaComoDecimalDoPhp(travaDe('12abc')), 12);
  assert.equal(travaComoDecimalDoPhp(travaDe('1e3')), 1000);
  assert.equal(travaComoDecimalDoPhp(travaDe(' 7')), 7);
});

test('a verdade do PHP sobre a trava: so o vazio e o `0` sao falsos', () => {
  // A guarda de `wp-cron.php:98` e `$doing_cron_transient && ...`.
  assert.equal(travaEhVerdadeiraNoPhp(travaDe('')), false);
  assert.equal(travaEhVerdadeiraNoPhp(travaDe('0')), false);
  assert.equal(travaEhVerdadeiraNoPhp(travaDe('0.0')), true);
  assert.equal(travaEhVerdadeiraNoPhp(travaDe('00')), true);
  assert.equal(travaEhVerdadeiraNoPhp(TRAVA_AUSENTE_SEM_CACHE), false);
});

test('a decisao de emitir disparo: a trava de menos de 60 segundos impede, a mais velha nao', () => {
  assert.equal(
    travaImpedeEmitirDisparo(travaDe(chaveDaTrava(AGORA - 59)), AGORA),
    true,
  );
  assert.equal(
    travaImpedeEmitirDisparo(travaDe(chaveDaTrava(AGORA - 60)), AGORA),
    false,
  );
  assert.equal(travaImpedeEmitirDisparo(TRAVA_AUSENTE_SEM_CACHE, AGORA), false);
});

test('🔴 as duas decisoes NAO sao a mesma: a trava adiantada separa uma da outra', () => {
  // `wp-includes/cron.php:917` descarta a trava adiantada em mais de dez minutos;
  // `wp-cron.php:98` NAO tem essa linha. Logo a mesma trava libera o emissor e
  // continua travando o endpoint — e unificar as duas apagaria o caso.
  const adiantada = travaDe(chaveDaTrava(AGORA + 1800));

  assert.equal(travaImpedeEmitirDisparo(adiantada, AGORA), false);
  assert.equal(travaImpedeTomarNoEndpoint(adiantada, AGORA), true);
});

test('no endpoint, a trava falsa no PHP passa sem olhar o relogio', () => {
  // `'0'` e `''` sao falsos, logo a guarda nem chega na aritmetica. Note que a
  // mesma trava, no emissor, vale zero e tambem passa: neste par as duas
  // coincidem, e e a soma seguinte que torna o resto equivalente.
  assert.equal(travaImpedeTomarNoEndpoint(travaDe('0'), AGORA), false);
  assert.equal(travaImpedeTomarNoEndpoint(travaDe(''), AGORA), false);
  assert.equal(travaImpedeEmitirDisparo(travaDe('0'), AGORA), false);

  // E a trava recem-tomada trava o endpoint, que e o freio de UC-39: "o unico
  // freio e uma trava de tempo de 60 segundos".
  assert.equal(
    travaImpedeTomarNoEndpoint(travaDe(chaveDaTrava(AGORA - 1)), AGORA),
    true,
  );
});
