/**
 * O registro de marcas — o global `$shortcode_tags`
 * (`wp-includes/shortcodes.php:41`) e as quatro funcoes publicadas que o
 * escrevem e o leem: `add_shortcode()` (`:63`), `remove_shortcode()` (`:101`),
 * `remove_all_shortcodes()` (`:117`) e `shortcode_exists()` (`:133`).
 *
 * Entrega de **T017** (US-8). E aqui que **CA-8.5** mora — *"a lista de marcas
 * registradas e inspecionavel por quem administra o site"* — e a forma da
 * inspecao e a do legado: o registro **e** o dado, exposto por nome, e nao uma
 * tela.
 *
 * ---
 *
 * ## O registro chega por argumento, e isso e BR-MIGRAR-105 e nao desenho
 *
 * `$shortcode_tags` e global, montado no arranque por `media.php`, por
 * `class-wp-embed.php` e por toda extensao carregada, e descartado com o
 * processo. `EXT-CONTEXTO` poe requisicao e estado montado no arranque no escopo
 * da **requisicao**, e por isso nao existe instancia compartilhada neste
 * arquivo: {@link RegistroDeMacros} e valor, e quem o guarda e a composicao da
 * requisicao. Num processo longevo o vazamento apareceria como um visitante
 * recebendo o corpo expandido pelas extensoes de outro.
 *
 * As quatro operacoes de escrita, por consequencia, **devolvem** o registro em
 * lugar de alterar um global. A ordem de insercao sobrevive porque
 * {@link RegistroDeMacros} e um `Map`, e ela e observavel: `do_shortcode()` monta
 * a alternancia da expressao com `array_intersect( array_keys(
 * $shortcode_tags ), ... )` (`:256`), que preserva a ordem do **primeiro**
 * arranjo. Ver `./regex-de-macro.ts`.
 *
 * ## ⚠️ As 7 marcas de fabrica NAO estao registradas aqui, e a ausencia e declarada
 *
 * Uma instalacao nova do legado registra sete marcas, em `wp-includes/`:
 *
 * | marca | legado | de quem e o tratador |
 * |---|---|---|
 * | `embed` | `class-wp-embed.php:38` (`__return_false`) e `:69` (o real) | feature `014-integracao-externa` |
 * | `wp_caption` | `media.php:2596` | feature `006-biblioteca-de-midia` |
 * | `caption` | `media.php:2597` | feature `006-biblioteca-de-midia` |
 * | `gallery` | `media.php:2775` | feature `006-biblioteca-de-midia` |
 * | `playlist` | `media.php:3435` | feature `006-biblioteca-de-midia` |
 * | `audio` | `media.php:3710` | feature `006-biblioteca-de-midia` |
 * | `video` | `media.php:4005` | feature `006-biblioteca-de-midia` |
 *
 * Elas estao em {@link MARCAS_DE_FABRICA} como **dado**, com o nome e a ancora,
 * e nenhuma delas entra em {@link REGISTRO_SEM_MACROS}. O motivo e P1: registrar
 * a marca sem o tratador nao aproxima do legado, **afasta** — `do_shortcode_tag()`
 * cairia no ramo de `! is_callable()` (`:403`) e devolveria a marca literal com
 * aviso de uso indevido, que e visivel e e outro comportamento que o de expandir.
 * Deixar o registro vazio, ao contrario, cai num ramo que o legado tem e
 * documenta no proprio docblock de `do_shortcode()`: *"If there are no shortcode
 * tags defined, then the content will be returned without any filtering. This
 * might cause issues when plugins are disabled but the shortcode will still show
 * up in the post or content"* (`:231-233`).
 *
 * Quem ligar os sete tratadores chama {@link adicionarMacro} com eles, na ordem
 * da tabela, e nada deste arquivo muda.
 */

