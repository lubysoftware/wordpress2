/**
 * **CA-1.2**, **CA-1.3** e **CA-1.5**: a solicitacao nasce pendente, vinculada
 * ao **endereco de e-mail** e nao a conta, vale do mesmo jeito para titular sem
 * conta, e **nada e exportado nem apagado** na abertura.
 *
 * Entrega de **T003** da feature `008-privacidade-e-dados-pessoais` (US-1). E
 * `wp_create_user_request()` (`wp-includes/user.php:4804`-`:4856`) inteira, e e
 * o passo 3 de UC-25 — *"Sistema cria a solicitacao como um registro de conteudo
 * de tipo proprio, em estado pendente"*.
 *
 * ---
 *
 * # Os sete passos, na ordem do legado, e o que a ordem decide
 *
 * | # | passo | ancora | por que aqui, e nao depois |
 * |---|---|---|---|
 * | 1 | `sanitize_email()` no endereco | `:4805` | o valor sanitizado e o que a conferencia ve, e e o que vai para `post_title` |
 * | 2 | `sanitize_key()` na acao | `:4806` | e por isso que `Export_Personal_Data` **nao** cai em `invalid_action`: vira caixa baixa antes da comparacao |
 * | 3 | `! is_email()` → `invalid_email` | `:4808` | **antes** de qualquer leitura: endereco invalido nao consulta conta nem duplicidade |
 * | 4 | acao fora da lista → `invalid_action` | `:4812` | idem |
 * | 5 | estado fora dos dois → `invalid_status` | `:4816` | idem. E o ultimo portao antes de o banco ser tocado |
 * | 6 | `get_user_by( 'email', ... )` | `:4820` | a conta e **resolvida**, nunca exigida: ausencia e `0` e e CA-1.3 |
 * | 7 | duplicidade por consulta, e so entao a insercao | `:4824` e `:4841` | a consulta vem **depois** da conta: um endereco invalido nao emite comando nenhum |
 *
 * **A ordem e o contrato, e nao um detalhe de leitura.** O criterio desta area e
 * *"snapshot + sequencia de comandos"*, com zero tolerancia (area 3 da Decisao 2
 * de `parity_specs.md`), e tres dos sete passos existem **para que comando
 * nenhum saia**. A suite afirma isso pelo duplo que registra comando.
 *
 * ---
 *
 * # ⚠️ Esta funcao NAO tem portao de capacidade, e isso e declaracao
 *
 * As 53 linhas de `wp_create_user_request()` nao perguntam capacidade nenhuma, e
 * `_wp_personal_data_handle_actions()` tambem nao — ela confere **nonce**
 * (`wp-admin/includes/privacy-tools.php:101`). Quem cobra sao as duas telas, na
 * primeira linha de cada uma, e e isso que CA-1.1 descreve: *"verificada antes
 * de a tela abrir"*. A decisao esta em `./permissao-de-abertura.ts` e e aplicada
 * em `./tela-de-abertura.ts`.
 *
 * E a mesma assimetria de `wp_publish_post()` em BC-01 e de
 * `media_handle_upload()` em BC-04 — funcao publica sem portao, superficie com
 * portao —, e o **P4** manda que *"toda operacao exposta nova nasca com
 * declaracao explicita de permissao"*: toda superficie que expuser esta funcao
 * declara a dela.
 *
 * ---
 *
 * # ⚠️ Nada e exportado nem apagado aqui (CA-1.5), e nao e por omissao
 *
 * `wp_create_user_request()` nao toca o registro de provedores, nao dispara
 * exportador nem apagador e **nao envia e-mail**. O envio e a chave sao de
 * `wp_send_user_request()` (`user.php:4901` em diante), que a tela chama
 * **depois**, numa linha separada (`privacy-tools.php:169`) — e e de **T005**.
 * O README deste modulo registra a consequencia disso em uma frase: *"a chave e
 * gerada no envio, nao na abertura"*, e e por isso que a solicitacao nasce com
 * `post_password` vazio (ver `SEM_CHAVE` em
 * `../armazenamento/chave-de-confirmacao.ts`).
 *
 * A suite afirma as tres ausencias com um registro de provedores que grava cada
 * chamada: `D2` (*"nada acontece sem confirmacao do titular"*) comeca aqui, e
 * `UT-086-7` e `UT-086-5` sao exatamente estas duas afirmacoes.
 */

