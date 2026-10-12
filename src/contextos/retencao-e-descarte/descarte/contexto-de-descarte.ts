/**
 * O contexto de uma operacao de descarte: o que ela recebe por argumento, e de
 * quem cada peca e.
 *
 * Entrega de **T003** da feature `005-retencao-e-descarte` (US-1). O contexto
 * chega **por argumento** e nao pela composicao do modulo por duas razoes que ja
 * valiam para T001: identidade, matriz de papeis e estado de rede sao escopo de
 * REQUISICAO (`EXT-CONTEXTO`, BR-MIGRAR-105), e as colaboracoes com BC-01 sao de
 * **ligacao tardia** (AD-10, regra de dependencia 3 de
 * `target_architecture.md`) — este contexto nao importa `contextos/conteudo/`
 * em lugar nenhum, e nao poderia.
 *
 * ── A DESCOBERTA QUE DECIDE O DESENHO DESTE ARQUIVO ─────────────────────────
 *
 * **`wp_trash_post()` nao escreve a coluna de estado: ela chama
 * `wp_update_post()`** (`wp-includes/post.php:4131`), que le a linha inteira,
 * funde o pedido por cima e **delega a `wp_insert_post()`**
 * (`:5335`, `:5367` e `:5392`). O descarte, portanto, nao e um `UPDATE` de uma
 * coluna: ele atravessa o caminho de gravacao por aplicacao inteiro, que e de
 * **BC-01** (feature `002`, `conteudo/gravacao/`). Tres consequencias
 * observaveis saem disso, e as tres sao da gravacao, nao desta operacao:
 *
 * 1. **`post_modified` e `post_modified_gmt` sao reescritos** com a hora
 *    corrente, porque `$update` e verdadeiro (`:4789`-`:4791`). Descartar
 *    "toca" o conteudo.
 * 2. **Os pontos de extensao da gravacao disparam** — `save_post`,
 *    `post_updated`, `wp_after_insert_post` e a transicao de estado para
 *    `trash` —, e extensao que escuta gravacao escuta descarte tambem (**P2**).
 * 3. **Anexo nao passa por `wp_insert_post()`**: `wp_update_post()` desvia para
 *    `wp_insert_attachment()` antes (`:5375`). Nao e caminho desta feature — a
 *    **resposta 9** de `questions.md` ja decidiu que apagar midia continua
 *    definitivo, sem lixeira e sem aviso (`MEDIA_TRASH` nasce `false`,
 *    `wp-includes/default-constants.php:135`), e REQ-051 esta `bloqueado`.
 *
 * Por isso {@link ConteudoNoDescarte.gravarEstado} e **porta para fora do
 * modulo** e nao um comando montado aqui: montar o `UPDATE` neste contexto
 * criaria um segundo dono do caminho de gravacao de `{site}posts`, perderia os
 * pontos de extensao do item 2 e deixaria `post_modified` parado — tres
 * divergencias observaveis de uma vez.
 *
 * ── O QUE CHEGA DE FORA, E POR QUE CADA UM E LIGACAO TARDIA ─────────────────
 *
 * | peca | de quem e | por que nao esta implementada aqui |
 * |---|---|---|
 * | {@link ConteudoNoDescarte} | **BC-01** | `get_post()` e `wp_update_post()`; a regra de dependencia 3 proibe o `import` |
 * | {@link ContextoDeDescarte.exclusaoDefinitiva} | **T017** (US-8) deste modulo | a primeira linha do descarte delega a `wp_delete_post( $id, true )`, com reparenteamento de filhos e anexos |
 * | {@link ContextoDeDescarte.suspenderComentarios} | **T005** (US-2) deste modulo | `wp_trash_post_comments()`, a cascata que grava o marcador agrupado |
 * | {@link ContextoDeDescarte.base} e `ator` | `plataforma/autorizacao/` | a decisao de capacidade e politica, nao entidade |
 *
 * **Os dois campos de funcao sao obrigatorios de proposito.** Opcionais, a
 * ausencia de cada um seria um passo do fluxo **silenciosamente saltado** — e o
 * passo 5 de UC-09 (*"suspende os comentarios do conteudo"*) e a primeira linha
 * de `wp_trash_post()` nao sao opcionais no legado. Obrigatorios, a composicao e
 * obrigada a dizer o que faz em cada um, e `us-1-descartar-conteudo.test.ts`
 * afirma **a posicao de cada chamada na sequencia** — que e o que a area 3 da
 * Decisao 2 de `parity_specs.md` compara (*"snapshot + sequencia de
 * comandos"*).
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { MarcadoresDeLixeiraDoConteudo } from '../armazenamento/index.js';
import type { PrazoDeRetencao } from '../configuracao/index.js';
import type { PortaDeRelogio } from '../portas/index.js';

/**
 * O conteudo como o descarte o le — **duas colunas**, e nao a linha inteira.
 *
 * `wp_trash_post()` le `$post = get_post( $post_id )` e usa dele exatamente
 * `ID` e `post_status` (`wp-includes/post.php:4089`, `:4095` e `:4099`).
 * Declarar aqui as 23 colunas de `{site}posts` seria superficie que esta
 * operacao nao consome, e a porta de dados deste modulo ja recusou o mesmo
 * excesso ao declarar so `prefixoDeTabela`.
 *
 * ⚠️ **`post_type` nao esta aqui porque `wp_trash_post()` nao o le.** Quem o le
 * sao os **outros** dois caminhos: `wp_delete_post()`, que so desvia para a
 * lixeira quando o tipo e `post` ou `page` — um tipo de terceiro pedido sem
 * forca vai **direto** para a exclusao definitiva (`:3851`-`:3856`) —, e
 * `wp_delete_attachment()`, que exige `MEDIA_TRASH` (`:6829`). Os dois sao de
 * **T017**, e o segundo e decisao humana ja tomada (resposta 9).
 */
