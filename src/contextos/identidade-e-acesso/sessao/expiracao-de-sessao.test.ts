/**
 * A entrega de T007: *"o comportamento de US-3 existe e os critérios CA-3.1,
 * CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-3.** Esses sao T008, que pede 5 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-003-1 a UT-003-5), *"com o
 * mesmo dado de entrada, acao e resultado esperado"*. Esta suite afirma os
 * quatro critérios, as bordas que o P6 cobra e as duas regras que uma
 * implementacao razoavel quebraria em silencio: a credencial do navegador e o
 * token sao prazos **diferentes** (UC-19), e o que sai do registro de token sai
 * pelo relogio e por mais nada (`ESC-SESSAO`).
 *
 * O relogio e controlado em todos os testes, como o P4 cobra — *"teste por
 * atestado que fixa prazo e forca, com relogio controlado"* — e cada numero e
 * afirmado nas duas pontas da borda, como o P6 cobra: *"no ultimo instante
 * aceita, um instante depois recusa"*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CARENCIA_DE_SESSAO_DE_FABRICA,
  credencialDoNavegador,
  limiteDeAceitacao,
  sessaoAceita,
  sessoesAceitas,
  situacaoDaSessao,
} from './expiracao-de-sessao.js';
import {
  requisicaoEhAnonima,
  sessaoDaRequisicao,
} from './sessao-da-requisicao.js';
import {
  abrirSessao,
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
  type Sessao,
} from './registro-de-sessoes.js';
import {
  PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
  expiracaoDoToken,
} from '../autenticacao/prazos-de-sessao.js';

const AGORA = 1_700_000_000;

/** O armazenamento de sessoes em memoria, com o mapa visivel para asserir. */
function armazenamentoDeTeste(inicial: MapaDeSessoes = {}): {
  readonly armazenamento: ArmazenamentoDeSessoes;
  mapa(): MapaDeSessoes;
} {
  const porConta = new Map<number, MapaDeSessoes>([[7, inicial]]);

  return {
    armazenamento: {
      ler(id) {
        return porConta.get(id) ?? {};
      },
      gravar(id, sessoes) {
        porConta.set(id, sessoes);
      },
    },
    mapa() {
      return porConta.get(7) ?? {};
    },
  };
}

function sessaoQueVenceEm(expiraEm: number): Sessao {
  return { expiraEm, abertaEm: AGORA };
}

// ---------------------------------------------------------------------------
// CA-3.1 — sem lembranca: credencial de sessao, token de 2 dias
// ---------------------------------------------------------------------------

test('CA-3.1 sem lembranca a credencial do navegador e de sessao', () => {
  const prazoDoToken = expiracaoDoToken(AGORA, false);

  assert.deepEqual(credencialDoNavegador(prazoDoToken, false), {
    tipo: 'de-sessao',
  });
});

test('CA-3.1 sem lembranca o token ainda vale 2 dias (UC-19: os dois prazos sao diferentes)', () => {
  const prazoDoToken = expiracaoDoToken(AGORA, false);

  // A credencial e de sessao E o token vale 2 dias. Um porte que colapsasse os
  // dois num numero so perderia exatamente o que UC-19 manda nao perder:
  // "fechar o navegador nao encerra a sessao do lado do servidor".
  assert.equal(prazoDoToken, AGORA + 2 * SEGUNDOS_POR_DIA);
  assert.equal(credencialDoNavegador(prazoDoToken, false).tipo, 'de-sessao');

  const sessao = sessaoQueVenceEm(prazoDoToken);
  assert.equal(situacaoDaSessao(sessao, AGORA + 2 * SEGUNDOS_POR_DIA), 'valida');
});

// ---------------------------------------------------------------------------
// CA-3.2 — com lembranca: 14 dias
// ---------------------------------------------------------------------------

test('CA-3.2 com lembranca o acesso vale 14 dias', () => {
  const prazoDoToken = expiracaoDoToken(AGORA, true);

  assert.equal(prazoDoToken, AGORA + 14 * SEGUNDOS_POR_DIA);
  assert.equal(
    PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA.comLembrar,
    14 * SEGUNDOS_POR_DIA,
  );
});

