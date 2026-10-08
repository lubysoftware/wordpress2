/**
 * **US-8**: revisar e publicar conteudo de outro autor preservando a autoria
 * original.
 *
 * Entrega de **T017** da feature `002-autoria-e-publicacao`. Sao **duas**
 * operacoes, e as duas sao o **mesmo** caminho do legado — `wp-admin/post.php:236`,
 * o `case 'editpost'`, que e `$post_id = edit_post();`. O que as separa e o campo
 * do formulario que decide o estado:
 *
 * | operacao | o que o editor aprertou | campo | ancora | criterios |
 * |---|---|---|---|---|
 * | {@link revisarEPublicar} | **Publish** | `publish` | `wp-admin/includes/meta-boxes.php:389` | CA-8.1, CA-8.2, CA-8.3, CA-8.5, CA-8.6 |
 * | {@link devolverAoAutor} | o seletor de estado em **Draft** | `post_status` | `wp-admin/includes/meta-boxes.php:160`-`:165` | CA-8.4 |
 *
 * ---
 *
 * # 🟢 O achado que decidiu a forma destas duas operacoes
 *
 * **O botao primario do editor e o MESMO campo para publicar e para submeter, e
 * o que separa os dois e a capacidade de quem clicou**
 * (`wp-admin/includes/meta-boxes.php:376`-`:398`):
 *
 * ```php
 * if ( ! in_array( $post->post_status, array( 'publish', 'future', 'private' ), true ) || 0 === $post_id ) {
 *     if ( $can_publish ) :
 *         ... submit_button( __( 'Publish' ), 'primary large', 'publish', false );
 *     else :
 *         ... submit_button( __( 'Submit for Review' ), 'primary large', 'publish', false );
 *     endif;
 * }
 * ```
 *
 * O **nome do campo e `publish` nos dois ramos**: muda o rotulo, nao a
 * requisicao. E e isso que o comentario de `_wp_translate_postdata()` diz do
 * outro lado — *"Posts 'submitted for approval' are submitted to `$_POST` the
 * same as if they were being published"* (`wp-admin/includes/post.php:148`).
 *
 * Consequencia direta para esta tarefa: **US-7 e US-8 nao sao duas funcoes do
 * legado, sao uma**. Por isso estas duas operacoes nao reescrevem `edit_post()`
 * — elas chamam a porta de T015 (`submeterParaRevisao`, em
 * `../revisao/submeter-para-revisao.ts`) com o campo que a tela de **quem pode
 * publicar** envia. Um segundo porte de `edit_post()` aqui seria uma segunda
 * leitura das mesmas 220 linhas, e as duas divergiriam na primeira correcao —
 * mesmo motivo pelo qual T015 nao reescreveu `wp_insert_post()` e T003 nao
 * reescreveu `wp_update_post()`.
 *
 * **O que estas operacoes acrescentam ao que elas chamam:**
 *
 * 1. **o autor que a superficie devolve** (`autoria-na-revisao.ts`) — o unico
 *    ponto em que o caminho de quem revisa o alheio difere do de quem submete o
 *    proprio, e e dele que **CA-8.2** depende;
 * 2. **a lista de capacidades que o portao comparou**
 *    (`permissao-da-revisao-editorial.ts`) — **CA-8.1**, **CA-8.5** e **CA-8.6**
 *    sao sobre a lista, nao sobre o booleano;
 * 3. **o nome e a declaracao de permissao da operacao**, que o **P4** cobra e
 *    que `plan.md` declara: *"revisar e publicar de outro autor | identificador |
 *    conteudo publicado com a autoria original preservada | sem permissao sobre
 *    conteudo de outro"*.
 *
 * ---
 *
 * # Os seis criterios, e onde cada um se cumpre
 *
 * | criterio | o que o cumpre | ancora no legado |
 * |---|---|---|
 * | **CA-8.1** *soma o alheio ao exigido pelo estado* | a traducao de `edit_post`, no ramo do alheio; legivel por {@link ResultadoDaRevisaoEditorial.capacidadesExigidas} | `wp-includes/capabilities.php:266`-`:275` |
 * | **CA-8.2** *a publicacao mantem o autor original* | `autorNaRevisaoEditorial()` mais a mistura de `wp_update_post()` | `wp-admin/includes/post.php:691`-`:695` · `wp-includes/post.php:5367` |
 * | **CA-8.3** *o identificador vazio e fixado na publicacao* | **ja estava em T007**: o estado sai de `pending` e `identificadorValido()` deriva do titulo e cobra unicidade | `wp-includes/post.php:4741`-`:4763` · `:5561` |
 * | **CA-8.4** *devolver volta para rascunho sem perder o texto* | {@link devolverAoAutor}: o estado pedido e `draft` e a mistura conserva o corpo | `wp-admin/includes/meta-boxes.php:160`-`:165` · `wp-includes/post.php:5367` |
 * | **CA-8.5** *o hierarquico resolve em familia distinta* | os **slots** do registro do tipo, sem um `if` sobre o nome `page` | `wp-includes/capabilities.php:266` · `wp-includes/post.php:1884` |
 * | **CA-8.6** *a funcao especial exige a capacidade dela* | o ramo da pagina de politica de privacidade, que **soma** `manage_privacy_options` traduzida | `wp-includes/capabilities.php:282` |
 *
 * ⚠️ **CA-8.3 nao ganha codigo novo aqui, e nao poderia** — mesmo precedente de
 * CA-7.4 em T015 e de CA-2.3 em T005. O identificador do pendente de colaborador
 * esta vazio porque T007 o esvaziou (CA-3.4), e ele e **fixado** porque o estado
 * que esta operacao grava sai da lista que dispensa unicidade: a mesma linha do
 * legado, pelo outro ramo. O que esta tarefa entrega e a **operacao que muda o
 * estado**, e o criterio esta afirmado por teste, pelo valor que foi para a
 * coluna.
 *
 * ---
 *
 * # As leituras, e a divergencia de cache que elas carregam
 *
 * | # | onde | linha | com cache do legado | sem cache (esta arvore) |
 * |---|---|---|---|---|
 * | 1 | a linha, para repor o autor e para o desfecho `inexistente` | `wp-admin/includes/post.php:689` (lote) / `:280` (um so) | consulta e popula | consulta |
 * | 2 | a lista traduzida que o portao compara, lida como **valor** | `wp-includes/capabilities.php:209` | acerta o cache | consulta |
 * | 3+ | as **seis** leituras de `edit_post()` + `wp_update_post()` + `wp_insert_post()` | ver a tabela de `../revisao/submeter-para-revisao.ts` | — | — |
 *
 * **As duas primeiras estao onde o legado as faz**, e a primeira e literalmente
 * o par `get_post()` + reposicao do autor que `bulk_edit_posts()` executa antes
 * de traduzir (`:689`-`:695`). Para a tela de **um so** conteudo o legado
 * economiza esta leitura, porque a dele serve as duas coisas (`:280`); aqui ela
 * e separada porque a operacao de T015 e dona de `edit_post()` e nao recebe a
 * linha pronta — e alargar a assinatura dela seria mexer na entrega de outra
 * tarefa.
 *
 * A divergencia **nao foi decidida aqui e nao precisa ser**: e a mesma que a
 * tabela de T015 ja declara em seis linhas — REQ-165 ficou fora do pacote e a
 * borda 5 de `target_architecture.md` manda o cache **desligado nas duas
 * metades** durante a coexistencia. Com o cache do legado ligado, as leituras 1
 * e 2 sao acerto de cache e nao comando; nenhuma das duas escreve, e nenhuma
 * decide por conta propria.
 *
 * ---
 *
 * # O que estas operacoes NAO fazem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | os oito testes de `backlog/tests.md` (UT-026-1 a UT-026-8) | **T018**, a tarefa `[P]` que roda em paralelo com esta |
 * | **avisar o autor** de que o texto foi devolvido ou publicado | **ninguem aqui.** UC-07 e literal no fluxo *Devolver ao autor*: *"Nenhuma notificacao e enviada ao autor: o sistema nao avisa"*. US-9 e **T019**, e a PARADA sobre a divergencia esta em `../portas/porta-de-email.ts` |
 * | **registrar quem revisou** | **ninguem**: REQ-028 esta em `do-not-rewrite.md`, e UC-07 confirma na pos-condicao — *"nenhum registro de quem aprovou foi gravado"* |
 * | a fila do painel de onde o editor abre o pendente (o gatilho de UC-07) | **T015**, em `../revisao/fila-de-revisao.ts` (CA-7.2) |
 * | a transicao de estado e a familia `save_post` | ninguem deste pacote emite ponto: REQ-162 esta em `do-not-rewrite.md`. Declarados em `../gravacao/gravar.ts`, com nome, argumentos e posicao |
 * | a versao anterior do texto que o editor ajustou | **T021** (US-10): e ouvinte de `post_updated`, que este caminho nao emite |
 * | a visibilidade privada, que e o outro destino do seletor de estado | **T009** (US-4) |
 * | o agendamento, que e o **mesmo** campo `publish` com outro rotulo (`meta-boxes.php:384`) | **T013** (US-6) |
 * | a sanitizacao do corpo que o editor ajustou (REQ-030) e o formato dele (REQ-032) | **ninguem** — e esta operacao nao grava corpo que o pedido nao traga |
 * | fixar e desafixar o conteudo (`sticky`), que e o unico uso de `edit_others_posts` **fora** da autorizacao (`:483`-`:489`) | BC-07 |
 * | `_edit_last`, a trava de edicao e a correcao de vinculo de anexo | BC-10 (`painel/`) e BC-04 |
 */

