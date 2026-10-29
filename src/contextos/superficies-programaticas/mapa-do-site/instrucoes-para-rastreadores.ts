/**
 * As instrucoes para rastreadores que a opcao de indexacao muda: o `robots.txt`
 * virtual e as diretivas de robos de cada pagina.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7). Satisfaz
 * **CA-7.4** (*"com a indexacao desligada, as instrucoes para rastreadores pedem
 * que ninguem indexe"*).
 *
 * ## 🔴 Onde o legado pede que ninguem indexe — e onde ele NAO pede
 *
 * `UC-47`, fluxo *robots.txt virtual*, diz: *"com a indexacao desligada, o
 * robots.txt passa a pedir que ninguem indexe"*. **O 7.1.2 nao faz isso.**
 * `do_robots()` (`wp-includes/functions.php:1713`) escreve as mesmas tres linhas
 * com a opcao ligada ou desligada (`:1725`-`:1729`); a unica diferenca e a linha
 * `Sitemap:`, que **some**. Contra o oraculo, com `blog_public` em `'0'`:
 *
 * ```
 * User-agent: *
 * Disallow: /wp-admin/
 * Allow: /wp-admin/admin-ajax.php
 * ```
 *
 * Quem pede que ninguem indexe e a **meta de robos** de cada pagina:
 * `wp_robots_noindex()` (`wp-includes/robots-template.php:70`) chama
 * `wp_robots_no_robots()` (`:140`) quando a opcao e falsa, e a pagina inicial do
 * oraculo passa a trazer `<meta name='robots' content='noindex, nofollow' />`.
 * Ligada, ela traz `max-image-preview:large` (`:188`).
 *
 * CA-7.4 diz *"instrucoes para rastreadores"*, sem nomear o arquivo, e as
 * diretivas de robos sao instrucoes para rastreadores — logo o criterio e
 * satisfeito pelo comportamento do legado, e e ele que esta aqui (P1). O
 * `robots.txt` **nao** ganhou `Disallow: /`: seria divergir do observavel sem a
 * referencia que o P1 cobra. A frase de `UC-47` descreve um `robots.txt` que a
 * 7.1.2 nao escreve, e a discordancia esta registrada no `README.md` do modulo.
 *
 * ## O que esta portado, e o que e da borda
 *
 * As diretivas saem como **dado** e o texto do atributo `content` como texto: a
 * etiqueta `<meta>` e o `esc_attr()` sao da montagem da pagina, que nao e desta
 * arvore. Os quatro filtros do nucleo em `wp_robots` (`wp-includes/default-filters.php:277`-`:280`)
 * estao aqui, na ordem, porque dois dependem da opcao e a ordem decide o texto;
 * os outros dois perguntam `is_embed()` e `is_search()`, que chegam como campo.
 *
 * Pontos de extensao **declarados e nao emitidos** (REQ-162 esta em
 * `do-not-rewrite.md`): `do_robotstxt` (`functions.php:1723`), `robots_txt`
 * (`:1739`, com a saida e o `$public`) e `wp_robots` (`robots-template.php:28`).
 * ⚠️ A linha `Sitemap:` **e** um filtro de `robots_txt`, de prioridade `0`
 * (`wp-includes/sitemaps/class-wp-sitemaps.php:78`): toda extensao na prioridade
 * padrao ja a recebe escrita.
 */

import { indexacaoLigada, type ValorDeOpcao } from './pontos-de-configuracao.js';
import type { EnderecoDoPainel } from './contexto-do-mapa-do-site.js';

/** O tipo de conteudo do `robots.txt` (`functions.php:1715`). */
export const TIPO_DE_CONTEUDO_DO_ROBOTS_TXT = 'text/plain; charset=utf-8';

/**
 * `wp_parse_url( $endereco, PHP_URL_PATH )`: o caminho, cru, sem esquema,
 * servidor, consulta nem fragmento.
 */
