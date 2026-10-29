/**
 * O menu como **termo do contexto de classificacao `nav_menu`** — achar, criar
 * e renomear.
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` (US-5), a
 * regra *"Um menu de navegacao e um contexto de classificacao, e cada item do
 * menu e um conteudo"* e a primeira metade de **CA-5.2**.
 *
 * | funcao do legado | ancora | aqui |
 * |---|---|---|
 * | `wp_get_nav_menu_object()` | `wp-includes/nav-menu.php:18`-`:50` | {@link menuDeNavegacao} |
 * | `is_nav_menu()` | `:62`-`:79` | {@link ehMenuDeNavegacao} |
 * | `wp_create_nav_menu()` | `:249`-`:252` | {@link criarMenu} |
 * | `wp_update_nav_menu_object()` | `:312`-`:401` | {@link gravarMenu} |
 *
 * **Nenhuma tabela de menu existe**, e o **P5** recusa a "correcao": o menu e
 * uma linha de `terms` com `term_taxonomy.taxonomy = 'nav_menu'`, e quem a
 * grava e `BC-02`, pela ligacao tardia.
 *
 * ## Pontos de extensao (P2), declarados onde dispariam
 *
 * O barramento (REQ-162) esta em `do-not-rewrite.md`; os nomes, argumentos e
 * posicoes ficam aqui para que a tarefa que o construir encaixe no lugar certo.
 *
 * | ponto | tipo | argumentos | onde |
 * |---|---|---|---|
 * | `wp_get_nav_menu_object` | filtro | o termo ou `false`, o que foi pedido | ultimo passo de {@link menuDeNavegacao} (`:49`) |
 * | `wp_create_nav_menu` | acao | `term_id`, os dados do menu | depois de `wp_insert_term()` dar certo (`:372`) |
 * | `wp_update_nav_menu` | acao | `term_id`, os dados do menu | depois de `wp_update_term()` dar certo (`:399`) |
 */

import {
  inteiroNoPhp,
  type ContextoDosMenus,
  type TermoNosMenus,
} from './contexto-dos-menus.js';

/** `nav_menu` — o contexto de classificacao do menu (`wp-includes/taxonomy.php:109`). */
export const CONTEXTO_DO_MENU = 'nav_menu';

/** `wp-includes/nav-menu.php:337` e `:352`, com o nome escapado no lugar de `%s`. */
export const MENSAGEM_DE_NOME_DE_MENU_REPETIDO =
  'The menu name %s conflicts with another menu name. Please try another.';

/** O que se pode pedir: identificador, slug, nome, ou o proprio termo. */
export type MenuPedido = number | string | TermoNosMenus | null | undefined;

/** O `int|WP_Error` que `wp_update_nav_menu_object()` devolve. */
export type ResultadoDoMenu =
  | { readonly ok: true; readonly menuId: number }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/** Os dados do menu, com as chaves que o legado le de `$menu_data`. */
export interface DadosDoMenu {
  /** `menu-name`. */
  readonly nome: string;
  /** `description`; ausente vale `''`. */
  readonly descricao?: string;
  /** `parent`; ausente vale `0`, presente passa por `(int)`. */
  readonly pai?: string | number;
}

/** A verdade do PHP para o que `wp_get_nav_menu_object()` recebe. */
function verdadeiroNoPhp(valor: MenuPedido): boolean {
  if (valor === null || valor === undefined) {
    return false;
  }
  if (typeof valor === 'number') {
    return valor !== 0;
  }
  if (typeof valor === 'string') {
    return valor !== '' && valor !== '0';
  }
  return true;
}

/**
 * `wp_get_nav_menu_object( $menu )` (`wp-includes/nav-menu.php:18`-`:50`).
 *
 * Tres tentativas, na ordem: pelo identificador, pelo slug, pelo nome — e as
 * tres sao feitas com **o mesmo valor**. O identificador passa por `(int)`
 * dentro de `WP_Term::get_instance()`, logo `'7-principal'` acha o termo `7`
 * antes de qualquer slug, e `'principal'` vira `0` e nao consulta.
 */
