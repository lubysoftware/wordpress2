/**
 * Conformidade do DDL: a estrutura que T002 declara e a do legado, byte a byte.
 *
 * O texto esperado abaixo e uma **segunda transcricao** de
 * `wp-admin/includes/schema.php:65` a `:91`, feita de proposito: se o arquivo de
 * fonte e o teste citassem a mesma constante, o teste nao conferiria nada. E byte
 * a byte porque `DB-MIG` (BR-MIGRAR-085) diz o que a comparacao de estrutura do
 * legado faz com uma diferenca de forma — emite `ALTER TABLE` —, e a borda 4 de
 * `target_architecture.md` diz quem pode emitir: nao esta metade.
 *
 * ⚠️ **A indentacao deste bloco e de UM ESPACO, nao de tabulacao**, ao contrario
 * do bloco de `posts` e `postmeta`. E irregularidade do legado, e o teste a fixa
 * nos dois sentidos: ha um teste que falha se alguem "normalizar" para tabulacao.
 *
 * Os testes do fim nao conferem texto, conferem **ausencia e presenca**: as duas
 * garantias de unicidade que nascem aqui, e as quatro coisas que um porte
 * acrescentaria sem perceber e que mudariam o produto.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO } from '../registro/index.js';
import {
  ddlDeRotulos,
  ddlDeRotulosNoContexto,
  ddlDeVinculos,
  ddlDoArmazenamentoDeClassificacao,
  TAMANHO_MAXIMO_DE_INDICE,
} from './esquema.js';
import { criarPortaDeDadosFalsa } from './porta-falsa.js';

/** A clausula e 🔴 lacuna ERD-5: o teste usa uma forma, nao um valor decidido. */
const CHARSET = 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci';

const DDL_ESPERADO_DE_ROTULOS = `CREATE TABLE wp_terms (
 term_id bigint(20) unsigned NOT NULL auto_increment,
 name varchar(200) NOT NULL default '',
 slug varchar(200) NOT NULL default '',
 term_group bigint(10) NOT NULL default 0,
 PRIMARY KEY  (term_id),
 KEY slug (slug(191)),
 KEY name (name(191))
) ${CHARSET};`;

const DDL_ESPERADO_DE_ROTULOS_NO_CONTEXTO = `CREATE TABLE wp_term_taxonomy (
 term_taxonomy_id bigint(20) unsigned NOT NULL auto_increment,
 term_id bigint(20) unsigned NOT NULL default 0,
 taxonomy varchar(32) NOT NULL default '',
 description longtext NOT NULL,
 parent bigint(20) unsigned NOT NULL default 0,
 count bigint(20) NOT NULL default 0,
 PRIMARY KEY  (term_taxonomy_id),
 UNIQUE KEY term_id_taxonomy (term_id,taxonomy),
 KEY taxonomy (taxonomy)
) ${CHARSET};`;

const DDL_ESPERADO_DE_VINCULOS = `CREATE TABLE wp_term_relationships (
 object_id bigint(20) unsigned NOT NULL default 0,
 term_taxonomy_id bigint(20) unsigned NOT NULL default 0,
 term_order int(11) NOT NULL default 0,
 PRIMARY KEY  (object_id,term_taxonomy_id),
 KEY term_taxonomy_id (term_taxonomy_id)
) ${CHARSET};`;

/** As linhas do corpo, sem o `CREATE TABLE` e sem o fechamento. */
function corpo(ddl: string): string[] {
  return ddl.split('\n').slice(1, -1);
}

function colunas(ddl: string): string[] {
  return corpo(ddl).filter(
    (linha) =>
      !linha.startsWith(' PRIMARY KEY') &&
      !linha.startsWith(' KEY') &&
      !linha.startsWith(' UNIQUE KEY'),
  );
}

