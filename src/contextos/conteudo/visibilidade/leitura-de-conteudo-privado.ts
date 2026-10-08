/**
 * **CA-4.2** e **CA-4.3**: o conteudo privado exige, para leitura, a capacidade
 * de ler conteudo privado — e o visitante anonimo recebe a mesma resposta que
 * receberia para conteudo inexistente.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). Os dois
 * criterios sao **um** portao do legado lido de duas alturas, e a ordem entre as
 * duas e a regra:
 *
 * | # | o que decide | onde | criterio |
 * |---|---|---|---|
 * | 1 | `! is_user_logged_in()` esvazia o resultado | `wp-includes/class-wp-query.php:3539`-`:3541` | CA-4.3 |
 * | 2 | `current_user_can( 'read_post', $post->ID )` | `wp-includes/class-wp-query.php:3553`-`:3556` | CA-4.2 |
 * | 3 | `read_post` resolve em `read_private_posts` | `wp-includes/capabilities.php:376`-`:377` | CA-4.2 |
 *
 * ---
 *
 * # O portao do legado, transcrito
 *
 * `WP_Query::get_posts()`, no bloco *"Check post status to determine if post
 * should be displayed"* (`class-wp-query.php:3524`-`:3566`):
 *
 * ```php
 * if ( $post_status_obj && ! $post_status_obj->public ) {
 *     if ( ! is_user_logged_in() ) {
 *         // User must be logged in to view unpublished posts.
 *         $this->posts = array();
 *     } else {
 *         if ( $post_status_obj->protected ) { ... }
 *         elseif ( $post_status_obj->private ) {
 *             if ( ! current_user_can( $read_cap, $this->posts[0]->ID ) ) {
 *                 $this->posts = array();
 *             }
 *         } else { $this->posts = array(); }
 *     }
 * }
 * ```
 *
 * com `$read_cap = 'read_post'` (`:2639`). **O resultado da negacao e um
 * conjunto vazio, nao um erro**: a consulta passa a nao ter nenhum registro, e
 * quem decide a resposta a partir disso e `WP::handle_404()`
 * (`wp-includes/class-wp.php:724`) — e e por isso que *"a mesma resposta que
 * receberia para conteudo inexistente"* e literalmente a mesma resposta, e nao
 * uma resposta parecida: as duas chegam ao mesmo `handle_404()` com o mesmo
 * conjunto vazio, e nada no caminho distingue *"nao existe"* de *"existe e voce
 * nao pode"*.
 *
 * ## A dupla negacao e do legado, e as duas ficam
 *
 * Para o ator anonimo os dois ramos negam: o passo 1 nega por nao haver sessao,
 * e o passo 2 negaria de qualquer forma, porque `read_private_posts` nao e
 * concedida a ninguem sem papel. Reproduzir **so** o passo 2 daria o mesmo
 * resultado hoje e **nao** e o que o legado faz: o passo 1 vem antes, nao olha
 * capacidade nenhuma, e vale para todo estado nao publico. Um porte que o
 * removesse estaria apostando que nenhuma extensao concede
 * `read_private_posts` ao ator anonimo pelo ponto `user_has_cap` — e o ponto
 * existe, recebe o ator e pode conceder (`PERM-1`, BR-MIGRAR-087). Com o passo
 * 1 no lugar, conceder a capacidade ao anonimo **nao** abre o conteudo privado,
 * que e o comportamento do legado.
 *
 * ---
 *
 * # CA-4.2 nao se reimplementa aqui: ela ja esta na plataforma
 *
 * A resolucao `read_post` -> `read_private_posts` e o `case 'read_post'` de
 * `map_meta_cap()` (`wp-includes/capabilities.php:287`-`:381`), e ela foi
 * portada por **T017 da feature 001** em
 * `plataforma/autorizacao/traducao-de-conteudo.ts`, com os cinco ramos na ordem
 * do legado:
 *
 * 1. objeto ausente ou inexistente -> `do_not_allow` (`:289`-`:312`);
 * 2. revisao -> segue para o conteudo pai (`:314`-`:320`);
 * 3. tipo nao registrado -> `edit_others_posts`, com aviso (`:322`-`:338`);
 * 4. estado nao registrado -> `edit_others_posts`, com aviso (`:351`-`:367`);
 * 5. estado publico -> `read` do tipo; autor -> `read` do tipo; **estado privado
 *    -> `read_private_posts` do tipo**; o resto -> a resolucao de **edicao**
 *    (`:369`-`:381`).
 *
 * Esta tarefa **pergunta** por `read_post` e deixa a plataforma traduzir, em
 * lugar de perguntar direto por `read_private_posts`. Nao e preferencia de
 * estilo: `PERM-3` (BR-MIGRAR-089) e literal — *"capacidade sobre objeto nao e
 * verificada direto: e traduzida... nenhuma das 104 chamadas pergunta por
 * `edit_post`: todas perguntam pelo que o mapeamento devolveu"*. Perguntar
 * direto pela capacidade privada perderia de uma vez o ramo do autor (quem
 * escreveu le o proprio privado com `read`, sem `read_private_posts`), o ramo da
 * revisao e os dois ramos de degradacao — e o ramo do autor e observavel por
 * qualquer autor que torne o proprio conteudo privado.
 *
 * O **slot** e `read_private_posts` e o nome efetivo sai do registro do tipo, de
 * modo que ler uma pagina privada exige `read_private_pages` sem um unico `if`
 * sobre o nome `page`.
 *
 * ---
 *
 * # Quem serve a resposta nao e esta tarefa, e esta declarado
 *
 * `handle_404()`, o modelo de erro do tema e o codigo HTTP 404 sao da feature
 * **004** (`contextos/leitura-publica/`), cuja US-4 cobra a mesma invariante da
 * outra ponta — *"para quem nao tem a permissao, a resposta e indistinguivel da
 * de conteudo inexistente"* (CA-4.4 de lá) — e cuja US-5 CA-5.3 a repete
 * (*"a resposta nao vaza se o conteudo existe em estado nao publico"*). A regra
 * de dependencia 3 proibe `contextos/<a>/` importar `contextos/<b>/` *"sempre,
 * sem excecao"*, logo aquele contexto **nao** consome esta funcao: ele monta o
 * mesmo portao sobre a mesma `plataforma/autorizacao/`. O que esta aqui e a
 * decisao do ponto de vista de BC-01, que e o dono do estado e de quem o le por
 * identificador — o `check_read_permission()` da API REST
 * (`class-wp-rest-posts-controller.php:1784`) percorre a mesma pergunta.
 *
 * ⚠️ **A API REST nao devolve 404 neste caminho, e isso nao contradiz CA-4.3.**
 * Ali a negacao e `rest_forbidden` com 401 ou 403, porque o controlador ja
 * respondeu 404 (`rest_post_invalid_id`) para identificador inexistente — logo
 * naquela superficie as duas respostas **sao** distinguiveis, e sempre foram.
 * CA-4.3 descreve o **site publico**, que e onde o legado as torna iguais. A
 * diferenca entre as duas superficies e do legado e esta reproduzida ao nao ser
 * uniformizada aqui.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDeLeituraDeConteudo } from './contexto-de-visibilidade.js';

/**
 * `read_post` — o nome **pedido**, e nao o exigido.
 *
 * `$read_cap = 'read_post'` em `wp-includes/class-wp-query.php:2639`, e
 * `check_read_permission()` da API usa a mesma cadeia
 * (`class-wp-rest-posts-controller.php:1791`). E uma meta-capacidade: ninguem a
 * tem concedida, e a resposta vem do que `map_meta_cap()` devolveu.
 */
