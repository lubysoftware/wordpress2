/**
 * **CA-10.2**: *"A quantidade de versoes guardadas e configuravel, inclusive
 * para guardar todas"*.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Este e o
 * **ponto de configuracao nomeado** que o **P6** da constituicao cobra — *"cada
 * numero vive num ponto de configuracao nomeado, com o valor de fabrica do
 * legado, e existe teste que afirma o valor e o efeito da borda"* —, e o
 * cabecalho de `../README.md` ja o prometeu a esta tarefa: *"a contagem de
 * versoes guardadas (`WP_POST_REVISIONS`) (…) entram nas tarefas que os
 * implementam (T013, T023, **T021** e a feature 005)"*.
 *
 * A anotacao de `spec.md` para US-10 e literal: *"`WP_POST_REVISIONS` define
 * quantas versoes de um conteudo se guardam"*, e a tabela de rastreabilidade
 * aponta a linha do legado: `wp-includes/default-constants.php:392`.
 *
 * ---
 *
 * # O valor de fabrica e `true`, e `true` NAO quer dizer "ligado"
 *
 * ```php
 * if ( ! defined( 'WP_POST_REVISIONS' ) ) {
 *     define( 'WP_POST_REVISIONS', true );   // default-constants.php:392
 * }
 * ```
 *
 * e `wp_revisions_to_keep()` o traduz na primeira linha
 * (`wp-includes/revision.php:813`-`:818`):
 *
 * ```php
 * $num = WP_POST_REVISIONS;
 * if ( true === $num ) { $num = -1; } else { $num = (int) $num; }
 * ```
 *
 * Logo o numero de fabrica e **`-1`**, e `-1` e *"guardar todas"* — e o
 * *"inclusive para guardar todas"* de CA-10.2 e, no legado, **o default**, nao
 * uma opcao. A poda desiste antes de consultar o banco quando o limite e
 * negativo (`:225`-`:226`), que e o que torna `-1` literalmente ilimitado em vez
 * de muito grande.
 *
 * A comparacao `true === $num` e **identica**, e e por isso que
 * {@link limiteDaConstante} compara o booleano antes de qualquer coercao: a
 * cadeia `'true'`, que uma configuracao mal escrita produziria, **nao** entra
 * neste ramo — ela cai no `(int)`, que em PHP a le como `0`, o que **desliga** o
 * versionamento. Reproduzir isso nao e capricho: e a diferenca entre guardar
 * todas e nao guardar nenhuma, a partir do mesmo arquivo de configuracao.
 *
 * ---
 *
 * # Os tres valores de borda, e o que cada um faz
 *
 * | valor da constante | numero | efeito |
 * |---|---|---|
 * | `true` (**fabrica**) | `-1` | guarda **todas**: a poda desiste antes de consultar |
 * | `false` | `0` | **desliga** o versionamento: `wp_revisions_enabled()` e falso |
 * | `0` | `0` | idem — e e o que UT-029-6 cobra |
 * | `3` | `3` | guarda tres, e a poda apaga as mais antigas que passarem |
 *
 * `wp_revisions_enabled()` e uma linha so, e ela compara com zero e nao com
 * *"maior que zero"*: `return wp_revisions_to_keep( $post ) !== 0;`
 * (`wp-includes/revision.php:796`). E a comparacao **identica** de novo — e o
 * que faz `-1` contar como ligado.
 *
 * ⚠️ **Nenhum numero novo nasce aqui.** O P6 e literal na outra ponta: *"onde o
 * legado nao tem numero, o sistema novo tambem nao tem"*. Nao ha limite de
 * tamanho de versao, nao ha prazo de retencao de versao e nao ha limite de taxa
 * de gravacao — e introduzir qualquer um deles cai na tabela *Nao negociavel*.
 * O **unico** prazo que toca versao no legado e o dos 30 dias da lixeira, que
 * nao se aplica a ela (ver {@link GravacaoNaVersao.apagar}).
 */

import type { Conteudo } from '../armazenamento/index.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';

