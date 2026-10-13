/**
 * A entrega de **T004** da feature `005-retencao-e-descarte`: *"7 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-047-1, UT-047-2, UT-047-3, UT-047-4, UT-047-5, UT-047-6, UT-047-7), com o
 * mesmo dado de entrada, acao e resultado esperado. Os 2 testes de regra de
 * negocio (UT-047-6, UT-047-7) entram na mesma suite."*
 *
 * ---
 *
 * # Os sete casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-047 e a secao que comeca em `backlog/tests.md:725`, e os sete casos
 * sao as linhas `:731` a `:737`, com **ID, nome, tipo e prova**. Esta suite copia
 * os quatro campos de cada um, na ordem do catalogo, e cada `test()` leva o ID e
 * o nome do caso no titulo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | o que a prova e |
 * |---|---|---|---|
 * | `UT-047-1` | guarda o estado anterior e o instante junto do conteudo descartado | `feliz` | CA-1.1 |
 * | `UT-047-2` | retira o conteudo descartado de toda consulta publica mantendo o registro | `feliz` | CA-1.2 |
 * | `UT-047-3` | resolve a permissao de descartar conforme autoria e estado do conteudo | `feliz` | CA-1.3 |
 * | `UT-047-4` | recusa descartar uma versao anterior pela permissao de conteudo | `erro` | CA-1.4 |
 * | `UT-047-5` | exige a capacidade da funcao especial para descartar o conteudo que a declara | `erro` | CA-1.5 |
 * | `UT-047-6` | mantem o descarte reversivel com a memoria necessaria para desfaze-lo | `feliz` | a 1a regra de negocio de US-1 |
 * | `UT-047-7` | grava a memoria do descarte de modo que a restauracao nao precise adivinhar o estado anterior | `feliz` | a 2a regra de negocio de US-1 |
 *
 * As duas regras de negocio sao as que `spec.md` lista em US-1, e as duas saem de
 * UC-09: *"A lixeira e estado reversivel com memoria: o estado anterior e a hora
 * ficam gravados"* (o glossario de `domain.md` §1.1, que UC-09 cita) e
 * **ADR 0004** — *"lixeira com memoria e restauracao para rascunho"*.
 *
 * ---
 *
 * # Nao e a suite de criterio de T003, e a diferenca esta em TRES fixtures
 *
 * T003 entrega *"os criterios CA-1.1 a CA-1.5 passam"* e tem a suite dela em
 * `./us-1-descartar-conteudo.test.ts`, com conjuntos de capacidade escolhidos a
 * mao para isolar cada ramo, um tipo de conteudo inventado (`conteudo-comum`) com
 * o mapa de capacidade escrito campo por campo, e a porta falsa de T002, que
 * **registra comando e nao responde**. E o certo para afirmar criterio: um
 * conjunto de fabrica faria alguns ramos passarem por acidente, e uma porta que
 * responde esconderia o caso em que o legado nao emite comando nenhum.
 *
 * Esta suite troca as tres fixtures, e e so com isso que os dois casos de regra
 * de negocio podem ser afirmados:
 *
 * 1. **`{site}postmeta` e uma tabela em memoria por tras da porta**, que guarda a
 *    linha que o `INSERT` criou e a devolve ao `SELECT` seguinte, na forma de
 *    coluna (ver {@link comoColuna}). Sem isso **nao ha round trip**, e UT-047-6
 *    (*"a memoria necessaria para desfaze-lo"*) e UT-047-7 (*"a restauracao nao
 *    precisa adivinhar"*) nao teriam o que ler de volta: os dois casos sao sobre
 *    o que esta gravado **ser legivel**, nao sobre o comando ter saido. A tabela
 *    continua registrando todo comando, e cada caso afirma tambem a lista.
 * 2. **o mapa de capacidade do tipo e derivado de `capability_type`**, pelas
 *    mesmas linhas do legado ({@link capacidadesDerivadas},
 *    `wp-includes/post.php:2034`-`:2073`) — e e por isso que UT-047-5 pode exigir
 *    a familia **de pagina** sem que exista um `if` sobre o nome `page` em lugar
 *    algum, e que UT-047-4 pode usar o tipo `revision`, que declara
 *    `capability_type => 'post'` (`:138`) e portanto tem **a mesma familia** do
 *    conteudo em linha do tempo: a negacao nao pode vir da familia.
 * 3. **as concessoes de cada papel sao as de fabrica**, transcritas das rotinas
 *    de povoamento (`wp-admin/includes/schema.php:793`-`:829` e `:850`-`:881`)
 *    com a linha de cada concessao em comentario — e e por isso que UT-047-3 pode
 *    falar em *"autoria e estado"* sobre atores reais, e que UT-047-5 pode dizer
 *    que a familia inteira de pagina nao vence a funcao especial.
 *
 * ⚠️ **As concessoes de fabrica sao TRANSCRITAS, e nao importadas, e isso e a
 * regra de dependencia 3 de `target_architecture.md`** (*"`contextos/<a>/` →
 * `contextos/<b>/` por `import` no topo do modulo: proibido sempre, sem
 * excecao"*). A copia executavel da matriz vive em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`, que esta
 * suite **nao pode** importar; a copia de referencia e `schema.php`, e e dela que
 * estas listas saem, linha por linha. A conferencia da matriz transcrita contra a
 * matriz gravada e `ut-013`/`ut-014` da feature 001. E a mesma postura de
 * `conteudo/revisao-editorial/ut-026-revisar-e-publicar-de-outro-autor.test.ts`.
 *
 * ---
 *
 * # Como se confere, e o que ainda nao e executavel
 *
 * Cada afirmacao cita arquivo e linha do sistema analisado, e **todas as linhas
 * citadas aqui foram relidas nesta tarefa** contra a arvore 7.1.2 legivel em
 * disco. Nenhuma ancora de T003 precisou de correcao: `wp_trash_post()` abre em
 * `wp-includes/post.php:4084`, a primeira linha e `:4085`, os dois `add_post_meta`
 * sao `:4128` e `:4129`, e `register_post_status( 'trash', ... )` e `:732`.
 *
 * A spec de paridade que cobre este card e
 * `.specify/migration/parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature`,
 * cenario `@critico @invariante` *"A lixeira guarda o estado anterior em metadado
 * e restaurar devolve como rascunho"* (`:61`), e a metade dele que e **deste**
 * card e a primeira: *"as duas metades gravam o estado anterior em metadado, com
 * a mesma chave e o mesmo valor"*. A segunda metade e US-3 / T007.
 * `.specify/migration/parity_tests/04-retencao-e-coleta-da-lixeira.feature` (PT-004)
 * cobre o prazo e a coleta, que sao US-4 e US-5. **Nenhum dos dois e executavel
 * por esta suite:** a comparacao caso a caso exige o oraculo de pe, que e
 * `scripts/oraculo/` da feature 015 (resposta 16 de `questions.md`).
 *
 * ---
 *
 * # O que esta suite NAO afirma, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | a cascata que suspende os comentarios | **T005** (US-2). Aqui ela entra pelo contexto e so a **posicao** da chamada e observada |
 * | a restauracao como rascunho | **T007** (US-3). Esta suite prova que a memoria existe e e legivel, nao o que a restauracao faz com ela |
 * | o aviso de que apagar nao tem volta | **T009** (US-4). Com a lixeira desligada o legado apaga **sem avisar**, e UC-09 o registra |
 * | a coleta do que venceu, e a borda do prazo | **T011** (US-5), com UT-052-2 |
 * | o reparenteamento de filhos e anexos | **T017** (US-8) |
 * | a lixeira de midia | **ninguem**: a resposta 9 de `questions.md` decidiu que apagar midia continua definitivo, e REQ-051 esta bloqueado |
 * | o 500 do painel quando o descarte devolve falso (`wp-admin/post.php:273`-`:274`, *"Error in moving the item to Trash."*) | **a borda**: e tela, e nenhum criterio de US-1 o pede. Fica nomeado para que a proxima tarefa nao o leia como lacuna desta |
 * | a conferencia da matriz de fabrica contra o dado gravado | `ut-013`/`ut-014` da feature 001 |
 * | os outros sete cards de teste desta feature | T006, T008, T010, T012, T014, T016, T018 |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T004 exige.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  TIPO_DE_REVISAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
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
  textoDoParametro,
  type MarcadoresDeLixeiraDoConteudo,
} from '../armazenamento/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import type {
  Consulta,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import {
  ESTADO_DE_LIXEIRA,
  PROPRIEDADES_DO_ESTADO_DE_LIXEIRA,
  descartar,
  type ContextoDeDescarte,
} from './index.js';

/* ── O CENARIO DO CATALOGO ────────────────────────────────────────────────── */

