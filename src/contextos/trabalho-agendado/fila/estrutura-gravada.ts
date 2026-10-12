/**
 * A fila como **estrutura gravada**: o marcador de versao, a conversao da versao
 * 1, a chave de cada ocorrencia, a ordem dos instantes e as duas unicas formas de
 * mexer nela — por a ocorrencia e tirar a ocorrencia.
 *
 * Primeira metade da entrega de **T002**: *"a fila e gravada e lida no mesmo
 * ponto de configuracao do legado"*. *satisfaz:* — (infraestrutura).
 *
 * Nenhuma linha daqui fala com banco, cache ou relogio: a morada e
 * `../armazenamento/fila-em-opcao.ts`, que le e grava a linha `cron` da tabela de
 * opcoes pela porta de dados. Aqui esta so a estrutura, e e por isso que tudo
 * nesta pagina e funcao pura sobre valor imutavel.
 *
 * ## 🔴 Onde a fila mora continua em disputa, e T002 nao a resolve
 *
 * `fila-agendada.ts` registrou a disputa em T001 e ela continua de pe:
 * UT-122-8 de `backlog/tests.md` pede *"manter a fila como componente proprio, e
 * nao como lista na configuracao do site"*, enquanto a entrega de T002 diz *"a
 * fila e gravada e lida no mesmo ponto de configuracao do legado"*. As duas sao
 * decisao humana, e a constituicao poe *"resolver um dos conflitos entre card
 * `wont` e resposta humana"* na tabela do que exige decisao humana.
 *
 * **T002 nao escolhe: ela executa a propria tarefa.** O que o pacote mandou
 * construir aqui e o lado do legado — `tasks.md` escreve a entrega com estas
 * palavras, e T002 e uma das duas tarefas de **infraestrutura** da feature, as
 * unicas cujo campo *satisfaz* e vazio e as unicas que a advertencia no alto de
 * `tasks.md` **nao** bloqueia (ela bloqueia as tarefas de REQ-122, REQ-124 e
 * REQ-125: T003, T004, T007, T008, T009 e T010). Se a decisao humana vier pelo
 * lado do card, o que esta aqui e o que sai; nada do que esta aqui dispara,
 * agenda ou executa, e portanto nada aqui compromete a decisao.
 *
 * ## A versao: nao existe em memoria, existe gravada
 *
 * `_get_cron_array()` **retira** o marcador antes de devolver
 * (`unset( $cron['version'] )`, `wp-includes/cron.php:1275`) e
 * `_set_cron_array()` **poe** `version = 2` antes de gravar
 * (`wp-includes/cron.php:1302`). A assimetria e observavel nos bytes, e tem tres
 * consequencias que este arquivo reproduz:
 *
 * 1. **o marcador vai por ultimo.** No legado ele e acrescentado a um arranjo que
 *    ja passou pelo `uksort`, e no PHP uma chave nova vai para o fim. Fila vazia
 *    gravada e, por isso, `a:1:{s:7:"version";i:2;}` e nao `a:0:{}` — vetor
 *    conferido no oraculo;
 * 2. **a conversao da versao 1 acontece na LEITURA, e grava.**
 *    `_get_cron_array()` chama `_upgrade_cron_array()` quando o marcador nao esta
 *    la (`:1271`-`:1273`), e a conversao **regrava a opcao** no meio do caminho
 *    (`update_option( 'cron', $new_cron, true )`, `:1348`). Ler uma fila antiga
 *    escreve no banco, e isso e efeito no banco (area 3 da Decisao 2 de
 *    `parity_specs.md`);
 * 3. **`isset` e nao `array_key_exists`.** `'version' => null` nao conta como
 *    marcador presente, logo dispara a conversao — e a conversao deixa a chave
 *    `version` de fora, porque `(array) null` e um arranjo vazio e o laco interno
 *    nao gira. Medido no oraculo.
 *
 * O porte herda a conversao mesmo partindo de instalacao nova (resposta 2: nao ha
 * dado a migrar), porque o **P8** nao deixa remover o que existe: *"existir sem
 * ser chamada e parte do que se clona"*.
 *
 * ## A identidade de uma ocorrencia sai dos BYTES dos argumentos
 *
 * A chave e `md5( serialize( $event->args ) )` (`wp-includes/cron.php:132` e
 * `:319`), e por isso ela sai do codec de `plataforma/serializacao` e nao de
 * valor nativo deste runtime: inteiro e decimal produzem bytes diferentes, a
 * chave de arranjo pode ser inteiro ou texto, e a ordem de insercao e observavel.
 * `array( 'a' => 1 )` e `array( 1 )` sao eventos **diferentes** na fila, ainda
 * que o despacho ignore as chaves (`do_action_ref_array( $hook, $v['args'] )`,
 * `wp-cron.php:191`).
 *
 * ## O que este arquivo NAO faz, e de quem e
 *
 * - **Nao valida instante, nem recorrencia, nem gancho.** As guardas de
 *   `wp_schedule_event()` — instante inteiro positivo (`:254`), recorrencia
 *   existente em `wp_get_schedules()` (`:267`) — e a janela de dez minutos do
 *   evento duplicado (`:135`-`:160`) sao de quem portar a operacao de agendar,
 *   com os intervalos de fabrica que **T011** traz.
 * - **Nao dispara os pontos de extensao** `pre_schedule_event`,
 *   `schedule_event`, `pre_unschedule_event` (`:100`, `:188`, `:520`). Eles sao
 *   contrato publico (**P2**) e entram com a operacao que os emite, na ordem em
 *   que o legado os emite; o barramento e REQ-162, que `do-not-rewrite.md` poe
 *   fora de escopo.
 * - **Nao percorre a fila por vencimento.** `wp_get_ready_cron_jobs()`
 *   (`:1215`-`:1246`) e o laco de `wp-cron.php:117`-`:120` sao **T003**, no
 *   conflito aberto.
 */

