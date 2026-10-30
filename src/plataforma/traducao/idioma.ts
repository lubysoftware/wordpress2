/**
 * O idioma da interface: **por instalacao, por conta e por requisicao.**
 *
 * Tarefa **T009** da feature `015-plataforma-transversal` — US-4, *"traduzir a
 * interface a partir de catalogo declarado e atualizavel"*. Satisfaz **CA-4.1**:
 * *"o idioma da interface e configuravel por instalacao e por conta"*.
 *
 * Tres funcoes do legado, as tres em `wp-includes/l10n.php`:
 *
 * | legado | ancora | aqui |
 * |---|---|---|
 * | `get_locale()` | `:30` | {@link idiomaDaInstalacao} |
 * | `get_user_locale( $user )` | `:94` | {@link idiomaDaConta} |
 * | `determine_locale()` | `:124` | {@link idiomaDaRequisicao} |
 *
 * mais `sanitize_locale_name()` (`wp-includes/formatting.php:2468`), que
 * `determine_locale()` aplica ao idioma que chega pela requisicao.
 *
 * ---
 *
 * ## ⚠️ O idioma da conta so vale no painel
 *
 * E o fato que um porte mais "arrumado" perderia. `determine_locale()` so chama
 * `get_user_locale()` quando `is_admin()` (ou no pedido JSON com
 * `_locale=user`, `l10n.php:149-153`). Fora disso — o site publico, inclusive
 * para quem esta logado — vale o idioma da **instalacao**. CA-4.1 diz *"por
 * instalacao e por conta"*, e e verdade; o que o criterio nao diz e **onde** cada
 * um vale, e quem decide e {@link idiomaDaRequisicao}, na ordem do legado.
 *
 * ## Por que tudo entra por argumento
 *
 * No legado as tres leem global (`$locale`, `$wp_local_package`, `$pagenow`,
 * `$_GET`, `$_COOKIE`, `$_REQUEST`) e opcao gravada. Aqui nada disso existe: o
 * idioma por conta e dado de BC-05 (`contextos/identidade-e-acesso/`), a opcao e
 * da camada de dados, a requisicao e da borda — e a regra de dependencia 3 de
 * `target_architecture.md` proibe buscar qualquer um deles por `import`. Cada um
 * chega como campo, e os caros chegam como funcao: o legado so le a conta no ramo
 * do painel, e uma leitura que o legado nao faz nao pode acontecer aqui.
 *
 * ## Os pontos de extensao
 *
 * Declarados em {@link PONTOS_DE_EXTENSAO_DO_IDIOMA}, no arquivo que os emitiria.
 * O barramento (REQ-162) esta em `do-not-rewrite.md`; cada funcao recebe a cadeia
 * de interceptadores de cada ponto, na ordem, como o resto da arvore faz.
 */

import type { Idioma } from './pedido-de-traducao.js';

/**
 * O idioma de fabrica: `if ( empty( $locale ) ) { $locale = 'en_US'; }`
 * (`wp-includes/l10n.php:69-71`). E tambem o idioma de origem dos textos: o
 * `msgid` ingles **e** a chave do catalogo (`EC-05`, `parity_specs.md`).
 */
export const IDIOMA_DE_FABRICA: Idioma = 'en_US';

/** Os pontos de extensao desta area, declarados no arquivo que os emitiria. */
export const PONTOS_DE_EXTENSAO_DO_IDIOMA = {
  /** `l10n.php:35` e `:80` — o idioma da instalacao, nos dois caminhos de saida. */
  idiomaDaInstalacao: 'locale',
  /** `l10n.php:134` — curto-circuita `determine_locale()` antes de tudo. */
  antesDeDeterminar: 'pre_determine_locale',
  /** `l10n.php:176` — o idioma da requisicao, depois de determinado. */
  idiomaDaRequisicao: 'determine_locale',
  /** `formatting.php:2480` — o nome de idioma depois de sanitizado. */
  nomeSanitizado: 'sanitize_locale_name',
} as const;

