/**
 * **US-1**: enviar arquivo para a biblioteca validando o tipo real do arquivo.
 *
 * Entrega de **T003** da feature `006-biblioteca-de-midia`: *"o comportamento de
 * US-1 existe e os criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 e CA-1.6
 * passam contra o sistema novo"*.
 *
 * E o fluxo principal de **UC-12**, e no legado ele e **duas** funcoes
 * encadeadas: `media_handle_upload()` (`wp-admin/includes/media.php:296`), que
 * monta o registro, e `_wp_handle_upload()` (`wp-admin/includes/file.php:809`),
 * que valida e grava o arquivo. A ordem dos passos aqui e a delas, e a ordem e
 * **o** contrato desta tarefa: o cenario `@composicao` de `PT-014` compara *"a
 * sequencia de operacoes registrada"* com a do oraculo e exige que *"nenhuma
 * operacao a mais seja executada"*.
 *
 * ---
 *
 * # Os passos, e qual criterio fecha em cada um
 *
 * | # | passo | ancora | criterio |
 * |---|---|---|---|
 * | 1 | as duas verificacoes de capacidade | a superficie (ver `permissao-de-envio.ts`) | **CA-1.1**, **CA-1.6** |
 * | 2 | o instante, retrodatado pelo destino | `media.php:297`-`:303` | — |
 * | 3 | o codigo de erro de envio do runtime | `file.php:921` | — |
 * | 4 | o arquivo veio desta requisicao | `file.php:928` | — |
 * | 5 | o arquivo nao esta vazio | `file.php:934` | — |
 * | 6 | o tipo real, e a correcao do nome | `file.php:957` | **CA-1.2**, **CA-1.3** |
 * | 7 | a pasta de destino, criada | `file.php:980` | **CA-1.5** |
 * | 8 | o nome unico na pasta | `file.php:986` | **CA-1.4** |
 * | 9 | mover o arquivo | `file.php:1014` | **CA-1.5** |
 * | 10 | o registro do anexo, por BC-01 | `media.php:426` | **CA-1.5** (*"nenhum registro e criado"*) |
 * | 11 | o texto alternativo, so quando ha | `media.php:431` | — |
 * | 12 | o registro do envio que contornou o filtro | — (o legado nao tem) | **CA-9.4** |
 *
 * **A ordem de 7, 8 e 9 e a prova de CA-1.5 pelo lado negativo:** o registro do
 * anexo e o passo **10**, logo qualquer falha de 3 a 9 devolve erro *"e nenhum
 * registro de anexo e criado"* — nao porque alguem desfaz, mas porque nunca se
 * chegou la. Um porte que criasse o registro antes de mover o arquivo quebraria
 * o criterio sem quebrar nenhum teste de caminho feliz.
 *
 * ---
 *
 * # O que este fluxo NAO faz, e onde cada coisa esta nomeada
 *
 * 1. **Nao gera derivada nenhuma.** `media_handle_upload()` termina com
 *    `wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $file ) )`
 *    (`wp-admin/includes/media.php:444`), e isso e **T007** (US-3), com a
 *    reducao na ingestao em T009 (US-4) e o relato da falha em T011 (US-5). O
 *    ponto de entrega esta marcado no fim de {@link enviarArquivo} com o que a
 *    tarefa seguinte recebe. 🔴 Antes de pegar T007 ou T009, leia a secao *O que
 *    T001 encontrou aberto* de `../README.md`: a `spec.md` e a arvore discordam
 *    sobre de qual arquivo as derivadas saem quando houve reducao, e o conflito
 *    **nao** foi resolvido.
 * 2. **Nao dispara ponto de extensao nenhum**, e sao **cinco** neste caminho:
 *    `wp_handle_upload_prefilter`, `wp_handle_upload_overrides`,
 *    `pre_move_uploaded_file`, `wp_handle_upload` e `wp_unique_filename` (este
 *    ultimo em `nome-de-arquivo-unico.ts`). O barramento que os dispara e
 *    `REQ-162`, que esta em `do-not-rewrite.md` — escopo **recusado**, nao
 *    pendente. Cada um esta nomeado no lugar exato do fluxo, que e o que o **P2**
 *    cobra de quem nao o implementa.
 * 3. **Nao ajusta permissao do arquivo gravado.** O legado faz
 *    `$stat = stat( dirname( $new_file ) ); $perms = $stat['mode'] & 0000666; chmod( $new_file, $perms );`
 *    (`wp-admin/includes/file.php:1046`). A porta de T001 **nao tem** operacao de
 *    permissao, e acrescentar uma e decisao de quem portar o adaptador, nao desta
 *    tarefa: o passo esta nomeado no lugar, e nenhum criterio de US-1 depende
 *    dele.
 * 4. **Nao responde cabecalho HTTP.** Ver o item 3 do cabecalho de
 *    `contexto-de-envio.ts`.
 * 5. **Nao confere nonce.** Ver o item 3 das diferencas menores em
 *    `permissao-de-envio.ts`.
 *
 * ---
 *
 * # O passo 12 nao e do legado, e e a unica coisa que T019 acrescentou aqui
 *
 * O legado tem o passo 6 e o passo 10; o **12 nao existe nele**, e nenhuma linha
 * da arvore registra envio nenhum. Ele e o acrescimo que o **P7** autoriza para
 * fechar **CA-9.4** (*"cada envio feito por esse caminho fica registrado com
 * conta, arquivo e instante"*), e tudo sobre ele — por que no fim e nao no `if`,
 * o que o evento carrega, o que ele nao carrega, e os dois alcances do contorno
 * que este porte **nao** tem — esta em `./registro-de-envio-sem-filtro.ts`.
 *
 * O que vale repetir aqui e o limite: a colaboracao e **opcional**, omiti-la
 * devolve o comportamento do legado, e nenhuma decisao deste fluxo olha o
 * resultado de escrever — `registrarEnvioSemFiltro()` devolve `void` e nao
 * lanca.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import {
  abrirAreaDeEnvios,
  caminhoEncurtado,
  MENSAGEM_DE_ARQUIVO_NAO_MOVIDO,
} from './area-de-envios.js';
import type {
  ContextoDeEnvio,
  MetadadoDeAudioLido,
  MetadadoDeImagemLido,
  PedidoDeEnvio,
} from './contexto-de-envio.js';
import { nomeDeArquivoUnico } from './nome-de-arquivo-unico.js';
import { autorizarEnvio } from './permissao-de-envio.js';
import { registrarEnvioSemFiltro } from './registro-de-envio-sem-filtro.js';
import { tipoRealDoArquivo } from './tipo-real-do-arquivo.js';
import {
  tiposPermitidos,
  TIPOS_DE_ARQUIVO_DE_FABRICA,
  CAPACIDADE_DE_HTML_BRUTO,
} from './tipos-de-arquivo-permitidos.js';

/**
 * `unfiltered_upload` — a capacidade que contorna o filtro de tipo
 * (`wp-admin/includes/file.php:971`).
 *
 * ⚠️ **A pergunta esta aqui porque o legado a faz aqui**, dentro da validacao de
 * tipo, e nao porque T003 implementava US-9. O mecanismo que a nega por omissao —
 * `ALLOW_UNFILTERED_UPLOADS`, *"a inversa"* de BR-MIGRAR-094 — **ja existia** em
 * `plataforma/autorizacao/revogacao-por-constante.ts` quando T003 fechou, e por
 * isso `perguntarPermissao()` aqui ja devolvia falso numa instalacao de fabrica:
 * CA-9.1, CA-9.2 e CA-9.3 fecharam **sem codigo novo**.
 *
 * Omitir a pergunta tornaria a recusa **incondicional**, o que e mais fechado
 * que o legado (P1).
 *
 * O que **T019** acrescentou e o passo 12: CA-9.4, *"cada envio feito por esse
 * caminho fica registrado com conta, arquivo e instante"*. Ver
 * `./registro-de-envio-sem-filtro.ts`.
 */
