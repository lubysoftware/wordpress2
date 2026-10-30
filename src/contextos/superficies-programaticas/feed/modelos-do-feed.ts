/**
 * Os seis modelos de feed do nucleo, byte a byte.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8). Satisfaz
 * **CA-8.3** (*"ha feed de conteudo e feed de comentarios, global e por
 * conteudo"*) e e a metade de **CA-8.1** que sai do mesmo endereco: o documento
 * em formato de feed.
 *
 * | modelo | arquivo do legado | tratador que o carrega |
 * |---|---|---|
 * | RSS2 de conteudo | `wp-includes/feed-rss2.php` | `do_feed_rss2( false )`, `wp-includes/functions.php:1680` |
 * | RSS2 de comentarios | `wp-includes/feed-rss2-comments.php` | `do_feed_rss2( true )` |
 * | Atom de conteudo | `wp-includes/feed-atom.php` | `do_feed_atom( false )`, `functions.php:1697` |
 * | Atom de comentarios | `wp-includes/feed-atom-comments.php` | `do_feed_atom( true )` |
 * | RDF (RSS 1.0) | `wp-includes/feed-rdf.php` | `do_feed_rdf()`, `functions.php:1656` |
 * | RSS 0.92 | `wp-includes/feed-rss.php` | `do_feed_rss()`, `functions.php:1667` |
 *
 * "Global e por conteudo" nao sao dois modelos: e o **mesmo** modelo de
 * comentarios, e o que muda e `is_singular()` — o titulo (*"Comments for"* contra
 * *"Comments on"*), o `<link>` do canal e o titulo de cada item. A consulta que
 * decide quais comentarios entram e de `004-leitura-publica` (ver
 * `./contexto-do-feed.ts`).
 *
 * ## Como os bytes foram fixados
 *
 * O legado escreve feed por **modelo literal de PHP**, e nao por serializador
 * (`plan.md`, slot `xml`). O espaco em branco e o do arquivo, com uma regra que
 * um porte erra em quase toda linha: **o `?>` come a quebra de linha que vem
 * logo depois dele**, e o recuo antes de `<?php` e texto. Cada funcao abaixo foi
 * escrita lendo as linhas cruas do modelo e conferida contra o oraculo
 * executavel (`scripts/oraculo/`), para o site da instalacao nova — ver
 * `./us-8-servir-feeds.test.ts`.
 *
 * ⚠️ **O oraculo no ar e 7.1.4**, e nao 7.1.2: a instalacao se autoatualizou.
 * Os arquivos que produzem estes bytes — os seis modelos, `feed.php`,
 * `functions.php`, `general-template.php`, `formatting.php`,
 * `default-filters.php`, `class-wp.php` e `template-loader.php` — sao
 * **identicos** entre as duas versoes (conferido por `diff`); muda so o numero
 * da versao no gerador, que aqui chega por `SiteNoFeed.versaoRss`.
 *
 * ## Os pontos de extensao
 *
 * Cada modelo dispara acoes no meio do documento (`rss_tag_pre`, `rss2_ns`,
 * `rss2_head`, `rss2_item`, `atom_ns`, `atom_head`, `atom_author`, `atom_entry`,
 * `rdf_ns`, `rdf_header`, `rdf_item`, `rss_head`, `rss_item`, `rss2_comments_ns`,
 * `commentsrss2_head`, `commentrss2_item`, `atom_comments_ns`,
 * `comments_atom_head`, `comment_atom_entry`) e filtra valores
 * (`rss_update_period`, `rss_update_frequency`, `get_feed_build_date`,
 * `the_category_rss`, `rss_enclosure`, `atom_enclosure`, `the_generator`,
 * `get_the_generator_{tipo}`). Ficam **declarados**, na posicao em que o legado
 * os dispara, e nao emitidos: o barramento nao tem tarefa (REQ-162 esta em
 * `do-not-rewrite.md`). O que o **nucleo** pendura neles por fabrica sai, porque
 * e o comportamento de uma instalacao nova: o gerador em seis cabecalhos e o
 * icone do site no RSS2 e no Atom (`wp-includes/default-filters.php:402`-`:408`).
 */

import { absintComoNoPhp } from '../mapa-do-site/index.js';
import type {
  ComentarioNoFeed,
  ConteudoNoFeed,
  ContextoDoFeed,
  FormatacaoNoFeed,
} from './contexto-do-feed.js';
import {
  FORMATO_DE_DATA_ATOM,
  FORMATO_DE_DATA_RSS,
  formatarDataDaColuna,
  formatarDataDoConteudo,
  formatarRelogio,
  lerDataDaColuna,
} from './datas-do-feed.js';
import {
  BASE_DE_ATUALIZACAO_DO_RDF,
  FREQUENCIA_DE_ATUALIZACAO_DO_FEED,
  PERIODO_DE_ATUALIZACAO_DO_FEED,
  usarSoResumo,
} from './pontos-de-configuracao.js';

