/**
 * Gravar o menu pela tela de menus: as acoes `update` e `locations` de
 * `wp-admin/nav-menus.php`, e o lote de itens que a primeira grava.
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` (US-5).
 * E aqui que os cinco criterios se encontram: o portao e o token (**CA-5.1**),
 * os itens com destino (**CA-5.2**), a ordem e a hierarquia enviadas pela tela
 * (**CA-5.3**), as posicoes marcadas no formulario (**CA-5.4**) e o menu gravado
 * sem posicao nenhuma (**CA-5.5**).
 *
 * | o que | ancora | aqui |
 * |---|---|---|
 * | a acao `update` | `wp-admin/nav-menus.php:369`-`:516` | {@link gravarMenuPelaTela} |
 * | a acao `locations` | `wp-admin/nav-menus.php:518`-`:544` | {@link gravarPosicoesPelaTela} |
 * | `wp_nav_menu_update_menu_items()` | `wp-admin/includes/nav-menu.php:1402`-`:1527` | {@link gravarItensDoMenu} |
 *
 * ## A ordem dos passos e observavel
 *
 * Antes de qualquer acao, a tela **le** a associacao de posicoes
 * (`nav-menus.php:50`-`:52`): a leitura sai antes do token, e um token vencido
 * ainda assim deixa essa consulta no registro. O portao e o token vem antes de
 * qualquer escrita. Na acao `update`, a associacao e gravada **antes** do nome e
 * dos itens (`:467`), logo um nome invalido nao desfaz a posicao gravada.
 *
 * ## Tres comportamentos que parecem defeito, e sao o legado
 *
 * 1. **Item que a tela nao envia e apagado** (`wp-admin/includes/nav-menu.php:1473`-`:1480`):
 *    a gravacao do menu e a lista **inteira**. Item de titulo vazio e pulado
 *    (`:1443`-`:1446`) — e, nao sendo removido da lista, e apagado no fim.
 * 2. **Menu novo com posicoes marcadas grava o menu novo em todas elas**, com
 *    qualquer valor que o formulario tenha mandado (`nav-menus.php:419`-`:427`);
 *    menu existente grava o mapa mesclado (`:457`-`:467`).
 * 3. **`nav_menu_options` nasce com uma entrada `0 => false`** na primeira
 *    gravacao de uma instalacao nova: a opcao nao e semeada pelo instalador, e
 *    `(array) get_option( 'nav_menu_options' )` de `false` e `array( false )`
 *    (`wp-admin/includes/nav-menu.php:1484`). O **P1** manda reproduzir.
 *
 * ## O que esta tela tem e esta tarefa NAO porta
 *
 * | o que | ancora | por que |
 * |---|---|---|
 * | `move-up-menu-item`, `move-down-menu-item` | `nav-menus.php:75`-`:276` | o caminho sem JavaScript de reordenar; a ordem e a hierarquia de CA-5.3 chegam pelos campos de cada item na acao `update`, que e o que a tela com JavaScript envia |
 * | `delete-menu-item`, `delete`, `delete_menus` | `:278`-`:367` | apagar menu e item nao e criterio de US-5; o item que aponta para o que foi apagado e US-6 (**T013**) |
 * | `add-menu-item` e o `menu-item` na criacao | `:64`-`:73`, `:400`-`:402` | acrescentar pelo painel lateral e o pedido Ajax que cria o item **orfao** — {@link gravarItemDeMenu} com menu `0` ja e esse estado; o `absint()` de arranjo de `:401` nao tem efeito util a reproduzir aqui sem o oraculo executavel |
 * | `_wp_expand_nav_menu_post_data()` | `:61` | desdobra o JSON do formulario em `$_POST`: e da borda, que entrega o pedido ja desdobrado |
 * | `wp_redirect()` e a tela montada | `:441`, `:510` | a tela entra como dado: o desfecho diz **para onde**, a borda redireciona |
 *
 * ## Pontos de extensao (P2), declarados onde dispariam
 *
 * | ponto | tipo | argumentos | onde |
 * |---|---|---|---|
 * | `check_admin_referer` | acao | a acao do token, o resultado | dentro de `check_admin_referer()`, antes da recusa |
 * | `wp_update_nav_menu` | acao | o id do menu, `array()` | fim de {@link gravarItensDoMenu} (`wp-admin/includes/nav-menu.php:1512`) |
 */

