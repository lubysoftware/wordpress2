# Operação do próprio software

**Origem:** épico EP-10 do backlog do sistema legado (`instalar, atualizar, diagnosticar e recuperar o sistema`)  
**Cards:** REQ-106, REQ-107, REQ-108, REQ-109, REQ-110, REQ-111, REQ-112, REQ-113, REQ-114, REQ-115, REQ-116, REQ-117, REQ-118, REQ-119, REQ-121
**Dos quais, cards de descarte (prioridade `wont`):** REQ-121

## Por que esta feature existe

Instalar, atualizar, diagnosticar e recuperar o próprio sistema. É a feature que existe
por causa da decisão fundadora D7: este produto se instala, se atualiza e sobrescreve os
próprios arquivos em execução, e por isso o alvo de implantação é o sistema de arquivos e
o pipeline de implantação é o painel administrativo. O épico EP-10 cobre a instalação e
atualização de extensão, a verificação de autenticidade do pacote, a recusa de
atualização incompatível com o ambiente, a manutenção restrita ao escopo afetado, o
aborto sem deixar o destino quebrado, a atualização do núcleo manual e automática, a
migração de esquema com histórico, a segunda chance na falha transitória com congelamento
na falha crítica, o aviso sem repetição, o destravamento declarado, o modo de recuperação
e o diagnóstico do ambiente.

O desenho de falha é a parte que ninguém adivinha. Falha crítica congela a atualização
automática até intervenção humana; falha transitória tem exatamente uma segunda chance,
em uma hora, e não notifica; o mesmo aviso nunca é repetido para a mesma dupla de
destinatário e versão; e o modo de recuperação dura uma semana, avisa uma vez por dia, e
grava o marcador antes de enviar o e-mail, de modo que falhar na gravação aborta o aviso.
A chave de recuperação, por fim, é consumida antes de ser verificada, o que é o ADR 0007
e a razão de US-13 existir.

## Histórias de usuário

### US-1 — Instalar e atualizar extensão a partir do catálogo ou de arquivo enviado

Como administrador, quero acrescentar ou renovar um plugin ou tema do site, para mudar o que ele faz sem acesso ao servidor.

**Critérios de aceite**

- [ ] CA-1.1 A ação exige a capacidade declarada e a confirmação do token da tela
- [ ] CA-1.2 A instalação a partir do catálogo consulta o serviço de distribuição e obtém o endereço do pacote
- [ ] CA-1.3 A instalação a partir de arquivo enviado exige a capacidade declarada de envio de pacote, que resolve para a de instalar, e não consulta o serviço
- [ ] CA-1.4 Ativar o plugin depois de instalar exige uma capacidade distinta da de instalar
- [ ] CA-1.5 Numa atualização em lote, a capacidade é verificada uma vez e cada item tem resultado próprio; um que falha não interrompe os demais
- [ ] CA-1.6 Com a proibição de modificar arquivos declarada, todas essas capacidades são negadas a toda conta, inclusive à de maior poder
- [ ] CA-1.7 Em instalação em rede, a ação é poder de rede

**Regras de negócio que valem aqui**

- As capacidades de instalação são exclusivas do papel de administração, e em rede são negadas a quem não administra a rede

**Depende de:** REQ-015, fora desta feature

### US-2 — Verificar a autenticidade do pacote antes de o aplicar

Como dono do site, quero que o sistema recuse um pacote que não prove ter vindo de quem diz, para que atualizar não seja um caminho de entrada para código de terceiros.

**Critérios de aceite**

- [ ] CA-2.1 Todo pacote baixado é verificado contra uma chave pública válida antes de ser descompactado
- [ ] CA-2.2 Pacote sem prova de autenticidade é recusado e a atualização é abortada, com a versão anterior intacta
- [ ] CA-2.3 A recusa é visível ao ator e fica registrada, independentemente de o site estar em modo de depuração
- [ ] CA-2.4 A verificação não é contornável por configuração sem registro explícito dessa decisão
- [ ] CA-2.5 A lista de chaves confiáveis tem prazo declarado e o diagnóstico do site avisa antes de ela vencer

**Regras de negócio que valem aqui**

