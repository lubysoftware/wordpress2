/**
 * Barril da area de menus.
 *
 * T001 entregou a fabrica da area; **T011** (US-5) acrescentou a montagem do
 * menu:
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-dos-menus.ts` | o pedido e as ligacoes tardias com `BC-01` (o item) e `BC-02` (o menu) |
 * | `permissao-dos-menus.ts` | **CA-5.1**: o portao da tela, os dois tokens e a permissao declarada de cada operacao |
 * | `menu-de-navegacao.ts` | o menu como termo de `nav_menu`: achar, criar, renomear |
 * | `item-de-menu.ts` | **CA-5.2**, **CA-5.3**: o item como conteudo, com destino, ordem e hierarquia em metadado |
 * | `posicoes-de-menu.ts` | **CA-5.4**, **CA-5.5**: as posicoes declaradas, a associacao gravada e o menu exibido sem posicao |
 * | `gravar-menu-pela-tela.ts` | as acoes `update` e `locations` da tela, que juntam os cinco criterios |
 *
 * O item orfao entra em T013 (US-6).
 */

export {
  criarAreaDeMenus,
  type OperacoesDosMenus,
} from './area-de-menus.js';

export {
  aparadoNoPhp,
  inteiroAbsolutoNoPhp,
  inteiroNoPhp,
  vazioNoPhp as vazioNoPhpNosMenus,
  type ArgumentosDoTermoDoMenu,
  type ClassificacaoNosMenus,
  type ConteudoNosMenus,
  type ConteudoReferidoNoMenu,
  type ContextoDosMenus,
  type LinhaDeItemDoMenu,
  type PedidoDoItemDeMenu,
  type ResultadoDaGravacaoDoItem,
  type ResultadoDoTermo,
  type TermoNosMenus,
  type ValorDeMetadadoDoItem,
} from './contexto-dos-menus.js';

export {
  CAPACIDADE_DOS_MENUS,
  MENSAGEM_DE_TEMA_SEM_MENUS,
  MENSAGEM_DE_TOKEN_VENCIDO,
  MENSAGEM_SEM_PERMISSAO_NOS_MENUS,
  PERMISSOES_DOS_MENUS,
  TITULO_DE_TOKEN_VENCIDO,
  TITULO_SEM_PERMISSAO_NOS_MENUS,
  TOKEN_DE_GRAVAR_MENU,
  TOKEN_DE_GRAVAR_POSICOES,
  conferirToken,
  portaoDaTelaDeMenus,
  type RecusaDosMenus,
  type TokenDeOperacao,
} from './permissao-dos-menus.js';

export {
  CONTEXTO_DO_MENU,
  MENSAGEM_DE_NOME_DE_MENU_REPETIDO,
  criarMenu,
  ehMenuDeNavegacao,
  gravarMenu,
  menuDeNavegacao,
  type DadosDoMenu,
  type MenuPedido,
  type ResultadoDoMenu,
} from './menu-de-navegacao.js';

export {
  MENSAGEM_DE_ITEM_QUE_NAO_E_DE_MENU,
  MENSAGEM_DE_MENU_INVALIDO,
  METADADOS_DO_ITEM,
  TIPOS_DE_DESTINO,
  TIPO_DO_ITEM_DE_MENU,
  ehItemDeMenu,
  gravarItemDeMenu,
  itensDoMenuNaTela,
  type CampoDoItem,
  type DadosDoItem,
  type GravacaoDoItem,
  type ResultadoDoItem,
} from './item-de-menu.js';

export {
  atribuirPosicao,
  gravarAssociacao,
  menuParaExibir,
  mesclarComoArrayMerge,
  posicaoDeclarada,
  posicoesAtribuidas,
  posicoesPedidas,
  retirarPosicao,
  temMenuNaPosicao,
  vazioComoValorPhp,
  type ParDePosicao,
  type PedidoDeExibicao,
} from './posicoes-de-menu.js';

export {
  CAMPOS_DO_ITEM_NA_TELA,
  ENDERECO_DA_TELA_DE_MENUS,
  MENSAGEM_DE_MENU_ATUALIZADO,
  MENSAGEM_DE_NOME_DE_MENU_INVALIDO,
  MENSAGEM_DE_POSICOES_ATUALIZADAS,
  OPCAO_DAS_OPCOES_DE_MENU,
  gravarItensDoMenu,
  gravarMenuPelaTela,
  gravarPosicoesPelaTela,
  type AvisoDaTela,
  type DesfechoDaTelaDeMenus,
  type ItemNoFormulario,
  type PedidoDeGravacaoDasPosicoes,
  type PedidoDeGravacaoDoMenu,
} from './gravar-menu-pela-tela.js';
