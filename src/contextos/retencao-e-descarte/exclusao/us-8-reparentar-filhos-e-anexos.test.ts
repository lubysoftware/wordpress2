/**
 * Testes da entrega de **T017** (US-8): *"o comportamento de US-8 existe e os
 * criterios CA-8.1, CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-8**: esses sao **T018**, quatro casos registrados em
 * `backlog/tests.md` (UT-055-1 a UT-055-4), que se **transcrevem** do catalogo e
 * nao se reconstroem. Aqui estao os quatro criterios de aceite e o que a
 * implementacao quebraria **em silencio**: a ordem das sete etapas, a assimetria
 * entre o reposicionamento de filhos e o de anexos, a recursao das versoes e o
 * estado que sobra quando o `DELETE` da linha falha depois de tudo.
 *
 * ── POR QUE ESTA SUITE TEM UM BANCO DE MENTIRA, E A DE T003 NAO ─────────────
 *
 * `armazenamento/porta-falsa.ts` **registra comando** e nao simula banco, com o
 * motivo escrito: o que se tem de afirmar e *"qual comando sai, com quais
 * parametros"* — inclusive o caso em que **nenhum** comando sai. Isso serve US-1
 * inteira, porque la o criterio e a sequencia.
 *
 * US-8 e o outro lado do mesmo criterio. A area 3 da Decisao 2 de
 * `parity_specs.md` manda comparar *"**snapshot** + sequencia de comandos"*, e
 * os criterios desta historia sao sobre o snapshot: CA-8.1 e CA-8.2 afirmam para
 * **onde** uma linha passou a apontar, CA-8.3 afirma que outra **sumiu** e CA-8.4
 * afirma que **nenhuma** sobrou apontando para o que nao existe. Nenhum dos
 * quatro e afirmavel contando comandos. E o **P5** fecha a questao: *"para cada
 * cascata catalogada no ERD, um teste apaga o registro pai e afirma o conjunto
 * exato do que sumiu e do que permaneceu, **inclusive o que permaneceu
 * orfao**"*.
 *
 * Por isso a porta daqui faz as duas coisas: **registra todo comando, na ordem**
 * (e nenhum outro caminho pode inventar comando — consulta nao prevista
 * **falha** o teste) **e** mantem tres tabelas minusculas em memoria, para que o
 * snapshot exista. As quatro colunas de `{site}posts` sao as quatro que a
 * cascata usa.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConteudo,
  traducaoDePrivacidade,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { criarMarcadoresDeLixeiraDoConteudo } from '../armazenamento/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import {
  CAPACIDADE_DE_DESCARTAR,
  ESTADO_DE_LIXEIRA,
  descartarParaALixeira,
  type RegistroNoDescarte,
} from '../descarte/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  PortaDeRelogio,
  ResultadoDeEscrita,
} from '../portas/index.js';
import {
  CAPACIDADE_DE_APAGAR,
  CODIGO_HTTP_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  MENSAGEM_DE_USO_INDEVIDO,
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO_ANTERIOR,
  apagarConteudo,
  apagarEmDefinitivo,
  exclusaoDefinitivaDe,
  type ContextoDeExclusao,
  type GanchosDaExclusao,
} from './index.js';

// ── O cenario de US-8, que e o da primeira linha de PT-003 ──────────────────

/** `page`, o tipo hierarquico de fabrica. */
const PAGINA = 'page';
/** Um tipo hierarquico **diferente** do apagado — o orfao do caso 1. */
const OUTRO_TIPO_HIERARQUICO = 'secao';
/** Um tipo **nao** hierarquico, para a borda de CA-8.1. */
const TIPO_PLANO = 'nota';

const AVO = 10;
const MEIO = 20;
const FILHA = 30;
const ANEXO = 40;
const VERSAO = 50;
const FILHA_DE_OUTRO_TIPO = 60;
const COMENTARIO = 70;
const OUTRO_COMENTARIO = 71;

const AUTORA = 7;
const AGORA = 1762800000;

/** `{site}posts` nas quatro colunas que a cascata usa. */
interface LinhaDePost {
  ID: number;
  post_type: string;
  post_status: string;
  post_parent: number;
}

/** `{site}postmeta`. */
interface LinhaDeMeta {
  meta_id: number;
  post_id: number;
  meta_key: string;
  meta_value: string;
}

/** `{site}comments`, nas duas colunas que a cascata usa. */
interface LinhaDeComentario {
  comment_ID: number;
  comment_post_ID: number;
}

interface BancoDeTeste {
  posts: LinhaDePost[];
  postmeta: LinhaDeMeta[];
  comentarios: LinhaDeComentario[];
}

function bancoDoCenario(): BancoDeTeste {
  return {
    posts: [
      { ID: AVO, post_type: PAGINA, post_status: 'publish', post_parent: 0 },
      { ID: MEIO, post_type: PAGINA, post_status: 'publish', post_parent: AVO },
      {
        ID: FILHA,
        post_type: PAGINA,
        post_status: 'publish',
        post_parent: MEIO,
      },
      {
        ID: ANEXO,
        post_type: TIPO_DE_ANEXO,
        post_status: 'inherit',
        post_parent: MEIO,
      },
      {
        ID: VERSAO,
        post_type: TIPO_DE_VERSAO_ANTERIOR,
        post_status: 'inherit',
        post_parent: MEIO,
      },
    ],
    postmeta: [
      {
        meta_id: 1,
        post_id: MEIO,
        meta_key: '_wp_trash_meta_status',
        meta_value: 'publish',
      },
      { meta_id: 2, post_id: MEIO, meta_key: '_edit_last', meta_value: '7' },
      { meta_id: 3, post_id: VERSAO, meta_key: '_edit_last', meta_value: '7' },
      { meta_id: 4, post_id: AVO, meta_key: '_edit_last', meta_value: '7' },
    ],
    comentarios: [
      { comment_ID: COMENTARIO, comment_post_ID: MEIO },
      { comment_ID: OUTRO_COMENTARIO, comment_post_ID: MEIO },
    ],
  };
}

