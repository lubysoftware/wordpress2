/**
 * **CA-1.4**: *"a solicitacao aparece na lista aguardando o titular, com o
 * estado visivel"*.
 *
 * Entrega de **T003** da feature `008-privacidade-e-dados-pessoais` (US-1). E
 * `WP_Privacy_Requests_Table::prepare_items()`
 * (`wp-admin/includes/class-wp-privacy-requests-table.php:367`-`:412`) mais o
 * **dado** da coluna de estado (`:441`-`:468`), e e o passo 6 de UC-25 —
 * *"Sistema mostra a solicitacao na lista, aguardando o titular"*.
 *
 * ---
 *
 * # A lista NAO monta HTML, e o que ela devolve e dado
 *
 * `column_status()` do legado **escreve** na saida (`echo`), e o que ele escreve
 * sao tres coisas: o nome do estado na classe CSS (`:460`), o rotulo traduzido
 * (`:461`) e, **so** em dois dos quatro estados, uma data (`:463`-`:464`). O que
 * esta pasta porta e a decisao — qual estado, e qual instante —, nao a marcacao.
 *
 * ⚠️ **O rotulo nao esta aqui, e e a mesma ausencia que BC-01 declarou.** Ele
 * sai de `get_post_status_object( $status )->label`, isto e, do **registro de
 * estados**, com contexto de gettext proprio — `_x( 'Pending', 'request status' )`
 * (`wp-includes/post.php:770`), que existe justamente porque `pending` e
 * `request-pending` colidem em ingles. T002 registrou isso em
 * `../armazenamento/estados-da-solicitacao.ts` (*"O que nao esta aqui"*), e a
 * razao continua: a traducao e de `plataforma/traducao/`, que por AD-08 nao ganha
 * porta. {@link EstadoVisivelNaLista} carrega o **nome** do estado, que e o que a
 * borda usa para resolver rotulo e classe.
 *
 * ⚠️ **E com ele fica de fora o ramo do `'-'`** (`:445`-`:446`): quando o estado
 * da linha nao esta registrado, ou tem rotulo vazio, a coluna imprime um traco e
 * **nao** o nome do estado. A pergunta e sobre o registro de estados — que tem
 * os 12 de fabrica mais o que uma extensao registrou, e nao so os quatro desta
 * feature —, logo ela nao e respondivel neste contexto. Fica declarada: quem
 * montar a borda resolve `get_post_status_object()` e aplica o traco.
 *
 * ---
 *
 * # ⚠️ Esta e a UNICA parte de T003 que emite comando pela porta deste modulo
 *
 * A abertura nao emite nenhum (ver `./contexto-de-abertura.ts`); a lista emite
 * **um por linha**, e isso e do legado: `prepare_items()` consulta por
 * `WP_Query` e depois chama `wp_get_user_request( $request->ID )` para cada
 * identificador (`:401`), que e `get_post()` mais `get_post_meta()`.
 *
 * Com o cache de objeto ligado a segunda leitura acerta o cache e comando nenhum
 * sai; **sem cache, que e o estado desta arvore, sai um `SELECT` por linha**.
 * Isso **nao** foi decidido aqui: e a mesma divergencia que
 * `contextos/conteudo/versoes/leitura-de-versoes.ts` declara com todas as
 * palavras — REQ-165 ficou fora do pacote e a borda 5 de
 * `target_architecture.md` manda o cache **desligado nas duas metades** durante a
 * coexistencia, que e como a comparacao de paridade roda. A leitura fica no
 * **mesmo ponto** do legado, para que o cache, quando existir, entre na frente
 * dela sem mudar o que ela devolve.
 *
 * ---
 *
 * # O que esta tela do legado tem e NAO esta aqui
 *
 * | o que | ancora | de quem e |
 * |---|---|---|
 * | `_wp_personal_data_cleanup_requests()`, que roda **antes** da lista e expira as pendentes | `wp-admin/export-personal-data.php:73` | **T009** (US-4). ⚠️ A ordem importa: no legado a lista nunca mostra uma pendente vencida, porque a limpeza passou primeiro |
 * | a barra de contagem por estado (`get_views`) e o `SELECT post_status, COUNT(*)` dela | `class-wp-privacy-requests-table.php:109`-`:212` | e contagem de painel, e depende do rotulo plural (`label_count`) — BC-07 / BC-10 |
 * | as acoes em lote, inclusive o reenvio | `:214`-`:360` | **T007** (US-3) para o reenvio; o resto e painel |
 * | as colunas de e-mail, de data e de proximos passos | `:422`, `:541`, `:553`, `:564` | apresentacao: formato de data e endereco de tela sao da borda |
 * | o instante da **ultima alteracao** na lista | — | **CA-3.4**, que e **T007**. O que CA-1.4 pede e o estado visivel, e o instante que o legado mostra na coluna de estado e outro — ver {@link EstadoVisivelNaLista.instante} |
 */

