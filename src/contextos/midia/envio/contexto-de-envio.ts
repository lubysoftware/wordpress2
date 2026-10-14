/**
 * O contexto de um envio: tudo que US-1 precisa e que **nao e** regra desta
 * pasta.
 *
 * Entrega de **T003** da feature `006-biblioteca-de-midia` (US-1). Mesma forma e
 * mesmas razoes de `contextos/conteudo/publicacao/contexto-de-publicacao.ts` e
 * de `plataforma/autorizacao/contexto-de-autorizacao.ts`, e as duas valem
 * palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 *   REQUISICAO, e a area 5 do criterio de paridade tem tolerancia **zero**.
 *   Nesta tarefa isso pesa: `PT-014` tem cenario `@concorrencia` — *"dois envios
 *   simultaneos do mesmo nome nao se sobrescrevem"*, *"cada anexo aponta para o
 *   seu proprio arquivo"*, *"a autoria de cada anexo corresponde a quem o
 *   enviou"*;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** AD-08
 *   fixa portas somente nas 5 bordas; AD-10 e a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * # Por que `media_handle_upload()` precisa de seis colaboradores
 *
 * A funcao do legado tem 150 linhas e atravessa cinco donos
 * (`wp-admin/includes/media.php:296`-`:445`), mais `_wp_handle_upload()`
 * (`wp-admin/includes/file.php:809`). O inventario:
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `current_user_can( 'upload_files' )` e `current_user_can( 'edit_post', $id )` | `plataforma/autorizacao/` | {@link ContextoDeEnvio.base} e {@link ContextoDeEnvio.ator} — **import**, nao porta: a regra de dependencia 1 permite `contextos/` para `plataforma/` |
 * | `get_post( $post_id )` e `wp_insert_attachment()` | BC-01, conteudo | {@link ConteudoNaMidia} |
 * | `current_time( 'mysql' )` | `plataforma/`, e no legado e relogio do processo | {@link RelogioNoEnvio} |
 * | `get_option( 'uploads_use_yearmonth_folders' )` | a feature que declara a tabela de opcoes | {@link ContextoDeEnvio.organizarPorAnoEMes}, via `area-de-envios.ts` |
 * | `sanitize_file_name()`, `remove_accents()`, `sanitize_text_field()`, `esc_html()` | `wp-includes/formatting.php` — plataforma, feature 015 | {@link TextoNoEnvio} e {@link ContextoDeEnvio.escaparHtml} |
 * | `wp_get_image_mime()` e `finfo_file()` | borda de deteccao | {@link DeteccaoDeTipoReal} |
 * | `wp_read_image_metadata()` e `wp_read_audio_metadata()` | borda de leitura de metadado embutido | {@link MetadadoDeArquivoNoEnvio} |
 *
 * **A porta de sistema de arquivos tambem chega por aqui**, e nao pela
 * composicao do modulo, pela mesma razao que `ArmazenamentoNaPublicacao` chega
 * pelo contexto em BC-01: a operacao e funcao pura de (contexto, pedido), e e
 * assim que o cenario `@composicao` de `PT-014` substitui a porta *"por duplo
 * que registra cada operacao"* sem tocar arquivo nenhum deste modulo.
 *
 * ---
 *
 * # Tres coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **A porta de processamento de imagem.** Nenhum passo de US-1 abre imagem: a
 *    deteccao de tipo le bytes e nao carrega a imagem, e a geracao de derivadas
 *    e o ponto onde `media_handle_upload()` termina — `wp_generate_attachment_metadata()`
 *    (`wp-admin/includes/media.php:444`), que e **T007**. Pedir a porta aqui
 *    convidaria a gerar derivada dentro do envio, e a ordem dos dois e
 *    observavel: o anexo **existe** antes de qualquer derivada, e e por isso que
 *    a falha silenciosa de `M4` deixa anexo criado com metadado incompleto.
 * 2. **O nonce.** `check_admin_referer( 'media-form' )` e o passo 3 de UC-12 e e
 *    um dos cinco atestados do P4, com prazo de 12 a 24 horas. Ele e de BC-05
 *    (feature 001) e e verificado pela **superficie**, antes de a operacao
 *    comecar — ver `permissao-de-envio.ts`.
 * 3. **O cabecalho `X-WP-Upload-Attachment-ID`** (`media.php:437`). E resposta
 *    HTTP, e o comentario do legado diz para que serve: *"Used by the
 *    browser/client to resume creating image sub-sizes after a PHP fatal
 *    error"*. Nao ha porta de HTTP neste modulo (ver `README.md`), e o cabecalho
 *    e da borda que responde. Fica **nomeado** no fluxo, no lugar exato.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type {
  PedidoDeAnexo,
  RepositorioDeMetadadoDeAnexo,
} from '../armazenamento/index.js';
import type { PortaDeSistemaDeArquivos } from '../portas/index.js';
import type { ListaDeTiposDeArquivo } from './tipos-de-arquivo-permitidos.js';
import type { TextoNoEnvio } from './nome-de-arquivo-unico.js';
import type { RegistroDeEnvioSemFiltro } from './registro-de-envio-sem-filtro.js';
import type { DeteccaoDeTipoReal } from './tipo-real-do-arquivo.js';
import type { SuperficieDeEnvio } from './permissao-de-envio.js';

/**
 * O que o envio le e grava do armazenamento de T002.
 *
 * **So `postmeta`, e so uma chave.** O envio emite exatamente uma escrita de
 * metadado por conta propria — `_wp_attachment_image_alt`, e **so quando ha
 * texto** (`wp-admin/includes/media.php:431`, dentro de `if ( trim( $alt ) )`).
 * As outras duas chaves do caminho, `_wp_attached_file` e
 * `_wp_attachment_context`, sao gravadas **dentro** de `wp_insert_post()`
 * (`wp-includes/post.php:5126` e `:5130`), que e BC-01: elas viajam como campos
 * do pedido, em {@link PedidoDeAnexo.arquivo} e {@link PedidoDeAnexo.contexto}.
 *
 * ⚠️ Gravar `_wp_attached_file` daqui emitiria uma escrita a mais do que o
 * legado emite — e a area 3 da Decisao 2 compara *"snapshot + sequencia de
 * comandos"*.
 */