- A8 — a assinatura do pacote não é verificada: a lista de chaves confiáveis devolve lista vazia desde 2021-04-01 e nenhum chamador exige verificação `domain.md §2.6`
- ADR 0010 — tolerar pacote sem assinatura verificada
- O marcador `// TODO: Add key #2 with longer expiration.` declara, por escrito, a chave substituta que nunca entrou

**Depende de:** US-1 (REQ-106)

### US-3 — Recusar atualização incompatível com o ambiente, informando o motivo

Como administrador, quero saber que o site não atualiza porque o servidor é antigo, para poder resolver o servidor em lugar de ficar sem entender.

**Critérios de aceite**

- [ ] CA-3.1 A versão oferecida é comparada com o mínimo de ambiente que ela declara, antes de qualquer download
- [ ] CA-3.2 Versão incompatível é descartada e o motivo é mostrado ao ator, nomeando o requisito que falta
- [ ] CA-3.3 Extensão que declara mínimo de ambiente é recusada pelo mesmo critério
- [ ] CA-3.4 O descarte por incompatibilidade nunca é silencioso, nem no caminho automático
- [ ] CA-3.5 A tela oferece o caminho para atualizar o ambiente a quem tem a capacidade declarada para isso

**Regras de negócio que valem aqui**

- A4 — não se atualiza para versão que o ambiente não suporta; plugin e tema também declaram mínimo `domain.md §2.6`
- No caminho automático, o descarte por incompatibilidade acontece em silêncio: um site parado numa versão antiga por ambiente velho não avisa ninguém

**Depende de:** US-1 (REQ-106)

### US-4 — Pôr em manutenção apenas o escopo afetado pela atualização

Como administrador de uma rede, quero que atualizar um plugin de um site não tire os outros do ar, para que a manutenção de um não seja indisponibilidade de todos.

**Critérios de aceite**

- [ ] CA-4.1 A atualização de extensão de um site coloca em manutenção apenas aquele site
- [ ] CA-4.2 A atualização do núcleo coloca em manutenção o escopo que o núcleo afeta, declarado neste card
- [ ] CA-4.3 A manutenção é retirada ao fim da operação, inclusive quando ela falha
- [ ] CA-4.4 Uma manutenção que ficou presa é detectável e removível sem acesso ao servidor

**Regras de negócio que valem aqui**

- `@todo For multisite, maintenance mode should only kick in for individual sites` — atualizar um plugin coloca a rede inteira em manutenção

**Depende de:** US-1 (REQ-106)

### US-5 — Abortar a atualização sem deixar o destino quebrado

Como dono do site, quero que uma atualização que falha deixe o site como estava, para que um erro de rede não tire o site do ar.

**Critérios de aceite**

- [ ] CA-5.1 Pacote que não pôde ser baixado, ou é inválido, aborta a operação com a versão anterior intacta
- [ ] CA-5.2 O diretório temporário é limpo em todo caminho de saída, inclusive no de erro
- [ ] CA-5.3 Falha na substituição de arquivos reverte o destino para a versão anterior
- [ ] CA-5.4 Reversão que também falha é tratada como falha crítica, com registro próprio
- [ ] CA-5.5 Destino não gravável pede credenciais de acesso a arquivo e, sem elas, cancela antes de tocar o destino

**Regras de negócio que valem aqui**

- A1 — atualização automática exige escrita no destino e ausência de controle de versão `domain.md §2.6`
- A5 — falha crítica congela a atualização automática até intervenção humana `domain.md §2.6`

**Depende de:** US-1 (REQ-106)

### US-6 — Migrar o esquema de dados com histórico das migrações aplicadas

Como responsável pela operação, quero saber quais migrações já rodaram neste banco, para poder diagnosticar e repetir uma atualização com segurança.

**Critérios de aceite**

- [ ] CA-6.1 Cada migração aplicada fica registrada com identificador, versão, instante e resultado
- [ ] CA-6.2 Uma migração já aplicada não é aplicada de novo
- [ ] CA-6.3 Uma migração que falha no meio deixa o banco em estado declarado e o registro diz onde parou
- [ ] CA-6.4 É possível listar, antes de atualizar, quais migrações faltam neste banco
- [ ] CA-6.5 A migração não depende de comparar a estrutura corrente com a estrutura desejada para decidir o que fazer

