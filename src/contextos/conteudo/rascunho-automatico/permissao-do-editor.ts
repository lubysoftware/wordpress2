/**
 * **CA-11.1**: abrir o editor exige **duas** capacidades do tipo de conteudo, e
 * nao uma.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11). E a
 * declaracao de permissao que o **P4** da constituicao cobra de *"toda operacao
 * exposta"*, e aqui ela nao e a de publicar nem "nenhuma": sao duas, nomeadas, e
 * as duas saem do **registro do tipo**.
 *
 * ---
 *
 * # As duas perguntas, e o `&&` entre elas
 *
 * `wp-admin/post-new.php:58`:
 *
 * ```php
 * if ( ! current_user_can( $post_type_object->cap->edit_posts )
 *   || ! current_user_can( $post_type_object->cap->create_posts ) ) {
 *     wp_die(
 *         '<h1>' . __( 'You need a higher level of permission.' ) . '</h1>' .
 *         '<p>' . __( 'Sorry, you are not allowed to create posts as this user.' ) . '</p>',
 *         403
 *     );
 * }
 * ```
 *
 * Sao **dois slots** do mapa `$post_type->cap`, e e preciso ter os dois: o
 * `||` sobre as negacoes e o `&&` sobre as concessoes. O **P3** da constituicao
 * descreve exatamente esta forma para a autorizacao sobre objeto — *"e
 * necessario ter **todas** as capacidades devolvidas, nao qualquer uma"* —, e
 * aqui ela aparece sem passar por `map_meta_cap()`: as duas sao primitivas,
 * perguntadas sem objeto.
 *
 * ## 🟢 De fabrica as duas sao a MESMA capacidade, e e por isso que o `&&` se perde
 *
 * `get_post_type_capabilities()` (`wp-includes/post.php:2034`) deriva
 * `edit_posts` de `capability_type` e, tres linhas antes de devolver, faz:
 *
 * ```php
 * // Post creation capability simply maps to edit_posts by default:
 * if ( ! isset( $capabilities['create_posts'] ) ) {
 *     $capabilities['create_posts'] = $capabilities['edit_posts'];
 * }
 * ```
 *
 * Logo, para `post` e para `page` — e para todo tipo que nao declare
 * `create_posts` — as duas perguntas sao a mesma cadeia perguntada duas vezes, e
 * um porte que cravasse uma so passaria em qualquer teste feito com os tipos do
 * nucleo. **Ele quebraria o tipo de terceiro que declara `create_posts`
 * proprio**, que e o caso de uso para o qual aquele slot existe: um tipo em que
 * editar o que ja existe e permitido e criar nao e. O **P2** poe o registro do
 * tipo no contrato publico, e o mapa de capacidades e aberto por decisao de
 * `plataforma/autorizacao/` — *"um tipo de terceiro declara o conjunto que
 * quiser, em execucao"*.
 *
 * Por isso as duas perguntas estao aqui como duas, e o teste as exercita com um
 * tipo que as separa.
 *
 * ---
 *
 * # As superficies que recusam, e como cada uma recusa
 *
 * `get_default_post_to_edit()` **nao verifica capacidade nenhuma**: assim como
 * `wp_insert_post()`, ela e funcao publica e sem portao
 * (`wp-admin/includes/post.php:758`). Quem cobra sao os chamadores, e eles nao
 * cobram do mesmo jeito:
 *
 * | superficie | onde | o que faz quem nao tem as duas |
 * |---|---|---|
 * | Painel, tela de conteudo novo | `wp-admin/post-new.php:58` | `wp_die()` com **403** e os dois textos de {@link MENSAGEM_DE_RECUSA_DO_EDITOR} |
 * | Painel, bloco de rascunho rapido | `wp-admin/includes/dashboard.php:554` | pergunta **so** `edit_posts`, e sem o tipo — a cadeia literal — e **nao recusa: simplesmente nao desenha o bloco** (`return`) |
 * | XML-RPC `wp_newPost` | `class-wp-xmlrpc-server.php:1505` | `IXR_Error( 401, 'Sorry, you are not allowed to post on this site.' )`, com as **mesmas duas** capacidades |
 *
 * ⚠️ **A segunda linha e uma divergencia real entre duas telas do mesmo
 * produto**, e esta declarada em vez de unificada: o rascunho rapido do painel
 * cria rascunho automatico (`dashboard.php:565` e `:571`) perguntando uma
 * capacidade a menos — e a cadeia `'edit_posts'` crua, sem passar pelo mapa do
 * tipo, porque ali o tipo e sempre `post`. Quem portar aquela tela reproduz a
 * pergunta **dela**, e nao esta; o que esta funcao declara e a permissao da
 * operacao de dominio, que e a da tela de conteudo novo — a unica que CA-11.1
 * descreve.
 *
 * ---
 *
 * # Esta tarefa recusa como valor, e por que o codigo HTTP e 403 fixo
 *
 * `plan.md` fixa a forma na secao *Contratos*: *"Erro e devolvido como valor,
 * nao como excecao: e assim no legado e e o que permite a um ponto de extensao
 * inspecionar a falha"*.
 *
 * **E 403 mesmo para o ator anonimo**, e isso e diferente de T003. Em
 * `permissao-de-publicacao.ts` o codigo sai de
 * `rest_authorization_required_code()`, que devolve 401 a quem nao esta
 * autenticado; aqui a superficie e o painel, e o `wp_die( ..., 403 )` de
 * `post-new.php:62` e **literal**, sem condicao sobre o ator. Na pratica o
 * visitante anonimo nem chega ali — `admin.php` o desvia em `auth_redirect()`
 * antes —, e o que esta funcao reproduz e o codigo que a linha tem. Inventar um
 * 401 aqui seria inventar superficie.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDoEditor } from './contexto-de-rascunho-automatico.js';

/**
 * O slot de capacidade de **editar** daquele tipo.
 *
 * E **chave de mapa**, nao nome de capacidade: o nome sai de
 * `tipo.capacidades[ CAPACIDADE_DE_EDITAR ]`. Para `post` vale `edit_posts`;
 * para `page`, `edit_pages`.
 */
