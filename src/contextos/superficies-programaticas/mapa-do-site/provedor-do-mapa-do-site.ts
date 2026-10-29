/**
 * O provedor do mapa do site, o registro de provedores e o indice.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7). Satisfaz
 * **CA-7.1** (*"com a indexacao ligada, ha um indice que lista as paginas de
 * sitemap por provedor"*) e a metade *"pagina os provedores"* de **CA-7.5**.
 *
 * | o que | no legado | aqui |
 * |---|---|---|
 * | o provedor (classe abstrata) | `wp-includes/sitemaps/class-wp-sitemaps-provider.php:18` | {@link ProvedorDoMapaDoSite} |
 * | uma entrada por subtipo, ou uma so | `get_sitemap_type_data()` (`:67`) | {@link dadosDosSubtipos} |
 * | uma entrada **por pagina** de cada subtipo | `get_sitemap_entries()` (`:106`) | {@link entradasDoProvedorNoIndice} |
 * | o endereco de cada pagina | `get_sitemap_url()` (`:148`) | {@link enderecoDaPaginaDoMapa} |
 * | o registro | `wp-includes/sitemaps/class-wp-sitemaps-registry.php:18` | {@link criarRegistroDeProvedores} |
 * | o indice | `get_sitemap_list()` (`class-wp-sitemaps-index.php:55`) | {@link listaDoIndice} |
 * | o endereco do indice | `get_index_url()` (`class-wp-sitemaps-index.php:87`) | {@link enderecoDoIndice} |
 *
 * **O indice lista TODAS as paginas de TODOS os provedores**, sem descoberta
 * incremental: cada provedor diz quantas paginas tem, e o indice escreve uma
 * entrada por pagina, na ordem de registro dos provedores e, dentro de cada um,
 * na ordem dos subtipos. Contra o oraculo, com `wp_sitemaps_max_urls` em `1` e
 * dois conteudos publicados, `posts-post` aparece com as paginas `1` e `2`.
 *
 * Pontos de extensao **declarados e nao emitidos** (REQ-162 esta em
 * `do-not-rewrite.md`): `wp_sitemaps_index_entry` (`provider:128`), com a
 * entrada, o tipo de objeto, o subtipo e a pagina; e `wp_sitemaps_add_provider`
 * (`registry:50`), que pode trocar o provedor ou recusa-lo devolvendo algo que
 * nao e provedor.
 */

import { PAGINAS_DO_MAPA_NO_INDICE } from './pontos-de-configuracao.js';
import type { EnderecoInicial } from './contexto-do-mapa-do-site.js';

/**
 * Uma entrada do mapa: `loc`, e opcionalmente `lastmod`, `changefreq` e
 * `priority`. A ORDEM das chaves e a ordem dos elementos no XML (`renderer:224`).
 */
export interface EntradaDoMapaDoSite {
  readonly [campo: string]: string;
}

/**
 * `WP_Sitemaps_Provider`. Quem registra um provedor proprio
 * (`wp_register_sitemap_provider()`, `wp-includes/sitemaps.php:67`) entrega
 * esta forma.
 */
export interface ProvedorDoMapaDoSite {
  /** `$name` (`provider:28`): o nome publico, que vai no endereco. */
  readonly nome: string;
  /** `$object_type` (`provider:37`): `post`, `term`, `user`. */
  readonly tipoDeObjeto: string;
  /** `get_url_list( $page_num, $object_subtype = '' )` (`provider:48`). */
  listaDeEnderecos(pagina: number, subtipo: string): readonly EntradaDoMapaDoSite[];
  /** `get_max_num_pages( $object_subtype = '' )` (`provider:58`). */
  totalDePaginas(subtipo: string): number;
  /**
   * `array_keys( get_object_subtypes() )` (`provider:179`), na ordem. O
   * provedor base devolve lista vazia.
   */
  subtipos(): readonly string[];
}

/** O que o endereco de toda pagina do mapa precisa saber do site. */
export interface EnderecosDoMapaDoSite {
  readonly enderecoInicial: EnderecoInicial;
  readonly usandoLinksPermanentes: boolean;
}

/** Um subtipo e quantas paginas ele tem. */
export interface DadosDoSubtipo {
  readonly nome: string;
  readonly paginas: number;
}

/**
 * `get_sitemap_type_data()` (`provider:67`-`:95`). Sem subtipo, **uma** entrada
 * para o tipo inteiro, de nome vazio (`:76`-`:82`): e o caso do provedor de
 * contas.
 */
export function dadosDosSubtipos(provedor: ProvedorDoMapaDoSite): readonly DadosDoSubtipo[] {
  const subtipos = provedor.subtipos();

  if (subtipos.length === 0) {
    return [{ nome: '', paginas: provedor.totalDePaginas('') }];
  }

  return subtipos.map((nome) => ({ nome, paginas: provedor.totalDePaginas(nome) }));
}

