# Modulo de midia — BC-04

Feature `006-biblioteca-de-midia`. Tarefas fechadas com nota de entrega neste
arquivo: **T001** (esqueleto, as tres portas e os tamanhos de fabrica). Este
arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o que ja
esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem**
decidiu.

A pasta e `contextos/midia/` porque e assim que `target_architecture.md` nomeia
BC-04 no esboco de arvore. BC-04 e a fusao de `midia-e-anexos` com
`edicao-de-imagem`, e a justificativa do agrupamento esta la: as duas *"operam o
mesmo artefato em disco e compartilham o modo de falha de `M4`"*.

> 🔴 **Antes de qualquer coisa, se a sua tarefa gera derivada de imagem (T007,
> T009, T015):** a `spec.md` e a arvore analisada **discordam** sobre de qual
> arquivo as derivadas saem quando houve reducao na ingestao. T001 topou nisso ao
> ancorar a porta de processamento de imagem e **nao resolveu**. Esta na secao
> *O que T001 encontrou aberto*, e e o primeiro item.

---

## O que T001 entrega, e so isso

A linha da tarefa: *"o modulo carrega com as portas de dados, de sistema de
arquivos e de processamento de imagem declaradas, e os tamanhos de fabrica do
legado registrados como dado"*. `satisfaz: — (infraestrutura)`: T001 nao fecha
nenhum criterio de aceite de nenhuma historia, e nao implementa regra de negocio
nenhuma.

| arquivo | o que e |
|---|---|
| `portas/porta-de-dados.ts` | a borda do banco, que e a unica porta deste modulo para dados (REQ-164) |
| `portas/porta-de-sistema-de-arquivos.ts` | a borda do disco e da escrita remota, terceira das cinco de AD-08 |
| `portas/porta-de-processamento-de-imagem.ts` | a borda da biblioteca de imagem, com a interface do editor do legado |
| `tamanhos/tamanho-de-imagem.ts` | a forma de um tamanho registrado: largura, altura, recorte |
| `tamanhos/tamanhos-de-fabrica.ts` | os seis tamanhos de `M2` como dado congelado, com o ponto de configuracao de cada um |
| `index.ts` | a composicao: `criarModuloDeMidia(portas)` |
| `modulo.test.ts` | os 9 testes da entrega, e nada de historia |

**O que a composicao NAO faz, e os testes afirmam:** nao guarda estado de modulo
(`EXT-CONTEXTO`, BR-MIGRAR-105 — duas composicoes nao se enxergam, e o unico dado
compartilhado e congelado) e nao resolve nada no carregamento (`EXT-ORDEM`,
BR-MIGRAR-106 — criar o modulo nao consulta dado, nao toca disco e nao abre
imagem).

**Nenhuma dependencia nova entrou em `package.json`**, e isso e consequencia da
regra de dependencia 4 de `target_architecture.md`: *"`contextos/` ou
`plataforma/` para `adaptadores/` concreto: proibido. So pela porta"*. Os slots
escolhidos para este no — driver MySQL em protocolo nativo, sistema de arquivos
do runtime com SSH2 e FTP, biblioteca nativa de processamento de imagem — sao
implementacao de `adaptadores/`, e T001 nao escreve adaptador.

---

## Por que estas tres portas, e nao outras

**Dados e sistema de arquivos** sao duas das cinco bordas de AD-08, e as duas
estao na secao Stack do `plan.md` desta feature. A de sistema de arquivos e a que
define a feature: *"a area de envios e a porta `sistema-de-arquivos`, e ela tem
quatro implementacoes no legado (direta, e tres remotas)"*. As quatro existem
porque o produto sobrescreve os proprios arquivos em execucao (decisao fundadora
D7), e `tech-stack.json` registra que reduzir a uma *"e mudanca observavel que
nenhuma das 23 respostas autoriza"*.

