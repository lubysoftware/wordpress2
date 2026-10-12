/**
 * A forma do pedido de traducao: **as quatro entradas do legado, declaradas e
 * nao implementadas.**
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * US-4 e **T009**; os seis testes do catalogo (UT-166-1 a UT-166-6) sao **T010**.
 *
 * ---
 *
 * ## Por que sao quatro formas, e nao uma com campos opcionais
 *
 * O legado tem quatro entradas, e a diferenca entre elas e **o que elas pedem ao
 * catalogo**, nao acucar de chamada:
 *
 * | legado | ancora | o que muda |
 * |---|---|---|
 * | `__( $text, $domain )` | `wp-includes/l10n.php:306` | so o texto |
 * | `_x( $text, $context, $domain )` | `:409` | o mesmo texto pode ter traducao diferente por **contexto** declarado |
 * | `_n( $single, $plural, $number, $domain )` | `:483` | o catalogo escolhe a forma pela **expressao de plural** do idioma |
 * | `_nx( $single, $plural, $number, $context, $domain )` | `:542` | as duas coisas de uma vez |
 *
 * Todas desembocam em `translate()` (`:194`) ou `translate_plural()`, que pedem
 * ao catalogo do dominio (`get_translations_for_domain()`, `:1481`). Fundir as
 * quatro numa so com campos opcionais perderia a unica informacao que importa —
 * se ha contexto e se ha contagem —, e e justamente o que CA-4.5 cobra: *"texto
 * com numero e com ordem de palavras variavel e tratado por **forma declarada**,
 * nao por concatenacao"*.
 *
 * ⚠️ **`_e()` nao esta nesta lista, e a ausencia e proposital.** No legado
 * (`:352`) ele **imprime** em vez de devolver, e imprimir e a borda — o que
 * nesta arvore e `apresentacao`/`telas`, nao a traducao. A funcao existe e e
 * contrato publico (P8), logo alguem vai declara-la; quem a declarar faz isso
 * onde a saida e emitida, nao aqui.
 *
 * ---
 *
 * ## O que esta forma deliberadamente nao resolve
 *
 * **A interpolacao.** CA-4.5 fala de *"ordem de palavras variavel"*, e no legado
 * isso e `sprintf` com marcador posicional (`%1$s`, `%2$s`) **do lado de quem
 * chama**, depois da traducao: a string traduzida e o molde. Logo o pedido de
 * traducao nao carrega os valores a interpolar, e nao devolve texto interpolado
 * — quem interpola e o chamador, como hoje. Declarar interpolacao aqui mudaria a
 * fronteira entre traducao e formatacao, e `plataforma/escape/` (*"formatacao e
 * escape de saida"*) e outro componente do desenho.
 */

/**
 * O dominio do catalogo (o *text domain* do legado).
 *
 * `'default'` e o do nucleo, como em toda assinatura de `l10n.php`. Conjunto
 * aberto: cada extensao traz o seu, e e disso que `load_textdomain()` vive
 * (`wp-includes/l10n.php:726`).
 */
export type Dominio = string;

/** O codigo de idioma, na forma em que o legado o grava (`pt_BR`, `en_US`). */
export type Idioma = string;

/** Pedido simples: so o texto. A forma de `__()`. */
export interface PedidoDeTexto {
  readonly forma: 'texto';
  readonly texto: string;
  readonly dominio: Dominio;
}

/** Pedido com contexto declarado. A forma de `_x()`. */
export interface PedidoComContexto {
  readonly forma: 'com-contexto';
  readonly texto: string;
  /** O contexto declarado no catalogo, que desambigua o mesmo texto. */
  readonly contexto: string;
  readonly dominio: Dominio;
}

/** Pedido com contagem. A forma de `_n()`. */
export interface PedidoComPlural {
  readonly forma: 'com-plural';
  readonly singular: string;
  readonly plural: string;
  /** A contagem que a expressao de plural do idioma consome. */
  readonly numero: number;
  readonly dominio: Dominio;
}

/** Pedido com contagem e contexto. A forma de `_nx()`. */
export interface PedidoComPluralEContexto {
  readonly forma: 'com-plural-e-contexto';
  readonly singular: string;
  readonly plural: string;
  readonly numero: number;
  readonly contexto: string;
  readonly dominio: Dominio;
}

/**
 * Qualquer um dos quatro pedidos.
 *
 * O campo `forma` discrimina, e e por ele que T009 vai resolver sem precisar
 * adivinhar qual entrada foi usada.
 */
export type PedidoDeTraducao =
  | PedidoDeTexto
  | PedidoComContexto
  | PedidoComPlural
  | PedidoComPluralEContexto;
