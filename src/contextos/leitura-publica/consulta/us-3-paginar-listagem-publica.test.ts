/**
 * Testes de **T007** — US-3, *"paginar a listagem publica com tamanho de pagina
 * configuravel"*, com os quatro criterios de aceite da tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-3.1 | a listagem nasce com **10** itens por pagina, e o numero e configuravel |
 * | CA-3.2 | a resposta informa a pagina corrente e o total de paginas |
 * | CA-3.3 | pedir pagina alem do total devolve a resposta de endereco sem correspondencia |
 * | CA-3.4 | a ordenacao da listagem e declarada e estavel entre paginas |
 *
 * Mais a regra de negocio que a `spec.md` poe nesta historia — *"`posts_per_page`
 * nasce em 10 e define o tamanho da pagina publica"* — e os quirks do legado que
 * um porte "limpo" apaga em silencio: o tamanho zero que vira **um**, o `-1` que
 * desliga a paginacao, a pagina fora de faixa que responde total **zero**, o
 * ponto de filtro que **nao** dispara nela, e o total que discorda da contagem
 * porque um e calculado antes de `the_posts` e o outro depois.
 *
 * **Nao sao os testes do catalogo.** Os cinco casos `UT-040-1` a `UT-040-5` de
 * `backlog/tests.md` sao de **T008**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o critario de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** O repositorio de conteudo e um duplo
 * que **registra o recorte pedido** e recorta uma tabela em memoria — e e assim
 * que se afirma que a janela de duas paginas consecutivas nao se sobrepoe sem
 * nunca montar SQL nenhum.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAMPO_DE_ORDENACAO_PADRAO,
  consultarConteudo,
  criarModuloDeLeituraPublica,
  ITENS_POR_PAGINA_DE_FABRICA,
  type ConteudoConsultado,
  type ContextoDaConsulta,
  type EnderecoPedido,
  type PortasDeLeituraPublica,
  type RecorteDaListagem,
} from '../index.js';

/** A porta de dados, que **nenhuma** destas operacoes deve tocar. */
function portasDeTeste(): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar() {
        throw new Error('a leitura publica nao consulta o banco por esta porta');
      },
      escrever() {
        throw new Error('a leitura publica nao grava por esta porta');
      },
    },
  };
}

/** Uma tabela de conteudo com `quantos` registros, em ordem declarada. */
function tabelaDeConteudo(quantos: number): readonly ConteudoConsultado[] {
  return Object.freeze(
    Array.from({ length: quantos }, (_valor, indice) => ({
      id: indice + 1,
      identificadorNaUrl: `conteudo-${indice + 1}`,
      tipo: 'post',
      corpo: '',
      data: '2026-10-11 09:00:00',
      senha: '',
    })),
  );
}

/**
 * O duplo do repositorio: registra o recorte que lhe pediram, recorta a tabela
 * pela janela e informa o total **ignorando** a janela.
 *
 * E o que o legado faz com `LIMIT` mais `SELECT FOUND_ROWS()`
 * (`class-wp-query.php:2823` e `:3712`), sem banco: sem janela devolve a tabela
 * inteira e nao informa total, que e o caso em que `set_found_posts()` conta a
 * propria lista (`:3717`).
 */
function repositorioPaginado(tabela: readonly ConteudoConsultado[]): {
  readonly repositorio: NonNullable<ContextoDaConsulta['repositorio']>;
  readonly recortes: RecorteDaListagem[];
} {
  const recortes: RecorteDaListagem[] = [];
  return {
    repositorio: (_criterios, _tipos, recorte) => {
      recortes.push(recorte);
      const { janela } = recorte.paginacao;
      if (janela === undefined) {
        return { conteudos: tabela };
      }
      const fim =
        janela.tamanho < 0 ? tabela.length : janela.inicio + janela.tamanho;
      return {
        conteudos: tabela.slice(janela.inicio, fim),
        totalEncontrado: tabela.length,
      };
    },
    recortes,
  };
}

