/**
 * Conformidade do DDL: a estrutura que T002 declara e a do legado, byte a byte.
 *
 * O texto esperado abaixo e uma **segunda transcricao** de
 * `wp-admin/includes/schema.php:150` a `:189`, feita de proposito: se o arquivo
 * de fonte e o teste citassem a mesma constante, o teste nao conferiria nada. E
 * byte a byte porque `DB-MIG` (BR-MIGRAR-085) diz o que a comparacao de
 * estrutura do legado faz com uma diferenca de forma — emite `ALTER TABLE` —, e
 * a borda 4 de `target_architecture.md` diz quem pode emitir: nao esta metade.
 *
 * Os quatro testes do fim nao conferem texto, conferem **ausencia**: as quatro
 * coisas que um porte acrescentaria aqui sem perceber, e que mudariam o produto.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ESTADO_PADRAO_DA_APLICACAO,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
} from '../estado-editorial.js';
import {
  ddlDeConteudo,
  ddlDeMetadadosDeConteudo,
  ddlDoArmazenamentoDeConteudo,
  TAMANHO_MAXIMO_DE_INDICE,
} from './esquema.js';
import { criarPortaDeDadosFalsa } from './porta-falsa.js';

/** A clausula e 🔴 lacuna ERD-5: o teste usa uma forma, nao um valor decidido. */
const CHARSET = 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci';

const DDL_ESPERADO_DE_METADADOS = `CREATE TABLE wp_postmeta (
	meta_id bigint(20) unsigned NOT NULL auto_increment,
	post_id bigint(20) unsigned NOT NULL default '0',
	meta_key varchar(255) default NULL,
	meta_value longtext,
	PRIMARY KEY  (meta_id),
	KEY post_id (post_id),
	KEY meta_key (meta_key(191))
) ${CHARSET};`;

const DDL_ESPERADO_DE_CONTEUDO = `CREATE TABLE wp_posts (
	ID bigint(20) unsigned NOT NULL auto_increment,
	post_author bigint(20) unsigned NOT NULL default '0',
	post_date datetime NOT NULL default '0000-00-00 00:00:00',
	post_date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
	post_content longtext NOT NULL,
	post_title text NOT NULL,
	post_excerpt text NOT NULL,
	post_status varchar(20) NOT NULL default 'publish',
	comment_status varchar(20) NOT NULL default 'open',
	ping_status varchar(20) NOT NULL default 'open',
	post_password varchar(255) NOT NULL default '',
	post_name varchar(200) NOT NULL default '',
	to_ping text NOT NULL,
	pinged text NOT NULL,
	post_modified datetime NOT NULL default '0000-00-00 00:00:00',
	post_modified_gmt datetime NOT NULL default '0000-00-00 00:00:00',
	post_content_filtered longtext NOT NULL,
	post_parent bigint(20) unsigned NOT NULL default '0',
	guid varchar(255) NOT NULL default '',
	menu_order int(11) NOT NULL default '0',
	post_type varchar(20) NOT NULL default 'post',
	post_mime_type varchar(100) NOT NULL default '',
	comment_count bigint(20) NOT NULL default '0',
	PRIMARY KEY  (ID),
	KEY post_name (post_name(191)),
	KEY type_status_date (post_type,post_status,post_date,ID),
	KEY post_parent (post_parent),
	KEY post_author (post_author),
	KEY type_status_author (post_type,post_status,post_author)
) ${CHARSET};`;

test('o DDL de `postmeta` e o do legado, byte a byte', () => {
  const falsa = criarPortaDeDadosFalsa();

  assert.equal(
    ddlDeMetadadosDeConteudo(falsa.porta, { clausulaDeCharset: CHARSET }),
    DDL_ESPERADO_DE_METADADOS,
  );
});

