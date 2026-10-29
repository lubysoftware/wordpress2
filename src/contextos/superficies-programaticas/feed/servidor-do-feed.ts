/**
 * O servidor de feed: o formato padrao, o registro de tratadores, o despacho de
 * `do_feed()` e o atendimento de ponta a ponta.
 *
 * Tarefa **T017** da feature `013-superficies-programaticas` (US-8, *"servir
 * feeds de conteudo e de comentarios a partir da mesma consulta publica"*).
 * Satisfaz, junto com os arquivos vizinhos:
 *
 * | criterio | onde |
 * |---|---|
 * | CA-8.1 o mesmo endereco serve o feed quando o formato e pedido | {@link ServidorDeFeed.atender}: o pedido chega com a variavel `feed` que a traducao de endereco de `004` poe em **qualquer** listagem (`/feed/`, `/category/x/feed/`, `?feed=rss2`...), e a resposta e o documento, nao o modelo de tema |
 * | CA-8.2 a mesma consulta, sem regra de visibilidade propria | `./contexto-do-feed.ts`: o feed recebe o **resultado** da consulta principal e nao tem como consultar |
 * | CA-8.3 conteudo e comentarios, global e por conteudo | `./modelos-do-feed.ts`, escolhidos aqui pelo `is_comment_feed` |
 * | CA-8.4 o formato padrao, declarado e usado | {@link formatoDeFeedPadrao} e `./pontos-de-configuracao.ts` |
 *
 * ## A ordem do atendimento
 *
 * Sao duas etapas do legado, em dois arquivos, e a ordem e contrato
 * (BR-MIGRAR-106):
 *
 * 1. `WP::send_headers()` (`wp-includes/class-wp.php:436`), dentro de `wp()` —
 *    o ramo de feed poe tipo, `Last-Modified` e `ETag`, e o `304` **encerra**
 *    ali (`:536`-`:537` e `:584`), antes de qualquer modelo;
 * 2. `do_feed()` (`wp-includes/functions.php:1612`), que
 *    `wp-includes/template-loader.php:57`-`:59` chama depois de `wp()`
 *    retornar — o modelo troca o tipo de conteudo pelo dele (`header( ...,
 *    true )`), ou `wp_die()` responde `404` em XML.
 *
 * A escolha entre feed e tema e de `004`
 * (`leitura-publica/apresentacao/escolher-apresentacao.ts`, decisao 5): quem
 * compoe chama {@link ServidorDeFeed.atender} quando aquela escolha devolve
 * `'feed'`.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — ver
 * `../index.ts`.
 */

import { cabecalhosDoRamoDeFeed, entraNoRamoDeFeed, type PedidoCondicional, type VariaveisDoPedidoDeFeed } from './cabecalhos-do-feed.js';
import type { ContextoDoFeed } from './contexto-do-feed.js';
import {
  modeloAtom,
  modeloAtomDeComentarios,
  modeloRdf,
  modeloRss,
  modeloRss2,
  modeloRss2DeComentarios,
  type DocumentoDoFeed,
} from './modelos-do-feed.js';
import {
  FORMATO_DE_FEED_PADRAO,
  FORMATOS_DE_FEED_DO_NUCLEO,
  TIPO_DE_CONTEUDO_DESCONHECIDO,
  TIPOS_DE_CONTEUDO_DO_FEED,
} from './pontos-de-configuracao.js';
import { CABECALHOS_DE_NAO_GUARDAR } from '../mapa-do-site/index.js';

/**
 * `get_default_feed()` (`wp-includes/feed.php:80`): o valor que o filtro
 * `default_feed` devolveu, com `'rss'` trocado por `'rss2'` **depois** do filtro
 * (`:91`) — uma extensao que peca `'rss'` recebe o RSS2, e nao o 0.92.
 */
export function formatoDeFeedPadrao(filtrado: string = FORMATO_DE_FEED_PADRAO): string {
  return filtrado === 'rss' ? 'rss2' : filtrado;
}

/**
 * `feed_content_type( $tipo )` (`wp-includes/feed.php:768`), sem o filtro
 * `feed_content_type`, que fica declarado. Tipo vazio e o padrao.
 */
export function tipoDeConteudoDoFeed(tipo: string, formatoPadrao: string = formatoDeFeedPadrao()): string {
  const efetivo = tipo === '' || tipo === '0' ? formatoPadrao : tipo;
  const conhecido = Object.hasOwn(TIPOS_DE_CONTEUDO_DO_FEED, efetivo)
    ? TIPOS_DE_CONTEUDO_DO_FEED[efetivo]
    : undefined;
  return conhecido === undefined || conhecido === '' ? TIPO_DE_CONTEUDO_DESCONHECIDO : conhecido;
}

/**
 * O formato que `do_feed()` procura (`functions.php:1615`-`:1621`): sem os
 * sublinhados do comeco, e `''` ou `'feed'` viram o padrao.
 */
