/**
 * A fila como dado: o que T001 afirma sobre ela.
 *
 * *"a fila existe como dado inspecionavel e vazio"* —
 * `.specify/specs/011-trabalho-agendado/tasks.md`, T001.
 *
 * Nao sao os testes de nenhuma historia: os de US-1 sao **T004**, um por caso de
 * `backlog/tests.md`, e nao comecam antes de a decisao humana do conflito
 * existir. Aqui se afirma a forma do dado, a fila vazia e o congelamento dela.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { texto } from '../../../plataforma/serializacao/index.js';
import {
  FILA_VAZIA,
  type FilaAgendada,
  type OcorrenciaNaFila,
} from './index.js';

test('a fila nasce vazia', () => {
  assert.deepEqual(FILA_VAZIA, []);
  assert.equal(FILA_VAZIA.length, 0);
});

test('a fila vazia e congelada: compartilhar valor imutavel nao e estado de modulo', () => {
  // `EXT-CONTEXTO` (BR-MIGRAR-105) poe o estado no escopo da requisicao, e a
  // implicacao 2 do paradigma e a mais grave da travessia: numa runtime
  // longo-viva, estado de modulo compartilhado faz duas requisicoes trocarem de
  // dado entre si. Este valor so pode ser compartilhado porque nao muda.
  assert.ok(Object.isFrozen(FILA_VAZIA));
  assert.throws(() => {
    (FILA_VAZIA as unknown as unknown[]).push({});
  }, TypeError);
});

test('a fila e inspecionavel sem porta nenhuma: instante, gancho, recorrencia e argumentos', () => {
  // CA-1.3 pede a fila consultavel, e isso e **T003**. O que T001 afirma e que o
  // dado permite a consulta: tudo que a fila do legado guarda cabe nesta forma,
  // e nada dela exige banco, cache nem relogio para ser lido.
  //
  // As duas chaves sao as de verdade, para que ninguem copie um valor
  // inventado: `md5( 'a:0:{}' )` para argumento nenhum e
  // `md5( 'a:1:{i:0;s:2:"42";}' )` para o arranjo de um texto.
  const fila: FilaAgendada = [
    {
      instanteEmSegundos: 1_700_000_000,
      ganchos: [
        {
          gancho: 'wp_scheduled_delete',
          ocorrencias: [
            {
              chave: '40cd750bba9870f18aada2478b24840a',
              recorrencia: 'daily',
              argumentos: [],
              intervaloEmSegundos: 86_400,
            },
          ],
        },
      ],
    },
    {
      instanteEmSegundos: 1_700_000_060,
      ganchos: [
        {
          gancho: 'publish_future_post',
          ocorrencias: [
            {
              chave: 'e5061d7e497b6ff66d3e0795e73bc410',
              recorrencia: null,
              argumentos: [
                { chave: { tipo: 'inteiro', valor: 0 }, valor: texto('42') },
              ],
            },
          ],
        },
      ],
    },
  ];

  assert.equal(fila.length, 2);
  assert.deepEqual(
    fila.map((instante) => instante.instanteEmSegundos),
    [1_700_000_000, 1_700_000_060],
  );
  assert.deepEqual(
    fila.flatMap((instante) => instante.ganchos.map((g) => g.gancho)),
    ['wp_scheduled_delete', 'publish_future_post'],
  );
});

test('a ordem dos instantes e dado, nao consequencia da leitura', () => {
  // No legado a estrutura e reordenada na INSERCAO, com `uksort( $crons,
  // 'strnatcasecmp' )` (`wp-includes/cron.php:206` e `:328`), e e nessa ordem que
  // ela sai dos bytes da opcao. PT-005 cobra *"a ordem das tarefas dentro da
  // estrutura e a mesma nas duas"*. Uma lista preserva a ordem que recebeu; um
  // dicionario deste runtime reordenaria chave numerica por conta propria e
  // esconderia exatamente o que ha para conferir.
  //
  // T001 nao ordena nada: afirma que o dado carrega a ordem. Ordenar na insercao
  // e de T002.
  const foraDeOrdem: FilaAgendada = [
    { instanteEmSegundos: 20, ganchos: [] },
    { instanteEmSegundos: 10, ganchos: [] },
  ];

  assert.deepEqual(
    foraDeOrdem.map((instante) => instante.instanteEmSegundos),
    [20, 10],
  );
});

test('evento unico e evento recorrente sao formas diferentes, como o registro gravado', () => {
  // O evento unico grava duas chaves — `schedule` (falso) e `args`
  // (`wp-includes/cron.php:202`-`205`) — e o recorrente grava tres, com
  // `interval` (`:323`-`327`). A documentacao do legado diz o mesmo em palavras:
  // o intervalo *"so esta presente em evento recorrente"* (`:96`). A ausencia da
  // chave e diferente de uma chave nula nos bytes gravados.
  const unico: OcorrenciaNaFila = {
    chave: '40cd750bba9870f18aada2478b24840a',
    recorrencia: null,
    argumentos: [],
  };
  const recorrente: OcorrenciaNaFila = {
    chave: '40cd750bba9870f18aada2478b24840a',
    recorrencia: 'hourly',
    argumentos: [],
    intervaloEmSegundos: 3_600,
  };

  assert.ok(!('intervaloEmSegundos' in unico));
  assert.equal(
    recorrente.recorrencia === null ? null : recorrente.intervaloEmSegundos,
    3_600,
  );
});

test('a identidade da ocorrencia preserva as chaves do arranjo de argumentos', () => {
  // A chave e `md5( serialize( $args ) )` (`wp-includes/cron.php:132` e `:319`),
  // e `serialize()` guarda as chaves do arranjo. A documentacao de
  // `wp_schedule_event()` diz que *"as chaves do arranjo sao ignoradas"*
  // (`:239`), e isso vale para o DESPACHO — `do_action_ref_array( $hook,
  // $v['args'] )` (`wp-cron.php:191`) —, nao para a identidade:
  // `array( 'a' => 1 )` e `array( 1 )` sao eventos diferentes na fila.
  //
  // Guardar so os valores apagaria a diferenca. O calculo da chave e de T002,
  // com o codec de `plataforma/serializacao`; o que T001 garante e que o dado
  // necessario para calcula-la esta inteiro.
  const porNome: OcorrenciaNaFila = {
    chave: 'ignorada-neste-teste',
    recorrencia: null,
    argumentos: [
      { chave: { tipo: 'texto', valor: 'a' }, valor: texto('1') },
    ],
  };
  const porPosicao: OcorrenciaNaFila = {
    chave: 'ignorada-neste-teste',
    recorrencia: null,
    argumentos: [
      { chave: { tipo: 'inteiro', valor: 0 }, valor: texto('1') },
    ],
  };

  assert.notDeepEqual(porNome.argumentos, porPosicao.argumentos);
});
