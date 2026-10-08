/**
 * O erro do formulario de conta do painel — a familia de `edit_user()`.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). E **outra**
 * familia que a de `../cadastro/erro-de-cadastro.ts`, e nao e duplicacao: no
 * legado sao dois conjuntos de codigo e de texto, em dois arquivos, para as
 * mesmas conferencias.
 *
 * | conferencia | no cadastro aberto (`user.php:3549`) | no painel (`includes/user.php:30`) |
 * |---|---|---|
 * | login vazio | `empty_username` · *"Please enter a username."* | `user_login` · *"Please enter a username."* |
 * | login invalido | `invalid_username` | `user_login` |
 * | login duplicado | `username_exists` | `user_login` |
 * | e-mail vazio | `empty_email` · *"Please **type** your email address."* | `empty_email` · *"Please **enter** an email address."* |
 * | e-mail duplicado | `email_exists`, com link de entrada | `email_exists`, sem link |
 * | senha | — (o cadastro aberto gera a senha) | `pass`, em tres variantes |
 *
 * Note a quarta linha: **"type" contra "enter"**. Sao dois `msgid` diferentes,
 * logo duas chaves de catalogo diferentes, logo duas traducoes diferentes.
 * Unifica-las trocaria o texto de uma das duas telas — e o cenario de paridade de
 * tela cobra *"a diferenca de texto e zero"*.
 *
 * Mesma postura de `../cadastro/erro-de-cadastro.ts` nos tres pontos que
 * importam: **valor devolvido e nunca excecao**, **acumulo de itens** (o
 * formulario enviado em branco produz um erro com varios codigos) e **texto em
 * ingles** porque `EC-05` fixa o `msgid` como a chave do catalogo. A conferencia
 * byte a byte fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
 */

/** Os codigos que o formulario de conta do painel emite. */
export type CodigoDeErroDaAdministracao =
  /** Login vazio, invalido ou duplicado — o legado reusa **um** codigo nos tres. */
  | 'user_login'
  /** O apelido de exibicao ficou vazio. So na alteracao. */
  | 'nickname'
  /** Senha ausente, com barra invertida, ou diferente da confirmacao. */
  | 'pass'
  /** O login esta na lista de proibidos (`U3`). Vale na criacao **e** na alteracao. */
  | 'invalid_username'
  | 'empty_email'
  | 'invalid_email'
  | 'email_exists';

/** As mensagens, na forma em que o legado as emite. */
export const MENSAGENS_DE_ERRO_DA_ADMINISTRACAO = {
  user_login_vazio: '<strong>Error:</strong> Please enter a username.',
  user_login_invalido:
    '<strong>Error:</strong> This username is invalid because it uses illegal characters. Please enter a valid username.',
  user_login_duplicado:
    '<strong>Error:</strong> This username is already registered. Please choose another one.',
  nickname: '<strong>Error:</strong> Please enter a nickname.',
  pass_vazia: '<strong>Error:</strong> Please enter a password.',
  /**
   * A barra invertida na senha.
   *
   * ⚠️ O `msgid` traz a barra **escapada** (`the character "\\"`), e o texto que
   * sai tem **uma** barra. Duas barras aqui mudariam o byte enviado.
   */
  pass_com_barra:
    '<strong>Error:</strong> Passwords may not contain the character "\\".',
  pass_diferente:
    '<strong>Error:</strong> Passwords do not match. Please enter the same password in both password fields.',
  invalid_username: '<strong>Error:</strong> Sorry, that username is not allowed.',
  empty_email: '<strong>Error:</strong> Please enter an email address.',
  invalid_email: '<strong>Error:</strong> The email address is not correct.',
  email_exists:
    '<strong>Error:</strong> This email is already registered. Please choose another one.',
} as const;

/** Um item do erro: um codigo e a mensagem dele, na ordem em que foi somado. */
export interface ItemDeErroDaAdministracao {
  readonly codigo: CodigoDeErroDaAdministracao;
  readonly mensagem: string;
}

/** O erro do formulario. Equivale a um `WP_Error` com um ou mais codigos somados. */
export interface ErroDaAdministracao {
  readonly erroDaAdministracao: true;
  readonly itens: readonly ItemDeErroDaAdministracao[];
}

/** Monta um erro com zero ou mais itens, na ordem em que o legado os soma. */
export function erroDaAdministracao(
  ...itens: readonly ItemDeErroDaAdministracao[]
): ErroDaAdministracao {
  return { erroDaAdministracao: true, itens };
}

/** Um erro sem nenhum item somado nao recusa nada — e o que `has_errors()` ve. */
export function temAlgumErroDaAdministracao(erro: ErroDaAdministracao): boolean {
  return erro.itens.length > 0;
}

/** Todos os codigos somados, na ordem. */
export function codigosDeErroDaAdministracao(
  erro: ErroDaAdministracao,
): readonly CodigoDeErroDaAdministracao[] {
  return erro.itens.map((item) => item.codigo);
}