export const CAPACIDADE_DE_LEITURA_PEDIDA: Capacidade = 'read_post';

/**
 * `read_private_posts` — o **slot** em que `read_post` resolve quando o estado
 * do conteudo e privado (`wp-includes/capabilities.php:377`).
 *
 * Declarado aqui porque e o nome que CA-4.2 cita — *"a capacidade de ler
 * conteudo privado"* —, e **nao** porque esta tarefa o pergunte: a traducao e de
 * `plataforma/autorizacao/traducao-de-conteudo.ts`, que o tem como
 * `SLOT_DE_LEITURA_PRIVADA` (nao exportado, porque ninguem de fora o pergunta).
 * A suite de T009 afirma o valor pelo comportamento: a traducao de `read_post`
 * sobre uma linha privada devolve exatamente o nome que o registro do tipo tem
 * neste slot.
 */
export const SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO = 'read_private_posts';

/**
 * Os dois desfechos, e o nome do segundo e a regra.
 *
 * Nao se chama `recusado` de proposito: no legado nao ha recusa nenhuma neste
 * caminho — ha um conjunto de resultados que fica **vazio**, e e a ausencia de
 * resultado que produz a resposta. Chamar isso de recusa convidaria quem
 * consumir esta decisao a servir uma mensagem de erro, e a mensagem seria a
 * confirmacao de que o conteudo existe.
 */
