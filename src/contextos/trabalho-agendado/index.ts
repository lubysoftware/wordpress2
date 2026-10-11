/**
 * Modulo de trabalho agendado — a feature `011-trabalho-agendado`.
 *
 * Esqueleto da tarefa **T001**. O que existe aqui e exatamente o que T001
 * entrega: *"o modulo carrega com as portas de dados, de relogio, de cache e de
 * cliente externo declaradas, e a fila existe como dado inspecionavel e vazio"*
 * — e **nenhuma regra de negocio implementada**. Gravar e ler a fila, a trava, o
 * disparo, a exclusao entre processos, o reagendamento e o registro de execucao
 * entram nas tarefas delas (T002 em diante), e a leitura obrigatoria de cada uma
 * esta em `./README.md`.
 *
 * ## 🔴 Antes de pegar a tarefa seguinte: esta feature tem conflito aberto
 *
 * `tasks.md` abre com a advertencia, e ela nao e formalidade: *"tres das
 * historias desta feature (REQ-122, REQ-124 e REQ-125) estao em conflito aberto
 * com a resposta 10 de `questions.md` ... Enquanto o conflito nao for decidido
 * por uma pessoa, as tarefas delas nao comecam: construir qualquer um dos dois
 * lados cria trabalho que o outro lado joga fora"*.
 *
 * T001 e T002 sao as duas tarefas de **infraestrutura** desta feature — as
 * unicas cujo campo *satisfaz* e vazio. T001 declara as bordas e a forma do dado,
 * e **nao decide o conflito**: nada aqui dispara, nada aqui agenda, e
 * `modulo.test.ts` afirma que compor o modulo **nao toca em porta nenhuma**. A
 * explicacao inteira esta em `./README.md` e nos cabecalhos de
 * `portas/porta-de-cliente-externo.ts` e `fila/fila-agendada.ts`.
 *
 * ## A qual bounded context este modulo pertence
 *
 * `target_architecture.md` poe o agendamento em **BC-11 (Operacao do
 * Software)**, no aggregate `AGG-TarefaAgendada`, com as regras `A1`-`A12`. O
 * mesmo BC-11 e dono da atualizacao, do modo de recuperacao e do diagnostico de
 * saude, que sao a feature `010-operacao-do-software` — e ha uma divergencia
 * declarada, nao acidental: *"a fatia 5 de `migration_strategy.md` entrega o
 * agendador **sozinho**, por mandato da implicacao 6. Fatia e unidade de entrega;
 * bounded context e unidade de desenho"*.
 *
 * Esta pasta leva o nome da **feature**, nao do contexto, pela mesma razao que
 * `retencao-e-descarte` leva: a unidade de entrega do pacote e a feature. Quando
 * `010` existir, as duas convivem em BC-11 sem se importarem uma a outra — a
 * regra de dependencia 3 proibe `contextos/<a>` importar `contextos/<b>` no topo
 * do modulo, **sem excecao**, e as seis features que esperam por esta
 * (`002`, `005`, `007`, `008`, `009`, `010`) chegam cada uma pela porta de fila
 * agendada **dela**, como `005` ja faz.
 *
 * ## Duas coisas que este arquivo faz de proposito
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e a
 *   implicacao 2 do paradigma e a mais grave da travessia. Por isso as portas
 *   chegam por argumento e nao existe instancia compartilhada aqui: duas
 *   composicoes nao se enxergam. A fila que este modulo expoe e **valor
 *   imutavel**, nao buffer.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados, nao toca no cache e **nao dispara nada** ao ser criado. A ordem de
 *   arranque e contrato publico (BR-MIGRAR-106, `EXT-ORDEM`), e a constituicao
 *   poe *"mudar a ordem de carregamento do arranque"* na tabela do que exige
 *   decisao humana. Nesta feature ha um agravante: disparar na composicao seria
 *   escolher um lado do conflito por acidente.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo ... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato publico
 * e framework com ciclo de vida proprio disputa com ela.
 */

import { FILA_VAZIA, type FilaAgendada } from './fila/index.js';
import type {
  PortaDeCache,
  PortaDeClienteExterno,
  PortaDeDados,
  PortaDeRelogio,
} from './portas/index.js';

export * from './portas/index.js';
export * from './fila/index.js';

