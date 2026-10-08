/**
 * O contexto de uma abertura de editor: tudo que US-11 precisa e que **nao e**
 * porta deste modulo.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11). Mesma forma
 * e mesmas razoes de `../publicacao/contexto-de-publicacao.ts` e de
 * `../gravacao/contexto-de-gravacao.ts`, e as duas valem palavra por palavra
 * aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 *   REQUISICAO, e a area 5 do critério de paridade tem tolerancia **zero**.
 *   Nesta tarefa isso pesa de um jeito proprio: dois autores que abrem o editor
 *   ao mesmo tempo tem de receber **dois** registros, cada um com a sua autoria,
 *   e e o ator deste contexto que decide a coluna `post_author` la embaixo;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** AD-08
 *   fixa portas somente nas 5 bordas; AD-10 e a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * # O que esta tarefa porta: `get_default_post_to_edit()`
 *
 * A funcao e `wp-admin/includes/post.php:758`, e ela tem **dois corpos** dentro
 * de um `if ( $create_in_db )`:
 *
 * | ramo | o que faz | desta tarefa? |
 * |---|---|---|
 * | `$create_in_db = true` | **grava** a linha em `auto-draft` (`:774`-`:800`) | **sim** — e US-11 inteira |
 * | `$create_in_db = false` | monta um objeto em memoria, com `post_status = 'draft'` e `ID = 0` (`:801`-`:821`) | **nao** — e o formulario em branco do painel, de BC-09, e nao grava nada |
 *
 * O ramo de baixo esta declarado nas duas constantes do fim deste arquivo porque
 * ele e **a outra metade da mesma funcao publica** (P8), e porque e ele que
 * explica por que CA-11.1 fala de *"conteudo novo"*: o editor abre em dois
 * modos, e so um deles reserva registro.
 *
 * ## Os quatro chamadores do ramo que grava, e o que cada um acrescenta
 *
 * | chamador | linha | o que ele faz alem de chamar |
 * |---|---|---|
 * | `wp-admin/post-new.php` | `:66` | cobra `edit_posts` **e** `create_posts` antes (`:58`) — ver `permissao-do-editor.ts` |
 * | `wp_dashboard_quick_press()` | `wp-admin/includes/dashboard.php:565` e `:571` | **reaproveita** o rascunho automatico anterior se ele ainda existir em `auto-draft`, por uma opcao de conta (`dashboard_quick_press_last_post_id`), e so cria outro quando ele sumiu |
 * | `wp_newPost` / `wp_editPost` (XML-RPC) | `class-wp-xmlrpc-server.php:1579` | cria o registro **so quando o pedido nao traz `ID`**, e logo em seguida o sobrescreve |
 * | `mw_newPost` (XML-RPC) | `class-wp-xmlrpc-server.php:5671` | idem, sempre |
 *
 * **Nenhuma dessas quatro envolturas e desta tarefa**, e a razao e a mesma para
 * as quatro: elas sao **superficie** — tela do painel e endpoint de XML-RPC —, e
 * `target_architecture.md` as poe em BC-09. O que e desta tarefa e o que as
 * quatro chamam. A regra de reaproveitamento do painel esta nomeada acima para
 * que quem construir aquela tela nao a invente diferente, e porque ela e a razao
 * pela qual *"abrir o editor"* nao e sinonimo de *"criar registro"* em toda
 * tela.
 *
 * ---
 *
 * # Por que o contexto da gravacao chega inteiro, em vez de ser rederivado
 *
 * {@link ContextoDoEditor.gravacao} e o contexto de T005, e nao uma copia dos
 * campos dele. No legado a relacao e literal: `get_default_post_to_edit()`
 * **chama `wp_insert_post()`** (`:775`), com `$wp_error = true` e
 * `$fire_after_hooks = false`. Quem reconstruisse aqui os colaboradores daquela
 * funcao — as quatro datas do site, `post_type_supports()`, o default de
 * comentario, o endereco — teria dois lugares decidindo a mesma coluna, e o
 * primeiro dia em que um dos dois mudasse produziria duas linhas diferentes para
 * a mesma abertura de editor.
 *
 * E e tambem por isso que **o ator nao se repete neste contexto**: ele ja esta
 * em {@link ContextoDeGravacao.ator}, e e de la que a decisao de capacidade
 * desta tarefa o le. Dois campos de ator no mesmo contexto seriam dois donos da
 * resposta para *"quem abriu o editor?"*.
 *
 * ---
 *
 * # O que NAO esta neste contexto, e de quem e
 *
 * 1. **O formato de conteudo.** `set_post_format( $post, get_option(
 *    'default_post_format' ) )` (`:792`) e taxonomia (`post_format`, BC-02) e
 *    suporte de tema (`current_theme_supports( 'post-formats' )`, BC-07). As
 *    tres condicoes do legado estao declaradas em `abrir-editor.ts`, na posicao
 *    exata do fluxo, e nenhuma e avaliada aqui.
 * 2. **A tela.** Os tres filtros `default_title`, `default_content` e
 *    `default_excerpt` (`:831`-`:851`) e as tres leituras de `$_REQUEST` que os
 *    alimentam (`:759`-`:771`) **nao tocam a linha gravada**: eles decidem o que
 *    o formulario mostra. Estao em {@link GanchosDoEditor} e em
 *    {@link PedidoDeAberturaDoEditor} porque sao contrato publico (P2), e a
 *    separacao entre *"o que foi gravado"* e *"o que foi devolvido"* esta
 *    afirmada por teste.
 * 3. **O cache de objeto.** `get_post()` (`:789`) acerta o cache no legado e
 *    consulta aqui — REQ-165 ficou fora do pacote, e a borda 5 de
 *    `target_architecture.md` manda o cache **desligado nas duas metades**
 *    durante a coexistencia.
 * 4. **A trava de edicao.** `wp_check_post_lock()` decide para onde o
 *    salvamento automatico escreve (CA-11.4) e e **leitura de metadado de outra
 *    tela**; ela chega em `salvamento-automatico.ts` como colaborador de
 *    ligacao tardia, e nao como campo deste contexto, porque a abertura do
 *    editor nao a consulta.
 */

