/**
 * Testes de **T017** — US-8, *"servir feeds de conteudo e de comentarios a
 * partir da mesma consulta publica"*. Afirmam CA-8.1 a CA-8.4.
 *
 * Os casos do catalogo (`UT-146-1` a `UT-146-4`) sao de **T018**, a tarefa `[P]`
 * paralela; aqui se afirma o criterio de aceite contra a implementacao.
 *
 * ⚠️ **Os bytes esperados sairam do oraculo executavel**, e nao da leitura:
 * `scripts/oraculo/` em `http://localhost:8080`, instalacao nova, permalink
 * `/%year%/%monthnum%/%day%/%postname%/`, pedidos por `curl` em 2026-10-29. O
 * oraculo se autoatualizou para **7.1.4**; os arquivos que produzem estes bytes
 * sao identicos aos do 7.1.2 (conferido por `diff`: os seis modelos,
 * `feed.php`, `functions.php`, `general-template.php`, `formatting.php`,
 * `default-filters.php`, `class-wp.php`, `template-loader.php`), e a unica
 * troca feita nos literais abaixo e o numero da versao no gerador, `7.1.4` para
 * `7.1.2`, que e o `$wp_version` do legado deste pacote
 * (`wp-includes/version.php:19`).
 *
 * O contexto reproduz aquele site: um conteudo (*Hello world!*), uma pagina
 * (*Sample Page*), um comentario. Os primitivos de formatacao sao identidade
 * porque nenhum texto do site de fabrica tem caractere que eles troquem; os
 * textos de item chegam como o legado os escreve, que e o contrato de
 * `./contexto-do-feed.ts`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FORMATO_DE_FEED_PADRAO,
  FORMATOS_DE_FEED_DO_NUCLEO,
  OPCOES_DE_FABRICA_DO_FEED,
  TIPOS_DE_CONTEUDO_DO_FEED,
  entraNoRamoDeFeed,
  formatoDeFeedPadrao,
  formatoPedidoNoDespacho,
  iniciarServidorDeFeed,
  tipoDeConteudoDoFeed,
  type ComentarioNoFeed,
  type ConteudoNoFeed,
  type ContextoDoFeed,
  type RespostaDeFeed,
  type TiposNoFeed,
} from './index.js';
import { criarModuloDeSuperficiesProgramaticas, type PortaDeDados } from '../index.js';

const SITE = 'http://localhost:8080';
const OLA = `${SITE}/2026/10/11/hello-world/`;
const DATA = '2026-10-11 22:10:37';

/** `Hello world!`, como o oraculo o tem. */
const OLA_MUNDO: ConteudoNoFeed = {
  id: 1,
  tituloRss: 'Hello world!',
  enderecoRss: OLA,
  enderecoDosComentarios: `${OLA}#comments`,
  autor: 'oraculo',
  enderecoDoAutor: SITE,
  publicadoGmt: DATA,
  modificadoGmt: DATA,
  guid: `${SITE}/?p=1`,
  resumoRss:
    'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!',
  conteudoDoFeed: () =>
    '\n<p class="wp-block-paragraph">Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n',
  nomesDeCategoria: () => ['Uncategorized'],
  numeroDeComentarios: 1,
  comentariosAbertos: true,
  enderecoDoFeedDeComentarios: (tipo) => (tipo === 'atom' ? `${OLA}feed/atom/` : `${OLA}feed/`),
  senhaExigida: false,
  anexos: [],
};

/** `Sample Page` — sem comentario, e com os comentarios fechados. */
const PAGINA_DE_EXEMPLO: ConteudoNoFeed = {
  ...OLA_MUNDO,
  id: 2,
  tituloRss: 'Sample Page',
  enderecoRss: `${SITE}/sample-page/`,
  enderecoDosComentarios: `${SITE}/sample-page/#respond`,
  guid: `${SITE}/?page_id=2`,
  numeroDeComentarios: 0,
  comentariosAbertos: false,
  enderecoDoFeedDeComentarios: (tipo) =>
    tipo === 'atom' ? `${SITE}/sample-page/feed/atom/` : `${SITE}/sample-page/feed/`,
};

/** O comentario da instalacao nova. */
const COMENTARIO: ComentarioNoFeed = {
  id: 1,
  conteudoId: 1,
  tituloDoConteudoRss: 'Hello world!',
  autorRss: 'A WordPress Commenter',
  enderecoDoAutor: 'https://wordpress.org/',
  endereco: `${OLA}#comment-1`,
  dataGmt: DATA,
  guid: `${SITE}/?p=1#comment-1`,
  senhaDoConteudoExigida: false,
  formularioDeSenha: '<form>senha</form>',
  textoRss:
    'Hi, this is a comment.\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.\nCommenter avatars come from &lt;a href=&quot;https://gravatar.com/&quot;&gt;Gravatar&lt;/a&gt;.',
  texto:
    '<p>Hi, this is a comment.<br />\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.<br />\nCommenter avatars come from <a href="https://gravatar.com/">Gravatar</a>.</p>\n',
  respondeA: null,
  conteudo: { guid: `${SITE}/?p=1`, enderecoRss: OLA },
};

const LISTAGEM: TiposNoFeed = { singular: false, single: false, busca: false, feedDeComentarios: false };

