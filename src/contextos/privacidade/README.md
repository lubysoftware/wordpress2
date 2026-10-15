# Modulo de privacidade — BC-06

Feature `008-privacidade-e-dados-pessoais`. Tarefas fechadas com nota de entrega
neste arquivo: **T001** (esqueleto, as quatro portas e o registro de provedores
vazio), **T002** (a solicitacao como registro de conteudo, os quatro estados e a
forma da chave com resumo), **T003** (US-1: abrir a solicitacao identificada
pelo endereco de e-mail) e **T017** (US-8: o poder do nivel mais alto sobre dado
pessoal de terceiro). Este arquivo e a leitura obrigatoria de quem pegar a
tarefa seguinte: ele diz o que ja esta decidido, o que esta decidido **em outro
lugar**, e o que **ninguem** decidiu.

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

> 🔴 **T002 confirmou a quarta, que T001 deixou como candidata, e achou uma
> quinta.** As duas estao na secao *O que T002 encontrou*, e nenhuma e decidivel
> por um agente:
>
> | divergencia | quem bate de frente | tarefa que depende |
> |---|---|---|
> | **confirmar NAO apaga a chave** — a arvore inteira foi lida e nenhum dos dois ouvintes toca `post_password`, que volta pelo `array_merge` de `wp_update_post` | CA-2.5, UC-26 (pos-condicao) | **T005** (US-2) |
> | a primitiva de resumo da chave (**BLAKE2b com chave, saida de 30 bytes**, da libsodium) nao existe na biblioteca padrao do runtime, e o `plan.md` desta feature **nao tem slot** para ela | `plan.md` § *Stack* | **T005** (US-2) |
>
> **T002 nao depende de nenhuma das duas**: ela declara a forma do que e gravado
> e a interface de quem resume, e nao resume nada. E e por isso que esta tarefa
> fechou.

> 🔴 **T003 achou a sexta e a setima, e corrigiu uma afirmacao de T002.** As duas
> estao na secao *O que T003 encontrou*, e nenhuma e decidivel por um agente:
>
> | divergencia | quem bate de frente | tarefa que depende |
> |---|---|---|
> | a capacidade conferida e a da **tela aberta**, e nao a da **acao pedida**: o campo `type_of_action` chega do formulario e nao e reconferido, logo a tela de exportacao cria pedido de **apagamento** sem `erase_others_personal_data` nem `delete_users` | CA-1.1 | **nenhuma** — T003 reproduziu o legado e registrou |
> | a tela abre a solicitacao **ja confirmada** quando a caixa *"Confirmation email"* vem desmarcada: sem chave, sem e-mail e sem o titular autorizar — e dali ela e executavel | `D2` / BR-MIGRAR-039, `UT-086-7`, CA-5.1, CA-6.1 | **T005**, **T011** e **T013** leem antes de comecar |
>
> **T003 nao dependeu de nenhuma das duas para fechar**: os cinco criterios de
> US-1 sao afirmaveis com o legado reproduzido como esta, e e por isso que esta
> tarefa fechou.

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
implementacao de `adaptadores/`, e T001 nao escreve adaptador. **T002 tambem nao
acrescentou dependencia**, e pelo mesmo motivo.

---

## O que T002 entrega, e so isso

A linha da tarefa: *"a solicitacao existe como tipo de conteudo proprio, com os
quatro estados do legado e a chave de confirmacao guardada com resumo
criptografico, lida e gravada pela porta de dados"*.
`satisfaz: — (infraestrutura)`: T002 nao fecha nenhum criterio de aceite de
nenhuma historia, e **nao implementa regra de negocio nenhuma**.

| arquivo | o que e |
|---|---|
| `armazenamento/chaves-e-tabelas.ts` | `{site}posts`, `{site}postmeta`, o tipo `user_request` e as duas chaves de metadado que a solicitacao carrega |
| `armazenamento/estados-da-solicitacao.ts` | os quatro estados com as propriedades **efetivas** do registro, os dois que aceitam validacao de chave, e a tabela de transicoes com a tarefa de cada uma |
| `armazenamento/solicitacao.ts` | a linha como `WP_User_Request` a monta: as seis colunas reaproveitadas, os dois instantes de metadado e a leitura |
| `armazenamento/chave-de-confirmacao.ts` | a forma do que e gravado em `post_password`, o comprimento e o alfabeto da chave em claro, e as duas interfaces de borda |
| `armazenamento/metadado.ts` | as tres primitivas de `{site}postmeta` que o caminho da privacidade chama, com os efeitos no banco de cada uma |
| `armazenamento/leitura-de-linha.ts` | leitura de coluna, mais a conversao de coluna `datetime` em segundos UTC de que o prazo de T005 vai depender |
| `armazenamento/porta-falsa.ts` | o duplo que **registra comando**, porque o criterio desta area e *"snapshot + sequencia de comandos"* |
| `armazenamento/index.ts` | a composicao: `criarArmazenamentoDePrivacidade(dados)` |
| `armazenamento/armazenamento.test.ts` | os 35 testes da entrega, e nada de historia |

