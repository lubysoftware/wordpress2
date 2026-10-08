/**
 * **CA-1.1**: a publicacao exige a capacidade de publicar aquele tipo de
 * conteudo.
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao` (US-1). E a
 * declaracao de permissao que o **P4** da constituicao cobra de *"toda operacao
 * exposta"*, e aqui ela nao e "nenhuma": e uma, nomeada, e resolvida do
 * **registro do tipo**.
 *
 * ---
 *
 * # A capacidade e o nome que o TIPO declara, nao a cadeia `publish_posts`
 *
 * O legado nunca compara a cadeia literal: ele le
 * `$post_type->cap->publish_posts`, que e um **slot** do mapa de capacidades
 * daquele tipo (`wp-includes/post.php:1884`, `get_post_type_capabilities()`).
 * Para o tipo `post` o slot vale `publish_posts`; para `page`, `publish_pages`;
 * para um tipo de terceiro, o que o `capability_type` daquele registro derivou.
 *
 * E e **esse** mecanismo que produz a assimetria que US-8 descreve sem um unico
 * `if` sobre o nome `page`: *"nenhuma capacidade de pagina chega a autor ou
 * colaborador: a assimetria e deliberada"*. Um porte que cravasse
 * `publish_posts` aqui publicaria pagina com capacidade de post.
 *
 * ---
 *
 * # As superficies que recusam, e como cada uma recusa
 *
 * `wp_publish_post()` **nao verifica capacidade nenhuma** — ela e funcao publica
 * e sem portao (`wp-includes/post.php:5404`). Quem cobra sao as superficies, e
 * elas nao cobram do mesmo jeito. O inventario, lido linha a linha:
 *
 * | superficie | onde | o que faz quem nao tem a capacidade |
 * |---|---|---|
 * | API REST | `class-wp-rest-posts-controller.php:1586`, `handle_status_param()` | devolve o erro `rest_cannot_publish` com o codigo de {@link codigoDeAutorizacaoExigida} — **403** autenticado, 401 anonimo |
 * | XML-RPC | `class-wp-xmlrpc-server.php:1522`, `:5271`, `:5463`, `:6014`, `:6942` | devolve `IXR_Error( 401, ... )` — **sempre 401**, com cinco textos diferentes |
 * | Painel | `wp-admin/includes/post.php:154`, `_wp_translate_postdata()` | **reescreve o estado pedido para `pending`** em vez de recusar |
 *
 * ## 🔴 CA-1.1 diz "recusa explicita na tela", e o painel do legado NAO recusa
 *
 * O criterio escreve: *"sem ela a acao e recusada com 403 na API e com recusa
 * explicita na tela"*, e a tabela de excecoes de UC-03 repete — *"o painel
 * recusa com 'Voce nao tem permissao'"*. **No codigo do legado o painel nao
 * recusa a publicacao: ele a rebaixa.** O trecho e literal
 * (`wp-admin/includes/post.php:150`-`:158`):
 *
 * ```php
 * if ( isset( $post_data['post_status'] )
 *     && ( in_array( $post_data['post_status'], array( 'publish', 'future' ), true )
 *     && ! current_user_can( $ptype->cap->publish_posts ) )
 * ) {
 *     if ( ! in_array( $previous_status, $published_statuses, true )
 *         || ! current_user_can( 'edit_post', $post_id ) ) {
 *         $post_data['post_status'] = 'pending';
 *     }
 * }
 * ```
 *
 * com o comentario do proprio legado acima dele: *"Posts 'submitted for
 * approval' are submitted to $_POST the same as if they were being published.
 * Change status from 'publish' to 'pending' if user lacks permissions to publish
 * or to resave published posts."* E a tela tambem nao **oferece** publicar: o
 * controlador REST so acrescenta a acao `wp:action-publish` aos vinculos da
 * resposta quando a capacidade existe
 * (`class-wp-rest-posts-controller.php:2352`), e e desse vinculo que o editor
 * decide entre *"Publish"* e *"Submit for Review"*.
 *
 * As **unicas** recusas por texto que o legado tem para publicar sao as da API e
 * as do XML-RPC — `grep "not allowed to publish"` na arvore devolve dez
 * ocorrencias, todas nesses dois arquivos, nenhuma em `wp-admin/`. O que ha em
 * `wp-admin/` e a recusa por **nao poder editar**, que e outra capacidade e
 * outro criterio: `wp_die( 'Sorry, you are not allowed to edit this post.' )`
 * (`wp-admin/includes/post.php:295`).
 *
 * **Esta tarefa nao escolhe entre as duas leituras, e nao precisa**, porque as
 * duas levam ao mesmo lugar nesta operacao: sem a capacidade, **a publicacao nao
 * acontece**. O que ela faz e:
 *
 * 1. **recusar**, como valor, com o codigo e o texto da API — que e a superficie
 *    que CA-1.1 nomeia com numero e a unica cujo texto o legado tem;
 * 2. **nao** reproduzir aqui o rebaixamento do painel. Ele e o estado `pending`
 *    de **US-7** (CA-7.1: *"quem tem permissao de escrever e nao tem de publicar
 *    envia o conteudo para o estado pendente"*), chega em **T015** e passa pelo
 *    caminho de gravacao, nao por este. ✔ **T015 o portou**, em
 *    `../revisao/estado-na-submissao.ts`, e **nao** fechou esta divergencia: com
 *    as duas tarefas, as duas superficies do sistema novo ficam diferentes do
 *    mesmo jeito que as do legado — a API recusa, o painel rebaixa;
 * 3. **registrar a divergencia de redacao** para quem decide, em vez de
 *    inventar na tela uma recusa que o legado nao tem. O **P1** e literal:
 *    *"divergir exige uma decisao humana registrada, citada no codigo que
 *    divergiu"*, e nenhuma existe. Mesmo precedente de T023 com CA-11.2 e de
 *    T017 com CA-8.4.
 */

