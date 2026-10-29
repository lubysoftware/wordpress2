/**
 * O tratador de erro fatal — `WP_Fatal_Error_Handler`
 * (`wp-includes/class-wp-fatal-error-handler.php`) e o registro dele
 * (`wp_register_fatal_error_handler()`, `error-protection.php:81`).
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — e por aqui que o
 * erro chega a `handle_error()` (CA-12.1, CA-12.3, CA-12.4) e e daqui que sai
 * a tela que o ator ve.
 *
 * ## O caminho, na ordem de `handle()` (`:31`-`:65`)
 *
 * 1. `WP_SANDBOX_SCRAPING` verdadeira → nada (`:32`);
 * 2. **atualizacao em curso** (`wp_is_maintenance_mode()`) → nada (`:37`): o
 *    erro de uma extensao no meio da propria atualizacao nao pausa ninguem;
 * 3. nenhum erro, ou erro que nao conta → nada (`:43`-`:46`);
 * 4. **so fora de rede e so com o modo inicializado** o erro vai para
 *    `handle_error()` (`:54`) — em rede, nunca;
 * 5. no painel, ou com os cabecalhos ainda por enviar, a tela de erro
 *    (`:59`-`:61`), que e `php-error.php` quando existe.
 *
 * Qualquer excecao no caminho e engolida (`:62`-`:64`, *"Catch exceptions and
 * remain silent"*). ⚠️ O legado so engole `Exception`, nao `Error`; o runtime do
 * alvo nao tem essa distincao, e aqui tudo e engolido — e o modo de falha mais
 * proximo, e o P7 o descreve: falha silenciosa e comportamento.
 *
 * ## A tela entra como dado
 *
 * `wp_die()` nao e chamado: a mensagem, o titulo e os argumentos voltam no
 * desfecho, e quem monta HTML e a borda. O que e desta tarefa e **qual**
 * mensagem, porque ela diz ao ator se o modo foi acionado.
 */

import { verdadeiroNoPhp } from '../instalacao/texto-como-no-php.js';
import type { SessaoDeRecuperacao } from '../configuracao/index.js';
import type { PortaDeEmail } from '../portas/index.js';
import type {
  ArgumentosDaMorte,
  ContextoDaRecuperacao,
  ErroDaRecuperacao,
  ErroFatal,
  EstadoDaRecuperacao,
  RespostaDaRecuperacao,
} from './contexto-da-recuperacao.js';
import { endpointProtegido } from './endpoint-protegido.js';
import { deveTratarErro } from './extensao-do-erro.js';
import { tratadorLigado, tratarErroNaRecuperacao } from './modo-de-recuperacao.js';

/** `:188` — o modo foi acionado **nesta** sessao. */
export const MENSAGEM_DE_ERRO_EM_RECUPERACAO =
  'There has been a critical error on this website, putting it in recovery mode. Please check the Themes and Plugins screens for more details. If you just installed or updated a theme or plugin, check the relevant page for that first.';

/** `:191` — area protegida em rede. */
export const MENSAGEM_DE_ERRO_EM_REDE =
  'There has been a critical error on this website. Please reach out to your site administrator, and inform them of this error for further assistance.';

/** `:193`-`:197` — area protegida em site unico: *"check your site admin email inbox"*. */
export const MENSAGEM_DE_ERRO_COM_AVISO =
  'There has been a critical error on this website. Please check your site admin email inbox for instructions. If you continue to have problems, please try the <a href="https://wordpress.org/support/forums/">support forums</a>.';

/** `:200` — o resto, inclusive todo erro em area publica. */
export const MENSAGEM_DE_ERRO_CRITICO = 'There has been a critical error on this website.';

/** `:207` e `:208`. */
export const ENDERECO_DE_SOLUCAO_DE_PROBLEMAS =
  'https://wordpress.org/documentation/article/faq-troubleshooting/';
export const ROTULO_DE_SOLUCAO_DE_PROBLEMAS = 'Learn more about troubleshooting WordPress.';

/** `'internal_server_error'` (`:238`). */
export const CODIGO_DO_ERRO_INTERNO = 'internal_server_error';

