/**
 * A semantica da linguagem de origem de que `WP_Query::parse_query()` depende —
 * `empty()`, `is_scalar()`, `is_numeric()`, o molde `(int)`, `absint()` e a
 * igualdade fraca `==`.
 *
 * Entrega de **T003** (US-1). Nenhuma destas funcoes esta em `wp-includes/`:
 * cinco sao do interpretador e uma, `absint()`, e uma linha
 * (`wp-includes/load.php:1468-1470`, `abs( (int) $maybeint )`). E a mesma
 * fronteira que `../traducao-de-endereco/cadeia-de-consulta.ts` registra para
 * `parse_str` e `urlencode`: o corpo nao esta na arvore analisada, e a
 * divergencia de borda so aparece no oraculo executavel (`ESC-ORACULO`,
 * `BR-MIGRAR-116`, resposta 16 — T001 da feature `015`).
 *
 * ---
 *
 * ## Por que isto nao mora em `plataforma/utilitarios/`
 *
 * Porque a pasta nao existe, e criar camada e decisao de quem tiver as 15
 * features na mao. `contextos/conteudo/gravacao/verdade-de-php.ts` registrou
 * exatamente esta espera, com o gemeo dele em `BC-05`, e a nota de la vale aqui:
 * *"quando `plataforma/utilitarios/` existir (regra de dependencia 5), as duas
 * descem juntas e nenhuma chamada muda de resultado"*. Ficam **tres** irmaos
 * esperando a pasta, e nenhum deles importa o outro, porque a regra de
 * dependencia 3 proibe `contextos/<a>/` importar `contextos/<b>/`.
 *
 * `vazioNoLegado()` de `../traducao-de-endereco/casar-endereco.ts` e o mesmo
 * predicado restrito a texto, e **continua onde esta**: ele e contrato ja
 * mesclado e exportado pelo barril do modulo. {@link vazioComoNoPhp} e a versao
 * que aceita tudo que um criterio de consulta pode ser.
 *
 * ## ⚠️ O molde `(int)` nao e `Number()`, e a diferenca decide enderecos
 *
 * `(int) '12abc'` e **12** no interpretador e `NaN` em `Number()`. Com `absint()`
 * aparecendo nove vezes em `parse_query`, um porte que usasse `Number()` faria
 * `?page_id=12abc` virar `NaN` em lugar de `12` — e `NaN` nao e falso no teste
 * `if ( $query_vars['page_id'] )`, logo a requisicao viraria uma consulta de
 * pagina com identificador que nenhuma linha tem.
 */

/** Um valor escalar de criterio, como `is_scalar()` o reconhece aqui. */
export type EscalarDaConsulta = string | number;

/** O valor de um criterio de consulta depois da analise. */
export type ValorDaConsulta = EscalarDaConsulta | readonly EscalarDaConsulta[];

/**
 * `is_scalar( $valor )` para o que um criterio pode ser.
 *
 * Arranjo nao e escalar, e e so isso que `parse_query` pergunta: os nove
 * `is_scalar( ... ) ? absint( ... ) : 0` de `class-wp-query.php:839-874` existem
 * porque um criterio pode chegar como arranjo pela requisicao (`?p[]=1`), e
 * `absint()` de arranjo seria erro de tipo no interpretador.
 */
export function escalarComoNoPhp(
  valor: ValorDaConsulta | undefined,
): valor is EscalarDaConsulta {
  return typeof valor === 'string' || typeof valor === 'number';
}

/**
 * `empty( $valor )` para o que um criterio pode ser.
 *
 * Ausencia, texto vazio, **o texto `'0'`**, o numero zero e arranjo vazio sao
 * vazios. Todo o resto nao e — inclusive `'0.0'`, `' '` e `'false'`.
 *
 * O `'0'` e o caso que um porte perde em silencio, e nesta feature ele decide
 * tres coisas: `! empty( $query_vars['page'] )` no ramo de paginacao de corpo de
 * `class-wp.php:763`, `! empty( $query_vars['cat'] )` em
 * `class-wp-query.php:1243` e `empty( $query_vars['author'] )` em `:993`.
 */
export function vazioComoNoPhp(valor: ValorDaConsulta | undefined): boolean {
  if (valor === undefined) {
    return true;
  }
  if (typeof valor === 'number') {
    return valor === 0;
  }
  if (typeof valor === 'string') {
    return valor === '' || valor === '0';
  }
  return valor.length === 0;
}

/** O prefixo numerico que o molde `(int)` do interpretador consome. */
const PREFIXO_NUMERICO = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/;