export interface ArmazenamentoNoEnvio {
  readonly metadadoDeAnexo: RepositorioDeMetadadoDeAnexo;
}

/** O que o envio le do conteudo de destino (`get_post( $post_id )`). */
export interface DestinoDoEnvio {
  /**
   * `$post->post_type`.
   *
   * ⚠️ E comparado com `'page'` por **nome**, e e a unica comparacao por nome de
   * tipo deste caminho: o comentario do legado explica por que —
   * *"The post date doesn't usually matter for pages, so don't backdate this
   * upload"* (`wp-admin/includes/media.php:300`). Nao e slot de registro de
   * tipo e nao e capacidade: e o nome cru.
   */
  readonly tipo: string;
  /** `$post->post_date` — texto no formato do banco. */
  readonly data: string;
}

/** O que `wp_insert_attachment()` devolve, com `$wp_error = true` (`:6778`). */
export type ResultadoDaInsercaoDeAnexo =
  | { readonly inserido: true; readonly anexoId: number }
  | {
      readonly inserido: false;
      readonly codigo: string;
      readonly mensagem: string;
    };

/**
 * As duas chamadas que o envio faz a BC-01, declaradas aqui e implementadas la.
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 *
 * ⚠️ **E esta a ligacao que T002 deixou nomeada para esta tarefa.** O
 * `README.md` deste modulo registra a razao por extenso: *"o anexo nao tem
 * tabela, e nao ha `inserir` neste armazenamento ... o unico caminho de escrita
 * da linha no legado e `wp_insert_attachment()` → `wp_insert_post()`, que e de
 * BC-01 e leva com ele quatro pontos de extensao, a reescrita de `P2`, a
 * unicidade do identificador na URL e a gravacao do `guid`. Um `inserir` nascido
 * aqui emitiria um comando que o legado nao emite"*.
 */
export interface ConteudoNaMidia {
  /**
   * `get_post( $post_id )` (`wp-admin/includes/media.php:298`).
   *
   * Devolve `null` para o `0` e para identificador inexistente, que e o `false`
   * do legado. O envio le **dois** campos e nada mais — ver
   * {@link DestinoDoEnvio}.
   */
  obterDestino(conteudoId: number): DestinoDoEnvio | null;

  /**
   * `wp_insert_attachment( $attachment, $file, $post_id, true )`
   * (`wp-admin/includes/media.php:426`).
   *
   * O quarto argumento do legado e `true`, logo a falha volta como erro com
   * codigo e texto — e nao como `0`. O quinto (`$fire_after_hooks`) fica no
   * default `true`, e os pontos de extensao que ele dispara sao de BC-01.
   *
   * **Nao recebe o estado do anexo**, e isso e `P2`: o pedido do legado nao
   * traz `post_status`, e `wp_insert_post()` o resolve para `inherit`
   * (`wp-includes/post.php:4704`-`:4707`). A reescrita e de **T005** (US-2)
   * pelo lado desta feature e ja existe pelo lado de BC-01, em
   * `contextos/conteudo/gravacao/estado-na-gravacao.ts`.
   */
  inserirAnexo(pedido: PedidoDeAnexo): ResultadoDaInsercaoDeAnexo;
}

