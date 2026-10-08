/**
 * A transicao de estado editorial — `wp_transition_post_status()`
 * (`wp-includes/post.php:5912`) e o ouvinte que o **proprio nucleo** registra
 * nela, `_transition_post_status()` (`:8154`).
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao` (US-1). E a metade
 * de **CA-1.2** que nao e o `UPDATE` (*"dispara a transicao de estado uma unica
 * vez"*), e e tambem onde **CA-1.3** e **CA-1.5** se cumprem — as duas por
 * consequencia da transicao, e nao por codigo proprio da publicacao:
 *
 * | criterio | o que o faz | linha do legado |
 * |---|---|---|
 * | CA-1.3, *"endereco definitivo"* | o `guid` vazio e reposto com `get_permalink()` ao entrar em publicado | `:8159`-`:8160` |
 * | CA-1.5, *"evento agendado pendente e removido"* | `wp_clear_scheduled_hook( 'publish_future_post', array( $post->ID ) )` | `:8189` |
 *
 * **Isso nao e detalhe de arrumacao: e o motivo de os dois criterios existirem
 * em US-1.** Nenhum dos dois esta escrito em `wp_publish_post()`. Os dois estao
 * em um ouvinte registrado com prioridade 5 no ponto `transition_post_status`
 * (`wp-includes/default-filters.php:448`), logo um porte que implementasse
 * `wp_publish_post()` "direto no banco" perderia os dois **em silencio** — e o
 * comentario do legado na ultima linha explica por que o terceiro e
 * incondicional: *"Always clears the hook in case the post status bounced from
 * future to draft."*
 *
 * ---
 *
 * # A ordem, que e a regra
 *
 * `wp_transition_post_status()` dispara **tres** pontos, nesta ordem
 * (`:5921`, `:5938`, `:5975`):
 *
 * | # | ponto | argumentos |
 * |---|---|---|
 * | 1 | `transition_post_status` | `$new_status`, `$old_status`, `$post` |
 * | 2 | `{$old_status}_to_{$new_status}` | `$post` |
 * | 3 | `{$new_status}_{$post->post_type}` | `$post->ID`, `$post`, `$old_status` |
 *
 * E o ponto 1 **nao e uma chamada: e uma cadeia ordenada por prioridade
 * inteira**. Os ouvintes de fabrica, lidos de `default-filters.php`:
 *
 * | prioridade | ouvinte | dono | esta tarefa |
 * |---|---|---|---|
 * | 5 | `_transition_post_status` | BC-01, conteudo | **implementado aqui** |
 * | 10 | `_update_term_count_on_transition_post_status` (`:449`) | BC-02, classificacao | declarado abaixo |
 * | 10 | `_wp_auto_add_pages_to_menu` (`:474`) | BC-07, apresentacao | declarado abaixo |
 * | 10 | `_wp_customize_publish_changeset` (`:570`) | BC-07, customizador | declarado abaixo |
 * | 10 | `__clear_multi_author_cache` (`:588`) | cache de autor, BC-07 | declarado abaixo |
 * | 20 | `_wp_keep_alive_customize_changeset_dependent_auto_drafts` (`:573`) | BC-07, customizador | declarado abaixo |
 *
 * **O numero 5 e parte do contrato**, pelo mesmo argumento que
 * `plataforma/autorizacao/concessao-por-extensao.ts` usa para a prioridade `1`:
 * `add_action` sem prioridade entra em 10, logo o ouvinte do nucleo roda
 * **antes** de todo interceptador de terceiro, e um interceptador que rodasse
 * primeiro veria um `guid` ainda vazio e um evento agendado ainda na fila. Sem
 * barramento nesta arvore (REQ-162 esta em `do-not-rewrite.md`), a prioridade e
 * cumprida pela **posicao** em {@link transitarEstado}, e o numero fica
 * declarado em {@link PRIORIDADE_DO_OUVINTE_DO_NUCLEO} para quem construir o
 * barramento registrar este ouvinte no lugar certo.
 *
 * ---
 *
 * # Os outros ouvintes de fabrica, nomeados e nao implementados
 *
 * Cada um e **ponto de extensao do produto** (P2) e cada um tem dono fora desta
 * feature. Ficam nomeados porque quem os construir precisa saber que eles
 * pendem **deste** ponto, nesta prioridade — e porque a omissao, nao declarada,
 * seria indistinguivel de esquecimento:
 *
 * - **`_update_term_count_on_transition_post_status`** (`:8445`) recalcula
 *   `term_taxonomy.count` das taxonomias do conteudo, com **dois
 *   curto-circuitos** que um porte apressado perde: nao recalcula quando nenhum
 *   dos dois estados conta (`draft` para `pending`) **nem** quando os dois
 *   contam, e a lista de estados contados e o filtro
 *   `update_post_term_count_statuses`, de fabrica `array( 'publish' )`. E BC-02,
 *   e `DB-TRG3` (BR-MIGRAR-079) registra que *"a mesma coluna
 *   `term_taxonomy.count` tem pelo menos duas definicoes de quantos"*.
 * - **`_wp_auto_add_pages_to_menu`** acrescenta pagina nova a menu marcado como
 *   automatico. BC-07, feature 009.
 * - **`_wp_customize_publish_changeset`** e
 *   **`_wp_keep_alive_customize_changeset_dependent_auto_drafts`** sao a maquina
 *   do changeset do customizador — `SM-CHANGESET` em `PT-019`. BC-07, feature
 *   009.
 * - **`__clear_multi_author_cache`** limpa o cache de "o site tem mais de um
 *   autor". Nao ha cache nesta arvore.
 *
 * E dois que pendem do ponto **3**, nao do 1:
 *
 * - **`_future_post_hook`** (`class-wp-post-type.php:767`, prioridade 5 em
 *   `future_{$post_type}`) limpa o evento pendente e agenda a publicacao na data.
 *   **Implementado**, por T013 (US-6), em
 *   `../agendamento/evento-de-publicacao-agendada.ts`, e disparado na posicao
 *   dele por {@link transitarEstado}.
 * - **`_publish_post_hook`** (`:447` de `default-filters.php`, prioridade 5 em
 *   `publish_post`) grava os metadados `_pingme` e `_encloseme` e agenda
 *   `do_pings`. E notificacao de link remoto — UC-17, feature 007 — e **nao**
 *   esta aqui. Quem a construir registra naquele ponto, com aquela prioridade.
 *
 * ⚠️ **O ponto 3 emite tres argumentos e `_future_post_hook` aceita dois.** O
 * legado o registra com `add_action( 'future_' . $this->name, '_future_post_hook',
 * 5, 2 )`, logo o ouvinte recebe `$post->ID` e `$post` e **nao** recebe
 * `$old_status` — e o primeiro parametro dele, que seria o identificador, esta
 * declarado como `$deprecated` e nunca foi usado. Quem construir o barramento
 * registra assim: numero de argumentos aceitos e parte do registro, nao detalhe.
 */

