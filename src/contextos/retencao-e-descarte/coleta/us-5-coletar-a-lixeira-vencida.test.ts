/**
 * Testes da entrega de **T011** (US-5): *"o comportamento de US-5 existe e os
 * criterios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5 passam contra o sistema
 * novo"*.
 *
 * 🔴 **Tres dos cinco criterios passam aqui; dois nao, e nao por falta de
 * teste.** CA-5.1 e conflito aberto e CA-5.5 esta pela metade — o motivo de cada
 * um esta na secao 🔴 de `coletar-a-lixeira-vencida.ts`, em
 * `agendamento-da-coleta.ts` e em `../README.md`. Os testes do fim deste arquivo
 * afirmam **o estado declarado** dos dois: que a coleta nao toca a fila e que a
 * contagem nao e gravada em lugar nenhum. Um teste que afirmasse CA-5.1 como
 * escrita estaria escolhendo um lado do conflito.
 *
 * Esta **nao** e a suite do catalogo: os sete casos UT-052-1 a UT-052-7 de
 * `backlog/tests.md` sao a tarefa `[P]` **T012**, que os **transcreve** com a
 * mesma entrada, acao e resultado. Aqui se afirmam os criterios de aceite e a
 * sequencia de comandos que a area 3 da Decisao 2 de `parity_specs.md` compara.
 *
 * ## Dois bancos de teste, e eles respondem perguntas diferentes
 *
 * - **o harnes de comandos** (`comandos()`) usa o armazenamento e a varredura
 *   **de verdade** sobre `criarPortaDeDadosFalsa()`, que registra comando. E com
 *   ele que se afirma a cadeia SQL, a ordem das exclusoes de marcador e o caso em
 *   que **nenhum comando sai**.
 * - **o harnes de mundo** (`mundo()`) guarda estado e nao emite SQL. E com ele
 *   que se afirma a retomada de CA-5.4, que depende de o marcador desaparecer
 *   junto com o registro.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarArmazenamentoDeRetencao,
  criarPortaDeDadosFalsa,
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  type MarcadoresDeLixeiraDoConteudo,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import {
  SEGUNDOS_POR_DIA,
  type PrazoDeRetencao,
} from '../configuracao/index.js';
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import type {
  EventoRecorrente,
  PortaDeFilaAgendada,
  PortaDeRelogio,
} from '../portas/index.js';
import {
  coletarALixeiraVencida,
  criarVarreduraDoVencido,
  GANCHO_DA_COLETA,
  RECORRENCIA_DA_COLETA,
  registrarAColeta,
  type ContextoDeColeta,
  type RegistroNaColeta,
  type VarreduraDoVencido,
} from './index.js';

const AGORA = 1_700_000_000;
const DE_FABRICA: PrazoDeRetencao = { diasNaLixeira: 30 };
const LIMITE_DE_FABRICA = AGORA - SEGUNDOS_POR_DIA * 30;

function relogioFixo(instante = AGORA): {
  relogio: PortaDeRelogio;
  leituras: () => number;
} {
  let leituras = 0;
  return {
    relogio: {
      agoraEmSegundos() {
        leituras += 1;
        return instante;
      },
    },
    leituras: () => leituras,
  };
}

/** A fila que a coleta **nao** deve tocar. */
function filaVigiada(): {
  fila: PortaDeFilaAgendada;
  consultas: string[];
  agendamentos: EventoRecorrente[];
} {
  const consultas: string[] = [];
  const agendamentos: EventoRecorrente[] = [];
  return {
    fila: {
      proximaOcorrencia(gancho) {
        consultas.push(gancho);
        return null;
      },
      agendarRecorrente(evento) {
        agendamentos.push(evento);
        return { agendado: true };
      },
    },
    consultas,
    agendamentos,
  };
}

// ── O HARNES DE COMANDOS ────────────────────────────────────────────────────

interface Comandos {
  readonly porta: PortaDeDadosFalsa;
  readonly contexto: ContextoDeColeta;
  readonly conteudosApagados: number[];
  readonly comentariosApagados: RegistroNaColeta[];
  readonly leiturasDeRelogio: () => number;
}

