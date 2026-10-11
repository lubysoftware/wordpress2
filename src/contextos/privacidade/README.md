# Modulo de privacidade — BC-06

Feature `008-privacidade-e-dados-pessoais`. Tarefas fechadas com nota de entrega
neste arquivo: **T001** (esqueleto, as quatro portas e o registro de provedores
vazio). Este arquivo e a leitura obrigatoria de quem pegar a tarefa seguinte:
ele diz o que ja esta decidido, o que esta decidido **em outro lugar**, e o que
**ninguem** decidiu.

A pasta e `contextos/privacidade/` porque e assim que `target_architecture.md`
nomeia BC-06 no esboco de arvore. A separacao e **1-para-1 com um tipo de
registro** e a justificativa esta la, com todas as palavras: separado *"por
regime, nao por tamanho... e dominio regulado (LGPD/GDPR) e dispara o caso de
borda do SKILL do Strategist: **Parallel Run permanente** e **nunca Big Bang**"*.
`D1` diz literalmente *"a solicitacao e um Post"* e ainda assim ela fica fora de
`BC-01`, porque o ciclo de vida da solicitacao *"nao tem intersecao com a maquina
de `post_status`"*.

> 🔴 **Antes de qualquer coisa: T001 encontrou TRES divergencias entre o pacote e
> a arvore analisada, e nao resolveu nenhuma.** As tres estao na secao *O que
> T001 encontrou aberto*, e cada uma cai numa historia diferente:
>
> | divergencia | quem bate de frente | tarefa que depende |
> |---|---|---|
> | nada move a solicitacao para o estado de falha quando o envio nao sai | CA-3.1, UC-25 | **T007** (US-3) |
> | um provedor que falha **interrompe** a execucao | CA-5.3, UC-27 | **T011** (US-5) |
> | o provedor informa **se** removeu, nao **quantos** | CA-6.2, UC-27, `UT-091-2` | **T013** (US-6) |
>
> Quem pegar T007, T011 ou T013 le a secao antes da primeira linha de codigo.
> **T001 nao depende de nenhuma das tres**, e e por isso que esta tarefa fechou.

---

## O que T001 entrega, e so isso

A linha da tarefa: *"o modulo carrega com as portas de dados, de relogio, de
envio de e-mail e de sistema de arquivos declaradas, e o registro de provedores
de dado pessoal vazio e inspecionavel"*. `satisfaz: — (infraestrutura)`: T001 nao
fecha nenhum criterio de aceite de nenhuma historia, e nao implementa regra de
negocio nenhuma.

| arquivo | o que e |
|---|---|
| `portas/porta-de-dados.ts` | a borda do banco, unica porta deste modulo para dados (REQ-164) |
| `portas/porta-de-relogio.ts` | a borda do instante, com a armadilha dos dois relogios declarada |
| `portas/porta-de-email.ts` | a borda do envio, com a falha como valor (`D3`, AD-06) |
| `portas/porta-de-sistema-de-arquivos.ts` | a borda do disco: o diretorio de exportacoes, a idade do arquivo e o apagamento |
| `registro/provedor-de-dado-pessoal.ts` | a forma de um exportador e de um apagador: os dois pontos de extensao |
| `registro/registro-de-provedores.ts` | o registro, vazio, com a ordem de insercao preservada |
| `index.ts` | a composicao: `criarModuloDePrivacidade(portas, provedores?)` |
| `modulo.test.ts` | os 14 testes da entrega, e nada de historia |

**O que a composicao NAO faz, e os testes afirmam:** nao guarda estado de modulo
(`EXT-CONTEXTO`, BR-MIGRAR-105 — duas composicoes nao compartilham porta nem
registro) e nao resolve nada no carregamento (`EXT-ORDEM`, BR-MIGRAR-106 — criar
o modulo nao le relogio, nao consulta dado, nao envia e-mail e nao toca disco).

**Nenhuma dependencia nova entrou em `package.json`**, e isso e consequencia da
regra de dependencia 4 de `target_architecture.md`: *"`contextos/` ou
`plataforma/` para adaptador concreto: proibido. So pela porta"*. Os slots
escolhidos para este no — driver MySQL em protocolo nativo, sistema de arquivos
do runtime com SSH2 e FTP, biblioteca de envio com transporte selecionavel — sao
implementacao de `adaptadores/`, e T001 nao escreve adaptador.