import {
  ACOES_DE_SOLICITACAO,
  ESTADOS_ACEITOS_NA_ABERTURA,
  PREFIXO_DO_ESTADO,
  SEM_CONTA,
  TIPO_DE_SOLICITACAO,
  ESTADO_CONFIRMADO,
  ESTADO_PENDENTE,
  type ValorJson,
} from '../armazenamento/index.js';
import type {
  ContextoDeAbertura,
  PedidoDeInsercaoDaSolicitacao,
} from './contexto-de-abertura.js';

/**
 * `'pending'` — o default do quarto parametro (`wp-includes/user.php:4804`).
 *
 * **E o que faz CA-1.2 valer**: *"a solicitacao nasce num estado pendente"*.
 * Note que o valor **nao** tem o prefixo: o que vai para a coluna e
 * `PREFIXO_DO_ESTADO + ESTADO_PEDIDO_PADRAO`, e e por isso que o vocabulario do
 * parametro publico nao e o vocabulario da coluna.
 */
export const ESTADO_PEDIDO_PADRAO = 'pending';

/**
 * `array()` — o default do terceiro parametro (`wp-includes/user.php:4804`),
 * que `wp_json_encode` transforma em **`[]`**.
 *
 * ⚠️ `[]` e nao `{}`: no PHP um arranjo vazio codifica como arranjo JSON, e e
 * isso que vai para `post_content` em toda solicitacao aberta pela tela. Um
 * objeto vazio ali mudaria os bytes da coluna (`DB-SER`, BR-MIGRAR-082).
 */
export const DADOS_DO_PEDIDO_PADRAO: ValorJson = Object.freeze([]);

/**
 * Os quatro erros desta funcao, com o codigo e o texto do legado.
 *
 * Sao `WP_Error`, e **nao** excecao: AD-06 poe falha de negocio em valor de
 * retorno, e o cenario `@invariante` de `PT-012` cobra que *"nenhuma das duas
 * lanca excecao que interrompa o fluxo"*. Os textos estao em ingles pelo mesmo
 * motivo que os de BC-04: o catalogo de traducao e de `plataforma/traducao/`, e
 * o que o legado tem no codigo e a cadeia de origem.
 */
export const ERROS_DA_ABERTURA = Object.freeze({
  /** `:4809` — o endereco nao passou por `is_email()`. */
  emailInvalido: Object.freeze({
    codigo: 'invalid_email',
    mensagem: 'Invalid email address.',
  }),
  /** `:4813` — a acao nao e nenhuma das duas de `ACOES_DE_SOLICITACAO`. */
  acaoInvalida: Object.freeze({
    codigo: 'invalid_action',
    mensagem: 'Invalid action name.',
  }),
  /** `:4817` — o estado pedido nao e `pending` nem `confirmed`. */
  estadoInvalido: Object.freeze({
    codigo: 'invalid_status',
    mensagem: 'Invalid request status.',
  }),
  /** `:4838` — ja existe solicitacao incompleta para o par endereco e acao. */
  solicitacaoDuplicada: Object.freeze({
    codigo: 'duplicate_request',
    mensagem:
      'An incomplete personal data request for this email address already exists.',
  }),
});

