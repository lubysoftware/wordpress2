/**
 * A area dos recursos de interface — o registro de *script* e de estilo que
 * `target_architecture.md` lista entre os componentes internos de BC-07.
 *
 * Entrega de **T023** (US-11). **Fora do ciclo** das tres areas de T001: o
 * carregador de recursos nao le personalizacao, menu nem componente, e nenhum
 * dos tres o le pelo caminho que esta tarefa portou. Por isso a area nao recebe
 * a `LigacaoTardiaNoCiclo` — declarar aresta onde o grafo medido nao mostrou
 * nenhuma e o que `ciclo-de-apresentacao.ts` proibe.
 *
 * A area nao guarda registro nenhum: ela devolve a fabrica, e cada requisicao
 * cria os dela (`EXT-CONTEXTO`, BR-MIGRAR-105). Criar a area nao toca porta e
 * nao registra recurso (`EXT-ORDEM`, BR-MIGRAR-106).
 */

import type {
  ConfiguracaoDoRegistro,
  ContextoDoRegistro,
} from './endereco-servido.js';
import { PERMISSOES_DOS_RECURSOS } from './funcoes-publicadas.js';
import {
  criarRegistroDeRecursos,
  type RegistroDeRecursos,
} from './registro-de-dependencias.js';

/** As operacoes de US-11 (T023). */
export interface OperacoesDosRecursos {
  /**
   * A permissao de cada operacao — **nenhuma**, declarada por escrito (P4).
   * Ver `./funcoes-publicadas.ts`.
   */
  readonly permissoes: typeof PERMISSOES_DOS_RECURSOS;

  /** `new WP_Scripts()` (`class-wp-scripts.php:152`), vazio. */
  criarRegistroDeScripts(
    configuracao: ConfiguracaoDoRegistro,
    contexto: ContextoDoRegistro,
  ): RegistroDeRecursos;

  /** `new WP_Styles()` (`class-wp-styles.php:113`), vazio. */
  criarRegistroDeEstilos(
    configuracao: ConfiguracaoDoRegistro,
    contexto: ContextoDoRegistro,
  ): RegistroDeRecursos;
}

/** A area composta. */
export interface AreaDeRecursosDeInterface extends OperacoesDosRecursos {
  readonly nome: 'recursos-de-interface';
}

/** Cria a area. Nao cria registro: isso e da requisicao. */
export function criarAreaDeRecursosDeInterface(): AreaDeRecursosDeInterface {
  return {
    nome: 'recursos-de-interface',
    permissoes: PERMISSOES_DOS_RECURSOS,
    criarRegistroDeScripts: (configuracao, contexto) =>
      criarRegistroDeRecursos('script', configuracao, contexto),
    criarRegistroDeEstilos: (configuracao, contexto) =>
      criarRegistroDeRecursos('estilo', configuracao, contexto),
  };
}
