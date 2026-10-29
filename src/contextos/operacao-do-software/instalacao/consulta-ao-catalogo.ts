/**
 * A consulta ao servico de distribuicao: `plugins_api( 'plugin_information' )`
 * e `themes_api( 'theme_information' )`.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` — **CA-1.2**, *"a
 * instalacao a partir do catalogo consulta o servico de distribuicao e obtem o
 * endereco do pacote"*, que e o passo 3 de UC-33 (*"Sistema consulta o servico
 * de distribuicao e obtem a URL do pacote"*). O endereco e o campo
 * `download_link` da resposta, e quem o le e a tela (`wp-admin/update.php:145` e
 * `:297`).
 *
 * ## A sequencia, nas duas funcoes (`wp-admin/includes/plugin-install.php:100`-`:231`, `wp-admin/includes/theme.php:491`-`:635`)
 *
 * | # | passo | plugin | tema |
 * |---|---|---|---|
 * | 1 | `locale` e `wp_version` entram se ausentes; `wp_version` e `substr( versao, 0, 3 )` | `:111`-`:117` | `:502`-`:508` |
 * | 2 | filtro dos argumentos | `plugins_api_args`, `:129` | `themes_api_args`, `:511` |
 * | 3 | filtro de atalho: devolver algo pula a rede | `false === $res`, `:145`-`:147` | **`! $res`**, `:514`-`:516` |
 * | 4 | URL em `http://`, promovida a `https` se o transporte suportar TLS | `:149`-`:162` | `:517`-`:530` |
 * | 5 | `wp_remote_get()` com **15 s** e o agente `WordPress/{versao}; {home}` | `:164`-`:168` | `:532`-`:536` |
 * | 6 | 🔴 falhou em `https`: aviso e **a mesma chamada em claro** | `:170`-`:184` | `:538`-`:551` |
 * | 7 | falha de rede, JSON invalido ou campo `error` viram `WP_Error` | `plugins_api_failed`, `:186`-`:215` | `themes_api_failed`, `:553`-`:582` |
 * | 8 | filtro do resultado | `plugins_api_result`, `:230` | `themes_api_result`, `:634` |
 *
 * Duas assimetrias entre as duas funcoes, e as duas estao reproduzidas: o
 * atalho de tema segue para a rede com **qualquer** valor falso no sentido do
 * PHP, e o de plugin so com `false`; e so o de plugin marca o resultado do
 * atalho com `external = true` (`:217`-`:219`). O aviso de canal sem cifra e
 * suprimido por `wp_is_json_request()` no plugin e por `wp_doing_ajax()` no
 * tema.
 *
 * ## 🔴 A repeticao em claro e de proposito
 *
 * A **resposta 12** de `questions.md` registra o rebaixamento como divida
 * herdada reproduzida por decisao, e a tabela *Nao negociavel* proibe fecha-lo
 * sem decisao humana. A porta de cliente externo ja documenta o caminho
 * (`portas/porta-de-cliente-externo.ts`); aqui ele e um `if` do chamador, como
 * AD-06 manda: *"nao ha broker, DLQ nem retry generico"*.
 *
 * ⚠️ **O pacote nao e verificado aqui, e nao e esta tarefa que decide.**
 * `download_link` volta como texto e e repassado a {@link ExecucaoDoPacote}; a
 * verificacao de assinatura e US-2, com o conflito registrado na `spec.md`.
 */

import type { PedidoExterno, PortaDeClienteExterno } from '../portas/index.js';
import type {
  AmbienteDaInstalacao,
  ArgumentosDoCatalogo,
  AtalhoDoCatalogo,
  ContextoDaInstalacao,
  ErroDeInstalacao,
  RespostaDoCatalogo,
} from './contexto-da-instalacao.js';
import {
  acrescentarConsultaComoNoPhp,
  comProtocoloSeguro,
  textoComoNoPhp,
  verdadeiroNoPhp,
} from './texto-como-no-php.js';

/** A URL de plugins, **em claro** de nascenca (`plugin-install.php:149`). */
export const ENDERECO_DO_CATALOGO_DE_PLUGINS =
  'http://api.wordpress.org/plugins/info/1.2/';

/** A URL de temas, em claro de nascenca (`theme.php:517`). */
export const ENDERECO_DO_CATALOGO_DE_TEMAS =
  'http://api.wordpress.org/themes/info/1.2/';

/**
 * O tempo limite das duas consultas, em segundos (`plugin-install.php:165`,
 * `theme.php:533`). Nao e o padrao de 5 s de `class-wp-http.php:181`, e nao e
 * nenhum dos tres que a porta ja nomeia (3/30, 10 e 300): e o quinto numero de
 * tempo desta feature (P6).
 */
export const TEMPO_LIMITE_DA_CONSULTA_AO_CATALOGO = 15;

/** O texto de `plugins_api_failed`/`themes_api_failed`, com a URL de suporte ja formatada. */
export const MENSAGEM_DE_FALHA_DO_CATALOGO =
  'An unexpected error occurred. Something may be wrong with WordPress.org or this server&#8217;s configuration. If you continue to have problems, please try the <a href="https://wordpress.org/support/forums/">support forums</a>.';

