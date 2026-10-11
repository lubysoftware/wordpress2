/**
 * As quatro portas que o modulo de privacidade declara — tarefa **T001** da
 * feature `008-privacidade-e-dados-pessoais`.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa, e
 * nao ao contexto vizinho que declara portas parecidas: AD-08 de
 * `target_architecture.md` poe a porta na borda, e AD-10 proibe um contexto
 * importar outro no topo do modulo. E por isso que `PortaDeDados`,
 * `PortaDeRelogio` e `PortaDeEmail` reaparecem aqui com a mesma forma que
 * `BC-03`, `BC-04` e `BC-05` declaram nas deles: a ligacao horizontal entre
 * contextos e justamente o que a regra de dependencia 3 recusa.
 *
 * Por que estas quatro, e nao outras, esta em `../README.md`.
 *
 * O Contexto de
 * `.specify/migration/parity_tests/12-solicitacao-de-dado-pessoal.feature` cobra
 * o que elas existem para permitir: um oraculo *"com relogio controlavel"*, *"o
 * envio de e-mail falhando na porta de e-mail"* e o Parallel Run **permanente**
 * desta fatia. Sem porta nao ha duplo, e sem duplo nenhum daqueles cenarios
 * roda.
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
  MensagemDeEmail,
  PortaDeEmail,
  ResultadoDeEnvio,
} from './porta-de-email.js';

export type {
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
} from './porta-de-sistema-de-arquivos.js';
