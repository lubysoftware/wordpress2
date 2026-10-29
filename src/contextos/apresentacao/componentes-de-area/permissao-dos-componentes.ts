/**
 * A permissao dos componentes de area: o portao da tela, os tokens de cada
 * operacao e a declaracao explicita de permissao das tres superficies (**P4**).
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.1**, *"Colocar, configurar e retirar componente exige a capacidade
 * declarada de administrar aparencia"*, e a regra *"A capacidade de
 * administrar aparencia libera menus, componentes e personalizacao"*.
 *
 * ## A mesma capacidade nas tres superficies, cada uma com a sua resposta
 *
 * | superficie | onde o legado pergunta | o que responde sem a capacidade |
 * |---|---|---|
 * | a tela (`widgets.php`) | `wp-admin/widgets.php:15` | `wp_die()` com **403** |
 * | o Ajax da tela | `wp-admin/includes/ajax-actions.php:2352`, `:2515` | `wp_die( -1 )`: corpo `-1`, **200** — o padrao de `wp_die()` |
 * | a superficie programatica | `class-wp-rest-sidebars-controller.php:268`, `class-wp-rest-widgets-controller.php:486` | `rest_cannot_manage_widgets`, **401** sem sessao e **403** com ela (`rest_authorization_required_code()`, `wp-includes/rest-api.php:1438`) |
 * | a personalizacao | `WP_Customize_Setting::check_capabilities()`, `class-wp-customize-setting.php:839`, sobre a capacidade que `get_setting_args()` declara (`class-wp-customize-widgets.php:997`) | a configuracao nao e gravada (`save()` devolve `false`, `:528`-`:530`) |
 *
 * As quatro perguntam pela capacidade **primitiva** `edit_theme_options`, e
 * nenhuma por `customize`: e a mesma da tela de menus (`nav-menus.php:23`), e
 * `customize` resolve para ela (`wp-includes/capabilities.php:698`-`:699`). E
 * isso que a regra chama de *"libera menus, componentes e personalizacao"*.
 *
 * ⚠️ **Na tela a capacidade vem ANTES do tema** (`widgets.php:15`-`:25`), ao
 * contrario da de menus, que confere o tema primeiro (`nav-menus.php:18`-`:29`).
 * Quem nao tem permissao num tema sem areas ve a mensagem de permissao.
 *
 * ⚠️ **No Ajax o token vem ANTES da capacidade**, e as duas respostas diferem:
 * token vencido e `wp_die( -1, 403 )` (`check_ajax_referer()`,
 * `wp-includes/pluggable.php`), capacidade ausente e `wp_die( -1 )`, 200.
 *
 * ⚠️ **A personalizacao registra as configuracoes de componente mesmo para
 * quem nao tem a capacidade**: o filtro que as cria entra no construtor
 * **antes** da guarda de capacidade (`class-wp-customize-widgets.php:104`,
 * `:109`-`:111`), e a guarda so pula a interface. A recusa e na gravacao.
 *
 * A sessao da tela e do Ajax e conferida antes, por `wp-admin/admin.php` e
 * `admin-ajax.php` — a borda.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import type { ContextoDosComponentes } from './contexto-dos-componentes.js';

/** `edit_theme_options` — a capacidade de administrar a aparencia. */
export const CAPACIDADE_DOS_COMPONENTES = 'edit_theme_options';

/** `wp-admin/widgets.php:17`. */
export const TITULO_SEM_PERMISSAO_NOS_COMPONENTES =
  'You need a higher level of permission.';

/** `wp-admin/widgets.php:18`. */
export const MENSAGEM_SEM_PERMISSAO_NOS_COMPONENTES =
  'Sorry, you are not allowed to edit theme options on this site.';

/** `wp-admin/widgets.php:24`. */
export const MENSAGEM_DE_TEMA_SEM_AREAS =
  'The theme you are currently using is not widget-aware, meaning that it has no sidebars that you are able to change. For information on making your theme widget-aware, please <a href="https://developer.wordpress.org/themes/functionality/widgets/">follow these instructions</a>.';

