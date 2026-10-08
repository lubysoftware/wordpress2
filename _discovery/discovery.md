---
gerado_por: agentic-squad
gerado_em: 2026-10-08T10:59:19Z
esquema: 1
hash: 2b9c955503133a787d10be0fb9f3074573b4a1672e8f32ce58e50857a30c070c
---

# Discovery

## Objetivo

O projeto tem de entregar um porte do núcleo do WordPress 7.1.2 para TypeScript com comportamento observável idêntico, partindo de instalação nova e sem dado a migrar. O produto reconstruído é um CMS instalável no servidor do próprio dono — não SaaS, não biblioteca, não serviço gerenciado — e o seu objetivo de negócio é reduzir a quase zero o custo de ter, manter e evoluir um site com conteúdo próprio, para quem não programa. Ele serve, no mesmo processo, três públicos: quem lê o site público, quem opera o painel administrativo e quem estende o produto com plugin ou tema, e este último é público de primeira classe, não usuário avançado. O alvo não é modernização nem redesenho: o pacote de especificação é o contrato do que será construído, com cada afirmação rastreada até o card, o caso de uso e o arquivo do legado que a sustentam, e a prova de pronto é a comparação contra uma instalação de referência na mesma versão, usada como oráculo.

> “um porte do núcleo para TypeScript, com comportamento observável idêntico, partindo de instalação nova, sem dado a migrar.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:4`

> “O tipo de produto é CMS instalável em servidor do próprio dono — não SaaS, não biblioteca,”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:5`

> “Reduzir a quase zero o custo de ter, manter e evoluir um site com conteúdo próprio,”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:7`

> “três coisas: o site público, um painel administrativo de ~100 telas e uma plataforma de”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:5`

> “Público de primeira classe, não "usuário avançado": é para ele que existem os 3.373 hooks”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:9`

> “Ele não é código e não descreve o sistema velho: descreve o sistema a construir, com cada afirmação rastreada até o card, o caso de uso e o arquivo do legado que a sustentam.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:3`

> “uma instalação de referência na mesma versão é o oráculo de comparação (Pergunta 16)”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`



## Descrição

O problema é que o sistema a clonar não tem especificação executável: a árvore analisada tem zero arquivo de teste, logo não existe rede de segurança, e nenhum dos 47 casos de uso foi observado em execução — não há banco, conteúdo, log nem configuração nela. O escopo é o pacote de especificação com 15 features, 136 histórias de usuário, 621 critérios de aceite e 301 tarefas, derivadas de 151 cards selecionados num backlog de 181. A arquitetura escolhida é portas e adaptadores em cinco bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa o barramento de hooks explicitamente fora, porque os pontos de interceptação são o produto. A linguagem está nomeada; os 17 slots de tecnologia não estão decididos, e quem define é quem constrói. Fica de fora a rede multisite, cuja feature continua vazia e não especifica nada de rede; fica de fora o limite de taxa, de modo que o produto portado nasce sem limite em superfície alguma; e fica de fora o lado cliente em JavaScript, ausente desta árvore e a ser obtido do repositório de origem.

> “Zero arquivos de teste em 3.381: não existe rede de segurança executável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:17`

> “Nenhum dos 47 casos de uso foi observado em execução: não há banco, não há conteúdo, não há log e não há configuração nesta árvore”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:17`

> “| features geradas | 15 |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:5`

> “| histórias de usuário | 136 |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:5`

> “| critérios de aceite | 621 |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:5`

> “| cards selecionados (coluna `pronto`) | 151 |”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:5`

> “A arquitetura escolhida aplica portas e adaptadores a 5 bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa `hooks-e-plugin-api` explicitamente fora, porque os 2.460 pontos de interceptação que devolvem valor são o produto.”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`

> “A linguagem está nomeada (TypeScript, pela resposta 15), e os 17 slots de `refactor/tech-stack.json` **não estão decididos**: são pesquisa, com um candidato recomendado por slot e a razão dele.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:9`

> “Enquanto ele não voltar, `012-rede-multisite` continua vazia e o pacote não especifica nada de rede.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:21`

> “o produto portado nasce sem limite de taxa em superfície alguma, exatamente como o legado, e os dois únicos freios continuam sendo travas de tempo de 60 segundos e de 5 minutos.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:40`

> “A resposta 15 manda construir a partir do repositório de origem: até isso acontecer, os critérios de borda desta história não são verificáveis contra o legado.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:36`



## Personas

### Visitante

Lê o site sem ter conta e participa da conversa pública. Não aparece em papel algum: o que o autoriza é a visibilidade do conteúdo, a senha de post e a chave de confirmação.

**Quer resolver:** Consultar o conteúdo publicado, abrir o que está protegido por senha e deixar comentário com ou sem conta.

- O atestado de senha de conteúdo não tem verificação de idade no servidor nem limite de tentativa.
- O atalho de confiança aprova sem nenhuma verificação o comentário de quem é autor do conteúdo comentado ou de quem pode moderar.
- Metade do comportamento do lado cliente não está na árvore analisada, então o que a tela oferece ao leitor não é verificável contra o legado.

> “lê o site sem conta. Não aparece em papel algum porque sua autorização não é capacidade: é a visibilidade do conteúdo, a senha de post e a chave de confirmação (permissions.md §9)”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Como visitante, quero deixar uma opinião num conteúdo do site, para participar da conversa com ou sem ter conta.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:7`

> “verificação de idade no servidor e sem limite de tentativa (resposta 8)”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:7`

> “A regra que mais surpreende é o atalho de confiança: o comentário de quem é autor do”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:4`

> “A resposta 15 manda construir a partir do repositório de origem: até isso acontecer, os critérios de borda desta história não são verificáveis contra o legado.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:36`


### Assinante (titular de conta sem poder editorial)

Tem conta e só leitura. Existe para ter identidade, não para produzir: entra no sistema, cuida do próprio perfil e gera senha de aplicação.

**Quer resolver:** Entrar, recuperar a própria senha e emitir credenciais nomeadas para que programas ajam em seu nome sem entregar a senha.

- A mensagem de erro do login distingue conta inexistente de senha errada, o que permite enumerar contas.
- Trocar a senha não revoga sessão nenhuma: o cookie antigo só deixa de validar por efeito colateral do hash, e o registro do token sobrevive e acumula.
- A credencial de aplicação não tem escopo nem prazo e vale exatamente o que a conta vale.

> “tem conta e só `read`. Existe para ter identidade, não para produzir: entra no sistema, cuida do próprio perfil e gera senha de aplicação”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Como titular de uma conta, quero emitir credenciais nomeadas para programas agirem em meu nome, para não entregar a minha senha a cada integração.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:65`

> “A mensagem de erro do login continua distinguindo conta inexistente de senha errada,”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:7`