// ── A porta de dados: registra TODO comando, e mantem o snapshot ────────────

interface PortaComSnapshot {
  readonly porta: PortaDeDados;
  readonly banco: BancoDeTeste;
  /** Todo comando pedido, na ordem, com rotulo legivel. */
  readonly sequencia: string[];
  /** Todo comando pedido, na ordem, com texto e parametros. */
  readonly comandos: Consulta[];
}

function portaComSnapshot(
  banco: BancoDeTeste,
  sequencia: string[],
  opcoes: { readonly deleteDaLinhaFalha?: boolean } = {},
): PortaComSnapshot {
  const comandos: Consulta[] = [];
  const prefixo = 'wp_';

  function inteiro(valor: unknown): number {
    return Number(valor);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela: prefixo,

    selecionar(consulta) {
      comandos.push(consulta);
      const texto = consulta.texto;
      const p = consulta.parametros;

      if (texto === `SELECT * FROM ${prefixo}posts WHERE ID = ?`) {
        sequencia.push(`le-registro:${String(p[0])}`);
        return banco.posts.filter(
          (linha) => linha.ID === inteiro(p[0]),
        ) as unknown as LinhaDeResultado[];
      }

      if (
        texto ===
        `SELECT ID FROM ${prefixo}posts WHERE post_parent = ? AND post_type = '${TIPO_DE_VERSAO_ANTERIOR}'`
      ) {
        sequencia.push(`le-versoes:${String(p[0])}`);
        return banco.posts.filter(
          (linha) =>
            linha.post_parent === inteiro(p[0]) &&
            linha.post_type === TIPO_DE_VERSAO_ANTERIOR,
        ) as unknown as LinhaDeResultado[];
      }

      if (
        texto ===
        `SELECT * FROM ${prefixo}posts WHERE post_parent = ? AND post_type = ?`
      ) {
        sequencia.push(`le-filhos:${String(p[0])}:${String(p[1])}`);
        return banco.posts.filter(
          (linha) =>
            linha.post_parent === inteiro(p[0]) &&
            linha.post_type === String(p[1]),
        ) as unknown as LinhaDeResultado[];
      }

      if (
        texto ===
        `SELECT comment_ID FROM ${prefixo}comments WHERE comment_post_ID = ? ORDER BY comment_ID DESC`
      ) {
        sequencia.push(`le-comentarios:${String(p[0])}`);
        return banco.comentarios
          .filter((linha) => linha.comment_post_ID === inteiro(p[0]))
          .sort((a, b) => b.comment_ID - a.comment_ID) as unknown as LinhaDeResultado[];
      }

      if (
        texto ===
        `SELECT meta_id FROM ${prefixo}postmeta WHERE meta_key = ? AND post_id = ?`
      ) {
        sequencia.push(`le-marcador:${String(p[0])}:${String(p[1])}`);
        return banco.postmeta.filter(
          (linha) =>
            linha.meta_key === String(p[0]) &&
            linha.post_id === inteiro(p[1]),
        ) as unknown as LinhaDeResultado[];
      }

      if (
        texto === `SELECT meta_id FROM ${prefixo}postmeta WHERE post_id = ? `
      ) {
        sequencia.push(`le-linhas-de-metadado:${String(p[0])}`);
        return banco.postmeta.filter(
          (linha) => linha.post_id === inteiro(p[0]),
        ) as unknown as LinhaDeResultado[];
      }

      if (texto === `SELECT * FROM ${prefixo}postmeta WHERE meta_id = ?`) {
        sequencia.push(`le-linha-de-metadado:${String(p[0])}`);
        return banco.postmeta.filter(
          (linha) => linha.meta_id === inteiro(p[0]),
        ) as unknown as LinhaDeResultado[];
      }

      // Nenhum caminho desta cascata monta outra consulta. Se um porte
      // acrescentar uma, o teste **falha** em lugar de devolver lista vazia.
      throw new Error(`consulta nao prevista: ${texto}`);
    },

    escrever(consulta): ResultadoDeEscrita {
      comandos.push(consulta);
      const texto = consulta.texto;
      const p = consulta.parametros;

      if (
        texto ===
        `UPDATE ${prefixo}posts SET post_parent = ? WHERE post_parent = ? AND post_type = ?`
      ) {
        sequencia.push(
          `reposiciona:${String(p[2])}:${String(p[1])}->${String(p[0])}`,
        );
        let afetadas = 0;
        for (const linha of banco.posts) {
          if (
            linha.post_parent === inteiro(p[1]) &&
            linha.post_type === String(p[2])
          ) {
            linha.post_parent = inteiro(p[0]);
            afetadas += 1;
          }
        }
        return { linhasAfetadas: afetadas, idGerado: null };
      }

      if (
        texto ===
        `INSERT INTO ${prefixo}postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)`
      ) {
        // O caminho do **descarte** (T003), que esta suite exercita pelos dois
        // desvios: a lixeira grava os dois marcadores com `add_post_meta()`.
        sequencia.push(`grava-marcador:${String(p[1])}:${String(p[0])}`);
        const metaId =
          banco.postmeta.reduce(
            (maior, linha) => Math.max(maior, linha.meta_id),
            0,
          ) + 1;
        banco.postmeta.push({
          meta_id: metaId,
          post_id: inteiro(p[0]),
          meta_key: String(p[1]),
          meta_value: String(p[2]),
        });
        return { linhasAfetadas: 1, idGerado: metaId };
      }

      if (texto === `DELETE FROM ${prefixo}posts WHERE ID = ?`) {
        sequencia.push(`apaga-registro:${String(p[0])}`);
        if (opcoes.deleteDaLinhaFalha === true) {
          return { linhasAfetadas: 0, idGerado: null };
        }
        const antes = banco.posts.length;
        banco.posts = banco.posts.filter(
          (linha) => linha.ID !== inteiro(p[0]),
        );
        return { linhasAfetadas: antes - banco.posts.length, idGerado: null };
      }

      if (texto.startsWith(`DELETE FROM ${prefixo}postmeta WHERE meta_id IN(`)) {
        sequencia.push(`apaga-marcador:${p.map(String).join(',')}`);
        const alvos = p.map(inteiro);
        const antes = banco.postmeta.length;
        banco.postmeta = banco.postmeta.filter(
          (linha) => !alvos.includes(linha.meta_id),
        );
        return {
          linhasAfetadas: antes - banco.postmeta.length,
          idGerado: null,
        };
      }

      if (texto === `DELETE FROM ${prefixo}postmeta WHERE meta_id = ?`) {
        sequencia.push(`apaga-linha-de-metadado:${String(p[0])}`);
        const antes = banco.postmeta.length;
        banco.postmeta = banco.postmeta.filter(
          (linha) => linha.meta_id !== inteiro(p[0]),
        );
        return {
          linhasAfetadas: antes - banco.postmeta.length,
          idGerado: null,
        };
      }

      throw new Error(`escrita nao prevista: ${texto}`);
    },
  };

  return { porta, banco, sequencia, comandos };
}