/**
 * O tipo em linha do tempo: `register_post_type( 'post', ... )` com
 * `capability_type => 'post'` e `map_meta_cap => true`
 * (`wp-includes/post.php:23`, `:32` e `:33`).
 */
const TIPO_EM_LINHA_DO_TEMPO = 'post';

/**
 * O tipo hierarquico, que e o da funcao especial de UT-047-5:
 * `register_post_type( 'page', ... )` com `capability_type => 'page'` e
 * `map_meta_cap => true` (`wp-includes/post.php:58`, `:68` e `:69`).
 */
const TIPO_HIERARQUICO = 'page';

const ID_DO_CONTEUDO = 42;

/** Quem escreveu, e portanto quem descarta o proprio. */
const CONTA_DA_AUTORA = 7;
/** Quem descarta o alheio: o unico papel de fabrica que pode. */
const CONTA_DA_EDITORA = 3;
/** Quem escreve e nao publica. */
const CONTA_DO_COLABORADOR = 11;

/**
 * `time()` do cenario, em segundos inteiros UTC — o valor que vai para
 * `_wp_trash_meta_time` (`wp-includes/post.php:4129`).
 *
 * Relogio controlado, como o **P6** exige e como o Contexto de PT-004 pede
 * (*"um oraculo ... com relogio controlavel"*): nada nesta suite le hora real.
 */
const AGORA = 1762800000;

/** A cadeia decimal que a coluna `longtext` recebe — ver {@link comoColuna}. */
const AGORA_NA_COLUNA = '1762800000';

/* ── A TABELA `{site}postmeta`, QUE DEVOLVE O QUE FOI GRAVADO ─────────────── */

/** Uma linha de `{site}postmeta`, com as quatro colunas que esta feature toca. */
interface LinhaDeMetadado {
  readonly metaId: number;
  readonly postId: number;
  readonly chave: string;
  readonly valor: ValorDeColuna;
}

/**
 * O valor do parametro como a **coluna** o guarda.
 *
 * `meta_value` e `longtext` (`target_data_model.md`), e nenhum driver devolve
 * texto como numero: o instante do descarte, que o repositorio envia como inteiro
 * (`armazenamento/metadado.ts`, `paraColuna()`), volta da coluna como a cadeia
 * decimal dele. E **essa** cadeia que a coleta de T011 compara com
 * `meta_value < %d` (`wp-includes/functions.php:6979`), e por isso ela e o que
 * esta tabela guarda — uma tabela que devolvesse o numero esconderia a coercao
 * frouxa que decide quais linhas a coleta apaga.
 */
function comoColuna(valor: ValorDeParametro): ValorDeColuna {
  return typeof valor === 'number' ? String(valor) : valor;
}

