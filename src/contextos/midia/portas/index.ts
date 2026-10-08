/**
 * As tres portas que o modulo de midia declara.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa:
 * e o que a regra de dependencia 4 de `target_architecture.md` exige —
 * "`contextos/` ou `plataforma/` para `adaptadores/` concreto: proibido. So
 * pela porta".
 *
 * Por que estas tres, e nao outras, esta em `../README.md`.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';

export type {
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
} from './porta-de-sistema-de-arquivos.js';

export type {
  ArquivoDeImagemGravado,
  Dimensoes,
  ImagemAberta,
  OperacaoDeImagem,
  PortaDeProcessamentoDeImagem,
  PosicaoHorizontalDeRecorte,
  PosicaoVerticalDeRecorte,
  Recorte,
  ResultadoDeImagem,
  TamanhoPedido,
} from './porta-de-processamento-de-imagem.js';