test('CA-3.2 com lembranca a credencial vive a carencia a mais que o token', () => {
  const prazoDoToken = expiracaoDoToken(AGORA, true);

  // O motivo de a credencial viver mais esta no legado: para que o navegador
  // continue mandando o que ja venceu, que e o que torna a carencia alcancavel.
  assert.deepEqual(credencialDoNavegador(prazoDoToken, true), {
    tipo: 'com-prazo',
    expiraEm: prazoDoToken + 12 * SEGUNDOS_POR_HORA,
  });
});

// ---------------------------------------------------------------------------
// CA-3.3 — a carencia de 12 horas, e as bordas que o P6 cobra
// ---------------------------------------------------------------------------

test('CA-3.3 a carencia de fabrica e 12 horas (P6: o valor)', () => {
  assert.equal(CARENCIA_DE_SESSAO_DE_FABRICA, 12 * SEGUNDOS_POR_HORA);
  assert.equal(CARENCIA_DE_SESSAO_DE_FABRICA, 43_200);
});

test('CA-3.3 no ultimo instante do prazo a sessao e valida; um segundo depois, na carencia (P6: a borda)', () => {
  const sessao = sessaoQueVenceEm(AGORA);

  assert.equal(situacaoDaSessao(sessao, AGORA - 1), 'valida');
  assert.equal(situacaoDaSessao(sessao, AGORA), 'valida');
  assert.equal(situacaoDaSessao(sessao, AGORA + 1), 'na-carencia');
});

test('CA-3.3 no ultimo instante da carencia a sessao ainda e aceita (P6: a borda)', () => {
  const sessao = sessaoQueVenceEm(AGORA);
  const limite = limiteDeAceitacao(sessao);

  assert.equal(limite, AGORA + 12 * SEGUNDOS_POR_HORA);
  assert.equal(situacaoDaSessao(sessao, limite - 1), 'na-carencia');
  assert.equal(situacaoDaSessao(sessao, limite), 'na-carencia');
  assert.equal(sessaoAceita(sessao, limite), true);
});

test('CA-3.3 a sessao na carencia e reconhecida, e vem marcada', () => {
  const token = 'token-em-claro-da-sessao';
  const sessao = sessaoQueVenceEm(AGORA);
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao(token)]: sessao,
  });

  const dentro = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    AGORA + SEGUNDOS_POR_HORA,
  );

  assert.equal(dentro.reconhecida, true);
  if (!dentro.reconhecida) return;
  assert.equal(dentro.naCarencia, true);
  assert.equal(dentro.idDaConta, 7);
  assert.deepEqual(dentro.sessao, sessao);
});

test('CA-3.3 dentro do prazo a sessao e reconhecida e NAO esta na carencia', () => {
  const token = 'token-em-claro-da-sessao';
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao(token)]: sessaoQueVenceEm(AGORA + SEGUNDOS_POR_DIA),
  });

  const resolucao = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    AGORA,
  );

  assert.equal(resolucao.reconhecida, true);
  if (!resolucao.reconhecida) return;
  assert.equal(resolucao.naCarencia, false);
});

// ---------------------------------------------------------------------------
// CA-3.4 — passada a carencia, a requisicao e anonima
// ---------------------------------------------------------------------------

test('CA-3.4 um segundo depois da carencia a requisicao e anonima (P6: a borda)', () => {
  const token = 'token-em-claro-da-sessao';
  const sessao = sessaoQueVenceEm(AGORA);
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao(token)]: sessao,
  });
  const limite = limiteDeAceitacao(sessao);

  const noLimite = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    limite,
  );
  const depois = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    limite + 1,
  );

  assert.equal(noLimite.reconhecida, true);
  assert.equal(depois.reconhecida, false);
  assert.equal(requisicaoEhAnonima(depois), true);
  if (depois.reconhecida) return;
  assert.equal(depois.motivo, 'sessao-vencida');
});

test('CA-3.4 anonima nao devolve conta nenhuma: nao ha identidade a reaproveitar', () => {
  const token = 'token-em-claro-da-sessao';
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao(token)]: sessaoQueVenceEm(AGORA),
  });

  const resolucao = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    AGORA + 2 * 12 * SEGUNDOS_POR_HORA,
  );

  assert.equal(resolucao.reconhecida, false);
  // A ausencia e o ponto: o tipo nao deixa nenhum caminho ler `idDaConta` de uma
  // resolucao anonima, e e isso que o cenario de concorrencia de
  // `parity_tests/06` cobra com tolerancia zero.
  assert.equal('idDaConta' in resolucao, false);
});

