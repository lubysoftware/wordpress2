/**
 * A autorizacao de quem revisa o texto de **outra pessoa**: a **soma** da
 * capacidade de mexer no alheio com a que o estado do conteudo exige
 * (**CA-8.1**), a familia de capacidade que o conteudo hierarquico resolve
 * (**CA-8.5**) e a capacidade da funcao especial declarada (**CA-8.6**).
 *
 * Entrega de **T017** da feature `002-autoria-e-publicacao` (US-8). E a
 * declaracao de permissao que o **P4** cobra de *"toda operacao exposta"*, e
 * aqui ela e a do contrato de `plan.md`: a operacao *"revisar e publicar de
 * outro autor"* tem como erro *"sem permissao sobre conteudo de outro"*.
 *
 * ---
 *
 * # A autorizacao de UC-07 e uma soma, e a soma e a regra
 *
 * > **Autorizacao:** `edit_others_posts`, somada a `edit_published_posts` quando
 * > o conteudo ja esta publicado e a `edit_private_posts` quando esta privado.
 * > E o salto de papel que significa "pode mexer no que nao e seu"
 * > — [UC-07](../../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md)
 *
 * A pergunta que a operacao faz e **uma**: `edit_post` com o objeto
 * (`wp-admin/includes/post.php:294`). A soma nao e feita aqui — ela e o que a
 * **traducao** devolve, no ramo do alheio de `map_meta_cap()`
 * (`wp-includes/capabilities.php:266`-`:275`):
 *
 * ```php
 * // The user is trying to edit someone else's post.
 * $caps[] = $post_type->cap->edit_others_posts;
 * // The post is published or scheduled, extra cap required.
 * if ( in_array( $post->post_status, array( 'publish', 'future' ), true ) ) {
 *     $caps[] = $post_type->cap->edit_published_posts;
 * } elseif ( 'private' === $post->post_status ) {
 *     $caps[] = $post_type->cap->edit_private_posts;
 * }
 * ```
 *
 * E `PERM-1` fecha o sentido do verbo *somar*: e preciso ter **todas** as
 * capacidades devolvidas, nao qualquer uma — a comparacao esta em
 * `plataforma/autorizacao/decisao-de-capacidade.ts`, passo 7.
 *
 * Por isso {@link capacidadesDaEdicaoDesteConteudo} existe **alem** de
 * {@link autorizarRevisaoEditorial}: o criterio CA-8.1 nao e sobre o booleano,
 * e sobre a **lista**, e a lista e o que os tres criterios de capacidade desta
 * historia distinguem um do outro.
 *
 * | criterio | o que muda na lista |
 * |---|---|
 * | **CA-8.1** *soma o alheio ao exigido pelo estado* | **dois** nomes para o conteudo publicado de outra pessoa, **um** para o rascunho dela |
 * | **CA-8.5** *o hierarquico resolve em familia distinta* | os mesmos slots devolvem `edit_others_pages` e `edit_published_pages` |
 * | **CA-8.6** *a funcao especial exige a capacidade dela* | um **terceiro** nome entra, e ele nao e da familia do tipo |
 *
 * ---
 *
 * # Os 86 casos nao sao desta tarefa, e nenhum deles se reescreve aqui
 *
 * A resolucao por autoria e por estado e **T017 da feature 001**, em
 * `plataforma/autorizacao/traducao-de-conteudo.ts` — e era uma das duas ancoras
 * que `spec.md` da para US-8 (`wp-includes/capabilities.php:149` e `:113`). O
 * que faltava era a **operacao**, e e ela que esta nesta pasta. Reimplementar a
 * traducao aqui produziria duas derivacoes da mesma regra, e a segunda
 * divergiria da primeira — o mesmo motivo pelo qual `contexto-de-revisao.ts`
 * reusa o tipo de conteudo de `plataforma/autorizacao/` em lugar de declarar um
 * gemeo.
 *
 * Do mesmo modo, as **duas perguntas** que T015 ja portou — o portao de
 * `edit_post` (`:294`-`:300`) e o portao de autoria alheia (`:88`-`:105`) — sao
 * reusadas de `../revisao/permissao-de-revisao.ts` e **nao** reescritas: no
 * legado sao as mesmas linhas, na mesma funcao, e quem submete o proprio texto e
 * quem revisa o de outra pessoa passam pelas duas. O que esta tarefa acrescenta
 * e a **leitura da lista**, o par de codigos que a superficie de atualizacao da
 * API declara e o nome da operacao.
 *
 * ---
 *
 * # 🔴 Uma divergencia entre UC-07 e o codigo do legado, registrada e NAO resolvida aqui
 *
 * **UC-07 atribui a edicao uma protecao que, no legado, so existe na exclusao.**
 *
 * - UC-07, tabela de excecoes: *"O conteudo e a pagina inicial ou a pagina de
 *   posts | exige `manage_options`, que o editor nao tem: o editor nao consegue
 *   editar a pagina inicial"*, repetido em *O que um porte precisa saber* como
 *   *"🟢 O editor nao edita a pagina inicial"*.
 * - `wp-includes/capabilities.php`: o ramo que troca a familia por
 *   `manage_options` para `page_for_posts` e `page_on_front` esta **somente** no
 *   `case 'delete_post'` (`:113`-`:118`). O `case 'edit_post'` (`:188`-`:285`)
 *   **nao tem esse ramo**: ele vai do objeto inexistente direto para a revisao,
 *   o tipo, a dispensa de traducao, a autoria e o estado, e termina na pagina de
 *   politica de privacidade (`:282`). BR-MIGRAR-091 diz *"pagina inicial e
 *   pagina de posts exigem `manage_options`"* sem nomear o verbo, e ancora
 *   justamente `capabilities.php:113` — a linha da exclusao.
 *
 * `plataforma/autorizacao/traducao-de-conteudo.ts` (T017 da feature 001) aplica o
 * ramo aos **dois** verbos: ele esta em `resolverPorAutoriaEEstado()`, que
 * `edicaoOuExclusao()` chama tanto para a familia de edicao quanto para a de
 * exclusao. Nesta arvore, portanto, editar a pagina inicial exige
 * `manage_options`, e no sistema analisado nao exige.
 *
 * **Esta tarefa nao resolve isso, e nao pode.** Mudar aquele arquivo e mudar
 * regra de negocio documentada (`BR-MIGRAR-091`) e entrega de outra tarefa, e a
 * tabela [Nao negociavel](../../../../memory/constitution.md) poe *"mudar regra
 * de negocio documentada em `domain.md`"* entre o que o agente de codificacao
 * **nao decide sozinho**. O que esta tarefa faz e o que o **P1** manda fazer com
 * uma divergencia sem decisao humana: registra-la onde quem decide a encontre, e
 * **nao** apoiar nenhum criterio dela. Por isso **CA-8.6 e cumprido pela pagina
 * de politica de privacidade**, que e a funcao especial que o `case 'edit_post'`
 * do legado **tem** (`:282`) — e cuja capacidade, `manage_privacy_options`,
 * resolve em `manage_options` fora da rede (BR-MIGRAR-042) e e exatamente *"a
 * capacidade dessa funcao, que o papel editorial pode nao ter"*.
 */

