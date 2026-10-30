/**
 * Credencial de integracao — US-3, **T007**: resolver por precedencia
 * declarada (ambiente, constante, banco) e dizer na tela de onde ela veio, sem
 * mostrar o valor. O que fica para T009 (US-4: nunca guardar em texto
 * recuperavel, mascarar na resposta, rotacionar) esta em `../README.md`.
 */

export {
  CONECTOR_DE_FILTRAGEM_DE_SPAM,
  ORDEM_DE_PRECEDENCIA,
  valorDaConstante,
  valorDoAmbiente,
  type AutenticacaoDoConector,
  type ConectorRegistrado,
  type FontesForaDoBanco,
  type MetodoDeAutenticacao,
  type OrigemDaCredencial,
  type TipoDeConector,
} from './autenticacao-do-conector.js';

export {
  CREDENCIAL_DE_PAR_VAZIA,
  FUNCAO_QUE_RESOLVE_O_PAR,
  MENSAGEM_DE_AMBIENTE_MALFORMADO,
  MENSAGEM_DE_CONSTANTE_MALFORMADA,
  VERSAO_DO_AVISO_DE_PAR,
  origemDaChaveDeApi,
  resolverCredencialDePar,
  separarCredencialDePar,
  type AvisoDeUsoIndevido,
  type AvisosDaCredencial,
  type CredencialDePar,
  type CredencialDeParResolvida,
  type MetadeDaCredencial,
  type RelatorDeUsoIndevido,
} from './precedencia.js';

export {
  PERMISSOES_DA_CREDENCIAL,
  TIPO_PROVEDOR_DE_IA,
  autenticacaoNaTela,
  type AutenticacaoNaTela,
  type ContextoDaTelaDeIntegracoes,
  type OperacaoDaCredencial,
  type PermissaoDaCredencial,
  type RegistroDeProvedoresDeIa,
} from './tela-de-integracoes.js';

export { criarAreaDeCredencial, type AreaDeCredencial } from './area-de-credencial.js';
