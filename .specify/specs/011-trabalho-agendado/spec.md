# Trabalho agendado

**Origem:** épico EP-11 do backlog do sistema legado (`o que o sistema faz sozinho, sem ninguém pedir`)  
**Cards:** REQ-122, REQ-123, REQ-124, REQ-125, REQ-126, REQ-127, REQ-128
**Dos quais, cards de descarte (prioridade `wont`):** REQ-128

## Por que esta feature existe

O que o sistema faz sozinho, sem ninguém pedir: a publicação agendada, a coleta da
lixeira, a expiração de solicitação de dado pessoal, o descarte do spam vencido, a
verificação de atualização. O épico EP-11 cobre o gatilho da execução, a garantia de que
um evento não roda em dois processos ao mesmo tempo, o registro do que a fila executou, a
visibilidade da falha do gatilho, o reagendamento do evento recorrente antes de o
executar e a declaração de que desligar o gatilho não desliga a fila.

No legado, o agendador não é um agendador. A fila é uma lista gravada na configuração do
site, e ela só avança quando chega uma requisição ao site: o disparo é uma requisição que
o site faz para si mesmo, não bloqueante, com tempo limite de um centésimo de segundo e
sem verificação de certificado, de modo que a falha dele é invisível por projeto. A trava
é de 60 segundos e é descartada se tiver mais de 10 minutos. Desligar o disparo não
desliga a fila. E o protocolo da requisição ao próprio site está implementado quatro
vezes na árvore, com a duplicação admitida em comentário no código. Esta é a feature em
que as duas fontes humanas deste pacote colidem de frente, e a seção de perguntas em
aberto é a parte mais importante dela.

## Histórias de usuário

### US-1 — Executar trabalho agendado por gatilho independente de visita ao site

Como dono do site, quero que o que deve acontecer sozinho aconteça na hora marcada, mesmo que ninguém visite o site, para que retenção, publicação agendada e limpeza não dependam de tráfego.

**Critérios de aceite**

- [ ] CA-1.1 Um evento marcado para um instante é executado naquele instante, num site sem visita alguma
- [ ] CA-1.2 O gatilho não é uma requisição do próprio site para si mesmo disparada por visita de terceiro
- [ ] CA-1.3 A fila é consultável: é possível listar os eventos pendentes, os seus horários e as suas recorrências
- [ ] CA-1.4 Desligar o gatilho é uma decisão declarada, e desligado o diagnóstico do site reporta que nada agendado roda
- [ ] CA-1.5 Um evento cuja execução excede o tempo declarado é interrompido e o fato fica registrado

**Regras de negócio que valem aqui**

- A9 — cron não é cron: a fila só avança quando chega requisição HTTP `domain.md §2.6`
- Cron é agendador disparado por requisição HTTP, não pelo sistema operacional
- Nenhum broker de mensagem existe nesta árvore: num porte não há mensageria a migrar, há uma a construir

### US-2 — Garantir que um evento agendado não seja executado por dois processos ao mesmo tempo

Como dono do site, quero que o trabalho agendado rode uma vez, para que uma publicação não saia duas vezes e um apagamento não aconteça pela metade.

**Critérios de aceite**

- [ ] CA-2.1 Dois processos que tentam executar o mesmo evento resultam em exatamente uma execução
- [ ] CA-2.2 A exclusividade tem prazo declarado e é liberada ao fim da execução, inclusive no caminho de erro
- [ ] CA-2.3 Exclusividade presa além do prazo máximo declarado é descartada, e o fato fica registrado
- [ ] CA-2.4 Perder a exclusividade no meio da execução interrompe o processamento sem deixar evento consumido pela metade
- [ ] CA-2.5 Um evento que já foi retirado da fila e cuja execução foi interrompida é identificável como tal

**Regras de negócio que valem aqui**

- A9 — a trava é um transiente de 60 segundos, descartado se passar de 10 minutos `domain.md §2.6`
- No legado, a execução é abandonada onde está e os eventos já removidos da fila não voltam

