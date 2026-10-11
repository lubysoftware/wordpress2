/**
 * O DDL das duas tabelas, como o legado o emite — e os limites de coluna que
 * ele deriva dele.
 *
 * Por que uma cadeia literal e nao um construtor de esquema:
 * `target_data_model.md` abre a secao *Schema (DDL)* dizendo que o reproduz
 * *"e nao apenas referencia"* porque ele e **o contrato** que a metade
 * TypeScript tem de emitir para que a metade PHP reconheca o esquema pela
 * propria rotina de comparacao de estrutura (`DB-MIG`, BR-MIGRAR-085). Um
 * construtor que gerasse SQL equivalente produziria um `ALTER TABLE` a cada
 * comparacao, que e o oposto do que se quer.
 *
 * ── O QUE ESTE ARQUIVO NAO FAZ, E ISSO E BORDA DECLARADA ────────────────────
 *
 * **Nada aqui executa nada.** A tabela de bordas de `target_architecture.md`
 * tem a borda 4 — *"dono unico da evolucao de esquema"* —, e ela e literal: a
 * metade PHP mantem `db_version` e *"a metade nova **le e nunca escreve**
 * estrutura"*. A AD-11 repete: *"nenhuma mudanca de esquema e permitida nesta
 * fase"*. Logo este arquivo e **dado**: quem decide emitir a cadeia e quando e
 * a instalacao, que nao e tarefa desta feature.
 *
 * ── POR QUE O DDL ESTA NESTA TAREFA, E NAO NA QUE RECUSA O CAMPO LONGO ──────
 *
 * Porque os quatro limites de coluna que `C10` cobra **saem dele**, e o legado
 * os deriva em execucao: `wp_get_comment_fields_max_lengths()`
 * (`wp-includes/comment.php:1264` a `:1307`) declara quatro numeros a mao e
 * depois **pergunta ao banco** o tamanho real de cada coluna, substituindo o
 * valor declarado quando a resposta e util. Ver
 * {@link LIMITES_DE_COLUNA_DO_COMENTARIO}: os dois caminhos chegam ao mesmo
 * numero porque o DDL e este, e e so por isso.
 *
 * ── O QUE NAO SE MEXEU, UM POR UM ──────────────────────────────────────────
 *
 * - **Zero chave estrangeira**, nas duas tabelas. `commentmeta.comment_id`,
 *   `comments.comment_post_ID`, `comments.comment_parent` e `comments.user_id`
 *   nao tem integridade declarada: ela e *"cobrada em PHP"*, caso a caso, e o P5
 *   da constituicao poe a cascata observavel acima da correcao. Duas delas tem
 *   consequencia com nome: apagar um comentario **sobe** as respostas um nivel
 *   em vez de as apagar (`comment.php:1592`, e um `ON DELETE CASCADE` as
 *   apagaria), e **comentario orfao e estado normal** — apagar a conta nao toca
 *   nos comentarios dela (`erd-complete.md` §9 risco 2, cenario `@invariante`
 *   de `PT-001`). REQ-169, que pediria a integridade declarada, ficou fora do
 *   pacote (`do-not-rewrite.md`).
 * - **Nenhum `ENUM` e nenhum `CHECK`.** `comment_approved` e `comment_type` sao
 *   `varchar(20)` crus (`DB-ENUM`, BR-MIGRAR-075, que nomeia as duas), porque a
 *   maquina de estados e validada na aplicacao e o tipo e aberto por extensao
 *   (P2). Ver `vocabulario.ts`.
 * - **`comment_karma` continua no esquema.** E coluna morta (`DB-DEAD`,
 *   BR-MIGRAR-086, cuja ancora e exatamente a linha dela,
 *   `wp-admin/includes/schema.php:111`), e o nucleo *"nunca escreve nada alem de
 *   `0`"* — o que inclui escrever o zero. Ver `comentario.ts`, item 3.
 * - **A sentinela de data literal.** `'0000-00-00 00:00:00'` e o default das
 *   duas colunas `datetime` desta tabela e **carrega significado de negocio**
 *   (`DB-SENT`). 🔴 O destino dela e `BR-HUMANA-003` e esta **PENDENTE**: as
 *   tres opcoes (coluna anulavel, data de referencia, manter a cadeia) mudam o
 *   valor gravado. Este arquivo segue a premissa que `target_data_model.md` e
 *   `data_migration_plan.md` declaram — a opcao (c), manter — e **nao decide
 *   nada**: a decisao esta na tabela *Nao negociavel* da constituicao.
 * - **O indice composto da fila de moderacao, e o prefixo de dez.**
 *   `comment_approved_date_gmt (comment_approved, comment_date_gmt)` e
 *   `comment_author_email(10)` estao na lista de *"indices criticos — os que o
 *   alvo tem de emitir identicos, porque o legado conta com eles"*
 *   (`target_data_model.md`), com a nota de que o segundo e *"o que `C7`
 *   consulta"*. **Dez, nao 191**: e o unico prefixo de indice do esquema que nao
 *   usa `$max_index_length`, e ele e literal no DDL. Duas contas de e-mail que
 *   so diferem depois do decimo caractere colidem no indice, e nao no dado.
 * - **Nenhum indice acrescentado nem removido.** 🔴 A lacuna ERD-2 registra que
 *   volumetria e seletividade sao desconhecidas, logo nao ha como dizer quais
 *   indices compostos pagam o proprio custo. Herdar e a unica opcao honesta.
 *
 * ── AS DUAS LACUNAS 🔴 QUE CHEGAM POR ARGUMENTO ────────────────────────────
 *
 * `{clausulaDeCharset}` e `{tamanhoMaximoDeIndice}` sao as duas interpolacoes
 * do legado (`$charset_collate` e `$max_index_length`). A primeira e a **lacuna
 * ERD-5**: vem de `DB_CHARSET`/`DB_COLLATE` e do que o servidor suporta, e e
 * fato da borda — por isso e **argumento obrigatorio** e nao tem default aqui.
 * Inventar um fecharia uma lacuna que a analise deixou aberta de proposito. A
 * segunda tem valor de fabrica no legado e esta em
 * {@link TAMANHO_MAXIMO_DE_INDICE}.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  tabelaDeComentarios,
  tabelaDeMetadadosDeComentario,
} from './chaves-e-tabelas.js';

/* `wp-admin/includes/schema.php:92` a `:100`, byte a byte. */
const DDL_DE_METADADOS = `CREATE TABLE {tabela} (
	meta_id bigint(20) unsigned NOT NULL auto_increment,
	comment_id bigint(20) unsigned NOT NULL default '0',
	meta_key varchar(255) default NULL,
	meta_value longtext,
	PRIMARY KEY  (meta_id),
	KEY comment_id (comment_id),
	KEY meta_key (meta_key({tamanhoMaximoDeIndice}))
) {clausulaDeCharset};`;

