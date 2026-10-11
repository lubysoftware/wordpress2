/**
 * A forma do metadado que **descreve as derivadas** — o valor de
 * `_wp_attachment_metadata`.
 *
 * Segunda metade da entrega de **T002**: *"o metadado que descreve as derivadas
 * e gravado e lido pela porta de dados com a mesma forma do legado"*. A secao
 * *Modelo de dados* do `plan.md` diz o que ele guarda e o que **nao** muda:
 * *"a descricao das derivadas geradas, com largura, altura e nome de arquivo de
 * cada tamanho, e o caminho do arquivo relativo a area de envios"* →
 * *"continua em metadado aberto, porque e por ai que extensao acrescenta
 * tamanho"*.
 *
 * ── A VERDADE E O ARRANJO, E A PROJECAO TIPADA E SO LEITURA ────────────────
 *
 * Este arquivo tem duas faces e elas nao sao equivalentes:
 *
 * - **O arranjo** ({@link ValorPhp}) e o dado. E ele que vai para a coluna, e o
 *   criterio de aceite desta area e **byte a byte** no que foi gravado
 *   (`DB-SER`, BR-MIGRAR-082; area 3 da Decisao 2 de `parity_specs.md`).
 * - **{@link MetadadoDeAnexo}** e uma **projecao de leitura**. Ela nomeia em
 *   portugues as chaves que o legado le, e nao serve para gravar: gravar a
 *   partir dela perderia o que ela nao projeta.
 *
 * E por isso que `gravar` recebe arranjo, e nao projecao (ver
 * `metadado-de-anexo.ts`), e por isso que {@link MetadadoDeAnexo} carrega o
 * campo {@link MetadadoDeAnexo.valor}: quem leu tem o dado inteiro na mao, nao
 * uma copia empobrecida dele.
 *
 * **Tres razoes medidas para a projecao nao ser a verdade:**
 *
 * 1. **A estrutura e aberta.** A anotacao de tipo do proprio legado termina com
 *    `...` nos dois niveis (`wp-includes/post.php:7081` e `:7098`), e o
 *    ponto de extensao `wp_generate_attachment_metadata` devolve o arranjo que
 *    for (`wp-admin/includes/image.php:750`) — e o que ele devolver e o que vai
 *    gravado. Chave de extensao e contrato publico (P2).
 * 2. **A ordem das chaves e observavel.** O formato de origem preserva ordem de
 *    insercao, logo `width` antes de `height` nao e estilo: e byte. A ordem com
 *    que o legado monta o arranjo esta em {@link ORDEM_DAS_CHAVES_DE_IMAGEM}.
 * 3. **O tipo de cada escalar e observavel.** `i:150;` e `s:3:"150";` sao bytes
 *    diferentes para a mesma largura, e `1` e `1.0` tambem
 *    (`plataforma/serializacao/valor-php.ts`). A projecao le os dois como `150`;
 *    o arranjo lembra qual deles estava la.
 *
 * ── O QUE O METADADO TEM, CHAVE POR CHAVE, COM A ANCORA DE CADA UMA ────────
 *
 * | chave | o que e | quem a escreve | quem a le |
 * |---|---|---|---|
 * | `width`, `height` | dimensao do arquivo **servido** | `image.php:250`, `:251` | `image-edit.php:142` |
 * | `file` | caminho **relativo a area de envios** | `image.php:252` | `post.php:7024` |
 * | `filesize` | bytes do arquivo servido | `image.php:253` | `image-edit.php:1051` |
 * | `sizes` | uma entrada por derivada gerada | `image.php:495` | `post.php:6945` |
 * | `image_meta` | o EXIF/IPTC lido do arquivo | `image.php:261` | `image.php:479` |
 * | `original_image` | **nome** do arquivo original, quando houve reducao | `image.php:223` | `post.php:6957` |
 * | `source_image` | nome do companheiro em formato de origem (HEIC) | fluxo de cliente | `post.php:6980` |
 * | `animated_video`, `animated_video_poster` | nomes dos companheiros do GIF convertido | fluxo de cliente | `post.php:7003` |
 * | `thumb` | o formato **muito antigo** da miniatura, anterior a 2.5 | ninguem, hoje | `post.php:6924`, `media.php:256` |
 *
 * As quatro ultimas familias importam para esta tarefa por um motivo so, e ele e
 * o P8 da constituicao: *"nao remova funcao, constante, tabela, rota, superficie
 * nem comportamento publicado"*. Elas sao **lidas** pelo caminho de exclusao de
 * arquivo, e um porte que nao as represente deixa arquivo em disco que o legado
 * apaga — o que o cenario `@cascata` do teste de paridade compara: *"o conjunto
 * de arquivos restante no disco e identico nas duas"*.
 *
 * ── O QUE NAO ESTA AQUI, E DE QUEM E ──────────────────────────────────────
 *
 * - **Gerar derivada, e em que ordem.** `_wp_make_subsizes()` reordena os
 *   tamanhos antes do laco — `medium`, `large`, `thumbnail`, `medium_large`, e
 *   depois o resto (`wp-admin/includes/image.php:462` a `:469`) — e como cada
 *   derivada entra no metadado **assim que nasce** (`:495`), essa e a ordem das
 *   chaves em `sizes`. Isso e **T007**, e perder isso e perder paridade de bytes
 *   sem perder nenhum teste de comportamento. O que este arquivo da e
 *   {@link comDerivada}, que e a atribuicao de **uma** derivada, na posicao que
 *   a atribuicao do PHP daria.
 * - **Nome de arquivo.** Nem o `-{largura}x{altura}` da derivada, nem o
 *   `-scaled` da copia reduzida. Nome de arquivo e endereco publico, e o sufixo
 *   da copia reduzida e **pergunta em aberto** da `spec.md` (*"ninguem decidiu
 *   se o sufixo e contrato"*). As duas portas deste modulo tambem nao o geram,
 *   pelo mesmo motivo.
 * - **Ler EXIF.** `image_meta` chega pronto: quem o monta e
 *   `wp_read_image_metadata()` (`wp-admin/includes/image.php:825`), que le o
 *   arquivo — logo e da tarefa que ingere (T003/T007). Aqui ele atravessa como
 *   {@link ValorPhp}, sem interpretacao, porque a ordem das chaves **dele**
 *   tambem e byte.
 * - **De qual arquivo as derivadas saem quando houve reducao na ingestao.** 🔴
 *   Conflito aberto entre a `spec.md` (CA-4.3) e a arvore analisada, registrado
 *   na secao *O que T001 encontrou aberto* do `README.md` deste modulo. T002 nao
 *   depende da resposta: aqui ha a forma do metadado, e o metadado e o mesmo nas
 *   duas leituras.
 */