import type { EstadoEditorial } from '../estado-editorial.js';
import type { Conteudo } from '../armazenamento/index.js';
import {
  agendarPublicacaoFutura,
  type EventoDePublicacaoAgendada,
} from '../agendamento/evento-de-publicacao-agendada.js';
import {
  GANCHO_DE_PUBLICACAO_AGENDADA,
  type ContextoDePublicacao,
} from './contexto-de-publicacao.js';

/**
 * `publish` — o estado que esta operacao grava.
 *
 * Declarado aqui, e nao em `../estado-editorial.ts`, porque la ha
 * **vocabulario** e aqui ha **regra**: e este valor que o `===` da condicao do
 * `guid` compara (`:8156`) e e ele que vai para a coluna.
 */
export const ESTADO_PUBLICADO: EstadoEditorial = 'publish';

/**
 * `future` — o estado agendado.
 *
 * Declarado aqui, ao lado de {@link ESTADO_PUBLICADO} e pela mesma razao, porque
 * neste arquivo ele e **regra** e nao vocabulario: e ele que compoe o nome do
 * ponto `future_{$post_type}` em que o nucleo registra `_future_post_hook`
 * (`wp-includes/class-wp-post-type.php:767`), e e por essa comparacao de nome
 * que o ouvinte de agendamento de T013 roda ou nao roda.
 *
 * Entrada de **T013** (US-6). O outro lugar em que este valor e regra e a
 * comparacao de data de `../agendamento/estado-pela-data.ts`, que o importa
 * daqui para que as duas nao divirjam.
 */