/** Os cabecalhos de feed em que o nucleo pendura o gerador (`default-filters.php:402`). */
export type CabecalhoComGerador =
  | 'rss2_head'
  | 'commentsrss2_head'
  | 'rss_head'
  | 'rdf_header'
  | 'atom_head'
  | 'comments_atom_head';

/** O documento que um tratador de feed produz. */
export interface DocumentoDoFeed {
  /**
   * O `header( 'Content-Type: ...', true )` da primeira linha do modelo: ele
   * **substitui** o que `send_headers()` ja tinha posto.
   */
  readonly tipoDeConteudo: string;
  readonly corpo: string;
}

// ---------------------------------------------------------------------------
// As funcoes de `feed.php` que os modelos chamam e que sao forma, nao texto.
// ---------------------------------------------------------------------------

/** `__()` com o `ent2ncr()` que os modelos sempre aplicam por fora. */
function textoDoModelo(contexto: ContextoDoFeed, identificador: string): string {
  const traduzido = contexto.traduzir ? contexto.traduzir(identificador) : identificador;
  return contexto.formatacao.entidadesParaNumericas(traduzido);
}

/** `printf()` com `%s` e `%n$s`, que e o que os titulos usam. */
export function formatarComoPrintf(molde: string, ...valores: readonly string[]): string {
  let proximo = 0;
  return molde.replace(/%(?:(\d+)\$)?s|%%/g, (casado, posicao: string | undefined) => {
    if (casado === '%%') {
      return '%';
    }
    const indice = posicao === undefined ? proximo++ : Number(posicao) - 1;
    return valores[indice] ?? '';
  });
}

/**
 * `get_the_generator( '' )` pela acao corrente, com o `"\n"` de
 * `the_generator()` (`wp-includes/general-template.php:5400`). O tipo sai do nome
 * da acao: `rss_head` escreve o comentario de HTML, e nao uma etiqueta RSS.
 */
export function geradorDoFeed(
  cabecalho: CabecalhoComGerador,
  contexto: ContextoDoFeed,
): string {
  const { site, formatacao } = contexto;
  let gerador: string;
  switch (cabecalho) {
    case 'rss2_head':
    case 'commentsrss2_head':
      gerador = `<generator>${formatacao.sanitizarUrl(`https://wordpress.org/?v=${site.versaoRss}`)}</generator>`;
      break;
    case 'rss_head':
      gerador = `<!-- generator="WordPress/${formatacao.escAttr(site.versao)}" -->`;
      break;
    case 'rdf_header':
      gerador = `<admin:generatorAgent rdf:resource="${formatacao.sanitizarUrl(`https://wordpress.org/?v=${site.versaoRss}`)}" />`;
      break;
    case 'atom_head':
    case 'comments_atom_head':
      gerador = `<generator uri="https://wordpress.org/" version="${formatacao.escAttr(site.versaoRss)}">WordPress</generator>`;
      break;
  }
  return `${gerador}\n`;
}

/** `atom_site_icon()` (`wp-includes/feed.php:632`). */
function iconeDoSiteNoAtom(contexto: ContextoDoFeed): string {
  const endereco = contexto.site.enderecoDoIcone;
  return endereco === '' ? '' : `<icon>${contexto.formatacao.converterCaracteres(endereco)}</icon>\n`;
}

/** `rss2_site_icon()` (`wp-includes/feed.php:644`), com o espaco antes da quebra final. */
function iconeDoSiteNoRss2(contexto: ContextoDoFeed): string {
  const { site, formatacao } = contexto;
  if (site.enderecoDoIcone === '') {
    return '';
  }
  const titulo = site.tituloRss === '' || site.tituloRss === '0' ? site.nomeRss : site.tituloRss;
  return (
    '\n<image>\n' +
    `\t<url>${formatacao.converterCaracteres(site.enderecoDoIcone)}</url>\n` +
    `\t<title>${titulo}</title>\n` +
    `\t<link>${site.enderecoRss}</link>\n` +
    '\t<width>32</width>\n' +
    '\t<height>32</height>\n' +
    '</image> \n'
  );
}

/**
 * `get_feed_build_date( $formato )` (`wp-includes/feed.php:715`): a maior data
 * de modificacao do laco — e, em feed de comentarios, a maior data de
 * comentario junto —, ou a ultima modificacao do site com o laco vazio. `''`
 * quando nada se le (o `false` ecoado).
 *
 * `max()` sobre textos de data e comparacao de texto no PHP 8, e a forma
 * `Y-m-d H:i:s` faz dela a ordem do relogio.
 */