import { createHash } from 'node:crypto';

import {
  arranjo,
  booleano,
  inteiro,
  nomeDaChave,
  normalizarChaveDeTexto,
  serializar,
  texto,
  type ChaveDeArranjo,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { compararNaturalSemCaixa } from './comparacao-natural.js';
import type {
  FilaAgendada,
  GanchoNaFila,
  InstanteDaFila,
  NomeDeRecorrencia,
  OcorrenciaNaFila,
} from './fila-agendada.js';

/** O marcador que `_set_cron_array()` grava (`wp-includes/cron.php:1302`). */
export const VERSAO_DA_FILA = 2;

/** O nome da chave do marcador de versao. */
export const CHAVE_DA_VERSAO = 'version';

/** Os nomes das tres chaves do registro de uma ocorrencia, na ordem gravada. */
export const CHAVE_DA_RECORRENCIA = 'schedule';
export const CHAVE_DOS_ARGUMENTOS = 'args';
export const CHAVE_DO_INTERVALO = 'interval';

/**
 * A estrutura gravada na opcao, **sem** o marcador de versao: as entradas do
 * arranjo externo, na ordem em que estao nos bytes.
 *
 * E a lista de entradas do codec, e nao um mapa, pela mesma razao que
 * `fila-agendada.ts` da para a fila ser lista: a ordem e dado, e PT-005 a cobra
 * byte a byte. Guardar a estrutura **crua** ao lado da projecao tipada e o que
 * permite regravar sem alterar um byte o que a projecao nao sabe ler — o mesmo
 * desenho de `ValorGravado<T>` em
 * `contextos/identidade-e-acesso/armazenamento/repositorio-de-papeis.ts`.
 */
export type EstruturaDaFila = readonly EntradaDeArranjo[];

/** A estrutura de uma fila sem evento nenhum. */
export const ESTRUTURA_VAZIA: EstruturaDaFila = Object.freeze([]);

/**
 * O registro de uma ocorrencia na hora de gravar: a ocorrencia sem a chave, que
 * e **derivada** dos argumentos.
 *
 * E uniao pela mesma razao que {@link OcorrenciaNaFila} e: o evento unico grava
 * duas chaves e o recorrente grava tres
 * (`wp-includes/cron.php:202`-`205` contra `:323`-`327`).
 */
export type OcorrenciaParaGravar =
  | {
      readonly recorrencia: null;
      readonly argumentos: readonly EntradaDeArranjo[];
    }
  | {
      readonly recorrencia: NomeDeRecorrencia;
      readonly argumentos: readonly EntradaDeArranjo[];
      readonly intervaloEmSegundos: number;
    };

/**
 * A chave de uma ocorrencia: `md5( serialize( $args ) )`
 * (`wp-includes/cron.php:132` e `:319`).
 *
 * Os argumentos entram como arranjo, que e o que eles sao no legado — logo
 * argumento nenhum e `serialize( array() )`, ou `a:0:{}`, e a chave e
 * `40cd750bba9870f18aada2478b24840a`. Conferido no oraculo.
 */
export function chaveDaOcorrencia(
  argumentos: readonly EntradaDeArranjo[],
): string {
  return createHash('md5').update(serializar(arranjo(argumentos))).digest('hex');
}

/**
 * O registro de uma ocorrencia como valor do formato, na ordem de chaves que o
 * legado grava: `schedule`, `args` e — so no recorrente — `interval`.
 *
 * A ordem e observavel nos bytes, e a **ausencia** de `interval` e diferente de
 * `interval => null`: a documentacao do legado diz que o intervalo *"so esta
 * presente em evento recorrente"* (`wp-includes/cron.php:96`), e
 * `wp_get_scheduled_event()` o le com `isset` (`:840`).
 */
export function valorDaOcorrencia(ocorrencia: OcorrenciaParaGravar): ValorPhp {
  const entradas: EntradaDeArranjo[] = [
    {
      chave: normalizarChaveDeTexto(CHAVE_DA_RECORRENCIA),
      // Evento unico grava `'schedule' => false`, nao nulo e nao cadeia vazia.
      valor:
        ocorrencia.recorrencia === null
          ? booleano(false)
          : texto(ocorrencia.recorrencia),
    },
    {
      chave: normalizarChaveDeTexto(CHAVE_DOS_ARGUMENTOS),
      valor: arranjo(ocorrencia.argumentos),
    },
  ];

  if (ocorrencia.recorrencia !== null) {
    entradas.push({
      chave: normalizarChaveDeTexto(CHAVE_DO_INTERVALO),
      valor: inteiro(ocorrencia.intervaloEmSegundos),
    });
  }

  return arranjo(entradas);
}

/**
 * O valor do marcador de versao gravado, ou `null` quando ele nao conta.
 *
 * `isset( $cron['version'] )` (`wp-includes/cron.php:1271`): chave ausente **e**
 * chave com valor nulo valem a mesma coisa, e as duas levam a conversao.
 */
export function versaoNaEstrutura(
  entradas: readonly EntradaDeArranjo[],
): ValorPhp | null {
  const entrada = entradas.find(
    (candidata) =>
      candidata.chave.tipo === 'texto' &&
      nomeDaChave(candidata.chave) === CHAVE_DA_VERSAO,
  );
  if (entrada === undefined || entrada.valor.tipo === 'nulo') {
    return null;
  }
  return entrada.valor;
}

/** A estrutura sem a entrada do marcador — o `unset( $cron['version'] )` de `:1275`. */
export function estruturaSemVersao(
  entradas: readonly EntradaDeArranjo[],
): EstruturaDaFila {
  return entradas.filter(
    (entrada) =>
      !(
        entrada.chave.tipo === 'texto' &&
        nomeDaChave(entrada.chave) === CHAVE_DA_VERSAO
      ),
  );
}

/**
 * A estrutura pronta para gravar: o marcador de versao no fim — o
 * `$cron['version'] = 2` de `_set_cron_array()` (`:1302`).
 *
 * No fim porque e onde o PHP poe uma chave nova, e porque o `uksort` acontece
 * **antes** (`:206`, `:328`). Se a estrutura ja trouxesse um marcador, ele seria
 * substituido no lugar em que esta — o que nao acontece pelo caminho do legado,
 * porque a leitura o retira antes.
 */
export function valorDaEstruturaGravada(estrutura: EstruturaDaFila): ValorPhp {
  return arranjo(
    definirEntrada(estrutura, normalizarChaveDeTexto(CHAVE_DA_VERSAO), inteiro(VERSAO_DA_FILA)),
  );
}

/**
 * A conversao da estrutura de versao 1 para a de versao 2 —
 * `_upgrade_cron_array()` (`wp-includes/cron.php:1331`-`1351`).
 *
 * ```php
 * foreach ( (array) $cron as $timestamp => $hooks ) {
 *     foreach ( (array) $hooks as $hook => $args ) {
 *         $key = md5( serialize( $args['args'] ?? array() ) );
 *         $new_cron[ $timestamp ][ $hook ][ $key ] = $args;
 *     }
 * }
 * ```
 *
 * A versao 1 nao tem o nivel da chave: cada gancho guarda **um** registro. A
 * conversao acrescenta o nivel, calculando a chave a partir de `args`, e
 * **copia o registro verbatim** — inclusive o que estiver estranho nele.
 *
 * Quatro comportamentos medidos no oraculo, todos reproduzidos:
 *
 * | estrutura de entrada | o que o PHP produz |
 * |---|---|
 * | `10 => array( 'h' => array( 'schedule' => 'daily', 'args' => array(), 'interval' => 86400 ) )` | o mesmo registro sob a chave `md5( 'a:0:{}' )` |
 * | `10 => null` | **o instante desaparece**: `(array) null` nao gira o laco |
 * | `10 => 'texto'` | `(array) 'texto'` vira `array( 0 => 'texto' )`, logo gancho de chave **inteira** `0`, registro `'texto'`, chave `md5( 'a:0:{}' )` |
 * | registro sem `args` | chave `md5( 'a:0:{}' )`, pelo `?? array()` |
 *
 * **Nao ha `uksort` aqui**, logo a ordem de entrada e preservada; e a conversao
 * nao poe o marcador: quem grava o poe (ver {@link valorDaEstruturaGravada}), e
 * os bytes sao os mesmos porque no legado ele tambem vai por ultimo.
 */
export function converterEstruturaDaVersao1(
  entradas: readonly EntradaDeArranjo[],
): EstruturaDaFila {
  let nova: readonly EntradaDeArranjo[] = [];

  for (const entradaDeInstante of entradas) {
    for (const entradaDeGancho of comoArranjoDoPhp(entradaDeInstante.valor)) {
      const argumentos = valorDaChaveNomeada(
        entradaDeGancho.valor,
        CHAVE_DOS_ARGUMENTOS,
      );
      const chave = chaveDaOcorrencia(
        argumentos !== null && argumentos.tipo === 'arranjo'
          ? argumentos.entradas
          : [],
      );

      const ganchosDoInstante = entradasEm(nova, entradaDeInstante.chave);
      const comOcorrencia = definirEntrada(
        entradasEm(ganchosDoInstante, entradaDeGancho.chave),
        normalizarChaveDeTexto(chave),
        entradaDeGancho.valor,
      );
      const comGancho = definirEntrada(
        ganchosDoInstante,
        entradaDeGancho.chave,
        arranjo(comOcorrencia),
      );

      nova = definirEntrada(
        nova,
        entradaDeInstante.chave,
        arranjo(comGancho),
      );
    }
  }

  return nova;
}

/**
 * A estrutura reordenada por instante — o `uksort( $crons, 'strnatcasecmp' )` que
 * as duas operacoes de agendamento fazem (`wp-includes/cron.php:206` e `:328`).
 *
 * **So o nivel externo**: o legado nunca ordena os ganchos de um instante nem as
 * ocorrencias de um gancho, e ordena-los mudaria os bytes gravados.
 *
 * A ordenacao deste runtime e estavel (desde ES2019), como a do PHP desde a 8.0 —
 * e a estabilidade importa, porque `strnatcasecmp` empata chaves diferentes
 * (`'05'` e `'5'`). Ver `comparacao-natural.ts`.
 */
export function ordenarInstantes(estrutura: EstruturaDaFila): EstruturaDaFila {
  return [...estrutura].sort((aqui, ali) =>
    compararNaturalSemCaixa(
      conteudoDaChave(aqui.chave),
      conteudoDaChave(ali.chave),
    ),
  );
}

/**
 * Poe uma ocorrencia na estrutura, no caminho e na ordem do legado —
 * `$crons[ $timestamp ][ $hook ][ $key ] = array( ... )` seguido do `uksort`
 * (`wp-includes/cron.php:202`-`206` e `:323`-`328`).
 *
 * A chave vem dos argumentos; quem ja a tem nao a passa, porque no legado ela
 * tambem nao e dado de entrada. Chave que ja existe e **substituida no lugar**,
 * que e o que a atribuicao do PHP faz com uma chave existente — e gancho e
 * instante novos vao para o fim antes de o `uksort` reordenar o nivel externo.
 *
 * ⚠️ **Nivel ocupado por escalar faz o legado morrer, e aqui tambem.** Medido no
 * oraculo em PHP 8.3: com `$crons[ $ts ]` guardando texto, a atribuicao lanca
 * `TypeError: Cannot access offset of type string on string`; com inteiro,
 * `Error: Cannot use a scalar value as an array`; com `null` ou `false`, o PHP
 * cria o arranjo e segue (com aviso de descontinuado, no caso do `false`). Ver
 * {@link comoArranjoParaEscrita}.
 */
export function agendarNaEstrutura(
  estrutura: EstruturaDaFila,
  instanteEmSegundos: number,
  gancho: string,
  ocorrencia: OcorrenciaParaGravar,
): EstruturaDaFila {
  const chaveDoInstante: ChaveDeArranjo = {
    tipo: 'inteiro',
    valor: instanteEmSegundos,
  };
  const chaveDoGancho = normalizarChaveDeTexto(gancho);
  const chave = normalizarChaveDeTexto(chaveDaOcorrencia(ocorrencia.argumentos));

  const ganchos = comoArranjoParaEscrita(valorEm(estrutura, chaveDoInstante));
  const ocorrencias = comoArranjoParaEscrita(valorEm(ganchos, chaveDoGancho));

  const comOcorrencia = definirEntrada(
    ocorrencias,
    chave,
    valorDaOcorrencia(ocorrencia),
  );
  const comGancho = definirEntrada(
    ganchos,
    chaveDoGancho,
    arranjo(comOcorrencia),
  );

  return ordenarInstantes(
    definirEntrada(estrutura, chaveDoInstante, arranjo(comGancho)),
  );
}

/**
 * Tira uma ocorrencia da estrutura, com a poda que o legado faz —
 * `wp_unschedule_event()` (`wp-includes/cron.php:540`-`548`).
 *
 * ```php
 * unset( $crons[ $timestamp ][ $hook ][ $key ] );
 *
 * if ( empty( $crons[ $timestamp ][ $hook ] ) ) {
 *     unset( $crons[ $timestamp ][ $hook ] );
 * }
 *
 * if ( empty( $crons[ $timestamp ] ) ) {
 *     unset( $crons[ $timestamp ] );
 * }
 * ```
 *
 * **A poda e por `empty()`, nao por "arranjo sem entradas"**, e a diferenca e
 * alcancavel: um gancho que guarde `''`, `'0'`, `0`, `null` ou `false` e vazio
 * para o PHP e e **removido** por esta operacao, mesmo que nada tenha sido tirado
 * dele. Medido no oraculo: `empty()` e verdadeiro para os seis valores.
 *
 * **Nao ha `uksort` aqui** — o legado nao reordena ao desagendar —, e tirar o que
 * nao existe nao muda nada: a estrutura volta igual, e quem grava compara os
 * bytes e nao emite comando. E assim que o legado se comporta, porque
 * `update_option()` recusa escrever valor igual (`wp-includes/option.php:923`).
 */
export function desagendarNaEstrutura(
  estrutura: EstruturaDaFila,
  instanteEmSegundos: number,
  gancho: string,
  chaveDaOcorrenciaParaTirar: string,
): EstruturaDaFila {
  const chaveDoInstante: ChaveDeArranjo = {
    tipo: 'inteiro',
    valor: instanteEmSegundos,
  };
  const chaveDoGancho = normalizarChaveDeTexto(gancho);
  const chave = normalizarChaveDeTexto(chaveDaOcorrenciaParaTirar);

  let resultado: readonly EntradaDeArranjo[] = estrutura;

  const valorDoInstante = valorEm(resultado, chaveDoInstante);
  if (valorDoInstante !== undefined) {
    const ganchos = comoArranjoParaRemocao(valorDoInstante);
    if (ganchos !== null) {
      const valorDoGancho = valorEm(ganchos, chaveDoGancho);
      if (valorDoGancho !== undefined) {
        const ocorrencias = comoArranjoParaRemocao(valorDoGancho);
        if (ocorrencias !== null) {
          const semOcorrencia = removerEntrada(ocorrencias, chave);
          const comGancho = definirEntrada(
            ganchos,
            chaveDoGancho,
            arranjo(semOcorrencia),
          );
          resultado = definirEntrada(
            resultado,
            chaveDoInstante,
            arranjo(comGancho),
          );
        }
      }
    }
  }

  // `if ( empty( $crons[ $timestamp ][ $hook ] ) )`
  const ganchosAgora = valorEm(resultado, chaveDoInstante);
  if (ganchosAgora !== undefined && ganchosAgora.tipo === 'arranjo') {
    if (vazioComoNoPhp(valorEm(ganchosAgora.entradas, chaveDoGancho))) {
      resultado = definirEntrada(
        resultado,
        chaveDoInstante,
        arranjo(removerEntrada(ganchosAgora.entradas, chaveDoGancho)),
      );
    }
  }

  // `if ( empty( $crons[ $timestamp ] ) )`
  if (vazioComoNoPhp(valorEm(resultado, chaveDoInstante))) {
    resultado = removerEntrada(resultado, chaveDoInstante);
  }

  return resultado;
}

/**
 * A projecao tipada da estrutura: a fila como `fila-agendada.ts` a declara.
 *
 * **O que esta projecao NAO faz: normalizar.** Ela le o que tem a forma que o
 * legado grava e **ignora** o resto, que continua inteiro na estrutura crua e
 * portanto e regravado byte a byte. Tres formas ficam de fora, e cada uma tem
 * razao escrita:
 *
 * | forma na estrutura | por que fica fora |
 * |---|---|
 * | instante com chave de **texto** (`'05'`, `'5x'`) | virar numero seria normalizar a chave; o legado a compara como ela esta |
 * | ocorrencia sem `args`, ou com `args` que nao e arranjo | no legado o despacho `do_action_ref_array( $hook, $v['args'] )` ja nao funciona (`wp-cron.php:191`) |
 * | ocorrencia com `schedule` verdadeiro e sem `interval` inteiro | a uniao de `OcorrenciaNaFila` pede o par, e inventar intervalo e inventar numero que o legado nao tem (**P6**) |
 *
 * A terceira merece nota para quem pegar **T003** (CA-1.3, listar a fila): uma
 * fila gravada pelas proprias funcoes do legado nunca tem essa forma — elas
 * gravam os tres campos juntos (`:323`-`327`) —, mas `wp_get_scheduled_event()`
 * le o intervalo com `isset` (`:840`), logo o legado **tolera** a ausencia e
 * mostra o evento sem intervalo. Se CA-1.3 precisar mostra-lo, a decisao e de
 * T003 e muda a uniao que T001 declarou.
 */
export function filaDaEstrutura(estrutura: EstruturaDaFila): FilaAgendada {
  const instantes: InstanteDaFila[] = [];

  for (const entradaDeInstante of estrutura) {
    if (entradaDeInstante.chave.tipo !== 'inteiro') {
      continue;
    }
    if (entradaDeInstante.valor.tipo !== 'arranjo') {
      continue;
    }

    const ganchos: GanchoNaFila[] = [];
    for (const entradaDeGancho of entradaDeInstante.valor.entradas) {
      if (entradaDeGancho.valor.tipo !== 'arranjo') {
        continue;
      }

      const ocorrencias: OcorrenciaNaFila[] = [];
      for (const entradaDeOcorrencia of entradaDeGancho.valor.entradas) {
        const ocorrencia = ocorrenciaDoRegistro(
          nomeDaChave(entradaDeOcorrencia.chave),
          entradaDeOcorrencia.valor,
        );
        if (ocorrencia !== null) {
          ocorrencias.push(ocorrencia);
        }
      }

      ganchos.push({
        gancho: nomeDaChave(entradaDeGancho.chave),
        ocorrencias,
      });
    }

    instantes.push({
      instanteEmSegundos: entradaDeInstante.chave.valor,
      ganchos,
    });
  }

  return instantes;
}

/**
 * O caminho de volta: a estrutura de uma fila tipada.
 *
 * Serve a quem tem a fila na forma de `fila-agendada.ts` e quer os bytes — os
 * testes de paridade, antes de tudo. Nao e o caminho do legado para agendar: la
 * a estrutura e sempre a que foi lida, mexida no lugar por
 * {@link agendarNaEstrutura}.
 */
export function estruturaDaFila(fila: FilaAgendada): EstruturaDaFila {
  return fila.map((instante) => ({
    chave: { tipo: 'inteiro', valor: instante.instanteEmSegundos },
    valor: arranjo(
      instante.ganchos.map((gancho) => ({
        chave: normalizarChaveDeTexto(gancho.gancho),
        valor: arranjo(
          gancho.ocorrencias.map((ocorrencia) => ({
            chave: normalizarChaveDeTexto(ocorrencia.chave),
            valor: valorDaOcorrencia(ocorrencia),
          })),
        ),
      })),
    ),
  }));
}

/**
 * `empty( $x )` do PHP sobre um valor do formato, e sobre a **ausencia**.
 *
 * `empty()` de chave ausente e verdadeiro, e e por isso que a assinatura aceita
 * `undefined`. Os falsos sao os do PHP: arranjo sem entradas, `''`, `'0'`, zero,
 * nulo e falso — os seis medidos no oraculo.
 *
 * **A repeticao e obrigatoria, nao descuido:** `contextos/midia/armazenamento/verdade-de-php.ts`
 * e `contextos/conteudo/gravacao/verdade-de-php.ts` declaram a mesma regra, e a
 * regra de dependencia 3 de `target_architecture.md` proibe um contexto importar
 * outro *"sempre, sem excecao"*. Quando `plataforma/utilitarios/` existir as
 * copias descem juntas sem nenhuma chamada mudar de resultado.
 */
export function vazioComoNoPhp(valor: ValorPhp | undefined): boolean {
  if (valor === undefined) {
    return true;
  }
  switch (valor.tipo) {
    case 'nulo':
      return true;
    case 'booleano':
      return !valor.valor;
    case 'inteiro':
    case 'decimal':
      return valor.valor === 0;
    case 'texto':
      return textoVazioComoNoPhp(valor.valor);
    case 'arranjo':
      return valor.entradas.length === 0;
  }
}

function textoVazioComoNoPhp(valor: string | Uint8Array): boolean {
  if (typeof valor === 'string') {
    return valor === '' || valor === '0';
  }
  if (valor.length === 0) {
    return true;
  }
  return valor.length === 1 && valor[0] === 0x30;
}

/**
 * Um registro gravado, lido como ocorrencia — ou `null` quando ele nao tem a
 * forma que o legado grava. Ver a tabela em {@link filaDaEstrutura}.
 */
function ocorrenciaDoRegistro(
  chave: string,
  registro: ValorPhp,
): OcorrenciaNaFila | null {
  if (registro.tipo !== 'arranjo') {
    return null;
  }

  const argumentos = valorDaChaveNomeada(registro, CHAVE_DOS_ARGUMENTOS);
  if (argumentos === null || argumentos.tipo !== 'arranjo') {
    return null;
  }

  const recorrencia = valorDaChaveNomeada(registro, CHAVE_DA_RECORRENCIA);

  // `$schedule = $v['schedule']; if ( $schedule ) { ... }` (`wp-cron.php:126`).
  // Falso, cadeia vazia, `'0'` e zero sao evento unico no legado, e o campo
  // gravado continua sendo o que foi gravado: a estrutura crua o preserva.
  if (recorrencia === null || vazioComoNoPhp(recorrencia)) {
    return {
      chave,
      recorrencia: null,
      argumentos: argumentos.entradas,
    };
  }

  if (recorrencia.tipo !== 'texto') {
    return null;
  }

  const intervalo = valorDaChaveNomeada(registro, CHAVE_DO_INTERVALO);
  if (intervalo === null || intervalo.tipo !== 'inteiro') {
    return null;
  }

  return {
    chave,
    recorrencia: comoCadeia(recorrencia.valor),
    argumentos: argumentos.entradas,
    intervaloEmSegundos: intervalo.valor,
  };
}

/** O valor de uma chave nomeada do arranjo, ou `null` quando nao ha. */
function valorDaChaveNomeada(valor: ValorPhp, nome: string): ValorPhp | null {
  if (valor.tipo !== 'arranjo') {
    return null;
  }
  const entrada = valor.entradas.find(
    (candidata) => nomeDaChave(candidata.chave) === nome,
  );
  return entrada === undefined ? null : entrada.valor;
}

/**
 * `(array) $valor` do PHP — o que `_upgrade_cron_array()` aplica aos dois niveis
 * (`wp-includes/cron.php:1338` e `:1339`).
 *
 * Arranjo e ele mesmo; nulo e arranjo vazio; **escalar vira arranjo de um
 * elemento, com chave inteira zero**. Medido no oraculo: `(array) 'texto'`
 * produz gancho de chave `0`.
 */
function comoArranjoDoPhp(valor: ValorPhp): readonly EntradaDeArranjo[] {
  if (valor.tipo === 'arranjo') {
    return valor.entradas;
  }
  if (valor.tipo === 'nulo') {
    return [];
  }
  return [{ chave: { tipo: 'inteiro', valor: 0 }, valor }];
}

/**
 * O nivel de um caminho de **escrita**, com a morte que o PHP 8.3 tem ali.
 *
 * Medido no oraculo, caso por caso: ausente, `null` e `false` viram arranjo (o
 * `false` com aviso de descontinuado); texto lanca
 * `TypeError: Cannot access offset of type string on string`; inteiro, decimal e
 * `true` lancam `Error: Cannot use a scalar value as an array`. Lancar e o que
 * reproduz o observavel — em PHP a requisicao morre e **nada e gravado**, e e
 * isso que uma excecao daqui produz na borda.
 */
function comoArranjoParaEscrita(
  valor: ValorPhp | undefined,
): readonly EntradaDeArranjo[] {
  if (valor === undefined) {
    return [];
  }
  switch (valor.tipo) {
    case 'arranjo':
      return valor.entradas;
    case 'nulo':
      return [];
    case 'booleano':
      if (!valor.valor) {
        return [];
      }
      throw new Error('Cannot use a scalar value as an array');
    case 'texto':
      throw new TypeError('Cannot access offset of type string on string');
    case 'inteiro':
    case 'decimal':
      throw new Error('Cannot use a scalar value as an array');
  }
}

/**
 * O nivel de um caminho de **remocao**. Devolve `null` quando o `unset` do PHP
 * nao faz nada ali (nulo e falso), e lanca o que o PHP lanca para escalar.
 *
 * Medido no oraculo, caso por caso: `unset( $c[10]['k'] )` com `$c[10]` inteiro,
 * decimal ou `true` lanca `Error: Cannot unset offset in a non-array variable`;
 * com texto — **inclusive texto vazio** —, `Error: Cannot unset string offsets`;
 * com `null` ou `false`, nao faz nada e o valor **continua** nulo ou falso: o
 * `unset` nao cria arranjo. E por isso que a poda por `empty()` de
 * {@link desagendarNaEstrutura} so e alcancavel para nulo, falso e arranjo vazio.
 */
function comoArranjoParaRemocao(
  valor: ValorPhp,
): readonly EntradaDeArranjo[] | null {
  switch (valor.tipo) {
    case 'arranjo':
      return valor.entradas;
    case 'nulo':
      return null;
    case 'booleano':
      if (!valor.valor) {
        return null;
      }
      throw new Error('Cannot unset offset in a non-array variable');
    case 'texto':
      throw new Error('Cannot unset string offsets');
    case 'inteiro':
    case 'decimal':
      throw new Error('Cannot unset offset in a non-array variable');
  }
}

/**
 * Duas chaves de arranjo sao a mesma chave? Tipo e **bytes**, como no PHP.
 *
 * Em bytes, e nao em texto decodificado: a chave do formato e cadeia de bytes, e
 * duas cadeias ilegiveis diferentes decodificam para o mesmo texto com o caractere
 * de substituicao — o que faria duas chaves distintas passarem por uma.
 */
function mesmaChave(aqui: ChaveDeArranjo, ali: ChaveDeArranjo): boolean {
  if (aqui.tipo === 'inteiro') {
    return ali.tipo === 'inteiro' && aqui.valor === ali.valor;
  }
  if (ali.tipo !== 'texto') {
    return false;
  }
  return mesmosBytes(
    CODIFICADOR_DE_CHAVE.bytes(aqui.valor),
    CODIFICADOR_DE_CHAVE.bytes(ali.valor),
  );
}

const CODIFICADOR_DE_CHAVE = {
  codificador: new TextEncoder(),
  bytes(valor: string | Uint8Array): Uint8Array {
    return typeof valor === 'string' ? this.codificador.encode(valor) : valor;
  },
};

function mesmosBytes(aqui: Uint8Array, ali: Uint8Array): boolean {
  if (aqui.length !== ali.length) {
    return false;
  }
  for (let indice = 0; indice < aqui.length; indice += 1) {
    if (aqui[indice] !== ali[indice]) {
      return false;
    }
  }
  return true;
}

const DECODIFICADOR = new TextDecoder();

function comoCadeia(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : DECODIFICADOR.decode(valor);
}

/**
 * O conteudo de uma chave para a comparacao natural: os **bytes**, quando a chave
 * e de texto, e a representacao decimal, quando e inteira — que e exatamente o
 * que o PHP passa a `strnatcasecmp` ao ordenar as chaves com `uksort`.
 */
function conteudoDaChave(chave: ChaveDeArranjo): string | Uint8Array {
  return chave.tipo === 'inteiro' ? String(chave.valor) : chave.valor;
}

/** O valor de uma chave na lista de entradas, ou `undefined` quando nao ha. */
function valorEm(
  entradas: readonly EntradaDeArranjo[],
  chave: ChaveDeArranjo,
): ValorPhp | undefined {
  return entradas.find((entrada) => mesmaChave(entrada.chave, chave))?.valor;
}

function entradasEm(
  entradas: readonly EntradaDeArranjo[],
  chave: ChaveDeArranjo,
): readonly EntradaDeArranjo[] {
  const valor = valorEm(entradas, chave);
  return valor !== undefined && valor.tipo === 'arranjo' ? valor.entradas : [];
}

/**
 * Atribuicao de chave num arranjo do PHP: chave existente e substituida **no
 * lugar**, chave nova vai para o fim.
 */
function definirEntrada(
  entradas: readonly EntradaDeArranjo[],
  chave: ChaveDeArranjo,
  valor: ValorPhp,
): readonly EntradaDeArranjo[] {
  const indice = entradas.findIndex((entrada) =>
    mesmaChave(entrada.chave, chave),
  );
  if (indice === -1) {
    return [...entradas, { chave, valor }];
  }
  const copia = [...entradas];
  copia[indice] = { chave, valor };
  return copia;
}

/** `unset()` de uma chave: as demais ficam na ordem em que estavam. */
function removerEntrada(
  entradas: readonly EntradaDeArranjo[],
  chave: ChaveDeArranjo,
): readonly EntradaDeArranjo[] {
  return entradas.filter((entrada) => !mesmaChave(entrada.chave, chave));
}