import type { Capacidade } from '../../../plataforma/autorizacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import type { PedidoDeGravacao } from '../gravacao/index.js';
import { ESTADO_PUBLICADO } from '../publicacao/index.js';
import {
  CODIGO_DE_CONTEUDO_INEXISTENTE,
  MENSAGEM_DE_CONTEUDO_INEXISTENTE,
  submeterParaRevisao,
  type BotoesDoEditor,
  type ContextoDeRevisao,
  type RecusaDaRevisao,
  type ResultadoDaSubmissao,
} from '../revisao/index.js';
import {
  autorNaRevisaoEditorial,
  autoriaPreservada,
} from './autoria-na-revisao.js';
import {
  autorizarRevisaoEditorial,
  capacidadesDaEdicaoDesteConteudo,
} from './permissao-da-revisao-editorial.js';

/**
 * O valor que o campo do botao primario carrega quando ele e enviado.
 *
 * `submit_button()` emite `value="Publish"` e a pergunta do legado e
 * `isset( $post_data['publish'] ) && '' !== $post_data['publish']` (`:127`) —
 * isto e, **qualquer** valor nao vazio aciona. O texto nao decide nada, e por
 * isso ele nao e o rotulo: ele e um sinalizador de presenca, e o rotulo do
 * legado depende do idioma e da capacidade de quem ve a tela
 * (`meta-boxes.php:384` contra `:389` contra `:395`).
 */
