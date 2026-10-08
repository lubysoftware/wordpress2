/**
 * O DDL das duas tabelas, como o legado o emite.
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
 * a instalacao, que nao e tarefa desta feature. Uma funcao que executasse o DDL
 * daqui atravessaria a borda 4 sem decisao de ninguem.
 *
 * ── O DEFAULT QUE DIVERGE, QUE E A RAZAO DE T002 CARREGAR O DDL ─────────────
 *
 * `post_status varchar(20) NOT NULL default 'publish'`
 * (`wp-admin/includes/schema.php:167`). Esse `publish` e
 * `ESTADO_PADRAO_DO_ARMAZENAMENTO` de `../estado-editorial.ts`, e **nao** e o
 * default da aplicacao, que e `draft` (`wp-includes/post.php:4703`).
 * BR-MIGRAR-001 e literal: *"o alvo nao pode unificar os dois defaults"*, e o
 * primeiro cenario de `02-publicacao-e-agendamento-de-conteudo.feature` cobra
 * os dois lados — *"uma linha inserida diretamente na tabela, sem informar o
 * status, recebe `publish`"*. Esse lado so existe se o DDL carregar o default,
 * e e por isso que ele esta nesta tarefa e nao na que grava.
 *
 * ── O QUE NAO SE MEXEU, UM POR UM ──────────────────────────────────────────
 *
 * - **Zero chave estrangeira**, nas duas tabelas. `postmeta.post_id` e
 *   `posts.post_parent` nao tem integridade declarada: ela e *"cobrada em
 *   PHP"*, e o P5 da constituicao poe a cascata observavel acima da correcao.
 *   `wp_delete_post()` **reparenteia** pagina filha e anexo para o avo
 *   (`wp-includes/post.php:3908` e `:3923`): um `ON DELETE CASCADE` os
 *   apagaria. REQ-169, que pediria a integridade declarada, ficou fora do
 *   pacote (`do-not-rewrite.md`).
 * - **Nenhuma unicidade em `post_name`.** So tres garantias de unicidade
 *   existem no banco todo (`DB-UNIQ`) e nenhuma e aqui. A dispensa de unicidade
 *   do identificador na URL em rascunho **e** a regra (BR-MIGRAR-005), e
 *   declarar `UNIQUE` quebraria o produto.
 * - **Nenhum `ENUM` e nenhum `CHECK`.** `post_status` e `post_type` sao
 *   `varchar(20)` crus (`DB-ENUM`, BR-MIGRAR-075), porque
 *   `register_post_status()` e `register_post_type()` sao pontos de extensao
 *   publicos (P2) e o conjunto documentado e *"piso, nao teto"*.
 * - **A sentinela de data literal.** `'0000-00-00 00:00:00'` e o default das
 *   quatro colunas `datetime` e **carrega significado de negocio** (`DB-SENT`).
 *   🔴 O destino dela e `BR-HUMANA-003` e esta **PENDENTE**: as tres opcoes
 *   (coluna anulavel, data de referencia, manter a cadeia) mudam o valor
 *   gravado. Este arquivo segue a premissa que `target_data_model.md` e
 *   `data_migration_plan.md` declaram — a opcao (c), manter — e **nao decide
 *   nada**: a decisao esta na tabela *Nao negociavel* da constituicao.
 * - **As colunas que o nucleo nunca escreve continuam no esquema.**
 *   `comment_count` e contador desnormalizado mantido a mao e por outro caminho
 *   (`DB-TRG1`), e nenhuma escrita desta feature a menciona — ver
 *   `conteudo.ts`.
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
  tabelaDeConteudo,
  tabelaDeMetadadosDeConteudo,
} from './chaves-e-tabelas.js';

/* `wp-admin/includes/schema.php:150` a `:158`, byte a byte. */
const DDL_DE_METADADOS = `CREATE TABLE {tabela} (
	meta_id bigint(20) unsigned NOT NULL auto_increment,
	post_id bigint(20) unsigned NOT NULL default '0',
	meta_key varchar(255) default NULL,
	meta_value longtext,
	PRIMARY KEY  (meta_id),
	KEY post_id (post_id),
	KEY meta_key (meta_key({tamanhoMaximoDeIndice}))
) {clausulaDeCharset};`;

/* `wp-admin/includes/schema.php:159` a `:189`, byte a byte. */
const DDL_DE_CONTEUDO = `CREATE TABLE {tabela} (
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
	KEY post_name (post_name({tamanhoMaximoDeIndice})),
	KEY type_status_date (post_type,post_status,post_date,ID),
	KEY post_parent (post_parent),
	KEY post_author (post_author),
	KEY type_status_author (post_type,post_status,post_author)
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
 * E por isso que `postmeta.meta_key` e indexada **so nos 191 primeiros
 * caracteres**, como a secao *Modelo de dados* do plano registra: duas chaves
 * que so diferem depois do caractere 191 colidem no indice e nao no dado.
 */
export const TAMANHO_MAXIMO_DE_INDICE = 191;

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

/** `CREATE TABLE {site}postmeta` — 4 colunas, 3 indices, zero chave estrangeira. */
export function ddlDeMetadadosDeConteudo(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(DDL_DE_METADADOS, tabelaDeMetadadosDeConteudo(dados), opcoes);
}

/** `CREATE TABLE {site}posts` — 23 colunas, 6 indices, zero chave estrangeira. */
export function ddlDeConteudo(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(DDL_DE_CONTEUDO, tabelaDeConteudo(dados), opcoes);
}

/**
 * As duas, **na ordem em que o legado as declara**: `postmeta` antes de `posts`.
 *
 * A ordem e a de `$blog_tables` (`wp-admin/includes/schema.php:150` e `:159`), e
 * ela e preservada porque a rotina de comparacao de estrutura do legado le a
 * cadeia inteira e separa por `CREATE TABLE`. Nao ha dependencia entre as duas
 * para o banco honrar — nao ha chave estrangeira entre elas —, logo a ordem e
 * forma, e forma e o que `DB-MIG` compara.
 */
export function ddlDoArmazenamentoDeConteudo(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return `${ddlDeMetadadosDeConteudo(dados, opcoes)}\n${ddlDeConteudo(dados, opcoes)}\n`;
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
