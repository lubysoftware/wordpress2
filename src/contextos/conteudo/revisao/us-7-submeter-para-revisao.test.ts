/**
 * Testes da entrega de **T015**: *"o comportamento de US-7 existe e os criterios
 * CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6 passam contra o sistema novo"*.
 *
 * **Nao sao os oito testes de `backlog/tests.md`** — UT-025-1 a UT-025-8 sao
 * **T016**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles — mais
 * um meio que esta pasta acrescenta: as **variaveis de consulta** que a fila do
 * painel entrega, que sao o que ela decide (ver `fila-de-revisao.ts`).
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 *
 * ---
 *
 * # Duas coisas sobre o cenario desta suite
 *
 * **A porta de dados responde por consulta, e nao por fila.** Esta operacao faz
 * seis leituras antes de escrever, e tres delas sao a **mesma** pergunta de
 * capacidade feita tres vezes pelo legado (ver a tabela de leituras em
 * `submeter-para-revisao.ts`). Programar isso por fila seria programar o
 * resultado. A porta daqui responde a partir de uma tabela em memoria e
 * **registra tudo**, de modo que os textos e os parametros de cada comando
 * continuam afirmaveis por extenso.
 *
 * **As tres leituras da autorizacao nao passam por esta porta.** Elas sao de
 * `FonteDeConteudoNaAutorizacao`, que e uma porta de `plataforma/autorizacao/` —
 * declarada embaixo e implementada em cima. Aqui ela le a mesma tabela em
 * memoria, por outro caminho, e por isso `dados.selecoes` conta somente as
 * leituras do **repositorio**.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  type Conteudo,
} from '../armazenamento/index.js';
import { PROPRIEDADES_DO_ESTADO_EDITORIAL } from '../estado-editorial.js';
import type { Consulta, LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import {
  CODIGO_DE_CONTEUDO_INEXISTENTE,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
  CODIGO_DE_RECUSA_DE_EDICAO,
  CODIGO_DE_RECUSA_DE_LEITURA,
  ESTADOS_PUBLICADOS_NA_SUBMISSAO,
  ESTADO_DE_COMENTARIO_NA_SUBMISSAO,
  ITENS_POR_PAGINA_DA_FILA,
  MENSAGEM_DE_RECUSA_DA_FILA,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
  MENSAGEM_DE_RECUSA_DE_EDICAO,
  MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
  MENSAGEM_DE_RECUSA_DE_LEITURA,
  TITULO_DE_RECUSA_DA_FILA,
  autorizarLeituraEmRevisao,
  estadoPedidoPelosBotoes,
  estadoSanitizadoDoPedido,
  filaDeRevisao,
  itensPorPaginaDaFila,
  resolverEstadoDaSubmissao,
  senhaNaSubmissao,
  submeterParaRevisao,
  type ContextoDeRevisao,
  type GanchosDaRevisao,
  type PedidoDeSubmissao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_DO_CONTEUDO = 42;
const ID_DE_OUTRO_CONTEUDO = 43;
const CONTA_DA_COLABORADORA = 3;
const CONTA_DE_OUTRA_PESSOA = 9;
const TIPO_DE_PAGINA = 'page';

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** O mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';
/** A data que a linha do cenario tem gravada, distinguivel de `AGORA_LOCAL`. */
const DATA_ANTIGA = '2026-10-01 09:00:00';

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_CONTEUDO,
    post_author: CONTA_DA_COLABORADORA,
    post_date: DATA_ANTIGA,
    // Rascunho tem data flutuante, logo a coluna GMT fica na sentinela
    // (`wp-includes/post.php:4780`-`:4784`). E e esta sentinela que o
    // `$clear_date` de `wp_update_post()` consulta.
    post_date_gmt: DATA_SENTINELA,
    post_content: 'corpo anterior',
    post_title: 'Meu Texto',
    post_excerpt: '',
    post_status: 'draft',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'meu-texto',
    to_ping: '',
    pinged: '',
    post_modified: DATA_ANTIGA,
    post_modified_gmt: DATA_ANTIGA,
    post_content_filtered: '',
    post_parent: 0,
    guid: `https://exemplo.test/?p=${ID_DO_CONTEUDO}`,
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface PortaDeTeste {
  readonly porta: PortaDeDados;
  readonly selecoes: Consulta[];
  readonly escritas: Consulta[];
}

/**
 * A porta de dados desta suite: responde **por consulta**, de uma tabela em
 * memoria, e registra tudo. Ver a razao no cabecalho.
 */
function porta(
  linhas: readonly LinhaDeResultado[],
  ocupados: readonly string[] = [],
): PortaDeTeste {
  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        selecoes.push(consulta);

        if (consulta.texto.startsWith('SELECT post_name')) {
          const pedido = String(consulta.parametros[0]);
          return ocupados.includes(pedido) ? [{ post_name: pedido }] : [];
        }
        if (consulta.texto.startsWith('SELECT * FROM')) {
          const id = Number(consulta.parametros[0]);
          const linha = linhas.find((candidata) => candidata['ID'] === id);
          return linha === undefined ? [] : [linha];
        }
        // `SELECT ID` — a pergunta do `import_id`, que esta suite nao exercita.
        return [];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return { linhasAfetadas: 1, idGerado: ID_DO_CONTEUDO };
      },
    },
    selecoes,
    escritas,
  };
}

/**
 * Os tipos que o registro deste cenario conhece.
 *
 * Lista fechada de proposito: `get_post_type_object()` devolve `false` para o
 * que nao esta registrado, e e disso que dependem o ramo de `:1249` da fila
 * (tipo desconhecido cai em `post`) e os ramos de erro de `map_meta_cap()`.
 */
const TIPOS_REGISTRADOS: readonly string[] = ['post', TIPO_DE_PAGINA, 'attachment'];

