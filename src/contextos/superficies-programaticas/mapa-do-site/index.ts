/**
 * Barril da area do mapa do site — entrega de **T015** (US-7, *"servir o indice
 * de sitemap conforme a opcao de indexacao"*).
 *
 * A entrada e {@link iniciarServidorDoMapaDoSite}, que recebe o contexto da
 * operacao por ligacao tardia e devolve o servidor iniciado conforme
 * `blog_public`. O resto e exportado porque e superficie publicada no legado: o
 * provedor e o registro (`wp_register_sitemap_provider()`), o endereco de cada
 * pagina (`get_sitemap_url()`), os limites e as diretivas de robos.
 */

export {
  ENDERECOS_POR_PAGINA_DO_MAPA,
  OPCAO_DE_INDEXACAO,
  PAGINAS_DO_MAPA_NO_INDICE,
  indexacaoLigada,
  type ValorDeOpcao,
} from './pontos-de-configuracao.js';
export type {
  ConsultaDeContas,
  ConsultaDeTermos,
  ConsultaPublicaDeConteudo,
  ContagemDeTermos,
  ConteudoNoMapaDoSite,
  ContextoDoMapaDoSite,
  CriteriosDaConsultaDeContas,
  CriteriosDaConsultaDeConteudo,
  CriteriosDaConsultaDeTermos,
  DataW3cDoSite,
  EnderecoDoAutor,
  EnderecoDoConteudo,
  EnderecoDoPainel,
  EnderecoDoTermo,
  EnderecoInicial,
  ErroDeEnderecoDeTermo,
  OpcoesDoMapaDoSite,
  ResultadoDaConsultaDeContas,
  ResultadoDaConsultaDeConteudo,
  TiposNoMapaDoSite,
} from './contexto-do-mapa-do-site.js';
export {
  criarRegistroDeProvedores,
  dadosDosSubtipos,
  enderecoDaPaginaDoMapa,
  enderecoDoIndice,
  entradasDoProvedorNoIndice,
  listaDoIndice,
  type DadosDoSubtipo,
  type EnderecosDoMapaDoSite,
  type EntradaDoMapaDoSite,
  type ProvedorDoMapaDoSite,
  type RegistroDeProvedores,
} from './provedor-do-mapa-do-site.js';
export {
  CRITERIOS_DO_CONTEUDO_MAIS_RECENTE,
  criarProvedorDeContas,
  criarProvedorDeConteudo,
  criarProvedorDeTaxonomias,
  criteriosDaConsultaDeTermos,
  criteriosDaPaginaDeConteudo,
} from './provedores-do-nucleo.js';
export {
  CAMPOS_DA_PAGINA,
  CAMPOS_DO_INDICE,
  ESPACO_DE_NOME_DO_MAPA_DO_SITE,
  TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE,
  escaparTextoXml,
  xmlDaPagina,
  xmlDoIndice,
} from './xml-do-mapa-do-site.js';
export {
  TIPO_DE_CONTEUDO_DO_ROBOTS_TXT,
  acrescentarLinhaDoIndice,
  conteudoDaMetaDeRobos,
  corpoDoRobotsTxt,
  diretivasDeRobosDoNucleo,
  previaDeImagemGrande,
  semIndexacaoQuandoPrivado,
  semRobos,
  type DiretivasDeRobos,
  type PaginaNasDiretivasDeRobos,
} from './instrucoes-para-rastreadores.js';
export {
  CABECALHOS_DE_NAO_GUARDAR,
  ETIQUETAS_DE_REESCRITA_DO_MAPA_DO_SITE,
  REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE,
  absintComoNoPhp,
  iniciarServidorDoMapaDoSite,
  type PedidoDoMapaDoSite,
  type RespostaDoMapaDoSite,
  type RobotsTxt,
  type ServidorDoMapaDoSite,
} from './servidor-do-mapa-do-site.js';
