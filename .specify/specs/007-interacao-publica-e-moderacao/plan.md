# Plano — Interação pública e moderação

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

### Análise e sanitização de HTML (`analise-de-html`)

`html-api` é uma das DUAS raízes do grafo de dependência de todo o sistema (`architecture-graph.json`), e `kses-e-sanitizacao` está no núcleo crítico, com 11 ou mais dependentes diretos. São 16.590 linhas em 14 arquivos de `wp-includes/html-api/` mais 3.159 de `wp-includes/kses.php`, e as duas fazem trabalhos diferentes que um projeto novo confundiria: a primeira é um tokenizador que persegue a especificação do HTML5 e EDITA a string no lugar; a segunda é a lista de permissão que decide o que cada papel pode publicar — `permissions.md` registra que `editor` tem `unfiltered_html`.

| candidato | o que é | situação |
|---|---|---|
| `porte-a-mao` | Porte à mão das duas, com a tabela de referências de caracteres | **recomendado pela pesquisa** |
| `tokenizador-de-terceiro` | Tokenizador de terceiro conforme a especificação | candidato |
| `sanitizador-de-terceiro` | Sanitizador de terceiro por lista de permissão | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que parece substituível, o tokenizador, é um editor de string que nenhum analisador de árvore reproduz sem reescrever o `post_content`; e a outra metade, KSES, é fronteira de autorização, não higiene de HTML.

### Cliente HTTP de saída (`cliente-http`)

Primeira porta do plano escolhido, por decisão registrada em `architectures.json`: é a única das cinco cujo contrato já está escrito em padrão externo — o adaptador PSR-18 vendorizado em `wp-includes/php-ai-client/` — e a única em que a Pergunta 18 abriu exceção explícita ao idêntico, o que faz a primeira porta nascer com um caso de teste de verdade. São 37 módulos dependentes, 29 integrações e 64 endpoints. O que esta porta tem de reproduzir é um conjunto de comportamentos que todo cliente HTTP moderno trata como erro de configuração.

| candidato | o que é | situação |
|---|---|---|
| `undici` | undici | **recomendado pela pesquisa** |
| `http-do-runtime` | Cliente HTTP cru do runtime | candidato |
| `cliente-de-alto-nivel` | Cliente de alto nível com política embutida | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a primeira porta a nascer e precisa reproduzir requisição não bloqueante, TLS não verificado e repetição em claro sem lutar contra a biblioteca — e undici dá controle de agente e de TLS por requisição sem obrigar o produto a reimplementar pool e redirecionamento.

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

## Modelo de dados

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| `comments` | a interação: autor, e-mail, endereço, **endereço de origem da requisição** (que é dado pessoal, exportado e anonimizado pela feature 008), data, corpo sanitizado na escrita, a coluna de aprovação, o agente, o tipo e o pai da thread. O vínculo com conta é opcional, e o valor zero é anônimo legítimo | a coluna de aprovação **mistura booleano e enumeração**: aprovado, na fila, spam, lixeira e "conteúdo na lixeira". O modelo novo precisa dos cinco valores, porque o último é o que permite restaurar o conteúdo e devolver cada comentário ao estado anterior |
| `commentmeta` | metadado, incluindo o estado anterior ao descarte | sem mudança |
| contador no conteúdo | contagem desnormalizada que **exclui** a nota editorial | continua desnormalizada e continua podendo divergir, porque a atualização é suspensa durante lote |
| configuração de moderação | moderação manual, limite de links (2 de fábrica), palavras de moderação, lista de proibição, exigência de autor já aprovado (ligada de fábrica), prazo de fechamento automático (14 dias) | continuam pontos de configuração nomeados, com os valores de fábrica. Cada um deles é uma etapa da cascata |