/**
 * Os 15 slots de capacidade que `get_post_type_capabilities()` deriva de
 * `capability_type` (`wp-includes/post.php:1884`).
 *
 * Derivados aqui, e nao escritos a mao, pelo mesmo motivo pelo qual o legado os
 * deriva: e assim que `edit_posts` vira `edit_pages` **sem um unico `if` sobre o
 * nome `page`**, e e dessa derivacao que sai a assimetria que UC-07 descreve —
 * *"nenhuma capacidade de pagina chega a autor ou colaborador"*.
 */
function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao {
  const plural = nome === TIPO_DE_PAGINA ? 'pages' : 'posts';
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: {
      edit_posts: `edit_${plural}`,
      edit_others_posts: `edit_others_${plural}`,
      edit_published_posts: `edit_published_${plural}`,
      edit_private_posts: `edit_private_${plural}`,
      publish_posts: `publish_${plural}`,
      read: 'read',
      read_private_posts: `read_private_${plural}`,
      delete_posts: `delete_${plural}`,
      delete_others_posts: `delete_others_${plural}`,
      delete_published_posts: `delete_published_${plural}`,
      delete_private_posts: `delete_private_${plural}`,
      create_posts: `edit_${plural}`,
      read_post: 'read',
      edit_post: `edit_${plural}`,
      delete_post: `delete_${plural}`,
    },
  };
}

/**
 * A fonte de `map_meta_cap()`, lendo a mesma tabela em memoria.
 *
 * O registro de **estado** sai de `../estado-editorial.ts`, e nao de uma tabela
 * escrita aqui: e o que o README deste modulo manda fazer — *"cada uma das
 * tarefas que precisa responder 'isto aparece em consulta publica?' rederivaria
 * a mesma tabela, e a terceira derivacao divergiria da primeira"*.
 */
function fonteDeConteudo(
  linhas: readonly LinhaDeResultado[],
  tipoConhecido = true,
): FonteDeConteudoNaAutorizacao {
  return {
    conteudo(referencia) {
      const id = typeof referencia === 'number' ? referencia : 0;
      const linha = linhas.find((candidata) => candidata['ID'] === id);
      if (linha === undefined) {
        return null;
      }
      const estado = String(linha['post_status']);
      return {
        id,
        tipo: String(linha['post_type']),
        estado,
        estadoParaLeitura: estado,
        autorId: Number(linha['post_author']),
        paiId: Number(linha['post_parent']),
      };
    },
    tipoDeConteudo: (nome) =>
      tipoConhecido && TIPOS_REGISTRADOS.includes(nome)
        ? tipoRegistrado(nome)
        : null,
    estadoDeConteudo(nome) {
      const propriedades =
        PROPRIEDADES_DO_ESTADO_EDITORIAL[
          nome as keyof typeof PROPRIEDADES_DO_ESTADO_EDITORIAL
        ];
      return propriedades === undefined
        ? null
        : {
            nome,
            publico: propriedades.publico,
            privado: propriedades.privado,
          };
    },
    estadoAnteriorNaLixeira: () => '',
    paginaInicial: () => 0,
    paginaDeConteudos: () => 0,
    paginaDePoliticaDePrivacidade: () => 0,
  };
}

/**
 * Um ator com as capacidades concedidas **individualmente**.
 *
 * Matriz vazia e concessao individual **sao um estado do legado**, e nao atalho
 * de teste: o papel e dado gravado (ADR-0001) e o `allcaps` individual passa por
 * cima dele (`PERM-1`). A regra de dependencia 3 impede esta suite de importar a
 * matriz de fabrica de BC-05, e por isso os conjuntos de fabrica aparecem como
 * **lista de capacidades**, com o papel nomeado em comentario:
 *
 * - colaborador: `edit_posts`, `read`, `delete_posts`;
 * - autor: o do colaborador mais `upload_files`, `edit_published_posts`,
 *   `publish_posts`;
 * - editor: o do autor mais `edit_others_posts`, `read_private_posts` e as 15
 *   de pagina e de conteudo privado.
 */
