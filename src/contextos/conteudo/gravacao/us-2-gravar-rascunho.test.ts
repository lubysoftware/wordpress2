/**
 * Testes da entrega de **T005**: *"o comportamento de US-2 existe e os criterios
 * CA-2.1, CA-2.2, CA-2.3 passam contra o sistema novo"*.
 *
 * **Nao sao os quatro testes de `backlog/tests.md`** — UT-020-1 a UT-020-4 sao
 * **T006**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles.
 *
 * E por isso que a porta de dados daqui **registra comando** em vez de simular
 * banco: o que se tem de afirmar e qual comando sai, com quais parametros e com
 * quais bytes — inclusive o caso em que o legado **nao emite comando nenhum**,
 * que aqui sao os tres desfechos de falha.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  ddlDeConteudo,
  type RepositorioDeConteudo,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  ESTADO_PADRAO_DA_APLICACAO,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
} from '../estado-editorial.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  aplicarDefaultsDoPedido,
  ERROS_DA_GRAVACAO,
  ESTADOS_DE_DATA_FLUTUANTE,
  ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
  ESTADO_DE_COMENTARIO_NA_ATUALIZACAO,
  gravarConteudo,
  resolverEstadoNaGravacao,
  type ColunasDaGravacao,
  type ContextoDeGravacao,
  type GanchosDaGravacao,
  type PedidoDeGravacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_GERADO = 7;
const ID_EXISTENTE = 42;
const ENDERECO = `https://exemplo.test/?p=${ID_GERADO}`;

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** `current_time( 'mysql', true )` — o mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';

/*
  As duas conversoes do cenario devolvem data VALIDA e distinguivel, em vez de
  uma marca textual, e isso e afirmacao sobre a ordem: `wp_resolve_post_date()`
  **valida o resultado** de `get_date_from_gmt()` (`:5528` antes de `:5536`),
  logo uma marca que nao parecesse data reprovaria no calendario e a gravacao
  nao aconteceria. Quem trocar estes valores por marcas de texto ve o teste da
  data informada so em GMT virar `data-invalida` — que e, ele mesmo, o
  comportamento do legado.
*/

/** O que `get_date_from_gmt()` devolve neste cenario. */
const DATA_CONVERTIDA_PARA_LOCAL = '2001-01-01 01:01:01';
/** O que `get_gmt_from_date()` devolve neste cenario. */
const DATA_CONVERTIDA_PARA_UTC = '2002-02-02 02:02:02';

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_EXISTENTE,
    post_author: 3,
    post_date: '2026-10-01 09:00:00',
    post_date_gmt: '2026-10-01 12:00:00',
    post_content: 'corpo anterior',
    post_title: 'titulo anterior',
    post_excerpt: '',
    post_status: 'publish',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo-anterior',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-01 09:00:00',
    post_modified_gmt: '2026-10-01 12:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: 'https://exemplo.test/?p=42',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDeGravacao;
  readonly dados: PortaDeDadosFalsa;
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  readonly ganchos: GanchosDaGravacao;
}

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  /** A linha que toda leitura devolve. `null` responde vazio. */
  readonly linha?: LinhaDeResultado | null;
  /** Quantas leituras a porta responde. A atualizacao faz **quatro**. */
  readonly leituras?: number;
  readonly suportaRecurso?: (tipo: string, recurso: string) => boolean;
  readonly estadoPadraoDeComentario?: string;
  readonly endereco?: string | false;
  readonly idGerado?: number;
  readonly filtrarCorpoVazio?: (
    corpoVazio: boolean,
    pedido: PedidoDeGravacao,
  ) => unknown;
  readonly filtrarDataValida?: (valida: boolean, data: string) => unknown;
  readonly filtrarPaiDoConteudo?: (paiId: number) => number;
  readonly filtrarDadosDoConteudo?: (
    dados: ColunasDaGravacao,
    pedido: PedidoDeGravacao,
  ) => ColunasDaGravacao;
  readonly filtrarDadosDoAnexo?: (dados: ColunasDaGravacao) => ColunasDaGravacao;
}

function ator(contaId: number, login = 'autora'): AtorDeAutorizacao {
  return { contaId, login, existe: true, concessoes: [] };
}

/*
  ── OS COLABORADORES QUE T007 ACRESCENTOU A ESTE CONTEXTO ──────────────────

  US-3 fez o caminho de gravacao atravessar a formatacao de texto, a reescrita de
  endereco e a autorizacao, e por isso `ContextoDeGravacao` cresceu. Os dubles
  abaixo existem para que os 34 testes desta suite continuem afirmando **o que
  eles afirmam** — o estado resolvido na coluna, as quatro datas e a ordem dos
  pontos de extensao —, e nao para afirmar nada sobre o identificador na URL:
  **a regra dele tem suite propria**, `us-3-identificador-unico.test.ts`, que
  usa a porta de dados crua e confere o texto de cada consulta.
*/

