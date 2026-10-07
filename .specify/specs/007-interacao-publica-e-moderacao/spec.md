# Interação pública e moderação

**Origem:** épico EP-7 do backlog do sistema legado (`a conversa do site, e quem decide o que entra nela`)  
**Cards:** REQ-065, REQ-066, REQ-067, REQ-068, REQ-070, REQ-071, REQ-072, REQ-073, REQ-074, REQ-075, REQ-076, REQ-077, REQ-078, REQ-079, REQ-080, REQ-081, REQ-082, REQ-083, REQ-085, REQ-180
**Dos quais, cards de descarte (prioridade `wont`):** REQ-081, REQ-085

## Por que esta feature existe

A conversa do site, e quem decide o que entra nela. É a área de maior densidade de regra
de negócio do sistema: 13 regras catalogadas em `domain.md`, e a ordem de avaliação
importa, porque cada etapa pode encerrar a decisão. O épico EP-7 cobre o recebimento do
comentário com ou sem conta, a recusa da duplicata, o limite de vazão por hora, a cascata
que decide o estado inicial, a recusa do campo longo demais, o fechamento da interação em
conteúdo antigo, o encadeamento de respostas, a moderação da fila como transição de
estado, a lixeira de comentário, o contador coerente, a nota editorial interna, a
notificação de link com prova de origem, a classificação por serviço externo e o descarte
em lote do spam vencido.

A regra que mais surpreende é o atalho de confiança: o comentário de quem é autor do
conteúdo comentado, ou de quem pode moderar, entra aprovado sem passar por nenhuma
verificação. Somada ao privilégio de marcação bruta, que no legado também é do papel de
editor, ela significa que um autor pode inserir qualquer marcação num comentário do
próprio conteúdo. Outras duas pedem o mesmo cuidado: a duplicata é recusa com código
próprio e não moderação, e o fechamento automático em conteúdo antigo acontece em
memória, sem o registro mudar no armazenamento.

## Histórias de usuário

### US-1 — Receber comentário de leitor com ou sem conta

Como visitante, quero deixar uma opinião num conteúdo do site, para participar da conversa com ou sem ter conta.

**Critérios de aceite**

- [ ] CA-1.1 Comentário sem conta é gravado com autoria anônima legítima, e não como erro
- [ ] CA-1.2 Com a exigência de conta ligada, o comentário anônimo é recusado antes de qualquer outra verificação
- [ ] CA-1.3 Com a exigência de identificação ligada, nome e e-mail são obrigatórios para quem não tem conta
- [ ] CA-1.4 Ao fim do envio o visitante é devolvido ao conteúdo comentado
- [ ] CA-1.5 Nenhuma superfície de envio aceita comentário em conteúdo que não existe ou que não é legível por quem envia

**Regras de negócio que valem aqui**

- Comment é interação sobre um conteúdo, de leitor com ou sem conta: autoria zero é anônimo legítimo

### US-2 — Recusar comentário duplicado em lugar de o moderar

Como dono do site, quero que o reenvio acidental do mesmo comentário não crie dois, para que a conversa não se repita.

**Critérios de aceite**

- [ ] CA-2.1 Mesmo conteúdo, mesmo comentário pai, mesmo autor, mesmo e-mail e mesmo texto são recusados com HTTP 409
- [ ] CA-2.2 A recusa acontece antes de qualquer decisão de moderação
- [ ] CA-2.3 Comentário que está na lixeira não conta como duplicata: o reenvio é aceito

**Regras de negócio que valem aqui**

- C1 — duplicata é recusa, não moderação; comentário na lixeira não conta como duplicata `domain.md §2.2`

**Depende de:** US-1 (REQ-065)

### US-3 — Limitar a vazão de comentários por hora, exceto para quem modera

Como dono do site, quero que ninguém possa despejar comentários em sequência, para que a conversa não seja afogada.

**Critérios de aceite**

