/**
 * **CA-3.5**: a permissao de restaurar e decidida pelo estado anterior, gravado
 * no descarte.
 *
 * Entrega de **T007** (US-3). E a declaracao de permissao que o **P4** cobra, e
 * UC-10 a escreve na linha de autorizacao: *"`delete_post` do registro — restaurar
 * usa a mesma capacidade de descartar, resolvida pelo **estado anterior** lido dos
 * metadados"*.
 *
 * **Esta tarefa nao le o marcador para decidir, e isso e deliberado.** Quem o le e
 * a traducao de `delete_post` (`wp-includes/capabilities.php:153`-`:159`), ja
 * portada em `plataforma/autorizacao/traducao-de-conteudo.ts` por T017 da feature
 * `001`. O que esta aqui e a **pergunta**, com o objeto viajando nela.
 *
 * | quem pede | o que `delete_post` exige de um conteudo em `trash` | linha |
 * |---|---|---|
 * | o autor, estado anterior `publish` ou `future` | `delete_published_posts` | `:155`-`:156` |
 * | o autor, qualquer outro estado anterior, ou nenhum | `delete_posts` | `:158` |
 * | outra pessoa | `delete_others_posts`, **e so**: o marcador nao e lido | `:166`-`:172` |
 *
 * ⚠️ **A terceira linha limita CA-3.5.** O criterio vale para o conteudo do
 * proprio ator. Para o alheio o legado nao olha o estado anterior, e um conteudo
 * publicado de outra pessoa, na lixeira, exige **menos** do que exigia no ar:
 * `delete_published_posts` deixa de ser somada. A assimetria e do legado (P1).
 *
 * ── AS SUPERFICIES QUE RECUSAM ──────────────────────────────────────────────
 *
 * `wp_untrash_post()` nao verifica capacidade. Sao **quatro** os chamadores na
 * arvore, todos do painel — a API REST e o XML-RPC nao tem restauracao:
 *
 * | superficie | onde | ordem, e o que devolve a quem nao tem |
 * |---|---|---|
 * | acao `untrash` | `wp-admin/post.php:287` | conteudo, capacidade, e `wp_die( ..., 403 )` |
 * | em massa, conteudo | `wp-admin/edit.php:147` | so capacidade, com o mesmo texto e **sem numero** no `wp_die()` |
 * | em massa, midia | `wp-admin/upload.php:312` | idem |
 * | AJAX | `wp-admin/includes/ajax-actions.php:921` | capacidade **antes** do conteudo: `wp_die( -1 )`, sem texto |
 *
 * ⚠️ **A restauracao tem um portao a menos que o descarte:** a acao `trash` recusa
 * com 409 quando outra pessoa esta editando (`wp-admin/post.php:265`) e a acao
 * `untrash` nao chama `wp_check_post_lock()`. Nao acrescente.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { RecusaDoDescarte } from '../descarte/index.js';
import type { ContextoDeRestauracao } from './contexto-de-restauracao.js';

/**
 * `delete_post` — **a mesma** meta-capacidade do descarte, com o identificador do
 * conteudo junto (`wp-admin/post.php:298`).
 *
 * Declarada aqui pelo motivo de `CAPACIDADE_DE_APAGAR`: o P4 cobra a declaracao
 * **da operacao**. Nao existe `untrash_post` no legado.
 */
export const CAPACIDADE_DE_RESTAURAR: Capacidade = 'delete_post';

/** A recusa tem a forma da do descarte: `wp_die()` com texto e numero. */
export type RecusaDaRestauracao = RecusaDoDescarte;

/** O texto das tres superficies com texto (`wp-admin/post.php:299`). */
export const MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL =
  'Sorry, you are not allowed to restore this item from the Trash.';

/** **403, literal** (`wp-admin/post.php:299`). */
export const CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL = 403;

/**
 * O texto da acao `untrash` para o que nao existe mais
 * (`wp-admin/post.php:291`), com **410**.
 *
 * Declarado e nao usado aqui: a operacao devolve o desfecho `inexistente`, e quem
 * transforma isso em tela e a borda.
 */
export const MENSAGEM_DE_CONTEUDO_INEXISTENTE_NA_RESTAURACAO =
  'The item you are trying to restore from the Trash no longer exists.';

/** **410** (`wp-admin/post.php:291`). */
export const CODIGO_HTTP_DE_CONTEUDO_INEXISTENTE_NA_RESTAURACAO = 410;

/**
 * O texto de quando `wp_untrash_post()` devolve valor falso
 * (`wp-admin/post.php:303`), com **500**. Ver `restauradoNaVisaoDoChamador`.
 */
export const MENSAGEM_DE_FALHA_AO_RESTAURAR_NO_PAINEL =
  'Error in restoring the item from Trash.';

/** **500** (`wp-admin/post.php:303`). */
export const CODIGO_HTTP_DE_FALHA_AO_RESTAURAR_NO_PAINEL = 500;

/**
 * **CA-3.5.** Se o ator do contexto pode restaurar aquele conteudo.
 *
 * Devolve `null` quando autorizado, e a recusa da acao `untrash` quando nao.
 */
export function autorizarRestauracao(
  contexto: ContextoDeRestauracao,
  conteudoId: number,
): RecusaDaRestauracao | null {
  const podeRestaurar = perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_RESTAURAR,
    conteudoId,
  );

  if (podeRestaurar) {
    return null;
  }

  return {
    // O `wp_die()` do painel nao tem codigo de texto: so o numero e a mensagem.
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  };
}