/**
 * `current_time( 'mysql' )` (`wp-admin/includes/media.php:297`).
 *
 * **E a unica leitura de tempo do envio**, e ela nao e carimbo: e o valor de
 * onde sai a **subpasta de ano e mes** da area de envios. O `README.md` deste
 * modulo registra que BC-04 nao tinha porta de relogio e por que — *"esta
 * feature nao tem prazo nenhum: os numeros dela sao medida em pixel"* — e
 * tambem registra a saida: *"quando alguma tarefa precisar de instante, ela
 * declara a porta"*. Esta e a tarefa, e o instante nao vira prazo nenhum.
 *
 * Nao e porta do modulo porque nao e uma das 5 bordas de AD-08 e porque e
 * consumida por uma operacao so; chega por argumento, como as demais
 * colaboracoes.
 */
export interface RelogioNoEnvio {
  /**
   * O instante corrente no formato do banco (`AAAA-MM-DD HH:MM:SS`), no fuso do
   * site.
   *
   * ⚠️ `current_time( 'mysql' )` e **hora local do site**, nao GMT: ela soma o
   * desvio da opcao `gmt_offset` (`wp-includes/functions.php`,
   * `current_time()`). A diferenca e observavel na virada do mes, porque e ela
   * que escolhe a pasta.
   */
  agoraNoFormatoDoBanco(): string;
}

/** O que `wp_read_image_metadata()` devolve, no recorte que o envio le. */
export interface MetadadoDeImagemLido {
  /** `$image_meta['title']` — o titulo EXIF/IPTC. */
  readonly titulo: string;
  /** `$image_meta['caption']` — a legenda EXIF/IPTC. */
  readonly legenda: string;
  /** `$image_meta['alt']` — o texto alternativo IPTC. */
  readonly textoAlternativo: string;
}

/** O que `wp_read_audio_metadata()` devolve, no recorte que o envio le. */
export interface MetadadoDeAudioLido {
  readonly titulo: string;
  readonly album: string;
  readonly artista: string;
  /** `$meta['year']` — numerico no legado, texto aqui: ele so e interpolado. */
  readonly ano: string;
  /** `$meta['track_number']` — no formato `N` ou `N/Total`. */
  readonly numeroDaFaixa: string;
  readonly genero: string;
}

/**
 * As duas leituras de metadado embutido no arquivo
 * (`wp-admin/includes/media.php:322` e `:392`).
 *
 * As duas sao borda — ID3 e EXIF/IPTC — e as duas devolvem `null` onde o legado
 * devolve `false`/arranjo vazio. Nao sao porta por causa de AD-08, pela mesma
 * razao de {@link DeteccaoDeTipoReal}: uma implementacao, uma operacao.
 *
 * ⚠️ **Sao opcionais no contexto**, e a omissao e um estado do legado: sem
 * `exif`/`iptc` o `wp_read_image_metadata()` devolve `false` e o envio segue com
 * o titulo derivado do nome do arquivo. Quem omitir a colaboracao obtem
 * exatamente esse comportamento.
 */
export interface MetadadoDeArquivoNoEnvio {
  lerMetadadoDeImagem?: (caminho: string) => MetadadoDeImagemLido | null;
  lerMetadadoDeAudio?: (caminho: string) => MetadadoDeAudioLido | null;
  /**
   * A composicao da descricao de audio (`wp-admin/includes/media.php:327` a
   * `:389`).
   *
   * 🔴 **NAO esta portada nesta pasta, e a razao e a mesma de `remove_accents()`
   * em `nome-de-arquivo-unico.ts`:** sao **dez** cadeias traduziveis com
   * `__()`, um `sprintf` por ramo e duas chamadas a `number_format_i18n()`, e
   * `plataforma/traducao/` nao existe nesta arvore — a feature 015 a constroi, e
   * `EC-05` fixa que *"o `msgid` em ingles E a chave do catalogo"*, logo
   * transcrever os dez textos aqui criaria uma segunda copia da chave.
   *
   * Chega injetada para que o comportamento seja **alcancavel** sem este modulo
   * inventar catalogo. **Omitida, a descricao do anexo de audio fica vazia** —
   * que e divergencia do legado e esta declarada como tal em `../README.md`,
   * nao escondida.
   */
  descricaoDeAudio?: (
    metadado: MetadadoDeAudioLido,
    titulo: string,
  ) => string;
}

