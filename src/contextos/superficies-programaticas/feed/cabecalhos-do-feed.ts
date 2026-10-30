/**
 * Os cabecalhos que `send_headers()` poe quando o pedido e de feed: o tipo de
 * conteudo, `Last-Modified`, `ETag` e o `304` do GET condicional.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8). E o ramo
 * `else` de `WP::send_headers()` (`wp-includes/class-wp.php:469`-`:539`), e so
 * ele: o resto do metodo — os cabecalhos de nao guardar da sessao, o `404` por
 * criterio `error`, o tipo HTML, o `X-Pingback` do singular e o filtro
 * `wp_headers` — e da borda de `004-leitura-publica`
 * (`requisicao/atender-leitura-publica.ts`, etapa 6).
 *
 * Tres coisas deste ramo que um porte erra:
 *
 * 1. **O ramo le o formato CRU**, `$this->query_vars['feed']`, e nao o de
 *    `WP_Query`. Para `?feed=comments-atom` o tipo e `feed_content_type(
 *    'comments-atom' )` — `application/octet-stream` —, e quem conserta e o
 *    `header()` do modelo, depois (`./modelos-do-feed.ts`). So `'feed'` vira o
 *    formato padrao aqui; `''` nem entra no ramo.
 * 2. **`empty()` decide a entrada**: `?feed=0` e pedido de feed para
 *    `WP_Query` (`'' !== $qv['feed']`, ver
 *    `leitura-publica/consulta/semantica-de-php.ts`), mas aqui `empty( '0' )` e
 *    verdadeiro e o pedido recebe o tipo HTML. {@link entraNoRamoDeFeed}.
 * 3. **A data de comentario so conta para feed de comentario ou de singular**
 *    (`:479`-`:501`): `withcomments`, o prefixo `comments-`, ou um identificador
 *    de conteudo sem `withoutcomments`. No resto, so a de conteudo.
 *
 * O `ETag` e o `md5()` do texto de `Last-Modified` **com** o `' GMT'`, entre
 * aspas (`:507`-`:508`). Conferido no oraculo: `Sun, 11 Oct 2026 22:10:37 GMT` da
 * `"cbae840be34b312fa55485472cab47b4"`.
 */

import { createHash } from 'node:crypto';

import type { DatasDoFeed } from './contexto-do-feed.js';
import { FORMATO_DE_DATA_DO_CABECALHO, formatarDataDaColuna, formatarRelogio } from './datas-do-feed.js';

/**
 * As variaveis de `WP::$query_vars` que o ramo le, cruas, como `parse_request()`
 * as deixou. Valor ausente e `empty()`.
 */
export interface VariaveisDoPedidoDeFeed {
  readonly feed?: string;
  readonly error?: string;
  readonly withcomments?: string;
  readonly withoutcomments?: string;
  readonly p?: string;
  readonly name?: string;
  readonly page_id?: string;
  readonly pagename?: string;
  readonly attachment?: string;
  readonly attachment_id?: string;
}

/** Os dois cabecalhos do GET condicional, como chegaram (`$_SERVER`). */
export interface PedidoCondicional {
  /** `HTTP_IF_NONE_MATCH`. */
  readonly ifNoneMatch?: string;
  /** `HTTP_IF_MODIFIED_SINCE`. */
  readonly ifModifiedSince?: string;
}

/** O que o ramo decide. */
export interface CabecalhosDoRamoDeFeed {
  readonly cabecalhos: {
    readonly 'Content-Type': string;
    readonly 'Last-Modified': string;
    readonly ETag: string;
  };
  /** `304` com `exit`: o modelo nao chega a ser carregado. */
  readonly naoModificado: boolean;
}

/** `empty()` sobre uma variavel de consulta. */
function vazio(valor: string | undefined): boolean {
  return valor === undefined || valor === '' || valor === '0';
}

/** `empty( $query_vars['error'] ) && ! empty( $query_vars['feed'] )` (`:455` e `:467`). */
export function entraNoRamoDeFeed(variaveis: VariaveisDoPedidoDeFeed): boolean {
  return vazio(variaveis.error) && !vazio(variaveis.feed);
}

/** `stripslashes()` — o `wp_unslash()` de `HTTP_IF_NONE_MATCH` (`:515`). */
function semBarras(texto: string): string {
  return texto.replace(/\\(.?)/gs, (_casado, seguinte: string) => (seguinte === '0' ? '\0' : seguinte));
}

