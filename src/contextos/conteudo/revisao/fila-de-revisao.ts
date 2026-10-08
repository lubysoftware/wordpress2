/**
 * **CA-7.2**: o conteudo pendente aparece na fila de quem pode publicar aquele
 * tipo — `wp_edit_posts_query()` (`wp-admin/includes/post.php:1239`) e o portao
 * da tela que a chama (`wp-admin/edit.php:44`).
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao` (US-7). E o passo 4
 * de UC-06 — *"Sistema deixa o conteudo na lista do painel para quem tem poder
 * de publicar"* — e a pos-condicao *"o conteudo aparece na fila de revisao de
 * quem tem `publish_posts`"*.
 *
 * **O que esta aqui e `wp_edit_posts_query()` com a requisicao que a visao
 * "Pendentes" envia** — `edit.php?post_status=pending`. A mesma funcao do legado
 * serve as outras visoes da tela (Todos, Rascunhos, Lixeira), e elas sao BC-10
 * (`painel/`): o que muda entre elas e **qual estado a requisicao pede**, e
 * desse valor dependem o `perm`, a ordenacao e a ordem — as tres so existem
 * porque a requisicao pediu um estado (`:1259`, `:1268` e `:1276`). Porta-la
 * inteira aqui faria esta pasta decidir pela tela toda; porta-la para o estado
 * desta historia e o que CA-7.2 cobra.
 *
 * ---
 *
 * # A fila do legado NAO escreve consulta, e por isso esta pasta tambem nao
 *
 * `wp_edit_posts_query()` tem 93 linhas e nenhuma delas e SQL: ela monta um
 * arranjo de variaveis de consulta e chama `wp( $query )` (`:1329`). O `WHERE`
 * e o `ORDER BY` da fila sao montados por `WP_Query::get_posts()`
 * (`wp-includes/class-wp-query.php:2651`-`:2716`), que e outro modulo e e
 * **T009 da feature 004**.
 *
 * Esta pasta porta o que a funcao do painel **decide** — a capacidade da tela, o
 * estado consultado, a permissao de leitura, a ordenacao e a paginacao — e
 * entrega a consulta ao colaborador {@link ConsultaDeConteudo}, que chega por
 * argumento. Portar aqui uma segunda montagem de clausula produziria duas
 * derivacoes do mesmo `WHERE`, e a segunda divergiria da primeira: e o mesmo
 * erro que o README deste modulo descreve sobre rederivar a tabela de
 * propriedades de estado.
 *
 * ---
 *
 * # As quatro decisoes da fila, e a ordem em que o legado as toma
 *
 * | # | decisao | linha | o que ela significa |
 * |---|---|---|---|
 * | 1 | o **tipo**: o pedido, se for registrado; `post`, se nao | `:1249`-`:1253` | tipo desconhecido **nao recusa**: cai em `post` |
 * | 2 | o **estado**, e com ele `perm = 'readable'` | `:1259`-`:1262` | as duas chaves andam juntas: sem estado pedido nao ha `perm` |
 * | 3 | a **ordenacao**: `modified`, e `ASC` so em pendente | `:1266`-`:1278` | a fila de revisao e a **mais antiga primeiro** |
 * | 4 | a **paginacao**: opcao da conta, 20 de fabrica, dois filtros | `:1280`-`:1312` | ver {@link ITENS_POR_PAGINA_DA_FILA} |
 *
 * ## ⚠️ O portao da tela e `edit_posts`, e nao `publish_posts`
 *
 * CA-7.2 diz *"a fila de quem pode publicar aquele tipo"*, e e verdade que quem
 * pode publicar ve a fila — mas **nao e `publish_posts` que a tela pergunta**.
 * `edit.php:44` pergunta `$post_type_object->cap->edit_posts`, e os dois fatos
 * convivem porque todo papel de fabrica que tem `publish_posts` tem tambem
 * `edit_posts` (a matriz esta em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`: autor e
 * editor tem os dois, colaborador tem so o primeiro).
 *
 * **Trocar o portao por `publish_posts` fecharia a tela para o colaborador, que
 * no legado a abre** — e e nela que ele ve o proprio texto em revisao. O
 * criterio diz quem **ve** o pendente, nao quem **so** o ve, e o P1 manda
 * reproduzir o portao que existe.
 *
 * E ha um segundo efeito do legado que vem junto, e ele e visivel:
 * `WP_Posts_List_Table` estreita a lista para o **proprio autor** quando quem
 * olha nao tem `edit_others_posts` — mas **somente** quando a requisicao nao
 * pede estado nenhum (`wp-admin/includes/class-wp-posts-list-table.php:104`-`:110`:
 * `empty( $_REQUEST['post_status'] )`). A fila de revisao **pede** estado, logo
 * o estreitamento nao acontece nela: um colaborador que abra a fila de pendentes
 * ve os pendentes dos outros na listagem. Ler cada um deles e outra pergunta, e
 * e CA-7.6 — ver `permissao-de-revisao.ts`.
 *
 * ---
 *
 * # O que esta funcao do legado tem e NAO esta aqui
 *
 * | o que | linha | de quem |
 * |---|---|---|
 * | `$avail_post_stati = get_available_post_statuses()`, o **retorno** da funcao | `:1255` e `:1331` | e a barra de contagem por estado da tela, e sai de `wp_count_posts()` — BC-10 (`painel/`) |
 * | os filtros de mes e de categoria (`m` e `cat`) | `:1244`-`:1245` | chegam pelas variaveis de consulta da requisicao — BC-08 e BC-02 |
 * | `post__in` dos conteudos fixados (`show_sticky`) | `:1325`-`:1327` | a opcao `sticky_posts` e BC-07 |
 * | o clausulado de `WP_Query` que materializa tudo isto | `class-wp-query.php:2651` | **T009 da feature 004** |
 */

