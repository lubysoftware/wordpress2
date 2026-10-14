# Modulo de midia — BC-04

Feature `006-biblioteca-de-midia`. Tarefas fechadas com nota de entrega neste
arquivo: **T001** (esqueleto, as tres portas e os tamanhos de fabrica), **T002**
(a forma de armazenamento do anexo e das derivadas), **T003** (o envio com
validacao do tipo real, US-1) e **T007** (a geracao das derivadas de cada tamanho
registrado, US-3). Este arquivo e a leitura obrigatoria de quem pegar a tarefa
seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro lugar**,
e o que **ninguem** decidiu.

A pasta e `contextos/midia/` porque e assim que `target_architecture.md` nomeia
BC-04 no esboco de arvore. BC-04 e a fusao de `midia-e-anexos` com
`edicao-de-imagem`, e a justificativa do agrupamento esta la: as duas *"operam o
mesmo artefato em disco e compartilham o modo de falha de `M4`"*.

> 🔴 **Antes de qualquer coisa, se a sua tarefa gera derivada de imagem (T009,
> T015):** a `spec.md` e a arvore analisada **discordam** sobre de qual arquivo as
> derivadas saem quando houve reducao na ingestao. T001 topou nisso ao ancorar a
> porta de processamento de imagem e **nao resolveu**; **T007 topou de novo, no
> ponto exato do fluxo, e tambem nao resolveu** — porque nao precisou: sem o
> passo da reducao, que e de T009, nao existe copia reduzida e o caminho que
> segue para o laco e o unico que ha. O ponto esta marcado em
> `derivadas/criar-derivadas-na-ingestao.ts`, no passo 4, e a discussao esta na
> secao *O que T001 encontrou aberto*, primeiro item. **Quem fechar T009 escreve
> esse passo e ai precisa da resposta.**

> 🔴 **E se a sua tarefa encosta na permissao do envio (T005, T019):** a
> `spec.md` e a arvore analisada **discordam** sobre o que acontece com quem nao
> pode editar o conteudo de destino — CA-1.1 diz que o envio e exigido, e duas
> das tres superficies do legado **descartam o destino e seguem** em vez de
> recusar. T003 reproduziu os dois comportamentos e **nao resolveu**. Esta na
> secao *O que T003 encontrou aberto*.

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

## O que T002 entrega, e so isso

A linha da tarefa: *"o anexo existe como registro de conteudo com estado
herdado, e o metadado que descreve as derivadas e gravado e lido pela porta de
dados com a mesma forma do legado"*. `satisfaz: — (infraestrutura)`: T002 nao
fecha criterio de aceite nenhum e **nao implementa regra de negocio nenhuma**.

| arquivo | o que e |
|---|---|
| `armazenamento/chaves-e-tabelas.ts` | os dois nomes de tabela e as **cinco** chaves de metadado do anexo |
| `armazenamento/anexo.ts` | a linha de `posts` lida como anexo, o vocabulario de `P2` e as duas consultas que o caminho do anexo emite sobre `posts` |
| `armazenamento/derivadas.ts` | a forma do valor de `_wp_attachment_metadata`, com a **ordem das chaves** e os construtores dela |
| `armazenamento/metadado.ts` | as primitivas de `postmeta`, com os cinco comportamentos de efeito no banco |
| `armazenamento/metadado-de-anexo.ts` | as cinco chaves como operacao nomeada, mais a guarda da miniatura compartilhada |
| `armazenamento/verdade-de-php.ts` | o `if ( $valor )` que decide entre gravar e **apagar** |
| `armazenamento/porta-falsa.ts` | o duplo que **registra comando** — e o que T003 em diante vai usar |
| `armazenamento/armazenamento.test.ts` | os 22 testes da entrega, todos sobre efeito no banco |

### As quatro decisoes de T002 que a proxima tarefa precisa conhecer

