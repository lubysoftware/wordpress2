/**
 * A unica porta que o registro de operacao declara em **T002**.
 *
 * Uma so, e as outras quatro bordas de AD-08 nao tem nada a fazer aqui: o
 * registro nao consulta servico externo, nao envia e-mail e nao usa cache de
 * objeto — que, durante a coexistencia, esta *"DESLIGADA nas duas metades"*
 * (`target_architecture.md`, componentes).
 *
 * ⚠️ **Nao ha porta de relogio, e nao vai haver.** AD-08 declara cinco bordas, e
 * relogio nao e uma delas: o instante chega **no evento**, por argumento. Ver
 * `../evento-de-operacao.ts`.
 *
 * A porta pertence ao modulo que a consome, nao ao adaptador que a implementa:
 * regra de dependencia 4 de `target_architecture.md`.
 */

export type {
  EventoDeOperacao,
  Origem,
  RecorteDeConsulta,
  Severidade,
  ValorDeContexto,
} from '../evento-de-operacao.js';

export type { PortaDeCanal } from './porta-de-canal.js';
