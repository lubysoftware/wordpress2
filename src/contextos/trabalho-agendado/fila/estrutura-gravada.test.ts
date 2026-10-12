/**
 * A estrutura gravada da fila: os bytes, a ordem, a chave, a versao e as duas
 * operacoes sobre ela. Entrega de **T002**.
 *
 * **Todo vetor de bytes desta suite foi medido no oraculo**, e nao escrito a
 * mao: o oraculo executavel da resposta 16 (`scripts/oraculo`, PHP 8.3) recebeu o
 * mesmo arranjo que `wp_schedule_single_event()`, `wp_schedule_event()` e
 * `wp_unschedule_event()` montam, e devolveu o `serialize()` dele. E o que
 * `CLAUDE.md` chama de *"vetor de paridade se transcreve"*, com a diferenca que a
 * resposta 16 compra: aqui ele foi **medido**.
 *
 * O cenario que PT-005 cobra — *"a fila e uma lista em opcao, lida e escrita como
 * o legado a le e escreve ... quando uma tarefa e acrescentada e outra removida,
 * o valor gravado na opcao e identico byte a byte nas duas, e a ordem das tarefas
 * dentro da estrutura e a mesma nas duas"* — e o teste *acrescentar e remover
 * produz os bytes do oraculo* desta pagina.
 *
 * Nao sao os testes de nenhuma historia: os de US-1 sao **T004**, e nao comecam
 * antes de a decisao humana do conflito existir.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  booleano,
  inteiro,
  lista,
  serializarComoTexto,
  talvezDesserializar,
  texto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  ESTRUTURA_VAZIA,
  VERSAO_DA_FILA,
  agendarNaEstrutura,
  chaveDaOcorrencia,
  converterEstruturaDaVersao1,
  desagendarNaEstrutura,
  estruturaDaFila,
  estruturaSemVersao,
  filaDaEstrutura,
  ordenarInstantes,
  valorDaEstruturaGravada,
  valorDaOcorrencia,
  vazioComoNoPhp,
  versaoNaEstrutura,
  type EstruturaDaFila,
} from './estrutura-gravada.js';

/** A chave de argumento nenhum: `md5( 'a:0:{}' )`. */
const CHAVE_SEM_ARGUMENTOS = '40cd750bba9870f18aada2478b24840a';
/** A chave de `array( '42' )`: `md5( 'a:1:{i:0;s:2:"42";}' )`. */
const CHAVE_DE_42 = 'e5061d7e497b6ff66d3e0795e73bc410';

/**
 * A fila de duas tarefas, medida no oraculo — a coleta diaria da lixeira as
 * 1700000000 e uma publicacao agendada, unica, as 1700000060.
 */
const DUAS_TAREFAS =
  'a:3:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
  'i:1700000060;a:1:{s:19:"publish_future_post";a:1:{s:32:"e5061d7e497b6ff66d3e0795e73bc410";a:2:{s:8:"schedule";b:0;s:4:"args";a:1:{i:0;s:2:"42";}}}}' +
  's:7:"version";i:2;}';

/** A estrutura de versao 1 — sem o nivel da chave —, medida no oraculo. */
const VERSAO_1 =
  'a:1:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}';

/** A mesma, depois de `_upgrade_cron_array()` e de `_set_cron_array()`. */
const VERSAO_1_CONVERTIDA =
  'a:2:{i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
  's:7:"version";i:2;}';

/** `array( '42' )` como argumentos: uma entrada, chave inteira zero. */
const ARGUMENTOS_DE_42: readonly EntradaDeArranjo[] = [
  { chave: { tipo: 'inteiro', valor: 0 }, valor: texto('42') },
];

/** As entradas de um arranjo, sem casto: o teste falha se nao for arranjo. */
function entradasDe(valor: ValorPhp): readonly EntradaDeArranjo[] {
  if (valor.tipo !== 'arranjo') {
    throw new Error(`esperava arranjo, veio ${valor.tipo}`);
  }
  return valor.entradas;
}

/** A estrutura lida de um valor serializado, sem o marcador de versao. */
function estruturaDe(serializado: string): EstruturaDaFila {
  return estruturaSemVersao(entradasDe(talvezDesserializar(serializado)));
}

function bytesGravados(estrutura: EstruturaDaFila): string {
  return serializarComoTexto(valorDaEstruturaGravada(estrutura));
}

