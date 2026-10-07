# Classificação do conteúdo

**Origem:** épico EP-3 do backlog do sistema legado (`organizar o conteúdo para que ele seja encontrado`)  
**Cards:** REQ-033, REQ-034, REQ-035, REQ-036, REQ-037

## Por que esta feature existe

O legado separa o rótulo do contexto em que ele classifica, e essa separação é a feature
inteira. O mesmo rótulo pode existir como categoria e como etiqueta: duas linhas no
contexto de classificação, uma só no rótulo. É o que permite ao produto ter oito
contextos de núcleo, entre eles categoria, etiqueta, menu de navegação e tema, sem
inventar uma tabela por contexto. O épico EP-3 cobre essa separação, a classificação do
conteúdo pelos contextos declarados para o seu tipo, o termo padrão aplicado quando
ninguém informa termo, a lista de termos com hierarquia e contagem de uso, e a proibição
de remover o termo padrão de um contexto.

Para um porte, o ponto de atenção é que a junção que classifica conteúdo tem chave
primária composta e aponta para o registro de conteúdo por convenção de coluna, sem nada
declarado no armazenamento, e que o contexto guarda uma contagem de uso gravada. As duas
coisas são observáveis: a contagem aparece na interface e em listagem pública, e a
ausência de restrição no armazenamento é o que permite classificar objeto que não é
conteúdo. A resposta 2 proíbe que a escolha do modelo novo mude qualquer uma das duas.

## Histórias de usuário

### US-1 — Separar o rótulo de classificação do contexto em que ele classifica

Como dono do site, quero que o mesmo rótulo possa servir em contextos diferentes de classificação sem virar dois cadastros, para não ter de manter o mesmo nome em dois lugares.

**Critérios de aceite**

- [ ] CA-1.1 Um rótulo existe uma vez e pode pertencer a mais de um contexto de classificação ao mesmo tempo
- [ ] CA-1.2 Renomear o rótulo muda o nome em todos os contextos em que ele serve
- [ ] CA-1.3 Remover o rótulo de um contexto não o remove do outro
- [ ] CA-1.4 Contexto de classificação é declarado e diz a quais tipos de conteúdo se aplica

**Regras de negócio que valem aqui**

- Term é o rótulo e Taxonomy é o contexto: o mesmo Term vive em duas taxonomias como duas linhas de vínculo e uma de rótulo
- Um menu de navegação é um contexto de classificação, e cada item do menu é um conteúdo

### US-2 — Classificar conteúdo com os termos dos contextos declarados para o seu tipo

Como autor, quero colocar o conteúdo nas classificações que o farão ser encontrado, para que ele apareça junto do que é parecido.

**Critérios de aceite**

- [ ] CA-2.1 A lista de termos enviada substitui integralmente os vínculos daquele conteúdo naquele contexto
- [ ] CA-2.2 Criar termo novo pela tela de edição exige a capacidade de criar termo daquele contexto; sem ela o rótulo desconhecido é ignorado, sem criar nada
- [ ] CA-2.3 A contagem de uso de cada termo afetado fica correta ao fim da operação
- [ ] CA-2.4 Só contextos declarados para aquele tipo de conteúdo aceitam vínculo

**Depende de:** US-1 (REQ-033)

### US-3 — Aplicar o termo padrão do contexto quando nenhum termo é informado

Como dono do site, quero que nenhum conteúdo fique sem classificação num contexto que exige uma, para que as listagens por classificação nunca perdam conteúdo.

**Critérios de aceite**

- [ ] CA-3.1 Conteúdo gravado sem termo informado num contexto que declara termo padrão recebe o padrão
- [ ] CA-3.2 A regra é aplicada de novo na publicação, para todo contexto que declare padrão
- [ ] CA-3.3 Conteúdo em rascunho automático não recebe o padrão: ainda não é conteúdo
- [ ] CA-3.4 Ao fim de qualquer gravação, nenhum conteúdo do tipo padrão está sem classificação

**Regras de negócio que valem aqui**

- P3 — conteúdo do tipo padrão sempre tem categoria; sem categoria informada e fora de rascunho automático, recebe a categoria padrão `domain.md §2.1`

**Depende de:** US-2 (REQ-034)

### US-4 — Manter a lista de termos de cada contexto, com hierarquia e contagem de uso

Como editor, quero criar, renomear, reorganizar e apagar as classificações do site, para que o vocabulário do site acompanhe o que ele publica.

**Critérios de aceite**

- [ ] CA-4.1 A tela exige a capacidade que o contexto declara para gerenciá-lo
- [ ] CA-4.2 Contexto hierárquico aceita termo pai e mantém a árvore; contexto plano recusa hierarquia
- [ ] CA-4.3 Apagar um termo em uso remove o vínculo e não apaga o conteúdo
- [ ] CA-4.4 Conteúdo que fica sem termo algum num contexto com padrão recebe o padrão
- [ ] CA-4.5 A contagem de uso dos termos afetados fica correta ao fim da operação

**Regras de negócio que valem aqui**

- `terms` não tem coluna de estado: o estado de um termo é a existência dele
- Cinco nomes de capacidade de taxonomia resolvem todos para a mesma capacidade real

**Depende de:** US-1 (REQ-033), US-3 (REQ-035)

### US-5 — Impedir a remoção do termo padrão de um contexto

Como dono do site, quero que o termo usado como padrão não possa ser apagado, para que a regra do termo padrão nunca aponte para o nada.

**Critérios de aceite**

- [ ] CA-5.1 Apagar o termo declarado como padrão de um contexto é recusado, para qualquer ator
- [ ] CA-5.2 A recusa vence inclusive o ator de maior poder da instalação
- [ ] CA-5.3 Trocar qual termo é o padrão é permitido, e só então o anterior pode ser apagado

**Regras de negócio que valem aqui**

- O termo padrão do contexto é indestrutível, e a negação vence até o ator de maior poder
- ADR 0009 — negação explícita que vence o super admin

**Depende de:** US-4 (REQ-036) · REQ-014, fora desta feature

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] A junção de classificação do legado é polimórfica por convenção: a coluna de objeto aponta para conteúdo sem nada declarar, e nada impede outro tipo de objeto. O modelo novo mantém a junção genérica ou a prende ao registro de conteúdo? A resposta 2 proíbe que a decisão mude o que é observável, o que exclui declarar restrição que recuse hoje o que o legado aceita.
- [ ] A contagem de uso de cada termo é dado gravado e sai de sincronia quando alguém escreve na junção por fora do caminho normal. Recalcular na leitura é mais correto e muda o que a interface devolve nesse caso de borda. Manter o valor gravado, com a possibilidade de divergir, é o comportamento idêntico. Ninguém decidiu.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-033 · UC-05 · UC-08 | `wp-includes/taxonomy.php:2851`, `wp-admin/includes/schema.php:797` |
| US-2 | REQ-034 · UC-05 | `wp-includes/post.php:4719`, `wp-includes/capabilities.php:758`, `wp-includes/taxonomy.php:2851` (+1) |
| US-3 | REQ-035 · UC-05 · UC-03 · UC-08 · `domain.md §2.1` (P3) | `wp-includes/post.php:4719`, `wp-includes/post.php:5419` |
| US-4 | REQ-036 · UC-08 | `wp-admin/edit-tags.php:26`, `wp-admin/edit-tags.php:112`, `wp-includes/taxonomy.php:2458` (+2) |
| US-5 | REQ-037 · UC-08 | `wp-includes/capabilities.php:751`, `wp-includes/taxonomy.php:2458` |
