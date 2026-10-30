/**
 * Barril da area de feed — entrega de **T017** (US-8, *"servir feeds de
 * conteudo e de comentarios a partir da mesma consulta publica"*).
 *
 * A entrada e {@link iniciarServidorDeFeed}, que recebe o contexto da requisicao
 * por ligacao tardia e devolve o servidor com os quatro tratadores do nucleo. O
 * resto e exportado porque e superficie publicada no legado: o formato padrao
 * (`get_default_feed()`), o tipo de conteudo (`feed_content_type()`), o registro
 * (`add_feed()`), os seis modelos e as funcoes de `feed.php` que sao forma.
 */

export {
  BASE_DE_ATUALIZACAO_DO_RDF,
  FORMATO_DE_FEED_PADRAO,
  FORMATOS_DE_FEED_DO_NUCLEO,
  FREQUENCIA_DE_ATUALIZACAO_DO_FEED,
  OPCOES_DE_FABRICA_DO_FEED,
  PERIODO_DE_ATUALIZACAO_DO_FEED,
  TIPO_DE_CONTEUDO_DESCONHECIDO,
  TIPOS_DE_CONTEUDO_DO_FEED,
  usarSoResumo,
  type FormatoDeFeedDoNucleo,
  type ValorDeOpcaoDoFeed,
} from './pontos-de-configuracao.js';
export type {
  AnexoNoFeed,
  ComentarioNoFeed,
  ComentarioRespondidoNoFeed,
  ConsultaNoFeed,
  ConteudoNoFeed,
  ContextoDoFeed,
  DatasDoFeed,
  FormatacaoNoFeed,
  OpcoesDoFeed,
  SiteNoFeed,
  TiposNoFeed,
  TraducaoNoFeed,
} from './contexto-do-feed.js';
export {
  DATA_ZERADA,
  FORMATO_DE_DATA_ATOM,
  FORMATO_DE_DATA_DO_CABECALHO,
  FORMATO_DE_DATA_RSS,
  formatarDataDaColuna,
  formatarDataDoConteudo,
} from './datas-do-feed.js';
export {
  anexosNoAtom,
  anexosNoRss2,
  dataDeConstrucaoDoFeed,
  formatarComoPrintf,
  geradorDoFeed,
  listaDeCategoriasDoFeed,
  modeloAtom,
  modeloAtomDeComentarios,
  modeloRdf,
  modeloRss,
  modeloRss2,
  modeloRss2DeComentarios,
  type CabecalhoComGerador,
  type DocumentoDoFeed,
} from './modelos-do-feed.js';
export {
  cabecalhosDoRamoDeFeed,
  entraNoRamoDeFeed,
  type CabecalhosDoRamoDeFeed,
  type PedidoCondicional,
  type VariaveisDoPedidoDeFeed,
} from './cabecalhos-do-feed.js';
export {
  CHARSET_DO_ERRO_EM_XML,
  MENSAGEM_DE_FEED_INVALIDO,
  TITULO_DO_ERRO,
  corpoDoErroEmXml,
  criarRegistroDeFeeds,
  formatoDeFeedPadrao,
  formatoPedidoNoDespacho,
  iniciarServidorDeFeed,
  tipoDeConteudoDoFeed,
  type CabecalhosDaRespostaDeFeed,
  type PedidoDeFeed,
  type RegistroDeFeeds,
  type RespostaDeFeed,
  type ServidorDeFeed,
  type TratadorDeFeed,
} from './servidor-do-feed.js';
