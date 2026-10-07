# Plano — Privacidade e dados pessoais

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

### Sistema de arquivos e escrita remota (`sistema-de-arquivos`)

Terceira porta do plano escolhido, e o módulo mais denso do levantamento: `WP_Filesystem` com 5 arquivos — base e 4 implementações (`direct`, `ftpext`, `ftpsockets`, `ssh2`) — e 54 regras de negócio registradas. É por aqui que o produto escreve código executável no disco (UC-33, UC-34). `technologies.json` propõe reduzir a só o driver `direct`, e esta etapa NÃO pode fazer isso: o diálogo de coleta de credencial é tela do produto, protegida por nonce `filesystem-credentials`, e a opção `ftp_credentials` grava host e usuário removendo senha e chaves antes (`wp-admin/includes/file.php:2495-2503`).

| candidato | o que é | situação |
|---|---|---|
| `fs-mais-ssh2-e-ftp` | Sistema de arquivos do runtime, com biblioteca de SSH2 e de FTP | **recomendado pela pesquisa** |
| `so-direct` | Só o driver direct, exigindo permissão de escrita | candidato |
| `cliente-do-sistema` | Delegar a cliente do sistema (sftp, ftp) | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato que mantém os quatro caminhos que a tela de credencial do produto oferece, e reduzir para um é mudança observável que nenhuma das 23 respostas autoriza.

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

## Modelo de dados

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| solicitação como registro de conteúdo | o tipo próprio de solicitação, com **quatro** estados dedicados, o e-mail do titular e a ação pedida | continua sendo conteúdo. Quem a modelar como tabela própria perde de graça autor, data, metadado e endpoint, e precisa reescrever a lixeira, a listagem e a paginação |
| chave de confirmação | guardada **com resumo criptográfico** no mesmo campo em que o conteúdo guarda senha em texto claro, com prazo de 24 horas | ver a pergunta em aberto da spec: o campo compartilhado com dois significados é herança, e separá-lo muda o que um programa de terceiro lê |
| registro de provedores de dado pessoal | registro em memória, povoado por ponto de extensão: cada módulo e cada extensão declara o que sabe exportar e apagar | é ponto de extensão e portanto é produto (P2 da constituição). Exportação e apagamento percorrem o registro página por página |
| arquivo de exportação | arquivo na área de envios, com prazo de **3 dias**, varrido de hora em hora | a varredura é registrada no arranque, não no painel: por isso ela existe mesmo num site que ninguém administra, ao contrário da coleta da lixeira |

A expiração da solicitação não confirmada apaga a chave **no mesmo comando** que muda o
estado: o link antigo deixa de existir em vez de apenas vencer.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| abrir solicitação | e-mail do titular e ação (exportar ou apagar) | solicitação em estado pendente, com e-mail de confirmação enviado | e-mail inválido, solicitação idêntica já pendente |
| confirmar | chave | solicitação confirmada | chave vencida (24 h), chave de solicitação em estado que não aceita validação |
| reenviar | identificador | nova chave e novo envio | solicitação em estado que não permite reenvio |
| expirar não confirmadas | nenhuma (gatilho agendado) | solicitações em estado de falha, com as chaves apagadas | nenhum |
| exportar | identificador | arquivo de exportação e endereço de acesso, montado página por página pelos provedores | provedor que falha, que não interrompe o conjunto |
| apagar | identificador | relatório do que foi removido **e do que não pôde ser** | idem |
| apagar arquivo de exportação | nenhuma (gatilho agendado) | arquivo removido | arquivo ausente, que é estado tolerado |
| exportar ou apagar dado de terceiro | identidade e alvo | operação executada | sem o poder do nível mais alto da instalação |

A paginação da exportação é contrato: o legado monta o arquivo em várias passagens para
não exceder tempo nem memória, e o resultado parcial é estado válido entre passagens.

## Migração de dados

**Nada vem do sistema velho** (resposta 2): nenhuma solicitação, nenhum arquivo de
exportação.

A resposta 20 fecha a questão de retenção que o card bloqueado pedia: o núcleo não declara
prazo nenhum, e onde o legado encerra por propósito o porte preserva, o que nesta feature
significa que a solicitação morre ao concluir. Nenhum prazo novo é inventado aqui.

## Sequência

Depende de 001 (o poder de agir sobre dado de terceiro) e de 011 (a expiração e a varredura
do arquivo são agendadas). Toca 006 (arquivo enviado é dado pessoal) e 007 (o endereço de
origem do comentário é dado pessoal, exportado e anonimizado).

Ordem interna: abertura (REQ-086) antes da confirmação (REQ-087), do reenvio (REQ-088) e
da expiração (REQ-089); exportação (REQ-090) e apagamento (REQ-091) depois; o descarte do
arquivo (REQ-093) e o poder sobre dado de terceiro (REQ-095) por último.

## Riscos

1. **O arquivo de exportação é protegido só pela chave no endereço**, por três dias.
   REQ-092, que exigiria verificação de identidade, ficou fora do pacote.
2. **A varredura depende da fila agendada**, e a fila tem conflito aberto na feature 011.
   Aqui o risco é menor do que na lixeira, porque este evento é registrado no arranque.
3. **O campo compartilhado entre chave com resumo e senha em texto claro** é o tipo de
   herança que um porte "limpa" sem perceber que mudou o que se lê.
4. **O relatório de apagamento tem de dizer o que não pôde ser removido**, e no legado
   isso vem de provedor que falha sem interromper o conjunto. Tratar falha de provedor
   como erro da operação muda o resultado.
5. **O endereço de origem do comentário é anonimizado, não apagado**, e a diferença
   importa para a obrigação legal que a implantação assume.
