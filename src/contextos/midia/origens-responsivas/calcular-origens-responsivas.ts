/**
 * A lista de origens responsivas de uma imagem — o valor do atributo `srcset`.
 *
 * Entrega de **T013** da feature `006-biblioteca-de-midia` (US-6, *"servir a
 * derivada adequada ao espaco em que a imagem aparece"*). E
 * `wp_calculate_image_srcset( $size_array, $image_src, $image_meta,
 * $attachment_id )` (`wp-includes/media.php:1444`), com
 * `wp_image_matches_ratio()` (`:738`) dentro. A ancora da rastreabilidade da
 * `spec.md` e `media.php:1545`, que e o teto de `M3` (BR-MIGRAR-059).
 *
 * | criterio | o que o legado faz | onde |
 * |---|---|---|
 * | CA-6.1 — *"as derivadas existentes com as suas larguras reais"* | cada entrada de `sizes`, mais o arquivo inteiro, com descritor `w` e a largura **gravada** no metadado | `:1484`-`:1489`, `:1591`-`:1595` |
 * | CA-6.2 — *"o teto ... declarado e configuravel, e nao depende de quais derivadas existem"* | `2048` literal, passado ao filtro `max_srcset_image_width` com as dimensoes pedidas e **nada** do metadado | `:1545` |
 * | CA-6.3 — *"anexo sem derivada alguma ... sem marcacao de alternativas"* | `empty( $image_meta['sizes'] )` devolve `false`, e o chamador nao emite o atributo | `:1462`, `wp-includes/media.php:1245` |
 * | `M3` — *"para em 2048 px, independente dos tamanhos existentes"* | `$image['width'] > $max_srcset_image_width && ! $is_src` salta a entrada | `:1584` |
 *
 * ── O QUE OS CRITERIOS NAO DIZEM, E O LEGADO FAZ ──────────────────────────
 *
 * Os criterios descrevem o caso comum; o legado tem cinco restricoes a mais, e
 * **todas** sao reproduzidas, porque a lista e saida HTML consumida por
 * navegador de terceiro (BR-MIGRAR-059: *"na duvida, tratar como contrato de
 * valor"*) e o cenario de PT-014 a compara **byte a byte**:
 *
 * 1. **So entra derivada da mesma proporcao** da imagem pedida, com tolerancia
 *    de um pixel (`:1589`). *"As derivadas existentes"* de CA-6.1 nao sao todas:
 *    a miniatura recortada 150x150 de uma foto 3:2 nao entra.
 * 2. **O teto nao vale para o proprio `src`** (`! $is_src`, `:1584`). Imagem
 *    servida numa derivada acima de 2048 px aparece na lista, e em primeiro.
 *    `M3` le *"independente dos tamanhos existentes"*, e o legado le isso
 *    tambem: o que o teto ignora sao os tamanhos, nao o arquivo pedido.
 * 3. **O `src` vai primeiro** (*"because of a bug in iOS8. See #35030"*,
 *    `:1597`-`:1599`), e a lista e indexada pela largura: duas derivadas da
 *    mesma largura viram uma, a ultima vence e a posicao e a da primeira — e a
 *    atribuicao de chave existente do PHP.
 * 4. **Sem o `src` na lista, nao ha lista** (`$src_matched`, `:1555`, `:1635`):
 *    *"we don't return a srcset to avoid serving an incorrect image"*. E com uma
 *    origem so tambem nao (`count( $sources ) < 2`).
 * 5. **GIF e imagem editada.** Se a miniatura e GIF, o arquivo inteiro sai da
 *    lista — e se o `src` **e** o inteiro, nao ha lista (`:1484`, `:1490`), para
 *    nao animar nem achatar o GIF. Se o `src` tem o carimbo de edicao
 *    `-e{13 digitos}`, so entram arquivos com o mesmo carimbo depois da
 *    primeira posicao — `! strpos()` tambem salta o arquivo que **comeca** com
 *    ele (`:1530`, `:1576`).
 *
 * ── PERMISSAO ──────────────────────────────────────────────────────────────
 *
 * **Nenhuma**, e e declaracao (P4): a historia e do visitante, a
 * rastreabilidade aponta UC-01, e a funcao do legado nao pergunta capacidade
 * nem le o estado do anexo. Quem decide se a imagem e vista e quem decide se o
 * conteudo que a carrega e visto.
 *
 * ── OS PONTOS DE EXTENSAO DO CAMINHO (P2) ──────────────────────────────────
 *
 * | ponto | onde | aqui |
 * |---|---|---|
 * | `wp_calculate_image_srcset_meta` | `:1460`, antes da primeira guarda | **nao emitido** — nomeado no passo 1 |
 * | `max_srcset_image_width` | `:1545` | **emitido**, por {@link ContextoDeOrigensResponsivas.filtrosDoTeto}: e o *"configuravel"* de CA-6.2, e o legado nao tem outro |
 * | `wp_calculate_image_srcset` | `:1632`, antes da contagem final | **nao emitido** — nomeado no passo 7 |
 * | `set_url_scheme` | `link-template.php:3965` | **nao emitido** — ver `endereco-da-origem.ts` |
 * | `wp_constrain_dimensions` | `media.php:530` | **nao emitido** — ver `../derivadas/dimensoes-de-redimensionamento.ts` |
 *
 * O barramento e `REQ-162`, escopo **recusado** em `do-not-rewrite.md`; o teto
 * e emitido porque um criterio de aceite desta tarefa o exige, pela mesma forma
 * de lista de interceptadores que `leitura-publica/senha-de-conteudo/` usa.
 *
 * ── O QUE ESTA OPERACAO NAO FAZ ────────────────────────────────────────────
 *
 * Nao monta a tag (`wp_get_attachment_image()`, `:1169`) nem o atributo
 * `sizes` (`wp_calculate_image_sizes()`, `:1696`), nao resolve o `src` a partir
 * do nome do tamanho (`image_downsize()`) e nao le o metadado: tela entra como
 * dado, e a montagem e da borda. Devolve o valor do atributo, ou `null` onde o
 * legado devolve `false` — e `null` e *"sem marcacao de alternativas"*.
 */