export const CAPACIDADE_DE_ENVIO_SEM_FILTRO: Capacidade = 'unfiltered_upload';

/**
 * `$upload_error_strings` — os textos dos codigos de erro de envio do runtime
 * (`wp-admin/includes/file.php:891`), por indice.
 *
 * O indice e o codigo, e o arranjo do legado comeca em `false` porque o codigo
 * `0` e sucesso e o teste e `$file['error'] > 0`. O indice `5` e cadeia vazia
 * porque **nao existe** codigo 5 no PHP, e a lacuna esta preservada: um porte
 * que a fechasse deslocaria os tres ultimos textos.
 *
 * Os dois primeiros sao `sprintf` no legado, com os nomes das diretivas como
 * argumento — `__( 'The uploaded file exceeds the %1$s directive in %2$s.' )`
 * com `'upload_max_filesize'` e `'php.ini'`, e
 * `__( 'The uploaded file exceeds the %s directive that was specified in the HTML form.' )`
 * com `'MAX_FILE_SIZE'`. Os `msgid` com marcador estao aqui, nesta nota, porque
 * e **eles** que sao a chave do catalogo (`EC-05`); o que esta no arranjo e o
 * texto composto, que e o que o ator le.
 *
 * ⚠️ E ponto de extensao: `$overrides['upload_error_strings']` substitui a lista
 * inteira, e o comentario do legado diz que *"this may not have originally been
 * intended to be overridable, but historically has been"* (`:884`). Fica
 * nomeado; o barramento e `REQ-162`.
 */
