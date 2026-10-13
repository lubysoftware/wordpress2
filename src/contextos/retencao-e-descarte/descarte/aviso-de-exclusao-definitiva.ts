/**
 * **US-4** — *"avisar que apagar e irreversivel quando a lixeira esta
 * desligada"*: o que cada superficie diz ao ator **antes** de a exclusao
 * definitiva acontecer.
 *
 * Entrega de **T009** da feature `005-retencao-e-descarte`, e e tambem onde a
 * tarefa **para**: tres dos quatro criterios de US-4 sao comportamento do legado
 * e estao portados (CA-4.1 em `descartar-para-a-lixeira.ts` e
 * `lixeira-desligada.ts`, CA-4.3 e CA-4.4 em `acoes-de-descarte-na-tela.ts`).
 * **CA-4.2 nao e**, e a caixa abaixo e a razao.
 *
 * ┌─ PARADA: CA-4.2 PEDE CONFIRMACAO QUE O LEGADO NAO PEDE ──────────────────┐
 * │                                                                          │
 * │ **CA-4.2 de `spec.md` e o fluxo alternativo de UC-09 dizem coisas        │
 * │ opostas sobre o mesmo instante, e T009 NAO escolhe entre eles.**         │
 * │                                                                          │
 * │ CA-4.2 (REQ-050, `backlog/tests.md` UT-050-2): *"nesse caso a            │
 * │ confirmacao pedida ao ator diz, com estas palavras, que a acao nao tem   │
 * │ volta"*.                                                                 │
 * │                                                                          │
 * │ `.specify/use-cases/UC-09-descartar-conteudo-na-lixeira.md`, fluxo       │
 * │ alternativo *Lixeira desligada*, palavra por palavra: *"Apagar passa a   │
 * │ ser irreversivel, e o ator NAO e avisado da diferenca"*. A secao *O que  │
 * │ um porte precisa saber* do mesmo caso de uso repete: *"o mesmo botao,    │
 * │ dois comportamentos irreconciliaveis"*.                                  │
 * │                                                                          │
 * │ **A arvore analisada confirma UC-09 quanto a confirmacao, e nao          │
 * │ quanto ao botao.** O censo de `confirm(` em `wp-admin/js/` tem **uma**   │
 * │ ocorrencia de exclusao de conteudo do site, `showNotice.warn()`          │
 * │ (`wp-admin/js/common.js:548`), e ela tem **dois** chamadores — os dois   │
 * │ governados por `MEDIA_TRASH`, nunca por `EMPTY_TRASH_DAYS`:              │
 * │   · `wp-admin/includes/meta-boxes.php:477` (caixa do anexo)              │
 * │   · `wp-admin/includes/class-wp-media-list-table.php:835` (midia)        │
 * │ O caminho de CONTEUDO nao tem nenhum: o `submitdelete` do editor         │
 * │ (`meta-boxes.php:370`) e as duas acoes da linha                          │
 * │ (`class-wp-posts-list-table.php:1623` e `:1633`) sao links sem           │
 * │ `onclick`, e nao ha ouvinte de `.submitdelete` em nenhum `.js` do        │
 * │ painel. A acao em massa tambem nao confirma.                             │
 * │                                                                          │
 * │ E o legado **sabe** pedir confirmacao nessa mesma caixa: a tela de link  │
 * │ herdada poe `onclick="return confirm( ... )"` no proprio                 │
 * │ `submitdelete` (`meta-boxes.php:1137`). Logo a ausencia no conteudo nao  │
 * │ e limitacao tecnica: e o produto.                                        │
 * │                                                                          │
 * │ **Por que isto nao se resolve aqui.** Acrescentar a confirmacao e        │
 * │ acrescentar comportamento observavel que o original nao tem, e o **P1**  │
 * │ exige *"uma decisao humana registrada, citada no codigo que divergiu"*;  │
 * │ `pending_decisions.md` nao tem decisao sobre isto, `discard_log.md` nao  │
 * │ descarta nada desta historia e as cinco entradas de                      │
 * │ `screen_deviation_log.md` nao cobrem acrescentar dialogo a uma tela      │
 * │ (`DEV-001` e formato de spec, `DEV-002` e captura, `DEV-003` a `005`     │
 * │ sao outras telas). Nao acrescentar deixa CA-4.2 e UT-050-2 falsos. As    │
 * │ duas fontes sao humanas e estao em sentidos opostos, que e exatamente o  │
 * │ caso que a constituicao poe na tabela *Nao negociavel*.                  │
 * │                                                                          │
 * │ **E a mesma forma do bloqueio de T019 da feature `002`** (US-9 pede      │
 * │ aviso que UC-07 nega): o ledger de T009 fica **aberto**, e quem decidir  │
 * │ encontra aqui os dois textos que o legado ja tem para isto —             │
 * │ {@link CONFIRMACAO_DE_EXCLUSAO_DE_MIDIA} e                               │
 * │ {@link confirmacaoDeExclusaoDeLink}. Nao e preciso inventar frase nova,  │
 * │ e nao e deste agente ligar nenhuma das duas ao conteudo.                 │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ---
 *
 * # O que o ator REALMENTE recebe, superficie por superficie
 *
 * | superficie | antes da exclusao definitiva | linha |
 * |---|---|---|
 * | editor | o rotulo muda para `Delete permanently`, e **nada mais** | `meta-boxes.php:365` |
 * | linha da lista | o rotulo muda para `Delete Permanently`, e **nada mais** | `class-wp-posts-list-table.php:1638` |
 * | acao em massa | o rotulo muda para `Delete permanently`, e **nada mais** | `class-wp-posts-list-table.php:446` |
 * | API REST, `DELETE` **sem** `force` | **recusa**, com `501` e *"The post does not support trashing. Set 'force=true' to delete."* | `class-wp-rest-posts-controller.php:1148`-`:1154` |
 * | API REST, `DELETE` **com** `force` | nada: apaga, e devolve o registro em `previous` | `:1136`-`:1145` |
 *
 * ⚠️ **A unica superficie que para e a API, e ela nao para por irreversibilidade:
 * para por falta de suporte a lixeira.** O texto nao fala em "nao tem volta" —
 * ele ensina o parametro. E uma recusa de `501 Not Implemented`, e e o mais perto
 * que o legado chega de CA-4.2 **sem ser** CA-4.2: o cliente que repete o pedido
 * com `force=true` apaga em definitivo sem ver mais nenhuma mensagem.
 *
 * ⚠️ **E e por causa dessa recusa que o prazo negativo e observavel na API** mesmo
 * com o painel descartando normalmente: `$supports_trash` e
 * `EMPTY_TRASH_DAYS > 0` (`:1099`), nao `! EMPTY_TRASH_DAYS`. Ver
 * `lixeira-desligada.ts`.
 */