export const BOTAO_ACIONADO = '1';

/** O que aconteceu. Seis desfechos, e nenhum deles e excecao. */
export type DesfechoDaRevisaoEditorial =
  /** A coluna de estado ficou em `publish`. */
  | 'publicado'
  /** A coluna de estado ficou em `draft` — o conteudo voltou ao autor. */
  | 'devolvido'
  /**
   * A linha foi reescrita e o estado gravado nao e nenhum dos dois.
   *
   * O caso que o legado produz aqui e o **rebaixamento**: quem nao tem a
   * capacidade de publicar aquele tipo e pede publicacao grava `pending`
   * (`:152`-`:159`, CA-7.1). Nao e recusa — ver {@link ResultadoDaRevisaoEditorial.edicao}.
   */
  | 'gravado'
  /** `ID` informado e sem linha: o painel morre e a API devolve 404. */
  | 'inexistente'
  /** Sem a capacidade de editar aquele conteudo, ou de mexer no alheio. */
  | 'recusado'
  /** A gravacao recusou por conta dela — corpo vazio, data invalida. */
  | 'nao-gravado';

/** O que a operacao devolve. */
export interface ResultadoDaRevisaoEditorial {
  readonly desfecho: DesfechoDaRevisaoEditorial;
  /** A recusa, ou `null`. Preenchida nos desfechos `recusado` e `inexistente`. */
  readonly recusa: RecusaDaRevisao | null;