/**
 * `sanitize_title()` reduzida ao que esta suite precisa: caixa baixa, espaco e
 * sublinhado virando hifen, o resto do que nao e letra, digito ou hifen caindo
 * fora, e a reserva quando sobra vazio.
 *
 * ⚠️ **Nao e a funcao do legado**, e nao tenta ser: a de verdade tem 80 linhas,
 * preserva octeto escapado e apaga 30 sequencias percent-codificadas — ver o
 * aviso em `identificador-na-url.ts`. Aqui ela so precisa ser **deterministica**
 * e reconhecivel, porque nenhuma afirmacao desta suite e sobre o texto dela.
 */
const TEXTO_DO_IDENTIFICADOR = {
  sanitizarTitulo(titulo: string, reserva: string): string {
    const sanitizado = titulo
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return sanitizado === '' ? reserva : sanitizado;
  },
  codificarEmUtf8NaUrl(texto: string, tamanho: number): string {
    return texto.slice(0, tamanho);
  },
};

/** `$wp_rewrite` e `permalink_structure` com os valores de fabrica do legado. */
const REESCRITA_DE_FABRICA = {
  feeds: () => ['feed', 'rdf', 'rss', 'rss2', 'atom'],
  baseDePaginacao: () => 'page',
  estruturaDeLinks: () => '',
};

/**
 * O repositorio de T002, com as **tres** consultas de unicidade respondendo
 * *"livre"*.
 *
 * A porta falsa responde por **fila**, na ordem em que as leituras chegam, e nao
 * por consulta: deixar as consultas de unicidade na fila faria cada gravacao de
 * estado publicado consumir as linhas programadas para as leituras de
 * `get_post()` e produzir sufixo numerico onde esta suite nao afirma nenhum. O
 * resto do repositorio e o de verdade, e toda escrita continua saindo pela porta
 * falsa e sendo conferida la.
 */
function repositorioSemColisaoDeIdentificador(
  dados: PortaDeDadosFalsa,
): RepositorioDeConteudo {
  return {
    ...criarRepositorioDeConteudo(dados.porta),
    identificadorDeAnexoEmUso: () => null,
    identificadorHierarquicoEmUso: () => null,
    identificadorPlanoEmUso: () => null,
  };
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: {
      linhasAfetadas: 1,
      idGerado: opcoes.idGerado ?? ID_GERADO,
    },
  });
  const linha = opcoes.linha === undefined ? linhaDeConteudo() : opcoes.linha;
  for (let i = 0; i < (opcoes.leituras ?? 4); i += 1) {
    dados.responder(linha === null ? [] : [linha]);
  }

  const pontos: string[] = [];

  // Os seis pontos deste caminho sao registrados, e cada um anota o proprio
  // nome: e a sequencia que a Decisao 2 compara (*"a ordem de emissao deles"*).
  const ganchos: GanchosDaGravacao = {
    filtrarCorpoVazio(corpoVazio, pedido) {
      pontos.push('wp_insert_post_empty_content');
      return opcoes.filtrarCorpoVazio === undefined
        ? corpoVazio
        : opcoes.filtrarCorpoVazio(corpoVazio, pedido);
    },
    filtrarDataValida(valida, data) {
      pontos.push('wp_checkdate');
      return opcoes.filtrarDataValida === undefined
        ? valida
        : opcoes.filtrarDataValida(valida, data);
    },
    filtrarPaiDoConteudo(paiId) {
      pontos.push('wp_insert_post_parent');
      return opcoes.filtrarPaiDoConteudo === undefined
        ? paiId
        : opcoes.filtrarPaiDoConteudo(paiId);
    },
    filtrarDadosDoConteudo(colunas, pedido) {
      pontos.push('wp_insert_post_data');
      return opcoes.filtrarDadosDoConteudo === undefined
        ? colunas
        : opcoes.filtrarDadosDoConteudo(colunas, pedido);
    },
    filtrarDadosDoAnexo(colunas) {
      pontos.push('wp_insert_attachment_data');
      return opcoes.filtrarDadosDoAnexo === undefined
        ? colunas
        : opcoes.filtrarDadosDoAnexo(colunas);
    },
    antesDeAtualizar() {
      pontos.push('pre_post_update');
    },
    antesDeInserir() {
      pontos.push('pre_post_insert');
    },
  };

  const contexto: ContextoDeGravacao = {
    ator: opcoes.ator ?? ator(3),
    base: { matriz: [], rede: REDE_INATIVA_NA_AUTORIZACAO },
    armazenamento: { conteudo: repositorioSemColisaoDeIdentificador(dados) },
    texto: TEXTO_DO_IDENTIFICADOR,
    reescrita: REESCRITA_DE_FABRICA,
    // `get_post_type_object()`: o tipo existe e declara o slot de publicar. Esta
    // suite nao grava `pending`, logo o passo 10 nao pergunta nada — a decisao
    // de capacidade do identificador tem suite propria (US-3).
    tipoDeConteudo: (nome) => ({
      nome,
      traduzMetaCapacidade: true,
      capacidades: { publish_posts: 'publish_posts' },
    }),
    // `is_post_type_hierarchical()`: nenhum tipo desta suite e hierarquico, logo
    // a unicidade cai no ramo plano.
    tipoEHierarquico: () => false,
    datas: {
      agoraNoFusoDoSite() {
        return AGORA_LOCAL;
      },
      agoraEmUtc() {
        return AGORA_UTC;
      },
      // Valores fixos e distinguiveis, para que o teste afirme **qual** das
      // quatro funcoes de data respondeu por cada coluna — ver a nota acima.
      deUtcParaOFusoDoSite() {
        return DATA_CONVERTIDA_PARA_LOCAL;
      },
      doFusoDoSiteParaUtc() {
        return DATA_CONVERTIDA_PARA_UTC;
      },
    },
    suportaRecurso: opcoes.suportaRecurso ?? (() => true),
    estadoPadraoDeComentario() {
      return opcoes.estadoPadraoDeComentario ?? 'open';
    },
    enderecoDoConteudo() {
      return opcoes.endereco === undefined ? ENDERECO : opcoes.endereco;
    },
    ganchos,
  };

  return { contexto, dados, pontos, ganchos };
}