/** O aviso da repeticao em claro (`plugin-install.php:172`-`:180`, `theme.php:540`-`:548`). */
export const AVISO_DE_CANAL_SEM_CIFRA = `${MENSAGEM_DE_FALHA_DO_CATALOGO} (WordPress could not establish a secure connection to WordPress.org. Please contact your server administrator.)`;

/** A acao de informacao de plugin, com o nome do servico. */
export const ACAO_DE_INFORMACAO_DE_PLUGIN = 'plugin_information';

/** A acao de informacao de tema, com o nome do servico. */
export const ACAO_DE_INFORMACAO_DE_TEMA = 'theme_information';

/** O que difere entre `plugins_api()` e `themes_api()`. */
interface FuncaoDoCatalogo {
  readonly funcao: 'plugins_api' | 'themes_api';
  readonly endereco: string;
  readonly codigoDeErro: 'plugins_api_failed' | 'themes_api_failed';
  readonly argumentos: (
    contexto: ContextoDaInstalacao,
    argumentos: ArgumentosDoCatalogo,
    acao: string,
  ) => ArgumentosDoCatalogo;
  readonly atalho: (
    contexto: ContextoDaInstalacao,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => AtalhoDoCatalogo;
  /** `false === $res` no plugin, `! $res` no tema. */
  readonly seguePelaRede: (atalho: AtalhoDoCatalogo) => boolean;
  /** So o plugin marca o atalho com `external` (`plugin-install.php:217`). */
  readonly marcaAtalhoComoExterno: boolean;
  readonly suprimeAviso: (ambiente: AmbienteDaInstalacao) => boolean;
  readonly resultado: (
    contexto: ContextoDaInstalacao,
    resposta: RespostaDoCatalogo,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => RespostaDoCatalogo;
}

const PLUGINS_API: FuncaoDoCatalogo = {
  funcao: 'plugins_api',
  endereco: ENDERECO_DO_CATALOGO_DE_PLUGINS,
  codigoDeErro: 'plugins_api_failed',
  argumentos: (contexto, argumentos, acao) =>
    contexto.ganchos?.aoMontarConsultaDePlugin?.(argumentos, acao) ?? argumentos,
  atalho: (contexto, acao, argumentos) =>
    contexto.ganchos?.aoConsultarCatalogoDePlugins?.(false, acao, argumentos) ??
    false,
  seguePelaRede: (atalho) => atalho === false,
  marcaAtalhoComoExterno: true,
  suprimeAviso: (ambiente) => ambiente.pedidoJson,
  resultado: (contexto, resposta, acao, argumentos) =>
    contexto.ganchos?.aoReceberCatalogoDePlugins?.(resposta, acao, argumentos) ??
    resposta,
};

const THEMES_API: FuncaoDoCatalogo = {
  funcao: 'themes_api',
  endereco: ENDERECO_DO_CATALOGO_DE_TEMAS,
  codigoDeErro: 'themes_api_failed',
  argumentos: (contexto, argumentos, acao) =>
    contexto.ganchos?.aoMontarConsultaDeTema?.(argumentos, acao) ?? argumentos,
  atalho: (contexto, acao, argumentos) =>
    contexto.ganchos?.aoConsultarCatalogoDeTemas?.(false, acao, argumentos) ??
    false,
  // `WP_Error` e objeto, logo verdadeiro para o PHP; a informacao vale pelo
  // proprio valor.
  seguePelaRede: (atalho) =>
    atalho === false || (atalho.ok && !verdadeiroNoPhp(atalho.informacao)),
  marcaAtalhoComoExterno: false,
  suprimeAviso: (ambiente) => ambiente.pedidoAjax,
  resultado: (contexto, resposta, acao, argumentos) =>
    contexto.ganchos?.aoReceberCatalogoDeTemas?.(resposta, acao, argumentos) ??
    resposta,
};

function falhaDoCatalogo(
  funcao: FuncaoDoCatalogo,
  dado: unknown,
): RespostaDoCatalogo {
  const erro: ErroDeInstalacao = {
    codigo: funcao.codigoDeErro,
    mensagem: MENSAGEM_DE_FALHA_DO_CATALOGO,
    dado,
  };
  return { ok: false, erro };
}

/**
 * `json_decode( $corpo, true )` seguido do `(object)` do legado: objeto e
 * lista viram objeto, `null` (literal ou JSON invalido) vira falha com o corpo
 * como dado, escalar passa como esta, e o campo `error` presente e nao nulo
 * vira falha com ele como mensagem.
 */
function decodificarResposta(
  funcao: FuncaoDoCatalogo,
  corpo: string,
): RespostaDoCatalogo {
  let decodificado: unknown;
  try {
    decodificado = JSON.parse(corpo) as unknown;
  } catch {
    decodificado = null;
  }

  if (decodificado === null) {
    return falhaDoCatalogo(funcao, corpo);
  }

  if (typeof decodificado !== 'object') {
    return { ok: true, informacao: decodificado };
  }

  const objeto: Record<string, unknown> = Array.isArray(decodificado)
    ? Object.fromEntries(decodificado.entries())
    : (decodificado as Record<string, unknown>);

  const erro = objeto['error'];
  if (erro !== undefined && erro !== null) {
    return {
      ok: false,
      erro: { codigo: funcao.codigoDeErro, mensagem: textoComoNoPhp(erro) },
    };
  }

  return { ok: true, informacao: objeto };
}

function consultar(
  cliente: PortaDeClienteExterno,
  contexto: ContextoDaInstalacao,
  funcao: FuncaoDoCatalogo,
  acao: string,
  pedidos: ArgumentosDoCatalogo,
): RespostaDoCatalogo {
  const { ambiente } = contexto;

  const montados: Record<string, ArgumentosDoCatalogo[string]> = { ...pedidos };
  if (montados['locale'] === undefined || montados['locale'] === null) {
    montados['locale'] = ambiente.idiomaDoAtor;
  }
  if (montados['wp_version'] === undefined || montados['wp_version'] === null) {
    montados['wp_version'] = ambiente.versaoDoNucleo.substring(0, 3);
  }
  const argumentos = funcao.argumentos(contexto, montados, acao);

  const atalho = funcao.atalho(contexto, acao, argumentos);

  let resposta: RespostaDoCatalogo;
  if (!funcao.seguePelaRede(atalho)) {
    resposta = atalho as RespostaDoCatalogo;
    if (
      funcao.marcaAtalhoComoExterno &&
      resposta.ok &&
      typeof resposta.informacao === 'object' &&
      resposta.informacao !== null
    ) {
      resposta = {
        ok: true,
        informacao: { ...resposta.informacao, external: true },
      };
    }
  } else {
    const emClaro = acrescentarConsultaComoNoPhp(funcao.endereco, {
      action: acao,
      request: argumentos,
    });
    let url = emClaro;
    if (ambiente.suportaTls) {
      const promovida = comProtocoloSeguro(emClaro);
      url =
        contexto.ganchos?.aoDefinirProtocoloDaUrl?.(promovida, 'https', 'https') ??
        promovida;
    }

    const pedido = (endereco: string): PedidoExterno => ({
      url: endereco,
      metodo: 'GET',
      cabecalhos: {},
      cookies: {},
      corpo: null,
      tempoLimiteEmSegundos: TEMPO_LIMITE_DA_CONSULTA_AO_CATALOGO,
      limiteDeRedirecionamentos: 5,
      limiteDeBytesDaResposta: null,
      agenteDeUsuario: `WordPress/${ambiente.versaoDoNucleo}; ${ambiente.enderecoDoSite}`,
      verificarCertificado: true,
      recusarUrlInsegura: false,
    });

    let chamada = cliente.chamar(pedido(url));
    if (ambiente.suportaTls && !chamada.completou) {
      if (!funcao.suprimeAviso(ambiente)) {
        contexto.dispararErro(funcao.funcao, AVISO_DE_CANAL_SEM_CIFRA);
      }
      chamada = cliente.chamar(pedido(emClaro));
    }

    resposta = chamada.completou
      ? decodificarResposta(funcao, chamada.resposta.corpo)
      : falhaDoCatalogo(funcao, chamada.motivo);
  }

  return funcao.resultado(contexto, resposta, acao, argumentos);
}

/**
 * `plugins_api( 'plugin_information', array( 'slug' => $plugin, 'fields' =>
 * array( 'sections' => false ) ) )` — a forma exata que a tela pede
 * (`wp-admin/update.php:113`-`:121`).
 */
export function consultarInformacaoDoPlugin(
  cliente: PortaDeClienteExterno,
  contexto: ContextoDaInstalacao,
  slug: string,
): RespostaDoCatalogo {
  return consultar(cliente, contexto, PLUGINS_API, ACAO_DE_INFORMACAO_DE_PLUGIN, {
    slug,
    fields: { sections: false },
  });
}

/**
 * `themes_api( 'theme_information', array( 'slug' => $theme, 'fields' =>
 * array( 'sections' => false, 'tags' => false ) ) )` (`update.php:268`-`:277`).
 */
export function consultarInformacaoDoTema(
  cliente: PortaDeClienteExterno,
  contexto: ContextoDaInstalacao,
  slug: string,
): RespostaDoCatalogo {
  return consultar(cliente, contexto, THEMES_API, ACAO_DE_INFORMACAO_DE_TEMA, {
    slug,
    fields: { sections: false, tags: false },
  });
}

/**
 * Um campo da informacao, como `$api->campo` o le: ausente, ou informacao que
 * nao e objeto, da `null` (com aviso, no PHP).
 */
export function campoDaInformacao(informacao: unknown, campo: string): unknown {
  if (typeof informacao !== 'object' || informacao === null) {
    return null;
  }
  return (informacao as Record<string, unknown>)[campo] ?? null;
}