/**
 * O tratador de uma marca — o `$callback` de `add_shortcode()`.
 *
 * Recebe **tres** argumentos, sempre e nesta ordem (`:434`): os atributos, o
 * conteudo que a marca envolve e o nome da propria marca. O terceiro existe
 * porque duas marcas podem compartilhar tratador, e e o caso de fabrica de
 * `wp_caption` e `caption` (`media.php:2596-2597`).
 *
 * ⚠️ O segundo argumento e **texto vazio** e nao nulo quando a marca nao envolve
 * conteudo. A derivacao esta em `achadoComoNoPhp` de `./semantica-de-pcre.ts`:
 * o grupo 6 da expressao sempre participa, logo o `?? null` de `:432` nunca
 * chega a valer. O tipo mantem `null` na uniao porque a linha do legado o admite
 * e porque um tratador portado de extensao o testa.
 */
export type TratadorDeMacro = (
  atributos: AtributosDaMacro,
  conteudo: string | null,
  marca: string,
) => string;

/**
 * O arranjo de atributos que o tratador recebe — a saida de
 * `shortcode_parse_atts()`.
 *
 * `Map` e nao objeto, e por tres propriedades do arranjo do interpretador que o
 * objeto perderia: a chave pode ser **texto ou inteiro** (nomeada ou
 * posicional), a ordem de insercao e preservada, e reescrever uma chave mantem a
 * posicao original dela. Ver `./atributos-da-macro.ts`.
 */
export type AtributosDaMacro = ReadonlyMap<string | number, string>;

/**
 * O que o registro guarda: um tratador, ou algo que nao e chamavel.
 *
 * ⚠️ **`add_shortcode()` nao verifica se o tratador e chamavel**, e quem verifica
 * e `do_shortcode_tag()`, no meio da expansao (`:403`). Entre os dois ha dois
 * estados observaveis — `shortcode_exists()` responde verdadeiro para a marca
 * com tratador quebrado (`:135` e `array_key_exists`, nao `is_callable`), e ela
 * **entra** na alternancia da expressao. Um porte que exigisse funcao no registro
 * tornaria aqueles dois estados inalcancaveis, e o aviso de uso indevido de
 * `:404-409` deixaria de existir, *"o que e observavel por quem estende"*
 * (BR-MIGRAR-091).
 *
 * O texto e o nulo sao as duas formas que um `callable` invalido toma no legado:
 * o nome de uma funcao que nao existe, e a ausencia.
 */
export type MacroRegistrada = TratadorDeMacro | string | null;

/** `$shortcode_tags` — a marca para o tratador dela, na ordem de insercao. */
export type RegistroDeMacros = ReadonlyMap<string, MacroRegistrada>;

/**
 * O registro de uma instalacao em que nenhuma marca foi registrada.
 *
 * **Nao e "ainda nao implementado"**: e o ramo que `do_shortcode()` testa em
 * `:250` (`empty( $shortcode_tags )`) e documenta em `:231-233`, e o corpo
 * atravessa a renderizacao sem uma troca. Ver o cabecalho deste arquivo para por
 * que as 7 marcas de fabrica nao estao aqui.
 */
export const REGISTRO_SEM_MACROS: RegistroDeMacros = Object.freeze(new Map());

/** Uma marca que uma instalacao nova do legado registra, com a ancora dela. */
export interface MarcaDeFabrica {
  readonly marca: string;
  /** O arquivo e a linha do `add_shortcode()` que a registra. */
  readonly legado: string;
  /** A feature deste pacote que porta o tratador. */
  readonly feature: string;
}

/**
 * As 7 marcas que uma instalacao nova do legado registra, como **dado**.
 *
 * Declaradas e nao registradas — a razao esta no cabecalho deste arquivo. A
 * ordem e a do arranque, e ela importa: e a ordem em que elas entrariam na
 * alternancia da expressao de `do_shortcode()`.
 */