function atorCom(...capacidades: readonly string[]): AtorDeAutorizacao {
  return {
    contaId: CONTA_DA_COLABORADORA,
    login: 'colaboradora',
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

/** Quem escreve e nao publica — o ator que **define** o caso de UC-06. */
const COLABORADORA = atorCom('edit_posts', 'read', 'delete_posts');

/** Quem escreve e publica o proprio. */
const AUTORA = atorCom(
  'edit_posts',
  'read',
  'delete_posts',
  'edit_published_posts',
  'publish_posts',
  'upload_files',
);

/** Quem publica o alheio. */
const EDITORA = atorCom(
  'edit_posts',
  'read',
  'delete_posts',
  'edit_published_posts',
  'publish_posts',
  'upload_files',
  'edit_others_posts',
  'read_private_posts',
);

const BASE_SEM_PAPEL: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  readonly linhas?: readonly LinhaDeResultado[];
  readonly ocupados?: readonly string[];
  readonly tipoConhecido?: boolean;
  readonly itensPorPaginaDaConta?: number;
  readonly ganchos?: GanchosDaRevisao;
}

interface Cenario {
  readonly contexto: ContextoDeRevisao;
  readonly dados: PortaDeTeste;
  /** As variaveis que a consulta da fila recebeu, na ordem. */
  readonly consultas: unknown[];
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const linhas = opcoes.linhas ?? [linhaDeConteudo()];
  const dados = porta(linhas, opcoes.ocupados ?? []);
  const consultas: unknown[] = [];
  const tipoConhecido = opcoes.tipoConhecido ?? true;

  const contexto: ContextoDeRevisao = {
    ator: opcoes.ator ?? COLABORADORA,
    base: BASE_SEM_PAPEL,
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    fonteDeConteudo: fonteDeConteudo(linhas, tipoConhecido),
    // `sanitize_key()`: caixa baixa, e so letra, digito, `_` e `-` passam. E a
    // reducao do que a funcao de `plataforma/formatacao/` faz, e nenhuma
    // afirmacao desta suite e sobre o texto dela — so sobre quando ela e
    // chamada.
    sanitizarChave: (valor) =>
      valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    consultarConteudo(variaveis) {
      consultas.push(variaveis);
      // O duble de `WP_Query` desta suite: o clausulado dela e **T009 da
      // feature 004**, e o que se reproduz aqui e so o efeito das variaveis que
      // esta tarefa entrega — tipo, estado e ordem — para que o conteudo
      // submetido possa ser visto chegando a fila. Nenhuma afirmacao desta
      // suite e sobre o texto do comando que `WP_Query` emitiria.
      return linhas
        .filter(
          (linha) =>
            String(linha['post_type']) === variaveis.post_type &&
            String(linha['post_status']) === variaveis.post_status,
        )
        .map((linha) => lerLinha(dados, Number(linha['ID'])))
        .filter((conteudo): conteudo is Conteudo => conteudo !== null)
        .sort((esquerda, direita) =>
          esquerda.modificadoEm.localeCompare(direita.modificadoEm),
        )
        .slice(0, variaveis.posts_per_page);
    },
    itensPorPaginaDaConta: () => opcoes.itensPorPaginaDaConta ?? 0,
    texto: {
      sanitizarTitulo(titulo, reserva) {
        const sanitizado = titulo
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return sanitizado === '' ? reserva : sanitizado;
      },
      codificarEmUtf8NaUrl: (valor, tamanho) => valor.slice(0, tamanho),
    },
    reescrita: {
      feeds: () => ['feed', 'rdf', 'rss', 'rss2', 'atom'],
      baseDePaginacao: () => 'page',
      estruturaDeLinks: () => '',
    },
    tipoDeConteudo: (nome) =>
      tipoConhecido && TIPOS_REGISTRADOS.includes(nome)
        ? tipoRegistrado(nome)
        : null,
    tipoEHierarquico: (tipo) => tipo === TIPO_DE_PAGINA,
    datas: {
      agoraNoFusoDoSite: () => AGORA_LOCAL,
      agoraEmUtc: () => AGORA_UTC,
      deUtcParaOFusoDoSite: () => AGORA_LOCAL,
      doFusoDoSiteParaUtc: () => AGORA_UTC,
    },
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: () => `https://exemplo.test/?p=${ID_DO_CONTEUDO}`,
    ...(opcoes.ganchos === undefined ? {} : { ganchos: opcoes.ganchos }),
  };

  return { contexto, dados, consultas };
}

/** A linha como `Conteudo`, pelo repositorio de verdade. */
function lerLinha(dados: PortaDeTeste, id: number): Conteudo | null {
  return criarRepositorioDeConteudo(dados.porta).obterPorId(id);
}

/** O valor de uma coluna nomeada, lido do proprio comando de escrita. */
function valorGravado(
  dados: PortaDeTeste,
  indice: number,
  coluna: string,
): string {
  const consulta = dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${indice}`);

  const atribuicoes = /SET (.+) WHERE/.exec(consulta.texto);
  assert.ok(atribuicoes !== null, 'o comando nao e uma atualizacao');
  const posicao = (atribuicoes[1] as string)
    .split(', ')
    .findIndex((atribuicao) => atribuicao === `${coluna} = ?`);
  assert.ok(posicao >= 0, `a coluna ${coluna} nao esta no comando`);
  return String(consulta.parametros[posicao]);
}

/** As consultas de unicidade que sairam — lista vazia e afirmacao. */
function consultasDeUnicidade(dados: PortaDeTeste): Consulta[] {
  return dados.selecoes.filter((consulta) =>
    consulta.texto.startsWith('SELECT post_name'),
  );
}

/** O pedido de submissao do cenario: o botao de revisao, e nada mais. */
function pedidoDeRevisao(
  campos: PedidoDeSubmissao['campos'] = {},
): PedidoDeSubmissao {
  return {
    conteudoId: ID_DO_CONTEUDO,
    campos,
    botoes: { submeterParaRevisao: 'Submit for Review' },
  };
}

/* ── CA-7.1: QUEM ESCREVE E NAO PUBLICA ENVIA PARA PENDENTE ────────────────── */

test('CA-7.1 pedir revisao grava o estado pendente', () => {
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(resultado.desfecho, 'submetido');
  assert.equal(resultado.estado, 'pending');
  // O pedido foi atendido ao pe da letra: nada foi rebaixado.
  assert.equal(resultado.rebaixado, false);
  // **Efeito no banco**: e a coluna que fecha o criterio, nao o retorno.
  assert.equal(valorGravado(dados, 0, 'post_status'), 'pending');
});

test('CA-7.1 pedir publicacao sem a capacidade de publicar grava pendente', () => {
  // `wp-admin/includes/post.php:152`-`:159`, com o comentario do legado por
  // cima: *"Posts 'submitted for approval' are submitted to $_POST the same as
  // if they were being published. Change status from 'publish' to 'pending' if
  // user lacks permissions to publish"*. E o rebaixamento que T003 registrou em
  // `../publicacao/permissao-de-publicacao.ts` e nao portou.
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { estado: 'publish' },
  });

  assert.equal(resultado.estadoPedido, 'publish');
  assert.equal(resultado.estado, 'pending');
  assert.equal(resultado.rebaixado, true);
  assert.equal(valorGravado(dados, 0, 'post_status'), 'pending');
});

test('CA-7.1 pedir agendamento sem a capacidade de publicar grava pendente', () => {
  // `:146`: `$published_statuses = array( 'publish', 'future' )`. Agendado cai
  // no **mesmo** `if`, e quem pegar T013 (US-6) encontra a lista nomeada.
  assert.deepEqual([...ESTADOS_PUBLICADOS_NA_SUBMISSAO], ['publish', 'future']);

  for (const estado of ESTADOS_PUBLICADOS_NA_SUBMISSAO) {
    const { contexto } = cenario();
    const resultado = submeterParaRevisao(contexto, {
      conteudoId: ID_DO_CONTEUDO,
      campos: { estado },
    });
    assert.equal(resultado.estado, 'pending');
    assert.equal(resultado.rebaixado, true);
  }
});

test('CA-7.1 quem PODE publicar e pede publicacao nao e rebaixado', () => {
  // A condicao do `if` e a **falta** da capacidade: quem a tem atravessa.
  const { contexto, dados } = cenario({ ator: AUTORA });

  const resultado = submeterParaRevisao(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { estado: 'publish' },
  });

  assert.equal(resultado.estado, 'publish');
  assert.equal(resultado.rebaixado, false);
  assert.equal(valorGravado(dados, 0, 'post_status'), 'publish');
});

test('CA-7.1 quem perdeu a capacidade de publicar conserva o que ja estava publicado', () => {
  // `:156` — a segunda condicao do ramo, a que ninguem adivinha:
  // `! in_array( $previous_status, $published_statuses, true ) || !
  // current_user_can( 'edit_post', $post_id )`. O autor que perdeu
  // `publish_posts` e continua podendo editar o proprio publicado **nao** o ve
  // despublicado. O comentario do legado nomeia o caso: *"or to resave
  // published posts"*.
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_status: 'publish' })],
    ator: atorCom('edit_posts', 'read', 'edit_published_posts'),
  });

  const resultado = submeterParaRevisao(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { estado: 'publish' },
  });

  assert.equal(resultado.estado, 'publish');
  assert.equal(resultado.rebaixado, false);
});

