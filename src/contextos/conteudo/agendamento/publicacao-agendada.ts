/**
 * **CA-6.3 e CA-6.4**: `check_and_publish_future_post()` — a verificacao dupla
 * na hora de publicar (`wp-includes/post.php:5482`).
 *
 * Entrega de **T013** da feature `002-autoria-e-publicacao` (US-6). E a ancora
 * que `spec.md` da para esta historia, e e o terceiro mecanismo de guarda da
 * tabela do ADR-0005.
 *
 * ── O QUE A VERIFICACAO DUPLA E, E POR QUE ELA NAO SE REMOVE ───────────────
 *
 * BR-MIGRAR-006 (`P6`, 🟢) em uma frase: *"**Agendamento e guardado por
 * verificacao dupla.** `check_and_publish_future_post()` recusa publicar o que
 * nao esta em `future` e, se a data ainda nao chegou, **reagenda** em vez de
 * publicar. O cron nao e confiado."* O docblock do legado declara a intencao com
 * as palavras dele — *"This safeguard prevents cron from publishing drafts,
 * etc."* (`:5475`-`:5476`) — e o ramo de reagendamento tem, no codigo, o
 * comentario *"Uh oh, someone jumped the gun!"* (`:5495`).
 *
 * UC-04 explica **por que** o unico ponto do sistema que desconfia da propria
 * fila e este: *"a publicacao agendada confere o status *e* a data no momento de
 * executar, porque o agendador pode disparar atrasado, repetido ou para um
 * registro que mudou"*. E a fila do legado e exatamente assim — A9, *"cron nao e
 * cron: a fila so avanca quando chega requisicao HTTP"* (`domain.md` §2.6), com
 * a excecao de UC-04 em letra: *"nenhuma requisicao HTTP chega depois da data →
 * o conteudo permanece agendado indefinidamente"*.
 *
 * ⚠️ **A nota de compatibilidade de BR-MIGRAR-006 e endereçada a esta tarefa:**
 * *"Num alvo com fila real a verificacao dupla pareceria redundante — e remove-la
 * mudaria o comportamento no primeiro atraso."* O risco 3 de `plan.md` repete:
 * *"implementar um agendador confiavel e remover a verificacao dupla muda
 * comportamento observavel"*. As duas guardas estao aqui mesmo que a fila do
 * alvo venha a ser confiavel.
 *
 * ── AS QUATRO SAIDAS, E QUE NENHUMA DELAS E ERRO ───────────────────────────
 *
 * ```php
 * function check_and_publish_future_post( $post ) {
 *     $post = get_post( $post );
 *     if ( ! $post )                          { return; }              // :5485
 *     if ( 'future' !== $post->post_status )  { return; }              // :5489
 *     $time = strtotime( $post->post_date_gmt . ' GMT' );              // :5493
 *     if ( $time > time() ) {                                          // :5496
 *         wp_clear_scheduled_hook( 'publish_future_post', array( $post->ID ) );
 *         wp_schedule_single_event( $time, 'publish_future_post', array( $post->ID ) );
 *         return;
 *     }
 *     wp_publish_post( $post->ID );                                    // :5503
 * }
 * ```
 *
 * A funcao **nao devolve nada**, nao registra nada e nao sinaliza nada: as tres
 * saidas que nao publicam sao silencio puro. E P7 — *"preserve o modo de falha,
 * inclusive o silencio"* — e o cenario `@critico` de
 * `02-publicacao-e-agendamento-de-conteudo.feature` o cobra com estas palavras:
 * *"Quando a tarefa e executada para um conteudo que nao esta em estado agendado
 * / Entao nenhuma das duas publica / E **nenhuma das duas registra erro**"*. O
 * comentario do legado no fim e explicito sobre a quarta saida:
 * *"wp_publish_post() returns no meaningful value"*.
 *
 * {@link ResultadoDaPublicacaoAgendada} distingue os quatro desfechos **sem**
 * inventar mensagem para nenhum, pela mesma razao que `../publicacao/publicar.ts`
 * distingue os dele: o criterio precisa ser afirmavel por teste, e nenhum ramo do
 * fluxo consulta o que o resultado carrega.
 *
 * ── AS DUAS GUARDAS SAO INDEPENDENTES, E A ORDEM DELAS IMPORTA ─────────────
 *
 * UC-04 chama as duas de *"dois guardas independentes"*, e CA-6.6 de
 * `backlog/tests.md` (UT-024-6) cobra *"as duas verificacoes para publicar: o
 * evento e o estado corrente"*. A ordem e **estado antes de data**: um conteudo
 * que saiu de agendado nao tem a data conferida, nem reagenda. Inverter as duas
 * faria um rascunho com data futura ser **reagendado** — isto e, um evento de
 * publicacao posto na fila para um rascunho, que o legado nunca poe.
 *
 * ── TRES DETALHES QUE DECIDEM A PARIDADE ──────────────────────────────────
 *
 * 1. **A comparacao e `>`, nao `>=`.** Data exatamente igual ao instante corrente
 *    **publica**. E a borda que o P6 manda afirmar, e ela e diferente da folga de
 *    60 segundos da gravacao: aqui nao ha folga nenhuma. Um conteudo pode, por
 *    isso, ser agendado na gravacao (59 segundos a frente nao agenda, 60 agenda) e
 *    publicado pela fila no segundo exato da data.
 * 2. **A data lida e `post_date_gmt`**, crua, com `' GMT'` concatenado — e nao
 *    `post_date` convertida, que e o que `_future_post_hook()` faz
 *    (`evento-de-publicacao-agendada.ts`). As duas fontes so coincidem enquanto o
 *    fuso do site nao muda; a assimetria e do legado e esta reproduzida.
 * 3. **`wp_publish_post()` recebe o IDENTIFICADOR, nao o registro** (`:5503`),
 *    apesar de a funcao ter o registro em maos. Logo a linha e **relida** dentro
 *    de `wp_publish_post()`, e a sequencia de comandos tem uma leitura a mais do
 *    que teria se o objeto viajasse. A area 3 da Decisao 2 compara *"snapshot +
 *    sequencia de comandos"*: passar o registro para economizar a consulta mudaria
 *    a sequencia.
 *
 * ── O QUE ESTA FUNCAO NAO VERIFICA, E ISSO E SUPERFICIE PUBLICADA ──────────
 *
 * **Nao verifica capacidade nenhuma**, e nao poderia: quem a chama e a fila
 * (`add_action( 'publish_future_post', 'check_and_publish_future_post', 10, 1 )`,
 * `wp-includes/default-filters.php:357`) e **nao ha ator** no disparo. O **P4**
 * manda declarar a permissao de toda operacao exposta e **preservar o default de
 * cada camada, inclusive quando o default e permissivo**: a permissao desta
 * operacao e *"nenhuma"*, e e por isso que T003 entregou
 * `transitarParaPublicado()` sem portao — o cabecalho de `../publicacao/publicar.ts`
 * registra que dar-lhe um portao *"quebraria a publicacao agendada de T013, em
 * que ninguem esta autenticado"*.
 */