export const MARCAS_DE_FABRICA: readonly MarcaDeFabrica[] = Object.freeze([
  Object.freeze({
    marca: 'wp_caption',
    legado: 'wp-includes/media.php:2596',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'caption',
    legado: 'wp-includes/media.php:2597',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'gallery',
    legado: 'wp-includes/media.php:2775',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'playlist',
    legado: 'wp-includes/media.php:3435',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'audio',
    legado: 'wp-includes/media.php:3710',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'video',
    legado: 'wp-includes/media.php:4005',
    feature: '006-biblioteca-de-midia',
  }),
  Object.freeze({
    marca: 'embed',
    legado: 'wp-includes/class-wp-embed.php:69',
    feature: '014-integracao-externa',
  }),
]);

/**
 * Um aviso de uso indevido — o `_doing_it_wrong()` do legado.
 *
 * **Gemeo declarado de `AvisoDeUsoIndevido` de
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts`**, e a repeticao e
 * deliberada: o lugar desta estrutura e `plataforma/barramento/`, que nao
 * existe nesta arvore, e a regra de dependencia 3 proibe um contexto importar o
 * outro. Quando o barramento existir as duas descem juntas, com o mesmo nome,
 * e nenhuma chamada muda de resultado.
 *
 * O **P7** fixa o limite do que ela pode fazer: *"registro e diagnostico novos
 * podem ser acrescentados, mas nenhuma decisao do sistema pode passar a depender
 * deles"*. Dai {@link RelatorDeUsoIndevido} ser opcional e nao devolver nada:
 * ausente, as operacoes decidem igual; presente, decidem igual.
 */
export interface AvisoDeUsoIndevido {
  /** `__FUNCTION__` — a funcao que avisa, com o nome do legado. */
  readonly funcao: string;
  /** O texto do aviso, como o legado o monta. */
  readonly mensagem: string;
  /** A versao em que o aviso passou a existir, como o legado a declara. */
  readonly versao: string;
}

/** Quem recebe o aviso de uso indevido. Nao devolve nada, e e de proposito (P7). */
export type RelatorDeUsoIndevido = (aviso: AvisoDeUsoIndevido) => void;

/**
 * Os caracteres que `add_shortcode()` recusa num nome de marca
 * (`wp-includes/shortcodes.php:75`).
 *
 * `@[<>&/\[\]\x00-\x20=]@` — `&`, `/`, `<`, `>`, `[`, `]`, `=` e **todo** byte de
 * 0x00 a 0x20, que inclui o espaco. O texto do aviso lista somente
 * `'& / < > [ ] ='` (`:81`), e e o aviso que o legado emite: os controles ficam
 * de fora da lista e dentro da regra.
 *
 * ⚠️ O que **nao** esta recusado e a barra invertida, e e por isso que
 * `protegerParaRegex` de `./semantica-de-pcre.ts` existe: um nome como `c:\\x`
 * e registravel e chega a alternancia da expressao.
 */
const CARACTERE_RECUSADO_NA_MARCA = /[<>&/[\]\x00-\x20=]/;

/** O `'' === trim( $tag )` de `:66`, com o conjunto de `trim()` do interpretador. */
const ESPACO_DO_TRIM = /^[ \t\n\r\0\u000b]*$/;

/** O que {@link adicionarMacro} aceita alem da marca e do tratador. */
export interface OpcoesDoRegistro {
  /** Quem recebe o `_doing_it_wrong()` das duas recusas (P7: opcional). */
  readonly avisar?: RelatorDeUsoIndevido;
}

/**
 * `add_shortcode( $tag, $callback )` (`wp-includes/shortcodes.php:63`).
 *
 * Devolve o registro novo. **Recusa silenciosa em dois casos**, e nos dois o
 * legado avisa e sai sem registrar (`return;` em `:71` e `:85`), de modo que a
 * marca permanece literal no corpo — o que e exatamente **CA-8.2** chegando por
 * outro caminho:
 *
 * | recusa | legado | aviso |
 * |---|---|---|
 * | nome vazio depois de `trim()` | `:66-72` | *"Invalid shortcode name: Empty name given."* |
 * | nome com `& / < > [ ] =` ou controle | `:75-86` | *"Invalid shortcode name: %1$s. Do not use spaces or reserved characters: %2$s"* |
 *
 * ⚠️ **Marca repetida: a ultima vence**, e o docblock do legado e literal — *"In
 * the event of a duplicated tag, the tag loaded last will take precedence"*
 * (`:48-49`). O `Map` reescreve o valor **mantendo a posicao original** da
 * chave, que e o que `$shortcode_tags[ $tag ] = $callback` (`:89`) faz no
 * arranjo do interpretador, e a posicao e observavel pela ordem da alternancia.
 */
