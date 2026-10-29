/**
 * `recuperacao/` — entrar em modo de recuperacao quando um erro fatal derruba
 * a area protegida (US-12).
 *
 * Entrega de **T025** da feature `010-operacao-do-software`, CA-12.1 a
 * CA-12.7.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-da-recuperacao.ts` | o que as operacoes recebem por chamada, inclusive a verificacao da chave (T027) como ligacao tardia |
 * | `endpoint-protegido.ts` | `is_protected_endpoint()` e as nove acoes de Ajax protegidas |
 * | `extensao-do-erro.ts` | quais erros contam, de quem e a culpa, e como o erro e descrito e gravado |
 * | `cookie-de-recuperacao.ts` | o cookie assinado da sessao, com a semana de `A10` |
 * | `extensoes-pausadas.ts` | a pausa **por sessao**, a retomada de todas e a lista do que carrega |
 * | `aviso-de-recuperacao.ts` | a chave, o endereco e o e-mail, com o marcador gravado antes do envio |
 * | `modo-de-recuperacao.ts` | `initialize()`, `handle_error()`, `exit_recovery_mode()` e a tela de saida |
 * | `tratador-de-erro-fatal.ts` | `WP_Fatal_Error_Handler::handle()` e a tela de erro como dado |
 * | `permissao-da-recuperacao.ts` | a declaracao de cada operacao e os dois `case` de retomar |
 * | `area-de-recuperacao.ts` | a composicao sobre a sessao de T002 e a porta de e-mail |
 */

export type {
  AgendamentoNaRecuperacao,
  ArgumentosDaMorte,
  AvisoDeRecuperacao,
  ConstantesDaRecuperacao,
  ContextoDaRecuperacao,
  DadosDoPlugin,
  ErroDaRecuperacao,
  ErroFatal,
  EstadoDaRecuperacao,
  ExtensaoResponsavel,
  ExtensoesNaRecuperacao,
  FormatacaoNaRecuperacao,
  GanchosDaRecuperacao,
  IdiomaNaRecuperacao,
  InstalacaoNaRecuperacao,
  InstrucaoDeCookie,
  PedidoNaRecuperacao,
  RespostaDaRecuperacao,
  SiteNaRecuperacao,
} from './contexto-da-recuperacao.js';
export { RECUPERACAO_NAO_INICIALIZADA } from './contexto-da-recuperacao.js';

export {
  ACOES_AJAX_PROTEGIDAS,
  PAGINA_DE_ENTRADA,
  acaoAjaxProtegida,
  endpointProtegido,
} from './endpoint-protegido.js';

export {
  MODELO_DA_DESCRICAO_DO_ERRO,
  NIVEIS_DE_ERRO_TRATADOS,
  NOMES_DOS_NIVEIS_DE_ERRO,
  descricaoDoErro,
  deveTratarErro,
  extensaoDoErro,
  normalizarCaminho,
  pluginDeRede,
  registroDoErro,
} from './extensao-do-erro.js';

export {
  FRASE_PADRAO_DE_CHAVE,
  MENSAGEM_DE_COOKIE_INVALIDO,
  MENSAGEM_DE_COOKIE_VENCIDO,
  MENSAGEM_DE_FORMATO_INVALIDO,
  MENSAGEM_SEM_COOKIE,
  SEGUNDOS_POR_ANO,
  VALOR_DO_COOKIE_APAGADO,
  apagarCookie,
  cookieDefinido,
  gravarCookie,
  prazoDoCookie,
  sessaoDoCookie,
  validarCookie,
} from './cookie-de-recuperacao.js';

export {
  extensoesPausadasDoTipo,
  pausarExtensao,
  pluginsQueCarregam,
  retomarTodasDoTipo,
  temasQueCarregam,
  type ListaSemPausadas,
} from './extensoes-pausadas.js';

export {
  ACAO_DE_ENTRAR_NA_RECUPERACAO,
  ACAO_DE_RECUPERACAO_INICIADA,
  ASSUNTO_DO_AVISO_DE_RECUPERACAO,
  CABECALHO_DOS_DETALHES_DO_ERRO,
  MENSAGEM_DE_ENVIO_QUE_FALHOU,
  MENSAGEM_DE_MARCADOR_NAO_GRAVADO,
  MODELO_DA_CAUSA_EM_PLUGIN,
  MODELO_DA_CAUSA_EM_TEMA,
  MODELO_DE_AVISO_JA_ENVIADO,
  MODELO_DO_AVISO_DE_RECUPERACAO,
  SUPORTE_DO_AVISO_DE_RECUPERACAO,
  gerarEnderecoDeRecuperacao,
  talvezAvisar,
} from './aviso-de-recuperacao.js';

export {
  MENSAGEM_DE_ENDPOINT_NAO_PROTEGIDO,
  MENSAGEM_DE_ERRO_NAO_GUARDADO,
  MENSAGEM_DE_LINK_DE_SAIDA_VENCIDO,
  MENSAGEM_DE_ORIGEM_INVALIDA,
  MENSAGEM_DE_SAIDA_QUE_FALHOU,
  RECORRENCIA_DA_LIMPEZA_DE_CHAVES,
  atenderSaidaDaRecuperacao,
  inicializarRecuperacao,
  limiteEntreAvisos,
  prazoDoLink,
  sairDaRecuperacao,
  tratadorLigado,
  tratarErroNaRecuperacao,
  type DesfechoDoErroNaRecuperacao,
  type InicializacaoDaRecuperacao,
  type SaidaDaRecuperacao,
} from './modo-de-recuperacao.js';

export {
  CODIGO_DO_ERRO_INTERNO,
  ENDERECO_DE_SOLUCAO_DE_PROBLEMAS,
  MENSAGEM_DE_ERRO_COM_AVISO,
  MENSAGEM_DE_ERRO_CRITICO,
  MENSAGEM_DE_ERRO_EM_RECUPERACAO,
  MENSAGEM_DE_ERRO_EM_REDE,
  ROTULO_DE_SOLUCAO_DE_PROBLEMAS,
  tratadorRegistrado,
  tratarErroFatal,
  type DesfechoDoErroFatal,
} from './tratador-de-erro-fatal.js';

export {
  CAPACIDADE_DE_RETOMAR_PLUGIN,
  CAPACIDADE_DE_RETOMAR_PLUGINS,
  CAPACIDADE_DE_RETOMAR_TEMA,
  CAPACIDADE_DE_RETOMAR_TEMAS,
  PERMISSOES_DA_RECUPERACAO,
  casoDaRecuperacao,
  perguntarNaRecuperacao,
  type OperacaoDaRecuperacao,
  type PermissaoDaRecuperacao,
} from './permissao-da-recuperacao.js';

export { criarAreaDeRecuperacao, type AreaDeRecuperacao } from './area-de-recuperacao.js';
