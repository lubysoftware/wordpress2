/**
 * **CA-6.1 e CA-6.2**: o estado decidido pela comparacao de data, nos dois
 * sentidos (`wp-includes/post.php:4797`-`:4809`).
 *
 * Entrega de **T013** da feature `002-autoria-e-publicacao` (US-6). E o bloco
 * que o ADR-0005 transcreve inteiro, e e a razao de o ADR existir:
 *
 * ```php
 * if ( 'attachment' !== $post_type ) {
 *     $now = gmdate( 'Y-m-d H:i:s' );
 *
 *     if ( 'publish' === $post_status ) {
 *         if ( strtotime( $post_date_gmt ) - strtotime( $now ) >= MINUTE_IN_SECONDS ) {
 *             $post_status = 'future';
 *         }
 *     } elseif ( 'future' === $post_status ) {
 *         if ( strtotime( $post_date_gmt ) - strtotime( $now ) < MINUTE_IN_SECONDS ) {
 *             $post_status = 'publish';
 *         }
 *     }
 * }
 * ```
 *
 * ── AGENDAR NAO E UM COMANDO ───────────────────────────────────────────────
 *
 * UC-04 diz o gatilho em uma linha: *"o autor salva conteudo publicado com data
 * no futuro — nao ha comando 'agendar'"*. ADR-0005 diz a decisao: *"o status
 * `future` nao e escolhido: e calculado"*. E diz o preco de nao a reproduzir:
 * *"nao reimplemente `future` como transicao. Parece mais limpo e muda o
 * comportamento do produto em todos os clientes de escrita"* — porque e **um
 * so** caminho de gravacao que atende publicacao imediata e agendada, em todos
 * os clientes (painel, REST, XML-RPC, importador, extensao).
 *
 * E a conversao e **bidirecional**: salvar um conteudo agendado com data no
 * passado o publica na propria gravacao, sem esperar a fila (CA-6.2). E dessa
 * simetria que vem a consequencia que o ADR chama de desejada — *"o estado nunca
 * fica preso"* — e a que ele chama de surpresa: *"gravar um post publicado com
 * `post_date` no futuro — por importacao, por sincronizacao, por script —
 * **agenda** o post em vez de publica-lo, sem erro e sem aviso. E a causa
 * classica de 'importei e o conteudo nao apareceu'"*. As duas estao reproduzidas,
 * e a segunda **nao** foi tratada como defeito: P1 poe o comportamento observavel
 * do legado como especificacao.
 *
 * ── A FOLGA DE 60 SEGUNDOS, E POR QUE ELA NAO E CONFIGURAVEL AQUI ──────────
 *
 * Ver {@link FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS}.
 *
 * ── AS TRES BORDAS QUE ESTE BLOCO TEM ─────────────────────────────────────
 *
 * 1. **O anexo esta fora, e so ele.** `'attachment' !== $post_type` contorna o
 *    bloco inteiro (`:4797`), porque o estado do anexo tem outro ciclo —
 *    BR-MIGRAR-002, *"anexo nunca e publicado"*, e `state-machines.md` §3.
 *    ADR-0005 avisa: *"quem generalizar a regra para todos os tipos muda o
 *    comportamento da midia"*. Um anexo salvo como `publish` com data futura
 *    permanece `publish`.
 * 2. **Os outros dez estados nao sao tocados.** O `if`/`elseif` cobre `publish` e
 *    `future` e mais nada: rascunho com data futura continua rascunho, pendente
 *    continua pendente, lixeira continua lixeira. Quem acrescentasse `draft` a
 *    comparacao agendaria rascunho, que o legado nao agenda.
 * 3. **A comparacao e `>=` num lado e `<` no outro**, com a **mesma** folga: as
 *    duas sao exaustivas e complementares, logo nao existe data que caia nos dois
 *    ramos nem data que escape de um deles. Trocar qualquer um dos dois
 *    operadores por `>` ou `<=` move a fronteira de exatamente um segundo — e e
 *    essa a borda que o P6 manda afirmar, *"no ultimo instante aceita, um
 *    instante depois recusa"*.
 *
 * ── ONDE ESTE BLOCO E CHAMADO, E POR QUE NAO DAQUI ────────────────────────
 *
 * No legado ele mora **dentro** de `wp_insert_post()`, entre a resolucao do
 * carimbo de modificacao (`:4790`) e a resolucao do estado de comentario
 * (`:4811`), e essa posicao e parte do que ele faz: o estado que sai daqui e o
 * que vai para a coluna e o que alimenta `wp_transition_post_status()` no fim da
 * funcao.
 *
 * **O caminho de gravacao e T005 (US-2) e T007 (US-3), e nenhuma das duas estava
 * pronta quando T013 rodou** — `tasks.md` poe T013 dependendo de T001, T002 e
 * T003, nao de T005. Logo o que T013 entrega e a **regra**, como funcao pura, no
 * ponto exato da sequencia em que ela entra; quem montar `wp_insert_post()` a
 * chama ali, com o `$now` lido **uma vez** por gravacao, e nao uma vez por ramo.
 * Esta declarado assim para que a tarefa de gravacao nao reinvente a comparacao
 * nem a espalhe em dois lugares.
 */

import {
  ESTADO_AGENDADO,
  ESTADO_PUBLICADO,
} from '../publicacao/transicao-de-estado.js';
import { instanteDaDataDoBanco } from './instante-da-data.js';