import type { Conteudo } from '../armazenamento/index.js';
import type { PortaDeRelogio } from '../portas/index.js';
import {
  GANCHO_DE_PUBLICACAO_AGENDADA,
  type ContextoDePublicacao,
} from '../publicacao/contexto-de-publicacao.js';
import {
  transitarParaPublicado,
  type ResultadoDaPublicacao,
} from '../publicacao/publicar.js';
import { ESTADO_AGENDADO } from '../publicacao/transicao-de-estado.js';
import { instanteDaDataDoBancoOuZero } from './instante-da-data.js';

/**
 * A prioridade com que o nucleo registra `check_and_publish_future_post` no
 * gancho `publish_future_post` (`wp-includes/default-filters.php:357`).
 *
 * **E 10, e nao 5 como os dois ouvintes de transicao** — o registro e
 * `add_action( 'publish_future_post', 'check_and_publish_future_post', 10, 1 )`,
 * com a prioridade escrita por extenso. O numero e parte do contrato: uma
 * extensao registrada em 5 roda **antes** da verificacao dupla e ve o conteudo
 * ainda em `future`.
 */
export const PRIORIDADE_DA_VERIFICACAO_DUPLA = 10;

/**
 * O contexto da publicacao agendada: o de publicacao **mais o relogio**.
 *
 * Estende {@link ContextoDePublicacao} em vez de substituir, porque o passo
 * final desta operacao e `wp_publish_post()` inteira — com os dez pontos de
 * extensao, o termo padrao e o ouvinte do nucleo que ela atravessa.
 *
 * **E ela que acrescenta o relogio, e so ela.** O cabecalho de
 * `../publicacao/contexto-de-publicacao.ts` registra, desde T003, que
 * `wp_publish_post()` nao le o tempo e que pedir o relogio ali *"convidaria a
 * tocar o carimbo de modificacao"*. Esta operacao le o tempo porque o legado o
 * le (`time()`, `:5496`) — e o le **uma vez**, nesta comparacao.
 */
export interface ContextoDeAgendamento extends ContextoDePublicacao {
  readonly relogio: PortaDeRelogio;
}

/** O que aconteceu. Quatro desfechos, e nenhum deles e erro. */
export type DesfechoDaPublicacaoAgendada =
  /**
   * As duas guardas passaram e `wp_publish_post()` foi chamada (`:5503`).
   *
   * ⚠️ **Nao e promessa de que o estado mudou.** `wp_publish_post()` rele a
   * linha, e o legado descarta o que ela devolve — se outra escrita publicou o
   * conteudo entre as duas leituras, a guarda de P7 la dentro desiste e nada
   * acontece. O desfecho de **la** esta em
   * {@link ResultadoDaPublicacaoAgendada.publicacao}; este diz apenas que esta
   * funcao chegou ao fim sem recusar.
   */
  | 'publicado'
  /** `get_post()` nao achou a linha: retorno silencioso (`:5485`). */
  | 'inexistente'
  /**
   * **CA-6.3**: o registro nao esta mais em agendado, logo nada acontece
   * (`:5489`). Nem publicacao, nem reagendamento, nem erro.
   */
  | 'nao-esta-agendado'
  /** **CA-6.4**: a data ainda nao chegou, logo o evento voltou para a fila (`:5495`). */
  | 'reagendado';