interface PostmetaEmMemoria {
  readonly porta: PortaDeDados;
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
  /** As linhas que sobraram na tabela. */
  readonly linhas: readonly LinhaDeMetadado[];
}

/**
 * `{site}postmeta` em memoria, atras da porta de dados.
 *
 * Responde **por consulta** e nao por fila, como as suites de T015 e T017 de
 * BC-01 ja registraram: a operacao le e grava no mesmo passe, e programar por
 * fila seria programar o resultado. As duas unicas formas de leitura que o
 * repositorio de T002 emite estao aqui, e qualquer outra **estoura** — uma
 * consulta que esta tabela nao reconhece e uma consulta que ninguem releu contra
 * o legado.
 */
function postmetaEmMemoria(sequencia: string[]): PostmetaEmMemoria {
  const escritas: Consulta[] = [];
  const linhas: LinhaDeMetadado[] = [];
  let proximoMetaId = 1;

  return {
    porta: {
      prefixoDeTabela: 'wp_',

      selecionar(consulta) {
        // `SELECT $column, meta_key, meta_value FROM $table WHERE $column IN
        // (...) ORDER BY meta_id ASC` — a leitura por objeto de
        // `update_meta_cache()` (`wp-includes/meta.php:1148`), que e por onde
        // todo `get_post_meta()` passa.
        if (consulta.texto.startsWith('SELECT post_id,')) {
          const postId = Number(consulta.parametros[0]);
          sequencia.push(`selecionar:marcadores:${postId}`);
          return linhas
            .filter((linha) => linha.postId === postId)
            .sort((uma, outra) => uma.metaId - outra.metaId)
            .map((linha) => ({
              post_id: linha.postId,
              meta_key: linha.chave,
              meta_value: linha.valor,
            }));
        }

        // `SELECT meta_id ... WHERE meta_key = %s AND post_id = %d`, o passo que
        // `delete_metadata()` faz **antes** do `DELETE`
        // (`wp-includes/meta.php:456`-`:468`).
        if (consulta.texto.startsWith('SELECT meta_id')) {
          const chave = String(consulta.parametros[0]);
          const postId = Number(consulta.parametros[1]);
          sequencia.push(`selecionar:meta_id:${chave}`);
          return linhas
            .filter((linha) => linha.chave === chave && linha.postId === postId)
            .map((linha) => ({ meta_id: linha.metaId }));
        }

        throw new Error(`leitura fora do contrato: ${consulta.texto}`);
      },

      escrever(consulta) {
        escritas.push(consulta);

        if (consulta.texto.startsWith('INSERT INTO wp_postmeta')) {
          const metaId = proximoMetaId;
          proximoMetaId += 1;
          const chave = String(consulta.parametros[1]);
          linhas.push({
            metaId,
            postId: Number(consulta.parametros[0]),
            chave,
            valor: comoColuna(consulta.parametros[2] ?? null),
          });
          sequencia.push(`escrever:INSERT:${chave}`);
          return { linhasAfetadas: 1, idGerado: metaId };
        }

        if (consulta.texto.startsWith('DELETE FROM wp_postmeta')) {
          const alvos = consulta.parametros.map(Number);
          const antes = linhas.length;
          for (let i = linhas.length - 1; i >= 0; i -= 1) {
            const linha = linhas[i] as LinhaDeMetadado;
            if (alvos.includes(linha.metaId)) {
              linhas.splice(i, 1);
            }
          }
          sequencia.push('escrever:DELETE');
          return { linhasAfetadas: antes - linhas.length, idGerado: null };
        }

        throw new Error(`escrita fora do contrato: ${consulta.texto}`);
      },
    },
    escritas,
    linhas,
  };
}

/* ── A FAMILIA DE CAPACIDADE, DERIVADA DE `capability_type` ───────────────── */

/**
 * `get_post_type_capabilities()` — os nomes derivados de `capability_type`
 * (`wp-includes/post.php:2034`-`:2073`).
 *
 * **Derivados, e nao escritos a mao, porque e nisso que UT-047-5 consiste.** O
 * legado monta a base singular e a plural numa linha (`:2036`), usa a **singular**
 * nas tres meta-capacidades (`:2044`-`:2046`) e a **plural** em todas as
 * primitivas (`:2048`-`:2052` fora de `map_meta_cap()`, `:2058`-`:2063` dentro);
 * `create_posts` cai em `edit_posts` (`:2071`-`:2073`).
 *
 * ⚠️ **As chaves sao SLOTS, nao capacidades.** `delete_published_posts` e o nome
 * do slot em `post_type->cap`; o valor dele e `delete_published_posts` num tipo e
 * `delete_published_pages` noutro. A resolucao por autoria e estado le o slot e
 * devolve o valor — e e so por isso que ela nao precisa saber que `page` existe.
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
    // Primitivas usadas dentro de `map_meta_cap()` (`:2058`-`:2063`).
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
 * Os tres tipos de fabrica deste cenario, com o `capability_type` que o legado
 * declara para cada um.
 *
 * ⚠️ **`revision` declara `capability_type => 'post'`**
 * (`wp-includes/post.php:128`, `:138` e `:139`): a familia de capacidade dele e a
 * **mesma** do conteudo em linha do tempo. E o que torna UT-047-4 um teste de
 * verdade — a negacao nao pode estar vindo de o ator nao ter a capacidade certa,
 * porque e exatamente a mesma capacidade que ele acabou de exercer.
 */
function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao | null {
  if (nome === TIPO_DE_REVISAO) {
    return {
      nome,
      traduzMetaCapacidade: true,
      capacidades: capacidadesDerivadas(TIPO_EM_LINHA_DO_TEMPO),
    };
  }
  if (nome !== TIPO_EM_LINHA_DO_TEMPO && nome !== TIPO_HIERARQUICO) {
    return null;
  }
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: capacidadesDerivadas(nome),
  };
}

