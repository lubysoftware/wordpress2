/**
 * Barril da area de componentes de area.
 *
 * T001 entregou a fabrica da area; **T015** (US-7) acrescentou organizar os
 * componentes:
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-dos-componentes.ts` | a requisicao, as opcoes de T002 e o registro do arranque: areas, componentes e tipos |
 * | `permissao-dos-componentes.ts` | **CA-7.1**: o portao da tela, os tokens e a permissao declarada das tres superficies |
 * | `arranjo-do-php.ts` | as regras de chave do arranjo do PHP que aparecem no valor gravado |
 * | `mapa-de-areas.ts` | **CA-7.2**: `sidebars_widgets` — ler, gravar, achar e atribuir |
 * | `configuracao-do-componente.ts` | **CA-7.2**: `widget_{id_base}` — ler, gravar e o `update_callback()` |
 * | `organizar-pela-tela.ts` | **CA-7.3**, **CA-7.4**: o formulario sem JavaScript e os dois Ajax da tela |
 * | `organizar-pela-api.ts` | **CA-7.3**: os controladores de areas e de componentes |
 * | `organizar-pela-personalizacao.ts` | **CA-7.3**: as configuracoes de componente do Customizer e a gravacao delas |
 *
 * A preservacao na troca de tema entra em T019 (US-9).
 */

export {
  criarAreaDeComponentesDeArea,
  type OperacoesDosComponentes,
} from './area-de-componentes-de-area.js';

export type {
  AreaRegistrada,
  ComponenteRegistrado,
  ContextoDosComponentes,
  FormularioDoComponente,
  TipoDeComponente,
} from './contexto-dos-componentes.js';

export {
  CAPACIDADE_DOS_COMPONENTES,
  CODIGO_SEM_PERMISSAO_NA_API,
  MENSAGEM_DE_TEMA_SEM_AREAS,
  MENSAGEM_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
  MENSAGEM_SEM_PERMISSAO_NA_API,
  MENSAGEM_SEM_PERMISSAO_NOS_COMPONENTES,
  PERMISSOES_DOS_COMPONENTES,
  TITULO_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
  TITULO_SEM_PERMISSAO_NOS_COMPONENTES,
  TOKEN_DE_LIMPAR_INATIVOS_PELA_TELA,
  TOKEN_DE_LIMPAR_INATIVOS_PELO_AJAX,
  TOKEN_DE_ORDENAR_PELO_AJAX,
  conferirTokenDaTela,
  permissaoDaApiDeComponentes,
  podeAdministrarComponentes,
  portaoDaTelaDeComponentes,
  portaoDoAjaxDeComponentes,
  tokenDeGravarComponente,
  type ErroDaApiDeComponentes,
  type RecusaDaTelaDeComponentes,
  type RespostaDoAjaxDeComponentes,
  type TokenDosComponentes,
} from './permissao-dos-componentes.js';

export {
  AREA_DE_INATIVOS,
  CHAVE_DA_VERSAO_DO_MAPA,
  NOME_DA_AREA_DE_INATIVOS,
  OPCAO_DO_MAPA_DE_AREAS,
  VERSAO_DO_MAPA,
  areaDoComponente,
  areaRegistrada,
  atribuirComponenteAArea,
  decomporIdDoComponente,
  gravarMapaDeAreas,
  idBaseDoComponente,
  lerMapaDeAreas,
  mapaPadrao,
  type IdDoComponenteDecomposto,
} from './mapa-de-areas.js';

export {
  CHAVE_DE_VARIAS_INSTANCIAS,
  CHAVE_DO_MODELO_DE_INSTANCIA,
  PONTOS_DE_EXTENSAO_DA_CONFIGURACAO,
  PREFIXO_DA_OPCAO_DO_COMPONENTE,
  atualizarConfiguracao,
  gravarConfiguracoes,
  lerConfiguracoes,
  opcaoDoComponente,
  type DesfechoDaAtualizacao,
} from './configuracao-do-componente.js';

export {
  ENDERECO_DA_TELA_DE_COMPONENTES,
  ENDERECO_DE_COMPONENTES_GRAVADOS,
  ENDERECO_DE_COMPONENTE_FORA_DA_AREA,
  gravarComponentePelaTela,
  limparInativosPeloAjax,
  limparInativosPelaTela,
  mapaPreparadoPelaTela,
  ordenarPeloAjax,
  type DesfechoDaTelaDeComponentes,
} from './organizar-pela-tela.js';

export {
  MENSAGEM_DE_COMPONENTE_NAO_ENCONTRADO,
  MENSAGEM_DE_INSTANCIA_CRUA_RECUSADA,
  MENSAGEM_DE_INSTANCIA_INVALIDA,
  MENSAGEM_DE_INSTANCIA_MALFORMADA,
  MENSAGEM_DE_TIPO_EXIGIDO,
  MENSAGEM_DE_TIPO_QUE_NAO_GRAVA,
  apagarComponentePelaApi,
  atualizarAreaPelaApi,
  atualizarComponentePelaApi,
  criarComponentePelaApi,
  proximoNumeroDoComponente,
  type InstanciaNoPedido,
  type PedidoDeComponenteNaApi,
  type ResultadoDaAreaNaApi,
  type ResultadoDoComponenteNaApi,
} from './organizar-pela-api.js';

export {
  PADROES_DAS_CONFIGURACOES_DE_COMPONENTE,
  argumentosDaConfiguracaoDeComponente,
  decodificadoDeBase64Estrito,
  gravarConfiguracaoDeComponente,
  idDaConfiguracaoDoComponente,
  sanitizarComponentesDaArea,
  sanitizarInstanciaDoComponente,
  tipoDaConfiguracaoDeComponente,
  valorPhpDoJson,
  type ArgumentosDaConfiguracaoDeComponente,
  type TipoDaConfiguracaoDeComponente,
} from './organizar-pela-personalizacao.js';
