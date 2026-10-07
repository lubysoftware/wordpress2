# Pacote Spec Kit — `wordpress`

> Gerado em 2026-10-07 pelo agente `lubylegado-speckit`, a partir da engenharia reversa de **WordPress Core 7.1.2** (distribuição empacotada, 3.378 arquivos, 1.467 deles PHP, 634.999 linhas, 71 módulos medidos, 18 tabelas, zero arquivo de teste).
> Entrada: `backlog/kanban.json` (a seleção) e `backlog/backlog.json` (o conteúdo dos cards), mais `soul.md`, `domain.md`, `permissions.md`, `use-cases/`, `erd-complete.md`, `refactor/decision.json`, `refactor/tech-stack.json` e as 23 respostas humanas de `questions.md`.

## 1. O que é este pacote, e de onde ele veio

Este é o contrato do que será construído num projeto **novo**, vazio. Ele não é código e não descreve o sistema velho: descreve o sistema a construir, com cada afirmação rastreada até o card, o caso de uso e o arquivo do legado que a sustentam.

O alvo foi fixado por decisão humana registrada nas respostas 1 a 5 e 15 a 18 de [`questions.md`](../questions.md): **um porte do núcleo para TypeScript, com comportamento observável idêntico, partindo de instalação nova, sem dado a migrar.** Não é modernização e não é redesenho. Quem for construir precisa ler a [constituição](memory/constitution.md) antes de qualquer tarefa, porque é ela que carrega essa distinção.

| número | valor |
|---|---:|
| cards no kanban | 181 |
| cards selecionados (coluna `pronto`) | 151 |
| cards fora da seleção | 30 |
| features geradas | 15 |
| histórias de usuário | 136 |
| critérios de aceite | 621 |
| tarefas | 301 |
| cards de descarte (`wont`) dentro da seleção | 15 |
| perguntas em aberto | 58 |

**Três coisas que você precisa saber sobre a seleção antes de confiar nela.**

1. **Ninguém moveu card nenhum na tela.** O `kanban.json` registra `moved_by_human: false` para os 181 cards, logo as colunas são as que o próprio backlog propôs quando foi gerado, e não uma curadoria feita no Studio. A seleção é legítima como ponto de partida e **não** é uma escolha humana de escopo.
2. **A seleção é anterior às respostas humanas.** O backlog foi gerado em 2026-10-06 e as 23 respostas de `questions.md` foram escritas depois, na fase de revisão. Em 21 cards as duas fontes se contradizem, e a seção 5 é o registro disso. Este pacote **não** escolhe entre elas.
3. **Os 15 cards de prioridade `wont` não viraram história.** Eles estão na coluna `pronto`, têm critério verificável e entraram no pacote, mas um descarte não tem comportamento a construir: cada um está na seção **Fora de escopo** da spec da sua feature, com o motivo registrado no card e a forma de conferir que o descarte foi respeitado.

## 2. Como usar

1. **Copie a pasta `speckit/` inteira para o projeto novo.** Ela é autocontida: constituição, uma pasta por feature e o índice que a interface lê.
2. **Leia `memory/constitution.md` primeiro**, e releia a cada tarefa. São oito princípios e uma lista de decisões que o agente de codificação não toma sozinho.
3. **Defina a stack.** A linguagem está nomeada (TypeScript, pela resposta 15), e os 17 slots de `refactor/tech-stack.json` **não estão decididos**: são pesquisa, com um candidato recomendado por slot e a razão dele. Cada `plan.md` lista os slots da sua feature. Quem define é quem constrói.
4. **Resolva os conflitos da seção 5 antes de tocar nas features 005, 010, 011, 013 e 014.** Em cada uma delas há história obrigatória que contradiz uma resposta humana, e construir qualquer um dos dois lados joga fora o trabalho do outro.
5. **Pegue a primeira feature da ordem da seção 3** e leia nesta sequência: `spec.md` (o quê e por quê), `plan.md` (como), `tasks.md` (em que ordem). Execute `tasks.md` item por item, na ordem; `[P]` marca o que pode ir em paralelo.
6. **Sobre os links deste pacote:** os artefatos citam a análise por caminho relativo (`../../../domain.md`, por exemplo). Se a pasta for copiada para longe da análise, os links deixam de abrir e passam a valer como citação. Leve a pasta `_reversa_sdd/` junto, ou aceite que a evidência fica a uma busca de distância.

## 3. A ordem sugerida entre as features

Ordem topológica pelas dependências dos cards (`depends_on`), com empate resolvido pela ordem dos épicos no backlog. Não é ordem de importância: é a ordem em que cada feature encontra pronto o que precisa.

