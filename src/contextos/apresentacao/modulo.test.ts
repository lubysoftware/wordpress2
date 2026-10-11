/**
 * Testes da entrega de **T001**: *"personalizacao, menus e componentes de area
 * carregam no mesmo passo, com as portas de dados e de cliente externo
 * declaradas, porque o ciclo de dependencia entre eles nao permite ordem
 * interna"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o que
 * T001 entrega, mais as tres invariantes de arquitetura que um esqueleto quebra em
 * silencio: estado de modulo (`EXT-CONTEXTO`), trabalho no carregamento
 * (`EXT-ORDEM`) e o ciclo resolvido cedo demais (BR-DESCARTAR-010).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeApresentacao,
  type Consulta,
  type PedidoExterno,
  type PortaDeClienteExterno,
  type PortaDeDados,
  type PortasDeApresentacao,
  type ResultadoDeEscrita,
  type ResultadoExterno,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  chamar: PedidoExterno[];
}

/** Um pedido qualquer, com os defaults de fabrica do legado por escrito. */
const PEDIDO_DE_TESTE: PedidoExterno = {
  url: 'https://exemplo.invalido/colecao.json',
  metodo: 'GET',
  cabecalhos: {},
  corpo: null,
  tempoLimiteEmSegundos: 5,
  limiteDeRedirecionamentos: 5,
  agenteDeUsuario: 'WordPress/7.1.2; https://exemplo.invalido',
  verificarCertificado: true,
  // A unica chamada desta feature usa `wp_safe_remote_get`, que forca `true`
  // (`wp-includes/http.php:82`). E o campo que CA-13.3 cobra.
  recusarUrlInsegura: true,
};

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  resultadoExterno: ResultadoExterno = {
    completou: false,
    motivo: 'nao chamado',
  },
): { portas: PortasDeApresentacao; toques: Toques } {
  const toques: Toques = { selecionar: [], escrever: [], chamar: [] };

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

  const clienteExterno: PortaDeClienteExterno = {
    chamar(pedido) {
      toques.chamar.push(pedido);
      return resultadoExterno;
    },
  };

  return { portas: { dados, clienteExterno }, toques };
}

test('o modulo carrega com as duas portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeApresentacao(portas);

  assert.equal(modulo.nome, 'apresentacao');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.clienteExterno, portas.clienteExterno);
});

test('as tres areas do ciclo carregam no mesmo passo', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeApresentacao(portas);

  // E a entrega literal de T001. `spec.md`: "ou os tres entram juntos, ou nenhum
  // fecha" — nao existe composicao parcial a afirmar aqui.
  assert.equal(modulo.personalizacao.nome, 'personalizacao');
  assert.equal(modulo.menus.nome, 'menus');
  assert.equal(modulo.componentesDeArea.nome, 'componentes-de-area');
});

