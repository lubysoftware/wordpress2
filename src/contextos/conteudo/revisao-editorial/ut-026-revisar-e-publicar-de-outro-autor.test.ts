/**
 * A entrega de **T018** da feature `002-autoria-e-publicacao`: *"8 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-026-1, UT-026-2, UT-026-3, UT-026-4, UT-026-5, UT-026-6, UT-026-7,
 * UT-026-8), com o mesmo dado de entrada, acao e resultado esperado. Os 2
 * testes de regra de negocio (UT-026-7, UT-026-8) entram na mesma suite."*
 *
 * ---
 *
 * # 🟢 O catalogo EXISTE nesta arvore, e os oito casos foram COPIADOS
 *
 * `backlog/tests.md` esta no repositorio, e o card REQ-026 e a secao que comeca
 * em `backlog/tests.md:415`: os oito casos sao as linhas `:421` a `:428`, com
 * **ID, nome, tipo e prova**. Esta suite copia os quatro campos de cada um, na
 * ordem do catalogo, e cada `test()` leva o ID e o nome do caso no titulo.
 *
 * ⚠️ **E e por isso que ela nao se parece com a de T018 da feature 001.** Ali
 * (`identidade-e-acesso/autorizacao/ut-015-permissao-sobre-objeto.test.ts`) o
 * catalogo ainda nao existia em disco e os sete casos foram **reconstruidos**
 * pela aritmetica de `tasks.md` — e o cabecalho de la declara a divida: *"se o
 * catalogo aparecer e um UT-015-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda"*. O catalogo apareceu. Aqui nao
 * se reconstroi nada, e nenhum caso desta suite foi inventado.
 *
 * | caso | nome, como o catalogo o escreve | tipo | o que a prova e |
 * |---|---|---|---|
 * | `UT-026-1` | soma a capacidade de mexer em conteudo alheio a exigida pelo estado | `feliz` | CA-8.1 |
 * | `UT-026-2` | mantem o autor original gravado ao publicar conteudo de outra pessoa | `feliz` | CA-8.2 |
 * | `UT-026-3` | fixa na publicacao o identificador que estava vazio no pendente de colaborador | `feliz` | CA-8.3 |
 * | `UT-026-4` | devolve ao autor voltando para rascunho sem perder o texto | `feliz` | CA-8.4 |
 * | `UT-026-5` | resolve o conteudo hierarquico numa familia de capacidades distinta da do conteudo em linha do tempo | `feliz` | CA-8.5 |
 * | `UT-026-6` | recusa o editor sem a capacidade declarada da funcao especial do conteudo | `erro` | CA-8.6 |
 * | `UT-026-7` | nega ao autor e ao colaborador qualquer capacidade de pagina | `erro` | a 1a regra de negocio de US-8 |
 * | `UT-026-8` | resolve capacidades diferentes para o pendente e para o publicado do mesmo autor | `feliz` | a 2a regra de negocio de US-8 |
 *
 * As duas regras de negocio sao as que `spec.md` lista em US-8, e as duas saem
 * de UC-07: *"Nenhuma capacidade de pagina chega a `author` ou `contributor`: a
 * assimetria com posts e deliberada"* (`permissions.md` §3.2) e *"A resolucao de
 * `edit_post` depende de quem e o autor e de em que estado o conteudo esta"*
 * (`permissions.md` §5.1, `PERM-3` / BR-MIGRAR-089).
 *
 * ---
 *
 * # Nao e a suite de criterio de T017, e a diferenca e de onde vem a fixture
 *
 * T017 entrega *"os criterios CA-8.1 a CA-8.6 passam"* e tem a suite dela em
 * `./us-8-revisar-e-publicar.test.ts`, com papeis montados a mao: conjuntos de
 * capacidade escolhidos para isolar cada ramo, e tipos de conteudo com o mapa de
 * capacidade escrito campo por campo. E o certo para afirmar criterio: um
 * conjunto de fabrica faria alguns ramos passarem por acidente.
 *
 * Esta suite troca as duas fixtures por **derivacao**, e e so com isso que os
 * dois casos de regra de negocio podem ser afirmados:
 *
 * 1. **o mapa de capacidade do tipo e derivado de `capability_type`**, pelas
 *    mesmas 22 linhas do legado ({@link capacidadesDerivadas},
 *    `wp-includes/post.php:2035`-`:2073`) — e e por isso que UT-026-5 pode dizer
 *    *"familia distinta"* sem que exista um `if` sobre o nome `page` em lugar
 *    algum;
 * 2. **as concessoes de cada papel sao as de fabrica**, transcritas das oito
 *    rotinas de povoamento (`wp-admin/includes/schema.php:750`-`:883`) com a
 *    linha de cada concessao em comentario — e e por isso que UT-026-7 pode
 *    dizer *"nenhuma capacidade de pagina chega ao autor nem ao colaborador"*.
 *
 * ⚠️ **As concessoes de fabrica sao TRANSCRITAS, e nao importadas, e isso e a
 * regra de dependencia 3 de `target_architecture.md`** (*"`contextos/<a>/` →
 * `contextos/<b>/` por `import` no topo do modulo: proibido sempre, sem
 * excecao"*). A copia executavel da matriz vive em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`, que esta
 * suite **nao pode** importar; a copia de referencia e `schema.php`, e e dela
 * que estas listas saem, linha por linha. A afirmacao que decide cada caso e
 * sempre a **recusa ou a gravacao** que a operacao produz, nao a lista
 * transcrita: a lista e a entrada do cenario, e a conferencia dela contra a
 * matriz gravada e `ut-013`/`ut-014` da feature 001.
 *
 * ---
 *
 * # Como se confere, e o que ainda nao e executavel
 *
 * Cada afirmacao cita arquivo e linha do sistema analisado, legivel em disco em
 * `~/Downloads/wordpress` (WordPress 7.1.2, a versao do pacote), e **todas as
 * linhas citadas aqui foram relidas nesta tarefa**. Duas delas corrigem o numero
 * que o cabecalho de T017 usa, e sao so numero — o ramo e o mesmo: a soma do
 * alheio esta em `capabilities.php:267`-`:276` (nao `:266`-`:275`), a reposicao
 * do autor em `wp-admin/includes/post.php:690`-`:694` (nao `:691`-`:695`) e a
 * derivacao da familia de capacidade em `wp-includes/post.php:2034`
 * (`get_post_type_capabilities()`; `:1884` e o bloco de documentacao de
 * `registered_post_type`).
 *
 * As duas specs de paridade que cobrem este card sao
 * `.specify/migration/parity_tests/07-autorizacao-por-capacidade.feature`,
 * cenario `@critico` *"Capacidade sobre objeto e traduzida, e todo caminho de
 * erro fecha a porta"* (`:71`, que abre com *"Dado um ator com papel de editor e
 * um conteudo de outro autor"*), e
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 * cenario `@critico` *"Rascunho pode ter slug duplicado, publicado nao — e o
 * slug muda sozinho ao publicar"* (`:55`). **Nenhuma das duas e executavel
 * hoje:** `parity_specs.md` registra que nao ha oraculo executavel nesta arvore,
 * e levanta-lo e T001 da feature 015 (a resposta 16 de `questions.md`). Enquanto
 * ele nao existir, arquivo e linha e o que esta suite tem para oferecer no lugar
 * da comparacao caso a caso.
 *
 * ---
 *
 * # O que esta suite NAO afirma, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o aviso ao autor na devolucao e na publicacao | **T019** (US-9) — e UC-07 diz o contrario: *"Nenhuma notificacao e enviada ao autor"*. A divergencia esta registrada na PARADA de `../portas/porta-de-email.ts` e nao e resolvida aqui |
 * | registrar quem revisou | **ninguem**: REQ-028 esta em `do-not-rewrite.md`, e UC-07 confirma — *"nenhum registro de quem aprovou foi gravado"* |
 * | a sanitizacao do corpo ajustado pela revisao | **ninguem**: REQ-030 esta em `do-not-rewrite.md` |
 * | a conferencia da matriz de fabrica contra o dado gravado | `ut-013`/`ut-014` da feature 001, que atravessam a opcao `{site}user_roles` |
 * | a protecao da pagina inicial, que UC-07 descreve na edicao e o legado tem so na exclusao | **ninguem**: o conflito esta no cabecalho de `./permissao-da-revisao-editorial.ts`, e CA-8.6 nao se apoia nele |
 * | os outros sete cards de teste desta feature | T004, T006, T008, T010, T012, T014, T016 |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T018 exige.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
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
  MENSAGEM_DE_RECUSA_DE_EDICAO,
  MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
  TIPO_DE_PAGINA,
  type ContextoDeRevisao,
} from '../revisao/index.js';
import {
  capacidadesDaEdicaoDesteConteudo,
  devolverAoAutor,
  revisarEPublicar,
} from './index.js';

/* ── O CENARIO DO CATALOGO ────────────────────────────────────────────────── */

