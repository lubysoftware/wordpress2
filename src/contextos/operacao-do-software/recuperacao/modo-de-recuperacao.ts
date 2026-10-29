/**
 * O modo de recuperacao de uma requisicao — `WP_Recovery_Mode`
 * (`wp-includes/class-wp-recovery-mode.php`) e o caminho de entrada
 * (`WP_Recovery_Mode_Link_Service::handle_begin_link()`).
 *
 * Entrega de **T025** da feature `010-operacao-do-software` (US-12):
 *
 * | criterio | funcao | legado |
 * |---|---|---|
 * | CA-12.1 | {@link tratarErroNaRecuperacao} | `handle_error()`, `:168` |
 * | CA-12.2 | {@link inicializarRecuperacao} | `initialize()`, `:92`, e `handle_begin_link()`, `class-wp-recovery-mode-link-service.php:73` |
 * | CA-12.3 | {@link tratarErroNaRecuperacao}, ramo ativo | `store_error()`, `:432`, e `redirect_protected()`, `:461` |
 * | CA-12.4 | {@link tratarErroNaRecuperacao}, ramo inativo | `:177` |
 * | CA-12.5 | {@link sairDaRecuperacao} e {@link atenderSaidaDaRecuperacao} | `exit_recovery_mode()`, `:206`, e `handle_exit_recovery_mode()`, `:225` |
 * | CA-12.6 | `./aviso-de-recuperacao.ts` | `maybe_send_recovery_mode_email()` |
 *
 * ## A maquina de estado, do jeito que o legado a tem
 *
 * Nao ha estado gravado de "modo ativo". Cada requisicao decide de novo em
 * `initialize()`, nesta ordem, e a primeira que responde vence:
 *
 * 1. `WP_RECOVERY_MODE_SESSION_ID` declarada → ativo, com essa sessao (`:103`);
 * 2. cookie presente → valido e ativo, ou **invalido e a requisicao morre** com
 *    `403` e o cookie apagado (`:110`, `:270`-`:290`);
 * 3. senao, o caminho de entrada: se a requisicao e o link do aviso, a chave e
 *    verificada (T027), o cookie e gravado e a requisicao e redirecionada para
 *    a tela de entrada com `action=entered_recovery_mode` (`:116`).
 *
 * *"Encerrar ao fim de uma semana"* (UT-117-8) e o passo 2: o cookie vencido e
 * recusado na validacao com `expired`, apagado, e a requisicao morre — **a
 * pausa nao e apagada**. A opcao `{sessao}_paused_extensions` fica, orfa, ate
 * alguem sair da recuperacao com aquela sessao, o que ja nao e possivel. O
 * legado aceita isso, e o P5 manda reproduzir o que fica orfao.
 *
 * ## O que nao esta aqui
 *
 * - **Registrar os tres ganchos de `initialize()`** (`:95`-`:97`): `wp_logout`
 *   chama {@link sairDaRecuperacao}, `login_form_exit_recovery_mode` chama
 *   {@link atenderSaidaDaRecuperacao} e o evento diario chama
 *   `clean_expired_keys()`, que e **T027**. O barramento nao existe nesta
 *   arvore; quem o compuser liga os tres.
 * - **Verificar e consumir a chave** — T027, ver `contexto-da-recuperacao.ts`.
 */

import {
  LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS,
  ACAO_DE_SAIR_DA_RECUPERACAO,
  EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO,
  prazoDoLinkDeRecuperacao,
  type SessaoDeRecuperacao,
} from '../configuracao/index.js';
import { textoComoNoPhp, verdadeiroNoPhp } from '../instalacao/texto-como-no-php.js';
import type { PortaDeEmail } from '../portas/index.js';
import {
  ACAO_DE_RECUPERACAO_INICIADA,
  ACAO_DE_ENTRAR_NA_RECUPERACAO,
  talvezAvisar,
} from './aviso-de-recuperacao.js';
import type {
  ContextoDaRecuperacao,
  ErroDaRecuperacao,
  ErroFatal,
  EstadoDaRecuperacao,
  InstrucaoDeCookie,
  RespostaDaRecuperacao,
} from './contexto-da-recuperacao.js';
import { RECUPERACAO_NAO_INICIALIZADA } from './contexto-da-recuperacao.js';
import {
  apagarCookie,
  cookieDefinido,
  gravarCookie,
  sessaoDoCookie,
  validarCookie,
} from './cookie-de-recuperacao.js';
import { PAGINA_DE_ENTRADA, endpointProtegido } from './endpoint-protegido.js';
import { extensaoDoErro, pluginDeRede, registroDoErro } from './extensao-do-erro.js';
import { pausarExtensao, retomarTodasDoTipo } from './extensoes-pausadas.js';

