/**
 * O nome do arquivo de cada derivada — `{nome}-{largura}x{altura}.{extensao}`.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). Sao duas
 * funcoes do editor do legado: `WP_Image_Editor::generate_filename()`
 * (`wp-includes/class-wp-image-editor.php:435`) com
 * `WP_Image_Editor::get_suffix()` (`:470`) dentro, e o recorte de
 * `WP_Image_Editor::get_output_format()` (`:344`) que decide a extensao.
 *
 * ── POR QUE O NOME E REGRA DE DOMINIO, E NAO DO ADAPTADOR ──────────────────
 *
 * Porque ele e **endereco publico**: o nome da derivada entra na marcacao que o
 * visitante baixa (US-6) e no conjunto de arquivos que a exclusao apaga (US-8).
 * As duas portas deste modulo registram, cada uma no seu cabecalho, que **nao
 * geram nome** — *"nome de arquivo e endereco publico, e o sufixo da copia
 * reduzida e pergunta em aberto da `spec.md`"* —, e e por isso que
 * {@link ImagemAberta.derivar} recebe o caminho decidido. Quem decide e este
 * arquivo.
 *
 * ⚠️ **A pergunta em aberto do sufixo NAO e esta.** A `spec.md` deixou aberto se
 * o `-scaled` da **copia reduzida** e contrato (T009); o `-{largura}x{altura}`
 * da derivada nao e pergunta nenhuma: ele e lido de volta pelo proprio legado,
 * em `_wp_check_existing_file_names()` (`wp-includes/functions.php:2870`,
 * `-(?:\d+x\d+|scaled|rotated)`), que e o laco 2 de
 * `../envio/nome-de-arquivo-unico.ts`. Mudar a forma deste nome quebraria a
 * resolucao de colisao de CA-1.4 do outro lado.
 *
 * ── A EXTENSAO NAO E SEMPRE A DA ORIGEM ────────────────────────────────────
 *
 * `make_subsize()` grava sem informar nome (`_save( $resized )`,
 * `class-wp-image-editor-gd.php:332`), e `_save()` resolve o formato de saida
 * antes de gerar o nome (`:524`). Tres coisas podem trocar a extensao, e as
 * tres sao do legado:
 *
 * 1. **a conversao declarada** por `wp_get_image_editor_output_format()`
 *    (`wp-includes/media.php:6542`), que **desde a versao 6.7 nao e um mapa
 *    vazio**: HEIC e HEIF convertem para JPEG. Enviar `foto.heic` produz
 *    derivadas `foto-150x150.jpg`. O mapa de fabrica esta em
 *    `../envio/nome-de-arquivo-unico.ts`
 *    (`CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA`), e e o mesmo que o laco 3 do
 *    nome unico consulta — o que faz o envio de um `.jpg` conferir tambem
 *    `foto.heic`, justamente porque as derivadas dos dois teriam o mesmo nome;
 * 2. **a conversao nao ser suportada** pela implementacao presente: o legado so
 *    converte se `supports_mime_type()` disser sim (`:372`), e essa pergunta e
 *    da porta ({@link PortaDeProcessamentoDeImagem.suporta});
 * 3. **o tipo da origem nao ser suportado**, e ai o legado cai no
 *    {@link TIPO_MIME_PADRAO_DO_EDITOR} (`:383`-`:394`) — e grava JPEG com nome
 *    `.jpg` para uma origem que nao e JPEG.
 */

import {
  CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA,
  extensaoPadraoDoTipo,
  type ListaDeTiposDeArquivo,
} from '../envio/index.js';

/**
 * `WP_Image_Editor::$default_mime_type` (`class-wp-image-editor.php:20`).
 *
 * E o tipo para onde o legado cai quando a implementacao presente nao suporta o
 * tipo resolvido, via o ponto de extensao `image_editor_default_mime_type`
 * (`:393`), que nao e emitido aqui (P2, `REQ-162`).
 */
export const TIPO_MIME_PADRAO_DO_EDITOR = 'image/jpeg';

/** O tipo e a extensao com que a derivada sera gravada. */
export interface FormatoDeSaida {
  /** O `mime-type` que vai para o metadado da derivada. */
  readonly tipoMime: string;
  /** A extensao do nome do arquivo, **sem ponto** e em minusculas. */
  readonly extensao: string;
}

/** O que {@link formatoDeSaidaDaDerivada} precisa saber da borda. */
export interface FormatoPedido {
  /** `$this->file` — o caminho do arquivo que a imagem carregada abriu. */
  readonly caminhoDaOrigem: string;
  /** `$this->mime_type` — o tipo com que a imagem foi carregada. */
  readonly tipoMimeDaOrigem: string;
  /** `supports_mime_type()` — a pergunta da porta, nao da lista permitida. */
  readonly suporta: (tipoMime: string) => boolean;
  /** `wp_get_image_editor_output_format()`. Omitido, vale o de fabrica. */
  readonly conversaoDeFormato?: ReadonlyMap<string, string>;
  /** `wp_get_mime_types()`, para resolver a extensao de um tipo. */
  readonly tiposDeArquivo?: ListaDeTiposDeArquivo;
}

