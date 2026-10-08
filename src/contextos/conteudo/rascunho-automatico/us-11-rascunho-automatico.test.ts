/**
 * Testes da entrega de **T023**: *"o comportamento de US-11 existe e os
 * criterios CA-11.1, CA-11.2, CA-11.3, CA-11.4 passam contra o sistema novo"*.
 *
 * **Nao sao os seis testes de `backlog/tests.md`** — UT-031-1 a UT-031-6 sao
 * **T024**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles.
 *
 * E por isso que a porta de dados daqui **registra comando** em vez de simular
 * banco: o que se tem de afirmar e qual comando sai, com quais parametros e com
 * quais bytes — inclusive o caso em que o legado **nao emite comando nenhum**,
 * que aqui sao os dois desfechos de falha.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  ESTADO_PADRAO_DA_APLICACAO,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
} from '../estado-editorial.js';
import type { ContextoDeGravacao } from '../gravacao/index.js';
import type { LinhaDeResultado, PortaDeRelogio } from '../portas/index.js';
import {
  CAPACIDADE_DE_CRIAR,
  CAPACIDADE_DE_EDITAR,
  CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO,
  CODIGO_DE_PARAMETRO_INVALIDO,
  CODIGO_HTTP_DE_PARAMETRO_INVALIDO,
  CODIGO_HTTP_DE_RECUSA_DO_EDITOR,
  ESTADOS_REGISTRADOS_DE_FABRICA,
  ESTADO_COM_QUE_O_EDITOR_RESERVA,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  ESTADO_DO_EDITOR_SEM_REGISTRO,
  EXCECOES_DECLARADAS_A_INVISIBILIDADE,
  EXCLUSOES_LITERAIS_DE_LISTAGEM,
  GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
  ID_DO_EDITOR_SEM_REGISTRO,
  INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA,
  MENSAGEM_DE_RECUSA_DO_EDITOR,
  MINUTO_EM_SEGUNDOS,
  PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO,
  RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO,
  SUPERFICIES_DO_ESTADO_PEDIDO,
  SUPERFICIES_DO_SALVAMENTO_AUTOMATICO,
  TITULO_DE_RECUSA_DO_EDITOR,
  TITULO_DO_RASCUNHO_AUTOMATICO,
  abrirEditor,
  destinoDoSalvamentoAutomatico,
  estadoApareceEmConsultaPublica,
  estadoApareceEmListagemDoPainel,
  estadoPodeSerPedidoPelaApi,
  estadosPedveisPelaApi,
  intervaloDeSalvamentoAutomatico,
  intervaloPublicadoAoCliente,
  mensagemDeEstadoForaDaEnumeracao,
  podeSalvarAutomaticamente,
  proximoSalvamentoAutomatico,
  recusaDeEstadoPedidoPelaApi,
  reescreverEstadoPedidoNoPainel,
  type ContextoDoEditor,
  type EventoRecorrenteNoEditor,
  type GanchosDoEditor,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_GERADO = 7;
const ENDERECO = `https://exemplo.test/?p=${ID_GERADO}`;

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** `current_time( 'mysql', true )` — o mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';
/** `time()` do cenario, em segundos inteiros UTC. */
const AGORA_EM_SEGUNDOS = 1_791_216_000;

/**
 * A matriz de papeis do cenario.
 *
 * `author` tem as duas capacidades de `post`; `subscriber` nao tem nenhuma; e
 * `colaborador-sem-criar` tem **so** a de editar, que e o recorte que separa as
 * duas perguntas de `wp-admin/post-new.php:58` (ver o tipo `TIPO_SEPARADO`).
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_coisas', concedida: true },
    ],
  },
  {
    identificador: 'colaborador-sem-criar',
    capacidades: [{ capacidade: 'edit_coisas', concedida: true }],
  },
  { identificador: 'subscriber', capacidades: [] },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/**
 * `get_post_type_object( 'post' )` — os dois slots caem na **mesma** cadeia,
 * como `get_post_type_capabilities()` os deriva de fabrica
 * (`wp-includes/post.php:2070`).
 */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    create_posts: 'edit_posts',
  },
};

/**
 * Um tipo de terceiro que **declara `create_posts` proprio** — o caso de uso
 * para o qual aquele slot existe, e o unico em que o `&&` de
 * `wp-admin/post-new.php:58` e observavel.
 */
