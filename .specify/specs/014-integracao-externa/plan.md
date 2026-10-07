# Plano — Integração externa

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


### Cliente HTTP de saída (`cliente-http`)

Primeira porta do plano escolhido, por decisão registrada em `architectures.json`: é a única das cinco cujo contrato já está escrito em padrão externo — o adaptador PSR-18 vendorizado em `wp-includes/php-ai-client/` — e a única em que a Pergunta 18 abriu exceção explícita ao idêntico, o que faz a primeira porta nascer com um caso de teste de verdade. São 37 módulos dependentes, 29 integrações e 64 endpoints. O que esta porta tem de reproduzir é um conjunto de comportamentos que todo cliente HTTP moderno trata como erro de configuração.

| candidato | o que é | situação |
|---|---|---|
| `undici` | undici | **recomendado pela pesquisa** |
| `http-do-runtime` | Cliente HTTP cru do runtime | candidato |
| `cliente-de-alto-nivel` | Cliente de alto nível com política embutida | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a primeira porta a nascer e precisa reproduzir requisição não bloqueante, TLS não verificado e repetição em claro sem lutar contra a biblioteca — e undici dá controle de agente e de TLS por requisição sem obrigar o produto a reimplementar pool e redirecionamento.

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Observabilidade (`observabilidade`)

REQ-159 é `must` e está `pronto`: todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto, estruturado e consultável, sem depender de modo de depuração, com verificação automatizada que falha ao encontrar tratamento de erro silencioso. A linha de base é 0 arquivos de log na árvore, 49 chamadas `error_log` e um único histórico persistente de falha: a opção `auto_core_update_failed`. E é pré-requisito da arquitetura escolhida pelo mesmo motivo do slot anterior — adaptador troca modo de falha, e sem registro a troca é invisível.

| candidato | o que é | situação |
|---|---|---|
| `registro-estruturado` | Registro estruturado em linha JSON | **recomendado pela pesquisa** |
| `escritor-proprio` | Escritor próprio sobre a saída de erro do runtime | candidato |
| `opentelemetry` | OpenTelemetry | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** REQ-159 AC2 e AC3 juntos pedem registro estruturado COM redação de campo sensível, e redação embutida é a diferença entre cumprir o critério e abrir o vazamento que `integrations.json` já documenta em outro canal.

## Modelo de dados

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| credencial de integração | com precedência declarada: variável de ambiente, depois constante, depois banco. Se a chave está no ambiente, o valor do banco é **ignorado** | a precedência é regra e é observável. E ela é uma inversão do hábito do produto, que sempre guardou configuração no banco |
| formato da credencial | pode ser usuário e senha num único valor, dividido no **primeiro** dois-pontos, para que a senha possa conter dois-pontos; com qualquer metade vazia, as duas voltam vazias | sem mudança |
| catálogo de serviços externos | espalhado pelo código, com o endereço escrito em cada ponto de chamada | a tarefa T002 de [`tasks.md`](tasks.md) o transforma em dado declarado, para que "quantos canais nascem sem cifra" seja consulta e não varredura |
| configuração de caixa postal | credencial em **texto puro** na configuração | pendente do conflito de REQ-157, na seção Fora de escopo da spec |
| conectores de modelo de linguagem | três declarações que apontam para extensões de provedor que não existem na árvore analisada | a resposta 18 manda portar as três como o núcleo as traz, com o provedor fora do escopo |
| adaptador de modelo de linguagem | roteia pelo cliente genérico **sem definir tempo limite**, logo valeria o default curto | **a única divergência autorizada desta feature**: a resposta 18 manda definir o tempo limite, porque o default é curto demais para geração de texto |

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| chamar serviço externo | endereço, método, corpo, tempo limite | resposta | tempo limite estourado, destino inalcançável, e o caso em disputa: falha de negociação segura, que no legado **repete a chamada sem cifra** |
| resolver credencial | nome da integração | credencial, pela precedência de ambiente, constante e banco | credencial ausente em todas as origens |
| validar destino | endereço vindo de dado | destino aprovado | destino em faixa interna ou endereço que não resolve, que é a guarda que o legado não tem num dos pontos |
| enviar e-mail | destinatário, assunto, corpo | confirmação de entrega ao transporte | falha de transporte, que é estado visível e não exceção |
| consultar serviço de versões e pacotes | versão corrente e ambiente | versões disponíveis e pacotes | serviço indisponível, caso em que a verificação apenas não acontece |
| notificar serviços externos | endereço publicado | notificação enviada só aos destinos da lista declarada | lista vazia, que é o padrão |

O contrato de tempo limite é o que REQ-154 cobra em toda chamada, e é por ele que passa a
divergência autorizada pela resposta 18.

## Migração de dados

**Nada vem do sistema velho** (resposta 2): nenhuma credencial, nenhum cache de consulta a
serviço externo.

Dois cards de descarte desta feature exigem declaração de migração que não existe
enquanto o conflito deles não for resolvido: REQ-157 pede que a migração declare o que
fazer com a configuração de caixa postal existente, e REQ-150 não pede migração mas muda o
comportamento de sete endpoints.

## Sequência

Depende de 002 (a notificação de serviços externos sai da publicação), 010 (a atualização
é o maior consumidor de chamada de saída) e 015 (o registro estruturado). É dependência de
009 (estilos de editor remotos e rede de distribuição).

Ordem interna: a borda de saída (tarefas T001 e T002) antes de tudo; o canal cifrado
(REQ-149) e a validação de destino (REQ-151) em seguida, porque atravessam todas as
chamadas; a resolução de credencial (REQ-152) antes da proibição de guardá-la em texto
recuperável (REQ-153); o tempo limite (REQ-154), o envio de e-mail (REQ-155), a consulta
de versões (REQ-156) e a notificação (REQ-181) depois.

## Riscos

1. **O conflito de REQ-149 com a resposta 12** atravessa a feature inteira: ele decide se
   a borda de saída recusa canal sem cifra ou o reproduz em 13 endereços.
2. **REQ-153 e a caixa postal se excluem** enquanto o descarte de REQ-157 estiver em
   conflito: a credencial da caixa é texto puro na configuração.
3. **O canal de atualização não tem garantia de autenticidade** por duas causas
   independentes que se somam, e as duas foram confirmadas por resposta humana como
   dívida herdada reproduzida de propósito.
4. **A integração mais crítica é com o próprio site**, e a falha dela é silenciosa por
   projeto. O protocolo está implementado quatro vezes.
5. **Nenhuma superfície de saída tem limite de repetição** declarado no legado além das
   travas de tempo, e inventar política de repetição é inventar comportamento (P6).