export function dataDeConstrucaoDoFeed(contexto: ContextoDoFeed, formato: string): string {
  const { consulta } = contexto;
  let data: Date | null = null;
  if (consulta.conteudos.length > 0) {
    const datas = consulta.conteudos.map((conteudo) => conteudo.modificadoGmt);
    if (consulta.tipos.feedDeComentarios && consulta.comentarios.length > 0) {
      datas.push(...consulta.comentarios.map((comentario) => comentario.dataGmt));
    }
    const maior = datas.reduce((a, b) => (b > a ? b : a));
    data = lerDataDaColuna(maior);
  }
  if (data === null && contexto.datas.ultimaModificacaoDeConteudoGmt !== false) {
    data = lerDataDaColuna(contexto.datas.ultimaModificacaoDeConteudoGmt);
  }
  return data === null ? '' : formatarRelogio(data, formato);
}

/**
 * `get_the_category_rss( $tipo )` (`wp-includes/feed.php:381`): categorias e
 * etiquetas sem repeticao, na ordem em que aparecem, em tres formas.
 */
export function listaDeCategoriasDoFeed(
  conteudo: ConteudoNoFeed,
  tipo: string,
  contexto: ContextoDoFeed,
): string {
  const { formatacao } = contexto;
  const nomes = [...new Set(conteudo.nomesDeCategoria(tipo === 'atom' ? 'raw' : 'rss'))];
  let lista = '';
  for (const nome of nomes) {
    if (tipo === 'rdf') {
      lista += `\t\t<dc:subject><![CDATA[${nome}]]></dc:subject>\n`;
    } else if (tipo === 'atom') {
      lista += `<category scheme="${formatacao.escAttr(contexto.site.enderecoRss)}" term="${formatacao.escAttr(nome)}" />`;
    } else {
      lista += `\t\t<category><![CDATA[${formatacao.decodificarEntidades(nome, contexto.opcoes.blogCharset)}]]></category>\n`;
    }
  }
  return lista;
}

/** `trim()` do PHP: espaco, tabulacao, quebras, nulo e tabulacao vertical. */
function aparar(texto: string): string {
  return texto.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
}

/** `is_numeric()` do PHP 8: espaco nas duas pontas, sinal, fracao e expoente. */
function numericoComoNoPhp(texto: string): boolean {
  return /^[ \t\n\r\v\f]*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[ \t\n\r\v\f]*$/.test(texto);
}

/** `rss_enclosure()` (`wp-includes/feed.php:475`). */
export function anexosNoRss2(conteudo: ConteudoNoFeed, formatacao: FormatacaoNoFeed): string {
  if (conteudo.senhaExigida) {
    return '';
  }
  let saida = '';
  for (const anexo of conteudo.anexos) {
    const partes = anexo.split('\n');
    if (partes.length < 3) {
      continue;
    }
    // So o primeiro tipo: `audio/mpeg` de `audio/mpeg mpga mp2 mp3` (`:495`).
    const tipo = aparar(partes[2] as string).split(/[ \t]/)[0] ?? '';
    saida +=
      `<enclosure url="${formatacao.escUrl(aparar(partes[0] as string))}"` +
      ` length="${absintComoNoPhp(aparar(partes[1] as string))}"` +
      ` type="${formatacao.escAttr(tipo)}" />\n`;
  }
  return saida;
}

/** `atom_enclosure()` (`wp-includes/feed.php:519`) — nao exige tres partes, e confere o tipo. */
export function anexosNoAtom(
  conteudo: ConteudoNoFeed,
  contexto: ContextoDoFeed,
): string {
  if (conteudo.senhaExigida) {
    return '';
  }
  const { formatacao } = contexto;
  let saida = '';
  for (const anexo of conteudo.anexos) {
    const partes = anexo.split('\n');
    const endereco = aparar(partes[0] ?? '');
    let tipo = '';
    let tamanho = '0';
    for (let i = 1; i <= 2; i++) {
      const parte = partes[i];
      if (parte === undefined) {
        continue;
      }
      if (numericoComoNoPhp(parte)) {
        tamanho = aparar(parte);
      } else if (contexto.tiposMimePermitidos.includes(parte)) {
        tipo = aparar(parte);
      }
    }
    // `%d` sobre o texto escapado: o texto numerico vira inteiro, o resto `0`.
    const escapado = formatacao.escAttr(tamanho);
    const inteiro = numericoComoNoPhp(escapado) ? Math.trunc(Number(aparar(escapado))) : 0;
    saida += `<link href="${formatacao.escUrl(endereco)}" rel="enclosure" length="${inteiro}" type="${formatacao.escAttr(tipo)}" />\n`;
  }
  return saida;
}

