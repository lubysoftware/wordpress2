/**
 * **CA-7.1** e **CA-7.5**: o estado que a submissao grava — `pending` para quem
 * nao pode publicar, e `pending` tambem para quem pode e ainda assim pede
 * revisao.
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao` (US-7). E a
 * resolucao de estado de `_wp_translate_postdata()`
 * (`wp-admin/includes/post.php:107`-`:167`), a funcao pela qual **toda** escrita
 * de conteudo pelo painel passa antes de chegar a `wp_update_post()`.
 *
 * ---
 *
 * # O achado que T003 registrou e esta tarefa fecha
 *
 * `../publicacao/permissao-de-publicacao.ts` registrou, sem resolver, que
 * **CA-1.1 descreve uma recusa na tela que o painel do legado nao tem**: o
 * painel nao recusa a publicacao de quem nao pode publicar, ele **rebaixa o
 * estado pedido para `pending`**. O comentario e do proprio legado, e esta duas
 * linhas acima do `if` (`:148`-`:151`):
 *
 * > *Posts 'submitted for approval' are submitted to $_POST the same as if they
 * > were being published. Change status from 'publish' to 'pending' if user
 * > lacks permissions to publish or to resave published posts.*
 *
 * **O rebaixamento e esta tarefa, e e por isso que ele chega aqui e nao la.** A
 * frase do legado diz o porque: pedir publicacao e pedir revisao sao **a mesma
 * requisicao** no painel, e o que separa as duas e a capacidade de quem pediu.
 * CA-7.1 escreve a mesma regra do outro lado — *"quem tem permissao de escrever
 * e nao tem de publicar envia o conteudo para o estado pendente"*.
 *
 * ⚠️ **Portar o rebaixamento NAO resolve a divergencia de CA-1.1, e nao pode.**
 * As duas superficies continuam diferentes, como no legado: a API REST
 * **recusa** com `rest_cannot_publish` e 403
 * (`class-wp-rest-posts-controller.php:1586`), o painel **rebaixa** aqui. T003
 * porta a primeira na operacao de publicar; esta tarefa porta a segunda na
 * operacao de submeter. Nenhuma das duas escolhe qual das duas leituras do
 * criterio vale — o **P1** exige decisao humana registrada para divergir, e
 * nenhuma existe.
 *
 * ---
 *
 * # Os cinco passos, na ordem do legado, e o que cada um decide
 *
 * | # | passo | linha | aqui? |
 * |---|---|---|---|
 * | 1 | `sanitize_key()`, `auto-draft` virando `draft`, estado nao registrado sendo descartado | `:107`-`:118` | **sim** — {@link estadoSanitizadoDoPedido} |
 * | 2 | os **cinco botoes** do editor, e o ultimo tem a ultima palavra | `:121`-`:137` | **sim** — {@link estadoPedidoPelosBotoes} |
 * | 3 | `private` sem a capacidade de publicar volta ao estado anterior, ou vira `pending` | `:142`-`:144` | **sim** — {@link resolverEstadoDaSubmissao} |
 * | 4 | `publish` e `future` sem a capacidade de publicar viram `pending` | `:152`-`:159` | **sim**, e e **CA-7.1** |
 * | 5 | estado ausente conserva o anterior, com `auto-draft` virando `draft` | `:161`-`:163` | **sim** |
 *
 * E os dois campos que a **mesma** funcao resolve e que tambem vao para a
 * coluna: a senha de quem nao pode publicar (`:165`-`:167`,
 * {@link senhaNaSubmissao}) e os dois estados de comentario ausentes
 * (`:169`-`:175`, {@link estadoDeComentarioNaSubmissao}). Eles estao aqui porque
 * sao linhas desta funcao e porque a ausencia deles mudaria a linha gravada —
 * mesmo precedente da reescrita do anexo em `../gravacao/estado-na-gravacao.ts`.
 *
 * ## O que esta funcao do legado tem e NAO esta aqui
 *
 * | o que | linha | de quem |
 * |---|---|---|
 * | `sanitize_key()` | `:108` | `plataforma/formatacao/`, feature 015 — chega por {@link ChaveSanitizada} |
 * | a montagem da data a partir dos seis campos do formulario, e o `edit_date` | `:177`-`:219` | BC-10 (`painel/`): sao campos de tela. O **efeito** do `edit_date` nesta tarefa e o `$clear_date` de `wp_update_post()`, e esta em `submeter-para-revisao.ts` |
 * | `post_category` descartado sem `assign_terms` | `:221`-`:226` | BC-02 |
 * | os dois portoes de edicao e o de autoria alheia | `:33`-`:105` | **sim, mas em `permissao-de-revisao.ts`** — sao decisao de capacidade, nao de estado |
 */

