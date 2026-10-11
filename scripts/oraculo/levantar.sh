#!/bin/sh
# Tarefa: T001 de `015-plataforma-transversal` — levanta a instalacao executavel
# do legado como oraculo de paridade. Satisfaz: — (infraestrutura).
#
# Autorizado pela resposta 16 de `questions.md` ("levantar uma instalacao
# executavel do legado, na MESMA versao, como referencia de comparacao"), que a
# constituicao registra como a terceira das tres divergencias autorizadas (P1) e
# o catalogo registra como `BR-MIGRAR-116` / `ESC-ORACULO`.
#
# O script e idempotente: rodar de novo nao reinstala nem apaga o banco. Para
# recomecar do zero, `derrubar.sh --apagar`.
#
# Variaveis (valor de fabrica desta receita, todas documentadas no `README.md`):
#   ORACULO_LEGADO   arvore 7.1.2 legivel      (procurada, se nao declarada)
#   ORACULO_RAIZ     onde o oraculo mora       $HOME/.oraculo-wordpress-7.1.2
#   ORACULO_PORTA    porta em 127.0.0.1        8080
#   ORACULO_IMAGICK  1 liga imagick, 0 so gd   1
set -eu

AQUI=$(cd "$(dirname "$0")" && pwd)

ORACULO_RAIZ=${ORACULO_RAIZ:-$HOME/.oraculo-wordpress-7.1.2}
ORACULO_PORTA=${ORACULO_PORTA:-8080}
ORACULO_IMAGICK=${ORACULO_IMAGICK:-1}
ORACULO_BANCO_NOME=${ORACULO_BANCO_NOME:-oraculo}
ORACULO_BANCO_USUARIO=${ORACULO_BANCO_USUARIO:-oraculo}
ORACULO_BANCO_SENHA=${ORACULO_BANCO_SENHA:-oraculo}
ORACULO_BANCO_SENHA_RAIZ=${ORACULO_BANCO_SENHA_RAIZ:-oraculo-raiz}
export ORACULO_RAIZ ORACULO_PORTA ORACULO_IMAGICK \
	ORACULO_BANCO_NOME ORACULO_BANCO_USUARIO ORACULO_BANCO_SENHA ORACULO_BANCO_SENHA_RAIZ

# Os valores da instalacao. Entram no que o oraculo devolve (o titulo aparece no
# feed, no REST e no HTML), logo sao parte do contrato de comparacao e nao podem
# ser sorteados a cada subida.
ORACULO_TITULO=${ORACULO_TITULO:-oraculo}
ORACULO_ADMIN=${ORACULO_ADMIN:-oraculo}
ORACULO_ADMIN_SENHA=${ORACULO_ADMIN_SENHA:-oraculo-7-1-2}
ORACULO_ADMIN_EMAIL=${ORACULO_ADMIN_EMAIL:-oraculo@example.invalid}

aviso() { printf '%s\n' "$*" >&2; }
morrer() { aviso "erro: $*"; exit 1; }

# ---------------------------------------------------------------------------
# 1. A arvore do legado, e a conferencia de que e a MESMA versao
# ---------------------------------------------------------------------------
# A arvore nao esta neste repositorio e nao e versionada (CLAUDE.md). O que esta
# receita cobra dela e so o que a resposta 16 exige: a mesma versao.
if [ -z "${ORACULO_LEGADO:-}" ]; then
	for candidato in \
		"$HOME/Downloads/wordpress" \
		"$HOME/Downloads/luby-studio-legado/studio/data/workspaces/run_muvp9wahprbsns"
	do
		if [ -f "$candidato/wp-includes/version.php" ]; then
			ORACULO_LEGADO=$candidato
			break
		fi
	done
fi
[ -n "${ORACULO_LEGADO:-}" ] || morrer "arvore do legado nao encontrada; declare ORACULO_LEGADO=<caminho>"
[ -f "$ORACULO_LEGADO/wp-includes/version.php" ] || morrer "$ORACULO_LEGADO nao tem wp-includes/version.php"

versao=$(sed -n "s/^\$wp_version = '\([^']*\)'.*/\1/p" "$ORACULO_LEGADO/wp-includes/version.php")
db_versao=$(sed -n "s/^\$wp_db_version = \([0-9]*\).*/\1/p" "$ORACULO_LEGADO/wp-includes/version.php")
# `wp-includes/version.php:19` e `:26`. RISK-021: o oraculo e a instalacao de
# 7.1.2 e nao muda durante o projeto; subir outra versao e trocar o oraculo.
[ "$versao" = "7.1.2" ] || morrer "versao do legado e $versao, e o oraculo e 7.1.2 (version.php:19)"
[ "$db_versao" = "61833" ] || morrer "db_version do legado e $db_versao, e o oraculo e 61833 (version.php:26)"

