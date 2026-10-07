# Plano — Biblioteca de mídia

> Como ler este plano: a spec diz **o quê** e **por quê**; este arquivo diz **como**, e
> é o único dos três que fala de tecnologia. Nenhum requisito novo nasce aqui: o que não
> estiver na [spec](spec.md) não é requisito, é invenção.

## Stack

**O que já é decisão humana registrada**

| decisão | valor | onde foi registrada |
|---|---|---|
| Arquitetura | `hexagonal` (Portas e adaptadores) | `refactor/decision.json`, decidida em 2026-10-07 por humano (Studio) |
| Objetivo do porte | comportamento observável idêntico, partindo de instalação nova, sem dado a migrar | respostas 1 a 5 de [`questions.md`](../../../questions.md) |
| Linguagem alvo | TypeScript | a resposta 15 de [`questions.md`](../../../questions.md) a nomeia ao decidir de onde vem o lado cliente |

**O que NÃO é decisão de ninguém: os slots abaixo.** Eles vêm de
[`refactor/tech-stack.json`](../../../refactor/tech-stack.md), que é **pesquisa**: um
leque de candidatos por slot, com um `recommended` e a razão dele. Não existe, no Studio,
clique que decida stack, e quem define a tecnologia é quem vai construir, ao abrir os
agentes. Abaixo, recomendação é recomendação; nada aqui está escolhido.

Os slots listados são os que esta feature usa. O leque completo, com os 17 slots, os
riscos de cada candidato e a lista de verificação que a pesquisa deixou aberta, está em
[`refactor/tech-stack.md`](../../../refactor/tech-stack.md).


### Processamento de imagem (`processamento-de-imagem`)

`edicao-de-imagem` tem 2 implementações da mesma interface na árvore — `class-wp-image-editor-gd.php` e `class-wp-image-editor-imagick.php`, com `class-wp-image-editor.php` como base — selecionadas em execução pelo que a hospedagem tiver. É adaptador sem o nome, como o `fit_reason` da arquitetura escolhida diz de outras bordas. Não está entre as 5 portas do plano de migração, e precisa estar neste leque porque as extensões PHP `gd` e `imagick` não têm contraparte automática: UC-12 (enviar mídia) e UC-13 (editar imagem) param sem elas.

| candidato | o que é | situação |
|---|---|---|
| `sharp` | Biblioteca nativa de processamento de imagem | **recomendado pela pesquisa** |
| `imagem-em-js-puro` | Processamento em JavaScript puro | candidato |
| `imagemagick-externo` | ImageMagick por processo externo | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** Cobre o papel do Imagick, que é o editor preferido do legado quando existe — e a decisão que realmente importa neste slot não é a biblioteca, é declarar se 'idêntico' para imagem é o arquivo ou a grade de derivadas.

### Sistema de arquivos e escrita remota (`sistema-de-arquivos`)

Terceira porta do plano escolhido, e o módulo mais denso do levantamento: `WP_Filesystem` com 5 arquivos — base e 4 implementações (`direct`, `ftpext`, `ftpsockets`, `ssh2`) — e 54 regras de negócio registradas. É por aqui que o produto escreve código executável no disco (UC-33, UC-34). `technologies.json` propõe reduzir a só o driver `direct`, e esta etapa NÃO pode fazer isso: o diálogo de coleta de credencial é tela do produto, protegida por nonce `filesystem-credentials`, e a opção `ftp_credentials` grava host e usuário removendo senha e chaves antes (`wp-admin/includes/file.php:2495-2503`).

| candidato | o que é | situação |
|---|---|---|
| `fs-mais-ssh2-e-ftp` | Sistema de arquivos do runtime, com biblioteca de SSH2 e de FTP | **recomendado pela pesquisa** |
| `so-direct` | Só o driver direct, exigindo permissão de escrita | candidato |
| `cliente-do-sistema` | Delegar a cliente do sistema (sftp, ftp) | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato que mantém os quatro caminhos que a tela de credencial do produto oferece, e reduzir para um é mudança observável que nenhuma das 23 respostas autoriza.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

## Modelo de dados

