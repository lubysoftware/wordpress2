/**
 * O catalogo de enderecos externos: a entrega de **T002**.
 *
 * Tres arquivos, e a divisao entre eles e a propria entrega — *"um registro
 * unico e inspecionavel, com o esquema de cada um explicito"*:
 *
 * | arquivo | o que e |
 * |---|---|
 * | `endereco-externo.ts` | a forma de uma linha, com o motivo de cada campo e do valor de cada enumeracao |
 * | `catalogo-de-enderecos.ts` | o dado: 19 servicos de saida e 54 enderecos, cada um com ancora `arquivo:linha` no legado |
 * | `consultas.ts` | as funcoes que respondem por consulta, inclusive a pergunta da entrega |
 *
 * 🔴 **Este catalogo nao decide nada sobre canal sem cifra.** Ver o cabecalho de
 * `endereco-externo.ts`: REQ-149 e a resposta 12 de `questions.md` mandam coisas
 * opostas sobre os 13 canais em claro, e a tabela *Nao negociavel* da
 * constituicao poe os dois lados fora do que um agente de codificacao decide.
 * O dado esta aqui na forma em que **qualquer** das duas decisoes se implementa
 * sem reabrir o catalogo.
 */

export type {
  CifraDeNascimento,
  CriticidadeDoServico,
  EnderecoExterno,
  FonteDoEndereco,
  OrigemDoEndereco,
  ProtocoloDeSaida,
  ServicoExterno,
  ValidacaoDeDestino,
  VerificacaoDeCertificado,
} from './endereco-externo.js';

export {
  CATALOGO_DE_ENDERECOS_EXTERNOS,
  SERVICOS_EXTERNOS,
} from './catalogo-de-enderecos.js';

export {
  canaisPromovidosPeloAmbiente,
  canaisQueNascemSemCifra,
  canaisQueRepetemEmClaro,
  canaisSemAutenticacaoDoOutroLado,
  conferirCatalogo,
  contarPorCifraDeNascimento,
  enderecosDaFonte,
  enderecosDoServico,
  enderecosSemValidacaoDeDestino,
  type ContagemPorCifra,
  type ProblemaDeCatalogo,
} from './consultas.js';