/**
 * Os estados de fabrica que este cenario alcanca, com os dois campos que a
 * traducao de capacidade le.
 *
 * Cada um sai de `create_initial_post_types()`: `publish` declara `public`
 * (`wp-includes/post.php:660`), `future` e `draft` declaram `protected` (`:674` e
 * `:688`), `private` declara `private` (`:718`), `trash` declara `internal`
 * (`:732`) e `inherit` (`:757`) e o do anexo e o da versao anterior.
 */
const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'future', publico: false, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'private', publico: false, privado: true },
  { nome: 'inherit', publico: false, privado: false },
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

/* ── AS CONCESSOES DE FABRICA, TRANSCRITAS DE `schema.php` ────────────────── */

/**
 * `editor` — as 11 concessoes de `populate_roles_160()`
 * (`wp-admin/includes/schema.php:793`-`:803`), os 8 niveis (`:804`-`:811`) e as
 * 15 de `populate_roles_210()` (`:850`-`:864`), que e a rotina que da pagina e
 * conteudo privado **so** a `administrator` e a `editor` (`:843`).
 *
 * ⚠️ **Sem `manage_options`**, que e de `administrator` — e e disso que UT-047-5
 * depende: a familia de exclusao de pagina esta inteira nesta lista, e mesmo
 * assim ela nao descarta a pagina inicial.
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
 * **Tem `delete_posts` e `delete_published_posts`, e nao tem
 * `delete_others_posts`.** E esse par que faz UT-047-3: o mesmo ator descarta o
 * proprio publicado e nao descarta o publicado de outra pessoa, sem que nada no
 * codigo compare nome de papel (**P3**).
 */
const CONCESSOES_DA_AUTORA: readonly string[] = [
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
 * ⚠️ **Tem `delete_posts` e nao tem `delete_published_posts`.** E o eixo do
 * **estado** de UT-047-3 isolado: o mesmo ator, o mesmo conteudo proprio, dois
 * estados e duas respostas.
 */
const CONCESSOES_DO_COLABORADOR: readonly string[] = [
  'edit_posts',
  'read',
  'level_1',
  'level_0',
  'delete_posts',
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

const AUTORA = atorComAsConcessoesDe(
  CONTA_DA_AUTORA,
  'author',
  CONCESSOES_DA_AUTORA,
);
const EDITORA = atorComAsConcessoesDe(
  CONTA_DA_EDITORA,
  'editor',
  CONCESSOES_DO_EDITOR,
);
const COLABORADOR = atorComAsConcessoesDe(
  CONTA_DO_COLABORADOR,
  'contributor',
  CONCESSOES_DO_COLABORADOR,
);

/* ── O CONTEXTO DA OPERACAO ───────────────────────────────────────────────── */

/** As tres paginas de funcao especial, como o cenario as declara. */
interface PaginasEspeciais {
  readonly inicial?: number;
  readonly deConteudos?: number;
  readonly dePolitica?: number;
}

interface OpcoesDoCenario {
  readonly ator: AtorDeAutorizacao;
  readonly estado?: string;
  readonly tipo?: string;
  readonly autorId?: number;
  readonly paginas?: PaginasEspeciais;
  /** Omitido, os 30 dias de fabrica. */
  readonly diasNaLixeira?: number;
}

interface Cenario {
  readonly contexto: ContextoDeDescarte;
  readonly base: BaseDeAutorizacao;
  readonly marcadores: MarcadoresDeLixeiraDoConteudo;
  /** A sequencia de tudo: comando, colaboracao e ponto de extensao. */
  readonly sequencia: readonly string[];
  readonly escritas: readonly Consulta[];
  readonly linhasDeMetadado: readonly LinhaDeMetadado[];
  /** A coluna `post_status` da linha de `{site}posts`, como ela esta agora. */
  estadoDaLinha(): string;
  /** Se a linha de `{site}posts` ainda existe. */
  linhaExiste(): boolean;
}

/**
 * Monta o contexto da operacao sobre a tabela em memoria.
 *
 * A linha de `{site}posts` e **mutavel**: `gravarEstado()` troca a coluna, como
 * `wp_update_post()` troca (`wp-includes/post.php:4131`), e e por isso que
 * UT-047-2 pode afirmar *"mantendo o registro"* e UT-047-7 pode perguntar a
 * capacidade **depois** do descarte, com o conteudo ja em `trash`.
 *
 * E {@link FonteDeConteudoNaAutorizacao.estadoAnteriorNaLixeira} le o marcador
 * **da mesma tabela**, por `marcadores.estadoAnterior()`, como
 * `get_post_meta( $post->ID, '_wp_trash_meta_status', true )` o le em
 * `wp-includes/capabilities.php:154`. Sem essa ligacao, UT-047-7 afirmaria um
 * valor que o teste mesmo plantou; com ela, o unico que escreveu aquele valor foi
 * o descarte.
 */
function cenario(opcoes: OpcoesDoCenario): Cenario {
  const sequencia: string[] = [];
  const postmeta = postmetaEmMemoria(sequencia);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(postmeta.porta);

  const linha = {
    id: ID_DO_CONTEUDO,
    tipo: opcoes.tipo ?? TIPO_EM_LINHA_DO_TEMPO,
    estado: opcoes.estado ?? 'publish',
    autorId: opcoes.autorId ?? CONTA_DA_AUTORA,
    existe: true,
  };

  const paginas = opcoes.paginas ?? {};

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      const id = typeof referencia === 'number' ? referencia : 0;
      if (id !== linha.id || !linha.existe) {
        return null;
      }
      return {
        id: linha.id,
        tipo: linha.tipo,
        estado: linha.estado,
        estadoParaLeitura: linha.estado,
        autorId: linha.autorId,
        paiId: 0,
      };
    },
    tipoDeConteudo: tipoRegistrado,
    estadoDeConteudo(nome) {
      return ESTADOS.find((estado) => estado.nome === nome) ?? null;
    },
    // `get_post_meta( $post->ID, '_wp_trash_meta_status', true )`
    // (`wp-includes/capabilities.php:154`), sobre a mesma tabela em que o
    // descarte grava.
    estadoAnteriorNaLixeira(conteudoId) {
      return marcadores.estadoAnterior(conteudoId);
    },
    paginaInicial: () => paginas.inicial ?? 0,
    paginaDeConteudos: () => paginas.deConteudos ?? 0,
    paginaDePoliticaDePrivacidade: () => paginas.dePolitica ?? 0,
  };

  const base: BaseDeAutorizacao = {
    // O retrato de `{prefixo}user_roles` chega vazio: toda a autorizacao vem das
    // concessoes individuais, caminho que `PERM-1` declara equivalente.
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte), traducaoDePrivacidade],
  };

  const contexto: ContextoDeDescarte = {
    base,
    ator: opcoes.ator,
    prazoDeRetencao:
      opcoes.diasNaLixeira === undefined
        ? PRAZO_DE_RETENCAO_DE_FABRICA
        : { diasNaLixeira: opcoes.diasNaLixeira },
    relogio: {
      agoraEmSegundos() {
        sequencia.push('relogio');
        return AGORA;
      },
    },
    armazenamento: { marcadoresDoConteudo: marcadores },
    conteudo: {
      obterPorId(conteudoId) {
        sequencia.push(`le-conteudo:${conteudoId}`);
        if (conteudoId !== linha.id || !linha.existe) {
          return null;
        }
        return { id: linha.id, estado: linha.estado };
      },
      gravarEstado(conteudoId, estado) {
        sequencia.push(`grava-estado:${conteudoId}:${estado}`);
        linha.estado = estado;
        return conteudoId;
      },
    },
    exclusaoDefinitiva: (conteudoId) => {
      sequencia.push(`apaga-em-definitivo:${conteudoId}`);
      linha.existe = false;
      return true;
    },
    suspenderComentarios: (conteudoId) => {
      sequencia.push(`suspende-comentarios:${conteudoId}`);
    },
  };

  return {
    contexto,
    base,
    marcadores,
    sequencia,
    escritas: postmeta.escritas,
    linhasDeMetadado: postmeta.linhas,
    estadoDaLinha: () => linha.estado,
    linhaExiste: () => linha.existe,
  };
}

