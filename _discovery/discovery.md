---
gerado_por: agentic-squad
gerado_em: 2026-10-07T04:19:38Z
esquema: 1
hash: 57bb2829b9690ce00b50af0ceff7e7fe7b99d70780ea3370c3bcfea741d9454a
---

# Discovery

## Objetivo

Este projeto constrói um porte do núcleo do WordPress 7.1.2 para TypeScript, com comportamento observável idêntico ao do legado, partindo de instalação nova e sem dado a migrar. O que se entrega continua sendo um CMS instalável no servidor do próprio dono — não SaaS, não biblioteca, não serviço gerenciado — e ele existe para reduzir a quase zero o custo de ter, manter e evoluir um site com conteúdo próprio, para quem não programa. Além de quem publica e de quem lê, o porte serve a um público de primeira classe que não é "usuário avançado": o desenvolvedor de plugin e tema, para quem existem os 3.373 pontos de gancho. Para quem constrói, o alvo entregue é o contrato do que será construído num projeto novo e vazio: não é código e não descreve o sistema velho. O critério de sucesso é comportamental e não estético — reproduzir o comportamento observável do sistema analisado, inclusive quando ele parecer defeito, e divergir só com decisão humana registrada e citada no código. A conferência é a comparação caso a caso contra uma instalação executável do legado na mesma versão, levantada como oráculo.

> “um porte do núcleo para TypeScript, com comportamento observável idêntico, partindo de instalação nova, sem dado a migrar.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:4`

> “O tipo de produto é CMS instalável em servidor do próprio dono — não SaaS, não biblioteca,
não serviço gerenciado”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:5`

> “Reduzir a quase zero o custo de ter, manter e evoluir um site com conteúdo próprio,
para quem não programa.”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:7`

> “Público de primeira classe, não "usuário avançado": é para ele que existem os 3.373 hooks”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:9`

> “Ele não é código e não descreve o sistema velho: descreve o sistema a construir”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:3`

> “reproduza o comportamento observável do sistema analisado, inclusive
quando ele parecer defeito. Divergir exige uma decisão humana registrada, citada no
código que divergiu.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:6`

> “Levantar uma instalação executável do legado, na MESMA versão, como referência de comparação.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:106`



## Descrição

O sistema de origem é um monolito PHP de 634.999 linhas em 71 módulos, com um único componente fortemente conexo de 68 deles, 18 tabelas com 59 índices, zero chave estrangeira e zero transação. Não há instalação real, banco de produção nem extensão de terceiro a observar: o alvo do porte é o WordPress em si, baixado limpo da distribuição oficial, e o default do código é a especificação. O escopo está fechado em 151 cards selecionados de um backlog de 181, que viraram 15 features com 136 histórias de usuário e 621 critérios de aceite. A linguagem alvo está nomeada e os 17 slots de tecnologia não estão decididos: são pesquisa, com um candidato recomendado por slot, e quem define é quem constrói. A arquitetura escolhida aplica portas e adaptadores a cinco bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa os pontos de extensão explicitamente fora, porque eles são o produto. Fica de fora: os 30 cards que não estão na coluna pronto; a reimplementação do serviço externo de reputação, que é extensão empacotada e não núcleo; e, na prática, a rede multisite, que segue no escopo como capacidade do produto mas não tem nada a construir neste pacote.

> “Porte do núcleo do WordPress 7.1.2 para TypeScript com comportamento observável idêntico: 1.467 arquivos PHP, 634.999 linhas, 71 módulos num único componente fortemente conexo de 68, 109 front controllers, 18 tabelas com 59 índices, zero chave estrangeira e zero transação.”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`

> “Não existe instalação real, e isso não é limitação: o alvo do porte é o WordPress em si, baixado limpo da distribuição oficial. O default do código É a especificação”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:13`

> “| cards selecionados (coluna `pronto`) | 151 |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:5`

