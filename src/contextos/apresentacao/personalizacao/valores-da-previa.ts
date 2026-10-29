/**
 * Os valores da previa: o que a requisicao de quem personaliza ve no lugar do
 * que esta gravado — e o que o visitante continua vendo.
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao`, US-1,
 * **CA-1.2**: *"A previa mostra o site com as alteracoes aplicadas apenas para
 * quem esta personalizando"*.
 *
 * UC-29 fecha com *"🔴 Nao foi possivel determinar o comportamento da previa: o
 * lado cliente do Customizer nao esta nesta arvore"*, e BR-MIGRAR-117 poe o
 * cliente fora do porte. O que este arquivo porta e o **lado servidor** que o
 * alimenta, que esta inteiro na arvore:
 *
 * | o que | ancora |
 * |---|---|
 * | descartar `customized` sem a capacidade **ou** sem o nonce | `setup_theme()`, `wp-includes/class-wp-customize-manager.php:538`-`:554` |
 * | ler o conjunto carregado, com falha virando conjunto vazio | `changeset_data()`, `:1157`-`:1186` |
 * | o estado personalizado: conjunto mais `customized`, nessa ordem | `unsanitized_post_values()`, `:1760`-`:1814` |
 * | o valor de **uma** configuracao, validado e sanitizado, ou o padrao | `post_value()`, `:1836`-`:1855` |
 *
 * ## Quem ve a previa, no legado
 *
 * 1. **O visitante comum nao ve nada**: requisicao sem `wp_customize=on` e sem
 *    identificador nao instancia o Customizer (`wp-includes/theme.php:3547`), e
 *    nenhum valor e sobreposto. E o lado "nao afeta o visitante" de CA-1.1.
 * 2. **Quem tem `customize`** ve o conjunto carregado e, com o nonce de previa
 *    ou de gravacao, tambem o que mandou em `customized` sem gravar.
 * 3. ⚠️ **Quem NAO tem `customize` e carrega o identificador de um conjunto que
 *    existe ve o conjunto** — e so ele: `customized` e descartado
 *    (`:551`-`:554`) e `exclude_post_data` vale `! current_user_can( 'customize'
 *    )` (`:1764`). O comentario do legado e explicito: *"If unauthenticated then
 *    require a valid changeset UUID to load the preview. In this way, the UUID
 *    serves as a secret key"* (`:556`-`:560`). E o legado, e o **P1** manda
 *    reproduzir; CA-1.2 diz *"apenas para quem esta personalizando"*, e no
 *    legado quem esta personalizando e quem tem o identificador. A leitura esta
 *    registrada em `../README.md`.
 */

import {
  lerDadosDoConjunto,
  TIPO_DE_CONFIGURACAO_DE_MODIFICACAO,
  type ConjuntoDeAlteracoes,
  type DadosDoConjunto,
  type ValorDeJson,
} from '../armazenamento/index.js';
import {
  abrirPersonalizacao,
  type RecusaDaAbertura,
} from './abrir-a-personalizacao.js';
import type {
  ConfiguracaoDaPersonalizacao,
  ContextoDaPersonalizacao,
  PedidoDaPersonalizacao,
} from './contexto-da-personalizacao.js';
import { campoDoPedido } from './contexto-da-personalizacao.js';
import {
  PERMISSOES_DA_PERSONALIZACAO,
  perguntarNaPersonalizacao,
} from './permissao-da-personalizacao.js';

/** O estado personalizado: identificador de configuracao para valor. */
export type ValoresPersonalizados = Readonly<Record<string, ValorDeJson>>;

/** A acao do nonce de previa (`:545`, `:549`). */
export function acaoDoNonceDePrevia(folhaDeEstilo: string): string {
  return `preview-customize_${folhaDeEstilo}`;
}

/** A acao do nonce de gravacao (`:547`; `save()`, `:2442`). */
export function acaoDoNonceDeGravacao(folhaDeEstilo: string): string {
  return `save-customize_${folhaDeEstilo}`;
}

/**
 * Se `customized` sobrevive a `setup_theme()` (`:544`-`:554`): a capacidade
 * `customize` **e** um dos tres nonces — o de previa ou o de gravacao em
 * `nonce`, ou o de previa em `customize_preview_nonce`. Sem os dois, o campo e
 * apagado de `$_POST` e de `$_REQUEST`.
 */
