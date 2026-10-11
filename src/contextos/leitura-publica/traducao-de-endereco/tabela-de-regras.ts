/**
 * A tabela de regras de traducao de endereco — o `$wp_rewrite->wp_rewrite_rules()`
 * que `WP::parse_request()` le em `wp-includes/class-wp.php:163`.
 *
 * E o nucleo da entrega de T002: *"as regras de traducao do legado estao
 * declaradas como dado, nao como codigo"*. No legado ela **ja e dado** — um
 * arranjo de padrao para cadeia de consulta, gravado na configuracao do site —, e
 * e dessa propriedade que sai o CA-1.3 de US-1: *"alterar a forma dos enderecos
 * amigaveis nao exige alterar o conteudo gravado"*. Trocar a forma dos enderecos
 * reescreve **esta tabela**, e nenhuma linha de `posts`.
 *
 * ---
 *
 * ## 🔴 Numa instalacao nova a tabela esta VAZIA, e isso nao e lacuna deste porte
 *
 * `WP_Rewrite::rewrite_rules()` abre com tres linhas que decidem a cara do
 * produto recem-instalado (`wp-includes/class-wp-rewrite.php:1279-1281`):
 *
 * ```php
 * if ( empty( $this->permalink_structure ) ) {
 *     return $rewrite;
 * }
 * ```
 *
 * E o instalador semeia `permalink_structure` como **texto vazio**
 * (`wp-admin/includes/schema.php:443`), com `rewrite_rules` tambem vazio
 * (`:444`). Logo, na instalacao nova de site unico — que e a premissa deste porte
 * (resposta 2 de `questions.md`) — **nao existe regra nenhuma**, o bloco de
 * casamento inteiro de `class-wp.php:165-298` nao roda, e todo criterio vem dos
 * parametros da requisicao: `/?p=42`, e nao `/2026/10/ola-mundo/`.
 *
 * Duas consequencias que mudam como se le o resto desta feature:
 *
 * 1. O estado que T001 entregou — *"resolve o endereco pedido para um conjunto
 *    vazio de criterios"* — **e o comportamento de fabrica**, nao um esboco. O que
 *    T001 nao tinha era o outro lado: os criterios diretos, que T002 traz.
 * 2. Em instalacao de **rede**, o default e outro:
 *    `/%year%/%monthnum%/%day%/%postname%/` (`wp-admin/includes/schema.php:576`,
 *    e `:1135`/`:1137` no arranque da rede). A mesma consulta, dois caminhos de
 *    entrada — que e exatamente o CA-1.2 que US-1 cobra.
 *
 * ## Quem GERA a tabela nao e esta feature, e a fronteira esta aqui de proposito
 *
 * A geracao mora em `WP_Rewrite` (`rewrite-e-permalinks`), que
 * `target_architecture.md` mapeia para `plataforma/rotas/` — *"Reescrita e
 * permalink"* — e cujo porte o `plan.md` da feature `013` descreve como **codigo
 * novo e nao porte**, porque num runtime de JavaScript nao ha servidor externo a
 * quem escrever `.htaccess`. Nenhuma tarefa desta feature a nomeia.
 *
 * Por isso a tabela chega por {@link FonteDeRegrasDeTraducao}, e a fonte e uma
 * **funcao**, nao um valor: o legado chama `wp_rewrite_rules()` uma vez por
 * requisicao, naquela posicao, e a chamada tem efeito observavel — se a opcao
 * estiver vazia, ela reconstroi a tabela e **grava**
 * (`class-wp-rewrite.php:1493-1500` e `:1509-1524`):
 *
 * ```php
 * public function wp_rewrite_rules() {
 *     $this->rules = get_option( 'rewrite_rules' );
 *     if ( empty( $this->rules ) ) { $this->refresh_rewrite_rules(); }
 *     return $this->rules;
 * }
 * ```
 *
 * ⚠️ `refresh_rewrite_rules()` so chama `update_option( 'rewrite_rules', ... )`
 * **se a acao `wp_loaded` ja disparou** (`:1515-1523`); antes dela, a gravacao e
 * adiada para `flush_rules`, *"as the rules may be partial"*. Numa leitura
 * publica `wp_loaded` ja disparou quando `wp()` roda, logo ali a gravacao
 * acontece — e e por isso que a porta de dados desta feature tem `escrever`
 * (`portas/porta-de-dados.ts`, item 1) mesmo com a pos-condicao de UC-01 dizendo
 * *"nada muda no armazenamento"*. Essa gravacao e da fonte, nao deste arquivo:
 * quem implementar a fonte sobre a porta tem de preservar a ordem — ler a opcao,
 * reconstruir se vazia, gravar so depois de `wp_loaded`.
 *
 * ## A ordem da tabela e a regra, e ela nao e alfabetica nem por especificidade
 *
 * `parse_request` para na **primeira** regra que casa (`class-wp.php:261-263`), e
 * a ordem vem da montagem de `rewrite_rules()`
 * (`class-wp-rewrite.php:1455` e `:1457`), com os grupos nesta sequencia:
 *
 * | # | grupo | o que e |
 * |---|---|---|
 * | 1 | `extra_rules_top` | regras de terceiro que pediram o topo |
 * | 2 | `robots\.txt$` | so com a instalacao na raiz (`:1285`) |
 * | 3 | `favicon\.ico$` | so com a instalacao na raiz (`:1288`) |
 * | 4 | `sitemap\.xml` | so com a instalacao na raiz (`:1291`) |
 * | 5 | arquivos herdados | feed antigo e `wp-app.php` (`:1294-1297`) |
 * | 6 | paginas de cadastro | `:1300-1307` |
 * | 7 | raiz | do `permalink_structure` |
 * | 8 | comentarios | |
 * | 9 | busca | |
 * | 10 | autor | |
 * | 11 | data | |
 * | 12 | **pagina e conteudo**, nesta ordem **ou na inversa** | ver abaixo |
 * | 13 | `extra_rules` | regras de terceiro no fim |
 *
 * ⚠️ A unica diferenca entre as duas montagens e a posicao 12: com
 * `use_verbose_page_rules` ligado, pagina vem **antes** de conteudo (`:1455`);
 * desligado, conteudo vem antes (`:1457`). Quem decide e a forma dos enderecos,
 * em `plataforma/rotas`: a ordem chega pronta com a tabela, e **este modulo nao
 * reordena nada**.
 */

