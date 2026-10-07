/**
 * A entrega de T003: *"o comportamento de US-1 existe e os critérios CA-1.1,
 * CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-1.** Esses sao T004, que pede 8 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-001-1 a UT-001-8), *"com o
 * mesmo dado de entrada, acao e resultado esperado"*. Esta suite afirma os cinco
 * critérios e as regras do legado que a implementacao poderia quebrar em
 * silencio — a divida herdada de `ESC-ENUMERACAO`, o acumulo de token de
 * `ESC-SESSAO`, e a ausencia de capacidade exigida.
 *
 * A porta de relogio e controlada em todos os testes de prazo, como o P4 cobra:
 * *"teste por atestado que fixa prazo e forca, com relogio controlado"*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  autenticar,
  verificarSiteDaRede,
  type CredenciaisDeEntrada,
} from './autenticar.js';
import {
  CADEIA_DE_AUTENTICACAO_DE_FABRICA,
  ordenarCadeia,
  PRIORIDADE_DA_VERIFICACAO_DE_SPAM,
  PRIORIDADE_POR_EMAIL_E_SENHA,
  PRIORIDADE_POR_LOGIN_E_SENHA,
} from './cadeia-de-autenticacao.js';
import {
  REDE_INATIVA,
  type ContextoDeAutenticacao,
  type EstadoDaRede,
} from './contexto-de-autenticacao.js';
import {
  ehErroDeAutenticacao,
  primeiroCodigoDeErro,
  type ErroDeAutenticacao,
} from './erro-de-autenticacao.js';
import {
  COMPRIMENTO_MAXIMO_DE_SENHA,
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  type PrimitivaDeBcrypt,
} from './verificacao-de-senha.js';
import {
  PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
} from './prazos-de-sessao.js';
import {
  COMPRIMENTO_DO_TOKEN_DE_SESSAO,
  resumoDoTokenDeSessao,
  type MapaDeSessoes,
} from '../sessao/registro-de-sessoes.js';
import type { Conta, LeituraDeConta } from '../conta/leitura-de-conta.js';

const AGORA = 1_700_000_000;

/** As senhas em claro que esta suite usa. */
const SENHAS_CONHECIDAS = ['segredo'] as const;

/**
 * O corpo do hash, com os 60 caracteres que um hash de bcrypt tem.
 *
 * O comprimento importa: e por ele que o verificador escolhe o ramo, e um hash
 * curto cairia no ramo de resumo antigo. Um simulado curto esconderia o ramo
 * errado atras de um teste verde.
 */
function corpoDoHash(senha: string): string {
  const marca = Buffer.from(senha, 'utf8').toString('hex');
  return `$2y$10$${marca}${'.'.repeat(60 - 7 - marca.length)}`;
}

/** O hash de uma senha, na forma em que o legado o guarda: prefixo mais corpo. */
function hashDeFabrica(senha: string): string {
  return `$wp${corpoDoHash(senha)}`;
}

/**
 * Um bcrypt de teste.
 *
 * A primitiva real e adaptador — `plan.md` escolhe bcrypt por biblioteca nativa,
 * e AD-04 poe essa borda em `adaptadores/`. O que esta suite precisa afirmar e o
 * que e **deste** modulo: que o pre-processamento chega ao bcrypt em HMAC-SHA384
 * base64, e que o prefixo e removido antes.
 */
const BCRYPT_DE_TESTE: PrimitivaDeBcrypt = {
  verificar(senhaPreProcessada, hash) {
    return SENHAS_CONHECIDAS.some(
      (senha) =>
        corpoDoHash(senha) === hash &&
        preProcessarSenhaParaBcrypt(senha) === senhaPreProcessada,
    );
  },
};

interface Montagem {
  readonly contexto: ContextoDeAutenticacao;
  readonly escritas: string[];
  readonly sessoesGravadas: Map<number, MapaDeSessoes>;
  readonly entradas: string[];
  readonly falhas: Array<{ identificador: string; erro: ErroDeAutenticacao }>;
}