/**
 * O tipo em linha do tempo, que UT-026-5 opoe ao hierarquico.
 *
 * `register_post_type( 'post', ... )` com `capability_type => 'post'`,
 * `map_meta_cap => true` e `hierarchical => false`
 * (`wp-includes/post.php:23`-`:36`).
 */
const TIPO_EM_LINHA_DO_TEMPO = 'post';

const ID_DO_CONTEUDO = 42;

/** Quem escreveu o texto — e quem tem de continuar constando no registro. */
const CONTA_DA_AUTORA = 7;
/** Quem revisa: o ator de UC-07. */
const CONTA_DA_EDITORA = 3;
/** Quem escreve e nao publica: o ator secundario de UC-07. */
const CONTA_DO_COLABORADOR = 11;

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** O mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';
/** A data gravada na linha, distinguivel de {@link AGORA_LOCAL}. */
const DATA_GRAVADA = '2026-10-01 09:00:00';

/** O texto que a autora escreveu. **UT-026-4 e sobre ele continuar ali.** */
const CORPO_DA_AUTORA = 'O texto que a autora escreveu, com <em>marcacao</em>.';
const TITULO_DA_AUTORA = 'Meu Texto Em Revisao';
/** `sanitize_title( 'Meu Texto Em Revisao' )` com a reducao desta suite. */
const IDENTIFICADOR_DERIVADO = 'meu-texto-em-revisao';

/**
 * A linha de `posts` do cenario: **pendente, de outra pessoa, com o campo de
 * identificador vazio** — o ponto de partida que UT-026-3 nomeia (*"o pendente
 * de colaborador"*) e que T007 grava para quem nao pode publicar
 * (`wp-includes/post.php:4745`-`:4750`).
 */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_CONTEUDO,
    post_author: CONTA_DA_AUTORA,
    post_date: DATA_GRAVADA,
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
    post_name: '',
    to_ping: '',
    pinged: '',
    post_modified: DATA_GRAVADA,
    post_modified_gmt: DATA_GRAVADA,
    post_content_filtered: '',
    post_parent: 0,
    guid: `https://exemplo.test/?p=${ID_DO_CONTEUDO}`,
    menu_order: 0,
    post_type: TIPO_EM_LINHA_DO_TEMPO,
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface PortaDeTeste {
  readonly porta: PortaDeDados;
  readonly escritas: Consulta[];
}