> “A linguagem está nomeada (TypeScript, pela resposta 15), e os 17 slots de `refactor/tech-stack.json` **não estão decididos**: são pesquisa, com um candidato recomendado por slot e a razão dele.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:9`

> “A arquitetura escolhida aplica portas e adaptadores a 5 bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa `hooks-e-plugin-api` explicitamente fora, porque os 2.460 pontos de interceptação que devolvem valor são o produto.”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`

> “Os 30 cards abaixo **não** entraram no pacote, porque não estão na coluna `pronto`.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:15`

> “Akismet é extensão empacotada, não núcleo.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:87`

> “`012-rede-multisite` aparece em quarto lugar por não ter dependência, e não tem nada a construir”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:13`



## Personas

### Visitante

Lê o site público e comenta sem ter conta; não aparece em papel algum porque sua autorização não é capacidade.

**Quer resolver:** Encontrar e ler o conteúdo publicado, abrir o que está protegido por senha e comentar sem precisar de conta.

- O atestado de senha de conteúdo é um cookie de 10 dias, sem verificação de idade no servidor e sem limite de tentativa.
- A imagem de quem comenta vem de um serviço externo que recebe o endereço de e-mail em forma de resumo criptográfico.

> “lê o site sem conta. Não aparece em papel algum porque sua autorização não é capacidade: é a visibilidade do conteúdo, a senha de post e a chave de confirmação”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Manter o atestado atual: cookie de 10 dias, sem verificação de idade no servidor e sem limite de tentativa.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:56`

> “US-18 (REQ-180) serve a imagem de quem comenta sem enviar o dado dele a terceiro, e no legado essa imagem vem de um serviço externo que recebe o endereço de e-mail em forma de resumo criptográfico.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:51`


### Assinante

Tem conta e só a capacidade de leitura; existe para ter identidade, não para produzir — entra no sistema, cuida do próprio perfil e gera senha de aplicação.

**Quer resolver:** Entrar, recuperar a própria senha quando a perde e emitir credencial para uso não interativo.

- A mensagem de erro distingue conta inexistente de senha incorreta e nomeia o login ou e-mail tentado, o que permite enumerar contas.
- Trocar a senha não revoga nada: o registro do token sobrevive e acumula, e as senhas de aplicação sobrevivem à troca.
- A credencial de aplicação não tem escopo nem prazo e vale exatamente o que a conta vale.

> “tem conta e só `read`. Existe para ter identidade, não para produzir: entra no sistema, cuida do próprio perfil e gera senha de aplicação”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “A enumeração de contas fica registrada como divergência herdada, para a implantação decidir — não para o porte corrigir.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:44`

> “mas nada é revogado, o registro do token sobrevive em `usermeta` e acumula, e as senhas de aplicação sobrevivem à troca.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:50`

> “A credencial de aplicação do legado não tem escopo nem prazo e vale exatamente o que a conta vale”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:32`


### Colaborador

Escreve e apaga o próprio rascunho; não publica e não envia arquivo.

**Quer resolver:** Escrever e submeter o próprio conteúdo para revisão de quem publica.

- Nada no pacote especifica o registro de quem decidiu cada transição de estado editorial, então a cadeia editorial existe e não é auditável.
- O card que sanitiza o corpo do conteúdo na gravação não entrou no pacote, e quem construir a autoria decide a sanitização sozinho.

> “escreve e apaga o próprio rascunho. Não publica e não envia arquivo”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Sem ele, a cadeia editorial existe e não é auditável.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:47`

> “Quem construir US-1 a US-8 sem REQ-030 decide a sanitização sozinho.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:47`


### Autor

Publica e apaga o próprio conteúdo, e envia arquivo de mídia.

**Quer resolver:** Publicar, agendar e classificar o próprio conteúdo, enviar e editar imagem, e usar a lixeira para desfazer um descarte.

- A exclusão de mídia é definitiva, sem lixeira e sem aviso — assimetria com o conteúdo que o usuário não espera.
- A falha ao processar imagem é silenciosa nos cinco pontos do processamento.
- Não está decidido se o sufixo do arquivo reduzido na ingestão, que aparece no endereço público, é contrato.

