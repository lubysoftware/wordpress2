/**
 * Testes de **T015** — US-7, *"servir o indice de sitemap conforme a opcao de
 * indexacao"*. Afirmam CA-7.1 a CA-7.6 e as duas regras de negocio da historia.
 *
 * Os casos do catalogo (`UT-145-1` a `UT-145-8`) sao de **T016**, a tarefa `[P]`
 * paralela; aqui se afirma o criterio de aceite contra a implementacao.
 *
 * ⚠️ **Os bytes esperados sairam do oraculo executavel**, e nao da leitura:
 * `scripts/oraculo/levantar.sh` (WordPress 7.1.2, PHP 8.3.35, instalacao nova
 * em `http://localhost:8080`, permalink `/%year%/%monthnum%/%day%/%postname%/`),
 * pedidos por `curl` em 2026-10-29. Para os vetores com a opcao desligada, sem
 * links permanentes e com conteudo protegido, a opcao e o conteudo foram
 * trocados no banco do oraculo, capturados e devolvidos ao estado da
 * instalacao. O contexto abaixo reproduz aquele site: `post`, `page` e
 * `attachment` publicos, `category` com um termo, uma conta autora.
 *
 * O duplo **registra** cada criterio de consulta, em vez de simular banco: e
 * assim que se afirma o literal de CA-7.2, a ausencia de filtro por senha de
 * CA-7.6 e a ausencia de consulta com a opcao desligada.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CABECALHOS_DE_NAO_GUARDAR,
  ENDERECOS_POR_PAGINA_DO_MAPA,
  OPCAO_DE_INDEXACAO,
  PAGINAS_DO_MAPA_NO_INDICE,
  REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE,
  absintComoNoPhp,
  conteudoDaMetaDeRobos,
  diretivasDeRobosDoNucleo,
  indexacaoLigada,
  iniciarServidorDoMapaDoSite,
  type ContextoDoMapaDoSite,
  type ConteudoNoMapaDoSite,
  type CriteriosDaConsultaDeContas,
  type CriteriosDaConsultaDeConteudo,
  type CriteriosDaConsultaDeTermos,
  type ValorDeOpcao,
  xmlDaPagina,
  xmlDoIndice,
} from './index.js';
import { criarModuloDeSuperficiesProgramaticas, type PortaDeDados } from '../index.js';

const SITE = 'http://localhost:8080';

interface ConteudoDoSite extends ConteudoNoMapaDoSite {
  readonly tipo: string;
  readonly estado: 'publish' | 'private' | 'draft';
  readonly senha: string;
  readonly endereco: string;
}

/** O conteudo da instalacao nova do oraculo. */
const OLA_MUNDO: ConteudoDoSite = {
  id: 1,
  tipo: 'post',
  estado: 'publish',
  senha: '',
  modificadoGmt: '2026-10-11 22:10:37',
  endereco: `${SITE}/2026/10/11/hello-world/`,
};
const PAGINA_DE_EXEMPLO: ConteudoDoSite = {
  id: 2,
  tipo: 'page',
  estado: 'publish',
  senha: '',
  modificadoGmt: '2026-10-11 22:10:37',
  endereco: `${SITE}/sample-page/`,
};
/** Os tres que foram acrescentados ao oraculo para CA-7.2 e CA-7.6. */
const COM_SENHA: ConteudoDoSite = {
  id: 6,
  tipo: 'post',
  estado: 'publish',
  senha: 'x',
  modificadoGmt: '2026-10-29 18:29:14',
  endereco: `${SITE}/2026/10/29/senha-cia/`,
};
const PRIVADO: ConteudoDoSite = { ...COM_SENHA, id: 7, estado: 'private', senha: '', endereco: `${SITE}/?p=7` };
const RASCUNHO: ConteudoDoSite = { ...COM_SENHA, id: 8, estado: 'draft', senha: '', endereco: `${SITE}/?p=8` };

interface Registro {
  conteudo: CriteriosDaConsultaDeConteudo[];
  termos: CriteriosDaConsultaDeTermos[];
  contas: CriteriosDaConsultaDeContas[];
}

