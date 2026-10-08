/**
 * Testes da entrega de **T017**: *"o comportamento de US-8 existe e os criterios
 * CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6 passam contra o sistema novo"*.
 *
 * **Nao sao os oito testes de `backlog/tests.md`** — UT-026-1 a UT-026-8 sao
 * **T018**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*) e
 * **valor devolvido pelo ponto de extensao, byte a byte** — e e por este segundo
 * que a **lista de capacidades** entra nas afirmacoes, porque ela e o valor que
 * o interceptador de `map_meta_cap` recebe.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 *
 * ---
 *
 * # O cenario desta suite
 *
 * **O conteudo e de outra pessoa, e isso e a historia.** A linha de base e um
 * `pending` escrito por `CONTA_DA_AUTORA` com o campo de identificador **vazio**
 * — que e o que T007 grava para quem nao pode publicar (CA-3.4 e CA-7.4) e e o
 * ponto de partida que CA-8.3 descreve: *"o identificador de URL, vazio no
 * pendente de colaborador"*.
 *
 * **A porta de dados responde por consulta, e nao por fila**, pela mesma razao
 * registrada na suite de T015: esta operacao faz oito leituras antes de
 * escrever, varias delas a mesma pergunta feita pelo legado em pontos
 * diferentes. Programar por fila seria programar o resultado.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type EstadoDaRedeNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
} from '../armazenamento/index.js';
import { PROPRIEDADES_DO_ESTADO_EDITORIAL } from '../estado-editorial.js';
import type { Consulta, LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import {
  CODIGO_DE_CONTEUDO_INEXISTENTE,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
  CODIGO_DE_RECUSA_DE_EDICAO,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
  MENSAGEM_DE_RECUSA_DE_EDICAO,
  MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
  type ContextoDeRevisao,
} from '../revisao/index.js';
import {
  autorNaRevisaoEditorial,
  autoriaPreservada,
  capacidadesDaEdicaoDesteConteudo,
  devolverAoAutor,
  revisarEPublicar,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_DO_CONTEUDO = 42;

/** Quem escreveu o texto — e quem tem de continuar constando no registro. */
const CONTA_DA_AUTORA = 7;
/** Quem revisa. */
const CONTA_DA_EDITORA = 3;
/** Uma terceira conta, para o seletor de autor. */
const CONTA_DE_TERCEIRO = 11;

const TIPO_DE_PAGINA = 'page';

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** O mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';
/** A data que a linha do cenario tem gravada, distinguivel de `AGORA_LOCAL`. */
const DATA_ANTIGA = '2026-10-01 09:00:00';

/** O corpo que a autora escreveu. **CA-8.4 e sobre ele continuar ali.** */
const CORPO_DA_AUTORA = 'O texto que a autora escreveu, com <em>marcacao</em>.';
const TITULO_DA_AUTORA = 'Meu Texto Em Revisao';
/** `sanitize_title( 'Meu Texto Em Revisao' )` com a reducao desta suite. */
const IDENTIFICADOR_DERIVADO = 'meu-texto-em-revisao';

/**
 * As 23 colunas de `posts`, com os defaults do cenario: **pendente, de outra
 * pessoa, sem identificador na URL**.
 */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_CONTEUDO,
    post_author: CONTA_DA_AUTORA,
    post_date: DATA_ANTIGA,
    // Pendente tem data flutuante, logo a coluna GMT fica na sentinela
    // (`wp-includes/post.php:4780`-`:4784`).
    post_date_gmt: DATA_SENTINELA,
    post_content: CORPO_DA_AUTORA,
    post_title: TITULO_DA_AUTORA,
    post_excerpt: '',
    post_status: 'pending',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    // **Vazio**: e o que T007 grava para quem nao pode publicar, em `pending`
    // (`wp-includes/post.php:4731`-`:4739`). CA-8.3 parte daqui.
    post_name: '',
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

/** A porta de dados desta suite: responde por consulta e registra tudo. */
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