/** O titulo de `wp_nonce_ays()` para toda acao que nao e `log-out`. */
export const TITULO_DE_TOKEN_VENCIDO_NOS_COMPONENTES = 'An error occurred.';

/** A mensagem de `wp_nonce_ays()` para toda acao que nao e `log-out`. */
export const MENSAGEM_DE_TOKEN_VENCIDO_NOS_COMPONENTES =
  'The link you followed has expired.';

/** `class-wp-rest-sidebars-controller.php:275`, `class-wp-rest-widgets-controller.php:489`. */
export const CODIGO_SEM_PERMISSAO_NA_API = 'rest_cannot_manage_widgets';

/** `class-wp-rest-sidebars-controller.php:276`, `class-wp-rest-widgets-controller.php:490`. */
export const MENSAGEM_SEM_PERMISSAO_NA_API =
  'Sorry, you are not allowed to manage widgets on this site.';

/** Um token de operacao: a acao e o campo do pedido que o carrega. */
export interface TokenDosComponentes {
  readonly acao: string;
  readonly campo: string;
}

/**
 * `check_admin_referer( "save-delete-widget-$widget_id" )`
 * (`wp-admin/widgets-form.php:126`), no campo padrao.
 */
export function tokenDeGravarComponente(idDoComponente: string): TokenDosComponentes {
  return { acao: `save-delete-widget-${idDoComponente}`, campo: '_wpnonce' };
}

/**
 * `check_admin_referer( 'remove-inactive-widgets', '_wpnonce_remove_inactive_widgets' )`
 * (`wp-admin/widgets-form.php:206`).
 */
export const TOKEN_DE_LIMPAR_INATIVOS_PELA_TELA: TokenDosComponentes = {
  acao: 'remove-inactive-widgets',
  campo: '_wpnonce_remove_inactive_widgets',
};

/**
 * `check_ajax_referer( 'remove-inactive-widgets', 'removeinactivewidgets' )`
 * (`wp-admin/includes/ajax-actions.php:2513`).
 */
export const TOKEN_DE_LIMPAR_INATIVOS_PELO_AJAX: TokenDosComponentes = {
  acao: 'remove-inactive-widgets',
  campo: 'removeinactivewidgets',
};

/**
 * `check_ajax_referer( 'save-sidebar-widgets', 'savewidgets' )`
 * (`wp-admin/includes/ajax-actions.php:2350`).
 */
export const TOKEN_DE_ORDENAR_PELO_AJAX: TokenDosComponentes = {
  acao: 'save-sidebar-widgets',
  campo: 'savewidgets',
};

/**
 * A permissao declarada de cada operacao de US-7, como o **P4** cobra. Todas
 * pedem a mesma capacidade; as da tela e do Ajax pedem, alem dela, o token.
 *
 * As funcoes de baixo (`wp_set_sidebars_widgets()`,
 * `wp_assign_widget_to_sidebar()`, `WP_Widget::update_callback()`) **nao
 * conferem capacidade nenhuma** no legado: quem confere e a superficie, e e so
 * pelas superficies que este modulo as expoe gravando.
 */
export const PERMISSOES_DOS_COMPONENTES = {
  /** Abrir a tela (`widgets.php:15`). */
  abrirATela: CAPACIDADE_DOS_COMPONENTES,
  /** Colocar, configurar ou retirar pela tela: a tela, mais o token do componente. */
  gravarPelaTela: CAPACIDADE_DOS_COMPONENTES,
  /** Limpar os inativos pela tela: a tela, mais o token (CA-7.4). */
  limparInativosPelaTela: CAPACIDADE_DOS_COMPONENTES,
  /** Ordenar as areas pelo Ajax da tela: o token, depois a capacidade. */
  ordenarPeloAjax: CAPACIDADE_DOS_COMPONENTES,
  /** Limpar os inativos pelo Ajax da tela: o token, depois a capacidade (CA-7.4). */
  limparInativosPeloAjax: CAPACIDADE_DOS_COMPONENTES,
  /** Toda operacao de escrita da superficie programatica. */
  pelaApi: CAPACIDADE_DOS_COMPONENTES,
  /** Gravar uma configuracao de componente pela personalizacao. */
  pelaPersonalizacao: CAPACIDADE_DOS_COMPONENTES,
} as const;

