/**
 * O servidor do mapa do site: iniciar conforme a opcao de indexacao, e atender
 * o pedido.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7, *"servir o
 * indice de sitemap conforme a opcao de indexacao"*). E a composicao de
 * `WP_Sitemaps` (`wp-includes/sitemaps/class-wp-sitemaps.php:18`), que
 * `wp_sitemaps_get_server()` (`wp-includes/sitemaps.php:22`) cria e inicia em
 * `init` (`wp-includes/default-filters.php:559`). Satisfaz, junto com os
 * arquivos vizinhos:
 *
 * | criterio | onde |
 * |---|---|
 * | CA-7.1 indice por provedor | {@link ServidorDoMapaDoSite.atender} com `sitemap=index`, sobre `./provedor-do-mapa-do-site.ts` |
 * | CA-7.2 so conteudo publico | `./provedores-do-nucleo.ts` |
 * | CA-7.3 desligada, endereco inexistente | {@link iniciarServidorDoMapaDoSite} e o portao de `atender` |
 * | CA-7.4 instrucoes para rastreadores | {@link ServidorDoMapaDoSite.robotsTxt} e `./instrucoes-para-rastreadores.ts` |
 * | CA-7.5 paginacao e tamanho declarado | `./pontos-de-configuracao.ts` e `./provedor-do-mapa-do-site.ts` |
 * | CA-7.6 protegido por senha entra | `./provedores-do-nucleo.ts` |
 *
 * ## ⚠️ CA-7.3: "as rotas nao sao registradas" — o que some e o que fica
 *
 * O criterio, `UC-47` e o card dizem que, com a indexacao desligada, *"as rotas
 * nao sao registradas"*. No legado o que nao e registrado sao os **provedores**
 * e a linha do `robots.txt` (`:71`-`:78`); as **regras de reescrita sao
 * registradas sempre**, e o proprio legado diz por que, em `:60`-`:61` e no
 * docblock do filtro (`:94`-`:95`): *"rewrite rules are still in place to ensure
 * a 404 is returned"*. O desvio de `template_redirect` tambem fica preso
 * (`:69`), e e ele que responde `404` (`:186`-`:189`).
 *
 * A diferenca e observavel, e por isso o porte segue o legado (P1): e a
 * etiqueta `%sitemap%` que faz de `sitemap` variavel publica de consulta
 * (`add_rewrite_tag()` chama `$wp->add_query_var()`,
 * `wp-includes/rewrite.php:172`). Sem ela o `?sitemap=index` seria ignorado
 * pela traducao do pedido, e o `WP::handle_404()` deixaria de isentar o pedido
 * (`wp-includes/class-wp.php:751`) — a resposta passaria a ser a de quem casou
 * o resto do endereco, e nao a ausencia que o criterio descreve.
 * Com as regras no lugar, o pedido cai em `404` com os cabecalhos de nao
 * guardar — que e a **segunda** metade de CA-7.3, a observavel, e o que o
 * oraculo devolve para `/wp-sitemap.xml`, para `/wp-sitemap-posts-post-1.xml`
 * e para `/wp-sitemap.xsl`. Por isso {@link ServidorDoMapaDoSite.regrasDeReescrita}
 * existe com a opcao desligada, e tem teste.
 *
 * E **nao e recusa** (UT-145-8): nao ha `403`, nao ha mensagem, e nao ha
 * capacidade nenhuma perguntada. O ator e o buscador, e a declaracao de
 * permissao desta superficie e *"nenhuma"* (`../index.ts`, tabela de pauta).
 *
 * ## A ordem do atendimento
 *
 * `render_sitemaps()` (`:161`-`:235`), sem reordenar:
 *
 * 1. sem `sitemap` e sem `sitemap-stylesheet` **crus** (`:171`): nao e mapa;
 * 2. sanitiza (`:175`-`:178`) — ⚠️ o `sanitize_text_field()` e de
 *    `plataforma/formatacao/`, feature `015`, e **nao** esta aqui: os valores
 *    entram crus, e so o `absint()` da pagina esta portado. Para os nomes que o
 *    nucleo registra nao ha diferenca; para `sitemap=' index'` ha (o legado
 *    serve o indice, aqui e `404`);
 * 3. nada sobrou (`:181`): `404`;
 * 4. desligado (`:186`): `404`;
 * 5. folha de estilo de tipo desconhecido (`:194`): `404`; conhecido: a folha;
 * 6. `index` (`:206`): o indice, mesmo sem provedor nenhum;
 * 7. provedor nao registrado (`:216`): `404`;
 * 8. pagina vazia vira `1` (`:221`), e lista vazia e `404` (`:228`).
 *
 * 🔴 **A folha de estilo XSL nao esta portada.** `WP_Sitemaps_Stylesheet`
 * (`wp-includes/sitemaps/class-wp-sitemaps-stylesheet.php`, 318 linhas) nao tem
 * criterio de aceite em US-7; o atendimento devolve a decisao — qual das duas —
 * e o corpo fica para quem a portar. Registrado no `README.md` do modulo.
 */

