# Retenção e descarte

**Origem:** épico EP-5 do backlog do sistema legado (`tirar do ar sem perder, e apagar no prazo`)  
**Cards:** REQ-047, REQ-048, REQ-049, REQ-050, REQ-052, REQ-053, REQ-054, REQ-055

## Por que esta feature existe

Tirar do ar sem perder, e apagar no prazo. O épico EP-5 cobre o descarte de conteúdo
para a lixeira guardando o estado anterior e o instante, a suspensão dos comentários do
conteúdo descartado com o estado de cada um, a restauração como rascunho, o aviso de que
apagar é irreversível quando a lixeira está desligada, a coleta do que venceu, a
expiração do rascunho automático em sete dias, a tolerância a estado inconsistente na
coleta e o reparentamento de filhos e anexos quando um conteúdo é apagado em definitivo.

A lixeira do legado tem memória, e é por isso que ela é uma feature e não um campo:
guarda o estado anterior e o instante do descarte, a restauração devolve como rascunho
em vez de voltar ao estado anterior (mudança deliberada de comportamento, não defeito),
e desligar a lixeira torna apagar irreversível na primeira linha da operação. O que faz
desta feature um caso difícil de porte está no agendamento: a coleta só é agendada por
visita autenticada ao painel, logo um site que ninguém administra nunca limpa a própria
lixeira. É o ADR 0006, e a resposta 10 mandou preservá-lo.

## Histórias de usuário

### US-1 — Descartar conteúdo para a lixeira guardando o estado anterior e o instante

Como autor, quero tirar um conteúdo do ar sem perdê-lo, para poder mudar de ideia depois.

**Critérios de aceite**

- [ ] CA-1.1 O descarte guarda, junto do conteúdo, o estado que ele tinha e o instante do descarte
- [ ] CA-1.2 O conteúdo descartado sai de toda consulta pública e continua existindo
- [ ] CA-1.3 A permissão de descartar é resolvida conforme autoria e estado do conteúdo
- [ ] CA-1.4 Uma versão anterior do conteúdo não é descartável por permissão de conteúdo
- [ ] CA-1.5 Conteúdo com função especial declarada exige a capacidade dessa função para ser descartado

**Regras de negócio que valem aqui**

- A lixeira é estado reversível com memória: o estado anterior e a hora ficam gravados
- ADR 0004 — lixeira com memória e restauração para rascunho

**Depende de:** REQ-015, fora desta feature

### US-2 — Suspender os comentários do conteúdo descartado, guardando o estado de cada um

Como dono do site, quero que a conversa de um conteúdo descartado saia do ar com ele e volte igual se ele voltar, para não perder nem expor comentário por engano.

**Critérios de aceite**

- [ ] CA-2.1 Descartar o conteúdo move os seus comentários para um estado próprio de suspensão em cascata
- [ ] CA-2.2 O estado anterior de cada comentário é guardado, agrupado, junto do conteúdo
- [ ] CA-2.3 Restaurar o conteúdo devolve cada comentário ao estado que tinha, em lote por estado
- [ ] CA-2.4 Esse estado de suspensão não é alcançável pela interface de moderação: só pela cascata

**Regras de negócio que valem aqui**

- Dois estados de comentário não são alcançáveis pela API de status
- Se o estado anterior não estiver gravado, o comentário restaurado volta para a fila de moderação

**Depende de:** US-1 (REQ-047)

### US-3 — Restaurar conteúdo da lixeira como rascunho

Como autor, quero recuperar um conteúdo descartado antes que a coleta o apague, e revisá-lo antes de ele voltar ao ar.

**Critérios de aceite**

- [ ] CA-3.1 A restauração grava rascunho, e não o estado que o conteúdo tinha antes do descarte
- [ ] CA-3.2 Anexo restaurado volta a herdar a visibilidade do conteúdo de destino
- [ ] CA-3.3 Os dados de descarte são apagados do conteúdo restaurado
- [ ] CA-3.4 O conteúdo precisa ser publicado de novo para voltar ao ar
- [ ] CA-3.5 A permissão de restaurar é decidida pelo estado anterior, gravado no descarte

**Regras de negócio que valem aqui**

- R2 — restaurar da lixeira devolve como rascunho, não ao estado anterior `domain.md §2.4`
- A autorização sobre conteúdo na lixeira é decidida pelo estado anterior

**Depende de:** US-1 (REQ-047), US-2 (REQ-048)

### US-4 — Avisar que apagar é irreversível quando a lixeira está desligada

Como autor, quero saber que neste site apagar não tem volta, para não descobrir isso depois de apagar.

**Critérios de aceite**

- [ ] CA-4.1 Com a lixeira desligada, o pedido de descarte apaga em definitivo
- [ ] CA-4.2 Nesse caso a confirmação pedida ao ator diz, com estas palavras, que a ação não tem volta
- [ ] CA-4.3 A diferença entre descartar e apagar em definitivo é visível na tela antes da ação, não depois
- [ ] CA-4.4 Com a lixeira desligada, a tela não oferece ação de restaurar

**Regras de negócio que valem aqui**

- R1 — lixeira de 30 dias, e desligá-la torna apagar irreversível `domain.md §2.4`

**Depende de:** US-1 (REQ-047)

### US-5 — Apagar conteúdo vencido da lixeira por rotina que não depende de visita ao painel

Como dono do site, quero que o que passou do prazo de retenção seja apagado sozinho, mesmo num site que ninguém administra, para que a lixeira não cresça para sempre.

**Critérios de aceite**

