/**
 * Testes da entrega de T001: "o modulo carrega com a porta de dados declarada,
 * resolve o endereco pedido para um conjunto vazio de criterios e devolve a
 * resposta de endereco inexistente".
 *
 * **Nao sao os testes de nenhuma historia.** Esses sao T004, T006, T008 e os
 * demais `[P]` de `tasks.md`, um por caso de `backlog/tests.md`, e nenhum caso
 * `UT-0xx` e afirmado aqui: a tarefa de teste de cada historia e que os
 * escreve, contra o contrato que a tarefa da historia tiver entregado. Aqui se
 * afirma so o que T001 entrega, mais tres invariantes que um esqueleto quebra em
 * silencio: estado de modulo (`EXT-CONTEXTO`), trabalho no carregamento
 * (`EXT-ORDEM`) e ponto de extensao que nao dispara ou nao altera o resultado
 * (P2).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeLeituraPublica,
  criteriosVazios,
  type AtendimentoDaLeitura,
  type Consulta,
  type CriteriosDeConsulta,
  type EnderecoPedido,
  type PortaDeDados,
  type PortasDeLeituraPublica,
  type ResolucaoDeEndereco,
  type RespostaDaLeitura,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques na porta, para afirmar que o modulo nao a usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
}

function portasDeTeste(prefixoDeTabela = 'wp_'): {
  portas: PortasDeLeituraPublica;
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

/** Um endereco qualquer do site, do jeito que o servidor o entrega. */
const PEDIDO: EnderecoPedido = { uriPedida: '/2026/10/ola-mundo/' };

test('o modulo carrega com a porta de dados declarada', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeLeituraPublica(portas);

  assert.equal(modulo.nome, 'leitura-publica');
  assert.equal(modulo.portas.dados, portas.dados);
});

test('a superficie do modulo tem exatamente as operacoes das tarefas fechadas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeLeituraPublica(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao".
  //
  // T001: as tres etapas que existem — resolver o endereco (`parse_request`),
  // decidir a situacao da resposta (`handle_404`) e o atendimento que as poe na
  // ordem do legado (`WP::main`). As tres declaram "nenhuma capacidade" na
  // interface do modulo, porque UC-01 registra que a leitura publica nao
  // verifica capacidade nenhuma: o portao e o `post_status`, e ele chega em
  // T009.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'atender',
    'nome',
    'portas',
    'resolverEndereco',
    'situacaoDaResposta',
  ]);
});

test('criar o modulo nao toca na porta (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeLeituraPublica(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
});

test('atender uma leitura tambem nao toca na porta, porque a consulta e T003', () => {
  const { portas, toques } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  modulo.atender(PEDIDO);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_');

  const moduloA = criarModuloDeLeituraPublica(primeira.portas);
  const moduloB = criarModuloDeLeituraPublica(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // O prefixo carrega o identificador do site (BR-MIGRAR-088), e a tabela de
  // regras de traducao de endereco e por site: se o modulo guardasse a porta em
  // estado de modulo, duas requisicoes de sites diferentes resolveriam o
  // endereco pelas regras uma da outra.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('o endereco pedido resolve para um conjunto vazio de criterios', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  const resolucao = modulo.resolverEndereco(PEDIDO);

  assert.equal(resolucao.resolvida, true);
  assert.ok(criteriosVazios(resolucao.criterios));
  assert.deepEqual({ ...resolucao.criterios }, {});
});

test('nenhum criterio e inventado a partir do texto do endereco', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  // Sem tabela de regras de traducao — que e T002 —, o legado nao deriva
  // criterio nenhum do caminho: o bloco inteiro de casamento esta dentro de um
  // `if ( ! empty( $rewrite ) )` (`wp-includes/class-wp.php:165`). Um porte que
  // adivinhasse `name` ou `p` a partir do texto passaria a responder conteudo
  // para endereco que o legado nao resolve.
  for (const uriPedida of [
    '/',
    '/ola-mundo/',
    '/?p=42',
    '/2026/10/',
    '/categoria/noticias/pagina/3/',
  ]) {
    const resolucao = modulo.resolverEndereco({ uriPedida });

    assert.ok(
      criteriosVazios(resolucao.criterios),
      `o endereco ${uriPedida} derivou criterio`,
    );
  }
});

test('os cinco campos publicos da resolucao ficam no valor de quem nao tem regra de traducao', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  const resolucao = modulo.resolverEndereco(PEDIDO);

  // `WP::$request`, `$matched_rule`, `$matched_query` e `$did_permalink` sao
  // propriedades publicas que extensao de terceiro le (P8), e sem tabela de
  // regras o legado as deixa exatamente assim: o que as preenche esta dentro do
  // bloco de casamento, que nao roda.
  assert.equal(resolucao.caminhoDaRequisicao, '');
  assert.equal(resolucao.regraCasada, '');
  assert.equal(resolucao.consultaCasada, '');
  assert.equal(resolucao.permalinkResolvido, false);
});

test('a resposta e a de endereco inexistente, com as tres marcas do legado', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  const { resposta } = modulo.atender(PEDIDO);

  // As tres coisas que `handle_404` faz ao 404ar: marca a consulta, declara o
  // codigo e manda nao guardar em cache (`wp-includes/class-wp.php:798-805`).
  assert.equal(resposta.naoEncontrado, true);
  assert.equal(resposta.codigoHttp, 404);
  assert.equal(resposta.semCache, true);
});

