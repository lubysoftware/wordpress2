# Leitura pública

**Origem:** épico EP-4 do backlog do sistema legado (`entregar o conteúdo publicado a quem não tem conta`)  
**Cards:** REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-043, REQ-045, REQ-046, REQ-171
**Dos quais, cards de descarte (prioridade `wont`):** REQ-046

## Por que esta feature existe

É a cara pública do produto: entregar o conteúdo publicado a quem não tem conta. O épico
EP-4 cobre a tradução do endereço pedido em critérios de consulta por um conjunto de
regras declaradas, a escolha da apresentação por uma hierarquia de modelos, a paginação
com tamanho configurável, a restrição de leitura do que não está público, a resposta a
endereço sem correspondência, a liberação do corpo protegido por senha, a pré-busca do
próximo destino e a expansão de macro textual no corpo.

Duas coisas pedem atenção num porte. A proteção por senha de conteúdo é um dos cinco
mecanismos que decidem acesso sem consultar capacidade alguma, e a resposta 8 mandou
preservar o atestado atual: dez dias no navegador do visitante, sem verificação de idade
no servidor e sem limite de tentativa. A proteção também é do corpo, não da existência:
o conteúdo protegido continua aparecendo em listagem e no mapa do site. A segunda é que
os mesmos critérios de consulta podem ser informados diretamente, sem passar pelo
endereço amigável, e precisam produzir o mesmo resultado; é essa equivalência, e não a
forma do endereço, que o teste de paridade tem de cobrir.

## Histórias de usuário

### US-1 — Resolver o endereço pedido numa consulta de conteúdo

Como visitante, quero que o endereço que eu abro traga o conteúdo que ele promete, para ler o site sem precisar de conta.

**Critérios de aceite**

- [ ] CA-1.1 Um endereço amigável é traduzido em critérios de consulta por um conjunto de regras declaradas
- [ ] CA-1.2 Os mesmos critérios podem ser informados diretamente, sem endereço amigável, e produzem o mesmo resultado
- [ ] CA-1.3 Alterar a forma dos endereços amigáveis não exige alterar o conteúdo gravado
- [ ] CA-1.4 Endereço que resolve para um único conteúdo e endereço que resolve para uma listagem são distinguíveis pela resposta

### US-2 — Escolher a apresentação do conteúdo por uma hierarquia declarada de modelos

Como responsável pela aparência, quero poder especializar a apresentação de um tipo, de uma classificação ou de um conteúdo específico sem reescrever o resto, para mudar só o que precisa mudar.

**Critérios de aceite**

- [ ] CA-2.1 Para cada tipo de resultado de consulta, o sistema procura os modelos em ordem declarada e usa o primeiro que existe
- [ ] CA-2.2 Há sempre um modelo final de reserva, de modo que nenhuma requisição fica sem apresentação
- [ ] CA-2.3 A ordem de procura é inspecionável por quem desenvolve o tema
- [ ] CA-2.4 Trocar o tema troca a apresentação sem alterar conteúdo nem consulta

**Depende de:** US-1 (REQ-038)

### US-3 — Paginar a listagem pública com tamanho de página configurável

Como visitante, quero percorrer o conteúdo em páginas de tamanho previsível, para não receber a listagem inteira de uma vez.

**Critérios de aceite**

- [ ] CA-3.1 A listagem pública nasce com 10 itens por página e o número é configurável
- [ ] CA-3.2 A resposta informa a página corrente e o total de páginas
- [ ] CA-3.3 Pedir página além do total devolve a resposta de endereço sem correspondência
- [ ] CA-3.4 A ordenação da listagem é declarada e estável entre páginas

**Regras de negócio que valem aqui**

- `posts_per_page` nasce em 10 e define o tamanho da página pública

**Depende de:** US-1 (REQ-038)

### US-4 — Restringir a leitura de conteúdo que não está público

Como dono do site, quero que rascunho, pendente e privado não cheguem a quem não deve vê-los, para que a área de trabalho da equipe não seja pública por acidente.

**Critérios de aceite**

- [ ] CA-4.1 Conteúdo privado exige a capacidade de ler conteúdo privado
- [ ] CA-4.2 Conteúdo em qualquer outro estado não público exige a capacidade de editá-lo: ler o rascunho de outra pessoa pressupõe poder editá-lo
- [ ] CA-4.3 A restrição vale igualmente na página, na listagem, no feed, no sitemap e na API
- [ ] CA-4.4 Para quem não tem a permissão, a resposta é indistinguível da de conteúdo inexistente

**Regras de negócio que valem aqui**

- Estado privado exige capacidade de ler privado; qualquer outro estado não público cai em capacidade de edição

**Depende de:** US-1 (REQ-038) · REQ-015, fora desta feature

### US-5 — Responder a endereço sem correspondência com a apresentação de erro do tema

Como visitante, quero saber que o endereço não existe em lugar de receber uma página vazia, para entender que errei o caminho.

**Critérios de aceite**

- [ ] CA-5.1 Consulta que não casa com nenhum conteúdo marca a resposta como não encontrada e usa o modelo de erro do tema
- [ ] CA-5.2 O código de resposta HTTP é 404
- [ ] CA-5.3 A resposta não vaza se o conteúdo existe em estado não público

**Depende de:** US-2 (REQ-039), US-4 (REQ-041)

### US-6 — Liberar o corpo de conteúdo protegido por senha a quem informa a senha

Como visitante sem conta, quero ver o corpo de um conteúdo publicado que pede senha, para acessar material restrito sem me cadastrar.

**Critérios de aceite**

