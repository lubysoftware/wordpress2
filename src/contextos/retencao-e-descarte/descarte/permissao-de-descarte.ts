/**
 * **CA-1.3, CA-1.4 e CA-1.5**: a permissao de descartar.
 *
 * Entrega de **T003** (US-1). E a declaracao de permissao que o **P4** da
 * constituicao cobra de *"toda operacao exposta"*, e UC-09 a escreve inteira na
 * linha de autorizacao: *"`delete_post` do registro, resolvida conforme autoria
 * e estado: do proprio e publicado exige `delete_published_posts`; de outro,
 * `delete_others_posts`"*.
 *
 * ── OS TRES CRITERIOS SAO UM UNICO MECANISMO, E ELE NAO MORA AQUI ───────────
 *
 * `delete_post` e **meta-capacidade**: ela nunca e comparada direto. `PERM-3`
 * (BR-MIGRAR-089) e literal — *"capacidade sobre objeto NAO e verificada direto:
 * e traduzida"* —, e os tres criterios desta historia sao tres **ramos** do mesmo
 * `case` de `map_meta_cap()` (`wp-includes/capabilities.php:149`), ja portado em
 * `plataforma/autorizacao/traducao-de-conteudo.ts` por T017 da feature `001`:
 *
 * | criterio | o que o legado faz | ramo |
 * |---|---|---|
 * | **CA-1.3** *"resolvida conforme autoria e estado"* | do proprio publicado exige `delete_published_posts`; do proprio em outro estado, `delete_posts`; de outra pessoa, `delete_others_posts` **somada** a `delete_published_posts` em publicado e a `delete_private_posts` em privado | 6 |
 * | **CA-1.4** *"uma versao anterior nao e descartavel por permissao de conteudo"* | linha de tipo `revision` devolve `do_not_allow`, e **nao** segue para o pai | 2 |
 * | **CA-1.5** *"conteudo com funcao especial declarada exige a capacidade dessa funcao"* | pagina inicial e pagina de conteudos exigem `manage_options` **em lugar** da capacidade de conteudo; a pagina de politica de privacidade **soma** `manage_privacy_options` | 3 e 7 |
 *
 * **Esta tarefa NAO reimplementa nenhum dos tres, e isso e deliberado.** Cravar
 * a negacao da versao aqui faria o teste desta historia passar sem provar nada
 * sobre a autorizacao, e esconderia a regressao no dia em que
 * `capabilities.php:108` fosse portado errado — e o mesmo argumento que
 * `conteudo/versoes/permissao-de-versao.ts` registrou para CA-10.3. O que esta
 * aqui e **a pergunta**, com o objeto viajando nela, e e a pergunta que os
 * testes afirmam.
 *
 * Tres consequencias do mecanismo que valem estar escritas, porque um porte que
 * as perdesse fecharia ou abriria o sistema sem perceber:
 *
 * 1. **A negacao da versao vale para o super administrador tambem**, porque
 *    `do_not_allow` e o unico nome que o atalho de rede de `PERM-9` nao vence
 *    (ADR-0009).
 * 2. **O ramo da pagina especial PARA o caso**: uma pagina que seja ao mesmo
 *    tempo a pagina inicial e a de politica exige `manage_options` e **nao**
 *    exige `manage_privacy_options`. UC-09 registra as duas excecoes na tabela
 *    dela sem dizer que uma cancela a outra; o codigo diz.
 * 3. **O descartado de outra pessoa nao le o estado anterior.** O ramo da
 *    lixeira existe so para o conteudo do proprio ator (CA-3.5, US-3): para o
 *    alheio, o legado exige so a capacidade do alheio. A assimetria e do legado
 *    e esta reproduzida em `traducao-de-conteudo.ts`.
 *
 * ── AS SUPERFICIES QUE RECUSAM, E COMO CADA UMA RECUSA ──────────────────────
 *
 * `wp_trash_post()` **nao verifica capacidade nenhuma** — e funcao publica e sem
 * portao (`wp-includes/post.php:4084`), como `wp_publish_post()` em BC-01. Quem
 * cobra sao as superficies, e as tres cobram a **mesma** capacidade com textos e
 * numeros diferentes:
 *
 * | superficie | onde | o que devolve a quem nao tem |
 * |---|---|---|
 * | Painel, acao `trash` | `wp-admin/post.php:261`-`:262` | `wp_die( ..., 403 )` com o texto **proprio da lixeira** — o unico que fala em mover para a lixeira |
 * | API REST | `class-wp-rest-posts-controller.php:1071`-`:1076`, e de novo em `:1125`-`:1130` | `rest_cannot_delete` com **403 autenticado, 401 anonimo** |
 * | XML-RPC `wp.deletePost` | `class-wp-xmlrpc-server.php:1884`-`:1886` | `IXR_Error( 401, ... )` — **sempre 401** |
 *
 * ⚠️ **A API REST pergunta a mesma coisa duas vezes**, e nao e redundancia
 * inofensiva: `delete_item_permissions_check()` recusa com `rest_cannot_delete`
 * (`:1073`) e `delete_item()` recusa com **`rest_user_cannot_delete_post`**
 * (`:1127`), que e outro codigo de erro para o mesmo texto. No fluxo normal so a
 * primeira roda; a segunda e alcancavel por quem chama o metodo direto, e o
 * codigo diferente e observavel. Os dois estao declarados abaixo.
 *
 * ⚠️ **O painel cobra mais do que capacidade, e os outros dois portoes nao sao
 * desta feature:** antes da pergunta ele recusa conteudo inexistente com **410**
 * e tipo invalido com **400** (`wp-admin/post.php:253`-`:259`), e **depois** dela
 * recusa com **409** quando outra pessoa esta editando o conteudo
 * (`wp_check_post_lock()`, `:265`-`:270`). A trava de edicao e de BC-01 e nao
 * aparece em nenhum criterio de US-1; fica nomeada aqui para que ninguem a
 * confunda com autorizacao.
 */

