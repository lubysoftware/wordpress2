/**
 * O ciclo das tres areas da apresentacao, declarado num arquivo so — porque ele
 * **e** uma unidade.
 *
 * Entrega de **T001** da feature `009-apresentacao-e-personalizacao`:
 * *"personalizacao, menus e componentes de area carregam no mesmo passo... porque
 * o ciclo de dependencia entre eles nao permite ordem interna"*.
 *
 * ## O que foi medido, e por que nao existe ordem interna
 *
 * `target_architecture.md` justifica a fusao de BC-07 por duas razoes
 * independentes, e a segunda e esta: *"`architecture.md` registra o ciclo
 * secundario `customize ↔ menus-de-navegacao ↔ widgets-e-sidebars`: **ja estao no
 * mesmo ciclo**, logo nao existe fronteira entre eles a declarar — declarar uma
 * seria inventar uma que o codigo nao tem"*. `spec.md` diz a consequencia em uma
 * frase: *"ou os tres entram juntos, ou nenhum fecha"*.
 *
 * O ciclo nao e abstrato; ele esta nos fluxos alternativos dos casos de uso, nos
 * dois sentidos:
 *
 * | sentido | onde esta escrito |
 * |---|---|
 * | personalizacao → menus | UC-30, *"Montar o menu pelo Customizer"*: *"a mesma estrutura e editada dentro do conjunto de alteracoes"* |
 * | personalizacao → componentes | UC-31, *"Organizar pelo Customizer"*: idem, e CA-7.3 cobra *"o mesmo resultado"* pelas tres superficies |
 * | menus → personalizacao | UC-30: *"a tela de menus oferece o atalho quando o ator tem `customize`"* |
 * | componentes → personalizacao | UC-31: a mesma frase, na tela de widgets |
 * | componentes ↔ menus | `switch_theme()` toca os dois no mesmo corpo: grava o theme mod `sidebars_widgets` do tema que sai (`wp-includes/theme.php:775`-`:782`) e le o theme mod `nav_menu_locations` para a opcao `theme_switch_menu_locations` (`:785`-`:786`) |
 * | a troca de tema → personalizacao | a mesma funcao le o valor `old_sidebars_widgets_data` **de dentro do Customizer** quando a acao corrente e o salvamento dele (`wp-includes/theme.php:766`-`:771`) |
 *
 * A ultima linha e a que mais surpreende quem le so o nome das funcoes: trocar de
 * tema **le o estado da personalizacao**. E por isso que US-9 depende de US-7 e
 * US-8 ao mesmo tempo, e por isso que o risco 5 de `plan.md` diz que esta parte
 * *"so aparece na segunda troca de tema"*.
 *
 * ## Como o ciclo e cortado aqui, e por que nao por `import`
 *
 * As tres areas **nao se importam**. Cada uma recebe, na composicao, uma
 * {@link LigacaoTardiaNoCiclo}: uma funcao que devolve as tres ja compostas. Duas
 * razoes, e nenhuma delas e gosto:
 *
 * - **Importacao circular em ESM e erro de inicializacao, nao aviso.**
 *   BR-DESCARTAR-010 descarta *"a tolerancia a dependencia circular por
 *   carregamento em `require`"* com a frase que decide: *"num sistema de modulos
 *   real, importacao circular lida na avaliacao do modulo e **erro de
 *   inicializacao**"*. Os 1.342 `require` do legado atravessavam o ciclo de graca;
 *   aqui nao atravessam.
 * - **A ligacao tardia e o idioma que a arquitetura ja escolheu.** AD-10 fixa
 *   *"ligacao tardia entre contextos... resolvida no momento da chamada"*, e mede
 *   que o caso irredutivel do grafo de 13 contextos e **`conteudo ↔ apresentacao`,
 *   167 contra 95**. Dentro de um contexto a regra de dependencia 3 nao se aplica
 *   — ela proibe `contextos/<a>/` importar `contextos/<b>/` —, mas o problema de
 *   carregamento e o mesmo, e a solucao tambem.
 *
 * ⚠️ **A ligacao nao e resolvida no carregamento nem na composicao**, e
 * `modulo.test.ts` afirma isso: trabalho feito na importacao e trabalho fora da
 * ordem de arranque, que BR-MIGRAR-106 (`EXT-ORDEM`) poe no contrato publico.
 * Chamar a funcao antes de a composicao terminar seria resolver cedo demais, e
 * nenhuma linha deste modulo a chama.
 *
 * ## O que NAO esta neste arquivo
 *
 * **Nenhuma operacao.** O **P4** da constituicao exige que *"toda operacao
 * exposta nova nasce com declaracao explicita de permissao"*, e T001 nao expoe
 * nenhuma; as de US-1 (T003) moram em `personalizacao/` e as de US-5 (T011) em
 * `menus/`, com a permissao de cada uma, e aqui entram so como tipo. A
 * permissao que as tres vao cobrar e a **mesma**, e isso
 * e regra lida e nao decisao desta tarefa: `customize` resolve para
 * `edit_theme_options` (`wp-includes/capabilities.php:698`-`:699`), e
 * `edit_theme_options` *"libera menus, componentes e personalizacao, e e exclusiva
 * do papel de administracao"* (CA-1.4, CA-5.1, CA-7.1). O que **nao** e a mesma e
 * a de aplicar: ela e verificada em separado (US-2), e esse e o contrato central
 * da feature.
 *
 * **As outras areas de BC-07 nao estao aqui, de proposito.** Troca de tema
 * (T017), tema de reserva (T021), recursos de interface (T023), motor de estilos
 * (T025), biblioteca de fontes (T027), conjunto de icones (T029) e tema entregue
 * com o produto (T031) **nao** participam deste ciclo: elas sao areas vizinhas,
 * entram nas tarefas delas e tem ordem entre si. Poe-las aqui agora seria
 * declarar ciclo onde o grafo medido nao mostrou nenhum.
 */