/**
 * A porta de dados desta suite: responde **por consulta**, e nao por fila.
 *
 * Mesma razao que T015 e T017 registram: a operacao faz varias leituras antes de
 * escrever, e algumas sao a mesma pergunta feita pelo legado em pontos
 * diferentes. Programar por fila seria programar o resultado.
 */
function portaDeDados(
  linhas: readonly LinhaDeResultado[],
  ocupados: readonly string[],
): PortaDeTeste {
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        // `SELECT post_name FROM $wpdb->posts WHERE post_name = %s ...`
        // (`wp-includes/post.php:5662`), o teste de colisao do identificador.
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
    escritas,
  };
}

/**
 * `get_post_type_capabilities()` — os 16 nomes derivados de `capability_type`
 * (`wp-includes/post.php:2035`-`:2073`).
 *
 * **Derivados, e nao escritos a mao, porque e nisso que UT-026-5 consiste.** O
 * legado monta a base singular e a plural numa linha (`:2036`), usa a **singular**
 * nas tres meta-capacidades (`:2044`-`:2046`) e a **plural** em todas as
 * primitivas (`:2048`-`:2063`); `create_posts` cai em `edit_posts` (`:2071`-
 * `:2073`). A familia de capacidade de pagina existe por isso, e por nada mais.
 *
 * ⚠️ **As chaves sao SLOTS, nao capacidades.** `edit_posts` e o nome do slot em
 * `post_type->cap`; o valor dele e `edit_posts` num tipo e `edit_pages` noutro.
 * A resolucao por autoria e estado le o slot e devolve o valor, e e so por isso
 * que ela nao precisa saber que `page` existe.
 */
function capacidadesDerivadas(base: string): Record<string, Capacidade> {
  const singular = base;
  const plural = `${base}s`;

  return {
    // Meta-capacidades, na base singular (`:2044`-`:2046`).
    edit_post: `edit_${singular}`,
    read_post: `read_${singular}`,
    delete_post: `delete_${singular}`,
    // Primitivas usadas fora de `map_meta_cap()` (`:2048`-`:2052`).
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    delete_posts: `delete_${plural}`,
    publish_posts: `publish_${plural}`,
    read_private_posts: `read_private_${plural}`,
    // Primitivas usadas dentro de `map_meta_cap()` (`:2058`-`:2063`), que so
    // entram quando `map_meta_cap` esta ligado.
    read: 'read',
    delete_private_posts: `delete_private_${plural}`,
    delete_published_posts: `delete_published_${plural}`,
    delete_others_posts: `delete_others_${plural}`,
    edit_private_posts: `edit_private_${plural}`,
    edit_published_posts: `edit_published_${plural}`,
    // `create_posts` cai em `edit_posts` quando ninguem o declara (`:2071`-`:2073`).
    create_posts: `edit_${plural}`,
  };
}

/**
 * Os dois tipos de fabrica que este cenario conhece, com o `capability_type` que
 * o legado declara para cada um: `post` (`wp-includes/post.php:32`) e `page`
 * (`:68`). Os dois tem `map_meta_cap => true` (`:33` e `:69`).
 */
function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao | null {
  if (nome !== TIPO_EM_LINHA_DO_TEMPO && nome !== TIPO_DE_PAGINA) {
    return null;
  }
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: capacidadesDerivadas(nome),
  };
}

/** As tres opcoes de pagina com funcao especial, como o cenario as pede. */
interface PaginasEspeciais {
  readonly inicial?: number;
  readonly deConteudos?: number;
  readonly dePolitica?: number;
}

/** A fonte que `map_meta_cap()` consulta, lendo a mesma tabela em memoria. */
function fonteDeConteudo(
  linhas: readonly LinhaDeResultado[],
  paginas: PaginasEspeciais,
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
    tipoDeConteudo: tipoRegistrado,
    estadoDeConteudo(nome) {
      const propriedades =
        PROPRIEDADES_DO_ESTADO_EDITORIAL[
          nome as keyof typeof PROPRIEDADES_DO_ESTADO_EDITORIAL
        ];
      return propriedades === undefined
        ? null
        : { nome, publico: propriedades.publico, privado: propriedades.privado };
    },
    // Nenhum caso deste card passa pela lixeira: o estado anterior ausente e
    // cadeia vazia, que e o que `get_post_meta( ..., true )` devolve.
    estadoAnteriorNaLixeira: () => '',
    paginaInicial: () => paginas.inicial ?? 0,
    paginaDeConteudos: () => paginas.deConteudos ?? 0,
    paginaDePoliticaDePrivacidade: () => paginas.dePolitica ?? 0,
  };
}

/* ── AS CONCESSOES DE FABRICA, TRANSCRITAS DE `schema.php` ────────────────── */

/**
 * `editor` — as 11 concessoes de `populate_roles_160()`
 * (`wp-admin/includes/schema.php:793`-`:803`), os 8 niveis (`:804`-`:811`) e as
 * 15 de `populate_roles_210()` (`:850`-`:864`), que e a rotina que da pagina e
 * conteudo privado **so** a `administrator` e a `editor` (`:843`).
 *
 * ⚠️ **Sem `manage_options`**, que e de `administrator` (`:766`) — e e disso que
 * UT-026-6 depende.
 */
const CONCESSOES_DO_EDITOR: readonly string[] = [
  'moderate_comments',
  'manage_categories',
  'manage_links',
  'upload_files',
  'unfiltered_html',
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
  'publish_posts',
  'edit_pages',
  'read',
  'level_7',
  'level_6',
  'level_5',
  'level_4',
  'level_3',
  'level_2',
  'level_1',
  'level_0',
  'edit_others_pages',
  'edit_published_pages',
  'publish_pages',
  'delete_pages',
  'delete_others_pages',
  'delete_published_pages',
  'delete_posts',
  'delete_others_posts',
  'delete_published_posts',
  'delete_private_posts',
  'edit_private_posts',
  'read_private_posts',
  'delete_private_pages',
  'edit_private_pages',
  'read_private_pages',
];

