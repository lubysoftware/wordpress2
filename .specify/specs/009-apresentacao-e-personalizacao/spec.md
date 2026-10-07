# Apresentação e personalização

**Origem:** épico EP-9 do backlog do sistema legado (`a aparência do site, e quem a muda sem publicar sem querer`)  
**Cards:** REQ-096, REQ-097, REQ-098, REQ-099, REQ-100, REQ-101, REQ-102, REQ-103, REQ-104, REQ-105, REQ-172, REQ-173, REQ-174, REQ-175, REQ-176

## Por que esta feature existe

A aparência do site, e quem a muda sem publicar sem querer. O épico EP-9 cobre a
pré-visualização antes de a alteração chegar ao visitante, a separação entre a permissão
de salvar e a de aplicar, o relato do estado que de fato foi gravado, o agendamento da
aplicação, o menu de navegação com itens que apontam para conteúdo, classificação ou
endereço externo, a sinalização do item que aponta para o que não existe mais, a
organização de componentes nas áreas do tema, a preservação dessa configuração quando o
tema muda, a troca do tema ativo, o tema de reserva, a declaração e o enfileiramento dos
recursos de interface, a resolução dos estilos declarados pelo tema, a biblioteca de
fontes, o conjunto de ícones e a entrega de ao menos um tema completo com o produto.

Duas características tornam esta a feature mais acoplada do pacote. A alteração de
aparência é guardada como registro de conteúdo, com tipo próprio, o que faz a
personalização herdar autor, data, revisão e agendamento sem nada ter sido escrito para
ela: é a mesma decisão fundadora que permitiu ao editor de blocos existir sem tabela
nova. E os três módulos do legado que servem esta feature, a personalização, os menus e
os componentes de área, formam um ciclo entre si no grafo de dependências, o que
significa que não existe ordem de migração interna entre eles: ou os três entram juntos,
ou nenhum fecha.

## Histórias de usuário

### US-1 — Pré-visualizar alterações de aparência antes de elas chegarem ao visitante

Como administrador, quero ver como o site fica antes de aprovar a mudança de aparência, para não experimentar em produção.

**Critérios de aceite**

- [ ] CA-1.1 Abrir a personalização cria um conjunto de alterações que não afeta o que o visitante vê
- [ ] CA-1.2 A prévia mostra o site com as alterações aplicadas apenas para quem está personalizando
- [ ] CA-1.3 O conjunto pode ser salvo e retomado depois, sem ser aplicado
- [ ] CA-1.4 A aplicação exige a capacidade declarada de administrar a aparência
- [ ] CA-1.5 Arquivo enviado dentro da personalização nasce como rascunho automático, para ser coletado se o conjunto for abandonado
- [ ] CA-1.6 Estado pedido fora dos aceitos é recusado, e o estado de rascunho automático não pode ser pedido por quem chama a API

**Regras de negócio que valem aqui**

- Changeset é o conjunto de alterações da personalização guardado como conteúdo, com estado próprio
- A escrita só aceita quatro estados; publicar ou agendar exige verificação separada
- A personalização resolve para a capacidade de administrar aparência

**Depende de:** REQ-031, REQ-015, fora desta feature

### US-2 — Separar a permissão de salvar a alteração de aparência da de aplicá-la

Como dono do site, quero que alguém possa preparar uma mudança de aparência sem poder pô-la no ar, para ter uma etapa de aprovação.

**Critérios de aceite**

- [ ] CA-2.1 As duas permissões são verificadas em pontos distintos: uma para gravar o conjunto, outra para aplicá-lo
- [ ] CA-2.2 Quem pode salvar e não pode aplicar deixa o conjunto guardado aguardando quem possa
- [ ] CA-2.3 A permissão de editar o conjunto é declarada na matriz, e não concedida por caminho indireto
- [ ] CA-2.4 Quem não tem nenhuma das duas não abre a tela

**Regras de negócio que valem aqui**

