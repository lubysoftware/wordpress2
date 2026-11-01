/**
 * A entrega de **T018** da feature `005-retencao-e-descarte`: *"4 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-055-1,
 * UT-055-2, UT-055-3, UT-055-4), com o mesmo dado de entrada, acao e resultado
 * esperado."*
 *
 * ---
 *
 * # Os quatro casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-055 e a secao que comeca em `backlog/tests.md:831`, e os quatro casos
 * sao as linhas `:837` a `:840`. Esta suite copia ID, nome, tipo e prova, na ordem
 * do catalogo, e cada `test()` leva o ID e o nome do caso no titulo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | a prova e |
 * |---|---|---|---|
 * | `UT-055-1` | vincula os filhos ao avô em lugar de apagá-los | `feliz` | CA-8.1 |
 * | `UT-055-2` | reparenta também os anexos vinculados ao conteúdo apagado | `feliz` | CA-8.2 |
 * | `UT-055-3` | apaga em cascata as versões anteriores do conteúdo apagado | `feliz` | CA-8.3 |
 * | `UT-055-4` | deixa o armazenamento sem nenhum vínculo para conteúdo inexistente | `borda` | CA-8.4 |
 *
 * O catalogo nao traz tabela de dados para este card: a prova de cada caso e o
 * texto do criterio. O cenario e portanto o do criterio e o da primeira linha de
 * PT-003 (`.specify/migration/parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature:34`):
 * uma pagina com pagina mae, pagina filha e anexo, apagada em definitivo.
 *
 * ---
 *
 * # Nao e a suite de criterio de T017, e a diferenca esta em TRES pontos
 *
 * `./us-8-reparentar-filhos-e-anexos.test.ts` cobra a ordem das sete etapas, os
 * desvios e o que a implementacao quebraria em silencio. Esta suite nao repete
 * nada disso e cobra o catalogo pelo lado do snapshot:
 *
 * 1. **o caminho e a operacao de US-8**, {@link apagarEmDefinitivo}, com a
 *    capacidade perguntada, e nao `apagarConteudo()` direto;
 * 2. **as QUATRO tabelas estao em memoria.** A suite de T017 tem tres, e a etapa 2
 *    so aparece la como rotulo de sequencia. BR-MIGRAR-104 diz *"atravessando 4
 *    tabelas"* e PT-003 cobra *"cada uma das quatro tabelas"*; sem
 *    `term_relationships` no snapshot, UT-055-4 nao poderia dizer *"nenhum
 *    vinculo"*;
 * 3. **todo caminho que a exclusao forcada nao alcanca lanca erro** (ver
 *    {@link naoAlcancavel}). Em particular a exclusao de midia: um porte que
 *    apagasse o anexo filho derruba UT-055-2 pelo proprio colaborador.
 *
 * A porta responde **por consulta**, como a de T017, e consulta nao prevista
 * **falha** o teste em lugar de devolver lista vazia.
 *
 * ---
 *
 * # ⚠️ O que UT-055-4 afirma, e o que ele NAO afirma
 *
 * O caso diz *"nenhum vinculo para conteudo inexistente"*, e **nao e invariante
 * universal do banco**: o legado deixa vinculo pendurado de proposito fora do que
 * a cascata cobre, e o **P5**, a Decisao 2 de `pending_decisions.md` e PT-003 poem
 * esses orfaos dentro do que a paridade compara. O censo esta em
 * `reposicionamento-no-avo.ts` e em `README.md`, *O limite de CA-8.4*.
 *
 * Por isso a varredura de {@link vinculosPendurados} corre sobre o cenario do
 * criterio, em que todo vinculo e dos que a cascata cobre, e **nao** planta um
 * filho de outro tipo nem um vinculo de termo fora das taxonomias do tipo. Esses
 * orfaos ja estao afirmados em `./us-8-reparentar-filhos-e-anexos.test.ts`
 * (*"CA-8.4 (censo, caso 1)"* e *"o conjunto exato do que sumiu e do que
 * permaneceu"*). Esta suite nao fecha nenhum deles e nao decide nada sobre eles.
 *
 * O que torna o caso uma **borda** e o anexo pendurado numa **versao**: ele sobe
 * dois niveis, primeiro para o conteudo apagado pela cascata da versao (etapa 4) e
 * depois para o avo (etapa 5). So fecha nessa ordem. Com as etapas trocadas, ele
 * ficaria apontando para uma linha que morreu. A outra borda e o conteudo de
 * primeiro nivel: o avo e `0`, e `0` e *"sem vinculo"* (BR-MIGRAR-081), nao
 * vinculo pendurado.
 *
 * ---
 *
 * # Como se confere, e o que nao foi conferido
 *
 * ⚠️ **Nenhuma ancora do legado foi relida nesta tarefa:** `~/Downloads/wordpress`
 * nao existe na maquina em que T018 rodou. As citacoes de `wp-includes/post.php`
 * abaixo sao as de `apagar-em-definitivo.ts`, de T017, e as de
 * BR-MIGRAR-079 (`target_business_rules.md`), e nao foram medidas de novo.
 *
 * A comparacao caso a caso e PT-003, e exige o oraculo de pe (`scripts/oraculo/`,
 * resposta 16 de `questions.md`). Esta suite nao a executa.
 *
 * | o que esta suite NAO afirma | de quem e |
 * |---|---|
 * | a ordem das sete etapas, os desvios, a falha do `DELETE` da linha | **T017**, `./us-8-reparentar-filhos-e-anexos.test.ts` |
 * | os orfaos que o legado deixa | **T017**, idem |
 * | o que `wp_delete_comment()` faz por dentro | **BC-03**: aqui o comentario some pelo colaborador |
 * | o que `wp_delete_object_term_relationships()` faz por dentro, e o contador do termo | **BC-02**: idem |
 * | a exclusao de midia pedida direto | **BC-06**, e a **resposta 9** de `questions.md` ja decidiu |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T018 exige.
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
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  criarMarcadoresDeLixeiraDoConteudo,
} from '../armazenamento/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import type {
  Consulta,
  PortaDeDados,
  ResultadoDeEscrita,
} from '../portas/index.js';
import {
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO_ANTERIOR,
  apagarEmDefinitivo,
  type ContextoDeExclusao,
} from './index.js';

/* ── O CENARIO DO CATALOGO ────────────────────────────────────────────────── */

