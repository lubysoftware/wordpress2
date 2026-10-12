/**
 * A pre-busca do proximo destino de navegacao — a entrega de **T015** (US-7).
 *
 * Quatro arquivos, e a divisao entre eles e a do legado:
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `padrao-de-endereco.ts` | `WP_URL_Pattern_Prefixer` inteira | `class-wp-url-pattern-prefixer.php:18-135` |
 * | `configuracao-da-pre-busca.ts` | a configuracao, os defaults, a sobreposicao por constante e as tres listas de valores permitidos | `speculative-loading.php:26-178` · `class-wp-speculation-rules.php:34-61`, `:269-298` |
 * | `regras-de-pre-busca.ts` | `WP_Speculation_Rules`: o coletor, as dez recusas e a forma de saida | `class-wp-speculation-rules.php:73-256` |
 * | `declarar-pre-busca.ts` | a montagem e a saida: as oito exclusoes, as condicoes da regra do nucleo e o que vai para a borda | `speculative-loading.php:195-343` |
 *
 * ⚠️ **Isto nao e etapa de `WP::main()` nem de `template-loader.php`.** A
 * declaracao e pendurada em `wp_footer` (`wp-includes/default-filters.php:367`)
 * e sai quando o tema emite o rodape — ver `GANCHO_DA_DECLARACAO`. Por isso ela
 * e operacao propria do modulo, pela mesma razao que `escolherApresentacao` o e.
 *
 * Nada aqui guarda estado: tudo chega por argumento, porque quem esta
 * autenticado, as opcoes do site e os caminhos da instalacao sao escopo de
 * REQUISICAO (BR-MIGRAR-105, `EXT-CONTEXTO`). A unica estrutura mutavel e o
 * coletor de regras, que nasce dentro da operacao e morre com ela — a razao
 * esta no cabecalho de `./regras-de-pre-busca.ts`.
 */

export type {
  CaminhosDaInstalacao,
  ContextoDePadrao,
  ContextosDoPrefixador,
} from './padrao-de-endereco.js';
export {
  CAMINHOS_SEM_PATH,
  CONTEXTOS_DO_PREFIXADOR,
  CONTEXTO_PADRAO,
  contextosPadraoDoPrefixador,
  escaparPadrao,
  prefixadorDeContextos,
  prefixarPadrao,
} from './padrao-de-endereco.js';

export type {
  AgressividadeDaPreBusca,
  ConfiguracaoDaPreBusca,
  FonteDaRegra,
  IntercepcaoDaConfiguracao,
  LeituraDaInstalacao,
  LeituraDeAmbiente,
  LeituraDeConstante,
  ModoDePreBusca,
} from './configuracao-da-pre-busca.js';
export {
  AGRESSIVIDADES_DA_PRE_BUSCA,
  AGRESSIVIDADE_DE_FABRICA,
  AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO,
  agressividadeValida,
  configuracaoDaPreBusca,
  configuracaoDeFabricaDaPreBusca,
  fonteValida,
  FONTES_DA_REGRA,
  MODO_DE_FABRICA,
  MODOS_DA_PRE_BUSCA,
  modoValido,
  NOME_DA_SOBREPOSICAO_DE_AGRESSIVIDADE,
  NOME_DA_SOBREPOSICAO_DE_MODO,
  sobreposicaoDaPreBusca,
  VALOR_AUTOMATICO,
} from './configuracao-da-pre-busca.js';

export type {
  CondicaoDeRegra,
  ConjuntoDeRegrasDePreBusca,
  MotivoDaRecusa,
  RecusaDeRegra,
  RegraDePreBusca,
  RegrasParaJson,
} from './regras-de-pre-busca.js';
export {
  criarConjuntoDeRegrasDePreBusca,
  identificadorDeRegraValido,
} from './regras-de-pre-busca.js';

export type {
  ContextoDaPreBusca,
  ContextoDaPreBuscaResolvido,
} from './contexto-da-pre-busca.js';
export { contextoDaPreBuscaResolvido } from './contexto-da-pre-busca.js';

export type {
  DeclaracaoDaPreBusca,
  ExclusaoDeFabrica,
  IntercepcaoDeCaminhosExcluidos,
  ObservadorDasRegras,
  OpcoesDaPreBusca,
  PontosDaPreBusca,
} from './declarar-pre-busca.js';
export {
  BANDEIRAS_DA_CODIFICACAO,
  caminhosExcluidosDaPreBusca,
  condicoesDaRegraDoNucleo,
  declararPreBusca,
  EXCLUSAO_DE_CONSULTA_COM_ENDERECO_AMIGAVEL,
  EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL,
  EXCLUSOES_DE_FABRICA,
  FONTE_DA_REGRA_DO_NUCLEO,
  GANCHO_DA_DECLARACAO,
  IDENTIFICADOR_DA_REGRA_DO_NUCLEO,
  PADRAO_DO_PROPRIO_SITE,
  PRIORIDADE_DA_DECLARACAO,
  regrasDePreBusca,
  SELETOR_SEM_SEGUIR,
  TIPO_DO_ELEMENTO_DE_SAIDA,
} from './declarar-pre-busca.js';
