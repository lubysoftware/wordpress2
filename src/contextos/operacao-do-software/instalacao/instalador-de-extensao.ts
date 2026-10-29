/**
 * Os metodos publicos de `Plugin_Upgrader` e `Theme_Upgrader` que a tela de
 * US-1 chama: `install()`, `upgrade()` e `bulk_upgrade()`.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` — **CA-1.5**,
 * *"numa atualizacao em lote, a capacidade e verificada uma vez e cada item tem
 * resultado proprio; um que falha nao interrompe os demais"*, e o caminho por
 * onde CA-1.2 e CA-1.3 entregam o pacote.
 *
 * O que cada metodo decide aqui e **qual pacote vai para qual destino, com qual
 * `hook_extra` e com quais filtros acoplados**; aplicar o pacote e o `run()` do
 * legado, que chega por {@link ExecucaoDoPacote} (ver o cabecalho de
 * `contexto-da-instalacao.ts`).
 *
 * ## O lote, na ordem do legado (`class-plugin-upgrader.php:285`-`:448`, `class-theme-upgrader.php:383`-`:548`)
 *
 * | # | passo | plugin | tema |
 * |---|---|---|---|
 * | 1 | le as ofertas **uma vez** | `get_site_transient( 'update_plugins' )`, `:297` | `'update_themes'`, `:394` |
 * | 2 | conecta ao sistema de arquivos; `false` encerra **sem resultado nenhum** | `WP_CONTENT_DIR` e `WP_PLUGIN_DIR`, `:304` | so `WP_CONTENT_DIR`, `:403` |
 * | 3 | decide a manutencao **antes** do primeiro item | rede com itens, ou plugin ativo com oferta, `:318`-`:324` | rede com itens, ou o tema e o ativo, `:417`-`:423` |
 * | 4 | item sem oferta: resultado `true`, sem `run()` | `:334`-`:341` | `:434`-`:441` |
 * | 5 | oferta que exige nucleo mais novo: `WP_Error` no item | `:348`-`:361` | `:446`-`:459` |
 * | 6 | oferta que exige PHP mais novo: `WP_Error` no item | `:362`-`:375` | `:460`-`:473` |
 * | 7 | o resto: `run()` com `is_multi` | `:376`-`:396` | `:474`-`:494` |
 * | 8 | o resultado vai para o item; **so `false` interrompe** | `:398`-`:403` | `:496`-`:501` |
 * | 9 | sai da manutencao **sempre**, mesmo sem ter entrado | `:406` | `:504` |
 *
 * ## O que CA-1.5 diz e o que o legado faz, lado a lado
 *
 * *"A capacidade e verificada uma vez"*: e a tela que pergunta, antes de chamar
 * este metodo (`wp-admin/update.php:28`, `:233`); `bulk_upgrade()` nao pergunta
 * capacidade nenhuma, nem por item.
 *
 * *"Cada item tem resultado proprio; um que falha nao interrompe os demais"*: o
 * resultado e um mapa por item, e `WP_Error` fica no item e o laco segue. ⚠️ O
 * unico resultado que **interrompe** e `false` — o `run()` que nao conseguiu
 * abrir o sistema de arquivos e desenhou a tela de credencial
 * (`class-plugin-upgrader.php:400`, *"Prevent credentials auth screen from
 * displaying multiple times"*). Isso nao e falha do item, e falha da conexao,
 * que vale para todos: os itens seguintes **nao aparecem** no mapa. E o legado,
 * e esta reproduzido.
 *
 * 🔴 **A decisao de manutencao do passo 3 e o conflito #4 do README** (CA-4.1
 * contra o `@todo` de `:316`). Ela esta aqui na forma do legado porque e o
 * legado, e **o escopo** da manutencao — a rede inteira, pelo marcador em
 * `ABSPATH` — e de `maintenance_mode()`, que e T009. Esta tarefa nao escolhe
 * lado: quem decidir o conflito muda a expressao e o marcador juntos.
 *
 * As duas comparacoes de versao dos passos 5 e 6 sao `is_wp_version_compatible()`
 * e `is_php_version_compatible()`, e chegam prontas do ambiente: comparar versao
 * e US-3 (T007). As mensagens sao as do legado.
 */

import type {
  ContextoDaInstalacao,
  ErroDeInstalacao,
  OfertaDeAtualizacao,
  ResultadoDaExecucao,
  TipoDeExtensao,
} from './contexto-da-instalacao.js';

/** `incompatible_wp_required_version` (`class-plugin-upgrader.php:350`). */
export const CODIGO_DE_NUCLEO_INCOMPATIVEL = 'incompatible_wp_required_version';

/** `incompatible_php_required_version` (`class-plugin-upgrader.php:364`). */
export const CODIGO_DE_PHP_INCOMPATIVEL = 'incompatible_php_required_version';

/** `up_to_date` — a chave da mensagem de item sem oferta. */
export const CODIGO_DE_JA_ATUALIZADO = 'up_to_date';