1. **O anexo nao tem tabela, e nao ha `inserir` neste armazenamento.** O unico
   caminho de escrita da linha no legado e `wp_insert_attachment()` →
   `wp_insert_post()` (`wp-includes/post.php:6778`, `:6790`), que e **de BC-01**
   e leva com ele quatro pontos de extensao, a reescrita de `P2`, a unicidade do
   identificador na URL e a gravacao do `guid`. Um `inserir` nascido aqui
   emitiria um comando que o legado nao emite. Como a chamada BC para BC e
   **ligacao tardia** (AD-10), **quem declara essa ligacao e T003**, do mesmo
   jeito que `ClassificacaoNaPublicacao` e declarada no contexto da operacao em
   BC-01. As duas consultas que estao aqui — o `SELECT *` e o `DELETE` — sao as
   duas que `wp_delete_attachment()` emite por conta propria, sem passar por
   `wp_delete_post()`.
2. **A verdade do metadado e o arranjo; a projecao tipada e so leitura.**
   `MetadadoDeAnexo` nomeia em portugues as chaves que o legado le, e `gravar`
   recebe **`ValorPhp`**, nunca a projecao: a estrutura e aberta (a anotacao do
   proprio legado termina em `...` nos dois niveis), a ordem das chaves e byte, e
   inteiro e texto sao bytes diferentes para a mesma largura. Quem grava a partir
   de uma projecao apaga chave de extensao — e chave de extensao e contrato
   publico (P2). O teste *"chave de extensao sobrevive a volta"* fixa isso.
3. **A ordem das chaves esta declarada, e a atribuicao do PHP tem regra de
   posicao.** `atribuirChave()` substitui **no lugar** a chave que existe e poe
   no **fim** a que nao existe, que e o que faz o metadado de uma imagem reduzida
   sair como `width, height, file, filesize, sizes, original_image`
   (`wp-admin/includes/image.php:213` a `:223`). Um porte que apagasse e
   reinserisse produziria os mesmos dados com outros bytes.
4. **O caminho do arquivo nao e resolvido aqui.** O que este armazenamento le e
   grava e o **valor da coluna** — o caminho relativo. A absolutizacao de
   `get_attached_file()` (`post.php:848` a `:854`) e a relativizacao de
   `_wp_relative_upload_path()` (`:900`) precisam da raiz da area de envios, que
   e a **porta de sistema de arquivos**, e tocam **endereco publico** — que e a
   pergunta em aberto do sufixo. Quem resolve caminho e o fluxo que tem as duas
   portas na mao (T003).

### O que T002 encontrou, e que a `spec.md` nao diz

Nenhum conflito novo: nos dois casos abaixo a `spec.md` **diz menos** do que a
arvore, e o P1 poe a arvore como a especificacao. Ficam registrados porque sao
exatamente onde um porte guiado so pela spec perde paridade.

1. **O caminho relativo do arquivo mora em DUAS chaves, nao numa.** A secao
   *Modelo de dados* do `plan.md` tem uma linha so — *"o metadado do anexo [...]
   e o caminho do arquivo relativo a area de envios"* —, e na arvore o caminho
   esta em `_wp_attachment_metadata['file']` **e** em `_wp_attached_file`, duas
   linhas de `postmeta` diferentes, as duas atualizadas pelo mesmo
   `_wp_image_meta_replace_original()` (`image.php:210` e `:217`) e as duas lidas
   pelo caminho de exclusao de arquivo. Quem grava so uma deixa o anexo
   apontando para dois arquivos diferentes.
2. **O metadado tem seis nomes de arquivo alem de `sizes`, e cinco deles a spec
   nao menciona.** Alem de `file` e `original_image`, o caminho de exclusao le
   `thumb` (o formato anterior a 2.5, que ninguem escreve e dois leem),
   `source_image`, `animated_video` e `animated_video_poster`, mais o
   `_wp_attachment_backup_sizes`. Todos estao representados em `derivadas.ts`,
   por P8: um porte que nao os represente deixa em disco arquivo que o legado
   apaga, e o cenario `@cascata` do teste de paridade compara *"o conjunto de
   arquivos restante no disco"*.

⚠️ E uma assimetria que vale repetir, porque ela e do produto e nao defeito: a
reescrita de `P2` acontece no caminho de **aplicacao**
(`wp-includes/post.php:4705`), e o DDL da coluna tem `default 'publish'`
(`wp-admin/includes/schema.php:167`). Logo uma linha de `attachment` inserida
direto na tabela, sem informar estado, nasce no estado que `P2` diz que o anexo
nunca tem. Nenhum caminho deste modulo insere linha direto, e a leitura **nao
corrige** o que ja esta assim no banco.