/** A home de uma instalacao nova: nenhum criterio, nenhuma regra de traducao. */
const HOME: EnderecoPedido = { uriPedida: '/' };

/** A home na pagina `n`, pedida como o visitante a pede. */
function homeNaPagina(n: number): EnderecoPedido {
  return {
    uriPedida: `/?paged=${n}`,
    parametrosDeConsulta: { paged: String(n) },
  };
}

// ---------------------------------------------------------------------------
// CA-3.1 — nasce com 10, e o numero e configuravel
// ---------------------------------------------------------------------------

test('CA-3.1 a listagem publica nasce com 10 itens por pagina, sem ninguem ter escolhido', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo({}, { contexto: { repositorio } });

  // O valor de fabrica da opcao `posts_per_page`
  // (`wp-admin/includes/schema.php:434`), que e a regra de negocio desta
  // historia. Nada foi configurado: o contexto nao trouxe configuracao, e o
  // default resolvido e `CONFIGURACAO_DE_FABRICA`.
  assert.equal(ITENS_POR_PAGINA_DE_FABRICA, 10);
  assert.equal(consulta.recorte.paginacao.itensPorPagina, 10);
  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 0, tamanho: 10 });
  assert.equal(consulta.contagem, 10);

  // E o valor resolvido volta aos criterios, porque no legado `$query_vars` e
  // referencia (`class-wp-query.php:1919`) e e esse conjunto que o tema recebe.
  assert.equal(consulta.criterios['posts_per_page'], 10);
});

test('CA-3.1 o tamanho da pagina e configuravel pela opcao do site', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo(
    {},
    {
      contexto: {
        repositorio,
        configuracao: {
          mostrarNaFrente: 'posts',
          paginaDaFrente: 0,
          paginaDeConteudos: 0,
          paginaDePoliticaDePrivacidade: 0,
          formaDosEnderecos: '',
          itensPorPagina: 5,
          itensPorFeed: 10,
        },
      },
    },
  );

  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 0, tamanho: 5 });
  assert.equal(consulta.contagem, 5);
  assert.equal(consulta.totalDePaginas, 8);
});

test('CA-3.1 o tamanho da pagina e configuravel por `pre_get_posts`, que e por onde a extensao o troca', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo(
    {},
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        // `$query->set( 'posts_per_page', 3 )` — o uso mais comum do ponto
        // (`class-wp-query.php:1916`), e o P2 manda poder conferir que o
        // interceptador muda o resultado onde o legado permite.
        antesDeConsultar: [(criterios) => ({ ...criterios, posts_per_page: 3 })],
      },
    },
  );

  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 0, tamanho: 3 });
  assert.equal(consulta.contagem, 3);
});

test('CA-3.1 ⚠️ o visitante NAO configura o tamanho da pagina pela URL: `posts_per_page` e nome privado de criterio', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const atendimento = modulo.atender(
    {
      uriPedida: '/?posts_per_page=100',
      parametrosDeConsulta: { posts_per_page: '100' },
    },
    { contexto: { repositorio } },
  );

  // `posts_per_page` esta na lista dos 26 nomes **privados**
  // (`class-wp.php:28`), e `parse_request` so coleta privado de
  // `$extra_query_vars` (`:392-396`). O valor da requisicao e descartado antes
  // de chegar a consulta, e a pagina continua com 10.
  assert.equal(atendimento.resolucao.criterios['posts_per_page'], undefined);
  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 0, tamanho: 10 });
  assert.equal(atendimento.consulta?.contagem, 10);
});

test('CA-3.1 o nucleo configura o tamanho por `extra_query_vars`, que e o caminho dele', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const atendimento = modulo.atender(HOME, {
    resolucao: { criteriosExtras: { posts_per_page: '4' } },
    contexto: { repositorio },
  });

  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 0, tamanho: 4 });
  assert.equal(atendimento.consulta?.contagem, 4);
});