import type { CriteriosDeConsulta } from '../requisicao/endereco-pedido.js';

/**
 * O ponto de entrada do site dentro da cadeia de consulta das regras — o
 * `WP_Rewrite::$index` (`wp-includes/class-wp-rewrite.php:174`), que o proprio
 * legado comenta como *"Probably 'index.php'"* (`:915`).
 *
 * Aparece em dois lugares desta traducao: no comeco da cadeia de consulta de
 * cada regra (`index.php?...`, que `class-wp.php:270` recorta) e no teste que
 * decide entre `PATH_INFO` e `REQUEST_URI` (`:204`).
 */
export const INDICE_DO_SITE = 'index.php';

/**
 * O padrao da regra de raiz, e o unico que um endereco vazio pode casar.
 *
 * Com o caminho pedido vazio, o legado **nao percorre a tabela**: procura a chave
 * `'$'` direto (`wp-includes/class-wp.php:221-226`), com os casamentos valendo
 * `array( '' )`. Um porte que rodasse o laco para o caminho vazio casaria a
 * primeira regra com padrao tolerante — e a home do site passaria a responder o
 * que a primeira regra manda.
 */
export const PADRAO_DA_RAIZ = '$';

/**
 * Uma regra: o padrao que o caminho pedido tem de casar, e a cadeia de consulta
 * que ela produz.
 *
 * O padrao e uma expressao regular **na forma em que o legado a guarda**, sem
 * delimitador e sem ancora: quem casa a monta como `#^<padrao>#`
 * (`wp-includes/class-wp.php:238`). A consulta e texto com referencias
 * `$matches[N]` aos grupos do casamento — `WP_Rewrite` a gera na forma
 * `tagname=$matches[i]` (`class-wp-rewrite.php:920-922`).
 */
