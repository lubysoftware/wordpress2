/**
 * **CA-1.1** aplicada, e a superficie que abre a solicitacao: o portao da tela
 * mais o ramo de criacao de `_wp_personal_data_handle_actions()`
 * (`wp-admin/includes/privacy-tools.php:73`, casos `:99` e `:100`).
 *
 * Entrega de **T003** da feature `008-privacidade-e-dados-pessoais` (US-1). E o
 * gatilho de UC-25 — *"o administrador informa um endereco de e-mail na tela de
 * exportacao ou de apagamento de dados pessoais"* — e os passos 1, 2 e 6 do
 * fluxo principal.
 *
 * ---
 *
 * # A tela nao monta HTML, e por que ela existe como dado
 *
 * `target_architecture.md` poe a montagem na borda, e o que o legado faz aqui
 * nao e montar tela: e **acumular avisos** com `add_settings_error( $setting,
 * $code, $message, $type )` e deixar que `settings_errors()` os imprima depois
 * (`wp-admin/export-personal-data.php:111`). O que esta tarefa porta e
 * exatamente isso — a lista de avisos, com o ajuste, o codigo, o texto e o tipo
 * de cada um, na **ordem em que o legado os acumula**, porque e a ordem em que
 * eles aparecem.
 *
 * ---
 *
 * # 🔴 O legado acumula MAIS DE UM aviso por envio, e isso e observavel
 *
 * Tres dos quatro portoes deste tratador **nao interrompem o fluxo**: eles
 * registram o aviso e seguem. A sequencia esta nas linhas, nesta ordem:
 *
 * | # | portao | ancora | interrompe? |
 * |---|---|---|---|
 * | 1 | campo do formulario ausente | `:103`-`:110` | **nao** |
 * | 2 | acao fora das duas | `:120`-`:127` | **nao** |
 * | 3 | nem endereco nem login existente | `:129`-`:143` | **nao** — quem interrompe e o `empty( $email_address )` de `:145` |
 * | 4 | a criacao devolveu erro | `:152`-`:166` | sim (`break` em `:165`) |
 *
 * Um envio sem `type_of_action` e sem `username_or_email_for_privacy_request`
 * produz, no legado, **tres** avisos: o do campo ausente, o da acao invalida e o
 * do endereco. Esta funcao devolve os tres, na mesma ordem.
 *
 * ⚠️ **E o portao 1 nao evita a leitura dos campos que ele acabou de declarar
 * ausentes**: `:111` e `:112` leem `$_POST['type_of_action']` e
 * `$_POST['username_or_email_for_privacy_request']` logo depois, sem guarda. No
 * PHP 8 isso emite *warning* de chave inexistente e `sanitize_text_field( null )`
 * devolve cadeia vazia; o fluxo continua com `''` nos dois. `DB-DEG`
 * (BR-MIGRAR-083) manda reproduzir a degradacao em vez da recusa, e e o que o
 * campo opcional de {@link PedidoDaTelaDeAbertura} faz.
 *
 * ---
 *
 * # 🔴 A tela pode abrir a solicitacao JA CONFIRMADA, e isso contradiz `D2`
 *
 * `if ( ! isset( $_POST['send_confirmation_email'] ) ) { $status = 'confirmed'; }`
 * (`wp-admin/includes/privacy-tools.php:116`-`:118`). O formulario traz a caixa
 * **marcada** de fabrica (`wp-admin/export-personal-data.php:130` e
 * `wp-admin/erase-personal-data.php:130`), logo o caminho normal e `pending` — e
 * e por isso que CA-1.2 (*"a solicitacao nasce num estado pendente"*) descreve o
 * que a tela faz. Mas desmarcar a caixa abre a solicitacao em
 * `request-confirmed`, **sem chave, sem e-mail e sem o titular ter autorizado
 * nada**, e dali ela e executavel (CA-5.1 e CA-6.1 pedem *"o estado
 * confirmado"*).
 *
 * `D2` / BR-MIGRAR-039 diz *"nada acontece sem confirmacao do titular"*, e
 * `UT-086-7` cobra *"trava a execucao enquanto o titular nao confirmar"*. Este
 * caminho do legado e a excecao a regra, e nao ha decisao humana registrada
 * sobre ele.
 *
 * **Esta tarefa reproduz o legado e nao decide nada**: o default e `pending`, a
 * opcao continua existindo (P8 — *"nao remova ... comportamento publicado"*), e
 * a divergencia esta registrada na secao *O que T003 encontrou* de
 * `../README.md`, junto da correcao de uma afirmacao de T002 — que dizia *"nao e
 * caminho de tela"* sobre o parametro `$status`, e e, com as duas ancoras acima.
 *
 * ---
 *
 * # O que esta funcao do legado tem e NAO esta aqui
 *
 * | o que | ancora | de quem e |
 * |---|---|---|
 * | `check_admin_referer( 'personal-data-request' )` | `:101` | e um dos **cinco atestados** do P4, nao e capacidade, e e de BC-05 / feature 001. Nomeado aqui porque a posicao dele e **antes** de tudo o mais, e porque alguem poderia conta-lo como terceira verificacao de CA-1.1 |
 * | o ramo `privacy_action_email_retry`, que reenvia | `:74`-`:94` | **T007** (US-3), CA-3.3 |
 * | `wp_send_user_request( $request_id )` | `:169` | **T005** (US-2). O ponto exato esta marcado por {@link ResultadoDaTelaDeAbertura.envioDeConfirmacaoDevido} |
 * | `_wp_personal_data_cleanup_requests()`, que a tela chama em seguida | `wp-admin/export-personal-data.php:73` | **T009** (US-4), CA-4.1 |
 * | a montagem da lista | `:101` da tela | esta em `./lista-de-solicitacoes.ts`, e e CA-1.4 |
 *
 * ⚠️ **E ha um achado que reforca a divergencia 1 do `../README.md`** (*"nada
 * move a solicitacao para o estado de falha quando o envio nao sai"*, CA-3.1): o
 * legado **descarta o retorno** de `wp_send_user_request()` em `:169` — nao ha
 * `$result =`, nao ha `is_wp_error`, e a mensagem de sucesso
 * *"Confirmation request initiated successfully."* e montada em `:171`
 * **independentemente** de o e-mail ter saido. Quem pegar T007 le isto antes de
 * decidir onde o estado de falha e escrito.
 */