---

## O que T003 entrega, e so isso

A linha da tarefa: *"o comportamento de US-1 existe e os criterios CA-1.1,
CA-1.2, CA-1.3, CA-1.4, CA-1.5 e CA-1.6 passam contra o sistema novo"*. E a
**primeira operacao** deste modulo, e por isso a primeira com declaracao
explicita de permissao (P4): `ModuloDeMidia.enviarArquivo`.

No legado sao duas funcoes encadeadas — `media_handle_upload()`
(`wp-admin/includes/media.php:296`), que monta o registro, e
`_wp_handle_upload()` (`wp-admin/includes/file.php:809`), que valida e grava o
arquivo —, mais as tres superficies que as chamam.

| arquivo | o que e | criterios |
|---|---|---|
| `envio/permissao-de-envio.ts` | as duas verificacoes de capacidade, e as **tres** superficies do legado | CA-1.1, CA-1.6 |
| `envio/tipos-de-arquivo-permitidos.ts` | as 93 entradas de `wp_get_mime_types()`, a lista permitida e a decisao pela extensao | CA-1.2 |
| `envio/tipo-real-do-arquivo.ts` | o confronto entre o tipo da extensao e o detectado no conteudo | CA-1.2, CA-1.3 |
| `envio/nome-de-arquivo-unico.ts` | a sanitizacao do nome e os **tres** lacos de colisao | CA-1.4 |
| `envio/area-de-envios.ts` | a subpasta de ano e mes, e as duas mensagens de falha | CA-1.5 |
| `envio/contexto-de-envio.ts` | o contexto da operacao, com os seis colaboradores | — |
| `envio/enviar-arquivo.ts` | o fluxo, na ordem do legado | os seis |
| `envio/us-1-enviar-arquivo.test.ts` | os 33 testes da entrega | os seis |

### As cinco decisoes de T003 que a proxima tarefa precisa conhecer

1. **A ligacao com BC-01 que T002 deixou nomeada esta declarada, e e
   `ConteudoNaMidia`.** Duas chamadas: `get_post( $post_id )` e
   `wp_insert_attachment()`. O envio **nao** grava a linha de `posts`, pela razao
   que T002 escreveu — o unico caminho de escrita do legado passa por
   `wp_insert_post()`, que leva quatro pontos de extensao, a reescrita de `P2`, a
   unicidade do identificador na URL e a gravacao do `guid`. O pedido vai sem
   `post_status`, e e `P2` que o resolve em `inherit` do lado de BC-01
   (`gravacao/estado-na-gravacao.ts`, que ja existe).
2. **O caminho que atravessa a ligacao e ABSOLUTO.** `wp_insert_attachment()`
   recebe o caminho absoluto (`media.php:426`) e quem relativiza e
   `update_attached_file()` → `_wp_relative_upload_path()`
   (`wp-includes/post.php:885` e `:900`), **dentro** de `wp_insert_post()`. Logo a
   relativizacao e de BC-01. O que T003 resolve sao os caminhos para os quais
   tem porta: a pasta de destino e o destino do `mover`.
3. **A superficie do envio e dado da chamada**, e nao configuracao: ela decide a
   **consequencia** da segunda verificacao de capacidade. Ver o conflito aberto
   abaixo.
4. **O relogio entrou no modulo, e nao virou prazo.** T001 registrou que BC-04
   nao tinha porta de relogio porque *"esta feature nao tem prazo nenhum: os
   numeros dela sao medida em pixel"*, e deixou a saida escrita. O instante de
   `RelogioNoEnvio` serve a **uma** coisa — a subpasta `/AAAA/MM` da area de
   envios — e nenhum numero novo nasceu com ele (P6).
5. **Quatro funcoes de `wp-includes/formatting.php` chegam injetadas**, em
   `TextoNoEnvio` e `escaparHtml`: `remove_accents()`, `wp_is_valid_utf8()`,
   `sanitize_title_with_dashes()`, `sanitize_text_field()` e `esc_html()`. Nenhuma
   e implementada aqui, pelo mesmo motivo e com o mesmo aviso que BC-01 declarou
   para `sanitize_title()` e `sanitize_key()`: elas sao de `plataforma/` (feature
   015) e **nenhuma tarefa deste pacote as constroi**. Uma versao aproximada de
   `remove_accents()` produz **outro nome de arquivo**, e nome de arquivo e
   endereco publico.

