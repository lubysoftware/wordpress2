/**
 * O contexto de uma exclusao definitiva: o que ela recebe por argumento, e de
 * quem cada peca e.
 *
 * Entrega de **T017** da feature `005-retencao-e-descarte` (US-8). Ele
 * **estende** `ContextoDeDescarte` em lugar de repeti-lo, e a razao esta no
 * legado: `wp_trash_post()` e `wp_delete_post()` **chamam uma a outra**. A
 * primeira linha do descarte delega a exclusao quando nao ha lixeira
 * (`wp-includes/post.php:4085`-`:4086`) e o passo 2 da exclusao delega ao
 * descarte quando ha (`:3851`-`:3856`). Um contexto que servisse so a exclusao
 * nao conseguiria atender a volta, e dois contextos separados obrigariam o
 * chamador a montar o mesmo mundo duas vezes — e a trava de `EXT-CONTEXTO`
 * (BR-MIGRAR-105) e justamente que esse mundo e **da requisicao**, montado uma
 * vez por ela.
 *
 * ── O QUE CHEGA DE FORA, E POR QUE CADA UM E LIGACAO TARDIA ─────────────────
 *
 * | peca | de quem e | por que nao esta implementada aqui |
 * |---|---|---|
 * | {@link ContextoDeExclusao.dados} | a porta deste modulo | a cascata emite comando cru: ver `comandos-da-exclusao.ts` |
 * | {@link TiposNaExclusao} | **BC-01** | `is_post_type_hierarchical()` le o registro de tipos, que e de BC-01 (`:1599`) |
 * | {@link ClassificacaoNaExclusao} | **BC-02** | `get_object_taxonomies()` e `wp_delete_object_term_relationships()` (`wp-includes/taxonomy.php:2006`) |
 * | {@link VersoesNaExclusao} | **BC-01** | `wp_get_post_revision()` (`wp-includes/revision.php:632`) |
 * | {@link ComentariosNaExclusao} | **BC-03** | `wp_defer_comment_counting()` e `wp_delete_comment()` (`wp-includes/comment.php:1566`) |
 * | {@link ExclusaoDeAnexoNaExclusao} | **BC-06** | `wp_delete_attachment()` (`:6814`), e a **resposta 9** ja decidiu o comportamento dela |
 * | {@link LimpezaDePublicacaoAgendada} | **BC-11** | `wp_clear_scheduled_hook()`, que a porta de fila deste modulo **nao** declara |
 *
 * Nenhuma delas e `import`: a regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e AD-10 poe toda chamada entre contextos como ligacao
 * tardia injetada pelo contexto da operacao.
 *
 * **Todos os campos sao obrigatorios, como em T003 e pelo mesmo motivo:**
 * opcional, a ausencia de qualquer um seria uma das sete etapas
 * **silenciosamente saltada**, e nenhuma delas e opcional no legado. Os **pontos
 * de extensao** sao a excecao, e por isso sao o unico campo opcional.
 *
 * ── A FILA ENTRA POR AQUI, E NAO PELA PORTA DA FILA ─────────────────────────
 *
 * ⚠️ O ultimo passo de `wp_delete_post()` e
 * `wp_clear_scheduled_hook( 'publish_future_post', array( $post_id ) )`
 * (`:4006`), e `portas/porta-de-fila-agendada.ts` declara, por escrito, que
 * *"nao ha execucao, nem cancelamento, nem evento unico, nem argumentos"* e que
 * `wp_clear_scheduled_hook` *"e contrato publico (P2, P8) e pertence a quem
 * portar a fila"*. T017 **nao** alarga aquela porta: o cancelamento entra como
 * colaboracao de ligacao tardia, na posicao exata em que o legado o faz. E a
 * mesma postura da porta — servir a feature sem virar dona do que e de BC-11.
 */

import type {
  ContextoDeDescarte,
  GanchosDoDescarte,
} from '../descarte/index.js';
import type { PortaDeDados } from '../portas/index.js';
import type { RegistroNaExclusao } from './comandos-da-exclusao.js';

