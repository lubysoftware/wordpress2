/**
 * O ponto de configuracao nomeado da trava da fila agendada, com os valores de
 * fabrica do legado — a segunda metade da entrega de **T002**: *"a trava de 60
 * segundos com descarte depois de 10 minutos existe e e verificavel com relogio
 * controlado"*.
 *
 * *satisfaz:* — (infraestrutura). Nenhum criterio de aceite desta feature passa
 * por aqui: os dois numeros servem US-1, US-2 e US-6, e as tarefas delas sao
 * T003, T005 e T013.
 *
 * O **P6** da constituicao e a razao deste arquivo existir separado: *"cada
 * numero vive num ponto de configuracao nomeado, com o valor de fabrica do
 * legado, e existe teste que afirma o valor e o efeito da borda (no ultimo
 * instante aceita, um instante depois recusa)"*. Os numeros sao a regra `A9`
 * (BR-MIGRAR-053): *"a trava e um transiente de 60 segundos, descartado se passar
 * de 10 minutos"*.
 *
 * ## Os valores de fabrica, lidos na arvore analisada
 *
 * `wp-includes/default-constants.php:398`-`400`:
 *
 * ```php
 * if ( ! defined( 'WP_CRON_LOCK_TIMEOUT' ) ) {
 *     define( 'WP_CRON_LOCK_TIMEOUT', MINUTE_IN_SECONDS );
 * }
 * ```
 *
 * e `MINUTE_IN_SECONDS` e `60` (`wp-includes/default-constants.php:158`). Os dez
 * minutos **nao sao constante nomeada**: estao escritos na expressao, em
 * `wp-includes/cron.php:917`, como `10 * MINUTE_IN_SECONDS`. Nomea-los aqui nao
 * inventa numero — o numero e o do legado; o que o alvo acrescenta e o nome, e
 * sem nome nao ha o *"ponto de configuracao nomeado"* que o P6 pede.
 *
 * ## Qual e o "ponto de configuracao", na forma do legado
 *
 * **E uma constante, nao uma opcao e nao um ponto de extensao.**
 * `WP_CRON_LOCK_TIMEOUT` se altera redefinindo-a antes do arranque (em
 * `wp-config.php`), e nao existe `apply_filters` sobre ela em lugar nenhum da
 * arvore: nao ha, no produto, forma de uma extensao mudar este prazo em
 * execucao. Logo o ponto de configuracao equivalente no alvo e o **argumento da
 * composicao** (`criarModuloDeTrabalhoAgendado`), resolvido antes do primeiro
 * uso — o mesmo desenho que `retencao-e-descarte/configuracao/prazo-de-retencao.ts`
 * adotou para `EMPTY_TRASH_DAYS`, pela mesma razao. Dar-lhe um ponto de extensao
 * aqui seria **acrescentar** contrato publico que o legado nao tem.
 *
 * Os dez minutos nao tem nem isso: nao ha como alterar a expressao de
 * `wp-includes/cron.php:917` sem editar o arquivo. Eles entram no mesmo registro
 * por simetria de leitura, e quem compuser o modulo os deixa no valor de fabrica
 * a nao ser que esteja reproduzindo uma arvore editada.
 *
 * ## 🔴 O descarte de 10 minutos e para a trava ADIANTADA, nao para a velha
 *
 * Esta e a leitura em que um porte apressado troca o produto, e por isso ela esta
 * escrita aqui e afirmada no teste. A prosa do pacote diz *"descartado se passar
 * de 10 minutos"* — `spec.md`, BR-MIGRAR-053 e UC-39 usam as mesmas palavras —, e
 * quem le isso naturalmente entende *"trava com mais de 10 minutos de idade e
 * descartada"*. **Nao e o que o codigo faz.** `wp-includes/cron.php:917`:
 *
 * ```php
 * $lock = (float) get_transient( 'doing_cron' );
 *
 * if ( $lock > $gmt_time + 10 * MINUTE_IN_SECONDS ) {
 *     $lock = 0;
 * }
 * ```
 *
 * A comparacao e `$lock > $gmt_time + 600`: descarta-se a trava que esta **mais
 * de dez minutos no FUTURO** — o retrato de um relogio que andou para tras ou de
 * uma trava gravada por uma maquina adiantada. Trava **velha** nao e descartada
 * por esta linha e nao precisa ser: a de baixo, de 60 segundos, ja a deixa
 * passar. Uma trava de uma hora atras libera o disparo pela linha `:922`, nao
 * pela `:917`.
 *
 * O **P1** decide qual das duas leituras vale: *"o comportamento observavel do
 * legado e a especificacao"*, e a ancora e o codigo. Nao e divergencia que
 * precise de decisao humana — a prosa do pacote e descricao imprecisa do mesmo
 * `:917`, nao uma segunda regra —, mas e armadilha o bastante para ficar
 * registrada aqui, no teste de borda e no `README.md` do modulo.
 *
 * ## Os dois freios sao DOIS, e nao se unificam
 *
 * O mesmo numero de 60 segundos e cobrado em dois lugares, com aritmetica
 * diferente, e as duas chegam neste arquivo com nome proprio:
 *
 * | onde | o que faz | ancora |
 * |---|---|---|
 * | antes de **emitir** o disparo | descarta a trava adiantada, depois recusa se a trava tem menos de 60 s | `wp-includes/cron.php:915`-`924` |
 * | ao **tomar** a trava no endpoint | recusa se a trava e verdadeira no PHP **e** tem menos de 60 s; **nao** descarta adiantada | `wp-cron.php:98` |
 *
 * Unifica-las apagaria o caso em que a trava adiantada libera o emissor e
 * continua travando o endpoint. A leitura dos valores — a verdade do PHP e a
 * conversao para numero — e de `../fila/trava-do-disparo.ts`; aqui ficam os
 * numeros e a aritmetica deles.
 */

