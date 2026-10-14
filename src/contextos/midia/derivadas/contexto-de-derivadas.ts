/**
 * O contexto da geracao de derivadas: tudo que US-3 precisa e que **nao e**
 * regra desta pasta.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). Mesma forma e
 * mesmas razoes de `../envio/contexto-de-envio.ts`, e as duas valem palavra por
 * palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo** (AD-02, `EXT-CONTEXTO`,
 *   BR-MIGRAR-105): a lista de tamanhos registrados e estado de **requisicao** —
 *   `add_image_size()` a preenche a cada requisicao —, e duas composicoes nunca
 *   podem enxergar o tamanho que a outra registrou;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta** (AD-08,
 *   AD-10, regra de dependencia 3).
 *
 * ---
 *
 * # O inventario do que o legado chama, e de quem e cada coisa
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `wp_get_image_editor()`, `make_subsize()`, `maybe_exif_rotate()` | borda de processamento de imagem | {@link ContextoDeDerivadas.processamentoDeImagem} — **porta** (AD-08, T001) |
 * | `wp_get_upload_dir()['basedir']` | borda de sistema de arquivos | {@link ContextoDeDerivadas.sistemaDeArquivos} — **porta** (T001) |
 * | `wp_get_attachment_metadata()`, `wp_update_attachment_metadata()`, `get_attached_file()` | o armazenamento de T002 | {@link ArmazenamentoNasDerivadas} |
 * | `wp_getimagesize()`, `wp_filesize()`, `wp_read_image_metadata()`, `@exif_read_data()` | borda de leitura de arquivo | {@link LeituraDeArquivoDeImagem} |
 * | `get_option( '{tamanho}_size_w' )` e as outras oito | a feature que declara a tabela de opcoes | {@link OpcoesDeTamanhoDeImagem} |
 * | `$_wp_additional_image_sizes` | estado de **requisicao** | {@link ContextoDeDerivadas.tamanhosAdicionais} |
 * | `wp_attachment_is_image()` | BC-01 **mais** identidade — ver abaixo | {@link ConteudoNasDerivadas} |
 *
 * ---
 *
 * # Por que a porta de processamento chega pelo CONTEXTO, e nao pela composicao
 *
 * Pelo mesmo motivo que a de sistema de arquivos chegou assim em T003: a
 * operacao e funcao pura de (contexto, pedido), e e assim que o cenario
 * `@composicao` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`
 * substitui *"a porta ... por duplo que registra cada operacao"* sem tocar
 * arquivo nenhum deste modulo. `criarModuloDeMidia()` continua recebendo as tres
 * portas e **nao** as injeta por dentro.
 *
 * ---
 *
 * # Tres coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **Nenhuma capacidade, e nenhum ator.** A pauta que T001 escreveu no
 *    `index.ts` deste modulo e literal para esta linha: *"gerar derivadas |
 *    US-3 | T007 | o pacote nao declara nenhuma; CA-3.3 pede uma acao explicita
 *    para regerar, e **quem a expor declara a dela** (P4)"*. E e o que o legado
 *    faz: `wp_create_image_subsizes()` e `wp_update_image_subsizes()` nao
 *    perguntam capacidade nenhuma, e as **duas** superficies que as chamam
 *    perguntam coisas **diferentes** — o envio assincrono do editor pede
 *    `upload_files` (`wp-admin/includes/ajax-actions.php:2552`) e a rota REST de
 *    pos-processamento pede `edit_post` do anexo
 *    (`class-wp-rest-attachments-controller.php:1052`, que delega para
 *    `update_item_permissions_check()`). Mover qualquer uma das duas para dentro
 *    tornaria a outra superficie **mais fechada ou mais aberta** que o legado, e
 *    P1 nao autoriza nem uma coisa nem outra. As duas estao declaradas em
 *    `regerar-derivadas.ts`, no lugar exato.
 * 2. **O relogio.** Nenhum passo desta historia le instante: os numeros dela sao
 *    medida em pixel (P6).
 * 3. **O barramento de pontos de extensao.** Sao **seis** neste caminho
 *    (`intermediate_image_sizes`, `intermediate_image_sizes_advanced`,
 *    `wp_generate_attachment_metadata`, `wp_get_missing_image_subsizes`,
 *    `image_make_intermediate_size`, `wp_image_maybe_exif_rotate`), mais os tres
 *    de `dimensoes-de-redimensionamento.ts`. `REQ-162` esta em
 *    `do-not-rewrite.md` — escopo **recusado**, nao pendente —, e cada um esta
 *    nomeado na posicao exata do fluxo, que e o que o **P2** cobra de quem nao o
 *    implementa.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type { RepositorioDeMetadadoDeAnexo } from '../armazenamento/index.js';
import type { ListaDeTiposDeArquivo } from '../envio/index.js';
import type {
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
} from '../portas/index.js';
import type {
  OpcoesDeTamanhoDeImagem,
  TamanhoAdicional,
} from './tamanhos-registrados.js';

/**
 * O que a geracao de derivadas le e grava do armazenamento de T002.
 *
 * **Tres operacoes, e nenhuma a mais.** O caminho le o metadado, grava o
 * metadado **uma vez por derivada** e le o caminho do arquivo anexado. Nao
 * grava `_wp_attached_file`: quem o grava e a reducao na ingestao, por
 * `update_attached_file()` dentro de `_wp_image_meta_replace_original()`
 * (`wp-admin/includes/image.php:210`), e isso e **T009**.
 */
