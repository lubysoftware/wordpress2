/**
 * `rotulo-e-contexto/` — separar o rotulo de classificacao do contexto em que
 * ele classifica.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo` (US-1), e e a
 * parte de UC-05 e de UC-08 que trata da **separacao**; o que pertence as outras
 * historias esta na lista do fim.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `escopo-de-rotulo-e-contexto.ts` | o escopo por argumento, e as cinco coisas que **nao** estao nele |
 * | `erro-de-termo.ts` | os quatro codigos de `WP_Error` deste caminho, com as mensagens do legado |
 * | `resolucao-do-rotulo-no-contexto.ts` | **CA-1.1**: as quatro saidas de `WP_Term::get_instance()`, e o contexto `raw` de `sanitize_term()` |
 * | `renomear-rotulo.ts` | **CA-1.2**: os dois `UPDATE` de uma renomeacao, e a 🔴 divergencia do rotulo compartilhado |
 * | `remover-rotulo-do-contexto.ts` | **CA-1.3**: o `DELETE` da linha de contexto e o `DELETE` condicional do rotulo |
 * | `tipos-de-objeto-do-contexto.ts` | **CA-1.4**: a declaracao lida pelo outro lado, e a recusa silenciosa |
 * | `us-1-rotulo-e-contexto.test.ts` | os quatro criterios, por efeito no banco e por sequencia de comandos |
 *
 * ---
 *
 * # Por que a separacao e a feature inteira
 *
 * `spec.md` abre com isso: *"O legado separa o rotulo do contexto em que ele
 * classifica, e essa separacao e a feature inteira. O mesmo rotulo pode existir
 * como categoria e como etiqueta: duas linhas no contexto de classificacao, uma
 * so no rotulo"*. Em codigo, os quatro criterios caem em quatro lugares
 * diferentes **porque** a separacao existe:
 *
 * | criterio | onde a separacao o decide |
 * |---|---|
 * | CA-1.1 | a leitura **nao** tem `LIMIT 1`: um rotulo em dois contextos devolve duas linhas, e e a resolucao que escolhe (ou recusa) |
 * | CA-1.2 | `name` esta **so** em `terms`: um `UPDATE` alcanca todos os contextos por construcao |
 * | CA-1.3 | a presenca num contexto e **outra** linha: apagar uma nao apaga a outra, e o rotulo so morre quando a contagem chega a zero |
 * | CA-1.4 | o contexto **declara** tipos de objeto, e e por essa lista que se decide vinculo — nao por tabela de ligacao |
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), somado a
 * `@invariante`, obrigatoria em *"todo fluxo cujo aggregate tem invariante"* — e
 * `AGG-Termo` tem quatro em `target_domain_model.md`. Por isso a suite afirma
 * **qual comando sai, com quais parametros e em que ordem**, inclusive os casos
 * em que **nenhum comando sai**.
 *
 * ⚠️ **Nao existe `.feature` de classificacao em `parity_tests/`** e o oraculo
 * executavel do legado **nao existe nesta arvore** (`oracleAvailable: false`;
 * levanta-lo e T001 da feature `015-plataforma-transversal`). Logo cada
 * afirmacao desta pasta e **leitura estatica** do legado, com `arquivo:linha` no
 * comentario, e nao comparacao de execucao. O que a leitura estatica nao resolve
 * — efeito de cache, valor de opcao em execucao, corrida de duas requisicoes —
 * fica para fechar contra o oraculo.
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | criar rotulo (`wp_insert_term()` inteira: duplicata de nome no mesmo nivel, laco de sufixo do slug, confirmacao de duplicata depois do `INSERT`) | **T009**, US-4 — e o `pre_insert_term` e os dois `create_*` com ele |
 * | substituir os vinculos de um conteudo num contexto, e a capacidade de criar termo pela tela | **T005**, US-2 (CA-2.1 a CA-2.4) |
 * | o termo padrao, e as opcoes `default_category` / `default_term_{nome}` | **T007**, US-3 |
 * | hierarquia (pai, arvore, recusa em contexto plano), contagem de uso e a cascata de exclusao | **T009**, US-4 (CA-4.1 a CA-4.5) |
 * | a protecao do termo padrao, que vence o ator de maior poder | **T011**, US-5 (CA-5.1 a CA-5.3) |
 * | a consulta de termos por filtro (`WP_Term_Query`), e `term_exists()` / `get_term_by()`, que passam por ela | **T009** e **T007 da feature 015** |
 * | a divisao de rotulo compartilhado (`_split_shared_term()` e as tres funcoes em volta) | 🔴 **ninguem**: e conflito aberto, descrito em `renomear-rotulo.ts` |
 * | o cache de objeto, o barramento de pontos de extensao e o catalogo de traducao | REQ-165, REQ-162 e a feature 015 |
 *
 * # O que esta pasta publica como operacao do modulo, e o que nao
 *
 * `../index.ts` recebe **cinco** operacoes desta pasta. {@link
 * removerRotuloDoContexto} fica **de fora de proposito**, e a razao esta no
 * bloco 🔴 do arquivo dela: ela e o trecho final de `wp_delete_term()`, sem a
 * protecao do termo padrao (US-5) e sem a cascata (US-4), e publica-la como
 * operacao criaria um caminho de apagar dado que o legado **nao expoe** — o que
 * a tabela *Nao negociavel* da constituicao poe fora do alcance do agente.
 * Export existe para a tarefa que montar a exclusao inteira; operacao, nao.
 */

export {
  ehErroDeTermo,
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  type CodigoDeErroDeTermo,
  type ErroDeTermo,
} from './erro-de-termo.js';

export type {
  ArmazenamentoNaSeparacao,
  EscopoDeRotuloEContexto,
} from './escopo-de-rotulo-e-contexto.js';

export {
  obterTermo,
  sanitizarTermoCru,
  type RotuloLido,
} from './resolucao-do-rotulo-no-contexto.js';

export {
  renomearRotulo,
  type ParDoRotulo,
  type PedidoDeRenomeacao,
  type ResultadoDaRenomeacao,
} from './renomear-rotulo.js';

export {
  removerRotuloDoContexto,
  type PedidoDeRemocaoDoContexto,
  type ResultadoDaRemocaoDoContexto,
} from './remover-rotulo-do-contexto.js';

export {
  contextoAceitaTipoDeObjeto,
  contextosDoTipoDeObjeto,
  nomesDosContextosDoTipoDeObjeto,
} from './tipos-de-objeto-do-contexto.js';