/** `page`, o tipo hierarquico de fabrica. */
const PAGINA = 'page';
/** `post`, o tipo plano de fabrica: e o caso de anexo mais comum que existe. */
const ARTIGO = 'post';

const AVO = 10;
const MEIO = 20;
const FILHA = 30;
const SEGUNDA_FILHA = 31;
const NETA = 35;
const ANEXO = 40;
const SEGUNDO_ANEXO = 41;
const ANEXO_DA_VERSAO = 42;
const VERSAO = 50;
const VERSAO_SEGUINTE = 51;
/** A pagina irma: tudo o que e dela tem de sair intacto. */
const VIZINHA = 60;
const ANEXO_DA_VIZINHA = 61;
const VERSAO_DA_VIZINHA = 62;

const ARTIGO_COM_ANEXO = 80;
const ANEXO_DO_ARTIGO = 81;

const COMENTARIO = 70;
const RESPOSTA = 71;
const COMENTARIO_DA_VIZINHA = 72;

/** Quem escreveu tudo no cenario. */
const AUTORA = 7;
/** O dono do site de US-8, que apaga o que nao escreveu. */
const DONO_DO_SITE = 1;

/**
 * Uma taxonomia registrada para `page`, para que a etapa 2 tenha o que remover.
 * Nenhuma das taxonomias que o cenario usa fica fora do tipo: ver a secao ⚠️ do
 * cabecalho.
 */
const TAXONOMIA_DA_PAGINA = 'assunto-da-pagina';

const TAXONOMIAS_POR_TIPO: Readonly<Record<string, readonly string[]>> = {
  [PAGINA]: [TAXONOMIA_DA_PAGINA],
};

const HIERARQUIA: Readonly<Record<string, boolean>> = {
  [PAGINA]: true,
  [ARTIGO]: false,
};

/* ── AS QUATRO TABELAS ────────────────────────────────────────────────────── */

/** `{site}posts`, nas quatro colunas que a cascata usa. */
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

/** `{site}term_relationships`, com a taxonomia ja resolvida. */
interface LinhaDeVinculoDeTermo {
  object_id: number;
  taxonomy: string;
}