/**
 * `get_sitemap_entries()` (`provider:106`-`:135`): uma entrada por pagina, de
 * `1` ate o total, so com `loc`.
 */
export function entradasDoProvedorNoIndice(
  provedor: ProvedorDoMapaDoSite,
  enderecos: EnderecosDoMapaDoSite,
): EntradaDoMapaDoSite[] {
  const entradas: EntradaDoMapaDoSite[] = [];

  for (const subtipo of dadosDosSubtipos(provedor)) {
    for (let pagina = 1; pagina <= subtipo.paginas; pagina++) {
      // `wp_sitemaps_index_entry` (`:128`) seria emitido aqui.
      entradas.push({ loc: enderecoDaPaginaDoMapa(provedor, subtipo.nome, pagina, enderecos) });
    }
  }

  return entradas;
}

/**
 * `get_sitemap_url( $name, $page )` (`provider:148`-`:170`).
 *
 * O `array_filter()` de `:152` tira todo valor **falso para o PHP** — e por
 * isso o subtipo vazio some e `wp-sitemap-users-1.xml` nao tem o traco duplo.
 * Sem links permanentes o caminho e `/?` com `http_build_query()`, e o `&`
 * entre os pares sai cru daqui; o XML o escreve `&amp;`.
 */
export function enderecoDaPaginaDoMapa(
  provedor: ProvedorDoMapaDoSite,
  subtipo: string,
  pagina: number,
  enderecos: EnderecosDoMapaDoSite,
): string {
  const pares = (
    [
      ['sitemap', provedor.nome],
      ['sitemap-subtype', subtipo],
      ['paged', String(pagina)],
    ] as const
  ).filter(([, valor]) => valor !== '' && valor !== '0');

  const caminho = enderecos.usandoLinksPermanentes
    ? `/wp-sitemap-${pares.map(([, valor]) => valor).join('-')}.xml`
    : `/?${pares.map(([chave, valor]) => `${codificarComoUrlencode(chave)}=${codificarComoUrlencode(valor)}`).join('&')}`;

  return enderecos.enderecoInicial(caminho);
}

/**
 * `urlencode()`, que e o que `http_build_query()` aplica a chave e valor: so
 * letra, digito, `-`, `_` e `.` passam; espaco vira `+`.
 */
function codificarComoUrlencode(texto: string): string {
  return encodeURIComponent(texto)
    .replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');
}

/** `WP_Sitemaps_Registry`. */
export interface RegistroDeProvedores {
  /**
   * `add_provider( $name, $provider )` (`registry:37`): nome ja registrado
   * **nao** e substituido, e a resposta e `false`.
   */
  adicionar(nome: string, provedor: ProvedorDoMapaDoSite): boolean;
  /** `get_provider( $name )` (`registry:68`): `null` para nome que nao e texto ou nao existe. */
  provedor(nome: unknown): ProvedorDoMapaDoSite | null;
  /** `get_providers()` (`registry:83`), na ordem de registro. */
  provedores(): ReadonlyMap<string, ProvedorDoMapaDoSite>;
}

/** Um registro por composicao: no legado ele morre com a requisicao. */
export function criarRegistroDeProvedores(): RegistroDeProvedores {
  const provedores = new Map<string, ProvedorDoMapaDoSite>();

  return {
    adicionar(nome, provedor) {
      if (provedores.has(nome)) {
        return false;
      }
      // `wp_sitemaps_add_provider` (`:50`) seria emitido aqui.
      provedores.set(nome, provedor);
      return true;
    },
    provedor(nome) {
      if (typeof nome !== 'string') {
        return null;
      }
      return provedores.get(nome) ?? null;
    },
    provedores() {
      return new Map(provedores);
    },
  };
}

/**
 * `get_sitemap_list()` (`class-wp-sitemaps-index.php:55`-`:76`). O corte de
 * {@link PAGINAS_DO_MAPA_NO_INDICE} e conferido **depois** de cada provedor
 * inteiro (`:70`), e o `array_slice()` de `:75` apara o excesso.
 */
export function listaDoIndice(
  registro: RegistroDeProvedores,
  enderecos: EnderecosDoMapaDoSite,
): readonly EntradaDoMapaDoSite[] {
  const lista: EntradaDoMapaDoSite[] = [];

  for (const provedor of registro.provedores().values()) {
    const entradas = entradasDoProvedorNoIndice(provedor, enderecos);

    if (entradas.length === 0) {
      continue;
    }

    lista.push(...entradas);
    if (lista.length >= PAGINAS_DO_MAPA_NO_INDICE) {
      break;
    }
  }

  return lista.slice(0, PAGINAS_DO_MAPA_NO_INDICE);
}

/** `get_index_url()` (`class-wp-sitemaps-index.php:87`-`:95`). */
export function enderecoDoIndice(enderecos: EnderecosDoMapaDoSite): string {
  return enderecos.enderecoInicial(
    enderecos.usandoLinksPermanentes ? '/wp-sitemap.xml' : '/?sitemap=index',
  );
}