export interface RegistroNoDescarte {
  /** `$post->ID`. */
  readonly id: number;
  /**
   * `$post->post_status` — o estado **antes** do descarte, que e o que vira
   * marcador (CA-1.1) e o que a guarda de `:4095` compara.
   */
  readonly estado: string;
}

/**
 * A colaboracao com **BC-01**: ler o conteudo e gravar o estado novo.
 *
 * E o encaixe que AD-10 chama de ligacao tardia: a implementacao vem de
 * `contextos/conteudo/`, injetada pelo contexto da operacao, e **nao** por
 * `import` no topo deste modulo. O nome dos metodos e o do legado, para que a
 * conferencia caso a caso contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116) seja
 * de uma funcao para uma funcao.
 */
export interface ConteudoNoDescarte {
  /**
   * `get_post( $post_id )` (`wp-includes/post.php:4089`), ou `null` quando a
   * linha nao existe.
   *
   * `null` e **retorno silencioso** no legado: `wp_trash_post()` devolve o
   * proprio `$post` nulo, sem erro e sem mensagem (`:4091`-`:4092`), e o **P7**
   * manda preservar o silencio.
   */
  obterPorId(conteudoId: number): RegistroNoDescarte | null;

  /**
   * `wp_update_post( array( 'ID' => $post_id, 'post_status' => 'trash' ) )`
   * (`wp-includes/post.php:4131`-`:4136`).
   *
   * Devolve o identificador do conteudo gravado, e **`0`** quando a gravacao
   * falhou — que e o que `wp_update_post()` devolve para linha inexistente
   * (`:5341`) e o que a guarda `if ( ! $post_updated )` do descarte compara
   * (`:4138`). Devolver `boolean` aqui apagaria a forma do legado; quem o le
   * aplica a verdade de PHP sobre o zero.
   *
   * ⚠️ **Nao e um `UPDATE` de uma coluna.** Ver a secao da descoberta no
   * cabecalho deste arquivo: `post_modified` e reescrito e os pontos de extensao
   * da gravacao disparam. Essa e a razao de este metodo ser porta.
   */
  gravarEstado(conteudoId: number, estado: string): number;
}

