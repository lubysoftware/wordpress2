/**
 * **CA-7.3** de US-7: *"cada inconsistencia encontrada e registrada com
 * identificador do registro e instante"*.
 *
 * Entrega de **T015** (`.specify/specs/005-retencao-e-descarte/tasks.md`). Os
 * outros dois criterios da historia nao estao aqui: **CA-7.1** e **CA-7.2** sao
 * o ramo de `R6` / BR-MIGRAR-035 dentro de `wp_scheduled_delete()`
 * (`wp-includes/functions.php:6989` no conteudo, `:7007` no comentario), que
 * `./coletar-a-lixeira-vencida.ts` ja portava desde T011 — e uma das duas pernas
 * do `if`, e nao ha outro lugar onde ele caiba. T015 os afirma por teste.
 *
 * ## Por que CA-7.3 e acrescimo, e nao porte
 *
 * **O legado nao registra nada aqui.** O ramo apaga os dois marcadores e faz
 * `continue`, sem chamada de registro de erro e sem ponto de extensao
 * (`./contexto-de-coleta.ts` tem o censo). O **P7** da constituicao autoriza o
 * acrescimo com o limite escrito: *"registro e diagnostico novos podem ser
 * acrescentados, mas nenhuma decisao do sistema pode passar a depender deles"*.
 * Daqui saem as tres propriedades desta funcao, as mesmas de
 * `contextos/midia/envio/registro-de-envio-sem-filtro.ts`:
 *
 * 1. **devolve `void`**, e a porta tambem (`PortaDeCanal.registrar`);
 * 2. **nao decide nada**: a inconsistencia e decidida pela guarda do legado, em
 *    `./coletar-a-lixeira-vencida.ts`, e esta funcao so sabe escrever;
 * 3. **a colaboracao e opcional**: sem ela a coleta e exatamente a do legado. O
 *    unico `if` sobre registro e a **presenca da colaboracao**, nunca o
 *    **resultado** de escrever.
 *
 * Nenhum comando sai pela porta de dados por causa deste arquivo, logo a
 * sequencia que a area 3 da Decisao 2 de `parity_specs.md` compara nao muda.
 *
 * ## Por que nao e o mesmo caso de CA-5.5
 *
 * T011 escreveu que CA-7.3 era *"da mesma familia de CA-5.5"*. A familia e a
 * mesma, o estado do pacote nao e:
 *
 * - `spec.md` lista CA-5.5 em *Perguntas em aberto* como divergencia a aceitar
 *   explicitamente. **CA-7.3 nao esta la**, nem em `index.md`, nem em
 *   `pending_decisions.md`, e PT-004 nao o contradiz.
 * - A frase de UC-11 que pesa contra CA-5.5 e *"nenhum registro do que foi
 *   **apagado** foi guardado"*. O registro inconsistente **nao foi apagado**.
 *
 * ⚠️ **Nenhum numero nasce aqui** (P6). O evento tem instante porque CA-7.3 pede
 * instante, e instante nao e prazo. Nao ha prazo de guarda, teto de eventos nem
 * contagem de inconsistencias. Onde o evento fica guardado, e por quanto tempo, e
 * a borda e o conflito que `plataforma/registro-de-operacao/README.md` registra
 * em *O que ninguem decidiu*, itens 1 e 3, e esta tarefa nao os resolve.
 */

import type {
  EventoDeOperacao,
  PortaDeCanal,
} from '../../../plataforma/registro-de-operacao/index.js';
import type { TipoDeMetadado } from '../armazenamento/index.js';

/**
 * A origem do evento, no formato `<contexto>/<area>` que
 * `contextos/midia/envio/registro-de-envio-sem-filtro.ts` adotou. E a chave de
 * busca de CA-1.2 de REQ-159, e ter o valor numa constante exportada e o que
 * permite consultar por ela sem repetir a cadeia.
 */
export const ORIGEM_DA_INCONSISTENCIA_NA_COLETA = 'retencao-e-descarte/coleta';

/**
 * A severidade do evento.
 *
 * ⚠️ **A escala do sistema novo nao esta decidida**: e trabalho de T003 da
 * feature `015`, ainda aberta, e a palavra vive numa constante so para que a
 * escala se troque em uma linha. `'informativo'` e a unica palavra que a arvore
 * ja usa, e a que cabe: `plan.md` diz que *"a tolerancia a estado inconsistente e
 * regra, nao defeito"*, e a coleta seguiu como o legado segue.
 */
export const SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA = 'informativo';

/**
 * A colaboracao que escreve o registro: o canal, e o instante.
 *
 * ⚠️ **O instante vem daqui, e nao de `ContextoDeColeta.relogio`.** Aquele e o
 * `time()` do passo 1 (`wp-includes/functions.php:6977`): em segundos, lido
 * **uma vez**, e e dele que sai o instante limite das duas varreduras. Reaproveita-lo
 * carimbaria todo evento com o inicio da execucao, e rele-lo poria a escrita de
 * registro no relogio que decide o que se apaga — o que o **P7** recusa. O que
 * `EventoDeOperacao.instante` quer e *"milissegundos desde a epoca"* do momento
 * em que a inconsistencia foi tratada.
 *
 * As duas coisas chegam num campo so para que a ausencia seja inteira: sem a
 * colaboracao nao ha canal nem instante.
 */
export interface RegistroDeInconsistencia {
  /** A porta de `plataforma/registro-de-operacao`. Escreve e nao devolve nada. */
  readonly canal: PortaDeCanal;
  /** O instante do evento, em milissegundos desde a epoca. */
  agoraEmMilissegundos(): number;
}

/** A inconsistencia, nos campos que o evento carrega. */
export interface InconsistenciaNaColeta {
  /**
   * `post` ou `comment`, com a cadeia que o legado usa como `$meta_type`.
   *
   * Esta aqui porque o identificador sozinho nao diz qual e o registro: as duas
   * tabelas numeram por conta propria, e o conteudo 7 nao e o comentario 7.
   */
  readonly tipo: TipoDeMetadado;
  /** O identificador varrido — o que CA-7.3 pede. */
  readonly registroId: number;
  /**
   * `post_status` ou `comment_approved` encontrado, ou `null` quando a linha nao
   * existe: as duas metades da guarda (`! $del_post ||`, `:6989`) em um campo so.
   */
  readonly estadoEncontrado: string | null;
}

/**
 * Escreve o evento de uma inconsistencia que a coleta acabou de tratar.
 *
 * Sem colaboracao, nao escreve e nao reclama: e o comportamento do legado.
 * **Nao devolve nada**, para que nenhuma ramificacao possa depender de ter
 * escrito (P7).
 */
export function registrarInconsistencia(
  registro: RegistroDeInconsistencia | undefined,
  inconsistencia: InconsistenciaNaColeta,
): void {
  if (registro === undefined) {
    return;
  }

  const evento: EventoDeOperacao = {
    instante: registro.agoraEmMilissegundos(),
    origem: ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
    severidade: SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
    contexto: {
      tipo: inconsistencia.tipo,
      registroId: inconsistencia.registroId,
      estadoEncontrado: inconsistencia.estadoEncontrado,
    },
  };

  registro.canal.registrar(evento);
}
