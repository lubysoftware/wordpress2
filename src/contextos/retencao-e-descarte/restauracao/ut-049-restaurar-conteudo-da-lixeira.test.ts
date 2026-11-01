/**
 * A entrega de **T008** da feature `005-retencao-e-descarte`: *"8 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-049-1,
 * UT-049-2, UT-049-3, UT-049-4, UT-049-5, UT-049-6, UT-049-7, UT-049-8), com o
 * mesmo dado de entrada, acao e resultado esperado. Os 2 testes de regra de
 * negocio (UT-049-7, UT-049-8) entram na mesma suite."*
 *
 * ---
 *
 * # Os oito casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-049 e a secao que comeca em `backlog/tests.md:752`, e os oito casos
 * sao as linhas `:758` a `:765`. Esta suite copia ID, nome, tipo e prova, na ordem
 * do catalogo, e cada `test()` leva o ID e o nome do caso no titulo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | a prova e |
 * |---|---|---|---|
 * | `UT-049-1` | grava rascunho ao restaurar, e não o estado anterior ao descarte | `feliz` | CA-3.1 |
 * | `UT-049-2` | devolve ao anexo restaurado a visibilidade herdada do conteúdo de destino | `feliz` | CA-3.2 |
 * | `UT-049-3` | apaga do conteúdo restaurado os dados de descarte | `feliz` | CA-3.3 |
 * | `UT-049-4` | mantém o conteúdo restaurado fora do ar até ser publicado de novo | `borda` | CA-3.4 |
 * | `UT-049-5` | decide a permissão de restaurar pelo estado gravado no descarte | `feliz` | CA-3.5 |
 * | `UT-049-6` | recusa a restauração a quem não tem a capacidade do estado anterior | `erro` | CA-3.5 |
 * | `UT-049-7` | restaura como rascunho mesmo o conteúdo que estava publicado | `feliz` | `R2` |
 * | `UT-049-8` | exige capacidades diferentes para dois conteúdos na lixeira com estados anteriores diferentes | `feliz` | a 2a regra de negocio de US-3 |
 *
 * O catalogo nao traz tabela de dados para este card: a prova de cada caso e o
 * texto do criterio ou da regra. O cenario e portanto o do criterio e o de PT-003
 * (`.specify/migration/parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature:61`):
 * *"um conteudo publicado"*, descartado e depois restaurado.
 *
 * ---
 *
 * # Nao e a suite de criterio de T007, e a diferenca esta em TRES pontos
 *
 * `./us-3-restaurar-conteudo.test.ts` cobra a ordem dos treze passos, a falha da
 * gravacao e as guardas, sobre uma porta programada em que **o teste planta o
 * marcador**. Esta suite nao repete nada disso e cobra o catalogo pelo lado do
 * snapshot:
 *
 * 1. **quem grava a memoria e o descarte de verdade.** Todo caso comeca em
 *    `descartar()` e termina em {@link restaurar}, com
 *    {@link FonteDeConteudoNaAutorizacao.estadoAnteriorNaLixeira} lendo a mesma
 *    tabela. UT-049-5 diz *"gravado no descarte"*: um valor plantado pelo teste
 *    nao afirmaria isso;
 * 2. **as tabelas estao em memoria e a cascata e a real**, `cascataNoDescarte` e
 *    `cascataNaRestauracao`, logo os **tres** marcadores nascem e morrem por
 *    comando, e UT-049-3 afirma o que sobrou em `{site}postmeta`;
 * 3. **os atores sao os de fabrica**, com as concessoes transcritas de
 *    `schema.php`, e a resposta sobre ler o conteudo vem da traducao real de
 *    `read_post`. *"Fora do ar"* (UT-049-4) e *"visibilidade"* (UT-049-2) sao
 *    respostas da autorizacao, nao comparacao com a palavra `draft`.
 *
 * A porta responde **por consulta**, como as de T004 e T018, e consulta nao
 * prevista **falha** o teste em lugar de devolver lista vazia.
 *
 * ---
 *
 * # ⚠️ Os limites do que estes casos afirmam
 *
 * - **UT-049-3 nao fala de `_wp_desired_post_slug`.** O metadado e o sufixo
 *   `__trashed` moram dentro de `wp_update_post()`
 *   (`wp-includes/post.php:4874`-`:4881`) e ainda nao tem dono no alvo: ver
 *   `ConteudoNaRestauracao.gravarEstado` e *O que T007 entrega* no `README.md`.
 *   *"Os dados de descarte"* aqui sao os **tres** marcadores de lixeira. Se
 *   CA-3.3 inclui ou nao o quarto e pergunta aberta, e esta suite nao a responde.
 * - **UT-049-5, UT-049-6 e UT-049-8 valem para o conteudo do proprio ator.** Para o
 *   alheio o legado nao le o marcador (`wp-includes/capabilities.php:166`-`:172`).
 *   UT-049-8 afirma esse limite na ultima linha, para que o caso nao seja lido como
 *   universal.
 * - **UT-049-2 chega ao anexo em `trash` por `descartarParaALixeira()`.**
 *   `MEDIA_TRASH` e falsa de fabrica e a **resposta 9** decidiu que apagar midia
 *   continua definitivo: o que este caso cobre e a chamada direta a
 *   `wp_trash_post()`, que nao le a constante.
 * - **A resolucao do estado do anexo na leitura e fixture.** `get_post_status()` e
 *   da feature 006 e a regra de dependencia 3 proibe o `import`; {@link
 *   estadoNaLeitura} transcreve as linhas do legado. Isso nao esconde o que o caso
 *   prova: a restauracao que gravasse o estado do pai, ou o anterior, derrubaria o
 *   teste, porque a leitura deixaria de acompanhar o pai.
 * - **O "publicar de novo" de UT-049-4 e a escrita de BC-01 pela porta.** O caso
 *   afirma que a restauracao nao publica, e nao o que publicar faz.
 *
 * ---
 *
 * # Como se confere, e o que nao foi conferido
 *
 * `~/Downloads/wordpress` nao existe na maquina em que T008 rodou. As ancoras
 * citadas aqui foram relidas na etiqueta `7.1.2` de `github.com/WordPress/WordPress`
 * (`version.php`: `$wp_version` 7.1.2, `$wp_db_version` 61833), nos arquivos
 * `wp-includes/post.php`, `wp-includes/capabilities.php`, `wp-admin/post.php` e
 * `wp-admin/includes/schema.php`.
 *
 * A comparacao caso a caso e o cenario *"A lixeira guarda o estado anterior em
 * metadado e restaurar devolve como rascunho"* de PT-003, e exige o oraculo de pe
 * (`scripts/oraculo/`, resposta 16 de `questions.md`). Esta suite nao a executa.
 *
 * | o que esta suite NAO afirma | de quem e |
 * |---|---|
 * | a ordem dos treze passos, a falha da gravacao, as guardas, `pre_untrash_post` | **T007**, `./us-3-restaurar-conteudo.test.ts` |
 * | os lotes da restauracao de comentarios, e o `post-trashed` inesperado | **T005** e **T006**: aqui os comentarios so voltam |
 * | a tela, os textos de 410 e de 500 | **a borda**: nenhum caso deste card os pede |
 * | a conferencia da matriz de fabrica contra o dado gravado | `ut-013`/`ut-014` da feature 001 |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T008 exige.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  criarArmazenamentoDeRetencao,
} from '../armazenamento/index.js';
import {
  ESTADO_DE_SUSPENSAO_EM_CASCATA,
  cascataNaRestauracao,
  cascataNoDescarte,
  type ContextoDaCascataDeComentarios,
} from '../cascata-de-comentarios/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import {
  ESTADO_DE_LIXEIRA,
  descartar,
  descartarParaALixeira,
  type ContextoDeDescarte,
} from '../descarte/index.js';
import { TIPO_DE_ANEXO } from '../exclusao/index.js';
import type {
  Consulta,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import {
  CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  ESTADO_DE_RASCUNHO,
  ESTADO_HERDADO,
  MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  estadoAnteriorNaRestauracao,
  restaurar,
  restauradoNaVisaoDoChamador,
  type ContextoDeRestauracao,
  type GanchosDaRestauracao,
} from './index.js';

/* ── O CENARIO DO CATALOGO ────────────────────────────────────────────────── */