// ── O contexto ──────────────────────────────────────────────────────────────

const CAPACIDADES_DE_PAGINA: Readonly<Record<string, Capacidade>> = {
  delete_posts: 'delete_pages',
  delete_others_posts: 'delete_others_pages',
  delete_published_posts: 'delete_published_pages',
  delete_private_posts: 'delete_private_pages',
  edit_posts: 'edit_pages',
  edit_others_posts: 'edit_others_pages',
  read: 'read',
};

const TIPOS: readonly TipoDeConteudoNaAutorizacao[] = [
  {
    nome: PAGINA,
    traduzMetaCapacidade: true,
    capacidades: CAPACIDADES_DE_PAGINA,
  },
];

const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'inherit', publico: false, privado: false },
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

/** Quais tipos sao hierarquicos neste cenario. Tipo ausente responde `false`. */
const HIERARQUIA: Readonly<Record<string, boolean>> = {
  [PAGINA]: true,
  [OUTRO_TIPO_HIERARQUICO]: true,
  [TIPO_PLANO]: false,
};

function ator(
  contaId: number,
  ...capacidades: readonly string[]
): AtorDeAutorizacao {
  return {
    contaId,
    login: `conta-${contaId}`,
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

interface OpcoesDoCenario {
  readonly banco?: BancoDeTeste;
  readonly diasNaLixeira?: number;
  readonly deleteDaLinhaFalha?: boolean;
  readonly anexoApagado?: boolean;
  readonly taxonomiasDoTipo?: readonly string[];
  readonly ator?: AtorDeAutorizacao;
  readonly ganchos?: GanchosDaExclusao;
}

interface Cenario {
  readonly contexto: ContextoDeExclusao;
  readonly banco: BancoDeTeste;
  /** A sequencia de **tudo**: comando, colaboracao e ponto de extensao. */
  readonly sequencia: string[];
  readonly comandos: Consulta[];
}

/**
 * Monta o contexto da operacao com tudo registrado numa lista so — comandos,
 * colaboracoes de ligacao tardia e pontos de extensao —, como
 * `../descarte/us-1-descartar-conteudo.test.ts` faz: sem a interleacao, a ordem
 * entre comando e colaboracao, que e o que a area 3 da Decisao 2 compara, ficaria
 * de fora.
 */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const sequencia: string[] = [];
  const banco = opcoes.banco ?? bancoDoCenario();
  const comOpcoes =
    opcoes.deleteDaLinhaFalha === undefined
      ? {}
      : { deleteDaLinhaFalha: opcoes.deleteDaLinhaFalha };
  const dados = portaComSnapshot(banco, sequencia, comOpcoes);

  function linhaDoBanco(conteudoId: number): LinhaDePost | null {
    return banco.posts.find((linha) => linha.ID === conteudoId) ?? null;
  }

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      sequencia.push('relogio');
      return AGORA;
    },
  };

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia): ConteudoNaAutorizacao | null {
      if (typeof referencia !== 'number') {
        return null;
      }
      const linha = linhaDoBanco(referencia);
      if (linha === null) {
        return null;
      }
      return {
        id: linha.ID,
        tipo: linha.post_type,
        estado: linha.post_status,
        estadoParaLeitura: linha.post_status,
        autorId: AUTORA,
        paiId: linha.post_parent,
      };
    },
    tipoDeConteudo(nome) {
      return TIPOS.find((tipo) => tipo.nome === nome) ?? null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS.find((estado) => estado.nome === nome) ?? null;
    },
    estadoAnteriorNaLixeira() {
      return '';
    },
    paginaInicial() {
      return 0;
    },
    paginaDeConteudos() {
      return 0;
    },
    paginaDePoliticaDePrivacidade() {
      return 0;
    },
  };

  const base: BaseDeAutorizacao = {
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte), traducaoDePrivacidade],
  };

  const ganchosRegistrados: GanchosDaExclusao = {
    filtrarExclusao: (exclusao, registro, forcar) => {
      sequencia.push(`gancho:pre_delete_post:${registro.id}:${String(forcar)}`);
      return opcoes.ganchos?.filtrarExclusao?.(exclusao, registro, forcar) ?? null;
    },
    antesDaExclusao: (conteudoId, registro) => {
      sequencia.push(`gancho:before_delete_post:${conteudoId}`);
      opcoes.ganchos?.antesDaExclusao?.(conteudoId, registro);
    },
    antesDeApagarALinhaDoTipo: (conteudoId, registro) => {
      sequencia.push(`gancho:delete_post_${registro.tipo}:${conteudoId}`);
      opcoes.ganchos?.antesDeApagarALinhaDoTipo?.(conteudoId, registro);
    },
    antesDeApagarALinha: (conteudoId, registro) => {
      sequencia.push(`gancho:delete_post:${conteudoId}`);
      opcoes.ganchos?.antesDeApagarALinha?.(conteudoId, registro);
    },
    depoisDeApagarALinhaDoTipo: (conteudoId, registro) => {
      sequencia.push(`gancho:deleted_post_${registro.tipo}:${conteudoId}`);
      opcoes.ganchos?.depoisDeApagarALinhaDoTipo?.(conteudoId, registro);
    },
    depoisDeApagarALinha: (conteudoId, registro) => {
      sequencia.push(`gancho:deleted_post:${conteudoId}`);
      opcoes.ganchos?.depoisDeApagarALinha?.(conteudoId, registro);
    },
    aoFimDaExclusao: (conteudoId, registro) => {
      sequencia.push(`gancho:after_delete_post:${conteudoId}`);
      opcoes.ganchos?.aoFimDaExclusao?.(conteudoId, registro);
    },
    depoisDeApagarVersao: (versaoId, versao) => {
      sequencia.push(`gancho:wp_delete_post_revision:${versaoId}`);
      opcoes.ganchos?.depoisDeApagarVersao?.(versaoId, versao);
    },
  };

  const contexto: ContextoDeExclusao = {
    base,
    ator:
      opcoes.ator ??
      ator(
        AUTORA,
        'delete_pages',
        'delete_others_pages',
        'delete_published_pages',
        'delete_private_pages',
      ),
    prazoDeRetencao:
      opcoes.diasNaLixeira === undefined
        ? PRAZO_DE_RETENCAO_DE_FABRICA
        : { diasNaLixeira: opcoes.diasNaLixeira },
    relogio,
    dados: dados.porta,
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados.porta),
    },
    conteudo: {
      obterPorId(conteudoId): RegistroNoDescarte | null {
        sequencia.push(`get_post:${conteudoId}`);
        const linha = linhaDoBanco(conteudoId);
        return linha === null
          ? null
          : { id: linha.ID, estado: linha.post_status };
      },
      gravarEstado(conteudoId, estado) {
        sequencia.push(`grava-estado:${conteudoId}:${estado}`);
        const linha = linhaDoBanco(conteudoId);
        if (linha !== null) {
          linha.post_status = estado;
        }
        return conteudoId;
      },
    },
    tipos: {
      ehHierarquico(tipo) {
        sequencia.push(`eh-hierarquico:${tipo}`);
        return HIERARQUIA[tipo] ?? false;
      },
    },
    classificacao: {
      taxonomiasDoTipo(tipo) {
        sequencia.push(`taxonomias-do-tipo:${tipo}`);
        return opcoes.taxonomiasDoTipo ?? ['category', 'post_tag'];
      },
      removerVinculosDeTermo(conteudoId, taxonomias) {
        sequencia.push(
          `remove-vinculos:${conteudoId}:${taxonomias.join('|')}`,
        );
      },
    },
    versoes: {
      obterVersao(versaoId) {
        sequencia.push(`get_post_revision:${versaoId}`);
        const linha = linhaDoBanco(versaoId);
        if (linha === null || linha.post_type !== TIPO_DE_VERSAO_ANTERIOR) {
          return null;
        }
        return {
          id: linha.ID,
          tipo: linha.post_type,
          estado: linha.post_status,
          paiId: linha.post_parent,
        };
      },
    },
    comentarios: {
      adiarContagem(adiar) {
        sequencia.push(`adia-contagem:${String(adiar)}`);
      },
      apagarComentario(comentarioId) {
        sequencia.push(`apaga-comentario:${comentarioId}`);
        banco.comentarios = banco.comentarios.filter(
          (linha) => linha.comment_ID !== comentarioId,
        );
        return true;
      },
    },
    exclusaoDeAnexo: (anexoId, forcar) => {
      sequencia.push(`apaga-anexo:${anexoId}:${String(forcar)}`);
      return opcoes.anexoApagado ?? true;
    },
    limparPublicacaoAgendada: (conteudoId) => {
      sequencia.push(`limpa-agendamento:${conteudoId}`);
    },
    suspenderComentarios: (conteudoId) => {
      sequencia.push(`suspende-comentarios:${conteudoId}`);
    },
    exclusaoDefinitiva: (conteudoId) =>
      exclusaoDefinitivaDe(contexto)(conteudoId),
    ganchos: ganchosRegistrados,
  };

  return { contexto, banco, sequencia, comandos: dados.comandos };
}