test('CA-3.1 tamanho zero vira UM, e tamanho abaixo de -1 vira o positivo dele', () => {
  const { recortes } = repositorioPaginado(tabelaDeConteudo(37));

  // `:2013-2015` — o teste e `empty()`: zero cai na opcao do site, nao em um.
  const comZero = consultarConteudo(
    { posts_per_page: 0 },
    { contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(37)).repositorio } },
  );
  assert.equal(comZero.recorte.paginacao.itensPorPagina, 10);

  // `:2044-2046` — o zero que chega **do molde** e que vira um: `'0abc'` da 0 no
  // molde `(int)` e nao e vazio para `empty()`.
  const comZeroDoMolde = consultarConteudo(
    { posts_per_page: '0abc' },
    { contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(37)).repositorio } },
  );
  assert.equal(comZeroDoMolde.recorte.paginacao.itensPorPagina, 1);
  assert.deepEqual(comZeroDoMolde.recorte.paginacao.janela, {
    inicio: 0,
    tamanho: 1,
  });

  // `:2042-2043` — `abs()`, e nao recusa.
  const comNegativo = consultarConteudo(
    { posts_per_page: -5 },
    { contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(37)).repositorio } },
  );
  assert.equal(comNegativo.recorte.paginacao.itensPorPagina, 5);

  assert.deepEqual(recortes, []);
});

test('CA-3.1 o tamanho -1 desliga a paginacao: sem janela, e sem numero de paginas', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  // `:2024-2025` — `-1 == $posts_per_page` liga `nopaging`, e `:2810` so monta
  // janela com `nopaging` desligado.
  const consulta = consultarConteudo(
    { posts_per_page: -1 },
    { contexto: { repositorio } },
  );

  assert.equal(consulta.recorte.paginacao.semPaginacao, true);
  assert.equal(consulta.recorte.paginacao.janela, undefined);
  assert.equal(recortes[0]?.paginacao.janela, undefined);

  // Sem janela o legado conta a propria lista (`:3717`) e **nao** divide
  // (`:3737`): o numero de paginas fica em zero, e nao em um.
  assert.equal(consulta.contagem, 37);
  assert.equal(consulta.totalEncontrado, 37);
  assert.equal(consulta.totalDePaginas, 0);
});

test('CA-3.1 no feed o tamanho e o do feed, e ele sobrepoe o da listagem', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  // `:2032-2039` — *"This overrides 'posts_per_page'"*. A opcao e outra,
  // `posts_per_rss` (`schema.php:424`), e o criterio de mesmo nome vence a
  // opcao.
  const porOpcao = consultarConteudo(
    { feed: 'rss2', posts_per_page: 25 },
    {
      contexto: {
        repositorio,
        configuracao: {
          mostrarNaFrente: 'posts',
          paginaDaFrente: 0,
          paginaDeConteudos: 0,
          paginaDePoliticaDePrivacidade: 0,
          formaDosEnderecos: '',
          itensPorPagina: 25,
          itensPorFeed: 7,
        },
      },
    },
  );
  assert.equal(porOpcao.recorte.paginacao.itensPorPagina, 7);

  const porCriterio = consultarConteudo(
    { feed: 'rss2', posts_per_rss: 2 },
    { contexto: { repositorio } },
  );
  assert.equal(porCriterio.recorte.paginacao.itensPorPagina, 2);

  // E o feed desliga o `nopaging` que o `-1` teria ligado (`:2038`).
  const comTudo = consultarConteudo(
    { feed: 'rss2', posts_per_page: -1 },
    { contexto: { repositorio } },
  );
  assert.equal(comTudo.recorte.paginacao.semPaginacao, false);
  assert.deepEqual(comTudo.recorte.paginacao.janela, {
    inicio: 0,
    tamanho: 10,
  });
  assert.equal(recortes.length, 3);
});

