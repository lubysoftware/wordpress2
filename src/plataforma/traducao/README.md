# `plataforma/traducao/` — a traducao

Feature `015-plataforma-transversal`. Tarefas fechadas com nota de entrega neste
arquivo: **T002** (esqueleto: a porta de catalogo declarada e nada mais) e
**T009** (US-4, *"traduzir a interface a partir de catalogo declarado e
atualizavel"*, CA-4.1 a CA-4.5). Este arquivo e a leitura obrigatoria de quem
pegar **T010**, os seis testes do catalogo (UT-166-1 a UT-166-6). Ele diz o que
ja esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem**
decidiu.

A pasta e `plataforma/traducao/` porque e assim que `target_architecture.md`
nomeia o componente, origem *"fundido — `l10n-e-traducoes`"*, com uma observacao
que vale mais que o nome: *"**nao ganha porta**: 13.335 pontos de entrada de 68
dos 71 modulos"*.

---

> ## 🔴 T009 construiu o tradutor, e NAO respondeu a pergunta de REQ-161
>
> **US-4 depende de um card bloqueado, e a dependencia esta declarada na propria
> spec.** A `spec.md` fecha a historia com *"**Depende de:** REQ-016, REQ-161,
> fora desta feature"*. REQ-016 e a US-9 da feature `001`, fechada. REQ-161
> (*"separar o dominio da apresentacao, mantendo a traducao fora das regras de
> negocio"*) ficou na coluna `bloqueado`, nao entrou no pacote, e a pergunta
> literal das *Perguntas em aberto* e *"construir sem essa dependencia, ou
> esperar que ela entre?"*.
>
> T009 construiu, e o motivo e este: traduzir a partir de catalogo nao exige a
> separacao — o tradutor e o mesmo dos dois lados da resposta. O que a ausencia de
> REQ-161 decide e **onde as 13.335 chamadas vao morar** no sistema novo, e isso
> esta intocado: o tradutor mora em `plataforma/traducao/`, onde
> `target_architecture.md` o poe, e **nenhum contexto passou a chama-lo por causa
> desta tarefa**. Quem ligar o tradutor a um contexto de dominio e quem responde
> a pergunta — e o risco 1 do `plan.md` vale para essa tarefa, nao para esta:
> *"comecar sem decidir isso espalha a traducao pelo dominio novo tambem"*.

---

## O que T009 entregou

| arquivo | o que e | criterio | legado |
|---|---|---|---|
| `idioma.ts` | o idioma da instalacao, da conta e da requisicao | CA-4.1 | `get_locale()` (`wp-includes/l10n.php:30`), `get_user_locale()` (`:94`), `determine_locale()` (`:124`), `sanitize_locale_name()` (`wp-includes/formatting.php:2468`) |
| `catalogo-mo.ts` | o leitor de `.mo`, dos bytes as entradas | CA-4.2 | `WP_Translation_File_MO::parse_file()` (`wp-includes/l10n/class-wp-translation-file-mo.php:90`) |
| `expressao-de-plural.ts` | o avaliador de plural restrito | CA-4.5 | `Plural_Forms` (`wp-includes/pomo/plural-forms.php:99`, `:261`), `get_plural_form()` (`wp-includes/l10n/class-wp-translation-file.php:217`) |
| `tradutor.ts` | o tradutor de uma requisicao, as quatro formas e os oito pontos de filtro | CA-4.2, CA-4.3, CA-4.5 | `translate()` (`l10n.php:194`), `_x()` (`:409`), `_n()` (`:483`), `_nx()` (`:542`), `NOOP_Translations` (`pomo/translations.php:418`), `WP_Translation_Controller` (`l10n/class-wp-translation-controller.php:263`, `:297`) |
| `instalacao-de-catalogo.ts` | os dois portoes do painel para instalar catalogo novo | CA-4.4 | `current_user_can( 'install_languages' )` em `wp-admin/options.php:307` e, com `wp_can_install_language_pack()`, em seis chamadas (ver o arquivo) |
| `us-4-traduzir-a-interface.test.ts` | um bloco por criterio | CA-4.1 a CA-4.5 | — |

O modulo ganhou uma operacao: `criarTradutor(contexto)`, que devolve o tradutor
de **uma** requisicao, com o idioma dela e o cache de catalogo dela.

Fatos do legado que a suite fixa e que um porte mais "arrumado" perderia:

- **o idioma da conta so vale no painel** (`determine_locale()`,
  `l10n.php:149-153`); no site publico, mesmo logado, vale o da instalacao;
- **a opcao `WPLANG` gravada vence a constante `WPLANG`**, e opcao gravada vazia
  sobrescreve a constante e cai em `en_US` (`l10n.php:43-71`);
- **zero e singular em pt_BR** e plural no ingles: a forma e do catalogo, e sem
  catalogo vale a regra do ingles (`1 === (int) $count`,
  `pomo/translations.php:533`);
- **`;\s+plural`** exige espaco depois do ponto e virgula no cabecalho
  `Plural-Forms` (`class-wp-translation-file.php:251`); sem ele, `n != 1`;
- **`==` e `!=` do avaliador sao estritos**, e `<` entre booleano e inteiro
  compara como booleano (`plural-forms.php:296-330`);
- **expressao que analisa mas nao avalia** (modulo por zero, sobra na pilha) e
  erro fatal no legado, fora de qualquer captura: aqui lanca
  `ErroNaAvaliacaoDoPlural`, e ninguem a engole.

## O que ja esta decidido, e onde

| decisao | onde foi tomada |
|---|---|
| a traducao **nao** ganha porta de entrada | AD-08, com a alternativa descartada nomeada: *"porta para traducao e escape — o custo de indirecao nao tem contrapartida nenhuma nessa escala"* |
| o catalogo **vem de arquivo**, e arquivo e uma das cinco bordas | AD-08 (sistema de arquivos). E a unica porta deste modulo |
| a porta devolve **bytes**, nao entradas de catalogo | analisar o formato e regra, nao borda. Slot `traducao` do `plan.md`: *"a metade que importa neste slot nao e ler o arquivo, e avaliar a expressao de plural"* |
| leitor proprio de `.mo`, com avaliador de plural restrito | recomendacao do slot `traducao`; T009 portou o leitor da segunda geracao, que e o do caminho de execucao (ver a pergunta 3 abaixo) |
| o catalogo e comparado **byte a byte** | o legado nao decodifica: `./catalogo-mo.ts` le como cadeia de bytes e so converte na borda do tradutor |
| ausencia de catalogo e **caso normal** | CA-4.3 e o legado: `NOOP_Translations` (`wp-includes/l10n.php:1486` a `:1494`), `translate()` que e `return $singular;` (`wp-includes/pomo/translations.php:495`) |
| quatro formas de pedido, nao uma com campos opcionais | CA-4.5, e as quatro entradas do legado: `__()` (`l10n.php:306`), `_x()` (`:409`), `_n()` (`:483`), `_nx()` (`:542`) |
| a interpolacao fica com quem chama | no legado e `sprintf` com marcador posicional **depois** da traducao; a traducao devolve o molde. Ver `./pedido-de-traducao.ts` |
| o cache do catalogo carregado e **por requisicao** | e o tradutor: `criarTradutor` devolve um objeto novo, e o dominio sem catalogo fica marcado nele como no `$l10n` (`l10n.php:1492`). Fecha a antiga pergunta 4 sem estado de modulo e sem `plataforma/contexto/` |
| o modulo e sincrono | AD-04: a fronteira de `await` fica em `adaptadores/` |

## O que esta decidido em outro lugar

- **CA-4.4, a metade da matriz.**
  `plataforma/autorizacao/concessao-por-extensao.ts` (T019 da feature `001`) ja
  declara que `install_languages` **nao esta em papel algum** e entra por ponto
  de extensao em prioridade `1`, com `CAPACIDADES_QUE_HABILITAM_O_IDIOMA` e
  `PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO`. As ancoras:
  `wp_maybe_grant_install_languages_cap()` em
  `wp-includes/capabilities.php:1309`, registro em
  `wp-includes/default-filters.php:771`, `case` do mapeamento em
  `wp-includes/capabilities.php:644` e `:651`. Regra: `PERM-7`
  (BR-MIGRAR-093). T009 **nao** reimplementou isso: o portao pergunta a
  capacidade por ligacao tardia, e o teste de CA-4.4 confere que o nome e o que a
  matriz concede.
- **O idioma por conta e dado de BC-05.** `get_user_locale()`
  (`wp-includes/l10n.php:94`) le o campo `locale` da conta; quem guarda conta e
  `contextos/identidade-e-acesso/`. A regra de dependencia 3 proibe a ligacao
  horizontal: o idioma chega por argumento (`ContaNoIdioma`, e as funcoes de
  `FontesDoIdiomaDaRequisicao`).
- **A emissao do texto** e `plataforma/escape/` e as telas. `_e()`
  (`wp-includes/l10n.php:352`) imprime em vez de devolver, e por isso **nao** esta
  entre as quatro formas declaradas aqui — mas a funcao e contrato publico (P8) e
  tem de existir em algum lugar.
- **A ordem de carga do catalogo do nucleo** e do arranque. O legado carrega
  `'default'` em `wp-settings.php:712` e os outros dominios sob demanda
  (`_load_textdomain_just_in_time()`, `l10n.php:1423`, que recusa `'default'`). O
  tradutor le todo dominio no primeiro pedido; o texto devolvido e o mesmo, e a
  ordem do arranque nao e desta pasta.
- **A conferencia** e o oraculo de T001. E ha uma lacuna de insumo declarada:
  *"os catalogos de traducao nao estao na arvore analisada"* (lacuna L5 de
  `soul.md`, repetida na secao *Migracao de dados* do `plan.md`). Os catalogos da
  suite de T009 sao montados no layout de `WP_Translation_File_MO::export()`;
  nenhum vetor de conteudo de catalogo real sai de leitura do legado.

## O que ninguem decidiu

1. **🔴 Onde o tradutor e chamado (REQ-161).** Ver o aviso no topo. A pergunta
   continua aberta em `spec.md` e em `index.md`, com estas palavras: *"construir
   sem essa dependencia, ou esperar que ela entre?"*. T009 construiu o tradutor e
   nao ligou nenhum contexto a ele.
2. **🔴 Quem instala catalogo novo.** CA-4.2 pede catalogo *"atualizavel sem
   alterar o sistema"* e CA-4.4 fala da capacidade de **instalar**. Os portoes
   estao em `./instalacao-de-catalogo.ts`; o **mecanismo** de instalacao e
   `wp_download_language_pack()` e o `Language_Pack_Upgrader`, o de UC-33, que
   baixa pacote e escreve no disco, e nenhuma tarefa desta feature o constroi.
   Isso toca duas decisoes humanas registradas: a resposta 11 (*pacote sem
   assinatura verificada e instalado*, `A8`) e a resposta 12 (*rebaixamento para
   canal sem cifra*, `ESC-HTTP`), as duas na tabela *Nao negociavel*.
3. **A segunda geracao de leitor, e o formato `.l10n.php`.** A arvore tem
   `wp-includes/pomo/` **e** `wp-includes/l10n/`, as duas ativas. T009 portou o
   leitor da segunda (`WP_Translation_File_MO`), porque e o que
   `load_textdomain()` usa (`l10n.php:801`); a primeira continua sem porte, e P8
   pesa do lado de *as duas*. E a segunda geracao **prefere** `.l10n.php` a `.mo`
   (`translation_file_format`, default `'php'`, `l10n.php:816-827`): o
   `.l10n.php` e codigo PHP que devolve um arranjo, com as mesmas entradas. A
   porta entrega bytes de `.mo`; ler `.l10n.php` exigiria interpretar PHP, e
   nenhum documento deste pacote diz se o sistema novo le, converte ou ignora
   esse formato.
4. **🔴 O instalador baixa catalogo sem capacidade.** `wp-admin/install.php:374`
   e `wp-admin/setup-config.php:148` chamam `wp_download_language_pack()` sem
   perguntar capacidade — nao ha conta ainda. CA-4.4, ao pe da letra (*"a
   instalacao de catalogo novo exige a capacidade declarada"*), e mais largo que
   o legado. T009 seguiu o legado: os portoes valem para as chamadas do painel, e
   quem construir o instalador (US-6, UC-43) **nao** os aplica la. Se o criterio
   tiver querido fechar o instalador, isso e divergencia que precisa de resposta
   registrada (P1), e ela nao existe.
5. **Um catalogo por dominio e idioma.** A porta de T002 le *um* arquivo por par
   dominio/idioma. O legado aceita varios: cada `load_textdomain()` para o mesmo
   dominio acrescenta um arquivo (`loaded_translations[ $locale ][ $textdomain ][]`,
   `class-wp-translation-controller.php:141`), e a busca percorre todos na ordem de
   carga. Uma extensao que carrega o proprio catalogo **e** recebe o de
   `WP_LANG_DIR` usa as duas fontes. Quem precisar disso muda a assinatura da
   porta — o que e decisao de contrato, e nao foi tomada aqui.

## Onde esta feature nao chegou

T002 entrega **quatro** modulos, que e o que a tarefa nomeia: este, mais
`../dados/`, `../registro-de-operacao/` e `../sanitizacao/`. US-2 (suite de
paridade, **T005**) e US-6 (validacao de instalacao, **T013**) nao ganharam pasta
aqui.
