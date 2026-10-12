# `plataforma/traducao/` — a traducao

Feature `015-plataforma-transversal`. Tarefas fechadas com nota de entrega neste
arquivo: **T002** (esqueleto: a porta de catalogo declarada e nada mais). Este
arquivo e a leitura obrigatoria de quem pegar **T009** — US-4, *"traduzir a
interface a partir de catalogo declarado e atualizavel"* — e **T010**, os seis
testes do catalogo. Ele diz o que ja esta decidido, o que esta decidido **em
outro lugar**, e o que **ninguem** decidiu.

A pasta e `plataforma/traducao/` porque e assim que `target_architecture.md`
nomeia o componente, origem *"fundido — `l10n-e-traducoes`"*, com uma observacao
que vale mais que o nome: *"**nao ganha porta**: 13.335 pontos de entrada de 68
dos 71 modulos"*.

---

> ## 🔴 PARE AQUI SE A SUA TAREFA E T009
>
> **US-4 depende de um card bloqueado, e a dependencia esta declarada na propria
> spec.** A `spec.md` fecha a historia com *"**Depende de:** REQ-016, REQ-161,
> fora desta feature"*, e as *Perguntas em aberto* repetem duas vezes: REQ-161
> (*"separar o dominio da apresentacao, mantendo a traducao fora das regras de
> negocio"*) ficou na coluna `bloqueado`, nao entrou no pacote, e a pergunta
> literal e *"construir sem essa dependencia, ou esperar que ela entre?"*.
> `index.md` carrega as duas linhas na pauta global.
>
> Isso **nao** impede T009 de existir: traduzir a partir de catalogo nao exige a
> separacao. O que a ausencia de REQ-161 decide e **onde as 13.335 chamadas vao
> morar** no sistema novo — e, sem resposta, o risco 1 do `plan.md` se cumpre
> sozinho: *"comecar sem decidir isso espalha a traducao pelo dominio novo
> tambem"*.
>
> E `install_languages` (CA-4.4) nao e trabalho desta pasta: ver *O que esta
> decidido em outro lugar*.

---

## O que ja esta decidido, e onde

| decisao | onde foi tomada |
|---|---|
| a traducao **nao** ganha porta de entrada | AD-08, com a alternativa descartada nomeada: *"porta para traducao e escape — o custo de indirecao nao tem contrapartida nenhuma nessa escala"* |
| o catalogo **vem de arquivo**, e arquivo e uma das cinco bordas | AD-08 (sistema de arquivos). E a unica porta deste modulo |
| a porta devolve **bytes**, nao entradas de catalogo | analisar o formato e regra, nao borda. Slot `traducao` do `plan.md`: *"a metade que importa neste slot nao e ler o arquivo, e avaliar a expressao de plural"* |
| leitor proprio de `.mo` e `.po`, com avaliador de plural restrito | recomendacao do slot `traducao`; a biblioteca do legado e propria (`wp-includes/pomo/`, 6 arquivos) e tem **duas geracoes ativas** (`wp-includes/l10n/`, 5 arquivos) |
| ausencia de catalogo e **caso normal** | CA-4.3 e o legado: `NOOP_Translations` (`wp-includes/l10n.php:1486` a `:1494`), `translate()` que e `return $singular;` (`wp-includes/pomo/translations.php:495`) |
| quatro formas de pedido, nao uma com campos opcionais | CA-4.5, e as quatro entradas do legado: `__()` (`l10n.php:306`), `_x()` (`:409`), `_n()` (`:483`), `_nx()` (`:542`) |
| a interpolacao fica com quem chama | no legado e `sprintf` com marcador posicional **depois** da traducao; a traducao devolve o molde. Ver `./pedido-de-traducao.ts` |
| o modulo e sincrono | AD-04: a fronteira de `await` fica em `adaptadores/` |

## O que esta decidido em outro lugar

- **CA-4.4, a metade da autorizacao, ja esta nesta arvore.**
  `plataforma/autorizacao/concessao-por-extensao.ts` (T019 da feature `001`) ja
  declara que `install_languages` **nao esta em papel algum** e entra por ponto
  de extensao em prioridade `1`, com `CAPACIDADES_QUE_HABILITAM_O_IDIOMA` e
  `PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO`. As ancoras:
  `wp_maybe_grant_install_languages_cap()` em
  `wp-includes/capabilities.php:1309`, registro em
  `wp-includes/default-filters.php:771`, `case` do mapeamento em
  `wp-includes/capabilities.php:644` e `:651`. Regra: `PERM-7`
  (BR-MIGRAR-093). **T009 nao reimplementa isso**, e nao declara capacidade
  nova.
- **O idioma por conta e dado de BC-05.** `get_user_locale()`
  (`wp-includes/l10n.php:94`) le o campo `locale` da conta; quem guarda conta e
  `contextos/identidade-e-acesso/`. A regra de dependencia 3 proibe a ligacao
  horizontal: o idioma chega a T009 por argumento, como
  `ClassificacaoNaPublicacao` chega a `conteudo/publicacao/`.
- **A emissao do texto** e `plataforma/escape/` e as telas. `_e()`
  (`wp-includes/l10n.php:352`) imprime em vez de devolver, e por isso **nao** esta
  entre as quatro formas declaradas aqui — mas a funcao e contrato publico (P8) e
  tem de existir em algum lugar.
- **A conferencia** e o oraculo de T001. E ha uma lacuna de insumo declarada:
  *"os catalogos de traducao nao estao na arvore analisada"* (lacuna L5 de
  `soul.md`, repetida na secao *Migracao de dados* do `plan.md`). Nenhum vetor de
  conteudo de catalogo sai de leitura do legado.

## O que ninguem decidiu

1. **🔴 Se T009 deve esperar REQ-161.** Ver o aviso no topo. A pergunta esta
   aberta em `spec.md` e em `index.md`, com estas palavras: *"construir sem essa
   dependencia, ou esperar que ela entre?"*. Nenhuma tarefa deste pacote a
   responde, e responde-la escolhendo um lado e decidir no lugar de quem decide.
2. **🔴 Quem instala catalogo novo.** CA-4.2 pede catalogo *"atualizavel sem
   alterar o sistema"* e CA-4.4 fala da capacidade de **instalar**. A capacidade
   esta resolvida (acima); o **mecanismo** de instalacao e o de UC-33 (instalar e
   atualizar extensao), que baixa pacote e escreve no disco, e nenhuma tarefa
   desta feature o constroi. Isso toca duas decisoes humanas registradas: a
   resposta 11 (*pacote sem assinatura verificada e instalado*, `A8`) e a
   resposta 12 (*rebaixamento para canal sem cifra*, `ESC-HTTP`), as duas na
   tabela *Nao negociavel*. T009 le catalogo; instalar catalogo e outra tarefa,
   e ela nao existe neste pacote.
3. **A segunda geracao de leitor.** A arvore tem `wp-includes/pomo/` **e**
   `wp-includes/l10n/`, as duas ativas, e `technologies.json` registra isso. Qual
   das duas o sistema novo reproduz — ou as duas, com a convivencia que o legado
   tem — nao esta decidido em documento nenhum deste pacote. P8 pesa do lado de
   *as duas*: nada sai da superficie sem decisao humana.
4. **Onde vive o cache do catalogo carregado.** No legado e o global `$l10n`
   (`wp-includes/l10n.php:1482`), com carga tardia disparada pela primeira
   consulta (`:1483`). Num processo longo-vivo isso e `EXT-CONTEXTO`: cache por
   requisicao, e a arvore ainda **nao tem** `plataforma/contexto/`, que AD-02
   chama de *"pre-requisito de tudo"* e que nenhuma tarefa deste pacote cria.
   T009 passa o que precisa por argumento, ou declara a pendencia — nao inventa
   estado de modulo.

## Onde esta feature nao chegou

T002 entrega **quatro** modulos, que e o que a tarefa nomeia: este, mais
`../dados/`, `../registro-de-operacao/` e `../sanitizacao/`. US-2 (suite de
paridade, **T005**) e US-6 (validacao de instalacao, **T013**) nao ganharam pasta
aqui.