> “Trocar a senha não revoga sessão”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:7`

> “A credencial de aplicação do legado não tem escopo nem prazo e vale exatamente o que a conta vale (`permissions.md` 8.2).”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:32`


### Colaborador

Escreve e apaga o próprio rascunho. Não publica e não envia arquivo.

**Quer resolver:** Submeter o próprio conteúdo para revisão de quem pode publicar.

- Quem não pode publicar tem o identificador de URL esvaziado enquanto o conteúdo está em revisão.
- A quantidade de regra que o legado pendura na transição de estado é quase toda invisível para quem olha a tela.

> “escreve e apaga o próprio rascunho. Não publica e não envia arquivo”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “US-7 — Submeter conteúdo próprio para revisão de quem pode publicar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:45`

> “Como colaborador, quero entregar o meu texto para que alguém com poder de publicar o avalie, para contribuir sem ter o poder de pôr no ar.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:46`

> “dispensada antes disso. E quem não pode publicar tem o identificador esvaziado enquanto”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:4`

> “A parte delicada não é gravar: é a quantidade de regra que o legado pendura na transição”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:4`


### Autor

Publica e apaga o próprio conteúdo, e envia arquivo para a biblioteca de mídia.

**Quer resolver:** Levar o próprio conteúdo ao público por ato explícito, classificá-lo, agendá-lo e ilustrá-lo com arquivos, sem perder nada pelo caminho.

- Apagar mídia é definitivo, sem lixeira e sem aviso, o que produz uma assimetria com o conteúdo que o usuário não espera.
- A falha ao gerar derivada de imagem é silenciosa em cinco pontos do processamento, todos marcados no código como registro a fazer e nenhum escrevendo linha alguma.
- O identificador na URL de um rascunho muda sozinho ao publicar, porque a unicidade é dispensada antes disso.

> “publica e apaga o próprio conteúdo, e envia arquivo”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Como autor, quero tornar o meu conteúdo visível ao público do site, para que ele passe a ser lido.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:7`

> “definitivo, sem lixeira e sem aviso, e a resposta 9 confirmou que continua assim, o que”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:4`

> “ter. E a falha ao gerar derivada é silenciosa em cinco pontos do processamento, todos”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:4`

> “identificador na URL de um rascunho muda sozinho ao publicar, porque a unicidade é”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:4`


### Editor

Manda em todo o conteúdo, de qualquer autor, e modera comentário. Tem o privilégio de marcação bruta.

**Quer resolver:** Revisar e publicar conteúdo de outro autor preservando a autoria original, manter os termos de classificação e decidir o que entra na conversa do site.

- A moderação é a área de maior densidade de regra de negócio do sistema, e a ordem de avaliação importa porque cada etapa pode encerrar a decisão.
- O fechamento automático da interação em conteúdo antigo acontece em memória, sem o registro mudar no armazenamento.
- Dois estados de comentário não são alcançáveis pela interface de moderação: só pela cascata do descarte do conteúdo.

> “manda em todo o conteúdo, de qualquer autor, e modera comentário. Tem `unfiltered_html`”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “US-8 — Revisar e publicar conteúdo de outro autor preservando a autoria original”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:52`

> “de negócio do sistema: 13 regras catalogadas em `domain.md`, e a ordem de avaliação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:3`

> “próprio e não moderação, e o fechamento automático em conteúdo antigo acontece em”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:4`

> “Esse estado de suspensão não é alcançável pela interface de moderação: só pela cascata”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:16`


### Administrador (dono da instalação)

É o dono da instalação: configuração, usuário, tema, plugin, arquivo e atualização do próprio software.

**Quer resolver:** Manter o site no ar, atualizado e diagnosticável sem equipe de infraestrutura, operando tudo pelo painel.

- Pacote sem assinatura verificada é instalado, e a falha é rebaixada a aviso.
- A coleta da lixeira só é agendada por visita autenticada ao painel, logo um site que ninguém administra nunca limpa a própria lixeira.
- Quatro capacidades que o código exige não estão em papel algum e entram só por ponto de extensão, de modo que portar lendo a matriz de papéis produz um sistema em que ninguém retoma extensão pausada.
- Nenhuma pergunta de operação tem resposta hoje: não há histórico para identificar erro recorrente, e a tela de saúde do site calcula na hora e não armazena.

> “é o dono da instalação: configuração, usuário, tema, plugin, arquivo e atualização do próprio software”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “Como administrador, quero acrescentar ou renovar um plugin ou tema do site, para mudar o que ele faz sem acesso ao servidor.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:7`

> “é instalado (resposta 11). A chamada externa é repetida em canal sem cifra quando o”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:7`

> “visita autenticada ao painel, logo um site que ninguém administra nunca limpa a própria”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:4`

> “preciso ter todas as devolvidas, não qualquer uma. E quatro capacidades que o código”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:4`

> “apenas a matriz de papéis produz um sistema em que ninguém retoma uma extensão pausada,”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:4`

> “Como responsável pela operação, quero poder responder com que frequência o site falha e em quê, porque hoje nenhuma pergunta de operação tem resposta.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:7`

> “A tela de saúde do site calcula na hora e não armazena”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:11`


### Titular de dados pessoais

A pessoa cujos dados a solicitação de privacidade trata. Autoriza por chave com hash de 24 horas, nunca por capacidade.

**Quer resolver:** Confirmar a solicitação que trata dos seus dados e receber a exportação ou o apagamento dentro de prazo declarado.

- A autorização não passa por capacidade alguma: depende de uma chave com prazo curto que, se expirar sem confirmação, encerra a solicitação.
- Exportar e apagar dado de terceiro é tratado como poder do nível mais alto da instalação, logo o titular depende inteiramente de quem administra.

> “a pessoa cujos dados a solicitação de privacidade trata. Autoriza por chave com hash de 24 horas, nunca por capacidade”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:12`

> “US-2 — Exigir confirmação do titular por chave com prazo declarado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:13`

> “US-4 — Expirar solicitação não confirmada, apagando a chave no mesmo comando”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:27`

> “US-8 — Tratar exportar e apagar dado de terceiro como poder do nível mais alto da instalação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:55`


### Desenvolvedor de plugin ou tema

Público de primeira classe do produto, e não usuário avançado: é para ele que existem os pontos de gancho, e é o motor da economia de extensões em torno do produto.

**Quer resolver:** Estender o comportamento do sistema sem modificar o núcleo, contando com nome, argumentos e ordem de disparo estáveis em cada ponto de extensão.

- A ordem de carregamento é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona.
- O fluxo de execução real de uma requisição não é determinável estaticamente, porque qualquer plugin pode interceptar, reordenar ou cancelar qualquer etapa.
- Renomear ou remover um ponto de extensão quebra código de terceiro que o núcleo nem sabe que existe.

> “Público de primeira classe, não "usuário avançado": é para ele que existem os 3.373 hooks”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:9`

