# O que não se reescreve: wordpress

30 cards do backlog do sistema analisado ficaram fora deste pacote, de propósito. Nenhuma spec os cobre e nenhuma tarefa os implementa: não é trabalho pendente, é escopo recusado. Reescrever qualquer um deles é trabalho que ninguém pediu, e num sistema legado essa costuma ser a maior parte do código.

Se alguma coisa aqui precisar existir, o caminho é voltar pelo Kanban do Studio e gerar o pacote de novo. Nada disto se decide no meio da implementação.

| card | título | coluna em que parou | por que ficou fora |
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

A ordem do que SE escreve está em `index.md`.
