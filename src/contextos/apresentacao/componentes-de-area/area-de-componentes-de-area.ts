/**
 * A area dos componentes de area — os widgets em sidebars do legado.
 *
 * Esqueleto de **T001** da feature `009-apresentacao-e-personalizacao`;
 * organizar os componentes entrou em **T015** (US-7) — as operacoes estao em
 * {@link OperacoesDosComponentes}. A preservacao na troca de tema e de **T019**
 * (US-9).
 *
 * | o que esta area faz | ancora no legado | onde |
 * |---|---|---|
 * | portao de entrada, por `edit_theme_options` | `wp-admin/widgets.php:15` | `permissao-dos-componentes.ts` |
 * | conferir o token de salvar ou remover componente | `wp-admin/widgets-form.php:126` | `organizar-pela-tela.ts` |
 * | gravar o mapa de areas | `wp-admin/widgets-form.php:199` · `wp-includes/widgets.php:1094` | `mapa-de-areas.ts` |
 * | conferir o token de limpar os inativos | `wp-admin/widgets-form.php:206` | `organizar-pela-tela.ts` |
 * | remapear o que ficou sem area para os inativos | `wp-includes/widgets.php:1305`, `:1327` | **T019** |
 * | guardar o mapa do tema que saiu, como theme mod | `wp-includes/theme.php:775`-`:782` | **T019** |
 *
 * ## Tres coisas que quem pegar a tarefa seguinte precisa saber antes de escrever
 *
 * 1. **Componente e area vivem em CONFIGURACAO, nao em tabela** (`domain.md`
 *    §1.3, UC-31), e `target_domain_model.md` registra `AGG-AreaDeWidget` como
 *    **dividido de `options`** — o aggregate *"encapsula a invariante **sem
 *    mudar isso**"*. O mapa inteiro e um valor serializado numa linha
 *    (`sidebars_widgets`), e a configuracao e uma linha por tipo
 *    (`widget_{id_base}`); o formato e o nativo do PHP, nao JSON. Criar tabela
 *    de widget e a modelagem "mais correta" que o **P5** recusa.
 * 2. 🔴 **A preservacao na troca de tema depende de guardar o mapa do tema
 *    ANTERIOR**, e e o risco 5 de `plan.md`: *"e a parte que mais quebra em
 *    porte, porque so aparece na segunda troca de tema"*. O legado grava esse
 *    mapa como theme mod com um instante junto — `{ time, data }`
 *    (`wp-includes/theme.php:775`-`:782`) —, e `retrieve_widgets()`
 *    (`wp-includes/widgets.php:1327`) e quem remapeia. T015 deixou o ponto de
 *    entrada dela marcado em `organizar-pela-tela.ts` e um achado sobre ela em
 *    `../README.md`, que **T019** le antes de escrever.
 * 3. **A area de inativos e deposito sem retencao, e isso e proposital.**
 *    UC-31: *"guarda o que sobrou de todo tema ja usado, indefinidamente, e so
 *    uma acao manual a limpa"*. ⚠️ **O P6 proibe inventar prazo aqui.** CA-7.4
 *    entrou como **acao** — as duas limpezas de `organizar-pela-tela.ts` —,
 *    nunca como coleta por prazo.
 *
 * ## ⚠️ Esta area nao tem cenario de paridade de fluxo, e isso esta registrado
 *
 * UC-31 e um dos quatro casos de uso que `parity_specs.md` conta fora dos 43 com
 * cenario de fluxo. `LACUNA-IN-12`: *"nenhum cenario verifica o efeito no banco
 * de reordenar um menu ou mover um widget"*. O oraculo desta area e o contrato
 * de tela mais os casos do catalogo `backlog/tests.md` (UT-102-1 a UT-102-6 e
 * UT-103-1 a UT-103-5, nas tarefas `[P]` T016 e T020).
 *
 * ## O que esta area entrega hoje
 *
 * `nome`, a {@link LigacaoTardiaNoCiclo} para as outras duas areas (T001), e as
 * operacoes de US-7 (T015), cada uma com a permissao declarada em
 * `permissoes` — o que o **P4** cobra. As funcoes do legado que elas usam
 * (`wp_set_sidebars_widgets()`, `wp_assign_widget_to_sidebar()`,
 * `WP_Widget::update_callback()`) saem pelo barril, e **nao** sao operacoes
 * desta area: no legado elas nao conferem capacidade nenhuma.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type {
  AreaDeComponentesDeArea,
  LigacaoTardiaNoCiclo,
} from '../ciclo-de-apresentacao.js';
import type {
  ContextoDosComponentes,
  FormularioDoComponente,
} from './contexto-dos-componentes.js';
import {
  apagarComponentePelaApi,
  atualizarAreaPelaApi,
  atualizarComponentePelaApi,
  criarComponentePelaApi,
  type PedidoDeComponenteNaApi,
  type ResultadoDaAreaNaApi,
  type ResultadoDoComponenteNaApi,
} from './organizar-pela-api.js';
import { gravarConfiguracaoDeComponente } from './organizar-pela-personalizacao.js';
import {
  gravarComponentePelaTela,
  limparInativosPeloAjax,
  limparInativosPelaTela,
  ordenarPeloAjax,
  type DesfechoDaTelaDeComponentes,
} from './organizar-pela-tela.js';
import {
  PERMISSOES_DOS_COMPONENTES,
  portaoDaTelaDeComponentes,
  type RecusaDaTelaDeComponentes,
  type RespostaDoAjaxDeComponentes,
} from './permissao-dos-componentes.js';

/**
 * As operacoes de US-7 (T015), pelas tres superficies que CA-7.3 nomeia. O
 * contexto chega por argumento em todas: a identidade, a requisicao e o
 * registro do arranque sao escopo de REQUISICAO (AD-02).
 */
