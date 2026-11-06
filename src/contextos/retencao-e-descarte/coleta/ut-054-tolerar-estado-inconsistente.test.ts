/**
 * A entrega de **T016** da feature `005-retencao-e-descarte`: *"4 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-054-1, UT-054-2, UT-054-3, UT-054-4), com o mesmo dado de entrada, acao e
 * resultado esperado. O teste de regra de negocio (UT-054-4) entra na mesma
 * suite."*
 *
 * ---
 *
 * # Os quatro casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-054 e a secao *"Tolerar estado inconsistente na coleta, sem apagar
 * o que nao deve"* de `backlog/tests.md`, e os quatro casos sao as linhas `:834`
 * a `:837`, com **ID, nome, tipo e prova**. Esta suite copia os quatro campos de
 * cada um, na ordem do catalogo, e cada `test()` leva o ID e o nome do caso no
 * titulo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | o que a prova e |
 * |---|---|---|---|
 * | `UT-054-1` | remove só a marca do registro que já não está na lixeira | `erro` | CA-7.1 |
 * | `UT-054-2` | segue para o registro seguinte em lugar de abortar a execução | `erro` | CA-7.2 |
 * | `UT-054-3` | registra cada inconsistência com identificador do registro e instante | `feliz` | CA-7.3 |
 * | `UT-054-4` | preserva o conteúdo inconsistente apagando apenas o metadado | `erro` | a regra `R6` (BR-MIGRAR-035) |
 *
 * O catalogo da nome, tipo e prova, e **nao** o dado literal. O dado sai de
 * UC-11, fluxo alternativo *"O registro nao esta mais na lixeira"* (*"a rotina
 * apaga so o metadado e segue; o registro nao e apagado"*), e de UC-10, que diz
 * o mesmo na linha da excecao *"O registro nao esta mais em `trash`"*. Os dois
 * jeitos de um registro sair da lixeira **por outro caminho** — ter o estado
 * trocado sem passar pela restauracao, ou nao existir mais — sao as duas metades
 * da guarda do legado, e os dois aparecem em cada caso.
 *
 * ---
 *
 * # Nao e a suite de criterio de T015
 *
 * T015 tem a dela em `./us-7-tolerar-estado-inconsistente.test.ts`, que chama a
 * coleta sobre a porta falsa de T002 com as respostas programadas em fila e vai
 * alem do criterio (a interrupcao entre os dois marcadores, o relogio lido uma
 * vez, a coleta identica sem canal). Esta suite fica no que o catalogo escreveu
 * e **sai pela tabela**: atras da porta ha `{site}postmeta` e
 * `{site}commentmeta` em memoria, que respondem a consulta que chegar, e cada
 * caso compara o **retrato** das tabelas antes e depois e a **sequencia de
 * comandos** — o *"snapshot + sequencia de comandos"* da area 3 da Decisao 2 de
 * `parity_specs.md`. Consulta que a tabela nao reconhece **falha o teste**: e
 * assim que *"nenhum outro comando"* fica afirmado, e nao suposto.
 *
 * `{site}posts` e `{site}comments` ficam do lado das colaboracoes
 * (`get_post()`, `get_comment()`, `wp_delete_post()`, `wp_delete_comment()`),
 * como no contexto da coleta: sao de BC-02 e BC-03 e chegam por ligacao tardia.
 * A exclusao definitiva aqui so tira a linha e os metadados dela — o que ela faz
 * por dentro e de T017/T018.
 *
 * ---
 *
 * # Como se confere
 *
 * Cada afirmacao cita linha do sistema analisado, relida nesta tarefa contra a
 * arvore 7.1.2 legivel em disco:
 *
 * | o que | onde |
 * |---|---|
 * | `$delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )` | `wp-includes/functions.php:6977` |
 * | a varredura de `{site}postmeta` por `meta_value < %d` | `wp-includes/functions.php:6979` |
 * | `if ( ! $del_post \|\| 'trash' !== $del_post->post_status )` | `wp-includes/functions.php:6989` |
 * | `delete_post_meta( ..., '_wp_trash_meta_status' )`, depois `'_wp_trash_meta_time'` | `wp-includes/functions.php:6990`-`:6991` |
 * | `wp_delete_post( $post_id )`, no outro ramo | `wp-includes/functions.php:6993` |
 * | a varredura de `{site}commentmeta`, pelo mesmo instante | `wp-includes/functions.php:6997` |
 * | `if ( ! $del_comment \|\| 'trash' !== $del_comment->comment_approved )` | `wp-includes/functions.php:7007` |
 * | `delete_comment_meta( ..., '_wp_trash_meta_time' )`, depois `'_wp_trash_meta_status'` — **invertido** | `wp-includes/functions.php:7008`-`:7009` |
 * | `wp_delete_comment( $del_comment )`, no outro ramo | `wp-includes/functions.php:7011` |
 *
 * A spec de paridade e
 * `.specify/migration/parity_tests/04-retencao-e-coleta-da-lixeira.feature`
 * (PT-004). Ela pede um oraculo com relogio controlavel, que e `scripts/oraculo/`
 * da feature 015 (resposta 16 de `questions.md`): aqui o relogio e
 * {@link AGORA_EM_SEGUNDOS}, e o banco e a tabela em memoria.
 *
 * ⚠️ **UT-054-3 afirma um registro que o legado NAO faz.** O ramo de `R6` apaga
 * os dois marcadores e segue, sem registro de erro e sem ponto de extensao. O
 * evento e o acrescimo de T015, so escrita e opcional, sob o **P7** da
 * constituicao (*"registro e diagnostico novos podem ser acrescentados, mas
 * nenhuma decisao do sistema pode passar a depender deles"*) — a justificativa e
 * o limite estao em `./registro-de-inconsistencia.ts`. Por isso UT-054-3 afirma
 * tambem que **as tabelas e os comandos sao os mesmos sem o canal**: o evento
 * existe, e o observavel do legado nao mudou.
 *
 * ---
 *
 * # O que esta suite NAO afirma, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o que `wp_delete_post()` e `wp_delete_comment()` fazem por dentro | **T017** e **T018** (US-8) |
 * | a varredura do prazo, o `<` estrito e o salto do identificador zero | **T011** e **T012** (US-5) |
 * | quem agenda a coleta | CA-5.1, resolvido pela paridade em 01/11/2026 (`spec.md`, *Perguntas em aberto*) |
 * | a interrupcao entre os dois marcadores e a retomada | `./us-7-tolerar-estado-inconsistente.test.ts` (T015) — nenhum caso do catalogo a pede |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T016 exige.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarCanalQueRegistra,
  type CanalQueRegistra,
} from '../../../plataforma/registro-de-operacao/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
  criarArmazenamentoDeRetencao,
} from '../armazenamento/index.js';
import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
} from '../configuracao/index.js';
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
} from '../portas/index.js';
import {
  ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
  SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
  coletarALixeiraVencida,
  criarVarreduraDoVencido,
  type ContextoDeColeta,
  type RegistroNaColeta,
  type ResultadoDaColeta,
} from './index.js';

/* ── O DADO ───────────────────────────────────────────────────────────────── */