/** `'daily'` — a recorrencia da limpeza de chaves (`class-wp-recovery-mode.php:100`). */
export const RECORRENCIA_DA_LIMPEZA_DE_CHAVES = 'daily';

export const MENSAGEM_DE_ORIGEM_INVALIDA = 'Error not caused by a plugin or theme.';
export const MENSAGEM_DE_ENDPOINT_NAO_PROTEGIDO =
  'Error occurred on a non-protected endpoint.';
export const MENSAGEM_DE_ERRO_NAO_GUARDADO = 'Failed to store the error.';
export const MENSAGEM_DE_LINK_DE_SAIDA_VENCIDO = 'Exit recovery mode link expired.';
export const MENSAGEM_DE_SAIDA_QUE_FALHOU =
  'Failed to exit recovery mode. Please try again later.';

/** `get_email_rate_limit()` (`:299`-`:308`). Dispara o ponto a cada chamada. */
export function limiteEntreAvisos(contexto: ContextoDaRecuperacao): number {
  const aoLimitar = contexto.ganchos?.aoLimitarAvisos;
  return aoLimitar === undefined
    ? LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS
    : aoLimitar(LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS);
}

/** `get_link_ttl()` (`:317`-`:334`): o limite, o ponto do prazo, e o `max`. */
export function prazoDoLink(contexto: ContextoDaRecuperacao): number {
  const limite = limiteEntreAvisos(contexto);
  const aoDefinir = contexto.ganchos?.aoDefinirPrazoDoLink;
  const validoPor = aoDefinir === undefined ? limite : aoDefinir(limite);
  return prazoDoLinkDeRecuperacao(validoPor, limite);
}

/**
 * `wp_is_fatal_error_handler_enabled()` (`error-protection.php:108`-`:140`):
 * ligado salvo `WP_DISABLE_FATAL_ERROR_HANDLER` verdadeira, e o ponto decide
 * por ultimo.
 */
export function tratadorLigado(contexto: ContextoDaRecuperacao): boolean {
  const desligado = contexto.constantes.WP_DISABLE_FATAL_ERROR_HANDLER;
  const ligado = desligado === undefined || !verdadeiroNoPhp(desligado);
  const aoPerguntar = contexto.ganchos?.aoPerguntarSeTratadorLigado;
  return aoPerguntar === undefined ? ligado : verdadeiroNoPhp(aoPerguntar(ligado));
}

/** O que `initialize()` deixa: o estado, e a resposta quando a requisicao acaba ali. */
export interface InicializacaoDaRecuperacao {
  readonly estado: EstadoDaRecuperacao;
  readonly resposta: RespostaDaRecuperacao | null;
}

/**
 * `if ( ! is_multisite() && wp_is_fatal_error_handler_enabled() ) {
 * wp_recovery_mode()->initialize(); }` (`wp-settings.php:573`-`:576`) e
 * `initialize()` (`class-wp-recovery-mode.php:92`-`:117`).
 *
 * O ponto em que isto roda no arranque e o do legado — logo antes de carregar
 * os plugins —, e a ordem do arranque nao e decisao desta tarefa.
 */
export function inicializarRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
): InicializacaoDaRecuperacao {
  if (contexto.instalacao.emRede || !tratadorLigado(contexto)) {
    return { estado: RECUPERACAO_NAO_INICIALIZADA, resposta: null };
  }

  if (
    contexto.agendamento.proximo(EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO) === false &&
    !contexto.instalacao.instalando
  ) {
    contexto.agendamento.agendar(
      contexto.instante(),
      RECORRENCIA_DA_LIMPEZA_DE_CHAVES,
      EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO,
    );
  }

  const declarada = contexto.constantes.WP_RECOVERY_MODE_SESSION_ID;
  if (declarada !== undefined) {
    return {
      estado: { inicializado: true, ativo: true, sessaoId: declarada },
      resposta: null,
    };
  }

  const inativo: EstadoDaRecuperacao = {
    inicializado: true,
    ativo: false,
    sessaoId: '',
  };

  if (cookieDefinido(contexto)) {
    return tratarCookie(contexto, sessao, inativo);
  }

  // O argumento e avaliado antes da chamada: os dois pontos do prazo disparam
  // em toda requisicao sem cookie, mesmo fora da tela de entrada.
  const prazo = prazoDoLink(contexto);
  return { estado: inativo, resposta: abrirCaminhoDeRecuperacao(contexto, sessao, prazo) };
}

