/**
 * O armazenamento desta feature: **qual comando sai**, com quais parametros e com
 * quais bytes — e em quais casos **nao sai comando nenhum**. Entrega de **T002**.
 *
 * E o criterio da area 3 da Decisao 2 de `parity_specs.md`: *"efeito no banco ...
 * zero divergencia ... snapshot + sequencia de comandos"*. As portas falsas
 * registram comando em vez de simular banco e cache, que e a unica forma de
 * afirmar o caso em que o legado nao emite comando — e nesta feature esse caso e
 * regra escrita em tres lugares (ver `porta-falsa.ts`).
 *
 * Os bytes gravados sao os **medidos no oraculo** (`scripts/oraculo`, PHP 8.3);
 * os vetores e a estrutura deles estao em `../fila/estrutura-gravada.test.ts`.
 *
 * Nao sao os testes de nenhuma historia: os de US-1 sao **T004** e nao comecam
 * antes de a decisao humana do conflito existir.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ESTRUTURA_VAZIA,
  agendarNaEstrutura,
  chaveDaTrava,
} from '../fila/index.js';
import {
  CARREGAMENTO_AUTOMATICO_LIGADO,
  GRUPO_DE_TRANSIENTE,
  NOME_DA_TRAVA,
  OPCAO_DA_FILA,
  OPCAO_DA_TRAVA,
  OPCAO_DE_PRAZO_DA_TRAVA,
  criarArmazenamentoDeTrabalhoAgendado,
  criarPortaDeCacheFalsa,
  criarPortaDeDadosFalsa,
  textoDoParametro,
} from './index.js';

const FILA_VAZIA_GRAVADA = 'a:1:{s:7:"version";i:2;}';

const UMA_TAREFA =
  'a:2:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
  's:7:"version";i:2;}';

const VERSAO_1 =
  'a:1:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}';

function armazenamentoDeTeste(opcoes: { cacheExterno?: boolean } = {}) {
  const dados = criarPortaDeDadosFalsa();
  const cache = criarPortaDeCacheFalsa({ externo: opcoes.cacheExterno ?? false });
  return {
    dados,
    cache,
    armazenamento: criarArmazenamentoDeTrabalhoAgendado(dados.porta, cache.porta),
  };
}

test('compor o armazenamento nao emite comando nenhum (EXT-ORDEM)', () => {
  const { dados, cache } = armazenamentoDeTeste();

  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(cache.leituras, []);
});

test('ler a fila consulta a linha `cron` da tabela deste site, e nada mais', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();

  const leitura = armazenamento.fila.obter();

  assert.equal(dados.selecoes.length, 1);
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
  );
  assert.deepEqual(dados.selecoes[0]?.parametros, [OPCAO_DA_FILA]);
  assert.deepEqual(dados.escritas, []);

  // Opcao ausente: `_get_cron_array()` devolve `array()`
  // (`wp-includes/cron.php:1262`-`1265`).
  assert.deepEqual(leitura.fila, []);
  assert.deepEqual(leitura.estrutura, ESTRUTURA_VAZIA);
  assert.equal(leitura.versaoGravada, null);
  assert.equal(leitura.convertida, false);
});

test('valor gravado que nao e arranjo vira fila vazia, sem erro e sem apagar a linha', () => {
  // `! is_array( $cron )` (`:1263`). Tres formas, nenhuma delas emite escrita.
  for (const gravado of ['nao serializado', 'i:5;', 'a:1:{']) {
    const { dados, armazenamento } = armazenamentoDeTeste();
    dados.responder([{ option_value: gravado }]);

    const leitura = armazenamento.fila.obter();

    assert.deepEqual(leitura.fila, []);
    assert.deepEqual(dados.escritas, []);
  }
});

test('a fila gravada e lida inteira, com a versao e a projecao', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  dados.responder([{ option_value: UMA_TAREFA }]);

  const leitura = armazenamento.fila.obter();

  assert.deepEqual(leitura.versaoGravada, { tipo: 'inteiro', valor: 2 });
  assert.equal(leitura.convertida, false);
  assert.equal(leitura.fila.length, 1);
  assert.equal(leitura.fila[0]?.ganchos[0]?.gancho, 'wp_scheduled_delete');
  assert.deepEqual(dados.escritas, []);
});

test('ler uma fila de versao 1 CONVERTE e grava, no meio da leitura', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  // A leitura da opcao, e depois a releitura que a gravacao faz para comparar.
  dados.responder([{ option_value: VERSAO_1 }]);
  dados.responder([{ option_value: VERSAO_1 }]);

  const leitura = armazenamento.fila.obter();

  assert.equal(leitura.convertida, true);
  assert.equal(leitura.versaoGravada, null);

  // `_upgrade_cron_array()` chama `update_option( 'cron', $new_cron, true )`
  // (`wp-includes/cron.php:1348`): e a unica leitura desta feature que escreve.
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ? WHERE option_name = ?',
  );
  assert.equal(
    textoDoParametro(dados.escritas[0]?.parametros[0]),
    'a:2:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
      's:7:"version";i:2;}',
  );
});

test('gravar a fila na opcao ausente insere com carregamento automatico ligado', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();

  assert.equal(armazenamento.fila.gravar(ESTRUTURA_VAZIA), true);

  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'INSERT INTO wp_options (option_name, option_value, autoload) VALUES (?, ?, ?)' +
      ' ON DUPLICATE KEY UPDATE option_name = VALUES(option_name),' +
      ' option_value = VALUES(option_value), autoload = VALUES(autoload)',
  );
  assert.deepEqual(
    dados.escritas[0]?.parametros.map(textoDoParametro),
    [OPCAO_DA_FILA, FILA_VAZIA_GRAVADA, CARREGAMENTO_AUTOMATICO_LIGADO],
  );
});

test('gravar a MESMA fila nao emite comando nenhum', () => {
  // `update_option()` recusa escrever valor igual (`wp-includes/option.php:923`),
  // e isso e efeito no banco: a requisicao que regrava a mesma fila nao emite
  // comando. E o caso de desagendar o que nao esta na fila.
  const { dados, armazenamento } = armazenamentoDeTeste();
  dados.responder([{ option_value: FILA_VAZIA_GRAVADA }]);

  assert.equal(armazenamento.fila.gravar(ESTRUTURA_VAZIA), false);
  assert.deepEqual(dados.escritas, []);
});

test('agendar e gravar poe os bytes do oraculo na linha `cron`', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  dados.responder([{ option_value: FILA_VAZIA_GRAVADA }]);
  dados.responder([{ option_value: FILA_VAZIA_GRAVADA }]);

  const leitura = armazenamento.fila.obter();
  const comTarefa = agendarNaEstrutura(
    leitura.estrutura,
    1_700_000_000,
    'wp_scheduled_delete',
    { recorrencia: 'daily', argumentos: [], intervaloEmSegundos: 86_400 },
  );

  assert.equal(armazenamento.fila.gravar(comTarefa), true);
  assert.equal(
    textoDoParametro(dados.escritas[0]?.parametros[0]),
    UMA_TAREFA,
  );
  assert.deepEqual(dados.escritas[0]?.parametros[1], OPCAO_DA_FILA);
});

test('a trava sem cache externo e lida pela consulta escrita a mao do legado', () => {
  const { dados, armazenamento, cache } = armazenamentoDeTeste();

  const ausente = armazenamento.trava.obterSemCache();

  // `wp-cron.php:75`, literal: o nome da linha, a coluna e o `LIMIT 1`.
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
  );
  assert.deepEqual(dados.selecoes[0]?.parametros, [OPCAO_DA_TRAVA]);
  assert.deepEqual(cache.leituras, []);
  // `_get_cron_lock()` nasce com `$value = 0` e devolve esse zero (`:67`, `:81`).
  assert.deepEqual(ausente, { presente: false, valorDoLegado: 0 });

  const chave = chaveDaTrava(1_700_000_000.5);
  dados.responder([{ option_value: chave }]);
  assert.deepEqual(armazenamento.trava.obterSemCache(), {
    presente: true,
    chave,
  });
});

test('com cache externo, a leitura crua da trava FORCA a rebusca e nao toca no banco', () => {
  const { dados, armazenamento, cache } = armazenamentoDeTeste({
    cacheExterno: true,
  });
  const chave = chaveDaTrava(1_700_000_000.5);
  cache.guardar(NOME_DA_TRAVA, GRUPO_DE_TRANSIENTE, chave);

  assert.deepEqual(armazenamento.trava.obterSemCache(), {
    presente: true,
    chave,
  });

  // O terceiro argumento e `$force`, e o legado passa verdadeiro
  // (`wp-cron.php:73`) — *"Skip local cache and force re-fetch"*.
  assert.deepEqual(cache.leituras[0], {
    chave: NOME_DA_TRAVA,
    grupo: GRUPO_DE_TRANSIENTE,
    forcar: true,
  });
  assert.deepEqual(dados.selecoes, []);

  // E a leitura normal NAO forca: `get_transient()` nao passa `$force`
  // (`wp-includes/option.php:1456`).
  armazenamento.trava.obter();
  assert.equal(cache.leituras[1]?.forcar, false);
});

test('a leitura normal da trava nao consulta a linha de prazo', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();

  armazenamento.trava.obter();

  // A trava e gravada com carregamento automatico ligado, logo o ramo do prazo de
  // `get_transient()` (`wp-includes/option.php:1459`-`1473`) nao roda. Emitir a
  // consulta de `_transient_timeout_doing_cron` seria emitir comando que o legado
  // nao emite.
  assert.equal(dados.selecoes.length, 1);
  assert.deepEqual(dados.selecoes[0]?.parametros, [OPCAO_DA_TRAVA]);
});

test('tomar a trava na linha ausente insere com carregamento automatico ligado', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  const chave = chaveDaTrava(1_700_000_000.5);

  assert.equal(armazenamento.trava.tomar(chave), true);

  assert.equal(dados.escritas.length, 1);
  assert.deepEqual(
    dados.escritas[0]?.parametros.map(textoDoParametro),
    [OPCAO_DA_TRAVA, chave, CARREGAMENTO_AUTOMATICO_LIGADO],
  );
  // 22 casas decimais: a identidade da trava e a cadeia inteira.
  assert.equal(chave.split('.')[1]?.length, 22);
});

test('tomar a trava que ja e a mesma nao emite comando, e trocar de dono atualiza', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  const minha = chaveDaTrava(1_700_000_000.5);
  const doOutro = chaveDaTrava(1_700_000_010.5);

  dados.responder([{ option_value: minha }]);
  assert.equal(armazenamento.trava.tomar(minha), false);
  assert.equal(dados.escritas.length, 0);

  dados.responder([{ option_value: minha }]);
  assert.equal(armazenamento.trava.tomar(doOutro), true);
  assert.equal(
    dados.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ? WHERE option_name = ?',
  );
  assert.deepEqual(
    dados.escritas[0]?.parametros.map(textoDoParametro),
    [doOutro, OPCAO_DA_TRAVA],
  );
});

test('com cache externo, tomar a trava grava SEM VALIDADE no grupo de transiente', () => {
  const { dados, armazenamento, cache } = armazenamentoDeTeste({
    cacheExterno: true,
  });
  const chave = chaveDaTrava(1_700_000_000.5);

  assert.equal(armazenamento.trava.tomar(chave), true);

  // `set_transient( 'doing_cron', $v )` sem o terceiro argumento: `$expiration` e
  // zero, logo `wp_cache_set( ..., 0 )` (`wp-includes/option.php:1542`). A trava
  // NAO expira; os 60 segundos sao aritmetica feita na leitura.
  assert.deepEqual(cache.escritas, [
    {
      chave: NOME_DA_TRAVA,
      grupo: GRUPO_DE_TRANSIENTE,
      valor: chave,
      expiracaoEmSegundos: 0,
    },
  ]);
  assert.deepEqual(dados.escritas, []);
});

test('liberar a trava que nao existe NAO emite DELETE', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();

  assert.equal(armazenamento.trava.liberar(), false);

  // `delete_option()` le o `autoload` antes e desiste sem apagar
  // (`wp-includes/option.php:1215`-`1218`). A consulta nao tem `LIMIT`.
  assert.equal(dados.selecoes.length, 1);
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT autoload FROM wp_options WHERE option_name = ?',
  );
  assert.deepEqual(dados.escritas, []);
});

test('liberar a trava apaga a linha, e tenta a linha de prazo que nunca existe', () => {
  const { dados, armazenamento } = armazenamentoDeTeste();
  dados.responder([{ autoload: CARREGAMENTO_AUTOMATICO_LIGADO }]);

  assert.equal(armazenamento.trava.liberar(), true);

  // `delete_transient()` apaga a linha e, tendo apagado, tenta a de prazo
  // (`wp-includes/option.php:1398`-`1402`). A tentativa e uma leitura que nao
  // acha nada — e nenhum `DELETE` sai dela.
  assert.deepEqual(
    dados.selecoes.map((consulta) => consulta.parametros[0]),
    [OPCAO_DA_TRAVA, OPCAO_DE_PRAZO_DA_TRAVA],
  );
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'DELETE FROM wp_options WHERE option_name = ?',
  );
  assert.deepEqual(dados.escritas[0]?.parametros, [OPCAO_DA_TRAVA]);
});

test('com cache externo, liberar a trava remove a chave do grupo e nao toca no banco', () => {
  const { dados, armazenamento, cache } = armazenamentoDeTeste({
    cacheExterno: true,
  });

  assert.equal(armazenamento.trava.liberar(), true);

  assert.deepEqual(cache.remocoes, [
    { chave: NOME_DA_TRAVA, grupo: GRUPO_DE_TRANSIENTE },
  ]);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(dados.selecoes, []);
});

test('duas composicoes nao compartilham morada: a tabela e por site', () => {
  // A tabela de opcoes e de escopo POR SITE (`target_data_model.md`), logo cada
  // site da rede tem a sua fila e a sua trava.
  const principal = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const secundario = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_7_' });
  const cache = criarPortaDeCacheFalsa();

  criarArmazenamentoDeTrabalhoAgendado(principal.porta, cache.porta)
    .fila.obter();
  criarArmazenamentoDeTrabalhoAgendado(secundario.porta, cache.porta)
    .fila.obter();

  assert.equal(
    principal.selecoes[0]?.texto,
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
  );
  assert.equal(
    secundario.selecoes[0]?.texto,
    'SELECT option_value FROM wp_7_options WHERE option_name = ? LIMIT 1',
  );
});
