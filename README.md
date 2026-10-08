# Wordpress2

Porte do núcleo do WordPress 7.1.2 para TypeScript. O produto é o mesmo: um CMS que se
instala no servidor do próprio dono — não SaaS, não biblioteca, não serviço gerenciado — e
que serve, no mesmo processo, três públicos: quem lê o site público, quem opera o painel
administrativo de cerca de 100 telas e quem estende o produto com plugin ou tema. O
terceiro é público de primeira classe, não "usuário avançado": é para ele que existem os
3.373 pontos de extensão, 2.460 deles devolvendo valor.

O Wordpress2 é um sistema **novo, escrito a partir de especificações**. As
especificações saíram da engenharia reversa da árvore do WordPress 7.1.2: 15 features, 136
histórias, 621 critérios de aceite e 301 tarefas, derivadas de 151 cards selecionados num
backlog de 181. Do código PHP nada foi reaproveitado: nem função, nem template, nem
`include`, nem folha de estilo.

O que passou de um para o outro foi mais do que conhecimento de domínio — foi o
**comportamento observável, inclusive onde ele parece defeito**. Esta é a diferença que
governa todo o resto do repositório: o alvo não é modernização, não é redesenho e não é
oportunidade de corrigir o que o legado faz de estranho. Nome de coluna, formato de
serialização, ordem de cascata, mensagem de erro e falha em silêncio se reproduzem. Divergir
exige decisão humana registrada e citada no código que divergiu; existem **exatamente três
divergências autorizadas**, e elas estão nomeadas mais abaixo.

## Como o projeto foi construído

1. **Análise do sistema de origem.** A árvore do WordPress 7.1.2 foi lida inteira — 3.381
   arquivos, **zero deles de teste**. Saíram dela os requisitos (REQ-001 a REQ-178), 47
   casos de uso, a matriz de permissões, o modelo de dados e uma lista de perguntas que só
   uma pessoa podia responder. Nenhum dos 47 casos de uso foi observado em execução: na
   árvore analisada não havia banco, conteúdo, log nem configuração.
2. **Decisão humana.** As perguntas foram respondidas — são **23 respostas** — e viraram os
   12 ADRs de [`.specify/adrs/`](.specify/adrs/) e os 8 princípios de
   [`memory/constitution.md`](memory/constitution.md). Nove das 23 respostas foram sobre uma
   única coisa: preservar o legado contra a intuição de quem lê o backlog. Em todas as nove,
   a escolha foi preservar.
3. **Especificação por feature.** Em [`.specify/specs/`](.specify/specs/), cada feature tem
   `spec.md` (o quê e por quê, com critérios de aceite numerados `US-n/CA-n.m`), `plan.md`
   (como) e `tasks.md` (o que se executa, uma tarefa por commit). A ordem entre as features
   é a ordem das dependências, não a numérica, e está em [`index.md`](index.md).
4. **Implementação guiada por teste, em duas trilhas que não se misturam.** Cada tarefa de
   implementação tem uma suíte `us-N-*.test.ts` que afirma os critérios de aceite dela. Em
   paralelo, uma tarefa `[P]` **transcreve** os casos do catálogo
   [`backlog/tests.md`](backlog/tests.md) — 985 casos com entrada, ação e resultado — numa
   suíte `ut-NNN-*.test.ts`. Caso de catálogo se copia, não se reconstrói.

Cada tarefa roda numa worktree própria (`.worktrees/<hash>-<feature>-tNNN-<tentativa>`) e
entra na main por merge, com **duas tentativas concorrentes**: o contrato de um módulo só
existe depois do merge. Fechar tarefa é um commit que mexe em quatro coisas — os arquivos
novos, o `index.ts` do módulo, o `README.md` do módulo e o checkbox em `tasks.md`.

## O oráculo, e o que ele ainda não é

A referência de comportamento é a árvore do WordPress 7.1.2 (`db_version` 61833). Ela está
**fora deste repositório e não é versionada**: é um checkout do legado que cada máquina
precisa ter ao lado. Os documentos citam `~/Downloads/wordpress`, e esse caminho não é
garantido — confira que ele existe antes de confiar numa âncora.