export function aceitaValoresEnviados(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
): boolean {
  const previa = acaoDoNonceDePrevia(contexto.folhaDeEstilo);
  const gravacao = acaoDoNonceDeGravacao(contexto.folhaDeEstilo);
  const temNonce =
    contexto.verificarNonce(previa, campoDoPedido(pedido, 'nonce')) ||
    contexto.verificarNonce(gravacao, campoDoPedido(pedido, 'nonce')) ||
    contexto.verificarNonce(
      previa,
      campoDoPedido(pedido, 'customize_preview_nonce'),
    );
  return (
    perguntarNaPersonalizacao(
      contexto.autorizacao,
      PERMISSOES_DA_PERSONALIZACAO.abrir,
    ) && temNonce
  );
}

/** `is_array()` sobre o resultado de `json_decode( ..., true )`. */
function arranjoDeJson(texto: string): Record<string, ValorDeJson> | null {
  let analisado: unknown;
  try {
    analisado = JSON.parse(texto);
  } catch {
    return null;
  }
  return analisado !== null && typeof analisado === 'object'
    ? { ...(analisado as Record<string, ValorDeJson>) }
    : null;
}

/**
 * `$this->_post_values`: `json_decode( wp_unslash( $_POST['customized'] ), true
 * )`, e arranjo vazio quando o campo nao existe, foi descartado ou nao e arranjo
 * (`:1799`-`:1810`). So o **corpo** conta — `$_POST`, nao `$_REQUEST`.
 */
export function valoresEnviados(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
): Record<string, ValorDeJson> {
  const enviado = pedido.corpo['customized'];
  if (enviado === undefined || !aceitaValoresEnviados(contexto, pedido)) {
    return {};
  }
  return arranjoDeJson(enviado) ?? {};
}

/**
 * `changeset_data()` sem revisao de salvamento automatico (`:1157`-`:1186`):
 * sem linha, arranjo vazio; conteudo ilegivel, **tambem** arranjo vazio — o
 * erro e descartado (`:1177`-`:1182`), e o **P7** manda preservar o silencio.
 */
export function dadosDoConjuntoCarregado(
  conjunto: ConjuntoDeAlteracoes | null,
): DadosDoConjunto {
  if (conjunto === null) {
    return {};
  }
  const leitura = lerDadosDoConjunto(conjunto.conteudo);
  return leitura.ok ? leitura.dados : {};
}

/** `/^(?P<stylesheet>.+?)::(?P<setting_id>.+)$/` (`:1788`). */
const CHAVE_COM_FOLHA_DE_ESTILO = /^(.+?)::(.+)$/;

/** O que {@link valoresNaoSanitizados} recebe. */
export interface EntradaDosValoresPersonalizados {
  readonly dadosDoConjunto: DadosDoConjunto;
  readonly folhaDeEstilo: string;
  /** `$this->_post_values` — ver {@link valoresEnviados}. */
  readonly enviados: Readonly<Record<string, ValorDeJson>>;
  /** `exclude_changeset`. */
  readonly excluirConjunto: boolean;
  /** `exclude_post_data`. */
  readonly excluirEnviados: boolean;
}

/**
 * `unsanitized_post_values()` (`:1760`-`:1814`) para o tema ativo.
 *
 * Primeiro o conjunto, depois `customized` **por cima**. Do conjunto so entra
 * entrada **com a chave `value`** (`array_key_exists`, `:1782`), e a
 * modificacao de tema so entra se a folha de estilo do prefixo for a ativa
 * (`:1785`-`:1791`): *"Ensure that theme mods values are only used if they were
 * saved under the active theme"*. E isso que faz o conjunto guardado sob outro
 * tema nao vazar para este.
 *
 * ⚠️ O ramo dos valores guardados na troca de tema (`customize_stashed_theme_mods`,
 * `:1772`-`:1778`) so roda quando o tema pre-visualizado **nao** e o ativo, que
 * e **T017**.
 *
 * ⚠️ Entrada do conjunto que nao e arranjo faz `array_key_exists()` lancar
 * `TypeError` no PHP 8, e a requisicao morre. O modo de falha e preservado
 * (**P7**): lanca aqui tambem.
 */