/**
 * Os metodos que o legado pendura em filtro em volta de cada chamada, por
 * metodo e tipo, com a linha do `add_filter()`.
 */
const FILTROS = {
  installPlugin: ['check_package'], // class-plugin-upgrader.php:128
  installTheme: ['check_package', 'check_parent_theme_filter'], // class-theme-upgrader.php:240-241
  upgradePlugin: [
    'deactivate_plugin_before_upgrade',
    'active_before',
    'delete_old_plugin',
    'active_after',
  ], // class-plugin-upgrader.php:211-214
  upgradeTheme: ['current_before', 'current_after', 'delete_old_theme'], // class-theme-upgrader.php:316-318
  // No lote, `delete_old_plugin` e pendurado uma vez antes do laco (:299) e
  // `check_package` em volta de cada `run()` (:377).
  bulkPlugin: ['delete_old_plugin', 'check_package'],
  // No lote de tema os tres de `upgrade()` ficam o lote inteiro (:396-398).
  bulkTheme: ['current_before', 'current_after', 'delete_old_theme', 'check_package'],
} as const;

/**
 * O argumento `overwrite_package` de `install()`: `false`, ou o texto que a
 * tela de envio aceitou (`update.php:177`-`:178`, `:329`-`:330`).
 */
export type SobrescritaDoPacote = false | string;

/**
 * `install( $package, array( 'overwrite_package' => $sobrescrita ) )`.
 *
 * `destination` e `WP_PLUGIN_DIR` ou `get_theme_root()`, `clear_destination` e
 * a propria sobrescrita, e o `hook_extra` so leva tipo e acao — nao ha copia de
 * seguranca na instalacao (`class-plugin-upgrader.php:135`-`:146`,
 * `class-theme-upgrader.php:248`-`:259`).
 */
export function instalarPacote(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  pacote: string,
  sobrescrita: SobrescritaDoPacote,
): ResultadoDaExecucao {
  const resultado = contexto.execucao.rodar({
    tipo,
    package: pacote,
    destination: tipo === 'plugin' ? contexto.pastas.plugins : contexto.pastas.temas,
    clear_destination: sobrescrita,
    clear_working: true,
    hook_extra: { type: tipo, action: 'install' },
    filtrosAcoplados: tipo === 'plugin' ? FILTROS.installPlugin : FILTROS.installTheme,
  });

  if (resultado !== true) {
    return resultado;
  }

  contexto.execucao.concluir({
    metodo: 'install',
    tipo,
    package: pacote,
    overwrite_package: sobrescrita,
  });
  return true;
}

function copiaDeSeguranca(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  item: string,
): { readonly slug: string; readonly src: string; readonly dir: 'plugins' | 'themes' } {
  return tipo === 'plugin'
    ? { slug: diretorioDoPlugin(item), src: contexto.pastas.plugins, dir: 'plugins' }
    : { slug: item, src: contexto.pastas.raizDoTema(item), dir: 'themes' };
}

/**
 * `dirname( $plugin )` para o caminho relativo de plugin: o que vem antes da
 * ultima barra, ou `.` quando nao ha barra — plugin de arquivo unico.
 */
export function diretorioDoPlugin(plugin: string): string {
  const semBarraFinal = plugin.replace(/\/+$/, '');
  const corte = semBarraFinal.lastIndexOf('/');
  if (corte < 0) {
    return '.';
  }
  const pasta = semBarraFinal.slice(0, corte).replace(/\/+$/, '');
  return pasta === '' ? '/' : pasta;
}

function ofertasDo(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
): ReadonlyMap<string, OfertaDeAtualizacao> {
  return tipo === 'plugin' ? contexto.ofertasDePlugins() : contexto.ofertasDeTemas();
}

/**
 * `upgrade( $item )` — a atualizacao de um so.
 *
 * Sem oferta, devolve `false` **sem chamar `run()`** e com o erro
 * `up_to_date` na tela (`class-plugin-upgrader.php:199`-`:206`,
 * `class-theme-upgrader.php:305`-`:312`). ⚠️ Note que aqui o resultado e
 * `false`, e no lote o mesmo caso e `true`.
 *
 * ⚠️ A atualizacao de um so **nao** confere `requires` nem `requires_php`: so o
 * lote confere. E o legado.
 */
export function atualizarItem(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  item: string,
): ResultadoDaExecucao {
  const oferta = ofertasDo(contexto, tipo).get(item);
  if (oferta === undefined) {
    return false;
  }

  const resultado = contexto.execucao.rodar({
    tipo,
    package: oferta.package,
    destination: tipo === 'plugin' ? contexto.pastas.plugins : contexto.pastas.raizDoTema(item),
    clear_destination: true,
    clear_working: true,
    hook_extra:
      tipo === 'plugin'
        ? {
            plugin: item,
            type: 'plugin',
            action: 'update',
            temp_backup: copiaDeSeguranca(contexto, tipo, item),
          }
        : {
            theme: item,
            type: 'theme',
            action: 'update',
            temp_backup: copiaDeSeguranca(contexto, tipo, item),
          },
    filtrosAcoplados: tipo === 'plugin' ? FILTROS.upgradePlugin : FILTROS.upgradeTheme,
  });

  if (resultado !== true) {
    return resultado;
  }

  contexto.execucao.concluir({ metodo: 'upgrade', tipo, item });
  return true;
}

