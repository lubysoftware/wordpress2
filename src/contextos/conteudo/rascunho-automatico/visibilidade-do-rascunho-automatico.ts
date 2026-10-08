/**
 * **CA-11.2**: o rascunho automatico nao aparece em listagem alguma, publica ou
 * do painel.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11). Este
 * arquivo **nao constroi consulta**: ele declara, num lugar so, as **tres**
 * barreiras com que o legado mantem `auto-draft` fora das listagens, e as duas
 * excecoes que ele tem — para que quem construir cada consulta as reproduza em
 * vez de rederivar.
 *
 * ---
 *
 * # Barreira 1 — o registro do estado, e os tres `false` que so ele tem
 *
 * `auto-draft` e registrado com `'internal' => true` e `'date_floating' => true`
 * (`wp-includes/post.php:748`-`:757`), e os defaults de
 * `register_post_status()` derivam dali os campos de visibilidade. O resultado
 * esta em `../estado-editorial.ts`, que T001 leu do registro, e e dele que
 * {@link estadoApareceEmListagemDoPainel} e
 * {@link estadoApareceEmConsultaPublica} saem — **derivado, nao redigitado**,
 * porque a terceira derivacao independente da mesma tabela divergiria da
 * primeira.
 *
 * `auto-draft` e o **unico** estado de conteudo editorial com os tres `false` de
 * listagem ao mesmo tempo:
 *
 * | campo do registro | `auto-draft` | o que ele desliga |
 * |---|---|---|
 * | `publicly_queryable` | `false` | a consulta publica nao pode pedir este estado |
 * | `show_in_admin_all_list` | `false` | a lista "Todos" do painel |
 * | `show_in_admin_status_list` | `false` | a barra de contagem por estado |
 *
 * ⚠️ **`trash` tem os dois primeiros e NAO o terceiro** (`:733`-`:747`): a
 * lixeira conta na barra de estados. E e essa diferenca que faz de `auto-draft`
 * o unico invisivel dos dois — um porte que tratasse "interno" como sinonimo de
 * "invisivel" poria a lixeira fora da barra, onde o legado a mostra.
 *
 * ---
 *
 * # Barreira 2 — as seis consultas que o excluem **por nome**
 *
 * O registro nao basta, e o legado sabe: seis consultas repetem a exclusao com a
 * cadeia literal, porque elas nao passam pelo portao de `post_status` de
 * `WP_Query`. Sao estas, lidas uma a uma — {@link EXCLUSOES_LITERAIS_DE_LISTAGEM}:
 *
 * | onde | fragmento |
 * |---|---|
 * | `wp-admin/includes/class-wp-posts-list-table.php:122` | `AND post_status NOT IN ('trash', 'auto-draft')` |
 * | `wp-admin/includes/class-wp-list-table.php:738` | `AND post_status != 'auto-draft'` |
 * | `wp-admin/export.php:146` | `WHERE post_type = %s AND post_status != 'auto-draft'` |
 * | `wp-admin/includes/export.php:118` | `AND {$wpdb->posts}.post_status != 'auto-draft'` |
 * | `wp-admin/includes/export.php:421` | `WHERE post_status != 'auto-draft'` |
 * | `wp-includes/class-wp-rewrite.php:431` | `WHERE post_type = 'page' AND post_status != 'auto-draft'` |
 *
 * **Nenhuma delas e desta feature**, e nenhuma e deste contexto: as duas
 * primeiras sao tela de painel (BC-09), as tres do meio sao exportacao
 * (REQ-120, em `do-not-rewrite.md`) e a ultima e a reescrita de endereco
 * (BC-07). Elas estao aqui porque CA-11.2 fala de *"listagem alguma"* e **o
 * registro do estado nao cobre as seis**: quem portar cada uma precisa saber
 * que a exclusao e literal e que ela ja estava ali.
 *
 * ---
 *
 * # Barreira 3 — a pagina canonica tambem nao resolve
 *
 * `wp-includes/canonical.php:157` recusa redirecionar para um conteudo em
 * `auto-draft` mesmo quando o tipo e publico. Nao e listagem, e esta aqui pela
 * mesma razao: e um lugar em que o estado tem de ser testado pelo nome.
 *
 * ---
 *
 * # 🔴 As DUAS excecoes do legado, declaradas e nao resolvidas
 *
 * CA-11.2 diz *"listagem alguma"*. **No legado existem dois caminhos em que o
 * rascunho automatico e listado**, e os dois foram lidos no codigo:
 *
 * 1. **O personalizador torna `auto-draft` consultavel, em execucao.**
 *    `WP_Customize_Nav_Menus::make_auto_draft_status_previewable()`
 *    (`wp-includes/class-wp-customize-nav-menus.php:1359`-`:1368`) faz
 *    `$wp_post_statuses['auto-draft']->protected = true`, e o comentario do
 *    proprio legado diz para que: *"Makes the auto-draft status protected so
 *    that it can be queried"*. E **mutacao do registro de estados**, para que o
 *    item de menu criado como rascunho automatico apareca na previa do menu.
 * 2. **A API REST lista `auto-draft` a quem pode editar.** O parametro de
 *    consulta `status` tem `enum` igual a **todos** os estados registrados
 *    (`class-wp-rest-posts-controller.php:3131`), e `sanitize_post_statuses()`
 *    (`:3193`-`:3221`) aceita qualquer um deles de quem tem `edit_posts` do
 *    tipo. Isto e o **oposto** do parametro de **escrita**, que exclui os
 *    internos — ver `estado-pedido-pela-api.ts`.
 *
 * **T023 nao escolhe entre o criterio e o codigo, e nao precisa**, porque as
 * duas leituras levam ao mesmo lugar no que esta tarefa entrega: o registro que
 * ela grava carrega um estado que o registro do legado declara fora de toda
 * listagem **de fabrica**, e as duas excecoes sao **superficies que esta tarefa
 * nao constroi** — personalizador (BC-07, feature 009) e endpoint de consulta
 * REST (BC-09). O que ela faz e declarar as duas, com ancora, para quem decide.
 *
 * O **P1** e literal: *"divergir exige uma decisao humana registrada, citada no
 * codigo que divergiu"*, e nenhuma existe para CA-11.2. Mesmo precedente de T003
 * com CA-1.1 (*"recusa explicita na tela"* contra um painel que rebaixa) e de
 * T017 com CA-8.4 — e e este o precedente que
 * `../publicacao/permissao-de-publicacao.ts` e o `README.md` do modulo citam
 * como *"T023 com CA-11.2"*.
 */

