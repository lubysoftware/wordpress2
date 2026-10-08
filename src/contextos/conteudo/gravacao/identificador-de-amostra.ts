/**
 * **CA-3.3**: o autor e informado quando o identificador muda na publicacao, em
 * lugar de descobrir pelo endereco quebrado.
 *
 * Entrega de **T007** da feature `002-autoria-e-publicacao` (US-3).
 *
 * ---
 *
 * # 🔴 O legado nao NOTIFICA ninguem, e esta tarefa nao inventou notificacao
 *
 * Nao ha e-mail, nao ha aviso de painel e nao ha registro quando o identificador
 * muda: `grep` por aviso de mudanca de `post_name` na arvore nao devolve nada, e
 * `wp_insert_post()` troca o campo em silencio. O **P1** e literal — *"divergir
 * exige uma decisao humana registrada, citada no codigo que divergiu"* — e
 * nenhuma existe para este criterio. Inventar aqui um aviso seria inventar
 * superficie, que e o que `../publicacao/permissao-de-publicacao.ts` recusou
 * fazer com a *"recusa explicita na tela"* de CA-1.1, e o que T019 vai encontrar
 * em US-9.
 *
 * **Os dois mecanismos pelos quais o legado informa sao estes, e os dois sao
 * resposta a quem pediu a gravacao:**
 *
 * | quando | o que o legado devolve | onde |
 * |---|---|---|
 * | **depois** de gravar | o identificador como ele ficou, no registro relido pela superficie — o campo `slug` da resposta REST e o `link`, e o endereco que o painel volta a renderizar | `class-wp-rest-posts-controller.php`, passo 7 de UC-03 (*"devolve o conteudo publicado com o endereco definitivo"*) |
 * | **antes** de gravar | o endereco de amostra, que o editor mostra enquanto o conteudo ainda e rascunho — e que ja e o endereco **da publicacao** | `wp-admin/includes/post.php:1479`, {@link identificadorDeAmostra} |
 *
 * O primeiro e `gravar.ts`, que devolve o identificador pedido e o gravado lado
 * a lado ({@link identificadorMudouNaGravacao}). O segundo e este arquivo, e e o
 * mecanismo mais direto do criterio: *"em lugar de descobrir pelo endereco
 * quebrado"* e exatamente o que `get_sample_permalink()` existe para evitar.
 *
 * ---
 *
 * # O truque de `get_sample_permalink()`, que e a metade portada aqui
 *
 * ```php
 * // Hack: get_permalink() would return plain permalink for drafts, so we will
 * // fake that our post is published.
 * if ( in_array( $post->post_status, array( 'auto-draft', 'draft', 'pending', 'future' ), true ) ) {
 *     $post->post_status = 'publish';
 *     $post->post_name   = sanitize_title( $post->post_name ? $post->post_name : $post->post_title, $post->ID );
 * }
 * ```
 * — `wp-admin/includes/post.php:1493`-`:1497`
 *
 * O comentario e do legado, e a palavra *"hack"* tambem. O que ele faz, e que e
 * a razao de este arquivo responder CA-3.3: **finge que o conteudo esta
 * publicado** e passa o identificador pela **mesma**
 * `wp_unique_post_slug()` (`:1507`) — logo o endereco que o editor mostra num
 * rascunho **ja e** o endereco que a publicacao vai produzir, com o sufixo
 * numerico e tudo. O autor ve `titulo-2` antes de publicar, nao depois.
 *
 * ⚠️ **A lista de estados fingidos tem QUATRO valores, e nao os tres da
 * dispensa:** `auto-draft`, `draft`, `pending` e **`future`**. O agendado nao
 * dispensa unicidade (ele passa por `wp_unique_post_slug()` como publicado), mas
 * tambem nao tem endereco servido pelo site — e por isso entra no truque. Usar
 * aqui a lista de `identificador-na-url.ts` daria o endereco errado para todo
 * conteudo agendado, e e por isso que esta e constante propria.
 *
 * ---
 *
 * # O que deste arquivo NAO foi portado, e de quem e
 *
 * `get_sample_permalink()` devolve **duas** coisas: o molde do endereco, com o
 * lugar do identificador marcado, e o identificador. Aqui esta so a segunda.
 *
 * | ausencia | ancora | de quem e |
 * |---|---|---|
 * | `get_permalink( $post, true )`, o molde | `:1511` | BC-07 / BC-08 — e e o mesmo `EnderecoDoConteudo` que T003 declarou |
 * | a troca de `%{tipo}%` por `%pagename%` | `:1514` | idem |
 * | `get_page_uri()` e a hierarquia da pagina no molde | `:1518`-`:1530` | idem |
 * | o ponto `sample_permalink`, que filtra o **par** | `:1540` | idem: sem o molde, o par nao existe para ser filtrado |
 *
 * O ponto `editable_slug` **esta** aqui, porque ele filtra o identificador e nao
 * o molde (`:1534`) — e e o ultimo valor que o autor ve.
 */