/** O `time()` da coleta (`wp-includes/functions.php:6977`). */
const AGORA_EM_SEGUNDOS = 1_700_000_000;

/** O instante do evento de CA-7.3, que vem da colaboracao e nao do relogio. */
const AGORA_EM_MILISSEGUNDOS = 1_700_000_000_250;

/** Descartado ha 31 dias: um dia alem dos 30 de fabrica, logo vencido. */
const DESCARTADO_HA_31_DIAS = String(
  AGORA_EM_SEGUNDOS - 31 * SEGUNDOS_POR_DIA,
);

/** Conteudo que voltou a `draft` sem passar pela restauracao. */
const RASCUNHO_QUE_SAIU = 7;
/** Conteudo ainda na lixeira, vencido: o que a coleta apaga de fato. */
const NA_LIXEIRA = 8;
/** Conteudo cuja linha nao existe mais, com os marcadores orfaos. */
const QUE_NAO_EXISTE = 9;
/** Outro conteudo ainda na lixeira, depois do inconsistente na varredura. */
const NA_LIXEIRA_DEPOIS = 10;

/** Comentario aprovado (`'1'`) com marca de lixeira vencida. */
const COMENTARIO_APROVADO = 41;
/** Comentario na lixeira, vencido. */
const COMENTARIO_NA_LIXEIRA = 42;
/** Comentario cuja linha nao existe mais. */
const COMENTARIO_QUE_NAO_EXISTE = 43;