import { ACOES_DE_SOLICITACAO, type ValorJson } from '../armazenamento/index.js';
import {
  abrirSolicitacao,
  ESTADO_PEDIDO_PADRAO,
  DADOS_DO_PEDIDO_PADRAO,
} from './abrir-solicitacao.js';
import type { ContextoDeAbertura } from './contexto-de-abertura.js';
import {
  autorizarAbertura,
  type RecusaDaAbertura,
  type SuperficieDeAbertura,
} from './permissao-de-abertura.js';

/** `'confirmed'` — o estado pedido quando a caixa de confirmacao vem desmarcada (`:117`). */
export const ESTADO_PEDIDO_SEM_CONFIRMACAO = 'confirmed';

/** Os dois valores de `$_POST['action']` que o `switch` atende (`:99` e `:100`). */
export const ACOES_DA_TELA_DE_ABERTURA: readonly string[] = Object.freeze([
  'add_export_personal_data_request',
  'add_remove_personal_data_request',
]);

/** O nome do nonce da tela, que **nao** e conferido aqui (`:101`). Ver o cabecalho. */
export const NONCE_DA_TELA_DE_ABERTURA = 'personal-data-request';

/** Os dois nomes de ajuste que `add_settings_error()` recebe neste tratador. */
export const AJUSTE_DO_TIPO_DE_ACAO = 'action_type';
export const AJUSTE_DO_ENDERECO = 'username_or_email_for_privacy_request';

