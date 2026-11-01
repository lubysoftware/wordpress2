/**
 * **US-3**: restaurar conteudo da lixeira como rascunho.
 *
 * Entrega de **T007** da feature `005-retencao-e-descarte`. Sao duas funcoes, com
 * a mesma divisao de `descarte/descartar-para-a-lixeira.ts`:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link restaurar} | a operacao *"restaurar"* da tabela *Contratos* de `plan.md` — a acao `untrash` do painel (`wp-admin/post.php:287`) | **sim**, CA-3.5 |
 * | {@link restaurarDaLixeira} | `wp_untrash_post()` (`wp-includes/post.php:4168`) | **nao**, e e assim no legado |
 *
 * ---
 *
 * # A sequencia, que e o que esta tarefa entrega
 *
 * | # | passo | linha | emite |
 * |---|---|---|---|
 * | 1 | le o conteudo; sem linha, retorno silencioso | `:4169`-`:4173` | uma leitura |
 * | 2 | fora da lixeira, devolve `false` | `:4177`-`:4179` | **nada** |
 * | 3 | le o estado anterior | `:4181` | uma leitura |
 * | 4 | o filtro `pre_untrash_post`; valor nao nulo **para** | `:4193`-`:4196` | **nada** |
 * | 5 | a acao `untrash_post` | `:4207` | — |
 * | 6 | o estado default: `draft`, ou `inherit` no anexo (CA-3.1, CA-3.2) | `:4209` | — |
 * | 7 | o filtro `wp_untrash_post_status` | `:4226` | — |
 * | 8 | apaga o estado anterior (CA-3.3) | `:4228` | `SELECT`+`DELETE`, ou so o `SELECT` |
 * | 9 | apaga o instante do descarte (CA-3.3) | `:4229` | `SELECT`+`DELETE`, ou so o `SELECT` |
 * | 10 | grava o estado | `:4231` | o caminho de gravacao de BC-01 |
 * | 11 | gravacao falhou, devolve `false` — **e os marcadores ja se foram** | `:4238` | nada a mais |
 * | 12 | devolve os comentarios (US-2, T005) | `:4242` | a cascata |
 * | 13 | a acao `untrashed_post`, e devolve o conteudo | `:4253`-`:4255` | — |
 *
 * Quatro coisas nesta ordem um porte troca sem perceber:
 *
 * 1. 🔴 **Os marcadores saem ANTES da gravacao, ao contrario do que UC-10 numera.**
 *    O fluxo principal de UC-10 poe *"grava o status"* no passo 3 e *"apaga os
 *    metadados"* no passo 4; o legado faz o inverso (`:4228`-`:4231`), e
 *    `armazenamento/marcadores-de-lixeira.ts` ja registrava isso. Nao ha decisao
 *    humana sobre a ordem: o **P1** poe o legado como especificacao, e a
 *    numeracao de UC-10 e descricao do fluxo.
 * 2. **E o passo 11 que torna a ordem observavel, e o estrago e o oposto do
 *    descarte.** Se a gravacao falha, o conteudo **fica em `trash` sem marcador
 *    nenhum**. A coleta varre por `_wp_trash_meta_time`
 *    (`wp-includes/functions.php:6979`), logo **ele nunca mais vence**: fica na
 *    lixeira para sempre, e o autor passa a precisar so de `delete_posts` para
 *    mexer nele, mesmo que estivesse publicado (`capabilities.php:158`). No
 *    descarte a falha deixa marcador de mais; aqui, de menos. Nao ha transacao.
 * 3. **`wp_untrash_post_status` dispara antes de os marcadores sairem.** E a
 *    ultima posicao em que quem o escuta os ve no banco.
 * 4. **Os comentarios vem depois do estado e antes da ultima acao**, como no
 *    descarte. Falha do passo 11 **nao** os devolve: os comentarios ficam
 *    `post-trashed` e o marcador agrupado fica gravado.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao monta o `UPDATE` do estado.** E o mesmo caminho de BC-01 do descarte;
 *   ver `ConteudoNaRestauracao.gravarEstado`.
 * - **Nao devolve o estado anterior.** `R2`. Ver `estado-na-restauracao.ts`, com
 *   o caminho do "Desfazer", que e filtro.
 * - **Nao apaga `_wp_trash_meta_comments_status`.** E o passo 7 da cascata
 *   (`:4372`), e so acontece quando o passo 12 daqui acontece.
 * - **Nao republica nem reagenda** (CA-3.4). Um conteudo `future` volta rascunho,
 *   e voltar ao ar e outra operacao, de BC-01.
 * - **Nao pergunta pela lixeira nem por `MEDIA_TRASH`.** A funcao nao le nenhuma
 *   das duas: um anexo posto em `trash` por chamada direta a `wp_trash_post()`
 *   sai por aqui. A **resposta 9** decide a lixeira de midia, nao esta linha.
 * - **Nao restaura comentario descartado por si.** `wp_untrash_comment()` e da
 *   moderacao de BC-03.
 */

