/**
 * As recusas e os avisos da administracao de contas, com os textos literais do
 * legado.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). Duas
 * familias, e elas nao sao a mesma coisa no legado:
 *
 * - **recusa**: `wp_die( mensagem, codigo )` — a requisicao **para**, com o
 *   codigo HTTP que a chamada declara. Nenhuma outra conta do lote e tocada;
 * - **aviso**: o valor de `$update`, que viaja na URL do redirecionamento e vira
 *   um bilhete na tela seguinte. O lote **terminou**, e o aviso diz o que foi
 *   saltado.
 *
 * A diferenca entre as duas e exatamente o que CA-11.2 pergunta, e e por isso que
 * elas sao tipos distintos aqui em vez de dois valores do mesmo tipo.
 *
 * ## ⚠️ Os textos sao os do legado, em ingles, e fecham contra o oraculo
 *
 * Mesmo precedente e mesma postura de `../cadastro/erro-de-cadastro.ts` e de
 * `../autenticacao/erro-de-autenticacao.ts`: `EC-05` fixa que *"o `msgid` em
 * ingles E a chave do catalogo"*, logo traduzir aqui trocaria a chave. Os textos
 * foram lidos nas linhas que UC-24 aponta (`wp-admin/users.php`,
 * `wp-admin/user-new.php`, `wp-admin/user-edit.php`), e a conferencia byte a byte
 * fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
 *
 * 🔴 **Duas mensagens do legado sao HTML, e aqui elas chegam partidas em duas
 * linhas.** `wp_die` recebe, nesses dois casos, um titulo em `<h1>` e um corpo em
 * `<p>`; a montagem da marcacao e da borda, que nao existe nesta arvore. Quem
 * montar a tela junta {@link RecusaDaAdministracao.titulo} e
 * {@link RecusaDaAdministracao.mensagem} na ordem em que estao, que e a do legado.
 */

/** O codigo HTTP que a recusa declara, ou `null` quando o legado nao declara nenhum. */
export type CodigoDeRecusa = 400 | 403 | null;

/**
 * Uma recusa que **para** a requisicao — o `wp_die()` do legado.
 *
 * `titulo` e `null` nas recusas em que o legado nao passa `<h1>`.
 */
export interface RecusaDaAdministracao {
  readonly titulo: string | null;
  readonly mensagem: string;
  readonly codigoHttp: CodigoDeRecusa;
}

/** O titulo que as tres guardas de tela compartilham. */
export const TITULO_DE_PERMISSAO_INSUFICIENTE = 'You need a higher level of permission.';

/**
 * As recusas, com a linha do legado de cada uma.
 *
 * Declaradas como **dado** e nao montadas em cada ponto porque duas delas
 * repetem o mesmo texto em pontos diferentes (`promover_acao` e `promover_alvo`),
 * e e isso que o legado faz: a mensagem de *"nao pode editar este usuario"*
 * aparece tres vezes, com tres origens. Fundi-las esconderia que sao tres
 * decisoes.
 */
export const RECUSAS_DA_ADMINISTRACAO = {
  /** `wp-admin/users.php:14` — a guarda da propria lista. */
  listar: {
    titulo: TITULO_DE_PERMISSAO_INSUFICIENTE,
    mensagem: 'Sorry, you are not allowed to list users.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:114` — `promote_users`, a capacidade da **acao**. */
  promover_acao: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to edit this user.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:131` — o papel pedido nao esta entre os editaveis. */
  papel_nao_editavel: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to give users that role.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:143` — `promote_user` sobre **aquela** conta (CA-11.1). */
  promover_alvo: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to edit this user.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:149` — CA-11.5, a recusa explicita de tirar o proprio papel. */
  remocao_do_proprio_papel: {
    titulo: null,
    mensagem: 'Sorry, you cannot remove your own role.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:162` — em rede, a conta escolhida nao pertence a este site. */
  conta_fora_do_site: {
    titulo: 'An error occurred.',
    mensagem: 'One of the selected users is not a member of this site.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:180` — em rede, esta tela nao apaga identidade. */
  exclusao_em_rede: {
    titulo: null,
    mensagem: 'User deletion is not allowed from this screen.',
    codigoHttp: 400,
  },
  /** `wp-admin/users.php:200` — `delete_users`, a capacidade da **acao**. */
  apagar_acao: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to delete users.',
    codigoHttp: 403,
  },
  /**
   * `wp-admin/users.php:208` — `delete_user` sobre **aquela** conta (CA-11.1).
   *
   * Note o texto: *"that user"*, e nao *"this user"*. Sao mensagens diferentes
   * e portanto chaves de catalogo diferentes.
   */
  apagar_alvo: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to delete that user.',
    codigoHttp: 403,
  },
  /** `wp-admin/users.php:493` — fora da rede nao existe desvincular. */
  remocao_fora_da_rede: {
    titulo: null,
    mensagem: 'You cannot remove users.',
    codigoHttp: 400,
  },
  /** `wp-admin/users.php:502` — `remove_users`, a capacidade da **acao**. */
  remover_acao: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to remove users.',
    codigoHttp: 403,
  },
  /** `wp-admin/user-new.php:194` — `create_users`, a capacidade da **acao**. */
  criar_acao: {
    titulo: TITULO_DE_PERMISSAO_INSUFICIENTE,
    mensagem: 'Sorry, you are not allowed to create users.',
    codigoHttp: 403,
  },
  /**
   * `wp-admin/user-new.php:15` — a guarda da tela **em rede**, que aceita
   * `create_users` **ou** `promote_users`.
   */
  criar_na_rede: {
    titulo: TITULO_DE_PERMISSAO_INSUFICIENTE,
    mensagem: 'Sorry, you are not allowed to add users to this network.',
    codigoHttp: 403,
  },
  /**
   * `wp-admin/user-edit.php:136` — `edit_user` sobre **aquela** conta.
   *
   * ⚠️ E a unica recusa desta familia **sem codigo declarado**: a chamada e
   * `wp_die( __( 'Sorry, you are not allowed to edit this user.' ) )`, sem
   * segundo argumento. Inventar `403` aqui seria inventar resposta HTTP.
   */
  alterar_alvo: {
    titulo: null,
    mensagem: 'Sorry, you are not allowed to edit this user.',
    codigoHttp: null,
  },
} as const satisfies Record<string, RecusaDaAdministracao>;

