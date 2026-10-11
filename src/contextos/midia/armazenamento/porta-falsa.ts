/**
 * Porta de dados de teste: registra o que foi pedido e devolve o que foi
 * programado.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`.
 *
 * Por que uma porta que **registra consulta** em vez de um banco de mentira: o
 * criterio de aceite desta area e *"efeito no banco"* (Decisao 2 de
 * `parity_specs.md`, area 3), e o que `parity_specs.md` manda comparar e
 * *"snapshot + sequencia de comandos"*. O que se tem de afirmar e exatamente
 * **qual comando sai, com quais parametros e com quais bytes** — inclusive o
 * caso em que o legado **nao emite comando nenhum**, que e a regra 2 de
 * `metadado.ts` e o que acontece a cada derivada cujo metadado nao mudou. Um
 * banco de mentira esconderia justamente isso.
 *
 * E e o mesmo duplo que o cenario `@composicao` do teste de paridade desta
 * feature pede do outro lado — *"a porta de sistema de arquivos substituida por
 * duplo que registra cada operacao"*, com *"a sequencia de operacoes registrada
 * identica a do oraculo"*. Aqui o lado registrado e o banco.
 *
 * Fica em arquivo de fonte, e nao de teste, porque T003 em diante vai precisar
 * dela: as suites das historias (T004, T006, T008 …) afirmam efeito no banco
 * pelos mesmos meios. O duplo da porta de sistema de arquivos e o da porta de
 * processamento de imagem vivem em `modulo.test.ts` enquanto nenhuma tarefa de
 * historia os compartilhar.
 *
 * E a gemea da de BC-01, e a repeticao tem a mesma causa que a de
 * `leitura-de-linha.ts`: a regra de dependencia 3 proibe importar outro
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