/** `html_type_rss()` (`wp-includes/feed.php:458`). */
function tipoHtmlDoAtom(contexto: ContextoDoFeed): string {
  return contexto.opcoes.htmlType.includes('xhtml') ? 'xhtml' : 'html';
}

/** A declaracao XML da primeira linha. O Atom de comentarios tem espaco antes de `?>`. */
function declaracaoXml(contexto: ContextoDoFeed, comEspaco = false): string {
  return `<?xml version="1.0" encoding="${contexto.opcoes.blogCharset}"${comEspaco ? ' ' : ''}?>`;
}

/** `feed_content_type( $tipo ) . '; charset=' . get_option( 'blog_charset' )`. */
function tipoDeConteudoDoModelo(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
  tipo: string,
): string {
  return `${tipoDeConteudoDoFeed(tipo)}; charset=${contexto.opcoes.blogCharset}`;
}

/** Os dois blocos de atualizacao do RSS2 e do RDF, com o recuo do `?>`. */
function blocosDeAtualizacao(): string {
  return (
    '\t<sy:updatePeriod>\n' +
    `\t${PERIODO_DE_ATUALIZACAO_DO_FEED}\t</sy:updatePeriod>\n` +
    '\t<sy:updateFrequency>\n' +
    `\t${FREQUENCIA_DE_ATUALIZACAO_DO_FEED}\t</sy:updateFrequency>\n`
  );
}

/** `get_comments_number() || comments_open()`. */
function temComentarios(conteudo: ConteudoNoFeed): boolean {
  return conteudo.numeroDeComentarios > 0 || conteudo.comentariosAbertos;
}

/** O titulo do canal de comentarios: singular, busca ou o site. */
function tituloDoCanalDeComentarios(
  contexto: ContextoDoFeed,
  moldeSingular: string,
): string {
  const { consulta, site } = contexto;
  if (consulta.tipos.singular) {
    // `get_the_title_rss()` do `$post` global, que `register_globals()` pos no
    // primeiro do laco; laco vazio, titulo vazio.
    return formatarComoPrintf(
      textoDoModelo(contexto, moldeSingular),
      consulta.conteudos[0]?.tituloRss ?? '',
    );
  }
  if (consulta.tipos.busca) {
    return formatarComoPrintf(
      textoDoModelo(contexto, 'Comments for %1$s searching on %2$s'),
      site.nomeRss,
      site.termoDeBusca,
    );
  }
  return formatarComoPrintf(textoDoModelo(contexto, 'Comments for %s'), site.tituloRss);
}

/** O titulo de um item de comentario (`feed-rss2-comments.php:84`-`:93`). */
function tituloDoComentario(contexto: ContextoDoFeed, comentario: ComentarioNoFeed): string {
  if (!contexto.consulta.tipos.singular) {
    return formatarComoPrintf(
      textoDoModelo(contexto, 'Comment on %1$s by %2$s'),
      comentario.tituloDoConteudoRss,
      comentario.autorRss,
    );
  }
  return formatarComoPrintf(textoDoModelo(contexto, 'By: %s'), comentario.autorRss);
}

// ---------------------------------------------------------------------------
// Os seis modelos.
// ---------------------------------------------------------------------------