/**
 * Os **dois** estados que contam como *solicitacao incompleta* na consulta de
 * duplicidade, na ordem do legado (`wp-includes/user.php:4830` e `:4831`).
 *
 * ⚠️ **Falha e conclusao ficam de fora, e as duas ausencias sao regra.** Uma
 * solicitacao em `request-failed` — e-mail que nao saiu, ou prazo vencido — **nao
 * bloqueia** a abertura de outra, que e como quem administra o site sai de um
 * procedimento travado sem apagar nada. E uma `request-completed` tambem nao: e
 * assim que o mesmo titular pede exportacao duas vezes em meses diferentes.
 *
 * E o complemento exato de `ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE`
 * (`../armazenamento/estados-da-solicitacao.ts`), que tem justamente os dois
 * outros — e a coincidencia e aparente: aquela lista e sobre **validar chave**,
 * esta e sobre **existir pedido em curso**. Confundi-las faria uma solicitacao
 * em falha bloquear a seguinte.
 */
export const ESTADOS_DE_SOLICITACAO_INCOMPLETA: readonly string[] =
  Object.freeze([ESTADO_PENDENTE, ESTADO_CONFIRMADO]);

/** Um erro desta operacao, como `WP_Error` o carrega: codigo e mensagem. */
export interface ErroDaAbertura {
  readonly codigo: string;
  readonly mensagem: string;
}

/** Quem se abre, e com que dado. Os quatro parametros do legado, na ordem. */
export interface PedidoDeAbertura {
  /**
   * `$email_address`, default `''` (`:4804`).
   *
   * *"This can be the address of a registered or non-registered user"*, diz o
   * docblock — e e a frase que CA-1.3 porta.
   */
  readonly enderecoDeEmail?: string;
  /** `$action_name`, default `''`. Uma das duas de {@link ACOES_DE_SOLICITACAO}. */
  readonly acao?: string;
  /** `$request_data`, default {@link DADOS_DO_PEDIDO_PADRAO}. */
  readonly dadosDoPedido?: ValorJson;
  /**
   * `$status`, default {@link ESTADO_PEDIDO_PADRAO}, **sem** o prefixo.
   *
   * ⚠️ `'confirmed'` esta na lista aceita, e com ele a solicitacao **nasce
   * confirmada**, sem chave e sem o titular ter aberto link nenhum
   * (`@since 5.7.0`). Nao e invencao desta tarefa, nao e caminho morto e e
   * **superficie publicada** (P8). A consequencia disso para `D2` esta na secao
   * *O que T003 encontrou* do `../README.md`, registrada e **nao resolvida**.
   */
  readonly estado?: string;
}

/** O que a operacao devolve: `int|WP_Error` (`:4802`). */
export type ResultadoDaAbertura =
  | {
      readonly aberta: true;
      /**
       * O identificador gravado.
       *
       * ⚠️ Pode ser `0`: ver {@link ResultadoDaInsercaoDaSolicitacao}. O legado
       * devolve `$request_id` sem conferir, e quem confere e a tela.
       */
      readonly solicitacaoId: number;
    }
  | { readonly aberta: false; readonly erro: ErroDaAbertura };

/**
 * **CA-1.2, CA-1.3 e CA-1.5.** `wp_create_user_request( $email_address,
 * $action_name, $request_data, $status )`.
 *
 * Sem portao de capacidade, como no legado — ver o cabecalho.
 */