- O legado concede por filtro a capacidade de editar o conjunto, traduzindo a capacidade de conteúdo para as do tipo. Quem migrar pela matriz de papéis produz um sistema em que ninguém salva

**Depende de:** US-1 (REQ-096) · REQ-016, fora desta feature

### US-3 — Informar ao ator o estado que de fato foi gravado

Como administrador, quero que a mensagem de confirmação descreva o que aconteceu, para que eu não procure depois um registro publicado que não existe.

**Critérios de aceite**

- [ ] CA-3.1 A resposta ao aplicar um conjunto de alterações informa o estado real em que o conjunto ficou
- [ ] CA-3.2 A resposta informa separadamente que os valores de aparência foram aplicados ao site
- [ ] CA-3.3 Nenhuma resposta do sistema anuncia um estado diferente do gravado

**Regras de negócio que valem aqui**

- Depois de aplicado, o conjunto vai para a lixeira e a resposta reporta publicado — e não é o que está gravado

**Depende de:** US-2 (REQ-097)

### US-4 — Agendar a aplicação de uma alteração de aparência

Como administrador, quero marcar a data em que a nova aparência entra, para acompanhar uma data de campanha sem ficar acordado.

**Critérios de aceite**

- [ ] CA-4.1 O conjunto de alterações aceita data futura e passa a aguardar, como qualquer conteúdo agendado
- [ ] CA-4.2 A aplicação acontece pela mesma rotina que publica conteúdo agendado
- [ ] CA-4.3 Antes da data, o visitante continua vendo a aparência anterior
- [ ] CA-4.4 Cancelar o agendamento devolve o conjunto ao estado guardado, sem aplicar

**Regras de negócio que valem aqui**

- P6 — agendamento é guardado por verificação dupla `domain.md §2.1`

**Depende de:** US-1 (REQ-096) · REQ-024, fora desta feature

### US-5 — Montar menu de navegação com itens que apontam para conteúdo, classificação ou endereço externo

Como administrador, quero definir os caminhos que o visitante vê para se mover pelo site, para que a navegação reflita a estrutura que importa.

**Critérios de aceite**

- [ ] CA-5.1 Criar e editar menu exige a capacidade declarada de administrar aparência
- [ ] CA-5.2 Um item do menu pode apontar para um conteúdo, para uma classificação ou para um endereço externo
- [ ] CA-5.3 A ordem e a hierarquia dos itens são preservadas e editáveis
- [ ] CA-5.4 O menu é associado a uma posição declarada pelo tema, e a associação é configuração do site
- [ ] CA-5.5 Tema sem posição declarada ainda permite usar o menu por outro meio

**Regras de negócio que valem aqui**

- Um menu de navegação é um contexto de classificação, e cada item do menu é um conteúdo
- A capacidade de administrar aparência libera menus, componentes e personalização, e é exclusiva do papel de administração

**Depende de:** REQ-033, REQ-015, fora desta feature

### US-6 — Sinalizar e limpar item de menu que aponta para conteúdo que não existe mais

Como administrador, quero saber quando um item do menu ficou apontando para o nada, para não deixar o visitante bater numa página de erro.

**Critérios de aceite**

- [ ] CA-6.1 A tela de menus marca visualmente os itens cujo destino não existe mais
- [ ] CA-6.2 Existe ação para remover de uma vez todos os itens órfãos de um menu
- [ ] CA-6.3 Apagar um conteúdo avisa que ele está referenciado em menu, antes de apagar
- [ ] CA-6.4 Item órfão não é renderizado para o visitante

**Regras de negócio que valem aqui**

- No legado, item que aponta para conteúdo apagado permanece no menu e aponta para o nada; nenhuma rotina limpa itens órfãos

**Depende de:** US-5 (REQ-100)

### US-7 — Organizar componentes nas áreas que o tema oferece

Como administrador, quero escolher o que aparece nas áreas laterais e nos rodapés do tema, para montar a página sem programar.