**Depende de:** US-1 (REQ-122)

### US-3 — Registrar o que a fila executou, quando e com que resultado

Como responsável pela operação, quero poder dizer se a limpeza de ontem rodou, para diagnosticar um problema sem adivinhar.

**Critérios de aceite**

- [ ] CA-3.1 Cada execução de evento registra identificador, instante de início, duração, resultado e erro, quando houver
- [ ] CA-3.2 O registro é consultável por evento e por período
- [ ] CA-3.3 O registro tem prazo de retenção declarado
- [ ] CA-3.4 É possível responder, pelo registro, quando um evento recorrente rodou pela última vez

**Regras de negócio que valem aqui**

- No legado, nenhum registro do que rodou é guardado, e erros recorrentes não podem ser identificados porque não há histórico

**Depende de:** US-1 (REQ-122) · REQ-159, fora desta feature

### US-4 — Tornar visível a falha do gatilho do trabalho agendado

Como responsável pela operação, quero ser avisado quando nada agendado está rodando, porque é a falha que não dá sinal e para o site por dentro.

**Critérios de aceite**

- [ ] CA-4.1 Gatilho que não consegue disparar registra a falha com instante e motivo
- [ ] CA-4.2 A falha aparece no diagnóstico do site com severidade alta
- [ ] CA-4.3 Depois do prazo declarado sem nenhuma execução, quem administra o site é avisado
- [ ] CA-4.4 O diagnóstico diz quantos eventos estão vencidos e desde quando

**Regras de negócio que valem aqui**

- A integração mais crítica é com o próprio site: sem a requisição de volta nada agendado roda, e a falha é silenciosa por projeto porque a requisição é não bloqueante
- O protocolo de requisição ao próprio site está implementado quatro vezes, com a duplicação admitida em comentário no código

**Depende de:** US-1 (REQ-122), US-3 (REQ-124)

### US-5 — Reagendar o evento recorrente retirando-o da fila antes de o executar

Como dono do site, quero que um evento recorrente continue recorrendo mesmo que uma execução falhe, para que uma falha não pare a série.

**Critérios de aceite**

- [ ] CA-5.1 O evento é retirado da fila antes de ser executado, e o recorrente é reagendado no mesmo passo
- [ ] CA-5.2 Execução que falha não impede a ocorrência seguinte
- [ ] CA-5.3 Os eventos vencidos são percorridos em ordem de horário
- [ ] CA-5.4 Um evento único executado não volta à fila

**Depende de:** US-1 (REQ-122), US-2 (REQ-123)

### US-6 — Declarar que desligar o gatilho não desliga a fila

Como responsável pela operação, quero saber que desligar o disparo automático faz a fila acumular, para não deixar uma fila crescendo em silêncio.

**Critérios de aceite**

- [ ] CA-6.1 Com o gatilho desligado, a fila continua recebendo eventos e o diagnóstico do site diz quantos estão acumulados
- [ ] CA-6.2 A tela de configuração avisa, no momento de desligar, que a fila continua crescendo
- [ ] CA-6.3 Ligar o gatilho de novo processa os eventos vencidos em ordem de horário, sem perder nenhum
- [ ] CA-6.4 Há um caminho declarado para disparar a fila de fora, e ele é o recomendado quando o gatilho interno é desligado

**Regras de negócio que valem aqui**

- A9 — desligar o disparo não desliga a fila: a fila continua existindo e acumulando `domain.md §2.6`

**Depende de:** US-1 (REQ-122), US-4 (REQ-125)

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-128 — Descartar o disparo da fila por redirecionamento do navegador do visitante

O sistema novo não terá o modo alternativo em que a fila agendada é disparada fazendo o navegador de quem está lendo o site dar um salto extra.

