/**
 * A entrega de T011: *"o comportamento de US-5 existe e os critérios CA-5.1,
 * CA-5.2, CA-5.3 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-5.** Esses sao T012, que pede 4 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-007-1 a UT-007-4), *"com o
 * mesmo dado de entrada, acao e resultado esperado"* — e esse catalogo **nao
 * esta nesta arvore** (`backlog/tests.md` nao existe aqui). Esta suite afirma os
 * tres criterios **nos dois lados do conflito de CA-5.1** e as regras que a
 * implementacao poderia quebrar em silencio: o P7 (o registro e so escrita), o
 * P6 (nenhum numero novo, nenhum contador de tentativa) e a ausencia de estado
 * entre pedidos, que e o que faz CA-5.3 passar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  MensagemDeEmail,
  PortaDeEmail,
  PortaDeRelogio,
  ResultadoDeEnvio,
} from '../portas/index.js';
import {
  enviarEmailDeRedefinicao,
  type ContextoDeEnvioDeRedefinicao,
  type FalhaDeEnvioRegistrada,
  type LadoDoRelatoDeFalhaDeEnvio,
} from './envio-do-email-de-redefinicao.js';

const AGORA = 1_700_000_000;
const TITULAR = 'titular@exemplo.invalido';
const MOTIVO = 'transporte indisponivel';

/** A mensagem que T009 vai montar: o corpo carrega a chave em claro. */
function mensagemCom(chaveEmClaro: string): MensagemDeEmail {
  return {
    destinatarios: [TITULAR],
    assunto: '[Exemplo] Password Reset',
    corpo: `https://exemplo.invalido/wp-login.php?action=rp&key=${chaveEmClaro}`,
    cabecalhos: [],
    anexos: [],
  };
}

interface Montagem {
  readonly contexto: ContextoDeEnvioDeRedefinicao;
  /** Toda mensagem que chegou a porta, na ordem. Mede a tentativa de envio. */
  readonly tentativas: MensagemDeEmail[];
  /** Tudo que foi registrado, na ordem. Mede CA-5.2. */
  readonly registradas: FalhaDeEnvioRegistrada[];
  /** Quantas vezes o relogio foi lido. */
  leiturasDoRelogio(): number;
}

/**
 * Monta o contexto. `envios` e a fila de respostas da porta, uma por chamada —
 * e assim que uma falha seguida de sucesso se descreve sem relogio falso.
 */
function montar(
  lado: LadoDoRelatoDeFalhaDeEnvio,
  envios: readonly ResultadoDeEnvio[],
  registrar: (falha: FalhaDeEnvioRegistrada) => void = () => {},
): Montagem {
  const tentativas: MensagemDeEmail[] = [];
  const registradas: FalhaDeEnvioRegistrada[] = [];
  let leituras = 0;

  const email: PortaDeEmail = {
    enviar(mensagem) {
      const resposta = envios[tentativas.length];
      tentativas.push(mensagem);
      // Sem resposta na fila, o transporte entregou: a fila diz o que falha, e
      // o resto e o caminho normal.
      return resposta ?? { enviado: true };
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      leituras += 1;
      return AGORA;
    },
  };

  return {
    contexto: {
      email,
      relogio,
      registroDeFalha: {
        registrar(falha) {
          registradas.push(falha);
          registrar(falha);
        },
      },
      relatoAoRequisitante: lado,
    },
    tentativas,
    registradas,
    leiturasDoRelogio() {
      return leituras;
    },
  };
}

const OS_DOIS_LADOS: readonly LadoDoRelatoDeFalhaDeEnvio[] = [
  'uc-20-silencioso',
  'ca-5-1-aviso-distinto',
];

// ── CA-5.1, nos dois lados do conflito ──────────────────────────────────────
//
// O conflito esta no cabecalho de `envio-do-email-de-redefinicao.ts`: a spec
// manda avisar, UC-20 § Excecoes diz que o legado nao avisa, e esta tarefa nao
// escolheu. Os dois lados estao afirmados, logo nenhum custa retrabalho quando
// a decisao vier.

