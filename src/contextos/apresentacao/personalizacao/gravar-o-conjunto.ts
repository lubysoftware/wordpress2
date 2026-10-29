/**
 * Gravar o conjunto de alteracoes **sem aplica-lo**, e a validacao do pedido de
 * gravacao que decide o estado e a capacidade.
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao`, US-1:
 *
 * - **CA-1.3** — *"O conjunto pode ser salvo e retomado depois, sem ser
 *   aplicado"*: {@link gravarSemAplicar}, que e `save_changeset_post()`
 *   (`wp-includes/class-wp-customize-manager.php:2642`) no ramo em que o estado
 *   pedido e nenhum, `draft` ou `pending`;
 * - **CA-1.4** — *"A aplicacao exige a capacidade declarada de administrar a
 *   aparencia"*: a recusa `changeset_publish_unauthorized` de
 *   {@link validarPedidoDeGravacao} (`:2482`-`:2485`);
 * - **CA-1.6** — *"Estado pedido fora dos aceitos e recusado, e o estado de
 *   rascunho automatico nao pode ser pedido por quem chama a API"*: a recusa
 *   `bad_customize_changeset_status` (`:2476`-`:2481`).
 *
 * E o primeiro passo de **CA-1.1** que grava: o conjunto que ainda nao tem linha
 * nasce `auto-draft` quando o pedido nao traz estado (`:2927`-`:2932`).
 *
 * ## O que esta aqui, e o que e das tarefas seguintes
 *
 * `save()` (`:2433`) valida o pedido e chama `save_changeset_post()`, e o
 * segundo tem ramos que sao de outras historias. Este arquivo porta a validacao
 * do pedido **inteira ate o estado** e a gravacao **sem aplicar**:
 *
 * | ramo do legado | ancora | de quem |
 * |---|---|---|
 * | sessao, previa, nonce, criar/editar, dados, titulo, estado, publicar | `save()`, `:2434`-`:2486` | **T003**, aqui |
 * | a data pedida (`customize_changeset_date`) e o agendamento | `:2488`-`:2512`, `:2682`-`:2708` | **T009** (US-4) — a data viaja crua em {@link PedidoDeGravacaoValidado.dataPedida} |
 * | a trava e o salvamento automatico forcado | `:2514`-`:2530`, `:2710`-`:2718`, `:2963`-`:2973` | nenhuma tarefa desta feature os nomeia; registrado em `../README.md` |
 * | aplicar (`publish`): o retorno de chamada, a troca de tema, a data zerada | `:2677`-`:2680`, `:2909`-`:2916`, `:2937`-`:2940` | **T005** (US-2) e **T007** (US-3) |
 * | a resposta: estado relatado, identificador seguinte, descarte dos outros rascunhos | `save()`, `:2564`-`:2615` | **T007** (US-3) — 🔴 com o conflito de CA-3.3 aberto |
 *
 * Por isso {@link gravarSemAplicar} aceita **so** os tres estados que nao
 * aplicam, pelo tipo: pedir `publish` ou `future` por aqui nao compila.
 *
 * ## 🔴 A "autorizacao pela diferenca" nao existe no codigo
 *
 * A unidade `customize/changeset-do-customizer` da reversa diz, em RF-11, que
 * *"apenas as configuracoes cujo valor difere do ja salvo entram na
 * validacao"* (`:2741`, `:2750`). **O codigo calcula a lista e nunca a usa**:
 * `$changed_setting_ids` nasce em `:2749`, recebe em `:2767`, e nao aparece em
 * mais nenhuma linha do arquivo. A validacao roda sobre **todos** os valores
 * enviados mais as chaves de `customize_changeset_data` (`:2785`-`:2795`). O
 * comentario do legado descreve a intencao; o **P1** manda portar o
 * comportamento — logo a lista nao e calculada aqui, porque calcula-la nao muda
 * nada observavel. Quem pegar **T005** le isto antes de confiar em RF-11.
 */