import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import {
  ESTADO_EM_REVISAO,
  ESTADO_PRIVADO,
  vazioComoNoPhp,
} from '../gravacao/index.js';

/**
 * `publish` — o estado que o botao de publicar pede (`:130`).
 *
 * Nao e importado de `../publicacao/transicao-de-estado.ts` de proposito: la a
 * constante e o estado **gravado pela transicao**, e aqui ela e o estado
 * **pedido pelo formulario** — que neste caminho pode nem chegar a coluna,
 * porque e exatamente ele que o passo 4 rebaixa. Mesmo precedente de
 * `ESTADO_EM_REVISAO` em `../gravacao/permissao-do-identificador.ts`: no
 * vocabulario ha vocabulario, e aqui ha regra.
 */
const ESTADO_PUBLICADO_NA_SUBMISSAO = 'publish';

/**
 * `auto-draft` — o estado que o pedido **nunca** conserva neste caminho
 * (`:111`-`:113` e `:162`).
 *
 * As duas linhas do legado que o mencionam o trocam por `draft`, e as duas tem
 * o mesmo motivo escrito em comentario: *"No longer an auto-draft"* — abrir o
 * editor cria o registro, e **gravar** deixa de ser rascunho automatico. A
 * criacao dele e **US-11**, em T023; o que esta tarefa precisa e que ele nao
 * sobreviva a uma gravacao, que e o que estas duas linhas garantem.
 */
export const ESTADO_DE_RASCUNHO_AUTOMATICO = 'auto-draft';

/**
 * `$published_statuses = array( 'publish', 'future' )` (`:146`).
 *
 * **Agendado conta como publicado neste rebaixamento**, e isso e do legado:
 * quem nao pode publicar tambem nao pode agendar, e o pedido de agendamento cai
 * em `pending` pelo mesmo `if`. Quem pegar **T013** (US-6) encontra esta lista
 * aqui e nao escreve outra.
 *
 * ⚠️ `plataforma/autorizacao/conteudo-na-autorizacao.ts` tem uma lista gemea,
 * com os mesmos dois nomes, para a **resolucao de capacidade por estado**
 * (`capabilities.php:149`). No legado sao **dois literais em duas funcoes**, e
 * aqui sao duas constantes pela mesma razao: um unico ponto compartilhado faria
 * parecer que mudar um muda o outro, e no sistema analisado nao muda.
 */
export const ESTADOS_PUBLICADOS_NA_SUBMISSAO: readonly string[] = Object.freeze([
  'publish',
  'future',
]);

/**
 * `closed` — o valor que os dois estados de comentario recebem quando o pedido
 * nao os informa (`:170` e `:174`).
 *
 * ⚠️ **Nao e o mesmo default de `wp_insert_post()`.** La o default vem do
 * **tipo** (`get_default_comment_status()`, `:4814`), que para `post` e `open`
 * de fabrica. Aqui o painel crava `closed` antes de a gravacao ser chamada, e o
 * valor cravado vence o default do tipo porque chega como chave presente. O
 * resultado e observavel: submeter pelo painel um conteudo cujo formulario nao
 * carrega o campo de discussao **fecha os comentarios dele**.
 */
export const ESTADO_DE_COMENTARIO_NA_SUBMISSAO = 'closed';

/**
 * `sanitize_key( $post_data['post_status'] )` (`:108`).
 *
 * Chega por argumento e **nao** e implementada aqui, pelo mesmo motivo e com o
 * mesmo aviso de `sanitize_title()` em `../gravacao/identificador-na-url.ts`:
 * ela e de `plataforma/formatacao/` (feature 015), e uma versao aproximada
 * produz chave diferente para toda entrada fora do alfabeto. No legado ela
 * reduz a caixa baixa e deixa passar somente letra, digito, `_` e `-`
 * (`wp-includes/formatting.php`).
 */
export type ChaveSanitizada = (valor: string) => string;

