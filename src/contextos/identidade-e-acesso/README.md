# Modulo de identidade e acesso — BC-05

Feature `001-identidade-e-acesso`. Tarefas fechadas: **T001** (esqueleto e
portas) e **T002** (forma de armazenamento). Este arquivo e a leitura
obrigatoria de quem pegar T003 em diante: ele diz o que ja esta decidido, o que
esta decidido **em outro lugar**, e o que ninguem decidiu.

> 🔴 **Antes de qualquer coisa, se a sua tarefa toca a matriz de papeis:** o
> conflito entre `REQ-017` e a resposta 5 **continua aberto**, T002 esbarrou
> nele e **nao o resolveu**. O que T002 fez foi isolar a decisao num argumento
> obrigatorio sem valor padrao, com os dois lados implementados e testados. A
> explicacao inteira esta em `armazenamento/matriz-de-fabrica.ts` e o resumo
> esta na secao *O que ninguem decidiu* deste arquivo.

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

## O que ninguem decidiu, e que T001 nao decidiu tampouco

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
   as 11 muda o que um programa de terceiro le.
2. **CA-9.4** exige que nenhuma das 93 capacidades verificadas no codigo fique
   fora da matriz, e `permissions.md` so identifica quatro ausentes. E o unico
   criterio do pacote sem teste registrado.
3. **Escopo da senha de aplicacao** — o legado nao lhe da escopo nem prazo.
   Dar-lhe escopo e divergencia do identico e exige decisao humana registrada
   (P1).
4. **Qual oraculo vale** se a instalacao executavel de referencia mostrar matriz
   diferente da derivada.

Os quatro estao em `spec.md`, secao *Perguntas em aberto*. A tabela *Nao
negociavel* da constituicao poe cada um deles fora do alcance do agente de
codificacao.

## Como se confere que este modulo tem paridade

`parity_specs.md` fixa criterio **por area** (Decisao 2), e deste modulo saem
tres:

| o que | criterio |
|---|---|
| valor devolvido pelos pontos de filtro | byte a byte no valor |
| efeito de escrita no banco, inclusive o acumulo de token em `usermeta` | efeito no banco |
| as telas de login, redefinicao e registro | caso de uso, mais `@paridade-visual` das telas em modo literal |

As specs de paridade desta feature estao em
`.specify/migration/parity_tests/06-autenticacao-e-sessao.feature`,
`07-autorizacao-por-capacidade.feature` e
`screens/01-login.feature`, `screens/02-recuperacao-de-senha-redefinicao.feature`
e `screens/03-registro-de-usuario.feature`. **Nenhuma delas e executavel hoje:**
o oraculo executavel do legado nao existe nesta arvore
(`oracleAvailable: false`), e levanta-lo e T001 da feature 015.