/** Para onde cada linha de `{site}posts` aponta, depois da cascata. */
function paisNoBanco(banco: BancoDeTeste): Record<number, number> {
  const pais: Record<number, number> = {};
  for (const linha of banco.posts) {
    pais[linha.ID] = linha.post_parent;
  }
  return pais;
}

/** Os identificadores que sobraram em `{site}posts`, em ordem. */
function idsNoBanco(banco: BancoDeTeste): readonly number[] {
  return banco.posts.map((linha) => linha.ID).sort((a, b) => a - b);
}

// ── CA-8.1 ──────────────────────────────────────────────────────────────────

test('CA-8.1: apagar a pagina do meio vincula a filha ao avo, e nao a apaga', () => {
  const { contexto, banco } = cenario();

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(resultado.desfecho, 'apagado');
  // A filha continua existindo, e agora aponta para a avo.
  assert.equal(paisNoBanco(banco)[FILHA], AVO);
  assert.ok(idsNoBanco(banco).includes(FILHA));
  // E o que o resultado afirma e a mesma coisa que o banco mostra.
  assert.equal(resultado.filhos?.tipoHierarquico, true);
  assert.deepEqual(resultado.filhos?.filhos, [FILHA]);
  assert.equal(resultado.filhos?.comandoEmitido, true);
  assert.equal(resultado.filhos?.avoId, AVO);
  assert.equal(resultado.filhos?.linhasAfetadas, 1);
});