import {
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type Capacidade,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDePublicacao } from './contexto-de-publicacao.js';

/**
 * O slot de capacidade que a publicacao consulta no registro do tipo.
 *
 * E **chave de mapa**, nao nome de capacidade: o nome sai de
 * `tipo.capacidades[ CAPACIDADE_DE_PUBLICAR ]`. Para `post` o valor e a propria
 * cadeia `publish_posts`; para `page` e `publish_pages`.
 */
export const CAPACIDADE_DE_PUBLICAR = 'publish_posts';

/** O codigo HTTP que a recusa declara, ou `null` quando o legado nao declara nenhum. */
export type CodigoDeRecusaDaPublicacao = 401 | 403 | null;

/**
 * Uma recusa de publicacao, devolvida **como valor**.
 *
 * `plan.md` fixa a forma na secao *Contratos*: *"Erro e devolvido como valor,
 * nao como excecao: e assim no legado e e o que permite a um ponto de extensao
 * inspecionar a falha"*.
 */
export interface RecusaDaPublicacao {
  /** O codigo de erro do legado (`rest_cannot_publish`). */
  readonly codigo: string;
  /** O texto do legado, em ingles — ver a nota de catalogo abaixo. */
  readonly mensagem: string;
  readonly codigoHttp: CodigoDeRecusaDaPublicacao;
}

/*
  ── OS TEXTOS SAO OS DO LEGADO, EM INGLES, E FECHAM CONTRA O ORACULO ────────

  Mesmo precedente e mesma postura de
  `contextos/identidade-e-acesso/administracao-de-contas/mensagens-da-administracao.ts`:
  `EC-05` fixa que *"o `msgid` em ingles E a chave do catalogo"*, logo traduzir
  aqui trocaria a chave. Os textos foram lidos nas linhas citadas, e a
  conferencia byte a byte fecha contra o oraculo (`ESC-ORACULO`,
  BR-MIGRAR-116).
*/

/**
 * O texto que a API devolve a quem nao pode publicar
 * (`class-wp-rest-posts-controller.php:1589`).
 *
 * O **mesmo** texto serve `publish` e `future`: no legado os dois estados caem
 * no mesmo `case` do `switch`, e e por isso que esta constante nao se chama "de
 * publicacao imediata". Quem fizer T013 (US-6) reusa esta, e nao escreve outra.
 */
export const MENSAGEM_DE_RECUSA_DE_PUBLICACAO =
  'Sorry, you are not allowed to publish posts in this post type.';

/**
 * O texto do `case 'private'` do mesmo `switch`
 * (`class-wp-rest-posts-controller.php:1580`).
 *
 * **Declarado e nao usado aqui**, porque e o mesmo `switch` do legado e seria
 * reinventado por quem o lesse depois: a visibilidade privada e **US-4**, em
 * **T009**, e la a capacidade exigida e a mesma — `publish_posts` do tipo
 * (`class-wp-rest-posts-controller.php:1576`). Quem pegar T009 usa esta
 * constante.
 */
export const MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO =
  'Sorry, you are not allowed to create private posts in this post type.';

/** O codigo de erro que a API usa nos dois casos acima. */
export const CODIGO_DE_RECUSA_DE_PUBLICACAO = 'rest_cannot_publish';