> “**Princípio:** preserve cada ponto de extensão com o nome, os argumentos, a ordem de”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:12`

> “Mudar a ordem de carregamento do arranque | em D1 ela é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`

> “não é determinável estaticamente**, porque qualquer plugin pode interceptar, reordenar ou cancelar qualquer etapa.”
> — run_muvp9wahprbsns/_reversa_sdd/soul.md · `ex:f4383acd:26`

> “sabe que existe.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:13`


### Cliente não interativo e agente de IA

Programa que chama a superfície HTTP de dados ou a superfície herdada, autenticando por cookie, senha de aplicação ou credencial no corpo da chamada; o agente de IA é o consumidor das operações nomeadas, desenhadas para ele.

**Quer resolver:** Ler e escrever os dados do site por uma superfície com contrato declarado, sem depender de telas.

- A camada de rotas falha aberta: rota sem declaração de permissão funciona e só emite aviso de uso indevido.
- A autorização da operação nomeada é filtrável inclusive para conceder, e a execução pode ser curto-circuitada antes de qualquer normalização, validação ou verificação de permissão.
- Quem autentica a credencial de aplicação ficou fora do pacote, então a emissão existe sem o consumo.

> “programa que chama /wp-json ou xmlrpc.php, autenticando por cookie, senha de aplicação ou credencial no corpo da chamada”
> — run_muvp9wahprbsns/_reversa_sdd/use-cases/use-cases.md · `ex:7f563d28:13`

> “Como programa, quero ler e escrever os dados do site por uma superfície HTTP com contrato, para integrar sem depender de telas.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:7`

> “têm defaults opostos. A camada de rotas falha **aberta**: rota sem declaração de permissão”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:4`

> “de uso no próprio código, e a execução pode ser curto-circuitada antes de qualquer”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:4`

> “US-10 (REQ-011) emite e revoga credencial de aplicação, mas quem autentica com ela é REQ-012, que ficou na coluna `refinamento` e não entrou neste pacote.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:32`


### Responsável pelo porte

Quem recebe o pacote de especificação e constrói o sistema novo, uma feature por vez, relendo a constituição a cada tarefa.

**Quer resolver:** Provar que o sistema novo decide igual ao antigo nos casos que importam, para que a migração não dependa de inspeção manual.

- Não existe rede de segurança executável: zero arquivo de teste na árvore analisada.
- Cinco dos módulos mais dependidos não têm spec alguma, e sem eles o porte não recebe camada de dados, arranque, escape de saída, envio de e-mail nem as telas do painel.
- Em seis histórias obrigatórias a seleção do backlog e a resposta humana apontam em sentidos opostos, e construir qualquer um dos dois lados joga fora o trabalho do outro.
- A seção de dependências de cada unit é piso e não lista fechada: 977 dependências medidas no código não estão declaradas em unit alguma.

> “Como responsável pelo porte, quero poder provar que o sistema novo decide igual ao antigo nos casos que importam, para que a migração não dependa de inspeção manual.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:13`

> “Zero arquivos de teste em 3.381: não existe rede de segurança executável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:17`

> “- **Impacto num porte:** Quem reimplementar lendo só as specs não recebe: a camada de acesso a dados, o arranque do sistema, a formatação e escape de saída, o envio de e-mail e as telas do painel.”
> — run_muvp9wahprbsns/_reversa_sdd/gaps.md · `ex:28e1e355:11`

> “É a diferença entre um pacote que alguém pode começar a executar e um pacote que precisa de uma conversa antes: construir qualquer um dos dois lados dessas seis joga fora o trabalho do outro.”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/README.md · `ex:1017cc14:28`

> “977 dependências medidas no código não estão declaradas em unit alguma, e 72 declaradas não existem no grafo medido.”
> — run_muvp9wahprbsns/_reversa_sdd/reconstruction-plan.md · `ex:901abb99:31`



## Requisitos

- **[funcional]** A autenticação aceita o login ou o endereço de e-mail com a mesma senha, e os dois caminhos chegam ao mesmo registro de conta.

> “O mesmo par de credenciais funciona informando o login ou o endereço de e-mail, e os dois caminhos chegam ao mesmo registro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:9`


- **[nao-funcional]** A senha é conferida contra o hash guardado e a senha em texto não é gravada em lugar algum.

> “A senha é conferida contra o hash guardado; a senha em texto não é gravada em lugar algum”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:9`


- **[funcional]** A sessão vale 2 dias sem lembrança e 14 dias com lembrança, com 12 horas de carência após o prazo, e passada a carência a requisição é tratada como anônima.

> “Sem pedir para ser lembrado, a credencial do navegador é de sessão e o token vale 2 dias”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:20`

> “Há 12 horas de carência após o prazo, durante as quais a sessão ainda é aceita”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:20`


- **[funcional]** A chave de redefinição de senha é guardada com hash, vale 24 horas e é recusada com aviso de prazo vencido depois disso.

> “A chave é guardada com hash na conta e o valor em claro só existe no e-mail enviado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:27`

> “Chave com mais de 24 horas é recusada com aviso de prazo vencido e oferta de pedir outra”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:27`


- **[funcional]** O cadastro aberto nasce desligado, e desligado o formulário não é oferecido e a ação é recusada.

> “O cadastro aberto nasce desligado; desligado, o formulário não é oferecido e a ação é recusada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`


- **[funcional]** Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso.

> “Login acima de 60 caracteres e apelido acima de 50 devolvem erro, nunca truncamento silencioso”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:40`


- **[restricao]** Nenhuma decisão de autorização compara nome de papel: toda verificação pergunta por uma capacidade.

> “Nenhuma decisão de autorização compara nome de papel: toda verificação pergunta por uma capacidade”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:47`


- **[funcional]** O conjunto papel para capacidades é dado consultável e editável em tempo de execução, não constante de código.

> “O conjunto papel → capacidades é dado consultável e editável em tempo de execução, não constante de código”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:47`


- **[funcional]** Uma negação explícita vence qualquer concessão, inclusive a do ator de maior poder da instalação.

> “Uma negação explícita vence qualquer concessão, inclusive a do ator de maior poder da instalação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:47`


- **[funcional]** É possível responder, por consulta ao armazenamento, quem tem uma capacidade dada.

