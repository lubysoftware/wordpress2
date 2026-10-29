/**
 * As funcoes publicadas de registrar e enfileirar — o que tema e extensao
 * chamam, em `wp-includes/functions.wp-scripts.php` e
 * `wp-includes/functions.wp-styles.php`.
 *
 * Entrega de **T023** (US-11). Cada funcao recebe o registro da requisicao por
 * argumento, no lugar do global que `wp_scripts()` (`functions.wp-scripts.php:20`)
 * e `wp_styles()` (`functions.wp-styles.php:20`) criam sob demanda.
 *
 * | funcao do legado | ancora | aqui |
 * |---|---|---|
 * | `wp_register_script()` | `functions.wp-scripts.php:278` | {@link registrarScript} |
 * | `wp_enqueue_script()` | `functions.wp-scripts.php:473` | {@link enfileirarScript} |
 * | `wp_dequeue_script()` | `functions.wp-scripts.php:507` | {@link desenfileirarScript} |
 * | `wp_script_is()` | `functions.wp-scripts.php:528` | {@link scriptEsta} |
 * | `wp_register_style()` | `functions.wp-styles.php:129` | {@link registrarEstilo} |
 * | `wp_deregister_style()` | `functions.wp-styles.php:144` | {@link desregistrarEstilo} |
 * | `wp_enqueue_style()` | `functions.wp-styles.php:173` | {@link enfileirarEstilo} |
 * | `wp_dequeue_style()` | `functions.wp-styles.php:195` | {@link desenfileirarEstilo} |
 * | `wp_style_is()` | `functions.wp-styles.php:211` | {@link estiloEsta} |
 * | `_wp_scripts_maybe_doing_it_wrong()` | `functions.wp-scripts.php:41` | {@link avisarSeCedoDemais} |
 *
 * ## Nenhuma delas confere permissao, e isso e o legado
 *
 * Os cinco arquivos do carregador tem **zero** chamadas de `current_user_can()`:
 * registrar recurso e codigo de tema e de extensao, nao operacao de ator. E o
 * que a tabela de operacoes de `../index.ts` ja dizia para US-11 — *"nenhuma:
 * e registro de codigo, nao operacao de ator"* —, e o que
 * `PERMISSOES_DOS_RECURSOS` declara por escrito, como o **P4** cobra.
 *
 * ## O que nao foi portado, e por que
 *
 * - O quinto parametro de script, `$args` (`in_footer`, `strategy`,
 *   `fetchpriority`, `module_dependencies`), grava **dado extra**
 *   (`_wp_scripts_add_args_data()`, `functions.wp-scripts.php:92`), que este
 *   registro nao tem — ver `./registro-de-dependencias.ts`.
 * - `wp_deregister_script()` (`:367`) recusa 25 identificadores no painel
 *   conforme o ponto de extensao corrente (`current_filter()`), que e o
 *   barramento de `do-not-rewrite.md`.
 * - `wp_print_scripts()`/`wp_print_styles()` (`:167`, `functions.wp-styles.php:44`)
 *   disparam `wp_print_scripts`/`wp_print_styles` antes de processar a fila;
 *   sem barramento, o que sobra delas e {@link RegistroDeRecursos.processar}.
 * - Script em linha, traducao, `wp_localize_script()` e dado extra
 *   (`wp_add_inline_script()`, `wp_set_script_translations()`,
 *   `wp_script_add_data()`, `wp_add_inline_style()`, `wp_style_add_data()`).
 */

import type { RelatorDeUsoIndevido } from './endereco-servido.js';
import type {
  EstadoDoRecurso,
  RegistroDeRecursos,
  VersaoDoRecurso,
} from './registro-de-dependencias.js';

/**
 * A declaracao de permissao do **P4**: nenhuma operacao deste arquivo pergunta
 * capacidade, e o legado mede zero `current_user_can()` em
 * `class-wp-dependencies.php`, `class-wp-scripts.php`, `class-wp-styles.php`,
 * `functions.wp-scripts.php` e `functions.wp-styles.php`.
 */
export const PERMISSOES_DOS_RECURSOS = {
  registrar: null,
  enfileirar: null,
  desenfileirar: null,
  desregistrar: null,
  consultar: null,
  processar: null,
} as const;

/**
 * As quatro acoes cujo disparo libera registrar e enfileirar sem aviso
 * (`functions.wp-scripts.php:42`-`:43`).
 */
export const ACOES_QUE_LIBERAM_O_REGISTRO = [
  'init',
  'wp_enqueue_scripts',
  'admin_enqueue_scripts',
  'login_enqueue_scripts',
] as const;

/** O que as funcoes publicadas recebem alem do registro. */
export interface ContextoDasFuncoesPublicadas {
  /**
   * `did_action( $acao )`. Sem ela nao ha como saber se e cedo demais, e o
   * aviso nao sai — o que nao muda decisao nenhuma (P7): o legado avisa e
   * registra igual.
   */
  readonly acaoJaDisparada?: (acao: string) => boolean;
  /** Quem recebe o `_doing_it_wrong()`. */
  readonly avisar?: RelatorDeUsoIndevido;
}

/**
 * `_wp_scripts_maybe_doing_it_wrong( $function_name, $handle )`
 * (`functions.wp-scripts.php:41`): avisa quem registra ou enfileira antes das
 * quatro acoes, e **so avisa** — a funcao que o chamou segue adiante.
 */
