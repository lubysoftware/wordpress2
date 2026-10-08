/**
 * Os tamanhos de imagem: a forma de um tamanho registrado, e os seis de fabrica
 * do legado como dado (`M2`, BR-MIGRAR-058).
 */

export type {
  PosicaoHorizontalDeRecorte,
  PosicaoVerticalDeRecorte,
  Recorte,
  TamanhoDeImagem,
} from './tamanho-de-imagem.js';

export {
  NOMES_DE_TAMANHO_DE_FABRICA,
  OPCOES_SEMEADAS_DE_TAMANHO,
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
} from './tamanhos-de-fabrica.js';

export type {
  NomeDeTamanhoDeFabrica,
  OpcoesDoTamanho,
  OrigemDoTamanho,
  TamanhoDeImagemDeFabrica,
} from './tamanhos-de-fabrica.js';
