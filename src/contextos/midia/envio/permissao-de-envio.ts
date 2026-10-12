/**
 * **CA-1.1**: o envio exige a capacidade de enviar arquivo e, quando ha conteudo
 * de destino, a de editar aquele conteudo. **CA-1.6**: a tela e o envio
 * assincrono do editor aplicam as **mesmas duas** verificacoes.
 *
 * Entrega de **T003** (US-1). E a declaracao de permissao que o **P4** da
 * constituicao cobra de *"toda operacao exposta"*, e UC-12 a nomeia por extenso
 * no campo *Autorizacao*: *"`upload_files`, que o colaborador nao tem. Quando o
 * envio e vinculado a um conteudo, soma-se `edit_post` daquele conteudo"*.
 *
 * ---
 *
 * # As duas perguntas estao nas TRES superficies; a CONSEQUENCIA da segunda, nao
 *
 * `media_handle_upload()` **nao verifica capacidade nenhuma**
 * (`wp-admin/includes/media.php:296`): como `wp_publish_post()` em BC-01, ela e
 * funcao publica e sem portao. Quem cobra sao as superficies, e o inventario
 * lido linha a linha e este:
 *
 * | superficie | `upload_files` | `edit_post` do destino | ancora |
 * |---|---|---|---|
 * | tela de envio de midia | `wp_die()` com texto | **zera o destino** e segue | `wp-admin/media-new.php:15` e `:24` |
 * | envio assincrono, navegador | `wp_die()` com o mesmo texto | **zera o destino** e segue | `wp-admin/async-upload.php:34` e `:108` |
 * | envio assincrono do editor | JSON `success: false` com texto | **recusa** com texto proprio | `wp-admin/includes/ajax-actions.php:2617` e `:2633` |
 *
 * ## 🔴 CA-1.1 diz "exige", e duas das tres superficies do legado NAO exigem
 *
 * As duas primeiras escrevem, literalmente, a mesma coisa:
 *
 * ```php
 * $post_id = 0;
 * if ( isset( $_REQUEST['post_id'] ) ) {
 *     $post_id = absint( $_REQUEST['post_id'] );
 *     if ( ! get_post( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
 *         $post_id = 0;
 *     }
 * }
 * ```
 *
 * Quem nao pode editar o destino **nao e recusado**: o destino e descartado e o
 * anexo nasce **sem pai**. E a terceira superficie, que e exatamente a que
 * CA-1.6 chama de *"envio assincrono do editor"*, faz o oposto — devolve
 * `Sorry, you are not allowed to attach files to this post.` e encerra.
 *
 * **Os dois comportamentos sao do legado, e nenhum dos dois e defeito.** Por
 * isso esta tarefa:
 *
 * 1. **nao escolhe entre eles.** {@link autorizarEnvio} devolve os **tres**
 *    desfechos que o legado produz, e {@link SuperficieDeEnvio} diz qual
 *    superficie produz qual. A superficie e **dado da chamada**, nao invencao:
 *    o proprio `_wp_handle_upload()` recebe `$action` para distinguir envio de
 *    carga lateral (`wp-admin/includes/file.php:809`);
 * 2. **nao inventa superficie nova**, e nao acrescenta a nenhuma delas uma
 *    recusa que ela nao tem. Mesmo precedente e mesma postura de
 *    `contextos/conteudo/publicacao/permissao-de-publicacao.ts`, onde CA-1.1
 *    pedia *"recusa explicita na tela"* e o painel do legado **rebaixava** o
 *    estado em vez de recusar;
 * 3. **registra que CA-1.1, lido como "toda superficie recusa", divergiria do
 *    legado em duas das tres.** O P1 exige que *"toda divergencia tenha uma
 *    referencia a resposta de `questions.md` ou ao ADR que a autorizou"*, e
 *    nenhuma existe aqui — as tres autorizadas sao o tempo limite do adaptador
 *    de IA, a minimizacao do servico de reputacao e o ambiente-oraculo. Fica
 *    registrado e **nao resolvido**, como T019 de BC-01 fez com o conflito de
 *    US-9.
 *
 * ⚠️ **CA-1.6 fecha de qualquer forma, e isso nao e sorte:** o criterio cobra
 * que as superficies *"apliquem as mesmas duas verificacoes de capacidade"*, e
 * as tres aplicam — `upload_files` e `edit_post` do destino. O que difere e o
 * que cada uma faz com a resposta. {@link autorizarEnvio} e **uma** funcao, e e
 * por ela que as tres passam: e assim que o teste de CA-1.6 afirma a igualdade
 * das perguntas sem apagar a diferenca das consequencias.
 *
 * ---
 *
 * # Tres diferencas menores entre as superficies, preservadas
 *
 * 1. **A existencia do destino.** As duas primeiras perguntam
 *    `! get_post( $post_id )` **antes** da capacidade; a do editor **nao
 *    pergunta** (`ajax-actions.php:2633`) e deixa a resposta para a traducao de
 *    `edit_post`, que devolve `do_not_allow` para objeto que nao existe. O
 *    desfecho e o mesmo; a ordem das leituras, nao — e leitura e sequencia de
 *    comandos (area 3 da Decisao 2).
 * 2. **`absint()`.** As duas primeiras aplicam; a do editor usa
 *    `$_REQUEST['post_id']` cru. Aqui o destino chega como numero, logo a
 *    conversao e da borda; o que atravessa e {@link SEM_CONTEUDO_DE_DESTINO}.
 * 3. **O nonce.** As tres conferem `media-form`
 *    (`check_admin_referer`/`check_ajax_referer`), e UC-12 o poe no passo 3 com
 *    o prazo: *"nonce vale de 12 a 24 horas e aceita o tick anterior"*. Ele e um
 *    dos **cinco atestados** do P4 e nao e capacidade: e de BC-05 / feature
 *    001, e nao e desta tarefa. Fica nomeado porque CA-1.6 fala de *"as mesmas
 *    duas verificacoes"* e alguem poderia contar o nonce como terceira.
 */

