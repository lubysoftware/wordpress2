/**
 * O contexto de uma restauracao: o que ela recebe por argumento, e de quem cada
 * peca e.
 *
 * Entrega de **T007** da feature `005-retencao-e-descarte` (US-3). Chega por
 * argumento pelos mesmos dois motivos de `contexto-de-descarte.ts`: identidade e
 * matriz sao escopo de REQUISICAO (`EXT-CONTEXTO`, BR-MIGRAR-105), e a colaboracao
 * com BC-01 e de **ligacao tardia** (AD-10, regra de dependencia 3).
 *
 * **Nao estende `ContextoDeDescarte`, ao contrario da exclusao.** T017 estendeu
 * porque `wp_trash_post()` e `wp_delete_post()` chamam uma a outra.
 * `wp_untrash_post()` nao chama nenhuma das duas e nao olha o prazo nem o relogio
 * (`wp-includes/post.php:4168`): restaurar nao pergunta se a lixeira esta ligada,
 * logo **a ausencia de `prazoDeRetencao` e `relogio` aqui e afirmacao**, como a de
 * `base` e `ator` no contexto da cascata.
 *
 * | peca | de quem e | por que nao esta implementada aqui |
 * |---|---|---|
 * | {@link ConteudoNaRestauracao} | **BC-01** | `get_post()` e `wp_update_post()`; a regra de dependencia 3 proibe o `import` |
 * | {@link ContextoDeRestauracao.restaurarComentarios} | **T005** (US-2) deste modulo | `wp_untrash_post_comments()`, ligada por `cascataNaRestauracao()` |
 * | {@link ContextoDeRestauracao.base} e `ator` | `plataforma/autorizacao/` | a decisao de capacidade e politica, nao entidade |
 *
 * `restaurarComentarios` e **obrigatoria**, como `suspenderComentarios` no
 * descarte: opcional, o passo 5 de UC-10 seria silenciosamente saltado.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { MarcadoresDeLixeiraDoConteudo } from '../armazenamento/index.js';

/**
 * O conteudo como a restauracao o le — **tres colunas**.
 *
 * Uma a mais que `RegistroNoDescarte`, e a diferenca e o legado:
 * `wp_trash_post()` nao le `post_type`, e `wp_untrash_post()` le, porque e ele
 * que decide `inherit` (`wp-includes/post.php:4209`).
 */
export interface RegistroNaRestauracao {
  /** `$post->ID`. */
  readonly id: number;
  /** `$post->post_status`, que a guarda de `:4177` compara com `trash`. */
  readonly estado: string;
  /** `$post->post_type`. */
  readonly tipo: string;
}

/** A colaboracao com **BC-01**: ler o conteudo e gravar o estado novo. */
export interface ConteudoNaRestauracao {
  /**
   * `get_post( $post_id )` (`wp-includes/post.php:4169`), ou `null` quando a
   * linha nao existe: retorno silencioso (`:4171`-`:4173`).
   */
  obterPorId(conteudoId: number): RegistroNaRestauracao | null;

  /**
   * `wp_update_post( array( 'ID' => $post_id, 'post_status' => $post_status ) )`
   * (`wp-includes/post.php:4231`-`:4236`). Devolve o identificador gravado, ou
   * **`0`** na falha, como `ConteudoNoDescarte.gravarEstado`.
   *
   * ⚠️ **Nao e um `UPDATE` de uma coluna**, pelos mesmos motivos do descarte:
   * `post_modified` e reescrito, os pontos de extensao da gravacao disparam e o
   * anexo desvia para `wp_insert_attachment()` (`:5375`). E tres coisas moram so
   * dentro deste caminho:
   *
   * - **`post_status` vazio vira `draft`** (`:4703`) — o caso do interceptador
   *   que devolve o estado anterior de um conteudo sem marcador;
   * - **o identificador de URL volta**: `'trash' === $previous_status` le
   *   `_wp_desired_post_slug`, apaga o metadado e devolve o `post_name` sem o
   *   sufixo `__trashed` (`:4874`-`:4881`);
   * - **quem hoje usa o identificador perde-o**, se estiver na lixeira
   *   (`:4883`-`:4899`).
   *
   * 🔴 Os dois ultimos itens **ainda nao existem no alvo**: `conteudo/gravacao/
   * gravar.ts` os deixa para a feature 005 (passo 17) e nenhuma tarefa de
   * `tasks.md` os recebe. Ver o `README.md` deste modulo.
   */
  gravarEstado(conteudoId: number, estado: string): number;
}