test('o DDL de `posts` e o do legado, byte a byte, com as 23 colunas', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeConteudo(falsa.porta, { clausulaDeCharset: CHARSET });

  assert.equal(ddl, DDL_ESPERADO_DE_CONTEUDO);
  // As 23 colunas de `target_data_model.md`, contadas: toda linha do corpo que
  // nao e chave nem indice.
  const linhas = ddl.split('\n').slice(1, -1);
  const colunas = linhas.filter(
    (linha) => !linha.startsWith('\tPRIMARY KEY') && !linha.startsWith('\tKEY'),
  );
  assert.equal(colunas.length, 23);
  // E os 6 indices, que `target_data_model.md` manda emitir identicos porque
  // "o legado conta com eles".
  assert.equal(linhas.length - colunas.length, 6);
});

test('as duas vem na ordem do legado: `postmeta` antes de `posts`', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDoArmazenamentoDeConteudo(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(ddl.indexOf('wp_postmeta') < ddl.indexOf('wp_posts'));
  assert.equal(
    ddl,
    `${DDL_ESPERADO_DE_METADADOS}\n${DDL_ESPERADO_DE_CONTEUDO}\n`,
  );
});

test('o prefixo do site entra no nome das duas tabelas (ESCOPO POR SITE)', () => {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  const ddl = ddlDoArmazenamentoDeConteudo(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(ddl.includes('CREATE TABLE wp_2_posts ('));
  assert.ok(ddl.includes('CREATE TABLE wp_2_postmeta ('));
});

test('o default da coluna de estado no DDL e o do ARMAZENAMENTO (BR-MIGRAR-001)', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDeConteudo(falsa.porta, { clausulaDeCharset: CHARSET });

  // A metade que T002 carrega da divergencia dos dois defaults: aqui e
  // `publish`, e o da aplicacao — `draft` — nao aparece em lugar nenhum do DDL.
  assert.ok(
    ddl.includes(
      `post_status varchar(20) NOT NULL default '${ESTADO_PADRAO_DO_ARMAZENAMENTO}'`,
    ),
  );
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, 'publish');
  assert.ok(!ddl.includes(`default '${ESTADO_PADRAO_DA_APLICACAO}'`));
});

test('os dois indices de prefixo param em 191 caracteres', () => {
  const falsa = criarPortaDeDadosFalsa();

  assert.equal(TAMANHO_MAXIMO_DE_INDICE, 191);
  assert.ok(
    ddlDeConteudo(falsa.porta, { clausulaDeCharset: CHARSET }).includes(
      'KEY post_name (post_name(191))',
    ),
  );
  assert.ok(
    ddlDeMetadadosDeConteudo(falsa.porta, {
      clausulaDeCharset: CHARSET,
    }).includes('KEY meta_key (meta_key(191))'),
  );
});

test('zero chave estrangeira, zero ENUM, zero CHECK, zero UNIQUE', () => {
  const falsa = criarPortaDeDadosFalsa();

  const ddl = ddlDoArmazenamentoDeConteudo(falsa.porta, {
    clausulaDeCharset: CHARSET,
  });

  // As quatro ausencias, uma por regra: P5 e a resposta 2 (chave estrangeira),
  // `DB-ENUM`/BR-MIGRAR-075 (ENUM e CHECK) e BR-MIGRAR-005 (UNIQUE no
  // identificador na URL). Cada uma delas, acrescentada, mudaria o que e
  // observavel — e a ultima quebraria o produto, porque a dispensa de unicidade
  // em rascunho E a regra.
  assert.ok(!/FOREIGN KEY/i.test(ddl));
  assert.ok(!/\bENUM\b/i.test(ddl));
  assert.ok(!/\bCHECK\b/i.test(ddl));
  assert.ok(!/UNIQUE/i.test(ddl));
});

test('emitir o DDL nao toca na porta: nada aqui executa estrutura (borda 4)', () => {
  const falsa = criarPortaDeDadosFalsa();

  ddlDoArmazenamentoDeConteudo(falsa.porta, { clausulaDeCharset: CHARSET });

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});
