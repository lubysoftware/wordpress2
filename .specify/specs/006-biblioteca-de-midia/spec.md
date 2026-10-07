# Biblioteca de mídia

**Origem:** épico EP-6 do backlog do sistema legado (`guardar arquivos e servir as derivadas que cada tela precisa`)  
**Cards:** REQ-056, REQ-057, REQ-058, REQ-059, REQ-060, REQ-061, REQ-062, REQ-063, REQ-064

## Por que esta feature existe

Guardar arquivos e servir as derivadas que cada tela precisa. O épico EP-6 cobre o envio
com validação do tipo real do arquivo, a herança de visibilidade do conteúdo de destino,
a geração das derivadas de cada tamanho registrado, a redução da imagem acima do limite
na ingestão com guarda do original, o relato da falha de processamento, a escolha da
derivada adequada ao espaço em que a imagem aparece, a transformação de imagem já
enviada com volta ao original, o descarte do arquivo que deixou de ser referenciado e o
contorno do filtro de tipo por decisão declarada da instalação.

Três comportamentos do legado decidem o porte desta feature, e nenhum deles é intuitivo.
O arquivo nunca é publicado: qualquer estado fora da lista permitida é reescrito para
herdar, porque a visibilidade do arquivo é a do conteúdo que o carrega. Apagar mídia é
definitivo, sem lixeira e sem aviso, e a resposta 9 confirmou que continua assim, o que
produz uma assimetria com o conteúdo que o usuário não espera e que o produto escolheu
ter. E a falha ao gerar derivada é silenciosa em cinco pontos do processamento, todos
marcados no código como registro a fazer, nenhum escrevendo linha alguma.

## Histórias de usuário

### US-1 — Enviar arquivo para a biblioteca validando o tipo real do arquivo

Como autor, quero colocar um arquivo no site para usá-lo no conteúdo, e quero que o sistema recuse o que não deve entrar.

**Critérios de aceite**

- [ ] CA-1.1 O envio exige a capacidade de enviar arquivo e, quando há conteúdo de destino, a de editar aquele conteúdo
- [ ] CA-1.2 O tipo é decidido pelo conteúdo do arquivo, não pela extensão informada, e confrontado com a lista de tipos permitidos
- [ ] CA-1.3 Tipo fora da lista é recusado com motivo informado ao ator
- [ ] CA-1.4 Colisão de nome no destino é resolvida renomeando, sem sobrescrever arquivo existente
- [ ] CA-1.5 Destino não gravável devolve erro com a mensagem do sistema de arquivos, e nenhum registro de anexo é criado
- [ ] CA-1.6 O envio pela tela e o envio assíncrono do editor aplicam as mesmas duas verificações de capacidade

**Depende de:** REQ-015, fora desta feature

### US-2 — Herdar do conteúdo de destino a visibilidade do arquivo enviado

Como autor, quero que um arquivo anexado a um rascunho não fique público antes do rascunho, para não vazar material antes da publicação.

**Critérios de aceite**

- [ ] CA-2.1 Anexo com conteúdo de destino tem a visibilidade do destino, nunca a própria
- [ ] CA-2.2 Nenhum caminho de escrita consegue pôr um anexo em estado publicado: estado fora dos quatro aceitos é reescrito para herdado
- [ ] CA-2.3 Anexo sem conteúdo de destino passa a ter visibilidade própria, declarada no registro
- [ ] CA-2.4 Mudar a visibilidade do conteúdo de destino muda a do anexo junto

**Regras de negócio que valem aqui**

- P2 — anexo nunca é publicado: qualquer estado fora de herdado, privado, lixeira e rascunho automático é reescrito `domain.md §2.1`

**Depende de:** US-1 (REQ-056)

### US-3 — Gerar as derivadas de cada tamanho registrado ao receber uma imagem

Como autor, quero que o sistema prepare as versões de cada tamanho que o site usa, para não precisar enviar a mesma imagem várias vezes.

**Critérios de aceite**

- [ ] CA-3.1 Receber uma imagem gera uma derivada para cada tamanho declarado, com as proporções declaradas para aquele tamanho
- [ ] CA-3.2 Os tamanhos de fábrica são quatro, com as medidas declaradas, mais os dois de tela de alta densidade
- [ ] CA-3.3 Tamanho registrado depois do envio não é gerado retroativamente: há uma ação explícita para regerar
- [ ] CA-3.4 O registro do anexo guarda, para cada derivada, o nome do arquivo e as medidas reais