interface Montagem {
  blogPublic?: ValorDeOpcao;
  usandoLinksPermanentes?: boolean;
  conteudos?: readonly ConteudoDoSite[];
  enderecosPorPagina?: number;
}

/**
 * O site do oraculo como contexto. A consulta de conteudo faz o que a consulta
 * publica faz com estes criterios — estado pedido, tipo, ordem por ID — e nada
 * alem: quem decide o que entra e o criterio, e o criterio e do mapa.
 */
function siteDoOraculo(montagem: Montagem = {}): { contexto: ContextoDoMapaDoSite; registro: Registro } {
  const registro: Registro = { conteudo: [], termos: [], contas: [] };
  const conteudos = montagem.conteudos ?? [OLA_MUNDO, PAGINA_DE_EXEMPLO];
  const usandoLinksPermanentes = montagem.usandoLinksPermanentes ?? true;

  const contexto: ContextoDoMapaDoSite = {
    opcoes: {
      blogPublic: montagem.blogPublic ?? OPCAO_DE_INDEXACAO.valorDeFabrica,
      showOnFront: 'posts',
      usandoLinksPermanentes,
    },
    enderecoInicial: (caminho) => `${SITE}/${caminho.replace(/^\//, '')}`,
    enderecoDoPainel: (caminho) => `${SITE}/wp-admin/${caminho}`,
    dataW3cDoSite: (gmt) => `${gmt.replace(' ', 'T')}+00:00`,
    tipos: {
      tiposDeConteudoPublicos: () => ['post', 'page', 'attachment'],
      tipoDeConteudoVisivel: (tipo) => tipo === 'post' || tipo === 'page' || tipo === 'attachment',
      taxonomiasPublicas: () => ['category', 'post_tag', 'post_format'],
      taxonomiaVisivel: () => true,
    },
    consultarConteudo(criterios) {
      registro.conteudo.push(criterios);
      const estados: readonly string[] =
        typeof criterios.post_status === 'string' ? [criterios.post_status] : criterios.post_status;
      const achados = conteudos
        .filter((c) => c.tipo === criterios.post_type && estados.includes(c.estado))
        .sort((a, b) => a.id - b.id);
      const porPagina = montagem.enderecosPorPagina ?? criterios.posts_per_page ?? 10;
      const pagina = criterios.paged ?? 1;
      return {
        conteudos: achados.slice((pagina - 1) * porPagina, pagina * porPagina),
        totalDePaginas: Math.ceil(achados.length / porPagina),
      };
    },
    enderecoDoConteudo(id) {
      const achado = conteudos.find((c) => c.id === id);
      if (achado === undefined) {
        return false;
      }
      return usandoLinksPermanentes ? achado.endereco : `${SITE}/?${achado.tipo === 'page' ? 'page_id' : 'p'}=${id}`;
    },
    consultarTermos(criterios) {
      registro.termos.push(criterios);
      return criterios.taxonomy === 'category' && (criterios.offset ?? 0) === 0 ? [{ id: 1 }] : [];
    },
    contarTermos(criterios) {
      registro.termos.push(criterios);
      return criterios.taxonomy === 'category' ? 1 : 0;
    },
    enderecoDoTermo: () => `${SITE}/category/uncategorized/`,
    consultarContas(criterios) {
      registro.contas.push(criterios);
      return { contas: (criterios.paged ?? 1) === 1 ? [{ id: 1 }] : [], total: 1 };
    },
    enderecoDoAutor: () => `${SITE}/author/oraculo/`,
  };

  return { contexto, registro };
}

