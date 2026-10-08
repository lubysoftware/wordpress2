/**
 * **CA-11.3**: o estado de rascunho automatico nao pode ser pedido por quem
 * chama a API — ele e criado so pelo caminho de `abrir-editor.ts`.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11). A recusa
 * **nao esta** em `wp_insert_post()`, e isso ja foi apurado por T005 e esta
 * escrito em `../gravacao/estado-na-gravacao.ts`: recusa-la ali fecharia o
 * `wp_insert_post()` que o proprio nucleo chama para criar o rascunho
 * automatico. A recusa esta nas **superficies**, e e por isso que este arquivo
 * declara a regra e nao a aplica no caminho de escrita.
 *
 * ---
 *
 * # O mecanismo, que e uma derivacao e nao uma lista
 *
 * `class-wp-rest-posts-controller.php:2485` declara o parametro de escrita
 * `status` assim:
 *
 * ```php
 * 'enum' => array_keys( get_post_stati( array( 'internal' => false ) ) ),
 * ```
 *
 * Isto e: **todo** estado registrado que nao seja interno, e nenhum dos
 * internos. `auto-draft` e interno (`wp-includes/post.php:748`), logo nao entra
 * — e junto com ele ficam fora `trash`, `inherit` e os quatro `request-*`.
 *
 * **A derivacao e a regra, e nao a lista de cinco nomes que ela produz hoje**, e
 * essa distincao e o conteudo do **P2**: `register_post_status()` e ponto de
 * extensao publico, e um estado que terceiro registre como nao interno **entra
 * na enumeracao sozinho**, sem que ninguem edite o nucleo. Um porte que cravasse
 * `['publish','future','draft','pending','private']` recusaria estado de
 * extensao que o legado aceita — e isso cai na tabela *Nao negociavel* da
 * constituicao. Por isso {@link estadosPedveisPelaApi} recebe o registro e
 * filtra, em vez de devolver constante.
 *
 * ## A excecao de `check_status()`, que mantem "e criado so por este caminho" verdadeiro
 *
 * `check_status()` (`class-wp-rest-posts-controller.php:1546`) roda **antes** da
 * validacao de enumeracao e tem um atalho, com o docblock explicando para que:
 *
 * > *"Allows for sending an update request with the current status, even if that
 * > status would not be acceptable."*
 *
 * ```php
 * if ( $request['id'] ) {
 *     $post = $this->get_post( $request['id'] );
 *     if ( ! is_wp_error( $post ) && $post->post_status === $status ) {
 *         return true;
 *     }
 * }
 * ```
 *
 * Logo: **atualizar** um rascunho automatico mandando `status=auto-draft` passa;
 * **criar** com `status=auto-draft` nao passa. Isso nao enfraquece CA-11.3 — ele
 * diz *"e **criado** so por este caminho"*, e continua sendo: o atalho preserva
 * um estado que ja estava na coluna, e nao produz nenhum registro novo nele. O
 * editor em bloco depende desse atalho para salvar sem publicar o rascunho que o
 * nucleo acabou de criar.
 *
 * ---
 *
 * # As quatro superficies, e o que cada uma faz com `auto-draft` pedido
 *
 * | superficie | onde | o que faz |
 * |---|---|---|
 * | API REST, escrita | `class-wp-rest-posts-controller.php:2485` | **recusa**, com {@link CODIGO_DE_PARAMETRO_INVALIDO} e **400** — ver {@link recusaDeEstadoPedidoPelaApi} |
 * | Painel | `wp-admin/includes/post.php:111` | **reescreve** para `draft`, sem recusar — {@link reescreverEstadoPedidoNoPainel} |
 * | XML-RPC `mw_newPost` / `metaWeblog` | `class-wp-xmlrpc-server.php:5533` | **ignora**: o `switch` so aceita quatro estados e o `default` esta *"deliberably left empty"* |
 * | XML-RPC `wp_newPost` / `wp_editPost` | `class-wp-xmlrpc-server.php:1526` | 🔴 **aceita** — ver abaixo |
 *
 * ## 🔴 A quarta linha e uma divergencia real, declarada e nao resolvida
 *
 * `_insert_post()` do XML-RPC tem o mesmo `switch` da API REST, com o mesmo
 * `default` (`class-wp-xmlrpc-server.php:1525`-`:1529`):
 *
 * ```php
 * default:
 *     if ( ! get_post_status_object( $post_data['post_status'] ) ) {
 *         $post_data['post_status'] = 'draft';
 *     }
 *     break;
 * ```
 *
 * A pergunta e *"este estado existe no registro?"*, e **`auto-draft` existe**.
 * Logo `wp_newPost` com `post_status = 'auto-draft'` **nao e recusado e nao e
 * reescrito**: o valor atravessa e chega a coluna. A API REST so nao tem o mesmo
 * buraco porque a validacao de enumeracao do esquema roda **antes** deste
 * `switch` e barra o valor primeiro; o XML-RPC nao tem esquema.
 *
 * ⚠️ E o caminho e **exatamente** o que CA-11.3 descreve como impossivel: quem
 * chama a API pede o estado e o obtem. Vale lembrar que, nesse mesmo caminho, o
 * registro foi criado por `get_default_post_to_edit( ..., true )`
 * (`:1579`) — isto e, **em `auto-draft` de qualquer forma** —, de modo que o que
 * o pedido consegue e *manter* o estado em vez de sair dele. A frase *"e criado
 * so por este caminho"* sobrevive; a frase *"nao pode ser pedido"* nao.
 *
 * **T023 nao escolhe entre o criterio e o codigo.** Ela:
 *
 * 1. **recusa** pela regra da API REST, que e a superficie que CA-11.3 nomeia e
 *    a unica com enumeracao declarada;
 * 2. **reescreve** pela regra do painel, que e a segunda superficie e nao
 *    recusa;
 * 3. **declara** o terceiro e o quarto caminho em {@link SUPERFICIES_DO_ESTADO_PEDIDO},
 *    com ancora, sem fechar o quarto. Fechar o XML-RPC aqui tornaria o sistema
 *    novo **mais fechado** que o legado numa superficie que a resposta 14 de
 *    `questions.md` manda portar inteira (`ESC-SUPERFICIES`), e o **P1** exige
 *    decisao humana registrada para divergir. Nenhuma existe.
 *
 * Mesmo precedente de T003 com CA-1.1, de T017 com CA-8.4 e de
 * `visibilidade-do-rascunho-automatico.ts` com CA-11.2.
 */