import type { OperacoesDosMenus } from './menus/area-de-menus.js';
import type { OperacoesDaPersonalizacao } from './personalizacao/area-de-personalizacao.js';

/** O nome de cada area do ciclo, como `tasks.md` as nomeia. */
export type NomeDeAreaDaApresentacao =
  | 'personalizacao'
  | 'menus'
  | 'componentes-de-area';

/**
 * A ligacao tardia que corta o ciclo: devolve as tres areas **ja compostas**.
 *
 * E funcao, e nao referencia direta, porque no instante em que a primeira area e
 * criada as outras duas ainda nao existem. Quem a chama e a regra de negocio, na
 * tarefa dela, no momento da chamada — nunca o carregamento do modulo.
 */
export type LigacaoTardiaNoCiclo = () => AreasDaApresentacao;

/**
 * A area da personalizacao — o Customizer do legado.
 *
 * Historias: US-1 (T003), US-2 (T005), US-3 (T007), US-4 (T009). As operacoes
 * de US-1 entraram em T003; o `import` e so de tipo, e some na compilacao — o
 * ciclo continua sem aresta de carregamento.
 */
export interface AreaDePersonalizacao extends OperacoesDaPersonalizacao {
  readonly nome: 'personalizacao';
  readonly noCiclo: LigacaoTardiaNoCiclo;
}

/**
 * A area dos menus de navegacao.
 *
 * Historias: US-5 (T011), US-6 (T013). As operacoes de US-5 entraram em T011;
 * o `import` e so de tipo, como o da personalizacao.
 */
export interface AreaDeMenus extends OperacoesDosMenus {
  readonly nome: 'menus';
  readonly noCiclo: LigacaoTardiaNoCiclo;
}

/**
 * A area dos componentes de area — os widgets em sidebars do legado.
 *
 * Historias: US-7 (T015), US-9 (T019).
 */
export interface AreaDeComponentesDeArea {
  readonly nome: 'componentes-de-area';
  readonly noCiclo: LigacaoTardiaNoCiclo;
}

/**
 * As tres areas do ciclo, juntas.
 *
 * E este tipo que a {@link LigacaoTardiaNoCiclo} devolve, e e ele que o modulo
 * composto satisfaz: nao ha como obter uma das tres sem as outras duas, que e a
 * afirmacao de T001 escrita no tipo.
 */
export interface AreasDaApresentacao {
  readonly personalizacao: AreaDePersonalizacao;
  readonly menus: AreaDeMenus;
  readonly componentesDeArea: AreaDeComponentesDeArea;
}
