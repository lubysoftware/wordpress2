/**
 * A area de instalacao e atualizacao de extensao, composta sobre a porta de
 * cliente externo do modulo.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` (US-1). A unica
 * porta que esta area guarda e a de cliente externo, porque e a unica que ela
 * mesma usa: a consulta ao catalogo (CA-1.2). Disco, anexo, fila e o `run()` do
 * legado chegam por chamada, em {@link ContextoDaInstalacao}, porque cada um e
 * de outra historia ou de outro contexto — ver `contexto-da-instalacao.ts`.
 *
 * Compor a area nao toca porta nenhuma (`EXT-ORDEM`, BR-MIGRAR-106).
 */

import type { Capacidade } from '../../../plataforma/autorizacao/index.js';
import type { PortaDeClienteExterno } from '../portas/index.js';
import {
  acoesDepoisDeInstalarPlugin,
  type FimDaInstalacaoDePlugin,
} from './acoes-depois-de-instalar.js';
import {
  consultarInformacaoDoPlugin,
  consultarInformacaoDoTema,
} from './consulta-ao-catalogo.js';
import type {
  AcaoDepoisDeInstalar,
  ContextoDaInstalacao,
  RespostaDoCatalogo,
} from './contexto-da-instalacao.js';
import { perguntarNaInstalacao } from './permissao-da-instalacao.js';
import {
  atenderTelaDeAtualizacao,
  type PedidoDaTelaDeAtualizacao,
  type RespostaDaTelaDeAtualizacao,
} from './tela-de-atualizacao.js';

/**
 * As operacoes de US-1. A permissao declarada de cada acao da tela esta em
 * `PERMISSOES_DA_INSTALACAO` (P4); as duas consultas ao catalogo **nao**
 * declaram capacidade porque, no legado, `plugins_api()` e `themes_api()` nao
 * perguntam nada — quem pergunta e a tela, antes de chama-las.
 */
export interface AreaDeInstalacao {
  /** `wp-admin/update.php`, as oito acoes de US-1. */
  atenderTelaDeAtualizacao(
    contexto: ContextoDaInstalacao,
    pedido: PedidoDaTelaDeAtualizacao,
  ): RespostaDaTelaDeAtualizacao;
  /** `plugins_api( 'plugin_information', ... )`, na forma da tela. */
  consultarInformacaoDoPlugin(
    contexto: ContextoDaInstalacao,
    slug: string,
  ): RespostaDoCatalogo;
  /** `themes_api( 'theme_information', ... )`, na forma da tela. */
  consultarInformacaoDoTema(
    contexto: ContextoDaInstalacao,
    slug: string,
  ): RespostaDoCatalogo;
  /** `Plugin_Installer_Skin::after()` — o que se oferece depois de instalar (CA-1.4). */
  acoesDepoisDeInstalarPlugin(
    contexto: ContextoDaInstalacao,
    fim: FimDaInstalacaoDePlugin,
  ): ReadonlyMap<string, AcaoDepoisDeInstalar> | null;
  /** `current_user_can()` com os dois `case` de US-1 na traducao. */
  perguntar(
    contexto: ContextoDaInstalacao,
    capacidade: Capacidade,
    ...argumentos: readonly unknown[]
  ): boolean;
}

export function criarAreaDeInstalacao(
  clienteExterno: PortaDeClienteExterno,
): AreaDeInstalacao {
  return {
    atenderTelaDeAtualizacao: (contexto, pedido) =>
      atenderTelaDeAtualizacao(clienteExterno, contexto, pedido),
    consultarInformacaoDoPlugin: (contexto, slug) =>
      consultarInformacaoDoPlugin(clienteExterno, contexto, slug),
    consultarInformacaoDoTema: (contexto, slug) =>
      consultarInformacaoDoTema(clienteExterno, contexto, slug),
    acoesDepoisDeInstalarPlugin,
    perguntar: (contexto, capacidade, ...argumentos) =>
      perguntarNaInstalacao(contexto.autorizacao, contexto, capacidade, ...argumentos),
  };
}
