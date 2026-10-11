/**
 * Porta de relogio do modulo de trabalho agendado.
 *
 * Existe porque esta feature **e** tempo: a fila e indexada por instante, a trava
 * e um instante, e o que decide se um evento esta vencido e uma comparacao entre
 * dois instantes. O **P6** da constituicao pede, para cada numero, *"teste que
 * afirma o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"*, e a entrega de **T002** e literal sobre isso: a trava *"e
 * verificavel com relogio controlado"*. Um modulo que leia o relogio do sistema
 * direto nao tem como ser conferido assim.
 *
 * ## Duas leituras, porque o legado tem duas — e nao sao a mesma
 *
 * Esta e a diferenca que um porte apressado apaga. O legado le o relogio de
 * **duas** formas nesta feature, e cada uma decide uma coisa diferente:
 *
 * | leitura | forma no legado | onde, e o que decide |
 * |---|---|---|
 * | segundo inteiro | `time()` | o instante de um evento: a janela de dez minutos que define evento duplicado (`wp-includes/cron.php:135`, `:141`, `:142`) e a aritmetica do reagendamento (`wp-includes/cron.php:458`) |
 * | segundo com fracao | `microtime( true )` | o instante do **disparo** e da **trava**: `wp-cron.php:89`, `wp-includes/cron.php:901`, `:1061`, `:1234` |
 *
 * E a fronteira entre as duas e observavel. O evento vencido e decidido por
 * `$timestamp > $gmt_time` com `$gmt_time = microtime( true )`
 * (`wp-includes/cron.php:1238`), isto e: um evento marcado para o segundo
 * corrente **ja esta vencido** enquanto a fracao nao passa dele. Quem usar
 * segundo inteiro nos dois lados muda a borda de um evento por segundo redondo.
 *
 * ## 🔴 A fracao e identidade textual, e isso nao esta decidido aqui
 *
 * A trava nao e comparada como numero: ela e comparada como **texto**. O legado
 * grava `sprintf( '%.22F', microtime( true ) )` (`wp-includes/cron.php:942`,
 * `:958`, `wp-cron.php:101`) e confere com `!==` (`wp-cron.php:113`), o que faz
 * da chave da trava uma cadeia de 22 casas decimais que tem de **bater byte a
 * byte** entre quem tomou a trava e quem a confere.
 *
 * Esta porta devolve **numero**, e nao texto, porque o instante e numero em todo
 * o resto da feature; a formatacao de 22 casas e de quem portar a trava
 * (**T002**). Mas ha uma pergunta que T001 **nao** responde e registra: quantas
 * casas significativas o relogio deste runtime oferece nao e o que `microtime()`
 * oferece, e o cenario *"A trava de tempo do disparo e o unico freio, e e a do
 * legado"* de PT-005 cobra o comportamento nas duas metades. Quem escrever o
 * adaptador confere a formatacao contra o oraculo antes de afirmar paridade —
 * nao se decide isso por escolha de biblioteca.
 *
 * **Nenhum prazo mora nesta porta.** Os dois numeros da fila — 60 segundos de
 * trava e o descarte dela depois de 10 minutos
 * (`wp-includes/default-constants.php:399`, `wp-includes/cron.php:917`,
 * `:922`) — entram em **T002**, que e a tarefa que os implementa, cada um com o
 * teste de borda que o P6 exige. Numero que aparece aqui antes da tarefa dele e
 * numero sem teste de borda.
 *
 * ## Nota de arquitetura, declarada e nao resolvida aqui
 *
 * AD-08 de `target_architecture.md` diz *"portas somente nas 5 bordas"* e lista
 * dados, HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta
 * entre elas. T001 de `tasks.md` pede esta porta pelo nome. As duas coisas
 * convivem pelo mesmo motivo que as features `001` e `005` registraram nas portas
 * delas: o que AD-08 recusa e dar porta ao barramento de hooks, a traducao e ao
 * escape, por custo de indirecao em escala de 13.335 e 3.416 pontos de entrada; o
 * relogio nao substitui sistema externo, e so o costurar torna o P6 conferivel.
 * Fica registrado para quem revisar a conta das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   *
   * E esta leitura que datam **eventos**. O instante de um evento e inteiro em
   * todo o legado: a assinatura e `@param int $timestamp Unix timestamp (UTC)`
   * (`wp-includes/cron.php:232`), e `wp_schedule_event()` recusa o que nao for
   * inteiro positivo (`wp-includes/cron.php:254`).
   */
  agoraEmSegundos(): number;

  /**
   * Instante corrente em segundos **com fracao**, em UTC: o `microtime( true )`
   * do legado.
   *
   * E esta leitura que decide **disparo** e **trava**, e nao e arredondavel para
   * a de cima: a comparacao de evento vencido usa esta
   * (`wp-includes/cron.php:1238`), e a identidade da trava e a fracao dela.
   */
  agoraEmSegundosFracionarios(): number;
}
