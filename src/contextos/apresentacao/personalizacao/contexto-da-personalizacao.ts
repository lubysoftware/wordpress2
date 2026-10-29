/**
 * O contexto das operacoes de pre-visualizacao — o que elas recebem da
 * requisicao e das ligacoes tardias com outros contextos.
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao` (US-1,
 * *"Pre-visualizar alteracoes de aparencia antes de elas chegarem ao
 * visitante"*), CA-1.1 a CA-1.6.
 *
 * ## Por que tanta coisa chega por argumento
 *
 * O Customizer do legado e um objeto global montado no arranque
 * (`_wp_customize_include()`, `wp-includes/theme.php:3536`) que le `$_GET`,
 * `$_POST`, a conta corrente, o tema ativo e o motor de consulta de `BC-01`. Nada
 * disso e deste contexto:
 *
 * | o que o legado chama | ancora | quem e o dono | como chega aqui |
 * |---|---|---|---|
 * | `current_user_can()` | `wp-includes/capabilities.php:698` (o caso `customize`) | `plataforma/autorizacao`, feature 001 | {@link ContextoDaPersonalizacao.autorizacao} |
 * | `is_user_logged_in()` | `wp-includes/pluggable.php` | BC-05 | `autorizacao.ator.existe` |
 * | `find_changeset_post_id()` / `get_changeset_posts()` — `WP_Query` | `wp-includes/class-wp-customize-manager.php:991`, `:1036` | BC-01 | {@link ConjuntosNaPersonalizacao} |
 * | `wp_insert_post()` / `wp_update_post()` | `class-wp-customize-manager.php:2988`, `:2977` | BC-01 | {@link ConjuntosNaPersonalizacao} |
 * | `get_post_stati()` | `wp-includes/post.php:1579` | BC-01 | {@link ContextoDaPersonalizacao.estadosRegistrados} |
 * | `wp_generate_uuid4()` | `wp-includes/functions.php` | borda (aleatoriedade) | {@link ContextoDaPersonalizacao.gerarIdentificador} |
 * | `check_ajax_referer()` | `wp-includes/pluggable.php` | atestado de nonce, feature 001 (**P4**) | {@link ContextoDaPersonalizacao.verificarNonce} |
 * | `sanitize_key()` / `sanitize_text_field()` | `wp-includes/formatting.php:2191`, `:2057` | `plataforma/formatacao/`, feature 015 | as duas funcoes homonimas abaixo |
 * | `current_time( 'mysql' )` e `current_time( 'mysql', true )` | `class-wp-customize-manager.php:2950`, `:2866` | borda (relogio) | {@link ContextoDaPersonalizacao.agora} |
 * | `WP_Customize_Setting` registrado | `class-wp-customize-manager.php:3874` | o registro de configuracoes, que nenhuma tarefa desta feature porta como codigo | {@link ContextoDaPersonalizacao.configuracao} |
 *
 * E a mesma forma que `contexto-de-abertura.ts` de BC-06 e
 * `contexto-de-publicacao.ts` de BC-01 usaram: AD-10 e a regra de dependencia 3
 * proibem o `import` entre contextos *"sempre, sem excecao"*, e AD-02 poe
 * identidade e requisicao no escopo da REQUISICAO.
 *
 * ⚠️ **Os pedidos chegam ja sem barra invertida de escape.** O legado aplica
 * `wp_unslash()` a cada campo de `$_POST` que `save()` le
 * (`class-wp-customize-manager.php:2460`, `:2471`, `:2478`), e
 * `_wp_customize_include()` registra que **nao** o aplica porque roda antes de
 * `wp_magic_quotes()` (`wp-includes/theme.php:3551`-`:3555`). Desfazer o escape
 * e da borda HTTP; aqui o valor ja e o que o legado ve depois dele.
 */

