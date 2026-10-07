# Privacidade e dados pessoais

**Origem:** épico EP-8 do backlog do sistema legado (`exportar e apagar dado pessoal com prova de titularidade`)  
**Cards:** REQ-086, REQ-087, REQ-088, REQ-089, REQ-090, REQ-091, REQ-093, REQ-095

## Por que esta feature existe

Exportar e apagar dado pessoal com prova de titularidade. O épico EP-8 cobre a abertura
da solicitação identificada pelo endereço de e-mail, a confirmação pelo titular por
chave com prazo, o tratamento da falha de envio como estado reenviável, a expiração da
solicitação não confirmada, a exportação percorrendo os provedores registrados página por
página, o apagamento informando o que não pôde ser removido, o descarte do arquivo de
exportação no prazo e o enquadramento de exportar ou apagar dado de terceiro como poder
do nível mais alto da instalação.

O desenho do legado tem duas marcas que o porte precisa reproduzir. A solicitação é um
registro de conteúdo, com quatro estados dedicados, e por isso herda de graça autor,
data, metadado e endpoint; quem a modelar como tabela própria perde comportamento que
nunca foi escrito para ela. E a falha de envio de e-mail é estado, não exceção: a
solicitação vai para o estado de falha e pode ser reenviada, o que é justamente por que
esse estado aceita validação de chave. Diferente da coleta da lixeira, a varredura do
arquivo de exportação é registrada no arranque, logo ela existe mesmo num site que
ninguém administra.

## Histórias de usuário

### US-1 — Abrir solicitação de dados pessoais identificada pelo endereço de e-mail

Como administrador, quero registrar formalmente um pedido de exportação ou de apagamento dos dados de alguém, para dar início a um procedimento com prova de cada passo.

**Critérios de aceite**

- [ ] CA-1.1 A solicitação exige a capacidade de privacidade correspondente à ação pedida, verificada antes de a tela abrir
- [ ] CA-1.2 A solicitação nasce num estado pendente, vinculada ao endereço de e-mail informado, e não à conta
- [ ] CA-1.3 Titular sem conta no site tem solicitação válida do mesmo jeito
- [ ] CA-1.4 A solicitação aparece na lista aguardando o titular, com o estado visível
- [ ] CA-1.5 Nada é exportado nem apagado na abertura

**Regras de negócio que valem aqui**

- D1 — a solicitação é um registro de conteúdo de tipo próprio, com quatro estados dedicados `domain.md §2.5`
- D2 — nada acontece sem confirmação do titular `domain.md §2.5`

**Depende de:** REQ-014, fora desta feature

### US-2 — Exigir confirmação do titular por chave com prazo declarado

Como titular dos dados, quero autorizar eu mesmo que o site execute o pedido feito em meu nome, para que ninguém exporte nem apague os meus dados sem a minha autorização.

**Critérios de aceite**

- [ ] CA-2.1 A chave de confirmação é guardada com hash; o valor em claro só existe no e-mail enviado ao titular
- [ ] CA-2.2 A chave é válida por 24 horas e a validação fora do prazo é recusada com aviso de prazo vencido
- [ ] CA-2.3 A validação só é aceita enquanto a solicitação está pendente ou em falha de envio
- [ ] CA-2.4 Solicitação já concluída recusa a validação: um pedido executado não é reconfirmável
- [ ] CA-2.5 Confirmar apaga a chave e avisa quem administra o site de que a solicitação está pronta para execução
- [ ] CA-2.6 Chave inválida é recusada com erro genérico

**Regras de negócio que valem aqui**

- D2 — nada acontece sem confirmação do titular; a chave vale 24 horas e é guardada com hash `domain.md §2.5`
- A chave de confirmação é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades

**Depende de:** US-1 (REQ-086)

### US-3 — Tratar a falha de envio como estado reenviável, não como erro perdido

Como administrador, quero que uma solicitação cujo e-mail não saiu fique visível como tal e possa ser reenviada, para que o procedimento não trave por um problema de entrega.

**Critérios de aceite**

