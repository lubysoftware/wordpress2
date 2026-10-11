/**
 * Porta de dados de teste: registra o que foi pedido e devolve o que foi
 * programado.
 *
 * Por que uma porta que **registra comando** em vez de um banco de mentira: o
 * criterio de aceite desta area e *"efeito no banco"* (area 3 da Decisao 2 de
 * `parity_specs.md`), e o que `parity_specs.md` manda comparar e *"snapshot +
 * sequencia de comandos"*. O que se tem de afirmar e exatamente **qual comando
 * sai, com quais parametros e com quais bytes** — inclusive o caso em que o
 * legado **nao emite comando nenhum**, e nesta feature esse caso e regra escrita
 * em tres lugares:
 *
 * - a exclusao de marcador cujo `SELECT meta_id` nao devolve linha **nao emite
 *   `DELETE`** (`wp-includes/meta.php:468`), que e o caso comum de US-7;
 * - a restauracao de comentarios sem o marcador agrupado encerra sem emitir
 *   `UPDATE` (`wp-includes/post.php:4342`), que e a borda de UT-048-6;
 * - a guarda de identificador recusa antes de consultar
 *   (`wp-includes/meta.php:47`).
 *
 * Um banco de mentira esconderia justamente esses tres.
 *
 * Fica em arquivo de fonte, e nao de teste, porque T003 em diante vai precisar
 * dela: as suites das historias (T004, T006, T008 …) afirmam efeito no banco
 * pelos mesmos meios.
 *
 * E a gemea da de BC-01, com **uma** diferenca: nao ha `prefixoBaseDeTabela`,
 * porque a porta deste contexto nao o declara — as duas tabelas desta feature
 * sao de escopo por site (ver `chaves-e-tabelas.ts`).
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
} from '../portas/index.js';

export interface PortaDeDadosFalsa {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly selecoes: Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
  /** Programa a proxima resposta de leitura. */
  responder(linhas: readonly LinhaDeResultado[]): void;
}

export interface OpcoesDaPortaFalsa {
  readonly prefixoDeTabela?: string;
  readonly resultadoDeEscrita?: ResultadoDeEscrita;
}

export function criarPortaDeDadosFalsa(
  opcoes: OpcoesDaPortaFalsa = {},
): PortaDeDadosFalsa {
  const prefixoDeTabela = opcoes.prefixoDeTabela ?? 'wp_';
  const resultadoDeEscrita = opcoes.resultadoDeEscrita ?? {
    linhasAfetadas: 1,
    idGerado: 7,
  };

  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];
  const respostas: (readonly LinhaDeResultado[])[] = [];

  return {
    porta: {
      prefixoDeTabela,
      selecionar(consulta) {
        selecoes.push(consulta);
        return respostas.shift() ?? [];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return resultadoDeEscrita;
      },
    },
    selecoes,
    escritas,
    responder(linhas) {
      respostas.push(linhas);
    },
  };
}

/** O valor de um parametro de escrita como texto, para afirmar bytes. */
export function textoDoParametro(valor: unknown): string {
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return String(valor);
}