interface OpcoesDeComandos {
  readonly conteudos?: ReadonlyMap<number, string>;
  readonly comentarios?: ReadonlyMap<number, string>;
  readonly prazoDeRetencao?: PrazoDeRetencao;
  readonly exclusaoDeConteudoFunciona?: boolean;
  readonly exclusaoDeComentarioFunciona?: boolean;
}

function comandos(opcoes: OpcoesDeComandos = {}): Comandos {
  const porta = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeRetencao(porta.porta);
  const varredura = criarVarreduraDoVencido(porta.porta);
  const { relogio, leituras } = relogioFixo();

  const conteudos = opcoes.conteudos ?? new Map<number, string>();
  const comentarios = opcoes.comentarios ?? new Map<number, string>();
  const conteudosApagados: number[] = [];
  const comentariosApagados: RegistroNaColeta[] = [];

  return {
    porta,
    conteudosApagados,
    comentariosApagados,
    leiturasDeRelogio: leituras,
    contexto: {
      prazoDeRetencao: opcoes.prazoDeRetencao ?? DE_FABRICA,
      relogio,
      varredura,
      armazenamento,
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
        return opcoes.exclusaoDeConteudoFunciona ?? true;
      },
      exclusaoDefinitivaDeComentario(registro) {
        comentariosApagados.push(registro);
        return opcoes.exclusaoDeComentarioFunciona ?? true;
      },
    },
  };
}

/** A resposta de uma varredura, na forma em que o driver a devolve. */
function varridos(coluna: string, ids: readonly (number | string)[]) {
  return ids.map((id) => ({ [coluna]: id }));
}

// ── O HARNES DE MUNDO ───────────────────────────────────────────────────────

/**
 * Marcadores que atendem **so** o que a coleta chama, e **lancam** no resto.
 *
 * O lance nao e preguica: ele afirma que a coleta nao le o estado anterior, nao
 * le o instante por registro (T002 escreveu que *"nenhum fluxo do legado o
 * chama"*) e nunca toca o marcador agrupado de CA-2.2.
 */
function marcadoresDeMentira(
  apagar: (registroId: number, chave: string) => number,
): MarcadoresDeLixeiraDoConteudo {
  const naoChamado = (nome: string) => (): never => {
    throw new Error(`a coleta nao chama ${nome}`);
  };

  return {
    get metadados(): never {
      throw new Error('a coleta nao chama metadados');
    },
    estadoAnterior: naoChamado('estadoAnterior'),
    instanteDoDescarte: naoChamado('instanteDoDescarte'),
    acrescentarEstadoAnterior: naoChamado('acrescentarEstadoAnterior'),
    acrescentarInstanteDoDescarte: naoChamado('acrescentarInstanteDoDescarte'),
    estadosDosComentarios: naoChamado('estadosDosComentarios'),
    acrescentarEstadosDosComentarios: naoChamado(
      'acrescentarEstadosDosComentarios',
    ),
    apagarEstadosDosComentarios: naoChamado('apagarEstadosDosComentarios'),
    apagarEstadoAnterior: (id) => apagar(id, MARCADOR_DE_ESTADO_ANTERIOR),
    apagarInstanteDoDescarte: (id) =>
      apagar(id, MARCADOR_DO_INSTANTE_DO_DESCARTE),
  };
}

interface Mundo {
  readonly contexto: ContextoDeColeta;
  /** O diario do que foi apagado, na ordem, para afirmar "uma vez cada". */
  readonly diario: string[];
  readonly conteudos: Map<number, string>;
  readonly marcadoresDeConteudo: Map<number, number>;
}

/**
 * Um banco de mentira com estado: a varredura le os marcadores, e apagar um
 * registro apaga o marcador dele — que e o que `wp_delete_post()` faz em
 * `wp-includes/post.php:3889`-`:3890` e o que faz CA-5.4 funcionar.
 */
