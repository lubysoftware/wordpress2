/**
 * O contexto do modo de recuperacao — o que as operacoes de US-12 recebem da
 * requisicao, do ambiente e das ligacoes tardias com o que nao e desta tarefa.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` (US-12, *"Entrar em
 * modo de recuperacao quando um erro fatal derruba a area protegida"*),
 * CA-12.1 a CA-12.7.
 *
 * ## O que chega por ligacao tardia, e de quem e
 *
 * | o que o legado chama | onde | de quem e | campo |
 * |---|---|---|---|
 * | `validate_recovery_mode_key()` | `class-wp-recovery-mode-link-service.php:86` | **T027** (US-13) | {@link ContextoDaRecuperacao.validarChave} |
 * | `wp_fast_hash()` | `class-wp-recovery-mode-key-service.php:51` | borda de hash do plano | {@link ContextoDaRecuperacao.resumirChave} |
 * | `wp_generate_password()` | `pluggable.php:2964` | borda de aleatoriedade | {@link ContextoDaRecuperacao.gerarSenha} |
 * | `wp_verify_nonce()` | `class-wp-recovery-mode.php:242` | BC-05, feature `001` | {@link ContextoDaRecuperacao.verificarNonce} |
 * | `wp_next_scheduled()`, `wp_schedule_event()` | `class-wp-recovery-mode.php:99`-`:100` | feature `011` | {@link AgendamentoNaRecuperacao} |
 * | `wp_is_maintenance_mode()` | `class-wp-fatal-error-handler.php:37` | **T009** (US-4) | {@link InstalacaoNaRecuperacao.emManutencao} |
 * | `is_email()`, `wp_specialchars_decode()`, `wp_strip_all_tags()`, `human_time_diff()`, `add_query_arg()` | `formatting.php:3613`, `:1015`, `:5600`, `:3942`; `functions.php:1144` | `plataforma/formatacao/`, feature `015` — como em `privacidade/abertura/` | {@link FormatacaoNaRecuperacao} |
 * | `get_plugins()`, `wp_get_theme()`, `plugin_basename()` | `class-wp-recovery-mode-email-service.php:310`, `:282`, `:340`; `load.php:1069` | API de extensao (BC-10) | {@link ExtensoesNaRecuperacao} |
 * | `switch_to_locale()`, `restore_previous_locale()` | `class-wp-recovery-mode-email-service.php:119` e `:234` | `plataforma/traducao/` | {@link IdiomaNaRecuperacao} |
 *
 * 🔴 **A chave e emitida aqui e verificada em T027.** CA-12.1 cobra *"gera uma
 * chave de recuperacao"*, e emitir e `generate_and_store_recovery_mode_key()`
 * (`class-wp-recovery-mode-key-service.php:45`): e desta tarefa. Verificar e
 * consumir e `validate_recovery_mode_key()` (`:82`), e e exatamente o que
 * US-13 disputa — CA-13.1 pede *"verificada antes de ser removida"* e o ADR
 * 0007, com o cenario `@divida-herdada` de PT-013, manda consumir **antes**.
 * Esta tarefa nao escolhe: abrir o caminho chama {@link
 * ContextoDaRecuperacao.validarChave} no ponto em que o legado chama a
 * verificacao, e grava o cookie so quando ela devolve `true`.
 *
 * ⚠️ **Os valores chegam ja sem barra invertida de escape**, como em US-1: o
 * legado le `$_GET` depois de `wp_magic_quotes()`, e desfazer e da borda.
 */

import type { TipoDeExtensao } from '../instalacao/contexto-da-instalacao.js';

/**
 * O erro capturado, na forma de `error_get_last()`: quatro campos, nesta ordem
 * — `type`, `message`, `file`, `line` —, que e a ordem em que o interpretador
 * do legado monta o arranjo e a ordem em que ele e **gravado** na opcao de
 * extensoes pausadas (`class-wp-paused-extensions-storage.php:73`).
 *
 * Quem captura o erro e a borda: o runtime do alvo nao tem `error_get_last()`,
 * e o que ele entrega precisa chegar nesta forma.
 */
