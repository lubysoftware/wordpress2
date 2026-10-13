/**
 * O contexto da cascata de comentarios: o que as duas operacoes recebem por
 * argumento, e de quem cada peca e.
 *
 * Entrega de **T005** da feature `005-retencao-e-descarte` (US-2). O contexto
 * chega **por argumento** pelas mesmas duas razoes de `contexto-de-descarte.ts`:
 * identidade e estado de rede sao escopo de REQUISICAO (`EXT-CONTEXTO`,
 * BR-MIGRAR-105) e a colaboracao com BC-01 e de **ligacao tardia** (AD-10, regra
 * de dependencia 3 de `target_architecture.md`).
 *
 * ── A CASCATA NAO PERGUNTA CAPACIDADE, E ISSO E DECLARACAO ──────────────────
 *
 * **Nao ha `base` nem `ator` neste contexto**, e a ausencia e a declaracao de
 * permissao que o **P4** cobra: `wp_trash_post_comments()` e
 * `wp_untrash_post_comments()` nao verificam capacidade nenhuma, nem leem o
 * usuario corrente. Quem verifica e o chamador —
 * `delete_post` daquele conteudo, em `wp_trash_post()` (US-1) e em
 * `wp_untrash_post()` (US-3) — e as duas funcoes sao **publicas** e chamaveis
 * direto por extensao (P8).
 *
 * E a mesma assimetria que T003 escreveu entre `descartar` e
 * `descartarParaALixeira`: a operacao com ator declara a capacidade, a funcao do
 * legado declara que nao tem nenhuma. Pendurar um portao aqui fecharia o sistema
 * mais do que o legado, e e justamente o que o P4 chama de *"preservar o default
 * de cada camada, inclusive quando o default e permissivo"*.
 *
 * ── O QUE CHEGA DE FORA ─────────────────────────────────────────────────────
 *
 * | peca | de quem e | por que nao esta implementada aqui |
 * |---|---|---|
 * | {@link LeituraDeConteudoNaCascata} | **BC-01** | e o `get_post()` da primeira linha das duas funcoes; a regra de dependencia 3 proibe o `import` |
 * | {@link ArmazenamentoNaCascata} | **T002** deste modulo | o marcador agrupado, cuja forma e daquela tarefa |
 * | {@link ArmazenamentoNaCascata.comentariosDoConteudo} | **T005**, em `armazenamento/` | os tres comandos crus sobre `{site}comments` |
 * | {@link GanchosDaCascata} | o barramento, que **nao existe nesta arvore** | REQ-162 esta em `do-not-rewrite.md`; o que se preserva aqui e a **posicao** |
 */

import type {
  ComentariosDoConteudo,
  EstadoGuardadoDeComentario,
  MarcadoresDeLixeiraDoConteudo,
} from '../armazenamento/index.js';
import type { RegistroNoDescarte } from '../descarte/index.js';

/**
 * `get_post( $post )` — a primeira linha das duas funcoes
 * (`wp-includes/post.php:4271` e `:4332`), e `null` quando a linha nao existe.
 *
 * ⚠️ **As duas usam do registro exatamente `$post->ID`** (`:4277` e `:4338`):
 * nem o estado, nem o tipo, nem o pai. O tipo e o mesmo
 * {@link RegistroNoDescarte} de T003 **porque e o mesmo `get_post()` do mesmo
 * fluxo** — a composicao liga a mesma porta de BC-01 nos dois lugares, e
 * declarar aqui um registro de um campo so daria duas formas para uma leitura.
 *
 * `null` e **retorno silencioso**: as duas devolvem `null` sem erro e sem
 * mensagem (`:4274` e `:4335`), e o **P7** manda preservar o silencio. Note que
 * nenhuma das duas pergunta se o conteudo esta na lixeira — a cascata obedece
 * quem a chamou.
 */
export interface LeituraDeConteudoNaCascata {
  obterPorId(conteudoId: number): RegistroNoDescarte | null;
}