function contaDeFabrica(parcial: Partial<Conta> = {}): Conta {
  return {
    id: 7,
    login: 'ada',
    senhaHash: hashDeFabrica('segredo'),
    email: 'ada@exemplo.invalido',
    apelido: 'ada',
    nomeExibido: 'Ada',
    chaveDeAtivacao: '',
    ...parcial,
  };
}

function montar(
  contas: readonly Conta[],
  opcoes: {
    readonly rede?: EstadoDaRede;
    readonly sessoesIniciais?: MapaDeSessoes;
    readonly agora?: number;
  } = {},
): Montagem {
  const escritas: string[] = [];
  const sessoesGravadas = new Map<number, MapaDeSessoes>();
  const entradas: string[] = [];
  const falhas: Array<{ identificador: string; erro: ErroDeAutenticacao }> = [];

  const registro = new Map(contas.map((conta) => [conta.id, conta]));

  const leitura: LeituraDeConta = {
    porLogin(login) {
      return [...registro.values()].find((c) => c.login === login) ?? null;
    },
    porEmail(email) {
      return [...registro.values()].find((c) => c.email === email) ?? null;
    },
    apagarChaveDeAtivacao(id) {
      escritas.push(`apagarChaveDeAtivacao:${id}`);
      const conta = registro.get(id);
      if (conta !== undefined) {
        registro.set(id, { ...conta, chaveDeAtivacao: '' });
      }
    },
  };

  if (opcoes.sessoesIniciais !== undefined) {
    sessoesGravadas.set(contas[0]?.id ?? 0, opcoes.sessoesIniciais);
  }

  const contexto: ContextoDeAutenticacao = {
    relogio: { agoraEmSegundos: () => opcoes.agora ?? AGORA },
    contas: leitura,
    sessoes: {
      ler(id) {
        return sessoesGravadas.get(id) ?? {};
      },
      gravar(id, sessoes) {
        sessoesGravadas.set(id, sessoes);
      },
    },
    verificadorDeSenha: criarVerificadorDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_TESTE,
    }),
    // Nesta suite a remocao de acentos e identidade, e isso esta declarado:
    // a tabela de caractere e de `plataforma/` (ver normalizacao-de-credencial).
    removerAcentos: (texto) => texto,
    rede: opcoes.rede ?? REDE_INATIVA,
    urlDeSenhaPerdida: 'https://exemplo.invalido/wp-login.php?action=lostpassword',
    urlDoPainel: 'https://exemplo.invalido/wp-admin/',
    ganchos: {
      aoEntrar: (login) => entradas.push(login),
      aoFalharEntrada: (identificador, erro) =>
        falhas.push({ identificador, erro }),
    },
  };

  return { contexto, escritas, sessoesGravadas, entradas, falhas };
}

function credenciais(parcial: Partial<CredenciaisDeEntrada> = {}): CredenciaisDeEntrada {
  return { login: 'ada', senha: 'segredo', ...parcial };
}

// ---------------------------------------------------------------------------
// CA-1.1 — credencial correta cria token de sessao e devolve o destino
// ---------------------------------------------------------------------------

test('CA-1.1 credencial correta cria um token de sessao', () => {
  const { contexto, sessoesGravadas } = montar([contaDeFabrica()]);

  const resultado = autenticar(credenciais(), contexto);

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  assert.equal(resultado.sessao.token.length, COMPRIMENTO_DO_TOKEN_DE_SESSAO);
  assert.match(resultado.sessao.token, /^[A-Za-z0-9]+$/);

  // O que foi gravado e o RESUMO do token, nunca o token em claro.
  const gravadas = sessoesGravadas.get(7) ?? {};
  const chaves = Object.keys(gravadas);
  assert.equal(chaves.length, 1);
  assert.equal(chaves[0], resumoDoTokenDeSessao(resultado.sessao.token));
  assert.ok(!chaves.includes(resultado.sessao.token));
});

