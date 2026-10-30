/**
 * US-3 — Resolver a credencial de integracao por precedencia declarada.
 * Criterios de aceite de **T007**: CA-3.1 a CA-3.5, contra
 * `wp-includes/connectors.php:444` (chave de API), `:483` (separacao do par) e
 * `:522` (resolucao do par), e o `$auth_out` da tela em `:912`.
 *
 * Os casos do catalogo (UT-152-1 a UT-152-8) sao de T008, em suite propria.
 * Aqui se afirma o criterio, com a porta falsa que registra comando: *"o valor
 * guardado e ignorado"* (CA-3.2) e afirmado pela lista de selecoes vazia.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { criarPortaDeDadosFalsa } from '../armazenamento/index.js';
import {
  CONECTOR_DE_FILTRAGEM_DE_SPAM,
  ORDEM_DE_PRECEDENCIA,
  PERMISSOES_DA_CREDENCIAL,
  criarAreaDeCredencial,
  separarCredencialDePar,
  type AutenticacaoDoConector,
  type AvisoDeUsoIndevido,
  type ConectorRegistrado,
  type FontesForaDoBanco,
  type RegistroDeProvedoresDeIa,
} from './index.js';

const CHAVE: AutenticacaoDoConector = {
  method: 'api_key',
  setting_name: 'connectors_spam_filtering_exemplo_api_key',
  constant_name: 'EXEMPLO_API_KEY',
  env_var_name: 'EXEMPLO_API_KEY',
};

const PAR: AutenticacaoDoConector = {
  method: 'application_password',
  setting_name: 'connectors_exemplo_application_password',
  constant_name: 'EXEMPLO_CREDENCIAIS',
  env_var_name: 'EXEMPLO_CREDENCIAIS',
};

const NENHUMA_FONTE: FontesForaDoBanco = { ambiente: {}, constantes: {} };

const SEM_IA: RegistroDeProvedoresDeIa = {
  temProvedor: () => false,
  provedorConfigurado: () => false,
};

function cenario() {
  const dados = criarPortaDeDadosFalsa();
  return { dados, area: criarAreaDeCredencial(dados.porta) };
}

function linhaDaOpcao(valor: string) {
  return [{ option_value: valor }];
}

function parSerializado(usuario: string, senha: string): string {
  return `a:2:{s:8:"username";s:${usuario.length}:"${usuario}";s:8:"password";s:${senha.length}:"${senha}";}`;
}

// ── CA-3.1 ──────────────────────────────────────────────────────────────────

test('CA-3.1: a ordem e declarada uma vez — ambiente, constante, banco', () => {
  assert.deepEqual(ORDEM_DE_PRECEDENCIA, ['env', 'constant', 'database']);
  assert.equal(Object.isFrozen(ORDEM_DE_PRECEDENCIA), true);
});

test('CA-3.1: chave de API — cada degrau vence os seguintes (connectors.php:444)', () => {
  const tres: FontesForaDoBanco = {
    ambiente: { EXEMPLO_API_KEY: 'do-ambiente' },
    constantes: { EXEMPLO_API_KEY: 'da-constante' },
  };
  const semAmbiente: FontesForaDoBanco = {
    ambiente: {},
    constantes: { EXEMPLO_API_KEY: 'da-constante' },
  };

  const a = cenario();
  a.dados.responder(linhaDaOpcao('do-banco'));
  assert.equal(a.area.origemDaChaveDeApi(tres, CHAVE), 'env');

  const b = cenario();
  b.dados.responder(linhaDaOpcao('do-banco'));
  assert.equal(b.area.origemDaChaveDeApi(semAmbiente, CHAVE), 'constant');

  const c = cenario();
  c.dados.responder(linhaDaOpcao('do-banco'));
  assert.equal(c.area.origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'database');

  const d = cenario();
  assert.equal(d.area.origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'none');
});

test('CA-3.1: par usuario:senha — a mesma ordem, na outra integracao (connectors.php:522)', () => {
  const a = cenario();
  a.dados.responder(linhaDaOpcao(parSerializado('banco', 'b')));
  assert.deepEqual(
    a.area.resolverCredencialDePar(
      {
        ambiente: { EXEMPLO_CREDENCIAIS: 'amb:a' },
        constantes: { EXEMPLO_CREDENCIAIS: 'const:c' },
      },
      PAR,
    ),
    { username: 'amb', password: 'a', source: 'env' },
  );

  const b = cenario();
  assert.deepEqual(
    b.area.resolverCredencialDePar(
      { ambiente: {}, constantes: { EXEMPLO_CREDENCIAIS: 'const:c' } },
      PAR,
    ),
    { username: 'const', password: 'c', source: 'constant' },
  );

  const c = cenario();
  c.dados.responder(linhaDaOpcao(parSerializado('banco', 'b')));
  assert.deepEqual(c.area.resolverCredencialDePar(NENHUMA_FONTE, PAR), {
    username: 'banco',
    password: 'b',
    source: 'database',
  });

  const d = cenario();
  assert.deepEqual(d.area.resolverCredencialDePar(NENHUMA_FONTE, PAR), {
    username: '',
    password: '',
    source: 'none',
  });
});

test('CA-3.1: valor vazio nao interrompe a cadeia, e constante que nao e cadeia nao conta (:448, :456)', () => {
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao('do-banco'));

  const origem = area.origemDaChaveDeApi(
    { ambiente: { EXEMPLO_API_KEY: '' }, constantes: { EXEMPLO_API_KEY: true } },
    CHAVE,
  );

  assert.equal(origem, 'database');
  assert.equal(dados.selecoes.length, 1);
});

test('CA-3.1 e I3: o servico de filtragem de spam passa pelo mesmo mecanismo, sem degrau de ambiente', () => {
  assert.deepEqual(CONECTOR_DE_FILTRAGEM_DE_SPAM.authentication, {
    method: 'api_key',
    credentials_url: 'https://akismet.com/get/',
    setting_name: 'wordpress_api_key',
    constant_name: 'WPCOM_API_KEY',
  });

  // O legado nao declara variavel de ambiente para ele: uma variavel com o
  // mesmo nome da constante nao e lida (:446).
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao('chave-guardada'));
  const origem = area.origemDaChaveDeApi(
    { ambiente: { WPCOM_API_KEY: 'no-ambiente' }, constantes: {} },
    CONECTOR_DE_FILTRAGEM_DE_SPAM.authentication,
  );
  assert.equal(origem, 'database');
  assert.deepEqual(dados.selecoes, [
    {
      texto: 'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
      parametros: ['wordpress_api_key'],
    },
  ]);

  const comConstante = cenario();
  assert.equal(
    comConstante.area.origemDaChaveDeApi(
      { ambiente: {}, constantes: { WPCOM_API_KEY: 'na-constante' } },
      CONECTOR_DE_FILTRAGEM_DE_SPAM.authentication,
    ),
    'constant',
  );
});

test('CA-3.1: o degrau do banco compara com cadeia vazia estrita (:463)', () => {
  const vazia = cenario();
  vazia.dados.responder(linhaDaOpcao(''));
  assert.equal(vazia.area.origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'none');

  const falsoSerializado = cenario();
  falsoSerializado.dados.responder(linhaDaOpcao('b:0;'));
  assert.equal(falsoSerializado.area.origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'database');

  // Nome de opcao que apara para vazio: get_option() devolve false sem consulta.
  const semNome = cenario();
  assert.equal(
    semNome.area.origemDaChaveDeApi(NENHUMA_FONTE, { method: 'api_key', setting_name: '  ' }),
    'database',
  );
  assert.deepEqual(semNome.dados.selecoes, []);
});

// ── CA-3.2 ──────────────────────────────────────────────────────────────────

test('CA-3.2: com a credencial no ambiente, o banco nem e lido', () => {
  const chave = cenario();
  chave.area.origemDaChaveDeApi(
    { ambiente: { EXEMPLO_API_KEY: 'do-ambiente' }, constantes: {} },
    CHAVE,
  );
  assert.deepEqual(chave.dados.selecoes, []);

  const par = cenario();
  par.area.resolverCredencialDePar(
    { ambiente: { EXEMPLO_CREDENCIAIS: 'u:s' }, constantes: {} },
    PAR,
  );
  assert.deepEqual(par.dados.selecoes, []);
});

test('CA-3.2: a tela diz que a credencial veio do ambiente, com valor guardado presente', () => {
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao('guardada'));
  const conector: ConectorRegistrado = { id: 'exemplo', type: 'spam_filtering', authentication: CHAVE };

  const tela = area.autenticacaoNaTela(conector, {
    fontes: { ambiente: { EXEMPLO_API_KEY: 'do-ambiente' }, constantes: {} },
    provedoresDeIa: SEM_IA,
  });

  assert.deepEqual(tela, {
    method: 'api_key',
    settingName: 'connectors_spam_filtering_exemplo_api_key',
    credentialsUrl: null,
    keySource: 'env',
    isConnected: true,
  });
  assert.deepEqual(dados.selecoes, []);
});

// ── CA-3.3 ──────────────────────────────────────────────────────────────────

test('CA-3.3: separa no primeiro separador, e o segredo conserva os seguintes (:484)', () => {
  assert.deepEqual(separarCredencialDePar('alice:se:cr:eto'), {
    username: 'alice',
    password: 'se:cr:eto',
  });
});

test('CA-3.3: as duas metades sao aparadas com o trim do PHP (:487, :488)', () => {
  assert.deepEqual(separarCredencialDePar(' alice\t: segredo\n'), {
    username: 'alice',
    password: 'segredo',
  });
  // NUL e tabulacao vertical saem; espaco nao separavel (U+00A0) fica.
  assert.deepEqual(separarCredencialDePar('\0alice\x0B:\u00a0s'), {
    username: 'alice',
    password: '\u00a0s',
  });
});

// ── CA-3.4 ──────────────────────────────────────────────────────────────────

test('CA-3.4: com qualquer metade vazia, as duas voltam vazias (:490)', () => {
  const vazio = { username: '', password: '' };
  assert.deepEqual(separarCredencialDePar(':segredo'), vazio);
  assert.deepEqual(separarCredencialDePar('alice:'), vazio);
  assert.deepEqual(separarCredencialDePar('alice:   '), vazio);
  assert.deepEqual(separarCredencialDePar('sem-separador'), vazio);
});

test('CA-3.4: par malformado no ambiente avisa e cai para a constante (:534)', () => {
  const avisos: AvisoDeUsoIndevido[] = [];
  const { dados, area } = cenario();

  const resolvida = area.resolverCredencialDePar(
    {
      ambiente: { EXEMPLO_CREDENCIAIS: 'alice:' },
      constantes: { EXEMPLO_CREDENCIAIS: 'bob:segredo' },
    },
    PAR,
    { avisar: (aviso) => avisos.push(aviso), escaparHtml: (texto) => `[${texto}]` },
  );

  assert.deepEqual(resolvida, { username: 'bob', password: 'segredo', source: 'constant' });
  assert.deepEqual(avisos, [
    {
      funcao: 'wp_connectors_get_application_password_credentials',
      mensagem:
        'The [EXEMPLO_CREDENCIAIS] environment variable must contain application password credentials in "username:password" format.',
      versao: '7.1.0',
    },
  ]);
  assert.deepEqual(dados.selecoes, []);
});

test('CA-3.4: sem relator, a resolucao decide igual (P7)', () => {
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao(parSerializado('banco', 'b')));

  const resolvida = area.resolverCredencialDePar(
    { ambiente: {}, constantes: { EXEMPLO_CREDENCIAIS: 'sem-separador' } },
    PAR,
  );

  assert.deepEqual(resolvida, { username: 'banco', password: 'b', source: 'database' });
});

test('CA-3.4: no banco, metade vazia faz a origem ser nenhuma, e a tela diz desconectado (:571 a :577)', () => {
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao(parSerializado('alice', '')));

  // O legado devolve a metade que tiver, com origem 'none' — nao zera o valor.
  assert.deepEqual(area.resolverCredencialDePar(NENHUMA_FONTE, PAR), {
    username: 'alice',
    password: '',
    source: 'none',
  });

  dados.responder(linhaDaOpcao(parSerializado('alice', '')));
  const tela = area.autenticacaoNaTela(
    { id: 'exemplo', type: 'outro', authentication: PAR },
    { fontes: NENHUMA_FONTE, provedoresDeIa: SEM_IA },
  );
  assert.deepEqual(tela, {
    method: 'application_password',
    settingName: 'connectors_exemplo_application_password',
    credentialsUrl: null,
    keySource: 'none',
    isConnected: false,
  });
});

test('CA-3.4: no banco, metade que nao e cadeia conta como vazia (:571, :572)', () => {
  const { dados, area } = cenario();
  dados.responder(linhaDaOpcao('a:2:{s:8:"username";s:5:"alice";s:8:"password";i:42;}'));

  assert.deepEqual(area.resolverCredencialDePar(NENHUMA_FONTE, PAR), {
    username: 'alice',
    password: '',
    source: 'none',
  });
});

// ── CA-3.5 ──────────────────────────────────────────────────────────────────

test('CA-3.5: a tela diz a origem de cada integracao e nenhum campo carrega o valor', () => {
  const segredos = ['do-ambiente', 'da-constante', 'guardada', 'u', 's3gr3do'];
  const { dados, area } = cenario();
  const fontes: FontesForaDoBanco = {
    ambiente: { EXEMPLO_API_KEY: 'do-ambiente' },
    constantes: { WPCOM_API_KEY: 'da-constante' },
  };
  dados.responder(linhaDaOpcao(parSerializado('u', 's3gr3do')));

  const contexto = { fontes, provedoresDeIa: SEM_IA };
  const telas = [
    area.autenticacaoNaTela({ id: 'exemplo', type: 'spam_filtering', authentication: CHAVE }, contexto),
    area.autenticacaoNaTela(CONECTOR_DE_FILTRAGEM_DE_SPAM, contexto),
    area.autenticacaoNaTela({ id: 'par', type: 'outro', authentication: PAR }, contexto),
    area.autenticacaoNaTela({ id: 'livre', type: 'outro', authentication: { method: 'none' } }, contexto),
  ];

  assert.deepEqual(
    telas.map((tela) => (tela.method === 'none' ? 'sem-credencial' : tela.keySource)),
    ['env', 'constant', 'database', 'sem-credencial'],
  );
  assert.deepEqual(telas[1], {
    method: 'api_key',
    settingName: 'wordpress_api_key',
    credentialsUrl: 'https://akismet.com/get/',
    keySource: 'constant',
    isConnected: true,
  });
  assert.deepEqual(telas[3], { method: 'none' });

  const serializado = JSON.stringify(telas);
  for (const segredo of segredos) {
    assert.equal(serializado.includes(`"${segredo}"`), false, segredo);
  }
});

test('CA-3.5: no provedor de IA a origem e dita, e a conexao vem do registro do cliente de IA (:920 a :925)', () => {
  const conector: ConectorRegistrado = {
    id: 'anthropic',
    type: 'ai_provider',
    authentication: {
      method: 'api_key',
      setting_name: 'connectors_ai_anthropic_api_key',
      constant_name: 'ANTHROPIC_API_KEY',
      env_var_name: 'ANTHROPIC_API_KEY',
    },
  };
  const fontes: FontesForaDoBanco = {
    ambiente: { ANTHROPIC_API_KEY: 'do-ambiente' },
    constantes: {},
  };

  const { area } = cenario();
  const naoConfigurado = area.autenticacaoNaTela(conector, { fontes, provedoresDeIa: SEM_IA });
  assert.equal(naoConfigurado.method !== 'none' && naoConfigurado.keySource, 'env');
  assert.equal(naoConfigurado.method !== 'none' && naoConfigurado.isConnected, false);

  const quebrado: RegistroDeProvedoresDeIa = {
    temProvedor: () => {
      throw new Error('registro indisponivel');
    },
    provedorConfigurado: () => true,
  };
  const comExcecao = area.autenticacaoNaTela(conector, { fontes, provedoresDeIa: quebrado });
  assert.equal(comExcecao.method !== 'none' && comExcecao.isConnected, false);

  const configurado = area.autenticacaoNaTela(conector, {
    fontes: NENHUMA_FONTE,
    provedoresDeIa: { temProvedor: () => true, provedorConfigurado: () => true },
  });
  assert.equal(configurado.method !== 'none' && configurado.keySource, 'none');
  assert.equal(configurado.method !== 'none' && configurado.isConnected, true);
});

test('P4: resolver nao pergunta capacidade, e ver a origem na tela exige manage_options', () => {
  assert.equal(PERMISSOES_DA_CREDENCIAL['resolver-credencial'].capacidade, null);
  assert.equal(PERMISSOES_DA_CREDENCIAL['ver-origem-na-tela'].capacidade, 'manage_options');
});

test('PT-017: dois sites com credenciais diferentes nao se enxergam', () => {
  const siteA = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const siteB = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });
  siteA.responder(linhaDaOpcao('chave-a'));
  siteB.responder(linhaDaOpcao(''));

  assert.equal(criarAreaDeCredencial(siteA.porta).origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'database');
  assert.equal(criarAreaDeCredencial(siteB.porta).origemDaChaveDeApi(NENHUMA_FONTE, CHAVE), 'none');
  assert.equal(siteB.selecoes[0]?.texto.includes('wp_2_options'), true);
});