export function valoresNaoSanitizados(
  entrada: EntradaDosValoresPersonalizados,
): Record<string, ValorDeJson> {
  const valores: Record<string, ValorDeJson> = {};

  if (!entrada.excluirConjunto) {
    for (const [chave, parametros] of Object.entries(entrada.dadosDoConjunto)) {
      if (parametros === null || typeof parametros !== 'object') {
        throw new TypeError(
          `array_key_exists(): Argument #2 ($array) must be of type array, ${parametros === null ? 'null' : typeof parametros} given`,
        );
      }
      const mapa = parametros as Readonly<Record<string, ValorDeJson>>;
      if (!Object.prototype.hasOwnProperty.call(mapa, 'value')) {
        continue;
      }
      const valor = mapa['value'] as ValorDeJson;
      if (mapa['type'] === TIPO_DE_CONFIGURACAO_DE_MODIFICACAO) {
        const partes = CHAVE_COM_FOLHA_DE_ESTILO.exec(chave);
        if (partes !== null && partes[1] === entrada.folhaDeEstilo) {
          valores[partes[2] as string] = valor;
        }
      } else {
        valores[chave] = valor;
      }
    }
  }

  if (!entrada.excluirEnviados) {
    Object.assign(valores, entrada.enviados);
  }
  return valores;
}

/**
 * `post_value( $setting, $default_value )` (`:1836`-`:1855`): o valor
 * personalizado da configuracao, ou o padrao quando nao ha valor, quando a
 * validacao falha, ou quando a sanitizacao devolve `null` ou erro.
 *
 * ⚠️ **Quem escolhe o padrao e quem chama.** O filtro de previa da modificacao
 * de tema passa um sentinela e, sem valor personalizado, devolve o **default
 * declarado da configuracao**, nao o valor gravado
 * (`WP_Customize_Setting::_preview_filter()`,
 * `wp-includes/class-wp-customize-setting.php:453`-`:470`). Instalar esse filtro
 * por configuracao e `WP_Customize_Setting::preview()`, que depende do registro
 * de configuracoes e nao e portado aqui.
 */
export function valorNaPrevia(
  configuracao: ConfiguracaoDaPersonalizacao,
  valores: Readonly<Record<string, ValorDeJson>>,
  padrao: ValorDeJson,
): ValorDeJson {
  if (!Object.prototype.hasOwnProperty.call(valores, configuracao.id)) {
    return padrao;
  }
  const valor = valores[configuracao.id] as ValorDeJson;
  if (configuracao.validar(valor) !== true) {
    return padrao;
  }
  const sanitizado = configuracao.sanitizar(valor);
  if (!sanitizado.ok || sanitizado.valor === null) {
    return padrao;
  }
  return sanitizado.valor;
}

export type ResultadoDaPrevia =
  /** O visitante: o Customizer nao existe nesta requisicao. */
  | { readonly emPrevia: false; readonly recusa: null }
  | { readonly emPrevia: false; readonly recusa: RecusaDaAbertura }
  | {
      readonly emPrevia: true;
      readonly identificador: string;
      readonly valores: Readonly<Record<string, ValorDeJson>>;
    };

/**
 * A requisicao do site **com** a previa: abre a personalizacao (o portao de
 * `abrir-a-personalizacao.ts`) e monta o estado personalizado.
 *
 * Nao grava nada — nem o conjunto, nem a trava, nem modificacao de tema.
 */
export function pedirPrevia(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
): ResultadoDaPrevia {
  const abertura = abrirPersonalizacao(contexto, pedido);
  if (abertura.situacao === 'fora-da-personalizacao') {
    return { emPrevia: false, recusa: null };
  }
  if (abertura.situacao === 'recusada') {
    return { emPrevia: false, recusa: abertura.recusa };
  }
  const pode = perguntarNaPersonalizacao(
    contexto.autorizacao,
    PERMISSOES_DA_PERSONALIZACAO.abrir,
  );
  return {
    emPrevia: true,
    identificador: abertura.identificador,
    valores: valoresNaoSanitizados({
      dadosDoConjunto: dadosDoConjuntoCarregado(abertura.conjunto),
      folhaDeEstilo: contexto.folhaDeEstilo,
      enviados: valoresEnviados(contexto, pedido),
      excluirConjunto: false,
      excluirEnviados: !pode,
    }),
  };
}