/** Os textos deste tratador, na forma em que o legado os escreve. */
export const MENSAGENS_DA_TELA_DE_ABERTURA = Object.freeze({
  /** `:107` e `:124` — o mesmo texto nos dois portoes, e e por isso que ha uma constante so. */
  acaoInvalida: 'Invalid personal data action.',
  /** `:135`. */
  enderecoNaoResolvido:
    'Unable to add this request. A valid email address or username must be supplied.',
  /** `:155` — o ramo de `! $request_id`, que `$wp_error = true` torna inalcancavel. */
  criacaoSemIdentificador: 'Unable to initiate confirmation request.',
  /** `:171` — o sucesso do caminho `pending`. */
  confirmacaoIniciada: 'Confirmation request initiated successfully.',
  /** `:173` — o sucesso do caminho `confirmed`. */
  solicitacaoAdicionada: 'Request added successfully.',
});

/**
 * Um `add_settings_error( $setting, $code, $message, $type )`
 * (`wp-admin/includes/template.php`), como dado.
 *
 * Os quatro campos sao os quatro argumentos, e o `code` deste tratador e
 * **sempre igual ao `setting`** — e assim nas quatro chamadas (`:81`-`:83`,
 * `:105`-`:106`, `:122`-`:123`, `:133`-`:134`, `:160`-`:161`, `:178`-`:179`).
 */
export interface AvisoDaTela {
  /** `$setting` — {@link AJUSTE_DO_TIPO_DE_ACAO} ou {@link AJUSTE_DO_ENDERECO}. */
  readonly ajuste: string;
  /** `$code`. */
  readonly codigo: string;
  /** `$message`. */
  readonly mensagem: string;
  /** `$type` — `'error'` ou `'success'`. */
  readonly tipo: 'error' | 'success';
}

/**
 * O que a tela recebeu: a superficie e os quatro campos do formulario, com os
 * nomes do legado.
 *
 * Os nomes nao sao traduzidos porque sao **superficie publicada** (P8): e por
 * eles que o formulario envia (`wp-admin/export-personal-data.php:122`, `:130`,
 * `:142` e `:143`), e extensao de terceiro que monte o proprio formulario os usa.
 *
 * Os campos sao opcionais porque no legado eles sao `$_POST`, isto e, podem nao
 * vir — e o que o tratador faz com a ausencia e comportamento, nao defesa. Ver o
 * cabecalho.
 */
export interface PedidoDaTelaDeAbertura {
  /** Qual das duas telas foi aberta. E o que decide o portao de capacidade. */
  readonly superficie: SuperficieDeAbertura;
  /** `$_POST['action']`, ja sanitizado por quem recebeu, ou nao enviado. */
  readonly action?: string;
  /** `$_POST['type_of_action']` — a acao pedida. */
  readonly type_of_action?: string;
  /** `$_POST['username_or_email_for_privacy_request']` — endereco **ou** login. */
  readonly username_or_email_for_privacy_request?: string;
  /**
   * `$_POST['send_confirmation_email']` — a caixa marcada.
   *
   * ⚠️ **O legado le a PRESENCA, nao o valor** (`isset`, `:116`): qualquer valor
   * mantem `pending`, e so a ausencia leva a `confirmed`. `undefined` aqui e a
   * ausencia, como o `null` do `isset`.
   */
  readonly send_confirmation_email?: string;
  /**
   * `$request_data` — o terceiro argumento de `wp_create_user_request`.
   *
   * A tela passa **sempre** `array()` (`:149`), e o campo existe aqui porque a
   * forma do pedido e publica; omiti-lo da o mesmo `[]` do legado.
   */
  readonly dadosDoPedido?: ValorJson;
}