test('CA-8.1: o avo pode ser a raiz, e `0` nao e nulo (DB-SENT)', () => {
  const banco = bancoDoCenario();
  // A pagina do meio passa a ser de primeiro nivel.
  const meio = banco.posts.find((linha) => linha.ID === MEIO) as LinhaDePost;
  meio.post_parent = 0;

  const { contexto } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(resultado.filhos?.avoId, 0);
  // A filha vai para a raiz, e nao para um pai inexistente: ausencia de vinculo
  // e escrita como `0` (BR-MIGRAR-081).
  assert.equal(paisNoBanco(banco)[FILHA], 0);
});

test('CA-8.1 (borda): sem filho, a leitura sai e o UPDATE nao', () => {
  const banco = bancoDoCenario();
  banco.posts = banco.posts.filter((linha) => linha.ID !== FILHA);

  const { contexto, sequencia } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.deepEqual(resultado.filhos?.filhos, []);
  // `if ( $children )` (`:3907`): lista vazia e nenhum `UPDATE` de pagina.
  assert.equal(resultado.filhos?.comandoEmitido, false);
  assert.ok(sequencia.includes(`le-filhos:${MEIO}:${PAGINA}`));
  assert.equal(
    sequencia.some((passo) => passo.startsWith(`reposiciona:${PAGINA}:`)),
    false,
  );
});

test('CA-8.1 (borda): tipo nao hierarquico nao emite nem a leitura dos filhos', () => {
  const banco = bancoDoCenario();
  const meio = banco.posts.find((linha) => linha.ID === MEIO) as LinhaDePost;
  meio.post_type = TIPO_PLANO;
  const filha = banco.posts.find((linha) => linha.ID === FILHA) as LinhaDePost;
  filha.post_type = TIPO_PLANO;

  const { contexto, sequencia } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(resultado.filhos?.tipoHierarquico, false);
  assert.deepEqual(resultado.filhos?.filhos, []);
  assert.equal(
    sequencia.some((passo) => passo.startsWith('le-filhos:')),
    false,
  );
  // ⚠️ E o filho fica apontando para a linha apagada: e o caso 2 do censo de
  // CA-8.4, e e o que o legado faz (`:3897`).
  assert.equal(paisNoBanco(banco)[FILHA], MEIO);
  assert.equal(idsNoBanco(banco).includes(MEIO), false);
});

test('CA-8.4 (censo, caso 1): filho de OUTRO tipo nao e reposicionado, e fica orfao', () => {
  const banco = bancoDoCenario();
  banco.posts.push({
    ID: FILHA_DE_OUTRO_TIPO,
    post_type: OUTRO_TIPO_HIERARQUICO,
    post_status: 'publish',
    post_parent: MEIO,
  });

  const { contexto } = cenario({ banco });

  apagarConteudo(contexto, MEIO, true);

  const pais = paisNoBanco(banco);
  // O filho do mesmo tipo foi para a avo...
  assert.equal(pais[FILHA], AVO);
  // ...e o de outro tipo continua apontando para quem nao existe mais, porque o
  // `SELECT` e o `UPDATE` filtram `post_type = $post->post_type` (`:3900`,
  // `:3908`). P5 manda afirmar "inclusive o que permaneceu orfao".
  assert.equal(pais[FILHA_DE_OUTRO_TIPO], MEIO);
  assert.equal(idsNoBanco(banco).includes(MEIO), false);
});

// ── CA-8.2 ──────────────────────────────────────────────────────────────────

test('CA-8.2: o anexo vinculado vai para o avo, e continua existindo', () => {
  const { contexto, banco } = cenario();

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(paisNoBanco(banco)[ANEXO], AVO);
  assert.ok(idsNoBanco(banco).includes(ANEXO));
  assert.equal(resultado.anexosReposicionados, 1);
});

test('CA-8.2: o UPDATE dos anexos sai mesmo sem anexo, e o dos filhos nao', () => {
  const banco = bancoDoCenario();
  banco.posts = banco.posts.filter(
    (linha) => linha.ID !== ANEXO && linha.ID !== FILHA,
  );

  const { contexto, sequencia } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, true);

  // A assimetria de `:3907` contra `:3923`: um tem guarda de leitura, o outro
  // nao. Zero linha afetada **com o comando emitido** nao e a mesma coisa que
  // comando nao emitido, e e a sequencia que distingue as duas.
  assert.equal(resultado.anexosReposicionados, 0);
  assert.equal(resultado.filhos?.comandoEmitido, false);
  assert.ok(
    sequencia.includes(`reposiciona:${TIPO_DE_ANEXO}:${MEIO}->${AVO}`),
  );
});

// ── CA-8.3 ──────────────────────────────────────────────────────────────────

test('CA-8.3: as versoes anteriores vao em cascata, e o metadado delas tambem', () => {
  const { contexto, banco, sequencia } = cenario();

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.deepEqual(resultado.versoesEncontradas, [VERSAO]);
  assert.deepEqual(resultado.versoesApagadas, [VERSAO]);
  // A versao sumiu, e com ela a linha de metadado dela (`meta_id` 3).
  assert.equal(idsNoBanco(banco).includes(VERSAO), false);
  assert.deepEqual(
    banco.postmeta.map((linha) => linha.meta_id),
    [4],
  );
  // E ela passou pela MESMA funcao, com as sete etapas dela: o `:3917` do legado
  // diz por que ("Ensures any meta/misplaced data gets cleaned up").
  assert.ok(sequencia.includes(`get_post_revision:${VERSAO}`));
  assert.ok(sequencia.includes(`le-registro:${VERSAO}`));
  assert.ok(sequencia.includes(`apaga-registro:${VERSAO}`));
  assert.ok(sequencia.includes(`gancho:wp_delete_post_revision:${VERSAO}`));
  // Inclusive o `UPDATE` de anexos da etapa 5, que sai **por versao** tambem.
  assert.ok(
    sequencia.includes(`reposiciona:${TIPO_DE_ANEXO}:${VERSAO}->${MEIO}`),
  );
});

