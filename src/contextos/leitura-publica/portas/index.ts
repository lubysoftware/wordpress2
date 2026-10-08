/**
 * As portas que o modulo de leitura publica declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa:
 * e o que a regra de dependencia 4 de `target_architecture.md` exige —
 * "`contextos/` ou `plataforma/` para `adaptadores/` concreto: proibido. So
 * pela porta".
 *
 * T001 declara **uma**: a de dados, que e a que a entrega desta tarefa nomeia.
 * As outras bordas que o `plan.md` desta feature lista por slot — o cache por
 * requisicao, o servidor HTTP e a analise de HTML — nao estao aqui porque
 * nenhuma tarefa fechada as usa, e porta declarada antes do uso e porta
 * adivinhada.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';
