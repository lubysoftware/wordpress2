/**
 * O DDL das tres tabelas, como o legado o emite.
 *
 * Por que uma cadeia literal e nao um construtor de esquema:
 * `target_data_model.md` abre a secao *Schema (DDL)* dizendo que o reproduz
 * *"e nao apenas referencia"* porque ele e **o contrato** que a metade
 * TypeScript tem de emitir para que a metade PHP reconheca o esquema pela
 * propria rotina de comparacao de estrutura (`DB-MIG`, BR-MIGRAR-085). Um
 * construtor que gerasse SQL equivalente produziria um `ALTER TABLE` a cada
 * comparacao, que e o oposto do que se quer. A nota final daquele documento e
 * dirigida a esta tarefa: *"emita este DDL **sem uma letra de diferenca** e
 * trate qualquer vontade de melhora-lo como sinal de que falta ler a secao
 * Visao geral — a melhoria e correta e o momento e errado"*.
 *
 * ── A LETRA QUE QUASE SE PERDE: ESTE BLOCO E INDENTADO COM ESPACO ───────────
 *
 * `termmeta`, `postmeta` e `posts` sao indentados com **tabulacao**; `terms`,
 * `term_taxonomy` e `term_relationships` sao indentados com **um espaco**
 * (`wp-admin/includes/schema.php:66` a `:90`, conferido byte a byte). E
 * irregularidade do legado, nao estilo, e o `esquema.ts` de BC-01 — que porta as
 * duas tabelas de tabulacao — esta certo pelo mesmo motivo que este esta: cada
 * um transcreve o bloco que lhe cabe. Normalizar os dois para o mesmo caractere
 * e exatamente a "melhoria" que `DB-MIG` transforma em `ALTER TABLE`.
 *
 * ── AS DUAS GARANTIAS REAIS QUE NASCEM AQUI, DE TRES NO BANCO INTEIRO ──────
 *
 * `DB-UNIQ` (BR-MIGRAR-076) conta **tres** garantias de unicidade no esquema
 * todo, e **duas** sao destas tabelas:
 *
 * 1. `UNIQUE KEY term_id_taxonomy (term_id,taxonomy)` em `term_taxonomy`
 *    (`schema.php:82`) — **e a unicidade de rotulo por contexto que a entrega de
 *    T002 pede**, e `target_domain_model.md` a poe como primeira invariante de
 *    `AGG-Termo`: *"e o que **impede** o mesmo termo duas vezes na mesma
 *    taxonomia"*. Ela mora no DDL porque e no DDL que ela e cobrada: o caminho de
 *    aplicacao **le antes de inserir** (ver `rotulo-no-contexto.ts`,
 *    `idDoRotuloNoContexto`), e e essa leitura mais esta chave que fecham a
 *    regra. Uma das duas sozinha nao fecha.
 * 2. `PRIMARY KEY (object_id,term_taxonomy_id)` em `term_relationships`
 *    (`schema.php:89`) — **a chave composta da juncao**, a unica PK composta do
 *    esquema, e *"a unica garantia estrutural de vinculo nao duplicado"*
 *    (`target_data_model.md`, secao Relacionamentos).
 *
 * ⚠️ E a terceira garantia **nao** e aqui: `terms.slug` e `KEY`, nao
 * `UNIQUE KEY`. A colisao de identificador na URL e resolvida em codigo, sujeita
 * a corrida (`DB-UNIQ`: *"slug de termo"* esta na lista das que o banco **nao**
 * garante), e `BR-MIGRAR-076` e explicito sobre acrescentar: *"acrescentar
 * `UNIQUE` no alvo fecha corridas reais — e muda o efeito no banco... Se for
 * feito, e decisao registrada por coluna, nao varredura"*.
 *
 * ── O QUE NAO SE MEXEU, UM POR UM ──────────────────────────────────────────
 *
 * - **Zero chave estrangeira**, nas tres. `target_data_model.md` da os tres
 *   motivos independentes de a integridade referencial estar desativada, e o
 *   terceiro e desta tabela: *"`term_relationships.object_id` e polimorfico e sem
 *   discriminador — nao ha tabela unica para a FK apontar"*. O P5 da constituicao
 *   poe a cascata observavel acima da correcao.
 * - **Zero coluna acrescentada, e isso alcanca o discriminador.** A tabela
 *   *Modelo de dados* de `plan.md` escreve *"o modelo novo precisa de
 *   discriminador"*; o risco 1 do mesmo plano chama a escolha de *"decisao de
 *   modelo que a spec deixa em aberto"*; a `spec.md` a registra entre as
 *   *Perguntas em aberto* — **ninguem decidiu**. E `target_data_model.md` fecha o
 *   que esta fase faz com ela, na secao *O que seria modelado diferente, e nao
 *   e*, item 2: o discriminador e *"o conserto certo e a mudanca de esquema
 *   errada **nesta fase**"*, com o resumo da coluna de origem em negrito —
 *   *"**zero tabelas acrescentadas, zero colunas acrescentadas, zero indices
 *   acrescentados**"*. Logo este DDL **nao** tem discriminador, e isso nao
 *   responde a pergunta aberta: so nao a antecipa.
 * - **Zero indice acrescentado, e isso alcanca o risco 4 do plano.** O risco 4
 *   observa que *"nao existe indice isolado no objeto da juncao"* e sugere que
 *   *"o modelo novo precisa do segundo indice, ou herda uma consulta lenta que o
 *   legado tambem tem"*. Os dois indices emitidos aqui sao os dois do legado: a
 *   PK composta e `KEY term_taxonomy_id`. O terceiro cai no mesmo *zero indices
 *   acrescentados* de `target_data_model.md`, e a porta de dados de T001 ja
 *   registrou a consequencia: *"a consulta lenta e a do legado, e a porta nao a
 *   reescreve"*.
 * - **A fusao de `terms` com `term_taxonomy` nao e fisica.**
 *   `target_domain_model.md` e literal: *"a fusao e do **aggregate**, nao das
 *   tabelas: o esquema fica intacto (AD-11), e as duas tabelas continuam
 *   existindo"*, e `target_data_model.md` repete na coluna de transformacao de
 *   `term_taxonomy`. A leitura fundida existe — e `termo.ts` —, as tabelas nao.
 * - **Nenhum `ENUM` e nenhum `CHECK`.** `taxonomy` e `varchar(32)` cru
 *   (`DB-ENUM`, BR-MIGRAR-075), porque `register_taxonomy()` e ponto de extensao
 *   publico (P2) e o conjunto dos oito e *"piso, nao teto"*. O numero 32 e o
 *   mesmo de `LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO` em
 *   `../registro/contexto-de-classificacao.ts`, e o teste deste arquivo afirma
 *   que os dois nao se separam.
 * - **Os sentinelas sao literais, e `0` significa ausencia.**
 *   `term_taxonomy.parent` nasce `0` e `0` quer dizer "sem pai" (`DB-SENT`,
 *   BR-MIGRAR-081: *"logo `WHERE pai IS NULL` nunca acusa orfao"*). Idem
 *   `term_group`, `count`, `object_id` e `term_order`. Nenhuma coluna destas
 *   tres tabelas e anulavel, e nenhuma guarda valor serializado — o `longtext`
 *   serializado de BC-02 e `termmeta.meta_value`, que nao esta aqui.
 * - **A coluna que o nucleo quase nunca escreve continua no esquema.**
 *   `term_relationships.term_order` e usada so por menu de navegacao
 *   (`$tax->sort`), e a insercao normal da juncao **nao a menciona** — ver
 *   `vinculo.ts`.
 *
 * ── AS DUAS LACUNAS 🔴 QUE CHEGAM POR ARGUMENTO ────────────────────────────
 *
 * `{clausulaDeCharset}` e `{tamanhoMaximoDeIndice}` sao as duas interpolacoes do
 * legado (`$charset_collate` e `$max_index_length`). A primeira e a **lacuna
 * ERD-5**: vem de `DB_CHARSET`/`DB_COLLATE` e do que o servidor suporta, e e
 * fato da borda — por isso e **argumento obrigatorio** e nao tem default aqui.
 * Inventar um fecharia uma lacuna que a analise deixou aberta de proposito. A
 * segunda tem valor de fabrica no legado e esta em
 * {@link TAMANHO_MAXIMO_DE_INDICE}.
 *
 * ── E ESTE ARQUIVO NAO EXECUTA NADA ────────────────────────────────────────
 *
 * A borda 4 de `target_architecture.md` — *"dono unico da evolucao de esquema"* —
 * e literal: a metade PHP mantem `db_version` e *"a metade nova **le e nunca
 * escreve** estrutura"*. A AD-11 repete: *"nenhuma mudanca de esquema e permitida
 * nesta fase"*. Logo isto e **dado**: quem decide emitir a cadeia, e quando, e a
 * instalacao, que nao e tarefa desta feature.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  tabelaDeRotulos,
  tabelaDeRotulosNoContexto,
  tabelaDeVinculos,
} from './chaves-e-tabelas.js';

/* `wp-admin/includes/schema.php:65` a `:73`, byte a byte — indentacao de UM espaco. */
const DDL_DE_ROTULOS = `CREATE TABLE {tabela} (
 term_id bigint(20) unsigned NOT NULL auto_increment,
 name varchar(200) NOT NULL default '',
 slug varchar(200) NOT NULL default '',
 term_group bigint(10) NOT NULL default 0,
 PRIMARY KEY  (term_id),
 KEY slug (slug({tamanhoMaximoDeIndice})),
 KEY name (name({tamanhoMaximoDeIndice}))
) {clausulaDeCharset};`;

