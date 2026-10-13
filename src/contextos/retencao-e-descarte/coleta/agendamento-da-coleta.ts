/**
 * O **corpo** do registro do evento de coleta na fila — e nada sobre **onde ele
 * e chamado**.
 *
 * ## 🔴 LEIA ISTO ANTES DE USAR ESTE ARQUIVO
 *
 * **Nada neste modulo chama `registrarAColeta()`, e a ausencia da chamada e a
 * entrega, nao uma pendencia de fiacao.** O conflito de **CA-5.1** esta aberto,
 * registrado em *Perguntas em aberto* de
 * `.specify/specs/005-retencao-e-descarte/spec.md`, e a constituicao poe
 * *"resolver um dos conflitos entre card `wont` e resposta humana"* na tabela do
 * que o agente de codificacao **nao decide sozinho**:
 *
 * | lado | onde esta escrito | o que diz |
 * |---|---|---|
 * | **a spec** | **CA-5.1**, e UT-052-6 / UT-052-7 de `backlog/tests.md` | o agendamento existe numa instalacao nova, *"sem depender de ninguem ter entrado no painel"*, registrado *"no caminho publico, antes de qualquer exigencia de autenticacao"* |
 * | **a analise** | **resposta 10** de `questions.md`, **ADR-0006**, **BR-MIGRAR-034**, a resposta da **Decisao 1** de `pending_decisions.md`, **PT-004** `@critico` | o registro fica **depois** de `auth_redirect()` (`wp-admin/admin.php:104`), e *"um site que ninguem administra nunca agenda sua propria limpeza"* e comportamento do produto |
 *
 * Construir CA-5.1 como esta escrita rompe a paridade que PT-004 cobra como
 * `@critico`; construir a paridade deixa CA-5.1 falso. T001 nao escolheu, T011
 * nao escolhe, e `../modulo.test.ts`
 * continua afirmando que **compor o modulo nao agenda nada**.
 *
 * ## O que, entao, este arquivo pode portar sem decidir
 *
 * **Os dois lados do conflito discordam do ponto de chamada e concordam, letra
 * por letra, no que e chamado.** `wp-admin/admin.php:107`-`:109`:
 *
 * ```php
 * // Schedule Trash collection.
 * if ( ! wp_next_scheduled( 'wp_scheduled_delete' ) && ! wp_installing() ) {
 *     wp_schedule_event( time(), 'daily', 'wp_scheduled_delete' );
 * }
 * ```
 *
 * O nome do gancho, a recorrencia, o instante do primeiro disparo e a condicao
 * de guarda sao os mesmos se a chamada ficar antes ou depois de
 * `auth_redirect()`. Porta-los aqui — e nao chamar — e o que a porta de fila
 * pediu em T001: *"o nome dos dois ganchos e a condicao que o legado usa estao
 * escritos no cabecalho da porta, **para que nenhuma das duas tarefas os
 * invente**"*. Quando a decisao chegar, ela e **uma linha** no ponto de entrada,
 * e nao uma reescrita deste modulo.
 *
 * E e isso que torna o cenario `@critico` de PT-004 afirmavel nos dois sentidos:
 * *"nenhuma das duas tem a tarefa de coleta registrada na fila"* e *"as duas
 * metades registram a tarefa de coleta"* precisam que exista **a mesma** funcao
 * de registro, chamada ou nao.
 *
 * ## O gancho e o nome da funcao, e sao a mesma cadeia
 *
 * ⚠️ `add_action( 'wp_scheduled_delete', 'wp_scheduled_delete' )`
 * (`wp-includes/default-filters.php:465`): o **gancho** e a **funcao** se chamam
 * igual. Quem for ligar o barramento um dia precisa saber disso; o barramento
 * (`plataforma/barramento/`) **nao existe nesta arvore** — REQ-162 esta em
 * `do-not-rewrite.md` e nenhuma tarefa deste pacote o constroi —, logo a ligacao
 * gancho→funcao fica declarada aqui e nao registrada em lugar nenhum.
 *
 * ## O que este arquivo NAO tem
 *
 * - **O segundo evento desta feature.** `wp_scheduled_auto_draft_delete` e de
 *   **T013** (US-6), registrado em `wp-admin/includes/post.php:798`-`:799`, e
 *   ⚠️ a condicao dele e **diferente**: so `! wp_next_scheduled( ... )`, **sem**
 *   `! wp_installing()`. A assimetria e do legado; T013 nao deve copiar a
 *   condicao deste arquivo de memoria.
 * - **O disparo e a execucao da fila.** Sao de BC-11 / feature `011`, e AD-07 e
 *   literal: *"o disparo nao bloqueante tem de **falhar**, e o critério de aceite
 *   e a falha"*. Ver `../portas/porta-de-fila-agendada.ts`.
 */

import type {
  NomeDeRecorrencia,
  PortaDeFilaAgendada,
  PortaDeRelogio,
  ResultadoDeAgendamento,
} from '../portas/index.js';

