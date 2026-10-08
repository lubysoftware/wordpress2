/**
 * As quatro portas que o modulo de interacao publica declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa, e
 * nao ao contexto vizinho que declara portas parecidas: AD-08 de
 * `target_architecture.md` poe a porta na borda, e AD-10 proibe um contexto
 * importar outro no topo do modulo. E por isso que `PortaDeDados`,
 * `PortaDeRelogio` e `PortaDeEmail` reaparecem aqui com a mesma forma que
 * `BC-05` declara nas dele: a ligacao horizontal entre contextos e justamente o
 * que a regra de dependencia recusa.
 *
 * O cenario `@composicao` de
 * `.specify/migration/parity_tests/01-cascata-de-moderacao-de-comentario.feature`
 * cobra o que estas quatro existem para permitir: *"a cadeia de decisao
 * exercitada com as cinco portas de infraestrutura substituidas por duplo"*,
 * chegando a decisao identica a do oraculo. Sem porta nao ha duplo, e sem duplo
 * aquele cenario nao roda.
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

export type {
  PedidoExterno,
  PortaDeClienteExterno,
  RespostaExterna,
  ResultadoExterno,
} from './porta-de-cliente-externo.js';
