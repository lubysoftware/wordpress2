/**
 * A entrega de T009: *"o comportamento de US-4 existe e os critérios CA-4.1,
 * CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-4.** Esses sao T010, que pede 6 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-006-1 a UT-006-6), *"com o
 * mesmo dado de entrada, acao e resultado esperado"*. Esta suite afirma os cinco
 * critérios e as regras do legado que a implementacao poderia quebrar em
 * silencio: o acumulo de sessao de `ESC-SESSAO`, a ausencia de capacidade
 * exigida (P4), as bordas de prazo do P6, e a ordem dos pontos de extensao (P2).
 *
 * **O relogio e controlado em todos os testes de prazo**, como o P4 cobra —
 * *"teste por atestado que fixa prazo e forca, com relogio controlado"* — e o
 * efeito no banco e afirmado pela consulta que sai, nao por um banco de mentira,
 * porque o criterio de paridade desta area e *"efeito no banco"* com tolerancia
 * zero (Decisao 2 de `parity_specs.md`).
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  criarRepositorioDeContas,
  type RepositorioDeContas,
} from '../armazenamento/conta.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { Conta as ContaDaLeitura } from '../conta/leitura-de-conta.js';
import type { LinhaDeResultado, MensagemDeEmail } from '../portas/index.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  COMPRIMENTO_MAXIMO_DE_SENHA,
} from '../autenticacao/verificacao-de-senha.js';
import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';
import {
  conferirChaveDeRedefinicao,
  lerChaveGravada,
  PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA,
  valorGravadoDaChave,
  type GeradorDeChaveDeRedefinicao,
  type HashDeChaveDeRedefinicao,
} from './chave-de-redefinicao.js';
import {
  contasParaRedefinicaoDoRepositorio,
  type ContaNaRedefinicao,
  type ContasParaRedefinicao,
} from './contas-para-redefinicao.js';
import type {
  ContextoDaRedefinicaoDeSenha,
  ContextoDoPedidoDeRedefinicao,
  GanchosDaRedefinicao,
  GanchosDoPedido,
  MontagemDoEmailDeRedefinicao,
} from './contexto-de-redefinicao.js';
import {
  criarGeracaoDeHashDeSenhaDoNucleo,
  HASH_DE_SENHA_RECUSADA,
} from './geracao-de-hash-de-senha.js';
import {
  DESTINO_POR_CODIGO_DE_CHAVE,
  MENSAGENS_DA_TELA_DE_PEDIDO,
  MENSAGENS_DA_TELA_DE_REDEFINICAO,
  MENSAGENS_DO_PEDIDO,
  primeiroCodigoDeErroDeRedefinicao,
} from './erro-de-redefinicao.js';
import { solicitarRedefinicaoDeSenha } from './pedido-de-redefinicao.js';
import { redefinirSenha } from './redefinir-senha.js';

const AGORA = 1_700_000_000;
const PRAZO = PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA;

/**
 * O resumo da chave, de teste.
 *
 * A primitiva real e borda e o pacote nao nomeia o algoritmo (ver
 * `chave-de-redefinicao.ts`). O que esta suite precisa afirmar e o que e
 * **deste** modulo: que o que vai para a coluna e o resumo, e nunca a chave.
 *
 * Por isso o simulado **resume de verdade**: um simulado que devolvesse a chave
 * decorada passaria no teste de formato e esconderia justamente o que CA-4.1
 * cobra.
 */
function resumoDe(chave: string): string {
  // Sem dois-pontos no resumo, de proposito: o separador do instante e ele, e um
  // resumo que o contivesse seria lido como se trouxesse instante prefixado.
  return `resumo-${createHash('sha256').update(chave, 'utf8').digest('hex')}`;
}

const HASH_DA_CHAVE: HashDeChaveDeRedefinicao = {
  gerar(chave) {
    return resumoDe(chave);
  },
  conferir(chave, resumo) {
    return resumo === resumoDe(chave);
  },
};

/** Um bcrypt de teste, nas duas pontas: gravar e conferir. */
const BCRYPT_DE_TESTE = {
  gerar(senhaPreProcessada: string): string {
    return `bcrypt(${senhaPreProcessada})`;
  },
  verificar(senhaPreProcessada: string, hash: string): boolean {
    return hash === `bcrypt(${senhaPreProcessada})`;
  },
};

function geradorFixo(...chaves: readonly string[]): GeradorDeChaveDeRedefinicao {
  const restantes = [...chaves];
  return {
    gerar() {
      return restantes.shift() ?? chaves[chaves.length - 1] ?? '';
    },
  };
}