- [ ] CA-3.1 Um segundo comentário da mesma conta na última hora aciona o freio com HTTP 429
- [ ] CA-3.2 Para quem não tem conta, o critério é o mesmo endereço de origem ou o mesmo e-mail
- [ ] CA-3.3 Quem tem a capacidade de administrar o site ou de moderar comentário não é limitado
- [ ] CA-3.4 A janela e o limite são configuráveis

**Regras de negócio que valem aqui**

- C2 — vazão limitada por hora, exceto para quem modera; a capacidade virou política de desempenho `domain.md §2.2`

**Depende de:** US-1 (REQ-065)

### US-4 — Decidir o estado inicial do comentário percorrendo as regras de moderação em ordem declarada

Como dono do site, quero que o destino de cada comentário novo — publicado, na fila, em spam ou na lixeira — seja decidido por regras em ordem conhecida, para poder explicar por que um comentário caiu onde caiu.

**Critérios de aceite**

- [ ] CA-4.1 A ordem de avaliação é declarada e cada etapa pode encerrar a decisão
- [ ] CA-4.2 Moderação manual ligada encerra a decisão na primeira etapa: nenhuma outra regra é consultada e o comentário vai para a fila
- [ ] CA-4.3 Número de links acima do limite declarado manda para a fila, contando também o endereço do autor
- [ ] CA-4.4 Palavra de moderação é procurada em seis campos: autor, e-mail, endereço, texto, origem da requisição e identificação do navegador
- [ ] CA-4.5 Com a confiança herdada ligada, exige-se comentário anterior aprovado da mesma conta, ou do mesmo par de nome e e-mail, e que o e-mail não contenha palavra de moderação
- [ ] CA-4.6 Casar com a lista de proibição manda para a lixeira quando a lixeira está ligada, e para spam quando não está
- [ ] CA-4.7 Para cada comentário, o sistema registra qual regra decidiu o seu destino

**Regras de negócio que valem aqui**

- C4 — moderação manual vence tudo `domain.md §2.2`
- C5 — link em excesso manda para a fila; o limite nasce em 2 e a contagem inclui o endereço do autor `domain.md §2.2`
- C6 — palavra de moderação é buscada em seis campos, inclusive origem e identificação do navegador `domain.md §2.2`
- C7 — autor já aprovado antes passa direto, se o e-mail estiver limpo; a confiança herdada nasce ligada `domain.md §2.2`
- C9 — lista de proibição vai para a lixeira, não para spam, para que o conteúdo seja recuperável `domain.md §2.2`
- ADR 0002 — moderação de comentário em cascata com atalho de confiança

**Depende de:** US-1 (REQ-065)

### US-5 — Recusar campo mais longo que o seu limite, em lugar de truncar em silêncio

Como visitante, quero saber que o meu comentário não cabe, para reescrevê-lo em lugar de descobrir que metade dele desapareceu.

**Critérios de aceite**

- [ ] CA-5.1 Nome, e-mail, endereço e texto acima do limite declarado devolvem erro ao requisitante, nomeando o campo
- [ ] CA-5.2 Nenhum desses campos é truncado em silêncio
- [ ] CA-5.3 O limite de cada campo é declarado e visível na tela antes do envio

**Regras de negócio que valem aqui**

- C10 — texto longo demais é erro de usuário, não truncamento, ao contrário do resto do sistema, que trunca em silêncio `domain.md §2.2`

**Depende de:** US-1 (REQ-065)

### US-6 — Fechar a interação em conteúdo antigo sem alterar o registro

Como dono do site, quero que a conversa de conteúdo antigo se feche sozinha, sem que isso reescreva o conteúdo nem perca a configuração original.

**Critérios de aceite**

- [ ] CA-6.1 Com a regra ligada, conteúdo do tipo em linha do tempo mais velho que o prazo declarado deixa de aceitar comentário e notificação de link
- [ ] CA-6.2 O fechamento acontece na resposta, não no armazenamento: o registro continua com o valor que o autor escolheu
- [ ] CA-6.3 Desligar a regra devolve a aceitação de todo o conteúdo antigo, sem precisar de migração de dados
- [ ] CA-6.4 O prazo nasce em 14 dias e é configurável

