/**
 * Os criterios **da consulta** — o que `WP_Query::fill_query_vars()`
 * (`wp-includes/class-wp-query.php:580-652`) completa e o que o bloco de
 * normalizacao de `parse_query()` (`:820-890` e `:1123-1139`) molda.
 *
 * Entrega de **T003** (US-1, CA-1.2).
 *
 * ---
 *
 * ## Por que este tipo nao e `CriteriosDeConsulta`, e por que a diferenca importa
 *
 * `../requisicao/endereco-pedido.ts` declara `CriteriosDeConsulta` como `string`
 * ou lista de `string`, e esta certo: e isso que `WP::parse_request()` produz,
 * porque ele converte **todo** escalar com `(string)`
 * (`wp-includes/class-wp.php:338-347`). Os criterios da consulta sao outra
 * coisa: `parse_query` passa nove deles por `absint()` e dois por
 * `preg_replace()`, logo `?p=42` entra na resolucao como o texto `'42'` e chega a
 * consulta como o **numero** 42.
 *
 * A diferenca e observavel em duas pontas: `WP::register_globals()`
 * (`class-wp.php:662-683`) publica `$wp_query->query_vars` para o tema, e o
 * ponto de extensao `parse_query` (`:1164`) recebe a instancia inteira. Um porte
 * que usasse o mesmo tipo nas duas pontas entregaria texto onde o tema espera
 * numero.
 *
 * ## O que `fill_query_vars()` faz, e por que nao e enfeite
 *
 * Ele preenche **52** nomes que nao chegaram: 36 com texto vazio e 16 com
 * arranjo vazio. Sem isso, metade dos testes de `parse_query` seria sobre chave
 * ausente, e o legado nao tem nenhum: todo teste de `:824` em diante le a chave
 * como se ela existisse. E a lista nao e a dos nomes de criterio de
 * `../traducao-de-endereco/nomes-de-criterio.ts` — ha nome aqui que nao e
 * publico nem privado (`meta_key`, `meta_value`, `post_name__in`,
 * `search_columns`, `menu_order`, `author__in`, `author__not_in`) e nome la que
 * nao e preenchido aqui (`posts`, `withcomments`, `order`, `orderby`, `cpage`,
 * `robots`, `favicon`, `taxonomy`, `term`, `calendar`). As duas listas sao
 * transcricao, nao derivacao.
 *
 * ⚠️ **`cat` nao tem guarda de escalar, e os outros tem.** `:846` e
 * `$query_vars['cat'] = preg_replace( '|[^0-9,-]|', '', $query_vars['cat'] )`
 * sem o `is_scalar( ... ) ?` que `:847` poe no `author` — e `preg_replace` com
 * arranjo como assunto devolve **arranjo**, com a substituicao feita em cada
 * elemento. Logo `?cat[]=5&cat[]=x7` sobrevive como arranjo ate `:1237`, onde
 * `parse_tax_query` o junta com virgula. Por a guarda aqui "por simetria"
 * descartaria o criterio.
 */

import {
  chaveSaneada,
  escalarComoNoPhp,
  inteiroAbsoluto,
  inteiroComoNoPhp,
  vazioComoNoPhp,
  type EscalarDaConsulta,
  type ValorDaConsulta,
} from './semantica-de-php.js';

export type { EscalarDaConsulta, ValorDaConsulta } from './semantica-de-php.js';

/**
 * O conjunto de criterios de uma consulta de conteudo — o
 * `WP_Query::$query_vars` do legado.
 *
 * Dicionario pela mesma razao de `CriteriosDeConsulta`: a lista de nomes e
 * extensivel em execucao, e o ponto de extensao `request` pode ter posto
 * qualquer nome.
 */
export interface CriteriosDaConsulta {
  readonly [nome: string]: ValorDaConsulta | undefined;
}

/**
 * Os **36** nomes que `fill_query_vars()` completa com texto vazio, na ordem de
 * `wp-includes/class-wp-query.php:581-618`.
 *
 * A ordem e de insercao, e e observavel: `$this->query_vars` e serializado em
 * `:1154` para formar `query_vars_hash`, e esse valor decide se `parse_query`
 * precisa reanalisar.
 */
export const NOMES_PREENCHIDOS_COMO_TEXTO: readonly string[] = Object.freeze([
  'error',
  'm',
  'p',
  'post_parent',
  'subpost',
  'subpost_id',
  'attachment',
  'attachment_id',
  'name',
  'pagename',
  'page_id',
  'second',
  'minute',
  'hour',
  'day',
  'monthnum',
  'year',
  'w',
  'category_name',
  'tag',
  'cat',
  'tag_id',
  'author',
  'author_name',
  'feed',
  'tb',
  'paged',
  'meta_key',
  'meta_value',
  'preview',
  's',
  'sentence',
  'title',
  'fields',
  'menu_order',
  'embed',
]);