interface Recorte {
  readonly formato?: string;
  readonly tipos?: Partial<TiposNoFeed>;
  readonly conteudos?: readonly ConteudoNoFeed[];
  readonly comentarios?: readonly ComentarioNoFeed[];
  readonly enderecoProprio?: string;
  readonly formatoPadraoFiltrado?: string;
  readonly rssUseExcerpt?: string | false;
}

/** O contexto da requisicao, para o recorte pedido. */
function contextoDoOraculo(recorte: Recorte = {}): ContextoDoFeed {
  const identidade = (texto: string): string => texto;
  return {
    opcoes: {
      blogCharset: 'UTF-8',
      rssUseExcerpt: recorte.rssUseExcerpt ?? '0',
      htmlType: 'text/html',
    },
    site: {
      tituloRss: 'oraculo',
      nomeRss: 'oraculo',
      enderecoRss: SITE,
      descricaoRss: '',
      tipoHtmlRss: 'text/html',
      idiomaRss: 'en-US',
      versaoRss: '7.1.2',
      versao: '7.1.2',
      enderecoAtom: `${SITE}/feed/atom/`,
      enderecoAtomDosComentariosRss: `${SITE}/comments/feed/atom/`,
      enderecoInicial: SITE,
      enderecoProprio: recorte.enderecoProprio ?? `${SITE}/feed/`,
      termoDeBusca: '',
      enderecoDoFeedDeComentariosDaBusca: '',
      enderecoDoIcone: '',
    },
    consulta: {
      tipos: { ...LISTAGEM, ...recorte.tipos },
      conteudos: recorte.conteudos ?? [OLA_MUNDO],
      comentarios: recorte.comentarios ?? [],
      formato: recorte.formato ?? 'feed',
    },
    datas: {
      ultimaModificacaoDeConteudoGmt: DATA,
      ultimaModificacaoDeComentarioGmt: DATA,
      agora: () => {
        throw new Error('o relogio nao devia ser lido: ha data de modificacao');
      },
    },
    formatacao: {
      escUrl: identidade,
      escAttr: identidade,
      sanitizarUrl: identidade,
      converterCaracteres: identidade,
      entidadesParaNumericas: identidade,
      decodificarEntidades: identidade,
    },
    tiposMimePermitidos: ['audio/mpeg', 'image/jpeg'],
    ...(recorte.formatoPadraoFiltrado === undefined
      ? {}
      : { formatoPadraoFiltrado: recorte.formatoPadraoFiltrado }),
  };
}

function documento(resposta: RespostaDeFeed): { status: number; tipo: string; corpo: string } {
  assert.equal(resposta.tipo, 'documento');
  assert.ok(resposta.tipo === 'documento');
  return {
    status: resposta.status,
    tipo: resposta.cabecalhos['Content-Type'] ?? '',
    corpo: resposta.corpo,
  };
}

// Os bytes do oraculo, com `7.1.4` trocado por `7.1.2` no gerador.

const RSS2 =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"\n\txmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n\txmlns:wfw=\"http://wellformedweb.org/CommentAPI/\"\n\txmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n\txmlns:atom=\"http://www.w3.org/2005/Atom\"\n\txmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n\txmlns:slash=\"http://purl.org/rss/1.0/modules/slash/\"\n\t>\n\n<channel>\n\t<title>oraculo</title>\n\t<atom:link href=\"http://localhost:8080/feed/\" rel=\"self\" type=\"application/rss+xml\" />\n\t<link>http://localhost:8080</link>\n\t<description></description>\n\t<lastBuildDate>Sun, 11 Oct 2026 22:10:37 +0000</lastBuildDate>\n\t<language>en-US</language>\n\t<sy:updatePeriod>\n\thourly\t</sy:updatePeriod>\n\t<sy:updateFrequency>\n\t1\t</sy:updateFrequency>\n\t<generator>https://wordpress.org/?v=7.1.2</generator>\n\t<item>\n\t\t<title>Hello world!</title>\n\t\t<link>http://localhost:8080/2026/10/11/hello-world/</link>\n\t\t\t\t\t<comments>http://localhost:8080/2026/10/11/hello-world/#comments</comments>\n\t\t\n\t\t<dc:creator><![CDATA[oraculo]]></dc:creator>\n\t\t<pubDate>Sun, 11 Oct 2026 22:10:37 +0000</pubDate>\n\t\t\t\t<category><![CDATA[Uncategorized]]></category>\n\t\t<guid isPermaLink=\"false\">http://localhost:8080/?p=1</guid>\n\n\t\t\t\t\t<description><![CDATA[Welcome to WordPress. This is your first post. Edit or delete it, then start writing!]]></description>\n\t\t\t\t\t\t\t\t\t\t<content:encoded><![CDATA[\n<p class=\"wp-block-paragraph\">Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n]]></content:encoded>\n\t\t\t\t\t\n\t\t\t\t\t<wfw:commentRss>http://localhost:8080/2026/10/11/hello-world/feed/</wfw:commentRss>\n\t\t\t<slash:comments>1</slash:comments>\n\t\t\n\t\t\n\t\t\t</item>\n\t</channel>\n</rss>\n";