/* ── AS TABELAS ───────────────────────────────────────────────────────────── */

/** Uma linha de `{site}postmeta` ou de `{site}commentmeta`. */
interface LinhaDeMeta {
  readonly meta_id: number;
  readonly objeto: number;
  readonly meta_key: string;
  readonly meta_value: string;
}

interface Banco {
  /** `{site}posts`, nas duas colunas que a guarda le. */
  readonly posts: Map<number, string>;
  /** `{site}comments`, idem (`comment_approved`). */
  readonly comentarios: Map<number, string>;
  postmeta: LinhaDeMeta[];
  commentmeta: LinhaDeMeta[];
}

/** Os tres marcadores que `wp_trash_post()` deixa num conteudo descartado. */
function marcadoresDoConteudo(
  primeiroMetaId: number,
  conteudoId: number,
  estadoAnterior: string,
): LinhaDeMeta[] {
  return [
    {
      meta_id: primeiroMetaId,
      objeto: conteudoId,
      meta_key: MARCADOR_DE_ESTADO_ANTERIOR,
      meta_value: estadoAnterior,
    },
    {
      meta_id: primeiroMetaId + 1,
      objeto: conteudoId,
      meta_key: MARCADOR_DO_INSTANTE_DO_DESCARTE,
      meta_value: DESCARTADO_HA_31_DIAS,
    },
    {
      meta_id: primeiroMetaId + 2,
      objeto: conteudoId,
      meta_key: MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
      meta_value: 'a:0:{}',
    },
  ];
}

/** Os dois marcadores que `wp_trash_comment()` deixa num comentario. */
function marcadoresDoComentario(
  primeiroMetaId: number,
  comentarioId: number,
  estadoAnterior: string,
): LinhaDeMeta[] {
  return [
    {
      meta_id: primeiroMetaId,
      objeto: comentarioId,
      meta_key: MARCADOR_DO_INSTANTE_DO_DESCARTE,
      meta_value: DESCARTADO_HA_31_DIAS,
    },
    {
      meta_id: primeiroMetaId + 1,
      objeto: comentarioId,
      meta_key: MARCADOR_DE_ESTADO_ANTERIOR,
      meta_value: estadoAnterior,
    },
  ];
}

/** Um metadado que nao e da lixeira, e que nenhum caso pode tocar. */
function metadadoAlheio(metaId: number, objeto: number): LinhaDeMeta {
  return { meta_id: metaId, objeto, meta_key: '_edit_last', meta_value: '1' };
}

/**
 * O banco dos quatro casos: as duas metades da guarda nas duas familias, com um
 * registro ainda na lixeira entre elas, na ordem de `meta_id`.
 */
function bancoDoCatalogo(): Banco {
  return {
    posts: new Map([
      [RASCUNHO_QUE_SAIU, 'draft'],
      [NA_LIXEIRA, ESTADO_DE_LIXEIRA],
      [NA_LIXEIRA_DEPOIS, ESTADO_DE_LIXEIRA],
    ]),
    comentarios: new Map([
      [COMENTARIO_APROVADO, '1'],
      [COMENTARIO_NA_LIXEIRA, ESTADO_DE_LIXEIRA],
    ]),
    postmeta: [
      ...marcadoresDoConteudo(100, RASCUNHO_QUE_SAIU, 'publish'),
      metadadoAlheio(103, RASCUNHO_QUE_SAIU),
      ...marcadoresDoConteudo(110, NA_LIXEIRA, 'publish'),
      ...marcadoresDoConteudo(120, QUE_NAO_EXISTE, 'draft'),
      ...marcadoresDoConteudo(130, NA_LIXEIRA_DEPOIS, 'private'),
    ],
    commentmeta: [
      ...marcadoresDoComentario(200, COMENTARIO_APROVADO, '1'),
      ...marcadoresDoComentario(210, COMENTARIO_NA_LIXEIRA, '0'),
      ...marcadoresDoComentario(220, COMENTARIO_QUE_NAO_EXISTE, '1'),
    ],
  };
}

