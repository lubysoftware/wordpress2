/**
 * A entrega de T005: *"o comportamento de US-2 existe e os critérios CA-2.1,
 * CA-2.2, CA-2.3 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-2.** Esses sao T006, que pede 3 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-002-1, UT-002-2, UT-002-3),
 * *"com o mesmo dado de entrada, acao e resultado esperado"* — e esse catalogo
 * **nao esta nesta arvore** (`backlog/tests.md` nao existe aqui). Esta suite
 * afirma os tres critérios, a ordem dos passos da saida, que e contrato (P2), e
 * as regras do legado que a implementacao poderia quebrar em silencio: o acumulo
 * de `ESC-SESSAO`, as duas operacoes sem chamador de BR-MIGRAR-111 e a diferenca
 * de efeito no banco entre sair sem token e sair com token desconhecido.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  encerrarOutrasSessoes,
  encerrarSessao,
  encerrarTodasAsSessoes,
  sessaoDoToken,
  sessaoEstaAberta,
} from './encerramento-de-sessao.js';
import {
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
  type Sessao,
} from './registro-de-sessoes.js';
import { sair, type ContextoDeSaida } from './saida.js';

const AGORA = 1_700_000_000;
const DOIS_DIAS = 2 * 86_400;

const CONTA = 7;

/** Os tokens em claro desta suite. O resumo e que vira chave do mapa. */
const DESTE_DISPOSITIVO = 'token-deste-dispositivo';
const DO_OUTRO_DISPOSITIVO = 'token-do-outro-dispositivo';
const DE_UM_TERCEIRO = 'token-de-um-terceiro';

function sessao(abertaEm: number, endereco: string): Sessao {
  return { expiraEm: abertaEm + DOIS_DIAS, abertaEm, endereco };
}

interface Armazem {
  readonly sessoes: ArmazenamentoDeSessoes;
  /** Todo mapa que chegou a `gravar`, na ordem. Mede o efeito no banco. */
  readonly gravacoes: MapaDeSessoes[];
  mapa(): MapaDeSessoes;
}

function armazemCom(inicial: MapaDeSessoes): Armazem {
  let atual: MapaDeSessoes = inicial;
  const gravacoes: MapaDeSessoes[] = [];

  return {
    sessoes: {
      ler() {
        return atual;
      },
      gravar(_idDaConta, mapa) {
        gravacoes.push(mapa);
        atual = mapa;
      },
    },
    gravacoes,
    mapa() {
      return atual;
    },
  };
}

/** Os dois dispositivos de US-2: este, e o que nao pode cair. */
function doisDispositivos(): Armazem {
  return armazemCom({
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
    [resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO)]: sessao(
      AGORA - 60,
      '203.0.113.2',
    ),
  });
}

interface Montagem {
  readonly contexto: ContextoDeSaida;
  readonly armazem: Armazem;
  /** A ordem em que os passos aconteceram. A ordem e contrato (P2). */
  readonly passos: string[];
  /** O id que cada limpeza de credencial recebeu. */
  readonly limpezas: number[];
  identidadeCorrente(): number;
}

function montar(
  armazem: Armazem,
  token: string = DESTE_DISPOSITIVO,
  idDaConta: number = CONTA,
): Montagem {
  const passos: string[] = [];
  const limpezas: number[] = [];
  let corrente = idDaConta;

  const contexto: ContextoDeSaida = {
    sessoes: {
      ler(id) {
        return armazem.sessoes.ler(id);
      },
      gravar(id, mapa) {
        passos.push('encerrou-sessao');
        armazem.sessoes.gravar(id, mapa);
      },
    },
    identidade: {
      idDaConta,
      tokenDaSessao: token,
      tornarAnonima() {
        passos.push('identidade-anonima');
        corrente = 0;
      },
    },
    credenciaisDoNavegador: {
      limpar(id) {
        passos.push('limpou-credencial');
        limpezas.push(id);
      },
    },
    ganchos: {
      aoLimparCredencialDoNavegador: () => passos.push('gancho-limpeza'),
      aoSair: (id) => passos.push(`gancho-saida:${id}`),
    },
  };

  return {
    contexto,
    armazem,
    passos,
    limpezas,
    identidadeCorrente: () => corrente,
  };
}

// ---------------------------------------------------------------------------
// CA-2.1 — sair destroi apenas o token da sessao corrente e limpa a credencial
// ---------------------------------------------------------------------------

