/**
 * As quatro portas que o modulo de operacao do software declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa:
 * e o que a regra de dependencia 4 de `target_architecture.md` exige —
 * "`contextos/` ou `plataforma/` para adaptador concreto: proibido. So pela
 * porta". E sao redeclaradas aqui em vez de importadas de BC-03 ou de BC-05
 * porque AD-08 poe a porta no contexto que a consome e a regra de dependencia 3
 * (AD-10) proibe um contexto importar outro no topo do modulo.
 *
 * Quatro das cinco bordas de AD-08. A que falta e o **cache de objeto**, e a
 * ausencia e deliberada: nenhuma historia desta feature cacheia, e o cenario de
 * paridade de PT-013 roda com *"o cache de objeto desligado nas duas metades"*.
 *
 * Por que estas quatro, e nao outras, esta em `../README.md`.
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
  CredenciaisDeArquivo,
  EntradaDePasta,
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
  ResultadoDaConexao,
  TransporteDeArquivo,
} from './porta-de-sistema-de-arquivos.js';

export { TRANSPORTE_LOCAL } from './porta-de-sistema-de-arquivos.js';

export type {
  PedidoExterno,
  PortaDeClienteExterno,
  RespostaExterna,
  ResultadoDeDownload,
  ResultadoExterno,
} from './porta-de-cliente-externo.js';

export type {
  MensagemDeEmail,
  PortaDeEmail,
  ResultadoDeEnvio,
} from './porta-de-email.js';