// ---------------------------------------------------------------------------
// CA-3.2 — a pagina corrente e o total de paginas
// ---------------------------------------------------------------------------

test('CA-3.2 a resposta informa a pagina corrente e o total de paginas', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo({ paged: 2 }, { contexto: { repositorio } });

  assert.equal(consulta.recorte.paginacao.paginaCorrente, 2);
  assert.equal(consulta.totalEncontrado, 37);
  // `:3738` — `ceil( 37 / 10 )`.
  assert.equal(consulta.totalDePaginas, 4);
  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 10, tamanho: 10 });
  assert.deepEqual(
    consulta.conteudos.map((linha) => linha.id),
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  );
});

test('CA-3.2 na primeira pagina a pagina corrente e 1 e o criterio `paged` continua em ZERO', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo({}, { contexto: { repositorio } });

  // `:2811-2813` — `$page` e variavel **local** de `get_posts()`, e o `if (
  // ! $page ) $page = 1` nao volta para os criterios: `paged` fica no zero que
  // `parse_query` escreveu (`:845`). E por isso que `is_paged()` e falso na
  // primeira pagina (`:1027`), e e disso que depende o ramo 3 de `handle_404`.
  assert.equal(consulta.recorte.paginacao.paginaCorrente, 1);
  assert.equal(consulta.criterios['paged'], 0);
  assert.equal(consulta.tipos.paginado, false);
});

test('CA-3.2 `offset` tem precedencia sobre a pagina pedida, e so quando e numerico', () => {
  const tabela = tabelaDeConteudo(37);

  // `:2816-2819` — *"If 'offset' is provided, it takes precedence over
  // 'paged'"*, e o legado grava o valor absinteado de volta nos criterios.
  const comDeslocamento = consultarConteudo(
    { paged: 3, offset: '5' },
    { contexto: { repositorio: repositorioPaginado(tabela).repositorio } },
  );
  assert.deepEqual(comDeslocamento.recorte.paginacao.janela, {
    inicio: 5,
    tamanho: 10,
  });
  assert.equal(comDeslocamento.criterios['offset'], 5);

  // O teste do legado e `is_numeric()`, nao `empty()`: texto nao numerico nao
  // tem precedencia nenhuma e a pagina volta a mandar.
  const comLixo = consultarConteudo(
    { paged: 3, offset: 'abc' },
    { contexto: { repositorio: repositorioPaginado(tabela).repositorio } },
  );
  assert.deepEqual(comLixo.recorte.paginacao.janela, {
    inicio: 20,
    tamanho: 10,
  });
  assert.equal(comLixo.criterios['offset'], 'abc');

  // E a pagina corrente continua sendo a pedida: o deslocamento nao a reescreve.
  assert.equal(comDeslocamento.recorte.paginacao.paginaCorrente, 3);
});

test('CA-3.2 conteudo singular nao tem janela: pagina 1, total 1 e ZERO paginas', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(1));

  // `:2810` — `! $this->is_singular`. Um conteudo so nao e uma listagem, e o
  // legado nao lhe monta `LIMIT` nenhum.
  const consulta = consultarConteudo({ p: '1' }, { contexto: { repositorio } });

  assert.equal(consulta.tipos.singular, true);
  assert.equal(recortes[0]?.paginacao.janela, undefined);
  assert.equal(consulta.recorte.paginacao.paginaCorrente, 1);
  assert.equal(consulta.totalEncontrado, 1);
  assert.equal(consulta.totalDePaginas, 0);
});

test('CA-3.2 o ponto de filtro `found_posts` muda o total E o numero de paginas (P2)', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(37));
  const vistos: number[] = [];

  const consulta = consultarConteudo(
    {},
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        sobreOTotalEncontrado: [
          (total) => {
            vistos.push(total);
            return 25;
          },
        ],
      },
    },
  );

  // `:3735` — o filtro dispara **depois** da contagem e **antes** da divisao,
  // logo quem mexe no total muda o numero de paginas sem trabalho extra.
  assert.deepEqual(vistos, [37]);
  assert.equal(consulta.totalEncontrado, 25);
  assert.equal(consulta.totalDePaginas, 3);
});