export function formatoPedidoNoDespacho(formatoDaConsulta: string, formatoPadrao: string): string {
  const semSublinhado = formatoDaConsulta.replace(/^_+/, '');
  return semSublinhado === '' || semSublinhado === 'feed' ? formatoPadrao : semSublinhado;
}

/**
 * Um tratador de `do_feed_{nome}`: recebe `$wp_query->is_comment_feed` e o nome
 * (`functions.php:1646`), e o contexto que no legado era global.
 */
export type TratadorDeFeed = (
  contexto: ContextoDoFeed,
  feedDeComentarios: boolean,
  nome: string,
) => DocumentoDoFeed;

/**
 * Os tratadores registrados — `has_action( "do_feed_{$feed}" )` no legado.
 * Um por composicao, como o registro de provedores do mapa do site.
 */
export interface RegistroDeFeeds {
  /**
   * `add_feed( $nome, $tratador )` (`wp-includes/rewrite.php:251`): **troca** o
   * tratador do nucleo quando o nome e dele (`remove_action( $hook, $hook )`,
   * `:261`). Acrescentar o nome a `$wp_rewrite->feeds` e da tabela de regras de
   * `004`, e nao daqui.
   */
  registrar(nome: string, tratador: TratadorDeFeed): void;
  tem(nome: string): boolean;
  tratador(nome: string): TratadorDeFeed | null;
  /** Os nomes, na ordem de registro. */
  nomes(): readonly string[];
}

/**
 * Os quatro tratadores do nucleo (`wp-includes/default-filters.php:420`-`:423`).
 * ⚠️ `do_feed_rdf` e `do_feed_rss` sao registrados com **zero** argumentos: o
 * pedido de comentarios em RDF ou em RSS 0.92 recebe o feed de **conteudo**
 * (conferido no oraculo, `/comments/feed/rdf/`).
 */
function tratadoresDoNucleo(): ReadonlyMap<string, TratadorDeFeed> {
  const tipo = (contexto: ContextoDoFeed) => (nome: string) =>
    tipoDeConteudoDoFeed(nome, formatoDeFeedPadrao(contexto.formatoPadraoFiltrado));
  const tratadores: Record<(typeof FORMATOS_DE_FEED_DO_NUCLEO)[number], TratadorDeFeed> = {
    rdf: (contexto) => modeloRdf(contexto, tipo(contexto)),
    rss: (contexto) => modeloRss(contexto, tipo(contexto)),
    rss2: (contexto, feedDeComentarios) =>
      feedDeComentarios
        ? modeloRss2DeComentarios(contexto, tipo(contexto))
        : modeloRss2(contexto, tipo(contexto)),
    atom: (contexto, feedDeComentarios) =>
      feedDeComentarios
        ? modeloAtomDeComentarios(contexto, tipo(contexto))
        : modeloAtom(contexto, tipo(contexto)),
  };
  return new Map(FORMATOS_DE_FEED_DO_NUCLEO.map((nome) => [nome, tratadores[nome]]));
}

/** Cria o registro com os quatro tratadores do nucleo. */
export function criarRegistroDeFeeds(): RegistroDeFeeds {
  const tratadores = new Map<string, TratadorDeFeed>(tratadoresDoNucleo());
  return {
    registrar(nome, tratador) {
      tratadores.set(nome, tratador);
    },
    tem: (nome) => tratadores.has(nome),
    tratador: (nome) => tratadores.get(nome) ?? null,
    nomes: () => [...tratadores.keys()],
  };
}