| # | feature | histórias | critérios | tarefas | depende de |
|---:|---|---:|---:|---:|---|
| 1 | [`001-identidade-e-acesso`](specs/001-identidade-e-acesso/spec.md) | 11 | 52 | 24 | nada |
| 2 | [`003-classificacao-do-conteudo`](specs/003-classificacao-do-conteudo/spec.md) | 5 | 20 | 12 | `001` |
| 3 | [`004-leitura-publica`](specs/004-leitura-publica/spec.md) | 8 | 33 | 18 | `001` |
| 4 | [`012-rede-multisite`](specs/012-rede-multisite/spec.md) | 0 | 0 | 0 | nada |
| 5 | [`015-plataforma-transversal`](specs/015-plataforma-transversal/spec.md) | 6 | 29 | 14 | `001` |
| 6 | [`006-biblioteca-de-midia`](specs/006-biblioteca-de-midia/spec.md) | 9 | 39 | 20 | `001`, `015` |
| 7 | [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md) | 6 | 26 | 14 | `015` |
| 8 | [`002-autoria-e-publicacao`](specs/002-autoria-e-publicacao/spec.md) | 11 | 48 | 24 | `001`, `003`, `011` |
| 9 | [`005-retencao-e-descarte`](specs/005-retencao-e-descarte/spec.md) | 8 | 34 | 18 | `001`, `002`, `011` |
| 10 | [`007-interacao-publica-e-moderacao`](specs/007-interacao-publica-e-moderacao/spec.md) | 18 | 79 | 39 | `001`, `004`, `005`, `011` |
| 11 | [`008-privacidade-e-dados-pessoais`](specs/008-privacidade-e-dados-pessoais/spec.md) | 8 | 39 | 18 | `001`, `011` |
| 12 | [`010-operacao-do-software`](specs/010-operacao-do-software/spec.md) | 14 | 74 | 30 | `001`, `011` |
| 13 | [`013-superficies-programaticas`](specs/013-superficies-programaticas/spec.md) | 9 | 43 | 20 | `004`, `007`, `015` |
| 14 | [`014-integracao-externa`](specs/014-integracao-externa/spec.md) | 8 | 39 | 18 | `002`, `010`, `015` |
| 15 | [`009-apresentacao-e-personalizacao`](specs/009-apresentacao-e-personalizacao/spec.md) | 15 | 66 | 32 | `001`, `002`, `003`, `004`, `014` |

Duas ressalvas sobre esta ordem. **`012-rede-multisite` aparece em quarto lugar por não ter dependência, e não tem nada a construir**: o único card de EP-12 na seleção é um descarte, e os 12 que especificariam a rede ficaram fora (seção 4). E **`011-trabalho-agendado` é a feature de que mais gente depende** (seis features esperam por ela) e é a que tem o conflito mais consequente do pacote: decidi-lo é a primeira coisa a fazer.

## 4. O que ficou de fora

Os 30 cards abaixo **não** entraram no pacote, porque não estão na coluna `pronto`. Nenhum card foi excluído por falta de critério de aceite: os 151 selecionados têm critério, e os 181 do backlog também.

| card | título | épico | coluna | por quê |
|---|---|---|---|---|
| REQ-004 | Recusar autenticação sem revelar se a conta existe | EP-1 | `bloqueado` | não está na coluna `pronto` |
| REQ-005 | Suspender o acesso após tentativas falhas repetidas | EP-1 | `bloqueado` | não está na coluna `pronto` |
| REQ-008 | Encerrar as sessões abertas quando a senha da conta é trocada | EP-1 | `bloqueado` | não está na coluna `pronto` |
| REQ-010 | Garantir no armazenamento que login e e-mail de conta são únicos | EP-1 | `bloqueado` | não está na coluna `pronto` |
| REQ-012 | Autenticar chamada não interativa por credencial de aplicação | EP-1 | `refinamento` | não está na coluna `pronto` |
| REQ-028 | Registrar quem decidiu cada transição de estado editorial | EP-2 | `refinamento` | não está na coluna `pronto` |
| REQ-030 | Sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado | EP-2 | `bloqueado` | não está na coluna `pronto` |
| REQ-032 | Editar o corpo do conteúdo em blocos, com um formato de armazenamento declarado | EP-2 | `bloqueado` | não está na coluna `pronto` |
| REQ-044 | Dar prazo e limite de tentativa ao atestado de senha de conteúdo | EP-4 | `bloqueado` | não está na coluna `pronto` |
| REQ-051 | Dar lixeira à mídia pelo mesmo comportamento de fábrica do conteúdo | EP-5 | `bloqueado` | não está na coluna `pronto` |
| REQ-069 | Decidir o atalho de confiança do autor do conteúdo e de quem modera sob a mesma sanitização | EP-7 | `bloqueado` | não está na coluna `pronto` |
| REQ-084 | Enviar ao serviço de reputação apenas o que a classificação exige | EP-7 | `bloqueado` | não está na coluna `pronto` |
| REQ-092 | Proteger o arquivo de exportação por verificação de identidade | EP-8 | `bloqueado` | não está na coluna `pronto` |
| REQ-094 | Declarar a retenção do registro de solicitação concluída | EP-8 | `bloqueado` | não está na coluna `pronto` |
| REQ-120 | Exportar e importar o conteúdo do site num formato declarado | EP-10 | `bloqueado` | não está na coluna `pronto` |
| REQ-129 | Pedir conta ou site numa instalação em rede, com cadastro pendente que reserva o nome | EP-12 | `bloqueado` | não está na coluna `pronto` |
| REQ-130 | Validar o domínio do e-mail contra as listas de permitidos e banidos da rede | EP-12 | `backlog` | não está na coluna `pronto` |
| REQ-131 | Ativar o cadastro pendente criando a conta e, se pedido, o site | EP-12 | `backlog` | não está na coluna `pronto` |
| REQ-132 | Não avançar o estado do cadastro num caminho de erro | EP-12 | `backlog` | não está na coluna `pronto` |
| REQ-133 | Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída | EP-12 | `backlog` | não está na coluna `pronto` |
| REQ-134 | Preservar o estado "criado e ainda não ativado" do site da rede | EP-12 | `backlog` | não está na coluna `pronto` |
| REQ-135 | Declarar a retenção do cadastro já ativado e do registro de cadastro | EP-12 | `bloqueado` | não está na coluna `pronto` |
| REQ-138 | Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela | EP-13 | `bloqueado` | não está na coluna `pronto` |
| REQ-144 | Fechar a autorização da operação nomeada, e registrar quando ela é elevada | EP-13 | `bloqueado` | não está na coluna `pronto` |
| REQ-160 | Limitar a taxa de toda superfície de entrada | EP-15 | `bloqueado` | não está na coluna `pronto` |
| REQ-161 | Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio | EP-15 | `bloqueado` | não está na coluna `pronto` |
| REQ-162 | Declarar os pontos de extensão com contrato explícito | EP-15 | `bloqueado` | não está na coluna `pronto` |
| REQ-165 | Decidir se o cache de objeto nasce persistente, e dar significado real à expiração | EP-15 | `bloqueado` | não está na coluna `pronto` |
| REQ-169 | Declarar a integridade referencial na estrutura de dados | EP-15 | `bloqueado` | não está na coluna `pronto` |
| REQ-177 | Tornar interativo o conteúdo renderizado sem recarregar a página | EP-9 | `bloqueado` | não está na coluna `pronto` |