import {
  ESTADOS_EDITORIAIS,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
} from '../estado-editorial.js';
import { ESTADO_DE_RASCUNHO_AUTOMATICO } from './visibilidade-do-rascunho-automatico.js';

/**
 * Um estado como o registro o publica para esta decisao: o nome e se ele e
 * interno.
 *
 * E o recorte de `get_post_stati( array( 'internal' => false ) )`, e nada mais:
 * a enumeracao do parametro de escrita olha **um** campo. Chega como dado, e nao
 * e lido do vocabulario de fabrica dentro desta funcao, porque o registro e
 * **aberto** — ver a secao *"A derivacao e a regra"* no cabecalho.
 */
export interface EstadoRegistrado {
  readonly nome: string;
  /** `$status_obj->internal`. `auto-draft` e `true`. */
  readonly interno: boolean;
}

/**
 * Os 12 estados de fabrica na forma que {@link estadosPedveisPelaApi} recebe,
 * derivados do registro que T001 leu.
 *
 * E conveniencia para quem monta o contexto de uma instalacao **sem extensao
 * nenhuma** — e, no teste, o cenario de fabrica. Quem tiver estado registrado
 * por extensao passa a propria lista.
 */
export const ESTADOS_REGISTRADOS_DE_FABRICA: readonly EstadoRegistrado[] =
  Object.freeze(
    ESTADOS_EDITORIAIS.map((nome) =>
      Object.freeze({
        nome,
        interno: PROPRIEDADES_DO_ESTADO_EDITORIAL[nome].interno,
      }),
    ),
  );

/**
 * A enumeracao do parametro de **escrita** `status` da API —
 * `array_keys( get_post_stati( array( 'internal' => false ) ) )`
 * (`class-wp-rest-posts-controller.php:2485`).
 *
 * **A ordem e a do registro**, e ela e observavel: a enumeracao vai para o
 * esquema publicado em `/wp-json` e entra, na mesma ordem, no texto da mensagem
 * de erro de {@link mensagemDeEstadoForaDaEnumeracao}. Reordenar aqui mudaria
 * dois contratos de terceiro ao mesmo tempo — e a area 1 da Decisao 2 compara
 * **byte a byte**.
 */