/** `locale` e `determine_locale`: recebem o idioma corrente e o substituem. */
export type FiltroDeIdioma = (idioma: Idioma) => Idioma;

/**
 * `pre_determine_locale`: recebe `null` (ou o que o anterior devolveu) e, se
 * devolver texto nao vazio, encerra a determinacao com ele (`l10n.php:136`).
 */
export type FiltroAntesDeDeterminar = (idioma: Idioma | null) => Idioma | null;

/** `sanitize_locale_name`: o nome sanitizado e o nome original. */
export type FiltroDeNomeSanitizado = (
  sanitizado: string,
  original: string,
) => string;

/**
 * O valor de uma opcao como o legado o devolve: o texto gravado, ou `false`
 * quando a opcao nao existe (`get_option()` sem default). A diferenca importa:
 * `get_locale()` compara com `false !== $db_locale` (`l10n.php:64`), logo opcao
 * gravada vazia **sobrescreve** o que veio antes, e so depois cai em `en_US`.
 */
export type ValorDeOpcao = string | false;

/**
 * De onde o idioma da instalacao e lido, nos dois modos do legado
 * (`l10n.php:47-67`).
 */
export type OpcoesDoIdioma =
  | {
      readonly rede: false;
      /** `get_option( 'WPLANG' )`. */
      readonly opcaoDoSite: ValorDeOpcao;
    }
  | {
      readonly rede: true;
      /** `wp_installing()` — durante a instalacao, so a opcao da rede e lida. */
      readonly instalando: boolean;
      /** `get_option( 'WPLANG' )`. Nao e lida durante a instalacao. */
      readonly opcaoDoSite: () => ValorDeOpcao;
      /** `get_site_option( 'WPLANG' )`. Lida so quando a do site e `false`. */
      readonly opcaoDaRede: () => ValorDeOpcao;
    };

/** O que `get_locale()` le, em vez de global e opcao. */
export interface EntradaDoIdiomaDaInstalacao {
  /**
   * `global $locale` ja definido (`l10n.php:33`). No legado e o efeito de uma
   * chamada anterior na mesma requisicao: `get_locale()` atribui o global e, da
   * segunda vez em diante, so passa pelo filtro, sem reler opcao.
   */
  readonly idiomaJaDefinido?: Idioma;
  /** `global $wp_local_package` — o idioma do pacote distribuido. */
  readonly pacoteLocal?: Idioma;
  /** A constante `WPLANG` do arquivo de configuracao, quando definida. */
  readonly constanteWplang?: Idioma;
  readonly opcoes: OpcoesDoIdioma;
  /** O ponto `locale`, na ordem. */
  readonly filtros?: readonly FiltroDeIdioma[];
}

/** `empty()` sobre texto: `''` e `'0'` sao vazios no interpretador. */
function vazioComoNoPhp(valor: string | null | undefined): boolean {
  return valor === undefined || valor === null || valor === '' || valor === '0';
}

function filtrado(idioma: Idioma, filtros: readonly FiltroDeIdioma[]): Idioma {
  let valor = idioma;
  for (const filtro of filtros) {
    valor = filtro(valor);
  }
  return valor;
}

/**
 * `get_locale()` (`wp-includes/l10n.php:30`): **o idioma da instalacao.**
 *
 * A precedencia e a do legado, e cada passo sobrescreve o anterior:
 *
 * 1. o pacote local (`:38-40`);
 * 2. a constante `WPLANG` (`:42-45`);
 * 3. a opcao gravada, quando existe — mesmo vazia (`:47-67`);
 * 4. vazio no fim vira `en_US` (`:69-71`) — e `'0'` tambem, por `empty()`.
 *
 * ⚠️ **A opcao gravada vence a constante.** E o contrario do que o nome
 * *"WPLANG was defined in wp-config"* sugere, e e o legado: a constante so vale
 * enquanto a opcao nao existe.
 */