/**
 * Os cinco botoes do editor classico, com o nome do campo de cada um
 * (`:121`-`:137`).
 *
 * **Sao campos de formulario, e estao aqui como dado e nao como tela**, porque e
 * deles que sai o estado pedido: UC-06 descreve o gatilho desta historia como
 * *"o colaborador salva o conteudo pedindo revisao"*, e no painel pedir revisao
 * e **este** campo. Os nomes nao se traduzem: eles chegam no corpo da
 * requisicao e sao superficie publicada (P8).
 *
 * O tipo de cada um e `string | undefined` porque a pergunta do legado e
 * `isset( ... ) && '' !== ...`: presente **e** nao vazio. Cadeia vazia nao
 * aciona o botao, e e assim que o navegador envia um `<input>` desabilitado.
 */
export interface BotoesDoEditor {
  /** `saveasdraft` — *"Save Draft"* (`:121`). */
  readonly salvarComoRascunho?: string;
  /** `saveasprivate` (`:124`). US-4 e T009; o campo e desta funcao. */
  readonly salvarComoPrivado?: string;
  /** `publish` — *"Publish"* (`:127`). */
  readonly publicar?: string;
  /** `advanced` (`:132`). */
  readonly avancado?: string;
  /** `pending` — *"Submit for Review"*, **o botao desta historia** (`:135`). */
  readonly submeterParaRevisao?: string;
}

/** Se o campo do botao esta presente e nao vazio — `isset( $x ) && '' !== $x`. */
function botaoAcionado(valor: string | undefined): boolean {
  return valor !== undefined && valor !== '';
}

/**
 * **Passo 1** (`:107`-`:118`): o estado do pedido, sanitizado, sem `auto-draft`
 * e sem estado que o registro nao conhece.
 *
 * Devolve o valor **como ele chegou** quando o legado nao entra no `if`, e
 * `undefined` — a chave **ausente** — quando ele a retira. Os tres caminhos:
 *
 * 1. **chave ausente**: devolve `undefined`, e isso cai no passo 5, que
 *    conserva o estado anterior;
 * 2. **chave presente e vazia** (`''` ou a cadeia `'0'`): `empty()` e verdadeiro
 *    (`:107`), logo o legado **nao entra no bloco** e a chave continua ali, com
 *    o valor vazio. Isso **nao** e a mesma coisa que ausencia, e a diferenca e
 *    observavel: a chave presente faz o passo 5 nao acontecer, e o valor vazio
 *    chega a gravacao, onde o `empty()` de `wp_insert_post()` (`:4703`) o
 *    resolve para `draft`. Mapear vazio para ausencia aqui faria um conteudo
 *    **publicado** que recebe `post_status: ''` continuar publicado, onde o
 *    legado o rebaixa para rascunho;
 * 3. **chave presente e cheia**: sanitizada, com `auto-draft` virando `draft`
 *    (`:111`-`:113`) e com o estado nao registrado sendo **retirado**
 *    (`:115`-`:116`) — este ultimo e o unico caminho em que uma chave presente
 *    vira ausencia.
 *
 * ⚠️ **A troca de `auto-draft` acontece ANTES da pergunta do registro**, e
 * `auto-draft` e registrado: invertendo as duas linhas, pedir `auto-draft`
 * conservaria o estado anterior em vez de virar rascunho.
 */
export function estadoSanitizadoDoPedido(
  estadoPedido: string | undefined,
  sanitizarChave: ChaveSanitizada,
  estadoRegistrado: (nome: string) => boolean,
): string | undefined {
  // `! empty( $post_data['post_status'] )` (`:107`), com o `empty()` do legado —
  // inclusive para a cadeia `'0'`, que este runtime considera cheia
  // (`../gravacao/verdade-de-php.ts`). Vazio **com** a chave presente devolve o
  // proprio valor: ver o caminho 2 no cabecalho desta funcao.
  if (estadoPedido === undefined) {
    return undefined;
  }
  if (vazioComoNoPhp(estadoPedido)) {
    return estadoPedido;
  }

  const estado = sanitizarChave(estadoPedido);

  // `:111`-`:113` — *"No longer an auto-draft"*.
  if (estado === ESTADO_DE_RASCUNHO_AUTOMATICO) {
    return ESTADO_PADRAO_DA_APLICACAO;
  }

  // `:115`-`:116` — `! get_post_status_object( ... )`: o estado que o registro
  // nao conhece e **descartado**, nao recusado. O legado tolera, e quem tolera
  // devolve o conteudo ao estado que ele tinha.
  return estadoRegistrado(estado) ? estado : undefined;
}