- [ ] CA-3.1 Falha no envio move a solicitação para um estado próprio de falha, e não a deixa pendente nem a apaga
- [ ] CA-3.2 O estado de falha aceita validação de chave, para que um clique no link antigo não trave o fluxo para sempre
- [ ] CA-3.3 Reenviar gera chave nova e devolve a solicitação ao estado pendente
- [ ] CA-3.4 O estado de cada solicitação é visível na lista, com o instante da última alteração

**Regras de negócio que valem aqui**

- D3 — falha de envio de e-mail é estado, não exceção, e é por isso que o estado de falha aceita validação de chave `domain.md §2.5`

**Depende de:** US-2 (REQ-087)

### US-4 — Expirar solicitação não confirmada, apagando a chave no mesmo comando

Como dono do site, quero que o link de confirmação não fique vivo depois do prazo, para que um e-mail antigo numa caixa de entrada deixe de ser uma autorização válida.

**Critérios de aceite**

- [ ] CA-4.1 Rotina agendada procura solicitações pendentes alteradas há mais de 24 horas e as move para o estado de falha
- [ ] CA-4.2 A chave é apagada do registro no mesmo comando que muda o estado: o link deixa de existir, não apenas de valer
- [ ] CA-4.3 Solicitação já em falha não é tocada pela rotina
- [ ] CA-4.4 O agendamento existe num site que ninguém administra, sem depender de visita à tela de privacidade

**Regras de negócio que valem aqui**

- D3b — solicitação não confirmada em 24 horas expira para o estado de falha, e a chave é apagada no mesmo comando `domain.md §2.5`
- A9 — a fila só avança quando chega requisição HTTP `domain.md §2.6`
- ADR 0006 — retenção agendada por visita ao painel: este caso é a correção parcial dele

**Depende de:** US-2 (REQ-087) · REQ-122, fora desta feature

### US-5 — Exportar os dados percorrendo os provedores registrados, página por página

Como administrador, quero entregar ao titular tudo o que o site guarda sobre ele, sem que a operação derrube o servidor numa base grande.

**Critérios de aceite**

- [ ] CA-5.1 A execução só é permitida a partir do estado confirmado
- [ ] CA-5.2 Cada provedor de dados é chamado por página e declara se terminou; a execução repete até todos declararem conclusão
- [ ] CA-5.3 Um provedor que falha é reportado e não interrompe os demais
- [ ] CA-5.4 O resultado é um arquivo guardado no armazenamento e o titular recebe o endereço dele
- [ ] CA-5.5 A solicitação termina no estado concluído, com o titular avisado
- [ ] CA-5.6 Uma execução interrompida pode ser retomada do ponto em que parou, sem duplicar nem perder dado

**Regras de negócio que valem aqui**

- D1, D2 — a solicitação é um registro de conteúdo e só executa a partir de confirmada

**Depende de:** US-2 (REQ-087)

### US-6 — Apagar os dados informando o que não pôde ser removido

Como administrador, quero apagar o que o site guarda sobre uma pessoa e saber exatamente o que ficou, para responder ao titular com precisão.

**Critérios de aceite**

- [ ] CA-6.1 A execução só é permitida a partir do estado confirmado
- [ ] CA-6.2 Cada provedor de apagamento informa quantos itens removeu e quantos não pôde remover
- [ ] CA-6.3 O relatório final lista o que não pôde ser removido e o motivo declarado por cada provedor
- [ ] CA-6.4 A solicitação termina no estado concluído, com o titular avisado
- [ ] CA-6.5 Nenhum dado é removido antes da confirmação do titular

**Regras de negócio que valem aqui**

- D1, D2, D4 — a solicitação é um registro de conteúdo, só executa a partir de confirmada, e a capacidade é de rede

**Depende de:** US-2 (REQ-087)

### US-7 — Apagar o arquivo de exportação no prazo declarado

Como dono do site, quero que o arquivo com dado pessoal não fique guardado além do necessário, para reduzir a janela em que ele pode vazar.

**Critérios de aceite**

- [ ] CA-7.1 Arquivo de exportação com mais de três dias é apagado por rotina agendada
- [ ] CA-7.2 A varredura roda ao menos uma vez por hora
- [ ] CA-7.3 O agendamento existe num site que ninguém administra
- [ ] CA-7.4 Apagar o arquivo não apaga o registro da solicitação, que continua como prova do procedimento
- [ ] CA-7.5 Cada execução registra quantos arquivos apagou

