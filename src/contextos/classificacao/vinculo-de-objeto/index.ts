/**
 * `vinculo-de-objeto/` — classificar conteudo com os termos dos contextos
 * declarados para o seu tipo.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2), e e a
 * parte de UC-05 que escreve na juncao; a separacao entre rotulo e contexto, que
 * e a outra metade do mesmo caso de uso, esta em `../rotulo-e-contexto/` (US-1,
 * T003).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `escopo-de-vinculo-de-objeto.ts` | o escopo por argumento, a colaboracao com BC-01 e as seis ausencias declaradas |
 * | `rotulos-informados.ts` | a lista como ela chega, e onde **CA-2.2** se decide — com a 🔴 analise da capacidade de criar termo |
 * | `caso-de-atribuicao-de-rotulo.ts` | os dois atalhos de `PERM-6` que esta historia cobra: atribuir rotulo e poder de conteudo |
 * | `contagem-de-uso.ts` | **CA-2.3**: uma coluna, tres criterios de calculo, e o adiamento declarado e nao construido |
 * | `substituir-vinculos.ts` | **CA-2.1**: `wp_set_object_terms()`, com os oito passos da sequencia |
 * | `remover-vinculos.ts` | a outra metade de CA-2.1: `wp_remove_object_terms()`, com a degradacao do legado declarada |
 * | `classificar-conteudo.ts` | **CA-2.4** e o portao de CA-2.2: os tres `if` de `wp_insert_post()`, e as tres recusas silenciosas |
 * | `us-2-classificar-conteudo.test.ts` | os quatro criterios, por efeito no banco e por sequencia de comandos |
 *
 * ---
 *
 * # Por que a historia e DUAS camadas, e nao uma
 *
 * No legado a classificacao tem dois niveis, e os portoes estao **todos** no de
 * cima:
 *
 * | camada | funcao | verifica capacidade? | verifica o tipo do objeto? |
 * |---|---|---|---|
 * | de cima | o bloco de `wp_insert_post()` (`wp-includes/post.php:5053`-`:5109`) | **sim**, `assign_terms` por contexto | **sim**, nos dois caminhos antigos |
 * | de baixo | `wp_set_object_terms()` (`wp-includes/taxonomy.php:2851`) | **nao**, e o nucleo a chama sem ator | **nao**, so `taxonomy_exists()` |
 *
 * Esta pasta porta as duas, e separadas: {@link classificarConteudo} e a de cima
 * e {@link substituirVinculosDoObjeto} a de baixo. Fundi-las numa so forcaria uma
 * escolha errada em qualquer direcao — com portao, recusaria a atribuicao que o
 * proprio nucleo faz sem ator (o termo padrao na publicacao, `post.php:5438`); sem
 * portao, CA-2.2 e CA-2.4 nao teriam onde morar.
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), com
 * `@cascata` — que `parity_specs.md` torna obrigatoria em *"exclusao de conteudo e
 * de termo"* e que aqui alcanca a remocao do que a lista nao trouxe — e
 * `@invariante`, obrigatoria em *"todo fluxo cujo aggregate tem invariante"*.
 *
 * ⚠️ **Nao existe `.feature` de classificacao em `parity_tests/`** e o oraculo
 * executavel do legado **nao existe nesta arvore** (`oracleAvailable: false`;
 * levanta-lo e T001 da feature `015-plataforma-transversal`). Logo cada afirmacao
 * desta pasta e **leitura estatica** do legado, com `arquivo:linha` no comentario,
 * e nao comparacao de execucao.
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o termo padrao quando a lista vem vazia, e a reaplicacao na publicacao | **T007**, US-3 |
 * | criar rotulo (`wp_insert_term()`), e com ele a resolucao de rotulo informado **por nome** | **T009**, US-4 — a consequencia esta declarada em `rotulos-informados.ts` |
 * | `term_exists()`, `get_term_by()` e a consulta de termos por filtro | **T009** e a feature 015 (T007) |
 * | a cascata de apagar um rotulo, que devolve o objeto ao termo padrao (`DB-TRG4`) | **T009** e **T011**, US-4 e US-5 |
 * | o adiamento da contagem (`wp_defer_term_counting()`) | declarado e nao construido: ver `contagem-de-uso.ts` |
 * | o cache de objeto, o barramento de pontos de extensao e o catalogo de traducao | REQ-165, REQ-162 e a feature 015 |
 */

export {
  CAPACIDADES_DE_ATRIBUICAO_DE_ROTULO,
  CAPACIDADE_DE_ATRIBUIR_CATEGORIA,
  CAPACIDADE_DE_ATRIBUIR_ETIQUETA,
  CAPACIDADE_DE_EDITAR_CONTEUDO,
  casoDeAtribuicaoDeRotulo,
} from './caso-de-atribuicao-de-rotulo.js';

export {
  classificarConteudo,
  type MotivoDeRecusaSilenciosa,
  type PedidoDeClassificacao,
  type ResultadoDaClassificacao,
} from './classificar-conteudo.js';

export {
  criterioDeContagem,
  ESTADOS_CONTADOS_NO_CRITERIO_DE_CONTEUDO,
  recontarUsoDosRotulos,
  SEPARADOR_DE_TIPO_QUALIFICADO,
  TIPO_DE_OBJETO_DE_ANEXO,
  type CriterioDeContagem,
} from './contagem-de-uso.js';

export type {
  ArmazenamentoNoVinculo,
  ColaboracaoDaClassificacao,
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
  EscopoDeVinculoDeObjeto,
} from './escopo-de-vinculo-de-objeto.js';

export {
  removerVinculosDoObjeto,
  type PedidoDeRemocaoDeVinculo,
  type ResultadoDaRemocaoDeVinculo,
} from './remover-vinculos.js';

export {
  normalizarRotulosDoConteudo,
  normalizarRotulosInformados,
  resolverRotuloInformado,
  type ResolucaoDoRotulo,
  type RotuloInformado,
} from './rotulos-informados.js';

export {
  PRIMEIRA_ORDEM_DO_VINCULO,
  substituirVinculosDoObjeto,
  type PedidoDeVinculo,
  type ResultadoDoVinculo,
} from './substituir-vinculos.js';
