/**
 * Os quatro estados da solicitacao, como vocabulario fechado.
 *
 * Metade da entrega de **T002** da feature `008-privacidade-e-dados-pessoais`:
 * *"com os quatro estados do legado"*. `satisfaz: — (infraestrutura)`.
 *
 * Aqui ha **vocabulario, nao regra**: nenhuma transicao e executada, nenhum
 * prazo e comparado, nenhuma capacidade e consultada e nenhum default e
 * resolvido. A transicao de cada gatilho e da tarefa dele — ver a tabela de
 * *Transicoes* abaixo.
 *
 * `D1` / BR-MIGRAR-038, 🟢: *"Exportacao e apagamento de dados pessoais vivem
 * como `post_type = 'user_request'` com quatro status dedicados"*. Os quatro sao
 * registrados em `create_initial_post_types()`, nas linhas `wp-includes/post.php:768`,
 * `:783`, `:798` e `:813`.
 *
 * ── O QUE "FECHADO" SIGNIFICA AQUI, E O QUE ELE NAO PODE SIGNIFICAR ────────
 *
 * Fechado sobre o **vocabulario de fabrica**: sao os quatro que o nucleo
 * registra no arranque, com `_builtin => true`. Essa lista nao muda sozinha, e e
 * por isso que ela pode ser tipo.
 *
 * **Fechado NAO significa validacao da coluna**, pelas mesmas tres razoes que
 * `contextos/conteudo/estado-editorial.ts` ja registra: `posts.post_status` e
 * `varchar(20)` **sem `ENUM` e sem `CHECK`** (`DB-ENUM`),
 * `register_post_status()` e ponto de extensao publico (P2 da constituicao), e o
 * legado **tolera** estado nao registrado em vez de recusar. Este arquivo nao
 * exporta validador nem guarda de tipo.
 *
 * ── POR QUE OS QUATRO APARECEM DE NOVO AQUI ───────────────────────────────
 *
 * `contextos/conteudo/estado-editorial.ts` ja lista os doze valores da coluna,
 * **inclusive estes quatro**, e diz por que: *"omitir qualquer um faria esta
 * lista mentir sobre a coluna"*. A repeticao e a mesma da porta de dados: a
 * regra de dependencia 3 de `target_architecture.md` proibe `contextos/<a>/`
 * importar `contextos/<b>/` *"sempre, sem excecao"*, e
 * `target_architecture.md` e explicito sobre de quem sao estes quatro — o ciclo
 * de vida `user_request` *"nao tem intersecao com a maquina de `post_status`"* e
 * por isso BC-06 existe separado.
 *
 * ── AS TRANSICOES, E DE QUEM E CADA UMA ───────────────────────────────────
 *
 * A maquina 4 de `state-machines.md` — *"a unica maquina do sistema com estado
 * terminal declarado"*. A tabela e dela, a coluna de tarefa e desta feature:
 *
 * | de | para | gatilho | o que mais muda no mesmo comando | ancora | tarefa |
 * |---|---|---|---|---|---|
 * | — | `request-pending` | abrir a solicitacao | — | `user.php:4847` (`'request-' . $status`) | T003 |
 * | — | `request-confirmed` | abrir com `$status = 'confirmed'` | — | `user.php:4816`, `:4847` | T003 |
 * | `request-pending` | `request-pending` | gerar a chave no envio | a chave com resumo, em `post_password` | `user.php:5063` a `:5069` | T005 |
 * | `request-failed` | `request-pending` | reenviar | chave nova | `user.php:5063` a `:5069` | T007 |
 * | `request-pending`/`request-failed` | `request-confirmed` | o titular abre o link | o metadado de instante, gravado **antes** | `user.php:4252` a `:4262` | T005 |
 * | `request-confirmed` | `request-completed` | o administrador executa | o metadado de instante, gravado **antes** | `privacy-tools.php:55` a `:62` | T011, T013 |
 * | `request-pending` | `request-failed` | expiracao de 24 h | **a chave, esvaziada no mesmo `UPDATE`** | `privacy-tools.php:222` a `:230` | T009 |
 * | `request-completed` | — | **nada** | — | `user.php:4490` | — |
 *
 * ⚠️ **Falta uma linha nessa tabela, e a falta e um conflito aberto que T001
 * registrou e T002 confirmou.** `state-machines.md` declara a transicao
 * *"`request-pending` → `request-failed` | falha ao enviar o e-mail"* com a
 * ancora `wp-admin/includes/privacy-tools.php:226` — **a mesma ancora que ela da
 * para a expiracao**, uma linha abaixo. Uma busca por `request-failed` em
 * `wp-admin/` e `wp-includes/` devolve **uma** escrita, e ela esta dentro de
 * `_wp_personal_data_cleanup_requests()`, que e a rotina das 24 horas. CA-3.1 e
 * a tabela de excecoes de UC-25 afirmam a transicao por falha de envio; a arvore
 * nao a tem. **T002 nao escolhe lado**: {@link ESTADO_DE_FALHA} existe, e quem
 * grava o que a partir da falha de envio e decisao de **T007**, com a divergencia
 * no `../README.md`.
 */