import {
  conteudoDoConjunto,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  ESTADOS_ACEITOS_NA_ESCRITA,
  ESTADO_APLICADO,
  ESTADO_AGENDADO,
  ESTADO_AGUARDANDO_REVISAO,
  ESTADO_GUARDADO,
  ESTADO_NA_LIXEIRA,
  TIPO_DO_CONJUNTO_DE_ALTERACOES,
  chaveDaConfiguracaoNoConjunto,
  lerDadosDoConjunto,
  type DadosDoConjunto,
  type ErroDeLeituraDoConjunto,
  type PedidoDoConjunto,
  type ValorDeJson,
} from '../armazenamento/index.js';
import type { AberturaDaPersonalizacao } from './abrir-a-personalizacao.js';
import {
  campoDoPedido,
  vazioNoPhp,
  type ConfiguracaoDaPersonalizacao,
  type ContextoDaPersonalizacao,
  type ErroDaConfiguracao,
  type PedidoDaPersonalizacao,
  type ValidadeDaConfiguracao,
} from './contexto-da-personalizacao.js';
import {
  PERMISSOES_DA_PERSONALIZACAO,
  perguntarNaPersonalizacao,
} from './permissao-da-personalizacao.js';
import { acaoDoNonceDeGravacao } from './valores-da-previa.js';

// ── a validacao do pedido ──────────────────────────────────────────────────

/**
 * Uma recusa de `save()`: `wp_send_json_error( $codigo, $status )`.
 * `status` `null` e o default de `wp_send_json_error()`, que nao muda o codigo
 * HTTP.
 */
export interface RecusaDoPedidoDeGravacao {
  readonly codigo:
    | 'unauthenticated'
    | 'not_preview'
    | 'invalid_nonce'
    | 'cannot_create_changeset_post'
    | 'cannot_edit_changeset_post'
    | 'invalid_customize_changeset_data'
    | 'bad_customize_changeset_status'
    | 'changeset_publish_unauthorized';
  readonly status: 400 | 403 | null;
}

/** O pedido de gravacao depois das guardas de `save()`. */
export interface PedidoDeGravacaoValidado {
  /** `customize_changeset_status`, ou `null` quando nao veio. */
  readonly estado: string | null;
  /** `$is_publish` — `publish` ou `future`; `null` quando nao veio estado. */
  readonly ehAplicacao: boolean | null;
  /** `sanitize_text_field( customize_changeset_title )`, ou `null`. */
  readonly titulo: string | null;
  /** `customize_changeset_data`, ou arranjo vazio. */
  readonly dados: DadosDoConjunto;
  /** `customize_changeset_date`, **cru** — a validacao e de T009. */
  readonly dataPedida: string | null;
  /** `! empty( customize_changeset_autosave )` (`:2515`). */
  readonly salvamentoAutomatico: boolean;
}

export type ResultadoDaValidacaoDaGravacao =
  | { readonly ok: true; readonly pedido: PedidoDeGravacaoValidado }
  | { readonly ok: false; readonly recusa: RecusaDoPedidoDeGravacao };

function recusa(
  codigo: RecusaDoPedidoDeGravacao['codigo'],
  status: RecusaDoPedidoDeGravacao['status'] = null,
): ResultadoDaValidacaoDaGravacao {
  return { ok: false, recusa: { codigo, status } };
}

/**
 * As guardas de `save()` (`:2434`-`:2486`), na ordem do legado.
 *
 * 1. sem sessao, `unauthenticated` (`:2434`-`:2436`);
 * 2. fora da previa, `not_preview` (`:2438`-`:2440`). Depois de uma abertura
 *    bem-sucedida a previa esta sempre ligada (`start_previewing_theme()`,
 *    `:686`), e o ramo fica para quem chamar sem abertura — por isso recebe a
 *    abertura e nao a presume;
 * 3. o nonce `save-customize_{folha}` em `nonce`, `invalid_nonce` (`:2442`-`:2445`);
 * 4. conjunto novo exige `create_posts` do tipo; existente, `edit_post` com o
 *    objeto (`:2447`-`:2457`) — as duas resolvem em `customize`;
 * 5. `customize_changeset_data` nao vazio tem de ser arranjo de JSON
 *    (`:2459`-`:2466`);
 * 6. o titulo passa por `sanitize_text_field()` (`:2469`-`:2472`);
 * 7. 🔴 **o estado** (`:2476`-`:2486`): tem de estar **registrado**
 *    (`get_post_status_object()`) **e** entre os quatro aceitos, senao
 *    `bad_customize_changeset_status` com **400**. `auto-draft` e registrado e
 *    **nao** esta entre os quatro — e assim que o cliente nao consegue pedi-lo
 *    (CA-1.6). `publish` e `future` exigem, **em separado**, `publish_posts` do
 *    tipo, senao `changeset_publish_unauthorized` com **403** (CA-1.4).
 */