**O que o armazenamento NAO faz, e os testes afirmam:** nao guarda estado de
modulo, nao emite comando nenhum ao ser composto, nao valida estado nem acao
(`DB-DEG`) e **nao escreve a linha de `posts`** — ver a secao seguinte, que e a
decisao mais consequente desta tarefa.

### A gravacao da linha de `posts` nao esta aqui, e por que

🔴 **Leitura obrigatoria de quem pegar T003, T005, T007, T009, T011 ou T013.**

O caminho da privacidade do legado **nao emite comando proprio sobre `posts`**:
zero `$wpdb` em `wp-admin/includes/privacy-tools.php` e zero na regiao de
privacidade de `wp-includes/user.php`. As cinco escritas passam por
`wp_insert_post()` / `wp_update_post()`, que sao o caminho de BC-01:

| o que | cadeia do legado | ancora | tarefa |
|---|---|---|---|
| abrir | `wp_insert_post` com 8 chaves | `user.php:4841` a `:4853` | T003 |
| gerar a chave no envio | `wp_update_post` com `post_status` e `post_password` | `user.php:5063` a `:5069` | T005, T007 |
| confirmar | `wp_update_post` com `post_status` | `user.php:4257` a `:4262` | T005 |
| concluir | `wp_update_post` com `post_status` | `privacy-tools.php:57` a `:62` | T011, T013 |
| expirar | `wp_update_post` com `post_status` e `post_password` | `privacy-tools.php:223` a `:229` | T009 |

Um `UPDATE` nascido em BC-06 **nao seria o comando do legado**, por tres razoes
medidas:

1. **O comando do legado tem 21 colunas, nao duas.** `wp_update_post()` le a
   linha e faz `array_merge( $post, $postarr )` (`post.php:5335` e `:5367`);
   `wp_insert_post()` monta `$data` com `compact()` das 21 (`:4912` a `:4933`) e
   chama `$wpdb->update( $wpdb->posts, $data, $where )` (`:4995`).
2. ⚠️ **O comando do legado reescreve `post_modified`, e esta feature depende
   disso.** `if ( $update || '0000-00-00 00:00:00' === $post_date ) {
   $post_modified = current_time( 'mysql' ); ... }` (`post.php:4789` a `:4791`).
   E dai que sai o relogio do prazo de 24 horas, porque a chave de confirmacao —
   diferente da chave de redefinicao de senha de BC-05 — **nao guarda o instante
   na propria coluna**: `modified_timestamp` e o que `wp_validate_user_request_key`
   soma a 24 h (`user.php:5091` e `:5113`). Um `UPDATE` de duas colunas deixaria
   o prazo correndo do envio anterior, e **o reenvio de CA-3.3 nasceria com menos
   de 24 horas de vida, em silencio**.
3. **O comando do legado dispara cinco pontos de extensao publicos**:
   `wp_insert_post_data` (`:4978`), `pre_post_update` (`:4993`), `post_updated`,
   `save_post` e `wp_after_insert_post`. O P2 poe cada um no contrato publico.

Logo a ligacao com BC-01 e **tardia** (AD-10; a regra de dependencia 3 proibe o
`import`), e **quem a declara e a tarefa que grava** — o mesmo que BC-04 fez em
`contextos/midia/armazenamento/anexo.ts`, deixando a dele para T003. O que T002
grava, e grava aqui pela porta de dados, sao as duas linhas de `postmeta`, que o
caminho da privacidade escreve por conta propria com `update_post_meta()`
(`user.php:4256` e `privacy-tools.php:55`).

> ✅ **T003 declarou essa ligacao, e e a entrega dela.** `ConteudoNaPrivacidade`
> em `abertura/contexto-de-abertura.ts` e a chamada a `wp_insert_post( $postarr,
> true )` com as **oito** chaves de `wp-includes/user.php:4842`-`:4851`, e o
> `ResultadoDaInsercaoDaSolicitacao` e o `int|WP_Error` que ela devolve. As
> outras quatro escritas da maquina de estado continuam sem ligacao declarada: a
> chave no envio (T005, T007), a confirmacao (T005), a conclusao (T011, T013) e
> a expiracao (T009).