**Regras de negócio que valem aqui**

- C11 — comentário e notificação de link em conteúdo antigo fecham sozinhos, em memória: o banco não muda `domain.md §2.2`

**Depende de:** US-1 (REQ-065)

### US-7 — Encadear respostas até a profundidade declarada, e só sob comentário aprovado

Como visitante, quero responder a um comentário específico, para que a conversa fique legível.

**Critérios de aceite**

- [ ] CA-7.1 Responder a comentário não aprovado é recusado com HTTP 403
- [ ] CA-7.2 A profundidade de encadeamento é limitada pelo valor declarado, que nasce em 5
- [ ] CA-7.3 Atingida a profundidade máxima, a resposta é vinculada ao último nível permitido, e o visitante é informado
- [ ] CA-7.4 O encadeamento é desligável, e desligado todas as respostas ficam no primeiro nível

**Regras de negócio que valem aqui**

- A profundidade é limitada pelo valor declarado, que nasce em 5

**Depende de:** US-1 (REQ-065)

### US-8 — Recusar o comentário com motivo próprio para cada causa de fechamento

Como visitante, quero saber por que o meu comentário não foi aceito, para entender se o problema é meu ou do conteúdo.

**Critérios de aceite**

- [ ] CA-8.1 Conteúdo com comentário fechado, conteúdo descartado, conteúdo em rascunho e conteúdo protegido por senha produzem quatro recusas distintas
- [ ] CA-8.2 Cada recusa tem motivo próprio, identificável por quem integra, e mensagem própria para o visitante
- [ ] CA-8.3 Nenhuma das quatro recusas revela informação sobre conteúdo que o visitante não poderia ver

**Depende de:** US-1 (REQ-065) · REQ-043, fora desta feature

### US-9 — Avisar quem precisa saber do comentário novo

Como autor do conteúdo e como moderador, quero ser avisado de comentário novo, para não precisar vigiar a fila.

**Critérios de aceite**

- [ ] CA-9.1 Comentário aprovado avisa o autor do conteúdo comentado
- [ ] CA-9.2 Comentário que entrou na fila avisa quem pode moderar
- [ ] CA-9.3 Cada aviso traz as ações disponíveis para aquele comentário
- [ ] CA-9.4 Falha no envio do aviso não desfaz a gravação do comentário, e fica registrada

**Depende de:** US-4 (REQ-068)

### US-10 — Moderar a fila de comentários como transição de estado

Como editor, quero aprovar, reter, marcar como spam ou descartar cada comentário, para decidir o que entra na conversa pública do site.

**Critérios de aceite**

- [ ] CA-10.1 A permissão é resolvida pelo conteúdo comentado, não por uma capacidade global de comentário
- [ ] CA-10.2 Aprovar, reter, marcar como spam e descartar são transições de estado, e só esses quatro estados são alcançáveis pela interface
- [ ] CA-10.3 Estado pedido fora dos aceitos é recusado
- [ ] CA-10.4 Editar o texto do comentário não muda o estado
- [ ] CA-10.5 Numa ação em lote, a permissão é verificada comentário a comentário e um item sem permissão não interrompe o lote
- [ ] CA-10.6 Comentário cujo conteúdo comentado não existe mais resolve numa capacidade declarada de fallback, e não fica sem responsável

**Regras de negócio que valem aqui**

- Moderação é transição de estado, não edição: aprovar move o estado
- Editar um comentário cujo conteúdo não existe mais cai na capacidade de escrever conteúdo
- Dois estados não são alcançáveis pela API de status

**Depende de:** US-4 (REQ-068) · REQ-015, fora desta feature

### US-11 — Descartar comentário para a lixeira guardando o estado anterior

Como editor, quero poder descartar um comentário e mudar de ideia, para que uma decisão rápida não seja definitiva.

**Critérios de aceite**