export function validarPedidoDeGravacao(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
  abertura: AberturaDaPersonalizacao | null,
): ResultadoDaValidacaoDaGravacao {
  const autorizacao = contexto.autorizacao;

  if (!autorizacao.ator.existe) {
    return recusa('unauthenticated');
  }
  if (abertura === null) {
    return recusa('not_preview');
  }
  if (
    !contexto.verificarNonce(
      acaoDoNonceDeGravacao(contexto.folhaDeEstilo),
      campoDoPedido(pedido, 'nonce'),
    )
  ) {
    return recusa('invalid_nonce');
  }

  if (abertura.conjunto === null) {
    if (
      !perguntarNaPersonalizacao(
        autorizacao,
        PERMISSOES_DA_PERSONALIZACAO.criarConjunto,
      )
    ) {
      return recusa('cannot_create_changeset_post');
    }
  } else if (
    !perguntarNaPersonalizacao(
      autorizacao,
      PERMISSOES_DA_PERSONALIZACAO.editarConjunto,
      abertura.conjunto.id,
    )
  ) {
    return recusa('cannot_edit_changeset_post');
  }

  let dados: DadosDoConjunto = {};
  const dadosEnviados = pedido.corpo['customize_changeset_data'];
  if (!vazioNoPhp(dadosEnviados)) {
    const leitura = lerDadosDoConjunto(dadosEnviados as string);
    if (!leitura.ok) {
      return recusa('invalid_customize_changeset_data');
    }
    dados = leitura.dados;
  }

  const tituloEnviado = pedido.corpo['customize_changeset_title'];
  const titulo =
    tituloEnviado === undefined ? null : contexto.sanitizarTexto(tituloEnviado);

  let estado: string | null = null;
  let ehAplicacao: boolean | null = null;
  const estadoEnviado = pedido.corpo['customize_changeset_status'];
  if (estadoEnviado !== undefined) {
    estado = estadoEnviado;
    if (
      !contexto.estadosRegistrados.includes(estado) ||
      !(ESTADOS_ACEITOS_NA_ESCRITA as readonly string[]).includes(estado)
    ) {
      return recusa('bad_customize_changeset_status', 400);
    }
    ehAplicacao = estado === ESTADO_APLICADO || estado === ESTADO_AGENDADO;
    if (
      ehAplicacao &&
      !perguntarNaPersonalizacao(
        autorizacao,
        PERMISSOES_DA_PERSONALIZACAO.aplicarConjunto,
      )
    ) {
      return recusa('changeset_publish_unauthorized', 403);
    }
  }

  return {
    ok: true,
    pedido: {
      estado,
      ehAplicacao,
      titulo,
      dados,
      dataPedida: pedido.corpo['customize_changeset_date'] ?? null,
      salvamentoAutomatico: !vazioNoPhp(
        pedido.corpo['customize_changeset_autosave'],
      ),
    },
  };
}

// ── a gravacao sem aplicar ─────────────────────────────────────────────────

/** Os tres estados que gravam sem aplicar: nenhum, `draft` e `pending`. */
export type EstadoQueNaoAplica =
  | null
  | typeof ESTADO_GUARDADO
  | typeof ESTADO_AGUARDANDO_REVISAO;

