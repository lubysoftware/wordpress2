/**
 * O aviso com o caminho de recuperacao: emitir a chave, montar o endereco,
 * escrever o e-mail e envia-lo **no maximo uma vez por limite** —
 * `WP_Recovery_Mode_Email_Service`, `WP_Recovery_Mode_Link_Service::generate_url()`
 * e `WP_Recovery_Mode_Key_Service::generate_and_store_recovery_mode_key()`.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — a segunda metade
 * de **CA-12.1** (*"gera uma chave de recuperacao e envia o caminho de
 * recuperacao a quem administra o site"*) e **CA-12.6** (*"o aviso e limitado
 * a um por dia por sessao, e o marcador e gravado antes do envio, de modo que
 * falhar em gravar significa nao avisar"*), com `A10` (BR-MIGRAR-054).
 *
 * ## A ordem e a regra (`class-wp-recovery-mode-email-service.php:53`-`:86`)
 *
 * 1. le o marcador `recovery_mode_email_last_sent`;
 * 2. se nao ha marcador, ou se o limite ja passou: **grava o marcador**, e se a
 *    gravacao falha devolve `storage_error` **sem enviar** (`:58`-`:60`);
 * 3. so entao monta o endereco (que **emite e grava a chave**) e envia.
 *
 * A justificativa de `A10` e literal: *"ela escolhe perder o aviso em vez de
 * arriscar repeticao"*. E o marcador fica gravado mesmo quando o envio falha:
 * uma caixa postal fora do ar perde o aviso daquele dia inteiro.
 *
 * ## ⚠️ "Um por dia por sessao", lido como o legado o faz
 *
 * O marcador e **uma opcao do site**, sem sessao no nome, e o aviso so sai
 * quando **nao** ha sessao ativa (`class-wp-recovery-mode.php:176`-`:186`): a
 * sessao ainda nao existe quando o aviso e mandado. *"Por sessao"*, em CA-12.6
 * e em `A10`, e portanto *"por ciclo de recuperacao"*: o limite vale para o
 * site inteiro e so e zerado quando alguem **sai** da recuperacao
 * (`clear_rate_limit()`, `:95`). E isso que esta reproduzido.
 *
 * ## O que chega pronto
 *
 * A formatacao (`human_time_diff()`, `wp_specialchars_decode()`,
 * `wp_strip_all_tags()`, `is_email()`, `add_query_arg()`) e de
 * `plataforma/formatacao/`; os textos sao os `msgid` do legado, e a troca de
 * idioma (`switch_to_locale()`, `:119`) chega por ligacao tardia. Ver
 * `contexto-da-recuperacao.ts`.
 */

import {
  arranjo,
  arranjoPorNome,
  inteiro,
  normalizarChaveDeTexto,
  texto,
  type EntradaDeArranjo,
} from '../../../plataforma/serializacao/index.js';
import {
  COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO,
  COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO,
  type SessaoDeRecuperacao,
} from '../configuracao/index.js';
import type { MensagemDeEmail, PortaDeEmail } from '../portas/index.js';
import type {
  AvisoDeRecuperacao,
  ContextoDaRecuperacao,
  DadosDoPlugin,
  ErroDaRecuperacao,
  ErroFatal,
  ExtensaoResponsavel,
} from './contexto-da-recuperacao.js';
import { descricaoDoErro } from './extensao-do-erro.js';

/** `WP_Recovery_Mode_Link_Service::LOGIN_ACTION_ENTER` (`class-wp-recovery-mode-link-service.php:16`). */
export const ACAO_DE_ENTRAR_NA_RECUPERACAO = 'enter_recovery_mode';

/** `WP_Recovery_Mode_Link_Service::LOGIN_ACTION_ENTERED` (`:17`). */
export const ACAO_DE_RECUPERACAO_INICIADA = 'entered_recovery_mode';

export const MENSAGEM_DE_MARCADOR_NAO_GRAVADO =
  'Could not update the email last sent time.';

/** `sprintf( __( '...%s function.' ), 'mail()' )` (`:72`-`:73`), ja resolvido. */
export const MENSAGEM_DE_ENVIO_QUE_FALHOU =
  'The email could not be sent. Possible reason: your host may have disabled the mail() function.';

/** `'A recovery link was already sent %1$s ago. Please wait another %2$s before requesting a new email.'` (`:80`). */
export const MODELO_DE_AVISO_JA_ENVIADO =
  'A recovery link was already sent %1$s ago. Please wait another %2$s before requesting a new email.';

/** `'[%s] Your Site is Experiencing a Technical Issue'` (`:200`). */
export const ASSUNTO_DO_AVISO_DE_RECUPERACAO =
  '[%s] Your Site is Experiencing a Technical Issue';