/**
 * Um dos quatro estados da solicitacao. **O valor e a cadeia do legado, byte a
 * byte**, porque e ela que vai para a coluna e e nela que a paridade e
 * conferida.
 */
export type EstadoDaSolicitacao =
  | 'request-pending'
  | 'request-confirmed'
  | 'request-failed'
  | 'request-completed';

/**
 * Os quatro **na ordem em que o legado os registra**, de `post.php:768` a
 * `:813`.
 *
 * A ordem e observavel e por isso e dado, nao estilo: `$wp_post_statuses` e um
 * arranjo associativo alimentado por insercao, e `get_post_stati()` devolve na
 * ordem de registro. E e a mesma ordem de `_wp_privacy_statuses()`
 * (`post.php:1400` a `:1405`), que e o que a lista do painel usa para montar a
 * barra de contagem por estado — a tela de CA-1.4 e CA-3.4.
 */
export const ESTADOS_DA_SOLICITACAO: readonly EstadoDaSolicitacao[] =
  Object.freeze([
    'request-pending',
    'request-confirmed',
    'request-failed',
    'request-completed',
  ] as const);

/** `request-pending` — criada, aguardando o titular confirmar. */
export const ESTADO_PENDENTE: EstadoDaSolicitacao = 'request-pending';

/** `request-confirmed` — o titular confirmou; o administrador pode executar. */
export const ESTADO_CONFIRMADO: EstadoDaSolicitacao = 'request-confirmed';

/**
 * `request-failed` — e **dois significados no mesmo valor**.
 *
 * UC-26 e literal: *"'o e-mail nao saiu' e 'o titular nao confirmou em 24 horas'
 * sao o mesmo estado, e nada no registro os distingue"*, e
 * `state-machines.md` repete. A consequencia pratica e a mesma — pode-se
 * reenviar —, mas *"um relatorio de conformidade nao consegue separar os dois"*.
 * Acrescentar coluna, metadado ou sufixo que os separasse seria dado que o
 * produto nao tem (P6) e mudaria o que um programa de terceiro le.
 */
export const ESTADO_DE_FALHA: EstadoDaSolicitacao = 'request-failed';

/**
 * `request-completed` — executada, e **terminal**.
 *
 * `state-machines.md` chama esta de *"a unica maquina do sistema com estado
 * terminal declarado"*, e a terminalidade tem efeito observavel em dois lugares:
 * a chave **nao** pode mais ser validada (ver
 * {@link ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE}), que e CA-2.4, e o aviso ao
 * titular so sai a partir dela (`wp-includes/user.php:4490`).
 *
 * ⚠️ **Terminal nao significa apagado.** UC-27: *"o arquivo expira; o registro
 * nao"*, e a resposta 20 de `questions.md` fecha — o nucleo nao declara prazo de
 * retencao nenhum para a solicitacao concluida. `REQ-094`, que pediria o
 * contrario, esta `bloqueado`. Inventar o prazo cai na tabela *Nao negociavel*
 * da constituicao.
 */
export const ESTADO_CONCLUIDO: EstadoDaSolicitacao = 'request-completed';