const CABECA_DO_INDICE =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<?xml-stylesheet type="text/xsl" href="${SITE}/wp-sitemap-index.xsl" ?>\n`;
const CABECA_DA_PAGINA =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  `<?xml-stylesheet type="text/xsl" href="${SITE}/wp-sitemap.xsl" ?>\n`;

function corpo(resposta: ReturnType<ReturnType<typeof iniciarServidorDoMapaDoSite>['atender']>): string {
  assert.equal(resposta.tipo, 'documento');
  return resposta.tipo === 'documento' ? resposta.corpo : '';
}

// --- CA-7.1 -----------------------------------------------------------------

test('CA-7.1: com a indexacao ligada, o indice lista as paginas de sitemap por provedor, byte a byte', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  const resposta = servidor.atender({ sitemap: 'index' });

  // `curl http://localhost:8080/wp-sitemap.xml` no oraculo, 527 bytes.
  const esperado =
    CABECA_DO_INDICE +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `<sitemap><loc>${SITE}/wp-sitemap-posts-post-1.xml</loc></sitemap>` +
    `<sitemap><loc>${SITE}/wp-sitemap-posts-page-1.xml</loc></sitemap>` +
    `<sitemap><loc>${SITE}/wp-sitemap-taxonomies-category-1.xml</loc></sitemap>` +
    `<sitemap><loc>${SITE}/wp-sitemap-users-1.xml</loc></sitemap>` +
    '</sitemapindex>\n';
  assert.equal(corpo(resposta), esperado);
  assert.equal(Buffer.byteLength(esperado), 527);
  assert.equal(resposta.tipo === 'documento' && resposta.tipoDeConteudo, 'application/xml; charset=UTF-8');
  assert.equal(resposta.tipo === 'documento' && resposta.status, 200);
});

test('CA-7.1: os provedores do nucleo entram nesta ordem, e so com a opcao ligada', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  assert.deepEqual([...servidor.registro.provedores().keys()], ['posts', 'taxonomies', 'users']);
  assert.equal(servidor.habilitado(), true);
  assert.equal(servidor.enderecoDoIndice(), `${SITE}/wp-sitemap.xml`);
});