import {
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import {
  CAPACIDADE_DE_EDITAR_ESTE_CONTEUDO,
  autorizarSubmissao,
  type ContextoDeRevisao,
  type RecusaDaRevisao,
} from '../revisao/index.js';

/**
 * `rest_cannot_edit_others` — o codigo que a **API** devolve quando quem
 * atualiza informa um autor que nao e ele e nao tem `edit_others_posts`
 * (`class-wp-rest-posts-controller.php:911`).
 *
 * E o par do que T015 declarou para o painel
 * (`CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA`, que no painel **e** o nome da
 * capacidade). Entra nesta tarefa porque *"sem permissao sobre conteudo de
 * outro"* e o erro que o contrato de `plan.md` declara para **esta** operacao, e
 * porque a superficie que declara codigo e estado HTTP para ele e a API.
 */
export const CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_NA_API = 'rest_cannot_edit_others';

/**
 * `Sorry, you are not allowed to update posts as this user.` — o texto da API
 * para **atualizar** (`:912`).
 *
 * ⚠️ **Nao e o mesmo texto da criacao**, que diz `create` em lugar de `update`
 * (`:701`), nem o do painel, que diz `edit` (`wp-admin/includes/post.php:96`).
 * Sao tres frases para a mesma recusa, uma por superficie e por verbo, e `EC-05`
 * fixa que *"o `msgid` em ingles E a chave do catalogo"* — logo traduzir aqui
 * trocaria a chave.
 */
export const MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_NA_API =
  'Sorry, you are not allowed to update posts as this user.';

/**
 * A base da pergunta, com o caso de traducao de conteudo acrescentado no fim.
 *
 * Terceira ocorrencia da mesma costura, com a mesma justificativa que
 * `../gravacao/permissao-do-identificador.ts` e `../revisao/permissao-de-revisao.ts`
 * registram: no legado os 86 `case` de `map_meta_cap()` sao **embutidos** e
 * perguntar `edit_post` sempre resolve; nesta arvore a lista chega por
 * `BaseDeAutorizacao.casosDeTraducao`, e uma composicao que a esquecesse faria a
 * traducao devolver a cadeia `edit_post` crua — que papel algum concede, logo
 * **negaria toda revisao, inclusive a de um administrador**. O caso entra **no
 * fim**, onde nao desloca nenhum que a base ja traga.
 */
function baseComCasoDeConteudo(contexto: ContextoDeRevisao): BaseDeAutorizacao {
  const caso =
    contexto.avisarUsoIndevido === undefined
      ? casoDeConteudo(contexto.fonteDeConteudo)
      : casoDeConteudo(contexto.fonteDeConteudo, contexto.avisarUsoIndevido);

  return {
    ...contexto.base,
    casosDeTraducao: [...(contexto.base.casosDeTraducao ?? []), caso],
  };
}

/**
 * **CA-8.1, CA-8.5 e CA-8.6**: a **lista** de capacidades primitivas que editar
 * aquele conteudo exige — o `map_meta_cap( 'edit_post', $user_id, $post_id )` do
 * legado (`wp-includes/capabilities.php:188`).
 *
 * E a mesma traducao que {@link autorizarRevisaoEditorial} consulta por dentro,
 * exposta como **valor** porque e sobre o valor que os tres criterios falam:
 * *"a autorizacao **soma** a capacidade de mexer em conteudo alheio a capacidade
 * exigida pelo estado"* (CA-8.1), *"resolve numa **familia** distinta"* (CA-8.5)
 * e *"**exige** a capacidade dessa funcao"* (CA-8.6). Perguntar so o booleano
 * tornaria os tres indistinguiveis de *"o ator nao tem a capacidade"*.
 *
 * ⚠️ **A ordem da lista e a do legado e nao se ordena.** `$caps[]` empilha na
 * ordem dos ramos — o do alheio primeiro, o do estado depois, a funcao especial
 * por ultimo (`array_merge`, `:283`) —, e a area 2 da Decisao 2 compara *"valor
 * devolvido por hook byte a byte"*: o interceptador de `map_meta_cap` recebe
 * esta lista e um porte que a ordenasse mudaria o que ele le.
 *
 * ⚠️ **Nao e um portao.** Devolver lista nao autoriza nem recusa nada: quem
 * compara e `perguntarPermissao()`, e **lista vazia significa permitido**
 * (`PERM-6`). Esta funcao existe para ser lida, inclusive por quem precise
 * mostrar na tela o que falta.
 */
export function capacidadesDaEdicaoDesteConteudo(
  contexto: ContextoDeRevisao,
  conteudoId: number,
): readonly Capacidade[] {
  return capacidadesExigidas(
    comAtor(baseComCasoDeConteudo(contexto), contexto.ator),
    CAPACIDADE_DE_EDITAR_ESTE_CONTEUDO,
    conteudoId,
  );
}

/**
 * **O portao desta operacao** — `current_user_can( 'edit_post', $post_id )`
 * (`wp-admin/includes/post.php:294`-`:300`).
 *
 * Devolve `null` quando autorizada, e a recusa como **valor** quando nao: mesma
 * forma de T003, de T015 e de `administracao-de-contas/`, e e o que `plan.md`
 * fixa — *"erro e devolvido como valor, nao como excecao: e assim no legado e e
 * o que permite a um ponto de extensao inspecionar a falha"*.
 *
 * **E a mesma funcao que T015 portou, e por isso ela e chamada e nao copiada.**
 * No legado o portao de `edit_post()` e **um** `if`, e as duas historias entram
 * por ele: UC-06 por quem submete o proprio texto, UC-07 por quem abre o texto
 * de outra pessoa. A diferenca entre as duas nao esta no portao — esta no que a
 * **traducao** devolve, porque ela resolve por autoria (`:250` contra `:266`), e
 * nisso esta tarefa nao toca. Um segundo portao aqui seria uma segunda leitura
 * da mesma linha, e as duas divergiriam na primeira correcao.
 *
 * O que esta funcao acrescenta ao que ela chama e o **nome**: no contrato de
 * `plan.md` o erro desta operacao e *"sem permissao sobre conteudo de outro"*, e
 * e por este portao que ele sai — porque, para o conteudo de outra pessoa, a
 * lista traduzida comeca por `edit_others_posts` daquele tipo.
 */
export function autorizarRevisaoEditorial(
  contexto: ContextoDeRevisao,
  conteudo: Conteudo,
): RecusaDaRevisao | null {
  return autorizarSubmissao(contexto, conteudo);
}
