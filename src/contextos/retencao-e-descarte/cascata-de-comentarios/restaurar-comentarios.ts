/**
 * **US-2**, segunda metade: devolver cada comentario ao estado que tinha, em
 * lote por estado.
 *
 * Entrega de **T005** da feature `005-retencao-e-descarte` — CA-2.3 (*"restaurar
 * o conteudo devolve cada comentario ao estado que tinha, em lote por estado"*) e
 * a regra que US-2 carrega junto: *"se o estado anterior nao estiver gravado, o
 * comentario restaurado volta para a fila de moderacao"*. E
 * `wp_untrash_post_comments()` (`wp-includes/post.php:4329`), o passo 5 de
 * UC-10.
 *
 * ⚠️ **Esta funcao e de T005 e nao de T007, embora quem a chame seja T007.**
 * CA-2.3 esta na lista de criterios de T005 em `tasks.md`, e a dependencia
 * declarada ali e a inversa — *"T007 depende de T001, T002, T003, T005"*. O que
 * T007 (US-3) acrescenta e a posicao da chamada dentro de
 * `wp_untrash_post()`: **depois** da gravacao do estado `draft` e **antes** da
 * acao `untrashed_post` (`:4242`), com os marcadores do conteudo ja apagados
 * (`:4228`-`:4229`).
 *
 * ---
 *
 * # A sequencia, que e o que esta tarefa entrega
 *
 * Os oito passos, na ordem, com o que cada um emite:
 *
 * | # | passo | linha | emite |
 * |---|---|---|---|
 * | 1 | le o conteudo; sem linha, `null` silencioso | `:4332`-`:4336` | uma leitura |
 * | 2 | le o marcador agrupado | `:4340` | uma leitura |
 * | 3 | sem memoria, devolve **`true`** e **para** | `:4342`-`:4344` | **nada** |
 * | 4 | a acao `untrash_post_comments` | `:4353` | — |
 * | 5 | agrupa os comentarios por estado guardado (CA-2.3) | `:4356`-`:4359` | — |
 * | 6 | por grupo: `post-trashed` vira `'0'`, e grava o lote | `:4361`-`:4368` | **um `UPDATE` por grupo** |
 * | 7 | limpa o cache, e apaga o marcador agrupado | `:4370` e `:4372` | o `SELECT`+`DELETE` do metadado |
 * | 8 | a acao `untrashed_post_comments`, e devolve `null` | `:4381`-`:4383` | — |
 *
 * Cinco coisas aqui nao sao arbitrarias:
 *
 * 1. **A guarda do passo 3 vem ANTES da acao do passo 4** — o oposto do gemeo
 *    do descarte, em que a acao vem antes da guarda. Conteudo sem memoria
 *    gravada **nao** dispara `untrash_post_comments`. A assimetria entre os dois
 *    pares esta no legado e e observavel por quem escuta os quatro pontos.
 * 2. **Um `UPDATE` por estado distinto, nao um por comentario.** E o *"em lote
 *    por estado"* de CA-2.3, e a ordem dos lotes e a ordem em que cada estado
 *    **apareceu pela primeira vez** no marcador — que e a ordem do `SELECT` sem
 *    `ORDER BY` da suspensao. A contagem e a ordem dos comandos sao o que a area
 *    3 da Decisao 2 de `parity_specs.md` compara.
 * 3. **`post-trashed` guardado vira `'0'`.** O legado comenta a linha com
 *    *"Confidence check. This shouldn't happen."* (`:4362`), e nao e verdade que
 *    nao acontece: basta chamar a suspensao duas vezes. O comentario cuja
 *    memoria se perdeu volta para a **fila de moderacao**, nao para onde estava —
 *    e e a borda de UT-048-6. ⚠️ **O grupo continua sendo o do estado original:**
 *    a troca e do valor escrito, nao da chave de agrupamento, logo um marcador
 *    com `post-trashed` **e** `'0'` emite **dois** `UPDATE` que gravam o mesmo
 *    `'0'`.
 * 4. **O marcador e apagado DEPOIS de ser usado** (`:4372`), nao antes: a
 *    restauracao le o valor e so entao o descarta. E nao ha transacao — se o
 *    passo 6 falhar no meio, parte dos comentarios volta e o marcador ainda
 *    esta la.
 * 5. **O retorno esta invertido em relacao a intuicao.** O docblock declara
 *    `true|null`: o caminho **sem memoria** devolve `true` (`:4343`) e o caminho
 *    que fez todo o trabalho devolve `null` (`:4383`). Nenhum chamador do nucleo
 *    le o valor, e ele fica reproduzido porque e observavel por extensao (P8).
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao verifica capacidade.** Ver a secao da declaracao de permissao em
 *   `contexto-da-cascata.ts`. Quem verifica e `wp_untrash_post()` (US-3, T007),
 *   e **pelo estado anterior gravado**, que e CA-3.5.
 * - **Nao restaura o conteudo.** O estado `draft` de `R2` — *"restaurar da
 *   lixeira devolve como rascunho, nao ao estado anterior"* — e T007. ⚠️ A
 *   assimetria e deliberada no legado e UC-10 a aponta: *"os comentarios voltam
 *   melhor do que o conteudo"* — a memoria do comentario e usada, a do conteudo
 *   nao.
 * - **Nao apaga os marcadores do conteudo.** `_wp_trash_meta_status` e
 *   `_wp_trash_meta_time` do conteudo sao apagados por `wp_untrash_post()`
 *   (`:4228`-`:4229`), antes de chamar esta funcao. O unico marcador que esta
 *   operacao apaga e o agrupado.
 * - **Nao usa a API de estado de comentario.** Ver a tabela de
 *   `armazenamento/comentarios-do-conteudo.ts`: nenhum ponto de extensao de
 *   transicao dispara, e `comment_count` nao e recalculado.
 */

