# Identidade e acesso

**Origem:** épico EP-1 do backlog do sistema legado (`quem entra, como prova quem é, e o que cada um pode fazer`)  
**Cards:** REQ-001, REQ-002, REQ-003, REQ-006, REQ-007, REQ-009, REQ-011, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018
**Dos quais, cards de descarte (prioridade `wont`):** REQ-017, REQ-018

## Por que esta feature existe

Sem esta feature nenhuma outra tem ator. Ela responde quem entra, como prova quem é e
o que cada um pode fazer, e é a área em que errar o default produz, sem ninguém notar,
um sistema mais aberto ou mais fechado que o legado. O épico EP-1 reúne a autenticação
por login ou e-mail, o ciclo de vida da sessão, a redefinição de senha por chave com
prazo de 24 horas, o cadastro aberto pelo próprio visitante, a credencial de aplicação,
a administração de contas e, no centro, a decisão de que toda autorização é por
capacidade.

O que faz esta feature grande não é a tela de entrada: é o modelo de autorização. No
legado a definição dos papéis não é código, é dado gravado na instalação, que qualquer
extensão pode ter reescrito (ADR 0001). A capacidade sobre um objeto não é verificada
direto, é traduzida numa lista de capacidades primitivas por 86 casos de mapeamento, e é
preciso ter todas as devolvidas, não qualquer uma. E quatro capacidades que o código
exige não estão em papel algum: entram só por ponto de extensão. Quem portar lendo
apenas a matriz de papéis produz um sistema em que ninguém retoma uma extensão pausada,
e foi por isso que a resposta 3 de `questions.md` mandou declará-las explicitamente.

## Histórias de usuário

### US-1 — Autenticar conta com login ou e-mail e senha

Como pessoa com conta no site, quero provar quem sou informando login ou e-mail e a senha, para passar a agir no sistema como essa pessoa.

**Critérios de aceite**

- [ ] CA-1.1 Credencial correta cria um token de sessão e redireciona para o destino pedido ou para o painel
- [ ] CA-1.2 O mesmo par de credenciais funciona informando o login ou o endereço de e-mail, e os dois caminhos chegam ao mesmo registro
- [ ] CA-1.3 A senha é conferida contra o hash guardado; a senha em texto não é gravada em lugar algum
- [ ] CA-1.4 Uma chave de redefinição de senha pendente deixa de valer no primeiro acesso bem-sucedido
- [ ] CA-1.5 Conta de site marcado como suspenso na rede é recusada antes de o formulário ser processado

**Regras de negócio que valem aqui**

- U4 — a chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido `domain.md §2.3`
- A capacidade é a unidade real de autorização; o papel é só um atalho

### US-2 — Encerrar a sessão corrente sem afetar as outras sessões da conta

Como pessoa autenticada, quero sair deste dispositivo sem derrubar os acessos que mantenho em outros, para não perder trabalho em andamento em outro lugar.

**Critérios de aceite**

- [ ] CA-2.1 Sair destrói apenas o token da sessão corrente e limpa as credenciais guardadas no navegador
- [ ] CA-2.2 Uma sessão aberta em outro dispositivo continua autenticando depois da saída
- [ ] CA-2.3 Uma requisição feita com o token destruído é tratada como anônima

**Depende de:** US-1 (REQ-001)

### US-3 — Expirar a sessão em 2 dias, ou em 14 quando o acesso é lembrado

Como dono do site, quero que o acesso tenha prazo, para que uma sessão esquecida aberta não valha para sempre.

**Critérios de aceite**

- [ ] CA-3.1 Sem pedir para ser lembrado, a credencial do navegador é de sessão e o token vale 2 dias
- [ ] CA-3.2 Pedindo para ser lembrado, o acesso vale 14 dias
- [ ] CA-3.3 Há 12 horas de carência após o prazo, durante as quais a sessão ainda é aceita
- [ ] CA-3.4 Passada a carência, a requisição é tratada como anônima e a autenticação é exigida de novo