import {
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
  type EstadoEditorial,
} from '../estado-editorial.js';

/**
 * `auto-draft` — o estado que a abertura do editor grava.
 *
 * Tipado como {@link EstadoEditorial} de proposito: ele e um dos 12 de fabrica,
 * e o tipo garante que esta cadeia continue sendo a mesma do vocabulario que
 * T001 leu do registro do legado (`wp-includes/post.php:748`).
 */
export const ESTADO_DE_RASCUNHO_AUTOMATICO: EstadoEditorial = 'auto-draft';

/**
 * As seis consultas do legado que excluem `auto-draft` **pelo nome**, com a
 * ancora de cada uma.
 *
 * E inventario, nao codigo executavel: nenhuma delas e montada neste contexto.
 * Fica como dado versionado porque o **P2** manda que o inventario de contrato
 * seja *"artefato versionado"*, e porque seis lugares que repetem a mesma cadeia
 * sao seis lugares em que um porte parcial a esquece.
 */
export const EXCLUSOES_LITERAIS_DE_LISTAGEM: readonly string[] = Object.freeze([
  'wp-admin/includes/class-wp-posts-list-table.php:122',
  'wp-admin/includes/class-wp-list-table.php:738',
  'wp-admin/export.php:146',
  'wp-admin/includes/export.php:118',
  'wp-admin/includes/export.php:421',
  'wp-includes/class-wp-rewrite.php:431',
]);

/**
 * As duas excecoes do legado a CA-11.2, com a ancora de cada uma.
 *
 * Declaradas como dado, e nao so em prosa, para que o teste desta tarefa possa
 * **afirmar que elas estao declaradas** — que e o que o P1 pede de uma
 * divergencia: existir citada no codigo, nao resolvida em silencio.
 */
export const EXCECOES_DECLARADAS_A_INVISIBILIDADE: readonly {
  readonly onde: string;
  readonly ancora: string;
}[] = Object.freeze([
  Object.freeze({
    onde: 'o personalizador torna o estado consultavel em execucao',
    ancora: 'wp-includes/class-wp-customize-nav-menus.php:1359',
  }),
  Object.freeze({
    onde: 'a consulta REST aceita o estado de quem tem a capacidade de editar',
    ancora:
      'wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:3193',
  }),
]);

/**
 * Se o estado entra em alguma das duas listagens do painel —
 * `show_in_admin_all_list` **ou** `show_in_admin_status_list`.
 *
 * E `ou` e nao `e` porque as duas listagens sao duas: a lista "Todos" e a barra
 * de contagem por estado. Um estado que entre em qualquer das duas **aparece** no
 * painel, e e isso que CA-11.2 nega para `auto-draft`.
 *
 * Deriva do registro que T001 leu, e por isso nao ha cadeia literal aqui.
 */
export function estadoApareceEmListagemDoPainel(
  estado: EstadoEditorial,
): boolean {
  const propriedades = PROPRIEDADES_DO_ESTADO_EDITORIAL[estado];
  return (
    propriedades.visivelNaListaDeTodos || propriedades.visivelNaListaDeEstados
  );
}

/**
 * Se a consulta publica pode pedir o estado — `publicly_queryable`.
 *
 * ⚠️ **Nao e o mesmo que `public`.** `public` responde *"aparece para quem nao
 * tem credencial"* e vale so em `publish`; `publicly_queryable` responde *"a
 * consulta publica pode pedir este estado por parametro"*, e e o campo que o
 * portao de `post_status` de `WP_Query` consulta. Os dois sao `false` em
 * `auto-draft`, e e o segundo que importa para listagem.
 *
 * **Quem filtra de fato e `WP_Query`**, que e T009 da feature 004
 * (`contextos/leitura-publica/`), e esta tarefa nao tem consulta publica para
 * alterar — mesma forma pela qual T005 afirmou CA-2.3 e T003 afirmou CA-1.3. O
 * que esta funcao entrega e a **condicao** do criterio, lida de um lugar so.
 */
export function estadoApareceEmConsultaPublica(
  estado: EstadoEditorial,
): boolean {
  return PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].consultavelPeloPublico;
}