import {
  acrescentarLinhaDoIndice,
  corpoDoRobotsTxt,
  TIPO_DE_CONTEUDO_DO_ROBOTS_TXT,
} from './instrucoes-para-rastreadores.js';
import { indexacaoLigada } from './pontos-de-configuracao.js';
import {
  criarRegistroDeProvedores,
  enderecoDaPaginaDoMapa,
  enderecoDoIndice,
  listaDoIndice,
  type EnderecosDoMapaDoSite,
  type RegistroDeProvedores,
} from './provedor-do-mapa-do-site.js';
import {
  criarProvedorDeContas,
  criarProvedorDeConteudo,
  criarProvedorDeTaxonomias,
} from './provedores-do-nucleo.js';
import { TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE, xmlDaPagina, xmlDoIndice } from './xml-do-mapa-do-site.js';
import type { ContextoDoMapaDoSite } from './contexto-do-mapa-do-site.js';

/**
 * As tres etiquetas de reescrita, todas `([^?]+)` (`:132`, `:133`, `:139`). Sao
 * elas que fazem de `sitemap`, `sitemap-subtype` e `sitemap-stylesheet`
 * variaveis publicas de consulta.
 */
export const ETIQUETAS_DE_REESCRITA_DO_MAPA_DO_SITE = [
  { etiqueta: '%sitemap%', padrao: '([^?]+)' },
  { etiqueta: '%sitemap-subtype%', padrao: '([^?]+)' },
  { etiqueta: '%sitemap-stylesheet%', padrao: '([^?]+)' },
] as const;

/**
 * As cinco regras, todas em `'top'`, na ordem de `register_rewrites()`
 * (`:136`-`:153`). Quem monta a tabela de regras e a traducao de endereco de
 * `004-leitura-publica`; o mapa so as declara, **com a opcao ligada ou nao**.
 */
export const REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE = [
  { padrao: '^wp-sitemap\\.xml$', consulta: 'index.php?sitemap=index', posicao: 'top' },
  { padrao: '^wp-sitemap\\.xsl$', consulta: 'index.php?sitemap-stylesheet=sitemap', posicao: 'top' },
  { padrao: '^wp-sitemap-index\\.xsl$', consulta: 'index.php?sitemap-stylesheet=index', posicao: 'top' },
  {
    padrao: '^wp-sitemap-([a-z]+?)-([a-z\\d_-]+?)-(\\d+?)\\.xml$',
    consulta: 'index.php?sitemap=$matches[1]&sitemap-subtype=$matches[2]&paged=$matches[3]',
    posicao: 'top',
  },
  {
    padrao: '^wp-sitemap-([a-z]+?)-(\\d+?)\\.xml$',
    consulta: 'index.php?sitemap=$matches[1]&paged=$matches[2]',
    posicao: 'top',
  },
] as const;

/**
 * `wp_get_nocache_headers()` (`wp-includes/functions.php:1508`), que o
 * `send_404()` do mapa envia (`class-wp-sitemaps.php:249`-`:255`). O legado
 * tambem **remove** `Last-Modified` (`functions.php:1529`). Filtravel por
 * `nocache_headers`, declarado e nao emitido.
 */
export const CABECALHOS_DE_NAO_GUARDAR = {
  Expires: 'Wed, 11 Jan 1984 05:00:00 GMT',
  'Cache-Control': 'no-cache, must-revalidate, max-age=0, no-store, private',
} as const;

/** As variaveis de consulta que o atendimento le, cruas, como `get_query_var()` as devolve. */
export interface PedidoDoMapaDoSite {
  readonly sitemap?: string;
  readonly 'sitemap-subtype'?: string;
  readonly 'sitemap-stylesheet'?: string;
  readonly paged?: string;
}