import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import type {
  ContextoDeRestauracao,
  RegistroNaRestauracao,
} from './contexto-de-restauracao.js';
import { estadoPadraoDaRestauracao } from './estado-na-restauracao.js';
import {
  autorizarRestauracao,
  type RecusaDaRestauracao,
} from './permissao-de-restauracao.js';

/**
 * O que aconteceu. Seis desfechos, e **nenhum deles e excecao**.
 *
 * O nome leva *"do conteudo"* porque `DesfechoDaRestauracao` ja e o da cascata de
 * comentarios (T005).
 */
export type DesfechoDaRestauracaoDoConteudo =
  /** O estado foi gravado, os marcadores se foram e a cascata rodou. */
  | 'restaurado'
  /** `get_post()` nao achou a linha: retorno silencioso do legado (`:4172`). */
  | 'inexistente'
  /** Nao esta em `trash`: `false`, sem emitir comando nenhum (`:4178`). */
  | 'fora-da-lixeira'
  /** `pre_untrash_post` devolveu valor e a restauracao nao comecou (`:4195`). */
  | 'interceptado'
  /**
   * A gravacao falhou (`:4239`). ⚠️ **Os dois marcadores ja foram apagados** e o
   * conteudo continua em `trash`: item 2 do cabecalho.
   */
  | 'nao-gravado'
  /** Sem `delete_post` daquele conteudo: CA-3.5. */
  | 'recusado';

/** O que a operacao devolve. */
export interface ResultadoDaRestauracaoDoConteudo {
  readonly desfecho: DesfechoDaRestauracaoDoConteudo;
  /** A recusa de permissao, ou `null`. Preenchida **so** no desfecho `recusado`. */
  readonly recusa: RecusaDaRestauracao | null;
  /**
   * O conteudo **como o legado o devolve**, ou `null`.
   *
   * ⚠️ **Ele carrega o estado `trash`, nao o gravado.** `wp_untrash_post()`
   * termina em `return $post` (`:4255`), e `$post` e o registro do passo 1 — a
   * mesma armadilha do retorno do descarte.
   */
  readonly conteudo: RegistroNaRestauracao | null;
  /** `$previous_status` (`:4181`). Texto vazio quando o marcador nao existe. */
  readonly estadoAnterior: string | null;
  /**
   * **CA-3.1 e CA-3.2**: o estado gravado, depois do filtro, ou `null` quando
   * nada foi gravado.
   */
  readonly estadoGravado: string | null;
  /**
   * O que `pre_untrash_post` devolveu, ou `null` quando ele nao interceptou. No
   * legado este valor **e** o retorno da funcao (`:4195`).
   */
  readonly interceptacao: boolean | null;
}

/** Quem se restaura. */
export interface PedidoDeRestauracao {
  readonly conteudoId: number;
}

const SEM_RESTAURACAO = {
  recusa: null,
  conteudo: null,
  estadoAnterior: null,
  estadoGravado: null,
  interceptacao: null,
} as const;

/**
 * **A operacao de US-3.** Restaura o conteudo, exigindo `delete_post` daquele
 * registro.
 *
 * **Permissao exigida: `delete_post` do conteudo**, que a traducao resolve pelo
 * estado anterior gravado (CA-3.5). Ver `permissao-de-restauracao.ts`.
 *
 * A ordem e a da acao `untrash` do painel (`wp-admin/post.php:290`-`:302`). Como
 * em `descartar`, o ultimo passo recebe o **identificador** e a funcao do legado
 * le a linha de novo: sem cache de objeto saem duas leituras.
 */
export function restaurar(
  contexto: ContextoDeRestauracao,
  pedido: PedidoDeRestauracao,
): ResultadoDaRestauracaoDoConteudo {
  const conteudo = contexto.conteudo.obterPorId(pedido.conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_RESTAURACAO };
  }

  const recusa = autorizarRestauracao(contexto, pedido.conteudoId);
  if (recusa !== null) {
    return { desfecho: 'recusado', ...SEM_RESTAURACAO, recusa, conteudo };
  }

  return restaurarDaLixeira(contexto, pedido.conteudoId);
}