/** Os tipos que o registro deste cenario conhece. */
const TIPOS_REGISTRADOS: readonly string[] = ['post', TIPO_DE_PAGINA];

/**
 * Os 15 slots de capacidade que `get_post_type_capabilities()` deriva de
 * `capability_type` (`wp-includes/post.php:1884`).
 *
 * Derivados aqui, e nao escritos a mao, pelo mesmo motivo pelo qual o legado os
 * deriva — e e **a prova de CA-8.5**: e assim que `edit_others_posts` vira
 * `edit_others_pages` **sem um unico `if` sobre o nome `page`**.
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

/** As tres opcoes de pagina com funcao especial, como o cenario as pede. */
interface PaginasEspeciais {
  readonly inicial?: number;
  readonly deConteudos?: number;
  readonly dePolitica?: number;
}

/** A fonte de `map_meta_cap()`, lendo a mesma tabela em memoria. */
function fonteDeConteudo(
  linhas: readonly LinhaDeResultado[],
  paginas: PaginasEspeciais = {},
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
      TIPOS_REGISTRADOS.includes(nome) ? tipoRegistrado(nome) : null,
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
    paginaInicial: () => paginas.inicial ?? 0,
    paginaDeConteudos: () => paginas.deConteudos ?? 0,
    paginaDePoliticaDePrivacidade: () => paginas.dePolitica ?? 0,
  };
}

/**
 * Um ator com as capacidades concedidas **individualmente**.
 *
 * Matriz vazia e concessao individual **sao um estado do legado**, e nao atalho
 * de teste: o papel e dado gravado (ADR-0001) e o `allcaps` individual passa por
 * cima dele (`PERM-1`). A regra de dependencia 3 impede esta suite de importar a
 * matriz de fabrica de BC-05, e por isso os conjuntos de fabrica aparecem como
 * lista, com o papel nomeado em comentario.
 */
function atorCom(
  contaId: number,
  login: string,
  ...capacidades: readonly string[]
): AtorDeAutorizacao {
  return {
    contaId,
    login,
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

/**
 * Quem publica o alheio — o ator de UC-07.
 *
 * As capacidades de `post` do papel `editor` de fabrica mais as 7 de `page`:
 * **nenhuma capacidade de pagina chega a autor ou colaborador**, e a assimetria
 * e deliberada (`permissions.md` §3.2, citada em UC-07).
 */
const EDITORA = atorCom(
  CONTA_DA_EDITORA,
  'editora',
  'read',
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
  'edit_private_posts',
  'publish_posts',
  'read_private_posts',
  'edit_pages',
  'edit_others_pages',
  'edit_published_pages',
  'edit_private_pages',
  'publish_pages',
  'read_private_pages',
);

/** A propria autora do texto: tem `edit_posts` e nao tem o do alheio. */
const AUTORA = atorCom(
  CONTA_DA_AUTORA,
  'autora',
  'read',
  'edit_posts',
  'edit_published_posts',
  'publish_posts',
);

/** Quem pode mexer no alheio e **nao** pode publicar. */
const REVISORA_SEM_PUBLICACAO = atorCom(
  CONTA_DA_EDITORA,
  'revisora',
  'read',
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
);

const BASE_SEM_PAPEL: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  readonly linhas?: readonly LinhaDeResultado[];
  readonly ocupados?: readonly string[];
  readonly paginas?: PaginasEspeciais;
  readonly rede?: EstadoDaRedeNaAutorizacao;
}

interface Cenario {
  readonly contexto: ContextoDeRevisao;
  readonly dados: PortaDeTeste;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const linhas = opcoes.linhas ?? [linhaDeConteudo()];
  const dados = porta(linhas, opcoes.ocupados ?? []);

  const contexto: ContextoDeRevisao = {
    ator: opcoes.ator ?? EDITORA,
    base: {
      ...BASE_SEM_PAPEL,
      ...(opcoes.rede === undefined ? {} : { rede: opcoes.rede }),
    },
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    fonteDeConteudo: fonteDeConteudo(linhas, opcoes.paginas ?? {}),
    // `sanitize_key()`: caixa baixa, e so letra, digito, `_` e `-` passam. E a
    // reducao do que a funcao de `plataforma/formatacao/` faz, e nenhuma
    // afirmacao desta suite e sobre o texto dela.
    sanitizarChave: (valor) => valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    // Esta operacao nao consulta a fila: o gatilho de UC-07 e a tela que T015
    // entregou, e ela nao e exercitada aqui.
    consultarConteudo: () => [],
    itensPorPaginaDaConta: () => 0,
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
      TIPOS_REGISTRADOS.includes(nome) ? tipoRegistrado(nome) : null,
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
  };

  return { contexto, dados };
}

/* ── CA-8.1 · A SOMA ──────────────────────────────────────────────────────── */

test('CA-8.1: o pendente de outra pessoa exige a capacidade do alheio (`capabilities.php:266`)', () => {
  const { contexto } = cenario();

  // `$caps[] = $post_type->cap->edit_others_posts;` e **nada mais**: pendente
  // nao e publicado nem privado, logo nenhum dos dois `if` seguintes entra.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_posts',
  ]);
});

