/**
 * **CA-11.4**: o salvamento automatico escreve **nesse** registro, no intervalo
 * configurado.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11). O criterio
 * tem duas metades, e elas moram em lugares diferentes do legado:
 *
 * | metade | o que decide | onde esta |
 * |---|---|---|
 * | *"no intervalo configurado"* | `AUTOSAVE_INTERVAL`, e a comparacao que o usa | {@link INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA}, {@link proximoSalvamentoAutomatico}, {@link podeSalvarAutomaticamente} |
 * | *"escreve nesse registro"* | se a escrita vai para a propria linha ou para uma versao por conta | {@link destinoDoSalvamentoAutomatico} |
 *
 * ---
 *
 * # O numero, o ponto de configuracao e as duas publicacoes dele
 *
 * `wp-includes/default-constants.php:380`-`:382`:
 *
 * ```php
 * if ( ! defined( 'AUTOSAVE_INTERVAL' ) ) {
 *     define( 'AUTOSAVE_INTERVAL', MINUTE_IN_SECONDS );
 * }
 * ```
 *
 * `MINUTE_IN_SECONDS` vale **60** (`wp-includes/default-constants.php:158`), e a
 * guarda `! defined()` e o ponto de configuracao: o dono do servidor define a
 * constante antes do arranque e o valor de fabrica nao se aplica. E o mesmo
 * mecanismo das quatro constantes de `plataforma/autorizacao/revogacao-por-constante.ts`,
 * e o **P6** exige exatamente esta forma — *"cada numero vive num ponto de
 * configuracao nomeado, com o valor de fabrica do legado"*.
 *
 * O valor e **publicado ao cliente em dois lugares**, e os dois sao contrato de
 * terceiro (area 1 da Decisao 2, byte a byte):
 *
 * | onde | chave entregue | para quem |
 * |---|---|---|
 * | `wp-includes/script-loader.php:1962` | `autosaveL10n.autosaveInterval` | o editor classico (`wp-includes/js/autosave.js`) |
 * | `wp-admin/edit-form-blocks.php:283` | `editor_settings.autosaveInterval` | o editor em bloco |
 *
 * ⚠️ **Em segundos nos dois, e o cliente multiplica por 1000.** Publicar
 * milissegundos aqui quebraria os dois clientes de uma vez — e um deles e
 * dependencia externa de versao cravada, que este porte **nao pode mudar**
 * (BR-MIGRAR-117, `ESC-CLIENTE`). Ha uma terceira publicacao no legado que **ja
 * multiplica**, e por isso nao e desta tarefa: `changesetAutoSave` do
 * personalizador (`wp-includes/class-wp-customize-manager.php:4924`), que e
 * BC-07.
 *
 * ## O que a borda do intervalo decide, e por que ela esta aqui
 *
 * A comparacao que gasta o numero e uma linha de `wp-includes/js/autosave.js`:
 *
 * ```js
 * if ( ( new Date() ).getTime() < nextRun ) { return false; }   // :752
 * ...
 * nextRun = ( new Date() ).getTime() + ( autosaveL10n.autosaveInterval * 1000 ) || 60000;  // :791
 * ```
 *
 * Isto e: **no instante exato em que o intervalo fecha, salva; um instante antes,
 * recusa** — a borda que o P6 manda afirmar por teste. As duas funcoes deste
 * arquivo sao essas duas linhas, e estao aqui, e nao na borda do cliente, por
 * tres razoes:
 *
 * 1. o numero e do produto e tem de viver num ponto nomeado **com teste de
 *    borda** (P6), e borda sem funcao nao se testa;
 * 2. `autosave.js` **esta nesta arvore** — o que `BR-MIGRAR-117` declara ausente
 *    e `wp-includes/js/dist/`, o lado cliente dos cinco modulos do editor em
 *    bloco, e `autosave.js` nao e um deles;
 * 3. o que **nao** esta aqui e o laco: o cronometro de 15 s (`:412`), o pulso de
 *    batimento, a comparacao do texto digitado e a suspensao por foco sao do
 *    cliente, e reproduzi-los seria reescrever o que o porte adota. Esta tarefa
 *    porta a **decisao de intervalo**, nao o agendador dela.
 *
 * ⚠️ **O `|| 60000` da linha `:791` nao e um segundo default: e o `||` de
 * JavaScript sobre a soma.** Ele so vale quando a soma inteira e falsa — isto e,
 * `NaN` ou `0` —, e `getTime()` nunca e zero numa requisicao real. Esta
 * reproduzido em {@link proximoSalvamentoAutomatico} em vez de "limpo", e o
 * teste cobre o caso: intervalo nao numerico cai nos 60 000 ms, que **nao** sao
 * `AUTOSAVE_INTERVAL` e sim um literal daquela linha.
 *
 * ---
 *
 * # "Escreve nesse registro": a regra das duas pontas
 *
 * O servidor decide entre **sobrescrever a propria linha** e **guardar uma versao
 * de salvamento automatico por conta**, e a decisao e a mesma nas duas
 * superficies, com o mesmo comentario do legado:
 *
 * ```php
 * // wp-admin/includes/post.php:2180-:2189  (wp_autosave)
 * if ( ! wp_check_post_lock( $post->ID ) && get_current_user_id() === (int) $post->post_author
 *     && ( 'auto-draft' === $post->post_status || 'draft' === $post->post_status )
 * ) {
 *     // Drafts and auto-drafts are just overwritten by autosave for the same user if the post is not locked.
 *     return edit_post( wp_slash( $post_data ) );
 * } else {
 *     // Non-drafts or other users' drafts are not overwritten.
 *     // The autosave is stored in a special post revision for each user.
 *     return wp_create_post_autosave( wp_slash( $post_data ) );
 * }
 * ```
 *
 * ```php
 * // wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php:233-:245
 * $is_draft = 'draft' === $post->post_status || 'auto-draft' === $post->post_status;
 * $can_update_author_draft_post    = ( $is_draft && (int) $post->post_author === $user_id );
 * $should_update_parent_draft_post = ( ! $post_lock_is_active && $can_update_author_draft_post );
 * ```
 *
 * **Para o registro que `abrir-editor.ts` acabou de criar as tres condicoes sao
 * verdadeiras por construcao** — ele esta em `auto-draft`, o autor e quem abriu
 * o editor, e nao ha trava —, e e por isso que CA-11.4 pode dizer *"escreve
 * nesse registro"* sem ressalva. As tres estao aqui, e nao presumidas, porque a
 * **segunda** gravacao pode nao ter nenhuma delas: basta outra pessoa abrir o
 * mesmo conteudo.
 *
 * ⚠️ **A ordem das tres e a do legado e nao e cosmetica.** `wp_check_post_lock()`
 * e **leitura de metadado**; as outras duas sao campos da linha que o chamador ja
 * tem. O legado pergunta a trava primeiro em `wp_autosave()` (`:2180`) e por
 * ultimo no controlador REST (`:244`), e os dois chegam ao mesmo resultado — mas
 * **so o segundo le a trava uma vez por requisicao**. Esta funcao recebe a trava
 * como valor ja lido, e {@link destinoDoSalvamentoAutomatico} nao a consulta
 * quando as outras duas condicoes ja decidiram, de modo que quem a chamar pode
 * reproduzir qualquer das duas ordens sem que esta decisao mude.
 *
 * ## A assimetria entre as duas superficies, declarada
 *
 * `wp_autosave()` reescreve o estado pedido antes de gravar (`:2172`-`:2174`):
 * um conteudo em `auto-draft` passa a `draft` **no primeiro salvamento
 * automatico**. O controlador REST **nao tem essa linha**: ele monta o pedido
 * com `prepare_item_for_database()` e, quando o cliente nao manda `status`,
 * `wp_update_post()` conserva o que a linha tinha — isto e, o registro **continua
 * em `auto-draft`** depois do salvamento.
 *
 * Isso **nao** e divergencia desta tarefa com nada: as duas linhas foram lidas e
 * estao reproduzidas onde estao. {@link reescreverEstadoPedidoNoPainel}, em
 * `estado-pedido-pela-api.ts`, e a do painel; a ausencia dela no caminho REST
 * esta declarada aqui e em {@link SUPERFICIES_DO_SALVAMENTO_AUTOMATICO}. Quem
 * portar cada superficie reproduz a **dela**, e quem ler uma so nao conclui que
 * a outra faz igual.
 *
 * ---
 *
 * # O que NAO esta aqui, e de quem e
 *
 * - **A versao de salvamento automatico.** `wp_create_post_autosave()`
 *   (`wp-admin/includes/post.php:1971`) e `_wp_put_post_revision()` com o
 *   identificador `"{$post_id}-autosave-v1"` (`wp-includes/revision.php:91`): e
 *   **versao**, e versao e **T021** (US-10).
 *   {@link DestinoDoSalvamentoAutomatico} nomeia o destino e nao o constroi. A
 *   **forma** daquele identificador ja existe nesta arvore, entregue por T002 em
 *   `../armazenamento/versao.ts` (`nomeDaVersao`, `eSalvamentoAutomatico`), e
 *   quem fizer T021 usa aquelas e nao escreve a convencao de novo.
 * - **A trava de edicao.** `wp_check_post_lock()`
 *   (`wp-admin/includes/post.php:1729`) le o metadado `_edit_lock` e compara com
 *   uma janela de **150 segundos** que e ela mesma ponto de extensao
 *   (`wp_check_post_lock_window`, `:1751`). O prazo e numero de **outra** tarefa
 *   (P6: *"numero que aparece aqui e numero sem teste de borda"*), e a leitura e
 *   da tela de edicao (BC-09). Chega como **valor booleano** ja resolvido.
 * - **`edit_post()`.** Ela e a traducao do formulario do painel
 *   (`wp-admin/includes/post.php:269`) e chama `wp_update_post()`, que T005
 *   declarou **nao portada** de proposito. O destino `'no-proprio-registro'`
 *   diz **onde** a escrita vai; quem a executa e o caminho de gravacao.
 */