export interface ErroFatal {
  /** `type` — o nivel, com os valores de `E_*` do PHP. */
  readonly tipo: number;
  /** `message`. */
  readonly mensagem: string;
  /** `file` — o caminho absoluto, de onde sai a extensao responsavel. */
  readonly arquivo: string;
  /** `line`. */
  readonly linha: number;
}

/**
 * A extensao responsavel, como `get_extension_for_error()` a devolve
 * (`class-wp-recovery-mode.php:369` e `:386`): o tipo e o **diretorio**.
 */
export interface ExtensaoResponsavel {
  readonly tipo: TipoDeExtensao;
  /** O primeiro segmento do caminho depois da pasta de plugins ou de temas. */
  readonly slug: string;
}

/** Um `WP_Error` deste caminho: o codigo, a mensagem e o dado. */
export interface ErroDaRecuperacao {
  readonly codigo: string;
  readonly mensagem: string;
  /** O `$data`; `status` e o que `wp_die()` usa como codigo de resposta. */
  readonly dado?: { readonly status?: number; readonly error?: ErroFatal };
}

/**
 * O estado de uma requisicao, que no legado e o de `wp_recovery_mode()`: um
 * objeto por processo, preenchido por `initialize()` e lido por todo o resto.
 *
 * O modulo nao guarda estado (`EXT-CONTEXTO`): quem chama recebe este valor de
 * {@link inicializarRecuperacao} e o devolve nas chamadas seguintes da mesma
 * requisicao, que e o que o modelo de processo por requisicao da pilha
 * escolhida da de graca.
 */
export interface EstadoDaRecuperacao {
  /** `is_initialized()` (`class-wp-recovery-mode.php:152`). */
  readonly inicializado: boolean;
  /** `is_active()` (`:128`) — *"This will not change after recovery mode has been initialized"*. */
  readonly ativo: boolean;
  /** `get_session_id()` (`:139`) — texto vazio quando inativo. */
  readonly sessaoId: string;
}

/** O estado antes de `initialize()`, que e o estado inteiro em rede. */
export const RECUPERACAO_NAO_INICIALIZADA: EstadoDaRecuperacao = {
  inicializado: false,
  ativo: false,
  sessaoId: '',
};

/**
 * Um `setcookie()` como dado: a tela nao monta cabecalho, a borda monta
 * (`EXT-BORDA`). Os campos sao os sete argumentos do legado, na ordem dele.
 */
export interface InstrucaoDeCookie {
  readonly nome: string;
  readonly valor: string;
  /** `$expire`, em segundos. No passado, a instrucao apaga o cookie. */
  readonly expiraEm: number;
  readonly caminho: string;
  /** `COOKIE_DOMAIN`: `false` e o default do legado e quer dizer "sem dominio". */
  readonly dominio: string | false;
  readonly seguro: boolean;
  readonly somenteHttp: boolean;
}

/** Os argumentos de `wp_die()` que este caminho passa. */
export interface ArgumentosDaMorte {
  readonly response?: number;
  readonly exit?: boolean;
}

/**
 * O que a requisicao faz quando o legado a encerra: `wp_redirect()` ou
 * `wp_safe_redirect()` seguido de `die`, ou `wp_die()`. Os cookies vao junto
 * porque o legado os emite **antes** de encerrar.
 */
export type RespostaDaRecuperacao =
  | {
      readonly tipo: 'redirecionar';
      readonly url: string;
      /** `wp_safe_redirect()` (verdadeiro) ou `wp_redirect()` (falso): a validacao de destino e da borda. */
      readonly seguro: boolean;
      readonly cookies: readonly InstrucaoDeCookie[];
    }
  | {
      readonly tipo: 'morrer';
      /** O `$message` de `wp_die()`: texto, ou o `WP_Error` inteiro. */
      readonly conteudo: string | ErroDaRecuperacao;
      readonly titulo: string;
      readonly argumentos: ArgumentosDaMorte;
      readonly cookies: readonly InstrucaoDeCookie[];
    };

/**
 * As constantes do `wp-config.php` que este caminho le. `undefined` e o
 * `! defined()` do legado.
 */