/**
 * O tipo em linha do tempo: `capability_type => 'post'` e `map_meta_cap => true`
 * (`wp-includes/post.php:32` e `:33`).
 */
const TIPO_EM_LINHA_DO_TEMPO = 'post';

const CONTEUDO = 42;
const VIZINHO = 43;
const ANEXO = 44;
const PAI_DO_ANEXO = 45;

const CONTA_DA_EDITORA = 3;
const CONTA_DA_AUTORA = 7;
const CONTA_DO_COLABORADOR = 11;
const CONTA_DA_ASSINANTE = 13;

/** `time()` do cenario: nada nesta suite le hora real. */
const AGORA = 1762800000;

/** Um metadado que nao e de lixeira: tem de sobreviver a restauracao. */
const METADADO_ALHEIO_A_LIXEIRA = '_thumbnail_id';

/* ── AS TRES TABELAS ──────────────────────────────────────────────────────── */

/** `{site}posts`, nas cinco colunas que este card le. */
interface LinhaDeConteudo {
  readonly id: number;
  readonly tipo: string;
  estado: string;
  readonly autorId: number;
  readonly paiId: number;
}

/** `{site}postmeta`. */
interface LinhaDeMetadado {
  readonly metaId: number;
  readonly postId: number;
  readonly chave: string;
  readonly valor: ValorDeColuna;
}

/** `{site}comments`, nas tres colunas que a cascata usa. */
interface LinhaDeComentario {
  readonly id: number;
  readonly conteudoId: number;
  estado: string;
}

function artigo(id: number, estado: string, autorId: number): LinhaDeConteudo {
  return { id, tipo: TIPO_EM_LINHA_DO_TEMPO, estado, autorId, paiId: 0 };
}

/** `meta_value` e `longtext`: o inteiro volta da coluna como cadeia decimal. */
function comoColuna(valor: ValorDeParametro): ValorDeColuna {
  return typeof valor === 'number' ? String(valor) : valor;
}

interface OpcoesDoBanco {
  readonly conteudos: readonly LinhaDeConteudo[];
  readonly comentarios?: readonly LinhaDeComentario[];
  /** Metadados que ja existem antes do descarte. */
  readonly metadados?: readonly { postId: number; chave: string; valor: string }[];
}

