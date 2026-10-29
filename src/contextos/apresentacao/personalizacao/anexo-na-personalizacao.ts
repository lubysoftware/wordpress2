/**
 * O arquivo que entra pela personalizacao nasce como **rascunho automatico**.
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao`, US-1,
 * **CA-1.5**: *"Arquivo enviado dentro da personalizacao nasce como rascunho
 * automatico, para ser coletado se o conjunto for abandonado"*.
 *
 * ## Qual arquivo e esse, no legado
 *
 * Ha **um** caminho, e ele esta em `import_theme_starter_content()`: os anexos
 * do conteudo inicial do tema, inseridos quando a personalizacao abre numa
 * instalacao nova (`wp-includes/class-wp-customize-manager.php:1382`-`:1407`).
 * O comentario do legado diz o motivo com as palavras de CA-1.5:
 *
 * ```php
 * 'post_status' => 'auto-draft', // So attachment will be garbage collected in a week if changeset is never published.
 * ```
 *
 * (`:1397`). UC-29, fluxo *"Enviar imagem dentro do Customizer"*: *"E o unico uso
 * de rascunho automatico em anexo no sistema"* — e a regra que a ingestao de
 * `BC-04` reconhece, porque `wp_insert_post()` so aceita para anexo `inherit`,
 * `private`, `trash` **ou `auto-draft`** (`wp-includes/post.php:4705`).
 *
 * ## O que este arquivo entrega
 *
 * O **pedido** que o legado passa a `media_handle_sideload()` e os dois
 * metadados que ele grava em seguida — como dado, para que a ingestao de
 * `BC-04` o receba por ligacao tardia. A copia para arquivo temporario, a
 * ingestao e a geracao de derivadas sao de `BC-04` (`contextos/midia/`), e o
 * fluxo de conteudo inicial inteiro — `fresh_site`, o registro do tema, os
 * conteudos e as paginas — nao e criterio de US-1.
 *
 * ⚠️ **O prazo nao nasce aqui.** *"Garbage collected in a week"* e a varredura
 * de rascunho automatico do conteudo, cujos **7 dias** moram na feature `005`
 * (T013). O **P6** proibe redeclarar o numero.
 */

import { ESTADO_DE_RASCUNHO_AUTOMATICO } from '../armazenamento/index.js';

/**
 * Um anexo do conteudo inicial, como `get_theme_starter_content()` o entrega
 * depois de `prepare_starter_content_attachments()` (`:1659`-`:1708`).
 */
export interface AnexoDeConteudoInicial {
  readonly post_title?: string;
  readonly post_content?: string;
  readonly post_excerpt?: string;
  /** O nome simbolico do anexo no conteudo inicial (`:1695`-`:1701`). */
  readonly post_name: string;
}

/** Os campos do registro que `media_handle_sideload()` recebe. */
export interface DadosDoAnexoNaPersonalizacao {
  readonly post_title?: string;
  readonly post_content?: string;
  readonly post_excerpt?: string;
  readonly post_status: typeof ESTADO_DE_RASCUNHO_AUTOMATICO;
}

/** O pedido inteiro: o registro, o pai e os dois metadados, na ordem do legado. */
export interface PedidoDoAnexoNaPersonalizacao {
  /** `$post_data` de `media_handle_sideload( $file_array, 0, null, $post_data )`. */
  readonly dados: DadosDoAnexoNaPersonalizacao;
  /** O segundo argumento: `0`, nenhum pai. */
  readonly paiId: 0;
  /** `update_post_meta()` depois da insercao (`:1405`-`:1406`). */
  readonly metadados: readonly (readonly [string, string])[];
}

/** `_starter_content_theme` — a folha de estilo do tema que trouxe o anexo. */
export const METADADO_DO_TEMA_DO_CONTEUDO_INICIAL = '_starter_content_theme';

/** `_customize_draft_post_name` — o nome simbolico, para reaproveitar o anexo. */
export const METADADO_DO_NOME_NO_RASCUNHO = '_customize_draft_post_name';

/**
 * O pedido de insercao do anexo do conteudo inicial (`:1394`-`:1406`).
 *
 * `wp_array_slice_assoc( $attachment, array( 'post_title', 'post_content',
 * 'post_excerpt' ) )` (`wp-includes/functions.php:5109`) copia so as chaves que
 * **existem e nao sao nulas** (`isset()`), na ordem da lista; `array_merge()`
 * acrescenta o estado por ultimo.
 */
export function pedidoDoAnexoNaPersonalizacao(
  anexo: AnexoDeConteudoInicial,
  folhaDeEstilo: string,
): PedidoDoAnexoNaPersonalizacao {
  const dados: {
    post_title?: string;
    post_content?: string;
    post_excerpt?: string;
  } = {};
  if (anexo.post_title !== undefined) {
    dados.post_title = anexo.post_title;
  }
  if (anexo.post_content !== undefined) {
    dados.post_content = anexo.post_content;
  }
  if (anexo.post_excerpt !== undefined) {
    dados.post_excerpt = anexo.post_excerpt;
  }
  return {
    dados: { ...dados, post_status: ESTADO_DE_RASCUNHO_AUTOMATICO },
    paiId: 0,
    metadados: [
      [METADADO_DO_TEMA_DO_CONTEUDO_INICIAL, folhaDeEstilo],
      [METADADO_DO_NOME_NO_RASCUNHO, anexo.post_name],
    ],
  };
}