import { colunaDoVinculo, type Conteudo } from '../armazenamento/index.js';
import {
  identificadorUnico,
  type ContextoDoIdentificadorUnico,
} from './identificador-na-url.js';
import { verdadeiroComoNoPhp } from './verdade-de-php.js';

/**
 * Os **quatro** estados em que o endereco de amostra finge que o conteudo esta
 * publicado (`wp-admin/includes/post.php:1493`).
 *
 * A ordem e a do legado. Ver o aviso no cabecalho sobre por que `future` esta
 * aqui e nao na lista de dispensa de unicidade.
 */
export const ESTADOS_SEM_ENDERECO_SERVIDO: readonly string[] = Object.freeze([
  'auto-draft',
  'draft',
  'pending',
  'future',
]);

/**
 * `publish` — o estado que o truque finge (`:1495`).
 *
 * Declarado aqui, e nao importado de `../publicacao/transicao-de-estado.ts`,
 * porque ali ele e **o estado gravado por uma transicao** e aqui e um valor que
 * **nao** se grava: nada deste arquivo escreve coluna nenhuma.
 */
export const ESTADO_FINGIDO_NA_AMOSTRA = 'publish';

/** O ponto de extensao que filtra o identificador mostrado ao autor. */
export interface GanchosDoIdentificadorDeAmostra {
  /**
   * `editable_slug` — **filtro**, dois argumentos (`wp-admin/edit-tag-form.php`,
   * usado em `wp-admin/includes/post.php:1534`).
   *
   * E o ultimo ponto antes de o identificador chegar a tela, e por isso e o
   * ultimo valor que o autor ve. No legado o mesmo ponto filtra tambem o
   * fragmento de hierarquia do molde (`:1527`), que nao esta aqui — ver o
   * cabecalho.
   */
  readonly filtrarIdentificadorEditavel?: (
    identificadorNaUrl: string,
    conteudo: Conteudo,
  ) => string;
}

/** O que o autor quer ver, antes de gravar. */
export interface PedidoDeIdentificadorDeAmostra {
  /** O conteudo como esta gravado — `get_post( $post )` (`:1480`). */
  readonly conteudo: Conteudo;
  /**
   * `$title` — o titulo que o autor acabou de digitar, para sobrepor o gravado.
   *
   * No legado o default e `null` e ele e usado **so** como reserva do
   * identificador informado (`:1504`): titulo sem identificador nao muda nada.
   */
  readonly titulo?: string;
  /**
   * `$name` — o identificador que o autor acabou de digitar.
   *
   * ⚠️ **A pergunta do legado e `! is_null( $name )`** (`:1503`), logo informar
   * cadeia **vazia** nao e o mesmo que nao informar: o vazio cai na reserva, que
   * e o titulo — *"if empty name is supplied -- use the title instead, see
   * #6072"*, diz o comentario. Aqui `undefined` e a ausencia e `''` e o vazio
   * informado, como em `PedidoDeGravacao`.
   */
  readonly identificadorNaUrl?: string;
}