/**
 * `author` — as 5 concessoes de `populate_roles_160()` (`schema.php:815`-`:819`),
 * os 3 niveis (`:820`-`:822`) e as 2 de `populate_roles_210()` (`:875`-`:876`).
 *
 * **Nenhuma delas e de pagina**, e nenhuma das seis rotinas seguintes concede
 * nada a este papel (`:890`-`:969`, todas sobre `administrator`). E o lado do
 * autor na assimetria que UT-026-7 afirma.
 */
const CONCESSOES_DO_AUTOR: readonly string[] = [
  'upload_files',
  'edit_posts',
  'edit_published_posts',
  'publish_posts',
  'read',
  'level_2',
  'level_1',
  'level_0',
  'delete_posts',
  'delete_published_posts',
];

/**
 * `contributor` — as 2 concessoes de `populate_roles_160()`
 * (`schema.php:826`-`:827`), os 2 niveis (`:828`-`:829`) e a de
 * `populate_roles_210()` (`:881`).
 *
 * E o papel de quem escreve e nao publica, e e o autor do pendente de UC-06.
 */
const CONCESSOES_DO_COLABORADOR: readonly string[] = [
  'edit_posts',
  'read',
  'level_1',
  'level_0',
  'delete_posts',
];

/** Todo nome de capacidade de pagina que a matriz de fabrica conhece. */
const CAPACIDADES_DE_PAGINA: readonly string[] = [
  'edit_pages',
  'edit_others_pages',
  'edit_published_pages',
  'edit_private_pages',
  'publish_pages',
  'read_private_pages',
  'delete_pages',
  'delete_others_pages',
  'delete_published_pages',
  'delete_private_pages',
];

/**
 * Um ator com as concessoes de um papel, **gravadas individualmente**.
 *
 * Matriz vazia com concessao individual e estado do legado, nao atalho de teste:
 * `allcaps` funde o que vem do papel com o que esta gravado na conta, e o
 * individual sobrepoe (`PERM-1`, BR-MIGRAR-087). O nome do papel aparece em
 * `login` e em comentario, e **nenhuma decisao olha nome de papel** (P3).
 */
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

/** Quem revisa e publica o alheio. */
const EDITORA = atorComAsConcessoesDe(
  CONTA_DA_EDITORA,
  'editor',
  CONCESSOES_DO_EDITOR,
);
/** Quem escreveu o texto. */
const AUTORA = atorComAsConcessoesDe(
  CONTA_DA_AUTORA,
  'author',
  CONCESSOES_DO_AUTOR,
);
/** Quem escreve e nao publica. */
const COLABORADOR = atorComAsConcessoesDe(
  CONTA_DO_COLABORADOR,
  'contributor',
  CONCESSOES_DO_COLABORADOR,
);

/**
 * A matriz de papeis chega **vazia**, e o default e esse.
 *
 * `BaseDeAutorizacao.matriz` e o retrato de `{prefixo}user_roles` (ADR-0001);
 * aqui a autorizacao inteira vem das concessoes individuais, que e o caminho que
 * `PERM-1` declara equivalente. A rede entra inativa, que e o valor de fabrica.
 */
const BASE_SEM_PAPEL_GRAVADO: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  readonly linhas?: readonly LinhaDeResultado[];
  readonly ocupados?: readonly string[];
  readonly paginas?: PaginasEspeciais;
}

interface Cenario {
  readonly contexto: ContextoDeRevisao;
  readonly dados: PortaDeTeste;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const linhas = opcoes.linhas ?? [linhaDeConteudo()];
  const dados = portaDeDados(linhas, opcoes.ocupados ?? []);

  const contexto: ContextoDeRevisao = {
    ator: opcoes.ator ?? EDITORA,
    base: BASE_SEM_PAPEL_GRAVADO,
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    fonteDeConteudo: fonteDeConteudo(linhas, opcoes.paginas ?? {}),
    // `sanitize_key()`: caixa baixa, e so letra, digito, `_` e `-` passam. E a
    // reducao do que a funcao de `plataforma/formatacao/` fara (feature 015), e
    // nenhuma afirmacao desta suite e sobre o texto dela.
    sanitizarChave: (valor) => valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    // A fila de onde o editor abre o pendente e o **gatilho** de UC-07, e ela e
    // de T015: nenhum caso deste card a exercita.
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
    tipoDeConteudo: tipoRegistrado,
    // `register_post_type( 'page', ... )` com `hierarchical => true`
    // (`wp-includes/post.php:72`), contra `false` em `post` (`:36`).
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

/* ── UT-026-1 ─────────────────────────────────────────────────────────────── */

test('UT-026-1 soma a capacidade de mexer em conteudo alheio a exigida pelo estado (`feliz`)', () => {
  // Prova do catalogo: *"A autorizacao soma a capacidade de mexer em conteudo
  // alheio a capacidade exigida pelo estado do conteudo"* (CA-8.1). O ramo e
  // `wp-includes/capabilities.php:267`-`:276`, e a soma e literal: `$caps[] =
  // $post_type->cap->edit_others_posts;` (`:269`) e, **em seguida**, a do estado.
  const pendente = cenario().contexto;
  const publicado = cenario({
    linhas: [linhaDeConteudo({ post_status: 'publish', post_name: 'no-ar' })],
  }).contexto;
  const agendado = cenario({
    linhas: [linhaDeConteudo({ post_status: 'future', post_name: 'marcado' })],
  }).contexto;
  const privado = cenario({
    linhas: [linhaDeConteudo({ post_status: 'private', post_name: 'restrito' })],
  }).contexto;

  // Pendente nao e publicado, nem agendado, nem privado: nenhum dos dois `if`
  // de `:271` e `:273` entra, e a lista tem **um** nome.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(pendente, ID_DO_CONTEUDO), [
    'edit_others_posts',
  ]);

  // `in_array( $post->post_status, array( 'publish', 'future' ), true )`
  // (`:271`): os dois estados somam o **mesmo** segundo nome, e e o passo 2 de
  // UC-07 — *"edit_others_posts + edit_published_posts se publish ou future"*.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(publicado, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(agendado, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);

  // `elseif ( 'private' === $post->post_status )` (`:273`-`:274`).
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(privado, ID_DO_CONTEUDO), [
    'edit_others_posts',
    'edit_private_posts',
  ]);