**Critérios de aceite**

- [ ] CA-7.1 Colocar, configurar e retirar componente exige a capacidade declarada de administrar aparência
- [ ] CA-7.2 A configuração de cada componente e o mapa de áreas ficam gravados como configuração do site
- [ ] CA-7.3 A mesma estrutura é editável pela tela dedicada, pela personalização e pela API, com o mesmo resultado
- [ ] CA-7.4 Existe ação para limpar de uma vez os componentes que ficaram sem área

**Regras de negócio que valem aqui**

- Componente e área vivem em configuração do site, não em tabela própria
- A capacidade de administrar aparência libera menus, componentes e personalização

**Depende de:** REQ-015, fora desta feature

### US-8 — Trocar o tema ativo

Como administrador, quero mudar a aparência de todo o site de uma vez, para reposicionar o site sem reescrever o conteúdo.

**Critérios de aceite**

- [ ] CA-8.1 A ativação exige a capacidade declarada de trocar tema e a confirmação do token da ação
- [ ] CA-8.2 Tema inválido é recusado e o tema anterior continua ativo
- [ ] CA-8.3 O tema ativo é configuração do site, e trocá-lo não altera conteúdo nem consulta
- [ ] CA-8.4 O tema ativo não pode ser apagado
- [ ] CA-8.5 Em instalação em rede, a troca é poder de rede
- [ ] CA-8.6 Com a proibição de modificar arquivos declarada, instalar, atualizar e apagar tema são negados a toda conta

**Regras de negócio que valem aqui**

- O tema ativo é uma configuração do site, e a identidade do tema também é um contexto de classificação
- As capacidades de instalação são exclusivas do papel de administração, e em rede são negadas a quem não administra a rede

**Depende de:** REQ-015, fora desta feature

### US-9 — Preservar a configuração dos componentes quando o tema muda

Como administrador, quero experimentar outro tema sem perder o que configurei, para poder voltar atrás.

**Critérios de aceite**

- [ ] CA-9.1 Trocar o tema move para uma área de inativos os componentes cujas áreas deixaram de existir, sem apagar nada
- [ ] CA-9.2 A configuração do tema anterior permanece guardada e não é apagada
- [ ] CA-9.3 Voltar ao tema anterior permite recolocar os componentes nas áreas, por ação explícita
- [ ] CA-9.4 A tela diz quais componentes foram para inativos e por quê

**Regras de negócio que valem aqui**

- Trocar de tema faz as áreas do tema anterior desaparecerem e seus componentes irem para inativos; nada é apagado e nada volta sozinho

**Depende de:** US-7 (REQ-102), US-8 (REQ-104)

### US-10 — Recorrer a um tema de reserva quando o tema ativo não pode ser carregado

Como dono do site, quero que o site continue respondendo quando o tema quebra, para não ficar fora do ar por um arquivo ausente.

**Critérios de aceite**

- [ ] CA-10.1 Tema ativo que não pode ser carregado faz o sistema recorrer ao tema de reserva declarado
- [ ] CA-10.2 A substituição é informada a quem administra o site, não silenciosa
- [ ] CA-10.3 A configuração do tema ativo não é reescrita pela substituição: voltar a ter o tema resolve
- [ ] CA-10.4 Com o tema de reserva também ausente, a resposta diz o que falta em lugar de falhar sem mensagem

**Regras de negócio que valem aqui**

- O tema de reserva é declarado em constante e serve de aparência inicial e de recuperação

**Depende de:** US-8 (REQ-104)

### US-11 — Declarar e enfileirar os recursos de interface com dependência e versão

Como responsável pela aparência, quero declarar de que recursos a página depende e deixar o sistema resolver ordem e versão, para não montar a página à mão.

**Critérios de aceite**

