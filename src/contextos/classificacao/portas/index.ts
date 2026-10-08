/**
 * As portas que o modulo de classificacao declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa:
 * e o que a regra de dependencia 4 de `target_architecture.md` exige —
 * "`contextos/` ou `plataforma/` para `adaptadores/` concreto: proibido. So
 * pela porta".
 *
 * **E uma porta so, e isso e leitura do plano, nao economia.** `plan.md` desta
 * feature lista tres slots de tecnologia: `persistencia`,
 * `serializacao-de-valor-persistido` e `cache`. Nenhum dos dois ultimos vira
 * porta aqui:
 *
 * - a **serializacao** e slot de *formato de dado*, nao de infraestrutura, e ja
 *   existe como modulo puro em `plataforma/serializacao/` — a regra de
 *   dependencia 1 permite `contextos/` para `plataforma/`, logo quem precisar
 *   dela importa, sem porta no meio;
 * - o **cache de objeto** e uma das cinco portas de AD-08, mas a borda 5 de
 *   `target_architecture.md` manda que **nenhuma** metade o use durante a
 *   coexistencia, e o default de fabrica decidido para o slot e nao persistir
 *   nada entre requisicoes. Declara-lo aqui, em T001, seria declarar porta sem
 *   chamador.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';