test('CA-7.1: sem links permanentes, o indice usa a consulta e o XML escreve o & como &amp;', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo({ usandoLinksPermanentes: false }).contexto);

  // `curl 'http://localhost:8080/?sitemap=index'` com `permalink_structure` vazia.
  const esperado =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<?xml-stylesheet type="text/xsl" href="${SITE}/?sitemap-stylesheet=index" ?>\n` +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `<sitemap><loc>${SITE}/?sitemap=posts&amp;sitemap-subtype=post&amp;paged=1</loc></sitemap>` +
    `<sitemap><loc>${SITE}/?sitemap=posts&amp;sitemap-subtype=page&amp;paged=1</loc></sitemap>` +
    `<sitemap><loc>${SITE}/?sitemap=taxonomies&amp;sitemap-subtype=category&amp;paged=1</loc></sitemap>` +
    `<sitemap><loc>${SITE}/?sitemap=users&amp;paged=1</loc></sitemap>` +
    '</sitemapindex>\n';
  assert.equal(corpo(servidor.atender({ sitemap: 'index' })), esperado);
  assert.equal(servidor.enderecoDoIndice(), `${SITE}/?sitemap=index`);
});

test('CA-7.1: o indice sem provedor nenhum fecha a raiz nela mesma', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);
  const vazio = iniciarServidorDoMapaDoSite({
    ...siteDoOraculo().contexto,
    tipos: {
      tiposDeConteudoPublicos: () => [],
      tipoDeConteudoVisivel: () => false,
      taxonomiasPublicas: () => [],
      taxonomiaVisivel: () => false,
    },
    consultarContas: () => ({ contas: [], total: 0 }),
  });

  // `get_sitemap_index_xml( array() )` no PHP do oraculo.
  assert.equal(
    corpo(vazio.atender({ sitemap: 'index' })),
    `${CABECA_DO_INDICE}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n`,
  );
  assert.notEqual(corpo(servidor.atender({ sitemap: 'index' })), corpo(vazio.atender({ sitemap: 'index' })));
});

// --- CA-7.2 -----------------------------------------------------------------

test('CA-7.2: a pagina de conteudo pede publish por nome, e privado e rascunho ficam de fora', () => {
  const { contexto, registro } = siteDoOraculo({
    conteudos: [OLA_MUNDO, PAGINA_DE_EXEMPLO, COM_SENHA, PRIVADO, RASCUNHO],
  });
  const servidor = iniciarServidorDoMapaDoSite(contexto);

  const xml = corpo(servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'post', paged: '1' }));

  const daPagina = registro.conteudo.find((c) => c.paged === 1);
  assert.deepEqual(daPagina, {
    orderby: 'ID',
    order: 'ASC',
    post_type: 'post',
    posts_per_page: 2000,
    post_status: ['publish'],
    no_found_rows: true,
    update_post_term_cache: false,
    update_post_meta_cache: false,
    ignore_sticky_posts: true,
    paged: 1,
  });
  assert.ok(!xml.includes('?p=7'));
  assert.ok(!xml.includes('?p=8'));
});

test('CA-7.2: tipo que nao e publico e visivel, como o anexo, nao tem pagina e nao consulta', () => {
  const { contexto, registro } = siteDoOraculo();
  const servidor = iniciarServidorDoMapaDoSite(contexto);
  registro.conteudo.length = 0;

  const resposta = servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'attachment', paged: '1' });

  // `curl .../wp-sitemap-posts-attachment-1.xml` -> 404.
  assert.equal(resposta.tipo, 'inexistente');
  assert.deepEqual(registro.conteudo, []);
  assert.deepEqual(servidor.registro.provedor('posts')?.subtipos(), ['post', 'page']);
});

test('CA-7.2: as paginas de pagina, de taxonomia e de contas saem como no oraculo', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  // A pagina inicial entra primeiro, porque `show_on_front` e `posts`.
  assert.equal(
    corpo(servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'page', paged: '1' })),
    CABECA_DA_PAGINA +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      `<url><loc>${SITE}/</loc><lastmod>2026-10-11T22:10:37+00:00</lastmod></url>` +
      `<url><loc>${SITE}/sample-page/</loc><lastmod>2026-10-11T22:10:37+00:00</lastmod></url>` +
      '</urlset>\n',
  );
  assert.equal(
    corpo(servidor.atender({ sitemap: 'taxonomies', 'sitemap-subtype': 'category', paged: '1' })),
    CABECA_DA_PAGINA +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      `<url><loc>${SITE}/category/uncategorized/</loc></url></urlset>\n`,
  );
  assert.equal(
    corpo(servidor.atender({ sitemap: 'users', paged: '1' })),
    CABECA_DA_PAGINA +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      `<url><loc>${SITE}/author/oraculo/</loc></url></urlset>\n`,
  );
});

test('CA-7.2: a conta entra por ter publicado em tipo publico que nao e pagina nem anexo', () => {
  const { contexto, registro } = siteDoOraculo();
  iniciarServidorDoMapaDoSite(contexto).atender({ sitemap: 'users', paged: '1' });

  assert.deepEqual(registro.contas.at(-1), { has_published_posts: ['post'], number: 2000, paged: 1 });
});

// --- CA-7.3 e a regra "e uma ausencia" --------------------------------------

test('CA-7.3: com a indexacao desligada, nenhum provedor e registrado e o pedido cai no 404', () => {
  const { contexto, registro } = siteDoOraculo({ blogPublic: '0' });
  const servidor = iniciarServidorDoMapaDoSite(contexto);

  assert.equal(servidor.habilitado(), false);
  assert.equal(servidor.registro.provedores().size, 0);

  // `curl` no oraculo com `blog_public` = '0': os tres sao 404 com os
  // cabecalhos de nao guardar.
  for (const pedido of [
    { sitemap: 'index' },
    { sitemap: 'posts', 'sitemap-subtype': 'post', paged: '1' },
    { 'sitemap-stylesheet': 'sitemap' },
  ]) {
    assert.deepEqual(servidor.atender(pedido), {
      tipo: 'inexistente',
      status: 404,
      cabecalhos: {
        Expires: 'Wed, 11 Jan 1984 05:00:00 GMT',
        'Cache-Control': 'no-cache, must-revalidate, max-age=0, no-store, private',
      },
    });
  }
  assert.deepEqual(registro.conteudo, []);
  assert.deepEqual(registro.termos, []);
  assert.deepEqual(registro.contas, []);
});

test('CA-7.3: as regras de reescrita continuam registradas, e e por elas que o 404 e o do mapa', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo({ blogPublic: '0' }).contexto);

  // `class-wp-sitemaps.php:60`-`:61`: "only the rewrite rules will be
  // registered by this method, in order to properly send 404s".
  assert.equal(servidor.regrasDeReescrita, REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE);
  assert.deepEqual(
    servidor.regrasDeReescrita.map((r) => r.consulta),
    [
      'index.php?sitemap=index',
      'index.php?sitemap-stylesheet=sitemap',
      'index.php?sitemap-stylesheet=index',
      'index.php?sitemap=$matches[1]&sitemap-subtype=$matches[2]&paged=$matches[3]',
      'index.php?sitemap=$matches[1]&paged=$matches[2]',
    ],
  );
  assert.deepEqual(
    servidor.etiquetasDeReescrita.map((e) => e.etiqueta),
    ['%sitemap%', '%sitemap-subtype%', '%sitemap-stylesheet%'],
  );
});

test('regra de negocio: desligada nao e recusa — nao ha 403, nao ha corpo e nao ha mensagem', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo({ blogPublic: '' }).contexto);

  const resposta = servidor.atender({ sitemap: 'index' });

  assert.equal(resposta.tipo, 'inexistente');
  assert.equal(resposta.tipo === 'inexistente' && resposta.status, 404);
  assert.deepEqual(Object.keys(resposta).sort(), ['cabecalhos', 'status', 'tipo']);
  assert.equal(resposta.tipo === 'inexistente' && resposta.cabecalhos, CABECALHOS_DE_NAO_GUARDAR);
});

// --- CA-7.4 -----------------------------------------------------------------

test('CA-7.4: desligada, a meta de robos pede noindex e nofollow; ligada, so a previa grande', () => {
  // A pagina inicial do oraculo, com `blog_public` '0' e '1'.
  assert.equal(
    conteudoDaMetaDeRobos(diretivasDeRobosDoNucleo({ blogPublic: '0', ehIncorporacao: false, ehBusca: false })),
    'noindex, nofollow',
  );
  assert.equal(
    conteudoDaMetaDeRobos(diretivasDeRobosDoNucleo({ blogPublic: '1', ehIncorporacao: false, ehBusca: false })),
    'max-image-preview:large',
  );
  // `wp_robots_noindex_search` com a opcao ligada: `wp_robots_no_robots` poe
  // `follow`, e a previa vem depois.
  assert.equal(
    conteudoDaMetaDeRobos(diretivasDeRobosDoNucleo({ blogPublic: '1', ehIncorporacao: false, ehBusca: true })),
    'noindex, follow, max-image-preview:large',
  );
  assert.equal(conteudoDaMetaDeRobos({}), null);
});

test('CA-7.4: desligada, o robots.txt perde a linha do indice — e NAO ganha Disallow: /', () => {
  const desligado = iniciarServidorDoMapaDoSite(siteDoOraculo({ blogPublic: '0' }).contexto);
  const ligado = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  // `curl http://localhost:8080/robots.txt`, 67 e 114 bytes.
  assert.deepEqual(desligado.robotsTxt(), {
    tipoDeConteudo: 'text/plain; charset=utf-8',
    corpo: 'User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n',
  });
  assert.equal(
    ligado.robotsTxt().corpo,
    'User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n\n' +
      `Sitemap: ${SITE}/wp-sitemap.xml\n`,
  );
  assert.equal(Buffer.byteLength(desligado.robotsTxt().corpo), 67);
  assert.equal(Buffer.byteLength(ligado.robotsTxt().corpo), 114);
});