interface BancoEmMemoria {
  readonly porta: PortaDeDados;
  readonly conteudos: readonly LinhaDeConteudo[];
  readonly metadados: readonly LinhaDeMetadado[];
  readonly comentarios: readonly LinhaDeComentario[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: readonly Consulta[];
}

/**
 * As tres tabelas atras da porta de dados.
 *
 * As formas de leitura e de escrita sao as que `armazenamento/metadado.ts` e
 * `armazenamento/comentarios-do-conteudo.ts` emitem, e qualquer outra **estoura**.
 * `{site}posts` nao passa pela porta: quem a le e a grava neste modulo e a
 * colaboracao com BC-01.
 */
function abrirBanco(opcoes: OpcoesDoBanco): BancoEmMemoria {
  const conteudos = opcoes.conteudos.map((linha) => ({ ...linha }));
  const comentarios = (opcoes.comentarios ?? []).map((linha) => ({ ...linha }));
  const escritas: Consulta[] = [];
  const metadados: LinhaDeMetadado[] = [];
  let proximoMetaId = 1;

  function acrescentar(
    postId: number,
    chave: string,
    valor: ValorDeColuna,
  ): number {
    const metaId = proximoMetaId;
    proximoMetaId += 1;
    metadados.push({ metaId, postId, chave, valor });
    return metaId;
  }

  for (const metadado of opcoes.metadados ?? []) {
    acrescentar(metadado.postId, metadado.chave, metadado.valor);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela: 'wp_',

    selecionar(consulta) {
      // `update_meta_cache()` (`wp-includes/meta.php:1148`): todo `get_post_meta()`.
      if (consulta.texto.startsWith('SELECT post_id,')) {
        const postId = Number(consulta.parametros[0]);
        return metadados
          .filter((linha) => linha.postId === postId)
          .map((linha) => ({
            post_id: linha.postId,
            meta_key: linha.chave,
            meta_value: linha.valor,
          }));
      }

      // O `SELECT meta_id` antes do `DELETE` (`wp-includes/meta.php:456`-`:468`).
      if (consulta.texto.startsWith('SELECT meta_id')) {
        const chave = String(consulta.parametros[0]);
        const postId = Number(consulta.parametros[1]);
        return metadados
          .filter((linha) => linha.chave === chave && linha.postId === postId)
          .map((linha) => ({ meta_id: linha.metaId }));
      }

      // `wp-includes/post.php:4288`.
      if (consulta.texto.startsWith('SELECT comment_ID,')) {
        const conteudoId = Number(consulta.parametros[0]);
        return comentarios
          .filter((linha) => linha.conteudoId === conteudoId)
          .map((linha) => ({
            comment_ID: linha.id,
            comment_approved: linha.estado,
          }));
      }

      throw new Error(`leitura fora do contrato: ${consulta.texto}`);
    },

    escrever(consulta) {
      escritas.push(consulta);

      if (consulta.texto.startsWith('INSERT INTO wp_postmeta')) {
        const metaId = acrescentar(
          Number(consulta.parametros[0]),
          String(consulta.parametros[1]),
          comoColuna(consulta.parametros[2] ?? null),
        );
        return { linhasAfetadas: 1, idGerado: metaId };
      }

      if (consulta.texto.startsWith('DELETE FROM wp_postmeta')) {
        const alvos = consulta.parametros.map(Number);
        const antes = metadados.length;
        for (let i = metadados.length - 1; i >= 0; i -= 1) {
          if (alvos.includes((metadados[i] as LinhaDeMetadado).metaId)) {
            metadados.splice(i, 1);
          }
        }
        return { linhasAfetadas: antes - metadados.length, idGerado: null };
      }

      // `wp-includes/post.php:4302`, um comando para todos os do conteudo.
      if (consulta.texto.endsWith('WHERE comment_post_ID = ?')) {
        const conteudoId = Number(consulta.parametros[1]);
        const alvos = comentarios.filter(
          (linha) => linha.conteudoId === conteudoId,
        );
        for (const linha of alvos) {
          linha.estado = String(consulta.parametros[0]);
        }
        return { linhasAfetadas: alvos.length, idGerado: null };
      }

      // `wp-includes/post.php:4366`, um comando por lote.
      if (consulta.texto.includes('WHERE comment_ID IN (')) {
        const [estado, ...ids] = consulta.parametros;
        const alvos = comentarios.filter((linha) =>
          ids.map(Number).includes(linha.id),
        );
        for (const linha of alvos) {
          linha.estado = String(estado);
        }
        return { linhasAfetadas: alvos.length, idGerado: null };
      }

      throw new Error(`escrita fora do contrato: ${consulta.texto}`);
    },
  };

  return { porta, conteudos, metadados, comentarios, escritas };
}

/* ── O QUE A AUTORIZACAO CONSULTA ─────────────────────────────────────────── */

/**
 * `get_post_type_capabilities()`, para `capability_type => 'post'`
 * (`wp-includes/post.php:2034`-`:2073`). `attachment` declara o mesmo
 * `capability_type` e `map_meta_cap` (`:108` e `:112`).
 */
const CAPACIDADES_DO_TIPO: Readonly<Record<string, Capacidade>> = {
  read: 'read',
  edit_posts: 'edit_posts',
  edit_others_posts: 'edit_others_posts',
  edit_published_posts: 'edit_published_posts',
  edit_private_posts: 'edit_private_posts',
  read_private_posts: 'read_private_posts',
  delete_posts: 'delete_posts',
  delete_others_posts: 'delete_others_posts',
  delete_published_posts: 'delete_published_posts',
  delete_private_posts: 'delete_private_posts',
};

/** `create_initial_post_types()`: `public`, `private` (`wp-includes/post.php:660`-`:757`). */
const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'future', publico: false, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'pending', publico: false, privado: false },
  { nome: 'private', publico: false, privado: true },
  { nome: ESTADO_HERDADO, publico: false, privado: false },
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