import {
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import { SEM_CONTEUDO_DE_DESTINO } from '../armazenamento/index.js';

/**
 * `upload_files` — a capacidade de enviar arquivo.
 *
 * E cadeia literal e **nao** slot do registro de tipo, ao contrario de
 * `publish_posts` em BC-01: o legado compara o nome direto
 * (`current_user_can( 'upload_files' )`), e `upload_files` nao esta entre os 15
 * slots que `get_post_type_capabilities()` deriva. UC-12 registra quem nao a
 * tem: *"que o colaborador nao tem"*.
 */
export const CAPACIDADE_DE_ENVIAR_ARQUIVO: Capacidade = 'upload_files';

/**
 * `edit_post` — a capacidade de editar **aquele** conteudo.
 *
 * E meta-capacidade: passa por `map_meta_cap()` com o objeto e resolve por
 * autoria e por estado. Quem a traduz e `casoDeConteudo()` de
 * `plataforma/autorizacao/traducao-de-conteudo.ts`, e ela entra na decisao pelo
 * campo `casosDeTraducao` da {@link BaseDeAutorizacao} — logo **quem compoe a
 * requisicao** liga BC-04 a leitura de conteudo de BC-01, que e ligacao tardia
 * (AD-10).
 */
export const CAPACIDADE_DE_EDITAR_CONTEUDO: Capacidade = 'edit_post';

/**
 * A superficie que esta enviando.
 *
 * Os tres nomes sao os tres arquivos do legado, e nao ha um quarto. Nao e
 * configuracao: e **de onde a chamada veio**, e e isso que decide a consequencia
 * da segunda pergunta (ver o cabecalho).
 */
export type SuperficieDeEnvio =
  /** `wp-admin/media-new.php` — a tela de envio de midia. */
  | 'tela-de-midia'
  /** `wp-admin/async-upload.php` — o envio assincrono pelo navegador. */
  | 'envio-assincrono'
  /** `wp_ajax_upload_attachment()` — o envio assincrono do editor. */
  | 'envio-assincrono-do-editor';

/**
 * As superficies que **descartam** o destino em vez de recusar, na ordem em que
 * o inventario do cabecalho as lista.
 *
 * Esta como dado, e nao como `if`, porque e o que o teste de CA-1.6 compara: a
 * pergunta e a mesma nas tres, e a diferenca e a pertinencia a esta lista.
 */
export const SUPERFICIES_QUE_DESCARTAM_O_DESTINO: readonly SuperficieDeEnvio[] =
  ['tela-de-midia', 'envio-assincrono'];

/**
 * O texto que as tres superficies usam para a falta de `upload_files`
 * (`wp-admin/media-new.php:16`, `wp-admin/async-upload.php:35`,
 * `wp-admin/includes/ajax-actions.php:2621`).
 *
 * E **o mesmo** nas tres, e e por isso que ha uma constante so. Em ingles, pelo
 * motivo de `EC-05` registrado em `area-de-envios.ts`.
 */
export const MENSAGEM_DE_ENVIO_NAO_PERMITIDO =
  'Sorry, you are not allowed to upload files.';

/**
 * O texto que **so** o envio assincrono do editor tem
 * (`wp-admin/includes/ajax-actions.php:2638`).
 *
 * As outras duas superficies nao tem texto para este caso porque nao recusam.
 */
export const MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO =
  'Sorry, you are not allowed to attach files to this post.';

/** O que a decisao de permissao do envio devolve. */
export type DecisaoDeEnvio =
  /** As duas perguntas passaram, e o destino e o que o pedido trouxe. */
  | { readonly desfecho: 'autorizado'; readonly conteudoDeDestino: number }
  /**
   * `edit_post` negou numa superficie que **descarta** o destino: o envio segue,
   * e o anexo nasce sem pai (`media-new.php:25`).
   *
   * ⚠️ Nao e recusa, e nao e sucesso silencioso: e a consequencia que CA-2.3
   * descreve do outro lado — *"anexo sem conteudo de destino passa a ter
   * visibilidade propria"* — chegando por um caminho que o ator nao escolheu.
   */
  | {
      readonly desfecho: 'destino-descartado';
      readonly conteudoDeDestino: typeof SEM_CONTEUDO_DE_DESTINO;
    }
  /** Uma das duas perguntas negou numa superficie que recusa. */
  | { readonly desfecho: 'recusado'; readonly mensagem: string };

/** O recorte de `plataforma/autorizacao/` que esta decisao usa. */
export interface AutorizacaoNoEnvio {
  readonly base: BaseDeAutorizacao;
  readonly ator: AtorDeAutorizacao;
}

/**
 * O destino existe? — `get_post( $post_id )` (`media-new.php:24`).
 *
 * Ligacao tardia para BC-01 (AD-10): a leitura e de `posts`, e `posts` e do
 * contexto de conteudo. Devolve booleano e nao o registro porque e so isto que
 * esta pergunta faz com ele; o que o envio le do destino — tipo e data, para a
 * retrodatacao de `enviar-arquivo.ts` — e outra leitura, declarada no contexto.
 */
export type DestinoExiste = (conteudoId: number) => boolean;

/**
 * **CA-1.1 e CA-1.6.** As duas perguntas, na ordem do legado, com a consequencia
 * da segunda decidida pela superficie.
 *
 * A ordem e observavel: `upload_files` primeiro, e e por isso que quem nao pode
 * enviar **nem chega** a leitura do destino — nenhuma consulta sai por um envio
 * recusado na primeira pergunta, e o teste afirma isso pela porta que registra
 * comando.
 *
 * `conteudoDeDestino` igual a {@link SEM_CONTEUDO_DE_DESTINO} significa *"o
 * pedido nao trouxe destino"*, que e o `! isset( $_REQUEST['post_id'] )` do
 * legado: nesse caso a segunda pergunta **nao e feita**, e o anexo nasce sem pai
 * pelo caminho normal.
 */
export function autorizarEnvio(
  autorizacao: AutorizacaoNoEnvio,
  superficie: SuperficieDeEnvio,
  conteudoDeDestino: number,
  destinoExiste: DestinoExiste,
): DecisaoDeEnvio {
  const contexto = comAtor(autorizacao.base, autorizacao.ator);

  if (!perguntarPermissao(contexto, CAPACIDADE_DE_ENVIAR_ARQUIVO)) {
    return {
      desfecho: 'recusado',
      mensagem: MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
    };
  }

  if (conteudoDeDestino === SEM_CONTEUDO_DE_DESTINO) {
    return { desfecho: 'autorizado', conteudoDeDestino };
  }

  /*
    A existencia do destino so e perguntada nas duas superficies que a
    perguntam. A do editor nao pergunta (`ajax-actions.php:2633`) e deixa o
    objeto inexistente para a traducao de `edit_post`, que o resolve em
    `do_not_allow`. Uma leitura a mais aqui seria uma consulta que aquela
    superficie nao emite.
  */
  const descartaDestino =
    SUPERFICIES_QUE_DESCARTAM_O_DESTINO.includes(superficie);

  const destinoAusente = descartaDestino && !destinoExiste(conteudoDeDestino);

  const podeEditarDestino =
    !destinoAusente &&
    perguntarPermissao(
      contexto,
      CAPACIDADE_DE_EDITAR_CONTEUDO,
      conteudoDeDestino,
    );

  if (podeEditarDestino) {
    return { desfecho: 'autorizado', conteudoDeDestino };
  }

  if (descartaDestino) {
    return {
      desfecho: 'destino-descartado',
      conteudoDeDestino: SEM_CONTEUDO_DE_DESTINO,
    };
  }

  return {
    desfecho: 'recusado',
    mensagem: MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  };
}