interface BancoDeTeste {
  posts: LinhaDePost[];
  postmeta: LinhaDeMeta[];
  comentarios: LinhaDeComentario[];
  vinculosDeTermo: LinhaDeVinculoDeTermo[];
}

function post(
  ID: number,
  post_type: string,
  post_parent: number,
  post_status = 'publish',
): LinhaDePost {
  return { ID, post_type, post_status, post_parent };
}

function bancoDoCenario(): BancoDeTeste {
  return {
    posts: [
      post(AVO, PAGINA, 0),
      post(MEIO, PAGINA, AVO),
      post(FILHA, PAGINA, MEIO),
      post(SEGUNDA_FILHA, PAGINA, MEIO, 'draft'),
      post(NETA, PAGINA, FILHA),
      post(ANEXO, TIPO_DE_ANEXO, MEIO, 'inherit'),
      post(SEGUNDO_ANEXO, TIPO_DE_ANEXO, MEIO, 'inherit'),
      post(VERSAO, TIPO_DE_VERSAO_ANTERIOR, MEIO, 'inherit'),
      post(VERSAO_SEGUINTE, TIPO_DE_VERSAO_ANTERIOR, MEIO, 'inherit'),
      post(VIZINHA, PAGINA, AVO),
      post(ANEXO_DA_VIZINHA, TIPO_DE_ANEXO, VIZINHA, 'inherit'),
      post(VERSAO_DA_VIZINHA, TIPO_DE_VERSAO_ANTERIOR, VIZINHA, 'inherit'),
    ],
    postmeta: [
      { meta_id: 1, post_id: MEIO, meta_key: '_edit_last', meta_value: '7' },
      { meta_id: 2, post_id: VERSAO, meta_key: '_edit_last', meta_value: '7' },
      {
        meta_id: 3,
        post_id: VERSAO_SEGUINTE,
        meta_key: '_edit_last',
        meta_value: '7',
      },
      { meta_id: 4, post_id: FILHA, meta_key: '_edit_last', meta_value: '7' },
      {
        meta_id: 5,
        post_id: ANEXO,
        meta_key: '_wp_attached_file',
        meta_value: '2026/11/a.png',
      },
      { meta_id: 6, post_id: VIZINHA, meta_key: '_edit_last', meta_value: '7' },
      {
        meta_id: 7,
        post_id: VERSAO_DA_VIZINHA,
        meta_key: '_edit_last',
        meta_value: '7',
      },
    ],
    comentarios: [
      { comment_ID: COMENTARIO, comment_post_ID: MEIO },
      { comment_ID: RESPOSTA, comment_post_ID: MEIO },
      { comment_ID: COMENTARIO_DA_VIZINHA, comment_post_ID: VIZINHA },
    ],
    vinculosDeTermo: [
      { object_id: MEIO, taxonomy: TAXONOMIA_DA_PAGINA },
      { object_id: FILHA, taxonomy: TAXONOMIA_DA_PAGINA },
      { object_id: VIZINHA, taxonomy: TAXONOMIA_DA_PAGINA },
    ],
  };
}

/* ── A PORTA DE DADOS ─────────────────────────────────────────────────────── */

interface PortaDoCenario {
  readonly porta: PortaDeDados;
  /** Toda escrita pedida, na ordem. */
  readonly escritas: Consulta[];
}

/**
 * As tabelas `posts` e `postmeta` atras da porta. As outras duas sao de BC-02 e
 * BC-03, e mudam pelas colaboracoes do contexto, como no alvo.
 */