> “publica e apaga o próprio conteúdo, e envia arquivo”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “A exclusão de mídia continua definitiva, sem lixeira e sem aviso.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:62`

> “a regra M4 do domínio registra que no legado ela é silenciosa nos cinco pontos do processamento”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:43`

> “Ninguém decidiu se o sufixo é contrato.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:43`


### Editor

Manda em todo o conteúdo, de qualquer autor, modera comentário e tem o privilégio de marcação bruta.

**Quer resolver:** Revisar e publicar conteúdo de outro autor, gerenciar os termos de classificação e esvaziar a fila de moderação.

- O atalho de confiança do autor e de quem modera sob a mesma sanitização ficou bloqueado e não entrou no pacote.
- O serviço externo de reputação que hoje julga spam saiu do núcleo clonado, e o que resta é a cascata local mais um ponto de extensão.

> “manda em todo o conteúdo, de qualquer autor, e modera comentário. Tem `unfiltered_html`”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “US-4 constrói a cascata cujo primeiro passo é exatamente esse atalho, sem que nada no pacote diga qual sanitização se aplica a quem entra por ele.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:51`

> “O que o porte preserva é o NÚCLEO: a cascata de moderação por palavra, link e autor conhecido, e o ponto de extensão que permite a um classificador externo entrar.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:87`


### Administrador

É o dono da instalação: configuração, usuário, tema, plugin, arquivo e atualização do próprio software.

**Quer resolver:** Manter a instalação de pé e atualizada sozinho, sem equipe de infraestrutura, operando tudo pelo painel.

- Pacote sem assinatura verificada é instalado, com a verificação rebaixada a aviso e o caso "sem assinatura" silenciado fora do modo de depuração.
- Um site sem visita nunca executa a própria limpeza, porque a fila só avança por requisição ao próprio host, sem log.
- Treze canais de saída nascem em http:// e sete repetem a chamada em claro quando o TLS falha, inclusive o de somas de verificação.
- A tela de diagnóstico calcula na hora e não armazena nada, então não há como comparar a evolução entre visitas.

> “é o dono da instalação: configuração, usuário, tema, plugin, arquivo e atualização do próprio software”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Manter a tolerância: pacote sem assinatura verificada é instalado.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:75`

> “a consequência observável de que um site sem visita nunca executa a própria limpeza É comportamento do WordPress, não acidente”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:68`

> “Manter o rebaixamento automático para HTTP quando o TLS falhar, com os 13 canais nascendo em `http://` e os 7 que repetem em claro.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:81`

> “A regra registrada no próprio card diz que a tela do legado calcula na hora e não armazena nada.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:55`


### Super administrador de rede

Só existe em multisite, reconhecido por nome de login numa lista de rede; recebe tudo menos o negado explicitamente.

**Quer resolver:** Supervisionar os sites da rede e o cadastro de novos sites e contas.

- No legado, rede não tem modo de recuperação.
- Os 12 cards que especificariam a rede ficaram fora da seleção, então a feature de multisite não tem nada a construir.
- O vínculo entre conta e site mora dentro do nome da chave do metadado de autorização, e nenhuma história do pacote carrega essa regra.

> “só existe em multisite, e por nome de login numa lista de rede. Recebe tudo menos o negado explicitamente”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “No legado, rede **não tem modo de recuperação**.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:31`

> “o único card de EP-12 na seleção é um descarte, e os 12 que especificariam a rede ficaram fora”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:13`

> “Nenhuma história deste pacote carrega essa regra, e ela é a decisão mais consequente de um porte de rede.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:38`


### Titular de dados pessoais

A pessoa cujos dados a solicitação de privacidade trata; autoriza por chave com hash de 24 horas, nunca por capacidade.

**Quer resolver:** Confirmar o próprio pedido de exportação ou apagamento e receber o resultado.

- O arquivo de exportação fica acessível por endereço com chave durante três dias, sem verificação de identidade.
- A chave de confirmação é guardada no mesmo campo em que o conteúdo guarda senha em texto claro.

> “a pessoa cujos dados a solicitação de privacidade trata. Autoriza por chave com hash de 24 horas, nunca por capacidade”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “No legado o arquivo fica acessível por endereço com chave durante três dias, sem verificação de identidade”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:53`

> “A chave de confirmação é guardada com resumo criptográfico no mesmo campo em que o conteúdo guarda senha em texto claro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:53`


