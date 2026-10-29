/**
 * O contexto das operacoes de componentes de area — o que elas recebem da
 * requisicao, do arranque do tema e do registro de componentes.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` (US-7,
 * *"Organizar componentes nas areas que o tema oferece"*), CA-7.1 a CA-7.4.
 *
 * ## O que chega por argumento, e por que
 *
 * Ao contrario do menu, **nada aqui e de outro contexto**: componente e area
 * vivem em opcao (`domain.md` §1.3, UC-31 — *"widget e area vivem em opcoes,
 * nao em tabela"*), e a opcao e deste. O que chega por argumento e o que no
 * legado e **estado global montado no arranque**, e por isso escopo de
 * REQUISICAO (AD-02):
 *
 * | o que o legado le | ancora | como chega aqui |
 * |---|---|---|
 * | `current_user_can()` | `wp-admin/widgets.php:15` | {@link ContextoDosComponentes.autorizacao} |
 * | `is_user_logged_in()` — o 401 contra o 403 da superficie programatica | `wp-includes/rest-api.php:1438`-`:1439` | `autorizacao.ator.existe` |
 * | `get_option()`, `update_option()`, `delete_option()` | `wp-includes/option.php` | {@link ContextoDosComponentes.opcoes}, o repositorio de T002 |
 * | `$wp_registered_sidebars` — as areas que o tema registrou, na ordem | `wp-includes/widgets.php:269` (`register_sidebar()`) | {@link ContextoDosComponentes.areasRegistradas} |
 * | `$wp_registered_widgets` — cada componente registrado, com o numero | `wp-includes/class-wp-widget.php:567` (`_register_one()`) | {@link ContextoDosComponentes.componentesRegistrados} |
 * | `$wp_widget_factory` e `$wp_registered_widget_updates` — o tipo de cada componente | `wp-includes/class-wp-widget-factory.php`, `wp-includes/widgets.php:604` | {@link ContextoDosComponentes.tipoDeComponente} |
 * | `current_theme_supports( 'widgets' )` | `wp-admin/widgets.php:23` | {@link ContextoDosComponentes.temaSuporta} |
 * | `wp_verify_nonce()` — a metade de `check_admin_referer()` e de `check_ajax_referer()` que decide | `wp-includes/pluggable.php` | {@link ContextoDosComponentes.verificarNonce} |
 * | `wp_hash()` — o resumo que protege a instancia codificada | `wp-includes/pluggable.php` | {@link ContextoDosComponentes.resumir} |
 * | `wp_use_widgets_block_editor()` | `wp-includes/widgets.php:1910` | {@link ContextoDosComponentes.usaEditorDeBlocos} |
 * | `wp_kses_post()` | `wp-includes/kses.php` | {@link ContextoDosComponentes.filtrarHtmlPermitido} |
 *
 * ⚠️ **O registro e dado do arranque, nao do banco.** As areas sao registradas
 * pelo tema em `widgets_init`, e cada tipo de componente registra os numeros
 * que achou na opcao dele (`WP_Widget::_register()`,
 * `wp-includes/class-wp-widget.php:253`) — **antes** de qualquer operacao
 * desta tarefa. A ordem de arranque e contrato publico (`EXT-ORDEM`); quem a
 * monta e o arranque, e o registro chega pronto.
 *
 * ⚠️ **O `update()` de cada tipo e codigo do tipo, nao desta tarefa.** Os 17
 * componentes do nucleo (`wp-includes/widgets/`) sao 17 classes, cada uma com a
 * sua sanitizacao, e nenhuma tarefa desta feature as porta. O que US-7 cobra e
 * a **estrutura** — onde a configuracao fica, quem pode muda-la e que as tres
 * superficies chegam ao mesmo lugar —, e o tipo entra como ligacao:
 * {@link TipoDeComponente.atualizar}.
 *
 * ⚠️ **Os valores chegam ja sem barra invertida de escape**, como em T003 e
 * T011. O legado recebe `$_POST` com barra e `update_callback()` a tira
 * (`stripslashes_deep()`, `class-wp-widget.php:447`); a superficie programatica
 * poe a barra antes de chamar o mesmo `update_callback()`
 * (`wp_slash()`, `class-wp-rest-widgets-controller.php:614`), e as duas
 * operacoes se anulam. Desfazer o escape e da borda.
 */

