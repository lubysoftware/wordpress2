/**
 * As portas que o modulo de conteudo declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa:
 * e o que a regra de dependencia 4 de `target_architecture.md` exige —
 * "`contextos/` ou `plataforma/` para `adaptadores/` concreto: proibido. So
 * pela porta".
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';

export type {
  MensagemDeEmail,
  PortaDeEmail,
  ResultadoDeEnvio,
} from './porta-de-email.js';

export type { PortaDeRelogio } from './porta-de-relogio.js';
