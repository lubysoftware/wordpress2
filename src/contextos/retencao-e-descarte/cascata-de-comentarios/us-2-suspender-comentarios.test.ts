/**
 * Testes da entrega de **T005** (US-2): *"o comportamento de US-2 existe e os
 * criterios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-2**: esses sao **T006**, seis casos registrados em
 * `backlog/tests.md` (UT-048-1 a UT-048-6), que se **transcrevem** do catalogo e
 * nao se reconstroem. Aqui estao os quatro criterios de aceite e o que a
 * implementacao quebraria **em silencio**: a posicao dos quatro pontos de
 * extensao em relacao as duas guardas, a ordem e a contagem dos comandos, os
 * bytes do marcador agrupado e o que sobra quando nenhum comando sai.
 *
 * O criterio desta area de paridade e *"efeito no banco"* — a area 3 da Decisao
 * 2 de `parity_specs.md` manda comparar *"snapshot + sequencia de comandos"* —, e
 * e por isso que a porta falsa de T002 **registra comando** em lugar de simular
 * banco, e que a sequencia de colaboracoes e afirmada numa lista so: um teste
 * que olhasse apenas o estado final passaria com os passos trocados de lugar.
 *
 * O estado dos comentarios de entrada e sempre cadeia do legado (`'1'`, `'0'`,
 * `spam`, `trash`), nunca booleano nem numero: a coluna e `varchar(20)` sem
 * `ENUM` (`DB-ENUM`), e o que viaja para o marcador e o byte que estava nela.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { desserializar } from '../../../plataforma/serializacao/index.js';
import {
  COLUNA_DO_COMENTARIO,
  COLUNA_DO_CONTEUDO_COMENTADO,
  COLUNA_DO_ESTADO_DO_COMENTARIO,
  criarComentariosDoConteudo,
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  textoDoParametro,
} from '../armazenamento/index.js';
import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import type { RegistroNoDescarte } from '../descarte/index.js';
import {
  ESTADO_DA_FILA_DE_MODERACAO,
  ESTADO_DE_SUSPENSAO_EM_CASCATA,
  VOCABULARIO_DA_API_DE_ESTADO,
  alcancavelPelaApiDeEstado,
  cascataNoDescarte,
  estadoAceitoPelaApiDeEstado,
  restaurarComentariosDoConteudo,
  suspenderComentariosDoConteudo,
  type ContextoDaCascataDeComentarios,
  type GanchosDaCascata,
} from './index.js';

// ── Montagem ────────────────────────────────────────────────────────────────

const CONTEUDO_ID = 42;

/** Os estados de comentario que o legado grava na coluna. */
const APROVADO = '1';
const NA_FILA = '0';
const SPAM = 'spam';

interface OpcoesDoCenario {
  /** A linha de `{site}posts` que a porta de BC-01 devolve, ou `null`. */
  readonly registro?: RegistroNoDescarte | null;
  /** O que o `SELECT` de `{site}comments` devolve, na ordem. */
  readonly comentarios?: readonly { readonly id: number; readonly estado: string }[];
  /**
   * O valor do marcador agrupado como ele chega do banco, ou `undefined` para
   * marcador **ausente**. E a entrada da restauracao.
   */
  readonly memoriaGravada?: string;
  readonly ganchos?: GanchosDaCascata;
}

interface Cenario {
  readonly contexto: ContextoDaCascataDeComentarios;
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: readonly {
    texto: string;
    parametros: readonly unknown[];
  }[];
  /** A sequencia de **tudo** — comando, colaboracao e ponto de extensao. */
  readonly sequencia: readonly string[];
  readonly leiturasDeConteudo: readonly number[];
}

