# Integração externa

**Origem:** épico EP-14 do backlog do sistema legado (`os serviços de fora de que o sistema depende, e o que acontece quando eles falham`)  
**Cards:** REQ-149, REQ-150, REQ-151, REQ-152, REQ-153, REQ-154, REQ-155, REQ-156, REQ-157, REQ-158, REQ-181
**Dos quais, cards de descarte (prioridade `wont`):** REQ-150, REQ-157, REQ-158

## Por que esta feature existe

Os serviços de fora de que o sistema depende, e o que acontece quando eles falham. São 29
integrações e 64 endpoints catalogados. O épico EP-14 cobre o canal cifrado, a validação
do destino de requisição cuja URL vem de dado, a precedência de resolução da credencial, a
proibição de guardar credencial em texto recuperável, o prazo de espera e o tratamento de
erro em toda chamada de saída, o envio de e-mail com falha visível, a consulta ao serviço
de versões e de pacotes, e a notificação de serviços externos por lista declarada.

A integração mais crítica do sistema é com o próprio site: sem a requisição de volta,
nada agendado roda, e a falha é silenciosa por projeto. A segunda coisa a saber é que o
canal de atualização não tem garantia de autenticidade, por duas causas independentes que
se somam: a lista de chaves confiáveis devolve lista vazia desde 1º de abril de 2021, com
a falha rebaixada a aviso, e sete endpoints repetem a requisição em canal sem cifra quando
a negociação segura falha, inclusive o endpoint de somas de verificação, que é justamente
o que detectaria um arquivo de núcleo alterado. Treze canais nascem sem cifra. As
respostas 11 e 12 decidiram manter as duas coisas, com a palavra "dívida herdada
reproduzida de propósito".

## Histórias de usuário

### US-1 — Falar com serviço externo sempre por canal cifrado

Como dono do site, quero que toda conversa do site com serviço de fora seja cifrada, para que ninguém no caminho leia nem altere o que trafega.

**Critérios de aceite**

- [ ] CA-1.1 Nenhum endereço de serviço externo é escrito com esquema sem cifra no código
- [ ] CA-1.2 Uma verificação automatizada varre o código e falha quando encontra endereço externo sem cifra
- [ ] CA-1.3 Falha na negociação segura resulta em erro da chamada, registrado, nunca em tentativa sem cifra
- [ ] CA-1.4 O diagnóstico do site reporta quando o ambiente não consegue negociar canal seguro, antes de a falha acontecer em produção

**Regras de negócio que valem aqui**

- Treze endpoints do serviço de infraestrutura são escritos com esquema sem cifra e promovidos a cifrado apenas se o ambiente suportar
- Os artefatos anteriores registravam 2 canais sem cifra; são 13

### US-2 — Validar o destino de toda requisição de saída cuja URL vem de dado

Como dono do site, quero que o servidor não possa ser usado para buscar endereços escolhidos por quem envia dado, para que o site não alcance a rede interna em nome de outro.

**Critérios de aceite**

- [ ] CA-2.1 A validação de destino é o comportamento padrão de toda requisição de saída: não validar exige declaração explícita no ponto de chamada
- [ ] CA-2.2 Endereço que resolve para rede interna, para endereço de loopback ou para porta fora da lista permitida é recusado
- [ ] CA-2.3 Toda resposta de saída tem limite declarado de tamanho
- [ ] CA-2.4 Uma verificação automatizada lista os pontos de chamada que optaram por não validar e falha se algum deles receber endereço vindo de dado
- [ ] CA-2.5 O caso de requisição do site para si mesmo é declarado como exceção nomeada, com destino fixo

**Regras de negócio que valem aqui**

- No legado, a diferença entre a API validada e a não validada é um argumento, e o default é não validar
- A busca de folha de estilo remota declarada pelo tema usa a variante não validada, sem validação de endereço e sem limite de tamanho de resposta

### US-3 — Resolver a credencial de integração por precedência declarada

Como responsável pela operação, quero poder pôr a credencial de uma integração no ambiente e saber que ela vence o que está guardado no banco, para não ter de editar o banco a cada rotação de chave.

