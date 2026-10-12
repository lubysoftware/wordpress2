/**
 * **CA-1.2**: o tipo e decidido pelo **conteudo** do arquivo, nao pela extensao
 * informada, e confrontado com a lista de tipos permitidos.
 *
 * Entrega de **T003** (US-1). E `wp_check_filetype_and_ext()`
 * (`wp-includes/functions.php:3124`), a funcao que o titulo da tarefa nomeia —
 * *"validando o tipo real do arquivo"* — e o passo 4 de UC-12.
 *
 * ── O QUE "TIPO REAL" SIGNIFICA NO LEGADO, QUE NAO E O QUE O NOME SUGERE ───
 *
 * O legado **nao** decide o tipo pelo conteudo e descarta a extensao. Ele faz
 * tres coisas, nesta ordem, e o resultado e um **confronto**:
 *
 * 1. **decide um tipo esperado pela extensao** (`wp_check_filetype()`, a lista
 *    ordenada de `tipos-de-arquivo-permitidos.ts`);
 * 2. **detecta o tipo real** pelo conteudo, por duas bordas diferentes: a
 *    biblioteca de imagem para `image/*` (`wp_get_image_mime()`, `:3368`) e o
 *    `fileinfo` para todo o resto (`finfo_file()`, `:3207`);
 * 3. **confronta os dois** por uma tabela de vetos que nao e simetrica — para
 *    imagem e documento o real tem de ser **igual** ao esperado; para video e
 *    audio basta o tipo maior; para quatro tipos ha lista de tolerancia
 *    nominal.
 *
 * Quando o confronto falha, **as duas pontas caem juntas**: `$type = false` e
 * `$ext = false` (nunca uma so), e e isso que faz o envio ser recusado la em
 * `enviar-arquivo.ts`. Quando o real difere do esperado **e e imagem
 * reconhecida**, o legado nao recusa: ele **corrige o nome do arquivo** e
 * recomeca o passo 1 com o nome corrigido. Um porte que recusasse nesse caso
 * seria mais fechado que o legado, e o P1 nao autoriza mais fechado.
 *
 * ── POR QUE A DETECCAO CHEGA PELO CONTEXTO E NAO E UMA PORTA NOVA ──────────
 *
 * {@link DeteccaoDeTipoReal} e borda: ela le bytes do disco por duas extensoes
 * do PHP (`exif`/`gd` e `fileinfo`). Mesmo assim **nao** e uma setima porta
 * deste modulo, e a razao e a mesma que AD-08 usa para recusar porta para o
 * barramento e para o escape — a conta de portas e sobre o que o legado **ja
 * declara substituivel, com mais de uma implementacao presente**. O editor de
 * imagem tem duas (`class-wp-image-editor-gd.php` e `-imagick.php`) e por isso
 * ganhou porta em T001; a deteccao de tipo tem **uma** e e consumida por **uma**
 * operacao. Por isso ela chega por argumento, no contexto da operacao, do mesmo
 * jeito que `ClassificacaoNaPublicacao` chega em BC-01 — e por isso o cenario
 * `@composicao` de `PT-014` continua podendo substitui-la por duplo.
 *
 * ⚠️ E T001 ja havia recusado esta pergunta a porta de imagem, por escrito:
 * *"nao confundir com a lista de tipos permitidos no envio (CA-1.2, CA-1.3,
 * US-9): aquela e regra de dominio e nao mora nesta porta"*
 * (`portas/porta-de-processamento-de-imagem.ts`). Esta tarefa respeita a recusa:
 * a **regra** do confronto esta aqui, e da borda vem so o tipo detectado.
 */

import type { PortaDeSistemaDeArquivos } from '../portas/index.js';
import {
  tipoPelaExtensao,
  TIPO_NAO_RECONHECIDO,
  type ListaDeTiposDeArquivo,
  type TipoPelaExtensao,
} from './tipos-de-arquivo-permitidos.js';

/**
 * As duas deteccoes de conteudo que o legado usa, como a borda as oferece.
 *
 * Nenhuma lanca excecao: as duas devolvem `null` onde o legado devolve `false`,
 * e o `false` do legado aqui nao e erro — e *"nao consegui determinar"*, que e um
 * caminho normal da funcao. `wp_get_image_mime()` inclusive **engole excecao**
 * de proposito (`try { ... } catch ( Exception $e ) { $mime = false; }`,
 * `wp-includes/functions.php:3452`), que e o P7.
 */