import type {
  BaseDeAutorizacao,
  TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDeGravacao } from '../gravacao/index.js';
import type { PortaDeRelogio } from '../portas/index.js';

/**
 * `wp_scheduled_auto_draft_delete` — o gancho da coleta do rascunho automatico.
 *
 * E contrato publico (P2, P8): o nucleo registra `wp_delete_auto_drafts()` nele
 * (`wp-includes/default-filters.php:466`), e nenhuma extensao de terceiro
 * encontra um gancho renomeado. O nome esta tambem, **em documentacao**, no
 * cabecalho de `contextos/retencao-e-descarte/portas/porta-de-fila-agendada.ts`,
 * que e quem o **executa**; aqui ele e constante porque esta tarefa e quem o
 * **agenda**, e a letra tem de ser a mesma nos dois lados.
 */
export const GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO =
  'wp_scheduled_auto_draft_delete';

/**
 * `daily` — a recorrencia com que o gancho acima e registrado
 * (`wp-admin/includes/post.php:799`).
 *
 * Nao e numero desta tarefa e por isso nao e prazo: e o **nome** de uma das
 * quatro recorrencias de fabrica (`wp-includes/cron.php:1133`), e quanto tempo
 * `daily` vale e da feature 011, que porta a fila.
 */
export const RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO = 'daily';

/**
 * O evento recorrente que a abertura do editor pede a fila.
 *
 * Gemeo declarado de `EventoRecorrente` de BC-05, e declarado em vez de
 * importado porque a regra de dependencia 3 proibe `contextos/<a>/` importar
 * `contextos/<b>/`. Os tres campos sao os tres argumentos de
 * `wp_schedule_event( $timestamp, $recurrence, $hook )`
 * (`wp-includes/cron.php:252`), na ordem em que o legado os passa.
 */
export interface EventoRecorrenteNoEditor {
  /** O nome do gancho. Aqui, sempre {@link GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO}. */
  readonly gancho: string;
  /**
   * Instante do primeiro disparo, em segundos inteiros UTC.
   *
   * No legado e `time()`, isto e, **o instante da propria abertura do editor**
   * que registrou o evento (`:799`) — e e por isso que {@link ContextoDoEditor}
   * precisa da porta de relogio: o valor vai para a fila e e observavel.
   */
  readonly primeiroDisparoEmSegundos: number;
  /** A recorrencia. Aqui, sempre `daily`. */
  readonly recorrencia: string;
}