export const CAPACIDADE_DE_EDITAR = 'edit_posts';

/**
 * O slot de capacidade de **criar** daquele tipo.
 *
 * Mesma natureza do de cima, com a diferenca que o legado documenta em
 * comentario: ausente do registro, ele **vira o slot de editar**
 * (`wp-includes/post.php:2070`-`:2073`). Ver a secao *"De fabrica as duas sao a
 * MESMA capacidade"* no cabecalho deste arquivo.
 */
export const CAPACIDADE_DE_CRIAR = 'create_posts';

/*
  ── OS TEXTOS SAO OS DO LEGADO, EM INGLES, E FECHAM CONTRA O ORACULO ────────

  Mesmo precedente e mesma postura de `../publicacao/permissao-de-publicacao.ts`
  e de `contextos/identidade-e-acesso/administracao-de-contas/mensagens-da-administracao.ts`:
  `EC-05` fixa que *"o `msgid` em ingles E a chave do catalogo"*, logo traduzir
  aqui trocaria a chave. Os textos foram lidos nas linhas citadas, e a
  conferencia byte a byte fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
*/

/**
 * O titulo da recusa do painel — o `<h1>` de `wp-admin/post-new.php:60`.
 *
 * Sao **dois** textos e nao um, porque o legado passa os dois a `wp_die()` como
 * uma cadeia so com marcacao no meio. Separa-los aqui preserva os dois `msgid`
 * do catalogo, que e o que a traducao indexa; quem montar a tela os junta na
 * ordem e com a marcacao que a linha tem.
 */
export const TITULO_DE_RECUSA_DO_EDITOR = 'You need a higher level of permission.';

/** O corpo da recusa do painel — o `<p>` de `wp-admin/post-new.php:61`. */
export const MENSAGEM_DE_RECUSA_DO_EDITOR =
  'Sorry, you are not allowed to create posts as this user.';

/**
 * O texto da recusa do XML-RPC para as **mesmas** duas capacidades
 * (`class-wp-xmlrpc-server.php:1506`).
 *
 * **Declarado e nao usado aqui.** Esta ali porque e a segunda superficie que
 * pergunta este par, com outro codigo (401) e outro texto, e porque quem portar
 * `wp_newPost` (feature de superficies, `ESC-SUPERFICIES`) o reinventaria ao
 * ler so esta funcao. O **P8** poe superficie publicada fora do que se remove.
 */
export const MENSAGEM_DE_RECUSA_DO_EDITOR_POR_XML_RPC =
  'Sorry, you are not allowed to post on this site.';

/** O codigo HTTP que `wp-admin/post-new.php:62` declara, literal. */
export const CODIGO_HTTP_DE_RECUSA_DO_EDITOR = 403;