export interface ConstantesDaRecuperacao {
  /** `WP_RECOVERY_MODE_SESSION_ID` (`class-wp-recovery-mode.php:103`). */
  readonly WP_RECOVERY_MODE_SESSION_ID?: string;
  /** `RECOVERY_MODE_EMAIL` (`class-wp-recovery-mode-email-service.php:248`). */
  readonly RECOVERY_MODE_EMAIL?: string;
  /** `AUTH_KEY` (`class-wp-recovery-mode-cookie-service.php:213`). */
  readonly AUTH_KEY?: string;
  /** `AUTH_SALT` (`:228`). */
  readonly AUTH_SALT?: string;
  /**
   * `RECOVERY_MODE_COOKIE`, **ja resolvida**: `'wordpress_rec_' . COOKIEHASH`
   * quando a instalacao nao declara a sua (`default-constants.php:336`-`:340`).
   */
  readonly RECOVERY_MODE_COOKIE: string;
  /** `COOKIEPATH`. */
  readonly COOKIEPATH: string;
  /** `SITECOOKIEPATH`. */
  readonly SITECOOKIEPATH: string;
  /** `COOKIE_DOMAIN` — `false` por omissao. */
  readonly COOKIE_DOMAIN: string | false;
  /** `WP_PLUGIN_DIR` (`class-wp-recovery-mode.php:358`). */
  readonly WP_PLUGIN_DIR?: string;
  /** `WP_SANDBOX_SCRAPING` (`class-wp-fatal-error-handler.php:32`). */
  readonly WP_SANDBOX_SCRAPING?: unknown;
  /** `WP_DISABLE_FATAL_ERROR_HANDLER` (`error-protection.php:109`). */
  readonly WP_DISABLE_FATAL_ERROR_HANDLER?: unknown;
  /**
   * `__( 'put your unique phrase here' )` no idioma da instalacao
   * (`class-wp-recovery-mode-cookie-service.php:209`). Ausente, so a frase
   * original conta como chave de fabrica.
   */
  readonly frasePadraoTraduzida?: string;
}

/** O que a instalacao responde, e que nao e constante. */
export interface InstalacaoNaRecuperacao {
  /** `is_multisite()`. */
  readonly emRede: boolean;
  /** `wp_installing()`. */
  readonly instalando: boolean;
  /** `wp_is_maintenance_mode()` — o marcador e de T009. */
  readonly emManutencao: boolean;
  /** `$wp_theme_directories`, na ordem de registro. */
  readonly pastasDeTemas: readonly string[];
  /** `wp_get_active_network_plugins()` — caminhos **absolutos** (`ms-load.php:52`). */
  pluginsAtivosNaRede(): readonly string[];
  /**
   * `WP_CONTENT_DIR . '/fatal-error-handler.php'` legivel e devolvendo objeto
   * com `handle()` (`error-protection.php:87`-`:91`): o substituto assume o
   * tratamento inteiro, e nada deste fluxo acontece (UC-36, fluxo
   * alternativo).
   */
  readonly tratadorSubstituto: boolean;
  /** `WP_CONTENT_DIR . '/php-error.php'` legivel (`class-wp-fatal-error-handler.php:147`). */
  readonly telaDeErroSubstituta: boolean;
}

/** A requisicao, como o legado a le das superglobais. */
export interface PedidoNaRecuperacao {
  /** `$GLOBALS['pagenow']`; `undefined` e o `! isset()`. */
  readonly pagina?: string;
  /** `is_admin()`. */
  readonly naAreaAdministrativa: boolean;
  /** `wp_doing_ajax()`. */
  readonly pedidoAjax: boolean;
  /** `$_REQUEST['action']`; `undefined` e o `! isset()`. */
  readonly acaoDoPedido?: unknown;
  /** `$_GET`. */
  readonly consulta: { readonly [nome: string]: unknown };
  /** `$_COOKIE[ RECOVERY_MODE_COOKIE ]`. */
  readonly cookie?: string;
  /** `is_ssl()`. */
  readonly cifrado: boolean;
  /** `$_SERVER['HTTP_HOST']`. */
  readonly host: string;
  /** `$_SERVER['REQUEST_URI']`. */
  readonly caminho: string;
  /** `headers_sent()` — muda durante a requisicao, por isso e funcao. */
  cabecalhosEnviados(): boolean;
}

