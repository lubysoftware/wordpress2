> O pacote já está neste projeto: as especificações em `.specify/specs/`, os limites em `memory/constitution.md`. Não há nada para copiar, e todo caminho citado abaixo é deste projeto. O que este pacote recusa reescrever está em `do-not-rewrite.md`.

# Pacote de especificações: wordpress

Especificações de um sistema **novo**, derivadas da engenharia reversa de wordpress. Nenhum arquivo do sistema analisado é alterado por este pacote.

| | |
|---|---|
| features | 15 |
| histórias | 136 |
| critérios de aceite | 621 |
| tarefas | 301 |
| cards que entraram | 151 de 181 |
| princípios da constituição | 8 |
| stack | TypeScript (de `_reversa_sdd/questions.md`) |
| specs geradas em | 2026-10-07T00:32:09-03:00 |
| exportado em | 2026-10-07T03:35:04.455Z |

## Como usar

1. O pacote já está neste projeto: não há nada para copiar. Comece pelo passo 2.
2. Leia `memory/constitution.md` antes de escrever qualquer linha. São os limites que nenhuma implementação pode violar, e é o documento que o agente de codificação relê a cada tarefa.
3. Siga a **ordem de implementação** abaixo. Ela não é a ordem numérica das pastas: é a ordem das dependências entre as features.
4. Em cada feature, nesta ordem: `spec.md` diz o quê e por quê, `plan.md` diz como, e `tasks.md` é o que se executa, um item por vez.
5. Marque o checkbox da tarefa em `tasks.md` ao concluir, e o da feature aqui quando ela fechar. Este arquivo é o lugar de onde se enxerga o todo.

## Ordem de implementação

_Fora da ordem numérica das pastas, de propósito: cada feature aqui aparece depois daquelas de que ela depende._

- [ ] **1. Identidade e acesso** · `001-identidade-e-acesso` · EP-1
      11 histórias · 52 critérios · 24 tarefas
      sem dependência dentro do pacote, pode começar por ela
      [spec](.specify/specs/001-identidade-e-acesso/spec.md) · [plan](.specify/specs/001-identidade-e-acesso/plan.md) · [tasks](.specify/specs/001-identidade-e-acesso/tasks.md)
      <sub>vem de REQ-001, REQ-002, REQ-003, REQ-006, REQ-007, REQ-009, REQ-011, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018</sub>

- [ ] **2. Classificação do conteúdo** · `003-classificacao-do-conteudo` · EP-3
      5 histórias · 20 critérios · 12 tarefas
      depois de `001`
      [spec](.specify/specs/003-classificacao-do-conteudo/spec.md) · [plan](.specify/specs/003-classificacao-do-conteudo/plan.md) · [tasks](.specify/specs/003-classificacao-do-conteudo/tasks.md)
      <sub>vem de REQ-033, REQ-034, REQ-035, REQ-036, REQ-037</sub>

- [ ] **3. Leitura pública** · `004-leitura-publica` · EP-4
      8 histórias · 33 critérios · 18 tarefas
      depois de `001`
      [spec](.specify/specs/004-leitura-publica/spec.md) · [plan](.specify/specs/004-leitura-publica/plan.md) · [tasks](.specify/specs/004-leitura-publica/tasks.md)
      <sub>vem de REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-045, REQ-046, REQ-171</sub>

- [ ] **4. Rede multisite** · `012-rede-multisite` · EP-12
      sem dependência dentro do pacote, pode começar por ela
      [spec](.specify/specs/012-rede-multisite/spec.md) · [plan](.specify/specs/012-rede-multisite/plan.md) · [tasks](.specify/specs/012-rede-multisite/tasks.md)
      <sub>vem de REQ-136</sub>

- [ ] **5. Plataforma transversal** · `015-plataforma-transversal` · EP-15
      6 histórias · 29 critérios · 14 tarefas
      depois de `001`
      [spec](.specify/specs/015-plataforma-transversal/spec.md) · [plan](.specify/specs/015-plataforma-transversal/plan.md) · [tasks](.specify/specs/015-plataforma-transversal/tasks.md)
      <sub>vem de REQ-159, REQ-163, REQ-164, REQ-166, REQ-167, REQ-168, REQ-170, REQ-178</sub>