// --- CA-7.5 -----------------------------------------------------------------

test('CA-7.5: o tamanho de pagina e o corte do indice sao declarados, com os numeros do legado', () => {
  assert.equal(ENDERECOS_POR_PAGINA_DO_MAPA, 2000);
  assert.equal(PAGINAS_DO_MAPA_NO_INDICE, 50000);

  const { contexto, registro } = siteDoOraculo();
  iniciarServidorDoMapaDoSite(contexto).atender({ sitemap: 'index' });

  assert.ok(registro.conteudo.filter((c) => c.post_type === 'post').every((c) => c.posts_per_page === 2000));
  assert.ok(registro.termos.every((c) => c.number === 2000));
  assert.ok(registro.contas.every((c) => c.number === 2000));
});

test('CA-7.5: o indice escreve uma entrada por pagina de cada provedor', () => {
  // O oraculo com `wp_sitemaps_max_urls` em 1 e dois conteudos publicados:
  // `posts-post` com as paginas 1 e 2.
  const servidor = iniciarServidorDoMapaDoSite(
    siteDoOraculo({ conteudos: [OLA_MUNDO, PAGINA_DE_EXEMPLO, COM_SENHA], enderecosPorPagina: 1 }).contexto,
  );

  const xml = corpo(servidor.atender({ sitemap: 'index' }));
  const enderecos = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

  assert.deepEqual(enderecos, [
    `${SITE}/wp-sitemap-posts-post-1.xml`,
    `${SITE}/wp-sitemap-posts-post-2.xml`,
    `${SITE}/wp-sitemap-posts-page-1.xml`,
    `${SITE}/wp-sitemap-taxonomies-category-1.xml`,
    `${SITE}/wp-sitemap-users-1.xml`,
  ]);
});

