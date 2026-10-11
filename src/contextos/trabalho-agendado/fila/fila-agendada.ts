/**
 * A forma da fila agendada, e a fila vazia — a segunda metade da entrega de
 * **T001**: *"a fila existe como dado inspecionavel e vazio"*.
 *
 * ## O que este arquivo declara, e o que ele deliberadamente nao declara
 *
 * Declara **a forma do dado** e o **valor vazio**. Nao declara onde a fila mora,
 * nao a le, nao a grava, nao a ordena e nao executa nada: gravar e ler no ponto
 * de configuracao do legado e **T002**, e cada operacao da tabela *Contratos* de
 * `plan.md` (agendar, desagendar, listar, avancar, reagendar) e a tarefa da
 * historia dela.
 *
 * 🔴 **A distincao entre forma e morada nao e arrumacao de codigo: e o conflito
 * aberto desta feature.** `spec.md` registra que **CA-1.2** e a **resposta 10**
 * de `questions.md` se excluem, e `backlog/tests.md` leva a disputa ate o
 * armazenamento: UT-122-8 pede *"manter a fila como componente proprio, e nao
 * como lista na configuracao do site"*, enquanto a entrega de T002 diz *"a fila e
 * gravada e lida no mesmo ponto de configuracao do legado"*. O que este arquivo
 * declara — instantes, ganchos, argumentos, recorrencia — e o **conteudo** da
 * fila, que e o mesmo nos dois lados; **onde** ele mora e o que esta em disputa, e
 * T001 nao escolhe. A advertencia no alto de `tasks.md` vale: as tarefas de
 * REQ-122, REQ-124 e REQ-125 nao comecam antes da decisao humana.
 *
 * ## Por que lista ordenada, e nao dicionario
 *
 * Porque a ordem da fila e **dado gravado**, nao consequencia da leitura. O
 * legado reordena a estrutura na insercao, com comparacao **natural de texto**
 * sobre as chaves de instante (`wp-includes/cron.php:206` e `:328`):
 *
 * ```php
 * $crons[ $event->timestamp ][ $event->hook ][ $key ] = array( ... );
 * uksort( $crons, 'strnatcasecmp' );
 * ```
 *
 * e e nessa ordem que ela sai dos bytes da opcao. PT-005 cobra as duas coisas no
 * mesmo cenario: *"a estrutura serializada lida e identica byte a byte nas duas"*
 * e *"a ordem das tarefas dentro da estrutura e a mesma nas duas"*. Um dicionario
 * deste runtime reordenaria chave numerica por conta propria e esconderia
 * exatamente o que precisa ser conferido — e e o mesmo motivo pelo qual
 * `plataforma/serializacao/valor-php.ts` escolheu *"uma lista ordenada de
 * entradas, e nao um mapa"*.
 *
 * Quem for portar a insercao em T002 repara que `strnatcasecmp` nao e comparacao
 * numerica: para instante Unix positivo as duas coincidem, e e por isso que a
 * diferenca nunca apareceu. Trocar por ordenacao numerica e mudanca de estrutura
 * interna que **parece** inocua; conferi-la e trabalho de T002, nao suposicao de
 * T001.
 *
 * ## A fila em memoria nao tem versao, e a gravada tem
 *
 * `_get_cron_array()` **retira** o marcador de versao antes de devolver
 * (`unset( $cron['version'] )`, `wp-includes/cron.php:1275`) e
 * `_set_cron_array()` **poe** `version = 2` antes de gravar
 * (`wp-includes/cron.php:1302`). Logo a forma em memoria — que e esta — nao tem
 * versao, e a forma gravada tem: o marcador pertence a T002, junto com a
 * conversao de versao 1 para 2 (`_upgrade_cron_array()`,
 * `wp-includes/cron.php:1331`), que o porte herda mesmo partindo de instalacao
 * nova, porque o P8 nao deixa remover o que existe.
 *
 * ## A identidade de um evento e gancho mais argumentos, e a chave e derivada
 *
 * A chave de cada ocorrencia e `md5( serialize( $event->args ) )`
 * (`wp-includes/cron.php:132` e `:319`), e dai saem duas consequencias que T001
 * registra para quem for calcular a chave:
 *
 * 1. **Os bytes do formato serializado decidem a identidade.** O codec esta em
 *    `plataforma/serializacao/`, com a suite de conformidade dele, e e dele que a
 *    chave tem de sair. Por isso {@link OcorrenciaNaFila.argumentos} e uma lista
 *    de `EntradaDeArranjo` do codec, e nao valor nativo deste runtime: inteiro e
 *    decimal produzem bytes diferentes, a chave de arranjo pode ser inteiro ou
 *    texto, e a ordem de insercao e observavel.
 * 2. **A chave do arranjo conta para a identidade, mesmo sendo ignorada na
 *    chamada.** A documentacao de `wp_schedule_event()` diz que *"as chaves do
 *    arranjo sao ignoradas"* ao passar os argumentos ao gancho
 *    (`wp-includes/cron.php:239`), e isso e verdade para o despacho —
 *    `do_action_ref_array( $hook, $v['args'] )` (`wp-cron.php:191`). Para a
 *    **identidade** e falso: `serialize()` guarda as chaves, logo
 *    `array( 'a' => 1 )` e `array( 1 )` sao eventos **diferentes** na fila.
 *    Guardar so os valores apagaria essa diferenca.
 */

import type { EntradaDeArranjo } from '../../../plataforma/serializacao/index.js';