export const MENSAGENS_DE_ERRO_DE_ENVIO: readonly (string | null)[] = [
  null,
  'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
  'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
  'The uploaded file was only partially uploaded.',
  'No file was uploaded.',
  '',
  'Missing a temporary folder.',
  'Failed to write file to disk.',
  'File upload stopped by extension.',
];

/** `'Invalid form submission.'` (`wp-admin/includes/file.php:916`). */
export const MENSAGEM_DE_FORMULARIO_INVALIDO = 'Invalid form submission.';

/** `'Specified file failed upload test.'` (`:930`). */
export const MENSAGEM_DE_ARQUIVO_NAO_RECEBIDO =
  'Specified file failed upload test.';

/** `'File is empty. ...'`, na forma de rede (`:937`). */
export const MENSAGEM_DE_ARQUIVO_VAZIO_EM_REDE =
  'File is empty. Please upload something more substantial.';

/**
 * `'File is empty. ...'`, na forma de site unico (`:939`).
 *
 * `msgid` do legado, com os tres marcadores:
 * `'File is empty. Please upload something more substantial. This error could
 * also be caused by uploads being disabled in your %1$s file or by %2$s being
 * defined as smaller than %3$s in %1$s.'`, com `'php.ini'`,
 * `'post_max_size'` e `'upload_max_filesize'`.
 */
export const MENSAGEM_DE_ARQUIVO_VAZIO =
  'File is empty. Please upload something more substantial. This error could also be caused by uploads being disabled in your php.ini file or by post_max_size being defined as smaller than upload_max_filesize in php.ini.';

/**
 * **CA-1.3**: o texto com que o tipo fora da lista e recusado
 * (`wp-admin/includes/file.php:972`).
 *
 * E o *"motivo informado ao ator"* do criterio, e e o **mesmo** texto para as
 * tres causas de recusa de tipo: extensao nao reconhecida, tipo real que nao
 * casa com a extensao, e tipo reconhecido que nao esta na lista permitida. O
 * legado nao distingue, e distinguir aqui seria inventar superficie.
 */
export const MENSAGEM_DE_TIPO_NAO_PERMITIDO =
  'Sorry, you are not allowed to upload this file type.';

/** `new WP_Error( 'upload_error', ... )` (`wp-admin/includes/media.php:309`). */
export const CODIGO_DE_ERRO_DE_ENVIO = 'upload_error';

/**
 * A recusa, nas **tres** formas que o legado tem — e sao tres porque sao tres
 * origens diferentes, com formas diferentes na superficie.
 */
export type RecusaDoEnvio =
  /**
   * Uma das duas verificacoes de capacidade negou, numa superficie que recusa.
   *
   * **Nao tem codigo**, e isso e o legado: a tela faz `wp_die( $texto )` e o
   * envio do editor devolve `{ success: false, data: { message, filename } }` —
   * nenhuma das duas tem codigo de erro. Inventar um seria inventar contrato.
   */
  | { readonly motivo: 'sem-permissao'; readonly mensagem: string }
  /**
   * `_wp_handle_upload()` devolveu `array( 'error' => ... )`, e
   * `media_handle_upload()` o embrulhou com o codigo `upload_error`.
   */
  | {
      readonly motivo: 'erro-de-envio';
      readonly codigo: typeof CODIGO_DE_ERRO_DE_ENVIO;
      readonly mensagem: string;
    }
  /** `wp_insert_attachment()` devolveu erro (codigo e texto de BC-01). */
  | {
      readonly motivo: 'falha-ao-criar-anexo';
      readonly codigo: string;
      readonly mensagem: string;
    };

