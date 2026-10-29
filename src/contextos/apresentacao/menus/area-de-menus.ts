/**
 * A area dos menus de navegacao.
 *
 * Esqueleto de **T001** da feature `009-apresentacao-e-personalizacao`; montar
 * o menu entrou em **T011** (US-5) — as operacoes estao em
 * {@link OperacoesDosMenus}. O item orfao e de **T013** (US-6).
 *
 * | o que esta area vai fazer | ancora no legado |
 * |---|---|
 * | portao de entrada, por `edit_theme_options` | `wp-admin/nav-menus.php:23` |
 * | conferir o token da operacao de menu | `wp-admin/nav-menus.php:370` |
 * | conferir o token da associacao de posicoes | `wp-admin/nav-menus.php:527` |
 * | gravar o item | `wp-includes/nav-menu.php:418` |
 * | gravar a hierarquia do item **em metadado** | `wp-includes/nav-menu.php:589` |
 * | ler as posicoes declaradas pelo tema | `wp-includes/nav-menu.php:162`-`:163` |
 *
 * ## Tres coisas que quem pegar a tarefa seguinte precisa saber antes de escrever
 *
 * 1. 🔴 **O menu sao TRES mecanismos, nao uma lista.** UC-30 e literal: *"o menu e
 *    um termo de taxonomia, cada item e um registro de conteudo, e a ligacao com o
 *    tema e uma opcao. Tres mecanismos diferentes para uma coisa que parece uma
 *    lista. Quem migrar modelando uma tabela de menu precisa reconstruir as tres"*.
 *    `target_domain_model.md` registra `AGG-MenuDeNavegacao` como **fundido de 2
 *    tabelas de 2 contextos**, e e por isso que o aggregate e daqui e nao de la.
 *    Consequencia direta para quem pega T011: o termo e `BC-02` e o item e
 *    `BC-01`, logo os dois chegam por **ligacao tardia**, campo do contexto da
 *    operacao, nunca `import` no topo (AD-10, regra de dependencia 3).
 * 2. 🔴 **A hierarquia do item nao usa a coluna de pai do conteudo.** Ela vive no
 *    metadado `_menu_item_menu_item_parent` (`wp-includes/nav-menu.php:589`), e o
 *    risco 3 de `plan.md` diz o preco de "corrigir" isso: *"muda o que extensao de
 *    menu le"*. CA-5.3 cobra ordem e hierarquia preservadas — pela forma do
 *    legado, nao pela forma correta.
 * 3. **Item orfao permanece, e nenhuma rotina o limpa.** UC-30: *"apagar o
 *    conteudo apontado nao apaga o item do menu, e nada avisa que o caminho nao
 *    leva a lugar algum"*. US-6 pede sinalizacao, acao manual de limpeza e aviso
 *    antes de apagar — tudo **em cima** desse estado, nao em lugar dele. Declarar
 *    cascata no armazenamento apagaria o item e tornaria CA-6.1 e CA-6.2
 *    inverificaveis: e a violacao de **P5** que a porta de dados nomeia.
 *
 * ## ⚠️ Esta area nao tem cenario de paridade de fluxo, e isso esta registrado
 *
 * `parity_specs.md` conta **43 de 47** casos de uso com cenario de fluxo, e UC-30
 * e um dos quatro que faltam. `LACUNA-IN-12` diz exatamente o que falta: *"em
 * UC-30 e UC-31 o percurso e arrastar e soltar lido por JavaScript empacotado, e o
 * que o porte entrega e o DOM: `PTS-011`, `PTS-012` e `PTS-013` o cobrem como
 * contrato, mas **nenhum cenario verifica o efeito no banco** de reordenar um menu
 * ou mover um widget"*, e fecha com *"os quatro precisam de cenario de fluxo antes
 * das fatias 9 e 12"*.
 *
 * Para T011 e T013 isso tem consequencia pratica: o oraculo de paridade desta area
 * e o **contrato de tela**, mais os casos do catalogo `backlog/tests.md` (UT-100-1
 * a UT-100-7 e UT-101-1 a UT-101-5, as tarefas `[P]` T012 e T014). Nao existe
 * `.feature` de fluxo para conferir reordenacao. Escrever um e trabalho de quem
 * mantem `parity_specs.md`, nao desta feature.
 *
 * ## O que esta area entrega hoje
 *
 * `nome`, a {@link LigacaoTardiaNoCiclo} para as outras duas areas (T001), e as
 * operacoes de US-5 (T011), cada uma com a permissao declarada em
 * `permissoes` — o que o **P4** cobra. As funcoes do legado que elas usam
 * (`wp_update_nav_menu_object()`, `wp_update_nav_menu_item()` e as de posicao)
 * saem pelo barril, e **nao** sao operacoes desta area: no legado elas nao
 * conferem capacidade nenhuma, e quem confere e a tela.
 */