test('CA-7.1 quem nao pode editar aquele conteudo e recusado, e nada e gravado', () => {
  // `wp-admin/includes/post.php:294`-`:300`, e o erro *"sem permissao de
  // editar"* do contrato de `plan.md`.
  const { contexto, dados } = cenario({ ator: atorCom('read') });

  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.recusa, {
    codigo: CODIGO_DE_RECUSA_DE_EDICAO,
    mensagem: MENSAGEM_DE_RECUSA_DE_EDICAO,
    codigoHttp: 403,
  });
  assert.equal(resultado.estado, null);
  // A recusa e observavel na **sequencia de comandos**: nenhuma escrita sai.
  assert.deepEqual(dados.escritas, []);
});

test('CA-7.1 submeter o conteudo de outra pessoa exige a capacidade do alheio', () => {
  // E o que faz esta historia ser sobre conteudo **proprio**: `edit_post` de
  // conteudo alheio resolve para `edit_posts` + `edit_others_posts`
  // (`wp-includes/capabilities.php:120`-`:147`), e o colaborador nao tem a
  // segunda.
  const alheio = [
    linhaDeConteudo({ post_author: CONTA_DE_OUTRA_PESSOA }),
  ];

  const recusado = cenario({ linhas: alheio });
  assert.equal(
    submeterParaRevisao(recusado.contexto, pedidoDeRevisao()).desfecho,
    'recusado',
  );

  const permitido = cenario({ linhas: alheio, ator: EDITORA });
  assert.equal(
    submeterParaRevisao(permitido.contexto, pedidoDeRevisao()).desfecho,
    'submetido',
  );
});

test('CA-7.1 trocar o autor no pedido exige a capacidade do alheio', () => {
  // `wp-admin/includes/post.php:88`-`:105`, com o seletor de autor de `:79`. O
  // codigo de erro do painel **e** o nome da capacidade, e o texto e outro: ver
  // a nota de catalogo em `permissao-de-revisao.ts`.
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(contexto, {
    ...pedidoDeRevisao(),
    autorEscolhido: CONTA_DE_OUTRA_PESSOA,
  });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.recusa, {
    codigo: CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
    mensagem: MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
    codigoHttp: null,
  });
  assert.deepEqual(dados.escritas, []);
});

test('CA-7.1 a recusa de pagina tem o texto de pagina, escolhido pelo NOME do tipo', () => {
  // `:295`-`:299` — a unica comparacao literal de nome de tipo deste caminho, e
  // ela decide **texto**, nao permissao. A permissao continua vindo do
  // registro: `edit_post` de pagina resolve para `edit_pages`, que o
  // colaborador nao tem (UC-07: *"nenhuma capacidade de pagina chega a autor ou
  // colaborador"*).
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
  });

  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(
    resultado.recusa?.mensagem,
    MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
  );
});

test('CA-7.1 o botao de revisao vence o de publicar', () => {
  // `:121`-`:137`: os cinco `if` sao sequenciais, e `pending` e o ultimo. Dois
  // botoes na mesma requisicao — o que um formulario com JavaScript desligado
  // produz — e `pending` quem vence.
  assert.equal(
    estadoPedidoPelosBotoes(
      { publicar: 'Publish', submeterParaRevisao: 'Submit for Review' },
      undefined,
    ),
    'pending',
  );
  // E `publish` nao sobrescreve `private`, que e a segunda condicao de `:128`.
  assert.equal(
    estadoPedidoPelosBotoes({ publicar: 'Publish' }, 'private'),
    'private',
  );
  // Botao presente e **vazio** nao aciona nada: a pergunta e `'' !== $x`.
  assert.equal(
    estadoPedidoPelosBotoes({ submeterParaRevisao: '' }, 'draft'),
    'draft',
  );
});

test('CA-7.1 o estado nao registrado e descartado, e o conteudo fica como estava', () => {
  // `:115`-`:116`: `! get_post_status_object( ... )` → `unset()`. O legado
  // **tolera**, e quem tolera devolve o conteudo ao estado que ele tinha
  // (`:161`-`:163`).
  const registrado = (nome: string) => nome === 'pending';
  assert.equal(
    estadoSanitizadoDoPedido('inventado', (valor) => valor, registrado),
    undefined,
  );
  assert.equal(
    estadoSanitizadoDoPedido('pending', (valor) => valor, registrado),
    'pending',
  );

  const { contexto, dados } = cenario();
  const resultado = submeterParaRevisao(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { estado: 'inventado' },
  });

  assert.equal(resultado.estado, 'draft');
  assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');
});