export const ESTADO_AGENDADO: EstadoEditorial = 'future';

/**
 * A prioridade com que o nucleo registra `_transition_post_status` no ponto
 * `transition_post_status` (`wp-includes/default-filters.php:448`).
 *
 * Declarada como numero porque ela **e** a regra de ordem: ver a secao
 * correspondente no cabecalho deste arquivo.
 */
export const PRIORIDADE_DO_OUVINTE_DO_NUCLEO = 5;

/**
 * `private_to_published` — o ponto **depreciado** desde 2.3.0, substituido por
 * `private_to_publish` (`wp-includes/post.php:8171`).
 *
 * ⚠️ **O nome mente, e o nome e contrato.** Ele dispara em **toda** entrada em
 * publicado a partir de qualquer estado que nao seja publicado — a condicao e
 * `'publish' !== $old_status && 'publish' === $new_status` (`:8156`) —, logo
 * `draft` para `publish` o dispara tambem, apesar do `private_` no nome. E ele
 * so dispara se **houver** interceptador registrado, porque
 * `do_action_deprecated()` desiste quando `has_action()` e falso
 * (`wp-includes/plugin.php:580`) — e, havendo, escreve o aviso de depreciacao.
 *
 * O **P8** poe superficie publicada fora do alcance de quem codifica: *"nao
 * remova funcao, constante, tabela, rota, superficie nem comportamento
 * publicado"*, e *"existir sem ser chamada e parte do que se clona"* (resposta
 * 7). Por isso o ponto existe aqui, com o nome errado preservado.
 */
export const PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO = 'private_to_published';

/** A transicao que aconteceu, do ponto de vista dos pontos de extensao. */
export interface TransicaoDeEstado {
  /** `$new_status`. */
  readonly estadoNovo: string;
  /** `$old_status`. */
  readonly estadoAnterior: string;
  /**
   * `$post` — o registro **com o estado novo ja aplicado em memoria**.
   *
   * No legado a linha `$post->post_status = 'publish'` vem **antes** da chamada
   * (`wp-includes/post.php:5451`), logo todo interceptador ve o estado novo no
   * objeto e o estado antigo no argumento. Passar aqui o registro antigo
   * inverteria o que os 3.373 pontos de extensao do produto esperam.
   */
  readonly conteudo: Conteudo;
}

/** O que a transicao deixou atras de si, e que os criterios de US-1 afirmam. */
export interface EfeitosDaTransicao {
  /**
   * O endereco gravado no `guid`, ou `null` quando ele nao foi tocado (CA-1.3).
   *
   * `null` **nao e falha**: e o caminho normal de um conteudo que ja tinha
   * `guid`, que e o caso de tudo que passou por `wp_insert_post()`
   * (`:5120`-`:5121` repoe o `guid` na insercao). Este ramo alcanca o que foi
   * criado por outro caminho — linha inserida direto na tabela, importacao — e
   * e por isso que o legado o mantem.
   */
  readonly enderecoGravadoNoGuid: string | null;
  /**
   * O que `wp_clear_scheduled_hook()` devolveu (CA-1.5).
   *
   * **Nenhum ramo do fluxo o consulta** (P7): ele esta aqui para que o criterio
   * seja afirmavel por teste. No legado o retorno e descartado.
   */
  readonly eventosAgendadosRemovidos: number | false;
  /**
   * O que o ouvinte de agendamento deixou na fila, ou `null` quando ele nao
   * rodou (T013, US-6).
   *
   * `null` e o caminho normal de toda transicao que **nao** entra em agendado:
   * o ouvinte do legado esta registrado em `future_{$post_type}` e so aquele
   * nome o alcanca. Ver {@link transitarEstado}.
   */
  readonly eventoDePublicacaoAgendada: EventoDePublicacaoAgendada | null;
}

/** `{$old_status}_to_{$new_status}` — o nome montado do ponto 2. */
export function nomeDoPontoDeParaEstado(
  estadoAnterior: string,
  estadoNovo: string,
): string {
  return `${estadoAnterior}_to_${estadoNovo}`;
}

/** `{$new_status}_{$post->post_type}` — o nome montado do ponto 3. */
export function nomeDoPontoDeEstadoDoTipo(
  estadoNovo: string,
  tipoDeConteudo: string,
): string {
  return `${estadoNovo}_${tipoDeConteudo}`;
}

