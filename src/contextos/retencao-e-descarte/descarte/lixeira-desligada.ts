/**
 * **CA-4.1**: *"com a lixeira desligada, o pedido de descarte apaga em
 * definitivo"* — e a descoberta de **T009**, que e a pergunta *"ha lixeira?"*
 * **nao ter uma forma so** no legado.
 *
 * Entrega de **T009** da feature `005-retencao-e-descarte` (US-4). O efeito de
 * CA-4.1 ja esta no lugar desde **T003**: `descartarParaALixeira()` delega na
 * primeira linha e devolve o desfecho `apagado-em-definitivo`
 * (`wp-includes/post.php:4085`). O que falta, e que e desta tarefa, e **a
 * pergunta** — porque o legado a faz de tres jeitos diferentes sobre a mesma
 * constante, e os tres **nao concordam**.
 *
 * ---
 *
 * # O censo das leituras de `EMPTY_TRASH_DAYS`, lido na arvore
 *
 * `grep -n EMPTY_TRASH_DAYS` em `wp-includes/` e `wp-admin/` devolve **36**
 * linhas em **18** arquivos. Tirando a definicao do default
 * (`wp-includes/default-constants.php:387`-`:388`), os dois blocos de
 * documentacao (`post.php:4081`, `functions.php:6966`-`:6968`) e a aritmetica do
 * instante limite (`functions.php:6977`, `wp-admin/includes/nav-menu.php:1375`)
 * e as quatro linhas em que a tela de diagnostico so **relata** o valor
 * (`wp-admin/includes/class-wp-debug-data.php:1647`-`:1650`), o que resta sao
 * **25 linhas de decisao**, e cada decisao usa uma destas tres formas:
 *
 * | forma | o que ela responde | onde esta |
 * |---|---|---|
 * | `! EMPTY_TRASH_DAYS` | *"nao ha lixeira"* | `post.php:4085` (o descarte) · `link-template.php:1577` (o endereco da acao) · `meta-boxes.php:364` (o rotulo no editor) · `class-wp-posts-list-table.php:445` e `:1632` (as acoes da lista) · `comment.php:1644` · `class-wp-comments-list-table.php:300`, `:402`, `:833` · `class-wp-media-list-table.php:834` · `wp-admin/includes/dashboard.php:793` · `wp-admin/includes/media.php:1753` · `class-wp-customize-manager.php:3082` · `wp-admin/edit-form-comment.php:403` |
 * | `EMPTY_TRASH_DAYS` (verdadeiro) | *"ha lixeira"* | `post.php:3853` (o desvio de `wp_delete_post()`) · `post.php:6829` (anexo, com `MEDIA_TRASH`) · `meta-boxes.php:470` (anexo) · `class-wp-posts-list-table.php:1622` · `comment.php:1392` e `:1574` · `pluggable.php:1953` e `:2133` · `class-wp-media-list-table.php:824` |
 * | **`EMPTY_TRASH_DAYS > 0`** | *"o tipo suporta lixeira"* | **so na API REST**: `class-wp-rest-posts-controller.php:1099` e `class-wp-rest-comments-controller.php:1083` |
 *
 * As duas primeiras formas sao a mesma pergunta com o sinal trocado. A terceira
 * **nao e a mesma pergunta**, e e por isso que ela tem funcao propria aqui.
 *
 * ## 🔴 Prazo negativo responde SIM no painel e NAO na API
 *
 * Em PHP `! -1` e falso e `-1 > 0` tambem e falso. Logo, com
 * `define( 'EMPTY_TRASH_DAYS', -1 )`:
 *
 * | superficie | o que acontece | linha |
 * |---|---|---|
 * | `wp_trash_post()` | **ha lixeira**: o conteudo vai para `trash` normalmente | `post.php:4085` |
 * | o editor e a lista do painel | **ha lixeira**: oferecem *"Move to Trash"* e **nao** oferecem exclusao definitiva | `meta-boxes.php:364`, `class-wp-posts-list-table.php:1622`, `:1632` |
 * | a API REST, `DELETE` sem `force` | **nao ha lixeira**: recusa com **501** e *"The post does not support trashing"* | `class-wp-rest-posts-controller.php:1099`, `:1148` |
 * | a coleta | o instante limite cai no **futuro**, e tudo que esta na lixeira vence de imediato | `functions.php:6977` |
 *
 * Ou seja: numa instalacao com prazo negativo, o painel descarta e a API se
 * recusa a descartar o mesmo registro. **Nenhuma guarda foi acrescentada contra
 * isso** — o legado nao tem nenhuma, e `configuracao/prazo-de-retencao.ts` ja
 * registrou que valor negativo nao desliga a lixeira. O **P1** manda reproduzir
 * inclusive o que parece defeito, e aqui o "defeito" e observavel por qualquer
 * cliente da API: a area 1 da Decisao 2 de `parity_specs.md` compara a saida da
 * REST **byte a byte, com zero divergencia**.
 *
 * `MEDIA_TRASH` **nao entra neste arquivo**, e a ausencia e deliberada: a
 * conjuncao `EMPTY_TRASH_DAYS && MEDIA_TRASH` (`post.php:6829`,
 * `meta-boxes.php:470`, `class-wp-rest-posts-controller.php:1102`) e o descarte
 * de **anexo**, que a **resposta 9** de `questions.md` ja decidiu manter
 * definitivo, sem lixeira e sem aviso (REQ-051 `bloqueado`). Declarar a constante
 * aqui seria trazer para esta tarefa um numero que nao e dela e que entraria sem
 * o teste de borda que o **P6** cobra.
 */

import {
  lixeiraEstaLigada,
  type PrazoDeRetencao,
} from '../configuracao/index.js';

/**
 * `EMPTY_TRASH_DAYS > 0` — a pergunta **da API REST**, e so dela
 * (`wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:1099`):
 *
 * ```php
 * $supports_trash = ( EMPTY_TRASH_DAYS > 0 );
 * ```
 *
 * E a mesma linha, com a mesma forma, no controlador de comentario
 * (`class-wp-rest-comments-controller.php:1083`), onde ela ja vem **dentro** do
 * `apply_filters`.
 *
 * ⚠️ **Nao e o complemento de {@link lixeiraEstaLigada}.** Para todo prazo maior
 * que zero as duas concordam; para zero as duas concordam; para **negativo elas
 * divergem**, e a divergencia e observavel — ver o 🔴 do cabecalho e
 * {@link perguntasDaLixeiraDivergem}.
 */
export function lixeiraSuportadaNaApi(prazo: PrazoDeRetencao): boolean {
  return prazo.diasNaLixeira > 0;
}

/**
 * Se, neste prazo, o painel e a API respondem **coisas diferentes** a pergunta
 * *"ha lixeira?"*.
 *
 * Existe para que o caso de borda seja **afirmavel** em vez de descoberto por
 * acidente: ele e verdadeiro exatamente quando o prazo e negativo, que e o unico
 * valor em que `! EMPTY_TRASH_DAYS` e `EMPTY_TRASH_DAYS > 0` discordam. O **P6**
 * cobra o teste da borda — *"no ultimo instante aceita, um instante depois
 * recusa"* —, e esta e a borda que nao esta no numero, esta no **operador**.
 */
export function perguntasDaLixeiraDivergem(prazo: PrazoDeRetencao): boolean {
  return lixeiraEstaLigada(prazo) !== lixeiraSuportadaNaApi(prazo);
}