import type { PrazoDeRetencao } from '../configuracao/index.js';
import { lixeiraSuportadaNaApi } from './lixeira-desligada.js';

/** As superficies que podem pedir o descarte de um conteudo, no legado. */
export type SuperficieDoDescarte =
  /** A caixa de publicacao do editor (`wp-admin/includes/meta-boxes.php:361`). */
  | 'painel-editor'
  /** A linha da lista (`class-wp-posts-list-table.php:1613`). */
  | 'painel-linha-da-lista'
  /** A acao em massa da lista (`class-wp-posts-list-table.php:432`). */
  | 'painel-acao-em-massa'
  /** `DELETE /wp/v2/{tipo}/{id}` (`class-wp-rest-posts-controller.php:1090`). */
  | 'api-rest'
  /** `wp.deletePost` (`class-wp-xmlrpc-server.php:1860`). */
  | 'xml-rpc';

/**
 * **CA-4.2, como o legado responde hoje: nenhuma superficie de conteudo pede
 * confirmacao.**
 *
 * As cinco entradas sao `null`, e cada `null` e uma leitura, nao uma omissao —
 * ver a caixa de PARADA do cabecalho para o censo de `confirm(` que as sustenta.
 * A tabela existe **como dado** para que a ausencia seja afirmavel por teste, do
 * mesmo jeito que `armazenamento/porta-falsa.ts` registra comando para que
 * *"nenhum comando"* seja afirmavel.
 *
 * 🔴 **Se a decisao humana que falta disser que a confirmacao deve existir**,
 * e aqui que ela entra — uma entrada por superficie que a pede, com a linha do
 * legado ou a referencia a resposta que autorizou (P1). Enquanto a decisao nao
 * existir, mudar qualquer valor desta tabela e divergir sem registro.
 */
export const CONFIRMACAO_PEDIDA_AO_ATOR: Readonly<
  Record<SuperficieDoDescarte, string | null>
> = Object.freeze({
  'painel-editor': null,
  'painel-linha-da-lista': null,
  'painel-acao-em-massa': null,
  'api-rest': null,
  'xml-rpc': null,
});

/*
  ── AS DUAS CONFIRMACOES QUE O LEGADO PEDE EM OUTRAS TELAS ───────────────────

  Literais, com a condicao que as liga. **Declaradas e nao usadas**, pela mesma
  postura de `MENSAGEM_DE_CONTEUDO_INEXISTENTE_NO_PAINEL` em
  `permissao-de-descarte.ts`: sao os textos que quem decidir CA-4.2 iria
  procurar, e sem eles a decisao inventaria frase que o produto nao tem.
  **Nenhuma das duas esta ligada ao conteudo, e ligar uma delas e a decisao que
  falta** — nao e deste agente.

  | texto | quem o mostra | condicao | linha |
  |---|---|---|---|
  | de midia | caixa do anexo e lista de midia | `! MEDIA_TRASH` | `common.js:548`, chamada em `meta-boxes.php:477` e `class-wp-media-list-table.php:835` |
  | de link | a tela de link herdada | `action=edit` e `manage_links` | `meta-boxes.php:1137` |
*/