/** O que `handle()` faz com o erro. `tratado` e o `$handled` do legado. */
export type DesfechoDoErroFatal =
  | { readonly tipo: 'ignorado' }
  | { readonly tipo: 'encerrado'; readonly resposta: RespostaDaRecuperacao }
  | {
      readonly tipo: 'tela';
      readonly tratado: false | true | ErroDaRecuperacao;
      /** `php-error.php` assumiu a tela (`:148`-`:151`): nada abaixo vale. */
      readonly substituta: boolean;
      readonly erro: ErroDaRecuperacao;
      readonly argumentos: ArgumentosDaMorte;
    }
  | { readonly tipo: 'sem-tela'; readonly tratado: false | true | ErroDaRecuperacao };

/**
 * Quem trata o erro fatal: ninguem, o substituto de `wp-content/` ou o do
 * nucleo (`error-protection.php:81`-`:96`). Com o substituto, **nada** de
 * US-12 acontece — UC-36, fluxo alternativo *"um arquivo substituto assume o
 * tratamento de erro"*.
 */
export function tratadorRegistrado(
  contexto: ContextoDaRecuperacao,
): 'nenhum' | 'substituto' | 'nucleo' {
  if (!tratadorLigado(contexto)) {
    return 'nenhum';
  }
  return contexto.instalacao.tratadorSubstituto ? 'substituto' : 'nucleo';
}

/** `WP_Fatal_Error_Handler::handle()` sobre o erro que a borda capturou. Ver o cabecalho. */
export function tratarErroFatal(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  email: PortaDeEmail,
  estado: EstadoDaRecuperacao,
  erro: ErroFatal | null,
): DesfechoDoErroFatal {
  const raspagem = contexto.constantes.WP_SANDBOX_SCRAPING;
  if (raspagem !== undefined && verdadeiroNoPhp(raspagem)) {
    return { tipo: 'ignorado' };
  }
  if (contexto.instalacao.emManutencao) {
    return { tipo: 'ignorado' };
  }

  try {
    if (erro === null || !deveTratarErro(contexto, erro)) {
      return { tipo: 'ignorado' };
    }

    let tratado: false | true | ErroDaRecuperacao = false;
    if (!contexto.instalacao.emRede && estado.inicializado) {
      const desfecho = tratarErroNaRecuperacao(contexto, sessao, email, estado, erro);
      if (desfecho !== true && 'tipo' in desfecho) {
        return { tipo: 'encerrado', resposta: desfecho };
      }
      tratado = desfecho;
    }

    if (contexto.pedido.naAreaAdministrativa || !contexto.pedido.cabecalhosEnviados()) {
      return telaDeErro(contexto, estado, erro, tratado);
    }
    return { tipo: 'sem-tela', tratado };
  } catch {
    return { tipo: 'ignorado' };
  }
}

/**
 * `display_error_template()` e `display_default_error_template()`
 * (`:144`-`:246`).
 */
function telaDeErro(
  contexto: ContextoDaRecuperacao,
  estado: EstadoDaRecuperacao,
  erro: ErroFatal,
  tratado: false | true | ErroDaRecuperacao,
): DesfechoDoErroFatal {
  const argumentosDeFabrica: ArgumentosDaMorte = { response: 500, exit: false };

  if (contexto.instalacao.telaDeErroSubstituta) {
    return {
      tipo: 'tela',
      tratado,
      substituta: true,
      erro: { codigo: CODIGO_DO_ERRO_INTERNO, mensagem: '', dado: { error: erro } },
      argumentos: argumentosDeFabrica,
    };
  }

  let mensagem: string;
  if (tratado === true && estado.ativo) {
    mensagem = MENSAGEM_DE_ERRO_EM_RECUPERACAO;
  } else if (endpointProtegido(contexto) && estado.inicializado) {
    mensagem = contexto.instalacao.emRede
      ? MENSAGEM_DE_ERRO_EM_REDE
      : MENSAGEM_DE_ERRO_COM_AVISO;
  } else {
    mensagem = MENSAGEM_DE_ERRO_CRITICO;
  }

  mensagem = `<p>${mensagem}</p><p><a href="${ENDERECO_DE_SOLUCAO_DE_PROBLEMAS}">${ROTULO_DE_SOLUCAO_DE_PROBLEMAS}</a></p>`;

  const { ganchos } = contexto;
  mensagem = ganchos?.aoMontarMensagemDeErro?.(mensagem, erro) ?? mensagem;
  const argumentos =
    ganchos?.aoMontarArgumentosDeErro?.(argumentosDeFabrica, erro) ?? argumentosDeFabrica;

  return {
    tipo: 'tela',
    tratado,
    substituta: false,
    erro: { codigo: CODIGO_DO_ERRO_INTERNO, mensagem, dado: { error: erro } },
    argumentos,
  };
}