/* `wp-admin/includes/schema.php:101` a `:123`, byte a byte. */
const DDL_DE_COMENTARIOS = `CREATE TABLE {tabela} (
	comment_ID bigint(20) unsigned NOT NULL auto_increment,
	comment_post_ID bigint(20) unsigned NOT NULL default '0',
	comment_author tinytext NOT NULL,
	comment_author_email varchar(100) NOT NULL default '',
	comment_author_url varchar(200) NOT NULL default '',
	comment_author_IP varchar(100) NOT NULL default '',
	comment_date datetime NOT NULL default '0000-00-00 00:00:00',
	comment_date_gmt datetime NOT NULL default '0000-00-00 00:00:00',
	comment_content text NOT NULL,
	comment_karma int(11) NOT NULL default '0',
	comment_approved varchar(20) NOT NULL default '1',
	comment_agent varchar(255) NOT NULL default '',
	comment_type varchar(20) NOT NULL default 'comment',
	comment_parent bigint(20) unsigned NOT NULL default '0',
	user_id bigint(20) unsigned NOT NULL default '0',
	PRIMARY KEY  (comment_ID),
	KEY comment_post_ID (comment_post_ID),
	KEY comment_approved_date_gmt (comment_approved,comment_date_gmt),
	KEY comment_date_gmt (comment_date_gmt),
	KEY comment_parent (comment_parent),
	KEY comment_author_email (comment_author_email(10))
) {clausulaDeCharset};`;

