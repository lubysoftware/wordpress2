/**
 * Testes da entrega de T002: *"as tres estruturas da secao Modelo de dados do
 * plano existem, com a chave composta da juncao e a unicidade de rotulo por
 * contexto, e sao lidas e gravadas pela porta de dados"*.
 *
 * O que se afirma aqui e **a consulta que sai e a linha que entra**, porque e
 * isso que a area 3 da Decisao 2 de `parity_specs.md` compara: *"snapshot +
 * sequencia de comandos"*. Por isso a porta de teste registra consulta em vez de
 * simular banco — e por isso ha testes que afirmam que **nenhum comando sai**.
 *
 * Nao sao os testes de nenhuma historia: esses sao T004, T006, T008, T010 e T012,
 * um por caso de `backlog/tests.md`. Nenhuma regra de negocio e exercitada aqui,
 * e **duas ausencias sao afirmadas de proposito** — o repositorio nao recusa par
 * duplicado (quem recusa e a chave do banco) e nao recalcula contagem (quem
 * decide o criterio e a tarefa da contagem).
 *
 * ⚠️ **O oraculo executavel do legado nao existe nesta arvore**
 * (`oracleAvailable: false`; levanta-lo e T001 da feature 015). Logo cada
 * afirmacao de cadeia SQL abaixo e **leitura estatica** do legado, com
 * `arquivo:linha` no comentario, e nao comparacao de execucao. O que a leitura
 * estatica nao resolve — valor devolvido pelo driver, efeito de cache, corrida de
 * duas requisicoes — fica para fechar contra o oraculo.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarArmazenamentoDeClassificacao,
  type ArmazenamentoDeClassificacao,
} from './index.js';
import { criarPortaDeDadosFalsa, type PortaDeDadosFalsa } from './porta-falsa.js';
import { lerRotuloNoContexto, SEM_ROTULO_PAI } from './rotulo-no-contexto.js';
import { SEM_GRUPO_DE_SINONIMOS } from './rotulo.js';
import { lerVinculo, SEM_ORDEM } from './vinculo.js';

function montar(prefixoDeTabela = 'wp_'): {
  falsa: PortaDeDadosFalsa;
  armazenamento: ArmazenamentoDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, armazenamento: criarArmazenamentoDeClassificacao(falsa.porta) };
}

/* ─────────────────────────── a composicao ─────────────────────────────── */