> “É possível responder, por consulta ao armazenamento, quem tem uma capacidade dada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:47`


- **[funcional]** As quatro capacidades que no legado entram só por filtro — instalar tradução, retomar plugin pausado, retomar tema pausado e ver diagnósticos — constam de ao menos um papel ou de regra declarada, e numa instalação de fábrica existe ao menos um ator capaz de retomar extensão pausada.

> “As quatro capacidades que no legado entram só por filtro — instalar tradução, retomar plugin pausado, retomar tema pausado e ver diagnósticos — constam de ao menos um papel ou de regra declarada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:60`

> “Existe ao menos um ator capaz de retomar uma extensão pausada numa instalação de fábrica”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:60`


- **[funcional]** A credencial de aplicação é gerada pelo sistema com 24 caracteres, apenas o hash é guardado, e o segredo em claro é exibido uma única vez e não é recuperável depois.

> “A credencial é gerada pelo sistema com 24 caracteres e apenas o hash é guardado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:67`

> “O segredo em claro é exibido uma única vez e não é recuperável depois”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:67`


- **[funcional]** Numa ação em lote sobre contas, a permissão é verificada novamente para cada conta alvo, uma a uma, e a conta sem permissão é saltada enquanto as demais prosseguem.

> “A permissão é verificada para a ação e, em seguida, novamente para cada conta alvo, uma a uma”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:74`

> “Numa ação em lote, uma conta sem permissão é saltada e as demais prosseguem”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:74`


- **[funcional]** Ao fim de qualquer operação sobre contas continua havendo ao menos uma conta capaz de promover outras.

> “Ao fim de qualquer operação continua havendo ao menos uma conta capaz de promover outras”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/001-identidade-e-acesso/spec.md · `ex:962b322c:74`


- **[funcional]** Gravar conteúdo sem informar o estado resulta em rascunho, nunca em publicado, e não existe caminho em que a omissão publique.

> “Gravar conteúdo sem informar o estado resulta em rascunho, nunca em publicado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:16`

> “O default do armazenamento não contradiz esta regra: não existe caminho em que a omissão publique”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:16`


- **[funcional]** Publicar grava o estado publicado e dispara a transição de estado uma única vez, exigindo a capacidade de publicar aquele tipo de conteúdo.

> “Publicar grava o estado publicado e dispara a transição de estado uma única vez”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:9`

> “A publicação exige a capacidade de publicar aquele tipo de conteúdo; sem ela a ação é recusada com 403 na API e com recusa explícita na tela”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:9`


- **[funcional]** Em rascunho, pendente e rascunho automático, identificadores de URL repetidos são aceitos; na publicação o identificador é tornado único e o autor é informado quando ele muda.

> “Em rascunho, pendente e rascunho automático, identificadores de URL repetidos são aceitos”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:22`

> “O autor é informado quando o identificador muda na publicação, em lugar de descobrir pelo endereço quebrado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:22`


- **[funcional]** Pedir a publicação de conteúdo já publicado retorna sucesso sem alterar o registro, sem disparar transição de estado e sem acionar notificação, agendamento ou automação.

> “Pedir a publicação de conteúdo já publicado retorna sucesso sem alterar o registro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:34`

> “Nenhuma notificação, nenhum agendamento e nenhuma automação ligada à publicação é acionada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:34`


- **[funcional]** Conteúdo privado exige a capacidade de ler conteúdo privado, não aparece em listagem pública, feed nem sitemap, e o visitante anônimo recebe a mesma resposta que receberia para conteúdo inexistente.

> “O conteúdo privado exige, para leitura, a capacidade de ler conteúdo privado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:29`

> “Visitante anônimo recebe a mesma resposta que receberia para conteúdo inexistente”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:29`

> “O conteúdo privado não aparece em listagem pública, feed nem sitemap”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:29`


- **[funcional]** A publicação agendada para data futura é verificada duas vezes na hora de publicar.

> “US-6 — Agendar a publicação para data futura, com verificação dupla na hora de publicar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:38`


- **[funcional]** Toda taxonomia que declare termo padrão fica com ao menos um termo atribuído ao fim da publicação.

> “Toda taxonomia que declare termo padrão fica com ao menos um termo atribuído ao fim da publicação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/002-autoria-e-publicacao/spec.md · `ex:bf350877:9`


- **[funcional]** A remoção do termo padrão de um contexto de classificação é impedida.

> “US-5 — Impedir a remoção do termo padrão de um contexto”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/003-classificacao-do-conteudo/spec.md · `ex:e6a7459e:31`


- **[funcional]** A apresentação do conteúdo é escolhida por uma hierarquia declarada de modelos.

> “US-2 — Escolher a apresentação do conteúdo por uma hierarquia declarada de modelos”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/004-leitura-publica/spec.md · `ex:3679387a:10`


- **[funcional]** O corpo de conteúdo protegido por senha é liberado a quem informa a senha.

> “US-6 — Liberar o corpo de conteúdo protegido por senha a quem informa a senha”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/004-leitura-publica/spec.md · `ex:3679387a:34`


- **[funcional]** Endereço sem correspondência responde com a apresentação de erro do tema.

> “US-5 — Responder a endereço sem correspondência com a apresentação de erro do tema”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/004-leitura-publica/spec.md · `ex:3679387a:29`


- **[funcional]** O descarte guarda, junto do conteúdo, o estado que ele tinha e o instante do descarte, e o conteúdo descartado sai de toda consulta pública continuando a existir.

> “O descarte guarda, junto do conteúdo, o estado que ele tinha e o instante do descarte”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:9`

> “O conteúdo descartado sai de toda consulta pública e continua existindo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:9`


- **[funcional]** Descartar o conteúdo move os seus comentários para um estado próprio de suspensão em cascata, guardando o estado anterior de cada um, e restaurar devolve cada comentário ao estado que tinha.

> “Descartar o conteúdo move os seus comentários para um estado próprio de suspensão em cascata”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:16`

> “Restaurar o conteúdo devolve cada comentário ao estado que tinha, em lote por estado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:16`


- **[funcional]** A restauração grava rascunho, e não o estado que o conteúdo tinha antes do descarte, e o conteúdo precisa ser publicado de novo para voltar ao ar.

> “A restauração grava rascunho, e não o estado que o conteúdo tinha antes do descarte”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:23`

> “O conteúdo precisa ser publicado de novo para voltar ao ar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:23`


- **[funcional]** Com a lixeira desligada, o ator é avisado de que apagar é irreversível.

> “US-4 — Avisar que apagar é irreversível quando a lixeira está desligada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:27`


- **[funcional]** O rascunho automático não aproveitado expira em sete dias.

> “US-6 — Expirar rascunho automático não aproveitado em sete dias”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:41`


- **[funcional]** Quando um conteúdo é apagado em definitivo, os seus filhos e anexos são reparentados.

> “US-8 — Reparentar filhos e anexos quando um conteúdo é apagado em definitivo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/005-retencao-e-descarte/spec.md · `ex:ca260e49:55`


- **[funcional]** O tipo do arquivo enviado é decidido pelo conteúdo do arquivo, não pela extensão informada, e confrontado com a lista de tipos permitidos; tipo fora da lista é recusado com motivo informado ao ator.

> “O tipo é decidido pelo conteúdo do arquivo, não pela extensão informada, e confrontado com a lista de tipos permitidos”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:9`