import {
  derivadaChamada,
  type MetadadoDeAnexo,
} from '../armazenamento/index.js';
import {
  dimensoesContidas,
  numerosQuaseIguais,
} from '../derivadas/index.js';
import type { ContextoDeOrigensResponsivas } from './contexto-de-origens-responsivas.js';
import {
  comBarraFinal,
  comEsquemaHttps,
  dominioDoEndereco,
  nomeBase,
  pastaRelativaDoAnexo,
} from './endereco-da-origem.js';

/**
 * O teto de `M3` (BR-MIGRAR-059), o literal de `wp-includes/media.php:1545`.
 *
 * Numero do legado, nao escolha deste porte (P6). Muda-se por
 * {@link ContextoDeOrigensResponsivas.filtrosDoTeto}, como no legado.
 */
export const TETO_DAS_ORIGENS_RESPONSIVAS = 2048;

/** O tipo da miniatura que tira o arquivo inteiro da lista (`:1484`). */
export const TIPO_QUE_NAO_OFERECE_O_INTEIRO = 'image/gif';

/**
 * O carimbo procurado em `:1530` — o `-e{$suffix}` que `wp_save_image()` poe no
 * nome do arquivo editado, com `time() . rand( 100, 999 )`: dez digitos e mais
 * tres (`wp-admin/includes/image-edit.php:1001`, `:1015`).
 */
const CARIMBO_DE_EDICAO = /-e[0-9]{13}/;

