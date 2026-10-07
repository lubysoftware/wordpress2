/**
 * O erro do cadastro: a forma que `WP_Error` tem no fluxo de registro, com os
 * codigos e as mensagens que o legado emite.
 *
 * E o gemeo de `../autenticacao/erro-de-autenticacao.ts`, e repete as duas
 * propriedades que fazem daquele arquivo um porte e nao uma reescrita:
 *
 * 1. **E valor devolvido, nunca excecao.** Os contratos de `plan.md` chamam a
 *    recusa do cadastro de erro de operacao — *"cadastro aberto desligado, login
 *    ou e-mail ja em uso, login na lista de proibidos"* —, e UC-21 poe cada uma na
 *    tabela de excecoes como *"erro no formulario"*. Formulario recebe valor, nao
 *    excecao.
 * 2. **O acumulo de itens e regra.** No legado o fluxo de registro soma **um**
 *    erro de login e **um** erro de e-mail antes de devolver, logo login vazio e
 *    e-mail vazio ao mesmo tempo produzem UM erro com DOIS codigos. Um tipo que
 *    guardasse um codigo so perderia esse caso, que e o mais comum de todos: o
 *    formulario enviado em branco.
 *
 * ---
 *
 * ## ⚠️ As mensagens reproduzem o legado e fecham contra o oraculo
 *
 * **O pacote nao registra o texto de nenhuma delas**, e isso e diferente de nao
 * haver texto. `target_screens.md` cataloga `SCR-005` com **8** mensagens
 * literais, e as 8 sao as da **tela** (rotulo de campo, titulo, botao, links) —
 * nenhuma e mensagem de validacao, porque a validacao nao mora no arquivo da tela
 * e sim em `wp-includes/user.php:3549` em diante, que UC-21 lista em *"Implementado
 * em"* sem transcrever.
 *
 * O precedente desta arvore e `../autenticacao/erro-de-autenticacao.ts`, que
 * esbarrou na mesma lacuna e a resolveu do mesmo jeito: reproduzir o legado, em
 * **ingles**, porque `EC-05` de `target_screens.md` fixa que *"o `msgid` em ingles
 * E a chave do catalogo"* e traduzir aqui trocaria a chave; e marcar a conferencia
 * contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe
 * (`oracleAvailable: false`). O que **nao** se faz e unificar, encurtar ou revisar:
 * o cenario de paridade da tela cobra *"a diferenca de texto e zero… nenhuma
 * revisao linguistica foi aplicada, porque nenhuma foi aprovada"*.
 *
 * As entidades HTML (`&#8217;`, `&hellip;`) ficam **como o legado as escreve**:
 * elas estao no `msgid`, logo fazem parte da chave do catalogo.
 */

/**
 * Os codigos que o cadastro emite.
 *
 * Eles vem de **dois** lugares do legado, e a diferenca decide o que o visitante
 * ve:
 *
 * | onde | codigos | chega ao formulario? |
 * |---|---|---|
 * | o fluxo de registro (`user.php:3549`) | `empty_username`, `invalid_username`, `username_exists`, `empty_email`, `invalid_email`, `email_exists`, `registerfail` | **sim** |
 * | a criacao da conta (`user.php:2318`, `:2325`, `:2336`, `:2347`) | `empty_user_login`, `user_login_too_long`, `existing_user_login`, `invalid_username`, `user_nicename_too_long`, `existing_user_email` | **nao**: ver `registerfail` |
 */
export type CodigoDeErroDeCadastro =
  /** Login vazio depois da sanitizacao. */
  | 'empty_username'
  /**
   * O login usa caractere que a sanitizacao estrita remove, **ou** esta na lista
   * de proibidos. O legado reusa o mesmo codigo nos dois casos, com textos
   * diferentes — como reusa `empty_username` nos dois caminhos da entrada.
   */
  | 'invalid_username'
  /** Ja existe conta com aquele login (`U2`: conferido **em codigo**). */
  | 'username_exists'
  /** Campo de e-mail vazio. */
  | 'empty_email'
  /** O e-mail nao passa no reconhecimento de endereco do legado. */
  | 'invalid_email'
  /** Ja existe conta com aquele e-mail (`U2`: conferido **em codigo**). */
  | 'email_exists'
  /**
   * A criacao da conta falhou, qualquer que tenha sido o motivo.
   *
   * ⚠️ **E este o codigo que o visitante ve quando o login passa de 60 ou o
   * apelido passa de 50**, e nao o codigo especifico. Ver
   * {@link erroQueOVisitanteVe}.
   */
  | 'registerfail'
  /** Criacao: login vazio. */
  | 'empty_user_login'
  /** Criacao: `U2`, o login passa do limite — **erro**, nao truncamento. */
  | 'user_login_too_long'
  /** Criacao: `U2`, o apelido passa do limite — **erro**, nao truncamento. */
  | 'user_nicename_too_long'
  /** Criacao: login duplicado, a conferencia redundante do legado. */
  | 'existing_user_login'
  /** Criacao: e-mail duplicado, a conferencia redundante do legado. */
  | 'existing_user_email';

/**
 * As mensagens, na forma em que o legado as emite. Ver a ressalva do cabecalho.
 *
 * Os dois textos com numero (`60`, `50`) o carregam **dentro do `msgid`**, e e
 * assim no legado: mudar o limite em
 * {@link LimitesDoCadastro} nao muda a
 * mensagem, porque a chave do catalogo e fixa. Interpolar o limite aqui trocaria
 * a chave e perderia a traducao.
 */
