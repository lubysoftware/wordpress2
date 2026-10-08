/**
 * **CA-10.3**: *"Uma versao nao e editavel e nao e apagavel por permissao de
 * conteudo"*.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). E a
 * declaracao de permissao que o **P4** cobra das tres operacoes desta pasta, e e
 * o unico lugar dela: nenhuma funcao de `guardar-versao.ts` ou de
 * `restaurar-versao.ts` tem portao, porque nenhuma tem no legado.
 *
 * ---
 *
 * # As duas metades de CA-10.3 nao sao a mesma regra, e so uma e capacidade
 *
 * A tabela de rastreabilidade de `spec.md` da, para US-10,
 * `wp-includes/capabilities.php:108` — e aquela linha e **uma** das duas
 * metades. Lidos os tres casos de objeto do legado, a assimetria aparece:
 *
 * | caso pedido | o que o legado faz com uma linha de tipo `revision` | linha |
 * |---|---|---|
 * | `delete_post` / `delete_page` | **`do_not_allow`**, e para ali | `capabilities.php:108` |
 * | `edit_post` / `edit_page` | **segue para o conteudo pai** e resolve nele | `capabilities.php:215` |
 * | `read_post` / `read_page` | **segue para o conteudo pai** e resolve nele | `capabilities.php:314` |
 *
 * Isto e: **apagar** uma versao e negado pela capacidade — a todos, inclusive ao
 * super administrador, porque `do_not_allow` e o unico nome que o atalho de rede
 * nao vence (`PERM-9`, ADR-0009). Mas **editar** uma versao **nao** e negado
 * pela capacidade: a pergunta e respondida como se fosse sobre o conteudo pai, e
 * quem pode editar o conteudo *"pode editar"* a versao, no que a autorizacao
 * responde.
 *
 * `BR-MIGRAR-091` (`PERM-5`) registra so a metade de apagar — *"revisao nao se
 * apaga por capacidade"* —, e UC-07 repete a mesma metade na tabela de excecoes:
 * *"O conteudo e uma revisao → `do_not_allow` **para apagar**"*. Nada no pacote
 * diz que editar e negado.
 *
 * ## 🔴 Logo *"uma versao nao e editavel"* e verdade por OUTRO caminho
 *
 * O legado nao tem **superficie** que escreva numa linha de versao, e sao tres
 * recusas independentes:
 *
 * 1. **a API REST de versoes nao tem rota de escrita.** O controlador registra
 *    `READABLE` na colecao, e `READABLE` mais `DELETABLE` no item — e nenhuma
 *    rota de criacao ou de atualizacao
 *    (`class-wp-rest-revisions-controller.php:83`-`:140`);
 * 2. **`_wp_put_post_revision()` recusa versionar uma versao**, com texto:
 *    `Cannot create a revision of a revision` (`wp-includes/revision.php:366`).
 *    Esta esta implementada em `guardar-versao.ts`;
 * 3. **a restauracao escreve no pai, nunca na versao**: `$update['ID'] =
 *    $revision['post_parent']` (`:496`). Esta esta em `restaurar-versao.ts`.
 *
 * **Esta tarefa nao escolhe entre as duas leituras de CA-10.3, e nao precisa**,
 * porque as duas levam ao mesmo lugar: a versao nao e editada. O que ela faz e
 *
 * 1. **perguntar** `delete_post` a `plataforma/autorizacao/`, em vez de cravar
 *    aqui uma negacao — o que mantem a regra num lugar so e deixa o teste provar
 *    que ela chega (ver {@link autorizarExclusaoDeVersao});
 * 2. **nao** negar `edit_post` sobre a versao, porque negar fecharia o sistema
 *    mais que o legado e contradiria `capabilities.php:215`;
 * 3. **registrar a divergencia de redacao** para quem decide. O **P1** e
 *    literal: *"divergir exige uma decisao humana registrada, citada no codigo
 *    que divergiu"*, e nenhuma existe. Mesmo precedente de T003 com CA-1.1.
 *
 * ---
 *
 * # A capacidade e sobre o PAI, e nao sobre a versao
 *
 * As tres superficies de versao do legado perguntam pelo conteudo original, e
 * **nenhuma** pergunta pela versao ao decidir leitura ou restauracao:
 *
 * | superficie | onde | o que pergunta |
 * |---|---|---|
 * | API REST, listar | `class-wp-rest-revisions-controller.php:186` | `edit_post` do **pai** |
 * | API REST, apagar | `:466` e `:484` | `delete_post` do **pai** *e* `delete_post` da **versao** |
 * | Painel, restaurar | `wp-admin/revision.php:42` | `edit_post` do **pai** |
 * | Painel, comparar | `wp-admin/revision.php:97` | `read_post` da **versao** *e* `edit_post` do **pai** |
 * | XML-RPC, listar | `class-wp-xmlrpc-server.php:4753` | `edit_post` do **pai** |
 * | XML-RPC, restaurar | `:4836` | `edit_post` do **pai** |
 *
 * ⚠️ **A linha de apagar da API REST e o que torna CA-10.3 verificavel de fora**:
 * ela pergunta `delete_post` do pai — que um editor tem — e **depois**
 * `delete_post` da versao, que e `do_not_allow` para todos. Logo o endpoint de
 * exclusao de versao do legado **recusa sempre**, com 403, por mais poder que o
 * ator tenha. Nao e caminho morto por descuido: e o que a capacidade decide.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import { codigoDeAutorizacaoExigida } from '../publicacao/index.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';

/**
 * `edit_post` — a meta-capacidade que as superficies de versao perguntam sobre o
 * **conteudo pai**.
 *
 * E meta-capacidade, nao primitiva: ela passa pela traducao de objeto de
 * `casoDeConteudo()` (`plataforma/autorizacao/traducao-de-conteudo.ts`), que a
 * resolve por autoria e por estado — e e por isso que o identificador do objeto
 * **viaja** na pergunta. Sem ele, `BR-MIGRAR-091` manda a autorizacao devolver
 * `do_not_allow`.
 */