/**
 * Os campos que a superficie pode informar por cima dos derivados do arquivo —
 * o `$post_data` de `media_handle_upload()` (`wp-admin/includes/media.php:421`).
 *
 * ⚠️ **No legado isto e um arranjo aberto, e aqui e uma forma fechada.** A
 * diferenca e deliberada e tem duas razoes:
 *
 * 1. no legado o arranjo chega **ja filtrado** pela lista de campos permitidos
 *    de BC-01 — `_wp_get_allowed_postdata( _wp_translate_postdata( ... ) )`
 *    (`wp-admin/includes/ajax-actions.php:2651`) —, logo o conjunto nao e
 *    arbitrario na pratica;
 * 2. a linha seguinte do legado e `unset( $attachment['ID'] )`, com o
 *    comentario *"This should never be set as it would then overwrite an
 *    existing attachment"* (`:429`). Numa forma aberta, `ID` seria
 *    representavel e a remocao teria de ser codigo; numa forma fechada ele
 *    **nao existe**, e a garantia passa a ser do tipo.
 *
 * O que um `$post_data` do legado pode trazer e esta forma nao representa sao
 * colunas que esta tarefa nao precisa (datas, estado de comentario, autoria
 * explicita). Quem precisar delas acrescenta o campo aqui — e **nao** por um
 * mapa aberto, que devolveria o `ID`.
 */
export interface DadosDoAnexoInformados {
  readonly titulo?: string;
  readonly descricao?: string;
  readonly legenda?: string;
  /**
   * `context` — de que tela o anexo nasceu, que vira `_wp_attachment_context`.
   *
   * E por ele que a personalizacao marca o anexo de fundo e de cabecalho
   * (`ajax-actions.php:2692`), e e o unico campo desta forma que **nao** e
   * coluna.
   */
  readonly contexto?: string;
}

/** O arquivo como a borda o entrega — um elemento de `$_FILES`. */
export interface ArquivoRecebido {
  /**
   * `$_FILES[ $file_id ]['name']` — o nome informado pelo cliente.
   *
   * ⚠️ **Pode ser reescrito durante o envio.** `_wp_handle_upload()` recebe o
   * elemento **por referencia** e troca este campo pelo nome corrigido quando o
   * tipo real da imagem diverge da extensao (`wp-admin/includes/file.php:964`,
   * `$file['name'] = $proper_filename`), e `media_handle_upload()` le o campo
   * **depois** (`wp-admin/includes/media.php:313`). E dessa reescrita que sai o
   * **titulo** do anexo. Aqui nao ha referencia: o fluxo carrega o nome
   * corrigido adiante, e `enviar-arquivo.ts` diz onde.
   */
  readonly nome: string;
  /**
   * `$_FILES[ $file_id ]['type']` — o tipo que o **navegador** afirmou.
   *
   * Nao e o tipo real e nao decide nada em CA-1.2. Ele e usado em **um** lugar:
   * quando a validacao de tipo esta desligada por `overrides`, o legado cai
   * nele (`wp-admin/includes/file.php:975`, `if ( ! $type ) { $type = $file['type']; }`).
   * No caminho do envio de midia a validacao esta **ligada**, logo este campo
   * nao chega ao registro — mas ele existe no contrato da borda.
   */
  readonly tipoInformado: string;
  /** `$_FILES[ $file_id ]['tmp_name']` — caminho absoluto do arquivo recebido. */
  readonly caminhoTemporario: string;
  /** `$_FILES[ $file_id ]['size']` — bytes, como o runtime os contou. */
  readonly bytes: number;
  /**
   * `$_FILES[ $file_id ]['error']` — o codigo de erro de envio do PHP, `0` quando
   * nao houve.
   *
   * Os textos de cada codigo sao de `_wp_handle_upload()`
   * (`wp-admin/includes/file.php:891`) e estao em `enviar-arquivo.ts`.
   */
  readonly erro: number;
  /**
   * `is_uploaded_file( $file['tmp_name'] )`
   * (`wp-admin/includes/file.php:928`).
   *
   * Chega **decidido** porque a pergunta e sobre a procedencia do arquivo nesta
   * requisicao, e so a borda que recebeu o pedido sabe responde-la. O legado usa
   * `is_uploaded_file()` para `wp_handle_upload` e `@is_readable()` para
   * `wp_handle_sideload`; este caminho e o primeiro — a carga lateral nao e
   * de US-1.
   */
  readonly recebidoNaRequisicao: boolean;
}