function mundo(opcoes: { readonly interromperEm?: number } = {}): Mundo {
  const conteudos = new Map<number, string>();
  const marcadoresDeConteudo = new Map<number, number>();
  const diario: string[] = [];
  const { relogio } = relogioFixo();

  const varredura: VarreduraDoVencido = {
    conteudosVencidos(instanteLimite) {
      return [...marcadoresDeConteudo.entries()]
        .filter(([, instante]) => instante < instanteLimite)
        .map(([id]) => id);
    },
    comentariosVencidos() {
      return [];
    },
  };

  const marcadores = marcadoresDeMentira((id, chave) => {
    diario.push(`marcador:${chave}:${id}`);
    return marcadoresDeConteudo.delete(id) ? 1 : 0;
  });

  return {
    diario,
    conteudos,
    marcadoresDeConteudo,
    contexto: {
      prazoDeRetencao: DE_FABRICA,
      relogio,
      varredura,
      armazenamento: {
        marcadoresDoConteudo: marcadores,
        marcadoresDoComentario: marcadores,
      },
      conteudo: {
        obterPorId(id) {
          const estado = conteudos.get(id);
          return estado === undefined ? null : { id, estado };
        },
      },
      comentario: {
        obterPorId() {
          return null;
        },
      },
      exclusaoDefinitivaDeConteudo(id) {
        if (id === opcoes.interromperEm) {
          // A interrupcao do meio: o legado nao tem `try`/`catch` nenhum, e
          // UC-11 registra o caso nas excecoes ("a execucao e abandonada no
          // meio"). O marcador deste registro NAO e apagado.
          throw new Error('execucao interrompida');
        }
        diario.push(`conteudo:${id}`);
        marcadoresDeConteudo.delete(id);
        conteudos.delete(id);
        return true;
      },
      exclusaoDefinitivaDeComentario() {
        throw new Error('sem comentario neste mundo');
      },
    },
  };
}

// ── O PASSO 1: O INSTANTE LIMITE ────────────────────────────────────────────

test('o instante limite e o do legado, e o relogio e lido UMA vez por execucao', () => {
  const caso = comandos();
  caso.porta.responder([]);
  caso.porta.responder([]);

  const resultado = coletarALixeiraVencida(caso.contexto);

  // `$delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )`
  // (`wp-includes/functions.php:6977`).
  assert.equal(resultado.instanteLimite, LIMITE_DE_FABRICA);
  // UMA leitura: as duas varreduras comparam o MESMO instante. Uma coleta que
  // relesse o relogio antes do laco dos comentarios moveria a propria borda.
  assert.equal(caso.leiturasDeRelogio(), 1);
});

test('o prazo vem do contexto, e o prazo zero poe o limite no proprio agora', () => {
  const caso = comandos({ prazoDeRetencao: { diasNaLixeira: 0 } });
  caso.porta.responder([]);
  caso.porta.responder([]);

  // A coleta NAO pergunta se a lixeira esta ligada: `wp_scheduled_delete()` nao
  // testa `EMPTY_TRASH_DAYS` por verdade, so o usa na aritmetica. Com zero, todo
  // marcador gravado antes de agora vence — inclusive o que entrou na lixeira
  // ANTES de alguem desligar a lixeira.
  assert.equal(coletarALixeiraVencida(caso.contexto).instanteLimite, AGORA);

  // E com prazo negativo o limite cai no FUTURO, como
  // `configuracao/prazo-de-retencao.ts` anunciou. Sem guarda, porque o legado
  // nao tem nenhuma (P1).
  const negativo = comandos({ prazoDeRetencao: { diasNaLixeira: -1 } });
  negativo.porta.responder([]);
  negativo.porta.responder([]);

  assert.equal(
    coletarALixeiraVencida(negativo.contexto).instanteLimite,
    AGORA + SEGUNDOS_POR_DIA,
  );
});

// ── CA-5.2 — A VARREDURA E A EXCLUSAO DO CONTEUDO VENCIDO ───────────────────