- [ ] CA-6.1 Sem a senha, o corpo é substituído pelo formulário de senha e o resto da página continua servido
- [ ] CA-6.2 Senha correta grava no navegador do visitante um atestado e o corpo passa a ser servido
- [ ] CA-6.3 Senha errada devolve o formulário e mantém o corpo oculto
- [ ] CA-6.4 Quem pode editar o conteúdo vê o corpo sem informar a senha
- [ ] CA-6.5 Comentar num conteúdo protegido sem ter informado a senha é recusado com motivo próprio
- [ ] CA-6.6 O conteúdo protegido continua aparecendo em sitemap e listagem: a proteção é do corpo, não da existência

**Regras de negócio que valem aqui**

- D6 — senha de conteúdo é texto claro por desenho: é senha de acesso a conteúdo, não de conta, e precisa poder ser exibida a quem edita `domain.md §2.5`
- Senha de conteúdo é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades

**Depende de:** US-1 (REQ-038)

### US-7 — Pré-buscar o próximo destino de navegação antes do clique

Como visitante, quero que a página seguinte abra sem espera perceptível, para percorrer o site sem interrupção.

**Critérios de aceite**

- [ ] CA-7.1 A página servida declara ao navegador quais destinos podem ser pré-buscados e com que agressividade
- [ ] CA-7.2 Endereços de administração, de saída de sessão e de ação com efeito ficam fora da declaração
- [ ] CA-7.3 A declaração é desligável por configuração, e desligada ela não aparece na página

**Depende de:** US-2 (REQ-039)

### US-8 — Expandir macro textual no corpo do conteúdo na renderização

Como autor, quero escrever uma marca curta no corpo do conteúdo e ver, na página, o que ela representa, para inserir recurso dinâmico sem programar.

**Critérios de aceite**

- [ ] CA-8.1 Uma marca registrada no corpo do conteúdo é substituída na renderização pelo resultado que o seu tratador produz
- [ ] CA-8.2 Marca não registrada é deixada no texto como foi escrita, sem erro e sem desaparecer
- [ ] CA-8.3 A expansão acontece na renderização, não na gravação: o corpo gravado continua com a marca
- [ ] CA-8.4 Marca dentro de atributo de elemento é tratada por caminho próprio e declarado
- [ ] CA-8.5 A lista de marcas registradas é inspecionável por quem administra o site

**Regras de negócio que valem aqui**

- Shortcode é macro textual em colchetes expandida na renderização

**Depende de:** US-2 (REQ-039)

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-046 — Descartar o gerenciador de bookmarks e o índice OPML

O sistema novo não terá o gerenciador de lista de links nem o índice de bookmarks em OPML que o legado ainda carrega.

**Motivo registrado no card:** O próprio legado já o esconde: o gerenciador só aparece quando a tabela tem linha, o que não acontece numa instalação nova. É uma superfície de entrada pública (um endereço que serve XML) mantida para um recurso que o produto parou de oferecer, e cada superfície de entrada sem limite de taxa é custo de segurança. Antes de descartar, a migração precisa dizer o que acontece com linhas existentes — por isso o terceiro critério.

**Como conferir que ficou fora**

- [ ] Nenhuma tela do sistema novo gerencia lista de links
- [ ] Nenhum endereço do sistema novo serve índice de bookmarks
- [ ] A migração de dados declara o que fazer com as linhas existentes na tabela de links, se houver

> Conflito registrado, não resolvido. A decisão fundadora D6 de `soul.md` e a resposta 1 põem o default do código como especificação, e o instalador do legado ainda cria a tabela de lista de links, com o endereço público que serve o índice. Remover os dois é remover superfície publicada, o que a resposta 14 recusou em caso idêntico ao decidir que `wont` vale como não mudar e nunca como não portar. Se o descarte valer, o módulo de links e a integração do índice saem desta feature; se não valer, eles voltam sem história que os especifique.

## Perguntas em aberto

- [ ] US-7 (REQ-045) pré-busca o próximo destino antes do clique, e metade do comportamento do módulo correspondente do legado está no lado cliente, ausente desta árvore (lacuna L4 de `soul.md`). A resposta 15 manda construir a partir do repositório de origem: até isso acontecer, os critérios de borda desta história não são verificáveis contra o legado.
- [ ] US-2 (REQ-039) escolhe a apresentação por hierarquia declarada de modelos, e os modelos vêm do tema, que está na feature 009. Qual tema serve de oráculo para o teste de paridade desta história?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-038 · UC-01 | `wp-blog-header.php:16`, `wp-includes/class-wp.php:136`, `wp-includes/class-wp.php:724` (+1) |
| US-2 | REQ-039 · UC-01 | `wp-includes/template-loader.php:23`, `wp-includes/template-loader.php:114`, `wp-includes/template.php:23` |
| US-3 | REQ-040 · UC-01 | `wp-includes/class-wp-query.php:1900`, `wp-admin/includes/schema.php:416` |
| US-4 | REQ-041 · UC-01 · UC-06 · UC-03 | `wp-includes/capabilities.php:149`, `wp-includes/class-wp-query.php:811` |
| US-5 | REQ-042 · UC-01 | `wp-includes/class-wp.php:819`, `wp-includes/template-loader.php:114` |
| US-6 | REQ-043 · UC-02 · `domain.md §2.5` (D6) | `wp-includes/post-template.php:882`, `wp-includes/comment.php:4053`, `wp-includes/comment.php:4064` |
| US-7 | REQ-045 · UC-01 | `wp-includes/speculative-loading.php:330`, `wp-includes/functions.php:1612` |
| US-8 | REQ-171 · UC-01 · UC-03 | `wp-includes/shortcodes.php:63`, `wp-includes/shortcodes.php:243`, `wp-includes/shortcodes.php:465` |
| fora de escopo: REQ-046 | REQ-046 · UC-47 | `wp-links-opml.php:72`, `wp-admin/includes/schema.php:116` |
