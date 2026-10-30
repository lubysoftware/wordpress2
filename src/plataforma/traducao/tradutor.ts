/**
 * O tradutor: **o texto pedido, no idioma da requisicao, a partir do catalogo.**
 *
 * Tarefa **T009** da feature `015-plataforma-transversal` — US-4, *"traduzir a
 * interface a partir de catalogo declarado e atualizavel"*. Satisfaz:
 *
 * - **CA-4.2** — *"os textos vem de catalogo externo ao codigo, atualizavel sem
 *   alterar o sistema"*: o texto sai do catalogo que a porta le
 *   (`./portas/porta-de-catalogo.ts`), e trocar o arquivo troca o texto;
 * - **CA-4.3** — *"texto sem traducao no catalogo cai no idioma de origem, sem
 *   erro e sem espaco vazio"*: sem catalogo, com catalogo invalido, ou com
 *   catalogo sem a entrada, devolve o texto pedido;
 * - **CA-4.5** — *"texto com numero e com ordem de palavras variavel e tratado
 *   por forma declarada, nao por concatenacao"*: o plural escolhe a forma pela
 *   expressao do catalogo (`./expressao-de-plural.ts`), e a ordem das palavras e
 *   o molde traduzido com marcador posicional, que o chamador interpola.
 *
 * ---
 *
 * ## O caminho do legado, peca por peca
 *
 * | legado | ancora | aqui |
 * |---|---|---|
 * | `__()` → `translate()` | `wp-includes/l10n.php:306`, `:194` | forma `'texto'` |
 * | `_x()` → `translate_with_gettext_context()` | `:409`, `:261` | forma `'com-contexto'` |
 * | `_n()` | `:483` | forma `'com-plural'` |
 * | `_nx()` | `:542` | forma `'com-plural-e-contexto'` |
 * | `get_translations_for_domain()` | `:1481` | {@link Tradutor}, por dominio, uma vez por requisicao |
 * | `NOOP_Translations` | `wp-includes/pomo/translations.php:418` | dominio sem catalogo |
 * | `WP_Translations::translate()` / `translate_plural()` | `wp-includes/l10n/class-wp-translations.php:139`, `:116` | o recuo para o texto de origem |
 * | `WP_Translation_Controller::translate()` / `translate_plural()` | `wp-includes/l10n/class-wp-translation-controller.php:263`, `:297` | a chave com contexto e a escolha da forma |
 *
 * ## ⚠️ O que este arquivo NAO decide
 *
 * - **Onde as 13.335 chamadas vao morar.** E REQ-161, `bloqueado`, e a pergunta
 *   esta aberta em `spec.md` (*"construir sem essa dependencia, ou esperar que ela
 *   entre?"*). Este arquivo e o tradutor, no lugar que `target_architecture.md`
 *   da a ele (`plataforma/traducao/`, *"nao ganha porta"*); nenhum contexto passa
 *   a chama-lo por causa desta tarefa. Ver `./README.md`.
 * - **De qual arquivo vem o catalogo.** O legado prefere `.l10n.php` a `.mo`
 *   (`translation_file_format`, `l10n.php:816-827`), e os dois carregam as
 *   mesmas entradas. A porta entrega bytes de `.mo`; o formato `.l10n.php` e
 *   codigo PHP e fica na pergunta 3 de `./README.md`.
 *
 * ## Por que o tradutor e criado por requisicao
 *
 * No legado o catalogo carregado mora no global `$l10n` e morre com o processo.
 * Aqui {@link criarTradutor} devolve um objeto novo, com o idioma desta
 * requisicao e o seu proprio cache de catalogo: duas requisicoes em idiomas
 * diferentes nunca se enxergam (`EXT-CONTEXTO`, BR-MIGRAR-105). E o cache
 * reproduz o do legado: o dominio sem catalogo fica marcado como sem catalogo
 * (`$l10n[ $domain ] = &$noop_translations`, `l10n.php:1492`), e a porta nao e
 * consultada de novo naquela requisicao.
 */

import {
  deCadeiaDeBytes,
  lerCatalogoMo,
  paraCadeiaDeBytes,
  type CadeiaDeBytes,
  type CatalogoMo,
} from './catalogo-mo.js';
import { contagemInteira, formaDePlural } from './expressao-de-plural.js';
import type {
  Dominio,
  Idioma,
  PedidoDeTraducao,
  PortaDeCatalogo,
} from './portas/index.js';

/**
 * Os pontos de extensao da traducao, declarados no arquivo que os emitiria. O
 * barramento (REQ-162) esta em `do-not-rewrite.md`.
 *
 * Cada um tem a versao por dominio, `{ponto}_{dominio}` (desde a 5.5), que
 * dispara **depois** da geral, sobre o que a geral devolveu.
 */
export const PONTOS_DE_EXTENSAO_DA_TRADUCAO = {
  /** `l10n.php:207` e `:220`. */
  texto: 'gettext',
  /** `l10n.php:275` e `:289`. */
  textoComContexto: 'gettext_with_context',
  /** `l10n.php:498` e `:513`. */
  plural: 'ngettext',
  /** `l10n.php:558` e `:574`. */
  pluralComContexto: 'ngettext_with_context',
} as const;

