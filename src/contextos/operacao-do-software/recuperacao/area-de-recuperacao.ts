/**
 * A composicao do modo de recuperacao sobre a sessao de T002 e a porta de
 * e-mail.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` (US-12). Compor nao
 * le nada, nao grava nada e nao manda e-mail (`EXT-ORDEM`): as duas
 * dependencias sao guardadas e cada operacao recebe o contexto da requisicao.
 */

import type { SessaoDeRecuperacao } from '../configuracao/index.js';
import type { PortaDeEmail } from '../portas/index.js';
import type {
  ContextoDaRecuperacao,
  ErroFatal,
  EstadoDaRecuperacao,
  RespostaDaRecuperacao,
} from './contexto-da-recuperacao.js';
import {
  pluginsQueCarregam,
  temasQueCarregam,
  type ListaSemPausadas,
} from './extensoes-pausadas.js';
import {
  atenderSaidaDaRecuperacao,
  inicializarRecuperacao,
  sairDaRecuperacao,
  tratarErroNaRecuperacao,
  type DesfechoDoErroNaRecuperacao,
  type InicializacaoDaRecuperacao,
  type SaidaDaRecuperacao,
} from './modo-de-recuperacao.js';
import { tratarErroFatal, type DesfechoDoErroFatal } from './tratador-de-erro-fatal.js';

export interface AreaDeRecuperacao {
  /** `initialize()`, com o portao de `wp-settings.php:573`. */
  inicializar(contexto: ContextoDaRecuperacao): InicializacaoDaRecuperacao;
  /** `WP_Fatal_Error_Handler::handle()`, no desligamento da requisicao. */
  tratarErroFatal(
    contexto: ContextoDaRecuperacao,
    estado: EstadoDaRecuperacao,
    erro: ErroFatal | null,
  ): DesfechoDoErroFatal;
  /** `handle_error()` sozinho, como `wp_recovery_mode()->handle_error()`. */
  tratarErro(
    contexto: ContextoDaRecuperacao,
    estado: EstadoDaRecuperacao,
    erro: ErroFatal,
  ): DesfechoDoErroNaRecuperacao;
  /** `exit_recovery_mode()` — o que `wp_logout` chama. */
  sair(contexto: ContextoDaRecuperacao, estado: EstadoDaRecuperacao): SaidaDaRecuperacao;
  /** `handle_exit_recovery_mode()` — `wp-login.php?action=exit_recovery_mode`. */
  atenderSaida(
    contexto: ContextoDaRecuperacao,
    estado: EstadoDaRecuperacao,
  ): RespostaDaRecuperacao | null;
  /** Os plugins ativos menos os pausados na sessao (`load.php:1044`). */
  pluginsQueCarregam(
    contexto: ContextoDaRecuperacao,
    estado: EstadoDaRecuperacao,
    plugins: readonly string[],
  ): ListaSemPausadas;
  /** Os temas ativos menos os pausados na sessao (`load.php:1115`). */
  temasQueCarregam(
    estado: EstadoDaRecuperacao,
    temas: readonly string[],
  ): ListaSemPausadas & { readonly semTemas: boolean };
}

export function criarAreaDeRecuperacao(
  sessao: SessaoDeRecuperacao,
  email: PortaDeEmail,
): AreaDeRecuperacao {
  return {
    inicializar: (contexto) => inicializarRecuperacao(contexto, sessao),
    tratarErroFatal: (contexto, estado, erro) =>
      tratarErroFatal(contexto, sessao, email, estado, erro),
    tratarErro: (contexto, estado, erro) =>
      tratarErroNaRecuperacao(contexto, sessao, email, estado, erro),
    sair: (contexto, estado) => sairDaRecuperacao(contexto, sessao, estado),
    atenderSaida: (contexto, estado) => atenderSaidaDaRecuperacao(contexto, sessao, estado),
    pluginsQueCarregam: (contexto, estado, plugins) =>
      pluginsQueCarregam(sessao, estado, contexto.extensoes, plugins),
    temasQueCarregam: (estado, temas) => temasQueCarregam(sessao, estado, temas),
  };
}