export interface RegraDeTraducao {
  readonly padrao: string;
  readonly consulta: string;
}

/**
 * Responde o que o legado pergunta a `get_page_by_path()` dentro do laco de
 * casamento, quando a tabela usa regra verbosa de pagina
 * (`wp-includes/class-wp.php:242-259`).
 *
 * **Verdadeiro so quando as duas condicoes do legado valem:** existe pagina no
 * caminho (`:246`, senao `continue` em `:249`) **e** o estado dela nao e o estado
 * descartavel que `:252-258` recusa — nao publico, nao protegido, nao privado e
 * excluido da busca, as quatro ao mesmo tempo.
 *
 * E ligacao tardia, e nao `import`: a pagina e de `BC-01` e o registro de estado
 * e de `plataforma/tipos-de-conteudo`, e a regra de dependencia 3 de
 * `target_architecture.md` proibe este modulo importar outro contexto no topo.
 * Ausente a ligacao, a regra verbosa **nao confirma** — que e o que o legado faz
 * quando a pagina nao existe.
 */
export type PaginaNoCaminho = (caminho: string) => boolean;

/**
 * A tabela, como este modulo a consome.
 *
 * Os tres campos sao os tres valores que `parse_request` le do componente de
 * reescrita: as regras (`:163`), o `use_verbose_page_rules` (`:242`) e o caminho
 * para `get_page_by_path()` (`:246`). Nada mais de `WP_Rewrite` atravessa esta
 * fronteira.
 */
export interface TabelaDeRegras {
  /** As regras, **na ordem em que o legado as montou**. */
  readonly regras: readonly RegraDeTraducao[];
  /**
   * `WP_Rewrite::$use_verbose_page_rules` (`class-wp-rewrite.php:267`, com o
   * valor decidido em `:1942-1944` pela forma dos enderecos).
   */
  readonly usarRegrasVerbosasDePagina?: boolean;
  readonly paginaNoCaminho?: PaginaNoCaminho;
}

/**
 * A tabela da instalacao nova de site unico: nenhuma regra.
 *
 * Ver a primeira secao do cabecalho deste arquivo — e o default de fabrica
 * (`wp-admin/includes/schema.php:443`), nao a ausencia de um porte.
 */
export const TABELA_SEM_REGRAS: TabelaDeRegras = Object.freeze({
  regras: Object.freeze([]),
});

/**
 * De onde a tabela vem: o `wp_rewrite_rules()` do legado
 * (`wp-includes/class-wp.php:163`).
 *
 * Funcao, e nao valor, pelas razoes da terceira secao do cabecalho: a chamada
 * acontece uma vez por requisicao, na posicao do legado, e pode gravar.
 */
export type FonteDeRegrasDeTraducao = () => TabelaDeRegras;

/**
 * Uma fonte que devolve sempre a mesma tabela.
 *
 * E o caso da requisicao em que a opcao `rewrite_rules` ja esta preenchida: a
 * fonte le e devolve, sem reconstruir e sem gravar. Tambem e a forma com que o
 * teste declara a tabela sem precisar de porta.
 */
export function fonteFixaDeRegras(
  tabela: TabelaDeRegras,
): FonteDeRegrasDeTraducao {
  return () => tabela;
}

/**
 * As tres regras que so existem com a instalacao na raiz do dominio
 * (`wp-includes/class-wp-rewrite.php:1285`, `:1288` e `:1291`).
 *
 * A condicao do legado e literal: `empty( $home_path['path'] ) || '/' === $home_path['path']`.
 * Com o site numa subpasta, as tres **nao entram na tabela** — e o `robots.txt`,
 * o `favicon.ico` e o `sitemap.xml` daquela instalacao deixam de ser servidos por
 * este caminho.
 *
 * ⚠️ `sitemap\.xml` e a unica das tres **sem** `$` no fim, logo ela casa
 * `sitemap.xml` seguido de qualquer coisa. E assim no legado.
 */
