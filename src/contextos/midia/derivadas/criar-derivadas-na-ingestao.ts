/**
 * **US-3**: receber uma imagem gera uma derivada para cada tamanho declarado.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia`: *"o comportamento de
 * US-3 existe e os criterios CA-3.1, CA-3.2, CA-3.3 e CA-3.4 passam contra o
 * sistema novo"*. E o passo 7 de **UC-12** — *"Sistema reduz a imagem se ela
 * passar do limite e gera as derivadas de cada tamanho registrado"* —, e no
 * legado e o ramo de imagem de `wp_generate_attachment_metadata()`
 * (`wp-admin/includes/image.php:586`) com `wp_create_image_subsizes()`
 * (`:240`) dentro.
 *
 * E a operacao que `media_handle_upload()` chama no fim
 * (`wp-admin/includes/media.php:444`), que e exatamente onde T003 parou: o
 * fim de `../envio/enviar-arquivo.ts` registra o que esta tarefa recebe — *"o
 * identificador do anexo e o caminho ABSOLUTO do arquivo gravado"*.
 *
 * ---
 *
 * # Os passos, e qual criterio fecha em cada um
 *
 * | # | passo | ancora | criterio |
 * |---|---|---|---|
 * | 1 | o arquivo e uma imagem? | `:241`-`:246` | — |
 * | 2 | o metadado inicial: `width`, `height`, `file`, `filesize`, `sizes` vazio | `:249`-`:255` | **CA-3.4** |
 * | 3 | o EXIF, quando ha | `:257`-`:261` | — |
 * | 4 | 🔴 a reducao na ingestao e a conversao de formato — **T009** | `:285`-`:384` | CA-4.* |
 * | 5 | a **primeira** gravacao do metadado, com `sizes` vazio | `:395` | **CA-3.4** |
 * | 6 | os tamanhos registrados, resolvidos agora | `:397` | **CA-3.1**, **CA-3.2** |
 * | 7 | o laco das derivadas, gravando a cada uma | `:412` | **CA-3.1**, **CA-3.4** |
 *
 * **A ordem de 5, 6 e 7 e o contrato desta tarefa.** O comentario do legado diz
 * por que o passo 5 existe sozinho: *"Initial save of the new metadata. At this
 * point the file was uploaded and moved to the uploads directory but the image
 * sub-sizes haven't been created yet and the `sizes` array is empty"*. Esse e um
 * **estado observavel do banco**, nao um passo interno: e dele que vive o anexo
 * cujo processamento foi interrompido, e e ele que CA-3.3 conserta por acao
 * explicita.
 *
 * ---
 *
 * # 🔴 O que esta funcao NAO faz, e por que a parada e no passo 4
 *
 * O bloco de `:285` a `:384` do legado faz tres coisas no **arquivo principal**,
 * e nenhuma delas e de T007:
 *
 * 1. **reduz a imagem acima de 2.560 px** e passa a servir a copia `-scaled`
 *    (`M1`, BR-MIGRAR-057) — e **T009** (US-4);
 * 2. **converte o formato** quando `wp_get_image_editor_output_format()` manda,
 *    mesmo sem reducao (`:300`-`:307`) — nenhuma historia desta feature a
 *    descreve, e ela muda o arquivo servido, logo vai com T009;
 * 3. **rotaciona o original inteiro** quando ha orientacao EXIF diferente de `1`
 *    e nao houve nem reducao nem conversao (`:358`-`:384`) — idem.
 *
 * Os tres gravam arquivo novo e chamam `_wp_image_meta_replace_original()`
 * (`:206`), que troca `width`, `height`, `file` e `filesize` **nas chaves que ja
 * existem** e acrescenta `original_image` no fim — a regra de posicao que
 * `../armazenamento/derivadas.ts` ja declarou em `atribuirChave()`.
 *
 * **E o conflito que T001 registrou e ninguem resolveu passa exatamente aqui:**
 * a `spec.md` (CA-4.3) e o fluxo alternativo de UC-12 afirmam que as derivadas
 * saem da **copia reduzida**; a arvore analisada passa `$file`, que continua
 * sendo o **original**, para `_wp_make_subsizes()` (`:412`), com o comentario de
 * `:337` dizendo que e de proposito — *"This doesn't affect the sub-sizes names
 * as they are generated from the original image (for best quality)"*. Sao duas
 * afirmacoes opostas sobre o mesmo passo, o P1 exige decisao humana registrada
 * para divergir do observavel, e **nao existe nenhuma**.
 *
 * Esta funcao nao decide: ela recebe o caminho por argumento e usa **o mesmo**
 * no passo 7 (que e o que o legado faz quando nao houve reducao — e, sem o passo
 * 4, nunca houve). Quem fechar T009 escreve o passo 4 aqui e **ai** precisa da
 * resposta. Antes da primeira linha, a secao *O que T001 encontrou aberto* de
 * `../README.md`.
 *
 * ---
 *
 * # O que mais nao esta aqui
 *
 * - **Os ramos de video, audio e PDF** de `wp_generate_attachment_metadata()`
 *   (`:589`-`:595` e `:669`-`:729`). Nenhum e imagem, nenhum e US-3, e o de PDF
 *   usa o mesmo laco de `gerar-derivadas.ts` com tres tamanhos forcados. Ficam
 *   nomeados porque sao o resto da funcao do legado, e porque o P8 cobra isso de
 *   quem nao porta.
 * - **A gravacao final de `media_handle_upload()`**
 *   (`wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( ... ) )`,
 *   `media.php:444`) e **do chamador**, como no legado: esta funcao devolve o
 *   metadado e nao o grava uma segunda vez. A ultima gravacao que sai daqui e a
 *   da ultima derivada.
 * - **O ponto de extensao `wp_generate_attachment_metadata`** (`:750`), que
 *   recebe `'create'` neste caminho e `'update'` no de CA-3.3, e
 *   `intermediate_image_sizes_advanced` (`:410`), que **pode trocar a lista
 *   inteira de tamanhos**. Contrato publico (P2), nao emitidos: `REQ-162` esta
 *   em `do-not-rewrite.md`. Ficam nomeados na posicao.
 */