Hoje o legado se **lê**, não se executa. Por isso todo arquivo de `src/` abre com cabeçalho
que diz de que tarefa ele é, qual US/CA satisfaz e **cita o legado por `arquivo:linha`**
(`wp-includes/post.php:4703`). O número sai do `grep -n` na árvore de referência, e a âncora
se confere antes de afirmar: não se descreve comportamento de memória, e não se declara
lacuna sem ter aberto o arquivo. Vetor de paridade se transcreve do formato — é o que faz
[`src/plataforma/serializacao/conformidade.test.ts`](src/plataforma/serializacao/conformidade.test.ts).

O **oráculo executável** — um ambiente do legado na mesma versão, de pé, para comparação
caso a caso — é a terceira divergência autorizada (resposta 16) e é a tarefa T001 da feature
`015`. Ele não existe. Até existir, a prova de paridade é a leitura mais o teste transcrito.

## Os dois sistemas lado a lado

| | WordPress 7.1.2 (legado) | Wordpress2 |
|---|---|---|
| propósito | CMS instalável no servidor do dono | **o mesmo**: o porte não muda o produto |
| linguagem | PHP | TypeScript, Node >= 22 |
| topologia | um processo, sem fronteira de rede | **o mesmo**, por decisão (AD-01): nenhuma fronteira nova |
| fronteiras internas | nenhuma declarada; função global e `include` | 13 bounded contexts, com regra de dependência verificável |
| infraestrutura | acoplada ao código que a usa | portas e adaptadores em **5 bordas**: dados, HTTP de saída, sistema de arquivos, cache de objeto e e-mail |
| pontos de extensão | 3.373 hooks, 2.460 devolvendo valor | preservados como produto (P2); o barramento fica fora do pacote (AD-08) e cada ponto é declarado no arquivo que o emitiria |
| papéis e capacidades | papel é dado mutável, guardado numa opção; a capacidade é a unidade de autorização | **o mesmo**, por ADR-0001 e P3/P4, com os cinco atestados fora das três camadas |
| esquema | `db_version` 61833, driver MySQL | forma das tabelas e nomes de coluna reproduzidos em `armazenamento/`; nenhum adaptador concreto ainda |
| testes | **zero arquivo de teste** em 3.381 | 1143 testes, todos verdes em ~0,7 s |
| falha silenciosa | comportamento de fato, não documentado | comportamento **declarado**, com teste que o afirma (P7) |
| divergência do observável | — | exatamente três, todas com a resposta humana citada no código (P1) |
| estado | produto completo, em produção no mundo | biblioteca, 55 de 301 tarefas, sem adaptador concreto e sem aplicação para subir |

## O que o legado faz de estranho — e que aqui se reproduz

Esta seção é o inverso do que um README de reescrita costuma trazer. Os pontos abaixo não são
descuido do legado nem dívida a pagar: são **comportamento observável que uma pessoa decidiu
preservar**, com a resposta registrada. Cada um tem teste que o afirma. Mexer em qualquer um
deles sem decisão nova é a revisão recusar o commit.

### Enumeração de conta no login (resposta 6)

A mensagem de erro do login continua distinguindo conta inexistente de senha errada, e isso
permite enumerar contas. É o comportamento do legado, e é o comportamento daqui.

### Trocar a senha não derruba sessão (resposta 7)

Não há revogação. O cookie antigo só deixa de validar porque um fragmento de quatro
caracteres do hash da senha entra na chave do HMAC — e o **registro do token sobrevive e
acumula**. As duas metades são reproduzidas: a invalidação indireta e o acúmulo.

### Atestado de senha de conteúdo (resposta 8)

Cookie de dez dias, sem verificação de idade no servidor e **sem limite de tentativa**. Não
se inventou prazo nem contador: P6 proíbe introduzir número que o legado não tem.

### Apagar mídia é definitivo (resposta 9)

Sem lixeira e sem aviso. Conteúdo tem lixeira com memória e restauração para rascunho
(ADR-0004); mídia não tem nenhuma das duas.

### Pacote sem assinatura verificada é instalado (resposta 11)

O legado instala, e aqui também (ADR-0010). Exigir assinatura verificada está na tabela
*Não negociável* da constituição: não se decide sozinho.

### Rebaixamento para canal sem cifra (resposta 12)

Quando o TLS falha, a chamada externa é repetida em canal sem cifra — em sete endpoints,
inclusive o de checksums. Fechar esse rebaixamento também está na tabela *Não negociável*.