test('CA-1.1 o destino e o pedido quando ha um', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const resultado = autenticar(
    credenciais({ destinoPedido: 'https://exemplo.invalido/wp-admin/edit.php' }),
    contexto,
  );

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;
  assert.equal(
    resultado.destinoDeRetorno,
    'https://exemplo.invalido/wp-admin/edit.php',
  );
});

test('CA-1.1 o destino e o painel quando nenhum foi pedido', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const semDestino = autenticar(credenciais(), contexto);
  const destinoVazio = autenticar(credenciais({ destinoPedido: '' }), contexto);

  assert.equal(semDestino.autenticado, true);
  assert.equal(destinoVazio.autenticado, true);
  if (!semDestino.autenticado || !destinoVazio.autenticado) return;
  assert.equal(semDestino.destinoDeRetorno, 'https://exemplo.invalido/wp-admin/');
  assert.equal(destinoVazio.destinoDeRetorno, 'https://exemplo.invalido/wp-admin/');
});

test('CA-1.1 o prazo do token e o do legado: 2 dias, e 14 com lembranca (U5)', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const sem = autenticar(credenciais(), contexto);
  const com = autenticar(credenciais({ lembrar: true }), contexto);

  assert.equal(sem.autenticado, true);
  assert.equal(com.autenticado, true);
  if (!sem.autenticado || !com.autenticado) return;

  assert.equal(sem.sessao.expiraEm, AGORA + 2 * SEGUNDOS_POR_DIA);
  assert.equal(com.sessao.expiraEm, AGORA + 14 * SEGUNDOS_POR_DIA);
  assert.equal(PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA.semLembrar, 2 * SEGUNDOS_POR_DIA);
  assert.equal(PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA.comLembrar, 14 * SEGUNDOS_POR_DIA);
});

test('ESC-SESSAO: o registro de token ACUMULA, nao substitui (BR-MIGRAR-111)', () => {
  const { contexto, sessoesGravadas } = montar([contaDeFabrica()], {
    sessoesIniciais: {
      'resumo-de-outro-dispositivo': { expiraEm: AGORA + 10, abertaEm: AGORA - 10 },
    },
  });

  const resultado = autenticar(credenciais(), contexto);
  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  const gravadas = sessoesGravadas.get(7) ?? {};
  // O criterio de aceite de BR-MIGRAR-111 verifica o ACUMULO, nao a limpeza.
  assert.equal(Object.keys(gravadas).length, 2);
  assert.ok('resumo-de-outro-dispositivo' in gravadas);
  assert.ok(resumoDoTokenDeSessao(resultado.sessao.token) in gravadas);
});

// ---------------------------------------------------------------------------
// CA-1.2 — login e e-mail chegam ao mesmo registro
// ---------------------------------------------------------------------------

test('CA-1.2 o mesmo par funciona pelo login e pelo e-mail, no mesmo registro', () => {
  const porLogin = montar([contaDeFabrica()]);
  const porEmail = montar([contaDeFabrica()]);

  const umA = autenticar(credenciais({ login: 'ada' }), porLogin.contexto);
  const umB = autenticar(
    credenciais({ login: 'ada@exemplo.invalido' }),
    porEmail.contexto,
  );

  assert.equal(umA.autenticado, true);
  assert.equal(umB.autenticado, true);
  if (!umA.autenticado || !umB.autenticado) return;
  assert.equal(umA.conta.id, umB.conta.id);
  assert.equal(umA.conta.login, umB.conta.login);
});

test('CA-1.2 identificador que nao e e-mail nao produz erro de e-mail (ordem da cadeia)', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const resultado = autenticar(credenciais({ login: 'nao-existe' }), contexto);

  assert.equal(resultado.autenticado, false);
  if (resultado.autenticado || resultado.motivo !== 'credencial-invalida') return;
  // A etapa de e-mail DESISTE sem tocar no valor, logo o erro que sobrevive e o
  // do login. Se ela sobrescrevesse, as duas mensagens de ESC-ENUMERACAO
  // trocariam de lugar.
  assert.equal(primeiroCodigoDeErro(resultado.erro), 'invalid_username');
});

