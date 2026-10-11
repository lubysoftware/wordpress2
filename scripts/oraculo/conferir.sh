#!/bin/sh
# Tarefa: T001 de `015-plataforma-transversal` — confere que o oraculo responde
# as consultas que os testes de paridade comparam. Satisfaz: — (infraestrutura).
#
# NAO e o arnes de paridade. O arnes e REQ-163 (T005) e compara as duas metades;
# aqui so se afirma que o lado do legado esta no ar e devolve resposta em cada uma
# das areas em que a Decisao 2 de `pending_decisions.md` divide o criterio de
# "identico" — porque "o oraculo responde" e o que a entrega de T001 pede, e
# porque `parity_specs.md` registra que, sem isso, os 985 testes de
# `backlog/tests.md` continuam sendo especificacao em vez de evidencia.
#
# Cada resposta fica gravada em $ORACULO_RAIZ/respostas/, com o relatorio do
# hospedeiro ao lado: `risk_register.md` RISK-008 cobra que a lista de extensoes
# congelada ande junto de cada relatorio de paridade.
set -eu

AQUI=$(cd "$(dirname "$0")" && pwd)
ORACULO_RAIZ=${ORACULO_RAIZ:-$HOME/.oraculo-wordpress-7.1.2}
ORACULO_PORTA=${ORACULO_PORTA:-8080}
ORACULO_BANCO_NOME=${ORACULO_BANCO_NOME:-oraculo}
ORACULO_BANCO_SENHA_RAIZ=${ORACULO_BANCO_SENHA_RAIZ:-oraculo-raiz}
ORACULO_ADMIN=${ORACULO_ADMIN:-oraculo}
ORACULO_ADMIN_SENHA=${ORACULO_ADMIN_SENHA:-oraculo-7-1-2}
export ORACULO_RAIZ ORACULO_PORTA

BASE="http://localhost:$ORACULO_PORTA"
SAIDA="$ORACULO_RAIZ/respostas"
RELATORIO="$SAIDA/relatorio.txt"
mkdir -p "$SAIDA"
: > "$RELATORIO"

falhas=0
total=0

registrar() { printf '%s\n' "$*" >> "$RELATORIO"; printf '%s\n' "$*"; }

compose() { docker compose -f "$AQUI/compose.yml" "$@"; }

consultar() { # consultar <sql>  -> uma linha, sem cabecalho
	compose exec -T -e MYSQL_PWD="$ORACULO_BANCO_SENHA_RAIZ" banco \
		mysql -uroot -N -B -D "$ORACULO_BANCO_NOME" -e "$1" 2>/dev/null | tr -d '\r'
}

# conferir_http <rotulo> <arquivo> <codigo esperado> <trecho esperado> <url> [curl extra...]
#
# O trecho e comparado literalmente (`grep -F`) porque e assim que ele aparece no
# que o legado devolve: o REST escapa a barra (`wp\/v2`), e procurar por expressao
# regular ali daria falso vermelho. Trecho vazio confere so o codigo — e o caso do
# 302 do painel, cujo corpo o legado deixa vazio.
conferir_http() {
	rotulo=$1; arquivo=$2; esperado=$3; trecho=$4; url=$5
	shift 5
	total=$((total + 1))
	codigo=$(curl -s -o "$SAIDA/$arquivo" -w '%{http_code}' "$@" "$url" || echo 000)
	if [ "$codigo" != "$esperado" ]; then
		falhas=$((falhas + 1))
		registrar "FALHA $rotulo -> $codigo (esperado $esperado) ($arquivo)"
	elif [ -n "$trecho" ] && ! grep -qF -- "$trecho" "$SAIDA/$arquivo" 2>/dev/null; then
		falhas=$((falhas + 1))
		registrar "FALHA $rotulo -> $codigo, mas \"$trecho\" nao esta na resposta ($arquivo)"
	else
		registrar "ok    $rotulo -> $codigo${trecho:+, com \"$trecho\"} ($arquivo)"
	fi
}

# conferir_valor <rotulo> <obtido> <esperado>
conferir_valor() {
	total=$((total + 1))
	if [ "$2" = "$3" ]; then
		registrar "ok    $1 -> $2"
	else
		falhas=$((falhas + 1))
		registrar "FALHA $1 -> $2 (esperado $3)"
	fi
}

registrar "# Oraculo de paridade — WordPress 7.1.2"
registrar "# $(date -u '+%Y-%m-%dT%H:%M:%SZ') · $BASE · raiz $ORACULO_RAIZ"
registrar ""

# ---------------------------------------------------------------------------
# Area 1 — contrato de terceiro (saida byte a byte)
# ---------------------------------------------------------------------------
registrar "## Area 1 — contrato de terceiro"
conferir_http "REST: indice"        rest-indice.json  200 'wp\/v2'       "$BASE/wp-json/"
conferir_http "REST: conteudo"      rest-posts.json   200 'Hello world!' "$BASE/wp-json/wp/v2/posts"
conferir_http "REST: contas"        rest-users.json   200 '"id"'         "$BASE/wp-json/wp/v2/users"
conferir_http "feed RSS"            feed-rss2.xml     200 '<rss'         "$BASE/?feed=rss2"
conferir_http "feed Atom"           feed-atom.xml     200 '<feed'        "$BASE/?feed=atom"
conferir_http "sitemap"             sitemap.xml       200 '<sitemapindex' "$BASE/wp-sitemap.xml"
conferir_http "OPML"                links.opml        200 '<opml'        "$BASE/wp-links-opml.php"
conferir_http "XML-RPC"             xmlrpc.xml        200 'Hello!'       "$BASE/xmlrpc.php" \
	-H 'Content-Type: text/xml' \
	--data '<?xml version="1.0"?><methodCall><methodName>demo.sayHello</methodName><params /></methodCall>'
