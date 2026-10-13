/**
 * **US-2**, primeira metade: suspender os comentarios do conteudo descartado,
 * guardando o estado de cada um.
 *
 * Entrega de **T005** da feature `005-retencao-e-descarte` — CA-2.1 (*"descartar
 * o conteudo move os seus comentarios para um estado proprio de suspensao em
 * cascata"*) e CA-2.2 (*"o estado anterior de cada comentario e guardado,
 * agrupado, junto do conteudo"*). E `wp_trash_post_comments()`
 * (`wp-includes/post.php:4268`), o passo 5 de UC-09.
 *
 * ---
 *
 * # A sequencia, que e o que esta tarefa entrega
 *
 * Os oito passos, na ordem, com o que cada um emite:
 *
 * | # | passo | linha | emite |
 * |---|---|---|---|
 * | 1 | le o conteudo; sem linha, `null` silencioso | `:4271`-`:4275` | uma leitura |
 * | 2 | a acao `trash_post_comments` | `:4286` | **nada** |
 * | 3 | le identificador e estado de todo comentario do conteudo | `:4288` | um `SELECT` |
 * | 4 | sem comentario, `null` e **para** | `:4290`-`:4292` | nada a mais |
 * | 5 | monta o mapa identificador → estado (CA-2.2) | `:4295`-`:4298` | — |
 * | 6 | grava o mapa no marcador agrupado do conteudo (CA-2.2) | `:4299` | um `INSERT` |
 * | 7 | leva **todos** os comentarios a `post-trashed` (CA-2.1) | `:4302` | **um** `UPDATE` |
 * | 8 | limpa o cache de comentario, e a acao `trashed_post_comments` | `:4304` e `:4314` | — |
 *
 * Quatro coisas nesta ordem nao sao arbitrarias, e um porte as troca sem
 * perceber:
 *
 * 1. **A acao do passo 2 vem antes do `SELECT`, logo antes da guarda do passo
 *    4.** Conteudo sem comentario nenhum **dispara** `trash_post_comments` e nao
 *    dispara `trashed_post_comments`. Mover a acao para depois da guarda — a
 *    leitura "limpa" — apagaria o unico sinal que a extensao recebe nesse caso.
 * 2. **O marcador e gravado ANTES do `UPDATE`.** Se fosse depois, o mapa
 *    guardado leria `post-trashed` para todo mundo e a memoria de CA-2.2 seria
 *    uma memoria de nada. Nao e detalhe de estilo: e a razao de a leitura do
 *    passo 3 existir separada da escrita do passo 7.
 * 3. **O `UPDATE` e um, por `comment_post_ID`, nao um por comentario.** CA-2.1
 *    chama isso de *"em cascata"*, e a contagem de comandos e o que a area 3 da
 *    Decisao 2 de `parity_specs.md` compara.
 * 4. **Nao ha transacao.** Entre o passo 6 e o passo 7 ha um instante em que o
 *    marcador existe e os comentarios ainda estao no estado antigo; e se o passo
 *    7 falhar, o marcador **fica**. BR-MIGRAR-104 mede zero `START TRANSACTION`
 *    em 1.467 arquivos, e o **P5** poe a cascata no contrato observavel.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao verifica capacidade.** Ver a secao da declaracao de permissao em
 *   `contexto-da-cascata.ts`: a funcao do legado nao tem portao, e quem o tem e
 *   `wp_trash_post()` (US-1, T003).
 * - **Nao pergunta se o conteudo esta na lixeira.** A cascata obedece: chamada
 *   sobre conteudo publicado, ela suspende os comentarios dele do mesmo jeito.
 *   E superficie publicada (P8) e e assim que `wp_delete_post()` a usa.
 * - **Nao recusa estado fora do vocabulario.** O que ela guarda e o que estava
 *   na coluna, inclusive `post-trashed` de uma cascata anterior — e e esse valor
 *   que a restauracao manda para a fila de moderacao (UT-048-6). Ver
 *   `estado-de-suspensao.ts`.
 * - **Nao apaga marcador antes de gravar.** Ao contrario do descarte de
 *   comentario, que apaga os seus dois antes de os acrescentar
 *   (`wp-includes/comment.php:1689`-`:1692`), aqui `add_post_meta()` e chamado
 *   seco. Conteudo descartado duas vezes sem restauracao no meio nao chega aqui,
 *   porque `wp_trash_post()` recusa o que ja esta em `trash` (`:4095`) — mas
 *   quem chamar esta funcao direto **duas vezes** grava **duas** linhas de
 *   marcador, e a segunda carrega `post-trashed` para todo mundo. A tabela de
 *   `armazenamento/marcadores-de-lixeira.ts` registra a diferenca entre as duas
 *   sequencias.
 * - **Nao recalcula `comment_count`.** Ver a tabela de
 *   `armazenamento/comentarios-do-conteudo.ts`: `DB-TRG1` poe o contador do
 *   conteudo na lixeira ainda contando os comentarios que acabaram de sair do ar.
 * - **Nao restaura.** `wp_untrash_post_comments()` e `restaurar-comentarios.ts`,
 *   nesta mesma tarefa.
 */

import { ESTADO_DE_SUSPENSAO_EM_CASCATA } from './estado-de-suspensao.js';
import type { EstadoGuardadoDeComentario } from '../armazenamento/index.js';
import type { ContextoDaCascataDeComentarios } from './contexto-da-cascata.js';