/** `populate_roles_160()` e `populate_roles_210()` (`wp-admin/includes/schema.php`). */
function atorComAsConcessoesDe(
  contaId: number,
  papel: string,
  concessoes: readonly string[],
): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: concessoes.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

/**
 * `editor`: `schema.php:793`-`:811` e `:850`-`:864`, com a familia de conteudo que
 * este card pergunta.
 */
const EDITORA = atorComAsConcessoesDe(CONTA_DA_EDITORA, 'editor', [
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
  'edit_private_posts',
  'publish_posts',
  'read',
  'read_private_posts',
  'delete_posts',
  'delete_others_posts',
  'delete_published_posts',
  'delete_private_posts',
]);

/**
 * `author`: `schema.php:815`-`:822` e `:875`-`:876`. Tem `delete_posts` e
 * `delete_published_posts`, e nao tem `delete_others_posts`.
 */
const AUTORA = atorComAsConcessoesDe(CONTA_DA_AUTORA, 'author', [
  'upload_files',
  'edit_posts',
  'edit_published_posts',
  'publish_posts',
  'read',
  'delete_posts',
  'delete_published_posts',
]);

/**
 * `contributor`: `schema.php:826`-`:829` e `:881`. ⚠️ **Tem `delete_posts` e nao
 * tem `delete_published_posts`**: e o ator que separa os dois estados anteriores.
 */
const COLABORADOR = atorComAsConcessoesDe(CONTA_DO_COLABORADOR, 'contributor', [
  'edit_posts',
  'read',
  'delete_posts',
]);

/**
 * `subscriber`: `schema.php:833`-`:834`. So le, e e quem responde *"esta no ar?"*
 * sem que autoria ou edicao entrem na conta.
 */
const ASSINANTE = atorComAsConcessoesDe(CONTA_DA_ASSINANTE, 'subscriber', [
  'read',
  'level_0',
]);

/* ── O CENARIO ────────────────────────────────────────────────────────────── */

interface Cenario {
  /** O contexto de descarte de um ator, com a cascata real. */
  descarte(ator: AtorDeAutorizacao): ContextoDeDescarte;
  /** O contexto de restauracao de um ator, com a cascata real. */
  restauracao(
    ator: AtorDeAutorizacao,
    ganchos?: GanchosDaRestauracao,
  ): ContextoDeRestauracao;
  /** `map_meta_cap()`: o que a capacidade exige daquele conteudo, para o ator. */
  exigidas(
    ator: AtorDeAutorizacao,
    capacidade: Capacidade,
    conteudoId: number,
  ): readonly string[];
  /** `current_user_can( 'read_post', $id )`. */
  podeLer(ator: AtorDeAutorizacao, conteudoId: number): boolean;
  /** `get_post_meta( $id, '_wp_trash_meta_status', true )`, sobre a tabela. */
  memoria(conteudoId: number): string;
  /** A coluna `post_status`, como ela esta agora. */
  estadoDaLinha(conteudoId: number): string;
  /** Tudo o que passou pela gravacao de BC-01, na ordem. */
  gravacoes(conteudoId: number): readonly string[];
  /** As chaves em `{site}postmeta` daquele conteudo, na ordem de `meta_id`. */
  chaves(conteudoId: number): readonly string[];
  /** A coluna `comment_approved` de cada comentario do conteudo. */
  estadosDosComentarios(conteudoId: number): readonly string[];
  /** O que muda se algum comando sair. */
  retrato(): string;
  readonly banco: BancoEmMemoria;
}

/**
 * Monta o contexto sobre o banco em memoria.
 *
 * `estadoAnteriorNaLixeira` le **a mesma tabela** em que o descarte grava, como
 * `wp-includes/capabilities.php:154`: quem escreveu aquele valor foi o descarte.
 */