import { ESTADO_EM_REVISAO } from '../gravacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import {
  comAtor,
  perguntarPermissao,
} from '../../../plataforma/autorizacao/index.js';
import type {
  ContextoDeRevisao,
  VariaveisDaConsultaDeConteudo,
} from './contexto-de-revisao.js';

/**
 * `post` — o tipo que a fila assume quando o pedido nao informa um tipo
 * registrado (`wp-admin/includes/post.php:1252`).
 *
 * Declarado aqui, e nao importado de `../gravacao/estado-na-gravacao.ts`, porque
 * no legado sao **dois literais em duas funcoes**: o da gravacao e o default de
 * `$postarr['post_type']` (`wp-includes/post.php:4660`), o desta e o default da
 * **tela de listagem**. O valor e o mesmo e a razao nao e.
 */
export const TIPO_PADRAO_DA_FILA = 'post';

/**
 * `edit_posts` — o slot de capacidade que a **tela** da fila pergunta
 * (`wp-admin/edit.php:44`).
 *
 * E **chave de mapa**, nao nome de capacidade: o nome sai de
 * `tipo.capacidades[ CAPACIDADE_DE_EDITAR_CONTEUDOS ]`, e e por isso que a fila
 * de paginas exige `edit_pages` sem um unico `if` sobre o nome `page` — mesmo
 * mecanismo de `CAPACIDADE_DE_PUBLICAR` em
 * `../publicacao/permissao-de-publicacao.ts`.
 */
export const CAPACIDADE_DE_EDITAR_CONTEUDOS = 'edit_posts';

/**
 * `perm = 'readable'` — a permissao de leitura que a fila declara (`:1261`).
 *
 * ⚠️ **Ela so e declarada quando a requisicao pede um estado** (`:1259`), e isso
 * e o que faz a fila de revisao ser diferente da lista "Todos". Em `WP_Query` o
 * valor `readable` tem **um** efeito: estado **privado** pedido por quem nao tem
 * `read_private_posts` e estreitado ao proprio autor
 * (`class-wp-query.php:2700`-`:2706`). Para estado **protegido**, que e o caso
 * de `pending`, `readable` nao acrescenta clausula alguma — o estreitamento por
 * autoria naquele caminho e do `perm = 'editable'`, que esta fila nao usa.
 */
