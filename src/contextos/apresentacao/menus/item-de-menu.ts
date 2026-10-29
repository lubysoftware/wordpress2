/**
 * O item de menu — **um conteudo do tipo `nav_menu_item`**, ligado ao termo do
 * menu, com o destino, a ordem e a hierarquia gravados do jeito do legado.
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` (US-5):
 * **CA-5.2** (*"Um item do menu pode apontar para um conteudo, para uma
 * classificacao ou para um endereco externo"*) e **CA-5.3** (*"A ordem e a
 * hierarquia dos itens sao preservadas e editaveis"*). E o porte de
 * `wp_update_nav_menu_item()` (`wp-includes/nav-menu.php:418`-`:631`).
 *
 * ## Onde cada coisa fica gravada — e nada disso e a forma "correta"
 *
 * | o que | onde | linha |
 * |---|---|---|
 * | a ordem | `posts.menu_order` do item | `:526` |
 * | a **hierarquia** | o metadado `_menu_item_menu_item_parent`, em **texto** | `:589` |
 * | o tipo do destino (`post_type`, `taxonomy`, `post_type_archive`, `custom`) | `_menu_item_type` | `:588` |
 * | o destino | `_menu_item_object_id` (texto) e `_menu_item_object` | `:590`-`:591` |
 * | o endereco externo | `_menu_item_url` — **vazio** para destino interno | `:488`, `:598` |
 * | o menu | a relacao do item com o termo `nav_menu` | `:569`-`:574` |
 *
 * 🔴 **`posts.post_parent` do item NAO e o item pai.** E o pai **do destino**:
 * o `post_parent` do conteudo apontado, ou o `parent` do termo apontado
 * (`:496`, `:503`); para endereco externo, o que o item ja tinha (`:476`). O
 * risco 3 de `plan.md` diz o preco de "corrigir" isso: *"muda o que extensao de
 * menu le"*.
 *
 * ## Tres comportamentos que parecem defeito, e sao o legado
 *
 * 1. **O primeiro item de um menu vazio fica na posicao `0`, e o segundo na
 *    `2`.** A posicao pedida `0` e calculada pela lista de itens, que
 *    `wp_get_nav_menu_items()` **renumera de 1 a n** depois de ordenar
 *    (`:753`-`:765`): com n itens, o novo vai para `n + 1`; com nenhum, para
 *    `count()` da lista vazia (`:467`-`:473`). Nada renumera o primeiro.
 * 2. **Destino interno com o titulo igual ao original grava titulo vazio**
 *    (`:514`-`:516`), para acompanhar o destino quando ele for renomeado; e
 *    com titulo e descricao vazios a descricao vira `' '` (`:518`-`:521`) — o
 *    proprio legado chama isso de *"Hack"*.
 * 3. **Item gravado sem menu (`menuId` `0`) e rascunho orfao**: posicao `1`,
 *    e o metadado `_menu_item_orphaned` com o instante (`:600`-`:604`). E o
 *    estado do item que a tela acrescenta antes de o menu ser salvo. Destino
 *    inexistente **nao e recusado**: o item e gravado com titulo e pai vazios
 *    — a sinalizacao disso e US-6 (T013), nao daqui.
 *
 * ## Pontos de extensao (P2), declarados onde dispariam
 *
 * | ponto | tipo | argumentos | onde |
 * |---|---|---|---|
 * | `wp_add_nav_menu_item` | acao | `$menu_id`, o id novo, `$args` | logo depois de inserir o item (`:562`) |
 * | `wp_update_nav_menu_item` | acao | `$menu_id`, o id, `$args` | antes de devolver, em toda gravacao bem-sucedida (`:628`) |
 *
 * Os pontos de `wp_insert_post()` e `update_post_meta()` sao de `BC-01`, e
 * `$fire_after_hooks` chega a ligacao como {@link GravacaoDoItem.dispararGanchosPosteriores}.
 */

import {
  aparadoNoPhp,
  inteiroNoPhp,
  type ContextoDosMenus,
  type LinhaDeItemDoMenu,
  type PedidoDoItemDeMenu,
} from './contexto-dos-menus.js';
import {
  CONTEXTO_DO_MENU,
  menuDeNavegacao,
  type MenuPedido,
} from './menu-de-navegacao.js';

/** `nav_menu_item` — o tipo de conteudo do item. */
export const TIPO_DO_ITEM_DE_MENU = 'nav_menu_item';

/** Os quatro tipos de destino que `wp_update_nav_menu_item()` distingue. */
export const TIPOS_DE_DESTINO = [
  'post_type',
  'taxonomy',
  'post_type_archive',
  'custom',
] as const;

