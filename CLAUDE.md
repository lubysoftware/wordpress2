# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este repositório

Porte do **núcleo do WordPress 7.1.2 para TypeScript**, com **comportamento observável idêntico**, partindo de instalação nova e sem dado a migrar (`package.json`, `memory/constitution.md`). Não é modernização, não é redesenho e não é oportunidade de corrigir o que o legado faz de estranho.

Quem trabalha aqui são **agentes de codificação** executando um pacote Spec Kit gerado por engenharia reversa: 15 features, 136 histórias, 621 critérios de aceite, 301 tarefas. A ordem de execução, o que já fechou e as 58 perguntas em aberto estão em `index.md` — é o arquivo de onde se enxerga o todo.

Três documentos mandam mais do que qualquer código:

| arquivo | o que é |
|---|---|
| `memory/constitution.md` | os 8 princípios (P1–P8) e a tabela **Não negociável**. Releitura obrigatória a cada tarefa |
| `index.md` | ordem de implementação entre features, perguntas em aberto, o ledger de features |
| `do-not-rewrite.md` | os 30 cards recusados de propósito. Não é backlog pendente |

Estado hoje: `001-identidade-e-acesso` 24/24 tarefas, `002-autoria-e-publicacao` 22/24 (T019 e T020 abertas por conflito registrado, ver abaixo), `003-classificacao-do-conteudo` 5/12, `004`/`005`/`006`/`007` só o esqueleto (T001), as outras oito em zero.

## Como rodar e testar

Não há aplicação para subir: a árvore é biblioteca, sem `entradas/` e sem adaptador concreto ainda. Node >= 22 (`engines`); a máquina roda v22.17.1.

```sh
npm ci                 # ou scripts/preparar.sh — ci, nunca install: a árvore reproduz o lock
npm run typecheck      # tsc --noEmit
npm run build          # tsc → dist/
npm test               # build + node --test "dist/**/*.test.js"  → 1143 testes, ~3 s
```

Um arquivo só, ou um teste só — compile antes, porque o runner roda o JS de `dist/`:

```sh
npm run build && node --test dist/contextos/conteudo/publicacao/us-1-publicar-conteudo.test.js
node --test --test-name-pattern 'CA-1.4' dist/contextos/conteudo/publicacao/us-1-publicar-conteudo.test.js
```

Não há lint, formatter nem hook: **o portão é `tsc` em modo estrito** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noUnusedLocals`) **mais `npm test` verde**. `squad.yaml` declara `verificar: npm test` porque um agente já saiu com código 0 deixando dezoito testes vermelhos na main. O CI (`.github/workflows/verificar.yml`) roda o mesmo portão em `push` e `pull_request`, num job só — `npm run typecheck` à parte repetiria o `tsc` que o build já faz.

O **oráculo** é o legado legível em disco em `~/Downloads/wordpress` (WordPress 7.1.2, `db_version` 61833 — a mesma versão do pacote). Está **fora deste repositório e não é versionado**. Não há PHP nesta máquina: o legado se **lê**, não se executa; vetor de paridade se transcreve do formato (ver `src/plataforma/serializacao/conformidade.test.ts`). O oráculo executável é T001 da feature `015` e não existe.

## Estrutura, e a regra que a sustenta

```
src/plataforma/      núcleo compartilhado (hoje: autorizacao/, serializacao/)
src/contextos/<bc>/  um por bounded context (hoje: 7 dos 13)
  portas/            as interfaces para fora — a única saída do contexto
  armazenamento/     forma das tabelas + porta-falsa.ts (o duplo que os testes usam)
  <area>/            uma pasta por área de comportamento, com index.ts de barril
  index.ts           a composição: recebe as portas por argumento e devolve o módulo
  README.md          o que já está decidido, o que está decidido em outro lugar, o que ninguém decidiu