### Desenvolvedor de plugin e tema

Público de primeira classe do produto, e não "usuário avançado": é para ele que existem os 3.373 pontos de gancho, e a pasta de conteúdo é a única tratada como substituível.

**Quer resolver:** Estender e alterar o comportamento do sistema sem tocar no núcleo e sem fork.

- O fluxo de execução real de uma requisição não é determinável estaticamente, porque qualquer plugin pode interceptar, reordenar ou cancelar qualquer etapa.
- O card que declararia os pontos de extensão com contrato explícito ficou bloqueado e não entrou no pacote.
- A ordem de carregamento é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona.

> “Público de primeira classe, não "usuário avançado": é para ele que existem os 3.373 hooks”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:9`

> “o fluxo de execução real de uma requisição **não é determinável estaticamente**, porque qualquer plugin pode interceptar, reordenar ou cancelar qualquer etapa”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:26`

> “| REQ-162 | Declarar os pontos de extensão com contrato explícito | EP-15 | `bloqueado` | não está na coluna `pronto` |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:17`

> “em D1 ela é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`


### Cliente não interativo

Programa que chama a API REST ou o XML-RPC, autenticando por cookie, senha de aplicação ou credencial no corpo da chamada.

**Quer resolver:** Ler e escrever conteúdo do site por programa, sem passar pelo painel.

- A camada de rotas falha aberta: rota sem declaração de permissão funciona e só emite aviso de uso indevido.
- O card que autentica chamada não interativa por credencial de aplicação não entrou no pacote, embora a emissão da credencial tenha entrado.

> “programa que chama /wp-json ou xmlrpc.php, autenticando por cookie, senha de aplicação ou credencial no corpo da chamada”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:13`

> “A camada de rotas falha **aberta**: rota sem declaração de permissão funciona e só emite
aviso de uso indevido”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:23`

> “US-10 (REQ-011) emite e revoga credencial de aplicação, mas quem autentica com ela é REQ-012, que ficou na coluna `refinamento` e não entrou neste pacote.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:32`


### Agente de IA

Consumidor da Abilities API, desenhada para ele; as abilities são contrato para agente externo, com callback de permissão próprio e filtrável.

**Quer resolver:** Executar operação nomeada do sistema por contrato declarado, sem passar por tela.

- O tempo limite herdado do cliente genérico é de 5 s, curto demais para geração de texto.
- A execução de operação nomeada pode ser curto-circuitada antes de qualquer validação, e não está decidido se esse caminho entra no porte.

> “consumidor da Abilities API, desenhada para ele.”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:13`

> “definir o tempo limite no adaptador PSR-18 em vez de herdar o default de 5 s de `wp_remote_request`, que é curto demais para geração”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:118`

> “REQ-143 especifica a execução e não diz se o curto-circuito entra.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:57`



## Requisitos

- **[funcional]** A autenticação aceita login ou endereço de e-mail com a mesma senha, e os dois caminhos chegam ao mesmo registro de conta.

> “CA-1.2 O mesmo par de credenciais funciona informando o login ou o endereço de e-mail, e os dois caminhos chegam ao mesmo registro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:9`


- **[funcional]** A senha é conferida contra o hash guardado, e a senha em texto não é gravada em lugar algum.

> “CA-1.3 A senha é conferida contra o hash guardado; a senha em texto não é gravada em lugar algum”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:9`


- **[funcional]** Uma chave de redefinição de senha pendente deixa de valer no primeiro acesso bem-sucedido.

> “CA-1.4 Uma chave de redefinição de senha pendente deixa de valer no primeiro acesso bem-sucedido”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:9`


- **[funcional]** A sessão vale 2 dias sem "lembrar de mim" e 14 dias com, e há 12 horas de carência após o prazo durante as quais a sessão ainda é aceita.

> “U5 — sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:22`