import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import { ESTADO_DE_RASCUNHO_AUTOMATICO } from './visibilidade-do-rascunho-automatico.js';

/**
 * `MINUTE_IN_SECONDS` — **60** (`wp-includes/default-constants.php:158`).
 *
 * Declarado aqui, e nao importado de `plataforma/`, porque
 * `plataforma/tempo/` nao existe nesta arvore e porque este arquivo e o unico
 * desta tarefa que precisa dele. Quando aquela pasta existir, esta constante vem
 * de la — e a anotacao fica para que ninguem a duplique uma terceira vez.
 *
 * ⚠️ Nao e um prazo: e a **unidade** de um. O prazo e
 * {@link INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA}.
 */
export const MINUTO_EM_SEGUNDOS = 60;

/**
 * `AUTOSAVE_INTERVAL` de fabrica — **60 segundos**
 * (`wp-includes/default-constants.php:381`).
 *
 * O valor de fabrica e `MINUTE_IN_SECONDS`, e nao o literal `60`: no legado a
 * linha e `define( 'AUTOSAVE_INTERVAL', MINUTE_IN_SECONDS )`, e derivar preserva
 * a relacao. Quem trocar a unidade por engano ve as duas mudarem juntas, que e o
 * comportamento do legado.
 */
export const INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA = MINUTO_EM_SEGUNDOS;