export type DesfechoDaLeituraDeConteudo =
  /** O registro segue no conjunto e e servido. */
  | 'servido'
  /** O conjunto ficou vazio: a resposta e a de conteudo inexistente (CA-4.3). */
  | 'indistinguivel-de-inexistente';

/**
 * **CA-4.2 e CA-4.3.** Decide se o conteudo privado daquele identificador e
 * servido ao ator do contexto.
 *
 * Os dois passos, na ordem do legado:
 *
 * 1. **sem sessao, conjunto vazio** (`class-wp-query.php:3539`-`:3541`), sem
 *    olhar capacidade nenhuma — ver *A dupla negacao* no cabecalho;
 * 2. **com sessao, `read_post` sobre o objeto**
 *    (`class-wp-query.php:3553`-`:3556`), que a plataforma traduz em
 *    `read_private_posts` do tipo — ou em `read`, quando quem pergunta e o
 *    autor.
 *
 * O identificador viaja como argumento da capacidade porque e assim que o
 * legado o passa: `current_user_can( $read_cap, $this->posts[0]->ID )`. A linha
 * de conteudo **nao** e lida aqui — quem a le e
 * `FonteDeConteudoNaAutorizacao.conteudo()`, dentro da traducao, como
 * `get_post( $args[0] )` dentro de `map_meta_cap()`. Ver o cabecalho de
 * `contexto-de-visibilidade.ts`.
 *
 * ⚠️ **Esta funcao e o portao do estado PRIVADO, e so dele.** Os outros ramos
 * do mesmo bloco do legado — estado protegido, que exige poder **editar** e
 * liga o modo de pre-visualizacao (`:3543`-`:3552`), e estado nao registrado
 * (`:3561`-`:3565`) — pertencem a US-4 da feature **004**, criterio CA-4.2 de
 * lá (*"conteudo em qualquer outro estado nao publico exige a capacidade de
 * edita-lo"*). Trazer os dois para ca produziria meia feature alheia dentro
 * desta, e o ramo de pre-visualizacao **reescreve `post_date` em memoria**
 * (`:3550`), que e comportamento de outra historia.
 */
export function decidirLeituraDeConteudoPrivado(
  contexto: ContextoDeLeituraDeConteudo,
  conteudoId: number,
): DesfechoDaLeituraDeConteudo {
  // Passo 1 (`:3539`-`:3541`): *"User must be logged in to view unpublished
  // posts."* A condicao do legado e `is_user_logged_in()`, que e
  // `wp_get_current_user()->exists()` — e e por isso que a leitura e de
  // `existe` e nao do identificador: o ator anonimo existe como objeto, com
  // `ID` 0 e `exists()` falso.
  if (!contexto.ator.existe) {
    return 'indistinguivel-de-inexistente';
  }

  // Passo 2 (`:3553`-`:3556`): CA-4.2. A traducao e da plataforma.
  return perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_LEITURA_PEDIDA,
    conteudoId,
  )
    ? 'servido'
    : 'indistinguivel-de-inexistente';
}