**Motivo registrado no card:** Existe só como contorno para a falha de fundo que REQ-122 elimina: o gatilho interno depender de uma requisição do site para si mesmo. Resolvido o gatilho, o contorno perde a razão de ser — e ele custa ao visitante um salto de navegador que ele não pediu, na requisição dele, para fazer trabalho do site. Carregar as duas coisas é carregar o remédio de uma doença que o sistema novo não tem.

**Como conferir que ficou fora**

- [ ] Nenhuma resposta ao visitante contém redirecionamento cujo propósito seja disparar trabalho agendado
- [ ] Não existe modo de configuração que troque o gatilho por um salto no navegador do visitante
- [ ] A execução do trabalho agendado é independente de quem está lendo o site

> Conflito registrado, não resolvido, e com uma peculiaridade: este descarte depende do card REQ-122, que está ele mesmo em conflito com a resposta 10. O modo alternativo existe no legado exatamente como contorno da falha de fundo que REQ-122 propõe eliminar. Se a resposta 10 prevalecer e o gatilho continuar sendo a requisição ao próprio host, o descarte perde a premissa e o modo alternativo volta a ter razão de ser.

## Perguntas em aberto

- [ ] Conflito registrado, não resolvido, e o mais consequente desta feature. REQ-122 exige, em CA2, que o gatilho não seja uma requisição do próprio site para si mesmo disparada por visita de terceiro, e exige que um evento marcado para um instante execute naquele instante num site sem visita alguma. A resposta 10 de `questions.md` decidiu manter exatamente o que o card recusa, com a justificativa escrita de que "trocar por agendador do sistema produz um produto que se comporta diferente no primeiro dia". As duas decisões são humanas e se excluem: nenhuma implementação satisfaz as duas.
- [ ] REQ-124 exige registrar o que a fila executou, com instante, duração, resultado e prazo de retenção declarado, e REQ-125 exige avisar quem administra depois de um prazo sem nenhuma execução. O legado não guarda registro de execução nenhum, e a resposta 20 proíbe inventar prazo de retenção que o produto não tem. Acrescentar registro sem mudar o fluxo é permitido por P7 da constituição; tornar o registro e o aviso obrigatórios é divergência que precisa de decisão humana registrada.
- [ ] O protocolo de requisição ao próprio site está implementado quatro vezes no legado. Unificar as quatro é invisível de fora e portanto compatível com P1, mas muda o que uma extensão que intercepte uma das quatro consegue interceptar. Unificar, ou portar as quatro?
- [ ] Se a resposta 10 prevalecer, três das seis histórias desta feature (REQ-122, REQ-124 e REQ-125) perdem a razão de ser, e o épico fica com o controle de concorrência, o reagendamento e a declaração de que desligar o gatilho não desliga a fila. Isso precisa ser dito por quem decide, porque é a diferença entre uma feature de seis histórias e uma de três.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-122 · UC-39 · `domain.md §2.6` (A9) | `wp-cron.php:64`, `wp-cron.php:191`, `wp-includes/cron.php:1051` (+1) |
| US-2 | REQ-123 · UC-39 · UC-11 · `domain.md §2.6` (A9) | `wp-cron.php:97`, `wp-cron.php:156`, `wp-includes/cron.php:915` |
| US-3 | REQ-124 · UC-39 | `wp-cron.php:191`, `wp-includes/cron.php:1051` |
| US-4 | REQ-125 · UC-39 · UC-37 | `wp-includes/cron.php:1051`, `wp-admin/includes/class-wp-site-health.php:3622`, `wp-admin/includes/class-wp-site-health.php:1740` |
| US-5 | REQ-126 · UC-39 | `wp-cron.php:191`, `wp-cron.php:194`, `wp-cron.php:201` |
| US-6 | REQ-127 · UC-39 · `domain.md §2.6` (A9) | `wp-includes/cron.php:937`, `wp-includes/default-constants.php:399` |
| fora de escopo: REQ-128 | REQ-128 · UC-39 | `wp-includes/cron.php:1051`, `wp-includes/default-constants.php:399` |