/**
 * `get_the_guid()` — a coluna, **passada pelo filtro**
 * (`wp-includes/post-template.php:221`).
 *
 * A leitura e uma consulta nova de proposito: no legado
 * `get_the_guid( $post->ID )` recebe um identificador, logo passa por
 * `get_post()`, e `clean_post_cache()` acabou de esvaziar o cache daquela linha
 * (`wp-includes/post.php:5450`) — isto e, **o legado le o banco aqui, e le a
 * linha ja atualizada**. Ver a nota de leituras em `publicar.ts`.
 *
 * `$post->guid ?? ''` cobre a linha ausente: no legado o `??` engole o objeto
 * nulo e o resultado e cadeia vazia, que e o valor que a condicao compara.
 */
function guidDoConteudo(
  contexto: ContextoDePublicacao,
  conteudoId: number,
): string {
  const linha = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  const guid = linha === null ? '' : linha.guid;

  const filtro = contexto.ganchos?.filtrarGuid;
  return filtro === undefined ? guid : filtro(guid, conteudoId);
}

/**
 * `_transition_post_status()` — o ouvinte do nucleo, prioridade
 * {@link PRIORIDADE_DO_OUVINTE_DO_NUCLEO} (`wp-includes/post.php:8154`).
 *
 * Os quatro blocos, na ordem do legado:
 *
 * 1. **entrada em publicado** (`:8156`): repoe o `guid` vazio com o endereco, e
 *    dispara o ponto depreciado;
 * 2. **cache de ultima modificacao** (`:8174`-`:8180`): nove chaves em tres
 *    fusos. **Nao implementado** — nao ha cache nesta arvore, e o slot `cache`
 *    do `plan.md` recomenda cache por requisicao. A borda 5 de
 *    `target_architecture.md` manda o cache **desligado nas duas metades**
 *    durante a coexistencia, que e como a comparacao de paridade roda;
 * 3. **cache de contagem por estado** (`:8182`-`:8185`): duas chaves, quando o
 *    estado mudou. Mesma razao do bloco 2;
 * 4. **limpeza do evento agendado** (`:8189`): **sempre**, com o comentario do
 *    legado junto — *"Always clears the hook in case the post status bounced
 *    from future to draft"*. E CA-1.5.
 */
function ouvinteDoNucleoNaTransicao(
  contexto: ContextoDePublicacao,
  transicao: TransicaoDeEstado,
): Omit<EfeitosDaTransicao, 'eventoDePublicacaoAgendada'> {
  let enderecoGravadoNoGuid: string | null = null;

  // Bloco 1 (`:8156`). A condicao e sobre os DOIS estados: nao basta entrar em
  // publicado, e preciso nao estar publicado antes.
  if (
    transicao.estadoAnterior !== ESTADO_PUBLICADO &&
    transicao.estadoNovo === ESTADO_PUBLICADO
  ) {
    if (guidDoConteudo(contexto, transicao.conteudo.id) === '') {
      const endereco = contexto.enderecoDoConteudo(transicao.conteudo.id);
      // `get_permalink()` devolve `false` so quando o identificador e vazio, e
      // o `$wpdb->update()` do legado coage `false` para cadeia vazia. A
      // coercao esta reproduzida em vez de escondida.
      enderecoGravadoNoGuid = endereco === false ? '' : endereco;
      contexto.armazenamento.conteudo.atualizar(transicao.conteudo.id, {
        guid: enderecoGravadoNoGuid,
      });
    }

    // O ponto depreciado. No legado ele so dispara havendo interceptador, e e
    // isso que a chamada opcional reproduz.
    contexto.ganchos?.aoEntrarEmPublicadoPeloPontoDepreciado?.(
      PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
      transicao.conteudo.id,
    );
  }

  // Blocos 2 e 3: nove mais duas chaves de cache. Nao ha cache nesta arvore —
  // ver o cabecalho desta funcao. Quando houver, as invalidacoes entram aqui,
  // nesta posicao, sem mudar nada do que esta funcao devolve.

  // Bloco 4 (`:8189`): CA-1.5, e e incondicional.
  const eventosAgendadosRemovidos = contexto.fila.limparGancho(
    GANCHO_DE_PUBLICACAO_AGENDADA,
    [transicao.conteudo.id],
  );

  return { enderecoGravadoNoGuid, eventosAgendadosRemovidos };
}