import {
  arranjoPorNome,
  inteiro,
  nomeDaChave,
  normalizarChaveDeTexto,
  texto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';

/**
 * A ordem em que o legado monta as chaves do metadado de imagem.
 *
 * As cinco primeiras nascem juntas, no mesmo literal
 * (`wp-admin/includes/image.php:249` a `:255`). `image_meta` e acrescentada
 * depois, e so quando ha EXIF (`:261`). `original_image` e acrescentada por
 * ultimo, e so quando houve reducao na ingestao — `_wp_image_meta_replace_original()`
 * atribui `width`, `height`, `file` e `filesize` a chaves que **ja existem**, o
 * que no PHP nao muda a posicao delas, e so `original_image` entra como chave
 * nova (`:213` a `:223`).
 *
 * Esta lista e **documentacao executavel da ordem**: {@link
 * metadadoInicialDeImagem} a usa, e o teste de T002 afirma que os bytes gravados
 * saem nela.
 */
export const ORDEM_DAS_CHAVES_DE_IMAGEM = [
  'width',
  'height',
  'file',
  'filesize',
  'sizes',
  'image_meta',
  'original_image',
] as const;

/** `sizes` — a chave que carrega uma entrada por derivada. */
export const CHAVE_DAS_DERIVADAS = 'sizes';

/**
 * Uma derivada, na forma exata com que ela entra em `sizes`.
 *
 * Sao os campos que `WP_Image_Editor::_save()` devolve, **sem `path`**, que
 * `make_subsize()` remove antes de entregar
 * (`wp-includes/class-wp-image-editor-gd.php:580` a `:594`, e `:342`). A ordem
 * dos campos abaixo e a ordem do literal do legado, e e a ordem em que
 * {@link derivadaComoValor} os emite.
 *
 * E a mesma forma que `ArquivoDeImagemGravado` da porta de processamento
 * devolve, menos o caminho — o cabecalho daquela porta registra que *"a forma do
 * metadado e de T002"*.
 */
export interface DerivadaDeImagem {
  /** `file` — **nome** do arquivo, sem pasta. Nao e caminho e nao e endereco. */
  readonly nomeDeArquivo: string;
  /** `width` — a largura **real** do arquivo gerado, nao a pedida (CA-3.4). */
  readonly largura: number;
  /** `height` — a altura real do arquivo gerado. */
  readonly altura: number;
  /** `mime-type` — o tipo efetivo da gravacao, que pode diferir do da origem. */
  readonly tipoMime: string;
  /**
   * `filesize` — bytes do arquivo gerado.
   *
   * **Opcional, e a ausencia e informacao.** O campo entrou no arranjo em 6.0
   * (`wp-includes/post.php:7050`), logo derivada gravada antes disso nao o tem,
   * e o legado pergunta `isset()` antes de usar. Gravar `filesize` numa derivada
   * que nao o tinha e mudar bytes da coluna.
   */
  readonly bytes?: number;
}

/** Uma derivada com o nome do tamanho que a nomeia em `sizes`. */
export interface DerivadaNomeada extends DerivadaDeImagem {
  /**
   * A chave em `sizes` — o nome do tamanho registrado.
   *
   * E chave, nao rotulo: `_wp_make_subsizes()` compara **por nome** para nao
   * sobrescrever derivada existente, *"so checa o nome do tamanho para nao
   * sobrepor imagem existente mesmo quando as dimensoes nao batem"*
   * (`wp-admin/includes/image.php:437` a `:446`).
   */
  readonly nome: string;
}

/**
 * Uma entrada de `_wp_attachment_backup_sizes`.
 *
 * ⚠️ **A ordem dos campos do backup NAO e a da derivada, e o legado tem duas
 * formas diferentes para a mesma chave:**
 *
 * - o backup do **arquivo principal** e montado a mao, na ordem `width`,
 *   `height`, `filesize`, `file` (`wp-admin/includes/image-edit.php:1048` a
 *   `:1053`);
 * - o backup de uma **derivada** e a propria entrada de `sizes`, copiada como
 *   esta (`:1115`), logo sai na ordem `file`, `width`, `height`, `mime-type`,
 *   `filesize`.
 *
 * As duas conviver e comportamento do legado, e as duas sao bytes diferentes.
 * Por isso {@link tamanhoDeBackupComoValor} serve a primeira e a segunda se
 * escreve com {@link derivadaComoValor}: unificar as duas formas mudaria o valor
 * gravado.
 *
 * O nome da chave (`full-orig`, `{tamanho}-orig`, `full-{sufixo}`) e **regra de
 * T015**, com as ancoras em `image-edit.php:1037` a `:1045` e `:1104` a `:1112`.
 */
export interface TamanhoDeBackup {
  /** A chave da entrada, como esta gravada. */
  readonly nome: string;
  readonly nomeDeArquivo: string;
  readonly largura: number;
  readonly altura: number;
  readonly bytes?: number;
  /** `mime-type`, presente so quando o backup e a copia de uma derivada. */
  readonly tipoMime?: string;
}

/**
 * O metadado como quem le o nomeia — **projecao, nao dado**. Ver o cabecalho.
 *
 * Cada campo e `null` quando a chave **nao esta** no arranjo, e nao quando o
 * valor e vazio: a diferenca entre chave ausente e chave presente com valor
 * vazio e efeito no banco, e o legado pergunta `! empty()` sobre quase todas
 * elas.
 */
export interface MetadadoDeAnexo {
  /** O arranjo como esta na coluna: **a verdade**, para gravar de volta. */
  readonly valor: ValorPhp;
  readonly largura: number | null;
  readonly altura: number | null;
  /** `file` — caminho relativo a area de envios, com pasta de ano e mes. */
  readonly arquivo: string | null;
  readonly bytes: number | null;
  /** `sizes`, **na ordem gravada**, que e a ordem em que nasceram (T007). */
  readonly derivadas: readonly DerivadaNomeada[];
  /** `image_meta` cru: a ordem das chaves dele tambem e byte. */
  readonly metadadoDeImagem: ValorPhp | null;
  /** `original_image` — nome do original guardado na reducao (`M1`, CA-4.2). */
  readonly nomeDoOriginal: string | null;
  /** `source_image` — o companheiro em formato de origem (HEIC). */
  readonly nomeDaFonte: string | null;
  /** `animated_video` — o MP4/WebM gerado de um GIF animado. */
  readonly nomeDoVideoConvertido: string | null;
  /** `animated_video_poster` — o primeiro quadro do video convertido. */
  readonly nomeDoPosterDoVideo: string | null;
  /**
   * `thumb` — o formato muito antigo da miniatura.
   *
   * *"This uses image_downsize() which also looks for the (very) old format
   * `$image_meta['thumb']`"* (`wp-includes/post.php:7303`). Nenhum caminho do
   * nucleo a escreve hoje, e **dois a leem**: a exclusao de arquivo
   * (`post.php:6924`) e a reducao de tamanho na exibicao
   * (`wp-includes/media.php:256`). Instalacao nova nao a tem; por P8 ela e
   * representada do mesmo jeito.
   */
  readonly miniaturaAntiga: string | null;
}

/**
 * O metadado lido, ou `null` quando nao ha metadado de imagem.
 *
 * ⚠️ **`null` cobre tres casos, e os tres sao o mesmo `false` no legado:** valor
 * que nao e arranjo, arranjo **vazio**, e chave ausente.
 * `wp_get_attachment_metadata()` faz `if ( ! is_array( $data ) || ! $data )
 * return false` (`wp-includes/post.php:7116`) — e o `! $data` e o que faz
 * `a:0:{}` contar como ausencia, pela verdade de PHP (ver `verdade-de-php.ts`).
 * Um porte que devolvesse objeto vazio aqui daria ao chamador um caso que o
 * legado nao tem.
 */
export function lerMetadadoDeAnexo(valor: ValorPhp): MetadadoDeAnexo | null {
  if (valor.tipo !== 'arranjo' || valor.entradas.length === 0) {
    return null;
  }

  return {
    valor,
    largura: inteiroDaChave(valor.entradas, 'width'),
    altura: inteiroDaChave(valor.entradas, 'height'),
    arquivo: textoDaChave(valor.entradas, 'file'),
    bytes: inteiroDaChave(valor.entradas, 'filesize'),
    derivadas: lerDerivadas(valorDaChave(valor.entradas, CHAVE_DAS_DERIVADAS)),
    metadadoDeImagem: valorDaChave(valor.entradas, 'image_meta'),
    nomeDoOriginal: textoDaChave(valor.entradas, 'original_image'),
    nomeDaFonte: textoDaChave(valor.entradas, 'source_image'),
    nomeDoVideoConvertido: textoDaChave(valor.entradas, 'animated_video'),
    nomeDoPosterDoVideo: textoDaChave(valor.entradas, 'animated_video_poster'),
    miniaturaAntiga: textoDaChave(valor.entradas, 'thumb'),
  };
}

/**
 * As derivadas de um valor de `sizes`, na ordem gravada.
 *
 * Valor ausente ou que nao e arranjo devolve lista vazia, que e o que as duas
 * guardas do legado fazem: `_wp_make_subsizes()` troca por arranjo vazio quando
 * nao e arranjo (`wp-admin/includes/image.php:448` a `:450`) e
 * `wp_get_attachment_metadata()` faz o mesmo depois do filtro
 * (`wp-includes/post.php:7138`).
 *
 * ⚠️ **Entrada que nao e arranjo e saltada aqui, e continua no dado.** O legado
 * nao tem guarda para isso — `wp_delete_attachment_files()` le
 * `$sizeinfo['file']` direto (`wp-includes/post.php:6945`) — logo nao ha
 * comportamento a reproduzir, e inventar um seria decidir. A entrada sobrevive
 * em {@link MetadadoDeAnexo.valor}, que e o que volta para a coluna.
 */
export function lerDerivadas(
  valor: ValorPhp | null,
): readonly DerivadaNomeada[] {
  if (valor === null || valor.tipo !== 'arranjo') {
    return [];
  }

  const derivadas: DerivadaNomeada[] = [];
  for (const entrada of valor.entradas) {
    if (entrada.valor.tipo !== 'arranjo') {
      continue;
    }
    const campos = entrada.valor.entradas;
    const bytes = inteiroDaChave(campos, 'filesize');
    derivadas.push({
      nome: nomeDaChave(entrada.chave),
      nomeDeArquivo: textoDaChave(campos, 'file') ?? '',
      largura: inteiroDaChave(campos, 'width') ?? 0,
      altura: inteiroDaChave(campos, 'height') ?? 0,
      tipoMime: textoDaChave(campos, 'mime-type') ?? '',
      ...(bytes === null ? {} : { bytes }),
    });
  }
  return derivadas;
}

/** A derivada de um nome, ou `null`. E a pergunta que `array_key_exists()` faz. */
export function derivadaChamada(
  metadado: MetadadoDeAnexo,
  nome: string,
): DerivadaNomeada | null {
  return metadado.derivadas.find((derivada) => derivada.nome === nome) ?? null;
}

/**
 * Os tamanhos de backup lidos de `_wp_attachment_backup_sizes`.
 *
 * Mesma tolerancia da leitura de `sizes`, e pelo mesmo motivo: o legado pergunta
 * `is_array( $backup_sizes )` antes de iterar (`wp-includes/post.php:7023`) e
 * `isset( $backup_sizes['full-orig'] ) && is_array( ... )`
 * (`wp-admin/includes/image-edit.php:834`).
 */
export function lerTamanhosDeBackup(
  valor: ValorPhp | null,
): readonly TamanhoDeBackup[] {
  if (valor === null || valor.tipo !== 'arranjo') {
    return [];
  }

  const tamanhos: TamanhoDeBackup[] = [];
  for (const entrada of valor.entradas) {
    if (entrada.valor.tipo !== 'arranjo') {
      continue;
    }
    const campos = entrada.valor.entradas;
    const bytes = inteiroDaChave(campos, 'filesize');
    const tipoMime = textoDaChave(campos, 'mime-type');
    tamanhos.push({
      nome: nomeDaChave(entrada.chave),
      nomeDeArquivo: textoDaChave(campos, 'file') ?? '',
      largura: inteiroDaChave(campos, 'width') ?? 0,
      altura: inteiroDaChave(campos, 'height') ?? 0,
      ...(bytes === null ? {} : { bytes }),
      ...(tipoMime === null ? {} : { tipoMime }),
    });
  }
  return tamanhos;
}

/** O que {@link metadadoInicialDeImagem} precisa saber do arquivo recebido. */
export interface ImagemRecebida {
  readonly largura: number;
  readonly altura: number;
  /** `file` — o caminho **ja relativo** a area de envios. Ver o cabecalho. */
  readonly arquivoRelativo: string;
  readonly bytes: number;
}

/**
 * O metadado de uma imagem recem-recebida, antes de qualquer derivada
 * (`wp-admin/includes/image.php:249` a `:255`).
 *
 * Os cinco campos, nesta ordem, com `sizes` **vazio e presente** — e a presenca
 * importa: o legado grava este arranjo no banco antes de gerar derivada nenhuma
 * (`:390` a `:395`, *"Initial save of the new metadata [...] the `sizes` array is
 * empty"*), e esse e um estado observavel do banco, nao um passo interno.
 *
 * As quatro dimensoes entram como **inteiro** porque e o que o legado poe la:
 * `wp_getimagesize()` devolve inteiro e `wp_filesize()` devolve inteiro. Entrar
 * como texto mudaria `i:150;` em `s:3:"150";`.
 */
export function metadadoInicialDeImagem(imagem: ImagemRecebida): ValorPhp {
  return arranjoPorNome([
    ['width', inteiro(imagem.largura)],
    ['height', inteiro(imagem.altura)],
    ['file', texto(imagem.arquivoRelativo)],
    ['filesize', inteiro(imagem.bytes)],
    [CHAVE_DAS_DERIVADAS, arranjoPorNome([])],
  ]);
}

/**
 * Uma derivada como arranjo, na ordem do literal do legado
 * (`wp-includes/class-wp-image-editor-gd.php:589` a `:593`): `file`, `width`,
 * `height`, `mime-type`, `filesize`.
 *
 * `filesize` **so entra se houver** — ver {@link DerivadaDeImagem.bytes}.
 */
export function derivadaComoValor(derivada: DerivadaDeImagem): ValorPhp {
  const pares: (readonly [string, ValorPhp])[] = [
    ['file', texto(derivada.nomeDeArquivo)],
    ['width', inteiro(derivada.largura)],
    ['height', inteiro(derivada.altura)],
    ['mime-type', texto(derivada.tipoMime)],
  ];
  if (derivada.bytes !== undefined) {
    pares.push(['filesize', inteiro(derivada.bytes)]);
  }
  return arranjoPorNome(pares);
}

/**
 * Um tamanho de backup do **arquivo principal** como arranjo, na ordem do
 * literal do legado (`wp-admin/includes/image-edit.php:1048` a `:1053`):
 * `width`, `height`, `filesize`, `file`.
 *
 * Para o backup de uma derivada o legado **copia a entrada de `sizes`**, que sai
 * na outra ordem — use {@link derivadaComoValor}. Ver {@link TamanhoDeBackup}.
 */
export function tamanhoDeBackupComoValor(tamanho: TamanhoDeBackup): ValorPhp {
  const pares: (readonly [string, ValorPhp])[] = [
    ['width', inteiro(tamanho.largura)],
    ['height', inteiro(tamanho.altura)],
  ];
  if (tamanho.bytes !== undefined) {
    pares.push(['filesize', inteiro(tamanho.bytes)]);
  }
  pares.push(['file', texto(tamanho.nomeDeArquivo)]);
  return arranjoPorNome(pares);
}

/**
 * `$arranjo[ $nome ] = $valor` — a atribuicao do PHP, com a regra de posicao.
 *
 * **Chave que existe e substituida no lugar; chave nova entra no fim.** E a
 * regra que faz a ordem das chaves do metadado ser o que e: em
 * `_wp_image_meta_replace_original()`, atribuir `width`, `height`, `file` e
 * `filesize` **nao** os move para o fim, e so `original_image` entra como chave
 * nova (`wp-admin/includes/image.php:213` a `:223`). Um porte que apagasse e
 * reinserisse produziria `file`, `filesize`, `width`, `height`,
 * `original_image` — mesmos dados, outros bytes.
 *
 * A comparacao de chave e feita pelo **nome normalizado**, como o arranjo de
 * origem faz na insercao: `$a['5']` e `$a[5]` sao a mesma chave la
 * (`plataforma/serializacao/valor-php.ts`, `normalizarChaveDeTexto`), logo sao a
 * mesma aqui.
 *
 * Valor que nao e arranjo vira um arranjo de uma chave, que e o que o PHP faz
 * com `null` e com `''` — e nao e o que ele faz com os outros escalares, onde a
 * atribuicao e erro. O caso nao e alcancavel pelos caminhos desta feature, e a
 * funcao e total para nao ter ramo morto.
 */
export function atribuirChave(
  arranjo: ValorPhp,
  nome: string,
  valor: ValorPhp,
): ValorPhp {
  const entradas: readonly EntradaDeArranjo[] =
    arranjo.tipo === 'arranjo' ? arranjo.entradas : [];
  const nova: EntradaDeArranjo = {
    chave: normalizarChaveDeTexto(nome),
    valor,
  };

  let substituiu = false;
  const resultado = entradas.map((entrada) => {
    if (nomeDaChave(entrada.chave) !== nome) {
      return entrada;
    }
    substituiu = true;
    return nova;
  });
  if (!substituiu) {
    resultado.push(nova);
  }
  return { tipo: 'arranjo', entradas: resultado };
}

/**
 * `$image_meta['sizes'][ $nome ] = $derivada` — a atribuicao que o legado faz a
 * cada derivada que nasce (`wp-admin/includes/image.php:495`).
 *
 * A posicao da derivada em `sizes` segue a regra de {@link atribuirChave}:
 * tamanho que ja estava la e substituido no lugar, tamanho novo entra no fim.
 * **Quais tamanhos entram e em que ordem e de T007** — ver o cabecalho deste
 * arquivo.
 *
 * `sizes` ausente ou nao-arranjo passa a ser arranjo vazio antes da atribuicao,
 * que e a guarda do legado no mesmo caminho (`:448` a `:450`).
 */
export function comDerivada(
  metadado: ValorPhp,
  nome: string,
  derivada: DerivadaDeImagem,
): ValorPhp {
  const atuais =
    metadado.tipo === 'arranjo'
      ? valorDaChave(metadado.entradas, CHAVE_DAS_DERIVADAS)
      : null;
  const base: ValorPhp =
    atuais !== null && atuais.tipo === 'arranjo' ? atuais : arranjoPorNome([]);

  return atribuirChave(
    metadado,
    CHAVE_DAS_DERIVADAS,
    atribuirChave(base, nome, derivadaComoValor(derivada)),
  );
}

/**
 * O valor de uma chave nomeada, ou `null` quando ela nao esta no arranjo.
 *
 * **A primeira ocorrencia vence**, e isso nao e escolha: o arranjo de origem nao
 * tem chave repetida, logo um arranjo com duas entradas de mesmo nome nunca saiu
 * de `serialize()`. Se chegar um, e dado estranho na coluna, e o legado tambem
 * leria a primeira (`$a['x']` depois de `unserialize()` devolve a ultima
 * sobrescrita, que e a unica que sobrou no arranjo dele). O caso e inalcancavel
 * pelos caminhos desta feature.
 */
function valorDaChave(
  entradas: readonly EntradaDeArranjo[],
  nome: string,
): ValorPhp | null {
  for (const entrada of entradas) {
    if (nomeDaChave(entrada.chave) === nome) {
      return entrada.valor;
    }
  }
  return null;
}

/**
 * O texto de uma chave, com a tolerancia da coluna e nenhuma a mais.
 *
 * Numero vira a cadeia decimal dele, que e o que o `(string)` do PHP faria; o
 * resto (nulo, booleano, arranjo) devolve `null`, porque nao e nome de arquivo
 * em leitura nenhuma do legado.
 */
function textoDaChave(
  entradas: readonly EntradaDeArranjo[],
  nome: string,
): string | null {
  const valor = valorDaChave(entradas, nome);
  if (valor === null) {
    return null;
  }
  if (valor.tipo === 'texto') {
    return typeof valor.valor === 'string'
      ? valor.valor
      : new TextDecoder().decode(valor.valor);
  }
  if (valor.tipo === 'inteiro' || valor.tipo === 'decimal') {
    return String(valor.valor);
  }
  return null;
}

/**
 * O inteiro de uma chave.
 *
 * Texto numerico e aceito porque a coluna carrega os dois: a anotacao do proprio
 * legado diz `numeric-string|int` para os campos de `image_meta`
 * (`wp-includes/post.php:7084`), e metadado gravado por versao antiga guarda
 * dimensao como texto. Texto nao numerico devolve `null`, que e a ausencia —
 * nao `0`, porque `0` e uma dimensao que o legado grava.
 */
function inteiroDaChave(
  entradas: readonly EntradaDeArranjo[],
  nome: string,
): number | null {
  const valor = valorDaChave(entradas, nome);
  if (valor === null) {
    return null;
  }
  if (valor.tipo === 'inteiro' || valor.tipo === 'decimal') {
    return valor.valor;
  }
  if (valor.tipo !== 'texto') {
    return null;
  }
  const comoTexto =
    typeof valor.valor === 'string'
      ? valor.valor
      : new TextDecoder().decode(valor.valor);
  if (comoTexto.trim() === '') {
    return null;
  }
  const numero = Number.parseInt(comoTexto, 10);
  return Number.isNaN(numero) ? null : numero;
}
