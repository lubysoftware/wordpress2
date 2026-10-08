/**
 * Testes da entrega de **T021**: *"o comportamento de US-10 existe e os
 * criterios CA-10.1, CA-10.2, CA-10.3, CA-10.4 passam contra o sistema novo"*.
 *
 * **Nao sao os seis testes de `backlog/tests.md`** — UT-029-1 a UT-029-6 sao
 * **T022**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles.
 *
 * E por isso que a porta de dados daqui **registra comando** em vez de simular
 * banco: e o que `../armazenamento/porta-falsa.ts` existe para permitir, e e a
 * unica forma de afirmar o caso em que o legado **nao emite comando nenhum** —
 * a poda que desiste antes de consultar, com `WP_POST_REVISIONS` de fabrica.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConteudo,
  perguntarPermissao,
  comAtor,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { inteiro, texto } from '../../../plataforma/serializacao/index.js';
import {
  CAMPOS_VERSIONAVEIS,
  COLUNAS_NAO_VERSIONAVEIS,
  DATA_SENTINELA,
  ESTADO_DE_VERSAO,
  TIPO_DE_VERSAO,
  campoDaColuna,
  criarArmazenamentoDeConteudo,
  nomeDaVersao,
  type CamposDeConteudo,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  CAMPOS_VERSIONAVEIS_DE_FABRICA,
  CAPACIDADE_DE_APAGAR_CONTEUDO,
  CHAVE_DE_ULTIMA_EDICAO,
  CODIGO_DE_CONTEUDO_INVALIDO,
  CODIGO_DE_VERSAO_DE_VERSAO,
  MENSAGEM_DE_CONTEUDO_INVALIDO,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
  MENSAGEM_DE_RECUSA_DE_LEITURA_DE_VERSOES,
  MENSAGEM_DE_RECUSA_DE_RESTAURACAO,
  MENSAGEM_DE_VERSAO_DE_VERSAO,
  OUVINTES_DE_FABRICA_DA_VERSAO,
  PONTO_DE_CONTEUDO_ATUALIZADO,
  QUANTAS_VERSOES_GUARDAR_DE_FABRICA,
  VERSOES_ILIMITADAS,
  apagarVersao,
  autorizarExclusaoDeVersao,
  camposVersionaveis,
  formaComparavel,
  gravarVersaoDoConteudo,
  guardarVersao,
  guardarVersaoNaInsercao,
  limiteDaConstante,
  listarVersoesDoConteudo,
  normalizarEspacoEmBranco,
  quantasVersoesGuardar,
  restaurarVersao,
  versionamentoLigado,
  type CampoVersionavel,
  type ContextoDeVersao,
  type GanchosDaVersao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const CONTEUDO = 42;
const TIPO = 'post';

/**
 * A matriz de papeis do cenario.
 *
 * As capacidades primitivas sao as que `casoDeConteudo()` devolve para
 * `edit_post` e `delete_post` de conteudo publicado: `edit_published_posts` para
 * o autor do proprio, e `edit_others_posts` somada quando e de outro
 * (`permissions.md §5.1`).
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_published_posts', concedida: true },
      { capacidade: 'delete_posts', concedida: true },
      { capacidade: 'delete_published_posts', concedida: true },
    ],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
];

/** `get_post_type_object( 'post' )`, com os dois campos que decidem. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: TIPO,
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    edit_published_posts: 'edit_published_posts',
    edit_others_posts: 'edit_others_posts',
    edit_private_posts: 'edit_private_posts',
    delete_posts: 'delete_posts',
    delete_published_posts: 'delete_published_posts',
    delete_others_posts: 'delete_others_posts',
    delete_private_posts: 'delete_private_posts',
  },
};

/** `get_post_type_object( 'revision' )` — o registro do legado (`post.php:129`). */
const TIPO_VERSAO: TipoDeConteudoNaAutorizacao = {
  ...TIPO_POST,
  nome: TIPO_DE_VERSAO,
};

const AUTORA = 7;

function ator(papel = 'author', contaId = AUTORA): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linha(campos: Record<string, string | number> = {}): LinhaDeResultado {
  return {
    ID: CONTEUDO,
    post_author: AUTORA,
    post_date: '2026-10-08 12:00:00',
    post_date_gmt: '2026-10-08 15:00:00',
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: 'publish',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-09 09:00:00',
    post_modified_gmt: '2026-10-09 12:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: TIPO,
    post_mime_type: '',
    comment_count: 3,
    ...campos,
  };
}

/** Uma linha de versao do conteudo do cenario. */
function linhaDeVersao(
  id: number,
  campos: Record<string, string | number> = {},
): LinhaDeResultado {
  return linha({
    ID: id,
    post_type: TIPO_DE_VERSAO,
    post_status: ESTADO_DE_VERSAO,
    post_parent: CONTEUDO,
    post_name: nomeDaVersao(CONTEUDO, false),
    ...campos,
  });
}

interface Cenario {
  readonly contexto: ContextoDeVersao;
  readonly dados: PortaDeDadosFalsa;
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  /** As chamadas a `wp_insert_post()` da versao, na ordem. */
  readonly insercoes: CamposDeConteudo[];
  /** As chamadas a `wp_update_post()` da restauracao, na ordem. */
  readonly atualizacoes: { id: number; campos: CamposDeConteudo }[];
  /** As chamadas a `wp_delete_post()`, na ordem. */
  readonly exclusoes: number[];
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly atorDaRequisicao?: AtorDeAutorizacao;
  /** As linhas que a porta responde, em ordem de consulta. */
  readonly respostas?: readonly (readonly LinhaDeResultado[])[];
  readonly suportaVersao?: boolean;
  readonly constante?: boolean | number | string;
  readonly idDaVersaoInserida?: number;
  readonly erroDaInsercao?: { codigo: string; mensagem: string };
  readonly idDaAtualizacao?: number;
  readonly exclusaoFunciona?: boolean;
  readonly metadadosVersionados?: readonly string[];
  readonly registro?: { ouvinteDeInsercao: boolean; ouvinteDeAtualizacao: boolean };
  readonly pontoEmCurso?: string;
  readonly salvamentoAutomaticoEmCurso?: boolean;
  readonly ganchos?: Partial<GanchosDaVersao>;
  /** As linhas do catalogo que a autorizacao de objeto le. */
  readonly conteudosNaAutorizacao?: readonly ConteudoNaAutorizacao[];
}