/** Os enderecos e opcoes do site que o aviso e as saidas usam, ja resolvidos. */
export interface SiteNaRecuperacao {
  /** `wp_login_url()`. */
  readonly enderecoDeEntrada: string;
  /** `home_url( '/' )`. */
  readonly enderecoInicial: string;
  /** `home_url( $_SERVER['REQUEST_URI'] )`. */
  readonly enderecoDaPagina: string;
  /** `admin_url()`. */
  readonly enderecoDoPainel: string;
  /** `wp_get_referer()`. */
  readonly referencia: string | false;
  /** `is_user_logged_in()`. */
  readonly conectado: boolean;
  /** `get_option( 'blogname' )`, como esta na coluna. */
  readonly nome: string;
  /** `get_option( 'admin_email' )`. */
  readonly emailDoAdministrador: string;
  /** `get_bloginfo( 'version' )`. */
  readonly versaoDoNucleo: string;
  /** `PHP_VERSION`, como o ambiente a declara. */
  readonly versaoDoPhp: string;
}

/** O cabecalho de um plugin, so os dois campos que o aviso le. */
export interface DadosDoPlugin {
  readonly Name: string;
  readonly Version: string;
}

/** A API de extensoes, que e de BC-10. */
export interface ExtensoesNaRecuperacao {
  /** `get_plugins()`: arquivo principal relativo, na ordem do legado. */
  plugins(): ReadonlyMap<string, DadosDoPlugin>;
  /** `wp_get_theme( $slug )`: `exists()` e `display( 'Name' )`. */
  tema(slug: string): { readonly existe: boolean; readonly nomeExibido: string };
  /** `wp_get_theme()->get( 'Name' )` e `->get( 'Version' )`. */
  readonly temaAtivo: { readonly nome: string; readonly versao: string };
  /** `plugin_basename( $arquivo )`. */
  nomeBaseDoPlugin(arquivo: string): string;
}

/** As funcoes de formatacao, que sao de `plataforma/formatacao/` (feature `015`). */
export interface FormatacaoNaRecuperacao {
  /** `is_email( $valor )`, como verdade do PHP. */
  ehEmail(valor: string): boolean;
  /** `wp_specialchars_decode( $texto, $aspas )`. */
  decodificarCaracteresEspeciais(
    texto: string,
    aspas: 'ENT_QUOTES' | 'ENT_NOQUOTES',
  ): string;
  /** `wp_strip_all_tags( $texto )`. */
  removerTodasAsTags(texto: string): string;
  /** `human_time_diff( $de, $ate )`. */
  diferencaHumanaDeTempo(de: number, ate: number): string;
  /** `add_query_arg( $argumentos, $base )`. */
  acrescentarConsulta(
    base: string,
    argumentos: { readonly [nome: string]: string },
  ): string;
}

/** A fila agendada, que e da feature `011`. */
export interface AgendamentoNaRecuperacao {
  /** `wp_next_scheduled( $evento )`. */
  proximo(evento: string): number | false;
  /** `wp_schedule_event( $instante, $recorrencia, $evento )`. */
  agendar(instante: number, recorrencia: string, evento: string): void;
}

/** `switch_to_locale( get_locale() )` e `restore_previous_locale()`. */
export interface IdiomaNaRecuperacao {
  trocarParaIdiomaDoSite(): boolean;
  restaurar(): void;
}

/**
 * Os pontos de extensao deste caminho. Nomeados e opcionais pela mesma razao
 * dos de US-1: o barramento que os dispara nao existe nesta arvore (`REQ-162`
 * esta em `do-not-rewrite.md`), e ponto sem interceptador e no-op no legado. O
 * nome do legado esta em cada campo (P2).
 */