export const PERMISSAO_DE_LEITURA_DA_FILA = 'readable';

/** `orderby = 'modified'` — na fila de pendente e na de rascunho (`:1269`). */
export const ORDENACAO_DA_FILA_DE_REVISAO = 'modified';

/**
 * `order = 'ASC'` — **so** na fila de pendente (`:1277`).
 *
 * E o unico estado do legado com ordem ascendente por default, e isso e a fila
 * de revisao sendo uma fila: o que espera ha mais tempo aparece primeiro.
 */
export const ORDEM_DA_FILA_DE_REVISAO = 'ASC';

/**
 * `$posts_per_page = 20` — o valor de fabrica da paginacao da fila (`:1283`).
 *
 * **O unico numero desta pasta.** O **P6** cobra *"o valor de fabrica do legado
 * e o ponto de configuracao que o altera em execucao"*, e aqui sao **tres**
 * pontos, na ordem em que o legado os consulta: a opcao da conta
 * (`edit_{$tipo}_per_page`), o filtro do tipo e o filtro geral. A borda e
 * `empty( $posts_per_page ) || $posts_per_page < 1` (`:1282`) — zero e negativo
 * caem no default, `1` nao.
 */
export const ITENS_POR_PAGINA_DA_FILA = 20;

/** O prefixo e o sufixo da chave da opcao por conta (`:1280`). */
export const PREFIXO_DA_CHAVE_DE_PAGINACAO = 'edit_';
export const SUFIXO_DA_CHAVE_DE_PAGINACAO = '_per_page';

/** `edit_posts_per_page` — o nome do filtro geral de paginacao (`:1312`). */
export const PONTO_DE_ITENS_POR_PAGINA = 'edit_posts_per_page';

/*
  ── AS QUATRO VARIAVEIS QUE SO O TIPO HIERARQUICO RECEBE (`:1317`-`:1322`) ──

  A condicao e `is_post_type_hierarchical( $post_type ) && empty( $orderby )`, e
  o segundo termo importa: a fila de **revisao** declara `orderby = 'modified'`
  (`:1269`), logo ela NAO cai neste ramo nem para pagina. O ramo existe aqui
  porque e a mesma funcao, e porque quem consultar a fila sem pedir estado — a
  lista "Todos" de paginas — cai nele. A paginacao `-1` dele e do legado: a
  arvore de paginas e listada inteira, sem pagina.
*/

/** `orderby = 'menu_order title'`, em tipo hierarquico sem ordenacao pedida (`:1318`). */
export const ORDENACAO_HIERARQUICA_DA_FILA = 'menu_order title';
/** `order = 'asc'` — em **caixa baixa**, como o legado o escreve (`:1319`). */
export const ORDEM_HIERARQUICA_DA_FILA = 'asc';
/** `posts_per_page = -1` e `posts_per_archive_page = -1` (`:1320`-`:1321`). */
export const SEM_PAGINACAO_NA_FILA = -1;
/** `fields = 'id=>parent'` (`:1322`). */
export const CAMPOS_HIERARQUICOS_DA_FILA = 'id=>parent';

/** Quem se lista. */
export interface PedidoDaFilaDeRevisao {
  /**
   * `$q['post_type']` — o tipo pedido.
   *
   * Ausente, ou nao registrado, cai em {@link TIPO_PADRAO_DA_FILA}: a fila do
   * legado **nao recusa** tipo desconhecido (`:1249`-`:1253`).
   */
  readonly tipo?: string;
}

/**
 * A recusa da **tela**, na forma em que o legado a escreve.
 *
 * Nao e {@link RecusaDaRevisao} de `permissao-de-revisao.ts`, e a diferenca e
 * fidelidade e nao gosto: aquela carrega `codigo` porque as recusas dela tem um
 * — sao da API REST. Esta e um `wp_die()` do painel
 * (`wp-admin/edit.php:45`-`:49`), e um `wp_die()` tem **titulo, corpo e estado
 * HTTP**, sem codigo de erro nenhum. Inventar um codigo aqui seria inventar
 * superficie, que e o que `../publicacao/permissao-de-publicacao.ts` recusou
 * fazer para o tipo nao registrado.
 */
