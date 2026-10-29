/**
 * Barril da area de recursos de interface — **T023** (US-11).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `registro-de-dependencias.ts` | **CA-11.1**, **CA-11.2**, **CA-11.4**, **CA-11.5**: `WP_Dependencies` — registrar, enfileirar, resolver a ordem e processar |
 * | `endereco-servido.ts` | **CA-11.3**: o endereco com `ver=`, e se o recurso e entregue |
 * | `funcoes-publicadas.ts` | `wp_register_script()`, `wp_enqueue_style()` e as irmas, com o aviso de cedo demais |
 * | `area-de-recursos-de-interface.ts` | a area, fora do ciclo, com as duas fabricas de registro |
 */

export {
  criarAreaDeRecursosDeInterface,
  type AreaDeRecursosDeInterface,
  type OperacoesDosRecursos,
} from './area-de-recursos-de-interface.js';

export {
  PONTOS_DE_EXTENSAO_DOS_RECURSOS,
  codificarComoRawurlencode,
  enderecoComVersao,
  processarItem,
  versaoParaOEndereco,
  type AvisoDeUsoIndevido as AvisoDeUsoIndevidoDosRecursos,
  type ConfiguracaoDoRegistro,
  type ContextoDoRegistro,
  type EspecieDeRecurso,
  type EstadoDoItem,
  type RecursoEntregue,
  type RelatorDeUsoIndevido as RelatorDeUsoIndevidoDosRecursos,
} from './endereco-servido.js';

export {
  ACOES_QUE_LIBERAM_O_REGISTRO,
  PERMISSOES_DOS_RECURSOS,
  avisarSeCedoDemais,
  desenfileirarEstilo,
  desenfileirarScript,
  desregistrarEstilo,
  enfileirarEstilo,
  enfileirarScript,
  estiloEsta,
  registrarEstilo,
  registrarScript,
  scriptEsta,
  type ContextoDasFuncoesPublicadas,
} from './funcoes-publicadas.js';

export {
  avisoDeDependenciaAusente,
  criarRegistroDeRecursos,
  type EstadoDoRecurso,
  type RecursoRegistrado,
  type RegistroDeRecursos,
  type VersaoDoRecurso,
} from './registro-de-dependencias.js';
