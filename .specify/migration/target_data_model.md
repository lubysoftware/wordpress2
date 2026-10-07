---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: target_data_model
producedBy: designer
hash: "sha256:60cf5b22bc12a50520bbdbc834dfebee5cf5b0ab68c5a731f7d9a6a29982d91d"
---

# Target Data Model

> Modelo de dados do sistema novo. *Schema*, relacionamentos e restrições.

> 📌 **PREMISSA DECLARADA, e aqui ela é a mais consequente dos quatro artefatos.** Este modelo pressupõe a
> estratégia **A — Strangler Fig com banco compartilhado** ([`migration_strategy.md`](migration_strategy.md)
> § 6 **em branco**) e `BR-HUMANA-003` = **(c)**, manter a string literal do sentinela de data
> ([AMB-006](ambiguity_log.md), **PENDENTE**).
>
> 🔴 **Se `BR-HUMANA-003` for (a)** — coluna `datetime` anulável com marcador explícito —, o esquema muda,
> as duas metades deixam de poder compartilhar o banco, a estratégia A perde o seu *enabler*, e **este
> artefato e [`data_migration_plan.md`](data_migration_plan.md) precisam ser reavaliados, não ajustados**.
> A topologia **não** afeta este artefato: aggregate e tabela não dependem de onde a pasta fica.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Lido do DDL de instalação, com `arquivo:linha` |
| 🟡 INFERIDO | Decisão deste agente, derivada de evidência |
| 🔴 LACUNA | Depende de acesso a instalação real ou de resposta humana |

---

## Visão geral

**O banco alvo é MySQL/MariaDB, com o esquema do legado INALTERADO.** Isso não é omissão de modelagem: é
**requisito**, por três razões que se somam.

1. **A coexistência exige um banco só.** A estratégia recomendada põe as duas metades — PHP e TypeScript —
   sobre o **mesmo** banco, atrás de um *proxy* que alterna destino por superfície HTTP. Qualquer mudança de
   esquema derruba isso ([`migration_strategy.md`](migration_strategy.md) § 4.3).
2. **O esquema é área *efeito no banco* do critério de aceite.** A Decisão 2 declara que o esquema e as
   escritas são comparados por **efeito no banco**, *"incluindo a cascata de 7 etapas e os órfãos que o
   legado deixa de propósito"*.
3. **Mudança de esquema aqui muda comportamento observável, e isso é medido, não suposto.**
   [`erd-complete.md`](../erd-complete.md) §9 risco 1: declarar `FOREIGN KEY ... ON DELETE CASCADE` **muda
   o comportamento do legado**, porque `wp_delete_post()` **reparenteia** página filha e anexo para o avô
   em vez de apagá-los (`wp-includes/post.php:3908`, `:3923`).

**Portanto, e vale escrito por extenso: toda melhoria de modelagem é PROIBIDA nesta fase.** Nenhuma FK,
nenhum `ENUM`, nenhum `CHECK`, nenhum `NOT NULL` novo, nenhuma coluna anulável, nenhuma normalização,
nenhum *trigger*. As melhorias **continuam sendo melhorias** — e cada uma é decisão separada, registrada,
posterior ao corte final. A § *O que seria modelado diferente* lista as sete que este agente identificou,
precisamente para que não se perca o conhecimento de que elas existem.

**Papéis**: um banco **OLTP** único. **Não há OLAP, não há *event store* e não há tabela de *outbox*** — ver
§ *Considerações específicas do paradigma alvo*.

**Forma**: o esquema **não é um conjunto fixo**. Numa rede de N sites o banco tem `2 + 6 + 10·N` tabelas 🟢
(`wp-includes/class-wpdb.php:1122`). Os números abaixo descrevem a instalação de referência com **um** site.

---

## Entidades de dados

As **18** tabelas, **135** colunas e **59** índices, conferidos direto do DDL em
[`contar_schema.py`](../../.reversa/work/reversa-designer/contar_schema.py).