/**
 * As constantes do dono do servidor que esta tarefa le.
 *
 * Uma so, e opcional: a guarda do legado e `! defined( 'AUTOSAVE_INTERVAL' )`,
 * logo ausente significa *"vale o de fabrica"*. Mesma forma de
 * `ConstantesDoServidor` em `plataforma/autorizacao/revogacao-por-constante.ts`.
 */
export interface ConstantesDoSalvamentoAutomatico {
  /**
   * `AUTOSAVE_INTERVAL`, em **segundos**.
   *
   * ⚠️ O legado nao valida este valor: `define( 'AUTOSAVE_INTERVAL', 'ontem' )`
   * e aceito e chega ao cliente como esta — e e no cliente que a multiplicacao
   * produz `NaN` e o `|| 60000` da linha `:791` entra. Ver
   * {@link proximoSalvamentoAutomatico}. Por isso o tipo e `number` e nao ha
   * guarda aqui: recusar seria mais correto e seria outro produto.
   */
  readonly AUTOSAVE_INTERVAL?: number;
}

/**
 * O intervalo em vigor: o da constante quando ela esta definida, o de fabrica
 * quando nao.
 *
 * E a guarda `! defined()` do legado, e nada mais.
 */
export function intervaloDeSalvamentoAutomatico(
  constantes: ConstantesDoSalvamentoAutomatico = {},
): number {
  return (
    constantes.AUTOSAVE_INTERVAL ?? INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA
  );
}

