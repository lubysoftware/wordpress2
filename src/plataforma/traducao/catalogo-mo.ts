/**
 * O leitor de catalogo `.mo`: **dos bytes que a porta entrega as entradas.**
 *
 * Tarefa **T009** da feature `015-plataforma-transversal` — US-4. Satisfaz a
 * metade de leitura de **CA-4.2**: *"os textos vem de catalogo externo ao codigo,
 * atualizavel sem alterar o sistema"*. O catalogo e arquivo, a porta
 * (`./portas/porta-de-catalogo.ts`) le o arquivo, e este modulo le o formato —
 * trocar o arquivo troca o texto, sem tocar em codigo.
 *
 * E o porte de `WP_Translation_File_MO::parse_file()`
 * (`wp-includes/l10n/class-wp-translation-file-mo.php:90`), o leitor da
 * **segunda geracao** (`wp-includes/l10n/`, desde a 6.5), que e o que
 * `load_textdomain()` usa em execucao (`WP_Translation_Controller`,
 * `wp-includes/l10n.php:801`). A primeira geracao (`wp-includes/pomo/mo.php`)
 * continua na arvore, e qual das duas o sistema novo reproduz e a pergunta 3 de
 * *O que ninguem decidiu* em `./README.md` — este arquivo reproduz a que esta no
 * caminho de execucao, e nao fecha a pergunta.
 *
 * ---
 *
 * ## Por que o catalogo e lido como cadeia de bytes, e nao como texto
 *
 * O legado nao decodifica nada: a chave do catalogo e comparada **byte a byte**
 * com o texto que o codigo pede, e o valor sai como foi gravado. Decodificar o
 * `.mo` como UTF-8 na entrada trocaria por `U+FFFD` todo byte invalido — e a
 * chave deixaria de casar. Por isso {@link CadeiaDeBytes}: um caractere por byte
 * (`0x00`-`0xFF`), como a cadeia do interpretador. Quem pede traducao passa texto
 * e recebe texto; a conversao fica na borda deste arquivo
 * ({@link paraCadeiaDeBytes} e {@link deCadeiaDeBytes}).
 *
 * ## ⚠️ Catalogo invalido nao e erro para quem traduz
 *
 * O legado so analisa o arquivo na **primeira consulta** (`parse_file()` e
 * chamado por `translate()`, `class-wp-translation-file.php:201-207`), e um
 * arquivo que falha so fica sem entradas: a consulta devolve `false` e a
 * traducao cai no texto de origem (CA-4.3). {@link CatalogoMo.erro} guarda a
 * mensagem do legado para diagnostico, e nenhuma decisao depende dela (P7).
 */

import type { BytesDeCatalogo } from './portas/index.js';

/**
 * Cadeia em que cada caractere e um byte (`0x00`-`0xFF`): a forma em que o
 * interpretador do legado guarda e compara o conteudo do catalogo.
 */
export type CadeiaDeBytes = string;

/** O catalogo lido. */
export interface CatalogoMo {
  /**
   * Os cabecalhos da entrada de chave vazia, com o nome em minusculas
   * (`class-wp-translation-file-mo.php:163`) e o valor sem espaco nas pontas.
   */
  readonly cabecalhos: ReadonlyMap<CadeiaDeBytes, CadeiaDeBytes>;
  /**
   * As entradas: a chave e o singular (com o contexto na frente, separado por
   * `\x04`), o valor e a traducao, com as formas de plural separadas por `\0`.
   */
  readonly entradas: ReadonlyMap<CadeiaDeBytes, CadeiaDeBytes>;
  /**
   * A mensagem de erro do legado — `'Invalid data'`, `'Magic marker does not
   * exist'` ou `'Unsupported revision'` —, ou `null`.
   *
   * ⚠️ `null` **nao** quer dizer que o arquivo foi lido: o legado tem um caminho
   * que desiste sem registrar erro (o bloco de deslocamentos curto demais,
   * `:112-122`), e ele e reproduzido.
   */
  readonly erro: string | null;
}

/** `const MAGIC_MARKER = 0x950412de;` (`class-wp-translation-file-mo.php:34`). */
export const MARCA_DO_FORMATO_MO = 0x950412de;

/** Bytes para {@link CadeiaDeBytes}, sem decodificar. */
export function cadeiaDeBytes(bytes: Uint8Array): CadeiaDeBytes {
  let cadeia = '';
  const passo = 8192;
  for (let inicio = 0; inicio < bytes.length; inicio += passo) {
    cadeia += String.fromCharCode(...bytes.subarray(inicio, inicio + passo));
  }
  return cadeia;
}

const CODIFICADOR = new TextEncoder();
// `ignoreBOM`: o legado devolve a marca de ordem de bytes como esta no catalogo.
const DECODIFICADOR = new TextDecoder('utf-8', { ignoreBOM: true });

