#!/bin/sh
# Tarefa: T001 de `015-plataforma-transversal` — derruba o oraculo. Satisfaz: —
# (infraestrutura).
#
# Sem argumento: para os conteineres e DEIXA o banco. E o caso normal, porque o
# oraculo nao pode ser recriado por acidente: `risk_register.md` RISK-007 registra
# que ele e "a unica fonte de verdade de comportamento que o projeto tem" e
# RISK-022 que o momento em que ninguem consegue reproduzi-lo igual e o momento em
# que ele deixa de ser oraculo.
#
# Com `--apagar`: apaga tambem o volume do banco e a copia da arvore. Depois disso
# `levantar.sh` instala de novo, do zero.
set -eu

AQUI=$(cd "$(dirname "$0")" && pwd)
ORACULO_RAIZ=${ORACULO_RAIZ:-$HOME/.oraculo-wordpress-7.1.2}
ORACULO_PORTA=${ORACULO_PORTA:-8080}
export ORACULO_RAIZ ORACULO_PORTA

if [ "${1:-}" = "--apagar" ]; then
	docker compose -f "$AQUI/compose.yml" down --volumes
	rm -rf "$ORACULO_RAIZ/html" "$ORACULO_RAIZ/respostas"
	printf '%s\n' "oraculo apagado: volume do banco e copia da arvore em $ORACULO_RAIZ" >&2
else
	docker compose -f "$AQUI/compose.yml" down
	printf '%s\n' "oraculo parado; o banco continua no volume (use --apagar para recomecar do zero)" >&2
fi