| Entidade | Tabela / coleção | Aggregate dono | PK | Bounded context |
|---|---|---|---|---|
| `Conteudo` | `{p}posts` | `AGG-Conteudo` | `ID` | `BC-01` |
| `Revisao` | `{p}posts` (`post_type='revision'`) | `AGG-Revisao` | `ID` | `BC-01` |
| `Anexo` | `{p}posts` (`post_type='attachment'`) | `AGG-Anexo` | `ID` | `BC-04` |
| `SolicitacaoDeDadoPessoal` | `{p}posts` (`post_type='user_request'`) | `AGG-SolicitacaoDeDadoPessoal` | `ID` | `BC-06` |
| `Changeset` | `{p}posts` (`post_type='customize_changeset'`) | `AGG-Changeset` | `ID` | `BC-07` |
| `ItemDeMenu` | `{p}posts` (`post_type='nav_menu_item'`) | `AGG-MenuDeNavegacao` | `ID` | `BC-07` |
| `MetadadoDeConteudo` | `{p}postmeta` | o aggregate possuidor | `meta_id` | `BC-01` / `BC-04` / `BC-06` / `BC-07` |
| `Comentario` | `{p}comments` | `AGG-Comentario` | `comment_ID` | `BC-03` |
| `MetadadoDeComentario` | `{p}commentmeta` | `AGG-Comentario` | `meta_id` | `BC-03` |
| `Termo` (nome e slug) | `{p}terms` | `AGG-Termo` | `term_id` | `BC-02` |
| `Termo` (taxonomia e hierarquia) | `{p}term_taxonomy` | `AGG-Termo` | `term_taxonomy_id` | `BC-02` |
| `VinculoObjetoTermo` | `{p}term_relationships` | `AGG-Termo` | **`(object_id, term_taxonomy_id)`** | `BC-02` |
| `MetadadoDeTermo` | `{p}termmeta` | `AGG-Termo` | `meta_id` | `BC-02` |
| `Marcador` | `{p}links` | `AGG-Termo` | `link_id` | `BC-02` |
| `Opcao` | `{p}options` | `REG-Opcao` | `option_id` | `plataforma/opcoes/` |
| `Conta` | `{p}users` | `AGG-Conta` | `ID` | `BC-05` |
| `MetadadoDeConta` | `{p}usermeta` | `AGG-Conta` · `AGG-Sessao` · `AGG-SenhaDeAplicacao` · `VO-Papel` | `umeta_id` | `BC-05` |
| `Rede` | `{p}site` | `AGG-Rede` | `id` | `BC-12` |
| `MetadadoDeRede` | `{p}sitemeta` | `AGG-Rede` | `meta_id` | `BC-12` |
| `SiteDaRede` | `{p}blogs` | `AGG-SiteDaRede` | `blog_id` | `BC-12` |
| `MetadadoDeSite` | `{p}blogmeta` | `AGG-SiteDaRede` | `meta_id` | `BC-12` |
| `Cadastro` | `{p}signups` | `AGG-Cadastro` | `signup_id` | `BC-12` |
| `LogDeCadastro` | `{p}registration_log` | `AGG-Cadastro` | `ID` | `BC-12` |

> **Note a relação 6-para-1 no topo da tabela**: **seis** entidades de domínio compartilham a **mesma**
> tabela `posts`, discriminadas por `post_type`. Isso **não** é erro de modelagem a corrigir — é a forma do
> legado, e separá-las em tabelas próprias mudaria `erd-complete.md` §3 e quebraria a coexistência. É o
> exemplo mais claro de por que **aggregate e tabela não são a mesma fronteira** neste porte.

**Tabelas obsoletas, declaradas e nunca criadas** 🟢 (`wp-includes/class-wpdb.php:314`, `:351`):
`categories`, `post2cat`, `link2cat` (desde o esquema 5539) e `sitecategories`. Elas existem **em
`wpdb`** para que rotinas de limpeza as reconheçam. O alvo **mantém a declaração** e **não cria** nenhuma.

**Duas tabelas fora do esquema do núcleo** 🟢: `{p}cache_data` e `{p}items`, criadas por biblioteca
vendorizada (`wp-includes/SimplePie/src/Cache/MySQL.php:90`, `:99`) **só** se o cache de *feeds* for
apontado para o *backend* MySQL, o que o núcleo não faz por padrão. **O Akismet não cria tabela**: persiste
em `options` e `commentmeta`.

---

## Schema (DDL)

> **Este DDL é idêntico ao do legado, byte a byte na estrutura.** Ele é reproduzido aqui — e não apenas
> referenciado — porque é o **contrato** que a metade TypeScript tem de emitir para que a metade PHP
> reconheça o esquema pela sua própria rotina de comparação de estrutura (`DB-MIG`). `{p}` é o
> `$table_prefix` (🔴 desconhecido — lacuna ERD-4) e `$charset_collate` vem de `DB_CHARSET`/`DB_COLLATE`
> (🔴 lacuna ERD-5).
>
> Fonte: `wp-admin/includes/schema.php:56`–`:315`.