**Critérios de aceite**

- [ ] CA-3.1 A ordem de precedência é declarada e idêntica para toda integração: ambiente vence declaração da instalação, que vence valor guardado
- [ ] CA-3.2 Com a credencial no ambiente, o valor guardado é ignorado e isso é visível na tela de integrações
- [ ] CA-3.3 Credencial que combina identificador e segredo é separada no primeiro separador, para que o segredo possa conter o separador
- [ ] CA-3.4 Com qualquer das duas metades vazia, as duas são tratadas como ausentes
- [ ] CA-3.5 A tela de integrações diz, para cada uma, de onde a credencial corrente veio — sem mostrar o valor

**Regras de negócio que valem aqui**

- I1 — credencial de conector tem precedência: variável de ambiente, constante, banco. É uma inversão do hábito do produto, que sempre guardou configuração em opções `domain.md §2.9`
- I2 — credencial de conector pode combinar usuário e senha, dividida no primeiro dois-pontos; com qualquer das metades vazia, as duas voltam vazias `domain.md §2.9`
- I3 — o serviço de filtragem de spam é registrado como conector, com credencial por opção e por constante `domain.md §2.9`

### US-4 — Nunca guardar credencial de integração em texto recuperável

Como dono do site, quero que um vazamento do banco não entregue as credenciais das integrações, para que o dano de um incidente pare no site.

**Critérios de aceite**

- [ ] CA-4.1 Nenhuma credencial de integração é gravada em texto legível no armazenamento de configuração
- [ ] CA-4.2 A credencial é cifrada com chave que não vive no mesmo armazenamento, ou fica apenas no ambiente
- [ ] CA-4.3 Nenhuma tela e nenhuma resposta de API devolve o valor de uma credencial guardada
- [ ] CA-4.4 Uma verificação automatizada varre o armazenamento de configuração de uma instalação de teste e falha ao encontrar credencial legível
- [ ] CA-4.5 Toda credencial de integração é rotacionável sem perder a configuração da integração

**Regras de negócio que valem aqui**

- A senha da caixa postal é guardada em texto puro na configuração do site e enviada em texto puro no comando de autenticação, sobre conexão sem cifra
- Nenhuma credencial real foi encontrada comitada nesta árvore: sete segredos foram registrados por nome apenas

**Depende de:** US-3 (REQ-152)

### US-5 — Declarar prazo de espera e tratamento de erro em toda chamada de saída

Como dono do site, quero que um serviço de fora que não responde não deixe o site pendurado, e que operações longas tenham prazo próprio, para que a disponibilidade do site não seja a do serviço mais lento.

**Critérios de aceite**

- [ ] CA-5.1 Toda chamada de saída declara o seu prazo de espera; nenhuma herda um valor global por omissão
- [ ] CA-5.2 Operação de longa duração declara prazo compatível com a sua natureza, e isso é verificável no código
- [ ] CA-5.3 Esgotado o prazo, a chamada falha com erro identificável, registrado, e a operação que a pediu decide o que fazer
- [ ] CA-5.4 Falha de serviço externo não deixa o site sem resposta: há comportamento declarado para cada integração
- [ ] CA-5.5 Uma verificação automatizada lista as chamadas de saída sem prazo declarado e falha se houver alguma

**Regras de negócio que valem aqui**

- O adaptador de cliente HTTP do núcleo não define prazo de espera, logo valeria o default de 5 segundos — curto demais para geração de texto
- A requisição do site para si mesmo é não bloqueante por projeto, com prazo de 0,01 segundo e sem verificação de canal, logo a falha é invisível

### US-6 — Enviar o e-mail do sistema por canal declarado, com falha visível

Como responsável pela operação, quero saber quando o site deixou de conseguir mandar e-mail, porque metade dos procedimentos do sistema depende de um e-mail chegar.

**Critérios de aceite**

