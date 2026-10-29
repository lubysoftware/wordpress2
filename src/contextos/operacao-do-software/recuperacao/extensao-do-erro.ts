/**
 * O erro fatal e a extensao que o causou: quais erros contam, de quem e a
 * culpa, e como o erro e descrito e gravado.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — a primeira
 * metade de **CA-12.1** (*"erro fatal em area protegida identifica a extensao
 * responsavel"*) e a metade de `A11` sobre extensao de rede.
 *
 * | funcao | legado |
 * |---|---|
 * | {@link deveTratarErro} | `should_handle_error()`, `class-wp-fatal-error-handler.php:100` |
 * | {@link extensaoDoErro} | `get_extension_for_error()`, `class-wp-recovery-mode.php:351` |
 * | {@link pluginDeRede} | `is_network_plugin()`, `:404` |
 * | {@link descricaoDoErro} | `wp_get_extension_error_description()`, `error-protection.php:47` |
 * | {@link registroDoErro} | o arranjo de `error_get_last()` que `set()` grava |
 *
 * ## 🔴 A metade de `A11` sobre extensao de rede nao e feita por `is_network_plugin()`
 *
 * `wp_get_active_network_plugins()` devolve caminhos **absolutos**
 * (`WP_PLUGIN_DIR . '/' . $plugin`, `ms-load.php:52`), e `is_network_plugin()`
 * os compara com `str_starts_with( $plugin, $slug . '/' )`
 * (`class-wp-recovery-mode.php:416`) — que so casa se a pasta de plugins for
 * vazia ou relativa. O que de fato deixa a rede fora e o portao de
 * `wp-settings.php:573` (`! is_multisite()` antes de `initialize()`) e o de
 * `class-wp-fatal-error-handler.php:54`: em rede o modo nunca inicializa e o
 * erro nunca chega a `handle_error()`. A comparacao esta reproduzida como e, e
 * o teste afirma que ela nao casa caminho absoluto.
 */

