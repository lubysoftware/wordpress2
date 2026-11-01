/**
 * Testes da entrega de **T015** (US-7): *"o comportamento de US-7 existe e os
 * criterios CA-7.1, CA-7.2, CA-7.3 passam contra o sistema novo"*.
 *
 * Esta **nao** e a suite do catalogo: os quatro casos UT-054-1 a UT-054-4 de
 * `backlog/tests.md` sao a tarefa `[P]` **T016**, que os transcreve. Aqui se
 * afirmam os criterios pela coleta inteira, sobre a porta de dados que registra
 * comando, porque o que importa provar em CA-7.1 e **o que sai e o que nao sai**.
 *
 * Tudo que a coleta le esta programado na ordem em que ela le: a varredura de
 * `{site}postmeta`, o `SELECT meta_id` de cada marcador, e entao a de
 * `{site}commentmeta`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarCanalQueRegistra,
  type CanalQueRegistra,
} from '../../../plataforma/registro-de-operacao/index.js';
import {
  criarArmazenamentoDeRetencao,
  criarPortaDeDadosFalsa,
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import {
  coletarALixeiraVencida,
  criarVarreduraDoVencido,
  ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
  SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
  type ContextoDeColeta,
  type RegistroNaColeta,
} from './index.js';

const AGORA_EM_SEGUNDOS = 1_700_000_000;
const AGORA_EM_MILISSEGUNDOS = 1_700_000_123_456;

interface Cenario {
  readonly porta: PortaDeDadosFalsa;
  readonly contexto: ContextoDeColeta;
  readonly canal: CanalQueRegistra | null;
  readonly conteudosApagados: number[];
  readonly comentariosApagados: RegistroNaColeta[];
  readonly leiturasDoRelogioDaColeta: () => number;
}

interface OpcoesDoCenario {
  readonly conteudos?: ReadonlyMap<number, string>;
  readonly comentarios?: ReadonlyMap<number, string>;
  /** Sem canal, a coleta e a do legado (P7). */
  readonly semCanal?: boolean;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const porta = criarPortaDeDadosFalsa();
  const conteudos = opcoes.conteudos ?? new Map<number, string>();
  const comentarios = opcoes.comentarios ?? new Map<number, string>();
  const conteudosApagados: number[] = [];
  const comentariosApagados: RegistroNaColeta[] = [];
  const canal = opcoes.semCanal === true ? null : criarCanalQueRegistra();
  let leituras = 0;

  return {
    porta,
    canal,
    conteudosApagados,
    comentariosApagados,
    leiturasDoRelogioDaColeta: () => leituras,
    contexto: {
      prazoDeRetencao: { diasNaLixeira: 30 },
      relogio: {
        agoraEmSegundos() {
          leituras += 1;
          return AGORA_EM_SEGUNDOS;
        },
      },
      varredura: criarVarreduraDoVencido(porta.porta),
      armazenamento: criarArmazenamentoDeRetencao(porta.porta),
      conteudo: {
        obterPorId(id) {
          const estado = conteudos.get(id);
          return estado === undefined ? null : { id, estado };
        },
      },
      comentario: {
        obterPorId(id) {
          const estado = comentarios.get(id);
          return estado === undefined ? null : { id, estado };
        },
      },
      exclusaoDefinitivaDeConteudo(id) {
        conteudosApagados.push(id);
        return true;
      },
      exclusaoDefinitivaDeComentario(registro) {
        comentariosApagados.push(registro);
        return true;
      },
      ...(canal === null
        ? {}
        : {
            registroDeInconsistencia: {
              canal: canal.porta,
              agoraEmMilissegundos: () => AGORA_EM_MILISSEGUNDOS,
            },
          }),
    },
  };
}

/** A resposta de uma varredura, na forma em que o driver a devolve. */
function varridos(coluna: string, ids: readonly number[]) {
  return ids.map((id) => ({ [coluna]: id }));
}

/** Os dois `SELECT meta_id` de um registro inconsistente, com linha cada um. */
function comOsDoisMarcadores(porta: PortaDeDadosFalsa, metaId: number): void {
  porta.responder([{ meta_id: metaId }]);
  porta.responder([{ meta_id: metaId + 1 }]);
}