function abrirCenario(opcoes: OpcoesDoBanco): Cenario {
  const banco = abrirBanco(opcoes);
  const armazenamento = criarArmazenamentoDeRetencao(banco.porta);
  const marcadores = armazenamento.marcadoresDoConteudo;
  const gravacoes: { id: number; estado: string }[] = [];

  function linha(conteudoId: number): LinhaDeConteudo | null {
    return banco.conteudos.find((candidata) => candidata.id === conteudoId) ?? null;
  }

  /**
   * `get_post_status()` (`wp-includes/post.php:1290`-`:1336`), sem o filtro. E da
   * feature 006, e fica transcrita aqui: ver a secao ⚠️ do cabecalho.
   */
  function estadoNaLeitura(conteudo: LinhaDeConteudo): string {
    if (conteudo.tipo !== TIPO_DE_ANEXO) {
      return conteudo.estado;
    }

    if (conteudo.estado === ESTADO_HERDADO) {
      const pai = linha(conteudo.paiId);
      if (conteudo.paiId === 0 || pai === null || conteudo.id === conteudo.paiId) {
        return 'publish';
      }
      const estadoDoPai = estadoNaLeitura(pai);
      if (estadoDoPai === ESTADO_DE_LIXEIRA) {
        const anterior = marcadores.estadoAnterior(pai.id);
        return anterior === '' ? 'publish' : anterior;
      }
      return estadoDoPai;
    }

    return ['private', 'trash', 'auto-draft'].includes(conteudo.estado)
      ? conteudo.estado
      : 'publish';
  }

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      const conteudo = linha(typeof referencia === 'number' ? referencia : 0);
      if (conteudo === null) {
        return null;
      }
      return {
        id: conteudo.id,
        tipo: conteudo.tipo,
        estado: conteudo.estado,
        estadoParaLeitura: estadoNaLeitura(conteudo),
        autorId: conteudo.autorId,
        paiId: conteudo.paiId,
      };
    },
    tipoDeConteudo(nome) {
      return nome === TIPO_EM_LINHA_DO_TEMPO || nome === TIPO_DE_ANEXO
        ? { nome, traduzMetaCapacidade: true, capacidades: CAPACIDADES_DO_TIPO }
        : null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS.find((estado) => estado.nome === nome) ?? null;
    },
    estadoAnteriorNaLixeira(conteudoId) {
      return marcadores.estadoAnterior(conteudoId);
    },
    paginaInicial: () => 0,
    paginaDeConteudos: () => 0,
    paginaDePoliticaDePrivacidade: () => 0,
  };

  const base: BaseDeAutorizacao = {
    // A matriz chega vazia: tudo vem das concessoes individuais (`PERM-1`), e
    // nenhuma decisao olha nome de papel (P3).
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  const obterPorId = (conteudoId: number) => {
    const conteudo = linha(conteudoId);
    return conteudo === null
      ? null
      : { id: conteudo.id, estado: conteudo.estado, tipo: conteudo.tipo };
  };

  const gravarEstado = (conteudoId: number, estado: string): number => {
    const conteudo = linha(conteudoId);
    assert.ok(conteudo !== null);
    conteudo.estado = estado;
    gravacoes.push({ id: conteudoId, estado });
    return conteudoId;
  };

  const cascata: ContextoDaCascataDeComentarios = {
    conteudo: { obterPorId },
    armazenamento,
  };

  return {
    banco,
    descarte: (ator) => ({
      base,
      ator,
      prazoDeRetencao: PRAZO_DE_RETENCAO_DE_FABRICA,
      relogio: { agoraEmSegundos: () => AGORA },
      armazenamento,
      conteudo: { obterPorId, gravarEstado },
      exclusaoDefinitiva() {
        // A lixeira esta ligada: `wp-includes/post.php:4085` nao desvia.
        throw new Error('exclusao definitiva fora do cenario');
      },
      suspenderComentarios: cascataNoDescarte(cascata),
    }),
    restauracao: (ator, ganchos) => ({
      base,
      ator,
      armazenamento,
      conteudo: { obterPorId, gravarEstado },
      restaurarComentarios: cascataNaRestauracao(cascata),
      ...(ganchos === undefined ? {} : { ganchos }),
    }),
    exigidas: (ator, capacidade, conteudoId) =>
      capacidadesExigidas(comAtor(base, ator), capacidade, conteudoId),
    podeLer: (ator, conteudoId) =>
      perguntarPermissao(comAtor(base, ator), 'read_post', conteudoId),
    memoria: (conteudoId) => marcadores.estadoAnterior(conteudoId),
    estadoDaLinha(conteudoId) {
      const conteudo = linha(conteudoId);
      assert.ok(conteudo !== null);
      return conteudo.estado;
    },
    gravacoes: (conteudoId) =>
      gravacoes
        .filter((gravacao) => gravacao.id === conteudoId)
        .map((gravacao) => gravacao.estado),
    chaves: (conteudoId) =>
      banco.metadados
        .filter((metadado) => metadado.postId === conteudoId)
        .map((metadado) => metadado.chave),
    estadosDosComentarios: (conteudoId) =>
      banco.comentarios
        .filter((comentario) => comentario.conteudoId === conteudoId)
        .map((comentario) => comentario.estado),
    retrato: () =>
      JSON.stringify({
        conteudos: banco.conteudos,
        metadados: banco.metadados.map((metadado) => [
          metadado.metaId,
          metadado.postId,
          metadado.chave,
        ]),
        comentarios: banco.comentarios,
        escritas: banco.escritas.length,
        gravacoes,
      }),
  };
}

/** A ida para a lixeira, que e o que grava a memoria de todo caso. */
function descartarComo(
  cena: Cenario,
  ator: AtorDeAutorizacao,
  conteudoId: number,
): void {
  assert.equal(
    descartar(cena.descarte(ator), { conteudoId }).desfecho,
    'descartado',
  );
  assert.equal(cena.estadoDaLinha(conteudoId), ESTADO_DE_LIXEIRA);
}

/* ── UT-049-1 ─────────────────────────────────────────────────────────────── */

test('UT-049-1 grava rascunho ao restaurar, e nao o estado anterior ao descarte', () => {
  for (const estadoAnterior of ['publish', 'future', 'private', 'pending']) {
    // Entrada: um conteudo da editora, descartado naquele estado.
    const cena = abrirCenario({
      conteudos: [artigo(CONTEUDO, estadoAnterior, CONTA_DA_EDITORA)],
    });
    descartarComo(cena, EDITORA, CONTEUDO);
    assert.equal(cena.memoria(CONTEUDO), estadoAnterior);

    // Acao: a restauracao.
    const resultado = restaurar(cena.restauracao(EDITORA), {
      conteudoId: CONTEUDO,
    });

    // Resultado: rascunho (`wp-includes/post.php:4209`), embora a funcao soubesse
    // o estado anterior, que ela leu em `:4181` e devolve no resultado.
    assert.equal(resultado.desfecho, 'restaurado', estadoAnterior);
    assert.equal(resultado.estadoAnterior, estadoAnterior);
    assert.equal(resultado.estadoGravado, ESTADO_DE_RASCUNHO);
    assert.equal(cena.estadoDaLinha(CONTEUDO), 'draft');
    assert.deepEqual(cena.gravacoes(CONTEUDO), [ESTADO_DE_LIXEIRA, 'draft']);
  }
});

