/**
 * A expansao de macro textual — a entrega de **T017** (US-8).
 *
 * Nove arquivos, e a divisao entre eles e a do legado: `wp-includes/shortcodes.php`
 * inteiro (764 linhas, 18 funcoes), mais os quatro analisadores de texto de que
 * ele depende e que estao em outros dois arquivos do legado.
 *
 * | arquivo | o que e | legado |
 * |---|---|---|
 * | `semantica-de-pcre.ts` | `preg_quote`, a forma do arranjo de achado, `preg_replace_callback`, `preg_match_all`, `preg_split`, `strtr` com arranjo e `stripcslashes` | o interpretador |
 * | `registro-de-macros.ts` | `$shortcode_tags` e as quatro funcoes que o escrevem e o leem | `shortcodes.php:41`, `:63`, `:101`, `:117`, `:133` |
 * | `regex-de-macro.ts` | `get_shortcode_regex` e o recorte de marcas presentes no corpo | `shortcodes.php:324`, `:255-256` |
 * | `atributos-da-macro.ts` | `get_shortcode_atts_regex`, `shortcode_parse_atts`, `shortcode_atts` | `shortcodes.php:593`, `:613`, `:664` |
 * | `html-do-corpo.ts` | `wp_html_split` e `wp_kses_attr_parse`, os analisadores puros | `formatting.php:615`, `:625` e `kses.php:1763`, `:1813` |
 * | `contexto-da-macro.ts` | o que vem de fora por ligacao tardia, e os pontos de extensao | — |
 * | `macros-em-atributo.ts` | `do_shortcodes_in_html_tags` e `unescape_invalid_shortcodes` | `shortcodes.php:465`, `:574` |
 * | `expandir-macros.ts` | `do_shortcode`, `apply_shortcodes`, `do_shortcode_tag`, `strip_shortcodes`, `strip_shortcode_tag` | `shortcodes.php:243`, `:223`, `:392`, `:706`, `:757` |
 * | `inspecionar-macros.ts` | `has_shortcode` e `get_shortcode_tags_in_content` | `shortcodes.php:149`, `:184` |
 *
 * Quem poe a expansao na superficie do modulo e `../index.ts`. Ela **nao** e
 * etapa de `WP::main()` nem de `template-loader.php`: no legado ela e um
 * interceptador de `the_content`, registrado com prioridade 11
 * (`default-filters.php:209`), e e isso que faz CA-8.3 — ver
 * `LIGACAO_NA_RENDERIZACAO`.
 *
 * Nada aqui guarda estado: o registro de marcas, o saneador de atributo e o
 * relator de uso indevido chegam por argumento, porque os tres sao escopo de
 * REQUISICAO (BR-MIGRAR-105, `EXT-CONTEXTO`).
 *
 * ## Os 18 nomes publicados do legado, e onde cada um esta
 *
 * P8 nao admite que superficie publicada deixe de existir, e o arquivo do legado
 * publica 18 funcoes. Dezessete estao portadas; a que falta esta nomeada na
 * ultima linha, com o motivo:
 *
 * | legado | aqui |
 * |---|---|
 * | `add_shortcode` | `adicionarMacro` |
 * | `remove_shortcode` | `removerMacro` |
 * | `remove_all_shortcodes` | `removerTodasAsMacros` |
 * | `shortcode_exists` | `macroExiste` |
 * | `has_shortcode` | `corpoTemMacro` |
 * | `get_shortcode_tags_in_content` | `marcasUsadasNoCorpo` |
 * | `apply_shortcodes` | `aplicarMacros` |
 * | `do_shortcode` | `expandirMacros` |
 * | `get_shortcode_regex` | `expressaoDeMacro`, `fonteDaExpressaoDeMacro` |
 * | `do_shortcode_tag` | `expandirUmaMacro` |
 * | `do_shortcodes_in_html_tags` | `expandirMacrosNoHtml` |
 * | `unescape_invalid_shortcodes` | `desfazerEsconderijoDeColchete` |
 * | `get_shortcode_atts_regex` | interno de `atributos-da-macro.ts` |
 * | `shortcode_parse_atts` | `atributosDaMacro` |
 * | `shortcode_atts` | `atributosComPadrao` |
 * | `strip_shortcodes` | `removerMacrosDoCorpo` |
 * | `strip_shortcode_tag` | `removerUmaMacro` |
 * | `_filter_do_shortcode_context` | ⚠️ **nao portada como funcao**: ela e um interceptador de tres linhas que devolve uma constante, e registrar interceptador e trabalho do barramento, que nao existe nesta arvore. O nome do ponto e o valor que ela devolve estao declarados em `FILTRO_DE_CONTEXTO_DE_IMAGEM` e `CONTEXTO_DA_MACRO_NA_IMAGEM`, e `ExpansaoDeMacros.registrouContextoDeImagem` diz se esta chamada o registraria |
 */