  /**
   * **CA-8.1, CA-8.5 e CA-8.6**: a lista de capacidades primitivas que o portao
   * comparou — `map_meta_cap( 'edit_post', $user_id, $post_id )`.
   *
   * **Na ordem do legado, e sem ordenar** (ver
   * `capacidadesDaEdicaoDesteConteudo`). Lista vazia e lista de um nome sao
   * estados legitimos: a primeira significa **permitido** (`PERM-6`), a segunda
   * e o conteudo **proprio** em estado comum.
   */
  readonly capacidadesExigidas: readonly Capacidade[];

  /** O conteudo como estava **antes** da revisao, ou `null` quando nao havia. */
  readonly anterior: Conteudo | null;

  /**
   * **CA-8.2**: o autor que foi para a coluna, ou `null` quando nada foi
   * gravado.
   */
  readonly autorGravado: number | null;
  /** **CA-8.2**: se o autor gravado e o mesmo de antes. Ver `autoriaPreservada()`. */
  readonly autoriaPreservada: boolean;

  /**
   * **CA-8.3**: o identificador na URL como ficou na coluna, ou `null` quando
   * nada foi gravado.
   *
   * Cadeia vazia e **resultado legitimo**, e nao ausencia: e o que a coluna tem
   * enquanto o conteudo nao sai dos estados que dispensam unicidade
   * (BR-MIGRAR-005).
   */
  readonly identificadorNaUrl: string | null;

  /** O estado que foi para a coluna, ou `null` quando nada foi gravado. */
  readonly estado: string | null;

  /**
   * O resultado inteiro de `edit_post()` — as 21 colunas como foram gravadas, o
   * estado pedido antes do rebaixamento e o sinalizador `rebaixado`.
   *
   * Sai no resultado, e nao fica escondido, porque e nele que mora o que esta
   * operacao **nao** decide: o rebaixamento de quem nao pode publicar (CA-7.1,
   * T015), a data reposta do rascunho e o identificador que mudou.
   */
  readonly edicao: ResultadoDaSubmissao | null;
}

/** Quem se revisa, e com que campos. */
export interface PedidoDeRevisaoEditorial {
  /**
   * `post_ID` — **a entrada do contrato de `plan.md`**: *"revisar e publicar de
   * outro autor | identificador"*.
   */
  readonly conteudoId: number;

  /**
   * Os campos que o formulario carrega — o `$_POST` do editor, menos os botoes.
   *
   * Todo campo e opcional, e a ausencia de cada um e regra: o que nao vem e o
   * que a linha gravada ja tem, pela mistura de `wp_update_post()`. O campo
   * `autorId` e o `post_author` do formulario, e e o **ramo 2** de
   * `autorNaRevisaoEditorial()`.
   */
  readonly campos?: PedidoDeGravacao;

  /**
   * `post_author_override` — o seletor de autor
   * (`wp-admin/includes/post.php:79`).
   *
   * O painel so o renderiza para quem tem `edit_others_posts`
   * (`meta-boxes.php:1678`), que e exatamente o ator desta historia. `! empty()`
   * no legado, logo `0` e ausencia.
   */
  readonly autorEscolhido?: number;

