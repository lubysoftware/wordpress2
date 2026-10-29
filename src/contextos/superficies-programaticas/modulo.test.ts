/**
 * Testes da entrega de **T001**: *"o despachante de rotas carrega com o registro
 * de rotas vazio e inspecionavel, e a porta de dados declarada"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o que
 * T001 entrega, mais as duas invariantes que um esqueleto quebra em silencio:
 * estado de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105) e trabalho no carregamento
 * (`EXT-ORDEM`, BR-MIGRAR-106).
 *
 * A primeira delas pesa mais nesta feature do que em qualquer outra, e o motivo
 * esta na linha 5 da metrica primaria de `parity_specs.md`: *"estado entre
 * requisicoes concorrentes — teste proprio, fora dos UCs, tolerancia zero, sem
 * excecao"*. O legado guarda o servidor de rotas num global
 * (`wp-includes/rest-api.php:629`) e sobrevive porque o processo morre com a
 * resposta; num processo longo-vivo o mesmo desenho vaza rota entre requisicoes.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarDespachanteDeRotas,
  criarModuloDeSuperficiesProgramaticas,
  criarRegistroDeRotas,
  type Consulta,
  type PortaDeDados,
  type PortasDeSuperficiesProgramaticas,
  type ResultadoDeEscrita,
  type TratadorDeRota,
} from './index.js';

/** Conta os toques na porta, para afirmar que o modulo nao a usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
}

interface Duplos {
  portas: PortasDeSuperficiesProgramaticas;
  toques: Toques;
}

function portasDeTeste(prefixoDeTabela = 'wp_'): Duplos {
  const toques: Toques = { selecionar: [], escrever: [] };

  /*
    A porta-falsa **registra comando** em vez de simular banco. E a forma que
    esta arvore usa, e aqui ela serve a um caso que T009 vai precisar afirmar: no
    legado *"nenhum registro da chamada foi guardado"* (UC-44, pos-condicoes),
    logo o caso de paridade e a **ausencia** de comando, e so se afirma ausencia
    quem registra o que foi emitido.
  */
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

test('o modulo carrega com a porta de dados declarada e com o despachante', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeSuperficiesProgramaticas(portas);

  assert.equal(modulo.nome, 'superficies-programaticas');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.dados.prefixoDeTabela, 'wp_');
  assert.ok(modulo.despachante);
});

test('a superficie do modulo tem exatamente o que T001 entregou', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeSuperficiesProgramaticas(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001: nenhuma operacao, so a porta e o
  // despachante. A pauta do que entra em cada tarefa esta na tabela do
  // `index.ts`. T015 acrescentou `iniciarMapaDoSite` (US-7), declarada sem
  // permissao porque a superficie e do buscador, e T017 `iniciarFeed` (US-8),
  // sem permissao porque o feed nao tem regra de visibilidade propria.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'despachante',
    'iniciarFeed',
    'iniciarMapaDoSite',
    'nome',
    'portas',
  ]);
});

test('a superficie do despachante tem so o registro: despachar e T003', () => {
  const despachante = criarDespachanteDeRotas();

  // `despachar` nao existe hoje de proposito. A ordem das seis etapas do
  // atendimento esta na tabela do cabecalho de
  // `despacho/despachante-de-rotas.ts`, e quem escrever T003 a segue: ponto de
  // extensao registrado cedo ou tarde demais simplesmente nao funciona (D1, e a
  // tabela "Nao negociavel" da constituicao).
  assert.deepEqual(Object.keys(despachante).sort(), ['registro']);
});