- [ ] CA-6.1 O canal de envio é declarado na configuração da instalação, com credencial resolvida pela precedência declarada
- [ ] CA-6.2 Falha no envio é registrada com destinatário, assunto, instante e motivo, e nunca descartada em silêncio
- [ ] CA-6.3 O diagnóstico do site reporta quando o canal de envio não está funcionando
- [ ] CA-6.4 As operações que dependem de envio — redefinição de senha, moderação, recuperação, privacidade, cadastro, aviso de atualização — tratam a falha conforme o que cada uma declara
- [ ] CA-6.5 Nenhum segredo do canal de envio aparece em registro ou em tela

**Regras de negócio que valem aqui**

- O servidor de e-mail de saída é o destino de toda notificação do sistema: moderação, redefinição de senha, chave de recuperação, confirmação de privacidade, falha de atualização
- D3 — falha de envio de e-mail é estado, não exceção `domain.md §2.5`
- A10 — o marcador do aviso de recuperação é gravado antes do envio, de modo que falhar em gravar significa não avisar `domain.md §2.6`

**Depende de:** US-3 (REQ-152) · REQ-159, fora desta feature

### US-7 — Consultar o serviço de versões e de distribuição de pacotes

Como administrador, quero saber o que está desatualizado neste site e de onde baixar a versão nova, para manter o sistema sem procurar à mão.

**Critérios de aceite**

- [ ] CA-7.1 A consulta informa a versão disponível do núcleo, das extensões e das traduções, e é feita por canal cifrado
- [ ] CA-7.2 A resposta é guardada com prazo, para que a consulta não aconteça a cada requisição
- [ ] CA-7.3 Serviço indisponível não quebra nenhuma tela: a última resposta guardada é usada, com a sua idade informada
- [ ] CA-7.4 O endereço do serviço é configurável, para instalação que use espelho próprio
- [ ] CA-7.5 Nenhum dado além do declarado neste card é enviado na consulta, e a lista é inspecionável por quem administra o site

**Regras de negócio que valem aqui**

- Catorze endpoints do serviço de infraestrutura são consumidos pelo sistema
- Os payloads de resposta de dez desses endpoints estão marcados como inferidos: a estrutura foi reconstruída dos campos que o código lê, não de captura real

**Depende de:** US-1 (REQ-149), US-5 (REQ-154)

### US-8 — Notificar serviços externos de atualização do site apenas por lista declarada

Como dono do site, quero poder avisar agregadores quando publico, e quero saber exatamente quais serviços o site avisa, para não mandar dado a terceiro sem ter escolhido.

**Critérios de aceite**

- [ ] CA-8.1 A lista de serviços a notificar é configuração do site, visível na tela, e a notificação só acontece para os que estiverem nela
- [ ] CA-8.2 A lista nasce vazia, ou nasce com o valor declarado e visível na tela de configuração antes da primeira publicação
- [ ] CA-8.3 A notificação sai por canal cifrado e não bloqueia a publicação
- [ ] CA-8.4 Falha na notificação é registrada e não desfaz a publicação
- [ ] CA-8.5 A notificação não acontece para conteúdo que não é público

**Regras de negócio que valem aqui**

- O endereço do serviço de notificação é valor padrão de uma opção semeada na instalação: no legado, publicar num site de fábrica avisa um terceiro sem ninguém ter escolhido isso
- Esta integração de saída não aparece em nenhum artefato anterior ao de integrações

**Depende de:** US-1 (REQ-149), US-5 (REQ-154) · REQ-019, fora desta feature

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-150 — Descartar a repetição da chamada sem cifra quando a negociação segura falha

O sistema novo não repetirá, em canal aberto, a chamada a serviço externo cuja negociação segura falhou.

**Motivo registrado no card:** Achado de segurança de `integrations.md`: o canal de atualização não tem garantia de autenticidade por duas causas independentes que se somam, e esta é uma delas. O rebaixamento existe para tolerar infraestrutura que não negocia TLS, mas o efeito é que quem está no caminho pode servir um pacote arbitrário — inclusive para o endpoint que deveria detectar exatamente isso. `_reversa_sdd/cliente-http/questions.md` Q-02 registra que remover é a escolha correta e pode quebrar a comunicação com serviços que ainda falhem em TLS a partir desta infraestrutura; o custo dessa quebra é operacional e visível, ao contrário do custo de manter.