  // ⚠️ A ordem e a dos ramos e nao se ordena: ela e o valor que o interceptador
  // de `map_meta_cap` recebe, e a area 2 da Decisao 2 o compara byte a byte.
  const doPrivado = capacidadesDaEdicaoDesteConteudo(privado, ID_DO_CONTEUDO);
  assert.equal(doPrivado[0], 'edit_others_posts');
  assert.equal(doPrivado[1], 'edit_private_posts');

  // E a soma e **conjuntiva**: `PERM-1` exige todas, nao qualquer uma. O editor
  // de fabrica tem as duas do privado, logo publica.
  assert.equal(
    revisarEPublicar(privado, { conteudoId: ID_DO_CONTEUDO }).desfecho,
    'publicado',
  );
});

/* ── UT-026-2 ─────────────────────────────────────────────────────────────── */

test('UT-026-2 mantem o autor original gravado ao publicar conteudo de outra pessoa (`feliz`)', () => {
  // Prova do catalogo: *"A publicacao mantem o autor original gravado no
  // registro"* (CA-8.2), que e o passo 6 de UC-07 e a pos-condicao dele.
  const { contexto, dados } = cenario();

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.estado, 'publish');
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.autoriaPreservada, true);
  // Quem revisou **nao** vai para a coluna, e e disso que o criterio fala:
  // *"sem me apropriar do trabalho dela"*.
  assert.notEqual(resultado.autorGravado, CONTA_DA_EDITORA);

  // A area 3 da Decisao 2 compara **efeito no banco**: o valor esta no comando.
  // Sao dois mecanismos somados — a reposicao do autor da linha
  // (`wp-admin/includes/post.php:690`-`:694`) e a mistura chave por chave de
  // `wp_update_post()` (`wp-includes/post.php:5367`).
  assert.equal(dados.escritas.length, 1);
  const escrita = dados.escritas[0];
  assert.ok(escrita !== undefined);
  assert.ok(escrita.texto.startsWith('UPDATE wp_posts'));
  assert.ok(escrita.parametros.includes(CONTA_DA_AUTORA));
  assert.ok(!escrita.parametros.includes(CONTA_DA_EDITORA));

  // E o texto da autora tambem chegou intacto a coluna: publicar o alheio nao
  // reescreve o que ninguem pediu para reescrever.
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_content, CORPO_DA_AUTORA);
});

/* ── UT-026-3 ─────────────────────────────────────────────────────────────── */

test('UT-026-3 fixa na publicacao o identificador que estava vazio no pendente de colaborador (`feliz`)', () => {
  // Prova do catalogo: *"O identificador de URL, vazio no pendente de
  // colaborador, e fixado na publicacao"* (CA-8.3).
  const { contexto } = cenario();

  // O ponto de partida: a coluna esta vazia porque `draft`, `pending` e
  // `auto-draft` tem licenca de nao ter nome (`wp-includes/post.php:4741`-
  // `:4750`), e quem nao pode publicar nao reserva endereco (`:4736`-`:4738`).
  const antes = cenario().contexto.armazenamento.conteudo.obterPorId(ID_DO_CONTEUDO);
  assert.equal(antes?.identificadorNaUrl, '');

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.anterior?.identificadorNaUrl, '');
  // `publish` nao esta na lista da licenca, logo `sanitize_title( $post_title )`
  // preenche o vazio (`:4747`).
  assert.equal(resultado.identificadorNaUrl, IDENTIFICADOR_DERIVADO);
  assert.equal(
    resultado.edicao?.gravacao?.colunas?.post_name,
    IDENTIFICADOR_DERIVADO,
  );

  // E o que foi fixado e **unico**: a dispensa de unicidade de
  // `wp_unique_post_slug()` valia em `pending` (`:5561`-`:5565`) e deixou de
  // valer. Com o nome ja ocupado, o sufixo comeca em 2 (`:5660`-`:5708`).
  const comColisao = cenario({ ocupados: [IDENTIFICADOR_DERIVADO] }).contexto;
  const segundo = revisarEPublicar(comColisao, { conteudoId: ID_DO_CONTEUDO });
  assert.equal(segundo.identificadorNaUrl, `${IDENTIFICADOR_DERIVADO}-2`);

  // ⚠️ Fixar e privilegio da **publicacao**, e nao da revisao: devolver para
  // rascunho deixa a coluna vazia, porque `draft` esta na lista da licenca.
  const devolvido = devolverAoAutor(cenario().contexto, {
    conteudoId: ID_DO_CONTEUDO,
  });
  assert.equal(devolvido.identificadorNaUrl, '');
});

/* ── UT-026-4 ─────────────────────────────────────────────────────────────── */