/**
 * O valor publicado ao cliente — `autosaveL10n.autosaveInterval` e
 * `editor_settings.autosaveInterval`.
 *
 * E o mesmo numero de {@link intervaloDeSalvamentoAutomatico}, **em segundos**,
 * e existe como funcao propria porque e **contrato de terceiro**: as duas
 * publicacoes (`script-loader.php:1962` e `edit-form-blocks.php:283`) entregam o
 * valor cru, sem conversao, e a area 1 da Decisao 2 as compara byte a byte. Um
 * porte que convertesse na saida quebraria os dois clientes — e um deles nao e
 * deste porte.
 */
export function intervaloPublicadoAoCliente(
  constantes: ConstantesDoSalvamentoAutomatico = {},
): number {
  return intervaloDeSalvamentoAutomatico(constantes);
}

/**
 * O literal da linha `wp-includes/js/autosave.js:791`, em milissegundos.
 *
 * **Nao e `AUTOSAVE_INTERVAL` convertido**: e o segundo operando do `||`
 * daquela linha, e so vale quando a soma e falsa. Declarado para que o teste da
 * borda possa afirmar que os dois caminhos existem e que nao sao o mesmo numero
 * por acidente.
 */
export const PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO = 60_000;

/**
 * `_schedule()` — o instante do proximo salvamento automatico permitido, em
 * milissegundos (`wp-includes/js/autosave.js:782`-`:792`).
 *
 * `nextRun = ( new Date() ).getTime() + ( autosaveL10n.autosaveInterval * 1000 ) || 60000`
 *
 * O `||` incide sobre a **soma inteira**, e e a verdade de JavaScript: soma
 * `NaN` cai em {@link PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO}. A
 * reproducao e literal, e nao "corrigida", porque o resultado e observavel —
 * uma instalacao com `AUTOSAVE_INTERVAL` nao numerico salva de minuto em minuto,
 * e nao de nunca em nunca.
 */
export function proximoSalvamentoAutomatico(
  agoraEmMilissegundos: number,
  intervaloEmSegundos: number,
): number {
  return (
    agoraEmMilissegundos + intervaloEmSegundos * 1000 ||
    PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO
  );
}

/**
 * A borda do intervalo — `if ( ( new Date() ).getTime() < nextRun ) return false;`
 * (`wp-includes/js/autosave.js:752`).
 *
 * **No instante exato em que o intervalo fecha, salva; um instante antes,
 * recusa.** E a comparacao e `<` e nao `<=`, o que faz do instante de fechamento
 * o **primeiro** permitido — a borda que o **P6** manda afirmar por teste.
 *
 * ⚠️ Esta funcao responde so pelo **intervalo**. As outras tres condicoes da
 * mesma funcao do legado — suspensao (`isSuspended`), bloqueio temporario
 * (`_blockSave`) e texto inalterado (`compareString === lastCompareString`) — sao
 * do cliente e **nao** estao aqui: elas nao gastam numero do produto, e
 * reproduzi-las seria reescrever o que `ESC-CLIENTE` adota.
 */
export function podeSalvarAutomaticamente(
  agoraEmMilissegundos: number,
  proximoSalvamentoEmMilissegundos: number,
): boolean {
  return !(agoraEmMilissegundos < proximoSalvamentoEmMilissegundos);
}

/**
 * Para onde o salvamento automatico escreve.
 *
 * Duas saidas, e sao as duas do legado — nem uma terceira, nem um booleano: o
 * nome de cada destino e o que o `else` do legado explica em comentario.
 */
export type DestinoDoSalvamentoAutomatico =
  /**
   * A propria linha e sobrescrita, e **nenhuma versao e criada** — *"Drafts and
   * auto-drafts are just overwritten by autosave for the same user if the post
   * is not locked"* (`wp-admin/includes/post.php:2183`).
   *
   * E o destino de CA-11.4 para o registro que a abertura do editor criou.
   */
  | 'no-proprio-registro'
  /**
   * Uma versao de salvamento automatico **por conta** — *"Non-drafts or other
   * users' drafts are not overwritten. The autosave is stored in a special post
   * revision for each user"* (`:2186`-`:2188`).
   *
   * Construi-la e **T021** (US-10): ver a secao *"O que NAO esta aqui"* no
   * cabecalho deste arquivo.
   */
  | 'em-versao-de-salvamento-automatico';