test('compor o armazenamento nao emite consulta nenhuma (EXT-ORDEM)', () => {
  const { falsa } = montar();

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

/* ───────────────────── 1. o rotulo (`terms`) ──────────────────────────── */

test('o rotulo e lido pela cadeia do legado, e a linha vira as 4 colunas', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([
    { term_id: 12, name: 'Sem categoria', slug: 'sem-categoria', term_group: 0 },
  ]);

  const rotulo = armazenamento.rotulos.obterPorId(12);

  // `wp-includes/taxonomy.php:4344`.
  assert.deepEqual(falsa.selecoes[0], {
    texto: 'SELECT t.* FROM wp_terms t WHERE t.term_id = ?',
    parametros: [12],
  });
  assert.deepEqual(rotulo, {
    id: 12,
    nome: 'Sem categoria',
    slug: 'sem-categoria',
    grupoDeSinonimos: SEM_GRUPO_DE_SINONIMOS,
  });
});

test('rotulo inexistente e `null`, e nao erro: a leitura nao decide nada', () => {
  const { armazenamento } = montar();

  assert.equal(armazenamento.rotulos.obterPorId(999), null);
});

test('a insercao do rotulo escreve 3 colunas, na ordem do `compact()` do legado', () => {
  const { falsa, armazenamento } = montar();

  const id = armazenamento.rotulos.inserir({
    nome: 'Receitas',
    slug: 'receitas',
    grupoDeSinonimos: SEM_GRUPO_DE_SINONIMOS,
  });

  // `compact( 'name', 'slug', 'term_group' )`, `wp-includes/taxonomy.php:2611`,
  // gravado em `:2624`. `term_id` NAO entra: e gerado pelo banco.
  assert.deepEqual(falsa.escritas[0], {
    texto: 'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
    parametros: ['Receitas', 'receitas', 0],
  });
  assert.equal(id, 7);
});

test('a atualizacao do rotulo serve aos dois `UPDATE` do legado', () => {
  const { falsa, armazenamento } = montar();

  // O das tres colunas (`wp-includes/taxonomy.php:3414`).
  armazenamento.rotulos.atualizar(12, {
    nome: 'Receitas',
    slug: 'receitas',
    grupoDeSinonimos: 3,
  });
  // E o de uma so, que corrige o identificador na URL depois do `INSERT`
  // (`:2636` e `:3418`).
  armazenamento.rotulos.atualizar(12, { slug: 'receitas-2' });

  assert.deepEqual(falsa.escritas[0], {
    texto:
      'UPDATE wp_terms SET name = ?, slug = ?, term_group = ? WHERE term_id = ?',
    parametros: ['Receitas', 'receitas', 3, 12],
  });
  assert.deepEqual(falsa.escritas[1], {
    texto: 'UPDATE wp_terms SET slug = ? WHERE term_id = ?',
    parametros: ['receitas-2', 12],
  });
});

test('atualizar sem campo nenhum nao emite comando', () => {
  const { falsa, armazenamento } = montar();

  const afetadas = armazenamento.rotulos.atualizar(12, {});

  // A ausencia de escrita e parte do contrato: `$wpdb->update` com dado vazio
  // nao e um comando valido, e emitir `SET` vazio seria erro de sintaxe.
  assert.deepEqual(falsa.escritas, []);
  assert.equal(afetadas, 0);
});

test('a unicidade do identificador na URL e leitura, e tem duas cadeias', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ slug: 'receitas' }]);

  assert.equal(armazenamento.rotulos.slugJaUsado('receitas'), true);
  assert.equal(armazenamento.rotulos.slugJaUsado('receitas', 12), false);

  // `wp-includes/taxonomy.php:3190` e `:3188`: o legado escolhe entre as duas
  // pelo mesmo `if`, e o `!=` existe para o rotulo nao colidir consigo mesmo.
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT slug FROM wp_terms WHERE slug = ?',
  );
  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT slug FROM wp_terms WHERE slug = ? AND term_id != ?',
  );
  assert.deepEqual(falsa.selecoes[1]?.parametros, ['receitas', 12]);
});

test('o agrupamento de sinonimos le `MAX(term_group)`, e a soma e do chamador', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ 'MAX(term_group)': '4' }]);

  assert.equal(armazenamento.rotulos.maiorGrupoDeSinonimos(), 4);
  // Tabela vazia devolve `0`, e nao `null`: o legado soma 1 ao que vier
  // (`wp-includes/taxonomy.php:2537` e `:3336`), e quem soma e quem chama.
  assert.equal(armazenamento.rotulos.maiorGrupoDeSinonimos(), 0);
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT MAX(term_group) FROM wp_terms',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, []);
});

test('apagar o rotulo apaga a linha, e so ela', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.rotulos.apagar(12);

  // `wp-includes/taxonomy.php:2215`. A cascata inteira e de T009 e T011, com a
  // tag `@cascata` que `parity_specs.md` exige.
  assert.deepEqual(falsa.escritas[0], {
    texto: 'DELETE FROM wp_terms WHERE term_id = ?',
    parametros: [12],
  });
  assert.equal(falsa.escritas.length, 1);
});

/* ──────────── 2. o rotulo no contexto (`term_taxonomy`) ───────────────── */

test('o rotulo no contexto e lido com `SELECT *`, e a linha vira as 6 colunas', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([
    {
      term_taxonomy_id: 31,
      term_id: 12,
      taxonomy: 'category',
      description: 'textos de cozinha',
      parent: 0,
      count: 5,
    },
  ]);

  const linha = armazenamento.rotulosNoContexto.obterPorId(31);

  // `wp-includes/taxonomy.php:4368`.
  assert.deepEqual(falsa.selecoes[0], {
    texto: 'SELECT * FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    parametros: [31],
  });
  assert.deepEqual(linha, {
    id: 31,
    rotuloId: 12,
    contexto: 'category',
    descricao: 'textos de cozinha',
    rotuloPaiId: SEM_ROTULO_PAI,
    contagemDeUso: 5,
  });
});

