/**
 * Testes de **US-1** — *"Separar o rotulo de classificacao do contexto em que
 * ele classifica"* —, entrega de **T003**: *"o comportamento de US-1 existe e os
 * criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4 passam contra o sistema novo"*.
 *
 * O que se afirma aqui, e por que desta forma:
 *
 * 1. **A consulta que sai e a linha que entra**, porque o criterio desta area e
 *    *"efeito no banco"* (area 3 da Decisao 2 de `parity_specs.md`, que compara
 *    *"snapshot + sequencia de comandos"*). Por isso a porta de teste **registra
 *    consulta** em vez de simular banco, e por isso ha afirmacoes de que
 *    **nenhum comando sai**.
 * 2. **A ordem dos comandos**, que em duas operacoes de US-1 e a regra: na
 *    renomeacao os dois `UPDATE` saem sempre, nessa ordem; na remocao a contagem
 *    e feita **depois** do `DELETE` e e ela que decide o segundo comando.
 * 3. **As invariantes de `AGG-Termo`** (`@invariante` e obrigatoria em *"todo
 *    fluxo cujo aggregate tem invariante"*): o rotulo e um e os contextos sao
 *    muitos, e o identificador que a juncao referencia e o `term_taxonomy_id`.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `parity_tests/` e o oraculo executavel do legado **nao existe
 * nesta arvore** (`oracleAvailable: false`; levanta-lo e T001 da feature
 * `015-plataforma-transversal`). Cada afirmacao abaixo e **leitura estatica** do
 * legado, com `arquivo:linha` no comentario.
 *
 * ⚠️ **E nao sao os testes de `backlog/tests.md`**: os seis casos `UT-033-1` a
 * `UT-033-6` sao **T004**, que roda em paralelo com esta tarefa e tem suite
 * propria. Aqui se afirma o comportamento que T003 entrega; la se transcreve o
 * catalogo.
 *
 * 🔴 **Um teste desta suite pinca uma divergencia aberta** e diz isso no nome:
 * o rotulo compartilhado na renomeacao. A analise esta em `renomear-rotulo.ts`,
 * e **nao foi resolvida por esta tarefa**.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import { ehErroDeTermo, type ErroDeTermo } from './erro-de-termo.js';
import { removerRotuloDoContexto } from './remover-rotulo-do-contexto.js';

function montar(prefixoDeTabela = 'wp_'): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
}

/**
 * Uma linha da leitura fundida `SELECT t.*, tt.*`
 * (`wp-includes/class-wp-term.php:132`), com as nove colunas que o nucleo
 * conhece.
 */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly parent?: number;
  readonly count?: number;
  readonly term_group?: number;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: campos.slug ?? 'noticias',
    taxonomy: campos.taxonomy,
    description: campos.description ?? '',
    parent: campos.parent ?? 0,
    count: campos.count ?? 0,
    term_group: campos.term_group ?? 0,
  };
}

/** As duas linhas de um rotulo que serve `category` e `post_tag`: **um** rotulo. */
const ROTULO_EM_DOIS_CONTEXTOS: readonly LinhaDeResultado[] = [
  linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
  linhaDeTermo({ term_id: 12, term_taxonomy_id: 31, taxonomy: 'post_tag' }),
];

function comoErro(valor: unknown): ErroDeTermo {
  assert.equal(ehErroDeTermo(valor), true);
  return valor as ErroDeTermo;
}

