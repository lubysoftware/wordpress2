/**
 * **CA-3.3**: tamanho registrado depois do envio **nao** e gerado
 * retroativamente — ha uma acao explicita para regerar.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). Sao duas
 * funcoes do legado: `wp_get_missing_image_subsizes( $attachment_id )`
 * (`wp-admin/includes/image.php:87`), que **compara** o registrado com o
 * gravado, e `wp_update_image_subsizes( $attachment_id )` (`:159`), que e **a
 * acao**.
 *
 * ---
 *
 * # Por que CA-3.3 e DUAS afirmacoes, e as duas sao do legado
 *
 * **"Nao e gerado retroativamente"** nao e uma decisao tomada aqui: ela cai de
 * graca de `gerar-derivadas.ts`, porque nada no legado volta a passar pela
 * ingestao de um anexo que ja existe. Registrar `add_image_size( 'capa', ... )`
 * numa extensao nao toca anexo nenhum: os anexos antigos seguem com as derivadas
 * que tinham.
 *
 * **"Ha uma acao explicita"** e esta funcao, e no legado ela tem **duas**
 * superficies, cada uma com a sua permissao — ver {@link
 * regerarDerivadasQueFaltam}.
 *
 * ---
 *
 * # O que a comparacao do que falta tem de diferente do laco da ingestao
 *
 * Tres coisas, e as tres mudam o conjunto gerado:
 *
 * 1. **Ela mede a imagem ORIGINAL, nao a servida.** *"Use the originally
 *    uploaded image dimensions as full_width and full_height"* (`:100`): quando
 *    ha `original_image` no metadado — isto e, quando houve reducao na ingestao
 *    (T009) — ela abre o original e usa as medidas dele. So cai nas medidas do
 *    metadado quando a leitura do original nao responde (`:106`).
 * 2. **Ela salta tamanho maior que a imagem, e o laco da ingestao nao salta**
 *    (`:116`-`:121`, *"Skip registered sizes that are too large for the uploaded
 *    image"*). O resultado observavel e o mesmo — o calculo de medidas recusa o
 *    tamanho grande de qualquer forma —, mas o conjunto **declarado** como
 *    faltante e menor, e e ele que a rota REST publica em
 *    `missing_image_sizes`
 *    (`class-wp-rest-attachments-controller.php:1518`).
 * 3. **A comparacao com o que existe e por NOME** (`array_diff_key`, `:134`),
 *    com o mesmo comentario do laco da ingestao (`:128`-`:132`): *"It is possible that the
 *    dimensions for a particular size name have changed. For example the user
 *    has changed the values on the Settings -> Media screen. However we keep the
 *    old sub-sizes with the previous dimensions as the image may have been used
 *    in an older post"*. **Mudar a medida de `medium` na tela nao regera nada.**
 *    E este o comportamento que CA-3.3 descreve pelo outro lado.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type { MetadadoDeAnexo } from '../armazenamento/index.js';
import type { TamanhoDeImagem } from '../tamanhos/index.js';
import type { ContextoDeDerivadas } from './contexto-de-derivadas.js';
import { criarDerivadasDeImagem } from './criar-derivadas-na-ingestao.js';
import { dimensoesDeRedimensionamento } from './dimensoes-de-redimensionamento.js';
import { gerarDerivadas } from './gerar-derivadas.js';
import { tamanhosRegistrados } from './tamanhos-registrados.js';

/**
 * `new WP_Error( 'invalid_attachment', __( 'The attached file cannot be found.' ) )`
 * (`wp-admin/includes/image.php:171`).
 *
 * O texto e o `msgid` em ingles, que **e** a chave do catalogo (`EC-05`), como
 * em `../envio/enviar-arquivo.ts`.
 */
export const CODIGO_DE_ANEXO_INVALIDO = 'invalid_attachment';
export const MENSAGEM_DE_ARQUIVO_NAO_ENCONTRADO =
  'The attached file cannot be found.';

/** O que a acao de regerar devolve: o metadado, ou o erro do legado. */
export type ResultadoDaRegeracao =
  | { readonly regerado: true; readonly metadado: ValorPhp }
  | {
      readonly regerado: false;
      readonly codigo: string;
      readonly mensagem: string;
    };