import {
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDeDescarte } from './contexto-de-descarte.js';

/**
 * `delete_post` — a meta-capacidade que as tres superficies perguntam, com o
 * **identificador do conteudo** junto.
 *
 * Nao e primitiva e nao se compara com concessao nenhuma: ela passa pela
 * traducao de objeto (`casoDeConteudo()`), que a resolve na familia de
 * capacidades daquele **tipo** — `delete_posts` para o tipo `post`,
 * `delete_pages` para `page`, e e assim que apagar pagina exige capacidade de
 * pagina sem nenhum `if` sobre o nome `page`.
 *
 * ⚠️ **Sem o objeto, a resposta e `do_not_allow`.** `BR-MIGRAR-091` poe isso
 * como regra — *"verificar capacidade de post sem informar o objeto devolve
 * `do_not_allow`"* —, e e por isso que o identificador **viaja** na pergunta de
 * {@link autorizarDescarte}.
 */
export const CAPACIDADE_DE_DESCARTAR: Capacidade = 'delete_post';

/*
  ── OS TEXTOS SAO OS DO LEGADO, EM INGLES ───────────────────────────────────

  Mesma postura de `conteudo/publicacao/permissao-de-publicacao.ts` e de
  `conteudo/versoes/permissao-de-versao.ts`: `EC-05` fixa que *"o `msgid` em
  ingles E a chave do catalogo"*, logo traduzir trocaria a chave do gettext.
  Cada um foi lido na linha citada, e a conferencia byte a byte fecha contra o
  oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
*/

/**
 * O texto que o painel devolve a quem nao pode descartar
 * (`wp-admin/post.php:262`).
 *
 * **E o unico texto de recusa do legado que fala em lixeira**: as outras duas
 * superficies dizem "delete this post", porque para elas descartar e apagar sao
 * o mesmo pedido com um sinalizador diferente. E ele que a tela de US-1 mostra.
 */
export const MENSAGEM_DE_RECUSA_NO_PAINEL =
  'Sorry, you are not allowed to move this item to the Trash.';

/**
 * **403, literal** (`wp-admin/post.php:262`).
 *
 * Nao e `rest_authorization_required_code()`: o painel passa o numero cravado ao
 * `wp_die()`, e nao distingue anonimo de autenticado — quem chega ali ja passou
 * por `auth_redirect()`.
 */
export const CODIGO_HTTP_DE_RECUSA_NO_PAINEL = 403;

/**
 * O texto que o painel devolve quando o conteudo **nao existe mais**
 * (`wp-admin/post.php:254`), com **410**.
 *
 * **Declarado e nao usado aqui**, como `MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO`
 * em BC-01: a operacao devolve o desfecho silencioso do legado
 * (`inexistente`), e quem transforma silencio em tela e a borda. Esta aqui
 * porque e o texto **proprio da acao de descartar** — tambem o unico que fala em
 * lixeira — e quem montar a tela de US-1 o reinventaria.
 */
export const MENSAGEM_DE_CONTEUDO_INEXISTENTE_NO_PAINEL =
  'The item you are trying to move to the Trash no longer exists.';

/** **410** — o numero que acompanha o texto acima (`wp-admin/post.php:254`). */
export const CODIGO_HTTP_DE_CONTEUDO_INEXISTENTE_NO_PAINEL = 410;

/**
 * `rest_cannot_delete` — o codigo da guarda de rota
 * (`class-wp-rest-posts-controller.php:1073`).
 */
export const CODIGO_DE_RECUSA_NA_API = 'rest_cannot_delete';