/** A linha de `users` como o banco a devolve, nas colunas que T002 seleciona. */
function linhaDeConta(parcial: {
  id?: number;
  login?: string;
  email?: string;
  chaveDeAtivacao?: string;
}): LinhaDeResultado {
  return {
    ID: parcial.id ?? 7,
    user_login: parcial.login ?? 'ada',
    user_pass: '$wpbcrypt(antiga)',
    user_nicename: 'ada',
    user_email: parcial.email ?? 'ada@exemplo.invalido',
    user_url: '',
    user_registered: '2026-01-01 00:00:00',
    user_activation_key: parcial.chaveDeAtivacao ?? '',
    user_status: 0,
    display_name: 'Ada',
  };
}

interface Montagem {
  readonly falsa: PortaDeDadosFalsa;
  readonly repositorio: RepositorioDeContas;
  readonly contas: ContasParaRedefinicao;
  readonly enviadas: MensagemDeEmail[];
  readonly passos: string[];
  relogio: number;
  envioFalha: string | null;
  pedido(ganchos?: GanchosDoPedido, prazo?: number): ContextoDoPedidoDeRedefinicao;
  redefinicao(
    ganchos?: GanchosDaRedefinicao,
    prazo?: number,
  ): ContextoDaRedefinicaoDeSenha;
}

function montar(...chaves: readonly string[]): Montagem {
  const falsa = criarPortaDeDadosFalsa();
  const repositorio = criarRepositorioDeContas(falsa.porta, 'site-unico');
  const contas = contasParaRedefinicaoDoRepositorio(repositorio);
  const enviadas: MensagemDeEmail[] = [];
  const passos: string[] = [];
  const gerador = geradorFixo(...(chaves.length === 0 ? ['chave-1'] : chaves));

  const montagem: Montagem = {
    falsa,
    repositorio,
    contas,
    enviadas,
    passos,
    relogio: AGORA,
    envioFalha: null,

    pedido(ganchos, prazo) {
      return {
        relogio: { agoraEmSegundos: () => montagem.relogio },
        contas,
        email: {
          enviar(mensagem) {
            passos.push('enviar');
            enviadas.push(mensagem);
            return montagem.envioFalha === null
              ? { enviado: true }
              : { enviado: false, motivo: montagem.envioFalha };
          },
        },
        gerador,
        hashDaChave: HASH_DA_CHAVE,
        montagemDoEmail: MONTAGEM_DE_TESTE,
        ...(prazo === undefined ? {} : { prazoDaChave: prazo }),
        ...(ganchos === undefined ? {} : { ganchos }),
      };
    },

    redefinicao(ganchos, prazo) {
      return {
        relogio: { agoraEmSegundos: () => montagem.relogio },
        contas,
        hashDaChave: HASH_DA_CHAVE,
        hashDeSenha: criarGeracaoDeHashDeSenhaDoNucleo(BCRYPT_DE_TESTE),
        ...(prazo === undefined ? {} : { prazoDaChave: prazo }),
        ...(ganchos === undefined ? {} : { ganchos }),
      };
    },
  };

  return montagem;
}

/**
 * A montagem do e-mail, de teste.
 *
 * Os literais do e-mail **nao estao no pacote** (ver
 * `MontagemDoEmailDeRedefinicao`), logo o que esta suite afirma e a unica coisa
 * que e do dominio: que a chave em claro chega aqui, e so aqui.
 */
const MONTAGEM_DE_TESTE: MontagemDoEmailDeRedefinicao = {
  montar({ conta, chaveEmClaro }) {
    return {
      destinatarios: [conta.email],
      assunto: 'assunto de teste',
      corpo: `link com ${chaveEmClaro}`,
      cabecalhos: [],
      anexos: [],
    };
  },
};

function textoDoParametro(valor: unknown): string {
  return valor instanceof Uint8Array
    ? new TextDecoder().decode(valor)
    : String(valor);
}

/* ─────────────────────────── CA-4.1 ─────────────────────────── */

