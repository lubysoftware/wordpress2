/**
 * O conteudo que a consulta publica devolve, e de onde ele vem — a etapa 3 de
 * UC-01, *"Sistema executa a consulta principal e carrega os registros"*, que no
 * legado e `WP::query_posts()` (`wp-includes/class-wp.php:701-705`) chamando
 * `WP_Query::query()` (`wp-includes/class-wp-query.php:3970-3975`).
 *
 * Entrega de **T003** (US-1, CA-1.4).
 *
 * ---
 *
 * ## Por que o repositorio e ligacao tardia, e nao a porta de dados deste modulo
 *
 * `posts` e tabela de **BC-01** (`target_architecture.md` § *BC-01: Conteudo*,
 * que funde `wp-query` com os outros sete modulos *"porque todos leem ou
 * escrevem a mesma coluna"*), e a regra de dependencia 3 proibe
 * `contextos/leitura-publica/` importar `contextos/conteudo/` *"sempre, sem
 * excecao"*. Logo o acesso ao conteudo chega **no contexto da operacao**, como
 * `ClassificacaoNaPublicacao` chega em `contextos/conteudo/publicacao/`.
 *
 * E e tambem o que o catalogo de testes descreve: os cinco casos de `REQ-038`
 * (UT-038-1 a UT-038-5) declaram como duplos *"registro de regras de endereco"*
 * e **"repositorio de conteudo"** — nao um duplo de banco. O mesmo duplo aparece
 * nos cinco casos de `REQ-040` e nos cinco de `REQ-041`, ou seja a paginacao
 * (T007) e o portao de `post_status` (T009) **decidem aqui** e pedem ao
 * repositorio; nenhuma das duas monta SQL neste modulo.
 *
 * A `PortaDeDados` deste modulo continua declarada e **continua sem uso**: o
 * unico consumidor previsto dela e a fonte da tabela de regras de traducao, pelo
 * item 1 de `../portas/porta-de-dados.ts`. Os dois zeros de `../modulo.test.ts`
 * seguem valendo depois de T003.
 *
 * ## O que este arquivo deliberadamente NAO tem
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | ✅ o total encontrado e o numero de paginas | `class-wp-query.php:3692-3741` (`set_found_posts`) | **T007** (US-3): o total que o banco devolve entrou aqui, em {@link ResultadoDaConsulta.totalEncontrado}, e a divisao em paginas esta em `./paginacao-da-listagem.ts` |
 * | o estado e o autor do conteudo | `class-wp-query.php:3500-3567` | **T009** (US-4), o portao de `post_status` |
 * | a senha do conteudo | `wp-includes/post-template.php:882` | **T013** (US-6) |
 * | o conteudo fixado no topo | `class-wp-query.php:3582-3629` | de quem tiver a opcao `sticky_posts`; nenhuma tarefa desta feature a nomeia |
 *
 * Os campos das tres primeiras linhas **entram quando a tarefa delas entrar**, e
 * ampliar o contrato na tarefa que precisa e o que `../portas/porta-de-dados.ts`
 * ja fez com o prefixo de tabela: nao e refazer o esqueleto.
 */

import type { CriteriosDaConsulta } from './criterios-da-consulta.js';
import type { OrdenacaoResolvida } from './ordenacao-da-listagem.js';
import type { PaginacaoResolvida } from './paginacao-da-listagem.js';
import type { TiposDeConsulta } from './tipo-de-consulta.js';

/**
 * Um registro de conteudo, nos campos que a leitura publica le em T003.
 *
 * Os nomes sao os de `contextos/conteudo/armazenamento/conteudo.ts` — `id`,
 * `identificadorNaUrl`, `tipo`, `corpo`, `data` —, de proposito: e a **mesma**
 * linha de `posts` vista por dois contextos, e dois vocabularios para a mesma
 * coluna divergiriam no dia em que uma das duas leituras ganhasse campo.
 */