test('a chave da ocorrencia e `md5( serialize( args ) )`', () => {
  // `wp-includes/cron.php:132` e `:319`. As duas chaves foram medidas no oraculo.
  assert.equal(chaveDaOcorrencia([]), CHAVE_SEM_ARGUMENTOS);
  assert.equal(chaveDaOcorrencia(ARGUMENTOS_DE_42), CHAVE_DE_42);

  // A chave do arranjo conta para a identidade, ainda que o despacho a ignore:
  // `array( 'a' => 1 )` e `array( 1 )` sao eventos diferentes na fila.
  assert.notEqual(
    chaveDaOcorrencia(entradasDe(arranjoPorNome([['a', texto('1')]]))),
    chaveDaOcorrencia(entradasDe(lista([texto('1')]))),
  );
});

test('o registro de evento unico grava duas chaves, e o recorrente tres', () => {
  // `wp-includes/cron.php:202`-`205` contra `:323`-`327`, e a ordem e observavel.
  assert.equal(
    serializarComoTexto(valorDaOcorrencia({ recorrencia: null, argumentos: [] })),
    'a:2:{s:8:"schedule";b:0;s:4:"args";a:0:{}}',
  );
  assert.equal(
    serializarComoTexto(
      valorDaOcorrencia({
        recorrencia: 'daily',
        argumentos: [],
        intervaloEmSegundos: 86_400,
      }),
    ),
    'a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}',
  );
});

test('a fila vazia gravada e `a:1:{s:7:"version";i:2;}`, e nao `a:0:{}`', () => {
  // Medido no oraculo. `_set_cron_array()` poe `version = 2` mesmo na fila vazia
  // (`wp-includes/cron.php:1302`), e o marcador vai por ultimo porque no PHP uma
  // chave nova vai para o fim.
  assert.equal(VERSAO_DA_FILA, 2);
  assert.equal(bytesGravados(ESTRUTURA_VAZIA), 'a:1:{s:7:"version";i:2;}');
});

test('a fila de duas tarefas sai nos bytes do oraculo, e a projecao a le inteira', () => {
  const estrutura = estruturaDe(DUAS_TAREFAS);

  // Ida e volta: o que foi lido, regravado, da os mesmos bytes.
  assert.equal(bytesGravados(estrutura), DUAS_TAREFAS);

  const fila = filaDaEstrutura(estrutura);
  assert.deepEqual(
    fila.map((instante) => instante.instanteEmSegundos),
    [1_700_000_000, 1_700_000_060],
  );
  assert.deepEqual(fila[0]?.ganchos[0], {
    gancho: 'wp_scheduled_delete',
    ocorrencias: [
      {
        chave: CHAVE_SEM_ARGUMENTOS,
        recorrencia: 'daily',
        argumentos: [],
        intervaloEmSegundos: 86_400,
      },
    ],
  });
  assert.deepEqual(fila[1]?.ganchos[0]?.ocorrencias[0], {
    chave: CHAVE_DE_42,
    recorrencia: null,
    argumentos: [{ chave: { tipo: 'inteiro', valor: 0 }, valor: texto('42') }],
  });

  // E a volta pela fila tipada da os mesmos bytes: nada se perde no caminho.
  assert.equal(bytesGravados(estruturaDaFila(fila)), DUAS_TAREFAS);
});

test('o marcador de versao sai na leitura e volta na gravacao', () => {
  const lido = entradasDe(talvezDesserializar(DUAS_TAREFAS));

  assert.deepEqual(versaoNaEstrutura(lido), inteiro(2));
  assert.equal(estruturaSemVersao(lido).length, 2);
  // `isset( $cron['version'] )`: marcador com valor nulo NAO conta (`:1271`).
  assert.equal(
    versaoNaEstrutura([
      { chave: { tipo: 'texto', valor: 'version' }, valor: { tipo: 'nulo' } },
    ]),
    null,
  );
});

test('a conversao da versao 1 produz os bytes do oraculo', () => {
  const lido = entradasDe(talvezDesserializar(VERSAO_1));

  assert.equal(versaoNaEstrutura(lido), null);
  assert.equal(bytesGravados(converterEstruturaDaVersao1(lido)), VERSAO_1_CONVERTIDA);
});