test('a consulta ja marcada nao e decidida de novo, e o codigo nao sai daqui', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const resolucao = modulo.resolverEndereco(PEDIDO);
  const disparos: RespostaDaLeitura[] = [];

  const resposta = modulo.situacaoDaResposta(resolucao, {
    jaMarcadaComoNaoEncontrada: true,
    pontosDeExtensao: { aoMarcarNaoEncontrado: [(r) => disparos.push(r)] },
  });

  // `if ( is_404() ) { return; }` (`wp-includes/class-wp.php:742-745`): o legado
  // desiste sem chamar `status_header` e sem marcar de novo — logo `set_404`,
  // que e ponto de extensao de terceiro, NAO dispara uma segunda vez.
  assert.equal(resposta.naoEncontrado, true);
  assert.equal(resposta.codigoHttp, null);
  assert.equal(resposta.semCache, false);
  assert.deepEqual(disparos, []);
});

test('o ponto `do_parse_request` curto-circuita a resolucao, e as etapas seguintes nao acontecem', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const vistos: ResolucaoDeEndereco[] = [];

  const atendimento = modulo.atender(PEDIDO, {
    resolucao: {
      pontosDeExtensao: {
        antesDeResolver: [() => false],
        depoisDeResolver: [(resolucao) => vistos.push(resolucao)],
      },
    },
  });

  // `$parsed` falso faz `WP::main()` pular a consulta, o tratamento de situacao
  // e o registro das variaveis (`wp-includes/class-wp.php:822-830`). Nao e 200
  // nem 404: e ausencia de decisao de situacao.
  assert.equal(atendimento.resolucao.resolvida, false);
  assert.equal(atendimento.resposta.codigoHttp, null);
  assert.equal(atendimento.resposta.naoEncontrado, false);
  // O ponto de acao `parse_request` tambem nao dispara: a resolucao nao ocorreu.
  assert.deepEqual(vistos, []);
});

test('o ponto `request` altera os criterios resolvidos (P2: o interceptador muda o resultado)', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);

  const resolucao = modulo.resolverEndereco(PEDIDO, {
    pontosDeExtensao: {
      sobreOsCriterios: [
        (criterios: CriteriosDeConsulta) => ({ ...criterios, p: '42' }),
        (criterios: CriteriosDeConsulta) => ({ ...criterios, feed: 'rss2' }),
      ],
    },
  });

  // Dois interceptadores em sequencia, cada um recebendo o que o anterior
  // devolveu: e o `apply_filters` de `wp-includes/class-wp.php:409`, e e o que
  // BR-MIGRAR-102 poe no contrato — 69,7% dos ganchos devolvem valor.
  assert.deepEqual({ ...resolucao.criterios }, { p: '42', feed: 'rss2' });
});

test('o ponto de acao `parse_request` ve a resolucao pronta e nao pode troca-la', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const vistos: ResolucaoDeEndereco[] = [];

  const resolucao = modulo.resolverEndereco(PEDIDO, {
    pontosDeExtensao: {
      depoisDeResolver: [
        (vista) => {
          vistos.push(vista);
          // Ponto de acao nao devolve valor, e a resolucao e congelada: a
          // tentativa de escrever nela nao muda o resultado.
          assert.throws(() => {
            (vista as { regraCasada: string }).regraCasada = 'inventada';
          });
        },
      ],
    },
  });

  assert.equal(vistos.length, 1);
  assert.equal(vistos[0], resolucao);
  assert.equal(resolucao.regraCasada, '');
});

test('o ponto `pre_handle_404` curto-circuita com qualquer valor que nao seja `false`', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const resolucao = modulo.resolverEndereco(PEDIDO);

  // O legado testa `false !== $valor` (`wp-includes/class-wp.php:738`): nulo,
  // zero e texto vazio curto-circuitam, e so `false` deixa o tratamento seguir.
  for (const valor of [true, null, 0, '']) {
    const resposta = modulo.situacaoDaResposta(resolucao, {
      pontosDeExtensao: { antesDeDecidir: [() => valor] },
    });

    assert.equal(
      resposta.codigoHttp,
      null,
      `o valor ${String(valor)} nao preemptou`,
    );
    assert.equal(resposta.naoEncontrado, false);
  }

  const semPreempcao = modulo.situacaoDaResposta(resolucao, {
    pontosDeExtensao: { antesDeDecidir: [() => false] },
  });

  assert.equal(semPreempcao.codigoHttp, 404);
});

test('o ponto de acao `set_404` dispara quando a resposta e marcada', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const resolucao = modulo.resolverEndereco(PEDIDO);
  const disparos: RespostaDaLeitura[] = [];

  const resposta = modulo.situacaoDaResposta(resolucao, {
    pontosDeExtensao: { aoMarcarNaoEncontrado: [(r) => disparos.push(r)] },
  });

  assert.equal(disparos.length, 1);
  assert.equal(disparos[0], resposta);
});

test('a acao `wp` dispara sempre, com a requisicao resolvida ou nao', () => {
  const { portas } = portasDeTeste();
  const modulo = criarModuloDeLeituraPublica(portas);
  const atendidos: AtendimentoDaLeitura[] = [];

  const resolvido = modulo.atender(PEDIDO, {
    aoFimDoAtendimento: [(atendimento) => atendidos.push(atendimento)],
  });
  const recusado = modulo.atender(PEDIDO, {
    resolucao: { pontosDeExtensao: { antesDeResolver: [() => false] } },
    aoFimDoAtendimento: [(atendimento) => atendidos.push(atendimento)],
  });

  // `do_action_ref_array( 'wp', ... )` esta fora do `if ( $parsed )`
  // (`wp-includes/class-wp.php:839`): dispara nos dois caminhos.
  assert.deepEqual(atendidos, [resolvido, recusado]);
});