test('CA-3.4 token fora do registro e anonimo, e por motivo distinto do vencido', () => {
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao('token-de-outro-dispositivo')]:
      sessaoQueVenceEm(AGORA + SEGUNDOS_POR_DIA),
  });

  const desconhecida = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token: 'token-que-nunca-existiu' },
    AGORA,
  );
  const semCredencial = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token: '' },
    AGORA,
  );

  assert.equal(desconhecida.reconhecida, false);
  assert.equal(semCredencial.reconhecida, false);
  if (desconhecida.reconhecida || semCredencial.reconhecida) return;
  assert.equal(desconhecida.motivo, 'sessao-desconhecida');
  assert.equal(semCredencial.motivo, 'sem-credencial');
});

test('a sessao de outra conta nao vale para esta conta', () => {
  const token = 'token-em-claro-da-sessao';
  const { armazenamento } = armazenamentoDeTeste({
    [resumoDoTokenDeSessao(token)]: sessaoQueVenceEm(AGORA + SEGUNDOS_POR_DIA),
  });

  const daConta = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 7, token },
    AGORA,
  );
  const deOutra = sessaoDaRequisicao(
    armazenamento,
    { idDaConta: 8, token },
    AGORA,
  );

  assert.equal(daConta.reconhecida, true);
  assert.equal(deOutra.reconhecida, false);
});

// ---------------------------------------------------------------------------
// O filtro da leitura, que T002 deixou nomeado para esta tarefa
// ---------------------------------------------------------------------------

test('o filtro usa a MESMA carencia da validacao: a sessao na carencia continua no mapa', () => {
  const sessoes: MapaDeSessoes = {
    'na-carencia': sessaoQueVenceEm(AGORA - SEGUNDOS_POR_HORA),
    valida: sessaoQueVenceEm(AGORA + SEGUNDOS_POR_DIA),
    vencida: sessaoQueVenceEm(AGORA - 13 * SEGUNDOS_POR_HORA),
  };

  const aceitas = sessoesAceitas(sessoes, AGORA);

  // Se o filtro usasse o prazo cru, a sessao na carencia desapareceria do mapa e
  // CA-3.3 falharia como "sessao desconhecida" — por um caminho que nenhum teste
  // de prazo apanha.
  assert.deepEqual(Object.keys(aceitas).sort(), ['na-carencia', 'valida']);
});

test('abrir sessao poda o que o relogio ja nao aceita, e so isso (ESC-SESSAO)', () => {
  const { armazenamento, mapa } = armazenamentoDeTeste({
    'de-outro-dispositivo': sessaoQueVenceEm(AGORA + SEGUNDOS_POR_DIA),
    'na-carencia': sessaoQueVenceEm(AGORA - SEGUNDOS_POR_HORA),
    'vencida-de-verdade': sessaoQueVenceEm(AGORA - 13 * SEGUNDOS_POR_HORA),
  });

  const aberta = abrirSessao(
    armazenamento,
    7,
    expiracaoDoToken(AGORA, false),
    AGORA,
  );

  const gravadas = mapa();
  // O acumulo que BR-MIGRAR-111 manda preservar continua de pe: a sessao do
  // outro dispositivo e a que esta na carencia ficam, e a nova entra ao lado.
  assert.deepEqual(Object.keys(gravadas).sort(), [
    'de-outro-dispositivo',
    'na-carencia',
    resumoDoTokenDeSessao(aberta.token),
  ].sort());
  assert.equal('vencida-de-verdade' in gravadas, false);
});

test('a carencia e ponto de configuracao, e zero reproduz a leitura estrita', () => {
  const sessao = sessaoQueVenceEm(AGORA);

  // O ponto que o pacote deixou aberto — se a carencia vale para as duas
  // duracoes ou so para a estendida — e alcancavel sem alterar arquivo deste
  // modulo. Ver a nota de abertura de `expiracao-de-sessao.ts`.
  assert.equal(situacaoDaSessao(sessao, AGORA + 1, 0), 'vencida');
  assert.equal(limiteDeAceitacao(sessao, 0), AGORA);
  assert.deepEqual(credencialDoNavegador(AGORA, true, 0), {
    tipo: 'com-prazo',
    expiraEm: AGORA,
  });
});