/** O anexo criado, e o que a tarefa seguinte recebe. */
export interface EnvioConcluido {
  readonly anexoId: number;
  /** `$file` — o caminho **absoluto** do arquivo gravado. */
  readonly caminho: string;
  /** `$url` — o endereco publico, que foi gravado no `guid`. */
  readonly endereco: string;
  /** `$type` — o tipo que foi gravado em `post_mime_type`. */
  readonly tipoMime: string;
  /** O nome final em disco, depois da sanitizacao e do laco de colisao. */
  readonly nomeDeArquivo: string;
  /**
   * O destino foi **descartado** por falta de `edit_post` numa superficie que
   * descarta (ver `permissao-de-envio.ts`).
   *
   * ⚠️ Nao e falha: o anexo existe, sem pai. Esta no resultado porque e a unica
   * forma de a superficie saber que o vinculo que o ator pediu nao aconteceu —
   * e no legado ela **tambem** nao avisa ninguem (P7).
   */
  readonly destinoDescartado: boolean;
}

export type ResultadoDoEnvio =
  | ({ readonly enviado: true } & EnvioConcluido)
  | ({ readonly enviado: false } & RecusaDoEnvio);

/**
 * `media_handle_upload( 'async-upload', $post_id, $post_data )`
 * (`wp-admin/includes/media.php:296`), com `_wp_handle_upload()` em linha, na
 * posicao em que o legado a chama.
 *
 * As duas estao num fluxo so porque no legado uma e passo da outra e porque a
 * segunda recebe o elemento de `$_FILES` **por referencia** e o reescreve — a
 * reescrita do nome (`file.php:964`) e lida de volta em `media.php:313`, e e dela
 * que sai o titulo do anexo. Separa-las em duas funcoes puras exigiria devolver
 * o nome corrigido por fora, o que e o mesmo acoplamento com mais indirecao.
 */