/**
 * `wp_delete_post( $post_id, true )` — a exclusao definitiva a que a **primeira
 * linha** do descarte delega quando nao ha lixeira
 * (`wp-includes/post.php:4085`-`:4086`).
 *
 * Devolve se a linha foi apagada. ⚠️ **O legado tem tres retornos aqui e as
 * superficies colapsam dois deles:** `wp_delete_post()` devolve o registro
 * apagado, `false` na falha ou `null` quando a linha nao existia, e tanto o
 * painel (`wp-admin/post.php:272`) quanto a API REST
 * (`class-wp-rest-posts-controller.php:1175`) testam `if ( ! $result )` — isto
 * e, falha e inexistencia produzem a **mesma** resposta. O booleano reproduz o
 * que o chamador consegue distinguir.
 *
 * **Quem a implementa e T017** (US-8), neste modulo: a cascata de exclusao
 * reparenteia filhos e anexos ao avo em lugar de apaga-los
 * (`wp-includes/post.php:3908`), e as versoes anteriores vao em cascata. Declarar
 * o ponto de delegacao agora, na posicao exata, e o que impede que a ordem se
 * perca depois — e **T009** (US-4) e quem acrescenta, por cima desta linha, o
 * aviso de que apagar nao tem volta (CA-4.2).
 */
export type ExclusaoDefinitivaNoDescarte = (conteudoId: number) => boolean;

/**
 * `wp_trash_post_comments( $post_id )` — o passo 5 de UC-09
 * (`wp-includes/post.php:4142`, a funcao em `:4268`).
 *
 * **Nao devolve nada aqui porque o legado ignora o retorno.**
 * `wp_trash_post_comments()` devolve `int|false|null` e a linha que a chama
 * descarta o valor: nenhum ramo do descarte depende do que aconteceu com os
 * comentarios.
 *
 * **Quem a implementa e T005** (US-2), neste modulo: ler os comentarios do
 * conteudo, gravar o estado de cada um agrupado no marcador
 * `_wp_trash_meta_comments_status` (CA-2.2, e a forma dele e de T002) e levar
 * todos a `post-trashed` em um comando (CA-2.1). Ligar a cascata e trocar este
 * campo na composicao; **a posicao da chamada nao muda**, e e ela que esta
 * afirmada por teste.
 */
export type SuspensaoDeComentariosNoDescarte = (conteudoId: number) => void;

/**
 * Os **tres** pontos de extensao de `wp_trash_post()`, com o nome, os
 * argumentos e a ordem de disparo que eles tem hoje — o que o **P2** da
 * constituicao chama de contrato publico.
 *
 * O barramento que os dispara (`plataforma/barramento/`) **nao existe nesta
 * arvore**: REQ-162 esta em `do-not-rewrite.md` e nenhuma tarefa deste pacote o
 * constroi. Ponto sem interceptador e, no legado, um no-op — logo os tres sao
 * opcionais aqui, e a **posicao** de cada um no fluxo e o que
 * `descartar-para-a-lixeira.ts` preserva.
 *
 * ⚠️ **Um dos tres devolve valor, e e o unico que pode mudar o resultado.** Dos
 * 3.373 pontos do legado, 2.374 sao filtro; aqui a conta e um filtro e duas
 * acoes.
 */
export interface GanchosDoDescarte {
  /**
   * `pre_trash_post` — **filtro**, tres argumentos, na ordem `null`,
   * `conteudo`, `estadoAnterior` (`wp-includes/post.php:4111`).
   *
   * **Qualquer valor diferente de `null` curto-circuita o descarte, e e esse
   * valor que `wp_trash_post()` devolve** (`:4113`-`:4115`). Nada e gravado:
   * nenhum marcador, nenhuma mudanca de estado, nenhuma cascata de comentario e
   * **nem o ponto de acao seguinte**. Um porte que disparasse este filtro
   * depois de gravar o marcador daria a uma extensao o poder de cancelar um
   * descarte que ja aconteceu pela metade.
   *
   * O docblock do legado declara `bool|null`, e e essa a forma aqui. O
   * argumento `null` viaja porque e o valor de partida do filtro — quem
   * intercepta decide **a partir** dele, e e a assinatura que a extensao ve.
   */
  readonly filtrarDescarte?: (
    descarte: null,
    conteudo: RegistroNoDescarte,
    estadoAnterior: string,
  ) => boolean | null;

