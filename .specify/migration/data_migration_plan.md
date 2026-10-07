---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: data_migration_plan
producedBy: designer
hash: "sha256:3f14b7507ec90fe17c3b3b003509b9a62548f1bfb00cf9aa3c6fb17a9e2803ae"
---

# Data Migration Plan

> Plano de migração dos dados do legado para o sistema novo: mapeamento, transformações, ETL, *cutover* de
> dados e validação.

> 📌 **PREMISSA DECLARADA.** Pressupõe a estratégia **A — Strangler Fig com banco compartilhado**
> ([`migration_strategy.md`](migration_strategy.md) § 6 **em branco**) e `BR-HUMANA-003` = **(c)**
> ([AMB-006](ambiguity_log.md), **PENDENTE**). A § *O plano alternativo* descreve o que este artefato passa
> a ser se a resposta for **(a)**. A topologia **não** afeta este artefato.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Lido de DDL ou código, com `arquivo:linha` |
| 🟡 INFERIDO | Decisão deste agente, derivada de evidência |
| 🔴 LACUNA | Depende de acesso a instalação real ou de resposta humana |

---

## Resumo

> 🟢 **A conclusão deste plano é que, no escopo deste projeto, NÃO HÁ MIGRAÇÃO DE DADOS.** Isso não é uma
> seção vazia: é o resultado, e ele tem três causas independentes que precisam ser verificadas, não
> assumidas.

| Campo | Valor |
|---|---|
| **Volume estimado** | 🔴 **DESCONHECIDO** — nenhuma instância do banco foi acessada (lacuna ERD-1, ERD-2, RISK-019). Não há contagem de linha nem tamanho de `uploads/`. **Nenhum número de volume é estimado neste documento**, porque estimá-lo sem dado seria adivinhação com aparência de plano |
| **Janela de migração** | **nenhuma** — as 12 viradas de [`cutover_plan.md`](cutover_plan.md) não têm indisponibilidade, porque o *proxy* alterna destino e **o banco não se move** |
| **Estratégia** | **nenhuma das três do *template*.** Não é *backfill* + *delta* + corte, não é *bulk* único, não é replicação contínua. É **esquema compartilhado com zero cópia de dado** |

### As três causas de não haver ETL, cada uma verificável

1. **O esquema é o mesmo.** [`target_data_model.md`](target_data_model.md) declara **zero** tabela nova,
   **zero** coluna nova e **zero** índice novo. Origem e destino são **a mesma linha do mesmo banco**. 🟢
   — **depende de** `BR-HUMANA-003` = (c).
2. **Não existe sistema em produção para migrar.** [`questions.md`](../questions.md) P19 responde que **não
   há instalação em operação nem log retido**, e o alvo é **o CMS, não um site**. O que existe de vivo é a
   instalação de referência da P16 — e ela é **oráculo**, não origem de migração. 🟢
3. **E a causa que inverte o enquadramento, e é o achado que mais muda este documento:**

> 🟢 **A migração de dados deste sistema não é um passo prévio — é parte permanente do caminho de
> leitura.** [`architecture.md`](../architecture.md) §9 risco 8 e RISK-020: *"o banco contém, ao mesmo
> tempo, dados de **todas as gerações do formato**, e é a leitura que normaliza. Remover um ramo antigo é
> decisão de produto, não limpeza."*
>
> **Consequência prática para o porte:** o alvo não escreve um ETL; **o alvo escreve os ramos de leitura**.
> Cada ramo que o legado tem para aceitar um formato antigo é **requisito funcional** do sistema novo. Um
> porte que trate formato antigo como **inválido** em vez de como **ramo de leitura** produz um sistema que
> não lê bancos existentes — e *"ler banco legado é capacidade do produto"*
> ([`migration_strategy.md`](migration_strategy.md)).

### E o que **sim** é operação de dado neste porte

Quatro coisas, e nenhuma é ETL:

| # | Operação | Por que é obrigatória | Onde está neste plano |
|---|---|---|---|
| 1 | **Semear o banco vazio** | `DB-SEED` ([`BR-MIGRAR-084`](target_business_rules.md#br-migrar-084)): *"o esquema vazio não é funcional: parte da regra está nas linhas que o instalador cria"* | **T-07** |
| 2 | **Escrever e ler `serialize()` do PHP byte a byte** | é a **condição 1** da coexistência; sem ela a metade PHP não lê o que a metade TypeScript escreve | **T-01** |
| 3 | **Reproduzir os ramos de leitura de formato antigo** | RISK-020 — é requisito funcional, não limpeza | **T-05**, **T-06**, **T-08**, **T-10** |
| 4 | **Recalcular os 3 contadores desnormalizados, com 2 critérios** | `DB-TRG1`, `DB-TRG2` — e o recálculo é **suspensível**, logo divergência é estado normal | **T-03** |

---

## Mapeamento legado → novo

**Identidade em todas as 18 tabelas.** A tabela abaixo é longa de propósito: ela é a declaração de que
nenhuma linha foi esquecida, e é o que o Inspector confere.

| Origem | Destino | Tipo | Notas |
|---|---|---|---|
| `{p}posts` | `{p}posts` | **identidade** | a **mesma** tabela. 6 entidades de domínio convivem nela, discriminadas por `post_type` |
| `{p}postmeta` | `{p}postmeta` | **identidade** | `meta_value` é estrutura PHP serializada → **T-01** |
| `{p}comments` | `{p}comments` | **identidade** | `user_id = 0` é anônimo legítimo; órfão é estado normal |
| `{p}commentmeta` | `{p}commentmeta` | **identidade** | → **T-01** |
| `{p}terms` | `{p}terms` | **identidade** | |
| `{p}term_taxonomy` | `{p}term_taxonomy` | **identidade** | `count` → **T-03** (dois critérios) |
| `{p}term_relationships` | `{p}term_relationships` | **identidade** | `object_id` polimórfico → **T-06** |
| `{p}termmeta` | `{p}termmeta` | **identidade** | → **T-01** |
| `{p}options` | `{p}options` | **identidade** | `option_value` serializado → **T-01**; *transients* expirados → **T-09** |
| `{p}links` | `{p}links` | **identidade** | 🔴 nenhum módulo ativo é dono, e a tabela **permanece** |
| `{p}users` | `{p}users` | **identidade** | ⚠️ **duas variantes de DDL** (10 ou 12 colunas) → **T-12** |
| `{p}usermeta` | `{p}usermeta` | **identidade** | a `meta_key` **carrega o `blog_id`** → **T-08**. É onde a autorização mora |
| `{p}site` | `{p}site` | **identidade** | |
| `{p}sitemeta` | `{p}sitemeta` | **identidade** | → **T-01** |
| `{p}blogs` | `{p}blogs` | **identidade** | `deleted` tem **3** valores → **T-04** |
| `{p}blogmeta` | `{p}blogmeta` | **identidade** | → **T-01** |
| `{p}signups` | `{p}signups` | **identidade** | `activated` com sentinela = "não ativado" → **T-02** |
| `{p}registration_log` | `{p}registration_log` | **identidade** | sem política de retenção (`R8`) → **T-09** |
| `categories`, `post2cat`, `link2cat`, `sitecategories` | **declaradas e nunca criadas** | identidade da **declaração** | existem em `wpdb` para que rotinas de limpeza as reconheçam (`wp-includes/class-wpdb.php:314` e `:351`) |
| `{p}cache_data`, `{p}items` | idem | identidade | de biblioteca vendorizada, criadas só se o cache de *feeds* apontar para MySQL |
| `wp-content/uploads/` | `wp-content/uploads/` | **identidade** | ⚠️ **não é banco e é dado**: o alvo lê e escreve **o mesmo disco** durante a coexistência |
| `wp-content/plugins/`, `themes/`, *drop-ins* | idem | **identidade de caminho** | a presença do arquivo **é** a API (AD-12) |
| **nenhuma tabela nova** | — | — | 🟢 zero tabela, zero coluna, zero índice acrescentados |

---

## Transformações

> **Nenhuma destas 12 é transformação de ETL.** Oito são **ramos de leitura** que o alvo tem de reproduzir,
> três são **operações de manutenção** que o legado já faz, e uma é **verificação**. Estão no formato de
> transformação porque é onde o *template* as espera e é onde o codificador vai procurá-las.

### T-01: *Codec* de `serialize()` do PHP, byte a byte
- **Aplica em**: `options.option_value`, `postmeta.meta_value`, `commentmeta.meta_value`,
  `termmeta.meta_value`, `usermeta.meta_value`, `blogmeta.meta_value`, `sitemeta.meta_value`,
  `signups.meta` — **8 colunas em 4 famílias**
- **Regra**: a serialização e a desserialização do alvo têm de ser **isomorfas** às do PHP, byte a byte,
  incluindo `serialize()` de `array`, de objeto, de booleano, de `null`, de `float` e de *string* com
  caracteres multibyte. E o legado grava valor **não serializado** quando ele é escalar simples — logo o
  alvo tem de reproduzir **a decisão de serializar ou não**, não só o formato.
- **Tratamento de inválidos**: ⚠️ **não rejeitar.** O legado trata valor não desserializável como *string*
  literal e segue. Rejeitar aqui é **mais estrito que o legado** e quebra o critério de idêntico.
- **Origem da regra**: [`BR-MIGRAR-082`](target_business_rules.md#br-migrar-082) (`DB-SER`) ·
  [`migration_strategy.md`](migration_strategy.md) § 4.3 **condição 1** · RISK-005
- **Por que é a primeira**: é a única cuja falha torna a coexistência **impossível**, não difícil. E o caso
  mais caro é `usermeta`, porque é lá que `PERM-2` põe a autorização — com o papel **dentro do nome** da
  `meta_key`.

### T-02: Sentinela de data preservada como string literal
- **Aplica em**: as **10** colunas `datetime` com *default* `'0000-00-00 00:00:00'` — `posts.post_date`,
  `post_date_gmt`, `post_modified`, `post_modified_gmt`, `comments.comment_date`, `comment_date_gmt`,
  `links.link_updated`, `users.user_registered`, `blogs.registered`, `last_updated`, `signups.registered`,
  `activated`, `registration_log.date_registered`
- **Regra**: **nenhuma transformação.** O sentinela é mantido como a string literal, e o alvo o interpreta
  **por contexto**, não por tipo: em `posts` marca um rascunho cujo *status* declara a data; em
  `signups.activated` significa **"não ativado"**.
- **Tratamento de inválidos**: não se aplica — o valor **é** válido neste domínio
- **Origem da regra**: [`BR-MIGRAR-081`](target_business_rules.md#br-migrar-081) (`DB-SENT`)
- 🔴 **Depende de `BR-HUMANA-003` = (c).** Se for (a), esta transformação deixa de ser identidade e passa a
  ser a **única transformação real do projeto** — ver § *O plano alternativo*.
- ⚠️ **Pré-condição de ambiente, não de código**: `sql_mode` permissivo no banco alvo. Com `sql_mode`
  estrito, `'0000-00-00 00:00:00'` é **rejeitado** pelo MySQL e `DB-DEG` deixa de funcionar.

### T-03: Recálculo dos 3 contadores desnormalizados, com 2 critérios
- **Aplica em**: `posts.comment_count` e `term_taxonomy.count`
- **Regra**: três cálculos distintos, **não um**:
  1. `posts.comment_count` → `comment_approved = '1' AND comment_type != 'note'` 🟢
     `wp-includes/comment.php:3106`
  2. `term_taxonomy.count` em taxonomia de `post` → `post_status IN ('publish')`, e **anexo conta pelo
     status do pai** 🟢 `wp-includes/taxonomy.php:4193`
  3. `term_taxonomy.count` nas **outras** taxonomias → `COUNT(*)` de `term_relationships`, **sem filtro**
     🟢 `wp-includes/taxonomy.php:4272`
- **Tratamento de inválidos**: ⚠️ **divergência é estado normal e NÃO se corrige de ofício.** O recálculo
  é **suspensível** (`wp_defer_comment_counting(true)`, que é o que `wp_delete_post()` faz em
  `wp-includes/post.php:3925`), e entre o início e o fim de um lote o contador está **errado no banco, de
  propósito**. Um sistema que os mantivesse sempre corretos teria comportamento **diferente**.
- **Origem da regra**: [`BR-MIGRAR-077`](target_business_rules.md#br-migrar-077) (`DB-TRG1`) ·
  [`BR-MIGRAR-078`](target_business_rules.md#br-migrar-078) (`DB-TRG2`)

### T-04: Os 13 tipos de órfão — **3 deles não se corrigem**
- **Aplica em**: todas as tabelas com FK lógica
- **Regra**: rodar as consultas de diagnóstico de
  [`database/relationships.md`](../database/relationships.md) §4 **antes** de qualquer virada de escrita, e
  **classificar** cada órfão encontrado — não corrigi-lo por padrão.
- **Tratamento**: a classificação é o produto desta transformação:

  | Órfão | Classificação | Ação |
  |---|---|---|
  | `postmeta` sem `posts` 🟢 | anomalia | investigar origem; **não apagar sem decisão** |
  | `commentmeta` sem `comments` 🟢 | anomalia | idem |
  | `termmeta` sem `terms` 🟢 | anomalia | idem |
  | `usermeta` sem `users` 🟢 | anomalia | idem |
  | `comments` → `posts.ID` inexistente 🟢 | anomalia | idem |
  | **`comments.user_id` → conta apagada** 🟡 | ✅ **COMPORTAMENTO NORMAL** de `wp_delete_user()` | **nada** — preserva o histórico da discussão |
  | `posts.post_author` → conta apagada 🟡 | anomalia condicional | só com `$reassign = null` em tipo sem `delete_with_user` |
  | `term_relationships` → `object_id` inexistente 🟢 | anomalia | exclusão de `links` por SQL direto |
  | `term_taxonomy` sem `terms` 🟢 | anomalia | idem |
  | `terms` sem `term_taxonomy` 🟡 | anomalia | termo removido de todas as taxonomias |
  | **`registration_log` sem `blogs`** 🟢 | ✅ **COMPORTAMENTO NORMAL**: `wp_delete_site()` apaga a `blogmeta` (`wp-includes/ms-site.php:264`) e **não toca** em `registration_log` | **nada** |
  | `usermeta` com prefixo de site inexistente 🟡 | anomalia | `{p}7_capabilities` permanece após o site sair |
  | **`options` com `_transient_*` vencido** 🟢 | ✅ **COMPORTAMENTO NORMAL**: a expiração é verificada **na leitura**, não há limpeza garantida | **nada** → **T-09** |

- **Origem da regra**: [`database/relationships.md`](../database/relationships.md) §4 ·
  [`erd-complete.md`](../erd-complete.md) §9 risco 4 · RISK-018
- ⚠️ **A armadilha nomeada**: `LEFT JOIN ... WHERE pai IS NULL` **não encontra órfão nenhum** neste banco,
  porque ausência de vínculo é escrita como **`0`** e não como `NULL`. As consultas de §4 já estão escritas
  contra o `0`; uma consulta nova, escrita do zero por hábito, dá **falso negativo**.

### T-05: `posts.post_parent` com três semânticas — desambiguação **na leitura**
- **Aplica em**: `posts.post_parent`
- **Regra**: a mesma coluna significa **três coisas** — página filha, anexo de um post e revisão de um post
  — e é o `post_type` da **linha de origem** que desambigua. O alvo **não acrescenta discriminador**; ele
  reproduz a desambiguação **no caminho de leitura**. `0` é ausência de vínculo.
- **Tratamento de inválidos**: um `post_parent` apontando para `ID` inexistente é **anomalia**, não ramo
- **Origem da regra**: [`erd-complete.md`](../erd-complete.md) §7.1 relação 2 e §9 risco 7 ·
  [`target_data_model.md`](target_data_model.md) § *O que seria modelado diferente* item 1

### T-06: `term_relationships.object_id` polimórfico — desambiguação pela taxonomia
- **Aplica em**: `term_relationships.object_id`
- **Regra**: o `object_id` referencia `posts.ID` **ou** `links.link_id`, **sem discriminador**. A
  desambiguação é feita pela `taxonomy` do `term_taxonomy` associado: `link_category` → `links`, todas as
  outras → `posts`. É exatamente o que a consulta de órfão de §4 faz
  (`WHERE tt.taxonomy <> 'link_category'`).
- **Tratamento de inválidos**: ver T-04, linha `term_relationships` → `object_id` inexistente
- **Origem da regra**: [`erd-complete.md`](../erd-complete.md) §7.1 relações 5 e 10 ·
  [`database/relationships.md`](../database/relationships.md) §2.1

### T-07: Semear o banco vazio — **o esquema vazio não é funcional**
- **Aplica em**: instalação nova
- **Regra**: criar as 18 tabelas **não** produz um sistema funcional. Parte da regra está **nas linhas que
  o instalador cria**: as opções iniciais, os papéis em `{p}user_roles`, as categorias e termos padrão, a
  primeira conta e o conteúdo de exemplo. O alvo tem de produzir **as mesmas linhas, com os mesmos valores
  padrão**.
- **Tratamento de inválidos**: não se aplica — é criação, não leitura
- **Origem da regra**: [`BR-MIGRAR-084`](target_business_rules.md#br-migrar-084) (`DB-SEED`) · RISK-020
- ⚠️ **O caso mais sutil, e ele é uma invariante de rede**: `N7`
  ([`BR-MIGRAR-067`](target_business_rules.md#br-migrar-067)) — criar o conjunto de tabelas de um site novo
  **repovoa os papéis a partir do código**, e é o **único** ponto do sistema em que isso acontece. Logo o
  código do papel padrão é, de fato, uma semente **permanente**, não só de instalação.
- ⚠️ **E um marcador de 2005 que sobrevive aqui**: `RESET_CAPS` em `wp-admin/includes/upgrade.php:1203`,
  declarado "temporário" e descartado por `BR-DESCARTAR-005` sob a justificativa *"instalação nova: o caso
  não ocorre"* — justificativa que **deixa de valer** no momento em que o alvo lê banco de instalação
  antiga (RISK-020).

### T-08: `usermeta.meta_key` carrega o `blog_id` **dentro do texto**
- **Aplica em**: `usermeta.meta_key`
- **Regra**: a referência ao site mora **no texto da chave** — `{p}2_capabilities`, `{p}2_user_level`. Logo
  o `$table_prefix` **não é só configuração de conexão: é dado**, e aparece dentro de valores. O alvo lê e
  escreve a chave com o mesmo padrão de nome, e **a correspondência `{p}capabilities` ↔
  `{p}user_roles`** (entre `usermeta` e `options`) é a relação N:M disfarçada 17.
- **Tratamento de inválidos**: chave com prefixo de site que não existe mais é **anomalia** (T-04), **não**
  limpeza automática: o site pode voltar
- **Origem da regra**: [`BR-MIGRAR-088`](target_business_rules.md#br-migrar-088) (`PERM-2`) ·
  [`erd-complete.md`](../erd-complete.md) §7.2 relações 16 e 17
- 🔴 **O `$table_prefix` real é desconhecido** (lacuna ERD-4), logo **nenhuma consulta deste documento roda
  sem ajuste**.

### T-09: O que **não** se limpa
- **Aplica em**: `options` (*transients*), `registration_log`, a lixeira de um site sem administrador
- **Regra**: **nenhuma limpeza nova.** Três ausências de retenção são comportamento a preservar:
  1. *transient* vencido permanece em `options`; a expiração é verificada **na leitura** e não há limpeza
     garantida 🟢
  2. `registration_log` **não tem política de retenção** 🟢 `R8`
  3. a coleta da lixeira é agendada **só por visita autenticada ao painel** — logo **um site que ninguém
     administra nunca limpa a própria lixeira** 🟢 `R5` +
     [ADR-0006](../adrs/0006-retencao-agendada-por-visita-ao-painel.md)
- **Origem da regra**: [`BR-MIGRAR-113`](target_business_rules.md#br-migrar-113) (`ESC-RETENCAO`) —
  *"o núcleo não declara prazo de retenção nenhum, e portá-lo idêntico é não inventar um"*
- **Por que esta é uma transformação, e é a mais fácil de violar sem perceber**: todo porte
  bem-intencionado acrescenta uma rotina de limpeza. Acrescentá-la **muda o conteúdo do banco** e é efeito
  comparado pela Decisão 2.

### T-10: A faixa `db_version` 61645–61833
- **Aplica em**: evolução de esquema ao ler banco existente
- **Regra**: `$wp_db_version` é **61833** (`wp-includes/version.php:26`) e o último portão de
  `upgrade_all()` é **61644**. A faixa entre os dois **não tem rotina de dados dedicada**.
- **Tratamento**: 🔴 **a hipótese de que a diferença se resolva só por comparação de estrutura NÃO foI
  confirmada.** É verificação mecânica, não decisão: comparar o DDL desta versão com o da anterior, ou ler
  o *changelog* da *release*. **Se houver transformação de dados naquela faixa**, ela não é portão
  histórico e `BR-DESCARTAR-006` precisa ser estreitado.
- **Origem da regra**: [AMB-013](ambiguity_log.md) (**REFERIDO À CODIFICAÇÃO**) ·
  [`erd-complete.md`](../erd-complete.md) §10 ERD-7

### T-11: `uploads/` e `wp-content/` — dado que não está no banco
- **Aplica em**: o disco do *webroot*
- **Regra**: durante a coexistência as duas metades leem e escrevem **o mesmo disco**. Não há cópia, não há
  sincronização e **não há momento em que os dois caminhos divirjam** — o que é a mesma propriedade que o
  banco compartilhado tem, e por isso é fácil esquecer de declarar.
- **Tratamento de inválidos**: 5 `move_uploaded_file`, 22 `wp_upload_dir` e 48 `is_writable` em 25
  arquivos — permissão de escrita é pré-condição, e `A1` já a declara como invariante da atualização
- **Origem da regra**: AD-12 · [`deployment.md`](../deployment.md)
- 🔴 **Tamanho de `uploads/` desconhecido** (RISK-019). É a única parte deste plano em que volume
  importaria, se houvesse cópia — e não há.

### T-12: A variante de `users` (10 ou 12 colunas)
- **Aplica em**: `{p}users`
- **Regra**: o DDL tem **duas** variantes escolhidas por `$is_multisite`
  (`wp-admin/includes/schema.php:192` e `:210`): a de rede acrescenta `spam` e `deleted`. O alvo escolhe
  **a mesma variante pelo mesmo critério**, e **não** emite as duas colunas numa instalação simples.
- **Tratamento**: ⚠️ ler banco de instalação simples e esperar as 12 colunas — ou o contrário — é **erro de
  leitura, não de dado**
- **Origem da regra**: [`target_data_model.md`](target_data_model.md) § *Schema*
- 🔴 **Não se sabe se a instalação de referência é multisite** (lacuna ERD-3, achado A-3), e é essa resposta
  que decide se o total de colunas é **133 ou 135**.

---

## Estratégia de ETL

> 🟢 **Não há ETL.** Esta seção existe para dizer isso com precisão e para registrar o que o lugar do ETL
> ocupa.

- **Ferramenta**: **nenhuma.** Não há *script* SQL de migração, não há dbt, não há Airbyte, não há processo
  *custom*. Nada extrai, nada transforma e nada carrega, porque **origem e destino são a mesma linha**.
- **Fluxo**: o que ocuparia o lugar do ETL é o **arnês de paridade** do Parallel Run, que é **leitura
  comparada** e não movimento de dado:
  1. o *proxy* espelha a requisição para a metade nova **e** para o oráculo;
  2. as duas respostas são comparadas pelo critério da área (Decisão 2);
  3. o **efeito no banco** é comparado por consulta de diagnóstico **antes e depois** da escrita;
  4. divergência abre item, não corrige dado.
- **Idempotência**: a propriedade que se exigiria do ETL recai sobre **T-01**, e lá ela é mais forte que
  idempotência — é **isomorfismo**: `desserializar(serializar(x)) == x` **e**
  `serializar_php(x) == serializar_alvo(x)`, byte a byte. Teste de ida e volta nas **8 colunas** das 4
  famílias, com um corpus que inclua `array` aninhado, objeto, booleano, `null`, `float` e *string*
  multibyte.
- **Throughput esperado**: **não se aplica.** 🔴 E vale registrado por que a pergunta não tem resposta aqui:
  RISK-019 — os **183 passos de migração de dados que o redator gravou em 68 das 74 units** descrevem *o
  que* transformar e **nunca** *quanto*. Qualquer número de vazão seria inventado.

---

## *Backfill* e delta

> 🟢 **Não há *backfill* e não há captura de delta** — e a razão é mais forte que "não é necessário": com um
> banco só, **não existe a diferença que um delta mediria**.

| Campo do *template* | Estado | Por quê |
|---|---|---|
| ***Backfill*** | **não se aplica** | não há destino separado a popular |
| **Mecanismo de captura de delta** (CDC, *log mining*, *timestamp*, replicação, *trigger*) | **nenhum** | ⚠️ e vale nomeado: ***trigger* seria impossível de qualquer forma** — há **zero *trigger*** nesta árvore, e acrescentar um mudaria o comportamento que `DB-TRG1`–`DB-TRG4` descrevem como mantido **em PHP** |
| **Latência aceitável** | **zero por construção** | as duas metades leem a mesma linha no mesmo instante |
| **Reconciliação periódica** | **substituída** pela comparação de **efeito no banco** do Parallel Run, por área | ver § *Validação de qualidade* |

> ⚠️ **O que o banco compartilhado troca, e não remove.** Ele remove a migração de dados e **introduz** uma
> classe de falha que um ETL não teria: as duas metades podem **discordar sobre o mesmo dado agora**. É
> exatamente o que as condições 2, 4 e 5 da coexistência endereçam — *codec*, dono do esquema e cache
> desligado. **Zero ETL não é zero risco de dado**; é outro risco, e ele está em
> § *Riscos específicos de dados*.

---

## *Cutover* de dados

> ⚠️ **A distinção que o Strategist chamou de "o erro mais caro disponível", e que este plano repete porque
> é aqui que ela morde:** *cutover* tem **dois** significados neste projeto, e confundi-los é caro.
>
> | Sentido | O que é | Migração de dados? |
> |---|---|---|
> | **1 — lançamento da versão 1** | as 12 viradas de superfície do [`cutover_plan.md`](cutover_plan.md), contra a instalação de **referência** | **NÃO** — banco compartilhado, zero cópia |
> | **2 — corte de uma instalação adotante** | alguém com um WordPress em PHP em produção decide trocar pelo produto novo | **POSSIVELMENTE SIM** — e isso está **fora do escopo deste pacote** |

### Sentido 1 — o lançamento da versão 1 (o escopo deste plano)

- **Janela**: 🔴 **sem data** — o brief não tem prazo. **Nenhuma indisponibilidade**: o *proxy* alterna
  destino e o banco não se move.
- **Sequência de corte, por virada** (a parte de dados; a parte de superfície está em
  [`cutover_plan.md`](cutover_plan.md)):
  1. rodar as **4 consultas de diagnóstico** de [`database/relationships.md`](../database/relationships.md)
     §4 e **registrar a linha de base** — inclusive os órfãos que são comportamento normal;
  2. conferir que o **cache de objeto está desligado nas duas metades** (condição 5);
  3. conferir que a metade nova **não escreveu estrutura** — `db_version` inalterado em **61833**;
  4. virar a superfície no *proxy*;
  5. **repetir as 4 consultas** e comparar com a linha de base;
  6. manter o portão de paridade de **7 dias corridos sem divergência nova** por área ⚠️ (número que é
     **escolha do Strategist, não medida**: 0 log e nenhuma instalação em operação impedem derivá-lo);
  7. *rollback* é **uma regra de *proxy***, ≤ 2 min — e **não envolve dado**, porque nada foi copiado.
- **Verificação pós-corte**:
  - **Contagens**: `SELECT COUNT(*)` nas 18 tabelas, antes e depois. Tolerância **0** para as viradas de
    **leitura** (fatias 2, 3, 4) — uma virada somente de leitura que mude contagem é defeito, não variação.
    Para as viradas de escrita, a contagem **esperada** muda, e o que se compara é o **efeito** da escrita
    contra o oráculo.
  - **Checksums**: nas **8 colunas serializadas** (T-01), porque é a única classe de coluna em que uma
    diferença de **um byte** quebra a outra metade sem produzir erro.
- **Descomissionamento**: ⚠️ **não se aplica, e a razão é desconfortável.** O legado é o WordPress
  *upstream*, **que segue lançando** (RISK-021). A instalação de referência **permanece no ar como
  oráculo**, sem servir tráfego.

### Sentido 2 — o corte de uma instalação adotante (🔴 fora de escopo, declarado)

Se e quando o produto novo for adotado por alguém com um WordPress em produção, **aí sim** existe migração
de dados — e ela precisa de um plano próprio, que este pacote **não tem** e **não deve inventar**, porque:

- 🔴 **volumetria desconhecida** (RISK-019): nenhuma janela pode ser comprometida antes de
  `SELECT COUNT(*)` por tabela e do tamanho de `uploads/`. *"Compromisso sem esse dado é adivinhação com
  data."*
- 🔴 **geração de formato desconhecida** (RISK-020): a instalação adotante pode ter dados de qualquer
  geração, e **quais gerações o alvo suporta é decisão de `PO-PORTE`**, registrada, não deduzida. O plano de
  contingência já está escrito: **declarar a versão mínima de esquema aceita e falhar ruidosamente abaixo
  dela** — melhor que ler errado em silêncio.
- 🔴 **extensões ativas desconhecidas**: *plugins* podem ter acrescentado tabelas, colunas e
  relacionamentos próprios (lacuna ERD-1), e nenhum deles está nesta árvore.

---

## Validação de qualidade

| Métrica | Alvo | Fonte de medição |
|---|---|---|
| **Contagem por tabela** | **igual ± 0** nas viradas de leitura | `SELECT COUNT(*)` nas 18 tabelas, antes e depois de cada virada |
| **Ida e volta do `serialize()`** | **igual byte a byte**, 100% do corpus | teste de isomorfismo nas 8 colunas das 4 famílias (T-01) |
| **Checksum das colunas serializadas** | **igual** | `MD5` agregado por tabela nas 8 colunas |
| **Integridade referencial** | ⚠️ **igual à linha de base — NÃO "0 órfãos"** | as 4 consultas de [`database/relationships.md`](../database/relationships.md) §4. **3 dos 13 tipos de órfão são comportamento normal** e o alvo precisa **manter** |
| **Divergência dos 3 contadores** | ⚠️ **igual à linha de base — NÃO "0 divergências"** | a 4ª consulta de §4, com os **dois** critérios de `term_taxonomy.count` (T-03) |
| **`db_version`** | **61833, inalterado** | `SELECT option_value FROM {p}options WHERE option_name='db_version'` |
| **Estrutura do esquema** | **18 tabelas · 135 ou 133 colunas · 59 índices · 0 FK** | `SHOW CREATE TABLE` comparado ao do oráculo; reproduzível em [`contar_schema.py`](../../.reversa/work/reversa-designer/contar_schema.py) |
| **Papéis e capacidades** | **idênticos**, inclusive as **4** capacidades que nenhum papel concede | ler `{p}user_roles` dos dois lados e comparar a estrutura **desserializada** e os **bytes** |
| **Valor devolvido por *hook*** | **byte a byte** | arnês de paridade, área *contrato de terceiro* da Decisão 2 |
| **Efeito da cascata de 7 etapas** | **igual**, inclusive o **reparenteamento** | apagar um post com filho, anexo e revisão nos dois lados e comparar as 4 tabelas |
| **Estado entre requisições concorrentes** | **sem vazamento de identidade** | 🔴 **teste que não existe**: nenhum dos 985 testes exercita duas requisições concorrentes. A Decisão 2 já o comprou como área própria |

> ⚠️ **As duas linhas que invertem a métrica habitual são as duas mais importantes desta tabela.** "0
> órfãos" e "0 divergências de contador" seriam os alvos normais — e aqui **os dois são defeito**, porque
> `comments.user_id` apontando para conta apagada, `registration_log` sem `blogs`, *transient* vencido e
> contador divergente durante um lote são **comportamento do produto**. O alvo é **igualdade com a linha de
> base**, não zero.

**E a métrica que o *template* sugere e que NÃO se aplica**: *"soma de valores monetários, igual ± 0,01%"*.
Este sistema **não tem valor monetário algum** — não há domínio financeiro, e `risk_register.md` registra
**zero riscos financeiros** pela mesma razão (*"sem orçamento declarado nenhum risco financeiro é
dimensionável; registrar um sem orçamento seria ruído com aparência de rigor"*).

---

## O plano alternativo — se `BR-HUMANA-003` for **(a)**

🔴 **Esta seção existe porque uma decisão humana pendente transforma este artefato inteiro**, e registrá-lo
agora é mais barato que descobri-lo depois.

Se a resposta for **(a)** — coluna `datetime` anulável com marcador explícito em vez da string literal:

| O que muda | De | Para |
|---|---|---|
| **Esquema** | idêntico ao legado | **diferente** em 10 colunas `datetime` |
| **Banco compartilhado** | 🟢 viável — é o *enabler* da estratégia A | ❌ **impossível**: a metade PHP não entende `NULL` onde espera o sentinela |
| **Estratégia de migração** | Strangler Fig por superfície HTTP | ⚠️ **reavaliar** — cai para Parallel Run + Big Bang, e Big Bang está **PROIBIDA** pelo caso de borda regulatório |
| **ETL** | **nenhum** | **obrigatório**: `'0000-00-00 00:00:00'` → `NULL` + coluna de marcador, nas 10 colunas, em 7 tabelas |
| **Delta** | **nenhum** | **obrigatório** — sem *trigger* (não existem) e sem CDC configurado; sobra *timestamp*, e as colunas de *timestamp* **são justamente as que mudam** |
| **Janela** | nenhuma | **uma por instalação adotante**, com volume 🔴 desconhecido |
| **Ramos de leitura** | T-02 é identidade | T-02 vira a **única transformação real do projeto**, e precisa de regra por tabela: em `posts` o sentinela significa *"rascunho cuja data o status declara"*; em `signups.activated`, *"não ativado"*. **Os dois não podem receber o mesmo marcador** |

> O Curator recomenda **(c)** quando o banco alvo é MySQL com `sql_mode` permissivo — e o banco alvo **é**
> MySQL/MariaDB (🟢 decidido). **Se a resposta for (a), a estratégia precisa ser reavaliada, não ajustada**
> — e este plano, reescrito.

---

## Riscos específicos de dados

Todos de [`risk_register.md`](risk_register.md), com o **papel** responsável — nenhum *owner* é pessoa,
porque o brief não nomeia *stakeholder* algum.

| Risco | O que é | Severidade | *Owner* |
|---|---|---|---|
| **RISK-004** | a resposta **(a)** de `BR-HUMANA-003` derruba o *enabler* da estratégia | **Crítica** | `PO-PORTE` |
| **RISK-005** | a metade TypeScript escreve estrutura que a metade PHP **não lê** — é T-01 | **Crítica** | `DONO-DADOS` |
| **RISK-006** | administrador que atravessa a fronteira do *proxy* é **deslogado** (4 caracteres do *hash* da senha no HMAC) | **Crítica** | `SRE-IMPL` |
| **RISK-007** | **as duas metades disputam a evolução do esquema** — é a condição 3 | **Crítica** | `DONO-DADOS` |
| **RISK-009** | cada metade serve **dado obsoleto** escrito pela outra; a divergência aparece **intermitente**, a mais cara de diagnosticar | **Crítica** | `SRE-IMPL` |
| **RISK-018** | o esquema legado **é contrato**, e três propriedades dele **parecem defeito** — é T-02, T-03 e T-04 | **Alta** | `DONO-DADOS` |
| **RISK-019** | **volumetria desconhecida**: os 183 passos de migração gravados pelo redator dizem *o que*, nunca *quanto* | **Alta** | `PO-PORTE` |
| **RISK-020** | **a migração não é passo prévio, é caminho de leitura permanente** — é a tese deste documento | **Alta** | `PO-PORTE` |
| **RISK-008** | *plugin* PHP **não roda** na metade virada, e extensão ativa na referência **contamina toda a paridade** | **Crítica** | `QA-PARIDADE` |
| **RISK-010** | **falso verde de paridade**: comparar pelo critério errado para a área | **Crítica** | `QA-PARIDADE` |

---

## Notas

**Para o agente de codificação, em uma frase:** não escreva um ETL — escreva o *codec* de `serialize()` com
teste de ida e volta byte a byte, e trate cada formato antigo como **ramo de leitura**, nunca como dado
inválido.

1. **O número mais importante deste plano é um zero, e ele é condicional.** Zero tabelas migradas, zero
   linhas copiadas, zero janela — **e tudo isso depende de `BR-HUMANA-003` = (c)**. Um zero com premissa é
   diferente de um zero medido, e a diferença está declarada no topo e na § *O plano alternativo*.

2. **A inversão que este documento mais pede para não ser "corrigida":** três dos 13 tipos de órfão e a
   divergência dos três contadores **são comportamento do produto**. A métrica de qualidade é **igualdade
   com a linha de base**, não zero. Um porte que "conserte" os órfãos passa em toda auditoria de
   integridade referencial **e falha no critério de idêntico**.

3. **A pergunta que nenhuma etapa deste pacote respondeu, e é o maior item de custo escondido do projeto:**
   RISK-002 — o **corpus de entrada do Parallel Run não existe**, e nenhum dos 181 cards o cobre. Como não
   há instalação em operação nem log retido, a entrada tem de ser construída **requisição a requisição**,
   derivada dos 804 critérios de aceite e dos 289 passos de fluxo principal. **Sem corpus, toda a tabela de
   § *Validação de qualidade* é um formulário em branco.**

4. 🔴 **O que torna metade das consultas deste documento não executáveis hoje**: o `$table_prefix` real é
   desconhecido (ERD-4), não se sabe se a instalação é multisite (ERD-3 — e é isso que decide se são 133 ou
   135 colunas), e `DB_CHARSET`/`DB_COLLATE` não existem nesta árvore (ERD-5). As consultas estão escritas
   com `{p}` ou com o prefixo `wp_` da fonte original, **e precisam de ajuste**.

5. **Uma observação de ordem que vale mais que parece.** A § *Cutover de dados* manda rodar as 4 consultas
   de diagnóstico **antes** da primeira virada, inclusive das fatias **somente de leitura**. A tentação é
   pular isso nas fatias 2, 3 e 4, porque leitura "não pode estragar nada" — e é justamente ali que a linha
   de base é barata de tirar e que os órfãos preexistentes precisam ser **registrados como preexistentes**.
   Depois da primeira virada de escrita, não há mais como saber quais órfãos já estavam lá.

6. **Nenhum número de volume, vazão, janela ou prazo aparece neste documento.** Não é omissão: é a única
   resposta honesta com `migration_brief.md` ausente, sem instância de banco acessada e sem instalação em
   operação. Cada lugar em que o *template* pedia um número traz, no lugar dele, **a lacuna nomeada e o que
   fecharia** — conforme o caso de borda do SKILL para banco legado mal documentado.
