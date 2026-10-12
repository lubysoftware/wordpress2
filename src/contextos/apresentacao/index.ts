/**
 * Modulo de apresentacao — BC-07 de `target_architecture.md`.
 *
 * Feature `009-apresentacao-e-personalizacao`, tarefas fechadas **T001** e
 * **T002**. O que existe aqui e exatamente o que as duas entregam: T001,
 * *"personalizacao, menus e componentes de area carregam no mesmo passo, com as
 * portas de dados e de cliente externo declaradas, porque o ciclo de dependencia
 * entre eles nao permite ordem interna"*; T002, *"o conjunto de alteracoes existe
 * como tipo de conteudo proprio e a configuracao declarada pelo tema e lida como
 * dado, pela porta de dados, com a mesma forma do legado"*. **Nenhuma regra de
 * negocio esta implementada**, e nenhuma operacao esta exposta: cada historia
 * entra na tarefa dela (T003 em diante). A leitura obrigatoria de quem pegar a
 * tarefa seguinte esta em `./README.md`.
 *
 * A pasta e `contextos/apresentacao/` porque e assim que `target_architecture.md`
 * nomeia BC-07 no esboco de arvore; a feature se chama
 * `009-apresentacao-e-personalizacao` no pacote de specs, e sao a mesma coisa.
 *
 * ## Por que os tres entram juntos, e nao em tres tarefas
 *
 * Porque foi medido que nao ha ordem entre eles. `target_architecture.md` justifica
 * a fusao dos **12 modulos** de BC-07 em parte por isto: *"`architecture.md`
 * registra o ciclo secundario `customize ↔ menus-de-navegacao ↔
 * widgets-e-sidebars`: ja estao no mesmo ciclo, logo nao existe fronteira entre
 * eles a declarar — declarar uma seria inventar uma que o codigo nao tem"*. E
 * `spec.md` fecha: *"ou os tres entram juntos, ou nenhum fecha"*. As arestas
 * medidas, com ancora no legado, estao em `./ciclo-de-apresentacao.ts`.
 *
 * Esta e, por medicao, **a feature mais acoplada do pacote**: `plan.md` declara
 * dependencia de `001` (autorizacao), `002` (o conjunto e conteudo), `003` (o menu
 * e contexto de classificacao), `004` (a hierarquia de modelos) e `014` (estilos
 * remotos). Nada disso entra por `import`: AD-10 mede que o caso irredutivel do
 * grafo dos 13 contextos e **`conteudo ↔ apresentacao`, 167 contra 95**, e a regra
 * de dependencia 3 proibe contexto importar contexto no topo do modulo *"sempre,
 * sem excecao"*.
 *
 * ## Duas coisas que este arquivo faz de proposito, as mesmas de BC-04 e BC-05
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) e AD-02 poem
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Por isso as
 *   portas chegam por argumento e nao existe instancia compartilhada neste
 *   arquivo: duas composicoes nao se enxergam, e o armazenamento de cada uma
 *   nasce da porta dela. Nesta feature isso tem peso proprio — numa rede o
 *   identificador do site entra **dentro** do nome da tabela, e a aparencia e
 *   configuracao **por site**: um modulo com estado trocaria o tema de um site
 *   pelo do outro.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados, nao faz
 *   chamada externa e **nao chama a ligacao tardia** ao ser criado; compor o
 *   armazenamento monta nome de tabela e nada mais, e **nenhum tipo de conteudo
 *   se registra aqui** — o registro de `customize_changeset` e dado
 *   (`armazenamento/tipo-do-conjunto.ts`), lido por quem monta o arranque. A
 *   ordem de arranque e contrato publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho
 *   feito na importacao e trabalho fora da ordem. `modulo.test.ts` afirma que
 *   nenhuma porta foi tocada.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo de
 * vida de framework"*, porque a ordem de arranque do legado e contrato publico e
 * framework com ciclo de vida proprio disputa com ela.
 */

import {
  criarArmazenamentoDaApresentacao,
  type ArmazenamentoDaApresentacao,
} from './armazenamento/index.js';
import { criarAreaDeComponentesDeArea } from './componentes-de-area/index.js';
import type {
  AreaDeComponentesDeArea,
  AreaDeMenus,
  AreaDePersonalizacao,
  AreasDaApresentacao,
} from './ciclo-de-apresentacao.js';
import { criarAreaDeMenus } from './menus/index.js';
import { criarAreaDePersonalizacao } from './personalizacao/index.js';
import type { PortaDeClienteExterno, PortaDeDados } from './portas/index.js';

export * from './armazenamento/index.js';
export * from './portas/index.js';
export * from './ciclo-de-apresentacao.js';
export * from './personalizacao/index.js';
export * from './menus/index.js';
export * from './componentes-de-area/index.js';