**Processamento de imagem e a sexta porta, e a conta de AD-08 diz cinco.** A
diferenca esta declarada no cabecalho de
`portas/porta-de-processamento-de-imagem.ts` e resumida aqui: AD-08 recusa porta
para o barramento de hooks, para a traducao e para o escape, por custo de
indirecao em escala de 13.335 e 3.416 pontos de entrada; o processamento de
imagem tem **duas implementacoes da mesma interface na arvore analisada**
(`class-wp-image-editor-gd.php` e `class-wp-image-editor-imagick.php`),
selecionadas em execucao pelo que a hospedagem tiver, e o `plan.md` as chama de
*"adaptador sem o nome"*. T001 de `tasks.md` pede esta porta pelo nome. Fica
registrado para quem revisar a conta das portas.

**Nao ha porta de relogio aqui**, e BC-05 tem uma. A diferenca e que esta feature
nao tem prazo nenhum: os numeros dela sao medida em pixel, e `R3`
(BR-MIGRAR-032) tira a midia da retencao agendada — apagar e definitivo, sem
prazo. Quando alguma tarefa precisar de instante (o *"instante"* de CA-9.4, por
exemplo), ela declara a porta, como T002 de BC-05 fez com o prefixo base.

**Nao ha porta de HTTP, de cache de objeto nem de e-mail**, que sao as outras
tres das cinco. Nenhuma historia desta feature fala com a rede, manda e-mail ou
cacheia; a borda 5 de `target_architecture.md` ainda poe o cache de objeto
**desligado nas duas metades** durante a coexistencia.

---

## Os seis tamanhos de fabrica, e de onde vem cada um

`M2` (BR-MIGRAR-058) e CA-3.2. Metade vem de opcao semeada pelo instalador e
metade vem de codigo, e **as duas fontes sao a regra** — quem portar so a tabela
de opcoes perde dois tamanhos.

| nome | medida | recorte | origem | ponto de configuracao |
|---|---|---|---|---|
| `thumbnail` | 150x150 | **sim** | opcao semeada | `thumbnail_size_w`, `_h`, `thumbnail_crop` |
| `medium` | 300x300 | nao | opcao semeada | `medium_size_w`, `_h`, (`medium_crop`) |
| `medium_large` | 768x**0** | nao | opcao semeada | `medium_large_size_w`, `_h`, (`medium_large_crop`) |
| `large` | 1024x1024 | nao | opcao semeada | `large_size_w`, `_h`, (`large_crop`) |
| `1536x1536` | 1536x1536 | nao | **codigo** | nenhum |
| `2048x2048` | 2048x2048 | nao | **codigo** | nenhum |

Quatro fatos que um porte perde, e que estao anotados no arquivo:

1. **`thumbnail` e o unico recortado**, e e a opcao `thumbnail_crop` semeada em
   `1` que o torna assim. As tres opcoes de recorte entre parenteses sao
   **consultadas e nunca semeadas**: `get_option()` devolve `false`, e e dai que
   sai o recorte desligado dos outros tres. Semear as quatro daria o mesmo
   comportamento e uma tabela de opcoes diferente da do legado, que
   `parity_specs.md` poe na area *"efeito no banco"*.
2. **`medium_large` nao tem campo na tela de configuracao de midia.** Os 10
   campos que `target_screens.md` lista cobrem `thumbnail`, `medium` e `large`.
   Ele existe, e gerado, e e invisivel.
3. **A altura `0` de `medium_large` e valor valido, nao ausencia.** Significa "a
   largura manda".
4. **Os dois de alta densidade sao registrados em `plugins_loaded` com
   prioridade `0`.** A ordem de carregamento do arranque e contrato publico (D1,
   e a tabela de nao negociaveis da constituicao): quem os registrar mais tarde
   deixa extensao que os le em `plugins_loaded` sem encontra-los.

E **duas ordens diferentes**, que o arquivo separa: a ordem desta tabela e a de
`get_intermediate_image_sizes()`, e a ordem em que as derivadas sao **geradas** e
outra — `_wp_make_subsizes()` reordena para `medium`, `large`, `thumbnail`,
`medium_large` e depois o resto, para que exista tamanho utilizavel mesmo quando
nem todas as derivadas nascem. Como cada derivada entra no metadado assim que
nasce, essa segunda ordem **e a ordem das chaves em `sizes`**, e a ordem das
chaves e byte a byte observavel porque o metadado e serializado no formato do PHP
(borda 2, `DB-SER`). Isso e de T007.