/**
 * Os **16** nomes que `fill_query_vars()` completa com arranjo vazio, na ordem
 * de `wp-includes/class-wp-query.php:626-643`.
 */
export const NOMES_PREENCHIDOS_COMO_ARRANJO: readonly string[] = Object.freeze([
  'category__in',
  'category__not_in',
  'category__and',
  'post__in',
  'post__not_in',
  'post_name__in',
  'tag__in',
  'tag__not_in',
  'tag__and',
  'tag_slug__in',
  'tag_slug__and',
  'post_parent__in',
  'post_parent__not_in',
  'author__in',
  'author__not_in',
  'search_columns',
]);

/** O arranjo vazio que os 16 nomes recebem. Um por chave, e congelado. */
const ARRANJO_VAZIO: readonly EscalarDaConsulta[] = Object.freeze([]);

/**
 * O teto de tamanho do termo de busca — *"Fairly large, potentially too large,
 * upper bound for search string lengths"* (`class-wp-query.php:876-877`).
 *
 * E numero do legado (P6), e o efeito dele e **descartar** o termo, nao recusar
 * a requisicao: acima de 1.600 bytes, `s` vira texto vazio e a consulta deixa de
 * ser busca.
 *
 * ⚠️ A contagem e de **bytes**, porque `strlen()` conta bytes: um termo de 900
 * caracteres acentuados tem 1.800 bytes e e descartado, e o mesmo termo em
 * ASCII passa. Usar `String.length` aqui trocaria a borda.
 */
export const TETO_DO_TERMO_DE_BUSCA = 1600;

/** `strlen()` — bytes, nao unidades de codigo. */
function tamanhoEmBytes(texto: string): number {
  return new TextEncoder().encode(texto).length;
}

/**
 * `trim()` com a lista de caracteres padrao do interpretador:
 * espaco, tabulacao, nova linha, retorno de carro, byte nulo e tabulacao
 * vertical. Nao e o `String.prototype.trim`, que tira tambem espaco unicode.
 */
function recortarComoNoPhp(texto: string): string {
  return texto
    .replace(/^[ \t\n\r\u0000\u000B]+/, '')
    .replace(/[ \t\n\r\u0000\u000B]+$/, '');
}

/** `preg_replace( '|[^0-9]|', '', $x )` de `class-wp-query.php:844`. */
function somenteDigitos(valor: EscalarDaConsulta): string {
  return String(valor).replace(/[^0-9]/g, '');
}

/**
 * `preg_replace( '|[^0-9,-]|', '', $x )` de `class-wp-query.php:846` e `:847`.
 *
 * Mantem digito, virgula e hifen: e a forma *"lista separada por virgula de
 * inteiros positivos ou negativos"* que o proprio comentario do legado declara.
 */
function somenteListaDeInteiros(valor: EscalarDaConsulta): string {
  return String(valor).replace(/[^0-9,-]/g, '');
}

/**
 * `fill_query_vars()` (`wp-includes/class-wp-query.php:580-652`).
 *
 * Completa os 52 nomes ausentes e **nao toca** em nome que chegou — nem para
 * converter, nem para validar. A validacao e de {@link normalizarCriterios}, que
 * e o bloco seguinte do legado.
 */
export function preencherCriterios(
  criterios: CriteriosDaConsulta,
): Record<string, ValorDaConsulta> {
  const completo: Record<string, ValorDaConsulta> = { ...criterios } as Record<
    string,
    ValorDaConsulta
  >;

  for (const nome of NOMES_PREENCHIDOS_COMO_TEXTO) {
    if (completo[nome] === undefined) {
      completo[nome] = '';
    }
  }
  for (const nome of NOMES_PREENCHIDOS_COMO_ARRANJO) {
    if (completo[nome] === undefined) {
      completo[nome] = ARRANJO_VAZIO;
    }
  }

  return completo;
}

/**
 * O bloco de normalizacao de `parse_query()` —
 * `wp-includes/class-wp-query.php:832-891`.
 *
 * Trabalha **no lugar**, sobre o arranjo que {@link preencherCriterios}
 * devolveu, porque no legado `$query_vars` e referencia (`:821`) e o que vem
 * depois le os valores ja moldados.
 *
 * A unica saida alem dos criterios e o erro: `:832-834` poe `error` em `'404'`
 * quando `p` nao e escalar ou e negativo, e quem le esse `error` e `:1148`, no
 * fim de `parse_query`.
 */
