/**
 * Os pontos de configuracao nomeados desta feature.
 *
 * Hoje ha **um**, que e o que T002 entrega: a trava da fila, com os dois numeros
 * do legado (60 segundos de trava, descarte da trava adiantada em mais de 10
 * minutos). Os outros numeros desta feature entram nas tarefas que os
 * implementam, cada um com o seu teste de borda, como o **P6** exige:
 *
 * | numero | onde esta no legado | tarefa |
 * |---|---|---|
 * | tempo limite do disparo, 0,01 s | `wp-includes/cron.php:990` | **T003** (US-1) — 🔴 conflito aberto |
 * | os quatro intervalos de recorrencia de fabrica | `wp-includes/cron.php:1134`-`1151` | **T011** (US-5) |
 * | a janela de dez minutos do evento duplicado | `wp-includes/cron.php:135`-`145` | de quem portar `wp_schedule_single_event()` |
 *
 * Numero que aparece antes da tarefa dele e numero sem teste de borda.
 */

export {
  SEGUNDOS_POR_MINUTO,
  TRAVA_DA_FILA_DE_FABRICA,
  travaBloqueiaNovoDisparo,
  travaDepoisDoDescarteDeAdiantada,
  type TravaDaFila,
} from './trava-da-fila.js';