> “CA-3.3 Há 12 horas de carência após o prazo, durante as quais a sessão ainda é aceita”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:20`


- **[funcional]** Passada a carência, a requisição é tratada como anônima e a autenticação é exigida de novo.

> “CA-3.4 Passada a carência, a requisição é tratada como anônima e a autenticação é exigida de novo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:20`


- **[funcional]** A chave de redefinição de senha é guardada com hash na conta, o valor em claro só existe no e-mail enviado, e chave com mais de 24 horas é recusada com aviso de prazo vencido.

> “CA-4.1 A chave é guardada com hash na conta e o valor em claro só existe no e-mail enviado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:27`

> “CA-4.2 Chave com mais de 24 horas é recusada com aviso de prazo vencido e oferta de pedir outra”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:27`


- **[funcional]** O cadastro aberto nasce desligado; desligado, o formulário não é oferecido e a ação é recusada.

> “CA-6.1 O cadastro aberto nasce desligado; desligado, o formulário não é oferecido e a ação é recusada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`


- **[funcional]** Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso.

> “CA-6.2 Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`


- **[funcional]** A conta criada por cadastro aberto recebe o papel padrão de menor poder e nenhuma senha definida pelo titular, que recebe por e-mail um caminho válido por 24 horas para definir a senha.

> “CA-6.4 A conta criada recebe o papel padrão de menor poder e nenhuma senha definida pelo titular”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`

> “CA-6.5 O titular recebe por e-mail um caminho para definir a senha, válido por 24 horas”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`


- **[funcional]** Nenhuma decisão de autorização compara nome de papel: toda pergunta de permissão é feita sobre capacidade, e a definição dos papéis é dado gravado que o sistema sabe reescrever.

> “nenhuma decisão de autorização compara nome de papel. Toda pergunta de
permissão é feita sobre capacidade, e a definição dos papéis é dado gravado que o
sistema sabe reescrever.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:17`


- **[funcional]** As quatro capacidades que o código exige e que não estão em papel algum (`install_languages`, `resume_plugins`, `resume_themes`, `view_site_health_checks`) são declaradas explicitamente.

> “Incluir explicitamente as 4 capacidades que só existem por filtro e não estão em papel nenhum (`install_languages`, `resume_plugins`, `resume_themes`, `view_site_health_checks`)”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:25`


- **[restricao]** A matriz papel por capacidade de fábrica, derivada das oito funções de povoamento, é a matriz real, e o porte reproduz a mutabilidade do papel em vez de congelar a matriz.

> “Assumir a matriz de fábrica como a matriz real.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:37`

> “o porte precisa reproduzir a mutabilidade, não congelar a matriz”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:37`


- **[restricao]** A mensagem de erro de autenticação continua distinguindo conta inexistente de senha incorreta, com os quatro códigos de erro e o texto nomeando o login ou e-mail tentado.

> “Manter a distinção entre conta inexistente e senha incorreta, com os quatro códigos de erro e o texto nomeando o login ou e-mail tentado.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:44`


- **[restricao]** Trocar a senha invalida o cookie antigo mas não revoga nada, e as funções de encerramento de sessão são portadas definidas e sem nenhum chamador.

> “`wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` são portadas definidas e sem chamador, como estão hoje”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:50`


- **[restricao]** O atestado de senha de conteúdo continua sendo um cookie de 10 dias, sem verificação de idade no servidor e sem limite de tentativa.

> “Manter o atestado atual: cookie de 10 dias, sem verificação de idade no servidor e sem limite de tentativa.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:56`


- **[restricao]** A exclusão de mídia é definitiva, sem lixeira e sem aviso.

> “A exclusão de mídia continua definitiva, sem lixeira e sem aviso.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:62`


- **[funcional]** A lixeira retém o conteúdo por 30 dias, e desligar a lixeira torna apagar irreversível.

> “30 dias de lixeira, e desligar a lixeira torna
apagar irreversível”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:33`


- **[restricao]** A fila agendada continua sendo uma lista em `wp_options` disparada por requisição não bloqueante ao próprio host, preservadas a trava de 60 s do disparo da fila e a de 5 min da leitura da caixa postal.

> “Manter o disparo por requisição ao próprio host.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:68`