import {
  arranjoPorNome,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  atribuirChave,
  metadadoInicialDeImagem,
  verdadeiroComoNoPhp,
} from '../armazenamento/index.js';
import type { ContextoDeDerivadas } from './contexto-de-derivadas.js';
import { gerarDerivadas } from './gerar-derivadas.js';
import { tamanhosRegistrados } from './tamanhos-registrados.js';

/** `'image_meta'` — a chave do EXIF/IPTC no metadado (`image.php:261`). */
export const CHAVE_DO_METADADO_DE_IMAGEM = 'image_meta';

/** O que a ingestao precisa saber. Sao os dois argumentos do legado. */
export interface PedidoDeIngestaoDeImagem {
  /** `$attachment_id` — o anexo que T003 acabou de criar. */
  readonly anexoId: number;
  /**
   * `$file` — o caminho **absoluto** do arquivo ja movido para a area de
   * envios, que e o que `ResultadoDoEnvio.caminho` de T003 carrega.
   */
  readonly caminho: string;
}

/**
 * `wp_create_image_subsizes( $file, $attachment_id )`
 * (`wp-admin/includes/image.php:240`), sem o passo 4 — ver o cabecalho.
 *
 * Devolve o metadado do anexo. **Nao lanca, e nao avisa ninguem de falha
 * nenhuma** (`M4`, e o P7 da constituicao).
 */
