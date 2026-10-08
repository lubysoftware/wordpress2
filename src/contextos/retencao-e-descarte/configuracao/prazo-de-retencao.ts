/**
 * O ponto de configuracao nomeado do prazo de retencao da lixeira, com o valor de
 * fabrica do legado — a segunda metade da entrega de **T001**.
 *
 * O **P6** da constituicao e a razao deste arquivo existir separado: *"cada numero
 * vive num ponto de configuracao nomeado, com o valor de fabrica do legado, e
 * existe teste que afirma o valor e o efeito da borda"*. O numero e a regra `R1`
 * (BR-MIGRAR-030): **lixeira de 30 dias, e desliga-la torna apagar
 * irreversivel.**
 *
 * ## O valor de fabrica, lido na arvore analisada
 *
 * `wp-includes/default-constants.php:388`:
 *
 * ```php
 * if ( ! defined( 'EMPTY_TRASH_DAYS' ) ) {
 *     define( 'EMPTY_TRASH_DAYS', 30 );
 * }
 * ```
 *
 * BR-MIGRAR-030 acrescenta o que o porte precisa saber: *"o valor da constante e
 * 🔴 desconhecido nesta instalacao; P1 manda portar o default de fabrica nomeando
 * o ponto que o altera"*. E o que este arquivo faz: 30 dias de fabrica, e o ponto
 * que o altera e a composicao do modulo.
 *
 * ## Qual e o "ponto de configuracao", na forma do legado
 *
 * **E uma constante, nao uma opcao e nao um ponto de extensao.** No legado
 * `EMPTY_TRASH_DAYS` se altera redefinindo-a antes do arranque (em
 * `wp-config.php`), e **nao** existe `apply_filters` sobre ela: nao ha, no
 * produto, forma de uma extensao mudar este prazo em execucao. Logo o ponto de
 * configuracao equivalente no alvo e o **argumento da composicao**
 * (`criarModuloDeRetencaoEDescarte`), resolvido antes do primeiro uso.
 *
 * Dar-lhe um ponto de extensao aqui seria **acrescentar** contrato publico que o
 * legado nao tem — o P2 protege o que existe, e inventar o que nao existe e a
 * mesma categoria de erro na direcao oposta. O prazo entra, portanto, como valor.
 *
 * ## O que NAO esta neste arquivo, e de quem e
 *
 * - **Os sete dias do rascunho automatico** (`R4`, BR-MIGRAR-033) sao de **T013**
 *   (US-6), e no legado eles **nao sao constante nenhuma**: o numero esta cravado
 *   dentro do SQL, `DATE_SUB( NOW(), INTERVAL 7 DAY ) > post_date`
 *   (`wp-includes/post.php:8377`), comparado com o relogio do **banco**. Declarar
 *   aqui um ponto de configuracao para ele seria inventar configuracao que o
 *   produto nao tem, o que o P6 recusa — ver a secao 🔴 de
 *   `../portas/porta-de-relogio.ts`.
 * - **`MEDIA_TRASH`** (`R3`, BR-MIGRAR-032), que decide se anexo vai para a
 *   lixeira e nasce `false` (`wp-includes/default-constants.php:134`), nao e
 *   prazo e nao e de T001. Ela pertence a quem portar o descarte de anexo, e a
 *   assimetria com o conteudo e decisao humana **ja tomada** (resposta 9: a
 *   exclusao de midia continua definitiva, sem lixeira e sem aviso), com REQ-051
 *   `bloqueado`.
 * - **A trava da fila** (60 segundos, descartada apos 10 minutos) e da feature
 *   `011-trabalho-agendado`.
 * - **A contagem do que a coleta apagou** (CA-5.5) **nao** tem prazo de retencao
 *   neste arquivo nem em nenhum outro, e isso e deliberado: `ESC-RETENCAO`
 *   (BR-MIGRAR-113) diz que *"o nucleo nao declara prazo de retencao nenhum, e
 *   porta-lo identico e nao inventar um"*, e a constituicao poe *"introduzir
 *   limite de taxa, prazo de retencao ou qualquer numero que o legado nao tem"* na
 *   tabela do que exige decisao humana. `spec.md` registra CA-5.5 como pergunta em
 *   aberto.
 */

/** Segundos num dia: o `DAY_IN_SECONDS` do legado. */
export const SEGUNDOS_POR_DIA = 86400;

