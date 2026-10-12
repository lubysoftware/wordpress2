/**
 * Testes da entrega de **T002** para `plataforma/registro-de-operacao/`:
 * *"carrega como modulo proprio, com as portas declaradas e nenhuma regra
 * implementada"*.
 *
 * Nao sao os testes de US-1 — esses sao **T004**, um por caso de
 * `backlog/tests.md` (UT-159-1 a UT-159-8). Aqui se afirma so o que T002
 * entrega, mais as tres invariantes que este esqueleto em particular quebra em
 * silencio:
 *
 * 1. **estado de modulo** (`EXT-CONTEXTO`, BR-MIGRAR-105) — um registro em
 *    memoria de processo acumularia evento de requisicao alheia e, numa rede, de
 *    site alheio;
 * 2. **trabalho no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106);
 * 3. **o `void` de `registrar`** — P7: *"nenhuma ramificacao do codigo testa o
 *    resultado de escrever log"*. E a invariante que faz o acrescimo de registro
 *    continuar sendo acrescimo.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarCanalQueRegistra,
  criarModuloDeRegistroDeOperacao,
  type EventoDeOperacao,
} from './index.js';

const EVENTO: EventoDeOperacao = {
  instante: 1_760_000_000_000,
  origem: 'plataforma/dados',
  severidade: 'critical',
  contexto: { consulta: 'SELECT 1', codigo: 1146 },
};

test('o modulo carrega com a porta recebida por argumento', () => {
  const canal = criarCanalQueRegistra();
  const modulo = criarModuloDeRegistroDeOperacao({ canal: canal.porta });

  assert.equal(modulo.nome, 'registro-de-operacao');
  assert.equal(modulo.portas.canal, canal.porta);
});

test('compor o modulo nao escreve evento nem consulta nada', () => {
  const canal = criarCanalQueRegistra();
  criarModuloDeRegistroDeOperacao({ canal: canal.porta });

  assert.deepEqual(canal.eventos, []);
  assert.deepEqual(canal.recortes, []);
});

test('duas composicoes nao se enxergam: nao ha estado de modulo', () => {
  const primeiroCanal = criarCanalQueRegistra();
  const segundoCanal = criarCanalQueRegistra();

  const primeiro = criarModuloDeRegistroDeOperacao({
    canal: primeiroCanal.porta,
  });
  const segundo = criarModuloDeRegistroDeOperacao({ canal: segundoCanal.porta });

  primeiro.portas.canal.registrar(EVENTO);

  assert.equal(primeiroCanal.eventos.length, 1);
  assert.deepEqual(segundoCanal.eventos, []);
  assert.notEqual(primeiro.portas.canal, segundo.portas.canal);
});

test('registrar nao devolve nada: o registro e so escrita (P7)', () => {
  const canal = criarCanalQueRegistra();

  const devolvido = canal.porta.registrar(EVENTO) as unknown;

  assert.equal(devolvido, undefined);
});

test('o evento registrado carrega os quatro campos de CA-1.1, inteiros', () => {
  const canal = criarCanalQueRegistra();

  canal.porta.registrar(EVENTO);

  const registrado = canal.eventos[0];
  assert.equal(registrado?.instante, 1_760_000_000_000);
  assert.equal(registrado?.origem, 'plataforma/dados');
  assert.equal(registrado?.severidade, 'critical');
  assert.deepEqual(registrado?.contexto, { consulta: 'SELECT 1', codigo: 1146 });
});

test('o recorte pedido chega a borda com os valores pedidos', () => {
  const canal = criarCanalQueRegistra();

  canal.porta.consultar({ de: 1, ate: 2, severidade: 'critical' });

  assert.equal(canal.recortes.length, 1);
  assert.deepEqual(canal.recortes[0], {
    de: 1,
    ate: 2,
    severidade: 'critical',
  });
});

test('o duplo nao filtra: devolve o programado, e lista vazia sem programacao', () => {
  const canal = criarCanalQueRegistra();
  canal.responder([EVENTO]);

  const primeira = canal.porta.consultar({ origem: 'nao-importa' });
  const segunda = canal.porta.consultar({});

  // Primeira: o programado, mesmo com recorte que nao casa — filtrar e CA-1.2,
  // e e o sistema que tem de filtrar, nao o duplo.
  assert.deepEqual(primeira, [EVENTO]);
  // Segunda: nada programado, logo lista vazia — afirmacao, nao omissao.
  assert.deepEqual(segunda, []);
});

test('o modulo nao declara operacao nenhuma em T002', () => {
  const canal = criarCanalQueRegistra();
  const modulo = criarModuloDeRegistroDeOperacao({ canal: canal.porta }) as
    unknown as Record<string, unknown>;

  assert.deepEqual(Object.keys(modulo).sort(), ['nome', 'portas']);
});