export interface ArmazenamentoNasDerivadas {
  readonly metadadoDeAnexo: RepositorioDeMetadadoDeAnexo;
}

/**
 * As quatro leituras de arquivo que este caminho faz e que **nenhuma das duas
 * portas tem**.
 *
 * Nao sao porta por causa de AD-08, pela mesma razao que `DeteccaoDeTipoReal` de
 * T003 nao e: *"uma implementacao, uma operacao"*. E nao entram na porta de
 * sistema de arquivos porque ela declara, no cabecalho, que **nao interpreta
 * conteudo**: o que ela tem e `ler`, que devolve bytes — e contar bytes de um
 * arquivo lendo o arquivo inteiro emitiria uma operacao de disco que o legado
 * nao emite (`wp_filesize()` e `filesize()`, nao `file_get_contents()`).
 */
export interface LeituraDeArquivoDeImagem {
  /**
   * `wp_getimagesize( $file )` (`wp-includes/media.php`, e `getimagesize()`
   * dentro).
   *
   * `null` e o `false`/arranjo vazio do legado, e ele decide o primeiro desvio
   * de `wp_create_image_subsizes()`: *"File is not an image"* → devolve
   * `array()` e **nenhuma derivada e gerada** (`wp-admin/includes/image.php:243`).
   */
  dimensoes(caminho: string): DimensoesLidasDoArquivo | null;

  /**
   * `wp_filesize( $file )` (`wp-includes/functions.php`).
   *
   * Vai para `filesize` do metadado (`image.php:253`). Devolve `0` quando o
   * arquivo nao pode ser medido, que e o que `wp_filesize()` faz — e `0` **e
   * gravado**, porque o legado grava o que a funcao devolveu.
   */
  bytes(caminho: string): number;

  /**
   * `wp_read_image_metadata( $file )` (`wp-admin/includes/image.php:825`).
   *
   * ⚠️ **Atravessa como {@link ValorPhp} e nao e interpretado aqui**, porque a
   * ordem das chaves **dele** tambem e byte na coluna: e o que
   * `../armazenamento/derivadas.ts` registrou ao deixar esta leitura para a
   * tarefa que ingere — *"aqui ele atravessa como ValorPhp, sem interpretacao"*.
   *
   * **Opcional, e a omissao e um estado do legado:** sem as extensoes de EXIF e
   * IPTC a funcao devolve `false`, a chave `image_meta` **nao entra** no
   * metadado, e a rotacao por orientacao nao acontece — exatamente o que
   * acontece aqui quando a leitura nao e informada.
   */
  metadadoDeImagem?: (caminho: string) => ValorPhp | null;

  /**
   * `@exif_read_data( $this->file )['Orientation']`
   * (`wp-includes/class-wp-image-editor.php:490`).
   *
   * **Opcional pelo mesmo motivo, e com o mesmo efeito:** o legado so le a
   * etiqueta `if ( is_callable( 'exif_read_data' ) )`, logo servidor sem a
   * extensao nao rotaciona. A guarda do tipo JPEG **nao** esta aqui — ela e
   * regra observavel e mora em `orientacao-exif.ts`.
   */
  orientacaoExif?: (caminho: string) => number | null;
}

