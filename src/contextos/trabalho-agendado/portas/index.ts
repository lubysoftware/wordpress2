/**
 * As quatro portas que o modulo de trabalho agendado declara — dados, relogio,
 * cache e cliente externo —, pedidas pelo nome por **T001** de
 * `.specify/specs/011-trabalho-agendado/tasks.md`.
 *
 * Tres delas estao entre as cinco de AD-08 (dados, cache de objeto, HTTP); o
 * relogio nao esta, e o motivo de ele existir aqui mesmo assim esta no cabecalho
 * de `porta-de-relogio.ts`.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa: e
 * o que a regra de dependencia 4 de `target_architecture.md` exige —
 * *"`contextos/` ou `plataforma/` para adaptador concreto: proibido. So pela
 * porta"*.
 *
 * **As portas sao sincronas** (AD-04): `adaptadores/` e assincrono, `contextos/`
 * e `plataforma/` sao sincronos, e a I/O e resolvida antes de entrar no dominio
 * ou exposta por fachada sincrona. Nesta feature isso e mais do que estilo — ver
 * a secao 🔴 de `porta-de-cliente-externo.ts`: numa runtime assincrona o disparo
 * pode **completar**, e e a falha dele que AD-07 poe no criterio de aceite.
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
  PortaDeCache,
  ResultadoDeCache,
  ValorDeCache,
} from './porta-de-cache.js';

export type {
  PedidoDeDisparo,
  PortaDeClienteExterno,
  ResultadoDeDisparo,
} from './porta-de-cliente-externo.js';