import {
  ESTADO_CONCLUIDO,
  ESTADO_CONFIRMADO,
  TIPO_DE_SOLICITACAO,
  type SolicitacaoDeDadoPessoal,
} from '../armazenamento/index.js';
import type {
  ContextoDeAbertura,
  VariaveisDaConsultaDeSolicitacoes,
} from './contexto-de-abertura.js';

/**
 * `20` — os itens por pagina de fabrica.
 *
 * **O unico numero desta pasta**, e o P6 cobra *"o valor de fabrica do legado e
 * o ponto de configuracao que o altera em execucao"*. Sao **dois** pontos, nesta
 * ordem: a opcao por conta (`get_user_option`, `class-wp-list-table.php:991`) e
 * o filtro dinamico com o nome da opcao (`:1020`). O default aparece duas vezes
 * na arvore, e nas duas com o mesmo valor: o parametro de
 * `get_items_per_page( $option, $default_value = 20 )` (`:990`) e a opcao de
 * tela que a pagina registra (`wp-admin/export-personal-data.php:80`).
 *
 * A borda e `empty( $per_page ) || $per_page < 1` (`:992`): **zero e negativo
 * caem no default, `1` nao**. E a mesma borda de `ITENS_POR_PAGINA_DA_FILA` em
 * BC-01, e a suite afirma os dois lados dela.
 */
export const ITENS_POR_PAGINA_DA_LISTA = 20;

/**
 * O sufixo da chave da opcao por conta: `{acao}_requests_per_page`
 * (`class-wp-privacy-requests-table.php:369`).
 *
 * Isto e, `export_personal_data_requests_per_page` e
 * `remove_personal_data_requests_per_page` — e sao os **mesmos** nomes que as
 * duas telas registram em `add_screen_option()`
 * (`wp-admin/export-personal-data.php:81`), o que faz da chave superficie
 * publicada (P8).
 */
export const SUFIXO_DA_CHAVE_DE_PAGINACAO = '_requests_per_page';

/**
 * O nome do ponto de extensao que altera a paginacao: **o proprio nome da
 * opcao** (`class-wp-list-table.php:1020`, `apply_filters( "{$option}",
 * $per_page )`).
 *
 * Declarado e **nao emitido**: o barramento de hooks e `REQ-162`, que esta em
 * `do-not-rewrite.md` — escopo recusado. O que o P2 exige, e o que esta aqui, e
 * que o ponto exista declarado com nome e argumentos no arquivo que o emitiria.
 */
export function pontoDeItensPorPagina(acao: string): string {
  return `${acao}${SUFIXO_DA_CHAVE_DE_PAGINACAO}`;
}

