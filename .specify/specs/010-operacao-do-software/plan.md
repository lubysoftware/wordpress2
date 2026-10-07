# Plano — Operação do próprio software

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


### Sistema de arquivos e escrita remota (`sistema-de-arquivos`)

Terceira porta do plano escolhido, e o módulo mais denso do levantamento: `WP_Filesystem` com 5 arquivos — base e 4 implementações (`direct`, `ftpext`, `ftpsockets`, `ssh2`) — e 54 regras de negócio registradas. É por aqui que o produto escreve código executável no disco (UC-33, UC-34). `technologies.json` propõe reduzir a só o driver `direct`, e esta etapa NÃO pode fazer isso: o diálogo de coleta de credencial é tela do produto, protegida por nonce `filesystem-credentials`, e a opção `ftp_credentials` grava host e usuário removendo senha e chaves antes (`wp-admin/includes/file.php:2495-2503`).

| candidato | o que é | situação |
|---|---|---|
| `fs-mais-ssh2-e-ftp` | Sistema de arquivos do runtime, com biblioteca de SSH2 e de FTP | **recomendado pela pesquisa** |
| `so-direct` | Só o driver direct, exigindo permissão de escrita | candidato |
| `cliente-do-sistema` | Delegar a cliente do sistema (sftp, ftp) | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato que mantém os quatro caminhos que a tela de credencial do produto oferece, e reduzir para um é mudança observável que nenhuma das 23 respostas autoriza.

### Cliente HTTP de saída (`cliente-http`)

Primeira porta do plano escolhido, por decisão registrada em `architectures.json`: é a única das cinco cujo contrato já está escrito em padrão externo — o adaptador PSR-18 vendorizado em `wp-includes/php-ai-client/` — e a única em que a Pergunta 18 abriu exceção explícita ao idêntico, o que faz a primeira porta nascer com um caso de teste de verdade. São 37 módulos dependentes, 29 integrações e 64 endpoints. O que esta porta tem de reproduzir é um conjunto de comportamentos que todo cliente HTTP moderno trata como erro de configuração.

| candidato | o que é | situação |
|---|---|---|
| `undici` | undici | **recomendado pela pesquisa** |
| `http-do-runtime` | Cliente HTTP cru do runtime | candidato |
| `cliente-de-alto-nivel` | Cliente de alto nível com política embutida | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a primeira porta a nascer e precisa reproduzir requisição não bloqueante, TLS não verificado e repetição em claro sem lutar contra a biblioteca — e undici dá controle de agente e de TLS por requisição sem obrigar o produto a reimplementar pool e redirecionamento.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

### Entrega, empacotamento e autoatualização (`entrega`)

`deployment.md` §1 registra o achado: não existe Dockerfile, docker-compose nem configuração de nuvem nesta árvore, e a AUSÊNCIA é o achado, porque o pipeline de implantação deste produto É o painel administrativo — UC-33 instala extensão e UC-34 atualiza o núcleo, descompactando pacote e escrevendo no disco por `WP_Filesystem`, com `downloads.wordpress.org` como integração de criticidade alta. Num porte para TypeScript isso vira uma pergunta que o legado nunca teve de responder: o que é entregue, fonte ou compilado? É a decisão que amarra os slots `runtime` e `isolamento-de-requisicao`.

| candidato | o que é | situação |
|---|---|---|
| `javascript-compilado` | Compilado para JavaScript, um arquivo por módulo | **recomendado pela pesquisa** |
| `fonte-typescript` | Fonte TypeScript executado pelo runtime | candidato |
| `pacote-unico` | Pacote único por empacotador | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única forma de entrega que não aposta a distribuição do produto num recurso de runtime ainda em movimento, e o que ela custa — mapa de origem no produto e extensão de terceiro possivelmente pré-compilada — é divergência nomeável, não risco de execução.

## Modelo de dados

Esta feature guarda pouco e escreve muito: o que ela modela é **estado de operação**,
quase todo em configuração nomeada.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| estado de falha da atualização automática | a opção que registra a falha, com a marca de crítica | continua sendo o **único** histórico persistente de falha do sistema inteiro. Com a marca de crítica, a automação passa a recusar tudo até intervenção humana |
| política de atualização | opções e constantes: correção e manutenção ligadas de fábrica, versão principal nascendo sem escolha, constante vencendo opção, falso desligando tudo, e ponto de extensão podendo reverter a decisão | a precedência é contrato: constante, depois opção, depois ponto de extensão |
| versão do esquema | número gravado, comparado no arranque | continua: é o que dispara a migração de esquema |
| sessão de modo de recuperação | chave com resumo criptográfico, cookie de uma semana, e marcador de aviso diário gravado **antes** do envio | o marcador antes do envio é regra: falhar na gravação aborta o aviso. E a chave é **consumida antes de ser verificada** (ADR 0007), que é o que REQ-118 propõe mudar |
| marcador de manutenção | arquivo no sistema de arquivos, não registro no banco | continua no sistema de arquivos, porque precisa valer mesmo com o banco em migração |
| extensões pausadas | registro das que derrubaram o site | sair do modo de recuperação retoma **todas** de uma vez e zera o limite de aviso |

