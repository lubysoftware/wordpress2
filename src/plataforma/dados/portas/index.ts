/**
 * A unica porta que a camada de dados declara em **T002**.
 *
 * Uma so, e a conta fecha: das cinco bordas de AD-08, a de dados e a **deste**
 * modulo; as outras quatro pertencem a quem as consome, e nenhuma regra desta
 * pasta fala com HTTP, disco, cache de objeto nem e-mail.
 *
 * A porta pertence ao modulo que a consome, nao ao adaptador que a implementa:
 * regra de dependencia 4 de `target_architecture.md`.
 */

export type { Consulta, LinhaDeResultado, ResultadoDeEscrita, ValorDeColuna, ValorDeParametro } from '../consulta.js';

export type { PortaDeDriver, ResultadoDoDriver } from './porta-de-driver.js';