### Dois achados do legado que a `spec.md` nao diz, e que um porte perde

Os dois estao fixados por teste, com 🔴 ou ⚠️ no comentario, porque sao
exatamente onde a intuicao conserta o legado sem querer.

1. **O titulo do anexo sai do nome CRU; o nome do arquivo sai do sanitizado.**
   `media_handle_upload()` le `$_FILES[...]['name']`, tira a extensao e passa por
   `sanitize_text_field()` (`media.php:313`-`:316`); `sanitize_file_name()` roda
   **so** dentro de `wp_unique_filename()`. Logo `ferias no mar.jpg` produz o
   titulo `ferias no mar` e o arquivo `ferias-no-mar.jpg`. Quem usar o nome em
   disco para o titulo troca o que a biblioteca de midia exibe.
2. **A troca de `%20` e `+` por traco em `sanitize_file_name()` e
   inalcancavel com a lista de caracteres de fabrica.** Os dois caracteres estao
   em `$special_chars` e sao **removidos** na linha anterior
   (`formatting.php:2073`-`:2074`), logo `minha%20foto.jpg` vira
   `minha20foto.jpg` e nao `minha-foto.jpg`. Nao e codigo morto no geral — a
   lista e ponto de extensao (`sanitize_file_name_chars`, P2) e uma extensao pode
   retirar `%` dela —, mas e o comportamento de fabrica, e e endereco publico.

### O que T003 NAO portou, com o motivo de cada coisa

Nenhum dos quatro e esquecimento: os quatro estao **nomeados no lugar exato do
fluxo**, que e o que o P2 e o P8 cobram de quem nao implementa.

| o que | ancora | por que |
|---|---|---|
| os **cinco** pontos de extensao do caminho — `wp_handle_upload_prefilter`, `wp_handle_upload_overrides`, `pre_move_uploaded_file`, `wp_handle_upload`, `wp_unique_filename` | `file.php:838`, `:864`, `:1012`, `:1073`; `functions.php:2832` | o barramento que os dispara e `REQ-162`, em `do-not-rewrite.md` — escopo **recusado**, nao pendente |
| a composicao da **descricao do anexo de audio** | `media.php:327`-`:389` | sao **dez** `msgid` traduziveis e duas chamadas a `number_format_i18n()`, e `plataforma/traducao/` nao existe nesta arvore. Chega **injetada** (`MetadadoDeArquivoNoEnvio.descricaoDeAudio`) para o comportamento ser alcancavel; omitida, **a descricao fica vazia**, e isso e divergencia declarada |
| o ajuste de permissao do arquivo gravado (`stat` + `chmod`) | `file.php:1046` | a porta de T001 **nao tem** operacao de permissao, e acrescenta-la e decisao de quem portar o adaptador. Nenhum criterio de US-1 depende dela |
| o cabecalho `X-WP-Upload-Attachment-ID` | `media.php:437` | e resposta HTTP, e nao ha porta de HTTP neste modulo (ver a secao das portas) |

E o que **nao e de T003 por ser de outra tarefa**: a geracao de derivadas, que e
onde `media_handle_upload()` termina (`:444`), e **T007**; a reducao na ingestao
e T009; o relato da falha e T011; e o registro do envio sem filtro (CA-9.4) e
T019. O mecanismo que nega `unfiltered_upload` por omissao **ja existia** em
`plataforma/autorizacao/revogacao-por-constante.ts`, e por isso CA-9.1 e CA-9.3
fecham sem codigo novo — o `if` do legado que faz a pergunta esta portado onde ele
esta no legado, dentro da validacao de tipo.

---

## O que T007 entrega, e so isso

A linha da tarefa: *"o comportamento de US-3 existe e os criterios CA-3.1, CA-3.2,
CA-3.3 e CA-3.4 passam contra o sistema novo"*. E a **segunda historia**
implementada deste modulo, em `derivadas/`, e sao **duas** operacoes na superficie
— porque no legado sao duas funcoes, com duas superficies e duas respostas de
permissao diferentes.