import type { ContextoDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type {
  ConjuntoDeAlteracoes,
  PedidoDoConjunto,
  ValorDeJson,
} from '../armazenamento/index.js';

/** O resultado de `wp_insert_post( ..., true )` / `wp_update_post( ..., true )`. */
export type ResultadoDaGravacaoDoConjunto =
  | { readonly ok: true; readonly id: number }
  | { readonly ok: false; readonly codigo: string };

/**
 * A ligacao tardia com `BC-01` para o conjunto de alteracoes.
 *
 * `T002` deixou registrado em `armazenamento/conjunto-de-alteracoes.ts` que o
 * legado **nao** le o conjunto por consulta propria, e sim por `WP_Query` e
 * `get_post()`, e que quem pegasse **T003** declararia a travessia aqui. E esta.
 */
export interface ConjuntosNaPersonalizacao {
  /**
   * `find_changeset_post_id( $uuid )` seguido de `get_post()`
   * (`class-wp-customize-manager.php:991`-`:1022`): o conjunto pelo
   * identificador, com `post_status => get_post_stati()` — **qualquer** estado
   * registrado, inclusive a lixeira — e `posts_per_page => 1`.
   */
  porIdentificador(identificador: string): ConjuntoDeAlteracoes | null;

  /**
   * `get_changeset_posts()` como `establish_loaded_changeset()` o chama
   * (`class-wp-customize-manager.php:631`-`:642`): `author => 'any'`,
   * `posts_per_page => 1`, `orderby => 'date'`, `order => 'DESC'`,
   * `exclude_restore_dismissed => false`, e `post_status` igual a lista
   * recebida. O primeiro, ou `null`.
   */
  maisRecente(estados: readonly string[]): ConjuntoDeAlteracoes | null;

  /** `wp_insert_post( wp_slash( $post_array ), true )` (`:2988`). */
  inserir(pedido: PedidoDoConjunto): ResultadoDaGravacaoDoConjunto;

  /** `wp_update_post( wp_slash( $post_array ), true )` (`:2977`). */
  atualizar(pedido: PedidoDoConjunto): ResultadoDaGravacaoDoConjunto;

  /**
   * `wp_get_post_autosave( $id, $user_id )` e, havendo revisao,
   * `wp_delete_post( $autosave->ID, true )` (`:2980`-`:2984`): a revisao de
   * salvamento automatico **daquela conta** sai quando o conjunto e gravado.
   *
   * Nao devolve nada: o legado ignora o retorno de `wp_delete_post()` aqui.
   */
  apagarSalvamentoAutomaticoDaConta(conjuntoId: number, contaId: number): void;
}

/** Um `WP_Error` de configuracao: o codigo e a mensagem. */
export interface ErroDaConfiguracao {
  readonly codigo: string;
  readonly mensagem: string;
}

/** `true` ou o `WP_Error` — o que `WP_Customize_Setting::validate()` devolve. */
export type ValidadeDaConfiguracao = true | ErroDaConfiguracao;

/**
 * O que `WP_Customize_Setting::sanitize()` devolve: o valor ou um `WP_Error`.
 *
 * ⚠️ **Valor `null` e invalidez**, nao ausencia: `validate_setting_values()` o
 * troca por `invalid_value` (`:2383`-`:2384`, `:2389`-`:2391`) e `post_value()`
 * devolve o padrao (`:1848`-`:1851`). E o *"sanitizador que devolve nulo marca a
 * configuracao como invalida"* de RF-14.
 */
export type SanitizacaoDaConfiguracao =
  | { readonly ok: true; readonly valor: ValorDeJson }
  | { readonly ok: false; readonly erro: ErroDaConfiguracao };

/**
 * Uma configuracao registrada — o `WP_Customize_Setting` que
 * `get_setting( $id )` devolve.
 *
 * So os cinco membros que o caminho de US-1 consulta. ⚠️ **`validar` ja inclui o
 * ponto de extensao `customize_validate_{id}`**, que e aplicado DENTRO de
 * `WP_Customize_Setting::validate()` (`wp-includes/class-wp-customize-setting.php:617`);
 * `validate_setting_values()` o aplica uma **segunda** vez, so quando a primeira
 * passou (`class-wp-customize-manager.php:2374`-`:2379`), e esse segundo disparo
 * e {@link validarTardiamente}. O barramento de pontos de extensao (REQ-162) esta
 * em `do-not-rewrite.md`; os nomes ficam declarados aqui.
 */
export interface ConfiguracaoDaPersonalizacao {
  readonly id: string;
  /** `$setting->type` — `theme_mod`, `option` ou o que a configuracao declarar. */
  readonly tipo: string;
  /** `$setting->capability` — o default do legado e `edit_theme_options`. */
  readonly capacidade: string;
  /**
   * `! $this->theme_supports || current_theme_supports( ... )` — a segunda
   * metade de `check_capabilities()` (`class-wp-customize-setting.php:844`).
   */
  readonly suportadaPeloTema: boolean;
  validar(valor: ValorDeJson): ValidadeDaConfiguracao;
  /** O segundo disparo de `customize_validate_{id}`; ausente e "sem erro". */
  validarTardiamente?(valor: ValorDeJson): ErroDaConfiguracao | null;
  sanitizar(valor: ValorDeJson): SanitizacaoDaConfiguracao;
}

/** Os dois relogios que o salvamento le. */
export interface AgoraNaPersonalizacao {
  /** `current_time( 'mysql' )` — hora local do site. */
  readonly local: string;
  /** `current_time( 'mysql', true )` — GMT. */
  readonly gmt: string;
}

export interface ContextoDaPersonalizacao {
  /**
   * Quem pergunta, e a base de autorizacao. As operacoes acrescentam o caso
   * `customize` (`permissao-da-personalizacao.ts`) aos casos que a base trouxer.
   */
  readonly autorizacao: ContextoDeAutorizacao;
  /** `get_stylesheet()` do tema ativo. */
  readonly folhaDeEstilo: string;
  readonly conjuntos: ConjuntosNaPersonalizacao;
  /** `get_post_stati()` — os nomes dos estados registrados, na ordem do registro. */
  readonly estadosRegistrados: readonly string[];
  /**
   * O valor do ponto de extensao `customize_changeset_branching`
   * (`class-wp-customize-manager.php:812`), partindo de `false`, que e o que
   * `_wp_customize_include()` passa (`wp-includes/theme.php:3583`).
   */
  readonly ramificacao: boolean;
  /** `wp_generate_uuid4()`. */
  gerarIdentificador(): string;
  /** `check_ajax_referer( $acao, $campo, false )` sobre o valor recebido. */
  verificarNonce(acao: string, valor: string | undefined): boolean;
  /** `sanitize_key()`. */
  sanitizarChave(valor: string): string;
  /** `sanitize_text_field()`. */
  sanitizarTexto(valor: string): string;
  /** `$this->get_setting( $id )` — `undefined` quando nao ha configuracao. */
  configuracao(id: string): ConfiguracaoDaPersonalizacao | undefined;
  readonly agora: AgoraNaPersonalizacao;
}

/**
 * A requisicao, como `_wp_customize_include()` e `save()` a leem.
 *
 * `consulta` e `corpo` ficam separados porque o legado os distingue: a decisao
 * de carregar o Customizer olha `$_GET` e `$_POST` **cada um** com `empty()`
 * (`wp-includes/theme.php:3544`), e a fusao poe `$_POST` por cima
 * (`:3564`-`:3567`).
 */
export interface PedidoDaPersonalizacao {
  /** `is_admin() && 'customize.php' === basename( $_SERVER['PHP_SELF'] )`. */
  readonly naTelaDaPersonalizacao: boolean;
  /** `wp_doing_ajax()`. */
  readonly ajax: boolean;
  /** `$_GET`. */
  readonly consulta: Readonly<Record<string, string>>;
  /** `$_POST`. */
  readonly corpo: Readonly<Record<string, string>>;
}

/** `$_REQUEST[ $campo ]`, com `$_POST` por cima de `$_GET`. */
export function campoDoPedido(
  pedido: PedidoDaPersonalizacao,
  campo: string,
): string | undefined {
  return Object.prototype.hasOwnProperty.call(pedido.corpo, campo)
    ? pedido.corpo[campo]
    : Object.prototype.hasOwnProperty.call(pedido.consulta, campo)
      ? pedido.consulta[campo]
      : undefined;
}

/** `empty()` do PHP sobre um campo de formulario: ausente, `''` ou `'0'`. */
export function vazioNoPhp(valor: string | undefined): boolean {
  return valor === undefined || valor === '' || valor === '0';
}