export const CAPACIDADE_DE_EDITAR_CONTEUDO: Capacidade = 'edit_post';

/** `read_post` — a meta-capacidade que a tela de comparacao pergunta da versao. */
export const CAPACIDADE_DE_LER_CONTEUDO: Capacidade = 'read_post';

/**
 * `delete_post` — a meta-capacidade que, **sobre uma versao**, e `do_not_allow`
 * (`capabilities.php:108`).
 */
export const CAPACIDADE_DE_APAGAR_CONTEUDO: Capacidade = 'delete_post';

/** O codigo HTTP que a recusa declara, ou `null` quando o legado nao declara nenhum. */
export type CodigoDeRecusaDeVersao = 401 | 403 | null;

/**
 * Uma recusa de operacao de versao, devolvida **como valor**.
 *
 * `plan.md` fixa a forma na secao *Contratos*: *"Erro e devolvido como valor,
 * nao como excecao: e assim no legado e e o que permite a um ponto de extensao
 * inspecionar a falha"*.
 *
 * ⚠️ **`codigo` e `null` quando a superficie do legado nao tem codigo de texto**,
 * e isso acontece de verdade: o XML-RPC devolve `IXR_Error( 401, $texto )`, que
 * carrega numero e mensagem e **nenhuma** cadeia de codigo — ao contrario do
 * `WP_Error( 'rest_cannot_delete', ... )` da API REST. Inventar um codigo para
 * ele seria inventar superficie.
 */
export interface RecusaDeVersao {
  readonly codigo: string | null;
  readonly mensagem: string;
  readonly codigoHttp: CodigoDeRecusaDeVersao;
}

/*
  ── OS TEXTOS SAO OS DO LEGADO, EM INGLES ───────────────────────────────────

  Mesma postura de `../publicacao/permissao-de-publicacao.ts`: `EC-05` fixa que
  *"o `msgid` em ingles E a chave do catalogo"*, logo traduzir trocaria a chave.
  Cada um foi lido na linha citada, e a conferencia byte a byte fecha contra o
  oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
*/

/** `rest_cannot_read` (`class-wp-rest-revisions-controller.php:188`). */
export const CODIGO_DE_RECUSA_DE_LEITURA_DE_VERSOES = 'rest_cannot_read';

/** O texto da recusa de listar versoes (`:189`). */
export const MENSAGEM_DE_RECUSA_DE_LEITURA_DE_VERSOES =
  'Sorry, you are not allowed to view revisions of this post.';

/** `rest_cannot_delete` (`class-wp-rest-revisions-controller.php:468` e `:486`). */
export const CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO = 'rest_cannot_delete';

/**
 * O texto da recusa de apagar **versoes deste conteudo** — a pergunta sobre o
 * pai (`class-wp-rest-revisions-controller.php:469`).
 */
export const MENSAGEM_DE_RECUSA_DE_EXCLUSAO_PELO_PAI =
  'Sorry, you are not allowed to delete revisions of this post.';

/**
 * O texto da recusa de apagar **esta versao** — a pergunta sobre a versao
 * (`class-wp-rest-revisions-controller.php:487`).
 *
 * ⚠️ **E este texto que todo pedido de exclusao de versao recebe**, porque a
 * segunda pergunta e `do_not_allow` para qualquer ator. O primeiro texto so
 * aparece para quem nao pode editar o conteudo.
 */
