/**
 * O que US-4 le, grava e pergunta a quem esta fora deste contexto — e **nada
 * mais**.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4). Mesma
 * forma e mesmas razoes de `../vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts`
 * e de `../termo-padrao/escopo-de-termo-padrao.ts`: chega por argumento, nao e
 * estado de modulo (`BR-MIGRAR-105`, `EXT-CONTEXTO`, dimensao **D-A** de
 * `parity_specs.md`), e toda travessia que sai de BC-02 e resolvida **no momento
 * da chamada** (AD-10).
 *
 * ---
 *
 * # ESTA HISTORIA NAO TEM ESCOPO PROPRIO, e a ausencia e afirmacao
 *
 * As tres operacoes de US-4 usam exatamente o que
 * {@link EscopoDeVinculoDeObjeto} ja carrega — o registro desta requisicao e as
 * **quatro** pecas do armazenamento —, e por tres razoes que sao do legado:
 *
 * 1. **criar rotulo escreve nas duas tabelas de `AGG-Termo`**: uma linha em
 *    `terms` e uma em `term_taxonomy` (`wp_insert_term()`, UC-08 passo 4 —
 *    *"uma linha em terms, uma em term_taxonomy por taxonomia"*);
 * 2. **reposicionar na hierarquia le o termo fundido e grava as duas linhas**,
 *    como `wp_update_term()` faz pelo caminho do nome (T003);
 * 3. **a cascata de exclusao escreve na juncao pelas operacoes de US-2**, nao por
 *    conta propria: `wp_delete_term()` chama `wp_set_object_terms()` para cada
 *    objeto alcancado (`wp-includes/taxonomy.php:2152`-`:2183`), e e essa chamada
 *    que mantem a contagem correta (**CA-4.5**).
 *
 * Declarar um escopo gemeo aqui faria duas leituras do mesmo armazenamento
 * divergirem no dia em que uma das duas ganhasse uma peca — e e a mesma razao
 * que T007 escreveu ao reusar o escopo de US-2.
 *
 * # O que NAO esta neste arquivo, e por que a ausencia e afirmacao
 *
 * | ausente | por que | de quem e |
 * |---|---|---|
 * | porta de opcoes | a opcao do termo padrao e **entrada lida de fora**, e nao borda: AD-08 fixa *"portas somente nas 5 bordas"* e opcao nao e uma delas. A analise inteira, com as cinco razoes, esta no bloco 🔴 de `../termo-padrao/escopo-de-termo-padrao.ts` | `plataforma/opcoes/`, que nao existe nesta arvore |
 * | a consulta de termos por filtro (`WP_Term_Query`) | ver o bloco 🔴 de `./index.ts`: ela e montada **por fragmento com ponto de extensao entre os fragmentos**, e uma versao simplificada aqui seria uma segunda consulta de termos **sem** os pontos de extensao, que o **P2** poe no contrato publico | feature `015`, T007 |
 * | `termmeta` | metadado **do rotulo**, e nao uma das tres estruturas de T002. A posicao em que a cascata o apaga esta declarada em `./apagar-rotulo-do-contexto.ts` | quem portar `termmeta` |
 * | cache de objeto | `clean_term_cache()` fecha as tres operacoes desta historia, e a borda 5 de `target_architecture.md` manda que **nenhuma** metade use cache durante a coexistencia | REQ-165, nao decidida |
 * | barramento de pontos de extensao | `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado`, e **nenhuma tarefa deste pacote o constroi**. Cada ponto esta declarado no arquivo que o emitiria, com nome, argumentos e posicao (P2) | ninguem deste pacote |
 * | relogio e e-mail | nada em US-4 tem prazo e nada notifica ninguem | — |
 */

import type {
  BaseDeAutorizacao,
  AtorDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { ColaboracaoDoTermoPadraoSemAtor } from '../termo-padrao/index.js';

/**
 * O que **CA-4.1** precisa, e so isso: a base da decisao de capacidade e quem
 * abre a tela.
 *
 * ⚠️ **Nao traz `conteudo`**, e o tipo e estreito de proposito: o portao da tela
 * nao le `posts`, nao conta nada e nao toca o banco. A ausencia e verificavel pelo
 * compilador em vez de ser so uma frase — a mesma escolha que
 * `ArmazenamentoNaSeparacao` fez em T003.
 *
 * Os dois chegam separados, como em `../vinculo-de-objeto/`: a base e o que nao
 * muda dentro da requisicao (matriz gravada, rede, constantes, casos de traducao)
 * e o ator e quem pergunta. Junta-los esconderia que a **mesma** base responde por
 * atores diferentes, que e o que `quemTemCapacidade()` percorre.
 */
export interface ColaboracaoDaGestaoDaLista {
  /** A matriz gravada, a rede, as constantes e os casos de traducao de objeto. */
  readonly base: BaseDeAutorizacao;
  /** Quem abre a tela. `ATOR_ANONIMO` para quem nao esta autenticado. */
  readonly ator: AtorDeAutorizacao;
}

/**
 * O que a **cascata de exclusao** precisa de fora deste contexto: as duas
 * contagens de BC-01 e a leitura da opcao do termo padrao.
 *
 * E exatamente {@link ColaboracaoDoTermoPadraoSemAtor}, de T007, e o reuso e
 * leitura do legado e nao economia:
 *
 * - **`conteudo`** entra porque a cascata grava pela substituicao integral de
 *   US-2, que reconta (`CA-4.5`), e porque `BR-MIGRAR-078` (`DB-TRG2`) poe um dos
 *   dois criterios de contagem atravessando `posts`;
 * - **`opcoes`** entra porque **CA-4.4** *e* a opcao: *"conteudo que fica sem
 *   termo algum num contexto com padrao recebe o padrao"* e `DB-TRG4`
 *   (`BR-MIGRAR-080`), e o padrao mora na opcao `default_category` /
 *   `default_term_{nome}` que `chaveDoTermoPadrao()` monta;
 * - **nao ha ator**, e isso e leitura do legado: `wp_delete_term()` nao tem
 *   `current_user_can` no corpo. Quem cobra capacidade e a tela
 *   (`wp-admin/edit-tags.php:117` e `:137`), e e por isso que o portao e
 *   {@link ColaboracaoDaGestaoDaLista}, separado. Pedir ator aqui obrigaria quem
 *   apaga pela fila agendada a inventar um — a mesma razao que T007 escreveu para
 *   `ColaboracaoDoTermoPadraoSemAtor`.
 */
export type ColaboracaoDaExclusaoDeRotulo = ColaboracaoDoTermoPadraoSemAtor;