  /**
   * `edit_date` — se a data foi escolhida a mao no formulario (`:179` e `:184`).
   *
   * Tem **um** efeito neste caminho: desligar o `$clear_date` de
   * `wp_update_post()` (`:5359`). Quem resolve os seis campos de data da tela e
   * BC-10.
   */
  readonly editarData?: boolean;
}

const SEM_REVISAO = {
  recusa: null,
  capacidadesExigidas: [] as readonly Capacidade[],
  anterior: null,
  autorGravado: null,
  autoriaPreservada: false,
  identificadorNaUrl: null,
  estado: null,
  edicao: null,
} as const;

/**
 * **A operacao de US-8.** Revisa e publica o conteudo de outra pessoa,
 * preservando a autoria original.
 *
 * **Permissao exigida: a capacidade de editar AQUELE conteudo** — `edit_post`
 * com o objeto, que e **meta-capacidade** e, para o conteudo de outra pessoa,
 * resolve na **soma** de `edit_others_posts` daquele tipo com a capacidade que o
 * estado exige: `edit_published_posts` em publicado e em agendado,
 * `edit_private_posts` em privado (`wp-includes/capabilities.php:266`-`:275`,
 * **CA-8.1**). Publicar conteudo cujo autor o pedido **troca** exige, por cima,
 * a primitiva de mexer em conteudo alheio
 * (`wp-admin/includes/post.php:88`-`:105`). O erro e o que `plan.md` declara:
 * *"sem permissao sobre conteudo de outro"*.
 *
 * ⚠️ **A capacidade de publicar nao e exigida por esta operacao: ela e
 * perguntada**, como em US-7 e pela mesma linha. Um editor sem `publish_posts`
 * que aperte o botao **nao e recusado**: o estado pedido e **rebaixado** para
 * `pending` (`:152`-`:159`), o desfecho e `gravado` e `edicao.rebaixado` e
 * `true`. Transformar essa falta em recusa inventaria uma porta que o legado
 * nao tem.
 *
 * ⚠️ **Nao publica pela transicao, publica pela gravacao, e isso decide
 * CA-8.3.** O achado de T003 esta no README deste modulo: *"`wp_publish_post()`
 * nao toca `post_name`"* — logo *"o slug do rascunho muda sozinho ao publicar"*
 * acontece quando se publica **salvando**, que e este caminho, e nao quando se
 * publica pela transicao de `publicar()` (T003). Sao dois caminhos para
 * publicado, e so um deles cobra unicidade; este e o que cobra.
 */
export function revisarEPublicar(
  contexto: ContextoDeRevisao,
  pedido: PedidoDeRevisaoEditorial,
): ResultadoDaRevisaoEditorial {
  // O campo `publish` do botao primario (`meta-boxes.php:389`). O mesmo campo
  // com que o colaborador submete (`:395`) — ver o achado no cabecalho.
  return revisar(contexto, pedido, { publicar: BOTAO_ACIONADO }, undefined);
}