export const MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO =
  'Sorry, you are not allowed to delete this revision.';

/**
 * O texto que o XML-RPC devolve a quem nao pode restaurar
 * (`class-wp-xmlrpc-server.php:4837`).
 *
 * **E o unico texto de recusa de restauracao que o legado tem**: a tela do
 * painel nao recusa com texto — ela sai do `switch` em silencio e redireciona
 * para a listagem (`wp-admin/revision.php:43`). Ver a nota de
 * {@link autorizarRestauracaoDeVersao}.
 */
export const MENSAGEM_DE_RECUSA_DE_RESTAURACAO =
  'Sorry, you are not allowed to edit this post.';

/**
 * O codigo do XML-RPC para a recusa acima — **401, sempre**
 * (`class-wp-xmlrpc-server.php:4837`).
 *
 * O XML-RPC do legado nao distingue autenticado de anonimo: ele devolve
 * `IXR_Error( 401, ... )` nos cinco casos de recusa de escrita, o que
 * `../publicacao/permissao-de-publicacao.ts` ja registrou. Nao e
 * `rest_authorization_required_code()`, que da 403 a quem esta autenticado.
 */
export const CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO = 401;

/*
  ── `rest_authorization_required_code()` VEM DE T003, E NAO E DUPLICADA ──────

  **403 autenticado, 401 anonimo** (`wp-includes/rest-api.php:1438`), e a
  condicao e `is_user_logged_in()` — isto e, `AtorDeAutorizacao.existe`, e nao o
  identificador: o ator anonimo do legado existe como objeto, com `ID` 0 e
  `exists()` falso.

  `codigoDeAutorizacaoExigida()` foi declarada por T003 em
  `../publicacao/permissao-de-publicacao.ts` e e **importada** aqui, nao copiada.
  As duas pastas sao do MESMO contexto (BC-01), logo a regra de dependencia 3 —
  que proibe `contextos/<a>/` importar `contextos/<b>/` — nao se aplica, e a
  funcao e a mesma funcao do legado: ela e da borda HTTP, nao da publicacao, e
  esta la por ter sido precisa primeiro. Reescreve-la aqui daria dois lugares
  para o mesmo par de numeros.

  Ela **nao** e reexportada pelo barril desta pasta: quem precisa dela alcanca
  `publicacao/`, que e onde ela e declarada.
*/

/**
 * **CA-10.3**, primeira metade a ser lida mas segunda em importancia: se o ator
 * pode **listar** as versoes de um conteudo.
 *
 * A pergunta e `current_user_can( 'edit_post', $parent->ID )` — do **pai**, e so
 * dela (`class-wp-rest-revisions-controller.php:186`). Ver versao de conteudo
 * exige poder **editar** o conteudo, e nao so le-lo: um visitante que ve o post
 * publicado nao ve o historico dele.
 *
 * Devolve `null` quando autorizado, como as guardas de
 * `../publicacao/permissao-de-publicacao.ts`.
 */
export function autorizarLeituraDeVersoes(
  contexto: ContextoDeVersao,
  conteudoId: number,
): RecusaDeVersao | null {
  if (podeEditar(contexto, conteudoId)) {
    return null;
  }
  return {
    codigo: CODIGO_DE_RECUSA_DE_LEITURA_DE_VERSOES,
    mensagem: MENSAGEM_DE_RECUSA_DE_LEITURA_DE_VERSOES,
    codigoHttp: codigoDeAutorizacaoExigida(contexto.ator),
  };
}

/**
 * Se o ator pode **restaurar** uma versao: `edit_post` do **conteudo pai**
 * (`wp-admin/revision.php:42`, `class-wp-xmlrpc-server.php:4836`).
 *
 * ⚠️ **As duas superficies perguntam a mesma coisa e recusam de formas
 * diferentes**, e esta tarefa reproduz a que **tem** texto e numero, como T003
 * fez com CA-1.1: o XML-RPC devolve `401` com mensagem, e o painel sai do
 * `switch` sem escrever nada e redireciona para `edit.php`. As duas levam ao
 * mesmo lugar — sem a capacidade, a restauracao nao acontece —, e inventar para
 * a tela uma recusa que o legado nao tem seria inventar superficie.
 *
 * **Nao ha segunda pergunta.** A versao em si nao e consultada: nem `read_post`
 * (que e da tela de comparacao, nao da restauracao) nem `edit_post` dela. Somar
 * uma fecharia o sistema mais que o legado.
 */