/** Os metadados do item, na ordem em que `wp_update_nav_menu_item()` os grava. */
export const METADADOS_DO_ITEM = {
  tipo: '_menu_item_type',
  pai: '_menu_item_menu_item_parent',
  destinoId: '_menu_item_object_id',
  destino: '_menu_item_object',
  alvo: '_menu_item_target',
  classes: '_menu_item_classes',
  xfn: '_menu_item_xfn',
  endereco: '_menu_item_url',
  orfao: '_menu_item_orphaned',
} as const;

/** `wp-includes/nav-menu.php:424`. */
export const MENSAGEM_DE_ITEM_QUE_NAO_E_DE_MENU =
  'The given object ID is not that of a menu item.';

/** `wp-includes/nav-menu.php:430`. */
export const MENSAGEM_DE_MENU_INVALIDO = 'Invalid menu ID.';

/** Os campos de `$menu_item_data`, com os nomes do formulario da tela. */
export type CampoDoItem =
  | 'menu-item-db-id'
  | 'menu-item-object-id'
  | 'menu-item-object'
  | 'menu-item-parent-id'
  | 'menu-item-position'
  | 'menu-item-type'
  | 'menu-item-title'
  | 'menu-item-url'
  | 'menu-item-description'
  | 'menu-item-attr-title'
  | 'menu-item-target'
  | 'menu-item-classes'
  | 'menu-item-xfn'
  | 'menu-item-status'
  | 'menu-item-post-date'
  | 'menu-item-post-date-gmt';

/** `$menu_item_data`: o que faltar vale o padrao do legado (`:437`-`:456`). */
export type DadosDoItem = Readonly<Partial<Record<CampoDoItem, string | number>>>;

/** Os argumentos depois de `wp_parse_args()`. */
type ArgumentosDoItem = Record<CampoDoItem, string | number>;

/** O `int|WP_Error` que `wp_update_nav_menu_item()` devolve. */
export type ResultadoDoItem =
  | { readonly ok: true; readonly itemId: number }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/** O pedido de `wp_update_nav_menu_item( $menu_id, $menu_item_db_id, $dados )`. */
export interface GravacaoDoItem {
  /** `0` grava o item como rascunho orfao, fora de menu. */
  readonly menuId: number;
  /** `0` cria um item novo. */
  readonly itemId: number;
  readonly dados: DadosDoItem;
  /** `$fire_after_hooks` — o padrao e `true`. */
  readonly dispararGanchosPosteriores?: boolean;
}

/** `is_nav_menu_item( $id )` (`wp-includes/nav-menu.php:235`-`:237`). */
export function ehItemDeMenu(contexto: ContextoDosMenus, id: number): boolean {
  return contexto.conteudo.tipoDoConteudo(id) === TIPO_DO_ITEM_DE_MENU;
}

/**
 * Os itens do menu como `wp_get_nav_menu_items()` os devolve a tela
 * (`wp-includes/nav-menu.php:712`-`:778`).
 *
 * Recebe o menu **como foi pedido** e o procura de novo, como o legado faz
 * (`:713`): com o cache de objeto desligado nas duas metades da paridade, essa
 * segunda busca e consulta, e a sequencia de consultas e o que a area 3 compara.
 * Menu que nao existe devolve lista vazia (o legado devolve `false`, e os dois
 * chamadores daqui o tratam como lista vazia). Contagem do termo que nao e
 * positiva tambem, sem consultar (`:741`-`:745`).
 *
 * Depois da consulta, os itens sao **ordenados pela chave de saida e
 * renumerados de 1 a n nela** (`:753`-`:765`). ⚠️ Com a chave `ID`, que e a que
 * a tela usa ao gravar, o legado renumera o proprio `ID` do objeto — e a tela
 * le `db_id`, que `wp_setup_nav_menu_item()` copiou antes (`:863`). Aqui a lista com a
 * chave `ID` devolve o identificador real, que e o que `db_id` carrega.
 *
 * A filtragem de item invalido (`:749`-`:751`) so roda fora do painel, e a
 * montagem de cada item (`wp_setup_nav_menu_item()`) e de **T013** (US-6): a
 * tela de menus e painel, e e dela que esta funcao serve.
 */
export function itensDoMenuNaTela(
  contexto: ContextoDosMenus,
  menuPedido: MenuPedido,
  estados: readonly string[],
  ordenarPor: 'menu_order' | 'ID' = 'menu_order',
): readonly LinhaDeItemDoMenu[] {
  const menu = menuDeNavegacao(contexto, menuPedido);
  if (menu === false || menu.contagem <= 0) {
    return [];
  }
  const linhas = contexto.conteudo.itensDoMenu(
    menu.termoTaxonomiaId,
    estados,
    ordenarPor,
  );
  const chave = (linha: LinhaDeItemDoMenu): number =>
    ordenarPor === 'ID' ? linha.id : linha.ordemNoMenu;
  // `wp_list_sort()` e estavel desde o PHP 8; `Array.prototype.sort` tambem.
  const ordenadas = [...linhas].sort((a, b) => chave(a) - chave(b));
  return ordenarPor === 'ID'
    ? ordenadas
    : ordenadas.map((linha, indice) => ({ ...linha, ordemNoMenu: indice + 1 }));
}