/** O nome da versao por dominio de um ponto: `gettext_default`, `ngettext_akismet`. */
export function pontoDoDominio(ponto: string, dominio: Dominio): string {
  return `${ponto}_${dominio}`;
}

/** `gettext`: `( $translation, $text, $domain )`. */
export type FiltroDeTexto = (traducao: string, texto: string, dominio: Dominio) => string;

/** `gettext_with_context`: `( $translation, $text, $context, $domain )`. */
export type FiltroDeTextoComContexto = (
  traducao: string,
  texto: string,
  contexto: string,
  dominio: Dominio,
) => string;

/**
 * `ngettext`: `( $translation, $single, $plural, $number, $domain )`. O numero
 * chega **como o chamador o passou**, sem o `(int)` que a escolha da forma usa.
 */
export type FiltroDePlural = (
  traducao: string,
  singular: string,
  plural: string,
  numero: number,
  dominio: Dominio,
) => string;

/** `ngettext_with_context`: `( $translation, $single, $plural, $number, $context, $domain )`. */
export type FiltroDePluralComContexto = (
  traducao: string,
  singular: string,
  plural: string,
  numero: number,
  contexto: string,
  dominio: Dominio,
) => string;

/** Interceptadores por nome de ponto (o geral e os por dominio), na ordem. */
type PorPonto<F> = Readonly<Record<string, readonly F[]>>;

/** Os interceptadores de cada ponto, pelo nome exato do ponto. */
export interface FiltrosDaTraducao {
  readonly texto?: PorPonto<FiltroDeTexto>;
  readonly textoComContexto?: PorPonto<FiltroDeTextoComContexto>;
  readonly plural?: PorPonto<FiltroDePlural>;
  readonly pluralComContexto?: PorPonto<FiltroDePluralComContexto>;
}

/** O que o tradutor de uma requisicao recebe. */
export interface ContextoDoTradutor {
  /**
   * O idioma desta requisicao — o que `determine_locale()` devolveu
   * (`./idioma.ts`, {@link idiomaDaRequisicao}), e o que `load_textdomain()` usa
   * (`l10n.php:797-799`).
   */
  readonly idioma: Idioma;
  readonly filtros?: FiltrosDaTraducao;
}

/** O tradutor de uma requisicao. */
export interface Tradutor {
  readonly idioma: Idioma;
  /**
   * O texto traduzido — ou o de origem, quando nao ha traducao. Nunca lanca por
   * falta de catalogo ou de entrada (CA-4.3).
   *
   * Devolve o **molde**: marcador posicional (`%1$s`, `%2$s`) fica como esta, e
   * quem interpola e o chamador, depois, como no legado (`./pedido-de-traducao.ts`).
   *
   * @throws {ErroNaAvaliacaoDoPlural} so onde o legado para com erro fatal: a
   *   expressao de plural do catalogo que analisa mas nao avalia.
   */
  traduzir(pedido: PedidoDeTraducao): string;
}

/** O catalogo de um dominio nesta requisicao: lido sob demanda, como no legado. */
interface CatalogoCarregado {
  readonly bytes: Uint8Array;
  lido: CatalogoMo | null;
}

/** `explode( "\0", $translation )`. */
type Formas = readonly CadeiaDeBytes[];

function aplicar<F extends (traducao: string, ...resto: never[]) => string>(
  porPonto: PorPonto<F> | undefined,
  ponto: string,
  dominio: Dominio,
  traducao: string,
  chamar: (filtro: F, atual: string) => string,
): string {
  let valor = traducao;
  for (const nome of [ponto, pontoDoDominio(ponto, dominio)]) {
    for (const filtro of porPonto?.[nome] ?? []) {
      valor = chamar(filtro, valor);
    }
  }
  return valor;
}

/**
 * Cria o tradutor de uma requisicao.
 *
 * Criar nao le catalogo nenhum: a leitura acontece no primeiro pedido de cada
 * dominio, que e quando o legado a faz para todo dominio que nao seja o do
 * nucleo (`_load_textdomain_just_in_time()`, `l10n.php:1423`, chamada por
 * `get_translations_for_domain()`, `:1483`). O do nucleo, `'default'`, o legado
 * carrega no arranque (`wp-settings.php:712`); o texto devolvido e o mesmo, e a
 * ordem do arranque nao e desta tarefa.
 */