export const REGRAS_DA_INSTALACAO_NA_RAIZ: readonly RegraDeTraducao[] =
  Object.freeze([
    { padrao: 'robots\\.txt$', consulta: `${INDICE_DO_SITE}?robots=1` },
    { padrao: 'favicon\\.ico$', consulta: `${INDICE_DO_SITE}?favicon=1` },
    { padrao: 'sitemap\\.xml', consulta: `${INDICE_DO_SITE}?sitemap=index` },
  ]);

/**
 * Os arquivos herdados, que o legado chama de `deprecated_files`
 * (`wp-includes/class-wp-rewrite.php:1294-1297`).
 *
 * Duas regras, e as duas sao P8 em estado puro: o endereco de um recurso que o
 * produto parou de oferecer continua respondendo, e com resposta **declarada**.
 * A segunda traduz para `error=403`, que e como uma regra de traducao produz
 * codigo HTTP: o criterio `error` e nome publico, chega aos criterios e o envio
 * de cabecalhos o le (`class-wp.php:455-466`).
 */
export const REGRAS_DE_ARQUIVO_HERDADO: readonly RegraDeTraducao[] =
  Object.freeze([
    {
      padrao: '.*wp-(atom|rdf|rss|rss2|feed|commentsrss2)\\.php$',
      consulta: `${INDICE_DO_SITE}?feed=old`,
    },
    {
      padrao: '.*wp-app\\.php(/.*)?$',
      consulta: `${INDICE_DO_SITE}?error=403`,
    },
  ]);

/**
 * As paginas de cadastro (`wp-includes/class-wp-rewrite.php:1300-1307`).
 *
 * As duas primeiras entram **so em rede, e so no site principal**
 * (`is_multisite() && is_main_site()`); a terceira o legado marca como
 * *"Deprecated"* e acrescenta **sempre**. Os padroes das tres tem o ponto do
 * `.php` sem escape, como no legado: `.*wp-signup.php$` casa tambem
 * `wp-signupXphp`.
 */
export const REGRAS_DE_CADASTRO_EM_REDE: readonly RegraDeTraducao[] =
  Object.freeze([
    { padrao: '.*wp-signup.php$', consulta: `${INDICE_DO_SITE}?signup=true` },
    {
      padrao: '.*wp-activate.php$',
      consulta: `${INDICE_DO_SITE}?activate=true`,
    },
  ]);

/** A regra de cadastro herdada, que entra em qualquer instalacao (`:1307`). */
export const REGRA_DE_CADASTRO_HERDADA: RegraDeTraducao = Object.freeze({
  padrao: '.*wp-register.php$',
  consulta: `${INDICE_DO_SITE}?register=true`,
});

/**
 * Monta a tabela a partir de regras declaradas.
 *
 * Nao gera regra nenhuma: so embala a lista na forma que
 * {@link FonteDeRegrasDeTraducao} devolve, preservando a ordem recebida. A
 * geracao e de `plataforma/rotas` (segunda secao do cabecalho).
 */
export function tabelaDeRegras(
  regras: readonly RegraDeTraducao[],
  opcoes: Omit<TabelaDeRegras, 'regras'> = {},
): TabelaDeRegras {
  return Object.freeze({ ...opcoes, regras: Object.freeze([...regras]) });
}

/**
 * Os criterios que uma regra casada produz, antes da coleta.
 *
 * E o `$perma_query_vars` do legado: ele **nao** e o conjunto final. Dele a
 * coleta le so os nomes publicos, e so quando nenhuma fonte de maior precedencia
 * tem o nome (`class-wp.php:334`).
 */
export type CriteriosDaRegra = CriteriosDeConsulta;