/**
 * `rest_authorization_required_code()` — **403 autenticado, 401 anonimo**
 * (`wp-includes/rest-api.php:1438`).
 *
 * CA-1.1 fala em 403, e 403 e o que o criterio descreve: quem publica em US-1 e
 * *"o autor"*, logo esta autenticado. O **401 do visitante anonimo nao e
 * divergencia da spec, e a mesma regra na outra ponta** — e reproduzi-lo e o que
 * o **P1** manda, porque e observavel por qualquer cliente da API.
 *
 * A condicao do legado e `is_user_logged_in()`, que e
 * `wp_get_current_user()->exists()` — e e por isso que a decisao aqui le
 * {@link AtorDeAutorizacao.existe} e nao o identificador: o ator anonimo do
 * legado **existe como objeto** com `ID` 0 e `exists()` falso (ver
 * `ATOR_ANONIMO` em `plataforma/autorizacao/contexto-de-autorizacao.ts`).
 */
export function codigoDeAutorizacaoExigida(ator: AtorDeAutorizacao): 401 | 403 {
  return ator.existe ? 403 : 401;
}

/**
 * O nome da capacidade de publicar **daquele tipo**, ou `null` quando ele nao
 * pode ser resolvido.
 *
 * `null` sai em dois casos, e os dois fecham a porta:
 *
 * 1. **tipo nao registrado** (`get_post_type_object()` devolve `false`). UC-03
 *    poe isso na tabela de excecoes com a consequencia escrita: *"o mapeamento
 *    degrada para `edit_others_posts`, a capacidade mais alta, com aviso de uso
 *    indevido — **todo caminho de erro da autorizacao fecha a porta**"*. No
 *    PHP 8 do legado este caminho e mais bruto do que a tabela sugere: ler
 *    `->cap` de `false` e erro fatal, e a requisicao morre — o que **tambem** e
 *    a acao nao acontecer. A porta fechada e o unico resultado que as duas
 *    leituras compartilham, e e o que esta tarefa reproduz;
 * 2. **slot ausente no mapa do tipo.** Nao acontece em tipo registrado pelo
 *    caminho normal — `get_post_type_capabilities()` deriva os 15 slots de
 *    `capability_type` e `publish_posts` esta entre eles —, e esta aqui porque o
 *    mapa e **aberto** por decisao de `plataforma/autorizacao/`: *"um tipo de
 *    terceiro declara o conjunto que quiser, em execucao"*.
 */
export function capacidadeDePublicar(
  tipo: TipoDeConteudoNaAutorizacao | null,
): Capacidade | null {
  if (tipo === null) {
    return null;
  }
  return tipo.capacidades[CAPACIDADE_DE_PUBLICAR] ?? null;
}

/**
 * **CA-1.1.** Decide se o ator do contexto pode publicar aquele tipo, e devolve
 * a recusa quando nao pode.
 *
 * Devolve `null` quando a publicacao e autorizada — mesma forma das guardas de
 * `administracao-de-contas/`, em que ausencia de recusa e a autorizacao.
 *
 * **A pergunta e uma so, e e primitiva.** `publish_posts` **nao** passa por
 * `map_meta_cap()`: nao e meta-capacidade, nao recebe objeto e nao resolve por
 * autoria nem por estado. O legado chama `current_user_can( $nome )` sem
 * argumento de objeto, e e isso que acontece aqui — a traducao de objeto de
 * `casoDeConteudo()` serve `edit_post`, `read_post` e `delete_post`, que sao de
 * outras historias.
 *
 * O que **nao** foi acrescentado: nenhuma segunda pergunta. Somar `edit_post`
 * aqui tornaria o sistema mais fechado que o legado nesta operacao — a soma de
 * capacidade sobre conteudo alheio e **CA-8.1**, de US-8, e chega em T017 com o
 * caminho dela.
 */
export function autorizarPublicacao(
  contexto: ContextoDePublicacao,
  tipoDoConteudo: string,
): RecusaDaPublicacao | null {
  const capacidade = capacidadeDePublicar(contexto.tipoDeConteudo(tipoDoConteudo));

  if (capacidade === null) {
    return recusaDePublicacao(contexto.ator);
  }

  if (!perguntarPermissao(comAtor(contexto.base, contexto.ator), capacidade)) {
    return recusaDePublicacao(contexto.ator);
  }

  return null;
}

/**
 * A recusa, montada com o codigo que a superficie do legado declara.
 *
 * Os dois ramos de {@link autorizarPublicacao} produzem a **mesma** recusa, e
 * isso e deliberado: o legado nao tem, para o tipo nao registrado, nem texto nem
 * codigo HTTP proprios neste caminho — tem um erro fatal. Inventar uma segunda
 * mensagem seria inventar superficie.
 */
function recusaDePublicacao(ator: AtorDeAutorizacao): RecusaDaPublicacao {
  return {
    codigo: CODIGO_DE_RECUSA_DE_PUBLICACAO,
    mensagem: MENSAGEM_DE_RECUSA_DE_PUBLICACAO,
    codigoHttp: codigoDeAutorizacaoExigida(ator),
  };
}