- [ ] **6. Biblioteca de mídia** · `006-biblioteca-de-midia` · EP-6
      9 histórias · 39 critérios · 20 tarefas
      depois de `001`, `015`
      [spec](.specify/specs/006-biblioteca-de-midia/spec.md) · [plan](.specify/specs/006-biblioteca-de-midia/plan.md) · [tasks](.specify/specs/006-biblioteca-de-midia/tasks.md)
      <sub>vem de REQ-056, REQ-057, REQ-058, REQ-059, REQ-060, REQ-061, REQ-062, REQ-063, REQ-064</sub>

- [ ] **7. Trabalho agendado** · `011-trabalho-agendado` · EP-11
      6 histórias · 26 critérios · 14 tarefas
      depois de `015`
      [spec](.specify/specs/011-trabalho-agendado/spec.md) · [plan](.specify/specs/011-trabalho-agendado/plan.md) · [tasks](.specify/specs/011-trabalho-agendado/tasks.md)
      <sub>vem de REQ-122, REQ-123, REQ-124, REQ-125, REQ-126, REQ-127, REQ-128</sub>

- [ ] **8. Autoria e publicação** · `002-autoria-e-publicacao` · EP-2
      11 histórias · 48 critérios · 24 tarefas
      depois de `001`, `003`, `011`
      [spec](.specify/specs/002-autoria-e-publicacao/spec.md) · [plan](.specify/specs/002-autoria-e-publicacao/plan.md) · [tasks](.specify/specs/002-autoria-e-publicacao/tasks.md)
      <sub>vem de REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-029, REQ-031</sub>

- [ ] **9. Retenção e descarte** · `005-retencao-e-descarte` · EP-5
      8 histórias · 34 critérios · 18 tarefas
      depois de `001`, `002`, `011`
      [spec](.specify/specs/005-retencao-e-descarte/spec.md) · [plan](.specify/specs/005-retencao-e-descarte/plan.md) · [tasks](.specify/specs/005-retencao-e-descarte/tasks.md)
      <sub>vem de REQ-047, REQ-048, REQ-049, REQ-050, REQ-052, REQ-053, REQ-054, REQ-055</sub>

- [ ] **10. Interação pública e moderação** · `007-interacao-publica-e-moderacao` · EP-7
      18 histórias · 79 critérios · 39 tarefas
      depois de `001`, `004`, `005`, `011`
      [spec](.specify/specs/007-interacao-publica-e-moderacao/spec.md) · [plan](.specify/specs/007-interacao-publica-e-moderacao/plan.md) · [tasks](.specify/specs/007-interacao-publica-e-moderacao/tasks.md)
      <sub>vem de REQ-065, REQ-066, REQ-067, REQ-068, REQ-070, REQ-071, REQ-072, REQ-073, REQ-074, REQ-075, REQ-076, REQ-077, REQ-078, REQ-079, REQ-080, REQ-081, REQ-082, REQ-083, REQ-085, REQ-180</sub>

- [ ] **11. Privacidade e dados pessoais** · `008-privacidade-e-dados-pessoais` · EP-8
      8 histórias · 39 critérios · 18 tarefas
      depois de `001`, `011`
      [spec](.specify/specs/008-privacidade-e-dados-pessoais/spec.md) · [plan](.specify/specs/008-privacidade-e-dados-pessoais/plan.md) · [tasks](.specify/specs/008-privacidade-e-dados-pessoais/tasks.md)
      <sub>vem de REQ-086, REQ-087, REQ-088, REQ-089, REQ-090, REQ-091, REQ-093, REQ-095</sub>

- [ ] **12. Operação do próprio software** · `010-operacao-do-software` · EP-10
      14 histórias · 74 critérios · 30 tarefas
      depois de `001`, `011`
      [spec](.specify/specs/010-operacao-do-software/spec.md) · [plan](.specify/specs/010-operacao-do-software/plan.md) · [tasks](.specify/specs/010-operacao-do-software/tasks.md)
      <sub>vem de REQ-106, REQ-107, REQ-108, REQ-109, REQ-110, REQ-111, REQ-112, REQ-113, REQ-114, REQ-115, REQ-116, REQ-117, REQ-118, REQ-119, REQ-121</sub>