/** As duas portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeApresentacao {
  readonly dados: PortaDeDados;
  readonly clienteExterno: PortaDeClienteExterno;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o **P4** da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha tres coisas, e nenhuma e operacao: as portas e as tres areas do ciclo
 * (T001) e o armazenamento (T002), que nao decide nada.
 *
 * As nove operacoes que a tabela *Contratos* de `plan.md` nomeia, com a permissao
 * que o pacote declara para cada uma — **citadas, nao decididas aqui**, para que a
 * tarefa que construir cada uma nasca com a declaracao que o P4 cobra:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | pre-visualizar | US-1 | T003 | a meta-capacidade `customize`, que resolve para `edit_theme_options` (`wp-includes/capabilities.php:698`-`:699`) |
 * | salvar alteracoes | US-2 | T005 | a de **editar** o conjunto, concedida por filtro no legado (UC-29) |
 * | aplicar | US-2 | T005 | a de **publicar** o tipo do conjunto, verificada **em separado** (`class-wp-customize-manager.php:2483`) |
 * | agendar aplicacao | US-4 | T009 | a mesma de aplicar, mais a data futura |
 * | montar menu | US-5 | T011 | `edit_theme_options` (`wp-admin/nav-menus.php:23`) |
 * | sinalizar item orfao | US-6 | T013 | a da tela de menus, que e a mesma |
 * | trocar tema | US-8 | T017 | a de trocar tema, mais o token da acao; em rede, **poder de rede** (CA-8.5) |
 * | enfileirar recurso de interface | US-11 | T023 | — nenhuma: e registro de codigo, nao operacao de ator |
 * | resolver estilos declarados | US-12 | T025 | — idem |
 *
 * A linha que o P4 mais cobra que esteja escrita e a terceira: **a permissao de
 * aplicar e separada da de salvar**, e `plan.md` chama isso de *"o contrato central
 * da feature: e ele que impede publicar aparencia sem querer"*.
 */
export interface ModuloDeApresentacao extends AreasDaApresentacao {
  readonly nome: 'apresentacao';
  readonly portas: PortasDeApresentacao;

  /**
   * A forma de armazenamento do conjunto de alteracoes e da configuracao do tema
   * (T002). Le e grava **somente** pela porta de dados.
   *
   * **Nao e operacao, e por isso nao declara permissao:** ele nao decide nada,
   * nao recusa nada e nao autoriza nada. A linha de `tasks.md` e literal —
   * `satisfaz: — (infraestrutura)`.
   */
  readonly armazenamento: ArmazenamentoDaApresentacao;
}

/**
 * Compoe o modulo sobre as portas recebidas, com as tres areas do ciclo no mesmo
 * passo.
 *
 * O corte do ciclo e a funcao `noCiclo`: ela e **passada** para as tres areas
 * antes de qualquer uma existir, e so devolve o trio quando alguem a chama — o que
 * nenhuma linha daqui faz. E a ligacao tardia de AD-10 aplicada dentro do
 * contexto, pela razao que BR-DESCARTAR-010 registra: importacao circular lida na
 * avaliacao do modulo e **erro de inicializacao** em ESM, nao aviso como era no
 * `require` do legado.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro explicito, resolvido antes do
 * primeiro uso. Trocar uma porta e passar outra implementacao aqui — sem alterar
 * arquivo deste modulo, que e o criterio de "substituivel" que BR-MIGRAR-103
 * propoe.
 */
export function criarModuloDeApresentacao(
  portas: PortasDeApresentacao,
): ModuloDeApresentacao {
  // A referencia e preenchida no fim desta funcao. Nenhuma das tres areas a le
  // durante a construcao: `noCiclo` e chamada pela regra de negocio, na tarefa
  // dela, no momento da chamada. Se alguma area a chamasse aqui, o ciclo voltaria
  // a ser resolvido no carregamento, que e o que `EXT-ORDEM` nao permite — e e
  // esse erro de ordem, e nao falha de negocio, que a guarda abaixo reporta. O P7
  // vale para falha do sistema analisado; isto e defeito de composicao, que no
  // legado nem era exprimivel.
  let trio: AreasDaApresentacao | null = null;
  const noCiclo = (): AreasDaApresentacao => {
    if (trio === null) {
      throw new Error(
        'as tres areas da apresentacao ainda nao estao compostas: a ligacao tardia foi chamada durante a composicao',
      );
    }
    return trio;
  };

  const personalizacao: AreaDePersonalizacao =
    criarAreaDePersonalizacao(noCiclo);
  const menus: AreaDeMenus = criarAreaDeMenus(noCiclo);
  const componentesDeArea: AreaDeComponentesDeArea =
    criarAreaDeComponentesDeArea(noCiclo);

  trio = { personalizacao, menus, componentesDeArea };

  return {
    nome: 'apresentacao',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui (`EXT-ORDEM`, BR-MIGRAR-106).
    armazenamento: criarArmazenamentoDaApresentacao(portas.dados),
    personalizacao,
    menus,
    componentesDeArea,
  };
}