- [ ] CA-11.1 O descarte guarda o estado anterior e o instante, junto do comentário
- [ ] CA-11.2 A restauração devolve o comentário ao estado guardado
- [ ] CA-11.3 Sem estado guardado, a restauração devolve o comentário para a fila de moderação
- [ ] CA-11.4 A coleta apaga em definitivo o comentário descartado há mais tempo que o prazo declarado

**Regras de negócio que valem aqui**

- R6 — a coleta tolera estado inconsistente `domain.md §2.4`

**Depende de:** US-10 (REQ-075) · REQ-052, fora desta feature

### US-12 — Manter o contador de comentários do conteúdo coerente com o que conta

Como visitante, quero que o número de comentários mostrado seja o número de comentários que eu vou ver, para que a página não prometa o que não entrega.

**Critérios de aceite**

- [ ] CA-12.1 O contador reflete apenas os comentários aprovados que contam
- [ ] CA-12.2 Nota editorial interna não entra no contador
- [ ] CA-12.3 Toda transição de estado de comentário atualiza o contador do conteúdo
- [ ] CA-12.4 Existe uma rotina de reconciliação que recalcula o contador e reporta divergência

**Regras de negócio que valem aqui**

- C12 — nota editorial é excluída do contador de comentários `domain.md §2.2`

**Depende de:** US-10 (REQ-075)

### US-13 — Dar prazo próprio e declarado ao link de ação enviado por e-mail

Como moderador, quero que o link de aprovar que chega no meu e-mail funcione por um prazo que eu conheça, para não clicar e receber erro sem entender o motivo.

**Critérios de aceite**

- [ ] CA-13.1 O token da ação tem prazo declarado e o e-mail informa esse prazo
- [ ] CA-13.2 Token vencido produz mensagem que diz que o link expirou e oferece abrir a tela de moderação
- [ ] CA-13.3 O prazo do link de e-mail é independente do prazo do token de formulário de tela

**Regras de negócio que valem aqui**

- Nonce é token com janela de meia-vida, não de uso único: vale de 12 a 24 horas e aceita o tick anterior, logo o link do e-mail de moderação tem prazo

**Depende de:** US-9 (REQ-074), US-10 (REQ-075)

### US-14 — Registrar nota editorial interna sobre um conteúdo

Como editor, quero deixar um recado sobre um conteúdo visível só para a equipe, para combinar algo sem publicar isso.

**Critérios de aceite**

- [ ] CA-14.1 A nota exige autenticação: não há nota anônima
- [ ] CA-14.2 A autorização é a capacidade de editar aquele conteúdo, não a de moderar comentário
- [ ] CA-14.3 Só tipos de conteúdo que declaram suporte a nota aceitam uma
- [ ] CA-14.4 A nota não aparece em superfície pública alguma e não entra no contador de comentários
- [ ] CA-14.5 Responder a uma nota cria uma nota filha; descartar ou apagar a nota raiz arrasta as respostas

**Regras de negócio que valem aqui**

- C12 — nota editorial não é comentário público: exige login, é excluída do contador, usa a capacidade de editar o conteúdo, só aceita tipos que declarem suporte, e apagar a nota raiz arrasta as respostas `domain.md §2.2`
- Nota editorial usa capacidade de conteúdo, não de moderação

**Depende de:** US-10 (REQ-075) · REQ-015, fora desta feature

### US-15 — Registrar notificação de link vinda de site remoto, com prova de origem

Como dono do site, quero saber quando outra página passa a apontar para o meu conteúdo, desde que isso seja verificável.

**Critérios de aceite**

- [ ] CA-15.1 A notificação só é aceita depois de o sistema buscar a página de origem declarada e confirmar que ela contém o link
- [ ] CA-15.2 Notificação sem a prova é recusada
- [ ] CA-15.3 Notificação repetida da mesma origem para o mesmo conteúdo é recusada com motivo próprio
- [ ] CA-15.4 Notificação cuja origem é um conteúdo publicado deste mesmo site é aprovada automaticamente
- [ ] CA-15.5 Conteúdo com notificação de link fechada recusa com motivo próprio
- [ ] CA-15.6 A notificação é gravada como interação de tipo próprio, distinguível de comentário humano

