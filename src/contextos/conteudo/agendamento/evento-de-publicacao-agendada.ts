/**
 * `_future_post_hook()` — o ouvinte que poe o evento na fila ao entrar em
 * agendado (`wp-includes/post.php:8205`).
 *
 * Entrega de **T013** da feature `002-autoria-e-publicacao` (US-6). E o passo 3
 * de UC-04 — *"Sistema agenda um evento unico para a data da publicacao"* — e e
 * o **primeiro** dos tres mecanismos de guarda que o ADR-0005 tabela.
 *
 * ── ELE NAO E UM COMANDO, E UM OUVINTE — E A DIFERENCA E O ADR INTEIRO ─────
 *
 * Ninguem chama esta funcao para "agendar". O legado a registra no ponto
 * `future_{$post_type}` com prioridade **5**, uma vez por tipo de conteudo
 * registrado:
 *
 * ```php
 * // wp-includes/class-wp-post-type.php:767, em WP_Post_Type::add_hooks()
 * add_action( 'future_' . $this->name, '_future_post_hook', 5, 2 );
 * ```
 *
 * Isto e: ela roda porque a transicao **entrou** em `future`, e a transicao
 * entrou em `future` porque a comparacao de data reescreveu o estado
 * (`estado-pela-data.ts`). ADR-0005 e literal — *"o status `future` nao e
 * escolhido: e calculado"* — e *"nao reimplemente `future` como transicao.
 * Parece mais limpo e muda o comportamento do produto em todos os clientes de
 * escrita"*.
 *
 * **O numero 5 e parte do contrato**, pelo mesmo argumento que
 * `../publicacao/transicao-de-estado.ts` usa para o ouvinte do ponto 1:
 * `add_action` sem prioridade entra em 10, logo quem escuta
 * `future_{$post_type}` de uma extensao ve o evento **ja** na fila. Fica
 * declarado em {@link PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO}, e a posicao em
 * `transicao-de-estado.ts` o cumpre enquanto nao ha barramento nesta arvore
 * (REQ-162 esta em `do-not-rewrite.md`).
 *
 * ── O PRIMEIRO ARGUMENTO EXISTE, NAO E USADO, E NAO SE REMOVE ──────────────
 *
 * A assinatura do legado e `_future_post_hook( $deprecated, $post )`, e o
 * docblock explica o fantasma com estas palavras: *"Not used. Can be set to
 * null. Never implemented. Not marked as deprecated with
 * `_deprecated_argument()` as it conflicts with `wp_transition_post_status()`
 * and the default filter for `_future_post_hook()`"* (`:8200`-`:8202`). Ele
 * existe porque o ponto 3 da transicao dispara com tres argumentos — `$post->ID`,
 * `$post`, `$old_status` (`:5980`) — e este ouvinte declara aceitar **dois**,
 * logo recebe o identificador na primeira posicao e o ignora.
 *
 * O **P8** poe isso fora do alcance de quem codifica (*"nao remova funcao,
 * constante, tabela, rota, superficie nem comportamento publicado"*, e
 * *"existir sem ser chamada e parte do que se clona"*). Aqui ele e preservado
 * como **documentacao da forma**, nao como parametro morto: a funcao deste
 * arquivo recebe o registro, que e o que ela usa, e a aritmetica do ponto 3 —
 * tres argumentos emitidos, dois aceitos — esta declarada em
 * `transicao-de-estado.ts`, no lugar onde o barramento vai registra-la.
 *
 * ── O QUE A FUNCAO FAZ, E A ORDEM IMPORTA ──────────────────────────────────
 *
 * ```php
 * function _future_post_hook( $deprecated, $post ) {
 *     wp_clear_scheduled_hook( 'publish_future_post', array( $post->ID ) );
 *     wp_schedule_single_event( strtotime( get_gmt_from_date( $post->post_date ) . ' GMT' ), 'publish_future_post', array( $post->ID ) );
 * }
 * ```
 *
 * **Limpa antes de agendar, sempre.** A limpeza nao e condicional e nao consulta
 * a fila: nao ha `wp_next_scheduled()` aqui. Quem a trocasse por *"agenda se
 * ainda nao houver"* produziria um evento preso na data antiga quando o autor
 * remarca um conteudo ja agendado — e e justamente essa a sequencia que a fila
 * guarda, porque `wp_schedule_single_event()` recusa evento identico dentro de
 * 10 minutos (`wp-includes/cron.php:135`): sem a limpeza, remarcar para 9
 * minutos adiante nao agendaria nada.
 *
 * ⚠️ **Esta e a SEGUNDA limpeza do mesmo evento na mesma transicao.** O ouvinte
 * do ponto 1, `_transition_post_status()`, ja limpou incondicionalmente
 * (`:8189`, CA-1.5), e o ponto 1 dispara antes do ponto 3. Logo entrar em
 * agendado emite, na ordem: **limpar, limpar, agendar**. As duas limpezas estao
 * reproduzidas porque a sequencia de chamadas e o que a area 3 da Decisao 2
 * compara, e porque o ultimo cenario de
 * `02-publicacao-e-agendamento-de-conteudo.feature` cobra *"a sequencia de
 * chamadas registrada e identica nas duas metades"*. Fundir as duas numa
 * *"otimizacao"* muda a sequencia observada por quem instrumenta a fila.
 *
 * ⚠️ **E a data lida e `post_date`, nao `post_date_gmt`** — ao contrario do que o
 * proprio docblock do legado diz (*"The $post properties used and must exist are
 * 'ID' and 'post_date_gmt'"*, `:8195`). O codigo le a data **local** e a
 * converte com `get_gmt_from_date()`. A divergencia entre o comentario e o codigo
 * esta preservada do lado do codigo, que e o que P1 manda: o comportamento
 * observavel e a especificacao. Consequencia pratica: a verificacao dupla de
 * `publicacao-agendada.ts` parte de `post_date_gmt` e esta funcao parte de
 * `post_date`, e as duas so coincidem enquanto o fuso do site nao muda.
 */

