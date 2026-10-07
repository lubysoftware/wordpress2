/**
 * Os codigos e as mensagens dos dois fluxos de US-4: pedir a redefinicao e
 * gravar a senha nova.
 *
 * **Por que uma tabela propria, e nao a de `erro-de-autenticacao.ts`.** Dois dos
 * textos daqui coincidem byte a byte com os da entrada — *"There is no account
 * with that username or email address."* e o mesmo msgid nos dois fluxos —, e
 * compartilhar a constante faria uma mudanca em um fluxo trocar a mensagem do
 * outro em silencio. No legado sao literais separados, em arquivos separados, e
 * `EC-05` fixa que **o msgid em ingles E a chave do catalogo**: duplicar o texto
 * e o que preserva a separacao.
 *
 * **O que esta recordado no pacote, e o que nao esta.** As mensagens que o
 * visitante **ve** estao nas tabelas de `target_screens.md`, com arquivo e linha,
 * e chegam aqui com a citacao. As mensagens internas do fluxo de pedido — campo
 * vazio, conta inexistente, redefinicao nao permitida — sao literais de
 * `wp-includes/user.php`, que **nao e tela** e portanto nao aparece em nenhuma
 * das 113 secoes de `target_screens.md`. Elas estao aqui marcadas com ⚠️, para a
 * conferencia byte a byte contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116, que
 * nesta arvore nao existe: `oracleAvailable: false`). E o mesmo tratamento que
 * `erro-de-autenticacao.ts` deu as mensagens que a tabela de `SCR-001` trunca.
 */

/** Os codigos do pedido de redefinicao (`SCR-002`, `/wp-login.php?action=lostpassword`). */
export type CodigoDeErroDoPedido =
  /** O campo `user_login` chegou vazio. */
  | 'empty_username'
  /**
   * O identificador tem arroba e nao ha conta com aquele e-mail **nem** com
   * aquele login.
   *
   * ⚠️ `ESC-ENUMERACAO` vale aqui tambem, e e divida herdada: UC-20 registra na
   * tabela de excecoes que *"a conta nao existe: o formulario informa o erro, o
   * que revela quais logins existem"*. REQ-004 pediria o contrario e esta
   * **bloqueado** (`do-not-rewrite.md`); o P1 fecha — divergir exige decisao
   * humana registrada, e aqui nao ha nenhuma.
   */
  | 'invalid_email'
  /**
   * O identificador nao tem arroba e nao ha conta com aquele login.
   *
   * Codigo diferente de `invalid_email` e **mesma mensagem**: a diferenca e
   * observavel apenas por quem le o codigo do erro, nao por quem le a tela.
   */
  | 'invalidcombo'
  /** Uma extensao recusou a redefinicao para aquela conta. Ver `GanchosDoPedido`. */
  | 'no_password_reset';

/** Os codigos da conferencia da chave e da gravacao da senha (`SCR-003`). */
export type CodigoDeErroDaRedefinicao =
  /** Chave que nao confere, chave ausente, conta inexistente — e chave **ja usada**. */
  | 'invalid_key'
  /** Chave que conferiu e passou do prazo de 24 horas (CA-4.2). */
  | 'expired_key'
  /** `pass1` so com espaco. */
  | 'password_reset_empty_space'
  /** `pass1` e `pass2` diferentes. */
  | 'password_reset_mismatch';

export type CodigoDeErroDeRedefinicao =
  | CodigoDeErroDoPedido
  | CodigoDeErroDaRedefinicao;

/**
 * As mensagens do fluxo de pedido.
 *
 * ⚠️ **Nenhuma destas quatro esta nas tabelas de `target_screens.md`** (ver o
 * cabecalho deste arquivo). Elas reproduzem o legado e fecham contra o oraculo.
 */
export const MENSAGENS_DO_PEDIDO = {
  empty_username:
    '<strong>Error:</strong> Please enter a username or email address.',
  invalid_email:
    '<strong>Error:</strong> There is no account with that username or email address.',
  /** Mesmo texto de `invalid_email`, codigo diferente — como no legado. */
  invalidcombo:
    '<strong>Error:</strong> There is no account with that username or email address.',
  no_password_reset: 'Password reset is not allowed for this user',
} as const;

/**
 * As mensagens que a **tela de pedido** emite quando a redefinicao volta
 * recusada, e que sao o que o titular efetivamente le (CA-4.2 e CA-4.5).
 *
 * 🟢 As duas estao na tabela de mensagens literais de `SCR-002` em
 * `target_screens.md`, com arquivo e linha: `wp-login.php:844` e
 * `wp-login.php:846`. **CA-4.5 pede erro generico e e exatamente o que :844 e**:
 * ele nao diz se a conta existe, se a chave foi usada ou se nunca existiu.
 * **CA-4.2 pede aviso de prazo vencido com oferta de pedir outra** e :846 traz as
 * duas coisas na mesma frase, *"Please request a new link below"*, com o
 * formulario de pedido logo abaixo.
 */