**Regras de negócio que valem aqui**

- M2 — quatro tamanhos nascem com o site, mais dois registrados em código para telas de alta densidade `domain.md §2.7`

**Depende de:** US-1 (REQ-056)

### US-4 — Reduzir imagem acima do limite na ingestão, guardando o original

Como dono do site, quero que uma foto de câmera não seja servida ao visitante no tamanho em que saiu da câmera, sem que o original seja perdido.

**Critérios de aceite**

- [ ] CA-4.1 Imagem acima do limite declarado em qualquer dimensão passa a ser servida por uma cópia reduzida
- [ ] CA-4.2 O arquivo original continua no armazenamento e é identificável como original
- [ ] CA-4.3 As derivadas de tamanho são geradas a partir da cópia reduzida, não do original
- [ ] CA-4.4 O limite é configurável e desligável

**Regras de negócio que valem aqui**

- M1 — imagem acima de 2560 px é reduzida na ingestão e o original fica guardado `domain.md §2.7`

**Depende de:** US-3 (REQ-058)

### US-5 — Informar e registrar a falha ao processar imagem

Como autor, quero saber quando uma derivada não pôde ser gerada, para não descobrir isso quando a imagem aparece quebrada no site.

**Critérios de aceite**

- [ ] CA-5.1 Falha ao gerar ou gravar qualquer derivada é registrada com anexo, tamanho pretendido e motivo
- [ ] CA-5.2 O ator que enviou o arquivo é informado de que o anexo ficou com derivadas faltando
- [ ] CA-5.3 O registro do anexo distingue derivada ausente de derivada não registrada
- [ ] CA-5.4 Existe ação explícita para tentar gerar de novo as derivadas que faltaram

**Regras de negócio que valem aqui**

- M4 — falha ao gerar derivada de imagem é silenciosa: cinco pontos do processamento carregam `// TODO: Log errors.` e nenhum registra nada `domain.md §2.7`

**Depende de:** US-3 (REQ-058) · REQ-159, fora desta feature

### US-6 — Servir a derivada adequada ao espaço em que a imagem aparece

Como visitante, quero receber a imagem no tamanho que a minha tela precisa, para não baixar mais bytes do que o necessário.

**Critérios de aceite**

- [ ] CA-6.1 A marcação servida oferece ao navegador as derivadas existentes com as suas larguras reais
- [ ] CA-6.2 O teto da oferta é declarado e configurável, e não depende de quais derivadas existem
- [ ] CA-6.3 Anexo sem derivada alguma é servido no arquivo único, sem marcação de alternativas

**Regras de negócio que valem aqui**

- M3 — o conjunto de alternativas para em 2048 px, independente dos tamanhos existentes `domain.md §2.7`

**Depende de:** US-3 (REQ-058)

### US-7 — Transformar imagem já enviada, podendo voltar ao original

Como autor, quero recortar, girar ou inverter uma imagem que já está no site, para ajustá-la sem enviá-la de novo.

**Critérios de aceite**

- [ ] CA-7.1 A transformação exige a capacidade de editar aquele anexo
- [ ] CA-7.2 O resultado é gravado como arquivo novo e o anexo passa a apontar para ele
- [ ] CA-7.3 O arquivo anterior continua no armazenamento, identificável como backup
- [ ] CA-7.4 Restaurar o original recoloca o arquivo guardado e regera as derivadas a partir dele
- [ ] CA-7.5 O ator escolhe se a transformação vale para a imagem inteira, só para a miniatura, ou para tudo menos a miniatura, e os três caminhos produzem conjuntos distintos de arquivos
- [ ] CA-7.6 Servidor sem biblioteca de imagem disponível não oferece a tela, e informa o motivo

**Regras de negócio que valem aqui**

- M2 — os tamanhos registrados definem quais derivadas são regeneradas `domain.md §2.7`
- M4 — falha ao gerar derivada de imagem é silenciosa `domain.md §2.7`

**Depende de:** US-3 (REQ-058), US-5 (REQ-060)

### US-8 — Apagar o arquivo que deixou de ser referenciado

Como dono do site, quero que trocar uma imagem não deixe a anterior ocupando armazenamento para sempre, para que o custo de disco não cresça com cada troca.

**Critérios de aceite**