/**
 * O recorte de `get_output_format( null, null )` que a geracao de derivada
 * alcanca (`wp-includes/class-wp-image-editor.php:344`).
 *
 * **Chamado sem nome e sem tipo**, que e como `make_subsize()` chega la, logo o
 * ramo do nome informado (`:352`) e o do tipo informado (`:348`) nao sao
 * alcancaveis daqui: `$file_ext` sai do caminho da origem e `$file_mime` sai do
 * tipo com que a imagem foi carregada, e a primeira resposta e sempre *"prefer
 * extension from file"* (`:365`).
 */
export function formatoDeSaidaDaDerivada(pedido: FormatoPedido): FormatoDeSaida {
  // "If no file specified, grab editor's current extension and mime-type."
  let tipoMime = pedido.tipoMimeDaOrigem;
  let extensao = extensaoDoCaminho(pedido.caminhoDaOrigem).toLowerCase();

  const conversao =
    pedido.conversaoDeFormato ?? CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA;
  const convertido = conversao.get(tipoMime);

  if (convertido !== undefined && pedido.suporta(convertido)) {
    tipoMime = convertido;
    extensao = extensaoPadraoDoTipo(tipoMime, pedido.tiposDeArquivo) ?? '';
  }

  /*
    "Double-check that the mime-type selected is supported by the editor. If
    not, choose a default instead." (`:379`)
  */
  if (!pedido.suporta(tipoMime)) {
    tipoMime = TIPO_MIME_PADRAO_DO_EDITOR;
    extensao = extensaoPadraoDoTipo(tipoMime, pedido.tiposDeArquivo) ?? '';
  }

  return { tipoMime, extensao };
}

/**
 * `WP_Image_Editor::generate_filename( null, null, $extension )` com
 * `get_suffix()` (`class-wp-image-editor.php:435` e `:470`).
 *
 * O caminho e o da **origem**: a pasta e o nome vem de `$this->file`, que e o
 * arquivo que a imagem carregada abriu. Logo a derivada nasce ao lado da origem
 * — e, quando houver copia reduzida, ao lado da copia ou do original conforme o
 * caminho que a abriu. 🔴 **Qual dos dois e conflito aberto**, registrado na
 * secao *O que T001 encontrou aberto* de `../README.md`: esta funcao nao o
 * resolve porque recebe o caminho pronto.
 *
 * ⚠️ **A extensao do nome e sempre a resolvida, e o resto do nome e sempre o da
 * origem**: `$name = wp_basename( $this->file, ".$ext" )` usa a extensao
 * **original** para cortar o nome, e `$new_ext` entra depois (`:446`-`:447`).
 * Para `foto.HEIC` convertida em JPEG o nome fica `foto-150x150.jpg`, com o
 * `HEIC` cortado pela comparacao sensivel a caixa de `basename()`.
 */
export function caminhoDaDerivada(
  caminhoDaOrigem: string,
  largura: number,
  altura: number,
  extensao: string,
): string {
  const pasta = pastaDoCaminho(caminhoDaOrigem);
  const extensaoDaOrigem = extensaoDoCaminho(caminhoDaOrigem);
  const nome = nomeBaseSemSufixo(
    nomeDoCaminho(caminhoDaOrigem),
    `.${extensaoDaOrigem}`,
  );
  const sufixo = `-${largura}x${altura}`;

  return `${comBarraNoFim(pasta)}${nome}${sufixo}.${extensao.toLowerCase()}`;
}

/** `pathinfo( $caminho, PATHINFO_DIRNAME )` — sem a barra do fim. */
function pastaDoCaminho(caminho: string): string {
  const barra = caminho.lastIndexOf('/');
  if (barra === -1) {
    // `dirname()` devolve `.` para nome sem pasta.
    return '.';
  }
  if (barra === 0) {
    return '/';
  }
  return caminho.slice(0, barra);
}

/** `wp_basename( $caminho )` — o que vem depois da ultima barra. */
function nomeDoCaminho(caminho: string): string {
  const barra = caminho.lastIndexOf('/');
  return barra === -1 ? caminho : caminho.slice(barra + 1);
}

/** `pathinfo( $caminho, PATHINFO_EXTENSION )` — sem o ponto, ou vazia. */
function extensaoDoCaminho(caminho: string): string {
  const nome = nomeDoCaminho(caminho);
  const ponto = nome.lastIndexOf('.');
  return ponto === -1 ? '' : nome.slice(ponto + 1);
}

/**
 * `wp_basename( $nome, ".$ext" )` — o mesmo `basename()` com sufixo que
 * `../envio/enviar-arquivo.ts` precisou: o sufixo so e removido quando **nao**
 * e o nome inteiro, e a comparacao e sensivel a caixa.
 */
function nomeBaseSemSufixo(nome: string, sufixo: string): string {
  if (sufixo !== '.' && nome !== sufixo && nome.endsWith(sufixo)) {
    return nome.slice(0, nome.length - sufixo.length);
  }
  return nome;
}

/** `trailingslashit()` — uma barra no fim, nunca duas. */
function comBarraNoFim(caminho: string): string {
  return caminho.endsWith('/') ? caminho : `${caminho}/`;
}