/**
 * As capacidades que `delete_post` daquele conteudo exige.
 *
 * O ator e o do cenario, salvo quando outro e dado: a mesma base responde por
 * atores diferentes, e e isso que o segundo bloco de UT-047-7 precisa — a
 * pergunta e de quem **nao** descartou.
 */
function exigidasPara(
  cena: Cenario,
  ator: AtorDeAutorizacao = cena.contexto.ator,
): readonly string[] {
  return capacidadesExigidas(
    comAtor(cena.base, ator),
    'delete_post',
    ID_DO_CONTEUDO,
  );
}

/** Os verbos SQL emitidos, na ordem. */
function verbos(cena: Cenario): readonly string[] {
  return cena.escritas.map((escrita) => escrita.texto.split(' ')[0] ?? '');
}

/* ── UT-047-1 ─────────────────────────────────────────────────────────────── */

test('UT-047-1 guarda o estado anterior e o instante junto do conteudo descartado', () => {
  // Entrada: um conteudo publicado, da autora, com a lixeira no prazo de fabrica.
  const cena = cenario({ ator: AUTORA, estado: 'publish' });

  // Acao: a autora pede para mover o conteudo para a lixeira.
  const resultado = descartar(cena.contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'descartado');

  // Resultado: os dois marcadores do passo 3 de UC-09, *junto do conteudo* —
  // `add_post_meta( $post_id, '_wp_trash_meta_status', $previous_status )` e
  // `add_post_meta( $post_id, '_wp_trash_meta_time', time() )`
  // (`wp-includes/post.php:4128` e `:4129`), nessa ordem, no `postmeta` **do
  // identificador do conteudo**.
  assert.deepEqual(
    cena.linhasDeMetadado.map((linha) => ({
      postId: linha.postId,
      chave: linha.chave,
      valor: linha.valor,
    })),
    [
      {
        postId: ID_DO_CONTEUDO,
        chave: MARCADOR_DE_ESTADO_ANTERIOR,
        valor: 'publish',
      },
      {
        postId: ID_DO_CONTEUDO,
        chave: MARCADOR_DO_INSTANTE_DO_DESCARTE,
        valor: AGORA_NA_COLUNA,
      },
    ],
  );

  // O estado guardado e o que o conteudo **tinha**, e o instante e o do relogio
  // do descarte: os dois saem tambem no resultado da operacao, que e o que o
  // chamador le sem reconsultar.
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.equal(resultado.instanteDoDescarte, AGORA);

  // E os bytes que foram ao banco, que e o criterio da area 3 da Decisao 2 de
  // `parity_specs.md` (*"snapshot + sequencia de comandos"*).
  assert.equal(cena.escritas.length, 2);
  assert.equal(
    cena.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.equal(
    textoDoParametro(cena.escritas[1]?.parametros[2]),
    AGORA_NA_COLUNA,
  );
});

/* ── UT-047-2 ─────────────────────────────────────────────────────────────── */

test('UT-047-2 retira o conteudo descartado de toda consulta publica mantendo o registro', () => {
  // Entrada: o mesmo conteudo publicado.
  const cena = cenario({ ator: AUTORA, estado: 'publish' });

  // Acao: o descarte.
  descartar(cena.contexto, { conteudoId: ID_DO_CONTEUDO });

  // Resultado, metade "continua existindo": a coluna `post_status` passou a
  // `trash` e **nenhum registro foi apagado**. `wp_trash_post()` troca o estado
  // por `wp_update_post()` (`wp-includes/post.php:4131`) e nao emite `DELETE`
  // nenhum — nem na linha, nem no metadado.
  assert.equal(cena.linhaExiste(), true);
  assert.equal(cena.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  assert.deepEqual(verbos(cena), ['INSERT', 'INSERT']);
  assert.equal(cena.linhasDeMetadado.length, 2);

  // Resultado, metade "sai de toda consulta publica": quem a tira nao e um `if`
  // sobre o nome do estado, e o **registro** de `trash` — ausencia de `public` e
  // de `private`, mais `exclude_from_search` herdado de `internal`
  // (`register_post_status( 'trash', ... )`, `wp-includes/post.php:732`, com os
  // defaults de `:1507`, `:1511` e `:1515`). A clausula que le isso e da feature
  // 004.
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.publico, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.privado, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.consultavelPeloPublico, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.excluidoDaBusca, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeTodos, false);

  // ⚠️ E a que impede ler `internal` como "esconde em tudo": o descartado
  // **aparece** na barra de contagem por estado do painel, declarada explicita
  // contra o default (`:732`-`:745`, e o default em `:1519`). E por essa barra
  // que se chega a lixeira para restaurar (US-3).
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeEstados, true);
});

