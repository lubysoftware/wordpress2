# Plano — Superfícies programáticas

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

### XML: XML-RPC, feeds e sitemap (`xml`)

A Pergunta 14 manteve o XML-RPC no escopo com todo o comportamento atual, inclusive o `pingback`, e `technologies.json` classifica a biblioteca que o implementa como `abandonada` E `estrutural`: IXR, sem versão declarada em lugar algum, fundida ao servidor em 390 referências em 15 arquivos. Somam-se os feeds RSS e Atom, o sitemap, o OPML e o oEmbed. O legado analisa XML com `xml_parser_create` (expat) em 6 arquivos — `wp-includes/rss.php:70`, `feed.php:599`, `atomlib.php:159`, `IXR/class-IXR-message.php:92` entre eles — e PRODUZ XML por template literal, não por serializador (`wp-includes/feed-rss2.php`).

| candidato | o que é | situação |
|---|---|---|
| `sax` | Analisador SAX de eventos | **recomendado pela pesquisa** |
| `arvore-em-objeto` | Analisador de XML para objeto | candidato |
| `expat-nativo` | Binding nativo do mesmo expat | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a mesma forma do legado — analisador de eventos com manipulador de início, fim e caractere —, logo portar é tradução e não redesenho; o binding nativo do mesmo expat é equivalente para este caso e só difere por exigir compilação.

### Análise e sanitização de HTML (`analise-de-html`)

`html-api` é uma das DUAS raízes do grafo de dependência de todo o sistema (`architecture-graph.json`), e `kses-e-sanitizacao` está no núcleo crítico, com 11 ou mais dependentes diretos. São 16.590 linhas em 14 arquivos de `wp-includes/html-api/` mais 3.159 de `wp-includes/kses.php`, e as duas fazem trabalhos diferentes que um projeto novo confundiria: a primeira é um tokenizador que persegue a especificação do HTML5 e EDITA a string no lugar; a segunda é a lista de permissão que decide o que cada papel pode publicar — `permissions.md` registra que `editor` tem `unfiltered_html`.

| candidato | o que é | situação |
|---|---|---|
| `porte-a-mao` | Porte à mão das duas, com a tabela de referências de caracteres | **recomendado pela pesquisa** |
| `tokenizador-de-terceiro` | Tokenizador de terceiro conforme a especificação | candidato |
| `sanitizador-de-terceiro` | Sanitizador de terceiro por lista de permissão | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que parece substituível, o tokenizador, é um editor de string que nenhum analisador de árvore reproduz sem reescrever o `post_content`; e a outra metade, KSES, é fronteira de autorização, não higiene de HTML.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Observabilidade (`observabilidade`)

REQ-159 é `must` e está `pronto`: todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto, estruturado e consultável, sem depender de modo de depuração, com verificação automatizada que falha ao encontrar tratamento de erro silencioso. A linha de base é 0 arquivos de log na árvore, 49 chamadas `error_log` e um único histórico persistente de falha: a opção `auto_core_update_failed`. E é pré-requisito da arquitetura escolhida pelo mesmo motivo do slot anterior — adaptador troca modo de falha, e sem registro a troca é invisível.

| candidato | o que é | situação |
|---|---|---|
| `registro-estruturado` | Registro estruturado em linha JSON | **recomendado pela pesquisa** |
| `escritor-proprio` | Escritor próprio sobre a saída de erro do runtime | candidato |
| `opentelemetry` | OpenTelemetry | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** REQ-159 AC2 e AC3 juntos pedem registro estruturado COM redação de campo sensível, e redação embutida é a diferença entre cumprir o critério e abrir o vazamento que `integrations.json` já documenta em outro canal.

## Modelo de dados