test('CA-3.2 o total e a contagem discordam de proposito: `the_posts` muda uma e nao a outra', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo(
    {},
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        sobreOsConteudos: [
          (conteudos) => [
            ...conteudos,
            {
              id: 900,
              identificadorNaUrl: 'inventado-pela-extensao',
              tipo: 'post',
              corpo: '',
              data: '2026-10-11 09:00:00',
              senha: '',
            },
          ],
        ],
      },
    },
  );

  // `set_found_posts()` roda dentro do bloco da consulta (`:3327` em diante) e
  // `post_count` e recalculado depois do filtro (`:3649`). O registro que a
  // extensao acrescentou entra na contagem e **nao** no total.
  assert.equal(consulta.contagem, 11);
  assert.equal(consulta.totalEncontrado, 37);
  assert.equal(consulta.totalDePaginas, 4);
});

test('CA-3.2 `no_found_rows` desliga a contagem, e os dois numeros ficam em zero', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(37));
  const disparos: number[] = [];

  const consulta = consultarConteudo(
    { no_found_rows: 1 },
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        sobreOTotalEncontrado: [
          (total) => {
            disparos.push(total);
            return total;
          },
        ],
      },
    },
  );

  // `:3699-3701` — a desistencia e antes do ponto de filtro: ele nao dispara.
  assert.equal(consulta.recorte.paginacao.semTotalEncontrado, true);
  assert.equal(consulta.totalEncontrado, 0);
  assert.equal(consulta.totalDePaginas, 0);
  assert.deepEqual(disparos, []);

  // E a janela continua existindo: a pagina e recortada do mesmo jeito.
  assert.equal(consulta.contagem, 10);
});

// ---------------------------------------------------------------------------
// CA-3.3 — pagina alem do total 404a
// ---------------------------------------------------------------------------

test('CA-3.3 a ultima pagina parcial responde 200, e a pagina seguinte 404a', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const tabela = tabelaDeConteudo(37);

  // A quarta pagina de 37 registros em paginas de 10 tem 7, e e pagina valida.
  const ultima = modulo.atender(homeNaPagina(4), {
    contexto: { repositorio: repositorioPaginado(tabela).repositorio },
  });
  assert.equal(ultima.consulta?.contagem, 7);
  assert.equal(ultima.resposta.codigoHttp, 200);
  assert.equal(ultima.resposta.naoEncontrado, false);

  // A quinta nao tem registro nenhum. Antes da decisao de situacao, ela e uma
  // listagem **paginada** e vazia — e e esse par que leva ao 404.
  const quintaPagina = consultarConteudo(
    { paged: 5 },
    { contexto: { repositorio: repositorioPaginado(tabela).repositorio } },
  );
  assert.equal(quintaPagina.contagem, 0);
  assert.equal(quintaPagina.tipos.paginado, true);

  // No atendimento inteiro, o ramo 3 de `handle_404` (`class-wp.php:784`) nao e
  // consultado, porque `is_paged()` e verdadeiro: as cinco excecoes que salvam a
  // home de um site vazio nao valem para pagina de listagem.
  const alemDoTotal = modulo.atender(homeNaPagina(5), {
    contexto: { repositorio: repositorioPaginado(tabela).repositorio },
  });
  assert.equal(alemDoTotal.consulta?.contagem, 0);

  // As tres marcas do legado ao 404ar (`class-wp.php:798-805`).
  assert.equal(alemDoTotal.resposta.codigoHttp, 404);
  assert.equal(alemDoTotal.resposta.naoEncontrado, true);
  assert.equal(alemDoTotal.resposta.semCache, true);

  // ⚠️ E a consulta sai marcada, com os predicados zerados por `set_404()`
  // (`class-wp-query.php:1846`): o tema que perguntar por `is_home()` ou por
  // `is_paged()` depois disso ouve **nao** nas duas, mesmo tendo sido as duas
  // verdadeiras ate aqui.
  assert.equal(alemDoTotal.consulta?.tipos.naoEncontrado, true);
  assert.equal(alemDoTotal.consulta?.tipos.inicio, false);
  assert.equal(alemDoTotal.consulta?.tipos.paginado, false);
});