test('CA-7.5: pagina alem da ultima nao tem endereco, e a resposta e 404', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  // `curl .../wp-sitemap-posts-post-2.xml` -> 404.
  assert.equal(servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'post', paged: '2' }).tipo, 'inexistente');
  // Provedor que nao existe: 404 (`.../wp-sitemap-nada-1.xml`).
  assert.equal(servidor.atender({ sitemap: 'nada', paged: '1' }).tipo, 'inexistente');
  // Sem pagina, vale a primeira.
  assert.equal(servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'post' }).tipo, 'documento');
});

// --- CA-7.6 -----------------------------------------------------------------

test('CA-7.6: conteudo publicado com senha entra na pagina, com endereco e data, byte a byte', () => {
  const { contexto, registro } = siteDoOraculo({
    conteudos: [OLA_MUNDO, PAGINA_DE_EXEMPLO, COM_SENHA, PRIVADO, RASCUNHO],
  });
  const servidor = iniciarServidorDoMapaDoSite(contexto);

  // `curl .../wp-sitemap-posts-post-1.xml` depois de publicar "Senha & cia"
  // com a senha `x`, um privado e um rascunho.
  assert.equal(
    corpo(servidor.atender({ sitemap: 'posts', 'sitemap-subtype': 'post', paged: '1' })),
    CABECA_DA_PAGINA +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      `<url><loc>${SITE}/2026/10/11/hello-world/</loc><lastmod>2026-10-11T22:10:37+00:00</lastmod></url>` +
      `<url><loc>${SITE}/2026/10/29/senha-cia/</loc><lastmod>2026-10-29T18:29:14+00:00</lastmod></url>` +
      '</urlset>\n',
  );
  for (const criterios of registro.conteudo) {
    assert.ok(!('has_password' in criterios));
    assert.ok(!('post_password' in criterios));
  }
});

// --- regra de negocio: blog_public nasce ligado ------------------------------

test('regra de negocio: blog_public nasce ligado, e o site nasce pedindo para ser indexado', () => {
  assert.deepEqual(OPCAO_DE_INDEXACAO, { nome: 'blog_public', valorDeFabrica: '1' });
  assert.equal(indexacaoLigada(OPCAO_DE_INDEXACAO.valorDeFabrica), true);

  // O molde do `(bool)` do PHP: '0' e vazio desligam, qualquer outro texto liga.
  assert.equal(indexacaoLigada('0'), false);
  assert.equal(indexacaoLigada(''), false);
  assert.equal(indexacaoLigada(false), false);
  assert.equal(indexacaoLigada('2'), true);
});

// --- os bytes do XML --------------------------------------------------------