/**
 * `rest_user_cannot_delete_post` — o codigo da **segunda** pergunta, dentro da
 * operacao (`class-wp-rest-posts-controller.php:1127`).
 *
 * Ver o primeiro ⚠️ do cabecalho: mesmo texto, outro codigo, e o codigo e
 * observavel por qualquer cliente da API.
 */
export const CODIGO_DE_RECUSA_NA_API_DENTRO_DA_OPERACAO =
  'rest_user_cannot_delete_post';

/**
 * O texto que a API REST e o XML-RPC devolvem — **o mesmo nas duas**
 * (`class-wp-rest-posts-controller.php:1074` e `:1128`,
 * `class-wp-xmlrpc-server.php:1885`).
 */
export const MENSAGEM_DE_RECUSA_DE_EXCLUSAO =
  'Sorry, you are not allowed to delete this post.';

/**
 * **401, sempre**, no XML-RPC (`class-wp-xmlrpc-server.php:1885`).
 *
 * O XML-RPC do legado nao distingue autenticado de anonimo — ele devolve
 * `IXR_Error( 401, ... )` —, e isso ja estava registrado em
 * `conteudo/versoes/permissao-de-versao.ts` para as recusas de escrita.
 */
export const CODIGO_HTTP_DE_RECUSA_NO_XML_RPC = 401;

/**
 * `rest_authorization_required_code()` — **403 autenticado, 401 anonimo**
 * (`wp-includes/rest-api.php:1438`).
 *
 * ⚠️ **Esta funcao repete `codigoDeAutorizacaoExigida` de
 * `conteudo/publicacao/permissao-de-publicacao.ts`, e a repeticao e obrigatoria,
 * nao descuido**: a regra de dependencia 3 de `target_architecture.md` proibe
 * `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*, e aquela
 * declaracao esta em BC-01. E a mesma razao pela qual
 * `armazenamento/leitura-de-linha.ts` deste modulo repete a de BC-01. A funcao e
 * da borda HTTP: quando a camada de `015-plataforma-transversal` existir, as
 * duas descem para la.
 *
 * A condicao do legado e `is_user_logged_in()`, que e
 * `wp_get_current_user()->exists()` — por isso a decisao le
 * {@link AtorDeAutorizacao.existe} e nao o identificador: o ator anonimo do
 * legado **existe como objeto**, com `ID` 0 e `exists()` falso.
 */
export function codigoDeAutorizacaoExigida(ator: AtorDeAutorizacao): 401 | 403 {
  return ator.existe ? 403 : 401;
}

/**
 * Uma recusa de descarte, devolvida **como valor**.
 *
 * `plan.md` de BC-01 fixou a forma, e ela vale aqui: *"erro e devolvido como
 * valor, nao como excecao: e assim no legado e e o que permite a um ponto de
 * extensao inspecionar a falha"*. No legado esta recusa e um `wp_die()` no
 * painel e um `WP_Error` na API — nenhum dos dois e excecao.
 */
export interface RecusaDoDescarte {
  /**
   * O codigo de erro, ou `null` quando a superficie nao declara nenhum.
   *
   * `null` acontece de verdade: o `wp_die()` do painel carrega texto e numero e
   * **nenhuma** cadeia de codigo, ao contrario do `WP_Error( 'rest_cannot_delete',
   * ... )` da API. Inventar um codigo para ele seria inventar superficie.
   */
  readonly codigo: string | null;
  readonly mensagem: string;
  readonly codigoHttp: 400 | 401 | 403 | 409 | 410;
}

/**
 * **CA-1.3, CA-1.4 e CA-1.5.** Se o ator do contexto pode descartar aquele
 * conteudo.
 *
 * **Permissao exigida: `delete_post` do registro** — a meta-capacidade, com o
 * objeto. O que ela exige de concreto nao esta aqui e nao pode estar: sai da
 * traducao, que decide por **autoria e estado** (CA-1.3), **nega a versao**
 * (CA-1.4) e **troca ou soma** a capacidade das paginas de funcao especial
 * (CA-1.5). Ver a tabela do cabecalho.
 *
 * Devolve `null` quando autorizado, e a recusa **do painel** quando nao — que e
 * a superficie de US-1 (*"Como autor, quero tirar um conteudo do ar"*) e a unica
 * cujo texto fala em lixeira. Quem construir a API REST ou o XML-RPC monta a
 * recusa com as constantes declaradas acima, que sao as de cada uma: os tres
 * textos existem no legado e nenhum deles e o default dos outros.
 */
export function autorizarDescarte(
  contexto: ContextoDeDescarte,
  conteudoId: number,
): RecusaDoDescarte | null {
  const podeDescartar = perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    CAPACIDADE_DE_DESCARTAR,
    conteudoId,
  );

  if (podeDescartar) {
    return null;
  }

  return {
    // O `wp_die()` do painel nao tem codigo de texto: so o numero e a mensagem.
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_NO_PAINEL,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_NO_PAINEL,
  };
}