---

## O que T003 entrega, e so isso

A linha da tarefa: *"o comportamento de US-1 existe e os criterios CA-1.1,
CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo"*. E a **primeira
regra de negocio** deste modulo, e o caso de uso e
[UC-25](../../../.specify/use-cases/UC-25-abrir-solicitacao-de-dados-pessoais.md).

| arquivo | o que e |
|---|---|
| `abertura/contexto-de-abertura.ts` | os colaboradores de ligacao tardia: as duas leituras de conta (BC-05), a insercao (BC-01), os dois `WP_Query` (feature 004), os dois instantes no formato do banco e as quatro sanitizacoes de `plataforma/formatacao/` |
| `abertura/permissao-de-abertura.ts` | **CA-1.1**: as capacidades de cada tela, o `wp_die()` de cada uma com titulo, codigo e **500**, e a divergencia 🔴 entre *"a acao pedida"* e o que o legado confere |
| `abertura/abrir-solicitacao.ts` | **CA-1.2**, **CA-1.3** e **CA-1.5**: `wp_create_user_request()` com os sete passos na ordem, os quatro erros como valor e a duplicidade por `found_posts` |
| `abertura/tela-de-abertura.ts` | **CA-1.1 aplicada**: o portao, o tratador da tela, os avisos acumulados **na ordem** e o ponto em que T005 encaixa o envio |
| `abertura/lista-de-solicitacoes.ts` | **CA-1.4**: `prepare_items()`, a paginacao de fabrica com a borda, e o dado da coluna de estado |
| `abertura/index.ts` | o barril da area |
| `abertura/us-1-abrir-solicitacao.test.ts` | os 28 testes dos cinco criterios, e nada de catalogo — `UT-086-1` a `UT-086-7` sao **T004** |

Tres coisas que esta tarefa **nao** faz, e as duas primeiras sao afirmadas pelos
testes:

1. **Nao gera chave e nao envia e-mail.** A chave nasce no **envio**
   (`wp_send_user_request`, `user.php:4901`), que a tela chama numa linha
   separada (`privacy-tools.php:169`) e que e **T005**. A solicitacao nasce com
   `post_password` vazio porque a abertura nao menciona a coluna.
2. **Nao toca o registro de provedores.** Nada e exportado nem apagado na
   abertura (CA-1.5), e a abertura nem recebe o registro no contexto.
3. **Nao emite comando pela porta de dados deste modulo.** A duplicidade e a
   insercao atravessam a ligacao tardia; a **unica** parte de T003 que emite
   comando e a lista, que le uma linha por solicitacao como o legado
   (`class-wp-privacy-requests-table.php:401`).

**Nenhuma dependencia nova em `package.json`**, pelo mesmo motivo de T001 e T002.

---

## O que T017 entrega, e so isso

