/**
 * A implementacao de {@link PortaDeCanal} que **T002** entrega: **registra cada
 * evento e cada recorte pedido, e devolve o que foi programado.**
 *
 * E o duplo que os testes usam, na forma que esta arvore ja adotou — *registra
 * comando* em vez de simular o servico. Aqui a escolha tem uma consequencia que
 * vale escrever: **este duplo nao filtra**.
 *
 * ⚠️ **Por que nao filtra.** Filtrar por periodo, severidade e origem **e** o
 * criterio CA-1.2, e e o que `UT-159-2` do catalogo manda afirmar (*"responde o
 * registro por periodo, por severidade e por origem"*). Um duplo que
 * implementasse o filtro responderia o teste no lugar do sistema, e o teste
 * passaria sem que nada do sistema tivesse sido construido. Logo: o duplo guarda
 * o recorte pedido em {@link CanalQueRegistra.recortes} — para que se possa
 * afirmar **que** o recorte chegou a borda, e com que valores — e devolve o que
 * {@link CanalQueRegistra.responder} programou. Nada programado devolve **lista
 * vazia**, e lista vazia e afirmacao, nao omissao.
 *
 * Quem fechar T003 decide onde o filtro mora — no adaptador, que o traduz em
 * recorte do canal, ou no modulo, que o aplica sobre o que o canal devolveu — e
 * a decisao vai junto com a borda que o `./portas/porta-de-canal.ts` registra
 * como aberta.
 */

import type {
  EventoDeOperacao,
  PortaDeCanal,
  RecorteDeConsulta,
} from './portas/index.js';

export interface CanalQueRegistra {
  /** A porta, para passar a `criarModuloDeRegistroDeOperacao`. */
  readonly porta: PortaDeCanal;
  /** Todo evento escrito, na ordem, com os quatro campos inteiros. */
  readonly eventos: EventoDeOperacao[];
  /** Todo recorte pedido, na ordem. */
  readonly recortes: RecorteDeConsulta[];
  /**
   * Programa a proxima resposta de `consultar`. Chamadas repetidas enfileiram,
   * na ordem.
   */
  responder(eventos: readonly EventoDeOperacao[]): void;
}

/**
 * Cria a implementacao. Cada chamada devolve uma nova: **sem estado de modulo**
 * (BR-MIGRAR-105, `EXT-CONTEXTO`), porque numa rede o registro de um site nao e
 * o do outro, e porque um registro compartilhado entre composicoes e exatamente
 * o vazamento que a linha 5 da metrica de `parity_specs.md` proibe.
 */
export function criarCanalQueRegistra(): CanalQueRegistra {
  const eventos: EventoDeOperacao[] = [];
  const recortes: RecorteDeConsulta[] = [];
  const programados: Array<readonly EventoDeOperacao[]> = [];

  return {
    porta: {
      registrar(evento) {
        eventos.push(evento);
      },
      consultar(recorte) {
        recortes.push(recorte);
        return programados.shift() ?? [];
      },
    },
    eventos,
    recortes,
    responder(resposta) {
      programados.push(resposta);
    },
  };
}