/**
 * `'any'` — o estado que a lista pede quando ninguem filtrou (`:375`).
 *
 * ⚠️ `any` **nao** e "todos": em `WP_Query` ele exclui os estados registrados com
 * `exclude_from_search => true`. Os quatro desta feature declaram
 * `exclude_from_search => false` explicitamente (ver
 * `../armazenamento/estados-da-solicitacao.ts`), e e **por isso** que os quatro
 * aparecem na lista. Um porte que reproduzisse `true` ali, por achar que estado
 * interno deveria ser excluido, **esvaziaria esta tela**.
 */
export const ESTADO_QUALQUER_NA_LISTA = 'any';

/**
 * O mapa de ordenacao da tela: o que a requisicao pede, e a coluna que a
 * consulta recebe (`:379`-`:382`).
 *
 * ⚠️ **Valor fora do mapa nao recusa e nao ordena**: o legado so acrescenta
 * `orderby` quando a chave existe (`isset( $orderby_mapping[ ... ] )`, `:384`),
 * e sem ela `WP_Query` usa o default dele. Recusar aqui inventaria erro.
 */
export const ORDENACAO_DA_LISTA: Readonly<Record<string, string>> =
  Object.freeze({
    requester: 'post_title',
    requested: 'post_date',
  });

/** As duas ordens aceitas, **em caixa alta**, depois do `strtoupper` (`:388`). */
export const ORDENS_DA_LISTA: readonly string[] = Object.freeze(['ASC', 'DESC']);

/**
 * O estado como a coluna de estado o mostra — a decisao de `column_status()`
 * (`class-wp-privacy-requests-table.php:441`-`:468`), sem a marcacao.
 */
export interface EstadoVisivelNaLista {
  /**
   * `get_post_status( $item->ID )` — o nome do estado, que e o que vai para a
   * classe CSS (`:460`) e de onde a borda resolve o rotulo. Ver o cabecalho
   * sobre por que o rotulo nao esta aqui.
   */
  readonly estado: string;
  /**
   * `$timestamp` (`:449`-`:458`): o instante de **confirmacao** no estado
   * confirmado, o de **conclusao** no concluido, e `false` nos outros dois.
   *
   * ⚠️ **`false`, e nao `0`.** O legado inicia a variavel com `false` e so a
   * imprime quando ela e verdadeira (`if ( $timestamp )`, `:463`) — e como os
   * dois metadados chegam como `(int)`, o instante `0` **tambem** nao e impresso.
   * Os dois casos sao indistinguiveis na tela, e e por isso que a forma aqui e
   * `number | false`: quem recebe `0` nao sabe se o metadado faltava, e o legado
   * tambem nao (ver `../armazenamento/solicitacao.ts`).
   *
   * ⚠️ **Nao e o instante da ultima alteracao.** Pendente e falha nao mostram
   * data nenhuma nesta coluna, e CA-3.4 — *"o estado de cada solicitacao e
   * visivel na lista, com o instante da ultima alteracao"* — pede algo que esta
   * coluna nao da. E de **T007** resolver de onde aquele instante sai; aqui fica
   * registrado que `prepare_items()` nao o traz.
   */
  readonly instante: number | false;
}

/** Uma linha da lista: a solicitacao, e o estado como a coluna o mostra. */
export interface ItemDaListaDeSolicitacoes {
  readonly solicitacao: SolicitacaoDeDadoPessoal;
  readonly estadoVisivel: EstadoVisivelNaLista;
}

/** O que a tela informa para montar a lista. Todos os campos sao `$_REQUEST`. */
export interface PedidoDaListaDeSolicitacoes {
  /**
   * `$this->request_type` — a acao, que a subclasse fixa
   * (`class-wp-privacy-data-export-requests-list-table.php:27` e
   * `class-wp-privacy-data-removal-requests-list-table.php:27`).
   *
   * Cada tela lista **uma** acao, e e isso que faz as duas listas serem duas.
   */
  readonly acao: string;
  /** `$_REQUEST['paged']` (`:374`). Ausente, a consulta nao salta nada. */
  readonly pagina?: number;
  /** `$_REQUEST['s']` (`:376`). */
  readonly busca?: string;
  /** `$_REQUEST['orderby']` — uma chave de {@link ORDENACAO_DA_LISTA} (`:384`). */
  readonly ordenarPor?: string;
  /** `$_REQUEST['order']` — `asc` ou `desc` em qualquer caixa (`:388`). */
  readonly ordem?: string;
  /** `$_REQUEST['filter-status']` (`:392`-`:395`). */
  readonly filtroDeEstado?: string;
}

