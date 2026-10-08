/**
 * Testes de **US-2** — *"Classificar conteudo com os termos dos contextos
 * declarados para o seu tipo"* —, entrega de **T005**: *"o comportamento de US-2
 * existe e os criterios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema
 * novo"*.
 *
 * O que se afirma aqui, e por que desta forma:
 *
 * 1. **A sequencia de comandos**, porque o criterio desta area e *"efeito no
 *    banco"* (area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 *    sequencia de comandos"*). Nesta historia a sequencia e a propria regra: a
 *    substituicao integral e oito passos, e **cinco** deles so acontecem sob
 *    condicao. Por isso a porta de teste **registra consulta** em vez de simular
 *    banco, e por isso ha varias afirmacoes de que **nenhum comando sai**.
 * 2. **A `@cascata`**, que `parity_specs.md` torna obrigatoria em *"exclusao de
 *    conteudo e de termo"*: o que a lista enviada nao trouxe e removido da juncao
 *    e **o rotulo permanece**, com a contagem recalculada.
 * 3. **A `@invariante` de `AGG-Termo`**: o identificador que a juncao referencia
 *    e o `term_taxonomy_id`, e nunca o `term_id` — tres testes pegam
 *    exatamente isso, porque e o erro que a volta de `term_taxonomy_id` para
 *    `term_id` do legado convida a cometer.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `parity_tests/` e o oraculo executavel do legado **nao existe
 * nesta arvore** (`oracleAvailable: false`; levanta-lo e T001 da feature
 * `015-plataforma-transversal`). Cada afirmacao abaixo e **leitura estatica** do
 * legado, com `arquivo:linha` no comentario.
 *
 * ⚠️ **E nao sao os testes de `backlog/tests.md`**: os quatro casos `UT-034-1` a
 * `UT-034-4` sao **T006**, que roda em paralelo com esta tarefa e tem suite
 * propria.
 *
 * 🔴 **Dois testes desta suite fixam limites declarados** e dizem isso no nome: o
 * rotulo informado por nome em contexto plano, que o legado criaria e esta arvore
 * ainda nao cria (`rotulos-informados.ts`), e o fato de que, em contexto
 * hierarquico, o rotulo desconhecido e ignorado **com ou sem** a capacidade de
 * criar termo — porque o portao de `edit_terms` do legado nao esta neste caminho.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import { ehErroDeTermo, type ErroDeTermo } from '../rotulo-e-contexto/index.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import { casoDeAtribuicaoDeRotulo } from './caso-de-atribuicao-de-rotulo.js';
import { criterioDeContagem } from './contagem-de-uso.js';
import type {
  ColaboracaoDaClassificacao,
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from './escopo-de-vinculo-de-objeto.js';
import { PRIMEIRA_ORDEM_DO_VINCULO } from './substituir-vinculos.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const OBJETO = 42;

/**
 * A matriz de papeis do recorte que esta historia exercita.
 *
 * `assign_categories` e `assign_post_tags` **nao estao aqui**, e e esse o ponto:
 * elas nao estao em papel nenhum do legado tambem. Quem as resolve e
 * {@link casoDeAtribuicaoDeRotulo}, para `edit_posts`
 * (`wp-includes/capabilities.php:757`).
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      // `edit_categories` resolve para `manage_categories`, e e a capacidade de
      // CRIAR termo. Ver o teste 🔴 de CA-2.2.
      { capacidade: 'manage_categories', concedida: true },
    ],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
  {
    identificador: 'gerente_de_links',
    capacidades: [{ capacidade: 'manage_links', concedida: true }],
  },
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

/** Quantas vezes a colaboracao com BC-01 foi chamada, e com o que. */
interface ChamadasDoConteudo {
  readonly tiposPerguntados: string[];
  readonly contagensDeConteudo: {
    readonly rotuloNoContextoId: number;
    readonly tipos: readonly string[];
    readonly estados: readonly string[];
  }[];
  readonly contagensDeAnexo: {
    readonly rotuloNoContextoId: number;
    readonly estados: readonly string[];
  }[];
}

interface OpcoesDoConteudo {
  /** Os tipos que `post_type_exists()` reconhece. */
  readonly tiposRegistrados?: readonly string[];
  readonly publicados?: number;
  readonly anexos?: number;
}