test('CA-4.1: a chave vai para a conta com hash, e em claro so para o e-mail', () => {
  const montagem = montar('chave-em-claro-1');
  montagem.falsa.responder([linhaDeConta({ login: 'ada' })]);

  const resultado = solicitarRedefinicaoDeSenha(
    { identificador: 'ada' },
    montagem.pedido(),
  );

  assert.equal(resultado.aceito, true);

  // Uma escrita, e e a da coluna da chave.
  assert.equal(montagem.falsa.escritas.length, 1);
  const escrita = montagem.falsa.escritas[0];
  assert.ok(escrita !== undefined);
  assert.equal(
    escrita.texto,
    'UPDATE wp_users SET user_activation_key = ? WHERE ID = ?',
  );

  const gravado = textoDoParametro(escrita.parametros[0]);
  // O instante prefixado, e o resumo — nunca a chave.
  assert.equal(gravado, `${AGORA}:${resumoDe('chave-em-claro-1')}`);
  assert.ok(!gravado.includes('chave-em-claro-1'));

  // A chave em claro existe no e-mail enviado, e la ela e o link.
  assert.equal(montagem.enviadas.length, 1);
  assert.match(String(montagem.enviadas[0]?.corpo), /chave-em-claro-1/);
  assert.deepEqual(montagem.enviadas[0]?.destinatarios, [
    'ada@exemplo.invalido',
  ]);

  // E o resultado devolvido a quem pediu NAO tem onde guardar a chave.
  assert.ok(!JSON.stringify(resultado).includes('chave-em-claro-1'));
});

test('CA-4.1: o instante gravado e o do relogio, nao o do sistema (P4)', () => {
  const montagem = montar('k');
  montagem.relogio = AGORA + 999;
  montagem.falsa.responder([linhaDeConta({})]);

  solicitarRedefinicaoDeSenha({ identificador: 'ada' }, montagem.pedido());

  const gravado = textoDoParametro(
    montagem.falsa.escritas[0]?.parametros[0],
  );
  assert.equal(lerChaveGravada(gravado)?.instanteDoPedido, AGORA + 999);
});

/* ─────────────────────────── CA-4.2 e o P6 ─────────────────────────── */

test('CA-4.2: chave com mais de 24 horas e recusada com aviso de prazo e oferta de pedir outra', () => {
  const montagem = montar();
  montagem.relogio = AGORA + PRAZO + 1;
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: valorGravadoDaChave(AGORA, resumoDe('k')) }),
  ]);

  const resultado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova-senha' },
    montagem.redefinicao(),
  );

  assert.equal(resultado.redefinida, false);
  assert.ok(resultado.redefinida === false);
  assert.equal(resultado.motivo, 'chave-recusada');
  assert.ok(resultado.motivo === 'chave-recusada');
  assert.equal(resultado.codigo, 'expired_key');
  assert.equal(
    resultado.erro.itens[0]?.mensagem,
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveVencida,
  );
  // A oferta de pedir outra esta na propria mensagem, e o destino e o
  // formulario de pedido.
  assert.match(
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveVencida,
    /Please request a new link below\.$/,
  );
  assert.equal(
    DESTINO_POR_CODIGO_DE_CHAVE.expired_key,
    'wp-login.php?action=lostpassword&error=expiredkey',
  );

  // Recusada a chave, nada e gravado.
  assert.deepEqual(montagem.falsa.escritas, []);
});

test('P6: o prazo de fabrica e 24 horas, e a borda aceita no ultimo instante e recusa no seguinte', () => {
  assert.equal(PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA, 24 * SEGUNDOS_POR_HORA);
  assert.equal(PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA, 86_400);

  const conferir = (agoraEmSegundos: number) =>
    conferirChaveDeRedefinicao({
      chaveEmClaro: 'k',
      valorGravado: valorGravadoDaChave(AGORA, resumoDe('k')),
      agoraEmSegundos,
      hash: HASH_DA_CHAVE,
    });

  assert.equal(conferir(AGORA).valida, true);
  assert.equal(conferir(AGORA + PRAZO - 1).valida, true);

  const depois = conferir(AGORA + PRAZO);
  assert.equal(depois.valida, false);
  assert.equal(depois.valida === false ? depois.codigo : null, 'expired_key');
});

test('P6: o prazo e filtravel, e a borda anda com ele (ESC-FILTRAVEL)', () => {
  const prazo = 2 * SEGUNDOS_POR_HORA;
  const conferir = (agoraEmSegundos: number) =>
    conferirChaveDeRedefinicao({
      chaveEmClaro: 'k',
      valorGravado: valorGravadoDaChave(AGORA, resumoDe('k')),
      agoraEmSegundos,
      hash: HASH_DA_CHAVE,
      prazo,
    });

  assert.equal(conferir(AGORA + prazo - 1).valida, true);
  assert.equal(conferir(AGORA + prazo).valida, false);
  // E o valor de fabrica continua sendo o de fabrica: o filtro nao o reescreve.
  assert.equal(PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA, 24 * SEGUNDOS_POR_HORA);
});

