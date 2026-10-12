/**
 * O armazenamento desta feature: as **duas linhas** da tabela de opcoes em que a
 * fila e a trava moram. Entrega de **T002**.
 *
 * *satisfaz:* — (infraestrutura).
 *
 * Nao ha tabela desta feature e nao ha DDL aqui: `plan.md` registra que a fila e
 * *"uma unica linha de configuracao"*, e a trava e outra. Ver
 * `chaves-e-tabelas.ts`.
 *
 * **Compor isto nao toca em porta nenhuma** — monta nome de tabela e nada mais, e
 * `../modulo.test.ts` afirma isso (`EXT-ORDEM`, BR-MIGRAR-106: trabalho feito na
 * importacao e trabalho fora da ordem de arranque, que e contrato publico).
 */

import type { PortaDeCache, PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDaFila,
  type RepositorioDaFila,
} from './fila-em-opcao.js';
import {
  criarRepositorioDaTrava,
  type RepositorioDaTrava,
} from './trava-em-transiente.js';

export {
  CARREGAMENTO_AUTOMATICO_LIGADO,
  GRUPO_DE_TRANSIENTE,
  NOME_DA_TRAVA,
  OPCAO_DA_FILA,
  OPCAO_DA_TRAVA,
  OPCAO_DE_PRAZO_DA_TRAVA,
  tabelaDeOpcoes,
} from './chaves-e-tabelas.js';

export {
  comoTexto,
  comoTextoOuBytes,
  mesmosBytes,
  primeiraLinha,
} from './leitura-de-linha.js';

export {
  criarRepositorioDaFila,
  type LeituraDaFila,
  type RepositorioDaFila,
} from './fila-em-opcao.js';

export {
  SEM_VALIDADE,
  criarRepositorioDaTrava,
  type RepositorioDaTrava,
} from './trava-em-transiente.js';

export {
  criarPortaDeCacheFalsa,
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeCacheFalsa,
  type PortaDeDadosFalsa,
  type ToqueDeCache,
} from './porta-falsa.js';

/** As duas moradas, compostas sobre as portas. */
export interface ArmazenamentoDeTrabalhoAgendado {
  /** A linha `cron`: a fila inteira, lida e regravada como um valor so. */
  readonly fila: RepositorioDaFila;
  /** A linha `_transient_doing_cron`, ou a chave `doing_cron` do cache. */
  readonly trava: RepositorioDaTrava;
}

export function criarArmazenamentoDeTrabalhoAgendado(
  dados: PortaDeDados,
  cache: PortaDeCache,
): ArmazenamentoDeTrabalhoAgendado {
  return {
    fila: criarRepositorioDaFila(dados),
    trava: criarRepositorioDaTrava(dados, cache),
  };
}