test('a conversao da versao 1 reproduz as tres degradacoes medidas no oraculo', () => {
  // `(array) $hooks` em `wp-includes/cron.php:1339`: escalar vira arranjo de um
  // elemento com chave inteira zero, nulo nao gira o laco, e o registro e copiado
  // verbatim com a chave `md5( 'a:0:{}' )` quando nao tem `args`.
  const entrada: EntradaDeArranjo[] = [
    { chave: { tipo: 'inteiro', valor: 1_700_000_000 }, valor: texto('texto') },
    { chave: { tipo: 'inteiro', valor: 1_700_000_060 }, valor: { tipo: 'nulo' } },
    {
      chave: { tipo: 'inteiro', valor: 1_700_000_120 },
      valor: arranjoPorNome([['hook', texto('escalar')]]),
    },
  ];

  assert.equal(
    bytesGravados(converterEstruturaDaVersao1(entrada)),
    'a:3:{i:1700000000;a:1:{i:0;a:1:{s:32:"40cd750bba9870f18aada2478b24840a";s:5:"texto";}}' +
      'i:1700000120;a:1:{s:4:"hook";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";s:7:"escalar";}}' +
      's:7:"version";i:2;}',
  );
});

test('acrescentar e remover produz os bytes do oraculo, e a ordem e a dele (PT-005)', () => {
  const inicial = estruturaDe(DUAS_TAREFAS);

  // Acrescenta um evento unico num instante ANTERIOR aos dois: o `uksort` o leva
  // para a frente (`wp-includes/cron.php:206`).
  const comNovo = agendarNaEstrutura(
    inicial,
    1_699_999_940,
    'wp_privacy_delete_old_export_files',
    { recorrencia: null, argumentos: [] },
  );

  assert.equal(
    bytesGravados(comNovo),
    'a:4:{i:1699999940;a:1:{s:34:"wp_privacy_delete_old_export_files";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:2:{s:8:"schedule";b:0;s:4:"args";a:0:{}}}}' +
      'i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
      'i:1700000060;a:1:{s:19:"publish_future_post";a:1:{s:32:"e5061d7e497b6ff66d3e0795e73bc410";a:2:{s:8:"schedule";b:0;s:4:"args";a:1:{i:0;s:2:"42";}}}}' +
      's:7:"version";i:2;}',
  );

  // Remove o evento unico: o gancho fica vazio e e podado, e o instante tambem
  // (`:542`-`:548`).
  const final = desagendarNaEstrutura(
    comNovo,
    1_700_000_060,
    'publish_future_post',
    CHAVE_DE_42,
  );

  assert.equal(
    bytesGravados(final),
    'a:3:{i:1699999940;a:1:{s:34:"wp_privacy_delete_old_export_files";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:2:{s:8:"schedule";b:0;s:4:"args";a:0:{}}}}' +
      'i:1700000000;a:1:{s:19:"wp_scheduled_delete";a:1:{s:32:"40cd750bba9870f18aada2478b24840a";a:3:{s:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;}}}' +
      's:7:"version";i:2;}',
  );
});

test('agendar no mesmo instante e no mesmo gancho substitui a ocorrencia no lugar', () => {
  const inicial = estruturaDe(DUAS_TAREFAS);

  // Mesma chave (argumentos iguais), registro diferente: a posicao nao muda, o
  // valor muda. E o que a atribuicao do PHP faz com uma chave existente.
  const trocada = agendarNaEstrutura(inicial, 1_700_000_000, 'wp_scheduled_delete', {
    recorrencia: 'hourly',
    argumentos: [],
    intervaloEmSegundos: 3_600,
  });

  assert.equal(trocada.length, 2);
  assert.equal(
    bytesGravados(trocada),
    DUAS_TAREFAS.replace(
      's:8:"schedule";s:5:"daily";s:4:"args";a:0:{}s:8:"interval";i:86400;',
      's:8:"schedule";s:6:"hourly";s:4:"args";a:0:{}s:8:"interval";i:3600;',
    ),
  );
});

