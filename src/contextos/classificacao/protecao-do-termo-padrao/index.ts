/**
 * `protecao-do-termo-padrao/` — impedir a remocao do termo padrao de um
 * contexto.
 *
 * Entrega de **T011** da feature `003-classificacao-do-conteudo` (US-5), e e a
 * **ultima** historia da feature: *"Como dono do site, quero que o termo usado
 * como padrao nao possa ser apagado, para que a regra do termo padrao nunca
 * aponte para o nada"*. E o par de US-3 — la o termo padrao e **aplicado**, aqui
 * ele e **preservado** — e a razao de as duas existirem e uma frase de
 * `BR-MIGRAR-080`: *"sao as duas metades da mesma invariante, uma na escrita e
 * outra na exclusao"*.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `escopo-de-protecao-do-termo-padrao.ts` | a colaboracao dos portoes de item, e por que esta historia **nao** tem escopo proprio |
 * | `termo-padrao-indestrutivel.ts` | **CA-5.1**: o passo 2 de `wp_delete_term()`, o `return 0` **sem ator** (`taxonomy.php:2073`-`:2087`) |
 * | `caso-de-capacidade-sobre-rotulo.ts` | **CA-5.2**: o `case` de `map_meta_cap()` sobre o termo, com `do_not_allow` em `capabilities.php:738`-`:744` (ADR 0009) |
 * | `permissao-sobre-rotulo.ts` | os **tres portoes de item** da tela (`edit-tags.php:114`, `:137`, `:173`), com os `msgid` byte a byte |
 * | `us-5-protecao-do-termo-padrao.test.ts` | os tres criterios, por efeito no banco, por sequencia de comandos e por **ausencia** de comando |
 *
 * ---
 *
 * # SAO DUAS RECUSAS, E ELAS NAO SE SUBSTITUEM
 *
 * O legado protege o termo padrao em **dois** lugares, com **dois** mecanismos, e
 * e a divisao desta pasta em dois arquivos de regra:
 *
 * | mecanismo | onde | tem ator? | alcanca |
 * |---|---|---|---|
 * | `return 0` | dentro de `wp_delete_term()` (`:2077` e `:2086`) | **nao** | **todo** chamador: a tela, a API REST, o XML-RPC, a fila agendada, o lote, uma extensao |
 * | `do_not_allow` | no `case` de `map_meta_cap()` (`:738`-`:744`) | sim | quem pergunta `delete_term` **com o termo em maos**: o portao de item da tela e a API REST |
 *
 * **CA-5.1** (*"recusado, para qualquer ator"*) e o primeiro; **CA-5.2** (*"a
 * recusa vence inclusive o ator de maior poder"*) e o segundo. Quem portar so um
 * dos dois produz um sistema em que o padrao morre por um caminho: sem o primeiro,
 * a acao em lote e a API o apagam (o portao do lote e **plural** e nao consulta o
 * termo — ver a correcao de leitura em `permissao-sobre-rotulo.ts`); sem o
 * segundo, a tela oferece o botao e o super administrador o aciona.
 *
 * # CA-5.3 E UMA LEITURA, E NAO UMA ESCRITA
 *
 * *"Trocar qual termo e o padrao e permitido, e so entao o anterior pode ser
 * apagado"*. **Nenhuma funcao de termo do legado grava a opcao do termo padrao**:
 * quem troca `default_category` e a tela de escrita das opcoes, e quem grava
 * `default_term_{nome}` e `register_taxonomy()` (`taxonomy.php:543`), quando um
 * contexto declara `default_term`. Declarar aqui uma escrita de opcao seria
 * inventar superficie, e `plataforma/opcoes/` **nao existe nesta arvore** (o bloco
 * 🔴 de `../termo-padrao/escopo-de-termo-padrao.ts` tem as cinco razoes).
 *
 * O que esta pasta entrega de CA-5.3 e o **efeito** dele, e ele e verificavel:
 * as duas recusas leem a opcao **a cada chamada**, por ligacao tardia, e nenhuma
 * guarda estado. Assim que o padrao aponta para outro rotulo, o anterior passa a
 * ser apagavel — pela tela e pela funcao — e o novo passa a ser indestrutivel. E
 * o que os testes de CA-5.3 afirmam, com a mesma opcao devolvendo outro valor.
 *
 * # Como se confere que esta pasta tem paridade
 *
 * `parity_specs.md` fixa criterio **por area** (Decisao 2), e desta pasta saem
 * tres linhas:
 *
 * | o que | criterio |
 * |---|---|
 * | a recusa da exclusao | **efeito no banco** com `@cascata` — a tag e **obrigatoria** em *"exclusao de conteudo e de termo"*, e aqui o efeito e a **ausencia** de comando |
 * | *"o termo padrao da taxonomia continua existindo"* (UC-08, *Pos-condicoes*) | `@invariante`, obrigatoria em *"todo fluxo cujo aggregate tem invariante"* |
 * | os tres portoes de item | `@paridade-contrato-de-tela` — `SCR-044 lista-de-termos` esta entre as 99 telas em modo modernizado, e e marcada como **tela critica** |
 *
 * ⚠️ **Nao existe `.feature` de classificacao em `parity_tests/`**, o oraculo
 * **executavel** do legado nao existe nesta arvore (`oracleAvailable: false`;
 * levanta-lo e T001 da feature `015`) e, nesta arvore de trabalho, **a instalacao
 * do legado tambem nao esta no disco** — nao ha `wp-includes/capabilities.php`,
 * `wp-includes/taxonomy.php` nem `wp-admin/edit-tags.php` para reconferir ancora.
 * Logo cada afirmacao desta pasta vem do pacote ou de transcricao **merged**, e
 * nunca de memoria. As fontes, uma por uma:
 *
 * | fonte | o que dela veio |
 * |---|---|
 * | `spec.md` US-5 | os tres criterios e as duas regras de negocio |
 * | `plan.md`, tabela *Contratos* | a linha *"apagar rotulo (...) | rotulo e o padrao do contexto, e a recusa vence inclusive o ator de maior poder"* |
 * | `UC-08` | as duas excecoes, as pos-condicoes e o nome **plural** da capacidade do lote |
 * | `ADR 0009` | o mecanismo inteiro: a pseudocapacidade que ninguem tem, a ordem contra o super admin, e `:738`-`:744` na familia *Protecao de objeto* |
 * | `BR-MIGRAR-091` (`PERM-5`) | *"o termo padrao da taxonomia e indestrutivel"*, com a ancora `capabilities.php:738` |
 * | `BR-MIGRAR-092` (`PERM-6`) | o atalho de nomenclatura em que a recursao do `case` aterra (`:749`-`:754`, por T009) |
 * | `target_screens.md`, `SCR-044` | os tres `msgid`, com a linha de cada um, e a contagem de checagens que decide o nome do portao do lote |
 * | T002, T003, T005, T007, T009 e T015 da feature `001`, **merged** | as ancoras do passo 2, a leitura fundida do termo, a chave da opcao, os cinco nomes e a ordem dos sete passos da decisao |
 *
 * **O que o pacote nao especifica ficou marcado com 🔴 e tem teste**, e sao tres,
 * todos no cabecalho de `caso-de-capacidade-sobre-rotulo.ts`: qual chave de opcao
 * o `case` le, se ele tambem exige `default_term` declarado, e o terceiro rotulo
 * do `case` (`assign_term`), que **nenhum documento do pacote nomeia**.
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | a **escrita** da opcao do termo padrao (CA-5.3) | `plataforma/opcoes/` e a tela de escrita das opcoes; e `register_taxonomy()` para `default_term` |
 * | *"You attempted to edit an item that does not exist"* (`:160`) e o redirecionamento de `:163` | **BC-10**, com `SCR-045` |
 * | o HTML da recusa, a resposta HTTP e o `nonce` das seis acoes | **BC-10** (`plataforma/telas`) e `SCR-112` |
 * | os cinco casos `UT-037-1` a `UT-037-5` de `backlog/tests.md` | **T012**, que roda em paralelo com esta tarefa |
 * | o barramento que dispararia os pontos de extensao da decisao | `REQ-162`, em `do-not-rewrite.md` |
 */

export type { ColaboracaoDaProtecaoDoTermoPadrao } from './escopo-de-protecao-do-termo-padrao.js';

export {
  RECUSA_DO_TERMO_PADRAO,
  protecaoDoTermoPadrao,
  type ProtecaoDoTermoPadrao,
} from './termo-padrao-indestrutivel.js';

export {
  CAPACIDADES_SOBRE_O_ROTULO,
  CAPACIDADE_DE_APAGAR_O_ROTULO,
  CAPACIDADE_DE_EDITAR_O_ROTULO,
  casoDeCapacidadeSobreRotulo,
  casosDaCapacidadeSobreRotulo,
} from './caso-de-capacidade-sobre-rotulo.js';

export {
  MENSAGENS_DOS_PORTOES_DE_ITEM,
  permissaoDeApagarRotulo,
  permissaoDeApagarRotulosEmLote,
  permissaoDeEditarRotulo,
  type MotivoDaRecusaSobreORotulo,
  type RecusaSobreORotulo,
  type ResultadoSobreORotulo,
} from './permissao-sobre-rotulo.js';