/**
 * `strtotime()` sobre um texto de data HTTP, em segundos, ou `null` quando nao
 * se le. ⚠️ `strtotime()` aceita muito mais forma que isto; o que se le aqui e
 * o que `Date.parse()` le, que cobre as tres formas de data HTTP (RFC 9110
 * secao 5.6.7). Forma exotica pode divergir; a de cliente HTTP real, nao.
 */
function segundosDaData(texto: string): number | null {
  const milissegundos = Date.parse(texto);
  return Number.isNaN(milissegundos) ? null : Math.floor(milissegundos / 1000);
}

/** `strtotime( mysql2date( 'D, d M Y H:i:s', $coluna, false ) )`, ou `null` (o `false`). */
function segundosDaColuna(coluna: string | false): number | null {
  if (coluna === false || coluna === '') {
    return null;
  }
  const texto = formatarDataDaColuna(coluna, FORMATO_DE_DATA_DO_CABECALHO);
  return texto === '' ? null : segundosDaData(`${texto} GMT`);
}

/**
 * O ramo de feed de `send_headers()`. Chame so quando {@link entraNoRamoDeFeed}
 * e verdadeiro.
 */
export function cabecalhosDoRamoDeFeed(
  variaveis: VariaveisDoPedidoDeFeed,
  condicional: PedidoCondicional,
  datas: DatasDoFeed,
  blogCharset: string,
  formatoPadrao: string,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): CabecalhosDoRamoDeFeed {
  const formato = variaveis.feed ?? '';
  const tipo = formato === 'feed' ? formatoPadrao : formato;
  const tipoDeConteudo = `${tipoDeConteudoDoFeed(tipo)}; charset=${blogCharset}`;

  const comComentarios =
    !vazio(variaveis.withcomments) ||
    formato.includes('comments-') ||
    (vazio(variaveis.withoutcomments) &&
      (!vazio(variaveis.p) ||
        !vazio(variaveis.name) ||
        !vazio(variaveis.page_id) ||
        !vazio(variaveis.pagename) ||
        !vazio(variaveis.attachment) ||
        !vazio(variaveis.attachment_id)));

  let ultima: string | false;
  const deConteudo = datas.ultimaModificacaoDeConteudoGmt;
  if (comComentarios) {
    const deComentario = datas.ultimaModificacaoDeComentarioGmt;
    // `strtotime( $post ) > strtotime( $comment )`, com o `false` do PHP: um
    // inteiro e maior que `false`, e `false` nao e maior que nada.
    const segundosDoConteudo = segundosDaColuna(deConteudo);
    const segundosDoComentario = segundosDaColuna(deComentario);
    const conteudoMaisNovo =
      segundosDoConteudo !== null &&
      (segundosDoComentario === null || segundosDoConteudo > segundosDoComentario);
    ultima = conteudoMaisNovo ? deConteudo : deComentario;
  } else {
    ultima = deConteudo;
  }

  let texto = ultima === false ? '' : formatarDataDaColuna(ultima, FORMATO_DE_DATA_DO_CABECALHO);
  if (texto === '') {
    texto = formatarRelogio(datas.agora(), FORMATO_DE_DATA_DO_CABECALHO);
  }
  const ultimaModificacao = `${texto} GMT`;
  const etiqueta = `"${createHash('md5').update(ultimaModificacao).digest('hex')}"`;

  // GET condicional (`:513`-`:538`). `'0'` e falso no PHP, como o texto vazio.
  const etiquetaDoCliente =
    condicional.ifNoneMatch === undefined ? '' : semBarras(condicional.ifNoneMatch);
  const dataDoCliente =
    condicional.ifModifiedSince === undefined ? '' : condicional.ifModifiedSince.trim();
  const verdadeiro = (valor: string): boolean => valor !== '' && valor !== '0';
  const segundosDoCliente = verdadeiro(dataDoCliente) ? segundosDaData(dataDoCliente) : 0;
  const segundosDoSite = segundosDaData(ultimaModificacao);
  const naoMaisNovo =
    segundosDoCliente !== null && segundosDoSite !== null && segundosDoCliente >= segundosDoSite;
  const mesmaEtiqueta = etiquetaDoCliente === etiqueta;
  const naoModificado =
    verdadeiro(dataDoCliente) && verdadeiro(etiquetaDoCliente)
      ? naoMaisNovo && mesmaEtiqueta
      : naoMaisNovo || mesmaEtiqueta;

  return {
    cabecalhos: {
      'Content-Type': tipoDeConteudo,
      'Last-Modified': ultimaModificacao,
      ETag: etiqueta,
    },
    naoModificado,
  };
}
