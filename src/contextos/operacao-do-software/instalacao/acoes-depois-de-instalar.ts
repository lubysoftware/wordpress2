/**
 * O que a tela oferece depois de instalar um plugin — e, em particular, se
 * oferece **ativar**.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` — **CA-1.4**,
 * *"ativar o plugin depois de instalar exige uma capacidade distinta da de
 * instalar"*, e o fluxo alternativo *"Ativar o plugin logo depois de instalar"*
 * de UC-33. E `Plugin_Installer_Skin::after()`
 * (`wp-admin/includes/class-plugin-installer-skin.php:93`-`:183`), como dado:
 * a tela monta os links.
 *
 * ## A decisao, na ordem do legado
 *
 * | # | o que | linha |
 * |---|---|---|
 * | 1 | se a tela de sobrescrita do envio foi desenhada, nao ha acao nenhuma | `:95`-`:97` |
 * | 2 | `activate_plugin`, com rotulo e endereco conforme `from` (`import`, `press-this` ou o resto) | `:105`-`:124` |
 * | 3 | em rede, quem tem `manage_network_plugins` ganha `network_activate` e **perde** `activate_plugin` | `:126`-`:133` |
 * | 4 | o atalho de volta: importadores, instalador ou pagina de plugins | `:135`-`:159` |
 * | 5 | resultado falso ou erro tira **as duas** de ativar | `:161`-`:162` |
 * | 6 | senao, sem `activate_plugin` sobre o arquivo **ou** com o plugin ja ativo, tira so `activate_plugin` | `:163`-`:165` |
 * | 7 | filtro `install_plugin_complete_actions` | `:178` |
 *
 * Duas consequencias que um porte perde:
 *
 * - **A pergunta do passo 6 e `activate_plugin` com o arquivo**, e nao
 *   `install_plugins`: e a meta-capacidade de `casoDaInstalacao()`, que resolve
 *   para `activate_plugins` e, em rede sem o menu liberado, soma
 *   `manage_network_plugins`. E isso que CA-1.4 chama de *"capacidade
 *   distinta"*.
 * - **`network_activate` nao passa pelo passo 6.** So o resultado falso a tira
 *   (passo 5): em rede, quem administra os plugins da rede ve *"Network
 *   Activate"* mesmo com o plugin ja ativo. E o legado.
 *
 * O caso de tema (`Theme_Installer_Skin::after()`) oferece ativar por
 * `switch_themes`, que nao e criterio de US-1, e fica para quem portar a
 * troca de tema.
 */

import type {
  AcaoDepoisDeInstalar,
  ContextoDaInstalacao,
  ResultadoDaExecucao,
} from './contexto-da-instalacao.js';
import {
  CAPACIDADE_DE_ADMINISTRAR_PLUGINS_DA_REDE,
  CAPACIDADE_DE_ATIVAR_PLUGIN,
  perguntarNaInstalacao,
} from './permissao-da-instalacao.js';

/** `'web'` ou `'upload'` — o `$type` da tela (`update.php:139` e `:175`). */
export type OrigemDaInstalacao = 'web' | 'upload';

/** O que `after()` le alem do contexto. */
export interface FimDaInstalacaoDePlugin {
  readonly resultado: ResultadoDaExecucao;
  /** `$this->upgrader->plugin_info()` — o arquivo principal do plugin instalado. */
  readonly arquivoDoPlugin: string;
  readonly origem: OrigemDaInstalacao;
  /** `$_GET['from']`, ja sem escape; ausente vale `'plugins'` (`:104`). */
  readonly de: string | undefined;
  /** `$this->api` — a informacao do catalogo; vazia no envio. */
  readonly informacao: unknown;
  /**
   * `do_overwrite()` desenhou a comparacao de sobrescrita (`:186`-`:262`). Ela
   * compara versoes com `version_compare()` e le `get_plugins()`, que sao da
   * tela de plugins: chega pronto.
   */
  readonly sobrescritaOferecida: boolean;
}

/**
 * `urlencode( $texto )`: tudo fora de `[A-Za-z0-9_.-]` vira `%XX` em
 * maiusculas, e o espaco vira `+`.
 */