/**
 * `wp-admin/js/common.js:548` — o **unico** texto do legado que diz, com estas
 * palavras, que a acao nao tem volta. Governado por `MEDIA_TRASH`, **nunca** por
 * `EMPTY_TRASH_DAYS`.
 *
 * O `\n` e literal: e um `window.confirm()`, nao HTML.
 *
 * ⚠️ **Este texto contradiz BR-MIGRAR-032 e a resposta 9, que dizem que apagar
 * midia e *"definitivo, sem lixeira e sem aviso"*.** Sem lixeira, sim; **sem
 * aviso, nao**: o aviso e justamente o unico que o legado tem, e e a frase que
 * CA-4.2 descreve. A contradicao e de REQ-051, que esta `bloqueado`, e fica
 * registrada aqui porque foi esta tarefa que a encontrou.
 */
export const CONFIRMACAO_DE_EXCLUSAO_DE_MIDIA =
  "You are about to permanently delete these items from your site.\nThis action cannot be undone.\n'Cancel' to stop, 'OK' to delete.";

/**
 * `wp-admin/includes/meta-boxes.php:1137` — a confirmacao da tela de link
 * herdada, com o nome do link interpolado. Prova que a caixa de publicacao
 * **sabe** confirmar, e que no conteudo ela nao confirma por decisao do produto.
 */
export function confirmacaoDeExclusaoDeLink(nomeDoLink: string): string {
  return `You are about to delete this link '${nomeDoLink}'\n  'Cancel' to stop, 'OK' to delete.`;
}

/**
 * `rest_trash_not_supported`
 * (`class-wp-rest-posts-controller.php:1150`).
 */
export const CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API = 'rest_trash_not_supported';

/**
 * O texto da recusa, com `force=true` ja interpolado — no legado o `%s` e o
 * literal `'force=true'`, passado como argumento do `sprintf`
 * (`class-wp-rest-posts-controller.php:1152`).
 */
export const MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API =
  "The post does not support trashing. Set 'force=true' to delete.";

/**
 * **501** (`class-wp-rest-posts-controller.php:1153`).
 *
 * E o unico `501` deste modulo, e ele e cravado: nao passa por
 * `rest_authorization_required_code()`, porque nao e recusa de autorizacao.
 */
export const CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API = 501;

/**
 * O nome do ponto de extensao que decide se o tipo suporta lixeira na API —
 * **contrato publico (P2)**, com o nome dinamico que o legado monta
 * (`class-wp-rest-posts-controller.php:1123`):
 *
 * ```php
 * $supports_trash = apply_filters( "rest_{$this->post_type}_trashable", $supports_trash, $post );
 * ```
 *
 * Argumentos `(suporta, post)`, e a posicao e **depois** da leitura da constante
 * e **antes** da pergunta de capacidade (`:1124`). O bloco de documentacao do
 * legado e explicito sobre o poder dele: *"Pass false to disable Trash support
 * for the post"* — e passar `true` **liga** a lixeira na API de uma instalacao
 * com o prazo em zero, caso em que o `DELETE` sem `force` chama
 * `wp_trash_post()`, que apaga em definitivo na primeira linha. O P2 manda
 * preservar inclusive essa capacidade de alterar o resultado.
 *
 * O gemeo do comentario e `rest_comment_trashable`
 * (`class-wp-rest-comments-controller.php:1083`), e la a constante ja vem
 * **dentro** da chamada do filtro.
 */
export function ganchoDeSuporteALixeiraNaApi(tipoDeConteudo: string): string {
  return `rest_${tipoDeConteudo}_trashable`;
}

/** A recusa da API ao pedido de descarte que ela nao suporta, como valor. */
export interface RecusaDeLixeiraNaoSuportada {
  readonly codigo: typeof CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API;
  readonly mensagem: typeof MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API;
  readonly codigoHttp: typeof CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API;
}

/**
 * **A unica parada do legado antes da exclusao definitiva** — o ramo
 * `! $supports_trash` de `delete_item()`
 * (`class-wp-rest-posts-controller.php:1146`-`:1155`).
 *
 * Devolve a recusa quando o pedido **nao** forca e a API nao reconhece lixeira
 * neste prazo, e `null` em todos os outros casos — inclusive quando o pedido
 * forca, que e o caminho em que a API apaga em definitivo **sem dizer nada**
 * (`:1136`).
 *
 * `suporteDeExtensao` e o valor que o filtro
 * {@link ganchoDeSuporteALixeiraNaApi} devolveu, quando alguem o interceptou:
 * ele **substitui** a leitura da constante, nos dois sentidos (ver o bloco de
 * documentacao citado ali). Ausente, vale a constante.
 */
export function recusaDeLixeiraNaoSuportadaNaApi(
  prazo: PrazoDeRetencao,
  pedido: {
    readonly forcar: boolean;
    readonly suporteDeExtensao?: boolean;
  },
): RecusaDeLixeiraNaoSuportada | null {
  if (pedido.forcar) {
    return null;
  }

  const suporta = pedido.suporteDeExtensao ?? lixeiraSuportadaNaApi(prazo);
  if (suporta) {
    return null;
  }

  return {
    codigo: CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
    mensagem: MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
    codigoHttp: CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  };
}