export const MENSAGENS_DA_TELA_DE_PEDIDO = {
  /** `wp-login.php:844` — o destino `error=invalidkey`. */
  chaveInvalida:
    '<strong>Error:</strong> Your password reset link appears to be invalid. Please request a new link below.',
  /** `wp-login.php:846` — o destino `error=expiredkey`. */
  chaveVencida:
    '<strong>Error:</strong> Your password reset link has expired. Please request a new link below.',
} as const;

/**
 * As mensagens da **tela de redefinicao**.
 *
 * 🟢 As quatro estao na tabela de `SCR-003`, com arquivo e linha. A tela esta em
 * modo **literal** e em familia C — *"o nome do campo e a API"* —, e o cenario
 * `@paridade-visual` cobra *"cada mensagem aparece identica a chave do catalogo,
 * em ingles"* com *"diferenca de texto zero, ignorando apenas espaco a
 * direita"*.
 */
export const MENSAGENS_DA_TELA_DE_REDEFINICAO = {
  /** `wp-login.php:976`. Repare que **nao** leva o prefixo `<strong>Error:</strong>`. */
  password_reset_empty_space: 'The password cannot be a space or all spaces.',
  /** `wp-login.php:982`. */
  password_reset_mismatch:
    '<strong>Error:</strong> The passwords do not match.',
  /** `wp-login.php:1000` — o passo 7 de UC-20, que devolve ao formulario de entrada. */
  senhaRedefinida: 'Your password has been reset.',
  /** `wp-login.php:1000` — o texto do link que acompanha a mensagem acima. */
  entrar: 'Log in',
} as const;

/**
 * Os dois destinos de redirecionamento que a tela de redefinicao usa quando a
 * chave e recusada.
 *
 * 🟢 Os dois estao na secao *Eventos e transicoes* de `SCR-003`:
 * `site_url( 'wp-login.php?action=lostpassword&error=expiredkey' )`
 * (`wp-login.php:961`) e `…&error=invalidkey` (`wp-login.php:963`). Ficam aqui
 * na forma **relativa**, porque a URL absoluta e montada com a URL da
 * instalacao e isso e da borda, nao do dominio — o mesmo tratamento que
 * `ContextoDeAutenticacao` da a `urlDoPainel` e a `urlDeSenhaPerdida`.
 *
 * E o mapa e por codigo de proposito: e o codigo que decide o destino, e o
 * legado distingue os dois **somente** por ele (`$user->get_error_code() ===
 * 'expired_key'`).
 */
export const DESTINO_POR_CODIGO_DE_CHAVE: Readonly<
  Record<'invalid_key' | 'expired_key', string>
> = {
  expired_key: 'wp-login.php?action=lostpassword&error=expiredkey',
  invalid_key: 'wp-login.php?action=lostpassword&error=invalidkey',
};

/**
 * A mensagem que o titular **le** em cada um dos dois codigos de recusa de
 * chave.
 *
 * E a mensagem da tela de pedido, nao uma mensagem deste fluxo, e e de proposito:
 * no legado a recusa da chave nao pinta texto na tela de redefinicao — ela
 * **redireciona** para a tela de pedido com o eixo do erro na URL, e e lá que o
 * texto nasce (`wp-login.php:844` e `:846`). A mensagem interna que o fluxo
 * carrega entre as duas telas **nao** esta registrada no pacote; o que esta
 * registrado e o que chega a pessoa, e e isso que o erro leva, para que nenhum
 * literal nao conferivel entre no dominio.
 */
export const MENSAGEM_POR_CODIGO_DE_CHAVE: Readonly<
  Record<'invalid_key' | 'expired_key', string>
> = {
  expired_key: MENSAGENS_DA_TELA_DE_PEDIDO.chaveVencida,
  invalid_key: MENSAGENS_DA_TELA_DE_PEDIDO.chaveInvalida,
};

/** Um item do erro: um codigo e a mensagem dele, na ordem em que foi somado. */
export interface ItemDeErroDeRedefinicao {
  readonly codigo: CodigoDeErroDeRedefinicao;
  readonly mensagem: string;
}

/**
 * O erro dos fluxos de US-4, na mesma forma do erro da entrada: um `WP_Error`
 * com um ou mais codigos somados, devolvido como **valor** e nunca lancado.
 *
 * O acumulo nao e enfeite: no legado as duas recusas de senha — so espaco e
 * senhas diferentes — somam no **mesmo** erro, e a tela pinta as duas juntas.
 */
export interface ErroDeRedefinicao {
  readonly erroDeRedefinicao: true;
  readonly itens: readonly ItemDeErroDeRedefinicao[];
}

export function erroDeRedefinicao(
  ...itens: readonly ItemDeErroDeRedefinicao[]
): ErroDeRedefinicao {
  return { erroDeRedefinicao: true, itens };
}

export function ehErroDeRedefinicao(valor: unknown): valor is ErroDeRedefinicao {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeRedefinicao?: unknown }).erroDeRedefinicao === true
  );
}

/** O primeiro codigo somado — o que o legado devolve a quem pergunta "qual foi". */
export function primeiroCodigoDeErroDeRedefinicao(
  erro: ErroDeRedefinicao,
): CodigoDeErroDeRedefinicao | null {
  return erro.itens[0]?.codigo ?? null;
}