---

## Por que estas quatro portas, e nao outras

**Dados, sistema de arquivos e e-mail** sao tres das cinco bordas de AD-08, e as
tres estao na secao *Stack* do `plan.md` desta feature. O e-mail e a borda que o
`plan.md` marca como *"o slot com o achado mais incomodo do documento"*: o
transporte de fabrica do legado e a funcao `mail()` do PHP, que **nao existe
neste runtime** — e o unico caso em que "identico" e impossivel por ausencia de
primitiva, nao por decisao. O sistema de arquivos e a borda que guarda **dado
pessoal em disco** por tres dias, num diretorio que o servidor web serve.

**O relogio e a quarta, e a conta de AD-08 diz cinco bordas sem incluir
relogio.** A diferenca esta declarada no cabecalho de
`portas/porta-de-relogio.ts` e e a mesma nota que BC-03 e BC-05 carregam: o que
AD-08 recusa e dar porta ao barramento de hooks, a traducao e ao escape, por
custo de indirecao em escala de 13.335 e 3.416 pontos de entrada; o relogio nao
substitui sistema externo, e so o costurar torna o P6 conferivel — e esta feature
**e** prazo.

**Nao ha porta de HTTP nem de cache de objeto**, que sao as outras duas das cinco.
Nenhuma historia desta feature fala com a rede, e a borda 5 de
`target_architecture.md` poe o cache de objeto **desligado nas duas metades**
durante a coexistencia.

**Nao ha porta de fila agendada, e duas historias dependem de agendamento.** As
duas rotinas desta feature (US-4, a expiracao diaria; US-7, a varredura horaria)
sao eventos agendados, e `plan.md` declara na secao *Sequencia* que esta feature
*"depende de 001 e de 011"*, com o risco 2 registrando que *"a fila tem conflito
aberto na feature 011"*. T001 declara as quatro portas que a tarefa pede e
**nenhuma a mais**: a fila entra na tarefa que precisar dela (T009 e T015), como
BC-05 fez com o prefixo base em T002. O que ja esta anotado para elas: no legado
os dois agendamentos sao registrados em `init`
(`wp-includes/default-filters.php:459` e `:461`), e nao no painel — e e **so** por
isso que CA-4.4 e CA-7.3 valem.

**Nao ha porta de resumo criptografico, e a chave e guardada com resumo.** No
legado isso e `wp_fast_hash()` / `wp_verify_fast_hash()`, que sao funcoes
substituiveis do nucleo (`wp-includes/user.php:5067` e `:5115`). BC-05 ja topou na
mesma pergunta em T007 e resolveu do mesmo jeito que esta tarefa propoe: a funcao
de resumo **chega por argumento** na operacao, nao como porta, porque nenhum
documento do pacote nomeia o algoritmo e o `plan.md` desta feature nao tem slot
de hash. Ver `contextos/identidade-e-acesso/redefinicao-de-senha/chave-de-redefinicao.ts`,
que registra a mesma decisao com todas as palavras. **Isto e de T002/T005**, e
nao de T001.

---

## O registro de provedores: o que ele e, e a armadilha da ordem

`plan.md` o descreve como *"registro em memoria, povoado por ponto de extensao:
cada modulo e cada extensao declara o que sabe exportar e apagar"*, e conclui que
*"e ponto de extensao e portanto e produto (P2 da constituicao)"*. Os nomes sao
`wp_privacy_personal_data_exporters` e `wp_privacy_personal_data_erasers`.

**Nasce vazio, e vazio e o legado.** Nas quatro leituras do registro o valor
inicial do filtro e um array vazio (`wp-admin/includes/ajax-actions.php:5047` e
`:5238`, `wp-admin/includes/privacy-tools.php:822` e `:955`). Os quatro
provedores do nucleo entram por interceptador
(`wp-includes/default-filters.php:455` a `:458`), e **os quatro sao dado de outros
contextos**: conta (BC-05), comentario (BC-03) e midia (BC-04). A regra de
dependencia 3 proibe `import` entre contextos *"sempre, sem excecao"*, logo eles
chegam por **ligacao tardia**, pelo segundo argumento de
`criarModuloDePrivacidade` — o mesmo padrao de `ClassificacaoNaPublicacao` em
BC-01.