const TIPO_SEPARADO: TipoDeConteudoNaAutorizacao = {
  nome: 'coisa',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_coisas',
    create_posts: 'criar_coisas',
  },
};

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_GERADO,
    post_author: 7,
    post_date: AGORA_LOCAL,
    post_date_gmt: DATA_SENTINELA,
    post_content: '',
    post_title: TITULO_DO_RASCUNHO_AUTOMATICO,
    post_excerpt: '',
    post_status: ESTADO_DE_RASCUNHO_AUTOMATICO,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: '',
    to_ping: '',
    pinged: '',
    post_modified: AGORA_LOCAL,
    post_modified_gmt: AGORA_UTC,
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDoEditor;
  readonly dados: PortaDeDadosFalsa;
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  /** O que foi perguntado a fila, na ordem. */
  readonly perguntasAFila: string[];
  /** O que foi agendado, na ordem. */
  readonly agendamentos: EventoRecorrenteNoEditor[];
  readonly ganchos: GanchosDoEditor;
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly atorDaRequisicao?: AtorDeAutorizacao;
  readonly tipos?: Readonly<Record<string, TipoDeConteudoNaAutorizacao>>;
  readonly suportaRecurso?: (tipo: string, recurso: string) => boolean;
  /** A linha que as leituras devolvem. `null` responde vazio. */
  readonly linha?: LinhaDeResultado | null;
  /** Quantas leituras a porta responde. A abertura completa faz **duas**. */
  readonly leituras?: number;
  /** O proximo disparo que a fila ja tem, ou `null` quando ela esta vazia. */
  readonly proximaOcorrencia?: number | null;
  readonly endereco?: string | false;
  readonly filtrarCorpoPadrao?: (corpo: string, conteudoId: number) => unknown;
  readonly filtrarTituloPadrao?: (titulo: string, conteudoId: number) => unknown;
  readonly filtrarResumoPadrao?: (resumo: string, conteudoId: number) => unknown;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 1, idGerado: ID_GERADO },
  });
  const linha = opcoes.linha === undefined ? linhaDeConteudo() : opcoes.linha;
  for (let i = 0; i < (opcoes.leituras ?? 2); i += 1) {
    dados.responder(linha === null ? [] : [linha]);
  }

  const pontos: string[] = [];
  const perguntasAFila: string[] = [];
  const agendamentos: EventoRecorrenteNoEditor[] = [];

  const ganchos: GanchosDoEditor = {
    depoisDeInserirConteudo(conteudoId, atualizacao, anterior) {
      pontos.push(
        `wp_after_insert_post(${String(conteudoId)},${String(atualizacao)},${String(anterior)})`,
      );
    },
    filtrarCorpoPadrao(corpo, conteudoId) {
      pontos.push('default_content');
      return opcoes.filtrarCorpoPadrao === undefined
        ? corpo
        : opcoes.filtrarCorpoPadrao(corpo, conteudoId);
    },
    filtrarTituloPadrao(titulo, conteudoId) {
      pontos.push('default_title');
      return opcoes.filtrarTituloPadrao === undefined
        ? titulo
        : opcoes.filtrarTituloPadrao(titulo, conteudoId);
    },
    filtrarResumoPadrao(resumo, conteudoId) {
      pontos.push('default_excerpt');
      return opcoes.filtrarResumoPadrao === undefined
        ? resumo
        : opcoes.filtrarResumoPadrao(resumo, conteudoId);
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      return AGORA_EM_SEGUNDOS;
    },
  };

  const tipos = opcoes.tipos ?? { post: TIPO_POST, coisa: TIPO_SEPARADO };
  const endereco = opcoes.endereco === undefined ? ENDERECO : opcoes.endereco;
  const proximaOcorrencia =
    opcoes.proximaOcorrencia === undefined ? null : opcoes.proximaOcorrencia;

  const gravacao: ContextoDeGravacao = {
    ator: opcoes.atorDaRequisicao ?? ator(opcoes.papel ?? 'author'),
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    datas: {
      agoraNoFusoDoSite: () => AGORA_LOCAL,
      agoraEmUtc: () => AGORA_UTC,
      deUtcParaOFusoDoSite: () => AGORA_LOCAL,
      doFusoDoSiteParaUtc: () => AGORA_UTC,
    },
    suportaRecurso: opcoes.suportaRecurso ?? (() => true),
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: () => endereco,
  };

  const contexto: ContextoDoEditor = {
    base: BASE,
    gravacao,
    tipoDeConteudo: (nome) => tipos[nome] ?? null,
    relogio,
    fila: {
      proximaOcorrencia(gancho) {
        perguntasAFila.push(gancho);
        return proximaOcorrencia;
      },
      agendarRecorrente(evento) {
        agendamentos.push(evento);
      },
    },
    ganchos,
  };

  return { contexto, dados, pontos, perguntasAFila, agendamentos, ganchos };
}

/**
 * O valor que **uma coluna nomeada** recebeu no comando, lido do proprio SQL.
 *
 * Mesmo helper, com as mesmas palavras, de
 * `../gravacao/us-2-gravar-rascunho.test.ts`: por nome, e nao por posicao,
 * porque o que se afirma e o valor da coluna — a **ordem** das colunas e
 * afirmada por aquela suite, que e a dona do `compact()` de
 * `wp-includes/post.php:4912`.
 */