/** O default de `recovery_email_support_info` (`:141`). */
export const SUPORTE_DO_AVISO_DE_RECUPERACAO =
  'Please contact your host for assistance with investigating this issue further.';

/** `__( 'Error Details' )` (`:126`). */
export const CABECALHO_DOS_DETALHES_DO_ERRO = 'Error Details';

/**
 * O corpo do aviso, com os oito marcadores (`:153`-`:172`), byte a byte: as
 * quebras sao `\n`, e os `\'` do PHP sao apostrofos.
 */
export const MODELO_DO_AVISO_DE_RECUPERACAO = `Howdy!

WordPress has a built-in feature that detects when a plugin or theme causes a fatal error on your site, and notifies you with this automated email.
###CAUSE###
First, visit your website (###SITEURL###) and check for any visible issues. Next, visit the page where the error was caught (###PAGEURL###) and check for any visible issues.

###SUPPORT###

If your site appears broken and you can't access your dashboard normally, WordPress now has a special "recovery mode". This lets you safely login to your dashboard and investigate further.

###LINK###

To keep your site safe, this link will expire in ###EXPIRES###. Don't worry about that, though: a new link will be emailed to you if the error occurs again after it expires.

When seeking help with this issue, you may be asked for some of the following information:
###DEBUG###

###DETAILS###`;

/** `'In this case, WordPress caught an error with one of your plugins, %s.'` (`:280`). */
export const MODELO_DA_CAUSA_EM_PLUGIN =
  'In this case, WordPress caught an error with one of your plugins, %s.';

/** `'In this case, WordPress caught an error with your theme, %s.'` (`:286`). */
export const MODELO_DA_CAUSA_EM_TEMA =
  'In this case, WordPress caught an error with your theme, %s.';

/**
 * `maybe_send_recovery_mode_email( $rate_limit, $error, $extension )`
 * (`class-wp-recovery-mode-email-service.php:53`-`:86`). Ver o cabecalho.
 */
export function talvezAvisar(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  email: PortaDeEmail,
  limite: number,
  erro: ErroFatal,
  extensao: ExtensaoResponsavel,
): true | ErroDaRecuperacao {
  const ultimoAviso = sessao.lerUltimoAviso();

  if (ultimoAviso === null || contexto.instante() > ultimoAviso + limite) {
    if (!sessao.gravarUltimoAviso(contexto.instante())) {
      return { codigo: 'storage_error', mensagem: MENSAGEM_DE_MARCADOR_NAO_GRAVADO };
    }

    if (enviarAviso(contexto, sessao, email, limite, erro, extensao)) {
      return true;
    }
    return { codigo: 'email_failed', mensagem: MENSAGEM_DE_ENVIO_QUE_FALHOU };
  }

  const { formatacao } = contexto;
  return {
    codigo: 'email_sent_already',
    mensagem: comPosicoes(MODELO_DE_AVISO_JA_ENVIADO, [
      formatacao.diferencaHumanaDeTempo(ultimoAviso, contexto.instante()),
      formatacao.diferencaHumanaDeTempo(ultimoAviso + limite, contexto.instante()),
    ]),
  };
}

/**
 * `send_recovery_mode_email()` (`:114`-`:238`): o endereco **primeiro** (a
 * chave e gravada antes de qualquer texto), depois o nome do site, o idioma, a
 * causa, os detalhes, o suporte, a depuracao, o corpo, o filtro do e-mail
 * inteiro e o envio.
 */