export function idiomaDaInstalacao(entrada: EntradaDoIdiomaDaInstalacao): Idioma {
  const filtros = entrada.filtros ?? [];

  if (entrada.idiomaJaDefinido !== undefined) {
    return filtrado(entrada.idiomaJaDefinido, filtros);
  }

  let idioma: Idioma | undefined;

  if (entrada.pacoteLocal !== undefined) {
    idioma = entrada.pacoteLocal;
  }

  if (entrada.constanteWplang !== undefined) {
    idioma = entrada.constanteWplang;
  }

  const opcoes = entrada.opcoes;
  if (opcoes.rede) {
    let daRede: ValorDeOpcao;
    if (opcoes.instalando) {
      daRede = opcoes.opcaoDaRede();
    } else {
      daRede = opcoes.opcaoDoSite();
      if (daRede === false) {
        daRede = opcoes.opcaoDaRede();
      }
    }
    if (daRede !== false) {
      idioma = daRede;
    }
  } else if (opcoes.opcaoDoSite !== false) {
    idioma = opcoes.opcaoDoSite;
  }

  if (vazioComoNoPhp(idioma)) {
    idioma = IDIOMA_DE_FABRICA;
  }

  return filtrado(idioma as Idioma, filtros);
}

/**
 * A conta, no unico campo que a traducao le dela: `$user_object->locale`
 * (`l10n.php:109`), a preferencia gravada pela propria pessoa no perfil.
 */
export interface ContaNoIdioma {
  readonly idioma?: Idioma;
}

/**
 * `get_user_locale( $user )` (`wp-includes/l10n.php:94`): **o idioma da conta.**
 *
 * Sem conta, o da instalacao (`:105-107`). Com conta, o dela quando nao vazio, e
 * o da instalacao quando vazio (`:111`, `$locale ? $locale : get_locale()` — o
 * teste e de verdade do interpretador, logo `'0'` tambem cai na instalacao).
 *
 * `idiomaDaInstalacaoAtual` e funcao porque o legado so chama `get_locale()`
 * quando precisa dele.
 */
export function idiomaDaConta(
  conta: ContaNoIdioma | null | undefined,
  idiomaDaInstalacaoAtual: () => Idioma,
): Idioma {
  if (conta === null || conta === undefined) {
    return idiomaDaInstalacaoAtual();
  }

  const idioma = conta.idioma;
  return vazioComoNoPhp(idioma) ? idiomaDaInstalacaoAtual() : (idioma as Idioma);
}

/**
 * `sanitize_locale_name()` (`wp-includes/formatting.php:2468`): fica so
 * `A-Z`, `a-z`, `0-9`, `_` e `-` (`:2470`), e o ponto de extensao recebe o
 * sanitizado e o original.
 */
export function sanitizarNomeDeIdioma(
  nome: string,
  filtros: readonly FiltroDeNomeSanitizado[] = [],
): string {
  let sanitizado = nome.replace(/[^A-Za-z0-9_-]/g, '');
  for (const filtro of filtros) {
    sanitizado = filtro(sanitizado, nome);
  }
  return sanitizado;
}

/** O que `determine_locale()` le da requisicao e do arranque. */
export interface RequisicaoNoIdioma {
  /** `'wp-login.php' === $GLOBALS['pagenow']`. */
  readonly telaDeEntrada?: boolean;
  /** `$_GET['wp_lang']`. */
  readonly wpLangNaConsulta?: string;
  /** `$_COOKIE['wp_lang']`. */
  readonly wpLangNoCookie?: string;
  /** `is_admin()`. */
  readonly noPainel?: boolean;
  /** `$_GET['_locale']`. */
  readonly localeNaConsulta?: string;
  /** `wp_is_json_request()`. */
  readonly pedidoJson?: boolean;
  /** `wp_installing()`. */
  readonly instalando?: boolean;
  /** `$_REQUEST['language']` — o idioma escolhido na tela do instalador. */
  readonly idiomaPedidoNaInstalacao?: string;
  /** `$GLOBALS['wp_local_package']`. */
  readonly pacoteLocal?: Idioma;
}

