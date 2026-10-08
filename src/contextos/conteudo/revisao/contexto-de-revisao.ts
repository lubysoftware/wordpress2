/**
 * O contexto da revisao: o que a submissao para revisao precisa **alem** do que
 * a gravacao ja pedia, e os **dois** pontos de extensao que esta tarefa
 * atravessa.
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao` (US-7). O contexto
 * **estende** {@link ContextoDeGravacao} em vez de declarar outro, e a razao e o
 * caminho do legado: submeter para revisao e `edit_post()`
 * (`wp-admin/includes/post.php:269`) chamando `wp_update_post()`
 * (`wp-includes/post.php:5327`), que chama `wp_insert_post()` — a mesma funcao
 * que T005 e T007 portaram. Quem submete grava, e grava pela mesma porta; o que
 * muda e **quem decide o estado antes** e **quem pode fazer isso**.
 *
 * ---
 *
 * # Os tres colaboradores que esta tarefa acrescenta
 *
 * | colaborador | o que e no legado | por que nao da para resolver aqui |
 * |---|---|---|
 * | {@link ContextoDeRevisao.fonteDeConteudo} | as cinco leituras de `map_meta_cap()` | `edit_post` e `read_post` sao **meta-capacidades**: resolvem por autoria, por estado e pelas tres paginas de funcao especial (`wp-includes/capabilities.php:108` e `:308`). A fonte e de `plataforma/autorizacao/`, declarada embaixo e implementada em cima |
 * | {@link ContextoDeRevisao.consultarConteudo} | `wp( $query )` dentro de `wp_edit_posts_query()` (`wp-admin/includes/post.php:1329`) | e `WP_Query`, que e **T009 da feature 004** (`contextos/leitura-publica/`). No legado a fila do painel tambem **nao** escreve SQL: ela monta variaveis de consulta e entrega. Ver `fila-de-revisao.ts` |
 * | {@link ContextoDeRevisao.itensPorPaginaDaConta} | `get_user_option( "edit_{$tipo}_per_page" )` (`:1281`) | e opcao **por conta**, de `plataforma/opcoes/` com a chave de BC-05 |
 *
 * ⚠️ **`tipoDeConteudo` aparece duas vezes, e isso nao e duplicacao de
 * contrato.** O contexto da gravacao ja o tem (T007 o acrescentou, para o slot
 * `publish_posts` e para o `case 'publish_post'`), e a fonte completa o tem
 * porque `map_meta_cap()` o le. No legado e **a mesma** chamada,
 * `get_post_type_object()`: quem compoe passa a mesma funcao nos dois campos, e
 * nenhum ramo desta pasta depende de elas divergirem.
 *
 * ---
 *
 * # O que este arquivo NAO declara
 *
 * - **Nenhuma porta nova.** A submissao le e grava pela porta de dados de T001,
 *   atraves do repositorio de T002, e nao envia e-mail: UC-06 e literal —
 *   *"Nenhuma notificacao sai daqui. O conteudo pendente aparece na lista do
 *   painel e nada mais acontece: nao ha e-mail ao editor, nao ha fila com prazo,
 *   nao ha aviso. A revisao depende de alguem abrir a tela."* O aviso ao autor e
 *   **US-9**, em T019, e a parada registrada sobre ele esta em
 *   `../portas/porta-de-email.ts`.
 * - **Nenhum relogio proprio.** O instante que esta tarefa le e o
 *   `current_time( 'mysql' )` do `$clear_date` de `wp_update_post()` (`:5370`),
 *   e ele chega por {@link ContextoDeGravacao.datas}, que T005 ja declarou.
 * - **Nenhum prazo, contagem ou limite proprio.** O unico numero desta pasta e
 *   os 20 itens por pagina da fila do painel (`:1283`), e ele e constante
 *   nomeada em `fila-de-revisao.ts`, com o valor de fabrica e teste de borda,
 *   como o **P6** cobra. A fila de revisao do legado **nao tem prazo**: conteudo
 *   pendente fica pendente para sempre, e inventar vencimento aqui seria
 *   inventar numero que o produto nao tem.
 */

