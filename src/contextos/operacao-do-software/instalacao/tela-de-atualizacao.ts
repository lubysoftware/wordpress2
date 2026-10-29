/**
 * A tela de instalar e atualizar extensao — `wp-admin/update.php`, as oito
 * acoes de US-1.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` (US-1). E aqui que
 * os criterios se encontram:
 *
 * | criterio | onde, nesta tela | linha do legado |
 * |---|---|---|
 * | CA-1.1 — capacidade **e** token | toda acao pergunta a capacidade e confere o token **antes** de qualquer efeito | `:28`-`:32`, `:56`-`:60`, `:106`-`:112`, `:151`-`:155`, `:210`-`:214`, `:233`-`:237`, `:261`-`:267`, `:303`-`:307` |
 * | CA-1.2 — catalogo | `install-plugin` e `install-theme` consultam o servico e instalam o `download_link` | `:113`-`:145`, `:268`-`:297` |
 * | CA-1.3 — envio | `upload-plugin` e `upload-theme` perguntam `upload_*` e **nao** consultam o servico | `:149`-`:185`, `:301`-`:337` |
 * | CA-1.5 — lote | `update-selected` e `update-selected-themes` perguntam **uma vez** e entregam a lista inteira | `:27`-`:53`, `:232`-`:258` |
 * | CA-1.6, CA-1.7 | a pergunta de cada acao passa por `casoDaInstalacao()` | `wp-includes/capabilities.php:619`-`:642` |
 *
 * ## A ordem dentro de cada acao, e por que ela e observavel
 *
 * **Capacidade primeiro, token depois** (as oito acoes). Quem nao pode ve a
 * mensagem de permissao mesmo com token vencido; quem pode e tem token vencido
 * ve *"The link you followed has expired."* — e em `install-*` isso acontece
 * **antes** da consulta ao catalogo, logo token vencido nao gasta chamada de
 * rede.
 *
 * **No envio, o `.zip` e conferido depois do token** (`:157`-`:159`) e so se o
 * formulario trouxe arquivo: o pacote pode chegar pelo identificador do anexo
 * (`File_Upload_Upgrader`, `:115`-`:125`), e ai nao ha nome a conferir.
 *
 * **No envio, o pacote e limpo quando o resultado e verdadeiro ou erro**
 * (`:182`-`:184`): `false` — a tela de credencial — **mantem** o pacote, porque a
 * proxima tentativa, com credencial, o usa de novo pelo identificador.
 *
 * ## O que esta tela NAO porta, e devolve como tal
 *
 * `activate-plugin` (`:78`-`:103`, a reativacao depois de atualizar, que pede
 * `update_plugins` e **inclui o arquivo do plugin** para mostrar o erro fatal),
 * `upload-plugin-cancel-overwrite` e `upload-theme-cancel-overwrite`
 * (`:188`-`:207`, `:340`-`:359`) nao sao criterio de US-1. Elas voltam como
 * `nao-portada`, e **nao** como acao personalizada: disparar
 * `update-custom_activate-plugin` para elas seria disparar ponto de extensao que o
 * legado nao dispara (P2).
 *
 * O texto da tela (titulo, cabecalho, *skin*) e da borda: a tela entra como
 * dado.
 */

import type { PortaDeClienteExterno } from '../portas/index.js';
import {
  campoDaInformacao,
  consultarInformacaoDoPlugin,
  consultarInformacaoDoTema,
} from './consulta-ao-catalogo.js';
import type {
  ContextoDaInstalacao,
  ErroDeInstalacao,
  PacoteEnviado,
  ResultadoDaExecucao,
  TipoDeExtensao,
} from './contexto-da-instalacao.js';
import {
  atualizarEmLote,
  atualizarItem,
  instalarPacote,
} from './instalador-de-extensao.js';
import {
  MENSAGEM_DE_TOKEN_VENCIDO,
  PERMISSOES_DA_INSTALACAO,
  TITULO_DE_TOKEN_VENCIDO,
  acaoDoToken,
  mensagemSemPermissao,
  perguntarNaInstalacao,
  type AcaoDaTelaDeAtualizacao,
} from './permissao-da-instalacao.js';
import {
  apararComoNoPhp,
  decodificarUrlComoNoPhp,
  textoComoNoPhp,
} from './texto-como-no-php.js';

/** `update.php:158` e `:310`. */
export const MENSAGEM_DE_ARQUIVO_QUE_NAO_E_ZIP = 'Only .zip archives may be uploaded.';

/** As tres acoes do legado que esta tarefa nao porta. Ver o cabecalho. */
export const ACOES_NAO_PORTADAS: readonly string[] = [
  'activate-plugin',
  'upload-plugin-cancel-overwrite',
  'upload-theme-cancel-overwrite',
];

/** Os valores de sobrescrita que o envio de plugin aceita (`update.php:178`). */
const SOBRESCRITAS_DE_PLUGIN = ['update-plugin', 'downgrade-plugin'];

/** Os valores de sobrescrita que o envio de tema aceita (`update.php:330`). */
const SOBRESCRITAS_DE_TEMA = ['update-theme', 'downgrade-theme'];