/* ── UT-049-2 ─────────────────────────────────────────────────────────────── */

test('UT-049-2 devolve ao anexo restaurado a visibilidade herdada do conteudo de destino', () => {
  // Entrada: um anexo **privado por si**, pendurado num conteudo publicado. O
  // estado proprio dele manda (`wp-includes/post.php:1325`-`:1336`): a assinante
  // nao le o anexo, embora leia o destino.
  const cena = abrirCenario({
    conteudos: [
      artigo(PAI_DO_ANEXO, 'publish', CONTA_DA_AUTORA),
      {
        id: ANEXO,
        tipo: TIPO_DE_ANEXO,
        estado: 'private',
        autorId: CONTA_DA_AUTORA,
        paiId: PAI_DO_ANEXO,
      },
    ],
  });
  assert.equal(cena.podeLer(ASSINANTE, PAI_DO_ANEXO), true);
  assert.equal(cena.podeLer(ASSINANTE, ANEXO), false);

  // O painel so chega aqui com `MEDIA_TRASH`: ver a secao ⚠️ do cabecalho.
  assert.equal(
    descartarParaALixeira(cena.descarte(AUTORA), ANEXO).desfecho,
    'descartado',
  );

  // Acao: a restauracao.
  const resultado = restaurar(cena.restauracao(AUTORA), { conteudoId: ANEXO });

  // Resultado: `inherit` (`wp-includes/post.php:4209`), que nao e o estado anterior
  // nem o estado do destino. Nenhum dos dois foi copiado para a linha.
  assert.equal(resultado.desfecho, 'restaurado');
  assert.equal(resultado.estadoAnterior, 'private');
  assert.equal(resultado.estadoGravado, ESTADO_HERDADO);
  assert.equal(cena.estadoDaLinha(ANEXO), 'inherit');
  assert.equal(cena.estadoDaLinha(PAI_DO_ANEXO), 'publish');

  // Quem resolve agora e o destino, e a resposta muda com ele: *"volta a herdar"*
  // e acompanhar, nao ter copiado uma vez (`:1302`-`:1323`).
  assert.equal(cena.podeLer(ASSINANTE, ANEXO), true);

  cena.restauracao(AUTORA).conteudo.gravarEstado(PAI_DO_ANEXO, 'private');
  assert.deepEqual(cena.exigidas(ASSINANTE, 'read_post', ANEXO), [
    'read_private_posts',
  ]);
  assert.equal(cena.podeLer(ASSINANTE, ANEXO), false);
  assert.equal(cena.estadoDaLinha(ANEXO), 'inherit');
});

/* ── UT-049-3 ─────────────────────────────────────────────────────────────── */

test('UT-049-3 apaga do conteudo restaurado os dados de descarte', () => {
  // Entrada: dois conteudos na lixeira, cada um com comentarios, e um metadado
  // que nao tem nada a ver com a lixeira.
  const cena = abrirCenario({
    conteudos: [
      artigo(CONTEUDO, 'publish', CONTA_DA_EDITORA),
      artigo(VIZINHO, 'publish', CONTA_DA_EDITORA),
    ],
    comentarios: [
      { id: 5, conteudoId: CONTEUDO, estado: '1' },
      { id: 6, conteudoId: CONTEUDO, estado: '0' },
      { id: 7, conteudoId: VIZINHO, estado: '1' },
    ],
    metadados: [
      { postId: CONTEUDO, chave: METADADO_ALHEIO_A_LIXEIRA, valor: '99' },
    ],
  });
  descartarComo(cena, EDITORA, CONTEUDO);
  descartarComo(cena, EDITORA, VIZINHO);

  const tresMarcadores = [
    MARCADOR_DE_ESTADO_ANTERIOR,
    MARCADOR_DO_INSTANTE_DO_DESCARTE,
    MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  ];

  assert.deepEqual(cena.chaves(CONTEUDO), [
    METADADO_ALHEIO_A_LIXEIRA,
    ...tresMarcadores,
  ]);
  assert.deepEqual(cena.estadosDosComentarios(CONTEUDO), [
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
  ]);

  // Acao: a restauracao de um dos dois.
  const resultado = restaurar(cena.restauracao(EDITORA), {
    conteudoId: CONTEUDO,
  });

  // Resultado: os tres marcadores sumiram da tabela (`wp-includes/post.php:4228`,
  // `:4229` e `:4372`), e so eles. O terceiro so sai porque a memoria dos
  // comentarios foi usada: eles voltaram ao que eram.
  assert.equal(resultado.desfecho, 'restaurado');
  assert.deepEqual(cena.chaves(CONTEUDO), [METADADO_ALHEIO_A_LIXEIRA]);
  assert.equal(cena.memoria(CONTEUDO), '');
  assert.deepEqual(cena.estadosDosComentarios(CONTEUDO), ['1', '0']);

  // A vizinha na lixeira nao perde nada: o `DELETE` e por `meta_id`.
  assert.deepEqual(cena.chaves(VIZINHO), tresMarcadores);
  assert.equal(cena.memoria(VIZINHO), 'publish');
  assert.deepEqual(cena.estadosDosComentarios(VIZINHO), [
    ESTADO_DE_SUSPENSAO_EM_CASCATA,
  ]);
});

/* ── UT-049-4 ─────────────────────────────────────────────────────────────── */