/** `wp-includes/feed-rss2.php`. */
export function modeloRss2(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta, opcoes } = contexto;
  // `rss_tag_pre` ('rss2') e `rss2_ns`: declarados.
  let corpo =
    declaracaoXml(contexto) +
    '<rss version="2.0"\n' +
    '\txmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
    '\txmlns:wfw="http://wellformedweb.org/CommentAPI/"\n' +
    '\txmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
    '\txmlns:atom="http://www.w3.org/2005/Atom"\n' +
    '\txmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
    '\txmlns:slash="http://purl.org/rss/1.0/modules/slash/"\n' +
    '\t>\n' +
    '\n' +
    '<channel>\n' +
    `\t<title>${site.tituloRss}</title>\n` +
    `\t<atom:link href="${site.enderecoProprio}" rel="self" type="application/rss+xml" />\n` +
    `\t<link>${site.enderecoRss}</link>\n` +
    `\t<description>${site.descricaoRss}</description>\n` +
    `\t<lastBuildDate>${dataDeConstrucaoDoFeed(contexto, 'r')}</lastBuildDate>\n` +
    `\t<language>${site.idiomaRss}</language>\n` +
    blocosDeAtualizacao() +
    // `rss2_head`: o gerador e o icone do site, por fabrica.
    '\t' +
    geradorDoFeed('rss2_head', contexto) +
    iconeDoSiteNoRss2(contexto);

  const soResumo = usarSoResumo(opcoes.rssUseExcerpt);
  for (const conteudo of consulta.conteudos) {
    const comentarios = temComentarios(conteudo);
    corpo +=
      '\t<item>\n' +
      `\t\t<title>${conteudo.tituloRss}</title>\n` +
      `\t\t<link>${conteudo.enderecoRss}</link>\n` +
      '\t\t' +
      (comentarios ? `\t\t\t<comments>${conteudo.enderecoDosComentarios}</comments>\n` : '') +
      '\t\t' +
      '\n' +
      `\t\t<dc:creator><![CDATA[${conteudo.autor}]]></dc:creator>\n` +
      `\t\t<pubDate>${formatarDataDoConteudo(conteudo.publicadoGmt, FORMATO_DE_DATA_RSS)}</pubDate>\n` +
      '\t\t' +
      listaDeCategoriasDoFeed(conteudo, 'rss2', contexto) +
      `\t\t<guid isPermaLink="false">${conteudo.guid}</guid>\n` +
      '\n' +
      '\t\t';
    if (soResumo) {
      corpo += `\t\t\t<description><![CDATA[${conteudo.resumoRss}]]></description>\n` + '\t\t';
    } else {
      const texto = conteudo.conteudoDoFeed('rss2');
      corpo +=
        `\t\t\t<description><![CDATA[${conteudo.resumoRss}]]></description>\n` +
        '\t\t\t' +
        '\t\t\t' +
        // `strlen( $content ) > 0` — sem corpo, o resumo vai no lugar dele.
        `\t\t\t\t<content:encoded><![CDATA[${texto.length > 0 ? texto : conteudo.resumoRss}]]></content:encoded>\n` +
        '\t\t\t' +
        '\t\t';
    }
    corpo +=
      '\n' +
      '\t\t' +
      (comentarios
        ? `\t\t\t<wfw:commentRss>${conteudo.enderecoDoFeedDeComentarios('rss2')}</wfw:commentRss>\n` +
          `\t\t\t<slash:comments>${conteudo.numeroDeComentarios}</slash:comments>\n` +
          '\t\t'
        : '') +
      '\n' +
      '\t\t' +
      anexosNoRss2(conteudo, contexto.formatacao) +
      '\n' +
      // `rss2_item`: declarado.
      '\t\t' +
      '\t</item>\n' +
      '\t';
  }
  corpo += '</channel>\n</rss>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'rss2'), corpo };
}

/** `wp-includes/feed-rss2-comments.php`. */
export function modeloRss2DeComentarios(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta } = contexto;
  const enderecoDoCanal = consulta.tipos.single
    ? (consulta.conteudos[0]?.enderecoRss ?? '')
    : site.enderecoRss;
  // `rss_tag_pre` ('rss2-comments'), `rss2_ns` e `rss2_comments_ns`: declarados.
  let corpo =
    declaracaoXml(contexto) +
    '<rss version="2.0"\n' +
    '\txmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
    '\txmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
    '\txmlns:atom="http://www.w3.org/2005/Atom"\n' +
    '\txmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
    '\t\n' +
    '\t>\n' +
    '<channel>\n' +
    '\t<title>\n' +
    `\t${tituloDoCanalDeComentarios(contexto, 'Comments on: %s')}\t</title>\n` +
    `\t<atom:link href="${site.enderecoProprio}" rel="self" type="application/rss+xml" />\n` +
    `\t<link>${enderecoDoCanal}</link>\n` +
    `\t<description>${site.descricaoRss}</description>\n` +
    `\t<lastBuildDate>${dataDeConstrucaoDoFeed(contexto, 'r')}</lastBuildDate>\n` +
    blocosDeAtualizacao() +
    // `commentsrss2_head`: o gerador, por fabrica.
    '\t' +
    geradorDoFeed('commentsrss2_head', contexto);

  for (const comentario of consulta.comentarios) {
    corpo +=
      '\t<item>\n' +
      '\t\t<title>\n' +
      `\t\t${tituloDoComentario(contexto, comentario)}\t\t</title>\n` +
      `\t\t<link>${comentario.endereco}</link>\n` +
      '\n' +
      `\t\t<dc:creator><![CDATA[${comentario.autorRss}]]></dc:creator>\n` +
      `\t\t<pubDate>${formatarDataDaColuna(comentario.dataGmt, FORMATO_DE_DATA_RSS)}</pubDate>\n` +
      `\t\t<guid isPermaLink="false">${comentario.guid}</guid>\n` +
      '\n' +
      '\t\t' +
      (comentario.senhaDoConteudoExigida
        ? `\t\t\t<description>${textoDoModelo(contexto, 'Protected Comments: Please enter your password to view comments.')}</description>\n` +
          `\t\t\t<content:encoded><![CDATA[${comentario.formularioDeSenha}]]></content:encoded>\n`
        : `\t\t\t<description><![CDATA[${comentario.textoRss}]]></description>\n` +
          `\t\t\t<content:encoded><![CDATA[${comentario.texto}]]></content:encoded>\n`) +
      '\t\t' +
      '\n' +
      // `commentrss2_item`: declarado.
      '\t\t' +
      '\t</item>\n' +
      '\t';
  }
  corpo += '</channel>\n</rss>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'rss2'), corpo };
}