**Regras de negócio que valem aqui**

- C8 — notificação verificada do próprio site publicado é aprovada; a não verificada nunca, porque não traz prova de origem `domain.md §2.2`
- Pingback é verificado: a página de origem é buscada e tem de conter o link
- ADR 0003 — pingback do próprio site aprovado, trackback nunca

**Depende de:** US-1 (REQ-065), US-6 (REQ-071)

### US-16 — Classificar comentário por serviço externo de reputação

Como dono do site, quero obter de um serviço especializado o veredito sobre se um comentário é spam, para não depender só das regras locais.

**Critérios de aceite**

- [ ] CA-16.1 Com o serviço configurado, o comentário é consultado antes de a decisão local ser tomada
- [ ] CA-16.2 Sem credencial do serviço, a decisão volta inteira para as regras locais, sem erro
- [ ] CA-16.3 O veredito é gravado como estado do comentário e o histórico fica junto do comentário
- [ ] CA-16.4 Serviço que não respondeu marca o comentário para reconsulta; a reconsulta se repete até o prazo declarado e então é desistida
- [ ] CA-16.5 Veredito do serviço contrário ao de um moderador humano não prevalece: o estado gravado pelo humano fica, e a correção é devolvida ao serviço
- [ ] CA-16.6 O ponto de troca do serviço é declarado, de modo que trocar de fornecedor não exija alterar a cascata de moderação

**Regras de negócio que valem aqui**

- C13 — com o serviço ativo, spam tem prazo declarado e comentário cuja consulta falhou é reconsultado até o prazo `domain.md §2.2`
- I3 — o serviço de filtragem é registrado como conector, com credencial por opção e por constante `domain.md §2.9`
- Spam é estado de comentário, não exclusão; com o serviço instalado, o julgamento é externo

**Depende de:** US-4 (REQ-068)

### US-17 — Apagar em lote o spam vencido

Como dono do site, quero que o spam marcado não fique acumulado para sempre, para que o armazenamento não cresça por causa do que ninguém vai ler.

**Critérios de aceite**

- [ ] CA-17.1 Comentário marcado como spam há mais tempo que o prazo declarado é apagado por rotina agendada
- [ ] CA-17.2 O apagamento é feito em lotes de tamanho declarado, para não travar o banco
- [ ] CA-17.3 Cada execução registra quantos registros apagou
- [ ] CA-17.4 A rotina não apaga comentário que um humano tirou de spam

**Regras de negócio que valem aqui**

- C13 — spam tem prazo de 15 dias e é apagado em lotes de até 10.000 `domain.md §2.2`

**Depende de:** US-16 (REQ-082) · REQ-122, fora desta feature

### US-18 — Servir a imagem de quem comenta sem enviar o dado dele a terceiro

Como pessoa que comenta no site, quero que o meu endereço de e-mail não vire uma requisição a um serviço de fora a cada vez que alguém lê a página, para não ser rastreada por causa de um comentário.

**Critérios de aceite**

- [ ] CA-18.1 O comportamento de fábrica não produz requisição do navegador do leitor a serviço externo de imagem
- [ ] CA-18.2 Quem administra o site pode ligar o serviço externo, e a tela declara, nesse momento, que isso envia a identificação de cada autor de comentário a terceiro
- [ ] CA-18.3 Com o serviço desligado, há imagem de reserva servida pelo próprio site
- [ ] CA-18.4 O aviso de privacidade do site declara essa transferência quando ela está ligada

**Regras de negócio que valem aqui**

- A imagem de quem comenta é buscada por hash do e-mail num serviço externo, e a requisição é feita pelo navegador do leitor
- Metade do comportamento desta integração está fora da árvore: o que o navegador faz por conta própria não é verificável aqui

**Depende de:** US-1 (REQ-065)

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-081 — Descartar a notificação de link sem prova de origem (trackback)

