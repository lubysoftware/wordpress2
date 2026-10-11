/**
 * Porta de cliente HTTP de saida do modulo de trabalho agendado — o **disparo**.
 *
 * E uma das 5 portas de AD-08 e o slot `cliente-http` que `plan.md` chama de
 * *"primeira porta do plano escolhido"*. Nesta feature ela tem um uso so, e esse
 * uso e o centro de toda a feature: a requisicao que o site faz **a si mesmo**
 * para fazer a fila avancar — `spawn_cron()`, `wp-includes/cron.php:999`:
 *
 * ```php
 * $result = wp_remote_post( $cron_request['url'], $cron_request['args'] );
 * return ! is_wp_error( $result );
 * ```
 *
 * com os argumentos que o filtro `cron_request` publica
 * (`wp-includes/cron.php:984`-`997`):
 *
 * ```php
 * 'args' => array(
 *     'timeout'   => 0.01,
 *     'blocking'  => false,
 *     'sslverify' => apply_filters( 'https_local_ssl_verify', false, $cron_url ),
 * ),
 * ```
 *
 * ## 🔴 AD-07: este disparo tem de FALHAR, e a falha e o criterio de aceite
 *
 * E a unica borda deste porte em que o comportamento correto e um fracasso.
 * AD-07 de `target_architecture.md` e literal: *"o agendador e o loopback
 * reproduzem o disparo deliberadamente nao bloqueante — timeout 0,01 s,
 * `blocking` falso, `sslverify` falso — e o criterio de aceite verifica **a
 * falha**, nao a latencia"*. O motivo esta na mesma pagina: *"em PHP o disparo
 * **aborta** a requisicao de saida; numa runtime assincrona o laco de eventos
 * continua vivo depois da resposta e a requisicao pode **completar**"*. E o
 * comportamento que depende da falha e o de `R5` e do ADR-0006: *um site que
 * ninguem administra nunca executa a propria limpeza*.
 *
 * `parity_specs.md` marca a fatia com `@falha-de-disparo` e registra que
 * *"criterio escrito em latencia e no-go declarado (RISK-015)"*. PT-005 cobra,
 * cenario por cenario: *"o disparo NAO completa em nenhuma das duas"*,
 * *"nenhuma requisicao de disparo pendente completa depois da resposta"*,
 * *"nenhuma assercao deste cenario mede tempo de resposta"*.
 *
 * **E por isso que {@link ResultadoDeDisparo} nao tem resposta.** Nao ha corpo,
 * nao ha codigo HTTP e nao ha cabecalho nesta porta: com `blocking` falso nao
 * existe resposta para ler, e declarar o campo convidaria o adaptador a esperar
 * por ela. A superficie da porta e a forma mais barata de impedir que o alvo
 * acerte demais.
 *
 * ## O disparo e um POST sem corpo, e o corpo mataria o destino
 *
 * `wp_remote_post()` e chamado sem `body`, e isso e necessario: o endpoint da
 * fila desiste na terceira linha quando ha dado de formulario
 * (`wp-cron.php:33`):
 *
 * ```php
 * if ( ! empty( $_POST ) || defined( 'DOING_AJAX' ) || defined( 'DOING_CRON' ) ) {
 *     die();
 * }
 * ```
 *
 * Por isso {@link PedidoDeDisparo} **nao tem campo de corpo**: nao e economia de
 * interface, e a forma de nao oferecer o que faz o destino morrer sem executar
 * nada. O `key` que vai no `cron_request` viaja na **URL**
 * (`add_query_arg( 'doing_wp_cron', $doing_wp_cron, site_url( 'wp-cron.php' ) )`,
 * `wp-includes/cron.php:961`), e e de la que o endpoint o le
 * (`$_GET['doing_wp_cron']`, `wp-cron.php:96`, `:105`).
 *
 * ## O que esta porta NAO tem, e cada ausencia e regra
 *
 * - **Nada de execucao.** Esta porta emite o pedido; quem recebe e o endpoint, e
 *   o endpoint e superficie de entrada, nao chamada de saida. A fila que avanca
 *   do outro lado e **T003** em diante.
 * - **Nenhuma nova tentativa.** AD-06: *"nao ha broker, DLQ nem retry
 *   generico"*, e PT-005 cobra *"nenhuma das duas aplica recuo exponencial"* e
 *   *"nenhuma das duas move a tarefa para fila de descarte"*.
 * - **Nenhum registro.** O cenario `@divida-herdada` de PT-005 e explicito:
 *   *"nenhuma falha de disparo e registrada em log, e isso e reproduzido de
 *   proposito"* — *"nenhuma das duas escreve arquivo de log"*, *"nenhuma das
 *   duas incrementa contador visivel ao administrador"*. O **P7** permite
 *   acrescentar registro de escrita; **nenhuma ramificacao do fluxo pode passar
 *   a depender dele**.
 * - **Nenhum limite de taxa.** BR-MIGRAR-112 (`ESC-LIMITE-TAXA`): *"nenhuma
 *   superficie de entrada tem limite de taxa, e os dois unicos freios sao travas
 *   de tempo: 60 s no `wp-cron.php` e 5 min no `wp-mail.php`"*. A constituicao poe
 *   *"introduzir limite de taxa ... que o legado nao tem"* na tabela do que exige
 *   decisao humana.
 *
 * ## 🔴 Dois conflitos abertos passam por esta porta, e T001 nao decide nenhum
 *
 * **1. A existencia do disparo.** `spec.md`, secao *Perguntas em aberto*, abre
 * com o mais consequente do pacote: **CA-1.2** exige que *"o gatilho nao e uma
 * requisicao do proprio site para si mesmo disparada por visita de terceiro"*, e
 * a **resposta 10** de `questions.md` decidiu manter exatamente o que o card
 * recusa, *"porque trocar por agendador do sistema produz um produto que se
 * comporta diferente no primeiro dia"*. As duas sao decisao humana e se excluem:
 * do lado do card, esta porta nao tem uso nenhum nesta feature; do lado da
 * resposta, ela e o coracao dela. Esta porta existe porque **T001 a pede pelo
 * nome** (*"as portas de dados, de relogio, de cache e de cliente externo
 * declaradas"*) e porque AD-07 a descreve; declarar a borda nao e escolher o
 * lado, e **nada neste modulo a chama**. A advertencia no alto de `tasks.md` e
 * clara: as tarefas de REQ-122, REQ-124 e REQ-125 **nao comecam** antes da
 * decisao. Quem pegar T003 para aqui.
 *
 * **2. As quatro implementacoes.** BR-HUMANA-005 registra que *"o protocolo de
 * loopback esta implementado 4 vezes"*, com a duplicacao **admitida em
 * comentario** no legado (`wp-admin/includes/class-wp-site-health.php:3622`:
 * *"This logic is copied from WP_Site_Health::can_perform_loopback()"*).
 * `spec.md` repete a pergunta — *"unificar, ou portar as quatro?"* — e a
 * recomendacao registrada e unificar **com a conferencia antes**, nao como
 * formalidade: *"ninguem verificou a equivalencia, e a falha e silenciosa por
 * desenho"*. PT-005 tem um esquema de cenario com as quatro nomeadas:
 * `disparo-do-agendador`, `sonda-de-diagnostico-de-site`,
 * `verificacao-de-retorno-do-nucleo`, `verificacao-de-editor-de-arquivo`.
 *
 * Esta porta e **a primeira** delas, e so ela. As outras tres sao de BC-11 pela
 * feature `010-operacao-do-software`; T001 nao as unifica e nao as declara, para
 * que quem fizer a conferencia encontre as quatro no estado em que o legado as
 * deixou.
 */