/** `wp-includes/feed-atom.php`. */
export function modeloAtom(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta, opcoes } = contexto;
  const tipoHtml = tipoHtmlDoAtom(contexto);
  // `rss_tag_pre` ('atom') e `atom_ns`: declarados.
  let corpo =
    declaracaoXml(contexto) +
    '<feed\n' +
    '\txmlns="http://www.w3.org/2005/Atom"\n' +
    '\txmlns:thr="http://purl.org/syndication/thread/1.0"\n' +
    `\txml:lang="${site.idiomaRss}"\n` +
    '\t>\n' +
    `\t<title type="text">${site.tituloRss}</title>\n` +
    `\t<subtitle type="text">${site.descricaoRss}</subtitle>\n` +
    '\n' +
    `\t<updated>${dataDeConstrucaoDoFeed(contexto, FORMATO_DE_DATA_ATOM)}</updated>\n` +
    '\n' +
    `\t<link rel="alternate" type="${site.tipoHtmlRss}" href="${site.enderecoRss}" />\n` +
    `\t<id>${site.enderecoAtom}</id>\n` +
    `\t<link rel="self" type="application/atom+xml" href="${site.enderecoProprio}" />\n` +
    '\n' +
    // `atom_head`: o gerador e o icone do site, por fabrica.
    '\t' +
    geradorDoFeed('atom_head', contexto) +
    iconeDoSiteNoAtom(contexto);

  const soResumo = usarSoResumo(opcoes.rssUseExcerpt);
  for (const conteudo of consulta.conteudos) {
    corpo +=
      '\t<entry>\n' +
      '\t\t<author>\n' +
      `\t\t\t<name>${conteudo.autor}</name>\n` +
      '\t\t\t' +
      (conteudo.enderecoDoAutor !== '' && conteudo.enderecoDoAutor !== '0'
        ? `\t\t\t\t<uri>${conteudo.enderecoDoAutor}</uri>\n` + '\t\t\t\t'
        : '') +
      // `atom_author`: declarado.
      '\t\t</author>\n' +
      '\n' +
      `\t\t<title type="${tipoHtml}"><![CDATA[${conteudo.tituloRss}]]></title>\n` +
      `\t\t<link rel="alternate" type="${site.tipoHtmlRss}" href="${conteudo.enderecoRss}" />\n` +
      '\n' +
      `\t\t<id>${conteudo.guid}</id>\n` +
      `\t\t<updated>${formatarDataDoConteudo(conteudo.modificadoGmt, FORMATO_DE_DATA_ATOM)}</updated>\n` +
      `\t\t<published>${formatarDataDoConteudo(conteudo.publicadoGmt, FORMATO_DE_DATA_ATOM)}</published>\n` +
      '\t\t' +
      listaDeCategoriasDoFeed(conteudo, 'atom', contexto) +
      '\n' +
      `\t\t<summary type="${tipoHtml}"><![CDATA[${conteudo.resumoRss}]]></summary>\n` +
      '\n' +
      '\t\t' +
      (soResumo
        ? ''
        : `\t\t\t<content type="${tipoHtml}" xml:base="${conteudo.enderecoRss}"><![CDATA[${conteudo.conteudoDoFeed('atom')}]]></content>\n` +
          '\t\t') +
      '\n' +
      '\t\t' +
      anexosNoAtom(conteudo, contexto) +
      // `atom_entry`: declarado.
      (temComentarios(conteudo)
        ? `\t\t\t<link rel="replies" type="${site.tipoHtmlRss}" href="${conteudo.enderecoRss}#comments" thr:count="${conteudo.numeroDeComentarios}" />\n` +
          `\t\t\t<link rel="replies" type="application/atom+xml" href="${conteudo.enderecoDoFeedDeComentarios('atom')}" thr:count="${conteudo.numeroDeComentarios}" />\n` +
          `\t\t\t<thr:total>${conteudo.numeroDeComentarios}</thr:total>\n` +
          '\t\t'
        : '') +
      '\t</entry>\n' +
      '\t';
  }
  corpo += '</feed>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'atom'), corpo };
}

