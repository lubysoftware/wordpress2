/**
 * As posicoes de menu: as que o tema **declara**, e a associacao de menu a
 * posicao que o site **grava**.
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` (US-5):
 * **CA-5.4** (*"O menu e associado a uma posicao declarada pelo tema, e a
 * associacao e configuracao do site"*) e **CA-5.5** (*"Tema sem posicao
 * declarada ainda permite usar o menu por outro meio"*).
 *
 * ## Duas metades, dois lugares
 *
 * | metade | funcao do legado | onde mora | aqui |
 * |---|---|---|---|
 * | as posicoes declaradas | `register_nav_menus()` / `get_registered_nav_menus()` (`wp-includes/nav-menu.php:90`-`:152`) | global, montada pelo tema no arranque — **nao e banco** | `ContextoDosMenus.posicoesDeclaradas` |
 * | a associacao | `get_nav_menu_locations()` (`:162`-`:165`) / `set_theme_mod( 'nav_menu_locations' )` | a chave `nav_menu_locations` **dentro** de `theme_mods_{folha}` | {@link posicoesAtribuidas}, {@link gravarAssociacao} |
 *
 * ⚠️ **A associacao e por tema.** Como mora em `theme_mods_{folha}`, trocar o
 * tema troca o mapa lido — e e por isso que `switch_theme()` copia o mapa do
 * tema que sai para `theme_switch_menu_locations` (`wp-includes/theme.php:785`-`:786`).
 * Isso e **T017** (US-8); aqui a associacao e lida e gravada sempre no tema
 * ativo.
 *
 * ## CA-5.5: o menu nao depende de posicao
 *
 * Tres fatos do legado, e nenhum foi escrito para esta historia:
 *
 * 1. **A tela abre com `widgets` sozinho** (`wp-admin/nav-menus.php:18`; o
 *    item de painel tambem, `wp-admin/menu.php:250`) — ver
 *    `permissao-dos-menus.ts`;
 * 2. **criar e editar o menu nao consulta posicao nenhuma**:
 *    `wp_update_nav_menu_object()` e `wp_update_nav_menu_item()` nao leem o
 *    registro de posicoes;
 * 3. **exibir o menu pelo identificador nao passa pela associacao**: o
 *    componente de menu de navegacao chama `wp_get_nav_menu_object()` com o
 *    menu escolhido (`wp-includes/widgets/class-wp-nav-menu-widget.php:44`), e
 *    `wp_nav_menu()` tenta o menu pedido **antes** da posicao
 *    (`wp-includes/nav-menu-template.php:129`-`:135`) — {@link menuParaExibir}.
 *
 * ## Ponto de extensao (P2), declarado onde dispararia
 *
 * | ponto | tipo | argumentos | onde |
 * |---|---|---|---|
 * | `has_nav_menu` | filtro | o booleano, a posicao | ultimo passo de {@link temMenuNaPosicao} (`:192`) |
 * | `theme_mod_nav_menu_locations` | filtro | o valor | dentro de `get_theme_mod()`, que e de `armazenamento/configuracao-do-tema.ts` |
 * | `pre_set_theme_mod_nav_menu_locations` | filtro | o valor novo, o antigo | dentro de `set_theme_mod()`, idem |
 */

import {
  arranjoPorNome,
  inteiro,
  nomeDaChave,
  normalizarChaveDeTexto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  MODIFICACAO_DE_POSICOES_DE_MENU,
  valorDaChave,
} from '../armazenamento/index.js';
import {
  inteiroAbsolutoNoPhp,
  type ContextoDosMenus,
  type TermoNosMenus,
} from './contexto-dos-menus.js';
import { menuDeNavegacao, type MenuPedido } from './menu-de-navegacao.js';

/** Um par posicao e valor, na ordem em que o formulario o envia. */
export type ParDePosicao = readonly [string, string];

