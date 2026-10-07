# Modulo de identidade e acesso — BC-05

Esqueleto entregue por **T001** da feature `001-identidade-e-acesso`. Este
arquivo e a leitura obrigatoria de quem pegar T002 em diante: ele diz o que ja
esta decidido, o que esta decidido **em outro lugar**, e o que ninguem decidiu.

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

**Nao ha papel, capacidade nem matriz neste modulo.** T002 povoa a matriz de
fabrica e T015 decide a autorizacao. Ver o conflito aberto abaixo antes de
comecar T002.

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

## O que ninguem decidiu, e que nem T001 nem T003 decidiram tampouco

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
   lado errado joga fora a tarefa de povoamento e os testes dela. **E T002 que
   bate nisso primeiro.**
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
