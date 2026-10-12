/**
 * Testes da entrega de **T002** para `plataforma/sanitizacao/`: *"carrega como
 * modulo proprio, com as portas declaradas e nenhuma regra implementada"* — e
 * aqui *"as portas declaradas"* e **nenhuma**, com a razao escrita em
 * `./index.ts`.
 *
 * Nao sao os testes de US-5 — esses sao **T012**, um por caso de
 * `backlog/tests.md` (UT-167-1 a UT-167-5). Aqui se afirma o que T002 entrega:
 * que o modulo carrega sem borda e sem estado, e que as formas das duas metades
 * existem com os campos que CA-5.1 e CA-5.3 nomeiam.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeSanitizacao,
  type ContextoDeSanitizacao,
  type ResultadoDeAnalise,
} from './index.js';

test('o modulo carrega sem porta e sem argumento', () => {
  const modulo = criarModuloDeSanitizacao();

  assert.equal(modulo.nome, 'sanitizacao');
  assert.deepEqual(
    Object.keys(modulo as unknown as Record<string, unknown>),
    ['nome'],
  );
});

test('duas composicoes sao independentes: nao ha estado de modulo', () => {
  const primeiro = criarModuloDeSanitizacao();
  const segundo = criarModuloDeSanitizacao();

  assert.notEqual(primeiro, segundo);
  assert.deepEqual(primeiro, segundo);
});

test('o resultado da analise devolve a marcacao como entrou (CA-5.3)', () => {
  const marcacao = '<p>um paragrafo <em>sem fechar';
  const resultado: ResultadoDeAnalise = { marcacao, condicoes: [] };

  assert.equal(resultado.marcacao, marcacao);
  // Lista vazia e afirmacao: "nao encontrei condicao nenhuma".
  assert.deepEqual(resultado.condicoes, []);
});

test('a condicao de erro carrega codigo e posicao em bytes (CA-5.1)', () => {
  const resultado: ResultadoDeAnalise = {
    marcacao: '<p>um paragrafo <em>sem fechar',
    condicoes: [
      { codigo: 'etiqueta-sem-fechamento', posicao: { inicio: 16, tamanho: 4 } },
    ],
  };

  const condicao = resultado.condicoes[0];
  assert.equal(condicao?.codigo, 'etiqueta-sem-fechamento');
  assert.equal(condicao?.posicao.inicio, 16);
  assert.equal(condicao?.posicao.tamanho, 4);
});

test('o contexto de sanitizacao tem os tres campos de wp_kses, e nenhuma capacidade', () => {
  const contexto: ContextoDeSanitizacao = {
    contexto: 'post',
    lista: { a: { href: true }, em: {} },
    protocolos: ['http', 'https'],
  };

  assert.equal(contexto.contexto, 'post');
  assert.equal(contexto.lista['a']?.['href'], true);
  assert.deepEqual(contexto.protocolos, ['http', 'https']);
  // Quem tem `unfiltered_html` nao chega aqui: no legado os filtros nem sao
  // instalados (`wp-includes/kses.php:2609`). Logo nao ha campo de capacidade.
  assert.equal(
    (contexto as unknown as Record<string, unknown>)['capacidade'],
    undefined,
  );
});
