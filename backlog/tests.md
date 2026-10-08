# Plano de teste do backlog

Cada card do backlog passou a dizer também **como se prova que o requisito foi cumprido**. A lista de testes mora dentro do próprio card, em [`backlog.json`](backlog.json); este documento é a mesma lista em leitura corrida, agrupada por épico.

Os testes descrevem **comportamento observável** do sistema novo — uma regra, um cálculo, uma decisão. Nenhum deles cita arquivo, classe ou framework: a stack do sistema novo ainda não foi escolhida. Tudo o que é externo entra como dublê, e nenhum teste depende de banco, de rede, de navegador ou de relógio real.

## 1. Visão geral

| Medida | Valor |
|---|---|
| Cards no backlog | 181 |
| Cards com teste | 166 |
| Testes de unidade escritos | 985 |
| Critérios de aceite no backlog | 804 |
| Critérios de aceite com ao menos um teste | 743 |
| Achados do QA | 83 |
| Comportamentos que exigem teste de integração | 8 |

### 1.1 Testes por tipo

| Tipo | Testes | O que o tipo cobre |
|---|---:|---|
| `feliz` | 490 | o caminho que o ator espera, com entrada válida |
| `borda` | 211 | o limite exato e o primeiro passo além dele: zero, vazio, máximo, expirado, duplicado |
| `erro` | 284 | entrada inválida, permissão ausente, dependência indisponível |

### 1.2 Cards por veredito

| Veredito | Cards | Significado |
|---|---:|---|
| `aprovado` | 141 | todo critério de aceite e toda regra de negócio têm teste |
| `parcial` | 25 | sobrou critério ou regra sem teste de unidade possível; os achados explicam cada um |
| `sem-criterio` | 0 | o card não tem critério de aceite verificável |
| `fora-de-escopo` | 15 | card `wont`: não se testa o que não vai ser escrito |

### 1.3 Comportamentos que exigem teste de integração

Estes critérios de aceite não têm teste de unidade possível: provar cada um exige o sistema de pé. Não foram inventados testes para eles — são o trabalho de integração que o time descobriu antes de escrever a primeira linha.