/**
 * `wp_untrash_post()` — a restauracao, **sem portao de capacidade**
 * (`wp-includes/post.php:4168`). Os treze passos estao no cabecalho deste arquivo.
 *
 * Exportada porque e **superficie publicada** (P8): funcao publica do nucleo, sem
 * verificacao, por desenho.
 */
export function restaurarDaLixeira(
  contexto: ContextoDeRestauracao,
  conteudoId: number,
): ResultadoDaRestauracaoDoConteudo {
  // Passo 1 (`:4169`): sem linha, silencio (P7).
  const conteudo = contexto.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_RESTAURACAO };
  }

  // `$post_id = $post->ID` (`:4175`).
  const id = conteudo.id;

  // Passo 2 (`:4177`): e a guarda que protege o rascunho de quem restaurou duas
  // vezes. Nenhum comando sai, nem a leitura do marcador.
  if (conteudo.estado !== ESTADO_DE_LIXEIRA) {
    return { desfecho: 'fora-da-lixeira', ...SEM_RESTAURACAO, conteudo };
  }

  // Passo 3 (`:4181`). Marcador ausente e texto vazio, e o fluxo segue: o
  // `plan.md` chama isso de "estado tolerado".
  const marcadores = contexto.armazenamento.marcadoresDoConteudo;
  const estadoAnterior = marcadores.estadoAnterior(id);

  // Passo 4 (`:4193`): antes de qualquer escrita.
  const interceptacao =
    contexto.ganchos?.filtrarRestauracao?.(null, conteudo, estadoAnterior) ??
    null;
  if (interceptacao !== null) {
    return {
      desfecho: 'interceptado',
      ...SEM_RESTAURACAO,
      conteudo,
      estadoAnterior,
      interceptacao,
    };
  }

  // Passo 5 (`:4207`).
  contexto.ganchos?.antesDeRestaurar?.(id, estadoAnterior);

  // Passos 6 e 7 (`:4209` e `:4226`): CA-3.1 e CA-3.2. O default nao le a
  // memoria; quem pode usa-la e o filtro.
  const estadoPadrao = estadoPadraoDaRestauracao(conteudo.tipo);
  const estadoAGravar =
    contexto.ganchos?.filtrarEstadoRestaurado?.(
      estadoPadrao,
      id,
      estadoAnterior,
    ) ?? estadoPadrao;

  // Passos 8 e 9 (`:4228` e `:4229`): CA-3.3, nesta ordem e ANTES da gravacao.
  // Ver os itens 1 e 2 do cabecalho.
  marcadores.apagarEstadoAnterior(id);
  marcadores.apagarInstanteDoDescarte(id);

  // Passo 10 (`:4231`): o caminho de gravacao de BC-01.
  const gravado = contexto.conteudo.gravarEstado(id, estadoAGravar);

  // Passo 11 (`:4238`): a verdade de PHP sobre o retorno — `0` e falha. Os
  // marcadores NAO voltam: nao ha transacao.
  if (gravado === 0) {
    return {
      desfecho: 'nao-gravado',
      ...SEM_RESTAURACAO,
      conteudo,
      estadoAnterior,
    };
  }

  // Passo 12 (`:4242`): o passo 5 de UC-10, que e T005. O retorno e ignorado.
  contexto.restaurarComentarios(id);

  // Passo 13 (`:4253`): a ultima acao, com os comentarios ja devolvidos.
  contexto.ganchos?.depoisDeRestaurar?.(id, estadoAnterior);

  return {
    desfecho: 'restaurado',
    recusa: null,
    // `return $post` (`:4255`): o registro do passo 1, com o estado `trash`.
    conteudo,
    estadoAnterior,
    estadoGravado: estadoAGravar,
    interceptacao: null,
  };
}

/**
 * O `! wp_untrash_post( $post_id )` das quatro superficies
 * (`wp-admin/post.php:302`, `edit.php:159`, `upload.php:321`,
 * `includes/ajax-actions.php:940`), como `apagadoNaVisaoDoChamador` na exclusao.
 *
 * ⚠️ **`inexistente` e `fora-da-lixeira` caem no mesmo ramo**, e o filtro que
 * devolve `true` conta como restaurado sem nada ter acontecido: o painel redireciona
 * com `untrashed=1` (`wp-admin/post.php:306`).
 */
export function restauradoNaVisaoDoChamador(
  resultado: ResultadoDaRestauracaoDoConteudo,
): boolean {
  switch (resultado.desfecho) {
    case 'restaurado':
      return true;
    case 'interceptado':
      return resultado.interceptacao === true;
    case 'inexistente':
    case 'fora-da-lixeira':
    case 'nao-gravado':
    case 'recusado':
      return false;
  }
}
