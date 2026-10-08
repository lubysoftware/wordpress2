# Modulo de identidade e acesso — BC-05

Feature `001-identidade-e-acesso`. Tarefas fechadas com nota de entrega neste
arquivo: **T001** (esqueleto e portas), **T002** (forma de armazenamento),
**T003** (US-1, autenticar), **T005** (US-2, saida), **T007** (US-3, prazo da
sessao), **T011** (US-5, falha de envio do e-mail de redefinicao), **T013**
(US-6, cadastro aberto), **T015** (US-7, autorizacao por capacidade — cuja
**decisao** mora em `plataforma/autorizacao/`, e nao aqui), **T019** (US-9, as
quatro capacidades que entram so por ponto de extensao) e **T023** (US-11,
administrar contas verificando a permissao sobre cada conta alvo). Este arquivo e
a leitura obrigatoria de quem pegar a tarefa seguinte: ele diz o que ja esta
decidido, o que esta decidido **em outro lugar**, e o que ninguem decidiu.

> *(Este paragrafo vinha **quatro** vezes, cortado ao meio e com quatro listas de
> tarefas fechadas que se contradiziam, por merges que juntaram worktrees que
> escreveram o mesmo texto. T023 as fundiu numa so, sem tirar nenhuma tarefa de
> nenhuma das quatro listas.)*

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca a matriz de papeis:** o
> conflito entre `REQ-017` e a resposta 5 **continua aberto**, T002 esbarrou
> nele e **nao o resolveu**. O que T002 fez foi isolar a decisao num argumento
> obrigatorio sem valor padrao, com os dois lados implementados e testados. A
> explicacao inteira esta em `armazenamento/matriz-de-fabrica.ts` e o resumo
> esta na secao *O que ninguem decidiu* deste arquivo.

> 🔴 **E se a sua tarefa toca a credencial de aplicacao:** a spec de paridade e o
> caso de uso **discordam** sobre o que ela autoriza — o cenario de
> `parity_tests/06-autenticacao-e-sessao.feature` afirma que o conjunto permitido
> por ela e *"menor que o da sessao"*, e UC-22, BR-MIGRAR-026 e `permissions.md`
> §8.2 afirmam que autenticar com ela *"nao reduz as capacidades do usuario"*.
> T021 esbarrou nisso e **nao resolveu**: o ponto em disputa e o **consumo**
> (`REQ-012`, fora deste pacote) e a emissao foi construida como as tres fontes de
> regra mandam. Quem pegar `REQ-012` precisa da decisao antes de comecar. A
> explicacao inteira esta na secao *O que T021 encontrou aberto* deste arquivo.

> 🔴 **E se a sua tarefa toca o fluxo de redefinicao de senha:** a spec e a
> analise do legado **discordam** sobre avisar o requisitante quando o e-mail
> nao sai (CA-5.1 contra `UC-20` § *Excecoes*). T011 esbarrou nisso e **nao
> resolveu**: isolou a decisao num argumento obrigatorio sem valor padrao, com
> os dois lados implementados e testados. A explicacao inteira esta em
> `recuperacao-de-senha/envio-do-email-de-redefinicao.ts` e o resumo esta na
> secao *O conflito que T011 encontrou* deste arquivo.

> 🔴 **E se a sua tarefa toca a administracao de contas:** tres criterios de
> US-11 dizem mais do que o legado faz, e T023 esbarrou nos tres e **nao
> escolheu** — reproduziu o legado, pelo **P1**, e deixou a redacao para quem
> decide. Sao CA-11.2 (*"uma conta sem permissao e saltada"*, que vale em **uma**
> das tres acoes em lote), CA-11.6 (*"continua havendo ao menos uma conta capaz
> de promover"*, que no legado e **consequencia** de uma trava de tela e nao uma
> contagem) e CA-11.7 (*"quem foi promovido e notificado"*, que o legado **nao**
> notifica). O resumo esta na secao *O que T023 encontrou aberto* deste arquivo.

## O que T001 entrega, e so isso

> *o modulo carrega com as portas de dados, de envio de e-mail e de relogio
> declaradas, e nenhuma regra de negocio implementada*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T001

| arquivo | o que e |
|---|---|
| `index.ts` | a composicao: recebe as tres portas e devolve o modulo |
| `portas/porta-de-dados.ts` | a unica porta deste modulo para o banco |
| `portas/porta-de-email.ts` | envio com transporte selecionavel, falha como valor |
| `portas/porta-de-relogio.ts` | o instante corrente, em segundos inteiros UTC |
| `modulo.test.ts` | afirma a entrega de T001 e duas invariantes de arquitetura |

**Nenhum prazo, contagem ou limite aparece neste modulo, e isso e proposital.**
Os prazos desta
feature — 24 horas da chave de redefinicao, 2 e 14 dias de sessao, 12 horas de
carencia, 60 e 50 caracteres de login e apelido, 24 caracteres da senha de
aplicacao — entram nas tarefas que os implementam, cada um num ponto de
configuracao nomeado com o valor de fabrica do legado e com teste de borda, como
o **P6** da constituicao exige. Numero que aparece aqui antes da tarefa dele e
numero sem teste de borda.

**O papel entrou como DADO, e nao como decisao.** T002 povoou a matriz de
fabrica e a forma de grava-la; **T015 decide a autorizacao**, em
`plataforma/autorizacao/`, e nada deste modulo responde "pode". Ver o conflito
aberto abaixo antes de mexer na matriz.

## O que T002 entrega, e so isso

> *as estruturas da secao Modelo de dados do plano existem, sao lidas e gravadas
> pela porta de dados, e a matriz de fabrica e carregada com as mesmas
> concessoes que o legado semeia*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T002

| arquivo | o que e |
|---|---|
| `armazenamento/index.ts` | compoe os quatro repositorios sobre a porta de dados |
| `armazenamento/chaves-e-tabelas.ts` | os nomes de tabela, de chave de metadado e de opcao — e qual prefixo cada um usa |
| `armazenamento/conta.ts` | `users`, nas duas variantes de DDL; a coluna morta e a sentinela de data |
| `armazenamento/perfil.ts` | `usermeta` cru, com a semantica de gravacao do legado |
| `armazenamento/sessao.ts` | o arranjo de tokens dentro de `usermeta` |
| `armazenamento/papel.ts` | `VO-Papel` e o construtor com a semantica de criar papel e conceder capacidade |
| `armazenamento/matriz-de-fabrica.ts` | as oito rotinas de povoamento — **e o conflito aberto** |
| `armazenamento/repositorio-de-papeis.ts` | a opcao `{site}user_roles` e a chave `{site}capabilities` |
| `armazenamento/porta-falsa.ts` | porta de dados de teste que registra consulta; as suites das historias vao usa-la |
| `../../plataforma/serializacao/` | o *codec* do formato serializado, com a suite de conformidade |

**Tres coisas que T002 acrescentou fora da propria pasta**, e o motivo de cada
uma:

1. **`portas/porta-de-dados.ts` ganhou `prefixoBaseDeTabela`.** O legado tem
   **dois** prefixos: `users` e `usermeta` sao globais e ficam no prefixo base,
   `options` e por site. Derivar um do outro por corte de texto nao funciona, e
   sem o segundo prefixo nenhuma consulta de rede sai certa.
2. **O codec ficou em `plataforma/serializacao/`, nao aqui.**
   `target_architecture.md` atribui o codec a `plataforma/opcoes/`, e a regra de
   dependencia 2 proibe `plataforma/` importar `contextos/`: nascido dentro deste
   contexto, ele seria inalcancavel pelo modulo que vai ser dono dele.
3. **`modulo.test.ts` cresceu em uma chave.** A lista de superficie do modulo
   passou a `['armazenamento', 'nome', 'portas']`, que e o que o proprio teste
   previa ("esta lista cresce NA TAREFA DELAS").

**O que T002 NAO entrega, de proposito**, porque e regra de outra tarefa:
descartar sessao vencida (T007, que tem o relogio), validar tamanho de login e
de apelido (T013, onde `U2` e erro de cadastro), derivar `user_level` das
capacidades, apagar conta — a cascata de apagamento e observavel (P5) e e de
T023 —, e **qualquer** decisao de autorizacao, que e T015 e mora em
`plataforma/autorizacao/`.

## O que T003 entrega, e so isso

> *o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4,
> CA-1.5 passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T003

| arquivo | o que e |
|---|---|
| `autenticacao/autenticar.ts` | a operacao de entrada, nos passos de UC-19 e na ordem dele |
| `autenticacao/cadeia-de-autenticacao.ts` | a cadeia filtravel, com as prioridades inteiras do legado |
| `autenticacao/erro-de-autenticacao.ts` | os codigos e as mensagens — `ESC-ENUMERACAO`, divida herdada |
| `autenticacao/verificacao-de-senha.ts` | o ponto de substituicao da conferencia de senha (`EXT-SUBST`) |
| `autenticacao/normalizacao-de-credencial.ts` | o preambulo: sanitizacao do login, espaco da senha, reconhecimento de e-mail |
| `autenticacao/contexto-de-autenticacao.ts` | o contexto por requisicao (AD-02) e os ganchos de ligacao tardia |
| `autenticacao/prazos-de-sessao.ts` | o prazo do token: 2 e 14 dias, valores de fabrica |
| `conta/leitura-de-conta.ts` | as duas leituras e a escrita que a entrada faz |
| `sessao/registro-de-sessoes.ts` | abrir sessao, somando ao registro que **acumula** |
| `autenticacao/autenticar.test.ts` | os cinco critérios, mais as regras que a implementacao quebraria em silencio |