export function adicionarMacro(
  registro: RegistroDeMacros,
  marca: string,
  tratador: MacroRegistrada,
  opcoes: OpcoesDoRegistro = {},
): RegistroDeMacros {
  if (ESPACO_DO_TRIM.test(marca)) {
    opcoes.avisar?.({
      funcao: 'add_shortcode',
      mensagem: 'Invalid shortcode name: Empty name given.',
      versao: '4.4.0',
    });
    return registro;
  }

  if (CARACTERE_RECUSADO_NA_MARCA.test(marca)) {
    opcoes.avisar?.({
      funcao: 'add_shortcode',
      // `sprintf` de `:78-83`, com a lista de `:82` — que nao nomeia os
      // controles, embora a expressao de `:75` os recuse.
      mensagem: `Invalid shortcode name: ${marca}. Do not use spaces or reserved characters: & / < > [ ] =`,
      versao: '4.4.0',
    });
    return registro;
  }

  const novo = new Map(registro);
  novo.set(marca, tratador);
  return Object.freeze(novo);
}

/**
 * `remove_shortcode( $tag )` (`:101`) — `unset( $shortcode_tags[ $tag ] )`.
 *
 * Marca que nao esta registrada nao e erro: `unset()` de chave ausente e
 * silencioso, e e por isso que esta funcao nao avisa nem recusa.
 */
export function removerMacro(
  registro: RegistroDeMacros,
  marca: string,
): RegistroDeMacros {
  if (!registro.has(marca)) {
    return registro;
  }
  const novo = new Map(registro);
  novo.delete(marca);
  return Object.freeze(novo);
}

/**
 * `remove_all_shortcodes()` (`:117`) — o global recebe arranjo vazio.
 *
 * O docblock do legado explica por que e substituicao e nao laco: *"This is
 * actually an efficient method for removing all shortcodes"* (`:108-109`).
 */
export function removerTodasAsMacros(): RegistroDeMacros {
  return REGISTRO_SEM_MACROS;
}

/**
 * `shortcode_exists( $tag )` (`:133`) — `array_key_exists`, e **nao**
 * `is_callable`.
 *
 * ⚠️ A diferenca e observavel: a marca registrada com tratador quebrado existe
 * para esta funcao, entra na alternancia da expressao e so e recusada la dentro,
 * por `do_shortcode_tag()`. Ver {@link MacroRegistrada}.
 */
export function macroExiste(registro: RegistroDeMacros, marca: string): boolean {
  return registro.has(marca);
}

/**
 * A lista de marcas registradas, na ordem de insercao — **CA-8.5**.
 *
 * E `array_keys( $shortcode_tags )`, que o legado usa em tres lugares: ao montar
 * a alternancia da expressao (`:328`), ao recortar as marcas presentes no corpo
 * (`:256`) e ao montar a lista de remocao de `strip_shortcodes()` (`:718`). A
 * forma da inspecao e essa — o registro e dado publico, lido por nome. Nao ha,
 * no legado, tela que a mostre, e inventar uma seria inventar superficie que o
 * produto nao tem.
 */
export function marcasRegistradas(registro: RegistroDeMacros): readonly string[] {
  return Object.freeze([...registro.keys()]);
}

/**
 * `is_callable( $shortcode_tags[ $tag ] )` (`:403`), restrita ao que
 * {@link MacroRegistrada} admite.
 */
export function chamavelComoNoPhp(
  tratador: MacroRegistrada | undefined,
): tratador is TratadorDeMacro {
  return typeof tratador === 'function';
}