```sql
-- =====================================================================
-- ESCOPO POR SITE -- 10 tabelas. Prefixo {p} no site principal,
-- {p}<blog_id>_ nos demais. Um conjunto por site da rede.
-- =====================================================================

CREATE TABLE {p}posts (                                   -- 23 colunas, 6 indices
  ID                    bigint(20) unsigned NOT NULL auto_increment,
  post_author           bigint(20) unsigned NOT NULL default '0',
  post_date             datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  post_date_gmt         datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  post_content          longtext NOT NULL,                -- bloco serializado em comentario HTML
  post_title            text NOT NULL,
  post_excerpt          text NOT NULL,
  post_status           varchar(20) NOT NULL default 'publish',  -- sem ENUM, sem CHECK
  comment_status        varchar(20) NOT NULL default 'open',
  ping_status           varchar(20) NOT NULL default 'open',
  post_password         varchar(255) NOT NULL default '',  -- TEXTO CLARO, comparacao literal
  post_name             varchar(200) NOT NULL default '',
  to_ping               text NOT NULL,
  pinged                text NOT NULL,
  post_modified         datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  post_modified_gmt     datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  post_content_filtered longtext NOT NULL,
  post_parent           bigint(20) unsigned NOT NULL default '0',  -- 3 SEMANTICAS, 0 = ausencia
  guid                  varchar(255) NOT NULL default '',
  menu_order            int(11) NOT NULL default '0',
  post_type             varchar(20) NOT NULL default 'post',  -- discrimina 6 entidades
  post_mime_type        varchar(100) NOT NULL default '',
  comment_count         bigint(20) NOT NULL default '0',   -- CONTADOR DESNORMALIZADO
  PRIMARY KEY  (ID),
  KEY post_name (post_name($max_index_length)),
  KEY type_status_date (post_type,post_status,post_date,ID),
  KEY post_parent (post_parent),
  KEY post_author (post_author),
  KEY type_status_author (post_type,post_status,post_author)
) $charset_collate;

CREATE TABLE {p}postmeta (                                -- 4 colunas, 3 indices
  meta_id    bigint(20) unsigned NOT NULL auto_increment,
  post_id    bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,                   -- a UNICA coluna nullable da familia
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (meta_id),
  KEY post_id (post_id),
  KEY meta_key (meta_key($max_index_length))
) $charset_collate;

CREATE TABLE {p}comments (                                -- 15 colunas, 6 indices
  comment_ID           bigint(20) unsigned NOT NULL auto_increment,  -- NOME IRREGULAR
  comment_post_ID      bigint(20) unsigned NOT NULL default '0',
  comment_author       tinytext NOT NULL,
  comment_author_email varchar(100) NOT NULL default '',
  comment_author_url   varchar(200) NOT NULL default '',
  comment_author_IP    varchar(100) NOT NULL default '',
  comment_date         datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  comment_date_gmt     datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  comment_content      text NOT NULL,
  comment_karma        int(11) NOT NULL default '0',       -- COLUNA MORTA (DB-DEAD)
  comment_approved     varchar(20) NOT NULL default '1',   -- maquina de estado em varchar
  comment_agent        varchar(255) NOT NULL default '',
  comment_type         varchar(20) NOT NULL default 'comment',
  comment_parent       bigint(20) unsigned NOT NULL default '0',
  user_id              bigint(20) unsigned NOT NULL default '0',  -- 0 = ANONIMO LEGITIMO
  PRIMARY KEY  (comment_ID),
  KEY comment_post_ID (comment_post_ID),
  KEY comment_approved_date_gmt (comment_approved,comment_date_gmt),
  KEY comment_date_gmt (comment_date_gmt),
  KEY comment_parent (comment_parent),
  KEY comment_author_email (comment_author_email(10))
) $charset_collate;

CREATE TABLE {p}commentmeta (                             -- 4 colunas, 3 indices
  meta_id    bigint(20) unsigned NOT NULL auto_increment,
  comment_id bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (meta_id),
  KEY comment_id (comment_id),
  KEY meta_key (meta_key($max_index_length))
) $charset_collate;

CREATE TABLE {p}terms (                                   -- 4 colunas, 3 indices
  term_id    bigint(20) unsigned NOT NULL auto_increment,
  name       varchar(200) NOT NULL default '',
  slug       varchar(200) NOT NULL default '',
  term_group bigint(10) NOT NULL default 0,
  PRIMARY KEY  (term_id),
  KEY slug (slug($max_index_length)),
  KEY name (name($max_index_length))
) $charset_collate;

CREATE TABLE {p}term_taxonomy (                           -- 6 colunas, 3 indices
  term_taxonomy_id bigint(20) unsigned NOT NULL auto_increment,
  term_id          bigint(20) unsigned NOT NULL default 0,
  taxonomy         varchar(32) NOT NULL default '',
  description      longtext NOT NULL,
  parent           bigint(20) unsigned NOT NULL default 0,
  count            bigint(20) NOT NULL default 0,         -- 2 CRITERIOS DE CALCULO (DB-TRG2)
  PRIMARY KEY  (term_taxonomy_id),
  UNIQUE KEY term_id_taxonomy (term_id,taxonomy),         -- 1 das 3 garantias reais
  KEY taxonomy (taxonomy)
) $charset_collate;

CREATE TABLE {p}term_relationships (                      -- 3 colunas, 2 indices
  object_id        bigint(20) unsigned NOT NULL default 0,  -- POLIMORFICO: posts E links
  term_taxonomy_id bigint(20) unsigned NOT NULL default 0,
  term_order       int(11) NOT NULL default 0,
  PRIMARY KEY  (object_id,term_taxonomy_id),              -- A UNICA PK COMPOSTA do schema
  KEY term_taxonomy_id (term_taxonomy_id)
) $charset_collate;

CREATE TABLE {p}termmeta (                                -- 4 colunas, 3 indices
  meta_id    bigint(20) unsigned NOT NULL auto_increment,
  term_id    bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (meta_id),
  KEY term_id (term_id),
  KEY meta_key (meta_key($max_index_length))
) $charset_collate;

CREATE TABLE {p}options (                                 -- 4 colunas, 3 indices
  option_id    bigint(20) unsigned NOT NULL auto_increment,
  option_name  varchar(191) NOT NULL default '',          -- 191, nao 255: limite de indice utf8mb4
  option_value longtext NOT NULL,                         -- ESTRUTURA PHP SERIALIZADA
  autoload     varchar(20) NOT NULL default 'yes',
  PRIMARY KEY  (option_id),
  UNIQUE KEY option_name (option_name),                   -- 1 das 3 garantias reais
  KEY autoload (autoload)
) $charset_collate;

CREATE TABLE {p}links (                                   -- 13 colunas, 2 indices
  link_id          bigint(20) unsigned NOT NULL auto_increment,
  link_url         varchar(255) NOT NULL default '',
  link_name        varchar(255) NOT NULL default '',
  link_image       varchar(255) NOT NULL default '',
  link_target      varchar(25) NOT NULL default '',
  link_description varchar(255) NOT NULL default '',
  link_visible     varchar(20) NOT NULL default 'Y',
  link_owner       bigint(20) unsigned NOT NULL default '1',  -- default 1, nao 0
  link_rating      int(11) NOT NULL default '0',
  link_updated     datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  link_rel         varchar(255) NOT NULL default '',
  link_notes       mediumtext NOT NULL,
  link_rss         varchar(255) NOT NULL default '',
  PRIMARY KEY  (link_id),
  KEY link_visible (link_visible)
) $charset_collate;

-- =====================================================================
-- ESCOPO GLOBAL -- 2 tabelas, sempre no prefixo base, sem numero de site.
-- `users` tem DUAS variantes de DDL, escolhidas por $is_multisite.
-- =====================================================================

CREATE TABLE {p}users (                                   -- 10 col (site unico) / 12 (rede)
  ID                  bigint(20) unsigned NOT NULL auto_increment,
  user_login          varchar(60) NOT NULL default '',    -- U2: ate 60, acima e ERRO
  user_pass           varchar(255) NOT NULL default '',
  user_nicename       varchar(50) NOT NULL default '',    -- U2: ate 50, acima e ERRO
  user_email          varchar(100) NOT NULL default '',
  user_url            varchar(100) NOT NULL default '',
  user_registered     datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  user_activation_key varchar(255) NOT NULL default '',
  user_status         int(11) NOT NULL default '0',       -- COLUNA MORTA (DB-DEAD)
  display_name        varchar(250) NOT NULL default '',
  -- AS DUAS LINHAS ABAIXO EXISTEM SOMENTE NA VARIANTE MULTISITE:
  spam                tinyint(2) NOT NULL default '0',
  deleted             tinyint(2) NOT NULL default '0',
  PRIMARY KEY  (ID),
  KEY user_login_key (user_login),
  KEY user_nicename (user_nicename),
  KEY user_email (user_email)
) $charset_collate;

CREATE TABLE {p}usermeta (                                -- 4 colunas, 3 indices
  umeta_id   bigint(20) unsigned NOT NULL auto_increment, -- NOME IRREGULAR (as outras usam meta_id)
  user_id    bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,                   -- CARREGA o blog_id: '{p}2_capabilities'
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA: O PAPEL
  PRIMARY KEY  (umeta_id),
  KEY user_id (user_id),
  KEY meta_key (meta_key($max_index_length))
) $charset_collate;

-- =====================================================================
-- ESCOPO GLOBAL DE REDE -- 6 tabelas. So existem se a instalacao for
-- multisite. 🔴 Nao se sabe se esta e (lacuna ERD-3 / achado A-3).
-- =====================================================================

CREATE TABLE {p}blogs (                                   -- 12 colunas, 3 indices
  blog_id      bigint(20) unsigned NOT NULL auto_increment,  -- ENTRA NO NOME DA TABELA
  site_id      bigint(20) unsigned NOT NULL default '0',
  domain       varchar(200) NOT NULL default '',
  path         varchar(100) NOT NULL default '',
  registered   datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  last_updated datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  public       tinyint(2) NOT NULL default '1',
  archived     tinyint(2) NOT NULL default '0',           -- N1: 1 dos 4 campos de supervisao
  mature       tinyint(2) NOT NULL default '0',
  spam         tinyint(2) NOT NULL default '0',
  deleted      tinyint(2) NOT NULL default '0',           -- N2: TRES valores, nao dois
  lang_id      int(11) NOT NULL default '0',              -- COLUNA MORTA, mas INDEXADA
  PRIMARY KEY  (blog_id),
  KEY domain (domain(50),path(5)),
  KEY lang_id (lang_id)
) $charset_collate;

CREATE TABLE {p}blogmeta (                                -- 4 colunas, 3 indices
  meta_id    bigint(20) unsigned NOT NULL auto_increment,
  blog_id    bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (meta_id),
  KEY meta_key (meta_key($max_index_length)),
  KEY blog_id (blog_id)
) $charset_collate;

CREATE TABLE {p}site (                                    -- 3 colunas, 2 indices
  id     bigint(20) unsigned NOT NULL auto_increment,     -- NOME IRREGULAR: minusculo, sem prefixo
  domain varchar(200) NOT NULL default '',
  path   varchar(100) NOT NULL default '',
  PRIMARY KEY  (id),
  KEY domain (domain(140),path(51))
) $charset_collate;

CREATE TABLE {p}sitemeta (                                -- 4 colunas, 3 indices
  meta_id    bigint(20) unsigned NOT NULL auto_increment,
  site_id    bigint(20) unsigned NOT NULL default '0',
  meta_key   varchar(255) default NULL,
  meta_value longtext,                                    -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (meta_id),
  KEY meta_key (meta_key($max_index_length)),
  KEY site_id (site_id)
) $charset_collate;

CREATE TABLE {p}signups (                                 -- 11 colunas, 5 indices
  signup_id      bigint(20) unsigned NOT NULL auto_increment,
  domain         varchar(200) NOT NULL default '',
  path           varchar(100) NOT NULL default '',
  title          longtext NOT NULL,
  user_login     varchar(60) NOT NULL default '',
  user_email     varchar(100) NOT NULL default '',
  registered     datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  activated      datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA = nao ativado
  active         tinyint(1) NOT NULL default '0',
  activation_key varchar(50) NOT NULL default '',         -- U9: SEM PRAZO
  meta           longtext,                                -- ESTRUTURA PHP SERIALIZADA
  PRIMARY KEY  (signup_id),
  KEY activation_key (activation_key),
  KEY user_email (user_email),
  KEY user_login_email (user_login,user_email),
  KEY domain_path (domain(140),path(51))
) $charset_collate;

CREATE TABLE {p}registration_log (                        -- 5 colunas, 2 indices
  ID              bigint(20) unsigned NOT NULL auto_increment,  -- NOME IRREGULAR: maiusculo
  email           varchar(255) NOT NULL default '',
  IP              varchar(30) NOT NULL default '',
  blog_id         bigint(20) unsigned NOT NULL default '0',
  date_registered datetime NOT NULL default '0000-00-00 00:00:00',  -- SENTINELA
  PRIMARY KEY  (ID),
  KEY IP (IP)
) $charset_collate;

-- =====================================================================
-- O QUE NAO EXISTE NESTE SCHEMA, E NAO VAI PASSAR A EXISTIR:
--   0 FOREIGN KEY      0 TRIGGER      0 VIEW      0 PROCEDURE
--   0 ENUM             0 CHECK        0 tabela de outbox
--   0 event store      0 coluna de versao otimista
-- Tudo isso e DELIBERADO. Ver a secao "Restricoes" e
-- "Consideracoes especificas do paradigma alvo".
-- =====================================================================
```