/**
 * A folga que separa *"publicar agora"* de *"agendar"*: **60 segundos**
 * (`MINUTE_IN_SECONDS`, `wp-includes/default-constants.php:158`).
 *
 * ADR-0005 explica a razao de ela existir: *"publicar 'agora' com um relogio
 * ligeiramente adiantado agendaria o post por alguns segundos, e o evento
 * dependeria de uma requisicao para disparar. A folga e o que faz 'publicar
 * agora' significar agora"*.
 *
 * ⚠️ **E constante, e nao ponto de configuracao, e isso foi medido e nao
 * suposto.** O P6 da constituicao manda que *"cada numero vive num ponto de
 * configuracao nomeado, com o valor de fabrica do legado"* — e manda, na mesma
 * frase, que *"onde o legado nao tem numero, o sistema novo tambem nao tem"*,
 * com *"introduzir limite, prazo ou contagem que o legado nao tem"* na tabela
 * **Nao negociavel**. No legado este numero:
 *
 * - vem de `define( 'MINUTE_IN_SECONDS', 60 )`, **sem** guarda `defined()`
 *   (`default-constants.php:158`), logo nao e redefinivel nem por `wp-config.php`;
 * - aparece **literal** nas duas comparacoes, sem filtro e sem constante propria
 *   — ADR-0005 a chama de *"magica nao configuravel"*.
 *
 * O ADR observa, na secao *Para um porte*, que *"a folga de 60 segundos e a
 * unica parte que vale explicitar como configuracao"*. T013 explicitou o que
 * pode: o numero tem nome, tem fonte citada e tem teste de borda nos dois lados.
 * **Torna-lo alteravel em execucao e outra coisa** — seria criar um ponto de
 * extensao que o produto nao tem, o que o P2 e o P6 recusam —, e por isso nao foi
 * feito. Fica registrado para quem decidir.
 */
export const FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS = 60;

/**
 * `attachment` — o unico tipo que o bloco inteiro contorna (`:4797`).
 *
 * Nomeado aqui, e nao em `../estado-editorial.ts`, porque la ha o vocabulario de
 * **estado** e este e um tipo de conteudo; e nomeado como constante porque e uma
 * comparacao por nome literal, que e a forma do legado — e o unico `if` sobre
 * nome de tipo deste caminho.
 */
export const TIPO_FORA_DA_COMPARACAO_DE_DATA = 'attachment';

/** O que a comparacao de data precisa saber do conteudo que esta sendo gravado. */
export interface ConteudoNaComparacaoDeData {
  /** `$post_type` — e `attachment` e a excecao. */
  readonly tipo: string;
  /**
   * `$post_status` — o estado **ja resolvido** pelo default da aplicacao
   * (`:4703`, T005), que e o que chega a este bloco.
   */
  readonly estado: string;
  /**
   * `$post_date_gmt` — a data **em UTC**, texto no formato da coluna, podendo ser
   * a sentinela.
   *
   * E esta coluna, e nao `post_date`, que decide o estado: o legado resolve
   * `$post_date_gmt` logo antes (`:4778`-`:4786`), e para os estados de data
   * flutuante ele vale a sentinela — o que nao alcanca este bloco, porque nem
   * `publish` nem `future` tem data flutuante.
   */
  readonly dataGmt: string;
}

/**
 * **CA-6.1 e CA-6.2**: o estado do conteudo depois da comparacao de data.
 *
 * Devolve o estado que vai para a coluna — `'future'` quando a data esta a 60
 * segundos ou mais a frente de um conteudo publicado, `'publish'` quando a data
 * de um conteudo agendado esta a menos de 60 segundos a frente, e o estado
 * recebido em todos os outros casos. **Nao escreve nada e nao dispara nada:**
 * quem grava e quem transita e o caminho de gravacao.
 *
 * `agoraEmSegundos` e `strtotime( gmdate( 'Y-m-d H:i:s' ) )` do legado, que e
 * `time()` truncado ao segundo — e `time()` **ja** e segundo inteiro, logo os
 * dois sao o mesmo numero. Vem por argumento, e nao da porta de relogio, por
 * duas razoes: a funcao fica pura, e o legado le o instante **uma vez** por
 * gravacao (`$now`, `:4798`) e o compara nos dois ramos — ler duas vezes
 * abriria a janela de um segundo entre as duas comparacoes.
 */
export function resolverEstadoPelaData(
  conteudo: ConteudoNaComparacaoDeData,
  agoraEmSegundos: number,
): string {
  // `:4797`: o anexo contorna o bloco inteiro (BR-MIGRAR-002).
  if (conteudo.tipo === TIPO_FORA_DA_COMPARACAO_DE_DATA) {
    return conteudo.estado;
  }

  // `strtotime( $post_date_gmt ) - strtotime( $now )`. O `?? 0` e o `false` do
  // `strtotime()` como a subtracao do PHP o ve — ver `instante-da-data.ts`.
  const distanciaEmSegundos =
    (instanteDaDataDoBanco(conteudo.dataGmt) ?? 0) - agoraEmSegundos;

  // `:4800`: publicado com data a frente vira agendado.
  if (conteudo.estado === ESTADO_PUBLICADO) {
    return distanciaEmSegundos >= FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS
      ? ESTADO_AGENDADO
      : conteudo.estado;
  }

  // `:4804`: agendado com data que chegou vira publicado. E `elseif` no legado,
  // logo nenhum outro estado entra em comparacao nenhuma.
  if (conteudo.estado === ESTADO_AGENDADO) {
    return distanciaEmSegundos < FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS
      ? ESTADO_PUBLICADO
      : conteudo.estado;
  }

  return conteudo.estado;
}
