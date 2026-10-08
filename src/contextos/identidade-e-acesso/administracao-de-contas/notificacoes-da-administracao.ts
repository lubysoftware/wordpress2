/**
 * As mensagens que a administracao de contas envia — e as que ela **nao** envia.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11), e e aqui que
 * CA-11.7 se decide: *"quem foi criado, promovido ou alterado e notificado por
 * e-mail"*.
 *
 * ---
 *
 * # 🔴 O legado nao notifica quem foi PROMOVIDO, e isso nao foi "corrigido"
 *
 * CA-11.7 nomeia tres eventos — criado, promovido, alterado. O legado notifica
 * **dois**:
 *
 * | evento | mensagem | onde |
 * |---|---|---|
 * | conta criada | ao administrador do site, e opcionalmente ao titular | `pluggable.php:2276` |
 * | senha trocada | ao titular, no endereco **antigo** | `user.php:2817` |
 * | e-mail trocado | ao titular, no endereco **antigo** | `user.php:2875` |
 * | **papel trocado** | **nenhuma** | — |
 *
 * `WP_User::set_role()` dispara tres acoes (`remove_user_role`, `add_user_role`,
 * `set_user_role`) e **nao** envia e-mail nenhum; `wp_update_user()` envia so nos
 * dois casos acima, cada um condicionado a o valor ter **mudado de fato**. E UC-24
 * registra o mesmo achado pelo outro lado, na propria secao *"O que um porte
 * precisa saber"*: *"🟡 **Promover alguem nao deixa rastro.** Nenhuma trilha
 * registra quem mudou o papel de quem, nem quando."*
 *
 * O passo 6 de UC-24 tambem e mais estreito que CA-11.7: *"Sistema notifica por
 * e-mail quem foi criado **ou teve a conta alterada**"* — e "alterada", no legado,
 * e exatamente senha ou e-mail.
 *
 * O **P1** resolve sem esta tarefa escolher: *"reproduza o comportamento
 * observavel do sistema analisado... divergir exige uma decisao humana
 * registrada, citada no codigo que divergiu"*. Nenhuma existe, e acrescentar um
 * aviso de promocao inventaria uma mensagem — com um texto que nenhum documento
 * deste pacote registra, porque ela nao existe. Logo: as tres mensagens do legado
 * estao aqui, a quarta nao, e a leitura de CA-11.7 vai para quem decide. Mesmo
 * precedente de T017 com CA-8.4 e de `promover-contas.ts` com CA-11.2.
 *
 * ---
 *
 * # ⚠️ Os bytes: `\r\n` numa familia, `\n` na outra
 *
 * Nao e inconsistencia de leitura, e o legado: a notificacao de conta nova monta
 * o corpo com `"\r\n"` explicito (`pluggable.php:2315`-`:2319`), e os dois avisos
 * de alteracao sao literais com salto de linha **real** num arquivo de fim de
 * linha LF, logo `"\n"` (`user.php:2819` e `:2877`, conferido byte a byte no
 * arquivo). O fim de linha esta **dentro** do corpo, logo e byte enviado, e o
 * criterio desta area e byte a byte. Unificar os dois mudaria o conteudo de tres
 * mensagens.
 *
 * ---
 *
 * # ⚠️ Os marcadores `###NOME###` sao substituidos DEPOIS do ponto de extensao
 *
 * `user.php:2866`-`:2870`: o filtro `password_change_email` recebe a mensagem
 * **com** os marcadores e so entao eles sao trocados. Consequencia observavel:
 * uma extensao que reescreva o corpo pode usar os mesmos marcadores e eles
 * continuam valendo. A ordem esta reproduzida em
 * {@link mensagemDeSenhaAlterada} e {@link mensagemDeEmailAlterado}, e esta
 * afirmada por teste.
 *
 * E o texto em ingles fica, pela mesma razao de `mensagens-da-administracao.ts`:
 * `EC-05` fixa que *"o `msgid` em ingles E a chave do catalogo"*. A conferencia
 * byte a byte fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
 */

import type { MensagemDeEmail } from '../portas/index.js';

/** O fim de linha da notificacao de conta nova (`pluggable.php:2315`). */
export const FIM_DE_LINHA_DA_CONTA_NOVA = '\r\n';

/** O fim de linha dos dois avisos de alteracao (`user.php:2819`, `:2877`). */
export const FIM_DE_LINHA_DO_AVISO_DE_ALTERACAO = '\n';