function conteudoNaAutorizacao(
  id: number,
  campos: Partial<ConteudoNaAutorizacao> = {},
): ConteudoNaAutorizacao {
  return {
    id,
    tipo: TIPO,
    estado: 'publish',
    estadoParaLeitura: 'publish',
    autorId: AUTORA,
    paiId: 0,
    ...campos,
  };
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  for (const resposta of opcoes.respostas ?? []) {
    dados.responder(resposta);
  }

  const pontos: string[] = [];
  const insercoes: CamposDeConteudo[] = [];
  const atualizacoes: Cenario['atualizacoes'] = [];
  const exclusoes: number[] = [];

  const catalogo =
    opcoes.conteudosNaAutorizacao ?? [conteudoNaAutorizacao(CONTEUDO)];
  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(id) {
      return catalogo.find((registro) => registro.id === id) ?? null;
    },
    tipoDeConteudo(nome) {
      return nome === TIPO_DE_VERSAO ? TIPO_VERSAO : TIPO_POST;
    },
    estadoDeConteudo() {
      return { nome: 'publish', publico: true, privado: false };
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
    matriz: MATRIZ,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  // Os dez pontos sao registrados, e cada um anota o proprio nome: e a sequencia
  // que a Decisao 2 compara (*"a ordem de emissao deles"*).
  const ganchos: GanchosDaVersao = {
    filtrarCamposVersionaveis(campos, conteudo) {
      pontos.push('_wp_post_revision_fields');
      return opcoes.ganchos?.filtrarCamposVersionaveis?.(campos, conteudo) ?? campos;
    },
    filtrarConferirMudanca(conferir, versao, conteudo) {
      pontos.push('wp_save_post_revision_check_for_changes');
      return (
        opcoes.ganchos?.filtrarConferirMudanca?.(conferir, versao, conteudo) ??
        conferir
      );
    },
    filtrarConteudoMudou(mudou, versao, conteudo) {
      pontos.push('wp_save_post_revision_post_has_changed');
      return (
        opcoes.ganchos?.filtrarConteudoMudou?.(mudou, versao, conteudo) ?? mudou
      );
    },
    filtrarQuantasVersoesGuardar(quantas, conteudo) {
      pontos.push('wp_revisions_to_keep');
      return (
        opcoes.ganchos?.filtrarQuantasVersoesGuardar?.(quantas, conteudo) ??
        quantas
      );
    },
    filtrarQuantasVersoesGuardarDoTipo(ponto, quantas, conteudo) {
      pontos.push(ponto);
      return (
        opcoes.ganchos?.filtrarQuantasVersoesGuardarDoTipo?.(
          ponto,
          quantas,
          conteudo,
        ) ?? quantas
      );
    },
    filtrarChavesDeMetadadoVersionado(chaves, tipo) {
      pontos.push('wp_post_revision_meta_keys');
      return (
        opcoes.ganchos?.filtrarChavesDeMetadadoVersionado?.(chaves, tipo) ??
        chaves
      );
    },
    aoGuardarVersao(versaoId, conteudoId) {
      pontos.push('_wp_put_post_revision');
      opcoes.ganchos?.aoGuardarVersao?.(versaoId, conteudoId);
    },
    filtrarVersoesAntesDaExclusao(versoes, conteudoId) {
      pontos.push('wp_save_post_revision_revisions_before_deletion');
      return (
        opcoes.ganchos?.filtrarVersoesAntesDaExclusao?.(versoes, conteudoId) ??
        versoes
      );
    },
    aoApagarVersao(versaoId, versao) {
      pontos.push('wp_delete_post_revision');
      opcoes.ganchos?.aoApagarVersao?.(versaoId, versao);
    },
    aoRestaurarVersao(conteudoId, versaoId) {
      pontos.push('wp_restore_post_revision');
      opcoes.ganchos?.aoRestaurarVersao?.(conteudoId, versaoId);
    },
  };

  const armazenamento = criarArmazenamentoDeConteudo(dados.porta);

  const contexto: ContextoDeVersao = {
    base,
    ator: opcoes.atorDaRequisicao ?? ator(opcoes.papel ?? 'author'),
    armazenamento,
    gravacao: {
      inserir(campos) {
        insercoes.push(campos);
        if (opcoes.erroDaInsercao !== undefined) {
          return { ok: false, ...opcoes.erroDaInsercao };
        }
        return { ok: true, id: opcoes.idDaVersaoInserida ?? 99 };
      },
      atualizar(id, campos) {
        atualizacoes.push({ id, campos });
        return opcoes.idDaAtualizacao ?? id;
      },
      apagar(id) {
        exclusoes.push(id);
        return opcoes.exclusaoFunciona ?? true;
      },
    },
    suportaVersao() {
      return opcoes.suportaVersao ?? true;
    },
    ...(opcoes.constante === undefined
      ? {}
      : { constantes: { quantasVersoesGuardar: opcoes.constante } }),
    ...(opcoes.metadadosVersionados === undefined
      ? {}
      : { metadadosVersionados: () => opcoes.metadadosVersionados as string[] }),
    ...(opcoes.registro === undefined ? {} : { registro: opcoes.registro }),
    ...(opcoes.pontoEmCurso === undefined
      ? {}
      : { pontoEmCurso: opcoes.pontoEmCurso }),
    ...(opcoes.salvamentoAutomaticoEmCurso === undefined
      ? {}
      : { salvamentoAutomaticoEmCurso: opcoes.salvamentoAutomaticoEmCurso }),
    ganchos,
  };

  return { contexto, dados, pontos, insercoes, atualizacoes, exclusoes };
}

/**
 * Os dois pontos de limite, que disparam **quatro vezes** no caminho completo.
 *
 * Nao e repeticao deste porte: e a do legado. `wp_revisions_to_keep()` aplica os
 * dois filtros a **cada** chamada, e `wp_save_post_revision()` a chama por
 * quatro caminhos — `wp_revisions_enabled()` em `:154`, de novo dentro de
 * `wp_get_post_revisions()` em `:680`, mais uma vez em `:223` para a poda, e
 * ainda outra no `:680` da segunda listagem. Com o cache do legado isso nao
 * economiza consulta (os filtros nao consultam), mas a **sequencia de pontos** e
 * observavel, e e ela que a Decisao 2 compara.
 *
 * O teste `a sequencia de pontos do caminho completo` afirma a sequencia **crua**,
 * com as quatro repeticoes. Os outros usam este filtro para falar do que e
 * proprio deles.
 */
const PONTOS_DE_LIMITE: readonly string[] = [
  'wp_revisions_to_keep',
  'wp_post_revisions_to_keep',
];

function semOsPontosDeLimite(pontos: readonly string[]): readonly string[] {
  return pontos.filter((ponto) => !PONTOS_DE_LIMITE.includes(ponto));
}

/** O texto de uma consulta com os parametros ao lado, para afirmar bytes. */
function consulta(
  dados: PortaDeDadosFalsa,
  indice: number,
): { texto: string; parametros: string[] } {
  const pedida = dados.selecoes[indice];
  assert.ok(pedida !== undefined, `nao houve consulta no indice ${String(indice)}`);
  return {
    texto: pedida.texto,
    parametros: pedida.parametros.map(textoDoParametro),
  };
}

/* ── CA-10.2 — O PONTO DE CONFIGURACAO, E AS TRES BORDAS ───────────────────── */

test('CA-10.2: o valor de fabrica de WP_POST_REVISIONS e `true`, e `true` vale "guardar todas"', () => {
  // `wp-includes/default-constants.php:392` guarda o booleano...
  assert.equal(QUANTAS_VERSOES_GUARDAR_DE_FABRICA, true);
  // ...e `wp_revisions_to_keep()` o traduz em `-1` (`revision.php:813`).
  assert.equal(limiteDaConstante(), VERSOES_ILIMITADAS);
  assert.equal(VERSOES_ILIMITADAS, -1);
});

test('CA-10.2: a comparacao da constante e IDENTICA, logo a cadeia "true" desliga em vez de ligar', () => {
  assert.equal(limiteDaConstante(true), -1);
  // `(int) 'true'` em PHP e `0`, e `0` desliga o versionamento.
  assert.equal(limiteDaConstante('true'), 0);
  assert.equal(limiteDaConstante(false), 0);
  assert.equal(limiteDaConstante(0), 0);
  assert.equal(limiteDaConstante(3), 3);
  // O `(int)` do PHP le o prefixo numerico e trunca para zero.
  assert.equal(limiteDaConstante('5'), 5);
  assert.equal(limiteDaConstante('3abc'), 3);
  assert.equal(limiteDaConstante('abc'), 0);
  assert.equal(limiteDaConstante(-2.7), -2);
});

test('CA-10.2: `wp_revisions_enabled()` compara com ZERO, logo `-1` esta ligado', () => {
  const comFabrica = cenario({ respostas: [[linha()]] });
  const conteudo = comFabrica.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(conteudo !== null);

  assert.equal(quantasVersoesGuardar(comFabrica.contexto, conteudo), -1);
  assert.equal(versionamentoLigado(comFabrica.contexto, conteudo), true);

  // A borda de UT-029-6: zero desliga.
  const comZero = cenario({ constante: 0, respostas: [[linha()]] });
  const mesmoConteudo = comZero.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(mesmoConteudo !== null);
  assert.equal(versionamentoLigado(comZero.contexto, mesmoConteudo), false);
});

test('CA-10.2: o tipo sem suporte zera ANTES dos filtros, logo um filtro pode religar', () => {
  const semSuporte = cenario({
    suportaVersao: false,
    respostas: [[linha()]],
    ganchos: { filtrarQuantasVersoesGuardar: () => 5 },
  });
  const conteudo = semSuporte.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(conteudo !== null);

  // `revision.php:818` zera, `:835` filtra — nessa ordem.
  assert.equal(quantasVersoesGuardar(semSuporte.contexto, conteudo), 5);
});

test('CA-10.2: o filtro por tipo corre DEPOIS do geral, e o nome dele e o do legado', () => {
  const comOsDois = cenario({
    respostas: [[linha()]],
    ganchos: {
      filtrarQuantasVersoesGuardar: () => 5,
      filtrarQuantasVersoesGuardarDoTipo: () => 2,
    },
  });
  const conteudo = comOsDois.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(conteudo !== null);

  assert.equal(quantasVersoesGuardar(comOsDois.contexto, conteudo), 2);
  assert.deepEqual(comOsDois.pontos, [
    'wp_revisions_to_keep',
    'wp_post_revisions_to_keep',
  ]);
});

/* ── CA-10.1 — A VERSAO A CADA GRAVACAO DE CONTEUDO JA EXISTENTE ───────────── */

test('CA-10.1: criar conteudo NAO cria versao — o `! $update` de `revision.php:106`', () => {
  const { contexto, insercoes, dados } = cenario();

  const resultado = guardarVersaoNaInsercao(contexto, CONTEUDO, false);

  assert.equal(resultado.desfecho, 'adiada-para-o-outro-ouvinte');
  assert.deepEqual(insercoes, []);
  // E a guarda e **antes** de qualquer leitura: nenhum comando sai.
  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
});

test('CA-10.1: gravar conteudo que ja existia cria UMA versao, filha, com estado herdado', () => {
  const { contexto, insercoes, dados, pontos } = cenario({
    respostas: [
      [linha()], // `:139` — `get_post( $post_id )`
      [linha()], // `:657` — o `get_post()` de `wp_get_post_revisions()`
      [], // `:690` — nenhuma versao ainda
      [linha()], // `:396` — o `get_post_type()` do ouvinte de metadado
    ],
  });

  const resultado = guardarVersaoNaInsercao(contexto, CONTEUDO, true);

  assert.equal(resultado.desfecho, 'guardada');
  assert.equal(resultado.versaoId, 99);

  // A linha gravada e **filha**, **herdada** e **do tipo da versao** — e o
  // cenario de `PT-002` que esta pasta cumpre: *"a revisao e um conteudo filho"*.
  assert.equal(insercoes.length, 1);
  const campos = insercoes[0];
  assert.ok(campos !== undefined);
  assert.deepEqual(campos.vinculo, { tipo: 'original-da-versao', id: CONTEUDO });
  assert.equal(campos.estado, ESTADO_DE_VERSAO);
  assert.equal(campos.tipo, TIPO_DE_VERSAO);
  assert.equal(campos.identificadorNaUrl, `${String(CONTEUDO)}-revision-v1`);

  // Os tres campos de fabrica, copiados do original.
  assert.equal(campos.titulo, 'titulo');
  assert.equal(campos.corpo, 'corpo');
  assert.equal(campos.resumo, '');

  // ⚠️ As datas da versao sao o `post_modified` do ORIGINAL, e nao a hora
  // corrente (`revision.php:92`). E por isso que esta pasta nao pede relogio.
  assert.equal(campos.data, '2026-10-09 09:00:00');
  assert.equal(campos.dataGmt, '2026-10-09 12:00:00');

  // ⚠️ E `post_author` **nao** e copiado: ele e um dos nove protegidos, e
  // `wp_insert_post()` o resolve com quem gravou (`revision.php:57`).
  assert.equal(campos.autorId, undefined);

  // Nenhuma escrita sai DESTA pasta: a linha e gravada pelo caminho de
  // gravacao, que e T005 e chega por `GravacaoNaVersao`.
  assert.deepEqual(dados.escritas, []);

  // Sem versao anterior, nao ha o que comparar: *"If no previous revisions, save
  // one"* (`revision.php:162`). Logo nenhum dos dois pontos de comparacao
  // dispara.
  assert.deepEqual(semOsPontosDeLimite(pontos), [
    '_wp_post_revision_fields',
    'wp_post_revision_meta_keys',
    '_wp_put_post_revision',
  ]);
});

test('a sequencia de pontos do caminho completo e a do legado, com as repeticoes', () => {
  const { contexto, pontos } = cenario({
    constante: 2,
    respostas: [
      [linha()], // `:139`
      [linha()], // `:657`
      [linhaDeVersao(90, { post_content: 'corpo antigo' })], // `:690` DESC
      [linha()], // `:396`
      [linha()], // `:657` da segunda listagem
      [linhaDeVersao(90), linhaDeVersao(99)], // `:690` ASC
    ],
  });

  assert.equal(guardarVersao(contexto, CONTEUDO).desfecho, 'guardada');

  // A sequencia CRUA, com as quatro passagens pelos dois pontos de limite. E a
  // ordem de emissao que a area 3 da Decisao 2 compara: *"a sequencia de
  // chamadas registrada e identica nas duas metades"*.
  assert.deepEqual(pontos, [
    // `:154` — `wp_revisions_enabled()`
    'wp_revisions_to_keep',
    'wp_post_revisions_to_keep',
    // `:680` — o `check_enabled` da primeira listagem
    'wp_revisions_to_keep',
    'wp_post_revisions_to_keep',
    // `:186`-`:208` — a decisao de gravar
    'wp_save_post_revision_check_for_changes',
    '_wp_post_revision_fields',
    'wp_post_revision_meta_keys',
    'wp_save_post_revision_post_has_changed',
    // `:217` — `_wp_put_post_revision()`
    '_wp_post_revision_fields',
    'wp_post_revision_meta_keys',
    '_wp_put_post_revision',
    // `:223` — o limite da poda
    'wp_revisions_to_keep',
    'wp_post_revisions_to_keep',
    // `:680` — o `check_enabled` da segunda listagem
    'wp_revisions_to_keep',
    'wp_post_revisions_to_keep',
    // `:240` — a lista antes da exclusao
    'wp_save_post_revision_revisions_before_deletion',
  ]);
});

test('CA-10.1: a consulta das versoes e a do legado — pai, tipo, estado herdado, e ordem', () => {
  const { contexto, dados } = cenario({
    respostas: [[linha()], [linha()], [], [linha()]],
  });

  guardarVersao(contexto, CONTEUDO);

  // `:139`: `get_post( $post_id )`.
  assert.deepEqual(consulta(dados, 0), {
    texto: 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
    parametros: ['42'],
  });

  // `:657`: a releitura que `wp_get_post_revisions()` faz. Ver a divergencia de
  // cache declarada em `leitura-de-versoes.ts`.
  assert.equal(consulta(dados, 1).texto, 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1');

  // `:690`: os tres criterios e os dois de ordem (`orderby => 'date ID'`).
  assert.deepEqual(consulta(dados, 2), {
    texto:
      'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ' +
      'AND post_status = ? ORDER BY post_date DESC, ID DESC',
    parametros: ['42', TIPO_DE_VERSAO, ESTADO_DE_VERSAO],
  });
});

test('CA-10.1: os cinco desvios silenciosos de `wp_save_post_revision()`', () => {
  // `:131` — `DOING_AUTOSAVE`, e e a PRIMEIRA guarda: nada e lido.
  const automatico = cenario({ salvamentoAutomaticoEmCurso: true });
  assert.equal(
    guardarVersao(automatico.contexto, CONTEUDO).desfecho,
    'salvamento-automatico-em-curso',
  );
  assert.deepEqual(automatico.dados.selecoes, []);

  // `:141` — a linha nao existe.
  const inexistente = cenario({ respostas: [[]] });
  assert.equal(guardarVersao(inexistente.contexto, CONTEUDO).desfecho, 'inexistente');

  // `:148` — o tipo nao suporta versao.
  const semSuporte = cenario({ suportaVersao: false, respostas: [[linha()]] });
  assert.equal(
    guardarVersao(semSuporte.contexto, CONTEUDO).desfecho,
    'tipo-sem-suporte',
  );

  // `:152` — rascunho automatico nao versiona.
  const rascunho = cenario({
    respostas: [[linha({ post_status: 'auto-draft' })]],
  });
  assert.equal(
    guardarVersao(rascunho.contexto, CONTEUDO).desfecho,
    'rascunho-automatico',
  );

  // `:154` — versionamento desligado.
  const desligado = cenario({ constante: 0, respostas: [[linha()]] });
  assert.equal(
    guardarVersao(desligado.contexto, CONTEUDO).desfecho,
    'versionamento-desligado',
  );
  assert.deepEqual(desligado.insercoes, []);
});

test('CA-10.1: a guarda cruzada do par de ouvintes, nos tres estados do registro', () => {
  const respostas = [[linha()], [linha()], [], [linha()]] as const;

  // Instalacao de fabrica, chamada pelo ponto `post_updated`: ADIA.
  const deFabrica = cenario({
    respostas,
    pontoEmCurso: PONTO_DE_CONTEUDO_ATUALIZADO,
  });
  assert.equal(
    guardarVersao(deFabrica.contexto, CONTEUDO).desfecho,
    'adiada-para-o-outro-ouvinte',
  );

  // Instalacao de fabrica, chamada FORA do ponto (o caminho de
  // `_wp_upgrade_revisions_of_post()` e do changeset): GRAVA.
  const foraDoPonto = cenario({ respostas });
  assert.equal(guardarVersao(foraDoPonto.contexto, CONTEUDO).desfecho, 'guardada');

  // Quem tirou o ouvinte de `wp_after_insert_post` fez o de `post_updated`
  // voltar a gravar — e o `has_action()` de `:136`.
  const semOuvinteDeInsercao = cenario({
    respostas,
    pontoEmCurso: PONTO_DE_CONTEUDO_ATUALIZADO,
    registro: { ouvinteDeInsercao: false, ouvinteDeAtualizacao: true },
  });
  assert.equal(
    guardarVersao(semOuvinteDeInsercao.contexto, CONTEUDO).desfecho,
    'guardada',
  );

  // E quem tirou o de `post_updated` desligou o versionamento pelo outro lado
  // (`:112`), que e o que `guardarVersaoNaInsercao` respeita.
  const semOuvinteDeAtualizacao = cenario({
    respostas,
    registro: { ouvinteDeInsercao: true, ouvinteDeAtualizacao: false },
  });
  assert.equal(
    guardarVersaoNaInsercao(semOuvinteDeAtualizacao.contexto, CONTEUDO, true)
      .desfecho,
    'adiada-para-o-outro-ouvinte',
  );
});

test('CA-10.1: os cinco ouvintes de fabrica estao declarados, com o ponto e a prioridade', () => {
  // `default-filters.php:445`, `:446`, `:800`, `:803` e `:809`.
  assert.deepEqual(
    OUVINTES_DE_FABRICA_DA_VERSAO.map((ouvinte) => [
      ouvinte.ponto,
      ouvinte.ouvinte,
      ouvinte.prioridade,
    ]),
    [
      ['wp_after_insert_post', 'wp_save_post_revision_on_insert', 9],
      ['post_updated', 'wp_save_post_revision', 10],
      [
        'wp_save_post_revision_post_has_changed',
        'wp_check_revisioned_meta_fields_have_changed',
        10,
      ],
      ['_wp_put_post_revision', 'wp_save_revisioned_meta_fields', 10],
      ['wp_restore_post_revision', 'wp_restore_post_revision_meta', 10],
    ],
  );
});

/* ── A NORMALIZACAO QUE DECIDE SE VALE GRAVAR ─────────────────────────────── */

test('CA-10.1: mexer so no espaco em branco NAO cria versao', () => {
  const corpoReformatado = '  corpo\r\ncom    espaco  ';
  const corpoOriginal = 'corpo\ncom espaco';

  // `normalize_whitespace()` apaga a diferenca ANTES da comparacao.
  assert.equal(
    normalizarEspacoEmBranco(corpoReformatado),
    normalizarEspacoEmBranco(corpoOriginal),
  );

  const { contexto, insercoes, pontos } = cenario({
    respostas: [
      [linha({ post_content: corpoReformatado })],
      [linha({ post_content: corpoReformatado })],
      [linhaDeVersao(90, { post_content: corpoOriginal })],
    ],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.equal(resultado.desfecho, 'sem-mudanca');
  assert.deepEqual(insercoes, []);
  // Os pontos da decisao dispararam, na ordem, e o de gravar nao.
  assert.deepEqual(semOsPontosDeLimite(pontos), [
    'wp_save_post_revision_check_for_changes',
    '_wp_post_revision_fields',
    'wp_post_revision_meta_keys',
    'wp_save_post_revision_post_has_changed',
  ]);
});

test('a normalizacao NAO apara o recuo de cada linha, e isso conta como mudanca', () => {
  // `trim()` corre uma vez, nas pontas da cadeia inteira (`formatting.php:5581`),
  // e nao por linha. O recuo depois de uma quebra de linha colapsa para UM
  // espaco e **nao** desaparece — logo recuar um paragrafo cria versao nova.
  assert.equal(normalizarEspacoEmBranco('a\n   b'), 'a\n b');
  assert.notEqual(normalizarEspacoEmBranco('a\n   b'), normalizarEspacoEmBranco('a\nb'));
});

test('o `trim()` reproduzido e o do PHP: apara `\\0` e `\\x0B`, e NAO apara `\\f`', () => {
  // A lista default do PHP e " \t\n\r\0\x0B". O `String.prototype.trim()` do
  // JavaScript apararia tambem `\f` e duas dezenas de caracteres Unicode.
  assert.equal(normalizarEspacoEmBranco('\0 a \x0B'), 'a');
  assert.equal(normalizarEspacoEmBranco('\fa\f'), '\fa\f');
  assert.equal(normalizarEspacoEmBranco(' a'), ' a');
});

test('a quebra de linha unica sobrevive a normalizacao, logo trocar paragrafo por espaco CONTA', () => {
  // `/\n+/` → `\n` corre ANTES de `/[ \t]+/` → ` ` (`formatting.php:5583`).
  assert.equal(normalizarEspacoEmBranco('a\n\n\nb'), 'a\nb');
  assert.notEqual(normalizarEspacoEmBranco('a\nb'), normalizarEspacoEmBranco('a b'));
});

test('o `maybe_serialize` no meio da comparacao nao e inutil: ele guarda o comprimento', () => {
  // Texto comum: a diferenca de espaco desaparece.
  assert.equal(formaComparavel('a  b'), formaComparavel('a b'));
  // Texto que PARECE serializado e serializado de novo, e o `s:5:` carrega o
  // comprimento em bytes — que sobrevive a normalizacao.
  assert.notEqual(formaComparavel('a:1:{i:0;s:3:"x  y";}'), formaComparavel('a:1:{i:0;s:3:"x y";}'));
});

test('CA-10.1: o filtro de conferencia desligado grava versao mesmo sem mudanca', () => {
  const { contexto, insercoes } = cenario({
    respostas: [
      [linha()],
      [linha()],
      [linhaDeVersao(90)],
      [linha()],
    ],
    ganchos: { filtrarConferirMudanca: () => false },
  });

  // *"This filter can override that so a revision is saved even if nothing has
  // changed"* (`revision.php:180`).
  assert.equal(guardarVersao(contexto, CONTEUDO).desfecho, 'guardada');
  assert.equal(insercoes.length, 1);
});

test('CA-10.1: a ultima versao usada na comparacao e a que tem `-revision` no nome', () => {
  // A lista chega decrescente, e o salvamento automatico esta na frente: o laco
  // de `:165` o PULA e toma a versao comum de tras (`revision.php:166`).
  const { contexto, insercoes } = cenario({
    respostas: [
      [linha()],
      [linha()],
      [
        linhaDeVersao(91, {
          post_name: nomeDaVersao(CONTEUDO, true),
          post_content: 'corpo',
        }),
        linhaDeVersao(90, { post_content: 'outro corpo' }),
      ],
      [linha()],
    ],
  });

  // O conteudo tem `corpo`, igual ao do salvamento automatico e diferente do da
  // versao comum — logo mudou, e grava.
  assert.equal(guardarVersao(contexto, CONTEUDO).desfecho, 'guardada');
  assert.equal(insercoes.length, 1);
});

/* ── O PONTO DE EXTENSAO DOS CAMPOS, E OS NOVE QUE ELE NAO VENCE ──────────── */

test('os tres campos de fabrica sao os do legado, e as duas listas de T002 e T021 coincidem', () => {
  assert.deepEqual(
    CAMPOS_VERSIONAVEIS_DE_FABRICA.map((campo) => campo.coluna),
    ['post_title', 'post_content', 'post_excerpt'],
  );
  assert.deepEqual(
    CAMPOS_VERSIONAVEIS_DE_FABRICA.map((campo) => campo.rotulo),
    ['Title', 'Content', 'Excerpt'],
  );
  // A lista em nomes de dominio, de `../armazenamento/versao.ts`, descreve o
  // MESMO conjunto — coluna por campo.
  assert.deepEqual(
    CAMPOS_VERSIONAVEIS_DE_FABRICA.map((campo) => campoDaColuna(campo.coluna)),
    [...CAMPOS_VERSIONAVEIS],
  );
});

test('P2: o ponto de extensao dos campos pode acrescentar e remover — mas NAO vence os nove', () => {
  const { contexto } = cenario({ respostas: [[linha()]] });
  const conteudo = contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(conteudo !== null);

  const comFiltro = (
    produzir: (campos: readonly CampoVersionavel[]) => readonly CampoVersionavel[],
  ): readonly string[] => {
    const outro = cenario({
      respostas: [[linha()]],
      ganchos: { filtrarCamposVersionaveis: (campos) => produzir(campos) },
    });
    const registro = outro.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
    assert.ok(registro !== null);
    return camposVersionaveis(outro.contexto, registro).map((campo) => campo.coluna);
  };

  // Acrescentar funciona.
  assert.deepEqual(
    comFiltro((campos) => [...campos, { coluna: 'post_password', rotulo: 'Senha' }]),
    ['post_title', 'post_content', 'post_excerpt', 'post_password'],
  );

  // Remover funciona.
  assert.deepEqual(
    comFiltro((campos) => campos.filter((campo) => campo.coluna !== 'post_content')),
    ['post_title', 'post_excerpt'],
  );

  // ⚠️ E os nove protegidos sao removidos **depois** do ponto (`:55`): declara-los
  // nao os versiona, por mais explicito que o interceptador seja.
  assert.deepEqual(
    comFiltro(() =>
      COLUNAS_NAO_VERSIONAVEIS.map((coluna) => ({ coluna, rotulo: coluna })),
    ),
    [],
  );
  assert.ok(COLUNAS_NAO_VERSIONAVEIS.includes('post_author'));
});

test('P2: a coluna acrescentada pelo ponto chega a linha da versao, e o nome inventado nao', () => {
  const { contexto, insercoes } = cenario({
    respostas: [[linha({ post_password: 'segredo' })], [linha()], [], [linha()]],
    ganchos: {
      filtrarCamposVersionaveis: (campos) => [
        ...campos,
        { coluna: 'post_password', rotulo: 'Senha' },
        { coluna: 'campo_inventado', rotulo: 'Nada' },
      ],
    },
  });

  guardarVersao(contexto, CONTEUDO);

  const campos = insercoes[0];
  assert.ok(campos !== undefined);
  // A coluna real viaja...
  assert.equal(campos.senha, 'segredo');
  // ...e o nome que nao e coluna e descartado pelo `array_intersect` (`:82`).
  assert.equal(Object.hasOwn(campos, 'campo_inventado'), false);
});

/* ── `_wp_put_post_revision()` — OS DOIS ERROS, E A ORDEM DELES ───────────── */

test('CA-10.3: nao existe versao de versao, e a recusa tem texto', () => {
  const { contexto, insercoes } = cenario({ respostas: [[linhaDeVersao(90)]] });
  const versao = contexto.armazenamento.conteudo.obterPorId(90);
  assert.ok(versao !== null);

  const resultado = gravarVersaoDoConteudo(contexto, versao);

  assert.equal(resultado.ok, false);
  assert.deepEqual(resultado, {
    ok: false,
    codigo: CODIGO_DE_VERSAO_DE_VERSAO,
    mensagem: MENSAGEM_DE_VERSAO_DE_VERSAO,
  });
  // ⚠️ Sem ponto final, como no legado (`revision.php:367`).
  assert.equal(MENSAGEM_DE_VERSAO_DE_VERSAO.endsWith('.'), false);
  assert.deepEqual(insercoes, []);
});

test('a ordem dos dois erros de `_wp_put_post_revision()` e a do legado', () => {
  const { contexto } = cenario({ respostas: [[linhaDeVersao(0, { ID: 0 })]] });
  const semId = contexto.armazenamento.conteudo.obterPorId(0);
  assert.ok(semId !== null);

  // A linha e de versao **e** tem `ID` 0. O legado confere o `ID` primeiro
  // (`:361` antes de `:365`), logo o codigo e `invalid_post`.
  const resultado = gravarVersaoDoConteudo(contexto, semId);
  assert.deepEqual(resultado, {
    ok: false,
    codigo: CODIGO_DE_CONTEUDO_INVALIDO,
    mensagem: MENSAGEM_DE_CONTEUDO_INVALIDO,
  });
});

test('o erro da gravacao de conteudo e repassado como valor, sem ponto de extensao', () => {
  const { contexto, pontos } = cenario({
    respostas: [[linha()], [linha()], []],
    erroDaInsercao: { codigo: 'empty_content', mensagem: 'Content, title, and excerpt are empty.' },
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.equal(resultado.desfecho, 'recusada');
  assert.deepEqual(resultado.erro, {
    codigo: 'empty_content',
    mensagem: 'Content, title, and excerpt are empty.',
  });
  // O ponto `_wp_put_post_revision` **nao** dispara (`:381`).
  assert.equal(pontos.includes('_wp_put_post_revision'), false);
});

/* ── CA-10.2 — A PODA ──────────────────────────────────────────────────────── */

test('CA-10.2: com o valor de fabrica, a poda desiste ANTES de consultar o banco', () => {
  const { contexto, dados, pontos } = cenario({
    respostas: [[linha()], [linha()], [], [linha()]],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.equal(resultado.desfecho, 'guardada');
  assert.deepEqual(resultado.versoesApagadas, []);
  // So as quatro leituras do caminho de gravacao: a segunda consulta de versoes
  // (`:229`) **nao sai**, porque `-1 < 0` (`:225`).
  assert.equal(dados.selecoes.length, 4);
  assert.equal(
    pontos.includes('wp_save_post_revision_revisions_before_deletion'),
    false,
  );
});

test('CA-10.2: com limite, a poda apaga as MAIS ANTIGAS, pela consulta crescente', () => {
  const { contexto, dados, exclusoes, pontos } = cenario({
    constante: 2,
    respostas: [
      [linha()], // `:139`
      [linha()], // `:657`
      // `:690`, DESC — e o corpo da mais recente **difere** do do conteudo, ou a
      // comparacao de `:189` desistiria antes da poda.
      [
        linhaDeVersao(92, { post_content: 'corpo antigo' }),
        linhaDeVersao(91),
        linhaDeVersao(90),
      ],
      [linha()], // `:396`, o ouvinte do metadado
      [linha()], // `:657` da segunda listagem
      // `:690` com `ASC`: a recem-criada conta no total.
      [linhaDeVersao(90), linhaDeVersao(91), linhaDeVersao(92), linhaDeVersao(99)],
      [linhaDeVersao(90)], // `:638` — a releitura de `wp_get_post_revision()`
      [linhaDeVersao(91)],
    ],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.equal(resultado.desfecho, 'guardada');
  // Quatro versoes, limite 2 → `$delete` e 2, e saem as duas da FRENTE da lista
  // crescente, que sao as mais antigas.
  assert.deepEqual(exclusoes, [90, 91]);
  assert.deepEqual(resultado.versoesApagadas, [90, 91]);

  // A segunda listagem e CRESCENTE (`revision.php:229`).
  assert.deepEqual(consulta(dados, 5), {
    texto:
      'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ' +
      'AND post_status = ? ORDER BY post_date ASC, ID ASC',
    parametros: ['42', TIPO_DE_VERSAO, ESTADO_DE_VERSAO],
  });

  // O ponto da poda dispara uma vez, e o de exclusao uma por versao apagada.
  assert.deepEqual(
    semOsPontosDeLimite(pontos).filter(
      (ponto) => ponto !== 'wp_post_revision_meta_keys',
    ),
    [
      'wp_save_post_revision_check_for_changes',
      '_wp_post_revision_fields',
      'wp_save_post_revision_post_has_changed',
      '_wp_post_revision_fields',
      '_wp_put_post_revision',
      'wp_save_post_revision_revisions_before_deletion',
      'wp_delete_post_revision',
      'wp_delete_post_revision',
    ],
  );
});

test('CA-10.2: a poda PULA salvamento automatico, e por isso guarda mais do que o limite', () => {
  const { contexto, exclusoes } = cenario({
    constante: 2,
    respostas: [
      [linha()],
      [linha()],
      [linhaDeVersao(92, { post_content: 'corpo antigo' })],
      [linha()],
      [linha()],
      // Crescente: o salvamento automatico e o mais antigo.
      [
        linhaDeVersao(88, { post_name: nomeDaVersao(CONTEUDO, true) }),
        linhaDeVersao(92),
        linhaDeVersao(99),
      ],
      [linhaDeVersao(88, { post_name: nomeDaVersao(CONTEUDO, true) })],
    ],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  // Tres linhas, limite 2 → `$delete` e 1, e a primeira da lista e o salvamento
  // automatico, que o `str_contains( ..., 'autosave' )` de `:253` PULA. Nada e
  // apagado, e ficam **tres** linhas com limite 2.
  assert.equal(resultado.desfecho, 'guardada');
  assert.deepEqual(exclusoes, []);
  assert.deepEqual(resultado.versoesApagadas, []);
});

test('CA-10.2: o ponto da poda pode mudar QUAIS versoes somem, pela posicao na lista', () => {
  const { contexto, exclusoes } = cenario({
    constante: 1,
    respostas: [
      [linha()],
      [linha()],
      [linhaDeVersao(92, { post_content: 'corpo antigo' })],
      [linha()],
      [linha()],
      [linhaDeVersao(90), linhaDeVersao(92), linhaDeVersao(99)],
      // As releituras de `wp_get_post_revision()` dentro de
      // `wp_delete_post_revision()` (`:638`), uma por versao apagada.
      [linhaDeVersao(99)],
      [linhaDeVersao(92)],
    ],
    ganchos: {
      // Inverter a lista troca quem sai: o legado corta do inicio dela (`:250`).
      filtrarVersoesAntesDaExclusao: (versoes) => [...versoes].reverse(),
    },
  });

  guardarVersao(contexto, CONTEUDO);

  // Invertida, a frente da lista e a mais NOVA — e a recem-criada e a primeira.
  assert.deepEqual(exclusoes, [99, 92]);
});

test('a exclusao da versao passa por `wp_delete_post()` e nao emite DELETE desta pasta', () => {
  const { contexto, dados, exclusoes, pontos } = cenario({
    respostas: [[linhaDeVersao(90)]],
  });

  assert.equal(apagarVersao(contexto, 90), true);

  // A linha e apagada pelo caminho de exclusao da feature 005 — sete etapas em
  // quatro tabelas (`EXT-EXCLUSAO`, BR-MIGRAR-104).
  assert.deepEqual(exclusoes, [90]);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, ['wp_delete_post_revision']);
});

test('o ponto de exclusao NAO dispara quando a exclusao nao aconteceu', () => {
  const { contexto, pontos } = cenario({
    respostas: [[linhaDeVersao(90)]],
    exclusaoFunciona: false,
  });

  assert.equal(apagarVersao(contexto, 90), false);
  // `if ( $delete )` (`revision.php:640`).
  assert.deepEqual(pontos, []);
});

test('apagar o que nao e versao e silencio: `wp_get_post_revision()` devolve nulo', () => {
  const { contexto, exclusoes } = cenario({ respostas: [[linha()]] });

  assert.equal(apagarVersao(contexto, CONTEUDO), false);
  assert.deepEqual(exclusoes, []);
});

/* ── CA-10.3 — NEM EDITAVEL, NEM APAGAVEL POR PERMISSAO DE CONTEUDO ───────── */

test('CA-10.3: a versao NAO se apaga por capacidade — e a autorizacao que nega, nao esta pasta', () => {
  const VERSAO = 90;
  const { contexto } = cenario({
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  });

  // A autora PODE apagar o conteudo dela...
  assert.equal(
    perguntarPermissao(
      comAtor(contexto.base, contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      CONTEUDO,
    ),
    true,
  );
  // ...e NAO pode apagar a versao dele: `capabilities.php:108` devolve
  // `do_not_allow`, e a regra mora em `plataforma/autorizacao/` (PERM-5).
  assert.equal(
    perguntarPermissao(
      comAtor(contexto.base, contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      VERSAO,
    ),
    false,
  );

  // E a superficie recusa com o texto e o numero da API REST — a segunda das
  // duas perguntas de `delete_item_permissions_check()`.
  assert.deepEqual(autorizarExclusaoDeVersao(contexto, CONTEUDO, VERSAO), {
    codigo: 'rest_cannot_delete',
    mensagem: MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
    codigoHttp: 403,
  });
});

test('CA-10.3: a negacao vence o atalho do super administrador, porque e `do_not_allow`', () => {
  const VERSAO = 90;
  // No legado o super administrador e quem esta na **lista de logins da rede**,
  // e nao quem tem um campo ligado — ver `ehSuperAdmin()` em
  // `plataforma/autorizacao/decisao-de-capacidade.ts`.
  const dona: AtorDeAutorizacao = {
    contaId: 1,
    login: 'dona-da-rede',
    existe: true,
    concessoes: [],
  };
  const { contexto } = cenario({
    atorDaRequisicao: dona,
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  });

  const emRede: ContextoDeVersao = {
    ...contexto,
    base: {
      ...contexto.base,
      rede: { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] },
    },
  };

  // O atalho de `PERM-9` concede tudo ao super administrador...
  assert.equal(
    perguntarPermissao(
      comAtor(emRede.base, emRede.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      CONTEUDO,
    ),
    true,
  );
  // ...**menos** `do_not_allow`, que e o unico nome que ele nao vence — e e esse
  // o nome que `capabilities.php:108` devolve para uma versao.
  assert.equal(CAPACIDADE_NEGADA, 'do_not_allow');
  assert.equal(
    perguntarPermissao(
      comAtor(emRede.base, emRede.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      VERSAO,
    ),
    false,
  );
  assert.notEqual(autorizarExclusaoDeVersao(emRede, CONTEUDO, VERSAO), null);
});

test('CA-10.3: 🔴 editar NAO e negado pela capacidade — a versao e transparente para o pai', () => {
  const VERSAO = 90;
  const { contexto } = cenario({
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  });

  // `capabilities.php:215`: `edit_post` de uma versao segue para o PAI e resolve
  // nele. Negar aqui fecharia o sistema mais que o legado — e e por isso que a
  // divergencia de redacao de CA-10.3 esta registrada em
  // `permissao-de-versao.ts` em vez de resolvida.
  assert.equal(
    perguntarPermissao(comAtor(contexto.base, contexto.ator), 'edit_post', VERSAO),
    true,
  );
});

test('CA-10.3: a poda apaga versao SEM perguntar nada — e essa e a assimetria', () => {
  const VERSAO = 90;
  const { contexto, exclusoes } = cenario({
    papel: 'subscriber',
    atorDaRequisicao: ator('subscriber', 999),
    respostas: [[linhaDeVersao(VERSAO)]],
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  });

  // Um assinante nao pode nada, e `apagarVersao()` nao pergunta: ela e o nucleo
  // arrumando a propria casa, nao superficie (`revision.php:637`).
  assert.equal(apagarVersao(contexto, VERSAO), true);
  assert.deepEqual(exclusoes, [VERSAO]);
});

test('CA-10.3: listar versoes exige `edit_post` do conteudo, e nao `read_post`', () => {
  const semPermissao = cenario({
    atorDaRequisicao: ator('subscriber', 999),
    respostas: [[linha()]],
  });

  const recusado = listarVersoesDoConteudo(semPermissao.contexto, {
    conteudoId: CONTEUDO,
  });

  assert.equal(recusado.desfecho, 'recusado');
  assert.deepEqual(recusado.versoes, []);
  assert.deepEqual(recusado.recusa, {
    codigo: 'rest_cannot_read',
    mensagem: MENSAGEM_DE_RECUSA_DE_LEITURA_DE_VERSOES,
    codigoHttp: 403,
  });

  const comPermissao = cenario({
    respostas: [[linha()], [linha()], [linhaDeVersao(90)]],
  });
  const listado = listarVersoesDoConteudo(comPermissao.contexto, {
    conteudoId: CONTEUDO,
  });
  assert.equal(listado.desfecho, 'listado');
  assert.deepEqual(
    listado.versoes.map((versao) => versao.id),
    [90],
  );
});

test('o 404 de conteudo inexistente vem ANTES do 403, como no legado', () => {
  const { contexto } = cenario({
    atorDaRequisicao: ator('subscriber', 999),
    respostas: [[]],
  });

  // `class-wp-rest-revisions-controller.php:155` corre antes de `:185`. E
  // enumeracao de identificador, e e comportamento do produto (P1).
  const resultado = listarVersoesDoConteudo(contexto, { conteudoId: CONTEUDO });
  assert.equal(resultado.desfecho, 'conteudo-inexistente');
  assert.equal(resultado.recusa, null);
});

/* ── CA-10.4 — RESTAURAR ──────────────────────────────────────────────────── */

test('CA-10.4: restaurar escreve os campos versionaveis no PAI, e nada mais', () => {
  const VERSAO = 90;
  const antiga = linhaDeVersao(VERSAO, {
    post_content: 'corpo antigo',
    post_title: 'titulo antigo',
  });
  const { contexto, atualizacoes, dados, pontos } = cenario({
    respostas: [
      [antiga], // `:37` — `wp_get_post_revision()`
      [linha()], // `wp-admin/revision.php:46` — o pai
      // ⚠️ A disjuncao de `:52` e curto-circuito: com o versionamento LIGADO,
      // `wp_is_post_autosave()` nao e chamada, logo nao ha releitura aqui.
      // ⚠️ Mas HA uma em `:71`: a tela passa `$revision->ID`, e nao o registro.
      [antiga], // `:477` — a releitura de `wp_restore_post_revision()`
      [], // `:505` — o `valoresDe` de `update_post_meta( '_edit_last' )`
      [], // `:505` — o `idsDe` dele
      [linha()], // `:519` — o `get_post_type()` do ouvinte de metadado
    ],
  });

  const resultado = restaurarVersao(contexto, { versaoId: VERSAO });

  assert.equal(resultado.desfecho, 'restaurado');
  assert.equal(resultado.conteudoId, CONTEUDO);

  // O alvo e o PAI (`revision.php:498`), nunca a versao.
  assert.equal(atualizacoes.length, 1);
  const atualizacao = atualizacoes[0];
  assert.ok(atualizacao !== undefined);
  assert.equal(atualizacao.id, CONTEUDO);

  // ⚠️ So os tres campos versionaveis voltam. Nenhuma das seis chaves fixas da
  // versao chega ao conteudo — um porte que devolvesse a linha inteira poria o
  // conteudo em `inherit` com tipo `revision`, e o tiraria do ar.
  assert.deepEqual(Object.keys(atualizacao.campos).sort(), [
    'corpo',
    'resumo',
    'titulo',
  ]);
  assert.equal(atualizacao.campos.corpo, 'corpo antigo');
  assert.equal(atualizacao.campos.titulo, 'titulo antigo');

  // `:505`: `_edit_last` com quem restaurou, e e a UNICA escrita desta pasta —
  // a linha de `posts` e gravada pelo caminho de gravacao, que e T005.
  assert.equal(dados.escritas.length, 1);
  const gravacaoDoMetadado = dados.escritas[0];
  assert.ok(gravacaoDoMetadado !== undefined);
  assert.ok(gravacaoDoMetadado.texto.startsWith('INSERT INTO wp_postmeta'));
  assert.deepEqual(gravacaoDoMetadado.parametros.map(textoDoParametro), [
    String(CONTEUDO),
    CHAVE_DE_ULTIMA_EDICAO,
    String(AUTORA),
  ]);

  // O ponto das chaves de metadado dispara **mesmo com a lista vazia**: o legado
  // aplica `wp_post_revision_meta_keys` antes de saber se ha chave
  // (`revision.php:598`), e e o que permite a uma extensao versionar metadado que
  // nenhum registro declarou.
  assert.deepEqual(semOsPontosDeLimite(pontos), [
    '_wp_post_revision_fields',
    'wp_post_revision_meta_keys',
    'wp_restore_post_revision',
  ]);

  // ⚠️ A sequencia de leituras e a do legado, e a terceira e a que um porte
  // economizaria: a tela escreve `wp_restore_post_revision( $revision->ID )`
  // (`wp-admin/revision.php:71`), e nao `( $revision )`, logo
  // `wp_get_post_revision()` torna a ler a linha da versao.
  assert.equal(dados.selecoes.length, 6);
  assert.deepEqual(consulta(dados, 2), {
    texto: 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
    parametros: [String(VERSAO)],
  });
});

test('CA-10.4: 🔴 a restauracao, sozinha, NAO cria versao nenhuma', () => {
  const VERSAO = 90;
  const antiga = linhaDeVersao(VERSAO, { post_content: 'corpo antigo' });
  const { contexto, insercoes } = cenario({
    respostas: [[antiga], [linha()], [antiga], [], [], [linha()]],
  });

  assert.equal(
    restaurarVersao(contexto, { versaoId: VERSAO }).desfecho,
    'restaurado',
  );

  // ⚠️ **Nenhuma versao sai desta pasta na restauracao.** A segunda metade de
  // CA-10.4 — *"guarda o corrente como versao nova"* — e efeito da cadeia
  // `wp_update_post()` → `wp_insert_post()` → ponto `wp_after_insert_post` →
  // `wp_save_post_revision_on_insert()`, que esta registrado em prioridade 9
  // (`default-filters.php:445`). Quem compuser `GravacaoNaVersao.atualizar` com
  // uma funcao que so escreve a linha produz uma restauracao que nao versiona, e
  // o criterio cai sem que nada nesta pasta mude.
  assert.deepEqual(insercoes, []);
});

test('CA-10.4: 🔴 a versao que a gravacao cria depois da restauracao carrega o texto RESTAURADO', () => {
  // O ouvinte do ponto `wp_after_insert_post`, rodando sobre o conteudo **ja
  // atualizado** — que e o que `wp_save_post_revision()` le (`revision.php:139`).
  const { contexto, insercoes } = cenario({
    respostas: [
      [linha({ post_content: 'corpo antigo' })], // `:139` — o conteudo JA restaurado
      [linha({ post_content: 'corpo antigo' })], // `:657`
      // A versao mais recente ainda carrega o texto que a restauracao
      // sobrescreveu: e ela que preserva o `corpo`, e nao a versao nova.
      [linhaDeVersao(90, { post_content: 'corpo' })], // `:690`
      [linha({ post_content: 'corpo antigo' })], // `:396`
    ],
  });

  const resultado = guardarVersaoNaInsercao(contexto, CONTEUDO, true);

  assert.equal(resultado.desfecho, 'guardada');
  const campos = insercoes[0];
  assert.ok(campos !== undefined);
  // ⚠️ A versao nova carrega `corpo antigo`, isto e, o texto **restaurado** — e
  // nao o `corpo` que a restauracao sobrescreveu. O texto sobrescrito nao se
  // perde porque ja era a versao mais recente ANTES da restauracao, pela
  // invariante do legado de que *"the most recent revision always matches the
  // current post"* (`revision.php:119`). A divergencia de redacao com CA-10.4
  // esta registrada em `restaurar-versao.ts` e em `contexto-de-versao.ts`, e
  // **nao foi resolvida** (P1).
  assert.equal(campos.corpo, 'corpo antigo');
});

test('CA-10.4: restaurar o que nao e versao, e restaurar sem o pai, sao desfechos diferentes', () => {
  // `:479`: a linha nao e de versao.
  const naoEVersao = cenario({ respostas: [[linha()]] });
  assert.equal(
    restaurarVersao(naoEVersao.contexto, { versaoId: CONTEUDO }).desfecho,
    'versao-inexistente',
  );

  // `wp-admin/revision.php:46`: o pai nao existe. ⚠️ A capacidade e perguntada
  // ANTES (`:42`), e sobre um objeto inexistente ela ja nega — logo quem chega
  // aqui com pai ausente recebe `recusado`, e nao `conteudo-inexistente`. E a
  // ordem do legado, e ela decide qual recusa o ator ve.
  const semPai = cenario({
    respostas: [[linhaDeVersao(90, { post_parent: 777 })]],
  });
  assert.equal(
    restaurarVersao(semPai.contexto, { versaoId: 90 }).desfecho,
    'recusado',
  );
});

test('CA-10.4: sem `edit_post` do pai, a restauracao e recusada com o texto e o 401 do XML-RPC', () => {
  const { contexto, atualizacoes } = cenario({
    atorDaRequisicao: ator('subscriber', 999),
    respostas: [[linhaDeVersao(90)]],
  });

  const resultado = restaurarVersao(contexto, { versaoId: 90 });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.recusa, {
    // O `IXR_Error` do legado nao tem codigo de texto: so numero e mensagem.
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_RESTAURACAO,
    codigoHttp: 401,
  });
  assert.deepEqual(atualizacoes, []);
});

test('CA-10.4: com versionamento desligado, o painel ainda restaura SALVAMENTO AUTOMATICO', () => {
  const VERSAO = 90;
  const base = {
    constante: 0,
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  } as const;

  // Versao comum: a disjuncao de `wp-admin/revision.php:52` recusa.
  const comum = cenario({
    ...base,
    respostas: [[linhaDeVersao(VERSAO)], [linha()], [linhaDeVersao(VERSAO)]],
  });
  assert.equal(
    restaurarVersao(comum.contexto, { versaoId: VERSAO }).desfecho,
    'versionamento-desligado',
  );

  // ⚠️ Salvamento automatico: a METADE ESQUECIDA da disjuncao deixa passar, e
  // tem de deixar — e o unico jeito de recuperar o que o editor salvou sozinho,
  // e US-11 o cria mesmo com `WP_POST_REVISIONS` em zero.
  const automatico = cenario({
    ...base,
    respostas: [
      [linhaDeVersao(VERSAO, { post_name: nomeDaVersao(CONTEUDO, true) })],
      [linha()],
      [linhaDeVersao(VERSAO, { post_name: nomeDaVersao(CONTEUDO, true) })],
      [linha()],
    ],
  });
  assert.equal(
    restaurarVersao(automatico.contexto, { versaoId: VERSAO }).desfecho,
    'restaurado',
  );
});

test('CA-10.4: a gravacao que devolve `0` para o fluxo antes de `_edit_last` e do ponto', () => {
  const VERSAO = 90;
  const { contexto, dados, pontos } = cenario({
    idDaAtualizacao: 0,
    respostas: [
      [linhaDeVersao(VERSAO)],
      [linha()],
      [linhaDeVersao(VERSAO)],
    ],
  });

  const resultado = restaurarVersao(contexto, { versaoId: VERSAO });

  // `:501`: com o `$wp_error` de fabrica, `wp_update_post()` devolve `0`.
  assert.equal(resultado.desfecho, 'gravacao-falhou');
  assert.equal(resultado.conteudoId, null);
  assert.deepEqual(dados.escritas, []);
  assert.equal(pontos.includes('wp_restore_post_revision'), false);
});

test('CA-10.4: o ponto de campos vazio devolve o `false` do legado, sem gravar', () => {
  const VERSAO = 90;
  const { contexto, atualizacoes } = cenario({
    respostas: [[linhaDeVersao(VERSAO)], [linha()], [linhaDeVersao(VERSAO)]],
    ganchos: { filtrarCamposVersionaveis: () => [] },
  });

  // `:494`: `if ( ! $update ) { return false; }` — nao e erro e nao e sucesso.
  assert.equal(
    restaurarVersao(contexto, { versaoId: VERSAO }).desfecho,
    'sem-campo-a-restaurar',
  );
  assert.deepEqual(atualizacoes, []);
});

/* ── O METADADO VERSIONADO (6.4), E AS TRES ARMADILHAS DELE ───────────────── */

test('sem metadado versionado declarado, todo o ramo e um no-op', () => {
  const { contexto, dados } = cenario({
    respostas: [[linha()], [linha()], [], [linha()]],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.deepEqual(resultado.metadadosCopiados, []);
  // Nenhuma consulta a `postmeta`.
  assert.equal(
    dados.selecoes.some((pedida) => pedida.texto.includes('postmeta')),
    false,
  );
});

test('CA-10.1: o metadado versionado e copiado para a versao, valor por valor', () => {
  const { contexto, dados } = cenario({
    metadadosVersionados: ['footnotes'],
    respostas: [
      [linha()], // `:139`
      [linha()], // `:657`
      [], // `:690`
      [linha()], // `:396`
      // `metadata_exists()` e `get_post_meta()` passam pela mesma leitura.
      [
        { post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'um' },
        { post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'dois' },
      ],
      [
        { post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'um' },
        { post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'dois' },
      ],
    ],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  assert.deepEqual(resultado.metadadosCopiados, ['footnotes']);
  // Dois valores, dois `add_metadata` — sem `unique`, logo sempre insere
  // (`revision.php:555`).
  const insercoesDeMetadado = dados.escritas.filter((pedida) =>
    pedida.texto.includes('postmeta'),
  );
  assert.equal(insercoesDeMetadado.length, 2);
  assert.deepEqual(
    insercoesDeMetadado.map((pedida) => pedida.parametros.map(textoDoParametro)),
    [
      ['99', 'footnotes', 'um'],
      ['99', 'footnotes', 'dois'],
    ],
  );
});

test('metadado versionado mudado grava versao nova, mesmo com o texto identico', () => {
  const { contexto, insercoes, pontos } = cenario({
    metadadosVersionados: ['footnotes'],
    respostas: [
      [linha()], // `:139`
      [linha()], // `:657`
      [linhaDeVersao(90)], // `:690` — o texto da versao e identico ao do conteudo
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'novo' }], // do conteudo
      [{ post_id: 90, meta_key: 'footnotes', meta_value: 'velho' }], // da versao
      [linha()], // `:396`
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'novo' }],
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'novo' }],
    ],
  });

  const resultado = guardarVersao(contexto, CONTEUDO);

  // O texto nao mudou; o metadado, sim — e o ouvinte do nucleo, prioridade 10,
  // transforma o `false` da comparacao de texto em `true`.
  assert.equal(resultado.desfecho, 'guardada');
  assert.equal(insercoes.length, 1);
  // O ouvinte corre ANTES do interceptador de terceiro no mesmo ponto.
  assert.ok(
    pontos.indexOf('wp_post_revision_meta_keys') <
      pontos.indexOf('wp_save_post_revision_post_has_changed'),
  );
});

test('o ouvinte do metadado so sabe dizer "sim": ele nao desfaz a mudanca de texto', () => {
  const { contexto, insercoes } = cenario({
    metadadosVersionados: ['footnotes'],
    respostas: [
      [linha({ post_content: 'novo corpo' })],
      [linha({ post_content: 'novo corpo' })],
      [linhaDeVersao(90, { post_content: 'corpo antigo' })],
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'igual' }],
      [{ post_id: 90, meta_key: 'footnotes', meta_value: 'igual' }],
      [linha({ post_content: 'novo corpo' })],
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'igual' }],
      [{ post_id: CONTEUDO, meta_key: 'footnotes', meta_value: 'igual' }],
    ],
  });

  // O texto mudou e o metadado nao: o ouvinte **nao** volta a resposta para
  // falso (`revision.php:613`).
  assert.equal(guardarVersao(contexto, CONTEUDO).desfecho, 'guardada');
  assert.equal(insercoes.length, 1);
});

test('CA-10.4: restaurar APAGA o metadado versionado antes de copiar, e sem conferir', () => {
  const VERSAO = 90;
  const { contexto, dados } = cenario({
    metadadosVersionados: ['footnotes'],
    respostas: [
      [linhaDeVersao(VERSAO)], // `:37`
      [linha()], // o pai
      [linhaDeVersao(VERSAO)], // `:477` — a releitura de `:71`
      [], // `:505` — o `valoresDe` de `_edit_last`
      [], // `:505` — o `idsDe` de `_edit_last`
      [linha()], // `:519` — o `get_post_type()` do ouvinte
      [{ meta_id: 5 }], // o `SELECT meta_id` de `delete_post_meta( 'footnotes' )`
      [], // a versao NAO tem a chave: nada a copiar
    ],
  });

  const resultado = restaurarVersao(contexto, { versaoId: VERSAO });

  assert.equal(resultado.desfecho, 'restaurado');
  // ⚠️ A chave e percorrida mesmo sem a versao te-la, e o `DELETE` sai: a
  // restauracao **apaga** o metadado versionado que a versao nao carrega
  // (`revision.php:534`). Assimetrico com o lado de guardar, que confere antes.
  assert.deepEqual(resultado.metadadosRestaurados, ['footnotes']);
  const exclusoesDeMetadado = dados.escritas.filter((pedida) =>
    pedida.texto.startsWith('DELETE FROM wp_postmeta'),
  );
  assert.equal(exclusoesDeMetadado.length, 1);
});

test('a comparacao de metadado e a do PHP: contagem, ordem e valor, sobre o valor desserializado', () => {
  const serializado = 'a:1:{i:0;s:1:"b";}';
  const { contexto } = cenario({
    metadadosVersionados: ['chave'],
    respostas: [
      [linha()],
      [linha()],
      [linhaDeVersao(90)],
      // O mesmo valor serializado nas duas pontas: iguais, logo nao grava.
      [{ post_id: CONTEUDO, meta_key: 'chave', meta_value: serializado }],
      [{ post_id: 90, meta_key: 'chave', meta_value: serializado }],
    ],
  });

  assert.equal(guardarVersao(contexto, CONTEUDO).desfecho, 'sem-mudanca');

  // E a ordem conta: dois valores trocados de lugar sao diferentes no `!==` do
  // PHP, e portanto gravam versao nova.
  const trocado = cenario({
    metadadosVersionados: ['chave'],
    respostas: [
      [linha()],
      [linha()],
      [linhaDeVersao(90)],
      [
        { post_id: CONTEUDO, meta_key: 'chave', meta_value: 'um' },
        { post_id: CONTEUDO, meta_key: 'chave', meta_value: 'dois' },
      ],
      [
        { post_id: 90, meta_key: 'chave', meta_value: 'dois' },
        { post_id: 90, meta_key: 'chave', meta_value: 'um' },
      ],
      [linha()],
      [{ post_id: CONTEUDO, meta_key: 'chave', meta_value: 'um' }],
      [{ post_id: CONTEUDO, meta_key: 'chave', meta_value: 'um' }],
    ],
  });
  assert.equal(guardarVersao(trocado.contexto, CONTEUDO).desfecho, 'guardada');
});

/* ── AS INVARIANTES QUE ESTA PASTA NAO PODE QUEBRAR ───────────────────────── */

test('todas as versoes de um conteudo tem o MESMO identificador na URL', () => {
  // BR-MIGRAR-005 dispensa a unicidade do slug em revisao, e o cenario do slug
  // de `PT-002` repete: *"a dispensa de unicidade vale tambem para (…) revisao"*.
  // Um porte que tornasse o identificador unico renomearia a segunda versao e
  // quebraria `eSalvamentoAutomatico()` e `versaoDoNome()`.
  assert.equal(nomeDaVersao(CONTEUDO, false), '42-revision-v1');
  assert.equal(nomeDaVersao(CONTEUDO, true), '42-autosave-v1');
});

test('os valores declarados duas vezes nesta feature sao a mesma cadeia', () => {
  // `TIPO_DE_VERSAO` e `ESTADO_DE_VERSAO` vem de T002; esta pasta os compara em
  // dois lugares com constantes locais, e os testes acima passam por ambos.
  assert.equal(TIPO_DE_VERSAO, 'revision');
  assert.equal(ESTADO_DE_VERSAO, 'inherit');
  // A sentinela de data de T002 nao e usada por esta pasta: a versao carrega o
  // `post_modified` do original, que e data de verdade.
  assert.equal(DATA_SENTINELA, '0000-00-00 00:00:00');
});

test('P6: nenhum numero que o legado nao tem aparece nesta pasta', () => {
  // O unico numero desta feature que entra aqui e `WP_POST_REVISIONS`, com o
  // valor de fabrica do legado e com teste de borda. Nao ha prazo de retencao de
  // versao, nao ha limite de tamanho e nao ha limite de taxa — e introduzir
  // qualquer um deles cai na tabela *Nao negociavel* da constituicao.
  assert.equal(QUANTAS_VERSOES_GUARDAR_DE_FABRICA, true);
  assert.equal(VERSOES_ILIMITADAS, -1);
  // E os dois valores que o codec de metadado usa sao dado, nao numero de regra.
  assert.deepEqual(inteiro(7), { tipo: 'inteiro', valor: 7 });
  assert.deepEqual(texto('a'), { tipo: 'texto', valor: 'a' });
});