/** O retrato de uma tabela de metadado, para comparar antes e depois. */
function retrato(tabela: readonly LinhaDeMeta[]): string[] {
  return tabela.map(
    (linha) => `${linha.meta_id} ${linha.objeto} ${linha.meta_key}`,
  );
}

/* ── A PORTA DE DADOS ─────────────────────────────────────────────────────── */

const VARREDURA =
  /^SELECT (post_id|comment_id) FROM wp_(postmeta|commentmeta) WHERE meta_key = '_wp_trash_meta_time' AND meta_value < \?$/;
const PROCURA_DE_MARCADOR =
  /^SELECT meta_id FROM wp_(postmeta|commentmeta) WHERE meta_key = \? AND (post_id|comment_id) = \?$/;
const EXCLUSAO_DE_MARCADOR =
  /^DELETE FROM wp_(postmeta|commentmeta) WHERE meta_id IN\( [?,]+ \)$/;

interface PortaDoCatalogo {
  readonly porta: PortaDeDados;
  /** Todo comando, leitura ou escrita, na ordem em que saiu. */
  readonly comandos: Consulta[];
}

/**
 * As duas tabelas de metadado atras da porta. Responde **so** as tres formas de
 * comando que a coleta emite; qualquer outra derruba o teste.
 */
function portaDoCatalogo(banco: Banco): PortaDoCatalogo {
  const comandos: Consulta[] = [];
  const tabela = (nome: string | undefined): LinhaDeMeta[] =>
    nome === 'postmeta' ? banco.postmeta : banco.commentmeta;

  const porta: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    selecionar(consulta) {
      comandos.push(consulta);

      const varredura = VARREDURA.exec(consulta.texto);
      if (varredura !== null) {
        const coluna = varredura[1] ?? '';
        const limite = Number(consulta.parametros[0]);
        // `meta_value` e `longtext` comparado a inteiro: o MySQL converte a
        // coluna em numero.
        return tabela(varredura[2])
          .filter(
            (linha) =>
              linha.meta_key === MARCADOR_DO_INSTANTE_DO_DESCARTE &&
              Number(linha.meta_value) < limite,
          )
          .map((linha): LinhaDeResultado => ({ [coluna]: linha.objeto }));
      }

      const procura = PROCURA_DE_MARCADOR.exec(consulta.texto);
      if (procura !== null) {
        const [chave, objeto] = consulta.parametros;
        return tabela(procura[1])
          .filter((linha) => linha.meta_key === chave && linha.objeto === objeto)
          .map((linha): LinhaDeResultado => ({ meta_id: linha.meta_id }));
      }

      throw new Error(`leitura inesperada: ${consulta.texto}`);
    },
    escrever(consulta) {
      comandos.push(consulta);

      const exclusao = EXCLUSAO_DE_MARCADOR.exec(consulta.texto);
      if (exclusao === null) {
        throw new Error(`escrita inesperada: ${consulta.texto}`);
      }
      const nome = exclusao[1];
      const antes = tabela(nome);
      const depois = antes.filter(
        (linha) => !consulta.parametros.includes(linha.meta_id),
      );
      if (nome === 'postmeta') {
        banco.postmeta = depois;
      } else {
        banco.commentmeta = depois;
      }
      return { linhasAfetadas: antes.length - depois.length, idGerado: null };
    },
  };

  return { porta, comandos };
}

/* ── O CONTEXTO DA COLETA ─────────────────────────────────────────────────── */

interface Execucao {
  readonly resultado: ResultadoDaColeta;
  readonly comandos: readonly Consulta[];
  /** A ordem em que a coleta pediu exclusao definitiva, nas duas familias. */
  readonly exclusoes: readonly string[];
  readonly canal: CanalQueRegistra | null;
}

