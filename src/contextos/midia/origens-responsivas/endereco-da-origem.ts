/**
 * As cinco funcoes de texto de endereco que a lista de origens usa.
 *
 * Entrega de **T013** da feature `006-biblioteca-de-midia` (US-6). Cada uma e
 * o porte de uma funcao do legado no recorte que `wp_calculate_image_srcset()`
 * exercita, e o recorte esta dito em cada uma:
 *
 * | funcao | legado |
 * |---|---|
 * | {@link nomeBase} | `wp_basename()` (`wp-includes/formatting.php:5758`) |
 * | {@link comBarraFinal} | `trailingslashit()` (`wp-includes/formatting.php:2825`, `:2840`) |
 * | {@link pastaRelativaDoAnexo} | `_wp_get_attachment_relative_path()` (`wp-includes/media.php:1345`) |
 * | {@link dominioDoEndereco} | `parse_url()` com o `host` e a `port` de `wp-includes/media.php:1513`-`:1518` |
 * | {@link comEsquemaHttps} | `set_url_scheme( $url, 'https' )` (`wp-includes/link-template.php:3930`) |
 *
 * Moram aqui, e nao em `plataforma/`, porque `plataforma/utilitarios/` ainda nao
 * existe — o mesmo destino que `../armazenamento/verdade-de-php.ts` registrou
 * para o gemeo dele. Quando existir, descem juntas e nenhuma chamada muda.
 */

/**
 * `wp_basename( $path )`: o ultimo segmento, com `/` **e** `\` como separador.
 *
 * O legado chega nisso por `urlencode()`, troca de `%2F` e `%5C` por `/`,
 * `basename()` e `urldecode()` (`formatting.php:5759`); o par
 * `urlencode`/`urldecode` e identidade, logo o que sobra e o corte nos dois
 * separadores. `basename()` ignora as barras finais.
 */
export function nomeBase(caminho: string): string {
  const semBarraFinal = caminho.replace(/[/\\]+$/, '');
  const corte = Math.max(
    semBarraFinal.lastIndexOf('/'),
    semBarraFinal.lastIndexOf('\\'),
  );
  return semBarraFinal.slice(corte + 1);
}

/** `trailingslashit()`: `rtrim( $value, '/\\' ) . '/'`. */
export function comBarraFinal(valor: string): string {
  return valor.replace(/[/\\]+$/, '') + '/';
}

/** O marcador de `_wp_get_attachment_relative_path()` (`media.php:1352`). */
const PASTA_DE_ENVIOS_ANTIGA = 'wp-content/uploads';

/**
 * `_wp_get_attachment_relative_path( $file )` — a pasta do arquivo relativa a
 * area de envios, ou `''`.
 *
 * `dirname()` devolve `.` para nome sem pasta, e o legado troca isso por `''`
 * (`media.php:1348`). Caminho com `wp-content/uploads` dentro e o envio
 * anterior a 2.7, que guardava caminho absoluto: o que vem depois do marcador
 * (`+ 18`, o comprimento dele) e a pasta (`:1352`-`:1355`).
 */
export function pastaRelativaDoAnexo(arquivo: string): string {
  let pasta = pastaDoCaminho(arquivo);

  if (pasta === '.') {
    return '';
  }

  const posicao = pasta.indexOf(PASTA_DE_ENVIOS_ANTIGA);
  if (posicao !== -1) {
    pasta = pasta
      .slice(posicao + PASTA_DE_ENVIOS_ANTIGA.length)
      .replace(/^\/+/, '');
  }

  return pasta;
}

/**
 * `dirname()` do PHP em sistema POSIX: so `/` separa.
 *
 * `''` devolve `''`; sem barra, `.`; so barras, `/`. As barras repetidas antes
 * do ultimo segmento saem junto com ele (`dirname( 'a//b' )` e `a`).
 */
function pastaDoCaminho(caminho: string): string {
  if (caminho === '') {
    return '';
  }
  const semBarraFinal = caminho.replace(/\/+$/, '');
  if (semBarraFinal === '') {
    return '/';
  }
  const corte = semBarraFinal.lastIndexOf('/');
  if (corte === -1) {
    return '.';
  }
  const pasta = semBarraFinal.slice(0, corte).replace(/\/+$/, '');
  return pasta === '' ? '/' : pasta;
}

/**
 * `$parsed['host'] . ':' . $parsed['port']`, ou so o `host`, ou `''`
 * (`media.php:1513`-`:1518`).
 *
 * E o recorte de `parse_url()` que o legado le: a autoridade depois de `//`,
 * sem credencial, com a porta quando ela existe. A porta de `parse_url()` e
 * inteiro, e por isso `:0080` volta como `:80`.
 */
export function dominioDoEndereco(endereco: string): string {
  const autoridade = /^(?:[A-Za-z][A-Za-z0-9+.-]*:)?\/\/([^/?#]*)/.exec(
    endereco,
  )?.[1];
  if (autoridade === undefined) {
    return '';
  }

  const hostEPorta = autoridade.slice(autoridade.lastIndexOf('@') + 1);
  const fimDoHost = hostEPorta.startsWith('[')
    ? hostEPorta.indexOf(']') + 1
    : hostEPorta.lastIndexOf(':');

  if (fimDoHost <= 0 || hostEPorta[fimDoHost] !== ':') {
    return hostEPorta;
  }

  const host = hostEPorta.slice(0, fimDoHost);
  const porta = hostEPorta.slice(fimDoHost + 1);
  return /^\d+$/.test(porta) ? `${host}:${Number.parseInt(porta, 10)}` : host;
}

/**
 * `set_url_scheme( $url, 'https' )` (`link-template.php:3930`), no ramo que o
 * esquema explicito percorre: `trim()`, `http:` na frente do endereco que
 * comeca com `//`, e troca de `#^\w+://#` por `https://` (`:3941`-`:3952`).
 *
 * O ponto de filtro `set_url_scheme` (`:3965`) nao e emitido aqui: o barramento
 * e `REQ-162`, escopo recusado em `do-not-rewrite.md`.
 */
export function comEsquemaHttps(endereco: string): string {
  let aparado = endereco.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
  if (aparado.startsWith('//')) {
    aparado = 'http:' + aparado;
  }
  return aparado.replace(/^\w+:\/\//, 'https://');
}