/**
 * O nome da constante do legado, como o dono do servidor a escreve em
 * `wp-config.php`.
 *
 * Declarado como dado porque e **superficie publicada** (P8): e por este nome
 * que toda documentacao de terceiro ensina a configurar o versionamento, e
 * renomea-lo cai na tabela *Nao negociavel*.
 */
export const CONSTANTE_DE_QUANTAS_VERSOES_GUARDAR = 'WP_POST_REVISIONS';

/**
 * O que a constante aceita: `true`, `false`, numero — ou **cadeia**, porque e o
 * que o `(int)` do legado tolera.
 */
export type ValorDeQuantasVersoesGuardar = boolean | number | string;

/**
 * O valor de fabrica: `true` (`wp-includes/default-constants.php:392`).
 *
 * **E `true`, e nao `-1`**, de proposito: o que o legado guarda na constante e o
 * booleano, e a traducao para `-1` acontece em
 * {@link limiteDaConstante}. Declarar `-1` aqui esconderia o ramo de comparacao
 * identica que decide entre guardar todas e desligar.
 */
export const QUANTAS_VERSOES_GUARDAR_DE_FABRICA: ValorDeQuantasVersoesGuardar =
  true;

/** `-1` — guardar todas, e a poda desiste antes de consultar o banco. */
export const VERSOES_ILIMITADAS = -1;

/** `0` — o versionamento desligado (`wp_revisions_enabled()` falso). */
export const VERSIONAMENTO_DESLIGADO = 0;

/**
 * `revisions` — o nome do suporte que o tipo de conteudo declara
 * (`register_post_type`, `wp-includes/post.php:49`).
 *
 * E o nome que `post_type_supports()` recebe nas **duas** perguntas deste
 * caminho: a de `wp_save_post_revision()` (`:146`) e a de
 * `wp_revisions_to_keep()` (`:821`). Fica declarado porque e contrato publico —
 * uma extensao liga versionamento no tipo dela com esta cadeia.
 */
export const SUPORTE_DE_VERSAO = 'revisions';

/** As constantes do dono do servidor que este caminho le. */
export interface ConstantesDeVersao {
  /** `WP_POST_REVISIONS`. Omitida, vale {@link QUANTAS_VERSOES_GUARDAR_DE_FABRICA}. */
  readonly quantasVersoesGuardar?: ValorDeQuantasVersoesGuardar;
}

/**
 * `wp_{$post->post_type}_revisions_to_keep` — o nome do ponto de extensao
 * dinamico, montado (`wp-includes/revision.php:855`).
 *
 * Existe como funcao, e nao como interpolacao solta, pela mesma razao de
 * `nomeDoPontoDeEstadoDoTipo()` em `../publicacao/transicao-de-estado.ts`: o
 * nome e contrato publico, e dois lugares que o montem acabam montando-o
 * diferente. O docblock do legado da os dois exemplos — `wp_post_revisions_to_keep`
 * e `wp_page_revisions_to_keep`.
 */
export function nomeDoPontoDeLimitePorTipo(tipo: string): string {
  return `wp_${tipo}_revisions_to_keep`;
}

/**
 * O `(int)` do PHP sobre o que a constante pode carregar.
 *
 * Nao e `Number()` e nao e `parseInt()` sem guarda: o `(int)` do PHP le o
 * **prefixo numerico** de uma cadeia e devolve `0` quando nao ha nenhum
 * (`'3abc'` vira `3`, `'abc'` vira `0`, `''` vira `0`), trunca o decimal **para
 * zero** (`-2.7` vira `-2`, nao `-3`) e le `false` como `0` e `true` como `1`.
 * Cada um desses casos chega aqui por configuracao do dono do servidor, e o que
 * eles decidem e se o site versiona.
 *
 * O `true` **nao** passa por esta funcao no caminho do legado: ele e desviado
 * antes, pela comparacao identica de {@link limiteDaConstante}. Esta funcao o
 * trata como `1` porque e o que o `(int)` faria, e para que ela seja total.
 */
export function inteiroDoPhp(valor: ValorDeQuantasVersoesGuardar): number {
  if (typeof valor === 'boolean') {
    return valor ? 1 : 0;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? Math.trunc(valor) : 0;
  }
  const prefixo = /^[ \t\n\r\v\f]*[+-]?\d+/.exec(valor);
  return prefixo === null ? 0 : Math.trunc(Number(prefixo[0]));
}