import type {
  AreaDeMenus,
  LigacaoTardiaNoCiclo,
} from '../ciclo-de-apresentacao.js';
import type { ContextoDosMenus, TermoNosMenus } from './contexto-dos-menus.js';
import {
  gravarMenuPelaTela,
  gravarPosicoesPelaTela,
  type DesfechoDaTelaDeMenus,
  type PedidoDeGravacaoDasPosicoes,
  type PedidoDeGravacaoDoMenu,
} from './gravar-menu-pela-tela.js';
import {
  PERMISSOES_DOS_MENUS,
  portaoDaTelaDeMenus,
  type RecusaDosMenus,
} from './permissao-dos-menus.js';
import {
  menuParaExibir,
  temMenuNaPosicao,
  type PedidoDeExibicao,
} from './posicoes-de-menu.js';

/**
 * As operacoes de US-5 (T011). O contexto chega por argumento em todas: a
 * identidade e a requisicao sao escopo de REQUISICAO (AD-02), e o termo e o
 * item chegam por ligacao tardia (AD-10).
 */
export interface OperacoesDosMenus {
  /** A permissao de cada operacao — ver `permissao-dos-menus.ts`. */
  readonly permissoes: typeof PERMISSOES_DOS_MENUS;

  /**
   * O portao da tela (CA-5.1, CA-5.5). **Permissao exigida:
   * `edit_theme_options`**, depois de o tema suportar `menus` ou `widgets`.
   * `null` e passagem livre. Nao grava nada.
   */
  abrirTela(contexto: ContextoDosMenus): RecusaDosMenus | null;

  /**
   * Criar ou editar o menu, os itens e as posicoes dele — a acao `update`
   * (CA-5.1 a CA-5.5). **Permissao exigida: `edit_theme_options` e o token
   * `update-nav_menu`.**
   */
  gravarMenu(
    contexto: ContextoDosMenus,
    pedido: PedidoDeGravacaoDoMenu,
  ): DesfechoDaTelaDeMenus;

  /**
   * Associar menus as posicoes — a acao `locations` (CA-5.4). **Permissao
   * exigida: `edit_theme_options` e o token `save-menu-locations`.**
   */
  gravarPosicoes(
    contexto: ContextoDosMenus,
    pedido: PedidoDeGravacaoDasPosicoes,
  ): DesfechoDaTelaDeMenus;

  /**
   * O menu que o tema exibe, pelo menu pedido e so depois pela posicao
   * (CA-5.5). **Nenhuma permissao**: e leitura para o visitante.
   */
  menuParaExibir(
    contexto: ContextoDosMenus,
    pedido: PedidoDeExibicao,
  ): TermoNosMenus | false;

  /** `has_nav_menu()` (CA-5.4). **Nenhuma permissao**: idem. */
  temMenuNaPosicao(contexto: ContextoDosMenus, posicao: string): boolean;
}

/**
 * Cria a area, sem resolver nada.
 *
 * A ligacao chega por argumento e **nao e chamada aqui**. Ver
 * `../ciclo-de-apresentacao.ts`.
 */
export function criarAreaDeMenus(noCiclo: LigacaoTardiaNoCiclo): AreaDeMenus {
  return {
    nome: 'menus',
    noCiclo,
    permissoes: PERMISSOES_DOS_MENUS,
    abrirTela: portaoDaTelaDeMenus,
    gravarMenu: gravarMenuPelaTela,
    gravarPosicoes: gravarPosicoesPelaTela,
    menuParaExibir,
    temMenuNaPosicao,
  };
}
