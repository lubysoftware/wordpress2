/**
 * Testes do DDL e dos limites de coluna de T002.
 *
 * Por que o DDL tem teste proprio: `DB-MIG` (BR-MIGRAR-085) transforma uma
 * diferenca de **forma** em `ALTER TABLE`, e a borda 4 de
 * `target_architecture.md` diz que esta metade *"le e nunca escreve"*
 * estrutura. Logo "normalizar" o DDL — trocar tabulacao por espaco, tirar o
 * espaco duplo de `PRIMARY KEY  (`, reordenar indice — e uma mudanca de
 * comportamento, e estes testes falham quando alguem a faz.
 *
 * E os limites de coluna tem teste porque sao **dois caminhos que tem de chegar
 * ao mesmo numero**: o declarado a mao em
 * `wp_get_comment_fields_max_lengths()` e o derivado da coluna por
 * `get_col_length()`. Se o DDL mudar e os limites nao, a derivacao deixa de
 * fechar — e e justamente isso que o teste afirma.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ddlDeComentarios,
  ddlDeMetadadosDeComentario,
  ddlDoArmazenamentoDeInteracao,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  LIMITES_DE_COLUNA_DO_COMENTARIO,
  TAMANHO_MAXIMO_DE_INDICE,
  TIPO_PADRAO_DO_ARMAZENAMENTO,
} from './index.js';
import { criarPortaDeDadosFalsa } from './porta-falsa.js';

const CHARSET = 'DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci';

function porta(prefixo = 'wp_') {
  return criarPortaDeDadosFalsa({ prefixoDeTabela: prefixo }).porta;
}

test('o DDL de comments e o de `wp-admin/includes/schema.php:101` a `:123`, byte a byte', () => {
  // Transcrito do legado. Tabulacao, nao espaco; `PRIMARY KEY` com DOIS
  // espacos antes do parentese; `comment_approved,comment_date_gmt` sem espaco
  // depois da virgula. Cada uma dessas tres e uma irregularidade do original, e
  // cada uma delas vira `ALTER TABLE` se for "arrumada".
  assert.equal(
    ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET }),
    `CREATE TABLE wp_comments (
\tcomment_ID bigint(20) unsigned NOT NULL auto_increment,
\tcomment_post_ID bigint(20) unsigned NOT NULL default '0',
\tcomment_author tinytext NOT NULL,
\tcomment_author_email varchar(100) NOT NULL default '',
\tcomment_author_url varchar(200) NOT NULL default '',
\tcomment_author_IP varchar(100) NOT NULL default '',
\tcomment_date datetime NOT NULL default '0000-00-00 00:00:00',
\tcomment_date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
\tcomment_content text NOT NULL,
\tcomment_karma int(11) NOT NULL default '0',
\tcomment_approved varchar(20) NOT NULL default '1',
\tcomment_agent varchar(255) NOT NULL default '',
\tcomment_type varchar(20) NOT NULL default 'comment',
\tcomment_parent bigint(20) unsigned NOT NULL default '0',
\tuser_id bigint(20) unsigned NOT NULL default '0',
\tPRIMARY KEY  (comment_ID),
\tKEY comment_post_ID (comment_post_ID),
\tKEY comment_approved_date_gmt (comment_approved,comment_date_gmt),
\tKEY comment_date_gmt (comment_date_gmt),
\tKEY comment_parent (comment_parent),
\tKEY comment_author_email (comment_author_email(10))
) ${CHARSET};`,
  );
});

test('o DDL de commentmeta e o de `wp-admin/includes/schema.php:92` a `:100`, byte a byte', () => {
  assert.equal(
    ddlDeMetadadosDeComentario(porta(), { clausulaDeCharset: CHARSET }),
    `CREATE TABLE wp_commentmeta (
\tmeta_id bigint(20) unsigned NOT NULL auto_increment,
\tcomment_id bigint(20) unsigned NOT NULL default '0',
\tmeta_key varchar(255) default NULL,
\tmeta_value longtext,
\tPRIMARY KEY  (meta_id),
\tKEY comment_id (comment_id),
\tKEY meta_key (meta_key(191))
) ${CHARSET};`,
  );
});

test('nenhuma chave estrangeira, nenhum `ENUM` e nenhum `CHECK` nas duas tabelas', () => {
  const ddl = ddlDoArmazenamentoDeInteracao(porta(), {
    clausulaDeCharset: CHARSET,
  });

  // P5 e a resposta 2: a ausencia de chave estrangeira e comportamento do
  // produto. As quatro relacoes desta feature — comment_post_ID, comment_parent,
  // user_id e commentmeta.comment_id — nao tem integridade declarada.
  assert.equal(ddl.includes('FOREIGN KEY'), false);
  assert.equal(ddl.includes('REFERENCES'), false);
  assert.equal(ddl.includes('ON DELETE'), false);
  // DB-ENUM (BR-MIGRAR-075): as maquinas de estado sao validadas na aplicacao.
  assert.equal(ddl.includes('ENUM'), false);
  assert.equal(ddl.includes('CHECK'), false);
  // DB-UNIQ: nenhuma das tres garantias de unicidade do banco nasce aqui.
  assert.equal(ddl.includes('UNIQUE'), false);
});

test('as duas tabelas saem na ordem do legado: commentmeta antes de comments', () => {
  const ddl = ddlDoArmazenamentoDeInteracao(porta(), {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(
    ddl.indexOf('CREATE TABLE wp_commentmeta') <
      ddl.indexOf('CREATE TABLE wp_comments'),
  );
  assert.equal(ddl.split('CREATE TABLE').length - 1, 2);
  assert.ok(ddl.endsWith(';\n'));
});

test('o prefixo do site entra nos dois nomes de tabela', () => {
  const ddl = ddlDoArmazenamentoDeInteracao(porta('wp_7_'), {
    clausulaDeCharset: CHARSET,
  });

  assert.ok(ddl.includes('CREATE TABLE wp_7_commentmeta ('));
  assert.ok(ddl.includes('CREATE TABLE wp_7_comments ('));
});

test('as duas colunas mortas e irregulares continuam no esquema', () => {
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET });

  // `comment_karma`: DB-DEAD (BR-MIGRAR-086), ancorada nesta linha do legado.
  assert.ok(ddl.includes("comment_karma int(11) NOT NULL default '0',"));
  // `comment_ID` com maiuscula irregular, e `comment_post_ID` tambem: sao os
  // nomes do legado, e renomear e mudar contrato publico (P8).
  assert.ok(ddl.includes('comment_ID bigint(20)'));
  assert.ok(ddl.includes('comment_post_ID bigint(20)'));
  assert.ok(ddl.includes('comment_author_IP varchar(100)'));
});

test('a sentinela de data e o default das duas colunas `datetime`', () => {
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET });

  // DB-SENT (BR-MIGRAR-081). 🔴 BR-HUMANA-003 decide o destino dela e esta
  // pendente; o teste fixa a premissa declarada, nao uma decisao.
  assert.equal(ddl.split("default '0000-00-00 00:00:00'").length - 1, 2);
});

test('o prefixo do indice de e-mail e DEZ, e o da chave de metadado e 191', () => {
  const ddl = ddlDoArmazenamentoDeInteracao(porta(), {
    clausulaDeCharset: CHARSET,
  });

  // O indice que `C7` consulta: dez caracteres, literal no DDL, e NAO
  // `$max_index_length`. Duas contas que so diferem depois do decimo caractere
  // colidem no indice.
  assert.ok(ddl.includes('KEY comment_author_email (comment_author_email(10))'));
  assert.ok(ddl.includes('KEY meta_key (meta_key(191))'));
  assert.equal(TAMANHO_MAXIMO_DE_INDICE, 191);
});

test('o tamanho do prefixo de indice e substituivel, e so ele', () => {
  const ddl = ddlDeMetadadosDeComentario(porta(), {
    clausulaDeCharset: CHARSET,
    tamanhoMaximoDeIndice: 255,
  });

  assert.ok(ddl.includes('KEY meta_key (meta_key(255))'));
});

test('os dois indices criticos desta tabela saem identicos', () => {
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET });

  // `target_data_model.md`, § Restricoes, *Indices criticos*: "os que o alvo
  // tem de emitir identicos, porque o legado conta com eles".
  assert.ok(
    ddl.includes(
      'KEY comment_approved_date_gmt (comment_approved,comment_date_gmt)',
    ),
  );
  assert.ok(ddl.includes('KEY comment_author_email (comment_author_email(10))'));
  // Seis indices, nem mais nem menos — a chave primaria e os cinco `KEY`. A
  // lacuna ERD-2 proibe acrescentar: volumetria e seletividade sao
  // desconhecidas, logo nao ha como dizer qual indice pagaria o proprio custo.
  assert.ok(ddl.includes('\n\tPRIMARY KEY  (comment_ID),'));
  assert.equal(ddl.split('\n\tKEY ').length - 1, 5);
});

test('o default do armazenamento e o da aplicacao COINCIDEM nesta tabela', () => {
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET });

  // Em `posts` os dois defaults divergem e BR-MIGRAR-001 proibe unifica-los.
  // Aqui NAO divergem: o DDL diz `'1'` e `wp_insert_comment()` resolve `1`
  // (`comment.php:2172`). O teste existe para que ninguem "conserte" a
  // coincidencia procurando a divergencia do vizinho.
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, '1');
  assert.ok(ddl.includes("comment_approved varchar(20) NOT NULL default '1',"));
  assert.equal(TIPO_PADRAO_DO_ARMAZENAMENTO, 'comment');
  assert.ok(
    ddl.includes("comment_type varchar(20) NOT NULL default 'comment',"),
  );
});

test('os quatro limites de coluna fecham com a conta que o legado faz do DDL', () => {
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: CHARSET });

  // `get_col_length()` devolve tipo `byte` para `tinytext` (255) e `text`
  // (65535), e `wp_get_comment_fields_max_lengths()` subtrai 10 nesse caso
  // (`comment.php:1290`); para `varchar` o tipo e `char` e nao ha subtracao.
  assert.ok(ddl.includes('comment_author tinytext NOT NULL,'));
  assert.equal(LIMITES_DE_COLUNA_DO_COMENTARIO.autor, 255 - 10);

  assert.ok(ddl.includes('comment_content text NOT NULL,'));
  assert.equal(LIMITES_DE_COLUNA_DO_COMENTARIO.texto, 65535 - 10);

  assert.ok(ddl.includes("comment_author_email varchar(100) NOT NULL default '',"));
  assert.equal(LIMITES_DE_COLUNA_DO_COMENTARIO.autorEmail, 100);

  assert.ok(ddl.includes("comment_author_url varchar(200) NOT NULL default '',"));
  assert.equal(LIMITES_DE_COLUNA_DO_COMENTARIO.autorUrl, 200);

  // E os quatro sao os mesmos numeros que o legado declara a mao em
  // `comment.php:1267` a `:1272`, antes de perguntar ao banco.
  assert.deepEqual(LIMITES_DE_COLUNA_DO_COMENTARIO, {
    autor: 245,
    autorEmail: 100,
    autorUrl: 200,
    texto: 65525,
  });
});

test('a clausula de charset e argumento obrigatorio, sem default (lacuna ERD-5)', () => {
  // Nao ha sobrecarga sem `clausulaDeCharset`: o valor vem de `DB_CHARSET` e
  // `DB_COLLATE` e do que o servidor aceita, e inventar um default fecharia uma
  // lacuna que a analise deixou aberta.
  const ddl = ddlDeComentarios(porta(), { clausulaDeCharset: '' });

  assert.ok(ddl.endsWith(') ;'));
});