export function abrirSolicitacao(
  contexto: ContextoDeAbertura,
  pedido: PedidoDeAbertura = {},
): ResultadoDaAbertura {
  // Passos 1 e 2 (`:4805` e `:4806`): as duas sanitizacoes, nesta ordem, antes
  // de qualquer conferencia.
  const enderecoDeEmail = contexto.sanitizarEmail(pedido.enderecoDeEmail ?? '');
  const acao = contexto.sanitizarChave(pedido.acao ?? '');
  const estadoPedido = pedido.estado ?? ESTADO_PEDIDO_PADRAO;

  // Passo 3 (`:4808`): `! is_email( $email_address )`. O retorno do legado e
  // `string|false`, e o ramo e sobre a verdade dele — cadeia vazia tambem e
  // falsa no PHP, e por isso `is_email` devolvendo `''` cairia aqui tambem.
  if (!contexto.ehEmail(enderecoDeEmail)) {
    return { aberta: false, erro: ERROS_DA_ABERTURA.emailInvalido };
  }

  // Passo 4 (`:4812`): `in_array( $action_name, _wp_privacy_action_request_types(), true )`.
  // A comparacao e estrita, e e por isso que a lista e de cadeias e nao de
  // valores soltos.
  if (!ACOES_DE_SOLICITACAO.includes(acao)) {
    return { aberta: false, erro: ERROS_DA_ABERTURA.acaoInvalida };
  }

  // Passo 5 (`:4816`): `in_array( $status, array( 'pending', 'confirmed' ), true )`.
  if (!ESTADOS_ACEITOS_NA_ABERTURA.includes(estadoPedido)) {
    return { aberta: false, erro: ERROS_DA_ABERTURA.estadoInvalido };
  }

  /*
    Passo 6 (`:4820` e `:4821`): a conta e RESOLVIDA, nao exigida —
    `$user && ! is_wp_error( $user ) ? $user->ID : 0`. CA-1.3 e esta linha:
    titular sem conta no site tem solicitacao valida do mesmo jeito, com
    `post_author = 0`. O `is_wp_error` do legado nao tem contraparte aqui porque
    `get_user_by()` nao devolve erro; o `null` cobre os dois ramos falsos.
  */
  const conta = contexto.conta.obterPorEmail(enderecoDeEmail);
  const contaDoTitular = conta === null ? SEM_CONTA : conta.id;

  /*
    Passo 7 (`:4824` a `:4839`): a duplicidade. O legado decide SO por
    `found_posts` — isto e, pelo `SELECT FOUND_ROWS()` —, e nao pelas linhas
    devolvidas; com `fields => 'ids'` ele nem as le. Ver
    `ConsultaDeSolicitacoes` em `./contexto-de-abertura.ts` para por que a
    consulta nao e montada aqui.
  */
  const incompletas = contexto.consultarSolicitacoes({
    post_type: TIPO_DE_SOLICITACAO,
    // `post_name__in => array( $action_name )` — *"Action name stored in
    // post_name column"* (`:4827`).
    post_name__in: [acao],
    // `title => $email_address` — *"Email address stored in post_title column"*
    // (`:4828`).
    title: enderecoDeEmail,
    post_status: ESTADOS_DE_SOLICITACAO_INCOMPLETA,
    fields: 'ids',
  });

  if (incompletas.totalEncontrado > 0) {
    return { aberta: false, erro: ERROS_DA_ABERTURA.solicitacaoDuplicada };
  }

  // `wp_json_encode( $request_data )` (`:4846`). O `false` do codificador vira
  // cadeia vazia porque e isso que o PHP faz com `false` onde se espera texto —
  // a coluna e `NOT NULL` e recebe `''`, e nao `NULL` (`DB-SENT`).
  const corpoJson = contexto.codificarJson(
    pedido.dadosDoPedido ?? DADOS_DO_PEDIDO_PADRAO,
  );

  const pedidoDeInsercao: PedidoDeInsercaoDaSolicitacao = {
    post_author: contaDoTitular,
    post_name: acao,
    post_title: enderecoDeEmail,
    post_content: corpoJson === false ? '' : corpoJson,
    // `'request-' . $status` (`:4847`): o prefixo e concatenado aqui, e e so
    // aqui que a solicitacao ganha o vocabulario da coluna.
    post_status: `${PREFIXO_DO_ESTADO}${estadoPedido}`,
    post_type: TIPO_DE_SOLICITACAO,
    post_date: contexto.relogio.agoraNoFormatoDoBanco(),
    post_date_gmt: contexto.relogio.agoraNoFormatoDoBancoEmGmt(),
  };

  const insercao = contexto.conteudo.inserirSolicitacao(pedidoDeInsercao);

  if (!insercao.inserido) {
    // `wp_insert_post( ..., true )` devolveu `WP_Error`, e o legado o devolve
    // sem envolver (`:4855`).
    return {
      aberta: false,
      erro: { codigo: insercao.codigo, mensagem: insercao.mensagem },
    };
  }

  return { aberta: true, solicitacaoId: insercao.solicitacaoId };
}
