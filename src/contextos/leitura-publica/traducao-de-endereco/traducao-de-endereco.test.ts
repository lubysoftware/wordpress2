/**
 * Testes da entrega de T002: *"as regras de traducao do legado estao declaradas
 * como dado, nao como codigo, e a mesma consulta pode ser montada pelo endereco
 * amigavel ou pelos criterios diretos"*.
 *
 * **Nao sao os testes de nenhuma historia.** Os de US-1 sao T004, um por caso de
 * `backlog/tests.md` (`UT-038-1` a `UT-038-5`), e nenhum deles e afirmado aqui:
 * a tarefa de teste escreve-os contra o contrato que T003 tiver entregado. Aqui
 * se afirma o que T002 entrega — a tabela como dado, a ordem dela, o casamento, a
 * traducao da cadeia de consulta e a coleta das quatro fontes —, mais os quirks
 * do legado que um porte "limpo" apaga em silencio, porque e isso que a proxima
 * onda nao tem como redescobrir.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adicionarBarras,
  codificarValorDeUrl,
  decodificarUrl,
  coletarCriterios,
  ehRecusaDeVariavelDivergente,
  fonteFixaDeRegras,
  NOMES_PRIVADOS_DE_CRITERIO,
  NOMES_PUBLICOS_DE_CRITERIO,
  REGRAS_DA_INSTALACAO_NA_RAIZ,
  REGRAS_DE_ARQUIVO_HERDADO,
  resolverEndereco,
  tabelaDeRegras,
  type CriteriosDeConsulta,
  type EnderecoPedido,
  type RegraDeTraducao,
  type ResolucaoDeEndereco,
  type TabelaDeRegras,
} from '../index.js';

/**
 * Uma regra de conteudo na forma que `WP_Rewrite` gera: padrao com grupos,
 * consulta com `$matches[N]` (`wp-includes/class-wp-rewrite.php:920-922`).
 */
const REGRA_DE_CONTEUDO: RegraDeTraducao = {
  padrao: '([0-9]{4})/([0-9]{1,2})/([^/]+)/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]&name=$matches[3]',
};

/** A tabela de uma instalacao que usa enderecos amigaveis de data e nome. */
const TABELA_DE_DATA_E_NOME = tabelaDeRegras([REGRA_DE_CONTEUDO]);

/** Resolve com uma tabela declarada, sem porta e sem estado. */
function resolverCom(
  tabela: TabelaDeRegras,
  pedido: EnderecoPedido,
): ResolucaoDeEndereco {
  return resolverEndereco(pedido, { fonteDeRegras: fonteFixaDeRegras(tabela) });
}

test('as duas listas de nomes sao as do legado, com a contagem e a ordem dele', () => {
  // `wp-includes/class-wp.php:18` e `:28`. A contagem mecanica das duas linhas
  // da 46 e 26 — e nao "47 e 25", como o cabecalho de T001 dizia.
  assert.equal(NOMES_PUBLICOS_DE_CRITERIO.length, 46);
  assert.equal(NOMES_PRIVADOS_DE_CRITERIO.length, 26);
  assert.equal(NOMES_PUBLICOS_DE_CRITERIO[0], 'm');
  assert.equal(NOMES_PUBLICOS_DE_CRITERIO[45], 'embed');
  assert.equal(NOMES_PRIVADOS_DE_CRITERIO[0], 'offset');
  assert.equal(NOMES_PRIVADOS_DE_CRITERIO[25], 'fields');

  // `post_type` esta nas DUAS listas, e e assim no legado.
  assert.ok(NOMES_PUBLICOS_DE_CRITERIO.includes('post_type'));
  assert.ok(NOMES_PRIVADOS_DE_CRITERIO.includes('post_type'));

  // `error` e nome publico, e e por isso que uma regra de traducao consegue
  // produzir resposta de erro (`class-wp-rewrite.php:1296`).
  assert.ok(NOMES_PUBLICOS_DE_CRITERIO.includes('error'));
});

test('um endereco amigavel e traduzido em criterios pela tabela declarada', () => {
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/2026/10/ola-mundo/',
  });

  assert.deepEqual(
    { ...resolucao.criterios },
    { year: '2026', monthnum: '10', name: 'ola-mundo' },
  );
  // As quatro propriedades publicas de `WP` que o casamento preenche.
  assert.equal(resolucao.caminhoDaRequisicao, '2026/10/ola-mundo');
  assert.equal(resolucao.regraCasada, REGRA_DE_CONTEUDO.padrao);
  assert.equal(
    resolucao.consultaCasada,
    'year=2026&monthnum=10&name=ola-mundo',
  );
  assert.equal(resolucao.permalinkResolvido, true);
});