test('CA-8.3: linha que nao e versao nao e apagada por esta etapa', () => {
  const banco = bancoDoCenario();
  // A leitura de `:3913` filtra por tipo, logo o unico jeito de a recusa de
  // `wp_get_post_revision()` acontecer e chamando-a direto — e ela e superficie
  // publicada (P8). Aqui o cenario poe a versao com outro tipo: a leitura nao a
  // encontra e nada acontece com ela.
  const versao = banco.posts.find(
    (linha) => linha.ID === VERSAO,
  ) as LinhaDePost;
  versao.post_type = TIPO_PLANO;

  const { contexto } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.deepEqual(resultado.versoesEncontradas, []);
  assert.ok(idsNoBanco(banco).includes(VERSAO));
});

// ── CA-8.4 ──────────────────────────────────────────────────────────────────

test('CA-8.4: no cenario de US-8, nenhuma linha sobra apontando para o apagado', () => {
  const { contexto, banco } = cenario();

  apagarConteudo(contexto, MEIO, true);

  // `{site}posts`: a linha morreu, e ninguem mais aponta para ela.
  assert.deepEqual(idsNoBanco(banco), [AVO, FILHA, ANEXO]);
  assert.deepEqual(paisNoBanco(banco), { [AVO]: 0, [FILHA]: AVO, [ANEXO]: AVO });
  // `{site}postmeta`: so sobra o metadado do avo.
  assert.deepEqual(
    banco.postmeta.map((linha) => linha.post_id),
    [AVO],
  );
  // `{site}comments`: os dois comentarios do conteudo sumiram.
  assert.deepEqual(banco.comentarios, []);
});

test('CA-8.4: o conjunto exato do que sumiu e do que permaneceu (P5)', () => {
  const banco = bancoDoCenario();
  banco.posts.push({
    ID: FILHA_DE_OUTRO_TIPO,
    post_type: OUTRO_TIPO_HIERARQUICO,
    post_status: 'publish',
    post_parent: MEIO,
  });

  const { contexto } = cenario({ banco });

  apagarConteudo(contexto, MEIO, true);

  // ⚠️ **O limite de CA-8.4, afirmado e nao escondido.** Lido ao pe da letra, o
  // criterio diria que esta lista nao pode ter nenhum `MEIO` do lado direito; o
  // legado deixa um, e a Decisao 2 de `pending_decisions.md` poe na area "efeito
  // no banco" a cascata "**e os orfaos que o legado deixa de proposito**". O
  // censo dos tres casos esta em `reposicionamento-no-avo.ts`.
  assert.deepEqual(paisNoBanco(banco), {
    [AVO]: 0,
    [FILHA]: AVO,
    [ANEXO]: AVO,
    [FILHA_DE_OUTRO_TIPO]: MEIO,
  });
});

// ── A sequencia das sete etapas ─────────────────────────────────────────────

test('as sete etapas rodam na ordem do legado, com os pontos de extensao no lugar', () => {
  const { contexto, sequencia } = cenario();

  apagarConteudo(contexto, MEIO, true);

  assert.deepEqual(sequencia, [
    // Passo 1 (`:3843`): o `SELECT *` cru.
    `le-registro:${MEIO}`,
    // Passo 4 (`:3871`) e passo 5 (`:3887`): o filtro e a acao, antes de tudo.
    `gancho:pre_delete_post:${MEIO}:true`,
    `gancho:before_delete_post:${MEIO}`,
    // Etapa 1 (`:3889`-`:3890`): os dois marcadores, por chave, nessa ordem. O
    // segundo nao existe no cenario, logo o `DELETE` dele **nao sai**.
    `le-marcador:_wp_trash_meta_status:${MEIO}`,
    'apaga-marcador:1',
    `le-marcador:_wp_trash_meta_time:${MEIO}`,
    // Etapa 2 (`:3892`): as taxonomias do tipo, e a remocao.
    `taxonomias-do-tipo:${PAGINA}`,
    `remove-vinculos:${MEIO}:category|post_tag`,
    // Etapa 3 (`:3897`-`:3910`): CA-8.1.
    `eh-hierarquico:${PAGINA}`,
    `le-filhos:${MEIO}:${PAGINA}`,
    `reposiciona:${PAGINA}:${MEIO}->${AVO}`,
    // Etapa 4 (`:3913`-`:3920`): CA-8.3, e a versao roda a cascata inteira dela.
    `le-versoes:${MEIO}`,
    `get_post_revision:${VERSAO}`,
    `le-registro:${VERSAO}`,
    `gancho:pre_delete_post:${VERSAO}:false`,
    `gancho:before_delete_post:${VERSAO}`,
    `le-marcador:_wp_trash_meta_status:${VERSAO}`,
    `le-marcador:_wp_trash_meta_time:${VERSAO}`,
    `taxonomias-do-tipo:${TIPO_DE_VERSAO_ANTERIOR}`,
    `remove-vinculos:${VERSAO}:category|post_tag`,
    `eh-hierarquico:${TIPO_DE_VERSAO_ANTERIOR}`,
    `le-versoes:${VERSAO}`,
    `reposiciona:${TIPO_DE_ANEXO}:${VERSAO}->${MEIO}`,
    'adia-contagem:true',
    `le-comentarios:${VERSAO}`,
    'adia-contagem:false',
    `le-linhas-de-metadado:${VERSAO}`,
    'le-linha-de-metadado:3',
    'apaga-linha-de-metadado:3',
    `gancho:delete_post_${TIPO_DE_VERSAO_ANTERIOR}:${VERSAO}`,
    `gancho:delete_post:${VERSAO}`,
    `apaga-registro:${VERSAO}`,
    `gancho:deleted_post_${TIPO_DE_VERSAO_ANTERIOR}:${VERSAO}`,
    `gancho:deleted_post:${VERSAO}`,
    `limpa-agendamento:${VERSAO}`,
    `gancho:after_delete_post:${VERSAO}`,
    `gancho:wp_delete_post_revision:${VERSAO}`,
    // Etapa 5 (`:3923`): CA-8.2, um comando, sempre.
    `reposiciona:${TIPO_DE_ANEXO}:${MEIO}->${AVO}`,
    // Etapa 6 (`:3925`-`:3935`): os comentarios, em ordem DECRESCENTE, com a
    // contagem adiada em volta.
    'adia-contagem:true',
    `le-comentarios:${MEIO}`,
    `apaga-comentario:${OUTRO_COMENTARIO}`,
    `apaga-comentario:${COMENTARIO}`,
    'adia-contagem:false',
    // Etapa 7 (`:3937`-`:3942`): o que sobrou de metadado, pelo `meta_id`.
    `le-linhas-de-metadado:${MEIO}`,
    'le-linha-de-metadado:2',
    'apaga-linha-de-metadado:2',
    // E so entao a linha, com as duas acoes antes e as duas depois.
    `gancho:delete_post_${PAGINA}:${MEIO}`,
    `gancho:delete_post:${MEIO}`,
    `apaga-registro:${MEIO}`,
    `gancho:deleted_post_${PAGINA}:${MEIO}`,
    `gancho:deleted_post:${MEIO}`,
    // (`:4006`) o agendamento de publicacao futura, DEPOIS do `DELETE`.
    `limpa-agendamento:${MEIO}`,
    `gancho:after_delete_post:${MEIO}`,
  ]);
});