function portaDoCenario(banco: BancoDeTeste): PortaDoCenario {
  const prefixo = 'wp_';
  const escritas: Consulta[] = [];
  const postsPorPai = (pai: number, tipo: string): readonly LinhaDePost[] =>
    banco.posts.filter(
      (linha) => linha.post_parent === pai && linha.post_type === tipo,
    );

  const porta: PortaDeDados = {
    prefixoDeTabela: prefixo,

    selecionar({ texto, parametros: p }) {
      if (texto === `SELECT * FROM ${prefixo}posts WHERE ID = ?`) {
        return banco.posts
          .filter((linha) => linha.ID === Number(p[0]))
          .map((linha) => ({ ...linha }));
      }

      if (
        texto ===
        `SELECT ID FROM ${prefixo}posts WHERE post_parent = ? AND post_type = '${TIPO_DE_VERSAO_ANTERIOR}'`
      ) {
        return postsPorPai(Number(p[0]), TIPO_DE_VERSAO_ANTERIOR).map(
          (linha) => ({ ID: linha.ID }),
        );
      }

      if (
        texto ===
        `SELECT * FROM ${prefixo}posts WHERE post_parent = ? AND post_type = ?`
      ) {
        return postsPorPai(Number(p[0]), String(p[1])).map((linha) => ({
          ...linha,
        }));
      }

      if (
        texto ===
        `SELECT comment_ID FROM ${prefixo}comments WHERE comment_post_ID = ? ORDER BY comment_ID DESC`
      ) {
        return banco.comentarios
          .filter((linha) => linha.comment_post_ID === Number(p[0]))
          .sort((a, b) => b.comment_ID - a.comment_ID)
          .map((linha) => ({ comment_ID: linha.comment_ID }));
      }

      if (
        texto ===
        `SELECT meta_id FROM ${prefixo}postmeta WHERE meta_key = ? AND post_id = ?`
      ) {
        return banco.postmeta
          .filter(
            (linha) =>
              linha.meta_key === String(p[0]) &&
              linha.post_id === Number(p[1]),
          )
          .map((linha) => ({ meta_id: linha.meta_id }));
      }

      // O espaco antes do fim e do legado (`wp-includes/post.php:3938`).
      if (
        texto === `SELECT meta_id FROM ${prefixo}postmeta WHERE post_id = ? `
      ) {
        return banco.postmeta
          .filter((linha) => linha.post_id === Number(p[0]))
          .map((linha) => ({ meta_id: linha.meta_id }));
      }

      if (texto === `SELECT * FROM ${prefixo}postmeta WHERE meta_id = ?`) {
        return banco.postmeta
          .filter((linha) => linha.meta_id === Number(p[0]))
          .map((linha) => ({ ...linha }));
      }

      throw new Error(`consulta nao prevista: ${texto}`);
    },

    escrever(consulta): ResultadoDeEscrita {
      escritas.push(consulta);
      const { texto, parametros: p } = consulta;

      if (
        texto ===
        `UPDATE ${prefixo}posts SET post_parent = ? WHERE post_parent = ? AND post_type = ?`
      ) {
        const alvos = postsPorPai(Number(p[1]), String(p[2]));
        for (const linha of alvos) {
          linha.post_parent = Number(p[0]);
        }
        return { linhasAfetadas: alvos.length, idGerado: null };
      }

      if (texto === `DELETE FROM ${prefixo}posts WHERE ID = ?`) {
        const antes = banco.posts.length;
        banco.posts = banco.posts.filter((linha) => linha.ID !== Number(p[0]));
        return { linhasAfetadas: antes - banco.posts.length, idGerado: null };
      }

      if (
        texto === `DELETE FROM ${prefixo}postmeta WHERE meta_id = ?` ||
        texto.startsWith(`DELETE FROM ${prefixo}postmeta WHERE meta_id IN(`)
      ) {
        const alvos = p.map(Number);
        const antes = banco.postmeta.length;
        banco.postmeta = banco.postmeta.filter(
          (linha) => !alvos.includes(linha.meta_id),
        );
        return {
          linhasAfetadas: antes - banco.postmeta.length,
          idGerado: null,
        };
      }

      throw new Error(`escrita nao prevista: ${texto}`);
    },
  };

  return { porta, escritas };
}

/* ── O CONTEXTO ───────────────────────────────────────────────────────────── */

function familiaDeCapacidades(
  plural: string,
): Readonly<Record<string, Capacidade>> {
  return {
    delete_posts: `delete_${plural}`,
    delete_others_posts: `delete_others_${plural}`,
    delete_published_posts: `delete_published_${plural}`,
    delete_private_posts: `delete_private_${plural}`,
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    read: 'read',
  };
}

const TIPOS: readonly TipoDeConteudoNaAutorizacao[] = [
  {
    nome: PAGINA,
    traduzMetaCapacidade: true,
    capacidades: familiaDeCapacidades('pages'),
  },
  {
    nome: ARTIGO,
    traduzMetaCapacidade: true,
    capacidades: familiaDeCapacidades('posts'),
  },
];