test('CA-3.3 a MESMA listagem vazia responde 200 sem paginacao e 404 com paginacao', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const vazia = tabelaDeConteudo(0);

  // E este par que mostra quem decide: nao e a comparacao entre a pagina pedida
  // e o total, e a lista vazia mais `is_paged()`. As duas consultas sao a mesma
  // listagem vazia, e o unico criterio diferente e `paged`.
  assert.equal(
    consultarConteudo(
      {},
      { contexto: { repositorio: repositorioPaginado(vazia).repositorio } },
    ).tipos.paginado,
    false,
  );
  assert.equal(
    consultarConteudo(
      { paged: 2 },
      { contexto: { repositorio: repositorioPaginado(vazia).repositorio } },
    ).tipos.paginado,
    true,
  );

  const semPaginacao = modulo.atender(HOME, {
    contexto: { repositorio: repositorioPaginado(vazia).repositorio },
  });
  assert.equal(semPaginacao.consulta?.contagem, 0);
  assert.equal(semPaginacao.resposta.codigoHttp, 200);

  const comPaginacao = modulo.atender(homeNaPagina(2), {
    contexto: { repositorio: repositorioPaginado(vazia).repositorio },
  });
  assert.equal(comPaginacao.consulta?.contagem, 0);
  assert.equal(comPaginacao.resposta.codigoHttp, 404);
});

test('CA-3.3 🔴 a pagina fora de faixa informa total ZERO e ZERO paginas, e o filtro nao dispara', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(37));
  const disparos: number[] = [];

  const consulta = consultarConteudo(
    { paged: 9 },
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        sobreOTotalEncontrado: [
          (total) => {
            disparos.push(total);
            return total;
          },
        ],
      },
    },
  );

  // `:3699-3701` — *"Bail if posts is an empty array"*. O repositorio sabe que
  // a tabela tem 37 registros e informou o total; `set_found_posts()` desistiu
  // antes de olhar. Informar 37 e 4 aqui seria "corrigir" o legado e trocar o
  // que o tema recebe em todo endereco de pagina vazia.
  assert.equal(consulta.contagem, 0);
  assert.equal(consulta.totalEncontrado, 0);
  assert.equal(consulta.totalDePaginas, 0);
  assert.deepEqual(disparos, []);
});

// ---------------------------------------------------------------------------
// CA-3.4 — a ordenacao e declarada e estavel entre paginas
// ---------------------------------------------------------------------------

test('CA-3.4 a ordenacao da listagem e declarada: data de publicacao, descendente', () => {
  const { repositorio, recortes } = repositorioPaginado(tabelaDeConteudo(37));

  const consulta = consultarConteudo({}, { contexto: { repositorio } });

  // `:2516` — `"{$wpdb->posts}.post_date " . $query_vars['order']`, com o
  // default `DESC` de `parse_order()` (`:1828`). A ordem nao e o que o
  // repositorio escolher: ela chega declarada no recorte.
  assert.deepEqual(recortes[0]?.ordenacao, {
    direcao: 'DESC',
    chaves: [{ chave: CAMPO_DE_ORDENACAO_PADRAO, direcao: 'DESC' }],
    peloPadrao: true,
  });

  // E a direcao resolvida volta aos criterios, de onde o tema a le.
  assert.equal(consulta.criterios['order'], 'DESC');
});