- [ ] CA-8.1 Substituir uma imagem de configuração do site (fundo, cabeçalho, ícone) libera o arquivo anterior, ou declara explicitamente que ele é mantido e por quanto tempo
- [ ] CA-8.2 Apagar um anexo em definitivo apaga o arquivo principal, as derivadas e os backups de edição
- [ ] CA-8.3 Existe um relatório que lista arquivos no armazenamento sem anexo correspondente
- [ ] CA-8.4 Nenhuma rotina apaga arquivo que ainda tem anexo apontando para ele

**Regras de negócio que valem aqui**

- `// @todo Uploaded files are not removed here.` — trocar imagem de fundo deixa o arquivo anterior órfão
- O mesmo padrão de acúmulo aparece na edição de imagem, que guarda backup a cada transformação

**Depende de:** US-7 (REQ-062)

### US-9 — Contornar o filtro de tipo de arquivo só por decisão declarada da instalação

Como responsável pela instalação, quero que aceitar tipo de arquivo fora da lista seja uma decisão que alguém tomou e assinou, para que ela não entre por acaso.

**Critérios de aceite**

- [ ] CA-9.1 A capacidade de enviar arquivo sem filtro de tipo é negada a toda conta por padrão, inclusive à de maior poder
- [ ] CA-9.2 Ela só passa a existir quando a instalação declara explicitamente que a permite
- [ ] CA-9.3 Mesmo liberada, ela só alcança quem tem a capacidade declarada de enviar sem filtro
- [ ] CA-9.4 Cada envio feito por esse caminho fica registrado com conta, arquivo e instante

**Regras de negócio que valem aqui**

- A permissão de envio sem filtro é o inverso das outras: sem a declaração da instalação, ela é sempre negada

**Depende de:** US-1 (REQ-056) · REQ-014, fora desta feature

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] US-5 (REQ-060) exige informar e registrar a falha ao processar imagem, e a regra M4 do domínio registra que no legado ela é silenciosa nos cinco pontos do processamento. Acrescentar registro é permitido por P7 da constituição; informar o ator muda o que ele vê e é divergência que precisa de decisão humana registrada.
- [ ] A redução da imagem na ingestão troca o arquivo servido por uma cópia com sufixo no nome, e o sufixo aparece no endereço público. Se o modelo novo mudar a forma do nome, muda endereço observável. Ninguém decidiu se o sufixo é contrato.
- [ ] US-8 (REQ-063) apaga o arquivo que deixou de ser referenciado. No legado não existe rotina que faça isso, e a resposta 2 diz que o porte parte de instalação nova, sem órfão herdado. Esta história cria comportamento que o legado não tem: é melhoria deliberada ou foi escrita assumindo dado legado a limpar?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-056 · UC-12 | `wp-admin/media-new.php:15`, `wp-admin/media-new.php:33`, `wp-admin/async-upload.php:34` (+3) |
| US-2 | REQ-057 · UC-12 · `domain.md §2.1` (P2) | `wp-includes/post.php:4705`, `wp-includes/post.php:4707` |
| US-3 | REQ-058 · UC-12 · `domain.md §2.7` (M2) | `wp-admin/includes/image.php:285`, `wp-admin/includes/image.php:579`, `wp-admin/includes/schema.php:485` (+1) |
| US-4 | REQ-059 · UC-12 · `domain.md §2.7` (M1) | `wp-admin/includes/image.php:285`, `wp-admin/includes/image.php:336` |
| US-5 | REQ-060 · UC-12 · UC-13 · `domain.md §2.7` (M4) | `wp-admin/includes/image.php:356`, `wp-admin/includes/image.php:359`, `wp-admin/includes/image.php:385` (+2) |
| US-6 | REQ-061 · UC-12 · UC-01 · `domain.md §2.7` (M3) | `wp-includes/media.php:1545` |
| US-7 | REQ-062 · UC-13 · `domain.md §2.7` (M2) · `domain.md §2.7` (M4) | `wp-admin/includes/image-edit.php:18`, `wp-admin/includes/image-edit.php:435`, `wp-admin/includes/image-edit.php:640` (+2) |
| US-8 | REQ-063 · UC-13 · UC-29 · UC-12 | `wp-admin/includes/class-custom-background.php:140`, `wp-admin/includes/image-edit.php:435` |
| US-9 | REQ-064 · UC-12 | `wp-includes/capabilities.php:587`, `wp-includes/capabilities.php:588` |