/**
 * O pedido de disparo, com os nomes dos argumentos de `wp_remote_post()`
 * traduzidos. Os valores que o legado passa estao citados em cada campo, e todos
 * eles sao **filtraveis** por `cron_request` (BR-MIGRAR-108, `ESC-FILTRAVEL`):
 * preservar o default filtravel e o porte.
 */
export interface PedidoDeDisparo {
  /**
   * O endereco do endpoint da fila, com a chave da trava na propria URL —
   * `add_query_arg( 'doing_wp_cron', $doing_wp_cron, site_url( 'wp-cron.php' ) )`
   * (`wp-includes/cron.php:961`).
   */
  readonly url: string;

  /**
   * Metodo HTTP. O legado usa `POST`, por `wp_remote_post()`
   * (`wp-includes/cron.php:999`).
   *
   * E `string`, e nao uniao fechada, porque no legado o metodo e texto livre
   * repassado ao transporte, e o endpoint da fila responde a requisicao de
   * qualquer metodo — UC-39 registra o fluxo alternativo em que *"um agendador de
   * sistema operacional pode requisitar o endpoint direto"*.
   */
  readonly metodo: string;

  /**
   * Tempo limite. O legado passa **0,01 s** (`wp-includes/cron.php:990`).
   *
   * 🔴 Nao e numero a ajustar: com `bloqueante` falso ele e metade da razao de o
   * disparo nao completar. O comentario de `wp_cron()`
   * (`wp-includes/cron.php:1008`) reconhece que *"a funcao `wp_remote_post()` nao
   * respeita sempre os parametros `timeout` e `blocking`"* e que *"um timeout de
   * 0.01 pode acabar levando 1 segundo"* — e a resposta do legado a isso foi
   * mover o disparo para o encerramento da requisicao, nao aumentar o numero.
   */
  readonly tempoLimiteEmSegundos: number;