/**
 * `wp_get_missing_image_subsizes( $attachment_id )`
 * (`wp-admin/includes/image.php:87`).
 *
 * O mapa que falta, na ordem dos tamanhos registrados. Vazio significa *"nada a
 * fazer"*, e e por ele que a acao de regerar devolve o metadado sem emitir
 * escrita nenhuma.
 */
export function derivadasQueFaltam(
  contexto: ContextoDeDerivadas,
  anexoId: number,
): ReadonlyMap<string, TamanhoDeImagem> {
  const vazio = new Map<string, TamanhoDeImagem>();

  if (!contexto.conteudo.ehAnexoDeImagem(anexoId)) {
    return vazio;
  }

  const registrados = tamanhosRegistrados(
    contexto.opcoesDeTamanho,
    contexto.tamanhosAdicionais,
  );
  const metadado = contexto.armazenamento.metadadoDeAnexo.obterMetadado(anexoId);

  // "Meta error?" (`:97`) — sem metadado, **tudo** falta.
  if (metadado === null) {
    return registrados;
  }

  const medidas = medidasDaImagemCompleta(contexto, anexoId, metadado);

  const possiveis = new Map<string, TamanhoDeImagem>();
  for (const [nome, tamanho] of registrados) {
    // "Skip registered sizes that are too large for the uploaded image."
    if (
      dimensoesDeRedimensionamento(
        medidas.largura,
        medidas.altura,
        tamanho.largura,
        tamanho.altura,
        tamanho.recorte,
      ) !== null
    ) {
      possiveis.set(nome, tamanho);
    }
  }

  // "Remove sizes that already exist. Only checks for matching 'size names'."
  for (const derivada of metadado.derivadas) {
    possiveis.delete(derivada.nome);
  }

  // O ponto de extensao `wp_get_missing_image_subsizes` (`:146`) nao e emitido.
  return possiveis;
}

/**
 * `wp_update_image_subsizes( $attachment_id )`
 * (`wp-admin/includes/image.php:159`) — **a acao explicita de CA-3.3**.
 *
 * ---
 *
 * # A permissao: ela e da SUPERFICIE, e sao duas superficies diferentes
 *
 * Esta funcao **nao pergunta capacidade nenhuma**, e isso nao e omissao: e o que
 * o legado faz, e e o que a pauta do `index.ts` deste modulo registrou para esta
 * linha — *"o pacote nao declara nenhuma; CA-3.3 pede uma acao explicita para
 * regerar, e **quem a expor declara a dela** (P4)"*. As duas superficies do
 * legado pedem coisas diferentes:
 *
 * | superficie | o que ela confere | ancora |
 * |---|---|---|
 * | o envio assincrono do editor (`media-create-image-subsizes`) | o nonce `media-form`, **e** `upload_files` | `wp-admin/includes/ajax-actions.php:2550` e `:2552` |
 * | a rota REST de pos-processamento (`POST /wp/v2/media/<id>/post-process`) | `edit_post` **daquele** anexo, por `update_item_permissions_check()` | `class-wp-rest-attachments-controller.php:1052` |
 *
 * Trazer qualquer uma das duas para dentro desta funcao tornaria a outra
 * superficie mais fechada ou mais aberta do que o legado, e o P1 nao autoriza
 * nem uma coisa nem outra sem decisao humana registrada. **Toda superficie que
 * expuser esta operacao declara a permissao dela, explicitamente** (P4) — e as
 * duas acima sao as que existem hoje.
 *
 * ---
 *
 * # Os tres caminhos, e o que cada um emite
 *
 * | caso | o que roda | escritas |
 * |---|---|---|
 * | sem metadado, **com** arquivo | a ingestao inteira (`:169`) | a inicial, uma por derivada, e a final |
 * | sem metadado e sem arquivo | nada: devolve o erro (`:171`) | **nenhuma** |
 * | com metadado | so o que falta (`:181`), ou nada (`:177`) | uma por derivada, e a final |
 *
 * ⚠️ **A gravacao final sai daqui, e a da ingestao NAO** (ver
 * `criar-derivadas-na-ingestao.ts`): `wp_update_image_subsizes()` termina com
 * `wp_update_attachment_metadata()` (`:188`), e `wp_create_image_subsizes()` nao
 * — la ela e do chamador. A diferenca e **uma escrita**, e a area 3 da Decisao 2
 * de `parity_specs.md` compara *"snapshot + sequencia de comandos"*.
 *
 * ⚠️ **No caso "com metadado e nada faltando" o legado devolve ANTES da
 * gravacao final** (`return $image_meta;`, `:177`), logo nenhuma escrita sai.
 * Um porte que caisse no fim gravaria uma vez a mais.
 *
 * ⚠️ **As leituras do metadado se repetem aqui porque se repetem la, e a
 * diferenca e o cache de objeto.** O legado le `wp_get_attachment_metadata()`
 * nesta funcao (`:160`), de novo em `wp_get_original_image_path()`
 * (`post.php:8688`) e de novo em `wp_get_missing_image_subsizes()`
 * (`image.php:92`) — e a segunda e a terceira **nao emitem consulta**, porque
 * `get_metadata()` passa pelo cache de objeto por requisicao
 * (`wp-includes/meta.php`). O cache de objeto e a **quarta borda de AD-08** e
 * nao e porta deste modulo; enquanto ele nao existir, cada leitura daqui chega
 * a porta de dados. A sequencia de **escritas** e identica; a de leituras nao,
 * e isso esta declarado aqui para nao se perder.
 */