import type { EstadoGuardadoDeComentario } from '../armazenamento/index.js';
import type { ContextoDaCascataDeComentarios } from './contexto-da-cascata.js';
import {
  ESTADO_DA_FILA_DE_MODERACAO,
  ESTADO_DE_SUSPENSAO_EM_CASCATA,
} from './estado-de-suspensao.js';

/** O que aconteceu. Tres desfechos, e **nenhum deles e excecao**. */
export type DesfechoDaRestauracao =
  /** Os lotes foram gravados e o marcador agrupado foi apagado. */
  | 'restaurados'
  /** `get_post()` nao achou a linha: `null` silencioso do legado (`:4335`). */
  | 'inexistente'
  /**
   * Nao havia memoria gravada: o legado devolve **`true`** e nenhum comando sai
   * (`:4343`). Cobre marcador ausente **e** marcador com arranjo vazio, porque
   * `! $statuses` e verdadeiro para os dois. ⚠️ A acao
   * `untrash_post_comments` **nao** dispara — item 1 do cabecalho.
   */
  | 'sem-memoria';

/** Um lote: os comentarios que recebem o mesmo valor, em um comando. */
export interface LoteDaRestauracao {
  /**
   * O estado **guardado** que agrupou o lote — a chave de `$group_by_status`
   * (`wp-includes/post.php:4358`).
   */
  readonly estadoGuardado: string;
  /**
   * O valor **escrito** na coluna. Igual a {@link estadoGuardado}, menos quando
   * o guardado e `post-trashed`: ai e `'0'`, a fila de moderacao (`:4363`).
   */
  readonly estadoGravado: string;
  /**
   * Os comentarios do lote, na ordem em que apareceram no marcador — a ordem do
   * `IN`.
   */
  readonly comentarioIds: readonly number[];
  /** As linhas que o `UPDATE` do lote afetou. */
  readonly linhasAfetadas: number;
}

/** O que a restauracao devolve. */
export interface ResultadoDaRestauracao {
  readonly desfecho: DesfechoDaRestauracao;
  /**
   * A memoria lida do marcador, ou lista vazia. `null` do marcador ausente e
   * arranjo vazio chegam aqui iguais, como `! $statuses` os iguala.
   */
  readonly estadosGuardados: readonly EstadoGuardadoDeComentario[];
  /**
   * **CA-2.3**: os lotes, **na ordem em que os `UPDATE` sairam**. Lista vazia
   * quando nenhum saiu.
   */
  readonly lotes: readonly LoteDaRestauracao[];
}

