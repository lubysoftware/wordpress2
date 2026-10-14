/**
 * As medidas de uma derivada, calculadas **antes** de pedir o arquivo.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). E
 * `image_resize_dimensions()` (`wp-includes/media.php:555`) com
 * `wp_constrain_dimensions()` (`:460`) e `wp_fuzzy_number_match()`
 * (`wp-includes/functions.php:9172`) dentro.
 *
 * ── POR QUE ESTE CALCULO ESTA NO DOMINIO, E NAO NO ADAPTADOR ───────────────
 *
 * No legado ele esta nas duas pontas: `WP_Image_Editor_GD::_resize()` o chama
 * para saber o que recortar (`wp-includes/class-wp-image-editor-gd.php:222`),
 * **e** o resultado dele vira `$this->size` (`:242`), que e o que
 * `generate_filename()` interpola no nome do arquivo
 * (`wp-includes/class-wp-image-editor.php:475`, `"{$this->size['width']}x{$this->size['height']}"`).
 * O nome da derivada e **endereco publico**, e por isso a porta de
 * processamento de imagem **nao gera nome**: *"nome de arquivo e endereco
 * publico, e ... mover a geracao do nome para o adaptador poria uma regra
 * observavel atras da troca de biblioteca"* (cabecalho de
 * `../portas/porta-de-processamento-de-imagem.ts`). Como o nome chega decidido
 * a {@link ImagemAberta.derivar}, quem o decide precisa deste calculo — logo
 * ele e regra de dominio aqui, e o adaptador reusa **esta** funcao em vez de
 * reimplementa-la.
 *
 * ⚠️ **Se o adaptador calcular as medidas por conta propria, o nome e o
 * metadado podem discordar.** O metadado guarda a largura e a altura que
 * {@link ImagemAberta.derivar} devolveu (CA-3.4, *"as medidas reais"*), e o nome
 * guarda as que esta funcao calculou. No legado as duas saem do mesmo calculo e
 * portanto nunca discordam. Esta funcao e exportada para que o adaptador tenha
 * como manter isso verdade.
 *
 * ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────
 *
 * - **Os dois pontos de extensao deste caminho**, `image_resize_dimensions`
 *   (`media.php:581`, que curto-circuita o calculo inteiro) e
 *   `wp_constrain_dimensions` (`:530`), mais `wp_image_resize_identical_dimensions`
 *   (`:673`). Os tres sao contrato publico (P2) e **nenhum e emitido**: o
 *   barramento que os dispara e `REQ-162`, em `do-not-rewrite.md` — escopo
 *   recusado, nao pendente. Ficam nomeados na posicao exata, que e o que o P2
 *   cobra de quem nao os implementa.
 * - **Qualquer limite de dimensao.** Os numeros desta feature sao os de `M1`
 *   (2.560 px, T009) e `M3` (2.048 px, T013), e nenhum dos dois mora aqui
 *   (P6 — numero que o legado nao tem neste ponto nao nasce aqui).
 */

import type { Recorte } from '../portas/index.js';

/**
 * O que `image_resize_dimensions()` devolve: os oito argumentos de
 * `imagecopyresampled()`, na ordem do legado (`wp-includes/media.php:683`).
 *
 * Os dois primeiros sao `0` literais no legado — *"The return array matches the
 * parameters to imagecopyresampled()"* — e estao aqui porque o arranjo deles
 * esta la: quem portar o adaptador consome os oito.
 */
export interface DimensoesDeCopia {
  /** `dst_x` — sempre `0` no legado. */
  readonly destinoX: 0;
  /** `dst_y` — sempre `0` no legado. */
  readonly destinoY: 0;
  /** `src_x` — de onde o recorte comeca, na horizontal. */
  readonly origemX: number;
  /** `src_y` — de onde o recorte comeca, na vertical. */
  readonly origemY: number;
  /** `dst_w` — a largura **real** da derivada. E ela que entra no nome. */
  readonly larguraDeDestino: number;
  /** `dst_h` — a altura real da derivada. */
  readonly alturaDeDestino: number;
  /** `src_w` — a largura da area recortada da origem. */
  readonly larguraDeOrigem: number;
  /** `src_h` — a altura da area recortada da origem. */
  readonly alturaDeOrigem: number;
}

/**
 * `wp_fuzzy_number_match( $expected, $actual, $precision = 1 )`
 * (`wp-includes/functions.php:9172`).
 *
 * *"Differences of 1px may be due to rounding and are ignored."* O `1` e numero
 * do legado, nao escolha deste porte (P6), e e o default do terceiro parametro
 * — nenhum chamador deste caminho o informa.
 */
export function numerosQuaseIguais(
  esperado: number,
  obtido: number,
  precisao = 1,
): boolean {
  return Math.abs(esperado - obtido) <= precisao;
}