/**
 * `is_post_type_hierarchical( $post_type )` (`wp-includes/post.php:1599`), a
 * pergunta que decide **se CA-8.1 acontece**.
 *
 * ⚠️ **Tipo nao registrado responde `false`**, antes de qualquer leitura de
 * registro (`:1600`-`:1602`) — e a consequencia e observavel: num tipo que uma
 * extensao desativou, os filhos nao sao reposicionados e ficam apontando para a
 * linha apagada. Ver o censo de CA-8.4 em `reposicionamento-no-avo.ts`.
 */
export interface TiposNaExclusao {
  /** `is_post_type_hierarchical()`: `false` tambem para tipo nao registrado. */
  ehHierarquico(tipo: string): boolean;
}

/**
 * A segunda etapa da cascata: os vinculos de termo
 * (`wp-includes/post.php:3892`).
 *
 * E uma linha no legado, e dentro dela ha **duas** colaboracoes com BC-02:
 *
 * ```php
 * wp_delete_object_term_relationships( $post_id, get_object_taxonomies( $post->post_type ) );
 * ```
 *
 * ⚠️ **O conjunto e "as taxonomias DO TIPO", e nao "as taxonomias do
 * registro"** — e dai sai um dos orfaos que o legado deixa de proposito: vinculo
 * em taxonomia que nao esta registrada para aquele tipo **nao** e removido e
 * sobrevive em `term_relationships` apontando para uma linha que nao existe
 * mais. Nao e defeito a corrigir aqui: a Decisao 2 de `pending_decisions.md`
 * poe, na area *"efeito no banco"*, *"a cascata de exclusao das 7 etapas **e os
 * orfaos que o legado deixa de proposito**"*.
 */
export interface ClassificacaoNaExclusao {
  /**
   * `get_object_taxonomies( $post_type )` — os nomes das taxonomias registradas
   * para aquele tipo, na ordem do registro.
   */
  taxonomiasDoTipo(tipo: string): readonly string[];

  /**
   * `wp_delete_object_term_relationships( $object_id, $taxonomies )`
   * (`wp-includes/taxonomy.php:2006`).
   *
   * **Nao devolve nada porque o legado nao devolve nada**, e nenhum ramo da
   * cascata depende do que aconteceu com os vinculos. Dentro dela cada taxonomia
   * e resolvida por `wp_get_object_terms()` e removida por
   * `wp_remove_object_terms()`, que recalcula a contagem do termo — o contador
   * `DB-TRG1` de BR-MIGRAR-077, que e de BC-02.
   */
  removerVinculosDeTermo(
    conteudoId: number,
    taxonomias: readonly string[],
  ): void;
}

/**
 * `wp_get_post_revision( $revision )` (`wp-includes/revision.php:632`), a
 * leitura que **recusa o que nao e versao**.
 *
 * E a primeira linha de `wp_delete_post_revision()`, e ela e um portao: a funcao
 * devolve `null` para linha inexistente e **`null` tambem para linha que existe
 * e nao e do tipo `revision`** (`:614`-`:616` de `wp_get_post_revision()`), caso
 * em que nada e apagado. Como a lista que alimenta este passo ja foi filtrada
 * por `post_type = 'revision'` no SQL (`:3914`), no fluxo normal a recusa nao
 * acontece; ela e alcancavel por quem chama `wp_delete_post_revision()` direto, e
 * esta reproduzida porque e superficie publicada (P8).
 */
export interface VersoesNaExclusao {
  /**
   * `wp_get_post_revision()`: a linha, ou `null` quando ela nao existe **ou nao
   * e** uma versao anterior.
   */
  obterVersao(versaoId: number): RegistroNaExclusao | null;
}