/**
 * Monta o contexto da cascata com tudo registrado: os comandos, a leitura de
 * ligacao tardia e os quatro pontos de extensao.
 *
 * A porta de dados de T002 e **envolvida** por outra que escreve na mesma lista
 * de sequencia, como em `us-1-descartar-conteudo.test.ts`: sem isso a
 * interleacao entre comando e ponto de extensao — que e justamente o que a area
 * 3 da Decisao 2 compara — ficaria de fora.
 */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const sequencia: string[] = [];
  const leiturasDeConteudo: number[] = [];

  const registro =
    opcoes.registro === undefined
      ? { id: CONTEUDO_ID, estado: 'trash' }
      : opcoes.registro;

  const falsa = criarPortaDeDadosFalsa();

  // As respostas de leitura, na ordem em que as duas operacoes as pedem. A
  // restauracao le o metadado por `update_meta_cache()`, que devolve a linha
  // inteira; a suspensao le `{site}comments`.
  const linhasDeComentario: LinhaDeResultado[] = (opcoes.comentarios ?? []).map(
    (comentario) => ({
      [COLUNA_DO_COMENTARIO]: comentario.id,
      [COLUNA_DO_ESTADO_DO_COMENTARIO]: comentario.estado,
    }),
  );

  const dados: PortaDeDados = {
    prefixoDeTabela: falsa.porta.prefixoDeTabela,
    selecionar(consulta) {
      if (consulta.texto.includes('comments WHERE comment_post_ID')) {
        sequencia.push('selecionar:comentarios-do-conteudo');
        return linhasDeComentario;
      }
      if (consulta.texto.startsWith('SELECT post_id')) {
        sequencia.push('selecionar:metadado-do-conteudo');
        return opcoes.memoriaGravada === undefined
          ? []
          : [
              {
                post_id: CONTEUDO_ID,
                meta_key: MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
                meta_value: opcoes.memoriaGravada,
              },
            ];
      }
      sequencia.push(`selecionar:${consulta.texto}`);
      // O `SELECT meta_id` que `delete_post_meta()` emite antes do `DELETE`
      // (`wp-includes/meta.php:456`). Linha presente so quando o marcador
      // existe: sem ela o legado **nao** emite o `DELETE` (`:468`).
      if (consulta.texto.startsWith('SELECT meta_id')) {
        return opcoes.memoriaGravada === undefined ? [] : [{ meta_id: 11 }];
      }
      return falsa.porta.selecionar(consulta);
    },
    escrever(consulta) {
      sequencia.push(`escrever:${consulta.texto.split(' ').slice(0, 2).join(' ')}`);
      return falsa.porta.escrever(consulta);
    },
  };

  const ganchosRegistrados: GanchosDaCascata = {
    antesDeSuspender: (conteudoId) => {
      sequencia.push(`gancho:trash_post_comments:${conteudoId}`);
      opcoes.ganchos?.antesDeSuspender?.(conteudoId);
    },
    depoisDeSuspender: (conteudoId, estados) => {
      sequencia.push(
        `gancho:trashed_post_comments:${conteudoId}:${estados.length}`,
      );
      opcoes.ganchos?.depoisDeSuspender?.(conteudoId, estados);
    },
    antesDeRestaurar: (conteudoId) => {
      sequencia.push(`gancho:untrash_post_comments:${conteudoId}`);
      opcoes.ganchos?.antesDeRestaurar?.(conteudoId);
    },
    depoisDeRestaurar: (conteudoId) => {
      sequencia.push(`gancho:untrashed_post_comments:${conteudoId}`);
      opcoes.ganchos?.depoisDeRestaurar?.(conteudoId);
    },
  };

  return {
    contexto: {
      conteudo: {
        obterPorId(conteudoId) {
          sequencia.push(`le-conteudo:${conteudoId}`);
          leiturasDeConteudo.push(conteudoId);
          return registro;
        },
      },
      armazenamento: {
        marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados),
        comentariosDoConteudo: criarComentariosDoConteudo(dados),
      },
      ganchos: ganchosRegistrados,
    },
    escritas: falsa.escritas,
    sequencia,
    leiturasDeConteudo,
  };
}

/** Os bytes de um valor serializado, como a coluna os recebe. */
function bytesDoMarcador(valor: unknown): string {
  return textoDoParametro(valor);
}

// ── CA-2.1 ──────────────────────────────────────────────────────────────────

test('CA-2.1 descartar o conteudo move todos os seus comentarios para post-trashed, em UM comando', () => {
  const cena = cenario({
    comentarios: [
      { id: 5, estado: APROVADO },
      { id: 7, estado: NA_FILA },
      { id: 9, estado: APROVADO },
    ],
  });

  const resultado = suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'suspensos');
  assert.equal(resultado.estadoGravado, ESTADO_DE_SUSPENSAO_EM_CASCATA);

  // `$wpdb->update( $wpdb->comments, array( 'comment_approved' => 'post-trashed'
  // ), array( 'comment_post_ID' => $post_id ) )`
  // (`wp-includes/post.php:4302`): **um** `UPDATE` por conteudo, e nao um por
  // comentario. Tres comentarios, duas escritas no total — o marcador e o
  // `UPDATE`.
  assert.equal(cena.escritas.length, 2);
  assert.equal(
    cena.escritas[1]?.texto,
    `UPDATE wp_comments SET ${COLUNA_DO_ESTADO_DO_COMENTARIO} = ? ` +
      `WHERE ${COLUNA_DO_CONTEUDO_COMENTADO} = ?`,
  );
  assert.deepEqual(cena.escritas[1]?.parametros, [
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
    CONTEUDO_ID,
  ]);
});