/* ─────────────────────────── CA-4.3 ─────────────────────────── */

test('CA-4.3: um pedido novo antes do prazo substitui a chave anterior, que deixa de valer', () => {
  const montagem = montar('primeira', 'segunda');
  montagem.falsa.responder([linhaDeConta({})]);
  solicitarRedefinicaoDeSenha({ identificador: 'ada' }, montagem.pedido());

  // Dentro do prazo, um segundo pedido.
  montagem.relogio = AGORA + SEGUNDOS_POR_HORA;
  montagem.falsa.responder([
    linhaDeConta({
      chaveDeAtivacao: `${AGORA}:${resumoDe('primeira')}`,
    }),
  ]);
  solicitarRedefinicaoDeSenha({ identificador: 'ada' }, montagem.pedido());

  assert.equal(montagem.falsa.escritas.length, 2);
  const gravadoAgora = textoDoParametro(
    montagem.falsa.escritas[1]?.parametros[0],
  );
  assert.equal(gravadoAgora, `${AGORA + SEGUNDOS_POR_HORA}:${resumoDe('segunda')}`);

  // A chave anterior nao confere mais contra o que esta gravado, e nada
  // precisou revoga-la: a coluna e uma so.
  const anterior = conferirChaveDeRedefinicao({
    chaveEmClaro: 'primeira',
    valorGravado: gravadoAgora,
    agoraEmSegundos: montagem.relogio,
    hash: HASH_DA_CHAVE,
  });
  assert.equal(anterior.valida, false);
  assert.equal(
    anterior.valida === false ? anterior.codigo : null,
    'invalid_key',
  );

  // E a nova vale.
  assert.equal(
    conferirChaveDeRedefinicao({
      chaveEmClaro: 'segunda',
      valorGravado: gravadoAgora,
      agoraEmSegundos: montagem.relogio,
      hash: HASH_DA_CHAVE,
    }).valida,
    true,
  );
});

/* ─────────────────────────── CA-4.4 ─────────────────────────── */

test('CA-4.4: gravar a senha nova invalida a chave usada, no mesmo comando', () => {
  const montagem = montar();
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: valorGravadoDaChave(AGORA, resumoDe('k')) }),
  ]);

  const resultado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova', confirmacaoDaSenha: 'nova' },
    montagem.redefinicao(),
  );

  assert.equal(resultado.redefinida, true);
  assert.equal(
    resultado.redefinida === true ? resultado.mensagem : null,
    MENSAGENS_DA_TELA_DE_REDEFINICAO.senhaRedefinida,
  );

  // UM comando, DUAS colunas: a senha nova e a sentinela vazia na chave.
  assert.equal(montagem.falsa.escritas.length, 1);
  const escrita = montagem.falsa.escritas[0];
  assert.ok(escrita !== undefined);
  assert.equal(
    escrita.texto,
    'UPDATE wp_users SET user_pass = ?, user_activation_key = ? WHERE ID = ?',
  );
  assert.equal(
    textoDoParametro(escrita.parametros[0]),
    `$wpbcrypt(${preProcessarSenhaParaBcrypt('nova')})`,
  );
  assert.equal(textoDoParametro(escrita.parametros[1]), '');
  assert.equal(textoDoParametro(escrita.parametros[2]), '7');
});

test('CA-4.4: a mesma chave, apresentada de novo depois da gravacao, cai no erro generico', () => {
  const montagem = montar();
  // A coluna depois da gravacao: a sentinela vazia.
  montagem.falsa.responder([linhaDeConta({ chaveDeAtivacao: '' })]);

  const resultado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'outra' },
    montagem.redefinicao(),
  );

  assert.ok(resultado.redefinida === false);
  assert.ok(resultado.motivo === 'chave-recusada');
  // `plan.md` lista "chave ja usada" como erro proprio; o legado nao lhe da
  // codigo proprio, porque o que sobrou da chave usada e a sentinela vazia.
  assert.equal(resultado.codigo, 'invalid_key');
  assert.deepEqual(montagem.falsa.escritas, []);
});

/* ─────────────────────────── CA-4.5 ─────────────────────────── */