export function criarTradutor(
  catalogo: PortaDeCatalogo,
  contexto: ContextoDoTradutor,
): Tradutor {
  const idioma = contexto.idioma;
  const filtros = contexto.filtros ?? {};
  const carregados = new Map<Dominio, CatalogoCarregado | null>();

  function catalogoDo(dominio: Dominio): CatalogoMo | null {
    let carregado = carregados.get(dominio);
    if (carregado === undefined) {
      const bytes = catalogo.ler(dominio, idioma);
      carregado = bytes === null ? null : { bytes, lido: null };
      carregados.set(dominio, carregado);
    }
    if (carregado === null) {
      return null;
    }
    // `parse_file()` so na primeira consulta (`class-wp-translation-file.php:202`).
    carregado.lido ??= lerCatalogoMo(carregado.bytes);
    return carregado.lido;
  }

  /**
   * `locate_translation()` (`class-wp-translation-controller.php:397`): as
   * formas da entrada, ou `null` — que e o `false` do legado.
   *
   * ⚠️ Entrada gravada com traducao vazia **e achada**, e devolve `''`
   * (`entries[ $text ] ?? false`, `class-wp-translation-file.php:206`). Os
   * geradores de catalogo omitem a entrada nao traduzida, entao o caso nao nasce
   * deles; se nascer, e o legado.
   */
  function localizar(lido: CatalogoMo, chave: CadeiaDeBytes): Formas | null {
    const traducao = lido.entradas.get(chave);
    return traducao === undefined ? null : traducao.split('\0');
  }

  /** `$context .= "\4"` quando ha contexto (`class-wp-translation-controller.php:264-266`). */
  function comContexto(contexto: string | undefined, texto: string): CadeiaDeBytes {
    const prefixo = contexto === undefined || contexto === '' ? '' : `${contexto}\u0004`;
    return paraCadeiaDeBytes(`${prefixo}${texto}`);
  }

  /** `WP_Translations::translate()` sobre o controlador. */
  function traduzirTexto(texto: string, contexto: string | undefined, dominio: Dominio): string {
    const lido = catalogoDo(dominio);
    if (lido === null) {
      // `NOOP_Translations::translate()`: `return $singular;` (`translations.php:495`).
      return texto;
    }
    const formas = localizar(lido, comContexto(contexto, texto));
    if (formas === null) {
      // "Fall back to the original." (`class-wp-translations.php:149-150`)
      return texto;
    }
    return deCadeiaDeBytes(formas[0] as CadeiaDeBytes);
  }

  /** `WP_Translations::translate_plural()` sobre o controlador. */
  function traduzirPlural(
    singular: string,
    plural: string,
    numero: number,
    contexto: string | undefined,
    dominio: Dominio,
  ): string {
    const contagem = contagemInteira(numero);
    // A regra do ingles, que vale nos dois recuos (`translations.php:533`,
    // `class-wp-translations.php:126-127`).
    const deOrigem = contagem === 1 ? singular : plural;

    const lido = catalogoDo(dominio);
    if (lido === null) {
      return deOrigem;
    }

    // Primeiro `singular\0plural`, depois so o singular
    // (`class-wp-translation-controller.php:302-311`).
    const formas =
      localizar(lido, comContexto(contexto, `${singular}\u0000${plural}`)) ??
      localizar(lido, comContexto(contexto, singular));
    if (formas === null) {
      return deOrigem;
    }

    const indice = formaDePlural(lido.cabecalhos.get('plural-forms'), contagem);
    // `entries[ $num ] ?? entries[0]` (`:319`).
    const forma = formas[indice] ?? (formas[0] as CadeiaDeBytes);
    return deCadeiaDeBytes(forma);
  }

  return {
    idioma,
    traduzir(pedido) {
      const dominio = pedido.dominio;
      switch (pedido.forma) {
        case 'texto': {
          const traducao = traduzirTexto(pedido.texto, undefined, dominio);
          return aplicar(
            filtros.texto,
            PONTOS_DE_EXTENSAO_DA_TRADUCAO.texto,
            dominio,
            traducao,
            (filtro, atual) => filtro(atual, pedido.texto, dominio),
          );
        }
        case 'com-contexto': {
          const traducao = traduzirTexto(pedido.texto, pedido.contexto, dominio);
          return aplicar(
            filtros.textoComContexto,
            PONTOS_DE_EXTENSAO_DA_TRADUCAO.textoComContexto,
            dominio,
            traducao,
            (filtro, atual) => filtro(atual, pedido.texto, pedido.contexto, dominio),
          );
        }
        case 'com-plural': {
          const traducao = traduzirPlural(
            pedido.singular,
            pedido.plural,
            pedido.numero,
            undefined,
            dominio,
          );
          return aplicar(
            filtros.plural,
            PONTOS_DE_EXTENSAO_DA_TRADUCAO.plural,
            dominio,
            traducao,
            (filtro, atual) =>
              filtro(atual, pedido.singular, pedido.plural, pedido.numero, dominio),
          );
        }
        case 'com-plural-e-contexto': {
          const traducao = traduzirPlural(
            pedido.singular,
            pedido.plural,
            pedido.numero,
            pedido.contexto,
            dominio,
          );
          return aplicar(
            filtros.pluralComContexto,
            PONTOS_DE_EXTENSAO_DA_TRADUCAO.pluralComContexto,
            dominio,
            traducao,
            (filtro, atual) =>
              filtro(
                atual,
                pedido.singular,
                pedido.plural,
                pedido.numero,
                pedido.contexto,
                dominio,
              ),
          );
        }
      }
    },
  };
}