/* `wp-admin/includes/schema.php:74` a `:84`, byte a byte. */
const DDL_DE_ROTULOS_NO_CONTEXTO = `CREATE TABLE {tabela} (
 term_taxonomy_id bigint(20) unsigned NOT NULL auto_increment,
 term_id bigint(20) unsigned NOT NULL default 0,
 taxonomy varchar(32) NOT NULL default '',
 description longtext NOT NULL,
 parent bigint(20) unsigned NOT NULL default 0,
 count bigint(20) NOT NULL default 0,
 PRIMARY KEY  (term_taxonomy_id),
 UNIQUE KEY term_id_taxonomy (term_id,taxonomy),
 KEY taxonomy (taxonomy)
) {clausulaDeCharset};`;

/* `wp-admin/includes/schema.php:85` a `:91`, byte a byte. */
const DDL_DE_VINCULOS = `CREATE TABLE {tabela} (
 object_id bigint(20) unsigned NOT NULL default 0,
 term_taxonomy_id bigint(20) unsigned NOT NULL default 0,
 term_order int(11) NOT NULL default 0,
 PRIMARY KEY  (object_id,term_taxonomy_id),
 KEY term_taxonomy_id (term_taxonomy_id)
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
 * Nestas tabelas ele alcanca `terms.slug` e `terms.name`, que sao `varchar(200)`
 * e portanto **mais largas do que o indice delas**: dois rotulos que so diferem
 * depois do caractere 191 colidem no indice e nao no dado. E o mesmo numero do
 * `esquema.ts` de BC-01, e ele e declarado uma vez por contexto porque a regra de
 * dependencia 3 de `target_architecture.md` proibe um contexto importar outro.
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

/** `CREATE TABLE {site}terms` — 4 colunas, 3 indices, zero chave estrangeira. */
export function ddlDeRotulos(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(DDL_DE_ROTULOS, tabelaDeRotulos(dados), opcoes);
}

/**
 * `CREATE TABLE {site}term_taxonomy` — 6 colunas, 3 indices, **1 das 3
 * garantias de unicidade do banco inteiro**.
 */
export function ddlDeRotulosNoContexto(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(
    DDL_DE_ROTULOS_NO_CONTEXTO,
    tabelaDeRotulosNoContexto(dados),
    opcoes,
  );
}

/**
 * `CREATE TABLE {site}term_relationships` — 3 colunas, 2 indices, **a unica
 * chave primaria composta do esquema**.
 */
export function ddlDeVinculos(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return montar(DDL_DE_VINCULOS, tabelaDeVinculos(dados), opcoes);
}

/**
 * As tres, **na ordem em que o legado as declara**: `terms`, `term_taxonomy`,
 * `term_relationships`.
 *
 * A ordem e a de `$blog_tables` (`wp-admin/includes/schema.php:65`, `:74` e
 * `:85`), e ela e preservada porque a rotina de comparacao de estrutura do legado
 * le a cadeia inteira e separa por `CREATE TABLE`. Nao ha dependencia entre as
 * tres para o banco honrar — nao ha chave estrangeira entre elas —, logo a ordem
 * e forma, e forma e o que `DB-MIG` compara.
 *
 * ⚠️ **Esta cadeia nao e o `$blog_tables` inteiro**: no legado, `termmeta` vem
 * antes de `terms`, e `commentmeta`, `comments`, `links`, `options`, `postmeta` e
 * `posts` vem depois. Quem montar o instalador concatena os blocos de cada
 * contexto nessa ordem; nenhum deles e desta tarefa (ver `chaves-e-tabelas.ts`).
 */
export function ddlDoArmazenamentoDeClassificacao(
  dados: PortaDeDados,
  opcoes: OpcoesDoEsquema,
): string {
  return (
    `${ddlDeRotulos(dados, opcoes)}\n` +
    `${ddlDeRotulosNoContexto(dados, opcoes)}\n` +
    `${ddlDeVinculos(dados, opcoes)}\n`
  );
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