test('CA-7.1 pedir rascunho automatico vira rascunho, e nao sobrevive a submissao', () => {
  // `:111`-`:113`, *"No longer an auto-draft"*, e a troca acontece **antes** da
  // pergunta do registro. A criacao do rascunho automatico e US-11 (T023).
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_status: 'auto-draft' })],
  });

  // Pedido explicito.
  assert.equal(
    submeterParaRevisao(contexto, {
      conteudoId: ID_DO_CONTEUDO,
      campos: { estado: 'auto-draft' },
    }).estado,
    'draft',
  );

  // E o estado **anterior**, pelo ramo de `:162`.
  assert.equal(
    submeterParaRevisao(cenario({
      linhas: [linhaDeConteudo({ post_status: 'auto-draft' })],
    }).contexto, { conteudoId: ID_DO_CONTEUDO }).estado,
    'draft',
  );
});

test('CA-7.1 a chave de estado presente e VAZIA nao e a mesma coisa que ausente', () => {
  // `:107` pergunta `! empty()`, e `:161` pergunta `! isset()`. Uma chave
  // presente e vazia — `''` ou a cadeia `'0'`, que o PHP tambem considera vazia
  // (`../gravacao/verdade-de-php.ts`) — **nao entra** no bloco de sanitizacao e
  // **nao cai** no ramo que conserva o estado anterior: ela atravessa intacta e
  // e a segunda barreira de US-2 que a resolve, em `wp_insert_post()` (`:4703`).
  //
  // A diferenca e observavel, e e por isso que esta afirmacao existe: num
  // conteudo **publicado**, tratar vazio como ausencia o deixaria publicado,
  // onde o legado o rebaixa para rascunho.
  for (const vazio of ['', '0']) {
    const { contexto, dados } = cenario({
      linhas: [linhaDeConteudo({ post_status: 'publish' })],
      ator: AUTORA,
    });

    const resultado = submeterParaRevisao(contexto, {
      conteudoId: ID_DO_CONTEUDO,
      campos: { estado: vazio },
    });

    assert.equal(resultado.estado, vazio);
    assert.equal(resultado.gravacao?.colunas?.post_status, 'draft');
    assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');
  }
});

/* ── CA-7.2: O PENDENTE NA FILA DE QUEM PODE PUBLICAR AQUELE TIPO ──────────── */

test('CA-7.2 a fila entrega as variaveis de consulta que o painel monta', () => {
  // `wp-admin/includes/post.php:1314`: o `compact()` de seis chaves. Sao elas
  // que determinam o comando que `WP_Query` emite, e afirma-las e afirmar a
  // fila sem reimplementar a consulta.
  const { contexto } = cenario({ ator: EDITORA });

  const resultado = filaDeRevisao(contexto, { tipo: 'post' });

  assert.equal(resultado.desfecho, 'listado');
  assert.deepEqual(resultado.variaveis, {
    post_type: 'post',
    post_status: 'pending',
    perm: 'readable',
    orderby: 'modified',
    order: 'ASC',
    posts_per_page: ITENS_POR_PAGINA_DA_FILA,
  });
});

test('CA-7.2 o conteudo submetido aparece na fila de quem pode publicar aquele tipo', () => {
  const linhas = [
    linhaDeConteudo({ post_status: 'pending', post_modified: DATA_ANTIGA }),
    linhaDeConteudo({
      ID: ID_DE_OUTRO_CONTEUDO,
      post_status: 'draft',
      post_modified: AGORA_LOCAL,
    }),
  ];
  const { contexto, consultas } = cenario({ linhas, ator: EDITORA });

  const resultado = filaDeRevisao(contexto);

  // O pendente esta na fila; o rascunho, que ninguem submeteu, nao.
  assert.deepEqual(
    resultado.conteudos.map((conteudo) => conteudo.id),
    [ID_DO_CONTEUDO],
  );
  assert.equal(consultas.length, 1);
});

test('CA-7.2 a fila e a mais antiga primeiro', () => {
  // `:1269` e `:1277`: `orderby = 'modified'` e `order = 'ASC'` — e `pending` e
  // o unico estado do legado com ordem ascendente por default. A fila de
  // revisao e uma fila.
  const linhas = [
    linhaDeConteudo({ ID: ID_DE_OUTRO_CONTEUDO, post_status: 'pending', post_modified: AGORA_LOCAL }),
    linhaDeConteudo({ post_status: 'pending', post_modified: DATA_ANTIGA }),
  ];
  const { contexto } = cenario({ linhas, ator: EDITORA });

  const resultado = filaDeRevisao(contexto);

  assert.deepEqual(
    resultado.conteudos.map((conteudo) => conteudo.id),
    [ID_DO_CONTEUDO, ID_DE_OUTRO_CONTEUDO],
  );
});

test('CA-7.2 o portao da fila e a capacidade de EDITAR conteudos daquele tipo', () => {
  // `wp-admin/edit.php:44` pergunta `$post_type_object->cap->edit_posts`, e
  // **nao** `publish_posts`. Quem pode publicar ve a fila porque todo papel de
  // fabrica que publica tambem edita; trocar o portao fecharia a tela para o
  // colaborador, que no legado a abre. Ver o cabecalho de `fila-de-revisao.ts`.
  const colaboradora = cenario();
  assert.equal(filaDeRevisao(colaboradora.contexto).desfecho, 'listado');

  const semNada = cenario({ ator: atorCom('read') });
  const recusada = filaDeRevisao(semNada.contexto);
  assert.equal(recusada.desfecho, 'recusado');
  assert.deepEqual(recusada.recusa, {
    titulo: TITULO_DE_RECUSA_DA_FILA,
    mensagem: MENSAGEM_DE_RECUSA_DA_FILA,
    codigoHttp: 403,
  });
  // E a recusa nao consulta nada: no legado a requisicao morre antes da
  // listagem (`edit.php:52`).
  assert.equal(recusada.variaveis, null);
  assert.deepEqual(recusada.conteudos, []);
  assert.deepEqual(semNada.consultas, []);
});