/**
 * A sexta etapa: os comentarios do conteudo
 * (`wp-includes/post.php:3925`-`:3935`).
 *
 * ⚠️ **A contagem adiada e parte do contrato, nao otimizacao.**
 * `wp_defer_comment_counting( true )` desliga o recalculo de
 * `posts.comment_count` por comentario apagado e `( false )` o religa,
 * **disparando um recalculo so** (`wp-includes/comment.php:2418`). Sem o par, a
 * exclusao de um conteudo com 500 comentarios emitiria 500 recalculos — e o
 * ultimo deles sobre uma linha que o passo seguinte vai apagar. E o contador
 * `DB-TRG1`, de BC-03.
 */
export interface ComentariosNaExclusao {
  /** `wp_defer_comment_counting( $defer )` (`wp-includes/comment.php:2385`). */
  adiarContagem(adiar: boolean): void;

  /**
   * `wp_delete_comment( $comment_id, true )` (`wp-includes/comment.php:1566`),
   * **sempre com forca**: o comentario de um conteudo que esta sendo apagado
   * **nao** vai para a lixeira, mesmo com a lixeira ligada.
   *
   * Devolve se o comentario foi apagado, que e o retorno do legado — e **nenhum
   * ramo da cascata o le**, nem para parar nem para contar.
   */
  apagarComentario(comentarioId: number): boolean;
}

/**
 * `wp_delete_attachment( $post_id, $force_delete )` (`wp-includes/post.php:6814`),
 * o desvio de `:3858`.
 *
 * ⚠️ **A assimetria entre midia e conteudo e decisao humana ja tomada, e esta e
 * a linha em que ela aparece.** A **resposta 9** de `questions.md` decidiu que
 * apagar midia continua **definitivo, sem lixeira e sem aviso**, e REQ-051
 * (*"dar lixeira a midia pelo mesmo comportamento do conteudo"*) esta
 * `bloqueado`. `spec.md` registra, em *Perguntas em aberto*, que *"US-8
 * reparenta anexos ao apagar conteudo em definitivo, entao a assimetria entre
 * conteudo e midia precisa estar visivel para quem constroi"* — e esta aqui: o
 * anexo **filho** do conteudo apagado e reposicionado no avo e **continua
 * existindo** (CA-8.2), mas o anexo **pedido** para exclusao desvia para esta
 * funcao, que o apaga do disco sem volta.
 *
 * O desvio e reproduzido e a funcao nao: ela e de BC-06
 * (`006-biblioteca-de-midia`), tem cascata propria — os arquivos derivados, os
 * metadados de anexo, os vinculos de termo — e exige `MEDIA_TRASH`, que nasce
 * `false` (`wp-includes/default-constants.php:135`).
 */
export type ExclusaoDeAnexoNaExclusao = (
  anexoId: number,
  forcar: boolean,
) => boolean;

/**
 * `wp_clear_scheduled_hook( 'publish_future_post', array( $post_id ) )`
 * (`wp-includes/post.php:4006`).
 *
 * O nome do gancho e o arranjo de argumentos **sao** o evento no legado: a fila
 * identifica a ocorrencia por gancho **mais** argumentos, logo limpar
 * `publish_future_post` sem o identificador apagaria o agendamento de **todo**
 * conteudo agendado. O gancho esta nomeado aqui porque e contrato publico (P2) e
 * porque quem implementar isto do lado de BC-11 nao deve inventa-lo.
 *
 * ⚠️ **A posicao e depois do `DELETE` da linha, e nao antes** (`:4006` vem
 * depois de `:3969`): um conteudo agendado que falhe no `DELETE` fica com o
 * agendamento **intacto**, e e assim no legado.
 */
export type LimpezaDePublicacaoAgendada = (conteudoId: number) => void;