function textoDoArgumento(valor: string | number): string {
  return typeof valor === 'number' ? String(valor) : valor;
}

/**
 * `wp_update_nav_menu_item()` (`wp-includes/nav-menu.php:418`-`:631`), passo a
 * passo e na ordem dos comandos.
 */
export function gravarItemDeMenu(
  contexto: ContextoDosMenus,
  gravacao: GravacaoDoItem,
): ResultadoDoItem {
  const { menuId } = gravacao;
  let itemId = gravacao.itemId;

  // `:423`-`:425` — nao transformar outro conteudo em item de menu.
  if (itemId !== 0 && !ehItemDeMenu(contexto, itemId)) {
    return {
      ok: false,
      codigo: 'update_nav_menu_item_failed',
      mensagem: MENSAGEM_DE_ITEM_QUE_NAO_E_DE_MENU,
    };
  }

  // `:427`-`:435`.
  const menu = menuDeNavegacao(contexto, menuId);
  if (menu === false && menuId !== 0) {
    return {
      ok: false,
      codigo: 'invalid_menu_id',
      mensagem: MENSAGEM_DE_MENU_INVALIDO,
    };
  }

  // `:437`-`:456` — `wp_parse_args()`: o pedido por cima dos padroes.
  const argumentos: ArgumentosDoItem = {
    'menu-item-db-id': itemId,
    'menu-item-object-id': 0,
    'menu-item-object': '',
    'menu-item-parent-id': 0,
    'menu-item-position': 0,
    'menu-item-type': 'custom',
    'menu-item-title': '',
    'menu-item-url': '',
    'menu-item-description': '',
    'menu-item-attr-title': '',
    'menu-item-target': '',
    'menu-item-classes': '',
    'menu-item-xfn': '',
    'menu-item-status': '',
    'menu-item-post-date': '',
    'menu-item-post-date-gmt': '',
  };
  for (const [campo, valor] of Object.entries(gravacao.dados)) {
    if (valor !== undefined) {
      argumentos[campo as CampoDoItem] = valor;
    }
  }

  // `:458`-`:474` — a posicao.
  if (menuId === 0) {
    argumentos['menu-item-position'] = 1;
  } else if (inteiroNoPhp(argumentos['menu-item-position']) === 0) {
    const itens = itensDoMenuNaTela(contexto, menuId, ['publish', 'draft']);
    const ultimo = itens[itens.length - 1];
    argumentos['menu-item-position'] =
      ultimo === undefined ? 0 : 1 + ultimo.ordemNoMenu;
  }

  // `:476` — o pai do item existente, lido da coluna.
  let paiOriginal =
    itemId > 0 ? (contexto.conteudo.conteudo(itemId)?.paiId ?? 0) : 0;

  const tipo = argumentos['menu-item-type'];
  if (tipo === 'custom') {
    // `:478`-`:480`.
    argumentos['menu-item-url'] = aparadoNoPhp(
      textoDoArgumento(argumentos['menu-item-url']),
    );
  } else {
    // `:481`-`:522` — destino interno: o endereco e o do destino.
    argumentos['menu-item-url'] = '';
    let tituloOriginal = '';
    const destinoId = inteiroNoPhp(argumentos['menu-item-object-id']);
    const destino = textoDoArgumento(argumentos['menu-item-object']);

    if (tipo === 'taxonomy') {
      const termo = contexto.classificacao.termo(destinoId, destino);
      if (termo !== null) {
        paiOriginal = termo.pai;
        tituloOriginal = termo.nome;
      }
    } else if (tipo === 'post_type') {
      const conteudo = contexto.conteudo.conteudo(destinoId);
      if (conteudo !== null) {
        paiOriginal = conteudo.paiId;
        tituloOriginal = conteudo.titulo;
      }
    } else if (tipo === 'post_type_archive') {
      const rotulo = contexto.conteudo.rotuloDeArquivoDoTipo(destino);
      if (rotulo !== null) {
        tituloOriginal = rotulo;
      }
    }

    if (textoDoArgumento(argumentos['menu-item-title']) === tituloOriginal) {
      argumentos['menu-item-title'] = '';
    }
    if (
      argumentos['menu-item-title'] === '' &&
      argumentos['menu-item-description'] === ''
    ) {
      argumentos['menu-item-description'] = ' ';
    }
  }

  // `:525`-`:538` — a linha de `posts`.
  const dataResolvida = contexto.conteudo.resolverData(
    textoDoArgumento(argumentos['menu-item-post-date']),
    textoDoArgumento(argumentos['menu-item-post-date-gmt']),
  );
  const linha = {
    menu_order: inteiroNoPhp(argumentos['menu-item-position']),
    ping_status: 0,
    post_content: textoDoArgumento(argumentos['menu-item-description']),
    post_excerpt: textoDoArgumento(argumentos['menu-item-attr-title']),
    post_parent: paiOriginal,
    post_title: textoDoArgumento(argumentos['menu-item-title']),
    post_type: TIPO_DO_ITEM_DE_MENU,
    ...(dataResolvida === false || dataResolvida === ''
      ? {}
      : { post_date: dataResolvida }),
  } as const;

  const atualizacao = itemId !== 0;
  const estadoPedido = argumentos['menu-item-status'];

  // `:543`-`:563` — item novo: rascunho, salvo pedido explicito.
  if (!atualizacao) {
    const pedido: PedidoDoItemDeMenu = {
      ...linha,
      ID: 0,
      post_status: estadoPedido === 'publish' ? 'publish' : 'draft',
    };
    const inserido = contexto.conteudo.inserir(
      pedido,
      gravacao.dispararGanchosPosteriores ?? true,
    );
    if (!inserido.ok) {
      return inserido;
    }
    itemId = inserido.id;
    // Acao `wp_add_nav_menu_item` (`:562`) — declarada no cabecalho.
  }

  // `:569`-`:574` — o item entra no termo do menu, so se ainda nao esta.
  if (
    menuId !== 0 &&
    menu !== false &&
    (!atualizacao ||
      !contexto.classificacao.objetoNoTermo(
        itemId,
        CONTEXTO_DO_MENU,
        menu.termoId,
      ))
  ) {
    const ligado = contexto.classificacao.definirTermosDoObjeto(
      itemId,
      [menu.termoId],
      CONTEXTO_DO_MENU,
    );
    if (!ligado.ok) {
      return ligado;
    }
  }

  // `:576`-`:579` — endereco externo aponta para si mesmo.
  if (tipo === 'custom') {
    argumentos['menu-item-object-id'] = itemId;
    argumentos['menu-item-object'] = 'custom';
  }

  // `:583`-`:586` — item nao pode ser pai de si mesmo.
  if (inteiroNoPhp(argumentos['menu-item-parent-id']) === itemId) {
    argumentos['menu-item-parent-id'] = 0;
  }

  // `:588`-`:598` — os metadados, nesta ordem.
  const { conteudo } = contexto;
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.tipo,
    contexto.sanitizarChave(textoDoArgumento(tipo)),
  );
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.pai,
    String(inteiroNoPhp(argumentos['menu-item-parent-id'])),
  );
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.destinoId,
    String(inteiroNoPhp(argumentos['menu-item-object-id'])),
  );
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.destino,
    contexto.sanitizarChave(textoDoArgumento(argumentos['menu-item-object'])),
  );
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.alvo,
    contexto.sanitizarChave(textoDoArgumento(argumentos['menu-item-target'])),
  );
  const classes = textoDoArgumento(argumentos['menu-item-classes'])
    .split(' ')
    .map((classe) => contexto.sanitizarClasseHtml(classe));
  const xfn = textoDoArgumento(argumentos['menu-item-xfn'])
    .split(' ')
    .map((parte) => contexto.sanitizarClasseHtml(parte))
    .join(' ');
  conteudo.definirMetadado(itemId, METADADOS_DO_ITEM.classes, classes);
  conteudo.definirMetadado(itemId, METADADOS_DO_ITEM.xfn, xfn);
  conteudo.definirMetadado(
    itemId,
    METADADOS_DO_ITEM.endereco,
    contexto.sanitizarEndereco(textoDoArgumento(argumentos['menu-item-url'])),
  );

  // `:600`-`:604` — o orfao.
  if (menuId === 0) {
    conteudo.definirMetadado(
      itemId,
      METADADOS_DO_ITEM.orfao,
      String(contexto.agora()),
    );
  } else if (conteudo.temMetadado(itemId, METADADOS_DO_ITEM.orfao)) {
    conteudo.apagarMetadado(itemId, METADADOS_DO_ITEM.orfao);
  }

  // `:607`-`:615` — item existente: publicado, salvo pedido de rascunho.
  if (atualizacao) {
    const atualizado = conteudo.atualizar({
      ...linha,
      ID: itemId,
      post_status: estadoPedido === 'draft' ? 'draft' : 'publish',
    });
    if (!atualizado.ok) {
      return atualizado;
    }
  }

  // Acao `wp_update_nav_menu_item` (`:628`) — declarada no cabecalho.
  return { ok: true, itemId };
}