export function enviarArquivo(
  contexto: ContextoDeEnvio,
  pedido: PedidoDeEnvio,
): ResultadoDoEnvio {
  // ── 1. CA-1.1 e CA-1.6: as duas verificacoes de capacidade ───────────────
  const decisao = autorizarEnvio(
    { base: contexto.base, ator: contexto.ator },
    pedido.superficie,
    pedido.conteudoDeDestino,
    (conteudoId) => contexto.conteudo.obterDestino(conteudoId) !== null,
  );

  if (decisao.desfecho === 'recusado') {
    return {
      enviado: false,
      motivo: 'sem-permissao',
      mensagem: decisao.mensagem,
    };
  }

  const destino = decisao.conteudoDeDestino;
  const destinoDescartado = decisao.desfecho === 'destino-descartado';

  // ── 2. O instante, retrodatado pelo destino (`media.php:297`) ────────────
  let instante = contexto.relogio.agoraNoFormatoDoBanco();
  const conteudoDeDestino = contexto.conteudo.obterDestino(destino);

  if (conteudoDeDestino !== null && ehRetrodatavel(conteudoDeDestino)) {
    instante = conteudoDeDestino.data;
  }

  /*
    Ponto de extensao `wp_handle_upload_prefilter` (`file.php:838`) e
    `wp_handle_upload_overrides` (`:864`): o primeiro pode **marcar o arquivo
    com erro**, e o legado trata isso logo depois com
    `if ( isset( $file['error'] ) && ! is_numeric( $file['error'] ) && $file['error'] )`
    (`:871`) — um erro que e TEXTO, nao codigo. Nenhum dos dois dispara aqui:
    barramento e `REQ-162`, em `do-not-rewrite.md`.

    E o `test_form` (`:916`) esta DESLIGADO neste caminho: `media_handle_upload()`
    chama com `array( 'test_form' => false )` (`media.php:296`), logo
    MENSAGEM_DE_FORMULARIO_INVALIDO nao e alcancavel por aqui. Ela esta declarada
    porque o arranjo de `overrides` e publico e porque outra superficie a alcanca.
  */

  // ── 3. O codigo de erro do runtime (`file.php:921`) ──────────────────────
  if (pedido.arquivo.erro > 0) {
    return erroDeEnvio(
      MENSAGENS_DE_ERRO_DE_ENVIO[pedido.arquivo.erro] ?? '',
    );
  }

  // ── 4. O arquivo veio desta requisicao (`file.php:928`) ──────────────────
  if (!pedido.arquivo.recebidoNaRequisicao) {
    return erroDeEnvio(MENSAGEM_DE_ARQUIVO_NAO_RECEBIDO);
  }

  // ── 5. O arquivo nao esta vazio (`file.php:934`) ─────────────────────────
  if (!(pedido.arquivo.bytes > 0)) {
    return erroDeEnvio(
      contexto.base.rede.ativa
        ? MENSAGEM_DE_ARQUIVO_VAZIO_EM_REDE
        : MENSAGEM_DE_ARQUIVO_VAZIO,
    );
  }

  // ── 6. CA-1.2 e CA-1.3: o tipo real, e a correcao do nome ────────────────
  const contextoDeAutorizacao = comAtor(contexto.base, contexto.ator);
  const lista = contexto.tiposDeArquivo ?? TIPOS_DE_ARQUIVO_DE_FABRICA;
  const listaPermitida = tiposPermitidos(
    perguntarPermissao(contextoDeAutorizacao, CAPACIDADE_DE_HTML_BRUTO),
    lista,
  );

  const validacao = tipoRealDoArquivo(
    {
      caminho: pedido.arquivo.caminhoTemporario,
      nomeDeArquivo: pedido.arquivo.nome,
      lista: listaPermitida,
      listaPermitida,
    },
    contexto.sistemaDeArquivos,
    contexto.deteccao,
  );

  /*
    "Check to see if wp_check_filetype_and_ext() determined the filename was
    incorrect." (`file.php:963`). E aqui que o legado reescreve
    `$_FILES[...]['name']`, e e deste nome que o titulo do anexo sai no passo 10.
  */
  const nomeInformado = validacao.nomeCorrigido ?? pedido.arquivo.nome;

  if (
    !validacao.tipo.reconhecido &&
    !perguntarPermissao(contextoDeAutorizacao, CAPACIDADE_DE_ENVIO_SEM_FILTRO)
  ) {
    return erroDeEnvio(MENSAGEM_DE_TIPO_NAO_PERMITIDO);
  }

  /*
    **CA-9.3 e o que esta linha afirma.** Chegar aqui com o tipo NAO reconhecido
    so acontece de uma forma: `unfiltered_upload` respondeu sim. E ela so
    responde sim quando a instalacao declarou `ALLOW_UNFILTERED_UPLOADS` — sem a
    constante a capacidade pedida vira `do_not_allow`, que ninguem pode ter,
    nem o super administrador (`wp-includes/capabilities.php:587`-`:592`).
    Nao ha segundo caminho, e e por isso que o contorno e deduzivel do estado do
    fluxo sem que nada precise ser carregado desde a pergunta.
  */
  const contornouOFiltroDeTipo = !validacao.tipo.reconhecido;

  /*
    `if ( ! $type ) { $type = $file['type']; }` (`:975`) — com `unfiltered_upload`
    o envio passa, e o tipo gravado passa a ser o que o NAVEGADOR afirmou. E a
    unica porta de entrada do campo `tipoInformado` no registro, e e por ela que
    US-9 deixa tipo arbitrario em `post_mime_type`.
  */
  const tipoMime = validacao.tipo.reconhecido
    ? validacao.tipo.tipoMime
    : pedido.arquivo.tipoInformado;

  // ── 7. CA-1.5: a pasta de destino, criada (`file.php:980`) ───────────────
  const area = abrirAreaDeEnvios(
    instante,
    {
      enderecoBaseDeEnvios: contexto.enderecoBaseDeEnvios,
      raizDaInstalacao: contexto.raizDaInstalacao,
      organizarPorAnoEMes: contexto.organizarPorAnoEMes,
      escaparHtml: contexto.escaparHtml,
    },
    contexto.sistemaDeArquivos,
  );

  if (!area.disponivel) {
    return erroDeEnvio(area.mensagem);
  }

  // ── 8. CA-1.4: o nome unico na pasta (`file.php:986`) ────────────────────
  const nomeUnico = nomeDeArquivoUnico(
    {
      pasta: area.caminho,
      nomeDeArquivo: nomeInformado,
      lista,
      listaPermitida,
      ...(contexto.conversaoDeFormatoDoEditor === undefined
        ? {}
        : { conversaoDeFormato: contexto.conversaoDeFormatoDoEditor }),
    },
    contexto.sistemaDeArquivos,
    contexto.texto,
  );

  const novoCaminho = `${area.caminho}/${nomeUnico.nome}`;

  /*
    Ponto de extensao `pre_move_uploaded_file` (`file.php:1012`): devolvendo
    valor nao nulo, *"moving the file and any related error reporting will be
    completely skipped"*. Nao dispara aqui (`REQ-162`), e a consequencia de ele
    nao existir e que o caminho normal sempre move — que e o default do legado.
  */

  // ── 9. CA-1.5: mover o arquivo (`file.php:1016`) ─────────────────────────
  const movido = contexto.sistemaDeArquivos.mover(
    pedido.arquivo.caminhoTemporario,
    novoCaminho,
  );

  if (!movido.concluido) {
    /*
      O legado NAO usa a mensagem do sistema de arquivos aqui: `@move_uploaded_file()`
      e silenciado e o texto e montado com o caminho encurtado (`:1029`-`:1038`).
      E o encurtamento desta mensagem usa `basename()` e NAO escapa, ao contrario
      do de `wp_upload_dir()` — ver `caminhoEncurtado()` em `area-de-envios.ts`.
      A mensagem do sistema de arquivos que CA-1.5 pede e a do passo 7.
    */
    return erroDeEnvio(
      MENSAGEM_DE_ARQUIVO_NAO_MOVIDO.replace(
        '%s',
        caminhoEncurtado(
          contexto.sistemaDeArquivos.raizDeEnvios,
          area.subpasta,
          contexto.raizDaInstalacao,
        ),
      ),
    );
  }

  /*
    Passo nao portado: `stat()` da pasta mais `chmod()` do arquivo (`:1046`). Ver
    o item 3 do cabecalho deste arquivo.

    Ponto de extensao `wp_handle_upload` (`:1073`): filtra o arranjo
    `{ file, url, type }` antes de devolver. Nao dispara (`REQ-162`).
  */

  const endereco = `${area.endereco}/${nomeUnico.nome}`;

  // ── 10. O registro do anexo, por BC-01 (`media.php:313`-`:426`) ──────────
  const extensao = extensaoDeNome(nomeInformado);
  const nomeSemExtensao = nomeBaseSemSufixo(nomeInformado, `.${extensao}`);

  let titulo = contexto.texto.sanitizarCampoDeTexto(nomeSemExtensao);
  let descricao = '';
  let legenda = '';
  let textoAlternativo = '';

  if (/^audio/.test(tipoMime)) {
    const metadado = contexto.metadadoDoArquivo?.lerMetadadoDeAudio?.(
      novoCaminho,
    );
    if (metadado !== undefined && metadado !== null) {
      ({ titulo, descricao } = derivarDeAudio(contexto, metadado, titulo));
    }
  } else if (tipoMime.startsWith('image/')) {
    const metadado = contexto.metadadoDoArquivo?.lerMetadadoDeImagem?.(
      novoCaminho,
    );
    if (metadado !== undefined && metadado !== null) {
      ({ titulo, legenda, textoAlternativo } = derivarDeImagem(
        metadado,
        titulo,
        contexto,
      ));
    }
  }

  const informados = pedido.dadosDoAnexo;

  const resultado = contexto.conteudo.inserirAnexo({
    tipoMime,
    endereco,
    conteudoDeDestino: destino,
    titulo: informados?.titulo ?? titulo,
    descricao: informados?.descricao ?? descricao,
    legenda: informados?.legenda ?? legenda,
    /*
      `wp_insert_attachment( $attachment, $file, ... )` recebe o caminho
      **absoluto** (`media.php:426`), e quem o relativiza e
      `update_attached_file()` → `_wp_relative_upload_path()`
      (`wp-includes/post.php:885` e `:900`), dentro de `wp_insert_post()`. Logo
      a relativizacao e de BC-01, e nao deste fluxo: o que este fluxo resolve e
      o caminho de destino e a area de envios, que sao as duas coisas que ele
      tem porta para resolver.
    */
    arquivo: novoCaminho,
    ...(informados?.contexto === undefined
      ? {}
      : { contexto: informados.contexto }),
  });

  if (!resultado.inserido) {
    /*
      🔴 **Aqui o legado e a forma desta funcao divergem, e as duas levam ao mesmo
      observavel.** No legado a gravacao do texto alternativo vem ANTES da
      verificacao do erro (`media.php:431` contra `:433`), logo com erro ela
      recebe o proprio objeto de erro como identificador do anexo —
      `update_post_meta()` chama `absint()` sobre ele, o que no PHP 8 do legado e
      um `TypeError` e **mata a requisicao**. Esta forma nao tem identificador
      para gravar, e devolve a recusa.

      O que as duas leituras compartilham e o unico observavel: **nenhum anexo e
      nenhum metadado sobrevivem**. E o mesmo precedente de
      `capacidadeDePublicar()` em
      `contextos/conteudo/publicacao/permissao-de-publicacao.ts`, com a mesma
      conclusao — *"a porta fechada e o unico resultado que as duas leituras
      compartilham"*.
    */
    return {
      enviado: false,
      motivo: 'falha-ao-criar-anexo',
      codigo: resultado.codigo,
      mensagem: resultado.mensagem,
    };
  }

  // ── 11. O texto alternativo, so quando ha (`media.php:431`) ──────────────
  if (textoAlternativo.trim() !== '') {
    contexto.armazenamento.metadadoDeAnexo.gravarTextoAlternativo(
      resultado.anexoId,
      contexto.texto.sanitizarCampoDeTexto(textoAlternativo),
    );
  }

  // ── 12. CA-9.4: o registro do envio que contornou o filtro (T019) ───────
  if (contornouOFiltroDeTipo) {
    /*
      Depois do passo 10 de proposito: CA-9.4 e sobre envio **feito**, e so aqui
      o anexo existe. Ver `./registro-de-envio-sem-filtro.ts` para a alternativa
      que foi recusada, e por que.
    */
    registrarEnvioSemFiltro(contexto.registroDeEnvioSemFiltro, {
      contaId: contexto.ator.contaId,
      anexoId: resultado.anexoId,
      nomeDeArquivo: nomeUnico.nome,
      nomeInformado,
      endereco,
      tipoGravado: tipoMime,
    });
  }

  /*
    Fim de T003, mais o passo 12 de T019. O que `media_handle_upload()` ainda
    faz, e que NAO e de nenhuma das duas:

    - `header( 'X-WP-Upload-Attachment-ID: ' . $attachment_id )` (`media.php:437`)
      — borda de HTTP, ver `contexto-de-envio.ts`;
    - `wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $file ) )`
      (`:444`) — **T007** (US-3). O que a tarefa seguinte recebe e exatamente o
      que este resultado carrega: o identificador do anexo e o caminho
      ABSOLUTO do arquivo gravado. O comentario do legado diz por que a chamada
      e a ultima: *"The image sub-sizes are created during
      wp_generate_attachment_metadata(). This is generally slow and may cause
      timeouts or out of memory errors."* — e e por isso que o anexo existe
      **antes** das derivadas, o que torna `M4` observavel como anexo com
      metadado incompleto.
  */
  return {
    enviado: true,
    anexoId: resultado.anexoId,
    caminho: novoCaminho,
    endereco,
    tipoMime,
    nomeDeArquivo: nomeUnico.nome,
    destinoDescartado,
  };
}

