# Superfícies programáticas

**Origem:** épico EP-13 do backlog do sistema legado (`o que o sistema expõe a programas: API, abilities, feeds, sitemaps`)  
**Cards:** REQ-137, REQ-139, REQ-140, REQ-141, REQ-142, REQ-143, REQ-145, REQ-146, REQ-147, REQ-148, REQ-179
**Dos quais, cards de descarte (prioridade `wont`):** REQ-148, REQ-179

## Por que esta feature existe

O que o sistema expõe a programas. O épico EP-13 cobre o despacho de requisição por rota
registrada com esquema declarado, a validação e sanitização de cada parâmetro contra esse
esquema, a publicação do mapa da superfície, o registro do acesso, a exigência de um token
adicional quando a identidade da chamada vem de sessão de navegador, a execução de
operação nomeada pedida por agente, o índice de mapa do site, os feeds de conteúdo e de
comentários, e a representação embutível de um endereço.

Esta feature carrega duas das três camadas paralelas de autorização do sistema, e elas
têm defaults opostos. A camada de rotas falha **aberta**: rota sem declaração de permissão
funciona e só emite aviso de uso indevido, e o texto do aviso ensina a declarar permissão
pública. A camada de operações nomeadas falha **fechada**, mas a autorização dela é
filtrável inclusive para conceder, com elevação temporária de permissão citada como caso
de uso no próprio código, e a execução pode ser curto-circuitada antes de qualquer
normalização, validação ou verificação de permissão. Cinco operações nomeadas estão
registradas nesta árvore, três do núcleo e duas da extensão empacotada, todas com
declaração de permissão.

## Histórias de usuário

### US-1 — Despachar requisição de programa por rota registrada com esquema declarado

Como programa, quero ler e escrever os dados do site por uma superfície HTTP com contrato, para integrar sem depender de telas.

**Critérios de aceite**

- [ ] CA-1.1 Caminho e método são casados com uma rota registrada antes de qualquer execução
- [ ] CA-1.2 A resolução de identidade acontece antes do despacho, num ponto único
- [ ] CA-1.3 Rota inexistente devolve 404 em formato de dados, com indicação das rotas próximas
- [ ] CA-1.4 A resposta devolve os campos declarados pelo esquema da rota, e o cliente pode pedir um recorte deles
- [ ] CA-1.5 Toda rota tem versão no caminho, e uma versão publicada não muda de contrato

**Regras de negócio que valem aqui**

- O filtro de autenticação da API antecede todo o despacho

**Depende de:** REQ-012, fora desta feature

### US-2 — Validar e sanitizar cada parâmetro contra o esquema declarado da rota

Como programa, quero receber um erro claro quando mando um parâmetro errado, para corrigir a chamada em lugar de descobrir o problema no dado gravado.

**Critérios de aceite**

- [ ] CA-2.1 Cada parâmetro é validado contra o tipo, o formato e os limites declarados antes de a rota executar
- [ ] CA-2.2 Parâmetro fora do esquema devolve 400 nomeando o campo e o motivo
- [ ] CA-2.3 A sanitização acontece depois da validação e antes da execução
- [ ] CA-2.4 Parâmetro não declarado no esquema não chega à execução
- [ ] CA-2.5 O esquema de cada rota é o mesmo documento usado para validar e para publicar o contrato

**Depende de:** US-1 (REQ-137)

### US-3 — Publicar o mapa da superfície programática

Como programa, quero descobrir quais rotas existem e que esquema cada uma tem, para integrar sem documentação separada.

**Critérios de aceite**

- [ ] CA-3.1 Há um endereço que lista as rotas registradas e os seus esquemas
- [ ] CA-3.2 O mapa declara, para cada rota, se ela é pública ou qual permissão exige
- [ ] CA-3.3 O mapa é gerado do mesmo esquema que valida os parâmetros, e não de documentação paralela
- [ ] CA-3.4 O mapa não expõe rota que o requisitante não poderia descobrir de outra forma

**Regras de negócio que valem aqui**

- No legado, a raiz da API lista as rotas e os esquemas sem exigir credencial: o mapa da superfície é público