/** O que o reagendamento deixou na fila (CA-6.4). */
export interface ReagendamentoDaPublicacao {
  /**
   * O instante para o qual o evento foi pedido de novo: o **mesmo** `$time` que
   * a comparacao acabou de rejeitar (`:5498`).
   *
   * E o que o cenario de PT-002 compara — *"as duas reagendam a tarefa, com o
   * mesmo proximo horario"*. O legado nao adia, nao arredonda e nao acrescenta
   * folga: reagenda para a data do conteudo.
   */
  readonly instanteEmSegundos: number;
  /** `wp_clear_scheduled_hook()` (`:5497`), que vem **antes** do novo evento. */
  readonly eventosRemovidos: number | false;
  /** `wp_schedule_single_event()` (`:5498`). Ignorado pelo legado (P7). */
  readonly agendado: boolean;
}

/** O que a operacao devolve. */
export interface ResultadoDaPublicacaoAgendada {
  readonly desfecho: DesfechoDaPublicacaoAgendada;
  /**
   * O conteudo como a primeira leitura o encontrou, ou `null` quando a linha nao
   * existe. **Nao** reflete a publicacao: quem a fez foi `wp_publish_post()`, e o
   * que ela deixou esta em {@link ResultadoDaPublicacaoAgendada.publicacao}.
   */
  readonly conteudo: Conteudo | null;
  /** O resultado de `wp_publish_post()`, ou `null` quando ela nao foi chamada. */
  readonly publicacao: ResultadoDaPublicacao | null;
  /** O reagendamento de CA-6.4, ou `null`. */
  readonly reagendamento: ReagendamentoDaPublicacao | null;
}

const SEM_PUBLICACAO = {
  publicacao: null,
  reagendamento: null,
} as const;

/**
 * `check_and_publish_future_post()` — publica o conteudo agendado **se** ele
 * ainda estiver agendado e **se** a data ja tiver chegado
 * (`wp-includes/post.php:5482`).
 *
 * **Permissao exigida: nenhuma, e isso e o legado.** Quem a chama e a fila, sem
 * ator — ver a ultima secao do cabecalho deste arquivo. A operacao que exige a
 * capacidade de publicar e `publicar()`, de US-1.
 *
 * Aceita `number` ou o proprio registro, como `get_post()` aceita `int|WP_Post`:
 * so a primeira forma consulta.
 */
export function publicarSeAindaAgendado(
  contexto: ContextoDeAgendamento,
  referencia: number | Conteudo,
): ResultadoDaPublicacaoAgendada {
  // `:5483`: `get_post( $post )`. Com o registro em maos o legado nao consulta.
  const conteudo =
    typeof referencia === 'number'
      ? contexto.armazenamento.conteudo.obterPorId(referencia)
      : referencia;

  if (conteudo === null) {
    return { desfecho: 'inexistente', conteudo: null, ...SEM_PUBLICACAO };
  }

  // Guarda 1 (`:5489`), CA-6.3: o estado vem ANTES da data. Silencio puro —
  // nenhuma escrita, nenhum ponto de extensao, nenhum registro.
  if (conteudo.estado !== ESTADO_AGENDADO) {
    return { desfecho: 'nao-esta-agendado', conteudo, ...SEM_PUBLICACAO };
  }

  // `:5493`: `strtotime( $post->post_date_gmt . ' GMT' )`. O `0` no lugar do
  // `false` e o que a comparacao do PHP ve — ver `instante-da-data.ts`.
  const instanteEmSegundos = instanteDaDataDoBancoOuZero(conteudo.dataGmt);

  // Guarda 2 (`:5496`), CA-6.4: *"Uh oh, someone jumped the gun!"*. A comparacao
  // e `>`, logo data igual ao instante corrente publica.
  if (instanteEmSegundos > contexto.relogio.agoraEmSegundos()) {
    // `:5497`, com o comentario do legado: *"Clear anything else in the
    // system."* Limpa antes de agendar, como `_future_post_hook()`.
    const eventosRemovidos = contexto.fila.limparGancho(
      GANCHO_DE_PUBLICACAO_AGENDADA,
      [conteudo.id],
    );

    // `:5498`: o MESMO instante, sem adiar e sem folga.
    const agendado = contexto.fila.agendarEventoUnico(
      instanteEmSegundos,
      GANCHO_DE_PUBLICACAO_AGENDADA,
      [conteudo.id],
    );

    return {
      desfecho: 'reagendado',
      conteudo,
      publicacao: null,
      reagendamento: { instanteEmSegundos, eventosRemovidos, agendado },
    };
  }

  // `:5503`: `wp_publish_post( $post->ID )` — o IDENTIFICADOR, nao o registro,
  // logo a linha e relida. Ver o detalhe 3 do cabecalho.
  const publicacao = transitarParaPublicado(contexto, conteudo.id);

  return {
    desfecho: 'publicado',
    conteudo,
    publicacao,
    reagendamento: null,
  };
}