/** O que `is_numeric()` aceita por inteiro, com o espaco das duas pontas. */
const NUMERO_INTEIRO_DE_PONTA_A_PONTA =
  /^[ \t\n\r\v\f]*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?[ \t\n\r\v\f]*$/;

/**
 * O molde `(int)` do interpretador.
 *
 * Le o prefixo numerico e **para no primeiro caractere que nao serve**, sem erro
 * e sem aviso: `'12abc'` da 12, `'abc'` da 0, `'3.9'` da 3 (trunca, nao
 * arredonda) e `'1e3'` da 1000 — a notacao exponencial passou a ser lida pelo
 * molde na versao 7 do interpretador, e o legado exige essa versao.
 *
 * 🔴 O que **nao** esta reproduzido e o estouro de inteiro: la o valor acima do
 * limite da plataforma satura, aqui o numero segue em dupla precisao. Nenhum
 * criterio desta feature chega perto, e o caso e do oraculo executavel.
 */
export function inteiroComoNoPhp(valor: EscalarDaConsulta): number {
  if (typeof valor === 'number') {
    return Math.trunc(valor);
  }
  const achado = PREFIXO_NUMERICO.exec(valor);
  if (achado === null) {
    return 0;
  }
  const numero = Number(achado[0]);
  return Number.isFinite(numero) ? Math.trunc(numero) : 0;
}

/** `absint( $x )` — `abs( (int) $x )` (`wp-includes/load.php:1469`). */
export function inteiroAbsoluto(valor: EscalarDaConsulta): number {
  return Math.abs(inteiroComoNoPhp(valor));
}

/**
 * `is_numeric( $valor )`.
 *
 * Usada no ramo de autor de `handle_404` (`class-wp.php:788`:
 * `is_numeric( $author ) && $author > 0`) e em `wp_checkdate()`
 * (`wp-includes/functions.php:7529`). Numero e sempre numerico; texto precisa
 * ser numero **de ponta a ponta**, com espaco permitido nas duas pontas.
 */
export function numericoComoNoPhp(valor: ValorDaConsulta | undefined): boolean {
  if (typeof valor === 'number') {
    return Number.isFinite(valor);
  }
  if (typeof valor !== 'string') {
    return false;
  }
  return NUMERO_INTEIRO_DE_PONTA_A_PONTA.test(valor);
}

/**
 * A igualdade fraca `==` entre dois escalares, como o legado a usa nesta feature.
 *
 * Tres pontos de chamada, e os tres compararia errado com `===`:
 *
 * | legado | o caso |
 * |---|---|
 * | `'0' == $query_vars['author']` (`class-wp-query.php:993`) | `'00'` e `'0.0'` sao **iguais** a `'0'`, porque dois textos numericos comparam como numero |
 * | `get_option( 'page_for_posts' ) == $this->queried_object_id` (`:1100`) | opcao e texto do banco, identificador e inteiro |
 * | `get_option( 'wp_page_for_privacy_policy' ) == $query_vars['page_id']` (`:1118`) | idem |
 *
 * ⚠️ A regra e a da versao 8 do interpretador: texto **nao** numerico comparado
 * com numero compara como **texto**, e nao mais convertendo o texto para zero.
 * E por isso que `0 == 'abc'` e falso aqui, e era verdadeiro antes da versao 8.
 */
export function iguaisComoNoPhp(
  primeiro: EscalarDaConsulta,
  segundo: EscalarDaConsulta,
): boolean {
  const primeiroNumerico = numericoComoNoPhp(primeiro);
  const segundoNumerico = numericoComoNoPhp(segundo);

  if (typeof primeiro === 'number' && typeof segundo === 'number') {
    return primeiro === segundo;
  }
  if (typeof primeiro === 'number') {
    return segundoNumerico
      ? primeiro === Number(segundo)
      : String(primeiro) === segundo;
  }
  if (typeof segundo === 'number') {
    return primeiroNumerico
      ? Number(primeiro) === segundo
      : primeiro === String(segundo);
  }
  if (primeiroNumerico && segundoNumerico) {
    return Number(primeiro) === Number(segundo);
  }
  return primeiro === segundo;
}

/**
 * `'' != $valor` — o teste fraco contra texto vazio, que `parse_query` usa cinco
 * vezes (`class-wp-query.php:1015`, `:1019`, `:1023`, `:1027` e `:1032`).
 *
 * ⚠️ **Nao e `! vazioComoNoPhp()`, e a diferenca aparece em tres valores.** Na
 * versao 8 do interpretador, `''` comparado com qualquer coisa que nao seja
 * texto compara **como texto**, e `(string)` de numero nunca da texto vazio.
 * Logo:
 *
 * | valor | `'' != $valor` | `! empty( $valor )` |
 * |---|---|---|
 * | `''` | falso | falso |
 * | `'0'` | **verdadeiro** | falso |
 * | `0` | **verdadeiro** | falso |
 * | `array()` | **verdadeiro** | falso |
 *
 * A consequencia observavel: `?feed=0` **e** um pedido de feed, e `?paged=0` nao
 * passa so porque o segundo teste de `:1027` exige `> 1`.
 */