export interface DeteccaoDeTipoReal {
  /**
   * `wp_get_image_mime( $file )` — o tipo real de uma **imagem**
   * (`wp-includes/functions.php:3368`).
   *
   * No legado e `exif_imagetype()` quando ha, `getimagesize()` quando nao, e os
   * bytes magicos de `RIFF/WEBP` e da caixa `ftyp` (AVIF, HEIC, HEIF) como
   * ultima tentativa. Qual dos tres respondeu **nao** atravessa esta borda, e
   * isso e deliberado: o que o legado devolve e um tipo MIME ou `false`, e
   * nenhuma decisao dele olha a procedencia.
   */
  tipoDeImagem(caminho: string): string | null;

  /**
   * `extension_loaded( 'fileinfo' )` (`wp-includes/functions.php:3205`).
   *
   * E pergunta separada de {@link tipoPorConteudo} porque no legado ela decide
   * se o **bloco inteiro** de vetos roda: sem `fileinfo`, nada e confrontado e o
   * tipo da extensao passa como esta. Um porte que tratasse "sem fileinfo" como
   * "tipo real ausente" entraria no bloco e **recusaria** arquivo que o legado
   * aceita.
   */
  fileinfoDisponivel(): boolean;

  /**
   * `finfo_file( finfo_open( FILEINFO_MIME_TYPE ), $file )`
   * (`wp-includes/functions.php:3207`).
   */
  tipoPorConteudo(caminho: string): string | null;
}

/**
 * `$mime_to_ext` — o mapa de tipo de imagem para extensao correta
 * (`wp-includes/functions.php:3161`, ponto de extensao
 * `getimagesize_mimes_to_exts`).
 *
 * ⚠️ **Os quatro tipos HEIC/HEIF apontam todos para `heic`**, e o comentario do
 * legado explica por que em vez de corrigir: *"In theory there are/should be
 * file extensions that correspond to the mime types: .heif, .heics and .heifs.
 * However it seems that HEIC images with any of the mime types commonly have a
 * .heic file extension. Seems keeping the status quo here is best for
 * compatibility."* E a razao de `heif`, `heics` e `heifs` estarem em
 * {@link EXTENSOES_DE_HEIC_SEMPRE_CORRIGIDAS}.
 */
export const EXTENSAO_CORRETA_DO_TIPO_DE_IMAGEM: ReadonlyMap<string, string> =
  new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/gif', 'gif'],
    ['image/bmp', 'bmp'],
    ['image/tiff', 'tif'],
    ['image/webp', 'webp'],
    ['image/avif', 'avif'],
    ['image/heic', 'heic'],
    ['image/heif', 'heic'],
    ['image/heic-sequence', 'heic'],
    ['image/heif-sequence', 'heic'],
  ]);

/**
 * `$heic_images_extensions` — as tres extensoes que entram na correcao de nome
 * **mesmo quando o tipo real casa com o esperado**
 * (`wp-includes/functions.php:3144`).
 *
 * E o unico caso em que o legado renomeia um arquivo cujo tipo estava certo:
 * `foto.heif` detectado como `image/heif` vira `foto.heic`, porque a tabela
 * acima manda. `heic` **nao** esta nesta lista, logo `foto.heic` nao e tocado.
 */
export const EXTENSOES_DE_HEIC_SEMPRE_CORRIGIDAS: readonly string[] = [
  'heif',
  'heics',
  'heifs',
];

/**
 * `$nonspecific_types` — os quatro tipos que o `fileinfo` devolve quando nao
 * sabe (`wp-includes/functions.php:3229`).
 *
 * O comentario do legado e a regra: *"fileinfo often misidentifies obscure files
 * as one of these types"*. Eles sao tolerados **somente** para esperado
 * `application/*`, `video/*` e `audio/*`.
 */
export const TIPOS_REAIS_NAO_ESPECIFICOS: readonly string[] = [
  'application/octet-stream',
  'application/encrypted',
  'application/CDFV2-encrypted',
  'application/zip',
];

/**
 * Os tres tipos maiores que toleram {@link TIPOS_REAIS_NAO_ESPECIFICOS}
 * (`wp-includes/functions.php:3239`).
 */
export const TIPOS_MAIORES_BINARIOS: readonly string[] = [
  'application',
  'video',
  'audio',
];

/**
 * Os dois tipos do Google Docs que o `finfo` devolve **duplicados**
 * (`wp-includes/functions.php:3212`).
 *
 * O legado conta as ocorrencias e reduz a uma, citando dois registros de defeito
 * — `bugs.php.net/bug.php?id=77784` e `core.trac.wordpress.org/ticket/57898`. E
 * dividas herdada reproduzida: sem esta reducao, o confronto exato do fim
 * recusaria todo `.docx` e todo `.xlsx` nas versoes de `libmagic` afetadas.
 */
