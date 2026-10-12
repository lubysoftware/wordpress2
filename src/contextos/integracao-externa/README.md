# Modulo de integracao externa — BC-13

Feature `014-integracao-externa`. Tarefas fechadas com nota de entrega neste
arquivo: **T001** (esqueleto da borda de saida: as duas portas e uma
implementacao de cada) e **T002** (o catalogo de enderecos externos como dado
declarado). Este arquivo e a leitura obrigatoria de quem pegar a tarefa
seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro
lugar**, e o que **ninguem** decidiu.

A pasta e `contextos/integracao-externa/` porque e assim que
`target_architecture.md` nomeia BC-13 no esboco de arvore, com a divisao escrita
ao lado: *"4 (politica; o adaptador fica fora)"*. BC-13 e a fusao de
`cliente-http`, `ai-client`, `connectors` e `envio-de-email`, e a justificativa
do agrupamento esta la: e onde vivem **os 5 achados de seguranca** de
`integrations.md`, que `ESC-HTTP` manda migrar inteiros, e *"juntar politica de
integracao num contexto so e o que permite auditar os 5 de uma vez"*.

---

> ## 🔴 PARE AQUI SE A SUA TAREFA E T003, T005, T009, T011 OU T013
>
> **Este e o contexto com mais conflito aberto do pacote, e T001 nao resolveu
> nenhum deles — nem podia.** Sao quatro perguntas na secao *Perguntas em
> aberto* da `spec.md`, repetidas nas linhas 173 a 176 de `index.md`. Duas delas
> sao conflito entre **duas decisoes humanas em sentidos opostos**, e a tabela
> *Nao negociavel* da constituicao poe exatamente isso fora do que um agente
> decide: *"resolver um dos conflitos entre card `wont` e resposta humana"* e
> *"fechar o rebaixamento para canal sem cifra"*.
>
> A lista esta na secao [*O que T001 encontrou aberto*](#-o-que-t001-encontrou-aberto-e-nao-resolveu).
> Leia antes da primeira linha de codigo. O que T001 fez foi desenhar a borda
> para que **nenhuma das leituras fique fechada por acidente** — e e so isso.

---

## O que T001 entrega, e so isso

A linha da tarefa: *"a porta de cliente externo e a de envio de e-mail existem
com uma implementacao cada, e toda chamada de saida do sistema passa por elas,
sem nenhuma politica de prazo ou de repeticao definida"*.
`satisfaz: — (infraestrutura)`: T001 nao fecha criterio de aceite nenhum de
historia nenhuma, e nao implementa regra de negocio nenhuma.

| arquivo | o que e |
|---|---|
| `portas/porta-de-cliente-externo.ts` | a borda HTTP de saida, com os 18 argumentos de `WP_Http::request()` e o valor de fabrica de cada um citado como fato |
| `portas/porta-de-email.ts` | a borda de envio, com os **seis** argumentos de `wp_mail()` desta versao |
| `borda-de-saida/cliente-externo-que-registra.ts` | a implementacao da primeira porta: registra cada requisicao, devolve o que foi programado |
| `borda-de-saida/email-que-registra.ts` | a implementacao da segunda, pelo mesmo desenho |
| `index.ts` | a composicao: `criarModuloDeIntegracaoExterna(portas)` |
| `modulo.test.ts` | os 13 testes da entrega, e nada de historia |

**A composicao ganhou uma chave em T002** — `catalogo` —, e ela e **dado, nao
operacao**: nenhuma permissao e declarada porque nao ha operacao exposta nova. O
teste de superficie passou a afirmar tres chaves.

**O que a composicao NAO faz, e os testes afirmam:** nao guarda estado de modulo
(`EXT-CONTEXTO`, BR-MIGRAR-105 — e aqui isso tem cenario de paridade proprio, o
`@concorrencia` de `PT-017`: *"o estado de rebaixamento de canal de um nao afeta
o do outro"*) e nao resolve nada no carregamento (`EXT-ORDEM`, BR-MIGRAR-106 —
criar o modulo nao faz chamada de saida, nao manda e-mail e nao le
configuracao).

**Nenhuma dependencia nova entrou em `package.json`.** Ver a secao seguinte.

---

## O que T002 entrega, e so isso

A linha da tarefa: *"os enderecos dos servicos externos estao num registro unico
e inspecionavel, com o esquema de cada um explicito, de modo que a pergunta
'quantos canais nascem sem cifra' tenha resposta por consulta e nao por varredura
de codigo"*. `satisfaz: — (infraestrutura)`, como T001: **nenhum criterio de
aceite fecha aqui e nenhuma regra de negocio esta implementada**. O `plan.md` diz
a mesma coisa na tabela de modelo de dados — *"o catalogo de servicos externos
[estava] espalhado pelo codigo, com o endereco escrito em cada ponto de
chamada"*.

| arquivo | o que e |
|---|---|
| `catalogo/endereco-externo.ts` | a forma de uma linha: o motivo de cada campo e de cada valor de enumeracao |
| `catalogo/catalogo-de-enderecos.ts` | o dado: **19** servicos de saida e **54** enderecos, cada um com ancora `arquivo:linha` |
| `catalogo/consultas.ts` | as consultas, inclusive a da pergunta da entrega. Recebem o catalogo **por argumento** |
| `catalogo/catalogo-de-enderecos.test.ts` | os 14 testes da entrega, e nada de historia |

### A aritmetica das 54 linhas, para quem for conferir

A `spec.md` conta *"29 integracoes e 64 endpoints"*; dessas 29, **19 sao de
saida**, com **50 linhas de endpoint**. Daquelas 50:

- **−4** porque sao superficie de **entrada** deste sistema, e nao endereco de
  terceiro: o gatilho de webhook e o de alerta do servico de reputacao,
  `pingback.ping` recebido em `/xmlrpc.php` e o POST recebido em
  `/wp-trackback.php`.
- **+7** porque o feixe de loopback foi aberto: o artefato o conta em 3 linhas, e
  dentro delas o campo de verificacao de certificado **nao e uniforme** — ha
  chamada que exige (`wp-admin/includes/upgrade.php:541`, `wp-admin/admin.php:84`,
  `class-wp-site-health.php:3419`) e chamada que desliga pelo valor de fabrica do
  filtro (`wp-includes/cron.php:993`, `class-wp-site-health.php:2231`, `:3291`,
  `:3615`). Uma linha so teria de escolher um valor, e escolher seria afirmar
  errado sobre metade dos pontos.
- **+1** porque os dois feeds do painel sao enderecos literais distintos, com
  ponto de extensao proprio cada (`dashboard_primary_feed` em
  `wp-admin/includes/dashboard.php:1563`, `dashboard_secondary_feed` em `:1601`).

### A pergunta da entrega, e a resposta que ela tem

| recorte | quantos nascem sem cifra |
|---|---|
| servico de infraestrutura (`api-wordpress-org`) | **13** — o numero da regra de negocio de US-1 e de `BR-MIGRAR-115` |
| nucleo clonado inteiro | **16** |
| catalogo inteiro, com a extensao empacotada | **21** |

Os tres estao afirmados na suite, **nome por nome**, e nenhum esconde o outro.
Conferencia do 13: `grep -rn "http://api.wordpress.org" wp-admin wp-includes`
devolve **14** ocorrencias, uma delas docblock
(`class-wp-rest-pattern-directory-controller.php:13`) — logo 13 literais em
codigo. Os 8 que completam os 21 e nao sao daquele servico: a sondagem de DNS
curinga (`wp-admin/includes/schema.php:1163`), a caixa postal
(`wp-includes/class-pop3.php:100`), o sistema de arquivos remoto em FTP puro
(`class-wp-filesystem-ftpext.php:135`) e os **5** do servico de reputacao, que
vivem na extensao empacotada.

E a outra metade de `ESC-HTTP`: **7** canais do nucleo repetem a requisicao em
claro, **11** com a extensao empacotada.

### Tres achados proprios de T002, todos com ancora

1. ⚠️ **Dois pontos de chamada de loopback nao estao em nenhuma linha do
   artefato de analise**: a varredura de erro fatal depois de editar arquivo de
   extensao (`wp-admin/includes/file.php:586` e `:588`, com uma **segunda**
   chamada em `:617`) e a varredura depois de atualizacao automatica
   (`class-wp-automatic-updater.php:1806` e `:1807`). Com elas, o valor de
   fabrica desligado do filtro de verificacao local aparece em **6** pontos de
   chamada, e nao nos 4 registrados.
2. ⚠️ **O endereco semeado na instalacao nasce cifrado nesta versao**, e a lista
   **nao** nasce vazia: `'ping_sites' => 'https://rpc.pingomatic.com/'`
   (`wp-admin/includes/schema.php:450`). E o envio passa pela variante
   **validada** do cliente (`wp-includes/class-wp-http-ixr-client.php:92`), ao
   contrario do que a analise do legado afirma em prosa. As duas coisas tocam
   CA-8.2 e CA-8.3 em cheio, e sao de **T017** — leia antes.
3. ⚠️ **A frase que explica os 13 esta errada, e o numero esta certo.** A analise
   diz que sao *"os treze primeiros endpoints da tabela"* dela, o que incluiria o
   endereco de sais (`https://`, `wp-admin/setup-config.php:361`) e deixaria o de
   eventos de fora (`http://`, `class-wp-community-events.php:101`). Pelo literal
   e o contrario. Nao reescrevi artefato nenhum: `.specify/` e pacote gerado, e
   aquele documento e do oraculo, fora desta arvore.

### O que T002 NAO fez, de proposito

- **Nao resolveu o conflito de REQ-149 com a resposta 12**, e foi desenhado para
  nao o resolver: o esquema e **campo**, com ancora, e o catalogo nao monta URL
  para ninguem. Os dois lados se implementam lendo o mesmo dado.
- **Nao escreveu a verificacao automatizada de CA-1.2, CA-2.4, CA-4.4 nem
  CA-5.5.** Aqueles criterios pedem verificacao que **falha**, e a primeira delas
  reprovaria 13 linhas que a resposta 12 manda manter. As consultas listam e
  contam; nenhuma devolve aprovacao.
- **Nao decidiu o escopo do servico de reputacao** (quarta pergunta em aberto):
  os 6 enderecos dele estao declarados com `fonte: 'extensao-empacotada'` e saem
  por uma consulta. Omiti-los seria decidir pelo descarte; declara-los como
  nucleo seria decidir pelo contrario.
- **Nao trouxe numero de politica nenhum** — nem prazo, nem limite, nem contagem
  de repeticao. Ha teste que percorre campo por campo das 54 linhas e dos 19
  servicos afirmando que nenhum valor e numero. O prazo e de **T011**.
- **Nao tornou o endereco configuravel.** CA-7.4 (*"o endereco do servico e
  configuravel, para instalacao que use espelho proprio"*) e **T015**, e o
  catalogo nao antecipa a forma dela: as consultas recebem a fonte por argumento,
  logo um catalogo filtrado ou substituido ja responde hoje.

---

## Por que a implementacao de T001 registra requisicao, e nao abre conexao

A entrega pede *"uma implementacao cada"*. A implementacao que pode existir
**dentro deste contexto**, nesta onda, e a que registra o comando e devolve o
que foi programado. Quatro razoes, e as quatro sao de fora desta tarefa:

1. **Regra de dependencia 4** de `target_architecture.md`: *"`contextos/` ou
   `plataforma/` para adaptador concreto: proibido. So pela porta"*. E a
   descricao de BC-13 e ainda mais direta — *"a politica mora aqui"*, o adaptador
   em `adaptadores/`, porque *"sem essa divisao, o contexto seria o unico com
   dependencia de infraestrutura dentro de si"*.
2. **AD-04**: `adaptadores/` e assincrono e `contextos/` e sincrono. Cliente de
   rede dentro do contexto empurra `await` para dentro do dominio, que e o que
   aquela decisao existe para impedir — e o preco esta medido: `await` no meio
   dos 1.463 `echo` muda a **ordem de emissao do HTML**, que e saida observavel.
3. **O slot de tecnologia e implementacao de adaptador.** `undici` para
   `cliente-http` e biblioteca com transporte selecionavel para
   `envio-de-email`: as duas entram em `adaptadores/`, e a arvore hoje tem zero
   dependencia de execucao. O portao desta arvore e `tsc` mais `npm test`, sem
   rede e sem banco.
4. **E o duplo que a spec de paridade exige.** O `Contexto` de `PT-017` comeca
   com *"a porta de cliente HTTP substituida por duplo que registra cada
   requisicao nas duas metades"*. Sem ele, tres dos cenarios `@divida-herdada`
   nao rodam: eles comparam *"o esquema de URL usado em cada canal"*, *"o
   conjunto de canais que repete"* e *"o corpo da requisicao repetida"*.

**Registra comando, nao simula servidor** — a mesma escolha das portas falsas de
dados desta arvore. O que `PT-017` compara e qual requisicao sai, com qual
esquema, quantas vezes, inclusive os casos em que **nenhuma** sai; servidor de
mentira esconderia justamente isso. Lista vazia e **afirmacao**: e assim que se
prova que o esqueleto nao manda e-mail no carregamento, e a contagem de e-mails
ao administrador e **criterio de aceite** por AD-06.

⚠️ **O que falta, e nao esta em tarefa nenhuma desta feature:** o adaptador
concreto das duas portas. `tasks.md` de `014` tem 18 tarefas e nenhuma delas
escreve `adaptadores/`; `plan.md` da a sequencia (*"depende de 002, 010 e
015"*), `migration_strategy.md` poe `EXT-CONTEXTO` como **fatia 0**, *"antes de
qualquer dominio"*, e as *Notas* de `target_architecture.md` sao literais com o
agente de codificacao: *"construa `plataforma/contexto/` e
`plataforma/barramento/` antes de qualquer outra coisa, trate `adaptadores/`
como a unica camada assincrona"*. Quem for montar a fronteira assincrona comeca
por ali, nao por aqui.

---

## Por que estas duas portas, e nao outras

As duas sao bordas de AD-08 (*"cinco portas: dados, HTTP, sistema de arquivos,
cache de objeto e e-mail"*) e sao as duas que a linha de T001 nomeia. As que vao
aparecer, e em que tarefa, estao na tabela de `portas/index.ts`:

- **Porta de dados: T007.** O ultimo degrau da precedencia `I1` e o valor
  guardado no banco, e e T007 (US-3) que precisa dele. Declarar antes seria
  declarar superficie que o modulo nao exercita.
- **Porta de relogio: quando alguma tarefa precisar de instante.** CA-6.2 pede
  *"destinatario, assunto, instante e motivo"* no registro da falha de envio, e
  o rebaixamento do canal do servico de reputacao e por **tempo** (24 h), nao
  por tentativa. Quem chegar primeiro declara, como BC-05 fez com o prefixo base
  em T002.

**Esta porta de cliente externo e mais larga que a de BC-03, que tem o mesmo
nome**, e a diferenca e deliberada. `contextos/interacao-publica` declara seis
campos e **recusa** o campo de chamada nao bloqueante, porque aquele modulo faz
uma chamada so — a prova do pingback, que espera resposta. Aqui a entrega e
*"toda chamada de saida do sistema passa por elas"*, logo a borda tem de
expressar as 29 integracoes e 64 endpoints, inclusive o disparo nao bloqueante
do agendador. A regra de dependencia 3 proibe os dois contextos compartilharem o
tipo de qualquer forma.

---

## Os numeros do legado que T001 NAO escreveu, e onde eles entram

A entrega termina em *"sem nenhuma politica de prazo ou de repeticao definida"*,
e o prazo e **T011** (US-5, REQ-154). Os valores abaixo estao citados campo por
campo no cabecalho de `portas/porta-de-cliente-externo.ts` como **fato com
ancora**, para que T011 nao precise redescobri-los — e nenhum deles e codigo
hoje. O P6 exige que cada numero viva *"num ponto de configuracao nomeado, com o
valor de fabrica do legado"*: criar esses pontos e de T011.

Os 18 argumentos de `WP_Http::request()`, conferidos em
`wp-includes/class-wp-http.php:171` a `:232`:

| argumento | fabrica | ponto de extensao que o altera |
|---|---|---|
| `method` | `GET` | — |
| `timeout` | **5 s** | `http_request_timeout` (`:181`) |
| `redirection` | **5** (e **0** quando o metodo e `HEAD`, `:239`) | `http_request_redirection_count` (`:191`) |
| `httpversion` | `1.0` | `http_request_version` (`:201`) |
| `user-agent` | `WordPress/{versao}; {url do site}` | `http_headers_useragent` (`:211`) |
| `reject_unsafe_urls` | **false** | `http_request_reject_unsafe_urls` (`:221`) |
| `blocking` | true (forcado a true quando `stream`, `:318`) | — |
| `headers`, `cookies`, `body` | nenhum, nenhum, `null` | — |
| `compress` / `decompress` | false / true | — |
| `sslverify` | **true** | `https_ssl_verify` (`:393`), e `https_local_ssl_verify` (default **false**) na chamada ao proprio site |
| `sslcertificates` | o `ca-bundle.crt` do pacote | — |
| `stream` / `filename` | false / `null` | — |
| `limit_response_size` | `null` (sem teto) | — |

E os prazos que a arvore analisada escreve chamada por chamada, que e o que
CA-5.1 cobra (*"nenhuma herda um valor global por omissao"*) e CA-5.2
(*"operacao de longa duracao declara prazo compativel"*):

| chamada | prazo | ancora |
|---|---|---|
| verificacao de versao do nucleo | **30 s** no agendador, **3 s** fora dele | `wp-includes/update.php:237` |
| download de pacote | **300 s** | `wp-admin/includes/file.php:1160` |
| prova do pingback | **10 s**, com teto de **150 KB** de resposta | `wp-includes/class-wp-xmlrpc-server.php:7090`, `:7092` |
| disparo do agendador | **0,01 s**, nao bloqueante, sem verificar certificado | `wp-includes/cron.php:990` a `:993` |
| leitura de assinatura de pacote | teto de **10 KB** | `wp-admin/includes/file.php:1322` |
| geracao de texto por modelo de linguagem | **30 s** no construtor de prompt | `wp-includes/ai-client/class-wp-ai-client-prompt-builder.php:193` |

🔴 **A ultima linha e a unica divergencia autorizada desta feature, e ela e mais
estreita do que a pergunta supos.** A resposta 18 manda *"definir o tempo limite
no adaptador PSR-18 em vez de herdar o default de 5 s"*, e `discard_log.md`
registra a correcao: na arvore analisada o construtor de prompt **ja** usa
`$default_timeout = 30.0`, e o adaptador so define `timeout` quando recebe
opcoes de requisicao
(`wp-includes/ai-client/adapters/class-wp-ai-client-http-client.php:142` a
`:144`) — logo os 5 s valem apenas para o caminho **sem** opcoes. Quem exercer a
divergencia cita a resposta 18 no codigo, como o P1 manda, e `AD-09` a nomeia
*"exceca unica para nao abrir precedente"*.

---

## 🔴 O que T001 encontrou aberto, e NAO resolveu

### 1. REQ-149 exige o oposto do que a resposta 12 decidiu

**Nao e ambiguidade: sao duas decisoes humanas em sentidos opostos sobre o mesmo
comportamento.**

- **REQ-149 e `must`** e virou US-1, com tres criterios que nao admitem canal em
  claro: CA-1.1 (*"nenhum endereco de servico externo e escrito com esquema sem
  cifra no codigo"*), CA-1.2 (*"uma verificacao automatizada varre o codigo e
  falha quando encontra endereco externo sem cifra"*) e CA-1.3 (*"falha na
  negociacao segura resulta em erro da chamada, registrado, nunca em tentativa
  sem cifra"*).
- **A resposta 12 decidiu manter**, e `BR-MIGRAR-115` (`ESC-HTTP`) a registra: o
  rebaixamento *"migra inteiro: 13 canais nascem em `http://` e 7 repetem a
  requisicao em claro"*, inclusive o de somas de verificacao, como **divida
  herdada reproduzida de proposito**, *"e a implantacao pode fechar a brecha por
  configuracao sem alterar o nucleo"*.
- **O descarte REQ-150 diz o contrario da resposta 12**, e a propria `spec.md`
  marca o conflito como *"registrado, nao resolvido, e explicito"*.

**As duas afirmacoes se conferem contra esta arvore, e as duas contagens batem:**
sao 13 enderecos escritos em texto claro e **7** pontos que repetem a chamada em
claro quando a primeira falha — `wp-includes/update.php:258`, `:484` e `:770`,
`wp-admin/includes/update.php:158` (as somas de verificacao),
`wp-admin/includes/plugin-install.php:183`, `wp-admin/includes/theme.php:574` e
`wp-admin/includes/translation-install.php:86`. O padrao e sempre o mesmo, e
quem o portar vai reconhece-lo: o endereco nasce em `http://`, e guardado em
`$http_url`, e promovido com `set_url_scheme( $url, 'https' )` se
`wp_http_supports( array( 'ssl' ) )`, e repetido em claro no `is_wp_error`
(`wp-includes/update.php:226` a `:231` e `:248` a `:258`). O **catalogo** desses
enderecos **existe desde T002**, em `catalogo/`: os 13 e os 7 saem por consulta,
com ancora linha por linha, e **nenhuma consulta reprova nada** — ver
*O que T002 entrega*.

**T001 nao depende da resposta, e e por isso que esta tarefa fechou:** a porta
carrega o esquema **como foi escrito** — nao promove, nao recusa — e devolve a
falha **como valor**, de modo que tanto a repeticao de `ESC-HTTP` quanto o erro
que REQ-149 pede cabem no mesmo contrato, escritos por quem chama. Dois testes
de `modulo.test.ts` fixam isso de proposito, e um deles diz na propria mensagem
que mudar a afirmacao e decidir o que nao se decide aqui. **T003 depende.**

### 2. REQ-153 e a caixa postal se excluem

REQ-153 (US-4) proibe guardar credencial de integracao em texto recuperavel. A
credencial da caixa postal do legado fica em **texto puro** na configuracao
(`wp-mail.php:18`) e trafega em claro. O descarte REQ-157 tiraria o caminho de
escopo, mas **as respostas 10 e 19 o contradizem por consequencia**: mandam
preservar a trava de cinco minutos daquele caminho, e a trava so existe se o
caminho for portado. Ou a caixa postal e portada com a credencial em claro, ou
REQ-153 e violado na primeira integracao.

T001 nao topa nisso: a porta de e-mail e de **saida**, e ler uma caixa POP3 e
outro protocolo e outra porta. **T009 e quem decide se consegue fechar US-4 sem
a resposta — e provavelmente nao consegue.**

### 3. Os tres conectores de modelo de linguagem

O descarte REQ-158 diz para nao portar as tres declaracoes sem provedor. A
resposta 18 diz para portar *"como o nucleo os traz"*, com o provedor fora de
escopo e o ator continuando sem caso de uso. Conflito *"registrado, nao
resolvido, e explicito"* na `spec.md`, e o cenario `@invariante` de `PT-017`
cobra o lado da resposta 18 (*"os tres conectores de provedor estao declarados
nas duas"*). Nenhuma tarefa de `tasks.md` nomeia os conectores de IA: eles
aparecem nos *componentes internos* de BC-13 em `target_architecture.md` e em
mais nenhum lugar deste pacote.

### 4. O servico externo de reputacao esta dentro ou fora?

A quarta pergunta em aberto da `spec.md`: a resposta 13 poe o servico de
reputacao **fora do nucleo clonado**, como extensao empacotada, e
`discard_log.md` ja descartou o envio integral. *"Isso muda o que esta feature
precisa entregar, e a decisao de escopo nao esta registrada em card nenhum"*.
T001 nao declarou nada especifico de classificador — a borda serve qualquer
chamada de saida, e nenhum campo dela e do servico de reputacao.

### 5. Um achado proprio de T001: a porta de e-mail tem cinco campos em dois contextos e seis aqui

`wp_mail()` desta versao tem **seis** argumentos — a assinatura e
`wp_mail( $to, $subject, $message, $headers = '', $attachments = array(),
$embeds = array() )` (`wp-includes/pluggable.php:189`), com
`@since 6.9.0 The $embeds parameter was added.` (`:176`), e o ponto de filtro
`wp_mail` recebe os seis num arranjo (`:209`).

`contextos/conteudo` declara seis e **ja registrou** que
`contextos/identidade-e-acesso` declara cinco; `contextos/interacao-publica`
tambem declara cinco. Este contexto declara seis. **Nao mexi nos outros** — nao
e tarefa de T001 desta feature, e a regra de dependencia 3 proibe compartilhar o
tipo de qualquer forma. Fica aqui porque BC-13 e o contexto que detem a politica
do slot `envio-de-email`, logo e daqui que a divergencia tem de ser visivel para
quem revisar a paridade do slot. O P2 poe os **argumentos** do ponto de extensao
no contrato publico: uma porta com cinco campos entrega a extensao um argumento a
menos do que o legado lhe da.

---

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Limite de taxa.** `REQ-160` esta em `do-not-rewrite.md` (escopo recusado,
  nao trabalho pendente), o P6 recusa numero que o legado nao tem, a resposta 19
  poe limite de taxa **fora do nucleo**, como decisao de implantacao, e o cenario
  `@divida-herdada` de `PT-017` cobra que *"nenhuma das duas aplica limite de
  taxa"* e que *"os dois unicos freios observados sao as travas de tempo do
  legado"*. ⚠️ Com uma nota que o proprio cenario acrescenta e que vale repetir:
  a regra e identica, o **raio de alcance** nao — em PHP uma enxurrada custa um
  processo por requisicao, que morre; num runtime de laco unico, ela bloqueia o
  laco.
- **Retry de infraestrutura.** AD-06: *"nao ha broker, DLQ nem retry
  generico"*, e `A6` da **exatamente uma** segunda chance, em uma hora, e **nao**
  notifica. O numero de e-mails ao administrador e criterio de aceite.
- **Assinatura verificada de pacote como exigencia.** A tabela *Nao negociavel*
  poe *"exigir assinatura verificada de pacote"* fora do que um agente decide: a
  resposta 11 manda **manter a tolerancia**, com o caso "sem assinatura"
  silenciado fora do modo de depuracao, e `wp_trusted_keys()` devolve lista vazia
  desde 2021-04-01.
- **Envio integral ao servico de reputacao.** A resposta 13 classifica o envio
  de *"todo campo string de `$_POST` e todo cabecalho de `$_SERVER` exceto o
  cookie"* como **defeito conhecido, nao regra do produto**, e `parity_specs.md`
  registra a minimizacao como **excecao declarada** ao byte a byte.

---

## Como se confere que este modulo tem paridade

A spec de paridade desta feature e **`PT-017`**, em
`.specify/migration/parity_tests/17-integracao-externa-e-rebaixamento-http.feature`:
cenarios sobre `I1`–`I7`, `ESC-HTTP` e `ESC-IA`, com UC-15 e UC-46 como casos
de uso, nas areas *saida byte a byte nos contratos* e *comportamento de caso de
uso* da Decisao 2. (⚠️ divergencia de contagem, conferida: o indice de
`parity_specs.md` registra **13** cenarios na linha de `PT-017`, e o arquivo tem
**15** blocos — 14 `Cenario` e 1 `Esquema do Cenario`. Nao mexi em nenhum dos
dois: `.specify/` e pacote gerado, lido e nao reescrito.) O arquivo se abre dizendo que e *"o mais desconfortavel do
conjunto, e de proposito"*.

O que T001 ja torna conferivel por ali:

- O **`Contexto`** do arquivo exige *"a porta de cliente HTTP substituida por
  duplo que registra cada requisicao nas duas metades"*. E o que
  `borda-de-saida/cliente-externo-que-registra.ts` e, e `modulo.test.ts` afirma
  que a porta e substituivel **sem tocar nenhum arquivo do modulo** — o criterio
  de "substituivel" de BR-MIGRAR-103 (`EXT-SUBST`).
- O cenario **dos treze canais** pede que *"o esquema de URL usado em cada canal
  seja identico nas duas"* e que *"o numero de canais que nascem em texto claro
  seja o mesmo nas duas"*. T001 fixa que o esquema **atravessa a porta como foi
  escrito**; **T002 entrega o conjunto e o numero**, por consulta, com os tres
  recortes afirmados na suite (13 no servico de infraestrutura, 16 no nucleo, 21
  no catalogo inteiro). O lado do legado continua sendo afirmado por ancora, nao
  por execucao, enquanto o oraculo nao existir.
- O cenario **das sete repeticoes** compara *"o conjunto de canais que repete"* e
  *"o corpo da requisicao repetida"*. O **conjunto** sai do catalogo de T002
  (`repeteEmClaroNaFalha`, com a condicao e a chamada ancoradas linha por linha);
  o **corpo** e visivel em `requisicoes`, e nenhuma politica da porta o produz:
  a repeticao, quando existir, sera do chamador.
- O cenario **`@concorrencia`** exige que *"o estado de rebaixamento de canal de
  um nao afete o do outro"*. O modulo nao guarda estado e cada composicao tem a
  sua implementacao; o teste de duas composicoes afirma isso.
- A contagem de e-mails, que `parity_specs.md` poe na linha 11 das divergencias
  que reprovam paridade, se confere contando `mensagens`.

⚠️ Duas ressalvas que nao sao desta tarefa e nao podem ser esquecidas:
`parity_specs.md` registra que **nenhum** dos 985 testes do catalogo rodou
contra o legado (*"sao especificacao, nao evidencia"*), e o oraculo executavel
que a resposta 16 autoriza e **T001 da feature `015`**, que nao existe. Enquanto
ele nao existir, *"identico"* aqui e afirmado com arquivo e linha do legado,
nao verificado por execucao — e e por isso que cada afirmacao deste modulo traz
a ancora.
