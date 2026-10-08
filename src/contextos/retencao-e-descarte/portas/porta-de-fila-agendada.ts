/**
 * Porta de fila agendada do modulo de retencao e descarte.
 *
 * E por aqui que esta feature **pede** que a coleta seja agendada, e nada mais:
 * declarar o evento e consultar se ele existe. A fila em si nao e deste contexto
 * — `target_architecture.md` a poe em **BC-11 (Operacao do Software)**, no
 * aggregate `AGG-TarefaAgendada`, e `plan.md` registra a dependencia na secao
 * *Sequencia*: *"a coleta e trabalho agendado"*, feature `011-trabalho-agendado`.
 *
 * **Por que fila e porta, e nao consulta pela porta de dados.** No legado a fila
 * **e** uma linha de `options` (`wp-includes/cron.php`), logo seria tecnicamente
 * possivel trata-la como dado deste modulo. Nao e: o dono do formato da fila, da
 * trava e do disparo e BC-11, e esta feature e **cliente** dele. Ler a opcao
 * direto daqui duplicaria o formato em dois donos, que e a forma mais barata de
 * perder paridade quando um dos dois mudar.
 *
 * ## O que esta porta deliberadamente NAO tem
 *
 * Nada do **disparo** e nada da **execucao**, e as ausencias sao regra:
 *
 * - **O disparo nao esta aqui, e ele tem de FALHAR.** A fila do legado so avanca
 *   quando chega requisicao HTTP: o site dispara uma requisicao **nao
 *   bloqueante** a si mesmo, com tempo limite de 0,01 s e sem verificacao de TLS
 *   (UC-39, passo 2). AD-07 e literal — *"o disparo nao bloqueante tem de
 *   **falhar**, e o critério de aceite e a falha"* —, e `parity_specs.md` marca
 *   isso como `@falha-de-disparo`, com a advertencia de que *"critério escrito em
 *   latencia e no-go declarado (RISK-015)"*. Nenhum metodo desta porta permite
 *   que este modulo dispare a fila, e isso e de proposito: num runtime
 *   assincrono o disparo poderia **completar**, o que apagaria a regra.
 * - **A trava nao esta aqui.** Os dois numeros da fila — transiente de 60
 *   segundos, descartado se passar de 10 minutos (`WP_CRON_LOCK_TIMEOUT`,
 *   `wp-includes/default-constants.php:398`) — sao da feature 011, e o **P6**
 *   manda que cada numero viva no ponto de configuracao da tarefa que o
 *   implementa. Numero que aparece aqui e numero sem teste de borda.
 * - **Nao ha execucao, nem cancelamento, nem evento unico, nem argumentos.** O
 *   legado identifica o evento por gancho **mais** o arranjo de argumentos
 *   (`wp_next_scheduled( $hook, $args = array() )`, `wp-includes/cron.php:859`), e
 *   os dois eventos desta feature registram **sem argumento nenhum**. A
 *   superficie completa da fila — `wp_schedule_single_event`,
 *   `wp_unschedule_event`, `wp_clear_scheduled_hook`, os argumentos e os pontos de
 *   extensao `pre_schedule_event` e `schedule_event` — e contrato publico (P2, P8)
 *   e pertence a quem portar a fila, nao a este modulo.
 *
 * ## Os dois ganchos desta feature, nomeados e nao registrados aqui
 *
 * Nome de gancho e contrato publico (P2: *"ponto de extensao e contrato
 * publico"*), e os dois desta feature sao, na letra do legado:
 *
 * | gancho | recorrencia | onde o legado o registra |
 * |---|---|---|
 * | `wp_scheduled_delete` | `daily` | `wp-admin/admin.php:104`, **depois** de `auth_redirect()` |
 * | `wp_scheduled_auto_draft_delete` | `daily` | `wp-admin/includes/post.php:797`, ao criar o rascunho automatico |
 *
 * Os dois ficam aqui **nomeados em documentacao** e nao como constante exportada:
 * registrar cada um e entrega de **T011** (US-5) e **T013** (US-6), e o nome esta
 * escrito para que nenhuma das duas o invente. O legado tambem guarda a condicao
 * que acompanha o registro — `! wp_next_scheduled( ... ) && ! wp_installing()` —,
 * e ela e parte do que aquelas tarefas reproduzem.
 *
 * ## 🔴 O conflito aberto desta feature passa por esta porta, e T001 NAO o decide
 *
 * Esta porta diz **como** se pede o agendamento. Ela nao diz, e nao pode dizer,
 * **quem** pede nem **quando** — e e exatamente ali que mora o conflito que
 * `spec.md` registra em *Perguntas em aberto*:
 *
 * - **CA-5.1** exige que *"o agendamento da coleta exista numa instalacao nova,
 *   sem depender de ninguem ter entrado no painel"*, e `backlog/tests.md` repete
 *   em UT-052-6 e UT-052-7 (*"registra o evento de coleta no caminho publico,
 *   antes de qualquer exigencia de autenticacao"*).
 * - **A resposta 10 de `questions.md`**, com o **ADR-0006** e BR-MIGRAR-034,
 *   decidiu o contrario: o registro fica **depois** de `auth_redirect()`, e *"um
 *   site que ninguem administra nunca agenda sua propria limpeza"* e comportamento
 *   do produto. PT-004 abre com esse cenario, marcado `@critico`.
 *
 * As duas sao decisao humana em sentidos opostos, o pacote declara que **nao
 * escolhe**, e a constituicao poe *"resolver um dos conflitos entre card `wont` e
 * resposta humana"* na tabela do que nao se decide sozinho. Esta porta foi
 * escrita para servir os **dois** lados sem favorecer nenhum: ela e chamada de
 * quem registra, e quem registra — e sob que condicao — e a decisao que falta.
 * Quem pegar T011 esbarra nisso e deve parar, nao escolher.
 */