const RSS2_COMENTARIOS =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"\n\txmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n\txmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n\txmlns:atom=\"http://www.w3.org/2005/Atom\"\n\txmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n\t\n\t>\n<channel>\n\t<title>\n\tComments for oraculo\t</title>\n\t<atom:link href=\"http://localhost:8080/comments/feed/\" rel=\"self\" type=\"application/rss+xml\" />\n\t<link>http://localhost:8080</link>\n\t<description></description>\n\t<lastBuildDate>Sun, 11 Oct 2026 22:10:37 +0000</lastBuildDate>\n\t<sy:updatePeriod>\n\thourly\t</sy:updatePeriod>\n\t<sy:updateFrequency>\n\t1\t</sy:updateFrequency>\n\t<generator>https://wordpress.org/?v=7.1.2</generator>\n\t<item>\n\t\t<title>\n\t\tComment on Hello world! by A WordPress Commenter\t\t</title>\n\t\t<link>http://localhost:8080/2026/10/11/hello-world/#comment-1</link>\n\n\t\t<dc:creator><![CDATA[A WordPress Commenter]]></dc:creator>\n\t\t<pubDate>Sun, 11 Oct 2026 22:10:37 +0000</pubDate>\n\t\t<guid isPermaLink=\"false\">http://localhost:8080/?p=1#comment-1</guid>\n\n\t\t\t\t\t<description><![CDATA[Hi, this is a comment.\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.\nCommenter avatars come from &lt;a href=&quot;https://gravatar.com/&quot;&gt;Gravatar&lt;/a&gt;.]]></description>\n\t\t\t<content:encoded><![CDATA[<p>Hi, this is a comment.<br />\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.<br />\nCommenter avatars come from <a href=\"https://gravatar.com/\">Gravatar</a>.</p>\n]]></content:encoded>\n\t\t\n\t\t\t</item>\n\t</channel>\n</rss>\n";

const RSS2_COMENTARIOS_DO_CONTEUDO =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"\n\txmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n\txmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n\txmlns:atom=\"http://www.w3.org/2005/Atom\"\n\txmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n\t\n\t>\n<channel>\n\t<title>\n\tComments on: Hello world!\t</title>\n\t<atom:link href=\"http://localhost:8080/2026/10/11/hello-world/feed/\" rel=\"self\" type=\"application/rss+xml\" />\n\t<link>http://localhost:8080/2026/10/11/hello-world/</link>\n\t<description></description>\n\t<lastBuildDate>Sun, 11 Oct 2026 22:10:37 +0000</lastBuildDate>\n\t<sy:updatePeriod>\n\thourly\t</sy:updatePeriod>\n\t<sy:updateFrequency>\n\t1\t</sy:updateFrequency>\n\t<generator>https://wordpress.org/?v=7.1.2</generator>\n\t<item>\n\t\t<title>\n\t\tBy: A WordPress Commenter\t\t</title>\n\t\t<link>http://localhost:8080/2026/10/11/hello-world/#comment-1</link>\n\n\t\t<dc:creator><![CDATA[A WordPress Commenter]]></dc:creator>\n\t\t<pubDate>Sun, 11 Oct 2026 22:10:37 +0000</pubDate>\n\t\t<guid isPermaLink=\"false\">http://localhost:8080/?p=1#comment-1</guid>\n\n\t\t\t\t\t<description><![CDATA[Hi, this is a comment.\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.\nCommenter avatars come from &lt;a href=&quot;https://gravatar.com/&quot;&gt;Gravatar&lt;/a&gt;.]]></description>\n\t\t\t<content:encoded><![CDATA[<p>Hi, this is a comment.<br />\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.<br />\nCommenter avatars come from <a href=\"https://gravatar.com/\">Gravatar</a>.</p>\n]]></content:encoded>\n\t\t\n\t\t\t</item>\n\t</channel>\n</rss>\n";

const RSS2_COMENTARIOS_DA_PAGINA =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"\n\txmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n\txmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n\txmlns:atom=\"http://www.w3.org/2005/Atom\"\n\txmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n\t\n\t>\n<channel>\n\t<title>\n\tComments on: Sample Page\t</title>\n\t<atom:link href=\"http://localhost:8080/sample-page/feed/\" rel=\"self\" type=\"application/rss+xml\" />\n\t<link>http://localhost:8080</link>\n\t<description></description>\n\t<lastBuildDate>Sun, 11 Oct 2026 22:10:37 +0000</lastBuildDate>\n\t<sy:updatePeriod>\n\thourly\t</sy:updatePeriod>\n\t<sy:updateFrequency>\n\t1\t</sy:updateFrequency>\n\t<generator>https://wordpress.org/?v=7.1.2</generator>\n</channel>\n</rss>\n";