**Conferência do DDL acima contra a fonte**, em
[`contar_schema.py`](../../.reversa/work/reversa-designer/contar_schema.py):

| Medida | Valor | Observação |
|---|---:|---|
| `CREATE TABLE` no arquivo | **19** | duas variantes de `users` |
| Tabelas distintas | **18** | confere com [`erd-complete.md`](../erd-complete.md) §2 |
| Colunas, com `users` de **site único** | **133** | |
| Colunas, com `users` de **multisite** | **135** | 🟢 **resolve com qual variante o 135 publicado fecha** |
| Índices (PK + UNIQUE + KEY), descontada a variante duplicada | **59** | confere com o checkpoint do Arquiteto |
| `FOREIGN KEY` | **0** | |

---

## Relacionamentos

As **24** relações de [`erd-complete.md`](../erd-complete.md) §7 — **nenhuma declarada no banco**. Toda a
coluna *Integridade* abaixo diz **a mesma coisa**, e é isso que precisa ficar legível.

| Origem | Destino | Cardinalidade | Integridade | Notas |
|---|---|---|---|---|
| `postmeta.post_id` | `posts.ID` | N:1 | **nenhuma — cobrada em PHP** | |
| `posts.post_parent` | `posts.ID` | N:1 auto-referência | **nenhuma** | **3 semânticas** na mesma coluna: página filha, anexo e revisão. `0` = ausência |
| `posts.post_author` | `users.ID` | N:1 | **nenhuma** | |
| `comments.comment_post_ID` | `posts.ID` | N:1 | **nenhuma** | |
| `comments.comment_parent` | `comments.comment_ID` | N:1 auto-referência | **nenhuma** | profundidade arbitrária **no banco** |
| `comments.user_id` | `users.ID` | N:1 **opcional** | **nenhuma** | `0` é **anônimo legítimo**, e órfão é **estado normal** |
| `commentmeta.comment_id` | `comments.comment_ID` | N:1 | **nenhuma** | |
| `term_relationships.object_id` | `posts.ID` | N:1 **polimórfico** | **nenhuma** | sem discriminador |
| `term_relationships.object_id` | `links.link_id` | N:1 **polimórfico** | **nenhuma** | o mesmo `object_id` |
| `term_relationships.term_taxonomy_id` | `term_taxonomy.term_taxonomy_id` | N:1 | PK composta | **a única garantia estrutural de vínculo não duplicado** |
| `term_taxonomy.term_id` | `terms.term_id` | N:1 | `UNIQUE (term_id, taxonomy)` | |
| `term_taxonomy.parent` | `terms.term_id` | N:1 hierarquia | **nenhuma** | |
| `termmeta.term_id` | `terms.term_id` | N:1 | **nenhuma** | |
| `links.link_owner` | `users.ID` | N:1 | **nenhuma** | *default* `1`, não `0` |
| `usermeta.user_id` | `users.ID` | N:1 | **nenhuma** | |
| `usermeta.meta_key` | `blogs.blog_id` | **N:M disfarçado** | **nenhuma** | a referência mora **dentro do texto** da chave: `{p}2_capabilities` |
| `usermeta.meta_key` | `options.option_name` | **N:M por nome de chave** | **nenhuma** | `{p}capabilities` ↔ `{p}user_roles` |
| `blogs.site_id` | `site.id` | N:1 | **nenhuma** | |
| `sitemeta.site_id` | `site.id` | N:1 | **nenhuma** | |
| `blogmeta.blog_id` | `blogs.blog_id` | N:1 | **nenhuma** | |
| `registration_log.blog_id` | `blogs.blog_id` | N:1 | **nenhuma** | |
| `signups.user_login`/`user_email` | `users.ID` | 1:0..1 por **materialização** | **nenhuma e sem coluna** | 🟡 |
| `signups.domain`/`path` | `blogs.blog_id` | 1:0..1 por **materialização** | **nenhuma e sem coluna** | 🟡 |
| `blogs.blog_id` | as 10 tabelas por site | **1:10 por nome de tabela** | **nenhuma** | o `blog_id` entra **no nome**: `{p}7_posts`. **Cada linha nova cria 10 tabelas** |