test('a cadeia de fabrica tem a ordem e as prioridades do legado (P2)', () => {
  assert.deepEqual(
    ordenarCadeia(CADEIA_DE_AUTENTICACAO_DE_FABRICA).map((e) => [
      e.nome,
      e.prioridade,
    ]),
    [
      ['autenticar-por-login-e-senha', PRIORIDADE_POR_LOGIN_E_SENHA],
      ['autenticar-por-email-e-senha', PRIORIDADE_POR_EMAIL_E_SENHA],
      ['verificar-conta-marcada-como-spam', PRIORIDADE_DA_VERIFICACAO_DE_SPAM],
    ],
  );
});

test('a cadeia e filtravel: uma extensao troca o critério inteiro (UC-19, P2)', () => {
  const { contexto } = montar([contaDeFabrica()]);
  const conta = contaDeFabrica({ id: 99, login: 'pelo-filtro' });

  const resultado = autenticar(credenciais({ senha: 'errada' }), contexto, {
    cadeia: [
      ...CADEIA_DE_AUTENTICACAO_DE_FABRICA,
      { nome: 'extensao', prioridade: 10, etapa: () => conta },
    ],
  });

  // Prioridade 10 roda ANTES das de 20, e as de 20 desistem porque ja ha conta.
  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;
  assert.equal(resultado.conta.id, 99);
});

// ---------------------------------------------------------------------------
// CA-1.3 — a senha e conferida contra o hash, e nunca gravada em claro
// ---------------------------------------------------------------------------

test('CA-1.3 senha errada e recusada, e a mensagem distingue (ESC-ENUMERACAO)', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const inexistente = autenticar(credenciais({ login: 'ninguem' }), contexto);
  const senhaErrada = autenticar(credenciais({ senha: 'errada' }), contexto);

  assert.equal(inexistente.autenticado, false);
  assert.equal(senhaErrada.autenticado, false);
  if (inexistente.autenticado || senhaErrada.autenticado) return;
  if (
    inexistente.motivo !== 'credencial-invalida' ||
    senhaErrada.motivo !== 'credencial-invalida'
  ) {
    return;
  }

  assert.equal(primeiroCodigoDeErro(inexistente.erro), 'invalid_username');
  assert.equal(primeiroCodigoDeErro(senhaErrada.erro), 'incorrect_password');
  // "as duas mensagens sao diferentes entre si, nas duas metades" — PT-006.
  assert.notEqual(
    inexistente.erro.itens[0]?.mensagem,
    senhaErrada.erro.itens[0]?.mensagem,
  );
  // E a mensagem NOMEIA o identificador tentado.
  assert.match(String(inexistente.erro.itens[0]?.mensagem), /ninguem/);
  assert.match(String(senhaErrada.erro.itens[0]?.mensagem), /ada/);
});

test('CA-1.3 a senha em claro nao e gravada em lugar algum', () => {
  const { contexto, escritas, sessoesGravadas } = montar([
    contaDeFabrica({ chaveDeAtivacao: `${AGORA}:chave` }),
  ]);

  const resultado = autenticar(credenciais(), contexto);
  assert.equal(resultado.autenticado, true);

  const gravado = JSON.stringify([...sessoesGravadas.entries()]) + escritas.join('|');
  assert.ok(!gravado.includes('segredo'));
});