export const TIPOS_DUPLICADOS_PELO_FILEINFO: readonly string[] = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Os tipos esperados que sobrevivem a um real `text/plain`
 * (`wp-includes/functions.php:3249`). *"A few common file types are occasionally
 * detected as text/plain; allow those."*
 */
export const ESPERADOS_TOLERADOS_EM_TEXTO_PURO: readonly string[] = [
  'text/plain',
  'text/csv',
  'application/csv',
  'text/richtext',
  'text/tsv',
  'text/vtt',
];

/** Os tipos esperados que sobrevivem a um real `application/csv` (`:3265`). */
export const ESPERADOS_TOLERADOS_EM_CSV: readonly string[] = [
  'text/csv',
  'text/plain',
  'application/csv',
];

/** Os tipos esperados que sobrevivem a um real `text/rtf` (`:3279`). */
export const ESPERADOS_TOLERADOS_EM_RTF: readonly string[] = [
  'text/rtf',
  'text/plain',
  'application/rtf',
];

/**
 * O que a validacao devolve — os tres campos de `compact( 'ext', 'type',
 * 'proper_filename' )` (`wp-includes/functions.php:3352`).
 */
export interface TipoRealDoArquivo {
  /**
   * `ext` e `type`, que caem **juntos**. Ver {@link TipoPelaExtensao}.
   *
   * Depois da correcao de nome, este campo e o resultado da **segunda** chamada
   * a `wp_check_filetype()`, feita com o nome corrigido (`:3192`).
   */
  readonly tipo: TipoPelaExtensao;
  /**
   * `proper_filename` — o nome corrigido, ou `null` onde o legado devolve
   * `false` (`:3188`).
   *
   * ⚠️ **Quem recebe este valor troca o nome do arquivo**, e a troca e
   * observavel duas vezes: no nome em disco e no **titulo do anexo**, porque
   * `media_handle_upload()` le o nome **depois** de `_wp_handle_upload()`
   * te-lo reescrito por referencia (`wp-admin/includes/media.php:313`, com a
   * reescrita em `wp-admin/includes/file.php:964`). Esta nota esta aqui porque e
   * o unico lugar de onde a troca nasce.
   */
  readonly nomeCorrigido: string | null;
  /**
   * O tipo que a borda detectou, ou `null`.
   *
   * Nao e consumido por decisao nenhuma deste porte: existe porque o legado o
   * passa como quinto argumento do ponto de extensao `wp_check_filetype_and_ext`
   * (`:3352`), e o P2 poe *"o nome, os argumentos, a ordem de disparo e a
   * capacidade de alterar o resultado"* no contrato publico. Sem este campo, o
   * ponto nao pode ser portado com os argumentos declarados.
   */
  readonly tipoDetectado: string | null;
}

/** O que a validacao precisa saber, reunido para a assinatura caber. */
export interface PedidoDeValidacaoDeTipo {
  /** Caminho **absoluto** do arquivo a inspecionar (o `$file` do legado). */
  readonly caminho: string;
  /**
   * O nome informado pelo cliente (o `$filename`), que *"may differ from `$file`
   * due to `$file` being in a tmp directory"* — comentario do legado em
   * `:3119`.
   */
  readonly nomeDeArquivo: string;
  /**
   * O `$mimes` do legado: a lista com que a **extensao** e mapeada.
   *
   * No caminho do envio ele chega `null` e o legado resolve
   * `get_allowed_mime_types()` por dentro; aqui a resolucao e de quem chama (ver
   * `tipos-de-arquivo-permitidos.ts`).
   */
  readonly lista: ListaDeTiposDeArquivo;
  /**
   * A lista do **veto final** (`:3346`, `$allowed = get_allowed_mime_types()`).
   *
   * ⚠️ E um parametro separado de {@link lista} porque no legado sao duas
   * resolucoes diferentes: o veto final ignora o `$mimes` recebido e pergunta
   * sempre a lista permitida da instalacao. No envio as duas coincidem; numa
   * chamada com `$mimes` proprio, **nao** coincidem — e quem portar com um
   * parametro so faz uma extensao com lista propria contornar o veto.
   */
  readonly listaPermitida: ListaDeTiposDeArquivo;
}

/**
 * `wp_check_filetype_and_ext( $file, $filename, $mimes )`
 * (`wp-includes/functions.php:3124`).
 *
 * A ordem dos passos e a do legado, e ela e observavel pela **sequencia de
 * operacoes na porta de sistema de arquivos**, que o cenario `@composicao` de
 * `PT-014` compara: `existe()` e consultado **depois** do mapeamento pela
 * extensao e **antes** de qualquer deteccao de conteudo.
 */