/** O nome de cada recusa, para quem precisa citar uma. */
export type MotivoDeRecusaDaAdministracao = keyof typeof RECUSAS_DA_ADMINISTRACAO;

/**
 * Os valores de `$update` que as acoes em lote produzem.
 *
 * Sao os nomes do legado, em `snake_case` e em ingles, porque eles **viajam na
 * URL** (`add_query_arg( 'update', $update, $redirect )`) e sao lidos pelo
 * `switch` da tela seguinte: renomea-los mudaria o endereco que um programa de
 * terceiro ja conhece, que e o que o **P8** proibe.
 */
export const AVISOS_DA_ADMINISTRACAO = {
  /** Lote de promocao concluido sem nenhum salto. */
  promocao: 'promote',
  /**
   * CA-11.4: o ator pediu para si um papel sem `promote_users`.
   *
   * O texto da tela diz, por extenso, o que a implementacao faz — *"Your role was
   * not changed."* — e e a confirmacao de que o legado **nao** altera o papel do
   * proprio ator por esta acao. Ver `promover-contas.ts`.
   */
  papel_proprio_recusado: 'err_admin_role',
  /** Lote de exclusao concluido sem nenhum salto. */
  exclusao: 'del',
  /** O ator estava no lote de exclusao e foi saltado. */
  exclusao_do_proprio_ator: 'err_admin_del',
  /** CA-11.3: reatribuicao escolhida sem conta de destino. */
  reatribuicao_sem_destino: 'err_missing_reassign',
  /** Lote de remocao do site concluido sem nenhum salto. */
  remocao: 'remove',
  /** CA-11.2: uma conta do lote de remocao nao passou na permissao e foi saltada. */
  remocao_do_proprio_ator: 'err_admin_remove',
  /** Conta criada pelo administrador. */
  criacao: 'add',
} as const;

/** O valor de `$update` de um lote. */
export type AvisoDaAdministracao =
  (typeof AVISOS_DA_ADMINISTRACAO)[keyof typeof AVISOS_DA_ADMINISTRACAO];

/**
 * Os bilhetes que a tela seguinte mostra para cada `$update`
 * (`wp-admin/users.php:642`-`:795`).
 *
 * Estao aqui, e nao na borda, por duas razoes: o texto de
 * `err_admin_role` e a **mensagem explicita** que CA-11.4 e CA-11.5 cobram, e o
 * de `err_missing_reassign` e a de CA-11.3. Quem monta a tela os le; nenhuma
 * decisao deste modulo os consulta.
 */
export const BILHETES_DA_ADMINISTRACAO = {
  promote: 'Changed roles.',
  err_admin_role:
    'You cannot change your own role to one that does not allow managing other users. Your role was not changed.',
  del: 'User deleted.',
  err_admin_del: 'You cannot delete the current user.',
  err_missing_reassign:
    'Users could not be deleted because no user was selected for content reassignment.',
  remove: 'User removed from this site.',
  err_admin_remove: 'You cannot remove the current user.',
  add: 'New user created.',
} as const satisfies Record<AvisoDaAdministracao, string>;

/**
 * O bilhete que **acompanha** um aviso de salto quando alguma conta foi mesmo
 * tratada (`users.php:724`, `:744` e `:764`).
 *
 * Sao tres textos distintos para a mesma ideia, e o legado os escolhe pelo aviso:
 * um para papel, um para exclusao e um — o mesmo da exclusao — para reatribuicao
 * ausente.
 */
export const BILHETES_COMPLEMENTARES_DA_ADMINISTRACAO = {
  err_admin_role: 'Other user roles have been changed.',
  err_admin_del: 'Other users have been deleted.',
  err_missing_reassign: 'Other users have been deleted.',
} as const;

/**
 * O aviso da tela de confirmacao quando nenhuma opcao de exclusao foi escolhida
 * (`wp-admin/users.php:326`), e e CA-11.3.
 *
 * Vem em duas partes como no legado — um `<strong>` e o texto — pela mesma razao
 * do `titulo` das recusas: a marcacao e da borda.
 */
export const AVISO_DE_OPCAO_DE_EXCLUSAO_AUSENTE = {
  destaque: 'Error:',
  mensagem: 'Please select an option.',
} as const;