test('os mesmos criterios informados diretamente produzem o mesmo resultado', () => {
  // A entrega de T002 em uma linha. A tabela vazia e a instalacao nova de site
  // unico (`wp-admin/includes/schema.php:443`), onde nao HA endereco amigavel.
  const pelaTabela = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/2026/10/ola-mundo/',
  });
  const direto = resolverEndereco({
    uriPedida: '/',
    parametrosDeConsulta: {
      year: '2026',
      monthnum: '10',
      name: 'ola-mundo',
    },
  });

  assert.deepEqual({ ...direto.criterios }, { ...pelaTabela.criterios });
  // E a ordem de insercao tambem, porque e ela que `WP::build_query_string()`
  // percorre para montar o argumento do ponto de extensao `query_string`
  // (`class-wp.php:612`).
  assert.deepEqual(Object.keys(direto.criterios), [
    'year',
    'monthnum',
    'name',
  ]);
  assert.deepEqual(
    Object.keys(pelaTabela.criterios),
    Object.keys(direto.criterios),
  );

  // O que distingue os dois caminhos nao sao os criterios: e o rastro do
  // casamento, que CA-1.4 vai cobrar na resposta.
  assert.equal(direto.regraCasada, '');
  assert.equal(direto.permalinkResolvido, false);
});

test('trocar a tabela troca a traducao sem tocar em nada mais', () => {
  // CA-1.3 em forma de infraestrutura: as regras sao dado. A mesma URI, duas
  // tabelas, dois conjuntos de criterios — e nenhuma linha de codigo diferente.
  const porNome = tabelaDeRegras([
    { padrao: '([^/]+)/?$', consulta: 'index.php?name=$matches[1]' },
  ]);
  const porIdentificador = tabelaDeRegras([
    { padrao: '([0-9]+)/?$', consulta: 'index.php?p=$matches[1]' },
  ]);

  assert.deepEqual({ ...resolverCom(porNome, { uriPedida: '/42/' }).criterios }, {
    name: '42',
  });
  assert.deepEqual(
    { ...resolverCom(porIdentificador, { uriPedida: '/42/' }).criterios },
    { p: '42' },
  );
});

test('a tabela para na PRIMEIRA regra que casa, e a ordem e a da tabela', () => {
  const primeiraGanha = tabelaDeRegras([
    { padrao: '(.+)/?$', consulta: 'index.php?pagename=$matches[1]' },
    REGRA_DE_CONTEUDO,
  ]);

  const resolucao = resolverCom(primeiraGanha, {
    uriPedida: '/2026/10/ola-mundo/',
  });

  // `class-wp.php:261-263`: `break` na primeira que casa.
  assert.equal(resolucao.regraCasada, '(.+)/?$');
  assert.deepEqual({ ...resolucao.criterios }, { pagename: '2026/10/ola-mundo' });
});

test('endereco que nao casa regra nenhuma marca o criterio `error` em 404', () => {
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/nao-existe/',
  });

  // `:167` com `:398-400`. E o PRIMEIRO dos dois caminhos de 404 do legado: a
  // consulta se marca sozinha a partir deste criterio
  // (`class-wp-query.php:1148-1150`) e o codigo sai do envio de cabecalhos
  // (`class-wp.php:455-466`), sem passar por `handle_404`.
  assert.deepEqual({ ...resolucao.criterios }, { error: '404' });
  assert.equal(resolucao.regraCasada, '');
  assert.equal(resolucao.permalinkResolvido, true);
});

test('sem tabela de regras nao ha erro nenhum, porque o bloco nao roda', () => {
  // `if ( ! empty( $rewrite ) )` (`:165`). Numa instalacao nova de site unico a
  // tabela esta vazia (`class-wp-rewrite.php:1279-1281`), e um endereco que nao
  // leva a nada **nao** e 404 aqui: quem decide passa a ser a consulta.
  const resolucao = resolverEndereco({ uriPedida: '/nao-existe/' });

  assert.deepEqual({ ...resolucao.criterios }, {});
  assert.equal(resolucao.caminhoDaRequisicao, '');
  assert.equal(resolucao.permalinkResolvido, false);
});

