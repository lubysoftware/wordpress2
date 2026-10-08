/**
 * As tres portas que o modulo de retencao e descarte declara — dados, relogio e
 * fila agendada —, pedidas pelo nome por **T001** de
 * `.specify/specs/005-retencao-e-descarte/tasks.md`.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa: e
 * o que a regra de dependencia 4 de `target_architecture.md` exige — *"`contextos/`
 * ou `plataforma/` para `adaptadores/` concreto: proibido. So pela porta"*.
 *
 * **As portas sao sincronas** (AD-04): `adaptadores/` e assincrono, `contextos/` e
 * `plataforma/` sao sincronos, e a I/O e resolvida antes de entrar no dominio ou
 * exposta por fachada sincrona. `await` no dominio contamina o chamador e muda a
 * ordem de emissao, que AD-03 poe no contrato observavel.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';

export type { PortaDeRelogio } from './porta-de-relogio.js';

export type {
  EventoRecorrente,
  NomeDeRecorrencia,
  PortaDeFilaAgendada,
  ResultadoDeAgendamento,
} from './porta-de-fila-agendada.js';