export interface OperacoesDosComponentes {
  /** A permissao de cada operacao — ver `permissao-dos-componentes.ts`. */
  readonly permissoes: typeof PERMISSOES_DOS_COMPONENTES;

  /**
   * O portao da tela (CA-7.1). **Permissao exigida: `edit_theme_options`**,
   * depois o tema suportar `widgets`. `null` e passagem livre. Nao grava nada.
   */
  abrirTela(
    contexto: Pick<ContextoDosComponentes, 'autorizacao' | 'temaSuporta'>,
  ): RecusaDaTelaDeComponentes | null;

  /**
   * Colocar, configurar ou retirar um componente pela tela, sem JavaScript
   * (CA-7.1 a CA-7.3). **Permissao exigida: `edit_theme_options` e o token
   * `save-delete-widget-{componente}`.**
   */
  gravarPelaTela(
    contexto: ContextoDosComponentes,
    corpo: FormularioDoComponente,
  ): DesfechoDaTelaDeComponentes;

  /**
   * Limpar de uma vez os inativos pela tela (CA-7.4). **Permissao exigida:
   * `edit_theme_options` e o token `remove-inactive-widgets`.**
   */
  limparInativosPelaTela(
    contexto: ContextoDosComponentes,
    corpo: FormularioDoComponente,
  ): DesfechoDaTelaDeComponentes;

  /**
   * Gravar a ordem das areas pelo Ajax da tela (CA-7.2, CA-7.3). **Permissao
   * exigida: o token `save-sidebar-widgets`, depois `edit_theme_options`.**
   */
  ordenarPeloAjax(
    contexto: ContextoDosComponentes,
    corpo: FormularioDoComponente,
  ): RespostaDoAjaxDeComponentes;

  /**
   * Limpar os inativos pelo Ajax da tela (CA-7.4). **Permissao exigida: o token
   * `remove-inactive-widgets`, depois `edit_theme_options`.**
   */
  limparInativosPeloAjax(
    contexto: ContextoDosComponentes,
    corpo: FormularioDoComponente,
  ): RespostaDoAjaxDeComponentes;

  /** Dar a uma area a sua lista (CA-7.3). **Permissao exigida: `edit_theme_options`.** */
  atualizarAreaPelaApi(
    contexto: ContextoDosComponentes,
    pedido: { readonly id: string; readonly componentes?: readonly string[] },
  ): ResultadoDaAreaNaApi;

  /** Criar um componente numa area (CA-7.3). **Permissao exigida: `edit_theme_options`.** */
  criarPelaApi(
    contexto: ContextoDosComponentes,
    pedido: PedidoDeComponenteNaApi,
  ): ResultadoDoComponenteNaApi;

  /** Configurar ou mover um componente (CA-7.3). **Permissao exigida: `edit_theme_options`.** */
  atualizarPelaApi(
    contexto: ContextoDosComponentes,
    pedido: PedidoDeComponenteNaApi & { readonly id: string },
  ): ResultadoDoComponenteNaApi;

  /** Retirar para os inativos, ou apagar de vez (CA-7.3). **Permissao exigida: `edit_theme_options`.** */
  apagarPelaApi(
    contexto: ContextoDosComponentes,
    pedido: { readonly id: string; readonly forcar?: boolean },
  ): ResultadoDoComponenteNaApi;

  /**
   * Gravar uma configuracao de componente aplicada pela personalizacao
   * (CA-7.3). **Permissao exigida: `edit_theme_options`**, a capacidade que a
   * configuracao declara. Quando aplicar e de T005.
   */
  gravarPelaPersonalizacao(
    contexto: Pick<ContextoDosComponentes, 'autorizacao' | 'opcoes'>,
    id: string,
    valor: ValorPhp | null,
  ): boolean;
}

/**
 * Cria a area, sem resolver nada.
 *
 * A ligacao chega por argumento e **nao e chamada aqui**. Ver
 * `../ciclo-de-apresentacao.ts`.
 */
export function criarAreaDeComponentesDeArea(
  noCiclo: LigacaoTardiaNoCiclo,
): AreaDeComponentesDeArea {
  return {
    nome: 'componentes-de-area',
    noCiclo,
    permissoes: PERMISSOES_DOS_COMPONENTES,
    abrirTela: portaoDaTelaDeComponentes,
    gravarPelaTela: gravarComponentePelaTela,
    limparInativosPelaTela,
    ordenarPeloAjax,
    limparInativosPeloAjax,
    atualizarAreaPelaApi,
    criarPelaApi: criarComponentePelaApi,
    atualizarPelaApi: atualizarComponentePelaApi,
    apagarPelaApi: apagarComponentePelaApi,
    gravarPelaPersonalizacao: gravarConfiguracaoDeComponente,
  };
}
