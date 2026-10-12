/**
 * Modulo de trabalho agendado — a feature `011-trabalho-agendado`.
 *
 * Tarefas fechadas aqui: **T001** (o esqueleto — as quatro portas e a fila como
 * dado) e **T002** (a fila gravada e lida na linha `cron` da tabela de opcoes, e
 * a trava de 60 segundos com o descarte da adiantada depois de 10 minutos). E
 * **nenhuma regra de negocio implementada**: o disparo, a exclusao entre
 * processos, o reagendamento e o registro de execucao entram nas tarefas delas
 * (T003 em diante), e a leitura obrigatoria de cada uma esta em `./README.md`.
 *
 * ## 🔴 Antes de pegar a tarefa seguinte: esta feature tem conflito aberto
 *
 * `tasks.md` abre com a advertencia, e ela nao e formalidade: *"tres das
 * historias desta feature (REQ-122, REQ-124 e REQ-125) estao em conflito aberto
 * com a resposta 10 de `questions.md` ... Enquanto o conflito nao for decidido
 * por uma pessoa, as tarefas delas nao comecam: construir qualquer um dos dois
 * lados cria trabalho que o outro lado joga fora"*. Isso bloqueia **T003**,
 * **T004**, **T007**, **T008**, **T009** e **T010**.
 *
 * T001 e T002 sao as duas tarefas de **infraestrutura** desta feature — as
 * unicas cujo campo *satisfaz* e vazio, e as unicas que a advertencia nao
 * bloqueia. T001 declarou as bordas e a forma do dado; T002 trouxe a morada e o
 * freio. **Nenhuma das duas decide o conflito**: nada aqui dispara, nada aqui
 * executa, e `modulo.test.ts` afirma que compor o modulo **nao toca em porta
 * nenhuma**. A explicacao inteira esta em `./README.md` e nos cabecalhos de
 * `portas/porta-de-cliente-externo.ts` e `fila/estrutura-gravada.ts`.
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
 *   composicoes nao se enxergam. A fila que este modulo entrega e **valor
 *   imutavel devolvido por leitura**, nao buffer guardado aqui: no legado ela e
 *   lida da configuracao em cada requisicao e regravada inteira.
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

import {
  criarArmazenamentoDeTrabalhoAgendado,
  type ArmazenamentoDeTrabalhoAgendado,
} from './armazenamento/index.js';
import {
  TRAVA_DA_FILA_DE_FABRICA,
  type TravaDaFila,
} from './configuracao/index.js';
import type {
  PortaDeCache,
  PortaDeClienteExterno,
  PortaDeDados,
  PortaDeRelogio,
} from './portas/index.js';

export * from './portas/index.js';
export * from './fila/index.js';
export * from './configuracao/index.js';
export * from './armazenamento/index.js';

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
 * tarefa. Hoje ha tres coisas, e **nenhuma delas e operacao**: as portas (T001),
 * a trava em vigor e o armazenamento (T002). O armazenamento nao declara
 * permissao porque nao decide nada — ele le e grava duas linhas de opcao, e quem
 * cobra a capacidade e a operacao que o chama, que no legado, nesta feature, e
 * **nenhuma**.
 *
 * As operacoes que a tabela *Contratos* de `plan.md` nomeia, com a autorizacao
 * que o pacote declara para cada uma — **citadas, nao decididas aqui**, para que
 * a tarefa que construir cada uma nasca com a declaracao que o P4 cobra:
 *
 * | operacao | historia | tarefa | autorizacao, como o pacote a declara |
 * |---|---|---|---|
 * | agendar evento | — (infra) | **T002** — a estrutura e a gravacao; as guardas e a janela de duplicado ficam com quem expuser a operacao | nenhuma declarada: no legado `wp_schedule_event()` nao verifica capacidade |
 * | desagendar | — (infra) | **T002**, idem | idem |
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
   * A trava em vigor nesta composicao, lida do ponto de configuracao nomeado
   * (T002). De fabrica, 60 segundos de trava e descarte da trava adiantada em
   * mais de 10 minutos — `A9` / BR-MIGRAR-053. Ver
   * `configuracao/trava-da-fila.ts`.
   */
  readonly travaDaFila: TravaDaFila;
  /**
   * As duas linhas de opcao desta feature — a fila e a trava (T002). Le e grava
   * **somente** pelas portas de dados e de cache.
   *
   * 🔴 **Substitui o campo `fila` que T001 publicou, e a substituicao foi T001
   * que escreveu:** *"T002 traz a leitura e a gravacao pela porta de dados, e e
   * esperado que a operacao de leitura substitua este campo quando chegar"*. O
   * campo nao podia virar a fila lida, e a razao e `EXT-CONTEXTO`
   * (BR-MIGRAR-105): resolver a leitura na composicao seria tocar o banco no
   * carregamento e guardar o valor lido em estado de modulo — as duas coisas que
   * T001 proibiu no mesmo paragrafo. No legado a fila e lida da configuracao **em
   * cada requisicao**, e e por isso que ela e `armazenamento.fila.obter()`, uma
   * operacao, e nao um campo. A fila vazia continua existindo como valor
   * (`FILA_VAZIA`), que e o que a leitura devolve quando a opcao nao existe.
   */
  readonly armazenamento: ArmazenamentoDeTrabalhoAgendado;
}

/**
 * O que a instalacao informa ao modulo.
 *
 * E o equivalente, no alvo, do `define()` em `wp-config.php`: o legado altera
 * `WP_CRON_LOCK_TIMEOUT` por constante redefinida **antes** do arranque, nao por
 * opcao e nao por ponto de extensao. Ver `configuracao/trava-da-fila.ts`.
 */
export interface OpcoesDeTrabalhoAgendado {
  /**
   * Os dois numeros da trava. Omitidos, valem os de fabrica: 60 segundos, e
   * descarte da trava adiantada em mais de 10 minutos.
   */
  readonly travaDaFila?: TravaDaFila;
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
 * **As opcoes trazem os dois numeros da trava, e nada mais.** Eles sao constante
 * do legado — `WP_CRON_LOCK_TIMEOUT`, `wp-includes/default-constants.php:399`, e
 * os `10 * MINUTE_IN_SECONDS` de `wp-includes/cron.php:917` —, logo o ponto que
 * os altera e este argumento, resolvido antes do primeiro uso. A fila **nao**
 * chega por argumento porque no legado ela nao vem de configuracao de arranque:
 * ela vem da linha `cron` da tabela de opcoes, pela porta de dados.
 */
export function criarModuloDeTrabalhoAgendado(
  portas: PortasDeTrabalhoAgendado,
  opcoes: OpcoesDeTrabalhoAgendado = {},
): ModuloDeTrabalhoAgendado {
  return {
    nome: 'trabalho-agendado',
    portas,
    // Ler o argumento com o valor de fabrica no lugar do ausente e a unica coisa
    // que a composicao resolve: nenhuma porta e tocada, que e o que `EXT-ORDEM`
    // cobra e o que `modulo.test.ts` afirma.
    travaDaFila: opcoes.travaDaFila ?? TRAVA_DA_FILA_DE_FABRICA,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui, e nenhum DDL — esta feature nao acrescenta tabela.
    armazenamento: criarArmazenamentoDeTrabalhoAgendado(
      portas.dados,
      portas.cache,
    ),
  };
}