**Doze destes cards já têm a decisão que os travava.** Eles estão nomeados em perguntas de `questions.md` que foram respondidas depois de o backlog ter sido gerado, o que significa que a coluna deles está desatualizada e que a pessoa que monta a seleção pode querer trazê-los de volta. Não foi este agente que os trouxe: a seleção não é dele.

| card | a resposta que o destrava |
|---|---|
| REQ-004 | resposta 6 (manter a distinção entre conta inexistente e senha incorreta) |
| REQ-005 | resposta 19 (o legado não tem limite de taxa; o limite fica na implantação) |
| REQ-008 | resposta 7 (trocar a senha não revoga nada) |
| REQ-028 | resposta 20 (o núcleo não declara prazo de retenção) |
| REQ-032 | resposta 15 (o lado cliente vem do repositório de origem) |
| REQ-044 | resposta 8 (manter o atestado atual: dez dias, sem prazo no servidor) |
| REQ-051 | resposta 9 (a exclusão de mídia continua definitiva) |
| REQ-084 | resposta 13 (o serviço de reputação é extensão, não núcleo) |
| REQ-094 | resposta 20 (nenhum prazo novo é declarado) |
| REQ-129 | resposta 4 (a rede fica no escopo como capacidade do produto) |
| REQ-160 | resposta 19 (limite de taxa fora do núcleo) |
| REQ-177 | resposta 15 (o lado cliente vem do repositório de origem) |

O caso mais consequente é **REQ-129**: ele trava o épico de rede inteiro, e a resposta 4 decidiu que a rede **fica** no escopo do porte, com o modo de subdiretório como padrão, porque o núcleo que está sendo clonado traz os arquivos de rede e as seis tabelas. Enquanto ele não voltar, `012-rede-multisite` continua vazia e o pacote não especifica nada de rede.

## 5. Os 21 conflitos entre a seleção e as respostas humanas

Esta é a seção mais importante do pacote, e ela existe porque **duas fontes humanas discordam**: o backlog, que foi escrito propondo melhorias ao legado, e as 23 respostas de `questions.md`, escritas depois, que fixaram o porte como idêntico e preservaram o legado em quase todos os pontos em que o backlog propunha mudar.

