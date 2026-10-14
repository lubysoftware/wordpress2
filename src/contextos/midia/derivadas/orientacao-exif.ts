/**
 * A rotacao da imagem de origem pela etiqueta de orientacao do EXIF, **antes**
 * de gerar as derivadas.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). E
 * `WP_Image_Editor::maybe_exif_rotate()`
 * (`wp-includes/class-wp-image-editor.php:486`), chamada por
 * `_wp_make_subsizes()` quando o metadado tem EXIF
 * (`wp-admin/includes/image.php:479`) — *"If stored EXIF data exists, rotate the
 * source image before creating sub-sizes"*.
 *
 * **Por que isto e de T007 e nao de outra tarefa:** porque sem ela as derivadas
 * de uma foto de celular saem com largura e altura trocadas, e CA-3.1 cobra *"as
 * proporcoes declaradas para aquele tamanho"*. E porque o `// TODO: Log errors.`
 * de `image.php:483` — a falha desta rotacao — e **um dos cinco pontos de `M4`**
 * (BR-MIGRAR-060), e os dois que estao dentro de `_wp_make_subsizes` (`:483` e
 * `:492`) sao os dois que esta tarefa tem de reproduzir em silencio.
 *
 * ── A LEITURA DO EXIF E BORDA, E A AUSENCIA DELA E UM ESTADO DO LEGADO ─────
 *
 * O legado le a etiqueta com `@exif_read_data( $this->file )`, e **so quando a
 * extensao de EXIF existe no servidor e o tipo e JPEG**:
 * `if ( is_callable( 'exif_read_data' ) && 'image/jpeg' === $this->mime_type )`
 * (`:489`). Logo *"servidor sem extensao de EXIF nao rotaciona"* e comportamento
 * do produto, nao lacuna deste porte — e e por isso que
 * {@link ContextoDeDerivadas.leituraDoArquivo} declara a leitura da orientacao
 * como **opcional**: omitida, este modulo responde exatamente o que o legado
 * responde num servidor sem a extensao.
 *
 * ⚠️ **A guarda do tipo JPEG fica aqui, e nao na borda.** Ela decide
 * comportamento observavel (um PNG com orientacao gravada **nao** e rotacionado
 * pelo legado), e por isso nao pode morar numa implementacao de borda que pode
 * ser trocada.
 *
 * ── A ARMADILHA DO NOME DOS DOIS EIXOS ─────────────────────────────────────
 *
 * 🔴 **`flip( $horz, $vert )` do legado NAO se traduz pelo nome do comentario.**
 * O caso 2 do `switch` diz *"Flip horizontally"* e chama `flip( false, true )`,
 * porque na assinatura `$horz` e *"Flip along Horizontal Axis"* — o eixo, nao o
 * sentido (`wp-includes/class-wp-image-editor-gd.php:444`). A porta deste
 * modulo tem `inverter( horizontal, vertical )` com os parametros **na mesma
 * posicao**, e e por posicao que este arquivo os passa. Quem traduzir pelo
 * comentario inverte a imagem no eixo errado em quatro dos sete casos.
 */

import type { ImagemAberta, OperacaoDeImagem } from '../portas/index.js';

/**
 * O que a rotacao informa de volta.
 *
 * ⚠️ **O legado tem quatro saidas e so tres sao distinguiveis:** `true`
 * (rotacionou), `false` (nao havia o que rotacionar), `WP_Error` (falhou) e
 * **`null`**, que e o que ele devolve quando a orientacao esta fora do `switch`
 * — `$result` nunca e atribuido e a funcao devolve variavel nao inicializada.
 * Os dois chamadores tratam `null` e `false` igual: um compara `true === $rotated`
 * (`wp-admin/includes/image.php:352`) e o outro pergunta `is_wp_error()`
 * (`:482`). Por isso `null` entra aqui como `rotacionou: false`, sem perder
 * nenhum observavel.
 */
export type RotacaoPorExif =
  | { readonly concluido: true; readonly rotacionou: boolean }
  | { readonly concluido: false; readonly motivo: string };

/** `'image/jpeg'` — o unico tipo em que o legado le a etiqueta (`:489`). */
export const TIPO_COM_ORIENTACAO_EXIF = 'image/jpeg';

/**
 * `maybe_exif_rotate()` (`wp-includes/class-wp-image-editor.php:486`).
 *
 * `orientacao` chega da borda, `null` quando nao ha etiqueta, quando o servidor
 * nao tem a extensao de EXIF ou quando o tipo nao e JPEG — os tres casos em que
 * o legado segue com `$orientation = null`.
 *
 * O ponto de extensao `wp_image_maybe_exif_rotate` (`:505`) entra entre a
 * leitura e a decisao, e **pode corrigir ou impedir** a rotacao. Nao e emitido:
 * o barramento e `REQ-162`, em `do-not-rewrite.md`. Fica nomeado na posicao.
 */
export function rotacionarPorOrientacaoExif(
  imagem: ImagemAberta,
  orientacao: number | null,
): RotacaoPorExif {
  if (imagem.tipoMime() !== TIPO_COM_ORIENTACAO_EXIF) {
    // A guarda de `:489`: sem JPEG o legado nunca le a etiqueta.
    return { concluido: true, rotacionou: false };
  }

  // `if ( ! $orientation || 1 === $orientation )` (`:507`) — o `0` tambem cai
  // aqui, pelo `!`, e e o valor que uma camera grava quando nao sabe.
  if (orientacao === null || orientacao === 0 || orientacao === 1) {
    return { concluido: true, rotacionou: false };
  }

  switch (orientacao) {
    case 2:
      // "Flip horizontally." — ver a armadilha no cabecalho.
      return concluir(imagem.inverter(false, true));
    case 3:
      /*
        "Rotate 180 degrees or flip horizontally and vertically. Flipping seems
        faster and uses less resources." (`:518`)
      */
      return concluir(imagem.inverter(true, true));
    case 4:
      // "Flip vertically."
      return concluir(imagem.inverter(true, false));
    case 5: {
      // "Rotate 90 degrees counter-clockwise and flip vertically."
      const girou = imagem.girar(90);
      if (!girou.concluido) {
        return { concluido: false, motivo: girou.motivo };
      }
      return concluir(imagem.inverter(true, false));
    }
    case 6:
      // "Rotate 90 degrees clockwise (270 counter-clockwise)."
      return concluir(imagem.girar(270));
    case 7: {
      // "Rotate 90 degrees counter-clockwise and flip horizontally."
      const girou = imagem.girar(90);
      if (!girou.concluido) {
        return { concluido: false, motivo: girou.motivo };
      }
      return concluir(imagem.inverter(false, true));
    }
    case 8:
      // "Rotate 90 degrees counter-clockwise."
      return concluir(imagem.girar(90));
    default:
      /*
        Orientacao fora de 2 a 8 — o `null` do legado. Ver
        {@link RotacaoPorExif}.
      */
      return { concluido: true, rotacionou: false };
  }
}

/** A saida de uma operacao da porta, na forma desta rotacao. */
function concluir(operacao: OperacaoDeImagem): RotacaoPorExif {
  return operacao.concluido
    ? { concluido: true, rotacionou: true }
    : { concluido: false, motivo: operacao.motivo };
}
