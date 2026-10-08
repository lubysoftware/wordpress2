/**
 * Testes da entrega de T001 — *"o modulo carrega com a porta de dados declarada
 * e os oito contextos de classificacao do nucleo registrados, sem regra
 * implementada"* — e da **composicao** de T002, que acrescenta o armazenamento a
 * superficie do modulo sem acrescentar nenhuma consulta ao carregamento. As tres
 * estruturas em si sao afirmadas em `armazenamento/armazenamento.test.ts` e
 * `armazenamento/esquema.test.ts`.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008, T010 e
 * T012 de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o que
 * T001 entrega, mais as duas invariantes de arquitetura que um esqueleto pode
 * quebrar em silencio: estado de modulo (`EXT-CONTEXTO`, a dimensao **D-A**) e
 * trabalho no carregamento (`EXT-ORDEM`).
 *
 * O registro em si — os oito, a ordem, os defaults e as duas recusas — esta em
 * `registro/registro-de-contextos.test.ts`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeClassificacao,
  type Consulta,
  type PortaDeDados,
  type PortasDeClassificacao,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques na porta, para afirmar que o modulo nao a usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
}

function portasDeTeste(prefixoDeTabela = 'wp_'): {
  portas: PortasDeClassificacao;
  toques: Toques;
} {
  const toques: Toques = { selecionar: [], escrever: [] };

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

  return { portas: { dados }, toques };
}

test('o modulo carrega com a porta de dados declarada', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeClassificacao(portas);

  assert.equal(modulo.nome, 'classificacao');
  assert.equal(modulo.portas.dados, portas.dados);
});

test('o modulo carrega com os oito contextos do nucleo registrados', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeClassificacao(portas);

  assert.equal(modulo.contextos.listar().length, 8);
});

test('nenhuma regra de negocio implementada: a superficie do modulo e so o que T001 e T002 entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeClassificacao(portas);

  // Quando as historias entrarem, esta lista cresce NA TAREFA DELAS. Ela esta
  // aqui para que nenhuma operacao chegue antes da propria tarefa, que e o que o
  // P4 da constituicao cobra: "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". `armazenamento` entrou com T002 e nao e operacao:
  // nao decide nada e nao declara permissao.
  assert.deepEqual(
    Object.keys(modulo).sort(),
    ['armazenamento', 'contextos', 'nome', 'portas'],
  );
});

test('o armazenamento de T002 chega pela composicao, com as tres estruturas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeClassificacao(portas);

  // As tres estruturas da secao *Modelo de dados* do plano, mais a leitura
  // fundida que `AGG-Termo` exige. Nenhuma quarta tabela.
  assert.deepEqual(
    Object.keys(modulo.armazenamento).sort(),
    ['rotulos', 'rotulosNoContexto', 'termos', 'vinculos'],
  );
});

test('criar o modulo nao toca na porta (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeClassificacao(portas);

  // Registrar os oito contextos e trabalho em memoria sobre declaracao em
  // codigo, e compor o armazenamento de T002 monta nome de tabela e nada mais.
  // Se um dia uma declaracao precisar de dado gravado, este teste falha — e e
  // exatamente o aviso que se quer.
  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
});

test('duas composicoes nao compartilham o armazenamento (EXT-CONTEXTO, e o prefixo e dado)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_');

  const moduloA = criarModuloDeClassificacao(primeira.portas);
  const moduloB = criarModuloDeClassificacao(segunda.portas);

  moduloA.armazenamento.rotulos.obterPorId(1);
  moduloB.armazenamento.rotulos.obterPorId(1);

  // O prefixo do site entra no nome da tabela, e a nota 3 de
  // `target_data_model.md` diz por que isso nao e detalhe de conexao: "o
  // prefixo de tabela nao e so configuracao de conexao: ele e dado".
  assert.match(String(primeira.toques.selecionar[0]?.texto), /FROM wp_terms /);
  assert.match(String(segunda.toques.selecionar[0]?.texto), /FROM wp_2_terms /);
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 1);
});

test('duas composicoes nao compartilham a porta (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_');

  const moduloA = criarModuloDeClassificacao(primeira.portas);
  const moduloB = criarModuloDeClassificacao(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('duas composicoes nao compartilham o registro de contextos (D-A de parity_specs.md)', () => {
  const moduloA = criarModuloDeClassificacao(portasDeTeste('wp_').portas);
  const moduloB = criarModuloDeClassificacao(portasDeTeste('wp_2_').portas);

  // A requisicao A tem uma extensao que registra um contexto proprio.
  const registrado = moduloA.contextos.registrar('resenha', {
    tiposDeObjeto: 'post',
  });
  assert.equal(
    typeof registrado === 'object' && 'nome' in registrado
      ? registrado.nome
      : null,
    'resenha',
  );

  // A requisicao B, concorrente, nao o enxerga. No legado as duas dividiriam a
  // mesma `global $wp_taxonomies`.
  assert.equal(moduloA.contextos.existe('resenha'), true);
  assert.equal(moduloB.contextos.existe('resenha'), false);
  assert.equal(moduloA.contextos.listar().length, 9);
  assert.equal(moduloB.contextos.listar().length, 8);
});

test('o registro do modulo e o mesmo objeto entre leituras da mesma composicao', () => {
  const modulo = criarModuloDeClassificacao(portasDeTeste().portas);

  // Nao e um retrato recalculado: a escrita de uma extensao persiste pela
  // requisicao inteira, como persiste no legado.
  modulo.contextos.registrar('resenha', { tiposDeObjeto: 'post' });

  assert.equal(modulo.contextos.existe('resenha'), true);
});