- [ ] CA-5.1 O agendamento da coleta existe numa instalação nova, sem depender de ninguém ter entrado no painel
- [ ] CA-5.2 A coleta apaga em definitivo todo conteúdo descartado há mais tempo que o prazo declarado
- [ ] CA-5.3 A coleta apaga, pelo mesmo critério, os comentários descartados
- [ ] CA-5.4 Uma execução interrompida no meio pode ser retomada sem apagar duas vezes nem saltar registro
- [ ] CA-5.5 Cada execução registra quantos registros apagou

**Regras de negócio que valem aqui**

- R5 — no legado a coleta da lixeira só é agendada por visita autenticada ao painel: um site que ninguém administra nunca agenda sua própria limpeza `domain.md §2.4`
- ADR 0006 — retenção agendada por visita ao painel

**Depende de:** US-1 (REQ-047) · REQ-122, fora desta feature

### US-6 — Expirar rascunho automático não aproveitado em sete dias

Como dono do site, quero que os registros criados só por abrir o editor e nunca usados desapareçam, para que eles não virem lixo permanente no armazenamento.

**Critérios de aceite**

- [ ] CA-6.1 Rascunho automático com mais de sete dias é apagado pela rotina de coleta
- [ ] CA-6.2 O prazo é contado da data do registro
- [ ] CA-6.3 A rotina não toca em rascunho comum, nem em conteúdo de qualquer outro estado
- [ ] CA-6.4 O agendamento não depende de alguém ter aberto a tela de edição

**Regras de negócio que valem aqui**

- R4 — rascunho automático expira em sete dias, por consulta direta sobre a data do registro `domain.md §2.4`

**Depende de:** US-5 (REQ-052) · REQ-031, fora desta feature

### US-7 — Tolerar estado inconsistente na coleta, sem apagar o que não deve

Como dono do site, quero que a rotina de coleta não apague um conteúdo que saiu da lixeira por outro caminho, para que uma inconsistência não custe conteúdo.

**Critérios de aceite**

- [ ] CA-7.1 Registro marcado como descartado que já não está na lixeira tem só a marca removida, e não é apagado
- [ ] CA-7.2 A rotina segue para o registro seguinte em lugar de abortar
- [ ] CA-7.3 Cada inconsistência encontrada é registrada com identificador do registro e instante

**Regras de negócio que valem aqui**

- R6 — a coleta tolera estado inconsistente: apaga só o metadado e segue `domain.md §2.4`

**Depende de:** US-5 (REQ-052)

### US-8 — Reparentar filhos e anexos quando um conteúdo é apagado em definitivo

Como dono do site, quero que apagar uma página não apague as páginas abaixo dela, para que uma exclusão não derrube uma seção inteira sem aviso.

**Critérios de aceite**

- [ ] CA-8.1 Apagar em definitivo um conteúdo hierárquico vincula os seus filhos ao avô, em lugar de apagá-los
- [ ] CA-8.2 O mesmo vale para os anexos vinculados àquele conteúdo
- [ ] CA-8.3 As versões anteriores do conteúdo apagado vão em cascata, essas sim
- [ ] CA-8.4 Nenhum registro fica apontando para um conteúdo que não existe mais

**Depende de:** US-1 (REQ-047)

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] Conflito registrado, não resolvido. US-5 (REQ-052) exige, em CA-5.1, que o agendamento da coleta exista numa instalação nova sem depender de ninguém ter entrado no painel. A resposta 10 de `questions.md`, que cita este card na lista de specs afetadas, decidiu manter o disparo por requisição ao próprio host e declarou que a consequência de um site sem visita nunca executar a própria limpeza é comportamento do produto, não acidente. As duas decisões são humanas e estão em sentidos opostos: construir US-5 como está escrita rompe a paridade, construir a paridade deixa CA-5.1 falso. Este pacote não escolhe.
- [ ] CA-5.5 (REQ-052) exige que cada execução registre quantos registros apagou, e o legado não guarda registro nenhum de execução (P7 da constituição). Registro novo que não altera o fluxo é permitido por P7; o critério, porém, torna o registro obrigatório, o que precisa ser aceito explicitamente como divergência.
- [ ] REQ-051 (dar lixeira à mídia pelo mesmo comportamento do conteúdo) ficou `bloqueado` por decisão humana, e a resposta 9 já a tomou: a exclusão de mídia continua definitiva, sem lixeira e sem aviso. US-8 reparenta anexos ao apagar conteúdo em definitivo, então a assimetria entre conteúdo e mídia precisa estar visível para quem constrói. O card volta à seleção, agora que a decisão existe?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-047 · UC-09 | `wp-admin/post.php:250`, `wp-includes/post.php:4084`, `wp-includes/post.php:4128` (+1) |
| US-2 | REQ-048 · UC-09 · UC-10 | `wp-includes/post.php:4295`, `wp-includes/comment.php:1755`, `wp-includes/comment.php:2799` |
| US-3 | REQ-049 · UC-10 · `domain.md §2.4` (R2) | `wp-admin/post.php:287`, `wp-includes/post.php:4168`, `wp-includes/post.php:4209` (+1) |
| US-4 | REQ-050 · UC-09 · `domain.md §2.4` (R1) | `wp-includes/post.php:4085`, `wp-includes/default-constants.php:388` |
| US-5 | REQ-052 · UC-11 · UC-39 · `domain.md §2.4` (R5) | `wp-admin/admin.php:104`, `wp-includes/functions.php:6977`, `wp-includes/functions.php:6989` (+1) |
| US-6 | REQ-053 · UC-11 · `domain.md §2.4` (R4) | `wp-includes/post.php:8373`, `wp-admin/includes/post.php:798` |
| US-7 | REQ-054 · UC-11 · UC-10 · `domain.md §2.4` (R6) | `wp-includes/functions.php:6989`, `wp-includes/functions.php:6997` |
| US-8 | REQ-055 · UC-09 | `wp-includes/post.php:3908`, `wp-includes/post.php:4295` |
