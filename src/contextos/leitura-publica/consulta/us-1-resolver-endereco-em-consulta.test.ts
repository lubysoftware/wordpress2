/**
 * Testes de **T003** — US-1, *"resolver o endereco pedido numa consulta de
 * conteudo"*, com os quatro criterios de aceite da tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-1.1 | o endereco amigavel e traduzido em criterios por um conjunto de regras **declaradas** |
 * | CA-1.2 | os mesmos criterios podem ser informados direto, e produzem o mesmo resultado |
 * | CA-1.3 | trocar a forma dos enderecos nao exige alterar o conteudo gravado |
 * | CA-1.4 | endereco de um conteudo e endereco de uma listagem sao distinguiveis pela resposta |
 *
 * Mais o que T003 entrega e que nao e critario de aceite proprio: os tres ramos
 * de excecao de `handle_404` (`wp-includes/class-wp.php:749-796`), sem os quais
 * **toda** leitura responderia 404, e os tres pontos de extensao novos.
 *
 * **Nao sao os testes do catalogo.** Os cinco casos `UT-038-1` a `UT-038-5` de
 * `backlog/tests.md` sao de **T004**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o critario de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** O repositorio de conteudo, os dois
 * registros, o `get_page_by_path()` e o `is_user_member_of_blog()` sao duplos que
 * **registram chamada** em vez de simular banco — e e assim que se afirma o caso
 * em que o legado nao emite comando nenhum, que e o CA-1.3.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  consultaDeListagem,
  consultarConteudo,
  consultaSingular,
  criarModuloDeLeituraPublica,
  fonteFixaDeRegras,
  registroDeTaxonomias,
  registroDeTipos,
  tabelaDeRegras,
  type AnaliseDaConsulta,
  type ConsultaDeConteudo,
  type ConteudoConsultado,
  type ContextoDaConsulta,
  type CriteriosDaConsulta,
  type EnderecoPedido,
  type PortasDeLeituraPublica,
  type RegraDeTraducao,
  type TiposDeConsulta,
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

/** Um conteudo gravado, nos cinco campos que T003 le. */
function conteudo(
  parcial: Partial<ConteudoConsultado> & { readonly id: number },
): ConteudoConsultado {
  return {
    identificadorNaUrl: 'ola-mundo',
    tipo: 'post',
    corpo: '',
    data: '2026-10-11 09:00:00',
    ...parcial,
  };
}

/** O duplo do repositorio: registra o que lhe pediram e devolve o que tem. */
function repositorioDeTeste(linhas: readonly ConteudoConsultado[] = []): {
  readonly repositorio: NonNullable<ContextoDaConsulta['repositorio']>;
  readonly pedidos: { criterios: CriteriosDaConsulta; tipos: TiposDeConsulta }[];
} {
  const pedidos: {
    criterios: CriteriosDaConsulta;
    tipos: TiposDeConsulta;
  }[] = [];
  return {
    repositorio: (criterios, tipos) => {
      pedidos.push({ criterios, tipos });
      return { conteudos: linhas };
    },
    pedidos,
  };
}

/**
 * A forma de endereco do exemplo, declarada como **dado**: ano, mes e
 * identificador na URL.
 *
 * E a mesma consulta que `WP_Rewrite` gera na forma
 * `tagname=$matches[i]` (`wp-includes/class-wp-rewrite.php:920-922`).
 */
const REGRA_POR_DATA: RegraDeTraducao = {
  padrao: '([0-9]{4})/([0-9]{2})/([^/]+)/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]&name=$matches[3]',
};

/** A MESMA regra sob outro prefixo: so a tabela muda, o conteudo nao. */
const REGRA_POR_DATA_SOB_ARQUIVO: RegraDeTraducao = {
  padrao: 'arquivo/([0-9]{4})/([0-9]{2})/([^/]+)/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]&name=$matches[3]',
};

/** O endereco amigavel do exemplo. */
const ENDERECO_AMIGAVEL: EnderecoPedido = { uriPedida: '/2026/10/ola-mundo/' };

// ---------------------------------------------------------------------------
// CA-1.1
// ---------------------------------------------------------------------------