- [ ] **13. Superfícies programáticas** · `013-superficies-programaticas` · EP-13
      9 histórias · 43 critérios · 20 tarefas
      depois de `004`, `007`, `015`
      [spec](.specify/specs/013-superficies-programaticas/spec.md) · [plan](.specify/specs/013-superficies-programaticas/plan.md) · [tasks](.specify/specs/013-superficies-programaticas/tasks.md)
      <sub>vem de REQ-137, REQ-139, REQ-140, REQ-141, REQ-142, REQ-143, REQ-145, REQ-146, REQ-147, REQ-148, REQ-179</sub>

- [ ] **14. Integração externa** · `014-integracao-externa` · EP-14
      8 histórias · 39 critérios · 18 tarefas
      depois de `002`, `010`, `015`
      [spec](.specify/specs/014-integracao-externa/spec.md) · [plan](.specify/specs/014-integracao-externa/plan.md) · [tasks](.specify/specs/014-integracao-externa/tasks.md)
      <sub>vem de REQ-149, REQ-150, REQ-151, REQ-152, REQ-153, REQ-154, REQ-155, REQ-156, REQ-157, REQ-158, REQ-181</sub>

- [ ] **15. Apresentação e personalização** · `009-apresentacao-e-personalizacao` · EP-9
      15 histórias · 66 critérios · 32 tarefas
      depois de `001`, `002`, `003`, `004`, `014`
      [spec](.specify/specs/009-apresentacao-e-personalizacao/spec.md) · [plan](.specify/specs/009-apresentacao-e-personalizacao/plan.md) · [tasks](.specify/specs/009-apresentacao-e-personalizacao/tasks.md)
      <sub>vem de REQ-096, REQ-097, REQ-098, REQ-099, REQ-100, REQ-101, REQ-102, REQ-103, REQ-104, REQ-105, REQ-172, REQ-173, REQ-174, REQ-175, REQ-176</sub>

## Perguntas em aberto · 58

O que a análise do legado não conseguiu determinar. O pacote roda sem elas, com o buraco declarado na spec de cada feature. É a pauta da primeira conversa com quem conhece o negócio.