**Depende de:** US-1 (REQ-137) · REQ-138, fora desta feature

### US-4 — Registrar o acesso à superfície programática

Como responsável pela operação, quero saber quem chamou a API, quando e com que resultado, para dimensionar limites e investigar abuso.

**Critérios de aceite**

- [ ] CA-4.1 Cada chamada registra rota, método, identidade resolvida, resultado, duração e instante
- [ ] CA-4.2 O registro não guarda credencial, corpo de requisição com dado pessoal nem cabeçalho de sessão
- [ ] CA-4.3 O registro é consultável por rota, por identidade e por período
- [ ] CA-4.4 O registro tem prazo de retenção declarado
- [ ] CA-4.5 É possível responder, pelo registro, qual o volume de chamadas por rota num período

**Regras de negócio que valem aqui**

- No legado, nenhum registro da chamada é guardado: não há log de acesso à API
- A ausência de volume por rota é o que impede dimensionar o limite de taxa

**Depende de:** US-1 (REQ-137) · REQ-159, fora desta feature

### US-5 — Exigir token adicional quando a identidade da chamada vem de sessão de navegador

Como dono do site, quero que uma chamada feita com a sessão do navegador prove que partiu do site, para que outro site não aja em nome de quem está logado.

**Critérios de aceite**

- [ ] CA-5.1 Chamada autenticada por sessão de navegador exige token próprio da superfície programática
- [ ] CA-5.2 Chamada autenticada por credencial de aplicação não exige esse token
- [ ] CA-5.3 Token ausente ou inválido recusa a chamada antes de a rota executar
- [ ] CA-5.4 O token tem prazo declarado e a tela que o usa sabe renová-lo

**Regras de negócio que valem aqui**

- Pelo caminho de sessão de navegador o token da API passa a ser exigido, porque a requisição é falsificável

**Depende de:** US-1 (REQ-137) · REQ-012, fora desta feature

### US-6 — Executar operação nomeada e descrita por esquema, pedida por agente

Como agente automatizado, quero executar uma operação do site pelo nome, com entrada e saída descritas, para agir sem conhecer a implementação.

**Critérios de aceite**

- [ ] CA-6.1 A operação é localizada pelo nome num registro consultável
- [ ] CA-6.2 A entrada é ajustada ao esquema declarado e validada antes da execução
- [ ] CA-6.3 A saída é validada contra o esquema de saída antes de ser devolvida
- [ ] CA-6.4 Entrada fora do esquema devolve erro nomeando o campo e o motivo, antes de executar
- [ ] CA-6.5 Operação inexistente devolve erro que a distingue de operação sem permissão
- [ ] CA-6.6 Há rotas próprias para listar as operações e as suas categorias

**Regras de negócio que valem aqui**

- Ability é operação nomeada e descrita por esquema, feita para ser invocada por agente de IA, com autorização própria
- ADR 0011 — autorização própria para agente de IA

**Depende de:** US-1 (REQ-137), US-2 (REQ-139)

### US-7 — Servir o índice de sitemap conforme a opção de indexação

Como buscador, quero obter a lista do que o site publicou em formato de máquina, para indexar o site inteiro sem rastrear link a link.

**Critérios de aceite**

- [ ] CA-7.1 Com a indexação ligada, há um índice que lista as páginas de sitemap por provedor
- [ ] CA-7.2 Cada página lista apenas conteúdo público, respeitando a restrição de leitura
- [ ] CA-7.3 Com a indexação desligada, as rotas não são registradas e o pedido cai na resposta de endereço inexistente
- [ ] CA-7.4 Com a indexação desligada, as instruções para rastreadores pedem que ninguém indexe
- [ ] CA-7.5 O índice pagina os provedores, e o tamanho de página é declarado
- [ ] CA-7.6 Conteúdo protegido por senha entra no índice, porque está publicado: a proteção é do corpo

**Regras de negócio que valem aqui**

- `blog_public` nasce ligado: o site pede para ser indexado
- Com a indexação desligada, não é uma recusa: é uma ausência