/**
 * **Passo 2** (`:121`-`:137`): o estado pedido pelos botoes, se algum foi
 * acionado.
 *
 * Os cinco `if` do legado sao **sequenciais e nao exclusivos**: cada um
 * sobrescreve o anterior, logo a ordem decide quem vence quando dois botoes
 * chegam juntos. A ordem e `saveasdraft` → `saveasprivate` → `publish` →
 * `advanced` → `pending`, e por isso:
 *
 * - **`pending` vence todos os outros**, inclusive `publish`. Submeter para
 *   revisao e, no painel, mais forte do que publicar;
 * - `advanced` vence `publish`, e as duas viram `draft`;
 * - **`publish` e o unico com uma segunda condicao**: ele nao sobrescreve
 *   `private` (`:128`). O estado comparado ali e o do **pedido**, ja sanitizado
 *   pelo passo 1 — e `saveasprivate` acabou de poder escreve-lo.
 */
export function estadoPedidoPelosBotoes(
  botoes: BotoesDoEditor | undefined,
  estadoPedido: string | undefined,
): string | undefined {
  let estado = estadoPedido;

  if (botoes === undefined) {
    return estado;
  }

  // `:121`-`:123`.
  if (botaoAcionado(botoes.salvarComoRascunho)) {
    estado = ESTADO_PADRAO_DA_APLICACAO;
  }
  // `:124`-`:126`.
  if (botaoAcionado(botoes.salvarComoPrivado)) {
    estado = ESTADO_PRIVADO;
  }
  // `:127`-`:131`: o unico com a segunda condicao.
  if (botaoAcionado(botoes.publicar) && estado !== ESTADO_PRIVADO) {
    estado = ESTADO_PUBLICADO_NA_SUBMISSAO;
  }
  // `:132`-`:134`.
  if (botaoAcionado(botoes.avancado)) {
    estado = ESTADO_PADRAO_DA_APLICACAO;
  }
  // `:135`-`:137`: **o botao desta historia**, e o ultimo da fila.
  if (botaoAcionado(botoes.submeterParaRevisao)) {
    estado = ESTADO_EM_REVISAO;
  }

  return estado;
}

/** O que os passos 3, 4 e 5 precisam saber para decidir o estado. */
export interface PedidoDoEstadoNaSubmissao {
  /** O estado pedido, **depois** dos passos 1 e 2. `undefined` e a chave ausente. */
  readonly estadoPedido: string | undefined;
  /**
   * `$previous_status` — `get_post_field( 'post_status', $post_id )` (`:140`).
   *
   * Cadeia vazia reproduz o `false` do legado para conteudo que nao existe: a
   * comparacao de `:143` e `$previous_status ? ... : 'pending'`, logo estado
   * anterior falso **vira `pending`**.
   */
  readonly estadoAnterior: string;
  /** `current_user_can( $ptype->cap->publish_posts )` (`:142` e `:154`). */
  readonly podePublicar: boolean;
  /** `current_user_can( 'edit_post', $post_id )` (`:156`) — a meta-capacidade. */
  readonly podeEditarEsteConteudo: boolean;
}

/** O estado resolvido, e se ele foi rebaixado pelo caminho. */
export interface EstadoDaSubmissao {
  /** O estado que vai para a coluna. */
  readonly estado: string;
  /**
   * Se o estado pedido foi **rebaixado** por falta da capacidade de publicar —
   * os passos 3 e 4.
   *
   * Nao e dado gravado e nao existe no legado: e leitura do que acabou de
   * acontecer, para quem chamou saber que o pedido nao foi atendido ao pe da
   * letra. Mesmo desenho de `identificadorMudouNaGravacao()` em
   * `../gravacao/gravar.ts`, e pela mesma razao (**P6**: sinalizador gravado
   * seria dado que o produto nao tem).
   */
  readonly rebaixado: boolean;
}