No legado o caminho e: `wp_generate_attachment_metadata()`
(`wp-admin/includes/image.php:579`) → `wp_create_image_subsizes()` (`:240`) →
`_wp_make_subsizes()` (`:430`), mais o par
`wp_get_missing_image_subsizes()` (`:87`) / `wp_update_image_subsizes()` (`:159`)
para a acao explicita de CA-3.3.

| arquivo | o que e | criterios |
|---|---|---|
| `derivadas/tamanhos-registrados.ts` | a resolucao dos seis tamanhos em execucao, e a regra que salta tamanho sem medida | CA-3.1, CA-3.2 |
| `derivadas/dimensoes-de-redimensionamento.ts` | `image_resize_dimensions()` e `wp_constrain_dimensions()` | CA-3.1, CA-3.4 |
| `derivadas/nome-da-derivada.ts` | o sufixo `-{largura}x{altura}` e o formato de saida | CA-3.4 |
| `derivadas/orientacao-exif.ts` | `maybe_exif_rotate()`, que roda **antes** do laco | CA-3.1 |
| `derivadas/contexto-de-derivadas.ts` | o contexto, com as duas portas e os cinco colaboradores | — |
| `derivadas/gerar-derivadas.ts` | o laco, a ordem de prioridade e **dois** dos cinco silencios de `M4` | CA-3.1, CA-3.4 |
| `derivadas/criar-derivadas-na-ingestao.ts` | a ingestao, com o passo de T009 nomeado no lugar | CA-3.1, CA-3.4 |
| `derivadas/regerar-derivadas.ts` | o que falta, e a **acao explicita** de regerar | CA-3.3 |
| `derivadas/us-3-gerar-derivadas.test.ts` | os 31 testes da entrega | os quatro |

### As seis decisoes de T007 que a proxima tarefa precisa conhecer

1. **A permissao destas duas operacoes e da SUPERFICIE, e isso esta declarado,
   nao esquecido.** A pauta que T001 escreveu no `index.ts` ja dizia *"o pacote
   nao declara nenhuma ... quem a expor declara a dela (P4)"*, e o legado
   confirma: nem `wp_create_image_subsizes()` nem `wp_update_image_subsizes()`
   perguntam capacidade, e as duas superficies que chamam a segunda perguntam
   **coisas diferentes** — `upload_files` no envio assincrono do editor
   (`wp-admin/includes/ajax-actions.php:2552`, mais o nonce `media-form`) e
   `edit_post` **daquele** anexo na rota REST de pos-processamento
   (`class-wp-rest-attachments-controller.php:1052`). Trazer uma para dentro
   tornaria a outra mais fechada ou mais aberta que o legado (P1).
2. **O nome da derivada e regra de dominio, e o calculo das medidas tambem.** A
   porta de processamento nao gera nome — ela o recebe —, e no legado o nome sai
   das medidas que `image_resize_dimensions()` calculou
   (`class-wp-image-editor.php:475`). Logo o calculo mora no dominio, em
   `dimensoes-de-redimensionamento.ts`, e **o adaptador tem de reusar aquela
   funcao**: se ele calcular por conta propria, o nome e o metadado podem
   discordar, o que no legado e impossivel.
3. **A medida `0` chega a porta como `0`, nao como `null`.** `make_subsize()`
   converte para `null` so a chave **ausente**, e tamanho registrado nunca tem
   chave ausente: `medium_large` chega `768x0`. O cabecalho da porta de
   processamento sugere o contrario ao explicar o `null` de `TamanhoPedido`; a
   leitura exata esta em `gerarUma()`, em `derivadas/gerar-derivadas.ts`.
4. **A gravacao final e de quem chama, na ingestao, e e daqui, na regeracao.** Sao
   duas funcoes com sequencias de escrita diferentes: a ingestao emite a inicial
   mais uma por derivada e **para ali** — o `wp_update_attachment_metadata()` de
   `media.php:444` e do chamador —, e a regeracao emite uma por derivada **mais
   uma no fim** (`image.php:188`). No caso "nada faltando" ela devolve **antes**
   da gravacao final e nao emite escrita nenhuma (`:177`).