test('CA-2.1 a ordem dos oito passos e a do legado, comando por comando', () => {
  const cena = cenario({
    comentarios: [{ id: 5, estado: APROVADO }],
  });

  suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // E esta lista que um porte troca sem quebrar nenhuma afirmacao de estado
  // final. Os dois pontos criticos: a acao `trash_post_comments` vem ANTES do
  // `SELECT` (`:4286`), e o marcador e gravado ANTES do `UPDATE` (`:4299` e
  // `:4302`) — se fosse depois, o mapa guardado leria `post-trashed` para todo
  // mundo e a memoria de CA-2.2 seria memoria de nada.
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `gancho:trash_post_comments:${CONTEUDO_ID}`,
    'selecionar:comentarios-do-conteudo',
    'escrever:INSERT INTO',
    'escrever:UPDATE wp_comments',
    `gancho:trashed_post_comments:${CONTEUDO_ID}:1`,
  ]);
});

test('CA-2.1 a cascata nao pergunta se o conteudo esta na lixeira: ela obedece', () => {
  // `wp_trash_post_comments()` le o conteudo e usa dele so o `ID` (`:4277`):
  // nenhuma guarda sobre `post_status`. E superficie publicada (P8), e
  // `wp_delete_post()` a usa assim.
  const cena = cenario({
    registro: { id: CONTEUDO_ID, estado: 'publish' },
    comentarios: [{ id: 5, estado: APROVADO }],
  });

  const resultado = suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'suspensos');
  assert.equal(cena.escritas.length, 2);
});

test('CA-2.1 conteudo sem linha devolve silencio, sem emitir comando nem ponto de extensao', () => {
  const cena = cenario({ registro: null });

  const resultado = suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // `if ( ! $post ) return null;` (`:4273`-`:4275`): o **P7** manda preservar o
  // silencio, e aqui nem a primeira acao dispara.
  assert.equal(resultado.desfecho, 'inexistente');
  assert.deepEqual(resultado.estadosGuardados, []);
  assert.equal(resultado.linhasAfetadas, null);
  assert.deepEqual([...cena.escritas], []);
  assert.deepEqual(cena.sequencia, [`le-conteudo:${CONTEUDO_ID}`]);
});

test('CA-2.1 conteudo sem comentario nao grava nada — mas a PRIMEIRA acao ja disparou', () => {
  const cena = cenario({ comentarios: [] });

  const resultado = suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // `if ( ! $comments ) return null;` (`:4290`-`:4292`), **depois** de
  // `do_action( 'trash_post_comments', $post_id )` (`:4286`). Um porte que
  // movesse a acao para depois da guarda — a leitura "limpa" — apagaria o unico
  // sinal que a extensao recebe nesse caso.
  assert.equal(resultado.desfecho, 'sem-comentarios');
  assert.equal(resultado.estadoGravado, null);
  assert.equal(resultado.linhasAfetadas, null);
  assert.deepEqual([...cena.escritas], []);
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `gancho:trash_post_comments:${CONTEUDO_ID}`,
    'selecionar:comentarios-do-conteudo',
  ]);
});

// ── CA-2.2 ──────────────────────────────────────────────────────────────────