**Regras de negócio que valem aqui**

- R7 — o arquivo de exportação vale três dias e a varredura é horária; este evento é registrado no caminho público, logo existe mesmo num site que ninguém administra `domain.md §2.4`

**Depende de:** US-5 (REQ-090) · REQ-122, fora desta feature

### US-8 — Tratar exportar e apagar dado de terceiro como poder do nível mais alto da instalação

Como dono do site, quero que mexer no dado pessoal de outra pessoa seja um poder restrito ao nível mais alto, para que essa operação nunca caia num papel intermediário por acidente.

**Critérios de aceite**

- [ ] CA-8.1 As capacidades de exportar e apagar dado de terceiro, e a de administrar configuração de privacidade, resolvem para o poder de rede quando a instalação é em rede
- [ ] CA-8.2 Fora de rede, elas resolvem para o poder de administrar a instalação
- [ ] CA-8.3 Nenhum papel abaixo desse nível recebe essas capacidades por padrão
- [ ] CA-8.4 Apagar a página de política de privacidade exige a capacidade de privacidade somada às capacidades normais de apagar conteúdo

**Regras de negócio que valem aqui**

- D4 — exportar ou apagar dados de terceiro é poder de rede `domain.md §2.5`
- D5 — a página de política de privacidade é protegida pela própria capacidade de privacidade `domain.md §2.5`

**Depende de:** REQ-014, fora desta feature

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] REQ-092 (proteger o arquivo de exportação por verificação de identidade) ficou `bloqueado`. No legado o arquivo fica acessível por endereço com chave durante três dias, sem verificação de identidade, e US-7 apenas o apaga no prazo. Quem construir esta feature entrega a exportação com a proteção do legado, que é a chave no endereço, e isso precisa estar explícito para quem opera.
- [ ] REQ-094 (declarar a retenção do registro de solicitação concluída) ficou `bloqueado` por falta de decisão, e a resposta 20 já decidiu: o núcleo não declara prazo nenhum, e onde o legado encerra por propósito o porte preserva. O card volta à seleção com a decisão registrada, ou fica fora?
- [ ] A chave de confirmação é guardada com resumo criptográfico no mesmo campo em que o conteúdo guarda senha em texto claro (regra D6). O modelo novo mantém o campo compartilhado, com significados diferentes por tipo de registro, ou separa os dois? Separar é mais claro e muda o que um programa de terceiro lê.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-086 · UC-25 · `domain.md §2.5` (D1) · `domain.md §2.5` (D2) | `wp-admin/export-personal-data.php:12`, `wp-admin/erase-personal-data.php:12`, `wp-includes/user.php:4804` (+2) |
| US-2 | REQ-087 · UC-26 · `domain.md §2.5` (D2) | `wp-login.php:1240`, `wp-includes/user.php:4245`, `wp-includes/user.php:5058` (+2) |
| US-3 | REQ-088 · UC-25 · UC-26 · `domain.md §2.5` (D3) | `wp-admin/includes/privacy-tools.php:226`, `wp-includes/user.php:5097` |
| US-4 | REQ-089 · UC-28 · `domain.md §2.5` (D3b) · `domain.md §2.6` (A9) | `wp-admin/includes/privacy-tools.php:195`, `wp-admin/includes/privacy-tools.php:222`, `wp-includes/functions.php:8568` (+1) |
| US-5 | REQ-090 · UC-27 | `wp-admin/includes/privacy-tools.php:46`, `wp-admin/includes/privacy-tools.php:316`, `wp-admin/includes/privacy-tools.php:594` (+2) |
| US-6 | REQ-091 · UC-27 | `wp-admin/includes/privacy-tools.php:46`, `wp-admin/includes/privacy-tools.php:316`, `wp-includes/user.php:4490` |
| US-7 | REQ-093 · UC-27 · `domain.md §2.4` (R7) | `wp-admin/includes/privacy-tools.php:610`, `wp-includes/functions.php:8550`, `wp-includes/default-filters.php:459` |
| US-8 | REQ-095 · UC-25 · UC-27 · UC-09 · `domain.md §2.5` (D4) · `domain.md §2.5` (D5) | `wp-includes/capabilities.php:795`, `wp-includes/capabilities.php:179` |