/** O que a lista recebe — os tres primeiros argumentos do legado. */
export interface PedidoDeOrigensResponsivas {
  /**
   * `$size_array` — largura e altura **pedidas**, que e a do `src`.
   *
   * O legado faz `(int)` nas duas (`:1469`, `:1470`), e largura abaixo de `1`
   * nao tem lista (`:1473`).
   */
  readonly dimensoes: readonly [number, number];
  /** `$image_src` — o endereco do arquivo que a tag serve em `src`. */
  readonly enderecoDaImagem: string;
  /**
   * `$image_meta` — o que `wp_get_attachment_metadata()` devolveu, na projecao
   * de T002. `null` e o `false` dela, e cai na primeira guarda.
   */
  readonly metadado: MetadadoDeAnexo | null;
}

/** Uma origem da lista: `'url'`, `'descriptor'` e `'value'` do legado. */
interface Origem {
  readonly endereco: string;
  readonly largura: number;
}

/** Uma entrada do laco, que e uma derivada ou o arquivo inteiro. */
interface Candidata {
  readonly nomeDeArquivo: string;
  readonly largura: number;
  readonly altura: number;
}

/**
 * `wp_calculate_image_srcset()` — o valor do atributo, ou `null`.
 *
 * Ver o cabecalho deste arquivo.
 */
export function calcularOrigensResponsivas(
  contexto: ContextoDeOrigensResponsivas,
  pedido: PedidoDeOrigensResponsivas,
): string | null {
  // Passo 1. O filtro `wp_calculate_image_srcset_meta` (`:1460`) entra AQUI, e
  // nao e emitido. Depois dele, a guarda (`:1462`).
  const metadado = pedido.metadado;
  if (
    metadado === null ||
    metadado.derivadas.length === 0 ||
    metadado.arquivo === null ||
    bytesDoTexto(metadado.arquivo) < 4
  ) {
    return null;
  }
  const arquivo = metadado.arquivo;

  // Passo 2. As dimensoes pedidas (`:1469`-`:1475`).
  const larguraPedida = Math.trunc(pedido.dimensoes[0]);
  const alturaPedida = Math.trunc(pedido.dimensoes[1]);
  if (larguraPedida < 1) {
    return null;
  }

  // Passo 3. O arquivo inteiro entra no fim, salvo quando a miniatura e GIF
  // (`:1484`-`:1492`).
  const candidatas: Candidata[] = metadado.derivadas.map((derivada) => ({
    nomeDeArquivo: derivada.nomeDeArquivo,
    largura: derivada.largura,
    altura: derivada.altura,
  }));
  const miniatura = derivadaChamada(metadado, 'thumbnail');
  if (miniatura?.tipoMime !== TIPO_QUE_NAO_OFERECE_O_INTEIRO) {
    candidatas.push({
      nomeDeArquivo: nomeBase(arquivo),
      largura: metadado.largura ?? 0,
      altura: metadado.altura ?? 0,
    });
  } else if (pedido.enderecoDaImagem.includes(arquivo)) {
    return null;
  }

  // Passo 4. O endereco base das origens (`:1495`-`:1523`).
  let pasta = pastaRelativaDoAnexo(arquivo);
  if (verdadeiroComoTextoDePhp(pasta)) {
    pasta = comBarraFinal(pasta);
  }
  let enderecoBase = comBarraFinal(contexto.enderecoBaseDeEnvios) + pasta;
  if (contexto.requisicao.cifrada && !enderecoBase.startsWith('https')) {
    if (contexto.requisicao.host === dominioDoEndereco(enderecoBase)) {
      enderecoBase = comEsquemaHttps(enderecoBase);
    }
  }

  // Passo 5. O carimbo de edicao e o teto (`:1530`, `:1545`).
  const carimbo = CARIMBO_DE_EDICAO.exec(nomeBase(pedido.enderecoDaImagem))?.[0];
  const teto = tetoFiltrado(contexto, [larguraPedida, alturaPedida]);

  // Passo 6. O laco (`:1561`-`:1604`).
  let origens = new Map<number, Origem>();
  let srcEncontrado = false;

  for (const candidata of candidatas) {
    let ehSrc = false;

    if (
      !srcEncontrado &&
      pedido.enderecoDaImagem.includes(pasta + candidata.nomeDeArquivo)
    ) {
      srcEncontrado = true;
      ehSrc = true;
    }

    // `! strpos()`: a posicao 0 tambem e falsa.
    if (carimbo !== undefined && candidata.nomeDeArquivo.indexOf(carimbo) <= 0) {
      continue;
    }

    if (teto !== false && teto !== 0 && candidata.largura > teto && !ehSrc) {
      continue;
    }

    if (
      proporcaoCoincide(
        larguraPedida,
        alturaPedida,
        candidata.largura,
        candidata.altura,
      )
    ) {
      const origem: Origem = {
        endereco: enderecoBase + candidata.nomeDeArquivo,
        largura: candidata.largura,
      };
      // A chave do arranjo do PHP: numero com parte decimal e truncado.
      const chave = Math.trunc(candidata.largura);

      if (ehSrc) {
        // `array( $w => $source ) + $sources`: a da esquerda vence e vai na frente.
        const resto = [...origens].filter(([largura]) => largura !== chave);
        origens = new Map([[chave, origem], ...resto]);
      } else {
        origens.set(chave, origem);
      }
    }
  }

  // Passo 7. O filtro `wp_calculate_image_srcset` (`:1632`) entra AQUI, e nao e
  // emitido. Depois dele, a contagem (`:1635`).
  if (!srcEncontrado || origens.size < 2) {
    return null;
  }

  // Passo 8. O texto (`:1639`-`:1645`): espaco vira `%20`, e o `rtrim( ', ' )`
  // so tira o separador final, porque cada origem termina em `w`.
  return [...origens.values()]
    .map(
      (origem) =>
        `${origem.endereco.replaceAll(' ', '%20')} ${origem.largura}w`,
    )
    .join(', ');
}

