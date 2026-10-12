/**
 * Testes da entrega de T001 — *"o modulo carrega com as portas de dados, de
 * relogio, de cache e de cliente externo declaradas, e a fila existe como dado
 * inspecionavel e vazio"* — e da superficie que **T002** acrescenta: a trava em
 * vigor e o armazenamento das duas linhas de opcao. O que T002 entrega de
 * comportamento e afirmado onde ele mora: `armazenamento/armazenamento.test.ts`,
 * `fila/estrutura-gravada.test.ts`, `fila/trava-do-disparo.test.ts`,
 * `fila/comparacao-natural.test.ts` e `configuracao/trava-da-fila.test.ts`.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008, T010, T012
 * e T014 de `tasks.md`, um por caso de `backlog/tests.md`, e os tres primeiros
 * nao comecam antes de a decisao humana do conflito existir. Aqui se afirma so o
 * que T001 entrega, mais as invariantes que um esqueleto pode quebrar em
 * silencio: estado de modulo (`EXT-CONTEXTO`), trabalho no carregamento
 * (`EXT-ORDEM`) e — nesta feature acima de tudo — **nao disparar nada**.
 *
 * A forma da fila e o congelamento dela estao em `fila/fila-agendada.test.ts`,
 * onde o dado mora.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FILA_VAZIA,
  criarModuloDeTrabalhoAgendado,
  type Consulta,
  type PedidoDeDisparo,
  type PortaDeCache,
  type PortaDeClienteExterno,
  type PortaDeDados,
  type PortaDeRelogio,
  type PortasDeTrabalhoAgendado,
  type ResultadoDeEscrita,
} from './index.js';

/** Um toque no cache, com os argumentos que o legado passa. */
interface ToqueDeCache {
  readonly chave: string;
  readonly grupo: string;
  readonly forcar?: boolean;
  readonly valor?: string;
  readonly expiracaoEmSegundos?: number;
}

/**
 * Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda.
 *
 * As portas falsas **registram comando** em vez de simular banco, cache ou rede:
 * e assim que se afirma o caso em que o legado nao emite comando nenhum, que e
 * exatamente o caso de T001.
 */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  leituraDeCache: ToqueDeCache[];
  escritaDeCache: ToqueDeCache[];
  remocaoDeCache: ToqueDeCache[];
  disparos: PedidoDeDisparo[];
  relogioEmSegundos: number;
  relogioFracionario: number;
}

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  cacheExterno = false,
): { portas: PortasDeTrabalhoAgendado; toques: Toques } {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    leituraDeCache: [],
    escritaDeCache: [],
    remocaoDeCache: [],
    disparos: [],
    relogioEmSegundos: 0,
    relogioFracionario: 0,
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
      toques.relogioEmSegundos += 1;
      return 0;
    },
    agoraEmSegundosFracionarios() {
      toques.relogioFracionario += 1;
      return 0;
    },
  };

  const cache: PortaDeCache = {
    externo: cacheExterno,
    obter(chave, grupo, forcar) {
      toques.leituraDeCache.push({ chave, grupo, forcar });
      return { encontrado: false };
    },
    gravar(chave, valor, grupo, expiracaoEmSegundos) {
      toques.escritaDeCache.push({ chave, grupo, valor, expiracaoEmSegundos });
    },
    remover(chave, grupo) {
      toques.remocaoDeCache.push({ chave, grupo });
    },
  };

  const clienteExterno: PortaDeClienteExterno = {
    disparar(pedido) {
      toques.disparos.push(pedido);
      return { emitido: true };
    },
  };

  return {
    portas: { dados, relogio, cache, clienteExterno },
    toques,
  };
}

test('o modulo carrega com as quatro portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeTrabalhoAgendado(portas);

  assert.equal(modulo.nome, 'trabalho-agendado');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.relogio, portas.relogio);
  assert.equal(modulo.portas.cache, portas.cache);
  assert.equal(modulo.portas.clienteExterno, portas.clienteExterno);
});

test('a superficie do modulo tem exatamente o que as tarefas fechadas entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeTrabalhoAgendado(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao".
  //
  // T001: as quatro portas. T002: a trava em vigor e o armazenamento das duas
  // linhas de opcao — e **nenhuma operacao de historia**: o armazenamento le e
  // grava dado, e nao decide autorizacao nenhuma. As seis operacoes que a tabela
  // *Contratos* de `plan.md` nomeia entram nas tarefas delas, com a autorizacao
  // declarada na interface do modulo — inclusive a de avancar a fila, que UC-39
  // declara como NENHUMA ("o endpoint da fila e publico e nao autenticado; o
  // unico freio e uma trava de tempo de 60 segundos"), e que o P4 manda escrever
  // justamente por isso.
  //
  // O campo `fila` que T001 publicou saiu aqui, e foi T001 que escreveu a
  // substituicao: "T002 traz a leitura e a gravacao pela porta de dados, e e
  // esperado que a operacao de leitura substitua este campo quando chegar". Ele
  // nao podia virar a fila lida sem tocar o banco no carregamento, que e o que o
  // teste de `EXT-ORDEM` abaixo proibe.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'armazenamento',
    'nome',
    'portas',
    'travaDaFila',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeTrabalhoAgendado(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.leituraDeCache, []);
  assert.deepEqual(toques.escritaDeCache, []);
  assert.deepEqual(toques.remocaoDeCache, []);
  assert.equal(toques.relogioEmSegundos, 0);
  assert.equal(toques.relogioFracionario, 0);
});