export interface ConteudoConsultado {
  /** `ID`. */
  readonly id: number;
  /** `post_name` — o identificador na URL. */
  readonly identificadorNaUrl: string;
  /** `post_type`. */
  readonly tipo: string;
  /**
   * `post_content` — o corpo.
   *
   * Esta aqui porque **o 404 depende dele**: o ramo de `class-wp.php:758-772`
   * conta os marcadores `<!--nextpage-->` do corpo para decidir se a pagina
   * interna pedida existe. Sem o corpo, uma pagina interna inexistente
   * responderia 200.
   */
  readonly corpo: string;
  /** `post_date` — texto no formato do banco. */
  readonly data: string;
}

/**
 * O que a consulta principal devolve do repositorio.
 *
 * Tres campos, e os dois primeiros sao lidos por `handle_404`:
 *
 * - `conteudos` e o `WP_Query::$posts`, **na ordem em que o repositorio os
 *   devolve** — a ordem e a regra (CA-3.4, e UT-038-3 afirma *"o mesmo conjunto
 *   de registros, na mesma ordem"*). Este modulo nao reordena: o que ele faz e
 *   **declarar** a ordem, em `./ordenacao-da-listagem.ts`.
 * - `objetoConsultado` e o `get_queried_object()` que o ramo de
 *   `class-wp.php:790` testa: *"Don't 404 for these queries if they matched an
 *   object"*. E `unknown` porque o legado devolve quatro tipos diferentes ali
 *   (`WP_Term`, `WP_Post_Type`, `WP_Post`, `WP_User`) e **nada neste modulo le o
 *   conteudo dele**: o que `handle_404` pergunta e so se existe.
 * - `totalEncontrado` e o `SELECT FOUND_ROWS()` de `set_found_posts()`
 *   (`class-wp-query.php:3712`), entregue por **T007**.
 */
export interface ResultadoDaConsulta {
  readonly conteudos: readonly ConteudoConsultado[];
  readonly objetoConsultado?: unknown;
  /**
   * O total de registros que casam a consulta **ignorando a janela** — o
   * `SELECT FOUND_ROWS()` que o legado emite logo depois da consulta principal
   * (`class-wp-query.php:3712`), e o unico numero desta feature que o
   * repositorio precisa devolver alem dos registros.
   *
   * ⚠️ Vem do repositorio, e nao e `conteudos.length`: a janela de
   * `./paginacao-da-listagem.ts` corta a lista e **nao** corta este total. E
   * dele que sai o numero de paginas de CA-3.2.
   *
   * Ausente significa *"nao perguntei"*, e o resultado e **zero** — que e o que
   * `(int) $wpdb->get_var()` devolve sem linha de resposta. O repositorio so
   * precisa dele quando a consulta tem janela e `no_found_rows` esta desligado;
   * nos outros casos o legado conta a propria lista (`:3717`).
   */
  readonly totalEncontrado?: number;
}

/**
 * O recorte que a consulta pede ao repositorio: a janela de registros e a ordem
 * declarada.
 *
 * E o que `WP_Query::get_posts()` tem em maos quando monta o SQL — `$limits`
 * (`:2823`) e `$orderby` (`:2553`) —, entregue como **dado** em lugar de texto
 * de clausula. Entrega de **T007** (US-3).
 *
 * O repositorio recebe o recorte por fora dos criterios porque o legado tambem
 * o tem por fora: `$limits` e `$orderby` sao variaveis locais de `get_posts()`,
 * nao chaves de `query_vars`, e `set_found_posts()` recebe `$limits` por
 * argumento justamente por isso (`:3692`).
 */
export interface RecorteDaListagem {
  readonly paginacao: PaginacaoResolvida;
  readonly ordenacao: OrdenacaoResolvida;
}