test('nenhum comando de transacao aparece na sequencia (BR-MIGRAR-104)', () => {
  const { contexto, comandos } = cenario();

  apagarConteudo(contexto, MEIO, true);

  // Zero `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos do legado; o
  // cenario `@composicao` de PT-003 cobra a mesma ausencia aqui.
  for (const comando of comandos) {
    assert.equal(/TRANSACTION|COMMIT|ROLLBACK/i.test(comando.texto), false);
  }
});

// ── Os desvios ──────────────────────────────────────────────────────────────

test('sem forca, com lixeira, a pagina vai para a LIXEIRA e nao e apagada', () => {
  const { contexto, banco, sequencia } = cenario();

  const resultado = apagarConteudo(contexto, MEIO, false);

  assert.equal(resultado.desfecho, 'descartado-para-a-lixeira');
  assert.equal(resultado.descarte?.desfecho, 'descartado');
  // A linha continua de pe, agora em `trash` — e nenhuma etapa da cascata rodou.
  assert.ok(idsNoBanco(banco).includes(MEIO));
  assert.equal(
    sequencia.some((passo) => passo.startsWith('reposiciona:')),
    false,
  );
  // E o estado foi lido pela leitura FILTRADA, depois do `SELECT *` cru: duas
  // leituras da mesma linha, as duas do legado (`:3843` e `:3853`).
  assert.deepEqual(sequencia.slice(0, 2), [
    `le-registro:${MEIO}`,
    `get_post:${MEIO}`,
  ]);
});

test('o desvio da lixeira nao acontece para tipo que nao e `post` nem `page`', () => {
  const banco = bancoDoCenario();
  const meio = banco.posts.find((linha) => linha.ID === MEIO) as LinhaDePost;
  meio.post_type = OUTRO_TIPO_HIERARQUICO;

  const { contexto, sequencia } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, false);

  // A lista de `:3852` e literal e fechada: tipo de terceiro pedido sem forca
  // vai **direto** para a exclusao definitiva.
  assert.equal(resultado.desfecho, 'apagado');
  assert.equal(
    sequencia.some((passo) => passo.startsWith('get_post:')),
    false,
  );
});

test('ja na lixeira e sem forca: a cascata roda, e nao ha segundo descarte', () => {
  const banco = bancoDoCenario();
  const meio = banco.posts.find((linha) => linha.ID === MEIO) as LinhaDePost;
  meio.post_status = ESTADO_DE_LIXEIRA;

  const { contexto } = cenario({ banco });

  const resultado = apagarConteudo(contexto, MEIO, false);

  // `'trash' !== get_post_status( $post_id )` (`:3853`): e por esta condicao que
  // a coleta de US-5 pode chamar `wp_delete_post()` sem forca e ainda apagar.
  assert.equal(resultado.desfecho, 'apagado');
});

test('anexo pedido para exclusao desvia para a exclusao de midia (resposta 9)', () => {
  const { contexto, banco, sequencia } = cenario();

  const resultado = apagarConteudo(contexto, ANEXO, true);

  assert.equal(resultado.desfecho, 'anexo');
  assert.equal(resultado.anexoApagado, true);
  // Nada da cascata de conteudo rodou, e a linha continua la: quem a apaga e
  // `wp_delete_attachment()`, que e de BC-06.
  assert.ok(idsNoBanco(banco).includes(ANEXO));
  assert.deepEqual(sequencia, [
    `le-registro:${ANEXO}`,
    `apaga-anexo:${ANEXO}:true`,
  ]);
});

test('o filtro `pre_delete_post` intercepta antes de qualquer escrita', () => {
  const { contexto, banco, sequencia } = cenario({
    ganchos: { filtrarExclusao: () => false },
  });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(resultado.desfecho, 'interceptado');
  assert.equal(resultado.interceptacao, false);
  // Nenhuma etapa, nenhum ponto de acao — nem `before_delete_post`.
  assert.deepEqual(sequencia, [
    `le-registro:${MEIO}`,
    `gancho:pre_delete_post:${MEIO}:true`,
  ]);
  assert.deepEqual(idsNoBanco(banco), [AVO, MEIO, FILHA, ANEXO, VERSAO]);
});

