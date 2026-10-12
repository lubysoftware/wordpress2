# `plataforma/sanitizacao/` — analise e sanitizacao de marcacao

Feature `015-plataforma-transversal`. Tarefas fechadas com nota de entrega neste
arquivo: **T002** (esqueleto: as duas formas declaradas, nenhuma porta, nenhuma
regra). Este arquivo e a leitura obrigatoria de quem pegar **T011** — US-5,
*"reportar o erro de analise de marcacao em lugar de o reconhecer em silencio"* —
e **T012**, os cinco testes do catalogo. Ele diz o que ja esta decidido, o que
esta decidido **em outro lugar**, e o que **ninguem** decidiu.

---

> ## 🔴 PARE AQUI SE A SUA TAREFA E T011
>
> **Sao duas coisas nesta pasta, e o `plan.md` avisa que um projeto novo as
> confunde:** o tokenizador (`wp-includes/html-api/`, 16.590 linhas em 14
> arquivos, **uma das duas raizes** do grafo de dependencia do sistema) e a lista
> de permissao (`wp-includes/kses.php`, 3.159 linhas, **fronteira de
> autorizacao**). O criterio CA-5.3 — *"o conteudo com erro de marcacao continua
> sendo servido, sem ser reescrito"* — e o que proibe trocar o primeiro por um
> analisador de arvore; `P8`/BR-MIGRAR-008 (*"HTML bruto e privilegio, e
> revogavel por constante"*) e o que proibe mexer na segunda.
>
> **US-5 acrescenta relato. Nao muda o que e publicavel, nem o que e servido.**

---

## Por que a pasta esta em `plataforma/` e nao em `utilitarios/`

`target_architecture.md` lista *"parser de HTML"* e *"saneamento"* entre os **6
modulos puros, sem regra de negocio** de `utilitarios/`, e a regra de dependencia
1 permite `contextos/` para `plataforma/` para `utilitarios/`. Logo a pasta
natural do desenho seria `utilitarios/`.

T002 a poe em `plataforma/` por tres razoes, e **nenhuma delas e irreversivel**:

1. **A arvore nao tem `utilitarios/`.** Nenhuma das 15 features tem tarefa que o
   crie, e inventar a camada numa tarefa de esqueleto seria desenho novo numa
   tarefa que declara *"nenhuma regra implementada"*.
2. **A entrega da tarefa nomeia quatro modulos da camada transversal**, e os
   outros tres sao de `plataforma/`. Espalhar a entrega por duas camadas tornaria
   a tarefa mais dificil de conferir sem mudar nada do que se ve.
3. **A metade KSES nao e pura no sentido do desenho.** Ela e fronteira de
   autorizacao: `permissions.md` registra que `editor` tem `unfiltered_html`, e
   quem decide se a filtragem acontece e `kses_init()`
   (`wp-includes/kses.php:2606`, `:2609`). O argumento de que *"saneamento e
   utilitario puro"* vale para `wp_kses()` — que de fato recebe a lista por
   argumento (`:961`) —, nao para a decisao.

**O que isso custa, e por que o custo e zero no criterio que importa:** o teste
de borda da Opcao 3 e *"muda a saida HTTP, o efeito no banco ou o comportamento
de caso de uso?"*. Caminho de pasta nao muda nenhum dos tres, e AD-12 e explicito
— *"todo caminho servido e todo caminho de *drop-in* e preservado byte a byte; a
arvore de fonte e reorganizada livremente"*. Mover a metade pura para
`utilitarios/` quando a camada existir e um `git mv`, e a feature `013` registrou
a mesma escolha pelos mesmos motivos.

## O que ja esta decidido, e onde

| decisao | onde foi tomada |
|---|---|
| as duas metades ficam **separadas** | slot `analise-de-html` do `plan.md`: *"as duas fazem trabalhos diferentes que um projeto novo confundiria"* |
| porte a mao das duas, com a tabela de referencias de caracteres | recomendacao do mesmo slot. A tabela existe no legado: `wp-includes/html-api/html5-named-character-references.php` |
| o tokenizador **nao** vira analisador de arvore | CA-5.3, e a razao medida: ele *"edita a string no lugar"*, e nenhum analisador de arvore reproduz isso sem reescrever `post_content` |
| a lista de permissao chega **por argumento** | e assim no legado: `wp_kses( $content, $allowed_html, $allowed_protocols )` (`kses.php:961`) |
| a posicao e **deslocamento em bytes** | e como o legado marca posicao: `WP_HTML_Span` tem `start` e `length` (`class-wp-html-span.php:33`, `:42`) |
| este modulo **nao tem porta** | AD-08: cinco bordas, e nenhuma delas e esta. Entra texto, sai texto |
| o canal de registro de CA-5.4 chega por argumento | P7: *"nenhuma decisao do sistema pode passar a depender"* do registro. Guardar o canal como campo inverteria isso |
| reportar e permitido; **recusar** nao | P7 (acrescimo de diagnostico sem mudar o fluxo) e CA-5.3 |

## O que esta decidido em outro lugar

- **Quem pode publicar HTML bruto** e `plataforma/autorizacao/`. A capacidade e
  `unfiltered_html`, a constante que a revoga de quem a tem e
  `DISALLOW_UNFILTERED_HTML` (`wp-includes/capabilities.php:597`), e isso e
  `PERM-8` (BR-MIGRAR-094), ja declarado nesta arvore em
  `plataforma/autorizacao/revogacao-por-constante.ts`.
- **A tela que mostra as condicoes ao autor** (CA-5.2) e contrato de tela, e
  nesta arvore tela **entra como dado**: campo, tipo e mensagem, com a montagem
  na borda. Nao se monta HTML aqui.
- **O momento em que a sanitizacao acontece** e a fiacao do barramento —
  `kses_init()` e `kses_init_filters()` (`kses.php:2606`, `:2546`) —, e o
  barramento nao existe nesta arvore: REQ-162 esta em `do-not-rewrite.md`.
  Quem precisar do ponto de extensao o **declara no arquivo que o emitiria**, e
  nao bloqueia por causa dele.
- **A conferencia** e o oraculo de T001, pelo criterio *"valor devolvido por
  hook: byte a byte no valor"* de `parity_specs.md` — que e o criterio de toda a
  familia `pre_kses`/`content_save_pre`.

## O que ninguem decidiu

1. **Qual vocabulario de codigo de condicao.** O legado nao tem **nenhum**: tem
   29 comentarios dizendo que o relato nao existe. A conferencia feita nesta
   tarefa, contra o oraculo:
   `wp-includes/html-api/class-wp-html-processor.php` tem **50** marcadores
   `@todo` (o numero que a regra de negocio de US-5 cita), dos quais **29** sao a
   frase literal *"@todo Indicate a parse error once it's possible"* — uma delas
   em `:2018` —, e *"parse error"* aparece **64** vezes nos arquivos de
   `wp-includes/html-api/`. A referencia natural para nomear as condicoes e a
   especificacao de HTML que o analisador persegue
   (`class-wp-html-processor.php:144`), e a escolha e de T011, com o oraculo na
   mao. O tipo ficou **aberto** para que a escolha nao precise mudar
   `./condicao-de-erro-de-analise.ts`.
2. **Se a condicao de erro aparece em alguma superficie de terceiro.** CA-5.1
   devolve a lista *"junto do resultado"*, e CA-5.2 a mostra ao autor. Nenhum dos
   dois diz se ela entra na resposta da API REST, onde `post_content` ja viaja —
   e aquela area e **byte a byte** (`parity_specs.md`, metrica primaria linha 1).
   Acrescentar campo a uma resposta de contrato de terceiro e mudanca observavel;
   T011 nao decide isso sozinho.
3. **Se a verificacao automatizada de CA-1.6 alcanca esta pasta.** O analisador
   e, hoje, o maior reconhecedor silencioso de erro da arvore. Se a verificacao
   que *"falha quando encontra tratamento de erro sem registro"* valer aqui, ela
   reprova 29 pontos que ninguem autorizou mexer — e esse e o conflito registrado
   em `../registro-de-operacao/README.md`, item 2, e nas *Perguntas em aberto* da
   `spec.md`.

## Onde esta feature nao chegou

T002 entrega **quatro** modulos, que e o que a tarefa nomeia: este, mais
`../dados/`, `../registro-de-operacao/` e `../traducao/`. US-2 (suite de
paridade, **T005**) e US-6 (validacao de instalacao, **T013**) nao ganharam pasta
aqui.