export function tipoRealDoArquivo(
  pedido: PedidoDeValidacaoDeTipo,
  sistemaDeArquivos: PortaDeSistemaDeArquivos,
  deteccao: DeteccaoDeTipoReal,
): TipoRealDoArquivo {
  let tipo = tipoPelaExtensao(pedido.nomeDeArquivo, pedido.lista);
  let nomeCorrigido: string | null = null;

  /*
    "We can't do any further validation without a file to work with." (`:3131`).
    O legado devolve o que a extensao disse, sem confronto nenhum — e e por isso
    que este caminho NAO e uma recusa.
  */
  if (!sistemaDeArquivos.existe(pedido.caminho)) {
    return { tipo, nomeCorrigido, tipoDetectado: null };
  }

  let tipoDetectado: string | null = null;

  // 1. Imagem: a biblioteca de imagem decide, e o nome pode ser corrigido.
  if (tipo.reconhecido && tipo.tipoMime.startsWith('image/')) {
    tipoDetectado = deteccao.tipoDeImagem(pedido.caminho);

    const divergeOuEhHeicCorrigivel =
      tipoDetectado !== null &&
      (tipoDetectado !== tipo.tipoMime ||
        EXTENSOES_DE_HEIC_SEMPRE_CORRIGIDAS.includes(tipo.extensao));

    if (divergeOuEhHeicCorrigivel && tipoDetectado !== null) {
      const extensaoCorreta =
        EXTENSAO_CORRETA_DO_TIPO_DE_IMAGEM.get(tipoDetectado);

      if (extensaoCorreta !== undefined && extensaoCorreta !== '') {
        const novoNome = comExtensaoTrocada(
          pedido.nomeDeArquivo,
          extensaoCorreta,
        );

        // "Mark that it changed." (`:3188`) — e so quando mudou mesmo.
        if (novoNome !== pedido.nomeDeArquivo) {
          nomeCorrigido = novoNome;
        }

        // "Redefine the extension / MIME." (`:3191`)
        tipo = tipoPelaExtensao(novoNome, pedido.lista);
      } else {
        /*
          "Reset $real_mime and try validating again." (`:3197`). O tipo
          detectado e descartado de proposito, para que o bloco do `fileinfo`
          abaixo rode — a condicao dele e `! $real_mime`.
        */
        tipoDetectado = null;
      }
    }
  }

  // 2. "Validate files that didn't get validated during previous checks."
  if (tipo.reconhecido && tipoDetectado === null && deteccao.fileinfoDisponivel()) {
    tipoDetectado = reduzirDuplicacaoDoGoogleDocs(
      deteccao.tipoPorConteudo(pedido.caminho),
    );

    if (!confrontoAceito(tipo.tipoMime, tipoDetectado)) {
      tipo = TIPO_NAO_RECONHECIDO;
    }
  }

  // 3. "The mime type must be allowed." (`:3345`)
  if (tipo.reconhecido) {
    const tipoResolvido = tipo.tipoMime;
    const permitido = pedido.listaPermitida.some(
      (entrada) => entrada.tipoMime === tipoResolvido,
    );
    if (!permitido) {
      tipo = TIPO_NAO_RECONHECIDO;
    }
  }

  return { tipo, nomeCorrigido, tipoDetectado };
}

/**
 * *"Replace whatever is after the last period in the filename with the correct
 * extension"* (`wp-includes/functions.php:3182`).
 *
 * E `explode` / `array_pop` / `implode`, e a escolha de porta-lo literalmente e
 * deliberada: um nome **sem** ponto perde o ultimo pedaco inteiro —
 * `explode('.', 'retrato')` e `['retrato']`, `array_pop` o esvazia, e o
 * resultado e `.jpg`. Isso e alcancavel: um arquivo enviado sem extensao nao
 * chega aqui (sem extensao nao ha tipo esperado, e o bloco de imagem nem roda),
 * mas um `$mimes` de extensao que casasse nome vazio chegaria. Reescrever com
 * "troca a extensao se houver" mudaria o nome gerado nesse caso.
 */
function comExtensaoTrocada(nomeDeArquivo: string, extensao: string): string {
  const partes = nomeDeArquivo.split('.');
  partes.pop();
  partes.push(extensao);
  return partes.join('.');
}

