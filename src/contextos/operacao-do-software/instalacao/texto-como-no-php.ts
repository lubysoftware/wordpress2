/**
 * As cinco funcoes de texto do PHP que o caminho de instalacao usa, com o
 * comportamento delas e nao o do equivalente do runtime.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` (US-1). Cada uma
 * decide um byte do que sai pela rede ou do nome do token, e o equivalente do
 * runtime erra em pelo menos um caso:
 *
 * | PHP | o equivalente que erra | onde |
 * |---|---|---|
 * | `trim()` | `String.prototype.trim()` apara espaco Unicode; o PHP apara so `" \t\n\r\0\x0B"` | o plugin da tela (`wp-admin/update.php:23`) |
 * | `urldecode()` | `decodeURIComponent()` lanca em sequencia invalida e nao troca `+` por espaco | o tema da tela (`:24`) e cada item do lote (`:42`) |
 * | conversao para texto | `String(true)` e `'true'`; o PHP da `'1'`, e `null` da `''` | o titulo da instalacao e os valores da consulta ao catalogo |
 * | `if ( $valor )` | `Boolean('0')` e verdadeiro; no PHP e falso | o atalho de `themes_api()` (`theme.php:516`) |
 * | `_http_build_query()` | `URLSearchParams` codifica; `build_query()` **nao** (`functions.php:1049`) | a URL da consulta ao catalogo |
 *
 * ⚠️ **Por que nao reusar os gemeos de outros contextos.** BC-11 ja tem
 * `armazenamento/verdade-de-php.ts`, mas sobre `ValorPhp` lido da coluna, e a
 * consulta ao catalogo decide sobre o JSON decodificado. A regra de dependencia
 * 3 proibe buscar os de outros contextos, e `plataforma/utilitarios/` nao
 * existe nesta arvore.
 */

/** Os seis bytes que `trim()` apara por padrao. */
const APARAVEIS_DO_PHP = /^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g;

/** `trim( $texto )`. */
export function apararComoNoPhp(texto: string): string {
  return texto.replace(APARAVEIS_DO_PHP, '');
}

function ehHexadecimal(byte: number | undefined): boolean {
  return (
    byte !== undefined &&
    ((byte >= 0x30 && byte <= 0x39) ||
      (byte >= 0x41 && byte <= 0x46) ||
      (byte >= 0x61 && byte <= 0x66))
  );
}

/**
 * `urldecode( $texto )`: `+` vira espaco, `%XX` vira o byte, e o `%` que nao
 * forma sequencia valida fica como esta — sem lancar.
 *
 * Opera em bytes, como o PHP, e devolve o texto decodificado como UTF-8.
 */
export function decodificarUrlComoNoPhp(texto: string): string {
  const entrada = new TextEncoder().encode(texto);
  const saida: number[] = [];
  for (let i = 0; i < entrada.length; i += 1) {
    const byte = entrada[i] as number;
    if (byte === 0x2b) {
      saida.push(0x20);
    } else if (
      byte === 0x25 &&
      ehHexadecimal(entrada[i + 1]) &&
      ehHexadecimal(entrada[i + 2])
    ) {
      saida.push(
        Number.parseInt(
          String.fromCharCode(entrada[i + 1] as number, entrada[i + 2] as number),
          16,
        ),
      );
      i += 2;
    } else {
      saida.push(byte);
    }
  }
  return new TextDecoder().decode(new Uint8Array(saida));
}

/**
 * `(string) $valor` para os valores que este caminho le.
 *
 * Numero sai pelo `String()` do runtime, que coincide com o PHP para inteiro; o
 * decimal do PHP usa `precision`/`serialize_precision` e pode divergir no ultimo
 * digito — nenhum valor deste caminho e decimal. Objeto e lista viram `'Array'`,
 * que e o que o PHP poe (com aviso) ao concatenar arranjo.
 */
export function textoComoNoPhp(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor;
  }
  if (valor === true) {
    return '1';
  }
  if (valor === false || valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'number' || typeof valor === 'bigint') {
    return String(valor);
  }
  return 'Array';
}