5. **O EXIF e a orientacao chegam injetados, e a omissao dos dois e um estado
   real do legado.** O legado so le a etiqueta
   `if ( is_callable( 'exif_read_data' ) && 'image/jpeg' === $mime )`, logo
   servidor sem a extensao nao rotaciona e imagem sem EXIF nao ganha
   `image_meta`. Omitir as duas leituras reproduz exatamente isso — nao e
   divergencia. A guarda do tipo JPEG ficou **no dominio**, nao na borda.
6. **A relativizacao do caminho (`_wp_relative_upload_path()`) nasceu aqui**, que
   e o que T002 tinha deixado para *"quem tem as duas portas na mao"*. Ela esta
   em `derivadas/criar-derivadas-na-ingestao.ts` e o corte e `str_replace()`, que
   tira **todas** as ocorrencias da raiz, nao o prefixo.

### Tres achados do legado que a `spec.md` nao diz, e que um porte perde

1. **Mudar a medida de um tamanho na tela de configuracao nao regera nada.** A
   comparacao do que existe e do que falta e **por nome**, nos dois lugares
   (`image.php:134` e `:440`), e o legado explica: *"we keep the old sub-sizes
   with the previous dimensions as the image may have been used in an older
   post"*. E este o comportamento que CA-3.3 descreve pelo outro lado, e ha teste
   fixando-o.
2. **Imagem menor que um tamanho nao ganha a derivada daquele tamanho, e a guarda
   tem tres formas.** Com as duas medidas declaradas sao precisas **as duas**
   menores (`&&`, `media.php:597`), logo uma imagem de 2000x500 **ganha** `large`.
   Com so uma medida — o caso de `medium_large`, `768x0` — basta aquela.
3. **A derivada de um HEIC sai em JPEG.** O mapa de
   `wp_get_image_editor_output_format()` **nao e vazio desde a versao 6.7**, e e o
   mesmo mapa que o laco 3 do nome unico de T003 consulta. Supor mapa vazio
   produz outra extensao no endereco publico.

### O que T007 NAO portou, com o motivo de cada coisa

| o que | ancora | por que |
|---|---|---|
| a reducao na ingestao, a conversao de formato do arquivo principal e a rotacao do original inteiro | `image.php:285`-`:384`, com `_wp_image_meta_replace_original()` em `:206` | e **T009** (US-4), e e no passo 4 de `criar-derivadas-na-ingestao.ts` que o 🔴 conflito aberto mora |
| os ramos de video, audio e PDF de `wp_generate_attachment_metadata()` | `image.php:589`-`:595` e `:669`-`:729` | nenhum e imagem e nenhum e US-3; o de PDF reusa o mesmo laco com tres tamanhos forcados |
| o ramo `multi_resize()` de `_wp_make_subsizes()` | `image.php:501` | existe para implementacao de terceiro anterior a 5.3, e a porta de T001 declara `derivar` como obrigatoria. **Grava o metadado uma vez so**, e a diferenca e efeito no banco |
| os **nove** pontos de extensao do caminho | `image.php:146`, `:410`, `:750`; `media.php:911`, `:581`, `:530`, `:673`; `class-wp-image-editor.php:505`; `class-wp-image-editor-gd.php:589` | o barramento e `REQ-162`, em `do-not-rewrite.md` — escopo **recusado**. Cada um esta nomeado na posicao exata (P2) |
| `wp_attachment_is_image()` | `post.php:7391` e `:7332` | le `post_mime_type` (BC-01) **e** `get_allowed_mime_types()`, que pergunta `unfiltered_html` — logo depende de identidade, que e escopo de REQUISICAO. Chega por ligacao tardia, em `ConteudoNasDerivadas` |

E o que **nao e de T007 por ser de outra tarefa**: o relato da falha e T011
(US-5) — e a pergunta em aberto de *informar o ator* continua aberta —, a escolha
da derivada servida e T013 (US-6), e a regeracao depois de transformar a imagem e
T015 (US-7).

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

## 🔴 O que T003 encontrou aberto, e NAO resolveu

### CA-1.1 diz "exige", e duas das tres superficies do legado nao exigem

**Nao e ambiguidade: sao duas afirmacoes opostas sobre o mesmo passo.**