test('a regra que casa apaga o `error` tambem do arranjo da consulta', () => {
  // `unset( $error, $_GET['error'] )` (`:282`): sao os dois no mesmo comando, e
  // esquecer o segundo faz a coleta trazer o erro de volta.
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/2026/10/ola-mundo/',
    parametrosDeConsulta: { error: '403' },
  });

  assert.equal(resolucao.criterios['error'], undefined);
});

test('o caminho vazio tenta SO a regra de raiz, e nao a primeira tolerante', () => {
  const tabela = tabelaDeRegras([
    { padrao: '.*', consulta: 'index.php?name=qualquer-coisa' },
    { padrao: '$', consulta: 'index.php?paged=1' },
  ]);

  const resolucao = resolverCom(tabela, { uriPedida: '/' });

  // `:221-227`: o legado procura a chave `'$'` direto, sem percorrer a tabela.
  assert.equal(resolucao.regraCasada, '$');
  assert.deepEqual({ ...resolucao.criterios }, { paged: '1' });
});

test('o endereco `/0/` conta como caminho vazio, porque `empty()` do legado inclui o zero', () => {
  const tabela = tabelaDeRegras([
    { padrao: '([0-9]+)/?$', consulta: 'index.php?p=$matches[1]' },
    { padrao: '$', consulta: 'index.php?paged=1' },
  ]);

  const resolucao = resolverCom(tabela, { uriPedida: '/0/' });

  // `empty( '0' )` e verdadeiro (`:221`): o caminho `0` nao percorre a tabela,
  // casa a regra de raiz, e sai do bloco com o erro desfeito (`:287-296`).
  assert.equal(resolucao.regraCasada, '$');
  assert.equal(resolucao.criterios['p'], undefined);
  assert.equal(resolucao.criterios['error'], undefined);
  assert.equal(resolucao.permalinkResolvido, false);
});

test('pedido para o proprio arquivo da instalacao desfaz o erro e o permalink', () => {
  // Requisicao por `PATH_INFO`: o caminho pedido vem do `PATH_INFO` (`:204-205`)
  // e o arquivo pedido e o script (`:215`), logo `$requested_file === $self`
  // (`:287`) — mesmo com caminho pedido cheio.
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/wp-content/plugins/x.php/foo',
    caminhoDeInfo: '/foo',
    scriptPedido: '/wp-content/plugins/x.php',
  });

  assert.equal(resolucao.caminhoDaRequisicao, 'foo');
  assert.equal(resolucao.criterios['error'], undefined);
  assert.equal(resolucao.permalinkResolvido, false);
});

test('pedido do painel descarta os criterios da regra casada', () => {
  // `:292-294`: com `wp-admin/` no script, `$perma_query_vars` e descartado
  // inteiro. O teste do legado e `str_contains`, no script **como veio**.
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/2026/10/ola-mundo/',
    scriptPedido: '/wp-admin/edit.php',
  });

  assert.equal(resolucao.regraCasada, REGRA_DE_CONTEUDO.padrao);
  assert.deepEqual({ ...resolucao.criterios }, {});
  assert.equal(resolucao.permalinkResolvido, false);
});

test('o caminho da instalacao em subpasta sai da frente, sem diferenciar caixa', () => {
  // `:181` monta a expressao com a marca `i`, e `:194-201` a aplica nas tres
  // entradas do servidor.
  const resolucao = resolverCom(TABELA_DE_DATA_E_NOME, {
    uriPedida: '/Blog/2026/10/ola-mundo/',
    caminhoDaInstalacao: '/blog',
  });

  assert.equal(resolucao.caminhoDaRequisicao, '2026/10/ola-mundo');
  assert.equal(resolucao.criterios['name'], 'ola-mundo');
});

test('o alvo do casamento NAO reinicia a cada volta do laco', () => {
  // Quirk de `:220` com `:235`: a regra que se ancora no arquivo pedido muda o
  // alvo, e o alvo **continua mudado** para as regras seguintes. A primeira
  // regra aqui nao casa; a segunda so casa porque o alvo ficou prefixado.
  const tabela = tabelaDeRegras([
    { padrao: 'index.php/nao-casa-nada', consulta: 'index.php?p=1' },
    { padrao: 'index\\.php/.*ola-mundo$', consulta: 'index.php?name=ancorada' },
  ]);

  const resolucao = resolverCom(tabela, {
    uriPedida: '/index.php/2026/10/ola-mundo',
    caminhoDeInfo: '/2026/10/ola-mundo',
  });

  assert.equal(resolucao.regraCasada, 'index\\.php/.*ola-mundo$');
  assert.deepEqual({ ...resolucao.criterios }, { name: 'ancorada' });
});

