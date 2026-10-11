# O oráculo de paridade — WordPress 7.1.2 executável

> Tarefa **T001** de [`015-plataforma-transversal`](../../.specify/specs/015-plataforma-transversal/tasks.md).
> Satisfaz: — (infraestrutura).

## Por que isto existe

A resposta **16** de `questions.md` é literal: *"levantar uma instalação executável do
legado, na MESMA versão, como referência de comparação. Isto não é opcional quando o
critério é 'idêntico': sem execução do legado, equivalência é afirmada e não verificada, e
os 985 testes do `tests.md` continuam sendo especificação em vez de evidência."*

É uma das **três divergências autorizadas** da constituição (P1), está no catálogo como
[`BR-MIGRAR-116`](../../.specify/migration/target_business_rules.md#br-migrar-116)
(`ESC-ORACULO`), e `parity_specs.md` a chama de *"pré-condição de todos os modos"*. O que
esta pasta entrega é a **receita reproduzível** que `risk_register.md` RISK-022 cobra —
*"versão de PHP, de MySQL, `wp-config.php` com os valores declarados, lista de extensões
congelada e sais fixos"* — mais a conferência de que o legado, levantado por ela, responde.

O mesmo RISK-022 resolve a dúvida de conteinerizar: *"o adiamento do container vale para o
**produto**, não para o oráculo"*. O produto portado continua sem contêiner na primeira
fase, por decisão adiada de propósito.

## Como usar

```sh
sh scripts/oraculo/levantar.sh    # copia a árvore, sobe o ambiente, instala e confere
sh scripts/oraculo/conferir.sh    # só a conferência, contra um oráculo já no ar
sh scripts/oraculo/derrubar.sh    # para os contêineres e deixa o banco
sh scripts/oraculo/derrubar.sh --apagar   # apaga o banco e a cópia da árvore
```

Pré-requisitos: `docker` com o daemon no ar e `curl`. A árvore 7.1.2 legível **não está
neste repositório e não é versionada**: `levantar.sh` a procura em
`~/Downloads/wordpress` e no workspace do Studio, e aceita `ORACULO_LEGADO=<caminho>`.
Antes de copiar, ele recusa qualquer árvore que não seja `7.1.2` / `db_version 61833`
(`wp-includes/version.php:19` e `:26`) — "mesma versão" é a única coisa que a resposta 16
exige do artefato, e RISK-021 fixa que *"o oráculo é a instalação de 7.1.2 e não muda
durante o projeto"*.

Variáveis, com o valor de fábrica desta receita:

| variável | fábrica | o que é |
|---|---|---|
| `ORACULO_LEGADO` | procurado | a árvore 7.1.2 legível, de onde se copia |
| `ORACULO_RAIZ` | `$HOME/.oraculo-wordpress-7.1.2` | onde o oráculo mora (cópia da árvore e respostas capturadas) |
| `ORACULO_PORTA` | `8080` | porta em `127.0.0.1`, **dentro e fora do contêiner** |
| `ORACULO_IMAGICK` | `1` | `1` liga imagick (1ª escolha do produto), `0` deixa só gd |

## A matriz congelada, e de onde vem cada número

Nenhum valor aqui foi escolhido por gosto: cada um é o que o próprio legado declara exigir
ou recomendar. É o que torna a receita conferível — e é por isso que ela não inventa número
que o legado não tem (P6).

| slot | valor | âncora no legado |
|---|---|---|
| PHP | **8.3** (imagem `php:8.3-apache`, PHP 8.3.35) | `readme.html:61` recomenda 8.3; o piso é 7.4 em `wp-includes/version.php:40` |
| extensões obrigatórias | `json`, `hash` | `wp-includes/version.php:47-50` — sem elas a carga aborta |
| driver de banco | `mysqli` | `wp-includes/class-wpdb.php:705` fixa `$use_mysqli = true` e confere `instanceof mysqli` |
| MySQL | **8.0** (imagem `mysql:8.0`, 8.0.46) | `readme.html:62` recomenda 8.0; `wp-admin/includes/class-wp-site-health.php:20` repete o número; piso 5.5.5 em `version.php:57` |
| servidor | Apache com `mod_rewrite` e `AllowOverride All` | `readme.html:63` recomenda mod_rewrite; o produto escreve `.htaccess` por conta própria |
| processamento de imagem | imagick (1ª escolha) **e** gd (2ª) presentes | `_reversa_sdd/tech/technologies.md` §3 declara a ordem de escolha |
| charset / collate | `utf8mb4` / vazio | `wp-config-sample.php:35` e `:38` |
| prefixo de tabela | `wp_` | `wp-config-sample.php:74` |
| `WP_DEBUG` | `false` | `wp-config-sample.php:88`; e a resposta 11 registra que o caso "pacote sem assinatura" é silenciado **fora** do modo de depuração — ligar depuração mudaria o observável |
| idioma | `en_US` | a árvore não traz catálogo de tradução (lacuna L5 de `soul.md`) |

Imagens fixadas por **digest** no [`compose.yml`](compose.yml) e no [`Dockerfile`](Dockerfile):
trocar a imagem é trocar o oráculo. Nenhum valor de `php.ini` é sobrescrito — `memory_limit`,
`upload_max_filesize`, `post_max_size` e `max_execution_time` são números do hospedeiro que
o produto lê e exibe; `conferir.sh` os **registra** em vez de inventá-los.

**A porta é a mesma dentro e fora do contêiner**, e isso não é detalhe: a requisição de
loopback do produto vai ao próprio `home_url()`, que carrega a porta do pedido que instalou
o site. Com porta diferente nos dois lados, o loopback falharia por artefato desta receita
em vez de falhar pelo motivo do legado — *timeout* de 0,01 s, `blocking` falso, `sslverify`
falso —, e a fatia 5 de `parity_specs.md` é justamente a fatia em que **o comportamento
correto é o fracasso**. O primeiro loopback acontece na própria instalação, em
`wp_install_maybe_enable_pretty_permalinks()` (`wp-admin/includes/upgrade.php:500`).

## Os valores da instalação

Entram no que o oráculo devolve (o título aparece no HTML, no feed e no REST), logo são
parte do contrato de comparação e não podem ser sorteados a cada subida.

| campo | valor |
|---|---|
| título | `oraculo` |
| conta de administração | `oraculo` |
| senha | `oraculo-7-1-2` |
| e-mail | `oraculo@example.invalid` |
| visibilidade (`blog_public`) | `1` |
| endereço | `http://localhost:8080` |

A instalação é feita pelo **formulário de `wp-admin/install.php`** (campos em `:110-210`,
passo 2 em `:400-465`), e não chamando `wp_install()` por dentro: o oráculo nasce do caminho
que o produto tem. O conteúdo inicial é o que `wp_install_defaults()` grava — a categoria
`Uncategorized`, o conteúdo `Hello world!` (`wp-admin/includes/upgrade.php:247`), a página
`Sample Page` (`:352`) e o comentário de exemplo. É **instalação nova, sem dado a migrar**,
que é o alvo fixado pelas respostas 1 a 5.

Os sais estão fixos e versionados em [`wp-config.php`](wp-config.php) por causa de RISK-006:
a chave do HMAC do cookie embute quatro caracteres do hash da senha e o *nonce* amarra tick,
ação, usuário e token — sal que muda a cada subida torna o oráculo irreproduzível
exatamente na área de sessão. Não há usuário real nem dado real neste ambiente, e a porta
está presa a `127.0.0.1`: estes sais e estas senhas são de referência e não servem a mais
nada.

## O que está desligado, de propósito

| o que | por que |
|---|---|
| nenhuma extensão ativa | RISK-008: *"lista de extensões congelada e declarada ... registrada junto de cada relatório de paridade"*. As empacotadas ficam no disco, desativadas; Akismet já está fora de escopo por `BR-DESCARTAR-001/002/003` |
| nenhum `object-cache.php` / `advanced-cache.php` | RISK-009: cache de objeto persistente desligado. A ausência do arquivo **é** a forma de o desligar — é *drop-in* por presença de arquivo (`domain.md` §1.6), e o mecanismo fica intocado |
| `WP_SITEURL`, `WP_HOME`, `DISALLOW_FILE_MODS`, `AUTOMATIC_UPDATER_DISABLED` não declarados | cada um mudaria comportamento observável que é escopo (UC-33, UC-34, tela de opções) |
| o banco não publica porta | só a rede interna do compose o alcança; o oráculo **nunca serve tráfego** |

## O que o oráculo responde hoje

`conferir.sh` grava cada resposta em `$ORACULO_RAIZ/respostas/`, com o relatório do
hospedeiro ao lado, e cobre as áreas em que a **Decisão 2** de `pending_decisions.md`
divide o critério de "idêntico":

| área da Decisão 2 | o que se consulta |
|---|---|
| 1 — contrato de terceiro | `/wp-json/`, `/wp-json/wp/v2/posts`, `/wp-json/wp/v2/users`, `?feed=rss2`, `?feed=atom`, `/wp-sitemap.xml`, `/wp-links-opml.php`, `demo.sayHello` por XML-RPC |
| 3 — esquema e efeito no banco | `db_version` gravada igual a `61833`, **zero** chaves estrangeiras como o ERD declara, `active_plugins` vazia, e a lista de tabelas da instalação nova |
| 4 — HTML de tema e painel | página inicial, tela de entrada, painel sem sessão (302) e painel **com** sessão |
| 5 — estado entre requisições concorrentes | não se afirma aqui: o teste é do arnês. O que esta conferência garante é a pré-condição — superfície autenticada respondendo |

`conferir.sh` **não é** o arnês de paridade. O arnês compara as duas metades e é REQ-163
(T005); aqui só se afirma que o lado do legado está no ar e devolve resposta.

### O que a primeira subida mediu

Medido, não lido — é a diferença que a resposta 16 compra. Fica registrado aqui porque
quatro lacunas do pacote dizem, por escrito, que estes valores eram desconhecidos; o que
este oráculo faz é torná-los **mensuráveis**, e fechar a lacuna continua sendo de quem é
dona dela:

| o que | medido | lacuna que o pedia |
|---|---|---|
| instância de banco acessada | sim, criada pelo instalador do legado | ERD-1: *"nenhuma instância do banco foi acessada: todo este DDL vem do instalador"* |
| tabelas da instalação nova | **12** (`wp_commentmeta`, `wp_comments`, `wp_links`, `wp_options`, `wp_postmeta`, `wp_posts`, `wp_term_relationships`, `wp_term_taxonomy`, `wp_termmeta`, `wp_terms`, `wp_usermeta`, `wp_users`) | das 18 do vocabulário, as outras 6 são de rede — ver abaixo |
| chaves estrangeiras | **zero**, como o ERD declara | — |
| `$table_prefix` | `wp_` | ERD-4: *"o `$table_prefix` real é desconhecido"* |
| `charset` e `collation` | banco em `utf8mb4` / `utf8mb4_0900_ai_ci`, mas **as tabelas nascem em `utf8mb4_unicode_520_ci`**, escolhida pelo próprio produto, e `option_name` é `varchar(191)` | ERD-5: *"`charset` e `collation` reais dependem de `DB_CHARSET`/`DB_COLLATE`, que não existem nesta árvore"* |
| `db_version` gravada | `61833` numa instalação nova | ERD-7: a faixa 61645–61833 não tem rotina de dados |
| permalink depois da instalação | `/%year%/%monthnum%/%day%/%postname%/` — o loopback da instalação **funcionou** | — |
| editor de imagem em uso | imagick, a 1ª escolha do produto | — |
| tema ativo | `twentytwentyfive` | — |

O esquema medido fica em `$ORACULO_RAIZ/respostas/esquema.sql`, e é dele que sai a
comparação da área 3.

### Este oráculo é de site único, e isso é escopo declarado

A instalação nova pelo instalador do legado é **single-site**: 12 tabelas e a variante de
`users` de site único. A lacuna **ERD-3** registra que a análise *"não sabe se a instalação
é multisite"*, e que a resposta muda **6 tabelas**, a relação 24 e qual variante de `users`
vale — ou seja, se as colunas são 133 ou 135. A fatia 16 de `parity_specs.md` (rede e
cadastro) e as 7 regras MIGRAR da área *Rede* precisam de uma referência de rede, que se
obtém ligando a rede **depois** da instalação, e não é o que esta receita faz.

Quem levantar essa segunda referência declara a diferença, porque ela é observável — e a
contingência de RISK-008 já prevê o formato: *"declarar DUAS referências"*, cada uma com o
seu relatório, e nunca comparar contra a errada.

## O que continua aberto

O manifest de telas declara `oracleAvailable: false` com **quatro causas**. Esta receita
fecha duas:

| causa | situação |
|---|---|
| sem `wp-config.php` | **fechada** por [`wp-config.php`](wp-config.php) |
| sem banco | **fechada**: MySQL 8.0 no ambiente, instalado pelo instalador do legado |
| sem `wp-includes/js/dist/` | **aberta**. A resposta 15 manda construí-lo de `github.com/WordPress/wordpress-develop` na mesma versão — a etiqueta `7.1.2` existe lá (conferido com `git ls-remote --tags`), e a construção não foi feita aqui. É a lacuna que `index.md` registra para as histórias US-11 a US-14 de `009-apresentacao-e-personalizacao`, e ela precisa de tarefa própria. Até lá, as telas que dependem do lado cliente do editor não têm oráculo útil — e `DEV-004` avisa que teste de paridade contra a árvore incompleta **passaria reproduzindo o erro** |
| zero *fixtures* | **parcial**. O oráculo nasce com o conteúdo que a instalação nova cria, e esse é o estado de referência declarado. O *corpus* dos cenários de paridade — um percurso por caso de uso, um caso por ponto de filtro — é trabalho do arnês (REQ-163) |

## Regras de uso

- **O oráculo não serve tráfego.** No modo sombra, o *proxy* espelha leitura para o arnês e
  compara de forma assíncrona (`parity_specs.md`, § *Detalhe por modo*).
- **Não atualize o núcleo dele.** RISK-021: o oráculo é 7.1.2 e não muda durante o projeto;
  correção de segurança do *upstream* entra como mudança de escopo, não como rotina.
- **Dono único do esquema.** RISK-007: durante a coexistência, quem evolui o esquema é a
  instalação de referência; a metade nova roda com a comparação de estrutura desligada e
  falha ruidosamente em vez de corrigir.
- **Retrato antes de cada virada.** O retrato sai por `mysqldump` do serviço `banco` — o
  volume é nomeado de propósito, porque InnoDB sobre a montagem de disco do macOS trava
  arquivo de forma que não se reproduz.
- **A lista de extensões e o hospedeiro acompanham o relatório** de paridade (RISK-008):
  `$ORACULO_RAIZ/respostas/relatorio.txt` e `extensoes-php.txt` existem para isso.
- **Divergência observada contra o oráculo não autoriza mudar regra sozinho.** A pergunta
  em aberto de `index.md` sobre a matriz de papéis é o exemplo: se a instalação de
  referência mostrar matriz diferente da derivada, *qual das duas vale* é decisão humana
  registrada, não escolha de quem implementa.