/**
 * Os ouvintes que o **nucleo** registra no ponto 3, `{$new_status}_{$post_type}`
 * — hoje um so: `_future_post_hook`, prioridade
 * {@link PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO} (T013, US-6).
 *
 * **A condicao e o nome do ponto, e nao um `if` sobre estado.** O ponto 3 tem
 * nome dinamico, e o nucleo registra o ouvinte em `future_{$post_type}`, uma vez
 * por tipo **registrado**, dentro de `WP_Post_Type::add_hooks()`
 * (`wp-includes/class-wp-post-type.php:767`). Logo sao duas condicoes, e as duas
 * sao do legado:
 *
 * 1. **o estado novo e `future`** — e so `future_...` carrega este ouvinte;
 * 2. **o tipo esta registrado** — `add_hooks()` roda em `register_post_type()`,
 *    e `remove_hooks()` o desfaz em `unregister_post_type()` (`:856`). Conteudo
 *    de um tipo que ninguem registrou entra em `future` **sem** evento na fila, e
 *    fica agendado para sempre. E a mesma tolerancia a tipo e estado nao
 *    registrados que `../estado-editorial.ts` documenta, e recusar seria outro
 *    produto (P1).
 *
 * Nenhuma das duas e otimizacao: trocar a segunda por *"agenda sempre"* poria na
 * fila um evento que o legado nao poe.
 */
function ouvinteDoNucleoNoPontoDoEstado(
  contexto: ContextoDePublicacao,
  transicao: TransicaoDeEstado,
): EventoDePublicacaoAgendada | null {
  if (transicao.estadoNovo !== ESTADO_AGENDADO) {
    return null;
  }

  if (contexto.tipoDeConteudo(transicao.conteudo.tipo) === null) {
    return null;
  }

  return agendarPublicacaoFutura(contexto, transicao.conteudo);
}

/**
 * `wp_transition_post_status()` — os tres pontos, na ordem, com a cadeia do
 * primeiro e a do terceiro ordenadas por prioridade
 * (`wp-includes/post.php:5912`).
 *
 * ⚠️ **Esta funcao nao grava o estado**, e o docblock do legado o diz com estas
 * palavras: *"Note that the function does not transition the post object in the
 * database"*. Quem grava e o chamador — `publicar.ts` aqui,
 * `wp_insert_post()` la. Confundir os dois produziria duas escritas da mesma
 * coluna.
 */
export function transitarEstado(
  contexto: ContextoDePublicacao,
  transicao: TransicaoDeEstado,
): EfeitosDaTransicao {
  // Ponto 1, cadeia por prioridade: o ouvinte do nucleo em 5 ...
  const efeitosDoPontoUm = ouvinteDoNucleoNaTransicao(contexto, transicao);

  // ... e o interceptador de terceiro, que entra em 10 por omissao. Os outros
  // cinco ouvintes de fabrica estao nomeados no cabecalho deste arquivo, com
  // prioridade e dono.
  contexto.ganchos?.aoTransitarEstado?.(
    transicao.estadoNovo,
    transicao.estadoAnterior,
    transicao.conteudo,
  );

  // Ponto 2 (`:5938`).
  contexto.ganchos?.aoTransitarDeParaEstado?.(
    nomeDoPontoDeParaEstado(transicao.estadoAnterior, transicao.estadoNovo),
    transicao.conteudo,
  );

  // Ponto 3 (`:5975`), e ele tambem e cadeia por prioridade: o ouvinte do
  // nucleo em 5 vem antes do interceptador de terceiro, que entra em 10.
  const eventoDePublicacaoAgendada = ouvinteDoNucleoNoPontoDoEstado(
    contexto,
    transicao,
  );

  contexto.ganchos?.aoEntrarNoEstadoDoTipo?.(
    nomeDoPontoDeEstadoDoTipo(transicao.estadoNovo, transicao.conteudo.tipo),
    transicao.conteudo.id,
    transicao.conteudo,
    transicao.estadoAnterior,
  );

  return { ...efeitosDoPontoUm, eventoDePublicacaoAgendada };
}