test('o casamento e tentado duas vezes: como veio e decodificado', () => {
  // `:238-239`. O grupo capturado sai da tentativa que casou, e volta
  // codificado para a cadeia de consulta (`class-wp-matchesmapregex.php:88`),
  // que `parse_str` decodifica de novo.
  const tabela = tabelaDeRegras([
    { padrao: '([a-z]+ [a-z]+)$', consulta: 'index.php?name=$matches[1]' },
  ]);

  const resolucao = resolverCom(tabela, { uriPedida: '/ola%20mundo' });

  assert.equal(resolucao.consultaCasada, 'name=ola+mundo');
  assert.equal(resolucao.criterios['name'], 'ola mundo');
});

test('`$matches[0]` fica literal, e indice sem grupo vira texto vazio', () => {
  // O padrao de `WP_MatchesMapRegex` comeca em 1 (`:42` daquele arquivo), e o
  // `isset()` de `:88` resolve o indice ausente para texto vazio.
  const tabela = tabelaDeRegras([
    {
      padrao: '([^/]+)/?$',
      consulta: 'index.php?name=$matches[9]&s=$matches[0]',
    },
  ]);

  const resolucao = resolverCom(tabela, { uriPedida: '/ola-mundo/' });

  assert.equal(resolucao.criterios['name'], '');
  assert.equal(resolucao.criterios['s'], '$matches[0]');
});

test('a cadeia de consulta da regra passa por `addslashes`', () => {
  // `:273`. Heranca das `magic quotes`, e observavel: a barra chega ao criterio.
  const tabela = tabelaDeRegras([
    { padrao: 'busca/?$', consulta: "index.php?s=o'brien" },
  ]);

  const resolucao = resolverCom(tabela, { uriPedida: '/busca/' });

  assert.equal(resolucao.criterios['s'], "o\\'brien");
  assert.equal(adicionarBarras('a"b\\c'), 'a\\"b\\\\c');
});

test('a consulta da regra e recortada ate o ULTIMO interrogativo', () => {
  // `preg_replace( '!^.+\\?!', '', $query )` (`:270`) e guloso.
  const tabela = tabelaDeRegras([
    { padrao: 'x/?$', consulta: 'index.php?a=1?name=ultimo' },
  ]);

  assert.equal(
    resolverCom(tabela, { uriPedida: '/x/' }).criterios['name'],
    'ultimo',
  );
});

test('padrao que este runtime nao compila conta como nao casou', () => {
  // `preg_match` com padrao invalido devolve `false` no legado: nao casa, e nao
  // derruba a requisicao. A regra seguinte continua sendo tentada.
  const tabela = tabelaDeRegras([
    { padrao: '([0-9', consulta: 'index.php?p=1' },
    { padrao: '([^/]+)/?$', consulta: 'index.php?name=$matches[1]' },
  ]);

  assert.equal(
    resolverCom(tabela, { uriPedida: '/ola-mundo/' }).criterios['name'],
    'ola-mundo',
  );
});

test('criterio que a regra produz fora da lista de nomes e descartado', () => {
  const tabela = tabelaDeRegras([
    { padrao: 'x/?$', consulta: 'index.php?criterio_de_terceiro=1' },
  ]);

  // `:334` le a regra casada **so** para nome que esta na lista publica.
  assert.deepEqual({ ...resolverCom(tabela, { uriPedida: '/x/' }).criterios }, {});
});

test('o ponto de extensao `query_vars` faz o criterio de terceiro passar', () => {
  const tabela = tabelaDeRegras([
    { padrao: 'x/?$', consulta: 'index.php?criterio_de_terceiro=1' },
  ]);

  const resolucao = resolverEndereco(
    { uriPedida: '/x/' },
    {
      fonteDeRegras: fonteFixaDeRegras(tabela),
      pontosDeExtensao: {
        sobreOsNomesDeCriterio: [
          (nomes) => [...nomes, 'criterio_de_terceiro'],
        ],
      },
    },
  );

  // `:311`, e e exatamente para isto que o ponto existe: *"Needed to allow
  // custom rewrite rules using your own arguments to work"*.
  assert.equal(resolucao.criterios['criterio_de_terceiro'], '1');
});

