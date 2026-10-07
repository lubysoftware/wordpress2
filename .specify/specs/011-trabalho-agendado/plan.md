# Plano — Trabalho agendado

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


### Isolamento de estado por requisição (`isolamento-de-requisicao`)

O legado não tem isolamento: tem descarte. `architecture.md` registra que nenhuma fronteira de processo existe em todo o nível 2 do C4 — um processo PHP por requisição, montado por `wp-settings.php` e descartado no fim da resposta. É esse descarte que torna seguras as 1.121 declarações `global $x` em 230 arquivos, os 3.411 usos de superglobal e as 94 chamadas `exit`/`die`. Em processo longevo nada disso é seguro, e o vazamento de estado entre requisições não aparece em teste de unidade: aparece como uma pessoa vendo o painel de outra. É o slot em que este porte quebra, e não há candidato óbvio.

| candidato | o que é | situação |
|---|---|---|
| `processo-por-requisicao` | Processo por requisição (modelo CGI) | **recomendado pela pesquisa** |
| `contexto-assincrono` | Contexto por requisição em processo longevo (AsyncLocalStorage) | candidato |
| `worker-por-requisicao` | Worker isolado por requisição | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato em que a equivalência observável é por construção e não por disciplina — e com 1.121 pontos de estado global, zero arquivo de teste no legado e 'idêntico' como critério de aceite, a escolha de desempenho pode ser revista depois com número medido; a de correção, não.

### Cliente HTTP de saída (`cliente-http`)

Primeira porta do plano escolhido, por decisão registrada em `architectures.json`: é a única das cinco cujo contrato já está escrito em padrão externo — o adaptador PSR-18 vendorizado em `wp-includes/php-ai-client/` — e a única em que a Pergunta 18 abriu exceção explícita ao idêntico, o que faz a primeira porta nascer com um caso de teste de verdade. São 37 módulos dependentes, 29 integrações e 64 endpoints. O que esta porta tem de reproduzir é um conjunto de comportamentos que todo cliente HTTP moderno trata como erro de configuração.

| candidato | o que é | situação |
|---|---|---|
| `undici` | undici | **recomendado pela pesquisa** |
| `http-do-runtime` | Cliente HTTP cru do runtime | candidato |
| `cliente-de-alto-nivel` | Cliente de alto nível com política embutida | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a primeira porta a nascer e precisa reproduzir requisição não bloqueante, TLS não verificado e repetição em claro sem lutar contra a biblioteca — e undici dá controle de agente e de TLS por requisição sem obrigar o produto a reimplementar pool e redirecionamento.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

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

> **Leia antes:** três das seis histórias desta feature estão em conflito aberto com a
> resposta 10 de `questions.md`. O modelo abaixo descreve o que o legado tem, porque é
> isso que não está em disputa. O que o modelo novo terá depende da decisão que a spec
> cobra.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| a fila | **uma única linha** de configuração, com um arranjo serializado indexado por instante, e dentro de cada instante os eventos, os argumentos e a recorrência | é o ponto mais frágil do desenho: toda a fila é um valor só, lido e regravado inteiro. Um modelo com uma linha por evento é melhor e muda o que uma extensão que leia a opção enxerga |
| a trava | um valor transitório de 60 segundos, **descartado** se tiver mais de 10 minutos | não é trava de verdade: é marcação otimista com prazo. REQ-123 pede exclusão real, e isso é melhoria sobre o legado |
| o gatilho | uma requisição que o site faz para si mesmo, não bloqueante, com tempo limite de um centésimo de segundo e sem verificar certificado | é o centro do conflito. A resposta 10 manda preservar, inclusive a invisibilidade da falha |
| o desligamento | uma declaração de configuração que desliga o **disparo** e não a fila | é regra, e REQ-127 existe para declará-la: evento continua sendo agendado e acumulado, só não executa |
| registro de execução | **não existe** | REQ-124 o cria. Ver o conflito registrado na spec |

O protocolo da requisição ao próprio site está implementado **quatro vezes** na árvore
analisada, com a duplicação admitida em comentário no próprio código.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| agendar evento | identificador do evento, instante, argumentos, recorrência opcional | evento na fila | evento idêntico já agendado para o mesmo instante |
| desagendar | identificador e argumentos | evento removido | evento inexistente |
| listar a fila | filtros | eventos pendentes, com instante e recorrência | nenhum |
| avançar a fila | gatilho | eventos vencidos executados, um a um | trava tomada por outro processo, caso em que a chamada volta sem fazer nada |
| reagendar recorrente | evento | evento retirado da fila **antes** de executar e reagendado | nenhum: a ordem importa, porque falha na execução não pode perder a recorrência |
| relatar falha do gatilho | nenhuma | falha com instante e motivo, visível no diagnóstico | nenhum |

A operação de avançar a fila tem um contrato que o legado cumpre e quase ninguém nota:
ela é chamada por requisição qualquer, de qualquer visitante, e precisa ser inofensiva
quando não há nada a fazer.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). A fila nasce com os eventos que a instalação
nova registra, e aqui há uma assimetria que vale repetir, porque ela decide o
comportamento do produto: a varredura do arquivo de exportação de dado pessoal é
registrada no arranque e existe sempre; a coleta da lixeira é registrada **depois** da
verificação de acesso ao painel, logo só existe num site que alguém administra.

## Sequência

Depende de 015 (o registro estruturado e a camada de dados). É dependência de 002
(publicação agendada), 005 (coleta da lixeira), 007 (descarte do spam vencido), 008
(expiração e varredura), 009 (aplicação agendada de aparência) e 010 (verificação e
atualização automática). Seis das quinze features esperam por ela, o que faz desta a
feature mais urgente de decidir e a mais arriscada de começar.

Ordem interna: **os cinco outros cards desta feature declaram dependência de REQ-122**,
que é justamente o card em conflito. Não existe, pelo backlog, nenhuma história daqui que
comece antes de a decisão ser tomada, e por isso a advertência está no alto de
[`tasks.md`](tasks.md) e não só nesta seção. A trava de concorrência (REQ-123) é a parte
que sobrevive aos dois lados da decisão, mas quem quiser começar por ela precisa primeiro
soltar a dependência que o card declara, e isso é mudança na seleção, não neste pacote.

## Riscos

1. **O conflito com a resposta 10 é o risco principal do pacote inteiro**, porque seis
   features dependem desta e o resultado muda o comportamento de todas elas.
2. **A fila é uma linha só de configuração.** Dois processos que a leiam e regravem ao
   mesmo tempo perdem evento, e é exatamente o que a trava fraca do legado não impede.
3. **A trava não é trava.** Construir exclusão real é melhoria, e melhoria é divergência:
   um evento que hoje roda duas vezes passa a rodar uma, e isso é observável.
4. **O gatilho não bloqueante não dá sinal.** Qualquer implementação que espere resposta
   muda o tempo da requisição do visitante, que é justamente o que o desenho do legado
   evita.
5. **Num porte não há mensageria a migrar: há uma a construir**, e a resposta humana foi
   não construir. Estimar esta feature como "porte de agendador" subestima o trabalho se
   o conflito for decidido para o lado do card, e superestima se for para o lado da
   resposta.