### As três divergências autorizadas

1. **Tempo limite do adaptador de IA** deixa de herdar o default curto de 5 s (resposta 18).
2. **O serviço de reputação externo**, se um dia for reimplementado, envia só o que a
   classificação exige — não todo campo de formulário e todo cabeçalho (resposta 13).
3. **Um ambiente executável do legado na mesma versão** é levantado como oráculo de
   comparação (resposta 16) — a tarefa T001 da feature `015`, ainda aberta.

Fora destas três, divergência sem referência à resposta que a autorizou é recusada na
revisão.

### Conflito aberto não se resolve escolhendo um lado

É o estado de **T019** e **T020** da feature `002`: a US-9 exige aviso ao autor que o caso de
uso UC-07 nega palavra por palavra, e não há decisão humana registrada. O ledger ficou aberto
de propósito, e a parada está escrita em
[`src/contextos/conteudo/portas/porta-de-email.ts`](src/contextos/conteudo/portas/porta-de-email.ts)
e no `README.md` do contexto, § *O que ninguém decidiu*. São 58 perguntas em aberto no
pacote, listadas em [`index.md`](index.md).

## Em números

Medido em 2026-10-08, com `003/T005` fechada.

| | WordPress 7.1.2 (legado) | Wordpress2 |
|---|---|---|
| arquivos | 3.381 | 285 `.ts` em `src/` |
| código de produção | — | 48.870 linhas TypeScript, em 221 arquivos |
| código de teste | **zero arquivo** | 48.687 linhas, em 64 suítes |
| testes executados | nenhum | 1143, 0 falhas, ~0,7 s |
| casos de uso | 47, nenhum observado em execução | 621 critérios de aceite numerados; os das tarefas fechadas têm teste com o nome do critério |
| pontos de extensão | 3.373 hooks (2.460 com retorno) | declarados no arquivo que os emitiria; barramento fora do pacote |
| decisões registradas | não há registro | 23 respostas humanas, 12 ADRs, 8 princípios |
| perguntas em aberto | — | 58 |
| escopo recusado de propósito | — | 30 cards, em [`do-not-rewrite.md`](do-not-rewrite.md) |

Tarefas fechadas: **55 de 301**.

| feature | tarefas |
|---|---|
| `001-identidade-e-acesso` | 24/24 ✅ |
| `002-autoria-e-publicacao` | 22/24 — T019 e T020 paradas por conflito registrado |
| `003-classificacao-do-conteudo` | 5/12 |
| `004`, `005`, `006`, `007` | só o esqueleto (T001) |
| as outras oito | 0 |

## O que este porte ainda não tem

A comparação não é de graça, e vale dizer o que falta:

- **Não há aplicação para subir.** A árvore é biblioteca: sem ponto de entrada e sem nenhum
  adaptador concreto. Toda borda existe só como porta, e os testes usam `porta-falsa.ts`.
- **Nenhuma tecnologia de infraestrutura foi escolhida.** São 17 slots de stack abertos, e
  essa escolha não é do agente de codificação: o leque é pesquisa, quem define é quem
  constrói.
- **O barramento de hooks está fora do pacote.** Os pontos de interceptação são o produto, e
  por isso o barramento não foi especificado junto — cada ponto se declara no arquivo que o
  emitiria, sem bloquear a tarefa.
- **Rede multisite não especifica nada.** A feature `012` existe e está vazia, de propósito.
- **Sem limite de taxa em superfície alguma.** É consequência de P6: número que o legado não
  tem não se inventa.
- **O lado cliente em JavaScript não está aqui.** Não estava na árvore analisada.
- **A regra de dependência nº 3 não é verificada por ferramenta.** Está escrita e respeitada,
  mas hoje só a revisão a cobra — `target_architecture.md` manda gravá-la no build.

## Como rodar

Pré-requisito: Node >= 22. Não há aplicação para subir; o que existe é o portão.

```sh
npm ci                 # ou scripts/preparar.sh — ci, nunca install: a árvore reproduz o lock
npm run typecheck      # tsc --noEmit
npm run build          # tsc → dist/
npm test               # o veredito: build + node --test "dist/**/*.test.js"
```

O runner roda o JS de `dist/`, então um arquivo só — ou um teste só — exige compilar antes:

```sh
npm run build && node --test dist/contextos/conteudo/publicacao/us-1-publicar-conteudo.test.js
node --test --test-name-pattern 'CA-1.4' dist/contextos/conteudo/publicacao/us-1-publicar-conteudo.test.js
```

**`npm test` é o único veredito**, e ele é `tsc` em modo estrito
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`,
`noUnusedLocals`) mais os 1143 testes verdes. Não há lint nem formatter.
[`.github/workflows/verificar.yml`](.github/workflows/verificar.yml) roda o mesmo comando em
`push` e `pull_request`, num job só; `squad.yaml` o declara em `verificar:` porque um agente
já saiu com código 0 deixando dezoito testes vermelhos na main.

Nenhum teste toca banco, rede, relógio real ou navegador. Tudo externo entra por
`porta-falsa.ts`, que **registra comando** em vez de simular banco — é assim que se afirma o
caso em que o legado não emite comando nenhum.

## Mapa do repositório

```
src/plataforma/      núcleo compartilhado (hoje: autorizacao/, serializacao/)
src/contextos/<bc>/  um por bounded context (hoje: 7 dos 13)
  portas/            as interfaces para fora — a única saída do contexto
  armazenamento/     forma das tabelas + porta-falsa.ts, o duplo que os testes usam
  <area>/            uma pasta por área de comportamento, com index.ts de barril
  index.ts           a composição: recebe as portas por argumento e devolve o módulo
  README.md          o que já está decidido, o que está decidido em outro lugar, o que ninguém decidiu
memory/              a constituição: 8 princípios e a tabela Não negociável
.specify/specs/      spec, plano e tarefas de cada feature (001–015)
.specify/adrs/       os 12 ADRs, de 0001 a 0012
.specify/migration/  arquitetura alvo, modelo de dados, specs de paridade
backlog/             o catálogo de 985 casos de teste, com entrada, ação e resultado
_discovery/          gerado pelo agentic-squad; edição à mão chega como diff
```

A **regra de dependência** é o que torna a árvore verificável:

1. `contextos/` → `plataforma/` → `utilitarios/`: permitido.
2. `plataforma/` → `contextos/`: proibido.
3. `contextos/<a>/` → `contextos/<b>/` por `import` no topo do módulo: **proibido sempre,
   sem exceção**. Toda chamada entre contextos é ligação tardia, injetada pelo contexto da
   operação — os contextos não formam um DAG, e esta regra substitui a aciclicidade.
4. `contextos/` ou `plataforma/` → adaptador concreto: proibido. Só pela porta.

Quando um comportamento precisa de outro contexto, ele entra como campo do contexto da
operação (ex.: `ClassificacaoNaPublicacao` em
[`src/contextos/conteudo/publicacao/contexto-de-publicacao.ts`](src/contextos/conteudo/publicacao/contexto-de-publicacao.ts)),
nunca como `import`. Módulo não guarda estado: as portas chegam por argumento e nada é
resolvido no carregamento.

## Para contribuir

Comece pelos três documentos que mandam mais do que o código:

| arquivo | o que é |
|---|---|
| [`memory/constitution.md`](memory/constitution.md) | os 8 princípios (P1–P8) e a tabela **Não negociável**. Releitura obrigatória a cada tarefa |
| [`index.md`](index.md) | ordem de implementação, as 58 perguntas em aberto, ledger de features |
| [`do-not-rewrite.md`](do-not-rewrite.md) | os 30 cards recusados de propósito. **Não é backlog pendente** |

Os princípios, em uma linha cada: **P1** o observável do legado é a especificação; **P2**
ponto de extensão é produto, não acidente de implementação; **P3** a capacidade é a unidade
de autorização, o papel é dado mutável; **P4** a autorização tem três camadas paralelas e
cinco atestados fora delas; **P5** a cascata de apagamento é código e é observável; **P6**
prazo e número do legado se reproduzem, número que o legado não tem não se inventa; **P7**
falha silenciosa do legado é comportamento, observabilidade nova não muda o fluxo; **P8**
nada sai da superfície sem decisão humana.

As convenções que a árvore cobra — nomes em português sem acento, import com extensão `.js`,
cabeçalho com `arquivo:linha` do legado, as duas famílias de suíte, commit em inglês com
prefixo convencional — estão em [`CLAUDE.md`](CLAUDE.md), que é a versão operacional destas
regras para agentes de codificação.
