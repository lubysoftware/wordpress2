/**
 * A fila agendada como dado: a forma dela e o valor vazio.
 *
 * Hoje ha **um** arquivo, e e o que T001 entrega. O que vem depois entra na
 * tarefa que o implementa, e nao antes:
 *
 * | o que | tarefa |
 * |---|---|
 * | gravar e ler a fila no ponto de configuracao do legado, e a trava de 60 s com descarte depois de 10 min | **T002** |
 * | avancar a fila por gatilho | **T003** (US-1) — 🔴 em conflito aberto, ver `spec.md` |
 * | exclusao entre processos | **T005** (US-2) |
 * | reagendar o recorrente antes de executar | **T011** (US-5) |
 *
 * Nenhum numero mora nesta pasta hoje, de proposito: o **P6** manda que cada
 * numero viva no ponto de configuracao da tarefa que o implementa, com o teste
 * de borda dele. Numero que aparece antes da tarefa e numero sem teste de borda.
 */

export {
  FILA_VAZIA,
  type FilaAgendada,
  type GanchoNaFila,
  type InstanteDaFila,
  type NomeDeRecorrencia,
  type OcorrenciaNaFila,
} from './fila-agendada.js';