| Card | Critério | Por quê |
|---|---|---|
| [REQ-004](#req-004) | AC2 | equivalência de tempo de parede só se prova medindo execuções reais, e teste de unidade roda sem relógio real |
| [REQ-010](#req-010) | AC1, AC2 | os dois pedem recusa pelo armazenamento, não pela tela, e isso só se prova contra um banco real com a restrição de unicidade aplicada. Teste de unidade roda sem banco |
| [REQ-016](#req-016) | AC4 | o critério fala do resultado da varredura sobre a árvore inteira do sistema novo, não do comportamento do conferidor. O comportamento do conferidor é provado por UT-016-3; a varredura em si pertence ao passo de integração contínua |
| [REQ-032](#req-032) | AC4 | provar paridade entre dois lados exige executar os dois, e o lado cliente não existe nesta árvore — `wp-includes/js/dist/` está ausente, conforme `_reversa_sdd/editor-de-blocos/questions.md` Q-02 |
| [REQ-092](#req-092) | AC2 | é propriedade do ambiente de implantação, e se prova contra um servidor real pedindo o caminho do arquivo, não por teste de unidade |
| [REQ-169](#req-169) | AC2 | o critério fala do comportamento do banco sob restrição aplicada, e isso só se prova contra um banco real. UT-169-4 prova que a declaração existe no esquema; que o banco a aplica é outra coisa |
| [REQ-177](#req-177) | AC3 | a preservação acontece no navegador, entre duas navegações, e nenhum teste de unidade do lado do servidor a alcança |

---

## EP-1 — Identidade e acesso

Quem entra, como prova quem é, e o que cada um pode fazer

18 cards · 88 testes de unidade

### REQ-001 — Autenticar conta com login ou e-mail e senha

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-001-1` | cria sessão e leva ao destino pedido quando a credencial confere | `feliz` | Credencial correta cria um token de sessão e redireciona para o destino pedido ou para o painel |
| `UT-001-2` | chega ao mesmo registro informando o login ou o endereço de e-mail | `feliz` | O mesmo par de credenciais funciona informando o login ou o endereço de e-mail, e os dois caminhos chegam ao mesmo registro |
| `UT-001-3` | confere a senha contra o hash guardado sem gravar o texto informado | `feliz` | A senha é conferida contra o hash guardado; a senha em texto não é gravada em lugar algum |
| `UT-001-4` | recusa a credencial cuja senha não confere com o hash | `erro` | A senha é conferida contra o hash guardado; a senha em texto não é gravada em lugar algum |
| `UT-001-5` | invalida a chave de redefinição pendente no primeiro acesso bem-sucedido | `borda` | Uma chave de redefinição de senha pendente deixa de valer no primeiro acesso bem-sucedido |
| `UT-001-6` | recusa a conta de site suspenso antes de processar o formulário | `erro` | Conta de site marcado como suspenso na rede é recusada antes de o formulário ser processado |
| `UT-001-7` | aceita a chave de redefinição no limite de 24 horas e recusa depois dele | `borda` | U4 — a chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido |
| `UT-001-8` | resolve o poder da sessão criada por capacidade, não pelo nome do papel | `feliz` | A capacidade é a unidade real de autorização; o papel é só um atalho |

### REQ-002 — Encerrar a sessão corrente sem afetar as outras sessões da conta

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-002-1` | destrói apenas o token da sessão corrente ao sair | `feliz` | Sair destrói apenas o token da sessão corrente e limpa as credenciais guardadas no navegador |
| `UT-002-2` | mantém autenticando a sessão aberta em outro dispositivo | `feliz` | Uma sessão aberta em outro dispositivo continua autenticando depois da saída |
| `UT-002-3` | trata como anônima a requisição feita com o token destruído | `erro` | Uma requisição feita com o token destruído é tratada como anônima |

### REQ-003 — Expirar a sessão em 2 dias, ou em 14 quando o acesso é lembrado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-003-1` | emite credencial de sessão com token de 2 dias quando o acesso não é lembrado | `feliz` | Sem pedir para ser lembrado, a credencial do navegador é de sessão e o token vale 2 dias |
| `UT-003-2` | estende o acesso para 14 dias quando a lembrança é pedida | `feliz` | Pedindo para ser lembrado, o acesso vale 14 dias |
| `UT-003-3` | aceita a sessão dentro das 12 horas de carência após o prazo | `borda` | Há 12 horas de carência após o prazo, durante as quais a sessão ainda é aceita |
| `UT-003-4` | exige autenticação de novo quando a carência já passou | `erro` | Passada a carência, a requisição é tratada como anônima e a autenticação é exigida de novo |
| `UT-003-5` | mantém o token válido no último instante do prazo e o invalida no primeiro instante além dele | `borda` | U5 — sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência |

### REQ-004 — Recusar autenticação sem revelar se a conta existe

`should` · `bloqueado` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-004-1` | devolve a mesma recusa para login inexistente e para senha errada | `erro` | Login inexistente e senha errada produzem a mesma mensagem ao requisitante |
| `UT-004-2` | responde igual ao pedido de redefinição para endereço cadastrado e não cadastrado | `erro` | O pedido de redefinição de senha responde igual para endereço cadastrado e não cadastrado |
| `UT-004-3` | registra internamente qual das duas causas recusou o acesso | `feliz` | O caso real continua distinguível em registro interno, para quem opera o site |

**Achados do QA**

- AC2 (tempo de resposta indistinguível) exige teste de integração: equivalência de tempo de parede só se prova medindo execuções reais, e teste de unidade roda sem relógio real.
- Card bloqueado por decisão humana, não por lacuna de investigação: o legado faz o contrário em dois pontos (mensagem de conta inexistente distinta em UC-19; formulário de recuperação informa a inexistência em UC-20). Enquanto produto e segurança não decidirem, estes testes descrevem comportamento que o sistema de origem não tem.

### REQ-005 — Suspender o acesso após tentativas falhas repetidas

`should` · `bloqueado` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-005-1` | aceita a última tentativa permitida dentro da janela declarada | `borda` | Atingido o limite de tentativas falhas numa janela declarada, a conta recusa novas tentativas por um prazo declarado |
| `UT-005-2` | recusa novas tentativas pelo prazo declarado ao atingir o limite | `borda` | Atingido o limite de tentativas falhas numa janela declarada, a conta recusa novas tentativas por um prazo declarado |
| `UT-005-3` | recusa a chamada não interativa pelo mesmo contador do formulário | `erro` | A suspensão vale para o formulário de acesso e para a autenticação de chamada não interativa, com o mesmo contador |
| `UT-005-4` | zera o contador quando uma tentativa acerta antes do limite | `feliz` | Uma tentativa bem-sucedida antes do limite zera o contador |
| `UT-005-5` | registra cada suspensão com instante, conta e origem da tentativa | `feliz` | Cada suspensão fica registrada com instante, conta e origem da tentativa |

**Achados do QA**

- O limiar e a janela ainda não têm valor decidido: os testes de borda são escritos contra o limite declarado na configuração, e só fecham quando produto definir o número. `_reversa_sdd/rest-api/questions.md` Q-03 registra que não há log algum nesta árvore para dimensioná-lo.

### REQ-006 — Redefinir a senha por chave enviada ao e-mail da conta, válida por 24 horas

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-006-1` | guarda a chave com hash e deixa o valor em claro apenas na mensagem enviada | `feliz` | A chave é guardada com hash na conta e o valor em claro só existe no e-mail enviado |
| `UT-006-2` | recusa a chave com mais de 24 horas oferecendo pedir outra | `borda` | Chave com mais de 24 horas é recusada com aviso de prazo vencido e oferta de pedir outra |
| `UT-006-3` | invalida a chave anterior quando um pedido novo chega antes do prazo | `borda` | Um pedido novo antes do prazo substitui a chave anterior, que deixa de valer |
| `UT-006-4` | invalida a chave usada ao gravar a senha nova | `feliz` | Gravar a senha nova invalida a chave usada |
| `UT-006-5` | recusa chave inválida com erro genérico | `erro` | Chave inválida é recusada com erro genérico |
| `UT-006-6` | aceita a chave no último instante das 24 horas | `borda` | U4 — a chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido |

### REQ-007 — Informar ao titular quando o envio do e-mail de redefinição falha

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-007-1` | devolve aviso distinto do caso de sucesso quando o envio falha | `erro` | Falha no envio devolve ao requisitante um aviso distinto do caso de sucesso |
| `UT-007-2` | registra a falha com instante, destinatário e motivo do canal | `erro` | A falha fica registrada com instante, destinatário e motivo informado pelo canal de envio |
| `UT-007-3` | gera chave nova e tentativa nova de envio quando o pedido é repetido | `feliz` | Pedir de novo após a falha gera uma chave nova e uma tentativa nova de envio |
| `UT-007-4` | trata a falha de envio como resultado declarado do pedido, não como exceção que aborta | `erro` | D3 — falha de envio de e-mail é estado, não exceção (o fluxo de privacidade já faz assim; este fluxo não faz) |

### REQ-008 — Encerrar as sessões abertas quando a senha da conta é trocada

`should` · `bloqueado` · veredito `parcial` · 2 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-008-1` | invalida todos os tokens da conta menos o da sessão que trocou a senha | `feliz` | Gravar senha nova invalida todos os tokens de sessão da conta, exceto o da sessão que fez a troca |
| `UT-008-2` | trata como anônima a requisição com token anterior à troca | `erro` | Uma requisição feita com token anterior à troca é tratada como anônima |

**Achados do QA**

- AC3 não tem comportamento a provar: o próprio critério delega a decisão sobre o destino das senhas de aplicação ao card, e ela não está registrada. Enquanto a decisão humana não for tomada, não há resultado esperado contra o qual escrever o teste.
- Card bloqueado por divergência deliberada do legado: UC-20 registra que a troca de senha não encerra as sessões abertas. Os dois testes acima descrevem o sistema novo, não o de origem.

### REQ-009 — Permitir que o visitante crie a própria conta quando o cadastro aberto está ligado

`should` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-009-1` | recusa o cadastro quando o registro aberto está desligado | `erro` | O cadastro aberto nasce desligado; desligado, o formulário não é oferecido e a ação é recusada |
| `UT-009-2` | aceita login de 60 e apelido de 50 caracteres e recusa o primeiro caractere além | `borda` | Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso |
| `UT-009-3` | recusa no formulário o login ou o e-mail já em uso | `erro` | Login ou e-mail já em uso devolvem erro no formulário |
| `UT-009-4` | cria a conta com o papel de menor poder e sem senha definida pelo titular | `feliz` | A conta criada recebe o papel padrão de menor poder e nenhuma senha definida pelo titular |
| `UT-009-5` | emite caminho de definição de senha que vale 24 horas | `borda` | O titular recebe por e-mail um caminho para definir a senha, válido por 24 horas |
| `UT-009-6` | recusa login que consta da lista de proibidos | `erro` | Login constante da lista de proibidos é recusado, e a lista nasce vazia |
| `UT-009-7` | mantém o registro aberto desligado e o papel de menor poder como valores de fábrica | `feliz` | U1 — registro aberto é desligado por padrão e o papel de quem se registra é o de menor poder |
| `UT-009-8` | aceita qualquer login quando a lista de proibidos está vazia | `borda` | U3 — a lista de logins proibidos é vazia por padrão |

**Achados do QA**

- BR2 (U2 — login até 60, apelido até 50, erro e não truncamento) ficou sem teste próprio: o teto de oito testes por card foi atingido e o comportamento é integralmente provado por UT-009-2. O card tem 6 critérios e 3 regras, isto é, nove unidades de prova — sinal de que ele é grande demais.

### REQ-010 — Garantir no armazenamento que login e e-mail de conta são únicos

`must` · `bloqueado` · veredito `parcial` · 2 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-010-1` | traduz a recusa de unicidade do armazenamento em erro de campo em uso | `erro` | A recusa chega ao requisitante como erro de campo em uso, não como falha interna |
| `UT-010-2` | interrompe a importação em massa diante de duplicata sem decisão registrada | `erro` | A importação em massa de contas não pode criar duplicata sem decisão explícita registrada |
| `UT-010-3` | recusa a duplicata em código antes de chegar ao armazenamento | `erro` | U2 — a unicidade de login e e-mail é verificada em código; o banco permite duplicata |

**Achados do QA**

- AC1 e AC2 exigem teste de integração: os dois pedem recusa pelo armazenamento, não pela tela, e isso só se prova contra um banco real com a restrição de unicidade aplicada. Teste de unidade roda sem banco.
- Card bloqueado por lacuna aberta: `_reversa_sdd/usuarios-e-perfis/questions.md` Q-02 pergunta se existem e-mails duplicados na base real, e não há banco nesta árvore para responder. Se existirem, AC4 depende de um passo de resolução humana que ainda não foi especificado.

### REQ-011 — Emitir e revogar credencial de aplicação, exibindo o segredo uma única vez

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-011-1` | gera credencial de 24 caracteres guardando apenas o hash | `feliz` | A credencial é gerada pelo sistema com 24 caracteres e apenas o hash é guardado |
| `UT-011-2` | devolve o segredo em claro uma única vez e não o recupera depois | `borda` | O segredo em claro é exibido uma única vez e não é recuperável depois |
| `UT-011-3` | faz a chamada seguinte deixar de autenticar quando a credencial é revogada | `erro` | Revogar a credencial faz a chamada seguinte que a use deixar de autenticar |
| `UT-011-4` | recusa administrar a credencial de outra conta sem a permissão de editá-la | `erro` | Administrar a credencial de outra conta exige a mesma permissão de editar aquela conta |
| `UT-011-5` | guarda nome descritivo, instante de criação e instante do último uso | `feliz` | Cada credencial guarda nome descritivo, instante de criação e instante do último uso |
| `UT-011-6` | gera o segredo pelo sistema em lugar de aceitar o escolhido pelo ator | `feliz` | U6 — senha de aplicação é credencial de segunda classe por desenho: 24 caracteres, hash em metadado, e sua administração reusa a permissão de editar aquele usuário |

### REQ-012 — Autenticar chamada não interativa por credencial de aplicação

`must` · `refinamento` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-012-1` | compara a credencial informada com cada credencial ativa da conta quando não há sessão | `feliz` | Sem sessão de navegador, a credencial informada na requisição é comparada com cada credencial ativa da conta |
| `UT-012-2` | registra o instante e o programa que chamou no uso bem-sucedido | `feliz` | O uso bem-sucedido registra o instante e o programa que chamou |
| `UT-012-3` | prossegue com a identidade do titular sem reduzir permissão por ser chamada de programa | `feliz` | A requisição prossegue com a identidade do titular, sem redução de permissão por ser chamada de programa |
| `UT-012-4` | segue anônima quando a credencial é inválida, deixando a recusa para o portão da operação | `erro` | Credencial inválida não é, por si, resposta de erro: a requisição segue anônima e a recusa vem do portão da operação pedida |
| `UT-012-5` | abandona a tentativa sem erro quando a conta não tem credencial alguma | `borda` | Conta sem nenhuma credencial de aplicação faz a tentativa ser abandonada sem erro |
| `UT-012-6` | mantém a credencial válida entre chamadas, sem prazo de sessão de navegador | `feliz` | U6 — a senha de aplicação é a credencial de longa duração para chamada não interativa |
| `UT-012-7` | resolve o mesmo conjunto de capacidades pelos dois caminhos de autenticação | `feliz` | Autenticar com senha de aplicação não reduz as capacidades do usuário |

**Achados do QA**

- Confiança herdada de UC-23, o único caso de uso inferido deste percurso: o fluxo foi lido no código e nenhuma chamada real foi observada. Estes testes descrevem o comportamento lido; confirmá-los contra uma chamada real é condição para o card sair de refinamento.

### REQ-013 — Administrar contas verificando a permissão sobre cada conta alvo

`must` · `pronto` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-013-1` | verifica a permissão da ação e depois a de cada conta alvo | `feliz` | A permissão é verificada para a ação e, em seguida, novamente para cada conta alvo, uma a uma |
| `UT-013-2` | salta a conta sem permissão e prossegue com as demais no lote | `borda` | Numa ação em lote, uma conta sem permissão é saltada e as demais prosseguem |
| `UT-013-3` | recusa apagar conta com conteúdo sem escolha entre reatribuir e apagar | `erro` | Apagar conta com conteúdo exige escolher entre reatribuir o conteúdo a outra conta ou apagá-lo |
| `UT-013-4` | recusa o rebaixamento quando o papel novo não promove outras contas | `erro` | Rebaixar-se é recusado se o papel novo não puder promover outras contas |
| `UT-013-5` | recusa com mensagem explícita a remoção do próprio papel | `erro` | Remover o próprio papel é recusado com mensagem explícita |
| `UT-013-6` | impede a operação que deixaria a instalação sem ninguém capaz de promover | `borda` | Ao fim de qualquer operação continua havendo ao menos uma conta capaz de promover outras |
| `UT-013-7` | notifica por e-mail quem foi criado, promovido ou alterado | `feliz` | Quem foi criado, promovido ou alterado é notificado por e-mail |
| `UT-013-8` | exige permissão de rede para criar conta, salvo opção explícita da rede | `erro` | N6 — criar usuário na rede é permissão de rede, salvo opção explícita |

**Achados do QA**

- BR1 (Pegadinha 3 — a definição de papel é um retrato tirado na instalação e o dado mutável é a verdade) ficou sem teste próprio neste card: o teto de oito testes foi atingido. O comportamento é provado em REQ-014, por UT-014-2 e UT-014-6.

### REQ-014 — Decidir toda autorização por capacidade, com papel como agrupamento de dados

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-014-1` | decide a autorização perguntando por capacidade, nunca comparando nome de papel | `feliz` | Nenhuma decisão de autorização compara nome de papel: toda verificação pergunta por uma capacidade |
| `UT-014-2` | muda o que um papel pode ao editar o conjunto papel-capacidades em execução | `feliz` | O conjunto papel → capacidades é dado consultável e editável em tempo de execução, não constante de código |
| `UT-014-3` | faz a negação explícita vencer a concessão, inclusive a do ator de maior poder | `erro` | Uma negação explícita vence qualquer concessão, inclusive a do ator de maior poder da instalação |
| `UT-014-4` | responde quem tem uma capacidade dada por consulta ao armazenamento | `feliz` | É possível responder, por consulta ao armazenamento, quem tem uma capacidade dada |
| `UT-014-5` | reporta lista vazia ao confrontar as capacidades exigidas com a matriz declarada | `borda` | Toda capacidade exigida em alguma verificação do sistema consta da matriz declarada |
| `UT-014-6` | preserva a customização de permissões porque o papel é dado, não constante de código | `feliz` | ADR 0001 — papéis como dado mutável, não como código |
| `UT-014-7` | mantém a negação explícita quando a concessão vem de ponto de extensão | `erro` | ADR 0009 — negação explícita que vence o super admin |
| `UT-014-8` | responde quem administra sem interpretar valor serializado opaco | `feliz` | Pegadinha 5 — nenhuma consulta SQL responde "quem é administrador" no legado |

### REQ-015 — Resolver permissão sobre um objeto conforme autoria e estado do objeto

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-015-1` | resolve em capacidades distintas conforme o ator ser ou não o autor | `feliz` | Editar ou apagar um conteúdo resolve em capacidades distintas conforme o ator ser ou não o autor |
| `UT-015-2` | decide a permissão sobre conteúdo descartado pelo estado anterior ao descarte | `feliz` | Para conteúdo descartado, a permissão é decidida pelo estado que ele tinha antes do descarte |
| `UT-015-3` | nega a ação quando o conteúdo não existe mais, em lugar de permitir por omissão | `erro` | Conteúdo que não existe mais nega a ação, em lugar de permitir por omissão |
| `UT-015-4` | nega e avisa de uso indevido quando o tipo ou o estado não é registrado | `erro` | Tipo ou estado não registrado nega a ação e produz aviso de uso indevido |
| `UT-015-5` | exige a capacidade declarada da função especial do conteúdo | `feliz` | Conteúdo com função especial declarada (página inicial, página de conteúdos, página de política) exige a capacidade declarada para essa função, somada ou em lugar da capacidade comum |
| `UT-015-6` | distingue rascunho próprio de publicado alheio na mesma operação | `feliz` | A resolução de edição depende de quem é o autor e de em que estado o conteúdo está |
| `UT-015-7` | soma a capacidade de privacidade na página de política | `erro` | D5 — a página de política de privacidade é protegida pela própria capacidade de privacidade |

### REQ-016 — Declarar na matriz as capacidades que o legado só concede por extensão

`must` · `pronto` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-016-1` | encontra em algum papel ou regra declarada as quatro capacidades que o legado concede por filtro | `feliz` | As quatro capacidades que no legado entram só por filtro — instalar tradução, retomar plugin pausado, retomar tema pausado e ver diagnósticos — constam de ao menos um papel ou de regra declarada |
| `UT-016-2` | encontra ator capaz de retomar extensão pausada numa instalação de fábrica | `borda` | Existe ao menos um ator capaz de retomar uma extensão pausada numa instalação de fábrica |
| `UT-016-3` | passa a conferência quando a matriz declara todas as capacidades exigidas | `borda` | Uma verificação automatizada compara as capacidades exigidas no código com a matriz declarada e falha quando sobra alguma |
| `UT-016-4` | falha a conferência nomeando a capacidade exigida que ficou fora da matriz | `erro` | Uma verificação automatizada compara as capacidades exigidas no código com a matriz declarada e falha quando sobra alguma |
| `UT-016-5` | mantém as quatro capacidades fora de ponto de extensão como fonte de concessão | `feliz` | `resume_plugins`, `resume_themes`, `install_languages` e `view_site_health_checks` não estão em papel algum: entram por filtro de prioridade 1 |

**Achados do QA**

- AC4 (nenhuma das 93 capacidades verificadas no código fica fora da matriz) exige teste de integração: o critério fala do resultado da varredura sobre a árvore inteira do sistema novo, não do comportamento do conferidor. O comportamento do conferidor é provado por UT-016-3; a varredura em si pertence ao passo de integração contínua.

### REQ-017 — Descartar as pseudocapacidades de nível numérico (level_0 a level_10)

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC3 fixa um número de verificação (50 concessões reais em lugar de 61): não é teste deste card, e sim uma asserção sobre a matriz do sistema novo, que REQ-014 e REQ-016 já exercitam.

### REQ-018 — Descartar a reposição em massa de papéis durante atualização

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC3 pede verificação automatizada de que a matriz papel x capacidade é a mesma antes e depois de uma atualização. É obrigação de prova que sobrevive ao descarte do mecanismo e pertence à suíte de paridade de REQ-163, não a um teste de unidade deste card.

---

## EP-2 — Autoria e publicação

Escrever conteúdo e levá-lo ao público, por decisão explícita

14 cards · 78 testes de unidade

### REQ-019 — Publicar conteúdo próprio por ato explícito

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-019-1` | recusa a publicação de quem não tem a capacidade de publicar aquele tipo | `erro` | A publicação exige a capacidade de publicar aquele tipo de conteúdo; sem ela a ação é recusada com 403 na API e com recusa explícita na tela |
| `UT-019-2` | grava o estado publicado disparando a transição uma única vez | `feliz` | Publicar grava o estado publicado e dispara a transição de estado uma única vez |
| `UT-019-3` | passa a devolver o conteúdo na consulta pública com endereço definitivo | `feliz` | O conteúdo publicado passa a aparecer na consulta pública e tem endereço definitivo |
| `UT-019-4` | atribui termo em toda taxonomia que declare um padrão ao fim da publicação | `feliz` | Toda taxonomia que declare termo padrão fica com ao menos um termo atribuído ao fim da publicação |
| `UT-019-5` | remove o evento de publicação agendada pendente do conteúdo publicado | `feliz` | Evento de publicação agendada pendente para aquele conteúdo é removido |
| `UT-019-6` | grava o estado publicado somente pelo comando de publicar | `feliz` | P1 — publicar é ato explícito |
| `UT-019-7` | deixa o conteúdo do tipo padrão sempre com categoria ao fim da publicação | `borda` | P3 — conteúdo do tipo padrão sempre tem categoria |
| `UT-019-8` | não dispara a transição uma segunda vez ao republicar o já publicado | `borda` | P7 — republicar é operação nula |

### REQ-020 — Gravar rascunho quando o estado não é informado

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-020-1` | grava rascunho quando o estado não é informado | `feliz` | Gravar conteúdo sem informar o estado resulta em rascunho, nunca em publicado |
| `UT-020-2` | mantém a omissão sem publicar em todo caminho de escrita | `borda` | O default do armazenamento não contradiz esta regra: não existe caminho em que a omissão publique |
| `UT-020-3` | mantém o rascunho fora de toda consulta pública | `feliz` | Conteúdo em rascunho não aparece em consulta pública alguma |
| `UT-020-4` | faz a escrita vencer o valor de fábrica do armazenamento na mesma coluna | `borda` | P1 — publicar é ato explícito: a escrita grava rascunho quando o estado não é informado, enquanto o default do esquema é publicado. Duas regras para a mesma coluna, dependendo de quem escreve |

**Achados do QA**

- Card `must` sem teste de erro: os três critérios descrevem uma invariante de escrita e não há entrada inválida nem permissão ausente própria deste card. A recusa por falta de capacidade de publicar está em REQ-019 (UT-019-1).

### REQ-021 — Exigir identificador único na URL só a partir da publicação

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-021-1` | aceita identificadores de URL repetidos em rascunho, pendente e rascunho automático | `borda` | Em rascunho, pendente e rascunho automático, identificadores de URL repetidos são aceitos |
| `UT-021-2` | torna o identificador único na publicação | `feliz` | Na publicação, o identificador é tornado único e o conteúdo passa a responder nesse endereço |
| `UT-021-3` | informa o autor quando o identificador muda na publicação | `feliz` | O autor é informado quando o identificador muda na publicação, em lugar de descobrir pelo endereço quebrado |
| `UT-021-4` | deixa vazio o identificador do pendente de quem não pode publicar | `borda` | Em conteúdo pendente de quem não pode publicar, o identificador fica vazio e só é atribuído na publicação |
| `UT-021-5` | descarta o identificador escolhido por quem não pode publicar | `erro` | P4 — colaborador não escolhe a URL do que está em revisão |
| `UT-021-6` | muda sozinho o identificador do rascunho duplicado no instante da publicação | `borda` | P5 — rascunho pode ter identificador duplicado; publicado, não. O identificador do rascunho muda sozinho ao publicar |

### REQ-022 — Publicar conteúdo como privado, visível só a quem tem a permissão declarada

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-022-1` | grava estado distinto de publicado quando a visibilidade escolhida é privada | `feliz` | Escolher visibilidade privada grava um estado distinto de publicado |
| `UT-022-2` | recusa a leitura de conteúdo privado a quem não pode ler privado | `erro` | O conteúdo privado exige, para leitura, a capacidade de ler conteúdo privado |
| `UT-022-3` | devolve ao anônimo a mesma resposta que daria para conteúdo inexistente | `erro` | Visitante anônimo recebe a mesma resposta que receberia para conteúdo inexistente |
| `UT-022-4` | mantém o conteúdo privado fora de listagem, feed e sitemap | `feliz` | O conteúdo privado não aparece em listagem pública, feed nem sitemap |

### REQ-023 — Tratar a republicação do que já está publicado como operação sem efeito

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-023-1` | retorna sucesso sem alterar o registro ao republicar o já publicado | `borda` | Pedir a publicação de conteúdo já publicado retorna sucesso sem alterar o registro |
| `UT-023-2` | não dispara transição de estado nesse caminho | `borda` | Nenhuma transição de estado é disparada nesse caminho |
| `UT-023-3` | não aciona notificação, agendamento nem automação ligada à publicação | `feliz` | Nenhuma notificação, nenhum agendamento e nenhuma automação ligada à publicação é acionada |
| `UT-023-4` | mantém efeito único quando a publicação é pedida muitas vezes seguidas | `borda` | P7 — republicar é operação nula: nenhum gancho de transição dispara |

### REQ-024 — Agendar a publicação para data futura, com verificação dupla na hora de publicar

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-024-1` | converte para agendado a partir de 60 segundos de diferença, e não antes | `borda` | Salvar conteúdo publicado com data mais de 60 segundos à frente do instante atual resulta em estado agendado, sem comando próprio |
| `UT-024-2` | publica na hora o conteúdo agendado salvo com data no passado | `feliz` | Salvar conteúdo agendado com data no passado o publica na hora, pela mesma comparação |
| `UT-024-3` | recusa publicar o que já não está em estado agendado | `erro` | Na hora de publicar, o sistema recusa publicar o que não está mais em estado agendado |
| `UT-024-4` | reagenda em lugar de publicar quando a data ainda não chegou | `borda` | Se a data ainda não chegou quando o evento roda, o evento é reagendado em lugar de publicar |
| `UT-024-5` | limpa o evento pendente em qualquer transição de estado do conteúdo | `feliz` | Qualquer transição de estado do conteúdo limpa o evento pendente |
| `UT-024-6` | exige as duas verificações para publicar: o evento e o estado corrente | `borda` | P6 — agendamento é guardado por verificação dupla |
| `UT-024-7` | decide o estado pela comparação de data, sem ninguém comandar a conversão | `feliz` | ADR 0005 — agendamento por comparação de data, não por transição |

### REQ-025 — Submeter conteúdo próprio para revisão de quem pode publicar

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-025-1` | envia para pendente o conteúdo de quem escreve e não publica | `feliz` | Quem tem permissão de escrever e não tem de publicar envia o conteúdo para o estado pendente |
| `UT-025-2` | apresenta o pendente na fila de quem pode publicar aquele tipo | `feliz` | O conteúdo pendente aparece na fila de quem pode publicar aquele tipo |
| `UT-025-3` | mantém o pendente fora de toda consulta pública | `feliz` | O conteúdo pendente não aparece em consulta pública alguma |
| `UT-025-4` | deixa vazio o identificador de quem não pode publicar | `borda` | Quem não pode publicar não reserva endereço: o identificador de URL fica vazio |
| `UT-025-5` | mantém o identificador escolhido por quem pode publicar e ainda assim submete | `feliz` | Quem pode publicar e ainda assim envia para revisão mantém o identificador escolhido |
| `UT-025-6` | recusa a leitura do pendente alheio a quem não pode editá-lo | `erro` | Ler o conteúdo pendente de outra pessoa exige poder editá-lo |
| `UT-025-7` | ignora o identificador informado por quem está em revisão sem poder publicar | `erro` | P4 — colaborador não escolhe a URL do que está em revisão |
| `UT-025-8` | aceita identificador repetido entre dois conteúdos pendentes | `borda` | P5 — a unicidade do identificador é dispensada em pendente |

### REQ-026 — Revisar e publicar conteúdo de outro autor preservando a autoria original

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-026-1` | soma a capacidade de mexer em conteúdo alheio à exigida pelo estado | `feliz` | A autorização soma a capacidade de mexer em conteúdo alheio à capacidade exigida pelo estado do conteúdo |
| `UT-026-2` | mantém o autor original gravado ao publicar conteúdo de outra pessoa | `feliz` | A publicação mantém o autor original gravado no registro |
| `UT-026-3` | fixa na publicação o identificador que estava vazio no pendente de colaborador | `feliz` | O identificador de URL, vazio no pendente de colaborador, é fixado na publicação |
| `UT-026-4` | devolve ao autor voltando para rascunho sem perder o texto | `feliz` | Devolver o conteúdo ao autor volta o estado para rascunho sem perder o texto |
| `UT-026-5` | resolve o conteúdo hierárquico numa família de capacidades distinta da do conteúdo em linha do tempo | `feliz` | Conteúdo hierárquico (página) resolve numa família de capacidades distinta da do conteúdo em linha do tempo |
| `UT-026-6` | recusa o editor sem a capacidade declarada da função especial do conteúdo | `erro` | Conteúdo com função especial declarada exige a capacidade dessa função, que o papel editorial pode não ter |
| `UT-026-7` | nega ao autor e ao colaborador qualquer capacidade de página | `erro` | Nenhuma capacidade de página chega a autor ou colaborador: a assimetria é deliberada |
| `UT-026-8` | resolve capacidades diferentes para o pendente e para o publicado do mesmo autor | `feliz` | A resolução de edição depende de quem é o autor e de em que estado o conteúdo está |

### REQ-027 — Notificar o autor quando o conteúdo é devolvido ou publicado por outra pessoa

`could` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-027-1` | avisa o autor original quando o conteúdo pendente volta para rascunho | `feliz` | Devolver conteúdo pendente para rascunho envia aviso ao autor original |
| `UT-027-2` | avisa o autor original quando outra pessoa publica o conteúdo dele | `feliz` | Publicar conteúdo de outra pessoa envia aviso ao autor original |
| `UT-027-3` | nomeia no aviso quem agiu e qual o estado novo | `feliz` | O aviso diz quem agiu e qual o estado novo |
| `UT-027-4` | conclui a transição e registra a falha quando o aviso não sai | `erro` | Falha no envio do aviso não impede a transição de estado, e fica registrada |

### REQ-028 — Registrar quem decidiu cada transição de estado editorial

`should` · `refinamento` · veredito `parcial` · 2 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-028-1` | grava ator, instante, estado anterior e estado novo em toda transição | `feliz` | Toda transição de estado de conteúdo grava ator, instante, estado anterior e estado novo |
| `UT-028-2` | responde o histórico tanto por conteúdo quanto por ator | `feliz` | O registro é consultável por conteúdo e por ator |

**Achados do QA**

- AC3 não tem resultado esperado: ele remete ao prazo de retenção "declarado neste card", e o prazo não está declarado. Sem o número não há comportamento a provar — é a mesma pendência que o próprio card registra para sair de refinamento.

### REQ-029 — Guardar versões anteriores do conteúdo editado

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-029-1` | guarda a versão anterior a cada gravação de conteúdo já existente | `feliz` | Cada gravação de conteúdo já existente guarda a versão anterior, vinculada ao conteúdo |
| `UT-029-2` | descarta a versão mais antiga ao passar do número configurado e guarda todas quando o limite é ilimitado | `borda` | A quantidade de versões guardadas é configurável, inclusive para guardar todas |
| `UT-029-3` | recusa editar ou apagar uma versão pela permissão de conteúdo | `erro` | Uma versão não é editável e não é apagável por permissão de conteúdo |
| `UT-029-4` | substitui o corpo corrente ao restaurar e guarda o corrente como versão nova | `feliz` | Restaurar uma versão substitui o corpo corrente e guarda o corrente como versão nova |
| `UT-029-5` | cria a versão como conteúdo filho com o estado herdado do original | `feliz` | Revision é conteúdo filho do conteúdo editado, com estado herdado, e não se apaga por capacidade própria |
| `UT-029-6` | desliga o versionamento quando o número configurado é zero | `borda` | `WP_POST_REVISIONS` define quantas versões de um conteúdo se guardam |

### REQ-030 — Sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado

`must` · `bloqueado` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-030-1` | remove na gravação os elementos e atributos fora da lista permitida | `feliz` | Sem o privilégio de marcação bruta, o corpo gravado tem removidos os elementos e atributos fora da lista permitida |
| `UT-030-2` | devolve na leitura o corpo já limpo, sem depender da renderização | `feliz` | A limpeza acontece na gravação, e um conteúdo já guardado não depende da renderização para ser seguro |
| `UT-030-3` | nega o privilégio de marcação bruta a toda conta quando a instalação declara a proibição | `erro` | O privilégio de marcação bruta é negado a toda conta quando a instalação declara a proibição |
| `UT-030-4` | nega o privilégio a quem não administra a rede em instalação em rede | `erro` | Em instalação em rede, o privilégio é negado a quem não administra a rede |
| `UT-030-5` | aplica a mesma lista permitida a conteúdo, comentário e nota editorial | `feliz` | A lista permitida é declarada em um lugar só e é a mesma para conteúdo, comentário e nota editorial |
| `UT-030-6` | grava o corpo sem limpeza quando o ator tem o privilégio declarado | `feliz` | P8 — HTML bruto é privilégio, e revogável por constante |
| `UT-030-7` | limpa o comentário de quem é autor do conteúdo apesar do atalho de aprovação | `borda` | C3 — o comentário de quem é autor do conteúdo entra aprovado sem verificação, e com o privilégio de marcação bruta não é sanitizado |

**Achados do QA**

- Card bloqueado por decisão de produto com segurança, registrada em `_reversa_sdd/kses-e-sanitizacao/questions.md` Q-01 e Q-02: se a isenção por marcação bruta é mantida e quem a tem na instalação real. UT-030-6 prova o comportamento com a isenção mantida; se ela for removida, esse teste muda de sinal e UT-030-7 passa a valer para todos.

### REQ-031 — Criar rascunho automático ao abrir o editor, antes de qualquer digitação

`could` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-031-1` | cria registro em rascunho automático ao abrir o editor de conteúdo novo | `feliz` | Abrir o editor de um conteúdo novo cria um registro em estado de rascunho automático |
| `UT-031-2` | mantém o rascunho automático fora de toda listagem, pública ou do painel | `feliz` | O rascunho automático não aparece em listagem alguma, pública ou do painel |
| `UT-031-3` | recusa o estado de rascunho automático pedido por quem chama a API | `erro` | O estado de rascunho automático não pode ser pedido por quem chama a API: é criado só por este caminho |
| `UT-031-4` | escreve no mesmo registro a cada intervalo configurado de salvamento | `feliz` | O salvamento automático escreve nesse registro no intervalo configurado |
| `UT-031-5` | cria o registro antes de qualquer digitação, com corpo vazio | `feliz` | Auto-draft é rascunho criado pelo ato de abrir o editor, antes de qualquer digitação |
| `UT-031-6` | respeita o intervalo configurado entre dois salvamentos automáticos | `borda` | `AUTOSAVE_INTERVAL` define de quanto em quanto tempo o editor salva sozinho |

### REQ-032 — Editar o corpo do conteúdo em blocos, com um formato de armazenamento declarado

`must` · `bloqueado` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-032-1` | grava o corpo identificando cada unidade e os seus atributos | `feliz` | O corpo é gravado num formato declarado que identifica cada unidade e os seus atributos |
| `UT-032-2` | reconstrói as mesmas unidades e atributos ao reabrir o conteúdo gravado | `feliz` | Reabrir um conteúdo gravado reconstrói exatamente as mesmas unidades, sem perda de atributo |
| `UT-032-3` | apresenta sem reescrever o corpo que não casa com o formato, avisando o autor | `erro` | Conteúdo cujo corpo não casa com o formato é apresentado sem ser reescrito, e o autor é avisado |
| `UT-032-4` | mantém a unidade serializada dentro do corpo, sem tabela própria | `feliz` | Block é unidade de conteúdo serializada em comentário HTML dentro do corpo — não em tabela |

**Achados do QA**

- AC4 (o formato é lido e escrito pelo servidor e pela tela de edição a partir da mesma especificação) exige teste de integração: provar paridade entre dois lados exige executar os dois, e o lado cliente não existe nesta árvore — `wp-includes/js/dist/` está ausente, conforme `_reversa_sdd/editor-de-blocos/questions.md` Q-02.
- Card bloqueado também por decisão de arquitetura ainda aberta (Q-01: manter o formato atual ou migrar para estrutura de dados). Os quatro testes acima valem para qualquer uma das duas escolhas, porque descrevem o contrato do formato, não a sua forma.

---

## EP-3 — Classificação do conteúdo

Organizar o conteúdo para que ele seja encontrado

5 cards · 27 testes de unidade

### REQ-033 — Separar o rótulo de classificação do contexto em que ele classifica

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-033-1` | mantém um rótulo só servindo em dois contextos ao mesmo tempo | `feliz` | Um rótulo existe uma vez e pode pertencer a mais de um contexto de classificação ao mesmo tempo |
| `UT-033-2` | propaga a renomeação do rótulo para todos os contextos em que ele serve | `feliz` | Renomear o rótulo muda o nome em todos os contextos em que ele serve |
| `UT-033-3` | preserva o rótulo no outro contexto ao removê-lo de um | `borda` | Remover o rótulo de um contexto não o remove do outro |
| `UT-033-4` | recusa o vínculo em tipo de conteúdo que o contexto não declara | `erro` | Contexto de classificação é declarado e diz a quais tipos de conteúdo se aplica |
| `UT-033-5` | grava uma linha de rótulo e uma linha de vínculo por contexto | `feliz` | Term é o rótulo e Taxonomy é o contexto: o mesmo Term vive em duas taxonomias como duas linhas de vínculo e uma de rótulo |
| `UT-033-6` | trata o menu de navegação como contexto de classificação cujos itens são conteúdo | `feliz` | Um menu de navegação é um contexto de classificação, e cada item do menu é um conteúdo |

### REQ-034 — Classificar conteúdo com os termos dos contextos declarados para o seu tipo

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-034-1` | substitui integralmente os vínculos do conteúdo naquele contexto | `feliz` | A lista de termos enviada substitui integralmente os vínculos daquele conteúdo naquele contexto |
| `UT-034-2` | ignora o rótulo desconhecido de quem não pode criar termo, sem criar nada | `erro` | Criar termo novo pela tela de edição exige a capacidade de criar termo daquele contexto; sem ela o rótulo desconhecido é ignorado, sem criar nada |
| `UT-034-3` | deixa a contagem de uso correta em todos os termos afetados | `feliz` | A contagem de uso de cada termo afetado fica correta ao fim da operação |
| `UT-034-4` | recusa vínculo em contexto não declarado para o tipo do conteúdo | `erro` | Só contextos declarados para aquele tipo de conteúdo aceitam vínculo |

### REQ-035 — Aplicar o termo padrão do contexto quando nenhum termo é informado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-035-1` | aplica o termo padrão quando nenhum termo é informado | `feliz` | Conteúdo gravado sem termo informado num contexto que declara termo padrão recebe o padrão |
| `UT-035-2` | reaplica a regra na publicação para todo contexto com padrão declarado | `feliz` | A regra é aplicada de novo na publicação, para todo contexto que declare padrão |
| `UT-035-3` | deixa o rascunho automático sem termo padrão | `borda` | Conteúdo em rascunho automático não recebe o padrão: ainda não é conteúdo |
| `UT-035-4` | deixa todo conteúdo do tipo padrão com classificação ao fim de qualquer gravação | `borda` | Ao fim de qualquer gravação, nenhum conteúdo do tipo padrão está sem classificação |
| `UT-035-5` | atribui a categoria padrão ao conteúdo do tipo padrão fora de rascunho automático | `borda` | P3 — conteúdo do tipo padrão sempre tem categoria; sem categoria informada e fora de rascunho automático, recebe a categoria padrão |

**Achados do QA**

- Card `must` sem teste de erro: os critérios descrevem uma invariante de preenchimento e não há entrada inválida nem permissão ausente própria deste card. A recusa de quem não pode criar termo está em REQ-034 (UT-034-2) e a de contexto não declarado em REQ-033 (UT-033-4).

### REQ-036 — Manter a lista de termos de cada contexto, com hierarquia e contagem de uso

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-036-1` | recusa a gestão do contexto a quem não tem a capacidade declarada por ele | `erro` | A tela exige a capacidade que o contexto declara para gerenciá-lo |
| `UT-036-2` | aceita termo pai em contexto hierárquico e recusa hierarquia em contexto plano | `erro` | Contexto hierárquico aceita termo pai e mantém a árvore; contexto plano recusa hierarquia |
| `UT-036-3` | remove o vínculo e preserva o conteúdo ao apagar termo em uso | `feliz` | Apagar um termo em uso remove o vínculo e não apaga o conteúdo |
| `UT-036-4` | atribui o padrão ao conteúdo que ficou sem termo algum no contexto | `feliz` | Conteúdo que fica sem termo algum num contexto com padrão recebe o padrão |
| `UT-036-5` | deixa a contagem de uso correta nos termos afetados pela operação | `feliz` | A contagem de uso dos termos afetados fica correta ao fim da operação |
| `UT-036-6` | trata o desaparecimento do termo como o seu único estado possível | `borda` | `terms` não tem coluna de estado: o estado de um termo é a existência dele |
| `UT-036-7` | resolve os cinco nomes de capacidade de taxonomia na mesma capacidade real | `feliz` | Cinco nomes de capacidade de taxonomia resolvem todos para a mesma capacidade real |

### REQ-037 — Impedir a remoção do termo padrão de um contexto

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-037-1` | recusa apagar o termo declarado como padrão do contexto | `erro` | Apagar o termo declarado como padrão de um contexto é recusado, para qualquer ator |
| `UT-037-2` | mantém a recusa diante do ator de maior poder da instalação | `erro` | A recusa vence inclusive o ator de maior poder da instalação |
| `UT-037-3` | libera a remoção do termo anterior depois da troca do padrão | `feliz` | Trocar qual termo é o padrão é permitido, e só então o anterior pode ser apagado |
| `UT-037-4` | recusa a remoção do termo padrão também na ação em lote e pela superfície programática | `erro` | O termo padrão do contexto é indestrutível, e a negação vence até o ator de maior poder |
| `UT-037-5` | mantém a negação quando um ponto de extensão tenta conceder a remoção | `erro` | ADR 0009 — negação explícita que vence o super admin |

---

## EP-4 — Leitura pública

Entregar o conteúdo publicado a quem não tem conta

10 cards · 44 testes de unidade

### REQ-038 — Resolver o endereço pedido numa consulta de conteúdo

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-038-1` | traduz o endereço amigável em critérios de consulta pelas regras declaradas | `feliz` | Um endereço amigável é traduzido em critérios de consulta por um conjunto de regras declaradas |
| `UT-038-2` | recusa inventar critério para endereço que não casa com nenhuma regra | `erro` | Um endereço amigável é traduzido em critérios de consulta por um conjunto de regras declaradas |
| `UT-038-3` | produz o mesmo resultado com os critérios informados diretamente | `feliz` | Os mesmos critérios podem ser informados diretamente, sem endereço amigável, e produzem o mesmo resultado |
| `UT-038-4` | preserva o conteúdo gravado ao trocar a forma dos endereços amigáveis | `feliz` | Alterar a forma dos endereços amigáveis não exige alterar o conteúdo gravado |
| `UT-038-5` | distingue na resposta o endereço de um conteúdo do endereço de uma listagem | `borda` | Endereço que resolve para um único conteúdo e endereço que resolve para uma listagem são distinguíveis pela resposta |

### REQ-039 — Escolher a apresentação do conteúdo por uma hierarquia declarada de modelos

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-039-1` | usa o primeiro modelo existente na ordem declarada para aquele resultado | `feliz` | Para cada tipo de resultado de consulta, o sistema procura os modelos em ordem declarada e usa o primeiro que existe |
| `UT-039-2` | cai no modelo final de reserva quando nenhum modelo específico existe | `erro` | Há sempre um modelo final de reserva, de modo que nenhuma requisição fica sem apresentação |
| `UT-039-3` | expõe a ordem de procura a quem desenvolve o tema | `feliz` | A ordem de procura é inspecionável por quem desenvolve o tema |
| `UT-039-4` | troca a apresentação ao trocar o tema sem alterar conteúdo nem consulta | `feliz` | Trocar o tema troca a apresentação sem alterar conteúdo nem consulta |

### REQ-040 — Paginar a listagem pública com tamanho de página configurável

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-040-1` | usa 10 itens por página enquanto nada é configurado e respeita o valor configurado | `feliz` | A listagem pública nasce com 10 itens por página e o número é configurável |
| `UT-040-2` | informa na resposta a página corrente e o total de páginas | `feliz` | A resposta informa a página corrente e o total de páginas |
| `UT-040-3` | devolve a resposta de endereço sem correspondência para página além do total | `erro` | Pedir página além do total devolve a resposta de endereço sem correspondência |
| `UT-040-4` | mantém a ordenação estável na fronteira entre duas páginas | `borda` | A ordenação da listagem é declarada e estável entre páginas |
| `UT-040-5` | nasce com 10 como tamanho de página sem ninguém ter escolhido | `borda` | `posts_per_page` nasce em 10 e define o tamanho da página pública |

### REQ-041 — Restringir a leitura de conteúdo que não está público

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-041-1` | exige a capacidade de ler conteúdo privado para o estado privado | `erro` | Conteúdo privado exige a capacidade de ler conteúdo privado |
| `UT-041-2` | exige a capacidade de editar para ler conteúdo em outro estado não público | `erro` | Conteúdo em qualquer outro estado não público exige a capacidade de editá-lo: ler o rascunho de outra pessoa pressupõe poder editá-lo |
| `UT-041-3` | aplica a mesma restrição em página, listagem, feed, sitemap e superfície programática | `feliz` | A restrição vale igualmente na página, na listagem, no feed, no sitemap e na API |
| `UT-041-4` | devolve a quem não tem permissão a mesma resposta de conteúdo inexistente | `erro` | Para quem não tem a permissão, a resposta é indistinguível da de conteúdo inexistente |
| `UT-041-5` | separa o estado privado dos demais estados não públicos na capacidade exigida | `feliz` | Estado privado exige capacidade de ler privado; qualquer outro estado não público cai em capacidade de edição |

### REQ-042 — Responder a endereço sem correspondência com a apresentação de erro do tema

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-042-1` | marca a resposta como não encontrada e escolhe o modelo de erro do tema | `erro` | Consulta que não casa com nenhum conteúdo marca a resposta como não encontrada e usa o modelo de erro do tema |
| `UT-042-2` | responde com código 404 nesse caminho | `erro` | O código de resposta HTTP é 404 |
| `UT-042-3` | mantém a resposta idêntica quando o conteúdo existe em estado não público | `erro` | A resposta não vaza se o conteúdo existe em estado não público |

### REQ-043 — Liberar o corpo de conteúdo protegido por senha a quem informa a senha

`should` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-043-1` | substitui o corpo pelo formulário de senha mantendo o resto da página | `feliz` | Sem a senha, o corpo é substituído pelo formulário de senha e o resto da página continua servido |
| `UT-043-2` | grava o atestado e passa a servir o corpo quando a senha confere | `feliz` | Senha correta grava no navegador do visitante um atestado e o corpo passa a ser servido |
| `UT-043-3` | mantém o corpo oculto quando a senha está errada | `erro` | Senha errada devolve o formulário e mantém o corpo oculto |
| `UT-043-4` | serve o corpo sem senha a quem pode editar o conteúdo | `feliz` | Quem pode editar o conteúdo vê o corpo sem informar a senha |
| `UT-043-5` | recusa com motivo próprio o comentário em conteúdo protegido sem atestado | `erro` | Comentar num conteúdo protegido sem ter informado a senha é recusado com motivo próprio |
| `UT-043-6` | mantém o conteúdo protegido em sitemap e em listagem | `feliz` | O conteúdo protegido continua aparecendo em sitemap e listagem: a proteção é do corpo, não da existência |
| `UT-043-7` | exibe a senha em texto claro a quem edita o conteúdo | `feliz` | D6 — senha de conteúdo é texto claro por desenho: é senha de acesso a conteúdo, não de conta, e precisa poder ser exibida a quem edita |
| `UT-043-8` | libera o corpo pelo atestado sem consultar o modelo de capacidades | `feliz` | Senha de conteúdo é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades |

### REQ-044 — Dar prazo e limite de tentativa ao atestado de senha de conteúdo

`should` · `bloqueado` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-044-1` | invalida o atestado passado o prazo declarado | `borda` | O atestado guardado no navegador do visitante tem prazo declarado e deixa de valer depois dele |
| `UT-044-2` | aceita a última tentativa permitida dentro da janela declarada | `borda` | Atingido o limite de tentativas erradas numa janela declarada, o formulário recusa novas tentativas por um prazo declarado |
| `UT-044-3` | recusa novas tentativas pelo prazo declarado ao atingir o limite | `erro` | Atingido o limite de tentativas erradas numa janela declarada, o formulário recusa novas tentativas por um prazo declarado |
| `UT-044-4` | invalida os atestados emitidos antes da troca da senha do conteúdo | `feliz` | Trocar a senha do conteúdo invalida os atestados emitidos antes da troca |
| `UT-044-5` | decide a liberação do corpo sem consultar o modelo de capacidades | `feliz` | Senha de conteúdo é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades |

**Achados do QA**

- Os três números deste card — prazo do atestado, limite de tentativas e janela — são decisão de produto ainda não tomada, e o legado não tem nenhum deles (UC-02 registra atestado sem prazo e sem contador). Os testes de borda são escritos contra o valor declarado na configuração e só fecham quando os números forem decididos.

### REQ-045 — Pré-buscar o próximo destino de navegação antes do clique

`could` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-045-1` | declara na página os destinos pré-buscáveis e a agressividade de cada um | `feliz` | A página servida declara ao navegador quais destinos podem ser pré-buscados e com que agressividade |
| `UT-045-2` | mantém fora da declaração os endereços de administração, de saída e de ação com efeito | `borda` | Endereços de administração, de saída de sessão e de ação com efeito ficam fora da declaração |
| `UT-045-3` | omite a declaração por completo quando a pré-busca está desligada | `borda` | A declaração é desligável por configuração, e desligada ela não aparece na página |

### REQ-046 — Descartar o gerenciador de bookmarks e o índice OPML

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC3 (declarar o que fazer com as linhas existentes na tabela de links) é obrigação de migração, não comportamento do sistema novo: ela se prova contra uma base real, no plano de migração, e não por teste de unidade.

### REQ-171 — Expandir macro textual no corpo do conteúdo na renderização

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-171-1` | substitui na renderização a marca registrada pelo resultado do seu tratador | `feliz` | Uma marca registrada no corpo do conteúdo é substituída na renderização pelo resultado que o seu tratador produz |
| `UT-171-2` | deixa a marca não registrada no texto como foi escrita | `borda` | Marca não registrada é deixada no texto como foi escrita, sem erro e sem desaparecer |
| `UT-171-3` | mantém a marca no corpo gravado, expandindo apenas na renderização | `feliz` | A expansão acontece na renderização, não na gravação: o corpo gravado continua com a marca |
| `UT-171-4` | trata por caminho próprio a marca que aparece dentro de atributo de elemento | `feliz` | Marca dentro de atributo de elemento é tratada por caminho próprio e declarado |
| `UT-171-5` | expõe a quem administra a lista de marcas registradas | `feliz` | A lista de marcas registradas é inspecionável por quem administra o site |
| `UT-171-6` | reconhece a marca pela delimitação declarada e a expande na renderização | `feliz` | Shortcode é macro textual em colchetes expandida na renderização |

---

## EP-5 — Retenção e descarte

Tirar do ar sem perder, e apagar no prazo

9 cards · 50 testes de unidade

### REQ-047 — Descartar conteúdo para a lixeira guardando o estado anterior e o instante

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-047-1` | guarda o estado anterior e o instante junto do conteúdo descartado | `feliz` | O descarte guarda, junto do conteúdo, o estado que ele tinha e o instante do descarte |
| `UT-047-2` | retira o conteúdo descartado de toda consulta pública mantendo o registro | `feliz` | O conteúdo descartado sai de toda consulta pública e continua existindo |
| `UT-047-3` | resolve a permissão de descartar conforme autoria e estado do conteúdo | `feliz` | A permissão de descartar é resolvida conforme autoria e estado do conteúdo |
| `UT-047-4` | recusa descartar uma versão anterior pela permissão de conteúdo | `erro` | Uma versão anterior do conteúdo não é descartável por permissão de conteúdo |
| `UT-047-5` | exige a capacidade da função especial para descartar o conteúdo que a declara | `erro` | Conteúdo com função especial declarada exige a capacidade dessa função para ser descartado |
| `UT-047-6` | mantém o descarte reversível com a memória necessária para desfazê-lo | `feliz` | A lixeira é estado reversível com memória: o estado anterior e a hora ficam gravados |
| `UT-047-7` | grava a memória do descarte de modo que a restauração não precise adivinhar o estado anterior | `feliz` | ADR 0004 — lixeira com memória e restauração para rascunho |

### REQ-048 — Suspender os comentários do conteúdo descartado, guardando o estado de cada um

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-048-1` | move os comentários do conteúdo para o estado de suspensão em cascata | `feliz` | Descartar o conteúdo move os seus comentários para um estado próprio de suspensão em cascata |
| `UT-048-2` | guarda agrupado, junto do conteúdo, o estado anterior de cada comentário | `feliz` | O estado anterior de cada comentário é guardado, agrupado, junto do conteúdo |
| `UT-048-3` | devolve cada comentário ao estado que tinha, em lote por estado | `feliz` | Restaurar o conteúdo devolve cada comentário ao estado que tinha, em lote por estado |
| `UT-048-4` | recusa o estado de suspensão em cascata pedido pela interface de moderação | `erro` | Esse estado de suspensão não é alcançável pela interface de moderação: só pela cascata |
| `UT-048-5` | recusa os dois estados inalcançáveis quando pedidos pela superfície de estado | `erro` | Dois estados de comentário não são alcançáveis pela API de status |
| `UT-048-6` | devolve à fila de moderação o comentário cujo estado anterior não foi gravado | `borda` | Se o estado anterior não estiver gravado, o comentário restaurado volta para a fila de moderação |

### REQ-049 — Restaurar conteúdo da lixeira como rascunho

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-049-1` | grava rascunho ao restaurar, e não o estado anterior ao descarte | `feliz` | A restauração grava rascunho, e não o estado que o conteúdo tinha antes do descarte |
| `UT-049-2` | devolve ao anexo restaurado a visibilidade herdada do conteúdo de destino | `feliz` | Anexo restaurado volta a herdar a visibilidade do conteúdo de destino |
| `UT-049-3` | apaga do conteúdo restaurado os dados de descarte | `feliz` | Os dados de descarte são apagados do conteúdo restaurado |
| `UT-049-4` | mantém o conteúdo restaurado fora do ar até ser publicado de novo | `borda` | O conteúdo precisa ser publicado de novo para voltar ao ar |
| `UT-049-5` | decide a permissão de restaurar pelo estado gravado no descarte | `feliz` | A permissão de restaurar é decidida pelo estado anterior, gravado no descarte |
| `UT-049-6` | recusa a restauração a quem não tem a capacidade do estado anterior | `erro` | A permissão de restaurar é decidida pelo estado anterior, gravado no descarte |
| `UT-049-7` | restaura como rascunho mesmo o conteúdo que estava publicado | `feliz` | R2 — restaurar da lixeira devolve como rascunho, não ao estado anterior |
| `UT-049-8` | exige capacidades diferentes para dois conteúdos na lixeira com estados anteriores diferentes | `feliz` | A autorização sobre conteúdo na lixeira é decidida pelo estado anterior |

### REQ-050 — Avisar que apagar é irreversível quando a lixeira está desligada

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-050-1` | apaga em definitivo quando a lixeira está desligada | `borda` | Com a lixeira desligada, o pedido de descarte apaga em definitivo |
| `UT-050-2` | declara na confirmação que a ação não tem volta | `feliz` | Nesse caso a confirmação pedida ao ator diz, com estas palavras, que a ação não tem volta |
| `UT-050-3` | distingue na tela descartar de apagar em definitivo antes da ação | `feliz` | A diferença entre descartar e apagar em definitivo é visível na tela antes da ação, não depois |
| `UT-050-4` | omite a ação de restaurar quando a lixeira está desligada | `borda` | Com a lixeira desligada, a tela não oferece ação de restaurar |
| `UT-050-5` | retém por 30 dias com a lixeira ligada e torna o apagamento irreversível com ela em zero | `borda` | R1 — lixeira de 30 dias, e desligá-la torna apagar irreversível |

### REQ-051 — Dar lixeira à mídia pelo mesmo comportamento de fábrica do conteúdo

`should` · `bloqueado` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-051-1` | move o anexo para a lixeira pelo caminho do conteúdo no comportamento de fábrica | `borda` | Apagar um anexo o move para a lixeira pelo mesmo caminho do conteúdo, no comportamento de fábrica |
| `UT-051-2` | devolve o anexo e os seus arquivos derivados na restauração | `feliz` | A restauração devolve o anexo e os seus arquivos derivados |
| `UT-051-3` | apaga o anexo e os arquivos no disco juntos, sem deixar órfão | `feliz` | A coleta da lixeira apaga o anexo e os arquivos no disco juntos, sem deixar órfão |
| `UT-051-4` | torna o apagamento de mídia definitivo quando a lixeira de mídia está desligada | `borda` | R3 — anexo só vai para a lixeira se a opção de lixeira de mídia estiver ligada, e ela é desligada por padrão. Apagar mídia é, por default, definitivo |

**Achados do QA**

- Card bloqueado por decisão humana: no legado o comportamento de fábrica é o oposto do que AC1 pede, e inverter o padrão tem consequência de armazenamento (anexo retido pelo prazo significa arquivo e derivadas retidos pelo prazo). UT-051-1 e UT-051-4 descrevem os dois lados da decisão, e qual deles é o de fábrica depende da resposta.

### REQ-052 — Apagar conteúdo vencido da lixeira por rotina que não depende de visita ao painel

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-052-1` | agenda a coleta numa instalação nova sem ninguém ter entrado no painel | `feliz` | O agendamento da coleta existe numa instalação nova, sem depender de ninguém ter entrado no painel |
| `UT-052-2` | apaga em definitivo o descartado há mais tempo que o prazo e poupa o que está no limite | `borda` | A coleta apaga em definitivo todo conteúdo descartado há mais tempo que o prazo declarado |
| `UT-052-3` | apaga os comentários descartados pelo mesmo critério de prazo | `feliz` | A coleta apaga, pelo mesmo critério, os comentários descartados |
| `UT-052-4` | retoma a execução interrompida sem apagar duas vezes nem saltar registro | `erro` | Uma execução interrompida no meio pode ser retomada sem apagar duas vezes nem saltar registro |
| `UT-052-5` | registra ao fim de cada execução quantos registros apagou | `feliz` | Cada execução registra quantos registros apagou |
| `UT-052-6` | registra o evento de coleta no caminho público, antes de qualquer exigência de autenticação | `feliz` | R5 — no legado a coleta da lixeira só é agendada por visita autenticada ao painel: um site que ninguém administra nunca agenda sua própria limpeza |
| `UT-052-7` | limpa a própria lixeira num site em que ninguém nunca administrou | `feliz` | ADR 0006 — retenção agendada por visita ao painel |

### REQ-053 — Expirar rascunho automático não aproveitado em sete dias

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-053-1` | apaga o rascunho automático com mais de sete dias e poupa o que está no limite | `borda` | Rascunho automático com mais de sete dias é apagado pela rotina de coleta |
| `UT-053-2` | conta o prazo a partir da data do registro | `borda` | O prazo é contado da data do registro |
| `UT-053-3` | preserva rascunho comum e conteúdo de qualquer outro estado | `feliz` | A rotina não toca em rascunho comum, nem em conteúdo de qualquer outro estado |
| `UT-053-4` | agenda a coleta sem depender de alguém ter aberto a tela de edição | `feliz` | O agendamento não depende de alguém ter aberto a tela de edição |
| `UT-053-5` | seleciona os vencidos por consulta direta sobre a data do registro | `borda` | R4 — rascunho automático expira em sete dias, por consulta direta sobre a data do registro |

### REQ-054 — Tolerar estado inconsistente na coleta, sem apagar o que não deve

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-054-1` | remove só a marca do registro que já não está na lixeira | `erro` | Registro marcado como descartado que já não está na lixeira tem só a marca removida, e não é apagado |
| `UT-054-2` | segue para o registro seguinte em lugar de abortar a execução | `erro` | A rotina segue para o registro seguinte em lugar de abortar |
| `UT-054-3` | registra cada inconsistência com identificador do registro e instante | `feliz` | Cada inconsistência encontrada é registrada com identificador do registro e instante |
| `UT-054-4` | preserva o conteúdo inconsistente apagando apenas o metadado | `erro` | R6 — a coleta tolera estado inconsistente: apaga só o metadado e segue |

### REQ-055 — Reparentar filhos e anexos quando um conteúdo é apagado em definitivo

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-055-1` | vincula os filhos ao avô em lugar de apagá-los | `feliz` | Apagar em definitivo um conteúdo hierárquico vincula os seus filhos ao avô, em lugar de apagá-los |
| `UT-055-2` | reparenta também os anexos vinculados ao conteúdo apagado | `feliz` | O mesmo vale para os anexos vinculados àquele conteúdo |
| `UT-055-3` | apaga em cascata as versões anteriores do conteúdo apagado | `feliz` | As versões anteriores do conteúdo apagado vão em cascata, essas sim |
| `UT-055-4` | deixa o armazenamento sem nenhum vínculo para conteúdo inexistente | `borda` | Nenhum registro fica apontando para um conteúdo que não existe mais |

---

## EP-6 — Biblioteca de mídia

Guardar arquivos e servir as derivadas que cada tela precisa

9 cards · 49 testes de unidade

### REQ-056 — Enviar arquivo para a biblioteca validando o tipo real do arquivo

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-056-1` | recusa o envio de quem não pode enviar ou não pode editar o conteúdo de destino | `erro` | O envio exige a capacidade de enviar arquivo e, quando há conteúdo de destino, a de editar aquele conteúdo |
| `UT-056-2` | decide o tipo pelo conteúdo do arquivo, ignorando a extensão informada | `erro` | O tipo é decidido pelo conteúdo do arquivo, não pela extensão informada, e confrontado com a lista de tipos permitidos |
| `UT-056-3` | recusa o tipo fora da lista informando o motivo ao ator | `erro` | Tipo fora da lista é recusado com motivo informado ao ator |
| `UT-056-4` | renomeia o arquivo na colisão de nome em lugar de sobrescrever | `borda` | Colisão de nome no destino é resolvida renomeando, sem sobrescrever arquivo existente |
| `UT-056-5` | devolve o erro do sistema de arquivos sem criar registro quando o destino não é gravável | `erro` | Destino não gravável devolve erro com a mensagem do sistema de arquivos, e nenhum registro de anexo é criado |
| `UT-056-6` | aplica as mesmas duas verificações de capacidade na tela e no envio assíncrono | `feliz` | O envio pela tela e o envio assíncrono do editor aplicam as mesmas duas verificações de capacidade |

### REQ-057 — Herdar do conteúdo de destino a visibilidade do arquivo enviado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-057-1` | dá ao anexo com destino a visibilidade do conteúdo de destino | `feliz` | Anexo com conteúdo de destino tem a visibilidade do destino, nunca a própria |
| `UT-057-2` | reescreve para herdado qualquer estado fora dos quatro aceitos | `erro` | Nenhum caminho de escrita consegue pôr um anexo em estado publicado: estado fora dos quatro aceitos é reescrito para herdado |
| `UT-057-3` | dá visibilidade própria ao anexo sem conteúdo de destino | `feliz` | Anexo sem conteúdo de destino passa a ter visibilidade própria, declarada no registro |
| `UT-057-4` | acompanha a mudança de visibilidade do conteúdo de destino | `feliz` | Mudar a visibilidade do conteúdo de destino muda a do anexo junto |
| `UT-057-5` | impede o anexo de chegar ao estado publicado por qualquer caminho de escrita | `borda` | P2 — anexo nunca é publicado: qualquer estado fora de herdado, privado, lixeira e rascunho automático é reescrito |

### REQ-058 — Gerar as derivadas de cada tamanho registrado ao receber uma imagem

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-058-1` | gera uma derivada por tamanho declarado, com as proporções daquele tamanho | `feliz` | Receber uma imagem gera uma derivada para cada tamanho declarado, com as proporções declaradas para aquele tamanho |
| `UT-058-2` | registra de fábrica quatro tamanhos mais os dois de tela de alta densidade | `borda` | Os tamanhos de fábrica são quatro, com as medidas declaradas, mais os dois de tela de alta densidade |
| `UT-058-3` | deixa de fora o tamanho registrado depois do envio até a ação explícita de regerar | `borda` | Tamanho registrado depois do envio não é gerado retroativamente: há uma ação explícita para regerar |
| `UT-058-4` | guarda no anexo o nome do arquivo e as medidas reais de cada derivada | `feliz` | O registro do anexo guarda, para cada derivada, o nome do arquivo e as medidas reais |
| `UT-058-5` | inclui no conjunto de fábrica os dois tamanhos declarados em código para alta densidade | `borda` | M2 — quatro tamanhos nascem com o site, mais dois registrados em código para telas de alta densidade |

**Achados do QA**

- Card `must` sem teste de erro: os critérios descrevem o caminho de geração completa e o card não declara caminho de falha próprio. A falha ao gerar derivada — informar, registrar e distinguir ausente de não registrada — é integralmente o objeto de REQ-060.

### REQ-059 — Reduzir imagem acima do limite na ingestão, guardando o original

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-059-1` | serve por cópia reduzida a imagem que passa do limite em qualquer dimensão | `borda` | Imagem acima do limite declarado em qualquer dimensão passa a ser servida por uma cópia reduzida |
| `UT-059-2` | mantém o arquivo original identificável como original | `feliz` | O arquivo original continua no armazenamento e é identificável como original |
| `UT-059-3` | gera as derivadas a partir da cópia reduzida, não do original | `feliz` | As derivadas de tamanho são geradas a partir da cópia reduzida, não do original |
| `UT-059-4` | dispensa a redução quando o limite está desligado | `borda` | O limite é configurável e desligável |
| `UT-059-5` | usa 2560 px como limite de fábrica da ingestão | `borda` | M1 — imagem acima de 2560 px é reduzida na ingestão e o original fica guardado |

### REQ-060 — Informar e registrar a falha ao processar imagem

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-060-1` | registra a falha de derivada com anexo, tamanho pretendido e motivo | `erro` | Falha ao gerar ou gravar qualquer derivada é registrada com anexo, tamanho pretendido e motivo |
| `UT-060-2` | informa a quem enviou que o anexo ficou com derivadas faltando | `erro` | O ator que enviou o arquivo é informado de que o anexo ficou com derivadas faltando |
| `UT-060-3` | distingue no registro do anexo a derivada ausente da derivada não registrada | `borda` | O registro do anexo distingue derivada ausente de derivada não registrada |
| `UT-060-4` | regera por ação explícita apenas as derivadas que faltaram | `feliz` | Existe ação explícita para tentar gerar de novo as derivadas que faltaram |
| `UT-060-5` | deixa de ser silencioso em todos os pontos de falha do processamento | `erro` | M4 — falha ao gerar derivada de imagem é silenciosa: cinco pontos do processamento carregam `// TODO: Log errors.` e nenhum registra nada |

### REQ-061 — Servir a derivada adequada ao espaço em que a imagem aparece

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-061-1` | oferece ao navegador as derivadas existentes com as suas larguras reais | `feliz` | A marcação servida oferece ao navegador as derivadas existentes com as suas larguras reais |
| `UT-061-2` | mantém o teto da oferta no valor declarado, independente das derivadas existentes | `borda` | O teto da oferta é declarado e configurável, e não depende de quais derivadas existem |
| `UT-061-3` | serve o arquivo único quando o anexo não tem derivada alguma | `borda` | Anexo sem derivada alguma é servido no arquivo único, sem marcação de alternativas |
| `UT-061-4` | para a oferta em 2048 px mesmo havendo derivada maior | `borda` | M3 — o conjunto de alternativas para em 2048 px, independente dos tamanhos existentes |

### REQ-062 — Transformar imagem já enviada, podendo voltar ao original

`should` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-062-1` | recusa a transformação a quem não pode editar aquele anexo | `erro` | A transformação exige a capacidade de editar aquele anexo |
| `UT-062-2` | grava o resultado como arquivo novo e repõe o apontamento do anexo | `feliz` | O resultado é gravado como arquivo novo e o anexo passa a apontar para ele |
| `UT-062-3` | mantém o arquivo anterior identificável como backup | `feliz` | O arquivo anterior continua no armazenamento, identificável como backup |
| `UT-062-4` | recoloca o original e regera as derivadas a partir dele na restauração | `feliz` | Restaurar o original recoloca o arquivo guardado e regera as derivadas a partir dele |
| `UT-062-5` | produz conjuntos distintos de arquivos para os três escopos de transformação | `borda` | O ator escolhe se a transformação vale para a imagem inteira, só para a miniatura, ou para tudo menos a miniatura, e os três caminhos produzem conjuntos distintos de arquivos |
| `UT-062-6` | recusa abrir a edição quando não há biblioteca de imagem disponível | `erro` | Servidor sem biblioteca de imagem disponível não oferece a tela, e informa o motivo |
| `UT-062-7` | regenera exatamente as derivadas dos tamanhos registrados | `feliz` | M2 — os tamanhos registrados definem quais derivadas são regeneradas |
| `UT-062-8` | registra e informa a falha ao gerar derivada durante a transformação | `erro` | M4 — falha ao gerar derivada de imagem é silenciosa |

### REQ-063 — Apagar o arquivo que deixou de ser referenciado

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-063-1` | libera o arquivo anterior ao substituir imagem de configuração do site | `feliz` | Substituir uma imagem de configuração do site (fundo, cabeçalho, ícone) libera o arquivo anterior, ou declara explicitamente que ele é mantido e por quanto tempo |
| `UT-063-2` | apaga arquivo principal, derivadas e backups ao apagar o anexo em definitivo | `feliz` | Apagar um anexo em definitivo apaga o arquivo principal, as derivadas e os backups de edição |
| `UT-063-3` | lista no relatório os arquivos sem anexo correspondente | `feliz` | Existe um relatório que lista arquivos no armazenamento sem anexo correspondente |
| `UT-063-4` | preserva o arquivo que ainda tem anexo apontando para ele | `borda` | Nenhuma rotina apaga arquivo que ainda tem anexo apontando para ele |
| `UT-063-5` | não deixa órfão ao trocar a imagem de fundo do site | `feliz` | `// @todo Uploaded files are not removed here.` — trocar imagem de fundo deixa o arquivo anterior órfão |
| `UT-063-6` | limita o acúmulo de backups guardados pela edição de imagem | `feliz` | O mesmo padrão de acúmulo aparece na edição de imagem, que guarda backup a cada transformação |

### REQ-064 — Contornar o filtro de tipo de arquivo só por decisão declarada da instalação

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-064-1` | nega a toda conta a capacidade de enviar sem filtro, inclusive à de maior poder | `erro` | A capacidade de enviar arquivo sem filtro de tipo é negada a toda conta por padrão, inclusive à de maior poder |
| `UT-064-2` | faz a capacidade passar a existir quando a instalação a declara | `feliz` | Ela só passa a existir quando a instalação declara explicitamente que a permite |
| `UT-064-3` | mantém a recusa a quem não tem a capacidade declarada, mesmo com a permissão liberada | `erro` | Mesmo liberada, ela só alcança quem tem a capacidade declarada de enviar sem filtro |
| `UT-064-4` | registra cada envio feito por esse caminho com conta, arquivo e instante | `feliz` | Cada envio feito por esse caminho fica registrado com conta, arquivo e instante |
| `UT-064-5` | inverte o padrão das demais capacidades: sem declaração da instalação, nega sempre | `erro` | A permissão de envio sem filtro é o inverso das outras: sem a declaração da instalação, ela é sempre negada |

---

## EP-7 — Interação pública e moderação

A conversa do site, e quem decide o que entra nela

22 cards · 110 testes de unidade

### REQ-065 — Receber comentário de leitor com ou sem conta

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-065-1` | grava com autoria anônima legítima o comentário de quem não tem conta | `feliz` | Comentário sem conta é gravado com autoria anônima legítima, e não como erro |
| `UT-065-2` | recusa o comentário anônimo antes de tudo quando a exigência de conta está ligada | `erro` | Com a exigência de conta ligada, o comentário anônimo é recusado antes de qualquer outra verificação |
| `UT-065-3` | exige nome e e-mail de quem não tem conta quando a identificação é obrigatória | `erro` | Com a exigência de identificação ligada, nome e e-mail são obrigatórios para quem não tem conta |
| `UT-065-4` | devolve o visitante ao conteúdo comentado ao fim do envio | `feliz` | Ao fim do envio o visitante é devolvido ao conteúdo comentado |
| `UT-065-5` | recusa comentário em conteúdo inexistente ou ilegível por quem envia | `erro` | Nenhuma superfície de envio aceita comentário em conteúdo que não existe ou que não é legível por quem envia |
| `UT-065-6` | trata autoria zero como anônimo legítimo e não como ausência de dado | `feliz` | Comment é interação sobre um conteúdo, de leitor com ou sem conta: autoria zero é anônimo legítimo |

### REQ-066 — Recusar comentário duplicado em lugar de o moderar

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-066-1` | recusa com 409 a submissão idêntica nos cinco campos de comparação | `erro` | Mesmo conteúdo, mesmo comentário pai, mesmo autor, mesmo e-mail e mesmo texto são recusados com HTTP 409 |
| `UT-066-2` | recusa a duplicata antes de qualquer decisão de moderação | `erro` | A recusa acontece antes de qualquer decisão de moderação |
| `UT-066-3` | aceita o reenvio quando o comentário anterior está na lixeira | `borda` | Comentário que está na lixeira não conta como duplicata: o reenvio é aceito |
| `UT-066-4` | trata a duplicata como recusa e não como item a moderar | `erro` | C1 — duplicata é recusa, não moderação; comentário na lixeira não conta como duplicata |

### REQ-067 — Limitar a vazão de comentários por hora, exceto para quem modera

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-067-1` | recusa com 429 o segundo comentário da mesma conta dentro da janela | `erro` | Um segundo comentário da mesma conta na última hora aciona o freio com HTTP 429 |
| `UT-067-2` | aplica o freio por origem ou por e-mail a quem não tem conta | `erro` | Para quem não tem conta, o critério é o mesmo endereço de origem ou o mesmo e-mail |
| `UT-067-3` | dispensa do freio quem administra o site ou modera comentário | `feliz` | Quem tem a capacidade de administrar o site ou de moderar comentário não é limitado |
| `UT-067-4` | respeita a janela e o limite configurados | `borda` | A janela e o limite são configuráveis |
| `UT-067-5` | decide a isenção do freio por capacidade, não por papel nem por confiança do autor | `borda` | C2 — vazão limitada por hora, exceto para quem modera; a capacidade virou política de desempenho |

### REQ-068 — Decidir o estado inicial do comentário percorrendo as regras de moderação em ordem declarada

`must` · `pronto` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-068-1` | percorre as etapas na ordem declarada, encerrando na primeira que decide | `feliz` | A ordem de avaliação é declarada e cada etapa pode encerrar a decisão |
| `UT-068-2` | encerra a decisão na primeira etapa quando a moderação manual está ligada | `borda` | Moderação manual ligada encerra a decisão na primeira etapa: nenhuma outra regra é consultada e o comentário vai para a fila |
| `UT-068-3` | manda para a fila o comentário com mais links que o limite, contando o endereço do autor | `borda` | Número de links acima do limite declarado manda para a fila, contando também o endereço do autor |
| `UT-068-4` | procura a palavra de moderação nos seis campos declarados | `feliz` | Palavra de moderação é procurada em seis campos: autor, e-mail, endereço, texto, origem da requisição e identificação do navegador |
| `UT-068-5` | exige comentário anterior aprovado e e-mail limpo no atalho de confiança herdada | `borda` | Com a confiança herdada ligada, exige-se comentário anterior aprovado da mesma conta, ou do mesmo par de nome e e-mail, e que o e-mail não contenha palavra de moderação |
| `UT-068-6` | manda para a lixeira quem casa com a proibição, e para spam quando a lixeira está desligada | `erro` | Casar com a lista de proibição manda para a lixeira quando a lixeira está ligada, e para spam quando não está |
| `UT-068-7` | registra em cada comentário qual regra decidiu o seu destino | `feliz` | Para cada comentário, o sistema registra qual regra decidiu o seu destino |
| `UT-068-8` | usa 2 como limite de fábrica da contagem de links | `borda` | C5 — link em excesso manda para a fila; o limite nasce em 2 e a contagem inclui o endereço do autor |

**Achados do QA**

- O card tem 7 critérios e 6 regras de negócio, isto é, treze unidades de prova contra um teto de oito — é o card mais denso do backlog e, pela regra deste SKILL, grande demais. BR1 (C4), BR3 (C6), BR4 (C7), BR5 (C9) e BR6 (ADR 0002) ficaram sem teste próprio, mas cada um é provado pelo teste do critério correspondente: UT-068-2, UT-068-4, UT-068-5, UT-068-6 e o conjunto UT-068-1 mais UT-068-7.
- Separar este card em pelo menos três — precedência da moderação manual, as regras de conteúdo (links e palavras) e o destino da lista de proibição — faria cada um caber no teto e tornaria a ordem entre eles um card próprio.

### REQ-069 — Decidir o atalho de confiança do autor do conteúdo e de quem modera sob a mesma sanitização

`must` · `bloqueado` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-069-1` | aprova de saída o comentário do autor do conteúdo e o de quem modera | `feliz` | O comentário de quem é autor do conteúdo comentado, ou de quem tem a capacidade de moderar, entra aprovado |
| `UT-069-2` | aplica a limpeza de marcação ao comentário que entrou pelo atalho | `feliz` | Esse atalho não dispensa a sanitização do texto: o corpo passa pela limpeza de marcação como qualquer outro |
| `UT-069-3` | registra no comentário que o atalho decidiu o destino dele | `feliz` | O atalho fica registrado no comentário, para que a decisão seja explicável depois |
| `UT-069-4` | dispensa a cascata de moderação para quem tem o atalho | `feliz` | C3 — autor do conteúdo e moderador têm aprovação automática, sem passar por nenhuma verificação |
| `UT-069-5` | limpa o texto do comentário mesmo quando o ator tem o privilégio de marcação bruta | `erro` | Se o ator tem o privilégio de marcação bruta — e o papel editorial tem — o texto do comentário não é sanitizado |

**Achados do QA**

- Card bloqueado pela mesma decisão de produto com segurança de REQ-030, registrada em `_reversa_sdd/kses-e-sanitizacao/questions.md` Q-01. UT-069-5 descreve a separação que o card propõe; no legado o atalho é duplo e o texto não é sanitizado quando o ator tem o privilégio. O teste muda de sinal se a decisão for manter a isenção.

### REQ-070 — Recusar campo mais longo que o seu limite, em lugar de truncar em silêncio

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-070-1` | recusa nomeando o campo quando nome, e-mail, endereço ou texto passa do limite | `erro` | Nome, e-mail, endereço e texto acima do limite declarado devolvem erro ao requisitante, nomeando o campo |
| `UT-070-2` | preserva o valor informado em lugar de truncar em silêncio | `borda` | Nenhum desses campos é truncado em silêncio |
| `UT-070-3` | declara o limite de cada campo antes do envio | `feliz` | O limite de cada campo é declarado e visível na tela antes do envio |
| `UT-070-4` | aceita o valor no limite exato e recusa o primeiro caractere além dele | `borda` | C10 — texto longo demais é erro de usuário, não truncamento, ao contrário do resto do sistema, que trunca em silêncio |

### REQ-071 — Fechar a interação em conteúdo antigo sem alterar o registro

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-071-1` | fecha a interação do conteúdo mais velho que o prazo declarado | `borda` | Com a regra ligada, conteúdo do tipo em linha do tempo mais velho que o prazo declarado deixa de aceitar comentário e notificação de link |
| `UT-071-2` | mantém no registro o valor que o autor escolheu, fechando apenas na resposta | `feliz` | O fechamento acontece na resposta, não no armazenamento: o registro continua com o valor que o autor escolheu |
| `UT-071-3` | devolve a aceitação de todo o conteúdo antigo ao desligar a regra | `feliz` | Desligar a regra devolve a aceitação de todo o conteúdo antigo, sem precisar de migração de dados |
| `UT-071-4` | usa 14 dias como prazo de fábrica e respeita o valor configurado | `borda` | O prazo nasce em 14 dias e é configurável |
| `UT-071-5` | deixa o armazenamento intacto durante todo o ciclo de fechamento e reabertura | `feliz` | C11 — comentário e notificação de link em conteúdo antigo fecham sozinhos, em memória: o banco não muda |

### REQ-072 — Encadear respostas até a profundidade declarada, e só sob comentário aprovado

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-072-1` | recusa com 403 a resposta a comentário não aprovado | `erro` | Responder a comentário não aprovado é recusado com HTTP 403 |
| `UT-072-2` | limita o encadeamento ao valor declarado de profundidade | `borda` | A profundidade de encadeamento é limitada pelo valor declarado, que nasce em 5 |
| `UT-072-3` | vincula ao último nível permitido e informa o visitante ao atingir a profundidade máxima | `borda` | Atingida a profundidade máxima, a resposta é vinculada ao último nível permitido, e o visitante é informado |
| `UT-072-4` | coloca todas as respostas no primeiro nível quando o encadeamento está desligado | `borda` | O encadeamento é desligável, e desligado todas as respostas ficam no primeiro nível |
| `UT-072-5` | usa 5 como profundidade de fábrica do encadeamento | `borda` | A profundidade é limitada pelo valor declarado, que nasce em 5 |

### REQ-073 — Recusar o comentário com motivo próprio para cada causa de fechamento

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-073-1` | produz quatro recusas distintas para as quatro causas de fechamento | `erro` | Conteúdo com comentário fechado, conteúdo descartado, conteúdo em rascunho e conteúdo protegido por senha produzem quatro recusas distintas |
| `UT-073-2` | dá a cada recusa motivo próprio para quem integra e mensagem própria para o visitante | `erro` | Cada recusa tem motivo próprio, identificável por quem integra, e mensagem própria para o visitante |
| `UT-073-3` | mantém as recusas sem revelar conteúdo que o visitante não poderia ver | `erro` | Nenhuma das quatro recusas revela informação sobre conteúdo que o visitante não poderia ver |

### REQ-074 — Avisar quem precisa saber do comentário novo

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-074-1` | avisa o autor do conteúdo quando o comentário entra aprovado | `feliz` | Comentário aprovado avisa o autor do conteúdo comentado |
| `UT-074-2` | avisa quem pode moderar quando o comentário entra na fila | `feliz` | Comentário que entrou na fila avisa quem pode moderar |
| `UT-074-3` | inclui em cada aviso as ações disponíveis para aquele comentário | `feliz` | Cada aviso traz as ações disponíveis para aquele comentário |
| `UT-074-4` | mantém o comentário gravado e registra a falha quando o aviso não sai | `erro` | Falha no envio do aviso não desfaz a gravação do comentário, e fica registrada |

### REQ-075 — Moderar a fila de comentários como transição de estado

`must` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-075-1` | resolve a permissão de moderar pelo conteúdo comentado | `feliz` | A permissão é resolvida pelo conteúdo comentado, não por uma capacidade global de comentário |
| `UT-075-2` | alcança pela interface exatamente os quatro estados de moderação | `feliz` | Aprovar, reter, marcar como spam e descartar são transições de estado, e só esses quatro estados são alcançáveis pela interface |
| `UT-075-3` | recusa o estado pedido fora dos quatro aceitos | `erro` | Estado pedido fora dos aceitos é recusado |
| `UT-075-4` | mantém o estado ao editar o texto do comentário | `feliz` | Editar o texto do comentário não muda o estado |
| `UT-075-5` | verifica a permissão comentário a comentário sem interromper o lote | `borda` | Numa ação em lote, a permissão é verificada comentário a comentário e um item sem permissão não interrompe o lote |
| `UT-075-6` | resolve o comentário órfão numa capacidade declarada de fallback | `erro` | Comentário cujo conteúdo comentado não existe mais resolve numa capacidade declarada de fallback, e não fica sem responsável |
| `UT-075-7` | move o estado ao aprovar, em lugar de alterar o corpo do comentário | `feliz` | Moderação é transição de estado, não edição: aprovar move o estado |
| `UT-075-8` | exige a capacidade de escrever conteúdo para editar o comentário órfão | `erro` | Editar um comentário cujo conteúdo não existe mais cai na capacidade de escrever conteúdo |

**Achados do QA**

- BR3 (dois estados não alcançáveis pela API de status) ficou sem teste próprio neste card: o teto de oito foi atingido. O comportamento é provado em REQ-048, por UT-048-5.

### REQ-076 — Descartar comentário para a lixeira guardando o estado anterior

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-076-1` | guarda o estado anterior e o instante ao descartar o comentário | `feliz` | O descarte guarda o estado anterior e o instante, junto do comentário |
| `UT-076-2` | devolve o comentário ao estado guardado na restauração | `feliz` | A restauração devolve o comentário ao estado guardado |
| `UT-076-3` | devolve para a fila de moderação quando não há estado guardado | `borda` | Sem estado guardado, a restauração devolve o comentário para a fila de moderação |
| `UT-076-4` | apaga em definitivo o comentário descartado além do prazo e poupa o que está no limite | `borda` | A coleta apaga em definitivo o comentário descartado há mais tempo que o prazo declarado |
| `UT-076-5` | segue a coleta diante de comentário com marca de descarte inconsistente | `erro` | R6 — a coleta tolera estado inconsistente |

### REQ-077 — Manter o contador de comentários do conteúdo coerente com o que conta

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-077-1` | conta apenas os comentários aprovados que contam | `feliz` | O contador reflete apenas os comentários aprovados que contam |
| `UT-077-2` | mantém a nota editorial interna fora do contador | `borda` | Nota editorial interna não entra no contador |
| `UT-077-3` | atualiza o contador a cada transição de estado de comentário | `feliz` | Toda transição de estado de comentário atualiza o contador do conteúdo |
| `UT-077-4` | recalcula e reporta a divergência encontrada na reconciliação | `erro` | Existe uma rotina de reconciliação que recalcula o contador e reporta divergência |
| `UT-077-5` | exclui a nota editorial do contador em todos os caminhos de atualização | `borda` | C12 — nota editorial é excluída do contador de comentários |

### REQ-078 — Dar prazo próprio e declarado ao link de ação enviado por e-mail

`should` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-078-1` | dá prazo declarado ao token da ação e informa esse prazo no e-mail | `feliz` | O token da ação tem prazo declarado e o e-mail informa esse prazo |
| `UT-078-2` | explica o vencimento e oferece a tela de moderação quando o token venceu | `borda` | Token vencido produz mensagem que diz que o link expirou e oferece abrir a tela de moderação |
| `UT-078-3` | mantém independentes o prazo do link de e-mail e o do formulário de tela | `borda` | O prazo do link de e-mail é independente do prazo do token de formulário de tela |
| `UT-078-4` | aceita o token da janela anterior dentro da meia-vida declarada | `borda` | Nonce é token com janela de meia-vida, não de uso único: vale de 12 a 24 horas e aceita o tick anterior, logo o link do e-mail de moderação tem prazo |

### REQ-079 — Registrar nota editorial interna sobre um conteúdo

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-079-1` | recusa a nota editorial de quem não está autenticado | `erro` | A nota exige autenticação: não há nota anônima |
| `UT-079-2` | exige a capacidade de editar o conteúdo, e não a de moderar comentário | `erro` | A autorização é a capacidade de editar aquele conteúdo, não a de moderar comentário |
| `UT-079-3` | recusa a nota em tipo de conteúdo que não declara suporte | `erro` | Só tipos de conteúdo que declaram suporte a nota aceitam uma |
| `UT-079-4` | mantém a nota fora de superfície pública e fora do contador | `feliz` | A nota não aparece em superfície pública alguma e não entra no contador de comentários |
| `UT-079-5` | arrasta as respostas ao descartar ou apagar a nota raiz | `feliz` | Responder a uma nota cria uma nota filha; descartar ou apagar a nota raiz arrasta as respostas |
| `UT-079-6` | reúne na nota editorial as cinco propriedades que a separam do comentário público | `feliz` | C12 — nota editorial não é comentário público: exige login, é excluída do contador, usa a capacidade de editar o conteúdo, só aceita tipos que declarem suporte, e apagar a nota raiz arrasta as respostas |
| `UT-079-7` | autoriza a nota pela família de capacidades de conteúdo | `feliz` | Nota editorial usa capacidade de conteúdo, não de moderação |

### REQ-080 — Registrar notificação de link vinda de site remoto, com prova de origem

`could` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-080-1` | aceita a notificação só depois de confirmar o link na página de origem | `feliz` | A notificação só é aceita depois de o sistema buscar a página de origem declarada e confirmar que ela contém o link |
| `UT-080-2` | recusa a notificação cuja origem não contém o link | `erro` | Notificação sem a prova é recusada |
| `UT-080-3` | recusa com motivo próprio a notificação repetida da mesma origem | `erro` | Notificação repetida da mesma origem para o mesmo conteúdo é recusada com motivo próprio |
| `UT-080-4` | aprova automaticamente a notificação cuja origem é conteúdo publicado deste mesmo site | `feliz` | Notificação cuja origem é um conteúdo publicado deste mesmo site é aprovada automaticamente |
| `UT-080-5` | recusa com motivo próprio quando o conteúdo tem notificação de link fechada | `erro` | Conteúdo com notificação de link fechada recusa com motivo próprio |
| `UT-080-6` | grava a notificação como interação de tipo próprio, distinguível de comentário humano | `feliz` | A notificação é gravada como interação de tipo próprio, distinguível de comentário humano |
| `UT-080-7` | nunca aprova automaticamente a notificação que não traz prova de origem | `erro` | C8 — notificação verificada do próprio site publicado é aprovada; a não verificada nunca, porque não traz prova de origem |
| `UT-080-8` | busca a página de origem antes de decidir, e não aceita a declaração do requisitante | `feliz` | Pingback é verificado: a página de origem é buscada e tem de conter o link |

**Achados do QA**

- BR3 (ADR 0003 — pingback do próprio site aprovado, trackback nunca) ficou sem teste próprio: o teto de oito foi atingido. As duas metades da decisão estão provadas por UT-080-4 e UT-080-7, e o descarte do protocolo sem prova é REQ-081.

### REQ-081 — Descartar a notificação de link sem prova de origem (trackback)

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 (interações já gravadas continuam legíveis e identificáveis como de origem não verificada) é obrigação de migração sobre dado existente, não comportamento do sistema novo: prova-se contra uma base real, no plano de migração.
- AC3 (a ausência do endereço cai na resposta de endereço inexistente, sem erro de servidor) vale para todas as superfícies descartadas do backlog e é provado uma vez, em REQ-038 (UT-038-2) e REQ-042.

### REQ-082 — Classificar comentário por serviço externo de reputação

`should` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-082-1` | consulta o serviço antes de a decisão local ser tomada | `feliz` | Com o serviço configurado, o comentário é consultado antes de a decisão local ser tomada |
| `UT-082-2` | devolve a decisão às regras locais quando não há credencial do serviço | `erro` | Sem credencial do serviço, a decisão volta inteira para as regras locais, sem erro |
| `UT-082-3` | grava o veredito como estado do comentário e guarda o histórico junto dele | `feliz` | O veredito é gravado como estado do comentário e o histórico fica junto do comentário |
| `UT-082-4` | reconsulta o comentário até o prazo declarado e então desiste | `borda` | Serviço que não respondeu marca o comentário para reconsulta; a reconsulta se repete até o prazo declarado e então é desistida |
| `UT-082-5` | preserva o estado gravado pelo humano e devolve a correção ao serviço | `borda` | Veredito do serviço contrário ao de um moderador humano não prevalece: o estado gravado pelo humano fica, e a correção é devolvida ao serviço |
| `UT-082-6` | troca de fornecedor sem alterar a cascata de moderação | `feliz` | O ponto de troca do serviço é declarado, de modo que trocar de fornecedor não exija alterar a cascata de moderação |
| `UT-082-7` | resolve a credencial do serviço pela precedência declarada entre constante e valor guardado | `feliz` | I3 — o serviço de filtragem é registrado como conector, com credencial por opção e por constante |
| `UT-082-8` | trata spam como estado do comentário, nunca como exclusão | `feliz` | Spam é estado de comentário, não exclusão; com o serviço instalado, o julgamento é externo |

**Achados do QA**

- BR1 (C13 — prazo declarado do spam e reconsulta até o prazo) ficou sem teste próprio: o teto de oito foi atingido e a reconsulta até o prazo é integralmente provada por UT-082-4; o prazo do spam é provado em REQ-083 (UT-083-5).

### REQ-083 — Apagar em lote o spam vencido

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-083-1` | apaga o spam marcado além do prazo e poupa o que está no limite | `borda` | Comentário marcado como spam há mais tempo que o prazo declarado é apagado por rotina agendada |
| `UT-083-2` | apaga em lotes do tamanho declarado em lugar de uma passagem só | `borda` | O apagamento é feito em lotes de tamanho declarado, para não travar o banco |
| `UT-083-3` | registra ao fim de cada execução quantos registros apagou | `feliz` | Cada execução registra quantos registros apagou |
| `UT-083-4` | poupa o comentário que um humano tirou de spam | `feliz` | A rotina não apaga comentário que um humano tirou de spam |
| `UT-083-5` | usa 15 dias de prazo e lotes de até dez mil como valores de fábrica | `borda` | C13 — spam tem prazo de 15 dias e é apagado em lotes de até 10.000 |

### REQ-084 — Enviar ao serviço de reputação apenas o que a classificação exige

`must` · `bloqueado` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-084-1` | monta a requisição a partir de uma lista de campos declarada num lugar só | `feliz` | O conjunto de campos enviados ao serviço é declarado em um lugar só, campo a campo |
| `UT-084-2` | descarta todo cabeçalho que não consta da lista declarada | `erro` | Nenhum cabeçalho de requisição é enviado sem constar dessa lista declarada |
| `UT-084-3` | expõe a lista a quem administra antes de o primeiro comentário ser enviado | `feliz` | A lista é inspecionável por quem administra o site, antes de o primeiro comentário ser enviado |
| `UT-084-4` | declara no aviso de privacidade a transferência e os campos que ela leva | `feliz` | O aviso de privacidade do site declara essa transferência e os campos que ela leva |
| `UT-084-5` | recusa enviar todo campo de texto do corpo e todo cabeçalho recebido | `erro` | A maior exportação de dado pessoal do sistema sai de um formulário anônimo: cada comentário submetido envia ao serviço todo campo de texto do corpo da requisição e todo cabeçalho exceto o de sessão |

**Achados do QA**

- Card bloqueado por decisão humana: reduzir o que sai pode mudar a taxa de acerto da classificação, e o compromisso entre privacidade e acerto é decisão de produto com jurídico. Estes testes provam o mecanismo (lista declarada e filtro), não a escolha de quais campos entram na lista — essa escolha é que está bloqueada.
- A lacuna IG6 de `integrations.md` registra que não se sabe sequer se o serviço está ativo nesta instalação, porque não há valor para a credencial.

### REQ-085 — Descartar o rebaixamento para canal sem cifra após falha de negociação segura

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- Os quatro critérios deste card são a negação de um comportamento, e a prova positiva correspondente já está em REQ-149 (UT-149-3: falha de negociação segura resulta em erro, nunca em repetição sem cifra) e em REQ-082 (UT-082-2: com o serviço indisponível, a decisão volta às regras locais). Não há comportamento próprio a testar aqui.

### REQ-180 — Servir a imagem de quem comenta sem enviar o dado dele a terceiro

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-180-1` | deixa a marcação de fábrica sem requisição do navegador do leitor a serviço externo | `borda` | O comportamento de fábrica não produz requisição do navegador do leitor a serviço externo de imagem |
| `UT-180-2` | declara a transferência a terceiro no momento de ligar o serviço externo | `feliz` | Quem administra o site pode ligar o serviço externo, e a tela declara, nesse momento, que isso envia a identificação de cada autor de comentário a terceiro |
| `UT-180-3` | serve imagem de reserva pelo próprio site com o serviço desligado | `feliz` | Com o serviço desligado, há imagem de reserva servida pelo próprio site |
| `UT-180-4` | declara a transferência no aviso de privacidade quando o serviço está ligado | `feliz` | O aviso de privacidade do site declara essa transferência quando ela está ligada |
| `UT-180-5` | recusa transformar o endereço de e-mail de quem comenta em requisição a terceiro | `erro` | A imagem de quem comenta é buscada por hash do e-mail num serviço externo, e a requisição é feita pelo navegador do leitor |
| `UT-180-6` | mantém a marcação servida sem endereço de terceiro, sem depender do que o navegador faria | `feliz` | Metade do comportamento desta integração está fora da árvore: o que o navegador faz por conta própria não é verificável aqui |

---

## EP-8 — Privacidade e dados pessoais

Exportar e apagar dado pessoal com prova de titularidade

10 cards · 61 testes de unidade

### REQ-086 — Abrir solicitação de dados pessoais identificada pelo endereço de e-mail

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-086-1` | recusa abrir a solicitação a quem não tem a capacidade de privacidade da ação pedida | `erro` | A solicitação exige a capacidade de privacidade correspondente à ação pedida, verificada antes de a tela abrir |
| `UT-086-2` | cria a solicitação pendente vinculada ao endereço de e-mail informado | `feliz` | A solicitação nasce num estado pendente, vinculada ao endereço de e-mail informado, e não à conta |
| `UT-086-3` | aceita solicitação para titular que não tem conta no site | `feliz` | Titular sem conta no site tem solicitação válida do mesmo jeito |
| `UT-086-4` | apresenta a solicitação na lista aguardando o titular, com o estado visível | `feliz` | A solicitação aparece na lista aguardando o titular, com o estado visível |
| `UT-086-5` | deixa de exportar e de apagar qualquer coisa na abertura | `borda` | Nada é exportado nem apagado na abertura |
| `UT-086-6` | guarda a solicitação como registro de conteúdo de tipo próprio com quatro estados dedicados | `feliz` | D1 — a solicitação é um registro de conteúdo de tipo próprio, com quatro estados dedicados |
| `UT-086-7` | trava a execução enquanto o titular não confirmar | `borda` | D2 — nada acontece sem confirmação do titular |

### REQ-087 — Exigir confirmação do titular por chave com prazo declarado

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-087-1` | guarda a chave com hash e deixa o valor em claro só na mensagem ao titular | `feliz` | A chave de confirmação é guardada com hash; o valor em claro só existe no e-mail enviado ao titular |
| `UT-087-2` | aceita a chave no limite de 24 horas e recusa por prazo vencido depois dele | `borda` | A chave é válida por 24 horas e a validação fora do prazo é recusada com aviso de prazo vencido |
| `UT-087-3` | aceita a validação nos estados pendente e de falha de envio | `feliz` | A validação só é aceita enquanto a solicitação está pendente ou em falha de envio |
| `UT-087-4` | recusa a validação de solicitação já concluída | `erro` | Solicitação já concluída recusa a validação: um pedido executado não é reconfirmável |
| `UT-087-5` | apaga a chave e avisa quem administra ao confirmar | `feliz` | Confirmar apaga a chave e avisa quem administra o site de que a solicitação está pronta para execução |
| `UT-087-6` | recusa chave inválida com erro genérico | `erro` | Chave inválida é recusada com erro genérico |
| `UT-087-7` | mantém a chave guardada apenas como hash pelas 24 horas de validade | `borda` | D2 — nada acontece sem confirmação do titular; a chave vale 24 horas e é guardada com hash |
| `UT-087-8` | valida a chave sem consultar o modelo de capacidades | `feliz` | A chave de confirmação é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades |

### REQ-088 — Tratar a falha de envio como estado reenviável, não como erro perdido

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-088-1` | move a solicitação para o estado próprio de falha quando o envio não sai | `erro` | Falha no envio move a solicitação para um estado próprio de falha, e não a deixa pendente nem a apaga |
| `UT-088-2` | aceita a validação de chave estando a solicitação em falha de envio | `borda` | O estado de falha aceita validação de chave, para que um clique no link antigo não trave o fluxo para sempre |
| `UT-088-3` | gera chave nova e devolve a solicitação ao estado pendente ao reenviar | `feliz` | Reenviar gera chave nova e devolve a solicitação ao estado pendente |
| `UT-088-4` | apresenta na lista o estado de cada solicitação com o instante da última alteração | `feliz` | O estado de cada solicitação é visível na lista, com o instante da última alteração |
| `UT-088-5` | trata a falha de envio como estado reenviável, e não como exceção que descarta o pedido | `erro` | D3 — falha de envio de e-mail é estado, não exceção, e é por isso que o estado de falha aceita validação de chave |

### REQ-089 — Expirar solicitação não confirmada, apagando a chave no mesmo comando

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-089-1` | move para falha as pendentes alteradas além de 24 horas e poupa a que está no limite | `borda` | Rotina agendada procura solicitações pendentes alteradas há mais de 24 horas e as move para o estado de falha |
| `UT-089-2` | recusa por inexistência o link antigo, porque a chave é apagada no mesmo comando | `erro` | A chave é apagada do registro no mesmo comando que muda o estado: o link deixa de existir, não apenas de valer |
| `UT-089-3` | deixa intocada a solicitação que já está em falha | `borda` | Solicitação já em falha não é tocada pela rotina |
| `UT-089-4` | agenda a expiração num site em que ninguém visitou a tela de privacidade | `feliz` | O agendamento existe num site que ninguém administra, sem depender de visita à tela de privacidade |
| `UT-089-5` | expira para falha e apaga a chave na mesma operação | `borda` | D3b — solicitação não confirmada em 24 horas expira para o estado de falha, e a chave é apagada no mesmo comando |
| `UT-089-6` | expira na hora marcada sem depender de chegar requisição ao site | `feliz` | A9 — a fila só avança quando chega requisição HTTP |
| `UT-089-7` | registra o evento de expiração no caminho público da requisição | `feliz` | ADR 0006 — retenção agendada por visita ao painel: este caso é a correção parcial dele |

### REQ-090 — Exportar os dados percorrendo os provedores registrados, página por página

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-090-1` | recusa a execução fora do estado confirmado | `erro` | A execução só é permitida a partir do estado confirmado |
| `UT-090-2` | chama cada provedor por página até todos declararem conclusão | `feliz` | Cada provedor de dados é chamado por página e declara se terminou; a execução repete até todos declararem conclusão |
| `UT-090-3` | reporta o provedor que falha sem interromper os demais | `erro` | Um provedor que falha é reportado e não interrompe os demais |
| `UT-090-4` | grava o arquivo no armazenamento e entrega o endereço ao titular | `feliz` | O resultado é um arquivo guardado no armazenamento e o titular recebe o endereço dele |
| `UT-090-5` | termina a solicitação no estado concluído com o titular avisado | `feliz` | A solicitação termina no estado concluído, com o titular avisado |
| `UT-090-6` | retoma do ponto em que parou sem duplicar nem perder dado | `borda` | Uma execução interrompida pode ser retomada do ponto em que parou, sem duplicar nem perder dado |
| `UT-090-7` | executa a exportação a partir do registro da solicitação, só depois de confirmada | `feliz` | D1, D2 — a solicitação é um registro de conteúdo e só executa a partir de confirmada |

### REQ-091 — Apagar os dados informando o que não pôde ser removido

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-091-1` | recusa a execução do apagamento fora do estado confirmado | `erro` | A execução só é permitida a partir do estado confirmado |
| `UT-091-2` | coleta de cada provedor quantos itens removeu e quantos não pôde remover | `feliz` | Cada provedor de apagamento informa quantos itens removeu e quantos não pôde remover |
| `UT-091-3` | lista no relatório final o que não pôde ser removido e o motivo de cada provedor | `feliz` | O relatório final lista o que não pôde ser removido e o motivo declarado por cada provedor |
| `UT-091-4` | termina a solicitação no estado concluído com o titular avisado | `feliz` | A solicitação termina no estado concluído, com o titular avisado |
| `UT-091-5` | deixa todo dado intacto enquanto o titular não confirma | `erro` | Nenhum dado é removido antes da confirmação do titular |
| `UT-091-6` | exige o poder de rede para apagar dado de terceiro em instalação em rede | `feliz` | D1, D2, D4 — a solicitação é um registro de conteúdo, só executa a partir de confirmada, e a capacidade é de rede |

### REQ-092 — Proteger o arquivo de exportação por verificação de identidade

`must` · `bloqueado` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-092-1` | recusa a entrega do arquivo a quem apenas conhece o endereço | `erro` | Baixar o arquivo exige prova de identidade do titular, não apenas conhecer o endereço |
| `UT-092-2` | registra cada download com instante e origem da requisição | `feliz` | Cada download fica registrado com instante e origem da requisição |
| `UT-092-3` | recusa a entrega por endereço vencido mesmo com o arquivo ainda existindo | `erro` | Um endereço de download vencido recusa a entrega, mesmo que o arquivo ainda exista |
| `UT-092-4` | deixa de aceitar a imprevisibilidade do nome como única proteção | `erro` | No legado o arquivo vive no diretório de envios por três dias e a proteção é a imprevisibilidade do nome, não uma verificação de identidade |

**Achados do QA**

- AC2 (o arquivo não fica em diretório servido diretamente pelo servidor web) exige teste de integração: é propriedade do ambiente de implantação, e se prova contra um servidor real pedindo o caminho do arquivo, não por teste de unidade.
- Card bloqueado por decisão humana: o titular pode não ter conta no site (REQ-086 AC3), logo exigir prova de identidade depende de decidir como um titular sem conta prova quem é. Os testes acima provam que conhecer o endereço não basta; qual é a prova aceita continua em aberto.

### REQ-093 — Apagar o arquivo de exportação no prazo declarado

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-093-1` | apaga o arquivo com mais de três dias e poupa o que está no limite | `borda` | Arquivo de exportação com mais de três dias é apagado por rotina agendada |
| `UT-093-2` | roda a varredura ao menos uma vez por hora | `borda` | A varredura roda ao menos uma vez por hora |
| `UT-093-3` | agenda a varredura num site que ninguém administra | `feliz` | O agendamento existe num site que ninguém administra |
| `UT-093-4` | preserva o registro da solicitação ao apagar o arquivo | `feliz` | Apagar o arquivo não apaga o registro da solicitação, que continua como prova do procedimento |
| `UT-093-5` | registra ao fim de cada execução quantos arquivos apagou | `feliz` | Cada execução registra quantos arquivos apagou |
| `UT-093-6` | usa três dias de validade e varredura horária como valores declarados | `borda` | R7 — o arquivo de exportação vale três dias e a varredura é horária; este evento é registrado no caminho público, logo existe mesmo num site que ninguém administra |

**Achados do QA**

- Card `must` sem teste de erro: os critérios descrevem uma rotina de retenção e o card não declara caminho de falha próprio. A recusa de entrega de arquivo vencido é o objeto de REQ-092 (UT-092-3).

### REQ-094 — Declarar a retenção do registro de solicitação concluída

`should` · `bloqueado` · veredito `parcial` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-094-1` | exige prazo de retenção declarado para o registro de solicitação concluída | `feliz` | O registro de solicitação concluída tem prazo de retenção declarado |
| `UT-094-2` | remove ou reduz aos campos de prova mínima o registro que passou do prazo | `borda` | Passado o prazo, uma rotina o remove ou o reduz aos campos declarados como prova mínima |
| `UT-094-3` | informa na tela de privacidade qual é o prazo declarado | `feliz` | A tela de privacidade informa qual é o prazo |
| `UT-094-4` | deixa de aceitar registro de solicitação concluída sem política de retenção | `feliz` | O registro da solicitação concluída não tem política de retenção no legado |
| `UT-094-5` | aplica a mesma política de retenção ao registro de cadastro | `feliz` | R8 — o registro de cadastro também não tem política de retenção: acumula origem e e-mail indefinidamente |

**Achados do QA**

- BR3 (L7 — não há política de retenção declarada e a decisão é de produto, não investigação) não tem comportamento a provar: é a constatação de uma ausência no legado somada a uma decisão pendente, e não um requisito do sistema novo.
- Card bloqueado por decisão humana: o prazo depende de obrigação legal da jurisdição em que o site opera. Os testes acima provam que existe prazo, que ele é aplicado e que é publicado; qual é o número continua em aberto.

### REQ-095 — Tratar exportar e apagar dado de terceiro como poder do nível mais alto da instalação

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-095-1` | resolve as três capacidades de privacidade para o poder de rede em instalação em rede | `feliz` | As capacidades de exportar e apagar dado de terceiro, e a de administrar configuração de privacidade, resolvem para o poder de rede quando a instalação é em rede |
| `UT-095-2` | resolve as mesmas capacidades para o poder de administrar a instalação fora de rede | `feliz` | Fora de rede, elas resolvem para o poder de administrar a instalação |
| `UT-095-3` | nega as capacidades de privacidade a todo papel abaixo do nível mais alto | `erro` | Nenhum papel abaixo desse nível recebe essas capacidades por padrão |
| `UT-095-4` | soma a capacidade de privacidade às de apagar para remover a página de política | `erro` | Apagar a página de política de privacidade exige a capacidade de privacidade somada às capacidades normais de apagar conteúdo |
| `UT-095-5` | trata mexer em dado pessoal de terceiro como poder de rede, não como poder de site | `feliz` | D4 — exportar ou apagar dados de terceiro é poder de rede |
| `UT-095-6` | recusa editar a página de política a quem não tem a capacidade de privacidade | `erro` | D5 — a página de política de privacidade é protegida pela própria capacidade de privacidade |

---

## EP-9 — Apresentação e personalização

A aparência do site, e quem a muda sem publicar sem querer

16 cards · 86 testes de unidade

### REQ-096 — Pré-visualizar alterações de aparência antes de elas chegarem ao visitante

`must` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-096-1` | cria o conjunto de alterações sem afetar o que o visitante vê | `feliz` | Abrir a personalização cria um conjunto de alterações que não afeta o que o visitante vê |
| `UT-096-2` | aplica as alterações apenas na prévia de quem está personalizando | `feliz` | A prévia mostra o site com as alterações aplicadas apenas para quem está personalizando |
| `UT-096-3` | guarda e retoma o conjunto sem aplicá-lo | `feliz` | O conjunto pode ser salvo e retomado depois, sem ser aplicado |
| `UT-096-4` | recusa aplicar o conjunto a quem não tem a capacidade declarada de administrar aparência | `erro` | A aplicação exige a capacidade declarada de administrar a aparência |
| `UT-096-5` | cria como rascunho automático o arquivo enviado dentro da personalização | `feliz` | Arquivo enviado dentro da personalização nasce como rascunho automático, para ser coletado se o conjunto for abandonado |
| `UT-096-6` | recusa o estado fora dos aceitos e o rascunho automático pedido pelo cliente | `erro` | Estado pedido fora dos aceitos é recusado, e o estado de rascunho automático não pode ser pedido por quem chama a API |
| `UT-096-7` | guarda o conjunto de alterações como conteúdo com estado próprio | `feliz` | Changeset é o conjunto de alterações da personalização guardado como conteúdo, com estado próprio |
| `UT-096-8` | exige verificação separada para publicar ou agendar, além dos quatro estados de escrita | `borda` | A escrita só aceita quatro estados; publicar ou agendar exige verificação separada |

**Achados do QA**

- BR3 (a personalização resolve para a capacidade de administrar aparência) ficou sem teste próprio: o teto de oito foi atingido e o comportamento é provado por UT-096-4; a declaração dessa capacidade na matriz é o objeto de REQ-097 (UT-097-3).

### REQ-097 — Separar a permissão de salvar a alteração de aparência da de aplicá-la

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-097-1` | verifica as duas permissões em pontos distintos do fluxo | `feliz` | As duas permissões são verificadas em pontos distintos: uma para gravar o conjunto, outra para aplicá-lo |
| `UT-097-2` | deixa o conjunto guardado aguardando quem possa aplicá-lo | `feliz` | Quem pode salvar e não pode aplicar deixa o conjunto guardado aguardando quem possa |
| `UT-097-3` | declara na matriz a permissão de editar o conjunto | `feliz` | A permissão de editar o conjunto é declarada na matriz, e não concedida por caminho indireto |
| `UT-097-4` | recusa abrir a tela a quem não tem nenhuma das duas permissões | `erro` | Quem não tem nenhuma das duas não abre a tela |
| `UT-097-5` | mantém a permissão de salvar com todos os pontos de extensão desligados | `erro` | O legado concede por filtro a capacidade de editar o conjunto, traduzindo a capacidade de conteúdo para as do tipo. Quem migrar pela matriz de papéis produz um sistema em que ninguém salva |

### REQ-098 — Informar ao ator o estado que de fato foi gravado

`must` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-098-1` | informa na resposta o estado em que o conjunto de fato ficou | `feliz` | A resposta ao aplicar um conjunto de alterações informa o estado real em que o conjunto ficou |
| `UT-098-2` | informa separadamente que os valores de aparência foram aplicados ao site | `feliz` | A resposta informa separadamente que os valores de aparência foram aplicados ao site |
| `UT-098-3` | recusa emitir resposta cujo estado anunciado não é o gravado | `erro` | Nenhuma resposta do sistema anuncia um estado diferente do gravado |
| `UT-098-4` | reporta o estado real quando o conjunto vai para a lixeira depois de aplicado | `erro` | Depois de aplicado, o conjunto vai para a lixeira e a resposta reporta publicado — e não é o que está gravado |

### REQ-099 — Agendar a aplicação de uma alteração de aparência

`could` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-099-1` | aceita data futura no conjunto e o deixa aguardando | `feliz` | O conjunto de alterações aceita data futura e passa a aguardar, como qualquer conteúdo agendado |
| `UT-099-2` | aplica o conjunto pela mesma rotina que publica conteúdo agendado | `feliz` | A aplicação acontece pela mesma rotina que publica conteúdo agendado |
| `UT-099-3` | mantém a aparência anterior para o visitante antes da data | `feliz` | Antes da data, o visitante continua vendo a aparência anterior |
| `UT-099-4` | devolve o conjunto ao estado guardado ao cancelar o agendamento | `feliz` | Cancelar o agendamento devolve o conjunto ao estado guardado, sem aplicar |
| `UT-099-5` | exige evento e estado agendado juntos para aplicar o conjunto | `borda` | P6 — agendamento é guardado por verificação dupla |

### REQ-100 — Montar menu de navegação com itens que apontam para conteúdo, classificação ou endereço externo

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-100-1` | recusa criar ou editar menu a quem não tem a capacidade de administrar aparência | `erro` | Criar e editar menu exige a capacidade declarada de administrar aparência |
| `UT-100-2` | aceita item apontando para conteúdo, para classificação e para endereço externo | `feliz` | Um item do menu pode apontar para um conteúdo, para uma classificação ou para um endereço externo |
| `UT-100-3` | preserva a ordem e a hierarquia dos itens entre gravações | `feliz` | A ordem e a hierarquia dos itens são preservadas e editáveis |
| `UT-100-4` | grava como configuração do site a associação entre menu e posição do tema | `feliz` | O menu é associado a uma posição declarada pelo tema, e a associação é configuração do site |
| `UT-100-5` | permite usar o menu por outro meio quando o tema não declara posição | `borda` | Tema sem posição declarada ainda permite usar o menu por outro meio |
| `UT-100-6` | guarda o menu como contexto de classificação cujos itens são conteúdo | `feliz` | Um menu de navegação é um contexto de classificação, e cada item do menu é um conteúdo |
| `UT-100-7` | libera menus, componentes e personalização com a mesma capacidade | `feliz` | A capacidade de administrar aparência libera menus, componentes e personalização, e é exclusiva do papel de administração |

### REQ-101 — Sinalizar e limpar item de menu que aponta para conteúdo que não existe mais

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-101-1` | marca na tela os itens cujo destino não existe mais | `feliz` | A tela de menus marca visualmente os itens cujo destino não existe mais |
| `UT-101-2` | remove de uma vez todos os itens órfãos do menu | `feliz` | Existe ação para remover de uma vez todos os itens órfãos de um menu |
| `UT-101-3` | avisa que o conteúdo está referenciado em menu antes de apagá-lo | `feliz` | Apagar um conteúdo avisa que ele está referenciado em menu, antes de apagar |
| `UT-101-4` | omite o item órfão na renderização para o visitante | `borda` | Item órfão não é renderizado para o visitante |
| `UT-101-5` | detecta o item que aponta para o nada em lugar de deixá-lo passar | `erro` | No legado, item que aponta para conteúdo apagado permanece no menu e aponta para o nada; nenhuma rotina limpa itens órfãos |

### REQ-102 — Organizar componentes nas áreas que o tema oferece

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-102-1` | recusa colocar, configurar ou retirar componente a quem não tem a capacidade declarada | `erro` | Colocar, configurar e retirar componente exige a capacidade declarada de administrar aparência |
| `UT-102-2` | grava como configuração do site a configuração de cada componente e o mapa de áreas | `feliz` | A configuração de cada componente e o mapa de áreas ficam gravados como configuração do site |
| `UT-102-3` | produz o mesmo resultado editando pela tela, pela personalização e pela superfície programática | `feliz` | A mesma estrutura é editável pela tela dedicada, pela personalização e pela API, com o mesmo resultado |
| `UT-102-4` | limpa de uma vez os componentes que ficaram sem área | `feliz` | Existe ação para limpar de uma vez os componentes que ficaram sem área |
| `UT-102-5` | mantém componente e área fora de tabela própria | `feliz` | Componente e área vivem em configuração do site, não em tabela própria |
| `UT-102-6` | libera componentes, menus e personalização pela mesma capacidade | `feliz` | A capacidade de administrar aparência libera menus, componentes e personalização |

### REQ-103 — Preservar a configuração dos componentes quando o tema muda

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-103-1` | move para inativos os componentes cujas áreas deixaram de existir, sem apagar nada | `feliz` | Trocar o tema move para uma área de inativos os componentes cujas áreas deixaram de existir, sem apagar nada |
| `UT-103-2` | preserva guardada a configuração do tema anterior | `feliz` | A configuração do tema anterior permanece guardada e não é apagada |
| `UT-103-3` | permite recolocar os componentes por ação explícita ao voltar ao tema anterior | `borda` | Voltar ao tema anterior permite recolocar os componentes nas áreas, por ação explícita |
| `UT-103-4` | informa na tela quais componentes foram para inativos e por quê | `feliz` | A tela diz quais componentes foram para inativos e por quê |
| `UT-103-5` | mantém tudo gravado na troca de tema, sem apagar e sem restaurar sozinho | `borda` | Trocar de tema faz as áreas do tema anterior desaparecerem e seus componentes irem para inativos; nada é apagado e nada volta sozinho |

**Achados do QA**

- Card `must` sem teste de erro: os cinco critérios descrevem preservação de dado numa operação bem-sucedida e o card não declara caminho de falha próprio. A recusa de tema inválido e a negação por falta de capacidade são o objeto de REQ-104 (UT-104-1 e UT-104-2).

### REQ-104 — Trocar o tema ativo

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-104-1` | recusa a ativação sem a capacidade declarada ou sem o token da ação | `erro` | A ativação exige a capacidade declarada de trocar tema e a confirmação do token da ação |
| `UT-104-2` | recusa tema inválido mantendo o tema anterior ativo | `erro` | Tema inválido é recusado e o tema anterior continua ativo |
| `UT-104-3` | troca a aparência sem alterar conteúdo nem critérios de consulta | `feliz` | O tema ativo é configuração do site, e trocá-lo não altera conteúdo nem consulta |
| `UT-104-4` | recusa apagar o tema que está ativo | `erro` | O tema ativo não pode ser apagado |
| `UT-104-5` | exige poder de rede para trocar o tema em instalação em rede | `erro` | Em instalação em rede, a troca é poder de rede |
| `UT-104-6` | nega a toda conta instalar, atualizar e apagar tema sob a proibição declarada | `erro` | Com a proibição de modificar arquivos declarada, instalar, atualizar e apagar tema são negados a toda conta |
| `UT-104-7` | guarda o tema ativo como configuração do site e a identidade do tema como contexto de classificação | `feliz` | O tema ativo é uma configuração do site, e a identidade do tema também é um contexto de classificação |
| `UT-104-8` | restringe as capacidades de instalação ao papel de administração e, em rede, a quem administra a rede | `erro` | As capacidades de instalação são exclusivas do papel de administração, e em rede são negadas a quem não administra a rede |

### REQ-105 — Recorrer a um tema de reserva quando o tema ativo não pode ser carregado

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-105-1` | recorre ao tema de reserva quando o tema ativo não pode ser carregado | `erro` | Tema ativo que não pode ser carregado faz o sistema recorrer ao tema de reserva declarado |
| `UT-105-2` | informa a substituição a quem administra o site | `feliz` | A substituição é informada a quem administra o site, não silenciosa |
| `UT-105-3` | preserva a configuração do tema ativo durante a substituição | `feliz` | A configuração do tema ativo não é reescrita pela substituição: voltar a ter o tema resolve |
| `UT-105-4` | declara o que falta quando o tema de reserva também está ausente | `erro` | Com o tema de reserva também ausente, a resposta diz o que falta em lugar de falhar sem mensagem |
| `UT-105-5` | usa o mesmo tema declarado em constante como aparência inicial e como recuperação | `feliz` | O tema de reserva é declarado em constante e serve de aparência inicial e de recuperação |

### REQ-172 — Declarar e enfileirar os recursos de interface com dependência e versão

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-172-1` | registra cada recurso com identificador, endereço, dependências e versão | `feliz` | Cada recurso é registrado com identificador, endereço, dependências e versão |
| `UT-172-2` | respeita as dependências na ordem de entrega e reporta a que falta | `erro` | A ordem de entrega respeita as dependências declaradas, e uma dependência ausente é reportada |
| `UT-172-3` | inclui a versão declarada no endereço servido | `feliz` | A versão declarada entra no endereço servido, de modo que trocar a versão invalide o cache do navegador |
| `UT-172-4` | deixa de entregar o recurso declarado que a página não usa | `borda` | Um recurso declarado e não usado na página não é entregue |
| `UT-172-5` | entrega uma só vez o recurso declarado duas vezes | `borda` | O mesmo recurso declarado duas vezes é entregue uma só |

### REQ-173 — Resolver em folha de estilo os estilos que o tema declara

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-173-1` | resolve o contrato declarativo do tema numa folha de estilo servida à página | `feliz` | O contrato declarativo do tema é resolvido numa folha de estilo servida à página |
| `UT-173-2` | combina as declarações do tema, do site e do conteúdo na ordem de precedência declarada | `feliz` | A declaração do tema, a do site e a do conteúdo são combinadas em ordem de precedência declarada |
| `UT-173-3` | reporta a declaração inválida a quem desenvolve o tema | `erro` | Uma declaração inválida é reportada a quem desenvolve o tema, e não ignorada em silêncio |
| `UT-173-4` | invalida a folha cacheada quando qualquer das declarações muda | `borda` | A folha gerada é cacheável e invalida quando qualquer das declarações muda |
| `UT-173-5` | produz o CSS a partir do contrato declarativo, sem folha mantida à mão | `feliz` | O contrato declarativo de estilos e recursos do tema é resolvido em CSS pelo motor de estilos |

### REQ-174 — Gerenciar a biblioteca de fontes do site

`could` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-174-1` | disponibiliza a fonte instalada para as declarações de estilo do tema | `feliz` | Fonte instalada passa a estar disponível para as declarações de estilo do tema |
| `UT-174-2` | serve pelo próprio site a fonte vinda de arquivo | `feliz` | Fonte vinda de arquivo é servida pelo próprio site |
| `UT-174-3` | valida o endereço de origem da fonte de catálogo antes de qualquer download | `erro` | Fonte vinda de catálogo externo tem o seu endereço de origem declarado, e o endereço é validado antes de qualquer download |
| `UT-174-4` | avisa quais declarações referenciam a fonte antes de apagá-la | `feliz` | Apagar uma fonte em uso avisa quais declarações a referenciam, antes de apagar |
| `UT-174-5` | declara na tela se cada fonte é servida pelo site ou por terceiro | `feliz` | A tela diz, para cada fonte, se ela é servida pelo site ou por terceiro |
| `UT-174-6` | resolve o endereço do serviço de fontes pelo catálogo declarado | `feliz` | Nenhum endereço de serviço de fonte aparece no código PHP: ele vem do catálogo em JSON, e o download é feito pelo navegador. Metade do comportamento está fora desta árvore |

**Achados do QA**

- Confiança herdada: metade do comportamento desta integração está fora da árvore analisada — o download da fonte de catálogo é feito pelo navegador, não pelo servidor. Os seis testes acima cobrem o lado do servidor; o que o navegador faz por conta própria precisa de teste de integração com o pacote completo da distribuição.

### REQ-175 — Oferecer o conjunto de ícones da interface por registro declarado

`could` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-175-1` | devolve a marcação registrada ao pedir o ícone pelo nome | `feliz` | Pedir um ícone pelo nome devolve a marcação registrada para ele |
| `UT-175-2` | devolve ausência identificável para nome não registrado, sem quebrar a página | `erro` | Nome não registrado devolve ausência identificável, sem quebrar a página |
| `UT-175-3` | aceita um conjunto novo de ícones sem alterar quem os consome | `feliz` | Um conjunto novo de ícones pode ser registrado sem alterar quem os consome |
| `UT-175-4` | entrega o ícone sem requisição a terceiro | `feliz` | O ícone servido não depende de requisição a terceiro |

### REQ-176 — Entregar ao menos um tema completo junto com o produto

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-176-1` | entrega instalação nova com tema ativo que resolve todos os tipos de apresentação | `feliz` | A instalação nova tem um tema ativo que resolve todos os tipos de apresentação declarados |
| `UT-176-2` | usa o tema entregue como reserva quando o tema ativo falha | `feliz` | O tema entregue serve também de reserva quando o tema ativo falha |
| `UT-176-3` | traz no tema entregue o contrato declarativo de estilos completo | `feliz` | O tema entregue traz o contrato declarativo de estilos completo |
| `UT-176-4` | declara quantos temas acompanham o produto e mantém cada um deles | `borda` | A quantidade de temas que acompanham o produto é decidida e declarada, e cada um deles é mantido |
| `UT-176-5` | usa o mesmo tema declarado em constante como inicial e como reserva | `feliz` | O tema de reserva é declarado em constante e serve de aparência inicial e de recuperação |

### REQ-177 — Tornar interativo o conteúdo renderizado sem recarregar a página

`could` · `bloqueado` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-177-1` | declara estado e comportamento interativo na própria marcação servida | `feliz` | Uma unidade de conteúdo pode declarar estado e comportamento interativo na própria marcação servida |
| `UT-177-2` | serve a página com conteúdo completo quando o comportamento interativo não está disponível | `borda` | A página funciona, com conteúdo completo, com o comportamento interativo indisponível |
| `UT-177-3` | omite a declaração de interatividade quando ela é desligada por configuração | `borda` | O comportamento interativo é desligável por configuração |

**Achados do QA**

- AC3 (a transição entre páginas preserva o que a declaração do tema pedir) exige teste de integração: a preservação acontece no navegador, entre duas navegações, e nenhum teste de unidade do lado do servidor a alcança.
- Card bloqueado pela mesma lacuna de REQ-032, registrada em `use-cases.json` G3 e `domain.md` L3: `wp-includes/js/dist/` não existe nesta árvore, logo o lado cliente inteiro está fora da análise. Os três testes acima cobrem o que o servidor emite — a marcação de estado e a diretiva.

---

## EP-10 — Operação do próprio software

Instalar, atualizar, diagnosticar e recuperar o sistema

16 cards · 111 testes de unidade

### REQ-106 — Instalar e atualizar extensão a partir do catálogo ou de arquivo enviado

`must` · `pronto` · veredito `aprovado` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-106-1` | recusa a instalação sem a capacidade declarada ou sem o token da tela | `erro` | A ação exige a capacidade declarada e a confirmação do token da tela |
| `UT-106-2` | obtém o endereço do pacote consultando o serviço de distribuição | `feliz` | A instalação a partir do catálogo consulta o serviço de distribuição e obtém o endereço do pacote |
| `UT-106-3` | instala a partir de arquivo enviado sem consultar o serviço de distribuição | `feliz` | A instalação a partir de arquivo enviado exige a capacidade declarada de envio de pacote, que resolve para a de instalar, e não consulta o serviço |
| `UT-106-4` | exige capacidade distinta da de instalar para ativar o plugin | `erro` | Ativar o plugin depois de instalar exige uma capacidade distinta da de instalar |
| `UT-106-5` | verifica a capacidade uma vez no lote e dá resultado próprio a cada item | `borda` | Numa atualização em lote, a capacidade é verificada uma vez e cada item tem resultado próprio; um que falha não interrompe os demais |
| `UT-106-6` | nega todas as capacidades de extensão sob a proibição de modificar arquivos | `erro` | Com a proibição de modificar arquivos declarada, todas essas capacidades são negadas a toda conta, inclusive à de maior poder |
| `UT-106-7` | exige poder de rede para instalar e atualizar em instalação em rede | `erro` | Em instalação em rede, a ação é poder de rede |
| `UT-106-8` | restringe as capacidades de instalação ao papel de administração e, em rede, a quem administra a rede | `erro` | As capacidades de instalação são exclusivas do papel de administração, e em rede são negadas a quem não administra a rede |

### REQ-107 — Verificar a autenticidade do pacote antes de o aplicar

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-107-1` | verifica o pacote contra uma chave pública válida antes de descompactar | `feliz` | Todo pacote baixado é verificado contra uma chave pública válida antes de ser descompactado |
| `UT-107-2` | aborta a atualização mantendo a versão anterior quando o pacote não prova autenticidade | `erro` | Pacote sem prova de autenticidade é recusado e a atualização é abortada, com a versão anterior intacta |
| `UT-107-3` | torna a recusa visível e registrada fora do modo de depuração | `erro` | A recusa é visível ao ator e fica registrada, independentemente de o site estar em modo de depuração |
| `UT-107-4` | recusa contornar a verificação sem registro explícito da decisão | `erro` | A verificação não é contornável por configuração sem registro explícito dessa decisão |
| `UT-107-5` | avisa no diagnóstico antes de a lista de chaves confiáveis vencer | `borda` | A lista de chaves confiáveis tem prazo declarado e o diagnóstico do site avisa antes de ela vencer |
| `UT-107-6` | recusa o pacote quando a lista de chaves confiáveis volta vazia | `erro` | A8 — a assinatura do pacote não é verificada: a lista de chaves confiáveis devolve lista vazia desde 2021-04-01 e nenhum chamador exige verificação |
| `UT-107-7` | exige a verificação em todo chamador do caminho de instalação | `feliz` | ADR 0010 — tolerar pacote sem assinatura verificada |
| `UT-107-8` | recusa operar quando a única chave da lista já venceu | `erro` | O marcador `// TODO: Add key #2 with longer expiration.` declara, por escrito, a chave substituta que nunca entrou |

### REQ-108 — Recusar atualização incompatível com o ambiente, informando o motivo

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-108-1` | compara a versão oferecida com o mínimo de ambiente antes de qualquer download | `feliz` | A versão oferecida é comparada com o mínimo de ambiente que ela declara, antes de qualquer download |
| `UT-108-2` | descarta a versão incompatível nomeando o requisito que falta | `erro` | Versão incompatível é descartada e o motivo é mostrado ao ator, nomeando o requisito que falta |
| `UT-108-3` | recusa pelo mesmo critério a extensão que declara mínimo de ambiente | `erro` | Extensão que declara mínimo de ambiente é recusada pelo mesmo critério |
| `UT-108-4` | produz sinal em todo descarte por incompatibilidade, inclusive no caminho automático | `erro` | O descarte por incompatibilidade nunca é silencioso, nem no caminho automático |
| `UT-108-5` | oferece o caminho de atualizar o ambiente a quem tem a capacidade declarada | `feliz` | A tela oferece o caminho para atualizar o ambiente a quem tem a capacidade declarada para isso |
| `UT-108-6` | deixa de oferecer versão que o ambiente não suporta, do núcleo ou de extensão | `feliz` | A4 — não se atualiza para versão que o ambiente não suporta; plugin e tema também declaram mínimo |
| `UT-108-7` | torna visível no diagnóstico o site parado numa versão antiga por ambiente velho | `erro` | No caminho automático, o descarte por incompatibilidade acontece em silêncio: um site parado numa versão antiga por ambiente velho não avisa ninguém |

### REQ-109 — Pôr em manutenção apenas o escopo afetado pela atualização

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-109-1` | coloca em manutenção apenas o site cuja extensão é atualizada | `feliz` | A atualização de extensão de um site coloca em manutenção apenas aquele site |
| `UT-109-2` | coloca em manutenção o escopo declarado para a atualização do núcleo | `feliz` | A atualização do núcleo coloca em manutenção o escopo que o núcleo afeta, declarado neste card |
| `UT-109-3` | retira a manutenção ao fim da operação, inclusive quando ela falha | `erro` | A manutenção é retirada ao fim da operação, inclusive quando ela falha |
| `UT-109-4` | detecta e remove sem acesso ao servidor a manutenção que ficou presa | `erro` | Uma manutenção que ficou presa é detectável e removível sem acesso ao servidor |
| `UT-109-5` | deixa a rede inteira fora da manutenção ao atualizar a extensão de um site | `feliz` | `@todo For multisite, maintenance mode should only kick in for individual sites` — atualizar um plugin coloca a rede inteira em manutenção |

### REQ-110 — Abortar a atualização sem deixar o destino quebrado

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-110-1` | aborta mantendo a versão anterior quando o pacote não baixa ou é inválido | `erro` | Pacote que não pôde ser baixado, ou é inválido, aborta a operação com a versão anterior intacta |
| `UT-110-2` | limpa o diretório temporário em todo caminho de saída, inclusive no de erro | `erro` | O diretório temporário é limpo em todo caminho de saída, inclusive no de erro |
| `UT-110-3` | reverte o destino para a versão anterior quando a substituição falha | `erro` | Falha na substituição de arquivos reverte o destino para a versão anterior |
| `UT-110-4` | classifica como falha crítica a reversão que também falha, com registro próprio | `erro` | Reversão que também falha é tratada como falha crítica, com registro próprio |
| `UT-110-5` | pede credenciais e cancela antes de tocar o destino não gravável | `erro` | Destino não gravável pede credenciais de acesso a arquivo e, sem elas, cancela antes de tocar o destino |
| `UT-110-6` | recusa a atualização automática em destino sem escrita ou sob controle de versão | `feliz` | A1 — atualização automática exige escrita no destino e ausência de controle de versão |
| `UT-110-7` | congela a automação após uma falha classificada como crítica | `feliz` | A5 — falha crítica congela a atualização automática até intervenção humana |

### REQ-111 — Atualizar o núcleo do sistema por decisão explícita

`must` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-111-1` | recusa a atualização do núcleo sem a capacidade declarada ou sem o token | `erro` | A ação exige a capacidade declarada de atualizar o núcleo e a confirmação do token da tela |
| `UT-111-2` | apresenta somente as ofertas aplicáveis ao ambiente | `feliz` | O sistema consulta o serviço de versões e apresenta só as ofertas aplicáveis ao ambiente |
| `UT-111-3` | executa a migração de esquema logo após a substituição de arquivos | `feliz` | A substituição de arquivos é seguida da migração de esquema, na mesma operação |
| `UT-111-4` | termina a reinstalação da mesma versão no mesmo estado da atualização | `feliz` | Reinstalar a mesma versão é um caminho oferecido e termina no mesmo estado |
| `UT-111-5` | exige poder de rede para atualizar o núcleo em instalação em rede | `erro` | Em instalação em rede, a ação é poder de rede |
| `UT-111-6` | apaga o registro de falha de atualização automática ao fim da operação | `feliz` | Ao fim, o registro de falha de atualização automática é apagado |
| `UT-111-7` | recusa a oferta cuja exigência de ambiente não é atendida | `feliz` | A4 — não se atualiza para versão que o ambiente não suporta |
| `UT-111-8` | verifica a assinatura do pacote também no caminho manual | `erro` | A8 — no legado, a assinatura do pacote não é verificada |

### REQ-112 — Migrar o esquema de dados com histórico das migrações aplicadas

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-112-1` | registra cada migração aplicada com identificador, versão, instante e resultado | `feliz` | Cada migração aplicada fica registrada com identificador, versão, instante e resultado |
| `UT-112-2` | salta a migração que já consta do histórico | `borda` | Uma migração já aplicada não é aplicada de novo |
| `UT-112-3` | deixa o estado declarado e registra onde parou quando a migração falha no meio | `erro` | Uma migração que falha no meio deixa o banco em estado declarado e o registro diz onde parou |
| `UT-112-4` | lista antes da atualização quais migrações faltam neste banco | `feliz` | É possível listar, antes de atualizar, quais migrações faltam neste banco |
| `UT-112-5` | decide o que aplicar pelo histórico, sem comparar a estrutura corrente com a desejada | `feliz` | A migração não depende de comparar a estrutura corrente com a estrutura desejada para decidir o que fazer |
| `UT-112-6` | substitui a comparação de estrutura por histórico consultável de migrações | `feliz` | A migração de esquema do legado é por comparação de estrutura, sem histórico de migrações aplicadas |

### REQ-113 — Atualizar o núcleo automaticamente conforme política declarada

`should` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-113-1` | aplica correção e manutenção por padrão e exige escolha explícita para versão principal | `feliz` | Correções de segurança e manutenção são aplicadas por padrão; mudança de versão principal só com escolha explícita |
| `UT-113-2` | faz a política declarada na instalação vencer a configuração guardada | `borda` | A política declarada na instalação vence a configuração guardada, e desligá-la desliga tudo |
| `UT-113-3` | recusa a automação em destino sem escrita ou sob controle de versão | `erro` | A atualização automática exige escrita no destino e ausência de controle de versão no diretório |
| `UT-113-4` | confere o ambiente antes de qualquer download | `feliz` | O ambiente é conferido antes de qualquer download |
| `UT-113-5` | consulta o registro de falha antes de decidir tentar aquela versão | `feliz` | O registro de falha é consultado antes de decidir tentar aquela versão |
| `UT-113-6` | apaga o registro de falha ao fim de uma atualização automática bem-sucedida | `feliz` | Ao fim de uma atualização bem-sucedida, o registro de falha é apagado |
| `UT-113-7` | restringe a versão principal à escolha explícita, mantendo correção e manutenção automáticas | `borda` | A2 — correção e manutenção por padrão; versão principal só com escolha explícita |
| `UT-113-8` | desliga todos os tipos de uma vez quando a declaração da instalação desliga a automação | `borda` | A3 — a declaração da instalação vence a configuração guardada, e desligar desliga tudo |

**Achados do QA**

- BR1 (A1 — atualização automática exige escrita no destino e ausência de controle de versão) ficou sem teste próprio: o teto de oito foi atingido e o comportamento é integralmente provado por UT-113-3.

### REQ-114 — Dar uma segunda chance à falha transitória e congelar a automação em falha crítica

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-114-1` | reagenda exatamente uma tentativa no prazo declarado após falha transitória | `borda` | Falha classificada como transitória reagenda exatamente uma tentativa, no prazo declarado |
| `UT-114-2` | evita repetir o mesmo par versão e origem após falha gravosa | `borda` | Falha classificada como gravosa não repete o mesmo par versão e origem, e volta a tentar quando outra versão for oferecida |
| `UT-114-3` | recusa toda versão até intervenção humana após falha crítica | `erro` | Falha classificada como crítica grava registro próprio e faz a automação recusar toda versão até intervenção humana |
| `UT-114-4` | resolve a severidade de cada tipo de falha por uma classificação declarada num lugar só | `feliz` | A classificação de cada tipo de falha é declarada em um lugar só |
| `UT-114-5` | guarda no registro de falha tentativa, versão, código de erro, instante e severidade | `feliz` | O registro de falha guarda tentativa, versão, código de erro, instante e severidade |
| `UT-114-6` | mantém a automação congelada enquanto nenhuma intervenção humana acontece | `erro` | A5 — falha crítica congela a atualização automática até intervenção humana |
| `UT-114-7` | deixa de notificar na primeira falha transitória e só avisa na segunda | `borda` | A6 — falha transitória tem exatamente uma segunda chance, em uma hora, e não notifica |
| `UT-114-8` | exige ato humano declarado para a automação voltar a operar | `erro` | ADR 0008 — falha crítica de atualização exige intervenção humana |

### REQ-115 — Avisar o responsável em todo cancelamento de atualização, sem repetir o mesmo aviso

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-115-1` | produz aviso em todo portão que cancela a atualização automática | `erro` | Todo portão que cancela a atualização automática produz aviso, inclusive o de incompatibilidade de ambiente |
| `UT-115-2` | nomeia no aviso o portão que barrou e o que precisa mudar | `feliz` | O aviso nomeia o portão que barrou e o que precisa mudar |
| `UT-115-3` | evita repetir o mesmo aviso para o mesmo destinatário e a mesma versão | `borda` | O mesmo aviso, para o mesmo destinatário e a mesma versão, não é enviado duas vezes |
| `UT-115-4` | guarda no registro de avisos destinatário, versão e tipo | `feliz` | O registro de avisos enviados guarda destinatário, versão e tipo |
| `UT-115-5` | expõe no diagnóstico o estado de não atualizar e o seu motivo | `feliz` | O estado "não atualiza, e por isto" é visível no diagnóstico do site, não só por e-mail |
| `UT-115-6` | entrega uma única mensagem quando a mesma causa se repete | `borda` | A7 — o mesmo aviso não é repetido |
| `UT-115-7` | deixa a primeira falha transitória sem mensagem e avisa na segunda | `borda` | A6 — falha transitória não notifica: só a segunda falha manda e-mail |
| `UT-115-8` | avisa qualquer que seja o portão, em lugar de depender de qual deles barrou | `erro` | No legado, um e-mail é enviado ou não, e a diferença depende de qual portão barrou |

### REQ-116 — Destravar a atualização congelada por caminho declarado e descoberto pelo ator

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-116-1` | declara na tela que a automação está congelada, por qual falha e qual a ação de destravar | `feliz` | Com a automação congelada, a tela de atualização diz que ela está congelada, por qual falha, e qual a ação que a destrava |
| `UT-116-2` | oferece ação explícita de destravar, sem depender de efeito colateral de outra operação | `feliz` | A ação de destravar é explícita e não depende de o ator adivinhar que uma atualização manual bem-sucedida tem esse efeito |
| `UT-116-3` | apaga o registro de falha e devolve a automação na execução seguinte | `feliz` | Destravar apaga o registro de falha e a automação volta a funcionar na execução seguinte |
| `UT-116-4` | resolve a condição de congelamento a partir de um único ponto declarado | `feliz` | O caminho de destravar não depende de uma invariante entre dois pontos do código: a condição é declarada em um lugar só |
| `UT-116-5` | recusa toda versão enquanto a automação está congelada | `erro` | A5 — falha crítica congela a atualização automática até intervenção humana |
| `UT-116-6` | exige ato humano para sair do congelamento, sem destravar sozinha com o tempo | `erro` | ADR 0008 — falha crítica de atualização exige intervenção humana |
| `UT-116-7` | destrava sem depender de uma atualização manual bem-sucedida | `erro` | No legado, só a atualização manual alcança a linha que apaga o registro, e essa invariante entre dois arquivos não é declarada em lugar algum |

### REQ-117 — Entrar em modo de recuperação quando um erro fatal derruba a área protegida

`must` · `pronto` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-117-1` | identifica a extensão responsável, gera a chave e envia o caminho a quem administra | `feliz` | Erro fatal em área protegida identifica a extensão responsável, gera uma chave de recuperação e envia o caminho de recuperação a quem administra o site |
| `UT-117-2` | cria sessão de recuperação com o prazo declarado ao abrir o caminho | `feliz` | Abrir o caminho de recuperação cria uma sessão própria, com prazo declarado |
| `UT-117-3` | pausa a extensão apenas para quem está na sessão de recuperação | `feliz` | Dentro dessa sessão, a extensão responsável está pausada apenas para quem está na sessão: o visitante continua vendo o site como estava |
| `UT-117-4` | deixa de acionar a recuperação quando o erro fatal acontece em área pública | `erro` | Erro fatal em área pública não aciona a recuperação |
| `UT-117-5` | retoma todas as extensões pausadas e zera o limite de avisos ao sair | `feliz` | Sair da recuperação retoma de uma vez todas as extensões pausadas e zera o limite de avisos |
| `UT-117-6` | limita o aviso a um por dia por sessão, gravando o marcador antes do envio | `borda` | O aviso é limitado a um por dia por sessão, e o marcador é gravado antes do envio, de modo que falhar em gravar significa não avisar |
| `UT-117-7` | encontra conta capaz de retomar extensão pausada numa instalação de fábrica | `borda` | Existe conta capaz de retomar extensão pausada numa instalação de fábrica |
| `UT-117-8` | encerra a sessão de recuperação ao fim de uma semana | `borda` | A10 — modo de recuperação dura uma semana e avisa uma vez por dia; o marcador é gravado antes do envio |

**Achados do QA**

- O card tem 7 critérios e 4 regras, isto é, onze unidades de prova contra um teto de oito. BR2 (A11 — erro em área pública não aciona recuperação, e extensão de rede é fora de escopo), BR3 (A12 — sair retoma todas de uma vez) e BR4 (o escopo da pausa é a sessão, não o site) ficaram sem teste próprio; as duas primeiras metades de BR2 e BR3 são provadas por UT-117-4 e UT-117-5, e BR4 por UT-117-3.
- Fica sem prova a metade de BR2 que trata extensão de rede como fora de escopo: nenhum critério de aceite a declara, e inventá-lo seria criar requisito. É pendência para quem refinar o card.

### REQ-118 — Verificar a chave de recuperação antes de a consumir

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-118-1` | verifica a chave antes de removê-la do armazenamento | `feliz` | A chave é verificada antes de ser removida do armazenamento |
| `UT-118-2` | preserva a chave válida ao recusar uma chave inválida | `erro` | Chave inválida é recusada e a chave válida continua existindo |
| `UT-118-3` | consome a chave válida no mesmo passo em que cria a sessão de recuperação | `feliz` | Chave válida é consumida no mesmo passo em que a sessão de recuperação é criada |
| `UT-118-4` | remove a chave vencida por rotina e gera chave nova num erro seguinte | `borda` | Chave vencida é removida por rotina agendada e um erro novo gera chave nova |
| `UT-118-5` | registra cada tentativa inválida sem expor contador ao requisitante | `erro` | Nenhum contador de tentativas é exposto, e cada tentativa inválida fica registrada |
| `UT-118-6` | inverte a ordem do legado, verificando antes e consumindo depois | `feliz` | ADR 0007 — chave consumida antes de validar |
| `UT-118-7` | autoriza a entrada na recuperação pela chave, sem consultar o modelo de capacidades | `feliz` | Cinco casos de uso não são autorizados por capacidade alguma, e a chave de recuperação é um deles |

### REQ-119 — Diagnosticar a saúde do ambiente, com o teste de requisição de volta em destaque

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-119-1` | recusa abrir o diagnóstico a quem não tem a capacidade declarada | `erro` | A tela exige a capacidade declarada de ver diagnósticos, e essa capacidade consta da matriz |
| `UT-119-2` | executa a bateria dando severidade a cada resultado | `feliz` | A bateria de testes é executada e cada resultado tem severidade |
| `UT-119-3` | apresenta o resultado do teste de requisição de volta em primeiro lugar | `feliz` | O teste de requisição do site para si mesmo é executado e o seu resultado é apresentado em primeiro lugar, porque sem ele nenhum trabalho agendado roda |
| `UT-119-4` | guarda com instante o resultado de cada execução, de modo que a evolução seja comparável | `feliz` | O resultado de cada execução é guardado com instante, de modo que a evolução seja comparável entre visitas |
| `UT-119-5` | apresenta o inventário do ambiente sem veredito | `feliz` | A aba de informações do ambiente apresenta o inventário sem veredito |
| `UT-119-6` | declara a capacidade de ver diagnósticos na matriz e a restringe à rede quando há rede | `feliz` | A capacidade de ver diagnósticos é concedida por filtro a quem pode instalar plugin, e em rede só a quem administra a rede |
| `UT-119-7` | devolve o resultado guardado quando a bateria não pode rodar | `erro` | A tela de saúde do site calcula na hora e não armazena |
| `UT-119-8` | reporta a falha quando o site não consegue pedir a própria página de volta | `erro` | Loopback é o site pedindo a própria página de volta |

### REQ-120 — Exportar e importar o conteúdo do site num formato declarado

`should` · `bloqueado` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-120-1` | recusa a exportação sem a capacidade declarada e aceita os quatro filtros | `erro` | A exportação exige a capacidade declarada e permite filtrar por tipo de conteúdo, autor, data e estado |
| `UT-120-2` | declara no arquivo exportado a sua versão de formato | `feliz` | O arquivo exportado declara a sua versão de formato |
| `UT-120-3` | referencia a mídia por endereço declarando que a origem precisa continuar acessível | `feliz` | O arquivo exportado referencia os arquivos de mídia por endereço e diz, no próprio arquivo, que a origem precisa continuar acessível para a importação os trazer |
| `UT-120-4` | mapeia os autores do arquivo para contas existentes ou cria as que faltam | `feliz` | A importação mapeia autores do arquivo para contas existentes, ou cria as que faltam |
| `UT-120-5` | deixa de oferecer o formato cujo leitor não está presente | `erro` | Um formato cujo leitor não está presente não é oferecido |
| `UT-120-6` | retoma a importação interrompida sem duplicar conteúdo | `borda` | Uma importação interrompida pode ser retomada sem duplicar conteúdo |
| `UT-120-7` | restringe importar e exportar ao papel de administração | `feliz` | As capacidades de importar e exportar são exclusivas do papel de administração |
| `UT-120-8` | interpreta como JSON a resposta do serviço de leitores de formato | `feliz` | A resposta do serviço de leitores de formato é JSON, corrigindo o que artefatos anteriores descreviam como serializado |

**Achados do QA**

- Card bloqueado por duas lacunas de `_reversa_sdd/importacao-e-exportacao/questions.md`. Q-01: a função de registro de leitor de formato não é chamada em lugar algum do núcleo, logo não se sabe quais leitores estão em uso — UT-120-5 prova o mecanismo, não o escopo real da importação. Q-02: falta decidir se o formato do arquivo continua sendo contrato externo ou passa a ser despejo interno, e a resposta muda o que UT-120-2 precisa garantir sobre estabilidade entre versões.

### REQ-121 — Descartar o editor de arquivos de extensão dentro do painel

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC3 (a alteração de arquivo de extensão passa a ter caminho declarado fora do painel) é obrigação de documentação operacional, não comportamento do sistema novo, e não se prova por teste de unidade.
- AC2 (a capacidade não existe na matriz, em lugar de existir e ser negada por configuração) é verificável pela mesma conferência de REQ-016 (UT-016-3 e UT-016-4): basta que o nome não apareça nem entre as exigidas nem entre as declaradas.

---

## EP-11 — Trabalho agendado

O que o sistema faz sozinho, sem ninguém pedir

7 cards · 35 testes de unidade

### REQ-122 — Executar trabalho agendado por gatilho independente de visita ao site

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-122-1` | executa o evento no instante marcado num site sem visita alguma | `feliz` | Um evento marcado para um instante é executado naquele instante, num site sem visita alguma |
| `UT-122-2` | recusa ter a visita de terceiro como gatilho da fila | `erro` | O gatilho não é uma requisição do próprio site para si mesmo disparada por visita de terceiro |
| `UT-122-3` | lista os eventos pendentes com horários e recorrências | `feliz` | A fila é consultável: é possível listar os eventos pendentes, os seus horários e as suas recorrências |
| `UT-122-4` | reporta no diagnóstico que nada agendado roda quando o gatilho é desligado | `borda` | Desligar o gatilho é uma decisão declarada, e desligado o diagnóstico do site reporta que nada agendado roda |
| `UT-122-5` | interrompe e registra o evento que excede o tempo declarado | `erro` | Um evento cuja execução excede o tempo declarado é interrompido e o fato fica registrado |
| `UT-122-6` | avança a fila sem depender de chegar requisição ao site | `erro` | A9 — cron não é cron: a fila só avança quando chega requisição HTTP |
| `UT-122-7` | roda o agendador fora do ciclo de requisição HTTP | `feliz` | Cron é agendador disparado por requisição HTTP, não pelo sistema operacional |
| `UT-122-8` | mantém a fila como componente próprio, e não como lista na configuração do site | `feliz` | Nenhum broker de mensagem existe nesta árvore: num porte não há mensageria a migrar, há uma a construir |

### REQ-123 — Garantir que um evento agendado não seja executado por dois processos ao mesmo tempo

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-123-1` | executa exatamente uma vez quando dois processos tentam o mesmo evento | `borda` | Dois processos que tentam executar o mesmo evento resultam em exatamente uma execução |
| `UT-123-2` | libera a exclusividade ao fim da execução, inclusive no caminho de erro | `erro` | A exclusividade tem prazo declarado e é liberada ao fim da execução, inclusive no caminho de erro |
| `UT-123-3` | descarta e registra a exclusividade presa além do prazo máximo | `borda` | Exclusividade presa além do prazo máximo declarado é descartada, e o fato fica registrado |
| `UT-123-4` | interrompe o processamento sem deixar evento consumido pela metade ao perder a exclusividade | `erro` | Perder a exclusividade no meio da execução interrompe o processamento sem deixar evento consumido pela metade |
| `UT-123-5` | identifica o evento retirado da fila cuja execução foi interrompida | `feliz` | Um evento que já foi retirado da fila e cuja execução foi interrompida é identificável como tal |
| `UT-123-6` | usa 60 segundos de prazo e descarta a exclusividade presa além de dez minutos | `borda` | A9 — a trava é um transiente de 60 segundos, descartado se passar de 10 minutos |
| `UT-123-7` | devolve à fila o evento retirado cuja execução foi abandonada | `feliz` | No legado, a execução é abandonada onde está e os eventos já removidos da fila não voltam |

### REQ-124 — Registrar o que a fila executou, quando e com que resultado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-124-1` | registra identificador, início, duração, resultado e erro de cada execução | `feliz` | Cada execução de evento registra identificador, instante de início, duração, resultado e erro, quando houver |
| `UT-124-2` | responde o histórico por evento e por período | `feliz` | O registro é consultável por evento e por período |
| `UT-124-3` | descarta o registro que passou do prazo de retenção declarado | `borda` | O registro tem prazo de retenção declarado |
| `UT-124-4` | responde quando um evento recorrente rodou pela última vez | `feliz` | É possível responder, pelo registro, quando um evento recorrente rodou pela última vez |
| `UT-124-5` | identifica o erro que se repete entre execuções pelo histórico | `erro` | No legado, nenhum registro do que rodou é guardado, e erros recorrentes não podem ser identificados porque não há histórico |

### REQ-125 — Tornar visível a falha do gatilho do trabalho agendado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-125-1` | registra com instante e motivo a falha do gatilho ao disparar | `erro` | Gatilho que não consegue disparar registra a falha com instante e motivo |
| `UT-125-2` | apresenta a falha do gatilho no diagnóstico com severidade alta | `erro` | A falha aparece no diagnóstico do site com severidade alta |
| `UT-125-3` | avisa quem administra depois do prazo declarado sem nenhuma execução | `borda` | Depois do prazo declarado sem nenhuma execução, quem administra o site é avisado |
| `UT-125-4` | informa no diagnóstico quantos eventos estão vencidos e desde quando | `feliz` | O diagnóstico diz quantos eventos estão vencidos e desde quando |
| `UT-125-5` | produz sinal quando a requisição de volta não acontece | `erro` | A integração mais crítica é com o próprio site: sem a requisição de volta nada agendado roda, e a falha é silenciosa por projeto porque a requisição é não bloqueante |
| `UT-125-6` | resolve a requisição ao próprio site por uma implementação única | `feliz` | O protocolo de requisição ao próprio site está implementado quatro vezes, com a duplicação admitida em comentário no código |

### REQ-126 — Reagendar o evento recorrente retirando-o da fila antes de o executar

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-126-1` | retira o evento da fila antes de executar e reagenda o recorrente no mesmo passo | `feliz` | O evento é retirado da fila antes de ser executado, e o recorrente é reagendado no mesmo passo |
| `UT-126-2` | mantém a ocorrência seguinte quando a execução falha | `erro` | Execução que falha não impede a ocorrência seguinte |
| `UT-126-3` | percorre os eventos vencidos em ordem de horário | `feliz` | Os eventos vencidos são percorridos em ordem de horário |
| `UT-126-4` | deixa fora da fila o evento único já executado | `borda` | Um evento único executado não volta à fila |

### REQ-127 — Declarar que desligar o gatilho não desliga a fila

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-127-1` | continua recebendo eventos e informa o acúmulo com o gatilho desligado | `feliz` | Com o gatilho desligado, a fila continua recebendo eventos e o diagnóstico do site diz quantos estão acumulados |
| `UT-127-2` | avisa no momento de desligar que a fila continua crescendo | `feliz` | A tela de configuração avisa, no momento de desligar, que a fila continua crescendo |
| `UT-127-3` | processa os vencidos em ordem de horário ao religar o gatilho, sem perder nenhum | `borda` | Ligar o gatilho de novo processa os eventos vencidos em ordem de horário, sem perder nenhum |
| `UT-127-4` | oferece caminho declarado para disparar a fila de fora | `feliz` | Há um caminho declarado para disparar a fila de fora, e ele é o recomendado quando o gatilho interno é desligado |
| `UT-127-5` | mantém a fila existindo e acumulando quando o disparo é desligado | `borda` | A9 — desligar o disparo não desliga a fila: a fila continua existindo e acumulando |

### REQ-128 — Descartar o disparo da fila por redirecionamento do navegador do visitante

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- Os três critérios são a negação de um modo alternativo de disparo, e a prova positiva correspondente está em REQ-122 (UT-122-1, UT-122-2 e UT-122-7): o gatilho do sistema novo roda fora do ciclo de requisição, logo nenhum salto no navegador do visitante é possível.

---

## EP-12 — Rede multisite

Muitos sites, uma identidade, um ciclo de vida supervisionado

8 cards · 47 testes de unidade

### REQ-129 — Pedir conta ou site numa instalação em rede, com cadastro pendente que reserva o nome

`should` · `bloqueado` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-129-1` | grava o cadastro pendente com chave de ativação sem criar conta | `feliz` | O pedido grava um cadastro pendente numa estrutura própria, com chave de ativação, e nenhuma conta é criada ainda |
| `UT-129-2` | aceita nome de 4 e de 60 caracteres e recusa fora dessa faixa ou na lista de proibidos | `borda` | Nome de usuário entre 4 e 60 caracteres e fora da lista de nomes proibidos |
| `UT-129-3` | libera o nome reservado depois do prazo e deixa o cadastro novo prosseguir | `borda` | O cadastro pendente reserva o nome e o e-mail pelo prazo declarado; depois do prazo, o cadastro anterior é removido e o novo prossegue |
| `UT-129-4` | recusa nome ou e-mail em uso por cadastro pendente dentro do prazo | `erro` | Nome ou e-mail em uso por cadastro pendente dentro do prazo é recusado |
| `UT-129-5` | valida o nome do site com mínimo declarado e as duas listas de recusa | `borda` | Pedido de site valida também o nome do site, com mínimo declarado e a lista de proibidos somada aos nomes reservados |
| `UT-129-6` | leva direto à parte de site quem já tem conta na rede | `feliz` | Quem já tem conta na rede passa direto para a parte de site: a identidade é global à rede |
| `UT-129-7` | informa que o registro está fechado quando a opção da rede o fecha | `erro` | Com a opção da rede fechada, o formulário informa que o registro está fechado |
| `UT-129-8` | reserva o nome por dois dias no cadastro pendente | `borda` | U7 — em multisite, cadastro pendente reserva o nome por 2 dias; passado o prazo, o anterior é apagado e o novo prossegue |

**Achados do QA**

- O card tem 7 critérios e 4 regras, isto é, onze unidades de prova contra um teto de oito. BR2 (N5 — nome de site com mínimo de 4 e lista de proibidos herdada), BR3 (cadastro pendente numa estrutura própria que só vira usuário ao ser ativado) e BR4 (identidade global à rede) ficaram sem teste próprio; os três são provados por UT-129-5, UT-129-1 e UT-129-6.
- Card bloqueado pela lacuna que vale para o épico inteiro: `use-cases.json` G4 e `domain.md` L5 registram que falta o valor que diz se a instalação é em rede. Se não for, estes oito testes não são escritos.

### REQ-130 — Validar o domínio do e-mail contra as listas de permitidos e banidos da rede

`should` · `backlog` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-130-1` | aceita apenas os domínios da lista de permitidos quando ela está preenchida | `feliz` | Com a lista de permitidos preenchida, apenas e-mails desses domínios são aceitos |
| `UT-130-2` | recusa antes de qualquer gravação o e-mail de domínio banido | `erro` | Com a lista de banidos preenchida, e-mails desses domínios são recusados antes de qualquer gravação |
| `UT-130-3` | recusa sem revelar o conteúdo das listas | `erro` | A recusa diz que o domínio não é aceito, sem revelar o conteúdo das listas |
| `UT-130-4` | trata as duas listas vazias como domínio livre | `borda` | As duas listas vazias significam domínio livre |
| `UT-130-5` | aplica restrição e banimento de domínio na mesma verificação de cadastro | `borda` | U8 — o domínio do e-mail pode ser restringido ou banido na rede |

### REQ-131 — Ativar o cadastro pendente criando a conta e, se pedido, o site

`should` · `backlog` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-131-1` | localiza o cadastro pendente pela chave e cria a conta | `feliz` | A chave de ativação localiza o cadastro pendente e cria a conta |
| `UT-131-2` | cria também o site e o seu conjunto de estruturas no cadastro de site | `feliz` | Cadastro de site cria também o site, com o seu conjunto de estruturas de dados |
| `UT-131-3` | marca o cadastro como ativo com o instante registrado | `feliz` | O cadastro é marcado como ativo, com o instante registrado |
| `UT-131-4` | envia ao e-mail do cadastro a senha gerada | `feliz` | A senha gerada é enviada ao e-mail do cadastro |
| `UT-131-5` | recusa com motivo próprio a chave ausente, divergente ou inexistente | `erro` | Chave ausente, divergente ou inexistente é recusada com motivo próprio |
| `UT-131-6` | responde que o cadastro já está ativo ao reabrir o caminho usado | `borda` | Reabrir o caminho já usado responde que o cadastro já está ativo, sem efeito |
| `UT-131-7` | semeia os papéis do site novo a partir da definição declarada | `feliz` | Criar o conjunto de estruturas de um site novo semeia os papéis a partir da definição declarada |
| `UT-131-8` | gera senha de 12 caracteres na ativação | `borda` | U9 — ativar cadastro gera senha de 12 caracteres |

**Achados do QA**

- BR2 (N7 — criar o conjunto de tabelas de um site novo repovoa os papéis a partir do código) ficou sem teste próprio: o teto de oito foi atingido e o comportamento é provado por UT-131-7. Vale registrar que essa regra colide com o ADR 0001 e com REQ-014 (papel como dado mutável): repovoar a partir do código num site novo é aceitável, repovoar num site existente não — e o card não distingue os dois casos.

### REQ-132 — Não avançar o estado do cadastro num caminho de erro

`must` · `backlog` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-132-1` | mantém o cadastro no estado anterior quando a ativação falha por login já existente | `erro` | Ativação que falha porque o login já existe deixa o cadastro no estado anterior, não marcado como ativo |
| `UT-132-2` | preserva o estado do cadastro em todo caminho de erro da ativação | `erro` | Nenhum caminho de erro da ativação altera o estado do cadastro |
| `UT-132-3` | informa ao visitante o que aconteceu e o que fazer | `feliz` | O erro informa ao visitante o que aconteceu e o que fazer |
| `UT-132-4` | continua ativando com a mesma chave depois de o conflito ser resolvido | `feliz` | Resolvido o conflito, a mesma chave continua ativando o cadastro |
| `UT-132-5` | recusa avançar o estado junto com o erro, ao contrário do legado | `erro` | U9 — se o login já existir como usuário, a ativação devolve erro específico mas marca o cadastro como ativo de todo jeito: o estado avança mesmo no caminho de erro |

### REQ-133 — Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída

`should` · `backlog` · veredito `parcial` · 7 de 7 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-133-1` | mantém cada eixo de supervisão como campo próprio e independente | `feliz` | Cada eixo de supervisão é campo próprio e independente dos outros |
| `UT-133-2` | compara campo a campo e dispara o gancho de entrada ou de saída daquele estado | `feliz` | A gravação compara o valor pedido com o atual, campo a campo, e dispara o gancho de entrada ou de saída daquele estado |
| `UT-133-3` | responde ao visitante conforme o estado do site, com o código declarado para cada caso | `feliz` | A resposta ao visitante corresponde ao estado do site, com o código HTTP declarado para cada caso |
| `UT-133-4` | mantém distinguíveis no registro dois eixos que produzem a mesma resposta | `borda` | Dois eixos distintos que hoje produzem a mesma resposta continuam distinguíveis no registro, mesmo quando a resposta coincide |
| `UT-133-5` | libera quem administra a rede antes de qualquer teste de estado do site | `feliz` | Quem administra a rede continua enxergando o site em qualquer estado, e essa liberação acontece antes de qualquer teste |
| `UT-133-6` | recusa apagar o site principal da rede | `erro` | O site principal da rede não é apagável |
| `UT-133-7` | remove o conjunto de estruturas daquele site ao apagá-lo de fato | `feliz` | Apagar o site de fato remove o conjunto de estruturas daquele site |
| `UT-133-8` | produz a mesma resposta para arquivado e suspenso mantendo os campos separados | `borda` | N3 — arquivado e suspenso produzem a mesma resposta, e são campos distintos |

**Achados do QA**

- O card tem 7 critérios e 5 regras, isto é, doze unidades de prova contra um teto de oito. BR1 (N1 — quatro estados governam o acesso e quem administra a rede os ignora), BR3 (N4 — cada estado tem gancho de entrada e de saída, com comparação campo a campo), BR4 (ADR 0009) e BR5 (nove capacidades são só de rede e não estão em papel algum) ficaram sem teste próprio. As três primeiras são provadas por UT-133-5, UT-133-2 e, para a negação absoluta, por REQ-014 (UT-014-3).
- BR5 fica sem prova: nenhum critério de aceite deste card declara onde as nove capacidades de rede passam a morar no sistema novo. É a mesma pendência de REQ-016 para as capacidades concedidas por filtro, e precisa de um critério próprio.

### REQ-134 — Preservar o estado "criado e ainda não ativado" do site da rede

`must` · `backlog` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-134-1` | declara três estados no campo que hoje é tratado como booleano | `feliz` | O campo que hoje é tratado como booleano tem três estados declarados: normal, encerrado e criado-e-não-ativado |
| `UT-134-2` | responde com código e mensagem próprios ao site criado e não ativado | `feliz` | O site criado e não ativado responde ao visitante com o código e a mensagem declarados para esse estado, distintos dos do site encerrado |
| `UT-134-3` | leva ao estado normal o site criado e não ativado que é reativado | `feliz` | Reativar um site criado e não ativado o leva ao estado normal |
| `UT-134-4` | preserva o terceiro valor na migração de dados | `borda` | A migração de dados preserva o terceiro valor, em lugar de o reduzir a verdadeiro ou falso |
| `UT-134-5` | apresenta os três estados com nomes distintos na tela de supervisão | `feliz` | A tela de supervisão mostra os três estados com nomes distintos |
| `UT-134-6` | trata o campo como tendo três valores, e não dois | `borda` | N2 — o campo de exclusão tem três valores, não dois: encerrado, ainda não ativado e normal. O dicionário de dados descreve a coluna como 0/1 — o terceiro valor só aparece na leitura do código |
| `UT-134-7` | recusa converter o campo para booleano | `erro` | Quem migrar a coluna para booleano perde um estado do produto |

### REQ-135 — Declarar a retenção do cadastro já ativado e do registro de cadastro

`should` · `bloqueado` · veredito `parcial` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-135-1` | remove ou reduz o cadastro já ativado que passou do prazo declarado | `borda` | O cadastro já ativado tem prazo de retenção declarado e é removido, ou reduzido aos campos declarados, depois dele |
| `UT-135-2` | aplica o mesmo tratamento de retenção ao registro de cadastro | `feliz` | O registro de cadastro tem o mesmo tratamento |
| `UT-135-3` | remove ou anonimiza os registros de cadastro ligados ao site apagado | `feliz` | Apagar um site da rede remove ou anonimiza os registros de cadastro ligados a ele |
| `UT-135-4` | declara os prazos no aviso de privacidade do site | `feliz` | O aviso de privacidade do site declara esses prazos |
| `UT-135-5` | deixa de acumular origem e e-mail no registro de cadastro sem prazo | `borda` | R8 — o registro de cadastro não tem política de retenção: acumula origem e e-mail indefinidamente, e apagar o site não o toca |
| `UT-135-6` | retira da tabela a linha de cadastro depois do prazo que segue a ativação | `borda` | A linha de cadastro permanece na tabela indefinidamente depois da ativação |

**Achados do QA**

- BR3 (L7 — não há política de retenção declarada; a ausência é certa e a decisão é de produto, não investigação) não tem comportamento a provar: é a constatação de uma ausência no legado somada a uma decisão pendente.
- Card bloqueado por decisão humana, como REQ-094: o prazo depende de obrigação legal da jurisdição. A diferença é que aqui o dado é de quem nunca se tornou usuário do site.

### REQ-136 — Descartar o sinalizador de conteúdo adulto do site da rede

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC3 (declarar o que fazer com os valores existentes do sinalizador) é obrigação de migração sobre dado real: uma rede em produção pode ter valores gravados ali por extensão, e isso se prova contra a base, não por teste de unidade.

---

## EP-13 — Superfícies programáticas

O que o sistema expõe a programas: api, abilities, feeds, sitemaps

13 cards · 68 testes de unidade

### REQ-137 — Despachar requisição de programa por rota registrada com esquema declarado

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-137-1` | casa caminho e método com uma rota registrada antes de qualquer execução | `erro` | Caminho e método são casados com uma rota registrada antes de qualquer execução |
| `UT-137-2` | resolve a identidade num ponto único, antes do despacho | `feliz` | A resolução de identidade acontece antes do despacho, num ponto único |
| `UT-137-3` | devolve 404 em formato de dados com indicação das rotas próximas | `erro` | Rota inexistente devolve 404 em formato de dados, com indicação das rotas próximas |
| `UT-137-4` | devolve os campos do esquema e aceita o recorte pedido pelo cliente | `feliz` | A resposta devolve os campos declarados pelo esquema da rota, e o cliente pode pedir um recorte deles |
| `UT-137-5` | mantém o contrato de uma versão publicada e exige versão no caminho de toda rota | `borda` | Toda rota tem versão no caminho, e uma versão publicada não muda de contrato |
| `UT-137-6` | aplica o filtro de autenticação antes de todo o despacho | `feliz` | O filtro de autenticação da API antecede todo o despacho |

### REQ-138 — Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela

`must` · `bloqueado` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-138-1` | recusa registrar rota sem declaração de permissão | `erro` | Registrar rota sem declaração de permissão é recusado, e a rota não passa a existir |
| `UT-138-2` | declara a rota pública de forma explícita e a mostra assim no mapa | `feliz` | Rota pública é declarada como pública de forma explícita, e essa declaração aparece no mapa da superfície |
| `UT-138-3` | falha a verificação automatizada quando alguma rota registrada não tem declaração | `borda` | Uma verificação automatizada lista as rotas registradas e falha se alguma não tiver declaração |
| `UT-138-4` | devolve 401 sem identidade e 403 com identidade ao recusar a permissão | `erro` | A recusa de permissão devolve 401 quando não há identidade e 403 quando há |
| `UT-138-5` | impede a rota sem declaração de funcionar | `erro` | I7 — toda rota deve declarar permissão explícita; no legado a ausência emite aviso e a rota funciona |
| `UT-138-6` | faz a camada falhar fechada quando a permissão não é declarada | `erro` | A camada de API falha aberta: rota sem declaração funciona |
| `UT-138-7` | alinha a camada de rotas às demais, recusando por omissão | `erro` | Das três camadas paralelas de autorização, esta é a que falha aberta |

**Achados do QA**

- Card bloqueado por lacuna aberta: `_reversa_sdd/rest-api/questions.md` Q-01 e Q-02 registram que não há lista de extensões ativas nem acesso à instalação real, logo não se sabe quantas rotas existem hoje sem portão. Estes testes provam o mecanismo do sistema novo; o tamanho da quebra na migração continua indeterminado.

### REQ-139 — Validar e sanitizar cada parâmetro contra o esquema declarado da rota

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-139-1` | valida tipo, formato e limites de cada parâmetro antes de a rota executar | `feliz` | Cada parâmetro é validado contra o tipo, o formato e os limites declarados antes de a rota executar |
| `UT-139-2` | devolve 400 nomeando o campo e o motivo para parâmetro fora do esquema | `erro` | Parâmetro fora do esquema devolve 400 nomeando o campo e o motivo |
| `UT-139-3` | sanitiza depois de validar e antes de executar | `feliz` | A sanitização acontece depois da validação e antes da execução |
| `UT-139-4` | impede o parâmetro não declarado de chegar à execução | `erro` | Parâmetro não declarado no esquema não chega à execução |
| `UT-139-5` | usa o mesmo documento de esquema para validar e para publicar o contrato | `feliz` | O esquema de cada rota é o mesmo documento usado para validar e para publicar o contrato |

### REQ-140 — Publicar o mapa da superfície programática

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-140-1` | lista num endereço as rotas registradas e os seus esquemas | `feliz` | Há um endereço que lista as rotas registradas e os seus esquemas |
| `UT-140-2` | declara para cada rota se ela é pública ou qual permissão exige | `feliz` | O mapa declara, para cada rota, se ela é pública ou qual permissão exige |
| `UT-140-3` | gera o mapa do mesmo esquema que valida os parâmetros | `feliz` | O mapa é gerado do mesmo esquema que valida os parâmetros, e não de documentação paralela |
| `UT-140-4` | omite do mapa a rota que o requisitante não poderia descobrir de outra forma | `borda` | O mapa não expõe rota que o requisitante não poderia descobrir de outra forma |
| `UT-140-5` | deixa de expor a superfície inteira a quem não tem credencial | `borda` | No legado, a raiz da API lista as rotas e os esquemas sem exigir credencial: o mapa da superfície é público |

### REQ-141 — Registrar o acesso à superfície programática

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-141-1` | registra rota, método, identidade, resultado, duração e instante de cada chamada | `feliz` | Cada chamada registra rota, método, identidade resolvida, resultado, duração e instante |
| `UT-141-2` | deixa de fora do registro credencial, corpo com dado pessoal e cabeçalho de sessão | `erro` | O registro não guarda credencial, corpo de requisição com dado pessoal nem cabeçalho de sessão |
| `UT-141-3` | responde o registro por rota, por identidade e por período | `feliz` | O registro é consultável por rota, por identidade e por período |
| `UT-141-4` | descarta o registro que passou do prazo de retenção declarado | `borda` | O registro tem prazo de retenção declarado |
| `UT-141-5` | responde o volume de chamadas por rota num período | `feliz` | É possível responder, pelo registro, qual o volume de chamadas por rota num período |
| `UT-141-6` | recusa deixar passar chamada sem registro | `erro` | No legado, nenhum registro da chamada é guardado: não há log de acesso à API |
| `UT-141-7` | entrega o volume por rota que o dimensionamento do limite de taxa consome | `feliz` | A ausência de volume por rota é o que impede dimensionar o limite de taxa |

### REQ-142 — Exigir token adicional quando a identidade da chamada vem de sessão de navegador

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-142-1` | exige o token próprio da superfície quando a identidade vem de sessão de navegador | `erro` | Chamada autenticada por sessão de navegador exige token próprio da superfície programática |
| `UT-142-2` | dispensa o token na chamada autenticada por credencial de aplicação | `feliz` | Chamada autenticada por credencial de aplicação não exige esse token |
| `UT-142-3` | recusa antes de a rota executar quando o token está ausente ou inválido | `erro` | Token ausente ou inválido recusa a chamada antes de a rota executar |
| `UT-142-4` | vence o token no prazo declarado e aceita o renovado pela tela | `borda` | O token tem prazo declarado e a tela que o usa sabe renová-lo |
| `UT-142-5` | trata a chamada por sessão como falsificável e por isso exige prova de origem | `erro` | Pelo caminho de sessão de navegador o token da API passa a ser exigido, porque a requisição é falsificável |

### REQ-143 — Executar operação nomeada e descrita por esquema, pedida por agente

`should` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-143-1` | localiza a operação pelo nome num registro consultável | `feliz` | A operação é localizada pelo nome num registro consultável |
| `UT-143-2` | ajusta a entrada ao esquema declarado e a valida antes de executar | `feliz` | A entrada é ajustada ao esquema declarado e validada antes da execução |
| `UT-143-3` | valida a saída contra o esquema antes de devolvê-la | `feliz` | A saída é validada contra o esquema de saída antes de ser devolvida |
| `UT-143-4` | devolve erro nomeando campo e motivo antes de executar quando a entrada sai do esquema | `erro` | Entrada fora do esquema devolve erro nomeando o campo e o motivo, antes de executar |
| `UT-143-5` | distingue operação inexistente de operação sem permissão | `erro` | Operação inexistente devolve erro que a distingue de operação sem permissão |
| `UT-143-6` | lista as operações e as suas categorias por rotas próprias | `feliz` | Há rotas próprias para listar as operações e as suas categorias |
| `UT-143-7` | descreve a operação por esquema de entrada e de saída, com autorização própria | `feliz` | Ability é operação nomeada e descrita por esquema, feita para ser invocada por agente de IA, com autorização própria |
| `UT-143-8` | autoriza a operação por portão próprio, independente do portão da rota que a expõe | `feliz` | ADR 0011 — autorização própria para agente de IA |

### REQ-144 — Fechar a autorização da operação nomeada, e registrar quando ela é elevada

`must` · `bloqueado` · veredito `parcial` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-144-1` | trata como erro a operação registrada sem declaração de permissão | `erro` | Operação sem declaração de permissão é erro, nunca liberação |
| `UT-144-2` | coage a negação o retorno de permissão que não é verdadeiro, falso nem erro | `erro` | Retorno de permissão que não é verdadeiro nem falso nem erro é tratado como negação |
| `UT-144-3` | registra instante, operação, identidade e quem elevou quando uma extensão troca negação por permissão | `feliz` | Uma extensão que troque negação por permissão deixa registro com instante, operação, identidade e quem elevou |
| `UT-144-4` | recusa o caminho que contornaria normalização, validação, permissão e saída de uma vez | `erro` | Não existe caminho que contorne, de uma vez, normalização de entrada, validação, verificação de permissão e validação de saída |
| `UT-144-5` | expõe a quem administra a lista de operações registradas e as suas permissões | `feliz` | A lista de operações registradas e as suas permissões é inspecionável por quem administra o site |
| `UT-144-6` | exige retorno de permissão em toda operação, tratando a ausência como erro | `erro` | I4 — toda ability exige retorno de permissão, e a falta de callback é erro, não liberação |
| `UT-144-7` | deixa rastro de toda elevação temporária de permissão por ponto de extensão | `feliz` | I5 — a autorização de ability é filtrável, inclusive para conceder: o docblock cita elevação temporária de permissão para contextos confiáveis |
| `UT-144-8` | deixa de aceitar interceptação antes de qualquer validação da execução | `erro` | I6 — a execução de ability pode ser curto-circuitada antes de qualquer validação |

**Achados do QA**

- BR4 (das três camadas paralelas de autorização, esta é a única que falha fechada — mas é filtrável para conceder) ficou sem teste próprio: o teto de oito foi atingido. As duas metades são provadas por UT-144-1 e UT-144-3, e a comparação entre as camadas é provada em REQ-138 (UT-138-7).
- Card bloqueado por lacuna aberta: `_reversa_sdd/abilities-api/questions.md` Q-01 e Q-02 registram que, sem a lista de extensões ativas, o portão real é indeterminado, e que não se sabe se os nomes e esquemas das operações são contrato publicado ou infraestrutura preparatória — o que muda o que AC5 precisa expor.

### REQ-145 — Servir o índice de sitemap conforme a opção de indexação

`should` · `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-145-1` | publica um índice que lista as páginas de sitemap por provedor | `feliz` | Com a indexação ligada, há um índice que lista as páginas de sitemap por provedor |
| `UT-145-2` | lista em cada página apenas conteúdo público | `feliz` | Cada página lista apenas conteúdo público, respeitando a restrição de leitura |
| `UT-145-3` | deixa de registrar as rotas quando a indexação está desligada | `borda` | Com a indexação desligada, as rotas não são registradas e o pedido cai na resposta de endereço inexistente |
| `UT-145-4` | pede que ninguém indexe nas instruções para rastreadores com a indexação desligada | `feliz` | Com a indexação desligada, as instruções para rastreadores pedem que ninguém indexe |
| `UT-145-5` | pagina os provedores no tamanho de página declarado | `borda` | O índice pagina os provedores, e o tamanho de página é declarado |
| `UT-145-6` | inclui no índice o conteúdo protegido por senha | `feliz` | Conteúdo protegido por senha entra no índice, porque está publicado: a proteção é do corpo |
| `UT-145-7` | nasce com a indexação ligada numa instalação sem configuração | `borda` | `blog_public` nasce ligado: o site pede para ser indexado |
| `UT-145-8` | trata a indexação desligada como ausência da superfície, e não como recusa | `borda` | Com a indexação desligada, não é uma recusa: é uma ausência |

### REQ-146 — Servir feeds de conteúdo e de comentários a partir da mesma consulta pública

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-146-1` | serve a versão em feed no mesmo endereço de listagem quando o formato é pedido | `feliz` | O mesmo endereço de listagem serve a versão em formato de feed quando o formato é pedido |
| `UT-146-2` | monta o feed da mesma consulta pública que a página | `feliz` | O feed é montado da mesma consulta pública que a página, sem regra de visibilidade própria |
| `UT-146-3` | oferece feed de conteúdo e de comentários, global e por conteúdo | `feliz` | Há feed de conteúdo e feed de comentários, global e por conteúdo |
| `UT-146-4` | usa o formato declarado como padrão quando o pedido não nomeia um | `borda` | O formato padrão é declarado e usado quando o pedido não nomeia um |

### REQ-147 — Servir a representação embutível de um endereço do site a outro site

`could` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-147-1` | devolve a representação embutível declarada para um endereço do site | `feliz` | Há rota pública que, dado um endereço deste site, devolve a representação embutível declarada |
| `UT-147-2` | devolve erro sem revelar a existência de conteúdo restrito | `erro` | Endereço que não resolve em conteúdo público devolve erro, sem revelar a existência de conteúdo restrito |
| `UT-147-3` | exclui da representação o corpo de conteúdo protegido por senha | `feliz` | A representação devolvida não inclui corpo de conteúdo protegido por senha |
| `UT-147-4` | limita o tamanho da representação pelos valores declarados | `borda` | O tamanho da representação é limitado por valores declarados |
| `UT-147-5` | atende a rota sem exigir credencial, por declaração explícita de acesso público | `feliz` | A rota de representação embutível é pública por desenho |

### REQ-148 — Descartar a superfície programática herdada com credencial no corpo da chamada

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 (toda operação da superfície herdada tem equivalente na superfície com esquema declarado) é uma obrigação de cobertura entre dois inventários, e não comportamento: prova-se comparando o mapa de REQ-140 com a lista de métodos herdados, no plano de migração.
- AC3 (o recebimento de notificação de link passa a ter endereço próprio e declarado) é o único comportamento próprio deste card e pertence a REQ-080, que já o especifica inteiro — é o pré-requisito que este `wont` cria.

### REQ-179 — Descartar o segundo canal de escrita do painel

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 (toda operação assíncrona do painel passa pela superfície com rota, esquema e permissão declarados) é obrigação de cobertura entre inventários, provada comparando o mapa de REQ-140 com as ações do painel, no plano de migração.
- AC3 (nenhuma resposta do sistema é um corpo sem contrato) é comportamento geral e já é provado por REQ-137 (UT-137-4) e REQ-143 (UT-143-3), que exigem saída conforme esquema declarado.

---

## EP-14 — Integração externa

Os serviços de fora de que o sistema depende, e o que acontece quando eles falham

11 cards · 57 testes de unidade

### REQ-149 — Falar com serviço externo sempre por canal cifrado

`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-149-1` | declara todo endereço externo do catálogo com esquema cifrado | `feliz` | Nenhum endereço de serviço externo é escrito com esquema sem cifra no código |
| `UT-149-2` | falha a verificação quando um endereço externo sem cifra aparece | `borda` | Uma verificação automatizada varre o código e falha quando encontra endereço externo sem cifra |
| `UT-149-3` | devolve erro registrado quando a negociação segura falha, sem tentar sem cifra | `erro` | Falha na negociação segura resulta em erro da chamada, registrado, nunca em tentativa sem cifra |
| `UT-149-4` | reporta no diagnóstico o ambiente que não consegue negociar canal seguro | `feliz` | O diagnóstico do site reporta quando o ambiente não consegue negociar canal seguro, antes de a falha acontecer em produção |
| `UT-149-5` | cifra também os endereços do serviço de infraestrutura | `feliz` | Treze endpoints do serviço de infraestrutura são escritos com esquema sem cifra e promovidos a cifrado apenas se o ambiente suportar |
| `UT-149-6` | cobre o catálogo inteiro na conferência, e não apenas alguns endereços | `feliz` | Os artefatos anteriores registravam 2 canais sem cifra; são 13 |

### REQ-150 — Descartar a repetição da chamada sem cifra quando a negociação segura falha

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- Os quatro critérios são a negação de um comportamento, e a prova positiva correspondente está em REQ-149 (UT-149-3: a falha de negociação segura termina em erro registrado, sem tentativa sem cifra) e em REQ-154 (UT-154-4: falha de serviço externo não deixa o site sem resposta). AC3, que singulariza a consulta de integridade dos próprios arquivos, é coberto por UT-149-5, que não abre exceção para nenhum endereço do serviço de infraestrutura.

### REQ-151 — Validar o destino de toda requisição de saída cuja URL vem de dado

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-151-1` | valida o destino por padrão e exige declaração explícita para não validar | `feliz` | A validação de destino é o comportamento padrão de toda requisição de saída: não validar exige declaração explícita no ponto de chamada |
| `UT-151-2` | recusa destino de rede interna, de loopback ou de porta fora da lista permitida | `erro` | Endereço que resolve para rede interna, para endereço de loopback ou para porta fora da lista permitida é recusado |
| `UT-151-3` | interrompe a resposta de saída que passa do limite declarado de tamanho | `borda` | Toda resposta de saída tem limite declarado de tamanho |
| `UT-151-4` | falha a verificação quando um ponto sem validação recebe endereço vindo de dado | `borda` | Uma verificação automatizada lista os pontos de chamada que optaram por não validar e falha se algum deles receber endereço vindo de dado |
| `UT-151-5` | declara a requisição ao próprio site como exceção nomeada com destino fixo | `feliz` | O caso de requisição do site para si mesmo é declarado como exceção nomeada, com destino fixo |
| `UT-151-6` | inverte o padrão do legado, validando quando nada é dito | `erro` | No legado, a diferença entre a API validada e a não validada é um argumento, e o default é não validar |
| `UT-151-7` | valida o endereço e limita a resposta ao buscar folha de estilo remota declarada pelo tema | `erro` | A busca de folha de estilo remota declarada pelo tema usa a variante não validada, sem validação de endereço e sem limite de tamanho de resposta |

### REQ-152 — Resolver a credencial de integração por precedência declarada

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-152-1` | aplica a mesma ordem de precedência a toda integração | `feliz` | A ordem de precedência é declarada e idêntica para toda integração: ambiente vence declaração da instalação, que vence valor guardado |
| `UT-152-2` | ignora o valor guardado quando a credencial está no ambiente, e mostra isso na tela | `feliz` | Com a credencial no ambiente, o valor guardado é ignorado e isso é visível na tela de integrações |
| `UT-152-3` | separa identificador e segredo no primeiro separador | `borda` | Credencial que combina identificador e segredo é separada no primeiro separador, para que o segredo possa conter o separador |
| `UT-152-4` | trata as duas metades como ausentes quando qualquer uma vem vazia | `borda` | Com qualquer das duas metades vazia, as duas são tratadas como ausentes |
| `UT-152-5` | declara na tela a origem da credencial corrente sem mostrar o valor | `feliz` | A tela de integrações diz, para cada uma, de onde a credencial corrente veio — sem mostrar o valor |
| `UT-152-6` | faz o ambiente vencer a declaração da instalação, que vence o valor guardado | `feliz` | I1 — credencial de conector tem precedência: variável de ambiente, constante, banco. É uma inversão do hábito do produto, que sempre guardou configuração em opções |
| `UT-152-7` | aceita credencial que combina usuário e senha dividida no primeiro dois-pontos | `borda` | I2 — credencial de conector pode combinar usuário e senha, dividida no primeiro dois-pontos; com qualquer das metades vazia, as duas voltam vazias |
| `UT-152-8` | resolve a credencial do serviço de filtragem pelo mesmo mecanismo das demais | `feliz` | I3 — o serviço de filtragem de spam é registrado como conector, com credencial por opção e por constante |

### REQ-153 — Nunca guardar credencial de integração em texto recuperável

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-153-1` | recusa gravar credencial de integração em texto legível | `erro` | Nenhuma credencial de integração é gravada em texto legível no armazenamento de configuração |
| `UT-153-2` | cifra com chave fora do mesmo armazenamento, ou mantém a credencial apenas no ambiente | `feliz` | A credencial é cifrada com chave que não vive no mesmo armazenamento, ou fica apenas no ambiente |
| `UT-153-3` | recusa devolver o valor de uma credencial guardada em tela ou em resposta | `erro` | Nenhuma tela e nenhuma resposta de API devolve o valor de uma credencial guardada |
| `UT-153-4` | falha a verificação ao encontrar credencial legível no armazenamento de configuração | `borda` | Uma verificação automatizada varre o armazenamento de configuração de uma instalação de teste e falha ao encontrar credencial legível |
| `UT-153-5` | rotaciona a credencial sem perder a configuração da integração | `feliz` | Toda credencial de integração é rotacionável sem perder a configuração da integração |
| `UT-153-6` | recusa guardar e transmitir a senha da caixa postal em texto puro | `erro` | A senha da caixa postal é guardada em texto puro na configuração do site e enviada em texto puro no comando de autenticação, sobre conexão sem cifra |
| `UT-153-7` | registra os segredos por nome, sem valor, no inventário de integrações | `feliz` | Nenhuma credencial real foi encontrada comitada nesta árvore: sete segredos foram registrados por nome apenas |

### REQ-154 — Declarar prazo de espera e tratamento de erro em toda chamada de saída

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-154-1` | exige prazo de espera declarado em cada chamada de saída | `feliz` | Toda chamada de saída declara o seu prazo de espera; nenhuma herda um valor global por omissão |
| `UT-154-2` | declara prazo compatível com a natureza da operação de longa duração | `feliz` | Operação de longa duração declara prazo compatível com a sua natureza, e isso é verificável no código |
| `UT-154-3` | falha com erro identificável e registrado ao esgotar o prazo | `erro` | Esgotado o prazo, a chamada falha com erro identificável, registrado, e a operação que a pediu decide o que fazer |
| `UT-154-4` | mantém o site respondendo quando o serviço externo falha | `erro` | Falha de serviço externo não deixa o site sem resposta: há comportamento declarado para cada integração |
| `UT-154-5` | falha a verificação quando existe chamada de saída sem prazo declarado | `borda` | Uma verificação automatizada lista as chamadas de saída sem prazo declarado e falha se houver alguma |
| `UT-154-6` | recusa o adaptador de cliente HTTP que não define prazo próprio | `erro` | O adaptador de cliente HTTP do núcleo não define prazo de espera, logo valeria o default de 5 segundos — curto demais para geração de texto |
| `UT-154-7` | torna visível a falha da requisição não bloqueante ao próprio site | `erro` | A requisição do site para si mesmo é não bloqueante por projeto, com prazo de 0,01 segundo e sem verificação de canal, logo a falha é invisível |

### REQ-155 — Enviar o e-mail do sistema por canal declarado, com falha visível

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-155-1` | resolve o canal de envio pela configuração da instalação e a credencial pela precedência declarada | `feliz` | O canal de envio é declarado na configuração da instalação, com credencial resolvida pela precedência declarada |
| `UT-155-2` | registra a falha de envio com destinatário, assunto, instante e motivo | `erro` | Falha no envio é registrada com destinatário, assunto, instante e motivo, e nunca descartada em silêncio |
| `UT-155-3` | reporta no diagnóstico o canal de envio que não está funcionando | `erro` | O diagnóstico do site reporta quando o canal de envio não está funcionando |
| `UT-155-4` | trata a falha de envio conforme o que cada operação dependente declara | `feliz` | As operações que dependem de envio — redefinição de senha, moderação, recuperação, privacidade, cadastro, aviso de atualização — tratam a falha conforme o que cada uma declara |
| `UT-155-5` | mantém fora de registro e de tela qualquer segredo do canal de envio | `erro` | Nenhum segredo do canal de envio aparece em registro ou em tela |
| `UT-155-6` | entrega pelo mesmo canal toda notificação do sistema | `feliz` | O servidor de e-mail de saída é o destino de toda notificação do sistema: moderação, redefinição de senha, chave de recuperação, confirmação de privacidade, falha de atualização |
| `UT-155-7` | trata a falha de envio como estado consultável, e não como exceção que aborta | `erro` | D3 — falha de envio de e-mail é estado, não exceção |
| `UT-155-8` | grava o marcador antes do envio, de modo que falhar em gravar significa não avisar | `borda` | A10 — o marcador do aviso de recuperação é gravado antes do envio, de modo que falhar em gravar significa não avisar |

### REQ-156 — Consultar o serviço de versões e de distribuição de pacotes

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-156-1` | informa por canal cifrado as versões disponíveis de núcleo, extensões e traduções | `feliz` | A consulta informa a versão disponível do núcleo, das extensões e das traduções, e é feita por canal cifrado |
| `UT-156-2` | guarda a resposta com prazo e não repete a consulta a cada requisição | `borda` | A resposta é guardada com prazo, para que a consulta não aconteça a cada requisição |
| `UT-156-3` | usa a última resposta guardada, com a sua idade, quando o serviço está indisponível | `erro` | Serviço indisponível não quebra nenhuma tela: a última resposta guardada é usada, com a sua idade informada |
| `UT-156-4` | consulta o endereço configurado quando a instalação usa espelho próprio | `feliz` | O endereço do serviço é configurável, para instalação que use espelho próprio |
| `UT-156-5` | envia apenas o que a lista declarada permite e a expõe a quem administra | `erro` | Nenhum dado além do declarado neste card é enviado na consulta, e a lista é inspecionável por quem administra o site |
| `UT-156-6` | consome os endereços do serviço de infraestrutura a partir de um catálogo declarado | `feliz` | Catorze endpoints do serviço de infraestrutura são consumidos pelo sistema |
| `UT-156-7` | tolera campo ausente na resposta sem quebrar a leitura | `erro` | Os payloads de resposta de dez desses endpoints estão marcados como inferidos: a estrutura foi reconstruída dos campos que o código lê, não de captura real |

**Achados do QA**

- Confiança herdada: os payloads de resposta de dez endpoints deste serviço estão marcados como inferidos em `integrations.md` — a estrutura foi reconstruída dos campos que o código lê, não de captura real. UT-156-7 existe por isso: até que haja uma captura, o contrato precisa ser tolerante a campo ausente.

### REQ-157 — Descartar a publicação de conteúdo por caixa postal

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 (nenhum campo de configuração guarda credencial de caixa postal) é provado pela conferência de REQ-153 (UT-153-4 e UT-153-6), que falha ao encontrar qualquer credencial legível no armazenamento de configuração.
- AC4 (declarar o que fazer com os valores de configuração existentes) é obrigação de migração sobre dado real, e não comportamento do sistema novo.

### REQ-158 — Descartar os conectores de modelo de linguagem declarados sem provedor

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 pede verificação automatizada que liste conectores declarados sem implementação correspondente e falhe se houver algum. É uma conferência de inventário com o mesmo formato de REQ-016 (UT-016-3 e UT-016-4) e de REQ-178; vale registrá-la como requisito próprio de plataforma, em lugar de ficar pendurada num card descartado.
- AC3 condiciona qualquer integração futura com modelo de linguagem a especificar payload, endereço base, prazo de espera e tratamento de erro — os três últimos já são obrigação geral provada por REQ-154 (UT-154-1 e UT-154-6).

### REQ-181 — Notificar serviços externos de atualização do site apenas por lista declarada

`could` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-181-1` | notifica apenas os serviços que constam da lista visível na tela | `feliz` | A lista de serviços a notificar é configuração do site, visível na tela, e a notificação só acontece para os que estiverem nela |
| `UT-181-2` | deixa a lista vazia ou visível na tela antes da primeira publicação | `borda` | A lista nasce vazia, ou nasce com o valor declarado e visível na tela de configuração antes da primeira publicação |
| `UT-181-3` | envia por canal cifrado sem bloquear a publicação | `feliz` | A notificação sai por canal cifrado e não bloqueia a publicação |
| `UT-181-4` | registra a falha da notificação sem desfazer a publicação | `erro` | Falha na notificação é registrada e não desfaz a publicação |
| `UT-181-5` | deixa de notificar quando o conteúdo não é público | `feliz` | A notificação não acontece para conteúdo que não é público |
| `UT-181-6` | deixa de avisar terceiro numa instalação de fábrica sem ninguém ter escolhido | `borda` | O endereço do serviço de notificação é valor padrão de uma opção semeada na instalação: no legado, publicar num site de fábrica avisa um terceiro sem ninguém ter escolhido isso |
| `UT-181-7` | inclui o serviço de notificação no inventário declarado de integrações de saída | `feliz` | Esta integração de saída não aparece em nenhum artefato anterior ao de integrações |

---

## EP-15 — Plataforma transversal

Extensibilidade, tradução, sanitização, observabilidade e limite de taxa — o que atravessa tudo

13 cards · 74 testes de unidade

### REQ-159 — Registrar o evento de operação em canal estruturado e consultável

`must` · `pronto` · veredito `parcial` · 6 de 6 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-159-1` | produz registro com instante, origem, severidade e contexto em todo erro tratado | `feliz` | Todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto |
| `UT-159-2` | responde o registro por período, por severidade e por origem | `feliz` | O registro é estruturado e consultável por período, por severidade e por origem |
| `UT-159-3` | descarta o registro vencido e mantém fora dele credencial e dado pessoal não declarado | `borda` | O registro tem prazo de retenção declarado e não guarda credencial nem dado pessoal além do declarado |
| `UT-159-4` | responde as três perguntas de operação a partir do registro | `feliz` | É possível responder, pelo registro: com que frequência o site falha ao se atualizar, quais extensões já o derrubaram, e qual o volume de spam |
| `UT-159-5` | registra com o modo de depuração desligado | `feliz` | O registro funciona sem depender de o site estar em modo de depuração |
| `UT-159-6` | falha a verificação ao encontrar tratamento de erro sem registro | `erro` | Nenhum caminho de erro do sistema é silencioso por omissão: uma verificação automatizada falha quando encontra tratamento de erro sem registro |
| `UT-159-7` | deixa de depender de uma única opção como histórico persistente de falha | `erro` | Zero arquivos de log nesta árvore. O único histórico persistente de falha é a opção de falha de atualização automática |
| `UT-159-8` | identifica o erro que se repete entre execuções | `erro` | Erros recorrentes não podem ser identificados: não há histórico |

**Achados do QA**

- BR3 (a tela de saúde do site calcula na hora e não armazena) ficou sem teste próprio: o teto de oito foi atingido. O comportamento do sistema novo — guardar o resultado de cada execução com o seu instante — é provado em REQ-119 (UT-119-4 e UT-119-7).

### REQ-160 — Limitar a taxa de toda superfície de entrada

`must` · `bloqueado` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-160-1` | aplica limite por identidade quando há identidade e por origem quando não há | `feliz` | Cada superfície de entrada tem limite de taxa declarado, por identidade quando há, e por origem quando não há |
| `UT-160-2` | responde 429 informando quando a próxima tentativa é aceita | `erro` | Atingido o limite, a resposta é HTTP 429 e informa quando a próxima tentativa é aceita |
| `UT-160-3` | respeita o valor configurado por superfície e o valor de fábrica quando nada é configurado | `borda` | O limite é configurável por superfície e tem valor de fábrica declarado |
| `UT-160-4` | falha a verificação quando alguma superfície de entrada está sem limite | `borda` | Uma verificação automatizada lista as superfícies de entrada e falha se alguma estiver sem limite |
| `UT-160-5` | registra o excesso com superfície, identidade ou origem, e instante | `feliz` | Exceder o limite fica registrado, com superfície, identidade ou origem, e instante |
| `UT-160-6` | recusa deixar superfície de entrada sem limite declarado | `erro` | Nenhuma superfície de entrada tem limite de taxa; os dois únicos freios do legado são travas de tempo no processamento da fila e na leitura da caixa postal |
| `UT-160-7` | mantém quem modera fora do freio de vazão de comentário | `feliz` | C2 — a única exceção é o freio de vazão de comentário, e quem modera não é limitado por ele |
| `UT-160-8` | limita também o rastreador que consome o sitemap | `erro` | Não há limite de taxa nem para o rastreador no sitemap |

**Achados do QA**

- Card bloqueado por lacuna aberta: `_reversa_sdd/rest-api/questions.md` Q-03 registra que o limite precisa de um número e que não há log algum nesta árvore para dimensioná-lo. Os testes acima são escritos contra o limite declarado na configuração e provam o mecanismo; os valores dependem de REQ-141 e REQ-159, que produzem exatamente o dado que falta.

### REQ-161 — Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio

`must` · `bloqueado` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-161-1` | recusa a chamada de tradução dentro de módulo de domínio | `erro` | Nenhum módulo de domínio chama função de tradução: o texto para o usuário é montado na camada de apresentação, a partir de um identificador de erro ou de estado |
| `UT-161-2` | falha a verificação quando encontra chamada de tradução em módulo de domínio | `borda` | Uma verificação automatizada falha quando encontra chamada de tradução em módulo de domínio |
| `UT-161-3` | exercita o módulo de domínio sem nenhuma camada de apresentação carregada | `feliz` | O mesmo módulo de domínio é exercitável por teste sem nenhuma camada de apresentação carregada |
| `UT-161-4` | dá a cada erro de domínio identificador estável, independente do texto | `feliz` | Cada erro de domínio tem identificador estável, independente do texto que o descreve |
| `UT-161-5` | monta o texto do usuário na apresentação, a partir do identificador | `feliz` | A aresta mais pesada da árvore é a de tradução, com 13.335 pontos de entrada vindos de 68 dos 71 módulos: num porte, isso é o sinal de que não existe separação entre domínio e apresentação |
| `UT-161-6` | mantém acíclico o grafo de dependências entre módulos de domínio | `borda` | 68 dos 71 módulos formam um único componente fortemente conexo, e os 3 fora de qualquer ciclo são exatamente as pontas de consumo |

**Achados do QA**

- Card bloqueado por decisão de arquitetura que vale para o porte inteiro, e o grafo medido em `_reversa_sdd/architecture/architecture-graph.md` diz por quê: 68 dos 71 módulos formam um único componente fortemente conexo, logo separar domínio de apresentação é redesenho, não extração. UT-161-6 descreve o estado de chegada; nenhum teste de unidade diz como sair do estado atual.

### REQ-162 — Declarar os pontos de extensão com contrato explícito

`must` · `bloqueado` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-162-1` | declara cada ponto de extensão com nome, assinatura, momento e quem pode registrar | `feliz` | Todo ponto de extensão é declarado, com nome, assinatura, momento de execução e quem pode registrar nele |
| `UT-162-2` | recusa a interceptação de valor por ponto não declarado | `erro` | Nenhum valor do sistema é interceptável por um ponto não declarado |
| `UT-162-3` | lista quais extensões registraram em quais pontos e com que ordem | `feliz` | É possível listar, numa instalação, quais extensões registraram em quais pontos e com que ordem |
| `UT-162-4` | registra toda alteração de decisão de autorização feita por ponto de extensão | `erro` | Uma decisão de autorização não é alterável por ponto de extensão sem que a alteração fique registrada |
| `UT-162-5` | declara em cada regra de negócio se ela é alterável e por qual ponto | `feliz` | A documentação de cada regra de negócio diz se ela é alterável e por qual ponto |
| `UT-162-6` | impede que código carregado intercepte qualquer valor do sistema | `erro` | No legado, qualquer código carregado intercepta qualquer valor do sistema, sem controle de quem registra |
| `UT-162-7` | responde se uma regra vale, consultando o inventário de registros | `feliz` | Cada regra documentada em cada um dos 56 módulos termina com a ressalva "é filtrável"; sem o inventário de extensões ativas não é possível afirmar que qualquer uma delas vale |
| `UT-162-8` | deixa rastro em cada uma das camadas de autorização alteradas por extensão | `erro` | As três camadas paralelas de autorização são todas filtráveis, uma delas inclusive para conceder |

**Achados do QA**

- Card bloqueado por decisão de arquitetura que `_reversa_sdd/hooks-e-plugin-api/questions.md` Q-01 chama de a mais consequente do porte: manter extensibilidade por ponto global preserva compatibilidade e deixa toda regra dos demais módulos como default, não garantia; trocar por contrato declarado produz um sistema auditável e quebra as extensões existentes. Os oito testes acima descrevem a segunda escolha; se a decisão for a primeira, UT-162-2 e UT-162-6 deixam de valer.
- Q-02 acrescenta o dado que falta para dimensionar a quebra: quais pontos têm extensão registrada em produção, e com que prioridade. Sem a lista de extensões ativas, o inventário de UT-162-3 não tem contra o que ser conferido.

### REQ-163 — Garantir a paridade de comportamento por suíte de teste executável

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-163-1` | associa cada regra de negócio catalogada a ao menos um teste consultável | `feliz` | Cada regra de negócio catalogada tem ao menos um teste automatizado que a exercita, e a correspondência regra → teste é consultável |
| `UT-163-2` | cobre cada etapa da cascata de moderação e a ordem entre elas | `borda` | A cascata de decisão de moderação tem teste para cada etapa e para a ordem entre elas |
| `UT-163-3` | cobre cada combinação de autoria e estado na resolução de permissão | `borda` | A resolução de permissão sobre objeto tem teste para cada combinação de autoria e estado |
| `UT-163-4` | roda a suíte em ambiente limpo, sem dado de produção | `feliz` | A suíte roda em ambiente limpo, sem depender de dado de produção |
| `UT-163-5` | recusa integrar alteração com teste vermelho | `erro` | A suíte é condição para integrar alteração: nenhuma mudança entra com teste vermelho |
| `UT-163-6` | recusa suíte vazia como rede de segurança | `erro` | Zero arquivos de teste em 3.381: não existe rede de segurança executável |
| `UT-163-7` | exercita cada caso de uso catalogado por ao menos um teste | `feliz` | Nenhum dos 47 casos de uso foi observado em execução: não há banco, não há conteúdo, não há log e não há configuração nesta árvore |

### REQ-164 — Acessar os dados por uma camada que não aceite consulta montada por concatenação

`must` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-164-1` | expressa toda consulta por parâmetro, nunca por texto concatenado | `feliz` | Toda consulta é expressa por parâmetro, nunca por texto concatenado com dado |
| `UT-164-2` | recusa receber fragmento de consulta vindo de dado de entrada | `erro` | A camada de dados recusa receber fragmento de consulta vindo de dado de entrada |
| `UT-164-3` | falha a verificação ao encontrar consulta montada por concatenação | `borda` | Uma verificação automatizada falha quando encontra consulta montada por concatenação |
| `UT-164-4` | recusa a conexão aberta por módulo de domínio fora da camada de dados | `erro` | A camada de dados é a única porta de acesso ao banco: nenhum módulo de domínio abre conexão própria |
| `UT-164-5` | mede o perfil de consultas por requisição | `feliz` | O perfil de consultas por requisição é mensurável, de modo que uma regressão de desempenho seja detectável |
| `UT-164-6` | mantém a camada de dados como módulo próprio do grafo | `feliz` | A camada de dados é o 14º módulo mais dependido do sistema medido, e não existia no recorte declarado pela análise anterior |
| `UT-164-7` | resolve estaticamente quem acessa o banco, por passar por uma porta declarada | `borda` | Peso de aresta é piso, não teto: esta árvore quase não declara tipo, logo chamada dinâmica não resolve na medição |

### REQ-165 — Decidir se o cache de objeto nasce persistente, e dar significado real à expiração

`must` · `bloqueado` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-165-1` | declara se o cache de objeto nasce persistente ou por requisição | `feliz` | A decisão está declarada: o cache de objeto nasce persistente ou nasce por requisição |
| `UT-165-2` | faz o prazo de expiração passado pelo chamador ter efeito observável | `borda` | O prazo de expiração passado pelos chamadores tem efeito observável, em lugar de ser aceito e ignorado |
| `UT-165-3` | expõe a taxa de acerto do cache ao diagnóstico | `feliz` | A taxa de acerto do cache é mensurável e exposta ao diagnóstico do site |
| `UT-165-4` | declara onde moram os valores com prazo | `feliz` | Está declarado onde moram os valores com prazo: no cache ou na tabela de configuração |
| `UT-165-5` | mantém o sistema correto com o cache indisponível, apenas mais lento | `erro` | O sistema funciona corretamente com o cache indisponível, apenas mais lento |
| `UT-165-6` | declara a persistência da implementação padrão em lugar de depender de um arquivo presente | `borda` | No legado a implementação padrão não persiste: todo cache morre com a resposta, e a persistência depende de um arquivo colocado na pasta de conteúdo |
| `UT-165-7` | registra os contadores de acerto em lugar de apenas mantê-los | `feliz` | Os contadores de acerto existem e nada os registra |

**Achados do QA**

- Card bloqueado por lacunas de `_reversa_sdd/object-cache/questions.md`: Q-01 é decisão de arquitetura com infraestrutura, Q-02 pergunta se a instalação real usa substituição persistente e qual, e Q-03 registra que a taxa de acerto de hoje não existe como dado. UT-165-3 e UT-165-7 produzem exatamente o número que falta — mas só no sistema novo, logo nenhuma comparação com o legado é possível.

### REQ-166 — Traduzir a interface a partir de catálogo declarado e atualizável

`should` · `pronto` · veredito `aprovado` · 5 de 5 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-166-1` | resolve o idioma por instalação e por conta | `feliz` | O idioma da interface é configurável por instalação e por conta |
| `UT-166-2` | carrega os textos de catálogo externo ao código, atualizável sem alterar o sistema | `feliz` | Os textos vêm de catálogo externo ao código, atualizável sem alterar o sistema |
| `UT-166-3` | cai no idioma de origem quando o texto não está no catálogo | `borda` | Texto sem tradução no catálogo cai no idioma de origem, sem erro e sem espaço vazio |
| `UT-166-4` | recusa instalar catálogo a quem não tem a capacidade declarada | `erro` | A instalação de catálogo novo exige a capacidade declarada, e essa capacidade consta da matriz |
| `UT-166-5` | trata número e ordem de palavras por forma declarada, não por concatenação | `feliz` | Texto com número e com ordem de palavras variável é tratado por forma declarada, não por concatenação |
| `UT-166-6` | declara na matriz a capacidade de instalar tradução | `feliz` | A capacidade de instalar tradução não está em papel algum no legado: entra por filtro |

### REQ-167 — Reportar o erro de análise de marcação em lugar de o reconhecer em silêncio

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-167-1` | devolve junto do resultado a lista de condições de erro com a sua posição | `feliz` | O analisador de marcação devolve, junto do resultado, a lista de condições de erro que encontrou, com posição |
| `UT-167-2` | apresenta ao autor as condições encontradas na tela de edição | `feliz` | A tela de edição mostra essas condições ao autor |
| `UT-167-3` | continua servindo o conteúdo com erro de marcação, sem reescrevê-lo | `borda` | O conteúdo com erro de marcação continua sendo servido, sem ser reescrito |
| `UT-167-4` | registra cada condição de erro com conteúdo e posição | `erro` | Uma condição de erro é registrada, com conteúdo e posição, para que o volume seja mensurável |
| `UT-167-5` | reporta a condição de erro em lugar de reconhecê-la sem sinal | `erro` | O analisador de marcação carrega 50 marcadores, a maioria declarando que reconhece a condição de erro e não tem como reportá-la. Quem depende de validação de marcação não a tem |

### REQ-168 — Impedir na instalação a entrada que o próprio instalador sabe que não deveria aceitar

`should` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-168-1` | recusa antes de gravar o campo inválido, nomeando campo e motivo | `erro` | Cada campo do instalador é validado antes de gravar, e o erro nomeia o campo e o motivo |
| `UT-168-2` | valida endereço do site, e-mail e credencial pelas mesmas regras do resto do sistema | `feliz` | Endereço do site, endereço de e-mail e credencial de administração são validados contra as mesmas regras que o resto do sistema usa |
| `UT-168-3` | oferece forma declarada de editar o endereço da rede | `feliz` | O endereço da rede, de que depende a identificação de sessão, tem forma de edição declarada |
| `UT-168-4` | recusa aceitar e corrigir em silêncio qualquer campo do instalador | `borda` | Nenhum campo do instalador é aceito e corrigido em silêncio |
| `UT-168-5` | recusa as quatro entradas que o instalador do legado admite aceitar por engano | `erro` | Quatro marcadores do instalador declaram, por escrito, que ele aceita entrada que deveria impedir |
| `UT-168-6` | permite editar pela interface o endereço de que depende a identificação de sessão | `feliz` | `@todo Network admins should have a method of editing the network siteurl` — o endereço da rede, de que depende a identificação de sessão, não tem interface |

### REQ-169 — Declarar a integridade referencial na estrutura de dados

`must` · `bloqueado` · veredito `parcial` · 3 de 4 critérios de aceite cobertos

| ID | Nome | Tipo | Prova |
|---|---|---|---|
| `UT-169-1` | declara cada relação catalogada no esquema, com o comportamento em remoção | `feliz` | Cada relação catalogada entre entidades é declarada no esquema, com o comportamento em remoção declarado |
| `UT-169-2` | dá desenho declarado às relações disfarçadas e à polimórfica | `feliz` | As relações disfarçadas e a relação polimórfica identificadas na análise têm desenho declarado, e não vínculo por convenção de nome |
| `UT-169-3` | mede e reporta os vínculos órfãos antes de aplicar qualquer restrição | `borda` | Uma migração de dados mede e reporta os vínculos órfãos existentes antes de aplicar qualquer restrição |
| `UT-169-4` | declara chave estrangeira para cada relação catalogada | `feliz` | 18 tabelas, 135 colunas, 59 índices e zero chaves estrangeiras: nenhuma relação é garantida pelo armazenamento |
| `UT-169-5` | cobre as vinte e quatro relações catalogadas, inclusive as autorreferências | `feliz` | 24 relações foram catalogadas, uma delas explícita de muitos para muitos, duas disfarçadas, duas autorreferências e uma polimórfica explícita |
| `UT-169-6` | recusa a remoção que deixaria vínculo órfão quando o comportamento declarado é restringir | `erro` | Cada relação catalogada entre entidades é declarada no esquema, com o comportamento em remoção declarado |

**Achados do QA**

- AC2 (o armazenamento recusa vínculo para registro inexistente) exige teste de integração: o critério fala do comportamento do banco sob restrição aplicada, e isso só se prova contra um banco real. UT-169-4 prova que a declaração existe no esquema; que o banco a aplica é outra coisa.
- Card bloqueado por lacuna aberta: não há banco nesta árvore, logo nenhuma volumetria foi medida e nenhum órfão foi contado. UT-169-3 prova que a migração mede antes de aplicar; o resultado dessa medição é o que decide se a migração é viável.

### REQ-170 — Descartar a substituição de componente do núcleo por arquivo solto na pasta de conteúdo

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 4 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 e AC3 são requisitos positivos de plataforma embutidos num card de descarte: configurar cache de objeto, cache de página, tratamento de erro fatal e resposta de site bloqueado por declaração nomeada, e expor no diagnóstico qual implementação está ativa. O primeiro ponto é coberto por REQ-165 (UT-165-1 e UT-165-6); os outros três não têm card próprio e ficam sem prova.
- AC4 (identificar os arquivos de substituição presentes numa instalação real) é obrigação de migração sobre uma instalação concreta. Vale o alerta do próprio card: um substituto de tratamento de erro fatal desliga todo o REQ-117 e os de resposta de bloqueio desligam parte do REQ-133, sem nenhum sinal — logo essa identificação é pré-condição para confiar nos testes daqueles dois cards.

### REQ-178 — Descartar a configuração declarativa de tela que ninguém lê

`wont` · `pronto` · veredito `fora-de-escopo` · 0 de 3 critérios de aceite cobertos

Sem teste de unidade: veredito `fora-de-escopo`.

**Achados do QA**

- AC2 pede verificação automatizada que liste as estruturas produzidas e não consumidas e falhe se houver alguma. É a terceira conferência de inventário do backlog com o mesmo formato — as outras são REQ-016 (capacidades) e REQ-158 (conectores) — e nenhuma delas tem card próprio de plataforma. Vale consolidar as três num requisito único, com um teste só.

---

## Onde este documento continua

| Artefato | O que cobre |
|---|---|
| [`backlog.json`](backlog.json) | os mesmos testes dentro de cada card, em `unit_tests` e `qa` |
| [`backlog.md`](backlog.md) | os cards em leitura corrida, com origem, dependências e referência ao legado |
| [`../domain.md`](../domain.md) | a regra de negócio citada em cada card, descrita por inteiro |
| [`../use-cases/use-cases.md`](../use-cases/use-cases.md) | os fluxos alternativos e as exceções que são a fonte dos testes de borda e de erro |
| [`../integrations/integrations.md`](../integrations/integrations.md) | o que é externo e, por isso, entra como dublê |
