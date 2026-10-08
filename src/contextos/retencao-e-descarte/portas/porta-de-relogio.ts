/**
 * Porta de relogio do modulo de retencao e descarte.
 *
 * Existe porque esta feature **e** um prazo: *"tirar do ar sem perder, e apagar
 * no prazo"*. A constituicao manda conferir prazo na borda — o **P6** pede, para
 * cada numero, *"teste que afirma o valor e o efeito da borda (no ultimo instante
 * aceita, um instante depois recusa)"*, e o cenario de paridade de PT-004 abre
 * com *"um oraculo com o legado na mesma versao, com relogio controlavel"*. Um
 * modulo que leia o relogio do sistema direto nao tem como ser conferido assim.
 *
 * **A unidade e segundo inteiro, e isso e regra, nao gosto.** A coleta do legado
 * e aritmetica sobre `time()`, que devolve segundos inteiros em UTC:
 * `$delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )`
 * (`wp-includes/functions.php:6977`), e o instante do descarte e gravado no
 * metadado `_wp_trash_meta_time` na mesma unidade. Expor milissegundo aqui seria
 * inventar precisao que o produto nao tem, e o P6 recusa numero que o legado nao
 * tem.
 *
 * ## 🔴 O que esta porta NAO serve, e e a armadilha desta feature
 *
 * **A expiracao do rascunho automatico (US-6, R4) nao e decidida por este
 * relogio no legado: ela e decidida pelo relogio do BANCO.** A consulta e literal
 * (`wp-includes/post.php:8377`):
 *
 * ```sql
 * SELECT ID FROM {p}posts
 *  WHERE post_status = 'auto-draft'
 *    AND DATE_SUB( NOW(), INTERVAL 7 DAY ) > post_date
 * ```
 *
 * `NOW()` e o relogio do servidor MySQL, no fuso dele, comparado com `post_date`,
 * que e a data **local do site** — e nao com `post_date_gmt`. Trocar isso pelo
 * relogio do processo muda o conjunto de linhas apagadas em toda instalacao cujo
 * banco e cujo site nao estao no mesmo fuso, e o cenario *"Rascunho automatico
 * expira pelo prazo proprio, por comparacao de data"* de PT-004 cobra que *"a
 * decisao usa a data de criacao do registro nas duas, nao a data de
 * modificacao"*.
 *
 * **T001 nao decide como reproduzir isso** — e entrega de **T013**, que
 * implementa US-6. Fica declarado aqui para que ninguem o resolva por acidente,
 * injetando este relogio onde o legado usa o do banco.
 *
 * ## Nota de arquitetura, declarada e nao resolvida aqui
 *
 * AD-08 de `target_architecture.md` diz *"portas somente nas 5 bordas"* e lista
 * dados, HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta
 * entre elas, e `target_architecture.md` nao o menciona em lugar nenhum. T001 de
 * `tasks.md` pede esta porta pelo nome. As duas coisas convivem pelo mesmo motivo
 * que a feature 001 registrou na porta dela: o que AD-08 recusa e dar porta ao
 * barramento de hooks, a traducao e ao escape, por custo de indirecao em escala
 * de 13.335 e 3.416 pontos de entrada; o relogio nao substitui sistema externo, e
 * so o costurar torna o P6 conferivel. Fica registrado para quem revisar a conta
 * das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   */
  agoraEmSegundos(): number;
}