**Regras de negócio que valem aqui**

- A migração de esquema do legado é por comparação de estrutura, sem histórico de migrações aplicadas

### US-7 — Atualizar o núcleo do sistema por decisão explícita

Como administrador, quero levar o sistema a uma versão nova quando eu decidir, para controlar o momento da mudança.

**Critérios de aceite**

- [ ] CA-7.1 A ação exige a capacidade declarada de atualizar o núcleo e a confirmação do token da tela
- [ ] CA-7.2 O sistema consulta o serviço de versões e apresenta só as ofertas aplicáveis ao ambiente
- [ ] CA-7.3 A substituição de arquivos é seguida da migração de esquema, na mesma operação
- [ ] CA-7.4 Reinstalar a mesma versão é um caminho oferecido e termina no mesmo estado
- [ ] CA-7.5 Em instalação em rede, a ação é poder de rede
- [ ] CA-7.6 Ao fim, o registro de falha de atualização automática é apagado

**Regras de negócio que valem aqui**

- A4 — não se atualiza para versão que o ambiente não suporta `domain.md §2.6`
- A8 — no legado, a assinatura do pacote não é verificada `domain.md §2.6`

**Depende de:** US-2 (REQ-107), US-5 (REQ-110), US-6 (REQ-112)

### US-8 — Atualizar o núcleo automaticamente conforme política declarada

Como dono do site, quero que o sistema se mantenha na versão corrente sem ninguém decidir caso a caso, para não ficar atrás por esquecimento.

**Critérios de aceite**

- [ ] CA-8.1 Correções de segurança e manutenção são aplicadas por padrão; mudança de versão principal só com escolha explícita
- [ ] CA-8.2 A política declarada na instalação vence a configuração guardada, e desligá-la desliga tudo
- [ ] CA-8.3 A atualização automática exige escrita no destino e ausência de controle de versão no diretório
- [ ] CA-8.4 O ambiente é conferido antes de qualquer download
- [ ] CA-8.5 O registro de falha é consultado antes de decidir tentar aquela versão
- [ ] CA-8.6 Ao fim de uma atualização bem-sucedida, o registro de falha é apagado

**Regras de negócio que valem aqui**

- A1 — atualização automática exige escrita no destino e ausência de controle de versão `domain.md §2.6`
- A2 — correção e manutenção por padrão; versão principal só com escolha explícita `domain.md §2.6`
- A3 — a declaração da instalação vence a configuração guardada, e desligar desliga tudo `domain.md §2.6`

**Depende de:** US-7 (REQ-111) · REQ-122, fora desta feature

### US-9 — Dar uma segunda chance à falha transitória e congelar a automação em falha crítica

Como dono do site, quero que um erro passageiro não pare a automação e que um erro grave pare, para que o sistema não insista em quebrar o site.

**Critérios de aceite**

- [ ] CA-9.1 Falha classificada como transitória reagenda exatamente uma tentativa, no prazo declarado
- [ ] CA-9.2 Falha classificada como gravosa não repete o mesmo par versão e origem, e volta a tentar quando outra versão for oferecida
- [ ] CA-9.3 Falha classificada como crítica grava registro próprio e faz a automação recusar toda versão até intervenção humana
- [ ] CA-9.4 A classificação de cada tipo de falha é declarada em um lugar só
- [ ] CA-9.5 O registro de falha guarda tentativa, versão, código de erro, instante e severidade

**Regras de negócio que valem aqui**

- A5 — falha crítica congela a atualização automática até intervenção humana `domain.md §2.6`
- A6 — falha transitória tem exatamente uma segunda chance, em uma hora, e não notifica `domain.md §2.6`
- ADR 0008 — falha crítica de atualização exige intervenção humana

**Depende de:** US-8 (REQ-113)

### US-10 — Avisar o responsável em todo cancelamento de atualização, sem repetir o mesmo aviso

Como administrador, quero ser avisado sempre que o sistema deixou de se atualizar e por quê, para não descobrir meses depois que o site está parado numa versão antiga.

**Critérios de aceite**