test('CA-8.1: o publicado de outra pessoa SOMA a capacidade do publicado (`:269`-`:271`)', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_status: 'publish', post_name: 'ja-no-ar' })],
  });

  // A ordem e a do legado — o alheio primeiro, o do estado depois —, e nao se
  // ordena: ela e o valor que o interceptador de `map_meta_cap` recebe.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
});

test('CA-8.1: agendado conta como publicado na soma, e e isso que UC-07 nomeia', () => {
  const { contexto } = cenario({
    linhas: [
      linhaDeConteudo({ post_status: 'future', post_name: 'ja-agendado' }),
    ],
  });

  // `in_array( $post->post_status, array( 'publish', 'future' ), true )`
  // (`:269`). UC-07 passo 2: *"edit_others_posts + edit_published_posts se
  // publish ou future"*. Quem le so a tela supoe que agendado ainda e rascunho.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
});

test('CA-8.1: o privado de outra pessoa SOMA a capacidade do privado (`:272`-`:273`)', () => {
  const { contexto } = cenario({
    linhas: [
      linhaDeConteudo({ post_status: 'private', post_name: 'so-para-alguns' }),
    ],
  });

  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_private_posts',
  ]);
});

test('CA-8.1: a resolucao depende de QUEM e o autor — o proprio texto nao soma o alheio (`:250`)', () => {
  // Mesma linha, mesmo estado, outro ator: a autora. A lista muda inteira, e e
  // essa dependencia de autoria que `PERM-3` chama de regra de negocio da
  // autorizacao.
  const paraEditora = cenario().contexto;
  const paraAutora = cenario({ ator: AUTORA }).contexto;

  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(paraEditora, ID_DO_CONTEUDO), [
    'edit_others_posts',
  ]);
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(paraAutora, ID_DO_CONTEUDO), [
    'edit_posts',
  ]);
});

test('CA-8.1: a soma e conjuntiva — falta UMA capacidade e a revisao e recusada (`PERM-1`)', () => {
  // A revisora tem `edit_others_posts` e **nao** tem `edit_private_posts`: a
  // lista do privado alheio pede as duas, e `PERM-1` exige **todas**.
  const { contexto } = cenario({
    ator: REVISORA_SEM_PUBLICACAO,
    linhas: [linhaDeConteudo({ post_status: 'private', post_name: 'privado' })],
  });

  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_private_posts',
  ]);

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_RECUSA_DE_EDICAO);
  assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_EDICAO);
  // Nada foi escrito: o portao vem antes de qualquer gravacao.
  assert.deepEqual(resultado.estado, null);
});