/**
 * `191`, o teto de caracteres de um prefixo de indice
 * (`wp-admin/includes/schema.php:53`).
 *
 * O comentario do legado explica o numero e vale transcrito, porque e historia
 * que nao se deduz do esquema: *"Indexes have a maximum size of 767 bytes. [...]
 * As of 4.2, however, we moved to utf8mb4, which uses 4 bytes per character.
 * This means that an index which used to have room for floor(767/3) = 255
 * characters, now only has room for floor(767/4) = 191 characters."*
 *
 * ⚠️ Nesta feature ele governa **uma** linha, a de `commentmeta.meta_key`. O
 * outro prefixo de indice daqui, `comment_author_email(10)`, e literal no DDL e
 * **nao** usa este valor.
 */
export const TAMANHO_MAXIMO_DE_INDICE = 191;

/**
 * O default que o DDL impoe a `comment_approved` quando a linha e inserida
 * **sem** a coluna: `'1'`, aprovado.
 *
 * Esta nomeado por insistencia do P6 — *"cada numero vive num ponto de
 * configuracao nomeado, com o valor de fabrica do legado"* — e por um motivo
 * especifico desta tabela: quem leu BR-MIGRAR-001 em `posts` vai procurar aqui a
 * mesma divergencia entre o default do DDL e o da aplicacao, e **nao existe**.
 * `wp_insert_comment()` resolve `comment_approved` para `1` quando o campo nao
 * foi informado (`wp-includes/comment.php:2172`), que e o mesmo valor. Os dois
 * caminhos coincidem, e registrar a coincidencia e o que evita que alguem a
 * "conserte".
 *
 * A diferenca que **existe** nesta tabela e outra, e esta em `comentario.ts`: o
 * teste do legado e `! isset()` para esta coluna e `empty()` para
 * `comment_type`, logo receber texto vazio produz resultados diferentes nas
 * duas.
 */
export const ESTADO_PADRAO_DO_ARMAZENAMENTO = '1';

/** O default que o DDL impoe a `comment_type`: `'comment'`. */
export const TIPO_PADRAO_DO_ARMAZENAMENTO = 'comment';

/**
 * Os quatro limites de campo que `C10` cobra, em **bytes**.
 *
 * `C10` (BR-MIGRAR-018) e a regra que o `plan.md` chama de contraria ao resto do
 * sistema: *"texto longo demais e erro de usuario, nao truncamento, ao contrario
 * do resto do sistema, que trunca em silencio"*. CA-5.3 pede que *"o limite de
 * cada campo seja declarado e visivel na tela antes do envio"*, e e por isso que
 * os quatro sao constante nomeada e nao numero no meio de uma validacao.
 *
 * **De onde vem cada um, e por que a conta fecha.**
 * `wp_get_comment_fields_max_lengths()` declara os quatro a mao
 * (`wp-includes/comment.php:1267` a `:1272`) e, em MySQL, pergunta a coluna:
 * `get_col_length()` (`wp-includes/class-wpdb.php:3445`) devolve `{type, length}`
 * e, **quando o tipo e `byte`, o legado subtrai 10** (`comment.php:1290`). Com o
 * DDL deste arquivo:
 *
 * | campo | coluna | tipo devolvido | conta | limite |
 * |---|---|---|---|---|
 * | nome | `comment_author` | `tinytext` → `byte`, 255 | 255 − 10 | **245** |
 * | e-mail | `comment_author_email` | `varchar(100)` → `char`, 100 | sem subtracao | **100** |
 * | endereco | `comment_author_url` | `varchar(200)` → `char`, 200 | sem subtracao | **200** |
 * | texto | `comment_content` | `text` → `byte`, 65535 | 65535 − 10 | **65525** |
 *
 * Os valores declarados a mao sao **os mesmos**, e a coincidencia e o achado:
 * nenhum dos dois caminhos pode ser apagado em favor do outro, porque o legado
 * roda os dois e o segundo vence quando a coluna foi alterada por uma extensao.
 *
 * ⚠️ **Sao bytes, nao caracteres, e a medicao nao e uniforme.** `comment_author`
 * e `comment_content` sao comparados com `mb_strlen( $valor, '8bit' )` e os
 * outros dois com `strlen()` (`comment.php:1322` a `:1334`) — as duas contam
 * bytes, e a escolha diferente nao muda o resultado. O que **muda** e tratar
 * isso como comprimento de `string` em JavaScript: um caractere fora do ASCII
 * ocupa de 2 a 4 bytes, e `'a'.repeat(246)` e `'á'.repeat(123)` cabem de forma
 * diferente. **A comparacao e de T012**, e ela tem de ser em bytes.
 *
 * ⚠️ E o filtro `wp_get_comment_fields_max_lengths` (`comment.php:1307`) pode
 * trocar qualquer um dos quatro: estes sao o **default filtravel**, nao o teto
 * do produto. Ele nao e emitido aqui — nao ha barramento de ganchos nesta
 * arvore.
 */
