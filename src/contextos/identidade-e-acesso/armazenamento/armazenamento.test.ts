/**
 * Testes da entrega de T002, lado conta / perfil / sessao: *"as estruturas da
 * secao Modelo de dados do plano existem, sao lidas e gravadas pela porta de
 * dados"*.
 *
 * O que cada teste afirma e **efeito no banco**: qual comando sai, com quais
 * parametros, e — nas estruturas serializadas — com quais bytes. Os testes das
 * historias (T004, T006, T008 …) sao outros: estes nao autenticam, nao expiram e
 * nao autorizam nada.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { nomeDaChave } from '../../../plataforma/serializacao/index.js';

import {
  camposDeSessao,
  criarArmazenamento,
  DATA_SENTINELA,
  escaparParaLike,
  lerCamposDeSessao,
  resumoDeToken,
} from './index.js';
import { criarPortaDeDadosFalsa, textoDoParametro } from './porta-falsa.js';

const CONTA_NOVA = {
  login: 'ana',
  senhaHash: '$wp$2y$10$abcdefghijklmnopqrstuv',
  apelido: 'ana',
  email: 'ana@exemplo.invalido',
  url: '',
  registradoEm: '2026-10-07 12:00:00',
  chaveDeAtivacao: '',
  nomeExibido: 'ana',
} as const;

test('criar o armazenamento nao toca na porta (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamento(falsa.porta);

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('inserir conta nao escreve a coluna morta nem as colunas de rede (DB-DEAD)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  const id = armazenamento.contas.inserir(CONTA_NOVA);

  assert.equal(id, 7);
  assert.equal(falsa.escritas.length, 1);
  const consulta = falsa.escritas[0];
  assert.ok(consulta);
  assert.equal(
    consulta.texto,
    'INSERT INTO wp_users (user_login, user_pass, user_nicename, user_email, ' +
      'user_url, user_registered, user_activation_key, display_name) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  assert.ok(!consulta.texto.includes('user_status'));
  assert.ok(!consulta.texto.includes('spam'));
  assert.ok(!consulta.texto.includes('deleted'));
  assert.deepEqual(consulta.parametros, [
    'ana',
    '$wp$2y$10$abcdefghijklmnopqrstuv',
    'ana',
    'ana@exemplo.invalido',
    '',
    '2026-10-07 12:00:00',
    '',
    'ana',
  ]);
});

test('a conta e lida pelas 10 colunas da variante de site unico', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([
    {
      ID: '12',
      user_login: 'ana',
      user_pass: '$wp$hash',
      user_nicename: 'ana',
      user_email: 'ana@exemplo.invalido',
      user_url: '',
      user_registered: DATA_SENTINELA,
      user_activation_key: '',
      user_status: 0,
      display_name: 'Ana',
    },
  ]);

  const conta = armazenamento.contas.obterPorLogin('ana');

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT ID, user_login, user_pass, user_nicename, user_email, user_url, ' +
      'user_registered, user_activation_key, user_status, display_name ' +
      'FROM wp_users WHERE user_login = ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, ['ana']);
  assert.equal(conta?.id, 12);
  assert.equal(conta?.nomeExibido, 'Ana');
  // A sentinela e preservada como literal: nao vira nulo nem data (DB-SENT).
  assert.equal(conta?.registradoEm, DATA_SENTINELA);
  assert.equal(conta?.supervisaoDeRede, null);
});

test('a variante de rede le e escreve as duas colunas a mais', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta, { variante: 'rede' });
  falsa.responder([
    {
      ID: 1,
      user_login: 'ana',
      user_pass: '',
      user_nicename: 'ana',
      user_email: '',
      user_url: '',
      user_registered: DATA_SENTINELA,
      user_activation_key: '',
      user_status: 0,
      display_name: '',
      spam: 1,
      deleted: 0,
    },
  ]);

  const conta = armazenamento.contas.obterPorId(1);

  assert.ok(falsa.selecoes[0]?.texto.endsWith('spam, deleted FROM wp_users WHERE ID = ?'));
  assert.deepEqual(conta?.supervisaoDeRede, { spam: 1, deleted: 0 });

  armazenamento.contas.atualizarSupervisaoDeRede(1, { spam: 0 });
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_users SET spam = ? WHERE ID = ?',
  );
});

test('supervisao de rede na variante de site unico e recusada, nao degradada', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  assert.throws(() => armazenamento.contas.atualizarSupervisaoDeRede(1, { spam: 1 }));
  assert.deepEqual(falsa.escritas, []);
});

test('atualizar sem campo nenhum nao emite comando', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  assert.equal(armazenamento.contas.atualizar(1, {}), 0);
  assert.deepEqual(falsa.escritas, []);
});

test('users e usermeta ficam no prefixo base; options, no prefixo do site', () => {
  // O caso que so aparece em rede: o site e o 2, e as tabelas globais nao levam
  // o numero dele.
  const falsa = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });
  const armazenamento = criarArmazenamento(falsa.porta);

  armazenamento.contas.obterPorId(1);
  armazenamento.perfil.listar(1);
  armazenamento.papeis.obterDefinicao();

  assert.ok(falsa.selecoes[0]?.texto.includes('FROM wp_users'));
  assert.ok(falsa.selecoes[1]?.texto.includes('FROM wp_usermeta'));
  assert.ok(falsa.selecoes[2]?.texto.includes('FROM wp_2_options'));
  assert.deepEqual(falsa.selecoes[2]?.parametros, ['wp_2_user_roles']);
});

test('gravar metadado inexistente insere', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([]);

  assert.equal(armazenamento.perfil.gravar(3, 'nickname', 'ana'), true);
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_usermeta (user_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [3, 'nickname', 'ana']);
});

test('gravar metadado com o mesmo valor nao emite comando nenhum', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([
    { umeta_id: 1, user_id: 3, meta_key: 'nickname', meta_value: 'ana' },
  ]);

  assert.equal(armazenamento.perfil.gravar(3, 'nickname', 'ana'), false);
  assert.deepEqual(falsa.escritas, []);
});

test('gravar metadado repetido atualiza todas as linhas daquela chave', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([
    { umeta_id: 1, user_id: 3, meta_key: 'nickname', meta_value: 'ana' },
    { umeta_id: 2, user_id: 3, meta_key: 'nickname', meta_value: 'ana' },
  ]);

  assert.equal(armazenamento.perfil.gravar(3, 'nickname', 'outra'), true);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_usermeta SET meta_value = ? WHERE user_id = ? AND meta_key = ?',
  );
});

test('acrescentar metadado insere mesmo com a chave ja gravada', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  assert.equal(armazenamento.perfil.acrescentar(3, 'nickname', 'ana'), 7);
  assert.equal(falsa.selecoes.length, 0);
  assert.equal(falsa.escritas.length, 1);
});

test('a busca por conta com um trecho usa curinga dos dois lados', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([{ user_id: 4 }, { user_id: 9 }]);

  const ids = armazenamento.perfil.idsDeContasComValorContendo(
    'wp_capabilities',
    '"editor"',
  );

  assert.deepEqual(ids, [4, 9]);
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT user_id FROM wp_usermeta WHERE meta_key = ? AND meta_value LIKE ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [
    'wp_capabilities',
    '%"editor"%',
  ]);
});

test('os curingas e a barra sao escapados no trecho buscado', () => {
  assert.equal(escaparParaLike('100%_a\\b'), '100\\%\\_a\\\\b');
});

test('sessao: o conjunto vazio APAGA a linha, em vez de gravar arranjo vazio', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  armazenamento.sessoes.gravar(5, []);

  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_usermeta WHERE user_id = ? AND meta_key = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [5, 'session_tokens']);
});

test('sessao: a chave e o resumo do token, e os campos saem na ordem do legado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([]);

  armazenamento.sessoes.gravar(5, [
    {
      resumoDoToken: 'a'.repeat(64),
      campos: camposDeSessao({
        expiracao: 1_800_000_000,
        ip: '127.0.0.1',
        agente: 'agente',
        entradaEm: 1_700_000_000,
      }),
    },
  ]);

  const parametros = falsa.escritas[0]?.parametros ?? [];
  assert.equal(parametros[1], 'session_tokens');
  assert.equal(
    textoDoParametro(parametros[2]),
    `a:1:{s:64:"${'a'.repeat(64)}";a:4:{s:10:"expiration";i:1800000000;` +
      's:2:"ip";s:9:"127.0.0.1";s:2:"ua";s:6:"agente";s:5:"login";i:1700000000;}}',
  );
});

test('sessao: endereco e agente vazios nao sao gravados', () => {
  const campos = camposDeSessao({
    expiracao: 10,
    ip: '',
    agente: null,
    entradaEm: 20,
  });

  assert.equal(campos.tipo, 'arranjo');
  if (campos.tipo === 'arranjo') {
    assert.deepEqual(campos.entradas.map((entrada) => nomeDaChave(entrada.chave)), [
      'expiration',
      'login',
    ]);
  }
});

test('sessao: a forma antiga, que era so o instante, e convertida na leitura', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([
    {
      umeta_id: 1,
      user_id: 5,
      meta_key: 'session_tokens',
      meta_value: 'a:1:{s:5:"velho";i:1800000000;}',
    },
  ]);

  const sessoes = armazenamento.sessoes.obter(5);

  assert.equal(sessoes.length, 1);
  assert.equal(sessoes[0]?.resumoDoToken, 'velho');
  assert.deepEqual(lerCamposDeSessao(sessoes[0]?.campos ?? { tipo: 'nulo' }), {
    expiracao: 1_800_000_000,
    ip: null,
    agente: null,
    entradaEm: null,
  });
});

test('sessao: linha ausente ou ilegivel vira conjunto vazio, sem lancar', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  falsa.responder([]);
  assert.deepEqual(armazenamento.sessoes.obter(5), []);

  falsa.responder([
    {
      umeta_id: 1,
      user_id: 5,
      meta_key: 'session_tokens',
      meta_value: 'lixo',
    },
  ]);
  assert.deepEqual(armazenamento.sessoes.obter(5), []);
});

test('o resumo do token e SHA-256 em hexadecimal', () => {
  assert.equal(
    resumoDeToken('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('a leitura de sessao devolve o que esta gravado, sem filtrar o que venceu', () => {
  // O descarte do que venceu e regra de prazo (T007), com relogio controlado.
  // Aqui o armazenamento devolve as duas sessoes, inclusive a de expiracao no
  // passado remoto.
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([
    {
      umeta_id: 1,
      user_id: 5,
      meta_key: 'session_tokens',
      meta_value:
        'a:2:{s:1:"a";a:1:{s:10:"expiration";i:1;}s:1:"b";a:1:{s:10:"expiration";i:9999999999;}}',
    },
  ]);

  assert.deepEqual(
    armazenamento.sessoes.obter(5).map((sessao) => sessao.resumoDoToken),
    ['a', 'b'],
  );
});