test('CA-5.1, lado da spec: a falha devolve um aviso distinto do sucesso', () => {
  const montagem = montar('ca-5-1-aviso-distinto', [
    { enviado: false, motivo: MOTIVO },
  ]);

  const falhou = enviarEmailDeRedefinicao(
    montagem.contexto,
    mensagemCom('chave-1'),
  );
  const saiu = enviarEmailDeRedefinicao(
    montagem.contexto,
    mensagemCom('chave-2'),
  );

  assert.equal(falhou.enviado, false);
  assert.equal(falhou.avisoAoRequisitante, 'falha-de-envio');
  assert.equal(saiu.avisoAoRequisitante, 'confirmacao-de-envio');
  assert.notEqual(falhou.avisoAoRequisitante, saiu.avisoAoRequisitante);
});

test('CA-5.1, lado de UC-20: a falha devolve o MESMO aviso do sucesso', () => {
  const montagem = montar('uc-20-silencioso', [
    { enviado: false, motivo: MOTIVO },
  ]);

  const falhou = enviarEmailDeRedefinicao(
    montagem.contexto,
    mensagemCom('chave-1'),
  );
  const saiu = enviarEmailDeRedefinicao(
    montagem.contexto,
    mensagemCom('chave-2'),
  );

  // *"o assinante nao tem como saber"* — UC-20 § Excecoes, 🟢 confirmado.
  assert.equal(falhou.enviado, false);
  assert.equal(falhou.avisoAoRequisitante, 'confirmacao-de-envio');
  assert.equal(saiu.avisoAoRequisitante, 'confirmacao-de-envio');
  assert.equal(falhou.avisoAoRequisitante, saiu.avisoAoRequisitante);
});

test('o lado do conflito e o UNICO efeito que ele tem: o resto do relato e igual nos dois', () => {
  const silencioso = montar('uc-20-silencioso', [
    { enviado: false, motivo: MOTIVO },
  ]);
  const avisando = montar('ca-5-1-aviso-distinto', [
    { enviado: false, motivo: MOTIVO },
  ]);

  const umLado = enviarEmailDeRedefinicao(
    silencioso.contexto,
    mensagemCom('chave-1'),
  );
  const outroLado = enviarEmailDeRedefinicao(
    avisando.contexto,
    mensagemCom('chave-1'),
  );

  assert.equal(umLado.enviado, outroLado.enviado);
  assert.equal(
    umLado.enviado === false ? umLado.motivo : null,
    outroLado.enviado === false ? outroLado.motivo : null,
  );
  // CA-5.2 nao esta em conflito: os dois lados registram igual. Ver o cabecalho.
  assert.deepEqual(silencioso.registradas, avisando.registradas);
  // E a tentativa de envio e a mesma: o lado nao muda o que vai para a porta.
  assert.deepEqual(silencioso.tentativas, avisando.tentativas);
});

test('o sucesso tem a mesma forma nos dois lados, e nada e registrado', () => {
  for (const lado of OS_DOIS_LADOS) {
    const montagem = montar(lado, []);

    const relato = enviarEmailDeRedefinicao(
      montagem.contexto,
      mensagemCom('chave-1'),
    );

    assert.deepEqual(relato, {
      enviado: true,
      avisoAoRequisitante: 'confirmacao-de-envio',
    });
    // *"confirmacao de envio, sempre com a mesma forma"* — `plan.md` § Contratos.
    assert.deepEqual(montagem.registradas, []);
    // E o caminho de sucesso nao olha a hora: o legado nao olha.
    assert.equal(montagem.leiturasDoRelogio(), 0);
  }
});

// ── CA-5.2 ──────────────────────────────────────────────────────────────────

test('CA-5.2: a falha fica registrada com instante, destinatario e motivo', () => {
  for (const lado of OS_DOIS_LADOS) {
    const montagem = montar(lado, [{ enviado: false, motivo: MOTIVO }]);

    enviarEmailDeRedefinicao(montagem.contexto, mensagemCom('chave-1'));

    assert.deepEqual(montagem.registradas, [
      {
        instanteEmSegundos: AGORA,
        destinatarios: [TITULAR],
        motivo: MOTIVO,
      },
    ]);
    // O instante vem da porta de relogio, lida uma vez — nao de `Date.now()`,
    // ou o P4 ("relogio controlado") e o P6 (teste de borda) nao seriam
    // conferiveis.
    assert.equal(montagem.leiturasDoRelogio(), 1);
  }
});