function exigida(valor: string | null | undefined): valor is string {
  return valor !== undefined && valor !== null;
}

function nomeDoTipo(tipo: TipoDeExtensao): string {
  return tipo === 'plugin' ? 'plugin' : 'theme';
}

/** O `WP_Error` do passo 5 (`class-plugin-upgrader.php:349`-`:357`, `class-theme-upgrader.php:447`-`:455`). */
function nucleoIncompativel(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  exigidaPelaOferta: string,
): ErroDeInstalacao {
  return {
    codigo: CODIGO_DE_NUCLEO_INCOMPATIVEL,
    mensagem: `Your WordPress version is ${contexto.ambiente.versaoDoNucleo}, however the new ${nomeDoTipo(tipo)} version requires ${exigidaPelaOferta}.`,
  };
}

/** O `WP_Error` do passo 6 (`class-plugin-upgrader.php:363`-`:371`, `class-theme-upgrader.php:461`-`:469`). */
function phpIncompativel(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  exigidaPelaOferta: string,
): ErroDeInstalacao {
  return {
    codigo: CODIGO_DE_PHP_INCOMPATIVEL,
    mensagem: `The PHP version on your server is ${contexto.ambiente.versaoDoPhp}, however the new ${nomeDoTipo(tipo)} version requires ${exigidaPelaOferta}.`,
  };
}

function precisaDeManutencao(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  itens: readonly string[],
  ofertas: ReadonlyMap<string, OfertaDeAtualizacao>,
): boolean {
  let manutencao = contexto.autorizacao.rede.ativa && itens.length > 0;
  for (const item of itens) {
    manutencao =
      manutencao ||
      (tipo === 'plugin'
        ? contexto.pluginAtivo(item) && ofertas.has(item)
        : contexto.folhaDeEstiloAtiva === item || contexto.modeloAtivo === item);
  }
  return manutencao;
}

/**
 * `bulk_upgrade( $itens )` — o lote, com um resultado por item, ou `false`
 * quando a conexao com o sistema de arquivos falha antes do primeiro.
 *
 * O mapa guarda a ordem da **primeira** ocorrencia de cada item e o resultado da
 * **ultima**, que e o que `$results[ $item ] = ...` faz num arranjo do PHP
 * quando o mesmo item chega duas vezes.
 */
export function atualizarEmLote(
  contexto: ContextoDaInstalacao,
  tipo: TipoDeExtensao,
  itens: readonly string[],
): ReadonlyMap<string, ResultadoDaExecucao> | false {
  const ofertas = ofertasDo(contexto, tipo);

  const pastas =
    tipo === 'plugin'
      ? [contexto.pastas.conteudo, contexto.pastas.plugins]
      : [contexto.pastas.conteudo];
  if (!contexto.execucao.conectar(pastas)) {
    return false;
  }

  if (precisaDeManutencao(contexto, tipo, itens, ofertas)) {
    contexto.execucao.manutencao(true);
  }

  const resultados = new Map<string, ResultadoDaExecucao>();
  for (const item of itens) {
    const oferta = ofertas.get(item);
    if (oferta === undefined) {
      resultados.set(item, true);
      continue;
    }

    let resultado: ResultadoDaExecucao;
    if (exigida(oferta.requires) && !contexto.ambiente.nucleoCompativel(oferta.requires)) {
      resultado = nucleoIncompativel(contexto, tipo, oferta.requires);
    } else if (
      exigida(oferta.requires_php) &&
      !contexto.ambiente.phpCompativel(oferta.requires_php)
    ) {
      resultado = phpIncompativel(contexto, tipo, oferta.requires_php);
    } else {
      resultado = contexto.execucao.rodar({
        tipo,
        package: oferta.package,
        destination:
          tipo === 'plugin' ? contexto.pastas.plugins : contexto.pastas.raizDoTema(item),
        clear_destination: true,
        clear_working: true,
        is_multi: true,
        hook_extra:
          tipo === 'plugin'
            ? { plugin: item, temp_backup: copiaDeSeguranca(contexto, tipo, item) }
            : { theme: item, temp_backup: copiaDeSeguranca(contexto, tipo, item) },
        filtrosAcoplados: tipo === 'plugin' ? FILTROS.bulkPlugin : FILTROS.bulkTheme,
      });
    }

    resultados.set(item, resultado);

    if (resultado === false) {
      break;
    }
  }

  contexto.execucao.manutencao(false);

  contexto.execucao.concluir({ metodo: 'bulk_upgrade', tipo, itens, resultados });

  return resultados;
}