/**
 * O pedido, como a borda o entrega: ja sem barra de escape e com
 * `$_GET['overwrite']` ja passado por `sanitize_text_field()`, que e da
 * plataforma de sanitizacao.
 */
export interface PedidoDaTelaDeAtualizacao {
  /** `$_REQUEST['action']`. */
  readonly acao: string;
  /** `$_REQUEST['plugin']`, antes do `trim()` de `:23`. */
  readonly plugin?: string;
  /** `$_REQUEST['theme']`, antes do `urldecode()` de `:24`. */
  readonly tema?: string;
  /** `$_REQUEST['_wpnonce']`. */
  readonly token?: string;
  /** `$_GET['plugins']` — a lista separada por virgula. */
  readonly pluginsNaUrl?: string;
  /** `$_GET['themes']`. */
  readonly temasNaUrl?: string;
  /** `$_POST['checked']` — so lida quando a lista nao veio na URL. */
  readonly marcados?: string | readonly string[];
  /** `$_GET['from']`. */
  readonly de?: string;
  /** `sanitize_text_field( $_GET['overwrite'] )`. */
  readonly sobrescrita?: string;
  /** `$_FILES['pluginzip']['name']` ou `$_FILES['themezip']['name']`, quando ha. */
  readonly nomeDoArquivoEnviado?: string;
}

/** Por que a tela parou num `wp_die()`. */
export type MotivoDaRecusa =
  | 'sem-permissao'
  | 'token-vencido'
  | 'catalogo'
  | 'arquivo-que-nao-e-zip'
  | 'envio';

/** O `wp_die()` da tela, como dado. */
export interface RecusaDaTelaDeAtualizacao {
  readonly tipo: 'recusada';
  readonly motivo: MotivoDaRecusa;
  /** `500` e o padrao de `wp_die()` (`functions.php:4410`); `403` e o do token. */
  readonly status: number;
  /** `null` quando o legado nao passa titulo e a borda poe o padrao. */
  readonly titulo: string | null;
  readonly mensagem: string;
}

/** O que a tela responde. */
export type RespostaDaTelaDeAtualizacao =
  | RecusaDaTelaDeAtualizacao
  | {
      readonly tipo: 'instalada';
      readonly extensao: TipoDeExtensao;
      readonly origem: 'web' | 'upload';
      /** O que foi entregue a `install()`: `download_link` ou o caminho do arquivo enviado. */
      readonly pacote: string;
      /** `$api` — a informacao do catalogo; `null` no envio. */
      readonly informacao: unknown;
      readonly resultado: ResultadoDaExecucao;
      /** O pacote enviado, quando ha — e se ele foi limpo. */
      readonly enviado: { readonly pacote: PacoteEnviado; readonly limpo: boolean } | null;
    }
  | {
      readonly tipo: 'atualizada';
      readonly extensao: TipoDeExtensao;
      readonly item: string;
      readonly resultado: ResultadoDaExecucao;
    }
  | {
      readonly tipo: 'lote';
      readonly extensao: TipoDeExtensao;
      readonly itens: readonly string[];
      /** `false` quando a conexao com o sistema de arquivos falhou antes do primeiro item. */
      readonly resultados: ReadonlyMap<string, ResultadoDaExecucao> | false;
    }
  | { readonly tipo: 'personalizada'; readonly acao: string }
  | { readonly tipo: 'nao-portada'; readonly acao: string };

const ACOES_PORTADAS = Object.keys(PERMISSOES_DA_INSTALACAO);

function ehAcaoPortada(acao: string): acao is AcaoDaTelaDeAtualizacao {
  return ACOES_PORTADAS.includes(acao);
}

/**
 * O status do `wp_die( $erro )`: o `status` do dado do primeiro erro quando ele
 * e arranjo e o traz, senao `500` (`wp-includes/functions.php:4386`-`:4411`).
 */
function statusDoErro(erro: ErroDeInstalacao): number {
  const dado = erro.dado;
  if (typeof dado === 'object' && dado !== null) {
    const status = (dado as Record<string, unknown>)['status'];
    if (typeof status === 'number' && status !== 0) {
      return status;
    }
  }
  return 500;
}

function recusar(
  motivo: MotivoDaRecusa,
  mensagem: string,
  status = 500,
  titulo: string | null = null,
): RecusaDaTelaDeAtualizacao {
  return { tipo: 'recusada', motivo, status, titulo, mensagem };
}

/** A lista do lote (`update.php:34`-`:42`, `:239`-`:247`). */
function listaDoLote(
  naUrl: string | undefined,
  marcados: string | readonly string[] | undefined,
): readonly string[] {
  let itens: readonly string[];
  if (naUrl !== undefined) {
    itens = naUrl.split(',');
  } else if (marcados !== undefined) {
    itens = typeof marcados === 'string' ? [marcados] : marcados;
  } else {
    itens = [];
  }
  return itens.map(decodificarUrlComoNoPhp);
}