Nenhum destes conflitos foi resolvido aqui. Resolver é decisão humana, e está na lista de [Não negociável](memory/constitution.md#não-negociável) da constituição. Cada linha abaixo também está registrada na spec da sua feature, na seção Fora de escopo (descartes) ou Perguntas em aberto (histórias).

| card | feature | tipo | a decisão que o contradiz | o conflito |
|---|---|---|---|---|
| REQ-052 | [`005-retencao-e-descarte`](specs/005-retencao-e-descarte/spec.md) | história | resposta 10, que cita o card | o card quer coleta da lixeira sem depender de visita ao painel; a resposta mantém o disparo por requisição ao próprio host e chama a consequência de comportamento do produto |
| REQ-107 | [`010-operacao-do-software`](specs/010-operacao-do-software/spec.md) | história | resposta 11 | o card quer recusar pacote sem assinatura verificada; a resposta mantém a tolerância, porque exigir assinatura tornaria o sistema incompatível com o ecossistema que ele clona |
| REQ-122 | [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md) | história | resposta 10 | o card exige gatilho que não seja a requisição do site para si mesmo; é literalmente o que a resposta manda preservar |
| REQ-124 | [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md) | história | respostas 10 e 20 | o card cria registro de execução com prazo de retenção declarado; o legado não registra nada e a resposta 20 proíbe inventar prazo |
| REQ-125 | [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md) | história | resposta 10 | o card quer a falha do gatilho visível e avisada; a resposta preserva a falha silenciosa por projeto |
| REQ-149 | [`014-integracao-externa`](specs/014-integracao-externa/spec.md) | história | resposta 12 | o card proíbe canal sem cifra e proíbe repetir sem cifra após falha de TLS; a resposta mantém os 13 canais e as 7 repetições |
| REQ-085 | [`007-interacao-publica-e-moderacao`](specs/007-interacao-publica-e-moderacao/spec.md) | descarte | resposta 12, que cita o card | o descarte remove o rebaixamento para canal sem cifra no serviço de reputação; a resposta mantém o rebaixamento como dívida herdada reproduzida de propósito |
| REQ-121 | [`010-operacao-do-software`](specs/010-operacao-do-software/spec.md) | descarte | resposta 14, que cita o card | o descarte remove o editor de arquivos do painel; a resposta decide que nenhuma das três superfícies sai, e que `wont` vale como não mudar e nunca como não portar |
| REQ-148 | [`013-superficies-programaticas`](specs/013-superficies-programaticas/spec.md) | descarte | resposta 14, que cita o card | o descarte remove a superfície programática herdada; a resposta a mantém, por causa dos clientes históricos |
| REQ-179 | [`013-superficies-programaticas`](specs/013-superficies-programaticas/spec.md) | descarte | resposta 14, que cita o card | o descarte remove o canal assíncrono do painel; a resposta o mantém, observando que é por ele que metade do painel conversa |
| REQ-150 | [`014-integracao-externa`](specs/014-integracao-externa/spec.md) | descarte | resposta 12, que cita o card | o descarte remove a repetição sem cifra nos endpoints de infraestrutura, inclusive o de somas de verificação; a resposta mantém |
| REQ-157 | [`014-integracao-externa`](specs/014-integracao-externa/spec.md) | descarte | respostas 10 e 19 | o descarte remove a publicação por caixa postal; as duas respostas mandam preservar a trava de cinco minutos desse caminho, que só existe se ele for portado |
| REQ-158 | [`014-integracao-externa`](specs/014-integracao-externa/spec.md) | descarte | resposta 18 | o descarte remove os três conectores de modelo de linguagem; a resposta manda portar os três como o núcleo os traz |
| REQ-128 | [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md) | descarte | resposta 10, por consequência | o descarte remove o modo alternativo de disparo, que existe como contorno da falha que REQ-122 propõe eliminar; se a resposta prevalecer, o contorno volta a ter razão de ser |
| REQ-017 | [`001-identidade-e-acesso`](specs/001-identidade-e-acesso/spec.md) | descarte | resposta 5, por consequência | o descarte remove as 11 concessões de nível numérico; a resposta fixa a matriz de fábrica como a matriz real, e ela tem as 11 |
| REQ-018 | [`001-identidade-e-acesso`](specs/001-identidade-e-acesso/spec.md) | descarte | doutrina das respostas 1 a 5 | o descarte remove a reposição em massa de papéis na atualização, coerente com o ADR 0001 e divergente de um comportamento observável do caminho de atualização |
| REQ-046 | [`004-leitura-publica`](specs/004-leitura-publica/spec.md) | descarte | doutrina das respostas 1 e 14 | o descarte remove o gerenciador de links e o índice público; o instalador do legado ainda cria a tabela, e a resposta 14 recusou remoção de superfície em caso idêntico |
| REQ-081 | [`007-interacao-publica-e-moderacao`](specs/007-interacao-publica-e-moderacao/spec.md) | descarte | resposta 14, por consequência | o descarte remove a notificação de link sem prova de origem; a resposta mantém as superfícies herdadas e nomeia o pingback, sem mencionar o trackback |
| REQ-136 | [`012-rede-multisite`](specs/012-rede-multisite/spec.md) | descarte | resposta 4 | o descarte remove um dos quatro eixos de supervisão do site da rede; a resposta mantém a rede no escopo porque "um porte sem elas não é idêntico", e a regra N4 registra que cada eixo tem gancho de entrada e de saída |
| REQ-170 | [`015-plataforma-transversal`](specs/015-plataforma-transversal/spec.md) | descarte | resposta 3 | o descarte remove a substituição de componente por arquivo na pasta de conteúdo; a resposta é literal ao dizer que o ponto de extensão é o produto |
| REQ-178 | [`015-plataforma-transversal`](specs/015-plataforma-transversal/spec.md) | descarte | resposta 15 | o descarte se justifica por o leitor não existir nesta árvore; a resposta manda obter o lado cliente do repositório de origem, onde ele existe |

**Seis deles são histórias obrigatórias ou desejáveis**, não descartes: REQ-052, REQ-107, REQ-122, REQ-124, REQ-125 e REQ-149. É a diferença entre um pacote que alguém pode começar a executar e um pacote que precisa de uma conversa antes: construir qualquer um dos dois lados dessas seis joga fora o trabalho do outro.

## 6. Perguntas em aberto

58 perguntas, consolidadas das 15 specs. É a pauta da primeira conversa com quem conhece o negócio, e a maioria delas não é dúvida técnica: é decisão que ninguém tomou.

### [`001-identidade-e-acesso`](specs/001-identidade-e-acesso/spec.md)

- [ ] CA-9.4 (REQ-016) exige que nenhuma das 93 capacidades verificadas no código fique fora da matriz declarada, mas a matriz de fábrica tem 50 concessões reais e `permissions.md` identifica apenas quatro ausentes que entram por ponto de extensão. Quais são as demais, e a matriz deve crescer até cobrir as 93 ou o critério deve ser reescrito para as que têm responsável? É o único critério deste pacote sem nenhum teste registrado em `backlog/tests.md`.
- [ ] US-10 (REQ-011) emite e revoga credencial de aplicação, mas quem autentica com ela é REQ-012, que ficou na coluna `refinamento` e não entrou neste pacote. Construir a emissão sem o consumo, ou esperar REQ-012? As features 013 e 015 esperam por ele.
- [ ] A credencial de aplicação do legado não tem escopo nem prazo e vale exatamente o que a conta vale (`permissions.md` 8.2). A resposta 7 decidiu que ela sobrevive à troca de senha, mas não disse se o porte lhe dá escopo. Dar escopo é divergência do idêntico e exige decisão humana registrada (P1 da constituição).
- [ ] A matriz papel por capacidade não existe como dado no legado: foi derivada executando simbolicamente as oito funções de povoamento. Se a instalação executável de referência da resposta 16 mostrar matriz diferente da derivada, qual das duas vale como oráculo?

### [`003-classificacao-do-conteudo`](specs/003-classificacao-do-conteudo/spec.md)

- [ ] A junção de classificação do legado é polimórfica por convenção: a coluna de objeto aponta para conteúdo sem nada declarar, e nada impede outro tipo de objeto. O modelo novo mantém a junção genérica ou a prende ao registro de conteúdo? A resposta 2 proíbe que a decisão mude o que é observável, o que exclui declarar restrição que recuse hoje o que o legado aceita.
- [ ] A contagem de uso de cada termo é dado gravado e sai de sincronia quando alguém escreve na junção por fora do caminho normal. Recalcular na leitura é mais correto e muda o que a interface devolve nesse caso de borda. Manter o valor gravado, com a possibilidade de divergir, é o comportamento idêntico. Ninguém decidiu.

### [`004-leitura-publica`](specs/004-leitura-publica/spec.md)

- [ ] US-7 (REQ-045) pré-busca o próximo destino antes do clique, e metade do comportamento do módulo correspondente do legado está no lado cliente, ausente desta árvore (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem: até isso acontecer, os critérios de borda desta história não são verificáveis contra o legado.
- [ ] US-2 (REQ-039) escolhe a apresentação por hierarquia declarada de modelos, e os modelos vêm do tema, que está na feature 009. Qual tema serve de oráculo para o teste de paridade desta história?

### [`012-rede-multisite`](specs/012-rede-multisite/spec.md)

- [ ] A resposta 4 resolveu REQ-129, que é o card que trava o épico inteiro. Os 12 cards restantes de EP-12 devem voltar à seleção para que esta feature exista de verdade? A decisão é de quem monta a seleção, não deste pacote.
- [ ] A identidade é global à rede, e o vínculo entre conta e site mora dentro do nome da chave do metadado de autorização. A resposta 4 manda preservar esse comportamento ainda que o armazenamento seja normalizado por baixo. Nenhuma história deste pacote carrega essa regra, e ela é a decisão mais consequente de um porte de rede.
- [ ] O estado "criado e ainda não ativado" de um site da rede usa um terceiro valor numa coluna que o dicionário de dados descreve como de dois valores (regra N2 do domínio). Quem portar lendo o dicionário produz um estado a menos, e a falha aparece só quando um site novo da rede é criado.
- [ ] REQ-136 depende de `REQ-133` (Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída), que ficou na coluna `backlog` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

### [`015-plataforma-transversal`](specs/015-plataforma-transversal/spec.md)

- [ ] REQ-159 exige, no último critério, que nenhum caminho de erro seja silencioso por omissão, com verificação automatizada que falha ao encontrar tratamento de erro sem registro. O legado tem silêncios estruturais que respostas humanas mandaram preservar: o caso "sem assinatura" silenciado fora do modo de depuração (resposta 11) e os cinco pontos do processamento de imagem sem registro (regra M4). P7 da constituição resolve metade do conflito, porque permite acrescentar registro sem mudar o fluxo; a outra metade, que é recusar o silêncio, precisa de decisão.
- [ ] O nome deste épico inclui limite de taxa, e nenhuma história o especifica: REQ-160 ficou `bloqueado`, e a resposta 19 o põe fora do núcleo, como decisão de implantação, para não inventar número que o produto nunca teve. A consequência precisa estar escrita para quem recebe o pacote: o produto portado nasce sem limite de taxa em superfície alguma, exatamente como o legado, e os dois únicos freios continuam sendo travas de tempo de 60 segundos e de 5 minutos.
- [ ] A resposta 21 autorizou gerar spec para 15 módulos que não tinham nenhuma, começando pelos cinco mais dependidos: camada de dados, arranque, formatação e escape, núcleo utilitário e telas do painel. Neste pacote, só a camada de dados tem história própria (REQ-164); os outros quatro aparecem apenas como módulos tocados por cards cujo assunto é outro. É a maior lacuna estrutural da entrega, e ela atravessa as 15 features.
- [ ] REQ-166 traduz a interface a partir de catálogo declarado, e depende de REQ-161, que ficou `bloqueado`. Sem a separação entre domínio e apresentação, a tradução continua entrando em 68 dos 71 módulos, o que é a forma medida do problema que REQ-161 descreve.
- [ ] US-4 (REQ-166) depende de `REQ-161` (Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-6 (REQ-168) depende de `REQ-010` (Garantir no armazenamento que login e e-mail de conta são únicos), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-170 depende de `REQ-162` (Declarar os pontos de extensão com contrato explícito), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-170 depende de `REQ-165` (Decidir se o cache de objeto nasce persistente, e dar significado real à expiração), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

### [`006-biblioteca-de-midia`](specs/006-biblioteca-de-midia/spec.md)

- [ ] US-5 (REQ-060) exige informar e registrar a falha ao processar imagem, e a regra M4 do domínio registra que no legado ela é silenciosa nos cinco pontos do processamento. Acrescentar registro é permitido por P7 da constituição; informar o ator muda o que ele vê e é divergência que precisa de decisão humana registrada.
- [ ] A redução da imagem na ingestão troca o arquivo servido por uma cópia com sufixo no nome, e o sufixo aparece no endereço público. Se o modelo novo mudar a forma do nome, muda endereço observável. Ninguém decidiu se o sufixo é contrato.
- [ ] US-8 (REQ-063) apaga o arquivo que deixou de ser referenciado. No legado não existe rotina que faça isso, e a resposta 2 diz que o porte parte de instalação nova, sem órfão herdado. Esta história cria comportamento que o legado não tem: é melhoria deliberada ou foi escrita assumindo dado legado a limpar?

### [`011-trabalho-agendado`](specs/011-trabalho-agendado/spec.md)

- [ ] Conflito registrado, não resolvido, e o mais consequente desta feature. REQ-122 exige, em CA2, que o gatilho não seja uma requisição do próprio site para si mesmo disparada por visita de terceiro, e exige que um evento marcado para um instante execute naquele instante num site sem visita alguma. A resposta 10 de `questions.md` decidiu manter exatamente o que o card recusa, com a justificativa escrita de que "trocar por agendador do sistema produz um produto que se comporta diferente no primeiro dia". As duas decisões são humanas e se excluem: nenhuma implementação satisfaz as duas.
- [ ] REQ-124 exige registrar o que a fila executou, com instante, duração, resultado e prazo de retenção declarado, e REQ-125 exige avisar quem administra depois de um prazo sem nenhuma execução. O legado não guarda registro de execução nenhum, e a resposta 20 proíbe inventar prazo de retenção que o produto não tem. Acrescentar registro sem mudar o fluxo é permitido por P7 da constituição; tornar o registro e o aviso obrigatórios é divergência que precisa de decisão humana registrada.
- [ ] O protocolo de requisição ao próprio site está implementado quatro vezes no legado. Unificar as quatro é invisível de fora e portanto compatível com P1, mas muda o que uma extensão que intercepte uma das quatro consegue interceptar. Unificar, ou portar as quatro?
- [ ] Se a resposta 10 prevalecer, três das seis histórias desta feature (REQ-122, REQ-124 e REQ-125) perdem a razão de ser, e o épico fica com o controle de concorrência, o reagendamento e a declaração de que desligar o gatilho não desliga a fila. Isso precisa ser dito por quem decide, porque é a diferença entre uma feature de seis histórias e uma de três.

### [`002-autoria-e-publicacao`](specs/002-autoria-e-publicacao/spec.md)

- [ ] REQ-030 (sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado) ficou `bloqueado` e não entrou no pacote. Esta feature grava corpo de conteúdo sem que nada aqui diga como ele é sanitizado, e a regra P8 do domínio põe o privilégio de marcação bruta também no papel de editor, não só no de administrador. Quem construir US-1 a US-8 sem REQ-030 decide a sanitização sozinho.
- [ ] REQ-032 (formato declarado de armazenamento do corpo em blocos) ficou `bloqueado` pela ausência do lado cliente nesta árvore, e a resposta 15 resolve a ausência mandando construir a partir do repositório de origem. O card volta à seleção antes de esta feature começar, ou o corpo é portado sem formato declarado?
- [ ] REQ-028 (registrar quem decidiu cada transição de estado editorial) ficou em `refinamento`. US-8 publica conteúdo de outro autor preservando a autoria, e US-7 o submete para revisão, mas nada no pacote especifica o registro de quem decidiu a transição. Sem ele, a cadeia editorial existe e não é auditável.

### [`005-retencao-e-descarte`](specs/005-retencao-e-descarte/spec.md)

- [ ] Conflito registrado, não resolvido. US-5 (REQ-052) exige, em CA-5.1, que o agendamento da coleta exista numa instalação nova sem depender de ninguém ter entrado no painel. A resposta 10 de `questions.md`, que cita este card na lista de specs afetadas, decidiu manter o disparo por requisição ao próprio host e declarou que a consequência de um site sem visita nunca executar a própria limpeza é comportamento do produto, não acidente. As duas decisões são humanas e estão em sentidos opostos: construir US-5 como está escrita rompe a paridade, construir a paridade deixa CA-5.1 falso. Este pacote não escolhe.
- [ ] CA-5.5 (REQ-052) exige que cada execução registre quantos registros apagou, e o legado não guarda registro nenhum de execução (P7 da constituição). Registro novo que não altera o fluxo é permitido por P7; o critério, porém, torna o registro obrigatório, o que precisa ser aceito explicitamente como divergência.
- [ ] REQ-051 (dar lixeira à mídia pelo mesmo comportamento do conteúdo) ficou `bloqueado` por decisão humana, e a resposta 9 já a tomou: a exclusão de mídia continua definitiva, sem lixeira e sem aviso. US-8 reparenta anexos ao apagar conteúdo em definitivo, então a assimetria entre conteúdo e mídia precisa estar visível para quem constrói. O card volta à seleção, agora que a decisão existe?

### [`007-interacao-publica-e-moderacao`](specs/007-interacao-publica-e-moderacao/spec.md)

- [ ] Conflito de escopo registrado, não resolvido. US-16 (REQ-082) e US-17 (REQ-083) especificam o comportamento do serviço externo de reputação, e a resposta 13 decidiu que ele é extensão empacotada e não núcleo: o que o porte preserva é a cascata local de moderação e o ponto de extensão que permite a um classificador externo entrar. Se a resposta valer, as duas histórias saem do clone do núcleo e viram requisito de extensão; se não valer, falta decidir a minimização que a própria resposta exige.
- [ ] REQ-069 (decidir o atalho de confiança do autor e de quem modera sob a mesma sanitização) ficou `bloqueado` e não entrou. US-4 constrói a cascata cujo primeiro passo é exatamente esse atalho, sem que nada no pacote diga qual sanitização se aplica a quem entra por ele.
- [ ] US-18 (REQ-180) serve a imagem de quem comenta sem enviar o dado dele a terceiro, e no legado essa imagem vem de um serviço externo que recebe o endereço de e-mail em forma de resumo criptográfico. É divergência deliberada do comportamento observável e precisa de decisão humana registrada (P1 da constituição).

### [`008-privacidade-e-dados-pessoais`](specs/008-privacidade-e-dados-pessoais/spec.md)

- [ ] REQ-092 (proteger o arquivo de exportação por verificação de identidade) ficou `bloqueado`. No legado o arquivo fica acessível por endereço com chave durante três dias, sem verificação de identidade, e US-7 apenas o apaga no prazo. Quem construir esta feature entrega a exportação com a proteção do legado, que é a chave no endereço, e isso precisa estar explícito para quem opera.
- [ ] REQ-094 (declarar a retenção do registro de solicitação concluída) ficou `bloqueado` por falta de decisão, e a resposta 20 já decidiu: o núcleo não declara prazo nenhum, e onde o legado encerra por propósito o porte preserva. O card volta à seleção com a decisão registrada, ou fica fora?
- [ ] A chave de confirmação é guardada com resumo criptográfico no mesmo campo em que o conteúdo guarda senha em texto claro (regra D6). O modelo novo mantém o campo compartilhado, com significados diferentes por tipo de registro, ou separa os dois? Separar é mais claro e muda o que um programa de terceiro lê.

### [`010-operacao-do-software`](specs/010-operacao-do-software/spec.md)

- [ ] Conflito registrado, não resolvido, e explícito. US-2 (REQ-107) exige verificar a autenticidade do pacote antes de o aplicar, recusar o pacote sem prova e não permitir contorno por configuração. A resposta 11 decidiu manter a tolerância do legado: pacote sem assinatura verificada é instalado, e o modo de falha do ADR 0010 é portado como está, porque exigir assinatura tornaria o sistema incompatível com o ecossistema que ele clona. É o conflito mais consequente do pacote, porque a história é `must` e a resposta é explícita.
- [ ] CA-14.4 (REQ-119) exige guardar o resultado de cada execução do diagnóstico com instante, para comparar a evolução entre visitas. A regra registrada no próprio card diz que a tela do legado calcula na hora e não armazena nada. Guardar é melhoria, e melhoria é divergência que precisa de decisão (P1), além de criar um dado com prazo de retenção que a resposta 20 proíbe inventar.
- [ ] REQ-120 (exportar e importar o conteúdo num formato declarado) ficou `bloqueado` e não entrou. US-6 migra esquema de dados, mas o pacote não especifica o formato de intercâmbio de conteúdo, que é o caminho pelo qual uma instalação legada entraria no sistema novo.
- [ ] US-11 (REQ-116) destrava a atualização congelada, e a análise registra que o destravamento do legado existe mas depende de uma invariante não declarada entre dois arquivos. Reproduzir a invariante exige lê-la no código do legado, caso a caso: ela não está escrita em nenhum artefato desta análise.

### [`013-superficies-programaticas`](specs/013-superficies-programaticas/spec.md)

- [ ] REQ-138 (exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela) ficou `bloqueado` e não entrou. É ele que fecharia a falha aberta da camada de rotas, e dois itens desta feature dependem dele. Sem ele, o pacote porta a falha aberta sem nenhuma história que a declare.
- [ ] A execução de operação nomeada pode ser curto-circuitada antes de qualquer validação, e o próprio código do legado avisa que, nesse caminho, a integridade do insumo passa a ser de quem curto-circuitou. REQ-143 especifica a execução e não diz se o curto-circuito entra. Portá-lo é reproduzir um caminho que contorna toda a validação; não portá-lo é divergir de comportamento declarado.
- [ ] REQ-141 registra o acesso à superfície programática, e o legado não registra nada. Vale a mesma ressalva de P7 e da resposta 20: registro novo é permitido, prazo de retenção novo não se inventa.
- [ ] US-1 (REQ-137) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-3 (REQ-140) depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-5 (REQ-142) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-179 depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

### [`014-integracao-externa`](specs/014-integracao-externa/spec.md)

- [ ] Conflito registrado, não resolvido, e explícito. REQ-149 é `must` e exige, em três critérios, que nenhum endereço externo seja escrito sem cifra, que uma verificação automatizada falhe quando encontrar um, e que a falha de negociação segura resulte em erro em vez de tentativa sem cifra. A resposta 12 decidiu o contrário, mantendo os 13 canais sem cifra e as 7 repetições em claro. É o mesmo conflito do descarte REQ-150, agora numa história obrigatória.
- [ ] REQ-153 proíbe guardar credencial de integração em texto recuperável, e a credencial da caixa postal do legado fica em texto puro na configuração e trafega sem cifra. Se o descarte de REQ-157 não valer, as duas decisões se excluem: ou a caixa postal é portada com a credencial em claro, ou REQ-153 é violado na primeira integração.
- [ ] REQ-154 declara prazo de espera e tratamento de erro em toda chamada de saída, e é por esta história que passa a única divergência que a resposta 18 autorizou: definir o tempo limite do adaptador de modelo de linguagem em vez de herdar o default curto do cliente genérico. Quem implementar precisa citar a resposta 18 no código, como manda P1 da constituição.
- [ ] O serviço externo de reputação aparece nas integrações desta feature, e a resposta 13 o põe fora do núcleo clonado, como extensão empacotada. Isso muda o que esta feature precisa entregar, e a decisão de escopo não está registrada em card nenhum.

### [`009-apresentacao-e-personalizacao`](specs/009-apresentacao-e-personalizacao/spec.md)

- [ ] Cinco histórias desta feature dependem de código que não está nesta árvore: o lado cliente do editor, dos recursos de interface, da biblioteca de fontes e do conjunto de ícones (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem, com os pacotes do projeto. Até que esse fonte esteja em mãos, US-11 a US-14 não têm oráculo de paridade.
- [ ] REQ-177 (tornar interativo o conteúdo renderizado sem recarregar a página) ficou `bloqueado` pela mesma ausência e não entrou no pacote. Parte do comportamento de US-11 e US-12 só faz sentido com ele.
- [ ] US-15 (REQ-176) exige entregar ao menos um tema completo junto com o produto. A árvore analisada traz três temas empacotados, e nenhuma resposta humana disse qual deles é o tema de referência do porte, nem se os três entram.
- [ ] US-4 (REQ-099) agenda a aplicação de uma alteração de aparência, e o agendamento depende da fila da feature 011, cujas histórias estão em conflito aberto com a resposta 10. Enquanto esse conflito não se resolver, o comportamento agendado desta história fica indefinido.

## 7. Como este pacote foi conferido

| conferência | resultado |
|---|---|
| critérios de aceite da seleção que nomeiam implementação (arquivo, função, tabela, linguagem) | **0** de 672, varredura em `.reversa/work/lubylegado-speckit/auditar.py` |
| critérios que são desejo sem teste | 11 marcados pela varredura, **todos falsos positivos**: a marca vem de vocabulário de domínio ("negociação segura", "endereço amigável", "chaves confiáveis") e cada um deles tem afirmação verificável |
| critérios de aceite sem tarefa que os satisfaça | **0**: cada história tem tarefa de implementação que satisfaz todos os seus critérios, e tarefa de teste para os que têm caso registrado |
| critérios de descarte sem tarefa | 51, declarados na seção `Sem tarefa` de cada `tasks.md`: afirmam ausência de comportamento e são conferidos na revisão de superfície |
| descrições de card fora do padrão de história ("Como... quero... para...") | **0** de 136 |
| casos de teste registrados nos cards que viraram tarefa de teste | 816 de 816, em 136 tarefas de teste |
| critérios sem nenhum teste registrado em `backlog/tests.md` | **1** (REQ-016 CA4), registrado como pergunta em aberto da feature 001 |
| ciclo em `depends_on` | nenhum, nem entre cards nem entre features |

O que **não** foi conferido, e precisa ser dito: nenhuma afirmação deste pacote foi executada contra o legado, porque não existe instalação executável dele nesta análise. É a resposta 16 de `questions.md` que manda levantá-la, e é a tarefa T001 da feature `015-plataforma-transversal`. Até isso acontecer, os 816 testes dos cards são especificação, não evidência.