test('a unicidade de rotulo por contexto e lida pela cadeia com juncao do legado', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ term_taxonomy_id: 31 }]);

  assert.equal(
    armazenamento.rotulosNoContexto.idDoRotuloNoContexto(12, 'category'),
    31,
  );

  // `wp-includes/taxonomy.php:2643` e `:3380`, identicas — inclusive a juncao
  // com `terms`, que e redundante e tem efeito: o par so e encontrado se a linha
  // do rotulo existir.
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT tt.term_taxonomy_id FROM wp_term_taxonomy AS tt ' +
      'INNER JOIN wp_terms AS t ON tt.term_id = t.term_id ' +
      'WHERE tt.taxonomy = ? AND t.term_id = ?',
    parametros: ['category', 12],
  });
});

test('par ausente devolve `null`, como o `! empty( $tt_id )` do legado', () => {
  const { falsa, armazenamento } = montar();

  assert.equal(
    armazenamento.rotulosNoContexto.idDoRotuloNoContexto(12, 'post_tag'),
    null,
  );

  falsa.responder([{ term_taxonomy_id: 0 }]);
  assert.equal(
    armazenamento.rotulosNoContexto.idDoRotuloNoContexto(12, 'post_tag'),
    null,
  );
});

test('a insercao do rotulo no contexto escreve 5 colunas, com `count` por ultimo', () => {
  const { falsa, armazenamento } = montar();

  const id = armazenamento.rotulosNoContexto.inserir({
    rotuloId: 12,
    contexto: 'category',
    descricao: '',
    rotuloPaiId: SEM_ROTULO_PAI,
  });

  // `compact( 'term_id', 'taxonomy', 'description', 'parent' ) + array( 'count'
  // => 0 )`, `wp-includes/taxonomy.php:2652`: a soma de array poe `count`
  // depois, e e `0` explicito, nao o default do DDL.
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
      'VALUES (?, ?, ?, ?, ?)',
    parametros: [12, 'category', '', 0, 0],
  });
  assert.equal(id, 7);
});

test('a contagem de contextos do rotulo e o que faz CA-1.3 valer', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ 'COUNT(*)': '2' }]);

  const contextos = armazenamento.rotulosNoContexto.contarContextosDoRotulo(12);

  // `wp-includes/taxonomy.php:2214`: o legado so apaga a linha de `terms` se
  // esta contagem der zero. Com 2, remover o rotulo de um contexto deixa o
  // rotulo vivo no outro — "remover o rotulo de um contexto nao o remove do
  // outro".
  assert.equal(contextos, 2);
  assert.deepEqual(falsa.selecoes[0], {
    texto: 'SELECT COUNT(*) FROM wp_term_taxonomy WHERE term_id = ?',
    parametros: [12],
  });
});

test('os contextos de um rotulo saem por nome, nao por identificador', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ taxonomy: 'category' }, { taxonomy: 'post_tag' }]);

  // `wp-includes/taxonomy.php:4395`. O mesmo rotulo em dois contextos: duas
  // linhas de `term_taxonomy`, uma de `terms` (UC-05).
  assert.deepEqual(
    armazenamento.rotulosNoContexto.listarContextosDoRotulo(12),
    ['category', 'post_tag'],
  );
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT taxonomy FROM wp_term_taxonomy WHERE term_id = ?',
  );
});

test('os filhos sao lidos sem filtro de contexto, e reposicionados com filtro', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([
    { term_id: 20, term_taxonomy_id: 40 },
    { term_id: 21, term_taxonomy_id: 41 },
  ]);

  const filhos = armazenamento.rotulosNoContexto.listarFilhosDoRotulo(12);
  armazenamento.rotulosNoContexto.reposicionarFilhos(12, 5, 'category');

  // A assimetria e do legado: le sem contexto (`wp-includes/taxonomy.php:2121`,
  // com o acento grave em `parent`) e atualiza com contexto (`:2133`). E
  // `DB-TRG3` (BR-MIGRAR-079): o neto passa a apontar para o avo.
  assert.deepEqual(filhos, [
    { rotuloId: 20, rotuloNoContextoId: 40 },
    { rotuloId: 21, rotuloNoContextoId: 41 },
  ]);
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT term_id, term_taxonomy_id FROM wp_term_taxonomy WHERE `parent` = ?',
  );
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    parametros: [5, 12, 'category'],
  });
});