/**
 * **CA-7.1 e CA-7.5** — os passos 3, 4 e 5 (`:142`-`:163`).
 *
 * | pedido | quem pede | resultado | passo |
 * |---|---|---|---|
 * | `pending` | qualquer um | `pending` | nenhum: o pedido atravessa intacto |
 * | `publish` ou `future` | **sem** `publish_posts` | `pending` | 4 — **CA-7.1** |
 * | `publish` ou `future` | **com** `publish_posts` | o pedido | 4, pela condicao |
 * | `private` | **sem** `publish_posts` | o estado anterior, ou `pending` | 3 |
 * | ausente | qualquer um | o estado anterior (`auto-draft` vira `draft`) | 5 |
 *
 * ⚠️ **CA-7.5 nao se cumpre aqui, e a tabela mostra por que:** *"quem pode
 * publicar e ainda assim envia para revisao mantem o identificador escolhido"*.
 * Quem pode publicar e pede `pending` passa pelos tres passos **sem ser
 * tocado** — nenhum deles mexe em quem tem a capacidade —, e o identificador
 * dele sobrevive porque a regra que o esvazia pergunta a **mesma** capacidade,
 * em `../gravacao/permissao-do-identificador.ts` (`wp-includes/post.php:4731`).
 * As duas metades de CA-7.5 sao a mesma capacidade perguntada em dois lugares, e
 * nenhuma das duas e um `if` novo.
 *
 * ⚠️ **O ramo de dentro do passo 4 tem DUAS condicoes, e a segunda e a que
 * ninguem adivinha** (`:156`): quem nao pode publicar **conserva** `publish`
 * quando o conteudo **ja estava** publicado (ou agendado) **e** ele pode
 * edita-lo. E o caso do autor que perdeu a capacidade de publicar e continua
 * salvando o proprio texto ja publicado — o legado nao o despublica. O
 * comentario do legado nomeia esse caso: *"or to resave published posts"*.
 */
export function resolverEstadoDaSubmissao(
  pedido: PedidoDoEstadoNaSubmissao,
): EstadoDaSubmissao {
  const { estadoPedido, estadoAnterior, podePublicar } = pedido;

  // Passo 3 (`:142`-`:144`): `private` sem a capacidade volta ao estado
  // anterior, e **so** cai em `pending` quando nao ha estado anterior. A
  // visibilidade privada e US-4 (T009); este ramo esta aqui porque o destino
  // dele e o estado desta historia.
  if (estadoPedido === ESTADO_PRIVADO && !podePublicar) {
    return {
      estado: estadoAnterior === '' ? ESTADO_EM_REVISAO : estadoAnterior,
      rebaixado: true,
    };
  }

  // Passo 4 (`:152`-`:159`): **CA-7.1**.
  if (
    estadoPedido !== undefined &&
    ESTADOS_PUBLICADOS_NA_SUBMISSAO.includes(estadoPedido) &&
    !podePublicar
  ) {
    const conservaOPublicado =
      ESTADOS_PUBLICADOS_NA_SUBMISSAO.includes(estadoAnterior) &&
      pedido.podeEditarEsteConteudo;

    if (!conservaOPublicado) {
      return { estado: ESTADO_EM_REVISAO, rebaixado: true };
    }

    return { estado: estadoPedido, rebaixado: false };
  }

  // Passo 5 (`:161`-`:163`): ausencia conserva o anterior, com `auto-draft`
  // virando `draft` — a segunda das duas linhas de *"No longer an auto-draft"*.
  if (estadoPedido === undefined) {
    return {
      estado:
        estadoAnterior === ESTADO_DE_RASCUNHO_AUTOMATICO
          ? ESTADO_PADRAO_DA_APLICACAO
          : estadoAnterior,
      rebaixado: false,
    };
  }

  return { estado: estadoPedido, rebaixado: false };
}

/**
 * `unset( $post_data['post_password'] )` de quem nao pode publicar
 * (`:165`-`:167`).
 *
 * Devolve `undefined` — a chave **ausente** —, e nao cadeia vazia, porque a
 * diferenca e observavel: ausente, o valor gravado e o que a linha ja tinha,
 * depois da mistura de `wp_update_post()`; vazio, a senha seria **apagada**.
 * Quem nao pode publicar nao poe senha e tambem nao tira a que existe.
 *
 * ⚠️ A pergunta do legado e `isset()`, e nao `empty()`: pedir senha vazia
 * tambem e pedir, e tambem e descartado de quem nao pode publicar.
 */
export function senhaNaSubmissao(
  senhaPedida: string | undefined,
  podePublicar: boolean,
): string | undefined {
  if (senhaPedida === undefined) {
    return undefined;
  }
  return podePublicar ? senhaPedida : undefined;
}

/**
 * `comment_status` e `ping_status` ausentes viram `closed` (`:169`-`:175`).
 *
 * Os dois `if` do legado sao identicos e independentes, e por isso esta funcao
 * serve os dois: ela e chamada uma vez por campo. Ver
 * {@link ESTADO_DE_COMENTARIO_NA_SUBMISSAO} para a divergencia — deliberada e
 * observavel — com o default do **tipo** que `wp_insert_post()` aplicaria.
 */
export function estadoDeComentarioNaSubmissao(
  estadoPedido: string | undefined,
): string {
  return estadoPedido ?? ESTADO_DE_COMENTARIO_NA_SUBMISSAO;
}
