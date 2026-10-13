/**
 * A permissao de apagar em definitivo — a declaracao que o **P4** da
 * constituicao cobra de *"toda operacao exposta"*.
 *
 * Entrega de **T017** (US-8). US-8 nao tem criterio de permissao proprio: os
 * quatro criterios dela sao sobre a cascata. A declaracao existe porque o P4 a
 * exige de toda operacao nova, e porque sem ela a operacao nasceria **sem portao
 * nenhum** — que e o que `wp_delete_post()` e, por desenho.
 *
 * ── A CAPACIDADE E A MESMA DO DESCARTE, E ISSO E A DESCOBERTA ───────────────
 *
 * `delete_post` daquele registro, a mesma meta-capacidade que US-1 pergunta
 * (`permissao-de-descarte.ts`). As **tres** superficies do painel perguntam a
 * mesma coisa para tres acoes diferentes:
 *
 * | acao da rota | pergunta | linha |
 * |---|---|---|
 * | `trash` | `current_user_can( 'delete_post', $post_id )` | `wp-admin/post.php:261` |
 * | `untrash` | a **mesma** | `wp-admin/post.php:299` |
 * | `delete` | a **mesma** | `wp-admin/post.php:328` |
 *
 * Ou seja: **quem pode descartar pode apagar em definitivo**, e quem pode apagar
 * pode restaurar. Nao existe, no legado, capacidade separada para a exclusao
 * irreversivel — e e por isso que US-4 existe como historia de **tela**: a unica
 * diferenca entre os dois pedidos e o rotulo, a acao da rota e o `nonce`
 * (T009, `../descarte/acoes-de-descarte-na-tela.ts`), nunca a autorizacao.
 * `permissions.md` nao tem linha para "apagar em definitivo" porque ela nao
 * existe.
 *
 * Os tres ramos de traducao que valem aqui sao os mesmos de US-1, e nao estao
 * reimplementados: a versao anterior devolve `do_not_allow` e nao segue para o
 * pai, as paginas de funcao especial trocam ou somam capacidade, e o resto sai
 * por autoria e estado. Ver a tabela de `permissao-de-descarte.ts`.
 *
 * ── OS TEXTOS SAO OUTROS, E SAO QUATRO NOVOS ───────────────────────────────
 *
 * A acao `delete` do painel tem mensagens proprias, diferentes das de `trash`:
 * nenhuma delas fala em lixeira, e o 410 dela diz *"already been deleted"* no
 * lugar de *"no longer exists"*. `EC-05` fixa que *"o `msgid` em ingles E a
 * chave do catalogo"*, logo os textos ficam em ingles — traduzir trocaria a
 * chave do gettext.
 *
 * ⚠️ **O XML-RPC pede exclusao e recebe lixeira.** `wp.deletePost` chama
 * `wp_delete_post( $post_id )` **sem forca**
 * (`wp-includes/class-wp-xmlrpc-server.php:1886`): com a lixeira ligada, o
 * registro vai para `trash` e o cliente recebe `true` como se tivesse apagado. E
 * observavel por qualquer cliente XML-RPC e esta reproduzido no desfecho
 * `descartado-para-a-lixeira` de `apagar-em-definitivo.ts`.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { RecusaDoDescarte } from '../descarte/index.js';
import type { ContextoDeExclusao } from './contexto-de-exclusao.js';

/**
 * `delete_post` — **a mesma** meta-capacidade do descarte, com o identificador
 * do conteudo junto (`wp-admin/post.php:328`).
 *
 * Declarada aqui em lugar de importada de `permissao-de-descarte.ts` porque o P4
 * cobra a declaracao **da operacao**, e porque o nome da constante de la
 * ("descartar") afirmaria uma coisa que nao e verdade aqui. Que as duas sao o
 * mesmo byte e afirmado por teste, e e justamente o que esta tarefa descobriu.
 */
export const CAPACIDADE_DE_APAGAR: Capacidade = 'delete_post';

/**
 * A recusa, na mesma forma da de US-1: **valor, nao excecao** — no legado e um
 * `wp_die()` no painel e um `WP_Error` na API, e nenhum dos dois e excecao.
 */
export type RecusaDaExclusao = RecusaDoDescarte;

/**
 * O texto que o painel devolve a quem nao pode apagar
 * (`wp-admin/post.php:329`).
 *
 * **Nao fala em lixeira**, ao contrario do de `trash`: para esta acao descartar
 * e apagar sao o mesmo pedido com um sinalizador diferente.
 */
export const MENSAGEM_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL =
  'Sorry, you are not allowed to delete this item.';

/** **403**, cravado no `wp_die()` (`wp-admin/post.php:329`). */
export const CODIGO_HTTP_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL = 403;