test('CA-4.5: os quatro caminhos de chave invalida devolvem o MESMO erro generico', () => {
  const casos: readonly { nome: string; linha: LinhaDeResultado[]; chave: string }[] =
    [
      {
        nome: 'chave vazia',
        linha: [linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` })],
        chave: '',
      },
      { nome: 'conta inexistente', linha: [], chave: 'k' },
      {
        nome: 'chave que nao confere',
        linha: [linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('outra')}` })],
        chave: 'k',
      },
      {
        nome: 'chave ja usada',
        linha: [linhaDeConta({ chaveDeAtivacao: '' })],
        chave: 'k',
      },
    ];

  for (const caso of casos) {
    const montagem = montar();
    montagem.falsa.responder(caso.linha);

    const resultado = redefinirSenha(
      { login: 'ada', chave: caso.chave, senhaNova: 'nova' },
      montagem.redefinicao(),
    );

    assert.ok(resultado.redefinida === false, caso.nome);
    assert.ok(resultado.motivo === 'chave-recusada', caso.nome);
    assert.equal(resultado.codigo, 'invalid_key', caso.nome);
    assert.equal(
      resultado.erro.itens[0]?.mensagem,
      MENSAGENS_DA_TELA_DE_PEDIDO.chaveInvalida,
      caso.nome,
    );
    // E o erro generico e generico: ele nao diz qual dos quatro casos foi.
    assert.ok(
      !MENSAGENS_DA_TELA_DE_PEDIDO.chaveInvalida.includes('ada'),
      caso.nome,
    );
  }

  assert.equal(
    DESTINO_POR_CODIGO_DE_CHAVE.invalid_key,
    'wp-login.php?action=lostpassword&error=invalidkey',
  );
});

/* ─────────── o que a implementacao quebraria em silencio ─────────── */

test('ESC-SESSAO: redefinir a senha nao toca em sessao nenhuma (pos-condicao de UC-20)', () => {
  const montagem = montar();
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);

  redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova', confirmacaoDaSenha: 'nova' },
    montagem.redefinicao(),
  );

  // Nenhum comando sai para `usermeta`, que e onde o arranjo de tokens mora
  // (`CHAVE_DE_TOKENS_DE_SESSAO`). REQ-008 pediria o contrario e esta
  // bloqueado; a resposta 7 manda preservar.
  const consultas = [...montagem.falsa.selecoes, ...montagem.falsa.escritas];
  for (const consulta of consultas) {
    assert.ok(!consulta.texto.includes('usermeta'), consulta.texto);
  }
  assert.equal(montagem.falsa.escritas.length, 1);
});