test('CA-2.1 sair destroi apenas o token da sessao corrente', () => {
  const { contexto, armazem } = montar(doisDispositivos());

  const resultado = sair(contexto);

  assert.equal(resultado.sessaoEncerrada, true);
  assert.equal(resultado.idDaConta, CONTA);
  assert.equal(resultado.motivo, undefined);

  // O mapa gravado tem exatamente a outra sessao: uma entrada saiu, uma ficou.
  assert.deepEqual(Object.keys(armazem.mapa()), [
    resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO),
  ]);
});

test('CA-2.1 sair limpa a credencial guardada no navegador', () => {
  const { contexto, limpezas } = montar(doisDispositivos());

  const resultado = sair(contexto);

  assert.equal(resultado.credencialLimpa, true);
  assert.deepEqual(limpezas, [CONTA]);
});

test('CA-2.1 a credencial e limpa com o id de quem sai, antes de a identidade virar anonima', () => {
  const montagem = montar(doisDispositivos());

  sair(montagem.contexto);

  // Se a ordem fosse invertida, a limpeza receberia 0 — e no legado ha
  // credencial cujo nome embute o id da conta.
  assert.deepEqual(montagem.limpezas, [CONTA]);
  assert.ok(
    montagem.passos.indexOf('limpou-credencial') <
      montagem.passos.indexOf('identidade-anonima'),
  );
});

// ---------------------------------------------------------------------------
// CA-2.2 — a sessao do outro dispositivo continua autenticando
// ---------------------------------------------------------------------------

test('CA-2.2 a sessao aberta em outro dispositivo continua autenticando depois da saida', () => {
  const { contexto, armazem } = montar(doisDispositivos());

  sair(contexto);

  assert.equal(
    sessaoEstaAberta(armazem.sessoes, CONTA, DO_OUTRO_DISPOSITIVO),
    true,
  );
  // E continua sendo a MESMA sessao: a saida nao reabre nem renova nada.
  assert.deepEqual(
    sessaoDoToken(armazem.sessoes, CONTA, DO_OUTRO_DISPOSITIVO),
    sessao(AGORA - 60, '203.0.113.2'),
  );
});

test('CA-2.2 sair de um dispositivo nao encerra as outras duas sessoes da conta', () => {
  const armazem = armazemCom({
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
    [resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO)]: sessao(
      AGORA - 60,
      '203.0.113.2',
    ),
    [resumoDoTokenDeSessao(DE_UM_TERCEIRO)]: sessao(AGORA - 120, '203.0.113.3'),
  });

  sair(montar(armazem).contexto);

  assert.equal(sessaoEstaAberta(armazem.sessoes, CONTA, DO_OUTRO_DISPOSITIVO), true);
  assert.equal(sessaoEstaAberta(armazem.sessoes, CONTA, DE_UM_TERCEIRO), true);
});

// ---------------------------------------------------------------------------
// CA-2.3 — a requisicao feita com o token destruido e tratada como anonima
// ---------------------------------------------------------------------------

test('CA-2.3 o token destruido nao abre mais sessao', () => {
  const { contexto, armazem } = montar(doisDispositivos());

  sair(contexto);

  assert.equal(sessaoEstaAberta(armazem.sessoes, CONTA, DESTE_DISPOSITIVO), false);
  assert.equal(sessaoDoToken(armazem.sessoes, CONTA, DESTE_DISPOSITIVO), null);
});

test('CA-2.3 a identidade corrente vira anonima ainda nesta requisicao', () => {
  const montagem = montar(doisDispositivos());

  sair(montagem.contexto);

  // Zero e o valor do legado para identidade ausente, nao sentinela inventada.
  assert.equal(montagem.identidadeCorrente(), 0);
});

// ---------------------------------------------------------------------------
// A ordem dos passos e contrato (P2: "a ordem de disparo")
// ---------------------------------------------------------------------------

test('a saida executa os quatro passos na ordem do legado', () => {
  const montagem = montar(doisDispositivos());

  sair(montagem.contexto);

  assert.deepEqual(montagem.passos, [
    'encerrou-sessao',
    'gancho-limpeza',
    'limpou-credencial',
    'identidade-anonima',
    `gancho-saida:${CONTA}`,
  ]);
});

test('o ponto de extensao de saida recebe o id de quem saiu, depois de a identidade ja ser anonima', () => {
  const montagem = montar(doisDispositivos());

  sair(montagem.contexto);

  assert.ok(
    montagem.passos.indexOf('identidade-anonima') <
      montagem.passos.indexOf(`gancho-saida:${CONTA}`),
  );
});