test('CA-3.4 a ordenacao e estavel entre paginas: duas paginas consecutivas nao se sobrepoem nem saltam registro', () => {
  const tabela = tabelaDeConteudo(37);

  const primeira = repositorioPaginado(tabela);
  const umaPagina = consultarConteudo(
    { paged: 1 },
    { contexto: { repositorio: primeira.repositorio } },
  );
  const segunda = repositorioPaginado(tabela);
  const outraPagina = consultarConteudo(
    { paged: 2 },
    { contexto: { repositorio: segunda.repositorio } },
  );

  // A ordem declarada e **identica** nas duas: ela sai dos criterios, e nenhum
  // criterio de ordenacao depende da pagina pedida.
  assert.deepEqual(
    primeira.recortes[0]?.ordenacao,
    segunda.recortes[0]?.ordenacao,
  );

  // E as duas janelas sao contiguas: a segunda comeca exatamente onde a
  // primeira acabou.
  const janelaUm = primeira.recortes[0]?.paginacao.janela;
  const janelaDois = segunda.recortes[0]?.paginacao.janela;
  assert.deepEqual(janelaUm, { inicio: 0, tamanho: 10 });
  assert.deepEqual(janelaDois, { inicio: 10, tamanho: 10 });

  // Logo nenhum registro aparece nas duas, e nenhum fica entre elas.
  const idsUm = umaPagina.conteudos.map((linha) => linha.id);
  const idsDois = outraPagina.conteudos.map((linha) => linha.id);
  assert.deepEqual(
    idsUm.filter((id) => idsDois.includes(id)),
    [],
  );
  assert.deepEqual(
    [...idsUm, ...idsDois],
    tabela.slice(0, 20).map((linha) => linha.id),
  );
});

test('CA-3.4 a direcao pedida e aceita pelo que o legado aceita, e o resto cai no default', () => {
  const comRepositorio = () => ({
    contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(3)).repositorio },
  });

  // `:1831-1835` — a comparacao e depois de `strtoupper()`.
  assert.equal(
    consultarConteudo({ order: 'asc' }, comRepositorio()).recorte.ordenacao
      .direcao,
    'ASC',
  );
  assert.equal(
    consultarConteudo({ order: 'Asc' }, comRepositorio()).recorte.ordenacao
      .direcao,
    'ASC',
  );

  // ⚠️ Valor invalido nao e recusado: e tratado como o default.
  assert.equal(
    consultarConteudo({ order: 'descendente' }, comRepositorio()).recorte
      .ordenacao.direcao,
    'DESC',
  );
  // `! is_string( $order )` — numero tambem cai no default.
  assert.equal(
    consultarConteudo({ order: 1 }, comRepositorio()).recorte.ordenacao.direcao,
    'DESC',
  );
});

test('CA-3.4 duas ordenacoes apagam a direcao, e cada uma por um motivo do legado', () => {
  const comRepositorio = () => ({
    contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(3)).repositorio },
  });

  // `:2494` — ordem ao acaso nao tem ascendente.
  const aoAcaso = consultarConteudo(
    { orderby: 'rand', order: 'ASC' },
    comRepositorio(),
  );
  assert.equal(aoAcaso.recorte.ordenacao.direcao, '');
  assert.equal(aoAcaso.criterios['order'], '');

  // `:2502-2505` — *"These values of orderby should ignore the 'order'
  // parameter"*: as tres chaves **sao** a ordem.
  const pelaOrdemInformada = consultarConteudo(
    { orderby: 'post__in', order: 'ASC' },
    comRepositorio(),
  );
  assert.equal(pelaOrdemInformada.recorte.ordenacao.direcao, '');
  assert.deepEqual(pelaOrdemInformada.recorte.ordenacao.chaves, [
    { chave: 'post__in', direcao: '' },
  ]);
});