const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'inherit', publico: false, privado: false },
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

const CAPACIDADES_DO_DONO: readonly Capacidade[] = [
  'delete_pages',
  'delete_others_pages',
  'delete_published_pages',
  'delete_private_pages',
  'delete_posts',
  'delete_others_posts',
  'delete_published_posts',
  'delete_private_posts',
];

const DONO: AtorDeAutorizacao = {
  contaId: DONO_DO_SITE,
  login: 'dono-do-site',
  existe: true,
  concessoes: CAPACIDADES_DO_DONO.map((capacidade) => ({
    capacidade,
    concedida: true,
  })),
};

/**
 * O caminho que a exclusao com forca nao percorre. Lanca em lugar de responder:
 * se a cascata cair num deles, o caso falha pelo nome do colaborador.
 */
function naoAlcancavel(nome: string): never {
  throw new Error(`caminho que esta exclusao nao percorre: ${nome}`);
}

interface Cenario {
  readonly contexto: ContextoDeExclusao;
  readonly escritas: Consulta[];
  /** Cada `pre_delete_post` que disparou: quem, e com qual forca. */
  readonly pedidos: (readonly [number, boolean])[];
  /** Cada `wp_delete_post_revision` que disparou. */
  readonly versoesAvisadas: number[];
}

function cenario(banco: BancoDeTeste): Cenario {
  const { porta, escritas } = portaDoCenario(banco);
  const pedidos: (readonly [number, boolean])[] = [];
  const versoesAvisadas: number[] = [];

  function linhaDoBanco(conteudoId: number): LinhaDePost | null {
    return banco.posts.find((linha) => linha.ID === conteudoId) ?? null;
  }

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      const linha =
        typeof referencia === 'number' ? linhaDoBanco(referencia) : null;
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
    tipoDeConteudo: (nome) => TIPOS.find((tipo) => tipo.nome === nome) ?? null,
    estadoDeConteudo: (nome) =>
      ESTADOS.find((estado) => estado.nome === nome) ?? null,
    estadoAnteriorNaLixeira(conteudoId) {
      return (
        banco.postmeta.find(
          (linha) =>
            linha.post_id === conteudoId &&
            linha.meta_key === MARCADOR_DE_ESTADO_ANTERIOR,
        )?.meta_value ?? ''
      );
    },
    paginaInicial: () => 0,
    paginaDeConteudos: () => 0,
    paginaDePoliticaDePrivacidade: () => 0,
  };

  const base: BaseDeAutorizacao = {
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte), traducaoDePrivacidade],
  };

  const contexto: ContextoDeExclusao = {
    base,
    ator: DONO,
    prazoDeRetencao: PRAZO_DE_RETENCAO_DE_FABRICA,
    relogio: { agoraEmSegundos: () => naoAlcancavel('relogio') },
    dados: porta,
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(porta),
    },
    conteudo: {
      obterPorId(conteudoId) {
        const linha = linhaDoBanco(conteudoId);
        return linha === null
          ? null
          : { id: linha.ID, estado: linha.post_status };
      },
      gravarEstado: () => naoAlcancavel('gravar estado'),
    },
    tipos: { ehHierarquico: (tipo) => HIERARQUIA[tipo] ?? false },
    classificacao: {
      taxonomiasDoTipo: (tipo) => TAXONOMIAS_POR_TIPO[tipo] ?? [],
      removerVinculosDeTermo(conteudoId, taxonomias) {
        banco.vinculosDeTermo = banco.vinculosDeTermo.filter(
          (linha) =>
            linha.object_id !== conteudoId ||
            !taxonomias.includes(linha.taxonomy),
        );
      },
    },
    versoes: {
      obterVersao(versaoId) {
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
      adiarContagem() {},
      apagarComentario(comentarioId) {
        banco.comentarios = banco.comentarios.filter(
          (linha) => linha.comment_ID !== comentarioId,
        );
        return true;
      },
    },
    // CA-8.2 reposiciona o anexo filho, e nenhum caso apaga anexo.
    exclusaoDeAnexo: () => naoAlcancavel('exclusao de midia'),
    limparPublicacaoAgendada() {},
    suspenderComentarios: () => naoAlcancavel('suspender comentarios'),
    exclusaoDefinitiva: () => naoAlcancavel('descarte sem lixeira'),
    ganchos: {
      filtrarExclusao(_exclusao, registro, forcar) {
        pedidos.push([registro.id, forcar]);
        return null;
      },
      depoisDeApagarVersao(versaoId) {
        versoesAvisadas.push(versaoId);
      },
    },
  };

  return { contexto, escritas, pedidos, versoesAvisadas };
}