test('dois ganchos no mesmo instante, e duas ocorrencias no mesmo gancho, nao se ordenam', () => {
  // O legado ordena **so** o nivel externo: ganchos e ocorrencias ficam na ordem
  // em que entraram, e ordena-los mudaria os bytes gravados.
  let estrutura: EstruturaDaFila = ESTRUTURA_VAZIA;
  estrutura = agendarNaEstrutura(estrutura, 1_700_000_000, 'zz_depois', {
    recorrencia: null,
    argumentos: [],
  });
  estrutura = agendarNaEstrutura(estrutura, 1_700_000_000, 'aa_antes', {
    recorrencia: null,
    argumentos: [],
  });
  estrutura = agendarNaEstrutura(estrutura, 1_700_000_000, 'aa_antes', {
    recorrencia: null,
    argumentos: ARGUMENTOS_DE_42,
  });

  const fila = filaDaEstrutura(estrutura);
  assert.deepEqual(
    fila[0]?.ganchos.map((gancho) => gancho.gancho),
    ['zz_depois', 'aa_antes'],
  );
  assert.deepEqual(
    fila[0]?.ganchos[1]?.ocorrencias.map((ocorrencia) => ocorrencia.chave),
    [CHAVE_SEM_ARGUMENTOS, CHAVE_DE_42],
  );
});

test('desagendar o que nao esta na fila nao muda nada', () => {
  const inicial = estruturaDe(DUAS_TAREFAS);

  // Instante que nao existe, gancho que nao existe e chave que nao existe: os
  // tres `unset` do legado nao criam nada, e `_set_cron_array()` recebe o mesmo
  // arranjo — logo `update_option()` nao emite comando (`option.php:923`).
  assert.equal(
    bytesGravados(
      desagendarNaEstrutura(inicial, 1_600_000_000, 'wp_scheduled_delete', CHAVE_SEM_ARGUMENTOS),
    ),
    DUAS_TAREFAS,
  );
  assert.equal(
    bytesGravados(
      desagendarNaEstrutura(inicial, 1_700_000_000, 'gancho_ausente', CHAVE_SEM_ARGUMENTOS),
    ),
    DUAS_TAREFAS,
  );
  assert.equal(
    bytesGravados(
      desagendarNaEstrutura(inicial, 1_700_000_000, 'wp_scheduled_delete', CHAVE_DE_42),
    ),
    DUAS_TAREFAS,
  );
});

test('a poda e por `empty()`: gancho nulo sai mesmo sem nada ter sido tirado dele', () => {
  // `if ( empty( $crons[ $timestamp ][ $hook ] ) )` (`:542`). Medido no oraculo:
  // o `unset` nao faz nada em cima de nulo, e a guarda de `empty()` entao remove
  // o gancho; o instante fica, porque o outro gancho nao esta vazio.
  //
  // Gancho que guarde `''`, `'0'` ou `0` NAO chega nesta poda: o `unset` do nivel
  // de baixo **lanca** antes — tambem medido. E a razao de este teste usar nulo.
  const estrutura: EstruturaDaFila = [
    {
      chave: { tipo: 'inteiro', valor: 1_700_000_000 },
      valor: arranjoPorNome([
        ['vazio', { tipo: 'nulo' }],
        ['cheio', arranjoPorNome([['k', booleano(true)]])],
      ]),
    },
  ];

  const depois = desagendarNaEstrutura(
    estrutura,
    1_700_000_000,
    'vazio',
    CHAVE_SEM_ARGUMENTOS,
  );

  assert.equal(
    serializarComoTexto(valorDaEstruturaGravada(depois)),
    'a:2:{i:1700000000;a:1:{s:5:"cheio";a:1:{s:1:"k";b:1;}}s:7:"version";i:2;}',
  );
});

test('instante com valor nulo desaparece ao desagendar, porque `empty( null )` e verdadeiro', () => {
  // O `unset` nao cria arranjo em cima de nulo (medido no oraculo), e as duas
  // guardas de `empty()` entao removem o instante inteiro.
  const estrutura: EstruturaDaFila = [
    { chave: { tipo: 'inteiro', valor: 1_700_000_000 }, valor: { tipo: 'nulo' } },
  ];

  assert.deepEqual(
    desagendarNaEstrutura(estrutura, 1_700_000_000, 'qualquer', CHAVE_SEM_ARGUMENTOS),
    [],
  );
});