/**
 * Nome de recorrencia da fila, como o legado os nomeia.
 *
 * **E `string` de proposito, e nao uniao fechada.** O legado traz quatro de
 * fabrica — `hourly`, `twicedaily`, `daily` e `weekly`
 * (`wp-includes/cron.php:1133`) — mas o ponto de extensao `cron_schedules`
 * acrescenta outros, e `plan.md` nao da a esta feature nenhum deles. Fechar a
 * uniao aqui recusaria recorrencia de terceiro que o legado aceita, o que o P2
 * proibe.
 *
 * Os dois eventos desta feature usam `daily`.
 */
export type NomeDeRecorrencia = string;

/** O evento recorrente que este modulo pede a fila. */
export interface EventoRecorrente {
  /**
   * O nome do gancho, na letra do legado (`wp_scheduled_delete`,
   * `wp_scheduled_auto_draft_delete`). E contrato publico: nenhuma extensao de
   * terceiro encontra um gancho renomeado (P2, P8).
   */
  readonly gancho: string;
  /**
   * Instante do primeiro disparo, em segundos inteiros UTC — a unidade da
   * {@link PortaDeRelogio}. No legado os dois registros passam `time()`, isto e,
   * o instante da propria visita que registrou.
   */
  readonly primeiroDisparoEmSegundos: number;
  /** A recorrencia. Nos dois eventos desta feature, `daily`. */
  readonly recorrencia: NomeDeRecorrencia;
}

/**
 * O que o agendamento informa de volta.
 *
 * **A falha e valor, nao excecao**, e isso e P7: *"preserve o modo de falha,
 * inclusive o silencio"*. No legado `wp_schedule_event()` devolve `false` — ou um
 * erro, so quando o chamador pede — e **os dois chamadores desta feature ignoram
 * o retorno**: a visita ao painel segue igual se a fila nao aceitou o evento, e
 * nada e registrado. Quem consumir esta porta pode registrar o motivo (P7 permite
 * acrescentar registro), mas **nenhuma ramificacao do fluxo pode passar a depender
 * dele**.
 */
export type ResultadoDeAgendamento =
  | { readonly agendado: true }
  | { readonly agendado: false; readonly motivo: string };

export interface PortaDeFilaAgendada {
  /**
   * O instante do proximo disparo deste gancho, ou `null` se ele nao esta na
   * fila — o `wp_next_scheduled()` do legado (`wp-includes/cron.php:859`), que
   * devolve `false` no lugar do `null`.
   *
   * E o que torna conferivel o cenario de PT-004 *"nenhuma das duas tem a tarefa
   * de coleta registrada na fila"*: sem esta leitura, "nao esta agendado" nao e
   * uma afirmacao que se possa fazer.
   */
  proximaOcorrencia(gancho: string): number | null;

  /**
   * Poe o evento recorrente na fila — o `wp_schedule_event()` do legado
   * (`wp-includes/cron.php:252`).
   *
   * **Nao e idempotente por conta propria, e nao deve ser.** No legado quem evita
   * o evento duplicado e o **chamador**, com o `! wp_next_scheduled( ... )` que
   * precede as duas chamadas; a fila ainda recusa duplicata proxima por conta
   * dela. Fazer esta porta "consertar" isso esconderia a condicao que T011 e T013
   * tem de reproduzir.
   */
  agendarRecorrente(evento: EventoRecorrente): ResultadoDeAgendamento;
}