**Resumo**: 19 N:1 · **1** N:M explícito · 2 N:M disfarçados · 2 por materialização · 1 por nome de tabela ·
2 auto-referências · 1 polimórfica explícita + 2 disfarçadas · **zero 1:1**.

---

## Restrições

- **Unicidade** — existem **exatamente três** garantias reais no banco 🟢 `DB-UNIQ`:
  1. `options.option_name` — `UNIQUE KEY` (`wp-admin/includes/schema.php:147`)
  2. `term_taxonomy (term_id, taxonomy)` — `UNIQUE KEY` (`wp-admin/includes/schema.php:82`)
  3. `term_relationships (object_id, term_taxonomy_id)` — **PK composta** (`wp-admin/includes/schema.php:89`)

  Tudo mais é cobrado em PHP. Em particular: `users.user_login` **não é único no banco** (é só `KEY`), e
  `posts.post_name` também não — `P5` diz que rascunho **pode** ter *slug* duplicado e publicado não, e
  isso é regra de aplicação, não *constraint*.

- **Integridade referencial**: **DESATIVADA, e por quê** 🟢. Não é descuido a corrigir, são **três motivos
  independentes**:
  1. `wp_delete_post()` **reparenteia** página filha e anexo para o avô (`wp-includes/post.php:3908` e `:3923`) — uma FK
     com `ON DELETE CASCADE` os **apagaria**, mudando comportamento observável
     ([`erd-complete.md`](../erd-complete.md) §9 risco 1);
  2. **comentário órfão é estado normal**: apagar o usuário **não** toca nos comentários, de propósito, para
     preservar o histórico da discussão (§9 risco 2);
  3. `term_relationships.object_id` é **polimórfico** e sem discriminador — não há tabela única para a FK
     apontar (§9 risco 7).

