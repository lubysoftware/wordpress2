/**
 * `registro/` — os contextos de classificacao e o registro deles.
 *
 * Entrega de **T001** da feature `003-classificacao-do-conteudo`, metade
 * declarativa: *"os oito contextos de classificacao do nucleo registrados, sem
 * regra implementada"*.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-classificacao.ts` | a forma do contexto, e a parte pura de `set_props()` |
 * | `contextos-do-nucleo.ts` | as **oito** declaracoes, na ordem de `create_initial_taxonomies()` |
 * | `registro-de-contextos.ts` | o `$wp_taxonomies`, **por composicao e nao por modulo** |
 * | `erro-de-registro.ts` | os dois codigos de `WP_Error`, com as mensagens do legado |
 *
 * **O que esta pasta nao tem, e de proposito:** rotulo, juncao e contador — o
 * `terms`, o `term_taxonomy` e o `term_relationships` sao T002, e as regras que
 * os usam sao T003 em diante. Aqui nao ha nenhuma leitura nem escrita no banco:
 * a porta de dados chega ao modulo e **nenhum arquivo desta pasta a toca**.
 */

export {
  CAPACIDADES_PADRAO_DO_CONTEXTO,
  LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO,
  resolverContexto,
  type CapacidadesDoContexto,
  type ContextoDeClassificacao,
  type DeclaracaoDeContexto,
  type RotuloPadraoDeclarado,
  type RotuloPadraoDoContexto,
} from './contexto-de-classificacao.js';

export {
  CONTEXTOS_DO_NUCLEO,
  CONTEXTO_DE_AREA_DE_PARTE_DE_MODELO,
  CONTEXTO_DE_CATEGORIA,
  CONTEXTO_DE_CATEGORIA_DE_LINK,
  CONTEXTO_DE_CATEGORIA_DE_PADRAO,
  CONTEXTO_DE_ETIQUETA,
  CONTEXTO_DE_FORMATO,
  CONTEXTO_DE_MENU_DE_NAVEGACAO,
  CONTEXTO_DE_TEMA,
  NOMES_DOS_CONTEXTOS_DO_NUCLEO,
  type ContextoDoNucleo,
} from './contextos-do-nucleo.js';

export {
  criarRegistroComOsContextosDoNucleo,
  criarRegistroDeContextos,
  type RegistroDeContextos,
} from './registro-de-contextos.js';

export {
  MENSAGENS_DE_ERRO_DE_REGISTRO,
  ehErroDeRegistro,
  erroDeRegistro,
  type CodigoDeErroDeRegistro,
  type ErroDeRegistro,
} from './erro-de-registro.js';