**T003 foi construida com T002 ainda aberta.** `tasks.md` poe T002 antes
(*depende de: T001, T002*) e a linha dela seguia `[ ]`. Duas consequencias, e as
duas estao marcadas no codigo com o mesmo aviso:

- `conta/leitura-de-conta.ts` e a **fatia minima** de `AGG-Conta` que a entrada
  le, escrita contra a `PortaDeDados` e com as colunas de
  `target_data_model.md`. Nada ali serializa valor, logo nada ali depende do
  codec de `serialize()` (`DB-SER`).
- `sessao/registro-de-sessoes.ts` tem o **comportamento** de abrir sessao e
  deixa a **forma gravada** atras de `ArmazenamentoDeSessoes`, porque a sessao
  vive em metadado serializado e esse codec e da fronteira do banco.

Quem pegar T002 absorve as duas: a forma e dela, o comportamento de entrada e de
T003. Nenhum dos dois arquivos decide nada que T002 precise desdecidir.

**Tres numeros entram aqui, e nenhum e novo.** Os prazos do token (2 e 14 dias,
BR-MIGRAR-025) entram porque abrir sessao exige um instante de expiracao; o teto
de comprimento da senha entra porque a conferencia o aplica antes de conferir.
Os tres estao em ponto de configuracao nomeado com o valor de fabrica, como o
**P6** exige. A **carencia de 12 horas nao esta aqui**: ela nao entra no prazo do
token, e interpretar onde ela entra e a entrega de T007.

**O que T003 nao faz, de proposito:** nao grava cookie, nao monta nonce e nao
embute o fragmento de 4 caracteres do hash da senha na chave do HMAC — isso e
T007 (US-3), e o risco 3 de `plan.md` avisa que e *"o tipo de detalhe que um
porte perde sem o teste notar"*. Nao conta tentativa e nao bloqueia conta:
REQ-005 esta em `do-not-rewrite.md` e o **P6** poe limite de taxa fora do nucleo.

## O que T005 entrega, e so isso

> *o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3 passam
> contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T005

| arquivo | o que e |
|---|---|
| `sessao/encerramento-de-sessao.ts` | `encerrar`, `encerrarOutras` e `encerrarTodas` sobre o registro, mais a consulta de um token |
| `sessao/saida.ts` | a saida do produto: encerra a sessao corrente, limpa a credencial do navegador e torna a identidade anonima |
| `sessao/saida.test.ts` | os tres critérios, a ordem dos passos (que e contrato por P2) e as regras que a implementacao quebraria em silencio |

**Encerrar remove UMA entrada, e e isso que CA-2.1 e CA-2.2 cobram.** A simetria
com T003 e exata: abrir **soma** ao mapa e nunca substitui (`ESC-SESSAO`, o
acumulo e criterio de aceite), e encerrar **subtrai uma** e nunca varre. As duas
pontas usam a mesma funcao de resumo do token, ou a sessao aberta nao e
encontrada.

**Duas operacoes nascem sem nenhum chamador, de proposito.** BR-MIGRAR-111 manda
portar `wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` *"definidas e
sem chamador, como estao hoje"*, e o cenario de paridade da area cobra as tres
coisas: que existam, que **nenhum caminho de uso do produto as invoque** e que o
efeito no banco seja identico quando invocadas direto. Por isso elas saem **pelo
barril** — no legado sao funcoes globais, alcancaveis por qualquer extensao — e
**nao** entram na interface do modulo composto, que lista passo de fluxo. Quem
acrescentar chamador a uma delas esta mudando comportamento, nao consertando
nada.

**O que T005 nao faz, de proposito:** nao emite cookie nem nonce (T007), nao
filtra sessao vencida (o filtro do que venceu precisa do relogio e e a entrega de
T007 — quando ele entrar na leitura do mapa, as funcoes de encerramento passam a
ver o mapa ja filtrado, como no legado, e nada daqui muda), nao redireciona e nao
pinta mensagem (*"You are now logged out."* e string literal de `SCR-001`), e nao
encerra as outras sessoes da conta, que e o oposto de CA-2.2.

**Uma observacao que T005 nao resolveu, porque nao e dela.** Ha **duas**
representacoes do registro de sessoes nesta arvore, pelo mesmo motivo das duas
`Conta` que `index.ts` registra: `sessao/registro-de-sessoes.ts`
(`ArmazenamentoDeSessoes`, mapa de dominio) e `armazenamento/sessao.ts`
(`RepositorioDeSessoes`, a forma serializada em `usermeta`). Nenhum adaptador
liga as duas. T005 escreveu contra a de **dominio**, que e a que T003 usa para
abrir sessao, para nao decidir no lugar de quem vai decidir qual fica.
## O que T007 entrega, e so isso

> *o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4
> passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T007

| arquivo | o que e |
|---|---|
| `sessao/expiracao-de-sessao.ts` | a carencia de 12 horas, o prazo da credencial do navegador e o filtro do que venceu — **e o ponto que o pacote deixou aberto** |
| `sessao/sessao-da-requisicao.ts` | a sessao desta requisicao pelo prazo, ou anonima (CA-3.4) |
| `sessao/expiracao-de-sessao.test.ts` | os quatro critérios, as bordas do P6 e as duas regras que a implementacao quebraria em silencio |

**Tres arquivos de fora mudaram, e nenhum por gosto:**

1. **`sessao/registro-de-sessoes.ts` ganhou a poda do que venceu.** T002 nomeou
   essa divisao em `armazenamento/sessao.ts`: *"o legado filtra o que venceu NA
   LEITURA, e esse filtro precisa do relogio; os 2 dias, os 14 e as 12 horas de
   carencia sao `U5` e entram em T007"*. `abrirSessao` le o mapa antes de
   regravar, logo a poda aparece na gravacao — e o criterio de paridade desta
   area e **efeito no banco**, com tolerancia zero. O acumulo de `ESC-SESSAO`
   continua de pe: o unico motivo de uma entrada sair do mapa e o relogio.
2. **`autenticacao/autenticar.ts` passou a devolver o prazo da credencial do
   navegador.** Ele e decidido no mesmo passo no legado — a funcao que grava a
   credencial escolhe, pela opcao de lembranca, entre credencial de sessao e
   credencial com prazo (`pluggable.php:1088` e `:1091`) — e o passo 3 de UC-19 e
   um passo so. Separar em duas operacoes esconderia que a lembranca decide os
   dois prazos. `contexto-de-autenticacao.ts` ganhou `carenciaDeSessao`, opcional,
   ao lado de `prazosDoToken`.
3. **`index.ts` e `modulo.test.ts` ganharam `sessaoDaRequisicao`**, com a
   declaracao explicita de permissao que o P4 exige: **nenhuma capacidade**, e a
   declaracao e o ponto — e ela que **produz** a identidade com que as
   capacidades sao decididas, logo exigir capacidade dela seria circular.

**O que T007 nao faz, de proposito:** nao monta cabecalho de resposta, nao
nomeia a credencial, nao serializa o valor dela e **nao embute o fragmento de 4
caracteres do hash da senha na chave do HMAC**. A ancora do fragmento e
`pluggable.php:855`–`:867`, e nenhuma dessas linhas e evidencia de US-3 — as de
US-3 sao `:1082`, `:1088` e `:1091`, as tres do prazo. O risco 3 de `plan.md`
descreve essa costura; ela esta **nomeada** em `expiracao-de-sessao.ts` para a
tarefa que a construir, com a observacao de que o hash corrente depende da
primitiva de bcrypt, que e adaptador e nao existe nesta arvore. Nao encerra
sessao: US-2 / T005.

### 🔴 O ponto que T007 encontrou aberto, e NAO resolveu

**A carencia vale para as duas duracoes da sessao, ou so para a estendida?**

- `spec.md` CA-3.3 nao qualifica: *"ha 12 horas de carencia apos **o prazo**,
  durante as quais a sessao ainda e aceita"*. BR-MIGRAR-025, UC-19 e
  `target_domain_model.md` repetem a frase sem qualificar.
- `parity_tests/06-autenticacao-e-sessao.feature` aponta para o outro lado:
  *"Dado uma entrada **sem** a opcao de lembrar / Quando o tempo avanca ate
  depois da duracao padrao / Entao as duas metades **recusam** a sessao /
  **Mas** uma entrada com a opcao de lembrar tem duracao estendida / Quando o
  tempo avanca ate dentro da carencia **da duracao estendida** / Entao as duas
  metades aceitam"*.