test('o DDL de `terms` e o do legado, byte a byte, com as 4 colunas', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeRotulos(falsa.porta, { clausulaDeCharset: CHARSET });

  assert.equal(ddl, DDL_ESPERADO_DE_ROTULOS);
  assert.equal(colunas(ddl).length, 4);
  assert.equal(corpo(ddl).length - colunas(ddl).length, 3);
});

test('o DDL de `term_taxonomy` e o do legado, byte a byte, com as 6 colunas', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeRotulosNoContexto(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  assert.equal(ddl, DDL_ESPERADO_DE_ROTULOS_NO_CONTEXTO);
  assert.equal(colunas(ddl).length, 6);
  assert.equal(corpo(ddl).length - colunas(ddl).length, 3);
});

test('o DDL de `term_relationships` e o do legado, byte a byte, com as 3 colunas', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeVinculos(falsa.porta, { clausulaDeCharset: CHARSET });

  assert.equal(ddl, DDL_ESPERADO_DE_VINCULOS);
  assert.equal(colunas(ddl).length, 3);
  assert.equal(corpo(ddl).length - colunas(ddl).length, 2);
});

test('as tres vem na ordem do legado: rotulo, rotulo no contexto, juncao', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(ddl.indexOf('wp_terms') < ddl.indexOf('wp_term_taxonomy'));
  assert.ok(
    ddl.indexOf('wp_term_taxonomy') < ddl.indexOf('wp_term_relationships'),
  );
  assert.equal(
    ddl,
    `${DDL_ESPERADO_DE_ROTULOS}\n` +
      `${DDL_ESPERADO_DE_ROTULOS_NO_CONTEXTO}\n` +
      `${DDL_ESPERADO_DE_VINCULOS}\n`,
  );
});

test('o prefixo do site entra no nome das tres tabelas (ESCOPO POR SITE)', () => {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(ddl.includes('CREATE TABLE wp_2_terms ('));
  assert.ok(ddl.includes('CREATE TABLE wp_2_term_taxonomy ('));
  assert.ok(ddl.includes('CREATE TABLE wp_2_term_relationships ('));
  assert.ok(!ddl.includes('CREATE TABLE wp_terms ('));
});

test('a indentacao e de um espaco, e nao de tabulacao', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  // `termmeta`, `postmeta` e `posts` usam tabulacao; estas tres, um espaco
  // (`wp-admin/includes/schema.php:66` a `:90`). Normalizar os dois para o mesmo
  // caractere e o que `DB-MIG` transforma em `ALTER TABLE`.
  assert.ok(!ddl.includes('\t'));
  for (const linha of ddl.split('\n')) {
    if (linha === '' || linha.startsWith('CREATE TABLE') || linha.startsWith(')')) {
      continue;
    }
    assert.ok(linha.startsWith(' '), linha);
    assert.ok(!linha.startsWith('  '), linha);
  }
});

test('o teto de indice e o 191 do legado, e entra nas duas chaves de `terms`', () => {
  const falsa = criarPortaDeDadosFalsa();

  assert.equal(TAMANHO_MAXIMO_DE_INDICE, 191);

  const ddl = ddlDeRotulos(falsa.porta, {
    clausulaDeCharset: CHARSET,
    tamanhoMaximoDeIndice: 255,
  });

  // O valor chega por argumento porque o legado o interpola; trocando-o, as duas
  // chaves mudam juntas — e nenhuma outra tabela desta feature o usa.
  assert.ok(ddl.includes('KEY slug (slug(255))'));
  assert.ok(ddl.includes('KEY name (name(255))'));
  assert.ok(
    !ddlDeVinculos(falsa.porta, { clausulaDeCharset: CHARSET }).includes('191'),
  );
});