/** O que a cascata le e grava do armazenamento. */
export interface ArmazenamentoNaCascata {
  /**
   * Os marcadores em `{site}postmeta`. A cascata usa **so o terceiro** —
   * `_wp_trash_meta_comments_status` (CA-2.2) —, e nunca os dois do registro: os
   * de `_wp_trash_meta_status` e `_wp_trash_meta_time` do conteudo sao gravados
   * por `wp_trash_post()` (T003) e apagados por `wp_untrash_post()` (T007), nao
   * aqui.
   *
   * O tipo e o completo porque e o que `criarArmazenamentoDeRetencao()` devolve.
   */
  readonly marcadoresDoConteudo: MarcadoresDeLixeiraDoConteudo;

  /**
   * Os tres comandos sobre `{site}comments` — a tabela em que a cascata escreve
   * **direto**, sem passar pela API de comentario. A tabela da
   * `armazenamento/comentarios-do-conteudo.ts` explica o que essa escolha do
   * legado deixa de disparar.
   */
  readonly comentariosDoConteudo: ComentariosDoConteudo;
}

/**
 * Os **quatro** pontos de extensao das duas funcoes, com o nome, os argumentos e
 * a ordem de disparo que eles tem hoje — o que o **P2** chama de contrato
 * publico.
 *
 * ⚠️ **Os quatro sao acao, nenhum e filtro**: nada nesta cascata pode ser
 * cancelado nem ter o resultado alterado por interceptador. E a diferenca em
 * relacao ao descarte do conteudo, que tem `pre_trash_post` — e e por isso que
 * uma extensao consegue impedir o descarte e **nao** consegue impedir que os
 * comentarios o acompanhem.
 *
 * O barramento que os dispara (`plataforma/barramento/`) nao existe nesta
 * arvore: REQ-162 esta em `do-not-rewrite.md`. Ponto sem interceptador e, no
 * legado, um no-op — logo os quatro sao opcionais aqui, e o que
 * `suspender-comentarios.ts` e `restaurar-comentarios.ts` preservam e a
 * **posicao** de cada um.
 */
export interface GanchosDaCascata {
  /**
   * `trash_post_comments` — **acao**, um argumento
   * (`wp-includes/post.php:4286`).
   *
   * ⚠️ **Dispara ANTES do `SELECT`**, logo ele dispara tambem para o conteudo
   * que nao tem comentario nenhum — caso em que a funcao devolve `null` sem
   * gravar marcador e sem emitir `UPDATE` (`:4290`-`:4292`). Um porte que o
   * movesse para depois da guarda apagaria o unico sinal que a extensao recebe
   * nesse caso.
   */
  readonly antesDeSuspender?: (conteudoId: number) => void;

  /**
   * `trashed_post_comments` — **acao**, dois argumentos: o conteudo e o mapa de
   * estados **como ele foi gravado** (`wp-includes/post.php:4314`).
   *
   * O segundo argumento e o `$statuses` do passo anterior, e nao uma releitura
   * do marcador: a extensao ve o par identificador/estado na mesma ordem em que
   * o `SELECT` sem `ORDER BY` devolveu.
   */
  readonly depoisDeSuspender?: (
    conteudoId: number,
    estados: readonly EstadoGuardadoDeComentario[],
  ) => void;

  /**
   * `untrash_post_comments` — **acao**, um argumento
   * (`wp-includes/post.php:4353`).
   *
   * ⚠️ **Dispara DEPOIS da guarda**, ao contrario do gemeo do descarte: sem
   * marcador agrupado a funcao devolve antes (`:4342`-`:4344`) e este ponto
   * **nao** dispara. A assimetria entre os dois pares esta no legado e e
   * observavel por quem escuta os quatro.
   */
  readonly antesDeRestaurar?: (conteudoId: number) => void;

  /**
   * `untrashed_post_comments` — **acao**, um argumento
   * (`wp-includes/post.php:4381`).
   *
   * Dispara depois de os lotes serem gravados **e depois** de o marcador
   * agrupado ser apagado (`:4372`): quem o escuta nao encontra mais a memoria.
   */
  readonly depoisDeRestaurar?: (conteudoId: number) => void;
}

/** O contexto de uma operacao da cascata de comentarios. */
export interface ContextoDaCascataDeComentarios {
  /** A ligacao tardia com BC-01: a leitura da primeira linha. */
  readonly conteudo: LeituraDeConteudoNaCascata;
  readonly armazenamento: ArmazenamentoNaCascata;
  readonly ganchos?: GanchosDaCascata;
}
