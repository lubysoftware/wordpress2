/**
 * A lista de tipos permitidos, e a decisao de tipo pela extensao.
 *
 * Entrega de **T003** (US-1), metade de **CA-1.2**: *"o tipo e decidido pelo
 * conteudo do arquivo, nao pela extensao informada, e confrontado com a lista de
 * tipos permitidos"*. A **lista** esta aqui; a decisao pelo conteudo esta em
 * `tipo-real-do-arquivo.ts`, que confronta uma com a outra.
 *
 * ── A LISTA E DADO, E A ORDEM DELA E OBSERVAVEL ────────────────────────────
 *
 * `wp_get_mime_types()` (`wp-includes/functions.php:3471`) devolve um arranjo
 * associativo de **padrao de extensao** para tipo MIME, e `wp_check_filetype()`
 * (`:3080`) o percorre com `foreach` e **para no primeiro que casa** (`break`,
 * `:3093`). Logo a ordem das 93 entradas e comportamento: ela decide qual tipo
 * sai quando duas entradas poderiam casar a mesma extensao. Por isso a lista e
 * {@link ListaDeTiposDeArquivo} — par ordenado, nao mapa.
 *
 * Os comentarios de secao do legado (*"Image formats"*, *"Video formats"*, ...)
 * estao transcritos, porque e por eles que se confere a transcricao contra a
 * arvore.
 *
 * ── DUAS COISAS QUE A LISTA DE FABRICA NAO E ───────────────────────────────
 *
 * 1. **Nao e a lista permitida.** `get_allowed_mime_types()` (`:3693`) e que
 *    decide: ela **retira** `swf` e `exe` sempre, e retira `htm|html` e `js` de
 *    quem nao tem `unfiltered_html`. {@link tiposPermitidos} faz as duas, e a
 *    segunda e pergunta de capacidade — logo a lista permitida **depende de quem
 *    pergunta**, e nao e constante.
 * 2. **Nao e fechada.** As duas sao pontos de extensao publicos (`mime_types` e
 *    `upload_mimes`, P2), e o segundo e nomeado pelo proprio legado como *"the
 *    filter to remove mime types"*. Por isso {@link tiposPermitidos} recebe a
 *    lista por argumento com a de fabrica como omissao, e nao a resolve de
 *    dentro.
 *
 * ⚠️ **`psd` e `xcf` compartilham `application/octet-stream` com nada mais**, e
 * isso interage com a tabela de vetos de `tipo-real-do-arquivo.ts`: um `.psd`
 * cujo `finfo` devolve `application/octet-stream` passa, porque o tipo esperado
 * comeca em `application`. Esta registrado aqui porque quem le so a lista nao
 * ve a interacao.
 */

/** Uma entrada da lista: o padrao de extensao do legado, e o tipo MIME dele. */
export interface TipoDeArquivoDeclarado {
  /**
   * O **padrao** de extensao, como o legado o escreve: `jpg|jpeg|jpe`.
   *
   * E chave de arranjo no legado e vira regex em `wp_check_filetype()`
   * (`'!\.(' . $ext_preg . ')$!i'`, `wp-includes/functions.php:3089`). Nao e um
   * nome de extensao, e por isso o campo nao se chama `extensao`.
   */
  readonly padraoDeExtensao: string;
  readonly tipoMime: string;
}

/** A lista, na ordem em que o legado a declara. Ordem e comportamento. */
export type ListaDeTiposDeArquivo = readonly TipoDeArquivoDeclarado[];

function tipo(
  padraoDeExtensao: string,
  tipoMime: string,
): TipoDeArquivoDeclarado {
  return { padraoDeExtensao, tipoMime };
}

/**
 * `wp_get_mime_types()` — as 93 entradas de fabrica, na ordem
 * (`wp-includes/functions.php:3486` a `:3597`).
 *
 * Congelada porque e dado compartilhado e o modulo nao guarda estado
 * (`EXT-CONTEXTO`, BR-MIGRAR-105) — mesma razao de
 * `tamanhos/tamanhos-de-fabrica.ts`.
 */
