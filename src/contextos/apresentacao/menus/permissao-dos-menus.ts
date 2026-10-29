/**
 * A permissao dos menus: o portao da tela, os dois tokens de operacao e a
 * declaracao explicita de permissao de cada operacao de US-5 (**P4**).
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` —
 * **CA-5.1**, *"Criar e editar menu exige a capacidade declarada de administrar
 * aparencia"*, e a regra *"A capacidade de administrar aparencia libera menus,
 * componentes e personalizacao, e e exclusiva do papel de administracao"*.
 *
 * ## O portao, na ordem do legado (`wp-admin/nav-menus.php:18`-`:29`)
 *
 * | # | o que | linha | resposta |
 * |---|---|---|---|
 * | 1 | o tema suporta `menus` **ou** `widgets` | `:18`-`:20` | `wp_die()` sem codigo — **500**, o padrao de `wp_die()` fora de Ajax (`wp-includes/functions.php:4410`) |
 * | 2 | `current_user_can( 'edit_theme_options' )` | `:23`-`:29` | `wp_die()` com **403** |
 *
 * O tema vem **antes** da capacidade: quem nao tem permissao num tema sem
 * suporte ve a mensagem do tema, nao a de permissao.
 *
 * ⚠️ **Nao ha meta-capacidade de menu.** UC-30, *Autorizacao*:
 * *"`edit_theme_options` — a mesma do Customizer. Nao ha capacidade propria de
 * menu"*. A tela pergunta pela capacidade **primitiva**, e nao por `customize`:
 * por isso nenhum caso de traducao entra aqui, ao contrario de
 * `personalizacao/permissao-da-personalizacao.ts`. As duas perguntas chegam ao
 * mesmo `edit_theme_options` na instalacao de fabrica, e e isso que a regra de
 * US-5 chama de *"libera menus, componentes e personalizacao"*.
 *
 * A sessao nao e conferida aqui: quem a confere e `wp-admin/admin.php`
 * (`auth_redirect()`), antes de a tela rodar — e a borda.
 *
 * ## Os dois tokens
 *
 * `check_admin_referer()` (`wp-includes/pluggable.php`) recusa com
 * `wp_nonce_ays()` (`wp-includes/functions.php`): **403**, titulo *"An error
 * occurred."* e a mensagem *"The link you followed has expired."* — UC-30,
 * *Excecoes*: *"Nonce vencido: a operacao e recusada e a tela recarrega"*. O
 * atalho *"Please try again."* depende do `Referer`, e quem o monta e a borda.
 * O prazo do token e de `BC-05` (feature 001), e chega por
 * `ContextoDosMenus.verificarNonce`.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import type { ContextoDosMenus } from './contexto-dos-menus.js';

/** `edit_theme_options` — a capacidade de administrar a aparencia. */
export const CAPACIDADE_DOS_MENUS = 'edit_theme_options';

/** `wp-admin/nav-menus.php:19`. */
export const MENSAGEM_DE_TEMA_SEM_MENUS =
  'Your theme does not support navigation menus or widgets.';

/** `wp-admin/nav-menus.php:25`. */
export const TITULO_SEM_PERMISSAO_NOS_MENUS =
  'You need a higher level of permission.';

/** `wp-admin/nav-menus.php:26`. */
export const MENSAGEM_SEM_PERMISSAO_NOS_MENUS =
  'Sorry, you are not allowed to edit theme options on this site.';

/** O titulo de `wp_nonce_ays()` para toda acao que nao e `log-out`. */
export const TITULO_DE_TOKEN_VENCIDO = 'An error occurred.';

/** A mensagem de `wp_nonce_ays()` para toda acao que nao e `log-out`. */
export const MENSAGEM_DE_TOKEN_VENCIDO = 'The link you followed has expired.';

/** Um token de operacao: a acao e o campo do pedido que o carrega. */
export interface TokenDeOperacao {
  readonly acao: string;
  readonly campo: string;
}

/** `check_admin_referer( 'update-nav_menu', 'update-nav-menu-nonce' )` (`nav-menus.php:370`). */
export const TOKEN_DE_GRAVAR_MENU: TokenDeOperacao = {
  acao: 'update-nav_menu',
  campo: 'update-nav-menu-nonce',
};

/** `check_admin_referer( 'save-menu-locations' )` (`nav-menus.php:527`), no campo padrao. */
export const TOKEN_DE_GRAVAR_POSICOES: TokenDeOperacao = {
  acao: 'save-menu-locations',
  campo: '_wpnonce',
};

/**
 * A permissao declarada de cada operacao de US-5, como o **P4** cobra.
 *
 * Todas passam pelo portao da tela; as que gravam pedem, alem dele, o token
 * delas. As funcoes de baixo (`wp_update_nav_menu_object()`,
 * `wp_update_nav_menu_item()`) **nao conferem capacidade nenhuma** no legado:
 * quem confere e a tela, e e so por ela que este modulo as expoe gravando.
 */
export const PERMISSOES_DOS_MENUS = {
  /** Abrir a tela (`nav-menus.php:23`). */
  abrirATela: CAPACIDADE_DOS_MENUS,
  /** Criar ou editar o menu, os itens e as posicoes dele: a tela, mais o token. */
  gravarMenu: CAPACIDADE_DOS_MENUS,
  /** Gravar so as posicoes: a tela, mais o token. */
  gravarPosicoes: CAPACIDADE_DOS_MENUS,
  /** Ler o menu e as posicoes: nenhuma — e o que o tema le para exibir. */
  lerParaExibir: null,
} as const;

/** Por que a tela, ou uma operacao dela, foi recusada. */
export type RecusaDosMenus =
  | {
      readonly tipo: 'tema-sem-suporte';
      readonly status: 500;
      readonly mensagem: string;
    }
  | {
      readonly tipo: 'proibida';
      readonly status: 403;
      readonly titulo: string;
      readonly mensagem: string;
    }
  | {
      readonly tipo: 'token-vencido';
      readonly status: 403;
      readonly titulo: string;
      readonly mensagem: string;
    };

/**
 * O portao da tela de menus (`wp-admin/nav-menus.php:18`-`:29`).
 *
 * `null` e passagem livre; o resto e o `wp_die()` que o legado emitiria.
 */
export function portaoDaTelaDeMenus(
  contexto: ContextoDosMenus,
): RecusaDosMenus | null {
  if (!contexto.temaSuporta('menus') && !contexto.temaSuporta('widgets')) {
    return {
      tipo: 'tema-sem-suporte',
      status: 500,
      mensagem: MENSAGEM_DE_TEMA_SEM_MENUS,
    };
  }
  if (
    !perguntarPermissao(contexto.autorizacao, PERMISSOES_DOS_MENUS.abrirATela)
  ) {
    return {
      tipo: 'proibida',
      status: 403,
      titulo: TITULO_SEM_PERMISSAO_NOS_MENUS,
      mensagem: MENSAGEM_SEM_PERMISSAO_NOS_MENUS,
    };
  }
  return null;
}

/** `check_admin_referer( $acao, $campo )` — `null` quando o token confere. */
export function conferirToken(
  contexto: ContextoDosMenus,
  token: TokenDeOperacao,
  valor: string | undefined,
): RecusaDosMenus | null {
  if (contexto.verificarNonce(token.acao, valor)) {
    return null;
  }
  return {
    tipo: 'token-vencido',
    status: 403,
    titulo: TITULO_DE_TOKEN_VENCIDO,
    mensagem: MENSAGEM_DE_TOKEN_VENCIDO,
  };
}