test('os filhos por contexto tem cadeia propria, sem acento grave', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ term_taxonomy_id: 40 }]);

  // `wp-includes/taxonomy.php:4371` — e o legado escreve `parent` sem acento
  // grave nesta, e com acento na outra. As duas sao transcritas como estao.
  assert.deepEqual(
    armazenamento.rotulosNoContexto.idsDeFilhosNoContexto(12, 'category'),
    [40],
  );
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT term_taxonomy_id FROM wp_term_taxonomy WHERE parent = ? AND taxonomy = ?',
    parametros: [12, 'category'],
  });
});

test('a contagem de uso e gravada, e este armazenamento nao calcula nenhuma', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.rotulosNoContexto.atualizarContagemDeUso(31, 9);

  // `wp-includes/taxonomy.php:4253` e `:4283`: os dois criterios de `DB-TRG2`
  // terminam no MESMO comando, e e o chamador que traz o numero. Qual criterio
  // vale e decidido em `wp_update_term_count_now()` (`:3625`), na hora de
  // contar — e nao aqui.
  assert.deepEqual(falsa.escritas[0], {
    texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    parametros: [9, 31],
  });
  // Nenhuma leitura de contagem saiu junto: a coluna nao e recalculada na
  // escrita, e a divergencia e estado normal (`target_data_model.md`).
  assert.deepEqual(falsa.selecoes, []);
});

test('apagar o rotulo no contexto apaga a presenca naquele contexto, e so ela', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.rotulosNoContexto.apagar(31);

  // `wp-includes/taxonomy.php:2202`.
  assert.deepEqual(falsa.escritas[0], {
    texto: 'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    parametros: [31],
  });
  assert.equal(falsa.escritas.length, 1);
});

/* ─────────── 3. a juncao (`term_relationships`) ───────────────────────── */

test('a linha da juncao tem 3 colunas e NENHUM identificador proprio', () => {
  const vinculo = lerVinculo({
    object_id: 101,
    term_taxonomy_id: 31,
    term_order: 0,
  });

  // A identidade e o par `(object_id, term_taxonomy_id)` — a unica PK composta
  // do esquema (`wp-admin/includes/schema.php:89`). Uma chave substituta
  // permitiria duas linhas iguais, que e o que a garantia impede.
  assert.deepEqual(Object.keys(vinculo).sort(), [
    'objetoId',
    'ordem',
    'rotuloNoContextoId',
  ]);
  assert.equal(vinculo.ordem, SEM_ORDEM);
});

test('a existencia do vinculo e lida pelo par, antes de inserir', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ term_taxonomy_id: 31 }]);

  assert.equal(
    armazenamento.vinculos.existe({ objetoId: 101, rotuloNoContextoId: 31 }),
    true,
  );
  assert.equal(
    armazenamento.vinculos.existe({ objetoId: 101, rotuloNoContextoId: 32 }),
    false,
  );

  // `wp-includes/taxonomy.php:2906`: e esta leitura que faz o legado NAO inserir
  // e NAO emitir os dois pontos de extensao do vinculo.
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT term_taxonomy_id FROM wp_term_relationships ' +
      'WHERE object_id = ? AND term_taxonomy_id = ?',
    parametros: [101, 31],
  });
});

test('a insercao do vinculo escreve 2 colunas, nao 3: a ordem fica no default', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.vinculos.inserir({ objetoId: 101, rotuloNoContextoId: 31 });

  // `wp-includes/taxonomy.php:2922`: `term_order` nao e mencionada, e recebe o
  // `0` do DDL. Quem a escreve e so o caminho de contexto ordenavel.
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    parametros: [101, 31],
  });
});

test('a escrita ordenada e um comando so, com `ON DUPLICATE KEY UPDATE`', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.vinculos.gravarOrdem(101, [
    { rotuloNoContextoId: 31, ordem: 1 },
    { rotuloNoContextoId: 32, ordem: 2 },
  ]);

  // `wp-includes/taxonomy.php:2986`. O `ON DUPLICATE KEY` so funciona porque a
  // chave composta existe, e a ordem comeca em 1 por decisao do chamador
  // (`++$term_order`, `:2981`).
  assert.equal(falsa.escritas.length, 1);
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) ' +
      'VALUES (?, ?, ?),(?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE term_order = VALUES(term_order)',
    parametros: [101, 31, 1, 101, 32, 2],
  });
});

