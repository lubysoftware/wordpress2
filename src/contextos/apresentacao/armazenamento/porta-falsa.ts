/**
 * Porta de dados de teste: registra o que foi pedido e devolve o que foi
 * programado.
 *
 * Entrega de **T002** da feature `009-apresentacao-e-personalizacao`.
 *
 * Por que uma porta que **registra comando** em vez de um banco de mentira: o
 * criterio desta area e *"efeito no banco"* (Decisao 2 de `parity_specs.md`,
 * area 3), e o que ela manda comparar e *"snapshot + sequencia de comandos"*.
 * Nesta feature `LACUNA-IN-12` aponta exatamente para ca: *"trocar o tema ativo
 * **escreve opcao** — e area 3"*, e o que falta nela e *"cenario que verifique o
 * efeito no banco"*. O que se tem de afirmar e qual comando sai, com quais
 * parametros e com quais bytes — inclusive os casos em que o legado **nao emite
 * comando nenhum**, que neste armazenamento sao tres: gravar opcao com o valor
 * que ja esta gravado (`wp-includes/option.php:923`), apagar opcao que nao
 * existe (`:1215`-`:1217`) e pedir carga automatica que a linha ja tem
 * (`:445`-`:447`). Um banco de mentira esconderia justamente esses tres.
 *
 * Fica em arquivo de fonte, e nao de teste, porque T003 em diante vai precisar
 * dela: as suites das historias (T004, T006, T008 …) afirmam efeito no banco
 * pelos mesmos meios. O duplo da porta de cliente externo continua em
 * `modulo.test.ts` enquanto nenhuma tarefa de historia o compartilhar.
 *
 * E a gemea das de BC-01, BC-03 e BC-04, e a repeticao tem a mesma causa que a
 * de `leitura-de-linha.ts`: a regra de dependencia 3 proibe importar outro
 * contexto, e o tipo da porta e o deste modulo.
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

/** O valor de um parametro como texto, para afirmar bytes. */
export function textoDoParametro(valor: unknown): string {
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return String(valor);
}