/** As duas fontes e os tres pontos de extensao de `determine_locale()`. */
export interface FontesDoIdiomaDaRequisicao {
  /** `get_locale()` — chamado so no ramo que cai na instalacao. */
  readonly idiomaDaInstalacao: () => Idioma;
  /** `get_user_locale()` — chamado so no ramo do painel. */
  readonly idiomaDaConta: () => Idioma;
  /** `pre_determine_locale`, na ordem. */
  readonly filtrosAntes?: readonly FiltroAntesDeDeterminar[];
  /** `determine_locale`, na ordem. */
  readonly filtros?: readonly FiltroDeIdioma[];
  /** `sanitize_locale_name`, na ordem. */
  readonly filtrosDeSanitizacao?: readonly FiltroDeNomeSanitizado[];
}

/**
 * `determine_locale()` (`wp-includes/l10n.php:124`): **o idioma desta
 * requisicao**, que e o que o catalogo carregado usa (`load_textdomain()`,
 * `:797-799`).
 *
 * Os ramos, na ordem do legado:
 *
 * | # | condicao | idioma | legado |
 * |---|---|---|---|
 * | 0 | `pre_determine_locale` devolveu texto nao vazio | o devolvido, **sem** passar por `determine_locale` | `:134-138` |
 * | 1 | tela de entrada com `wp_lang` na consulta ou no cookie | o `wp_lang`, sanitizado; a consulta antes do cookie | `:140-148` |
 * | 2 | painel, ou pedido JSON com `_locale=user` | o da **conta** | `:149-153` |
 * | 3 | instalando, com idioma escolhido ou pacote local | o escolhido, sanitizado; senao o do pacote | `:154-163` |
 * | 4 | nenhum dos anteriores, ou o anterior deu vazio | o da **instalacao** | `:165-167` |
 *
 * e o resultado passa por `determine_locale` (`:176`).
 */
export function idiomaDaRequisicao(
  requisicao: RequisicaoNoIdioma,
  fontes: FontesDoIdiomaDaRequisicao,
): Idioma {
  let antes: Idioma | null = null;
  for (const filtro of fontes.filtrosAntes ?? []) {
    antes = filtro(antes);
  }
  // `$determined_locale && is_string( $determined_locale )` (`:136`).
  if (!vazioComoNoPhp(antes)) {
    return antes as Idioma;
  }

  let determinado: Idioma | null = antes;
  const sanitizar = (nome: string): string =>
    sanitizarNomeDeIdioma(nome, fontes.filtrosDeSanitizacao ?? []);

  if (
    requisicao.telaDeEntrada === true &&
    (!vazioComoNoPhp(requisicao.wpLangNaConsulta) ||
      !vazioComoNoPhp(requisicao.wpLangNoCookie))
  ) {
    determinado = !vazioComoNoPhp(requisicao.wpLangNaConsulta)
      ? sanitizar(requisicao.wpLangNaConsulta as string)
      : sanitizar(requisicao.wpLangNoCookie as string);
  } else if (
    requisicao.noPainel === true ||
    (requisicao.localeNaConsulta === 'user' && requisicao.pedidoJson === true)
  ) {
    determinado = fontes.idiomaDaConta();
  } else if (
    (!vazioComoNoPhp(requisicao.idiomaPedidoNaInstalacao) ||
      requisicao.pacoteLocal !== undefined) &&
    requisicao.instalando === true
  ) {
    determinado = !vazioComoNoPhp(requisicao.idiomaPedidoNaInstalacao)
      ? sanitizar(requisicao.idiomaPedidoNaInstalacao as string)
      : (requisicao.pacoteLocal as Idioma);
  }

  // `if ( ! $determined_locale )` (`:165`): vazio — inclusive o que a
  // sanitizacao esvaziou — cai na instalacao.
  if (vazioComoNoPhp(determinado)) {
    determinado = fontes.idiomaDaInstalacao();
  }

  return filtrado(determinado as Idioma, fontes.filtros ?? []);
}