aviso "legado:  $ORACULO_LEGADO (WordPress $versao, db_version $db_versao)"
aviso "oraculo: $ORACULO_RAIZ (http://localhost:$ORACULO_PORTA)"

# ---------------------------------------------------------------------------
# 2. A copia da arvore
# ---------------------------------------------------------------------------
# Copia, e nao montagem da arvore original: o atualizador embutido escreve no
# proprio webroot (`deployment.md` secao 8) e o oraculo nao pode corromper a
# arvore de leitura de onde todo o pacote foi lido.
mkdir -p "$ORACULO_RAIZ"
if [ ! -d "$ORACULO_RAIZ/html" ]; then
	aviso "copiando a arvore..."
	mkdir -p "$ORACULO_RAIZ/html"
	# `_reversa_*` e a analise gerada pelo Studio, nao faz parte da distribuicao.
	tar -cf - -C "$ORACULO_LEGADO" \
		--exclude '_reversa_docs' --exclude '_reversa_sdd' --exclude '_reversa_refactor' \
		--exclude 'CLAUDE.md' --exclude 'wp-config.php' . \
		| tar -xf - -C "$ORACULO_RAIZ/html"
	# O produto escreve em wp-content (upload, derivada de imagem, .htaccess) e
	# o usuario do Apache dentro do conteiner nao e o dono da copia.
	chmod -R a+rwX "$ORACULO_RAIZ/html/wp-content"
	chmod a+rwX "$ORACULO_RAIZ/html"
fi

cp "$AQUI/wp-config.php" "$ORACULO_RAIZ/html/wp-config.php"
chmod a+r "$ORACULO_RAIZ/html/wp-config.php"

# ---------------------------------------------------------------------------
# 3. O ambiente isolado
# ---------------------------------------------------------------------------
docker compose -f "$AQUI/compose.yml" up -d --build

aviso "esperando o Apache responder..."
tentativa=0
while :; do
	codigo=$(curl -s -o /dev/null -w '%{http_code}' \
		"http://localhost:$ORACULO_PORTA/wp-admin/install.php" || true)
	case "$codigo" in
		200|302) break ;;
	esac
	tentativa=$((tentativa + 1))
	[ "$tentativa" -lt 60 ] || morrer "o legado nao respondeu em 120 s (ultimo codigo: $codigo)"
	sleep 2
done

# ---------------------------------------------------------------------------
# 4. A instalacao, feita pelo instalador do proprio legado
# ---------------------------------------------------------------------------
# Pelo formulario de `wp-admin/install.php` (campos em `:110-210`, passo 2 em
# `:400-465`), e nao chamando `wp_install()` por dentro: o oraculo tem de nascer
# do caminho que o produto tem, inclusive da validacao que US-6 descreve.
pagina=$(curl -s "http://localhost:$ORACULO_PORTA/wp-admin/install.php")
case "$pagina" in
	*"Already Installed"*|*"already installed"*)
		aviso "o oraculo ja estava instalado; nada a fazer"
		;;
	*)
		aviso "instalando..."
		resultado=$(curl -s \
			--data-urlencode "weblog_title=$ORACULO_TITULO" \
			--data-urlencode "user_name=$ORACULO_ADMIN" \
			--data-urlencode "admin_password=$ORACULO_ADMIN_SENHA" \
			--data-urlencode "admin_password2=$ORACULO_ADMIN_SENHA" \
			--data-urlencode "pw_weak=1" \
			--data-urlencode "admin_email=$ORACULO_ADMIN_EMAIL" \
			--data-urlencode "blog_public=1" \
			--data-urlencode "language=" \
			--data-urlencode "Submit=Install WordPress" \
			"http://localhost:$ORACULO_PORTA/wp-admin/install.php?step=2")
		case "$resultado" in
			*"WordPress has been installed"*)
				aviso "instalado"
				;;
			*)
				printf '%s\n' "$resultado" > "$ORACULO_RAIZ/instalacao-recusada.html"
				morrer "o instalador nao concluiu; a resposta esta em $ORACULO_RAIZ/instalacao-recusada.html"
				;;
		esac
		;;
esac

# ---------------------------------------------------------------------------
# 5. A conferencia
# ---------------------------------------------------------------------------
# Com `sh` na frente de proposito: o script vale com ou sem bit de execucao.
exec sh "$AQUI/conferir.sh"