test('CA-5.2 a varredura do conteudo e a consulta do legado, com o `<` estritamente menor', () => {
  const caso = comandos();
  caso.porta.responder([]);
  caso.porta.responder([]);

  coletarALixeiraVencida(caso.contexto);

  // `SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_trash_meta_time'
  //  AND meta_value < %d` (`wp-includes/functions.php:6979`).
  assert.equal(
    caso.porta.selecoes[0]?.texto,
    "SELECT post_id FROM wp_postmeta WHERE meta_key = '_wp_trash_meta_time' " +
      'AND meta_value < ?',
  );
  assert.deepEqual(caso.porta.selecoes[0]?.parametros, [LIMITE_DE_FABRICA]);

  // ⚠️ O operador: `<`, e nao `<=`. O registro descartado EXATAMENTE no instante
  // limite ainda nao vence — a borda de UT-052-2 e de PT-004 ("o tempo avanca
  // ate um dia antes do prazo / entao nenhuma das duas o apaga").
  assert.match(caso.porta.selecoes[0]?.texto ?? '', /meta_value < \?$/);
  assert.doesNotMatch(caso.porta.selecoes[0]?.texto ?? '', /<=/);

  // Nem `ORDER BY` nem `LIMIT`: o conjunto inteiro, na ordem do banco.
  assert.doesNotMatch(caso.porta.selecoes[0]?.texto ?? '', /ORDER BY|LIMIT/);
});

test('CA-5.2 o conteudo vencido que esta na lixeira e apagado em definitivo, sem forcar', () => {
  const caso = comandos({
    conteudos: new Map([
      [7, ESTADO_DE_LIXEIRA],
      [9, ESTADO_DE_LIXEIRA],
    ]),
  });
  caso.porta.responder(varridos('post_id', [7, 9]));
  caso.porta.responder([]);

  const resultado = coletarALixeiraVencida(caso.contexto);

  // `wp_delete_post( $post_id )` (`:6993`), um por registro, na ordem varrida.
  assert.deepEqual(caso.conteudosApagados, [7, 9]);
  assert.deepEqual(resultado.conteudosVarridos, [7, 9]);
  assert.equal(resultado.conteudosApagados, 2);

  // E NENHUM comando de escrita sai desta funcao: os marcadores sao apagados
  // DENTRO de `wp_delete_post()` (`wp-includes/post.php:3889`), que e ligacao
  // tardia. Uma coleta que os apagasse aqui tambem emitiria o dobro de comandos.
  assert.deepEqual(caso.porta.escritas, []);
});

test('CA-5.2 identificador zero e saltado: nao se le o registro e nao se apaga marcador', () => {
  const caso = comandos({ conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]) });
  // O `(int)` do legado (`:6982`) sobre o que o driver devolveu como texto.
  caso.porta.responder(varridos('post_id', ['0', '7']));
  caso.porta.responder([]);

  const resultado = coletarALixeiraVencida(caso.contexto);

  // `if ( ! $post_id ) { continue; }` (`:6983`) — um `continue`, nao um `break`:
  // o registro seguinte e tratado.
  assert.deepEqual(resultado.conteudosVarridos, [0, 7]);
  assert.deepEqual(caso.conteudosApagados, [7]);
  assert.deepEqual(caso.porta.escritas, []);
  // So as duas varreduras: nenhuma leitura de marcador para o zero.
  assert.equal(caso.porta.selecoes.length, 2);
});

test('CA-5.2 o marcador de um conteudo que saiu da lixeira apaga SO o marcador, na ordem do legado', () => {
  // `R6` / BR-MIGRAR-035, que e tambem CA-7.1 e CA-7.2 de US-7: o ramo e uma
  // das duas pernas do `if` desta funcao. O que T015 acrescenta e CA-7.3.
  const caso = comandos({ conteudos: new Map([[7, 'draft']]) });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder([{ meta_id: 11 }]);
  caso.porta.responder([{ meta_id: 12 }]);
  caso.porta.responder([]);

  const resultado = coletarALixeiraVencida(caso.contexto);

  // O registro NAO e apagado.
  assert.deepEqual(caso.conteudosApagados, []);
  assert.equal(resultado.conteudosApagados, 0);

  // ⚠️ A ordem: estado anterior (`:6990`) e DEPOIS instante (`:6991`).
  assert.deepEqual(caso.porta.selecoes[1]?.parametros, [
    MARCADOR_DE_ESTADO_ANTERIOR,
    7,
  ]);
  assert.deepEqual(caso.porta.selecoes[2]?.parametros, [
    MARCADOR_DO_INSTANTE_DO_DESCARTE,
    7,
  ]);
  // Dois comandos por marcador: `SELECT meta_id` e so entao `DELETE`.
  assert.equal(caso.porta.escritas.length, 2);
  assert.match(
    caso.porta.escritas[0]?.texto ?? '',
    /^DELETE FROM wp_postmeta/,
  );
});