/**
 * `wp_image_matches_ratio( $source_width, $source_height, $target_width,
 * $target_height )` (`wp-includes/media.php:738`).
 *
 * *"To test for varying crops, we constrain the dimensions of the larger image
 * to the dimensions of the smaller image and see if they match"*, com um pixel
 * de tolerancia (`:752`).
 */
export function proporcaoCoincide(
  larguraDeOrigem: number,
  alturaDeOrigem: number,
  larguraDeDestino: number,
  alturaDeDestino: number,
): boolean {
  const [contida, esperada] =
    larguraDeOrigem > larguraDeDestino
      ? [
          dimensoesContidas(larguraDeOrigem, alturaDeOrigem, larguraDeDestino),
          [larguraDeDestino, alturaDeDestino] as const,
        ]
      : [
          dimensoesContidas(larguraDeDestino, alturaDeDestino, larguraDeOrigem),
          [larguraDeOrigem, alturaDeOrigem] as const,
        ];

  return (
    numerosQuaseIguais(contida[0], esperada[0]) &&
    numerosQuaseIguais(contida[1], esperada[1])
  );
}

/** `apply_filters( 'max_srcset_image_width', 2048, $size_array )`. */
function tetoFiltrado(
  contexto: ContextoDeOrigensResponsivas,
  dimensoes: readonly [number, number],
): number | false {
  let teto: number | false = TETO_DAS_ORIGENS_RESPONSIVAS;
  for (const filtro of contexto.filtrosDoTeto ?? []) {
    teto = filtro(teto, dimensoes);
  }
  return teto;
}

/** `strlen()`: o PHP conta bytes, nao caracteres. */
function bytesDoTexto(texto: string): number {
  return new TextEncoder().encode(texto).length;
}

/** `if ( $dirname )`: `''` e `'0'` sao os dois textos falsos do PHP. */
function verdadeiroComoTextoDePhp(texto: string): boolean {
  return texto !== '' && texto !== '0';
}