test('UT-026-4 devolve ao autor voltando para rascunho sem perder o texto (`feliz`)', () => {
  // Prova do catalogo: *"Devolver o conteudo ao autor volta o estado para
  // rascunho sem perder o texto"* (CA-8.4), que e o fluxo alternativo
  // *Devolver ao autor* de UC-07.
  const { contexto, dados } = cenario();

  const resultado = devolverAoAutor(contexto, { conteudoId: ID_DO_CONTEUDO });

  // O caminho e o seletor de estado — `<select name="post_status">` com a opcao
  // `draft` (`wp-admin/includes/meta-boxes.php:160`-`:162`) —, e ele so e
  // renderizado para quem pode publicar (`:129`): devolver e privilegio de quem
  // podia ter publicado.
  assert.equal(resultado.desfecho, 'devolvido');
  assert.equal(resultado.estado, 'draft');

  // *"sem perder o texto"*: o corpo e o titulo nao se perdem porque ninguem os
  // grava — a mistura de `wp_update_post()` conserva, chave por chave, o que a
  // linha tinha (`wp-includes/post.php:5367`).
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_content, CORPO_DA_AUTORA);
  assert.equal(resultado.edicao?.gravacao?.colunas?.post_title, TITULO_DA_AUTORA);
  // E devolver nao transfere a autoria para quem devolveu.
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
  assert.equal(resultado.autoriaPreservada, true);

  // Uma escrita, e so na linha de `posts`: UC-07 e literal na pos-condicao —
  // *"nenhum registro de quem aprovou foi gravado"* (REQ-028 esta em
  // `do-not-rewrite.md`).
  assert.equal(dados.escritas.length, 1);
  assert.ok(dados.escritas[0]?.texto.startsWith('UPDATE wp_posts'));
  assert.ok(!dados.escritas.some((escrita) => escrita.texto.includes('postmeta')));

  // ⚠️ **E nenhum aviso sai daqui**: UC-07 diz *"Nenhuma notificacao e enviada
  // ao autor: o sistema nao avisa"*, e a prova e estrutural — o contexto desta
  // operacao nao tem porta de envio para tocar. US-9 (T019) pede o contrario, e
  // a divergencia esta registrada em `../portas/porta-de-email.ts`, nao resolvida.
  assert.ok(!('email' in contexto));

  // Ajustar o texto ao devolver e o passo 3 de UC-07, e tambem e permitido: o
  // criterio fala do que acontece quando **nao** se mexe nele.
  const comAjuste = devolverAoAutor(cenario().contexto, {
    conteudoId: ID_DO_CONTEUDO,
    campos: { corpo: 'O texto com o ajuste da editora.' },
  });
  assert.equal(comAjuste.estado, 'draft');
  assert.equal(
    comAjuste.edicao?.gravacao?.colunas?.post_content,
    'O texto com o ajuste da editora.',
  );
  assert.equal(comAjuste.autorGravado, CONTA_DA_AUTORA);
});

/* ── UT-026-5 ─────────────────────────────────────────────────────────────── */

test('UT-026-5 resolve o conteudo hierarquico numa familia de capacidades distinta da do conteudo em linha do tempo (`feliz`)', () => {
  // Prova do catalogo: *"Conteudo hierarquico (pagina) resolve numa familia de
  // capacidades distinta da do conteudo em linha do tempo"* (CA-8.5).
  const emLinhaDoTempo = cenario().contexto;
  const hierarquico = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
  }).contexto;

  const daLinhaDoTempo = capacidadesDaEdicaoDesteConteudo(
    emLinhaDoTempo,
    ID_DO_CONTEUDO,
  );
  const doHierarquico = capacidadesDaEdicaoDesteConteudo(
    hierarquico,
    ID_DO_CONTEUDO,
  );

  // Mesma linha, mesmo estado, mesmo ator, mesmo **slot** — e outro nome.
  assert.deepEqual(daLinhaDoTempo, ['edit_others_posts']);
  assert.deepEqual(doHierarquico, ['edit_others_pages']);

  // *"distinta"* no sentido forte: as duas familias nao compartilham nenhum
  // nome, e nenhuma decisao olhou a cadeia `page` — quem trocou o nome foi
  // `capability_type` (`wp-includes/post.php:2036`, `:2049`).
  assert.equal(
    daLinhaDoTempo.some((capacidade) => doHierarquico.includes(capacidade)),
    false,
  );

  // E o mesmo vale para a capacidade que o estado soma: `edit_published_posts`
  // contra `edit_published_pages` (`:2063`).
  const publicadaHierarquica = cenario({
    linhas: [
      linhaDeConteudo({
        post_type: TIPO_DE_PAGINA,
        post_status: 'publish',
        post_name: 'no-ar',
      }),
    ],
  }).contexto;
  assert.deepEqual(
    capacidadesDaEdicaoDesteConteudo(publicadaHierarquica, ID_DO_CONTEUDO),
    ['edit_others_pages', 'edit_published_pages'],
  );

  // O editor de fabrica tem as duas familias (`schema.php:802` e `:850`-`:864`),
  // logo publica a pagina alheia preservando a autoria.
  const resultado = revisarEPublicar(hierarquico, { conteudoId: ID_DO_CONTEUDO });
  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.autorGravado, CONTA_DA_AUTORA);
});

/* ── UT-026-6 ─────────────────────────────────────────────────────────────── */