/**
 * `'page' !== $post->post_type && substr( $post->post_date, 0, 4 ) > 0`
 * (`wp-admin/includes/media.php:301`).
 *
 * A segunda metade e comparacao de **cadeia com numero** em PHP: `'2026' > 0` e
 * verdadeiro, `'0000' > 0` e falso. E ela que impede a retrodatacao para a
 * sentinela `0000-00-00 00:00:00` — que, se passasse, produziria a pasta
 * `/0000/00` (ver `subpastaDeAnoEMes()` em `area-de-envios.ts`).
 */
function ehRetrodatavel(destino: { tipo: string; data: string }): boolean {
  return destino.tipo !== 'page' && Number(destino.data.slice(0, 4)) > 0;
}

/** O ramo de imagem de `media_handle_upload()` (`media.php:391`-`:407`). */
function derivarDeImagem(
  metadado: MetadadoDeImagemLido,
  tituloDoNome: string,
  contexto: ContextoDeEnvio,
): {
  titulo: string;
  legenda: string;
  textoAlternativo: string;
} {
  let titulo = tituloDoNome;

  /*
    `if ( trim( $image_meta['title'] ) && ! is_numeric( sanitize_title( $image_meta['title'] ) ) )`
    (`:395`). A segunda metade recusa titulo EXIF que seja so numero — e muita
    camera grava o numero da foto ali. `sanitize_title()` e de
    `plataforma/formatacao/` e nao existe nesta arvore; o que esta tarefa tem
    injetado e `sanitize_title_with_dashes()`, que e exatamente a cadeia de
    `sanitize_title()` sem os dois filtros dela — e a diferenca entre as duas,
    aqui, nao muda o resultado de `is_numeric`.
  */
  if (
    metadado.titulo.trim() !== '' &&
    !ehNumerico(contexto.texto.sanitizarTituloComTracos(metadado.titulo))
  ) {
    titulo = metadado.titulo;
  }

  return {
    titulo,
    legenda: metadado.legenda.trim() !== '' ? metadado.legenda : '',
    textoAlternativo:
      metadado.textoAlternativo.trim() !== '' ? metadado.textoAlternativo : '',
  };
}