/**
 * A colaboracao com BC-01, que no alvo e `posts` e aqui e um duble que registra
 * as chamadas — e o que permite afirmar **qual** criterio de `DB-TRG2` foi usado
 * sem inspecionar o SQL de outro contexto.
 */
function conteudoDeTeste(opcoes: OpcoesDoConteudo = {}): {
  colaboracao: ColaboracaoDoVinculo;
  chamadas: ChamadasDoConteudo;
} {
  const registrados = opcoes.tiposRegistrados ?? ['post', 'page', 'attachment'];
  const chamadas: ChamadasDoConteudo = {
    tiposPerguntados: [],
    contagensDeConteudo: [],
    contagensDeAnexo: [],
  };

  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado(tipo) {
      chamadas.tiposPerguntados.push(tipo);
      return registrados.includes(tipo);
    },
    contarConteudoPublicado(rotuloNoContextoId, tipos, estados) {
      chamadas.contagensDeConteudo.push({
        rotuloNoContextoId,
        tipos,
        estados,
      });
      return opcoes.publicados ?? 0;
    },
    contarAnexosPublicados(rotuloNoContextoId, estados) {
      chamadas.contagensDeAnexo.push({ rotuloNoContextoId, estados });
      return opcoes.anexos ?? 0;
    },
  };

  return { colaboracao: { conteudo }, chamadas };
}

function comAtorNaColaboracao(
  colaboracao: ColaboracaoDoVinculo,
  papel: string,
): ColaboracaoDaClassificacao {
  return { ...colaboracao, base: BASE, ator: ator(papel) };
}

function montar(prefixoDeTabela = 'wp_'): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
}

/** Uma linha da leitura fundida `SELECT t.*, tt.*` (`class-wp-term.php:132`). */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
  readonly name?: string;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: 'noticias',
    taxonomy: campos.taxonomy,
    description: '',
    parent: 0,
    count: 0,
    term_group: 0,
  };
}

/** Um vinculo que o objeto ja tem, do jeito que a leitura inversa o devolve. */
interface VinculoExistente {
  readonly rotuloId: number;
  readonly rotuloNoContextoId: number;
  readonly contexto: string;
  readonly nome?: string;
}

/**
 * Programa as respostas da leitura inversa: **um** comando com os `term_id` e,
 * depois, a leitura fundida de cada rotulo — que e o segundo passo que
 * `populate_terms()` faz (ver `substituir-vinculos.ts`).
 */
function programarConjunto(
  falsa: PortaDeDadosFalsa,
  vinculos: readonly VinculoExistente[],
): void {
  falsa.responder(vinculos.map((vinculo) => ({ term_id: vinculo.rotuloId })));
  for (const vinculo of vinculos) {
    falsa.responder([
      linhaDeTermo({
        term_id: vinculo.rotuloId,
        term_taxonomy_id: vinculo.rotuloNoContextoId,
        taxonomy: vinculo.contexto,
        ...(vinculo.nome === undefined ? {} : { name: vinculo.nome }),
      }),
    ]);
  }
}