**Depende de:** REQ-041, REQ-043, fora desta feature

### US-8 — Servir feeds de conteúdo e de comentários a partir da mesma consulta pública

Como leitor que acompanha o site por um agregador, quero receber as atualizações em formato de máquina, para não precisar visitar o site.

**Critérios de aceite**

- [ ] CA-8.1 O mesmo endereço de listagem serve a versão em formato de feed quando o formato é pedido
- [ ] CA-8.2 O feed é montado da mesma consulta pública que a página, sem regra de visibilidade própria
- [ ] CA-8.3 Há feed de conteúdo e feed de comentários, global e por conteúdo
- [ ] CA-8.4 O formato padrão é declarado e usado quando o pedido não nomeia um

**Depende de:** REQ-038, REQ-041, fora desta feature

### US-9 — Servir a representação embutível de um endereço do site a outro site

Como site remoto, quero obter uma representação pronta para embutir de um endereço deste site, para citá-lo sem copiar o conteúdo.

**Critérios de aceite**

- [ ] CA-9.1 Há rota pública que, dado um endereço deste site, devolve a representação embutível declarada
- [ ] CA-9.2 Endereço que não resolve em conteúdo público devolve erro, sem revelar a existência de conteúdo restrito
- [ ] CA-9.3 A representação devolvida não inclui corpo de conteúdo protegido por senha
- [ ] CA-9.4 O tamanho da representação é limitado por valores declarados

**Regras de negócio que valem aqui**

- A rota de representação embutível é pública por desenho

**Depende de:** US-1 (REQ-137) · REQ-041, fora desta feature

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-148 — Descartar a superfície programática herdada com credencial no corpo da chamada

O sistema novo não terá a superfície programática antiga, em que cada método recebe login e senha como argumento e não existe sessão.

**Motivo registrado no card:** É uma segunda superfície de escrita completa, com modelo de autenticação próprio em que a credencial da conta viaja no corpo de cada chamada, sem sessão, sem limite de taxa e sem registro — e tudo o que ela oferece a superfície com esquema declarado (REQ-137) já oferece. Manter as duas significa manter dois portões de autorização e dois contratos para o mesmo domínio. O único caso que ela cobre sozinha é o recebimento de notificação de link, e por isso o terceiro critério exige endereço próprio para ele antes do descarte.

**Como conferir que ficou fora**

- [ ] Nenhum endereço do sistema novo aceita credencial de conta como argumento no corpo da chamada
- [ ] Toda operação que a superfície herdada oferecia tem equivalente na superfície com esquema declarado
- [ ] O recebimento de notificação de link verificada, que no legado chega por esta superfície, passa a ter endereço próprio e declarado
- [ ] O endereço herdado, se requisitado, responde com a resposta de endereço inexistente, sem erro de servidor

> Conflito registrado, não resolvido, e explícito. A resposta 14 nomeia REQ-148 e decide que a superfície herdada não sai, porque é superfície do núcleo que está sendo clonado e tem clientes históricos, inclusive aplicativos móveis e a notificação de link. O descarte "vale como não mudar, nunca como não portar". O card diz o contrário.

### REQ-179 — Descartar o segundo canal de escrita do painel

O sistema novo não terá o endereço único de ações assíncronas do painel, com autorização por ação e resposta sem contrato.

**Motivo registrado no card:** É uma segunda superfície de escrita completa, paralela à de REQ-137, em que a operação é escolhida por um parâmetro, a autorização é verificada dentro de cada tratador, a resposta não tem esquema — chega a ser um único caractere — e não há registro nem limite de taxa. Tudo o que ela faz a superfície com rota e esquema faz com contrato. Manter as duas é manter dois portões de autorização para as mesmas operações, e o histórico desta árvore mostra o que acontece quando um portão depende de cada ponto de chamada lembrar dele.

**Como conferir que ficou fora**

- [ ] Nenhuma ação do painel é despachada por um endereço único que decide a operação por um parâmetro
- [ ] Toda operação que o painel faz de forma assíncrona passa pela superfície com rota, esquema e permissão declarados
- [ ] Nenhuma resposta do sistema é um corpo sem contrato, do tipo um único caractere
- [ ] O endereço herdado, se requisitado, responde com a resposta de endereço inexistente