/**
 * Os **dois** estados em que a chave de confirmacao pode ser validada, na ordem
 * em que o legado os lista.
 *
 * Transcricao literal do `in_array( $request->status, array( 'request-pending',
 * 'request-failed' ), true )` que aparece **duas vezes** na arvore, com o mesmo
 * conteudo e consequencias diferentes: em `wp_validate_user_request_key`
 * (`wp-includes/user.php:5097`), onde o `false` devolve `expired_request`, e em
 * `_wp_privacy_account_request_confirmed` (`:4252`), onde o `false` apenas
 * **retorna em silencio** sem gravar nada. As duas leituras sao de **T005**.
 *
 * `D2` / BR-MIGRAR-039, 🟢: *"[a chave] so pode ser validada enquanto a
 * solicitacao esta em `request-pending` ou `request-failed`"*. A lista e a razao
 * pela qual `request-failed` precisa aceitar validacao — `D3` /
 * BR-MIGRAR-040 — e e o que fecha CA-2.3, CA-2.4 e CA-3.2.
 *
 * A ordem nao e significativa no `in_array`; ela e transcrita porque a lista e
 * transcrita. O que e significativo e o **conjunto**: `request-confirmed` e
 * `request-completed` estao fora, e e so isso que impede reconfirmar um pedido
 * ja executado.
 */
export const ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE: readonly EstadoDaSolicitacao[] =
  Object.freeze(['request-pending', 'request-failed'] as const);

/**
 * `request-` — o prefixo que a abertura concatena ao estado pedido.
 *
 * `'post_status' => 'request-' . $status` (`wp-includes/user.php:4847`), onde
 * `$status` e um dos dois de {@link ESTADOS_ACEITOS_NA_ABERTURA}. Esta aqui
 * como constante porque a concatenacao e observavel: e ela que faz a abertura
 * aceitar `'pending'` e `'confirmed'` **sem** o prefixo e gravar o valor **com**
 * ele, e e por isso que o parametro publico da funcao nao usa o mesmo
 * vocabulario da coluna.
 */
export const PREFIXO_DO_ESTADO = 'request-';

/**
 * Os **dois** estados que a abertura aceita, sem o prefixo, na ordem em que o
 * legado os lista.
 *
 * `in_array( $status, array( 'pending', 'confirmed' ), true )`
 * (`wp-includes/user.php:4816`): qualquer outro valor devolve `invalid_status`
 * e **nada e gravado**. Os outros dois estados da maquina — falha e concluida —
 * nao podem ser pedidos na abertura, e e isso que faz a solicitacao nascer
 * sempre num ponto conhecido (CA-1.2).
 *
 * ⚠️ `'confirmed'` esta na lista, e com ele a solicitacao **nasce confirmada**,
 * sem chave e sem titular ter aberto link nenhum. Nao e caminho de tela: o
 * parametro foi acrescentado na 5.7.0 e e por ele que uma extensao abre
 * solicitacao ja autorizada. CA-1.2 descreve o caminho da tela — *"a solicitacao
 * nasce num estado pendente"* — e **nao** contradiz isto, porque o default do
 * parametro e `'pending'` (`:4804`). Quem portar T003 declara o default e nao
 * remove a opcao: ela e superficie publicada, e P8 a protege.
 */
export const ESTADOS_ACEITOS_NA_ABERTURA: readonly string[] = Object.freeze([
  'pending',
  'confirmed',
] as const);

/**
 * As propriedades com que cada estado e registrado, **depois** dos defaults que
 * `register_post_status()` aplica (`wp-includes/post.php:1486` a `:1523`).
 *
 * Sao os valores EFETIVOS, e nao os literais da chamada, porque e o valor
 * efetivo que o resto do sistema le — `get_post_stati()` filtra por estes
 * campos. A chamada de cada um dos quatro declara **so** `label`, `internal =>
 * true`, `_builtin => true`, `label_count` e `exclude_from_search => false`; o
 * resto sai dos defaults.
 *
 * Os quatro tem o **mesmo** retrato, e e isso que o torna informacao: eles sao
 * `internal` — nao se escolhem na tela de edicao e nao aparecem na lista de
 * conteudo — **e ainda assim** `exclude_from_search => false`, que e o unico
 * campo em que a chamada contraria o default de `internal`. A derivacao, em uma
 * linha cada:
 *
 * - quem nao declara nenhum dos quatro (`public`, `internal`, `protected`,
 *   `private`) nasceria `internal` (`:1486`); os quatro **declaram** `internal`;
 * - `consultavelPeloPublico` default e `public`, logo `false` (`:1507`);
 * - `excluidoDaBusca` default seria `internal`, logo `true` — e os quatro
 *   **declaram `false`**, contrariando o default (`:1511`);
 * - `visivelNaListaDeTodos` e `visivelNaListaDeEstados` default sao o oposto de
 *   `internal`, logo `false` (`:1515` e `:1519`);
 * - `dataFlutuante` default e `false` (`:1523`) — nenhum dos quatro o declara, e
 *   e por isso que a solicitacao **nunca** tem a sentinela de data: a abertura
 *   informa as duas datas explicitamente (`user.php:4849` e `:4850`).
 *
 * Nenhuma regra deste modulo le estes campos em T002. Eles estao aqui porque sao
 * o conteudo do registro no legado, e porque quem montar a lista do painel
 * (CA-1.4, CA-3.4) tem de le-los de um lugar so em vez de rederivar.
 */