⚠️ **A ordem do registro e observavel, e no legado ela NAO e a ordem das linhas
que registram.** O chamador acha o provedor da vez por posicao
(`array_keys( $exporters )[ $exporter_index - 1 ]`, `ajax-actions.php:5067` e
`:5068`), e a ordem das chamadas decide a ordem em que os grupos entram no
relatorio. As tres linhas de `default-filters.php` leem comentario (`:455`),
midia (`:456`) e conta (`:457`) — mas a de conta e registrada com **prioridade
1**, e as outras duas com a padrao. A ordem efetiva e, portanto:

1. `wordpress-user`
2. `wordpress-comments`
3. `wordpress-media`

Quem povoar o registro na ordem das linhas produz um relatorio com os grupos em
outra ordem. `exportadores()` devolve na **ordem de insercao**; reproduzir a
prioridade e de quem disparar o ponto de extensao.

⚠️ **O laco de paginas e do lado do cliente no legado.** `doNextExport(
exporterIndex, pageIndex )` (`wp-admin/js/privacy-tools.js:118`) chama o servidor
uma vez por pagina e decide sozinho se avanca de pagina (`:142`) ou passa ao
provedor seguinte (`:146`); `exportersCount` vem de um atributo da tela (`:67`).
O servidor e **sem memoria entre paginas** e acumula o parcial em metadado da
solicitacao (`_export_data_raw`, `privacy-tools.php:807` e `:818`, apagado no fim
em `:861`). CA-5.6 — *"uma execucao interrompida pode ser retomada do ponto em que
parou"* — e consequencia desse acumulo, nao de estado em memoria. Quem pegar T011
decide onde o laco mora **depois** de ler isso.

---

## Os tres numeros desta feature, e de quem e cada um

O **P6** exige que cada numero *"viva num ponto de configuracao nomeado, com o
valor de fabrica do legado"*, e que exista teste de borda. T001 **nao declara
numero nenhum**, porque a linha da tarefa nao pede e porque em T001 nao ha o que
aceitar nem recusar. As ancoras ja estao lidas, e estao aqui para que a tarefa de
cada numero nao as redescubra:

| numero | valor de fabrica | ponto de extensao que o altera | tarefa |
|---|---|---|---|
| prazo da chave de confirmacao | `DAY_IN_SECONDS` (24 h) | `user_request_key_expiration`, `wp-includes/user.php:5112` | T005 |
| validade do arquivo de exportacao | `3 * DAY_IN_SECONDS` | `wp_privacy_export_expiration`, `wp-includes/functions.php:8623` | T015 |
| periodicidade das varreduras | `hourly` (arquivo) e `daily` (expiracao) | nenhum: fixo em `wp_schedule_event`, `functions.php:8557` e `:8574` | T015, T009 |

E o numero que esta feature **nao** tem, que o P6 cobra com a mesma forca: **a
solicitacao concluida nao tem prazo de retencao.** UC-27 e explicito — *"o arquivo
expira; o registro nao"* — e a resposta 20 de `questions.md` fecha: o nucleo nao
declara prazo nenhum. `REQ-094`, que pediria o contrario, esta `bloqueado` e na
lista de perguntas em aberto. Inventar o prazo cai na tabela *Nao negociavel* da
constituicao.

⚠️ **O prazo de 24 horas e medido de duas maneiras diferentes no legado.** A
conferencia da chave usa o relogio do processo contra a coluna **GMT**
(`post_modified_gmt`, via `modified_timestamp`,
`wp-includes/class-wp-user-request.php:116`); a expiracao agendada usa uma
consulta de data sobre a coluna **local** `post_modified`, com `'before' =>
'N seconds ago'` resolvido **no fuso do site** — e o comentario do proprio legado
explica que a coluna local e obrigatoria ali, porque comparar contra a GMT
*"deslocaria a janela de expiracao pelo deslocamento UTC do site"*
(`wp-admin/includes/privacy-tools.php:207` a `:214`). As duas medidas coincidem so
em instalacao com deslocamento zero. **Isto e de T009**, e esta declarado no
cabecalho de `portas/porta-de-relogio.ts` para que ninguem o resolva por acidente.

---

## Os quatro estados, e quem escreve cada um (mapa para T002)