/** A resposta de `idDoRotuloNoContexto`: o par existe, ou nao. */
function programarPar(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null
      ? []
      : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** A resposta de `vinculos.existe`. */
function programarVinculoJaGravado(
  falsa: PortaDeDadosFalsa,
  existe: boolean,
  rotuloNoContextoId = 1,
): void {
  falsa.responder(existe ? [{ term_taxonomy_id: rotuloNoContextoId }] : []);
}

function comoErro(valor: unknown): ErroDeTermo {
  assert.equal(ehErroDeTermo(valor), true);
  return valor as ErroDeTermo;
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/* ══════════════════════════════════════════════════════════════════════════
   CA-2.1 — "A lista de termos enviada substitui integralmente os vinculos
   daquele conteudo naquele contexto"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-2.1 a leitura do conjunto anterior e a cadeia de WP_Term_Query, sem ORDER BY', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [],
    contexto: 'category',
  });

  // Os cinco fragmentos de `class-wp-term-query.php`: `t.term_id` (`:671`), a
  // juncao com `term_taxonomy` (`:698`), a juncao com `term_relationships`
  // (`:701`), `tt.taxonomy IN` (`:457`) e `tr.object_id IN` (`:602`). Sem
  // `ORDER BY`, porque `wp_set_object_terms()` pede `orderby => none` (`:2872`).
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT t.term_id FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'INNER JOIN wp_term_relationships AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id ' +
      'WHERE tt.taxonomy IN (?) AND tr.object_id IN (?)',
    parametros: ['category', OBJETO],
  });
});

test('CA-2.1 o que a lista nao trouxe e removido, e o rotulo permanece (@cascata)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste({ publicados: 3 });

  // O objeto tem dois termos em `category`; a lista enviada traz **um**.
  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30); // o rotulo 12 existe em `category`
  programarVinculoJaGravado(falsa, true, 30); // e ja esta vinculado
  falsa.responder([{ term_id: 13 }]); // a volta de tt_id para term_id (`:2954`)
  programarPar(falsa, 31); // a remocao resolve o 13 outra vez

  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
  });

  assert.deepEqual(resultado, [30]);

  // ⚠️ O conjunto exato do que sumiu e do que ficou, que e o que o P5 cobra: o
  // `DELETE` alcanca **so** a juncao, e **nenhum comando toca `terms` nem
  // `term_taxonomy`** a nao ser para gravar a contagem.
  assert.deepEqual(textos(falsa.escritas), [
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 31]);
  assert.deepEqual(falsa.escritas[1]?.parametros, [3, 31]);
  assert.equal(
    falsa.escritas.some((escrita) => escrita.texto.includes('DELETE FROM wp_terms')),
    false,
  );

  // E a contagem recalculada e a do rotulo **removido**, nao a do que ficou: o
  // que ficou nao passou pelo `INSERT`, logo nao esta em `$new_tt_ids` (`:2946`).
  assert.deepEqual(
    chamadas.contagensDeConteudo.map((chamada) => chamada.rotuloNoContextoId),
    [31],
  );
});

test('CA-2.1 a sequencia de comandos e a do legado, passo a passo', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  programarConjunto(falsa, [
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30); // o rotulo 12 existe
  programarVinculoJaGravado(falsa, false); // e **nao** esta vinculado
  falsa.responder([{ term_id: 13 }]);
  programarPar(falsa, 31);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
  });

  // A ordem e a dos passos 1 a 7 de `wp_set_object_terms()`. Trocar dois de lugar
  // nao muda o estado final e muda o que a Decisao 2 compara.
  assert.deepEqual(textos(falsa.selecoes), [
    // 1. o conjunto anterior (`:2867`)
    'SELECT t.term_id FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'INNER JOIN wp_term_relationships AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id ' +
      'WHERE tt.taxonomy IN (?) AND tr.object_id IN (?)',
    // 1b. `populate_terms()` completa cada rotulo (`class-wp-term-query.php:1123`)
    'SELECT t.*, tt.* FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'WHERE t.term_id = ?',
    // 2. a leitura do par informado (`:2888`)
    'SELECT tt.term_taxonomy_id FROM wp_term_taxonomy AS tt ' +
      'INNER JOIN wp_terms AS t ON tt.term_id = t.term_id ' +
      'WHERE tt.taxonomy = ? AND t.term_id = ?',
    // 3. o vinculo ja existe? (`:2906`)
    'SELECT term_taxonomy_id FROM wp_term_relationships ' +
      'WHERE object_id = ? AND term_taxonomy_id = ?',
    // 6. a volta de `term_taxonomy_id` para `term_id` (`:2954`)
    'SELECT tt.term_id FROM wp_term_taxonomy AS tt ' +
      'WHERE tt.taxonomy = ? AND tt.term_taxonomy_id IN (?)',
    // 7. a remocao resolve o par outra vez (`:3058`)
    'SELECT tt.term_taxonomy_id FROM wp_term_taxonomy AS tt ' +
      'INNER JOIN wp_terms AS t ON tt.term_id = t.term_id ' +
      'WHERE tt.taxonomy = ? AND t.term_id = ?',
  ]);

  // 4, 5 e a escrita da remocao: o `INSERT` com DUAS colunas, a contagem do
  // vinculo novo, o `DELETE` do lote e a contagem do removido. **Duas**
  // recontagens por operacao, e nao uma.
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 30]);
});

test('CA-2.1 lista vazia remove todos os vinculos daquele contexto', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  falsa.responder([{ term_id: 12 }, { term_id: 13 }]);
  programarPar(falsa, 30);
  programarPar(falsa, 31);

  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [],
    contexto: 'category',
  });

  // *"Passing an empty array will remove all related terms"* — o docblock de
  // `wp_set_object_terms()`.
  assert.deepEqual(resultado, []);
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?, ?)',
    parametros: [OBJETO, 30, 31],
  });
});

test('CA-2.1 o numero 0 e a cadeia "0" sao lista vazia, como `empty()` no legado', () => {
  for (const informado of [0, '0'] as const) {
    const { falsa, modulo } = montar();
    const { colaboracao } = conteudoDeTeste();
    programarConjunto(falsa, [
      { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    ]);
    falsa.responder([{ term_id: 12 }]);
    programarPar(falsa, 30);

    modulo.substituirVinculosDoObjeto(colaboracao, {
      objetoId: OBJETO,
      rotulos: informado,
      contexto: 'category',
    });

    // E assim que a caixa de categoria da tela envia "nenhuma categoria": um
    // campo oculto com valor `0` (`wp-admin/includes/meta-boxes.php:661`).
    assert.deepEqual(falsa.escritas[0]?.texto, 'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)');
  }
});

test('CA-2.1 acrescentar nao le o conjunto anterior e nao remove nada', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
    acrescentar: true,
  });

  // As tres coisas que `if ( ! $append )` protege (`:2866`, `:2949`, `:2965`):
  // a leitura do conjunto anterior, a remocao da diferenca e a gravacao de ordem.
  assert.equal(
    falsa.selecoes.some((consulta) => consulta.texto.includes('tr.object_id IN')),
    false,
  );
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
});

test('CA-2.1 identificador que nao existe naquele contexto e saltado, sem criar nada', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);
  programarPar(falsa, null); // `term_exists()` nao encontrou o par

  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [999],
    contexto: 'category',
  });

  // *"Skip if a non-existent term ID is passed"* (`:2891`): `continue`, e nao
  // erro — e nenhuma escrita.
  assert.deepEqual(resultado, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.1 contexto nao registrado devolve invalid_taxonomy e NENHUM comando sai', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'resenha',
  });

  // `if ( ! taxonomy_exists( $taxonomy ) )` (`:2856`), antes de tudo.
  assert.equal(comoErro(resultado).codigo, 'invalid_taxonomy');
  assert.equal(comoErro(resultado).mensagem, 'Invalid taxonomy.');
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.1 @invariante a juncao referencia o term_taxonomy_id, nunca o term_id', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);
  programarPar(falsa, 30); // rotulo 12 -> rotulo no contexto 30
  programarVinculoJaGravado(falsa, false);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
  });

  // O `INSERT` grava `30`, e **nao** `12`. E a primeira invariante de `AGG-Termo`
  // e e o que o risco 3 de `plan.md` temia ver mudar.
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 30]);
});

test('CA-2.1 o rotulo compartilhado desaparece do conjunto anterior, como no legado', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  // Um rotulo em DOIS contextos validos: `get_term( $term_id )` sem contexto
  // devolve `ambiguous_term_id` (`class-wp-term.php:160`) e `populate_terms()`
  // descarta o que nao e termo (`class-wp-term-query.php:1141`).
  falsa.responder([{ term_id: 12 }]);
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 31, taxonomy: 'post_tag' }),
  ]);

  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [],
    contexto: 'category',
  });

  // Logo ele nao entra na diferenca e **nao e removido**: nenhum comando sai.
  assert.deepEqual(resultado, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.1 contexto ordenavel grava a ordem a partir de 1, num comando so', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste({ tiposRegistrados: [] });

  // Nenhum dos oito contextos do nucleo declara `sort`, e por isso o ramo so se
  // exercita com um contexto registrado por extensao — que e o unico jeito de ele
  // acontecer no legado tambem.
  modulo.contextos.registrar('galeria', {
    tiposDeObjeto: 'galeria_item',
    ordenar: true,
  });

  programarConjunto(falsa, []);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);
  programarPar(falsa, 31);
  programarVinculoJaGravado(falsa, false);
  // `galeria_item` nao e tipo de conteudo registrado, logo a recontagem dos dois
  // vinculos novos cai no criterio generico e consome duas leituras.
  falsa.responder([{ 'COUNT(*)': 1 }]);
  falsa.responder([{ 'COUNT(*)': 1 }]);
  // O conjunto final, com `orderby` no default `name` (`:2970`).
  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'galeria' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'galeria' },
  ]);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12, 13],
    contexto: 'galeria',
  });

  const ordenada = falsa.escritas.find((escrita) =>
    escrita.texto.includes('ON DUPLICATE KEY UPDATE'),
  );
  assert.deepEqual(ordenada, {
    texto:
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) VALUES ' +
      '(?, ?, ?),(?, ?, ?) ON DUPLICATE KEY UPDATE term_order = VALUES(term_order)',
    parametros: [OBJETO, 30, PRIMEIRA_ORDEM_DO_VINCULO, OBJETO, 31, 2],
  });

  // A segunda leitura inversa pede `ORDER BY t.name ASC`, e a primeira nao.
  const inversas = falsa.selecoes.filter((consulta) =>
    consulta.texto.includes('tr.object_id IN'),
  );
  assert.equal(inversas.length, 2);
  assert.equal(inversas[0]?.texto.includes('ORDER BY'), false);
  assert.equal(inversas[1]?.texto.endsWith('ORDER BY t.name ASC'), true);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-2.2 — "Criar termo novo pela tela de edicao exige a capacidade de criar
   termo daquele contexto; sem ela o rotulo desconhecido e ignorado, sem criar
   nada"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-2.2 em contexto hierarquico o rotulo desconhecido e ignorado, sem criar nada', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);

  // Autor tem `edit_posts`, logo tem `assign_categories` (traduzida), e **nao**
  // tem `manage_categories`, que e onde `edit_categories` cai.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: ['Novidades'],
    },
  );

  assert.deepEqual(resultado, { classificado: true, rotulosNoContextoIds: [] });

  // `wp_set_post_terms()` passa tudo por `intval` em contexto hierarquico
  // (`wp-includes/post.php:5212`), o nome vira `0`, e `term_exists( 0 )` sai
  // **sem consultar o banco** (`taxonomy.php:1651`). Nenhum `INSERT` em `terms`,
  // nenhum em `term_taxonomy`, nenhum vinculo.
  assert.deepEqual(falsa.escritas, []);
  assert.equal(
    falsa.selecoes.some((consulta) => consulta.texto.includes('t.term_id = ?')),
    false,
  );
});

test('🔴 CA-2.2 em contexto hierarquico o rotulo desconhecido e ignorado TAMBEM para quem pode criar termo', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);

  // Editor tem `manage_categories`, que e onde `edit_categories` — a capacidade
  // de CRIAR termo em `category` — resolve (`capabilities.php:749`).
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'editor'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: ['Novidades'],
    },
  );

  // E o resultado e o MESMO, e isso e o legado: o portao de `edit_terms` nao
  // esta no caminho de atribuicao, esta no caminho que **cria** o termo
  // (`_wp_ajax_add_hierarchical_term()`, `wp-admin/includes/ajax-actions.php:613`,
  // com `wp_die( -1 )`). A analise inteira, com o que falta decidir, esta no
  // cabecalho de `rotulos-informados.ts`.
  assert.deepEqual(resultado, { classificado: true, rotulosNoContextoIds: [] });
  assert.deepEqual(falsa.escritas, []);
});

test('🔴 CA-2.2 em contexto plano o rotulo informado por nome ainda nao e criado (T009)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'post_tag',
      rotulos: 'Brasil, Economia',
    },
  );

  // ⚠️ Aqui o legado criaria DOIS rotulos, porque `wp_set_object_terms()` chama
  // `wp_insert_term()` sem verificar capacidade nenhuma (`taxonomy.php:2896`) —
  // e e por isso que autor cria etiqueta no legado. `term_exists()` por apelido e
  // por nome (que depende de `sanitize_title()`) e `wp_insert_term()` sao de T009
  // e da feature 015; enquanto nao existirem, o nome e saltado e **nenhum comando
  // sai por ele**. O teste fixa o comportamento de hoje para que a diferenca nao
  // passe em silencio.
  assert.deepEqual(resultado, { classificado: true, rotulosNoContextoIds: [] });
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.2 a lista de nomes e separada por virgula, com as pontas aparadas', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);

  // Dois itens, e nao tres: a virgula final e aparada antes de separar
  // (`wp-includes/post.php:5206`). Com os dois resolvendo por identificador, o
  // numero de leituras do par e o que prova a contagem de itens.
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);
  programarPar(falsa, 31);
  programarVinculoJaGravado(falsa, false);

  modulo.classificarConteudo(comAtorNaColaboracao(colaboracao, 'author'), {
    objetoId: OBJETO,
    tipoDeObjeto: 'post',
    contexto: 'category',
    rotulos: ' 12, 13, ',
  });

  const paresLidos = falsa.selecoes.filter((consulta) =>
    consulta.texto.includes('WHERE tt.taxonomy = ? AND t.term_id = ?'),
  );
  assert.deepEqual(
    paresLidos.map((consulta) => consulta.parametros[1]),
    [12, 13],
  );
});

test('CA-2.2 sem a capacidade de atribuir, nada e classificado e nenhum comando sai', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'subscriber'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: [12],
    },
  );

  // `if ( current_user_can( $taxonomy_obj->cap->assign_terms ) )`
  // (`wp-includes/post.php:5105`): o legado simplesmente **nao chama**. Sem
  // mensagem, sem excecao, sem registro (P7).
  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'sem-capacidade-de-atribuir',
  });
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.2 assign_categories resolve para edit_posts: quem escreve classifica', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: [12],
    },
  );

  // `assign_categories` nao esta em papel nenhum da matriz: sem o caso de
  // traducao de `capabilities.php:757` **ninguem** classificaria nada.
  assert.deepEqual(resultado, {
    classificado: true,
    rotulosNoContextoIds: [30],
  });
  assert.deepEqual(
    casoDeAtribuicaoDeRotulo({
      capacidade: 'assign_categories',
      contaId: 7,
      argumentos: [],
      constantes: {},
      emRede: false,
    }),
    ['edit_posts'],
  );
  // E o caso e disjunto: devolve `null` para tudo que nao e dele.
  assert.equal(
    casoDeAtribuicaoDeRotulo({
      capacidade: 'manage_categories',
      contaId: 7,
      argumentos: [],
      constantes: {},
      emRede: false,
    }),
    null,
  );
});

test('CA-2.2 substituirVinculosDoObjeto nao cobra capacidade: o nucleo a chama sem ator', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarConjunto(falsa, []);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);

  // A colaboracao aqui **nao tem ator e nao tem matriz**, e isso compila: e a
  // chamada que `wp_publish_post()` faz no laco do termo padrao
  // (`wp-includes/post.php:5438`), sem ninguem autenticado.
  const resultado = modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
  });

  assert.deepEqual(resultado, [30]);
  assert.equal(falsa.escritas.length > 0, true);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-2.3 — "A contagem de uso de cada termo afetado fica correta ao fim da
   operacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-2.3 contexto so de conteudo usa o criterio de conteudo, com `publish` de fabrica', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste({ publicados: 5 });
  programarConjunto(falsa, []);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'category',
  });

  // `_update_post_term_count()` (`:4193`): um unico comando, porque `category`
  // nao tem anexo entre os tipos, e `post_statuses = array( 'publish' )`
  // (`:4214`).
  assert.deepEqual(chamadas.contagensDeConteudo, [
    { rotuloNoContextoId: 30, tipos: ['post'], estados: ['publish'] },
  ]);
  assert.deepEqual(chamadas.contagensDeAnexo, []);
  assert.deepEqual(falsa.escritas[1], {
    texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    parametros: [5, 30],
  });
});

test('CA-2.3 contexto que nao e so de conteudo cai no criterio generico', () => {
  const { falsa, modulo } = montar();
  // `link` nao e tipo de conteudo registrado, e e isso que decide
  // (`taxonomy.php:3637`).
  const { colaboracao, chamadas } = conteudoDeTeste({
    tiposRegistrados: ['post', 'page'],
  });
  programarConjunto(falsa, []);
  programarPar(falsa, 40);
  programarVinculoJaGravado(falsa, false);
  falsa.responder([{ 'COUNT(*)': 9 }]);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [20],
    contexto: 'link_category',
  });

  // `_update_generic_term_count()` (`:4272`): `COUNT(*)` da juncao, sem filtro,
  // e **nenhuma** travessia por `posts`.
  assert.deepEqual(chamadas.contagensDeConteudo, []);
  assert.deepEqual(chamadas.contagensDeAnexo, []);
  assert.deepEqual(falsa.selecoes.at(-1), {
    texto: 'SELECT COUNT(*) FROM wp_term_relationships WHERE term_taxonomy_id = ?',
    parametros: [40],
  });
  assert.deepEqual(falsa.escritas[1]?.parametros, [9, 40]);
});

test('CA-2.3 anexo conta pelo estado do pai, e as duas contagens somam', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste({
    publicados: 4,
    anexos: 3,
  });

  // Um contexto declarado para conteudo **e** para anexo, como `post_format`
  // nao e e como uma extensao declara. `attachment:image` perde o sufixo nos
  // dois cortes do legado (`:3633` e `:4199`).
  modulo.contextos.registrar('coletanea', {
    tiposDeObjeto: ['post', 'attachment:image'],
  });

  programarConjunto(falsa, []);
  programarPar(falsa, 50);
  programarVinculoJaGravado(falsa, false);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [25],
    contexto: 'coletanea',
  });

  assert.deepEqual(chamadas.contagensDeAnexo, [
    { rotuloNoContextoId: 50, estados: ['publish'] },
  ]);
  assert.deepEqual(chamadas.contagensDeConteudo, [
    { rotuloNoContextoId: 50, tipos: ['post'], estados: ['publish'] },
  ]);
  // `$count += ...` nas duas (`:4230` e `:4236`): 3 + 4.
  assert.deepEqual(falsa.escritas[1]?.parametros, [7, 50]);
});

test('CA-2.3 contexto que declara retorno de chamada nao emite comando de contagem', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste();

  modulo.contextos.registrar('resenha', {
    tiposDeObjeto: 'post',
    callbackDeContagem: 'minha_contagem',
  });

  programarConjunto(falsa, []);
  programarPar(falsa, 60);
  programarVinculoJaGravado(falsa, false);

  modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [30],
    contexto: 'resenha',
  });

  // `if ( ! empty( $taxonomy->update_count_callback ) ) { call_user_func(...) }`
  // (`:3630`): o legado delega a contagem inteira e nao emite comando proprio. O
  // despachante de nome de funcao PHP nao existe nesta arvore — ver
  // `contagem-de-uso.ts`.
  assert.deepEqual(chamadas.contagensDeConteudo, []);
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
  ]);
  const resenha = modulo.contextos.obter('resenha');
  assert.notEqual(resenha, null);
  assert.equal(
    criterioDeContagem(
      resenha as NonNullable<typeof resenha>,
      colaboracao,
    ),
    'retorno-de-chamada',
  );
});

test('CA-2.3 lista vazia de termos afetados nao emite comando de contagem', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste();

  const contou = modulo.recontarUsoDosRotulos(colaboracao, [], 'category');

  // `if ( empty( $terms ) ) { return false; }` (`:3597`), antes de tudo.
  assert.equal(contou, false);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(chamadas.tiposPerguntados, []);
});

test('CA-2.3 contexto nao registrado na recontagem grava zero, como o legado', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  const contou = modulo.recontarUsoDosRotulos(colaboracao, [30, 31], 'resenha');

  // `get_taxonomy()` devolve `false`, a lista de tipos vira vazia, a comparacao
  // de `array_filter` passa e o criterio de conteudo grava `0` em cada
  // identificador — o legado nao falha aqui, ele zera. Ver `contagem-de-uso.ts`.
  assert.equal(contou, true);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
      parametros: [0, 30],
    },
    {
      texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
      parametros: [0, 31],
    },
  ]);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-2.4 — "So contextos declarados para aquele tipo de conteudo aceitam
   vinculo"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-2.4 contexto nao declarado para o tipo recusa em silencio, sem comando', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  // `link_category` se aplica a `link`, e nao a `post`.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'editor'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'link_category',
      rotulos: [20],
    },
  );

  // `if ( is_object_in_taxonomy( $post_type, $tax ) )` (`post.php:5054`): um `if`,
  // e nada mais — sem mensagem, sem excecao, sem registro (P7, e a mesma doutrina
  // de CA-1.4 em `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`).
  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'tipo-de-objeto-nao-declarado',
  });
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
  assert.equal(ehErroDeTermo(resultado), false);
});

test('CA-2.4 o portao vem ANTES da capacidade, e a ordem e observavel', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  // Ator sem capacidade nenhuma **e** contexto que nao se aplica ao tipo: o
  // motivo e o do tipo, porque e o `if` que o legado avalia primeiro.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'subscriber'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'link_category',
      rotulos: [20],
    },
  );

  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'tipo-de-objeto-nao-declarado',
  });
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.4 contexto nao registrado recusa em silencio e nao devolve erro', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'editor'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'resenha',
      rotulos: [12],
    },
  );

  // `_doing_it_wrong()` mais `continue` (`post.php:5094`): aviso de uso indevido
  // para quem programa, e nao erro para quem usa. O contexto nao registrado nem
  // chega a `wp_set_object_terms()`, que e quem devolveria `invalid_taxonomy`.
  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'tipo-de-objeto-nao-declarado',
  });
  assert.deepEqual(falsa.escritas, []);
});

test('CA-2.4 o contexto declarado para o tipo do objeto aceita o vinculo, inclusive fora de conteudo', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste({ tiposRegistrados: ['post'] });
  programarConjunto(falsa, []);
  programarPar(falsa, 40);
  programarVinculoJaGravado(falsa, false);
  falsa.responder([{ 'COUNT(*)': 1 }]);

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'gerente_de_links'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'link',
      contexto: 'link_category',
      rotulos: [20],
    },
  );

  // ⚠️ `object_id` e polimorfico e aceita marcador: prende-lo a conteudo
  // recusaria hoje o que o legado aceita, e a resposta 2 proibe. `manage_links` e
  // a capacidade que `link_category` declara nas quatro, e ela e primitiva — nao
  // passa por atalho de nomenclatura nenhum.
  assert.deepEqual(resultado, {
    classificado: true,
    rotulosNoContextoIds: [40],
  });
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 40]);
});

/* ══════════════════════════════════════════════════════════════════════════
   A remocao como operacao publicada, e as tres ausencias de comando dela
   ══════════════════════════════════════════════════════════════════════════ */

test('a remocao emite UM comando para o lote, e recontagem depois dele', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste({ publicados: 2 });
  programarPar(falsa, 30);
  programarPar(falsa, 31);

  const removida = modulo.removerVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12, 13],
    contexto: 'category',
  });

  assert.equal(removida, true);
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?, ?)',
    parametros: [OBJETO, 30, 31],
  });
  // A recontagem vem **depois** do `DELETE` (`:3105`), e e por isso que a
  // contagem nova ja nao conta a linha apagada.
  assert.deepEqual(textos(falsa.escritas).slice(1), [
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
});