/**
 * As duas primeiras linhas de `wp_revisions_to_keep()`
 * (`wp-includes/revision.php:813`-`:818`): a constante como numero.
 *
 * ⚠️ **A comparacao e identica**, e so o booleano `true` vira
 * {@link VERSOES_ILIMITADAS}. Qualquer outra coisa — inclusive a cadeia
 * `'true'` — passa pelo `(int)`.
 */
export function limiteDaConstante(
  valor: ValorDeQuantasVersoesGuardar = QUANTAS_VERSOES_GUARDAR_DE_FABRICA,
): number {
  if (valor === true) {
    return VERSOES_ILIMITADAS;
  }
  return inteiroDoPhp(valor);
}

/**
 * `wp_revisions_to_keep( $post )` — quantas versoes daquele conteudo se guardam
 * (`wp-includes/revision.php:812`-`:858`).
 *
 * **CA-10.2.** Os quatro passos, na ordem do legado, e a ordem e a regra:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | a constante como numero, com `true` virando `-1` | `:813`-`:818` |
 * | 2 | o tipo que **nao** suporta versao zera o numero | `:821`-`:823` |
 * | 3 | o filtro `wp_revisions_to_keep` | `:835` |
 * | 4 | o filtro `wp_{tipo}_revisions_to_keep`, que sobrepoe os dois | `:855` |
 *
 * ⚠️ **O passo 2 vem antes dos filtros, e isso e o que permite a uma extensao
 * ligar versionamento em tipo que nao o declara.** O legado zera e **depois**
 * pergunta; invertendo, o filtro seria zerado em seguida e um tipo sem suporte
 * nunca versionaria. O inverso tambem vale: um filtro pode zerar o que o suporte
 * ligou. Nenhuma das duas e defeito — as duas sao o que `ESC-FILTRAVEL` chama de
 * *default filtravel*, e o **P2** as poe no contrato publico.
 *
 * O `(int)` final (`:857`) e do legado e nao e decorativo: um filtro de terceiro
 * pode devolver cadeia, e e o `(int)` que a transforma no numero que a poda usa.
 */
export function quantasVersoesGuardar(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
): number {
  // Passo 1 (`:813`).
  let quantas = limiteDaConstante(contexto.constantes?.quantasVersoesGuardar);

  // Passo 2 (`:821`): e ANTES dos filtros.
  if (!contexto.suportaVersao(conteudo.tipo)) {
    quantas = VERSIONAMENTO_DESLIGADO;
  }

  // Passo 3 (`:835`).
  const ganchos = contexto.ganchos;
  quantas = ganchos?.filtrarQuantasVersoesGuardar?.(quantas, conteudo) ?? quantas;

  // Passo 4 (`:855`): sobrepoe os dois anteriores por POSICAO, nao por
  // autoridade — e e isso que o docblock do legado chama de *"overrides both"*.
  quantas =
    ganchos?.filtrarQuantasVersoesGuardarDoTipo?.(
      nomeDoPontoDeLimitePorTipo(conteudo.tipo),
      quantas,
      conteudo,
    ) ?? quantas;

  return inteiroDoPhp(quantas);
}

/**
 * `wp_revisions_enabled( $post )` — uma linha so
 * (`wp-includes/revision.php:795`-`:797`).
 *
 * ⚠️ **Compara com zero, e nao com "maior que zero"**: `return
 * wp_revisions_to_keep( $post ) !== 0`. E por isso que `-1` conta como
 * **ligado**, e e por isso que `WP_POST_REVISIONS = false` — que vira `0` —
 * desliga o versionamento inteiro, que e a borda de UT-029-6.
 *
 * Um porte que escrevesse `> 0` desligaria o versionamento da instalacao de
 * fabrica, em que o numero e `-1`.
 */
export function versionamentoLigado(
  contexto: ContextoDeVersao,
  conteudo: Conteudo,
): boolean {
  return quantasVersoesGuardar(contexto, conteudo) !== VERSIONAMENTO_DESLIGADO;
}