test('CA-1.1 o endereco amigavel e traduzido em criterios pela regra declarada, e a consulta os recebe', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const { repositorio, pedidos } = repositorioDeTeste([conteudo({ id: 7 })]);

  const atendimento = modulo.atender(ENDERECO_AMIGAVEL, {
    resolucao: {
      fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
    },
    contexto: { repositorio },
  });

  // Os criterios sao os que a regra declara, e so eles.
  assert.deepEqual({ ...atendimento.resolucao.criterios }, {
    year: '2026',
    monthnum: '10',
    name: 'ola-mundo',
  });
  assert.equal(atendimento.resolucao.regraCasada, REGRA_POR_DATA.padrao);
  assert.equal(atendimento.resolucao.permalinkResolvido, true);

  // E a consulta foi executada uma vez, com eles — ja moldados por
  // `parse_query`: `year` e `monthnum` chegam como **numero** (`absint`).
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0]?.criterios['year'], 2026);
  assert.equal(pedidos[0]?.criterios['monthnum'], 10);
  assert.equal(pedidos[0]?.criterios['name'], 'ola-mundo');
  assert.equal(atendimento.consulta?.contagem, 1);
  assert.equal(atendimento.consulta?.conteudo?.id, 7);
});

test('CA-1.1 endereco que nao casa regra nenhuma nao inventa criterio: vira a marca de erro, e a consulta se marca sozinha', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const { repositorio, pedidos } = repositorioDeTeste();

  const atendimento = modulo.atender(
    { uriPedida: '/isto-nao-existe/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
      },
      contexto: { repositorio },
    },
  );

  // `parse_request` poe `error` em `'404'` (`class-wp.php:167` e `:398-400`) e
  // nenhum outro criterio.
  assert.deepEqual({ ...atendimento.resolucao.criterios }, { error: '404' });

  // A consulta le o criterio e se marca sozinha (`class-wp-query.php:1148`), e
  // `set_404()` **zera** os predicados (`:1846`).
  assert.equal(atendimento.consulta?.tipos.naoEncontrado, true);
  assert.equal(atendimento.consulta?.tipos.inicio, false);
  assert.equal(atendimento.consulta?.tipos.singular, false);

  // ⚠️ E `handle_404` desiste no comeco, sem declarar codigo: quem emite o 404
  // deste caminho e o envio de cabecalhos, a partir do criterio `error`
  // (`class-wp.php:455-466`). Este e o primeiro dos dois caminhos de 404, e ele
  // **nao** passa pelos tres ramos de excecao.
  assert.equal(atendimento.resposta.naoEncontrado, true);
  assert.equal(atendimento.resposta.codigoHttp, null);

  // E a consulta foi ao repositorio mesmo assim: `query()` nao olha `is_404`.
  assert.equal(pedidos.length, 1);
});

// ---------------------------------------------------------------------------
// CA-1.2
// ---------------------------------------------------------------------------

test('CA-1.2 o endereco amigavel e os criterios diretos produzem a MESMA consulta, inclusive na ordem de insercao', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const linhas = [conteudo({ id: 7 }), conteudo({ id: 9 })];

  const porEndereco = modulo.atender(ENDERECO_AMIGAVEL, {
    resolucao: {
      fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
    },
    contexto: { repositorio: repositorioDeTeste(linhas).repositorio },
  });

  // Sem tabela de regras — o default de fabrica de uma instalacao nova de site
  // unico (`wp-admin/includes/schema.php:443`) — e com os criterios vindo dos
  // parametros da requisicao.
  const porCriterios = modulo.atender(
    {
      uriPedida: '/?year=2026&monthnum=10&name=ola-mundo',
      parametrosDeConsulta: {
        year: '2026',
        monthnum: '10',
        name: 'ola-mundo',
      },
    },
    { contexto: { repositorio: repositorioDeTeste(linhas).repositorio } },
  );

  assert.deepEqual(
    Object.entries(porEndereco.consulta?.criterios ?? {}),
    Object.entries(porCriterios.consulta?.criterios ?? {}),
  );
  assert.deepEqual(
    porEndereco.consulta?.tipos,
    porCriterios.consulta?.tipos,
  );
  assert.deepEqual(
    porEndereco.consulta?.conteudos,
    porCriterios.consulta?.conteudos,
  );
  assert.equal(porEndereco.resposta.codigoHttp, porCriterios.resposta.codigoHttp);
});