---

## 🔴 O que T001 encontrou aberto, e NAO resolveu

### 1. De qual arquivo saem as derivadas quando houve reducao na ingestao

**A spec e a arvore analisada discordam, e isto nao e ambiguidade: sao duas
afirmacoes opostas sobre o mesmo passo.**

- **A `spec.md` diz da copia reduzida.** CA-4.3, literal: *"as derivadas de
  tamanho sao geradas a partir da copia reduzida, nao do original"*. O fluxo
  alternativo *Imagem acima de 2560 px* de **UC-12** repete: *"os tamanhos
  derivados sao gerados a partir da copia, nao do original"*.
- **A arvore analisada faz do original.** `wp_create_image_subsizes( $file, ... )`
  grava a copia reduzida num arquivo **novo**
  (`$editor->save( $editor->generate_filename( 'scaled' ) )`), poe a copia em
  `$image_meta['file']` e o nome do original em `$image_meta['original_image']`
  — e no fim passa **`$file`**, que continua sendo o caminho do original, para
  `_wp_make_subsizes()` (`wp-admin/includes/image.php:412`), que abre esse
  caminho (`:471`). O comentario de `:337` diz que e de proposito: *"This
  doesn't affect the sub-sizes names as they are generated from the original
  image (for best quality)"*.

Nao e divergencia que se escolha no meio da implementacao. O P1 da constituicao
poe o comportamento observavel do legado como a especificacao e exige que toda
divergencia tenha *"uma referencia a resposta de `questions.md` ou ao ADR que a
autorizou"* — e nao existe nenhuma aqui: as tres divergencias autorizadas sao o
tempo limite do adaptador de IA, a minimizacao do servico de reputacao e o
ambiente-oraculo. E o que se escolhe muda **bytes de arquivo servido**: derivar
do original de 4000 px e derivar da copia de 2560 px produz grades diferentes
para a mesma entrada, e o cenario de paridade cobra que *"o metadado de cada
derivada e identico campo por campo nas duas"*.

**T001 nao depende da resposta**, e e por isso que esta tarefa fechou: a porta de
processamento recebe o caminho **por argumento**, logo a decisao cabe inteira em
quem chamar, num lugar so. **T007, T009 e T015 dependem.** Quem pegar uma delas
para antes da primeira linha de codigo.

### 2. As tres perguntas que a propria `spec.md` deixou abertas

Estao na secao *Perguntas em aberto* da spec e tambem em `index.md` na raiz.
Nenhuma foi tocada por T001, e nenhuma e decidivel por um agente:

1. **Informar o ator da falha de processamento (US-5, REQ-060).** `M4`
   (BR-MIGRAR-060) e os cinco `// TODO: Log errors.` de
   `wp-admin/includes/image.php:356`, `:359`, `:385`, `:483` e `:492` dizem que
   no legado a falha e **silenciosa**. CA-5.1 e CA-5.2 pedem registrar **e
   informar**. O P7 permite acrescentar registro — *"registro acrescentado e so
   escrita"* —, mas informar o ator muda o que ele ve, e o cenario
   `@divida-herdada` do teste de paridade cobra que *"nenhuma das duas avisa o
   ator"*. Registrar: pode. Avisar: precisa de decisao humana registrada.
2. **O sufixo da copia reduzida e contrato?** O `-scaled` aparece no endereco
   publico. Se o modelo novo mudar a forma do nome, muda endereco observavel. Por
   isso **nenhuma das duas portas gera nome de arquivo**: o nome chega decidido,
   para que a decisao, quando vier, caiba num lugar so.
3. **US-8 (REQ-063) cria comportamento que o legado nao tem.** Nao existe rotina
   de varredura de orfao na arvore analisada, e a resposta 2 diz que o porte parte
   de instalacao nova, sem orfao herdado. Por isso a porta de sistema de arquivos
   **nao tem operacao de varredura**: o `listar` que ela tem existe para a
   colisao de nome de CA-1.4, que o legado resolve com `@scandir`
   (`wp-includes/functions.php:2712`), e nao para procurar orfao.