/** As chaves de marcador procuradas por `SELECT meta_id`, na ordem. */
function chavesProcuradas(porta: PortaDeDadosFalsa): unknown[] {
  return porta.selecoes
    .filter((consulta) => consulta.texto.startsWith('SELECT meta_id'))
    .map((consulta) => consulta.parametros[0]);
}

// ── CA-7.1 — SO A MARCA E REMOVIDA, E O REGISTRO NAO E APAGADO ──────────────

for (const estado of ['draft', 'publish', 'private', 'pending']) {
  test(`CA-7.1 conteudo em \`${estado}\` com marca vencida tem so a marca removida`, () => {
    const caso = cenario({ conteudos: new Map([[7, estado]]) });
    caso.porta.responder(varridos('post_id', [7]));
    comOsDoisMarcadores(caso.porta, 11);

    const resultado = coletarALixeiraVencida(caso.contexto);

    assert.deepEqual(caso.conteudosApagados, []);
    assert.equal(resultado.registrosApagados, 0);
    // Os dois `DELETE`, e so em `{site}postmeta`: nada toca `{site}posts`.
    assert.equal(caso.porta.escritas.length, 2);
    for (const escrita of caso.porta.escritas) {
      assert.match(escrita.texto, /^DELETE FROM wp_postmeta/);
    }
  });
}

test('CA-7.1 comentario fora da lixeira tem so a marca removida', () => {
  const caso = cenario({ comentarios: new Map([[42, '1']]) });
  caso.porta.responder([]);
  caso.porta.responder(varridos('comment_id', [42]));
  comOsDoisMarcadores(caso.porta, 21);

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.comentariosApagados, []);
  assert.equal(resultado.registrosApagados, 0);
  assert.equal(caso.porta.escritas.length, 2);
  for (const escrita of caso.porta.escritas) {
    assert.match(escrita.texto, /^DELETE FROM wp_commentmeta/);
  }
});

test('CA-7.1 a marca e a do par estado e instante: o marcador agrupado fica', () => {
  // `_wp_trash_meta_comments_status` nao entra no ramo do legado
  // (`wp-includes/functions.php:6990`-`:6991`). Um conteudo que saiu da lixeira
  // por outro caminho continua com a memoria dos comentarios dele.
  const caso = cenario({ conteudos: new Map([[7, 'draft']]) });
  caso.porta.responder(varridos('post_id', [7]));
  comOsDoisMarcadores(caso.porta, 11);

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(chavesProcuradas(caso.porta), [
    MARCADOR_DE_ESTADO_ANTERIOR,
    MARCADOR_DO_INSTANTE_DO_DESCARTE,
  ]);
  assert.equal(
    chavesProcuradas(caso.porta).includes(MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS),
    false,
  );
});

test('CA-7.1 marca de um registro que nao existe mais cai no mesmo ramo, nas duas familias', () => {
  // `! $del_post ||` (`:6989`) e `! $del_comment ||` (`:7007`).
  const caso = cenario();
  caso.porta.responder(varridos('post_id', [7]));
  comOsDoisMarcadores(caso.porta, 11);
  caso.porta.responder(varridos('comment_id', [42]));
  comOsDoisMarcadores(caso.porta, 21);

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.conteudosApagados, []);
  assert.deepEqual(caso.comentariosApagados, []);
  assert.equal(caso.porta.escritas.length, 4);
});

test('PT-004 conteudo ainda na lixeira e sem estado anterior NAO e inconsistencia: e apagado', () => {
  // O cenario `@critico` *"a coleta tolera estado inconsistente e nao aborta"*
  // parte de conteudo **na lixeira** sem o metadado de estado anterior. A guarda
  // do legado so olha o estado do registro, e a coleta nao le esse metadado:
  // logo ele segue para `wp_delete_post()`, sem abortar e sem evento.
  const caso = cenario({ conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]) });
  caso.porta.responder(varridos('post_id', [7]));

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.conteudosApagados, [7]);
  assert.equal(resultado.conteudosApagados, 1);
  assert.deepEqual(chavesProcuradas(caso.porta), []);
  assert.deepEqual(caso.canal?.eventos, []);
});