- [ ] CA-10.1 Todo portão que cancela a atualização automática produz aviso, inclusive o de incompatibilidade de ambiente
- [ ] CA-10.2 O aviso nomeia o portão que barrou e o que precisa mudar
- [ ] CA-10.3 O mesmo aviso, para o mesmo destinatário e a mesma versão, não é enviado duas vezes
- [ ] CA-10.4 O registro de avisos enviados guarda destinatário, versão e tipo
- [ ] CA-10.5 O estado "não atualiza, e por isto" é visível no diagnóstico do site, não só por e-mail

**Regras de negócio que valem aqui**

- A7 — o mesmo aviso não é repetido `domain.md §2.6`
- A6 — falha transitória não notifica: só a segunda falha manda e-mail `domain.md §2.6`
- No legado, um e-mail é enviado ou não, e a diferença depende de qual portão barrou

**Depende de:** US-8 (REQ-113), US-9 (REQ-114)

### US-11 — Destravar a atualização congelada por caminho declarado e descoberto pelo ator

Como administrador de um site cuja automação congelou, quero saber qual é o caminho de volta e percorrê-lo, para não ficar sem atualização por tempo indefinido.

**Critérios de aceite**

- [ ] CA-11.1 Com a automação congelada, a tela de atualização diz que ela está congelada, por qual falha, e qual a ação que a destrava
- [ ] CA-11.2 A ação de destravar é explícita e não depende de o ator adivinhar que uma atualização manual bem-sucedida tem esse efeito
- [ ] CA-11.3 Destravar apaga o registro de falha e a automação volta a funcionar na execução seguinte
- [ ] CA-11.4 O caminho de destravar não depende de uma invariante entre dois pontos do código: a condição é declarada em um lugar só

**Regras de negócio que valem aqui**

- A5 — falha crítica congela a atualização automática até intervenção humana `domain.md §2.6`
- ADR 0008 — falha crítica de atualização exige intervenção humana
- No legado, só a atualização manual alcança a linha que apaga o registro, e essa invariante entre dois arquivos não é declarada em lugar algum

**Depende de:** US-7 (REQ-111), US-9 (REQ-114)

### US-12 — Entrar em modo de recuperação quando um erro fatal derruba a área protegida

Como administrador, quero voltar a administrar um site derrubado por uma extensão defeituosa sem que o visitante veja a obra, para consertar sem tirar o site do ar.

**Critérios de aceite**

- [ ] CA-12.1 Erro fatal em área protegida identifica a extensão responsável, gera uma chave de recuperação e envia o caminho de recuperação a quem administra o site
- [ ] CA-12.2 Abrir o caminho de recuperação cria uma sessão própria, com prazo declarado
- [ ] CA-12.3 Dentro dessa sessão, a extensão responsável está pausada apenas para quem está na sessão: o visitante continua vendo o site como estava
- [ ] CA-12.4 Erro fatal em área pública não aciona a recuperação
- [ ] CA-12.5 Sair da recuperação retoma de uma vez todas as extensões pausadas e zera o limite de avisos
- [ ] CA-12.6 O aviso é limitado a um por dia por sessão, e o marcador é gravado antes do envio, de modo que falhar em gravar significa não avisar
- [ ] CA-12.7 Existe conta capaz de retomar extensão pausada numa instalação de fábrica

**Regras de negócio que valem aqui**

- A10 — modo de recuperação dura uma semana e avisa uma vez por dia; o marcador é gravado antes do envio `domain.md §2.6`
- A11 — erro em área pública não aciona recuperação, e extensão de rede é fora de escopo `domain.md §2.6`
- A12 — sair do modo de recuperação retoma todas as extensões pausadas de uma vez `domain.md §2.6`
- O escopo da pausa é a sessão, não o site: é isso que torna o modo usável em produção

**Depende de:** REQ-016, fora desta feature

### US-13 — Verificar a chave de recuperação antes de a consumir

Como administrador tentando recuperar o site, quero que uma chave inválida não queime a chave válida, para não ficar sem caminho de volta por causa de um link clicado errado.

**Critérios de aceite**

