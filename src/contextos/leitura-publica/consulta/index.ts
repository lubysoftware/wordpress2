/**
 * A consulta de conteudo — a entrega de **T003** (US-1) e de **T007** (US-3, a
 * paginacao e a ordem declarada da listagem).
 *
 * Onze arquivos, e a divisao entre eles e a do legado:
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `semantica-de-php.ts` | `empty`, `is_scalar`, `is_numeric`, `(int)`, `absint`, `==`, `sort`, `checkdate`, `sanitize_key` | do interpretador, mais `load.php:1468` e `formatting.php:2191` |
 * | `registro-consultavel.ts` | os registros de tipo de conteudo e de taxonomia, como esta feature os le | `class-wp.php:313`, `:357` · `post.php:2447` |
 * | `conteudo-consultado.ts` | a linha de `posts` que a leitura le, e o repositorio que a devolve | `class-wp-query.php:1900` |
 * | `criterios-da-consulta.ts` | `fill_query_vars` e a normalizacao dos criterios | `class-wp-query.php:580`, `:832-890`, `:1123-1139` |
 * | `tipo-de-consulta.ts` | as 30 propriedades `is_*`, e o `set_404` | `class-wp-query.php:202-436`, `:502`, `:1843` |
 * | `consulta-de-taxonomia.ts` | `parse_tax_query` e o saneamento de `WP_Tax_Query` | `class-wp-query.php:1176` · `class-wp-tax-query.php:115` |
 * | `contexto-da-consulta.ts` | as colaboracoes tardias e as sete opcoes do site | — |
 * | `analisar-consulta.ts` | `parse_query`, as dezesseis etapas | `class-wp-query.php:811` |
 * | `paginacao-da-listagem.ts` | o tamanho da pagina, a janela e o total encontrado | `class-wp-query.php:2013`, `:2809`, `:3692` |
 * | `ordenacao-da-listagem.ts` | a ordem declarada e `parse_order` | `class-wp-query.php:2494`, `:1826` |
 * | `consultar-conteudo.ts` | `WP_Query::query` — analisar, recortar e buscar | `class-wp-query.php:3970` |
 *
 * Quem poe a consulta na ordem do atendimento e
 * `../requisicao/atender-leitura-publica.ts`, na etapa 3. Nada aqui guarda
 * estado: tudo chega por argumento, porque a consulta corrente e escopo de
 * REQUISICAO (BR-MIGRAR-105, `EXT-CONTEXTO`).
 */

export type {
  EscalarDaConsulta,
  ValorDaConsulta,
} from './semantica-de-php.js';
export {
  chaveSaneada,
  compararComoNoPhp,
  dataValidaComoNoPhp,
  diferenteDeVazioComoNoPhp,
  escalarComoNoPhp,
  iguaisComoNoPhp,
  inteiroAbsoluto,
  inteiroComoNoPhp,
  numericoComoNoPhp,
  vazioComoNoPhp,
} from './semantica-de-php.js';

export type {
  RegistroDeTaxonomias,
  RegistroDeTiposDeConteudo,
  TaxonomiaConsultavel,
  TipoDeConteudoConsultavel,
} from './registro-consultavel.js';
export {
  criteriosDeTipoDeConteudo,
  REGISTRO_SEM_TAXONOMIAS,
  REGISTRO_SEM_TIPOS,
  registroDeTaxonomias,
  registroDeTipos,
  tipoDeConteudoVisivel,
  tiposConsultaveisPublicamente,
} from './registro-consultavel.js';

export type {
  ConteudoConsultado,
  ConteudoPorCaminho,
  RecorteDaListagem,
  RepositorioDeConteudoPublico,
  ResultadoDaConsulta,
} from './conteudo-consultado.js';
export {
  MARCADOR_DE_PAGINA_NO_CORPO,
  REPOSITORIO_SEM_CONTEUDO,
  SEM_CONTEUDO,
  TIPO_DE_CONTEUDO_SIMPLES,
  TIPO_PADRAO_DE_CAMINHO,
} from './conteudo-consultado.js';

export type { CriteriosDaConsulta } from './criterios-da-consulta.js';
export {
  NOMES_PREENCHIDOS_COMO_ARRANJO,
  NOMES_PREENCHIDOS_COMO_TEXTO,
  normalizarCriterios,
  preencherCriterios,
  sanearTipoEEstado,
  TETO_DO_TERMO_DE_BUSCA,
} from './criterios-da-consulta.js';

export type { TiposDeConsulta } from './tipo-de-consulta.js';
export {
  consultaDeListagem,
  consultaSingular,
  marcarNaoEncontrado,
  TIPOS_DE_CONSULTA_ZERADOS,
} from './tipo-de-consulta.js';

export type {
  CampoDeTermo,
  ClausulaDeTaxonomia,
  ConsultaDeTaxonomia,
  EntradaDaConsultaDeTaxonomia,
  OperadorDeTaxonomia,
  SaneamentoDeIdentificadorDeTermo,
} from './consulta-de-taxonomia.js';
export {
  montarConsultaDeTaxonomia,
  SEM_TAXONOMIA,
  TAXONOMIA_DE_CATEGORIA,
  TAXONOMIA_DE_ETIQUETA,
} from './consulta-de-taxonomia.js';

export type {
  ConfiguracaoDoSiteNaConsulta,
  ContaMembroDoSite,
  ContextoDaConsulta,
  ContextoDaConsultaResolvido,
} from './contexto-da-consulta.js';
export {
  CONFIGURACAO_DE_FABRICA,
  contextoResolvido,
  FRENTE_COMO_PAGINA,
} from './contexto-da-consulta.js';

export type { AnaliseDaConsulta, OpcoesDaAnalise } from './analisar-consulta.js';
export { analisarConsulta } from './analisar-consulta.js';

export type {
  IntercepcaoDoTotalEncontrado,
  JanelaDaListagem,
  PaginacaoResolvida,
  TotalDaListagem,
} from './paginacao-da-listagem.js';
export {
  ITENS_POR_FEED_DE_FABRICA,
  ITENS_POR_PAGINA_DE_FABRICA,
  LISTAGEM_SEM_TOTAL,
  resolverPaginacao,
  totalDaListagem,
} from './paginacao-da-listagem.js';

export type {
  ChaveDeOrdenacao,
  DirecaoDeOrdenacao,
  OrdenacaoResolvida,
} from './ordenacao-da-listagem.js';
export {
  CAMPO_DE_ORDENACAO_PADRAO,
  CHAVES_QUE_IGNORAM_A_DIRECAO,
  direcaoComoNoLegado,
  DIRECAO_PADRAO,
  ORDENACAO_AO_ACASO,
  ORDENACAO_APAGADA,
  resolverOrdenacao,
} from './ordenacao-da-listagem.js';

export type {
  ConsultaDeConteudo,
  IntercepcaoAntesDaConsulta,
  IntercepcaoDosConteudos,
  OpcoesDaConsultaDeConteudo,
  PontosDeExtensaoDaConsulta,
} from './consultar-conteudo.js';
export {
  consultaMarcadaComoNaoEncontrada,
  consultarConteudo,
} from './consultar-conteudo.js';