test('CA-1.3 o hash chega ao bcrypt sem o prefixo, e a senha em HMAC-SHA384 base64', () => {
  const visto: Array<[string, string]> = [];
  const hash = hashDeFabrica('segredo');

  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: {
      verificar(senhaPreProcessada, hashRecebido) {
        visto.push([senhaPreProcessada, hashRecebido]);
        return true;
      },
    },
  });

  assert.equal(verificador.verificar('segredo', hash), true);
  assert.deepEqual(visto, [
    [preProcessarSenhaParaBcrypt('segredo'), hash.slice(3)],
  ]);
  // base64 de 48 bytes de SHA-384.
  assert.equal(preProcessarSenhaParaBcrypt('segredo').length, 64);
});

test('CA-1.3 senha acima do teto do legado e recusada sem conferir (P6, borda)', () => {
  let chamou = false;
  const hash = hashDeFabrica('segredo');
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: {
      verificar() {
        chamou = true;
        return true;
      },
    },
  });

  // No limite, confere.
  assert.equal(
    verificador.verificar('a'.repeat(COMPRIMENTO_MAXIMO_DE_SENHA), hash),
    true,
  );
  assert.equal(chamou, true);

  // Um caractere acima, recusa e nao confere.
  chamou = false;
  assert.equal(
    verificador.verificar('a'.repeat(COMPRIMENTO_MAXIMO_DE_SENHA + 1), hash),
    false,
  );
  assert.equal(chamou, false);
});

test('CA-1.3 hash em formato desconhecido recusa, nao deixa passar', () => {
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_TESTE,
  });

  assert.equal(
    verificador.verificar('segredo', '$P$Bformato-portavel-antigo-com-mais-de-32'),
    false,
  );
});

test('a senha perde o espaco das pontas antes da cadeia, como no legado', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const resultado = autenticar(credenciais({ senha: '  segredo  ' }), contexto);

  assert.equal(resultado.autenticado, true);
});

// ---------------------------------------------------------------------------
// CA-1.4 — a chave de redefinicao pendente deixa de valer
// ---------------------------------------------------------------------------

test('CA-1.4 chave de redefinicao pendente e apagada no primeiro acesso (U4)', () => {
  const { contexto, escritas } = montar([
    contaDeFabrica({ chaveDeAtivacao: `${AGORA}:chave-em-claro` }),
  ]);

  const resultado = autenticar(credenciais(), contexto);

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;
  assert.deepEqual(escritas, ['apagarChaveDeAtivacao:7']);
  assert.equal(resultado.conta.chaveDeAtivacao, '');
});

test('CA-1.4 sem chave pendente, nada e escrito (efeito no banco e o criterio)', () => {
  const { contexto, escritas } = montar([contaDeFabrica()]);

  autenticar(credenciais(), contexto);

  assert.deepEqual(escritas, []);
});

test('CA-1.4 entrada recusada NAO apaga a chave pendente', () => {
  const { contexto, escritas } = montar([
    contaDeFabrica({ chaveDeAtivacao: `${AGORA}:chave-em-claro` }),
  ]);

  autenticar(credenciais({ senha: 'errada' }), contexto);

  assert.deepEqual(escritas, []);
});

// ---------------------------------------------------------------------------
// CA-1.5 — conta de site suspenso na rede e recusada antes do formulario
// ---------------------------------------------------------------------------

test('CA-1.5 site marcado como spam recusa antes de o formulario ser processado', () => {
  const rede: EstadoDaRede = {
    ativa: true,
    siteArquivado: false,
    siteMarcadoComoSpam: true,
  };
  const { contexto, sessoesGravadas, escritas } = montar([contaDeFabrica()], { rede });

  // A guarda e consultavel sozinha, antes de ler o corpo da requisicao.
  assert.deepEqual(verificarSiteDaRede(contexto), {
    eixo: 'site-marcado-como-spam',
    codigoHttp: 410,
  });

  // E, pelo caminho da operacao, a credencial correta tambem e recusada.
  const resultado = autenticar(credenciais(), contexto);
  assert.equal(resultado.autenticado, false);
  if (resultado.autenticado || resultado.motivo !== 'site-suspenso-na-rede') {
    assert.fail('a recusa de rede deveria vir antes da credencial');
  }
  assert.equal(resultado.recusa.codigoHttp, 410);
  assert.equal(sessoesGravadas.size, 0);
  assert.deepEqual(escritas, []);
});