// ── CA-7.2 — A ROTINA SEGUE PARA O REGISTRO SEGUINTE ────────────────────────

test('CA-7.2 inconsistencia no meio da varredura nao interrompe o laco do conteudo', () => {
  const caso = cenario({
    conteudos: new Map([
      [1, 'draft'],
      [2, ESTADO_DE_LIXEIRA],
      [4, ESTADO_DE_LIXEIRA],
    ]),
  });
  // 1 saiu da lixeira, 2 esta nela, 3 nao existe mais, 4 esta nela.
  caso.porta.responder(varridos('post_id', [1, 2, 3, 4]));
  comOsDoisMarcadores(caso.porta, 11);
  comOsDoisMarcadores(caso.porta, 13);

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(resultado.conteudosVarridos, [1, 2, 3, 4]);
  assert.deepEqual(caso.conteudosApagados, [2, 4]);
  assert.equal(resultado.conteudosApagados, 2);
});

test('CA-7.2 inconsistencia no conteudo nao impede o laco do comentario', () => {
  const caso = cenario({
    conteudos: new Map([[7, 'publish']]),
    comentarios: new Map([
      [41, 'spam'],
      [42, ESTADO_DE_LIXEIRA],
    ]),
  });
  caso.porta.responder(varridos('post_id', [7]));
  comOsDoisMarcadores(caso.porta, 11);
  caso.porta.responder(varridos('comment_id', [41, 42]));
  comOsDoisMarcadores(caso.porta, 21);

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.comentariosApagados, [
    { id: 42, estado: ESTADO_DE_LIXEIRA },
  ]);
  assert.equal(resultado.registrosApagados, 1);
});

test('CA-7.2 uma varredura so de inconsistencias termina sem apagar registro nenhum', () => {
  const caso = cenario({ conteudos: new Map([[1, 'draft']]) });
  caso.porta.responder(varridos('post_id', [1, 2]));
  comOsDoisMarcadores(caso.porta, 11);
  comOsDoisMarcadores(caso.porta, 13);
  caso.porta.responder([]);

  assert.equal(coletarALixeiraVencida(caso.contexto).registrosApagados, 0);
  assert.equal(caso.porta.escritas.length, 4);
});

// ── CA-7.3 — CADA INCONSISTENCIA E REGISTRADA ───────────────────────────────

test('CA-7.3 o evento leva o identificador do registro e o instante', () => {
  const caso = cenario({ conteudos: new Map([[7, 'draft']]) });
  caso.porta.responder(varridos('post_id', [7]));
  comOsDoisMarcadores(caso.porta, 11);

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.canal?.eventos, [
    {
      instante: AGORA_EM_MILISSEGUNDOS,
      origem: ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
      severidade: SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
      contexto: { tipo: 'post', registroId: 7, estadoEncontrado: 'draft' },
    },
  ]);
});

test('CA-7.3 sai um evento por inconsistencia, e o tipo separa o conteudo 7 do comentario 7', () => {
  const caso = cenario({
    conteudos: new Map([[7, 'draft']]),
    comentarios: new Map([[7, '0']]),
  });
  caso.porta.responder(varridos('post_id', [7, 8]));
  comOsDoisMarcadores(caso.porta, 11);
  comOsDoisMarcadores(caso.porta, 13);
  caso.porta.responder(varridos('comment_id', [7, 8]));
  comOsDoisMarcadores(caso.porta, 21);
  comOsDoisMarcadores(caso.porta, 23);

  coletarALixeiraVencida(caso.contexto);

  // O `null` e a outra metade da guarda: a linha nao existe.
  assert.deepEqual(
    caso.canal?.eventos.map((evento) => evento.contexto),
    [
      { tipo: 'post', registroId: 7, estadoEncontrado: 'draft' },
      { tipo: 'post', registroId: 8, estadoEncontrado: null },
      { tipo: 'comment', registroId: 7, estadoEncontrado: '0' },
      { tipo: 'comment', registroId: 8, estadoEncontrado: null },
    ],
  );
});