import type { Conteudo } from '../armazenamento/index.js';
import {
  GANCHO_DE_PUBLICACAO_AGENDADA,
  type ContextoDePublicacao,
} from '../publicacao/contexto-de-publicacao.js';
import { instanteDaDataDoBancoOuZero } from './instante-da-data.js';

/**
 * A prioridade com que o nucleo registra `_future_post_hook` no ponto
 * `future_{$post_type}` (`wp-includes/class-wp-post-type.php:767`).
 *
 * Declarada como numero porque ela **e** a regra de ordem, como a do ouvinte do
 * ponto 1: ver a secao correspondente no cabecalho deste arquivo.
 */
export const PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO = 5;

/** O que o ouvinte deixou na fila, e que os criterios de US-6 afirmam. */
export interface EventoDePublicacaoAgendada {
  /**
   * O que `wp_clear_scheduled_hook()` devolveu na limpeza **deste** ouvinte — a
   * segunda da transicao. O retorno e descartado no legado (P7).
   */
  readonly eventosRemovidos: number | false;
  /**
   * O instante para o qual o evento foi pedido, em segundos inteiros UTC.
   *
   * `0` nao e "agora": e o `false` do `strtotime()` coagido, e a fila recusa
   * instante `<= 0` (`wp-includes/cron.php:50`). Ver `instante-da-data.ts`.
   */
  readonly instanteEmSegundos: number;
  /**
   * O que `wp_schedule_single_event()` devolveu.
   *
   * **Nenhum ramo do fluxo o consulta** (P7): o legado ignora o retorno, e um
   * `false` aqui significa conteudo em `future` sem evento na fila, em silencio.
   * Esta no resultado so para que o criterio seja afirmavel por teste.
   */
  readonly agendado: boolean;
}

/**
 * `_future_post_hook()` — limpa o evento pendente e agenda um novo na data do
 * conteudo (`wp-includes/post.php:8205`).
 *
 * **Nao verifica estado e nao verifica capacidade, e as duas ausencias sao do
 * legado.** Quem decide que esta funcao roda e o **nome do ponto**
 * (`future_{$post_type}`), resolvido pelo barramento; o corpo dela nao olha
 * `post_status`. E nao ha ator nenhum neste caminho — a transicao pode vir da
 * fila —, exatamente como em `wp_publish_post()`. O **P4** cobra declarar a
 * permissao de toda operacao exposta e **preservar o default de cada camada,
 * inclusive quando o default e permissivo**: esta nao e operacao exposta, e um
 * portao aqui agendaria conteudo de acordo com quem passou, nao com a data.
 */
export function agendarPublicacaoFutura(
  contexto: ContextoDePublicacao,
  conteudo: Conteudo,
): EventoDePublicacaoAgendada {
  // `:8206`: limpa primeiro, sem condicao e sem consultar a fila. E a segunda
  // limpeza da transicao — ver o cabecalho.
  const eventosRemovidos = contexto.fila.limparGancho(
    GANCHO_DE_PUBLICACAO_AGENDADA,
    [conteudo.id],
  );

  // `:8207`: `strtotime( get_gmt_from_date( $post->post_date ) . ' GMT' )`. A
  // data e a LOCAL, convertida — e nao `post_date_gmt`, apesar do docblock.
  const instanteEmSegundos = instanteDaDataDoBancoOuZero(
    contexto.dataGmtDeDataLocal(conteudo.data),
  );

  const agendado = contexto.fila.agendarEventoUnico(
    instanteEmSegundos,
    GANCHO_DE_PUBLICACAO_AGENDADA,
    [conteudo.id],
  );

  return { eventosRemovidos, instanteEmSegundos, agendado };
}
