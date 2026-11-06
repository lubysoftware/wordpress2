/**
 * A lista de origens responsivas — US-6, entrega de **T013** da feature
 * `006-biblioteca-de-midia`. E `wp_calculate_image_srcset()`
 * (`wp-includes/media.php:1444`), com o teto de `M3` em `:1545`.
 *
 * O que esta area NAO faz esta no cabecalho de
 * `calcular-origens-responsivas.ts`: a tag, o atributo `sizes` e a resolucao do
 * `src` sao da borda.
 */

export {
  calcularOrigensResponsivas,
  proporcaoCoincide,
  TETO_DAS_ORIGENS_RESPONSIVAS,
  TIPO_QUE_NAO_OFERECE_O_INTEIRO,
  type PedidoDeOrigensResponsivas,
} from './calcular-origens-responsivas.js';

export type {
  ContextoDeOrigensResponsivas,
  FiltroDoTetoDeOrigens,
  RequisicaoNasOrigens,
} from './contexto-de-origens-responsivas.js';

export {
  comBarraFinal,
  comEsquemaHttps,
  dominioDoEndereco,
  nomeBase,
  pastaRelativaDoAnexo,
} from './endereco-da-origem.js';