/** As quatro portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeTrabalhoAgendado {
  readonly dados: PortaDeDados;
  readonly relogio: PortaDeRelogio;
  readonly cache: PortaDeCache;
  readonly clienteExterno: PortaDeClienteExterno;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o **P4** da constituicao exige, e nenhuma antes da propria
 * tarefa. Hoje ha duas coisas, as duas de T001: as portas e a fila.
 *
 * As operacoes que a tabela *Contratos* de `plan.md` nomeia, com a autorizacao
 * que o pacote declara para cada uma — **citadas, nao decididas aqui**, para que
 * a tarefa que construir cada uma nasca com a declaracao que o P4 cobra:
 *
 * | operacao | historia | tarefa | autorizacao, como o pacote a declara |
 * |---|---|---|---|
 * | agendar evento | — (infra) | **T002** | nenhuma declarada: no legado `wp_schedule_event()` nao verifica capacidade |
 * | desagendar | — (infra) | **T002** | idem |
 * | listar a fila | US-1 (CA-1.3) | **T003** 🔴 | idem |
 * | avancar a fila | US-1 | **T003** 🔴 | **nenhuma.** UC-39 e literal: *"o endpoint da fila e publico e nao autenticado; o unico freio e uma trava de tempo de 60 segundos"* |
 * | reagendar recorrente | US-5 | **T011** | nenhuma declarada |
 * | relatar falha do gatilho | US-4 | **T009** 🔴 | nenhuma declarada; o diagnostico de saude e do painel, e e da feature `010` |
 *
 * A linha de *avancar a fila* e a que o P4 mais cobra que esteja escrita: ela e
 * uma das operacoes que *"decidem acesso sem consultar capacidade alguma"*, e uma
 * matriz que a ignore descreve um sistema mais fechado do que o real. O contrato
 * dela tem uma segunda metade que `plan.md` registra e que quase ninguem nota:
 * *"ela e chamada por requisicao qualquer, de qualquer visitante, e precisa ser
 * inofensiva quando nao ha nada a fazer"*.
 */
export interface ModuloDeTrabalhoAgendado {
  readonly nome: 'trabalho-agendado';
  readonly portas: PortasDeTrabalhoAgendado;
  /**
   * A fila desta composicao, como dado inspecionavel (T001).
   *
   * Vazia: e o estado antes de qualquer agendamento, que no legado e o que
   * `_get_cron_array()` devolve quando a opcao nao existe
   * (`wp-includes/cron.php:1262`-`1265`).
   *
   * **Nao e cache da fila gravada, e nao pode se tornar um.** No legado a fila e
   * lida da configuracao **em cada requisicao** e regravada inteira; guardar o
   * valor lido em estado de modulo e a violacao de `EXT-CONTEXTO` que a
   * implicacao 2 descreve. **T002** traz a leitura e a gravacao pela porta de
   * dados, e e esperado que a operacao de leitura substitua este campo quando
   * chegar.
   */
  readonly fila: FilaAgendada;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro explicito, resolvido antes
 * do primeiro uso. Trocar uma porta e passar outra implementacao aqui — sem
 * alterar arquivo deste modulo, que e o criterio de "substituivel" que
 * BR-MIGRAR-103 propoe.
 *
 * **Nao recebe opcoes, e a ausencia e deliberada.** Os dois numeros desta feature
 * (60 segundos de trava, descarte dela depois de 10 minutos) sao constantes do
 * legado — `WP_CRON_LOCK_TIMEOUT`, `wp-includes/default-constants.php:399` — e
 * entram com **T002**, que e a tarefa que os implementa e que escreve o teste de
 * borda que o **P6** cobra. E a fila nao chega por argumento porque no legado ela
 * nao vem de configuracao de arranque: ela vem da linha `cron` da tabela de
 * opcoes, pela porta de dados, em T002.
 */
export function criarModuloDeTrabalhoAgendado(
  portas: PortasDeTrabalhoAgendado,
): ModuloDeTrabalhoAgendado {
  return {
    nome: 'trabalho-agendado',
    portas,
    // A fila vazia e valor congelado e compartilhado: nenhuma composicao pode
    // muta-la, e e isso que torna o compartilhamento seguro numa runtime
    // longo-viva (`EXT-CONTEXTO`). Ver `fila/fila-agendada.ts`.
    fila: FILA_VAZIA,
  };
}