O arquivo enviado é conteúdo, não entidade própria. É isso que lhe dá autor, data,
metadado, classificação e endpoint sem nada ter sido escrito para ele.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| anexo como registro de conteúdo | o tipo de mídia numa coluna própria, o endereço do arquivo no campo de identificador global, e a legenda da mídia no campo de resumo do conteúdo | sem mudança observável. O estado do anexo é sempre herdado: qualquer valor fora da lista permitida é reescrito para herdar, porque a visibilidade do arquivo é a do conteúdo que o carrega |
| metadado do anexo | a descrição das derivadas geradas, com largura, altura e nome de arquivo de cada tamanho, e o caminho do arquivo relativo à área de envios | continua em metadado aberto, porque é por aí que extensão acrescenta tamanho |
| original preservado | quando a imagem é reduzida na ingestão, o arquivo servido passa a ser uma cópia com sufixo no nome e o original fica guardado | o sufixo aparece no endereço público: ver a pergunta em aberto da spec sobre ele ser contrato |
| área de envios | pasta no sistema de arquivos, organizada por ano e mês | é a porta `sistema-de-arquivos`, e ela tem quatro implementações no legado (direta, e três remotas) |

Os quatro tamanhos de fábrica e os dois de alta densidade são dado de configuração com os
valores do legado, e o conjunto de derivadas servidas para uma imagem para em 2.048 px
independentemente dos tamanhos que existirem.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| enviar arquivo | arquivo, conteúdo de destino opcional | anexo criado, com as derivadas geradas | tipo real do arquivo fora da lista permitida, falha de escrita, sem permissão de enviar |
| gerar derivadas | identificador do anexo | metadado com as derivadas | falha de processamento, que no legado é **silenciosa** em cinco pontos |
| servir derivada | identificador e espaço de exibição | o arquivo da derivada adequada | nenhum: sem derivada adequada, serve a maior disponível |
| transformar imagem | identificador e operação | nova derivada, com o original preservado | operação não suportada pela implementação de processamento |
| restaurar original | identificador | derivadas regeradas a partir do original | original ausente |
| apagar anexo | identificador | arquivo e registro apagados, **em definitivo** | sem permissão |
| contornar filtro de tipo | declaração explícita da instalação | envio aceito fora da lista | declaração ausente |

O apagamento é definitivo por contrato, não por omissão: a resposta 9 decidiu que a mídia
continua sem lixeira e sem aviso.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). A área de envios nasce vazia, e vale registrar
que ela também não existe na árvore analisada: é a lacuna L5 de `soul.md`, e por isso
nenhuma afirmação sobre arquivos reais desta instalação foi possível em nenhuma etapa.

Se houver migração futura, o trabalho não é de banco: é copiar árvore de arquivos e
recalcular derivadas, porque o metadado de derivada aponta para nome de arquivo e a
implementação de processamento escolhida muda os bytes gerados.

## Sequência

Depende de 001 (autorização) e de 015 (o núcleo utilitário e o relato de erro, de onde
sai o tratamento da falha de processamento). É dependência de 008, porque o apagamento de
dado pessoal inclui arquivo enviado, e de 009, pela biblioteca de fontes e pelas imagens
da personalização.

Ordem interna: o envio com validação de tipo (REQ-056) antes de tudo; a herança de
visibilidade (REQ-057) e a geração de derivadas (REQ-058) depois; a redução na ingestão
(REQ-059), o relato de falha (REQ-060) e a escolha da derivada (REQ-061) em seguida; a
transformação (REQ-062), o descarte do arquivo não referenciado (REQ-063) e o contorno do
filtro (REQ-064) por último.

## Riscos

1. **A implementação de processamento de imagem muda os bytes gerados.** Duas
   bibliotecas produzem arquivos diferentes para a mesma entrada, e "idêntico" aqui não
   pode significar byte a byte: o teste de paridade precisa comparar dimensão, tipo e
   nome de arquivo, não o conteúdo binário.
2. **A falha silenciosa é regra** (cinco pontos sem registro). O card pede o contrário, e
   a pergunta em aberto da spec registra o conflito.
3. **O sufixo do arquivo reduzido é endereço público.**
4. **A validação do tipo real do arquivo** depende de inspecionar conteúdo, não extensão,
   e o legado tem uma lista de tipos permitidos que uma declaração da instalação pode
   contornar inteira.
5. **A porta de sistema de arquivos tem quatro implementações no legado**, três delas
   remotas, e elas existem porque este produto precisa sobrescrever os próprios arquivos
   em execução (decisão fundadora D7).