/**
 * Roda a coleta sobre o banco. Sem `canal`, a coleta e a do legado (P7).
 */
function coletar(banco: Banco, comCanal = true): Execucao {
  const { porta, comandos } = portaDoCatalogo(banco);
  const exclusoes: string[] = [];
  const canal = comCanal ? criarCanalQueRegistra() : null;

  const obter =
    (linhas: ReadonlyMap<number, string>) =>
    (id: number): RegistroNaColeta | null => {
      const estado = linhas.get(id);
      return estado === undefined ? null : { id, estado };
    };

  const contexto: ContextoDeColeta = {
    prazoDeRetencao: PRAZO_DE_RETENCAO_DE_FABRICA,
    relogio: { agoraEmSegundos: () => AGORA_EM_SEGUNDOS },
    varredura: criarVarreduraDoVencido(porta),
    armazenamento: criarArmazenamentoDeRetencao(porta),
    conteudo: { obterPorId: obter(banco.posts) },
    comentario: { obterPorId: obter(banco.comentarios) },
    // `wp_delete_post()` (`:6993`): tira a linha e os metadados dela. O que a
    // exclusao faz alem disso e de T017.
    exclusaoDefinitivaDeConteudo(id) {
      exclusoes.push(`post ${id}`);
      banco.posts.delete(id);
      banco.postmeta = banco.postmeta.filter((linha) => linha.objeto !== id);
      return true;
    },
    // `wp_delete_comment( $del_comment )` (`:7011`), com o registro.
    exclusaoDefinitivaDeComentario(registro) {
      exclusoes.push(`comment ${registro.id}`);
      banco.comentarios.delete(registro.id);
      banco.commentmeta = banco.commentmeta.filter(
        (linha) => linha.objeto !== registro.id,
      );
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
  };

  const resultado = coletarALixeiraVencida(contexto);
  return { resultado, comandos, exclusoes, canal };
}

/** Os metadados de um objeto, por chave, no retrato atual da tabela. */
function chavesDe(tabela: readonly LinhaDeMeta[], objeto: number): string[] {
  return tabela
    .filter((linha) => linha.objeto === objeto)
    .map((linha) => linha.meta_key);
}

/* ── OS QUATRO CASOS ──────────────────────────────────────────────────────── */

test('UT-054-1 remove só a marca do registro que já não está na lixeira', () => {
  // Prova: *"Registro marcado como descartado que ja nao esta na lixeira tem so
  // a marca removida, e nao e apagado"* — CA-7.1, nas duas familias.
  const banco = bancoDoCatalogo();

  const { exclusoes } = coletar(banco);

  // Nao e apagado: a exclusao definitiva nao foi pedida para nenhum dos dois, e
  // as linhas seguem com o estado em que estavam.
  assert.equal(exclusoes.includes(`post ${RASCUNHO_QUE_SAIU}`), false);
  assert.equal(exclusoes.includes(`comment ${COMENTARIO_APROVADO}`), false);
  assert.equal(banco.posts.get(RASCUNHO_QUE_SAIU), 'draft');
  assert.equal(banco.comentarios.get(COMENTARIO_APROVADO), '1');

  // So a marca: o par estado-e-instante (`:6990`-`:6991`, `:7008`-`:7009`). O
  // marcador agrupado dos comentarios nao esta no ramo, e o metadado alheio
  // tambem fica.
  assert.deepEqual(chavesDe(banco.postmeta, RASCUNHO_QUE_SAIU), [
    MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
    '_edit_last',
  ]);
  assert.deepEqual(chavesDe(banco.commentmeta, COMENTARIO_APROVADO), []);
});

test('UT-054-2 segue para o registro seguinte em lugar de abortar a execução', () => {
  // Prova: *"A rotina segue para o registro seguinte em lugar de abortar"* —
  // CA-7.2. A varredura de conteudo traz 7 (fora da lixeira), 8 (na lixeira),
  // 9 (nao existe) e 10 (na lixeira); a de comentario, 41 (aprovado), 42 (na
  // lixeira) e 43 (nao existe).
  const banco = bancoDoCatalogo();

  const { resultado, exclusoes } = coletar(banco);

  assert.deepEqual(resultado.conteudosVarridos, [
    RASCUNHO_QUE_SAIU,
    NA_LIXEIRA,
    QUE_NAO_EXISTE,
    NA_LIXEIRA_DEPOIS,
  ]);
  assert.deepEqual(resultado.comentariosVarridos, [
    COMENTARIO_APROVADO,
    COMENTARIO_NA_LIXEIRA,
    COMENTARIO_QUE_NAO_EXISTE,
  ]);
  // Os registros depois de cada inconsistencia foram tratados, e o laco do
  // comentario rodou depois do laco do conteudo.
  assert.deepEqual(exclusoes, [
    `post ${NA_LIXEIRA}`,
    `post ${NA_LIXEIRA_DEPOIS}`,
    `comment ${COMENTARIO_NA_LIXEIRA}`,
  ]);
  assert.equal(resultado.registrosApagados, 3);
  // E a ultima inconsistencia de cada laco tambem teve a marca removida.
  assert.deepEqual(chavesDe(banco.postmeta, QUE_NAO_EXISTE), [
    MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  ]);
  assert.deepEqual(chavesDe(banco.commentmeta, COMENTARIO_QUE_NAO_EXISTE), []);
});

test('UT-054-3 registra cada inconsistência com identificador do registro e instante', () => {
  // Prova: *"Cada inconsistencia encontrada e registrada com identificador do
  // registro e instante"* — CA-7.3. Um evento por inconsistencia, na ordem da
  // varredura, e nenhum pelos registros apagados normalmente.
  const comCanal = bancoDoCatalogo();
  const execucao = coletar(comCanal);

  const evento = (
    tipo: string,
    registroId: number,
    estadoEncontrado: string | null,
  ) => ({
    instante: AGORA_EM_MILISSEGUNDOS,
    origem: ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
    severidade: SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
    contexto: { tipo, registroId, estadoEncontrado },
  });

  assert.deepEqual(execucao.canal?.eventos, [
    evento(METADADO_DE_CONTEUDO, RASCUNHO_QUE_SAIU, 'draft'),
    evento(METADADO_DE_CONTEUDO, QUE_NAO_EXISTE, null),
    evento(METADADO_DE_COMENTARIO, COMENTARIO_APROVADO, '1'),
    evento(METADADO_DE_COMENTARIO, COMENTARIO_QUE_NAO_EXISTE, null),
  ]);

  // O registro e acrescimo do P7, e nao do legado: sem o canal, as tabelas
  // terminam iguais e os comandos sao os mesmos, na mesma ordem.
  const semCanal = bancoDoCatalogo();
  const legado = coletar(semCanal, false);

  assert.deepEqual(retrato(semCanal.postmeta), retrato(comCanal.postmeta));
  assert.deepEqual(retrato(semCanal.commentmeta), retrato(comCanal.commentmeta));
  assert.deepEqual(legado.comandos, execucao.comandos);
  assert.deepEqual(legado.resultado, execucao.resultado);
});

test('UT-054-4 preserva o conteúdo inconsistente apagando apenas o metadado', () => {
  // Prova: *"R6 — a coleta tolera estado inconsistente: apaga so o metadado e
  // segue"* (BR-MIGRAR-035, `wp-includes/functions.php:6989` e `:7007`).
  // Afirmado pelo retrato das tabelas e pela sequencia de comandos.
  const banco = bancoDoCatalogo();
  const postmetaAntes = retrato(banco.postmeta);
  const commentmetaAntes = retrato(banco.commentmeta);

  const { comandos } = coletar(banco);

  // O conteudo inconsistente continua existindo, com o estado que tinha.
  assert.equal(banco.posts.get(RASCUNHO_QUE_SAIU), 'draft');
  assert.equal(banco.comentarios.get(COMENTARIO_APROVADO), '1');

  // Das tabelas de metadado sumiu exatamente: o par de cada inconsistencia, e
  // tudo o que era dos registros apagados de fato (pela exclusao definitiva).
  const sumiu = (antes: string[], depois: string[]) =>
    antes.filter((linha) => !depois.includes(linha));
  assert.deepEqual(sumiu(postmetaAntes, retrato(banco.postmeta)), [
    `100 ${RASCUNHO_QUE_SAIU} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `101 ${RASCUNHO_QUE_SAIU} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `110 ${NA_LIXEIRA} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `111 ${NA_LIXEIRA} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `112 ${NA_LIXEIRA} ${MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS}`,
    `120 ${QUE_NAO_EXISTE} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `121 ${QUE_NAO_EXISTE} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `130 ${NA_LIXEIRA_DEPOIS} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `131 ${NA_LIXEIRA_DEPOIS} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `132 ${NA_LIXEIRA_DEPOIS} ${MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS}`,
  ]);
  assert.deepEqual(sumiu(commentmetaAntes, retrato(banco.commentmeta)), [
    `200 ${COMENTARIO_APROVADO} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `201 ${COMENTARIO_APROVADO} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `210 ${COMENTARIO_NA_LIXEIRA} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `211 ${COMENTARIO_NA_LIXEIRA} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
    `220 ${COMENTARIO_QUE_NAO_EXISTE} ${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `221 ${COMENTARIO_QUE_NAO_EXISTE} ${MARCADOR_DE_ESTADO_ANTERIOR}`,
  ]);

  // A sequencia: a coleta so le marcadores e so apaga marcadores. Cada
  // inconsistencia e um `SELECT meta_id` e um `DELETE` por marcador — conteudo
  // na ordem estado, instante (`:6990`-`:6991`); comentario na ordem instante,
  // estado (`:7008`-`:7009`). Os registros na lixeira nao emitem comando pela
  // porta: vao para a exclusao definitiva.
  const limite = AGORA_EM_SEGUNDOS - 30 * SEGUNDOS_POR_DIA;
  const procura = (tabela: string, coluna: string, chave: string, id: number) => ({
    texto: `SELECT meta_id FROM wp_${tabela} WHERE meta_key = ? AND ${coluna} = ?`,
    parametros: [chave, id],
  });
  const exclusao = (tabela: string, metaId: number) => ({
    texto: `DELETE FROM wp_${tabela} WHERE meta_id IN( ? )`,
    parametros: [metaId],
  });
  const varredura = (tabela: string, coluna: string) => ({
    texto:
      `SELECT ${coluna} FROM wp_${tabela} ` +
      `WHERE meta_key = '${MARCADOR_DO_INSTANTE_DO_DESCARTE}' AND meta_value < ?`,
    parametros: [limite],
  });

  assert.deepEqual(comandos, [
    varredura('postmeta', 'post_id'),
    procura('postmeta', 'post_id', MARCADOR_DE_ESTADO_ANTERIOR, RASCUNHO_QUE_SAIU),
    exclusao('postmeta', 100),
    procura('postmeta', 'post_id', MARCADOR_DO_INSTANTE_DO_DESCARTE, RASCUNHO_QUE_SAIU),
    exclusao('postmeta', 101),
    procura('postmeta', 'post_id', MARCADOR_DE_ESTADO_ANTERIOR, QUE_NAO_EXISTE),
    exclusao('postmeta', 120),
    procura('postmeta', 'post_id', MARCADOR_DO_INSTANTE_DO_DESCARTE, QUE_NAO_EXISTE),
    exclusao('postmeta', 121),
    varredura('commentmeta', 'comment_id'),
    procura('commentmeta', 'comment_id', MARCADOR_DO_INSTANTE_DO_DESCARTE, COMENTARIO_APROVADO),
    exclusao('commentmeta', 200),
    procura('commentmeta', 'comment_id', MARCADOR_DE_ESTADO_ANTERIOR, COMENTARIO_APROVADO),
    exclusao('commentmeta', 201),
    procura('commentmeta', 'comment_id', MARCADOR_DO_INSTANTE_DO_DESCARTE, COMENTARIO_QUE_NAO_EXISTE),
    exclusao('commentmeta', 220),
    procura('commentmeta', 'comment_id', MARCADOR_DE_ESTADO_ANTERIOR, COMENTARIO_QUE_NAO_EXISTE),
    exclusao('commentmeta', 221),
  ]);
});