test('CA-1.2 o criterio proprio de um tipo de conteudo e o par `post_type` + `name` produzem a mesma consulta', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const contexto: ContextoDaConsulta = {
    tiposDeConteudo: registroDeTipos([
      {
        nome: 'livro',
        criterioProprio: 'livro',
        consultavelPublicamente: true,
        interno: false,
        publico: true,
        temArquivo: false,
      },
    ]),
    repositorio: repositorioDeTeste([conteudo({ id: 3, tipo: 'livro' })])
      .repositorio,
  };

  // `register_post_type()` acrescenta o nome de criterio pelo ponto de extensao
  // `query_vars` (`class-wp.php:311`): sem ele na lista, o valor e descartado.
  const porCriterioProprio = modulo.atender(
    {
      uriPedida: '/?livro=dom-casmurro',
      parametrosDeConsulta: { livro: 'dom-casmurro' },
    },
    {
      resolucao: {
        pontosDeExtensao: {
          sobreOsNomesDeCriterio: [(nomes) => [...nomes, 'livro']],
        },
      },
      contexto,
    },
  );

  const porParDireto = modulo.atender(
    {
      uriPedida: '/?post_type=livro&name=dom-casmurro',
      parametrosDeConsulta: { post_type: 'livro', name: 'dom-casmurro' },
    },
    { contexto },
  );

  // `:349-352` preenche DOIS criterios a partir de um: o tipo e o
  // identificador na URL.
  assert.equal(porCriterioProprio.consulta?.criterios['post_type'], 'livro');
  assert.equal(porCriterioProprio.consulta?.criterios['name'], 'dom-casmurro');
  assert.deepEqual(porCriterioProprio.consulta?.tipos, porParDireto.consulta?.tipos);
  assert.deepEqual(
    porCriterioProprio.consulta?.conteudos,
    porParDireto.consulta?.conteudos,
  );
});

test('CA-1.2 o tipo de conteudo que nao e consultavel publicamente e descartado dos criterios', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  // `:376-387` — o filtro le `publicly_queryable`, e **nao**
  // `is_post_type_viewable()`: um tipo de fabrica publico sem
  // `publicly_queryable` e visivel e nao e consultavel.
  const resolucao = modulo.resolverEndereco(
    {
      uriPedida: '/?post_type=interno',
      parametrosDeConsulta: { post_type: 'interno' },
    },
    {
      contexto: {
        tiposDeConteudo: registroDeTipos([
          {
            nome: 'interno',
            criterioProprio: '',
            consultavelPublicamente: false,
            interno: true,
            publico: true,
            temArquivo: false,
          },
        ]),
      },
    },
  );

  assert.deepEqual({ ...resolucao.criterios }, {});
});

// ---------------------------------------------------------------------------
// CA-1.3
// ---------------------------------------------------------------------------

