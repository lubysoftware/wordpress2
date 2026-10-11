/**
 * Porta de relogio do modulo de privacidade (BC-06).
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`.
 * `satisfaz: — (infraestrutura)`.
 *
 * Existe porque os tres numeros desta feature sao prazos, e a constituicao manda
 * conferi-los na borda: o **P6** pede, para cada numero, *"teste que afirma o
 * valor e o efeito da borda (no ultimo instante aceita, um instante depois
 * recusa)"*, e o Contexto de `parity_tests/12-solicitacao-de-dado-pessoal.feature`
 * abre com *"um oraculo com o legado na mesma versao, com relogio controlavel"*.
 * Um modulo que leia o relogio do sistema direto nao tem como ser conferido
 * assim.
 *
 * **A unidade e segundo inteiro, e isso e regra, nao gosto.** As duas
 * comparacoes de prazo do legado sao aritmetica sobre `time()`, que devolve
 * segundos inteiros em UTC: a chave vence em
 * `$expiration_time = $key_request_time + $expiration_duration` comparado com
 * `time() > $expiration_time` (`wp-includes/user.php:5113` e `:5119`), e a idade
 * do arquivo de exportacao e `time() - filemtime( $export_file )`
 * (`wp-includes/functions.php:8626`). Expor milissegundo aqui seria inventar
 * precisao que o produto nao tem, e o P6 recusa numero que o legado nao tem.
 *
 * **Nenhum prazo mora nesta porta.** Os tres numeros desta feature, com a tarefa
 * que os aplica e a anotacao de onde cada um vem, estao em `../README.md`:
 *
 * | numero | valor de fabrica | ponto de extensao que o altera | tarefa |
 * |---|---|---|---|
 * | prazo da chave de confirmacao | `DAY_IN_SECONDS` (24 h) | `user_request_key_expiration`, `wp-includes/user.php:5112` | T005 |
 * | validade do arquivo de exportacao | `3 * DAY_IN_SECONDS` | `wp_privacy_export_expiration`, `wp-includes/functions.php:8623` | T015 |
 * | periodicidade das duas varreduras | `hourly` do arquivo, `daily` da expiracao | nenhum: `wp_schedule_event` fixo em `wp-includes/functions.php:8557` e `:8574` | T009, T015 |
 *
 * Declarar os tres aqui, como dado, seria entrega de outra tarefa; declarar
 * **onde** eles vivem e o que impede a proxima onda de os redescobrir errado.
 *
 * ---
 *
 * ## 🔴 O que esta porta NAO serve, e e a armadilha desta feature
 *
 * **O mesmo prazo de 24 horas e medido de duas maneiras diferentes no legado, e
 * so uma delas e este relogio.**
 *
 * - **A conferencia da chave (US-2, T005) usa este relogio.**
 *   `wp_validate_user_request_key` compara `time()` com
 *   `$request->modified_timestamp + 24 h`, e `modified_timestamp` e
 *   `strtotime( $post->post_modified_gmt )`
 *   (`wp-includes/class-wp-user-request.php:116`) — coluna **GMT**, relogio do
 *   processo.
 * - **A expiracao agendada (US-4, T009) NAO usa relogio de processo nenhum.**
 *   `_wp_personal_data_cleanup_requests` monta uma consulta de data sobre a
 *   coluna **local** `post_modified`, com `'before' => $expires . ' seconds ago'`
 *   (`wp-admin/includes/privacy-tools.php:213` e `:214`), e o comentario do
 *   proprio legado explica por que a coluna local e obrigatoria ali: a expressao
 *   de data relativa e resolvida **no fuso do site**, logo comparar contra a
 *   coluna GMT *"deslocaria a janela de expiracao pelo deslocamento UTC do
 *   site"*.
 *
 * As duas medidas coincidem so em instalacao com deslocamento zero. Trocar a
 * segunda por este relogio muda o conjunto de solicitacoes que expiram em toda
 * instalacao cujo fuso nao e UTC, e o cenario `@idempotencia` de PT-012 cobra o
 * instante exato: *"quando o tempo avanca ate um instante antes do prazo de
 * confirmacao, as duas metades ainda aceitam a chave"*.
 *
 * **T001 nao decide como reproduzir isso** — e entrega de **T009**, que
 * implementa US-4. Fica declarado aqui para que ninguem o resolva por acidente,
 * injetando este relogio onde o legado usa a comparacao do banco. E a mesma
 * armadilha que BC-05 registrou na porta dele para o rascunho automatico, com
 * outro nome.
 *
 * ## Nota de arquitetura, declarada e nao resolvida aqui
 *
 * AD-08 de `target_architecture.md` diz *"portas somente nas 5 bordas"* e lista
 * dados, HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta
 * entre elas. T001 de `tasks.md` pede esta porta pelo nome, e as portas de BC-03
 * e de BC-05 carregam a mesma nota. As duas coisas convivem: o que AD-08 recusa
 * e dar porta ao barramento de hooks, a traducao e ao escape, por custo de
 * indirecao em escala de 13.335 e 3.416 pontos de entrada; o relogio nao
 * substitui sistema externo, e so o costurar torna o P6 conferivel. Fica
 * registrado para quem revisar a conta das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   */
  agoraEmSegundos(): number;
}