test('o ponto de extensao `query_vars` tambem remove nome, e o criterio some', () => {
  const resolucao = resolverEndereco(
    { uriPedida: '/', parametrosDeConsulta: { p: '42', name: 'ola' } },
    {
      pontosDeExtensao: {
        sobreOsNomesDeCriterio: [
          (nomes) => nomes.filter((nome) => nome !== 'p'),
        ],
      },
    },
  );

  // O docblock do legado e literal: *"added, removed, or changed"*.
  assert.deepEqual({ ...resolucao.criterios }, { name: 'ola' });
});

test('a precedencia das quatro fontes e a do legado', () => {
  const tabela = tabelaDeRegras([
    { padrao: '([^/]+)/?$', consulta: 'index.php?name=$matches[1]&p=9&s=9' },
  ]);

  const resolucao = resolverEndereco(
    {
      uriPedida: '/da-regra/',
      parametrosDeConsulta: { name: 'da-consulta', p: 'da-consulta' },
      parametrosDeCorpo: { name: 'do-corpo' },
    },
    {
      fonteDeRegras: fonteFixaDeRegras(tabela),
      criteriosExtras: { name: 'do-extra' },
    },
  );

  // `:320-335`: extra, corpo, consulta, regra — nessa ordem.
  assert.equal(resolucao.criterios['name'], 'do-extra');
  assert.equal(resolucao.criterios['p'], 'da-consulta');
  assert.equal(resolucao.criterios['s'], '9');
});

test('o mesmo nome no corpo e na consulta com valores diferentes recusa a requisicao', () => {
  assert.throws(
    () =>
      resolverEndereco({
        uriPedida: '/',
        parametrosDeConsulta: { p: '42' },
        parametrosDeCorpo: { p: '7' },
      }),
    (erro: unknown) => {
      // `wp_die( ..., 400 )` em `:325-329`. Encerra a requisicao: nada depois
      // dela acontece.
      assert.ok(ehRecusaDeVariavelDivergente(erro));
      assert.equal(erro.codigoHttp, 400);
      assert.equal(erro.message, 'A variable mismatch has been detected.');
      assert.equal(erro.titulo, 'Sorry, you are not allowed to view this item.');
      return true;
    },
  );
});

test('o mesmo nome nos dois lados com o MESMO valor nao recusa nada', () => {
  // A comparacao do legado e `!==`: identica. Valor igual segue, e o corpo vence.
  const iguais = resolverEndereco({
    uriPedida: '/',
    parametrosDeConsulta: { p: '42', cat: ['3', '4'] },
    parametrosDeCorpo: { p: '42', cat: ['3', '4'] },
  });

  assert.equal(iguais.criterios['p'], '42');
  assert.deepEqual(iguais.criterios['cat'], ['3', '4']);

  // Lista com a mesma composicao em ordem diferente **nao** e identica.
  assert.throws(() =>
    resolverEndereco({
      uriPedida: '/',
      parametrosDeConsulta: { cat: ['3', '4'] },
      parametrosDeCorpo: { cat: ['4', '3'] },
    }),
  );
});

test('nome privado nao chega pela requisicao, e chega por `extra_query_vars`', () => {
  // A consequencia que US-3 depende: `posts_per_page` e nome PRIVADO (`:28`),
  // logo o visitante nao tem caminho para o tamanho da pagina publica.
  const pelaRequisicao = resolverEndereco({
    uriPedida: '/',
    parametrosDeConsulta: { posts_per_page: '999' },
  });
  assert.equal(pelaRequisicao.criterios['posts_per_page'], undefined);

  const porQuemChama = resolverEndereco(
    { uriPedida: '/' },
    { criteriosExtras: { posts_per_page: '5' } },
  );
  assert.equal(porQuemChama.criterios['posts_per_page'], '5');
});

test('`extra_query_vars` tambem chega como texto, e e analisado', () => {
  // `:153-158`: arranjo entra por referencia, texto nao vazio passa por
  // `parse_str`.
  const resolucao = resolverEndereco(
    { uriPedida: '/' },
    { criteriosExtras: 'p=42&cat[]=3&cat[]=4&posts_per_page=5' },
  );

  assert.equal(resolucao.criterios['p'], '42');
  assert.deepEqual(resolucao.criterios['cat'], ['3', '4']);
  assert.equal(resolucao.criterios['posts_per_page'], '5');
});