/**
 * As mensagens, com os marcadores como o legado os deixa.
 *
 * `%s` e preenchido por quem monta, como em
 * `MENSAGENS_DA_NOTIFICACAO_DE_CONTA_NOVA`; `###NOME###` e trocado **depois** do
 * ponto de extensao, como no legado.
 */
export const MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL = {
  /** `%s` recebe o titulo do site. */
  assunto_de_conta_nova_ao_administrador: '[%s] New User Registration',
  /** `%s` recebe o titulo do site. */
  linha_de_conta_nova: 'New user registration on your site %s:',
  /** `%s` recebe o login. */
  linha_do_login: 'Username: %s',
  /** `%s` recebe o e-mail. */
  linha_do_email: 'Email: %s',
  /** `%s` recebe o titulo do site. */
  assunto_de_senha_alterada: '[%s] Password Changed',
  /** `%s` recebe o titulo do site. */
  assunto_de_email_alterado: '[%s] Email Changed',
} as const;

/** O corpo do aviso de senha trocada, com os marcadores ainda no lugar. */
export const CORPO_DE_SENHA_ALTERADA = [
  'Hi ###USERNAME###,',
  '',
  'This notice confirms that your password was changed on ###SITENAME###.',
  '',
  'If you did not change your password, please contact the Site Administrator at',
  '###ADMIN_EMAIL###',
  '',
  'This email has been sent to ###EMAIL###',
  '',
  'Regards,',
  'All at ###SITENAME###',
  '###SITEURL###',
].join(FIM_DE_LINHA_DO_AVISO_DE_ALTERACAO);

/** O corpo do aviso de e-mail trocado, com os marcadores ainda no lugar. */
export const CORPO_DE_EMAIL_ALTERADO = [
  'Hi ###USERNAME###,',
  '',
  'This notice confirms that your email address on ###SITENAME### was changed to ###NEW_EMAIL###.',
  '',
  'If you did not change your email, please contact the Site Administrator at',
  '###ADMIN_EMAIL###',
  '',
  'This email has been sent to ###EMAIL###',
  '',
  'Regards,',
  'All at ###SITENAME###',
  '###SITEURL###',
].join(FIM_DE_LINHA_DO_AVISO_DE_ALTERACAO);

/** O que os dois avisos de alteracao precisam saber. */
export interface DadosDoAvisoDeAlteracao {
  readonly login: string;
  /** O e-mail **antigo** — e o destinatario, e o `###EMAIL###`. */
  readonly emailAnterior: string;
  /** O e-mail novo, so usado pelo aviso de e-mail trocado (`###NEW_EMAIL###`). */
  readonly emailNovo?: string;
  readonly tituloDoSite: string;
  readonly emailDoAdministrador: string;
  readonly urlDoSite: string;
}

/**
 * Troca os marcadores, na **ordem** em que o legado os troca.
 *
 * A ordem importa porque as substituicoes sao textuais e sequenciais: um valor
 * que contenha `###SITENAME###` seria ele mesmo substituido pela troca seguinte.
 * E o legado, e esta funcao nao conserta.
 */
function trocarMarcadores(
  corpo: string,
  dados: DadosDoAvisoDeAlteracao,
  comEmailNovo: boolean,
): string {
  let texto = corpo.split('###USERNAME###').join(dados.login);
  texto = texto.split('###ADMIN_EMAIL###').join(dados.emailDoAdministrador);
  if (comEmailNovo) {
    texto = texto.split('###NEW_EMAIL###').join(dados.emailNovo ?? '');
  }
  texto = texto.split('###EMAIL###').join(dados.emailAnterior);
  texto = texto.split('###SITENAME###').join(dados.tituloDoSite);
  texto = texto.split('###SITEURL###').join(dados.urlDoSite);
  return texto;
}

/** O ponto de extensao de cada uma das tres mensagens. */
export interface GanchosDasMensagensDaAdministracao {
  /** `password_change_email`: **filtro**, antes da troca dos marcadores. */
  readonly filtrarAvisoDeSenha?: (mensagem: MensagemDeEmail) => MensagemDeEmail;
  /** `email_change_email`: **filtro**, antes da troca dos marcadores. */
  readonly filtrarAvisoDeEmail?: (mensagem: MensagemDeEmail) => MensagemDeEmail;
  /** `wp_new_user_notification_email_admin`: **filtro**. */
  readonly filtrarMensagemDeContaNovaAoAdministrador?: (
    mensagem: MensagemDeEmail,
  ) => MensagemDeEmail;
}

