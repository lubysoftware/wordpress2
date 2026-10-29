/**
 * `instalacao/` — instalar e atualizar extensao a partir do catalogo ou de
 * arquivo enviado (US-1).
 *
 * Entrega de **T003** da feature `010-operacao-do-software`, CA-1.1 a CA-1.7.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `permissao-da-instalacao.ts` | os dois `case` de `map_meta_cap()` (modificar arquivo, ativar plugin), a permissao e o token de cada acao |
 * | `contexto-da-instalacao.ts` | o que as operacoes recebem por chamada, inclusive o `run()` do legado como ligacao tardia |
 * | `texto-como-no-php.ts` | `trim()`, `urldecode()`, conversao para texto, verdade do PHP e `add_query_arg()` |
 * | `consulta-ao-catalogo.ts` | `plugins_api()` e `themes_api()` de informacao, com a repeticao em claro da resposta 12 |
 * | `instalador-de-extensao.ts` | `install()`, `upgrade()` e `bulk_upgrade()` de `Plugin_Upgrader` e `Theme_Upgrader` |
 * | `acoes-depois-de-instalar.ts` | `Plugin_Installer_Skin::after()`: se a tela oferece ativar |
 * | `tela-de-atualizacao.ts` | `wp-admin/update.php`, as oito acoes |
 * | `area-de-instalacao.ts` | a composicao sobre a porta de cliente externo |
 */

export {
  CAMPO_DO_TOKEN,
  CAPACIDADES_DE_ATIVACAO,
  CAPACIDADES_DE_MODIFICAR_ARQUIVO,
  CAPACIDADE_DE_ADMINISTRAR_PLUGINS_DA_REDE,
  CAPACIDADE_DE_ATIVAR_PLUGIN,
  CAPACIDADE_DE_ATIVAR_PLUGINS,
  CAPACIDADE_DE_ATUALIZAR_PLUGINS,
  CAPACIDADE_DE_ATUALIZAR_TEMAS,
  CAPACIDADE_DE_ENVIAR_PLUGINS,
  CAPACIDADE_DE_ENVIAR_TEMAS,
  CAPACIDADE_DE_INSTALAR_PLUGINS,
  CAPACIDADE_DE_INSTALAR_TEMAS,
  CONTEXTO_DA_MODIFICACAO_DE_ARQUIVO,
  MENSAGEM_DE_TOKEN_VENCIDO,
  MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_PLUGINS,
  MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_TEMAS,
  MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_PLUGINS,
  MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_TEMAS,
  PERMISSOES_DA_INSTALACAO,
  TITULO_DE_TOKEN_VENCIDO,
  acaoDoToken,
  casoDaInstalacao,
  mensagemSemPermissao,
  modificacaoDeArquivoPermitida,
  perguntarNaInstalacao,
  type AcaoDaTelaDeAtualizacao,
  type LeiturasDaPermissao,
} from './permissao-da-instalacao.js';

export type {
  AcaoDepoisDeInstalar,
  AmbienteDaInstalacao,
  ArgumentosDoCatalogo,
  AtalhoDoCatalogo,
  ConclusaoDaExecucao,
  ContextoDaInstalacao,
  CopiaDeSegurancaDaExecucao,
  ErroDeInstalacao,
  ExecucaoDoPacote,
  ExtraDaExecucao,
  GanchosDaInstalacao,
  OfertaDeAtualizacao,
  OpcoesDaExecucao,
  PacoteEnviado,
  PastasDaInstalacao,
  RecepcaoDoPacoteEnviado,
  RespostaDoCatalogo,
  ResultadoDaExecucao,
  TipoDeExtensao,
  ValorDoCatalogo,
} from './contexto-da-instalacao.js';

export {
  ACAO_DE_INFORMACAO_DE_PLUGIN,
  ACAO_DE_INFORMACAO_DE_TEMA,
  AVISO_DE_CANAL_SEM_CIFRA,
  ENDERECO_DO_CATALOGO_DE_PLUGINS,
  ENDERECO_DO_CATALOGO_DE_TEMAS,
  MENSAGEM_DE_FALHA_DO_CATALOGO,
  TEMPO_LIMITE_DA_CONSULTA_AO_CATALOGO,
  campoDaInformacao,
  consultarInformacaoDoPlugin,
  consultarInformacaoDoTema,
} from './consulta-ao-catalogo.js';

export {
  CODIGO_DE_JA_ATUALIZADO,
  CODIGO_DE_NUCLEO_INCOMPATIVEL,
  CODIGO_DE_PHP_INCOMPATIVEL,
  atualizarEmLote,
  atualizarItem,
  diretorioDoPlugin,
  instalarPacote,
  type SobrescritaDoPacote,
} from './instalador-de-extensao.js';

export {
  acoesDepoisDeInstalarPlugin,
  codificarUrlComoNoPhp,
  type FimDaInstalacaoDePlugin,
  type OrigemDaInstalacao,
} from './acoes-depois-de-instalar.js';

export {
  ACOES_NAO_PORTADAS,
  MENSAGEM_DE_ARQUIVO_QUE_NAO_E_ZIP,
  atenderTelaDeAtualizacao,
  type MotivoDaRecusa,
  type PedidoDaTelaDeAtualizacao,
  type RecusaDaTelaDeAtualizacao,
  type RespostaDaTelaDeAtualizacao,
} from './tela-de-atualizacao.js';

export {
  acrescentarConsultaComoNoPhp,
  apararComoNoPhp,
  decodificarUrlComoNoPhp,
  montarConsultaComoNoPhp,
  textoComoNoPhp,
  verdadeiroNoPhp,
  type ValorDeConsultaDoPhp,
} from './texto-como-no-php.js';

export { criarAreaDeInstalacao, type AreaDeInstalacao } from './area-de-instalacao.js';
