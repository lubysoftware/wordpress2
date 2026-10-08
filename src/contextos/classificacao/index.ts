/**
 * Modulo de classificacao — BC-02 de `target_architecture.md`.
 *
 * Feature `003-classificacao-do-conteudo`, tarefas T001 e T002. O que existe
 * aqui e o que as duas entregam: o modulo carrega com a porta de dados declarada,
 * com os oito contextos de classificacao do nucleo registrados e com a forma de
 * armazenamento de rotulo, contexto e juncao — e **nenhuma regra de negocio
 * implementada**. A separacao entre rotulo e contexto (US-1) entra em T003, a
 * classificacao (US-2) em T005, o termo padrao (US-3) em T007, a manutencao da
 * lista (US-4) em T009 e a proibicao de apagar o padrao (US-5) em T011. A leitura
 * obrigatoria de cada uma esta em `./README.md`.
 *
 * BC-02 e a fusao de `taxonomias-e-termos` com `links-e-bookmarks`, e
 * `target_architecture.md` chama a fusao de *"contraintuitiva e necessaria"*:
 * `term_relationships.object_id` e polimorfico e serve `posts` **e** `links`, e
 * separa-los *"deixaria a coluna polimorfica sem dono"*. E por isso que
 * `link_category` esta entre os oito contextos registrados aqui.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** `BR-MIGRAR-105` (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e a
 *   dimensao **D-A** de `parity_specs.md` da nome ao risco. Aqui isso alcanca o
 *   registro de contextos: no legado `$wp_taxonomies` e uma `global` mutavel por
 *   extensao, e um mapa no escopo deste modulo cruzaria os contextos de duas
 *   requisicoes concorrentes. Por isso as portas chegam por argumento e o
 *   registro nasce **dentro** de {@link criarModuloDeClassificacao}: duas
 *   composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao escreve nada ao ser criado — registrar os oito contextos e
 *   trabalho em memoria, sobre declaracao em codigo, sem tocar a porta. A ordem
 *   de arranque e contrato publico (`BR-MIGRAR-106`, `EXT-ORDEM`), e trabalho
 *   feito na importacao e trabalho fora da ordem.
 */

import {
  criarArmazenamentoDeClassificacao,
  type ArmazenamentoDeClassificacao,
} from './armazenamento/index.js';
import type { PortaDeDados } from './portas/index.js';
import {
  criarRegistroComOsContextosDoNucleo,
  type RegistroDeContextos,
} from './registro/index.js';

export * from './portas/index.js';
export * from './registro/index.js';
export * from './armazenamento/index.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * E uma so, e continua sendo uma depois de T002: as tres estruturas de
 * armazenamento leem e gravam **por ela**, e nenhuma outra borda entrou. A razao
 * de nao haver porta de cache nem de serializacao esta em `portas/index.ts`; a de
 * nao haver porta de opcoes e que nem T001 nem T002 leem opcao nenhuma — a opcao
 * `default_category`, que US-3 consulta, chega com T007.
 */
export interface PortasDeClassificacao {
  readonly dados: PortaDeDados;
}

/**
 * O modulo carregado.
 *
 * A superficie e deliberadamente so isto enquanto T002 e a tarefa fechada: cada
 * historia acrescenta aqui a sua operacao — as cinco da tabela *Contratos* de
 * `plan.md` —, com a declaracao explicita de permissao que o **P4** da
 * constituicao exige, e nenhuma antes da propria tarefa.
 *
 * O armazenamento **nao e operacao**, e por isso nao declara permissao: ele nao
 * decide nada. Quem decide e a historia que o chama.
 */
export interface ModuloDeClassificacao {
  readonly nome: 'classificacao';
  readonly portas: PortasDeClassificacao;
  /**
   * Os contextos desta requisicao, com os oito do nucleo ja dentro.
   *
   * E **mutavel de proposito**: `register_taxonomy()` e API publica e uma extensao
   * registra contexto em execucao (P2, P8). O que nao e compartilhado e o
   * registro entre composicoes — ver o cabecalho.
   */
  readonly contextos: RegistroDeContextos;
  /**
   * A forma de armazenamento de rotulo, contexto e juncao (T002). Le e grava
   * **somente** pela porta de dados.
   */
  readonly armazenamento: ArmazenamentoDeClassificacao;
}

/**
 * Compoe o modulo sobre a porta recebida, e registra os oito contextos do
 * nucleo.
 *
 * Substitui, no alvo, o que no legado era `create_initial_taxonomies()`
 * chamada a partir de `wp-settings.php` sobre uma `global`
 * (`wp-includes/taxonomy.php:25`). Trocar a porta e passar outra implementacao
 * aqui — sem alterar arquivo deste modulo, que e o criterio de "substituivel"
 * que `BR-MIGRAR-103` (`EXT-SUBST`) propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeClassificacao(
  portas: PortasDeClassificacao,
): ModuloDeClassificacao {
  return {
    nome: 'classificacao',
    portas,
    contextos: criarRegistroComOsContextosDoNucleo(),
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui, que e o que `EXT-ORDEM` cobra e o que `modulo.test.ts` afirma.
    armazenamento: criarArmazenamentoDeClassificacao(portas.dados),
  };
}