test('CA-7.3 registro apagado normalmente nao e inconsistencia, nem o identificador zero', () => {
  const caso = cenario({
    conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]),
    comentarios: new Map([[42, ESTADO_DE_LIXEIRA]]),
  });
  // O zero nao e o ramo de `R6`: `if ( ! $post_id ) { continue; }` (`:6983`) vem
  // antes de qualquer leitura, e nao ha registro a identificar.
  caso.porta.responder(varridos('post_id', [0, 7]));
  caso.porta.responder(varridos('comment_id', [0, 42]));

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.canal?.eventos, []);
});

test('CA-7.3 o evento sai depois dos dois marcadores: interrompida, a coleta nao registra duas vezes', () => {
  const interrompida = cenario({ conteudos: new Map([[7, 'draft']]) });
  interrompida.porta.responder(varridos('post_id', [7]));
  comOsDoisMarcadores(interrompida.porta, 11);

  // A falha entre os dois marcadores: sem transacao (BR-MIGRAR-104) e sem
  // `try`/`catch`, ela sobe e o instante do descarte fica na varredura seguinte.
  const real = interrompida.contexto.armazenamento;
  const contexto: ContextoDeColeta = {
    ...interrompida.contexto,
    armazenamento: {
      ...real,
      marcadoresDoConteudo: {
        ...real.marcadoresDoConteudo,
        apagarInstanteDoDescarte() {
          throw new Error('execucao interrompida');
        },
      },
    },
  };

  assert.throws(() => coletarALixeiraVencida(contexto), {
    message: 'execucao interrompida',
  });
  assert.deepEqual(interrompida.canal?.eventos, []);

  // A retomada: o marcador e a fila. So agora o registro foi tratado.
  const retomada = cenario({ conteudos: new Map([[7, 'draft']]) });
  retomada.porta.responder(varridos('post_id', [7]));
  retomada.porta.responder([]);
  retomada.porta.responder([{ meta_id: 12 }]);

  coletarALixeiraVencida(retomada.contexto);

  assert.equal(retomada.canal?.eventos.length, 1);
});

// ── P7 — O REGISTRO E SO ESCRITA ────────────────────────────────────────────

test('P7 sem canal a coleta e identica: mesmo resultado e mesma sequencia de comandos', () => {
  const programar = (caso: Cenario): void => {
    caso.porta.responder(varridos('post_id', [1, 2]));
    comOsDoisMarcadores(caso.porta, 11);
    caso.porta.responder(varridos('comment_id', [41]));
    comOsDoisMarcadores(caso.porta, 21);
  };
  const entrada = {
    conteudos: new Map([
      [1, 'draft'],
      [2, ESTADO_DE_LIXEIRA],
    ]),
    comentarios: new Map([[41, '1']]),
  };

  const comCanal = cenario(entrada);
  const semCanal = cenario({ ...entrada, semCanal: true });
  programar(comCanal);
  programar(semCanal);

  const umComCanal = coletarALixeiraVencida(comCanal.contexto);
  const umSemCanal = coletarALixeiraVencida(semCanal.contexto);

  assert.equal(comCanal.canal?.eventos.length, 2);
  assert.deepEqual(umSemCanal, umComCanal);
  assert.deepEqual(semCanal.porta.selecoes, comCanal.porta.selecoes);
  assert.deepEqual(semCanal.porta.escritas, comCanal.porta.escritas);
  assert.deepEqual(semCanal.conteudosApagados, comCanal.conteudosApagados);
});

test('P7 o registro nao rele o relogio que decide o que se apaga', () => {
  const caso = cenario({ conteudos: new Map([[1, 'draft']]) });
  caso.porta.responder(varridos('post_id', [1, 2]));
  comOsDoisMarcadores(caso.porta, 11);
  comOsDoisMarcadores(caso.porta, 13);

  coletarALixeiraVencida(caso.contexto);

  // Dois eventos, e ainda UMA leitura: o instante do evento vem da colaboracao.
  assert.equal(caso.canal?.eventos.length, 2);
  assert.equal(caso.leiturasDoRelogioDaColeta(), 1);
});