test('🔴 compor o modulo nao dispara nada: o gatilho e o conflito aberto desta feature', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeTrabalhoAgendado(portas);

  // Se o esqueleto emitisse o disparo ao ser composto, ele teria DECIDIDO o
  // conflito que `spec.md` registra em aberto: CA-1.2 exige que o gatilho NAO
  // seja a requisicao do proprio site para si mesmo, e a resposta 10 de
  // `questions.md` manda manter exatamente isso. A constituicao poe "resolver um
  // dos conflitos entre card `wont` e resposta humana" na tabela do que exige
  // decisao humana, e `tasks.md` manda nao comecar as tarefas de REQ-122,
  // REQ-124 e REQ-125 antes dela.
  //
  // Este teste existe para que a escolha continue de quem decide, e nao de quem
  // importou o modulo. Ver `portas/porta-de-cliente-externo.ts`.
  assert.deepEqual(toques.disparos, []);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_7_');

  const moduloA = criarModuloDeTrabalhoAgendado(primeira.portas);
  const moduloB = criarModuloDeTrabalhoAgendado(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_7_');

  // A tabela de opcoes e de escopo POR SITE, logo cada site da rede tem a sua
  // fila e a sua trava: se o modulo guardasse a porta em estado de modulo, o
  // disparo de um site avancaria a fila do outro.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('a fila do modulo existe, e esta vazia (T001) — agora lida da opcao (T002)', () => {
  const { portas, toques } = portasDeTeste();

  const modulo = criarModuloDeTrabalhoAgendado(portas);

  // A porta falsa deste arquivo nao devolve linha nenhuma, que e a instalacao em
  // que nada foi agendado: `_get_cron_array()` devolve `array()` quando a opcao
  // nao existe (`wp-includes/cron.php:1262`-`1265`).
  const leitura = modulo.armazenamento.fila.obter();

  assert.deepEqual(leitura.fila, FILA_VAZIA);
  assert.equal(leitura.fila.length, 0);
  assert.ok(Object.isFrozen(FILA_VAZIA));

  // E e LEITURA, nao campo: o comando sai agora, e nao no carregamento. A linha
  // consultada e a `cron` da tabela de opcoes deste site.
  assert.equal(toques.selecionar.length, 1);
  assert.deepEqual(toques.selecionar[0]?.parametros, ['cron']);
  assert.deepEqual(toques.escrever, []);
});

test('o cache informa se e externo, e o modulo nao decide isso', () => {
  // `wp_using_ext_object_cache()` (`wp-includes/load.php:810`) escolhe, em
  // `get_transient()` e em `_get_cron_lock()`, entre o cache e a tabela de
  // opcoes. REQ-165 — se o cache nasce persistente — esta `bloqueado`, e
  // `plan.md` registra que ninguem decidiu. O fato chega pela porta; nenhum
  // codigo deste modulo o define.
  const semCacheExterno = portasDeTeste('wp_', false);
  const comCacheExterno = portasDeTeste('wp_', true);

  assert.equal(
    criarModuloDeTrabalhoAgendado(semCacheExterno.portas).portas.cache.externo,
    false,
  );
  assert.equal(
    criarModuloDeTrabalhoAgendado(comCacheExterno.portas).portas.cache.externo,
    true,
  );
});

test('o disparo devolve a falha como valor, sem lancar (P7, AD-07)', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeTrabalhoAgendado(portas);

  // No legado `spawn_cron()` devolve `! is_wp_error( $result )`
  // (`wp-includes/cron.php:1001`) e **nada mais**: nem codigo, nem corpo, nem
  // cabecalho. O resultado nao carrega resposta porque, com `blocking` falso, nao
  // existe resposta — e e essa ausencia que impede o alvo de "acertar demais"
  // (AD-07). O modulo entrega a porta sem envolve-la: nada entre o chamador e a
  // borda pode transformar a falha em excecao.
  const resultado = modulo.portas.clienteExterno.disparar({
    url: 'http://exemplo.invalido/wp-cron.php?doing_wp_cron=0',
    metodo: 'POST',
    tempoLimiteEmSegundos: 0.01,
    bloqueante: false,
    verificarCertificado: false,
  });

  assert.equal(resultado.emitido, true);
  assert.ok(!('resposta' in resultado));
});

test('a trava em vigor e a de fabrica, e a composicao e o ponto que a altera (T002, P6)', () => {
  const { portas } = portasDeTeste();

  // `WP_CRON_LOCK_TIMEOUT` e `MINUTE_IN_SECONDS`
  // (`wp-includes/default-constants.php:399` e `:158`), e os dez minutos sao os
  // `10 * MINUTE_IN_SECONDS` de `wp-includes/cron.php:917`. No legado as duas
  // coisas se alteram redefinindo constante ANTES do arranque, logo o ponto
  // equivalente no alvo e o argumento da composicao.
  assert.deepEqual(criarModuloDeTrabalhoAgendado(portas).travaDaFila, {
    tempoLimiteEmSegundos: 60,
    descarteDoAdiantamentoEmSegundos: 600,
  });

  const comOutraTrava = criarModuloDeTrabalhoAgendado(portas, {
    travaDaFila: {
      tempoLimiteEmSegundos: 120,
      descarteDoAdiantamentoEmSegundos: 600,
    },
  });
  assert.equal(comOutraTrava.travaDaFila.tempoLimiteEmSegundos, 120);
});

test('o armazenamento do modulo tem as duas moradas desta feature, e so elas', () => {
  const { portas } = portasDeTeste();

  const { armazenamento } = criarModuloDeTrabalhoAgendado(portas);

  // Duas linhas da tabela de opcoes, nenhuma tabela propria: `plan.md` registra
  // que a fila e "uma unica linha de configuracao", e a trava e a outra.
  assert.deepEqual(Object.keys(armazenamento).sort(), ['fila', 'trava']);
});