> “Preservar também a trava de 60 s do `wp-cron.php` e a de 5 min do `wp-mail.php`.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:68`


- **[restricao]** Pacote de atualização sem assinatura verificada é instalado, com a verificação rebaixada a aviso e o caso "sem assinatura" silenciado fora do modo de depuração.

> “Portar inclusive o modo de falha do ADR-0010 (verificação rebaixada a aviso, caso 'sem assinatura' silenciado fora de `WP_DEBUG`).”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:75`


- **[restricao]** Os 13 canais de saída nascem em `http://` e os 7 que repetem a chamada em claro continuam repetindo quando o TLS falha.

> “Manter o rebaixamento automático para HTTP quando o TLS falhar, com os 13 canais nascendo em `http://` e os 7 que repetem em claro.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:81`


- **[funcional]** O XML-RPC, o editor de arquivos do painel e o canal assíncrono `admin-ajax.php` são portados com o comportamento atual, inclusive o pingback.

> “Portar as três com o comportamento atual, inclusive o `pingback`.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:93`


- **[funcional]** A rede multisite é portada como capacidade do produto, com subdiretório como modo padrão de instalação e subdomínio suportado.

> “Manter EP-12 no escopo como CAPACIDADE do produto, com subdiretório como modo padrão de instalação e subdomínio suportado.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:31`


- **[restricao]** O vínculo entre conta e site continua observável dentro do nome da chave de metadado, ainda que o armazenamento seja normalizado por baixo.

> “O vínculo conta↔site dentro do nome da `meta_key` é regra observável: preservar o comportamento, ainda que o armazenamento seja normalizado por baixo.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:31`


- **[funcional]** O cliente de IA, os três conectores (`anthropic`, `google`, `openai`) e a Abilities API são portados como o núcleo os traz, e nenhum provedor entra no escopo.

> “Portar o cliente de IA, os três conectores (`anthropic`, `google`, `openai`) e a Abilities API como o núcleo os traz”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:118`

> “Nenhum provedor entra no escopo”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:118`


- **[funcional]** O tempo limite do adaptador PSR-18 do cliente de IA é definido no adaptador em vez de herdar o default de 5 s, e esta é uma divergência autorizada que deve ser citada no código.

> “Uma exceção explícita à regra do idêntico: definir o tempo limite no adaptador PSR-18 em vez de herdar o default de 5 s de `wp_remote_request`, que é curto demais para geração.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:118`


- **[nao-funcional]** Nenhuma superfície de entrada tem limite de taxa; os dois únicos freios são as travas de tempo de 60 s e de 5 min, e o limite de taxa fica declarado como decisão de implantação, fora do núcleo.

> “Limite de taxa fica declarado como decisão de IMPLANTAÇÃO, fora do núcleo, para não inventar número que o produto nunca teve.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:125`


- **[nao-funcional]** O núcleo portado não declara prazo de retenção nenhum, e a rotina de descarte do registro de cadastro é configurável, não embutida.

> “O núcleo não declara prazo de retenção nenhum, e portá-lo idêntico é não inventar um.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:131`

> “manter o comportamento e registrar como obrigação de LGPD/GDPR que a IMPLANTAÇÃO assume, com a rotina de descarte configurável, não embutida”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:131`


- **[nao-funcional]** Todo prazo, contagem e limite vive num ponto de configuração nomeado com o valor de fábrica do legado, e existe teste que afirma o valor e o efeito da borda.

> “cada número vive num ponto de configuração nomeado, com o valor de
fábrica do legado, e existe teste que afirma o valor e o efeito da borda”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:34`


- **[nao-funcional]** Para cada cascata catalogada no ERD existe um teste que apaga o registro pai e afirma o conjunto exato do que sumiu e do que permaneceu, inclusive o que permaneceu órfão.

> “para cada cascata catalogada no ERD, um teste apaga o registro pai e
afirma o conjunto exato do que sumiu e do que permaneceu, inclusive o que permaneceu
órfão.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:29`