test('o erro do contrato e "sem permissao sobre conteudo de outro", e a lista sai com ele', () => {
  const { contexto, dados } = cenario({ ator: AUTORA, linhas: [linhaDeConteudo({ post_author: CONTA_DE_TERCEIRO })] });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'recusado');
  // A autora nao tem `edit_others_posts`, e o conteudo e de terceiro.
  assert.deepEqual(resultado.capacidadesExigidas, ['edit_others_posts']);
  assert.deepEqual(dados.escritas, []);
});

/* ── CA-8.2 · A AUTORIA ───────────────────────────────────────────────────── */

test('CA-8.2: publicar o texto de outra pessoa mantem o autor original na coluna', () => {
  const { contexto, dados } = cenario();

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.estado, 'publish');
  // O passo 6 de UC-07: *"Sistema mantem o autor original no registro"*.
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.autoriaPreservada, true);
  assert.notEqual(resultado.autorGravado, CONTA_DA_EDITORA);

  // E o mesmo valor no comando que foi para o banco: a area 3 da Decisao 2
  // compara efeito, nao retorno.
  const escrita = dados.escritas.at(-1);
  assert.ok(escrita !== undefined);
  assert.ok(escrita.parametros.includes(CONTA_DA_AUTORA));
  assert.ok(!escrita.parametros.includes(CONTA_DA_EDITORA));
});

test('CA-8.2: o formulario que devolve o autor da linha tem o mesmo efeito (ramo 2)', () => {
  const { contexto } = cenario();

  // `<input type="hidden" name="post_author" value="7" />`
  // (`wp-admin/edit-form-advanced.php:491`).
  const resultado = revisarEPublicar(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { autorId: CONTA_DA_AUTORA },
  });

  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.autoriaPreservada, true);
});

test('o seletor de autor TROCA a autoria, e isso e o que ele existe para fazer (ramo 1)', () => {
  const { contexto } = cenario();

  // `post_author_override` (`wp-admin/includes/post.php:79`-`:80`), que o painel
  // so renderiza para quem tem `edit_others_posts` (`meta-boxes.php:1678`).
  const resultado = revisarEPublicar(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    autorEscolhido: CONTA_DE_TERCEIRO,
  });

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.autorGravado, CONTA_DE_TERCEIRO);
  // `autoriaPreservada` e leitura da coluna, nao julgamento: aqui ela e `false`
  // **porque foi pedido que mudasse**.
  assert.equal(resultado.autoriaPreservada, false);
});

test('o seletor de autor com `0` nao escolhe nada: `! empty()` o trata como ausencia', () => {
  const { contexto } = cenario();

  const resultado = revisarEPublicar(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    autorEscolhido: 0,
    campos: { autorId: 0 },
  });

  // Os dois ramos `! empty()` caem, e o terceiro devolve o autor da linha.
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
});

test('os tres ramos da autoria, na ordem do legado', () => {
  const linha = {
    id: ID_DO_CONTEUDO,
    autorId: CONTA_DA_AUTORA,
  } as Parameters<typeof autorNaRevisaoEditorial>[1];

  // Ramo 1 vence ramo 2 (`:79` antes de `:82`).
  assert.equal(
    autorNaRevisaoEditorial(
      { autorEscolhido: CONTA_DE_TERCEIRO, autorDoPedido: CONTA_DA_AUTORA },
      linha,
    ),
    CONTA_DE_TERCEIRO,
  );
  // Ramo 2 quando nao ha seletor.
  assert.equal(
    autorNaRevisaoEditorial({ autorDoPedido: CONTA_DE_TERCEIRO }, linha),
    CONTA_DE_TERCEIRO,
  );
  // Ramo 3 (`:691`-`:695`): o autor da linha.
  assert.equal(autorNaRevisaoEditorial({}, linha), CONTA_DA_AUTORA);

  assert.equal(autoriaPreservada(linha, CONTA_DA_AUTORA), true);
  assert.equal(autoriaPreservada(linha, CONTA_DA_EDITORA), false);
});

/* ── CA-8.3 · O IDENTIFICADOR ─────────────────────────────────────────────── */