test('lista vazia nao emite comando, nem na ordem nem na remocao', () => {
  const { falsa, armazenamento } = montar();

  assert.equal(armazenamento.vinculos.gravarOrdem(101, []), 0);
  assert.equal(armazenamento.vinculos.apagar(101, []), 0);

  // No legado sao os dois `if` — `if ( $values )` (`:2985`) e `if ( $tt_ids )`
  // (`:3073`) —, e com eles nao sai comando nem disparam os pontos de extensao
  // do lote. A ausencia de escrita e afirmacao, nao omissao.
  assert.deepEqual(falsa.escritas, []);
});

test('a remocao de vinculo usa um marcador por item, e nao concatenacao', () => {
  const { falsa, armazenamento } = montar();

  armazenamento.vinculos.apagar(101, [31, 32]);

  // `wp-includes/taxonomy.php:3088`. A unica diferenca com o legado e a lista
  // `IN`: ele a monta por concatenacao, com os identificadores entre apostrofos
  // (`:3074`), e REQ-164 proibe consulta montada por concatenacao. O conjunto de
  // linhas afetadas e o mesmo.
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'DELETE FROM wp_term_relationships ' +
      'WHERE object_id = ? AND term_taxonomy_id IN (?, ?)',
    parametros: [101, 31, 32],
  });
});

test('os objetos de um rotulo no contexto abrem a cascata de apagar termo', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ object_id: 101 }, { object_id: 102 }]);

  // `wp-includes/taxonomy.php:2152`, a ancora de `BR-MIGRAR-080` (`DB-TRG4`): e
  // sobre cada um destes objetos que o legado decide entre perder o vinculo e
  // receber o termo padrao. A decisao e de T009 e T011.
  assert.deepEqual(
    armazenamento.vinculos.listarObjetosDoRotuloNoContexto(31),
    [101, 102],
  );
  assert.deepEqual(falsa.selecoes[0], {
    texto: 'SELECT object_id FROM wp_term_relationships WHERE term_taxonomy_id = ?',
    parametros: [31],
  });
});

test('a contagem generica conta sem filtro, e e um dos dois criterios', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([{ 'COUNT(*)': 3 }]);

  // `_update_generic_term_count()`, `wp-includes/taxonomy.php:4276`: `COUNT(*)`
  // sem filtro, que e o que `link_category` usa. O outro criterio atravessa
  // `posts` (`:4232`), que e BC-01, e nao esta neste contexto.
  assert.equal(armazenamento.vinculos.contarObjetosDoRotuloNoContexto(31), 3);
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT COUNT(*) FROM wp_term_relationships WHERE term_taxonomy_id = ?',
    parametros: [31],
  });
});

test('o objeto da juncao nao tem discriminador, e aceita o que o legado aceita', () => {
  const { falsa, armazenamento } = montar();

  // O mesmo metodo grava vinculo de conteudo (`posts.ID`) e de marcador
  // (`links.link_id`), e nada na linha diz qual: a coluna e polimorfica sem
  // discriminador, e a resposta 2 proibe recusar hoje o que o legado aceita. A
  // pergunta em aberto da `spec.md` continua aberta.
  armazenamento.vinculos.inserir({ objetoId: 101, rotuloNoContextoId: 31 });
  armazenamento.vinculos.inserir({ objetoId: 101, rotuloNoContextoId: 55 });

  for (const escrita of falsa.escritas) {
    assert.equal(
      escrita.texto,
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    );
    assert.equal(escrita.parametros.length, 2);
  }
});

/* ───────── a leitura fundida: `AGG-Termo` sem fundir as tabelas ───────── */