- **Enumeração**: **nenhuma** 🟢 `DB-ENUM`. `post_status`, `comment_approved`, `comment_type`,
  `ping_status`, `comment_status` e `link_visible` são `varchar(20)` **sem `ENUM` e sem `CHECK`**. As **9
  máquinas de estado** são validadas **na aplicação**, e isso é o que o alvo reproduz.

- **Nulidade**: quase nenhuma coluna de referência é anulável. **Ausência de vínculo é escrita como `0`** —
  `post_parent = 0`, `comment_parent = 0`, `user_id = 0` 🟢. Consequência operacional que vale nomeada: um
  `LEFT JOIN ... WHERE pai IS NULL` **não encontra órfão nenhum** neste banco. A única coluna anulável da
  família de metadados é `meta_key`.

- **Sentinelas**: `'0000-00-00 00:00:00'` é o *default* de **10** colunas `datetime` e **carrega significado
  de negócio** — em `posts` marca um rascunho cujo *status* declara a data; em `signups.activated`, "não
  ativado" 🟢 `DB-SENT`. 🔴 **`BR-HUMANA-003` decide o destino dele e trava a estratégia**, não só o
  desenho.

- **Escrita inválida não falha, ela se degrada** 🟢 `DB-DEG`. É comportamento a **reproduzir**, e depende de
  `sql_mode` permissivo no banco alvo — que é condição de instalação, não de código.

- **Colunas mortas, preservadas de propósito** 🟢 `DB-DEAD`: `users.user_status`, `comments.comment_karma` e
  `blogs.lang_id` (esta **indexada** e nunca escrita). [`questions.md`](../questions.md) P7 —
  *"existir sem ser chamada é parte do que se clona"*.

- **Particionamento / *sharding***: **nenhum**, e a forma de escala do legado é outra: **10 tabelas novas por
  site da rede**, com o `blog_id` no nome da tabela. É *sharding* por nome de tabela, feito à mão.

- **Índices críticos** — os que o alvo tem de emitir idênticos, porque o legado conta com eles:
  - `posts.type_status_date (post_type, post_status, post_date, ID)` — é o índice de toda listagem
  - `posts.type_status_author (post_type, post_status, post_author)`
  - `comments.comment_approved_date_gmt (comment_approved, comment_date_gmt)` — a fila de moderação
  - `comments.comment_author_email(10)` — prefixo de **10** caracteres, e é o que `C7` consulta
  - `options.autoload` — governa o carregamento em massa de cada requisição
  - `term_taxonomy.term_id_taxonomy` — é *constraint*, não só índice
  - 🔴 **Lacuna ERD-2**: volumetria e seletividade são **desconhecidas**. Não há como dizer quais índices
    compostos pagam o próprio custo. Nenhum índice foi acrescentado nem removido por isso.

---

## Considerações específicas do paradigma alvo

> Seção dedicada quando o paradigma alvo tem implicação direta no modelo de dados. O paradigma é **híbrido**
> (Opção 3), e a implicação mais forte aqui é **negativa**: três mecanismos que normalmente apareceriam
> **não aparecem**, e cada ausência é decisão.

