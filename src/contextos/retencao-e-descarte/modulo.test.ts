/**
 * Testes da entrega de T001: *"o modulo carrega com as portas de dados, de
 * relogio e de fila agendada declaradas, e o prazo de retencao lido de um ponto de
 * configuracao nomeado com o valor de fabrica do legado"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o que
 * T001 entrega, mais as duas invariantes de arquitetura que um esqueleto pode
 * quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e trabalho no
 * carregamento (`EXT-ORDEM`).
 *
 * A borda do prazo — o valor de fabrica e o efeito de desliga-lo — esta em
 * `configuracao/prazo-de-retencao.test.ts`, onde o numero mora.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  criarModuloDeRetencaoEDescarte,
  type Consulta,
  type EventoRecorrente,
  type PortaDeDados,
  type PortaDeFilaAgendada,
  type PortaDeRelogio,
  type PortasDeRetencaoEDescarte,
  type ResultadoDeAgendamento,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  agendar: EventoRecorrente[];
  consultaDeFila: string[];
  relogio: number;
}

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  resultadoDeAgendamento: ResultadoDeAgendamento = { agendado: true },
): { portas: PortasDeRetencaoEDescarte; toques: Toques } {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    agendar: [],
    consultaDeFila: [],
    relogio: 0,
  };

  const dados: PortaDeDados = {
    prefixoDeTabela,
    selecionar(consulta) {
      toques.selecionar.push(consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      toques.escrever.push(consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      toques.relogio += 1;
      return 0;
    },
  };

  const filaAgendada: PortaDeFilaAgendada = {
    proximaOcorrencia(gancho) {
      toques.consultaDeFila.push(gancho);
      return null;
    },
    agendarRecorrente(evento) {
      toques.agendar.push(evento);
      return resultadoDeAgendamento;
    },
  };

  return { portas: { dados, relogio, filaAgendada }, toques };
}

test('o modulo carrega com as tres portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeRetencaoEDescarte(portas);

  assert.equal(modulo.nome, 'retencao-e-descarte');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.relogio, portas.relogio);
  assert.equal(modulo.portas.filaAgendada, portas.filaAgendada);
});

test('a superficie do modulo tem exatamente o que as tarefas fechadas entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeRetencaoEDescarte(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao".
  //
  // T001: nenhuma operacao — as tres portas e o prazo de retencao, que e valor e
  // nao operacao. As quatro operacoes que a tabela *Contratos* de `plan.md`
  // nomeia (descartar, restaurar, apagar em definitivo, coletar) entram em T003,
  // T007, T017 e T011, cada uma com a permissao declarada na interface do modulo
  // — inclusive a da coleta, que UC-11 declara como NENHUMA ("o prazo e a
  // autorizacao"), e que o P4 manda escrever justamente por isso.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'nome',
    'portas',
    'prazoDeRetencao',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeRetencaoEDescarte(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.agendar, []);
  assert.deepEqual(toques.consultaDeFila, []);
  assert.equal(toques.relogio, 0);
});

test('compor o modulo nao agenda nada: quem registra o evento e a tarefa dele', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeRetencaoEDescarte(portas);

  // Se o esqueleto agendasse a coleta ao ser composto, ele teria DECIDIDO o
  // conflito que `spec.md` registra em aberto entre CA-5.1 e a resposta 10 — e a
  // constituicao poe essa escolha na tabela do que exige decisao humana. O teste
  // existe para que a decisao continue de quem decide, e nao de quem importou o
  // modulo. Ver a secao do conflito em `portas/porta-de-fila-agendada.ts`.
  assert.deepEqual(toques.agendar, []);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_7_');

  const moduloA = criarModuloDeRetencaoEDescarte(primeira.portas);
  const moduloB = criarModuloDeRetencaoEDescarte(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_7_');

  // Numa rede o identificador do site entra DENTRO do nome da tabela
  // (`{p}7_posts`, `target_data_model.md`): se o modulo guardasse a porta em
  // estado de modulo, a coleta de um site apagaria conteudo do outro.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('o prazo de retencao vem do ponto de configuracao, com o valor de fabrica do legado', () => {
  const { portas } = portasDeTeste();

  const deFabrica = criarModuloDeRetencaoEDescarte(portas);

  assert.deepEqual(deFabrica.prazoDeRetencao, PRAZO_DE_RETENCAO_DE_FABRICA);
  assert.equal(deFabrica.prazoDeRetencao.diasNaLixeira, 30);

  // O ponto que o altera e a composicao, que e o equivalente do `define()` em
  // `wp-config.php`: no legado `EMPTY_TRASH_DAYS` nao e opcao nem ponto de
  // extensao. Ver `configuracao/prazo-de-retencao.ts`.
  const configurado = criarModuloDeRetencaoEDescarte(portas, {
    prazoDeRetencao: { diasNaLixeira: 7 },
  });

  assert.equal(configurado.prazoDeRetencao.diasNaLixeira, 7);
  // E trocar o prazo de uma composicao nao mexe na outra.
  assert.equal(deFabrica.prazoDeRetencao.diasNaLixeira, 30);
});

test('a porta de fila devolve a falha como valor, sem lancar (P7)', () => {
  const { portas } = portasDeTeste('wp_', {
    agendado: false,
    motivo: 'evento duplicado',
  });

  const modulo = criarModuloDeRetencaoEDescarte(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e a fila pode
  // transformar este estado em excecao. No legado `wp_schedule_event()` devolve
  // `false` e os dois chamadores desta feature ignoram o retorno — o silencio e
  // o comportamento a preservar.
  const resultado = modulo.portas.filaAgendada.agendarRecorrente({
    gancho: 'wp_scheduled_delete',
    primeiroDisparoEmSegundos: 0,
    recorrencia: 'daily',
  });

  assert.equal(resultado.agendado, false);
  assert.equal(
    resultado.agendado === false ? resultado.motivo : null,
    'evento duplicado',
  );
});

test('a fila responde "nao agendado" como null, que e o `false` do legado', () => {
  const { portas, toques } = portasDeTeste();

  const modulo = criarModuloDeRetencaoEDescarte(portas);

  // Sem esta leitura, o cenario critico de PT-004 — "nenhuma das duas tem a
  // tarefa de coleta registrada na fila" — nao e uma afirmacao que se possa
  // fazer.
  assert.equal(
    modulo.portas.filaAgendada.proximaOcorrencia('wp_scheduled_delete'),
    null,
  );
  assert.deepEqual(toques.consultaDeFila, ['wp_scheduled_delete']);
});