test('CA-8.3: o identificador vazio do pendente e fixado na publicacao (`:4741`-`:4763`)', () => {
  const { contexto } = cenario();

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.anterior?.identificadorNaUrl, '');
  assert.equal(resultado.identificadorNaUrl, IDENTIFICADOR_DERIVADO);
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_name, IDENTIFICADOR_DERIVADO);
});

test('CA-8.3: o identificador fixado e UNICO, e o sufixo comeca em 2 (`:5561`)', () => {
  const { contexto } = cenario({ ocupados: [IDENTIFICADOR_DERIVADO] });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.identificadorNaUrl, `${IDENTIFICADOR_DERIVADO}-2`);
  // E e o que BR-MIGRAR-005 chama de *"o slug de um rascunho muda sozinho ao
  // publicar"*: a dispensa valia em `pending`, e deixou de valer.
  assert.equal(resultado.edicao?.gravacao?.identificadorPedido, '');
});

test('devolver ao autor NAO fixa identificador: a dispensa continua valendo', () => {
  const { contexto } = cenario();

  const resultado = devolverAoAutor(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.estado, 'draft');
  // `draft` esta na lista que dispensa unicidade (BR-MIGRAR-005), logo a coluna
  // continua vazia: ninguem reserva endereco de conteudo que nao esta no ar.
  assert.equal(resultado.identificadorNaUrl, '');
});

/* ── CA-8.4 · A DEVOLUCAO ─────────────────────────────────────────────────── */

test('CA-8.4: devolver volta o estado para rascunho sem perder o texto', () => {
  const { contexto, dados } = cenario();

  const resultado = devolverAoAutor(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'devolvido');
  assert.equal(resultado.estado, 'draft');
  // O corpo nao foi tocado porque ninguem o gravou: a mistura de
  // `wp_update_post()` conserva, chave por chave, o que a linha tinha
  // (`wp-includes/post.php:5367`).
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_content, CORPO_DA_AUTORA);
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_title, TITULO_DA_AUTORA);
  // E a autoria tambem: devolver nao transfere o texto para quem devolveu.
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.autoriaPreservada, true);

  // Uma escrita, e e um `UPDATE`.
  assert.equal(dados.escritas.length, 1);
  assert.ok(dados.escritas[0]?.texto.startsWith('UPDATE'));
});

test('CA-8.4: devolver com um ajuste no texto grava o ajuste, que e o passo 3 de UC-07', () => {
  const { contexto } = cenario();

  const resultado = devolverAoAutor(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { corpo: 'O texto com o ajuste da editora.' },
  });

  assert.equal(resultado.estado, 'draft');
  assert.equal(
    resultado.edicao?.gravacao?.colunas?.post_content,
    'O texto com o ajuste da editora.',
  );
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
});

test('devolver pelo painel sem o campo de discussao FECHA os comentarios (`:169`-`:175`)', () => {
  const { contexto } = cenario();

  const resultado = devolverAoAutor(contexto, { conteudoId: ID_DO_CONTEUDO });

  // O achado 5 de T015, por este caminho: o painel crava `closed` antes de a
  // gravacao ser chamada, e o valor cravado vence o `open` que a linha tinha e
  // o default do **tipo**. Nao e desta tarefa corrigir — e o legado.
  assert.equal(resultado.edicao?.gravacao?.colunas?.comment_status, 'closed');
  assert.equal(resultado.anterior?.estadoDeComentario, 'open');
});

/* ── CA-8.5 · A FAMILIA DE PAGINA ─────────────────────────────────────────── */

test('CA-8.5: a pagina de outra pessoa resolve na familia de pagina, sem um `if` sobre o nome', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
  });

  // Os mesmos **slots** (`edit_others_posts`, `edit_published_posts`) devolvem
  // outros **nomes**, porque quem os resolve e o registro do tipo
  // (`wp-includes/post.php:1884`).
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_pages',
  ]);

  const publicada = cenario({
    linhas: [
      linhaDeConteudo({
        post_type: TIPO_DE_PAGINA,
        post_status: 'publish',
        post_name: 'no-ar',
      }),
    ],
  }).contexto;

  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(publicada, ID_DO_CONTEUDO), [
    'edit_others_pages',
    'edit_published_pages',
  ]);
});