/**
 * **CA-8.4**: devolve o conteudo ao autor, voltando o estado para rascunho sem
 * perder o texto — o fluxo alternativo *Devolver ao autor* de UC-07.
 *
 * **Permissao exigida: a mesma de {@link revisarEPublicar}** — e o mesmo
 * `edit_post()` com o mesmo portao. O que muda e o campo que decide o estado.
 *
 * 🟢 **E o seletor de estado, e nao um botao, e a diferenca importa.** Para um
 * conteudo em `pending`, o botao de acao menor do editor nao e *"Save Draft"*: e
 * *"Save as Pending"* (`wp-admin/includes/meta-boxes.php:58`-`:59`), e ele e
 * `name="save"`, que **nao** e um dos cinco campos que
 * `_wp_translate_postdata()` le. Quem volta um pendente para rascunho e o
 * seletor de estado — `<select name="post_status">` com a opcao `draft`
 * (`:160`-`:165`) —, e ele so e renderizado para quem **pode publicar**
 * (`'publish' === $post->post_status || 'private' === ... || $can_publish`,
 * `:129`). Isto e: **devolver ao autor e privilegio de quem podia publicar**, e
 * nao ha outro caminho pelo painel. Esta operacao envia, portanto,
 * `post_status: 'draft'` e **nenhum** botao.
 *
 * ⚠️ **O texto nao se perde porque ninguem o grava**: o pedido nao traz corpo, e
 * a mistura de `wp_update_post()` conserva, chave por chave, o que a linha ja
 * tinha (`wp-includes/post.php:5367`). Quem passar `campos.corpo` aqui esta
 * ajustando o texto, que e o passo 3 de UC-07 e tambem e permitido — o criterio
 * fala do que acontece **quando nao se mexe nele**.
 *
 * ⚠️ **Nenhum aviso sai daqui.** UC-07 e literal: *"Nenhuma notificacao e
 * enviada ao autor: o sistema nao avisa"*. US-9 (T019) pede o contrario, e a
 * divergencia esta registrada, sem ser resolvida, na PARADA de
 * `../portas/porta-de-email.ts` — esta tarefa nao a resolve e nao envia.
 */
export function devolverAoAutor(
  contexto: ContextoDeRevisao,
  pedido: PedidoDeRevisaoEditorial,
): ResultadoDaRevisaoEditorial {
  return revisar(contexto, pedido, undefined, ESTADO_PADRAO_DA_APLICACAO);
}

/**
 * O corpo comum das duas operacoes: a reposicao do autor e a chamada de
 * `edit_post()`.
 *
 * `estadoPedido` entra **por cima** de `campos.estado` quando informado, porque
 * e o seletor de estado da tela e no legado ele e a mesma chave `post_status` do
 * `$_POST`: quem chama {@link devolverAoAutor} esta escolhendo o estado na tela,
 * e a tela nao envia duas vezes o mesmo campo.
 */