  /**
   * `wp_trash_post` — **acao**, dois argumentos (`wp-includes/post.php:4126`).
   *
   * ⚠️ **O ponto tem o mesmo nome da funcao**, e dispara **antes** de qualquer
   * escrita: quem o escuta ve o conteudo ainda com o estado anterior e sem
   * marcador nenhum. E a ultima posicao em que uma extensao consegue ler o
   * estado do mundo antes do descarte.
   */
  readonly antesDeDescartar?: (
    conteudoId: number,
    estadoAnterior: string,
  ) => void;

  /**
   * `trashed_post` — **acao**, dois argumentos (`wp-includes/post.php:4153`).
   *
   * Dispara **depois** da cascata de comentarios, e e o ultimo passo antes do
   * retorno. Quem o escuta ve o conteudo em `trash`, com os dois marcadores
   * gravados e os comentarios ja suspensos.
   */
  readonly depoisDeDescartar?: (
    conteudoId: number,
    estadoAnterior: string,
  ) => void;
}

/** O que o descarte le e grava do armazenamento de T002. */
export interface ArmazenamentoNoDescarte {
  /**
   * Os marcadores em `{site}postmeta`.
   *
   * **So os do conteudo, e so dois dos tres.** O descarte grava o estado
   * anterior e o instante (CA-1.1); o terceiro marcador —
   * `_wp_trash_meta_comments_status` — e escrito pela cascata de **T005**, e os
   * de `{site}commentmeta` sao do comentario descartado por si, que e da
   * moderacao de BC-03. O tipo e o completo porque e o que
   * `criarArmazenamentoDeRetencao()` devolve: estreita-lo aqui obrigaria T005 a
   * alargar de volta.
   */
  readonly marcadoresDoConteudo: MarcadoresDeLixeiraDoConteudo;
}

/**
 * O contexto de uma operacao de descarte.
 *
 * {@link ContextoDeDescarte.base} e {@link ContextoDeDescarte.ator} chegam
 * separados, como em `contexto-de-publicacao.ts` de BC-01: a base e o que nao
 * muda dentro da requisicao (matriz gravada, rede, constantes, casos de
 * traducao) e o ator e quem pede o descarte. Junta-los esconderia que a
 * **mesma** base responde por atores diferentes.
 */
export interface ContextoDeDescarte {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /** Quem pede o descarte. */
  readonly ator: AtorDeAutorizacao;

  /**
   * O prazo de retencao **desta instalacao** (T001).
   *
   * Esta no contexto porque e ele que decide a primeira linha da operacao: zero
   * desliga a lixeira e o pedido de descarte passa a apagar em definitivo
   * (`R1`/BR-MIGRAR-030, `wp-includes/post.php:4085`). No legado e constante
   * redefinida antes do arranque, nao opcao e **nao** ponto de extensao — ver
   * `configuracao/prazo-de-retencao.ts`.
   */
  readonly prazoDeRetencao: PrazoDeRetencao;

  /**
   * `time()` — o instante que vai para o marcador (CA-1.1), em segundos
   * inteiros UTC.
   *
   * Chega por porta para que a borda do prazo seja conferivel com relogio
   * controlado, como o **P6** exige e como o contexto de PT-004 pede (*"um
   * oraculo ... com relogio controlavel"*).
   */
  readonly relogio: PortaDeRelogio;

  readonly armazenamento: ArmazenamentoNoDescarte;

  /** A ligacao tardia com BC-01: ler o conteudo e gravar o estado. */
  readonly conteudo: ConteudoNoDescarte;

  /** A primeira linha, quando nao ha lixeira. Ver {@link ExclusaoDefinitivaNoDescarte}. */
  readonly exclusaoDefinitiva: ExclusaoDefinitivaNoDescarte;

  /** O passo 5 de UC-09. Ver {@link SuspensaoDeComentariosNoDescarte}. */
  readonly suspenderComentarios: SuspensaoDeComentariosNoDescarte;

  readonly ganchos?: GanchosDoDescarte;
}
