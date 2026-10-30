/**
 * A entrega de **T008**: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-040-1, UT-040-2, UT-040-3, UT-040-4,
 * UT-040-5), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-040-5) entra na mesma suite."*
 *
 * ✅ **Os cinco casos foram COPIADOS do catalogo, nao reconstruidos.** A tabela
 * de `REQ-040` em `backlog/tests.md:619-629` — *"`must` · `pronto` · veredito
 * `aprovado` · 4 de 4 critérios de aceite cobertos"* — da nome, tipo e prova de
 * cada caso, e e ela que esta transcrita abaixo, em ordem de catalogo, com o nome
 * do caso dentro do nome do teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-040-1` | `feliz` | usa 10 itens por pagina enquanto nada e configurado e respeita o valor configurado | *"A listagem pública nasce com 10 itens por página e o número é configurável"* | CA-3.1 |
 * | `UT-040-2` | `feliz` | informa na resposta a pagina corrente e o total de paginas | *"A resposta informa a página corrente e o total de páginas"* | CA-3.2 |
 * | `UT-040-3` | `erro` | devolve a resposta de endereco sem correspondencia para pagina alem do total | *"Pedir página além do total devolve a resposta de endereço sem correspondência"* | CA-3.3 |
 * | `UT-040-4` | `borda` | mantem a ordenacao estavel na fronteira entre duas paginas | *"A ordenação da listagem é declarada e estável entre páginas"* | CA-3.4 |
 * | `UT-040-5` | `borda` | nasce com 10 como tamanho de pagina sem ninguem ter escolhido | *"`posts_per_page` nasce em 10 e define o tamanho da página pública"* | regra de negocio |
 *
 * ---
 *
 * # O que o catalogo NAO da, e de onde veio
 *
 * O catalogo registra nome, tipo e prova, e **nao** o dado de entrada literal —
 * *"nenhum deles cita arquivo, classe ou framework"* (`backlog/tests.md:5`). O
 * dado daqui sai de duas fontes, e de nenhuma outra:
 *
 * 1. **UC-01** (`.specify/use-cases/UC-01-consultar-conteudo-publicado.md`), que
 *    a tabela de rastreabilidade de `spec.md:176` liga a US-3 (*"US-3 | REQ-040
 *    · UC-01"*). Dele vem o gatilho — a visita a uma URL publica, que aqui e
 *    `atender` —, o passo 3 — *"executa a consulta principal · só status
 *    público; posts_per_page nasce em 10"* (`:38`) — e a excecao *"Nenhum
 *    registro corresponde · `WP::handle_404()` marca a consulta como 404"*
 *    (`:78`), que e o resultado esperado de UT-040-3.
 * 2. **O legado**, conferido no oraculo antes de cada afirmacao:
 *
 * | o que | onde |
 * |---|---|
 * | a opcao `posts_per_page` nasce em 10 | `wp-admin/includes/schema.php:434` |
 * | tamanho vazio cai na opcao do site | `wp-includes/class-wp-query.php:2013-2014` |
 * | a janela `LIMIT inicio, tamanho`, so fora de singular e de `nopaging` | `class-wp-query.php:2810-2823` |
 * | `max_num_pages = ceil( found_posts / posts_per_page )`, so com janela | `class-wp-query.php:3737-3738` |
 * | a pagina vazia desiste do total antes de contar | `class-wp-query.php:3699-3701` |
 * | a ordem padrao `post_date` + direcao, que nasce `DESC` | `class-wp-query.php:2516` e `:1828` |
 * | lista vazia **paginada** vai a 404, sem as excecoes do ramo 3 | `wp-includes/class-wp.php:784` e `:799-802` |
 *
 * ---
 *
 * # Nao e a suite de T007, e o nivel e outro
 *
 * `./us-3-paginar-listagem-publica.test.ts` e a suite da **entrega** de T007, e
 * o cabecalho dela ja declara a fronteira: *"os cinco casos `UT-040-1` a
 * `UT-040-5` de `backlog/tests.md` sao de **T008**, a tarefa `[P]`, e nenhum
 * deles e afirmado aqui"*. Ela entra por `consultarConteudo` e afirma os quirks
 * de cada etapa (o zero que vira um, o `-1`, o feed, `offset`, `found_posts`).
 *
 * Esta entra **so** por `atender`, que e o `WP::main()` que toda visita executa
 * (UC-01, gatilho), e o tamanho configuravel entra **so** pela opcao do site,
 * que e o ponto de configuracao que o P6 nomeia. A porta de dados **registra
 * comando**, e a assercao e o log vazio: a leitura da listagem nao escreve nada,
 * em pagina nenhuma.
 *
 * ---
 *
 * # Onde esta suite PARA
 *
 * - **UT-040-4 nao afirma desempate de datas iguais, e de proposito.** A ordem
 *   padrao do legado e `post_date` e nada mais (`class-wp-query.php:2516`): ele
 *   nao acrescenta `ID` como segunda chave, e dois conteudos com a mesma data
 *   caem na ordem que o banco escolher. Afirmar um desempate aqui seria inventar
 *   regra que o legado nao tem. O que o caso afirma e o que o modulo controla: a
 *   ordem e **declarada** no recorte, e a mesma nas duas paginas, e as duas
 *   janelas sao contiguas — com datas distintas, o ultimo da pagina 1 e mais novo
 *   que o primeiro da pagina 2 e nenhum registro sobra ou falta na fronteira.
 * - **O portao de `post_status` nao entra.** E T009 (US-4), com catalogo proprio;
 *   o recorte por estado acontece dentro do repositorio.
 * - **Nada mede byte de resposta HTTP.** A resposta aqui sao os tres campos de
 *   `RespostaDaLeitura` mais os numeros da consulta; o byte e do `PT-011`.
 *
 * ⚠️ **Nada externo entra nestes testes.** A porta de dados e o repositorio sao
 * duplos que **registram comando**; nao ha banco, rede, relogio nem navegador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAMPO_DE_ORDENACAO_PADRAO,
  CONFIGURACAO_DE_FABRICA,
  criarModuloDeLeituraPublica,
  ITENS_POR_PAGINA_DE_FABRICA,
  type ConfiguracaoDoSiteNaConsulta,
  type ConteudoConsultado,
  type ContextoDaConsulta,
  type EnderecoPedido,
  type PortasDeLeituraPublica,
  type RecorteDaListagem,
} from '../index.js';

// ---------------------------------------------------------------------------
// Os duplos: todos registram comando
// ---------------------------------------------------------------------------

/**
 * A porta de dados que **registra** em vez de simular banco. Nenhum dos cinco
 * casos a usa, e o log vazio e a pos-condicao de UC-01 afirmada como resultado.
 */
