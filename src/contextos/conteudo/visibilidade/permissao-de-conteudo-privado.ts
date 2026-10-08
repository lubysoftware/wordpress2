/**
 * **CA-4.1**, a metade de permissao: gravar `private` exige a capacidade de
 * publicar aquele tipo de conteudo.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). E a
 * declaracao de permissao que o **P4** da constituicao cobra de *"toda operacao
 * exposta"*, e ela **nao** e uma capacidade propria de conteudo privado: o
 * legado nao tem `publish_private_posts`. E a MESMA capacidade da publicacao.
 *
 * ---
 *
 * # A capacidade e a de publicar, e nao uma capacidade de privacidade
 *
 * `handle_status_param()` resolve os quatro estados que exigem permissao num
 * `switch` so, e `private` cai ao lado de `publish` e `future`
 * (`wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:1569`):
 *
 * ```php
 * case 'private':
 *     if ( ! current_user_can( $post_type->cap->publish_posts ) ) {   // :1576
 *         return new WP_Error(
 *             'rest_cannot_publish',
 *             __( 'Sorry, you are not allowed to create private posts in this post type.' ),
 *             array( 'status' => rest_authorization_required_code() )
 *         );
 *     }
 *     break;
 * ```
 *
 * Tres coisas que isso fixa, e cada uma e observavel:
 *
 * 1. **O slot e o mesmo** — `$post_type->cap->publish_posts` —, logo quem pode
 *    publicar pode tornar privado, e quem nao pode, nao pode nenhum dos dois.
 *    A assimetria entre post e pagina sai de graca pelo registro do tipo, sem um
 *    unico `if` sobre o nome `page`: ver
 *    `../publicacao/permissao-de-publicacao.ts`.
 * 2. **O codigo de erro e o mesmo** — `rest_cannot_publish` —, e e por isso que
 *    {@link autorizarConteudoPrivado} devolve a mesma
 *    {@link RecusaDaPublicacao} de T003. Inventar um codigo proprio aqui
 *    quebraria o cliente que distingue erro por codigo, que e area 1 da
 *    Decisao 2 (*saida byte a byte*).
 * 3. **O texto e o unico que difere**, e difere byte a byte:
 *    {@link MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO} contra
 *    `MENSAGEM_DE_RECUSA_DE_PUBLICACAO`. T003 ja declarou a constante neste
 *    pacote, no `case` vizinho e sem usa-la, com a nota *"quem pegar T009 usa
 *    esta constante"* — e e o que esta tarefa faz, em lugar de escrever um
 *    segundo texto que divergiria no dia em que um dos dois mudasse.
 *
 * E uma pergunta so, e ela e **primitiva**: `publish_posts` nao passa por
 * `map_meta_cap()`, nao recebe objeto e nao resolve por autoria nem por estado.
 * Somar `edit_post` aqui tornaria o sistema mais fechado que o legado nesta
 * decisao — a soma de capacidade sobre conteudo alheio e **CA-8.1**, de US-8, e
 * chega em T017 com o caminho dela.
 *
 * ---
 *
 * # 🔴 O painel nao recusa a visibilidade privada: ele a REBAIXA, e de um jeito
 * proprio
 *
 * Mesma divergencia que T003 registrou para CA-1.1 — e aqui o rebaixamento
 * **nao e o mesmo**. Os dois estao na mesma funcao, a dois blocos de distancia:
 *
 * | pedido | sem a capacidade de publicar, o painel grava | onde |
 * |---|---|---|
 * | `private` | **o estado anterior**, ou `pending` quando nao ha estado anterior | `wp-admin/includes/post.php:142`-`:144` |
 * | `publish` ou `future` | `pending` | `wp-admin/includes/post.php:152`-`:159` |
 *
 * ```php
 * if ( isset( $post_data['post_status'] ) && 'private' === $post_data['post_status']
 *     && ! current_user_can( $ptype->cap->publish_posts ) ) {
 *     $post_data['post_status'] = $previous_status ? $previous_status : 'pending';
 * }
 * ```
 *
 * A diferenca e deliberada e e observavel: pedir privado sem poder publicar
 * **devolve o conteudo ao estado em que ele estava** — um rascunho continua
 * rascunho —, enquanto pedir publicado o manda para a fila de revisao. Um porte
 * que uniformizasse os dois rebaixamentos poria em revisao rascunhos que o
 * legado deixa quietos.
 *
 * **Esta tarefa declara os dois valores e NAO os aplica**, pelo mesmo
 * precedente de T003 e pelas mesmas tres razoes:
 *
 * 1. a superficie que rebaixa e o caminho de escrita do **painel**
 *    (`_wp_translate_postdata()`), que nesta feature e **T005** (US-2) e
 *    **T015** (US-7), nao esta;
 * 2. o rebaixamento precisa do **estado anterior** da linha, que so o caminho de
 *    gravacao tem em maos — ele o le em `wp-admin/includes/post.php:140`, e a
 *    cadeia vazia de `get_post_field()` para linha inexistente e o que faz o
 *    `? :` cair em `pending`;
 * 3. CA-4.1 nao fala de rebaixamento: ele fala de *"escolher visibilidade
 *    privada grava um estado distinto de publicado"*. A recusa como valor, com o
 *    codigo e o texto da API, e a superficie que o pacote descreve.
 *
 * O **P1** exige decisao humana registrada para divergir, e nenhuma existe. As
 * duas leituras levam ao mesmo lugar nesta decisao — sem a capacidade, o
 * conteudo **nao** fica privado —, e e isso que {@link autorizarConteudoPrivado}
 * garante.
 */