- [ ] CA-13.1 A chave é verificada antes de ser removida do armazenamento
- [ ] CA-13.2 Chave inválida é recusada e a chave válida continua existindo
- [ ] CA-13.3 Chave válida é consumida no mesmo passo em que a sessão de recuperação é criada
- [ ] CA-13.4 Chave vencida é removida por rotina agendada e um erro novo gera chave nova
- [ ] CA-13.5 Nenhum contador de tentativas é exposto, e cada tentativa inválida fica registrada

**Regras de negócio que valem aqui**

- ADR 0007 — chave consumida antes de validar
- Cinco casos de uso não são autorizados por capacidade alguma, e a chave de recuperação é um deles

**Depende de:** US-12 (REQ-117)

### US-14 — Diagnosticar a saúde do ambiente, com o teste de requisição de volta em destaque

Como administrador, quero saber se o ambiente do site está em condições de funcionar, para descobrir um problema antes de ele virar incidente.

**Critérios de aceite**

- [ ] CA-14.1 A tela exige a capacidade declarada de ver diagnósticos, e essa capacidade consta da matriz
- [ ] CA-14.2 A bateria de testes é executada e cada resultado tem severidade
- [ ] CA-14.3 O teste de requisição do site para si mesmo é executado e o seu resultado é apresentado em primeiro lugar, porque sem ele nenhum trabalho agendado roda
- [ ] CA-14.4 O resultado de cada execução é guardado com instante, de modo que a evolução seja comparável entre visitas
- [ ] CA-14.5 A aba de informações do ambiente apresenta o inventário sem veredito

**Regras de negócio que valem aqui**

- A capacidade de ver diagnósticos é concedida por filtro a quem pode instalar plugin, e em rede só a quem administra a rede
- A tela de saúde do site calcula na hora e não armazena
- Loopback é o site pedindo a própria página de volta

**Depende de:** REQ-016, fora desta feature

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-121 — Descartar o editor de arquivos de extensão dentro do painel

O sistema novo não terá a tela que permite editar, pelo navegador, os arquivos de código dos temas e plugins instalados.

**Motivo registrado no card:** É execução de código arbitrário no servidor a partir de um formulário do navegador, protegida apenas por capacidade — e desligável somente por uma declaração que a instalação precisa lembrar de fazer. Reescrevê-la é reescrever o caminho mais curto entre uma conta administrativa comprometida e o servidor. A economia não é o tamanho da tela: é não ter de defender essa superfície pelo resto da vida do produto.

**Como conferir que ficou fora**

- [ ] Nenhuma tela do sistema novo grava arquivo de código a partir de entrada do navegador
- [ ] A capacidade correspondente não existe na matriz, em lugar de existir e ser negada por configuração
- [ ] A alteração de arquivo de extensão passa a ter um caminho declarado fora do painel, documentado para quem opera

> Conflito registrado, não resolvido, e explícito. A resposta 14 de `questions.md` nomeia REQ-121 e decide que nenhuma das três superfícies sai, porque são superfícies do núcleo que está sendo clonado: o descarte "vale como não mudar, nunca como não portar". O card diz o contrário, e descreve com precisão o que a superfície custa. As duas decisões são humanas; este pacote não escolhe.

## Perguntas em aberto