**Como conferir que ficou fora**

- [ ] Nenhum caminho do sistema novo repete uma chamada externa sem cifra depois de a negociação segura falhar
- [ ] A falha é reportada ao chamador e registrada, em lugar de contornada
- [ ] A consulta de integridade dos próprios arquivos, em particular, não tem caminho sem cifra
- [ ] Com o serviço inalcançável, a operação que dependia dele é cancelada com motivo visível

> Conflito registrado, não resolvido, e explícito. A resposta 12 nomeia REQ-150 e decidiu manter o rebaixamento para canal sem cifra, inclusive nos sete endpoints que repetem em claro, com a ressalva de que a implantação pode fechar a brecha por configuração sem alterar o núcleo. O card diz o contrário, e o terceiro critério dele é o mais incômodo: a consulta de integridade dos próprios arquivos não teria caminho sem cifra.

### REQ-157 — Descartar a publicação de conteúdo por caixa postal

O sistema novo não terá a publicação de conteúdo a partir de mensagens lidas de uma caixa postal por POP3.

**Motivo registrado no card:** Três razões somadas. É a única superfície de entrada que grava conteúdo publicado com autoria decidida por um campo falsificável. A credencial da caixa fica em texto puro na configuração e trafega sem cifra. E é o único caso de uso que o Reversa não conseguiu confirmar como ligado: a lacuna G11 registra que depende de uma opção ter valor diferente do exemplo e de alguém requisitar um endereço que nenhum evento agendado do núcleo requisita — nesta árvore é uma superfície de entrada sem gatilho conhecido. Reescrever um canal de publicação que talvez ninguém use, com autoria falsificável e credencial em claro, é custo sem contrapartida.

**Como conferir que ficou fora**

- [ ] Nenhum endereço do sistema novo conecta em caixa postal para criar conteúdo
- [ ] Nenhum campo de configuração do sistema novo guarda credencial de caixa postal
- [ ] O endereço herdado, se requisitado, responde com a resposta de endereço inexistente
- [ ] A migração declara o que fazer com os valores de configuração existentes, se houver

> Conflito registrado, não resolvido. Nenhuma resposta nomeia REQ-157, mas duas o contradizem por consequência: a resposta 10 e a resposta 19 mandam preservar a trava de cinco minutos do caminho de publicação por caixa postal, e essa trava só existe se o caminho for portado. Vale notar o que o card acrescenta: é a única superfície que grava conteúdo publicado com autoria decidida por um campo falsificável, e a credencial da caixa fica em texto puro na configuração.

### REQ-158 — Descartar os conectores de modelo de linguagem declarados sem provedor

O sistema novo não portará os três conectores de modelo de linguagem que o legado declara e que nenhum código desta árvore executa.

**Motivo registrado no card:** Não é um recurso a portar: é uma declaração sem implementação. A análise não encontrou payload, endereço base nem tratamento de erro porque nenhum código desta árvore os executa, e o adaptador do núcleo que rotearia essas chamadas não define prazo de espera — valeria o default de 5 segundos, curto demais para geração de texto. Portar a declaração produz três integrações que falham do mesmo jeito que hoje, sem ninguém notar. A necessidade real, se existir, vira requisito novo com especificação própria.

**Como conferir que ficou fora**

- [ ] Nenhuma declaração de conector do sistema novo aponta para implementação que não existe
- [ ] Uma verificação automatizada lista os conectores declarados sem implementação correspondente e falha se houver algum
- [ ] Uma integração com modelo de linguagem, se e quando for pedida, entra como requisito próprio, com payload, endereço base, prazo de espera e tratamento de erro especificados

> Conflito registrado, não resolvido, e explícito. A resposta 18 decidiu portar o cliente de modelo de linguagem, os três conectores e a camada de operações nomeadas "como o núcleo os traz", com o provedor permanecendo fora do escopo e o ator continuando sem caso de uso, como no legado. O card diz para não portar a declaração sem implementação. A mesma resposta 18 autoriza a única divergência desta feature, que é definir o tempo limite do adaptador.