| Mecanismo que se esperaria | Estado | Por quê |
|---|---|---|
| **Tabela de *outbox*** (garantia *at-least-once* entre banco e fila) | **NÃO EXISTE** | não há fila. A *stack* alvo **não tem mensageria** ([`questions.md`](../questions.md) P10), logo não há nada entre o que o *outbox* mediaria |
| ***Event store*** (eventos como fonte da verdade) | **NÃO EXISTE** | **nenhum artefato desta análise registra requisito de auditoria**, e P20 responde que o núcleo **não declara prazo de retenção nenhum**. *Event sourcing* aqui seria requisito não funcional **inventado** — ver [`refactor/architectures.md`](../refactor/architectures.md) §7 `cqrs-event-sourcing`, `fit` 12 |
| **DLQ / tabela de falhas com *retry*** | **NÃO EXISTE** | a política de nova tentativa é **escrita à mão** e o único histórico persistente de falha é a opção `auto_core_update_failed` (`A5`, `A6`, `A7`). Acrescentar uma tabela de falhas mudaria **quantos e-mails o administrador recebe** |
| **Coluna de versão para concorrência otimista** | **NÃO EXISTE** | o legado não tem nenhuma, e acrescentá-la mudaria o resultado de escritas simultâneas — que é efeito no banco, área comparada |
| **Transação** | **NÃO EXISTE E NÃO PASSA A EXISTIR** | **zero `START TRANSACTION` e zero `COMMIT`** em 1.467 arquivos. A exclusão de post são **7 passos sequenciais** atravessando 4 tabelas. Envolvê-los numa transação **mudaria** o estado intermediário observável e o resultado de uma falha no meio |

**E três implicações do paradigma que SIM tocam este modelo, com efeito concreto:**

1. **Implicação 2 — a conexão passa a ser de processo, e no legado é de requisição.** `$wpdb` é, de fato,
   variável de requisição, porque o processo é descartado no fim da resposta. Numa runtime longo-viva há
   **pool de conexões**, e duas requisições concorrentes podem pegar conexões diferentes. Consequência de
   modelo de dados: qualquer estado de sessão de banco — `SET`, variável de usuário, tabela temporária — é
   **proibido** fora de uma operação atômica, e a conexão tem de ser **presa ao contexto de requisição**
   (`plataforma/contexto/`), nunca ao módulo.
2. **Implicação 8 — a ausência de transação é o que impede a partição, e o modelo a preserva.** Como não há
   transação a quebrar, partir `conteúdo`, `interação` e `classificação` em serviços **não quebraria
   transação nenhuma** — transformaria *"uma sequência sem proteção numa saga sem compensação"*. O modelo de
   dados **único e compartilhado** é o que torna esse risco inexistente: as 7 etapas rodam na mesma pilha,
   no mesmo banco (AD-01).
3. **Os três contadores desnormalizados são *read model* mantido à mão, e continuam sendo.**
   `posts.comment_count`, `term_taxonomy.count` (com **dois** critérios) e o terceiro que
   [`refactor/architectures.md`](../refactor/architectures.md) §2.2 cita. **Podem divergir**, e a
   divergência é **estado normal** — `DB-TRG1` diz que o recálculo é em PHP e **pode ser suspenso**. Um
   sistema que os mantivesse sempre corretos teria comportamento **diferente** do legado.

---

## Origem no legado

| Tabela nova | Origem no legado | Transformação |
|---|---|---|
| `{p}posts` | `{p}posts` | **nenhuma** — DDL idêntico |
| `{p}postmeta` | `{p}postmeta` | **nenhuma** |
| `{p}comments` | `{p}comments` | **nenhuma** |
| `{p}commentmeta` | `{p}commentmeta` | **nenhuma** |
| `{p}terms` | `{p}terms` | **nenhuma** |
| `{p}term_taxonomy` | `{p}term_taxonomy` | **nenhuma** — ⚠️ a fusão com `terms` é do **aggregate**, não da tabela |
| `{p}term_relationships` | `{p}term_relationships` | **nenhuma** |
| `{p}termmeta` | `{p}termmeta` | **nenhuma** |
| `{p}options` | `{p}options` | **nenhuma** |
| `{p}links` | `{p}links` | **nenhuma** — 🔴 nenhum módulo ativo é dono, e a tabela permanece |
| `{p}users` | `{p}users` | **nenhuma** — e a **variante** (10 ou 12 colunas) segue sendo escolhida por `$is_multisite` |
| `{p}usermeta` | `{p}usermeta` | **nenhuma** — inclusive o nome irregular `umeta_id` |
| `{p}site`, `{p}sitemeta`, `{p}blogs`, `{p}blogmeta`, `{p}signups`, `{p}registration_log` | idem | **nenhuma** — inclusive `site.id` minúsculo e `registration_log.ID` maiúsculo |
| `categories`, `post2cat`, `link2cat`, `sitecategories` | declaradas em `wpdb` e **nunca criadas** | **nenhuma** — a declaração é mantida para que a limpeza as reconheça |
| `{p}cache_data`, `{p}items` | `wp-includes/SimplePie/src/Cache/MySQL.php:90` e `:99` | **nenhuma** — fora do núcleo, criadas só se o cache de *feeds* apontar para MySQL |
| **nenhuma tabela nova** | — | 🟢 **zero tabelas acrescentadas, zero colunas acrescentadas, zero índices acrescentados** |

---

## O que seria modelado diferente, e não é