test('a saida funciona sem nenhum gancho registrado (ponto sem interceptador e no-op)', () => {
  const armazem = doisDispositivos();
  const { contexto } = montar(armazem);

  // Sem a chave `ganchos`: e a forma em que o legado roda quando nenhuma
  // extensao registrou nada nos dois pontos.
  const resultado = sair({
    sessoes: contexto.sessoes,
    identidade: contexto.identidade,
    credenciaisDoNavegador: contexto.credenciaisDoNavegador,
  });

  assert.equal(resultado.sessaoEncerrada, true);
  assert.deepEqual(Object.keys(armazem.mapa()), [
    resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO),
  ]);
});

// ---------------------------------------------------------------------------
// Token inexistente — o erro que a tabela Contratos de `plan.md` declara
// ---------------------------------------------------------------------------

test('sair sem token corrente nao toca o armazenamento, e ainda limpa a credencial', () => {
  const armazem = doisDispositivos();
  const montagem = montar(armazem, '');

  const resultado = sair(montagem.contexto);

  assert.equal(resultado.sessaoEncerrada, false);
  assert.equal(resultado.motivo, 'token-inexistente');
  assert.equal(resultado.credencialLimpa, true);

  // Nenhuma gravacao: sem token nao sai comando nenhum para o banco.
  assert.deepEqual(armazem.gravacoes, []);
  assert.equal(Object.keys(armazem.mapa()).length, 2);
  assert.deepEqual(montagem.limpezas, [CONTA]);
});

test('sair com token desconhecido grava o mapa de volta inalterado, na mesma ordem', () => {
  const armazem = doisDispositivos();
  const antes = Object.keys(armazem.mapa());

  const resultado = sair(montar(armazem, 'token-que-nunca-existiu').contexto);

  assert.equal(resultado.sessaoEncerrada, false);
  assert.equal(resultado.motivo, 'token-inexistente');

  // O caminho normal roda: le e grava de volta. Quem decide que nada chega ao
  // banco e a gravacao do metadado — gravar valor identico nao escreve nada.
  assert.equal(armazem.gravacoes.length, 1);
  assert.deepEqual(Object.keys(armazem.mapa()), antes);
});

// ---------------------------------------------------------------------------
// O registro de sessao: o que encerrar faz, e o que NAO faz
// ---------------------------------------------------------------------------

test('encerrar preserva a ordem das entradas restantes (o mapa gravado e arranjo, e arranjo tem ordem)', () => {
  const armazem = armazemCom({
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
    [resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO)]: sessao(
      AGORA - 60,
      '203.0.113.2',
    ),
    [resumoDoTokenDeSessao(DE_UM_TERCEIRO)]: sessao(AGORA - 120, '203.0.113.3'),
  });

  // Encerra a do meio: as duas pontas ficam na ordem em que estavam.
  encerrarSessao(armazem.sessoes, CONTA, DO_OUTRO_DISPOSITIVO);

  assert.deepEqual(Object.keys(armazem.mapa()), [
    resumoDoTokenDeSessao(DESTE_DISPOSITIVO),
    resumoDoTokenDeSessao(DE_UM_TERCEIRO),
  ]);
});

test('encerrar nao poda sessao vencida: o filtro do que venceu e de T007 (U5, BR-MIGRAR-025)', () => {
  const vencida = {
    expiraEm: AGORA - 1,
    abertaEm: AGORA - DOIS_DIAS - 1,
  } satisfies Sessao;
  const armazem = armazemCom({
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
    [resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO)]: vencida,
  });

  encerrarSessao(armazem.sessoes, CONTA, DESTE_DISPOSITIVO);

  // A vencida continua gravada: podar aqui seria antecipar a entrega de T007 e
  // mudar o efeito no banco desta operacao.
  assert.deepEqual(armazem.mapa(), {
    [resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO)]: vencida,
  });
});

test('encerrar a ultima sessao grava mapa vazio (e mapa vazio apaga a linha de metadado)', () => {
  const armazem = armazemCom({
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
  });

  encerrarSessao(armazem.sessoes, CONTA, DESTE_DISPOSITIVO);

  assert.deepEqual(armazem.gravacoes, [{}]);
});