> “Tipo fora da lista é recusado com motivo informado ao ator”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:9`


- **[funcional]** Colisão de nome no destino é resolvida renomeando, sem sobrescrever arquivo existente, e destino não gravável devolve erro sem criar registro de anexo.

> “Colisão de nome no destino é resolvida renomeando, sem sobrescrever arquivo existente”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:9`

> “Destino não gravável devolve erro com a mensagem do sistema de arquivos, e nenhum registro de anexo é criado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:9`


- **[funcional]** Nenhum caminho de escrita consegue pôr um anexo em estado publicado: estado fora dos quatro aceitos é reescrito para herdado, e mudar a visibilidade do conteúdo de destino muda a do anexo junto.

> “Nenhum caminho de escrita consegue pôr um anexo em estado publicado: estado fora dos quatro aceitos é reescrito para herdado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:14`

> “Mudar a visibilidade do conteúdo de destino muda a do anexo junto”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:14`


- **[funcional]** Receber uma imagem gera uma derivada para cada tamanho declarado, com as proporções declaradas, e o registro do anexo guarda para cada derivada o nome do arquivo e as medidas reais.

> “Receber uma imagem gera uma derivada para cada tamanho declarado, com as proporções declaradas para aquele tamanho”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:21`

> “O registro do anexo guarda, para cada derivada, o nome do arquivo e as medidas reais”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:21`


- **[funcional]** Tamanho registrado depois do envio não é gerado retroativamente: há uma ação explícita para regerar.

> “Tamanho registrado depois do envio não é gerado retroativamente: há uma ação explícita para regerar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:21`


- **[funcional]** Imagem acima do limite é reduzida na ingestão, guardando o original.

> “US-4 — Reduzir imagem acima do limite na ingestão, guardando o original”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:25`


- **[restricao]** O contorno do filtro de tipo de arquivo só acontece por decisão declarada da instalação.

> “US-9 — Contornar o filtro de tipo de arquivo só por decisão declarada da instalação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/006-biblioteca-de-midia/spec.md · `ex:5c839413:60`


- **[funcional]** Comentário sem conta é gravado com autoria anônima legítima, e não como erro; com a exigência de conta ligada, o comentário anônimo é recusado antes de qualquer outra verificação.

> “Comentário sem conta é gravado com autoria anônima legítima, e não como erro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:9`

> “Com a exigência de conta ligada, o comentário anônimo é recusado antes de qualquer outra verificação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:9`


- **[funcional]** Comentário com mesmo conteúdo, mesmo comentário pai, mesmo autor, mesmo e-mail e mesmo texto é recusado com HTTP 409, antes de qualquer decisão de moderação.

> “Mesmo conteúdo, mesmo comentário pai, mesmo autor, mesmo e-mail e mesmo texto são recusados com HTTP 409”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:15`

> “A recusa acontece antes de qualquer decisão de moderação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:15`


- **[funcional]** Um segundo comentário da mesma conta na última hora aciona o freio com HTTP 429, e quem tem a capacidade de administrar o site ou de moderar comentário não é limitado.

> “Um segundo comentário da mesma conta na última hora aciona o freio com HTTP 429”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:22`

> “Quem tem a capacidade de administrar o site ou de moderar comentário não é limitado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:22`


- **[funcional]** O estado inicial do comentário é decidido percorrendo as regras de moderação em ordem declarada.

> “US-4 — Decidir o estado inicial do comentário percorrendo as regras de moderação em ordem declarada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:26`


- **[funcional]** Campo de comentário mais longo que o seu limite é recusado, em lugar de truncado em silêncio.

> “US-5 — Recusar campo mais longo que o seu limite, em lugar de truncar em silêncio”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:33`


- **[funcional]** As respostas são encadeadas até a profundidade declarada, e só sob comentário aprovado.

> “US-7 — Encadear respostas até a profundidade declarada, e só sob comentário aprovado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:47`


- **[funcional]** A notificação de link vinda de site remoto é registrada com prova de origem.

> “US-15 — Registrar notificação de link vinda de site remoto, com prova de origem”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:99`


- **[nao-funcional]** A imagem de quem comenta é servida sem enviar o dado dele a terceiro.

> “US-18 — Servir a imagem de quem comenta sem enviar o dado dele a terceiro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/007-interacao-publica-e-moderacao/spec.md · `ex:f0b8eddf:120`


- **[funcional]** A solicitação de dados pessoais é identificada pelo endereço de e-mail e exige confirmação do titular por chave com prazo declarado.

> “US-1 — Abrir solicitação de dados pessoais identificada pelo endereço de e-mail”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:6`

> “US-2 — Exigir confirmação do titular por chave com prazo declarado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:13`


- **[funcional]** A exportação de dados pessoais percorre os provedores registrados, página por página, e o apagamento informa o que não pôde ser removido.

> “US-5 — Exportar os dados percorrendo os provedores registrados, página por página”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:34`

> “US-6 — Apagar os dados informando o que não pôde ser removido”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:41`


- **[funcional]** O arquivo de exportação é apagado no prazo declarado.

> “US-7 — Apagar o arquivo de exportação no prazo declarado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:48`


- **[funcional]** A falha de envio do e-mail de privacidade é tratada como estado reenviável, não como erro perdido.

> “US-3 — Tratar a falha de envio como estado reenviável, não como erro perdido”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/008-privacidade-e-dados-pessoais/spec.md · `ex:c709dc13:20`


- **[funcional]** A alteração de aparência é pré-visualizada antes de chegar ao visitante, e a permissão de salvar a alteração é separada da de aplicá-la.

> “US-1 — Pré-visualizar alterações de aparência antes de elas chegarem ao visitante”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:6`

> “US-2 — Separar a permissão de salvar a alteração de aparência da de aplicá-la”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:13`


- **[funcional]** Item de menu que aponta para conteúdo que não existe mais é sinalizado e limpo.

> “US-6 — Sinalizar e limpar item de menu que aponta para conteúdo que não existe mais”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:41`


- **[funcional]** A configuração dos componentes é preservada quando o tema muda, e há um tema de reserva quando o tema ativo não pode ser carregado.

> “US-9 — Preservar a configuração dos componentes quando o tema muda”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:62`

> “US-10 — Recorrer a um tema de reserva quando o tema ativo não pode ser carregado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:69`


- **[funcional]** Os recursos de interface são declarados e enfileirados com dependência e versão.

> “US-11 — Declarar e enfileirar os recursos de interface com dependência e versão”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:76`