test('o XML escapa como o asXML do oraculo, guarda a ordem dos campos e fecha o vazio', () => {
  // `get_sitemap_xml()` no PHP do oraculo, com `wp_sitemaps_stylesheet_url`
  // devolvendo falso nos dois ultimos casos.
  assert.equal(
    xmlDaPagina([{ lastmod: 'a<b&c"d\'e', priority: '0.5', changefreq: 'daily' }], `${SITE}/wp-sitemap.xsl`),
    CABECA_DA_PAGINA +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      '<url><lastmod>a&lt;b&amp;c"d\'e</lastmod><priority>0.5</priority><changefreq>daily</changefreq></url>' +
      '</urlset>\n',
  );
  assert.equal(
    xmlDaPagina([{ lastmod: 'x>y\rz\tw' }, { foo: 'x' }, { loc: '' }, { loc: 'http://x.test/é/ç' }], false),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      '<url><lastmod>x&gt;y&#13;z\tw</lastmod></url><url/><url><loc/></url>' +
      '<url><loc>http://x.test/é/ç</loc></url></urlset>\n',
  );
  // O indice so aceita `loc` e `lastmod`.
  assert.equal(
    xmlDoIndice([{ loc: 'a', priority: '1' }], false),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>a</loc></sitemap></sitemapindex>\n',
  );
});

// --- a ordem do atendimento e a composicao ----------------------------------

test('o atendimento: sem as variaveis do mapa nao e mapa; folha de estilo conhecida e decidida', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  assert.deepEqual(servidor.atender({}), { tipo: 'nao-e-mapa-do-site' });
  assert.deepEqual(servidor.atender({ sitemap: '0' }), { tipo: 'nao-e-mapa-do-site' });
  assert.deepEqual(servidor.atender({ 'sitemap-stylesheet': 'index' }), { tipo: 'folha-de-estilo', qual: 'index' });
  assert.equal(servidor.atender({ 'sitemap-stylesheet': 'outra' }).tipo, 'inexistente');
});

test('absint com o molde do PHP: espaco, sinal e lixo no fim', () => {
  assert.equal(absintComoNoPhp(undefined), 0);
  assert.equal(absintComoNoPhp(''), 0);
  assert.equal(absintComoNoPhp(' 2'), 2);
  assert.equal(absintComoNoPhp('-3'), 3);
  assert.equal(absintComoNoPhp('2abc'), 2);
  assert.equal(absintComoNoPhp('1.9'), 1);
  assert.equal(absintComoNoPhp('1e3'), 1000);
  assert.equal(absintComoNoPhp('abc'), 0);
});

test('get_sitemap_url: falso para provedor ou subtipo que nao existe', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);

  assert.equal(servidor.enderecoDoMapa('index'), `${SITE}/wp-sitemap.xml`);
  assert.equal(servidor.enderecoDoMapa('posts', 'page', 3), `${SITE}/wp-sitemap-posts-page-3.xml`);
  assert.equal(servidor.enderecoDoMapa('users'), `${SITE}/wp-sitemap-users-1.xml`);
  assert.equal(servidor.enderecoDoMapa('posts', 'attachment'), false);
  assert.equal(servidor.enderecoDoMapa('nada'), false);
});

test('o registro nao substitui provedor ja registrado', () => {
  const servidor = iniciarServidorDoMapaDoSite(siteDoOraculo().contexto);
  const original = servidor.registro.provedor('posts');
  assert.ok(original);

  assert.equal(servidor.registro.adicionar('posts', { ...original, nome: 'outro' }), false);
  assert.equal(servidor.registro.provedor('posts'), original);
  assert.equal(servidor.registro.provedor(1), null);
});

test('dois servidores nao compartilham registro, e o modulo inicia um novo a cada chamada', () => {
  const dados: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    selecionar: () => [],
    escrever: () => ({ linhasAfetadas: 0, idGerado: null }),
  };
  const modulo = criarModuloDeSuperficiesProgramaticas({ dados });

  const um = modulo.iniciarMapaDoSite(siteDoOraculo().contexto);
  const outro = modulo.iniciarMapaDoSite(siteDoOraculo({ blogPublic: '0' }).contexto);

  assert.equal(um.registro.provedores().size, 3);
  assert.equal(outro.registro.provedores().size, 0);
  assert.notEqual(um.registro, outro.registro);
});