O sistema novo não terá o protocolo de notificação de link que aceita origem, título e resumo sem verificar nada.

**Motivo registrado no card:** É uma superfície de entrada pública, sem autenticação e sem limite de taxa, que grava conteúdo no banco a partir de campos que ninguém verifica — e o próprio legado já o trata como suspeito por desenho, nunca o aprovando automaticamente. Reescrevê-lo é reescrever um canal de spam cujo valor o produto já descartou ao recusar confiar nele. O pingback (REQ-080) cobre o caso legítimo com prova.

**Como conferir que ficou fora**

- [ ] Nenhum endereço do sistema novo aceita notificação de link sem verificar a origem
- [ ] Interações já gravadas por esse protocolo continuam legíveis, e são identificáveis como de origem não verificada
- [ ] A ausência do endereço não produz erro de servidor: o pedido cai na resposta de endereço inexistente

> Conflito registrado, não resolvido. A resposta 14 de `questions.md` decidiu que nenhuma das superfícies herdadas sai e que o descarte vale como não mudar, nunca como não portar, nomeando o protocolo de notificação de link com prova de origem. Ela não menciona o protocolo sem prova, que é este card, mas a doutrina que fixa o contradiz. Vale notar que o legado já trata este canal como suspeito por desenho: ele nunca é aprovado automaticamente.

### REQ-085 — Descartar o rebaixamento para canal sem cifra após falha de negociação segura

O sistema novo não terá o comportamento de repetir a chamada ao serviço de reputação em canal sem cifra quando a negociação segura falha.

**Motivo registrado no card:** Achado de segurança registrado em `integrations.md`: após uma falha de negociação segura, o plugin grava a opção de canal desligado e passa 24 horas falando com o serviço em canal aberto — e nesse canal trafegam a credencial de API, o e-mail, o endereço de origem e o conteúdo integral de cada comentário. É o caso de `wont` mais barato do backlog: a economia é não escrever a linha, e o ganho é fechar a maior exposição de dado pessoal do sistema.

**Como conferir que ficou fora**

- [ ] Falha na negociação segura com o serviço resulta em erro da chamada, nunca em repetição sem cifra
- [ ] Nenhuma opção de configuração do sistema novo guarda o estado "canal seguro desligado"
- [ ] A falha é registrada e visível no diagnóstico do site, em lugar de ser contornada em silêncio
- [ ] Com o serviço indisponível, a decisão volta para as regras locais de moderação

> Conflito registrado, não resolvido, e explícito. A resposta 12 nomeia REQ-085 e decidiu manter o rebaixamento para canal sem cifra, com a ressalva de que é dívida herdada reproduzida de propósito e que a implantação pode fechá-la por configuração. O card diz o contrário. Veja também REQ-150, em `014-integracao-externa`, que é o mesmo descarte no canal de infraestrutura.

## Perguntas em aberto