export interface RecusaDaFilaDeRevisao {
  /** O `<h1>` (`:46`). */
  readonly titulo: string;
  /** O `<p>` (`:47`). */
  readonly mensagem: string;
  /** O terceiro argumento de `wp_die()` (`:48`). */
  readonly codigoHttp: 403;
}

/** O que a fila devolve. */
export interface ResultadoDaFilaDeRevisao {
  /** `listado`, ou `recusado` pelo portao da tela. */
  readonly desfecho: 'listado' | 'recusado';
  /** A recusa do portao, ou `null`. */
  readonly recusa: RecusaDaFilaDeRevisao | null;
  /**
   * As variaveis entregues a consulta, ou `null` na recusa.
   *
   * Sao **parte do resultado** porque sao o que esta tarefa decide: o criterio
   * da area e *"snapshot + sequencia de comandos"*, e estas variaveis sao o que
   * determina o comando que `WP_Query` vai emitir. Afirma-las e afirmar a fila
   * sem reimplementar a consulta.
   */
  readonly variaveis: VariaveisDaConsultaDeConteudo | null;
  /** O que a consulta devolveu, na ordem em que ela devolveu. */
  readonly conteudos: readonly Conteudo[];
}

/** `<h1>` da recusa da tela (`wp-admin/edit.php:46`). */
export const TITULO_DE_RECUSA_DA_FILA = 'You need a higher level of permission.';

/** `<p>` da recusa da tela (`wp-admin/edit.php:47`, e o mesmo texto em `:22`). */
export const MENSAGEM_DE_RECUSA_DA_FILA =
  'Sorry, you are not allowed to edit posts in this post type.';

/**
 * O tipo da fila: o pedido, se registrado; `post`, se nao (`:1249`-`:1253`).
 *
 * A pergunta do legado e `in_array( $q['post_type'], get_post_types(), true )`,
 * e aqui ela e *"o registro conhece este nome"*, que e a mesma pergunta pela
 * unica porta que este modulo tem para o registro de tipos.
 */
export function tipoDaFilaDeRevisao(
  contexto: ContextoDeRevisao,
  pedido: PedidoDaFilaDeRevisao,
): string {
  const pedidoDoTipo = pedido.tipo;
  if (pedidoDoTipo === undefined) {
    return TIPO_PADRAO_DA_FILA;
  }
  return contexto.tipoDeConteudo(pedidoDoTipo) === null
    ? TIPO_PADRAO_DA_FILA
    : pedidoDoTipo;
}

/**
 * A paginacao da fila: a opcao da conta, o default de fabrica e os dois filtros
 * (`:1280`-`:1312`).
 *
 * A ordem das quatro etapas e a do legado, e ela e observavel pelo
 * interceptador: o filtro do tipo recebe o valor **ja** resolvido pelo default,
 * e o filtro geral recebe o valor **ja** filtrado pelo do tipo.
 */
export function itensPorPaginaDaFila(
  contexto: ContextoDeRevisao,
  tipo: string,
): number {
  const chave = `${PREFIXO_DA_CHAVE_DE_PAGINACAO}${tipo}${SUFIXO_DA_CHAVE_DE_PAGINACAO}`;

  // `:1281`-`:1284`: a opcao da conta, coagida a inteiro, com a borda
  // `empty( $posts_per_page ) || $posts_per_page < 1`. As duas perguntas do
  // legado coincidem depois da coercao — `empty()` de inteiro e so o zero, e o
  // zero tambem e menor que 1 —, e as duas existem la porque `get_user_option()`
  // devolve `false` ou texto antes do `(int)`. Uma comparacao so reproduz as
  // duas, e a borda esta afirmada por teste: `1` passa, `0` e negativo caem no
  // default.
  const daConta = contexto.itensPorPaginaDaConta(chave);
  let itens = daConta < 1 ? ITENS_POR_PAGINA_DA_FILA : daConta;

  // `:1302`: o filtro do tipo, com o nome dinamico.
  const doTipo = contexto.ganchos?.filtrarItensPorPaginaDoTipo;
  if (doTipo !== undefined) {
    itens = doTipo(chave, itens);
  }

  // `:1312`: o filtro geral, que recebe o tipo como segundo argumento.
  const geral = contexto.ganchos?.filtrarItensPorPagina;
  return geral === undefined ? itens : geral(itens, tipo);
}