```

**A regra de dependência** (`.specify/migration/target_architecture.md`, § final — é ela que torna a árvore verificável):

1. `contextos/` → `plataforma/` → `utilitarios/`: permitido.
2. `plataforma/` → `contextos/`: proibido.
3. `contextos/<a>/` → `contextos/<b>/` por `import` no topo do módulo: **proibido sempre, sem exceção**. Toda chamada entre contextos é ligação tardia, injetada pelo contexto da operação. Os contextos não formam um DAG — esta regra substitui a aciclicidade.
4. `contextos/` ou `plataforma/` → adaptador concreto: proibido. Só pela porta.

Hoje a árvore respeita isso: o único import cruzando camada é `contextos/identidade-e-acesso` → `plataforma/serializacao`. Quando um comportamento precisa de outro contexto, ele entra como campo do contexto da operação (ex.: `ClassificacaoNaPublicacao` em `conteudo/publicacao/contexto-de-publicacao.ts`), nunca como `import`. Módulo **não guarda estado**: as portas chegam por argumento e nada é resolvido no carregamento.

## Convenções que a árvore cobra

- **Nome de arquivo e símbolo em português, kebab-case, sem acento.** `porta-de-dados.ts`, `estado-na-gravacao.ts`, `aplicarTermoPadrao`.
- **Import com extensão `.js`** (nodenext + `verbatimModuleSyntax`), e `type` explícito em import de tipo.
- **Prosa nova em `src/*.ts` sem acento**; o acento que existe na árvore está quase todo dentro de citação literal de spec (454 de 615 linhas). `⚠️` e `🔴` são marcadores em uso, mantenha-os.
- **Todo arquivo abre com cabeçalho que diz de que tarefa ele é**, qual US/CA ele satisfaz, e **cita o legado por arquivo:linha** (`wp-includes/post.php:4703`). Tire a linha do `grep -n` no oráculo e confira a âncora antes de afirmar — não descreva comportamento de memória, e não declare lacuna sem ter aberto o arquivo.
- **Dois tipos de suíte, e eles não se misturam:** `us-N-*.test.ts` afirma os critérios de aceite da tarefa de implementação; `ut-NNN-*.test.ts` **transcreve** os casos do catálogo `backlog/tests.md` (985 testes já escritos, com entrada, ação e resultado) e é a tarefa `[P]` paralela. Não reconstrua um caso do catálogo — copie-o. `modulo.test.ts` afirma as invariantes do esqueleto.
- **Nada de banco, rede, relógio real ou navegador em teste.** Tudo externo entra por `porta-falsa.ts`, que **registra comando** em vez de simular banco — é assim que se afirma o caso em que o legado não emite comando nenhum.
- **Fechar tarefa = um commit que mexe em quatro coisas:** os arquivos novos, o `index.ts` do módulo, o `README.md` do módulo e o checkbox em `.specify/specs/<feature>/tasks.md`. A marca do ledger **vai dentro do commit** (veja `git show --stat be261c7`); marca fora do commit não chega à próxima onda. Esperar aviso de colisão no `index.ts` e no teste de superfície é normal: toda operação nova os edita.
- **Commit em inglês, prefixo convencional, com a tarefa e a história:** `feat: t017 review and publish another author's content preserving original authorship (US-8)`, `test: t018 eight catalog tests for US-8 (UT-026-1..8)`.
- **Trabalho roda em worktree por tarefa** (`.worktrees/<hash>-<feature>-tNNN-<tentativa>`, excluído em `.git/info/exclude`), preparada por `scripts/preparar.sh`, e entra na main por merge. Há duas tentativas concorrentes por tarefa: o contrato só existe depois do merge.

## O que não tocar

- **`do-not-rewrite.md`** — os 30 cards ali são escopo **recusado**, não trabalho pendente. Implementar um deles é trabalho que ninguém pediu. Se precisar existir, volta pelo Kanban do Studio e o pacote é gerado de novo.
- **A tabela *Não negociável* da constituição.** Não decida sozinho: mudar regra de `domain.md`; renomear/remover ponto de extensão, rota, opção, constante ou função publicada; resolver conflito entre card `wont` e resposta humana; **introduzir limite de taxa, prazo de retenção ou qualquer número que o legado não tem**; exigir assinatura verificada de pacote; fechar o rebaixamento para canal sem cifra; declarar restrição que mude a cascata observável; mudar a ordem de arranque.
- **Divergir do observável exige referência registrada no código** à resposta de `questions.md` ou ao ADR que autorizou (P1). Existem exatamente três divergências autorizadas. Sem a referência, a revisão recusa.
- **Conflito aberto não se resolve escolhendo um lado — para-se e escreve-se.** É o estado de **T019**: US-9 exige aviso ao autor que UC-07 nega palavra por palavra, e não há decisão humana registrada. O ledger ficou aberto de propósito; a parada está em `src/contextos/conteudo/portas/porta-de-email.ts` e em `src/contextos/conteudo/README.md` § *O que ninguém decidiu*.
- **`_discovery/`** é gerado pelo agentic-squad (frontmatter com `hash`). Edição à mão não é sobrescrita, mas chega como diff para alguém decidir.
- **`.specify/`, `backlog/`, `index.md`** são o pacote gerado: lê-se e marca-se checkbox, não se reescreve conteúdo. `dist/` e `node_modules/` são ignorados pelo git.