export const LIMITES_DE_COLUNA_DO_COMENTARIO = Object.freeze({
  /** `comment_author`, `tinytext`: 255 − 10. */
  autor: 245,
  /** `comment_author_email`, `varchar(100)`. */
  autorEmail: 100,
  /** `comment_author_url`, `varchar(200)`. */
  autorUrl: 200,
  /** `comment_content`, `text`: 65535 − 10. */
  texto: 65525,
} as const);

/** As duas interpolacoes que o DDL do legado carrega. */
export interface OpcoesDoEsquema {
  /**
   * `$charset_collate` — 🔴 **lacuna ERD-5**, sem default neste arquivo.
   *
   * No legado e `$wpdb->get_charset_collate()`, montado de `DB_CHARSET` e
   * `DB_COLLATE` e do que o servidor aceita. Exemplo de forma, **nao** de
   * valor: `DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci`.
   */
  readonly clausulaDeCharset: string;
  /** `$max_index_length`. O valor de fabrica e {@link TAMANHO_MAXIMO_DE_INDICE}. */
  readonly tamanhoMaximoDeIndice?: number;
}

/** `CREATE TABLE {site}commentmeta` — 4 colunas, 3 indices, zero chave estrangeira. */
export function ddlDeMetadadosDeComentario(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(
    DDL_DE_METADADOS,
    tabelaDeMetadadosDeComentario(dados),
    opcoes,
  );
}

/** `CREATE TABLE {site}comments` — 15 colunas, 6 indices, zero chave estrangeira. */
export function ddlDeComentarios(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(DDL_DE_COMENTARIOS, tabelaDeComentarios(dados), opcoes);
}

/**
 * As duas, **na ordem em que o legado as declara**: `commentmeta` antes de
 * `comments`.
 *
 * A ordem e a de `$blog_tables` (`wp-admin/includes/schema.php:92` e `:101`), e
 * ela e preservada porque a rotina de comparacao de estrutura do legado le a
 * cadeia inteira e separa por `CREATE TABLE`. Nao ha dependencia entre as duas
 * para o banco honrar — nao ha chave estrangeira entre elas —, logo a ordem e
 * forma, e forma e o que `DB-MIG` compara.
 */
export function ddlDoArmazenamentoDeInteracao(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return `${ddlDeMetadadosDeComentario(dados, opcoes)}\n${ddlDeComentarios(dados, opcoes)}\n`;
}

function montar(
  modelo: string,
  tabela: string,
  opcoes: OpcoesDoEsquema,
): string {
  const tamanho = opcoes.tamanhoMaximoDeIndice ?? TAMANHO_MAXIMO_DE_INDICE;
  return modelo
    .replaceAll('{tabela}', tabela)
    .replaceAll('{tamanhoMaximoDeIndice}', String(tamanho))
    .replaceAll('{clausulaDeCharset}', opcoes.clausulaDeCharset);
}
