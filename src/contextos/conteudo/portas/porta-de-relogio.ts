/**
 * Porta de relogio do modulo de conteudo (BC-01).
 *
 * Existe porque nesta feature a data NAO e so registro: ela **decide estado**.
 * `wp_insert_post()` compara a data do conteudo com o instante corrente e
 * reescreve o status nos dois sentidos — publicado com data a frente vira
 * agendado, agendado com data no passado vira publicado
 * (`wp-includes/post.php:4798` a `:4808`; CA-6.1 e CA-6.2) —, e
 * `check_and_publish_future_post()` compara de novo na hora de publicar, recusa
 * o que nao esta agendado e reagenda quando a data ainda nao chegou
 * (`:5482` e `:5496`; ADR-0005, BR-MIGRAR-006). Um modulo que leia o relogio do sistema
 * direto nao tem como ser conferido: o P4 da constituicao pede *"teste por
 * atestado que fixa prazo e forca, com relogio controlado"* e o P6 pede, para
 * cada numero, *"no ultimo instante aceita, um instante depois recusa"* — que e
 * exatamente a borda dos 60 segundos de CA-6.1.
 *
 * **A unidade e segundo inteiro, e isso e regra, nao gosto.** As tres leituras
 * de tempo do caminho de gravacao do legado tem granularidade de segundo e
 * nascem do mesmo instante:
 *
 * - `gmdate( 'Y-m-d H:i:s' )` (`:4798`), comparado com `strtotime()` — e a
 *   comparacao que decide agendado contra publicado;
 * - `current_time( 'mysql' )` e `current_time( 'mysql', true )` (`:4790` e
 *   `:4791`), que gravam `post_modified` e `post_modified_gmt`;
 * - `time()` (`:5496`), inteiro em UTC, na verificacao dupla.
 *
 * Expor milissegundo aqui seria inventar precisao que o produto nao tem, e o P6
 * recusa numero que o legado nao tem.
 *
 * **Tres coisas que NAO sao desta porta, e cada uma tem dono:**
 *
 * 1. **O fuso do site.** `current_time( 'mysql' )` rende hora local a partir de
 *    `gmt_offset` / `timezone_string`, que sao OPCAO — dado, nao relogio. O fuso
 *    chega pela porta de dados (via `plataforma/opcoes/`), e quem o precisar o
 *    le na tarefa dele.
 * 2. **A formatacao `Y-m-d H:i:s`.** E funcao pura sobre o instante, e mora em
 *    `utilitarios/` pela regra de dependencia 5. Porta nao formata.
 * 3. **A sentinela `'0000-00-00 00:00:00'`.** Ela nao e instante: e valor
 *    gravado, com significado de negocio — `target_data_model.md` registra que
 *    em `posts` ela marca *"um rascunho cujo status declara a data"*, e e o que
 *    os estados com data flutuante escrevem em `post_date_gmt`
 *    (`:4779` a `:4784`). Quem a grava e T002, no modelo de dados.
 *
 * Nenhum prazo mora nesta porta. Os 60 segundos de CA-6.1
 * (`MINUTE_IN_SECONDS` em `:4801` e `:4805`) entram em T013, o intervalo de
 * salvamento automatico (`AUTOSAVE_INTERVAL`,
 * `wp-includes/default-constants.php:381`) em T023, e os 7 dias de expiracao do
 * rascunho automatico sao da feature 005 (R4 / BR-MIGRAR-033) — cada um num
 * ponto de configuracao nomeado com o valor de fabrica e teste de borda, como o
 * P6 exige.
 *
 * **Nota de arquitetura, declarada e nao resolvida aqui:** AD-08 de
 * `target_architecture.md` diz "portas somente nas 5 bordas" e lista dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta entre
 * elas. T001 de `tasks.md` pede esta porta pelo nome, e a mesma tensao foi
 * registrada em BC-05 (`contextos/identidade-e-acesso/portas/porta-de-relogio.ts`)
 * sem ser resolvida por conta propria. As duas coisas convivem: o que AD-08
 * recusa e dar porta ao barramento de hooks, a traducao e ao escape, por custo
 * de indirecao em escala de 13.335 e 3.416 pontos de entrada; o relogio nao
 * substitui sistema externo, e so o costurar torna o P4 e o P6 conferiveis.
 * Fica registrado para quem revisar a conta das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   */
  agoraEmSegundos(): number;
}