/** O texto que o codigo pede, nos bytes UTF-8 que o legado compararia. */
export function paraCadeiaDeBytes(texto: string): CadeiaDeBytes {
  return cadeiaDeBytes(CODIFICADOR.encode(texto));
}

/**
 * A traducao de volta a texto, lendo os bytes como UTF-8.
 *
 * ⚠️ E a unica conversao com perda deste arquivo: byte que nao forma UTF-8 vira
 * `U+FFFD`, enquanto o legado o emitiria cru. Os catalogos do ecossistema sao
 * UTF-8 (o cabecalho `Content-Type` diz `charset=UTF-8`); o que for emitido em
 * outra codificacao e problema da borda que escreve a resposta.
 */
export function deCadeiaDeBytes(cadeia: CadeiaDeBytes): string {
  const bytes = new Uint8Array(cadeia.length);
  for (let i = 0; i < cadeia.length; i += 1) {
    bytes[i] = cadeia.charCodeAt(i);
  }
  return DECODIFICADOR.decode(bytes);
}

/**
 * `substr()` do PHP 8 com inicio nao negativo: inicio alem do fim da cadeia
 * vazia, e comprimento negativo conta a partir do fim.
 */
function substrPhp(cadeia: CadeiaDeBytes, inicio: number, comprimento: number): CadeiaDeBytes {
  if (inicio > cadeia.length) {
    return '';
  }
  if (comprimento < 0) {
    const fim = cadeia.length + comprimento;
    return fim <= inicio ? '' : cadeia.slice(inicio, fim);
  }
  return cadeia.slice(inicio, inicio + comprimento);
}

/** `str_split( $s, 8 )` do PHP 8.2+: cadeia vazia da lista vazia. */
function emPedacosDeOito(cadeia: CadeiaDeBytes): CadeiaDeBytes[] {
  const pedacos: CadeiaDeBytes[] = [];
  for (let i = 0; i < cadeia.length; i += 8) {
    pedacos.push(cadeia.slice(i, i + 8));
  }
  return pedacos;
}

type Ordem = 'N' | 'V';

/** `unpack( 'N' | 'V', ... )` de um inteiro de 32 bits sem sinal. */
function inteiro32(cadeia: CadeiaDeBytes, posicao: number, ordem: Ordem): number {
  const b0 = cadeia.charCodeAt(posicao);
  const b1 = cadeia.charCodeAt(posicao + 1);
  const b2 = cadeia.charCodeAt(posicao + 2);
  const b3 = cadeia.charCodeAt(posicao + 3);
  const valor =
    ordem === 'N'
      ? b0 * 0x1000000 + (b1 << 16) + (b2 << 8) + b3
      : b3 * 0x1000000 + (b2 << 16) + (b1 << 8) + b0;
  return valor;
}

/**
 * `unpack( "{o}length/{o}pos", $par )`: devolve `null` quando o pedaco tem menos
 * de oito bytes, que e quando o `unpack` do legado devolve `false` (`:142-147`).
 */
function parDeInteiros(
  pedaco: CadeiaDeBytes | undefined,
  ordem: Ordem,
): { readonly comprimento: number; readonly posicao: number } | null {
  if (pedaco === undefined || pedaco.length < 8) {
    return null;
  }
  return { comprimento: inteiro32(pedaco, 0, ordem), posicao: inteiro32(pedaco, 4, ordem) };
}

/** `rtrim( $s, "\0" )`. */
function semNulosNoFim(cadeia: CadeiaDeBytes): CadeiaDeBytes {
  let fim = cadeia.length;
  while (fim > 0 && cadeia.charCodeAt(fim - 1) === 0) {
    fim -= 1;
  }
  return cadeia.slice(0, fim);
}

/** Os caracteres que o `trim()` do PHP tira por omissao: `" \t\n\r\0\x0B"`. */
const ESPACO_DO_TRIM = new Set([0x20, 0x09, 0x0a, 0x0d, 0x00, 0x0b]);

/** `trim()` do PHP, com a lista de omissao (sem `\f`, ao contrario de JS). */
export function aparadoComoNoPhp(cadeia: CadeiaDeBytes): CadeiaDeBytes {
  let inicio = 0;
  let fim = cadeia.length;
  while (inicio < fim && ESPACO_DO_TRIM.has(cadeia.charCodeAt(inicio))) {
    inicio += 1;
  }
  while (fim > inicio && ESPACO_DO_TRIM.has(cadeia.charCodeAt(fim - 1))) {
    fim -= 1;
  }
  return cadeia.slice(inicio, fim);
}

/** `strtolower()` do PHP 8: so `A`-`Z`, byte a byte. */
function minusculasAscii(cadeia: CadeiaDeBytes): CadeiaDeBytes {
  return cadeia.replace(/[A-Z]/g, (letra) => letra.toLowerCase());
}