/** `htmlspecialchars()` do PHP 8.1+: `ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401`. */
function caracteresEspeciais(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * O corpo de `_xml_wp_die_handler()` (`wp-includes/functions.php:4276`), que
 * `wp_die()` escolhe porque o pedido e de feed (`:3866`-`:3870`). Titulo vazio
 * vira *"WordPress &rsaquo; Error"* (`_wp_die_process_input()`, `:4413`), e o
 * `htmlspecialchars()` escapa a entidade de novo: sai `&amp;rsaquo;`.
 */
export function corpoDoErroEmXml(mensagem: string, titulo: string, status: number): string {
  return (
    '<error>\n' +
    '    <code>wp_die</code>\n' +
    `    <title><![CDATA[${caracteresEspeciais(titulo)}]]></title>\n` +
    `    <message><![CDATA[${caracteresEspeciais(mensagem)}]]></message>\n` +
    '    <data>\n' +
    `        <status>${status}</status>\n` +
    '    </data>\n' +
    '</error>\n'
  );
}

/** A mensagem de `do_feed()` para formato sem tratador (`functions.php:1625`). */
export const MENSAGEM_DE_FEED_INVALIDO = '<strong>Error:</strong> This is not a valid feed template.';

/** O titulo de fabrica de `wp_die()` (`functions.php:4413`). */
export const TITULO_DO_ERRO = 'WordPress &rsaquo; Error';

/**
 * O charset do `wp_die()` em XML: `'utf-8'` de fabrica, canonizado
 * (`functions.php:4363` e `:4423`). **Nao** e `blog_charset`.
 */
export const CHARSET_DO_ERRO_EM_XML = 'UTF-8';

/** O pedido de feed, como chega ao atendimento. */
export interface PedidoDeFeed {
  /** `WP::$query_vars` — o formato cru, antes de `WP_Query` tirar `comments-`. */
  readonly variaveis: VariaveisDoPedidoDeFeed;
  readonly condicional?: PedidoCondicional;
}

/** Os cabecalhos de uma resposta de feed, na ordem em que o legado os poe. */
export type CabecalhosDaRespostaDeFeed = Readonly<Record<string, string>>;

/** O que o atendimento decide. */
export type RespostaDeFeed =
  /** `304` de `send_headers()`, sem corpo: o modelo nao chega a carregar. */
  | { readonly tipo: 'nao-modificado'; readonly status: 304; readonly cabecalhos: CabecalhosDaRespostaDeFeed }
  /** O documento do tratador. */
  | {
      readonly tipo: 'documento';
      readonly status: 200;
      readonly cabecalhos: CabecalhosDaRespostaDeFeed;
      readonly corpo: string;
    }
  /**
   * Formato sem tratador: `wp_die()` em XML, `404`, com os cabecalhos de nao
   * guardar e **sem** `Last-Modified` (`nocache_headers()` o remove,
   * `functions.php:1552`); o `ETag` do ramo de feed fica.
   */
  | {
      readonly tipo: 'formato-invalido';
      readonly status: 404;
      readonly cabecalhos: CabecalhosDaRespostaDeFeed;
      readonly corpo: string;
    };

/** O servidor de feed, iniciado. */
export interface ServidorDeFeed {
  readonly registro: RegistroDeFeeds;
  /** `get_default_feed()`. */
  formatoPadrao(): string;
  /**
   * `do_feed()` sozinho: o tratador do formato da consulta, ou `null` quando
   * nao ha tratador (o `404` de `wp_die()`).
   */
  despachar(): DocumentoDoFeed | null;
  /** O ramo de feed de `send_headers()` seguido de `do_feed()`. */
  atender(pedido: PedidoDeFeed): RespostaDeFeed;
}

/**
 * Inicia o servidor de feed sobre o contexto da requisicao.
 *
 * ⚠️ **Um registro por composicao, nunca por processo**, pela mesma razao do
 * servidor do mapa do site: no legado os tratadores sao acoes no `$wp_filter`
 * global, que morre com a resposta.
 */
export function iniciarServidorDeFeed(contexto: ContextoDoFeed): ServidorDeFeed {
  const registro = criarRegistroDeFeeds();
  const formatoPadrao = (): string => formatoDeFeedPadrao(contexto.formatoPadraoFiltrado);

  const despachar = (): DocumentoDoFeed | null => {
    const nome = formatoPedidoNoDespacho(contexto.consulta.formato, formatoPadrao());
    const tratador = registro.tratador(nome);
    if (tratador === null) {
      return null;
    }
    // `do_action( "do_feed_{$feed}", $wp_query->is_comment_feed, $feed )`.
    return tratador(contexto, contexto.consulta.tipos.feedDeComentarios, nome);
  };

  return {
    registro,
    formatoPadrao,
    despachar,

    atender(pedido) {
      const cabecalhos: Record<string, string> = {};
      if (entraNoRamoDeFeed(pedido.variaveis)) {
        const ramo = cabecalhosDoRamoDeFeed(
          pedido.variaveis,
          pedido.condicional ?? {},
          contexto.datas,
          contexto.opcoes.blogCharset,
          formatoPadrao(),
          (tipo) => tipoDeConteudoDoFeed(tipo, formatoPadrao()),
        );
        Object.assign(cabecalhos, ramo.cabecalhos);
        if (ramo.naoModificado) {
          return { tipo: 'nao-modificado', status: 304, cabecalhos };
        }
      }

      const documento = despachar();
      if (documento === null) {
        delete cabecalhos['Last-Modified'];
        cabecalhos['Content-Type'] = `text/xml; charset=${CHARSET_DO_ERRO_EM_XML}`;
        Object.assign(cabecalhos, CABECALHOS_DE_NAO_GUARDAR);
        const traduzir = contexto.traduzir ?? ((texto: string) => texto);
        return {
          tipo: 'formato-invalido',
          status: 404,
          cabecalhos,
          corpo: corpoDoErroEmXml(traduzir(MENSAGEM_DE_FEED_INVALIDO), traduzir(TITULO_DO_ERRO), 404),
        };
      }

      cabecalhos['Content-Type'] = documento.tipoDeConteudo;
      return { tipo: 'documento', status: 200, cabecalhos, corpo: documento.corpo };
    },
  };
}