**Regras de negócio que valem aqui**

- U5 — sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência `domain.md §2.3`

**Depende de:** US-1 (REQ-001)

### US-4 — Redefinir a senha por chave enviada ao e-mail da conta, válida por 24 horas

Como pessoa que perdeu a senha, quero receber no meu e-mail um caminho para definir outra, para voltar a entrar sem depender de alguém.

**Critérios de aceite**

- [ ] CA-4.1 A chave é guardada com hash na conta e o valor em claro só existe no e-mail enviado
- [ ] CA-4.2 Chave com mais de 24 horas é recusada com aviso de prazo vencido e oferta de pedir outra
- [ ] CA-4.3 Um pedido novo antes do prazo substitui a chave anterior, que deixa de valer
- [ ] CA-4.4 Gravar a senha nova invalida a chave usada
- [ ] CA-4.5 Chave inválida é recusada com erro genérico

**Regras de negócio que valem aqui**

- U4 — a chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido `domain.md §2.3`

### US-5 — Informar ao titular quando o envio do e-mail de redefinição falha

Como pessoa pedindo a redefinição, quero saber que o e-mail não saiu, para não ficar esperando por uma mensagem que nunca vai chegar.

**Critérios de aceite**

- [ ] CA-5.1 Falha no envio devolve ao requisitante um aviso distinto do caso de sucesso
- [ ] CA-5.2 A falha fica registrada com instante, destinatário e motivo informado pelo canal de envio
- [ ] CA-5.3 Pedir de novo após a falha gera uma chave nova e uma tentativa nova de envio

**Regras de negócio que valem aqui**

- D3 — falha de envio de e-mail é estado, não exceção (o fluxo de privacidade já faz assim; este fluxo não faz) `domain.md §2.5`

**Depende de:** US-4 (REQ-006)

### US-6 — Permitir que o visitante crie a própria conta quando o cadastro aberto está ligado

Como visitante, quero criar uma conta no site sem pedir a ninguém, para passar a ter identidade quando o site permite isso.

**Critérios de aceite**

- [ ] CA-6.1 O cadastro aberto nasce desligado; desligado, o formulário não é oferecido e a ação é recusada
- [ ] CA-6.2 Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso
- [ ] CA-6.3 Login ou e-mail já em uso devolvem erro no formulário
- [ ] CA-6.4 A conta criada recebe o papel padrão de menor poder e nenhuma senha definida pelo titular
- [ ] CA-6.5 O titular recebe por e-mail um caminho para definir a senha, válido por 24 horas
- [ ] CA-6.6 Login constante da lista de proibidos é recusado, e a lista nasce vazia

**Regras de negócio que valem aqui**

- U1 — registro aberto é desligado por padrão e o papel de quem se registra é o de menor poder `domain.md §2.3`
- U2 — login até 60 caracteres, apelido até 50; ambos são erro, não truncamento `domain.md §2.3`
- U3 — a lista de logins proibidos é vazia por padrão `domain.md §2.3`

**Depende de:** US-4 (REQ-006)

### US-7 — Decidir toda autorização por capacidade, com papel como agrupamento de dados

Como dono do site, quero que o poder de cada pessoa seja descrito por capacidades nomeadas e agrupadas em papéis editáveis, para poder mudar quem pode o quê sem alterar código.

**Critérios de aceite**

- [ ] CA-7.1 Nenhuma decisão de autorização compara nome de papel: toda verificação pergunta por uma capacidade
- [ ] CA-7.2 O conjunto papel → capacidades é dado consultável e editável em tempo de execução, não constante de código
- [ ] CA-7.3 Uma negação explícita vence qualquer concessão, inclusive a do ator de maior poder da instalação
- [ ] CA-7.4 É possível responder, por consulta ao armazenamento, quem tem uma capacidade dada
- [ ] CA-7.5 Toda capacidade exigida em alguma verificação do sistema consta da matriz declarada