test('um rotulo em dois contextos devolve duas linhas, com o mesmo nome', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([
    {
      term_id: 12,
      name: 'Receitas',
      slug: 'receitas',
      term_group: 0,
      term_taxonomy_id: 31,
      taxonomy: 'category',
      description: '',
      parent: 0,
      count: 5,
    },
    {
      term_id: 12,
      name: 'Receitas',
      slug: 'receitas',
      term_group: 0,
      term_taxonomy_id: 77,
      taxonomy: 'post_tag',
      description: '',
      parent: 0,
      count: 1,
    },
  ]);

  const termos = armazenamento.termos.obterPorRotulo(12);

  // `wp-includes/class-wp-term.php:132`, e o comentario dela diz por que nao ha
  // `LIMIT 1`: "Grab all matching terms, in case any are shared between
  // taxonomies." E a prova de CA-1.1 no armazenamento.
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT t.*, tt.* FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'WHERE t.term_id = ?',
    parametros: [12],
  });
  assert.equal(termos.length, 2);
  // O nome e o identificador vem de `terms` e sao os mesmos nos dois contextos —
  // e por isso que renomear alcanca todos (CA-1.2).
  assert.equal(termos[0]?.nome, termos[1]?.nome);
  assert.equal(termos[0]?.slug, termos[1]?.slug);
  assert.equal(termos[0]?.rotuloId, termos[1]?.rotuloId);
  // A descricao, o pai e a contagem sao por contexto, e o identificador que a
  // juncao referencia e outro em cada linha.
  assert.equal(termos[0]?.contexto, 'category');
  assert.equal(termos[1]?.contexto, 'post_tag');
  assert.equal(termos[0]?.rotuloNoContextoId, 31);
  assert.equal(termos[1]?.rotuloNoContextoId, 77);
  assert.equal(termos[0]?.contagemDeUso, 5);
  assert.equal(termos[1]?.contagemDeUso, 1);
});

test('a leitura fundida nao decide a ambiguidade: devolve as linhas como estao', () => {
  const { falsa, armazenamento } = montar();
  falsa.responder([]);

  // Rotulo inexistente devolve lista vazia, e nao erro. Escolher a linha do
  // contexto pedido, recusar `ambiguous_term_id` e recusar `invalid_taxonomy`
  // (`class-wp-term.php:160` e `:173`) dependem do registro de contextos, e sao
  // de T003.
  assert.deepEqual(armazenamento.termos.obterPorRotulo(999), []);
});

/* ───────────────────── a borda: leitura de coluna ─────────────────────── */

test('a coluna chega como texto, numero ou bytes, e e lida igual', () => {
  const comBytes = lerRotuloNoContexto({
    term_taxonomy_id: new TextEncoder().encode('31'),
    term_id: '12',
    taxonomy: new TextEncoder().encode('category'),
    description: null,
    parent: '0',
    count: 5,
  });

  // O driver escolhe a forma conforme o tipo e o tamanho da coluna; normalizar
  // na leitura nao normaliza o dado. Coluna nula vira texto vazio, como no
  // legado, e nenhuma leitura recusa linha (`DB-DEG`, BR-MIGRAR-083).
  assert.deepEqual(comBytes, {
    id: 31,
    rotuloId: 12,
    contexto: 'category',
    descricao: '',
    rotuloPaiId: SEM_ROTULO_PAI,
    contagemDeUso: 5,
  });
});

test('contexto que nenhum registro conhece e lido como qualquer outro', () => {
  // O legado tolera a linha e recusa so na leitura de alto nivel
  // (`class-wp-term.php:173`). Um armazenamento que recusasse aqui mudaria o que
  // e observavel, e a resposta 2 proibe.
  const linha = lerRotuloNoContexto({
    term_taxonomy_id: 31,
    term_id: 12,
    taxonomy: 'resenha-de-extensao-desinstalada',
    description: '',
    parent: 0,
    count: 0,
  });

  assert.equal(linha.contexto, 'resenha-de-extensao-desinstalada');
});

test('o prefixo do site entra em toda cadeia, inclusive na que junta duas tabelas', () => {
  const { falsa, armazenamento } = montar('wp_7_');

  armazenamento.termos.obterPorRotulo(12);
  armazenamento.rotulosNoContexto.idDoRotuloNoContexto(12, 'category');

  // Numa rede as tres tabelas levam o identificador do site no nome, e a nota 3
  // de `target_data_model.md` diz por que isso nao e detalhe: um nome montado no
  // meio de uma consulta grava o termo de um site na tabela de outro.
  for (const selecao of falsa.selecoes) {
    assert.ok(!/\bwp_terms\b|\bwp_term_taxonomy\b/.test(selecao.texto));
    assert.ok(selecao.texto.includes('wp_7_'));
  }
});