- [ ] CA-11.1 Cada recurso é registrado com identificador, endereço, dependências e versão
- [ ] CA-11.2 A ordem de entrega respeita as dependências declaradas, e uma dependência ausente é reportada
- [ ] CA-11.3 A versão declarada entra no endereço servido, de modo que trocar a versão invalide o cache do navegador
- [ ] CA-11.4 Um recurso declarado e não usado na página não é entregue
- [ ] CA-11.5 O mesmo recurso declarado duas vezes é entregue uma só

**Depende de:** REQ-039, fora desta feature

### US-12 — Resolver em folha de estilo os estilos que o tema declara

Como responsável pela aparência, quero declarar cor, espaçamento e tipografia num contrato legível e deixar o sistema gerar a folha de estilo, para não manter CSS à mão.

**Critérios de aceite**

- [ ] CA-12.1 O contrato declarativo do tema é resolvido numa folha de estilo servida à página
- [ ] CA-12.2 A declaração do tema, a do site e a do conteúdo são combinadas em ordem de precedência declarada
- [ ] CA-12.3 Uma declaração inválida é reportada a quem desenvolve o tema, e não ignorada em silêncio
- [ ] CA-12.4 A folha gerada é cacheável e invalida quando qualquer das declarações muda

**Regras de negócio que valem aqui**

- O contrato declarativo de estilos e recursos do tema é resolvido em CSS pelo motor de estilos

**Depende de:** US-8 (REQ-104), US-11 (REQ-172)

### US-13 — Gerenciar a biblioteca de fontes do site

Como administrador, quero escolher as fontes que o site usa, de um catálogo ou de arquivo meu, para controlar a tipografia sem editar código.

**Critérios de aceite**

- [ ] CA-13.1 Fonte instalada passa a estar disponível para as declarações de estilo do tema
- [ ] CA-13.2 Fonte vinda de arquivo é servida pelo próprio site
- [ ] CA-13.3 Fonte vinda de catálogo externo tem o seu endereço de origem declarado, e o endereço é validado antes de qualquer download
- [ ] CA-13.4 Apagar uma fonte em uso avisa quais declarações a referenciam, antes de apagar
- [ ] CA-13.5 A tela diz, para cada fonte, se ela é servida pelo site ou por terceiro

**Regras de negócio que valem aqui**

- Nenhum endereço de serviço de fonte aparece no código PHP: ele vem do catálogo em JSON, e o download é feito pelo navegador. Metade do comportamento está fora desta árvore

**Depende de:** US-12 (REQ-173) · REQ-151, fora desta feature

### US-14 — Oferecer o conjunto de ícones da interface por registro declarado

Como responsável pela interface, quero pedir um ícone pelo nome e receber a marcação dele, para não repetir desenho vetorial em cada tela.

**Critérios de aceite**

- [ ] CA-14.1 Pedir um ícone pelo nome devolve a marcação registrada para ele
- [ ] CA-14.2 Nome não registrado devolve ausência identificável, sem quebrar a página
- [ ] CA-14.3 Um conjunto novo de ícones pode ser registrado sem alterar quem os consome
- [ ] CA-14.4 O ícone servido não depende de requisição a terceiro

**Depende de:** US-11 (REQ-172)

### US-15 — Entregar ao menos um tema completo junto com o produto

Como pessoa que acabou de instalar o sistema, quero um site apresentável sem escolher nem instalar nada, para começar a publicar no mesmo dia.

**Critérios de aceite**

- [ ] CA-15.1 A instalação nova tem um tema ativo que resolve todos os tipos de apresentação declarados
- [ ] CA-15.2 O tema entregue serve também de reserva quando o tema ativo falha
- [ ] CA-15.3 O tema entregue traz o contrato declarativo de estilos completo
- [ ] CA-15.4 A quantidade de temas que acompanham o produto é decidida e declarada, e cada um deles é mantido

**Regras de negócio que valem aqui**

- O tema de reserva é declarado em constante e serve de aparência inicial e de recuperação

