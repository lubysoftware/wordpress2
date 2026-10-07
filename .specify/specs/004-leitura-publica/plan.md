# Plano — Leitura pública

> Como ler este plano: a spec diz **o quê** e **por quê**; este arquivo diz **como**, e
> é o único dos três que fala de tecnologia. Nenhum requisito novo nasce aqui: o que não
> estiver na [spec](spec.md) não é requisito, é invenção.

## Stack

**O que já é decisão humana registrada**

| decisão | valor | onde foi registrada |
|---|---|---|
| Arquitetura | `hexagonal` (Portas e adaptadores) | `refactor/decision.json`, decidida em 2026-10-07 por humano (Studio) |
| Objetivo do porte | comportamento observável idêntico, partindo de instalação nova, sem dado a migrar | respostas 1 a 5 de [`questions.md`](../../../questions.md) |
| Linguagem alvo | TypeScript | a resposta 15 de [`questions.md`](../../../questions.md) a nomeia ao decidir de onde vem o lado cliente |

**O que NÃO é decisão de ninguém: os slots abaixo.** Eles vêm de
[`refactor/tech-stack.json`](../../../refactor/tech-stack.md), que é **pesquisa**: um
leque de candidatos por slot, com um `recommended` e a razão dele. Não existe, no Studio,
clique que decida stack, e quem define a tecnologia é quem vai construir, ao abrir os
agentes. Abaixo, recomendação é recomendação; nada aqui está escolhido.

Os slots listados são os que esta feature usa. O leque completo, com os 17 slots, os
riscos de cada candidato e a lista de verificação que a pesquisa deixou aberta, está em
[`refactor/tech-stack.md`](../../../refactor/tech-stack.md).


### Camada HTTP e roteamento (`framework-http`)

O legado não tem framework HTTP: tem 109 front controllers, um reescritor de URL próprio (`rewrite-e-permalinks`) e 209 chamadas `header()`. E `technologies.json` registra a assimetria que decide este slot: para Apache e IIS o sistema ESCREVE o arquivo de configuração do servidor (`.htaccess`, `web.config`); para nginx e Caddy não escreve nada e as regras ficam fora do produto. Num runtime de JavaScript não há servidor externo a quem escrever — a reescrita passa a ser in-process, e isso é código novo, não porte.

| candidato | o que é | situação |
|---|---|---|
| `node-http` | Servidor HTTP do runtime com roteador próprio | **recomendado pela pesquisa** |
| `fastify` | Fastify | candidato |
| `hono` | Hono | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O produto já é o seu próprio framework HTTP, e todo framework que ajudasse na borda normalizaria algo que o critério de idêntico proíbe normalizar: ordem de cabeçalho, resposta malformada aceita, e as 7 formas de saída observáveis.

### Isolamento de estado por requisição (`isolamento-de-requisicao`)

O legado não tem isolamento: tem descarte. `architecture.md` registra que nenhuma fronteira de processo existe em todo o nível 2 do C4 — um processo PHP por requisição, montado por `wp-settings.php` e descartado no fim da resposta. É esse descarte que torna seguras as 1.121 declarações `global $x` em 230 arquivos, os 3.411 usos de superglobal e as 94 chamadas `exit`/`die`. Em processo longevo nada disso é seguro, e o vazamento de estado entre requisições não aparece em teste de unidade: aparece como uma pessoa vendo o painel de outra. É o slot em que este porte quebra, e não há candidato óbvio.

| candidato | o que é | situação |
|---|---|---|
| `processo-por-requisicao` | Processo por requisição (modelo CGI) | **recomendado pela pesquisa** |
| `contexto-assincrono` | Contexto por requisição em processo longevo (AsyncLocalStorage) | candidato |
| `worker-por-requisicao` | Worker isolado por requisição | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato em que a equivalência observável é por construção e não por disciplina — e com 1.121 pontos de estado global, zero arquivo de teste no legado e 'idêntico' como critério de aceite, a escolha de desempenho pode ser revista depois com número medido; a de correção, não.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

### Análise e sanitização de HTML (`analise-de-html`)

`html-api` é uma das DUAS raízes do grafo de dependência de todo o sistema (`architecture-graph.json`), e `kses-e-sanitizacao` está no núcleo crítico, com 11 ou mais dependentes diretos. São 16.590 linhas em 14 arquivos de `wp-includes/html-api/` mais 3.159 de `wp-includes/kses.php`, e as duas fazem trabalhos diferentes que um projeto novo confundiria: a primeira é um tokenizador que persegue a especificação do HTML5 e EDITA a string no lugar; a segunda é a lista de permissão que decide o que cada papel pode publicar — `permissions.md` registra que `editor` tem `unfiltered_html`.