export function avisarSeCedoDemais(
  contexto: ContextoDasFuncoesPublicadas,
  funcao: string,
  identificador = '',
): void {
  const jaDisparada = contexto.acaoJaDisparada;
  if (jaDisparada === undefined || contexto.avisar === undefined) {
    return;
  }
  if (ACOES_QUE_LIBERAM_O_REGISTRO.some((acao) => jaDisparada(acao))) {
    return;
  }

  let mensagem =
    'Scripts and styles should not be registered or enqueued until the <code>wp_enqueue_scripts</code>, <code>admin_enqueue_scripts</code>, or <code>login_enqueue_scripts</code> hooks.';
  // `if ( $handle )`: `''` e `'0'` sao falsos no PHP.
  if (identificador !== '' && identificador !== '0') {
    mensagem += ` This notice was triggered by the <code>${identificador}</code> handle.`;
  }

  contexto.avisar({ funcao, mensagem, versao: '3.3.0' });
}

/** `explode( '?', $handle )[0]`. */
function semArgumentos(identificador: string): string {
  return identificador.split('?')[0] ?? '';
}

/** Texto verdadeiro no PHP: nem `''` nem `'0'`. */
function verdadeiroNoPhp(valor: string | false): valor is string {
  return valor !== false && valor !== '' && valor !== '0';
}

/**
 * `wp_register_script( $handle, $src, $deps, $ver )` (`:278`). **CA-11.1.**
 * Devolve `false` quando o identificador ja estava registrado — e o primeiro
 * registro continua valendo.
 */
export function registrarScript(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  endereco: string | false,
  dependencias: readonly string[] = [],
  versao: VersaoDoRecurso = false,
): boolean {
  avisarSeCedoDemais(contexto, 'wp_register_script', identificador);
  return registro.registrar(identificador, endereco, dependencias, versao);
}

/**
 * `wp_enqueue_script( $handle, $src, $deps, $ver )` (`:473`): registra antes
 * **so quando ha endereco**, e enfileira com o identificador como veio —
 * inclusive o `?argumentos`.
 */
export function enfileirarScript(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  endereco: string | false = '',
  dependencias: readonly string[] = [],
  versao: VersaoDoRecurso = false,
): void {
  avisarSeCedoDemais(contexto, 'wp_enqueue_script', identificador);
  if (verdadeiroNoPhp(endereco)) {
    registro.registrar(semArgumentos(identificador), endereco, dependencias, versao);
  }
  registro.enfileirar(identificador);
}

/** `wp_dequeue_script( $handle )` (`:507`). */
export function desenfileirarScript(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
): void {
  avisarSeCedoDemais(contexto, 'wp_dequeue_script', identificador);
  registro.desenfileirar(identificador);
}

/** `wp_script_is( $handle, $status = 'enqueued' )` (`:528`). */
export function scriptEsta(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  estado: EstadoDoRecurso = 'enqueued',
): boolean {
  avisarSeCedoDemais(contexto, 'wp_script_is', identificador);
  return Boolean(registro.consultar(identificador, estado));
}

/**
 * `wp_register_style( $handle, $src, $deps, $ver, $media = 'all' )`
 * (`functions.wp-styles.php:129`). **CA-11.1.** A midia vai no argumento livre
 * do recurso.
 */
export function registrarEstilo(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  endereco: string | false,
  dependencias: readonly string[] = [],
  versao: VersaoDoRecurso = false,
  midia = 'all',
): boolean {
  avisarSeCedoDemais(contexto, 'wp_register_style', identificador);
  return registro.registrar(identificador, endereco, dependencias, versao, midia);
}

/** `wp_deregister_style( $handle )` (`functions.wp-styles.php:144`). */
export function desregistrarEstilo(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
): void {
  avisarSeCedoDemais(contexto, 'wp_deregister_style', identificador);
  registro.desregistrar(identificador);
}

/**
 * `wp_enqueue_style( $handle, $src, $deps, $ver, $media = 'all' )`
 * (`functions.wp-styles.php:173`). Mesma regra do script: registra so com
 * endereco verdadeiro.
 */
export function enfileirarEstilo(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  endereco: string | false = '',
  dependencias: readonly string[] = [],
  versao: VersaoDoRecurso = false,
  midia = 'all',
): void {
  avisarSeCedoDemais(contexto, 'wp_enqueue_style', identificador);
  if (verdadeiroNoPhp(endereco)) {
    registro.registrar(semArgumentos(identificador), endereco, dependencias, versao, midia);
  }
  registro.enfileirar(identificador);
}

/** `wp_dequeue_style( $handle )` (`functions.wp-styles.php:195`). */
export function desenfileirarEstilo(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
): void {
  avisarSeCedoDemais(contexto, 'wp_dequeue_style', identificador);
  registro.desenfileirar(identificador);
}

/** `wp_style_is( $handle, $status = 'enqueued' )` (`functions.wp-styles.php:211`). */
export function estiloEsta(
  registro: RegistroDeRecursos,
  contexto: ContextoDasFuncoesPublicadas,
  identificador: string,
  estado: EstadoDoRecurso = 'enqueued',
): boolean {
  avisarSeCedoDemais(contexto, 'wp_style_is', identificador);
  return Boolean(registro.consultar(identificador, estado));
}