/** Por que a tela, ou uma operacao dela, foi recusada. */
export type RecusaDaTelaDeComponentes =
  | {
      readonly tipo: 'proibida';
      readonly status: 403;
      readonly titulo: string;
      readonly mensagem: string;
    }
  | {
      readonly tipo: 'tema-sem-suporte';
      readonly status: 500;
      readonly mensagem: string;
    }
  | {
      readonly tipo: 'token-vencido';
      readonly status: 403;
      readonly titulo: string;
      readonly mensagem: string;
    };

/** O `WP_Error` da superficie programatica. */
export interface ErroDaApiDeComponentes {
  readonly codigo: string;
  readonly mensagem: string;
  readonly status: number;
}

/** O que o Ajax da tela responde: o corpo e o estado. */
export interface RespostaDoAjaxDeComponentes {
  readonly status: number;
  readonly corpo: string;
}

/** `current_user_can( 'edit_theme_options' )`. */
export function podeAdministrarComponentes(
  contexto: Pick<ContextoDosComponentes, 'autorizacao'>,
): boolean {
  return perguntarPermissao(contexto.autorizacao, CAPACIDADE_DOS_COMPONENTES);
}

/**
 * O portao da tela de componentes (`wp-admin/widgets.php:15`-`:25`): a
 * capacidade, depois o suporte do tema. `null` e passagem livre.
 */
export function portaoDaTelaDeComponentes(
  contexto: Pick<ContextoDosComponentes, 'autorizacao' | 'temaSuporta'>,
): RecusaDaTelaDeComponentes | null {
  if (!podeAdministrarComponentes(contexto)) {
    return {
      tipo: 'proibida',
      status: 403,
      titulo: TITULO_SEM_PERMISSAO_NOS_COMPONENTES,
      mensagem: MENSAGEM_SEM_PERMISSAO_NOS_COMPONENTES,
    };
  }
  if (!contexto.temaSuporta('widgets')) {
    return {
      tipo: 'tema-sem-suporte',
      status: 500,
      mensagem: MENSAGEM_DE_TEMA_SEM_AREAS,
    };
  }
  return null;
}

/** `check_admin_referer( $acao, $campo )` — `null` quando o token confere. */
export function conferirTokenDaTela(
  contexto: Pick<ContextoDosComponentes, 'verificarNonce'>,
  token: TokenDosComponentes,
  valor: string | undefined,
): RecusaDaTelaDeComponentes | null {
  if (contexto.verificarNonce(token.acao, valor)) {
    return null;
  }
  return {
    tipo: 'token-vencido',
    status: 403,
    titulo: TITULO_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
    mensagem: MENSAGEM_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
  };
}

/**
 * O par de guardas do Ajax da tela: `check_ajax_referer()` e depois
 * `current_user_can()`. `null` e passagem livre.
 */
export function portaoDoAjaxDeComponentes(
  contexto: Pick<ContextoDosComponentes, 'autorizacao' | 'verificarNonce'>,
  token: TokenDosComponentes,
  valor: string | undefined,
): RespostaDoAjaxDeComponentes | null {
  if (!contexto.verificarNonce(token.acao, valor)) {
    return { status: 403, corpo: '-1' };
  }
  if (!podeAdministrarComponentes(contexto)) {
    return { status: 200, corpo: '-1' };
  }
  return null;
}

/**
 * O `permission_callback` dos dois controladores
 * (`class-wp-rest-sidebars-controller.php:268`,
 * `class-wp-rest-widgets-controller.php:486`). `null` e passagem livre.
 */
export function permissaoDaApiDeComponentes(
  contexto: Pick<ContextoDosComponentes, 'autorizacao'>,
): ErroDaApiDeComponentes | null {
  if (podeAdministrarComponentes(contexto)) {
    return null;
  }
  return {
    codigo: CODIGO_SEM_PERMISSAO_NA_API,
    mensagem: MENSAGEM_SEM_PERMISSAO_NA_API,
    status: contexto.autorizacao.ator.existe ? 403 : 401,
  };
}