const ATOM =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><feed\n\txmlns=\"http://www.w3.org/2005/Atom\"\n\txmlns:thr=\"http://purl.org/syndication/thread/1.0\"\n\txml:lang=\"en-US\"\n\t>\n\t<title type=\"text\">oraculo</title>\n\t<subtitle type=\"text\"></subtitle>\n\n\t<updated>2026-10-11T22:10:37Z</updated>\n\n\t<link rel=\"alternate\" type=\"text/html\" href=\"http://localhost:8080\" />\n\t<id>http://localhost:8080/feed/atom/</id>\n\t<link rel=\"self\" type=\"application/atom+xml\" href=\"http://localhost:8080/feed/atom/\" />\n\n\t<generator uri=\"https://wordpress.org/\" version=\"7.1.2\">WordPress</generator>\n\t<entry>\n\t\t<author>\n\t\t\t<name>oraculo</name>\n\t\t\t\t\t\t\t<uri>http://localhost:8080</uri>\n\t\t\t\t\t\t</author>\n\n\t\t<title type=\"html\"><![CDATA[Hello world!]]></title>\n\t\t<link rel=\"alternate\" type=\"text/html\" href=\"http://localhost:8080/2026/10/11/hello-world/\" />\n\n\t\t<id>http://localhost:8080/?p=1</id>\n\t\t<updated>2026-10-11T22:10:37Z</updated>\n\t\t<published>2026-10-11T22:10:37Z</published>\n\t\t<category scheme=\"http://localhost:8080\" term=\"Uncategorized\" />\n\t\t<summary type=\"html\"><![CDATA[Welcome to WordPress. This is your first post. Edit or delete it, then start writing!]]></summary>\n\n\t\t\t\t\t<content type=\"html\" xml:base=\"http://localhost:8080/2026/10/11/hello-world/\"><![CDATA[\n<p class=\"wp-block-paragraph\">Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n]]></content>\n\t\t\n\t\t\t\t\t<link rel=\"replies\" type=\"text/html\" href=\"http://localhost:8080/2026/10/11/hello-world/#comments\" thr:count=\"1\" />\n\t\t\t<link rel=\"replies\" type=\"application/atom+xml\" href=\"http://localhost:8080/2026/10/11/hello-world/feed/atom/\" thr:count=\"1\" />\n\t\t\t<thr:total>1</thr:total>\n\t\t\t</entry>\n\t</feed>\n";

const ATOM_COMENTARIOS =
  "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><feed\n\txmlns=\"http://www.w3.org/2005/Atom\"\n\txml:lang=\"en-US\"\n\txmlns:thr=\"http://purl.org/syndication/thread/1.0\"\n\t>\n\t<title type=\"text\">\n\tComments for oraculo\t</title>\n\t<subtitle type=\"text\"></subtitle>\n\n\t<updated>2026-10-11T22:10:37Z</updated>\n\n\t<link rel=\"alternate\" type=\"text/html\" href=\"http://localhost:8080\" />\n\t<link rel=\"self\" type=\"application/atom+xml\" href=\"http://localhost:8080/comments/feed/atom/\" />\n\t<id>http://localhost:8080/comments/feed/atom/</id>\n<generator uri=\"https://wordpress.org/\" version=\"7.1.2\">WordPress</generator>\n\t<entry>\n\t\t<title>\n\t\tComment on Hello world! by A WordPress Commenter\t\t</title>\n\t\t<link rel=\"alternate\" href=\"http://localhost:8080/2026/10/11/hello-world/#comment-1\" type=\"text/html\" />\n\n\t\t<author>\n\t\t\t<name>A WordPress Commenter</name>\n\t\t\t<uri>https://wordpress.org/</uri>\n\t\t</author>\n\n\t\t<id>http://localhost:8080/?p=1#comment-1</id>\n\t\t<updated>2026-10-11T22:10:37Z</updated>\n\t\t<published>2026-10-11T22:10:37Z</published>\n\n\t\t\t\t\t<content type=\"html\" xml:base=\"http://localhost:8080/2026/10/11/hello-world/#comment-1\"><![CDATA[<p>Hi, this is a comment.<br />\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.<br />\nCommenter avatars come from <a href=\"https://gravatar.com/\">Gravatar</a>.</p>\n]]></content>\n\t\t\n\t\t\t\t\t<thr:in-reply-to ref=\"http://localhost:8080/?p=1\" href=\"http://localhost:8080/2026/10/11/hello-world/\" type=\"text/html\" />\n\t\t\t\t</entry>\n\t</feed>\n";

const ATOM_COMENTARIOS_DO_CONTEUDO =
  "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><feed\n\txmlns=\"http://www.w3.org/2005/Atom\"\n\txml:lang=\"en-US\"\n\txmlns:thr=\"http://purl.org/syndication/thread/1.0\"\n\t>\n\t<title type=\"text\">\n\tComments on Hello world!\t</title>\n\t<subtitle type=\"text\"></subtitle>\n\n\t<updated>2026-10-11T22:10:37Z</updated>\n\n\t<link rel=\"alternate\" type=\"text/html\" href=\"http://localhost:8080/2026/10/11/hello-world/#comments\" />\n\t<link rel=\"self\" type=\"application/atom+xml\" href=\"http://localhost:8080/2026/10/11/hello-world/feed/atom/\" />\n\t<id>http://localhost:8080/2026/10/11/hello-world/feed/atom/</id>\n<generator uri=\"https://wordpress.org/\" version=\"7.1.2\">WordPress</generator>\n\t<entry>\n\t\t<title>\n\t\tBy: A WordPress Commenter\t\t</title>\n\t\t<link rel=\"alternate\" href=\"http://localhost:8080/2026/10/11/hello-world/#comment-1\" type=\"text/html\" />\n\n\t\t<author>\n\t\t\t<name>A WordPress Commenter</name>\n\t\t\t<uri>https://wordpress.org/</uri>\n\t\t</author>\n\n\t\t<id>http://localhost:8080/?p=1#comment-1</id>\n\t\t<updated>2026-10-11T22:10:37Z</updated>\n\t\t<published>2026-10-11T22:10:37Z</published>\n\n\t\t\t\t\t<content type=\"html\" xml:base=\"http://localhost:8080/2026/10/11/hello-world/#comment-1\"><![CDATA[<p>Hi, this is a comment.<br />\nTo get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.<br />\nCommenter avatars come from <a href=\"https://gravatar.com/\">Gravatar</a>.</p>\n]]></content>\n\t\t\n\t\t\t\t\t<thr:in-reply-to ref=\"http://localhost:8080/?p=1\" href=\"http://localhost:8080/2026/10/11/hello-world/\" type=\"text/html\" />\n\t\t\t\t</entry>\n\t</feed>\n";