**Regras de negócio que valem aqui**

- ADR 0001 — papéis como dado mutável, não como código
- ADR 0009 — negação explícita que vence o super admin
- Pegadinha 5 — nenhuma consulta SQL responde "quem é administrador" no legado

### US-8 — Resolver permissão sobre um objeto conforme autoria e estado do objeto

Como dono do site, quero que a permissão sobre um conteúdo dependa de quem o escreveu e de em que estado ele está, para que o mesmo papel possa mexer no próprio rascunho e não no publicado de outro.

**Critérios de aceite**

- [ ] CA-8.1 Editar ou apagar um conteúdo resolve em capacidades distintas conforme o ator ser ou não o autor
- [ ] CA-8.2 Para conteúdo descartado, a permissão é decidida pelo estado que ele tinha antes do descarte
- [ ] CA-8.3 Conteúdo que não existe mais nega a ação, em lugar de permitir por omissão
- [ ] CA-8.4 Tipo ou estado não registrado nega a ação e produz aviso de uso indevido
- [ ] CA-8.5 Conteúdo com função especial declarada (página inicial, página de conteúdos, página de política) exige a capacidade declarada para essa função, somada ou em lugar da capacidade comum

**Regras de negócio que valem aqui**

- A resolução de edição depende de quem é o autor e de em que estado o conteúdo está
- D5 — a página de política de privacidade é protegida pela própria capacidade de privacidade `domain.md §2.5`

**Depende de:** US-7 (REQ-014)

### US-9 — Declarar na matriz as capacidades que o legado só concede por extensão

Como dono do site, quero que toda capacidade que o sistema exige esteja declarada em algum papel, para que não exista operação cujo responsável não exista.

**Critérios de aceite**

- [ ] CA-9.1 As quatro capacidades que no legado entram só por filtro — instalar tradução, retomar plugin pausado, retomar tema pausado e ver diagnósticos — constam de ao menos um papel ou de regra declarada
- [ ] CA-9.2 Existe ao menos um ator capaz de retomar uma extensão pausada numa instalação de fábrica
- [ ] CA-9.3 Uma verificação automatizada compara as capacidades exigidas no código com a matriz declarada e falha quando sobra alguma
- [ ] CA-9.4 Nenhuma das 93 capacidades verificadas no código fica fora da matriz

**Regras de negócio que valem aqui**

- `resume_plugins`, `resume_themes`, `install_languages` e `view_site_health_checks` não estão em papel algum: entram por filtro de prioridade 1

**Depende de:** US-7 (REQ-014)

### US-10 — Emitir e revogar credencial de aplicação, exibindo o segredo uma única vez

Como titular de uma conta, quero emitir credenciais nomeadas para programas agirem em meu nome, para não entregar a minha senha a cada integração.

**Critérios de aceite**

- [ ] CA-10.1 A credencial é gerada pelo sistema com 24 caracteres e apenas o hash é guardado
- [ ] CA-10.2 O segredo em claro é exibido uma única vez e não é recuperável depois
- [ ] CA-10.3 Revogar a credencial faz a chamada seguinte que a use deixar de autenticar
- [ ] CA-10.4 Administrar a credencial de outra conta exige a mesma permissão de editar aquela conta
- [ ] CA-10.5 Cada credencial guarda nome descritivo, instante de criação e instante do último uso

**Regras de negócio que valem aqui**

- U6 — senha de aplicação é credencial de segunda classe por desenho: 24 caracteres, hash em metadado, e sua administração reusa a permissão de editar aquele usuário `domain.md §2.3`

**Depende de:** US-9 (REQ-016)

### US-11 — Administrar contas verificando a permissão sobre cada conta alvo

Como administrador, quero criar, promover, rebaixar e remover as pessoas com acesso ao site, para controlar quem pode o quê.

**Critérios de aceite**