import {
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { EstadoEditorial } from '../estado-editorial.js';
import {
  CAPACIDADE_DE_PUBLICAR,
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO,
  capacidadeDePublicar,
  codigoDeAutorizacaoExigida,
  type RecusaDaPublicacao,
} from '../publicacao/index.js';
import type { ContextoDeVisibilidade } from './contexto-de-visibilidade.js';

/**
 * O slot de capacidade que a visibilidade privada consulta no registro do tipo
 * — **o mesmo da publicacao**.
 *
 * Reexportado com o nome do que ele decide aqui, e apontando para a MESMA
 * constante de `../publicacao/permissao-de-publicacao.ts`: duas constantes com
 * o mesmo valor divergiriam no dia em que uma fosse corrigida. Ver o item 1 do
 * cabecalho.
 */
export const CAPACIDADE_DE_CONTEUDO_PRIVADO = CAPACIDADE_DE_PUBLICAR;

/**
 * O estado que o painel grava quando quem pede `private` nao pode publicar
 * **e nao ha estado anterior** (`wp-admin/includes/post.php:143`).
 *
 * Declarado e **nao aplicado** — ver a secao 🔴 do cabecalho. Quem construir o
 * caminho de escrita do painel (T005, T015) usa esta constante em lugar de
 * reescrever o literal.
 */
export const ESTADO_DO_REBAIXAMENTO_SEM_ESTADO_ANTERIOR: EstadoEditorial =
  'pending';

/**
 * **CA-4.1.** Decide se o ator do contexto pode tornar aquele tipo de conteudo
 * privado, e devolve a recusa quando nao pode.
 *
 * Devolve `null` quando a escolha e autorizada — mesma forma de
 * `autorizarPublicacao()`, em que ausencia de recusa e a autorizacao.
 *
 * E `handle_status_param()`, `case 'private'`
 * (`class-wp-rest-posts-controller.php:1575`-`:1583`), com os dois ramos de
 * `null` que `capacidadeDePublicar()` ja distingue e que os dois fecham a porta:
 * tipo nao registrado e slot ausente no mapa do tipo. A analise de cada um esta
 * em `../publicacao/permissao-de-publicacao.ts`, e esta decisao a reusa em lugar
 * de reproduzi-la.
 */
export function autorizarConteudoPrivado(
  contexto: ContextoDeVisibilidade,
  tipoDoConteudo: string,
): RecusaDaPublicacao | null {
  const capacidade = capacidadeDePublicar(
    contexto.tipoDeConteudo(tipoDoConteudo),
  );

  if (capacidade === null) {
    return recusaDeConteudoPrivado(contexto.ator);
  }

  if (!perguntarPermissao(comAtor(contexto.base, contexto.ator), capacidade)) {
    return recusaDeConteudoPrivado(contexto.ator);
  }

  return null;
}

/**
 * A recusa, com o codigo da publicacao e o texto do `case 'private'`.
 *
 * Os dois ramos de {@link autorizarConteudoPrivado} produzem a **mesma**
 * recusa, pela mesma razao que em T003: o legado nao tem, para o tipo nao
 * registrado, nem texto nem codigo HTTP proprios neste caminho — tem um erro
 * fatal. Inventar uma segunda mensagem seria inventar superficie.
 *
 * O numero vem de `rest_authorization_required_code()`
 * (`wp-includes/rest-api.php:1438`): **403 autenticado, 401 anonimo**. O 401 do
 * anonimo nao e divergencia da spec — e a mesma regra na outra ponta, e e
 * observavel por qualquer cliente da API.
 */
function recusaDeConteudoPrivado(
  ator: AtorDeAutorizacao,
): RecusaDaPublicacao {
  return {
    codigo: CODIGO_DE_RECUSA_DE_PUBLICACAO,
    mensagem: MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO,
    codigoHttp: codigoDeAutorizacaoExigida(ator),
  };
}