- **[funcional]** O produto é entregue com ao menos um tema completo.

> “US-15 — Entregar ao menos um tema completo junto com o produto”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/009-apresentacao-e-personalizacao/spec.md · `ex:3089336e:100`


- **[funcional]** A instalação ou atualização de extensão exige a capacidade declarada e a confirmação do token da tela; ativar o plugin depois de instalar exige uma capacidade distinta da de instalar.

> “A ação exige a capacidade declarada e a confirmação do token da tela”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:9`

> “Ativar o plugin depois de instalar exige uma capacidade distinta da de instalar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:9`


- **[funcional]** Numa atualização em lote, a capacidade é verificada uma vez e cada item tem resultado próprio; um item que falha não interrompe os demais.

> “Numa atualização em lote, a capacidade é verificada uma vez e cada item tem resultado próprio; um que falha não interrompe os demais”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:9`


- **[restricao]** Com a proibição de modificar arquivos declarada, todas as capacidades de instalação são negadas a toda conta, inclusive à de maior poder.

> “Com a proibição de modificar arquivos declarada, todas essas capacidades são negadas a toda conta, inclusive à de maior poder”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:9`


- **[funcional]** A atualização incompatível com o ambiente é recusada informando o motivo, e o aborto não deixa o destino quebrado.

> “US-3 — Recusar atualização incompatível com o ambiente, informando o motivo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:20`

> “US-5 — Abortar a atualização sem deixar o destino quebrado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:34`


- **[funcional]** Apenas o escopo afetado pela atualização é posto em manutenção.

> “US-4 — Pôr em manutenção apenas o escopo afetado pela atualização”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:27`


- **[funcional]** A migração do esquema de dados mantém histórico das migrações aplicadas.

> “US-6 — Migrar o esquema de dados com histórico das migrações aplicadas”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:41`


- **[funcional]** A falha transitória de atualização recebe uma segunda chance e a falha crítica congela a automação até intervenção humana.

> “US-9 — Dar uma segunda chance à falha transitória e congelar a automação em falha crítica”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:61`


- **[funcional]** Todo cancelamento de atualização avisa o responsável, sem repetir o mesmo aviso.

> “US-10 — Avisar o responsável em todo cancelamento de atualização, sem repetir o mesmo aviso”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:68`


- **[funcional]** O sistema entra em modo de recuperação quando um erro fatal derruba a área protegida, e a chave de recuperação é verificada antes de ser consumida.

> “US-12 — Entrar em modo de recuperação quando um erro fatal derruba a área protegida”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:82`

> “US-13 — Verificar a chave de recuperação antes de a consumir”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:89`


- **[funcional]** O diagnóstico do ambiente é oferecido com o teste de requisição de volta em destaque.

> “US-14 — Diagnosticar a saúde do ambiente, com o teste de requisição de volta em destaque”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/010-operacao-do-software/spec.md · `ex:fdd5821d:96`


- **[funcional]** Um evento marcado para um instante é executado naquele instante num site sem visita alguma, e o gatilho não é uma requisição do próprio site para si mesmo disparada por visita de terceiro.

> “Um evento marcado para um instante é executado naquele instante, num site sem visita alguma”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:9`

> “O gatilho não é uma requisição do próprio site para si mesmo disparada por visita de terceiro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:9`


- **[funcional]** A fila agendada é consultável: é possível listar os eventos pendentes, os seus horários e as suas recorrências.

> “A fila é consultável: é possível listar os eventos pendentes, os seus horários e as suas recorrências”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:9`


- **[funcional]** Dois processos que tentam executar o mesmo evento agendado resultam em exatamente uma execução, com exclusividade de prazo declarado liberada ao fim da execução, inclusive no caminho de erro.

> “Dois processos que tentam executar o mesmo evento resultam em exatamente uma execução”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:15`

> “A exclusividade tem prazo declarado e é liberada ao fim da execução, inclusive no caminho de erro”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:15`


- **[funcional]** Um evento cuja execução excede o tempo declarado é interrompido e o fato fica registrado.

> “Um evento cuja execução excede o tempo declarado é interrompido e o fato fica registrado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:9`


- **[funcional]** O evento recorrente é retirado da fila antes de ser executado.

> “US-5 — Reagendar o evento recorrente retirando-o da fila antes de o executar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:33`


- **[funcional]** Está declarado que desligar o gatilho não desliga a fila.

> “US-6 — Declarar que desligar o gatilho não desliga a fila”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/011-trabalho-agendado/spec.md · `ex:6e2a3146:38`


- **[funcional]** Caminho e método são casados com uma rota registrada antes de qualquer execução, e a resolução de identidade acontece antes do despacho, num ponto único.

> “Caminho e método são casados com uma rota registrada antes de qualquer execução”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:9`

> “A resolução de identidade acontece antes do despacho, num ponto único”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:9`


- **[restricao]** Toda rota tem versão no caminho, e uma versão publicada não muda de contrato.

> “Toda rota tem versão no caminho, e uma versão publicada não muda de contrato”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:9`


- **[funcional]** Cada parâmetro é validado contra o tipo, o formato e os limites declarados antes de a rota executar; parâmetro fora do esquema devolve 400 nomeando o campo e o motivo, e parâmetro não declarado não chega à execução.

> “Cada parâmetro é validado contra o tipo, o formato e os limites declarados antes de a rota executar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:16`

> “Parâmetro fora do esquema devolve 400 nomeando o campo e o motivo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:16`

> “Parâmetro não declarado no esquema não chega à execução”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:16`


- **[funcional]** O esquema de cada rota é o mesmo documento usado para validar e para publicar o contrato, e há um endereço que lista as rotas registradas e os seus esquemas.

> “O esquema de cada rota é o mesmo documento usado para validar e para publicar o contrato”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:16`

> “Há um endereço que lista as rotas registradas e os seus esquemas”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:21`


- **[funcional]** Um token adicional é exigido quando a identidade da chamada vem de sessão de navegador.

> “US-5 — Exigir token adicional quando a identidade da chamada vem de sessão de navegador”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:32`


- **[funcional]** Operação nomeada e descrita por esquema é executável por agente.

> “US-6 — Executar operação nomeada e descrita por esquema, pedida por agente”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:39`


- **[funcional]** O índice de sitemap é servido conforme a opção de indexação, os feeds de conteúdo e de comentários saem da mesma consulta pública, e a representação embutível de um endereço do site é servida a outro site.

> “US-7 — Servir o índice de sitemap conforme a opção de indexação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:46`