test('CA-7.2 a fila de paginas exige a capacidade de pagina, pelo registro do tipo', () => {
  // Sem um unico `if` sobre o nome `page`: o slot `edit_posts` do tipo `page`
  // vale `edit_pages`, e e ele que a tela pergunta.
  const { contexto } = cenario({ ator: AUTORA });

  assert.equal(filaDeRevisao(contexto, { tipo: 'post' }).desfecho, 'listado');
  assert.equal(
    filaDeRevisao(contexto, { tipo: TIPO_DE_PAGINA }).desfecho,
    'recusado',
  );
});

test('CA-7.2 tipo nao registrado cai em `post`, e a fila nao recusa por isso', () => {
  // `:1249`-`:1253`: `in_array( $q['post_type'], get_post_types(), true )`.
  const { contexto } = cenario({ ator: EDITORA });

  const resultado = filaDeRevisao(contexto, { tipo: 'inventado' });

  assert.equal(resultado.desfecho, 'listado');
  assert.equal(resultado.variaveis?.post_type, 'post');
});

test('CA-7.2 (P6) a paginacao da fila e 20, com a borda do legado e os dois filtros', () => {
  // `:1283` — o unico numero desta pasta. A borda e
  // `empty( $posts_per_page ) || $posts_per_page < 1` (`:1282`).
  assert.equal(ITENS_POR_PAGINA_DA_FILA, 20);

  const semOpcao = cenario();
  assert.equal(itensPorPaginaDaFila(semOpcao.contexto, 'post'), 20);

  // No ultimo instante aceita: `1` nao e menor que 1.
  const comUm = cenario({ itensPorPaginaDaConta: 1 });
  assert.equal(itensPorPaginaDaFila(comUm.contexto, 'post'), 1);

  // Um instante depois recusa: zero e negativo caem no default.
  const comZero = cenario({ itensPorPaginaDaConta: 0 });
  assert.equal(itensPorPaginaDaFila(comZero.contexto, 'post'), 20);
  const negativo = cenario({ itensPorPaginaDaConta: -5 });
  assert.equal(itensPorPaginaDaFila(negativo.contexto, 'post'), 20);

  // Os dois filtros, na ordem do legado: o do tipo (`:1302`) recebe o valor ja
  // resolvido pelo default, e o geral (`:1312`) recebe o do tipo ja filtrado.
  const pontos: string[] = [];
  const comFiltros = cenario({
    itensPorPaginaDaConta: 5,
    ganchos: {
      filtrarItensPorPaginaDoTipo(nomeDoPonto, itens) {
        pontos.push(nomeDoPonto);
        return itens * 2;
      },
      filtrarItensPorPagina(itens, tipo) {
        pontos.push(`edit_posts_per_page:${tipo}`);
        return itens + 1;
      },
    },
  });

  assert.equal(itensPorPaginaDaFila(comFiltros.contexto, 'post'), 11);
  assert.deepEqual(pontos, ['edit_post_per_page', 'edit_posts_per_page:post']);
});

/* ── CA-7.3: O PENDENTE FORA DE TODA CONSULTA PUBLICA ──────────────────────── */

test('CA-7.3 o estado gravado nao e publico nem consultavel pelo publico', () => {
  // A consulta publica e BC-08 (feature 004, T009 — *"o portao de
  // `post_status`"*), e esta tarefa nao tem consulta publica para alterar.
  // Mesmo precedente de CA-2.3 em T005. O que ela entrega e a **condicao** do
  // criterio: a linha gravada carrega um estado que o registro declara nao
  // publico e nao consultavel pelo publico (`wp-includes/post.php:704`).
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(valorGravado(dados, 0, 'post_status'), 'pending');
  assert.equal(resultado.estado, 'pending');
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.pending.publico, false);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.pending.consultavelPeloPublico,
    false,
  );
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.pending.protegido, true);
  // E ele **aparece** no painel, que e o outro lado de CA-7.2: `pending` tem os
  // dois sinalizadores de listagem ligados.
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.pending.visivelNaListaDeTodos,
    true,
  );
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.pending.visivelNaListaDeEstados,
    true,
  );
});

/* ── CA-7.4 e CA-7.5: O IDENTIFICADOR DE QUEM NAO PODE PUBLICAR ────────────── */

test('CA-7.4 quem nao pode publicar grava o identificador vazio', () => {
  // `wp-includes/post.php:4731`-`:4739`, com o comentario do legado: *"Don't
  // allow contributors to set the post slug for pending review posts"*. A regra
  // e BR-MIGRAR-004 e **ja estava na arvore**: T007 a portou em
  // `../gravacao/permissao-do-identificador.ts`, e CA-3.4 e CA-7.4 sao a mesma
  // linha. O que esta tarefa acrescenta e a **operacao** que chega nela.
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(
    contexto,
    pedidoDeRevisao({ identificadorNaUrl: 'endereco-que-eu-quero' }),
  );

  assert.equal(resultado.gravacao?.identificadorNaUrl, '');
  assert.equal(valorGravado(dados, 0, 'post_name'), '');
  // *"E nenhuma das duas reserva o slug"* — o quinto cenario de `PT-002`.
  // Nenhuma consulta de unicidade sai: a dispensa de `pending` (BR-MIGRAR-005)
  // tambem e **sequencia de comandos**.
  assert.deepEqual(consultasDeUnicidade(dados), []);
});

test('CA-7.5 quem pode publicar e ainda assim submete mantem o identificador', () => {
  // O outro ramo da **mesma** linha: a capacidade existe, o campo passa. As
  // duas metades de CA-7.5 sao a mesma pergunta em dois lugares — o estado, em
  // `estado-na-submissao.ts`, e o identificador, em T007.
  const { contexto, dados } = cenario({ ator: AUTORA });

  const resultado = submeterParaRevisao(
    contexto,
    pedidoDeRevisao({ identificadorNaUrl: 'endereco-que-eu-quero' }),
  );

  assert.equal(resultado.estado, 'pending');
  assert.equal(resultado.gravacao?.identificadorNaUrl, 'endereco-que-eu-quero');
  assert.equal(valorGravado(dados, 0, 'post_name'), 'endereco-que-eu-quero');
  assert.deepEqual(consultasDeUnicidade(dados), []);
});