test('CA-8.5: quem tem a familia de `post` e nao a de `page` e recusado na pagina', () => {
  // A assimetria de `permissions.md` §3.2 que UC-07 cita: *"nenhuma capacidade
  // de pagina chega a autor ou colaborador — paginas sao territorio editorial"*.
  const { contexto, dados } = cenario({
    ator: REVISORA_SEM_PUBLICACAO,
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
  });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.capacidadesExigidas, ['edit_others_pages']);
  // A mensagem do painel e escolhida pelo **nome** do tipo (`:295`-`:299`), e o
  // painel nao declara codigo HTTP nesse ramo.
  assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA);
  assert.equal(resultado.recusa?.codigoHttp, null);
  assert.deepEqual(dados.escritas, []);
});

test('CA-8.5: a editora com as duas familias publica a pagina alheia e preserva a autoria', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
  });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.identificadorNaUrl, IDENTIFICADOR_DERIVADO);
});

/* ── CA-8.6 · A FUNCAO ESPECIAL ───────────────────────────────────────────── */

test('CA-8.6: a pagina de politica de privacidade SOMA a capacidade da funcao (`:282`)', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO },
  });

  // `$caps = array_merge( $caps, map_meta_cap( 'manage_privacy_options', ... ) )`
  // — e a traducao dela devolve `manage_options` fora da rede (BR-MIGRAR-042).
  // Somada, nao em lugar da outra: o ramo da pagina de politica nao faz `break`.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_pages',
    'manage_options',
  ]);
});

test('CA-8.6: o papel editorial nao tem essa capacidade, e a revisao e recusada', () => {
  const { contexto, dados } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO },
  });

  // A editora deste cenario tem as 14 capacidades de conteudo e **nao** tem
  // `manage_options`, que e de administrador — e e esse o criterio: *"exige a
  // capacidade dessa funcao, que o papel editorial pode nao ter"*.
  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.capacidadesExigidas, [
    'edit_others_pages',
    'manage_options',
  ]);
  assert.deepEqual(dados.escritas, []);
});

test('CA-8.6: em rede a mesma funcao especial exige `manage_network` (BR-MIGRAR-042)', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO },
    rede: { ativa: true, loginsDeSuperAdmin: [] },
  });

  // *"o alvo precisa resolver `MULTISITE` ANTES de autorizar"*: a lista muda com
  // o modo de instalacao, e nao com o ator.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_pages',
    'manage_network',
  ]);
});

test('a pagina de politica que NAO e o conteudo em maos nao soma nada', () => {
  const { contexto } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO + 1 },
  });

  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_pages',
  ]);
});

/* ── O QUE A OPERACAO NAO DECIDE ──────────────────────────────────────────── */

test('quem mexe no alheio e nao publica NAO e recusado: o estado e rebaixado (`:152`-`:159`)', () => {
  const { contexto } = cenario({ ator: REVISORA_SEM_PUBLICACAO });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  // O comentario do legado e literal: *"Change status from 'publish' to
  // 'pending' if user lacks permissions to publish"*. Transformar isso em
  // recusa apagaria a historia de US-7 e inventaria porta nesta.
  assert.equal(resultado.desfecho, 'gravado');
  assert.equal(resultado.estado, 'pending');
  assert.equal(resultado.edicao?.estadoPedido, 'publish');
  assert.equal(resultado.edicao?.rebaixado, true);
  // E o identificador continua vazio: o pendente nao reserva endereco (CA-7.4).
  assert.equal(resultado.identificadorNaUrl, '');
  // A autoria continua a da autora, que e o que CA-8.2 cobra em qualquer
  // desfecho que grave.
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
});