function enviarAviso(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  email: PortaDeEmail,
  limite: number,
  erro: ErroFatal,
  extensao: ExtensaoResponsavel,
): boolean {
  const { formatacao, ganchos, site } = contexto;

  const url = gerarEnderecoDeRecuperacao(contexto, sessao);
  const nomeDoSite = formatacao.decodificarCaracteresEspeciais(site.nome, 'ENT_QUOTES');

  const trocouIdioma = contexto.idioma?.trocarParaIdiomaDoSite() ?? false;

  const causa = causaDoErro(contexto, extensao);
  let detalhes = formatacao.removerTodasAsTags(descricaoDoErro(erro));
  if (detalhes !== '' && detalhes !== '0') {
    const cabecalho = CABECALHO_DOS_DETALHES_DO_ERRO;
    detalhes = `\n\n${cabecalho}\n${'='.repeat(cabecalho.length)}\n${detalhes}`;
  }

  const suporte =
    ganchos?.aoMontarSuporteDoAviso?.(SUPORTE_DO_AVISO_DE_RECUPERACAO) ??
    SUPORTE_DO_AVISO_DE_RECUPERACAO;
  const depuracaoDeFabrica = depuracaoDoAviso(contexto, extensao);
  const depuracao =
    ganchos?.aoMontarDepuracaoDoAviso?.(depuracaoDeFabrica) ?? depuracaoDeFabrica;

  const corpo = substituirEmSequencia(MODELO_DO_AVISO_DE_RECUPERACAO, [
    ['###LINK###', url],
    [
      '###EXPIRES###',
      formatacao.diferencaHumanaDeTempo(
        contexto.instante() + limite,
        contexto.instante(),
      ),
    ],
    ['###CAUSE###', causa !== '' ? `\n${causa}\n` : '\n'],
    ['###DETAILS###', detalhes],
    ['###SITEURL###', site.enderecoInicial],
    ['###PAGEURL###', site.enderecoDaPagina],
    ['###SUPPORT###', suporte],
    ['###DEBUG###', depuracao.map(([, valor]) => valor).join('\r\n')],
  ]);

  const avisoDeFabrica: AvisoDeRecuperacao = {
    to: enderecoDoAviso(contexto),
    subject: ASSUNTO_DO_AVISO_DE_RECUPERACAO,
    message: corpo,
    headers: '',
    attachments: '',
  };
  const aviso = ganchos?.aoMontarAviso?.(avisoDeFabrica, url) ?? avisoDeFabrica;

  const resultado = email.enviar(
    mensagemDoAviso(
      aviso,
      formatacao.decodificarCaracteresEspeciais(
        comPosicoes(aviso.subject, [nomeDoSite]),
        'ENT_NOQUOTES',
      ),
    ),
  );

  if (trocouIdioma) {
    contexto.idioma?.restaurar();
  }

  return resultado.enviado;
}

/**
 * `generate_url()` (`class-wp-recovery-mode-link-service.php:57`-`:62`): o
 * token, depois a chave — que e gravada **resumida** junto do instante e
 * anunciada pela acao `generate_recovery_mode_key` —, depois o endereco, que
 * passa pelo ponto `recovery_mode_begin_url`.
 *
 * *"Only one recovery mode URL can may be valid at the same time"*, diz o
 * comentario do legado (`:51`); o codigo, porem, **acrescenta** a chave as que
 * ja existem (`class-wp-recovery-mode-key-service.php:50`), e quem as limpa e
 * a verificacao e a rotina diaria (T027). Esta reproduzido o codigo.
 */
export function gerarEnderecoDeRecuperacao(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
): string {
  const token = contexto.gerarSenha(COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO, false, false);
  const chave = emitirChave(contexto, sessao, token);

  const url = contexto.formatacao.acrescentarConsulta(contexto.site.enderecoDeEntrada, {
    action: ACAO_DE_ENTRAR_NA_RECUPERACAO,
    rm_token: token,
    rm_key: chave,
  });
  return contexto.ganchos?.aoMontarEnderecoDeRecuperacao?.(url, token, chave) ?? url;
}

/**
 * `generate_and_store_recovery_mode_key( $token )`
 * (`class-wp-recovery-mode-key-service.php:45`-`:68`).
 *
 * Le o arranjo **bruto** e regrava tudo, com o token novo no fim — ou no lugar,
 * se o token ja existia. O retorno da gravacao e ignorado, como no legado
 * (`:55`): a chave e anunciada e devolvida mesmo que nao tenha sido gravada.
 */
function emitirChave(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  token: string,
): string {
  const chave = contexto.gerarSenha(COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO, false, false);

  const registro = sessao.lerRegistroDeChaves();
  const entradas: readonly EntradaDeArranjo[] =
    registro.tipo === 'arranjo' ? registro.entradas : [];
  const nova: EntradaDeArranjo = {
    chave: normalizarChaveDeTexto(token),
    valor: arranjoPorNome([
      ['hashed_key', texto(contexto.resumirChave(chave))],
      ['created_at', inteiro(contexto.instante())],
    ]),
  };
  const indice = entradas.findIndex(
    (entrada) =>
      entrada.chave.tipo === nova.chave.tipo && entrada.chave.valor === nova.chave.valor,
  );
  const atualizadas =
    indice === -1
      ? [...entradas, nova]
      : entradas.map((entrada, posicao) =>
          posicao === indice ? { chave: entrada.chave, valor: nova.valor } : entrada,
        );
  sessao.gravarChaves(arranjo(atualizadas));

  contexto.ganchos?.aoGerarChave?.(token, chave);
  return chave;
}

/**
 * `get_recovery_mode_email_address()` (`:247`-`:253`): `RECOVERY_MODE_EMAIL`
 * quando declarada **e** valida, senao `admin_email`.
 */
function enderecoDoAviso(contexto: ContextoDaRecuperacao): string {
  const declarado = contexto.constantes.RECOVERY_MODE_EMAIL;
  if (declarado !== undefined && contexto.formatacao.ehEmail(declarado)) {
    return declarado;
  }
  return contexto.site.emailDoAdministrador;
}