test('CA-5.2: o motivo registrado e o que o canal informou, qualquer que seja', () => {
  const motivos = ['transporte indisponivel', 'mailbox unavailable', ''];

  for (const motivo of motivos) {
    const montagem = montar('uc-20-silencioso', [{ enviado: false, motivo }]);

    const relato = enviarEmailDeRedefinicao(
      montagem.contexto,
      mensagemCom('chave-1'),
    );

    // O texto atravessa a porta sem ser interpretado, reescrito nem
    // classificado: CA-5.2 diz "motivo informado pelo canal de envio".
    assert.equal(montagem.registradas[0]?.motivo, motivo);
    assert.equal(relato.enviado === false ? relato.motivo : null, motivo);
  }
});

test('P7: o registro e so escrita — o relato nao depende do que o registro faz', () => {
  const inerte = montar('ca-5-1-aviso-distinto', [
    { enviado: false, motivo: MOTIVO },
  ]);
  // Um registro que faz trabalho de verdade, e devolve nada, como o contrato
  // exige. Se alguma ramificacao passasse a depender dele, os dois relatos
  // divergiriam.
  const linhas: string[] = [];
  const ativo = montar(
    'ca-5-1-aviso-distinto',
    [{ enviado: false, motivo: MOTIVO }],
    (falha) => {
      linhas.push(JSON.stringify(falha));
    },
  );

  const semTrabalho = enviarEmailDeRedefinicao(
    inerte.contexto,
    mensagemCom('chave-1'),
  );
  const comTrabalho = enviarEmailDeRedefinicao(
    ativo.contexto,
    mensagemCom('chave-1'),
  );

  assert.deepEqual(semTrabalho, comTrabalho);
  assert.equal(linhas.length, 1);
});

// ── CA-5.3 ──────────────────────────────────────────────────────────────────

test('CA-5.3: pedir de novo apos a falha produz uma tentativa nova, com a chave nova', () => {
  for (const lado of OS_DOIS_LADOS) {
    const montagem = montar(lado, [{ enviado: false, motivo: MOTIVO }]);

    const primeiro = enviarEmailDeRedefinicao(
      montagem.contexto,
      mensagemCom('chave-1'),
    );
    const segundo = enviarEmailDeRedefinicao(
      montagem.contexto,
      mensagemCom('chave-2'),
    );

    assert.equal(primeiro.enviado, false);
    assert.equal(segundo.enviado, true);
    // Duas tentativas chegaram a porta, e a segunda carrega a chave nova — que
    // e quem a gera e substitui e T009 (CA-4.3).
    assert.equal(montagem.tentativas.length, 2);
    assert.match(String(montagem.tentativas[0]?.corpo), /key=chave-1$/);
    assert.match(String(montagem.tentativas[1]?.corpo), /key=chave-2$/);
  }
});

test('CA-5.3 e P6: nenhuma falha anterior impede o pedido seguinte, e nao ha contador', () => {
  const dezFalhas: ResultadoDeEnvio[] = Array.from({ length: 10 }, () => ({
    enviado: false,
    motivo: MOTIVO,
  }));
  const montagem = montar('ca-5-1-aviso-distinto', dezFalhas);

  const relatos = Array.from({ length: 11 }, (_, indice) =>
    enviarEmailDeRedefinicao(montagem.contexto, mensagemCom(`chave-${indice}`)),
  );

  // Onze pedidos, onze tentativas de envio. Nenhuma espera, nenhum bloqueio,
  // nenhuma contagem: `do-not-rewrite.md` poe REQ-005 e REQ-160 fora do pacote
  // e o P6 recusa numero que o legado nao tem.
  assert.equal(montagem.tentativas.length, 11);
  assert.equal(montagem.registradas.length, 10);
  assert.equal(relatos[10]?.enviado, true);
  // E a decima falha tem o mesmo relato da primeira: nada degrada com a
  // repeticao.
  assert.deepEqual(relatos[0], relatos[9]);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = montar('ca-5-1-aviso-distinto', [
    { enviado: false, motivo: MOTIVO },
  ]);
  const segunda = montar('uc-20-silencioso', [
    { enviado: false, motivo: 'outro motivo' },
  ]);

  enviarEmailDeRedefinicao(primeira.contexto, mensagemCom('chave-1'));

  // O pedido de uma requisicao nao aparece na outra, e o lado do conflito de
  // uma nao vale para a outra: as duas coisas vivem no argumento, nunca em
  // estado de modulo.
  assert.equal(primeira.registradas.length, 1);
  assert.equal(segunda.registradas.length, 0);
  assert.equal(segunda.tentativas.length, 0);
});