export const MENSAGENS_DE_ERRO_DE_CADASTRO = {
  empty_username: '<strong>Error:</strong> Please enter a username.',
  invalid_username:
    '<strong>Error:</strong> This username is invalid because it uses illegal characters. Please enter a valid username.',
  /** O mesmo codigo `invalid_username`, com o texto da lista de proibidos (`U3`). */
  invalid_username_nao_permitido:
    '<strong>Error:</strong> Sorry, that username is not allowed.',
  username_exists:
    '<strong>Error:</strong> This username is already registered. Please choose another one.',
  empty_email: '<strong>Error:</strong> Please type your email address.',
  invalid_email: '<strong>Error:</strong> The email address is not correct.',
  /** `%s` recebe a URL de entrada, que vem da borda. */
  email_exists:
    '<strong>Error:</strong> This email address is already registered. <a href="%s">Log in</a> with this address or choose another one.',
  /** `%s` recebe o endereco do administrador (`admin_email`). */
  registerfail:
    '<strong>Error:</strong> Couldn&#8217;t register you&hellip; please contact the <a href="mailto:%s">site admin</a>!',
  empty_user_login: 'Cannot create a user with an empty login name.',
  user_login_too_long: 'Username may not be longer than 60 characters.',
  user_nicename_too_long: 'Nicename may not be longer than 50 characters.',
  existing_user_login: 'Sorry, that username already exists!',
  existing_user_email: 'Sorry, that email address is already used!',
  /** A da criacao, que neste fluxo e inalcancavel. Ver `criacao-de-conta.ts`. */
  invalid_username_na_criacao: 'Sorry, that username is not allowed.',
} as const;

/** Um item do erro: um codigo e a mensagem dele, na ordem em que foi somado. */
export interface ItemDeErroDeCadastro {
  readonly codigo: CodigoDeErroDeCadastro;
  readonly mensagem: string;
}

/** O erro do cadastro. Equivale a um `WP_Error` com um ou mais codigos somados. */
export interface ErroDeCadastro {
  readonly erroDeCadastro: true;
  readonly itens: readonly ItemDeErroDeCadastro[];
}

/** Monta um erro com zero ou mais itens, na ordem em que o legado os soma. */
export function erroDeCadastro(
  ...itens: readonly ItemDeErroDeCadastro[]
): ErroDeCadastro {
  return { erroDeCadastro: true, itens };
}

/** Reconhece o erro no meio de um valor. */
export function ehErroDeCadastro(valor: unknown): valor is ErroDeCadastro {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeCadastro?: unknown }).erroDeCadastro === true
  );
}

/** Um erro sem nenhum item somado nao recusa nada — e o que `has_errors()` ve. */
export function temAlgumErro(erro: ErroDeCadastro): boolean {
  return erro.itens.length > 0;
}

/** O primeiro codigo somado, que e o que o legado devolve a quem pergunta. */
export function primeiroCodigoDeErro(
  erro: ErroDeCadastro,
): CodigoDeErroDeCadastro | null {
  return erro.itens[0]?.codigo ?? null;
}

/** Todos os codigos somados, na ordem. */
export function codigosDeErro(
  erro: ErroDeCadastro,
): readonly CodigoDeErroDeCadastro[] {
  return erro.itens.map((item) => item.codigo);
}

/**
 * 🔴 **A regra mais facil de "consertar" sem notar deste arquivo inteiro.**
 *
 * Quando a **criacao** da conta falha, o legado **joga fora o erro especifico** e
 * poe `registerfail` no lugar: o visitante que enviou um login de 61 caracteres
 * nao le *"Username may not be longer than 60 characters"*, le *"Couldn't register
 * you… please contact the site admin!"*. O codigo que diz o motivo nasce,
 * atravessa uma fronteira de funcao e e descartado.
 *
 * **CA-6.2 continua satisfeito, e e por isso que isto nao e defeito a corrigir:**
 * o criterio cobra *"devolvem erro, nunca truncamento silencioso"*, e o cenario de
 * paridade cobra *"as duas recusam com erro, e nenhuma trunca"* — recusa com erro
 * e o que acontece, e nada e truncado. O que o criterio **nao** cobra e qual texto
 * aparece.
 *
 * Um porte que surfaceasse o codigo especifico produziria um sistema mais
 * informativo que o legado, o que o **P1** trata como divergencia e nao como
 * melhoria: *"reproduza o comportamento observavel do sistema analisado, inclusive
 * quando ele parecer defeito"*.
 *
 * ⚠️ **A conferir contra o oraculo**, como as mensagens: o pacote nao transcreve
 * este envelopamento. O motivo original nao e perdido — ele volta em
 * `causa`, que o **P7** autoriza como observabilidade acrescentada
 * (*"registro e diagnostico novos podem ser acrescentados, mas nenhuma decisao do
 * sistema pode passar a depender deles"*) e que **nenhuma** ramificacao deste
 * modulo le. Ver `cadastrar.ts`.
 */
export function erroQueOVisitanteVe(
  emailDoAdministrador: string,
): ErroDeCadastro {
  return erroDeCadastro({
    codigo: 'registerfail',
    mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.registerfail.replace(
      '%s',
      emailDoAdministrador,
    ),
  });
}
