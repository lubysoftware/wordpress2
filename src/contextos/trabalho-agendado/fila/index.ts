/**
 * A fila agendada como dado: a forma dela, a estrutura gravada e a trava do
 * disparo.
 *
 * Tarefas fechadas aqui: **T001** (`fila-agendada.ts` — a forma e o valor vazio)
 * e **T002** (`estrutura-gravada.ts`, `comparacao-natural.ts` e
 * `trava-do-disparo.ts`). O que vem depois entra na tarefa que o implementa, e
 * nao antes:
 *
 * | o que | tarefa |
 * |---|---|
 * | ~~gravar e ler a fila no ponto de configuracao do legado, e a trava de 60 s com descarte depois de 10 min~~ | **T002** — fechada; a morada esta em `../armazenamento/` |
 * | avancar a fila por gatilho | **T003** (US-1) — 🔴 em conflito aberto, ver `spec.md` |
 * | exclusao entre processos | **T005** (US-2) |
 * | reagendar o recorrente antes de executar | **T011** (US-5) |
 *
 * Os numeros desta pasta sao os dois da trava, e eles **nao** moram aqui: o
 * **P6** manda que cada numero viva num ponto de configuracao nomeado, e o deles
 * e `../configuracao/trava-da-fila.ts`. Numero que aparece antes da tarefa dele e
 * numero sem teste de borda.
 */

export {
  FILA_VAZIA,
  type FilaAgendada,
  type GanchoNaFila,
  type InstanteDaFila,
  type NomeDeRecorrencia,
  type OcorrenciaNaFila,
} from './fila-agendada.js';

export {
  CHAVE_DA_RECORRENCIA,
  CHAVE_DA_VERSAO,
  CHAVE_DOS_ARGUMENTOS,
  CHAVE_DO_INTERVALO,
  ESTRUTURA_VAZIA,
  VERSAO_DA_FILA,
  agendarNaEstrutura,
  chaveDaOcorrencia,
  converterEstruturaDaVersao1,
  desagendarNaEstrutura,
  estruturaDaFila,
  estruturaSemVersao,
  filaDaEstrutura,
  ordenarInstantes,
  valorDaEstruturaGravada,
  valorDaOcorrencia,
  vazioComoNoPhp,
  versaoNaEstrutura,
  type EstruturaDaFila,
  type OcorrenciaParaGravar,
} from './estrutura-gravada.js';

export { compararNaturalSemCaixa } from './comparacao-natural.js';

export {
  CASAS_DECIMAIS_DA_CHAVE_DA_TRAVA,
  TRAVA_AUSENTE_NO_CACHE,
  TRAVA_AUSENTE_SEM_CACHE,
  chaveDaTrava,
  mesmaChaveDeTrava,
  travaComoDecimalDoPhp,
  travaEhVerdadeiraNoPhp,
  travaImpedeEmitirDisparo,
  travaImpedeTomarNoEndpoint,
  type TravaLida,
} from './trava-do-disparo.js';