Registrado para que o conhecimento não se perca, e **explicitamente fora de escopo desta fase**. Cada item
é decisão separada, posterior ao corte final, com o seu próprio custo de migração de dados.

| # | O que um modelo novo faria | Por que **não** é feito agora | Fonte |
|---|---|---|---|
| 1 | `post_parent` virar **três** relacionamentos distintos | mantê-lo *"reproduz a ambiguidade no sistema novo"*, e é verdade — mas dividi-lo muda o esquema e derruba a coexistência | [`erd-complete.md`](../erd-complete.md) §9 risco 7 |
| 2 | `term_relationships.object_id` ganhar **discriminador** | idem: é o conserto certo e a mudança de esquema errada **nesta fase** | §9 risco 7 |
| 3 | Fundir fisicamente `terms` + `term_taxonomy` | a fusão *"é segura por causa do `UNIQUE KEY`"* e simplificaria a hierarquia; o aggregate já a faz, a tabela não | §9 risco 6 |
| 4 | Trocar os sentinelas de data por coluna anulável | 🔴 **é exatamente `BR-HUMANA-003` opção (a)**, e ela **derruba a estratégia**, não o desenho | [AMB-006](ambiguity_log.md) |
| 5 | Declarar `ENUM` ou `CHECK` nas 6 colunas de estado | tornaria `DB-DEG` impossível: escrita inválida passaria a **falhar** em vez de se degradar | `DB-ENUM`, `DB-DEG` |
| 6 | Tirar as 3 colunas mortas | P7: *"existir sem ser chamada é parte do que se clona"*. E `blogs.lang_id` tem **índice**, logo sair dela muda o DDL em dois lugares | `DB-DEAD` |
| 7 | *Hash* em `posts.post_password` | 🔴 **`BR-HUMANA-009`**. Hoje é texto claro com comparação literal, e mudar isso **invalida toda senha de conteúdo existente** | [AMB-012](ambiguity_log.md) |

---

## Notas

**Para o agente de codificação, em uma frase:** emita este DDL **sem uma letra de diferença** e trate
qualquer vontade de melhorá-lo como sinal de que falta ler a § *Visão geral* — a melhoria é correta e o
momento é errado.

1. **O que a metade TypeScript pode fazer com o esquema, e o que não pode** (condição 3 da coexistência):
   **ler** estrutura, sim; **escrever** estrutura, **nunca**. A metade PHP mantém `db_version` = **61833**
   (`wp-includes/version.php:26`) e é a dona única da evolução. As duas metades disputando o esquema
   arriscam corromper a instalação de referência, **que é o oráculo**.

2. **O *codec* de `serialize()` é a peça que faz ou quebra tudo, e não é uma coluna — são quatro famílias.**
   `options.option_value`, `postmeta.meta_value`, `commentmeta.meta_value`, `termmeta.meta_value`,
   `usermeta.meta_value`, `blogmeta.meta_value`, `sitemeta.meta_value` e `signups.meta`. Se a metade
   TypeScript escrever um byte diferente, a metade PHP **não lê o que ela escreveu** — e o caso mais caro é
   `usermeta`, porque **é onde a autorização mora** (`PERM-2`). Compatibilidade byte a byte, com teste
   próprio, **antes** da primeira virada que escreva.

3. **Um detalhe de uma linha que decide a coexistência da autorização**: a referência ao site mora **dentro
   do texto** da `meta_key` — `{p}2_capabilities`. Logo o prefixo de tabela **não é só configuração de
   conexão**: ele é **dado**, e aparece dentro de valores. 🔴 O `$table_prefix` real é desconhecido (lacuna
   ERD-4), e **nenhuma consulta deste documento roda sem ajuste**.

4. 🔴 **O que este modelo não pôde verificar, e é bom que fique no documento e não só nas lacunas:**
   - **nenhuma instância do banco foi acessada** (ERD-1): todo este DDL vem do **instalador**, não de um
     `SHOW CREATE TABLE` de produção. *Plugins* podem ter acrescentado tabelas, colunas e relacionamentos;
   - **volumetria e seletividade desconhecidas** (ERD-2): não há como dimensionar a migração nem decidir
     índice;
   - **não se sabe se a instalação é multisite** (ERD-3), o que muda **6 tabelas**, a relação 24 e qual das
     duas variantes de `users` vale — e é justamente a variante que decide se o total é 133 ou **135**;
   - **`charset` e `collation` reais** dependem de `DB_CHARSET`/`DB_COLLATE`, que **não existem nesta
     árvore** (ERD-5). ⚠️ Isso importa mais do que parece: `options.option_name` é `varchar(191)` **por
     causa** do limite de índice de `utf8mb4`, logo o `charset` **já está embutido no DDL**;
   - **`db_version` 61833 contra o último portão em 61644**: a faixa 61645–61833 **não tem rotina de dados**
     (ERD-7, [AMB-013](ambiguity_log.md)), e a hipótese de que a diferença seja puramente estrutural
     **não foi confirmada**. É verificação mecânica referida à codificação.

5. **A instrução mais importante deste artefato caberia numa linha, e vale repetida:** este não é um modelo
   de dados *projetado*; é um modelo de dados **transcrito e justificado**. O valor dele está nas colunas
   *Integridade* e *Notas*, que explicam **por que** cada ausência é deliberada — porque é exatamente ali
   que um porte bem-intencionado estraga o produto.