/**
 * O prazo de retencao da lixeira.
 *
 * E **dias**, e nao segundos, porque e a unidade em que o legado o declara e a
 * unidade em que quem configura a instalacao o escreve. A conversao para segundos
 * mora em {@link instanteLimiteDeRetencao}, do mesmo jeito que no legado ela mora
 * dentro da coleta.
 */
export interface PrazoDeRetencao {
  /**
   * Dias que o conteudo descartado fica na lixeira antes de a coleta poder
   * apaga-lo em definitivo — o `EMPTY_TRASH_DAYS` do legado.
   *
   * **Zero tem significado proprio**: desliga a lixeira, e o pedido de descarte
   * passa a apagar em definitivo na primeira linha da operacao. Ver
   * {@link lixeiraEstaLigada}.
   */
  readonly diasNaLixeira: number;
}

/**
 * O valor de fabrica do legado: 30 dias
 * (`wp-includes/default-constants.php:388`).
 */
export const PRAZO_DE_RETENCAO_DE_FABRICA: PrazoDeRetencao = {
  diasNaLixeira: 30,
};

/**
 * Se esta instalacao tem lixeira.
 *
 * E a leitura da primeira linha de `wp_trash_post()`
 * (`wp-includes/post.php:4084`), que e onde o legado decide:
 *
 * ```php
 * function wp_trash_post( $post_id = 0 ) {
 *     if ( ! EMPTY_TRASH_DAYS ) {
 *         return wp_delete_post( $post_id, true );
 *     }
 * ```
 *
 * **O que esta funcao devolve, e o que ela nao faz.** Ela responde *"ha
 * lixeira?"*. **Apagar em definitivo quando a resposta e nao** e a operacao de
 * descarte — **T003** (US-1) e **T009** (US-4), com o aviso de irreversibilidade
 * que CA-4.2 cobra. T001 declara o numero e a borda dele; o efeito e da tarefa que
 * implementa a operacao.
 *
 * **Zero e o unico valor que desliga, e valor negativo NAO desliga.** Em PHP
 * `! EMPTY_TRASH_DAYS` e verdadeiro so para zero (e para os falsos equivalentes):
 * `define( 'EMPTY_TRASH_DAYS', -1 )` mantem a lixeira **ligada**, e a consequencia
 * aparece na coleta, onde o instante limite cai no **futuro** e tudo que esta na
 * lixeira vence de imediato. Nenhuma guarda foi acrescentada contra isso: o legado
 * nao tem nenhuma, e inventar validacao aqui mudaria comportamento observavel (P1).
 */
export function lixeiraEstaLigada(
  prazo: PrazoDeRetencao = PRAZO_DE_RETENCAO_DE_FABRICA,
): boolean {
  return prazo.diasNaLixeira !== 0;
}

/**
 * O instante limite da retencao: o descarte anterior a ele esta vencido.
 *
 * E o `$delete_timestamp` da coleta do legado, na mesma aritmetica e na mesma
 * unidade (`wp-includes/functions.php:6977`):
 *
 * ```php
 * $delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS );
 * ```
 *
 * **A comparacao NAO esta aqui, e e de T011.** No legado ela e
 * `meta_value < %d` — **estritamente menor** — sobre `_wp_trash_meta_time`
 * (`wp-includes/functions.php:6979` para conteudo, `:6997` para comentario), o que
 * significa que o registro descartado **exatamente** no instante limite ainda
 * **nao** vence. E a borda que CA-5.2 cobra em UT-052-2 (*"apaga em definitivo o
 * descartado ha mais tempo que o prazo e poupa o que esta no limite"*) e que
 * PT-004 cobra em *"o tempo avanca ate um dia antes do prazo / entao nenhuma das
 * duas o apaga"*. Fica escrito aqui para que T011 nao precise redescobrir o
 * operador — e para que ninguem o troque por `<=` em silencio.
 *
 * O instante chega por argumento, e nao do relogio: e o que torna a borda
 * conferivel com relogio controlado, como o P6 exige.
 */
export function instanteLimiteDeRetencao(
  agoraEmSegundos: number,
  prazo: PrazoDeRetencao = PRAZO_DE_RETENCAO_DE_FABRICA,
): number {
  return agoraEmSegundos - SEGUNDOS_POR_DIA * prazo.diasNaLixeira;
}
