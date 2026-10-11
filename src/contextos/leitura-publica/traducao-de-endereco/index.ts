/**
 * A traducao de endereco em criterios de consulta — a entrega de **T002**, mais
 * a colisao de identificador numerico, que T003 trouxe.
 *
 * Cinco arquivos (seis com `cadeia-de-consulta.ts`), e a divisao entre eles e a
 * do legado:
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `nomes-de-criterio.ts` | as duas listas de nomes aceitos, e o ponto de extensao sobre elas | `class-wp.php:18`, `:28`, `:311` |
 * | `tabela-de-regras.ts` | a tabela como **dado**, a fonte dela e as regras fixas | `class-wp.php:163` · `class-wp-rewrite.php:1276-1500` |
 * | `casar-endereco.ts` | o casamento do caminho pedido contra a tabela | `class-wp.php:165-298` |
 * | `criterios-diretos.ts` | a coleta, com as quatro fontes, a recusa 400 e os tres filtros de `:313-389` | `class-wp.php:313-400` |
 * | `colisao-de-identificador-numerico.ts` | identificador numerico que parece arquivo de data | `class-wp.php:390` · `rewrite.php:381-475` |
 *
 * Quem compoe os quatro na ordem do legado e `../requisicao/resolver-endereco.ts`,
 * que e o `parse_request` inteiro. Nada aqui guarda estado: tudo chega por
 * argumento, porque a requisicao corrente e escopo de REQUISICAO
 * (BR-MIGRAR-105, `EXT-CONTEXTO`).
 */

export type { IntercepcaoDeNomesDeCriterio } from './nomes-de-criterio.js';
export {
  NOMES_PRIVADOS_DE_CRITERIO,
  NOMES_PUBLICOS_DE_CRITERIO,
  nomesPublicosFiltrados,
} from './nomes-de-criterio.js';

export {
  adicionarBarras,
  analisarCadeiaDeConsulta,
  aplicarCasamentos,
  codificarValorDeUrl,
  decodificarUrl,
} from './cadeia-de-consulta.js';

export type {
  CriteriosDaRegra,
  FonteDeRegrasDeTraducao,
  PaginaNoCaminho,
  RegraDeTraducao,
  TabelaDeRegras,
} from './tabela-de-regras.js';
export {
  fonteFixaDeRegras,
  INDICE_DO_SITE,
  PADRAO_DA_RAIZ,
  REGRA_DE_CADASTRO_HERDADA,
  REGRAS_DA_INSTALACAO_NA_RAIZ,
  REGRAS_DE_ARQUIVO_HERDADO,
  REGRAS_DE_CADASTRO_EM_REDE,
  TABELA_SEM_REGRAS,
  tabelaDeRegras,
} from './tabela-de-regras.js';

export type { CasamentoDeEndereco } from './casar-endereco.js';
export { casarEndereco, vazioNoLegado } from './casar-endereco.js';

export type { EntradaDaColisaoDeIdentificador } from './colisao-de-identificador-numerico.js';
export { resolverColisaoDeIdentificadorNumerico } from './colisao-de-identificador-numerico.js';

export type { EntradaDaColeta } from './criterios-diretos.js';
export {
  CODIGO_DE_VARIAVEL_DIVERGENTE,
  coletarCriterios,
  ehRecusaDeVariavelDivergente,
  MENSAGEM_DE_VARIAVEL_DIVERGENTE,
  RecusaDeVariavelDivergente,
  TITULO_DE_VARIAVEL_DIVERGENTE,
} from './criterios-diretos.js';