**Depende de:** US-8 (REQ-104), US-10 (REQ-105), US-12 (REQ-173)

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] Cinco histórias desta feature dependem de código que não está nesta árvore: o lado cliente do editor, dos recursos de interface, da biblioteca de fontes e do conjunto de ícones (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem, com os pacotes do projeto. Até que esse fonte esteja em mãos, US-11 a US-14 não têm oráculo de paridade.
- [ ] REQ-177 (tornar interativo o conteúdo renderizado sem recarregar a página) ficou `bloqueado` pela mesma ausência e não entrou no pacote. Parte do comportamento de US-11 e US-12 só faz sentido com ele.
- [ ] US-15 (REQ-176) exige entregar ao menos um tema completo junto com o produto. A árvore analisada traz três temas empacotados, e nenhuma resposta humana disse qual deles é o tema de referência do porte, nem se os três entram.
- [ ] US-4 (REQ-099) agenda a aplicação de uma alteração de aparência, e o agendamento depende da fila da feature 011, cujas histórias estão em conflito aberto com a resposta 10. Enquanto esse conflito não se resolver, o comportamento agendado desta história fica indefinido.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-096 · UC-29 | `wp-admin/customize.php:15`, `wp-includes/class-wp-customize-manager.php:1041`, `wp-includes/class-wp-customize-manager.php:2479` (+2) |
| US-2 | REQ-097 · UC-29 | `wp-includes/class-wp-customize-manager.php:2433`, `wp-includes/class-wp-customize-manager.php:2578`, `wp-includes/class-wp-customize-manager.php:2642` |
| US-3 | REQ-098 · UC-29 | `wp-includes/class-wp-customize-manager.php:2578`, `wp-includes/class-wp-customize-manager.php:2642` |
| US-4 | REQ-099 · UC-29 · UC-04 · `domain.md §2.1` (P6) | `wp-includes/class-wp-customize-manager.php:2483`, `wp-includes/post.php:5482` |
| US-5 | REQ-100 · UC-30 | `wp-admin/nav-menus.php:23`, `wp-admin/nav-menus.php:370`, `wp-admin/nav-menus.php:527` (+1) |
| US-6 | REQ-101 · UC-30 · UC-09 | `wp-admin/nav-menus.php:370`, `wp-includes/nav-menu.php:418` |
| US-7 | REQ-102 · UC-31 | `wp-admin/widgets.php:15`, `wp-admin/widgets-form.php:126`, `wp-admin/widgets-form.php:199` (+1) |
| US-8 | REQ-104 · UC-32 | `wp-admin/themes.php:12`, `wp-admin/themes.php:20`, `wp-admin/themes.php:60` (+2) |
| US-9 | REQ-103 · UC-31 · UC-32 | `wp-includes/theme.php:757`, `wp-includes/widgets.php:1094` |
| US-10 | REQ-105 · UC-32 · UC-36 | `wp-includes/default-constants.php:437`, `wp-includes/theme.php:757` |
| US-11 | REQ-172 · UC-01 · UC-29 | `wp-includes/functions.wp-scripts.php:278`, `wp-includes/functions.wp-scripts.php:473`, `wp-includes/class-wp-dependencies.php:19` (+2) |
| US-12 | REQ-173 · UC-29 · UC-32 · UC-01 | `wp-includes/style-engine.php:63`, `wp-includes/style-engine.php:144`, `wp-includes/style-engine/class-wp-style-engine.php:32` (+2) |
| US-13 | REQ-174 · UC-29 · UC-12 | `wp-includes/fonts/class-wp-font-library.php:17`, `wp-includes/fonts/class-wp-font-collection.php:19`, `wp-includes/fonts.php:1` |
| US-14 | REQ-175 · UC-29 · UC-24 | `wp-includes/icons.php:166`, `wp-includes/class-wp-icons-registry.php:14`, `wp-includes/class-wp-icon-collections-registry.php:18` |
| US-15 | REQ-176 · UC-32 · UC-01 | `wp-includes/default-constants.php:437`, `wp-includes/theme.php:757` |
