/**
 * `coleta/` — a area de comportamento da **coleta do que venceu na lixeira**,
 * US-5.
 *
 * Entrega de **T011**: *"apagar conteudo vencido da lixeira por rotina que nao
 * depende de visita ao painel"*
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `varredura-do-vencido.ts` | as duas consultas do prazo, com o `<` estritamente menor |
 * | `coletar-a-lixeira-vencida.ts` | a operacao, e `wp_scheduled_delete()` — os nove passos na ordem do legado |
 * | `contexto-de-coleta.ts` | o que chega por argumento, e de quem cada peca e — **sem ator**, porque UC-11 nao pede capacidade nenhuma |
 * | `agendamento-da-coleta.ts` | 🔴 o **corpo** do registro do evento, que **ninguem chama**: ver abaixo |
 * | `registro-de-inconsistencia.ts` | **T015**: o evento de CA-7.3, so escrita e opcional (P7) |
 * | `us-5-coletar-a-lixeira-vencida.test.ts` | as afirmacoes de T011 |
 * | `us-7-tolerar-estado-inconsistente.test.ts` | as afirmacoes de T015 |
 *
 * ## 🔴 Dois dos cinco criterios de US-5 nao foram fechados por T011
 *
 * | criterio | estado |
 * |---|---|
 * | CA-5.2, CA-5.3, CA-5.4 | **fechados**, em `coletar-a-lixeira-vencida.ts` |
 * | **CA-5.1** | **conflito aberto**, nao resolvido. Quatro registros humanos do lado da paridade contra o criterio; `agendamento-da-coleta.ts` porta o corpo do registro e **nao o chama** |
 * | **CA-5.5** | **pela metade**: a contagem existe como **valor de retorno** (o que o P7 permite); o registro **persistido** e divergencia que ninguem aceitou |
 *
 * A secao 🔴 de `coletar-a-lixeira-vencida.ts` e a de `agendamento-da-coleta.ts`
 * dizem por que, com as referencias. `../README.md` repete para quem chegar pela
 * tarefa seguinte.
 *
 * ## O que esta pasta nao tem, com a tarefa de cada um
 *
 * - **A expiracao do rascunho automatico** (US-6, **T013**): outro evento,
 *   `wp_scheduled_auto_draft_delete`, outra consulta, e o prazo cravado no SQL e
 *   comparado com o relogio do **banco** (`wp-includes/post.php:8377`). UC-11 a
 *   lista como passo 5 do fluxo principal e anota, na mesma linha, *"evento
 *   separado"*.
 * - **A exclusao definitiva e o reparenteamento** (US-8, **T017**): chegam por
 *   ligacao tardia, na posicao exata do laco.
 * - **O disparo e a trava da fila**: feature `011`, e AD-07 manda que o disparo
 *   **falhe**.
 */

export {
  coletarALixeiraVencida,
  type ResultadoDaColeta,
} from './coletar-a-lixeira-vencida.js';

export type {
  ArmazenamentoNaColeta,
  ComentarioNaColeta,
  ConteudoNaColeta,
  ContextoDeColeta,
  ExclusaoDeComentarioNaColeta,
  ExclusaoDeConteudoNaColeta,
  RegistroNaColeta,
} from './contexto-de-coleta.js';

export {
  consultaDeVencidos,
  criarVarreduraDoVencido,
  varrerVencidos,
  type VarreduraDoVencido,
} from './varredura-do-vencido.js';

export {
  ORIGEM_DA_INCONSISTENCIA_NA_COLETA,
  registrarInconsistencia,
  SEVERIDADE_DA_INCONSISTENCIA_NA_COLETA,
  type InconsistenciaNaColeta,
  type RegistroDeInconsistencia,
} from './registro-de-inconsistencia.js';

export {
  GANCHO_DA_COLETA,
  RECORRENCIA_DA_COLETA,
  registrarAColeta,
  type ContextoDeAgendamentoDaColeta,
  type DesfechoDoAgendamentoDaColeta,
  type RegistroDaColeta,
} from './agendamento-da-coleta.js';
