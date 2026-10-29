/**
 * Os bytes do indice e da pagina do mapa do site.
 *
 * Tarefa **T015** da feature `013-superficies-programaticas` (US-7). O mapa do
 * site e **area 1** de `parity_specs.md`: *"saida byte a byte, zero
 * divergencia"*. A forma abaixo foi conferida contra o oraculo executavel
 * (`scripts/oraculo/`, PHP 8.3.35), e nao so lida:
 *
 * ```
 * <?xml version="1.0" encoding="UTF-8"?>
 * <?xml-stylesheet type="text/xsl" href="http://localhost:8080/wp-sitemap-index.xsl" ?>
 * <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>…</loc></sitemap>…</sitemapindex>
 * ```
 *
 * No legado e `SimpleXMLElement::asXML()` (`wp-includes/sitemaps/class-wp-sitemaps-renderer.php:146`
 * e `:210`), e os detalhes que ele produz e que um porte erra:
 *
 * 1. a declaracao **perde** o espaco antes de `?>` (o fonte escreve
 *    `encoding="UTF-8" ?>`, `:150`), e a da folha de estilo **mantem** o dela;
 * 2. cada no de topo termina em `\n`, e o corpo inteiro numa linha so;
 * 3. sem entrada nenhuma, a raiz fecha nela mesma: `<sitemapindex xmlns="…"/>`;
 * 4. o texto escapa `&`, `<`, `>` e o retorno de carro (`&#13;`); aspas e
 *    apostrofo saem crus, e o que nao e ASCII sai em UTF-8;
 * 5. os campos saem **na ordem da entrada**, e campo fora da lista e ignorado
 *    (`:166` e `:230`: `_doing_it_wrong()`, declarado e nao emitido).
 *
 * ⚠️ **O `esc_url()` de `loc` e o `esc_xml()` dos outros campos nao estao
 * portados aqui.** Os dois sao de `plataforma/formatacao/`, feature `015`, como
 * o `esc_html()` que T002 registrou. O efeito do `esc_url()` sobre o `&` foi
 * medido — ele o escreve `&#038;`, o `addChild()` le a referencia e o
 * `asXML()` devolve `&amp;` —, e e o que {@link escaparTextoXml} produz. O que
 * fica de fora e o resto do `esc_url()`: ele **apaga** `<`, `>`, `"` e codifica
 * espaco (`http://x.test/a b?r=<2>` vira `http://x.test/a%20b?r=2`). Nenhum
 * endereco montado pelo nucleo tem esses caracteres; o de uma extensao pode ter.
 */

/** O espaco de nome dos dois documentos (`renderer:152` e `:216`). */
export const ESPACO_DE_NOME_DO_MAPA_DO_SITE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

/** O tipo de conteudo das duas respostas (`renderer:126` e `:190`). */
export const TIPO_DE_CONTEUDO_DO_MAPA_DO_SITE = 'application/xml; charset=UTF-8';

/** Campos aceitos no indice (`renderer:161`-`:164`). */
export const CAMPOS_DO_INDICE = ['loc', 'lastmod'] as const;

/** Campos aceitos na pagina (`renderer:225`-`:228`). */
export const CAMPOS_DA_PAGINA = ['loc', 'lastmod', 'changefreq', 'priority'] as const;

/** O texto de um no, como o `asXML()` do libxml o escreve. */
export function escaparTextoXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#13;');
}

/**
 * A instrucao da folha de estilo, ou nada (`renderer:46` e `:52`): o filtro de
 * endereco pode devolver falso, e entao a linha some.
 */
function instrucaoDeFolhaDeEstilo(endereco: string | false): string {
  return endereco === false || endereco === ''
    ? ''
    : `<?xml-stylesheet type="text/xsl" href="${endereco}" ?>\n`;
}

/**
 * Elemento sem conteudo fecha nele mesmo — `<url/>`, `<loc/>` —, e conferido
 * contra o oraculo para entrada so com campo desconhecido e para `loc` vazio.
 */
function elemento(nome: string, conteudo: string): string {
  return conteudo === '' ? `<${nome}/>` : `<${nome}>${conteudo}</${nome}>`;
}

function documento(
  raiz: string,
  item: string,
  campos: readonly string[],
  entradas: readonly { readonly [campo: string]: string }[],
  folhaDeEstilo: string | false,
): string {
  const cabeca = `<?xml version="1.0" encoding="UTF-8"?>\n${instrucaoDeFolhaDeEstilo(folhaDeEstilo)}`;
  const abertura = `${raiz} xmlns="${ESPACO_DE_NOME_DO_MAPA_DO_SITE}"`;

  if (entradas.length === 0) {
    return `${cabeca}<${abertura}/>\n`;
  }

  const corpo = entradas
    .map((entrada) => {
      const filhos = Object.entries(entrada)
        .filter(([campo]) => campos.includes(campo))
        .map(([campo, valor]) => elemento(campo, escaparTextoXml(valor)))
        .join('');
      return elemento(item, filhos);
    })
    .join('');

  return `${cabeca}<${abertura}>${corpo}</${raiz}>\n`;
}

/** `get_sitemap_index_xml( $sitemaps )` (`renderer:146`). */
export function xmlDoIndice(
  entradas: readonly { readonly [campo: string]: string }[],
  folhaDeEstilo: string | false,
): string {
  return documento('sitemapindex', 'sitemap', CAMPOS_DO_INDICE, entradas, folhaDeEstilo);
}

/** `get_sitemap_xml( $url_list )` (`renderer:210`). */
export function xmlDaPagina(
  entradas: readonly { readonly [campo: string]: string }[],
  folhaDeEstilo: string | false,
): string {
  return documento('urlset', 'url', CAMPOS_DA_PAGINA, entradas, folhaDeEstilo);
}