test('CA-2.2 o estado anterior de cada comentario e guardado agrupado, no metadado do CONTEUDO', () => {
  const cena = cenario({
    comentarios: [
      { id: 5, estado: APROVADO },
      { id: 7, estado: NA_FILA },
    ],
  });

  const resultado = suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.deepEqual(
    resultado.estadosGuardados.map((guardado) => [
      guardado.comentarioId,
      guardado.estado,
    ]),
    [
      [5, APROVADO],
      [7, NA_FILA],
    ],
  );

  // `add_post_meta( $post_id, '_wp_trash_meta_comments_status', $statuses )`
  // (`:4299`): a chave e do CONTEUDO, nao do comentario — nao existe gemea em
  // `{site}commentmeta`. E e um `INSERT`, sem `SELECT` antes: `add_post_meta()`
  // sem `$unique`.
  assert.equal(
    cena.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.equal(cena.escritas[0]?.parametros[0], CONTEUDO_ID);
  assert.equal(
    cena.escritas[0]?.parametros[1],
    MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  );
});

test('CA-2.2 os bytes do marcador levam a chave do comentario como INTEIRO, na ordem do SELECT', () => {
  const cena = cenario({
    comentarios: [
      // Ordem deliberadamente nao crescente: o `SELECT` do legado nao tem
      // `ORDER BY` (`:4288`), e e a ordem dele que sai nos bytes.
      { id: 9, estado: SPAM },
      { id: 5, estado: APROVADO },
    ],
  });

  suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // `$statuses[ $comment->comment_ID ] = ...` passa pela normalizacao de chave
  // do PHP: o identificador chega do driver como cadeia numerica e vira chave
  // **inteira**. Logo `i:9`, nao `s:1:"9"`. Ordenar aqui "para estabilizar"
  // mudaria estes bytes, que sao o criterio da area 3 da Decisao 2.
  assert.equal(
    bytesDoMarcador(cena.escritas[0]?.parametros[2]),
    'a:2:{i:9;s:4:"spam";i:5;s:1:"1";}',
  );
});

test('CA-2.2 a memoria e lida de volta igual ao que foi gravado', () => {
  const gravada = cenario({
    comentarios: [
      { id: 5, estado: APROVADO },
      { id: 7, estado: NA_FILA },
    ],
  });
  suspenderComentariosDoConteudo(gravada.contexto, CONTEUDO_ID);
  const bytes = bytesDoMarcador(gravada.escritas[0]?.parametros[2]);

  // O mesmo byte volta pelo leitor de T002, que e o que a restauracao usa.
  const lida = cenario({ memoriaGravada: bytes });
  const resultado = restaurarComentariosDoConteudo(lida.contexto, CONTEUDO_ID);

  assert.deepEqual(
    resultado.estadosGuardados.map((guardado) => [
      guardado.comentarioId,
      guardado.estado,
    ]),
    [
      [5, APROVADO],
      [7, NA_FILA],
    ],
  );
  // A forma serializada e a do legado, e a conformidade dela e da plataforma:
  // o leitor de `plataforma/serializacao/` le os mesmos bytes sem passar por
  // este modulo.
  const relido = desserializar(bytes);
  assert.equal(relido.ok && relido.valor.tipo, 'arranjo');
});

// ── CA-2.3 ──────────────────────────────────────────────────────────────────

test('CA-2.3 a restauracao devolve cada comentario ao estado que tinha, em UM comando por estado', () => {
  // Tres comentarios, dois estados: dois `UPDATE`, nao tres.
  const cena = cenario({
    memoriaGravada: `a:3:{i:5;s:1:"1";i:7;s:1:"0";i:9;s:1:"1";}`,
  });

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'restaurados');
  assert.deepEqual(
    resultado.lotes.map((lote) => [lote.estadoGravado, [...lote.comentarioIds]]),
    [
      [APROVADO, [5, 9]],
      [NA_FILA, [7]],
    ],
  );

  // `UPDATE $wpdb->comments SET comment_approved = %s WHERE comment_ID IN
  // ($comments_in)` (`:4367`), um por grupo, na ordem em que cada estado
  // apareceu pela primeira vez no marcador.
  const atualizacoes = cena.escritas.filter((escrita) =>
    escrita.texto.startsWith('UPDATE'),
  );
  assert.equal(atualizacoes.length, 2);
  assert.equal(
    atualizacoes[0]?.texto,
    `UPDATE wp_comments SET ${COLUNA_DO_ESTADO_DO_COMENTARIO} = ? ` +
      `WHERE ${COLUNA_DO_COMENTARIO} IN (?, ?)`,
  );
  assert.deepEqual(atualizacoes[0]?.parametros, [APROVADO, 5, 9]);
  assert.deepEqual(atualizacoes[1]?.parametros, [NA_FILA, 7]);
});

test('CA-2.3 a ordem dos oito passos da restauracao e a do legado', () => {
  const cena = cenario({ memoriaGravada: `a:1:{i:5;s:1:"1";}` });

  restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // Dois pontos criticos aqui: o marcador agrupado e apagado **depois** de ser
  // usado (`:4372`), e a exclusao de metadado e `SELECT meta_id` + `DELETE`
  // (`wp-includes/meta.php:456` e `:468`) — dois comandos, nao um.
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    'selecionar:metadado-do-conteudo',
    `gancho:untrash_post_comments:${CONTEUDO_ID}`,
    'escrever:UPDATE wp_comments',
    'selecionar:SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
    'escrever:DELETE FROM',
    `gancho:untrashed_post_comments:${CONTEUDO_ID}`,
  ]);
});

