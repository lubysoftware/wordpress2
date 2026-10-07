/**
 * O erro da cadeia de autenticacao: a forma que `WP_Error` tem na entrada do
 * legado, com os codigos e as mensagens que o legado emite.
 *
 * **Este arquivo e divida herdada reproduzida de proposito.** BR-MIGRAR-110
 * (`ESC-ENUMERACAO`) manda preservar o que um sistema "bem escrito" conserta por
 * acidente: *"a mensagem de erro de login continua distinguindo conta
 * inexistente de senha incorreta, com os quatro codigos de erro e o texto
 * nomeando o login ou e-mail tentado"*. A resposta 6 de `questions.md` ja
 * decidiu isso uma vez, REQ-004 pede o contrario e esta **bloqueado**, e
 * `do-not-rewrite.md` poe REQ-004 fora do pacote. O P1 da constituicao fecha:
 * divergir exige decisao humana registrada, citada no codigo que divergiu —
 * e aqui nao ha nenhuma.
 *
 * A consequencia esta escrita no cenario `@divida-herdada` de
 * `parity_tests/06-autenticacao-e-sessao.feature`: *"as duas mensagens sao
 * diferentes entre si, nas duas metades"*. Unificar as mensagens quebra o
 * criterio de identico, nao o melhora.
 *
 * **O acumulo de itens tambem e regra.** No legado, login e senha vazios ao
 * mesmo tempo produzem UM erro com DOIS codigos (`empty_username` e
 * `empty_password`), e quem le toma o primeiro. Um tipo que guardasse um codigo
 * so perderia esse caso.
 */

/**
 * Os codigos que a cadeia de autenticacao emite.
 *
 * ⚠️ **Divergencia de contagem a conferir com quem escreveu a analise.**
 * `plan.md` (secao Contratos) e BR-MIGRAR-110 dizem **quatro** codigos; a
 * cadeia que os mesmos documentos descrevem tem dois autenticadores (por login
 * e por e-mail, UC-19 *"Login por e-mail em lugar do login"*) mais a
 * verificacao de conta marcada como spam, e os codigos distintos que eles
 * produzem sao os sete abaixo. Nao foi resolvido aqui: a lista reproduz o que a
 * cadeia emite, e a conferencia contra o oraculo (`ESC-ORACULO`) e quem fecha a
 * conta. Ver a nota de entrega de T003.
 */
export type CodigoDeErroDeAutenticacao =
  /** Campo de login (ou de e-mail) vazio. O legado reusa este codigo nos dois
   * caminhos, por retrocompatibilidade com a operacao de entrada. */
  | 'empty_username'
  /** Campo de senha vazio. */
  | 'empty_password'
  /** Nao existe conta com aquele login. **Nomeia o login tentado**
   * (`ESC-ENUMERACAO`). */
  | 'invalid_username'
  /** Nao existe conta com aquele e-mail. */
  | 'invalid_email'
  /** A conta existe e a senha nao confere. **Nomeia o login ou o e-mail
   * tentado** (`ESC-ENUMERACAO`). */
  | 'incorrect_password'
  /** Conta marcada como spam na rede. So existe quando a rede esta ativa. */
  | 'spammer_account'
  /** O ultimo recurso: a cadeia terminou sem conta e sem erro. E o unico
   * codigo que NAO distingue nada, e por isso o unico que nao enumera. */
  | 'authentication_failed';

/**
 * As mensagens, na forma em que o legado as emite.
 *
 * Elas estao em ingles de proposito: `target_screens.md` (`EC-05`) registra que
 * cada uma passa por traducao no legado e que **o `msgid` em ingles E a chave do
 * catalogo**, e o cenario de paridade da tela de login cobra *"cada mensagem
 * aparece identica a chave do catalogo, em ingles"* com *"diferenca de texto
 * zero, ignorando apenas espaco a direita"*. Traduzir aqui trocaria a chave.
 *
 * O marcador `%s` fica como o legado o deixa: `target_screens.md` lista
 * `{{printf_args}}` entre os pontos de interpolacao desta tela, e quem monta a
 * mensagem aqui so preenche o identificador tentado, que e o que
 * `ESC-ENUMERACAO` preserva.
 *
 * ⚠️ **A conferir contra o oraculo, byte a byte.** A tabela de mensagens
 * literais da tela de login em `target_screens.md` trunca em *"+10 strings"*, e
 * estas nao estao entre as 12 listadas. Elas reproduzem o legado, mas a prova e
 * a comparacao com a instalacao de referencia (`ESC-ORACULO`,
 * `oracleAvailable: false` nesta arvore).
 */