/** O que aconteceu. Tres desfechos, e **nenhum deles e excecao**. */
export type DesfechoDaSuspensao =
  /** Os comentarios estao em `post-trashed`, com o mapa gravado no conteudo. */
  | 'suspensos'
  /** `get_post()` nao achou a linha: `null` silencioso do legado (`:4274`). */
  | 'inexistente'
  /**
   * O conteudo nao tem comentario: `null`, **sem marcador e sem `UPDATE`**
   * (`:4291`). ⚠️ A acao `trash_post_comments` **ja disparou** — item 1 do
   * cabecalho.
   */
  | 'sem-comentarios';

/** O que a suspensao devolve. */
export interface ResultadoDaSuspensao {
  readonly desfecho: DesfechoDaSuspensao;
  /**
   * **CA-2.2**: o mapa identificador → estado como ele foi gravado, na ordem em
   * que o `SELECT` sem `ORDER BY` devolveu as linhas. Lista vazia quando nada
   * foi gravado.
   *
   * E o `$statuses` que o legado passa a `trashed_post_comments` (`:4314`), e
   * e por isso que ele sai no resultado: sem ele, quem chama nao tem como
   * afirmar o que foi guardado sem reler o marcador.
   */
  readonly estadosGuardados: readonly EstadoGuardadoDeComentario[];
  /**
   * **CA-2.1**: `post-trashed`, o estado gravado em todos, ou `null` quando
   * nenhum `UPDATE` saiu.
   */
  readonly estadoGravado: string | null;
  /**
   * As linhas que o `UPDATE` do passo 7 afetou, ou `null` quando ele nao saiu.
   *
   * No legado este numero **e** o retorno de `wp_trash_post_comments()`
   * (`:4316`), e o chamador o descarta (`:4142`). Ele viaja porque e o que a
   * area 3 da Decisao 2 compara — e porque `null` aqui e a afirmacao de que
   * nenhum comando saiu.
   */
  readonly linhasAfetadas: number | null;
}

const SEM_SUSPENSAO = {
  estadosGuardados: [],
  estadoGravado: null,
  linhasAfetadas: null,
} as const;

/**
 * `wp_trash_post_comments()` — a cascata, **sem portao de capacidade**
 * (`wp-includes/post.php:4268`).
 *
 * Os oito passos estao na tabela do cabecalho deste arquivo.
 */
export function suspenderComentariosDoConteudo(
  contexto: ContextoDaCascataDeComentarios,
  conteudoId: number,
): ResultadoDaSuspensao {
  // Passo 1 (`:4271`): sem linha, silencio (P7).
  const conteudo = contexto.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_SUSPENSAO };
  }

  // `$post_id = $post->ID` (`:4277`): dali para baixo o legado usa o
  // identificador do REGISTRO LIDO, nao o argumento. Para o inteiro os dois sao
  // o mesmo; para o objeto ou o nulo que `get_post()` tambem aceita, nao sao — e
  // e o do registro que vai aos comandos e aos pontos de extensao.
  const id = conteudo.id;

  // Passo 2 (`:4286`): antes do `SELECT`, logo antes da guarda do passo 4.
  contexto.ganchos?.antesDeSuspender?.(id);

  // Passo 3 (`:4288`).
  const comentarios = contexto.armazenamento.comentariosDoConteudo.doConteudo(id);

  // Passo 4 (`:4290`): `! $comments` — nada e gravado, e a acao do passo 2 ja
  // disparou.
  if (comentarios.length === 0) {
    return { desfecho: 'sem-comentarios', ...SEM_SUSPENSAO };
  }

  // Passo 5 (`:4295`-`:4298`): `$statuses[ $comment->comment_ID ] =
  // $comment->comment_approved`. A ordem e a do `SELECT`, e a chave passa pela
  // normalizacao de chave do PHP — o identificador vira chave INTEIRA, e e por
  // isso que os bytes do marcador saem `a:1:{i:5;s:1:"1";}`. Quem aplica a
  // normalizacao e `acrescentarEstadosDosComentarios` (T002).
  const estadosGuardados = comentarios;

  // Passo 6 (`:4299`): CA-2.2, e **antes** do `UPDATE` — item 2 do cabecalho.
  contexto.armazenamento.marcadoresDoConteudo.acrescentarEstadosDosComentarios(
    id,
    estadosGuardados,
  );

  // Passo 7 (`:4302`): CA-2.1, um comando para todos.
  const linhasAfetadas =
    contexto.armazenamento.comentariosDoConteudo.gravarEstadoDeTodos(
      id,
      ESTADO_DE_SUSPENSAO_EM_CASCATA,
    );

  // Passo 8 (`:4304`): `clean_comment_cache( array_keys( $statuses ) )`. Sem
  // cache de objeto nesta arvore, invalidar cache e no-op — REQ-165 ficou fora
  // do pacote e a borda 5 de `target_architecture.md` manda o cache desligado
  // nas duas metades durante a coexistencia. A posicao fica registrada aqui, no
  // lugar exato, para quem for construi-lo.

  // Passo 8 (`:4314`): a ultima acao, com o mapa que foi gravado.
  contexto.ganchos?.depoisDeSuspender?.(id, estadosGuardados);

  return {
    desfecho: 'suspensos',
    estadosGuardados,
    estadoGravado: ESTADO_DE_SUSPENSAO_EM_CASCATA,
    linhasAfetadas,
  };
}