- [ ] CA-11.1 A permissão é verificada para a ação e, em seguida, novamente para cada conta alvo, uma a uma
- [ ] CA-11.2 Numa ação em lote, uma conta sem permissão é saltada e as demais prosseguem
- [ ] CA-11.3 Apagar conta com conteúdo exige escolher entre reatribuir o conteúdo a outra conta ou apagá-lo
- [ ] CA-11.4 Rebaixar-se é recusado se o papel novo não puder promover outras contas
- [ ] CA-11.5 Remover o próprio papel é recusado com mensagem explícita
- [ ] CA-11.6 Ao fim de qualquer operação continua havendo ao menos uma conta capaz de promover outras
- [ ] CA-11.7 Quem foi criado, promovido ou alterado é notificado por e-mail

**Regras de negócio que valem aqui**

- Pegadinha 3 — a definição de papel é um retrato tirado na instalação; depois disso o dado mutável é a verdade
- N6 — criar usuário na rede é permissão de rede, salvo opção explícita `domain.md §2.8`

**Depende de:** US-7 (REQ-014), US-9 (REQ-016)

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-017 — Descartar as pseudocapacidades de nível numérico (level_0 a level_10)

O sistema novo não terá o modelo de níveis numéricos que o legado ainda semeia em todos os papéis.

**Motivo registrado no card:** São pseudocapacidades do modelo anterior à versão 2.0, semeadas em todos os papéis por compatibilidade e não consultadas por nenhuma decisão do produto. Reescrevê-las é carregar compatibilidade com um modelo que o próprio legado abandonou há vinte anos, e inflar a matriz de permissões em 22% com linhas que não autorizam nada.

**Como conferir que ficou fora**

- [ ] Nenhum papel do sistema novo recebe capacidade cujo nome seja um nível numérico
- [ ] Nenhuma decisão de autorização compara nível numérico
- [ ] A matriz papel × capacidade do sistema novo tem 50 concessões reais, e não as 61 do legado

> Conflito registrado, não resolvido. A resposta 5 de `questions.md` fixa a matriz de fábrica como a matriz real da instalação, e a matriz de fábrica traz as 11 concessões de nível numérico que este card remove. O conteúdo da definição de papel é legível pela interface de papéis do produto, logo remover as 11 muda o que um programa de terceiro lê. As duas decisões são humanas e ninguém as reconciliou; este pacote não escolhe por ninguém.

### REQ-018 — Descartar a reposição em massa de papéis durante atualização

O sistema novo não terá o mecanismo que reescreve papéis e capacidades de todas as contas durante uma atualização.

**Motivo registrado no card:** O próprio código o declara temporário desde 2005 (`// FIXME: RESET_CAPS is temporary code`). Reescrevê-lo é reescrever a possibilidade de perder, numa atualização, toda a customização de permissões da instalação — e o ADR 0001 estabelece que essa customização é dado legítimo do produto, não resíduo. Economia dupla: não se escreve o mecanismo e não se escreve a recuperação do que ele destrói.

**Como conferir que ficou fora**

- [ ] Nenhum caminho de atualização do sistema novo reescreve a matriz papel × capacidade de contas existentes
- [ ] Uma atualização que precise acrescentar capacidade nova o faz por adição declarada e reversível, nunca por reposição total
- [ ] Uma verificação automatizada confirma que a matriz é a mesma antes e depois de uma atualização de teste

> Conflito registrado, não resolvido. O descarte é coerente com o ADR 0001 (papel é dado mutável, e a reposição em massa destrói customização legítima da instalação) e ao mesmo tempo contraria a doutrina do porte idêntico fixada pelas respostas 1 a 5, porque remove um comportamento observável do caminho de atualização. O próprio legado marca o mecanismo como temporário desde 2005, e ele continua lá.

## Perguntas em aberto

