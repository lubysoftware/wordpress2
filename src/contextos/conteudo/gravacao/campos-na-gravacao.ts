/**
 * Os defaults do pedido e as 21 colunas resolvidas — a parte de
 * `wp_insert_post()` que nao e decisao de estado nem de data.
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao`. O que este arquivo
 * tem de nao fazer e mais importante do que o que ele faz: **cada campo abaixo
 * e resolvido pela pergunta que o legado faz sobre ele, e sao tres perguntas
 * diferentes.** O legado usa `empty()`, `isset()` e `??` lado a lado, no mesmo
 * bloco, e as tres discordam para o mesmo valor:
 *
 * | pergunta | `''` | `'0'` | `0` | `null` | ausente |
 * |---|---|---|---|---|---|
 * | `empty( $x )` → cai no default | sim | **sim** | sim | sim | sim |
 * | `isset( $x )` → usa o valor | **usa** | usa | usa | nao | nao |
 * | `$x ?? $default` → usa o valor | **usa** | usa | usa | nao | nao |
 *
 * Trocar uma pela outra nao muda nada em entrada bem-comportada e muda o valor
 * gravado em quatro colunas quando a entrada tem vazio — `comment_status`,
 * `ping_status`, `post_password` e `to_ping` —, e isso e efeito no banco (area 3
 * da Decisao 2). A pergunta de cada campo esta no `@see` dele.
 *
 * ---
 *
 * # Os tres campos deste arquivo que um porte distraido faria diferente
 *
 * 1. **Atualizar sem informar `comment_status` FECHA os comentarios**
 *    (`:4812`-`:4820`). Na insercao o vazio cai no default do tipo; na
 *    atualizacao ele cai no literal `'closed'`. Quem chama pela superficie nao
 *    percebe porque `wp_update_post()` mistura a linha existente antes
 *    (`:5366`), logo o valor nunca chega vazio ali — mas quem chama
 *    `wp_insert_post()` com `ID` e sem `comment_status` fecha os comentarios de
 *    um conteudo que os tinha abertos. E observavel, e esta reproduzido.
 * 2. **`private` apaga a senha** (`:4841`-`:4843`), e a ordem importa: a senha e
 *    lida do pedido e **depois** descartada se o estado resolvido e `private`.
 *    E a metade de US-4 (T009) que mora nesta funcao — mesmo precedente do
 *    `inherit` do anexo em `estado-na-gravacao.ts`: a linha e desta funcao, o
 *    critério e da tarefa dela.
 * 3. **O autor default e o ator da requisicao, nao o autor anterior**
 *    (`:4824`). Numa atualizacao feita por `wp_insert_post()` sem
 *    `post_author`, a autoria passa para quem gravou. E o cenario
 *    `@concorrencia` de `PT-002` — *"a autoria gravada em cada conteudo
 *    corresponde a quem o gravou"* — e e por isso que o ator chega pelo
 *    contexto, por argumento, e nao de estado de modulo (`EXT-CONTEXTO`).
 *
 * ---
 *
 * # O que este arquivo NAO porta, com o dono de cada ausencia
 *
 * | ausencia | ancora | de quem e |
 * |---|---|---|
 * | `sanitize_post( $postarr, 'db' )` — a cadeia de filtros `pre_*` por campo | `:4632` | `plataforma/` (os filtros) e 🔴 REQ-030 (a sanitizacao do corpo), **fora do pacote** |
 * | `sanitize_trackback_urls( $to_ping )` | `:4826` | `plataforma/formatacao`, feature 015. O valor passa **como veio** |
 * | `wp_encode_emoji()` nas tres colunas de texto | `:4936`-`:4945` | `plataforma/dados`: a decisao depende do charset **da coluna** (`get_col_charset`), que e da camada de dados |
 * | `wp_unslash( $data )` | `:4980` | `plataforma/formatacao`. Nesta arvore nada acrescenta barra, logo a funcao seria identidade — e identidade escondida e pior do que ausencia declarada |
 * | o identificador na URL sanitizado, unico e derivado do titulo | `:4742`-`:4761`, `:4906`, `:5046` | **T007** (US-3) — ver o aviso em {@link resolverIdentificadorNaUrl} |
 * | o esvaziamento do identificador de quem nao pode publicar | `:4726`-`:4739` | **T015** (US-7, CA-7.4) |
 * | o sufixo `__trashed` na entrada e na saida da lixeira | `:4871`-`:4902` | feature 005 (`PT-003`) |
 * | a categoria padrao e o `tax_input` do caminho de gravacao | `:4709`-`:4724`, `:5053`-`:5108` | BC-02; a metade que esta feature cobra (CA-1.4) foi entregue por T003 |
 */