/**
 * O que a abertura do editor pede a fila agendada, e **nada mais**: perguntar se
 * o evento ja esta na fila, e registra-lo quando nao esta.
 *
 * As duas chamadas sao as duas linhas do legado, nesta ordem
 * (`wp-admin/includes/post.php:797`-`:800`):
 *
 * ```php
 * // Schedule auto-draft cleanup.
 * if ( ! wp_next_scheduled( 'wp_scheduled_auto_draft_delete' ) ) {
 *     wp_schedule_event( time(), 'daily', 'wp_scheduled_auto_draft_delete' );
 * }
 * ```
 *
 * **A guarda e do chamador, e e por isso que ela esta em `abrir-editor.ts` e nao
 * dentro desta porta.** No legado quem evita o evento duplicado e quem chama,
 * com o `! wp_next_scheduled( ... )`; a fila ainda recusa duplicata proxima por
 * conta dela. Fazer esta interface "consertar" isso esconderia a condicao que
 * esta tarefa reproduz — e e a mesma postura, com as mesmas palavras, de
 * `contextos/retencao-e-descarte/portas/porta-de-fila-agendada.ts`.
 *
 * ## 🔴 Esta chamada esta no meio de um conflito aberto, e T023 nao o decide
 *
 * BR-MIGRAR-034 (`R5`, ADR-0006, resposta 10 de `questions.md`) descreve o
 * legado: *"`wp_scheduled_auto_draft_delete` e registrado ao abrir a tela de
 * edicao"*, e *"um site que ninguem administra nunca agenda sua propria
 * limpeza"*. **CA-6.4 da feature 005** pede o contrario: *"o agendamento nao
 * depende de alguem ter aberto a tela de edicao"*. As duas sao decisao humana em
 * sentidos opostos, o pacote declara que **nao escolhe**, e a constituicao poe
 * esse tipo de conflito na tabela do que nao se decide sozinho.
 *
 * **T023 fica do lado que nao escolhe nada:** ela reproduz o registro que o
 * legado faz **aqui**, que e o unico ponto que esta tarefa porta. Se a decisao
 * humana mandar registrar tambem fora da tela de edicao, aquele segundo ponto
 * **se soma** a este sem contradize-lo — e e por isso que reproduzir este nao e
 * tomar partido. Quem pegar T011 ou T013 da feature 005 esbarra no conflito e
 * deve parar, nao escolher.
 */
export interface FilaNoEditor {
  /**
   * `wp_next_scheduled( $hook )` (`wp-includes/cron.php:859`) — o instante do
   * proximo disparo, ou `null` quando o gancho nao esta na fila (o `false` do
   * legado).
   */
  proximaOcorrencia(gancho: string): number | null;

  /**
   * `wp_schedule_event( $timestamp, $recurrence, $hook )`
   * (`wp-includes/cron.php:252`).
   *
   * **O retorno e `void` porque este chamador descarta o do legado.**
   * `wp_schedule_event()` devolve `false` na falha — e `wp-admin/includes/post.php:799`
   * nao o guarda, nao o testa e nao o registra. O **P7** manda preservar o modo
   * de falha *"inclusive o silencio"*, e aqui o silencio e total: a abertura do
   * editor termina igual se a fila recusou o evento. Declarar um retorno que
   * ninguem le convidaria a proxima tarefa a ramificar sobre ele, que e
   * exatamente o que o P7 proibe.
   */
  agendarRecorrente(evento: EventoRecorrenteNoEditor): void;
}

/**
 * O ramo `$create_in_db = false` de `get_default_post_to_edit()`
 * (`wp-admin/includes/post.php:801`-`:821`) — **declarado e nao portado**.
 *
 * E o objeto que a tela de listagem monta para a edicao rapida
 * (`class-wp-posts-list-table.php:1723`): um conteudo que **nao existe no
 * banco**, com `ID = 0` (`:803`) e `post_status = 'draft'` (`:810`) — e nao `auto-draft`. Os 16
 * campos, com o valor de cada um, estao no legado nas linhas citadas.
 *
 * **Por que ele esta declarado aqui em vez de simplesmente ausente:** porque sem
 * ele a leitura de CA-11.1 fica ambigua. O criterio diz *"abrir o editor de um
 * conteudo novo cria um registro em estado de rascunho automatico"*, e no legado
 * ha **duas** aberturas de editor: a que reserva registro e a que nao reserva.
 * Quem portar a tela de listagem precisa saber que aquela nao grava nada, e que
 * o `draft` que ela mostra nunca chegou a coluna nenhuma.
 *
 * Os tres filtros de {@link GanchosDoEditor} rodam nos **dois** ramos
 * (`:831`-`:851`, depois do `if`), e e so isso que os dois tem em comum.
 *
 * Os dois campos que distinguem um ramo do outro entram como constante porque
 * sao o que a tela compara: `0` e o identificador de um conteudo que nao existe,
 * e `draft` e o estado que aquele objeto carrega.
 */