/** `wp-includes/feed-atom-comments.php`. */
export function modeloAtomDeComentarios(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta } = contexto;
  let enlaces: string;
  if (consulta.tipos.singular) {
    const conteudo = consulta.conteudos[0];
    const proprio = conteudo?.enderecoDoFeedDeComentarios('atom') ?? '';
    enlaces =
      `\t<link rel="alternate" type="${site.tipoHtmlRss}" href="${conteudo?.enderecoDosComentarios ?? ''}" />\n` +
      `\t<link rel="self" type="application/atom+xml" href="${proprio}" />\n` +
      `\t<id>${proprio}</id>\n`;
  } else if (consulta.tipos.busca) {
    enlaces =
      `\t<link rel="alternate" type="${site.tipoHtmlRss}" href="${site.enderecoInicial}?s=${site.termoDeBusca}" />\n` +
      `\t<link rel="self" type="application/atom+xml" href="${site.enderecoDoFeedDeComentariosDaBusca}" />\n` +
      `\t<id>${site.enderecoDoFeedDeComentariosDaBusca}</id>\n`;
  } else {
    enlaces =
      `\t<link rel="alternate" type="${site.tipoHtmlRss}" href="${site.enderecoRss}" />\n` +
      `\t<link rel="self" type="application/atom+xml" href="${site.enderecoAtomDosComentariosRss}" />\n` +
      `\t<id>${site.enderecoAtomDosComentariosRss}</id>\n`;
  }
  // `rss_tag_pre` ('atom-comments'), `atom_ns` e `atom_comments_ns`: declarados.
  let corpo =
    declaracaoXml(contexto, true) +
    '<feed\n' +
    '\txmlns="http://www.w3.org/2005/Atom"\n' +
    `\txml:lang="${site.idiomaRss}"\n` +
    '\txmlns:thr="http://purl.org/syndication/thread/1.0"\n' +
    '\t>\n' +
    '\t<title type="text">\n' +
    `\t${tituloDoCanalDeComentarios(contexto, 'Comments on %s')}\t</title>\n` +
    `\t<subtitle type="text">${site.descricaoRss}</subtitle>\n` +
    '\n' +
    `\t<updated>${dataDeConstrucaoDoFeed(contexto, FORMATO_DE_DATA_ATOM)}</updated>\n` +
    '\n' +
    enlaces +
    // `comments_atom_head`: o gerador, por fabrica — e sem recuo.
    geradorDoFeed('comments_atom_head', contexto);

  for (const comentario of consulta.comentarios) {
    const data = formatarDataDaColuna(comentario.dataGmt, FORMATO_DE_DATA_ATOM);
    const respondido = comentario.respondeA;
    corpo +=
      '\t<entry>\n' +
      '\t\t<title>\n' +
      `\t\t${tituloDoComentario(contexto, comentario)}\t\t</title>\n` +
      `\t\t<link rel="alternate" href="${comentario.endereco}" type="${site.tipoHtmlRss}" />\n` +
      '\n' +
      '\t\t<author>\n' +
      `\t\t\t<name>${comentario.autorRss}</name>\n` +
      '\t\t\t' +
      (comentario.enderecoDoAutor !== '' && comentario.enderecoDoAutor !== '0'
        ? `<uri>${comentario.enderecoDoAutor}</uri>`
        : '') +
      '\n' +
      '\t\t</author>\n' +
      '\n' +
      `\t\t<id>${comentario.guid}</id>\n` +
      `\t\t<updated>${data}</updated>\n` +
      `\t\t<published>${data}</published>\n` +
      '\n' +
      '\t\t' +
      `\t\t\t<content type="html" xml:base="${comentario.endereco}"><![CDATA[${comentario.senhaDoConteudoExigida ? comentario.formularioDeSenha : comentario.texto}]]></content>\n` +
      '\t\t' +
      '\n' +
      '\t\t' +
      (respondido === null
        ? `\t\t\t<thr:in-reply-to ref="${comentario.conteudo.guid}" href="${comentario.conteudo.enderecoRss}" type="${site.tipoHtmlRss}" />\n`
        : `\t\t\t<thr:in-reply-to ref="${respondido.guid}" href="${respondido.endereco}" type="${site.tipoHtmlRss}" />\n`) +
      '\t\t\t' +
      // `comment_atom_entry`: declarado.
      '\t</entry>\n' +
      '\t';
  }
  corpo += '</feed>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'atom'), corpo };
}

/**
 * `wp-includes/feed-rdf.php` — percorre o laco **duas** vezes (`rewind_posts()`,
 * `:70`): a sequencia de enderecos e depois os itens.
 */