/**
 * Os **sete** pontos de extensao de `wp_delete_post()`, mais o de
 * `wp_delete_post_revision()`, com o nome, os argumentos e a ordem que eles tem
 * hoje — o que o **P2** chama de contrato publico.
 *
 * Estende {@link GanchosDoDescarte} porque o passo 2 desta operacao pode
 * delegar ao descarte, e naquele caminho sao os tres pontos **dele** que
 * disparam: uma bolsa so de ganchos atravessa os dois caminhos sem o chamador
 * ter de adivinhar qual deles vai acontecer.
 *
 * O barramento que os dispara nao existe nesta arvore (REQ-162 em
 * `do-not-rewrite.md`), e ponto sem interceptador e no-op no legado — logo todos
 * sao opcionais aqui, e o que esta tarefa preserva e a **posicao** de cada um.
 *
 * ⚠️ **Um dos oito devolve valor**, e e o unico que muda o resultado:
 * `pre_delete_post`. Os outros sete sao acao.
 *
 * ## 🔴 O nucleo registra SETE escutas nestes pontos, e tres delas mudam dado
 *
 * Nao sao extensoes de terceiro: sao do proprio nucleo, em
 * `wp-includes/default-filters.php`, e sem o barramento **nenhuma delas roda**
 * neste alvo:
 *
 * | ponto | escuta do nucleo | o que ela faz | linha |
 * |---|---|---|---|
 * | `before_delete_post` | `_reset_front_page_settings_for_post` | se a pagina apagada era a inicial ou a de conteudos, zera a opcao e volta `show_on_front` para `posts`; e **desafixa** o conteudo | `:593` |
 * | `before_delete_post` | `_reset_privacy_policy_page_for_post` | zera `wp_page_for_privacy_policy` | `:594` |
 * | `before_delete_post` | `_wp_before_delete_font_face` | apaga os arquivos da familia de fonte | `:814` |
 * | `delete_post` | `_wp_delete_post_menu_item` | apaga o item de menu que aponta para o conteudo | `:472` |
 * | `delete_post` | `_wp_delete_customize_changeset_dependent_auto_drafts` | apaga os rascunhos automaticos de que o changeset dependia | `:475` |
 * | `delete_post` | `delete_get_calendar_cache` | limpa o cache do calendario | `:583` |
 * | `deleted_post` | `_wp_after_delete_font_family` | apaga as faces da familia | `:813` |
 *
 * As tres primeiras linhas de dado — a opcao da pagina inicial, a da politica de
 * privacidade e o item de menu — sao o terceiro grupo do censo de CA-8.4: **sem
 * o barramento, o alvo deixa esses tres vinculos pendurados onde o legado os
 * desfaz.** Nao e comportamento do legado a reproduzir, e **lacuna declarada do
 * alvo**, e fica escrita aqui porque e aqui que ela se fecha quando REQ-162
 * voltar. Ver `reposicionamento-no-avo.ts`.
 */
export interface GanchosDaExclusao extends GanchosDoDescarte {
  /**
   * `pre_delete_post` — **filtro**, tres argumentos, na ordem `null`,
   * `registro`, `forcar` (`wp-includes/post.php:3871`).
   *
   * **Qualquer valor diferente de `null` curto-circuita a exclusao, e e esse
   * valor que `wp_delete_post()` devolve** (`:3872`-`:3873`). Nada acontece:
   * nenhuma das sete etapas, nenhum ponto de acao e nem a leitura das
   * dependencias. E a ultima posicao em que uma extensao consegue impedir a
   * exclusao.
   *
   * ⚠️ **Ele dispara DEPOIS dos dois desvios** — o da lixeira (`:3851`) e o do
   * anexo (`:3858`). Interceptador registrado aqui nunca ve um pedido que virou
   * descarte nem um pedido de anexo, e isso e observavel.
   */
  readonly filtrarExclusao?: (
    exclusao: null,
    registro: RegistroNaExclusao,
    forcar: boolean,
  ) => boolean | null;