export const MENSAGENS_DE_ERRO_DE_AUTENTICACAO = {
  empty_username: '<strong>Error:</strong> The username field is empty.',
  /** O caminho por e-mail reusa o codigo `empty_username` com outro texto. */
  empty_username_email: '<strong>Error:</strong> The email field is empty.',
  empty_password: '<strong>Error:</strong> The password field is empty.',
  invalid_username:
    '<strong>Error:</strong> The username <strong>%s</strong> is not registered on this site. If you are unsure of your username, try your email address instead.',
  invalid_email:
    '<strong>Error:</strong> There is no account with that username or email address.',
  incorrect_password:
    '<strong>Error:</strong> The password you entered for the username %s is incorrect.',
  incorrect_password_email:
    '<strong>Error:</strong> The password you entered for the email address %s is incorrect.',
  spammer_account:
    '<strong>Error:</strong> Your account has been marked as a spammer.',
  authentication_failed:
    '<strong>Error:</strong> Invalid username, email address or incorrect password.',
  /** O texto do link de senha perdida que o legado concatena nas duas mensagens
   * de senha incorreta. A URL vem de fora: ela e da tela, nao do dominio. */
  senha_perdida: 'Lost your password?',
} as const;

/** Um item do erro: um codigo e a mensagem dele, na ordem em que foi somado. */
export interface ItemDeErroDeAutenticacao {
  readonly codigo: CodigoDeErroDeAutenticacao;
  readonly mensagem: string;
}

/**
 * O erro da cadeia. Equivale a um `WP_Error` com um ou mais codigos somados.
 *
 * E **valor devolvido**, nunca excecao: a cadeia do legado devolve o erro ao
 * chamador na mesma expressao (AD-03, e o barramento devolve valor em 69,7% dos
 * pontos), e quem chama decide o que mostrar.
 */
export interface ErroDeAutenticacao {
  readonly erroDeAutenticacao: true;
  readonly itens: readonly ItemDeErroDeAutenticacao[];
}

/** Monta um erro com um ou mais itens, na ordem em que o legado os soma. */
export function erroDeAutenticacao(
  ...itens: readonly ItemDeErroDeAutenticacao[]
): ErroDeAutenticacao {
  return { erroDeAutenticacao: true, itens };
}

/** Reconhece o erro no meio do valor que a cadeia carrega. */
export function ehErroDeAutenticacao(
  valor: unknown,
): valor is ErroDeAutenticacao {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeAutenticacao?: unknown }).erroDeAutenticacao === true
  );
}

/**
 * O primeiro codigo somado, que e o que o legado devolve quando perguntam "qual
 * foi o erro" a um `WP_Error` com varios.
 */
export function primeiroCodigoDeErro(
  erro: ErroDeAutenticacao,
): CodigoDeErroDeAutenticacao | null {
  return erro.itens[0]?.codigo ?? null;
}

/**
 * Os dois codigos que o legado **ignora** ao anunciar que a entrada falhou.
 *
 * Nao e detalhe: campo vazio nao dispara o ponto de extensao de falha de
 * entrada, e uma extensao que conte tentativas falhas conta diferente por causa
 * disso. O ponto de extensao e produto (P2), logo quem dispara e quem nao
 * dispara tambem e.
 */
export const CODIGOS_QUE_NAO_ANUNCIAM_FALHA: readonly CodigoDeErroDeAutenticacao[] =
  ['empty_username', 'empty_password'];