test('P5 dois conteudos pendentes podem ter o mesmo identificador', () => {
  // BR-MIGRAR-005: *"a unicidade e dispensada em `draft`, `pending`,
  // `auto-draft`, em revisao e no tipo `user_request`"*. Aqui ela e exercitada
  // pela porta da submissao, com o identificador do primeiro **ja ocupado** na
  // tabela.
  const linhas = [
    linhaDeConteudo(),
    linhaDeConteudo({ ID: ID_DE_OUTRO_CONTEUDO, post_name: 'endereco-repetido' }),
  ];
  const { contexto, dados } = cenario({
    linhas,
    ator: AUTORA,
    ocupados: ['endereco-repetido'],
  });

  const resultado = submeterParaRevisao(
    contexto,
    pedidoDeRevisao({ identificadorNaUrl: 'endereco-repetido' }),
  );

  assert.equal(valorGravado(dados, 0, 'post_name'), 'endereco-repetido');
  assert.deepEqual(consultasDeUnicidade(dados), []);
  assert.equal(resultado.gravacao?.identificadorNaUrl, 'endereco-repetido');
});

test('P4 o identificador informado por quem esta em revisao sem publicar e ignorado', () => {
  // A regra de negocio, afirmada pelos dois valores ao mesmo tempo: o pedido
  // chegou com endereco e a coluna ficou vazia.
  const { contexto, dados } = cenario();

  const resultado = submeterParaRevisao(
    contexto,
    pedidoDeRevisao({ identificadorNaUrl: 'endereco-que-eu-quero' }),
  );

  assert.equal(resultado.gravacao?.identificadorPedido, 'endereco-que-eu-quero');
  assert.equal(resultado.gravacao?.identificadorNaUrl, '');
  assert.equal(valorGravado(dados, 0, 'post_name'), '');
});

/* ── CA-7.6: LER O PENDENTE ALHEIO EXIGE PODER EDITA-LO ────────────────────── */

test('CA-7.6 ler o pendente alheio exige poder edita-lo', () => {
  // `wp-includes/capabilities.php:369`-`:380` — a ancora que `spec.md` da para
  // US-7. Estado nem publico nem privado faz a leitura cair **inteira** na
  // resolucao de edicao: `$caps = map_meta_cap( 'edit_post', ... )`.
  const linhas = [
    linhaDeConteudo({
      post_status: 'pending',
      post_author: CONTA_DE_OUTRA_PESSOA,
    }),
  ];

  const colaboradora = cenario({ linhas });
  const alheio = lerLinha(colaboradora.dados, ID_DO_CONTEUDO);
  assert.ok(alheio !== null);

  // UC-06, tabela de excecoes: *"Colaborador tenta ler o pendente de outro:
  // `read_post` de status nao publico cai em `edit_post`, logo ler o rascunho
  // de outro exige poder edita-lo — o que o colaborador nao tem"*.
  assert.deepEqual(autorizarLeituraEmRevisao(colaboradora.contexto, alheio), {
    codigo: CODIGO_DE_RECUSA_DE_LEITURA,
    mensagem: MENSAGEM_DE_RECUSA_DE_LEITURA,
    codigoHttp: 403,
  });

  // Quem pode mexer no alheio le.
  const editora = cenario({ linhas, ator: EDITORA });
  assert.equal(autorizarLeituraEmRevisao(editora.contexto, alheio), null);
});

test('CA-7.6 quem escreveu le o proprio pendente', () => {
  // `capabilities.php:374`-`:375`: `$post->post_author && $user_id === (int)
  // $post->post_author` devolve a capacidade de **ler** do tipo, que todo papel
  // de fabrica tem.
  const { contexto, dados } = cenario({
    linhas: [linhaDeConteudo({ post_status: 'pending' })],
  });
  const proprio = lerLinha(dados, ID_DO_CONTEUDO);
  assert.ok(proprio !== null);

  assert.equal(autorizarLeituraEmRevisao(contexto, proprio), null);
});

test('CA-7.6 conteudo publicado e legivel sem pergunta de capacidade nenhuma', () => {
  // `class-wp-rest-posts-controller.php:1791`: `'publish' === $post->post_status
  // || current_user_can( 'read_post', ... )`. O curto-circuito vem **antes** da
  // capacidade, e por isso o visitante anonimo le.
  const { contexto, dados } = cenario({
    linhas: [linhaDeConteudo({ post_status: 'publish' })],
  });
  const publicado = lerLinha(dados, ID_DO_CONTEUDO);
  assert.ok(publicado !== null);

  const anonimo: ContextoDeRevisao = { ...contexto, ator: ATOR_ANONIMO };
  assert.equal(autorizarLeituraEmRevisao(anonimo, publicado), null);

  // E o anonimo **nao** le o pendente: a recusa dele e 401, e nao 403, porque
  // `rest_authorization_required_code()` distingue os dois
  // (`wp-includes/rest-api.php:1438`).
  const emRevisao = cenario({
    linhas: [linhaDeConteudo({ post_status: 'pending', post_author: CONTA_DE_OUTRA_PESSOA })],
  });
  const pendente = lerLinha(emRevisao.dados, ID_DO_CONTEUDO);
  assert.ok(pendente !== null);
  assert.equal(
    autorizarLeituraEmRevisao(
      { ...emRevisao.contexto, ator: ATOR_ANONIMO },
      pendente,
    )?.codigoHttp,
    401,
  );
});

/* ── O QUE A OPERACAO FAZ COM O RESTO DA LINHA ─────────────────────────────── */