export const TIPOS_DE_ARQUIVO_DE_FABRICA: ListaDeTiposDeArquivo = Object.freeze([
  // Image formats.
  tipo('jpg|jpeg|jpe', 'image/jpeg'),
  tipo('gif', 'image/gif'),
  tipo('png', 'image/png'),
  tipo('bmp', 'image/bmp'),
  tipo('tiff|tif', 'image/tiff'),
  tipo('webp', 'image/webp'),
  tipo('avif', 'image/avif'),
  tipo('ico', 'image/x-icon'),

  // TODO: Needs improvement. All images with the following mime types seem to
  // have .heic file extension. (o TODO e do legado, `:3496`)
  tipo('heic', 'image/heic'),
  tipo('heif', 'image/heif'),
  tipo('heics', 'image/heic-sequence'),
  tipo('heifs', 'image/heif-sequence'),

  // Video formats.
  tipo('asf|asx', 'video/x-ms-asf'),
  tipo('wmv', 'video/x-ms-wmv'),
  tipo('wmx', 'video/x-ms-wmx'),
  tipo('wm', 'video/x-ms-wm'),
  tipo('avi', 'video/avi'),
  tipo('divx', 'video/divx'),
  tipo('flv', 'video/x-flv'),
  tipo('mov|qt', 'video/quicktime'),
  tipo('mpeg|mpg|mpe', 'video/mpeg'),
  tipo('mp4|m4v', 'video/mp4'),
  tipo('ogv', 'video/ogg'),
  tipo('webm', 'video/webm'),
  tipo('mkv', 'video/x-matroska'),
  tipo('3gp|3gpp', 'video/3gpp'), // Can also be audio.
  tipo('3g2|3gp2', 'video/3gpp2'), // Can also be audio.

  // Text formats.
  tipo('txt|asc|c|cc|h|srt', 'text/plain'),
  tipo('csv', 'text/csv'),
  tipo('tsv', 'text/tab-separated-values'),
  tipo('ics', 'text/calendar'),
  tipo('rtx', 'text/richtext'),
  tipo('css', 'text/css'),
  tipo('htm|html', 'text/html'),
  tipo('vtt', 'text/vtt'),
  tipo('dfxp', 'application/ttaf+xml'),

  // Audio formats.
  tipo('mp3|m4a|m4b', 'audio/mpeg'),
  tipo('aac', 'audio/aac'),
  tipo('ra|ram', 'audio/x-realaudio'),
  tipo('wav|x-wav', 'audio/wav'),
  tipo('ogg|oga', 'audio/ogg'),
  tipo('flac', 'audio/flac'),
  tipo('mid|midi', 'audio/midi'),
  tipo('wma', 'audio/x-ms-wma'),
  tipo('wax', 'audio/x-ms-wax'),
  tipo('mka', 'audio/x-matroska'),

  // Misc application formats.
  tipo('rtf', 'application/rtf'),
  tipo('js', 'application/javascript'),
  tipo('pdf', 'application/pdf'),
  tipo('swf', 'application/x-shockwave-flash'),
  tipo('class', 'application/java'),
  tipo('tar', 'application/x-tar'),
  tipo('zip', 'application/zip'),
  tipo('gz|gzip', 'application/x-gzip'),
  tipo('rar', 'application/rar'),
  tipo('7z', 'application/x-7z-compressed'),
  tipo('exe', 'application/x-msdownload'),
  tipo('psd', 'application/octet-stream'),
  tipo('xcf', 'application/octet-stream'),

  // MS Office formats.
  tipo('doc', 'application/msword'),
  tipo('pot|pps|ppt', 'application/vnd.ms-powerpoint'),
  tipo('wri', 'application/vnd.ms-write'),
  tipo('xla|xls|xlt|xlw', 'application/vnd.ms-excel'),
  tipo('mdb', 'application/vnd.ms-access'),
  tipo('mpp', 'application/vnd.ms-project'),
  tipo(
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ),
  tipo('docm', 'application/vnd.ms-word.document.macroEnabled.12'),
  tipo(
    'dotx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  ),
  tipo('dotm', 'application/vnd.ms-word.template.macroEnabled.12'),
  tipo(
    'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ),
  tipo('xlsm', 'application/vnd.ms-excel.sheet.macroEnabled.12'),
  tipo('xlsb', 'application/vnd.ms-excel.sheet.binary.macroEnabled.12'),
  tipo(
    'xltx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  ),
  tipo('xltm', 'application/vnd.ms-excel.template.macroEnabled.12'),
  tipo('xlam', 'application/vnd.ms-excel.addin.macroEnabled.12'),
  tipo(
    'pptx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ),
  tipo('pptm', 'application/vnd.ms-powerpoint.presentation.macroEnabled.12'),
  tipo(
    'ppsx',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  ),
  tipo('ppsm', 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'),
  tipo(
    'potx',
    'application/vnd.openxmlformats-officedocument.presentationml.template',
  ),
  tipo('potm', 'application/vnd.ms-powerpoint.template.macroEnabled.12'),
  tipo('ppam', 'application/vnd.ms-powerpoint.addin.macroEnabled.12'),
  tipo(
    'sldx',
    'application/vnd.openxmlformats-officedocument.presentationml.slide',
  ),
  tipo('sldm', 'application/vnd.ms-powerpoint.slide.macroEnabled.12'),
  tipo('onetoc|onetoc2|onetmp|onepkg', 'application/onenote'),
  tipo('oxps', 'application/oxps'),
  tipo('xps', 'application/vnd.ms-xpsdocument'),

  // OpenOffice formats.
  tipo('odt', 'application/vnd.oasis.opendocument.text'),
  tipo('odp', 'application/vnd.oasis.opendocument.presentation'),
  tipo('ods', 'application/vnd.oasis.opendocument.spreadsheet'),
  tipo('odg', 'application/vnd.oasis.opendocument.graphics'),
  tipo('odc', 'application/vnd.oasis.opendocument.chart'),
  tipo('odb', 'application/vnd.oasis.opendocument.database'),
  tipo('odf', 'application/vnd.oasis.opendocument.formula'),

  // WordPerfect formats.
  tipo('wp|wpd', 'application/wordperfect'),

  // iWork formats.
  tipo('key', 'application/vnd.apple.keynote'),
  tipo('numbers', 'application/vnd.apple.numbers'),
  tipo('pages', 'application/vnd.apple.pages'),
]);

/**
 * As duas entradas que `get_allowed_mime_types()` retira **sempre**
 * (`wp-includes/functions.php:3695`, `unset( $t['swf'], $t['exe'] )`).
 *
 * Elas continuam em {@link TIPOS_DE_ARQUIVO_DE_FABRICA} de proposito: o legado
 * as declara e depois as retira, e quem as apagasse da lista de fabrica mudaria
 * o que o ponto de extensao `mime_types` entrega a uma extensao.
 */
export const PADROES_SEMPRE_RETIRADOS: readonly string[] = ['swf', 'exe'];

/**
 * As duas entradas que so chegam a quem tem `unfiltered_html`
 * (`wp-includes/functions.php:3702`, `unset( $t['htm|html'], $t['js'] )`).
 *
 * ⚠️ A capacidade perguntada e `unfiltered_html`, **nao** `unfiltered_upload`:
 * sao duas perguntas diferentes em dois lugares diferentes do mesmo envio. Esta
 * decide a **lista**; a outra decide se o envio passa **apesar** da lista, e
 * esta em `tipo-real-do-arquivo.ts`.
 */
export const PADROES_DE_HTML_BRUTO: readonly string[] = ['htm|html', 'js'];

/** `unfiltered_html` — a capacidade que amplia a lista. */
export const CAPACIDADE_DE_HTML_BRUTO = 'unfiltered_html';

/**
 * `get_allowed_mime_types()` — a lista de fabrica menos o que ela retira
 * (`wp-includes/functions.php:3693`).
 *
 * `temHtmlBruto` e a resposta de `current_user_can( 'unfiltered_html' )`
 * (`:3698`). Ela chega **decidida**, por argumento, porque a decisao de
 * capacidade e de `plataforma/autorizacao/` e porque o legado tambem aceita
 * perguntar por **outra** conta (`user_can( $user, ... )`, `:3698`) — e o
 * parametro `$user` desta funcao e o unico lugar do envio em que a pergunta nao
 * e sobre quem esta na requisicao.
 *
 * A ordem das entradas restantes e a da lista de entrada: no legado `unset()`
 * nao reordena, e a ordem decide o tipo (ver o cabecalho).
 */
export function tiposPermitidos(
  temHtmlBruto: boolean,
  lista: ListaDeTiposDeArquivo = TIPOS_DE_ARQUIVO_DE_FABRICA,
): ListaDeTiposDeArquivo {
  const retirados = temHtmlBruto
    ? PADROES_SEMPRE_RETIRADOS
    : [...PADROES_SEMPRE_RETIRADOS, ...PADROES_DE_HTML_BRUTO];

  return lista.filter(
    (entrada) => !retirados.includes(entrada.padraoDeExtensao),
  );
}

/**
 * O que `wp_check_filetype()` devolve: a extensao casada e o tipo, ou as duas
 * ausentes (`wp-includes/functions.php:3080`).
 *
 * As duas sao `false` juntas no legado, nunca uma so — e e por isso que aqui sao
 * uma uniao e nao dois campos opcionais: `{ ext: 'jpg', type: false }` nao e um
 * estado que o legado produza nesta funcao.
 */
export type TipoPelaExtensao =
  | {
      readonly reconhecido: true;
      /**
       * `$ext_matches[1]` — a extensao **como esta no nome do arquivo**, com a
       * caixa que ele tem.
       *
       * ⚠️ Nao e o padrao da lista e nao e a extensao normalizada: `foo.JPG`
       * devolve `JPG`. A caixa sobrevive daqui ate
       * `nome-de-arquivo-unico.ts`, que e quem decide o nome final — e la ela
       * gera um nome **alternativo** em minusculas que tambem e testado contra
       * colisao.
       */
      readonly extensao: string;
      readonly tipoMime: string;
    }
  | { readonly reconhecido: false };

/** O valor de "nao reconhecido", para quem compara por identidade. */
export const TIPO_NAO_RECONHECIDO: TipoPelaExtensao = Object.freeze({
  reconhecido: false,
});

/**
 * Casa o nome do arquivo contra um padrao de extensao da lista.
 *
 * ⚠️ **O `\n?` nao e enfeite: ele reproduz o `$` do PCRE.** O legado monta
 * `'!\.(' . $ext_preg . ')$!i'` (`wp-includes/functions.php:3089`) **sem** o
 * modificador `D`, e sem ele o `$` do PCRE casa no fim da cadeia **ou
 * imediatamente antes de um unico `\n` final**. Logo, no legado, um arquivo
 * chamado `relatorio.js\n` e reconhecido como `js`. O `$` do JavaScript sem a
 * flag `m` casa **so** no fim, e um porte literal recusaria esse nome — o que e
 * mais fechado que o legado, e P1 nao autoriza mais fechado sem decisao humana
 * registrada.
 */
function regexDeExtensao(padraoDeExtensao: string): RegExp {
  return new RegExp(`\\.(${padraoDeExtensao})\\n?$`, 'i');
}

/**
 * `wp_check_filetype( $filename, $mimes )` — o tipo **pela extensao**
 * (`wp-includes/functions.php:3080`).
 *
 * Percorre a lista na ordem e para na primeira entrada que casa o fim do nome.
 * Lista vazia devolve nao reconhecido, que e o `false` do legado — e nao ha
 * fallback: `wp_check_filetype()` nao olha o conteudo. Quem olha o conteudo e
 * `tipo-real-do-arquivo.ts`, e e essa divisao que faz CA-1.2 ser **confronto** e
 * nao substituicao.
 *
 * ⚠️ **A lista chega por argumento, e `empty( $mimes )` do legado nao e
 * reproduzido aqui de proposito.** No legado, `wp_check_filetype()` chamada sem
 * lista resolve `get_allowed_mime_types()` por dentro (`:3081`) — o que faz a
 * funcao consultar capacidade sem receber ator. Neste porte a resolucao e
 * sempre de quem chama, porque identidade e escopo de REQUISICAO
 * (`EXT-CONTEXTO`) e uma funcao que a resolve sozinha nao tem de onde.
 */
export function tipoPelaExtensao(
  nomeDeArquivo: string,
  lista: ListaDeTiposDeArquivo,
): TipoPelaExtensao {
  for (const entrada of lista) {
    const casado = regexDeExtensao(entrada.padraoDeExtensao).exec(
      nomeDeArquivo,
    );
    const extensao = casado?.[1];
    if (extensao !== undefined) {
      return {
        reconhecido: true,
        extensao,
        tipoMime: entrada.tipoMime,
      };
    }
  }
  return TIPO_NAO_RECONHECIDO;
}

/**
 * `wp_get_default_extension_for_mime_type( $mime_type )` — a **primeira**
 * extensao daquele tipo (`wp-includes/functions.php:3053`).
 *
 * `array_search( ..., true )` devolve a primeira **chave** cujo valor e o tipo,
 * e `explode( '|', ... )[0]` a primeira extensao dela. Daqui sai `heic` para
 * `image/heic` e `jpg` para `image/jpeg`. Devolve `null` onde o legado devolve
 * `false`, inclusive quando a chave casada comeca com `|` — que e o
 * `empty( $extensions[0] )` de `:3057`.
 *
 * Quem consome e `nome-de-arquivo-unico.ts`, na lista de nomes alternativos que
 * a conversao de formato do editor de imagem pode produzir.
 */
export function extensaoPadraoDoTipo(
  tipoMime: string,
  lista: ListaDeTiposDeArquivo = TIPOS_DE_ARQUIVO_DE_FABRICA,
): string | null {
  const entrada = lista.find((candidata) => candidata.tipoMime === tipoMime);
  if (entrada === undefined) {
    return null;
  }
  const primeira = entrada.padraoDeExtensao.split('|')[0];
  return primeira === undefined || primeira === '' ? null : primeira;
}