import {
  inteiro,
  lista,
  nomeDaChave,
  normalizarChaveDeTexto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { atribuirChave, valorDaChave } from '../armazenamento/index.js';
import {
  aparadoNoPhp,
  inteiroNoPhp,
  vazioNoPhp,
  type ContextoDosMenus,
} from './contexto-dos-menus.js';
import {
  ehItemDeMenu,
  gravarItemDeMenu,
  itensDoMenuNaTela,
  type CampoDoItem,
} from './item-de-menu.js';
import { gravarMenu, menuDeNavegacao } from './menu-de-navegacao.js';
import {
  conferirToken,
  portaoDaTelaDeMenus,
  TOKEN_DE_GRAVAR_MENU,
  TOKEN_DE_GRAVAR_POSICOES,
  type RecusaDosMenus,
} from './permissao-dos-menus.js';
import {
  atribuirPosicao,
  gravarAssociacao,
  mesclarComoArrayMerge,
  posicaoDeclarada,
  posicoesAtribuidas,
  posicoesPedidas,
  retirarPosicao,
  type ParDePosicao,
} from './posicoes-de-menu.js';

/** `nav_menu_options` — a opcao das paginas acrescentadas automaticamente. */
export const OPCAO_DAS_OPCOES_DE_MENU = 'nav_menu_options';

/** `wp-admin/nav-menus.php:446` e `:475`. */
export const MENSAGEM_DE_NOME_DE_MENU_INVALIDO = 'Please enter a valid menu name.';

/** `wp-admin/includes/nav-menu.php:1515`, com o titulo no lugar de `%s`. */
export const MENSAGEM_DE_MENU_ATUALIZADO = '%s has been updated.';

/** `wp-admin/nav-menus.php:535`. */
export const MENSAGEM_DE_POSICOES_ATUALIZADAS = 'Menu locations updated.';

/** O endereco da tela, para onde os redirecionamentos vao. */
export const ENDERECO_DA_TELA_DE_MENUS = 'nav-menus.php';

/** Um aviso da tela — o que `wp_get_admin_notice()` recebe, sem a marcacao. */
export interface AvisoDaTela {
  readonly tipo: 'erro' | 'atualizado';
  readonly texto: string;
  readonly dispensavel: boolean;
}

/** Os campos que `wp_nav_menu_update_menu_items()` le de cada item (`:1421`-`:1435`). */
export const CAMPOS_DO_ITEM_NA_TELA: readonly CampoDoItem[] = [
  'menu-item-db-id',
  'menu-item-object-id',
  'menu-item-object',
  'menu-item-parent-id',
  'menu-item-position',
  'menu-item-type',
  'menu-item-title',
  'menu-item-url',
  'menu-item-description',
  'menu-item-attr-title',
  'menu-item-target',
  'menu-item-classes',
  'menu-item-xfn',
];

/**
 * Um item no formulario: a chave do arranjo `menu-item-db-id[chave]` e os
 * campos `menu-item-*[chave]` que vieram. A ordem da lista e a ordem do
 * `$_POST`.
 */
export interface ItemNoFormulario {
  readonly chave: string;
  readonly campos: Readonly<Partial<Record<CampoDoItem, string>>>;
}

/** O pedido da acao `update`, ja sem barra de escape (ver `contexto-dos-menus.ts`). */
export interface PedidoDeGravacaoDoMenu {
  /** `$_REQUEST['menu']`, ja por `(int)`; ausente vale `0`, que e menu novo. */
  readonly menu: number;
  /** `$_REQUEST['update-nav-menu-nonce']`. */
  readonly token: string | undefined;
  /** `$_POST['menu-name']`. */
  readonly nomeDoMenu: string;
  /** `$_POST['menu-locations']` — ausente e `undefined`, nao lista vazia. */
  readonly posicoes?: readonly ParDePosicao[];
  /** `$_POST['menu-item-db-id']` e os campos irmaos; ausente e nenhum item. */
  readonly itens?: readonly ItemNoFormulario[];
  /** `$_POST['auto-add-pages']`. */
  readonly paginasAutomaticas?: string;
  /** `isset( $_REQUEST['zero-menu-state'] )`. */
  readonly estadoSemMenus?: boolean;
  /** `$_REQUEST['use-location']`. */
  readonly usarPosicao?: string;
}

/** O pedido da acao `locations`. */
export interface PedidoDeGravacaoDasPosicoes {
  /** `$_REQUEST['_wpnonce']`. */
  readonly token: string | undefined;
  /** `$_POST['menu-locations']` — ausente e `undefined`. */
  readonly posicoes?: readonly ParDePosicao[];
}

/** O que a tela faz depois da acao. */
export type DesfechoDaTelaDeMenus =
  | { readonly desfecho: 'recusada'; readonly recusa: RecusaDosMenus }
  | { readonly desfecho: 'redirecionar'; readonly endereco: string }
  | {
      readonly desfecho: 'tela';
      /** `$nav_menu_selected_id` depois da acao. */
      readonly menuSelecionado: number;
      /** `$nav_menu_selected_title` depois da acao. */
      readonly tituloSelecionado: string;
      readonly avisos: readonly AvisoDaTela[];
    };

/** `trim( esc_html( $nome ) )` — nessa ordem (`nav-menus.php:381`, `:471`). */
function nomeLimpo(contexto: ContextoDosMenus, nome: string): string {
  return aparadoNoPhp(contexto.escaparHtml(nome));
}

/** `in_array( $id, $lista, true )` e `array_search( $id, $lista, true )`. */
function indiceDoInteiro(lista: ValorPhp, id: number): number {
  if (lista.tipo !== 'arranjo') {
    return -1;
  }
  return lista.entradas.findIndex(
    (entrada) => entrada.valor.tipo === 'inteiro' && entrada.valor.valor === id,
  );
}

/** O texto que `array_intersect()` compara: `(string) $valor`. */
function textoParaComparar(valor: ValorPhp): string {
  switch (valor.tipo) {
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'nulo':
      return '';
    case 'arranjo':
      return 'Array';
  }
}

/** `(array) $valor` — `null` vira vazio, escalar vira `array( $valor )`. */
function comoArranjoNoPhp(valor: ValorPhp): ValorPhp {
  if (valor.tipo === 'arranjo') {
    return valor;
  }
  if (valor.tipo === 'nulo') {
    return lista([]);
  }
  return lista([valor]);
}

/**
 * As paginas acrescentadas automaticamente, regravadas a cada gravacao de menu
 * (`wp-admin/includes/nav-menu.php:1482`-`:1507`).
 */
function gravarPaginasAutomaticas(
  contexto: ContextoDosMenus,
  menuId: number,
  ligadas: boolean,
): void {
  const { opcoes } = contexto.configuracaoDoTema;
  let opcao = comoArranjoNoPhp(opcoes.lerComoNoLegado(OPCAO_DAS_OPCOES_DE_MENU));

  // `isset()` e falso tambem para `null` gravado.
  const atual = valorDaChave(opcao, 'auto_add');
  let automaticas: ValorPhp =
    atual === undefined || atual.tipo === 'nulo' ? lista([]) : atual;

  if (ligadas) {
    if (indiceDoInteiro(automaticas, menuId) === -1) {
      // `$lista[] = $id`: a proxima chave inteira depois da maior.
      const entradas = automaticas.tipo === 'arranjo' ? automaticas.entradas : [];
      const maior = entradas.reduce(
        (maximo, entrada) =>
          entrada.chave.tipo === 'inteiro'
            ? Math.max(maximo, entrada.chave.valor)
            : maximo,
        -1,
      );
      automaticas = {
        tipo: 'arranjo',
        entradas: [
          ...entradas,
          { chave: { tipo: 'inteiro', valor: maior + 1 }, valor: inteiro(menuId) },
        ],
      };
    }
  } else {
    const indice = indiceDoInteiro(automaticas, menuId);
    if (indice !== -1 && automaticas.tipo === 'arranjo') {
      automaticas = {
        tipo: 'arranjo',
        entradas: automaticas.entradas.filter((_, i) => i !== indice),
      };
    }
  }

  // `array_intersect()` com os menus que existem: as chaves ficam.
  const existentes = new Set(
    contexto.classificacao.idsDosMenus().map((id) => String(id)),
  );
  if (automaticas.tipo === 'arranjo') {
    automaticas = {
      tipo: 'arranjo',
      entradas: automaticas.entradas.filter((entrada) =>
        existentes.has(textoParaComparar(entrada.valor)),
      ),
    };
  }

  opcao = atribuirChave(opcao, 'auto_add', automaticas);
  opcoes.gravar(OPCAO_DAS_OPCOES_DE_MENU, opcao, false);
}

/**
 * `wp_nav_menu_update_menu_items( $menu_id, $titulo )`
 * (`wp-admin/includes/nav-menu.php:1402`-`:1527`): grava os itens enviados,
 * apaga os que nao vieram, regrava `nav_menu_options` e devolve os avisos.
 */
export function gravarItensDoMenu(
  contexto: ContextoDosMenus,
  menuId: number,
  titulo: string,
  pedido: Pick<PedidoDeGravacaoDoMenu, 'itens' | 'paginasAutomaticas'>,
): AvisoDaTela[] {
  // `:1403`-`:1419` — os itens que o menu tem, pelo identificador real.
  const restantes = new Set(
    itensDoMenuNaTela(contexto, menuId, ['draft', 'publish'], 'ID').map(
      (linha) => linha.id,
    ),
  );
  const avisos: AvisoDaTela[] = [];

  // `wp_defer_term_counting( true )` (`:1437`).
  contexto.classificacao.adiarContagem(true);

  // `:1440`-`:1471`.
  for (const item of pedido.itens ?? []) {
    const tituloDoItem = item.campos['menu-item-title'];
    if (tituloDoItem === undefined || tituloDoItem === '') {
      continue;
    }

    const dados: Partial<Record<CampoDoItem, string>> = {};
    for (const campo of CAMPOS_DO_ITEM_NA_TELA) {
      dados[campo] = item.campos[campo] ?? '';
    }

    // `(int) $_POST['menu-item-db-id'][ $_key ] !== $_key ? 0 : $_key` — a
    // chave so e inteiro quando o arranjo de origem a normalizou para inteiro.
    const chave = normalizarChaveDeTexto(item.chave);
    const itemId =
      chave.tipo === 'inteiro' &&
      inteiroNoPhp(item.campos['menu-item-db-id']) === chave.valor
        ? chave.valor
        : 0;

    const gravado = gravarItemDeMenu(contexto, { menuId, itemId, dados });
    if (gravado.ok) {
      restantes.delete(gravado.itemId);
    } else {
      avisos.push({ tipo: 'erro', texto: gravado.mensagem, dispensavel: false });
    }
  }

  // `:1473`-`:1480` — o que nao veio sai.
  for (const id of restantes) {
    if (ehItemDeMenu(contexto, id)) {
      contexto.conteudo.apagar(id);
    }
  }

  // `:1482`-`:1507`.
  gravarPaginasAutomaticas(
    contexto,
    menuId,
    !vazioNoPhp(pedido.paginasAutomaticas),
  );

  // `wp_defer_term_counting( false )` (`:1509`).
  contexto.classificacao.adiarContagem(false);

  // Acao `wp_update_nav_menu` (`:1512`) — declarada no cabecalho.
  avisos.push({
    tipo: 'atualizado',
    texto: MENSAGEM_DE_MENU_ATUALIZADO.replace('%s', `<strong>${titulo}</strong>`),
    dispensavel: true,
  });
  return avisos;
}

/** A abertura comum as duas acoes: portao e a leitura de `:50`-`:52`. */
function abrirAcao(
  contexto: ContextoDosMenus,
): { readonly recusa: RecusaDosMenus } | { readonly atribuidas: ValorPhp } {
  const recusa = portaoDaTelaDeMenus(contexto);
  if (recusa !== null) {
    return { recusa };
  }
  return { atribuidas: posicoesAtribuidas(contexto) };
}

/** A acao `update` de `wp-admin/nav-menus.php` (`:369`-`:516`). */
export function gravarMenuPelaTela(
  contexto: ContextoDosMenus,
  pedido: PedidoDeGravacaoDoMenu,
): DesfechoDaTelaDeMenus {
  const aberta = abrirAcao(contexto);
  if ('recusa' in aberta) {
    return { desfecho: 'recusada', recusa: aberta.recusa };
  }
  let atribuidas = aberta.atribuidas;

  const recusaDoToken = conferirToken(contexto, TOKEN_DE_GRAVAR_MENU, pedido.token);
  if (recusaDoToken !== null) {
    return { desfecho: 'recusada', recusa: recusaDoToken };
  }

  // `:372`-`:377` — as posicoes marcadas, mescladas ao mapa lido.
  let novas: ValorPhp = lista([]);
  if (pedido.posicoes !== undefined) {
    novas = posicoesPedidas(pedido.posicoes);
    atribuidas = mesclarComoArrayMerge(atribuidas, novas);
  }

  const avisos: AvisoDaTela[] = [];

  // `:380`-`:453` — menu novo.
  if (pedido.menu === 0) {
    const titulo = nomeLimpo(contexto, pedido.nomeDoMenu);
    if (vazioNoPhp(titulo)) {
      avisos.push({
        tipo: 'erro',
        texto: MENSAGEM_DE_NOME_DE_MENU_INVALIDO,
        dispensavel: true,
      });
      return { desfecho: 'tela', menuSelecionado: 0, tituloSelecionado: '', avisos };
    }

    const criado = gravarMenu(contexto, 0, { nome: titulo });
    if (!criado.ok) {
      avisos.push({ tipo: 'erro', texto: criado.mensagem, dispensavel: true });
      return { desfecho: 'tela', menuSelecionado: 0, tituloSelecionado: '', avisos };
    }

    const objeto = menuDeNavegacao(contexto, criado.menuId);
    const selecionado = criado.menuId;
    const tituloSelecionado = objeto === false ? '' : objeto.nome;

    if (pedido.estadoSemMenus === true || !vazioNoPhp(pedido.paginasAutomaticas)) {
      gravarItensDoMenu(contexto, selecionado, tituloSelecionado, pedido);
    }

    const novasEntradas = novas.tipo === 'arranjo' ? novas.entradas : [];
    if (pedido.estadoSemMenus === true) {
      // `:409`-`:418` — so a primeira posicao associada recebe o menu novo.
      let mapa = posicoesAtribuidas(contexto);
      const primeira = mapa.tipo === 'arranjo' ? mapa.entradas[0] : undefined;
      if (primeira !== undefined) {
        mapa = atribuirPosicao(mapa, nomeDaChave(primeira.chave), inteiro(selecionado));
      }
      gravarAssociacao(contexto, mapa);
    } else if (novasEntradas.length > 0) {
      // `:419`-`:427` — toda posicao enviada recebe o menu novo.
      let mapa = posicoesAtribuidas(contexto);
      for (const entrada of novasEntradas) {
        mapa = atribuirPosicao(mapa, nomeDaChave(entrada.chave), inteiro(selecionado));
      }
      gravarAssociacao(contexto, mapa);
    }

    if (pedido.usarPosicao !== undefined) {
      // `:430`-`:439` — grava mesmo quando a posicao nao esta declarada.
      let mapa = posicoesAtribuidas(contexto);
      if (posicaoDeclarada(contexto, pedido.usarPosicao)) {
        mapa = atribuirPosicao(mapa, pedido.usarPosicao, inteiro(selecionado));
      }
      gravarAssociacao(contexto, mapa);
    }

    return {
      desfecho: 'redirecionar',
      endereco: `${ENDERECO_DA_TELA_DE_MENUS}?menu=${criado.menuId}`,
    };
  }

  // `:457`-`:464` — a posicao desmarcada sai, se era deste menu.
  const selecionadoAntes = pedido.menu;
  const marcadas = new Map(pedido.posicoes ?? []);
  for (const [posicao] of contexto.posicoesDeclaradas) {
    const atual = valorDaChave(atribuidas, posicao);
    if (
      vazioNoPhp(marcadas.get(posicao)) &&
      atual !== undefined &&
      atual.tipo === 'inteiro' &&
      atual.valor === selecionadoAntes
    ) {
      atribuidas = retirarPosicao(atribuidas, posicao);
    }
  }

  // `:467`.
  gravarAssociacao(contexto, atribuidas);

  // `:469`-`:483`.
  const objetoAntes = menuDeNavegacao(contexto, selecionadoAntes);
  let titulo = nomeLimpo(contexto, pedido.nomeDoMenu);
  if (vazioNoPhp(titulo)) {
    avisos.push({
      tipo: 'erro',
      texto: MENSAGEM_DE_NOME_DE_MENU_INVALIDO,
      dispensavel: true,
    });
    titulo = objetoAntes === false ? '' : objetoAntes.nome;
  }

  // `:485`-`:502` — renomear; menu que sumiu e criado de novo pelo legado.
  let tituloSelecionado = '';
  const gravado = gravarMenu(contexto, selecionadoAntes, { nome: titulo });
  if (!gravado.ok) {
    avisos.push({ tipo: 'erro', texto: gravado.mensagem, dispensavel: true });
    return {
      desfecho: 'tela',
      menuSelecionado: selecionadoAntes,
      tituloSelecionado,
      avisos,
    };
  }
  const objeto = menuDeNavegacao(contexto, gravado.menuId);
  tituloSelecionado = objeto === false ? '' : objeto.nome;

  // `:504`-`:513`.
  avisos.push(
    ...gravarItensDoMenu(contexto, gravado.menuId, tituloSelecionado, pedido),
  );
  if (selecionadoAntes !== gravado.menuId) {
    return {
      desfecho: 'redirecionar',
      endereco: `${ENDERECO_DA_TELA_DE_MENUS}?menu=${gravado.menuId}`,
    };
  }

  return {
    desfecho: 'tela',
    menuSelecionado: gravado.menuId,
    tituloSelecionado,
    avisos,
  };
}

/** A acao `locations` de `wp-admin/nav-menus.php` (`:518`-`:544`). */
export function gravarPosicoesPelaTela(
  contexto: ContextoDosMenus,
  pedido: PedidoDeGravacaoDasPosicoes,
): DesfechoDaTelaDeMenus {
  const aberta = abrirAcao(contexto);
  if ('recusa' in aberta) {
    return { desfecho: 'recusada', recusa: aberta.recusa };
  }

  // `:519`-`:522` — tema sem posicao declarada nao tem esta tela.
  if (contexto.posicoesDeclaradas.length === 0) {
    return { desfecho: 'redirecionar', endereco: ENDERECO_DA_TELA_DE_MENUS };
  }

  const avisos: AvisoDaTela[] = [];
  if (pedido.posicoes !== undefined) {
    const recusaDoToken = conferirToken(
      contexto,
      TOKEN_DE_GRAVAR_POSICOES,
      pedido.token,
    );
    if (recusaDoToken !== null) {
      return { desfecho: 'recusada', recusa: recusaDoToken };
    }

    // `:526`-`:536` — mescla e grava, sem conferir se a posicao e declarada.
    gravarAssociacao(
      contexto,
      mesclarComoArrayMerge(aberta.atribuidas, posicoesPedidas(pedido.posicoes)),
    );
    avisos.push({
      tipo: 'atualizado',
      texto: MENSAGEM_DE_POSICOES_ATUALIZADAS,
      dispensavel: true,
    });
  }

  return { desfecho: 'tela', menuSelecionado: 0, tituloSelecionado: '', avisos };
}