/**
 * `get_nav_menu_locations()` (`wp-includes/nav-menu.php:162`-`:165`): a
 * modificacao `nav_menu_locations`, ou arranjo vazio quando ela nao e arranjo
 * — inclusive quando nao existe, que e o estado de fabrica.
 */
export function posicoesAtribuidas(contexto: ContextoDosMenus): ValorPhp {
  const valor = contexto.configuracaoDoTema.modificacao(
    contexto.folhaDeEstilo,
    MODIFICACAO_DE_POSICOES_DE_MENU,
  );
  return valor !== undefined && valor.tipo === 'arranjo'
    ? valor
    : arranjoPorNome([]);
}

/** `set_theme_mod( 'nav_menu_locations', $mapa )` — o mapa inteiro, sempre. */
export function gravarAssociacao(
  contexto: ContextoDosMenus,
  mapa: ValorPhp,
): void {
  contexto.configuracaoDoTema.definirModificacao(
    contexto.folhaDeEstilo,
    MODIFICACAO_DE_POSICOES_DE_MENU,
    mapa,
  );
}

/** `empty()` do PHP sobre um valor gravado. */
export function vazioComoValorPhp(valor: ValorPhp | undefined): boolean {
  if (valor === undefined) {
    return true;
  }
  switch (valor.tipo) {
    case 'nulo':
      return true;
    case 'booleano':
      return !valor.valor;
    case 'inteiro':
    case 'decimal':
      return valor.valor === 0;
    case 'texto':
      return (
        typeof valor.valor === 'string' &&
        (valor.valor === '' || valor.valor === '0')
      );
    case 'arranjo':
      return valor.entradas.length === 0;
  }
}

/** `isset( $declaradas[ $posicao ] )` sobre o registro do tema. */
export function posicaoDeclarada(
  contexto: ContextoDosMenus,
  posicao: string,
): boolean {
  return contexto.posicoesDeclaradas.some(([nome]) => nome === posicao);
}

/**
 * `has_nav_menu( $posicao )` (`wp-includes/nav-menu.php:175`-`:193`): a posicao
 * tem de estar **declarada** e o valor associado nao pode ser vazio. Posicao
 * associada e nao declarada — o que sobra de um tema anterior, por exemplo —
 * responde `false` sem ler a associacao.
 */
export function temMenuNaPosicao(
  contexto: ContextoDosMenus,
  posicao: string,
): boolean {
  if (!posicaoDeclarada(contexto, posicao)) {
    // Filtro `has_nav_menu` (`:192`) — declarado no cabecalho.
    return false;
  }
  return !vazioComoValorPhp(
    valorDaChave(posicoesAtribuidas(contexto), posicao),
  );
}

/**
 * `array_map( 'absint', $_POST['menu-locations'] )` — as posicoes pedidas,
 * como arranjo. A chave que for inteiro em texto vira chave inteira, como no
 * arranjo de origem.
 */
export function posicoesPedidas(pares: readonly ParDePosicao[]): ValorPhp {
  return arranjoPorNome(
    pares.map(([posicao, menu]) => [posicao, inteiro(inteiroAbsolutoNoPhp(menu))]),
  );
}

/**
 * `array_merge( $a, $b )`: chave de texto do segundo **substitui no lugar**,
 * chave de texto nova entra no fim, e toda chave inteira — das duas — e
 * **renumerada** a partir de zero.
 */
export function mesclarComoArrayMerge(a: ValorPhp, b: ValorPhp): ValorPhp {
  const resultado: EntradaDeArranjo[] = [];
  let proximoInteiro = 0;
  for (const origem of [a, b]) {
    if (origem.tipo !== 'arranjo') {
      continue;
    }
    for (const entrada of origem.entradas) {
      if (entrada.chave.tipo === 'inteiro') {
        resultado.push({
          chave: { tipo: 'inteiro', valor: proximoInteiro },
          valor: entrada.valor,
        });
        proximoInteiro += 1;
        continue;
      }
      const nome = nomeDaChave(entrada.chave);
      const indice = resultado.findIndex(
        (existente) =>
          existente.chave.tipo === 'texto' &&
          nomeDaChave(existente.chave) === nome,
      );
      if (indice === -1) {
        resultado.push(entrada);
      } else {
        resultado[indice] = { chave: entrada.chave, valor: entrada.valor };
      }
    }
  }
  return { tipo: 'arranjo', entradas: resultado };
}