test('CA-5.2 o marcador de um conteudo que nao existe mais cai no MESMO ramo', () => {
  // A outra metade de `! $del_post ||` (`:6989`).
  const caso = comandos({ conteudos: new Map() });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder([]); // `SELECT meta_id` sem linha...
  caso.porta.responder([]); // ...nas duas chaves.
  caso.porta.responder([]);

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.conteudosApagados, []);
  // E o caso comum de US-7: sem linha no `SELECT meta_id`, o `DELETE` NAO sai
  // (`wp-includes/meta.php:468`). Lista vazia aqui e afirmacao, nao ausencia.
  assert.deepEqual(caso.porta.escritas, []);
});

// ── CA-5.3 — OS COMENTARIOS, PELO MESMO CRITERIO ────────────────────────────

test('CA-5.3 a varredura do comentario usa o MESMO instante limite, sobre commentmeta', () => {
  const caso = comandos();
  caso.porta.responder([]);
  caso.porta.responder([]);

  coletarALixeiraVencida(caso.contexto);

  // `:6997`, a gemea de `:6979`.
  assert.equal(
    caso.porta.selecoes[1]?.texto,
    "SELECT comment_id FROM wp_commentmeta WHERE meta_key = " +
      "'_wp_trash_meta_time' AND meta_value < ?",
  );
  // O MESMO numero do passo 1, e nao um `time()` relido.
  assert.deepEqual(caso.porta.selecoes[1]?.parametros, [LIMITE_DE_FABRICA]);
});

test('CA-5.3 o comentario vencido na lixeira e apagado, e a exclusao recebe o REGISTRO', () => {
  const caso = comandos({
    comentarios: new Map([[42, ESTADO_DE_LIXEIRA]]),
  });
  caso.porta.responder([]);
  caso.porta.responder(varridos('comment_id', [42]));

  const resultado = coletarALixeiraVencida(caso.contexto);

  // ⚠️ `wp_delete_comment( $del_comment )` (`:7011`) passa o OBJETO, enquanto o
  // laco do conteudo passa o identificador (`:6993`). A forma da chamada e
  // observavel na sequencia: passar o identificador faria sair uma leitura que
  // no legado nao sai.
  assert.deepEqual(caso.comentariosApagados, [
    { id: 42, estado: ESTADO_DE_LIXEIRA },
  ]);
  assert.equal(resultado.comentariosApagados, 1);
});

test('CA-5.3 o marcador de comentario inconsistente apaga na ordem INVERTIDA', () => {
  const caso = comandos({ comentarios: new Map([[42, '1']]) });
  caso.porta.responder([]);
  caso.porta.responder(varridos('comment_id', [42]));
  caso.porta.responder([{ meta_id: 21 }]);
  caso.porta.responder([{ meta_id: 22 }]);

  coletarALixeiraVencida(caso.contexto);

  assert.deepEqual(caso.comentariosApagados, []);
  // ⚠️ Instante PRIMEIRO (`:7008`), estado DEPOIS (`:7009`) — o contrario do
  // laco do conteudo. A assimetria e do legado e nao tem razao legivel; sao
  // quatro comandos por registro, logo ela aparece inteira na sequencia que a
  // paridade compara. Normalizar as duas ordens e divergencia sem referencia.
  assert.deepEqual(caso.porta.selecoes[2]?.parametros, [
    MARCADOR_DO_INSTANTE_DO_DESCARTE,
    42,
  ]);
  assert.deepEqual(caso.porta.selecoes[3]?.parametros, [
    MARCADOR_DE_ESTADO_ANTERIOR,
    42,
  ]);
  assert.match(
    caso.porta.escritas[0]?.texto ?? '',
    /^DELETE FROM wp_commentmeta/,
  );
});

