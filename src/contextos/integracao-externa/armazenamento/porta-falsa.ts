/**
 * Porta de dados de teste deste modulo: registra o que foi pedido e devolve o
 * que foi programado. Entrega de **T007** (US-3).
 *
 * Registra comando em vez de simular banco, como as portas falsas de BC-01,
 * BC-05 e BC-11 — e aqui o caso que so isso afirma e regra de US-3: **com a
 * credencial no ambiente, o valor guardado e ignorado** (CA-3.2), e no legado
 * "ignorado" quer dizer que `get_option()` **nem e chamado**
 * (`wp-includes/connectors.php:449` retorna antes de `:462`). Lista de selecoes
 * vazia e a afirmacao; um banco de mentira a esconderia.
 *
 * Fica em arquivo de fonte, e nao de teste, porque a suite de T008 (UT-152-1 a
 * UT-152-8) afirma pelos mesmos meios.
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
} from '../portas/index.js';

export interface PortaDeDadosFalsa {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly selecoes: Consulta[];
  /** Programa a proxima resposta de leitura. Sem programacao, nenhuma linha. */
  responder(linhas: readonly LinhaDeResultado[]): void;
}

export interface OpcoesDaPortaDeDadosFalsa {
  readonly prefixoDeTabela?: string;
}

export function criarPortaDeDadosFalsa(
  opcoes: OpcoesDaPortaDeDadosFalsa = {},
): PortaDeDadosFalsa {
  const selecoes: Consulta[] = [];
  const respostas: (readonly LinhaDeResultado[])[] = [];

  return {
    porta: {
      prefixoDeTabela: opcoes.prefixoDeTabela ?? 'wp_',
      selecionar(consulta) {
        selecoes.push(consulta);
        return respostas.shift() ?? [];
      },
    },
    selecoes,
    responder(linhas) {
      respostas.push(linhas);
    },
  };
}