A porta de sistema de arquivos tem quatro implementações no legado (uma direta e três
remotas) porque a atualização precisa escrever no próprio diretório do produto em
execução. Isso é a decisão fundadora D7 e não é removível sem mudar o produto.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| instalar ou atualizar extensão | origem (catálogo ou arquivo enviado) | extensão instalada, com a anterior intacta em caso de aborto | pacote inválido, ambiente incompatível (com motivo), falha de credencial de sistema de arquivos, diretório sob controle de versão |
| verificar autenticidade do pacote | pacote e chaves confiáveis | veredito | **ver o conflito registrado na spec**: no legado a lista de chaves é vazia e a falha é rebaixada a aviso |
| recusar atualização incompatível | versão oferecida e ambiente | recusa com motivo legível | nenhum |
| pôr em manutenção | escopo afetado | marcador criado | falha de escrita |
| abortar atualização | estado parcial | destino restaurado | falha de restauração, que é a falha crítica que congela a automação |
| atualizar o núcleo | versão | núcleo atualizado e esquema migrado | as mesmas acima |
| migrar esquema | versão de origem e destino | esquema migrado, com histórico das migrações aplicadas | migração que falha no meio |
| atualizar automaticamente | política | atualização aplicada ou recusada com motivo | falha transitória (exatamente **uma** segunda chance, em uma hora, sem notificar), falha crítica (congela) |
| avisar o responsável | evento e destinatário | aviso enviado uma única vez por par de destinatário e versão | falha de envio |
| destravar a automação congelada | decisão do ator | automação liberada | invariante não declarada entre dois arquivos: ver o risco 5 |
| entrar em modo de recuperação | erro fatal em área protegida | sessão de recuperação e aviso diário | erro em endpoint público (não aciona), erro causado por extensão de rede (fora de escopo) |
| diagnosticar | nenhuma | bateria de testes com severidade, com o teste de requisição de volta em primeiro lugar | nenhum |

## Migração de dados

**Nada vem do sistema velho** (resposta 2): a instalação é nova, o esquema é criado do
zero e o histórico de migrações nasce com a versão inicial.

O que esta feature precisa declarar, e é a parte que falta no pacote, é o caminho pelo
qual uma instalação legada entraria no sistema novo: REQ-120, que especificaria o formato
de intercâmbio de conteúdo, ficou `bloqueado`. Sem ele, o porte sabe migrar o próprio
esquema e não sabe importar um site existente.

## Sequência

Depende de 001 (autorização) e de 011 (a verificação de atualização e a atualização
automática são trabalho agendado). É dependência de 014, que concentra as chamadas de
saída usadas aqui.

Ordem interna: a instalação de extensão (REQ-106) abre a feature, porque é o caminho mais
curto que exercita pacote, sistema de arquivos e aborto; a verificação de compatibilidade
(REQ-108), a manutenção por escopo (REQ-109) e o aborto (REQ-110) vêm juntas; a migração
de esquema (REQ-112) antes da atualização do núcleo (REQ-111); a automação (REQ-113,
REQ-114, REQ-115, REQ-116) depois; o modo de recuperação (REQ-117, REQ-118) e o
diagnóstico (REQ-119) fecham.

## Riscos

1. **O conflito de REQ-107 com a resposta 11** é o mais consequente do pacote: a história
   é obrigatória e a resposta humana manda manter a tolerância. Nada aqui começa antes de
   alguém decidir.
2. **O sistema sobrescreve os próprios arquivos em execução.** Qualquer destino que trate
   o código como imutável colide de frente com esta feature, e a decisão precisa ser
   tomada antes, não depois.
3. **A implementação remota de sistema de arquivos é de primeira classe** no legado, e em
   2026 é vetor que qualquer revisão de segurança marca. Removê-la, porém, é remover
   superfície publicada (P8).
4. **O desenho de falha tem quatro caminhos distintos** (transitória com segunda chance,
   crítica que congela, aviso não repetido, aborto com restauração) e é a parte que um
   porte simplifica sem perceber.
5. **O destravamento depende de uma invariante não declarada entre dois arquivos.**
   Reproduzi-lo exige ler o legado caso a caso: nenhum artefato desta análise a escreve.