test('a ordem dos dois lacos e conteudo primeiro, comentario depois', () => {
  const caso = comandos({
    conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]),
    comentarios: new Map([[42, ESTADO_DE_LIXEIRA]]),
  });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder(varridos('comment_id', [42]));

  coletarALixeiraVencida(caso.contexto);

  // E observavel: apagar um conteudo apaga os comentarios dele em cascata, logo
  // o comentario que chega ao segundo laco e o que foi para a lixeira POR SI.
  assert.match(caso.porta.selecoes[0]?.texto ?? '', /FROM wp_postmeta/);
  assert.match(caso.porta.selecoes[1]?.texto ?? '', /FROM wp_commentmeta/);
  assert.deepEqual(caso.conteudosApagados, [7]);
  assert.equal(caso.comentariosApagados.length, 1);
});

// ── CA-5.4 — RETOMADA SEM APAGAR DUAS VEZES NEM SALTAR REGISTRO ─────────────

test('CA-5.4 a execucao interrompida no meio deixa parte apagada, e nao aborta em silencio', () => {
  const caso = mundo({ interromperEm: 2 });
  for (const id of [1, 2, 3]) {
    caso.conteudos.set(id, ESTADO_DE_LIXEIRA);
    caso.marcadoresDeConteudo.set(id, 0);
  }

  // Nao ha `try`/`catch` na coleta, e nao ha transacao (BR-MIGRAR-104): a falha
  // sobe, a requisicao que avancava a fila morre e o que ja foi apagado FICA
  // apagado. UC-11 registra o caso nas excecoes.
  assert.throws(() => coletarALixeiraVencida(caso.contexto), {
    message: 'execucao interrompida',
  });

  assert.deepEqual(caso.diario, ['conteudo:1']);
  // 1 perdeu o marcador junto com a linha; 2 e 3 continuam com o marcador.
  assert.deepEqual([...caso.marcadoresDeConteudo.keys()], [2, 3]);
});

test('CA-5.4 a execucao seguinte retoma de onde parou, sem apagar duas vezes nem saltar registro', () => {
  const interrompida = mundo({ interromperEm: 2 });
  for (const id of [1, 2, 3]) {
    interrompida.conteudos.set(id, ESTADO_DE_LIXEIRA);
    interrompida.marcadoresDeConteudo.set(id, 0);
  }
  assert.throws(() => coletarALixeiraVencida(interrompida.contexto));

  // A retomada e o MESMO mundo, sem cursor, sem ponto de partida e sem nada
  // gravado sobre o progresso: o marcador E a fila.
  const retomada = mundo();
  for (const [id, estado] of interrompida.conteudos) {
    retomada.conteudos.set(id, estado);
  }
  for (const [id, instante] of interrompida.marcadoresDeConteudo) {
    retomada.marcadoresDeConteudo.set(id, instante);
  }

  const resultado = coletarALixeiraVencida(retomada.contexto);

  // Nao salta registro: quem ainda tinha marcador entrou na varredura.
  assert.deepEqual(resultado.conteudosVarridos, [2, 3]);
  // Nao apaga duas vezes: o 1 nao tem mais marcador, logo nem foi varrido.
  assert.deepEqual(retomada.diario, ['conteudo:2', 'conteudo:3']);
  assert.deepEqual([...retomada.marcadoresDeConteudo.keys()], []);
  assert.deepEqual([...retomada.conteudos.keys()], []);
});

