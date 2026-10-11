/**
 * Barril da area de despacho — o registro de rotas e o despachante que o carrega.
 *
 * Entrega de **T001**. O casamento de caminho e metodo (T003), o formato de
 * declaracao de rota e o de operacao nomeada (T002) e a validacao de parametro
 * (T005) entram nesta pasta, nas tarefas delas.
 */

export {
  criarRegistroDeRotas,
  type DeclaracaoDeOpcaoDeRota,
  type DeclaracaoDeRota,
  type MapaDeRotas,
  type OpcoesDaRota,
  type RegistroDeRotas,
} from './registro-de-rotas.js';

export {
  criarDespachanteDeRotas,
  type DespachanteDeRotas,
} from './despachante-de-rotas.js';