const RDF =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rdf:RDF\n\txmlns=\"http://purl.org/rss/1.0/\"\n\txmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"\n\txmlns:dc=\"http://purl.org/dc/elements/1.1/\"\n\txmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\"\n\txmlns:admin=\"http://webns.net/mvcb/\"\n\txmlns:content=\"http://purl.org/rss/1.0/modules/content/\"\n\t>\n<channel rdf:about=\"http://localhost:8080\">\n\t<title>oraculo</title>\n\t<link>http://localhost:8080</link>\n\t<description></description>\n\t<dc:date>2026-10-11T22:10:37Z\t</dc:date>\n\t<sy:updatePeriod>\n\thourly\t</sy:updatePeriod>\n\t<sy:updateFrequency>\n\t1\t</sy:updateFrequency>\n\t<sy:updateBase>2000-01-01T12:00+00:00</sy:updateBase>\n\t<admin:generatorAgent rdf:resource=\"https://wordpress.org/?v=7.1.2\" />\n\t<items>\n\t\t<rdf:Seq>\n\t\t\t\t\t<rdf:li rdf:resource=\"http://localhost:8080/2026/10/11/hello-world/\"/>\n\t\t\t\t</rdf:Seq>\n\t</items>\n</channel>\n<item rdf:about=\"http://localhost:8080/2026/10/11/hello-world/\">\n\t<title>Hello world!</title>\n\t<link>http://localhost:8080/2026/10/11/hello-world/</link>\n\n\t<dc:creator><![CDATA[oraculo]]></dc:creator>\n\t<dc:date>2026-10-11T22:10:37Z</dc:date>\n\t\t\t<dc:subject><![CDATA[Uncategorized]]></dc:subject>\n\n\t\t\t<description><![CDATA[Welcome to WordPress. This is your first post. Edit or delete it, then start writing!]]></description>\n\t\t<content:encoded><![CDATA[\n<p class=\"wp-block-paragraph\">Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n]]></content:encoded>\n\t\n\t</item>\n</rdf:RDF>\n";

const RSS =
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"0.92\">\n<channel>\n\t<title>oraculo</title>\n\t<link>http://localhost:8080</link>\n\t<description></description>\n\t<lastBuildDate>Sun, 11 Oct 2026 22:10:37 +0000</lastBuildDate>\n\t<docs>http://backend.userland.com/rss092</docs>\n\t<language>en-US</language>\n\t<!-- generator=\"WordPress/7.1.2\" -->\n\n\t<item>\n\t\t<title>Hello world!</title>\n\t\t<description><![CDATA[Welcome to WordPress. This is your first post. Edit or delete it, then start writing!]]></description>\n\t\t<link>http://localhost:8080/2026/10/11/hello-world/</link>\n\t\t\t</item>\n</channel>\n</rss>\n";

const FORMATO_INVALIDO =
  "<error>\n    <code>wp_die</code>\n    <title><![CDATA[WordPress &amp;rsaquo; Error]]></title>\n    <message><![CDATA[&lt;strong&gt;Error:&lt;/strong&gt; This is not a valid feed template.]]></message>\n    <data>\n        <status>404</status>\n    </data>\n</error>\n";

const ETIQUETA = '"cbae840be34b312fa55485472cab47b4"';
const ULTIMA_MODIFICACAO = 'Sun, 11 Oct 2026 22:10:37 GMT';

// ---------------------------------------------------------------------------
// CA-8.1 — o mesmo endereco de listagem serve o feed quando o formato e pedido
// ---------------------------------------------------------------------------

test('CA-8.1: /feed/ serve o RSS2 da listagem, byte a byte, com os cabecalhos do oraculo', () => {
  const servidor = iniciarServidorDeFeed(contextoDoOraculo());

  const resposta = servidor.atender({ variaveis: { feed: 'feed' } });

  assert.deepEqual(resposta.cabecalhos, {
    'Content-Type': 'application/rss+xml; charset=UTF-8',
    'Last-Modified': ULTIMA_MODIFICACAO,
    ETag: ETIQUETA,
  });
  const { status, corpo } = documento(resposta);
  assert.equal(status, 200);
  assert.equal(corpo, RSS2);
});

test('CA-8.1: o pedido sem formato nao entra no ramo de feed — e a pagina, nao o feed', () => {
  assert.equal(entraNoRamoDeFeed({}), false);
  assert.equal(entraNoRamoDeFeed({ feed: '' }), false);
  // `empty( '0' )`: o tipo HTML, mesmo que `WP_Query` ache que e feed.
  assert.equal(entraNoRamoDeFeed({ feed: '0' }), false);
  // `error` preenchido vai para o ramo do `404`, antes do de feed.
  assert.equal(entraNoRamoDeFeed({ feed: 'rss2', error: '404' }), false);
  assert.equal(entraNoRamoDeFeed({ feed: 'rss2' }), true);
});

