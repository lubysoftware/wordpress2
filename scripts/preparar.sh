#!/bin/sh
# Prepara a árvore de um nó do grafo, depois do `git worktree add`.
#
# `node_modules/` é ignorado pelo git, então a árvore nova nasce sem ele — e
# sem ele `npm test` falha em `tsc: not found`, que não é teste vermelho, é
# árvore crua. Foi o que derrubou a T019 e cancelou cinco nós em cascata.
#
# `npm ci` e não `npm install`: a árvore tem de reproduzir o lock, não resolvê-lo.
set -eu
npm ci --no-audit --no-fund