export function menuDeNavegacao(
  contexto: ContextoDosMenus,
  menu: MenuPedido,
): TermoNosMenus | false {
  let encontrado: TermoNosMenus | null = null;

  if (typeof menu === 'object' && menu !== null) {
    encontrado = menu;
  }

  if (verdadeiroNoPhp(menu) && encontrado === null) {
    const valor = menu as number | string;
    encontrado = contexto.classificacao.termo(
      inteiroNoPhp(valor),
      CONTEXTO_DO_MENU,
    );
    if (encontrado === null) {
      encontrado = contexto.classificacao.termoPor(
        'slug',
        String(valor),
        CONTEXTO_DO_MENU,
      );
    }
    if (encontrado === null) {
      encontrado = contexto.classificacao.termoPor(
        'name',
        String(valor),
        CONTEXTO_DO_MENU,
      );
    }
  }

  // Filtro `wp_get_nav_menu_object` (`:49`) — declarado no cabecalho.
  return encontrado ?? false;
}

/** `is_nav_menu( $menu )` (`wp-includes/nav-menu.php:62`-`:79`). */
export function ehMenuDeNavegacao(
  contexto: ContextoDosMenus,
  menu: MenuPedido,
): boolean {
  if (!verdadeiroNoPhp(menu)) {
    return false;
  }
  const encontrado = menuDeNavegacao(contexto, menu);
  return (
    encontrado !== false &&
    encontrado.contextoDeClassificacao === CONTEXTO_DO_MENU
  );
}

function nomeRepetido(
  contexto: ContextoDosMenus,
  nome: string,
): ResultadoDoMenu {
  return {
    ok: false,
    codigo: 'menu_exists',
    mensagem: MENSAGEM_DE_NOME_DE_MENU_REPETIDO.replace(
      '%s',
      `<strong>${contexto.escaparHtml(nome)}</strong>`,
    ),
  };
}

/**
 * `wp_update_nav_menu_object( $menu_id, $menu_data )`
 * (`wp-includes/nav-menu.php:312`-`:401`): cria o menu quando `menuId` nao acha
 * menu, e renomeia quando acha.
 *
 * ⚠️ **O nome e conferido duas vezes na criacao** (`:326` e `:345`), e as duas
 * consultas saem: a segunda e redundante no legado, e a sequencia de consultas
 * e o que a area 3 compara. O nome e a unica unicidade que o menu tem — o slug
 * e `null` e fica com `wp_insert_term()`.
 *
 * O ramo `return 0` de `:377`-`:379` nao e alcancavel: quem chega ali ja tem
 * `$_menu` com `term_id`. Nao foi portado como desfecho.
 */
export function gravarMenu(
  contexto: ContextoDosMenus,
  menuId: number,
  dados: DadosDoMenu,
): ResultadoDoMenu {
  const existente = menuDeNavegacao(contexto, menuId);

  const argumentos = {
    descricao: dados.descricao ?? '',
    nome: dados.nome,
    pai: dados.pai === undefined ? 0 : inteiroNoPhp(dados.pai),
    slug: null,
  } as const;

  // `:326`-`:341` — outro menu ja tem este nome.
  const homonimo = contexto.classificacao.termoPor(
    'name',
    dados.nome,
    CONTEXTO_DO_MENU,
  );
  if (homonimo !== null && homonimo.termoId !== menuId) {
    return nomeRepetido(contexto, dados.nome);
  }

  // `:344`-`:375` — o menu nao existe: cria.
  if (existente === false) {
    if (
      contexto.classificacao.termoPor('name', dados.nome, CONTEXTO_DO_MENU) !==
      null
    ) {
      return nomeRepetido(contexto, dados.nome);
    }
    const criado = contexto.classificacao.inserirTermo(
      dados.nome,
      CONTEXTO_DO_MENU,
      argumentos,
    );
    if (!criado.ok) {
      return criado;
    }
    // Acao `wp_create_nav_menu` (`:372`) — declarada no cabecalho.
    return { ok: true, menuId: criado.termoId };
  }

  // `:381`-`:400` — o menu existe: atualiza.
  const atualizado = contexto.classificacao.atualizarTermo(
    existente.termoId,
    CONTEXTO_DO_MENU,
    argumentos,
  );
  if (!atualizado.ok) {
    return atualizado;
  }
  // Acao `wp_update_nav_menu` (`:399`) — declarada no cabecalho.
  return { ok: true, menuId: atualizado.termoId };
}

/** `wp_create_nav_menu( $nome )` (`wp-includes/nav-menu.php:249`-`:252`). */
export function criarMenu(
  contexto: ContextoDosMenus,
  nome: string,
): ResultadoDoMenu {
  return gravarMenu(contexto, 0, { nome });
}