/**
 * `if ( $valor )` para um valor decodificado de JSON: falsos sao `false`,
 * `null`, `0`, `''`, `'0'` e o arranjo vazio. Objeto **sem** propriedades e
 * arranjo vazio para o PHP quando vem de `json_decode( ..., true )`.
 */
export function verdadeiroNoPhp(valor: unknown): boolean {
  if (valor === false || valor === null || valor === undefined) {
    return false;
  }
  if (valor === 0 || valor === '' || valor === '0') {
    return false;
  }
  if (Array.isArray(valor)) {
    return valor.length > 0;
  }
  if (typeof valor === 'object') {
    return Object.keys(valor).length > 0;
  }
  return true;
}

/** Um valor que `_http_build_query()` aceita. */
export type ValorDeConsultaDoPhp =
  | string
  | number
  | boolean
  | null
  | { readonly [chave: string]: ValorDeConsultaDoPhp };

/**
 * `_http_build_query( $dados, null, '&', $chave, false )` — a forma que
 * `build_query()` chama (`wp-includes/functions.php:1048`-`:1105`).
 *
 * Sem codificar o valor (`$urlencode` falso), com o colchete do aninhamento
 * escrito como `%5B`/`%5D` (`:1082`), `null` omitido (`:1085`) e `false` como
 * `'0'` (`:1087`). Um aninhado vazio produz parte vazia, e o legado a junta
 * assim mesmo.
 */
export function montarConsultaComoNoPhp(
  dados: { readonly [chave: string]: ValorDeConsultaDoPhp },
  chave = '',
): string {
  const partes: string[] = [];
  for (const [nome, bruto] of Object.entries(dados)) {
    const k = chave !== '' && chave !== '0' ? `${chave}%5B${nome}%5D` : nome;
    if (bruto === null) {
      continue;
    }
    const valor = bruto === false ? '0' : bruto;
    if (typeof valor === 'object') {
      partes.push(montarConsultaComoNoPhp(valor, k));
    } else {
      partes.push(`${k}=${textoComoNoPhp(valor)}`);
    }
  }
  return partes.join('&');
}

/**
 * `add_query_arg( $argumentos, $base )` para uma base **com protocolo e sem
 * consulta nem fragmento**, que e a unica forma que este caminho usa
 * (`wp-includes/functions.php:1144`-`:1210`).
 *
 * Os passos que sobram nesse caso, na ordem do legado: valor `false` no
 * primeiro nivel e removido (`:1197`), a consulta e montada sem codificar
 * (`:1203`), `?` e aparado das pontas (`:1204`) e `=` seguido de `&` ou do fim
 * perde o sinal (`:1205`).
 */
export function acrescentarConsultaComoNoPhp(
  base: string,
  argumentos: { readonly [chave: string]: ValorDeConsultaDoPhp },
): string {
  const presentes: Record<string, ValorDeConsultaDoPhp> = {};
  for (const [nome, valor] of Object.entries(argumentos)) {
    if (valor !== false) {
      presentes[nome] = valor;
    }
  }
  const consulta = montarConsultaComoNoPhp(presentes)
    .replace(/^\?+|\?+$/g, '')
    .replace(/=(&|$)/g, '$1');
  return `${base}?${consulta}`.replace(/\?+$/, '');
}

/**
 * `set_url_scheme( $url, 'https' )` antes do filtro, para URL que ja tem
 * protocolo (`wp-includes/link-template.php:3941` e `:3952`).
 *
 * ⚠️ **O `trim()` so acontece aqui.** A URL cifrada sai aparada e a URL em claro
 * da repeticao, que o legado guardou antes (`$http_url = $url`), nao: um tema
 * cujo nome termina em espaco chega aos dois pedidos com URLs diferentes.
 */
export function comProtocoloSeguro(url: string): string {
  return apararComoNoPhp(url).replace(/^\w+:\/\//, 'https://');
}
