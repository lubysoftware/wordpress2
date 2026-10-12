/**
 * As quatro unidades de tempo do legado, que e de onde sai todo prazo desta
 * feature.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`.
 *
 * `wp-includes/default-constants.php:158` a `:163` define as constantes por
 * multiplicacao, e a derivacao importa porque o legado **nao escreve segundo
 * nenhum**: `A6` reagenda em `time() + HOUR_IN_SECONDS`
 * (`wp-admin/includes/class-wp-automatic-updater.php:857`), o aviso de `A10`
 * limita em `DAY_IN_SECONDS` (`wp-includes/class-wp-recovery-mode.php:307`) e o
 * cookie de recuperacao vale `WEEK_IN_SECONDS`
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php:46`).
 *
 * O P6 e literal sobre a forma: *"cada numero vive num ponto de configuracao
 * nomeado, com o valor de fabrica do legado"*. Nenhum arquivo desta feature le
 * `3600`, `86400` ou `604800` de dentro de uma expressao.
 *
 * ⚠️ **`YEAR_IN_SECONDS` nao esta aqui, e e proposito.** Ele aparece nesta
 * feature uma vez so, para **vencer** o cookie de recuperacao ao sair
 * (`setcookie( ..., time() - YEAR_IN_SECONDS, ... )`,
 * `class-wp-recovery-mode-cookie-service.php:63`), e isso e borda de cabecalho
 * HTTP, nao configuracao: a tela entra como dado e a montagem e da borda. Quem
 * portar a saida da sessao (T025) o traz consigo.
 */

/** `MINUTE_IN_SECONDS` (`wp-includes/default-constants.php:158`). */
export const SEGUNDOS_POR_MINUTO = 60;

/** `HOUR_IN_SECONDS` (`wp-includes/default-constants.php:159`). */
export const SEGUNDOS_POR_HORA = 60 * SEGUNDOS_POR_MINUTO;

/** `DAY_IN_SECONDS` (`wp-includes/default-constants.php:160`). */
export const SEGUNDOS_POR_DIA = 24 * SEGUNDOS_POR_HORA;

/** `WEEK_IN_SECONDS` (`wp-includes/default-constants.php:161`). */
export const SEGUNDOS_POR_SEMANA = 7 * SEGUNDOS_POR_DIA;