/**
 * **CA-3.3**: o identificador que a publicacao vai produzir, mostrado antes de
 * publicar — a metade de `get_sample_permalink()` que e identificador
 * (`wp-admin/includes/post.php:1479`).
 *
 * Os passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | finge `publish` e deriva do titulo nos quatro estados sem endereco | `:1493`-`:1497` |
 * | 2 | sobrepoe o identificador informado, com o titulo como reserva | `:1503`-`:1505` |
 * | 3 | passa pela **mesma** `wp_unique_post_slug()` | `:1507` |
 * | 4 | o ponto `editable_slug` | `:1534` |
 *
 * ⚠️ **Nada aqui grava, e o legado tambem nao:** ele restaura os quatro campos
 * que mexeu (`:1535`-`:1538`) justamente porque trabalhou sobre o objeto em
 * memoria. Aqui o conteudo e `readonly` e o calculo e funcao pura sobre copia,
 * logo a restauracao e desnecessaria — **mas a consulta de unicidade sai**, e ela
 * e observavel na sequencia de comandos.
 *
 * ⚠️ **A reserva da sanitizacao e o identificador do conteudo, como numero**
 * (`sanitize_title( ..., $post->ID )`, `:1495`): um conteudo cujo titulo
 * sanitiza para vazio recebe o proprio identificador numerico como endereco. A
 * coercao para texto esta feita aqui, e nao escondida na porta.
 */
export function identificadorDeAmostra(
  contexto: ContextoDoIdentificadorUnico,
  pedido: PedidoDeIdentificadorDeAmostra,
  ganchos?: GanchosDoIdentificadorDeAmostra,
): string {
  const { conteudo } = pedido;
  const reserva = String(conteudo.id);

  let estado = conteudo.estado;
  let identificador = conteudo.identificadorNaUrl;

  // Passo 1 (`:1493`-`:1497`): o truque. `$post->post_name ? ... :
  // $post->post_title` e a **verdade de PHP** do campo, nao a comparacao com
  // cadeia vazia: um identificador gravado como `'0'` cai pelo lado do titulo.
  // `sanitize_title()` nunca devolve `'0'`, logo o caso so chega aqui por linha
  // escrita direto na tabela — e ele chega igual nas duas metades.
  if (ESTADOS_SEM_ENDERECO_SERVIDO.includes(estado)) {
    estado = ESTADO_FINGIDO_NA_AMOSTRA;
    identificador = contexto.texto.sanitizarTitulo(
      verdadeiroComoNoPhp(identificador) ? identificador : conteudo.titulo,
      reserva,
      'save',
    );
  }

  // Passo 2 (`:1503`-`:1505`): `! is_null( $name )`.
  if (pedido.identificadorNaUrl !== undefined) {
    identificador = contexto.texto.sanitizarTitulo(
      pedido.identificadorNaUrl === ''
        ? (pedido.titulo ?? '')
        : pedido.identificadorNaUrl,
      reserva,
      'save',
    );
  }

  // Passo 3 (`:1507`): a MESMA funcao do caminho de gravacao, com o estado
  // fingido — e e por isso que o endereco de amostra ja tem o sufixo.
  identificador = identificadorUnico(contexto, {
    identificadorNaUrl: identificador,
    conteudoId: conteudo.id,
    estado,
    tipo: conteudo.tipo,
    // `$post->post_parent` — a coluna crua, que e o caminho de volta do vinculo
    // nomeado de T002 (`colunaDoVinculo`, e o par e total nos dois sentidos).
    paiId: colunaDoVinculo(conteudo.vinculo),
  });

  // Passo 4 (`:1534`).
  const filtro = ganchos?.filtrarIdentificadorEditavel;
  return filtro === undefined ? identificador : filtro(identificador, conteudo);
}