/**
 * As variaveis de consulta da fila de revisao — o `compact()` de `:1314`, com o
 * estado desta historia.
 *
 * O ramo hierarquico de `:1317`-`:1322` **nao e alcancado por esta fila**, e a
 * razao esta no comentario das constantes dele: a condicao exige
 * `empty( $orderby )`, e a fila de pendente declara `modified`. Por isso ele
 * esta declarado e nao aplicado — ausencia marcada, como manda o README deste
 * modulo.
 */
export function variaveisDaFilaDeRevisao(
  contexto: ContextoDeRevisao,
  pedido: PedidoDaFilaDeRevisao = {},
): VariaveisDaConsultaDeConteudo {
  const tipo = tipoDaFilaDeRevisao(contexto, pedido);

  return {
    post_type: tipo,
    post_status: ESTADO_EM_REVISAO,
    perm: PERMISSAO_DE_LEITURA_DA_FILA,
    orderby: ORDENACAO_DA_FILA_DE_REVISAO,
    order: ORDEM_DA_FILA_DE_REVISAO,
    posts_per_page: itensPorPaginaDaFila(contexto, tipo),
  };
}

/**
 * **CA-7.2.** A fila de revisao daquele tipo.
 *
 * **Permissao exigida: a capacidade de editar conteudos daquele tipo**
 * (`$post_type->cap->edit_posts`), sem objeto — `wp-admin/edit.php:44`. Ver no
 * cabecalho por que ela, e nao `publish_posts`.
 *
 * Os tres passos sao os da tela, na ordem dela:
 *
 * 1. o portao de capacidade, que no legado e `wp_die( ..., 403 )` e aqui e
 *    recusa como valor;
 * 2. as variaveis de consulta (`wp_edit_posts_query()`);
 * 3. a consulta, pelo colaborador de ligacao tardia.
 *
 * ⚠️ **O portao vem antes da consulta, e isso e observavel na sequencia de
 * comandos:** quem nao passa pelo portao nao emite consulta nenhuma. No legado a
 * requisicao morre em `wp_die()` antes de `_get_list_table()` (`edit.php:52`).
 */
export function filaDeRevisao(
  contexto: ContextoDeRevisao,
  pedido: PedidoDaFilaDeRevisao = {},
): ResultadoDaFilaDeRevisao {
  const tipo = tipoDaFilaDeRevisao(contexto, pedido);
  const registro = contexto.tipoDeConteudo(tipo);
  const capacidade = registro?.capacidades[CAPACIDADE_DE_EDITAR_CONTEUDOS] ?? null;

  // Passo 1 (`edit.php:44`). Tipo sem o slot declarado fecha a porta, pela
  // mesma postura de `../publicacao/permissao-de-publicacao.ts`: ler `->cap` de
  // `false` no legado e erro fatal, e a porta fechada e o resultado que as duas
  // leituras compartilham.
  const permitido =
    capacidade !== null &&
    perguntarPermissao(comAtor(contexto.base, contexto.ator), capacidade);

  if (!permitido) {
    return {
      desfecho: 'recusado',
      recusa: {
        titulo: TITULO_DE_RECUSA_DA_FILA,
        mensagem: MENSAGEM_DE_RECUSA_DA_FILA,
        codigoHttp: 403,
      },
      variaveis: null,
      conteudos: [],
    };
  }

  // Passos 2 e 3.
  const variaveis = variaveisDaFilaDeRevisao(contexto, pedido);
  return {
    desfecho: 'listado',
    recusa: null,
    variaveis,
    conteudos: contexto.consultarConteudo(variaveis),
  };
}