/**
 * `wp_scheduled_delete` — o nome do gancho da coleta, na letra do legado
 * (`wp-admin/admin.php:107`).
 *
 * E **contrato publico** (P2, P8): extensao de terceiro agenda, desagenda e
 * escuta este evento pelo nome. Renomea-lo cai em *Nao negociavel*.
 */
export const GANCHO_DA_COLETA = 'wp_scheduled_delete';

/**
 * `daily` — a recorrencia com que o legado registra a coleta
 * (`wp-admin/admin.php:108`).
 *
 * Uma das quatro de fabrica (`wp-includes/cron.php:1133`). O tipo e aberto
 * porque `cron_schedules` acrescenta outras — ver `NomeDeRecorrencia` em
 * `../portas/porta-de-fila-agendada.ts`.
 */
export const RECORRENCIA_DA_COLETA: NomeDeRecorrencia = 'daily';

/**
 * O que o registro precisa saber, e so isso.
 *
 * **`instalando` e `wp_installing()`** (`wp-includes/load.php:1633`), que no
 * legado e estado global de processo — `WP_INSTALLING` definida antes do arranque
 * ou o valor que o instalador troca em execucao. Aqui ele chega por argumento
 * porque e **escopo de requisicao** (`EXT-CONTEXTO`, BR-MIGRAR-105): guarda-lo em
 * estado de modulo e exatamente o que `target_architecture.md` proibe.
 */
export interface ContextoDeAgendamentoDaColeta {
  readonly filaAgendada: PortaDeFilaAgendada;
  /** `time()` — o instante do primeiro disparo (`wp-admin/admin.php:108`). */
  readonly relogio: PortaDeRelogio;
  /** `wp_installing()`. */
  readonly instalando: boolean;
}

/**
 * O que aconteceu com o pedido de registro.
 *
 * ⚠️ **No legado nada disso e observavel:** o `if` nao tem `else`, o retorno de
 * `wp_schedule_event()` e descartado e nada e registrado em lugar nenhum
 * (`wp-admin/admin.php:107`-`:109`). Este desfecho existe para que o cenario de
 * PT-004 possa afirmar *"nenhuma das duas registra a tarefa de coleta"*
 * distinguindo **por que** — e nenhum ramo do sistema depende dele (**P7**).
 */
export type DesfechoDoAgendamentoDaColeta =
  /** O evento foi pedido a fila. O retorno dela vem em `resultado`. */
  | 'pedido-a-fila'
  /** `wp_next_scheduled()` devolveu um instante: o evento ja esta na fila. */
  | 'ja-na-fila'
  /** `wp_installing()` era verdadeiro. */
  | 'instalando';

export interface RegistroDaColeta {
  readonly desfecho: DesfechoDoAgendamentoDaColeta;
  /** O que a fila respondeu, ou `null` quando ela nem foi chamada. */
  readonly resultado: ResultadoDeAgendamento | null;
  /** O instante que `wp_next_scheduled()` devolveu, quando devolveu. */
  readonly proximaOcorrencia: number | null;
}

/**
 * O corpo de `wp-admin/admin.php:107`-`:109`, e so ele.
 *
 * ⚠️ **Chamar esta funcao e decidir CA-5.1.** Ela nao e chamada por nenhum
 * arquivo desta arvore — ver a secao 🔴 do cabecalho. Quem receber a decisao
 * humana chama daqui, no ponto que a decisao indicar: **depois** da exigencia de
 * autenticacao, que e o que a resposta 10, o ADR-0006, BR-MIGRAR-034 e PT-004
 * descrevem, ou **antes** dela, que e o que CA-5.1 e UT-052-6 pedem.
 *
 * A ordem das duas metades da guarda e a do legado — `! wp_next_scheduled( ... )`
 * primeiro, `! wp_installing()` depois —, e em PHP o `&&` curto-circuita: **com
 * o evento ja na fila, `wp_installing()` nao e avaliado**. Aqui a ordem e a
 * mesma e o curto-circuito tambem, pelo mesmo motivo de sempre: a sequencia de
 * leituras e o que a paridade compara.
 */
export function registrarAColeta(
  contexto: ContextoDeAgendamentoDaColeta,
): RegistroDaColeta {
  const proximaOcorrencia =
    contexto.filaAgendada.proximaOcorrencia(GANCHO_DA_COLETA);

  if (proximaOcorrencia !== null) {
    return { desfecho: 'ja-na-fila', resultado: null, proximaOcorrencia };
  }

  if (contexto.instalando) {
    return { desfecho: 'instalando', resultado: null, proximaOcorrencia: null };
  }

  // `wp_schedule_event( time(), 'daily', 'wp_scheduled_delete' )`: o primeiro
  // disparo e o instante da **propria requisicao** que registrou, e nao a
  // meia-noite nem um horario fixo. Logo a hora da coleta de uma instalacao e a
  // hora em que alguem passou por aqui pela primeira vez.
  const resultado = contexto.filaAgendada.agendarRecorrente({
    gancho: GANCHO_DA_COLETA,
    primeiroDisparoEmSegundos: contexto.relogio.agoraEmSegundos(),
    recorrencia: RECORRENCIA_DA_COLETA,
  });

  return { desfecho: 'pedido-a-fila', resultado, proximaOcorrencia: null };
}