/* ── O QUE SE LE DEPOIS DA CASCATA ────────────────────────────────────────── */

function paiDe(banco: BancoDeTeste, conteudoId: number): number | undefined {
  return banco.posts.find((linha) => linha.ID === conteudoId)?.post_parent;
}

function existe(banco: BancoDeTeste, conteudoId: number): boolean {
  return banco.posts.some((linha) => linha.ID === conteudoId);
}

/** Os `UPDATE` de `post_parent` emitidos: `[novo pai, pai antigo, tipo]`. */
function reposicionamentos(cena: Cenario): readonly (readonly unknown[])[] {
  return cena.escritas
    .filter((escrita) => escrita.texto.startsWith('UPDATE wp_posts'))
    .map((escrita) => escrita.parametros);
}

/** Os identificadores dos `DELETE` em `{site}posts`, na ordem. */
function linhasApagadas(cena: Cenario): readonly number[] {
  return cena.escritas
    .filter((escrita) => escrita.texto === 'DELETE FROM wp_posts WHERE ID = ?')
    .map((escrita) => Number(escrita.parametros[0]));
}

/**
 * Toda linha das quatro tabelas que aponta para um conteudo que nao existe.
 *
 * Varre o banco inteiro em vez de procurar o identificador apagado: o que o caso
 * diz e *"nenhum vinculo"*, e e assim que uma versao esquecida apareceria.
 *
 * `post_parent = 0` nao entra: e *"sem vinculo"*, e nao vinculo pendurado
 * (BR-MIGRAR-081).
 */
function vinculosPendurados(banco: BancoDeTeste): readonly string[] {
  const conteudos = new Set(banco.posts.map((linha) => linha.ID));
  const pendurado = (conteudoId: number): boolean => !conteudos.has(conteudoId);

  return [
    ...banco.posts
      .filter(
        (linha) => linha.post_parent !== 0 && pendurado(linha.post_parent),
      )
      .map((linha) => `posts:${linha.ID}->${linha.post_parent}`),
    ...banco.postmeta
      .filter((linha) => pendurado(linha.post_id))
      .map((linha) => `postmeta:${linha.meta_id}->${linha.post_id}`),
    ...banco.comentarios
      .filter((linha) => pendurado(linha.comment_post_ID))
      .map((linha) => `comments:${linha.comment_ID}->${linha.comment_post_ID}`),
    ...banco.vinculosDeTermo
      .filter((linha) => pendurado(linha.object_id))
      .map((linha) => `term_relationships:${linha.object_id}`),
  ];
}

/* ── OS QUATRO CASOS ──────────────────────────────────────────────────────── */

test('UT-055-1 vincula os filhos ao avo em lugar de apaga-los', () => {
  const banco = bancoDoCenario();
  const cena = cenario(banco);

  const resultado = apagarEmDefinitivo(cena.contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'apagado');
  assert.equal(existe(banco, MEIO), false);

  // As duas filhas continuam existindo, e agora apontam para a avo.
  assert.equal(paiDe(banco, FILHA), AVO);
  assert.equal(paiDe(banco, SEGUNDA_FILHA), AVO);
  assert.deepEqual(resultado.filhos, {
    tipoHierarquico: true,
    filhos: [FILHA, SEGUNDA_FILHA],
    comandoEmitido: true,
    linhasAfetadas: 2,
    avoId: AVO,
  });

  // `wp-includes/post.php:3908`: um `UPDATE` so para todas as filhas, com o tipo
  // do registro apagado.
  assert.deepEqual(
    reposicionamentos(cena).filter((parametros) => parametros[2] === PAGINA),
    [[AVO, MEIO, PAGINA]],
  );

  // Sobe um nivel e so: a neta continua filha da filha, que continua de pe.
  assert.equal(paiDe(banco, NETA), FILHA);
  // Nenhuma filha foi apagada, e nada alem do pai trocou nelas.
  assert.deepEqual(linhasApagadas(cena), [VERSAO, VERSAO_SEGUINTE, MEIO]);
  assert.equal(
    banco.posts.find((linha) => linha.ID === SEGUNDA_FILHA)?.post_status,
    'draft',
  );
  assert.ok(banco.postmeta.some((linha) => linha.post_id === FILHA));
  assert.ok(banco.vinculosDeTermo.some((linha) => linha.object_id === FILHA));
});