function colunaEscrita(
  cenarioDoTeste: Cenario,
  indice: number,
  coluna: string,
): string {
  const consulta = cenarioDoTeste.dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${String(indice)}`);

  const colunas = consulta.texto.startsWith('INSERT')
    ? (consulta.texto.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ')
    : (consulta.texto.match(/SET (.*) WHERE/)?.[1] ?? '')
        .split(', ')
        .map((atribuicao) => atribuicao.replace(' = ?', ''));

  const posicao = colunas.indexOf(coluna);
  assert.ok(
    posicao >= 0,
    `a coluna ${coluna} nao esta no comando: ${consulta.texto}`,
  );
  return textoDoParametro(consulta.parametros[posicao]);
}

/* ── CA-11.1 — ABRIR O EDITOR CRIA O REGISTRO ──────────────────────────────── */

test('CA-11.1 abrir o editor de um conteudo novo grava uma linha em `auto-draft`', () => {
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
  assert.equal(resultado.conteudoId, ID_GERADO);
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.erro, null);

  // Efeito no banco: a primeira escrita e o `INSERT`, e a coluna de estado leva
  // `auto-draft` — `wp-admin/includes/post.php:779`.
  assert.equal(
    colunaEscrita(c, 0, 'post_status'),
    ESTADO_DE_RASCUNHO_AUTOMATICO,
  );
  assert.equal(ESTADO_COM_QUE_O_EDITOR_RESERVA, 'auto-draft');
});

test('CA-11.1 o registro nasce com o titulo `Auto Draft`, que e o que impede `empty_content`', () => {
  const c = cenario();

  abrirEditor(c.contexto, 'post');

  // `:777` — e o titulo que faz `$maybe_empty` falhar em `wp-includes/post.php:4673`.
  assert.equal(colunaEscrita(c, 0, 'post_title'), 'Auto Draft');
  assert.equal(TITULO_DO_RASCUNHO_AUTOMATICO, 'Auto Draft');
});

test('CA-11.1 tipo que nao suporta titulo grava titulo vazio, e a linha entra pelo outro lado da mesma condicao', () => {
  // `post_type_supports( $tipo, 'title' )` falso: o ternario de `:777` da `''`,
  // e `$maybe_empty` tambem falha porque exige os tres suportes.
  const c = cenario({ suportaRecurso: () => false });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
  assert.equal(colunaEscrita(c, 0, 'post_title'), '');
  assert.equal(
    colunaEscrita(c, 0, 'post_status'),
    ESTADO_DE_RASCUNHO_AUTOMATICO,
  );
});

test('CA-11.1 o registro nasce antes de qualquer digitacao: corpo e resumo vao vazios', () => {
  // O pedido traz as tres entradas de `$_REQUEST` (`:759`-`:771`) e **nenhuma**
  // chega a coluna: elas sao argumento dos filtros do passo 8.
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post', {
    tituloSugerido: 'titulo da requisicao',
    corpoSugerido: 'corpo da requisicao',
    resumoSugerido: 'resumo da requisicao',
  });

  assert.equal(colunaEscrita(c, 0, 'post_content'), '');
  assert.equal(colunaEscrita(c, 0, 'post_excerpt'), '');
  assert.equal(colunaEscrita(c, 0, 'post_title'), 'Auto Draft');

  // E o que a tela recebe e o outro objeto, com o que veio da requisicao.
  assert.deepEqual(resultado.paraOFormulario, {
    corpo: 'corpo da requisicao',
    titulo: 'titulo da requisicao',
    resumo: 'resumo da requisicao',
  });
});

test('CA-11.1 a autoria gravada e a de quem abriu o editor', () => {
  // O default de `post_author` e `get_current_user_id()`
  // (`wp-includes/post.php:4824`), e o cenario `@concorrencia` de `PT-002` cobra
  // que duas aberturas simultaneas nao troquem de autoria.
  const primeira = cenario({ atorDaRequisicao: ator('author', 11) });
  const segunda = cenario({ atorDaRequisicao: ator('author', 22) });

  abrirEditor(primeira.contexto, 'post');
  abrirEditor(segunda.contexto, 'post');

  assert.equal(colunaEscrita(primeira, 0, 'post_author'), '11');
  assert.equal(colunaEscrita(segunda, 0, 'post_author'), '22');
});

test('CA-11.1 o rascunho automatico grava a sentinela em `post_date_gmt`, porque o estado tem data flutuante', () => {
  const c = cenario();

  abrirEditor(c.contexto, 'post');

  // `auto-draft` e um dos tres estados com `date_floating`
  // (`wp-includes/post.php:757`), e e por isso que a coluna GMT fica na
  // sentinela (`:4779`-`:4784`).
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL[ESTADO_DE_RASCUNHO_AUTOMATICO]
      .dataFlutuante,
    true,
  );
  assert.equal(colunaEscrita(c, 0, 'post_date_gmt'), DATA_SENTINELA);
  assert.equal(colunaEscrita(c, 0, 'post_date'), AGORA_LOCAL);
});

test('CA-11.1 o identificador na URL fica vazio, porque `auto-draft` dispensa unicidade', () => {
  const c = cenario();

  abrirEditor(c.contexto, 'post');

  // BR-MIGRAR-005: a unicidade e dispensada em `draft`, `pending` e
  // `auto-draft` (`wp-includes/post.php:4746` e `:5046`).
  assert.equal(colunaEscrita(c, 0, 'post_name'), '');
});

/* ── CA-11.1 — AS DUAS CAPACIDADES ─────────────────────────────────────────── */

test('CA-11.1 quem nao tem nenhuma das duas capacidades e recusado, e nada e gravado', () => {
  const c = cenario({ papel: 'subscriber' });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(resultado.desfecho, 'sem-permissao');
  assert.equal(resultado.conteudoId, 0);
  assert.equal(resultado.gravado, null);
  assert.equal(resultado.paraOFormulario, null);
  assert.deepEqual(resultado.recusa, {
    titulo: TITULO_DE_RECUSA_DO_EDITOR,
    mensagem: MENSAGEM_DE_RECUSA_DO_EDITOR,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DO_EDITOR,
  });

  // Nenhum comando saiu: a recusa precede a gravacao.
  assert.deepEqual(c.dados.escritas, []);
  assert.deepEqual(c.dados.selecoes, []);
  // E a fila nao foi tocada.
  assert.deepEqual(c.perguntasAFila, []);
});

test('CA-11.1 ter so a capacidade de editar NAO basta quando o tipo declara `create_posts` proprio', () => {
  // E o unico caso em que o `&&` de `wp-admin/post-new.php:58` e observavel: de
  // fabrica os dois slots sao a mesma cadeia (`wp-includes/post.php:2070`).
  const c = cenario({ papel: 'colaborador-sem-criar' });

  const resultado = abrirEditor(c.contexto, 'coisa');

  assert.equal(resultado.desfecho, 'sem-permissao');
  assert.deepEqual(c.dados.escritas, []);

  // E o mesmo ator abre o editor do tipo cujos dois slots caem em `edit_coisas`.
  const comOsDoisSlotsIguais = cenario({
    papel: 'colaborador-sem-criar',
    tipos: {
      coisa: {
        nome: 'coisa',
        traduzMetaCapacidade: true,
        capacidades: { edit_posts: 'edit_coisas', create_posts: 'edit_coisas' },
      },
    },
  });
  assert.equal(
    abrirEditor(comOsDoisSlotsIguais.contexto, 'coisa').desfecho,
    'rascunho-automatico-criado',
  );
});

test('CA-11.1 tipo nao registrado fecha a porta, e os dois slots sao chave de mapa e nao nome de capacidade', () => {
  const c = cenario({ tipos: {} });

  assert.equal(abrirEditor(c.contexto, 'post').desfecho, 'sem-permissao');
  assert.deepEqual(c.dados.escritas, []);

  // Os dois slots: nomes de **chave**, e nao as capacidades perguntadas.
  assert.equal(CAPACIDADE_DE_EDITAR, 'edit_posts');
  assert.equal(CAPACIDADE_DE_CRIAR, 'create_posts');
  assert.equal(TIPO_SEPARADO.capacidades[CAPACIDADE_DE_CRIAR], 'criar_coisas');
});

/* ── CA-11.1 — A GRAVACAO RECUSADA, E O ERRO COMO VALOR ────────────────────── */

test('CA-11.1 gravacao recusada devolve o erro como valor, e nada e agendado', () => {
  // O desfecho alcancavel e `empty_content`: um interceptador de
  // `wp_insert_post_empty_content` que diga que sim (`wp-includes/post.php:4695`).
  const c = cenario();
  const contextoComFiltro: ContextoDoEditor = {
    ...c.contexto,
    gravacao: {
      ...c.contexto.gravacao,
      ganchos: { filtrarCorpoVazio: () => true },
    },
  };

  const resultado = abrirEditor(contextoComFiltro, 'post');

  assert.equal(resultado.desfecho, 'gravacao-recusada');
  assert.equal(resultado.conteudoId, 0);
  assert.deepEqual(resultado.erro, {
    codigo: 'empty_content',
    mensagem: 'Content, title, and excerpt are empty.',
  });
  assert.deepEqual(c.dados.escritas, []);
  // O passo 7 vem depois do passo 3: sem registro, sem agendamento.
  assert.deepEqual(c.perguntasAFila, []);
  assert.deepEqual(c.agendamentos, []);
});

/* ── CA-11.1 — A ORDEM DOS PONTOS, E O AGENDAMENTO DA COLETA ───────────────── */

test('CA-11.1 a ordem dos pontos e a do legado: `wp_after_insert_post` antes dos tres filtros', () => {
  const c = cenario();

  abrirEditor(c.contexto, 'post');

  // `:795`, depois `:831`, `:841`, `:851`. O `wp_after_insert_post` recebe os
  // tres literais do legado: o conteudo, `false` e `null`.
  assert.deepEqual(c.pontos, [
    `wp_after_insert_post(${String(ID_GERADO)},false,null)`,
    'default_content',
    'default_title',
    'default_excerpt',
  ]);
});

test('CA-11.1 a coleta e agendada quando a fila esta vazia, com o gancho, o instante e a recorrencia do legado', () => {
  const c = cenario({ proximaOcorrencia: null });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.deepEqual(c.perguntasAFila, [
    GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
  ]);
  assert.deepEqual(c.agendamentos, [
    {
      gancho: 'wp_scheduled_auto_draft_delete',
      primeiroDisparoEmSegundos: AGORA_EM_SEGUNDOS,
      recorrencia: 'daily',
    },
  ]);
  assert.equal(resultado.coletaAgendadaAgora, true);
  assert.equal(RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO, 'daily');
});

test('CA-11.1 a coleta NAO e agendada de novo quando ja esta na fila: a guarda e do chamador', () => {
  const c = cenario({ proximaOcorrencia: AGORA_EM_SEGUNDOS + 86_400 });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.deepEqual(c.perguntasAFila, [
    GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
  ]);
  assert.deepEqual(c.agendamentos, []);
  assert.equal(resultado.coletaAgendadaAgora, false);
  // E o registro foi reservado de qualquer forma: o agendamento nao e condicao.
  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
});

test('CA-11.1 a guarda do agendamento usa a falsidade de PHP: instante `0` conta como nao agendado', () => {
  // `! wp_next_scheduled( ... )` le o retorno com a verdade de PHP, e
  // `wp_next_scheduled()` devolve `false` **ou um instante**. Um evento marcado
  // para o instante `0` e falso la, logo a guarda agenda outro por cima.
  const c = cenario({ proximaOcorrencia: 0 });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(resultado.coletaAgendadaAgora, true);
  assert.equal(c.agendamentos.length, 1);
});

/* ── CA-11.1 — OS TRES FILTROS, E O `(string)` DO LEGADO ───────────────────── */

test('CA-11.1 os tres filtros mudam o que a tela ve e nao o que o banco tem', () => {
  const c = cenario({
    filtrarCorpoPadrao: () => 'corpo do interceptador',
    filtrarTituloPadrao: () => 'titulo do interceptador',
    filtrarResumoPadrao: () => 'resumo do interceptador',
  });

  const resultado = abrirEditor(c.contexto, 'post');

  assert.deepEqual(resultado.paraOFormulario, {
    corpo: 'corpo do interceptador',
    titulo: 'titulo do interceptador',
    resumo: 'resumo do interceptador',
  });
  // A linha segue com o que foi gravado no passo 2.
  assert.equal(colunaEscrita(c, 0, 'post_content'), '');
  assert.equal(colunaEscrita(c, 0, 'post_title'), 'Auto Draft');
});

test('CA-11.1 o `(string)` do legado coage o retorno dos filtros como o PHP coage', () => {
  const c = cenario({
    filtrarCorpoPadrao: () => null,
    filtrarTituloPadrao: () => true,
    filtrarResumoPadrao: () => 0,
  });

  const resultado = abrirEditor(c.contexto, 'post');

  // `(string) null` e `''`; `(string) true` e `'1'`; `(string) 0` e `'0'`.
  assert.deepEqual(resultado.paraOFormulario, {
    corpo: '',
    titulo: '1',
    resumo: '0',
  });
});

/* ── CA-11.1 — O RAMO DA MESMA FUNCAO QUE NAO GRAVA ───────────────────────── */

test('CA-11.1 o ramo que nao grava mostra `draft` e identificador 0, e nao `auto-draft`', () => {
  // `wp-admin/includes/post.php:803` e `:810`. Nao e portado — e o formulario em
  // branco de BC-09 —, e os dois valores estao declarados para que ninguem leia
  // aquele `draft` como este `auto-draft`.
  assert.equal(ID_DO_EDITOR_SEM_REGISTRO, 0);
  assert.equal(ESTADO_DO_EDITOR_SEM_REGISTRO, 'draft');
  assert.notEqual(ESTADO_DO_EDITOR_SEM_REGISTRO, ESTADO_DE_RASCUNHO_AUTOMATICO);
});

/* ── CA-11.2 — O RASCUNHO AUTOMATICO NAO APARECE EM LISTAGEM ──────────────── */

test('CA-11.2 `auto-draft` esta fora das duas listagens do painel e da consulta publica', () => {
  assert.equal(estadoApareceEmListagemDoPainel('auto-draft'), false);
  assert.equal(estadoApareceEmConsultaPublica('auto-draft'), false);
});

test('CA-11.2 `auto-draft` e o unico estado desta feature fora das duas listagens do painel', () => {
  const daFeature = [
    'publish',
    'future',
    'draft',
    'pending',
    'private',
    'auto-draft',
  ] as const;

  const invisiveis = daFeature.filter(
    (estado) => !estadoApareceEmListagemDoPainel(estado),
  );

  assert.deepEqual(invisiveis, ['auto-draft']);
});

test('CA-11.2 `trash` tambem e interno e APARECE na barra de estados: interno nao e sinonimo de invisivel', () => {
  // `wp-includes/post.php:733`-`:747`: `show_in_admin_status_list => true`
  // explicito. E a diferenca que um porte "simplificado" apaga.
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.trash.interno, true);
  assert.equal(estadoApareceEmListagemDoPainel('trash'), true);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL['auto-draft'].interno,
    PROPRIEDADES_DO_ESTADO_EDITORIAL.trash.interno,
  );
});

test('CA-11.2 as seis exclusoes literais do legado estao inventariadas', () => {
  assert.equal(EXCLUSOES_LITERAIS_DE_LISTAGEM.length, 6);
  assert.ok(
    EXCLUSOES_LITERAIS_DE_LISTAGEM.includes(
      'wp-admin/includes/class-wp-posts-list-table.php:122',
    ),
  );
});

test('🔴 CA-11.2 as duas excecoes do legado estao DECLARADAS, com ancora, e nao resolvidas', () => {
  // O P1 exige decisao humana registrada para divergir, e nenhuma existe: o que
  // esta tarefa faz e deixar as duas citadas no codigo. Mesmo precedente de T003
  // com CA-1.1.
  assert.equal(EXCECOES_DECLARADAS_A_INVISIBILIDADE.length, 2);
  for (const excecao of EXCECOES_DECLARADAS_A_INVISIBILIDADE) {
    assert.match(excecao.ancora, /\.php:\d+$/);
  }
});

/* ── CA-11.3 — O ESTADO QUE A API NAO PODE PEDIR ──────────────────────────── */

test('CA-11.3 `auto-draft` nao esta na enumeracao do parametro de escrita', () => {
  const pedveis = estadosPedveisPelaApi();

  assert.ok(!pedveis.includes('auto-draft'));
  // A enumeracao de fabrica, na ordem do registro — e observavel: ela vai para o
  // esquema publicado e para o texto do erro.
  assert.deepEqual(pedveis, [
    'publish',
    'future',
    'draft',
    'pending',
    'private',
  ]);
});

test('CA-11.3 a enumeracao e derivada do registro, e estado de extensao nao interno entra sozinho', () => {
  // `register_post_status()` e ponto de extensao publico (P2): cravar a lista de
  // cinco recusaria estado que o legado aceita.
  const comExtensao = [
    ...ESTADOS_REGISTRADOS_DE_FABRICA,
    { nome: 'em-revisao-editorial', interno: false },
    { nome: 'arquivo-interno', interno: true },
  ];

  const pedveis = estadosPedveisPelaApi(comExtensao);

  assert.ok(pedveis.includes('em-revisao-editorial'));
  assert.ok(!pedveis.includes('arquivo-interno'));
  assert.ok(!pedveis.includes('auto-draft'));
});

test('CA-11.3 criar com `auto-draft` e recusado com `rest_invalid_param` e 400, para qualquer ator', () => {
  const recusa = recusaDeEstadoPedidoPelaApi('auto-draft');

  assert.deepEqual(recusa, {
    codigo: CODIGO_DE_PARAMETRO_INVALIDO,
    mensagem: 'Invalid parameter(s): status',
    codigoHttp: CODIGO_HTTP_DE_PARAMETRO_INVALIDO,
    detalhe: {
      codigo: CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO,
      mensagem: 'status is not one of publish, future, draft, pending, and private.',
    },
  });
  // Nao e 403: o estado nao e negado por falta de poder, ele nao existe naquele
  // parametro.
  assert.equal(CODIGO_HTTP_DE_PARAMETRO_INVALIDO, 400);
});

test('CA-11.3 estado da enumeracao passa, e a recusa e ausencia de recusa', () => {
  assert.equal(recusaDeEstadoPedidoPelaApi('draft'), null);
  assert.equal(estadoPodeSerPedidoPelaApi('draft'), true);
  assert.equal(estadoPodeSerPedidoPelaApi('auto-draft'), false);
});

test('CA-11.3 o atalho de `check_status()`: atualizar reenviando o estado atual passa, criar nao', () => {
  // `class-wp-rest-posts-controller.php:1546` — *"Allows for sending an update
  // request with the current status, even if that status would not be
  // acceptable."* E por isso que "e CRIADO so por este caminho" continua
  // verdadeiro: o atalho preserva, nao cria.
  assert.equal(estadoPodeSerPedidoPelaApi('auto-draft', 'auto-draft'), true);
  assert.equal(recusaDeEstadoPedidoPelaApi('auto-draft', 'auto-draft'), null);

  // Criacao nao tem atalho (`$request['id']` vazio).
  assert.equal(estadoPodeSerPedidoPelaApi('auto-draft', null), false);
  // E um conteudo noutro estado tambem nao.
  assert.equal(estadoPodeSerPedidoPelaApi('auto-draft', 'draft'), false);
});

test('CA-11.3 o painel nao recusa: ele reescreve `auto-draft` para o default da aplicacao', () => {
  // `wp-admin/includes/post.php:111` — *"No longer an auto-draft."*
  assert.equal(
    reescreverEstadoPedidoNoPainel('auto-draft', ESTADO_PADRAO_DA_APLICACAO),
    'draft',
  );
  // E nao mexe em mais nada.
  assert.equal(
    reescreverEstadoPedidoNoPainel('publish', ESTADO_PADRAO_DA_APLICACAO),
    'publish',
  );
});

test('CA-11.3 a mensagem interna usa a juncao de `wp_sprintf_l`, e nao um `join`', () => {
  // `wp-includes/formatting.php:5399`: `', '` entre os itens e `', and '` antes
  // do ultimo; com dois itens, `' and '` e sem virgula.
  assert.equal(
    mensagemDeEstadoForaDaEnumeracao(['a', 'b', 'c']),
    'status is not one of a, b, and c.',
  );
  assert.equal(
    mensagemDeEstadoForaDaEnumeracao(['a', 'b']),
    'status is not one of a and b.',
  );
  // Um valor so cai no outro `msgid` do legado (`wp-includes/rest-api.php:2155`).
  assert.equal(mensagemDeEstadoForaDaEnumeracao(['a']), 'status is not a.');
});

test('🔴 CA-11.3 as seis superficies estao declaradas, inclusive a que ACEITA o estado', () => {
  // A divergencia e real e nao foi resolvida: `wp_newPost` do XML-RPC aceita
  // `auto-draft`, porque a guarda dele pergunta se o estado existe no registro
  // (`class-wp-xmlrpc-server.php:1526`). Fechar isso aqui tornaria o sistema
  // novo mais fechado que o legado numa superficie que a resposta 14 manda
  // portar inteira.
  const aceita = SUPERFICIES_DO_ESTADO_PEDIDO.filter(
    (superficie) => superficie.desfecho === 'aceita',
  );

  assert.equal(SUPERFICIES_DO_ESTADO_PEDIDO.length, 6);
  assert.equal(aceita.length, 1);
  assert.equal(
    aceita[0]?.ancora,
    'wp-includes/class-wp-xmlrpc-server.php:1526',
  );
});

/* ── CA-11.4 — O SALVAMENTO AUTOMATICO ────────────────────────────────────── */

test('CA-11.4 `AUTOSAVE_INTERVAL` de fabrica e 60 segundos, derivado de `MINUTE_IN_SECONDS`', () => {
  assert.equal(MINUTO_EM_SEGUNDOS, 60);
  assert.equal(INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA, 60);
  assert.equal(intervaloDeSalvamentoAutomatico(), 60);
});

test('CA-11.4 a constante do dono do servidor substitui o valor de fabrica', () => {
  // A guarda `! defined( 'AUTOSAVE_INTERVAL' )` de
  // `wp-includes/default-constants.php:380`.
  assert.equal(intervaloDeSalvamentoAutomatico({ AUTOSAVE_INTERVAL: 15 }), 15);
  // E e em segundos que ele e publicado aos dois clientes.
  assert.equal(intervaloPublicadoAoCliente({ AUTOSAVE_INTERVAL: 15 }), 15);
  assert.equal(intervaloPublicadoAoCliente(), 60);
});

test('CA-11.4 BORDA: no instante em que o intervalo fecha salva; um milissegundo antes, recusa', () => {
  // `wp-includes/js/autosave.js:752` — a comparacao e `<`, logo o instante de
  // fechamento e o PRIMEIRO permitido.
  const abertura = 1_000_000;
  const proximo = proximoSalvamentoAutomatico(
    abertura,
    intervaloDeSalvamentoAutomatico(),
  );

  assert.equal(proximo, abertura + 60_000);
  assert.equal(podeSalvarAutomaticamente(proximo - 1, proximo), false);
  assert.equal(podeSalvarAutomaticamente(proximo, proximo), true);
  assert.equal(podeSalvarAutomaticamente(proximo + 1, proximo), true);
});

test('CA-11.4 BORDA: o intervalo configurado move a borda, e nao o literal da outra ponta', () => {
  const abertura = 1_000_000;
  const proximo = proximoSalvamentoAutomatico(
    abertura,
    intervaloDeSalvamentoAutomatico({ AUTOSAVE_INTERVAL: 15 }),
  );

  assert.equal(proximo, abertura + 15_000);
  assert.equal(podeSalvarAutomaticamente(abertura + 14_999, proximo), false);
  assert.equal(podeSalvarAutomaticamente(abertura + 15_000, proximo), true);
});

test('CA-11.4 o `|| 60000` da linha do cliente e literal daquela linha, e nao o intervalo convertido', () => {
  // So vale quando a soma inteira e falsa — `NaN`. O legado nao valida a
  // constante, e recusar seria outro produto.
  const proximo = proximoSalvamentoAutomatico(1_000_000, Number.NaN);

  assert.equal(proximo, PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO);
  assert.equal(PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO, 60_000);
  assert.notEqual(
    PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO,
    INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA,
  );
});

test('CA-11.4 o salvamento automatico escreve NESSE registro: rascunho automatico, do proprio autor, sem trava', () => {
  // As tres condicoes sao verdadeiras por construcao para o registro que a
  // abertura do editor acabou de criar.
  assert.equal(
    destinoDoSalvamentoAutomatico({
      estadoDoConteudo: ESTADO_DE_RASCUNHO_AUTOMATICO,
      autorDoConteudo: 7,
      atorId: 7,
      travadoPorOutraPessoa: false,
    }),
    'no-proprio-registro',
  );
});

test('CA-11.4 `draft` tambem e sobrescrito, e os outros estados nao', () => {
  const comEstado = (estado: string) =>
    destinoDoSalvamentoAutomatico({
      estadoDoConteudo: estado,
      autorDoConteudo: 7,
      atorId: 7,
      travadoPorOutraPessoa: false,
    });

  assert.equal(comEstado('draft'), 'no-proprio-registro');
  assert.equal(comEstado('publish'), 'em-versao-de-salvamento-automatico');
  assert.equal(comEstado('pending'), 'em-versao-de-salvamento-automatico');
  assert.equal(comEstado('private'), 'em-versao-de-salvamento-automatico');
});

test('CA-11.4 rascunho de outra pessoa, ou com trava ativa, vai para a versao por conta', () => {
  assert.equal(
    destinoDoSalvamentoAutomatico({
      estadoDoConteudo: ESTADO_DE_RASCUNHO_AUTOMATICO,
      autorDoConteudo: 7,
      atorId: 9,
      travadoPorOutraPessoa: false,
    }),
    'em-versao-de-salvamento-automatico',
  );
  assert.equal(
    destinoDoSalvamentoAutomatico({
      estadoDoConteudo: ESTADO_DE_RASCUNHO_AUTOMATICO,
      autorDoConteudo: 7,
      atorId: 7,
      travadoPorOutraPessoa: true,
    }),
    'em-versao-de-salvamento-automatico',
  );
});

test('CA-11.4 autor 0 casa com linha de autor 0: orfao e estado normal (P5)', () => {
  // A comparacao do legado e de inteiro (`(int) $post->post_author === $user_id`),
  // e o ator anonimo e `0` — a fila agendada e a publicacao por e-mail gravam
  // assim.
  assert.equal(
    destinoDoSalvamentoAutomatico({
      estadoDoConteudo: ESTADO_DE_RASCUNHO_AUTOMATICO,
      autorDoConteudo: 0,
      atorId: 0,
      travadoPorOutraPessoa: false,
    }),
    'no-proprio-registro',
  );
});

test('CA-11.4 a assimetria entre as duas superficies esta declarada: so o painel reescreve o estado', () => {
  // `wp_autosave()` passa `auto-draft` para `draft` (`wp-admin/includes/post.php:2172`);
  // o controlador REST nao tem essa linha, e o registro continua em
  // `auto-draft` depois do salvamento.
  assert.equal(SUPERFICIES_DO_SALVAMENTO_AUTOMATICO.length, 2);
  assert.deepEqual(
    SUPERFICIES_DO_SALVAMENTO_AUTOMATICO.map(
      (superficie) => superficie.reescreveORascunhoAutomatico,
    ),
    [true, false],
  );
});

/* ── EFEITO NO BANCO: A SEQUENCIA EXATA DE COMANDOS ───────────────────────── */

test('a abertura do editor emite duas leituras e duas escritas, na ordem do legado', () => {
  // Leitura 1: o `guid` dentro de `wp_insert_post()` (`wp-includes/post.php:5117`).
  // Leitura 2: o `get_post( $post_id )` de `wp-admin/includes/post.php:789`.
  // Escrita 1: o `INSERT`. Escrita 2: o `UPDATE` do `guid`, porque conteudo novo
  // sem `guid` recebe o endereco (`:5119`-`:5121`).
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(c.dados.selecoes.length, 2);
  assert.equal(c.dados.escritas.length, 2);
  assert.match(c.dados.escritas[0]?.texto ?? '', /^INSERT INTO/);
  assert.match(c.dados.escritas[1]?.texto ?? '', /^UPDATE/);
  assert.equal(colunaEscrita(c, 1, 'guid'), ENDERECO);
  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
});

test('a linha devolvida e a lida depois da gravacao, e nao o pedido', () => {
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post');

  assert.equal(resultado.gravado?.id, ID_GERADO);
  assert.equal(resultado.gravado?.estado, ESTADO_DE_RASCUNHO_AUTOMATICO);
  assert.equal(resultado.gravado?.titulo, TITULO_DO_RASCUNHO_AUTOMATICO);
  assert.equal(resultado.gravado?.corpo, '');
});