/** Segundos num minuto: o `MINUTE_IN_SECONDS` do legado (`:158`). */
export const SEGUNDOS_POR_MINUTO = 60;

/**
 * Os dois numeros da trava da fila.
 *
 * Em segundos, que e a unidade dos dois lados da comparacao no legado: a trava
 * guardada e um instante Unix com fracao, e o relogio contra o qual ela e medida
 * e `microtime( true )`.
 */
export interface TravaDaFila {
  /**
   * Quanto tempo a trava vale — o `WP_CRON_LOCK_TIMEOUT` do legado
   * (`wp-includes/default-constants.php:399`).
   *
   * Nao e prazo de armazenamento: a trava e gravada **sem** validade
   * (`set_transient( 'doing_cron', $doing_wp_cron )`, sem o terceiro argumento,
   * `wp-includes/cron.php:959`). Os 60 segundos sao aritmetica feita na leitura,
   * e e por isso que a trava sobrevive a quem a tomou quando a execucao e
   * abandonada (`wp-cron.php:194`-`195`). Ver `../portas/porta-de-cache.ts`.
   */
  readonly tempoLimiteEmSegundos: number;
  /**
   * A partir de quanto **adiantamento** a trava e descartada — os
   * `10 * MINUTE_IN_SECONDS` de `wp-includes/cron.php:917`.
   *
   * 🔴 E adiantamento, nao idade. Ver a secao do cabecalho deste arquivo.
   */
  readonly descarteDoAdiantamentoEmSegundos: number;
}

/**
 * Os valores de fabrica do legado: 60 segundos de trava
 * (`wp-includes/default-constants.php:399`) e descarte da trava adiantada em mais
 * de 600 segundos (`wp-includes/cron.php:917`).
 */
export const TRAVA_DA_FILA_DE_FABRICA: TravaDaFila = {
  tempoLimiteEmSegundos: SEGUNDOS_POR_MINUTO,
  descarteDoAdiantamentoEmSegundos: 10 * SEGUNDOS_POR_MINUTO,
};

/**
 * A trava, depois do descarte da adiantada — a linha `:917` do legado.
 *
 * ```php
 * if ( $lock > $gmt_time + 10 * MINUTE_IN_SECONDS ) {
 *     $lock = 0;
 * }
 * ```
 *
 * **A borda e `>`, nao `>=`**: a trava exatamente dez minutos adiantada **nao** e
 * descartada. Devolve o numero que a linha seguinte vai usar — zero quando
 * descartada —, e nao um booleano, porque e isso que o legado faz: ele reescreve
 * `$lock`, e `0` e o valor que destrava a comparacao de baixo.
 *
 * O instante chega por argumento, e nao do relogio: e o que torna a borda
 * conferivel com relogio controlado, como a entrega de T002 exige.
 */
export function travaDepoisDoDescarteDeAdiantada(
  travaEmSegundos: number,
  agoraEmSegundosFracionarios: number,
  trava: TravaDaFila = TRAVA_DA_FILA_DE_FABRICA,
): number {
  if (
    travaEmSegundos >
    agoraEmSegundosFracionarios + trava.descarteDoAdiantamentoEmSegundos
  ) {
    return 0;
  }
  return travaEmSegundos;
}

/**
 * Se a trava impede um novo disparo — a linha `:922` do legado.
 *
 * ```php
 * // Don't run if another process is currently running it or more than once every 60 sec.
 * if ( $lock + WP_CRON_LOCK_TIMEOUT > $gmt_time ) {
 *     return false;
 * }
 * ```
 *
 * **A borda e `>`, e e ela que o P6 cobra:** no instante `trava + 60` a
 * comparacao e falsa e o disparo passa; um instante antes, recusa. Logo 60
 * segundos e o tempo que a trava **vale**, e nao o tempo depois do qual ela vale.
 *
 * ⚠️ **Com relogio perto de zero, trava ausente recusa.** Trava ausente entra
 * aqui como `0` (e o que `(float) false` devolve), e `0 + 60 > agora` e
 * verdadeiro para qualquer `agora` menor que 60. O legado faz isto e nao tem
 * guarda nenhuma contra isto; num instante Unix de verdade a situacao nao
 * acontece, e em teste ela acontece com facilidade — por isso os testes desta
 * feature usam instante Unix realista, e nao `0`.
 */
export function travaBloqueiaNovoDisparo(
  travaEmSegundos: number,
  agoraEmSegundosFracionarios: number,
  trava: TravaDaFila = TRAVA_DA_FILA_DE_FABRICA,
): boolean {
  return (
    travaEmSegundos + trava.tempoLimiteEmSegundos > agoraEmSegundosFracionarios
  );
}