/** O que a lista devolve. */
export interface ResultadoDaListaDeSolicitacoes {
  /**
   * As variaveis entregues a consulta.
   *
   * Sao **parte do resultado** porque sao o que esta tarefa decide: o criterio
   * da area e *"snapshot + sequencia de comandos"*, e estas variaveis
   * determinam o comando que `WP_Query` vai emitir. Afirma-las e afirmar a lista
   * sem reimplementar a consulta — mesmo desenho de
   * `ResultadoDaFilaDeRevisao.variaveis` em BC-01.
   */
  readonly variaveis: VariaveisDaConsultaDeSolicitacoes;
  /**
   * `$this->items`, depois do `array_filter` (`:404`).
   *
   * ⚠️ O `array_filter` **descarta** a linha que `wp_get_user_request()`
   * recusou — isto e, a que nao e do tipo `user_request`. Um identificador pode
   * sair da consulta e nao chegar aqui, e o total de itens **nao** e corrigido
   * por isso: `found_posts` continua contando a linha descartada (`:408`). Nao e
   * defeito a consertar; e o que a tela mostra.
   */
  readonly itens: readonly ItemDaListaDeSolicitacoes[];
  /** `$posts_per_page`, depois da opcao e do default. */
  readonly itensPorPagina: number;
  /** `'total_items' => $requests_query->found_posts` (`:408`). */
  readonly totalDeItens: number;
}

/**
 * `get_items_per_page( $this->request_type . '_requests_per_page' )`
 * (`class-wp-privacy-requests-table.php:369`, com
 * `class-wp-list-table.php:990`-`:1020`).
 *
 * A opcao por conta, o default de fabrica e a borda. O filtro dinamico fica
 * declarado em {@link pontoDeItensPorPagina} e **nao** e emitido (REQ-162).
 */
export function itensPorPaginaDaLista(contexto: ContextoDeAbertura): number {
  const daConta = contexto.itensPorPaginaDaConta;
  // `(int) get_user_option( $option )` seguido de
  // `empty( $per_page ) || $per_page < 1` (`:991` e `:992`): ausencia, zero e
  // negativo caem no default; `1` passa.
  if (daConta === undefined || daConta < 1) {
    return ITENS_POR_PAGINA_DA_LISTA;
  }
  return Math.trunc(daConta);
}

/**
 * `$timestamp` da coluna de estado (`class-wp-privacy-requests-table.php:449`-`:458`).
 *
 * O `switch` tem **dois** casos e nenhum `default`, e e por isso que pendente e
 * falha ficam com `false`.
 */
export function estadoVisivelNaLista(
  solicitacao: SolicitacaoDeDadoPessoal,
): EstadoVisivelNaLista {
  switch (solicitacao.estado) {
    case ESTADO_CONFIRMADO:
      return {
        estado: solicitacao.estado,
        instante: solicitacao.confirmadaEm === 0 ? false : solicitacao.confirmadaEm,
      };
    case ESTADO_CONCLUIDO:
      return {
        estado: solicitacao.estado,
        instante: solicitacao.concluidaEm === 0 ? false : solicitacao.concluidaEm,
      };
    default:
      return { estado: solicitacao.estado, instante: false };
  }
}