> “US-8 — Servir feeds de conteúdo e de comentários a partir da mesma consulta pública”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:53`

> “US-9 — Servir a representação embutível de um endereço do site a outro site”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/013-superficies-programaticas/spec.md · `ex:a89ea631:58`


- **[nao-funcional]** Nenhum endereço de serviço externo é escrito com esquema sem cifra no código, e uma verificação automatizada varre o código e falha quando encontra endereço externo sem cifra.

> “Nenhum endereço de serviço externo é escrito com esquema sem cifra no código”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:9`

> “Uma verificação automatizada varre o código e falha quando encontra endereço externo sem cifra”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:9`


- **[nao-funcional]** Falha na negociação segura resulta em erro da chamada, registrado, nunca em tentativa sem cifra.

> “Falha na negociação segura resulta em erro da chamada, registrado, nunca em tentativa sem cifra”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:9`


- **[nao-funcional]** O destino de toda requisição de saída cuja URL vem de dado é validado.

> “US-2 — Validar o destino de toda requisição de saída cuja URL vem de dado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:12`


- **[nao-funcional]** A credencial de integração é resolvida por precedência declarada e nunca é guardada em texto recuperável.

> “US-3 — Resolver a credencial de integração por precedência declarada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:18`

> “US-4 — Nunca guardar credencial de integração em texto recuperável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:24`


- **[nao-funcional]** Toda chamada de saída declara prazo de espera e tratamento de erro.

> “US-5 — Declarar prazo de espera e tratamento de erro em toda chamada de saída”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:31`


- **[funcional]** O e-mail do sistema é enviado por canal declarado, com falha visível.

> “US-6 — Enviar o e-mail do sistema por canal declarado, com falha visível”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:37`


- **[restricao]** Serviços externos são notificados de atualização do site apenas por lista declarada.

> “US-8 — Notificar serviços externos de atualização do site apenas por lista declarada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/014-integracao-externa/spec.md · `ex:7d3e6f53:51`


- **[nao-funcional]** Todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto, estruturado e consultável por período, por severidade e por origem.

> “Todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:9`

> “O registro é estruturado e consultável por período, por severidade e por origem”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:9`


- **[nao-funcional]** O registro de operação funciona sem depender de o site estar em modo de depuração, e tem prazo de retenção declarado sem guardar credencial nem dado pessoal além do declarado.

> “O registro funciona sem depender de o site estar em modo de depuração”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:9`

> “O registro tem prazo de retenção declarado e não guarda credencial nem dado pessoal além do declarado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:9`


- **[nao-funcional]** Cada regra de negócio catalogada tem ao menos um teste automatizado que a exercita, com a correspondência regra para teste consultável, e a suíte é condição para integrar alteração: nenhuma mudança entra com teste vermelho.

> “Cada regra de negócio catalogada tem ao menos um teste automatizado que a exercita, e a correspondência regra → teste é consultável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:15`

> “A suíte é condição para integrar alteração: nenhuma mudança entra com teste vermelho”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:15`


- **[nao-funcional]** A suíte de paridade roda em ambiente limpo, sem depender de dado de produção.

> “A suíte roda em ambiente limpo, sem depender de dado de produção”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:15`


- **[nao-funcional]** Toda consulta ao banco é expressa por parâmetro, nunca por texto concatenado com dado, e a camada de dados recusa receber fragmento de consulta vindo de dado de entrada.

> “Toda consulta é expressa por parâmetro, nunca por texto concatenado com dado”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:21`

> “A camada de dados recusa receber fragmento de consulta vindo de dado de entrada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:21`


- **[restricao]** A camada de dados é a única porta de acesso ao banco: nenhum módulo de domínio abre conexão própria.

> “A camada de dados é a única porta de acesso ao banco: nenhum módulo de domínio abre conexão própria”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:21`


- **[nao-funcional]** Uma verificação automatizada falha quando encontra consulta montada por concatenação.

> “Uma verificação automatizada falha quando encontra consulta montada por concatenação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:21`


- **[funcional]** O idioma da interface é configurável por instalação e por conta, a partir de catálogo declarado e atualizável.

> “O idioma da interface é configurável por instalação e por conta”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:27`

> “US-4 — Traduzir a interface a partir de catálogo declarado e atualizável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:24`


- **[funcional]** O erro de análise de marcação é reportado, em lugar de reconhecido em silêncio.

> “US-5 — Reportar o erro de análise de marcação em lugar de o reconhecer em silêncio”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:31`


- **[funcional]** A instalação impede a entrada que o próprio instalador sabe que não deveria aceitar.

> “US-6 — Impedir na instalação a entrada que o próprio instalador sabe que não deveria aceitar”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/specs/015-plataforma-transversal/spec.md · `ex:dcd8dd81:38`


- **[restricao]** O comportamento observável do legado é a especificação: divergir exige decisão humana registrada, citada no código que divergiu.

> “O comportamento observável do legado é a especificação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:5`

> “**Princípio:** reproduza o comportamento observável do sistema analisado, inclusive”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:6`


- **[restricao]** Todo ponto de extensão é preservado com o nome, os argumentos, a ordem de disparo e a capacidade de alterar o resultado que tem hoje, e o inventário de pontos de extensão é artefato versionado.

> “Todo ponto de extensão é produto, não acidente de implementação”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:11`

> “**Como conferir:** o inventário de pontos de extensão é artefato versionado, com nome,”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:14`


- **[restricao]** Renomear ou remover ponto de extensão, rota, opção, constante ou função publicada não é decisão do agente de codificação: exige decisão humana.

> “Renomear ou remover ponto de extensão, rota, opção, constante ou função publicada”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`


- **[restricao]** A capacidade é a unidade de autorização e o papel é dado mutável; uma busca por nome de papel dentro de decisão de autorização devolve zero ocorrências.

> “A capacidade é a unidade de autorização; o papel é dado mutável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:16`

> “**Como conferir:** uma busca por nome de papel dentro de decisão de autorização devolve”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:19`


- **[restricao]** As três camadas de autorização conservam o default de cada uma como é hoje, inclusive quando o default é permissivo, e os cinco atestados fora delas têm prazo e força fixados por teste com relógio controlado.

> “A autorização tem três camadas paralelas, e cinco atestados fora delas”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:21`

> “**Princípio:** declare permissão explícita em toda operação exposta, e preserve o”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:22`


- **[nao-funcional]** Para cada cascata catalogada no ERD, um teste apaga o registro pai e afirma o conjunto exato do que sumiu e do que permaneceu, inclusive o que permaneceu órfão.

> “A cascata de apagamento é código, e é observável”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:26`

> “**Como conferir:** para cada cascata catalogada no ERD, um teste apaga o registro pai e”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:29`


- **[restricao]** Cada prazo, contagem e limite vive num ponto de configuração nomeado com o valor de fábrica do legado, e introduzir limite de taxa, prazo de retenção ou qualquer número que o legado não tem exige decisão humana.