test('a superficie do modulo tem exatamente o que as tarefas fechadas entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeApresentacao(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao".
  //
  // T001: nenhuma operacao — as duas portas e as tres areas. As nove operacoes
  // que a tabela *Contratos* de `plan.md` nomeia entram em T003, T005, T009,
  // T011, T013, T017, T023 e T025, cada uma com a permissao declarada. A que o P4
  // mais cobra e a separacao entre salvar e aplicar (US-2), que `plan.md` chama de
  // "o contrato central da feature".
  assert.deepEqual(Object.keys(modulo).sort(), [
    'componentesDeArea',
    'menus',
    'nome',
    'personalizacao',
    'portas',
  ]);

  // E nenhuma das tres areas expoe operacao ainda, pela mesma razao.
  assert.deepEqual(Object.keys(modulo.personalizacao).sort(), [
    'noCiclo',
    'nome',
  ]);
  assert.deepEqual(Object.keys(modulo.menus).sort(), ['noCiclo', 'nome']);
  assert.deepEqual(Object.keys(modulo.componentesDeArea).sort(), [
    'noCiclo',
    'nome',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeApresentacao(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.chamar, []);
});

test('a ligacao tardia nao e resolvida na composicao, e depois devolve o trio inteiro', () => {
  const { portas } = portasDeTeste();

  // Se a composicao resolvesse o ciclo, ela teria de chamar `noCiclo` durante a
  // construcao de alguma das tres areas — e a guarda de `index.ts` lancaria.
  // Compor sem erro E a afirmacao de que o ciclo nao foi resolvido cedo:
  // BR-DESCARTAR-010 registra que importacao circular lida na avaliacao do modulo
  // e erro de inicializacao em ESM, nao aviso como era no `require` do legado.
  const modulo = criarModuloDeApresentacao(portas);

  // Depois da composicao, cada uma das tres alcanca as outras duas, e as tres
  // enxergam o MESMO trio: e assim que o ciclo medido
  // `customize ↔ menus-de-navegacao ↔ widgets-e-sidebars` existe sem um `import`
  // entre as pastas.
  for (const area of [
    modulo.personalizacao,
    modulo.menus,
    modulo.componentesDeArea,
  ]) {
    const trio = area.noCiclo();
    assert.equal(trio.personalizacao, modulo.personalizacao);
    assert.equal(trio.menus, modulo.menus);
    assert.equal(trio.componentesDeArea, modulo.componentesDeArea);
  }
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_7_');

  const moduloA = criarModuloDeApresentacao(primeira.portas);
  const moduloB = criarModuloDeApresentacao(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_7_');

  // A aparencia e configuracao POR SITE, e numa rede o identificador do site entra
  // DENTRO do nome da tabela (`{p}7_options`, `target_data_model.md`): se o modulo
  // guardasse a porta em estado de modulo, trocar o tema de um site trocaria o do
  // outro. E CA-8.5 poe a rede no criterio de aceite.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);

  // E as areas de uma composicao nao alcancam as da outra.
  assert.equal(moduloA.menus.noCiclo().personalizacao, moduloA.personalizacao);
  assert.notEqual(
    moduloA.menus.noCiclo().personalizacao,
    moduloB.personalizacao,
  );
});

test('a porta de cliente externo devolve a falha como valor, sem lancar (P7)', () => {
  const { portas, toques } = portasDeTeste('wp_', {
    completou: false,
    motivo: 'nome nao resolvido',
  });

  const modulo = criarModuloDeApresentacao(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o transporte
  // pode transformar este estado em excecao. No legado `wp_safe_remote_get()`
  // devolve `WP_Error` e o chamador o transforma em outro `WP_Error`
  // (`wp-includes/fonts/class-wp-font-collection.php:183`-`:191`) — catalogo que
  // nao responde nao derruba a tela de fontes.
  const resultado = modulo.portas.clienteExterno.chamar(PEDIDO_DE_TESTE);

  assert.equal(resultado.completou, false);
  assert.equal(
    resultado.completou === false ? resultado.motivo : null,
    'nome nao resolvido',
  );
  assert.deepEqual(toques.chamar, [PEDIDO_DE_TESTE]);
});

test('resposta HTTP de erro e sucesso de transporte: quem decide o que 200 significa e a tarefa da historia', () => {
  const { portas } = portasDeTeste('wp_', {
    completou: true,
    resposta: { codigo: 301, cabecalhos: {}, corpo: '' },
  });

  const modulo = criarModuloDeApresentacao(portas);

  // No legado os dois casos CONVERGEM na mesma mensagem — `is_wp_error()` ou
  // codigo diferente de 200 (`class-wp-font-collection.php:183`). A porta nao
  // antecipa essa convergencia, senao o codigo se perde antes de alguem poder
  // afirma-lo: T027 (US-13) e quem a reproduz.
  const resultado = modulo.portas.clienteExterno.chamar(PEDIDO_DE_TESTE);

  assert.equal(resultado.completou, true);
  assert.equal(
    resultado.completou === true ? resultado.resposta.codigo : null,
    301,
  );
});