import type { Conteudo } from '../armazenamento/index.js';
import type {
  ContextoDeGravacao,
  GanchosDaGravacao,
} from '../gravacao/index.js';
import type { FonteDeConteudoNaAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type { ChaveSanitizada } from './estado-na-submissao.js';

/**
 * As variaveis de consulta que `wp_edit_posts_query()` monta e entrega a `wp()`
 * — `wp-admin/includes/post.php:1314` e `:1317`-`:1322`.
 *
 * **Os nomes das chaves sao os do legado**, e nao traducoes, pelo mesmo motivo
 * das 21 colunas de `ColunasDaGravacao`: eles sao **superficie publicada**
 * (P8). Extensao de terceiro intercepta `pre_get_posts` e le `post_status`,
 * `perm` e `orderby` por esses nomes; o filtro `edit_posts_per_page` existe
 * justamente para mexer num deles.
 *
 * Os campos opcionais sao os que o legado acrescenta **somente** para tipo
 * hierarquico (`:1317`-`:1322`): ausentes, a consulta e a do tipo plano.
 */
export interface VariaveisDaConsultaDeConteudo {
  /** `post_type` — o tipo, resolvido para `post` quando nao e registrado (`:1252`). */
  readonly post_type: string;
  /** `post_status` — nesta fila, sempre o estado em revisao (`:1260`). */
  readonly post_status: string;
  /** `perm` — `readable`, e e so com ela que o recorte por autoria existe (`:1261`). */
  readonly perm: string;
  /** `orderby` — `modified` na fila de pendente e de rascunho (`:1269`). */
  readonly orderby: string;
  /** `order` — `ASC` na fila de pendente, e so nela (`:1277`). */
  readonly order: string;
  /** `posts_per_page` — 20 de fabrica, por conta e filtravel (`:1281`-`:1312`). */
  readonly posts_per_page: number;
  /** `posts_per_archive_page` — so em tipo hierarquico (`:1321`). */
  readonly posts_per_archive_page?: number;
  /** `fields` — `id=>parent` em tipo hierarquico (`:1322`). */
  readonly fields?: string;
}

/**
 * `wp( $query )` — a consulta que materializa a fila
 * (`wp-admin/includes/post.php:1329`).
 *
 * Chega por argumento, e **nao** e implementada aqui, por duas razoes que a
 * mesma linha do legado sustenta:
 *
 * 1. **no legado esta funcao tambem nao escreve SQL.** `wp_edit_posts_query()`
 *    monta um arranjo e chama `wp()`; o `WHERE` e o `ORDER BY` sao montados por
 *    `WP_Query::get_posts()` (`wp-includes/class-wp-query.php:2651`-`:2716`),
 *    que e outro modulo. Portar aqui uma segunda montagem de SQL produziria
 *    duas derivacoes do mesmo clausulado, e a segunda divergiria da primeira;
 * 2. **`WP_Query` e T009 da feature 004** (`contextos/leitura-publica/`), e o
 *    portao de `post_status` dela e o que cumpre CA-7.3 — o mesmo portao que
 *    T005 ja declarou para CA-2.3.
 *
 * O que **esta** aqui, e e o que CA-7.2 cobra, e a decisao de capacidade da
 * tela e as variaveis que ela entrega — ver `fila-de-revisao.ts`.
 */
export type ConsultaDeConteudo = (
  variaveis: VariaveisDaConsultaDeConteudo,
) => readonly Conteudo[];

/**
 * Os pontos de extensao que **esta tarefa** atravessa, somados aos onze que a
 * gravacao ja atravessava.
 *
 * Herda {@link GanchosDaGravacao} porque a submissao **passa pelo caminho de
 * gravacao**: os onze pontos de T005 e T007 disparam normalmente quando um
 * conteudo e submetido, e e por isso que extensao que escuta gravacao escuta
 * submissao tambem.
 *
 * Os dois desta tarefa sao **filtros de paginacao da fila**, e a ordem entre
 * eles e a do legado: o do tipo primeiro (`:1302`), o geral depois (`:1312`).
 * Inverter a ordem mudaria qual dos dois tem a ultima palavra.
 */
export interface GanchosDaRevisao extends GanchosDaGravacao {
  /**
   * `edit_{$post_type}_per_page` — **filtro**, um argumento (`:1302`).
   *
   * O nome e dinamico, e por isso ele chega como primeiro argumento, no mesmo
   * desenho dos pontos dinamicos de `../publicacao/transicao-de-estado.ts`:
   * `edit_post_per_page`, `edit_page_per_page`, `edit_attachment_per_page`.
   */
  readonly filtrarItensPorPaginaDoTipo?: (
    nomeDoPonto: string,
    itens: number,
  ) => number;

  /**
   * `edit_posts_per_page` — **filtro**, dois argumentos (`:1312`).
   *
   * ⚠️ **O nome engana:** ele vale para **todo** tipo, e nao so para `post` —
   * o segundo argumento existe justamente para o interceptador distinguir. O
   * docblock do legado o chama de *"when specifically listing posts"*, e o
   * codigo o aplica depois do filtro do tipo, para qualquer tipo.
   */
  readonly filtrarItensPorPagina?: (itens: number, tipo: string) => number;
}

/**
 * O contexto da submissao para revisao e da fila dela.
 *
 * Chega por **argumento**, como o de T003 e o de T005, e pela mesma razao:
 * identidade, matriz de papeis e estado de rede sao escopo de REQUISICAO
 * (`EXT-CONTEXTO`, BR-MIGRAR-105), e o cenario `@concorrencia` de `PT-002`
 * exercita exatamente isso — *"a decisao sobre o slug de cada um usa a
 * capacidade de quem o gravou"*.
 */
export interface ContextoDeRevisao extends ContextoDeGravacao {
  /**
   * As cinco leituras que `map_meta_cap()` faz do conteudo.
   *
   * E a fonte **completa** de `plataforma/autorizacao/`, e nao um recorte como
   * o de `../gravacao/permissao-do-identificador.ts`, porque esta tarefa
   * pergunta `edit_post` e `read_post` — e os dois casos leem autoria, estado,
   * memoria da lixeira e as tres paginas de funcao especial. Um recorte menor
   * aqui faria a resolucao devolver resposta diferente da do legado para pagina
   * inicial, pagina de conteudos e pagina de politica de privacidade.
   */
  readonly fonteDeConteudo: FonteDeConteudoNaAutorizacao;

  /** `wp( $query )` — ver {@link ConsultaDeConteudo}. */
  readonly consultarConteudo: ConsultaDeConteudo;

  /**
   * `sanitize_key( $post_data['post_status'] )`
   * (`wp-admin/includes/post.php:108` e `:286`).
   *
   * Chega por argumento, e **nao** e implementada nesta pasta, pelo mesmo
   * motivo e com o mesmo aviso de `sanitize_title()` em
   * `../gravacao/identificador-na-url.ts`: ela e de `plataforma/formatacao/`
   * (feature 015), e uma versao aproximada produz chave diferente para toda
   * entrada fora do alfabeto — o que mudaria **qual** estado o registro
   * reconhece.
   */
  readonly sanitizarChave: ChaveSanitizada;

  /**
   * `(int) get_user_option( $chave )` — a opcao de paginacao **daquela conta**
   * (`wp-admin/includes/post.php:1281`).
   *
   * Devolve `0` quando a opcao nao existe, que e o que a coercao do legado
   * produz para `false` e para cadeia vazia — e e por isso que a pergunta
   * seguinte e `empty( $x ) || $x < 1` e nao `=== null`.
   */
  readonly itensPorPaginaDaConta: (chave: string) => number;

  readonly ganchos?: GanchosDaRevisao;
}
