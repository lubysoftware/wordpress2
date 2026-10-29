/**
 * Barril da area de personalizacao.
 *
 * T001 entregou a fabrica da area; **T003** (US-1) acrescentou a
 * pre-visualizacao:
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-da-personalizacao.ts` | o pedido e as ligacoes tardias que as operacoes recebem |
 * | `permissao-da-personalizacao.ts` | **CA-1.4**: o caso `customize` → `edit_theme_options` e a permissao declarada de cada operacao |
 * | `abrir-a-personalizacao.ts` | **CA-1.1** e retomar de **CA-1.3**: o portao e o identificador, sem gravar |
 * | `valores-da-previa.ts` | **CA-1.2**: o estado personalizado de quem pre-visualiza, e nada para o visitante |
 * | `gravar-o-conjunto.ts` | **CA-1.3**, **CA-1.4**, **CA-1.6**: as guardas do pedido e a gravacao sem aplicar |
 * | `anexo-na-personalizacao.ts` | **CA-1.5**: o anexo que nasce rascunho automatico |
 *
 * T005 (US-2), T007 (US-3) e T009 (US-4) acrescentam as suas aqui.
 */

export {
  criarAreaDePersonalizacao,
  type OperacoesDaPersonalizacao,
} from './area-de-personalizacao.js';

export {
  campoDoPedido,
  vazioNoPhp,
  type AgoraNaPersonalizacao,
  type ConfiguracaoDaPersonalizacao,
  type ConjuntosNaPersonalizacao,
  type ContextoDaPersonalizacao,
  type ErroDaConfiguracao,
  type PedidoDaPersonalizacao,
  type ResultadoDaGravacaoDoConjunto,
  type SanitizacaoDaConfiguracao,
  type ValidadeDaConfiguracao,
} from './contexto-da-personalizacao.js';

export {
  CAPACIDADE_DE_ADMINISTRAR_A_APARENCIA,
  CAPACIDADE_DE_PERSONALIZAR,
  PERMISSOES_DA_PERSONALIZACAO,
  casoDaPersonalizacao,
  perguntarNaPersonalizacao,
} from './permissao-da-personalizacao.js';

export {
  ESTADOS_QUE_NAO_SE_RETOMAM,
  MENSAGEM_DE_IDENTIFICADOR_INEXISTENTE,
  MENSAGEM_DE_IDENTIFICADOR_INVALIDO,
  MENSAGEM_SEM_PERMISSAO_DE_EDITAR_O_CONJUNTO,
  MENSAGEM_SEM_PERMISSAO_DE_PERSONALIZAR,
  TITULO_SEM_PERMISSAO,
  abrirPersonalizacao,
  deveCarregarAPersonalizacao,
  estabelecerIdentificador,
  identificadorDoPedido,
  type AberturaDaPersonalizacao,
  type RecusaDaAbertura,
  type ResultadoDaAbertura,
} from './abrir-a-personalizacao.js';

export {
  acaoDoNonceDeGravacao,
  acaoDoNonceDePrevia,
  aceitaValoresEnviados,
  dadosDoConjuntoCarregado,
  pedirPrevia,
  valorNaPrevia,
  valoresEnviados,
  valoresNaoSanitizados,
  type EntradaDosValoresPersonalizados,
  type ResultadoDaPrevia,
  type ValoresPersonalizados,
} from './valores-da-previa.js';

export {
  ERRO_DE_CONFIGURACAO_DESCONHECIDA,
  ERRO_DE_CONFIGURACAO_SEM_CAPACIDADE,
  ERRO_DE_VALOR_INVALIDO,
  MENSAGEM_DE_CONJUNTO_JA_APLICADO,
  gravarSemAplicar,
  identicoNoPhp,
  mensagemDeFalhaDaTransacao,
  validarPedidoDeGravacao,
  validarValoresDasConfiguracoes,
  type EstadoQueNaoAplica,
  type PedidoDeGravacaoSemAplicar,
  type PedidoDeGravacaoValidado,
  type RecusaDoPedidoDeGravacao,
  type ResultadoDaGravacaoSemAplicar,
  type ResultadoDaValidacaoDaGravacao,
} from './gravar-o-conjunto.js';

export {
  METADADO_DO_NOME_NO_RASCUNHO,
  METADADO_DO_TEMA_DO_CONTEUDO_INICIAL,
  pedidoDoAnexoNaPersonalizacao,
  type AnexoDeConteudoInicial,
  type DadosDoAnexoNaPersonalizacao,
  type PedidoDoAnexoNaPersonalizacao,
} from './anexo-na-personalizacao.js';