test('P4: nenhuma das duas operacoes consulta capacidade ou papel', () => {
  const montagem = montar();
  montagem.falsa.responder([linhaDeConta({})]);
  solicitarRedefinicaoDeSenha({ identificador: 'ada' }, montagem.pedido());

  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('chave-1')}` }),
  ]);
  redefinirSenha(
    {
      login: 'ada',
      chave: 'chave-1',
      senhaNova: 'nova',
      confirmacaoDaSenha: 'nova',
    },
    montagem.redefinicao(),
  );

  const consultas = [...montagem.falsa.selecoes, ...montagem.falsa.escritas];
  assert.ok(consultas.length > 0);
  for (const consulta of consultas) {
    assert.ok(!consulta.texto.includes('capabilities'), consulta.texto);
    assert.ok(!consulta.texto.includes('user_roles'), consulta.texto);
    assert.ok(!consulta.texto.includes('options'), consulta.texto);
  }
});

test('P2: a ordem dos pontos de extensao do pedido e a do fluxo', () => {
  const montagem = montar('k');
  const ganchos: GanchosDoPedido = {
    aoPedirRedefinicao: () => montagem.passos.push('aoPedirRedefinicao'),
    permitirRedefinicao: () => {
      montagem.passos.push('permitirRedefinicao');
      return true;
    },
    aoGerarChave: () => montagem.passos.push('aoGerarChave'),
  };
  montagem.falsa.responder([linhaDeConta({})]);

  solicitarRedefinicaoDeSenha(
    { identificador: 'ada' },
    montagem.pedido(ganchos),
  );

  assert.deepEqual(montagem.passos, [
    'aoPedirRedefinicao',
    'permitirRedefinicao',
    // A chave chega ao ponto de extensao ANTES de ser gravada, como no legado.
    'aoGerarChave',
    'enviar',
  ]);
});

test('P2: o ponto de extensao que recusa a redefinicao impede gravacao e envio', () => {
  const montagem = montar();
  montagem.falsa.responder([linhaDeConta({})]);

  const resultado = solicitarRedefinicaoDeSenha(
    { identificador: 'ada' },
    montagem.pedido({ permitirRedefinicao: () => false }),
  );

  assert.equal(resultado.aceito, false);
  assert.equal(
    resultado.aceito === false
      ? primeiroCodigoDeErroDeRedefinicao(resultado.erro)
      : null,
    'no_password_reset',
  );
  assert.deepEqual(montagem.falsa.escritas, []);
  assert.deepEqual(montagem.enviadas, []);
});

test('P2: a ordem dos pontos de extensao da gravacao, e o de validacao pode recusar', () => {
  const montagem = montar();
  const passos: string[] = [];
  const ganchos: GanchosDaRedefinicao = {
    validarRedefinicao: (erros) => {
      passos.push('validarRedefinicao');
      return erros;
    },
    antesDeRedefinir: () => passos.push('antesDeRedefinir'),
    aoGravarSenha: () => passos.push('aoGravarSenha'),
    aposRedefinir: () => passos.push('aposRedefinir'),
  };
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);

  redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova', confirmacaoDaSenha: 'nova' },
    montagem.redefinicao(ganchos),
  );

  assert.deepEqual(passos, [
    'validarRedefinicao',
    'antesDeRedefinir',
    'aoGravarSenha',
    'aposRedefinir',
  ]);

  // E o ponto de validacao SOMA erro, que e o que o torna um ponto de filtro.
  const outra = montar();
  outra.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);
  const recusado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova', confirmacaoDaSenha: 'nova' },
    outra.redefinicao({
      validarRedefinicao: (erros) => [
        ...erros,
        { codigo: 'password_reset_mismatch', mensagem: 'de uma extensao' },
      ],
    }),
  );
  assert.ok(recusado.redefinida === false);
  assert.equal(recusado.motivo, 'senha-recusada');
  assert.deepEqual(outra.falsa.escritas, []);
});

test('a busca do pedido: arroba depois da primeira posicao procura e-mail e depois login', () => {
  // Por e-mail, achando de primeira.
  const porEmail = montar();
  porEmail.falsa.responder([linhaDeConta({ email: 'ada@exemplo.invalido' })]);
  assert.equal(
    solicitarRedefinicaoDeSenha(
      { identificador: 'ada@exemplo.invalido' },
      porEmail.pedido(),
    ).aceito,
    true,
  );
  assert.equal(porEmail.falsa.selecoes.length, 1);
  assert.match(String(porEmail.falsa.selecoes[0]?.texto), /user_email = \?/);

  // Por e-mail, nao achando: o legado tenta o login tambem.
  const depoisPorLogin = montar();
  depoisPorLogin.falsa.responder([]);
  depoisPorLogin.falsa.responder([linhaDeConta({ login: 'a@b.invalido' })]);
  assert.equal(
    solicitarRedefinicaoDeSenha(
      { identificador: 'a@b.invalido' },
      depoisPorLogin.pedido(),
    ).aceito,
    true,
  );
  assert.equal(depoisPorLogin.falsa.selecoes.length, 2);
  assert.match(
    String(depoisPorLogin.falsa.selecoes[1]?.texto),
    /user_login = \?/,
  );

  // Arroba na PRIMEIRA posicao nao conta: e login, e so login.
  const arrobaNaFrente = montar();
  arrobaNaFrente.falsa.responder([linhaDeConta({ login: '@ada' })]);
  assert.equal(
    solicitarRedefinicaoDeSenha(
      { identificador: '@ada' },
      arrobaNaFrente.pedido(),
    ).aceito,
    true,
  );
  assert.equal(arrobaNaFrente.falsa.selecoes.length, 1);
  assert.match(
    String(arrobaNaFrente.falsa.selecoes[0]?.texto),
    /user_login = \?/,
  );
});

test('ESC-ENUMERACAO: conta inexistente e recusada com codigo distinto e mensagem igual', () => {
  const comArroba = montar();
  comArroba.falsa.responder([]);
  comArroba.falsa.responder([]);
  const peloEmail = solicitarRedefinicaoDeSenha(
    { identificador: 'ninguem@exemplo.invalido' },
    comArroba.pedido(),
  );

  const semArroba = montar();
  semArroba.falsa.responder([]);
  const peloLogin = solicitarRedefinicaoDeSenha(
    { identificador: 'ninguem' },
    semArroba.pedido(),
  );

  assert.ok(peloEmail.aceito === false && peloLogin.aceito === false);
  assert.equal(
    primeiroCodigoDeErroDeRedefinicao(peloEmail.erro),
    'invalid_email',
  );
  assert.equal(
    primeiroCodigoDeErroDeRedefinicao(peloLogin.erro),
    'invalidcombo',
  );
  // Codigos diferentes, MESMA mensagem — como no legado.
  assert.equal(
    peloEmail.erro.itens[0]?.mensagem,
    peloLogin.erro.itens[0]?.mensagem,
  );
  // E nada e gravado nem enviado.
  assert.deepEqual(comArroba.falsa.escritas, []);
  assert.deepEqual(semArroba.enviadas, []);
});

test('identificador vazio e recusado antes de qualquer consulta', () => {
  const montagem = montar();

  const resultado = solicitarRedefinicaoDeSenha(
    { identificador: '   ' },
    montagem.pedido(),
  );

  assert.ok(resultado.aceito === false);
  assert.equal(
    primeiroCodigoDeErroDeRedefinicao(resultado.erro),
    'empty_username',
  );
  assert.equal(
    resultado.erro.itens[0]?.mensagem,
    MENSAGENS_DO_PEDIDO.empty_username,
  );
  assert.deepEqual(montagem.falsa.selecoes, []);
  assert.deepEqual(montagem.falsa.escritas, []);
});

test('as duas recusas de senha do legado, e nenhuma a mais', () => {
  // So espaco.
  const soEspaco = montar();
  soEspaco.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);
  const comEspaco = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: '   ' },
    soEspaco.redefinicao(),
  );
  assert.ok(comEspaco.redefinida === false);
  assert.equal(comEspaco.motivo, 'senha-recusada');
  assert.ok(comEspaco.motivo === 'senha-recusada');
  assert.equal(
    comEspaco.erro.itens[0]?.codigo,
    'password_reset_empty_space',
  );
  assert.equal(
    comEspaco.erro.itens[0]?.mensagem,
    MENSAGENS_DA_TELA_DE_REDEFINICAO.password_reset_empty_space,
  );
  assert.deepEqual(soEspaco.falsa.escritas, []);

  // Senhas diferentes.
  const diferentes = montar();
  diferentes.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);
  const semConferir = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'uma', confirmacaoDaSenha: 'outra' },
    diferentes.redefinicao(),
  );
  assert.ok(semConferir.redefinida === false);
  assert.ok(semConferir.motivo === 'senha-recusada');
  assert.equal(
    semConferir.erro.itens[0]?.codigo,
    'password_reset_mismatch',
  );
  assert.deepEqual(diferentes.falsa.escritas, []);

  // Senha fraca NAO e recusada: o campo `pw_weak` da tela existe para
  // confirma-la, e endurecer aqui fecharia o sistema mais que o legado.
  const fraca = montar();
  fraca.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);
  assert.equal(
    redefinirSenha(
      { login: 'ada', chave: 'k', senhaNova: 'a', confirmacaoDaSenha: 'a' },
      fraca.redefinicao(),
    ).redefinida,
    true,
  );
});

test('campo de confirmacao ausente conta como vazio, e recusa como no legado', () => {
  const montagem = montar();
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);

  const resultado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: 'nova' },
    montagem.redefinicao(),
  );

  assert.ok(resultado.redefinida === false);
  assert.ok(resultado.motivo === 'senha-recusada');
  assert.equal(resultado.erro.itens[0]?.codigo, 'password_reset_mismatch');
  assert.deepEqual(montagem.falsa.escritas, []);
});

test('a senha gravada e a sem espaco nas pontas, e a confirmacao e comparada igual', () => {
  const montagem = montar();
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);

  const resultado = redefinirSenha(
    {
      login: 'ada',
      chave: 'k',
      senhaNova: '  segredo  ',
      confirmacaoDaSenha: ' segredo ',
    },
    montagem.redefinicao(),
  );

  assert.equal(resultado.redefinida, true);
  assert.equal(
    textoDoParametro(montagem.falsa.escritas[0]?.parametros[0]),
    `$wpbcrypt(${preProcessarSenhaParaBcrypt('segredo')})`,
  );
});

test('chave boa e campo de senha vazio: formulario de novo, sem erro e sem escrita', () => {
  const montagem = montar();
  montagem.falsa.responder([
    linhaDeConta({ chaveDeAtivacao: `${AGORA}:${resumoDe('k')}` }),
  ]);

  const resultado = redefinirSenha(
    { login: 'ada', chave: 'k', senhaNova: '' },
    montagem.redefinicao(),
  );

  assert.ok(resultado.redefinida === false);
  assert.equal(resultado.motivo, 'senha-nao-informada');
  assert.deepEqual(montagem.falsa.escritas, []);
});

test('D3: a falha de envio volta como valor, sem lancar, e a chave fica gravada', () => {
  const montagem = montar('k');
  montagem.envioFalha = 'transporte indisponivel';
  montagem.falsa.responder([linhaDeConta({})]);

  const resultado = solicitarRedefinicaoDeSenha(
    { identificador: 'ada' },
    montagem.pedido(),
  );

  // O pedido foi aceito e a chave esta gravada: a falha de envio nao desfaz
  // nada, porque no legado nao ha transacao nenhuma a desfazer.
  assert.equal(resultado.aceito, true);
  assert.ok(resultado.aceito === true);
  assert.equal(resultado.envio.enviado, false);
  assert.equal(
    resultado.envio.enviado === false ? resultado.envio.motivo : null,
    'transporte indisponivel',
  );
  assert.equal(montagem.falsa.escritas.length, 1);

  // E NADA aqui registra a falha: o aviso distinto e o registro com instante,
  // destinatario e motivo sao US-5 / T011, e a excecao de UC-20 e literal —
  // "nenhum estado registra a falha de envio neste fluxo".
});

test('o hash gravado confere com o verificador de T003 (risco 3 do plan.md)', () => {
  const geracao = criarGeracaoDeHashDeSenhaDoNucleo(BCRYPT_DE_TESTE);
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_TESTE,
  });

  const hash = geracao.gerar('segredo');

  assert.ok(hash.startsWith('$wp'));
  assert.equal(verificador.verificar('segredo', hash), true);
  assert.equal(verificador.verificar('outra', hash), false);
});

test('senha acima do teto gera valor que nao confere com senha nenhuma', () => {
  const geracao = criarGeracaoDeHashDeSenhaDoNucleo(BCRYPT_DE_TESTE);
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_TESTE,
  });
  const enorme = 'a'.repeat(COMPRIMENTO_MAXIMO_DE_SENHA + 1);

  const hash = geracao.gerar(enorme);

  assert.equal(hash, HASH_DE_SENHA_RECUSADA);
  // A unica propriedade de que o dominio depende, e a razao de a recusa existir
  // nas duas pontas: o teto de T003 recusa sem conferir, logo gravar um hash
  // valido acima do teto trancaria a conta num caminho em que o legado nao a
  // tranca.
  assert.equal(verificador.verificar(enorme, hash), false);
  assert.equal(verificador.verificar('', hash), false);
});

test('chave gravada sem o instante prefixado e recusada como vencida', () => {
  // Ramo declarado e NAO alcancavel em instalacao nova (`plan.md`: nada vem do
  // sistema velho). Esta aqui porque o P8 nao deixa nada sair da superficie.
  const comResumo = conferirChaveDeRedefinicao({
    chaveEmClaro: 'k',
    valorGravado: resumoDe('k'),
    agoraEmSegundos: AGORA,
    hash: HASH_DA_CHAVE,
  });
  assert.equal(comResumo.valida, false);
  assert.equal(
    comResumo.valida === false ? comResumo.codigo : null,
    'expired_key',
  );

  // E a chave gravada em claro, igual a apresentada, tambem vence.
  const emClaro = conferirChaveDeRedefinicao({
    chaveEmClaro: 'k',
    valorGravado: 'k',
    agoraEmSegundos: AGORA,
    hash: HASH_DA_CHAVE,
  });
  assert.equal(
    emClaro.valida === false ? emClaro.codigo : null,
    'expired_key',
  );
});

test('as DUAS `Conta` da arvore satisfazem a fatia, e nenhuma terceira foi criada', () => {
  // O conflito das duas representacoes esta registrado em `index.ts` e nao e
  // desta tarefa resolver. O que esta afirmado aqui e que T009 nao o agravou: a
  // fatia tem quatro campos e as duas entram nela **sem adaptador**.
  const montagem = montar();
  montagem.falsa.responder([linhaDeConta({})]);

  // A `Conta` de T002, vinda do repositorio, e aceita como fatia.
  const doArmazenamento: ContaNaRedefinicao | null =
    montagem.contas.porLogin('ada');
  assert.ok(doArmazenamento !== null);
  assert.equal(doArmazenamento.login, 'ada');
  assert.equal(doArmazenamento.email, 'ada@exemplo.invalido');

  // A `Conta` de T003 tambem.
  const daLeitura: ContaDaLeitura = {
    id: 9,
    login: 'grace',
    senhaHash: '$wpbcrypt(x)',
    email: 'grace@exemplo.invalido',
    apelido: 'grace',
    nomeExibido: 'Grace',
    chaveDeAtivacao: '',
  };
  const comoFatia: ContaNaRedefinicao = daLeitura;
  assert.equal(comoFatia.chaveDeAtivacao, '');
});