registrar ""

# ---------------------------------------------------------------------------
# Area 4 — HTML de tema e painel (comportamento de caso de uso)
# ---------------------------------------------------------------------------
registrar "## Area 4 — HTML de tema e painel"
conferir_http "pagina inicial"      home.html         200 'Hello world!' "$BASE/"
conferir_http "tela de entrada"     wp-login.html     200 'name="log"'   "$BASE/wp-login.php"
conferir_http "painel sem sessao"   painel-302.html   302 ''             "$BASE/wp-admin/"
conferir_valor "painel sem sessao: para onde manda" \
	"$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE/wp-admin/" | sed 's/?.*//')" \
	"$BASE/wp-login.php"

# A sessao, que e pre-condicao da area 5: o par de requisicoes concorrentes do
# arnes precisa de superficie autenticada respondendo.
total=$((total + 1))
biscoitos="$SAIDA/biscoitos.txt"
rm -f "$biscoitos"
curl -s -o "$SAIDA/entrada.html" -c "$biscoitos" \
	--data-urlencode "log=$ORACULO_ADMIN" \
	--data-urlencode "pwd=$ORACULO_ADMIN_SENHA" \
	--data-urlencode "wp-submit=Log In" \
	--data-urlencode "redirect_to=$BASE/wp-admin/" \
	--data-urlencode "testcookie=1" \
	-b "wordpress_test_cookie=WP%20Cookie%20check" \
	"$BASE/wp-login.php" >/dev/null 2>&1 || true
codigo=$(curl -s -o "$SAIDA/painel.html" -w '%{http_code}' -b "$biscoitos" "$BASE/wp-admin/" || echo 000)
if [ "$codigo" = "200" ] && grep -q 'id="wpadminbar"' "$SAIDA/painel.html" 2>/dev/null; then
	registrar "ok    painel com sessao -> 200, com barra de administracao (painel.html)"
else
	falhas=$((falhas + 1))
	registrar "FALHA painel com sessao -> $codigo (esperado 200 com id=\"wpadminbar\")"
fi
registrar ""

# ---------------------------------------------------------------------------
# Area 3 — esquema e efeito de escrita no banco
# ---------------------------------------------------------------------------
registrar "## Area 3 — esquema e efeito no banco"
conferir_valor "db_version gravada (version.php:26)" \
	"$(consultar "SELECT option_value FROM wp_options WHERE option_name='db_version';")" "61833"
conferir_valor "chaves estrangeiras (o ERD declara zero)" \
	"$(consultar "SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema='$ORACULO_BANCO_NOME';")" "0"
conferir_valor "extensoes ativas (RISK-008: lista congelada, nenhuma ativa)" \
	"$(consultar "SELECT option_value FROM wp_options WHERE option_name='active_plugins';")" 'a:0:{}'

tabelas=$(consultar "SELECT table_name FROM information_schema.tables WHERE table_schema='$ORACULO_BANCO_NOME' ORDER BY table_name;")
printf '%s\n' "$tabelas" > "$SAIDA/tabelas.txt"
registrar "nota  tabelas da instalacao nova ($(printf '%s\n' "$tabelas" | grep -c .)): $(printf '%s\n' "$tabelas" | tr '\n' ' ')"

# O DDL de verdade, saido do banco e nao do instalador lido. E o que a lacuna
# ERD-1 registra como impossivel ate aqui ("nenhuma instancia do banco foi
# acessada: todo este DDL vem do instalador") e o que a paridade de dado compara.
compose exec -T -e MYSQL_PWD="$ORACULO_BANCO_SENHA_RAIZ" banco \
	mysqldump -uroot --no-data --skip-comments --skip-add-drop-table "$ORACULO_BANCO_NOME" \
	> "$SAIDA/esquema.sql" 2>/dev/null || true
registrar "nota  esquema medido em $SAIDA/esquema.sql"
registrar "nota  charset e collation do banco: $(consultar 'SELECT CONCAT(@@character_set_database, " ", @@collation_database);')"
registrar ""

# ---------------------------------------------------------------------------
# O hospedeiro, que entra em todo relatorio de paridade
# ---------------------------------------------------------------------------
registrar "## Hospedeiro congelado"
registrar "nota  PHP $(compose exec -T legado php -r 'echo PHP_VERSION;' 2>/dev/null)"
registrar "nota  MySQL $(consultar 'SELECT VERSION();')"
registrar "nota  ini   $(compose exec -T legado php -r 'echo "memory_limit=", ini_get("memory_limit"), " upload_max_filesize=", ini_get("upload_max_filesize"), " post_max_size=", ini_get("post_max_size"), " max_execution_time=", ini_get("max_execution_time");' 2>/dev/null)"
registrar "nota  editor de imagem: $(compose exec -T legado php -r 'echo extension_loaded("imagick") ? "imagick (1a escolha)" : (extension_loaded("gd") ? "gd (2a escolha)" : "nenhum");' 2>/dev/null)"
compose exec -T legado php -m 2>/dev/null > "$SAIDA/extensoes-php.txt" || true
registrar "nota  extensoes de PHP em $SAIDA/extensoes-php.txt"

for opcao in siteurl home blogname permalink_structure blog_public template stylesheet WPLANG; do
	registrar "nota  opcao $opcao = $(consultar "SELECT option_value FROM wp_options WHERE option_name='$opcao';")"
done
registrar ""

registrar "## Resultado"
registrar "$((total - falhas)) de $total conferencias passaram"
[ "$falhas" -eq 0 ] || { registrar "o oraculo NAO esta respondendo a tudo que se espera dele"; exit 1; }
registrar "o legado 7.1.2 esta no ar em $BASE e responde nas areas 1, 3 e 4 da Decisao 2"