A linha da tarefa: *"tratar exportar e apagar dado de terceiro como poder do
nivel mais alto da instalacao"* (US-8, `REQ-095`). `satisfaz: CA-8.1, CA-8.2,
CA-8.3, CA-8.4`. Fechou em paralelo com US-1, e sem depender dela, porque
`depende de: T001, T002` e de mais nada — US-8 nao depende da abertura (T003)
nem da confirmacao (T005).

| arquivo | o que e |
|---|---|
| `poder-sobre-dado-de-terceiro/caso-de-poder-de-privacidade.ts` | o `case` de **tres rotulos** de `wp-includes/capabilities.php:795`-`:799`, e a pergunta sobre a matriz que `CA-8.3` faz |
| `poder-sobre-dado-de-terceiro/permissao-nas-telas-de-dado-pessoal.ts` | os quatro portoes que consomem esses nomes, com o `msgid` de cada recusa |
| `poder-sobre-dado-de-terceiro/index.ts` | o barril, e a declaracao de por que `CA-8.4` nao tem codigo aqui |
| `poder-sobre-dado-de-terceiro/us-8-poder-sobre-dado-de-terceiro.test.ts` | os 19 testes da historia, um bloco por criterio |

**Tres fatos desta entrega que a proxima onda precisa saber:**

1. **A regra de rede nao foi reimplementada.** `capacidadesDePrivacidade( emRede )`
   — a unica copia do `is_multisite() ? 'manage_network' : 'manage_options'` —
   ja estava em `plataforma/autorizacao/traducao-de-conteudo.ts`, posta la por
   T017 da feature `001` porque o ramo da pagina de politica precisava dela.
   Aquele arquivo **nomeou esta tarefa por escrito** (*"quem portar a feature 008
   acrescenta os dois nomes de dados pessoais ... em lugar de reimplementar a
   regra"*), e e o que T017 fez: acrescentou os dois rotulos que faltavam.
2. **`CA-8.4` nao tem codigo nesta arvore, e isso e o certo.** A soma da pagina
   de politica (`capabilities.php:180` ao apagar, `:283` ao editar) e o *ramo 7*
   de `casoDeConteudo()`, ja portado em `plataforma/autorizacao`. T017 o
   **afirma** — seis testes, inclusive o de rede e o de editar — em vez de
   produzir uma segunda copia que so poderia divergir da primeira.
3. **Nenhuma operacao entrou em `ModuloDePrivacidade`, e a superficie nao mudou.**
   US-8 nao e um verbo: e a resolucao de capacidade de que os sete verbos da
   tabela de `index.ts` dependem. O teste de superficie do modulo continua com
   o que T001, T002 e T003 entregaram — `armazenamento`, `nome`, `portas`,
   `provedores` e as tres operacoes de US-1.

⚠️ **Quem compuser qualquer operacao desta feature tem de declarar
`casoDePoderDePrivacidade` nos casos de traducao, ou usar os portoes desta
pasta, que o acrescentam sozinhos.** Sem o caso, o `default:` da traducao
devolve o proprio nome pedido, nenhum papel o concede e **nem o administrador
exporta dado pessoal** — um sistema mais fechado do que o legado, que e
exatamente o defeito que `BR-MIGRAR-092` descreve.

**A abertura de T003 ja esta nessa situacao.** `abertura/permissao-de-abertura.ts`
pergunta pelos nomes das telas por `perguntarPermissao()`, com os
`casosDeTraducao` da base que **quem compoe a requisicao** monta, e nao
acrescenta o caso sozinha. A consequencia que aquele arquivo declara — em rede,
sem o caso montado, a pergunta nao resolve para `manage_network` e um
administrador de site com a capacidade concedida por filtro passaria onde o
legado nega — deixou de ser ausencia de T017: o caso existe, e monta-lo e de
quem compoe a requisicao.

**T017 nao encontrou divergencia nova**, e nao depende de nenhuma das sete ja
registradas: as de T001 e T002 e a segunda de T003 sao sobre estado, chave e
provedor; a primeira de T003 e sobre **qual** nome a tela pergunta, e esta
tarefa so resolve **como** o nome perguntado vira capacidade. Nenhuma
dependencia entrou em `package.json`.

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
legado isso e `wp_fast_hash()` / `wp_verify_fast_hash()`. BC-05 ja topou na mesma
pergunta em T007 e resolveu do mesmo jeito que esta tarefa propoe: a funcao de
resumo **chega por argumento** na operacao, nao como porta. Ver
`contextos/identidade-e-acesso/redefinicao-de-senha/chave-de-redefinicao.ts`, que
registra a mesma decisao com todas as palavras. **T002 declarou as duas
interfaces** (`armazenamento/chave-de-confirmacao.ts`); aplica-las e de T005.

⚠️ **Duas correcoes de T002 a este paragrafo, as duas conferidas na arvore.**
A decisao continua valendo; o que estava errado era o motivo e a ancora.

1. **As duas funcoes NAO sao substituiveis.** As ancoras que T001 deu —
   `wp-includes/user.php:5067` e `:5115` — sao os **pontos de chamada**. As
   definicoes estao em `wp-includes/functions.php:9363` e `:9386`, em
   `functions.php` e nao em `pluggable.php`, **sem guarda `function_exists`**:
   logo nao estao entre os 38 substituiveis. O que e substituivel e o objeto de
   hash de **senha**, que e outra coisa — o docblock de `wp_fast_hash` e literal,
   *"This function must not be used for hashing user-generated passwords. Use
   `wp_hash_password()` for that"*.
2. 🔴 **O algoritmo esta nomeado no legado, e a primitiva nao existe no
   runtime.** `wp_fast_hash` e
   `sodium_crypto_generichash( $message, 'wp_fast_hash_6.8+', 30 )` seguido de
   `sodium_bin2base64( ..., SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING )`, com o
   resultado prefixado por `$generic$` (`functions.php:9367` e `:9368`) — isto e,
   **BLAKE2b com chave e saida de 30 bytes**, da libsodium. `crypto.createHash`
   nao alcanca BLAKE2b com chave nem com comprimento de saida escolhido, e o
   `plan.md` desta feature **nao tem slot** para esta borda (o slot
   `hash-de-senha`, bcrypt mais HMAC, e o de `wp_hash_password()`). Escolher a
   biblioteca que traga a primitiva e *"escolher a tecnologia de qualquer slot do
   plano"*, que a tabela **Nao negociavel** poe fora do alcance de um agente.
   **Por isso a interface, e nao a implementacao.**

O que T002 **pode** declarar sem decidir nada, e declarou: o prefixo `$generic$`
e observavel na coluna e e o discriminante de um ramo de compatibilidade —
`wp_verify_fast_hash` trata o valor **sem** o prefixo como resumo *phpass*
antigo em vez de recusar (`functions.php:9391` a `:9395`). Esse ramo nao e
exercitavel nesta arvore (instalacao nova, respostas 1 a 5), e **isso nao o
remove**: P8 e P7 mandam clonar o que existe sem ser chamado.

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

> ✅ **T002 declarou o quarto numero da feature**, que nao e prazo e por isso nao
> estava nesta tabela: o **comprimento da chave em claro, 20 caracteres**, de
> `wp_generate_password( 20, false )` (`wp-includes/user.php:5060`), com o
> alfabeto de 62 simbolos de `pluggable.php:2965`. Vive em
> `armazenamento/chave-de-confirmacao.ts` como constante nomeada, com teste, como
> o P6 pede. **E filtravel**: o valor passa por `random_password`
> (`pluggable.php:2989`) antes de voltar. ⚠️ E vem com a metade negativa do P6
> junto: **nao ha limite de tentativa de chave**, e UC-26 e literal — *"nenhum
> contador de tentativa existe"*. Introduzir um cai na tabela *Nao negociavel*.

> ✅ **T003 declarou o quinto numero**, que tambem nao e prazo: os **20 itens por
> pagina** da lista de solicitacoes, de `get_items_per_page( $option,
> $default_value = 20 )` (`wp-admin/includes/class-wp-list-table.php:990`), com o
> mesmo valor na opcao de tela que as duas paginas registram
> (`wp-admin/export-personal-data.php:80`). Vive em
> `abertura/lista-de-solicitacoes.ts` como constante nomeada, com os **dois**
> pontos de configuracao — a opcao por conta `{acao}_requests_per_page` e o
> filtro dinamico com o nome dela (`:1020`) — e com o teste de borda que o P6
> pede: `empty()` ou `< 1` cai no default, `1` passa.

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

## Os quatro estados, e quem escreve cada um

> ✅ **Portado por T002**, em `armazenamento/estados-da-solicitacao.ts` (o
> vocabulario, as propriedades efetivas e a tabela de transicoes) e
> `armazenamento/solicitacao.ts` (a linha). O mapa abaixo e o que T001 leu; as
> correcoes de ancora que T002 fez estao na secao *O que T002 encontrou*.

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

> ✅ **T002 percorreu o caminho e confirma: a arvore nao apaga.** Ver
> *O que T002 encontrou*, item 1 — o conflito sobe de candidato a divergencia
> registrada, e continua **sem decisao humana**.

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

   > ✅ **T002 leu a pergunta e nao a decidiu: manteve o campo compartilhado**,
   > que e o observavel, e e o unico caminho que o P1 deixa. A declaracao esta no
   > cabecalho de `armazenamento/chave-de-confirmacao.ts`, junto da direcao
   > inversa — passar a guardar a senha de conteudo com resumo, que e
   > `BR-HUMANA-009` e esta **pendente**, com o custo registrado em
   > `target_data_model.md`: *"invalida toda senha de conteudo existente"*.

---

## 🔴 O que T002 encontrou, e NAO resolveu

### 1. Confirmar NAO apaga a chave (CA-2.5) — era a candidata de T001, e esta confirmada

T002 precisou ler o caminho de confirmacao inteiro para decidir onde a gravacao
mora (ver *A gravacao da linha de `posts` nao esta aqui*), e o resultado fecha a
pergunta do lado **factual**:

- `wp-login.php:1240` a `:1276` valida a chave e dispara
  `user_request_action_confirmed`;
- a acao tem **dois** ouvintes, e so dois:
  `_wp_privacy_account_request_confirmed` e
  `_wp_privacy_send_request_confirmation_notification`, com prioridade 12
  (`wp-includes/default-filters.php:453` e `:454`);
- **nenhum dos dois toca `post_password`** (`user.php:4245` a `:4263` e `:4275`
  em diante);
- e `wp_update_post` **carrega o valor existente de volta**, porque le a linha e
  faz `array_merge( $post, $postarr )` (`wp-includes/post.php:5335` e `:5367`).

Logo a chave **sobrevive a confirmacao**, e continua valida pelos 24 horas
contados de `post_modified` — que a propria confirmacao reescreveu. CA-2.5 e a
pos-condicao de UC-26 (*"a chave de confirmacao nao existe mais"*) exigem o
contrario. O que impede reconfirmar nao e a chave morrer: e
`request-confirmed` nao estar na lista de estados que aceitam validacao
(`user.php:5097`), que e CA-2.4 e **esta portado**.

**T002 nao escolhe lado**, e isto nao e de T005 resolver: o P1 e literal —
*"divergir exige uma decisao humana registrada, citada no codigo que divergiu"* —
e as tres divergencias autorizadas sao outras. Fica como conflito aberto.

### 2. A primitiva de resumo da chave nao existe no runtime, e o plano nao tem slot

Ver a correcao 2 na secao *Por que estas quatro portas, e nao outras*. Em uma
frase: `wp_fast_hash` e BLAKE2b **com chave** e **saida de 30 bytes**, da
libsodium; `crypto.createHash` nao alcanca nenhuma das duas coisas; e escolher a
biblioteca que alcance cai em *"escolher a tecnologia de qualquer slot do plano"*,
na tabela **Nao negociavel**. T002 declarou a interface e a forma do valor
gravado (o prefixo `$generic$`), e nao implementou resumo nenhum. **T005 depende
da resposta** — ou de uma decisao de slot.

### 3. `state-machines.md` da a MESMA ancora para duas transicoes diferentes

Reforco da divergencia 1 de T001, com uma evidencia que T001 nao tinha. A tabela
de transicoes da maquina 4 lista, em linhas consecutivas:

- *"`request-pending` → `request-failed` | falha ao enviar o e-mail"* → ancora
  `wp-admin/includes/privacy-tools.php:226`;
- *"`request-pending` → `request-failed` | **expiracao** — cron diario"* →
  ancora `wp-admin/includes/privacy-tools.php:195-231`.

A segunda **contem** a primeira: `:226` esta dentro de
`_wp_personal_data_cleanup_requests()`, que e a rotina das 24 horas. Isto e, a
transicao por falha de envio **nao tem ancora propria** em nenhum documento do
pacote, e a busca por `request-failed` na arvore devolve uma escrita so. **T007
depende da resposta**, e `armazenamento/estados-da-solicitacao.ts` registra o
choque no lugar onde alguem o procuraria.

### 4. O ramo de "valor identico" do metadado nunca dispara para os dois instantes

Nao e conflito de documento: e um comportamento do legado que um porte
bem-intencionado apaga. `update_metadata()` desiste de escrever quando a chave
existe uma vez e o valor e **identico pelo `===` do PHP**
(`wp-includes/meta.php:255` a `:263`). Para os dois instantes desta feature a
comparacao e **sempre falsa**, porque a coluna devolve numero como **texto** —
*"numbers (both integer and float) are returned as strings"*, `meta.php:598` — e
`update_post_meta` recebe `time()`, que e **inteiro**. O `UPDATE` sai mesmo
quando o instante gravado e o mesmo.

T002 reproduziu isso e tem teste para os dois lados. O que importa para quem vem
depois: **a idempotencia que o cenario `@idempotencia` de `PT-012` cobra nao vem
do metadado** — vem do estado da solicitacao e das duas chaves
`_wp_admin_notified` / `_wp_user_notified`, que sao de T005, T011 e T013.

---

## 🔴 O que T003 encontrou, e NAO resolveu

### 1. A capacidade conferida e a da TELA, e CA-1.1 diz "da acao pedida"

CA-1.1: *"a solicitacao exige a capacidade de privacidade correspondente **a acao
pedida**, verificada antes de a tela abrir"*. A segunda metade e exata — a
verificacao e a primeira linha das duas telas. A primeira nao:

- `wp-admin/export-personal-data.php:12` pergunta `export_others_personal_data`;
  `wp-admin/erase-personal-data.php:12` pergunta `erase_others_personal_data` **e**
  `delete_users`. As duas perguntam pela **tela**, nao pelo que o formulario pede;
- a acao vem do campo oculto `type_of_action` (`export-personal-data.php:143`), e
  `_wp_personal_data_handle_actions()` **nao recebe a tela**: o `switch` dela
  aceita os dois valores de `action` (`privacy-tools.php:99` e `:100`) em
  qualquer uma das duas;
- logo quem tem **so** `export_others_personal_data` abre a tela de exportacao,
  envia `type_of_action = remove_personal_data`, e a solicitacao de **apagamento**
  e criada sem que nenhuma das duas capacidades de apagar seja perguntada em
  lugar nenhum.

**T003 reproduziu o legado** — `autorizarAbertura()` recebe a superficie, e
`abrirSolicitacaoPelaTela()` cria com a acao do formulario — e tem teste que
afirma o desfecho como ele e. Fechar a brecha mudaria o que uma conta com
`export_others_personal_data` pode fazer, e o P1 e literal: *"divergir exige uma
decisao humana registrada, citada no codigo que divergiu"*. Nenhuma das tres
divergencias autorizadas e esta. Mesmo precedente e mesma postura de
`contextos/midia/envio/permissao-de-envio.ts`.

### 2. A tela abre a solicitacao JA confirmada, e isso contradiz `D2`

⚠️ **Correcao de uma afirmacao de T002, conferida na arvore.**
`armazenamento/estados-da-solicitacao.ts` diz, sobre o estado `'confirmed'` da
abertura: *"Nao e caminho de tela: o parametro foi acrescentado na 5.7.0 e e por
ele que uma extensao abre solicitacao ja autorizada"*. **E caminho de tela**, com
duas ancoras:

- `if ( ! isset( $_POST['send_confirmation_email'] ) ) { $status = 'confirmed'; }`
  (`wp-admin/includes/privacy-tools.php:116`-`:118`);
- a caixa *"Confirmation email"* existe nos dois formularios e vem **marcada** de
  fabrica (`wp-admin/export-personal-data.php:130` e
  `wp-admin/erase-personal-data.php:130`).

Desmarcar a caixa abre a solicitacao em `request-confirmed` — **sem chave, sem
e-mail e sem o titular autorizar nada** — e dali ela e executavel, porque CA-5.1
e CA-6.1 pedem *"o estado confirmado"*. `D2` / BR-MIGRAR-039 diz *"nada acontece
sem confirmacao do titular"* e `UT-086-7` cobra *"trava a execucao enquanto o
titular nao confirmar"*: o caminho normal da tela honra as duas, porque o default
e `pending`; este desvio nao.

**T003 nao decide nada**: o default fica `pending` (CA-1.2 descreve o caminho
normal, e ele esta portado), a opcao continua existindo porque e superficie
publicada (P8), e o desfecho tem teste. **Quem pegar T005, T011 ou T013 le isto
antes de comecar**: as tres tratam `request-confirmed` como *"o titular
autorizou"*, e ha um caminho em que ele nao autorizou.

### 3. Reforco da divergencia 1 de T001: o retorno do envio e descartado

Nao e achado novo, e e evidencia nova para a divergencia 1 (*"nada move a
solicitacao para o estado de falha quando o envio nao sai"*, CA-3.1): a tela
chama `wp_send_user_request( $request_id )` em `privacy-tools.php:169` **sem
atribuir o retorno** — nao ha `$result =`, nao ha `is_wp_error` — e monta
*"Confirmation request initiated successfully."* em `:171` independentemente de o
e-mail ter saido. Quem pegar **T007** le isto antes de decidir onde o estado de
falha e escrito.

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

O que **T002** acrescenta a essa lista:

- O cenario `@invariante` de `D1` passa a ser conferivel inteiro, e nao so pela
  ausencia: *"as duas a gravam como conteudo do mesmo tipo"* (`user_request`),
  *"o campo que guarda o endereco do titular e o mesmo nas duas"*
  (`post_title`) e *"o estado inicial gravado e o mesmo nas duas"*
  (`request-pending`) tem, cada um, uma constante nomeada e um teste. A tabela de
  **seis** colunas reaproveitadas esta no cabecalho de
  `armazenamento/solicitacao.ts`.
- O cenario `@idempotencia` ganhou a sua primeira metade afirmavel: as tres
  sequencias de comando em que o legado **nao emite nada** —
  identificador nao positivo, linha de outro tipo e metadado de valor identico —
  tem teste, e a porta falsa registra comando em vez de simular banco
  justamente para isso. ⚠️ A outra metade, *"nenhuma das duas reenvia e-mail"*,
  depende do estado e das duas chaves `_wp_*_notified`, e e de T005, T011 e T013
  — ver *O que T002 encontrou*, item 4.
- O cenario `@concorrencia` tem a segunda afirmacao da sua primeira metade: dois
  armazenamentos compostos sobre portas de sites diferentes emitem comando em
  tabelas diferentes (`wp_posts` e `wp_2_posts`) e nao se enxergam.
- ⚠️ **O que T002 NAO torna conferivel, e e preciso dizer:** nenhum cenario que
  compare a **escrita** da linha pode rodar contra este modulo, porque ele nao a
  emite. A comparacao de *"snapshot + sequencia de comandos"* da abertura, da
  confirmacao e da expiracao so existe depois que a tarefa que grava declarar a
  ligacao tardia com BC-01.

O que **T003** acrescenta, e e a metade que faltava acima:

- O cenario `@invariante` de `D1` passa a ser conferivel **pela escrita**, e nao
  so pela forma: o pedido que atravessa a ligacao tardia e o `$postarr` do
  legado, com as oito chaves, e o teste o compara campo por campo — *"as duas a
  gravam como conteudo do mesmo tipo"* (`post_type`), *"o campo que guarda o
  endereco do titular e o mesmo nas duas"* (`post_title`) e *"o estado inicial
  gravado e o mesmo nas duas"* (`request-pending`).
- O cenario `@invariante` de `D2` tem a primeira metade fechada: *"nenhuma das
  duas exporta nem apaga nada"* antes da confirmacao — o registro de provedores
  sai intocado da abertura, e a porta de e-mail tambem. A segunda metade,
  *"nenhuma das duas muda o estado da solicitacao"*, e de T005. 🔴 E com uma
  ressalva que nao e de T003 resolver: o desvio da caixa desmarcada (achado 2)
  **nasce** confirmada, e nesse caminho `D2` nao vale no legado.
- A sequencia de comandos da abertura e afirmada **pelas ausencias**: endereco
  invalido, acao invalida e estado invalido nao leem conta, nao consultam
  duplicidade e nao inserem; e a recusa do portao da tela nao faz nada. Lista
  vazia e afirmacao, nao ausencia.
- ⚠️ **O que T003 NAO torna conferivel:** nada que dependa de chave, de prazo ou
  de e-mail, porque a chave nasce no envio (T005). E a lista desta tarefa roda
  **sem** a limpeza das pendentes vencidas, que no legado passa antes dela
  (`wp-admin/export-personal-data.php:73`) e e T009: ate T009 fechar, a lista
  mostra como pendente uma solicitacao que o legado ja teria movido para falha.

O que **T017** torna conferivel:

- O cenario `@regulatorio` *"Exportar ou apagar dado de terceiro e poder de
  rede"* tem as duas metades afirmadas: o administrador de site em instalacao de
  rede e recusado nos tres portoes, o administrador de rede passa nos tres, e
  *"a diferenca entre as duas decisoes"* e exatamente o modo de instalacao — a
  mesma conta, a mesma matriz e a mesma pergunta decidem diferente so por causa
  dele.
- O cenario `@regulatorio` *"A pagina de politica de privacidade e protegida
  pela propria capacidade de privacidade"* tem os dois lados: o ator sem a
  capacidade e recusado e o ator com ela passa, e a lista exigida e afirmada
  campo a campo, inclusive a ordem do `array_merge`. ⚠️ A metade *"com a mesma
  mensagem"* e *"o mesmo efeito no banco"* nao esta aqui: a recusa e o efeito de
  apagar uma pagina sao da feature do conteudo (`contextos/conteudo` e
  `contextos/retencao-e-descarte`), nao desta. O que T017 afirma e a **lista
  exigida**, que e onde `D5` vive.
- ⚠️ **O que T017 NAO torna conferivel:** o disparo do ponto de extensao
  `user_has_cap` a cada pergunta. O portao de apagar pergunta **duas** vezes com
  curto-circuito justamente porque o numero de disparos e observavel, e a forma
  esta preservada — mas o barramento que os emitiria e `REQ-162`, que esta em
  `do-not-rewrite.md`. Contar disparo contra o oraculo depende dele.

⚠️ `parity_specs.md` registra que a suite de *characterization tests* **nao
existe** nesta arvore e que o corpus do Parallel Run **nao existe** — *"sem ele
nenhuma metrica percentual tem denominador"*. A resposta 16 de `questions.md`
autoriza o ambiente-oraculo, que e T001 da feature `015` e ainda nao existe.
Enquanto isso, o que se confere aqui e a forma e a ausencia de efeito, nao a
comparacao caso a caso.