/** `get_cause( $extension )` (`:268`-`:290`). */
function causaDoErro(
  contexto: ContextoDaRecuperacao,
  extensao: ExtensaoResponsavel,
): string {
  if (extensao.tipo === 'plugin') {
    const plugin = pluginDaExtensao(contexto, extensao);
    const nome = plugin === null ? extensao.slug : plugin.Name;
    return comPosicoes(MODELO_DA_CAUSA_EM_PLUGIN, [nome]);
  }
  const tema = contexto.extensoes.tema(extensao.slug);
  const nome = tema.existe ? tema.nomeExibido : extensao.slug;
  return comPosicoes(MODELO_DA_CAUSA_EM_TEMA, [nome]);
}

/**
 * `get_plugin( $extension )` (`:305`-`:324`): o arquivo `slug/slug.php`
 * primeiro, *"since it is a common convention"*; senao o primeiro arquivo,
 * na ordem de `get_plugins()`, que esteja no diretorio ou que **seja** o slug.
 */
function pluginDaExtensao(
  contexto: ContextoDaRecuperacao,
  extensao: ExtensaoResponsavel,
): DadosDoPlugin | null {
  const plugins = contexto.extensoes.plugins();
  const convencional = plugins.get(`${extensao.slug}/${extensao.slug}.php`);
  if (convencional !== undefined) {
    return convencional;
  }
  for (const [arquivo, dados] of plugins) {
    if (arquivo.startsWith(`${extensao.slug}/`) || arquivo === extensao.slug) {
      return dados;
    }
  }
  return null;
}

/**
 * `get_debug( $extension )` (`:339`-`:377`): `wp`, `theme`, `plugin` quando o
 * plugin e encontrado, e `php`, nesta ordem — e a ordem que o corpo usa, unida
 * por `\r\n`.
 */
function depuracaoDoAviso(
  contexto: ContextoDaRecuperacao,
  extensao: ExtensaoResponsavel,
): readonly (readonly [string, string])[] {
  const { site, extensoes } = contexto;
  const depuracao: [string, string][] = [
    ['wp', comPosicoes('WordPress version %s', [site.versaoDoNucleo])],
    [
      'theme',
      comPosicoes('Active theme: %1$s (version %2$s)', [
        extensoes.temaAtivo.nome,
        extensoes.temaAtivo.versao,
      ]),
    ],
  ];
  const plugin = pluginDaExtensao(contexto, extensao);
  if (plugin !== null) {
    depuracao.push([
      'plugin',
      comPosicoes('Current plugin: %1$s (version %2$s)', [plugin.Name, plugin.Version]),
    ]);
  }
  depuracao.push(['php', comPosicoes('PHP version %s', [site.versaoDoPhp])]);
  return depuracao;
}

/**
 * Os argumentos de `wp_mail()` como a porta os recebe: `to` em texto e
 * partido por virgula (`pluggable.php:243`-`:244`), `headers` vazio vira lista
 * vazia (`:295`) e em texto e partido por linha (`:303`), e `attachments` em
 * texto e **sempre** partido por linha (`:263`-`:264`) — inclusive o texto
 * vazio do aviso, que vira uma lista com um anexo vazio, como no legado.
 */
function mensagemDoAviso(aviso: AvisoDeRecuperacao, assunto: string): MensagemDeEmail {
  const porLinha = (valor: string): string[] => valor.replace(/\r\n/g, '\n').split('\n');
  return {
    destinatarios: typeof aviso.to === 'string' ? aviso.to.split(',') : aviso.to,
    assunto,
    corpo: aviso.message,
    cabecalhos:
      typeof aviso.headers === 'string'
        ? aviso.headers === ''
          ? []
          : porLinha(aviso.headers)
        : aviso.headers,
    anexos: typeof aviso.attachments === 'string' ? porLinha(aviso.attachments) : aviso.attachments,
  };
}

/**
 * `str_replace( $buscas, $trocas, $texto )` com listas: **em sequencia**, cada
 * busca sobre o resultado da anterior. Um endereco que contenha `###CAUSE###`
 * e trocado de novo, como no legado.
 */
function substituirEmSequencia(
  modelo: string,
  trocas: readonly (readonly [string, string])[],
): string {
  return trocas.reduce((resultado, [busca, troca]) => resultado.split(busca).join(troca), modelo);
}

/**
 * O `sprintf()` dos modelos deste caminho: `%s` em sequencia, `%N$s` por
 * posicao e `%%`, numa passada so.
 */
function comPosicoes(modelo: string, valores: readonly string[]): string {
  let proximo = 0;
  return modelo.replace(/%(?:(\d+)\$)?s|%%/g, (marca, posicao: string | undefined) => {
    if (marca === '%%') {
      return '%';
    }
    const indice = posicao === undefined ? proximo++ : Number(posicao) - 1;
    return valores[indice] ?? '';
  });
}