function portaQueRegistra(comandos: string[]): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        comandos.push(`porta.selecionar ${consulta.texto}`);
        return [];
      },
      escrever(consulta) {
        comandos.push(`porta.escrever ${consulta.texto}`);
        return { linhasAfetadas: 0, idGerado: null };
      },
    },
  };
}

/**
 * `quantos` conteudos com datas **distintas**, um por hora a partir de
 * 2026-10-01 00:00, guardados em ordem de `id` crescente — que e a ordem
 * **inversa** da que o legado declara (`post_date DESC`).
 */
function tabelaDeConteudo(quantos: number): readonly ConteudoConsultado[] {
  return Object.freeze(
    Array.from({ length: quantos }, (_valor, indice) => {
      const dia = 1 + Math.floor(indice / 24);
      const hora = indice % 24;
      return {
        id: indice + 1,
        identificadorNaUrl: `conteudo-${indice + 1}`,
        tipo: 'post',
        corpo: '',
        data: `2026-10-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:00:00`,
        senha: '',
      };
    }),
  );
}

/** O que o duplo do repositorio devolve a quem o declarou. */
interface RepositorioDeTeste {
  readonly repositorio: NonNullable<ContextoDaConsulta['repositorio']>;
  readonly recortes: RecorteDaListagem[];
}

/**
 * O duplo do repositorio: registra o recorte pedido, **obedece** a ordenacao
 * declarada nele, recorta pela janela e informa o total ignorando a janela.
 *
 * E o que o legado faz com `ORDER BY post_date DESC LIMIT inicio, tamanho` mais
 * `SELECT FOUND_ROWS()` (`class-wp-query.php:2516`, `:2823` e `:3712`), sem
 * banco. O duplo so conhece a chave `post_date`: e a unica que os cinco casos
 * pedem, e qualquer outra o faz lancar em vez de inventar uma ordem.
 */