- **A `spec.md` diz exigencia.** CA-1.1, literal: *"o envio exige a capacidade de
  enviar arquivo e, quando ha conteudo de destino, a de editar aquele
  conteudo"*. UC-12 repete no campo *Autorizacao* e no passo 2, e `UT-056-1` do
  catalogo chama o caso de *"recusa o envio de quem nao pode enviar **ou** nao
  pode editar o conteudo de destino"*.
- **A arvore analisada recusa numa superficie e descarta o destino nas outras
  duas.** As tres fazem as **duas** perguntas; o que elas fazem com a segunda
  resposta e diferente:

| superficie | `upload_files` | `edit_post` do destino | ancora |
|---|---|---|---|
| tela de envio de midia | `wp_die()` | **`$post_id = 0`** e segue | `wp-admin/media-new.php:15` e `:24` |
| envio assincrono, navegador | `wp_die()` | **`$post_id = 0`** e segue | `wp-admin/async-upload.php:34` e `:108` |
| envio assincrono do editor | JSON `success: false` | **recusa** com texto proprio | `wp-admin/includes/ajax-actions.php:2617` e `:2633` |

O trecho das duas primeiras e literal e identico nas duas:

```php
if ( ! get_post( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
    $post_id = 0;
}
```

Quem nao pode editar o destino **nao e recusado**: o anexo nasce **sem pai** — e
passa a ter visibilidade propria, que e o CA-2.3 de **US-2**, por um caminho que
o ator nao escolheu.

**O que T003 fez, e o que ela nao fez.** Ela nao escolheu um lado:
`SuperficieDeEnvio` diz de onde a chamada veio e os **tres** desfechos do legado
sao devolvidos como sao (`autorizado`, `destino-descartado`, `recusado`), com os
textos do legado. CA-1.6 fecha de qualquer forma, porque o criterio cobra que as
superficies *"apliquem as mesmas duas verificacoes"* — e as tres aplicam, por
**uma** funcao, que e o que o teste afirma. O que **nao** foi feito e acrescentar
recusa a uma superficie que nao a tem: o P1 exige que *"toda divergencia tenha
uma referencia a resposta de `questions.md` ou ao ADR que a autorizou"*, e
nenhuma existe — as tres autorizadas sao o tempo limite do adaptador de IA, a
minimizacao do servico de reputacao e o ambiente-oraculo.

Mesmo precedente e mesma postura de
`contextos/conteudo/publicacao/permissao-de-publicacao.ts`, onde CA-1.1 pedia
*"recusa explicita na tela"* e o painel do legado **rebaixava** o estado em vez
de recusar. **Quem pegar T005 (US-2) e T019 (US-9) encosta nisto:** T005 porque o
anexo sem pai e o caminho de CA-2.3, e T019 porque CA-9.4 pede registro *"com
conta, arquivo e instante"* de um envio que pode ter chegado por qualquer das
tres superficies.

A analise completa, com as tres diferencas menores preservadas (a ordem da
leitura do destino, o `absint()` e o nonce), esta no cabecalho de
`envio/permissao-de-envio.ts`.

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

O que **T002** acrescenta a essa lista:

- O cenario dos **quatro tamanhos** cobra que *"o metadado de cada derivada e
  identico campo por campo nas duas"*. A forma que se compara campo por campo e
  `derivadas.ts`, e o teste afirma os bytes dela: `file`, `width`, `height`,
  `mime-type`, `filesize`, nessa ordem, com `filesize` ausente quando a derivada
  nao o tem.
- O cenario **`@divida-herdada`** cobra que *"o metadado gravado omite o tamanho
  que falhou"*. Isso so e representavel porque `sizes` e lista ordenada de
  entradas gravadas, e nao um conjunto fixo de tamanhos: a derivada que falhou
  simplesmente nao entra, e nenhuma escrita acontece por ela.
- O cenario **`@invariante`** de `P2` cobra que *"as duas reescrevem o estado
  para o de heranca"* e que *"nenhuma das duas o reescreve"* quando o estado ja e
  aceito. O vocabulario que a reescrita de T005 vai usar esta em `anexo.ts`, com
  os quatro estados na ordem do legado, e o teste afirma que `publish` nao esta
  entre eles.