test('CA-5.4 a coleta nao guarda cursor nem recebe ponto de partida', () => {
  const caso = mundo();
  caso.conteudos.set(5, ESTADO_DE_LIXEIRA);
  caso.marcadoresDeConteudo.set(5, 0);

  coletarALixeiraVencida(caso.contexto);
  assert.deepEqual(caso.diario, ['conteudo:5']);

  // Rodar de novo sobre o mundo vazio nao apaga nada e nao falha: a
  // idempotencia vem do marcador, nao de memoria da execucao anterior.
  const denovo = coletarALixeiraVencida(caso.contexto);
  assert.deepEqual(denovo.conteudosVarridos, []);
  assert.equal(denovo.registrosApagados, 0);
  assert.deepEqual(caso.diario, ['conteudo:5']);
});

// ── CA-5.5 — A CONTAGEM, E O QUE ELA NAO E ──────────────────────────────────

test('CA-5.5 cada execucao devolve quantos registros apagou, somando as duas familias', () => {
  const caso = comandos({
    conteudos: new Map([
      [7, ESTADO_DE_LIXEIRA],
      [9, ESTADO_DE_LIXEIRA],
    ]),
    comentarios: new Map([[42, ESTADO_DE_LIXEIRA]]),
  });
  caso.porta.responder(varridos('post_id', [7, 9]));
  caso.porta.responder(varridos('comment_id', [42]));

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.equal(resultado.conteudosApagados, 2);
  assert.equal(resultado.comentariosApagados, 1);
  assert.equal(resultado.registrosApagados, 3);
});

test('CA-5.5 a contagem NAO e gravada: nenhum comando sai para persisti-la', () => {
  const caso = comandos({
    conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]),
    comentarios: new Map([[42, ESTADO_DE_LIXEIRA]]),
  });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder(varridos('comment_id', [42]));

  const resultado = coletarALixeiraVencida(caso.contexto);

  assert.equal(resultado.registrosApagados, 2);
  // 🔴 Este e o limite de CA-5.5 nesta entrega. O legado nao guarda registro
  // nenhum de execucao (UC-11: "nenhum registro do que foi apagado foi
  // guardado"), o P7 permite ACRESCENTAR registro mas o criterio o torna
  // obrigatorio, e `spec.md` declara isso como divergencia a ser aceita
  // explicitamente — aceitacao que nao existe. `ESC-RETENCAO` (BR-MIGRAR-113)
  // ainda proibe inventar o prazo de retencao que o registro novo precisaria.
  // Gravar um aqui seria decidir no lugar de quem decide.
  assert.deepEqual(caso.porta.escritas, []);
});

test('a contagem conta o que a exclusao informou, e nenhum ramo depende dela (P7)', () => {
  const caso = comandos({
    conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]),
    exclusaoDeConteudoFunciona: false,
  });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder([]);

  const resultado = coletarALixeiraVencida(caso.contexto);

  // A exclusao foi CHAMADA — o legado chama e ignora o retorno (`:6993` e
  // expressao solta) — e o fluxo seguiu igual; so a contagem difere.
  assert.deepEqual(caso.conteudosApagados, [7]);
  assert.equal(resultado.conteudosApagados, 0);
  assert.equal(resultado.registrosApagados, 0);
  // Nada foi "compensado": nenhum marcador foi apagado por causa da falha.
  assert.deepEqual(caso.porta.escritas, []);
});

// ── CA-5.1 — O QUE ESTA ENTREGA DECLARA, E NAO DECIDE ──────────────────────

test('CA-5.1 a coleta nao toca a fila agendada: ela e a tarefa, nao o agendamento', () => {
  const caso = comandos({ conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]) });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder([]);

  coletarALixeiraVencida(caso.contexto);

  // O contexto da coleta **nao tem** porta de fila: `wp_scheduled_delete()` nao
  // consulta a fila e nao reagenda nada, porque o evento e recorrente. Se a
  // operacao agendasse, ela teria decidido por omissao o conflito de CA-5.1 —
  // e `../modulo.test.ts` afirma o mesmo do outro lado, na composicao.
  assert.equal('filaAgendada' in caso.contexto, false);
  assert.equal('varredura' in caso.contexto, true);
});