/* ── UT-047-3 ─────────────────────────────────────────────────────────────── */

test('UT-047-3 resolve a permissao de descartar conforme autoria e estado do conteudo', () => {
  // Eixo AUTORIA, com o estado fixo em publicado. O ramo e
  // `wp-includes/capabilities.php:149`: se o autor e o ator, a capacidade e a do
  // estado; se nao e, entra `delete_others_posts` e o estado **soma** uma
  // segunda (`:165`-`:173`).
  const proprioPublicado = cenario({ ator: AUTORA, estado: 'publish' });
  assert.deepEqual(exigidasPara(proprioPublicado), ['delete_published_posts']);
  assert.equal(
    descartar(proprioPublicado.contexto, { conteudoId: ID_DO_CONTEUDO })
      .desfecho,
    'descartado',
  );

  const alheioPublicado = cenario({
    ator: AUTORA,
    estado: 'publish',
    autorId: CONTA_DA_EDITORA,
  });
  assert.deepEqual(exigidasPara(alheioPublicado), [
    'delete_others_posts',
    'delete_published_posts',
  ]);
  // A autora de fabrica tem a do publicado e **nao** tem a do alheio.
  assert.equal(
    descartar(alheioPublicado.contexto, { conteudoId: ID_DO_CONTEUDO })
      .desfecho,
    'recusado',
  );
  assert.deepEqual([...alheioPublicado.escritas], []);

  // A editora tem as duas, e o mesmo pedido passa — sem que nada no caminho
  // compare nome de papel (P3).
  const pelaEditora = cenario({
    ator: EDITORA,
    estado: 'publish',
    autorId: CONTA_DA_AUTORA,
  });
  assert.equal(
    descartar(pelaEditora.contexto, { conteudoId: ID_DO_CONTEUDO }).desfecho,
    'descartado',
  );

  // Alheio e **privado** soma outra segunda (`:171`-`:173`).
  const alheioPrivado = cenario({
    ator: EDITORA,
    estado: 'private',
    autorId: CONTA_DA_AUTORA,
  });
  assert.deepEqual(exigidasPara(alheioPrivado), [
    'delete_others_posts',
    'delete_private_posts',
  ]);

  // Eixo ESTADO, com a autoria fixa no proprio: o colaborador tem
  // `delete_posts` e nao tem `delete_published_posts`, logo o mesmo ator
  // descarta o proprio rascunho e nao descarta o proprio publicado
  // (`:151`-`:152` contra `:162`).
  const rascunhoDoColaborador = cenario({
    ator: COLABORADOR,
    estado: 'draft',
    autorId: CONTA_DO_COLABORADOR,
  });
  assert.deepEqual(exigidasPara(rascunhoDoColaborador), ['delete_posts']);
  assert.equal(
    descartar(rascunhoDoColaborador.contexto, { conteudoId: ID_DO_CONTEUDO })
      .desfecho,
    'descartado',
  );

  const publicadoDoColaborador = cenario({
    ator: COLABORADOR,
    estado: 'publish',
    autorId: CONTA_DO_COLABORADOR,
  });
  assert.deepEqual(exigidasPara(publicadoDoColaborador), [
    'delete_published_posts',
  ]);
  assert.equal(
    descartar(publicadoDoColaborador.contexto, { conteudoId: ID_DO_CONTEUDO })
      .desfecho,
    'recusado',
  );

  // ⚠️ `future` cai no mesmo ramo que `publish`: a lista do legado e
  // `array( 'publish', 'future' )` (`:151`), e agendado exige a capacidade do
  // publicado.
  const agendadoDoColaborador = cenario({
    ator: COLABORADOR,
    estado: 'future',
    autorId: CONTA_DO_COLABORADOR,
  });
  assert.deepEqual(exigidasPara(agendadoDoColaborador), [
    'delete_published_posts',
  ]);
});

/* ── UT-047-4 ─────────────────────────────────────────────────────────────── */