test('as regras fixas do legado estao declaradas como dado e traduzem', () => {
  // `class-wp-rewrite.php:1285-1297`. A segunda traduz para `error=403`, que e
  // como uma regra de traducao produz codigo HTTP.
  const tabela = tabelaDeRegras([
    ...REGRAS_DA_INSTALACAO_NA_RAIZ,
    ...REGRAS_DE_ARQUIVO_HERDADO,
  ]);

  assert.deepEqual({ ...resolverCom(tabela, { uriPedida: '/robots.txt' }).criterios }, {
    robots: '1',
  });
  assert.deepEqual({ ...resolverCom(tabela, { uriPedida: '/favicon.ico' }).criterios }, {
    favicon: '1',
  });
  assert.deepEqual({ ...resolverCom(tabela, { uriPedida: '/wp-rss2.php' }).criterios }, {
    feed: 'old',
  });
  assert.deepEqual({ ...resolverCom(tabela, { uriPedida: '/wp-app.php/x' }).criterios }, {
    error: '403',
  });
});

test('a regra verbosa de pagina so confirma com a pagina no caminho', () => {
  const regra: RegraDeTraducao = {
    padrao: '(.+)/?$',
    consulta: 'index.php?pagename=$matches[1]',
  };
  const semLigacao = tabelaDeRegras([regra], {
    usarRegrasVerbosasDePagina: true,
  });
  const comLigacao = tabelaDeRegras([regra], {
    usarRegrasVerbosasDePagina: true,
    paginaNoCaminho: (caminho) => caminho === 'sobre',
  });

  // `:242-259`: sem pagina no caminho, `continue` — a regra nao casa.
  assert.equal(resolverCom(semLigacao, { uriPedida: '/sobre/' }).regraCasada, '');
  assert.equal(
    resolverCom(comLigacao, { uriPedida: '/sobre/' }).regraCasada,
    regra.padrao,
  );
  assert.equal(resolverCom(comLigacao, { uriPedida: '/outra/' }).regraCasada, '');
});

test('a coleta e as operacoes de texto nao guardam estado entre chamadas', () => {
  // BR-MIGRAR-105 (`EXT-CONTEXTO`): nada aqui e estado de modulo. Duas coletas
  // com fontes diferentes nao se enxergam.
  const primeira = coletarCriterios({ parametrosDeConsulta: { p: '1' } });
  const segunda = coletarCriterios({ parametrosDeConsulta: { p: '2' } });

  assert.equal(primeira['p'], '1');
  assert.equal(segunda['p'], '2');
  assert.deepEqual({ ...coletarCriterios() }, {});
});

test('as duas codificacoes de URL sao as do interpretador do legado, e nao as do runtime', () => {
  // `urlencode`: espaco vira `+`, e os sete caracteres que
  // `encodeURIComponent` deixa passar sao escapados.
  assert.equal(codificarValorDeUrl('ola mundo'), 'ola+mundo');
  assert.equal(codificarValorDeUrl("a!~*'()"), 'a%21%7E%2A%27%28%29');
  assert.equal(codificarValorDeUrl('acao'), 'acao');
  assert.equal(codificarValorDeUrl('a-b_c.d'), 'a-b_c.d');

  // `urldecode`: `+` vira espaco, e sequencia malformada NAO e erro — e o que
  // impede a requisicao de morrer num endereco com por cento solto.
  assert.equal(decodificarUrl('ola+mundo'), 'ola mundo');
  assert.equal(decodificarUrl('50%-off'), '50%-off');
  // Os dois bytes de `%C3%A1` voltam a ser um caractere so.
  assert.equal(decodificarUrl('%C3%A1gua'), '\u00e1gua');
});

test('a coleta descarta criterio com chave nomeada, e isso esta declarado', () => {
  // 🔴 Lacuna declarada em `cadeia-de-consulta.ts`: `CriteriosDeConsulta`, como
  // T001 a declarou, nao representa arranjo com chave. Colchete vazio, que
  // produz lista, esta reproduzido. Nenhuma regra do nucleo usa a primeira forma.
  const tabela = tabelaDeRegras([
    { padrao: 'x/?$', consulta: 'index.php?cat[3]=a&tag[]=b' },
  ]);

  const criterios: CriteriosDeConsulta = resolverCom(tabela, {
    uriPedida: '/x/',
  }).criterios;

  assert.equal(criterios['cat'], undefined);
  assert.deepEqual(criterios['tag'], ['b']);
});
