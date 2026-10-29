/**
 * Onde o erro fatal aciona a recuperacao: `is_protected_endpoint()` e
 * `is_protected_ajax_action()` (`wp-includes/load.php:1180` e `:1218`).
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — **CA-12.4**
 * (*"erro fatal em area publica nao aciona a recuperacao"*) e `A11`
 * (BR-MIGRAR-055, ancora `class-wp-recovery-mode.php:172`).
 *
 * Tres areas sao protegidas de fabrica, nesta ordem: a tela de entrada
 * (`wp-login.php`), o painel **fora** de Ajax, e nove acoes de Ajax que
 * *"could help resolve a fatal error"*. Todo o resto — e isso inclui o site
 * publico, a API REST e o Ajax que nao esta na lista — so e protegido se o
 * ponto `is_protected_endpoint` disser que e.
 *
 * ⚠️ **O ponto de extensao so e consultado quando as tres falham** (`:1208`):
 * um interceptador **nao consegue desproteger** a tela de entrada nem o painel.
 * E o ponto recebe sempre `false`, nunca o resultado das tres.
 */

import type { ContextoDaRecuperacao } from './contexto-da-recuperacao.js';
import { verdadeiroNoPhp } from '../instalacao/texto-como-no-php.js';

/**
 * As nove acoes de Ajax protegidas de fabrica, na ordem do legado
 * (`load.php:1227`-`:1237`). O valor e o parametro `action`, logo contrato
 * publico (P8).
 */
export const ACOES_AJAX_PROTEGIDAS: readonly string[] = [
  'edit-theme-plugin-file',
  'heartbeat',
  'install-plugin',
  'install-theme',
  'search-plugins',
  'search-install-plugins',
  'update-plugin',
  'update-theme',
  'activate-plugin',
];

/** `'wp-login.php'` — a tela de entrada, primeira area protegida (`load.php:1182`). */
export const PAGINA_DE_ENTRADA = 'wp-login.php';

/** `is_protected_endpoint()` (`wp-includes/load.php:1180`-`:1209`). */
export function endpointProtegido(contexto: ContextoDaRecuperacao): boolean {
  const { pedido } = contexto;
  if (pedido.pagina === PAGINA_DE_ENTRADA) {
    return true;
  }
  if (pedido.naAreaAdministrativa && !pedido.pedidoAjax) {
    return true;
  }
  if (acaoAjaxProtegida(contexto)) {
    return true;
  }
  const aoPerguntar = contexto.ganchos?.aoPerguntarSeEndpointProtegido;
  return aoPerguntar === undefined ? false : verdadeiroNoPhp(aoPerguntar(false));
}

/** `is_protected_ajax_action()` (`wp-includes/load.php:1218`-`:1255`). */
export function acaoAjaxProtegida(contexto: ContextoDaRecuperacao): boolean {
  const { pedido } = contexto;
  if (!pedido.pedidoAjax) {
    return false;
  }
  if (pedido.acaoDoPedido === undefined || pedido.acaoDoPedido === null) {
    return false;
  }
  const aoListar = contexto.ganchos?.aoListarAcoesAjaxProtegidas;
  const acoes =
    aoListar === undefined
      ? ACOES_AJAX_PROTEGIDAS
      : comoListaDoPhp(aoListar(ACOES_AJAX_PROTEGIDAS));
  // `in_array( ..., true )`: comparacao estrita, logo `action[]=heartbeat` nao passa.
  return acoes.some((acao) => acao === pedido.acaoDoPedido);
}

/** O `(array)` do PHP sobre o retorno de um filtro. */
function comoListaDoPhp(valor: unknown): readonly unknown[] {
  if (valor === null || valor === undefined) {
    return [];
  }
  if (Array.isArray(valor)) {
    return valor;
  }
  if (typeof valor === 'object') {
    return Object.values(valor);
  }
  return [valor];
}