export function estadosPedveisPelaApi(
  registro: readonly EstadoRegistrado[] = ESTADOS_REGISTRADOS_DE_FABRICA,
): readonly string[] {
  return registro.filter((estado) => !estado.interno).map((estado) => estado.nome);
}

/**
 * **CA-11.3.** Se o estado pedido pode ser pedido pela API de escrita.
 *
 * `estadoAtualDoConteudo` e o atalho de `check_status()`: informado e igual ao
 * estado pedido, a resposta e `true` mesmo para estado fora da enumeracao — ver
 * a secao *"A excecao de `check_status()`"* no cabecalho. `null` (o caso de
 * **criacao**, em que `$request['id']` e vazio) nao tem atalho.
 */
export function estadoPodeSerPedidoPelaApi(
  estadoPedido: string,
  estadoAtualDoConteudo: string | null = null,
  registro: readonly EstadoRegistrado[] = ESTADOS_REGISTRADOS_DE_FABRICA,
): boolean {
  if (estadoAtualDoConteudo !== null && estadoAtualDoConteudo === estadoPedido) {
    return true;
  }

  return estadosPedveisPelaApi(registro).includes(estadoPedido);
}

/**
 * O codigo de erro **interno** da validacao de enumeracao
 * (`wp-includes/rest-api.php:2159`).
 *
 * Ele nao e o codigo que o cliente recebe no corpo: ele viaja em `details`,
 * dentro do erro de {@link CODIGO_DE_PARAMETRO_INVALIDO}. Os dois sao superficie
 * publicada (P8), e por isso os dois estao nomeados.
 */
export const CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO = 'rest_not_in_enum';

/**
 * O codigo de erro que a API devolve ao cliente quando um parametro nao valida
 * (`wp-includes/rest-api/class-wp-rest-request.php:963`).
 */
export const CODIGO_DE_PARAMETRO_INVALIDO = 'rest_invalid_param';

/** O codigo HTTP da recusa (`class-wp-rest-request.php:967`). */
export const CODIGO_HTTP_DE_PARAMETRO_INVALIDO = 400;

/** O nome do parametro, como o esquema o declara. */
export const PARAMETRO_DE_ESTADO = 'status';

/*
  ── OS DOIS TEXTOS, COM A MONTAGEM QUE O LEGADO FAZ ─────────────────────────

  Os dois `msgid` ficam em ingles pela mesma razao de
  `permissao-do-editor.ts`: `EC-05` fixa que o `msgid` em ingles E a chave do
  catalogo.
*/

/**
 * O `msgid` da mensagem externa — `'Invalid parameter(s): %s'`
 * (`class-wp-rest-request.php:965`).
 *
 * O `%s` recebe a lista de **nomes de parametro** invalidos, juntada com
 * `', '`. Nesta recusa a lista tem um item: `status`.
 */
export const MENSAGEM_DE_PARAMETRO_INVALIDO = 'Invalid parameter(s): %s';

/**
 * O `msgid` da mensagem interna com mais de um valor valido —
 * `'%1$s is not one of %2$l.'` (`wp-includes/rest-api.php:2159`).
 *
 * ⚠️ **O `%l` nao e do `sprintf` de ninguem**: e uma extensao do legado
 * (`wp_sprintf_l()`, `wp-includes/formatting.php:5399`) que junta a lista com
 * `', '` entre os itens e `', and '` antes do ultimo. Reproduzir com um `join`
 * simples muda a mensagem de erro de um contrato de terceiro.
 *
 * O legado tem um segundo `msgid` para o caso de **um** valor valido —
 * `'%1$s is not %2$s.'` (`:2155`) —, que nesta recusa nao ocorre: a enumeracao
 * de fabrica tem cinco. Ele fica declarado em
 * {@link MENSAGEM_DE_ESTADO_FORA_DE_UM_UNICO_VALOR} porque uma instalacao que
 * registre estados pode chegar la.
 */