test('UT-049-4 mantem o conteudo restaurado fora do ar ate ser publicado de novo', () => {
  // Entrada: um conteudo publicado, que a assinante le.
  const cena = abrirCenario({
    conteudos: [artigo(CONTEUDO, 'publish', CONTA_DA_EDITORA)],
  });
  assert.equal(cena.podeLer(ASSINANTE, CONTEUDO), true);

  descartarComo(cena, EDITORA, CONTEUDO);
  assert.equal(cena.podeLer(ASSINANTE, CONTEUDO), false);

  // Acao: a restauracao.
  const contexto = cena.restauracao(EDITORA);
  assert.equal(restaurar(contexto, { conteudoId: CONTEUDO }).desfecho, 'restaurado');

  // Resultado: saiu da lixeira e continua fora do ar. Para quem so le, `read_post`
  // caiu em `edit_post` (`wp-includes/capabilities.php:378`-`:379`).
  assert.equal(cena.estadoDaLinha(CONTEUDO), 'draft');
  assert.equal(cena.podeLer(ASSINANTE, CONTEUDO), false);
  assert.deepEqual(cena.exigidas(ASSINANTE, 'read_post', CONTEUDO), [
    'edit_others_posts',
  ]);

  // A borda: pedir de novo nao empurra o conteudo para a frente. A guarda de
  // `wp-includes/post.php:4177` devolve falso, sem comando nenhum, e a tela
  // responderia 500 (`wp-admin/post.php:302`-`:303`).
  const antes = cena.retrato();
  const segunda = restaurar(contexto, { conteudoId: CONTEUDO });

  assert.equal(segunda.desfecho, 'fora-da-lixeira');
  assert.equal(restauradoNaVisaoDoChamador(segunda), false);
  assert.equal(cena.retrato(), antes);
  assert.equal(cena.podeLer(ASSINANTE, CONTEUDO), false);

  // So a gravacao de quem publica o traz de volta, e ela nao e desta operacao.
  contexto.conteudo.gravarEstado(CONTEUDO, 'publish');
  assert.equal(cena.podeLer(ASSINANTE, CONTEUDO), true);

  // E o agendado nao volta para a fila de publicacao: nem `publish`, nem `future`.
  const agendado = abrirCenario({
    conteudos: [artigo(CONTEUDO, 'future', CONTA_DA_EDITORA)],
  });
  descartarComo(agendado, EDITORA, CONTEUDO);
  restaurar(agendado.restauracao(EDITORA), { conteudoId: CONTEUDO });

  assert.deepEqual(agendado.gravacoes(CONTEUDO), [ESTADO_DE_LIXEIRA, 'draft']);
});

/* ── UT-049-5 ─────────────────────────────────────────────────────────────── */

test('UT-049-5 decide a permissao de restaurar pelo estado gravado no descarte', () => {
  // Entrada: conteudos da propria autora, descartados em estados diferentes.
  // Na lixeira a coluna diz `trash` para todos: a unica coisa que os separa e a
  // memoria, e quem a gravou foi o descarte.
  const casos = [
    { estadoAnterior: 'publish', exigida: 'delete_published_posts' },
    { estadoAnterior: 'future', exigida: 'delete_published_posts' },
    { estadoAnterior: 'private', exigida: 'delete_posts' },
    { estadoAnterior: 'draft', exigida: 'delete_posts' },
  ];

  for (const { estadoAnterior, exigida } of casos) {
    const cena = abrirCenario({
      conteudos: [artigo(CONTEUDO, estadoAnterior, CONTA_DA_AUTORA)],
    });
    descartarComo(cena, AUTORA, CONTEUDO);

    // Acao: a pergunta da restauracao, `delete_post`
    // (`wp-includes/capabilities.php:153`-`:159`), e a restauracao.
    assert.equal(cena.memoria(CONTEUDO), estadoAnterior);
    assert.deepEqual(
      cena.exigidas(AUTORA, 'delete_post', CONTEUDO),
      [exigida],
      estadoAnterior,
    );

    const resultado = restaurar(cena.restauracao(AUTORA), {
      conteudoId: CONTEUDO,
    });

    // Resultado: autorizado, e a memoria encerrada. Fora da lixeira o conteudo e
    // um rascunho, e a capacidade volta a ser a comum.
    assert.equal(resultado.desfecho, 'restaurado', estadoAnterior);
    assert.deepEqual(cena.exigidas(AUTORA, 'delete_post', CONTEUDO), [
      'delete_posts',
    ]);
  }
});

/* ── UT-049-6 ─────────────────────────────────────────────────────────────── */

test('UT-049-6 recusa a restauracao a quem nao tem a capacidade do estado anterior', () => {
  // Entrada: o conteudo publicado do colaborador. Ele nao poderia descarta-lo, e
  // quem descarta e a editora. Tem `delete_posts`, que bastaria se o conteudo
  // fosse julgado pela coluna, e nao tem `delete_published_posts`.
  const cena = abrirCenario({
    conteudos: [artigo(CONTEUDO, 'publish', CONTA_DO_COLABORADOR)],
    comentarios: [{ id: 5, conteudoId: CONTEUDO, estado: '1' }],
  });
  descartarComo(cena, EDITORA, CONTEUDO);
  assert.deepEqual(cena.exigidas(COLABORADOR, 'delete_post', CONTEUDO), [
    'delete_published_posts',
  ]);

  const antes = cena.retrato();

  // Acao: o colaborador pede a restauracao do proprio conteudo.
  const resultado = restaurar(cena.restauracao(COLABORADOR), {
    conteudoId: CONTEUDO,
  });

  // Resultado: a recusa de `wp-admin/post.php:298`-`:299`.
  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.recusa, {
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  });
  assert.equal(CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL, 403);
  assert.equal(restauradoNaVisaoDoChamador(resultado), false);

  // Nada se moveu: continua na lixeira, com a memoria e os comentarios suspensos,
  // e a coleta ainda o alcanca.
  assert.equal(cena.retrato(), antes);
  assert.equal(cena.estadoDaLinha(CONTEUDO), ESTADO_DE_LIXEIRA);
  assert.equal(cena.memoria(CONTEUDO), 'publish');
  assert.ok(cena.chaves(CONTEUDO).includes(MARCADOR_DO_INSTANTE_DO_DESCARTE));
});