export function regerarDerivadasQueFaltam(
  contexto: ContextoDeDerivadas,
  anexoId: number,
): ResultadoDaRegeracao {
  const metadado = contexto.armazenamento.metadadoDeAnexo.obterMetadado(anexoId);
  const caminhoDoOriginal = caminhoDaImagemOriginal(contexto, anexoId);

  let atualizado: ValorPhp;

  if (metadado === null) {
    /*
      "Previously failed upload? If there is an uploaded file, make all
      sub-sizes and generate all of the attachment meta." (`:165`)
    */
    if (caminhoDoOriginal === '') {
      return {
        regerado: false,
        codigo: CODIGO_DE_ANEXO_INVALIDO,
        mensagem: MENSAGEM_DE_ARQUIVO_NAO_ENCONTRADO,
      };
    }
    atualizado = criarDerivadasDeImagem(contexto, {
      anexoId,
      caminho: caminhoDoOriginal,
    });
  } else {
    const faltando = derivadasQueFaltam(contexto, anexoId);

    if (faltando.size === 0) {
      // `return $image_meta;` (`:177`) — sem gravacao. Ver o cabecalho.
      return { regerado: true, metadado: metadado.valor };
    }

    // "This also updates the image meta." (`:180`)
    atualizado = gerarDerivadas(contexto, {
      anexoId,
      caminho: caminhoDoOriginal,
      tamanhos: faltando,
      metadado: metadado.valor,
    });
  }

  /*
    O ponto de extensao `wp_generate_attachment_metadata` com o contexto
    `'update'` (`:185`) entra aqui. Nao e emitido (`REQ-162`).
  */

  // "Save the updated metadata." (`:187`, a escrita em `:188`)
  contexto.armazenamento.metadadoDeAnexo.gravarMetadado(anexoId, atualizado);

  return { regerado: true, metadado: atualizado };
}

/**
 * `wp_get_original_image_path( $attachment_id )`
 * (`wp-includes/post.php:8683`), no recorte que este caminho usa.
 *
 * Cadeia vazia e o `false` do legado — *"nao e imagem"* — e tambem o
 * `get_attached_file()` vazio, que e o que faz o `empty( $image_file )` de
 * `:168` cair no erro.
 *
 * ⚠️ **Sem `original_image` o caminho e o do arquivo SERVIDO**, nao de um
 * original separado (`:8691`): numa instalacao em que nada foi reduzido, o
 * "original" e o proprio arquivo do anexo. Quem supusesse um arquivo separado
 * sempre existir quebraria a regeracao de toda imagem abaixo do limite.
 *
 * O ponto de extensao `wp_get_original_image_path` (`:8705`) nao e emitido.
 */