/**
 * O repositorio de conteudo, como a leitura publica o pede.
 *
 * Recebe os criterios **ja analisados**, os predicados de tipo de consulta e o
 * recorte da listagem, que e o que `WP_Query::get_posts()` tem em maos quando
 * monta a consulta (`class-wp-query.php:1900`): os tres chegam juntos porque no
 * legado sao a mesma instancia mais duas variaveis locais, e metade das
 * decisoes de `get_posts()` le predicado e nao criterio.
 *
 * T007 acrescentou o terceiro argumento. Um repositorio que o ignore continua
 * valendo — foi o que os duplos de T003 fizeram —, e o que ele perde e o
 * recorte: sem janela nao ha pagina, e sem a ordem declarada a listagem nao e
 * estavel entre paginas (CA-3.4).
 *
 * Sincrono, por AD-04 de `target_architecture.md`: a fronteira de `await` e
 * `adaptadores/`.
 */
export type RepositorioDeConteudoPublico = (
  criterios: CriteriosDaConsulta,
  tipos: TiposDeConsulta,
  recorte: RecorteDaListagem,
) => ResultadoDaConsulta;

/** O resultado de uma consulta que nao encontrou nada. */
export const SEM_CONTEUDO: ResultadoDaConsulta = Object.freeze({
  conteudos: Object.freeze([]),
});

/**
 * O repositorio de uma instalacao sem conteudo nenhum.
 *
 * E o default quando ninguem informa repositorio, e **nao** e um esboco: e o
 * estado de uma instalacao em que a tabela `posts` nao tem linha que casa os
 * criterios, e o legado responde a isso com o terceiro ramo de `handle_404`
 * (`class-wp.php:783-796`) — que e por onde a home de um site vazio continua
 * respondendo 200.
 */
export const REPOSITORIO_SEM_CONTEUDO: RepositorioDeConteudoPublico = () =>
  SEM_CONTEUDO;

/**
 * `get_page_by_path( $caminho, OBJECT, $tipo )`
 * (`wp-includes/post.php`, chamado em `class-wp-query.php:1080` e `:1085` e em
 * `wp-includes/rewrite.php:419`).
 *
 * Devolve o registro, ou ausencia quando nenhum casa o caminho. E ligacao
 * tardia pela mesma razao do repositorio, e **nao** e o mesmo colaborador que o
 * `PaginaNoCaminho` de `../traducao-de-endereco/tabela-de-regras.ts`: aquele
 * responde um booleano porque o legado ali so testa existencia e estado
 * descartavel (`class-wp.php:242-259`), e este devolve o registro porque quem o
 * chama le `post_type`, `post_name`, `post_date` e `post_content`.
 *
 * O `$tipo` chega por argumento porque os tres pontos de chamada o informam
 * diferente: `class-wp-query.php:1080` pede **pagina** (o default do legado),
 * `:1085` pede explicitamente `post` e `rewrite.php:419` tambem.
 */
export type ConteudoPorCaminho = (
  caminho: string,
  tipo: string,
) => ConteudoConsultado | undefined;

/** O tipo de conteudo que `get_page_by_path()` procura quando ninguem o nomeia. */
export const TIPO_PADRAO_DE_CAMINHO = 'page';

/** O tipo que `class-wp-query.php:1085` e `rewrite.php:419` pedem por nome. */
export const TIPO_DE_CONTEUDO_SIMPLES = 'post';

/**
 * O marcador de pagina interna dentro do corpo — o `'<!--nextpage-->'` que o
 * legado conta em dois lugares desta feature: `WP::handle_404()`
 * (`wp-includes/class-wp.php:760` e `:765-767`) e
 * `wp_resolve_numeric_slug_conflicts()` (`wp-includes/rewrite.php:450`).
 *
 * Esta declarado uma vez porque as duas contagens tem de concordar: se
 * divergirem, um endereco com pagina interna valida responde 404 num caminho e
 * 200 no outro.
 *
 * ⚠️ Ele e **texto literal no corpo gravado**, e nao configuracao: o legado o
 * escreve inteiro nas duas linhas, sem constante. Po-lo em opcao seria inventar
 * ponto de configuracao que o produto nao tem (P6).
 */
export const MARCADOR_DE_PAGINA_NO_CORPO = '<!--nextpage-->';