Esta feature é quase toda contrato e quase nada armazenamento.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| registro de rotas | em memória, povoado por ponto de extensão no arranque: cada módulo e cada extensão registra as suas rotas, com esquema de argumentos e declaração de permissão | continua sendo ponto de extensão, logo é produto (P2). A declaração de permissão **não** é obrigatória no legado: rota sem ela funciona |
| registro de operações nomeadas | idem, com declaração de permissão **obrigatória** e descrição por esquema | cinco operações estão registradas na árvore analisada, três do núcleo e duas da extensão empacotada |
| cache de representação embutível | é um **registro de conteúdo** de tipo próprio | continua sendo conteúdo: outro caso em que o discriminador de tipo economizou uma tabela |
| mapa do site e feeds | não têm armazenamento: saem da mesma consulta pública da feature 004 | sem mudança. É o que garante que conteúdo protegido por senha continue listado |
| registro de acesso | **não existe** no legado | REQ-141 o cria, com a mesma ressalva de P7 e da resposta 20 sobre prazo de retenção |

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| despachar requisição de programa | rota, método, argumentos, identidade | resposta no esquema declarado da rota | rota inexistente, argumento fora do esquema, permissão recusada, e o caso incômodo: rota **sem** declaração de permissão, que no legado funciona e só emite aviso de uso indevido |
| validar e sanitizar argumento | esquema e valor | valor sanitizado | valor fora do esquema, com mensagem que nomeia o argumento |
| publicar o mapa da superfície | nenhuma | descrição das rotas e dos esquemas | nenhum |
| exigir token adicional | identidade vinda de sessão de navegador | requisição aceita | token ausente ou vencido, quando a identidade vem de sessão e não de credencial própria |
| executar operação nomeada | identificador, insumo | saída validada contra o esquema | permissão recusada (falha **fechada**: ausência de declaração é erro, não liberação), insumo inválido, e o curto-circuito, que contorna normalização, validação, permissão e execução |
| servir mapa do site | nenhuma | índice e páginas, conforme a opção de indexação | indexação desligada, que é resposta de endereço inexistente |
| servir feed | tipo e critérios | feed de conteúdo ou de comentários | nenhum |
| servir representação embutível | endereço do próprio site | representação, com cache em conteúdo | endereço de outro site |

A assimetria entre as duas camadas é o fato mais importante desta seção: uma falha aberta
e a outra fechada, e a fechada é filtrável **para conceder**.

## Migração de dados

**Nada vem do sistema velho** (resposta 2): o cache de representação embutível nasce vazio
e o registro de acesso também.

A superfície herdada com credencial no corpo da chamada e o canal assíncrono do painel
estão na seção Fora de escopo da spec, em conflito aberto com a resposta 14. Se o conflito
for decidido para o lado da resposta, as duas voltam a ser contrato desta feature e
precisam de spec própria, que este pacote não tem.

## Sequência

Depende de 004 (a consulta pública que alimenta feeds e mapa do site), 007 (a superfície
de comentário) e 015 (sanitização, formatação e registro). Precisa de dois cards que não
entraram: REQ-012, que autenticaria chamada não interativa, e REQ-138, que exigiria
declaração de permissão em toda rota.

Ordem interna: o despacho por rota (REQ-137) antes da validação por esquema (REQ-139) e do
mapa da superfície (REQ-140); o registro de acesso (REQ-141) e o token adicional (REQ-142)
depois; operação nomeada (REQ-143), mapa do site (REQ-145), feeds (REQ-146) e representação
embutível (REQ-147) podem seguir em paralelo.

## Riscos

1. **A camada de rotas falha aberta.** Portar isso é portar uma brecha conhecida; fechá-la
   é divergir sem card que autorize, porque REQ-138 ficou fora.
2. **O curto-circuito da operação nomeada** contorna toda a validação, com aviso no
   próprio código do legado. Portar ou não é decisão que a spec cobra.
3. **O slot de XML cobre três formatos diferentes** (feeds, mapa do site e a superfície
   herdada), e a escolha de analisador afeta os três.
4. **Nenhuma superfície de entrada tem limite de taxa** (resposta 19), e esta feature é a
   que mais superfície expõe.
5. **O conflito dos dois descartes** com a resposta 14 muda o tamanho da feature: com
   eles, são duas superfícies de escrita a mais para portar e defender.