test('CA-8.1: ?feed=_rss2 — o cabecalho le o cru (desconhecido) e o modelo conserta o tipo', () => {
  const servidor = iniciarServidorDeFeed(
    contextoDoOraculo({ formato: '_rss2', enderecoProprio: `${SITE}/?feed=_rss2` }),
  );

  const resposta = servidor.atender({ variaveis: { feed: '_rss2' } });

  // O oraculo responde `application/rss+xml`: o `header( ..., true )` do modelo
  // substitui o `application/octet-stream` que `send_headers()` pos.
  assert.equal(tipoDeConteudoDoFeed('_rss2'), 'application/octet-stream');
  const { tipo, corpo } = documento(resposta);
  assert.equal(tipo, 'application/rss+xml; charset=UTF-8');
  assert.equal(corpo, RSS2.replace(`${SITE}/feed/`, `${SITE}/?feed=_rss2`));
});

test('CA-8.1: formato sem tratador e 404 em XML, sem Last-Modified e com o ETag do ramo', () => {
  for (const formato of ['nada', 'rss-http']) {
    const servidor = iniciarServidorDeFeed(contextoDoOraculo({ formato }));

    const resposta = servidor.atender({ variaveis: { feed: formato } });

    assert.equal(resposta.tipo, 'formato-invalido');
    assert.ok(resposta.tipo === 'formato-invalido');
    assert.equal(resposta.status, 404);
    assert.equal(resposta.corpo, FORMATO_INVALIDO);
    assert.deepEqual(resposta.cabecalhos, {
      'Content-Type': 'text/xml; charset=UTF-8',
      ETag: ETIQUETA,
      Expires: 'Wed, 11 Jan 1984 05:00:00 GMT',
      'Cache-Control': 'no-cache, must-revalidate, max-age=0, no-store, private',
    });
  }
});

test('CA-8.1: GET condicional — 304 sem corpo, nas tres combinacoes conferidas no oraculo', () => {
  const servidor = iniciarServidorDeFeed(contextoDoOraculo());
  const pedir = (condicional: { ifNoneMatch?: string; ifModifiedSince?: string }) =>
    servidor.atender({ variaveis: { feed: 'feed' }, condicional }).tipo;

  assert.equal(pedir({ ifNoneMatch: ETIQUETA }), 'nao-modificado');
  assert.equal(pedir({ ifModifiedSince: ULTIMA_MODIFICACAO }), 'nao-modificado');
  // Com os dois, os dois precisam bater.
  assert.equal(pedir({ ifModifiedSince: ULTIMA_MODIFICACAO, ifNoneMatch: '"x"' }), 'documento');
  assert.equal(pedir({ ifModifiedSince: 'Sun, 11 Oct 2026 22:10:36 GMT' }), 'documento');
});

test('CA-8.1: a data de comentario so entra no Last-Modified de feed de comentario ou de singular', () => {
  const contexto = contextoDoOraculo();
  const comComentarioMaisNovo: ContextoDoFeed = {
    ...contexto,
    datas: { ...contexto.datas, ultimaModificacaoDeComentarioGmt: '2026-10-12 08:00:00' },
  };
  const servidor = iniciarServidorDeFeed(comComentarioMaisNovo);
  const ultima = (variaveis: Record<string, string>) =>
    servidor.atender({ variaveis: { feed: 'feed', ...variaveis } }).cabecalhos['Last-Modified'];

  assert.equal(ultima({}), ULTIMA_MODIFICACAO);
  assert.equal(ultima({ withcomments: '1' }), 'Mon, 12 Oct 2026 08:00:00 GMT');
  assert.equal(ultima({ feed: 'comments-rss2' }), 'Mon, 12 Oct 2026 08:00:00 GMT');
  assert.equal(ultima({ name: 'hello-world' }), 'Mon, 12 Oct 2026 08:00:00 GMT');
  assert.equal(ultima({ name: 'hello-world', withoutcomments: '1' }), ULTIMA_MODIFICACAO);
});

// ---------------------------------------------------------------------------
// CA-8.2 — a mesma consulta publica, sem regra de visibilidade propria
// ---------------------------------------------------------------------------