- **[restricao]** Nenhuma chave estrangeira declarada no modelo novo pode mudar o que é observável na cascata de apagamento.

> “qualquer chave que o modelo novo declare não pode mudar o que é observável”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:19`


- **[funcional]** A contagem de usuários mantém a variante aproximada, como o legado a define.

> “Manter `count_users` com a variante aproximada, como o legado a define.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:19`


- **[nao-funcional]** O inventário de pontos de extensão é artefato versionado, com nome, argumentos e ordem, e existe teste que verifica que cada ponto documentado dispara com os argumentos declarados, na posição declarada do fluxo.

> “o inventário de pontos de extensão é artefato versionado, com nome,
argumentos e ordem. Existe teste que, para cada ponto documentado, verifica que ele
dispara, com os argumentos declarados, na posição declarada do fluxo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:14`


- **[nao-funcional]** Toda operação exposta nova nasce com declaração explícita de permissão, e a revisão recusa o registro sem ela.

> “Toda operação exposta
nova nasce com declaração explícita de permissão, e a revisão recusa o registro sem ela.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:24`


- **[nao-funcional]** O registro de log acrescentado é só escrita: nenhuma ramificação do código testa o resultado de escrever log.

> “o registro acrescentado é só escrita: nenhuma ramificação do código
testa o resultado de escrever log.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:39`


- **[restricao]** Nenhuma função, constante, tabela, rota, superfície ou comportamento publicado é removido, e toda remoção tem uma linha no registro de descartes apontando para a resposta ou o ADR que a autorizou.

> “não remova função, constante, tabela, rota, superfície nem comportamento
publicado. Retrocompatibilidade é restrição absoluta, não cortesia.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:42`

> “toda remoção tem uma linha no registro de descartes, apontando para a
resposta ou o ADR que a autorizou.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:45`


- **[restricao]** Toda divergência de comportamento observável tem, no código, referência à resposta de `questions.md` ou ao ADR que a autorizou, sob pena de recusa na revisão.

> “toda divergência de comportamento observável tem, no código, uma
referência à resposta de `questions.md` ou ao ADR que a autorizou.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:9`


- **[restricao]** A linguagem alvo é TypeScript e essa escolha não é reaberta pelo projeto.

> “essa troca **já foi decidida** — pelas respostas de `_reversa_sdd/questions.md`, não por esta etapa”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:10`


- **[restricao]** Os 17 slots de tecnologia do plano são pesquisa, não escolha: quem define é quem constrói.

> “Quem define é quem constrói.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:9`


- **[funcional]** O lado cliente é construído a partir do repositório de origem `github.com/WordPress/wordpress-develop`, com os pacotes do Gutenberg, cravando a mesma versão.

> “Obter o repositório de origem e construir o lado cliente a partir dele: `github.com/WordPress/wordpress-develop`, com os pacotes do Gutenberg.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:100`


- **[nao-funcional]** Uma instalação executável do legado na mesma versão é levantada como oráculo, e a conferência de equivalência é a comparação caso a caso contra ela.

> “O ambiente de referência é o oráculo contra o qual o porte se compara, caso a caso.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:106`


- **[funcional]** As specs dos 15 módulos sem spec são escritas antes de qualquer trabalho de porte, começando pelos cinco mais dependidos: camada de dados, arranque, formatação e escape, núcleo utilitário e telas do painel.

> “Autorizado: rodar o writer para os 15 módulos, começando pelos 5 mais dependidos.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:138`

> “É a maior lacuna estrutural da entrega e precisa ser fechada antes de qualquer trabalho de porte.”
> — run_muvp9wahprbsns/_reversa_sdd/questions.md · `ex:5745fc43:138`


- **[funcional]** O produto é entregue com ao menos um tema completo.

> “US-15 (REQ-176) exige entregar ao menos um tema completo junto com o produto.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:61`


- **[restricao]** O agente de codificação para e registra a pergunta, em vez de decidir, diante de mudança de regra de negócio documentada, remoção de contrato público, conflito entre card de descarte e resposta humana, número novo, assinatura obrigatória de pacote, cifra obrigatória de canal, mudança de cascata observável, escolha de slot de tecnologia ou mudança da ordem de carregamento do arranque.