import { TIPO_DE_ANEXO } from '../armazenamento/index.js';
import type {
  ContextoDeGravacao,
  PedidoDeGravacao,
} from './contexto-de-gravacao.js';
import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import { TIPO_PADRAO_DA_GRAVACAO } from './estado-na-gravacao.js';
import { vazioComoNoPhp } from './verdade-de-php.js';

/**
 * `'closed'` — o que a **atualizacao** grava em `comment_status` quando o pedido
 * nao o informa (`:4814`).
 *
 * Ver o item 1 do cabecalho: e o literal do legado, nao o default do tipo.
 */
export const ESTADO_DE_COMENTARIO_NA_ATUALIZACAO = 'closed';

/**
 * `'private'` — o estado que apaga a senha do conteudo (`:4841`).
 *
 * Declarado aqui, e nao no vocabulario, pela mesma razao que `ESTADO_PUBLICADO`
 * em `../publicacao/transicao-de-estado.ts`: no vocabulario ha **vocabulario** e
 * aqui ha **regra** — e esta e a comparacao que decide se a coluna de senha vai
 * vazia.
 */
export const ESTADO_PRIVADO = 'private';

/**
 * `wp_parse_args( $postarr, $defaults )` com os 19 defaults de `:4606`-`:4625`.
 *
 * **Preenche so o que esta ausente**, e e isso que o faz a primeira das duas
 * barreiras de US-2 (ver `estado-na-gravacao.ts`). Dois dos 19 defaults nao sao
 * constantes:
 *
 * - `post_author` e `get_current_user_id()` (`:4607`), que chega pelo ator do
 *   contexto;
 * - `post_status` e `'draft'`, que vem da constante do vocabulario
 *   (`ESTADO_PADRAO_DA_APLICACAO`), e **nao** e repetido aqui como literal, para
 *   que os dois defaults de BR-MIGRAR-001 nao possam divergir por descuido.
 *
 * As duas chaves do arranjo do legado que **nao** tem campo neste pedido sao
 * `context` e `filter`: a primeira e do anexo (`:5133`, BC-04) e a segunda e
 * descartada na linha seguinte (`unset( $postarr['filter'] )`, `:4630`) depois de
 * decidir o contexto de `sanitize_post()`. Nenhuma das duas vai para coluna.
 *
 * ⚠️ **Esta funcao preenche e nao resolve, e a diferenca e observavel.**
 * `wp_parse_args()` so completa chave ausente: quem manda `post_status: ''`
 * continua com `''` **neste objeto**, porque o `empty()` que o troca por `draft`
 * e uma linha mais adiante (`:4703`) e trabalha numa **variavel local**, nao no
 * arranjo. E o arranjo e o que chega a dois pontos de extensao — o segundo
 * argumento de `wp_insert_post_empty_content` (`:4695`) e de
 * `wp_insert_post_data` (`:4978`). Resolver o estado aqui mudaria o valor que
 * eles recebem, e o cenario `@ordem-de-emissao` de `PT-002` cobra que *"o valor
 * que cada ponto recebe e identico byte a byte"*.
 *
 * Quem recebe os valores **resolvidos** e um ponto so: o terceiro argumento de
 * `wp_insert_post_parent` (`$new_postarr`, `:4851`-`:4856`), montado em
 * `gravar.ts` a partir das variaveis locais.
 */
export function aplicarDefaultsDoPedido(
  contexto: ContextoDeGravacao,
  pedido: PedidoDeGravacao,
): PedidoDeGravacao {
  return {
    ...pedido,
    autorId: pedido.autorId ?? contexto.ator.contaId,
    corpo: pedido.corpo ?? '',
    corpoFiltrado: pedido.corpoFiltrado ?? '',
    titulo: pedido.titulo ?? '',
    resumo: pedido.resumo ?? '',
    estado: pedido.estado ?? ESTADO_PADRAO_DA_APLICACAO,
    tipo: pedido.tipo ?? TIPO_PADRAO_DA_GRAVACAO,
    estadoDeComentario: pedido.estadoDeComentario ?? '',
    estadoDeNotificacao: pedido.estadoDeNotificacao ?? '',
    senha: pedido.senha ?? '',
    aPingar: pedido.aPingar ?? '',
    pingados: pedido.pingados ?? '',
    paiId: pedido.paiId ?? 0,
    ordemNoMenu: pedido.ordemNoMenu ?? 0,
    guid: pedido.guid ?? '',
    idSugerido: pedido.idSugerido ?? 0,
    data: pedido.data ?? '',
    dataGmt: pedido.dataGmt ?? '',
  };
}