const SEM_RESTAURACAO = {
  estadosGuardados: [],
  lotes: [],
} as const;

/**
 * `wp_untrash_post_comments()` — a restauracao em lote, **sem portao de
 * capacidade** (`wp-includes/post.php:4329`).
 *
 * Os oito passos estao na tabela do cabecalho deste arquivo.
 */
export function restaurarComentariosDoConteudo(
  contexto: ContextoDaCascataDeComentarios,
  conteudoId: number,
): ResultadoDaRestauracao {
  // Passo 1 (`:4332`): sem linha, silencio (P7).
  const conteudo = contexto.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_RESTAURACAO };
  }

  // `$post_id = $post->ID` (`:4338`).
  const id = conteudo.id;
  const marcadores = contexto.armazenamento.marcadoresDoConteudo;

  // Passo 2 (`:4340`): `get_post_meta( $post_id, ..., true )`.
  const estadosGuardados = marcadores.estadosDosComentarios(id);

  // Passo 3 (`:4342`): `! $statuses`. Marcador ausente (`null`) e arranjo vazio
  // caem no mesmo ramo, e nenhum comando sai — nem o ponto de acao do passo 4.
  if (estadosGuardados === null || estadosGuardados.length === 0) {
    return { desfecho: 'sem-memoria', ...SEM_RESTAURACAO };
  }

  // Passo 4 (`:4353`): depois da guarda, ao contrario do gemeo do descarte.
  contexto.ganchos?.antesDeRestaurar?.(id);

  // Passo 5 (`:4356`-`:4359`): `$group_by_status[ $comment_status ][] =
  // $comment_id`. `Map` e nao objeto porque a ordem de insercao e o que decide a
  // ordem dos comandos, e porque chave de objeto em JavaScript com nome numerico
  // seria reordenada — justamente o que a normalizacao de chave do PHP NAO faz
  // com a ordem de `$group_by_status`.
  const grupos = new Map<string, number[]>();
  for (const guardado of estadosGuardados) {
    const lote = grupos.get(guardado.estado);
    if (lote === undefined) {
      grupos.set(guardado.estado, [guardado.comentarioId]);
    } else {
      lote.push(guardado.comentarioId);
    }
  }

  // Passo 6 (`:4361`-`:4368`): um `UPDATE` por grupo, na ordem dos grupos.
  const lotes: LoteDaRestauracao[] = [];
  for (const [estadoGuardado, comentarioIds] of grupos) {
    // `if ( 'post-trashed' === $status ) { $status = '0'; }` (`:4363`): a troca
    // e do VALOR ESCRITO, nao da chave do grupo — item 3 do cabecalho.
    const estadoGravado =
      estadoGuardado === ESTADO_DE_SUSPENSAO_EM_CASCATA
        ? ESTADO_DA_FILA_DE_MODERACAO
        : estadoGuardado;

    const linhasAfetadas =
      contexto.armazenamento.comentariosDoConteudo.gravarEstadoDeLote(
        comentarioIds,
        estadoGravado,
      );

    lotes.push({
      estadoGuardado,
      estadoGravado,
      comentarioIds,
      linhasAfetadas,
    });
  }

  // Passo 7 (`:4370`): `clean_comment_cache( array_keys( $statuses ) )` — no-op
  // nesta arvore, como na suspensao. Ver `suspender-comentarios.ts`.

  // Passo 7 (`:4372`): o marcador agrupado, apagado DEPOIS de usado. Sao dois
  // comandos no legado — um `SELECT meta_id` e um `DELETE` —, ou nenhum quando o
  // `SELECT` nao devolve linha (`wp-includes/meta.php:468`).
  marcadores.apagarEstadosDosComentarios(id);

  // Passo 8 (`:4381`): a ultima acao, com a memoria ja apagada.
  contexto.ganchos?.depoisDeRestaurar?.(id);

  return { desfecho: 'restaurados', estadosGuardados, lotes };
}