/** `handle_cookie()` (`:270`-`:290`). */
function tratarCookie(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  inativo: EstadoDaRecuperacao,
): InicializacaoDaRecuperacao {
  const validado = validarCookie(contexto, sessao);
  if (validado !== true) {
    return { estado: inativo, resposta: morrerComCookieApagado(contexto, validado) };
  }

  const sessaoId = sessaoDoCookie(contexto);
  if (typeof sessaoId !== 'string') {
    return { estado: inativo, resposta: morrerComCookieApagado(contexto, sessaoId) };
  }

  return {
    estado: { inicializado: true, ativo: true, sessaoId },
    resposta: null,
  };
}

/** `clear_cookie()`, `add_data( array( 'status' => 403 ) )` e `wp_die( $erro )`. */
function morrerComCookieApagado(
  contexto: ContextoDaRecuperacao,
  erro: ErroDaRecuperacao,
): RespostaDaRecuperacao {
  const cookies = apagarCookie(contexto);
  return {
    tipo: 'morrer',
    conteudo: { ...erro, dado: { ...erro.dado, status: 403 } },
    titulo: '',
    argumentos: {},
    cookies,
  };
}

/**
 * `handle_begin_link( $ttl )` (`class-wp-recovery-mode-link-service.php:73`-`:97`).
 *
 * So na tela de entrada, so com os tres parametros e so com a acao certa —
 * fora disso, nada acontece e a requisicao segue. A verificacao da chave e
 * **T027** e chega por {@link ContextoDaRecuperacao.validarChave}; recusada, a
 * requisicao morre com o erro e sem titulo. Aceita, o cookie e gravado e a
 * requisicao vai para a tela de entrada por `wp_redirect()` — **nao** o
 * seguro.
 */
function abrirCaminhoDeRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  prazo: number,
): RespostaDaRecuperacao | null {
  if (contexto.pedido.pagina !== PAGINA_DE_ENTRADA) {
    return null;
  }
  const { consulta } = contexto.pedido;
  const presente = (nome: string): boolean =>
    consulta[nome] !== undefined && consulta[nome] !== null;
  if (
    !presente('action') ||
    !presente('rm_token') ||
    !presente('rm_key') ||
    consulta['action'] !== ACAO_DE_ENTRAR_NA_RECUPERACAO
  ) {
    return null;
  }

  const validado = contexto.validarChave(consulta['rm_token'], consulta['rm_key'], prazo);
  if (validado !== true) {
    return { tipo: 'morrer', conteudo: validado, titulo: '', argumentos: {}, cookies: [] };
  }

  const cookies = gravarCookie(contexto, sessao);
  return {
    tipo: 'redirecionar',
    url: contexto.formatacao.acrescentarConsulta(contexto.site.enderecoDeEntrada, {
      action: ACAO_DE_RECUPERACAO_INICIADA,
    }),
    seguro: false,
    cookies,
  };
}

/**
 * O que `handle_error()` devolve: `true`, um `WP_Error`, ou — no ramo que
 * redireciona e sai — a resposta.
 */
export type DesfechoDoErroNaRecuperacao = true | ErroDaRecuperacao | RespostaDaRecuperacao;

/**
 * `handle_error( $error )` (`class-wp-recovery-mode.php:168`-`:197`).
 *
 * - Sem extensao responsavel, ou com plugin de rede: `invalid_source`.
 * - **Fora da sessao**: so em area protegida (`non_protected_endpoint` nas
 *   demais — CA-12.4), e ai o aviso, limitado (CA-12.1, CA-12.6).
 * - **Dentro da sessao**: o erro e guardado na pausa **da sessao** (CA-12.3) e
 *   a requisicao e repetida para pegar o proximo erro de uma vez, salvo se os
 *   cabecalhos ja sairam.
 */