- O cenario **`@cascata`** cobra *"o conjunto de linhas de metadado restante"* e
  *"a ordem das operacoes em disco"*. As duas consultas que T017 vai usar para a
  primeira metade — `SELECT meta_id ... WHERE post_id = ? ` e o par
  `SELECT * ... WHERE meta_id = ?` / `DELETE` — estao em `metadado.ts`, com o
  espaco final da cadeia do legado preservado.

O que **T003** acrescenta a essa lista:

- O cenario **`@composicao`** passa a ter **sequencia** para comparar, que era o
  que faltava: *"a sequencia de operacoes registrada e identica a do oraculo"* e
  *"nenhuma operacao a mais e executada"*.
  `envio/us-1-enviar-arquivo.test.ts` afirma a sequencia inteira de um envio sem
  colisao, operacao por operacao, na ordem — inclusive as **quatro** perguntas de
  nome alternativo que a conversao HEIC/HEIF do editor obriga.
- O cenario do **nome em conflito** fecha por aqui: *"as duas gravam com o mesmo
  nome final"*, *"o sufixo aplicado e identico nas duas"* e *"quando o envio e
  repetido tres vezes, a sequencia de nomes gerada e identica nas duas"* — o
  ultimo e um teste proprio, com o disco crescendo entre os envios.
- O cenario **`@concorrencia`** continua **sem fechar**, e isso e do legado:
  entre o calculo do nome unico e o `move_uploaded_file()` nao ha trava nenhuma,
  logo *"dois envios simultaneos do mesmo nome nao se sobrescrevem"* nao e
  garantido por este codigo e nao era no legado. Esta declarado no cabecalho de
  `nomeDeArquivoUnico()`; introduzir trava seria introduzir comportamento que o
  produto nao tem.

O que **T007** acrescenta a essa lista:

- O cenario dos **quatro tamanhos** fecha do lado do conjunto gerado: *"as duas
  geram exatamente os mesmos arquivos derivados"*, *"o tamanho de miniatura e
  recortado quadrado nas duas"* e *"os outros tres sao proporcionais nas duas"*.
  `derivadas/us-3-gerar-derivadas.test.ts` afirma o conjunto **pelo nome de cada
  arquivo pedido**, na ordem em que o legado os pede, e afirma por cima dos bytes
  serializados que *"o metadado de cada derivada e identico campo por campo"*.
- O cenario **`@divida-herdada`** fecha nos tres pontos que dependiam desta
  tarefa: *"as duas consideram o envio bem-sucedido"*, *"nenhuma das duas avisa o
  ator"* e *"o metadado gravado omite o tamanho que falhou"* — ha teste para a
  derivada que falha e para a imagem que nao abre, e os dois afirmam tambem a
  **contagem de escritas**, que e onde a omissao aparece no banco.
- O cenario **`@composicao`** ganha a segunda metade: *"nenhuma operacao a mais e
  executada"*. O duplo de sistema de arquivos daquele teste **lanca** em qualquer
  operacao, porque a geracao de derivadas nao toca aquela porta no legado — quem
  grava arquivo e a biblioteca de imagem —, e a porta de imagem registra `abrir`
  e `derivar` na ordem.
- A linha do contexto da spec *"o mesmo conjunto de tamanhos registrados nas duas
  metades"* passa a ser conferivel **em execucao**, e nao so no dado:
  `tamanhosRegistrados()` resolve os seis da opcao e do codigo, e ha teste para o
  tamanho que uma extensao acrescenta e para o que e saltado.
- O que **continua sem fechar aqui**: o cenario da **reducao na ingestao** (`M1`)
  e inteiro de T009, e o da **lista de origens responsivas** (`M3`) e de T013.
  Nenhum dos dois depende de decisao desta tarefa, e o primeiro depende da que
  ninguem tomou.

⚠️ `parity_specs.md` registra que a suite de *characterization tests* **nao
existe** nesta arvore, e que a paridade de tela tem de ser derivada secao por
secao (`DEV-001`, pendente). E a resposta 16 de `questions.md` autoriza o
ambiente-oraculo, que e o unico jeito de comparar o lado binario: enquanto ele
nao existir, o que se confere aqui e a grade, nao o arquivo.