test('submeter sem informar os campos nao apaga nenhum deles', () => {
  // `wp_update_post()` `:5367`: `array_merge( $post, $postarr )` — chave ausente
  // conserva o valor gravado. E a razao de esta operacao ter de portar a mistura
  // em vez de chamar a gravacao direto.
  const { contexto, dados } = cenario();

  submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(valorGravado(dados, 0, 'post_content'), 'corpo anterior');
  assert.equal(valorGravado(dados, 0, 'post_title'), 'Meu Texto');
  assert.equal(valorGravado(dados, 0, 'post_author'), String(CONTA_DA_COLABORADORA));
});

test('a data do rascunho e reposta no instante da submissao', () => {
  // `wp_update_post()` `:5356`-`:5372`, o `$clear_date`: estado de data
  // flutuante + coluna GMT na sentinela + sem `edit_date` → `post_date` recebe
  // agora. *"Drafts shouldn't be assigned a date unless explicitly done so by
  // the user"*, e o efeito e que a data de um rascunho caminha a cada
  // salvamento.
  const { contexto, dados } = cenario();

  submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(valorGravado(dados, 0, 'post_date'), AGORA_LOCAL);
  // E a coluna GMT continua na sentinela, porque `pending` tambem tem data
  // flutuante (`../gravacao/data-na-gravacao.ts`).
  assert.equal(valorGravado(dados, 0, 'post_date_gmt'), DATA_SENTINELA);
});

test('a data escolhida a mao desliga a reposicao', () => {
  // `empty( $postarr['edit_date'] )` e o segundo termo do `$clear_date`.
  const { contexto, dados } = cenario();

  submeterParaRevisao(contexto, {
    ...pedidoDeRevisao(),
    editarData: true,
  });

  assert.equal(valorGravado(dados, 0, 'post_date'), DATA_ANTIGA);
});

test('a senha de quem nao pode publicar e descartada do pedido', () => {
  // `wp-admin/includes/post.php:165`-`:167`. A pergunta e `isset()`: pedir
  // senha vazia tambem e pedir, e tambem e descartado.
  assert.equal(senhaNaSubmissao('segredo', false), undefined);
  assert.equal(senhaNaSubmissao('segredo', true), 'segredo');
  assert.equal(senhaNaSubmissao('', false), undefined);

  // E o descarte conserva a senha gravada, em vez de apaga-la: a chave ausente
  // cai na mistura de `wp_update_post()`.
  const { contexto, dados } = cenario({
    linhas: [linhaDeConteudo({ post_password: 'segredo-antigo' })],
  });

  submeterParaRevisao(contexto, pedidoDeRevisao({ senha: 'outro-segredo' }));

  assert.equal(valorGravado(dados, 0, 'post_password'), 'segredo-antigo');
});

test('o estado de comentario ausente no pedido fecha os comentarios', () => {
  // `:169`-`:175`: o painel crava `closed` antes de a gravacao ser chamada, e o
  // valor cravado vence o default do **tipo** (`open` de fabrica para `post`).
  // E quirk do legado, nao limpeza pendente — ver
  // `ESTADO_DE_COMENTARIO_NA_SUBMISSAO`.
  const { contexto, dados } = cenario();

  submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(ESTADO_DE_COMENTARIO_NA_SUBMISSAO, 'closed');
  assert.equal(valorGravado(dados, 0, 'comment_status'), 'closed');
  assert.equal(valorGravado(dados, 0, 'ping_status'), 'closed');
});

test('o tipo do conteudo vem da linha, e o pedido nao o troca', () => {
  // `:282`-`:283`. Por esta porta ninguem transforma um conteudo em outro tipo.
  const { contexto, dados } = cenario();

  submeterParaRevisao(contexto, pedidoDeRevisao({ tipo: TIPO_DE_PAGINA }));

  assert.equal(valorGravado(dados, 0, 'post_type'), 'post');
});

test('o estado `inherit` pedido e descartado antes do portao', () => {
  // `:285`-`:291`: `edit_post()` retira a chave, e o conteudo fica com o estado
  // que tinha. O `inherit` do anexo e BR-MIGRAR-002, em
  // `../gravacao/estado-na-gravacao.ts`.
  const { contexto } = cenario();

  const resultado = submeterParaRevisao(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { estado: 'inherit' },
  });

  assert.equal(resultado.estadoPedido, null);
  assert.equal(resultado.estado, 'draft');
});

test('conteudo inexistente nao grava nada, e devolve o erro das duas superficies', () => {
  const { contexto, dados } = cenario({ linhas: [] });

  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao());

  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_CONTEUDO_INEXISTENTE);
  assert.equal(resultado.recusa?.codigoHttp, 404);
  assert.deepEqual(dados.escritas, []);
  // Uma leitura, e nenhuma pergunta de capacidade depois dela: o legado morre
  // em `$post->post_type` de `null` (`:282`), antes do portao de `:294`.
  assert.equal(dados.selecoes.length, 1);
});

test('a resolucao de estado nao inventa pendente quando o pedido nao pede nada', () => {
  // `:161`-`:163`. Esta e a guarda contra o erro mais facil desta tarefa:
  // **nao** e a operacao que decide `pending`, e o pedido que o decide (ou o
  // rebaixamento). Submeter sem pedir estado conserva o que a linha tinha.
  assert.deepEqual(
    resolverEstadoDaSubmissao({
      estadoPedido: undefined,
      estadoAnterior: 'draft',
      podePublicar: false,
      podeEditarEsteConteudo: true,
    }),
    { estado: 'draft', rebaixado: false },
  );

  // E `private` sem a capacidade de publicar volta ao estado anterior — so cai
  // em `pending` quando nao ha estado anterior (`:142`-`:144`).
  assert.deepEqual(
    resolverEstadoDaSubmissao({
      estadoPedido: 'private',
      estadoAnterior: 'draft',
      podePublicar: false,
      podeEditarEsteConteudo: true,
    }),
    { estado: 'draft', rebaixado: true },
  );
  assert.deepEqual(
    resolverEstadoDaSubmissao({
      estadoPedido: 'private',
      estadoAnterior: '',
      podePublicar: false,
      podeEditarEsteConteudo: true,
    }),
    { estado: 'pending', rebaixado: true },
  );
});