  /**
   * Esperar a resposta. O legado passa **falso**
   * (`wp-includes/cron.php:991`).
   *
   * 🔴 E o campo de que AD-07 fala. Com ele falso **nao existe resposta para
   * ler**, e e por isso que {@link ResultadoDeDisparo} nao tem nenhuma.
   */
  readonly bloqueante: boolean;

  /**
   * Verificar o certificado do par. O legado passa o resultado de
   * `apply_filters( 'https_local_ssl_verify', false, $cron_url )`
   * (`wp-includes/cron.php:993`) — isto e, **falso** de fabrica.
   *
   * 🔴 Reproduzido de proposito: AD-09 manda o adaptador reproduzir o modo de
   * falha, BR-MIGRAR-115 (`ESC-HTTP`) registra o rebaixamento de canal como
   * divida herdada (resposta 12), e a constituicao poe *"fechar o rebaixamento
   * para canal sem cifra"* na tabela do que exige decisao humana. PT-005 cobra:
   * *"a verificacao de certificado registrada esta desligada nas duas"*.
   */
  readonly verificarCertificado: boolean;
}

/**
 * O resultado de um disparo. Duas possibilidades, e **nenhuma delas e uma
 * resposta HTTP**.
 *
 * E a traducao exata do que `spawn_cron()` devolve
 * (`wp-includes/cron.php:1001`): `! is_wp_error( $result )`. O legado nao olha
 * codigo, nao olha corpo e nao olha cabecalho — ele olha se houve erro de
 * transporte, e mais nada. `emitido: true` significa *"o pedido saiu e nenhum
 * erro de transporte voltou"*, e **nunca** significa que o outro lado executou.
 *
 * A falha e **valor devolvido, nunca excecao** (implicacao 4 do paradigma, e
 * `D3`: *"falha de envio e estado, nao excecao"*). Excecao aqui mudaria o fluxo
 * da requisicao do visitante, que e justamente o que o desenho do legado evita.
 */
export type ResultadoDeDisparo =
  | { readonly emitido: true }
  | { readonly emitido: false; readonly motivo: string };

export interface PortaDeClienteExterno {
  /**
   * Emite o disparo. Nao lanca, e **nao devolve resposta**: a falha volta como
   * `emitido: false`, e o sucesso nao diz nada sobre o outro lado.
   */
  disparar(pedido: PedidoDeDisparo): ResultadoDeDisparo;
}
