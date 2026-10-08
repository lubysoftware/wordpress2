/**
 * Modulo de retencao e descarte — a feature `005-retencao-e-descarte`.
 *
 * Esqueleto da tarefa **T001**. O que existe aqui e exatamente o que T001
 * entrega: *"o modulo carrega com as portas de dados, de relogio e de fila
 * agendada declaradas, e o prazo de retencao lido de um ponto de configuracao
 * nomeado com o valor de fabrica do legado"* — e **nenhuma regra de negocio
 * implementada**. Descartar, suspender comentario, restaurar, avisar que apagar
 * nao tem volta, coletar o que venceu, expirar rascunho automatico, tolerar
 * estado inconsistente e reparentar filhos entram nas tarefas delas (T002 em
 * diante), e a leitura obrigatoria de cada uma esta em `./README.md`.
 *
 * ## A qual bounded context este modulo pertence — e sao dois
 *
 * `target_architecture.md` divide esta feature em duas:
 *
 * - **BC-01 (Conteudo)** e dono do ciclo de vida — *"publicar, agendar, revisar,
 *   **descartar, restaurar, expirar**"* — e da *"cascata de 7 etapas de exclusao
 *   com reparenteamento"*, com as regras `R1`-`R4` e `R6`;
 * - **BC-11 (Operacao do Software)** e dono do **agendamento**, no aggregate
 *   `AGG-TarefaAgendada`, com a regra `A9`.
 *
 * Por isso a fila entra aqui como **porta** e nao como codigo: este modulo e
 * cliente dela. E por isso a pasta leva o nome da **feature**, nao do contexto —
 * a unidade de entrega do pacote e a feature, e `plan.md` declara na secao
 * *Sequencia* que esta depende de `001`, `002` e `011`.
 *
 * ## Duas coisas que este arquivo faz de proposito
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e
 *   `target_architecture.md` repete que nenhum modulo pode guarda-los em estado
 *   de modulo. Por isso as portas chegam por argumento e nao existe instancia
 *   compartilhada neste arquivo: duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao toca na fila ao ser criado. A ordem de arranque e contrato
 *   publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito na importacao e
 *   trabalho fora da ordem. Resolver o prazo de retencao e a unica coisa que a
 *   composicao faz, e ela e leitura de argumento com valor de fabrica: nenhuma
 *   porta e tocada.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo de
 * vida de framework"*, porque a ordem de arranque do legado e contrato publico e
 * framework com ciclo de vida proprio disputa com ela.
 */

import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  type PrazoDeRetencao,
} from './configuracao/index.js';
import type {
  PortaDeDados,
  PortaDeFilaAgendada,
  PortaDeRelogio,
} from './portas/index.js';

export * from './portas/index.js';
export * from './configuracao/index.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeRetencaoEDescarte {
  readonly dados: PortaDeDados;
  readonly relogio: PortaDeRelogio;
  readonly filaAgendada: PortaDeFilaAgendada;
}

/**
 * O que a instalacao informa ao modulo.
 *
 * E o equivalente, no alvo, do `define()` em `wp-config.php`: o legado altera
 * `EMPTY_TRASH_DAYS` por constante redefinida **antes** do arranque, nao por opcao
 * e nao por ponto de extensao. Ver `configuracao/prazo-de-retencao.ts`.
 */
export interface OpcoesDeRetencaoEDescarte {
  /** O prazo de retencao da lixeira. Omitido, vale o valor de fabrica: 30 dias. */
  readonly prazoDeRetencao?: PrazoDeRetencao;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o **P4** da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha duas coisas, as duas de T001: as portas e o prazo de retencao.
 *
 * As operacoes que a tabela *Contratos* de `plan.md` nomeia, com a permissao que o
 * pacote declara para cada uma — **citadas, nao decididas aqui**, para que a
 * tarefa que construir cada uma nasca com a declaracao que o P4 cobra:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | descartar para a lixeira | US-1 | T003 | `delete_post` do registro, *"resolvida conforme autoria e estado"* (UC-09) |
 * | restaurar | US-3 | T007 | decidida **pelo estado anterior gravado no descarte** (CA-3.5, UC-10) |
 * | apagar em definitivo | US-8 | T017 | `delete_post`, com o reparenteamento de filhos e anexos (UC-09, fluxo alternativo) |
 * | coletar o que venceu | US-5 | T011 | **nenhuma.** UC-11 e literal: *"a coleta roda sem usuario autenticado e sem verificacao de capacidade: o prazo e a autorizacao"* |
 *
 * A ultima linha e a que o P4 mais cobra que esteja escrita: ela e uma das
 * operacoes que *"decidem acesso sem consultar capacidade alguma"*, e uma matriz
 * que a ignore descreve um sistema mais fechado do que o real.
 */
export interface ModuloDeRetencaoEDescarte {
  readonly nome: 'retencao-e-descarte';
  readonly portas: PortasDeRetencaoEDescarte;
  /**
   * O prazo de retencao em vigor nesta composicao, lido do ponto de configuracao
   * nomeado (T001). De fabrica, 30 dias — `R1` / BR-MIGRAR-030.
   */
  readonly prazoDeRetencao: PrazoDeRetencao;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * `target_business_rules.md` BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe.
 */
export function criarModuloDeRetencaoEDescarte(
  portas: PortasDeRetencaoEDescarte,
  opcoes: OpcoesDeRetencaoEDescarte = {},
): ModuloDeRetencaoEDescarte {
  return {
    nome: 'retencao-e-descarte',
    portas,
    // Ler o argumento com o valor de fabrica no lugar do ausente e a unica coisa
    // que a composicao resolve: nenhuma porta e tocada, que e o que `EXT-ORDEM`
    // cobra e o que `modulo.test.ts` afirma.
    prazoDeRetencao: opcoes.prazoDeRetencao ?? PRAZO_DE_RETENCAO_DE_FABRICA,
  };
}