/**
 * Nome de recorrencia, como o legado os nomeia.
 *
 * **E `string` de proposito, e nao uniao fechada.** O legado traz quatro de
 * fabrica — `hourly`, `twicedaily`, `daily` e `weekly`
 * (`wp-includes/cron.php:1134`-`1151`) — mas o ponto de extensao `cron_schedules`
 * acrescenta outros, e o legado os junta na mesma leitura
 * (`wp-includes/cron.php:1169`). Fechar a uniao aqui recusaria recorrencia de
 * terceiro que o produto aceita, o que o **P2** proibe.
 *
 * Os intervalos de fabrica **nao** estao declarados neste arquivo: eles entram
 * com a tarefa que resolve recorrencia em intervalo (**T011**, US-5), cada um com
 * o teste de borda que o **P6** cobra.
 */
export type NomeDeRecorrencia = string;

/**
 * Uma ocorrencia na fila: um evento marcado, identificado por gancho mais
 * argumentos.
 *
 * E uma **uniao**, e a razao e a forma do registro gravado. O evento unico grava
 * duas chaves (`wp-includes/cron.php:202`-`205`):
 *
 * ```php
 * $crons[ $timestamp ][ $hook ][ $key ] = array(
 *     'schedule' => $event->schedule,   // false, no evento unico
 *     'args'     => $event->args,
 * );
 * ```
 *
 * e o recorrente grava **tres**, com o intervalo
 * (`wp-includes/cron.php:323`-`327`). A documentacao do legado diz a mesma coisa
 * em palavras: *"o intervalo ... so esta presente em evento recorrente"*
 * (`wp-includes/cron.php:96`). A ausencia da chave e diferente de uma chave com
 * valor nulo nos bytes gravados, e a ordem em que elas aparecem tambem e: quem
 * gravar em T002 preserva `schedule`, `args` e depois `interval`.
 */
export type OcorrenciaNaFila =
  | {
      /**
       * A chave da ocorrencia dentro do gancho: `md5( serialize( args ) )` no
       * legado. E **derivada** dos argumentos — ver o cabecalho deste arquivo.
       */
      readonly chave: string;
      /** Evento unico: no legado, `'schedule' => false`. */
      readonly recorrencia: null;
      /** O arranjo de argumentos, com chaves e ordem preservadas. */
      readonly argumentos: readonly EntradaDeArranjo[];
    }
  | {
      readonly chave: string;
      /** Evento recorrente: o nome da recorrencia, como gravado. */
      readonly recorrencia: NomeDeRecorrencia;
      readonly argumentos: readonly EntradaDeArranjo[];
      /**
       * O intervalo em segundos, copiado da recorrencia no momento do
       * agendamento (`wp-includes/cron.php:283`).
       *
       * E copia, e nao referencia: se uma extensao mudar depois o intervalo de
       * uma recorrencia, o evento ja agendado continua com o numero que foi
       * gravado. Reproduzir isso e de T011; o campo existe para que a copia caiba
       * no dado.
       */
      readonly intervaloEmSegundos: number;
    };

/** Os eventos de um mesmo gancho marcados para o mesmo instante. */
export interface GanchoNaFila {
  /**
   * O nome do gancho. E contrato publico (**P2**, **P8**): nenhuma extensao de
   * terceiro encontra um gancho renomeado.
   */
  readonly gancho: string;
  /**
   * As ocorrencias, na ordem em que estao gravadas. Duas ocorrencias do mesmo
   * gancho no mesmo instante existem quando os argumentos diferem — e a chave
   * delas e que difere.
   */
  readonly ocorrencias: readonly OcorrenciaNaFila[];
}

/** Tudo que esta marcado para um mesmo instante. */
export interface InstanteDaFila {
  /**
   * O instante, em segundos inteiros UTC: a chave externa do arranjo do legado,
   * e a unidade de {@link PortaDeRelogio.agoraEmSegundos}.
   */
  readonly instanteEmSegundos: number;
  /** Os ganchos marcados para este instante, na ordem gravada. */
  readonly ganchos: readonly GanchoNaFila[];
}

/**
 * A fila: os instantes, na ordem em que estao gravados.
 *
 * E `readonly` de cima a baixo porque a fila do legado nao e objeto mutavel — ela
 * e um valor lido inteiro e **regravado inteiro**
 * (`_get_cron_array()` / `_set_cron_array()`), e o risco 2 de `plan.md` diz o que
 * isso custa: *"dois processos que a leiam e regravem ao mesmo tempo perdem
 * evento"*. Um dado imutavel deixa essa perda visivel em quem regrava, que e onde
 * ela acontece, em vez de esconde-la numa mutacao compartilhada.
 */
export type FilaAgendada = readonly InstanteDaFila[];

/**
 * A fila vazia — o que T001 entrega como estado inicial.
 *
 * E a fila de uma instalacao em que nada foi agendado ainda, e tem forma no
 * legado: `_get_cron_array()` devolve `array()` quando a opcao nao existe ou nao
 * e arranjo (`wp-includes/cron.php:1262`-`1265`).
 *
 * **Congelada, e e assercao e nao detalhe.** Duas composicoes do modulo
 * compartilham este valor, e ele so pode ser compartilhado porque nao pode ser
 * mudado: BR-MIGRAR-105 (`EXT-CONTEXTO`) poe o estado no escopo da **requisicao**,
 * e a implicacao 2 do paradigma e a mais grave da travessia — numa runtime
 * longo-viva, estado de modulo compartilhado faz duas requisicoes trocarem de
 * dado entre si. `fila-agendada.test.ts` afirma o congelamento.
 */
export const FILA_VAZIA: FilaAgendada = Object.freeze([]);