A nota editorial é o tipo mais atípico: exige login, é excluída da contagem, é autorizada
pela capacidade de editar o conteúdo e não pela de moderar, só aceita tipos de conteúdo
que declarem suporte, e apagar a nota raiz arrasta as respostas.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| submeter comentário | conteúdo, autor, e-mail, corpo, pai opcional | comentário gravado com o estado que a cascata decidiu | duplicata (recusa com código próprio, **não** moderação), vazão excedida na última hora, campo acima do limite da coluna (erro, não truncamento), interação fechada, senha de conteúdo não informada, pai não aprovado |
| decidir o estado inicial | comentário submetido | estado: aprovado, na fila, spam ou lixeira | nenhum: a cascata sempre decide |
| moderar | identificador e estado alvo | transição aplicada, com ponto de extensão por transição | transição inválida, sem permissão de moderar |
| descartar para a lixeira | identificador | estado de lixeira com o anterior gravado | sem permissão |
| registrar nota editorial | conteúdo, corpo | nota gravada, fora da contagem | sem login, tipo de conteúdo sem suporte declarado, sem permissão de editar o conteúdo |
| receber notificação de link | origem e destino | interação do tipo de notificação, aprovada só quando a origem é do próprio site e está publicada | origem não verificável, destino inexistente |
| classificar por serviço externo | comentário | veredito do serviço | serviço indisponível, caso em que a decisão volta às regras locais |
| apagar spam vencido | nenhuma (gatilho agendado) | contagem apagada, em lotes | nenhum |

A **ordem** da cascata é contrato, e cada etapa pode encerrar a decisão: moderação manual
vence tudo; o atalho de confiança do autor do conteúdo e de quem modera entra aprovado
sem passar por verificação alguma; depois vêm lista de proibição, palavras de moderação,
contagem de links e autor já aprovado.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). A instalação nova cria o comentário de exemplo
que o instalador do legado cria.

Para migração futura, duas advertências do ERD: comentário órfão é **estado normal**,
porque apagar uma conta não toca nos comentários dela, que ficam apontando para conta
inexistente para preservar o histórico da discussão; e um modelo com restrição obrigatória
precisaria de conta sintética ou coluna opcional, decisão que muda o que acontece com os
campos de autor duplicados na própria linha.

## Sequência

Depende de 001 (autorização e o atalho de confiança), de 004 (o comentário chega por
endereço público e depende do estado e da senha do conteúdo), de 005 (a lixeira do
comentário segue a do conteúdo) e de 011 (o descarte do spam vencido é agendado).

Ordem interna: recebimento (REQ-065), recusa de duplicata (REQ-066) e limite de vazão
(REQ-067) antes da cascata (REQ-068), que é a história central; depois os limites de campo
(REQ-070), o fechamento automático (REQ-071), o encadeamento (REQ-072) e os motivos de
recusa (REQ-073); moderação (REQ-075), lixeira (REQ-076) e contador (REQ-077) formam o
segundo bloco; nota editorial (REQ-079), notificação de link (REQ-080) e serviço externo
(REQ-082, REQ-083) o terceiro.

## Riscos

1. **A ordem da cascata é a regra, e ela não é óbvia.** Treze regras, com encerramento
   antecipado em várias delas. REQ-163 (feature 015) existe em boa parte por causa deste
   ponto, e exige teste para cada etapa **e para a ordem entre elas**.
2. **O atalho de confiança somado ao privilégio de marcação bruta** permite ao autor
   inserir qualquer marcação num comentário do próprio conteúdo, e o papel de editor tem
   esse privilégio. REQ-069, que decidiria a sanitização desse caminho, ficou fora.
3. **O conflito de escopo do serviço externo de reputação** (pergunta em aberto da spec):
   a resposta 13 o põe fora do núcleo clonado.
4. **A busca por palavra de moderação varre seis campos, inclusive endereço de origem e
   agente**, como expressão regular linha a linha. É custo por comentário e é
   comportamento observável.
5. **O fechamento automático acontece em memória** e não muda o armazenamento. Um porte
   que o persista muda o que uma extensão lê.