// ── As bordas ───────────────────────────────────────────────────────────────

test('identificador nao maior que zero: aviso, `false` e NENHUM comando', () => {
  const { contexto, comandos, sequencia } = cenario();

  const resultado = apagarConteudo(contexto, 0, true);

  assert.equal(resultado.desfecho, 'identificador-invalido');
  assert.equal(resultado.usoIndevido, MENSAGEM_DE_USO_INDEVIDO);
  assert.deepEqual(comandos, []);
  assert.deepEqual(sequencia, []);
});

test('linha inexistente: retorno silencioso, com a leitura e so ela (P7)', () => {
  const { contexto, sequencia } = cenario();

  const resultado = apagarConteudo(contexto, 999, true);

  assert.equal(resultado.desfecho, 'inexistente');
  assert.deepEqual(sequencia, ['le-registro:999']);
});

test('o `DELETE` que nao afeta linha deixa as sete etapas FEITAS', () => {
  const { contexto, banco } = cenario({ deleteDaLinhaFalha: true });

  const resultado = apagarConteudo(contexto, MEIO, true);

  assert.equal(resultado.desfecho, 'nao-apagado');
  assert.equal(resultado.linhasApagadas, 0);
  // Nao ha transacao e nada e desfeito: a linha continua, e tudo em volta dela
  // ja morreu. E o cenario `@critico` de PT-003 sobre o estado parcial.
  assert.ok(idsNoBanco(banco).includes(MEIO));
  assert.equal(paisNoBanco(banco)[FILHA], AVO);
  assert.deepEqual(banco.comentarios, []);
  assert.deepEqual(
    banco.postmeta.map((linha) => linha.post_id),
    [AVO],
  );
  // E os tres ultimos pontos de extensao **nao** disparam (`:3970`).
  assert.equal(resultado.filhos?.comandoEmitido, true);
});

// ── A operacao, e a permissao que o P4 cobra ────────────────────────────────

test('a operacao exige `delete_post` do registro, e recusa com o texto do painel', () => {
  const { contexto, banco, sequencia } = cenario({
    ator: ator(AUTORA, 'read'),
  });

  const resultado = apagarEmDefinitivo(contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(
    resultado.recusa?.mensagem,
    MENSAGEM_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  );
  assert.equal(
    resultado.recusa?.codigoHttp,
    CODIGO_HTTP_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  );
  // A recusa vem antes de qualquer comando: a unica coisa que saiu foi a leitura
  // da superficie (`wp-admin/post.php:319`).
  assert.deepEqual(sequencia, [`get_post:${MEIO}`]);
  assert.deepEqual(idsNoBanco(banco), [AVO, MEIO, FILHA, ANEXO, VERSAO]);
});

test('a capacidade de apagar e A MESMA de descartar, e nao uma propria', () => {
  // `wp-admin/post.php:261`, `:299` e `:328`: as tres acoes perguntam
  // `delete_post` do mesmo objeto. Nao existe capacidade de exclusao definitiva
  // no legado, e e por isso que o aviso de US-4 e historia de tela.
  assert.equal(CAPACIDADE_DE_APAGAR, CAPACIDADE_DE_DESCARTAR);
  assert.equal(CAPACIDADE_DE_APAGAR, 'delete_post');
});

test('quem pode apagar apaga, e a operacao le a linha duas vezes', () => {
  const { contexto, banco, sequencia } = cenario();

  const resultado = apagarEmDefinitivo(contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'apagado');
  assert.equal(idsNoBanco(banco).includes(MEIO), false);
  // A da superficie e `get_post()`; a de dentro e o `SELECT *` cru. Com cache de
  // objeto seria uma; o cache fica desligado nas duas metades (borda 5 de
  // `target_architecture.md`).
  assert.deepEqual(sequencia.slice(0, 2), [
    `get_post:${MEIO}`,
    `le-registro:${MEIO}`,
  ]);
});

// ── O ciclo T003 ↔ T017, fechado ────────────────────────────────────────────

test('com a lixeira desligada, o descarte de US-1 chega nesta cascata (CA-4.1)', () => {
  const { contexto, banco, sequencia } = cenario({ diasNaLixeira: 0 });

  const resultado = descartarParaALixeira(contexto, MEIO);

  // A primeira linha de `wp_trash_post()` (`:4085`) delega, e agora ha quem
  // atenda: a linha morre, a filha vai para a avo e nenhum marcador e gravado.
  assert.equal(resultado.desfecho, 'apagado-em-definitivo');
  assert.equal(resultado.apagadoEmDefinitivo, true);
  assert.equal(resultado.estadoAnterior, null);
  assert.equal(idsNoBanco(banco).includes(MEIO), false);
  assert.equal(paisNoBanco(banco)[FILHA], AVO);
  assert.equal(
    sequencia.some((passo) => passo.startsWith('relogio')),
    false,
  );
});

test('a recursao entre as duas funcoes nao se fecha: nenhuma instalacao satisfaz as duas guardas', () => {
  // Com lixeira: o pedido sem forca vira descarte, e o descarte **nao** volta
  // para a exclusao, porque `! EMPTY_TRASH_DAYS` e falso.
  const comLixeira = cenario();
  const descartado = apagarConteudo(comLixeira.contexto, MEIO, false);
  assert.equal(descartado.desfecho, 'descartado-para-a-lixeira');
  assert.equal(descartado.descarte?.desfecho, 'descartado');

  // Sem lixeira: o descarte delega para a exclusao, e a exclusao **nao** volta
  // para o descarte, porque a guarda de `:3853` exige lixeira ligada.
  const semLixeira = cenario({ diasNaLixeira: 0 });
  const apagado = apagarConteudo(semLixeira.contexto, MEIO, false);
  assert.equal(apagado.desfecho, 'apagado');
});