/**
 * `wp_constrain_dimensions( $current_width, $current_height, $max_width, $max_height )`
 * (`wp-includes/media.php:460`).
 *
 * E o redimensionamento **dentro da caixa**, que e o de cinco dos seis tamanhos
 * de fabrica (o unico recortado e `thumbnail`, por `thumbnail_crop` semeada em
 * `1`).
 *
 * ⚠️ **A correcao de um pixel do fim nao e detalhe, e o comentario do legado
 * explica por que ela existe:** *"Sometimes, due to rounding, we'll end up with
 * a result like this: 465x700 in a 177x177 box is 117x176... a pixel short. ...
 * Constraining to the result of a constraint should yield the original
 * result."* Sem ela, o nome do arquivo de casos reais muda em um pixel — e nome
 * de arquivo e endereco publico.
 */
export function dimensoesContidas(
  larguraAtual: number,
  alturaAtual: number,
  larguraMaxima = 0,
  alturaMaxima = 0,
): readonly [number, number] {
  if (!larguraMaxima && !alturaMaxima) {
    return [larguraAtual, alturaAtual];
  }

  let razaoDeLargura = 1.0;
  let razaoDeAltura = 1.0;
  let limitouLargura = false;
  let limitouAltura = false;

  if (larguraMaxima > 0 && larguraAtual > 0 && larguraAtual > larguraMaxima) {
    razaoDeLargura = larguraMaxima / larguraAtual;
    limitouLargura = true;
  }

  if (alturaMaxima > 0 && alturaAtual > 0 && alturaAtual > alturaMaxima) {
    razaoDeAltura = alturaMaxima / alturaAtual;
    limitouAltura = true;
  }

  const razaoMenor = Math.min(razaoDeLargura, razaoDeAltura);
  const razaoMaior = Math.max(razaoDeLargura, razaoDeAltura);

  /*
    "The larger ratio is too big. It would result in an overflow." (`:484`) — o
    teste e feito com a razao MAIOR aplicada as duas dimensoes, e so se as duas
    couberem ela e usada.
  */
  const razao =
    arredondarComoPhp(larguraAtual * razaoMaior) > larguraMaxima ||
    arredondarComoPhp(alturaAtual * razaoMaior) > alturaMaxima
      ? razaoMenor
      : razaoMaior;

  // "Very small dimensions may result in 0, 1 should be the minimum." (`:492`)
  let largura = Math.max(1, arredondarComoPhp(larguraAtual * razao));
  let altura = Math.max(1, arredondarComoPhp(alturaAtual * razao));

  // "Note: $did_width means it is possible $smaller_ratio == $width_ratio."
  if (limitouLargura && largura === larguraMaxima - 1) {
    largura = larguraMaxima; // "Round it up."
  }

  if (limitouAltura && altura === alturaMaxima - 1) {
    altura = alturaMaxima; // "Round it up."
  }

  // O ponto de extensao `wp_constrain_dimensions` (`:530`) nao e emitido aqui.
  return [largura, altura];
}

/**
 * `image_resize_dimensions( $orig_w, $orig_h, $dest_w, $dest_h, $crop )`
 * (`wp-includes/media.php:555`).
 *
 * `null` e o `false` do legado, e ele significa *"nao gere esta derivada"* —
 * tres situacoes diferentes dao nele, e as tres sao comportamento:
 *
 * 1. a origem nao tem dimensao (`:557`);
 * 2. nenhuma das duas medidas de destino foi declarada (`:561`) — e isto e o que
 *    salta tamanho registrado com `0` nas duas medidas;
 * 3. **a origem e menor que o destino** (`:587` a `:600`), que e a regra de que
 *    uma imagem pequena nao ganha derivada grande: enviar uma imagem de 400 px
 *    gera `thumbnail` e `medium` e **nao** gera `large`, `1536x1536` nem
 *    `2048x2048`;
 * 4. o resultado teria praticamente as mesmas medidas da origem (`:660`), com a
 *    tolerancia de um pixel de {@link numerosQuaseIguais}.
 *
 * ⚠️ **A guarda 3 tem tres formas, e a diferenca entre elas e observavel:** com
 * so a largura declarada basta `orig_w < dest_w`; com so a altura, `orig_h <
 * dest_h`; com as duas, e preciso que **as duas** sejam menores (`&&`, nao
 * `||`). E por isso que uma imagem de 2000x500 **ganha** derivada `large`
 * (1024x1024): a altura e menor, mas a largura nao.
 *
 * `null` nas medidas vale `0`, como o `empty()` do legado: `make_subsize()`
 * converte medida ausente em `null` (`class-wp-image-editor-gd.php:315`) e
 * `empty( null )` e `empty( 0 )` sao a mesma resposta em todas as guardas deste
 * calculo. Tamanho **registrado** nunca chega com `null` — ele chega com `0`,
 * como `medium_large`, que nasce `768x0` (`wp-admin/includes/schema.php:533`).
 */