| candidato | o que é | situação |
|---|---|---|
| `porte-a-mao` | Porte à mão das duas, com a tabela de referências de caracteres | **recomendado pela pesquisa** |
| `tokenizador-de-terceiro` | Tokenizador de terceiro conforme a especificação | candidato |
| `sanitizador-de-terceiro` | Sanitizador de terceiro por lista de permissão | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que parece substituível, o tokenizador, é um editor de string que nenhum analisador de árvore reproduz sem reescrever o `post_content`; e a outra metade, KSES, é fronteira de autorização, não higiene de HTML.

## Modelo de dados

Esta feature quase não grava: ela lê conteúdo publicado e resolve endereço. As estruturas
que ela toca são as da feature 002, mais duas que são dela.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| regras de tradução de endereço | gravadas na configuração do site como cache, reconstruídas quando a forma dos endereços muda | continuam sendo dado, não código: é isso que permite mudar a forma dos endereços sem tocar no conteúdo gravado |
| `posts`, pelo estado e pela senha | o estado decide se o conteúdo é público; a senha, em texto claro, decide se o corpo é servido | sem mudança. A senha é de acesso a conteúdo, não de conta, e precisa poder ser exibida a quem edita |
| atestado de senha | cookie no navegador do visitante, dez dias, sem verificação de idade no servidor e sem limite de tentativa | a resposta 8 manda preservar os três fatos |
| `links` | a lista de links herdada, que o instalador ainda cria | pendente do conflito de REQ-046, na seção Fora de escopo da spec |

A restrição de leitura tem uma propriedade que o modelo novo não pode perder: a proteção
por senha é do corpo, não da existência. O conteúdo protegido continua listado, continua
no mapa do site e continua aceitando pedido de comentário recusado com motivo próprio.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| resolver endereço | endereço pedido | conjunto de critérios de consulta | nenhum: endereço sem correspondência vira consulta vazia |
| consultar conteúdo público | critérios, página, tamanho de página | lista paginada, com total e número de páginas | página além do total, que é resposta de endereço inexistente e não lista vazia |
| escolher apresentação | resultado da consulta | modelo escolhido pela hierarquia declarada | nenhum: a hierarquia termina sempre num modelo de reserva |
| servir conteúdo protegido | identificador e senha | corpo servido e atestado gravado no navegador | senha errada, que devolve o formulário e mantém o corpo oculto |
| expandir macro textual | corpo | corpo com as macros registradas expandidas | macro não registrada, que permanece literal no corpo |

O contrato de paginação é mais rígido do que parece: pedir página acima do total não
devolve lista vazia, devolve resposta de endereço inexistente, e isso é observável por
buscador.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). As regras de tradução de endereço nascem com
a forma padrão da instalação nova e são reconstruídas na primeira mudança.

A exceção é o terceiro critério do card de descarte REQ-046, que exige que a migração
declare o que fazer com as linhas existentes na tabela de links, se houver. Enquanto o
conflito daquele descarte não for resolvido, essa declaração não existe.

## Sequência

Depende de 001, por autorização, e é dependência de 007 (o comentário chega por um
endereço público e depende do estado do conteúdo), de 009 (a apresentação vem do tema) e
de 013 (feeds e mapa do site saem da mesma consulta pública).

Ordem interna: a resolução de endereço (REQ-038) antes da escolha da apresentação
(REQ-039) e da paginação (REQ-040); a restrição de leitura (REQ-041) antes da senha de
conteúdo (REQ-043).

## Riscos

1. **A hierarquia de modelos depende do tema**, que está na feature 009. Sem tema de
   referência, a paridade de REQ-039 não é verificável.
2. **A pré-busca do próximo destino** tem metade do comportamento fora da árvore
   analisada.
3. **O atestado de senha é um dos cinco mecanismos de autorização que não consultam
   capacidade.** Um porte que o trate como sessão herda um prazo que o legado não tem.
4. **A expansão de macro textual acontece na renderização**, e o corpo gravado continua
   com a macro. Expandir na gravação é mais rápido e muda o que fica gravado.
5. **O isolamento de requisição** é a decisão de arquitetura mais caprichosa desta
   feature: o legado monta e descarta todo o estado global por requisição, e o slot
   correspondente existe porque reproduzir esse descarte num processo longevo não é
   automático.