/** O que {@link gravarSemAplicar} recebe. */
export interface PedidoDeGravacaoSemAplicar {
  readonly abertura: AberturaDaPersonalizacao;
  /** `$args['status']`. */
  readonly estado: EstadoQueNaoAplica;
  /** `$args['title']`. */
  readonly titulo: string | null;
  /** `$args['data']` — `customize_changeset_data`. */
  readonly dados: DadosDoConjunto;
  /**
   * `$this->_post_values` — o `customized` que sobreviveu a `setup_theme()`.
   * Ver `valoresEnviados()` em `valores-da-previa.ts`.
   */
  readonly enviados: Readonly<Record<string, ValorDeJson>>;
}

/** `Setting does not exist or is unrecognized.` (`:2362`). */
export const ERRO_DE_CONFIGURACAO_DESCONHECIDA: ErroDaConfiguracao = {
  codigo: 'unrecognized',
  mensagem: 'Setting does not exist or is unrecognized.',
};

/** `Unauthorized to modify setting due to capability.` (`:2367`). */
export const ERRO_DE_CONFIGURACAO_SEM_CAPACIDADE: ErroDaConfiguracao = {
  codigo: 'unauthorized',
  mensagem: 'Unauthorized to modify setting due to capability.',
};

/** `Invalid value.` (`:2390`). */
export const ERRO_DE_VALOR_INVALIDO: ErroDaConfiguracao = {
  codigo: 'invalid_value',
  mensagem: 'Invalid value.',
};

/** `The previous set of changes has already been published...` (`:2664`). */
export const MENSAGEM_DE_CONJUNTO_JA_APLICADO =
  'The previous set of changes has already been published. Please try saving your current set of changes again.';

export type ResultadoDaGravacaoSemAplicar =
  | {
      readonly ok: true;
      readonly conjuntoId: number;
      readonly validades: Readonly<Record<string, ValidadeDaConfiguracao>>;
    }
  | {
      readonly ok: false;
      readonly codigo: 'changeset_already_published';
      readonly mensagem: string;
      /** O identificador novo que a resposta de erro **ja** traz (`:2666`). */
      readonly proximoIdentificador: string;
    }
  | {
      readonly ok: false;
      /** O erro de `get_changeset_post_data()` devolvido como esta (`:2672`-`:2674`). */
      readonly codigo: ErroDeLeituraDoConjunto;
    }
  | {
      readonly ok: false;
      readonly codigo: 'transaction_fail';
      readonly mensagem: string;
      readonly validades: Readonly<Record<string, ValidadeDaConfiguracao>>;
    }
  | {
      readonly ok: false;
      readonly codigo: 'changeset_post_save_failure';
      /** O codigo do `WP_Error` de `wp_insert_post()`/`wp_update_post()`. */
      readonly falha: string;
      readonly validades: Readonly<Record<string, ValidadeDaConfiguracao>>;
    };

/** `is_array()` sobre valor de JSON. */
function ehArranjo(
  valor: ValorDeJson | undefined,
): valor is Readonly<Record<string, ValorDeJson>> | readonly ValorDeJson[] {
  return valor !== null && valor !== undefined && typeof valor === 'object';
}

/** A copia mutavel de um arranjo de JSON, lista ou mapa, com as chaves dele. */
function comoMapa(
  valor: Readonly<Record<string, ValorDeJson>> | readonly ValorDeJson[],
): Record<string, ValorDeJson> {
  return { ...(valor as Record<string, ValorDeJson>) };
}

/**
 * `===` do PHP entre dois valores lidos de JSON: mesmo tipo e, para arranjo,
 * mesmos pares **na mesma ordem**.
 *
 * ⚠️ Inteiro e ponto flutuante de mesmo valor (`1` e `1.0`) sao **diferentes**
 * no PHP e iguais aqui, porque `JSON.parse` nao distingue os dois. So muda o
 * resultado quando o cliente reenvia o mesmo numero com outra grafia, e o efeito
 * e nao regravar `user_id`/`date_modified_gmt` de uma configuracao.
 */
export function identicoNoPhp(a: ValorDeJson, b: ValorDeJson): boolean {
  if (!ehArranjo(a) || !ehArranjo(b)) {
    return a === b;
  }
  const chavesA = Object.keys(a);
  const chavesB = Object.keys(b);
  return (
    chavesA.length === chavesB.length &&
    chavesA.every(
      (chave, indice) =>
        chave === chavesB[indice] &&
        identicoNoPhp(
          (a as Record<string, ValorDeJson>)[chave] as ValorDeJson,
          (b as Record<string, ValorDeJson>)[chave] as ValorDeJson,
        ),
    )
  );
}