/** O que a decisao de destino precisa saber sobre a linha e sobre quem salva. */
export interface PedidoDeSalvamentoAutomatico {
  /** `$post->post_status` — o estado **gravado**, nao o pedido. */
  readonly estadoDoConteudo: string;
  /** `$post->post_author`. */
  readonly autorDoConteudo: number;
  /** `get_current_user_id()` — quem esta salvando. */
  readonly atorId: number;
  /**
   * `wp_check_post_lock( $post->ID )` ja resolvido
   * (`wp-admin/includes/post.php:1729`).
   *
   * Chega como valor, e nao como funcao, pela razao da secao *"A ordem das tres
   * e a do legado"*: assim quem chama le a trava uma vez e esta decisao nao
   * depende de qual das duas ordens do legado ele reproduziu.
   */
  readonly travadoPorOutraPessoa: boolean;
}

/**
 * Os dois estados em que a propria linha pode ser sobrescrita pelo salvamento
 * automatico — `draft` e `auto-draft` (`wp-admin/includes/post.php:2181`,
 * `class-wp-rest-autosaves-controller.php:233`).
 *
 * A ordem e a do legado em cada arquivo, e eles divergem: o painel pergunta
 * `auto-draft` primeiro, o controlador REST pergunta `draft` primeiro. A ordem
 * de um `||` nao e observavel, e por isso a lista esta numa ordem so — mas a
 * **composicao** e, e e ela que esta derivada aqui em lugar de redigitada.
 */
export const ESTADOS_SOBRESCRITOS_PELO_SALVAMENTO_AUTOMATICO: readonly string[] =
  Object.freeze([ESTADO_DE_RASCUNHO_AUTOMATICO, ESTADO_PADRAO_DA_APLICACAO]);

/**
 * **CA-11.4.** Para onde o salvamento automatico escreve.
 *
 * As tres condicoes do legado, com o `&&` entre elas:
 *
 * 1. a linha esta num dos dois estados de
 *    {@link ESTADOS_SOBRESCRITOS_PELO_SALVAMENTO_AUTOMATICO};
 * 2. quem salva e o **autor da linha** — a comparacao do legado e de inteiro
 *    (`(int) $post->post_author === $user_id`), e por isso o ator anonimo `0`
 *    casa com uma linha de autor `0`, que o **P5** trata como estado normal;
 * 3. a linha **nao** esta travada por outra pessoa.
 *
 * Qualquer uma falhando, o destino e a versao por conta.
 */
export function destinoDoSalvamentoAutomatico(
  pedido: PedidoDeSalvamentoAutomatico,
): DestinoDoSalvamentoAutomatico {
  const ehRascunho = ESTADOS_SOBRESCRITOS_PELO_SALVAMENTO_AUTOMATICO.includes(
    pedido.estadoDoConteudo,
  );
  const ehOProprioAutor = pedido.autorDoConteudo === pedido.atorId;

  if (ehRascunho && ehOProprioAutor && !pedido.travadoPorOutraPessoa) {
    return 'no-proprio-registro';
  }

  return 'em-versao-de-salvamento-automatico';
}

/**
 * O que cada superficie do salvamento automatico faz com o **estado** da linha,
 * com a ancora de cada uma.
 *
 * Declarado como dado pela mesma razao de `SUPERFICIES_DO_ESTADO_PEDIDO`: a
 * assimetria da secao *"A assimetria entre as duas superficies"* fica afirmavel
 * por teste em vez de viver so em prosa.
 */
export const SUPERFICIES_DO_SALVAMENTO_AUTOMATICO: readonly {
  readonly superficie: string;
  readonly reescreveORascunhoAutomatico: boolean;
  readonly ancora: string;
}[] = Object.freeze([
  Object.freeze({
    superficie: 'painel, wp_autosave',
    reescreveORascunhoAutomatico: true,
    ancora: 'wp-admin/includes/post.php:2172',
  }),
  Object.freeze({
    superficie: 'API REST, controlador de salvamento automatico',
    reescreveORascunhoAutomatico: false,
    ancora:
      'wp-includes/rest-api/endpoints/class-wp-rest-autosaves-controller.php:211',
  }),
]);