/* ── UT-049-7 ─────────────────────────────────────────────────────────────── */

test('UT-049-7 restaura como rascunho mesmo o conteudo que estava publicado', () => {
  // `R2` / BR-MIGRAR-031: *"a memoria do estado anterior existe e nao e usada por
  // default: as duas metades sao a regra"*.
  const cena = abrirCenario({
    conteudos: [artigo(CONTEUDO, 'publish', CONTA_DA_EDITORA)],
  });
  descartarComo(cena, EDITORA, CONTEUDO);

  const vistos: unknown[] = [];

  restaurar(
    cena.restauracao(EDITORA, {
      filtrarEstadoRestaurado(novoEstado, conteudoId, estadoAnterior) {
        vistos.push({
          novoEstado,
          conteudoId,
          estadoAnterior,
          naTabela: cena.memoria(conteudoId),
        });
        return novoEstado;
      },
    }),
    { conteudoId: CONTEUDO },
  );

  // A primeira metade: a memoria existe, chega ao filtro
  // (`wp-includes/post.php:4226`) e ainda esta na tabela nesse momento.
  assert.deepEqual(vistos, [
    {
      novoEstado: 'draft',
      conteudoId: CONTEUDO,
      estadoAnterior: 'publish',
      naTabela: 'publish',
    },
  ]);

  // A segunda metade: o default nao a usa. Nenhuma das gravacoes foi `publish`.
  assert.equal(cena.estadoDaLinha(CONTEUDO), 'draft');
  assert.ok(!cena.gravacoes(CONTEUDO).includes('publish'));

  // E e default, nao garantia: `wp_untrash_post_set_previous_status()`
  // (`wp-includes/post.php:8762`) e quem devolve o publicado, e so se pendurada.
  const comFiltro = abrirCenario({
    conteudos: [artigo(CONTEUDO, 'publish', CONTA_DA_EDITORA)],
  });
  descartarComo(comFiltro, EDITORA, CONTEUDO);
  restaurar(
    comFiltro.restauracao(EDITORA, {
      filtrarEstadoRestaurado: estadoAnteriorNaRestauracao,
    }),
    { conteudoId: CONTEUDO },
  );

  assert.equal(comFiltro.estadoDaLinha(CONTEUDO), 'publish');
});

/* ── UT-049-8 ─────────────────────────────────────────────────────────────── */

test('UT-049-8 exige capacidades diferentes para dois conteudos na lixeira com estados anteriores diferentes', () => {
  // Entrada: o mesmo colaborador, dois conteudos dele. O rascunho ele mesmo
  // descartou; o publicado, so a editora podia. Os dois estao em `trash`.
  const cena = abrirCenario({
    conteudos: [
      artigo(CONTEUDO, 'draft', CONTA_DO_COLABORADOR),
      artigo(VIZINHO, 'publish', CONTA_DO_COLABORADOR),
    ],
  });
  descartarComo(cena, COLABORADOR, CONTEUDO);
  descartarComo(cena, EDITORA, VIZINHO);

  assert.equal(cena.estadoDaLinha(CONTEUDO), cena.estadoDaLinha(VIZINHO));

  // Resultado: a mesma pergunta, duas exigencias
  // (`wp-includes/capabilities.php:155`-`:158`).
  assert.deepEqual(cena.exigidas(COLABORADOR, 'delete_post', CONTEUDO), [
    'delete_posts',
  ]);
  assert.deepEqual(cena.exigidas(COLABORADOR, 'delete_post', VIZINHO), [
    'delete_published_posts',
  ]);

  // E duas respostas, para o mesmo ator.
  const contexto = cena.restauracao(COLABORADOR);

  assert.equal(restaurar(contexto, { conteudoId: VIZINHO }).desfecho, 'recusado');
  assert.equal(restaurar(contexto, { conteudoId: CONTEUDO }).desfecho, 'restaurado');
  assert.equal(cena.estadoDaLinha(VIZINHO), ESTADO_DE_LIXEIRA);
  assert.equal(cena.estadoDaLinha(CONTEUDO), 'draft');

  // ⚠️ O limite da regra: para quem nao e o autor, o legado nao le o marcador
  // (`wp-includes/capabilities.php:166`-`:172`), e estados anteriores diferentes
  // exigem o mesmo. A assimetria e do legado (P1).
  const alheios = abrirCenario({
    conteudos: [
      artigo(CONTEUDO, 'draft', CONTA_DA_AUTORA),
      artigo(VIZINHO, 'publish', CONTA_DA_AUTORA),
    ],
  });
  descartarComo(alheios, AUTORA, CONTEUDO);
  descartarComo(alheios, AUTORA, VIZINHO);

  assert.deepEqual(alheios.exigidas(EDITORA, 'delete_post', CONTEUDO), [
    'delete_others_posts',
  ]);
  assert.deepEqual(alheios.exigidas(EDITORA, 'delete_post', VIZINHO), [
    'delete_others_posts',
  ]);
});