- [ ] CA-9.4 (REQ-016) exige que nenhuma das 93 capacidades verificadas no código fique fora da matriz declarada, mas a matriz de fábrica tem 50 concessões reais e `permissions.md` identifica apenas quatro ausentes que entram por ponto de extensão. Quais são as demais, e a matriz deve crescer até cobrir as 93 ou o critério deve ser reescrito para as que têm responsável? É o único critério deste pacote sem nenhum teste registrado em `backlog/tests.md`.
- [ ] US-10 (REQ-011) emite e revoga credencial de aplicação, mas quem autentica com ela é REQ-012, que ficou na coluna `refinamento` e não entrou neste pacote. Construir a emissão sem o consumo, ou esperar REQ-012? As features 013 e 015 esperam por ele.
- [ ] A credencial de aplicação do legado não tem escopo nem prazo e vale exatamente o que a conta vale (`permissions.md` 8.2). A resposta 7 decidiu que ela sobrevive à troca de senha, mas não disse se o porte lhe dá escopo. Dar escopo é divergência do idêntico e exige decisão humana registrada (P1 da constituição).
- [ ] A matriz papel por capacidade não existe como dado no legado: foi derivada executando simbolicamente as oito funções de povoamento. Se a instalação executável de referência da resposta 16 mostrar matriz diferente da derivada, qual das duas vale como oráculo?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-001 · UC-19 · `domain.md §2.3` (U4) | `wp-login.php:476`, `wp-includes/user.php:41`, `wp-includes/user.php:117` (+2) |
| US-2 | REQ-002 · UC-19 | `wp-includes/pluggable.php:1088`, `wp-login.php:794` |
| US-3 | REQ-003 · UC-19 · `domain.md §2.3` (U5) | `wp-includes/pluggable.php:1082`, `wp-includes/pluggable.php:1088`, `wp-includes/pluggable.php:1091` |
| US-4 | REQ-006 · UC-20 · `domain.md §2.3` (U4) | `wp-login.php:830`, `wp-login.php:932`, `wp-includes/user.php:3204` (+2) |
| US-5 | REQ-007 · UC-20 · `domain.md §2.5` (D3) | `wp-login.php:830`, `wp-admin/includes/privacy-tools.php:226` |
| US-6 | REQ-009 · UC-21 · `domain.md §2.3` (U1) · `domain.md §2.3` (U2) · `domain.md §2.3` (U3) | `wp-login.php:1095`, `wp-includes/user.php:2318`, `wp-includes/user.php:2336` (+4) |
| US-7 | REQ-014 · UC-24 · UC-07 · UC-43 | `wp-includes/capabilities.php:45`, `wp-admin/includes/schema.php:738`, `wp-includes/class-wp-user.php:797` (+1) |
| US-8 | REQ-015 · UC-03 · UC-07 · UC-09 · UC-10 · `domain.md §2.5` (D5) | `wp-includes/capabilities.php:149`, `wp-includes/capabilities.php:103`, `wp-includes/capabilities.php:113` (+1) |
| US-9 | REQ-016 · UC-36 · UC-32 · UC-37 | `wp-includes/capabilities.php:1325`, `wp-includes/capabilities.php:1356`, `wp-admin/includes/schema.php:797` |
| US-10 | REQ-011 · UC-22 · `domain.md §2.3` (U6) | `wp-includes/class-wp-application-passwords.php:24`, `wp-includes/class-wp-application-passwords.php:42`, `wp-includes/class-wp-application-passwords.php:98` (+1) |
| US-11 | REQ-013 · UC-24 · `domain.md §2.8` (N6) | `wp-admin/users.php:13`, `wp-admin/users.php:142`, `wp-admin/users.php:199` (+4) |
| fora de escopo: REQ-017 | REQ-017 · UC-24 | `wp-admin/includes/schema.php:779`, `wp-admin/includes/schema.php:789` |
| fora de escopo: REQ-018 | REQ-018 · UC-34 | `wp-admin/includes/upgrade.php:1203` |