export function tratarErroNaRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  email: PortaDeEmail,
  estado: EstadoDaRecuperacao,
  erro: ErroFatal,
): DesfechoDoErroNaRecuperacao {
  const extensao = extensaoDoErro(contexto, erro);
  if (extensao === null || pluginDeRede(contexto, extensao)) {
    return { codigo: 'invalid_source', mensagem: MENSAGEM_DE_ORIGEM_INVALIDA };
  }

  if (!estado.ativo) {
    if (!endpointProtegido(contexto)) {
      return { codigo: 'non_protected_endpoint', mensagem: MENSAGEM_DE_ENDPOINT_NAO_PROTEGIDO };
    }
    return talvezAvisar(contexto, sessao, email, limiteEntreAvisos(contexto), erro, extensao);
  }

  // `store_error()` (`:432`-`:447`) procura a extensao de novo; o resultado e o
  // mesmo, porque a entrada e a mesma.
  if (!pausarExtensao(sessao, estado, extensao.tipo, extensao.slug, registroDoErro(erro))) {
    return { codigo: 'storage_error', mensagem: MENSAGEM_DE_ERRO_NAO_GUARDADO };
  }

  if (contexto.pedido.cabecalhosEnviados()) {
    return true;
  }

  // `redirect_protected()` (`:461`-`:472`): a mesma requisicao, de novo.
  const protocolo = contexto.pedido.cifrado ? 'https://' : 'http://';
  return {
    tipo: 'redirecionar',
    url: `${protocolo}${contexto.pedido.host}${contexto.pedido.caminho}`,
    seguro: true,
    cookies: [],
  };
}

/** O que `exit_recovery_mode()` devolve, e os cookies que ele emitiu. */
export interface SaidaDaRecuperacao {
  readonly saiu: boolean;
  readonly cookies: readonly InstrucaoDeCookie[];
}

/**
 * `exit_recovery_mode()` (`class-wp-recovery-mode.php:206`-`:218`) — CA-12.5 e
 * `A12`.
 *
 * Na ordem do legado: zera o limite de avisos, apaga o cookie, retoma **todos
 * os plugins** e depois **todos os temas** da sessao. Nenhum retorno
 * intermediario e olhado: falhar em apagar o marcador nao impede a retomada.
 */
export function sairDaRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
): SaidaDaRecuperacao {
  if (!estado.ativo) {
    return { saiu: false, cookies: [] };
  }

  sessao.apagarUltimoAviso();
  const cookies = apagarCookie(contexto);
  retomarTodasDoTipo(sessao, estado, 'plugin');
  retomarTodasDoTipo(sessao, estado, 'theme');

  return { saiu: true, cookies };
}

/**
 * `handle_exit_recovery_mode()` (`class-wp-recovery-mode.php:225`-`:252`),
 * pendurado em `login_form_exit_recovery_mode`.
 *
 * 🔴 **Nao pergunta capacidade nenhuma.** A unica prova e o token
 * `exit_recovery_mode`, que a barra de administracao poe no link de saida
 * (`wp_admin_bar_recovery_mode_menu()`, `admin-bar.php:1311`). Fora da sessao,
 * so redireciona. `null` e o `return`
 * do legado: a tela de entrada segue o seu caminho.
 */
export function atenderSaidaDaRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
): RespostaDaRecuperacao | null {
  const { site } = contexto;
  let destino: string | false = site.referencia;
  if (destino === false || destino === '' || destino === '0') {
    destino = site.conectado ? site.enderecoDoPainel : site.enderecoInicial;
  }

  if (!estado.ativo) {
    return { tipo: 'redirecionar', url: destino, seguro: true, cookies: [] };
  }

  const { consulta } = contexto.pedido;
  if (consulta['action'] !== ACAO_DE_SAIR_DA_RECUPERACAO) {
    return null;
  }

  const token = consulta['_wpnonce'];
  if (
    token === undefined ||
    token === null ||
    !contexto.verificarNonce(ACAO_DE_SAIR_DA_RECUPERACAO, textoComoNoPhp(token))
  ) {
    return {
      tipo: 'morrer',
      conteudo: MENSAGEM_DE_LINK_DE_SAIDA_VENCIDO,
      titulo: '',
      argumentos: { response: 403 },
      cookies: [],
    };
  }

  const saida = sairDaRecuperacao(contexto, sessao, estado);
  if (!saida.saiu) {
    return {
      tipo: 'morrer',
      conteudo: MENSAGEM_DE_SAIDA_QUE_FALHOU,
      titulo: '',
      argumentos: {},
      cookies: saida.cookies,
    };
  }

  return { tipo: 'redirecionar', url: destino, seguro: true, cookies: saida.cookies };
}
