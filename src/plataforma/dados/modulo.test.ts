/**
 * Testes da entrega de **T002** para `plataforma/dados/`: *"carrega como modulo
 * proprio, com as portas declaradas e nenhuma regra implementada"*.
 *
 * Nao sao os testes de nenhuma historia — os de US-3 sao **T008**, um por caso
 * de `backlog/tests.md` (UT-164-1 a UT-164-7). Aqui se afirma so o que T002
 * entrega, mais as tres invariantes que um esqueleto de camada de dados quebra
 * em silencio:
 *
 * 1. **estado de modulo** (`EXT-CONTEXTO`, BR-MIGRAR-105) — a conexao e escopo
 *    de requisicao, e `parity_specs.md` poe *"estado entre requisicoes
 *    concorrentes"* na linha 5 da metrica primaria, com tolerancia **zero, sem
 *    excecao**;
 * 2. **trabalho no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106) — no legado a
 *    camada nasce num ponto nomeado da sequencia (`wp-includes/load.php:706`);
 * 3. **transacao** (`EXT-EXCLUSAO`, BR-MIGRAR-104) — zero `START TRANSACTION` e
 *    zero `COMMIT` em 1.467 arquivos, e o P5 poe a cascata no observavel.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarDriverQueRegistra,
  criarModuloDeDados,
  NADA_ENCONTRADO,
  type Consulta,
} from './index.js';

const CONSULTA_DE_TESTE: Consulta = {
  texto: 'SELECT ID FROM wp_posts WHERE post_name = %s',
  parametros: ['hello-world'],
};

test('o modulo carrega com a porta recebida por argumento', () => {
  const driver = criarDriverQueRegistra();
  const modulo = criarModuloDeDados({ driver: driver.porta });

  assert.equal(modulo.nome, 'dados');
  assert.equal(modulo.portas.driver, driver.porta);
});

test('compor o modulo nao emite consulta nenhuma', () => {
  const driver = criarDriverQueRegistra();
  criarModuloDeDados({ driver: driver.porta });

  assert.deepEqual(driver.consultas, []);
});

test('duas composicoes nao se enxergam: nao ha estado de modulo', () => {
  const daRede = criarDriverQueRegistra({ prefixoDeTabela: 'wp_' });
  const doSite = criarDriverQueRegistra({
    prefixoDeTabela: 'wp_7_',
    prefixoBaseDeTabela: 'wp_',
  });

  const primeiro = criarModuloDeDados({ driver: daRede.porta });
  const segundo = criarModuloDeDados({ driver: doSite.porta });

  assert.notEqual(primeiro, segundo);
  assert.equal(primeiro.prefixoDeTabela, 'wp_');
  assert.equal(segundo.prefixoDeTabela, 'wp_7_');

  // A consulta de uma composicao nao aparece na outra.
  segundo.portas.driver.executar(CONSULTA_DE_TESTE);
  assert.equal(doSite.consultas.length, 1);
  assert.deepEqual(daRede.consultas, []);
});

test('os dois prefixos do legado chegam ao modulo, e coincidem fora de rede', () => {
  const foraDeRede = criarDriverQueRegistra({ prefixoDeTabela: 'wp_' });
  const modulo = criarModuloDeDados({ driver: foraDeRede.porta });

  assert.equal(modulo.prefixoDeTabela, 'wp_');
  assert.equal(modulo.prefixoBaseDeTabela, 'wp_');

  const emRede = criarDriverQueRegistra({
    prefixoDeTabela: 'wp_7_',
    prefixoBaseDeTabela: 'wp_',
  });
  const naRede = criarModuloDeDados({ driver: emRede.porta });

  assert.equal(naRede.prefixoDeTabela, 'wp_7_');
  assert.equal(naRede.prefixoBaseDeTabela, 'wp_');
});

test('o duplo registra a consulta com texto e valores separados', () => {
  const driver = criarDriverQueRegistra();

  const resultado = driver.porta.executar(CONSULTA_DE_TESTE);

  assert.equal(driver.consultas.length, 1);
  assert.equal(driver.consultas[0]?.texto, CONSULTA_DE_TESTE.texto);
  assert.deepEqual(driver.consultas[0]?.parametros, ['hello-world']);
  assert.deepEqual(resultado, NADA_ENCONTRADO);
});

test('o duplo devolve o programado, na ordem, e volta ao padrao depois', () => {
  const driver = criarDriverQueRegistra();
  driver.responder({
    linhas: [{ ID: 1 }],
    linhasAfetadas: 1,
    idGerado: null,
  });

  const primeiro = driver.porta.executar(CONSULTA_DE_TESTE);
  const segundo = driver.porta.executar(CONSULTA_DE_TESTE);

  assert.deepEqual(primeiro.linhas, [{ ID: 1 }]);
  assert.equal(primeiro.linhasAfetadas, 1);
  assert.deepEqual(segundo, NADA_ENCONTRADO);
});

test('a porta nao declara transacao: EXT-EXCLUSAO mede zero no legado', () => {
  const driver = criarDriverQueRegistra();
  const porta = driver.porta as unknown as Record<string, unknown>;

  for (const nome of ['iniciar', 'confirmar', 'desfazer', 'transacao']) {
    assert.equal(
      porta[nome],
      undefined,
      `a porta de driver nao declara \`${nome}\`: o legado nao tem transacao`,
    );
  }
});