> Conflito registrado, não resolvido, e explícito. A resposta 14 nomeia REQ-179 e decide que o canal assíncrono do painel não sai, com a observação de que é por ele que metade do painel conversa. O card diz o contrário, e descreve com precisão o que a superfície custa: operação escolhida por parâmetro, autorização verificada dentro de cada tratador, resposta sem esquema.

## Perguntas em aberto

- [ ] REQ-138 (exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela) ficou `bloqueado` e não entrou. É ele que fecharia a falha aberta da camada de rotas, e dois itens desta feature dependem dele. Sem ele, o pacote porta a falha aberta sem nenhuma história que a declare.
- [ ] A execução de operação nomeada pode ser curto-circuitada antes de qualquer validação, e o próprio código do legado avisa que, nesse caminho, a integridade do insumo passa a ser de quem curto-circuitou. REQ-143 especifica a execução e não diz se o curto-circuito entra. Portá-lo é reproduzir um caminho que contorna toda a validação; não portá-lo é divergir de comportamento declarado.
- [ ] REQ-141 registra o acesso à superfície programática, e o legado não registra nada. Vale a mesma ressalva de P7 e da resposta 20: registro novo é permitido, prazo de retenção novo não se inventa.
- [ ] US-1 (REQ-137) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-3 (REQ-140) depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-5 (REQ-142) depende de `REQ-012` (Autenticar chamada não interativa por credencial de aplicação), que ficou na coluna `refinamento` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-179 depende de `REQ-138` (Exigir declaração explícita de permissão em toda rota, e recusar o registro sem ela), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-137 · UC-44 | `wp-includes/rest-api/class-wp-rest-server.php:285`, `wp-includes/rest-api/class-wp-rest-server.php:1063`, `wp-includes/rest-api/class-wp-rest-server.php:197` (+1) |
| US-2 | REQ-139 · UC-44 · UC-46 | `wp-includes/rest-api/class-wp-rest-server.php:1063`, `wp-includes/rest-api.php:122` |
| US-3 | REQ-140 · UC-44 · UC-46 | `wp-includes/rest-api/class-wp-rest-server.php:285`, `wp-includes/rest-api.php:122` |
| US-4 | REQ-141 · UC-44 · UC-45 · UC-46 | `wp-includes/rest-api/class-wp-rest-server.php:285`, `wp-includes/class-wp-xmlrpc-server.php:247` |
| US-5 | REQ-142 · UC-44 · UC-23 | `wp-includes/rest-api/class-wp-rest-server.php:197`, `wp-includes/pluggable.php:2454` |
| US-6 | REQ-143 · UC-46 | `wp-includes/abilities.php:17`, `wp-includes/abilities-api/class-wp-ability.php:769`, `wp-includes/abilities-api/class-wp-ability.php:809` (+2) |
| US-7 | REQ-145 · UC-47 | `wp-includes/sitemaps.php:22`, `wp-includes/class-wp-query.php:811`, `wp-admin/includes/schema.php:416` (+1) |
| US-8 | REQ-146 · UC-47 · UC-01 | `wp-includes/class-wp.php:724`, `wp-includes/class-wp-query.php:811`, `wp-includes/functions.php:1349` |
| US-9 | REQ-147 · UC-44 · UC-17 | `wp-includes/class-wp-oembed-controller.php:35`, `wp-includes/embed.php:325`, `wp-includes/embed.php:561` |
| fora de escopo: REQ-148 | REQ-148 · UC-45 · UC-17 | `xmlrpc.php:13`, `wp-includes/class-wp-xmlrpc-server.php:158`, `wp-includes/class-wp-xmlrpc-server.php:344` (+1) |
| fora de escopo: REQ-179 | REQ-179 · UC-44 · UC-16 · UC-12 | `wp-admin/admin-ajax.php:16`, `wp-admin/admin-ajax.php:178`, `wp-admin/admin-ajax.php:211` |