function instalarDoCatalogo(
  cliente: PortaDeClienteExterno,
  contexto: ContextoDaInstalacao,
  extensao: TipoDeExtensao,
  slug: string,
): RespostaDaTelaDeAtualizacao {
  const resposta =
    extensao === 'plugin'
      ? consultarInformacaoDoPlugin(cliente, contexto, slug)
      : consultarInformacaoDoTema(cliente, contexto, slug);

  if (!resposta.ok) {
    return recusar('catalogo', resposta.erro.mensagem, statusDoErro(resposta.erro));
  }

  const pacote = textoComoNoPhp(campoDaInformacao(resposta.informacao, 'download_link'));
  return {
    tipo: 'instalada',
    extensao,
    origem: 'web',
    pacote,
    informacao: resposta.informacao,
    resultado: instalarPacote(contexto, extensao, pacote, false),
    enviado: null,
  };
}

function instalarDoEnvio(
  contexto: ContextoDaInstalacao,
  extensao: TipoDeExtensao,
  pedido: PedidoDaTelaDeAtualizacao,
): RespostaDaTelaDeAtualizacao {
  const nome = pedido.nomeDoArquivoEnviado;
  if (nome !== undefined && !nome.toLowerCase().endsWith('.zip')) {
    return recusar('arquivo-que-nao-e-zip', MENSAGEM_DE_ARQUIVO_QUE_NAO_E_ZIP);
  }

  const recebido = contexto.recepcao.receber(
    extensao === 'plugin' ? 'pluginzip' : 'themezip',
    'package',
  );
  if (!recebido.recebido) {
    return recusar('envio', recebido.mensagem);
  }

  const aceitas = extensao === 'plugin' ? SOBRESCRITAS_DE_PLUGIN : SOBRESCRITAS_DE_TEMA;
  const pedida = pedido.sobrescrita ?? '';
  const sobrescrita = aceitas.includes(pedida) ? pedida : '';

  const resultado = instalarPacote(
    contexto,
    extensao,
    recebido.pacote.package,
    sobrescrita,
  );

  const limpo = resultado !== false;
  if (limpo) {
    contexto.recepcao.limpar(recebido.pacote);
  }

  return {
    tipo: 'instalada',
    extensao,
    origem: 'upload',
    pacote: recebido.pacote.package,
    informacao: null,
    resultado,
    enviado: { pacote: recebido.pacote, limpo },
  };
}

/**
 * Atende a tela. A capacidade e o token sao conferidos aqui, na ordem do
 * legado, e nenhuma porta e tocada antes deles.
 */
export function atenderTelaDeAtualizacao(
  cliente: PortaDeClienteExterno,
  contexto: ContextoDaInstalacao,
  pedido: PedidoDaTelaDeAtualizacao,
): RespostaDaTelaDeAtualizacao {
  const plugin = pedido.plugin === undefined ? '' : apararComoNoPhp(pedido.plugin);
  const tema = pedido.tema === undefined ? '' : decodificarUrlComoNoPhp(pedido.tema);
  const { acao } = pedido;

  if (!ehAcaoPortada(acao)) {
    if (ACOES_NAO_PORTADAS.includes(acao)) {
      return { tipo: 'nao-portada', acao };
    }
    contexto.ganchos?.aoReceberAcaoPersonalizada?.(acao);
    return { tipo: 'personalizada', acao };
  }

  if (
    !perguntarNaInstalacao(contexto.autorizacao, contexto, PERMISSOES_DA_INSTALACAO[acao])
  ) {
    return recusar('sem-permissao', mensagemSemPermissao(acao));
  }

  if (!contexto.verificarNonce(acaoDoToken(acao, plugin, tema), pedido.token)) {
    return recusar('token-vencido', MENSAGEM_DE_TOKEN_VENCIDO, 403, TITULO_DE_TOKEN_VENCIDO);
  }

  switch (acao) {
    case 'update-selected': {
      const itens = listaDoLote(pedido.pluginsNaUrl, pedido.marcados);
      return {
        tipo: 'lote',
        extensao: 'plugin',
        itens,
        resultados: atualizarEmLote(contexto, 'plugin', itens),
      };
    }
    case 'update-selected-themes': {
      const itens = listaDoLote(pedido.temasNaUrl, pedido.marcados);
      return {
        tipo: 'lote',
        extensao: 'theme',
        itens,
        resultados: atualizarEmLote(contexto, 'theme', itens),
      };
    }
    case 'upgrade-plugin':
      return {
        tipo: 'atualizada',
        extensao: 'plugin',
        item: plugin,
        resultado: atualizarItem(contexto, 'plugin', plugin),
      };
    case 'upgrade-theme':
      return {
        tipo: 'atualizada',
        extensao: 'theme',
        item: tema,
        resultado: atualizarItem(contexto, 'theme', tema),
      };
    case 'install-plugin':
      return instalarDoCatalogo(cliente, contexto, 'plugin', plugin);
    case 'install-theme':
      return instalarDoCatalogo(cliente, contexto, 'theme', tema);
    case 'upload-plugin':
      return instalarDoEnvio(contexto, 'plugin', pedido);
    case 'upload-theme':
      return instalarDoEnvio(contexto, 'theme', pedido);
  }
}