## Perguntas em aberto

- [ ] Conflito registrado, não resolvido, e explícito. REQ-149 é `must` e exige, em três critérios, que nenhum endereço externo seja escrito sem cifra, que uma verificação automatizada falhe quando encontrar um, e que a falha de negociação segura resulte em erro em vez de tentativa sem cifra. A resposta 12 decidiu o contrário, mantendo os 13 canais sem cifra e as 7 repetições em claro. É o mesmo conflito do descarte REQ-150, agora numa história obrigatória.
- [ ] REQ-153 proíbe guardar credencial de integração em texto recuperável, e a credencial da caixa postal do legado fica em texto puro na configuração e trafega sem cifra. Se o descarte de REQ-157 não valer, as duas decisões se excluem: ou a caixa postal é portada com a credencial em claro, ou REQ-153 é violado na primeira integração.
- [ ] REQ-154 declara prazo de espera e tratamento de erro em toda chamada de saída, e é por esta história que passa a única divergência que a resposta 18 autorizou: definir o tempo limite do adaptador de modelo de linguagem em vez de herdar o default curto do cliente genérico. Quem implementar precisa citar a resposta 18 no código, como manda P1 da constituição.
- [ ] O serviço externo de reputação aparece nas integrações desta feature, e a resposta 13 o põe fora do núcleo clonado, como extensão empacotada. Isso muda o que esta feature precisa entregar, e a decisão de escopo não está registrada em card nenhum.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-149 · UC-33 · UC-34 · UC-35 · UC-37 | `wp-includes/update.php:226`, `wp-admin/includes/dashboard.php:1835`, `wp-includes/http.php:52` |
| US-2 | REQ-151 · UC-29 · UC-17 · UC-37 | `wp-includes/http.php:52`, `wp-includes/block-editor.php:776`, `wp-admin/includes/class-wp-site-health.php:3622` |
| US-3 | REQ-152 · UC-15 · `domain.md §2.9` (I1) · `domain.md §2.9` (I2) · `domain.md §2.9` (I3) | `wp-includes/connectors.php:444`, `wp-includes/connectors.php:483`, `wp-includes/connectors.php:239` |
| US-4 | REQ-153 · UC-40 · UC-15 · UC-33 | `wp-mail.php:18`, `wp-includes/class-pop3.php:43`, `wp-includes/connectors.php:444` |
| US-5 | REQ-154 · UC-37 · UC-39 · UC-33 · UC-15 | `wp-includes/http.php:52`, `wp-admin/includes/class-wp-site-health.php:3622`, `wp-includes/cron.php:1051` |
| US-6 | REQ-155 · UC-20 · UC-16 · UC-25 · UC-36 · UC-35 · UC-24 · `domain.md §2.5` (D3) · `domain.md §2.6` (A10) | `wp-includes/pluggable.php:1082`, `wp-includes/class-wp-recovery-mode-email-service.php:53`, `wp-admin/includes/privacy-tools.php:226` |
| US-7 | REQ-156 · UC-33 · UC-34 · UC-35 · UC-37 · UC-38 | `wp-includes/update.php:226`, `wp-admin/includes/import.php:158`, `wp-admin/includes/dashboard.php:1563` |
| US-8 | REQ-181 · UC-03 | `wp-admin/includes/schema.php:450`, `wp-includes/comment.php:3412` |
| fora de escopo: REQ-150 | REQ-150 · UC-34 · UC-35 · UC-33 | `wp-includes/update.php:226`, `wp-includes/http.php:52`, `wp-admin/includes/file.php:1548` |
| fora de escopo: REQ-157 | REQ-157 · UC-40 | `wp-mail.php:14`, `wp-mail.php:18`, `wp-mail.php:53` (+1) |
| fora de escopo: REQ-158 | REQ-158 · UC-46 | `wp-includes/connectors.php:290`, `wp-includes/connectors.php:307`, `wp-includes/connectors.php:319` |