/** O `TypeError` que `array_merge()` lanca com argumento que nao e arranjo. */
function erroDeArranjo(posicao: number, valor: ValorDeJson): TypeError {
  return new TypeError(
    `array_merge(): Argument #${posicao} must be of type array, ${valor === null ? 'null' : typeof valor} given`,
  );
}

/** `$setting->check_capabilities()` (`class-wp-customize-setting.php:839`-`:849`). */
function capacidadesDaConfiguracao(
  contexto: ContextoDaPersonalizacao,
  configuracao: ConfiguracaoDaPersonalizacao,
): boolean {
  if (
    !vazioNoPhp(configuracao.capacidade) &&
    !perguntarNaPersonalizacao(contexto.autorizacao, configuracao.capacidade)
  ) {
    return false;
  }
  return configuracao.suportadaPeloTema;
}

/**
 * `validate_setting_values( $valores, array( 'validate_capability' => true,
 * 'validate_existence' => true ) )` (`:2348`-`:2395`).
 *
 * As quatro etapas e os dois nulos de RF-14: configuracao desconhecida e
 * `unrecognized`; sem a capacidade da configuracao e `unauthorized` **mesmo com
 * valor nulo**; com a capacidade, valor nulo **nao gera validade nenhuma**
 * (`:2369`-`:2371`, *"ausencia nao e invalidez"*); e sanitizacao que devolve
 * nulo e `invalid_value`.
 */
export function validarValoresDasConfiguracoes(
  contexto: ContextoDaPersonalizacao,
  valores: Readonly<Record<string, ValorDeJson>>,
): Record<string, ValidadeDaConfiguracao> {
  const validades: Record<string, ValidadeDaConfiguracao> = {};
  for (const [id, valor] of Object.entries(valores)) {
    const configuracao = contexto.configuracao(id);
    if (configuracao === undefined) {
      validades[id] = ERRO_DE_CONFIGURACAO_DESCONHECIDA;
      continue;
    }
    let validade: ValidadeDaConfiguracao | false;
    if (
      !perguntarNaPersonalizacao(contexto.autorizacao, configuracao.capacidade)
    ) {
      validade = ERRO_DE_CONFIGURACAO_SEM_CAPACIDADE;
    } else {
      if (valor === null) {
        continue;
      }
      validade = configuracao.validar(valor);
    }
    if (validade === true) {
      const tardia = configuracao.validarTardiamente?.(valor) ?? null;
      if (tardia !== null) {
        validade = tardia;
      }
    }
    if (validade === true) {
      const sanitizado = configuracao.sanitizar(valor);
      if (sanitizado.ok && sanitizado.valor === null) {
        validade = false;
      } else if (!sanitizado.ok) {
        validade = sanitizado.erro;
      }
    }
    validades[id] = validade === false ? ERRO_DE_VALOR_INVALIDO : validade;
  }
  return validades;
}

/**
 * `number_format_i18n()` com os separadores de fabrica (`,` de milhar), que e o
 * que a instalacao sem catalogo de traducao usa. O catalogo e feature `015`.
 */