test('UT-047-4 recusa descartar uma versao anterior pela permissao de conteudo', () => {
  // Entrada: uma versao anterior — tipo `revision`, estado `inherit` — e a
  // editora, que acabou de descartar o conteudo em linha do tempo com a **mesma**
  // familia de capacidade (`revision` declara `capability_type => 'post'`,
  // `wp-includes/post.php:138`).
  const versao = cenario({
    ator: EDITORA,
    tipo: TIPO_DE_REVISAO,
    estado: 'inherit',
    autorId: CONTA_DA_AUTORA,
  });

  // Resultado: `do_not_allow`, e a negacao sai da **traducao**, nao de um `if`
  // desta operacao — `if ( 'revision' === $post->post_type ) { $caps[] =
  // 'do_not_allow'; break; }` (`wp-includes/capabilities.php:108`-`:111`), que
  // interrompe o caso antes de a familia ser consultada.
  assert.deepEqual(exigidasPara(versao), [CAPACIDADE_NEGADA]);

  // Acao: o pedido de descarte.
  const resultado = descartar(versao.contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(resultado.desfecho, 'recusado');

  // E a recusa nao emite comando nenhum, nao troca a coluna e nao chama a
  // cascata: a pergunta vem antes de qualquer escrita, como nas tres
  // superficies (`wp-admin/post.php:261`).
  assert.deepEqual([...versao.escritas], []);
  assert.deepEqual([...versao.linhasDeMetadado], []);
  assert.equal(versao.estadoDaLinha(), 'inherit');
  assert.deepEqual(versao.sequencia, [`le-conteudo:${ID_DO_CONTEUDO}`]);
});

/* ── UT-047-5 ─────────────────────────────────────────────────────────────── */

test('UT-047-5 exige a capacidade da funcao especial para descartar o conteudo que a declara', () => {
  // Entrada: uma pagina publicada da editora, que tem a familia de exclusao de
  // pagina **inteira** (`delete_pages`, `delete_others_pages`,
  // `delete_published_pages`, `delete_private_pages`) e nao tem
  // `manage_options`.
  const comFuncaoEspecial: readonly PaginasEspeciais[] = [
    { inicial: ID_DO_CONTEUDO },
    { deConteudos: ID_DO_CONTEUDO },
  ];

  for (const paginas of comFuncaoEspecial) {
    const especial = cenario({
      ator: EDITORA,
      tipo: TIPO_HIERARQUICO,
      estado: 'publish',
      autorId: CONTA_DA_EDITORA,
      paginas,
    });

    // O ramo **troca** a familia e **para** o caso: `$caps[] = 'manage_options';
    // break;` (`wp-includes/capabilities.php:113`-`:118`). Toda a familia de
    // pagina junta nao descarta a pagina inicial nem a de conteudos.
    assert.deepEqual(exigidasPara(especial), ['manage_options']);
    assert.equal(
      descartar(especial.contexto, { conteudoId: ID_DO_CONTEUDO }).desfecho,
      'recusado',
    );
    assert.deepEqual([...especial.escritas], []);

    // Com a capacidade da funcao, o mesmo pedido passa.
    const comACapacidade = cenario({
      ator: atorComAsConcessoesDe(CONTA_DA_EDITORA, 'editor', [
        ...CONCESSOES_DO_EDITOR,
        'manage_options',
      ]),
      tipo: TIPO_HIERARQUICO,
      estado: 'publish',
      autorId: CONTA_DA_EDITORA,
      paginas,
    });
    assert.equal(
      descartar(comACapacidade.contexto, { conteudoId: ID_DO_CONTEUDO })
        .desfecho,
      'descartado',
    );
  }

  // A pagina de politica de privacidade **soma** em lugar de trocar: `$caps =
  // array_merge( $caps, map_meta_cap( 'manage_privacy_options', $user_id ) )`
  // (`wp-includes/capabilities.php:179`-`:181`), e fora de rede
  // `manage_privacy_options` resolve em `manage_options` (BR-MIGRAR-042).
  // Repare na primeira entrada: e `delete_published_pages`, a familia **de
  // pagina**, derivada e nao escrita a mao.
  const politica = cenario({
    ator: EDITORA,
    tipo: TIPO_HIERARQUICO,
    estado: 'publish',
    autorId: CONTA_DA_EDITORA,
    paginas: { dePolitica: ID_DO_CONTEUDO },
  });
  assert.deepEqual(exigidasPara(politica), [
    'delete_published_pages',
    'manage_options',
  ]);
  assert.equal(
    descartar(politica.contexto, { conteudoId: ID_DO_CONTEUDO }).desfecho,
    'recusado',
  );

  // ⚠️ E a pagina que e as duas coisas exige `manage_options` e **nao** soma
  // privacidade, porque o ramo de `:113` parou o caso antes do de `:179`. UC-09
  // registra as duas excecoes na tabela dele sem dizer que uma cancela a outra;
  // o codigo diz.
  const asDuas = cenario({
    ator: EDITORA,
    tipo: TIPO_HIERARQUICO,
    estado: 'publish',
    autorId: CONTA_DA_EDITORA,
    paginas: { inicial: ID_DO_CONTEUDO, dePolitica: ID_DO_CONTEUDO },
  });
  assert.deepEqual(exigidasPara(asDuas), ['manage_options']);
});

/* ── UT-047-6 — a 1a regra de negocio de US-1 ─────────────────────────────── */

test('UT-047-6 mantem o descarte reversivel com a memoria necessaria para desfaze-lo', () => {
  // *"A lixeira e estado reversivel com memoria: o estado anterior e a hora ficam
  // gravados"* — o glossario de `domain.md` §1.1 que UC-09 cita, e a decisao (a)
  // do ADR 0004.
  const cena = cenario({ ator: AUTORA, estado: 'publish' });

  descartar(cena.contexto, { conteudoId: ID_DO_CONTEUDO });

  // **Reversivel**: o registro continua la, com o estado trocado e nada apagado.
  // Nenhum `DELETE` saiu, nem da linha nem do metadado — a reversibilidade e
  // isso, e nao uma promessa de documentacao.
  assert.equal(cena.linhaExiste(), true);
  assert.equal(cena.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  assert.equal(
    verbos(cena).includes('DELETE'),
    false,
    'o descarte nao emite DELETE nenhum',
  );

  // **Com memoria**: os dois valores sao lidos de volta da mesma tabela em que
  // foram gravados, pelos leitores de T002 — e sao exatamente o estado que o
  // conteudo tinha e a hora em que ele foi descartado.
  assert.equal(cena.marcadores.estadoAnterior(ID_DO_CONTEUDO), 'publish');
  assert.equal(cena.marcadores.instanteDoDescarte(ID_DO_CONTEUDO), AGORA);

  // ⚠️ A hora sobrevive a volta pela coluna de texto. `_wp_trash_meta_time` vive
  // num `longtext`, e e sobre essa cadeia que a coleta de T011 compara
  // `meta_value < %d` (`wp-includes/functions.php:6979`): um porte que gravasse a
  // hora em outro formato perderia a coleta sem perder nenhum destes dois.
  assert.equal(
    cena.linhasDeMetadado[1]?.valor,
    AGORA_NA_COLUNA,
    'o instante chega a coluna como a cadeia decimal que a coleta compara',
  );

  // E a memoria e **do descarte**, nao do teste: nenhum outro ator escreveu
  // nestas duas linhas.
  assert.equal(cena.linhasDeMetadado.length, 2);
});

/* ── UT-047-7 — a 2a regra de negocio de US-1 ─────────────────────────────── */

test('UT-047-7 grava a memoria do descarte de modo que a restauracao nao precise adivinhar o estado anterior', () => {
  // ADR 0004, decisao (a), e a consequencia que o proprio ADR nomeia: *"a
  // autorizacao sobre item da lixeira e correta: quem so pode apagar rascunho
  // nao apaga da lixeira um post que estava publicado"*
  // (`wp-includes/capabilities.php:153`-`:159`).
  //
  // Quem le a memoria sao dois pontos do legado, e os dois leem a **mesma**
  // chave: `wp_untrash_post()`, na primeira coisa que faz depois de achar a linha
  // (`$previous_status = get_post_meta( $post_id, '_wp_trash_meta_status', true )`,
  // `wp-includes/post.php:4181`), e a traducao de capacidade (`:154` de
  // `capabilities.php`). Nenhum dos dois adivinha.

  // Caso A: publicado. Depois do descarte o conteudo esta em `trash`, e a
  // capacidade exigida continua sendo a do **publicado** — lida do marcador que o
  // descarte acabou de escrever.
  const publicado = cenario({ ator: AUTORA, estado: 'publish' });
  descartar(publicado.contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(publicado.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  // O valor que a restauracao vai ler em `wp-includes/post.php:4181`.
  assert.equal(publicado.marcadores.estadoAnterior(ID_DO_CONTEUDO), 'publish');
  assert.deepEqual(exigidasPara(publicado), ['delete_published_posts']);

  // Caso B: rascunho. Mesma operacao, mesmo ator, mesmo estado final `trash` — e
  // a capacidade exigida e **outra**, porque o marcador diz outra coisa.
  const rascunho = cenario({ ator: AUTORA, estado: 'draft' });
  descartar(rascunho.contexto, { conteudoId: ID_DO_CONTEUDO });

  assert.equal(rascunho.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  assert.equal(rascunho.marcadores.estadoAnterior(ID_DO_CONTEUDO), 'draft');
  assert.deepEqual(exigidasPara(rascunho), ['delete_posts']);

  // E o contrafactual, que e o que torna os dois acima uma afirmacao e nao uma
  // coincidencia: sem o marcador, `get_post_meta( ..., true )` devolve cadeia
  // vazia (`armazenamento/marcadores-de-lixeira.ts`), o ramo de `:155` nao
  // reconhece o estado como publicado e **os dois casos colapsam em
  // `delete_posts`** — quem so pode apagar rascunho apagaria da lixeira o que
  // estava publicado. E a memoria, e so ela, que separa os dois.
  const semMarcador = cenario({
    ator: AUTORA,
    estado: ESTADO_DE_LIXEIRA,
  });
  assert.equal(semMarcador.marcadores.estadoAnterior(ID_DO_CONTEUDO), '');
  assert.deepEqual(exigidasPara(semMarcador), ['delete_posts']);

  // ⚠️ O colaborador fecha o argumento do ADR, agora sobre dois conteudos que
  // ja estao na lixeira. Ele tem `delete_posts` e nao tem
  // `delete_published_posts`: apaga da lixeira o que era rascunho e **nao**
  // apaga o que era publicado — e sem a memoria apagaria os dois, porque os dois
  // estao no mesmo estado `trash`.
  const publicadoDele = cenario({
    ator: EDITORA,
    estado: 'publish',
    autorId: CONTA_DO_COLABORADOR,
  });
  // Descartado pela editora, que pode; a pergunta seguinte e do colaborador.
  descartar(publicadoDele.contexto, { conteudoId: ID_DO_CONTEUDO });
  assert.equal(publicadoDele.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  assert.deepEqual(exigidasPara(publicadoDele, COLABORADOR), [
    'delete_published_posts',
  ]);

  const rascunhoDele = cenario({
    ator: COLABORADOR,
    estado: 'draft',
    autorId: CONTA_DO_COLABORADOR,
  });
  descartar(rascunhoDele.contexto, { conteudoId: ID_DO_CONTEUDO });
  assert.equal(rascunhoDele.estadoDaLinha(), ESTADO_DE_LIXEIRA);
  assert.deepEqual(exigidasPara(rascunhoDele, COLABORADOR), ['delete_posts']);
});