/* ══════════════════════════════════════════════════════════════════════════
   CA-1.1 — "Um rotulo existe uma vez e pode pertencer a mais de um contexto
   de classificacao ao mesmo tempo"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-1.1 um rotulo em dois contextos e UMA linha de rotulo e DUAS de contexto', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);

  const emCategoria = modulo.obterTermo(12, 'category');

  // A cadeia e a de `WP_Term::get_instance()`
  // (`wp-includes/class-wp-term.php:132`), **sem `LIMIT 1`**: o comentario do
  // legado diz por que — "Grab all matching terms, in case any are shared
  // between taxonomies."
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT t.*, tt.* FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'WHERE t.term_id = ?',
    parametros: [12],
  });

  // Uma leitura, duas linhas, e o que distingue as duas e o contexto e o
  // `term_taxonomy_id` — o nome, o slug e o agrupamento sao os mesmos, porque
  // moram na linha de `terms`. E a regra de negocio de US-1: "o mesmo Term vive
  // em duas taxonomias como duas linhas de vinculo e uma de rotulo".
  assert.deepEqual(emCategoria, {
    rotuloId: 12,
    rotuloNoContextoId: 30,
    nome: 'Noticias',
    slug: 'noticias',
    contexto: 'category',
    descricao: '',
    rotuloPaiId: 0,
    contagemDeUso: 0,
    grupoDeSinonimos: 0,
  });
});

test('CA-1.1 o mesmo rotulo lido pelo outro contexto devolve o outro `term_taxonomy_id`', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);

  const emEtiqueta = modulo.obterTermo(12, 'post_tag');

  // Mesmo rotulo, mesmo nome, outro identificador de rotulo-no-contexto. E este
  // segundo numero que a juncao referencia (`../armazenamento/vinculo.ts`), e e
  // ele que faz a mesma juncao servir o mesmo rotulo em dois contextos sem
  // ambiguidade.
  assert.equal(emEtiqueta !== null && !ehErroDeTermo(emEtiqueta), true);
  assert.deepEqual(
    emEtiqueta !== null && !ehErroDeTermo(emEtiqueta)
      ? [emEtiqueta.rotuloId, emEtiqueta.rotuloNoContextoId, emEtiqueta.nome]
      : null,
    [12, 31, 'Noticias'],
  );
});

test('CA-1.1 sem contexto pedido, rotulo compartilhado entre dois contextos validos e `ambiguous_term_id`', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);

  const erro = comoErro(modulo.obterTermo(12));

  // `wp-includes/class-wp-term.php:160`. A mensagem **nao** termina em ponto, e
  // o `dado` e o identificador do rotulo — o terceiro argumento de `WP_Error`.
  assert.equal(erro.codigo, 'ambiguous_term_id');
  assert.equal(erro.mensagem, 'Term ID is shared between multiple taxonomies');
  assert.equal(erro.dado, 12);
});

test('CA-1.1 rotulo compartilhado so com contexto nao registrado devolve a linha valida', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
    linhaDeTermo({
      term_id: 12,
      term_taxonomy_id: 99,
      taxonomy: 'resenha-de-extensao-desativada',
    }),
  ]);

  const termo = modulo.obterTermo(12);

  // "If the term is shared only with invalid taxonomies, return the one valid
  // term" (`class-wp-term.php:152`-`:164`): a linha de contexto nao registrado e
  // **ignorada**, nao acusa ambiguidade e nao recusa a leitura.
  assert.equal(
    termo !== null && !ehErroDeTermo(termo) ? termo.contexto : null,
    'category',
  );
});

test('CA-1.1 linha unica cujo contexto ninguem registrou devolve `invalid_taxonomy`', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 99, taxonomy: 'resenha' }),
  ]);

  const erro = comoErro(modulo.obterTermo(12));

  // `class-wp-term.php:172`-`:174`. A linha e **tolerada** no armazenamento e
  // recusada na leitura — e a assimetria que
  // `../armazenamento/rotulo-no-contexto.ts` descreve no cabecalho.
  assert.equal(erro.codigo, 'invalid_taxonomy');
  assert.equal(erro.mensagem, 'Invalid taxonomy.');
  assert.equal(erro.dado, null);
});

test('CA-1.1 rotulo inexistente e `null`, e identificador vazio e `invalid_term`', () => {
  const { falsa, modulo } = montar();

  // Nenhuma linha devolvida: `if ( ! $terms ) { return false; }`
  // (`class-wp-term.php:133`), que `get_term()` traduz em `null`
  // (`wp-includes/taxonomy.php:1001`). Ausencia **nao** e erro.
  assert.equal(modulo.obterTermo(999, 'category'), null);
  assert.equal(falsa.selecoes.length, 1);

  // `if ( empty( $term ) )` (`:978`): o zero e vazio, e nao chega ao banco.
  const erro = comoErro(modulo.obterTermo(0, 'category'));
  assert.equal(erro.codigo, 'invalid_term');
  assert.equal(erro.mensagem, 'Empty Term.');
  assert.equal(falsa.selecoes.length, 1);
});

test('CA-1.1 contexto pedido nao registrado recusa ANTES de ler o banco', () => {
  const { falsa, modulo } = montar();

  const erro = comoErro(modulo.obterTermo(12, 'resenha'));

  // `if ( $taxonomy && ! taxonomy_exists( $taxonomy ) )`
  // (`wp-includes/taxonomy.php:982`): a guarda e leitura de memoria, porque o
  // contexto nao e entidade gravada. Nenhuma consulta sai.
  assert.equal(erro.codigo, 'invalid_taxonomy');
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-1.1 o contexto `raw` poe piso zero nos campos inteiros, e nao toca os de texto', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({
      term_id: 12,
      term_taxonomy_id: 30,
      taxonomy: 'category',
      name: '  Noticias  ',
      count: -3,
      term_group: -1,
    }),
  ]);

  const termo = modulo.obterTermo(12, 'category');

  // `sanitize_term_field()` no contexto `raw` (`wp-includes/taxonomy.php:1787`):
  // `(int)` com piso em zero nos seis campos inteiros, e `return $value` nos de
  // texto — nada de `trim`, nada de escape. `count` e `term_group` sao
  // `bigint(10)` **com sinal** no DDL, logo o negativo gravado e possivel.
  assert.deepEqual(
    termo !== null && !ehErroDeTermo(termo)
      ? [termo.contagemDeUso, termo.grupoDeSinonimos, termo.nome]
      : null,
    [0, 0, '  Noticias  '],
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-1.2 — "Renomear o rotulo muda o nome em todos os contextos em que ele
   serve"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-1.2 renomear emite os DOIS `UPDATE` do legado, nessa ordem', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({
      term_id: 12,
      term_taxonomy_id: 30,
      taxonomy: 'category',
      description: 'O que aconteceu',
      parent: 4,
    }),
  ]);
  falsa.responder([{ term_taxonomy_id: 30 }]);

  const resultado = modulo.renomearRotulo({
    rotuloId: 12,
    contexto: 'category',
    nome: 'Noticias do dia',
  });

  // 1. `UPDATE terms SET name, slug, term_group WHERE term_id`
  // (`wp-includes/taxonomy.php:3414`), com `compact( 'name', 'slug',
  // 'term_group' )`. O slug e o agrupamento vao com o valor **que ja estava
  // gravado**: no legado eles chegam por `array_merge( $term, $args )` (`:3288`).
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'UPDATE wp_terms SET name = ?, slug = ?, term_group = ? WHERE term_id = ?',
    parametros: ['Noticias do dia', 'noticias', 0, 12],
  });

  // 2. `UPDATE term_taxonomy SET term_id, taxonomy, description, parent WHERE
  // term_taxonomy_id` (`:3446`) — as quatro colunas, com os valores que **nao
  // mudaram**. Sai sempre, e omiti-lo mudaria a sequencia de comandos e a ordem
  // dos dois pontos de extensao de `term_taxonomy`.
  assert.deepEqual(falsa.escritas[1], {
    texto:
      'UPDATE wp_term_taxonomy SET term_id = ?, taxonomy = ?, description = ?, parent = ? ' +
      'WHERE term_taxonomy_id = ?',
    parametros: [12, 'category', 'O que aconteceu', 4, 30],
  });
  assert.equal(falsa.escritas.length, 2);

  // `return array( 'term_id' => ..., 'term_taxonomy_id' => ... )` (`:3543`).
  assert.deepEqual(resultado, { rotuloId: 12, rotuloNoContextoId: 30 });
});

test('CA-1.2 o nome e escrito por `term_id`, logo alcanca todos os contextos do rotulo', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  falsa.responder([{ term_taxonomy_id: 30 }]);

  modulo.renomearRotulo({
    rotuloId: 12,
    contexto: 'category',
    nome: 'Noticias do dia',
  });

  // E aqui que CA-1.2 se decide, e se decide pelo **esquema**: a coluna `name`
  // existe uma vez, em `terms`, e o comando e filtrado por `term_id` — nao por
  // `term_taxonomy_id`. Nenhum comando desta operacao escreve nome em
  // `term_taxonomy`, porque a coluna nao existe la.
  const escritaDoNome = falsa.escritas[0];
  assert.match(String(escritaDoNome?.texto), /^UPDATE wp_terms SET name = \?/);
  assert.match(String(escritaDoNome?.texto), /WHERE term_id = \?$/);
  assert.equal(escritaDoNome?.parametros.at(-1), 12);

  for (const escrita of falsa.escritas) {
    if (escrita.texto.includes('wp_term_taxonomy')) {
      assert.equal(escrita.texto.includes('name'), false);
    }
  }

  // E a leitura seguinte, pelo outro contexto, ve o nome novo: a linha de
  // `post_tag` continua apontando para o mesmo `term_id` 12.
  falsa.responder([
    linhaDeTermo({
      term_id: 12,
      term_taxonomy_id: 31,
      taxonomy: 'post_tag',
      name: 'Noticias do dia',
    }),
  ]);
  const emEtiqueta = modulo.obterTermo(12, 'post_tag');
  assert.equal(
    emEtiqueta !== null && !ehErroDeTermo(emEtiqueta) ? emEtiqueta.nome : null,
    'Noticias do dia',
  );
});

test('CA-1.2 nome vazio, ou so espaco, e recusado e nenhuma escrita sai', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
  ]);

  const erro = comoErro(
    modulo.renomearRotulo({ rotuloId: 12, contexto: 'category', nome: '   ' }),
  );

  // `if ( '' === trim( $name ) )` (`wp-includes/taxonomy.php:3307`).
  assert.equal(erro.codigo, 'empty_term_name');
  assert.equal(erro.mensagem, 'A name is required for this term.');
  assert.deepEqual(falsa.escritas, []);
});

test('CA-1.2 contexto nao registrado e rotulo inexistente recusam sem escrever nada', () => {
  const primeira = montar();

  // `if ( ! taxonomy_exists( $taxonomy ) )` (`:3266`): antes de qualquer
  // leitura.
  const erroDeContexto = comoErro(
    primeira.modulo.renomearRotulo({
      rotuloId: 12,
      contexto: 'resenha',
      nome: 'Resenhas',
    }),
  );
  assert.equal(erroDeContexto.codigo, 'invalid_taxonomy');
  assert.deepEqual(primeira.falsa.selecoes, []);
  assert.deepEqual(primeira.falsa.escritas, []);

  // `if ( ! $term ) { return new WP_Error( 'invalid_term', 'Empty Term.' ) }`
  // (`:3279`) — repare que aqui a ausencia **e** erro, ao contrario de
  // `get_term()`, que devolve `null`.
  const segunda = montar();
  const erroDeRotulo = comoErro(
    segunda.modulo.renomearRotulo({
      rotuloId: 999,
      contexto: 'category',
      nome: 'Noticias',
    }),
  );
  assert.equal(erroDeRotulo.codigo, 'invalid_term');
  assert.deepEqual(segunda.falsa.escritas, []);
});

test('🔴 CA-1.2 renomear rotulo COMPARTILHADO propaga o nome aqui, e o legado divide o rotulo — divergencia declarada, nao resolvida', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  falsa.responder([{ term_taxonomy_id: 30 }]);

  modulo.renomearRotulo({
    rotuloId: 12,
    contexto: 'category',
    nome: 'Noticias do dia',
  });

  // O que esta implementacao faz: um `UPDATE` em `terms`, que alcanca os dois
  // contextos — e e exatamente o que CA-1.2 e `UT-033-2` descrevem.
  //
  // 🔴 O que o legado faz: entre a leitura e este `UPDATE` ele chama
  // `_split_shared_term( $term_id, $tt_id )` (`wp-includes/taxonomy.php:3383`),
  // que **insere uma linha nova em `terms`**, repoe a linha de `category` nela e
  // so entao renomeia — ou seja, **desfaz o compartilhamento em vez de propagar
  // o nome**. A analise completa, com o que cada documento diz e o que falta
  // decidir, esta no cabecalho de `renomear-rotulo.ts`.
  //
  // Este teste existe para **fixar** o que a arvore faz hoje e para que a
  // divergencia nao passe em silencio: ele falha no dia em que alguem portar a
  // divisao, e e assim que se quer. Numa instalacao nova nenhuma operacao do
  // legado cria rotulo compartilhado, logo nenhum caminho alcancavel distingue
  // as duas leituras.
  assert.equal(falsa.escritas.length, 2);
  assert.match(String(falsa.escritas[0]?.texto), /^UPDATE wp_terms SET name/);

  // E a prova de que a divisao NAO aconteceu: nenhum `INSERT` em `terms`.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.texto.startsWith('INSERT INTO wp_terms'), false);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-1.3 — "Remover o rotulo de um contexto nao o remove do outro"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-1.3 remover de um contexto apaga so a linha daquele contexto quando o outro ainda usa o rotulo', () => {
  const { falsa, modulo } = montar();
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  // A contagem e feita DEPOIS do `DELETE`: sobra a linha de `post_tag`.
  falsa.responder([{ 'COUNT(*)': 1 }]);

  const resultado = removerRotuloDoContexto(modulo, {
    rotuloId: 12,
    contexto: 'category',
  });

  // `$wpdb->delete( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => $tt_id ) )`
  // (`wp-includes/taxonomy.php:2202`).
  assert.deepEqual(falsa.escritas[0], {
    texto: 'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    parametros: [30],
  });

  // `SELECT COUNT(*) FROM $wpdb->term_taxonomy WHERE term_id = %d` (`:2214`),
  // **depois** do `DELETE` — e a leitura que faz CA-1.3 valer.
  assert.deepEqual(falsa.selecoes[1], {
    texto: 'SELECT COUNT(*) FROM wp_term_taxonomy WHERE term_id = ?',
    parametros: [12],
  });

  // E o rotulo **continua existindo**: nenhum `DELETE` em `terms`.
  assert.equal(falsa.escritas.length, 1);
  assert.equal(resultado, true);
});

test('CA-1.3 remover do ultimo contexto apaga tambem o rotulo, e nessa ordem', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
  ]);
  falsa.responder([{ 'COUNT(*)': 0 }]);

  const resultado = removerRotuloDoContexto(modulo, {
    rotuloId: 12,
    contexto: 'category',
  });

  // `if ( ! $wpdb->get_var( ... ) ) { $wpdb->delete( $wpdb->terms, ... ); }`
  // (`:2214`-`:2216`): a linha de `terms` so morre quando nenhum contexto mais a
  // usa, e esse e o unico caminho pelo qual ela morre.
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
      parametros: [30],
    },
    { texto: 'DELETE FROM wp_terms WHERE term_id = ?', parametros: [12] },
  ]);
  assert.equal(resultado, true);
});

test('CA-1.3 par inexistente devolve `false` e nao toca o banco; contexto nao registrado tambem', () => {
  const { falsa, modulo } = montar();

  // Contexto nao registrado: no legado o caminho e `term_exists()` →
  // `get_terms()` devolve `WP_Error`, `term_exists()` traduz em `null`
  // (`:1670`), `wp_delete_term()` traduz em `false` (`:2063`). **Nao e erro.**
  assert.equal(
    removerRotuloDoContexto(modulo, { rotuloId: 12, contexto: 'resenha' }),
    false,
  );
  assert.deepEqual(falsa.selecoes, []);

  // Rotulo que nao serve aquele contexto: tambem `false`.
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 31, taxonomy: 'post_tag' }),
  ]);
  assert.equal(
    removerRotuloDoContexto(modulo, { rotuloId: 12, contexto: 'category' }),
    false,
  );
  assert.deepEqual(falsa.escritas, []);
});

test('CA-1.3 a remocao nao toca a juncao: o vinculo orfao e da cascata de T009', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
  ]);
  falsa.responder([{ 'COUNT(*)': 0 }]);

  removerRotuloDoContexto(modulo, { rotuloId: 12, contexto: 'category' });

  // Esta operacao e o trecho `:2200`-`:2216` de `wp_delete_term()`, e nao a
  // funcao: os oito passos anteriores — protecao do termo padrao (US-5, T011),
  // reposicionamento de filhos, devolucao dos objetos ao termo padrao e
  // metadado do rotulo (US-4, T009) — **nao** estao aqui, e por isso nenhum
  // comando menciona `term_relationships`. O escopo desta pasta nao recebe a
  // juncao, de proposito (`escopo-de-rotulo-e-contexto.ts`).
  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('term_relationships'), false);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-1.4 — "Contexto de classificacao e declarado e diz a quais tipos de
   conteudo se aplica"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-1.4 cada tipo de objeto enxerga os contextos que o declaram, na ordem do registro', () => {
  const { falsa, modulo } = montar();

  // `create_initial_taxonomies()`, `wp-includes/taxonomy.php:63` a `:263`: tres
  // dos oito se aplicam a `post`, e a ordem e a de registro — que e dado, porque
  // a sequencia de comandos de qualquer laco sobre esta lista a segue.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('post'), [
    'category',
    'post_tag',
    'post_format',
  ]);

  // ⚠️ `link_category` se aplica a `link`, que **nao e conteudo**: e dessa
  // coluna polimorfica que vem a fusao de BC-02.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('link'), [
    'link_category',
  ]);

  // Dois contextos para o mesmo tipo, e um deles com tres tipos declarados.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('wp_template_part'), [
    'wp_theme',
    'wp_template_part_area',
  ]);

  // A forma `objects` do legado devolve os contextos resolvidos, e nao so os
  // nomes: e a que o laco do termo padrao de BC-01 consome.
  assert.deepEqual(
    modulo.contextosDoTipoDeObjeto('post').map((c) => c.hierarquico),
    [true, false, false],
  );

  // Nenhuma das tres leituras toca o banco: o contexto nao e entidade gravada.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-1.4 o menu de navegacao e um contexto de classificacao, e os itens dele sao conteudo', () => {
  const { modulo } = montar();

  // Regra de negocio de US-1, e `domain.md` 1.2 pela boca de UC-05: "Um menu de
  // navegacao e uma taxonomia e cada item do menu e um Post". O contexto
  // `nav_menu` se aplica ao tipo de conteudo `nav_menu_item`
  // (`wp-includes/taxonomy.php:136`), e nao a `post`.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('nav_menu_item'), [
    'nav_menu',
  ]);
  assert.equal(
    modulo.contextoAceitaTipoDeObjeto('nav_menu_item', 'nav_menu'),
    true,
  );
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'nav_menu'), false);
});

test('CA-1.4 tipo que o contexto nao declara recusa o vinculo, e a recusa e silenciosa', () => {
  const { falsa, modulo } = montar();

  // `is_object_in_taxonomy()` (`wp-includes/taxonomy.php:5015`): `page` nao
  // declara `category`, logo o vinculo nao acontece. **Sem erro, sem mensagem e
  // sem registro** — no legado o chamador e um `if` que simplesmente nao chama
  // `wp_set_post_categories()` (`wp-includes/post.php:5053`). O P7 poe esse
  // silencio no contrato.
  assert.equal(modulo.contextoAceitaTipoDeObjeto('page', 'category'), false);
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'category'), true);

  // Tipo que nenhum contexto declara: a guarda `if ( empty( $taxonomies ) )`
  // (`:5017`), que o legado tem e que e redundante.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('wp_navigation'), []);
  assert.equal(
    modulo.contextoAceitaTipoDeObjeto('wp_navigation', 'category'),
    false,
  );

  // E nada disso escreve: recusar vinculo nao e operacao de banco.
  assert.deepEqual(falsa.escritas, []);
});

test('CA-1.4 contexto que uma extensao registra em execucao passa a aceitar vinculo, na ultima posicao', () => {
  const { modulo } = montar();

  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'resenha'), false);

  // `register_taxonomy()` e API publica e uma extensao registra contexto em
  // execucao (P2, P8) — e o registro e desta composicao, nao do modulo
  // (`EXT-CONTEXTO`, dimensao D-A).
  modulo.contextos.registrar('resenha', { tiposDeObjeto: 'post' });

  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'resenha'), true);
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('post'), [
    'category',
    'post_tag',
    'post_format',
    'resenha',
  ]);
});

test('CA-1.4 duas composicoes nao compartilham a declaracao (D-A de parity_specs.md)', () => {
  const primeira = montar('wp_');
  const segunda = montar('wp_2_');

  primeira.modulo.contextos.registrar('resenha', { tiposDeObjeto: 'post' });

  assert.equal(
    primeira.modulo.contextoAceitaTipoDeObjeto('post', 'resenha'),
    true,
  );
  assert.equal(
    segunda.modulo.contextoAceitaTipoDeObjeto('post', 'resenha'),
    false,
  );
});