export function caminhoDaImagemOriginal(
  contexto: ContextoDeDerivadas,
  anexoId: number,
): string {
  if (!contexto.conteudo.ehAnexoDeImagem(anexoId)) {
    return '';
  }

  const metadado = contexto.armazenamento.metadadoDeAnexo.obterMetadado(anexoId);
  const caminhoDoAnexo = caminhoAbsolutoDoAnexo(contexto, anexoId);

  const nomeDoOriginal = metadado?.nomeDoOriginal ?? null;
  if (nomeDoOriginal === null || nomeDoOriginal === '') {
    return caminhoDoAnexo;
  }

  /*
    `path_join( dirname( $image_file ), $image_meta['original_image'] )`
    (`:8694`). `original_image` e sempre um `wp_basename()` (`image.php:223`),
    logo `path_is_absolute()` e sempre falso e o ramo e o simples:
    `rtrim( $base, '/' ) . '/' . $path`. A pergunta completa de
    `path_is_absolute()` (`wp-includes/functions.php:2127`) consulta `realpath()`
    e fluxo, que e disco — a porta nao a tem, e o caso nao e alcancavel por este
    caminho.
  */
  return `${semBarraNoFim(pastaDoCaminho(caminhoDoAnexo))}/${nomeDoOriginal}`;
}

/**
 * `get_attached_file( $attachment_id )` (`wp-includes/post.php:845`).
 *
 * A absolutizacao que T002 deixou para *"quem tem as duas portas na mao"*: o
 * valor da coluna e relativo a area de envios, e so e prefixado quando **nao**
 * comeca por `/` e nao e caminho de unidade do Windows (`:849`).
 *
 * ⚠️ **A guarda do Windows e `|^.:\\|`** — um caractere qualquer, dois-pontos e
 * uma contrabarra —, e esta aqui porque esta la. O ponto de extensao
 * `get_attached_file` (`:868`) nao e emitido.
 */
function caminhoAbsolutoDoAnexo(
  contexto: ContextoDeDerivadas,
  anexoId: number,
): string {
  const relativo =
    contexto.armazenamento.metadadoDeAnexo.obterCaminhoRelativo(anexoId);

  if (relativo === '') {
    return '';
  }
  if (relativo.startsWith('/') || /^.:\\/.test(relativo)) {
    return relativo;
  }
  return `${contexto.sistemaDeArquivos.raizDeEnvios}/${relativo}`;
}

/**
 * As medidas da imagem **completa** para a comparacao do que falta
 * (`wp-admin/includes/image.php:100`-`:112`).
 */
function medidasDaImagemCompleta(
  contexto: ContextoDeDerivadas,
  anexoId: number,
  metadado: MetadadoDeAnexo,
): { readonly largura: number; readonly altura: number } {
  if (metadado.nomeDoOriginal !== null && metadado.nomeDoOriginal !== '') {
    const lido = contexto.leituraDoArquivo.dimensoes(
      caminhoDaImagemOriginal(contexto, anexoId),
    );
    if (lido !== null) {
      return { largura: lido.largura, altura: lido.altura };
    }
  }

  // `(int) $image_meta['width']` — chave ausente vale `0`, como `(int) null`.
  return {
    largura: metadado.largura ?? 0,
    altura: metadado.altura ?? 0,
  };
}

/** `dirname()` — ver `nome-da-derivada.ts`, que faz a mesma conta. */
function pastaDoCaminho(caminho: string): string {
  const barra = caminho.lastIndexOf('/');
  if (barra === -1) {
    return '.';
  }
  if (barra === 0) {
    return '/';
  }
  return caminho.slice(0, barra);
}

/** `rtrim( $base, '/' )` (`wp-includes/functions.php:2174`). */
function semBarraNoFim(caminho: string): string {
  let fim = caminho.length;
  while (fim > 0 && caminho.charAt(fim - 1) === '/') {
    fim -= 1;
  }
  return caminho.slice(0, fim);
}