`D1` / BR-MIGRAR-038: a solicitacao e `post_type = 'user_request'`
(`wp-includes/post.php:284`) com quatro estados dedicados, registrados em
`:767`, `:782`, `:797` e `:812`. O que T001 leu da arvore, e que T002 porta:

| estado | quem o escreve no legado | o que mais muda no mesmo comando |
|---|---|---|
| `request-pending` | `wp_create_user_request` (`user.php:4847`, como `'request-' . $status`) e **de novo** `wp_generate_user_request_key` (`user.php:5066`) | a chave com resumo, em `post_password` |
| `request-confirmed` | `_wp_privacy_account_request_confirmed` (`user.php:4260`), so a partir de `request-pending` ou `request-failed` (`:4252`) | o metadado `_wp_user_request_confirmed_timestamp` (`:4256`), gravado **antes** |
| `request-completed` | `_wp_privacy_completed_request` (`privacy-tools.php:60`) | o metadado `_wp_user_request_completed_timestamp` (`:55`) |
| `request-failed` | **um lugar so na arvore inteira**: `_wp_personal_data_cleanup_requests` (`privacy-tools.php:226`) | a chave, esvaziada no mesmo `UPDATE` (`:227`) |

Tres coisas desse mapa que um porte perde:

1. **A chave e gerada no envio, nao na abertura.** `wp_send_user_request` chama
   `wp_generate_user_request_key` antes de montar a mensagem
   (`user.php:4921`), e o comentario do legado diz por que: a chave e usada pelo
   objeto **e** pela URL de confirmacao. Gerar na abertura mudaria quantas chaves
   existem por solicitacao.
2. **Confirmar apaga a chave, mas nao e o comando de confirmacao que a apaga.**
   `_wp_privacy_account_request_confirmed` grava so `post_status`; CA-2.5 exige
   que confirmar *"apaga a chave"*. Quem fecha US-2 (T005) tem de olhar o
   caminho de `wp-login.php:1240` inteiro antes de decidir onde o esvaziamento
   mora, porque **a arvore nao apaga a chave na confirmacao** — e esta e a
   quarta divergencia candidata desta feature, registrada abaixo.
3. **O estado de falha acumula dois significados.** UC-26 e literal: *"o e-mail
   nao saiu"* e *"o titular nao confirmou em 24 horas"* sao o mesmo estado, e
   *"nada no registro os distingue"*.

---

## 🔴 O que T001 encontrou aberto, e NAO resolveu

### 1. Nada move a solicitacao para o estado de falha por falha de envio (CA-3.1)

**Uma busca por `request-failed` em `wp-admin/` e `wp-includes/` devolve uma
escrita:** `wp-admin/includes/privacy-tools.php:226`, dentro de
`_wp_personal_data_cleanup_requests()` — a rotina das **24 horas**, que e US-4. No
caminho de abertura o retorno de `wp_send_user_request()` e **ignorado**
(`privacy-tools.php:169`) e a tela informa *"Confirmation request initiated
successfully."* de qualquer maneira; no caminho de reenvio o erro vira mensagem na
tela (`:81`) e a solicitacao **continua pendente**.

- **O pacote diz o contrario**, em dois lugares: CA-3.1 — *"falha no envio move a
  solicitacao para um estado proprio de falha, e nao a deixa pendente nem a
  apaga"* — e a tabela de excecoes de UC-25: *"a solicitacao vai para o estado de
  falha"*.
- **O P1 nao deixa escolher no meio da implementacao:** *"reproduza o
  comportamento observavel do sistema analisado, inclusive quando ele parecer
  defeito. Divergir exige uma decisao humana registrada, citada no codigo que
  divergiu"*, e as tres divergencias autorizadas sao outras. **E o P7 reforca**:
  o silencio do caminho de abertura e comportamento, nao defeito de leitura.
- O que T001 fez: a porta de e-mail devolve a falha **como valor**, que e o que
  `D3`, BR-MIGRAR-040 e AD-06 exigem, e nao decidiu quem grava o que a partir
  dela. **T007 depende da resposta.**

### 2. Um provedor que falha interrompe a execucao (CA-5.3)