test('nivel ocupado por escalar mata a operacao, como o PHP 8.3 mata', () => {
  // Medido no oraculo: texto lanca `TypeError: Cannot access offset of type
  // string on string`, inteiro lanca `Error: Cannot use a scalar value as an
  // array`. Em PHP a requisicao morre e NADA e gravado — e e isso que uma
  // excecao daqui produz na borda.
  const comTexto: EstruturaDaFila = [
    { chave: { tipo: 'inteiro', valor: 10 }, valor: texto('escalar') },
  ];
  const comInteiro: EstruturaDaFila = [
    { chave: { tipo: 'inteiro', valor: 10 }, valor: inteiro(7) },
  ];
  const ocorrencia = { recorrencia: null, argumentos: [] } as const;

  assert.throws(
    () => agendarNaEstrutura(comTexto, 10, 'h', ocorrencia),
    /Cannot access offset of type string on string/,
  );
  assert.throws(
    () => agendarNaEstrutura(comInteiro, 10, 'h', ocorrencia),
    /Cannot use a scalar value as an array/,
  );
  assert.throws(
    () => desagendarNaEstrutura(comTexto, 10, 'h', CHAVE_SEM_ARGUMENTOS),
    /Cannot unset string offsets/,
  );
});

test('a ordem dos instantes e a de `strnatcasecmp`, inclusive onde ela nao e numerica', () => {
  const estrutura: EstruturaDaFila = [
    { chave: { tipo: 'inteiro', valor: -10 }, valor: { tipo: 'arranjo', entradas: [] } },
    { chave: { tipo: 'inteiro', valor: 100 }, valor: { tipo: 'arranjo', entradas: [] } },
    { chave: { tipo: 'inteiro', valor: -1 }, valor: { tipo: 'arranjo', entradas: [] } },
    { chave: { tipo: 'inteiro', valor: 9 }, valor: { tipo: 'arranjo', entradas: [] } },
  ];

  assert.deepEqual(
    ordenarInstantes(estrutura).map((entrada) =>
      entrada.chave.tipo === 'inteiro' ? entrada.chave.valor : null,
    ),
    [-1, -10, 9, 100],
  );
});

test('a projecao ignora o que nao tem a forma do legado, e a estrutura crua o preserva', () => {
  const estranha: EstruturaDaFila = [
    // Chave de texto: o legado a compara como ela esta, e virar numero seria
    // normalizar.
    { chave: { tipo: 'texto', valor: '05' }, valor: { tipo: 'arranjo', entradas: [] } },
    {
      chave: { tipo: 'inteiro', valor: 1_700_000_000 },
      valor: arranjoPorNome([
        [
          'wp_scheduled_delete',
          arranjoPorNome([
            // Recorrente sem `interval`: a uniao de `OcorrenciaNaFila` pede o par,
            // e inventar intervalo seria inventar numero que o legado nao tem.
            ['a', arranjoPorNome([['schedule', texto('daily')], ['args', { tipo: 'arranjo', entradas: [] }]])],
            // Sem `args`: no legado o despacho ja nao funciona.
            ['b', arranjoPorNome([['schedule', booleano(false)]])],
            // Esta tem a forma, e aparece.
            ['c', arranjoPorNome([['schedule', booleano(false)], ['args', { tipo: 'arranjo', entradas: [] }]])],
          ]),
        ],
      ]),
    },
  ];

  const fila = filaDaEstrutura(estranha);
  assert.equal(fila.length, 1);
  assert.deepEqual(
    fila[0]?.ganchos[0]?.ocorrencias.map((ocorrencia) => ocorrencia.chave),
    ['c'],
  );

  // E nada se perde na regravacao: os bytes voltam inteiros.
  const bytes = bytesGravados(estranha);
  assert.ok(bytes.includes('s:2:"05"'));
  assert.ok(bytes.includes('s:1:"a"'));
  assert.ok(bytes.includes('s:1:"b"'));
});

test('`empty()` do PHP, nos seis valores medidos no oraculo', () => {
  const vazios: (ValorPhp | undefined)[] = [
    undefined,
    { tipo: 'nulo' },
    booleano(false),
    inteiro(0),
    texto(''),
    texto('0'),
    { tipo: 'arranjo', entradas: [] },
  ];
  for (const valor of vazios) {
    assert.equal(vazioComoNoPhp(valor), true);
  }

  assert.equal(vazioComoNoPhp(texto('0.0')), false);
  assert.equal(vazioComoNoPhp(booleano(true)), false);
  assert.equal(vazioComoNoPhp(lista([texto('x')])), false);
});