/**
 * `wp_untrash_post_comments( $post_id )` — o passo 5 de UC-10
 * (`wp-includes/post.php:4242`).
 *
 * Nao devolve nada porque o legado ignora o retorno: nenhum ramo da restauracao
 * depende do que aconteceu com os comentarios.
 */
export type RestauracaoDeComentariosNaRestauracao = (
  conteudoId: number,
) => void;

/**
 * Os **quatro** pontos de extensao de `wp_untrash_post()`, com o nome, os
 * argumentos e a ordem de disparo que eles tem hoje (P2). Dois filtros e duas
 * acoes — um filtro a mais que o descarte, e e ele que torna `R2` um default e
 * nao uma garantia.
 */
export interface GanchosDaRestauracao {
  /**
   * `pre_untrash_post` — **filtro**, tres argumentos (`wp-includes/post.php:4193`).
   *
   * Qualquer valor diferente de `null` curto-circuita a restauracao, e e ele que
   * `wp_untrash_post()` devolve (`:4194`-`:4196`). Nada foi escrito ainda.
   */
  readonly filtrarRestauracao?: (
    restauracao: null,
    conteudo: RegistroNaRestauracao,
    estadoAnterior: string,
  ) => boolean | null;

  /**
   * `untrash_post` — **acao**, dois argumentos (`:4207`). Dispara antes de
   * qualquer escrita: quem a escuta ainda ve os marcadores.
   */
  readonly antesDeRestaurar?: (
    conteudoId: number,
    estadoAnterior: string,
  ) => void;

  /**
   * `wp_untrash_post_status` — **filtro**, tres argumentos (`:4226`). O valor
   * devolvido **e** o estado gravado. `estadoAnteriorNaRestauracao` e o
   * interceptador pronto, e a acao "Desfazer" do painel o usa.
   *
   * ⚠️ Dispara **antes** de os marcadores serem apagados, e e a ultima posicao em
   * que eles existem para quem o escuta.
   */
  readonly filtrarEstadoRestaurado?: (
    novoEstado: string,
    conteudoId: number,
    estadoAnterior: string,
  ) => string;

  /**
   * `untrashed_post` — **acao**, dois argumentos (`:4253`). Dispara depois da
   * cascata de comentarios: quem a escuta ve o conteudo gravado, sem os
   * marcadores e com os comentarios ja devolvidos.
   */
  readonly depoisDeRestaurar?: (
    conteudoId: number,
    estadoAnterior: string,
  ) => void;
}

/** O que a restauracao le e apaga do armazenamento de T002. */
export interface ArmazenamentoNaRestauracao {
  /**
   * Os marcadores em `{site}postmeta`: le um e apaga dois. O terceiro,
   * `_wp_trash_meta_comments_status`, e da cascata (`:4372`).
   */
  readonly marcadoresDoConteudo: MarcadoresDeLixeiraDoConteudo;
}

/** O contexto de uma operacao de restauracao. */
export interface ContextoDeRestauracao {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /** Quem pede a restauracao. */
  readonly ator: AtorDeAutorizacao;

  readonly armazenamento: ArmazenamentoNaRestauracao;

  /** A ligacao tardia com BC-01: ler o conteudo e gravar o estado. */
  readonly conteudo: ConteudoNaRestauracao;

  /** O passo 5 de UC-10. Ver {@link RestauracaoDeComentariosNaRestauracao}. */
  readonly restaurarComentarios: RestauracaoDeComentariosNaRestauracao;

  readonly ganchos?: GanchosDaRestauracao;
}