export const ID_DO_EDITOR_SEM_REGISTRO = 0;

/**
 * `draft` — o estado do objeto em memoria do ramo que **nao** grava
 * (`wp-admin/includes/post.php:810`).
 *
 * ⚠️ **Nao e `auto-draft`, e a diferenca e o conteudo de US-11.** O editor que
 * nao reserva registro mostra `draft`; o que reserva grava `auto-draft`. Ler os
 * dois como a mesma coisa faz CA-11.1 passar sem que nada tenha sido gravado.
 *
 * O valor coincide com `ESTADO_PADRAO_DA_APLICACAO` de `../estado-editorial.ts`
 * e **nao** e importado dele de proposito: aqui ele e literal de um objeto de
 * tela (`$post->post_status = 'draft'`), e la e o default de uma coluna. Sao
 * duas ocorrencias independentes da mesma cadeia no legado, e amarra-las faria
 * uma mudar com a outra.
 */
export const ESTADO_DO_EDITOR_SEM_REGISTRO = 'draft';

/**
 * As tres entradas de requisicao que a abertura do editor le, e que **nao vao
 * para o banco** (`wp-admin/includes/post.php:759`-`:771`).
 *
 * O legado as le de `$_REQUEST`, passa cada uma por `esc_html( wp_unslash( ... ) )`
 * e as usa **so** como primeiro argumento dos tres filtros de
 * {@link GanchosDoEditor}, depois que a linha ja foi gravada. A linha, essa,
 * nasce com titulo `Auto Draft` (ou vazio) e corpo e resumo vazios — ver
 * `abrir-editor.ts`.
 *
 * ⚠️ **A diferenca e observavel e e facil de perder.** Um porte que levasse
 * estes tres campos ao `wp_insert_post()` gravaria corpo onde o legado grava
 * vazio, e `UT-031-5` (*"cria o registro antes de qualquer digitacao, com corpo
 * vazio"*) passaria a depender de o cliente nao mandar nada.
 *
 * 🔴 **O escape nao acontece aqui.** `esc_html()` e de `plataforma/formatacao/`
 * (feature 015) e `wp_unslash()` e identidade nesta arvore — a mesma anotacao,
 * com a mesma ancora, esta em `../gravacao/campos-na-gravacao.ts`. Os valores
 * chegam a este contexto **ja escapados** por quem montou a requisicao, e e isso
 * que o nome do campo diz.
 */
export interface PedidoDeAberturaDoEditor {
  /** `$_REQUEST['post_title']`, ja escapado. Ausente, o filtro recebe `''`. */
  readonly tituloSugerido?: string;
  /** `$_REQUEST['content']`, ja escapado. */
  readonly corpoSugerido?: string;
  /** `$_REQUEST['excerpt']`, ja escapado. */
  readonly resumoSugerido?: string;
}

/**
 * Os pontos de extensao que a abertura do editor atravessa.
 *
 * Nomeados e opcionais pela mesma razao dos seis de T005 e dos dez de T003: o
 * **P2** poe cada um no contrato publico *"com o nome, os argumentos, a ordem de
 * disparo e a capacidade de alterar o resultado que ele tem hoje"*, e o
 * barramento que os dispara (`plataforma/barramento/`) **nao existe nesta
 * arvore** — REQ-162 esta em `do-not-rewrite.md` e nenhuma tarefa deste pacote o
 * constroi. Ponto sem interceptador e, no legado, um no-op.
 *
 * **A ordem e a regra**, e ela e esta (`wp-admin/includes/post.php`):
 *
 * | # | ponto | tipo | posicao |
 * |---|---|---|---|
 * | 1 | os seis da gravacao | — | dentro de `wp_insert_post()`, `:775` |
 * | 2 | `wp_after_insert_post` | acao | `:795`, **depois** do formato de conteudo |
 * | 3 | `default_content` | filtro | `:831` |
 * | 4 | `default_title` | filtro | `:841` |
 * | 5 | `default_excerpt` | filtro | `:851` |
 *
 * ⚠️ **A posicao de `wp_after_insert_post` e deliberada no legado, e e o detalhe
 * que um porte apressado inverte.** `get_default_post_to_edit()` chama
 * `wp_insert_post( ..., $fire_after_hooks = false )` (`:782`) **para desligar** o
 * disparo automatico daquele ponto, e o dispara a mao 19 linhas depois (`:795`),
 * ja com o formato de conteudo aplicado. Quem deixasse o `true` do default veria
 * o interceptador rodar **antes** do formato — e extensao que leia o formato ali
 * leria vazio. Ver `abrir-editor.ts`, passo 5.
 *
 * ⚠️ **Os tres filtros rodam DEPOIS da gravacao e nao a alteram.** O que eles
 * mudam e o objeto devolvido a tela; a linha ja esta no banco. Ver
 * {@link PedidoDeAberturaDoEditor}.
 */