/** O que a superficie devolve. */
export interface ResultadoDaTelaDeAbertura {
  /**
   * `recusado` e o `wp_die()` do portao de `:12`; `ignorado` e o `switch` sem
   * caso correspondente (o legado nao tem `default`, e nada acontece);
   * `tratado` e o ramo de criacao, com ou sem aviso de erro.
   */
  readonly desfecho: 'recusado' | 'ignorado' | 'tratado';
  /** A recusa do portao da tela, ou `null`. */
  readonly recusa: RecusaDaAbertura | null;
  /** Os avisos acumulados, **na ordem em que o legado os acumula**. */
  readonly avisos: readonly AvisoDaTela[];
  /** O identificador criado, ou `null` quando nada foi criado. */
  readonly solicitacaoId: number | null;
  /**
   * Se o legado chamaria `wp_send_user_request( $request_id )` neste ponto
   * (`:168`-`:169`): verdadeiro quando o estado pedido e `pending` e a criacao
   * deu certo.
   *
   * ⚠️ **O envio nao acontece nesta tarefa** — ele gera a chave, grava o resumo
   * em `post_password` e reescreve o estado, e isso e **T005** (US-2). Este
   * campo marca o ponto exato do fluxo em vez de o esconder, e e o que permite a
   * T005 encaixar sem mexer na ordem dos passos daqui.
   */
  readonly envioDeConfirmacaoDevido: boolean;
}

/**
 * **CA-1.1 aplicada.** O portao da tela e o ramo de criacao do tratador, na
 * ordem do legado.
 *
 * A ordem dos tres primeiros passos e observavel, e nenhum deles e trocavel:
 * a capacidade (`:12` da tela) vem antes do nonce (`:101`), que vem antes de
 * qualquer leitura de campo — quem nao tem a capacidade **nao chega** a emitir
 * comando nenhum, e e isso que a suite afirma pela porta que registra comando.
 */