test('CA-2.3 sem memoria gravada nada e restaurado, e a acao de ABERTURA nao dispara', () => {
  const cena = cenario();

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  // `if ( ! $statuses ) return true;` (`:4342`-`:4344`) vem **antes** de
  // `do_action( 'untrash_post_comments', ... )` (`:4353`) — o oposto do gemeo do
  // descarte, que dispara a acao antes da guarda. A assimetria esta no legado e
  // e observavel por quem escuta os quatro pontos.
  assert.equal(resultado.desfecho, 'sem-memoria');
  assert.deepEqual(resultado.lotes, []);
  assert.deepEqual([...cena.escritas], []);
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    'selecionar:metadado-do-conteudo',
  ]);
});

test('CA-2.3 marcador com arranjo vazio cai no mesmo ramo que marcador ausente', () => {
  // `! array()` e verdadeiro em PHP como `! ''` e: os dois estados diferentes do
  // banco produzem o mesmo comportamento, e nenhum comando sai.
  const cena = cenario({ memoriaGravada: 'a:0:{}' });

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'sem-memoria');
  assert.deepEqual([...cena.escritas], []);
});

test('CA-2.3 comentario cuja memoria se perdeu volta para a FILA DE MODERACAO', () => {
  // A memoria guarda `post-trashed` para o 7: e o que sobra de uma segunda
  // suspensao sem restauracao no meio. O legado comenta a linha com "Confidence
  // check. This shouldn't happen." (`:4362`) e ainda assim ela acontece.
  const cena = cenario({
    memoriaGravada: `a:2:{i:5;s:1:"1";i:7;s:12:"post-trashed";}`,
  });

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.deepEqual(
    resultado.lotes.map((lote) => [
      lote.estadoGuardado,
      lote.estadoGravado,
      [...lote.comentarioIds],
    ]),
    [
      [APROVADO, APROVADO, [5]],
      // ⚠️ O grupo continua sendo o do estado ORIGINAL: a troca e do valor
      // escrito, nao da chave de agrupamento (`:4363`).
      [ESTADO_DE_SUSPENSAO_EM_CASCATA, ESTADO_DA_FILA_DE_MODERACAO, [7]],
    ],
  );

  const atualizacoes = cena.escritas.filter((escrita) =>
    escrita.texto.startsWith('UPDATE'),
  );
  assert.deepEqual(atualizacoes[1]?.parametros, [ESTADO_DA_FILA_DE_MODERACAO, 7]);
});

test('CA-2.3 memoria com post-trashed E com 0 emite DOIS comandos que gravam o mesmo valor', () => {
  // E o que o agrupamento pela chave original produz, e e exatamente o que o
  // legado emite: um porte que agrupasse pelo valor JA TROCADO emitiria um
  // comando so. A contagem de comandos e parte do resultado comparado.
  const cena = cenario({
    memoriaGravada: `a:2:{i:5;s:12:"post-trashed";i:7;s:1:"0";}`,
  });

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.lotes.length, 2);
  assert.deepEqual(
    resultado.lotes.map((lote) => lote.estadoGravado),
    [ESTADO_DA_FILA_DE_MODERACAO, ESTADO_DA_FILA_DE_MODERACAO],
  );
  assert.equal(
    cena.escritas.filter((escrita) => escrita.texto.startsWith('UPDATE')).length,
    2,
  );
});

test('CA-2.3 conteudo sem linha devolve silencio, sem ler o marcador', () => {
  const cena = cenario({ registro: null, memoriaGravada: `a:1:{i:5;s:1:"1";}` });

  const resultado = restaurarComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'inexistente');
  assert.deepEqual([...cena.escritas], []);
  assert.deepEqual(cena.sequencia, [`le-conteudo:${CONTEUDO_ID}`]);
});

// ── CA-2.4 ──────────────────────────────────────────────────────────────────