function caminhoDoEndereco(endereco: string): string {
  const semOrigem = endereco.replace(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]*/, '');
  return semOrigem.replace(/[?#].*$/s, '');
}

/**
 * O corpo de `do_robots()` antes dos filtros (`functions.php:1725`-`:1729`). A
 * opcao **nao** muda nada aqui.
 */
export function corpoDoRobotsTxt(enderecoDoPainel: EnderecoDoPainel): string {
  return (
    'User-agent: *\n' +
    `Disallow: ${caminhoDoEndereco(enderecoDoPainel(''))}\n` +
    `Allow: ${caminhoDoEndereco(enderecoDoPainel('admin-ajax.php'))}\n`
  );
}

/**
 * `WP_Sitemaps::add_robots( $output, $is_public )` (`class-wp-sitemaps.php:295`):
 * a linha do indice, so quando o site e publico (`:296`). O `esc_url()` de
 * `:297` nao esta portado — ver o cabecalho de `./xml-do-mapa-do-site.ts`.
 */
export function acrescentarLinhaDoIndice(
  saida: string,
  publico: boolean,
  enderecoDoIndice: string,
): string {
  return publico ? `${saida}\nSitemap: ${enderecoDoIndice}\n` : saida;
}

/** As diretivas da meta de robos: nome e valor, ou nome e `true`. */
export type DiretivasDeRobos = Readonly<Record<string, string | boolean>>;

/** `wp_robots_no_robots()` (`robots-template.php:140`). */
export function semRobos(diretivas: DiretivasDeRobos, blogPublic: ValorDeOpcao): DiretivasDeRobos {
  return indexacaoLigada(blogPublic)
    ? { ...diretivas, noindex: true, follow: true }
    : { ...diretivas, noindex: true, nofollow: true };
}

/** `wp_robots_noindex()` (`robots-template.php:70`). */
export function semIndexacaoQuandoPrivado(
  diretivas: DiretivasDeRobos,
  blogPublic: ValorDeOpcao,
): DiretivasDeRobos {
  return indexacaoLigada(blogPublic) ? diretivas : semRobos(diretivas, blogPublic);
}

/** `wp_robots_max_image_preview_large()` (`robots-template.php:188`). */
export function previaDeImagemGrande(
  diretivas: DiretivasDeRobos,
  blogPublic: ValorDeOpcao,
): DiretivasDeRobos {
  return indexacaoLigada(blogPublic) ? { ...diretivas, 'max-image-preview': 'large' } : diretivas;
}

/** O que os quatro filtros do nucleo perguntam da pagina. */
export interface PaginaNasDiretivasDeRobos {
  readonly blogPublic: ValorDeOpcao;
  /** `is_embed()`. */
  readonly ehIncorporacao: boolean;
  /** `is_search()`. */
  readonly ehBusca: boolean;
}

/**
 * Os quatro filtros que o nucleo prende em `wp_robots`, na ordem de
 * `default-filters.php:277`-`:280`: `wp_robots_noindex`,
 * `wp_robots_noindex_embeds` (`robots-template.php:92`),
 * `wp_robots_noindex_search` (`:118`) e `wp_robots_max_image_preview_large`.
 */
export function diretivasDeRobosDoNucleo(pagina: PaginaNasDiretivasDeRobos): DiretivasDeRobos {
  let diretivas: DiretivasDeRobos = {};
  diretivas = semIndexacaoQuandoPrivado(diretivas, pagina.blogPublic);
  if (pagina.ehIncorporacao) {
    diretivas = semRobos(diretivas, pagina.blogPublic);
  }
  if (pagina.ehBusca) {
    diretivas = semRobos(diretivas, pagina.blogPublic);
  }
  return previaDeImagemGrande(diretivas, pagina.blogPublic);
}

/**
 * O atributo `content` que `wp_robots()` (`robots-template.php:20`) escreve,
 * ou `null` quando nao ha diretiva nenhuma e a meta nao sai (`:47`-`:49`).
 * Valor texto vira `nome:valor`; valor verdadeiro, so o nome; falso, nada.
 */
export function conteudoDaMetaDeRobos(diretivas: DiretivasDeRobos): string | null {
  const partes: string[] = [];
  for (const [nome, valor] of Object.entries(diretivas)) {
    if (typeof valor === 'string') {
      partes.push(`${nome}:${valor}`);
    } else if (valor) {
      partes.push(nome);
    }
  }
  return partes.length === 0 ? null : partes.join(', ');
}