test('CA-1.3 trocar a forma dos enderecos troca a tabela de regras, e nenhum registro e tocado', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const gravado = conteudo({ id: 7, identificadorNaUrl: 'ola-mundo' });

  const primeira = repositorioDeTeste([gravado]);
  const antes = modulo.atender(ENDERECO_AMIGAVEL, {
    resolucao: {
      fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
    },
    contexto: {
      repositorio: primeira.repositorio,
      configuracao: {
        mostrarNaFrente: 'posts',
        paginaDaFrente: 0,
        paginaDeConteudos: 0,
        paginaDePoliticaDePrivacidade: 0,
        formaDosEnderecos: '/%year%/%monthnum%/%postname%/',
        // Os dois tamanhos de pagina de fabrica (T007): o que muda entre as
        // duas leituras deste teste e a forma do endereco, e so ela.
        itensPorPagina: 10,
        itensPorFeed: 10,
      },
    },
  });

  // A MESMA regra sob outro prefixo: o endereco muda, a tabela muda, o registro
  // nao.
  const segunda = repositorioDeTeste([gravado]);
  const depois = modulo.atender(
    { uriPedida: '/arquivo/2026/10/ola-mundo/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras([REGRA_POR_DATA_SOB_ARQUIVO]),
        ),
      },
      contexto: {
        repositorio: segunda.repositorio,
        configuracao: {
          mostrarNaFrente: 'posts',
          paginaDaFrente: 0,
          paginaDeConteudos: 0,
          paginaDePoliticaDePrivacidade: 0,
          formaDosEnderecos: '/arquivo/%year%/%monthnum%/%postname%/',
          itensPorPagina: 10,
          itensPorFeed: 10,
        },
      },
    },
  );

  // Os dois enderecos resolvem no MESMO conteudo, com os MESMOS criterios.
  assert.deepEqual(
    Object.entries(antes.consulta?.criterios ?? {}),
    Object.entries(depois.consulta?.criterios ?? {}),
  );
  assert.equal(antes.consulta?.conteudo?.id, 7);
  assert.equal(depois.consulta?.conteudo?.id, 7);

  // E o registro continua identico: nenhuma das duas leituras o alterou. A
  // pos-condicao de UC-01 e literal — *"nada muda no armazenamento"* e *"o
  // contador de visualizacoes nao existe"*.
  assert.deepEqual(antes.consulta?.conteudo, depois.consulta?.conteudo);
  assert.deepEqual(gravado, conteudo({ id: 7, identificadorNaUrl: 'ola-mundo' }));
  // O repositorio recebeu **leitura** nas duas, e a porta de dados deste modulo
  // nunca foi chamada (ela lanca, se for).
  assert.equal(primeira.pedidos.length, 1);
  assert.equal(segunda.pedidos.length, 1);
});

// ---------------------------------------------------------------------------
// CA-1.4
// ---------------------------------------------------------------------------

test('CA-1.4 endereco de um conteudo responde singular, e endereco de listagem responde colecao', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const singular = modulo.atender(ENDERECO_AMIGAVEL, {
    resolucao: {
      fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
    },
    contexto: { repositorio: repositorioDeTeste([conteudo({ id: 7 })]).repositorio },
  });

  const listagem = modulo.atender(
    { uriPedida: '/?cat=5', parametrosDeConsulta: { cat: '5' } },
    {
      contexto: {
        repositorio: repositorioDeTeste([
          conteudo({ id: 7 }),
          conteudo({ id: 9 }),
        ]).repositorio,
      },
    },
  );

  const tiposSingular = (singular.consulta as ConsultaDeConteudo).tipos;
  const tiposListagem = (listagem.consulta as ConsultaDeConteudo).tipos;

  assert.equal(consultaSingular(tiposSingular), true);
  assert.equal(consultaDeListagem(tiposSingular), false);
  assert.equal(singular.consulta?.tipos.unico, true);

  assert.equal(consultaDeListagem(tiposListagem), true);
  assert.equal(consultaSingular(tiposListagem), false);
  // `?cat=5` monta clausula de categoria (`class-wp-query.php:1260-1267`), que
  // liga `is_category` e dai `is_archive`.
  assert.equal(listagem.consulta?.tipos.categoria, true);
  assert.equal(listagem.consulta?.tipos.arquivo, true);
});

test('CA-1.4 a distincao NAO depende da contagem devolvida', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  // ⚠️ A distincao e propriedade da **consulta**, e por isso se le na etapa 3.
  // Depois do `handle_404`, um singular sem conteudo 404a e `set_404()` zera os
  // predicados (`class-wp-query.php:1846`) — ou seja, o endereco deixa de ser
  // `is_single`. Ler a distincao depois da decisao e ler outra coisa.
  const resolucao = modulo.resolverEndereco(ENDERECO_AMIGAVEL, {
    fonteDeRegras: fonteFixaDeRegras(tabelaDeRegras([REGRA_POR_DATA])),
  });

  // Singular que nao encontrou nada continua singular.
  const singularVazio = modulo.consultarConteudo(resolucao.criterios, {
    contexto: { repositorio: repositorioDeTeste([]).repositorio },
  });

  // Listagem com um registro so continua listagem.
  const listagemDeUm = modulo.consultarConteudo(
    { cat: '5' },
    { contexto: { repositorio: repositorioDeTeste([conteudo({ id: 7 })]).repositorio } },
  );

  assert.equal(singularVazio.contagem, 0);
  assert.equal(singularVazio.tipos.singular, true);
  assert.equal(listagemDeUm.contagem, 1);
  assert.equal(listagemDeUm.tipos.arquivo, true);
  assert.equal(listagemDeUm.tipos.singular, false);
});