/** O que `wp_getimagesize()` devolve, no recorte que este caminho le. */
export interface DimensoesLidasDoArquivo {
  /** `$imagesize[0]`, que vai inteiro para `width` (`image.php:250`). */
  readonly largura: number;
  /** `$imagesize[1]`, que vai inteiro para `height` (`:251`). */
  readonly altura: number;
  /**
   * `$imagesize['mime']`.
   *
   * Lido por **um** ramo so, o da conversao de formato na ingestao
   * (`image.php:300`-`:307`), que e **T009**. Esta declarado porque e o que a
   * borda devolve, e porque omiti-lo obrigaria T009 a mudar esta forma.
   */
  readonly tipoMime: string;
}

/**
 * A unica pergunta que este caminho faz a BC-01 — `wp_attachment_is_image()`
 * (`wp-includes/post.php:7391`, que e `wp_attachment_is( 'image', $post )` em
 * `:7332`).
 *
 * **E ligacao tardia, e nao e portada aqui, por uma razao que nao e de
 * fronteira e sim de identidade.** A funcao do legado le tres coisas: o
 * `post_mime_type` da linha do anexo (BC-01), o `_wp_attached_file` (que e o
 * armazenamento deste modulo) e `wp_check_filetype( $file )` — que, **sem lista
 * informada, resolve `get_allowed_mime_types()` por dentro**
 * (`wp-includes/functions.php:3081`), e essa funcao pergunta
 * `current_user_can( 'unfiltered_html' )` (`:3698`). Logo a pergunta depende de
 * **quem esta na requisicao**, que e escopo de REQUISICAO (`EXT-CONTEXTO`) e nao
 * esta neste contexto de proposito (ver o item 1 do cabecalho deste arquivo).
 *
 * ⚠️ Quem a implementar precisa reproduzir o ramo `'import' !== $post_mime_type`
 * (`:7357`), que compara o **tipo pedido com a extensao** — `wp_attachment_is(
 * 'image', ... )` com um anexo de extensao `jpg` devolve `'image' === 'jpg'`,
 * que e **falso**, e e so o primeiro `str_starts_with( $post->post_mime_type,
 * 'image/' )` que salva o caso comum.
 */
export interface ConteudoNasDerivadas {
  /** `wp_attachment_is_image( $attachment_id )`. */
  ehAnexoDeImagem(anexoId: number): boolean;
}

/**
 * O contexto da geracao de derivadas.
 *
 * Chega por **argumento**, e nao pela composicao, pela razao do cabecalho deste
 * arquivo.
 */
export interface ContextoDeDerivadas {
  /** A borda da biblioteca de imagem (porta de T001). */
  readonly processamentoDeImagem: PortaDeProcessamentoDeImagem;
  /**
   * A borda do disco (porta de T001).
   *
   * Lida por **um** campo: `raizDeEnvios`, que e o `basedir` de
   * `wp_get_upload_dir()` e de onde sai o caminho relativo gravado em `file`.
   * Nenhuma operacao de disco sai daqui — quem grava arquivo e a porta de
   * processamento, como no legado.
   */
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  /** A forma de armazenamento de T002, no recorte que este caminho usa. */
  readonly armazenamento: ArmazenamentoNasDerivadas;
  /** A pergunta de BC-01 (ligacao tardia, AD-10). */
  readonly conteudo: ConteudoNasDerivadas;
  /** As quatro leituras de arquivo, duas delas opcionais. */
  readonly leituraDoArquivo: LeituraDeArquivoDeImagem;
  /** `get_option()` para as nove opcoes de tamanho. */
  readonly opcoesDeTamanho: OpcoesDeTamanhoDeImagem;
  /**
   * `$_wp_additional_image_sizes` — o que `add_image_size()` registrou **nesta
   * requisicao**.
   *
   * Omitido, valem os dois de fabrica (`1536x1536` e `2048x2048`), que e o que
   * uma instalacao de fabrica tem depois do arranque. Lista **vazia** e um
   * estado alcancavel — basta uma extensao remover os dois — e nela so os quatro
   * tamanhos de opcao sao gerados.
   */
  readonly tamanhosAdicionais?: readonly TamanhoAdicional[];
  /**
   * `wp_get_mime_types()`, para resolver a extensao de um tipo convertido.
   *
   * Omitida, valem as 93 entradas de fabrica de `../envio/`.
   */
  readonly tiposDeArquivo?: ListaDeTiposDeArquivo;
  /**
   * `wp_get_image_editor_output_format()` (`wp-includes/media.php:6542`).
   *
   * Omitido, vale o de fabrica, que **nao** e vazio desde a versao 6.7 — ver
   * `nome-da-derivada.ts`.
   */
  readonly conversaoDeFormatoDoEditor?: ReadonlyMap<string, string>;
}