import type { ContextoDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type { RepositorioDeOpcoes } from '../armazenamento/index.js';

/**
 * O `$_POST` que o `update_callback()` de um componente le, ja sem barra.
 *
 * E um registro de campos porque e isso que o legado passa adiante: a tela
 * **reescreve** `$_POST` antes de chamar o tipo (`wp-admin/widgets-form.php:153`
 * -`:158`, `:172`), e a superficie programatica **acrescenta** a ele os
 * campos do pedido (`class-wp-rest-widgets-controller.php:613`-`:617`) — num
 * pedido de corpo JSON o `$_POST` de partida e vazio, e o formulario e so o
 * pedido.
 */
export type FormularioDoComponente = Readonly<Record<string, ValorPhp>>;

/** Um tipo de componente — o `WP_Widget` que a fabrica guarda por `id_base`. */
export interface TipoDeComponente {
  /** `$this->id_base`. */
  readonly idBase: string;
  /**
   * `$this->alt_option_name` — a opcao antiga que `get_settings()` le e apaga
   * quando a nova nao existe (`class-wp-widget.php:617`-`:623`). No nucleo, so
   * `recent-posts` (`widget_recent_entries`) e `recent-comments`
   * (`widget_recent_comments`) a declaram.
   */
  readonly opcaoAlternativa?: string;
  /**
   * `! empty( $this->widget_options['show_instance_in_rest'] )` — se a
   * instancia pode chegar crua pela superficie programatica e pela
   * personalizacao com o editor de blocos.
   */
  readonly instanciaCruaPermitida: boolean;
  /**
   * `$this->update( $new_instance, $old_instance )` — a sanitizacao do tipo.
   *
   * A base, `WP_Widget::update()`, devolve a instancia nova como veio
   * (`class-wp-widget.php:131`-`:132`). ⚠️ O filtro `widget_update_callback`
   * (`:476`), que pode devolver `false` e impedir a gravacao, e ponto de
   * extensao: o barramento (REQ-162) esta em `do-not-rewrite.md`, e o nome fica
   * declarado em `configuracao-do-componente.ts`.
   */
  atualizar(novo: ValorPhp, antigo: ValorPhp): ValorPhp;
}

/**
 * Um componente registrado — uma entrada de `$wp_registered_widgets`.
 *
 * O `numero` e `params[0]['number']`: o numero da instancia para o componente
 * de tipo, e **`-1`** para o modelo generico que o tipo sem nenhuma instancia
 * registra (`class-wp-widget.php:272`-`:276`, `:567`). E por ele que apagar
 * decide se tira a configuracao (`:425`-`:431`).
 */
export interface ComponenteRegistrado {
  readonly id: string;
  readonly numero: number;
}

/** Uma area registrada pelo tema — `$wp_registered_sidebars[ $id ]`. */
export interface AreaRegistrada {
  readonly id: string;
  readonly nome: string;
}

export interface ContextoDosComponentes {
  /** Quem pergunta, e a base de autorizacao. */
  readonly autorizacao: ContextoDeAutorizacao;
  /**
   * A opcao, de T002. O mapa de areas (`sidebars_widgets`) e a configuracao
   * de cada tipo (`widget_{id_base}`) sao opcoes proprias — nenhuma das duas e
   * modificacao de tema.
   */
  readonly opcoes: Pick<
    RepositorioDeOpcoes,
    'ler' | 'lerComoNoLegado' | 'gravar' | 'apagar'
  >;
  /** `$wp_registered_sidebars`, na ordem do registro. */
  readonly areasRegistradas: readonly AreaRegistrada[];
  /** `$wp_registered_widgets`, como o arranque o deixou. */
  readonly componentesRegistrados: readonly ComponenteRegistrado[];
  /** `$wp_widget_factory->get_widget_object( $id_base )`, ou `undefined`. */
  tipoDeComponente(idBase: string): TipoDeComponente | undefined;
  /** `current_theme_supports( $recurso )`. */
  temaSuporta(recurso: string): boolean;
  /** `wp_verify_nonce( $valor, $acao )`. */
  verificarNonce(acao: string, valor: string | undefined): boolean;
  /**
   * `wp_hash( $dados )` sobre os **bytes** da instancia serializada — o resumo
   * e de bytes, e a instancia pode trazer qualquer cadeia.
   */
  resumir(dados: Uint8Array): string;
  /** `wp_use_widgets_block_editor()`. */
  readonly usaEditorDeBlocos: boolean;
  /** `wp_kses_post()` — de `plataforma/formatacao/`, feature 015. */
  filtrarHtmlPermitido(html: string): string;
}