export interface GanchosDoEditor {
  /**
   * `wp_after_insert_post` — **acao**, tres argumentos
   * (`wp-admin/includes/post.php:795`).
   *
   * O legado o chama com `( $post, false, null )`: o conteudo recem-criado,
   * `$update = false` e `$post_before = null`. Os tres sao literais ali, e sao
   * literais aqui: conteudo novo nunca e atualizacao e nunca tem estado
   * anterior.
   *
   * ⚠️ E o **unico** ponto da familia `save_post` que este caminho dispara.
   * `wp_insert_post` (a acao), `save_post`, `save_post_{tipo}`, `edit_post` e a
   * transicao de estado **tambem** rodam, mas dentro de `wp_insert_post()` — e
   * nenhum deles e emitido nesta arvore, pela razao que
   * `../gravacao/gravar.ts` registra na secao *"Onde esta tarefa para"*.
   */
  readonly depoisDeInserirConteudo?: (
    conteudoId: number,
    atualizacao: boolean,
    conteudoAnteriorId: null,
  ) => void;

  /**
   * `default_content` — **filtro**, dois argumentos (`:831`).
   *
   * Recebe o corpo sugerido pela requisicao (nao o gravado) e o conteudo. O
   * legado coage o retorno para cadeia com `(string)`, e a coercao esta
   * reproduzida em `abrir-editor.ts` em vez de escondida: um filtro que devolva
   * `null` produz `''`, e um que devolva `0` produz `'0'`.
   */
  readonly filtrarCorpoPadrao?: (corpo: string, conteudoId: number) => unknown;

  /** `default_title` — **filtro**, dois argumentos (`:841`). Mesma coercao. */
  readonly filtrarTituloPadrao?: (titulo: string, conteudoId: number) => unknown;

  /** `default_excerpt` — **filtro**, dois argumentos (`:851`). Mesma coercao. */
  readonly filtrarResumoPadrao?: (resumo: string, conteudoId: number) => unknown;
}

/**
 * O contexto de uma abertura de editor.
 *
 * {@link ContextoDoEditor.base} e o que nao muda dentro da requisicao (matriz
 * gravada, rede, constantes, casos de traducao); quem abre o editor chega em
 * {@link ContextoDeGravacao.ator}, dentro de {@link ContextoDoEditor.gravacao},
 * e nao se repete aqui — ver a secao *"Por que o contexto da gravacao chega
 * inteiro"* no cabecalho deste arquivo.
 */
export interface ContextoDoEditor {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;

  /**
   * O contexto de T005, inteiro — porque o legado **chama** `wp_insert_post()`
   * daqui (`wp-admin/includes/post.php:774`).
   *
   * E dele que saem o ator, o armazenamento, as quatro datas do site,
   * `post_type_supports()`, o default de comentario do tipo e o endereco do
   * conteudo. Nenhum deles e redeclarado neste contexto.
   */
  readonly gravacao: ContextoDeGravacao;

  /**
   * `get_post_type_object( $nome )`, ou `null` quando o tipo nao esta
   * registrado.
   *
   * `null` nao e caminho raro: e um dos tres ramos de erro de `PERM-4`
   * (BR-MIGRAR-090), e o que esta operacao faz com ele esta em
   * `permissao-do-editor.ts`.
   */
  readonly tipoDeConteudo: (nome: string) => TipoDeConteudoNaAutorizacao | null;

  /**
   * `time()` — o instante que vai para a fila como primeiro disparo da coleta
   * (`wp-admin/includes/post.php:799`).
   *
   * E a porta de relogio do modulo, declarada em T001 e usada aqui pela primeira
   * vez neste contexto. Segundos inteiros UTC, a unidade de `time()`.
   */
  readonly relogio: PortaDeRelogio;

  readonly fila: FilaNoEditor;

  readonly ganchos?: GanchosDoEditor;
}
