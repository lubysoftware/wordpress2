# `demo/` — andaime para ver o porte rodando

**Isto não é parte do porte.** Nada aqui é portado de `~/Downloads/wordpress`, nada aqui
tem paridade a conferir, e nada aqui entra no portão: `tsconfig.json` inclui só
`src/**/*.ts`, então `npm run typecheck`, `npm run build` e `npm test` ignoram esta pasta.

A árvore é biblioteca: não há `entradas/`, não há adaptador concreto, e **nenhuma das 301
tarefas do pacote entrega a borda HTTP** — existe só o slot `framework-http`, em aberto em
`.specify/arquitetura/tech-stack.json`, com `node-http` recomendado. `tech-stack.json`
registra por quê: num runtime de JavaScript a reescrita de URL passa a ser in-process, e
*"isso é código novo, não porte"*.

Esta pasta existe para uma pergunta só: **como está o porte hoje, para quem quer ver.**
Ela não decide o slot, não antecipa a borda e é descartável — quando a borda de verdade
for decidida e gerada pelo Kanban do Studio, isto aqui sai.

## Rodar

```sh
npm run build          # obrigatório: o demo consome dist/, não src/
node demo/servidor.mjs # http://127.0.0.1:7112
node demo/roteiro.mjs  # as mesmas cenas, no terminal
```

| arquivo | o que é |
|---|---|
| `nucleo.mjs` | a borda simulada: porta de dados em memória que **registra comando**, porta de e-mail, mapa de sessões, e os contextos montados como as suítes os montam |
| `servidor.mjs` | o adaptador HTTP, `node:http` cru, sem dependência. Seis rotas |
| `roteiro.mjs` | as mesmas cinco cenas, impressas no terminal |

## A regra que esta pasta respeita

**Nenhuma decisão mora aqui.** A borda traduz HTTP e monta as portas; toda resposta sai de
operação publicada de `dist/` — `autenticar`, `cadastrar`, `perguntarPermissao`,
`sessaoDaRequisicao`, `autorizarAbertura`. Se uma pergunta de permissão fosse respondida
por um `if` deste diretório, o demo estaria mentindo sobre o porte.

É também a demonstração de como a tela entra: o HTML e o CSS são **todos** desta pasta, e o
porte entrega só o dado — quem pode, qual erro, qual campo. É a mesma divisão que
`leitura-publica/senha-de-conteudo/formulario-de-senha.ts` faz ao devolver
`FormularioDeSenha { destino, metodo, classes, campos[] }` sem montar marcação nenhuma.

## O que é mentira de propósito

- **O bcrypt é um duplo determinista**, copiado do fixture das suítes (`cadastrar.test.ts`).
  Não é hash real, e as senhas de teste aparecem na própria tela.
- **O banco é um `Map`.** Reiniciar o processo reinstala o site.
- **Não há front controller, reescrita de URL nem cabeçalho do legado.** Os 109 front
  controllers, o reescritor próprio e as 209 chamadas `header()` continuam sem porte.
- `sorteioDeterminista` percorre o alfabeto em ordem: os segredos gerados são previsíveis.