- [ ] Conflito registrado, não resolvido, e explícito. US-2 (REQ-107) exige verificar a autenticidade do pacote antes de o aplicar, recusar o pacote sem prova e não permitir contorno por configuração. A resposta 11 decidiu manter a tolerância do legado: pacote sem assinatura verificada é instalado, e o modo de falha do ADR 0010 é portado como está, porque exigir assinatura tornaria o sistema incompatível com o ecossistema que ele clona. É o conflito mais consequente do pacote, porque a história é `must` e a resposta é explícita.
- [ ] CA-14.4 (REQ-119) exige guardar o resultado de cada execução do diagnóstico com instante, para comparar a evolução entre visitas. A regra registrada no próprio card diz que a tela do legado calcula na hora e não armazena nada. Guardar é melhoria, e melhoria é divergência que precisa de decisão (P1), além de criar um dado com prazo de retenção que a resposta 20 proíbe inventar.
- [ ] REQ-120 (exportar e importar o conteúdo num formato declarado) ficou `bloqueado` e não entrou. US-6 migra esquema de dados, mas o pacote não especifica o formato de intercâmbio de conteúdo, que é o caminho pelo qual uma instalação legada entraria no sistema novo.
- [ ] US-11 (REQ-116) destrava a atualização congelada, e a análise registra que o destravamento do legado existe mas depende de uma invariante não declarada entre dois arquivos. Reproduzir a invariante exige lê-la no código do legado, caso a caso: ela não está escrita em nenhum artefato desta análise.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-106 · UC-33 | `wp-admin/update.php:28`, `wp-admin/update.php:50`, `wp-admin/update.php:106` (+4) |
| US-2 | REQ-107 · UC-33 · UC-34 · UC-35 · `domain.md §2.6` (A8) | `wp-admin/includes/file.php:1548`, `wp-admin/includes/file.php:1553`, `wp-admin/includes/class-plugin-upgrader.php:190` |
| US-3 | REQ-108 · UC-33 · UC-34 · UC-35 · `domain.md §2.6` (A4) | `wp-admin/includes/class-wp-automatic-updater.php:278`, `wp-admin/update-core.php:548`, `wp-admin/includes/class-plugin-upgrader.php:285` |
| US-4 | REQ-109 · UC-33 · UC-34 | `wp-admin/includes/class-plugin-upgrader.php:316`, `wp-admin/includes/class-theme-upgrader.php:295`, `wp-admin/update.php:112` |
| US-5 | REQ-110 · UC-33 · UC-34 · UC-35 · `domain.md §2.6` (A1) · `domain.md §2.6` (A5) | `wp-admin/includes/class-wp-automatic-updater.php:210`, `wp-admin/includes/class-core-upgrader.php:324`, `wp-admin/update.php:151` |
| US-6 | REQ-112 · UC-34 | `wp-admin/includes/upgrade.php:80`, `wp-admin/includes/schema.php:159` |
| US-7 | REQ-111 · UC-34 · `domain.md §2.6` (A4) · `domain.md §2.6` (A8) | `wp-admin/update-core.php:22`, `wp-admin/update-core.php:845`, `wp-admin/update-core.php:1062` (+2) |
| US-8 | REQ-113 · UC-35 · `domain.md §2.6` (A1) · `domain.md §2.6` (A2) · `domain.md §2.6` (A3) | `wp-admin/includes/class-wp-automatic-updater.php:195`, `wp-admin/includes/class-wp-automatic-updater.php:210`, `wp-admin/includes/class-core-upgrader.php:288` (+1) |
| US-9 | REQ-114 · UC-35 · `domain.md §2.6` (A5) · `domain.md §2.6` (A6) | `wp-admin/includes/class-wp-automatic-updater.php:815`, `wp-admin/includes/class-wp-automatic-updater.php:854`, `wp-admin/includes/class-core-upgrader.php:326` |
| US-10 | REQ-115 · UC-35 · `domain.md §2.6` (A7) · `domain.md §2.6` (A6) | `wp-admin/includes/class-wp-automatic-updater.php:313`, `wp-admin/includes/class-wp-automatic-updater.php:861`, `wp-admin/includes/class-wp-automatic-updater.php:235` |
| US-11 | REQ-116 · UC-34 · UC-35 · `domain.md §2.6` (A5) | `wp-admin/includes/update-core.php:1922`, `wp-admin/update-core.php:1062`, `wp-admin/includes/class-wp-automatic-updater.php:815` |
| US-12 | REQ-117 · UC-36 · `domain.md §2.6` (A10) · `domain.md §2.6` (A11) · `domain.md §2.6` (A12) | `wp-includes/class-wp-recovery-mode.php:92`, `wp-includes/class-wp-recovery-mode.php:168`, `wp-includes/class-wp-recovery-mode.php:206` (+3) |
| US-13 | REQ-118 · UC-36 | `wp-includes/class-wp-recovery-mode.php:261`, `wp-includes/class-wp-recovery-mode-key-service.php:91`, `wp-login.php:78` |
| US-14 | REQ-119 · UC-37 | `wp-admin/site-health.php:47`, `wp-admin/includes/class-wp-site-health.php:182`, `wp-admin/includes/class-wp-site-health.php:1740` (+2) |
| fora de escopo: REQ-121 | REQ-121 · UC-33 | `wp-includes/capabilities.php:609`, `wp-includes/capabilities.php:636` |