export function diferenteDeVazioComoNoPhp(
  valor: ValorDaConsulta | undefined,
): boolean {
  if (valor === undefined) {
    return false;
  }
  return !(typeof valor === 'string' && valor === '');
}

/**
 * A comparacao regular do interpretador entre dois escalares, que e a que
 * `sort()` usa sem bandeira.
 *
 * ⚠️ **Dois textos numericos comparam como numero.** `sort( array( '10', '9' ) )`
 * devolve `'9', '10'` no interpretador e `'10', '9'` com o comparador padrao
 * deste runtime, que compara unidade de codigo. Isso importa em quatro pontos de
 * `parse_tax_query` — o `sort( $term )` de `class-wp-query.php:1212` e os
 * `sort( $query_vars['tag_slug__in'] )` de `:1338`, `:1349` e `:1392` —, onde um
 * identificador de termo numerico trocaria a ordem das clausulas, e a ordem das
 * clausulas chega ao SQL.
 */
export function compararComoNoPhp(
  primeiro: EscalarDaConsulta,
  segundo: EscalarDaConsulta,
): number {
  if (
    typeof primeiro === 'number' ||
    typeof segundo === 'number' ||
    (numericoComoNoPhp(primeiro) && numericoComoNoPhp(segundo))
  ) {
    const comoNumeroPrimeiro = Number(primeiro);
    const comoNumeroSegundo = Number(segundo);
    if (
      Number.isFinite(comoNumeroPrimeiro) &&
      Number.isFinite(comoNumeroSegundo)
    ) {
      return comoNumeroPrimeiro < comoNumeroSegundo
        ? -1
        : comoNumeroPrimeiro > comoNumeroSegundo
          ? 1
          : 0;
    }
  }
  const comoTextoPrimeiro = String(primeiro);
  const comoTextoSegundo = String(segundo);
  return comoTextoPrimeiro < comoTextoSegundo
    ? -1
    : comoTextoPrimeiro > comoTextoSegundo
      ? 1
      : 0;
}

/**
 * `checkdate( $mes, $dia, $ano )` por dentro de `wp_checkdate()`
 * (`wp-includes/functions.php:7527-7542`).
 *
 * O legado so chama o molde depois de confirmar que os tres sao numericos
 * (`:7529`), e e isso que esta funcao exige. O ano aceito pelo interpretador vai
 * de 1 a 32767; mes de 1 a 12; dia conforme o mes, com o ano bissexto do
 * calendario gregoriano.
 *
 * O ponto de extensao `wp_checkdate` (`:7541`) fica de fora, como os outros
 * deste modulo, enquanto `plataforma/barramento/` nao existe.
 */
export function dataValidaComoNoPhp(
  mes: ValorDaConsulta | undefined,
  dia: ValorDaConsulta | undefined,
  ano: ValorDaConsulta | undefined,
): boolean {
  if (
    !numericoComoNoPhp(mes) ||
    !numericoComoNoPhp(dia) ||
    !numericoComoNoPhp(ano)
  ) {
    return false;
  }

  const m = inteiroComoNoPhp(mes as EscalarDaConsulta);
  const d = inteiroComoNoPhp(dia as EscalarDaConsulta);
  const a = inteiroComoNoPhp(ano as EscalarDaConsulta);

  if (a < 1 || a > 32767 || m < 1 || m > 12 || d < 1) {
    return false;
  }

  const bissexto = (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
  const diasNoMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return d <= (diasNoMes[m - 1] as number);
}

/**
 * `sanitize_key( $chave )` (`wp-includes/formatting.php:2191-2197`).
 *
 * Minuscula, e **so** letra, digito, sublinhado e hifen sobrevivem. Valor nao
 * escalar devolve texto vazio, que e o `$sanitized_key = ''` de `:2192`.
 *
 * O ponto de extensao `sanitize_key` (`:2207`) fica de fora, pela mesma razao
 * dos outros.
 */
export function chaveSaneada(valor: ValorDaConsulta | undefined): string {
  if (!escalarComoNoPhp(valor)) {
    return '';
  }
  return String(valor).toLowerCase().replace(/[^a-z0-9_-]/g, '');
}