### 3. O que "identico" significa para imagem

A razao da recomendacao do slot de processamento, em `tech-stack.json`, termina
assim: *"a decisao que realmente importa neste slot nao e a biblioteca, e
declarar se 'identico' para imagem e o arquivo ou a grade de derivadas"*. O risco
1 de `plan.md` propoe a grade — *"comparar dimensao, tipo e nome de arquivo, nao
o conteudo binario"*. O contexto do cenario de paridade supoe *"a mesma
biblioteca de imagem"* nas duas metades, o que admitiria comparar arquivo. Nao e
a mesma afirmacao, e nenhuma tarefa deste pacote a resolve. A porta serve as duas
leituras: ela devolve dimensao, nome, tipo e tamanho em bytes, e nunca os bytes.

---

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Lixeira de midia.** `REQ-051` (*"dar lixeira a midia pelo mesmo comportamento
  de fabrica do conteudo"*) esta em `do-not-rewrite.md`: escopo recusado, nao
  trabalho pendente. A resposta 9 de `questions.md` e `R3` (BR-MIGRAR-032)
  fixam o oposto — apagar midia e **definitivo, sem lixeira e sem aviso** —, e o
  cenario `@critico @divida-herdada` do teste de paridade cobra que *"nenhuma das
  duas avisa o ator de que a operacao e irreversivel"*. Por isso
  `PortaDeSistemaDeArquivos.apagar` nao tem guarda nenhuma, e nenhuma deve ser
  acrescentada.
- **Chave estrangeira e restricao de integridade no armazenamento.** `REQ-169`
  tambem esta em `do-not-rewrite.md`, e o P5 poe a cascata observavel no
  contrato.
- **Limite de taxa no envio.** `REQ-160` esta em `do-not-rewrite.md`, e o P6
  recusa numero que o legado nao tem.

---

## Como se confere que este modulo tem paridade

A spec de paridade desta feature e **`PT-014`**, em
`.specify/migration/parity_tests/14-ingestao-e-derivadas-de-midia.feature`: 11
cenarios sobre `M1`–`M4`, `P2` e `R3`, nas areas *efeito no banco* e
*comportamento de caso de uso* da Decisao 2, com UC-12 e UC-13 como casos de uso.

O que T001 ja torna conferivel por ali:

- O cenario **`@composicao`** pede *"a porta de sistema de arquivos substituida
  por duplo que registra cada operacao"* e que *"a sequencia de operacoes
  registrada seja identica a do oraculo"*. `modulo.test.ts` monta exatamente esse
  duplo e afirma que a porta e substituivel sem tocar nenhum arquivo do modulo —
  o criterio de "substituivel" de BR-MIGRAR-103 (`EXT-SUBST`). A **sequencia** so
  existe quando houver fluxo: e de T003 em diante.
- O cenario dos **quatro tamanhos** pede *"o mesmo conjunto de tamanhos
  registrados nas duas metades"*, *"o tamanho de miniatura recortado quadrado"* e
  *"os outros tres proporcionais"*. O dado que fixa isso e
  `tamanhos/tamanhos-de-fabrica.ts`, e o teste afirma medida, recorte e ordem dos
  seis.
- O cenario **`@divida-herdada`** da falha silenciosa exige que o chamador possa
  **ignorar** a falha. As duas portas devolvem falha como **valor** e nenhuma
  escreve registro; os dois ultimos testes do modulo afirmam isso nas duas.

⚠️ `parity_specs.md` registra que a suite de *characterization tests* **nao
existe** nesta arvore, e que a paridade de tela tem de ser derivada secao por
secao (`DEV-001`, pendente). E a resposta 16 de `questions.md` autoriza o
ambiente-oraculo, que e o unico jeito de comparar o lado binario: enquanto ele
nao existir, o que se confere aqui e a grade, nao o arquivo.