import {
  arranjoPorNome,
  inteiro,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { verdadeiroNoPhp } from '../instalacao/texto-como-no-php.js';
import type {
  ContextoDaRecuperacao,
  ErroFatal,
  ExtensaoResponsavel,
} from './contexto-da-recuperacao.js';

/**
 * Os cinco niveis que o tratador trata sem perguntar, na ordem do legado
 * (`class-wp-fatal-error-handler.php:101`-`:107`): `E_ERROR`, `E_PARSE`,
 * `E_USER_ERROR`, `E_COMPILE_ERROR` e `E_RECOVERABLE_ERROR`.
 */
export const NIVEIS_DE_ERRO_TRATADOS: readonly number[] = [1, 4, 256, 64, 4096];

/**
 * O nome de cada constante `E_*` do grupo `Core` do interpretador do legado
 * (PHP 8.3, a versao do oraculo), que `wp_get_extension_error_description()`
 * usa para trocar o numero pelo nome (`error-protection.php:48`-`:60`).
 */
export const NOMES_DOS_NIVEIS_DE_ERRO: ReadonlyMap<number, string> = new Map([
  [1, 'E_ERROR'],
  [2, 'E_WARNING'],
  [4, 'E_PARSE'],
  [8, 'E_NOTICE'],
  [16, 'E_CORE_ERROR'],
  [32, 'E_CORE_WARNING'],
  [64, 'E_COMPILE_ERROR'],
  [128, 'E_COMPILE_WARNING'],
  [256, 'E_USER_ERROR'],
  [512, 'E_USER_WARNING'],
  [1024, 'E_USER_NOTICE'],
  [2048, 'E_STRICT'],
  [4096, 'E_RECOVERABLE_ERROR'],
  [8192, 'E_DEPRECATED'],
  [16384, 'E_USER_DEPRECATED'],
  [32767, 'E_ALL'],
]);

/**
 * `'An error of type %1$s was caused in line %2$s of the file %3$s. Error
 * message: %4$s'` (`error-protection.php:63`).
 */
export const MODELO_DA_DESCRICAO_DO_ERRO =
  'An error of type %1$s was caused in line %2$s of the file %3$s. Error message: %4$s';

/** `should_handle_error( $error )` (`class-wp-fatal-error-handler.php:100`-`:126`). */
export function deveTratarErro(
  contexto: ContextoDaRecuperacao,
  erro: ErroFatal,
): boolean {
  if (NIVEIS_DE_ERRO_TRATADOS.includes(erro.tipo)) {
    return true;
  }
  const aoPerguntar = contexto.ganchos?.aoPerguntarSeTrataErro;
  return aoPerguntar === undefined
    ? false
    : verdadeiroNoPhp(aoPerguntar(false, erro));
}

/**
 * `get_extension_for_error( $error )`
 * (`class-wp-recovery-mode.php:351`-`:394`).
 *
 * A pasta de plugins e consultada **antes** das de tema, e a comparacao e de
 * prefixo **sem barra**: com `WP_PLUGIN_DIR` em `/srv/plugins`, um arquivo em
 * `/srv/plugins-extra/x.php` e atribuido a um plugin de diretorio **vazio** — o
 * `str_replace()` nao encontra `/srv/plugins/`, o caminho absoluto e partido e
 * o primeiro pedaco e o que vem antes da barra inicial. Esta reproduzido.
 */
export function extensaoDoErro(
  contexto: ContextoDaRecuperacao,
  erro: ErroFatal,
): ExtensaoResponsavel | null {
  const pastaDePlugins = contexto.constantes.WP_PLUGIN_DIR;
  if (pastaDePlugins === undefined) {
    return null;
  }

  const arquivo = normalizarCaminho(erro.arquivo);
  const plugins = normalizarCaminho(pastaDePlugins);

  if (arquivo.startsWith(plugins)) {
    return { tipo: 'plugin', slug: primeiroSegmento(arquivo, plugins) };
  }

  const pastas = contexto.instalacao.pastasDeTemas;
  if (pastas.length === 0) {
    return null;
  }

  for (const pasta of pastas) {
    const temas = normalizarCaminho(pasta);
    if (arquivo.startsWith(temas)) {
      return { tipo: 'theme', slug: primeiroSegmento(arquivo, temas) };
    }
  }

  return null;
}

/** `explode( '/', str_replace( $pasta . '/', '', $arquivo ) )[0]` (`:366`-`:371`). */
function primeiroSegmento(arquivo: string, pasta: string): string {
  const relativo = arquivo.split(`${pasta}/`).join('');
  return relativo.split('/')[0] ?? '';
}

/** `is_network_plugin( $extension )` (`class-wp-recovery-mode.php:404`-`:422`). Ver o cabecalho. */
export function pluginDeRede(
  contexto: ContextoDaRecuperacao,
  extensao: ExtensaoResponsavel,
): boolean {
  if (extensao.tipo !== 'plugin') {
    return false;
  }
  if (!contexto.instalacao.emRede) {
    return false;
  }
  return contexto.instalacao
    .pluginsAtivosNaRede()
    .some((plugin) => plugin.startsWith(`${extensao.slug}/`));
}

/**
 * `wp_get_extension_error_description( $error )`
 * (`error-protection.php:47`-`:72`): o nivel vira o nome da constante quando
 * ha uma, e os quatro campos vao entre `<code>`.
 */
export function descricaoDoErro(erro: ErroFatal): string {
  const nivel = NOMES_DOS_NIVEIS_DE_ERRO.get(erro.tipo) ?? String(erro.tipo);
  const valores = [nivel, String(erro.linha), erro.arquivo, erro.mensagem];
  // Uma passada so, como o `sprintf()`: um `%4$s` dentro do caminho do arquivo
  // nao e substituido pela mensagem.
  return MODELO_DA_DESCRICAO_DO_ERRO.replace(
    /%([1-4])\$s/g,
    (_, posicao: string) => `<code>${valores[Number(posicao) - 1] ?? ''}</code>`,
  );
}

/**
 * O erro como o legado o grava: o arranjo de `error_get_last()`, com as
 * chaves `type`, `message`, `file` e `line`, nesta ordem.
 */
export function registroDoErro(erro: ErroFatal): ValorPhp {
  return arranjoPorNome([
    ['type', inteiro(erro.tipo)],
    ['message', texto(erro.mensagem)],
    ['file', texto(erro.arquivo)],
    ['line', inteiro(erro.linha)],
  ]);
}

/**
 * `wp_normalize_path( $caminho )` (`wp-includes/functions.php:2194`-`:2224`),
 * repetida de `leitura-publica/apresentacao/caminho-de-modelo.ts` porque a
 * regra de dependencia 3 proibe o `import`. A mesma lacuna declarada la vale
 * aqui: o involucro de fluxo (`wp_is_stream()`, `:2205`) nao e separado, e
 * nenhum caminho de plugin ou tema do nucleo e um fluxo.
 */
export function normalizarCaminho(caminho: string): string {
  let normalizado = caminho.replace(/\\/g, '/');
  normalizado = normalizado.replace(/(?<=[^\n])\/+/g, '/');
  if (normalizado.slice(1, 2) === ':') {
    normalizado = normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
  }
  return normalizado;
}
