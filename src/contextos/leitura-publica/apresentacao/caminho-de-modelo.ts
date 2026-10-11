/**
 * As funcoes de caminho da plataforma de que a escolha de apresentacao depende:
 * `wp_normalize_path()` (`wp-includes/functions.php:2194-2224`),
 * `untrailingslashit()` e `trailingslashit()`
 * (`wp-includes/formatting.php:2825-2842`) e `validate_file()`
 * (`wp-includes/functions.php:6372-6408`).
 *
 * Entrega de **T005** (US-2).
 *
 * ---
 *
 * ## Por que estao aqui, e nao em `plataforma/`
 *
 * Pela mesma razao de `../consulta/semantica-de-php.ts`: a pasta nao existe, e
 * criar camada e decisao de quem tiver as 15 features na mao. Sao quatro
 * irmaos esperando a pasta agora — `semantica-de-php.ts`,
 * `../traducao-de-endereco/cadeia-de-consulta.ts`,
 * `contextos/conteudo/gravacao/verdade-de-php.ts` e este —, e nenhum importa o
 * outro porque a regra de dependencia 3 proibe `contextos/<a>/` importar
 * `contextos/<b>/`.
 *
 * ## As tres funcoes decidem coisas diferentes, e nenhuma e enfeite
 *
 * | funcao | onde decide nesta feature |
 * |---|---|
 * | `normalizarCaminho` | `_wp_is_template_path_allowed()` normaliza antes de procurar `..` (`template.php:717`) e antes de comparar diretorio (`:728` e `:754`) |
 * | `comBarraNoFim` | a comparacao de prefixo de `:754` so e correta com a barra: sem ela, `/tema-x` casaria `/tema-xyz/modelo.php` |
 * | `validarArquivo` | o modelo declarado no conteudo so entra na hierarquia se `0 === validate_file()` (`template.php:488` e `:560`) |
 *
 * ## 🔴 Uma lacuna declarada: o involucro de fluxo
 *
 * `wp_normalize_path()` abre separando o involucro de fluxo do caminho
 * (`functions.php:2205-2209`, `wp_is_stream()`), e `wp_is_stream()` pergunta a
 * lista de involucros **registrados no interpretador**
 * (`stream_get_wrappers()`). O corpo dessa lista nao esta na arvore analisada, e
 * nenhum caminho de tema do nucleo e um fluxo: a divergencia de borda e do
 * oraculo executavel (`ESC-ORACULO`, `BR-MIGRAR-116`, resposta 16), como a do
 * `mangling` de `parse_str`. Aqui o caminho e normalizado inteiro.
 */

/**
 * `wp_normalize_path( $caminho )` (`wp-includes/functions.php:2211-2222`).
 *
 * Tres passos, na ordem do legado:
 *
 * 1. toda barra invertida vira barra (`:2212`);
 * 2. corrida de barras vira uma so — **menos** a do comeco, que o legado
 *    preserva de proposito, *"allowing for network shares having two
 *    slashes"* (`:2215`, com o `(?<=.)` da expressao);
 * 3. letra de unidade do Windows vai para maiuscula (`:2218-2220`).
 *
 * ⚠️ O `.` do passo 2 nao casa quebra de linha no dialeto do legado, logo um
 * caminho que **comece** com quebra de linha tem as barras seguintes
 * preservadas. Esta reproduzido: a classe negada da expressao abaixo e
 * exatamente isso.
 */
export function normalizarCaminho(caminho: string): string {
  let normalizado = caminho.replace(/\\/g, '/');
  normalizado = normalizado.replace(/(?<=[^\n])\/+/g, '/');
  if (normalizado.slice(1, 2) === ':') {
    normalizado = normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
  }
  return normalizado;
}

/** `untrailingslashit( $valor )` — `rtrim( $valor, '/\\' )` (`formatting.php:2841`). */
export function semBarraNoFim(valor: string): string {
  return valor.replace(/[/\\]+$/, '');
}

/** `trailingslashit( $valor )` (`formatting.php:2826`). */
export function comBarraNoFim(valor: string): string {
  return `${semBarraNoFim(valor)}/`;
}

/**
 * `validate_file( $arquivo, $permitidos )`
 * (`wp-includes/functions.php:6372-6408`).
 *
 * Devolve **numero**, e nao booleano, e os quatro valores sao parte do contrato
 * publico — os dois chamadores desta feature testam `0 === validate_file(...)`
 * (`template.php:488`, `:493` e `:560`), logo qualquer codigo diferente de zero
 * tira o modelo declarado da hierarquia:
 *
 * | valor | motivo | legado |
 * |---|---|---|
 * | `0` | o caminho serve, **ou** nao e texto, **ou** e texto vazio | `:6374` e `:6407` |
 * | `1` | `../` sozinho, mais de uma vez, ou em posicao que nao e o fim | `:6384`, `:6389` e `:6394` |
 * | `2` | caminho absoluto com letra de unidade do Windows | `:6404` |
 * | `3` | caminho fora da lista de permitidos, quando ha lista | `:6399` |
 *
 * ⚠️ **Valor nao escalar e texto vazio devolvem ZERO, isto e "valido"**
 * (`:6373-6375`). Parece defeito e nao e: quem chama nesta feature ja testou a
 * verdade do valor antes (`if ( $template && 0 === validate_file( $template ) )`),
 * e o zero aqui nunca chega a liberar caminho vazio. Trocar por um codigo de
 * erro "mais correto" mudaria o retorno de uma funcao publicada (P8).
 */
export function validarArquivo(
  arquivo: string,
  permitidos: readonly string[] = [],
): number {
  if (arquivo === '') {
    return 0;
  }

  const caminho = normalizarCaminho(arquivo);
  const listaPermitida = permitidos.map(normalizarCaminho);

  // `'../' === $file` (`:6383`).
  if (caminho === '../') {
    return 1;
  }

  // `preg_match_all( '#\.\./#', ... ) && count( $matches ) > 1` (`:6388`).
  const ocorrencias = caminho.match(/\.\.\//g);
  if (ocorrencias !== null && ocorrencias.length > 1) {
    return 1;
  }

  // `str_contains( $file, '../' ) && '../' !== mb_substr( $file, -3, 3 )` (`:6393`).
  if (caminho.includes('../') && caminho.slice(-3) !== '../') {
    return 1;
  }

  // `! empty( $allowed_files ) && ! in_array( $file, $allowed_files, true )` (`:6398`).
  if (listaPermitida.length > 0 && !listaPermitida.includes(caminho)) {
    return 3;
  }

  // `':' === substr( $file, 1, 1 )` (`:6403`).
  if (caminho.slice(1, 2) === ':') {
    return 2;
  }

  return 0;
}