test('CA-1.4 a listagem inicial e o que SOBRA, e e por ela que o conjunto vazio de criterios responde 200', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const atendimento = modulo.atender({ uriPedida: '/' });

  // `:1051-1055` — `is_home` liga quando nenhum dos onze predicados ligou. E o
  // caso da instalacao nova de site unico: sem tabela de regras, todo endereco
  // resolve para o conjunto vazio de criterios.
  assert.equal(atendimento.consulta?.tipos.inicio, true);
  assert.equal(atendimento.consulta?.tipos.singular, false);
  assert.equal(atendimento.consulta?.tipos.arquivo, false);
  assert.equal(atendimento.resposta.codigoHttp, 200);
});

// ---------------------------------------------------------------------------
// Os tres ramos de excecao de `handle_404`
// ---------------------------------------------------------------------------

test('ramo 1: `robots` nunca 404a aqui, mesmo sem conteudo nenhum', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  // `:749-752` — painel, `robots`, `favicon`, mapa do site e a folha de estilo
  // do mapa. O criterio `robots` e nome publico (`class-wp.php:18`).
  const atendimento = modulo.atender(
    { uriPedida: '/robots.txt', parametrosDeConsulta: { robots: '1' } },
    { contexto: { repositorio: repositorioDeTeste([]).repositorio } },
  );

  assert.equal(atendimento.consulta?.tipos.robots, true);
  assert.equal(atendimento.consulta?.contagem, 0);
  assert.equal(atendimento.resposta.naoEncontrado, false);
  assert.equal(atendimento.resposta.codigoHttp, 200);
});

test('ramo 2: havendo conteudo, a pagina interna pedida tem de caber na contagem de marcadores do corpo', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  // Um marcador no corpo: duas paginas internas (`:767`, a contagem mais um).
  const comDuasPaginas = conteudo({
    id: 7,
    corpo: 'primeira<!--nextpage-->segunda',
  });

  const regraComPagina: RegraDeTraducao = {
    padrao: '([^/]+)/pagina/([0-9]+)/?$',
    consulta: 'index.php?name=$matches[1]&page=$matches[2]',
  };
  const fonte = fonteFixaDeRegras(tabelaDeRegras([regraComPagina]));

  const dentro = modulo.atender(
    { uriPedida: '/ola-mundo/pagina/2/' },
    {
      resolucao: { fonteDeRegras: fonte },
      contexto: { repositorio: repositorioDeTeste([comDuasPaginas]).repositorio },
    },
  );
  const fora = modulo.atender(
    { uriPedida: '/ola-mundo/pagina/3/' },
    {
      resolucao: { fonteDeRegras: fonte },
      contexto: { repositorio: repositorioDeTeste([comDuasPaginas]).repositorio },
    },
  );

  assert.equal(dentro.resposta.codigoHttp, 200);
  assert.equal(dentro.resposta.naoEncontrado, false);
  // Pagina 3 de um corpo com 2: o legado 404a um endereco cujo conteudo existe.
  assert.equal(fora.resposta.codigoHttp, 404);
  assert.equal(fora.resposta.naoEncontrado, true);
  assert.equal(fora.resposta.semCache, true);
  // E o conteudo foi encontrado nas duas: o 404 vem da paginacao, nao da busca.
  assert.equal(fora.consulta?.contagem, 1);
});

test('ramo 2: corpo SEM marcador com pagina pedida nao tem conteudo, e isso 404a', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const atendimento = modulo.atender(
    { uriPedida: '/ola-mundo/pagina/2/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras([
            {
              padrao: '([^/]+)/pagina/([0-9]+)/?$',
              consulta: 'index.php?name=$matches[1]&page=$matches[2]',
            },
          ]),
        ),
      },
      contexto: {
        repositorio: repositorioDeTeste([conteudo({ id: 7, corpo: 'uma pagina so' })])
          .repositorio,
      },
    },
  );

  // `:768-770` — o `else` do teste do marcador poe `$content_found = false`.
  assert.equal(atendimento.consulta?.contagem, 1);
  assert.equal(atendimento.resposta.codigoHttp, 404);
});