/**
 * O ramo de audio de `media_handle_upload()` (`media.php:321`-`:389`).
 *
 * 🔴 **A composicao da descricao nao esta portada**: ela chega injetada em
 * {@link ContextoDeEnvio.metadadoDoArquivo}, e a razao — dez `msgid` e
 * `number_format_i18n()`, que sao `plataforma/traducao/`, feature 015 — esta por
 * extenso ali e em `../README.md`. **Omitida, a descricao fica vazia**, e isso e
 * divergencia declarada, nao esquecimento.
 *
 * O que **esta** portado e a sobreposicao do titulo (`:325`), que nao depende de
 * catalogo nenhum: `if ( ! empty( $meta['title'] ) ) { $title = $meta['title']; }`.
 */
function derivarDeAudio(
  contexto: ContextoDeEnvio,
  metadado: MetadadoDeAudioLido,
  tituloDoNome: string,
): { titulo: string; descricao: string } {
  const titulo = metadado.titulo !== '' ? metadado.titulo : tituloDoNome;
  const descricao =
    contexto.metadadoDoArquivo?.descricaoDeAudio?.(metadado, titulo) ?? '';
  return { titulo, descricao };
}

/** `is_numeric()` para o recorte que o titulo EXIF alcanca. */
function ehNumerico(texto: string): boolean {
  return texto.trim() !== '' && !Number.isNaN(Number(texto));
}

/** `new WP_Error( 'upload_error', $file['error'] )` (`media.php:309`). */
function erroDeEnvio(mensagem: string): ResultadoDoEnvio {
  return {
    enviado: false,
    motivo: 'erro-de-envio',
    codigo: CODIGO_DE_ERRO_DE_ENVIO,
    mensagem,
  };
}

/** `pathinfo( $nome, PATHINFO_EXTENSION )`. */
function extensaoDeNome(nome: string): string {
  const ponto = nome.lastIndexOf('.');
  return ponto === -1 ? '' : nome.slice(ponto + 1);
}

/**
 * `wp_basename( $name, ".$ext" )` (`wp-admin/includes/media.php:315`).
 *
 * `basename()` so remove o sufixo quando ele **nao** e o nome inteiro — e e por
 * isso que um arquivo chamado `.jpg` conserva o nome e nao fica sem titulo.
 */
function nomeBaseSemSufixo(nome: string, sufixo: string): string {
  if (sufixo !== '.' && nome !== sufixo && nome.endsWith(sufixo)) {
    return nome.slice(0, nome.length - sufixo.length);
  }
  return nome;
}