test('o registro de rotas nasce vazio, nos tres leitores do legado', () => {
  const modulo = criarModuloDeSuperficiesProgramaticas(portasDeTeste().portas);
  const { registro } = modulo.despachante;

  // `get_namespaces()` -> `array_keys( $this->namespaces )`, e
  // `$namespaces = array()` em `class-wp-rest-server.php:64`.
  assert.deepEqual(registro.espacosDeNome(), []);

  // `get_routes()` sobre `$endpoints`. ⚠️ No legado este armazem NAO nasce
  // vazio: o construtor (`:103-160`) semeia duas rotas meta, `/` e `/batch/v1`.
  // T001 nao as semeia porque as duas tem esquema de argumento declarado, e o
  // formato de esquema e a entrega de T002. A divida esta nomeada no cabecalho
  // de `despacho/registro-de-rotas.ts` e em `README.md`.
  assert.equal(registro.rotas().size, 0);

  // `get_route_options()` devolve `null` para rota ausente (`:1048-1052`), e
  // **nao** mapa vazio. A diferenca e visivel para quem chama, e por isso tem
  // teste.
  assert.equal(registro.opcoesDaRota('/'), null);
  assert.equal(registro.opcoesDaRota('/wp/v2/posts'), null);
});

test('o recorte por espaco de nome existe, e num registro vazio devolve vazio', () => {
  const registro = criarRegistroDeRotas();

  // `get_routes( $route_namespace = '' )` (`:957`): o recorte esta atras de um
  // `if ( $route_namespace )` (`:960`), logo texto vazio vale como "todas".
  assert.equal(registro.rotas('').size, 0);
  assert.equal(registro.rotas(undefined).size, 0);
  assert.equal(registro.rotas('wp/v2').size, 0);
  assert.equal(registro.rotas('oembed/1.0').size, 0);
});

test('o que `rotas()` devolve e copia, e nao o armazem (class-wp-rest-server.php:958)', () => {
  const registro = criarRegistroDeRotas();

  // `$endpoints = $this->endpoints;` copia ANTES do filtro `rest_endpoints` e
  // da normalizacao, e e sobre a copia que os dois trabalham. Quem altera o que
  // o leitor devolveu nao altera o que esta registrado — e e isso que faz do
  // ponto de extensao um filtro de leitura e nao uma porta de escrita no
  // registro.
  const primeira = registro.rotas();
  const segunda = registro.rotas();
  assert.notEqual(primeira, segunda);

  // ⚠️ **T002 trocou o molde deste teste.** Em T001 o elemento do mapa era
  // `never`, e era o compilador que garantia o registro vazio; T002 declarou o
  // formato, logo "vazio" volta a ser afirmacao do teste — e e a assercao de
  // `registro.rotas().size` do teste acima, mais esta, que a sustentam. A
  // assercao de tipo abaixo existe para alcancar o `set` que a interface de
  // leitura esconde.
  const vazia: readonly TratadorDeRota[] = [];
  (primeira as Map<string, readonly TratadorDeRota[]>).set(
    '/wp/v2/posts',
    vazia,
  );

  assert.equal(primeira.size, 1);
  assert.equal(registro.rotas().size, 0);
});

test('criar o modulo nao toca na porta (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeSuperficiesProgramaticas(portas);

  // No legado o povoamento do registro acontece em `rest_api_init`, que dispara
  // DEPOIS de o servidor existir (`wp-includes/rest-api.php:644-657`), e
  // `register_rest_route()` avisa quem registra fora daquele gancho (`:81-92`).
  // Construir e povoar sao dois momentos, e os dois sao contrato publico.
  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
});

test('duas composicoes nao compartilham registro (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_');

  const moduloA = criarModuloDeSuperficiesProgramaticas(primeira.portas);
  const moduloB = criarModuloDeSuperficiesProgramaticas(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.notEqual(moduloA.despachante, moduloB.despachante);

  // ⚠️ O ponto desta assercao. No legado o registro e `global $wp_rest_server`
  // (`wp-includes/rest-api.php:631`), e ele sobrevive porque o processo morre
  // com a resposta. Se as duas composicoes compartilhassem o registro, as rotas
  // que uma requisicao registra apareceriam na seguinte — e numa rede as de um
  // site apareceriam no outro, onde o prefixo de tabela ja e diferente. E a
  // linha 5 de `parity_specs.md`: tolerancia zero, sem excecao.
  assert.notEqual(moduloA.despachante.registro, moduloB.despachante.registro);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // E o uso de uma porta nao aparece nos toques da outra.
  moduloA.portas.dados.selecionar({
    texto: 'SELECT 1',
    parametros: [],
  });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.deepEqual(segunda.toques.selecionar, []);
});