function repositorioQueOrdenaERecorta(
  tabela: readonly ConteudoConsultado[],
  comandos: string[],
): RepositorioDeTeste {
  const recortes: RecorteDaListagem[] = [];
  return {
    repositorio: (_criterios, _tipos, recorte) => {
      comandos.push('repositorio.ler');
      recortes.push(recorte);
      const ordenada = [...tabela];
      for (const { chave, direcao } of [...recorte.ordenacao.chaves].reverse()) {
        if (chave !== CAMPO_DE_ORDENACAO_PADRAO) {
          throw new Error(`o duplo nao sabe ordenar por ${chave}`);
        }
        const sinal = direcao === 'ASC' ? 1 : -1;
        ordenada.sort((a, b) => sinal * a.data.localeCompare(b.data));
      }
      const { janela } = recorte.paginacao;
      if (janela === undefined) {
        return { conteudos: ordenada };
      }
      return {
        conteudos: ordenada.slice(janela.inicio, janela.inicio + janela.tamanho),
        totalEncontrado: ordenada.length,
      };
    },
    recortes,
  };
}

/** A configuracao de fabrica com o tamanho da pagina trocado pela opcao. */
function configuracaoCom(itensPorPagina: number): ConfiguracaoDoSiteNaConsulta {
  return { ...CONFIGURACAO_DE_FABRICA, itensPorPagina };
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
// UT-040-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-040-1 usa 10 itens por pagina enquanto nada e configurado e respeita o valor configurado', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const tabela = tabelaDeConteudo(37);

  // Dado: nada configurado — o contexto nao traz `configuracao`, e o default e
  // o da instalacao nova. Quando: o visitante pede a home.
  const semConfigurar = repositorioQueOrdenaERecorta(tabela, comandos);
  const nadaConfigurado = modulo.atender(HOME, {
    contexto: { repositorio: semConfigurar.repositorio },
  });

  // Entao: a pagina tem 10 itens (`class-wp-query.php:2013-2014` le a opcao,
  // que nasce em 10 em `schema.php:434`).
  assert.equal(nadaConfigurado.consulta?.recorte.paginacao.itensPorPagina, 10);
  assert.deepEqual(semConfigurar.recortes[0]?.paginacao.janela, {
    inicio: 0,
    tamanho: 10,
  });
  assert.equal(nadaConfigurado.consulta?.contagem, 10);
  assert.equal(nadaConfigurado.resposta.codigoHttp, 200);

  // Dado: a opcao do site configurada em 5. Quando: a mesma visita.
  const configurado = repositorioQueOrdenaERecorta(tabela, comandos);
  const comCinco = modulo.atender(HOME, {
    contexto: {
      repositorio: configurado.repositorio,
      configuracao: configuracaoCom(5),
    },
  });

  // Entao: o valor configurado e respeitado, e o numero de paginas acompanha.
  assert.equal(comCinco.consulta?.recorte.paginacao.itensPorPagina, 5);
  assert.deepEqual(configurado.recortes[0]?.paginacao.janela, {
    inicio: 0,
    tamanho: 5,
  });
  assert.equal(comCinco.consulta?.contagem, 5);
  assert.equal(comCinco.consulta?.totalDePaginas, 8);

  // A porta de dados nao recebeu comando nenhum.
  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-040-2 · `feliz`
// ---------------------------------------------------------------------------

test('UT-040-2 informa na resposta a pagina corrente e o total de paginas', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const { repositorio, recortes } = repositorioQueOrdenaERecorta(
    tabelaDeConteudo(37),
    comandos,
  );

  // Dado: 37 conteudos publicos e o tamanho de fabrica. Quando: o visitante
  // pede a segunda pagina da home.
  const atendimento = modulo.atender(homeNaPagina(2), {
    contexto: { repositorio },
  });

  // Entao: a resposta diz em que pagina esta e quantas existem —
  // `ceil( 37 / 10 )` = 4 (`class-wp-query.php:3738`).
  assert.equal(atendimento.consulta?.recorte.paginacao.paginaCorrente, 2);
  assert.equal(atendimento.consulta?.totalEncontrado, 37);
  assert.equal(atendimento.consulta?.totalDePaginas, 4);
  assert.equal(atendimento.consulta?.tipos.paginado, true);
  assert.equal(atendimento.resposta.codigoHttp, 200);

  // E a pagina servida e a segunda: a janela comeca no 11o registro
  // (`class-wp-query.php:2821`, `( $page - 1 ) * posts_per_page`).
  assert.deepEqual(recortes[0]?.paginacao.janela, { inicio: 10, tamanho: 10 });
  assert.equal(atendimento.consulta?.contagem, 10);
  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-040-3 · `erro`
// ---------------------------------------------------------------------------

test('UT-040-3 devolve a resposta de endereco sem correspondencia para pagina alem do total', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const tabela = tabelaDeConteudo(37);

  // A referencia: o que o modulo responde a um endereco que nao casa com
  // conteudo nenhum — o conteudo 999 nao existe na tabela.
  const semCorrespondencia = modulo.atender(
    { uriPedida: '/?p=999', parametrosDeConsulta: { p: '999' } },
    {
      contexto: {
        repositorio: () => ({ conteudos: [] }),
      },
    },
  );
  assert.equal(semCorrespondencia.resposta.codigoHttp, 404);

  // Dado: 37 conteudos em paginas de 10, logo 4 paginas. Quando: o visitante
  // pede a quinta.
  const alemDoTotal = modulo.atender(homeNaPagina(5), {
    contexto: {
      repositorio: repositorioQueOrdenaERecorta(tabela, comandos).repositorio,
    },
  });

  // Entao: a resposta e a MESMA do endereco sem correspondencia — 404, consulta
  // marcada como nao encontrada e sem cache (`class-wp.php:799-802`). A lista
  // vazia com `is_paged()` verdadeiro nao passa pelas excecoes do ramo 3
  // (`class-wp.php:784`), que salvariam a home sem paginacao.
  assert.deepEqual(alemDoTotal.resposta, semCorrespondencia.resposta);
  assert.equal(alemDoTotal.resposta.codigoHttp, 404);
  assert.equal(alemDoTotal.resposta.naoEncontrado, true);
  assert.equal(alemDoTotal.resposta.semCache, true);
  assert.equal(alemDoTotal.consulta?.tipos.naoEncontrado, true);
  assert.equal(alemDoTotal.consulta?.contagem, 0);

  // E a ultima pagina real, a quarta, com 7 itens, nao e "alem do total".
  const ultima = modulo.atender(homeNaPagina(4), {
    contexto: {
      repositorio: repositorioQueOrdenaERecorta(tabela, comandos).repositorio,
    },
  });
  assert.equal(ultima.consulta?.contagem, 7);
  assert.equal(ultima.resposta.codigoHttp, 200);
  assert.equal(ultima.resposta.naoEncontrado, false);

  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-040-4 · `borda`
// ---------------------------------------------------------------------------

test('UT-040-4 mantem a ordenacao estavel na fronteira entre duas paginas', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const tabela = tabelaDeConteudo(37);

  // Dado: 37 conteudos guardados na ordem inversa da declarada. Quando: o
  // visitante pede a pagina 1 e depois a pagina 2, em requisicoes separadas.
  const primeira = repositorioQueOrdenaERecorta(tabela, comandos);
  const paginaUm = modulo.atender(homeNaPagina(1), {
    contexto: { repositorio: primeira.repositorio },
  });
  const segunda = repositorioQueOrdenaERecorta(tabela, comandos);
  const paginaDois = modulo.atender(homeNaPagina(2), {
    contexto: { repositorio: segunda.repositorio },
  });

  // Entao: a ordem e declarada no recorte, e e a mesma nas duas paginas —
  // `post_date DESC` (`class-wp-query.php:2516`, direcao de `:1828`).
  const ordemDeclarada = {
    direcao: 'DESC',
    chaves: [{ chave: CAMPO_DE_ORDENACAO_PADRAO, direcao: 'DESC' }],
    peloPadrao: true,
  };
  assert.deepEqual(primeira.recortes[0]?.ordenacao, ordemDeclarada);
  assert.deepEqual(segunda.recortes[0]?.ordenacao, ordemDeclarada);

  // As janelas sao contiguas: a segunda comeca onde a primeira acabou.
  assert.deepEqual(primeira.recortes[0]?.paginacao.janela, {
    inicio: 0,
    tamanho: 10,
  });
  assert.deepEqual(segunda.recortes[0]?.paginacao.janela, {
    inicio: 10,
    tamanho: 10,
  });

  // Na fronteira: o ultimo da pagina 1 e o 28 e o primeiro da pagina 2 e o 27 —
  // vizinhos na ordem declarada, o primeiro mais novo que o segundo.
  const idsUm = paginaUm.consulta?.conteudos.map((linha) => linha.id) ?? [];
  const idsDois = paginaDois.consulta?.conteudos.map((linha) => linha.id) ?? [];
  assert.equal(idsUm.at(-1), 28);
  assert.equal(idsDois[0], 27);
  const ultimoDaUm = paginaUm.consulta?.conteudos.at(-1);
  const primeiroDaDois = paginaDois.consulta?.conteudos[0];
  assert.ok(ultimoDaUm !== undefined && primeiroDaDois !== undefined);
  assert.ok(ultimoDaUm.data > primeiroDaDois.data);

  // Nenhum registro aparece nas duas paginas, e nenhum fica entre elas: juntas
  // sao os 20 mais novos, na ordem declarada.
  assert.deepEqual(
    idsUm.filter((id) => idsDois.includes(id)),
    [],
  );
  assert.deepEqual(
    [...idsUm, ...idsDois],
    Array.from({ length: 20 }, (_valor, indice) => 37 - indice),
  );
  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-040-5 · `borda` — a regra de negocio
// ---------------------------------------------------------------------------

test('UT-040-5 nasce com 10 como tamanho de pagina sem ninguem ter escolhido', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));

  // Dado: a instalacao nova, em que ninguem escolheu tamanho. O valor que o
  // instalador semeia e 10 (`schema.php:434`), e e o default do contexto.
  assert.equal(ITENS_POR_PAGINA_DE_FABRICA, 10);
  assert.equal(CONFIGURACAO_DE_FABRICA.itensPorPagina, 10);

  // Quando: a listagem tem exatamente 10 conteudos. Entao: cabem numa pagina.
  const dez = modulo.atender(HOME, {
    contexto: {
      repositorio: repositorioQueOrdenaERecorta(tabelaDeConteudo(10), comandos)
        .repositorio,
    },
  });
  assert.equal(dez.consulta?.contagem, 10);
  assert.equal(dez.consulta?.totalDePaginas, 1);

  // Quando: a listagem tem 11. Entao: o 11o vai para a segunda pagina — e o
  // tamanho 10 que define a pagina publica, e nao um numero do repositorio.
  const onzeNaUm = modulo.atender(HOME, {
    contexto: {
      repositorio: repositorioQueOrdenaERecorta(tabelaDeConteudo(11), comandos)
        .repositorio,
    },
  });
  assert.equal(onzeNaUm.consulta?.contagem, 10);
  assert.equal(onzeNaUm.consulta?.totalEncontrado, 11);
  assert.equal(onzeNaUm.consulta?.totalDePaginas, 2);

  const onzeNaDois = modulo.atender(homeNaPagina(2), {
    contexto: {
      repositorio: repositorioQueOrdenaERecorta(tabelaDeConteudo(11), comandos)
        .repositorio,
    },
  });
  assert.equal(onzeNaDois.consulta?.contagem, 1);
  assert.deepEqual(
    onzeNaDois.consulta?.conteudos.map((linha) => linha.id),
    [1],
  );
  assert.equal(onzeNaDois.resposta.codigoHttp, 200);

  // E o valor resolvido volta aos criterios que o tema le
  // (`class-wp-query.php:2014`, sobre `$query_vars` por referencia).
  assert.equal(onzeNaUm.consulta?.criterios['posts_per_page'], 10);
  assert.deepEqual(comandos, [
    'repositorio.ler',
    'repositorio.ler',
    'repositorio.ler',
  ]);
});