test('ramo 3: arquivo de autor sem conteudo responde 200 se o autor e membro do site, e 404 se nao e', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const pedido: EnderecoPedido = {
    uriPedida: '/?author=7',
    parametrosDeConsulta: { author: '7' },
  };

  const membro = modulo.atender(pedido, {
    contexto: {
      repositorio: repositorioDeTeste([]).repositorio,
      contaMembroDoSite: (conta) => conta === 7,
    },
  });
  const naoMembro = modulo.atender(pedido, {
    contexto: {
      repositorio: repositorioDeTeste([]).repositorio,
      contaMembroDoSite: () => false,
    },
  });

  // `:787-788` — *"Don't 404 for authors without posts as long as they matched
  // an author on this site"*.
  assert.equal(membro.consulta?.tipos.autor, true);
  assert.equal(membro.resposta.codigoHttp, 200);
  assert.equal(naoMembro.resposta.codigoHttp, 404);
});

test('ramo 3: com paginacao de listagem, o ramo nao e consultado e 404a', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const semConteudo = () => repositorioDeTeste([]).repositorio;

  // Antes da decisao, a consulta e a listagem inicial na segunda pagina.
  const consulta = modulo.consultarConteudo(
    { paged: '2' },
    { contexto: { repositorio: semConteudo() } },
  );
  assert.equal(consulta.tipos.paginado, true);
  assert.equal(consulta.tipos.inicio, true);

  // `:784` — `elseif ( ! is_paged() )`. A segunda pagina de uma listagem vazia
  // 404a, e e esse ramo que CA-3.3 cobra em T007.
  const atendimento = modulo.atender(
    { uriPedida: '/?paged=2', parametrosDeConsulta: { paged: '2' } },
    { contexto: { repositorio: semConteudo() } },
  );

  assert.equal(atendimento.resposta.codigoHttp, 404);
  // E depois da decisao, `set_404()` zerou os predicados.
  assert.equal(atendimento.consulta?.tipos.paginado, false);
  assert.equal(atendimento.consulta?.tipos.naoEncontrado, true);
});

test('ao 404ar, `set_404()` zera os predicados da consulta e preserva os registros', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  // Ramo 2, caso de pagina interna fora de faixa: o conteudo FOI encontrado e a
  // resposta e 404 — e e esse o caso em que o zeramento aparece junto com
  // registro em maos.
  const atendimento = modulo.atender(
    { uriPedida: '/ola-mundo/pagina/9/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras([
            {
              padrao: '([^/]+)/pagina/([0-9]+)/?$',
              consulta: 'index.php?name=$matches[1]&page=$matches[2]',
            },
          ]),
        ),
      },
      contexto: {
        repositorio: repositorioDeTeste([
          conteudo({ id: 7, corpo: 'a<!--nextpage-->b' }),
        ]).repositorio,
      },
    },
  );

  assert.equal(atendimento.resposta.codigoHttp, 404);
  // `:1846` zera os 29, e e o estado zerado que a etapa 5 publica para o tema.
  assert.equal(atendimento.consulta?.tipos.naoEncontrado, true);
  assert.equal(atendimento.consulta?.tipos.unico, false);
  assert.equal(atendimento.consulta?.tipos.singular, false);
  // `set_404()` nao toca `$this->posts`: o registro continua em maos.
  assert.equal(atendimento.consulta?.contagem, 1);
  assert.equal(atendimento.consulta?.conteudo?.id, 7);
});

// ---------------------------------------------------------------------------
// Os pontos de extensao que T003 acrescentou (P2)
// ---------------------------------------------------------------------------

test('o ponto de acao `parse_query` ve a analise pronta e nao pode troca-la', () => {
  const vistas: AnaliseDaConsulta[] = [];

  const consulta = consultarConteudo(
    { p: '42' },
    {
      pontosDeExtensao: {
        aoAnalisar: [
          (analise) => {
            vistas.push(analise);
            assert.throws(() => {
              (analise as { taxonomia: unknown }).taxonomia = 'inventada';
            });
          },
        ],
      },
    },
  );

  assert.equal(vistas.length, 1);
  assert.equal(vistas[0]?.tipos.unico, true);
  assert.equal(consulta.criterios['p'], 42);
});