export const MENSAGEM_DE_ESTADO_FORA_DA_ENUMERACAO = '%1$s is not one of %2$l.';

/** O par do de cima para enumeracao de um unico valor (`wp-includes/rest-api.php:2155`). */
export const MENSAGEM_DE_ESTADO_FORA_DE_UM_UNICO_VALOR = '%1$s is not %2$s.';

/**
 * A mensagem interna montada — o que `rest_not_in_enum` carrega.
 *
 * A juncao e a de `wp_sprintf_l()`: `', '` entre os itens, `', and '` antes do
 * ultimo, e **sem** separador quando sao dois (`' and '`).
 */
export function mensagemDeEstadoForaDaEnumeracao(
  estadosValidos: readonly string[],
): string {
  if (estadosValidos.length === 1) {
    return `${PARAMETRO_DE_ESTADO} is not ${estadosValidos[0]}.`;
  }
  return `${PARAMETRO_DE_ESTADO} is not one of ${juntarComoNoLegado(estadosValidos)}.`;
}

/**
 * `wp_sprintf_l()` para o recorte que esta recusa usa
 * (`wp-includes/formatting.php:5399`-`:5452`).
 *
 * Os tres separadores sao os do legado, e os tres sao **traduziveis** e passam
 * pelo filtro `wp_sprintf_l` — que e ponto de extensao publico e nao e emitido
 * nesta arvore (REQ-162). A implementacao completa, com o filtro, e de
 * `plataforma/formatacao/` (feature 015); o que esta aqui e o suficiente para a
 * mensagem desta recusa, e esta anotado para nao ser confundido com a funcao
 * inteira.
 */
function juntarComoNoLegado(itens: readonly string[]): string {
  if (itens.length === 0) {
    return '';
  }
  if (itens.length === 1) {
    return itens[0] as string;
  }
  if (itens.length === 2) {
    return `${itens[0]} and ${itens[1]}`;
  }
  const ultimo = itens[itens.length - 1] as string;
  return `${itens.slice(0, -1).join(', ')}, and ${ultimo}`;
}

/** A recusa da API, devolvida **como valor**. */
export interface RecusaDeEstadoPedido {
  /** O codigo que vai no corpo da resposta. */
  readonly codigo: typeof CODIGO_DE_PARAMETRO_INVALIDO;
  /** `Invalid parameter(s): status`. */
  readonly mensagem: string;
  readonly codigoHttp: typeof CODIGO_HTTP_DE_PARAMETRO_INVALIDO;
  /** O erro interno, como o legado o leva em `details`. */
  readonly detalhe: {
    readonly codigo: typeof CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO;
    readonly mensagem: string;
  };
}

/**
 * **CA-11.3.** A recusa da API para um estado fora da enumeracao de escrita.
 *
 * Devolve `null` quando o estado pode ser pedido — mesma forma de
 * `autorizarAberturaDoEditor()` e das guardas de T003: ausencia de recusa e a
 * autorizacao.
 *
 * ⚠️ **Nao e recusa de permissao, e a diferenca e observavel.** Pedir `publish`
 * sem a capacidade de publicar devolve `rest_cannot_publish` com **403**
 * (T003, `../publicacao/permissao-de-publicacao.ts`); pedir `auto-draft`
 * devolve `rest_invalid_param` com **400**, para **qualquer** ator, inclusive o
 * administrador. O estado nao e negado por falta de poder: ele nao existe no
 * vocabulario daquele parametro.
 */
export function recusaDeEstadoPedidoPelaApi(
  estadoPedido: string,
  estadoAtualDoConteudo: string | null = null,
  registro: readonly EstadoRegistrado[] = ESTADOS_REGISTRADOS_DE_FABRICA,
): RecusaDeEstadoPedido | null {
  if (estadoPodeSerPedidoPelaApi(estadoPedido, estadoAtualDoConteudo, registro)) {
    return null;
  }

  return {
    codigo: CODIGO_DE_PARAMETRO_INVALIDO,
    // `sprintf( __( 'Invalid parameter(s): %s' ), implode( ', ', array_keys( $invalid_params ) ) )`
    // (`class-wp-rest-request.php:965`). A lista tem um item: `status`.
    mensagem: MENSAGEM_DE_PARAMETRO_INVALIDO.replace('%s', PARAMETRO_DE_ESTADO),
    codigoHttp: CODIGO_HTTP_DE_PARAMETRO_INVALIDO,
    detalhe: {
      codigo: CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO,
      mensagem: mensagemDeEstadoForaDaEnumeracao(
        estadosPedveisPelaApi(registro),
      ),
    },
  };
}

