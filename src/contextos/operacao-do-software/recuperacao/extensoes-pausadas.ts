/**
 * A pausa por sessao: guardar o erro de uma extensao, ler as pausadas,
 * retomar todas, e tirar as pausadas da lista do que carrega.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — **CA-12.3**
 * (*"dentro dessa sessao, a extensao responsavel esta pausada apenas para quem
 * esta na sessao: o visitante continua vendo o site como estava"*) e a metade
 * de **CA-12.5** que retoma (`A12`).
 *
 * | funcao | legado |
 * |---|---|
 * | {@link pausarExtensao} | `WP_Paused_Extensions_Storage::set()`, `class-wp-paused-extensions-storage.php:55` |
 * | {@link extensoesPausadasDoTipo} | `::get_all()`, `:151` |
 * | {@link retomarTodasDoTipo} | `::delete_all()`, `:174` |
 * | {@link pluginsQueCarregam} | o trecho de `wp_get_active_and_valid_plugins()` e `wp_skip_paused_plugins()`, `load.php:1044` e `:1061` |
 * | {@link temasQueCarregam} | o trecho de `wp_get_active_and_valid_themes()` e `wp_skip_paused_themes()`, `load.php:1115` e `:1137` |
 *
 * ## Por que o visitante nao ve a pausa
 *
 * O nome da opcao e `"{$session_id}_paused_extensions"`, e ele **so existe**
 * quando o modo esta ativo naquela requisicao: `get_option_name()` devolve
 * texto vazio fora da sessao (`:215`-`:221`), e com nome vazio as tres
 * operacoes desistem sem tocar o banco. A requisicao do visitante nao tem o
 * cookie, logo nao tem sessao, logo nao le pausa nenhuma — e o plugin quebrado
 * **carrega** para ele, como antes do erro.
 *
 * ⚠️ `delete()` (`:86`) nao esta aqui: o unico chamador e retomar **uma**
 * extensao pela tela de plugins ou de temas (`resume_plugin()`,
 * `wp-admin/includes/plugin.php:2567`, e `resume_theme()`,
 * `wp-admin/includes/theme.php:1230`), que e superficie de BC-10, nao de US-12.
 */