/** O que o atendimento decide. */
export type RespostaDoMapaDoSite =
  /** O pedido nao e do mapa: o atendimento segue sem ele (`:171`-`:173`). */
  | { readonly tipo: 'nao-e-mapa-do-site' }
  /**
   * `send_404()`: a consulta fica marcada como `404` e o corpo e a apresentacao
   * de erro do tema, que e da borda.
   */
  | {
      readonly tipo: 'inexistente';
      readonly status: 404;
      readonly cabecalhos: typeof CABECALHOS_DE_NAO_GUARDAR;
    }
  /** `render_stylesheet( $tipo )` (`:199`-`:202`) — o corpo nao esta portado. */
  | { readonly tipo: 'folha-de-estilo'; readonly qual: 'sitemap' | 'index' }
  /** O indice ou uma pagina, em XML. */
  | {
      readonly tipo: 'documento';
      readonly status: 200;
      readonly tipoDeConteudo: typeof TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE;
      readonly corpo: string;
    };

/** O `robots.txt`, pronto. */
export interface RobotsTxt {
  readonly tipoDeConteudo: typeof TIPO_DE_CONTEUDO_DO_ROBOTS_TXT;
  readonly corpo: string;
}

/** `WP_Sitemaps`, iniciado. */
export interface ServidorDoMapaDoSite {
  /** O registro de provedores (`$registry`). Vazio com a opcao desligada. */
  readonly registro: RegistroDeProvedores;
  /** As regras que `register_rewrites()` registra — **sempre**. */
  readonly regrasDeReescrita: typeof REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE;
  /** As etiquetas que `register_rewrites()` registra — **sempre**. */
  readonly etiquetasDeReescrita: typeof ETIQUETAS_DE_REESCRITA_DO_MAPA_DO_SITE;
  /** `sitemaps_enabled()` (`:88`). Filtravel por `wp_sitemaps_enabled`, declarado. */
  habilitado(): boolean;
  /** `$index->get_index_url()`. */
  enderecoDoIndice(): string;
  /**
   * `get_sitemap_url( $name, $subtype_name = '', $page = 1 )`
   * (`wp-includes/sitemaps.php:103`): `false` para provedor ou subtipo que nao
   * existe.
   */
  enderecoDoMapa(nome: string, subtipo?: string, pagina?: number): string | false;
  /** `render_sitemaps()` (`:161`). */
  atender(pedido: PedidoDoMapaDoSite): RespostaDoMapaDoSite;
  /** `do_robots()` com a linha do indice de `add_robots()`, quando presa. */
  robotsTxt(): RobotsTxt;
}

/** `empty()` sobre um texto de variavel de consulta. */
function vazioComoNoPhp(valor: string | undefined): boolean {
  return valor === undefined || valor === '' || valor === '0';
}

/**
 * `absint( $valor )` (`wp-includes/load.php:1468`): `abs( (int) $valor )`, com
 * o molde de texto do PHP 8 — espaco no comeco, sinal, digitos, fracao e
 * expoente; o resto do texto e ignorado e o que nao comeca por numero e `0`.
 */
export function absintComoNoPhp(valor: string | undefined): number {
  if (valor === undefined) {
    return 0;
  }
  const numerico = /^[ \t\n\r\v\f]*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/.exec(valor);
  if (numerico === null || numerico[1] === undefined) {
    return 0;
  }
  const inteiro = Math.trunc(Number(numerico[1]));
  return Number.isFinite(inteiro) ? Math.abs(inteiro) : 0;
}

/**
 * `wp_sitemaps_get_server()` (`wp-includes/sitemaps.php:22`): constroi e inicia
 * (`class-wp-sitemaps.php:51` e `:65`).
 *
 * ⚠️ **Um servidor por composicao, nunca por processo.** O legado o guarda no
 * global `$wp_sitemaps` e sobrevive porque o processo morre com a resposta; o
 * mesmo vale para o servidor de rotas, e o cabecalho de `../index.ts` explica
 * por que copiar o global vazaria provedor de uma requisicao para a outra.
 * `wp_sitemaps_init` (`sitemaps.php:39`), que dispara logo depois de iniciar e
 * e onde extensao registra provedor, fica **declarado**: quem compoe registra
 * pelo `registro` devolvido.
 */
