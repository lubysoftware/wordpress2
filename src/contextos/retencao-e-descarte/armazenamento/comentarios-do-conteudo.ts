/**
 * Os comentarios de um conteudo, como a **cascata** os le e os escreve: tres
 * comandos crus sobre `{site}comments`, e nada mais.
 *
 * Entrega de **T005** (US-2). Fica em `armazenamento/` porque e a forma da
 * tabela, nao a regra: quem decide **quando** cada comando sai, em que ordem e
 * com que valor e `cascata-de-comentarios/`.
 *
 * ── POR QUE ESTE REPOSITORIO NAO E A API DE COMENTARIO ──────────────────────
 *
 * `wp_trash_post_comments()` e `wp_untrash_post_comments()` nao chamam
 * `wp_set_comment_status()` nem `wp_update_comment()`: as duas escrevem na
 * coluna com `$wpdb` direto (`wp-includes/post.php:4302` e `:4367`). **A
 * diferenca e observavel e e grande**, porque o caminho que elas nao tomam
 * dispara, por comentario:
 *
 * | o que `wp_set_comment_status()` faz e a cascata NAO faz | linha |
 * |---|---|
 * | o ponto de acao `wp_set_comment_status` | `wp-includes/comment.php:2842` |
 * | a transicao `wp_transition_comment_status`, com os pontos por par de estados | `:2844` |
 * | o recalculo de `comment_count` do conteudo, `wp_update_comment_count()` | `:2846` |
 * | o aviso ao autor do conteudo, que `approve` acrescenta | `:2806` |
 *
 * Um porte que implementasse a cascata *"pela API de comentario"* — que e a
 * forma obviamente mais limpa — emitiria **N** comandos em lugar de **um**,
 * dispararia pontos de extensao que hoje nao disparam e recalcularia um contador
 * que hoje fica parado. E o contador parado e comportamento declarado: `DB-TRG1`
 * poe o `comment_count` do conteudo na lixeira ainda contando os comentarios que
 * acabaram de sair do ar.
 *
 * ── UM COMANDO PARA TODOS, E E ISSO QUE ESTA EM JOGO ────────────────────────
 *
 * A suspensao e **um** `UPDATE` por conteudo (`:4302`), e a restauracao e **um
 * `UPDATE` por estado distinto** guardado (`:4366`) — nao um por comentario. E
 * a diferenca que CA-2.1 (*"em cascata"*) e CA-2.3 (*"em lote por estado"*)
 * nomeiam, e a area 3 da Decisao 2 de `parity_specs.md` compara *"snapshot +
 * sequencia de comandos"*: o numero de comandos e parte do resultado.
 *
 * ── O QUE NAO ESTA AQUI ─────────────────────────────────────────────────────
 *
 * - **A limpeza de cache de comentario.** `clean_comment_cache( array_keys(
 *   $statuses ) )` roda nas duas funcoes (`:4304` e `:4370`) e nesta arvore nao
 *   tem para onde ir: REQ-165 ficou fora do pacote e a borda 5 de
 *   `target_architecture.md` manda o cache **desligado nas duas metades** durante
 *   a coexistencia. Sem cache, invalidar cache e no-op — e a posicao da chamada
 *   fica registrada em `suspender-comentarios.ts` para quando o cache existir.
 * - **O vocabulario de estado.** Esta tabela nao recusa valor nenhum: a coluna e
 *   `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`), e quem limita o
 *   vocabulario e o codigo. Ver `cascata-de-comentarios/estado-de-suspensao.ts`.
 * - **A contagem de comentario.** Ver a tabela acima: nenhuma das duas funcoes a
 *   toca.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  COLUNA_DO_COMENTARIO,
  COLUNA_DO_CONTEUDO_COMENTADO,
  COLUNA_DO_ESTADO_DO_COMENTARIO,
  tabelaDeComentarios,
} from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto } from './leitura-de-linha.js';
import type { EstadoGuardadoDeComentario } from './marcadores-de-lixeira.js';

/** Os tres comandos da cascata sobre `{site}comments`. */
export interface ComentariosDoConteudo {
  /** `{site}comments`, com o prefixo do site. */
  readonly tabela: string;