/** O texto de uma escrita com os parametros ao lado, para afirmar bytes. */
function escrita(
  dados: PortaDeDadosFalsa,
  indice: number,
): { texto: string; parametros: string[] } {
  const consulta = dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${indice}`);
  return {
    texto: consulta.texto,
    parametros: consulta.parametros.map(textoDoParametro),
  };
}

/**
 * O valor que **uma coluna nomeada** recebeu no comando, lido do proprio SQL.
 *
 * Por nome, e nao por posicao, porque o que se afirma e o valor da coluna; a
 * **ordem** das colunas e afirmada uma vez, por extenso, no primeiro teste.
 */
function valorGravado(
  dados: PortaDeDadosFalsa,
  indice: number,
  coluna: string,
): string {
  const { texto, parametros } = escrita(dados, indice);
  const colunas = texto.startsWith('INSERT')
    ? (texto.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ')
    : (texto.match(/SET (.*) WHERE/)?.[1] ?? '')
        .split(', ')
        .map((atribuicao) => atribuicao.replace(' = ?', ''));

  const posicao = colunas.indexOf(coluna);
  assert.ok(posicao >= 0, `a coluna ${coluna} nao esta no comando: ${texto}`);
  return parametros[posicao] ?? '';
}

/* ── CA-2.1: SEM ESTADO INFORMADO, RASCUNHO ────────────────────────────────── */

test('CA-2.1 o estado omitido grava draft, com um INSERT e as 21 colunas na ordem do legado', () => {
  const { contexto, dados } = cenario();

  const resultado = gravarConteudo(contexto, { titulo: 'um titulo' });

  assert.equal(resultado.desfecho, 'inserido');
  assert.equal(resultado.conteudoId, ID_GERADO);
  assert.equal(resultado.erro, null);
  assert.equal(resultado.estadoAnterior, ESTADO_ANTERIOR_DE_CONTEUDO_NOVO);

  // O valor que foi para a coluna — CA-2.1.
  assert.equal(resultado.colunas?.post_status, 'draft');
  assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');

  // A ordem das 21 colunas e a do `compact()` de `wp-includes/post.php:4912`,
  // e ela e observavel: a area 3 da Decisao 2 compara a sequencia de comandos.
  assert.equal(
    escrita(dados, 0).texto,
    'INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, ' +
      'post_content_filtered, post_title, post_excerpt, post_status, post_type, ' +
      'comment_status, ping_status, post_password, post_name, to_ping, pinged, ' +
      'post_modified, post_modified_gmt, post_parent, menu_order, post_mime_type, guid) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
});

test("CA-2.1 a cadeia vazia, o zero e a cadeia '0' tambem gravam draft (o empty() do PHP)", () => {
  // `empty( $postarr['post_status'] )` (`:4703`). O caso do `'0'` e o que
  // divergiria de `??` neste runtime — ver `verdade-de-php.ts`.
  for (const estado of ['', '0'] as const) {
    const { contexto, dados } = cenario();
    const resultado = gravarConteudo(contexto, { titulo: 't', estado });

    assert.equal(resultado.colunas?.post_status, 'draft');
    assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');
  }
});

test('CA-2.1 o estado informado vai para a coluna como veio, inclusive fora dos 12 de fabrica', () => {
  // O legado nao valida a coluna: `varchar(20)` sem `ENUM` e sem `CHECK`
  // (`DB-ENUM`), e `register_post_status()` e ponto de extensao publico (P2).
  for (const estado of ['publish', 'pending', 'estado-de-terceiro']) {
    const { contexto, dados } = cenario();
    gravarConteudo(contexto, { titulo: 't', estado });

    assert.equal(valorGravado(dados, 0, 'post_status'), estado);
  }
});

test('CA-2.1 o anexo sem estado grava inherit, e nao draft (BR-MIGRAR-002)', () => {
  const { contexto, dados } = cenario();

  // `:4705`: `draft` nao esta na lista preservada, logo o anexo e reescrito. A
  // ordem dos dois passos e observavel — ver `estado-na-gravacao.ts`.
  gravarConteudo(contexto, { titulo: 't', tipo: 'attachment' });
  assert.equal(valorGravado(dados, 0, 'post_status'), 'inherit');

  // E os quatro estados preservados passam intactos.
  for (const estado of ['inherit', 'private', 'trash', 'auto-draft']) {
    const outro = cenario();
    gravarConteudo(outro.contexto, {
      titulo: 't',
      tipo: 'attachment',
      estado,
    });
    assert.equal(valorGravado(outro.dados, 0, 'post_status'), estado);
  }
});

test('CA-2.1 o rascunho grava a sentinela em post_date_gmt, e a data local em post_date', () => {
  const { contexto, dados } = cenario();

  const resultado = gravarConteudo(contexto, { titulo: 't' });

  // `:4769` — sem data informada, `wp_resolve_post_date()` cai em
  // `current_time( 'mysql' )`.
  assert.equal(valorGravado(dados, 0, 'post_date'), AGORA_LOCAL);
  // `:4780` — `draft` tem `date_floating`, logo a coluna GMT fica na sentinela.
  assert.equal(valorGravado(dados, 0, 'post_date_gmt'), DATA_SENTINELA);
  assert.ok(ESTADOS_DE_DATA_FLUTUANTE.includes('draft'));
  // `:4793` — na insercao, a modificacao copia as duas datas do conteudo.
  assert.equal(valorGravado(dados, 0, 'post_modified'), AGORA_LOCAL);
  assert.equal(valorGravado(dados, 0, 'post_modified_gmt'), DATA_SENTINELA);

  assert.equal(resultado.colunas?.post_date_gmt, DATA_SENTINELA);
});

test('CA-2.1 estado sem data flutuante converte a data para UTC, em vez da sentinela', () => {
  const { contexto, dados } = cenario();

  gravarConteudo(contexto, { titulo: 't', estado: 'publish' });

  // `:4781` — `get_gmt_from_date( $post_date )`, e nao a sentinela.
  assert.equal(
    valorGravado(dados, 0, 'post_date_gmt'),
    DATA_CONVERTIDA_PARA_UTC,
  );
});

test('CA-2.1 a data informada so em GMT volta pelo fuso do site (get_date_from_gmt)', () => {
  const { contexto, dados } = cenario();

  gravarConteudo(contexto, {
    titulo: 't',
    dataGmt: '2026-12-25 00:00:00',
  });

  // `:5528` — o ramo 2 de `wp_resolve_post_date()`.
  assert.equal(
    valorGravado(dados, 0, 'post_date'),
    DATA_CONVERTIDA_PARA_LOCAL,
  );
  // E a coluna GMT recebe o valor informado, sem conversao e sem validacao
  // (`:4786`) — inclusive num estado de data flutuante.
  assert.equal(valorGravado(dados, 0, 'post_date_gmt'), '2026-12-25 00:00:00');
});

/* ── CA-2.2: NAO EXISTE CAMINHO EM QUE A OMISSAO PUBLIQUE ──────────────────── */

test('CA-2.2 as duas barreiras do legado existem, e as duas respondem draft', () => {
  // 1ª barreira: o arranjo de defaults (`:4612`), que preenche a chave ausente.
  assert.equal(aplicarDefaultsDoPedido(cenario().contexto, {}).estado, 'draft');

  // 2ª barreira: o `empty()` (`:4703`), que pega a chave presente e vazia.
  assert.equal(resolverEstadoNaGravacao('post', ''), 'draft');
  assert.equal(resolverEstadoNaGravacao('post', undefined), 'draft');

  // E o valor das duas e a constante que T001 declarou, nao um literal novo.
  assert.equal(ESTADO_PADRAO_DA_APLICACAO, 'draft');
});

test('CA-2.2 nenhum valor vazio produz publish: a varredura dos cinco', () => {
  // Os cinco vazios que o pedido pode carregar, inclusive os dois que este
  // runtime trataria como presentes.
  const vazios: readonly (string | undefined)[] = ['', '0', undefined];

  for (const estado of vazios) {
    const { contexto, dados } = cenario();
    const pedido: PedidoDeGravacao =
      estado === undefined ? { titulo: 't' } : { titulo: 't', estado };

    const resultado = gravarConteudo(contexto, pedido);

    assert.notEqual(resultado.colunas?.post_status, 'publish');
    assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');
  }
});

test('CA-2.2 toda escrita informa post_status: a coluna nunca cai no default do DDL', () => {
  // A omissao que o DDL atende e a insercao **direta na tabela**, e ela nao e
  // metodo de repositorio nenhum: o caminho de aplicacao escreve as 21 colunas
  // sempre. Insercao...
  const insercao = cenario();
  gravarConteudo(insercao.contexto, { titulo: 't' });
  assert.ok(escrita(insercao.dados, 0).texto.includes('post_status'));

  // ... e atualizacao.
  const atualizacao = cenario();
  gravarConteudo(atualizacao.contexto, { id: ID_EXISTENTE, titulo: 't' });
  assert.ok(escrita(atualizacao.dados, 0).texto.includes('post_status = ?'));

  // E a divergencia de BR-MIGRAR-001 continua existindo nas duas metades: o DDL
  // de T002 carrega `publish`, e o caminho de aplicacao grava `draft`.
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, 'publish');
  assert.notEqual(ESTADO_PADRAO_DA_APLICACAO, ESTADO_PADRAO_DO_ARMAZENAMENTO);
  assert.ok(
    ddlDeConteudo(cenario().dados.porta, { clausulaDeCharset: '' }).includes(
      "post_status varchar(20) NOT NULL default 'publish'",
    ),
  );
});

test('CA-2.2 atualizar sem informar o estado grava draft, e nao conserva o publicado', () => {
  // ⚠️ `wp_insert_post()` **nao** conserva o estado da linha: quem conserva e a
  // mistura de `wp_update_post()` (`:5366`), que nao e desta tarefa. Atualizar
  // por esta porta sem informar o estado **rebaixa** o publicado para rascunho
  // — e e o que o legado faz.
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ post_status: 'publish' }),
  });

  const resultado = gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 't' });

  assert.equal(resultado.desfecho, 'atualizado');
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');
  // A omissao nao publica em nenhuma direcao: ela nunca **passa** a publish.
  assert.notEqual(valorGravado(dados, 0, 'post_status'), 'publish');
});

test('CA-2.2 quem publica na omissao e um interceptador, e isso e contrato (P2)', () => {
  // O ponto `wp_insert_post_data` **pode** mudar a coluna, e o legado grava o
  // que ele devolver (`:4978`-`:4980`). O criterio fala da omissao do pedido,
  // nao do poder do ponto de extensao: estreita-lo aqui quebraria o contrato
  // que o P2 poe em *Nao negociavel*.
  const { contexto, dados } = cenario({
    filtrarDadosDoConteudo: (colunas) => ({
      ...colunas,
      post_status: 'publish',
    }),
  });

  const resultado = gravarConteudo(contexto, { titulo: 't' });

  assert.equal(valorGravado(dados, 0, 'post_status'), 'publish');
  // E o resultado devolve o que foi gravado, nao o que foi resolvido.
  assert.equal(resultado.colunas?.post_status, 'publish');
});

/* ── CA-2.3: RASCUNHO FORA DE TODA CONSULTA PUBLICA ────────────────────────── */

test('CA-2.3 o estado gravado nao e publico nem consultavel pelo publico', () => {
  const { contexto } = cenario();

  const resultado = gravarConteudo(contexto, { titulo: 't' });

  // A consulta publica e BC-08 (feature 004, T009 — *"o portao de
  // `post_status`"*). O que esta tarefa entrega e a linha em condicao de **nao**
  // ser encontrada por ela: o estado gravado e `draft`, e o registro de `draft`
  // declara `protected` sem `public` nem `publicly_queryable`
  // (`wp-includes/post.php:689`).
  assert.equal(resultado.colunas?.post_status, 'draft');
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.publico, false);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.consultavelPeloPublico,
    false,
  );
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.protegido, true);
});

test('CA-2.3 nenhuma escrita posterior deste caminho muda o estado da linha', () => {
  // *"Nenhuma transicao para publicado acontece por efeito colateral"* — o
  // segundo cenario de `02-publicacao-e-agendamento-de-conteudo.feature`. As
  // escritas deste caminho sao duas, e a segunda toca **uma** coluna.
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ ID: ID_GERADO, guid: '' }),
  });

  gravarConteudo(contexto, { titulo: 't' });

  assert.equal(dados.escritas.length, 2);
  assert.equal(
    escrita(dados, 1).texto,
    'UPDATE wp_posts SET guid = ? WHERE ID = ?',
  );
  assert.deepEqual(escrita(dados, 1).parametros, [ENDERECO, String(ID_GERADO)]);
});

/* ── OS TRES DESFECHOS EM QUE NADA E GRAVADO ───────────────────────────────── */

test('o corpo vazio nao grava nada, e o erro e o do legado', () => {
  const { contexto, dados, pontos } = cenario();

  // `:4673`-`:4699`: titulo, corpo e resumo vazios num tipo que suporta os
  // tres. O `'0'` conta como vazio tambem aqui (`! $post_content`).
  const resultado = gravarConteudo(contexto, { corpo: '0' });

  assert.equal(resultado.desfecho, 'corpo-vazio');
  assert.equal(resultado.conteudoId, 0);
  assert.deepEqual(resultado.erro, ERROS_DA_GRAVACAO.corpoVazio);
  assert.equal(resultado.erro?.codigo, 'empty_content');
  assert.equal(resultado.erro?.mensagem, 'Content, title, and excerpt are empty.');
  assert.deepEqual(dados.escritas, []);
  // O ponto que decide isso dispara; nenhum dos posteriores dispara.
  assert.deepEqual(pontos, ['wp_insert_post_empty_content']);
});

test('o tipo que nao suporta os tres recursos grava corpo vazio, e o anexo escapa', () => {
  // `:4675`-`:4677`: as tres perguntas sao conjuntivas, logo um tipo que nao
  // declare `excerpt` grava a linha vazia.
  const semResumo = cenario({
    suportaRecurso: (_tipo, recurso) => recurso !== 'excerpt',
  });
  assert.equal(gravarConteudo(semResumo.contexto, {}).desfecho, 'inserido');

  // E o anexo esta fora da condicao por tipo (`:4673`).
  const anexo = cenario();
  assert.equal(
    gravarConteudo(anexo.contexto, { tipo: 'attachment' }).desfecho,
    'inserido',
  );
});

test('o filtro do corpo vazio decide, e le a verdade de PHP do que devolveu', () => {
  // Devolver `'0'` e devolver falso no PHP, logo a gravacao **acontece**.
  const liberado = cenario({ filtrarCorpoVazio: () => '0' });
  assert.equal(gravarConteudo(liberado.contexto, {}).desfecho, 'inserido');

  // E devolver qualquer verdade curto-circuita, mesmo com conteudo.
  const bloqueado = cenario({ filtrarCorpoVazio: () => 'sim' });
  const resultado = gravarConteudo(bloqueado.contexto, { titulo: 'cheio' });
  assert.equal(resultado.desfecho, 'corpo-vazio');
  assert.deepEqual(bloqueado.dados.escritas, []);
});

test('a data invalida nao grava nada, e o filtro wp_checkdate pode decidir por ela', () => {
  const { contexto, dados } = cenario();

  // `:4771`-`:4777` com `:5542`: 31 de fevereiro reprova no calendario.
  const resultado = gravarConteudo(contexto, {
    titulo: 't',
    data: '2026-02-31 10:00:00',
  });

  assert.equal(resultado.desfecho, 'data-invalida');
  assert.equal(resultado.conteudoId, 0);
  assert.equal(resultado.erro?.codigo, 'invalid_date');
  assert.equal(resultado.erro?.mensagem, 'Invalid date.');
  assert.deepEqual(dados.escritas, []);

  // O interceptador pode aceitar a data que o calendario recusou — e o que faz
  // dele filtro, e nao detalhe interno.
  const aceita = cenario({ filtrarDataValida: () => true });
  const comFiltro = gravarConteudo(aceita.contexto, {
    titulo: 't',
    data: '2026-02-31 10:00:00',
  });
  assert.equal(comFiltro.desfecho, 'inserido');
  assert.equal(valorGravado(aceita.dados, 0, 'post_date'), '2026-02-31 10:00:00');
});

test('o identificador informado sem linha devolve invalid_post e nao grava', () => {
  const { contexto, dados, pontos } = cenario({ linha: null });

  const resultado = gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 't' });

  // `:4646`-`:4651`.
  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.conteudoId, 0);
  assert.deepEqual(resultado.erro, ERROS_DA_GRAVACAO.conteudoInexistente);
  assert.equal(resultado.atualizacao, true);
  assert.deepEqual(dados.escritas, []);
  // A recusa acontece antes de qualquer ponto de extensao.
  assert.deepEqual(pontos, []);
  // E uma leitura so: o legado volta antes das outras duas.
  assert.equal(dados.selecoes.length, 1);
});

test('gravar com ID igual a zero insere, porque no legado zero e ausencia', () => {
  const { contexto, dados } = cenario();

  // `! empty( $postarr['ID'] )` (`:4639`).
  const resultado = gravarConteudo(contexto, { id: 0, titulo: 't' });

  assert.equal(resultado.desfecho, 'inserido');
  assert.ok(escrita(dados, 0).texto.startsWith('INSERT'));
});

/* ── A ORDEM DOS PONTOS, QUE E O CENARIO DE PARIDADE DESTE CAMINHO ─────────── */

test('a ordem dos pontos deste caminho e a do legado, na insercao', () => {
  const { contexto, pontos } = cenario();

  gravarConteudo(contexto, { titulo: 't' });

  // `:4695`, `:5542`, `:4868`, `:4978` e `:5025`. O cenario
  // `@ordem-de-emissao` de `PT-002` compara exatamente esta sequencia.
  assert.deepEqual(pontos, [
    'wp_insert_post_empty_content',
    'wp_checkdate',
    'wp_insert_post_parent',
    'wp_insert_post_data',
    'pre_post_insert',
  ]);
});

test('a atualizacao troca o ultimo ponto, e so ele', () => {
  const { contexto, pontos } = cenario();

  gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 't' });

  // `:4993` em lugar de `:5025`.
  assert.deepEqual(pontos, [
    'wp_insert_post_empty_content',
    'wp_checkdate',
    'wp_insert_post_parent',
    'wp_insert_post_data',
    'pre_post_update',
  ]);
});

test('o anexo passa pelo filtro de dados do anexo, e nao pelo do conteudo', () => {
  const { contexto, pontos } = cenario();

  gravarConteudo(contexto, { titulo: 't', tipo: 'attachment' });

  // `:4947` contra `:4978`: sao dois pontos, e o `if` que escolhe e por tipo.
  assert.ok(pontos.includes('wp_insert_attachment_data'));
  assert.ok(!pontos.includes('wp_insert_post_data'));
});

test('os dois pontos que recebem o pedido veem o estado COMO ELE CHEGOU, nao resolvido', () => {
  // `wp_parse_args()` preenche chave ausente e o `empty()` de `:4703` trabalha
  // numa variavel local: o arranjo que chega aos pontos conserva o `''`. E a
  // metade *"o valor que cada ponto recebe e identico byte a byte"* do cenario
  // `@ordem-de-emissao` de `PT-002`.
  const vistos: {
    noCorpoVazio?: string | undefined;
    nosDados?: string | undefined;
    colunaGravada?: string | undefined;
  } = {};

  const { contexto } = cenario({
    filtrarCorpoVazio: (corpoVazio, pedido) => {
      vistos.noCorpoVazio = pedido.estado;
      return corpoVazio;
    },
    filtrarDadosDoConteudo: (colunas, pedido) => {
      vistos.nosDados = pedido.estado;
      vistos.colunaGravada = colunas.post_status;
      return colunas;
    },
  });

  gravarConteudo(contexto, { titulo: 't', estado: '' });

  assert.equal(vistos.noCorpoVazio, '');
  assert.equal(vistos.nosDados, '');
  // E a coluna, que e o primeiro argumento do segundo ponto, ja vem resolvida.
  assert.equal(vistos.colunaGravada, 'draft');
});

test('o anexo chega aos pontos com draft no pedido, e inherit na coluna', () => {
  // A mesma assimetria no caso de BR-MIGRAR-002: a reescrita para `inherit`
  // acontece na variavel local (`:4706`), nao no arranjo.
  const vistos: { pedido?: string | undefined; coluna?: string | undefined } = {};

  const { contexto } = cenario({
    filtrarDadosDoAnexo: (colunas) => {
      vistos.coluna = colunas.post_status;
      return colunas;
    },
    filtrarCorpoVazio: (corpoVazio, pedido) => {
      vistos.pedido = pedido.estado;
      return corpoVazio;
    },
  });

  gravarConteudo(contexto, { titulo: 't', tipo: 'attachment' });

  assert.equal(vistos.pedido, 'draft');
  assert.equal(vistos.coluna, 'inherit');
});

/* ── OS CAMPOS CUJA PERGUNTA NAO E `empty()` ───────────────────────────────── */

test('atualizar sem informar comment_status FECHA os comentarios', () => {
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ comment_status: 'open' }),
  });

  // `:4812`-`:4820`: na atualizacao o vazio cai no literal `closed`; na
  // insercao, no default do tipo.
  gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 't' });
  assert.equal(
    valorGravado(dados, 0, 'comment_status'),
    ESTADO_DE_COMENTARIO_NA_ATUALIZACAO,
  );

  const insercao = cenario({ estadoPadraoDeComentario: 'open' });
  gravarConteudo(insercao.contexto, { titulo: 't' });
  assert.equal(valorGravado(insercao.dados, 0, 'comment_status'), 'open');

  // E `ping_status` **nao** tem o ramo de atualizacao: a assimetria e do legado
  // (`:4825`).
  assert.equal(valorGravado(dados, 0, 'ping_status'), 'open');
});

test('o estado private apaga a senha do conteudo', () => {
  const { contexto, dados } = cenario();

  // `:4841`-`:4843`.
  gravarConteudo(contexto, {
    titulo: 't',
    estado: 'private',
    senha: 'segredo',
  });
  assert.equal(valorGravado(dados, 0, 'post_password'), '');

  // Em qualquer outro estado a senha vai como veio — texto claro, que
  // BR-MIGRAR-044 poe como regra do produto.
  const rascunho = cenario();
  gravarConteudo(rascunho.contexto, { titulo: 't', senha: 'segredo' });
  assert.equal(valorGravado(rascunho.dados, 0, 'post_password'), 'segredo');
});

test('o autor omitido e o ator da requisicao, e dois atores nao se misturam', () => {
  // `:4824`, e o cenario `@concorrencia` de `PT-002`: *"a autoria gravada em
  // cada conteudo corresponde a quem o gravou"*. Nada e guardado em estado de
  // modulo, logo a ordem das chamadas nao muda nenhuma delas.
  const primeira = cenario({ ator: ator(11) });
  const segunda = cenario({ ator: ator(22) });

  gravarConteudo(primeira.contexto, { titulo: 't' });
  gravarConteudo(segunda.contexto, { titulo: 't' });

  assert.equal(valorGravado(primeira.dados, 0, 'post_author'), '11');
  assert.equal(valorGravado(segunda.dados, 0, 'post_author'), '22');

  // O ator anonimo grava `0`, que e o que o legado grava fora de requisicao
  // autenticada — e orfao e estado normal (P5).
  const anonimo = cenario({ ator: ATOR_ANONIMO });
  gravarConteudo(anonimo.contexto, { titulo: 't' });
  assert.equal(valorGravado(anonimo.dados, 0, 'post_author'), '0');

  // E o autor informado vence o ator.
  const informado = cenario({ ator: ator(11) });
  gravarConteudo(informado.contexto, { titulo: 't', autorId: 99 });
  assert.equal(valorGravado(informado.dados, 0, 'post_author'), '99');
});

test('o filtro do pai decide a coluna, e o vinculo e lido pelo tipo da propria linha', () => {
  const { contexto, dados } = cenario({ filtrarPaiDoConteudo: () => 5 });

  gravarConteudo(contexto, { titulo: 't', tipo: 'page', paiId: 0 });

  // `:4868`: o valor devolvido pelo ponto e o que vai para a coluna, e e ele
  // que a prevencao de laco de hierarquia usa — ela **nao** esta no nucleo.
  assert.equal(valorGravado(dados, 0, 'post_parent'), '5');
});

test('o identificador sugerido entra na coluna ID quando livre, e e ignorado quando ocupado', () => {
  // `:5009`-`:5015`. A porta responde vazio na primeira leitura, logo o
  // identificador esta livre.
  const livre = cenario({ linha: null });
  const resultado = gravarConteudo(livre.contexto, { titulo: 't', idSugerido: 90 });

  assert.ok(escrita(livre.dados, 0).texto.startsWith('INSERT INTO wp_posts (ID, '));
  assert.equal(resultado.conteudoId, 90);

  // Ocupado: a consulta devolve linha, e o legado deixa o banco gerar.
  const ocupado = cenario({ linha: linhaDeConteudo({ ID: 90 }) });
  const comId = gravarConteudo(ocupado.contexto, { titulo: 't', idSugerido: 90 });

  assert.ok(
    escrita(ocupado.dados, 0).texto.startsWith('INSERT INTO wp_posts (post_author, '),
  );
  assert.equal(comId.conteudoId, ID_GERADO);
});

test('o guid vazio do conteudo novo recebe o endereco; o da atualizacao nao e tocado', () => {
  // `:5117`-`:5121`, e o `false` de `get_permalink()` coagido a cadeia vazia,
  // como em `../publicacao/transicao-de-estado.ts`.
  const semEndereco = cenario({
    linha: linhaDeConteudo({ ID: ID_GERADO, guid: '' }),
    endereco: false,
  });
  const resultado = gravarConteudo(semEndereco.contexto, { titulo: 't' });
  assert.equal(resultado.enderecoGravadoNoGuid, '');
  assert.deepEqual(escrita(semEndereco.dados, 1).parametros, ['', String(ID_GERADO)]);

  // Conteudo novo que ja trouxe `guid` nao e tocado.
  const comGuid = cenario({
    linha: linhaDeConteudo({ ID: ID_GERADO, guid: 'https://exemplo.test/ja-tinha' }),
  });
  const trazendo = gravarConteudo(comGuid.contexto, {
    titulo: 't',
    guid: 'https://exemplo.test/ja-tinha',
  });
  assert.equal(trazendo.enderecoGravadoNoGuid, null);
  assert.equal(comGuid.dados.escritas.length, 1);

  // ⚠️ E na atualizacao o `guid` do PEDIDO e descartado: o legado reatribui
  // `$guid` com o valor gravado (`:4653`), logo ninguem muda `guid` por esta
  // porta.
  const atualizacao = cenario();
  const atualizado = gravarConteudo(atualizacao.contexto, {
    id: ID_EXISTENTE,
    titulo: 't',
    guid: 'https://exemplo.test/tentando-trocar',
  });
  assert.equal(atualizado.enderecoGravadoNoGuid, null);
  assert.equal(
    valorGravado(atualizacao.dados, 0, 'guid'),
    'https://exemplo.test/?p=42',
  );
});

test('a atualizacao carimba a modificacao com agora, nas duas colunas', () => {
  const { contexto, dados } = cenario();

  // `:4789`-`:4791`.
  gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 't' });

  assert.equal(valorGravado(dados, 0, 'post_modified'), AGORA_LOCAL);
  assert.equal(valorGravado(dados, 0, 'post_modified_gmt'), AGORA_UTC);
});

test('a atualizacao sem identificador na URL informado conserva o da linha', () => {
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ post_name: 'titulo-anterior' }),
  });

  // `:4666`-`:4671`. ⚠️ O que esta tarefa **nao** faz e derivar o
  // identificador do titulo nem cobrar unicidade: as duas sao T007 (US-3), e a
  // consequencia declarada esta em `campos-na-gravacao.ts`.
  gravarConteudo(contexto, { id: ID_EXISTENTE, titulo: 'outro titulo' });

  assert.equal(valorGravado(dados, 0, 'post_name'), 'titulo-anterior');
});

test('a atualizacao de rascunho faz cinco leituras do legado, e a insercao uma', () => {
  // A tabela de leituras do cabecalho de `gravar.ts`, para **este** pedido: a
  // linha existe, o identificador na URL nao e informado e o estado resolvido e
  // `draft`.
  //
  // ⚠️ **Eram quatro em T005 e sao cinco desde T007**, e a quinta e do legado:
  // o ramo de compatibilidade do passo 11 (`:4755`-`:4758`) le
  // `get_post_field( 'post_name', $post_id )` quando o identificador conservado
  // bate com a sanitizacao antiga — que e o caso desta linha
  // (`titulo-anterior`). A **unicidade nao le nada aqui**, porque `draft`
  // dispensa (CA-3.1): e o mesmo pedido em estado publicado que passa a emitir
  // as consultas de `wp_unique_post_slug()`, e e isso que
  // `us-3-identificador-unico.test.ts` afirma.
  const atualizacao = cenario();
  gravarConteudo(atualizacao.contexto, { id: ID_EXISTENTE, titulo: 't' });
  assert.equal(atualizacao.dados.selecoes.length, 5);
  assert.equal(
    atualizacao.dados.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
  );

  const insercao = cenario();
  gravarConteudo(insercao.contexto, { titulo: 't' });
  assert.equal(insercao.dados.selecoes.length, 1);
});