export function codificarUrlComoNoPhp(texto: string): string {
  let saida = '';
  for (const byte of new TextEncoder().encode(texto)) {
    if (
      (byte >= 0x30 && byte <= 0x39) ||
      (byte >= 0x41 && byte <= 0x5a) ||
      (byte >= 0x61 && byte <= 0x7a) ||
      byte === 0x2d ||
      byte === 0x2e ||
      byte === 0x5f
    ) {
      saida += String.fromCharCode(byte);
    } else if (byte === 0x20) {
      saida += '+';
    } else {
      saida += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return saida;
}

/**
 * As acoes, na ordem em que o legado as poe no arranjo, ou `null` quando a
 * tela de sobrescrita foi desenhada e `after()` saiu antes (passo 1).
 */
export function acoesDepoisDeInstalarPlugin(
  contexto: ContextoDaInstalacao,
  fim: FimDaInstalacaoDePlugin,
): ReadonlyMap<string, AcaoDepoisDeInstalar> | null {
  if (fim.sobrescritaOferecida) {
    return null;
  }

  const arquivo = fim.arquivoDoPlugin;
  const codificado = codificarUrlComoNoPhp(arquivo);
  const token = `activate-plugin_${arquivo}`;
  const de = fim.de ?? 'plugins';
  const acoes = new Map<string, AcaoDepoisDeInstalar>();

  if (de === 'import') {
    acoes.set('activate_plugin', {
      rotulo: 'Activate Plugin &amp; Run Importer',
      endereco: `plugins.php?action=activate&from=import&plugin=${codificado}`,
      base: 'relativo',
      token,
    });
  } else if (de === 'press-this') {
    acoes.set('activate_plugin', {
      rotulo: 'Activate Plugin &amp; Go to Press This',
      endereco: `plugins.php?action=activate&from=press-this&plugin=${codificado}`,
      base: 'relativo',
      token,
    });
  } else {
    acoes.set('activate_plugin', {
      rotulo: 'Activate Plugin',
      endereco: `plugins.php?action=activate&plugin=${codificado}`,
      base: 'relativo',
      token,
    });
  }

  if (
    contexto.autorizacao.rede.ativa &&
    perguntarNaInstalacao(
      contexto.autorizacao,
      contexto,
      CAPACIDADE_DE_ADMINISTRAR_PLUGINS_DA_REDE,
    )
  ) {
    acoes.set('network_activate', {
      rotulo: 'Network Activate',
      endereco: `plugins.php?action=activate&networkwide=1&plugin=${codificado}`,
      base: 'relativo',
      token,
    });
    acoes.delete('activate_plugin');
  }

  if (de === 'import') {
    acoes.set('importers_page', {
      rotulo: 'Go to Importers',
      endereco: 'import.php',
      base: 'admin_url',
      token: null,
    });
  } else if (fim.origem === 'web') {
    acoes.set('plugins_page', {
      rotulo: 'Go to Plugin Installer',
      endereco: 'plugin-install.php',
      base: 'self_admin_url',
      token: null,
    });
  } else if (fim.origem === 'upload' && de === 'plugins') {
    acoes.set('plugins_page', {
      rotulo: 'Go to Plugin Installer',
      endereco: 'plugin-install.php',
      base: 'self_admin_url',
      token: null,
    });
  } else {
    acoes.set('plugins_page', {
      rotulo: 'Go to Plugins page',
      endereco: 'plugins.php',
      base: 'self_admin_url',
      token: null,
    });
  }

  if (fim.resultado !== true) {
    acoes.delete('activate_plugin');
    acoes.delete('network_activate');
  } else if (
    !perguntarNaInstalacao(
      contexto.autorizacao,
      contexto,
      CAPACIDADE_DE_ATIVAR_PLUGIN,
      arquivo,
    ) ||
    contexto.pluginAtivo(arquivo)
  ) {
    acoes.delete('activate_plugin');
  }

  return (
    contexto.ganchos?.aoListarAcoesDepoisDeInstalarPlugin?.(
      acoes,
      fim.informacao,
      arquivo,
    ) ?? acoes
  );
}