/**
 * `[%s] Password Changed` — o aviso de senha trocada.
 *
 * Vai para o endereco **anterior**, e nao para o novo: `'to' => $user[
 * 'user_email' ]` le o retrato de antes da gravacao. Quando a senha e o e-mail
 * mudam na mesma requisicao, as duas mensagens vao para o endereco antigo.
 */
export function mensagemDeSenhaAlterada(
  dados: DadosDoAvisoDeAlteracao,
  ganchos?: GanchosDasMensagensDaAdministracao,
): MensagemDeEmail {
  const montada: MensagemDeEmail = {
    destinatarios: [dados.emailAnterior],
    assunto:
      MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.assunto_de_senha_alterada.replace(
        '%s',
        dados.tituloDoSite,
      ),
    corpo: CORPO_DE_SENHA_ALTERADA,
    cabecalhos: [],
    anexos: [],
  };

  const filtrada = ganchos?.filtrarAvisoDeSenha?.(montada) ?? montada;
  return { ...filtrada, corpo: trocarMarcadores(filtrada.corpo, dados, false) };
}

/** `[%s] Email Changed` — o aviso de e-mail trocado, tambem ao endereco antigo. */
export function mensagemDeEmailAlterado(
  dados: DadosDoAvisoDeAlteracao,
  ganchos?: GanchosDasMensagensDaAdministracao,
): MensagemDeEmail {
  const montada: MensagemDeEmail = {
    destinatarios: [dados.emailAnterior],
    assunto:
      MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.assunto_de_email_alterado.replace(
        '%s',
        dados.tituloDoSite,
      ),
    corpo: CORPO_DE_EMAIL_ALTERADO,
    cabecalhos: [],
    anexos: [],
  };

  const filtrada = ganchos?.filtrarAvisoDeEmail?.(montada) ?? montada;
  return { ...filtrada, corpo: trocarMarcadores(filtrada.corpo, dados, true) };
}

/** O que o aviso de conta nova ao administrador precisa saber. */
export interface DadosDoAvisoDeContaNova {
  readonly login: string;
  readonly email: string;
  readonly tituloDoSite: string;
  readonly emailDoAdministrador: string;
}

/**
 * `[%s] New User Registration` — o aviso ao **administrador do site**.
 *
 * ⚠️ **Esta e a mensagem que `../cadastro/notificacao-de-conta-nova.ts` deixou
 * declarada como lacuna de T013** (*"o texto da mensagem ao administrador tambem
 * nao esta no pacote"*). T023 precisa dela porque o modo de fabrica da criacao
 * por administrador e `admin`, em que **so** esta mensagem sai: sem ela, a criacao
 * por administrador nao notificaria ninguem, e CA-11.7 falharia no caminho de
 * fabrica. O texto foi lido na ancora do legado, byte a byte
 * (`pluggable.php:2315`-`:2327`), e fecha contra o oraculo.
 *
 * Note o fim de linha: **duas** quebras depois das duas primeiras linhas e **uma**
 * depois da terceira, em `\r\n`. A terceira linha termina a mensagem.
 *
 * E note o destinatario: `get_option( 'admin_email' )`, nao a conta criada. Com
 * `admin_email` vazio — o valor de fabrica deste pacote, porque a opcao e da
 * instalacao — a mensagem sai para destinatario vazio, e o legado tambem a manda.
 */
export function mensagemDeContaNovaAoAdministrador(
  dados: DadosDoAvisoDeContaNova,
  ganchos?: GanchosDasMensagensDaAdministracao,
): MensagemDeEmail {
  const fim = FIM_DE_LINHA_DA_CONTA_NOVA;
  const corpo =
    MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.linha_de_conta_nova.replace(
      '%s',
      dados.tituloDoSite,
    ) +
    fim +
    fim +
    MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.linha_do_login.replace(
      '%s',
      dados.login,
    ) +
    fim +
    fim +
    MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.linha_do_email.replace(
      '%s',
      dados.email,
    ) +
    fim;

  const montada: MensagemDeEmail = {
    destinatarios: [dados.emailDoAdministrador],
    assunto:
      MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL.assunto_de_conta_nova_ao_administrador.replace(
        '%s',
        dados.tituloDoSite,
      ),
    corpo,
    cabecalhos: [],
    anexos: [],
  };

  return ganchos?.filtrarMensagemDeContaNovaAoAdministrador?.(montada) ?? montada;
}
