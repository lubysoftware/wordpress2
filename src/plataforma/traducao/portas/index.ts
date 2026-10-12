/**
 * A unica porta que a traducao declara em **T002**.
 *
 * E a borda do **sistema de arquivos**, uma das cinco de AD-08, e ela existe
 * porque o catalogo e arquivo. Ela **nao** e uma porta de traducao: AD-08
 * recusou essa por escrito, e `./porta-de-catalogo.ts` explica a diferenca
 * antes de qualquer tarefa tropecar nela.
 *
 * A outra borda que US-4 toca — baixar e instalar catalogo novo, que e a de HTTP
 * — nao e declarada aqui: no legado isso e o mecanismo de instalacao de UC-33,
 * com a capacidade `install_languages` como portao, e nenhuma tarefa desta
 * feature o constroi. Ver `../README.md`.
 *
 * A porta pertence ao modulo que a consome, nao ao adaptador que a implementa:
 * regra de dependencia 4 de `target_architecture.md`.
 */

export type {
  Dominio,
  Idioma,
  PedidoComContexto,
  PedidoComPlural,
  PedidoComPluralEContexto,
  PedidoDeTexto,
  PedidoDeTraducao,
} from '../pedido-de-traducao.js';

export type { BytesDeCatalogo, PortaDeCatalogo } from './porta-de-catalogo.js';