  /**
   * `before_delete_post` — **acao**, dois argumentos (`:3887`).
   *
   * Dispara **antes da primeira etapa**: quem a escuta ve o mundo inteiro ainda
   * de pe, com os marcadores de lixeira no lugar e os filhos no pai antigo. E
   * aqui que o nucleo zera as opcoes de pagina inicial e de politica de
   * privacidade — ver o 🔴 do cabecalho.
   */
  readonly antesDaExclusao?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /**
   * `delete_post_{$post->post_type}` — **acao**, dois argumentos, com o tipo no
   * nome (`:3956`).
   *
   * Dispara **depois das sete etapas e antes do `DELETE` da linha**: quem a
   * escuta ja nao encontra comentario, metadado nem vinculo de termo, e **ainda
   * encontra a linha**. E a unica janela em que isso e verdade.
   */
  readonly antesDeApagarALinhaDoTipo?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /** `delete_post` — **acao**, dois argumentos, logo depois do anterior (`:3967`). */
  readonly antesDeApagarALinha?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /**
   * `deleted_post_{$post->post_type}` — **acao**, dois argumentos (`:3985`).
   *
   * ⚠️ Dispara **so quando o `DELETE` afetou linha**: a guarda `if ( ! $result )
   * return false` (`:3970`) sai antes, e nesse caminho nem este ponto nem os
   * dois seguintes acontecem — com as sete etapas ja executadas.
   */
  readonly depoisDeApagarALinhaDoTipo?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /** `deleted_post` — **acao**, dois argumentos (`:3996`). */
  readonly depoisDeApagarALinha?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /**
   * `after_delete_post` — **acao**, dois argumentos, o ultimo passo da funcao
   * (`:4019`).
   *
   * Dispara **depois** da limpeza do agendamento de publicacao futura, e e a
   * diferenca entre ele e `deleted_post`: dois pontos quase no mesmo lugar, com
   * um cancelamento de agendamento entre eles.
   */
  readonly aoFimDaExclusao?: (
    conteudoId: number,
    registro: RegistroNaExclusao,
  ) => void;

  /**
   * `wp_delete_post_revision` — **acao**, dois argumentos
   * (`wp-includes/revision.php:649`).
   *
   * Nao e de `wp_delete_post()`: e de `wp_delete_post_revision()`, e dispara uma
   * vez **por versao apagada**, depois de a exclusao daquela versao ter
   * terminado e **so se ela deu certo** (`:640`).
   */
  readonly depoisDeApagarVersao?: (
    versaoId: number,
    versao: RegistroNaExclusao,
  ) => void;
}

/**
 * O contexto de uma exclusao definitiva.
 *
 * Estende o do descarte: ver o cabecalho deste arquivo. Na pratica isso quer
 * dizer que quem monta este contexto monta **um** mundo, e as duas operacoes que
 * se chamam uma a outra andam dentro dele.
 */
export interface ContextoDeExclusao extends ContextoDeDescarte {
  /**
   * A porta de dados, para os comandos crus das sete etapas.
   *
   * ⚠️ **O contexto do descarte nao a tem, e a diferenca e do legado:**
   * `wp_trash_post()` nao monta SQL nenhum — ela grava metadado pela familia de
   * metadado e o estado por `wp_update_post()`. `wp_delete_post()` monta nove
   * comandos crus. Ver `comandos-da-exclusao.ts`.
   */
  readonly dados: PortaDeDados;

  /** `is_post_type_hierarchical()`. Ver {@link TiposNaExclusao}. */
  readonly tipos: TiposNaExclusao;

  /** A segunda etapa. Ver {@link ClassificacaoNaExclusao}. */
  readonly classificacao: ClassificacaoNaExclusao;

  /** `wp_get_post_revision()`. Ver {@link VersoesNaExclusao}. */
  readonly versoes: VersoesNaExclusao;

  /** A sexta etapa. Ver {@link ComentariosNaExclusao}. */
  readonly comentarios: ComentariosNaExclusao;

  /** O desvio de `:3858`. Ver {@link ExclusaoDeAnexoNaExclusao}. */
  readonly exclusaoDeAnexo: ExclusaoDeAnexoNaExclusao;

  /** O ultimo passo. Ver {@link LimpezaDePublicacaoAgendada}. */
  readonly limparPublicacaoAgendada: LimpezaDePublicacaoAgendada;

  /** Os oito pontos de extensao, e os tres do descarte. Ver {@link GanchosDaExclusao}. */
  readonly ganchos?: GanchosDaExclusao;
}