test('CA-3.4 `none` e arranjo vazio apagam a ordenacao, e o vazio comum cai no default', () => {
  const comRepositorio = () => ({
    contexto: { repositorio: repositorioPaginado(tabelaDeConteudo(3)).repositorio },
  });

  // `:2518-2519`.
  assert.deepEqual(
    consultarConteudo({ orderby: 'none' }, comRepositorio()).recorte.ordenacao
      .chaves,
    [],
  );

  // `:2513-2514` — *"Boolean false or empty array blanks out ORDER BY, while
  // leaving the value unset or otherwise empty sets the default"*. Os dois
  // vazios sao o mesmo `empty()` e significam coisas opostas.
  assert.deepEqual(
    consultarConteudo({ orderby: [] }, comRepositorio()).recorte.ordenacao
      .chaves,
    [],
  );
  assert.deepEqual(
    consultarConteudo({ orderby: '' }, comRepositorio()).recorte.ordenacao
      .chaves,
    [{ chave: CAMPO_DE_ORDENACAO_PADRAO, direcao: 'DESC' }],
  );
  // O texto `'0'` tambem e vazio para `empty()`, e tambem cai no default.
  assert.deepEqual(
    consultarConteudo({ orderby: '0' }, comRepositorio()).recorte.ordenacao
      .chaves,
    [{ chave: CAMPO_DE_ORDENACAO_PADRAO, direcao: 'DESC' }],
  );
});

test('CA-3.4 varias chaves pedidas num texto viram varias chaves declaradas, com a mesma direcao', () => {
  const { repositorio } = repositorioPaginado(tabelaDeConteudo(3));

  // `:2536-2544` — `explode( ' ', ... )`, e o legado repete a direcao em todas
  // ao montar a clausula.
  const consulta = consultarConteudo(
    { orderby: 'title menu_order', order: 'ASC' },
    { contexto: { repositorio } },
  );

  assert.deepEqual(consulta.recorte.ordenacao, {
    direcao: 'ASC',
    chaves: [
      { chave: 'title', direcao: 'ASC' },
      { chave: 'menu_order', direcao: 'ASC' },
    ],
    peloPadrao: false,
  });
  // `:2533-2534` — o `urldecode` e o `wp_slash` do legado sao gravados de volta
  // nos criterios antes do recorte.
  assert.equal(consulta.criterios['orderby'], 'title menu_order');
});

// ---------------------------------------------------------------------------
// EXT-CONTEXTO: duas leituras concorrentes pedem paginas diferentes
// ---------------------------------------------------------------------------

test('duas leituras simultaneas de paginas diferentes nao compartilham estado (EXT-CONTEXTO, PT-011)', () => {
  const tabela = tabelaDeConteudo(37);
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const primeira = modulo.atender(homeNaPagina(1), {
    contexto: { repositorio: repositorioPaginado(tabela).repositorio },
  });
  const segunda = modulo.atender(homeNaPagina(3), {
    contexto: { repositorio: repositorioPaginado(tabela).repositorio },
  });

  // O cenario `@concorrencia` de `PT-011`: *"duas leituras que pedem recortes
  // diferentes da mesma superficie... nenhuma contem elemento do recorte da
  // outra"*.
  const idsPrimeira = primeira.consulta?.conteudos.map((linha) => linha.id) ?? [];
  const idsSegunda = segunda.consulta?.conteudos.map((linha) => linha.id) ?? [];
  assert.equal(primeira.consulta?.recorte.paginacao.paginaCorrente, 1);
  assert.equal(segunda.consulta?.recorte.paginacao.paginaCorrente, 3);
  assert.deepEqual(
    idsPrimeira.filter((id) => idsSegunda.includes(id)),
    [],
  );

  // E a ordem pedida pelas duas e a mesma, porque nenhuma das duas a guarda.
  assert.deepEqual(
    primeira.consulta?.recorte.ordenacao,
    segunda.consulta?.recorte.ordenacao,
  );
});