/**
 * **CA-11.3 pela outra ponta**: o painel **nao recusa, reescreve**
 * (`wp-admin/includes/post.php:110`-`:113`).
 *
 * ```php
 * // No longer an auto-draft.
 * if ( 'auto-draft' === $post_data['post_status'] ) {
 *     $post_data['post_status'] = 'draft';
 * }
 * ```
 *
 * O comentario e do legado e diz o porque: o formulario da tela de edicao **leva
 * o estado atual num campo escondido**, e o estado atual de um conteudo
 * recem-aberto e `auto-draft`. Recusar ali faria a primeira gravacao de todo
 * conteudo novo falhar. O mesmo campo escondido ja chega com `draft` em lugar de
 * `auto-draft` na caixa de publicacao (`wp-admin/includes/meta-boxes.php:143`),
 * e esta reescrita e o cinto de seguranca do servidor.
 *
 * A mesma reescrita acontece em mais dois pontos do painel, e os tres estao
 * declarados em {@link SUPERFICIES_DO_ESTADO_PEDIDO}: a previa
 * (`wp-admin/includes/post.php:2112`) e o salvamento automatico (`:2172`) — este
 * ultimo e CA-11.4, e esta em `salvamento-automatico.ts`.
 *
 * ⚠️ **A reescrita e literal e nao passa por {@link ESTADO_DE_RASCUNHO_AUTOMATICO}
 * no lado do destino**: o legado grava a cadeia `'draft'`, que aqui vem de
 * `ESTADO_PADRAO_DA_APLICACAO`. Sao o mesmo valor por coincidencia de produto, e
 * nao por derivacao — e o default da aplicacao e `draft` porque *"publicar e ato
 * explicito"* (BR-MIGRAR-001), nao porque o rascunho automatico vire rascunho.
 */
export function reescreverEstadoPedidoNoPainel(
  estadoPedido: string,
  estadoPadraoDaAplicacao: string,
): string {
  return estadoPedido === ESTADO_DE_RASCUNHO_AUTOMATICO
    ? estadoPadraoDaAplicacao
    : estadoPedido;
}

/**
 * O que cada superficie do legado faz com `auto-draft` **pedido**, com a ancora
 * de cada uma.
 *
 * Declarado como dado, e nao so em prosa, para que o teste desta tarefa possa
 * afirmar que a divergencia do quarto item esta **declarada** — que e o que o P1
 * pede de uma divergencia: existir citada no codigo, nao resolvida em silencio.
 */
export const SUPERFICIES_DO_ESTADO_PEDIDO: readonly {
  readonly superficie: string;
  readonly desfecho: 'recusa' | 'reescreve' | 'ignora' | 'aceita';
  readonly ancora: string;
}[] = Object.freeze([
  Object.freeze({
    superficie: 'API REST, parametro de escrita',
    desfecho: 'recusa' as const,
    ancora:
      'wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:2485',
  }),
  Object.freeze({
    superficie: 'painel, traducao do formulario de edicao',
    desfecho: 'reescreve' as const,
    ancora: 'wp-admin/includes/post.php:111',
  }),
  Object.freeze({
    superficie: 'painel, previa',
    desfecho: 'reescreve' as const,
    ancora: 'wp-admin/includes/post.php:2112',
  }),
  Object.freeze({
    superficie: 'painel, salvamento automatico',
    desfecho: 'reescreve' as const,
    ancora: 'wp-admin/includes/post.php:2172',
  }),
  Object.freeze({
    superficie: 'XML-RPC, mw_newPost',
    desfecho: 'ignora' as const,
    ancora: 'wp-includes/class-wp-xmlrpc-server.php:5533',
  }),
  Object.freeze({
    superficie: 'XML-RPC, wp_newPost e wp_editPost',
    desfecho: 'aceita' as const,
    ancora: 'wp-includes/class-wp-xmlrpc-server.php:1526',
  }),
]);
