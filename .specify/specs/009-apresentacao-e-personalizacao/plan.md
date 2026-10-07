# Plano — Apresentação e personalização

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


### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Serialização do valor persistido (`serializacao-de-valor-persistido`)

Não é slot de infraestrutura, é slot de formato de dado, e é obrigatório porque o formato está DENTRO das colunas: `options.option_value`, `postmeta.meta_value`, `usermeta.meta_value` e `signups.meta` guardam valor serializado pelo formato nativo do PHP quando não é escalar (`erd-complete.md`, linhas 127, 276, 281 e 352), com 21 `maybe_serialize`, 17 `maybe_unserialize` e 9 `is_serialized` na árvore. `erd-complete.md` diz a consequência em uma linha: 'uma migração que normalize permissões precisa parsear PHP serializado, não SQL'. Em TypeScript esse formato não existe, e a Pergunta 2 fixa que a cascata observável não pode mudar.

| candidato | o que é | situação |
|---|---|---|
| `implementacao-propria` | Implementação própria do formato, com suíte de conformidade | **recomendado pela pesquisa** |
| `biblioteca-de-terceiro` | Biblioteca de serialização PHP para JavaScript | candidato |
| `json-no-lugar` | Trocar o formato por JSON no armazenamento | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O formato é pequeno e fechado, a conformidade tem de ser provada byte a byte contra o oráculo da Pergunta 16 de qualquer forma, e nenhuma biblioteca escolhida sem acesso à rede dispensa essa prova.

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

### Entrega, empacotamento e autoatualização (`entrega`)

`deployment.md` §1 registra o achado: não existe Dockerfile, docker-compose nem configuração de nuvem nesta árvore, e a AUSÊNCIA é o achado, porque o pipeline de implantação deste produto É o painel administrativo — UC-33 instala extensão e UC-34 atualiza o núcleo, descompactando pacote e escrevendo no disco por `WP_Filesystem`, com `downloads.wordpress.org` como integração de criticidade alta. Num porte para TypeScript isso vira uma pergunta que o legado nunca teve de responder: o que é entregue, fonte ou compilado? É a decisão que amarra os slots `runtime` e `isolamento-de-requisicao`.

| candidato | o que é | situação |
|---|---|---|
| `javascript-compilado` | Compilado para JavaScript, um arquivo por módulo | **recomendado pela pesquisa** |
| `fonte-typescript` | Fonte TypeScript executado pelo runtime | candidato |
| `pacote-unico` | Pacote único por empacotador | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única forma de entrega que não aposta a distribuição do produto num recurso de runtime ainda em movimento, e o que ela custa — mapa de origem no produto e extensão de terceiro possivelmente pré-compilada — é divergência nomeável, não risco de execução.

## Modelo de dados

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| conjunto de alterações de aparência | registro de conteúdo de tipo próprio, com os valores alterados serializados | continua sendo conteúdo, e é isso que lhe dá autor, data, revisão e **agendamento** sem nada escrito para ele |
| estilos globais | outro registro de conteúdo de tipo próprio | idem |
| menu de navegação | é um **contexto de classificação** (feature 003), e cada item do menu é um registro de conteúdo. A hierarquia do item **não** usa a coluna de pai do conteúdo: ela vive em metadado | é a modelagem mais surpreendente do produto, e mudá-la muda o que uma extensão de menu lê |
| componentes de área | configuração serializada, com o mapa de área para lista de componentes | continua em configuração, e a preservação na troca de tema depende de guardar o mapa do tema anterior |
| configuração declarada pelo tema | arquivo no tema, lido como dado | continua sendo dado do tema, não código do núcleo |

O que esta feature tem de mais difícil não é modelo, é topologia: os três módulos que a
servem (personalização, menus e componentes de área) formam um ciclo entre si no grafo
medido, e por isso não existe ordem de migração interna entre eles.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| pré-visualizar | conjunto de alterações | a página como ficaria, sem efeito para o visitante | sem permissão de personalizar |
| salvar alterações | valores | conjunto gravado, **sem** aplicar | sem permissão de salvar |
| aplicar | identificador do conjunto | alterações em vigor para o visitante | sem permissão de aplicar, que é **separada** da de salvar |
| agendar aplicação | identificador e instante | conjunto agendado | instante no passado |
| montar menu | itens com destino (conteúdo, classificação ou endereço externo) | menu gravado com a hierarquia | destino inexistente |
| sinalizar item órfão | nenhuma | lista de itens cujo destino não existe mais | nenhum |
| trocar tema | identificador do tema | tema ativo, com a configuração de componentes preservada | tema inválido ou incompatível, caso em que vale o tema de reserva |
| enfileirar recurso de interface | identificador, dependências, versão | ordem de carga resolvida | dependência não registrada, ciclo de dependência |
| resolver estilos declarados | configuração do tema | folha de estilo | configuração inválida |

A separação entre salvar e aplicar é o contrato central da feature: é ele que impede
publicar aparência sem querer.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). O tema padrão da instalação nova é ativado
como o instalador do legado ativa, e nenhum conjunto de alterações existe.

Uma observação de escopo: os três temas empacotados estão na árvore analisada, mas
nenhuma resposta humana disse qual é o tema de referência do porte. Ver a pergunta em
aberto da spec.

## Sequência

Depende de 001 (autorização), 002 (o conjunto de alterações é conteúdo e herda estado e
agendamento), 003 (o menu é contexto de classificação), 004 (a apresentação pública usa a
hierarquia de modelos) e 014 (os estilos de editor remotos e a rede de distribuição de
onde vêm recursos).

Ordem interna: os três módulos em ciclo entram juntos (tarefa T001 de
[`tasks.md`](tasks.md)); depois pré-visualização (REQ-096), separação de permissão
(REQ-097) e relato do estado gravado (REQ-098); menu (REQ-100, REQ-101) e componentes de
área (REQ-102, REQ-103) em paralelo; troca de tema (REQ-104) e tema de reserva (REQ-105);
recursos de interface (REQ-172, REQ-173) e biblioteca de fontes e ícones (REQ-174,
REQ-175) por último, porque dependem de código fora da árvore.

## Riscos

1. **Cinco das quinze histórias dependem de código que não está na árvore analisada**
   (lacuna L4). Sem o fonte do repositório de origem, elas não têm oráculo.
2. **O ciclo entre os três módulos** impede ordem interna: estimar as três partes
   separadamente subestima o trabalho.
3. **A hierarquia do item de menu vive em metadado**, não na coluna de pai. Um porte que
   "corrija" isso muda o que extensão de menu lê.
4. **O agendamento da aplicação depende da fila** (feature 011), que tem conflito aberto.
5. **A troca de tema precisa preservar a configuração de componentes**, e isso exige
   guardar o mapa do tema anterior. É a parte que mais quebra em porte, porque só aparece
   na segunda troca de tema.