test('UT-026-6 recusa o editor sem a capacidade declarada da funcao especial do conteudo (`erro`)', () => {
  // Prova do catalogo: *"Conteudo com funcao especial declarada exige a
  // capacidade dessa funcao, que o papel editorial pode nao ter"* (CA-8.6).
  //
  // A funcao especial e a **pagina de politica de privacidade**, que e a que o
  // `case 'edit_post'` do legado tem (`wp-includes/capabilities.php:282`-`:284`):
  // `$caps = array_merge( $caps, map_meta_cap( 'manage_privacy_options', ... ) )`,
  // e essa traducao devolve `manage_options` fora da rede (BR-MIGRAR-042).
  const { contexto, dados } = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO },
  });

  // ⚠️ **Somada, nao em lugar da outra**: o ramo da pagina de politica nao faz
  // `break`, e por isso a lista tem os dois nomes.
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO), [
    'edit_others_pages',
    'manage_options',
  ]);

  const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

  // O editor de fabrica tem as 34 concessoes de `schema.php` e **nao** tem
  // `manage_options`, que e de `administrator` (`:766`) — e e exatamente *"a
  // capacidade dessa funcao, que o papel editorial pode nao ter"*.
  assert.equal(CONCESSOES_DO_EDITOR.includes('manage_options'), false);
  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA);
  assert.deepEqual(resultado.capacidadesExigidas, [
    'edit_others_pages',
    'manage_options',
  ]);
  // O portao vem antes de qualquer gravacao: nada foi escrito.
  assert.deepEqual(dados.escritas, []);
  assert.equal(resultado.estado, null);

  // E a funcao especial e do **objeto em maos**, nao do tipo: a mesma pagina,
  // quando a opcao aponta para outro registro, nao soma nada.
  const outraPagina = cenario({
    linhas: [linhaDeConteudo({ post_type: TIPO_DE_PAGINA })],
    paginas: { dePolitica: ID_DO_CONTEUDO + 1 },
  }).contexto;
  assert.deepEqual(capacidadesDaEdicaoDesteConteudo(outraPagina, ID_DO_CONTEUDO), [
    'edit_others_pages',
  ]);
  assert.equal(
    revisarEPublicar(outraPagina, { conteudoId: ID_DO_CONTEUDO }).desfecho,
    'publicado',
  );
});

/* ── UT-026-7 · REGRA DE NEGOCIO ──────────────────────────────────────────── */

test('UT-026-7 nega ao autor e ao colaborador qualquer capacidade de pagina (`erro`)', () => {
  // Prova do catalogo: *"Nenhuma capacidade de pagina chega a autor ou
  // colaborador: a assimetria e deliberada"* — a 1a regra de negocio de US-8,
  // de `permissions.md` §3.2, citada por UC-07 no fluxo *O conteudo e uma
  // pagina*: *"paginas sao territorio editorial"*.
  //
  // A assimetria mora numa linha: `populate_roles_210()` concede as 15
  // capacidades de pagina e de conteudo privado a `array( 'administrator',
  // 'editor' )` e a mais ninguem (`wp-admin/includes/schema.php:843`-`:865`).
  // Fora dela, `edit_pages` vai so a `administrator` (`:777`) e a `editor`
  // (`:802`), e as seis rotinas seguintes concedem exclusivamente a
  // `administrator` (`:890`-`:969`).
  for (const nome of CAPACIDADES_DE_PAGINA) {
    assert.equal(CONCESSOES_DO_AUTOR.includes(nome), false, nome);
    assert.equal(CONCESSOES_DO_COLABORADOR.includes(nome), false, nome);
  }

  // E o efeito, que e o que a regra afirma: a pagina esta fechada aos dois, nas
  // duas direcoes da autoria.
  const paginaDoColaborador = [
    linhaDeConteudo({
      post_type: TIPO_DE_PAGINA,
      post_author: CONTA_DO_COLABORADOR,
    }),
  ];
  const paginaDaAutora = [
    linhaDeConteudo({ post_type: TIPO_DE_PAGINA, post_author: CONTA_DA_AUTORA }),
  ];

  const casos = [
    // A **propria** pagina: o ramo do autor devolve o slot `edit_posts`, que
    // neste tipo vale `edit_pages` (`capabilities.php:265`).
    { ator: AUTORA, linhas: paginaDaAutora, exigidas: ['edit_pages'] },
    { ator: COLABORADOR, linhas: paginaDoColaborador, exigidas: ['edit_pages'] },
    // A pagina de **outra pessoa**: o ramo do alheio, `edit_others_pages`
    // (`:269`).
    { ator: AUTORA, linhas: paginaDoColaborador, exigidas: ['edit_others_pages'] },
    { ator: COLABORADOR, linhas: paginaDaAutora, exigidas: ['edit_others_pages'] },
  ];

  for (const caso of casos) {
    const { contexto, dados } = cenario({ ator: caso.ator, linhas: caso.linhas });

    assert.deepEqual(
      capacidadesDaEdicaoDesteConteudo(contexto, ID_DO_CONTEUDO),
      caso.exigidas,
      caso.ator.login,
    );

    const resultado = revisarEPublicar(contexto, { conteudoId: ID_DO_CONTEUDO });

    assert.equal(resultado.desfecho, 'recusado', caso.ator.login);
    // A mensagem do painel e escolhida pelo **nome** do tipo
    // (`wp-admin/includes/post.php:295`-`:299`).
    assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA);
    assert.deepEqual(dados.escritas, [], caso.ator.login);
  }

  // ⚠️ **A assimetria e com `post`, e e ai que ela se le**: a mesma autora, no
  // mesmo estado, com o tipo em linha do tempo, **passa** — e e por isso que a
  // negacao acima e sobre a familia de pagina, e nao sobre o papel.
  const emLinhaDoTempo = cenario({
    ator: AUTORA,
    linhas: [linhaDeConteudo({ post_author: CONTA_DA_AUTORA })],
  }).contexto;
  assert.deepEqual(
    capacidadesDaEdicaoDesteConteudo(emLinhaDoTempo, ID_DO_CONTEUDO),
    ['edit_posts'],
  );
  assert.notEqual(
    revisarEPublicar(emLinhaDoTempo, { conteudoId: ID_DO_CONTEUDO }).desfecho,
    'recusado',
  );
});