- [ ] Conflito de escopo registrado, não resolvido. US-16 (REQ-082) e US-17 (REQ-083) especificam o comportamento do serviço externo de reputação, e a resposta 13 decidiu que ele é extensão empacotada e não núcleo: o que o porte preserva é a cascata local de moderação e o ponto de extensão que permite a um classificador externo entrar. Se a resposta valer, as duas histórias saem do clone do núcleo e viram requisito de extensão; se não valer, falta decidir a minimização que a própria resposta exige.
- [ ] REQ-069 (decidir o atalho de confiança do autor e de quem modera sob a mesma sanitização) ficou `bloqueado` e não entrou. US-4 constrói a cascata cujo primeiro passo é exatamente esse atalho, sem que nada no pacote diga qual sanitização se aplica a quem entra por ele.
- [ ] US-18 (REQ-180) serve a imagem de quem comenta sem enviar o dado dele a terceiro, e no legado essa imagem vem de um serviço externo que recebe o endereço de e-mail em forma de resumo criptográfico. É divergência deliberada do comportamento observável e precisa de decisão humana registrada (P1 da constituição).

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-065 · UC-14 | `wp-comments-post.php:25`, `wp-includes/comment.php:3936`, `wp-includes/comment.php:4022` (+1) |
| US-2 | REQ-066 · UC-14 · `domain.md §2.2` (C1) | `wp-includes/comment.php:752`, `wp-includes/comment.php:759` |
| US-3 | REQ-067 · UC-14 · `domain.md §2.2` (C2) | `wp-includes/comment.php:909`, `wp-includes/comment.php:918`, `wp-includes/comment.php:922` |
| US-4 | REQ-068 · UC-14 · `domain.md §2.2` (C4) · `domain.md §2.2` (C5) · `domain.md §2.2` (C6) · `domain.md §2.2` (C7) · `domain.md §2.2` (C9) | `wp-includes/comment.php:46`, `wp-includes/comment.php:55`, `wp-includes/comment.php:80` (+3) |
| US-5 | REQ-070 · UC-14 · `domain.md §2.2` (C10) | `wp-includes/comment.php:1319`, `wp-includes/comment.php:1339` |
| US-6 | REQ-071 · UC-14 · UC-17 · `domain.md §2.2` (C11) | `wp-includes/comment.php:3841`, `wp-admin/includes/schema.php:451` |
| US-7 | REQ-072 · UC-14 | `wp-includes/comment.php:4100`, `wp-includes/comment.php:4107`, `wp-admin/includes/schema.php:451` |
| US-8 | REQ-073 · UC-14 · UC-02 | `wp-includes/comment.php:4035`, `wp-includes/comment.php:4053`, `wp-includes/comment.php:4064` |
| US-9 | REQ-074 · UC-14 · UC-16 | `wp-includes/comment.php:2372`, `wp-includes/comment.php:3071` |
| US-10 | REQ-075 · UC-16 | `wp-admin/comment.php:84`, `wp-admin/comment.php:345`, `wp-includes/comment.php:2799` (+2) |
| US-11 | REQ-076 · UC-16 · UC-11 · `domain.md §2.4` (R6) | `wp-includes/comment.php:1691`, `wp-includes/comment.php:1755`, `wp-includes/functions.php:6997` |
| US-12 | REQ-077 · UC-14 · UC-16 · UC-18 · `domain.md §2.2` (C12) | `wp-includes/comment.php:2814`, `wp-includes/comment.php:3138` |
| US-13 | REQ-078 · UC-16 | `wp-includes/pluggable.php:2454`, `wp-admin/comment.php:284` |
| US-14 | REQ-079 · UC-18 · `domain.md §2.2` (C12) | `wp-includes/comment.php:1652`, `wp-includes/comment.php:1705`, `wp-includes/comment.php:3138` (+2) |
| US-15 | REQ-080 · UC-17 · `domain.md §2.2` (C8) | `wp-includes/comment.php:168`, `wp-includes/comment.php:3841`, `wp-includes/class-wp-xmlrpc-server.php:6974` |
| US-16 | REQ-082 · UC-15 · `domain.md §2.2` (C13) · `domain.md §2.9` (I3) | `wp-content/plugins/akismet/class.akismet.php:492`, `wp-content/plugins/akismet/class.akismet.php:866`, `wp-includes/connectors.php:239` |
| US-17 | REQ-083 · UC-15 · `domain.md §2.2` (C13) | `wp-content/plugins/akismet/class.akismet.php:866`, `wp-content/plugins/akismet/class.akismet.php:1451` |
| US-18 | REQ-180 · UC-14 · UC-01 | `wp-includes/link-template.php:4605`, `wp-includes/link-template.php:4511` |
| fora de escopo: REQ-081 | REQ-081 · UC-17 | `wp-trackback.php:33`, `wp-trackback.php:99`, `wp-includes/comment.php:169` |
| fora de escopo: REQ-085 | REQ-085 · UC-15 | `wp-content/plugins/akismet/class.akismet.php:1832`, `wp-content/plugins/akismet/class.akismet.php:1886` |