test('UT-055-2 reparenta tambem os anexos vinculados ao conteudo apagado', () => {
  const banco = bancoDoCenario();
  const cena = cenario(banco);

  const resultado = apagarEmDefinitivo(cena.contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'apagado');

  // O reposicionamento e do arquivo inteiro: a linha e o metadado continuam, e a
  // exclusao de midia nem foi chamada (ela lanca, neste cenario).
  assert.equal(paiDe(banco, ANEXO), AVO);
  assert.equal(paiDe(banco, SEGUNDO_ANEXO), AVO);
  assert.equal(resultado.anexosReposicionados, 2);
  assert.ok(
    banco.postmeta.some(
      (linha) =>
        linha.post_id === ANEXO && linha.meta_key === '_wp_attached_file',
    ),
  );

  // `wp-includes/post.php:3923`: o comando sai por versao apagada e pelo conteudo,
  // sem leitura antes. Os dois primeiros afetam zero linha.
  assert.deepEqual(
    reposicionamentos(cena).filter(
      (parametros) => parametros[2] === TIPO_DE_ANEXO,
    ),
    [
      [MEIO, VERSAO, TIPO_DE_ANEXO],
      [MEIO, VERSAO_SEGUINTE, TIPO_DE_ANEXO],
      [AVO, MEIO, TIPO_DE_ANEXO],
    ],
  );

  // O anexo de outro conteudo nao entra.
  assert.equal(paiDe(banco, ANEXO_DA_VIZINHA), VIZINHA);

  // ── Conteudo de tipo plano: "o mesmo vale" nao depende de hierarquia ──────
  // A etapa de filhos e saltada (`:3897`) e a de anexos nao tem essa condicao.
  // Sem avo, o anexo fica com `0`: sem vinculo (BR-MIGRAR-081).
  const bancoDoArtigo: BancoDeTeste = {
    posts: [
      post(ARTIGO_COM_ANEXO, ARTIGO, 0),
      post(ANEXO_DO_ARTIGO, TIPO_DE_ANEXO, ARTIGO_COM_ANEXO, 'inherit'),
    ],
    postmeta: [],
    comentarios: [],
    vinculosDeTermo: [],
  };
  const cenaDoArtigo = cenario(bancoDoArtigo);

  const doArtigo = apagarEmDefinitivo(cenaDoArtigo.contexto, {
    conteudoId: ARTIGO_COM_ANEXO,
    forcar: true,
  });

  assert.equal(doArtigo.desfecho, 'apagado');
  assert.equal(doArtigo.filhos?.tipoHierarquico, false);
  assert.equal(doArtigo.anexosReposicionados, 1);
  assert.equal(paiDe(bancoDoArtigo, ANEXO_DO_ARTIGO), 0);
});

test('UT-055-3 apaga em cascata as versoes anteriores do conteudo apagado', () => {
  const banco = bancoDoCenario();
  const cena = cenario(banco);

  const resultado = apagarEmDefinitivo(cena.contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'apagado');

  // As duas versoes morreram, e com elas o metadado delas.
  assert.deepEqual(resultado.versoesEncontradas, [VERSAO, VERSAO_SEGUINTE]);
  assert.deepEqual(resultado.versoesApagadas, [VERSAO, VERSAO_SEGUINTE]);
  assert.equal(existe(banco, VERSAO), false);
  assert.equal(existe(banco, VERSAO_SEGUINTE), false);
  assert.equal(
    banco.postmeta.some(
      (linha) =>
        linha.post_id === VERSAO || linha.post_id === VERSAO_SEGUINTE,
    ),
    false,
  );

  // "Essas sim": versao nao e reposicionada, ao contrario de filha e anexo.
  assert.equal(
    reposicionamentos(cena).some(
      (parametros) => parametros[2] === TIPO_DE_VERSAO_ANTERIOR,
    ),
    false,
  );

  // Cada versao passa pela mesma funcao, uma por vez e sem forca, e so depois
  // dispara o ponto dela (`wp-includes/post.php:3917`,
  // `wp-includes/revision.php:649`).
  assert.deepEqual(cena.pedidos, [
    [MEIO, true],
    [VERSAO, false],
    [VERSAO_SEGUINTE, false],
  ]);
  assert.deepEqual(cena.versoesAvisadas, [VERSAO, VERSAO_SEGUINTE]);

  // A versao de outro conteudo fica, com o metadado dela.
  assert.equal(paiDe(banco, VERSAO_DA_VIZINHA), VIZINHA);
  assert.ok(
    banco.postmeta.some((linha) => linha.post_id === VERSAO_DA_VIZINHA),
  );
});

