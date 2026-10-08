/**
 * Os pontos de configuracao nomeados desta feature.
 *
 * Hoje ha **um**, que e o que T001 entrega: o prazo de retencao da lixeira, com o
 * valor de fabrica do legado. Os outros numeros desta feature entram nas tarefas
 * que os implementam, cada um com o seu teste de borda, como o **P6** exige — ver
 * a secao *O que NAO esta neste arquivo* de `prazo-de-retencao.ts`.
 */

export {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  instanteLimiteDeRetencao,
  lixeiraEstaLigada,
  type PrazoDeRetencao,
} from './prazo-de-retencao.js';