export function abrirSolicitacaoPelaTela(
  contexto: ContextoDeAbertura,
  pedido: PedidoDaTelaDeAbertura,
): ResultadoDaTelaDeAbertura {
  // ── 1. O portao da tela (`wp-admin/export-personal-data.php:12`) ──────────
  const decisao = autorizarAbertura(
    { base: contexto.base, ator: contexto.ator },
    pedido.superficie,
  );

  if (decisao.desfecho === 'recusado') {
    return {
      desfecho: 'recusado',
      recusa: decisao.recusa,
      avisos: [],
      solicitacaoId: null,
      envioDeConfirmacaoDevido: false,
    };
  }

  /*
    ── 2. `check_admin_referer( 'personal-data-request' )` (`:101`) ──────────
    Nao portado: e de BC-05 / feature 001, e a superficie o confere antes de
    chamar. Ver a tabela do cabecalho.
  */

  // ── 3. O `switch` sobre `$_POST['action']` (`:95`-`:98`) ─────────────────
  // `! empty( $_POST['action'] ) ? sanitize_key( ... ) : ''` (`:96`): a cadeia
  // vazia nao casa com nenhum caso, e sem `default` o legado nao faz nada.
  const acaoDaRequisicao = contexto.sanitizarChave(pedido.action ?? '');

  if (!ACOES_DA_TELA_DE_ABERTURA.includes(acaoDaRequisicao)) {
    return {
      desfecho: 'ignorado',
      recusa: null,
      avisos: [],
      solicitacaoId: null,
      envioDeConfirmacaoDevido: false,
    };
  }

  const avisos: AvisoDaTela[] = [];

  // ── 4. Portao 1: campo ausente (`:103`-`:110`), que NAO interrompe ────────
  if (
    pedido.type_of_action === undefined ||
    pedido.username_or_email_for_privacy_request === undefined
  ) {
    avisos.push({
      ajuste: AJUSTE_DO_TIPO_DE_ACAO,
      codigo: AJUSTE_DO_TIPO_DE_ACAO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.acaoInvalida,
      tipo: 'error',
    });
  }

  // `sanitize_text_field( wp_unslash( ... ) )` nos dois campos (`:111` e
  // `:112`), inclusive quando o portao 1 acabou de declara-los ausentes — o
  // `null` do PHP sanitiza para cadeia vazia.
  const acaoPedida = contexto.sanitizarTexto(pedido.type_of_action ?? '');
  const enderecoOuLogin = contexto.sanitizarTexto(
    pedido.username_or_email_for_privacy_request ?? '',
  );

  // ── 5. O estado pedido (`:114`-`:118`) ───────────────────────────────────
  // A presenca da caixa mantem `pending`; a ausencia leva a `confirmed`. Ver o
  // bloco 🔴 do cabecalho.
  const estadoPedido =
    pedido.send_confirmation_email === undefined
      ? ESTADO_PEDIDO_SEM_CONFIRMACAO
      : ESTADO_PEDIDO_PADRAO;

  // ── 6. Portao 2: a acao fora das duas (`:120`-`:127`), que NAO interrompe ─
  // ⚠️ A comparacao e com `_wp_privacy_action_request_types()`, isto e, com os
  // nomes de ACAO (`export_personal_data`), e NAO com os de `$_POST['action']`
  // (`add_export_personal_data_request`). Sao dois vocabularios no mesmo
  // tratador, e trocar um pelo outro recusaria todo envio valido.
  if (!ACOES_DE_SOLICITACAO.includes(acaoPedida)) {
    avisos.push({
      ajuste: AJUSTE_DO_TIPO_DE_ACAO,
      codigo: AJUSTE_DO_TIPO_DE_ACAO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.acaoInvalida,
      tipo: 'error',
    });
  }

  // ── 7. Portao 3: endereco ou login (`:129`-`:143`) ───────────────────────
  let enderecoDeEmail = '';

  if (!contexto.ehEmail(enderecoOuLogin)) {
    // `get_user_by( 'login', ... )`, e `! $user instanceof WP_User` (`:131`).
    const conta = contexto.conta.obterPorLogin(enderecoOuLogin);
    if (conta === null) {
      avisos.push({
        ajuste: AJUSTE_DO_ENDERECO,
        codigo: AJUSTE_DO_ENDERECO,
        mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.enderecoNaoResolvido,
        tipo: 'error',
      });
    } else {
      enderecoDeEmail = conta.enderecoDeEmail;
    }
  } else {
    enderecoDeEmail = enderecoOuLogin;
  }

  // `if ( empty( $email_address ) ) { break; }` (`:145`-`:147`): e **este** o
  // portao que interrompe, e nao nenhum dos tres acima.
  if (enderecoDeEmail === '') {
    return {
      desfecho: 'tratado',
      recusa: null,
      avisos,
      solicitacaoId: null,
      envioDeConfirmacaoDevido: false,
    };
  }

  // ── 8. A criacao (`:149`) ────────────────────────────────────────────────
  const resultado = abrirSolicitacao(contexto, {
    enderecoDeEmail,
    acao: acaoPedida,
    dadosDoPedido: pedido.dadosDoPedido ?? DADOS_DO_PEDIDO_PADRAO,
    estado: estadoPedido,
  });

  // `$message = ''` e os dois ramos de falha (`:150`-`:156`).
  const mensagemDeFalha = resultado.aberta
    ? resultado.solicitacaoId === 0
      ? MENSAGENS_DA_TELA_DE_ABERTURA.criacaoSemIdentificador
      : ''
    : resultado.erro.mensagem;

  if (mensagemDeFalha !== '') {
    avisos.push({
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: mensagemDeFalha,
      tipo: 'error',
    });
    return {
      desfecho: 'tratado',
      recusa: null,
      avisos,
      solicitacaoId: null,
      envioDeConfirmacaoDevido: false,
    };
  }

  const solicitacaoId = resultado.aberta ? resultado.solicitacaoId : null;

  // ── 9. O sucesso, e o ponto do envio (`:168`-`:184`) ─────────────────────
  const pendente = estadoPedido === ESTADO_PEDIDO_PADRAO;

  avisos.push({
    ajuste: AJUSTE_DO_ENDERECO,
    codigo: AJUSTE_DO_ENDERECO,
    mensagem: pendente
      ? MENSAGENS_DA_TELA_DE_ABERTURA.confirmacaoIniciada
      : MENSAGENS_DA_TELA_DE_ABERTURA.solicitacaoAdicionada,
    tipo: 'success',
  });

  return {
    desfecho: 'tratado',
    recusa: null,
    avisos,
    solicitacaoId,
    envioDeConfirmacaoDevido: pendente,
  };
}

