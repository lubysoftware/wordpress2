# Plano — Autoria e publicação

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


### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Serialização do valor persistido (`serializacao-de-valor-persistido`)

Não é slot de infraestrutura, é slot de formato de dado, e é obrigatório porque o formato está DENTRO das colunas: `options.option_value`, `postmeta.meta_value`, `usermeta.meta_value` e `signups.meta` guardam valor serializado pelo formato nativo do PHP quando não é escalar (`erd-complete.md`, linhas 127, 276, 281 e 352), com 21 `maybe_serialize`, 17 `maybe_unserialize` e 9 `is_serialized` na árvore. `erd-complete.md` diz a consequência em uma linha: 'uma migração que normalize permissões precisa parsear PHP serializado, não SQL'. Em TypeScript esse formato não existe, e a Pergunta 2 fixa que a cascata observável não pode mudar.

| candidato | o que é | situação |
|---|---|---|
| `implementacao-propria` | Implementação própria do formato, com suíte de conformidade | **recomendado pela pesquisa** |
| `biblioteca-de-terceiro` | Biblioteca de serialização PHP para JavaScript | candidato |
| `json-no-lugar` | Trocar o formato por JSON no armazenamento | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O formato é pequeno e fechado, a conformidade tem de ser provada byte a byte contra o oráculo da Pergunta 16 de qualquer forma, e nenhuma biblioteca escolhida sem acesso à rede dispensa essa prova.

### Análise e sanitização de HTML (`analise-de-html`)

`html-api` é uma das DUAS raízes do grafo de dependência de todo o sistema (`architecture-graph.json`), e `kses-e-sanitizacao` está no núcleo crítico, com 11 ou mais dependentes diretos. São 16.590 linhas em 14 arquivos de `wp-includes/html-api/` mais 3.159 de `wp-includes/kses.php`, e as duas fazem trabalhos diferentes que um projeto novo confundiria: a primeira é um tokenizador que persegue a especificação do HTML5 e EDITA a string no lugar; a segunda é a lista de permissão que decide o que cada papel pode publicar — `permissions.md` registra que `editor` tem `unfiltered_html`.

| candidato | o que é | situação |
|---|---|---|
| `porte-a-mao` | Porte à mão das duas, com a tabela de referências de caracteres | **recomendado pela pesquisa** |
| `tokenizador-de-terceiro` | Tokenizador de terceiro conforme a especificação | candidato |
| `sanitizador-de-terceiro` | Sanitizador de terceiro por lista de permissão | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que parece substituível, o tokenizador, é um editor de string que nenhum analisador de árvore reproduz sem reescrever o `post_content`; e a outra metade, KSES, é fronteira de autorização, não higiene de HTML.

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

## Modelo de dados

O centro é o registro universal de conteúdo, que no legado é uma tabela única com
discriminador de tipo.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| `posts` | tudo que é versionável: 16 tipos no núcleo, de artigo e página a modelo de tema, estilo global e pedido de privacidade. Carrega `post_status` (12 valores), `post_name` (o identificador na URL), `post_password` em texto claro, `post_date` e `post_date_gmt`, `post_parent` e o contador de comentários | o discriminador continua, porque é o que faz tipo novo herdar autor, data, versão, lixeira, metadado e classificação. **`post_parent` precisa virar três relacionamentos**: página mãe, conteúdo anfitrião de anexo e conteúdo original de versão. Mantê-lo como uma coluna só reproduz a ambiguidade |
| `postmeta` | extensão aberta em par chave e valor, serializado quando não é escalar. A chave é indexada só nos 191 primeiros caracteres | continua aberta: é a contrapartida de dados da extensibilidade, e sem ela nenhuma extensão acrescenta campo |
| versões anteriores | linhas de `posts` do tipo `revision`, com `post_parent` apontando para o original | continuam sendo conteúdo, não tabela própria |

Dois detalhes que decidem a paridade: o default do armazenamento para o estado é
publicado e o default do código é rascunho, e as duas regras valem, cada uma para quem
escreve por um caminho; e o identificador na URL só é único a partir da publicação, o que
faz o identificador de um rascunho mudar sozinho quando ele é publicado.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| gravar conteúdo | tipo, campos, estado opcional | conteúdo gravado com estado resolvido (rascunho quando nada é informado) | sem permissão, tipo não registrado, campo acima do limite da coluna |
| publicar | identificador | conteúdo publicado, com transição notificada por ponto de extensão | sem permissão de publicar, conteúdo já publicado (operação nula, sem transição) |
| agendar publicação | identificador e instante futuro | conteúdo em estado agendado, com evento na fila | instante no passado |
| submeter para revisão | identificador | conteúdo pendente, com o identificador na URL esvaziado quando quem submete não pode publicar | sem permissão de editar |
| revisar e publicar de outro autor | identificador | conteúdo publicado com a autoria original preservada | sem permissão sobre conteúdo de outro |
| listar versões e restaurar | identificador do conteúdo, identificador da versão | lista, ou conteúdo com o corpo da versão | versão inexistente |

Erro é devolvido como valor, não como exceção: é assim no legado e é o que permite a um
ponto de extensão inspecionar a falha.

## Migração de dados

**Nada vem do sistema velho** (resposta 2): nenhum conteúdo, nenhuma versão, nenhum
metadado. Todas as estruturas nascem vazias, e a instalação nova cria o conteúdo de
exemplo que o instalador do legado cria, porque isso também é comportamento observável de
instalação.

Se algum dia houver migração de instalação real, três coisas desta feature exigem decisão
antes: as três semânticas da coluna de pai, o contador de comentários desnormalizado, que
pode estar errado no banco de origem e precisa ser recalculado, e as consultas de órfão,
que o legado tolera como estado normal.

## Sequência

Depende de 001 (identidade e autorização), de 003 (classificação, pela regra do termo
padrão aplicada na gravação e na publicação) e de 011 (fila agendada, para a publicação
futura). A dependência de 011 é frágil enquanto o conflito daquela feature não for
decidido: o agendamento do legado é guardado por verificação dupla justamente porque a
fila não é confiável, e essa verificação dupla é o que torna REQ-024 construível mesmo
com a fila do legado.

Ordem interna: a gravação com estado resolvido (REQ-020) antes da publicação (REQ-019),
que vem antes do identificador único (REQ-021), do conteúdo privado (REQ-022) e da
republicação nula (REQ-023). Agendamento, submissão e revisão vêm depois.

## Riscos

1. **A sanitização do corpo não está especificada neste pacote** (REQ-030 ficou
   `bloqueado`). Quem construir decide sozinho, e a regra do domínio põe o privilégio de
   marcação bruta também no papel de editor.
2. **O formato de armazenamento do corpo** depende de REQ-032, também fora do pacote, e
   de código que não está na árvore analisada. A resposta 15 diz de onde ele vem.
3. **O agendamento não é confiável por desenho**: a verificação dupla recusa publicar o
   que não está no estado agendado e reagenda quando a data ainda não chegou. Implementar
   um agendador confiável e remover a verificação dupla muda comportamento observável.
4. **O identificador na URL muda sozinho na publicação.** Um porte que torne o
   identificador único desde o rascunho produz endereços diferentes dos do legado.
5. **O contador de comentários é suspenso durante lote** e atualizado depois. Um modelo
   que o calcule sempre na leitura resolve o problema e muda o que a listagem devolve no
   meio de um lote.