test('trocar o autor sem a capacidade do alheio e recusado com o codigo do painel (`:88`-`:105`)', () => {
  // A autora pode editar o **proprio** texto; o que ela nao pode e grava-lo
  // como sendo de outra pessoa. E o portao que `autorizarAutoriaDaSubmissao`
  // porta, e ele compara o autor **do pedido** com o ator.
  const { contexto, dados } = cenario({
    ator: AUTORA,
    linhas: [linhaDeConteudo({ post_author: CONTA_DA_AUTORA })],
  });

  const resultado = revisarEPublicar(contexto, {
    conteudoId: ID_DO_CONTEUDO,
    autorEscolhido: CONTA_DE_TERCEIRO,
  });

  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA);
  assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA);
  assert.deepEqual(dados.escritas, []);
});

test('conteudo inexistente fecha a porta antes de qualquer pergunta de capacidade', () => {
  const { contexto, dados } = cenario({ linhas: [] });

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_CONTEUDO_INEXISTENTE);
  assert.equal(resultado.recusa?.codigoHttp, 404);
  // Sem linha nao ha tipo, logo nao ha nome de capacidade a perguntar: a lista
  // sai vazia porque ninguem a calculou, e nao porque "permitido".
  assert.deepEqual(resultado.capacidadesExigidas, []);
  assert.deepEqual(dados.escritas, []);
  assert.equal(resultado.anterior, null);
});

test('nenhuma das duas operacoes envia e-mail: a porta de envio nao e tocada', () => {
  // UC-07, fluxo *Devolver ao autor*: *"Nenhuma notificacao e enviada ao autor:
  // o sistema nao avisa"*. A prova aqui e estrutural e e a mais forte possivel:
  // o contexto desta operacao **nao tem** porta de e-mail para tocar — ver o que
  // `revisao/contexto-de-revisao.ts` declara e o que ele nao declara.
  const { contexto } = cenario();

  assert.ok(!('email' in contexto));
  assert.ok(!('portas' in contexto));

  const devolvido = devolverAoAutor(contexto, { conteudoId: ID_DO_CONTEUDO });
  const publicado = revisarEPublicar(
    cenario().contexto,
    { conteudoId: ID_DO_CONTEUDO },
  );

  assert.equal(devolvido.desfecho, 'devolvido');
  assert.equal(publicado.desfecho, 'publicado');
});

test('nenhuma das duas grava registro de quem revisou (REQ-028 esta fora do pacote)', () => {
  const { contexto, dados } = cenario();

  revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  // UC-07, pos-condicao: *"nenhum registro de quem aprovou foi gravado"*. So a
  // linha de `posts` e escrita — nenhum `postmeta`, nenhuma trilha.
  assert.equal(dados.escritas.length, 1);
  assert.ok(dados.escritas[0]?.texto.startsWith('UPDATE wp_posts'));
  assert.ok(!dados.escritas.some((escrita) => escrita.texto.includes('postmeta')));
});

test('a lista traduzida nao e ordenada por esta tarefa: a ordem e a dos ramos', () => {
  const { contexto } = cenario({
    linhas: [
      linhaDeConteudo({
        post_type: TIPO_DE_PAGINA,
        post_status: 'publish',
        post_name: 'no-ar',
      }),
    ],
    paginas: { dePolitica: ID_DO_CONTEUDO },
  });

  // Tres nomes, e cada posicao vem de **um ramo**, na ordem em que o legado
  // empilha: o alheio em `:267`, o do estado em `:270`, a funcao especial no
  // `array_merge` de `:283`. A ordem e o valor que a area 2 da Decisao 2 compara
  // byte a byte, e por isso ela e afirmada por posicao, e nao por conjunto.
  const exigidas = capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO);

  assert.equal(exigidas.length, 3);
  assert.equal(exigidas[0], 'edit_others_pages');
  assert.equal(exigidas[1], 'edit_published_pages');
  assert.equal(exigidas[2], 'manage_options');
});
