/**
 * A implementacao de {@link PortaDeDriver} que **T002** entrega: **registra cada
 * consulta e devolve o que foi programado.**
 *
 * E o duplo que os testes usam, na forma que esta arvore ja adotou em
 * `contextos/integracao-externa/borda-de-saida/email-que-registra.ts` e nos
 * `armazenamento/porta-falsa.ts` dos contextos: **registra comando** em vez de
 * simular banco. A razao e a mesma e vale aqui com forca maior — e assim que se
 * afirma o caso em que o legado **nao** emite consulta nenhuma, e CA-3.1 e
 * CA-3.2 sao criterios sobre o **texto** da consulta, nao sobre o resultado
 * dela: para conferir que nada foi concatenado basta ter o texto e os valores
 * que a camada enviou, que e exatamente o que {@link DriverQueRegistra.consultas}
 * guarda.
 *
 * Nao e um banco de mentira, e nao vai ser: `parity_specs.md` poe *"esquema e
 * efeito de escrita no banco"* em criterio de **efeito no banco**, conferido
 * contra o oraculo executavel de T001 (`scripts/oraculo/`). Um banco simulado
 * aqui seria uma terceira resposta para comparar, e nenhuma das duas que
 * importam.
 */

import type { Consulta } from './consulta.js';
import type { PortaDeDriver, ResultadoDoDriver } from './portas/index.js';

/**
 * O que a borda devolve quando nada foi programado: **nada encontrado, nada
 * escrito**.
 *
 * Zero linhas e zero linhas afetadas, que e o resultado honesto de um driver sem
 * banco. Nao e sucesso nem falha: `DB-DEG` (BR-MIGRAR-083) nao tem falha a
 * representar, e zero linha afetada e observavel legitimo no legado — um
 * `UPDATE` que nao casa com nada devolve zero.
 */
export const NADA_ENCONTRADO: ResultadoDoDriver = Object.freeze({
  linhas: Object.freeze([]),
  linhasAfetadas: 0,
  idGerado: null,
});

export interface DriverQueRegistra {
  /** A porta, para passar a `criarModuloDeDados`. */
  readonly porta: PortaDeDriver;
  /** Toda consulta pedida, na ordem, com texto e valores inteiros. */
  readonly consultas: Consulta[];
  /** Programa o proximo resultado. Chamadas repetidas enfileiram, na ordem. */
  responder(resultado: ResultadoDoDriver): void;
}

export interface OpcoesDoDriverQueRegistra {
  /** O prefixo do site corrente. O de fabrica do legado e `wp_`. */
  readonly prefixoDeTabela?: string;
  /**
   * O prefixo das tabelas globais da rede.
   *
   * Omitido, vale o mesmo valor de `prefixoDeTabela` — que e o caso fora de
   * rede, em que `prefix` e `base_prefix` coincidem
   * (`wp-includes/class-wpdb.php:998`).
   */
  readonly prefixoBaseDeTabela?: string;
  /** O que devolver quando a fila de respostas esta vazia. */
  readonly resultadoPadrao?: ResultadoDoDriver;
}

/**
 * Cria a implementacao. Cada chamada devolve uma nova: **sem estado de modulo**
 * (BR-MIGRAR-105, `EXT-CONTEXTO`), porque numa rede cada site tem o seu prefixo
 * e duas composicoes nao podem se enxergar.
 */
export function criarDriverQueRegistra(
  opcoes: OpcoesDoDriverQueRegistra = {},
): DriverQueRegistra {
  const prefixoDeTabela = opcoes.prefixoDeTabela ?? 'wp_';
  const prefixoBaseDeTabela = opcoes.prefixoBaseDeTabela ?? prefixoDeTabela;
  const resultadoPadrao = opcoes.resultadoPadrao ?? NADA_ENCONTRADO;
  const consultas: Consulta[] = [];
  const programados: ResultadoDoDriver[] = [];

  return {
    porta: {
      prefixoDeTabela,
      prefixoBaseDeTabela,
      executar(consulta) {
        consultas.push(consulta);
        return programados.shift() ?? resultadoPadrao;
      },
    },
    consultas,
    responder(resultado) {
      programados.push(resultado);
    },
  };
}