export interface GanchosDaRecuperacao {
  /** `recovery_mode_email_rate_limit` (`class-wp-recovery-mode.php:307`). */
  readonly aoLimitarAvisos?: (limite: number) => number;
  /** `recovery_mode_email_link_ttl` (`:331`). */
  readonly aoDefinirPrazoDoLink?: (validoPor: number) => number;
  /** `recovery_mode_cookie_length` (`class-wp-recovery-mode-cookie-service.php:46` e `:99`). */
  readonly aoDefinirPrazoDoCookie?: (prazo: number) => number;
  /** `recovery_mode_begin_url` (`class-wp-recovery-mode-link-service.php:128`). */
  readonly aoMontarEnderecoDeRecuperacao?: (
    url: string,
    token: string,
    chave: string,
  ) => string;
  /** A acao `generate_recovery_mode_key` (`class-wp-recovery-mode-key-service.php:65`). */
  readonly aoGerarChave?: (token: string, chave: string) => void;
  /** `recovery_email_support_info` (`class-wp-recovery-mode-email-service.php:141`). */
  readonly aoMontarSuporteDoAviso?: (mensagem: string) => string;
  /** `recovery_email_debug_info` (`:150`): pares chave-texto, na ordem. */
  readonly aoMontarDepuracaoDoAviso?: (
    depuracao: readonly (readonly [string, string])[],
  ) => readonly (readonly [string, string])[];
  /** `recovery_mode_email` (`:223`). */
  readonly aoMontarAviso?: (
    email: AvisoDeRecuperacao,
    url: string,
  ) => AvisoDeRecuperacao;
  /** `is_protected_endpoint` (`load.php:1208`) — o retorno passa por `(bool)`. */
  readonly aoPerguntarSeEndpointProtegido?: (protegido: false) => unknown;
  /** `wp_protected_ajax_actions` (`load.php:1248`) — o retorno passa por `(array)`. */
  readonly aoListarAcoesAjaxProtegidas?: (acoes: readonly string[]) => unknown;
  /** `wp_should_handle_php_error` (`class-wp-fatal-error-handler.php:125`) — passa por `(bool)`. */
  readonly aoPerguntarSeTrataErro?: (trata: false, erro: ErroFatal) => unknown;
  /** `wp_php_error_message` (`:224`). */
  readonly aoMontarMensagemDeErro?: (mensagem: string, erro: ErroFatal) => string;
  /** `wp_php_error_args` (`:235`). */
  readonly aoMontarArgumentosDeErro?: (
    argumentos: ArgumentosDaMorte,
    erro: ErroFatal,
  ) => ArgumentosDaMorte;
  /** `wp_fatal_error_handler_enabled` (`error-protection.php:139`). */
  readonly aoPerguntarSeTratadorLigado?: (ligado: boolean) => unknown;
}

/**
 * O arranjo `$email` que o legado monta e passa ao filtro
 * `recovery_mode_email` (`class-wp-recovery-mode-email-service.php:197`), com
 * os nomes e os tipos dele: `to`, `headers` e `attachments` podem ser texto ou
 * lista.
 */
export interface AvisoDeRecuperacao {
  readonly to: string | readonly string[];
  readonly subject: string;
  readonly message: string;
  readonly headers: string | readonly string[];
  readonly attachments: string | readonly string[];
}

/** Tudo o que as operacoes de US-12 recebem por chamada. */
export interface ContextoDaRecuperacao {
  /** `time()`. Chamado em cada ponto em que o legado chama. */
  instante(): number;
  /** `wp_generate_password( $comprimento, $especiais, $extras )`. */
  gerarSenha(comprimento: number, especiais: boolean, extras: boolean): string;
  /** `wp_fast_hash( $chave )` — texto opaco para a coluna. */
  resumirChave(chave: string): string;
  /**
   * `validate_recovery_mode_key( $token, $chave, $prazo )` — **T027**. Ver o
   * cabecalho: esta tarefa chama, nao implementa.
   */
  validarChave(
    token: unknown,
    chave: unknown,
    prazo: number,
  ): true | ErroDaRecuperacao;
  /** `wp_verify_nonce( $valor, $acao )`, como verdade do PHP. */
  verificarNonce(acao: string, valor: string): boolean;
  readonly constantes: ConstantesDaRecuperacao;
  readonly instalacao: InstalacaoNaRecuperacao;
  readonly pedido: PedidoNaRecuperacao;
  readonly site: SiteNaRecuperacao;
  readonly extensoes: ExtensoesNaRecuperacao;
  readonly formatacao: FormatacaoNaRecuperacao;
  readonly agendamento: AgendamentoNaRecuperacao;
  readonly idioma?: IdiomaNaRecuperacao;
  readonly ganchos?: GanchosDaRecuperacao;
}