export type {
  AchadoDoPhp,
  SubstituicaoComCallback,
} from './semantica-de-pcre.js';
export {
  CLASSE_DE_ESPACO,
  CLASSE_DE_NAO_ESPACO,
  ESPACO_DO_PCRE,
  acharTodosComoNoPhp,
  achadoComoNoPhp,
  protegerParaRegex,
  separarComDelimitador,
  substituirComCallback,
  textoSemBarraDeC,
  traduzirComoNoPhp,
} from './semantica-de-pcre.js';

export type {
  AtributosDaMacro,
  AvisoDeUsoIndevido,
  MacroRegistrada,
  MarcaDeFabrica,
  OpcoesDoRegistro,
  RegistroDeMacros,
  RelatorDeUsoIndevido,
  TratadorDeMacro,
} from './registro-de-macros.js';
export {
  MARCAS_DE_FABRICA,
  REGISTRO_SEM_MACROS,
  adicionarMacro,
  chamavelComoNoPhp,
  macroExiste,
  marcasRegistradas,
  removerMacro,
  removerTodasAsMacros,
} from './registro-de-macros.js';

export {
  expressaoDeMacro,
  fonteDaExpressaoDeMacro,
  marcasDoCorpoEntre,
  marcasDoCorpoParaExpandir,
} from './regex-de-macro.js';

export type {
  IntercepcaoDosAtributos,
  ValorDeAtributo,
} from './atributos-da-macro.js';
export {
  atributosComPadrao,
  atributosDaMacro,
} from './atributos-da-macro.js';

export {
  atributosDoElemento,
  nomeDoElemento,
  pedacosDoElemento,
  separarHtmlDoCorpo,
} from './html-do-corpo.js';

export type {
  ContextoDaMacro,
  ContextoDaMacroResolvido,
  EstadoDoContextoDeImagem,
  IntercepcaoAntesDaMacro,
  IntercepcaoDaMacroExpandida,
  IntercepcaoDasMarcasRemovidas,
  PontosDaMacro,
  SaneadorDeAtributo,
} from './contexto-da-macro.js';
export {
  CONTEXTO_DA_MACRO_NA_IMAGEM,
  FILTRO_DE_CONTEXTO_DE_IMAGEM,
  SEM_LISTA_DE_PERMISSAO,
  contextoDaMacroResolvido,
} from './contexto-da-macro.js';

export type {
  CaminhoDoAtributo,
  CaminhoDoElemento,
  ExpansaoNoHtml,
  PassoNoAtributo,
  PassoNoHtml,
} from './macros-em-atributo.js';
export {
  desfazerEsconderijoDeColchete,
  expandirMacrosNoHtml,
} from './macros-em-atributo.js';

export type {
  ExpansaoDeMacros,
  LigacaoDaExpansao,
  OpcoesDaExpansao,
  OpcoesDaRemocao,
  SaidaDaExpansao,
} from './expandir-macros.js';
export {
  LIGACAO_NA_RENDERIZACAO,
  aplicarMacros,
  expandirMacros,
  expandirUmaMacro,
  removerMacrosDoCorpo,
  removerUmaMacro,
} from './expandir-macros.js';

export {
  corpoTemMacro,
  marcasUsadasNoCorpo,
} from './inspecionar-macros.js';
