/**
 * `termo-padrao/` — aplicar o termo padrao do contexto quando nenhum termo e
 * informado.
 *
 * Entrega de **T007** da feature `003-classificacao-do-conteudo` (US-3), e e a
 * regra `P3` / `BR-MIGRAR-003` inteira do lado da classificacao: *"**Post do tipo
 * `post` sempre tem categoria.** Sem categoria e fora de `auto-draft`, recebe
 * `default_category`; na publicacao a regra se repete para toda taxonomia com
 * termo padrao"*.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `chave-do-termo-padrao.ts` | as duas chaves de opcao, os tres valores do legado que decidem a regra, e por que `category` e excecao **por nome** |
 * | `escopo-de-termo-padrao.ts` | a leitura da opcao por ligacao tardia, e o 🔴 bloco que explica por que ela **nao** virou porta |
 * | `termo-padrao-na-gravacao.ts` | **CA-3.1**, **CA-3.3** e **CA-3.4**: os dois caminhos da gravacao, com as duas portas de escrita e o 🔴 limite do oraculo |
 * | `classificacao-na-publicacao.ts` | **CA-3.2**: os quatro metodos que BC-01 declarou e que este modulo tinha de implementar |
 * | `us-3-termo-padrao.test.ts` | os quatro criterios, por efeito no banco, por sequencia de comandos e por **ausencia** de comando |
 *
 * ---
 *
 * # A HISTORIA E DOIS CAMINHOS COM MECANISMOS DIFERENTES
 *
 * | | gravacao (`post.php:4719` e `:5062`-`:5087`) | publicacao (`:5419`-`:5439`) |
 * |---|---|---|
 * | quem tem o laco | **esta pasta** | **BC-01**, merged em T003 da feature `002` |
 * | o que esta pasta entrega | o laco e as duas escritas | os quatro metodos que o laco de BC-01 chama |
 * | cobra capacidade? | **sim** no mapa de contextos (`assign_terms`, `:5105`), **nao** na categoria | **nao**, em nenhum: o nucleo o chama sem ator |
 * | cobra o tipo de objeto (CA-2.4)? | **sim** nas duas portas, e na **escrita** (`:5053`), nao na decisao | nao: o laco de BC-01 ja itera os contextos do tipo |
 * | alcanca os oito do nucleo? | so `category`, e por igualdade de cadeia com `post` | so `category`, pelo ramo 1 que a trata por nome |
 *
 * ⚠️ **A linha da capacidade e a que explica por que CA-3.2 existe:** o termo
 * padrao de um contexto que nao e `category` passa pelo portao de `assign_terms`
 * na gravacao, logo um ator sem ela grava conteudo sem o padrao — e o laco da
 * publicacao, que roda sem ator, e o que apanha o caso depois.
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), com
 * `@invariante` — que `parity_specs.md` torna obrigatoria em *"todo fluxo cujo
 * aggregate tem invariante"*, e **CA-3.4 e uma invariante**. O cenario de
 * `PT-002` que cobre esta regra e literal: *"Dado um conteudo do tipo padrao sem
 * nenhum termo de categoria, fora de rascunho automatico / Quando ele e gravado /
 * Entao as duas metades vinculam a categoria padrao / E na publicacao a regra se
 * repete para toda taxonomia que tenha termo padrao / E o vinculo gravado e o
 * mesmo nas duas"*
 * (`.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`).
 *
 * 🔴 **E esse cenario nao e executavel hoje, nem comparavel.** O oraculo
 * executavel do legado nao existe nesta arvore (`oracleAvailable: false`;
 * levanta-lo e T001 da feature `015`) e, nesta arvore de trabalho, **a instalacao
 * do legado tambem nao esta no disco** — nao ha `wp-includes/post.php` para
 * reconferir ancora, ao contrario do que o `README.md` deste modulo afirma. O que
 * T007 pode afirmar, e afirma, e a regra como o pacote a especifica mais a
 * transcricao merged do laco da publicacao; os dois pontos que ficam para quem
 * tiver o oraculo estao no bloco 🔴 de `termo-padrao-na-gravacao.ts`.
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | criar o rotulo padrao na instalacao | o instalador (`plan.md` § *Migracao de dados*) e `register_taxonomy()` para quem declara `default_term` |
 * | *"apagar um termo devolve o objeto ao termo padrao, se aquele era o unico"* (`DB-TRG4`, `BR-MIGRAR-080`) — **CA-4.4** | **T009**, US-4 |
 * | *"o termo padrao do contexto e indestrutivel"* (`BR-MIGRAR-091`) — **CA-5.1** a **CA-5.3** | **T011**, US-5 |
 * | os cinco casos `UT-035-1` a `UT-035-5` de `backlog/tests.md` | **T008**, que roda em paralelo com esta tarefa |
 * | a leitura da opcao sobre `options` | `plataforma/opcoes/`, que **nao existe nesta arvore e nenhuma tarefa do pacote constroi** |
 */

export {
  chaveDoTermoPadrao,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  SEM_TERMO_PADRAO,
  TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
} from './chave-do-termo-padrao.js';

export {
  criarClassificacaoNaPublicacao,
  type ClassificacaoNaPublicacao,
  type TaxonomiaNaPublicacao,
  type TermosDoConteudoNaPublicacao,
} from './classificacao-na-publicacao.js';

export type {
  ColaboracaoDoTermoPadrao,
  ColaboracaoDoTermoPadraoSemAtor,
  OpcoesNaClassificacao,
} from './escopo-de-termo-padrao.js';

export {
  aplicarTermoPadraoNaGravacao,
  resolverTermoPadraoNaGravacao,
  type AplicacaoDoTermoPadrao,
  type ListaDoTermoPadrao,
  type ListaInformada,
  type OrigemDaListaDoTermoPadrao,
  type PedidoDeTermoPadraoNaGravacao,
  type PortaDaEscritaDoTermoPadrao,
  type ResultadoDaEscritaDoTermoPadrao,
} from './termo-padrao-na-gravacao.js';