export function iniciarServidorDoMapaDoSite(contexto: ContextoDoMapaDoSite): ServidorDoMapaDoSite {
  const registro = criarRegistroDeProvedores();
  const enderecos: EnderecosDoMapaDoSite = {
    enderecoInicial: contexto.enderecoInicial,
    usandoLinksPermanentes: contexto.opcoes.usandoLinksPermanentes,
  };

  const habilitado = (): boolean => indexacaoLigada(contexto.opcoes.blogPublic);

  // `WP_Sitemaps_Renderer::__construct()` (`renderer:42`), construido junto
  // com o servidor. Os dois enderecos sao filtraveis
  // (`wp_sitemaps_stylesheet_url`, `wp_sitemaps_stylesheet_index_url`) e o
  // falso tira a linha; declarados e nao emitidos.
  const folhaDaPagina = contexto.enderecoInicial(
    enderecos.usandoLinksPermanentes ? '/wp-sitemap.xsl' : '/?sitemap-stylesheet=sitemap',
  );
  const folhaDoIndice = contexto.enderecoInicial(
    enderecos.usandoLinksPermanentes ? '/wp-sitemap-index.xsl' : '/?sitemap-stylesheet=index',
  );

  // `init()` (`:65`-`:79`): as regras sempre; o resto so habilitado.
  const iniciadoHabilitado = habilitado();
  if (iniciadoHabilitado) {
    registro.adicionar('posts', criarProvedorDeConteudo(contexto));
    registro.adicionar('taxonomies', criarProvedorDeTaxonomias(contexto));
    registro.adicionar('users', criarProvedorDeContas(contexto));
  }

  const inexistente: RespostaDoMapaDoSite = {
    tipo: 'inexistente',
    status: 404,
    cabecalhos: CABECALHOS_DE_NAO_GUARDAR,
  };

  return {
    registro,
    regrasDeReescrita: REGRAS_DE_REESCRITA_DO_MAPA_DO_SITE,
    etiquetasDeReescrita: ETIQUETAS_DE_REESCRITA_DO_MAPA_DO_SITE,
    habilitado,

    enderecoDoIndice: () => enderecoDoIndice(enderecos),

    enderecoDoMapa(nome, subtipo = '', pagina = 1) {
      if (nome === 'index') {
        return enderecoDoIndice(enderecos);
      }
      const provedor = registro.provedor(nome);
      if (provedor === null) {
        return false;
      }
      if (subtipo !== '' && subtipo !== '0' && !provedor.subtipos().includes(subtipo)) {
        return false;
      }
      const paginaAbsoluta = Math.abs(Math.trunc(pagina));
      return enderecoDaPaginaDoMapa(
        provedor,
        subtipo,
        paginaAbsoluta <= 0 ? 1 : paginaAbsoluta,
        enderecos,
      );
    },

    atender(pedido) {
      if (vazioComoNoPhp(pedido.sitemap) && vazioComoNoPhp(pedido['sitemap-stylesheet'])) {
        return { tipo: 'nao-e-mapa-do-site' };
      }

      const mapa = pedido.sitemap ?? '';
      const subtipo = pedido['sitemap-subtype'] ?? '';
      const folha = pedido['sitemap-stylesheet'] ?? '';
      let pagina = absintComoNoPhp(pedido.paged);

      if (vazioComoNoPhp(mapa) && vazioComoNoPhp(folha)) {
        return inexistente;
      }

      if (!habilitado()) {
        return inexistente;
      }

      if (!vazioComoNoPhp(folha)) {
        if (folha !== 'sitemap' && folha !== 'index') {
          return inexistente;
        }
        return { tipo: 'folha-de-estilo', qual: folha };
      }

      if (mapa === 'index') {
        return {
          tipo: 'documento',
          status: 200,
          tipoDeConteudo: TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE,
          corpo: xmlDoIndice(listaDoIndice(registro, enderecos), folhaDoIndice),
        };
      }

      const provedor = registro.provedor(mapa);
      if (provedor === null) {
        return inexistente;
      }

      if (pagina === 0) {
        pagina = 1;
      }

      const lista = provedor.listaDeEnderecos(pagina, subtipo);
      if (lista.length === 0) {
        return inexistente;
      }

      return {
        tipo: 'documento',
        status: 200,
        tipoDeConteudo: TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE,
        corpo: xmlDaPagina(lista, folhaDaPagina),
      };
    },

    robotsTxt() {
      const corpo = corpoDoRobotsTxt(contexto.enderecoDoPainel);
      // `add_robots` so esta preso se o servidor iniciou habilitado (`:78`), e
      // ainda confere o `$public` cru de `do_robots()` (`functions.php:1726`).
      return {
        tipoDeConteudo: TIPO_DE_CONTEUDO_DO_ROBOTS_TXT,
        corpo: iniciadoHabilitado
          ? acrescentarLinhaDoIndice(
              corpo,
              indexacaoLigada(contexto.opcoes.blogPublic),
              enderecoDoIndice(enderecos),
            )
          : corpo,
      };
    },
  };
}