test('o ponto `pre_get_posts` altera os criterios que o repositorio recebe, e NAO reanalisa os predicados', () => {
  const { repositorio, pedidos } = repositorioDeTeste();

  const consulta = consultarConteudo(
    { p: '42' },
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        antesDeConsultar: [
          (criterios) => ({ ...criterios, posts_per_page: 5 }),
          (criterios) => ({ ...criterios, orderby: 'title' }),
        ],
      },
    },
  );

  // Dois interceptadores em sequencia, cada um recebendo o que o anterior
  // devolveu — e e o retorno do ultimo que vai ao repositorio.
  assert.equal(pedidos[0]?.criterios['posts_per_page'], 5);
  assert.equal(pedidos[0]?.criterios['orderby'], 'title');
  assert.equal(consulta.criterios['posts_per_page'], 5);

  // ⚠️ `pre_get_posts` dispara DEPOIS de `parse_query` (`:1903` e `:1916`), e o
  // legado nao reanalisa: `is_single` continua ligado por `p=42`.
  assert.equal(consulta.tipos.unico, true);
});

test('o ponto `the_posts` substitui a lista, e a contagem e o primeiro registro saem do resultado dele', () => {
  const { repositorio } = repositorioDeTeste([conteudo({ id: 7 })]);

  const consulta = consultarConteudo(
    {},
    {
      contexto: { repositorio },
      pontosDeExtensao: {
        sobreOsConteudos: [
          (conteudos) => [...conteudos, conteudo({ id: 9 })],
          (conteudos) => conteudos.slice(1),
        ],
      },
    },
  );

  // `:3649` e `:3664` — os dois sao recalculados **depois** do ponto de filtro.
  assert.deepEqual(
    consulta.conteudos.map((linha) => linha.id),
    [9],
  );
  assert.equal(consulta.contagem, 1);
  assert.equal(consulta.conteudo?.id, 9);
});

test('`the_posts` que devolve lista vazia deixa o primeiro registro AUSENTE, e nao nulo', () => {
  const { repositorio } = repositorioDeTeste([conteudo({ id: 7 })]);

  const consulta = consultarConteudo(
    {},
    {
      contexto: { repositorio },
      pontosDeExtensao: { sobreOsConteudos: [() => []] },
    },
  );

  // `:3665-3668` — o legado nao repoe `$this->post`, que `init()` havia feito
  // `unset`. O ramo 2 de `handle_404` depende dessa ausencia (`:763`).
  assert.equal('conteudo' in consulta, false);
  assert.equal(consulta.contagem, 0);
});

// ---------------------------------------------------------------------------
// Isolamento por requisicao (EXT-CONTEXTO, BR-MIGRAR-105)
// ---------------------------------------------------------------------------

test('duas leituras concorrentes com contextos diferentes nao se contaminam', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const taxonomias = registroDeTaxonomias([
    {
      nome: 'genero',
      criterioProprio: 'genero',
      consultavelPublicamente: true,
      hierarquicaNoEndereco: false,
    },
  ]);

  const primeira = modulo.atender(
    { uriPedida: '/?p=7', parametrosDeConsulta: { p: '7' } },
    { contexto: { repositorio: repositorioDeTeste([conteudo({ id: 7 })]).repositorio } },
  );
  const segunda = modulo.atender(
    {
      uriPedida: '/?taxonomy=genero&term=romance',
      parametrosDeConsulta: { taxonomy: 'genero', term: 'romance' },
    },
    {
      contexto: {
        taxonomias,
        repositorio: repositorioDeTeste([conteudo({ id: 9 })]).repositorio,
      },
    },
  );

  // Nenhuma contem elemento do recorte da outra — o cenario `@concorrencia` de
  // `PT-011`.
  assert.equal(primeira.consulta?.tipos.unico, true);
  assert.equal(primeira.consulta?.tipos.taxonomia, false);
  assert.deepEqual(primeira.consulta?.taxonomia.clausulas, []);
  assert.equal(primeira.consulta?.conteudo?.id, 7);

  assert.equal(segunda.consulta?.tipos.unico, false);
  assert.equal(segunda.consulta?.tipos.taxonomia, true);
  assert.equal(segunda.consulta?.taxonomia.clausulas.length, 1);
  assert.equal(segunda.consulta?.conteudo?.id, 9);
});
