/**
 * Testes da entrega de **T002** para `plataforma/traducao/`: *"carrega como
 * modulo proprio, com as portas declaradas e nenhuma regra implementada"*.
 *
 * Nao sao os testes de US-4 — esses sao **T010**, um por caso de
 * `backlog/tests.md` (UT-166-1 a UT-166-6). Aqui se afirma so o que T002
 * entrega, mais as duas invariantes de sempre, que neste modulo tem nome e
 * sobrenome:
 *
 * 1. **estado de modulo** (`EXT-CONTEXTO`, BR-MIGRAR-105) — o idioma e **por
 *    conta** (`wp-includes/l10n.php:94`), e catalogo guardado como estado de
 *    modulo entrega a uma pessoa o idioma da outra;
 * 2. **trabalho no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106) — no legado a
 *    carga do catalogo tem hora marcada (`:726`) e, desde a 4.6, carga tardia
 *    (`:1483`).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarCatalogoQueRegistra,
  criarModuloDeTraducao,
  type PedidoDeTraducao,
} from './index.js';

const BYTES: Uint8Array = new Uint8Array([0xde, 0x12, 0x04, 0x95]);

test('o modulo carrega com a porta recebida por argumento', () => {
  const catalogo = criarCatalogoQueRegistra();
  const modulo = criarModuloDeTraducao({ catalogo: catalogo.porta });

  assert.equal(modulo.nome, 'traducao');
  assert.equal(modulo.portas.catalogo, catalogo.porta);
});

test('compor o modulo nao le catalogo nenhum', () => {
  const catalogo = criarCatalogoQueRegistra();
  criarModuloDeTraducao({ catalogo: catalogo.porta });

  assert.deepEqual(catalogo.leituras, []);
});

test('duas composicoes nao se enxergam: nao ha estado de modulo', () => {
  const doPainel = criarCatalogoQueRegistra();
  const doSite = criarCatalogoQueRegistra();
  doPainel.programar('default', 'pt_BR', BYTES);

  const primeiro = criarModuloDeTraducao({ catalogo: doPainel.porta });
  const segundo = criarModuloDeTraducao({ catalogo: doSite.porta });

  assert.deepEqual(primeiro.portas.catalogo.ler('default', 'pt_BR'), BYTES);
  assert.equal(segundo.portas.catalogo.ler('default', 'pt_BR'), null);
  assert.deepEqual(doSite.leituras, [{ dominio: 'default', idioma: 'pt_BR' }]);
});

test('catalogo ausente devolve null, que e o caso de fabrica e nao falha', () => {
  const catalogo = criarCatalogoQueRegistra();

  assert.equal(catalogo.porta.ler('default', 'en_US'), null);
  assert.deepEqual(catalogo.leituras, [
    { dominio: 'default', idioma: 'en_US' },
  ]);
});

test('a leitura registra o par dominio/idioma pedido, na ordem', () => {
  const catalogo = criarCatalogoQueRegistra();

  catalogo.porta.ler('default', 'pt_BR');
  catalogo.porta.ler('akismet', 'pt_BR');

  assert.deepEqual(catalogo.leituras, [
    { dominio: 'default', idioma: 'pt_BR' },
    { dominio: 'akismet', idioma: 'pt_BR' },
  ]);
});

test('as quatro formas de pedido do legado estao declaradas', () => {
  const pedidos: PedidoDeTraducao[] = [
    { forma: 'texto', texto: 'Posts', dominio: 'default' },
    {
      forma: 'com-contexto',
      texto: 'Posts',
      contexto: 'post type general name',
      dominio: 'default',
    },
    {
      forma: 'com-plural',
      singular: '%s post',
      plural: '%s posts',
      numero: 2,
      dominio: 'default',
    },
    {
      forma: 'com-plural-e-contexto',
      singular: '%s post',
      plural: '%s posts',
      numero: 2,
      contexto: 'post type general name',
      dominio: 'default',
    },
  ];

  assert.deepEqual(
    pedidos.map((pedido) => pedido.forma),
    ['texto', 'com-contexto', 'com-plural', 'com-plural-e-contexto'],
  );
});

test('a superficie do modulo: a porta e o tradutor por requisicao (T009)', () => {
  const catalogo = criarCatalogoQueRegistra();
  const modulo = criarModuloDeTraducao({ catalogo: catalogo.porta }) as
    unknown as Record<string, unknown>;

  assert.deepEqual(Object.keys(modulo).sort(), ['criarTradutor', 'nome', 'portas']);
});

test('criar o tradutor nao le catalogo nenhum', () => {
  const catalogo = criarCatalogoQueRegistra();
  const modulo = criarModuloDeTraducao({ catalogo: catalogo.porta });
  modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.deepEqual(catalogo.leituras, []);
});