export function dimensoesDeRedimensionamento(
  larguraDeOrigem: number,
  alturaDeOrigem: number,
  larguraDeDestino: number | null,
  alturaDeDestino: number | null,
  recorte: Recorte = false,
): DimensoesDeCopia | null {
  const destinoL = larguraDeDestino ?? 0;
  const destinoA = alturaDeDestino ?? 0;

  if (larguraDeOrigem <= 0 || alturaDeOrigem <= 0) {
    return null;
  }

  // "At least one of $dest_w or $dest_h must be specific." (`:560`)
  if (destinoL <= 0 && destinoA <= 0) {
    return null;
  }

  /*
    O ponto de extensao `image_resize_dimensions` (`:581`) entra AQUI, e um
    valor nao-nulo dele *"effectively short-circuit image_resize_dimensions()"*.
    Nao e emitido: ver o cabecalho deste arquivo.
  */

  // "Stop if the destination size is larger than the original image
  // dimensions." (`:587`)
  if (destinoA === 0) {
    if (larguraDeOrigem < destinoL) {
      return null;
    }
  } else if (destinoL === 0) {
    if (alturaDeOrigem < destinoA) {
      return null;
    }
  } else if (larguraDeOrigem < destinoL && alturaDeOrigem < destinoA) {
    return null;
  }

  let novaLargura: number;
  let novaAltura: number;
  let larguraRecortada: number;
  let alturaRecortada: number;
  let origemX: number;
  let origemY: number;

  if (recorte !== false) {
    /*
      "Crop the largest possible portion of the original image that we can size
      to $dest_w x $dest_h. ... If the original image's width or height is less
      than the requested width or height only the greater one will be cropped.
      For example when the original image is 600x300, and the requested crop
      dimensions are 400x400, the resulting image will be 400x300." (`:603`)
    */
    const proporcao = larguraDeOrigem / alturaDeOrigem;
    novaLargura = Math.min(destinoL, larguraDeOrigem);
    novaAltura = Math.min(destinoA, alturaDeOrigem);

    if (!novaLargura) {
      novaLargura = arredondarComoPhp(novaAltura * proporcao);
    }

    if (!novaAltura) {
      novaAltura = arredondarComoPhp(novaLargura / proporcao);
    }

    const razaoDoTamanho = Math.max(
      novaLargura / larguraDeOrigem,
      novaAltura / alturaDeOrigem,
    );

    larguraRecortada = arredondarComoPhp(novaLargura / razaoDoTamanho);
    alturaRecortada = arredondarComoPhp(novaAltura / razaoDoTamanho);

    /*
      `if ( ! is_array( $crop ) || count( $crop ) !== 2 ) $crop = array( 'center', 'center' );`
      (`:628`). `true` cai aqui, e e dai que sai o recorte pelo centro de
      `thumbnail`. Posicao fora dos tres valores que o legado compara tambem cai
      no centro, porque os `if` dele terminam em `else`.
    */
    const [posicaoX, posicaoY] =
      recorte === true ? (['center', 'center'] as const) : recorte;

    if (posicaoX === 'left') {
      origemX = 0;
    } else if (posicaoX === 'right') {
      origemX = larguraDeOrigem - larguraRecortada;
    } else {
      origemX = Math.floor((larguraDeOrigem - larguraRecortada) / 2);
    }

    if (posicaoY === 'top') {
      origemY = 0;
    } else if (posicaoY === 'bottom') {
      origemY = alturaDeOrigem - alturaRecortada;
    } else {
      origemY = Math.floor((alturaDeOrigem - alturaRecortada) / 2);
    }
  } else {
    // "Resize using $dest_w x $dest_h as a maximum bounding box." (`:649`)
    larguraRecortada = larguraDeOrigem;
    alturaRecortada = alturaDeOrigem;
    origemX = 0;
    origemY = 0;
    [novaLargura, novaAltura] = dimensoesContidas(
      larguraDeOrigem,
      alturaDeOrigem,
      destinoL,
      destinoA,
    );
  }

  if (
    numerosQuaseIguais(novaLargura, larguraDeOrigem) &&
    numerosQuaseIguais(novaAltura, alturaDeOrigem)
  ) {
    /*
      "The new size has virtually the same dimensions as the original image."
      (`:660`). O ponto de extensao `wp_image_resize_identical_dimensions`
      (`:673`) decide aqui, e o default dele e `false` — logo o default e **nao
      gerar**. Nao e emitido: ver o cabecalho.
    */
    return null;
  }

  return {
    destinoX: 0,
    destinoY: 0,
    origemX: Math.trunc(origemX),
    origemY: Math.trunc(origemY),
    larguraDeDestino: Math.trunc(novaLargura),
    alturaDeDestino: Math.trunc(novaAltura),
    larguraDeOrigem: Math.trunc(larguraRecortada),
    alturaDeOrigem: Math.trunc(alturaRecortada),
  };
}

/**
 * `(int) round( $valor )` do PHP para o recorte de valores deste calculo.
 *
 * O PHP arredonda meio **para longe do zero** e o JavaScript arredonda meio
 * **para cima**; as duas respostas sao diferentes so para valor negativo, e
 * aqui todo valor arredondado e um produto de dimensao por razao positiva.
 * Fica nomeado para que a diferenca nao se perca se algum chamador futuro
 * trouxer valor negativo.
 */
function arredondarComoPhp(valor: number): number {
  return Math.round(valor);
}