As duas leituras divergem no efeito, e a divergencia e a que o P1 avisa que passa
sem ninguem notar: a primeira aceita a sessao por 2 dias e 12 horas sem
lembranca, e e portanto **mais aberta**. T007 implementou o critério de aceite
como esta escrito — a carencia e do prazo, qualquer que seja ele —, porque sao
CA-3.3 e CA-3.4 que esta tarefa tem de fazer passar, e estreitar um critério de
aceite por conta propria seria decidir no lugar de quem decide. A outra leitura e
alcancavel sem alterar arquivo deste modulo (`carencia: 0` sem lembranca), ha
teste afirmando isso, e a escolha e conferencia contra o oraculo
(`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe
(`oracleAvailable: false`).

E o pacote registra **um** numero de carencia e **uma** condicao. Nenhum outro
numero foi acrescentado: o P6 recusa numero que o legado nao tem, e tambem
numero que o pacote nao registra.

## O que T011 entrega, e so isso

> *o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam
> contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T011

| arquivo | o que e |
|---|---|
| `recuperacao-de-senha/envio-do-email-de-redefinicao.ts` | o passo 3 de UC-20 — o envio do e-mail de redefinicao — e o relato da falha dele; **e o conflito** |
| `recuperacao-de-senha/envio-do-email-de-redefinicao.test.ts` | os tres critérios **nos dois lados do conflito**, mais o P7, o P6 e a ausencia de estado entre pedidos |

**A operacao sai pelo barril e NAO entra na composicao**, por um motivo que e de
escopo e nao de gosto: a tabela *Contratos* de `plan.md` nomeia a operacao
*"pedir redefinicao de senha"*, e ela e de **T009** (US-4), cuja linha em
`tasks.md` seguia `[ ]`. T011 entrega o passo de envio dessa operacao, nao a
operacao; por-la em `ModuloDeIdentidadeEAcesso` a faria parecer passo de fluxo
inteiro, que e a mesma razao pela qual as duas operacoes de BR-MIGRAR-111 saem so
pelo barril.

**T011 foi construida com T009 ainda aberta**, pelo mesmo precedente de T003 com
T002: a fatia e a que US-5 descreve, escrita contra as portas. O que fica
**explicitamente** para T009, e nao foi tocado aqui: gerar a chave, resumi-la,
grava-la na conta, as 24 horas dela, substituir a anterior num pedido novo
(CA-4.3) e **montar a mensagem** — o corpo carrega a chave em claro, e CA-4.1
diz que *"o valor em claro so existe no e-mail enviado"*. `enviarEmailDeRedefinicao`
recebe a `MensagemDeEmail` pronta; quem a monta, e com quais ganchos, e T009.

**CA-5.2 passou inteiro, e nao esta em conflito com nada.** O registro tem os
tres campos que o critério nomeia — instante (da porta de relogio, em segundos
inteiros UTC), destinatario e o motivo **como o canal informou** — e e **so
escrita**: `registrar` devolve `void`, nenhuma ramificacao do codigo o consulta e
nao ha `try`/`catch` em volta dele, porque tratar o erro de escrever log **seria**
a ramificacao que o P7 proibe. O colaborador e **obrigatorio** no contexto, nao
opcional: CA-5.2 nao tem condicao, e um colaborador opcional deixaria a
composicao escolher nao cumprir o critério.

**CA-5.3 passou, e passou por ausencia.** Nada fica latchado: sem contador de
tentativa, sem marca de "ja falhou", sem espera entre pedidos e sem estado de
modulo. Onze pedidos produzem onze tentativas de envio, e esta afirmado por
teste. As tres ausencias sao regra: `do-not-rewrite.md` poe `REQ-005` e
`REQ-160` fora do pacote, e o P6 fecha — *"Onde o legado nao tem numero, o
sistema novo tambem nao tem"*.

**Nenhum numero novo entrou neste modulo com T011**, e nenhum ponto de extensao
foi inventado: os ganchos que o legado tem em volta deste passo sao de composicao
da mensagem, logo de T009, e o ponto de substituicao do envio **e a porta**
(`wp_mail()` e uma das 38 funcoes substituiveis, BR-MIGRAR-103 / `EXT-SUBST`).

### 🔴 O conflito que T011 encontrou, e NAO resolveu

**CA-5.1 e a analise do legado dizem o contrario uma da outra, e as duas sao
decisao humana.**

| lado | o que manda | onde esta escrito |
|---|---|---|
| avisar | *"Falha no envio devolve ao requisitante um aviso distinto do caso de sucesso"* | `spec.md` CA-5.1; `plan.md` § *Contratos* |
| nao avisar | *"O e-mail nao saiu \| o assinante **nao tem como saber**: nenhum estado registra a falha de envio neste fluxo, ao contrario do que acontece na solicitacao de dados pessoais"* | `UC-20` § *Excecoes*, confianca 🟢 `confirmado` |

Tres evidencias do pacote somam ao lado "nao avisar": (1) a regra `D3` que US-5
cita e ancorada em `privacy-tools.php:226` — e a **solicitacao de dado
pessoal** —, e a propria `spec.md` poe a ressalva *"(o fluxo de privacidade ja
faz assim; este fluxo nao faz)"*; (2) `target_screens.md` lista as **8** strings
literais de `SCR-002` e as 3 de `SCR-006`, e **nenhuma** e falha de envio, com
`diff` de string **zero** exigido; (3)
`parity_tests/06-autenticacao-e-sessao.feature`, que cobre UC-20, **nao tem**
cenario de falha de envio — ele existe so em
`12-solicitacao-de-dado-pessoal.feature`, o outro fluxo.

**T011 bateu nisso e nao escolheu**, pelo mesmo caminho de T002 com REQ-017:
`relatoAoRequisitante` e **argumento obrigatorio, sem valor padrao**. Nenhuma
composicao compila sem alguem decidir, a escolha fica legivel onde foi feita, os
dois lados estao implementados e afirmados por teste, e um teste afirma que eles
diferem **somente** em `avisoAoRequisitante` — o relato, o registro e a
tentativa de envio sao identicos nos dois. A explicacao inteira, com as citacoes,
esta no cabecalho de `recuperacao-de-senha/envio-do-email-de-redefinicao.ts`.

Duas consequencias que quem decidir precisa ter na mao, e que o card REQ-007 nao
menciona:

1. o lado que avisa carrega **codigo, nao texto**: nao existe msgid registrado
   para esse aviso, e inventar um quebraria o `diff` zero de `SCR-002`. Quem
   decidir por avisar registra tambem a string, e ela e **tela nova**, nao
   paridade;
2. avisar "o e-mail nao saiu" e um canal novo de informacao sobre a conta. Isso
   nao e argumento contra — `ESC-ENUMERACAO` (BR-MIGRAR-110) registra que este
   produto enumera conta **de proposito**, por decisao humana —, mas e um ponto
   a decidir junto, e nao foi decidido aqui.
## O que T013 entrega, e so isso

> *o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4,
> CA-6.5, CA-6.6 passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T013

| arquivo | o que e |
|---|---|
| `cadastro/cadastrar.ts` | a operacao, nos passos de UC-21 e na ordem dele |
| `cadastro/configuracao-de-cadastro.ts` | `U1`, `U2` e `U3` como ponto de configuracao nomeado, com os valores de fabrica |
| `cadastro/validacao-de-cadastro.ts` | tamanho, validade, lista de proibidos e derivacao do apelido |
| `cadastro/criacao-de-conta.ts` | a gravacao da linha de `users` e as quatro conferencias de `wp_insert_user` |
| `cadastro/atribuicao-de-papel.ts` | o papel padrao e o nivel **derivado** — e a chave `{site}user_level` que T002 deixou so nomeada |
| `cadastro/chave-de-redefinicao.ts` | a emissao da chave de 24 h, o valor gravado e o caminho que vai no e-mail |
| `cadastro/notificacao-de-conta-nova.ts` | a mensagem ao titular, como ponto de substituicao (`EXT-SUBST`) |
| `cadastro/geracao-de-segredo.ts` | o alfabeto e o sorteio dos dois segredos |
| `cadastro/erro-de-cadastro.ts` | os codigos e as mensagens, e o envelopamento que o legado faz |
| `cadastro/contexto-de-cadastro.ts` | o contexto por requisicao (AD-02) e os cinco pontos de extensao |
| `autenticacao/geracao-de-hash-de-senha.ts` | o gemeo de `verificacao-de-senha.ts`: o lado que **gera** o hash |
| `cadastro/cadastrar.test.ts` | os seis critérios, as bordas do P6 e as regras que a implementacao quebraria em silencio |

**Dois arquivos de fora mudaram, e nenhum por gosto:**

1. **`autenticacao/normalizacao-de-credencial.ts` ganhou o modo estrito.** T003 o
   deixou de fora com o endereco escrito: *"o modo estrito (que reduz a ASCII)
   **nao** esta aqui: a entrada nao o usa, e quem o usa e o cadastro (US-6 /
   T013)"*. Entrou como **parametro da mesma funcao**, porque o legado tem uma
   funcao so — duas funcoes divergiriam no primeiro ajuste — e com teste de
   regressao afirmando que o modo nao estrito nao mudou.
2. **`index.ts` e `modulo.test.ts` ganharam `cadastrar`**, com a declaracao
   explicita de permissao que o P4 exige: **nenhuma capacidade**, porque o ator e o
   **visitante**, que por definicao nao tem papel, e porque UC-21 poe a autorizacao
   na **opcao** `users_can_register`. E a unica operacao deste modulo cuja porta
   **nasce fechada**, e isso tambem e declaracao.

**Dois nomes passaram a colidir no barril, e nenhum dos dois sumiu.**
`destinoDeRetorno` e `primeiroCodigoDeErro` existem nas duas familias, com
proposito paralelo. O barril desfez a ambiguidade do mesmo jeito que ja havia
desfeito a das duas `Conta`: export explicito para a familia mais antiga e o nome
da outra ao lado (`destinoDeRetornoDoCadastro`,
`primeiroCodigoDeErroDeCadastro`), com os dois alcancaveis tambem pelo caminho
deles.

**Cinco numeros entram aqui, e dois deles o pacote nao registra.** Os 60 do login
e os 50 do apelido sao `U2` (BR-MIGRAR-022), as 24 horas da chave sao `U4`
(BR-MIGRAR-024), e os tres estao em ponto de configuracao nomeado com teste de
borda, como o **P6** exige. Os comprimentos dos **dois segredos gerados** — a
senha inicial e a chave — nao estao em documento nenhum deste pacote: ele registra
24 caracteres para a credencial de aplicacao (`U6`) e 12 para a ativacao de
cadastro em rede (`U9`, que e `BC-12` e esta fora deste pacote), e **nada** para o
cadastro aberto. Eles reproduzem o legado, estao marcados no codigo e fecham
contra o oraculo — e nenhum dos dois e observavel por quem se cadastra, porque
CA-6.4 fixa que a senha nao e definida nem recebida pelo titular.

**O que T013 nao faz, de proposito:** nao autentica a conta criada (o legado nao
abre sessao no cadastro); nao conta tentativa e nao limita taxa (`REQ-160` esta em
`do-not-rewrite.md` e o **P6** poe limite de taxa fora do nucleo); nao cria
cadastro pendente nem reserva nome (`U7`/UC-41, `BC-12`, fora deste pacote); nao
**consome** a chave de redefinicao (recusar depois de 24 h, apagar no uso: US-4 /
T009); nao monta HTML e nao escolhe cadeia de tela (as 8 literais de `SCR-005` sao
da borda).

### 🔴 O que T013 encontrou aberto, e NAO resolveu

1. **O texto de nenhuma mensagem deste fluxo esta no pacote.**
   `target_screens.md` cataloga as 8 cadeias literais de `SCR-005` e as 8 sao da
   **tela** — rotulo, titulo, botao, link. Nenhuma mensagem de validacao e nenhuma
   linha do e-mail aparece em documento nenhum: elas vivem no arquivo que UC-21
   lista em *"Implementado em"* sem transcrever. T013 fez o que T003 ja havia feito
   com a mesma lacuna em `autenticacao/erro-de-autenticacao.ts`: reproduziu o
   legado, em **ingles** (porque `EC-05` fixa que o `msgid` em ingles **e** a chave
   do catalogo), e marcou cada bloco para conferencia contra o oraculo
   (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe.
2. **O legado joga fora o motivo quando a criacao da conta falha.** Um login de 61
   caracteres faz o visitante ler *"Couldn't register you… please contact the site
   admin!"*, e nao o texto do limite: o codigo especifico nasce, atravessa uma
   fronteira de funcao e e descartado. CA-6.2 continua satisfeito — *"devolvem
   erro, nunca truncamento"* —, e surfacear o codigo produziria um sistema **mais
   informativo** que o legado, que o **P1** trata como divergencia. T013
   reproduziu o envelopamento, pos o motivo original em `causa` como
   observabilidade que **nenhuma ramificacao le** (**P7**), e marcou para o
   oraculo.
3. **Com o apelido derivado do login e sem truncamento, os dois limites de `U2`
   fazem faixas diferentes.** Login de 51 a 60 caracteres recusa pelo **apelido**;
   de 61 em diante recusa pelo **login**. Os dois codigos sao alcancaveis e CA-6.2
   e exercitado por inteiro — mas isso depende de a derivacao do apelido **nao**
   cortar o login em 50. BR-MIGRAR-022 e CA-6.2 proibem o truncamento com a
   palavra *"erro, nao truncamento"*, e foi essa leitura que T013 implementou; a
   leitura alternativa (cortar o login para derivar o apelido) tornaria o limite de
   apelido inalcancavel neste fluxo e esvaziaria metade do critério. Fica
   registrado para o oraculo.
4. **O aviso ao administrador do site nao foi escrito.** No legado o cadastro
   aberto pede a notificacao no modo que manda **duas** mensagens — titular e
   administrador. UC-21 (passo 5, um ator secundario, uma linha de sequencia, duas
   pos-condicoes) e CA-6.5 (*"**o titular** recebe"*) registram **so** a do
   titular, e o texto da outra nao esta no pacote. T013 **nao escolheu** entre
   omitir e inventar: escreveu o que o pacote registra, deixou o retorno da
   notificacao como **lista** de tentativas para que a segunda mensagem entre sem
   mudar a forma de nada, e deixou a decisao aqui.
5. **O legado grava mais linhas de `usermeta` ao criar a conta do que as duas do
   papel** — um bloco de preferencias de perfil e, so no cadastro aberto, o
   marcador de aviso de senha padrao. **Nenhuma esta no pacote**: o *Modelo de
   dados* de `plan.md` nomeia **uma** chave desta tabela (`{prefixo}capabilities`)
   e as pos-condicoes de UC-21 declaram duas coisas, nenhuma delas uma linha de
   perfil. Como o criterio desta area e *"efeito no banco"*, a ausencia delas e
   divergencia a conferir, e nao escolha de desenho — inventar nome e valor de
   onze chaves que nenhum documento nomeia inventaria onze bytes gravados.
6. **O algoritmo do resumo da chave de redefinicao nao e deste pacote.** CA-4.1
   diz *"guardada com hash"* e nada mais; `tech-stack.json` detalha o hash de
   `user_pass` peca por peca e nao fala desta coluna; e no legado as duas
   primitivas **nao sao a mesma**. T013 poe o resumo atras de um ponto de
   substituicao obrigatorio e sem padrao — escolher um algoritmo aqui inventaria a
   forma de um byte gravado. A escolha e de **T009**.
7. **`preProcessarSenhaParaBcrypt`, em `autenticacao/verificacao-de-senha.ts`, nao
   corta espaco das pontas, e o legado corta dentro do pre-processamento.** Pelo
   caminho do produto as duas pontas coincidem, porque `autenticar` corta antes da
   cadeia e a geracao de T013 corta dentro dela; **chamar o verificador direto com
   senha cercada de espaco recusaria uma senha que o legado aceita.** T013 nao
   mexeu no arquivo de T003: a correcao e de uma linha e muda um ponto de
   substituicao publicado, o que nao e entrega desta tarefa.
## O que T015 entrega, e so isso

> *o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4,
> CA-7.5 passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T015

**A decisao nao esta neste modulo, e nunca ia estar.** Ela esta em
`src/plataforma/autorizacao/`, pela divisao que a secao *Onde a autorizacao mora*
abaixo ja declarava. Deste lado entrou **so a costura**:

| arquivo | o que e |
|---|---|
| `autorizacao/fonte-de-papeis.ts` | o adaptador: le a matriz gravada e a autorizacao da conta pela porta de dados, e as entrega na forma que a politica espera |
| `autorizacao/fonte-de-papeis.test.ts` | os criterios que precisam do dado **de fabrica** e do **efeito no banco** — CA-7.2, CA-7.4 e CA-7.5, nos dois lados do conflito REQ-017 |

E do outro lado, `plataforma/autorizacao/`: `capacidade.ts` (as duas sinteticas),
`contexto-de-autorizacao.ts`, `capacidades-do-ator.ts` (o `allcaps`),
`traducao-de-capacidade.ts`, `revogacao-por-constante.ts` (as quatro constantes),
`decisao-de-capacidade.ts` (a **ordem** dos seis passos), `quem-tem-capacidade.ts`
(CA-7.4) e `catalogo-de-capacidades.ts` (CA-7.5). O `index.ts` de lá explica a
divisao arquivo por arquivo.

**Um arquivo de fora mudou, e so um:** o barril deste modulo passou a exportar
`autorizacao/fonte-de-papeis.js`. **A interface do modulo composto nao mudou** —
T015 nao acrescenta operacao a `ModuloDeIdentidadeEAcesso`, e isso e decisao, nao
esquecimento: *"perguntar permissao"* e operacao da plataforma, que fica abaixo de
todo contexto, e o que BC-05 acrescenta aqui e leitura de dado. O motivo esta
escrito no proprio `index.ts`, onde o export entra.

**Tres coisas que a decisao faz e que um porte perde sem o teste notar**, as tres
com teste nomeado:

1. **A ordem dos seis passos.** Traduzir, atalho do super administrador, montar o
   mapa, ponto de extensao `user_has_cap`, as duas sinteticas, comparar. ADR-0009
   recusou por escrito a ordem alternativa (*"permitiria a um plugin remover a
   negacao"*), e trocar dois passos de lugar nao produz defeito visivel: produz
   decisao diferente num caso que ninguem testa.
2. **Lista vazia significa PERMITIDO.** Um alvo que a trate como negacao *"tranca
   todo mundo fora do proprio perfil"* (BR-MIGRAR-092).
3. **Caminho de erro FECHA a porta.** `null` e "nao e meu caso", `[]` e
   "permitido" e `['do_not_allow']` e "negado" — tres coisas diferentes, e
   BR-MIGRAR-090 avisa que um alvo com tratamento de erro uniforme degradaria
   para menos garantia **aqui tambem**, abrindo a porta.

**O que T015 nao faz, de proposito:** nao resolve capacidade sobre objeto — os 86
casos de `PERM-3`, o estado anterior do conteudo descartado, o objeto
inexistente, a pagina inicial — que e US-8 / **T017**, dependente desta; nao
declara as quatro capacidades que o legado concede so por ponto de extensao, que
e US-9 / **T019** (o terceiro argumento de `capacidadesDeclaradas` e o encaixe
delas, e ha teste mostrando os dois estados); nao porta os dez atalhos de
nomenclatura de `PERM-6`, que chegam com os casos deles; e **nao** grava papel em
conta nenhuma — atribuir papel e T023.

### 🔴 Dois pontos que T015 encontrou abertos, e NAO resolveu

**1. A forma numerica depreciada de perguntar permissao.** ADR-0001 registra que
`has_cap()` *"ainda aceita numero, com aviso de depreciacao"*: o numero vira
`level_{n}` e e decidido como qualquer capacidade. O **P8** poe superficie
publicada fora do alcance de quem codifica, logo isto **nao** e descarte — e
tambem nao foi construido, porque o conteudo de `level_0` a `level_10` e
exatamente o objeto do conflito REQ-017 contra a resposta 5, e uma das formas de
conferir o descarte, escrita no card, e *"nenhuma decisao de autorizacao compara
nivel numerico"*. Construir aqui seria dar razao a uma das duas partes. Fica
nomeado em `plataforma/autorizacao/decisao-de-capacidade.ts`, com o custo de
construir depois: e traducao de argumento, nao mexe na ordem, e nao muda desenho.

**2. O recorte de rede de `PERM-10`.** No legado, os mesmos `case` que leem as
quatro constantes carregam tambem a perda de arquivo, extensao, identidade, idioma
e HTML bruto do administrador de site em instalacao de rede (BR-MIGRAR-096,
confianca 🟡 — *"migra com aviso para validacao"*). **O pacote nao enumera quais
capacidades esse recorte alcanca**, nenhuma tarefa desta feature o recebe, e
inventar a enumeracao seria inventar dado de analise. Fica nomeado em
`revogacao-por-constante.ts` com a consequencia declarada: enquanto nao entrar,
uma instalacao de **rede** e, nesses nomes, mais aberta que o legado para o
administrador de site. Em site unico — o valor de fabrica da instalacao — nao
muda nada.

E duas conferencias que ficam para o oraculo, as duas marcadas no codigo: o filtro
que separa papel de capacidade olha a **chave** e ignora o valor
(`capacidades-do-ator.ts`), e a leitura estrita de T002 trata *"nao e arranjo"* e
*"arranjo com valor que nao e booleano"* com o mesmo `null`, o que no segundo caso
fecha mais que o legado (`autorizacao/fonte-de-papeis.ts`).

## O que T019 entrega, e so isso

> *o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4
> passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T019

**As quatro capacidades de `PERM-7` nao entraram na matriz: entraram como regra
declarada.** `install_languages`, `resume_plugins`, `resume_themes` e
`view_site_health_checks` continuam fora de todo papel — e tem de continuar, porque
semea-las num papel mudaria o valor gravado em `{site}user_roles`, que a interface
de papeis do produto le e que o cenario de paridade exige identico byte a byte. O
que T019 construiu e o **ponto de concessao de prioridade `1`** que o nucleo do
legado registra, e e dele que elas vem (BR-MIGRAR-093,
`default-filters.php:771`-`:773`).

A entrega esta quase toda do outro lado, em `plataforma/autorizacao/`:
`concessao-por-extensao.ts` (as tres concessoes do nucleo, com o nome publicado de
cada interceptador), o passo 4 de `decisao-de-capacidade.ts` (a ordem: **antes** do
`user_has_cap` de terceiro, que pode retirar o que o nucleo concedeu),
`conferirMatrizDeclarada` em `catalogo-de-capacidades.ts` (CA-9.3) e o campo
`concessoesPorExtensao` do contexto, que e como se descreve a instalacao em que
elas foram removidas do ponto.

Deste lado entrou **so o teste que precisa da matriz de fabrica**:
`autorizacao/us-9-instalacao-de-fabrica.test.ts`, onde CA-9.2 fecha — *"existe ao
menos um ator capaz de retomar uma extensao pausada numa instalacao de fabrica"* —
nos **dois** lados do conflito REQ-017, porque nenhuma das quatro depende de nivel
numerico. Nenhum arquivo de fora mudou e a interface do modulo composto nao mudou.

| capacidade | concedida a quem tem | onde o pacote diz |
|---|---|---|
| `resume_plugins` | `activate_plugins` | UC-36, excecao *"ninguem tem `resume_plugins`"* |
| `resume_themes` | `switch_themes` | UC-32, *"retomar um tema pausado"* |
| `view_site_health_checks` | `install_plugins`, e em rede **so** super administrador | UC-37, linha *Autorizacao* |
| `install_languages` | `update_core`, `install_plugins` ou `install_themes` | ⚠️ o pacote **nao** diz — ver abaixo |

**Tres coisas que um porte perde sem o teste notar**, as tres com teste nomeado:

1. **A concessao SOBREPOE o valor que estava no mapa.** O legado escreve
   `$allcaps['resume_plugins'] = true;` sem olhar o que havia antes, logo um papel
   que **negue** a capacidade a quem tem a de origem nao impede nada. Preencher so
   o que falta produziria um sistema mais fechado que o legado.
2. **O recorte de rede e de uma so das quatro.** O diagnostico do site e negado ao
   administrador de site em rede (UC-37), e retomar extensao **nao** e — o legado
   comenta a razao: *"even in a multisite, regular administrators should be able to
   resume plugins"*.
3. **O curto-circuito de `! is_multisite() || is_super_admin()`.** Fora da rede a
   segunda metade nunca e avaliada, e reproduzir isso nao e zelo: fora da rede
   "super administrador" e *quem tem `delete_users`*, que e outra pergunta de
   permissao — avaliar as duas metades sempre poria a decisao a chamar a si mesma.

### 🔴 Tres pontos que T019 encontrou abertos, e NAO resolveu

**1. A condicao de `install_languages` nao esta no pacote.** Tres das quatro
condicoes estao escritas no caso de uso que depende delas; esta nao esta em
documento algum desta arvore — `permissions.md` §4, que a contaria, nao esta aqui,
e `target_screens.md` lista a capacidade sem dizer de onde ela vem. O que o pacote
da e a **ancora** (BR-MIGRAR-093 aponta `capabilities.php:1309`), e e dela que a
condicao foi lida, com o criterio escrito no comentario do proprio legado. Fica
marcada em `concessao-por-extensao.ts` como enumeracao desta tarefa, que **fecha
contra o oraculo** (`ESC-ORACULO`), e isolada numa lista: se o oraculo discordar, a
correcao e nessa lista e em nenhum outro lugar.

**2. CA-9.4 continua aberto.** O critério exige que *"nenhuma das 93 capacidades
verificadas no codigo fique fora da matriz"*, e **a lista dos 93 nomes nao esta
nesta arvore**. A primeira *Pergunta em aberto* da `spec.md` poe para uma pessoa
decidir se a matriz cresce ate cobri-los ou se o critério se reescreve para as que
tem responsavel — e e o unico critério do pacote sem teste registrado em
`backlog/tests.md`. T019 entregou o mecanismo que fecha a conta no dia em que a
lista existir (`conferirMatrizDeclarada`, que recebe as exigidas por argumento) e
**nao** inventou a lista: inventa-la seria inventar dado de analise. O que **nao**
esta aberto e o que o pacote de fato identifica: as quatro ausentes de `PERM-7`
tem responsavel declarado, e e isso que CA-9.1 pedia.

**3. O `case` de traducao de `install_languages`, que e de outra tarefa.** No
legado a capacidade tambem e tratada no `map_meta_cap`, no mesmo bloco que le as
constantes do dono do servidor: com `DISALLOW_FILE_MODS` definida — e em rede para
quem nao e super administrador — `install_languages`, e `update_languages`, que
nenhum documento deste pacote nomeia, viram `do_not_allow`. A tabela de `PERM-8` em
`revogacao-por-constante.ts` (T015) nao alcanca esses dois nomes, e o recorte de
rede do mesmo bloco e o `PERM-10` que aquele arquivo ja declara como nao portado.
**Consequencia declarada:** hoje, com `DISALLOW_FILE_MODS` definida, quem tem
`update_core` instala traducao neste sistema e nao instalaria no legado — mais
aberto que o legado, em um nome. Nao foi corrigido aqui porque a correcao e na
entrega de outras tarefas, com testes proprios, e porque `update_languages` nao
esta em documento algum desta arvore. Fica nomeado em `concessao-por-extensao.ts`.

## O que T021 entrega, e so isso

> *o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3,
> CA-10.4, CA-10.5 passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T021

| arquivo | o que e |
|---|---|
| `armazenamento/senha-de-aplicacao.ts` | a quinta estrutura dentro de `usermeta`: a **lista** de credenciais, com os sete campos do item e a chave da lista |
| `armazenamento/chaves-e-tabelas.ts` | ganhou `CHAVE_DE_SENHAS_DE_APLICACAO` — `_application_passwords`, **sem prefixo**, como a de sessao |
| `senha-de-aplicacao/autorizacao-de-senha-de-aplicacao.ts` | o atalho de `PERM-6`: as **seis** capacidades resolvem em `edit_user` daquela conta |
| `senha-de-aplicacao/geracao-de-credencial.ts` | os **24 caracteres**, o identificador, o resumo como colaborador e o agrupamento de exibicao |
| `senha-de-aplicacao/erro-de-senha-de-aplicacao.ts` | os codigos e as mensagens das recusas |
| `senha-de-aplicacao/contexto-de-senha-de-aplicacao.ts` | o contexto por requisicao, os dois pontos de extensao e a marca de uso da instalacao |
| `senha-de-aplicacao/emitir-credencial.ts` | a operacao de emitir (passos 1 a 4 de UC-22) |
| `senha-de-aplicacao/revogar-credencial.ts` | a operacao de revogar (fluxo *Revogar uma senha* de UC-22) |
| `senha-de-aplicacao/us-10-credencial-de-aplicacao.test.ts` | os cinco critérios, a ordem dos passos, a ordem dos ganchos e o efeito no banco |

**Esta e a primeira operacao deste modulo que EXIGE capacidade**, e por isso as
duas entraram na interface do modulo composto com a permissao declarada, como o
**P4** cobra: `edit_user` **daquela conta**, que e a linha *Autorizacao* de UC-22
inteira. As quatro operacoes anteriores declaram *"nenhuma capacidade"*; estas duas
declaram a de UC-22, e `modulo.test.ts` cresceu nas duas chaves.

**Tres coisas que a entrega faz e que um porte perde sem o teste notar**, as tres
com teste nomeado:

1. **Lista vazia significa PERMITIDO, e e por ela que o titular existe neste fluxo.**
   O ator de UC-22 e o **assinante**, que de fabrica tem `read` e nada mais: se a
   traducao de `create_app_password` sobre a propria conta devolvesse qualquer
   capacidade, ninguem administraria a propria credencial. O teste afirma a lista
   vazia **antes** de afirmar a emissao, nos dois lados do conflito REQ-017.
2. **A permissao e conferida ANTES de qualquer conferencia de nome.** Trocar a
   ordem transformaria a emissao num oraculo de nomes: quem nao pode editar a conta
   descobriria, pela mensagem, se o nome que tentou ja existe ali.
3. **Revogar nao reindexa a lista, e a credencial seguinte nasce depois do maior.**
   E a chave do arranjo serializado, que o oraculo compara byte a byte. Ver a
   PARADA em `proximaChaveDaLista`.

**O que T021 nao faz, de proposito:** nao autentica com a credencial — e `REQ-012`,
que esta em `do-not-rewrite.md` e **nao** entrou neste pacote (risco 2 do
`plan.md`) —, nao registra o uso (o campo existe e nasce nulo, quem o escreve e
`REQ-012`), nao renomeia credencial, nao apaga **todas** as de uma conta, nao
exige conexao segura (e pre-condicao de rota, ver abaixo) e **nao da escopo nem
prazo a credencial**, que e decisao humana registrada na terceira *Pergunta em
aberto* da `spec.md`.

### 🔴 Cinco pontos que T021 encontrou abertos, e NAO resolveu

**1. A spec de paridade e o caso de uso DISCORDAM sobre o que a credencial
autoriza.** `parity_tests/06-autenticacao-e-sessao.feature`, cenario *"A senha de
aplicacao e credencial de segunda classe, por desenho"*, termina com *"E esse
conjunto e **menor** que o da sessao nas duas"*. UC-22, BR-MIGRAR-026 e
`permissions.md` §8.2 dizem o contrario, com todas as letras: *"autenticar com ela
**nao** reduz as capacidades do usuario"*, *"a senha de aplicacao vale exatamente o
que a conta vale… um programa com a senha de aplicacao de um administrador e um
administrador"*. **Nao e a mesma coisa dita de dois jeitos: e uma asserção de
paridade contra uma regra de negocio.** T021 **nao escolheu** — a instrucao desta
tarefa manda parar e dizer quando a spec e a analise discordam, e a tabela *Nao
negociavel* da constituicao poe mudar regra de `domain.md` fora do alcance de quem
codifica. O ponto em disputa e o **consumo** da credencial, que e `REQ-012` e nao
esta neste pacote, logo nada desta entrega depende da resposta: aqui a credencial e
emitida sem escopo e sem reducao, como as tres fontes de regra mandam. Quem pegar
`REQ-012` **nao pode** comecar antes de isto ser decidido: a asserção do cenario e
a regra de negocio nao podem passar as duas.

**2. A pre-condicao de conexao segura de UC-22 nao foi construida.** A segunda
pre-condicao do caso de uso e *"a conexao e segura, ou a instalacao dispensou o
requisito"*, e no legado quem a cobra e a **camada de rota**. O slot
`framework-http` de `plan.md` esta em aberto e nada nesta arvore sabe se a conexao
e segura. **Consequencia declarada:** hoje a emissao nao a exige, logo neste ponto
o sistema e **mais aberto** que o legado, e fecha quando a borda HTTP existir — sem
alterar arquivo deste modulo. Fica nomeada no cabecalho de
`contexto-de-senha-de-aplicacao.ts`, com o nome do ponto de extensao e o default de
fabrica, para quem montar a borda nao descobrir a pre-condicao depois.

**3. O `case` de `edit_user` e de T023, e dele existe aqui so o primeiro ramo.**
UC-22 lista *"`edit_user` sobre si mesmo devolve lista vazia"*
entre as regras aplicadas, e sem esse ramo o fluxo principal do caso de uso nao
existe — logo ele esta implementado. O resto do `case` (a exigencia de `edit_users`
e, **em rede**, a protecao do super administrador) e US-11 / **T023**.
**Consequencia declarada e coberta por teste:** hoje administrar a credencial de
**outra** conta cai no ramo final da traducao, devolve `edit_user` — nome que papel
algum concede — e e **negado**; este sistema e, nesse ponto, mais **fechado** que o
legado. CA-10.4 continua satisfeito, porque a pergunta feita e literalmente a mesma
de editar aquela conta; o que falta e a resposta dela. T023 a liga **sem** alterar
arquivo desta entrega: basta passar o `case` dela em `casosDeEdicaoDeConta` e na
cadeia do contexto, e ha teste com dublê mostrando as duas pontas funcionando.

**4. O resumo da credencial nao tem algoritmo registrado no pacote, e nao foi
escolhido aqui.** BR-MIGRAR-026 diz *"guardados com hash em metadado"* e para ai; o
slot `hash-de-senha` do `plan.md` descreve o hash da **senha da conta**, e o legado
nao usa o mesmo caminho para credencial gerada de alta entropia — e isso e parte do
que *"de segunda classe"* quer dizer. `ResumoDaSenhaDeAplicacao` entra **obrigatorio
e sem valor padrao**, exatamente como `resumoDaChave` de T009, e a escolha fica
legivel onde for feita. Fecha contra o oraculo (`ESC-ORACULO`).

**5. Tres enumeracoes desta tarefa, nao do pacote**, as tres isoladas em um lugar
so para que a correcao tenha endereco: os **seis nomes** de capacidade (UC-22 e
BR-MIGRAR-092 falam em *"as seis"* e nao nomeiam nenhuma), os **sete campos** do
item gravado (o pacote nomeia quatro, e o valor gravado e comparado byte a byte) e
os **textos de erro** (o pacote nao transcreve nenhum, e vale a regra de
`erro-de-cadastro.ts`: em ingles, porque o `msgid` e a chave do catalogo). As tres
fecham contra o oraculo, que nesta arvore nao existe.

E uma divergencia de contagem, registrada como T003 registrou a dos codigos de
erro da entrada: a tabela *Contratos* do `plan.md` lista **um** erro para emitir e
*"idem"* para revogar; o fluxo do legado emite quatro codigos. T021 implementou os
que o fluxo emite e **nao** escolheu entre o pacote e o legado — ver o cabecalho de
`erro-de-senha-de-aplicacao.ts`. A recusa por permissao, que e o unico erro que a
tabela conta, volta como **motivo** e nao como codigo, porque no legado quem a
emite e a camada de rota.

## O que T023 entrega, e so isso

> *o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3,
> CA-11.4, CA-11.5, CA-11.6, CA-11.7 passam contra o sistema novo*
> — `.specify/specs/001-identidade-e-acesso/tasks.md`, T023

E UC-24 inteiro menos o que pertence a outras features. A entrega esta dividida
pela mesma linha que T015 e T017 seguiram: a **decisao** de capacidade fica em
`plataforma/autorizacao/`, o **dado** e o **fluxo de tela** ficam aqui.

Do lado da plataforma, dois arquivos:

| arquivo | o que e |
|---|---|
| `conta-na-autorizacao.ts` | as **tres** leituras que os `case` de conta fazem, como porta |
| `traducao-de-conta.ts` | os **cinco** `case` de conta de `map_meta_cap()` (`capabilities.php:49`, `:57`, `:70`, `:673`, `:682`) |

Deste lado, a pasta `administracao-de-contas/`, com o `index.ts` explicando
arquivo por arquivo. As cinco operacoes entraram **tambem na interface do modulo
composto**, e a diferenca com T015 e o motivo: ali o que BC-05 acrescentava era
leitura de dado para uma decisao da plataforma; aqui sao cinco operacoes de fluxo,
com escrita, com cascata e com envio de e-mail.

**Sao as primeiras operacoes deste modulo que exigem capacidade**, e cada uma
exige **duas** — a da acao e a da conta alvo, uma a uma (CA-11.1). As seis
anteriores declaram *"nenhuma capacidade"* porque o legado nao exige nenhuma
nelas.

**Seis coisas que um porte perde sem o teste notar**, as seis com teste nomeado:

1. **`edit_user` sobre si mesmo devolve lista VAZIA, e lista vazia e permitido.**
   BR-MIGRAR-092 avisa que tratar lista vazia como negacao *"tranca todo mundo
   fora do proprio perfil"*, e UC-24 diz a consequencia: *"qualquer conta edita o
   proprio perfil, inclusive um assinante"*.
2. **O ator NUNCA tem o proprio papel trocado pelo lote de promocao.** Os dois
   ramos do bloco de si mesmo terminam em `continue` (`users.php:153` e `:157`), e
   `set_role` esta depois deles — o bilhete da tela confirma por extenso: *"Your
   role was not changed."* Muda so o aviso: `promote` quando o papel novo promove,
   `err_admin_role` quando nao.
3. **`set_role` com o papel que a conta ja tem NAO emite comando nenhum**, e
   preserva as capacidades **individuais** — inclusive a negacao explicita de
   ADR-0009. O nivel sai do mapa **fundido**, nao do papel.
4. **A escolha de exclusao e conferida ANTES da permissao** (`users.php:192` vem
   antes de `:199`). Quem agrupa as guardas de permissao no topo — o instinto de
   qualquer um — troca a resposta de uma requisicao.
5. **Opcao de exclusao desconhecida conta como apagada e nao apaga nada**:
   `++$delete_count` esta fora do `switch` interno.
6. **A cascata nao toca comentario.** `target_data_model.md` poe a razao entre os
   tres motivos pelos quais a integridade referencial esta desativada —
   *"comentario orfao e estado normal... de proposito, para preservar o historico
   da discussao"* — e o **P5** cobra o teste que afirma o que **permaneceu
   orfao**.

**Tres arquivos de fora mudaram**, e os tres por adicao:
`armazenamento/conta.ts` ganhou `apagar` (a linha de `users`, e so ela),
`armazenamento/perfil.ts` ganhou `apagarPorId` (a primitiva por **linha**, que e
a que `wp_delete_user()` usa), e `cadastro/atribuicao-de-papel.ts` passou a
reproduzir o ramo `else` de `set_role()` para papel vazio — a nota de 🟢 daquele
arquivo ja dizia que o caso geral era desta tarefa.

### 🔴 O que T023 encontrou aberto, e NAO resolveu

**1. CA-11.2 descreve uma das tres acoes em lote, e a spec nao diz qual.** O
criterio e *"numa acao em lote, uma conta sem permissao e saltada e as demais
prosseguem"*. No legado:

| acao | conta sem permissao | linha |
|---|---|---|
| `doremove` | `$update = 'err_admin_remove'; continue;` — **saltada** | `users.php:509` |
| `promote` | `wp_die( …, 403 )` — **o lote inteiro para** | `users.php:142` |
| `dodelete` | `wp_die( …, 403 )` — **o lote inteiro para** | `users.php:207` |
| `resetpassword` | `wp_die( … )` — **o lote inteiro para** | `users.php:260` |

O que **e** saltado nas outras tres e a **propria conta do ator**, e os bilhetes
da tela confirmam a leitura. Saltar nas quatro tornaria o sistema **mais aberto**
que o legado — um lote parcialmente autorizado passaria a ser parcialmente
aplicado. O **P1** exige decisao humana registrada para divergir e nenhuma
existe, logo T023 reproduziu acao por acao e deixou a redacao para quem decide.
Nomeado no cabecalho de `administracao-de-contas/promover-contas.ts`, com teste
fixando os dois comportamentos.

**2. CA-11.6 e consequencia, nao verificacao — e nao foi transformado em
verificacao.** O criterio e *"ao fim de qualquer operacao continua havendo ao
menos uma conta capaz de promover outras"*. **O legado nao tem contagem alguma**:
o que ele tem sao duas travas de tela — o ator nao troca o proprio papel para um
sem `promote_users`, e o ator nao se apaga —, e UC-24 chama isso de *"a unica
trava contra travar o site e um comentario de uma linha"*. Acrescentar a contagem
seria introduzir numero que o legado nao tem, que o **P6** proibe e que a tabela
*Nao negociavel* poe fora do alcance de quem codifica. Note o que a trava **nao**
protege, e isso tambem esta por teste: nada impede o ator de rebaixar **todos os
outros** administradores.

**3. CA-11.7 inclui "promovido", e o legado nao notifica promocao.** O legado
manda tres mensagens: conta criada (ao administrador do site, e opcionalmente ao
titular), senha trocada e e-mail trocado — as duas ultimas ao endereco
**anterior**, e so quando o valor mudou de fato. `set_role()` dispara tres acoes e
**nenhum** e-mail. UC-24 registra o mesmo achado pelo outro lado: *"🟡 Promover
alguem nao deixa rastro. Nenhuma trilha registra quem mudou o papel de quem, nem
quando."* O passo 6 do proprio caso de uso tambem e mais estreito que o criterio:
*"notifica quem foi criado **ou teve a conta alterada**"*. Acrescentar o aviso
inventaria uma mensagem com um texto que nao existe. Nomeado no cabecalho de
`administracao-de-contas/notificacoes-da-administracao.ts`, com teste fixando a
ausencia.

**4. O comentario de `remove_user` no legado diz "em multisite", e a condicao que
ele comenta nao tem a guarda de rede.** UC-24 repete o comentario na tabela de
excecoes. `capabilities.php:49`-`:54` nao consulta `is_multisite()`, logo fora da
rede remover a propria conta tambem exige ser super administrador — que fora da
rede e *quem tem `delete_users`*. Como `remove_users` nao esta em papel algum fora
da rede, o caso e inalcancavel na pratica, e e por isso que a divergencia nunca
aparece numa tela. Reproduzido o **codigo**, nao o comentario (**P1**), nomeado em
`plataforma/autorizacao/traducao-de-conta.ts` e fechando contra o oraculo.

**5. O bloco de campos de perfil que `edit_user()` grava NAO entrou.** Mesma
lacuna e mesmo precedente de `cadastro/criacao-de-conta.ts`: o pacote nao nomeia
nenhuma dessas chaves de `usermeta`, e inventar nome e valor inventaria bytes
gravados. Nenhum criterio de US-11 as nomeia. Consequencia declarada: o ramo de
validacao *"apelido de exibicao vazio"* (`includes/user.php:162`) fica
inalcancavel neste porte, e esta marcado no lugar certo da ordem, dentro de
`administracao-de-contas/conta-por-administrador.ts`.

**6. Tres escritas de `remove_user_from_blog` ficaram de fora, por escopo de
rede:** `primary_blog`, `source_domain` e a varredura de `get_blogs_of_user()`.
Os cards de rede estao em `do-not-rewrite.md` (`REQ-129` a `REQ-135`) e nenhuma
tarefa deste pacote entrega a tabela de sites. Consequencia declarada em
`administracao-de-contas/remover-contas-do-site.ts`.

**7. A acao `resetpassword` do lote ficou nomeada e nao construida.** Ela nao esta
em UC-24 — nem no fluxo principal, nem na sequencia, nem nas excecoes —, nenhum
criterio de US-11 a nomeia, e o que ela faz por conta e `retrieve_password()`, que
e T009. O custo de constru-ila depois e um laco sobre a operacao que ja existe,
mais dois avisos. Nomeada no `index.ts` da pasta.

## Por que estas tres portas, e nao outras

`target_architecture.md` **AD-08** conta cinco portas no sistema todo — dados,
HTTP, sistema de arquivos, cache de objeto e e-mail. Deste modulo, T001 pede
tres: dados, e-mail e relogio.

- **Dados** e **e-mail** sao duas das cinco de AD-08, e sao dois dos slots de
  tecnologia que `plan.md` lista para esta feature (`persistencia`,
  `envio-de-email`).
- **Relogio** nao esta em AD-08, e `target_architecture.md` nao o menciona em
  lugar nenhum. T001 o pede pelo nome. A tensao esta registrada em
  `portas/porta-de-relogio.ts` e nao foi resolvida por conta propria: o que
  AD-08 recusa e dar porta ao barramento de hooks, a traducao e ao escape, por
  custo de indirecao; o relogio nao substitui sistema externo, e sem ele o **P4**
  ("teste por atestado que fixa prazo e forca, com relogio controlado") e o **P6**
  ("no ultimo instante aceita, um instante depois recusa") nao sao conferiveis.

**As portas sao sincronas.** AD-04 e literal: `adaptadores/` e assincrono,
`contextos/` e `plataforma/` sao **sincronos**, e a I/O e resolvida antes de
entrar no dominio ou exposta por fachada sincrona sobre dado ja carregado. O
motivo nao e gosto: `await` no dominio contamina o chamador e muda a ordem de
emissao do HTML, que AD-03 poe no contrato observavel.

> **Isto cobra algo de T002 e da feature 015.** O slot de persistencia escolhido
> fala protocolo nativo de MySQL, que neste runtime e assincrono. Quem construir
> o adaptador tem de resolver a I/O **antes** de o dominio ser chamado, ou expor
> fachada sincrona — nao tornar a porta uma `Promise`, porque isso desfaz AD-04 e
> AD-03 de uma vez. O slot de isolamento escolhido (processo por requisicao,
> modelo CGI) e o que torna isso viavel, e e o mesmo escopo que no legado vinha
> da morte do processo.

## Onde a autorizacao mora, e por que nao esta aqui

`target_architecture.md`, BC-05, divide em dois:

- **o dado do papel** pertence a este modulo — vive em metadado serializado por
  site, com o identificador do site dentro do nome da chave (BR-MIGRAR-088);
- **a decisao de capacidade** fica em `plataforma/autorizacao/`, porque e
  chamada 1.279 vezes em 224 arquivos e precisa estar abaixo de todo contexto.

E a regra de dependencia 2 proibe `plataforma/` importar `contextos/`. Logo T015
vai precisar de uma costura de ligacao tardia entre a decisao, que fica embaixo,
e o dado do papel, que fica aqui. **Fica declarado, nao construido:** T001 nao
tem entrega de autorizacao.

> **T015 construiu as duas pontas, e a divisao acima e exatamente a que ela
> seguiu.** A costura e a interface `FonteDeAutorizacao`, **declarada embaixo** em
> `plataforma/autorizacao/fonte-de-autorizacao.ts` e **implementada aqui** em
> `autorizacao/fonte-de-papeis.ts` — a unica direcao que a regra de dependencia 2
> permite. Ver *O que T015 entrega* acima.

## O que este modulo nao vai ter, por decisao de outra pessoa

De `do-not-rewrite.md` — escopo recusado, nao trabalho pendente:

| card | o que nao existe |
|---|---|
| `REQ-004` | recusar autenticacao sem revelar se a conta existe — a mensagem continua distinguindo (BR-MIGRAR-110, `ESC-ENUMERACAO`) |
| `REQ-005` | suspensao de acesso por tentativas falhas |
| `REQ-008` | encerrar sessoes quando a senha troca — trocar a senha **nao** revoga nada (BR-MIGRAR-111, `ESC-SESSAO`) |
| `REQ-010` | unicidade de login e e-mail no armazenamento — e conferida em codigo |
| `REQ-012` | autenticar chamada nao interativa por credencial de aplicacao |
| `REQ-160` | limite de taxa — e decisao de implantacao, fora do nucleo (P6) |

E `wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` entram **definidas
e sem nenhum chamador**, como estao hoje: BR-MIGRAR-111 cita a resposta 7 —
*"existir sem ser chamada e parte do que se clona"*.

## O que ninguem decidiu, e que nenhuma tarefa fechada decidiu tampouco

0. **Quantos codigos de erro de entrada sao.** `plan.md` (secao Contratos) e
   BR-MIGRAR-110 dizem **quatro** codigos distintos *"que nomeiam o login ou o
   e-mail tentado"*. A cadeia que os mesmos documentos descrevem tem dois
   autenticadores — por login e por e-mail (UC-19, *"Login por e-mail em lugar do
   login"*) — e os codigos distintos que eles mais a verificacao de spam
   produzem sao sete. T003 **nao escolheu**: implementou os codigos que a cadeia
   emite e deixou a divergencia de contagem registrada em
   `autenticacao/erro-de-autenticacao.ts`, para a conferencia contra o oraculo
   (`ESC-ORACULO`) fechar a conta.
1. **REQ-017 e REQ-018 contra a resposta 5** — a matriz de fabrica e portada com
   61 concessoes ou com 50? A spec registra os dois lados como *"conflito
   registrado, nao resolvido"*, e o risco 1 de `plan.md` avisa que comecar pelo
   lado errado joga fora a tarefa de povoamento e os testes dela. **T002 bateu
   nisso e nao escolheu:** `semearMatrizDeFabrica` exige o lado como argumento,
   sem valor padrao, logo nenhuma composicao roda sem alguem decidir e a escolha
   fica legivel onde foi feita. Os dois lados estao implementados e cobertos por
   teste, e um teste afirma que eles diferem **somente** nas 11 concessoes de
   nivel numerico — e o que torna a decisao barata quando vier. Duas
   consequencias que o card REQ-017 nao menciona e quem decidir precisa ter na
   mao: a chave de metadado `{site}user_level` e derivada dessas capacidades, e a
   definicao de papel e legivel pela interface de papeis do produto, logo remover
   as 11 muda o que um programa de terceiro le. **T015 tambem nao escolheu, e
   provou que nao precisa:** nenhuma decisao de autorizacao olha nivel numerico, e
   os testes da autorizacao rodam identicos nos dois lados.
2. **CA-9.4** exige que nenhuma das 93 capacidades verificadas no codigo fique
   fora da matriz, e `permissions.md` so identifica quatro ausentes. E o unico
   criterio do pacote sem teste registrado. **T015 entregou a conferencia** —
   `plataforma/autorizacao/catalogo-de-capacidades.ts` — e **nao fechou a conta**:
   a lista dos 93 nomes nao esta nesta arvore, e inventa-la seria inventar dado de
   analise. **T019 entregou a verificacao automatizada de CA-9.3**
   (`conferirMatrizDeclarada`) e tambem nao fechou a conta, pela mesma razao: a
   lista continua faltando, e ela e a decisao humana. Ver *O que T019 entrega*.
3. **Escopo da senha de aplicacao** — o legado nao lhe da escopo nem prazo.
   Dar-lhe escopo e divergencia do identico e exige decisao humana registrada
   (P1). **T021 tambem nao escolheu:** a credencial nasce sem escopo e sem prazo,
   como no legado, e a consequencia que `permissions.md` §8.2 registra —
   *"um programa com a senha de aplicacao de um administrador e um
   administrador"* — e reproduzida de proposito. E T021 encontrou, ao lado desta,
   uma pergunta que **ninguem tinha registrado**: a spec de paridade afirma que a
   credencial autoriza **menos** que a sessao, e o caso de uso e o catalogo de
   regras afirmam que autoriza **o mesmo**. Ver o ponto 1 de *O que T021 encontrou
   aberto*.
4. **Qual oraculo vale** se a instalacao executavel de referencia mostrar matriz
   diferente da derivada.

5. **Tres criterios de US-11 dizem mais do que o legado faz** — CA-11.2 (saltar
   contra parar no lote), CA-11.6 (a invariante de quem promove) e CA-11.7
   (notificar quem foi promovido). **T023 nao escolheu:** reproduziu o legado,
   pelo **P1**, e fixou os tres por teste para que ninguem os "conserte" sem
   decisao humana. A explicacao de cada um esta na secao *O que T023 encontrou
   aberto* deste arquivo, e nos cabecalhos de
   `administracao-de-contas/promover-contas.ts` e
   `administracao-de-contas/notificacoes-da-administracao.ts`.

Os quatro primeiros estao em `spec.md`, secao *Perguntas em aberto*; o quinto nao
esta em documento nenhum do pacote, e foi encontrado por T023 ao ler as ancoras
que UC-24 aponta. A tabela *Nao negociavel* da constituicao poe cada um deles
fora do alcance do agente de codificacao.

### O que T005 topou, e nao decidiu

- **Quais credenciais exatamente a saida limpa do navegador.** CA-2.1 fala no
  plural — *"limpa as credenciais guardadas no navegador"* — e **nenhum documento
  deste pacote nomeia um unico cookie**: nem `target_screens.md`, nem
  `target_architecture.md`, nem o catalogo de regras. T005 **nao inventou a
  lista**: a limpeza e um colaborador da borda (`CredenciaisDoNavegador`), que
  recebe o id de quem sai porque ela acontece **antes** de a identidade virar
  anonima. A lista fecha contra o oraculo (`ESC-ORACULO`), junto com a emissao,
  que e de T007.
- **O que o legado faz quando a saida acontece sem token corrente.** A tabela
  *Contratos* de `plan.md` declara o erro **token inexistente** para *"encerrar
  sessao corrente"*; nenhum documento diz se o legado interrompe o fluxo ou
  segue. T005 **nao escolheu**: reproduziu o fluxo que UC-19 descreve — destruir
  o token **e** limpar a credencial — e devolve a ausencia como **valor**
  (`motivo: 'token-inexistente'`), do mesmo jeito que a credencial invalida da
  entrada volta como valor. Assim a divergencia, se houver, aparece no relato em
  vez de desaparecer no codigo. O que **esta** fixado por teste e a diferenca de
  efeito no banco: sem token nenhum comando sai; com token desconhecido o mapa e
  lido e gravado de volta, e quem decide que nada chega ao banco e a gravacao do
  metadado.
- **Os pontos de extensao do fluxo de saida.** O P2 exige inventario versionado
  de ponto de extensao, com nome, argumento e ordem — e **ele nao esta nesta
  arvore**. Os dois ganchos de `saida.ts` sao os que a leitura desta tarefa
  reconhece no fluxo, na ordem em que ela os reconhece, e a ordem esta afirmada
  por teste para que uma mudanca dela nao passe calada. Nome, argumento e posicao
  fecham contra o oraculo — a mesma lacuna que `GanchosDaEntrada` ja registra.


## Como se confere que este modulo tem paridade

`parity_specs.md` fixa criterio **por area** (Decisao 2), e deste modulo saem
tres:

| o que | criterio |
|---|---|
| valor devolvido pelos pontos de filtro | byte a byte no valor |
| efeito de escrita no banco, inclusive o acumulo de token em `usermeta` | efeito no banco |
| as telas de login, redefinicao e registro | caso de uso, mais `@paridade-visual` das telas em modo literal |
| a cascata de apagar conta, e o que fica **orfao** | efeito no banco, com o conjunto exato do que sumiu e do que ficou (**P5**) |

O cenario *"As duas operacoes de encerramento de sessao existem sem caminho de
uso"* de `parity_tests/06-autenticacao-e-sessao.feature` e o que confere a
entrega de T005 nesse ponto, e ele tem tres assercoes, nao uma: existencia,
ausencia de chamador e efeito no banco quando invocadas direto.

O cenario *"A senha de aplicacao e credencial de segunda classe, por desenho"*, do
mesmo arquivo, e o que conferiria a entrega de **T021** — e ele tem quatro
assercoes, das quais **duas** sao desta entrega (o comprimento gerado e o valor
guardado com hash) e duas sao do consumo, que e `REQ-012` e nao esta neste pacote.
🔴 **A ultima delas contradiz UC-22 e BR-MIGRAR-026**, e a contradicao esta
registrada e nao resolvida no ponto 1 de *O que T021 encontrou aberto*: quem pegar
`REQ-012` precisa dela decidida antes de comecar.

As specs de paridade desta feature estao em
`.specify/migration/parity_tests/06-autenticacao-e-sessao.feature`,
`07-autorizacao-por-capacidade.feature` e
`screens/01-login.feature`, `screens/02-recuperacao-de-senha-redefinicao.feature`
e `screens/03-registro-de-usuario.feature`. **Nenhuma delas e executavel hoje:**
o oraculo executavel do legado nao existe nesta arvore
(`oracleAvailable: false`), e levanta-lo e T001 da feature 015.