/* ── UT-026-8 · REGRA DE NEGOCIO ──────────────────────────────────────────── */

test('UT-026-8 resolve capacidades diferentes para o pendente e para o publicado do mesmo autor (`feliz`)', () => {
  // Prova do catalogo: *"A resolucao de edicao depende de quem e o autor e de em
  // que estado o conteudo esta"* — a 2a regra de negocio de US-8, que e `PERM-3`
  // / BR-MIGRAR-089 (`permissions.md` §5.1): *"nenhuma das 104 chamadas pergunta
  // por `edit_post`: todas perguntam pelo que o mapeamento devolveu"*.
  const pendenteDaAutora = [linhaDeConteudo({ post_author: CONTA_DA_AUTORA })];
  const publicadoDaAutora = [
    linhaDeConteudo({
      post_author: CONTA_DA_AUTORA,
      post_status: 'publish',
      post_name: 'no-ar',
    }),
  ];

  // Eixo 1 — **o estado**, com o autor fixo e o ator sendo ele.
  const noPendente = capacidadesDaEdicaoDesteConteudo(
    cenario({ ator: AUTORA, linhas: pendenteDaAutora }).contexto,
    ID_DO_CONTEUDO,
  );
  const noPublicado = capacidadesDaEdicaoDesteConteudo(
    cenario({ ator: AUTORA, linhas: publicadoDaAutora }).contexto,
    ID_DO_CONTEUDO,
  );

  // `else { $caps[] = $post_type->cap->edit_posts; }` (`capabilities.php:263`-
  // `:265`) contra `if ( in_array( ..., array( 'publish', 'future' ) ) ) {
  // $caps[] = $post_type->cap->edit_published_posts; }` (`:254`-`:255`).
  assert.deepEqual(noPendente, ['edit_posts']);
  assert.deepEqual(noPublicado, ['edit_published_posts']);
  // ⚠️ **No ramo do proprio a capacidade e TROCADA, nao somada** — e e a
  // assimetria com o ramo do alheio de UT-026-1, onde ela e somada.
  assert.notDeepEqual(noPendente, noPublicado);

  // Eixo 2 — **a autoria**, com o estado fixo. Mesma linha, outro ator.
  const doAlheioPendente = capacidadesDaEdicaoDesteConteudo(
    cenario({ ator: EDITORA, linhas: pendenteDaAutora }).contexto,
    ID_DO_CONTEUDO,
  );
  const doAlheioPublicado = capacidadesDaEdicaoDesteConteudo(
    cenario({ ator: EDITORA, linhas: publicadoDaAutora }).contexto,
    ID_DO_CONTEUDO,
  );

  assert.deepEqual(doAlheioPendente, ['edit_others_posts']);
  assert.deepEqual(doAlheioPublicado, [
    'edit_others_posts',
    'edit_published_posts',
  ]);
  assert.notDeepEqual(doAlheioPendente, noPendente);
  assert.notDeepEqual(doAlheioPublicado, noPublicado);

  // As quatro combinacoes de (quem pergunta, em que estado) dao quatro listas
  // distintas: a resolucao e funcao das duas coisas, e de nada mais.
  const quatro = [noPendente, noPublicado, doAlheioPendente, doAlheioPublicado];
  const distintas = new Set(quatro.map((lista) => lista.join('+')));
  assert.equal(distintas.size, 4);

  // E a consequencia observavel, que e o que o `feliz` do catalogo cobra: o
  // colaborador edita o proprio pendente e **deixa de poder** editar o mesmo
  // texto depois de publicado, porque `edit_published_posts` nao esta nas
  // concessoes dele (`schema.php:826`-`:827`).
  assert.equal(CONCESSOES_DO_COLABORADOR.includes('edit_posts'), true);
  assert.equal(CONCESSOES_DO_COLABORADOR.includes('edit_published_posts'), false);

  const proprioPendente = cenario({
    ator: COLABORADOR,
    linhas: [linhaDeConteudo({ post_author: CONTA_DO_COLABORADOR })],
  });
  const proprioPublicado = cenario({
    ator: COLABORADOR,
    linhas: [
      linhaDeConteudo({
        post_author: CONTA_DO_COLABORADOR,
        post_status: 'publish',
        post_name: 'no-ar',
      }),
    ],
  });

  // No pendente ele passa — e o estado grava `pending`, porque ele nao tem
  // `publish_posts` e o painel **rebaixa** em lugar de recusar
  // (`wp-admin/includes/post.php:152`-`:159`, CA-7.1).
  const aindaEmRevisao = revisarEPublicar(proprioPendente.contexto, {
    conteudoId: ID_DO_CONTEUDO,
  });
  assert.equal(aindaEmRevisao.desfecho, 'gravado');
  assert.equal(aindaEmRevisao.estado, 'pending');
  assert.equal(aindaEmRevisao.edicao?.rebaixado, true);

  // No publicado o portao fecha, e nada e escrito.
  const depoisDeNoAr = devolverAoAutor(proprioPublicado.contexto, {
    conteudoId: ID_DO_CONTEUDO,
  });
  assert.equal(depoisDeNoAr.desfecho, 'recusado');
  assert.equal(depoisDeNoAr.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_EDICAO);
  assert.deepEqual(depoisDeNoAr.capacidadesExigidas, ['edit_published_posts']);
  assert.deepEqual(proprioPublicado.dados.escritas, []);
});