/** `$mapa[ $posicao ] = $valor` — no lugar se existe, no fim se nao. */
export function atribuirPosicao(
  mapa: ValorPhp,
  posicao: string,
  valor: ValorPhp,
): ValorPhp {
  const entradas = mapa.tipo === 'arranjo' ? [...mapa.entradas] : [];
  const indice = entradas.findIndex(
    (entrada) => nomeDaChave(entrada.chave) === posicao,
  );
  const nova: EntradaDeArranjo = {
    chave: normalizarChaveDeTexto(posicao),
    valor,
  };
  if (indice === -1) {
    entradas.push(nova);
  } else {
    entradas[indice] = nova;
  }
  return { tipo: 'arranjo', entradas };
}

/** `unset( $mapa[ $posicao ] )`, sem reindexar. */
export function retirarPosicao(mapa: ValorPhp, posicao: string): ValorPhp {
  if (mapa.tipo !== 'arranjo') {
    return arranjoPorNome([]);
  }
  return {
    tipo: 'arranjo',
    entradas: mapa.entradas.filter(
      (entrada) => nomeDaChave(entrada.chave) !== posicao,
    ),
  };
}

/** O valor associado, como `wp_get_nav_menu_object()` o recebe. */
function menuDoValor(valor: ValorPhp): MenuPedido {
  switch (valor.tipo) {
    case 'inteiro':
    case 'decimal':
      return valor.valor;
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'booleano':
      return valor.valor ? 1 : 0;
    default:
      return null;
  }
}

/** O que o tema pede a `wp_nav_menu()`. */
export interface PedidoDeExibicao {
  /** `menu` — identificador, slug, nome ou o proprio termo. */
  readonly menu?: MenuPedido;
  /** `theme_location`. */
  readonly posicao?: string;
}

/**
 * Os dois primeiros passos com que `wp_nav_menu()` acha o menu
 * (`wp-includes/nav-menu-template.php:129`-`:135`): **o menu pedido primeiro**,
 * e so sem ele a posicao associada. E a metade de CA-5.5 que mostra o menu
 * sendo usado sem posicao nenhuma.
 *
 * ⚠️ **O terceiro passo nao esta aqui:** sem menu e sem posicao, o legado usa
 * o primeiro menu **com itens** (`:138`-`:147`), e "ter itens" fora do painel e
 * a lista depois do filtro de item invalido (`wp-includes/nav-menu.php:749`-`:751`),
 * que monta cada item por `wp_setup_nav_menu_item()` — e isso e **T013**
 * (US-6, CA-6.4, *"item orfao nao e renderizado para o visitante"*). Devolver o
 * primeiro menu com linha em `posts` aqui escolheria menu que o legado pula.
 * Quem pegar T013 completa este passo e o recurso `fallback_cb` (`:167`-`:170`).
 */
export function menuParaExibir(
  contexto: ContextoDosMenus,
  pedido: PedidoDeExibicao,
): TermoNosMenus | false {
  let menu = menuDeNavegacao(contexto, pedido.menu);

  const atribuidas = posicoesAtribuidas(contexto);
  if (
    menu === false &&
    pedido.posicao !== undefined &&
    pedido.posicao !== '' &&
    pedido.posicao !== '0' &&
    !vazioComoValorPhp(atribuidas)
  ) {
    const valor = valorDaChave(atribuidas, pedido.posicao);
    if (valor !== undefined && valor.tipo !== 'nulo') {
      menu = menuDeNavegacao(contexto, menuDoValor(valor));
    }
  }

  return menu;
}