/** O pedido de envio. */
export interface PedidoDeEnvio {
  /**
   * De onde o envio veio. Decide a **consequencia** da segunda verificacao de
   * capacidade — ver `permissao-de-envio.ts`, que e onde isso esta explicado.
   */
  readonly superficie: SuperficieDeEnvio;
  /**
   * `$post_id` — o conteudo de destino, ou `0` quando nao ha
   * (`SEM_CONTEUDO_DE_DESTINO`, de `armazenamento/anexo.ts`).
   */
  readonly conteudoDeDestino: number;
  readonly arquivo: ArquivoRecebido;
  /** O `$post_data` da superficie. Ausente e o default `array()` do legado. */
  readonly dadosDoAnexo?: DadosDoAnexoInformados;
}

/**
 * O contexto do envio.
 *
 * Chega por **argumento**, e nao pela composicao, pela razao do cabecalho deste
 * arquivo.
 */
export interface ContextoDeEnvio {
  /** A base da decisao de capacidade: matriz, rede, constantes, traducoes. */
  readonly base: BaseDeAutorizacao;
  /** Quem esta enviando. */
  readonly ator: AtorDeAutorizacao;
  /** A borda do disco (porta de T001). */
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  /** A forma de armazenamento de T002, no recorte que o envio usa. */
  readonly armazenamento: ArmazenamentoNoEnvio;
  /** As duas chamadas a BC-01 (ligacao tardia, AD-10). */
  readonly conteudo: ConteudoNaMidia;
  /** `current_time( 'mysql' )`. */
  readonly relogio: RelogioNoEnvio;
  /** As quatro funcoes de formatacao da plataforma (feature 015). */
  readonly texto: TextoNoEnvio;
  /** `esc_html()` — ver `area-de-envios.ts`. */
  readonly escaparHtml: (texto: string) => string;
  /** As duas deteccoes de tipo real (CA-1.2). */
  readonly deteccao: DeteccaoDeTipoReal;
  /** As leituras de metadado embutido, todas opcionais. */
  readonly metadadoDoArquivo?: MetadadoDeArquivoNoEnvio;
  /**
   * O canal e o instante do registro de **envio sem filtro de tipo** (US-9,
   * T019, **CA-9.4**).
   *
   * ⚠️ **Opcional, e a ausencia e o legado.** O legado nao registra nada em
   * nenhum envio — zero arquivo de log na arvore —, logo omitir esta
   * colaboracao devolve exatamente o comportamento dele: o envio acontece
   * igual, com o mesmo resultado e a mesma sequencia de operacoes de disco, e
   * nenhuma linha e escrita. E o limite que o **P7** poe no acrescimo:
   * *"nenhuma decisao do sistema pode passar a depender"* do registro.
   *
   * Ela so e consultada no **unico** caminho que a usa: um envio em que o tipo
   * nao foi reconhecido e `unfiltered_upload` respondeu sim. Ver
   * `./registro-de-envio-sem-filtro.ts`, que e onde o porque de cada campo
   * esta escrito.
   */
  readonly registroDeEnvioSemFiltro?: RegistroDeEnvioSemFiltro;
  /** `$uploads['baseurl']` — ver `area-de-envios.ts`. */
  readonly enderecoBaseDeEnvios: string;
  /** `ABSPATH` — ver `area-de-envios.ts`. */
  readonly raizDaInstalacao: string;
  /** `get_option( 'uploads_use_yearmonth_folders' )` — semeada em `1`. */
  readonly organizarPorAnoEMes: boolean;
  /**
   * `wp_get_mime_types()` — a lista de fabrica, ou a que o ponto de extensao
   * `mime_types` devolveu.
   *
   * Omitida, valem as 93 entradas de fabrica. Lista **vazia** e um estado
   * alcancavel do legado (um interceptador pode devolver `array()`), e nela
   * nenhum tipo e reconhecido e todo envio e recusado.
   */
  readonly tiposDeArquivo?: ListaDeTiposDeArquivo;
  /**
   * `wp_get_image_editor_output_format()` — o mapa de conversao de formato, para
   * o laco 3 do nome unico.
   *
   * Omitido, vale o de fabrica, que **nao** e vazio desde a versao 6.7: ver
   * `CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA` em `nome-de-arquivo-unico.ts`.
   */
  readonly conversaoDeFormatoDoEditor?: ReadonlyMap<string, string>;
}