/**
 * O texto do painel quando a linha **ja nao existe**, com **410**
 * (`wp-admin/post.php:320`).
 *
 * ⚠️ E outro texto que o da acao `trash` (*"The item you are trying to move to
 * the Trash no longer exists."*): aqui o legado afirma que o item **ja foi
 * apagado**, e nao que ele nao existe. Declarado e nao usado pela operacao, como
 * o par dele em `permissao-de-descarte.ts`: quem transforma silencio em tela e a
 * borda.
 */
export const MENSAGEM_DE_CONTEUDO_JA_APAGADO_NO_PAINEL =
  'This item has already been deleted.';

/** **410** — o numero que acompanha o texto acima (`wp-admin/post.php:320`). */
export const CODIGO_HTTP_DE_CONTEUDO_JA_APAGADO_NO_PAINEL = 410;

/**
 * O texto do painel quando o `wp_delete_post()` devolve falso, com **500**
 * (`wp-admin/post.php:337`).
 *
 * E o unico lugar do fluxo em que o desfecho `nao-apagado` aparece para alguem —
 * e, no legado, ele chega **depois** de as sete etapas terem acontecido.
 */
export const MENSAGEM_DE_FALHA_AO_APAGAR_NO_PAINEL =
  'Error in deleting the item.';

/** **500** — o numero do texto acima (`wp-admin/post.php:337`). */
export const CODIGO_HTTP_DE_FALHA_AO_APAGAR_NO_PAINEL = 500;

/**
 * O texto do par de anexo, com **500** (`wp-admin/post.php:333`).
 *
 * Esta aqui porque a acao `delete` do painel **separa** o anexo antes de chamar
 * qualquer coisa — `$force = ( ! MEDIA_TRASH )` e `wp_delete_attachment()`
 * (`:331`-`:334`) —, e quem montar a tela precisa dos dois textos. O
 * comportamento do anexo e decisao humana ja tomada (resposta 9); ver
 * {@link ExclusaoDeAnexoNaExclusao}.
 */
export const MENSAGEM_DE_FALHA_AO_APAGAR_ANEXO_NO_PAINEL =
  'Error in deleting the attachment.';

/**
 * `rest_user_cannot_delete_post` — o codigo que a API REST devolve **dentro** de
 * `delete_item()`, que e o caminho da exclusao com `force`
 * (`class-wp-rest-posts-controller.php:1125`-`:1130`).
 *
 * E o mesmo codigo que `permissao-de-descarte.ts` ja declarou como *"a segunda
 * pergunta"*: na API, descartar e apagar passam pelo **mesmo** metodo, e a
 * diferenca e o parametro `force`. O texto e
 * `MENSAGEM_DE_RECUSA_DE_EXCLUSAO` daquele arquivo, e o numero sai de
 * `codigoDeAutorizacaoExigida()` — 403 autenticado, 401 anonimo.
 */
export const CODIGO_DE_RECUSA_DE_EXCLUSAO_NA_API =
  'rest_user_cannot_delete_post';

/**
 * `rest_cannot_delete` com **500** — a falha da exclusao na API, que e outra
 * coisa que o `rest_cannot_delete` **da guarda de rota**
 * (`class-wp-rest-posts-controller.php:1176`-`:1180`).
 *
 * ⚠️ O mesmo codigo de erro, dois significados e dois numeros: na guarda e
 * *"nao pode"* com 401/403, aqui e *"nao deu"* com 500. Observavel por qualquer
 * cliente da API, e a area 1 da Decisao 2 compara a saida da REST **byte a byte,
 * com zero divergencia**.
 */
export const CODIGO_DE_FALHA_DE_EXCLUSAO_NA_API = 'rest_cannot_delete';

/** O texto do par acima (`class-wp-rest-posts-controller.php:1178`). */
export const MENSAGEM_DE_FALHA_DE_EXCLUSAO_NA_API =
  'The post cannot be deleted.';

/**
 * Se o ator do contexto pode apagar aquele conteudo —
 * `current_user_can( 'delete_post', $post_id )` (`wp-admin/post.php:328`).
 *
 * Devolve `null` quando autorizado, e a recusa **do painel** quando nao. Quem
 * construir a API REST ou o XML-RPC monta a recusa com as constantes declaradas
 * acima e com as de `permissao-de-descarte.ts`: os textos existem no legado e
 * nenhum deles e o default dos outros.
 */
export function autorizarExclusao(
  contexto: ContextoDeExclusao,
  conteudoId: number,
): RecusaDaExclusao | null {
  const podeApagar = perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_APAGAR,
    conteudoId,
  );

  if (podeApagar) {
    return null;
  }

  return {
    // O `wp_die()` do painel nao tem codigo de texto: so o numero e a mensagem.
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  };
}