export function autorizarRestauracaoDeVersao(
  contexto: ContextoDeVersao,
  conteudoPaiId: number,
): RecusaDeVersao | null {
  if (podeEditar(contexto, conteudoPaiId)) {
    return null;
  }
  return {
    // O XML-RPC nao tem codigo de texto: so o numero e a mensagem.
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_RESTAURACAO,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO,
  };
}

/**
 * **CA-10.3**, a metade que a capacidade decide: *"uma versao (…) nao e apagavel
 * por permissao de conteudo"*.
 *
 * As **tres** perguntas de `delete_item_permissions_check()`, na ordem do legado
 * (`class-wp-rest-revisions-controller.php:460`-`:493`):
 *
 * 1. `delete_post` do **pai** (`:466`) — que um ator com poder de apagar o
 *    conteudo tem;
 * 2. **`edit_post` do pai** (`:479`), e ela nao esta escrita ali: o legado
 *    reaproveita `get_items_permissions_check( $request )`, que e a guarda de
 *    {@link autorizarLeituraDeVersoes}. E a pergunta que um porte perde ao ler a
 *    funcao de cima para baixo procurando `current_user_can`, e ela **muda a
 *    recusa que o ator recebe**: quem tem `delete_post` e nao tem `edit_post` no
 *    pai e recusado com `rest_cannot_read` e *"…view revisions of this post."*,
 *    e nao com a mensagem de exclusao;
 * 3. `delete_post` da **versao** (`:484`) — que e `do_not_allow` para **todos**.
 *
 * ⚠️ **Entre a 1 e a 2 ha um quarto portao que nao e de capacidade**: `:474`
 * resolve a versao e devolve `rest_post_invalid_id` com 404 quando o
 * identificador nao e de versao (`:493`-`:502`). E da **rota**, nao desta
 * operacao — o mesmo limite que `listar-versoes.ts` declara para a conferencia
 * de tipo do pai —, e quem portar a API REST o poe ali.
 *
 * ⚠️ **Esta funcao nao crava a negacao: ela pergunta.** A regra mora em
 * `plataforma/autorizacao/traducao-de-conteudo.ts` (`PERM-5`, BR-MIGRAR-091), e
 * e de la que o `do_not_allow` sai — o que significa que a negacao vale tambem
 * para o **super administrador**, porque `do_not_allow` e o unico nome que o
 * atalho de rede de `PERM-9` nao vence. Craver a recusa aqui faria o teste
 * passar sem provar nada sobre a autorizacao, e esconderia a regressao no dia em
 * que `capabilities.php:108` fosse portado errado.
 *
 * O segundo passo devolve recusa **sempre**, o que faz esta funcao nunca
 * devolver `null` enquanto `PERM-5` estiver no lugar. O tipo continua admitindo
 * `null` porque o ponto de extensao `user_has_cap` existe e o legado o consulta
 * **antes** de `do_not_allow` ser retirado da lista — o que nao concede, mas e a
 * razao de a resposta nao ser uma constante no codigo.
 */
export function autorizarExclusaoDeVersao(
  contexto: ContextoDeVersao,
  conteudoPaiId: number,
  versaoId: number,
): RecusaDeVersao | null {
  const codigoHttp = codigoDeAutorizacaoExigida(contexto.ator);

  // Pergunta 1 (`:466`): `delete_post` sobre o pai.
  if (!podeApagar(contexto, conteudoPaiId)) {
    return {
      codigo: CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO,
      mensagem: MENSAGEM_DE_RECUSA_DE_EXCLUSAO_PELO_PAI,
      codigoHttp,
    };
  }

  // Pergunta 2 (`:479`): `edit_post` sobre o pai, reaproveitada da guarda de
  // listar. E a recusa dela que chega, com o codigo e o texto dela.
  const recusaDeLeitura = autorizarLeituraDeVersoes(contexto, conteudoPaiId);
  if (recusaDeLeitura !== null) {
    return recusaDeLeitura;
  }

  // Pergunta 3 (`:484`): `delete_post` sobre a versao — `do_not_allow`, para
  // todos.
  if (!podeApagar(contexto, versaoId)) {
    return {
      codigo: CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO,
      mensagem: MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
      codigoHttp,
    };
  }

  return null;
}

/** `current_user_can( 'edit_post', $id )` — com o objeto, que e o que decide. */
function podeEditar(contexto: ContextoDeVersao, conteudoId: number): boolean {
  return perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_EDITAR_CONTEUDO,
    conteudoId,
  );
}

/** `current_user_can( 'delete_post', $id )`. */
function podeApagar(contexto: ContextoDeVersao, conteudoId: number): boolean {
  return perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_APAGAR_CONTEUDO,
    conteudoId,
  );
}