test('UT-055-4 deixa o armazenamento sem nenhum vinculo para conteudo inexistente', () => {
  // O conteudo sai da lixeira, que e o caminho comum ate a exclusao definitiva:
  // os dois marcadores estao gravados. E o anexo esta pendurado numa VERSAO: a
  // borda do cabecalho, que so fecha com a etapa 4 antes da etapa 5.
  const banco = bancoDoCenario();
  const meio = banco.posts.find((linha) => linha.ID === MEIO) as LinhaDePost;
  meio.post_status = ESTADO_DE_LIXEIRA;
  banco.posts.push(post(ANEXO_DA_VERSAO, TIPO_DE_ANEXO, VERSAO, 'inherit'));
  banco.postmeta.push(
    {
      meta_id: 8,
      post_id: MEIO,
      meta_key: MARCADOR_DE_ESTADO_ANTERIOR,
      meta_value: 'publish',
    },
    {
      meta_id: 9,
      post_id: MEIO,
      meta_key: MARCADOR_DO_INSTANTE_DO_DESCARTE,
      meta_value: '1762800000',
    },
  );

  // A varredura so vale se ela comeca limpa.
  assert.deepEqual(vinculosPendurados(banco), []);

  const resultado = apagarEmDefinitivo(cenario(banco).contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(resultado.desfecho, 'apagado');
  assert.deepEqual(vinculosPendurados(banco), []);

  // As quatro tabelas, no conjunto exato do que sobrou (P5).
  assert.deepEqual(
    banco.posts.map((linha) => [linha.ID, linha.post_parent]),
    [
      [AVO, 0],
      [FILHA, AVO],
      [SEGUNDA_FILHA, AVO],
      [NETA, FILHA],
      [ANEXO, AVO],
      [SEGUNDO_ANEXO, AVO],
      [VIZINHA, AVO],
      [ANEXO_DA_VIZINHA, VIZINHA],
      [VERSAO_DA_VIZINHA, VIZINHA],
      [ANEXO_DA_VERSAO, AVO],
    ],
  );
  assert.deepEqual(
    banco.postmeta.map((linha) => linha.post_id),
    [FILHA, ANEXO, VIZINHA, VERSAO_DA_VIZINHA],
  );
  assert.deepEqual(
    banco.comentarios.map((linha) => linha.comment_ID),
    [COMENTARIO_DA_VIZINHA],
  );
  assert.deepEqual(
    banco.vinculosDeTermo.map((linha) => linha.object_id),
    [FILHA, VIZINHA],
  );

  // ── Conteudo de primeiro nivel: o avo e `0`, e `0` nao e vinculo ───────────
  const bancoNaRaiz = bancoDoCenario();
  const meioNaRaiz = bancoNaRaiz.posts.find(
    (linha) => linha.ID === MEIO,
  ) as LinhaDePost;
  meioNaRaiz.post_parent = 0;

  const naRaiz = apagarEmDefinitivo(cenario(bancoNaRaiz).contexto, {
    conteudoId: MEIO,
    forcar: true,
  });

  assert.equal(naRaiz.desfecho, 'apagado');
  assert.equal(paiDe(bancoNaRaiz, FILHA), 0);
  assert.equal(paiDe(bancoNaRaiz, ANEXO), 0);
  assert.deepEqual(vinculosPendurados(bancoNaRaiz), []);
});