export interface PropriedadesDeEstadoDaSolicitacao {
  /** Aparece para o publico sem credencial. Nenhum dos quatro. */
  readonly publico: boolean;
  /** Uso interno: nao se escolhe na tela de edicao. Os quatro sao. */
  readonly interno: boolean;
  /** Protegido: existe na tela, nao no site. Nenhum dos quatro. */
  readonly protegido: boolean;
  /** Privado: visivel a quem le privado. Nenhum dos quatro. */
  readonly privado: boolean;
  /** Pode ser pedido pela consulta publica (`publicly_queryable`). */
  readonly consultavelPeloPublico: boolean;
  /**
   * Fica fora da busca do site (`exclude_from_search`).
   *
   * ⚠️ `false` nos quatro, **declarado contra o default de `internal`**. Num
   * estado interno isso significa que a linha da solicitacao nao e excluida da
   * consulta de busca por causa do estado — o que a mantem fora do site e o
   * tipo, cujo registro e `public => false` e `exclude_from_search` implicito.
   * Reproduzir `true` aqui porque "e interno, logo deveria ser" e inverter uma
   * declaracao explicita do legado.
   */
  readonly excluidoDaBusca: boolean;
  /** Entra na lista "Todos" do painel (`show_in_admin_all_list`). */
  readonly visivelNaListaDeTodos: boolean;
  /** Entra na barra de contagem por estado (`show_in_admin_status_list`). */
  readonly visivelNaListaDeEstados: boolean;
  /**
   * Data flutuante (`date_floating`): `post_date_gmt` ficaria na sentinela
   * `'0000-00-00 00:00:00'`. `false` nos quatro — ver o cabecalho.
   */
  readonly dataFlutuante: boolean;
}

/** As propriedades dos quatro, lidas do registro do legado. */
export const PROPRIEDADES_DO_ESTADO_DA_SOLICITACAO: Readonly<
  Record<EstadoDaSolicitacao, PropriedadesDeEstadoDaSolicitacao>
> = Object.freeze({
  /* `:768` — 'internal' => true, 'exclude_from_search' => false. */
  'request-pending': Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: false,
    dataFlutuante: false,
  }),
  /* `:783` — idem. */
  'request-confirmed': Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: false,
    dataFlutuante: false,
  }),
  /* `:798` — idem. */
  'request-failed': Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: false,
    dataFlutuante: false,
  }),
  /* `:813` — idem. */
  'request-completed': Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: false,
    dataFlutuante: false,
  }),
});

/*
  ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────

  - **O rotulo de cada estado** ("Pending", "Confirmed", "Failed",
    "Completed"). Sao texto traduzivel, e com **contexto de gettext proprio** —
    `_x( 'Pending', 'request status' )` existe justamente porque `pending` e
    `request-pending` colidem em ingles (`post.php:770` e `:1401`). A traducao e
    de `plataforma/traducao/`, que por AD-08 nao ganha porta. A mesma decisao
    esta em `contextos/conteudo/estado-editorial.ts`.
  - **`label_count`**, a forma plural da contagem por estado
    (`post.php:772` a `:776`). E apresentacao, e depende do avaliador de plural
    do slot de traducao.
  - **`_builtin`**, que vale `true` nos quatro. Num tipo que so contem os de
    fabrica ele seria constante.
  - **A dispensa de unicidade do identificador na URL.** `BR-MIGRAR-005` (`P5`,
    🟢) registra que *"a unicidade e dispensada em `draft`, `pending`,
    `auto-draft`, em revisao e no tipo `user_request`"*
    (`wp-includes/post.php:5562`) — e e **por tipo**, nao por estado, logo nao
    e deste arquivo. A consequencia e grande e nao e desta tarefa fechar: duas
    solicitacoes podem compartilhar o mesmo `post_name`, que e **onde a acao
    pedida mora** (ver `./solicitacao.ts`). Um alvo que declarasse `UNIQUE` ali
    quebraria o produto.
*/