function revisar(
  contexto: ContextoDeRevisao,
  pedido: PedidoDeRevisaoEditorial,
  botoes: BotoesDoEditor | undefined,
  estadoPedido: string | undefined,
): ResultadoDaRevisaoEditorial {
  const campos = pedido.campos ?? {};

  // Leitura 1 (`wp-admin/includes/post.php:689`): a linha, para repor o autor —
  // e, sem ela, o desfecho silencioso do legado. Vem antes da capacidade pelo
  // mesmo motivo de T003: sem linha nao ha tipo, logo nao ha nome de capacidade
  // a perguntar.
  const anterior = contexto.armazenamento.conteudo.obterPorId(pedido.conteudoId);
  if (anterior === null) {
    return {
      desfecho: 'inexistente',
      ...SEM_REVISAO,
      recusa: {
        codigo: CODIGO_DE_CONTEUDO_INEXISTENTE,
        mensagem: MENSAGEM_DE_CONTEUDO_INEXISTENTE,
        codigoHttp: 404,
      },
    };
  }

  // Leitura 2 (`wp-includes/capabilities.php:209`): a lista traduzida, lida como
  // **valor** — CA-8.1, CA-8.5 e CA-8.6. Nao e um portao: ler a lista nao
  // decide nada, e no legado `current_user_can()` a calcula e a descarta.
  const capacidadesExigidas = capacidadesDaEdicaoDesteConteudo(
    contexto,
    pedido.conteudoId,
  );

  // O portao de `edit_post()` (`wp-admin/includes/post.php:294`-`:300`). Esta
  // aqui, e nao dentro da operacao chamada, porque e o erro que o contrato
  // desta operacao declara — e o resultado precisa carregar a lista que ele
  // comparou. A operacao chamada o faz **de novo**, na posicao dele, e as duas
  // perguntas sao as duas chamadas que o legado faz (`:294` e `:47`).
  const recusa = autorizarRevisaoEditorial(contexto, anterior);
  if (recusa !== null) {
    return {
      desfecho: 'recusado',
      ...SEM_REVISAO,
      capacidadesExigidas,
      anterior,
      recusa,
    };
  }

  // `:691`-`:695`: a reposicao do autor, antes de traduzir o pedido — **CA-8.2**.
  const autor = autorNaRevisaoEditorial(
    {
      ...(pedido.autorEscolhido === undefined
        ? {}
        : { autorEscolhido: pedido.autorEscolhido }),
      ...(campos.autorId === undefined ? {} : { autorDoPedido: campos.autorId }),
    },
    anterior,
  );

  // `wp-admin/post.php:236`: `edit_post()`, que T015 portou inteira. O pedido
  // que chega la e o `$_POST` desta tela: os campos, o autor reposto, o estado
  // do seletor e o campo do botao.
  const edicao = submeterParaRevisao(contexto, {
    conteudoId: pedido.conteudoId,
    campos: {
      ...campos,
      autorId: autor,
      ...(estadoPedido === undefined ? {} : { estado: estadoPedido }),
    },
    ...(botoes === undefined ? {} : { botoes }),
    ...(pedido.autorEscolhido === undefined
      ? {}
      : { autorEscolhido: pedido.autorEscolhido }),
    ...(pedido.editarData === undefined
      ? {}
      : { editarData: pedido.editarData }),
  });

  const colunas = edicao.gravacao?.colunas ?? null;
  if (colunas === null) {
    return {
      desfecho: desfechoSemColuna(edicao),
      ...SEM_REVISAO,
      capacidadesExigidas,
      anterior,
      recusa: edicao.recusa,
      estado: edicao.estado,
      edicao,
    };
  }

  return {
    desfecho: desfechoDoEstadoGravado(colunas.post_status),
    recusa: null,
    capacidadesExigidas,
    anterior,
    autorGravado: colunas.post_author,
    autoriaPreservada: autoriaPreservada(anterior, colunas.post_author),
    identificadorNaUrl: colunas.post_name,
    estado: colunas.post_status,
    edicao,
  };
}

/**
 * O desfecho quando `edit_post()` nao chegou a gravar coluna nenhuma.
 *
 * Os tres desfechos de T015 que nao gravam atravessam com o mesmo nome — a
 * recusa que a operacao chamada produz nao e a mesma do portao desta, porque o
 * legado tem **duas** perguntas de `edit_post` com mensagens diferentes
 * (`wp-admin/includes/post.php:294` e `:47`), e qual delas falou esta em
 * {@link ResultadoDaRevisaoEditorial.recusa}.
 *
 * `submetido` nao aparece aqui: ele e o desfecho que **tem** coluna, e por isso
 * nao alcanca esta funcao.
 */
function desfechoSemColuna(
  edicao: ResultadoDaSubmissao,
): DesfechoDaRevisaoEditorial {
  switch (edicao.desfecho) {
    case 'inexistente':
      return 'inexistente';
    case 'recusado':
      return 'recusado';
    default:
      return 'nao-gravado';
  }
}

/**
 * O desfecho lido do **estado que foi para a coluna**, e nao do que a operacao
 * pediu.
 *
 * E deliberado: o pedido de publicacao de quem nao pode publicar grava `pending`
 * (CA-7.1) e o desfecho tem de dizer isso. Quem precisa saber o que foi pedido
 * le `edicao.estadoPedido` e `edicao.rebaixado`.
 */
function desfechoDoEstadoGravado(estado: string): DesfechoDaRevisaoEditorial {
  if (estado === ESTADO_PUBLICADO) {
    return 'publicado';
  }
  if (estado === ESTADO_PADRAO_DA_APLICACAO) {
    return 'devolvido';
  }
  return 'gravado';
}