test('CA-2.4 o estado de suspensao nao e alcancavel pela API de estado', () => {
  // `wp_set_comment_status()` devolve `false` no `default` do `switch`
  // (`wp-includes/comment.php:2814`-`:2815`), e `post-trashed` nao esta entre os
  // nomes aceitos. A coluna o aceitaria: ela e `varchar(20)` sem `ENUM`
  // (`DB-ENUM`) — quem o impede e o codigo.
  assert.equal(estadoAceitoPelaApiDeEstado(ESTADO_DE_SUSPENSAO_EM_CASCATA), null);
  assert.equal(alcancavelPelaApiDeEstado(ESTADO_DE_SUSPENSAO_EM_CASCATA), false);
});

test('CA-2.4 so pela cascata: e ela que grava post-trashed, e o faz direto na coluna', () => {
  const cena = cenario({ comentarios: [{ id: 5, estado: APROVADO }] });

  suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  const comPostTrashed = cena.escritas.filter((escrita) =>
    escrita.parametros.includes(ESTADO_DE_SUSPENSAO_EM_CASCATA),
  );
  assert.equal(comPostTrashed.length, 1);
  assert.ok(comPostTrashed[0]?.texto.startsWith('UPDATE wp_comments'));
});

test('CA-2.4 o vocabulario da API de estado e o switch do legado: seis nomes, quatro valores', () => {
  // Seis nomes aceitos (`:2799`-`:2813`): `hold` e `'0'` caem no mesmo `'0'`,
  // `approve` e `'1'` no mesmo `'1'`. O docblock da funcao declara so quatro, e
  // o codigo ganha (P1).
  assert.deepEqual(Object.keys(VOCABULARIO_DA_API_DE_ESTADO).sort(), [
    '0',
    '1',
    'approve',
    'hold',
    'spam',
    'trash',
  ]);
  assert.deepEqual(
    [...new Set(Object.values(VOCABULARIO_DA_API_DE_ESTADO))].sort(),
    ['0', '1', 'spam', 'trash'],
  );

  assert.equal(estadoAceitoPelaApiDeEstado('hold'), ESTADO_DA_FILA_DE_MODERACAO);
  assert.equal(estadoAceitoPelaApiDeEstado('approve'), APROVADO);
});

test('CA-2.4 a recusa nao e uma lista de nomes proibidos: e o complemento dos aceitos', () => {
  // E por isso que T005 nao precisou escolher o segundo nome da regra "dois
  // estados nao sao alcancaveis pela API de status", cuja fonte nomeia um so —
  // ver a caixa de `estado-de-suspensao.ts`. Qualquer nome fora do vocabulario
  // cai no mesmo `default`.
  for (const pedido of [
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
    'approved',
    'unapproved',
    'post_trashed',
    '',
    'TRASH',
  ]) {
    assert.equal(estadoAceitoPelaApiDeEstado(pedido), null, pedido);
  }
});

// ── A ligacao com US-1 ──────────────────────────────────────────────────────

test('a cascata entra no descarte no passo 11, e o retorno dela morre ali', () => {
  const cena = cenario({ comentarios: [{ id: 5, estado: APROVADO }] });

  const suspender = cascataNoDescarte(cena.contexto);
  // A forma e a que `ContextoDeDescarte.suspenderComentarios` pede: um
  // argumento, nenhum retorno. `wp_trash_post()` descarta o valor (`:4142`), e
  // nenhum ramo do descarte depende dele.
  const retorno: void = suspender(CONTEUDO_ID);

  assert.equal(retorno, undefined);
  assert.equal(cena.escritas.length, 2);
  assert.deepEqual([...cena.leiturasDeConteudo], [CONTEUDO_ID]);
});

test('a cascata usa o ID do REGISTRO LIDO, nao o argumento', () => {
  // `$post_id = $post->ID` (`:4277` e `:4338`): o legado resolve o argumento com
  // `get_post()` e dali para baixo usa o identificador da linha. Para o inteiro
  // os dois coincidem; para o objeto ou o nulo que `get_post()` tambem aceita,
  // nao — e e o do registro que vai aos comandos e aos pontos de extensao.
  const cena = cenario({
    registro: { id: 99, estado: 'trash' },
    comentarios: [{ id: 5, estado: APROVADO }],
  });

  suspenderComentariosDoConteudo(cena.contexto, CONTEUDO_ID);

  assert.equal(cena.escritas[0]?.parametros[0], 99);
  assert.deepEqual(cena.escritas[1]?.parametros, [
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
    99,
  ]);
  assert.ok(cena.sequencia.includes('gancho:trash_post_comments:99'));
});