test('CA-8.2: o feed lista exatamente o que a consulta devolveu, na ordem dela', () => {
  const conteudos = [PAGINA_DE_EXEMPLO, OLA_MUNDO];
  const servidor = iniciarServidorDeFeed(contextoDoOraculo({ conteudos }));

  const { corpo } = documento(servidor.atender({ variaveis: { feed: 'feed' } }));

  const titulos = [...corpo.matchAll(/<item>\n\t\t<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  assert.deepEqual(titulos, ['Sample Page', 'Hello world!']);
});

test('CA-8.2: o contexto do feed nao tem como consultar — so o resultado chega', () => {
  const { consulta } = contextoDoOraculo();
  // Nenhum campo da consulta e funcao: o feed nao decide o que entra.
  for (const [campo, valor] of Object.entries(consulta)) {
    assert.notEqual(typeof valor, 'function', campo);
  }
});

test('CA-8.2: os comentarios valem por si — conteudo esvaziado pela consulta nao os tira (7.1.2)', () => {
  // No 7.1.2 os comentarios do feed singular sao lidos antes da conferencia de
  // estado (`class-wp-query.php:3487` contra `:3525`): o conteudo nao publico
  // some do laco, e os comentarios dele continuam. O feed nao cruza um com o
  // outro.
  const servidor = iniciarServidorDeFeed(
    contextoDoOraculo({
      formato: 'feed',
      tipos: { singular: true, single: true, feedDeComentarios: true },
      conteudos: [],
      comentarios: [COMENTARIO],
    }),
  );

  const { corpo } = documento(servidor.atender({ variaveis: { feed: 'feed', name: 'privado' } }));

  assert.match(corpo, /<title>\n\tComments on: \t<\/title>/);
  assert.match(corpo, /<title>\n\t\tBy: A WordPress Commenter\t\t<\/title>/);
  // Laco de conteudo vazio: a data de construcao cai na ultima modificacao.
  assert.match(corpo, /<lastBuildDate>Sun, 11 Oct 2026 22:10:37 \+0000<\/lastBuildDate>/);
});

test('CA-8.2: conteudo protegido entra no feed; o corpo e o resumo sao os que a consulta trouxe', () => {
  const protegido: ConteudoNoFeed = {
    ...OLA_MUNDO,
    senhaExigida: true,
    resumoRss: 'There is no excerpt because this is a protected post.',
    conteudoDoFeed: () => '',
    anexos: ['http://x.test/a.mp3\n123\naudio/mpeg mpga'],
  };
  const servidor = iniciarServidorDeFeed(contextoDoOraculo({ conteudos: [protegido] }));

  const { corpo } = documento(servidor.atender({ variaveis: { feed: 'feed' } }));

  assert.match(corpo, /<title>Hello world!<\/title>/);
  // Corpo vazio: o resumo vai no lugar (`feed-rss2.php:105`).
  assert.match(
    corpo,
    /<content:encoded><!\[CDATA\[There is no excerpt because this is a protected post.\]\]><\/content:encoded>/,
  );
  // Sem senha, sem anexo (`feed.php:476`).
  assert.doesNotMatch(corpo, /<enclosure/);
});

// ---------------------------------------------------------------------------
// CA-8.3 — feed de conteudo e de comentarios, global e por conteudo
// ---------------------------------------------------------------------------

test('CA-8.3: feed de conteudo em Atom, RDF e RSS 0.92, byte a byte', () => {
  const casos = [
    { formato: 'atom', proprio: `${SITE}/feed/atom/`, esperado: ATOM, tipo: 'application/atom+xml' },
    { formato: 'rdf', proprio: `${SITE}/feed/rdf/`, esperado: RDF, tipo: 'application/rdf+xml' },
    { formato: 'rss', proprio: `${SITE}/feed/rss/`, esperado: RSS, tipo: 'application/rss+xml' },
  ];
  for (const caso of casos) {
    const servidor = iniciarServidorDeFeed(
      contextoDoOraculo({ formato: caso.formato, enderecoProprio: caso.proprio }),
    );

    const { tipo, corpo } = documento(servidor.atender({ variaveis: { feed: caso.formato } }));

    assert.equal(corpo, caso.esperado, caso.formato);
    assert.equal(tipo, `${caso.tipo}; charset=UTF-8`, caso.formato);
  }
});

test('CA-8.3: feed de comentarios global, em RSS2 e Atom, byte a byte', () => {
  const tipos = { feedDeComentarios: true };
  const rss2 = iniciarServidorDeFeed(
    contextoDoOraculo({ tipos, comentarios: [COMENTARIO], enderecoProprio: `${SITE}/comments/feed/` }),
  );
  const atom = iniciarServidorDeFeed(
    contextoDoOraculo({ formato: 'atom', tipos, comentarios: [COMENTARIO] }),
  );

  assert.equal(documento(rss2.atender({ variaveis: { feed: 'feed', withcomments: '1' } })).corpo, RSS2_COMENTARIOS);
  assert.equal(documento(atom.atender({ variaveis: { feed: 'atom', withcomments: '1' } })).corpo, ATOM_COMENTARIOS);
});

test('CA-8.3: feed de comentarios de um conteudo, em RSS2 e Atom, byte a byte', () => {
  const tipos = { singular: true, single: true, feedDeComentarios: true };
  const rss2 = iniciarServidorDeFeed(
    contextoDoOraculo({ tipos, comentarios: [COMENTARIO], enderecoProprio: `${OLA}feed/` }),
  );
  const atom = iniciarServidorDeFeed(
    contextoDoOraculo({ formato: 'atom', tipos, comentarios: [COMENTARIO] }),
  );

  assert.equal(
    documento(rss2.atender({ variaveis: { feed: 'feed', name: 'hello-world' } })).corpo,
    RSS2_COMENTARIOS_DO_CONTEUDO,
  );
  assert.equal(
    documento(atom.atender({ variaveis: { feed: 'atom', name: 'hello-world' } })).corpo,
    ATOM_COMENTARIOS_DO_CONTEUDO,
  );
});

test('CA-8.3: pagina sem comentario — canal sem item, e o <link> e o do site (is_single falso)', () => {
  const servidor = iniciarServidorDeFeed(
    contextoDoOraculo({
      tipos: { singular: true, single: false, feedDeComentarios: true },
      conteudos: [PAGINA_DE_EXEMPLO],
      enderecoProprio: `${SITE}/sample-page/feed/`,
    }),
  );

  const { corpo } = documento(servidor.atender({ variaveis: { feed: 'feed', pagename: 'sample-page' } }));

  assert.equal(corpo, RSS2_COMENTARIOS_DA_PAGINA);
});

test('CA-8.3: RDF e RSS 0.92 ignoram o pedido de comentarios — servem o feed de conteudo', () => {
  // `do_feed_rdf` e `do_feed_rss` sao registrados com zero argumentos
  // (`default-filters.php:420`-`:421`); conferido em `/comments/feed/rdf/`.
  const servidor = iniciarServidorDeFeed(
    contextoDoOraculo({
      formato: 'rdf',
      tipos: { feedDeComentarios: true },
      comentarios: [COMENTARIO],
    }),
  );

  const { corpo } = documento(servidor.atender({ variaveis: { feed: 'comments-rdf' } }));

  assert.equal(corpo, RDF);
});

test('CA-8.3: os quatro tratadores do nucleo, e add_feed troca o do nucleo', () => {
  const servidor = iniciarServidorDeFeed(contextoDoOraculo({ formato: 'rss2' }));
  assert.deepEqual(servidor.registro.nomes(), [...FORMATOS_DE_FEED_DO_NUCLEO]);

  servidor.registro.registrar('rss2', () => ({ tipoDeConteudo: 'text/plain', corpo: 'meu' }));

  assert.equal(servidor.despachar()?.corpo, 'meu');
  // Um servidor novo nao herda o registro do outro.
  assert.equal(
    iniciarServidorDeFeed(contextoDoOraculo({ formato: 'rss2' })).despachar()?.corpo,
    RSS2,
  );
});

test('CA-8.3: rss_use_excerpt ligado tira o corpo, nos tres modelos que o leem', () => {
  for (const formato of ['rss2', 'atom', 'rdf']) {
    const servidor = iniciarServidorDeFeed(contextoDoOraculo({ formato, rssUseExcerpt: '1' }));

    const corpo = servidor.despachar()?.corpo ?? '';

    assert.doesNotMatch(corpo, /wp-block-paragraph/, formato);
    assert.match(corpo, /Welcome to WordPress\. This is your first post/, formato);
  }
});

// ---------------------------------------------------------------------------
// CA-8.4 — o formato padrao e declarado e usado quando o pedido nao nomeia um
// ---------------------------------------------------------------------------

test('CA-8.4: o formato padrao e rss2, declarado num ponto nomeado', () => {
  assert.equal(FORMATO_DE_FEED_PADRAO, 'rss2');
  assert.equal(formatoDeFeedPadrao(), 'rss2');
  assert.equal(TIPOS_DE_CONTEUDO_DO_FEED['rss2'], 'application/rss+xml');
  assert.equal(OPCOES_DE_FABRICA_DO_FEED.rss_use_excerpt, '0');
});

test('CA-8.4: pedido sem formato, ou com "feed", usa o padrao — no despacho e no cabecalho', () => {
  assert.equal(formatoPedidoNoDespacho('', 'rss2'), 'rss2');
  assert.equal(formatoPedidoNoDespacho('feed', 'rss2'), 'rss2');
  assert.equal(formatoPedidoNoDespacho('__feed', 'rss2'), 'rss2');
  assert.equal(formatoPedidoNoDespacho('atom', 'rss2'), 'atom');
  assert.equal(tipoDeConteudoDoFeed(''), 'application/rss+xml');

  const servidor = iniciarServidorDeFeed(contextoDoOraculo({ formato: '' }));
  assert.equal(servidor.despachar()?.corpo, RSS2);
});

test('CA-8.4: o padrao filtrado vale nas duas etapas, e "rss" filtrado vira "rss2"', () => {
  assert.equal(formatoDeFeedPadrao('rss'), 'rss2');
  assert.equal(formatoDeFeedPadrao('atom'), 'atom');

  const servidor = iniciarServidorDeFeed(
    contextoDoOraculo({ formatoPadraoFiltrado: 'atom', enderecoProprio: `${SITE}/feed/atom/` }),
  );
  const { tipo, corpo } = documento(servidor.atender({ variaveis: { feed: 'feed' } }));

  assert.equal(servidor.formatoPadrao(), 'atom');
  assert.equal(tipo, 'application/atom+xml; charset=UTF-8');
  assert.equal(corpo, ATOM);
});

// ---------------------------------------------------------------------------
// O modulo
// ---------------------------------------------------------------------------

test('CA-8.2: o modulo serve o feed sem tocar a porta de dados, e um servidor por chamada', () => {
  const comandos: string[] = [];
  const dados: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    selecionar: (consulta) => {
      comandos.push(String(consulta));
      return [];
    },
    escrever: (consulta) => {
      comandos.push(String(consulta));
      return { linhasAfetadas: 0, idGerado: null };
    },
  };
  const modulo = criarModuloDeSuperficiesProgramaticas({ dados });
  const contexto = contextoDoOraculo();

  const um = modulo.iniciarFeed(contexto);
  const outro = modulo.iniciarFeed(contexto);

  assert.equal(documento(um.atender({ variaveis: { feed: 'feed' } })).corpo, RSS2);
  assert.notEqual(um.registro, outro.registro);
  // Nenhum comando: a consulta e da leitura publica, e o feed so le o resultado.
  assert.deepEqual(comandos, []);
});