Um exportador que devolve erro faz o chamador responder `wp_send_json_error`
(`ajax-actions.php:5104`) e o laco do navegador **para**: `if ( ! response.success
) { ... onExportFailure( response.data ); return; }`
(`wp-admin/js/privacy-tools.js:135` a `:138`). CA-5.3 e a tabela de excecoes de
UC-27 dizem o oposto — *"a falha e reportada na tela e o processo continua com os
demais"* — e `UT-090-3` transcreve a mesma frase.

O risco 4 do `plan.md` ate avisa do lado inverso (*"tratar falha de provedor como
erro da operacao muda o resultado"*), o que mostra que o pacote acredita na
continuacao. T001 nao resolve: declarou a falha do provedor como **valor** e
registrou onde o legado para. **T011 depende da resposta.**

### 3. O provedor informa SE removeu, nao QUANTOS (CA-6.2)

No legado `items_removed` e `items_retained` sao **booleanos**, declarados `@type
bool` — *"Whether items were actually removed or not"* (`ajax-actions.php:5385` e
`:5386`) —, o apagador do nucleo devolve `false`/`true`
(`wp-includes/comment.php:4314` a `:4398`) e o laco do navegador os acumula como
booleanos (`privacy-tools.js:246`). Tres documentos do pacote dizem *"quantos"*:
CA-6.2, o fluxo alternativo de UC-27 e `UT-091-2`.

T001 declarou a forma **booleana** do legado em
`registro/provedor-de-dado-pessoal.ts`, com a citacao ao lado, porque o P1 manda
seguir o observavel sem decisao humana em contrario. **T013 nao fecha CA-6.2 ao
pe da letra sem essa decisao**, e T014 transcreve `UT-091-2` do catalogo: os dois
batem no mesmo ponto.

### 4. Candidata a quarta divergencia: confirmar apaga a chave? (CA-2.5)

`_wp_privacy_account_request_confirmed` (`user.php:4245`) grava o metadado de
instante e o estado `request-confirmed`, e **nao toca em `post_password`**. CA-2.5
exige que *"confirmar apaga a chave"*, e a pos-condicao de UC-26 repete: *"a chave
de confirmacao nao existe mais"*. O unico lugar da arvore que esvazia a chave e a
rotina de expiracao (`privacy-tools.php:227`).

T001 **nao afirma** que a arvore nao apaga: o caminho de confirmacao comeca em
`wp-login.php:1240` e passa pela acao `user_request_action_confirmed`
(`default-filters.php:452` e `:453`), e so quem portar US-2 vai percorrer esse
caminho inteiro. Fica registrado como **primeira coisa a conferir em T005**, com a
ancora de onde comecar.

### 5. O catalogo de testes contradiz a regra que ele cita (US-4)

`UT-089-6` se chama *"expira na hora marcada sem depender de chegar requisicao ao
site"*, e a prova que ele cita e `A9` — *"a fila so avanca quando chega requisicao
HTTP"*. UC-28 e explicito na tabela de excecoes: *"nenhuma requisicao HTTP chega →
o evento nao roda"*. CA-4.4 fala de outra coisa, e esta correta: o agendamento
existe sem **visita a tela de privacidade**, porque e registrado em `init` e nao
no painel. Quem pegar **T010** (os testes de US-4) copia o caso do catalogo como
o catalogo o escreve — e nao reconstroi — e registra o choque, em vez de escolher
um lado.

### 6. Qual tarefa povoa o registro de provedores nao esta no pacote

`tasks.md` nao tem tarefa de povoamento. T011 e T013 percorrem o registro; os
quatro provedores do nucleo sao dado de BC-03, BC-04 e BC-05, e so podem entrar
por ligacao tardia. Fica declarado: nenhuma tarefa deste pacote registra o
exportador de conta, o de comentario, o de midia nem o apagador de comentario, e
sem eles a exportacao de uma instalacao nova devolve um relatorio com o grupo
*About* e nada mais.

### 7. As tres perguntas que a propria `spec.md` deixou abertas

Estao na secao *Perguntas em aberto* da spec e tambem em `index.md` na raiz.
Nenhuma foi tocada por T001, e nenhuma e decidivel por um agente:

1. **`REQ-092` (proteger o arquivo por verificacao de identidade) ficou
   `bloqueado`.** No legado a protecao e a imprevisibilidade do nome — 32
   caracteres aleatorios (`privacy-tools.php:353`) — por tres dias, e nada mais.
   A spec manda que *"isso precise estar explicito para quem opera"*. Por isso a
   porta de sistema de arquivos **nao gera nome de arquivo**: o nome chega
   decidido, para que a protecao fique visivel em T011 em vez de escondida numa
   borda.
2. **`REQ-094` (retencao do registro de solicitacao concluida) ficou
   `bloqueado`**, e a resposta 20 ja decidiu que o nucleo nao declara prazo
   nenhum. O card volta a selecao com a decisao registrada, ou fica fora? Nao e
   deste pacote.
3. **O campo compartilhado entre a chave com resumo e a senha de conteudo em
   texto claro (`D6`).** No legado as duas moram em `post_password`, com
   significados diferentes por tipo de registro. Separar e mais claro e **muda o
   que um programa de terceiro le**. T001 nao toca no assunto: a forma das linhas
   e de **T002**, e quem a escrever le esta pergunta antes.

---

## O que este modulo nao vai ter, por decisao de outra pessoa

- **Verificacao de identidade para baixar o arquivo de exportacao.** `REQ-092`
  esta `bloqueado` e fora do pacote. A protecao e a do legado.
- **Prazo de retencao para a solicitacao concluida, e nenhum outro numero que o
  legado nao tem.** A resposta 20 e o P6; `REQ-094` esta `bloqueado`.
- **Barramento de hooks.** `REQ-162` (*"declarar os pontos de extensao com
  contrato explicito"*) esta `bloqueado` e listado em `do-not-rewrite.md`. O que
  esta tarefa pode fazer, e fez, e **declarar** os dois pontos de extensao desta
  feature — nome, argumentos e ordem — no arquivo que os emitiria.
- **Minimizacao, anonimizacao ou qualquer mudanca no que vai para servico
  externo.** A maior exportacao de dado pessoal deste sistema nao sai desta
  feature: sai do formulario anonimo de comentario, esta em
  `discard_log.md` e em PT-017, e a resposta 13 ja decidiu o que fazer se ela for
  portada. Nao e aqui.

---

## Como se confere que este modulo tem paridade

A spec de paridade desta feature e **`PT-012`**, em
`.specify/migration/parity_tests/12-solicitacao-de-dado-pessoal.feature`: 13
cenarios sobre `D1`–`D6`, `R7` e `R8`, **todos marcados `@critico`** e quase todos
`@regulatorio`, com UC-02, UC-25, UC-26, UC-27 e UC-28 como casos de uso. Dois
fatos do cabecalho daquele arquivo valem para toda tarefa desta feature:

- A fatia 8 e **a unica com Parallel Run permanente**: *"nao ha janela que o
  encerre"*, e *"o oraculo continua no ar depois do corte final, sem servir
  trafego"*.
- **Big Bang e proibida** nesta fatia, por ser dominio regulado.

O que T001 ja torna conferivel por ali:

- O Contexto do arquivo pede *"um oraculo com relogio controlavel"* e *"o envio de
  e-mail falhando na porta de e-mail"*. As duas portas existem e `modulo.test.ts`
  monta o duplo das quatro, afirmando que trocar uma e passar outra implementacao
  na composicao — o criterio de "substituivel" de BR-MIGRAR-103.
- O cenario `@concorrencia` — *"nenhum arquivo de exportacao contem dado do outro
  titular"* — tem a sua primeira metade afirmada: duas composicoes nao
  compartilham porta nem registro.
- O cenario `@invariante` da falha de envio exige que *"nenhuma das duas lance
  excecao que interrompa o fluxo"*. As quatro bordas e o proprio provedor
  devolvem falha **como valor**, e os ultimos quatro testes do modulo afirmam
  isso.
- O cenario `@invariante` de `D1` cobra que *"nenhuma das duas cria tabela propria
  para a solicitacao"*. A unica porta de dados deste modulo tem o prefixo por
  site e nenhuma nocao de tabela nova; a forma das linhas e de T002.

⚠️ `parity_specs.md` registra que a suite de *characterization tests* **nao
existe** nesta arvore e que o corpus do Parallel Run **nao existe** — *"sem ele
nenhuma metrica percentual tem denominador"*. A resposta 16 de `questions.md`
autoriza o ambiente-oraculo, que e T001 da feature `015` e ainda nao existe.
Enquanto isso, o que se confere aqui e a forma e a ausencia de efeito, nao a
comparacao caso a caso.