export function modeloRdf(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta, opcoes } = contexto;
  // `rss_tag_pre` ('rdf') e `rdf_ns`: declarados.
  let corpo =
    declaracaoXml(contexto) +
    '<rdf:RDF\n' +
    '\txmlns="http://purl.org/rss/1.0/"\n' +
    '\txmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n' +
    '\txmlns:dc="http://purl.org/dc/elements/1.1/"\n' +
    '\txmlns:sy="http://purl.org/rss/1.0/modules/syndication/"\n' +
    '\txmlns:admin="http://webns.net/mvcb/"\n' +
    '\txmlns:content="http://purl.org/rss/1.0/modules/content/"\n' +
    '\t>\n' +
    `<channel rdf:about="${site.enderecoRss}">\n` +
    `\t<title>${site.tituloRss}</title>\n` +
    `\t<link>${site.enderecoRss}</link>\n` +
    `\t<description>${site.descricaoRss}</description>\n` +
    // O `\t` antes de `</dc:date>` esta no modelo (`:36`).
    `\t<dc:date>${dataDeConstrucaoDoFeed(contexto, FORMATO_DE_DATA_ATOM)}\t</dc:date>\n` +
    blocosDeAtualizacao() +
    `\t<sy:updateBase>${BASE_DE_ATUALIZACAO_DO_RDF}</sy:updateBase>\n` +
    // `rdf_header`: o gerador, por fabrica.
    '\t' +
    geradorDoFeed('rdf_header', contexto) +
    '\t<items>\n' +
    '\t\t<rdf:Seq>\n' +
    '\t\t';
  for (const conteudo of consulta.conteudos) {
    corpo += `\t\t\t<rdf:li rdf:resource="${conteudo.enderecoRss}"/>\n` + '\t\t';
  }
  corpo += '\t\t</rdf:Seq>\n' + '\t</items>\n' + '</channel>\n';

  const soResumo = usarSoResumo(opcoes.rssUseExcerpt);
  for (const conteudo of consulta.conteudos) {
    corpo +=
      `<item rdf:about="${conteudo.enderecoRss}">\n` +
      `\t<title>${conteudo.tituloRss}</title>\n` +
      `\t<link>${conteudo.enderecoRss}</link>\n` +
      '\n' +
      `\t<dc:creator><![CDATA[${conteudo.autor}]]></dc:creator>\n` +
      // `mysql2date()` direto sobre a coluna: aqui a coluna zerada NAO e vazia.
      `\t<dc:date>${formatarDataDaColuna(conteudo.publicadoGmt, FORMATO_DE_DATA_ATOM)}</dc:date>\n` +
      '\t' +
      listaDeCategoriasDoFeed(conteudo, 'rdf', contexto) +
      '\n' +
      '\t' +
      (soResumo
        ? `\t\t<description><![CDATA[${conteudo.resumoRss}]]></description>\n`
        : `\t\t<description><![CDATA[${conteudo.resumoRss}]]></description>\n` +
          `\t\t<content:encoded><![CDATA[${conteudo.conteudoDoFeed('rdf')}]]></content:encoded>\n`) +
      '\t' +
      '\n' +
      // `rdf_item`: declarado.
      '\t' +
      '</item>\n';
  }
  corpo += '</rdf:RDF>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'rdf'), corpo };
}

/** `wp-includes/feed-rss.php` — RSS 0.92, so titulo, resumo e endereco por item. */
export function modeloRss(
  contexto: ContextoDoFeed,
  tipoDeConteudoDoFeed: (tipo: string) => string,
): DocumentoDoFeed {
  const { site, consulta } = contexto;
  let corpo =
    declaracaoXml(contexto) +
    '<rss version="0.92">\n' +
    '<channel>\n' +
    `\t<title>${site.tituloRss}</title>\n` +
    `\t<link>${site.enderecoRss}</link>\n` +
    `\t<description>${site.descricaoRss}</description>\n` +
    `\t<lastBuildDate>${dataDeConstrucaoDoFeed(contexto, FORMATO_DE_DATA_RSS)}</lastBuildDate>\n` +
    '\t<docs>http://backend.userland.com/rss092</docs>\n' +
    `\t<language>${site.idiomaRss}</language>\n` +
    // `rss_head`: o gerador, por fabrica, como comentario de HTML.
    '\t' +
    geradorDoFeed('rss_head', contexto) +
    '\n';
  for (const conteudo of consulta.conteudos) {
    corpo +=
      '\t<item>\n' +
      `\t\t<title>${conteudo.tituloRss}</title>\n` +
      `\t\t<description><![CDATA[${conteudo.resumoRss}]]></description>\n` +
      `\t\t<link>${conteudo.enderecoRss}</link>\n` +
      // `rss_item`: declarado.
      '\t\t' +
      '\t</item>\n';
  }
  corpo += '</channel>\n</rss>\n';
  return { tipoDeConteudo: tipoDeConteudoDoModelo(contexto, tipoDeConteudoDoFeed, 'rss'), corpo };
}