/**
 * `comment_status` (`:4812`-`:4820`).
 *
 * @see `empty()` — logo `'0'` tambem cai no default.
 */
export function resolverEstadoDeComentario(
  contexto: ContextoDeGravacao,
  tipo: string,
  atualizacao: boolean,
  pedido: PedidoDeGravacao,
): string {
  if (!vazioComoNoPhp(pedido.estadoDeComentario)) {
    return pedido.estadoDeComentario;
  }
  return atualizacao
    ? ESTADO_DE_COMENTARIO_NA_ATUALIZACAO
    : contexto.estadoPadraoDeComentario(tipo, 'comment');
}

/**
 * `ping_status` (`:4825`).
 *
 * **Nao tem o ramo de atualizacao do campo de cima**, e a assimetria e do
 * legado: atualizar sem informar `ping_status` cai no default do tipo, e nao em
 * `closed`. Duas colunas vizinhas, duas regras.
 *
 * @see `empty()`
 */
export function resolverEstadoDeNotificacao(
  contexto: ContextoDeGravacao,
  tipo: string,
  pedido: PedidoDeGravacao,
): string {
  if (!vazioComoNoPhp(pedido.estadoDeNotificacao)) {
    return pedido.estadoDeNotificacao;
  }
  return contexto.estadoPadraoDeComentario(tipo, 'pingback');
}

/**
 * `post_password`, com o esvaziamento de `private` (`:4840`-`:4843`).
 *
 * @see `??` — logo cadeia vazia informada **e** cadeia vazia gravada, e `'0'` e
 * uma senha valida de um caractere.
 */
export function resolverSenhaDoConteudo(
  estadoResolvido: string,
  pedido: PedidoDeGravacao,
): string {
  if (estadoResolvido === ESTADO_PRIVADO) {
    return '';
  }
  return pedido.senha ?? '';
}

/**
 * `post_name` — **o valor como ele chega**, e nada mais.
 *
 * O legado faz tres coisas com este campo que **esta tarefa nao faz**, e as tres
 * sao de T007 e T015:
 *
 * 1. `isset( $postarr['post_name'] ) ... elseif ( $update )` (`:4666`-`:4671`):
 *    na atualizacao sem o campo, o identificador da linha existente e mantido.
 *    **Isto esta aqui**, porque sem ele uma atualizacao apagaria o identificador;
 * 2. derivar do titulo quando vazio e o estado **nao** e `draft`, `pending` nem
 *    `auto-draft` (`:4746`-`:4749`), e sanitizar o informado (`:4752`-`:4761`) —
 *    **T007**, e e a dispensa de unicidade de CA-3.1 que explica por que a lista
 *    de tres estados e exatamente a de US-2 e US-7;
 * 3. `wp_unique_post_slug()` (`:4906`) e a segunda escrita que ele provoca
 *    (`:5046`-`:5051`) — **T007**.
 *
 * ⚠️ **Consequencia declarada, e nao silenciosa:** nesta tarefa, gravar conteudo
 * **publicado** sem informar identificador grava a coluna vazia, onde o legado
 * gravaria o titulo sanitizado e unico. Para o rascunho de US-2 o valor coincide
 * — o legado tambem grava vazio —, e para o publicado a diferenca e exatamente o
 * conteudo de T007 (US-3), que e a tarefa seguinte deste caminho e **depende
 * desta**. Esta registrado aqui, na tabela do fim de `index.ts` e no README do
 * modulo, para que ninguem a descubra por endereco quebrado.
 */
export function resolverIdentificadorNaUrl(
  pedido: PedidoDeGravacao,
  identificadorAnterior: string | null,
): string {
  if (pedido.identificadorNaUrl !== undefined) {
    return pedido.identificadorNaUrl;
  }
  return identificadorAnterior ?? '';
}

/**
 * Se este pedido e para **anexo**, que e a pergunta que escolhe entre os dois
 * filtros de dados (`:4947` e `:4961`) e entre os dois textos de erro de banco
 * (`:4999` e `:5032`).
 *
 * Usa o tipo **resolvido**, porque e ele que a comparacao do legado ve neste
 * ponto. ⚠️ Nos passos de **depois** da escrita o legado volta a perguntar pelo
 * tipo **cru** (`'attachment' === $postarr['post_type']`, `:5123` e `:5176`), e
 * a diferenca e alcancavel: `post_type: ''` resolve para `post` e seria anexo
 * para nenhum dos dois. Os passos que usam a pergunta crua nao sao desta tarefa
 * — ficam na tabela do fim de `index.ts`, com o dono.
 */
export function ehAnexo(tipoResolvido: string): boolean {
  return tipoResolvido === TIPO_DE_ANEXO;
}
