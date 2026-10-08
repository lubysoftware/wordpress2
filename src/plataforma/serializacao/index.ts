/**
 * O *codec* do formato serializado do legado.
 *
 * `DB-SER` (BR-MIGRAR-082): quatro familias de coluna de texto longo guardam
 * estrutura serializada — opcoes e os quatro metadados —, e a nota 2 de
 * `target_data_model.md` diz qual e o caso mais caro: *"`usermeta`, porque e
 * onde a autorizacao mora"*. Dai a regra de aceite deste modulo, que nao e
 * negociavel e nao e de estilo: **os bytes gravados sao os mesmos**.
 *
 * A suite de conformidade esta em `conformidade.test.ts`, e e o que o slot
 * `serializacao-de-valor-persistido` do plano pede ao escolher implementacao
 * propria ("com suite de conformidade"). Os vetores dela sao **transcritos**, e
 * a conferencia final e contra o oraculo executavel do legado
 * (`015-plataforma-transversal`, T001), que nao existe nesta arvore.
 */

export {
  arranjo,
  arranjoPorNome,
  booleano,
  decimal,
  inteiro,
  lista,
  nomeDaChave,
  normalizarChaveDeTexto,
  texto,
  NULO,
  type ChaveDeArranjo,
  type EntradaDeArranjo,
  type ValorPhp,
} from './valor-php.js';

export { serializar, serializarComoTexto } from './serializar.js';

export { desserializar, type ResultadoDeLeitura } from './desserializar.js';

export {
  pareceSerializado,
  talvezDesserializar,
  talvezSerializar,
} from './talvez-serializar.js';