/**
 * **CA-1.4.** `prepare_items()`: as variaveis, a consulta, uma leitura por
 * linha e o total.
 *
 * **Nao verifica capacidade, e isso e declaracao explicita** (P4): no legado o
 * portao e a primeira linha da tela que **ja** passou — `:12` de
 * `export-personal-data.php` — e `prepare_items()` nao pergunta nada. Quem
 * expuser esta lista fora daquelas duas telas declara a permissao dela; a
 * decisao esta pronta em `./permissao-de-abertura.ts`.
 */
export function listarSolicitacoes(
  contexto: ContextoDeAbertura,
  pedido: PedidoDaListaDeSolicitacoes,
): ResultadoDaListaDeSolicitacoes {
  const itensPorPagina = itensPorPaginaDaLista(contexto);

  /*
    `isset( $_REQUEST['paged'] ) ? max( 0, absint( $_REQUEST['paged'] ) - 1 ) *
    $posts_per_page : 0` (`:374`). `absint` e `abs( (int) $v )`, logo pagina
    negativa vira positiva; e `max( 0, ... )` faz a pagina 0 e a pagina 1 cairem
    no mesmo salto nenhum.
  */
  const paginaPedida = pedido.pagina;
  const offset =
    paginaPedida === undefined
      ? 0
      : Math.max(0, Math.abs(Math.trunc(paginaPedida)) - 1) * itensPorPagina;

  // `$args['orderby']` so entra quando a chave existe no mapa (`:384`).
  const colunaDeOrdenacao =
    pedido.ordenarPor === undefined
      ? undefined
      : ORDENACAO_DA_LISTA[pedido.ordenarPor];

  // `strtoupper( $_REQUEST['order'] )` conferido contra as duas (`:388`).
  const ordemPedida =
    pedido.ordem === undefined ? undefined : pedido.ordem.toUpperCase();
  const ordem =
    ordemPedida !== undefined && ORDENS_DA_LISTA.includes(ordemPedida)
      ? ordemPedida
      : undefined;

  /*
    `! empty( $_REQUEST['filter-status'] )` (`:392`): a cadeia vazia e a
    ausencia caem no mesmo lugar, e o estado continua `any`. O legado sobrescreve
    `$args['post_status']` DEPOIS de `orderby` e `order`, e a ordem das chaves do
    arranjo nao e observavel — o valor final e.
  */
  const filtroDeEstado = pedido.filtroDeEstado ?? '';
  const estadoConsultado =
    filtroDeEstado === '' ? ESTADO_QUALQUER_NA_LISTA : filtroDeEstado;

  const variaveis: VariaveisDaConsultaDeSolicitacoes = {
    post_type: TIPO_DE_SOLICITACAO,
    // `post_name__in => array( $this->request_type )` (`:372`).
    post_name__in: [pedido.acao],
    post_status: estadoConsultado,
    posts_per_page: itensPorPagina,
    offset,
    // `s` esta SEMPRE no arranjo, com cadeia vazia quando ninguem buscou
    // (`:376`) — e a cadeia vazia nao e o mesmo que a chave ausente para
    // `WP_Query`.
    s: pedido.busca ?? '',
    ...(colunaDeOrdenacao === undefined ? {} : { orderby: colunaDeOrdenacao }),
    ...(ordem === undefined ? {} : { order: ordem }),
  };

  const consultadas = contexto.consultarSolicitacoes(variaveis);

  /*
    `foreach ( $requests as $request ) { $this->items[] = wp_get_user_request(
     $request->ID ); }` e `array_filter` depois (`:400`-`:404`). Uma leitura por
    linha — ver o cabecalho sobre o cache desligado.
  */
  const itens: ItemDaListaDeSolicitacoes[] = [];
  for (const id of consultadas.ids) {
    const solicitacao = contexto.armazenamento.solicitacoes.obterPorId(id);
    if (solicitacao === null) {
      continue;
    }
    itens.push({
      solicitacao,
      estadoVisivel: estadoVisivelNaLista(solicitacao),
    });
  }

  return {
    variaveis,
    itens,
    itensPorPagina,
    totalDeItens: consultadas.totalEncontrado,
  };
}