test('CA-5.1 o registro do evento existe como funcao, com o gancho e a recorrencia do legado', () => {
  // 🔴 Isto NAO fecha CA-5.1. O corpo de `wp-admin/admin.php:107`-`:109` e
  // identico nos dois lados do conflito; o que esta em disputa e ONDE ele e
  // chamado, e nenhum arquivo desta arvore o chama. Ver a secao 🔴 de
  // `agendamento-da-coleta.ts`.
  const fila = filaVigiada();
  const { relogio } = relogioFixo();

  const registro = registrarAColeta({
    filaAgendada: fila.fila,
    relogio,
    instalando: false,
  });

  assert.equal(GANCHO_DA_COLETA, 'wp_scheduled_delete');
  assert.equal(RECORRENCIA_DA_COLETA, 'daily');
  assert.equal(registro.desfecho, 'pedido-a-fila');
  assert.deepEqual(fila.consultas, ['wp_scheduled_delete']);
  assert.deepEqual(fila.agendamentos, [
    {
      gancho: 'wp_scheduled_delete',
      // `time()`: o primeiro disparo e o instante da PROPRIA requisicao que
      // registrou, e nao a meia-noite.
      primeiroDisparoEmSegundos: AGORA,
      recorrencia: 'daily',
    },
  ]);
});

test('o evento ja na fila nao e reagendado, e `wp_installing()` nem e avaliado', () => {
  const agendamentos: EventoRecorrente[] = [];
  let leiturasDeInstalando = 0;

  const registro = registrarAColeta({
    filaAgendada: {
      proximaOcorrencia() {
        return 1_700_000_500;
      },
      agendarRecorrente(evento) {
        agendamentos.push(evento);
        return { agendado: true };
      },
    },
    relogio: relogioFixo().relogio,
    // Em PHP o `&&` curto-circuita: com o evento na fila, `wp_installing()`
    // nao e chamada (`wp-admin/admin.php:107`).
    get instalando() {
      leiturasDeInstalando += 1;
      return false;
    },
  });

  assert.equal(registro.desfecho, 'ja-na-fila');
  assert.equal(registro.proximaOcorrencia, 1_700_000_500);
  assert.deepEqual(agendamentos, []);
  assert.equal(leiturasDeInstalando, 0);
});

test('durante a instalacao o evento nao e registrado', () => {
  const fila = filaVigiada();

  const registro = registrarAColeta({
    filaAgendada: fila.fila,
    relogio: relogioFixo().relogio,
    instalando: true,
  });

  assert.equal(registro.desfecho, 'instalando');
  assert.deepEqual(fila.agendamentos, []);
});

test('a recusa da fila volta como valor, sem lancar (P7)', () => {
  const registro = registrarAColeta({
    filaAgendada: {
      proximaOcorrencia() {
        return null;
      },
      agendarRecorrente() {
        return { agendado: false, motivo: 'evento duplicado' };
      },
    },
    relogio: relogioFixo().relogio,
    instalando: false,
  });

  // No legado o retorno de `wp_schedule_event()` e descartado e nada e
  // registrado: a visita ao painel segue igual se a fila nao aceitou.
  assert.equal(registro.desfecho, 'pedido-a-fila');
  assert.equal(registro.resultado?.agendado, false);
});

// ── A DECLARACAO QUE O P4 COBRA ─────────────────────────────────────────────

test('a coleta roda sem ator e sem capacidade: o prazo e a autorizacao (UC-11)', () => {
  const caso = comandos({ conteudos: new Map([[7, ESTADO_DE_LIXEIRA]]) });
  caso.porta.responder(varridos('post_id', [7]));
  caso.porta.responder([]);

  // O contexto desta operacao nao tem `base` nem `ator`, ao contrario do de
  // descarte: UC-11 e literal — "nenhuma. A coleta roda sem usuario autenticado
  // e sem verificacao de capacidade: o prazo e a autorizacao". O P4 manda que
  // essa ausencia esteja DECLARADA, porque uma matriz que a ignore descreve um
  // sistema mais fechado do que o real.
  assert.equal('base' in caso.contexto, false);
  assert.equal('ator' in caso.contexto, false);

  const resultado = coletarALixeiraVencida(caso.contexto);
  assert.equal(resultado.registrosApagados, 1);
});