> “Prazo e número do legado se reproduzem; número que o legado não tem não se inventa”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:31`

> “Introduzir limite de taxa, prazo de retenção ou qualquer número que o legado não tem”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`


- **[restricao]** O registro acrescentado é só escrita: nenhuma ramificação do código testa o resultado de escrever log.

> “Falha silenciosa do legado é comportamento; observabilidade nova não muda o fluxo”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:36`

> “**Como conferir:** o registro acrescentado é só escrita: nenhuma ramificação do código”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:39`


- **[restricao]** Nada sai da superfície sem decisão humana: toda remoção tem uma linha no registro de descartes apontando para a resposta ou o ADR que a autorizou.

> “Nada sai da superfície sem decisão humana”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:41`

> “**Como conferir:** toda remoção tem uma linha no registro de descartes, apontando para a”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:45`


- **[restricao]** Mudar a ordem de carregamento do arranque exige decisão humana, porque a ordem é contrato público.

> “Mudar a ordem de carregamento do arranque | em D1 ela é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`


- **[restricao]** A linguagem do sistema novo é TypeScript, fixada pelas respostas humanas e não por etapa de arquitetura.

> “O alvo em TypeScript foi fixado pelas 23 respostas de `_reversa_sdd/questions.md`, não por esta etapa.”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`


- **[restricao]** A arquitetura aplica portas e adaptadores a cinco bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa o barramento de hooks explicitamente fora.

> “A arquitetura escolhida aplica portas e adaptadores a 5 bordas — dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail — e deixa `hooks-e-plugin-api` explicitamente fora, porque os 2.460 pontos de interceptação que devolvem valor são o produto.”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`


- **[restricao]** Sem banco de produção, sem dado a migrar e sem instalação real, o default do código é a especificação.

> “Sem banco de produção, sem dado a migrar e sem instalação real: o default do código é a especificação (Pergunta 1).”
> — run_muvp9wahprbsns/_reversa_sdd/refactor/tech-stack.md · `ex:046b7e03:6`


- **[restricao]** A escolha de tecnologia de cada um dos 17 slots do plano não é decisão do agente de codificação: o leque de candidatos é pesquisa, e quem define é quem vai construir.

> “Escolher a tecnologia de qualquer slot do plano | o leque de candidatos de `refactor/tech-stack.json` é pesquisa, não escolha; quem define é quem vai construir”
> — run_muvp9wahprbsns/_reversa_sdd/speckit/memory/constitution.md · `ex:d46bd2f8:49`



## O que o material não diz

- Existe acesso de leitura ao `wp-config.php` e à tabela de opções de uma instalação real? Sem isso, 279 das 567 lacunas continuam abertas e nenhum valor real de constante ou de opção é conhecido.
- Existe acesso de leitura ao banco de produção, ou a um dump recente? Se não houver acesso direto, é possível obter apenas as contagens por tabela e por estado?
- Qual é a lista de extensões e temas ativos na instalação real, com versão, e alguma delas substitui função do núcleo, registra capacidade, ability, bloco ou tipo de conteúdo próprio?
- A instalação é multisite? Em qual modo — subdomínio ou subdiretório — e quantos sites e redes existem? O valor de MULTISITE decide se seis tabelas e um segundo painel são domínio real ou código inerte.
- Qual é o conteúdo da opção de papéis na instalação real? Há papéis criados sob medida, ou capacidades adicionadas ou removidas dos papéis do núcleo?
- Onde está o lado cliente construído (`wp-includes/js/dist/`)? Há acesso ao repositório de origem ou a um pacote instalado que o contenha? Sem ele, o editor de blocos, o editor de site e os diagnósticos assíncronos não são especificáveis.
- Existe suíte de testes fora desta árvore, e existe ambiente onde o legado possa ser executado para comparar comportamento antes e depois do porte?
- Existe o repositório de versão deste código em outro lugar, ou alguém que tenha acompanhado as decisões e possa ser entrevistado?
- O sistema novo integra IA? Com qual provedor, e as operações expostas a agentes externos fazem parte do escopo?
- Existe log de servidor web ou de aplicação retido, por quanto tempo, e é possível extrair dele volume de requisição por superfície e taxa de erro?
- Quais são os prazos de retenção a declarar para registro editorial interno, solicitação de dados pessoais concluída, cadastro em rede já ativado e registro de cadastro?
- Quem resolve os 21 conflitos entre a seleção do backlog e as respostas humanas, em especial as seis histórias obrigatórias (gatilho do trabalho agendado, registro da fila, visibilidade da falha do gatilho, assinatura de pacote, coleta da lixeira e canal sem cifra), onde construir um lado joga fora o trabalho do outro?
- O gatilho do trabalho agendado é um agendador real, como pede a história obrigatória, ou permanece a lista em opções disparada por requisição não bloqueante ao próprio host, como manda a resposta humana? É a decisão de que mais features dependem e ninguém a tomou.
- Os 12 cards já destravados por resposta humana posterior devem voltar à seleção, em especial o que trava o épico de rede inteiro? Enquanto não voltarem, a feature de rede continua vazia.
- Autoriza rodar o writer para os 15 módulos sem spec antes de qualquer trabalho de porte, começando por núcleo utilitário e erro, formatação e escape, bootstrap e carregamento, camada de dados e telas do painel?
- Qual tecnologia é escolhida em cada um dos 17 slots do plano, começando pelo runtime e pelo isolamento de estado por requisição, que é o slot em que o porte quebra e para o qual não há candidato óbvio?
- Quem são os operadores e o público desta instalação, e qual é a lista de plugins e temas ativos além dos empacotados? Nada na árvore diz quem opera o site, quantos usuários existem ou quais papéis estão em uso.
- Se a instalação executável de referência mostrar matriz papel por capacidade diferente da derivada simbolicamente, qual das duas vale como oráculo?
- A credencial de aplicação do porte ganha escopo e prazo, ou continua valendo exatamente o que a conta vale? Dar escopo é divergência do idêntico e exige decisão humana registrada.
- O porte declara integridade referencial no armazenamento, dado que o legado não tem nenhuma chave estrangeira e trata órfão como estado normal? Declarar restrição que mude a cascata observável é violação.
- Qual tema serve de oráculo para o teste de paridade da escolha de apresentação por hierarquia de modelos?
- A exportação e a importação de conteúdo num formato declarado entram no escopo? O card ficou fora da seleção e nenhuma história o cobre.
- A árvore analisada é um pacote de distribuição ou existe clone com histórico para cruzar? Sem histórico, nenhuma das sete decisões fundadoras pode citar commit, e a versão declarada não é confirmável contra release pública.