/**
 * A reducao da duplicacao do `finfo` para os dois tipos do Google Docs
 * (`wp-includes/functions.php:3222`).
 *
 * `substr_count` conta ocorrencias **nao sobrepostas**, e o legado so age quando
 * sao exatamente duas.
 */
function reduzirDuplicacaoDoGoogleDocs(
  tipoDetectado: string | null,
): string | null {
  if (tipoDetectado === null) {
    return null;
  }
  for (const tipoDoGoogleDocs of TIPOS_DUPLICADOS_PELO_FILEINFO) {
    if (contarOcorrencias(tipoDetectado, tipoDoGoogleDocs) === 2) {
      return tipoDoGoogleDocs;
    }
  }
  return tipoDetectado;
}

/** `substr_count()` — ocorrencias nao sobrepostas. */
function contarOcorrencias(texto: string, agulha: string): number {
  if (agulha === '') {
    return 0;
  }
  let total = 0;
  let posicao = texto.indexOf(agulha);
  while (posicao !== -1) {
    total += 1;
    posicao = texto.indexOf(agulha, posicao + agulha.length);
  }
  return total;
}

/**
 * `substr( $tipo, 0, strcspn( $tipo, '/' ) )` — o tipo maior.
 *
 * `strcspn` devolve o comprimento do trecho inicial **sem** `/`, logo um tipo
 * sem barra devolve o tipo inteiro. Nao e `split('/')[0]` por acidente: e a
 * mesma coisa, e o nome existe para a linha do legado ser encontravel.
 */
function tipoMaior(tipoMime: string): string {
  const barra = tipoMime.indexOf('/');
  return barra === -1 ? tipoMime : tipoMime.slice(0, barra);
}

/**
 * A tabela de vetos do legado (`wp-includes/functions.php:3236` a `:3344`), na
 * ordem dos `elseif`.
 *
 * Devolve `true` quando o par (esperado, detectado) sobrevive. A assimetria e a
 * regra, e o comentario do legado a justifica caso por caso: *"Media types and
 * those listed in `$nonspecific_types` are allowed some leeway, but anything
 * else must exactly match the real content type."*
 *
 * ⚠️ **Detectado `null` sobrevive.** No legado, `finfo_file()` que falha devolve
 * `false`, e `false` nao esta em `$nonspecific_types`, nao comeca com `video/`,
 * nao e `text/plain`... e cai no `else` final, onde a comparacao e
 * `$type !== $real_mime` — verdadeira, logo **recusa**. Em PHP, porem, este
 * ramo nao e alcancavel por falha de `finfo_file()`: a condicao do bloco e
 * `! $real_mime`, e um `false` devolvido aqui nao muda o que ja foi testado.
 * O que pode chegar e cadeia vazia, e `'' !== $type` recusa. Por isso o `null`
 * desta porta e tratado como *"nao ha o que confrontar"* e passa, enquanto a
 * cadeia vazia recusa — e e o unico ponto desta funcao em que a forma do porte
 * (uniao com `null`) encosta no `false` polissemico do PHP.
 */
function confrontoAceito(
  tipoEsperado: string,
  tipoDetectado: string | null,
): boolean {
  if (tipoDetectado === null) {
    return true;
  }

  if (TIPOS_REAIS_NAO_ESPECIFICOS.includes(tipoDetectado)) {
    // "File is a non-specific binary type. That's ok if it's a type that
    // generally tends to be binary." (`:3238`)
    return TIPOS_MAIORES_BINARIOS.includes(tipoMaior(tipoEsperado));
  }

  if (
    tipoDetectado.startsWith('video/') ||
    tipoDetectado.startsWith('audio/')
  ) {
    /*
      "For these types, only the major type must match the real value. This
      means that common mismatches are forgiven: application/vnd.apple.numbers
      is often misidentified as application/zip, and some media files are
      commonly named with the wrong extension (.mov instead of .mp4)" (`:3243`)
    */
    return tipoMaior(tipoDetectado) === tipoMaior(tipoEsperado);
  }

  if (tipoDetectado === 'text/plain') {
    return ESPERADOS_TOLERADOS_EM_TEXTO_PURO.includes(tipoEsperado);
  }

  if (tipoDetectado === 'application/csv') {
    return ESPERADOS_TOLERADOS_EM_CSV.includes(tipoEsperado);
  }

  if (tipoDetectado === 'text/rtf') {
    return ESPERADOS_TOLERADOS_EM_RTF.includes(tipoEsperado);
  }

  /*
    "Everything else including image/* and application/*: If the real content
    type doesn't match the file extension, assume it's dangerous." (`:3288`)
  */
  return tipoEsperado === tipoDetectado;
}
