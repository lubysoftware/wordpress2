/**
 * O que US-5 le de fora deste contexto, e **nada mais**: a base da decisao de
 * capacidade, quem pergunta, e a opcao que guarda o termo padrao.
 *
 * Entrega de **T011** da feature `003-classificacao-do-conteudo` (US-5). Mesma
 * forma e mesmas razoes de `../manutencao-da-lista/escopo-de-manutencao-da-lista.ts`
 * e de `../termo-padrao/escopo-de-termo-padrao.ts`: chega por argumento, nao e
 * estado de modulo (`BR-MIGRAR-105`, `EXT-CONTEXTO`, dimensao **D-A** de
 * `parity_specs.md`), e toda travessia que sai de BC-02 e resolvida **no momento
 * da chamada** (AD-10).
 *
 * ---
 *
 * # ESTA HISTORIA TAMPOUCO TEM ESCOPO PROPRIO, e a ausencia e afirmacao
 *
 * As operacoes de US-5 leem exatamente o que
 * {@link EscopoDeVinculoDeObjeto} ja carrega — o registro desta requisicao e as
 * quatro pecas do armazenamento —, e por duas razoes que sao do legado:
 *
 * 1. **o `case` de capacidade sobre o termo le o termo pela leitura fundida**
 *    (`get_term( $term_id )`, sem contexto pedido), que e a de T003, e consulta o
 *    registro para chegar a `$tax->cap` (`wp-includes/capabilities.php:730`-`:748`);
 * 2. **a protecao da exclusao e um passo de dentro de `wp_delete_term()`**
 *    (`wp-includes/taxonomy.php:2073`-`:2087`), que ja roda sobre o escopo de
 *    US-2.
 *
 * Declarar um escopo gemeo aqui faria duas leituras do mesmo armazenamento
 * divergirem no dia em que uma das duas ganhasse uma peca — a razao que T007 e
 * T009 escreveram, nesta ordem.
 *
 * # Por que sao DUAS colaboracoes, e nao uma
 *
 * Porque o legado cobra ator em um caminho e nao no outro, e a diferenca **e**
 * `CA-5.1`:
 *
 * | caminho | tem ator? | onde no legado |
 * |---|---|---|
 * | os portoes de item da tela (`delete_term`, `edit_term`) | **sim**: a pergunta e sobre quem clicou | `wp-admin/edit-tags.php:117`, `:137`, `:173` |
 * | a recusa de dentro de `wp_delete_term()` | **nao**: ela nao consulta capacidade nenhuma | `wp-includes/taxonomy.php:2075` e `:2084` |
 *
 * *"Apagar o termo declarado como padrao de um contexto e recusado, **para
 * qualquer ator**"* (CA-5.1) **nao** e uma regra de autorizacao com ator: e uma
 * recusa da funcao, e e por isso que {@link ColaboracaoDaExclusaoDeRotulo} — que
 * T009 declarou sem ator — continua servindo a cascata depois desta tarefa.
 *
 * # O que NAO esta neste arquivo, e por que a ausencia e afirmacao
 *
 * | ausente | por que | de quem e |
 * |---|---|---|
 * | **escrita** da opcao do termo padrao | `CA-5.3` (*"trocar qual termo e o padrao e permitido"*) e uma gravacao em `options`, e **nenhuma funcao de termo do legado a faz**: quem troca `default_category` e a tela de escrita das opcoes, e quem grava `default_term_{nome}` e `register_taxonomy()` (`taxonomy.php:543`). Declarar aqui uma escrita de opcao inventaria superficie | `plataforma/opcoes/`, que nao existe nesta arvore, e o registro |
 * | porta de opcoes | AD-08 fixa *"portas somente nas 5 bordas"* e opcao nao e uma delas. A analise inteira, com as cinco razoes, esta no bloco 🔴 de `../termo-padrao/escopo-de-termo-padrao.ts` | idem |
 * | `conteudo` | nenhum portao de item le `posts`, nao conta nada e nao toca o banco de BC-01. A ausencia e verificavel pelo compilador em vez de ser so uma frase — a mesma escolha de `ColaboracaoDaGestaoDaLista` em T009 | — |
 * | barramento de pontos de extensao | `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado`, e **nenhuma tarefa deste pacote o constroi** (P2) | ninguem deste pacote |
 * | relogio, e-mail e cache | nada em US-5 tem prazo, nada notifica ninguem e `clean_term_cache()` e do passo 10 da cascata | REQ-165 |
 */

import type { ColaboracaoDaGestaoDaLista } from '../manutencao-da-lista/index.js';
import type { OpcoesNaClassificacao } from '../termo-padrao/index.js';

/**
 * O que um **portao de item** da tela de termos precisa: a base da decisao, quem
 * clicou, e a leitura da opcao do termo padrao.
 *
 * Estende {@link ColaboracaoDaGestaoDaLista} — logo **nao** traz `conteudo` — e
 * acrescenta `opcoes` por uma razao so, e ela e a regra desta historia: o `case`
 * de capacidade sobre o termo **le a opcao** antes de responder, para negar a
 * exclusao do termo padrao (`wp-includes/capabilities.php:738`-`:744`). Sem a
 * opcao nao se decide `delete_term`.
 *
 * ⚠️ O portao da **acao em lote** nao precisa dela, e por isso ele pede a
 * colaboracao estreita de T009 — ver `./permissao-sobre-rotulo.ts`.
 */
export interface ColaboracaoDaProtecaoDoTermoPadrao
  extends ColaboracaoDaGestaoDaLista {
  readonly opcoes: OpcoesNaClassificacao;
}
