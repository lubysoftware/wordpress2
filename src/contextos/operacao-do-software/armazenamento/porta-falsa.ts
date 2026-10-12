/**
 * Porta de dados de teste: registra o que foi pedido e devolve o que foi
 * programado.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`.
 *
 * Por que uma porta que **registra comando** em vez de um banco de mentira: o
 * criterio de aceite desta area e *"efeito no banco + comportamento de caso de
 * uso"* (Decisao 2 de `parity_specs.md`, para PT-013), e o que ela manda
 * comparar e *"snapshot + sequencia de comandos"*. Nesta feature o caso em que
 * o legado **nao emite comando nenhum** e regra, nao detalhe:
 *
 * - gravar opcao com o valor que ja esta la nao emite escrita
 *   (`wp-includes/option.php:923`);
 * - apagar opcao que nao existe nao emite `DELETE` (`:1216`);
 * - acrescentar opcao que existe nao emite `INSERT` (`:1123`);
 * - a limpeza diaria de chaves de recuperacao grava sempre e, quando nada
 *   venceu, o valor e o mesmo — logo nenhum comando sai
 *   (`wp-includes/class-wp-recovery-mode-key-service.php:125`).
 *
 * Um banco de mentira esconderia exatamente esses quatro.
 *
 * Fica em arquivo de fonte, e nao de teste, porque T003 em diante vai precisar
 * dela: as suites das historias (T004, T006, T008 e as demais `[P]`) afirmam
 * efeito no banco pelos mesmos meios, e o cenario `@composicao` do padrao desta
 * arvore pede a porta *"substituida por duplo que registra cada operacao"*.
 *
 * E a gemea das de BC-01, BC-02 e BC-06, com **uma** diferenca que esta
 * feature obriga: `prefixoBaseDeTabela` existe, porque `{base}sitemeta` e
 * global e e onde o unico historico persistente de falha do sistema mora em
 * rede (ver `chaves-e-tabelas.ts`).
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
  /** Programa a proxima resposta de leitura como "nenhuma linha". */
  responderSemLinha(): void;
}

export interface OpcoesDaPortaFalsa {
  readonly prefixoDeTabela?: string;
  readonly prefixoBaseDeTabela?: string;
  readonly resultadoDeEscrita?: ResultadoDeEscrita;
}

export function criarPortaDeDadosFalsa(
  opcoes: OpcoesDaPortaFalsa = {},
): PortaDeDadosFalsa {
  const prefixoDeTabela = opcoes.prefixoDeTabela ?? 'wp_';
  const prefixoBaseDeTabela = opcoes.prefixoBaseDeTabela ?? prefixoDeTabela;
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
      prefixoBaseDeTabela,
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
    responderSemLinha() {
      respostas.push([]);
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