export function normalizarCriterios(
  criterios: Record<string, ValorDaConsulta>,
): void {
  // `:832-837` — `p` negativo ou nao escalar nao e "zero": e 404.
  const p = criterios['p'];
  if (!escalarComoNoPhp(p) || inteiroComoNoPhp(p) < 0) {
    criterios['p'] = 0;
    criterios['error'] = '404';
  } else {
    criterios['p'] = inteiroComoNoPhp(p);
  }

  // `:839-845` — seis nomes por `absint()`, com a guarda de escalar.
  for (const nome of ['page_id', 'year', 'monthnum', 'day', 'w', 'paged']) {
    const valor = criterios[nome];
    criterios[nome] = escalarComoNoPhp(valor) ? inteiroAbsoluto(valor) : 0;
  }

  // `:844` — `m` guarda so digito.
  const m = criterios['m'];
  criterios['m'] = escalarComoNoPhp(m) ? somenteDigitos(m) : '';

  // `:846` — `cat` SEM guarda de escalar: arranjo sobrevive como arranjo.
  const cat = criterios['cat'];
  criterios['cat'] = escalarComoNoPhp(cat)
    ? somenteListaDeInteiros(cat)
    : (cat ?? []).map(somenteListaDeInteiros);

  // `:847` — `author` COM guarda.
  const autor = criterios['author'];
  criterios['author'] = escalarComoNoPhp(autor)
    ? somenteListaDeInteiros(autor)
    : '';

  // `:848-850` — os tres recortes.
  for (const nome of ['pagename', 'name', 'title']) {
    const valor = criterios[nome];
    criterios[nome] = escalarComoNoPhp(valor)
      ? recortarComoNoPhp(String(valor))
      : '';
  }

  // `:852-874` — quatro nomes em que vazio **continua** vazio, e nao zero. A
  // diferenca decide `'' !== $query_vars['hour']` em `:918`: um zero ali faria
  // `/2026/` virar consulta de hora.
  for (const nome of ['hour', 'minute', 'second', 'menu_order']) {
    const valor = criterios[nome];
    criterios[nome] =
      escalarComoNoPhp(valor) && valor !== '' ? inteiroAbsoluto(valor) : '';
  }

  // `:877-879` — o termo de busca grande e **descartado**, nao recusado.
  const s = criterios['s'];
  if (
    !escalarComoNoPhp(s) ||
    (!vazioComoNoPhp(s) && tamanhoEmBytes(String(s)) > TETO_DO_TERMO_DE_BUSCA)
  ) {
    criterios['s'] = '';
  }

  // `:881-887` — os dois nomes herdados que viram anexo. O teste e `!= ''`, e
  // nao `! empty()`: o texto `'0'` **passa**, e `subpost=0` vira
  // `attachment=0`.
  const subpost = criterios['subpost'];
  if (escalarComoNoPhp(subpost) && String(subpost) !== '') {
    criterios['attachment'] = subpost;
  }
  const subpostId = criterios['subpost_id'];
  if (escalarComoNoPhp(subpostId) && String(subpostId) !== '') {
    criterios['attachment_id'] = subpostId;
  }

  // `:889` — depois dos dois acima, e nao antes.
  const anexoId = criterios['attachment_id'];
  criterios['attachment_id'] = escalarComoNoPhp(anexoId)
    ? inteiroAbsoluto(anexoId)
    : 0;
}

/**
 * O saneamento de `post_type` e `post_status` —
 * `wp-includes/class-wp-query.php:1123-1139`.
 *
 * Roda **depois** dos predicados, e nao antes: o `! empty( $query_vars['post_type'] )`
 * de `:1003`, que decide `is_post_type_archive`, le o valor **cru**. Quem
 * trocasse a ordem faria um `post_type` com maiuscula deixar de casar o registro.
 *
 * Tres detalhes:
 *
 * 1. Em arranjo, o legado tira duplicata **antes** de sanear e **ordena** depois
 *    (`:1125-1126` e `:1134-1135`) — a ordem do arranjo e observavel na consulta
 *    montada.
 * 2. `post_type` em texto passa por `sanitize_key()`; `post_status` em texto
 *    passa por `preg_replace( '|[^a-z0-9_,-]|', '', ... )`, que **nao** baixa a
 *    caixa. Logo `post_status=Publish` vira `ublish` e `post_type=Post` vira
 *    `post`. Sao duas regras diferentes para o mesmo formato de valor, e e assim
 *    no legado.
 * 3. A ordenacao e a de texto do interpretador, que para os valores deste
 *    dominio — chave saneada, so ASCII — coincide com a ordem de unidade de
 *    codigo.
 */
export function sanearTipoEEstado(
  criterios: Record<string, ValorDaConsulta>,
): void {
  const tipo = criterios['post_type'];
  if (!vazioComoNoPhp(tipo) && tipo !== undefined) {
    if (escalarComoNoPhp(tipo)) {
      criterios['post_type'] = chaveSaneada(tipo);
    } else {
      criterios['post_type'] = [...new Set(tipo)]
        .map((valor) => chaveSaneada(valor))
        .sort();
    }
  }

  const estado = criterios['post_status'];
  if (!vazioComoNoPhp(estado) && estado !== undefined) {
    if (escalarComoNoPhp(estado)) {
      criterios['post_status'] = String(estado).replace(/[^a-z0-9_,-]/g, '');
    } else {
      criterios['post_status'] = [...new Set(estado)]
        .map((valor) => chaveSaneada(valor))
        .sort();
    }
  }
}