function numeroFormatado(numero: number): string {
  return String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * `sprintf( _n( 'Unable to save due to %s invalid setting.', 'Unable to save
 * due to %s invalid settings.', $n ), number_format_i18n( $n ) )` (`:2806`), com
 * o texto de origem: a escolha do plural sem catalogo e a do ingles, `1` e
 * singular.
 */
export function mensagemDeFalhaDaTransacao(invalidas: number): string {
  return `Unable to save due to ${numeroFormatado(invalidas)} invalid ${invalidas === 1 ? 'setting' : 'settings'}.`;
}

/**
 * `save_changeset_post()` (`:2642`-`:3010`) no ramo que **nao aplica**: estado
 * nenhum (o conjunto continua ou nasce `auto-draft`), `draft` ou `pending`; sem
 * data e sem salvamento automatico.
 *
 * A sequencia e a do legado:
 *
 * 1. conjunto existente ja aplicado ou na lixeira: `changeset_already_published`,
 *    **com um identificador novo na propria resposta de erro** (`:2659`-`:2669`);
 * 2. conteudo existente ilegivel: o erro da leitura, como esta (`:2671`-`:2674`);
 * 3. os valores enviados mais `$args['data']` com chave `value` formam o estado
 *    a gravar (`:2725`-`:2738`);
 * 4. validacao de **tudo** que foi enviado mais as chaves de `$args['data']`
 *    (`:2785`-`:2796`); com estado pedido a gravacao e transacional e qualquer
 *    invalidez a interrompe (`:2802`-`:2809`);
 * 5. fusao com o conteudo existente, pulando configuracao desconhecida, sem
 *    capacidade ou invalida; `null` apaga a entrada; o que nao mudou nao tem
 *    `user_id` nem data regravados (`:2811`-`:2875`);
 * 6. a linha: `auto-draft` quando nasce, o estado pedido quando ha um, e o
 *    rascunho automatico existente tem a data **empurrada para agora**, com a de
 *    GMT vazia — *"preserving it from garbage-collection via
 *    wp_delete_auto_drafts()"* (`:2918`-`:2952`);
 * 7. linha existente e atualizada preservando a data, e a revisao de
 *    salvamento automatico da conta e apagada; linha nova e inserida
 *    (`:2962`-`:2992`).
 *
 * O ponto de extensao `customize_changeset_save_data` (`:2907`) e
 * `customize_save_validation_before` (`:2782`) ficam declarados por nome: o
 * barramento (REQ-162) esta em `do-not-rewrite.md`.
 */
export function gravarSemAplicar(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDeGravacaoSemAplicar,
): ResultadoDaGravacaoSemAplicar {
  const existente = pedido.abertura.conjunto;
  const contaId = contexto.autorizacao.ator.contaId;

  // 1 e 2. O conjunto existente (`:2657`-`:2675`).
  let dadosExistentes: DadosDoConjunto = {};
  if (existente !== null) {
    if (
      existente.estado === ESTADO_APLICADO ||
      existente.estado === ESTADO_NA_LIXEIRA
    ) {
      return {
        ok: false,
        codigo: 'changeset_already_published',
        mensagem: MENSAGEM_DE_CONJUNTO_JA_APLICADO,
        proximoIdentificador: contexto.gerarIdentificador(),
      };
    }
    if (existente.tipo !== TIPO_DO_CONJUNTO_DE_ALTERACOES) {
      return { ok: false, codigo: 'wrong_post_type' };
    }
    const leitura = lerDadosDoConjunto(existente.conteudo);
    if (!leitura.ok) {
      return { ok: false, codigo: leitura.erro };
    }
    dadosExistentes = leitura.dados;
  }

  // 3. `set_post_value()` para cada entrada com `value` (`:2725`-`:2730`), e
  //    os valores enviados com eles (`:2732`-`:2738`).
  const valoresEnviados: Record<string, ValorDeJson> = { ...pedido.enviados };
  for (const [id, parametros] of Object.entries(pedido.dados)) {
    if (
      ehArranjo(parametros) &&
      Object.prototype.hasOwnProperty.call(parametros, 'value')
    ) {
      valoresEnviados[id] = (parametros as Record<string, ValorDeJson>)[
        'value'
      ] as ValorDeJson;
    }
  }

  // 4. A validacao (`:2785`-`:2809`).
  const aValidar: Record<string, ValorDeJson> = {};
  for (const id of Object.keys(pedido.dados)) {
    aValidar[id] = null;
  }
  Object.assign(aValidar, valoresEnviados);
  const validades = validarValoresDasConfiguracoes(contexto, aValidar);
  const invalidas = Object.values(validades).filter((v) => v !== true).length;

  const transacional = pedido.estado !== null;
  if (transacional && invalidas > 0) {
    return {
      ok: false,
      codigo: 'transaction_fail',
      mensagem: mensagemDeFalhaDaTransacao(invalidas),
      validades,
    };
  }

  // 5. A fusao (`:2811`-`:2875`). `get_changeset_post_data()` sem linha e
  //    `empty_post_id`, que vira arranjo vazio (`:2813`-`:2816`).
  const dados: Record<string, ValorDeJson> = { ...dadosExistentes };
  const pedidoDeDados: Record<string, ValorDeJson> = { ...pedido.dados };

  for (const [id, valor] of Object.entries(valoresEnviados)) {
    const atual = pedidoDeDados[id];
    if (atual === undefined || atual === null) {
      pedidoDeDados[id] = {};
    } else if (!ehArranjo(atual)) {
      // `$args['data'][ $id ]['value'] = ...` sobre escalar e `Error` no PHP 8.
      throw new TypeError('Cannot use a scalar value as an array');
    }
    const parametros = comoMapa(
      pedidoDeDados[id] as Readonly<Record<string, ValorDeJson>>,
    );
    if (parametros['value'] === undefined || parametros['value'] === null) {
      parametros['value'] = valor;
    }
    pedidoDeDados[id] = parametros;
  }

  for (const [id, parametros] of Object.entries(pedidoDeDados)) {
    const configuracao = contexto.configuracao(id);
    if (
      configuracao === undefined ||
      !capacidadesDaConfiguracao(contexto, configuracao)
    ) {
      continue;
    }
    if (validades[id] !== undefined && validades[id] !== true) {
      continue;
    }

    const chave = chaveDaConfiguracaoNoConjunto(
      id,
      configuracao.tipo,
      contexto.folhaDeEstilo,
    );

    if (parametros === null) {
      delete dados[chave];
      continue;
    }

    const anterior = dados[chave];
    const base: ValorDeJson =
      anterior === undefined || anterior === null ? {} : anterior;
    if (!ehArranjo(base)) {
      throw erroDeArranjo(1, base);
    }
    if (!ehArranjo(parametros)) {
      throw erroDeArranjo(2, parametros);
    }
    const fundido = { ...comoMapa(base), ...comoMapa(parametros) };
    if (identicoNoPhp(base, fundido)) {
      continue;
    }

    const gravado: Record<string, ValorDeJson> = {
      ...fundido,
      type: configuracao.tipo,
      user_id: contaId,
      date_modified_gmt: contexto.agora.gmt,
    };
    // `starter_content` sai porque esta gravacao nao e de conteudo inicial
    // (`:2870`-`:2873`).
    delete gravado['starter_content'];
    dados[chave] = gravado;
  }

  // 6. A linha (`:2918`-`:2952`).
  let linha: PedidoDoConjunto = { conteudo: conteudoDoConjunto(dados) };
  if (!vazioNoPhp(pedido.titulo ?? undefined)) {
    linha = { ...linha, titulo: pedido.titulo as string };
  }
  linha =
    existente !== null
      ? { ...linha, id: existente.id }
      : {
          ...linha,
          tipo: TIPO_DO_CONJUNTO_DE_ALTERACOES,
          identificador: pedido.abertura.identificador,
          estado: ESTADO_DE_RASCUNHO_AUTOMATICO,
        };
  if (pedido.estado !== null) {
    linha = { ...linha, estado: pedido.estado };
  }
  if (existente !== null && existente.estado === ESTADO_DE_RASCUNHO_AUTOMATICO) {
    linha = { ...linha, data: contexto.agora.local, dataGmt: '' };
  }

  // 7. A gravacao (`:2962`-`:2992`).
  let resultado;
  if (existente !== null) {
    resultado = contexto.conjuntos.atualizar({ ...linha, preservarData: true });
    if (contaId !== 0) {
      contexto.conjuntos.apagarSalvamentoAutomaticoDaConta(
        existente.id,
        contaId,
      );
    }
  } else {
    resultado = contexto.conjuntos.inserir(linha);
  }

  if (!resultado.ok) {
    return {
      ok: false,
      codigo: 'changeset_post_save_failure',
      falha: resultado.codigo,
      validades,
    };
  }
  return {
    ok: true,
    conjuntoId: existente !== null ? existente.id : resultado.id,
    validades,
  };
}