  /**
   * `SELECT comment_ID, comment_approved FROM $wpdb->comments WHERE
   * comment_post_ID = %d` (`wp-includes/post.php:4288`).
   *
   * ⚠️ **Sem `ORDER BY`, e a ordem viaja.** A ordem em que o banco devolve as
   * linhas e a ordem das entradas do marcador agrupado (CA-2.2) e, por
   * consequencia, a ordem dos lotes da restauracao (CA-2.3). Acrescentar um
   * `ORDER BY` *"para estabilizar"* mudaria os bytes gravados — que e o criterio
   * da area 3 da Decisao 2 e o que o cenario
   * `15-fronteira-do-banco-e-codec-serialize` cobra: *"nenhuma das duas
   * normaliza, reordena nem reindexa a estrutura"*.
   *
   * Lista vazia e **conteudo sem comentario**, e no legado e o `! $comments` que
   * encerra a cascata sem gravar marcador e sem emitir `UPDATE` (`:4290`).
   */
  doConteudo(conteudoId: number): readonly EstadoGuardadoDeComentario[];

  /**
   * `$wpdb->update( $wpdb->comments, array( 'comment_approved' => ... ), array(
   * 'comment_post_ID' => $post_id ) )` (`wp-includes/post.php:4302`) — **um**
   * comando para todos os comentarios do conteudo.
   *
   * Devolve as linhas afetadas. ⚠️ No legado este retorno e `int|false`, e e
   * ele que `wp_trash_post_comments()` devolve; a porta de dados deste modulo
   * nao tem canal de falha de driver, logo o `false` nao tem representante aqui.
   * **Nenhum ramo do legado depende do valor**: a linha que chama a cascata
   * descarta o retorno (`:4142`).
   */
  gravarEstadoDeTodos(conteudoId: number, estado: string): number;

  /**
   * `$wpdb->query( $wpdb->prepare( "UPDATE $wpdb->comments SET comment_approved
   * = %s WHERE comment_ID IN ($comments_in)", $status ) )`
   * (`wp-includes/post.php:4366`-`:4367`) — **um** comando por lote.
   *
   * O legado monta a lista do `IN` por concatenacao, com
   * `implode( ', ', array_map( 'intval', $comments ) )` (`:4366`); REQ-164 proibe
   * a concatenacao e com marcador de parametro a cadeia enviada e a mesma, como
   * em `metadado.ts`. O `intval` continua aplicado, porque e ele que decide o
   * que acontece com identificador que nao e numero.
   *
   * Lote vazio **nao emite comando**: no legado um grupo vazio nao existe, ja
   * que o grupo nasce de um `$statuses[ $comment_id ]` que existe.
   */
  gravarEstadoDeLote(
    comentarioIds: readonly number[],
    estado: string,
  ): number;
}

export function criarComentariosDoConteudo(
  dados: PortaDeDados,
): ComentariosDoConteudo {
  const tabela = tabelaDeComentarios(dados);

  return {
    tabela,

    doConteudo(conteudoId) {
      return dados
        .selecionar({
          texto:
            `SELECT ${COLUNA_DO_COMENTARIO}, ${COLUNA_DO_ESTADO_DO_COMENTARIO} ` +
            `FROM ${tabela} WHERE ${COLUNA_DO_CONTEUDO_COMENTADO} = ?`,
          parametros: [Math.trunc(conteudoId)],
        })
        .map((bruta) => ({
          comentarioId: comoInteiro(bruta[COLUNA_DO_COMENTARIO]),
          estado: comoTexto(bruta[COLUNA_DO_ESTADO_DO_COMENTARIO]),
        }));
    },

    gravarEstadoDeTodos(conteudoId, estado) {
      return dados.escrever({
        texto:
          `UPDATE ${tabela} SET ${COLUNA_DO_ESTADO_DO_COMENTARIO} = ? ` +
          `WHERE ${COLUNA_DO_CONTEUDO_COMENTADO} = ?`,
        parametros: [estado, Math.trunc(conteudoId)],
      }).linhasAfetadas;
    },

    gravarEstadoDeLote(comentarioIds, estado) {
      if (comentarioIds.length === 0) {
        return 0;
      }
      // `array_map( 'intval', $comments )` (`wp-includes/post.php:4366`): a
      // coercao continua, so a concatenacao sai.
      const ids = comentarioIds.map((id) => Math.trunc(id));
      return dados.escrever({
        texto:
          `UPDATE ${tabela} SET ${COLUNA_DO_ESTADO_DO_COMENTARIO} = ? ` +
          `WHERE ${COLUNA_DO_COMENTARIO} IN (${ids.map(() => '?').join(', ')})`,
        parametros: [estado, ...ids],
      }).linhasAfetadas;
    },
  };
}