// ---------------------------------------------------------------------------
// BR-MIGRAR-111 / `ESC-SESSAO` — as duas operacoes definidas e SEM CHAMADOR
//
// O cenario de paridade: "as duas operacoes existem no sistema novo / nenhum
// caminho de uso do produto as invoca, como no oraculo / quando elas sao
// invocadas diretamente, o efeito no banco e identico ao do oraculo".
// ---------------------------------------------------------------------------

test('ESC-SESSAO as duas operacoes de encerramento existem e sao alcancaveis de fora', () => {
  assert.equal(typeof encerrarOutrasSessoes, 'function');
  assert.equal(typeof encerrarTodasAsSessoes, 'function');
});

test('ESC-SESSAO nenhum caminho do produto invoca as duas: sair deixa as outras sessoes de pe', () => {
  const armazem = doisDispositivos();

  sair(montar(armazem).contexto);

  // A unica entrada que saiu foi a da sessao corrente. Se `sair` chamasse
  // qualquer uma das duas, este mapa estaria vazio.
  assert.deepEqual(Object.keys(armazem.mapa()), [
    resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO),
  ]);
});

test('ESC-SESSAO invocada diretamente, encerrarOutrasSessoes deixa so a sessao mantida', () => {
  const armazem = doisDispositivos();

  encerrarOutrasSessoes(armazem.sessoes, CONTA, DESTE_DISPOSITIVO);

  assert.deepEqual(armazem.mapa(), {
    [resumoDoTokenDeSessao(DESTE_DISPOSITIVO)]: sessao(AGORA, '203.0.113.1'),
  });
});

test('ESC-SESSAO encerrarOutrasSessoes com token que nao abre sessao encerra todas', () => {
  const armazem = doisDispositivos();

  encerrarOutrasSessoes(armazem.sessoes, CONTA, 'token-que-nunca-existiu');

  assert.deepEqual(armazem.mapa(), {});
});

test('ESC-SESSAO invocada diretamente, encerrarTodasAsSessoes esvazia o registro', () => {
  const armazem = doisDispositivos();

  encerrarTodasAsSessoes(armazem.sessoes, CONTA);

  assert.deepEqual(armazem.gravacoes, [{}]);
  assert.equal(sessaoEstaAberta(armazem.sessoes, CONTA, DESTE_DISPOSITIVO), false);
  assert.equal(
    sessaoEstaAberta(armazem.sessoes, CONTA, DO_OUTRO_DISPOSITIVO),
    false,
  );
});

// ---------------------------------------------------------------------------
// P4 — a declaracao de permissao desta operacao: NENHUMA capacidade
// ---------------------------------------------------------------------------

test('P4 a saida nao exige capacidade nenhuma, e o contexto dela nao tem por onde perguntar', () => {
  const armazem = doisDispositivos();
  const { contexto } = montar(armazem);

  // O contexto da saida tem quatro chaves, e nenhuma delas e autorizacao.
  // Acrescentar uma fecharia uma superficie que o legado tem aberta.
  assert.deepEqual(Object.keys(contexto).sort(), [
    'credenciaisDoNavegador',
    'ganchos',
    'identidade',
    'sessoes',
  ]);

  assert.equal(sair(contexto).sessaoEncerrada, true);
});

// ---------------------------------------------------------------------------
// EXT-CONTEXTO — a identidade e escopo de REQUISICAO (AD-02, BR-MIGRAR-105)
// ---------------------------------------------------------------------------

test('EXT-CONTEXTO duas saidas concorrentes nao se enxergam', () => {
  const primeira = montar(doisDispositivos(), DESTE_DISPOSITIVO, 7);
  const segunda = montar(doisDispositivos(), DO_OUTRO_DISPOSITIVO, 9);

  const resultadoA = sair(primeira.contexto);
  const resultadoB = sair(segunda.contexto);

  assert.equal(resultadoA.idDaConta, 7);
  assert.equal(resultadoB.idDaConta, 9);
  assert.deepEqual(primeira.limpezas, [7]);
  assert.deepEqual(segunda.limpezas, [9]);

  // Cada uma encerrou o proprio token, no proprio armazenamento.
  assert.deepEqual(Object.keys(primeira.armazem.mapa()), [
    resumoDoTokenDeSessao(DO_OUTRO_DISPOSITIVO),
  ]);
  assert.deepEqual(Object.keys(segunda.armazem.mapa()), [
    resumoDoTokenDeSessao(DESTE_DISPOSITIVO),
  ]);
});