import {
  arranjo,
  nomeDaChave,
  normalizarChaveDeTexto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { mesmoValorDeOpcao } from '../armazenamento/index.js';
import type { SessaoDeRecuperacao } from '../configuracao/index.js';
import type { TipoDeExtensao } from '../instalacao/contexto-da-instalacao.js';
import type {
  EstadoDaRecuperacao,
  ExtensoesNaRecuperacao,
} from './contexto-da-recuperacao.js';

/**
 * `get_option_name()` (`class-wp-paused-extensions-storage.php:214`-`:225`):
 * a sessao, ou `null` quando o legado devolveria texto vazio. `empty()` do PHP
 * tambem recusa `'0'`.
 */
function sessaoDaPausa(estado: EstadoDaRecuperacao): string | null {
  if (!estado.ativo) {
    return null;
  }
  if (estado.sessaoId === '' || estado.sessaoId === '0') {
    return null;
  }
  return estado.sessaoId;
}

function mesmaChave(entrada: EntradaDeArranjo, nome: string): boolean {
  return nomeDaChave(entrada.chave) === nomeDaChave(normalizarChaveDeTexto(nome));
}

function entradasDe(valor: ValorPhp | undefined): readonly EntradaDeArranjo[] {
  return valor !== undefined && valor.tipo === 'arranjo' ? valor.entradas : [];
}

/** `$arranjo[ $nome ] = $valor`: no lugar quando a chave existe, no fim quando nao. */
function comEntrada(
  entradas: readonly EntradaDeArranjo[],
  nome: string,
  valor: ValorPhp,
): EntradaDeArranjo[] {
  const indice = entradas.findIndex((entrada) => mesmaChave(entrada, nome));
  const nova: EntradaDeArranjo = { chave: normalizarChaveDeTexto(nome), valor };
  if (indice === -1) {
    return [...entradas, nova];
  }
  const copia = [...entradas];
  copia[indice] = { chave: copia[indice]?.chave ?? nova.chave, valor };
  return copia;
}

/**
 * `set( $extension, $error )` (`:55`-`:76`).
 *
 * O mesmo erro de novo **nao grava** e devolve verdadeiro (`:69`): a
 * comparacao e o `===` do PHP sobre o arranjo, com ordem e tipo. Um erro
 * diferente para a mesma extensao substitui o anterior no lugar.
 */
export function pausarExtensao(
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
  tipo: TipoDeExtensao,
  slug: string,
  erro: ValorPhp,
): boolean {
  const sessaoId = sessaoDaPausa(estado);
  if (sessaoId === null) {
    return false;
  }

  const registro = sessao.lerRegistroDeExtensoesPausadas(sessaoId);
  const entradas = entradasDe(registro);
  const doTipo = entradas.find((entrada) => mesmaChave(entrada, tipo));
  const jaGuardado = entradasDe(doTipo?.valor).find((entrada) =>
    mesmaChave(entrada, slug),
  );
  if (
    jaGuardado !== undefined &&
    jaGuardado.valor.tipo !== 'nulo' &&
    mesmoValorDeOpcao(jaGuardado.valor, erro)
  ) {
    return true;
  }

  const novoDoTipo = arranjo(comEntrada(entradasDe(doTipo?.valor), slug, erro));
  return sessao.gravarExtensoesPausadas(
    sessaoId,
    arranjo(comEntrada(entradas, tipo, novoDoTipo)),
  );
}

/**
 * `get_all()` (`:151`-`:165`): as pausadas de um tipo, com o erro de cada
 * uma, na ordem gravada. Fora da sessao, nenhuma.
 */
export function extensoesPausadasDoTipo(
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
  tipo: TipoDeExtensao,
): readonly EntradaDeArranjo[] {
  const sessaoId = sessaoDaPausa(estado);
  if (sessaoId === null) {
    return [];
  }
  const entradas = entradasDe(sessao.lerRegistroDeExtensoesPausadas(sessaoId));
  return entradasDe(entradas.find((entrada) => mesmaChave(entrada, tipo))?.valor);
}

/**
 * `delete_all()` (`:174`-`:194`): tira o tipo inteiro; se o arranjo ficou
 * vazio, **apaga** a opcao, senao **regrava** o que sobrou. Sair da
 * recuperacao chama os dois tipos, plugin primeiro, e cada um le a opcao de
 * novo.
 */
export function retomarTodasDoTipo(
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
  tipo: TipoDeExtensao,
): boolean {
  const sessaoId = sessaoDaPausa(estado);
  if (sessaoId === null) {
    return false;
  }
  const restantes = entradasDe(
    sessao.lerRegistroDeExtensoesPausadas(sessaoId),
  ).filter((entrada) => !mesmaChave(entrada, tipo));
  if (restantes.length === 0) {
    return sessao.apagarExtensoesPausadas(sessaoId);
  }
  return sessao.gravarExtensoesPausadas(sessaoId, arranjo(restantes));
}

/**
 * O que sobra de uma lista e o que foi tirado dela, com o erro de cada
 * tirada — o `$GLOBALS['_paused_plugins']` e o `$GLOBALS['_paused_themes']`
 * que a tela usa para o aviso (`load.php:1075` e `:1151`).
 */
export interface ListaSemPausadas {
  readonly carregam: readonly string[];
  readonly pausadas: ReadonlyMap<string, ValorPhp>;
}

/**
 * `if ( wp_is_recovery_mode() ) { $plugins = wp_skip_paused_plugins( $plugins ); }`
 * (`load.php:1044`-`:1046` e `:1061`-`:1080`).
 *
 * Recebe os caminhos absolutos que `wp_get_active_and_valid_plugins()` montou,
 * e compara o **primeiro segmento** de `plugin_basename()` com o diretorio
 * pausado: todo arquivo principal daquele diretorio sai.
 */
export function pluginsQueCarregam(
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
  extensoes: Pick<ExtensoesNaRecuperacao, 'nomeBaseDoPlugin'>,
  plugins: readonly string[],
): ListaSemPausadas {
  if (!estado.ativo) {
    return { carregam: plugins, pausadas: new Map() };
  }
  return semPausadas(
    extensoesPausadasDoTipo(sessao, estado, 'plugin'),
    plugins,
    (plugin) => extensoes.nomeBaseDoPlugin(plugin).split('/')[0] ?? '',
  );
}

/**
 * O trecho de recuperacao de `wp_get_active_and_valid_themes()`
 * (`load.php:1115`-`:1122`): tira o tema pausado e, se nao sobrar tema
 * nenhum, **desliga os temas** (`add_filter( 'wp_using_themes',
 * '__return_false' )`) — o painel continua, e o site sai sem tema para quem
 * esta na sessao.
 */
export function temasQueCarregam(
  sessao: SessaoDeRecuperacao,
  estado: EstadoDaRecuperacao,
  temas: readonly string[],
): ListaSemPausadas & { readonly semTemas: boolean } {
  if (!estado.ativo) {
    return { carregam: temas, pausadas: new Map(), semTemas: false };
  }
  const resultado = semPausadas(
    extensoesPausadasDoTipo(sessao, estado, 'theme'),
    temas,
    nomeBaseDoCaminho,
  );
  return { ...resultado, semTemas: resultado.carregam.length === 0 };
}

function semPausadas(
  pausadas: readonly EntradaDeArranjo[],
  lista: readonly string[],
  diretorio: (caminho: string) => string,
): ListaSemPausadas {
  if (pausadas.length === 0) {
    return { carregam: lista, pausadas: new Map() };
  }
  const carregam: string[] = [];
  const tiradas = new Map<string, ValorPhp>();
  for (const item of lista) {
    const nome = diretorio(item);
    const pausada = pausadas.find((entrada) => mesmaChave(entrada, nome));
    if (pausada === undefined) {
      carregam.push(item);
    } else {
      tiradas.set(nome, pausada.valor);
    }
  }
  return { carregam, pausadas: tiradas };
}

/** `basename( $caminho )` do PHP, sem sufixo: o ultimo segmento, ignorando barras no fim. */
function nomeBaseDoCaminho(caminho: string): string {
  const semBarra = caminho.replace(/\/+$/, '');
  return semBarra.slice(semBarra.lastIndexOf('/') + 1);
}