> “O que o agente de codificação **não** decide sozinho. Em qualquer destes casos ele para,
registra a pergunta e espera decisão humana:”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:48`


- **[restricao]** A ordem de construção das 15 features segue a ordem topológica das dependências dos cards, e os conflitos das features 005, 010, 011, 013 e 014 são resolvidos antes de tocá-las.

> “**Resolva os conflitos da seção 5 antes de tocar nas features 005, 010, 011, 013 e 014.**”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:9`



## O que o material não diz

- Quem resolve os 21 conflitos entre a seleção do backlog e as 23 respostas humanas? Seis deles são histórias obrigatórias (REQ-052, REQ-107, REQ-122, REQ-124, REQ-125, REQ-149), e construir qualquer um dos dois lados joga fora o trabalho do outro.
- Os 12 cards restantes de EP-12 voltam à seleção para que a feature de rede multisite exista de verdade, agora que a resposta 4 destravou REQ-129?
- Os 12 cards já destravados por resposta humana posterior ao backlog (entre eles REQ-004, REQ-008, REQ-032, REQ-044, REQ-051, REQ-094, REQ-160, REQ-177) voltam à seleção, ou ficam fora?
- Qual tecnologia é escolhida em cada um dos 17 slots do plano — runtime, isolamento de estado por requisição, persistência, serialização, cache, cliente HTTP, sistema de arquivos, e-mail, hash de senha, imagem, HTML, tradução, XML, testes, observabilidade e entrega?
- A matriz declarada de capacidades deve crescer até cobrir as 93 capacidades verificadas no código, ou o critério CA-9.4 deve ser reescrito para as que têm responsável?
- Se a instalação executável de referência mostrar matriz papel por capacidade diferente da derivada simbolicamente das oito funções de povoamento, qual das duas vale como oráculo?
- O porte dá escopo e prazo à credencial de aplicação, ou ela continua valendo exatamente o que a conta vale?
- Qual sanitização se aplica ao corpo do conteúdo na gravação, já que REQ-030 não entrou no pacote e o privilégio de marcação bruta está também no papel de editor?
- A junção de classificação continua polimórfica por convenção, ou é presa ao registro de conteúdo?
- A contagem de uso de cada termo continua sendo valor gravado — podendo divergir — ou passa a ser recalculada na leitura?
- O sufixo no nome do arquivo de imagem reduzido na ingestão, que aparece no endereço público, é contrato?
- O protocolo de requisição ao próprio site, implementado quatro vezes no legado, é unificado ou portado quatro vezes?
- O curto-circuito da execução de operação nomeada, que contorna toda a validação, entra no porte?
- A chave de confirmação de solicitação de dados pessoais e a senha de conteúdo continuam no mesmo campo, com significados diferentes por tipo de registro, ou são separadas?
- Qual é o formato declarado de intercâmbio de conteúdo (REQ-120), que é o caminho pelo qual uma instalação legada entraria no sistema novo?
- Qual dos três temas empacotados é o tema de referência do porte, e os três entram?
- Qual é o formato declarado de armazenamento do corpo do conteúdo em blocos (REQ-032), e o card volta à seleção antes de a feature de autoria começar?
- A ausência do lado JavaScript nesta árvore é recorte deliberado do dataset ou a distribuição está incompleta?
- A invariante não declarada entre dois arquivos, de que depende o destravamento da atualização congelada (US-11 / REQ-116), não está escrita em nenhum artefato — onde ela é lida?
- Quem são os operadores e o público de uma instalação real deste produto, quantos usuários existem e quais papéis estão de fato em uso? Nada no material diz, porque o alvo é o CMS e não um site.
- O produto portado aceita silêncio em caminho de erro (REQ-159 exige que nenhum seja silencioso por omissão, e as respostas 11 e a regra M4 mandam preservar três silêncios estruturais)?
- Quem assume a obrigação de LGPD/GDPR do registro de cadastro em rede, que acumula IP e e-mail sem prazo, e com que rotina de descarte?