/**
 * Uma recusa de abertura de editor, devolvida **como valor**.
 *
 * Nao tem campo de codigo de erro porque o legado nao tem um: `wp_die()` recebe
 * marcacao e um numero, e nao um `WP_Error` com `code`. Inventar
 * `rest_cannot_create` aqui seria trazer para o painel um vocabulario que so a
 * API tem.
 */
export interface RecusaDoEditor {
  readonly titulo: string;
  readonly mensagem: string;
  readonly codigoHttp: typeof CODIGO_HTTP_DE_RECUSA_DO_EDITOR;
}

/**
 * Os nomes das duas capacidades **daquele tipo**, ou `null` quando elas nao
 * podem ser resolvidas.
 *
 * `null` sai em dois casos, e os dois fecham a porta — mesma analise, com as
 * mesmas duas razoes, de `capacidadeDePublicar()` em
 * `../publicacao/permissao-de-publicacao.ts`:
 *
 * 1. **tipo nao registrado.** `post-new.php` nem chega a este `if`: ele morre em
 *    `wp_die( __( 'Invalid post type.' ) )` 34 linhas antes (`:24`), porque o
 *    tipo pedido tem de estar entre os que declaram `show_ui`. A porta fechada e
 *    o resultado nas duas leituras, e e o que esta funcao reproduz;
 * 2. **slot ausente no mapa do tipo.** Nao acontece em tipo registrado pelo
 *    caminho normal, e esta aqui porque o mapa e **aberto**.
 */
export function capacidadesDeAbrirOEditor(
  tipo: TipoDeConteudoNaAutorizacao | null,
): readonly [Capacidade, Capacidade] | null {
  if (tipo === null) {
    return null;
  }

  const editar = tipo.capacidades[CAPACIDADE_DE_EDITAR];
  const criar = tipo.capacidades[CAPACIDADE_DE_CRIAR];

  if (editar === undefined || criar === undefined) {
    return null;
  }

  return [editar, criar];
}

/**
 * **CA-11.1.** Decide se o ator do contexto pode abrir o editor daquele tipo, e
 * devolve a recusa quando nao pode.
 *
 * Devolve `null` quando a abertura e autorizada — mesma forma das guardas de
 * `../publicacao/permissao-de-publicacao.ts` e de `administracao-de-contas/`, em
 * que ausencia de recusa e a autorizacao.
 *
 * **As duas perguntas sao primitivas e sao feitas na ordem do legado.** Nenhuma
 * passa por `map_meta_cap()`: nao sao meta-capacidades, nao recebem objeto e nao
 * resolvem por autoria nem por estado — o legado chama `current_user_can( $nome )`
 * sem argumento de objeto nas duas, e e isso que acontece aqui.
 *
 * O que **nao** foi acrescentado: nenhuma terceira pergunta. Somar
 * `publish_posts` aqui tornaria o sistema mais fechado que o legado — abrir o
 * editor nao exige poder publicar, e e justamente por isso que o colaborador de
 * UC-06 chega a tela e sai dela pelo caminho de `pending` (US-7).
 */
export function autorizarAberturaDoEditor(
  contexto: ContextoDoEditor,
  tipoDoConteudo: string,
): RecusaDoEditor | null {
  const capacidades = capacidadesDeAbrirOEditor(
    contexto.tipoDeConteudo(tipoDoConteudo),
  );

  if (capacidades === null) {
    return recusaDoEditor();
  }

  const autorizacao = comAtor(contexto.base, contexto.gravacao.ator);

  // O `||` do legado sobre as duas negacoes: basta uma faltar para recusar.
  for (const capacidade of capacidades) {
    if (!perguntarPermissao(autorizacao, capacidade)) {
      return recusaDoEditor();
    }
  }

  return null;
}

/**
 * A recusa, montada com o titulo, o texto e o codigo que a linha do legado tem.
 *
 * Os tres ramos de {@link autorizarAberturaDoEditor} produzem a **mesma**
 * recusa, e isso e deliberado: o legado nao tem recusa propria para o slot
 * ausente, e para o tipo nao registrado ele morre com outro texto, numa linha
 * que e da tela e nao desta decisao. Inventar uma segunda mensagem seria
 * inventar superficie.
 *
 * Nao recebe o ator de proposito — ver a secao *"por que o codigo HTTP e 403
 * fixo"* no cabecalho deste arquivo.
 */
function recusaDoEditor(): RecusaDoEditor {
  return {
    titulo: TITULO_DE_RECUSA_DO_EDITOR,
    mensagem: MENSAGEM_DE_RECUSA_DO_EDITOR,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DO_EDITOR,
  };
}