export function criarDerivadasDeImagem(
  contexto: ContextoDeDerivadas,
  pedido: PedidoDeIngestaoDeImagem,
): ValorPhp {
  // ── 1. "File is not an image." (`:241`) ──────────────────────────────────
  const lido = contexto.leituraDoArquivo.dimensoes(pedido.caminho);
  if (lido === null) {
    return arranjoPorNome([]);
  }

  // ── 2. "Default image meta." (`:248`) ────────────────────────────────────
  let metadado: ValorPhp = metadadoInicialDeImagem({
    largura: lido.largura,
    altura: lido.altura,
    arquivoRelativo: caminhoRelativoDeEnvio(
      pedido.caminho,
      contexto.sistemaDeArquivos.raizDeEnvios,
    ),
    bytes: contexto.leituraDoArquivo.bytes(pedido.caminho),
  });

  // ── 3. "Fetch additional metadata from EXIF/IPTC." (`:257`) ──────────────
  const exif =
    contexto.leituraDoArquivo.metadadoDeImagem?.(pedido.caminho) ?? null;
  if (exif !== null && verdadeiroComoNoPhp(exif)) {
    /*
      `if ( $exif_meta ) { $image_meta['image_meta'] = $exif_meta; }` (`:260`) —
      e a verdade de PHP, nao `!== null`: `wp_read_image_metadata()` devolve
      `false` sem as extensoes de EXIF/IPTC, e **arranjo vazio tambem e falso**,
      logo uma imagem sem nenhum campo lido **nao ganha a chave**. A chave
      ausente e observavel: ela decide a rotacao do passo 6 de
      `gerar-derivadas.ts`.
    */
    metadado = atribuirChave(metadado, CHAVE_DO_METADADO_DE_IMAGEM, exif);
  }

  /*
    ── 4. 🔴 AQUI entra T009 (US-4): a reducao acima de 2.560 px, a conversao de
    formato e a rotacao do original inteiro (`:285` a `:384`), com
    `_wp_image_meta_replace_original()` (`:206`). **Nao e desta tarefa, e o
    conflito sobre de qual arquivo as derivadas saem mora neste ponto** — ver o
    cabecalho deste arquivo e `../README.md`.

    Sem este passo, nenhuma copia reduzida existe, `original_image` nao e
    gravada e o caminho que segue para o passo 7 e o unico que ha: o do arquivo
    recebido. Para toda imagem **abaixo** do limite, que e o caso em que o
    passo 4 nao faz nada no legado, o resultado desta funcao e o do legado.
  */

  // ── 5. "Initial save of the new metadata." (`:391`, a escrita em `:395`) ─
  contexto.armazenamento.metadadoDeAnexo.gravarMetadado(
    pedido.anexoId,
    metadado,
  );

  // ── 6. Os tamanhos registrados, resolvidos agora (`:397`) ────────────────
  const tamanhos = tamanhosRegistrados(
    contexto.opcoesDeTamanho,
    contexto.tamanhosAdicionais,
  );

  // ── 7. O laco das derivadas (`:412`) ─────────────────────────────────────
  return gerarDerivadas(contexto, {
    anexoId: pedido.anexoId,
    caminho: pedido.caminho,
    tamanhos,
    metadado,
  });
}

/**
 * `_wp_relative_upload_path( $path )` (`wp-includes/post.php:919`).
 *
 * E o valor que vai para `file` no metadado (`image.php:252`) e e o **mesmo
 * formato** que `_wp_attached_file` guarda: relativo a area de envios, com a
 * pasta de ano e mes, e sem barra no comeco.
 *
 * ⚠️ **Caminho fora da area de envios atravessa inteiro**, absoluto, e isso e do
 * legado: o `if` dele so corta quando o caminho **comeca** com o `basedir`
 * (`:923`). Um anexo gravado fora da area tem o caminho absoluto no metadado, e
 * e por isso que `get_attached_file()` pergunta se o valor e relativo antes de
 * prefixar (`:849`).
 *
 * ⚠️ **O corte e `str_replace()`, e ele tira TODAS as ocorrencias, nao o
 * prefixo** (`:924`). A guarda e `str_starts_with()`, mas a troca nao e
 * ancorada: com a raiz de envios em `/u/b`, o caminho `/u/b/u/b/foto.jpg` sai
 * como `foto.jpg`, e nao como `u/b/foto.jpg`. Um porte que cortasse so o
 * prefixo gravaria outro valor em `file` — e `file` e endereco publico.
 *
 * T002 registrou que a relativizacao *"nao esta aqui"* e por que: ela precisa da
 * raiz da area de envios, que e a **porta de sistema de arquivos**, e nao a de
 * dados. Esta e a primeira tarefa que tem as duas na mao.
 *
 * O ponto de extensao `_wp_relative_upload_path` (`:936`) nao e emitido
 * (`REQ-162`).
 */
export function caminhoRelativoDeEnvio(
  caminho: string,
  raizDeEnvios: string,
): string {
  if (!caminho.startsWith(raizDeEnvios)) {
    return caminho;
  }
  return semBarraNoComeco(caminho.split(raizDeEnvios).join(''));
}

/** `ltrim( $new_path, '/' )` (`wp-includes/post.php:925`). */
function semBarraNoComeco(caminho: string): string {
  let inicio = 0;
  while (inicio < caminho.length && caminho.charAt(inicio) === '/') {
    inicio += 1;
  }
  return caminho.slice(inicio);
}