test('a remocao sem identificador resolvido devolve false, e false NAO e erro', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();
  programarPar(falsa, null);

  const removida = modulo.removerVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [999],
    contexto: 'category',
  });

  // `return false` (`:3110`): nenhum comando, e `wp_set_object_terms()` segue
  // adiante com esse `false` — um porte que o tratasse como erro interromperia a
  // substituicao integral onde o legado a conclui.
  assert.equal(removida, false);
  assert.equal(ehErroDeTermo(removida), false);
  assert.deepEqual(falsa.escritas, []);
});

test('a remocao em contexto nao registrado devolve invalid_taxonomy, sem comando', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  const removida = modulo.removerVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [12],
    contexto: 'resenha',
  });

  assert.equal(comoErro(removida).codigo, 'invalid_taxonomy');
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   As invariantes de escopo: nada aqui e estado de modulo (D-A)
   ══════════════════════════════════════════════════════════════════════════ */

test('duas composicoes nao compartilham o contexto registrado por extensao (D-A)', () => {
  const primeira = montar('wp_');
  const segunda = montar('wp_2_');
  const { colaboracao } = conteudoDeTeste({ tiposRegistrados: [] });

  primeira.modulo.contextos.registrar('galeria', {
    tiposDeObjeto: 'galeria_item',
  });

  programarConjunto(primeira.falsa, []);
  const naPrimeira = primeira.modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [],
    contexto: 'galeria',
  });
  const naSegunda = segunda.modulo.substituirVinculosDoObjeto(colaboracao, {
    objetoId: OBJETO,
    rotulos: [],
    contexto: 'galeria',
  });

  assert.deepEqual(naPrimeira, []);
  assert.equal(comoErro(naSegunda).codigo, 'invalid_taxonomy');
  // E o prefixo do site entra no nome da tabela: ele e dado, nao conexao.
  assert.match(String(primeira.falsa.selecoes[0]?.texto), /FROM wp_terms AS t/);
  assert.deepEqual(segunda.falsa.selecoes, []);
});