test('a coluna do contexto tem exatamente os 32 bytes do limite do registro', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeRotulosNoContexto(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  // `taxonomy varchar(32)` e `strlen( $taxonomy ) > 32` sao o mesmo numero
  // (`wp-admin/includes/schema.php:77` e `wp-includes/taxonomy.php:527`): o
  // registro recusa o nome que a coluna nao comportaria. Se alguem mexer num dos
  // dois sem o outro, este teste falha.
  assert.ok(
    ddl.includes(
      ` taxonomy varchar(${LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO}) NOT NULL default '',`,
    ),
  );
});

test('as duas garantias de unicidade do banco que nascem aqui estao declaradas', () => {
  const falsa = criarPortaDeDadosFalsa();
  const opcoes = { clausulaDeCharset: CHARSET };

  // 1. A unicidade de rotulo por contexto (`schema.php:82`), primeira invariante
  //    de `AGG-Termo`.
  assert.ok(
    ddlDeRotulosNoContexto(falsa.porta, opcoes).includes(
      ' UNIQUE KEY term_id_taxonomy (term_id,taxonomy),',
    ),
  );
  // 2. A chave composta da juncao (`schema.php:89`), a unica PK composta do
  //    esquema, e "a unica garantia estrutural de vinculo nao duplicado".
  assert.ok(
    ddlDeVinculos(falsa.porta, opcoes).includes(
      ' PRIMARY KEY  (object_id,term_taxonomy_id),',
    ),
  );
  // E a terceira unicidade do banco NAO e aqui: `terms.slug` e `KEY`, nao
  // `UNIQUE KEY` — a colisao e resolvida em codigo, sujeita a corrida
  // (`DB-UNIQ`, BR-MIGRAR-076).
  const rotulos = ddlDeRotulos(falsa.porta, opcoes);
  assert.ok(rotulos.includes(' KEY slug (slug(191)),'));
  assert.ok(!rotulos.includes('UNIQUE'));
});

test('zero chave estrangeira, zero coluna acrescentada, zero indice acrescentado', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  // As 18 tabelas do legado tem 59 indices e ZERO chave estrangeira (P5), e o
  // terceiro motivo de a integridade referencial estar desativada e desta
  // juncao: o objeto e polimorfico e "nao ha tabela unica para a FK apontar".
  assert.ok(!ddl.includes('FOREIGN KEY'));
  assert.ok(!ddl.includes('REFERENCES'));
  assert.ok(!ddl.includes('ON DELETE'));
  // Nenhum discriminador na juncao: a pergunta em aberto da `spec.md` nao e
  // respondida por esta tarefa, e `target_data_model.md` poe "zero colunas
  // acrescentadas" na secao de origem.
  assert.ok(!ddl.includes('object_type'));
  // 13 colunas somadas (4 + 6 + 3) e 8 indices somados (3 + 3 + 2) — os do
  // legado, sem o indice isolado em `object_id` que o risco 4 do plano sugere.
  const linhas = ddl.split('\n').filter((linha) => linha.startsWith(' '));
  const chaves = linhas.filter((linha) => linha.includes('KEY'));
  assert.equal(linhas.length - chaves.length, 13);
  assert.equal(chaves.length, 8);
  assert.ok(!ddl.includes('KEY object_id'));
  // Nenhum `ENUM` e nenhum `CHECK`: `taxonomy` e `varchar(32)` cru (`DB-ENUM`),
  // porque `register_taxonomy()` e ponto de extensao publico e os oito contextos
  // sao piso, nao teto.
  assert.ok(!ddl.includes('ENUM'));
  assert.ok(!ddl.includes('CHECK'));
});

test('a clausula de charset e argumento obrigatorio, sem default inventado', () => {
  const falsa = criarPortaDeDadosFalsa();

  // 🔴 Lacuna ERD-5: o valor vem de `DB_CHARSET`/`DB_COLLATE` e do que o
  // servidor aceita. O que o teste afirma e que o DDL nao carrega valor nenhum
  // por conta propria — ele interpola o que recebeu, e nada mais.
  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: '',
  });

  assert.ok(!ddl.includes('utf8'));
  assert.ok(ddl.includes(') ;'));
});