/**
 * `detect_endian_and_validate_file()` (`class-wp-translation-file-mo.php:44`):
 * a marca lida como big-endian primeiro, depois como little-endian.
 */
function ordemDosBytes(cadeia: CadeiaDeBytes): Ordem | null {
  if (inteiro32(cadeia, 0, 'N') === MARCA_DO_FORMATO_MO) {
    return 'N';
  }
  if (inteiro32(cadeia, 0, 'V') === MARCA_DO_FORMATO_MO) {
    return 'V';
  }
  return null;
}

/**
 * `WP_Translation_File_MO::parse_file()`
 * (`wp-includes/l10n/class-wp-translation-file-mo.php:90`), passo a passo:
 *
 * | passo | legado | falha |
 * |---|---|---|
 * | menos de 24 bytes | `:101-104` | `'Invalid data'` |
 * | marca em nenhuma das duas ordens | `:106` e `:79` | `'Magic marker does not exist'` |
 * | bloco de deslocamentos com menos de 24 bytes | `:112-122` | desiste **sem** erro |
 * | revisao maior que zero | `:127-130` | `'Unsupported revision'` |
 * | tabela comecando alem do fim | `:132-135` | `'Invalid data'` |
 * | par de tabela com menos de 8 bytes | `:142-147` | so pula a entrada |
 *
 * ⚠️ **Os comprimentos das tabelas saem da diferenca entre enderecos**
 * (`:124-125`), nao do total de entradas — inclusive o da tabela de traducoes,
 * que vai ate o endereco da tabela de dispersao. Num arquivo malformado a
 * diferenca pode ser negativa, e `substr()` com comprimento negativo corta do
 * fim: e reproduzido, porque e o que decide quais entradas o legado enxerga.
 *
 * ⚠️ **A chave e so o singular** (`:166-174`): *"this just adds the singular
 * string for lookup"*. A forma plural do `msgid` (depois do `\0`) e descartada,
 * e e por isso que `translate_plural()` do controlador, que procura primeiro
 * `singular\0plural`, sempre acaba achando pelo singular.
 */
export function lerCatalogoMo(bytes: BytesDeCatalogo): CatalogoMo {
  const conteudo = cadeiaDeBytes(bytes);
  const cabecalhos = new Map<CadeiaDeBytes, CadeiaDeBytes>();
  const entradas = new Map<CadeiaDeBytes, CadeiaDeBytes>();
  const lido = (erro: string | null): CatalogoMo => ({ cabecalhos, entradas, erro });

  if (conteudo.length < 24) {
    return lido('Invalid data');
  }

  const ordem = ordemDosBytes(conteudo.slice(0, 4));
  if (ordem === null) {
    return lido('Magic marker does not exist');
  }

  const bloco = substrPhp(conteudo, 4, 24);
  if (bloco.length < 24) {
    return lido(null);
  }

  const revisao = inteiro32(bloco, 0, ordem);
  const enderecoDosOriginais = inteiro32(bloco, 8, ordem);
  const enderecoDasTraducoes = inteiro32(bloco, 12, ordem);
  const enderecoDaDispersao = inteiro32(bloco, 20, ordem);
  const comprimentoDosOriginais = enderecoDasTraducoes - enderecoDosOriginais;
  const comprimentoDasTraducoes = enderecoDaDispersao - enderecoDasTraducoes;

  if (revisao > 0) {
    return lido('Unsupported revision');
  }

  if (enderecoDasTraducoes > conteudo.length || enderecoDosOriginais > conteudo.length) {
    return lido('Invalid data');
  }

  const originais = emPedacosDeOito(
    substrPhp(conteudo, enderecoDosOriginais, comprimentoDosOriginais),
  );
  const traducoes = emPedacosDeOito(
    substrPhp(conteudo, enderecoDasTraducoes, comprimentoDasTraducoes),
  );

  for (let i = 0; i < originais.length; i += 1) {
    const o = parDeInteiros(originais[i], ordem);
    const t = parDeInteiros(traducoes[i], ordem);
    if (o === null || t === null) {
      continue;
    }

    const original = substrPhp(conteudo, o.posicao, o.comprimento);
    // "GlotPress bug." (`:151-152`)
    const traducao = semNulosNoFim(substrPhp(conteudo, t.posicao, t.comprimento));

    if (original === '') {
      // Os metadados moram na entrada de chave vazia (`:154-164`).
      for (const linha of traducao.split('\n')) {
        if (linha === '' || !linha.includes(':')) {
          continue;
        }
        const separador = linha.indexOf(':');
        const nome = aparadoComoNoPhp(linha.slice(0, separador));
        const valor = aparadoComoNoPhp(linha.slice(separador + 1));
        cabecalhos.set(minusculasAscii(nome), valor);
      }
    } else {
      const singular = original.split('\0')[0] as CadeiaDeBytes;
      entradas.set(singular, traducao);
    }
  }

  return lido(null);
}