- [ ] 001-identidade-e-acesso: CA-9.4 (REQ-016) exige que nenhuma das 93 capacidades verificadas no código fique fora da matriz declarada, mas a matriz de fábrica tem 50 concessões reais e `permissions.md` identifica apenas quatro ausentes que entram por ponto de extensão. Quais são as demais, e a matriz deve crescer até cobrir as 93 ou o critério deve ser reescrito para as que têm responsável? É o único critério deste pacote sem nenhum teste registrado em `backlog/tests.md`.
- [ ] 001-identidade-e-acesso: US-10 (REQ-011) emite e revoga credencial de aplicação, mas quem autentica com ela é REQ-012, que ficou na coluna `refinamento` e não entrou neste pacote. Construir a emissão sem o consumo, ou esperar REQ-012? As features 013 e 015 esperam por ele.
- [ ] 001-identidade-e-acesso: A credencial de aplicação do legado não tem escopo nem prazo e vale exatamente o que a conta vale (`permissions.md` 8.2). A resposta 7 decidiu que ela sobrevive à troca de senha, mas não disse se o porte lhe dá escopo. Dar escopo é divergência do idêntico e exige decisão humana registrada (P1 da constituição).
- [ ] 001-identidade-e-acesso: A matriz papel por capacidade não existe como dado no legado: foi derivada executando simbolicamente as oito funções de povoamento. Se a instalação executável de referência da resposta 16 mostrar matriz diferente da derivada, qual das duas vale como oráculo?
- [ ] 003-classificacao-do-conteudo: A junção de classificação do legado é polimórfica por convenção: a coluna de objeto aponta para conteúdo sem nada declarar, e nada impede outro tipo de objeto. O modelo novo mantém a junção genérica ou a prende ao registro de conteúdo? A resposta 2 proíbe que a decisão mude o que é observável, o que exclui declarar restrição que recuse hoje o que o legado aceita.
- [ ] 003-classificacao-do-conteudo: A contagem de uso de cada termo é dado gravado e sai de sincronia quando alguém escreve na junção por fora do caminho normal. Recalcular na leitura é mais correto e muda o que a interface devolve nesse caso de borda. Manter o valor gravado, com a possibilidade de divergir, é o comportamento idêntico. Ninguém decidiu.
- [ ] 004-leitura-publica: US-7 (REQ-045) pré-busca o próximo destino antes do clique, e metade do comportamento do módulo correspondente do legado está no lado cliente, ausente desta árvore (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem: até isso acontecer, os critérios de borda desta história não são verificáveis contra o legado.
- [ ] 004-leitura-publica: US-2 (REQ-039) escolhe a apresentação por hierarquia declarada de modelos, e os modelos vêm do tema, que está na feature 009. Qual tema serve de oráculo para o teste de paridade desta história?
- [ ] 012-rede-multisite: A resposta 4 resolveu REQ-129, que é o card que trava o épico inteiro. Os 12 cards restantes de EP-12 devem voltar à seleção para que esta feature exista de verdade? A decisão é de quem monta a seleção, não deste pacote.
- [ ] 012-rede-multisite: A identidade é global à rede, e o vínculo entre conta e site mora dentro do nome da chave do metadado de autorização. A resposta 4 manda preservar esse comportamento ainda que o armazenamento seja normalizado por baixo. Nenhuma história deste pacote carrega essa regra, e ela é a decisão mais consequente de um porte de rede.
- [ ] 012-rede-multisite: O estado "criado e ainda não ativado" de um site da rede usa um terceiro valor numa coluna que o dicionário de dados descreve como de dois valores (regra N2 do domínio). Quem portar lendo o dicionário produz um estado a menos, e a falha aparece só quando um site novo da rede é criado.
- [ ] 012-rede-multisite: REQ-136 depende de `REQ-133` (Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída), que ficou na coluna `backlog` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 015-plataforma-transversal: REQ-159 exige, no último critério, que nenhum caminho de erro seja silencioso por omissão, com verificação automatizada que falha ao encontrar tratamento de erro sem registro. O legado tem silêncios estruturais que respostas humanas mandaram preservar: o caso "sem assinatura" silenciado fora do modo de depuração (resposta 11) e os cinco pontos do processamento de imagem sem registro (regra M4). P7 da constituição resolve metade do conflito, porque permite acrescentar registro sem mudar o fluxo; a outra metade, que é recusar o silêncio, precisa de decisão.
- [ ] 015-plataforma-transversal: O nome deste épico inclui limite de taxa, e nenhuma história o especifica: REQ-160 ficou `bloqueado`, e a resposta 19 o põe fora do núcleo, como decisão de implantação, para não inventar número que o produto nunca teve. A consequência precisa estar escrita para quem recebe o pacote: o produto portado nasce sem limite de taxa em superfície alguma, exatamente como o legado, e os dois únicos freios continuam sendo travas de tempo de 60 segundos e de 5 minutos.
- [ ] 015-plataforma-transversal: A resposta 21 autorizou gerar spec para 15 módulos que não tinham nenhuma, começando pelos cinco mais dependidos: camada de dados, arranque, formatação e escape, núcleo utilitário e telas do painel. Neste pacote, só a camada de dados tem história própria (REQ-164); os outros quatro aparecem apenas como módulos tocados por cards cujo assunto é outro. É a maior lacuna estrutural da entrega, e ela atravessa as 15 features.
- [ ] 015-plataforma-transversal: REQ-166 traduz a interface a partir de catálogo declarado, e depende de REQ-161, que ficou `bloqueado`. Sem a separação entre domínio e apresentação, a tradução continua entrando em 68 dos 71 módulos, o que é a forma medida do problema que REQ-161 descreve.
- [ ] 015-plataforma-transversal: US-4 (REQ-166) depende de `REQ-161` (Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 015-plataforma-transversal: US-6 (REQ-168) depende de `REQ-010` (Garantir no armazenamento que login e e-mail de conta são únicos), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 015-plataforma-transversal: REQ-170 depende de `REQ-162` (Declarar os pontos de extensão com contrato explícito), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 015-plataforma-transversal: REQ-170 depende de `REQ-165` (Decidir se o cache de objeto nasce persistente, e dar significado real à expiração), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 006-biblioteca-de-midia: US-5 (REQ-060) exige informar e registrar a falha ao processar imagem, e a regra M4 do domínio registra que no legado ela é silenciosa nos cinco pontos do processamento. Acrescentar registro é permitido por P7 da constituição; informar o ator muda o que ele vê e é divergência que precisa de decisão humana registrada.
- [ ] 006-biblioteca-de-midia: A redução da imagem na ingestão troca o arquivo servido por uma cópia com sufixo no nome, e o sufixo aparece no endereço público. Se o modelo novo mudar a forma do nome, muda endereço observável. Ninguém decidiu se o sufixo é contrato.
- [ ] 006-biblioteca-de-midia: US-8 (REQ-063) apaga o arquivo que deixou de ser referenciado. No legado não existe rotina que faça isso, e a resposta 2 diz que o porte parte de instalação nova, sem órfão herdado. Esta história cria comportamento que o legado não tem: é melhoria deliberada ou foi escrita assumindo dado legado a limpar?
- [ ] 011-trabalho-agendado: Conflito registrado, não resolvido, e o mais consequente desta feature. REQ-122 exige, em CA2, que o gatilho não seja uma requisição do próprio site para si mesmo disparada por visita de terceiro, e exige que um evento marcado para um instante execute naquele instante num site sem visita alguma. A resposta 10 de `questions.md` decidiu manter exatamente o que o card recusa, com a justificativa escrita de que "trocar por agendador do sistema produz um produto que se comporta diferente no primeiro dia". As duas decisões são humanas e se excluem: nenhuma implementação satisfaz as duas.
- [ ] 011-trabalho-agendado: REQ-124 exige registrar o que a fila executou, com instante, duração, resultado e prazo de retenção declarado, e REQ-125 exige avisar quem administra depois de um prazo sem nenhuma execução. O legado não guarda registro de execução nenhum, e a resposta 20 proíbe inventar prazo de retenção que o produto não tem. Acrescentar registro sem mudar o fluxo é permitido por P7 da constituição; tornar o registro e o aviso obrigatórios é divergência que precisa de decisão humana registrada.
- [ ] 011-trabalho-agendado: O protocolo de requisição ao próprio site está implementado quatro vezes no legado. Unificar as quatro é invisível de fora e portanto compatível com P1, mas muda o que uma extensão que intercepte uma das quatro consegue interceptar. Unificar, ou portar as quatro?
- [ ] 011-trabalho-agendado: Se a resposta 10 prevalecer, três das seis histórias desta feature (REQ-122, REQ-124 e REQ-125) perdem a razão de ser, e o épico fica com o controle de concorrência, o reagendamento e a declaração de que desligar o gatilho não desliga a fila. Isso precisa ser dito por quem decide, porque é a diferença entre uma feature de seis histórias e uma de três.
- [ ] 002-autoria-e-publicacao: REQ-030 (sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado) ficou `bloqueado` e não entrou no pacote. Esta feature grava corpo de conteúdo sem que nada aqui diga como ele é sanitizado, e a regra P8 do domínio põe o privilégio de marcação bruta também no papel de editor, não só no de administrador. Quem construir US-1 a US-8 sem REQ-030 decide a sanitização sozinho.
- [ ] 002-autoria-e-publicacao: REQ-032 (formato declarado de armazenamento do corpo em blocos) ficou `bloqueado` pela ausência do lado cliente nesta árvore, e a resposta 15 resolve a ausência mandando construir a partir do repositório de origem. O card volta à seleção antes de esta feature começar, ou o corpo é portado sem formato declarado?
- [ ] 002-autoria-e-publicacao: REQ-028 (registrar quem decidiu cada transição de estado editorial) ficou em `refinamento`. US-8 publica conteúdo de outro autor preservando a autoria, e US-7 o submete para revisão, mas nada no pacote especifica o registro de quem decidiu a transição. Sem ele, a cadeia editorial existe e não é auditável.
- [ ] 005-retencao-e-descarte: Conflito registrado, não resolvido. US-5 (REQ-052) exige, em CA-5.1, que o agendamento da coleta exista numa instalação nova sem depender de ninguém ter entrado no painel. A resposta 10 de `questions.md`, que cita este card na lista de specs afetadas, decidiu manter o disparo por requisição ao próprio host e declarou que a consequência de um site sem visita nunca executar a própria limpeza é comportamento do produto, não acidente. As duas decisões são humanas e estão em sentidos opostos: construir US-5 como está escrita rompe a paridade, construir a paridade deixa CA-5.1 falso. Este pacote não escolhe.
- [ ] 005-retencao-e-descarte: CA-5.5 (REQ-052) exige que cada execução registre quantos registros apagou, e o legado não guarda registro nenhum de execução (P7 da constituição). Registro novo que não altera o fluxo é permitido por P7; o critério, porém, torna o registro obrigatório, o que precisa ser aceito explicitamente como divergência.
- [ ] 005-retencao-e-descarte: REQ-051 (dar lixeira à mídia pelo mesmo comportamento do conteúdo) ficou `bloqueado` por decisão humana, e a resposta 9 já a tomou: a exclusão de mídia continua definitiva, sem lixeira e sem aviso. US-8 reparenta anexos ao apagar conteúdo em definitivo, então a assimetria entre conteúdo e mídia precisa estar visível para quem constrói. O card volta à seleção, agora que a decisão existe?
- [ ] 007-interacao-publica-e-moderacao: Conflito de escopo registrado, não resolvido. US-16 (REQ-082) e US-17 (REQ-083) especificam o comportamento do serviço externo de reputação, e a resposta 13 decidiu que ele é extensão empacotada e não núcleo: o que o porte preserva é a cascata local de moderação e o ponto de extensão que permite a um classificador externo entrar. Se a resposta valer, as duas histórias saem do clone do núcleo e viram requisito de extensão; se não valer, falta decidir a minimização que a própria resposta exige.
- [ ] 007-interacao-publica-e-moderacao: REQ-069 (decidir o atalho de confiança do autor e de quem modera sob a mesma sanitização) ficou `bloqueado` e não entrou. US-4 constrói a cascata cujo primeiro passo é exatamente esse atalho, sem que nada no pacote diga qual sanitização se aplica a quem entra por ele.
- [ ] 007-interacao-publica-e-moderacao: US-18 (REQ-180) serve a imagem de quem comenta sem enviar o dado dele a terceiro, e no legado essa imagem vem de um serviço externo que recebe o endereço de e-mail em forma de resumo criptográfico. É divergência deliberada do comportamento observável e precisa de decisão humana registrada (P1 da constituição).
- [ ] 008-privacidade-e-dados-pessoais: REQ-092 (proteger o arquivo de exportação por verificação de identidade) ficou `bloqueado`. No legado o arquivo fica acessível por endereço com chave durante três dias, sem verificação de identidade, e US-7 apenas o apaga no prazo. Quem construir esta feature entrega a exportação com a proteção do legado, que é a chave no endereço, e isso precisa estar explícito para quem opera.
- [ ] 008-privacidade-e-dados-pessoais: REQ-094 (declarar a retenção do registro de solicitação concluída) ficou `bloqueado` por falta de decisão, e a resposta 20 já decidiu: o núcleo não declara prazo nenhum, e onde o legado encerra por propósito o porte preserva. O card volta à seleção com a decisão registrada, ou fica fora?
- [ ] 008-privacidade-e-dados-pessoais: A chave de confirmação é guardada com resumo criptográfico no mesmo campo em que o conteúdo guarda senha em texto claro (regra D6). O modelo novo mantém o campo compartilhado, com significados diferentes por tipo de registro, ou separa os dois? Separar é mais claro e muda o que um programa de terceiro lê.
- [ ] 010-operacao-do-software: Conflito registrado, não resolvido, e explícito. US-2 (REQ-107) exige verificar a autenticidade do pacote antes de o aplicar, recusar o pacote sem prova e não permitir contorno por configuração. A resposta 11 decidiu manter a tolerância do legado: pacote sem assinatura verificada é instalado, e o modo de falha do ADR 0010 é portado como está, porque exigir assinatura tornaria o sistema incompatível com o ecossistema que ele clona. É o conflito mais consequente do pacote, porque a história é `must` e a resposta é explícita.
- [ ] 010-operacao-do-software: CA-14.4 (REQ-119) exige guardar o resultado de cada execução do diagnóstico com instante, para comparar a evolução entre visitas. A regra registrada no próprio card diz que a tela do legado calcula na hora e não armazena nada. Guardar é melhoria, e melhoria é divergência que precisa de decisão (P1), além de criar um dado com prazo de retenção que a resposta 20 proíbe inventar.
- [ ] 010-operacao-do-software: REQ-120 (exportar e importar o conteúdo num formato declarado) ficou `bloqueado` e não entrou. US-6 migra esquema de dados, mas o pacote não especifica o formato de intercâmbio de conteúdo, que é o caminho pelo qual uma instalação legada entraria no sistema novo.
- [ ] 010-operacao-do-software: US-11 (REQ-116) destrava a atualização congelada, e a análise registra que o destravamento do legado existe mas depende de uma invariante não declarada entre dois arquivos. Reproduzir a invariante exige lê-la no código do legado, caso a caso: ela não está escrita em nenhum artefato desta análise.
- [ ] 013-superficies-programaticas: REQ-138 (exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela) ficou `bloqueado` e não entrou. É ele que fecharia a falha aberta da camada de rotas, e dois itens desta feature dependem dele. Sem ele, o pacote porta a falha aberta sem nenhuma história que a declare.
- [ ] 013-superficies-programaticas: A execução de operação nomeada pode ser curto-circuitada antes de qualquer validação, e o próprio código do legado avisa que, nesse caminho, a integridade do insumo passa a ser de quem curto-circuitou. REQ-143 especifica a execução e não diz se o curto-circuito entra. Portá-lo é reproduzir um caminho que contorna toda a validação; não portá-lo é divergir de comportamento declarado.
- [ ] 013-superficies-programaticas: REQ-141 registra o acesso à superfície programática, e o legado não registra nada. Vale a mesma ressalva de P7 e da resposta 20: registro novo é permitido, prazo de retenção novo não se inventa.
- [ ] 013-superficies-programaticas: US-1 (REQ-137) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 013-superficies-programaticas: US-3 (REQ-140) depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 013-superficies-programaticas: US-5 (REQ-142) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 013-superficies-programaticas: REQ-179 depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] 014-integracao-externa: Conflito registrado, não resolvido, e explícito. REQ-149 é `must` e exige, em três critérios, que nenhum endereço externo seja escrito sem cifra, que uma verificação automatizada falhe quando encontrar um, e que a falha de negociação segura resulte em erro em vez de tentativa sem cifra. A resposta 12 decidiu o contrário, mantendo os 13 canais sem cifra e as 7 repetições em claro. É o mesmo conflito do descarte REQ-150, agora numa história obrigatória.
- [ ] 014-integracao-externa: REQ-153 proíbe guardar credencial de integração em texto recuperável, e a credencial da caixa postal do legado fica em texto puro na configuração e trafega sem cifra. Se o descarte de REQ-157 não valer, as duas decisões se excluem: ou a caixa postal é portada com a credencial em claro, ou REQ-153 é violado na primeira integração.
- [ ] 014-integracao-externa: REQ-154 declara prazo de espera e tratamento de erro em toda chamada de saída, e é por esta história que passa a única divergência que a resposta 18 autorizou: definir o tempo limite do adaptador de modelo de linguagem em vez de herdar o default curto do cliente genérico. Quem implementar precisa citar a resposta 18 no código, como manda P1 da constituição.
- [ ] 014-integracao-externa: O serviço externo de reputação aparece nas integrações desta feature, e a resposta 13 o põe fora do núcleo clonado, como extensão empacotada. Isso muda o que esta feature precisa entregar, e a decisão de escopo não está registrada em card nenhum.
- [ ] 009-apresentacao-e-personalizacao: Cinco histórias desta feature dependem de código que não está nesta árvore: o lado cliente do editor, dos recursos de interface, da biblioteca de fontes e do conjunto de ícones (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem, com os pacotes do projeto. Até que esse fonte esteja em mãos, US-11 a US-14 não têm oráculo de paridade.
- [ ] 009-apresentacao-e-personalizacao: REQ-177 (tornar interativo o conteúdo renderizado sem recarregar a página) ficou `bloqueado` pela mesma ausência e não entrou no pacote. Parte do comportamento de US-11 e US-12 só faz sentido com ele.
- [ ] 009-apresentacao-e-personalizacao: US-15 (REQ-176) exige entregar ao menos um tema completo junto com o produto. A árvore analisada traz três temas empacotados, e nenhuma resposta humana disse qual deles é o tema de referência do porte, nem se os três entram.
- [ ] 009-apresentacao-e-personalizacao: US-4 (REQ-099) agenda a aplicação de uma alteração de aparência, e o agendamento depende da fila da feature 011, cujas histórias estão em conflito aberto com a resposta 10. Enquanto esse conflito não se resolver, o comportamento agendado desta história fica indefinido.

## Fora deste pacote · 30

Cards do backlog do sistema analisado que não viraram spec, com a coluna em que pararam. Nada some em silêncio: o que estiver aqui e precisar existir volta pelo Kanban do Studio, e o pacote é gerado de novo.

| card | título | coluna | motivo |
|---|---|---|---|
| `REQ-004` | Recusar autenticação sem revelar se a conta existe | Bloqueado | não está na coluna `pronto` |
| `REQ-005` | Suspender o acesso após tentativas falhas repetidas | Bloqueado | não está na coluna `pronto` |
| `REQ-008` | Encerrar as sessões abertas quando a senha da conta é trocada | Bloqueado | não está na coluna `pronto` |
| `REQ-010` | Garantir no armazenamento que login e e-mail de conta são únicos | Bloqueado | não está na coluna `pronto` |
| `REQ-012` | Autenticar chamada não interativa por credencial de aplicação | Refinamento | não está na coluna `pronto` |
| `REQ-028` | Registrar quem decidiu cada transição de estado editorial | Refinamento | não está na coluna `pronto` |
| `REQ-030` | Sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado | Bloqueado | não está na coluna `pronto` |
| `REQ-032` | Editar o corpo do conteúdo em blocos, com um formato de armazenamento declarado | Bloqueado | não está na coluna `pronto` |
| `REQ-044` | Dar prazo e limite de tentativa ao atestado de senha de conteúdo | Bloqueado | não está na coluna `pronto` |
| `REQ-051` | Dar lixeira à mídia pelo mesmo comportamento de fábrica do conteúdo | Bloqueado | não está na coluna `pronto` |
| `REQ-069` | Decidir o atalho de confiança do autor do conteúdo e de quem modera sob a mesma sanitização | Bloqueado | não está na coluna `pronto` |
| `REQ-084` | Enviar ao serviço de reputação apenas o que a classificação exige | Bloqueado | não está na coluna `pronto` |
| `REQ-092` | Proteger o arquivo de exportação por verificação de identidade | Bloqueado | não está na coluna `pronto` |
| `REQ-094` | Declarar a retenção do registro de solicitação concluída | Bloqueado | não está na coluna `pronto` |
| `REQ-120` | Exportar e importar o conteúdo do site num formato declarado | Bloqueado | não está na coluna `pronto` |
| `REQ-129` | Pedir conta ou site numa instalação em rede, com cadastro pendente que reserva o nome | Bloqueado | não está na coluna `pronto` |
| `REQ-130` | Validar o domínio do e-mail contra as listas de permitidos e banidos da rede | Backlog | não está na coluna `pronto` |
| `REQ-131` | Ativar o cadastro pendente criando a conta e, se pedido, o site | Backlog | não está na coluna `pronto` |
| `REQ-132` | Não avançar o estado do cadastro num caminho de erro | Backlog | não está na coluna `pronto` |
| `REQ-133` | Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída | Backlog | não está na coluna `pronto` |
| `REQ-134` | Preservar o estado "criado e ainda não ativado" do site da rede | Backlog | não está na coluna `pronto` |
| `REQ-135` | Declarar a retenção do cadastro já ativado e do registro de cadastro | Bloqueado | não está na coluna `pronto` |
| `REQ-138` | Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela | Bloqueado | não está na coluna `pronto` |
| `REQ-144` | Fechar a autorização da operação nomeada, e registrar quando ela é elevada | Bloqueado | não está na coluna `pronto` |
| `REQ-160` | Limitar a taxa de toda superfície de entrada | Bloqueado | não está na coluna `pronto` |
| `REQ-161` | Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio | Bloqueado | não está na coluna `pronto` |
| `REQ-162` | Declarar os pontos de extensão com contrato explícito | Bloqueado | não está na coluna `pronto` |
| `REQ-165` | Decidir se o cache de objeto nasce persistente, e dar significado real à expiração | Bloqueado | não está na coluna `pronto` |
| `REQ-169` | Declarar a integridade referencial na estrutura de dados | Bloqueado | não está na coluna `pronto` |
| `REQ-177` | Tornar interativo o conteúdo renderizado sem recarregar a página | Bloqueado | não está na coluna `pronto` |

## O que tem nesta pasta

```
index.md                     este roteiro
do-not-rewrite.md            o que este pacote recusa reescrever
.specify/README.md           o pacote descrito pelo agente que o escreveu
memory/constitution.md       os limites que valem para tudo
.specify/specs/NNN-<feature>/
  spec.md                    o quê e por quê, sem tecnologia
  plan.md                    como, com a stack e o modelo de dados
  tasks.md                   em que ordem, um checkbox por tarefa
.specify/index.json          o mesmo conteúdo em dados, que é o que a tela do Studio lê
```