test('CA-1.5 site arquivado da a mesma resposta, e e eixo distinto (UC-43, N3)', () => {
  const rede: EstadoDaRede = {
    ativa: true,
    siteArquivado: true,
    siteMarcadoComoSpam: true,
  };
  const { contexto } = montar([contaDeFabrica()], { rede });

  const recusa = verificarSiteDaRede(contexto);
  // Os dois eixos sao ortogonais e dao a MESMA resposta; a ordem de teste e que
  // decide qual aparece, e ela fica fixada aqui.
  assert.equal(recusa?.eixo, 'site-arquivado');
  assert.equal(recusa?.codigoHttp, 410);
});

test('CA-1.5 fora da rede, a verificacao nao decide nada', () => {
  const { contexto } = montar([contaDeFabrica()]);

  assert.equal(verificarSiteDaRede(contexto), null);
  assert.equal(autenticar(credenciais(), contexto).autenticado, true);
});

test('conta marcada como spam e recusada, e so em rede (pre-condicao de UC-19)', () => {
  const emRede = montar([contaDeFabrica({ marcadaComoSpam: true })], {
    rede: { ativa: true, siteArquivado: false, siteMarcadoComoSpam: false },
  });
  const foraDaRede = montar([contaDeFabrica({ marcadaComoSpam: true })]);

  const recusada = autenticar(credenciais(), emRede.contexto);
  assert.equal(recusada.autenticado, false);
  if (!recusada.autenticado && recusada.motivo === 'credencial-invalida') {
    assert.equal(primeiroCodigoDeErro(recusada.erro), 'spammer_account');
  } else {
    assert.fail('esperava recusa por conta marcada como spam');
  }

  // A coluna so existe na variante multisite: fora da rede, nada decide.
  assert.equal(autenticar(credenciais(), foraDaRede.contexto).autenticado, true);
});

// ---------------------------------------------------------------------------
// Pontos de extensao e campos vazios
// ---------------------------------------------------------------------------

test('campos vazios somam os dois codigos num erro so, e nao duplicam', () => {
  const { contexto, falhas } = montar([contaDeFabrica()]);

  const resultado = autenticar(credenciais({ login: '', senha: '' }), contexto);

  assert.equal(resultado.autenticado, false);
  if (resultado.autenticado || resultado.motivo !== 'credencial-invalida') return;
  assert.deepEqual(
    resultado.erro.itens.map((item) => item.codigo),
    ['empty_username', 'empty_password'],
  );
  // E o ponto de extensao de falha NAO dispara para campo vazio.
  assert.deepEqual(falhas, []);
});

test('o ponto de extensao de falha dispara para os demais codigos', () => {
  const { contexto, falhas } = montar([contaDeFabrica()]);

  autenticar(credenciais({ senha: 'errada' }), contexto);

  assert.equal(falhas.length, 1);
  assert.equal(falhas[0]?.identificador, 'ada');
  assert.ok(ehErroDeAutenticacao(falhas[0]?.erro));
});

test('o ponto de extensao de entrada dispara depois de a credencial ser aceita', () => {
  const { contexto, entradas } = montar([contaDeFabrica()]);

  autenticar(credenciais(), contexto);

  assert.deepEqual(entradas, ['ada']);
});

test('cadeia que devolve nada cai no erro generico, nao em sucesso', () => {
  const { contexto } = montar([contaDeFabrica()]);

  const resultado = autenticar(credenciais(), contexto, {
    cadeia: [{ nome: 'extensao-muda', prioridade: 10, etapa: () => null }],
  });

  assert.equal(resultado.autenticado, false);
  if (resultado.autenticado || resultado.motivo !== 'credencial-invalida') return;
  assert.equal(primeiroCodigoDeErro(resultado.erro), 'authentication_failed');
});
