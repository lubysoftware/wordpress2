/**
 * O vocabulario de estado editorial do legado, como enumeracao fechada.
 *
 * Entrega de T001 de `002-autoria-e-publicacao`, junto das tres portas. Aqui ha
 * **vocabulario, nao regra**: nenhuma transicao, nenhuma comparacao de data,
 * nenhuma decisao de capacidade e nenhum default resolvido. A resolucao do
 * estado na gravacao e T005 (US-2), a transicao para publicado e T003 (US-1) e a
 * comparacao de data que produz o agendado e T013 (US-6).
 *
 * ── O QUE "FECHADA" SIGNIFICA AQUI, E O QUE ELA NAO PODE SIGNIFICAR ─────────
 *
 * Fechada sobre o **vocabulario de fabrica**: sao os 12 estados que o nucleo
 * registra no arranque dentro de `create_initial_post_types()`, com
 * `_builtin => true`, em `wp-includes/post.php:660` a `:825`. Essa lista nao muda sozinha, e e por isso
 * que ela pode ser tipo.
 *
 * **Fechada NAO significa validacao da coluna, e por tres razoes medidas:**
 *
 * 1. `posts.post_status` e `varchar(20)` **sem `ENUM` e sem `CHECK`**
 *    (`target_data_model.md`, `DB-ENUM`: *"as 9 maquinas de estado sao validadas
 *    na aplicacao, e isso e o que o alvo reproduz"*).
 * 2. `register_post_status()` (`wp-includes/post.php:1457`) e ponto de extensao
 *    publico: terceiro registra estado proprio, e o P2 da constituicao diz que
 *    *"ponto de extensao e contrato publico"*. Um guarda que recusasse estado
 *    fora desta lista quebraria todo estado registrado por extensao — e isso
 *    cai na tabela *Nao negociavel*.
 * 3. O legado tolera estado nao registrado em vez de recusar: o mapeamento de
 *    capacidade **degrada** para `edit_others_posts` com aviso de uso indevido
 *    (UC-03, secao *Excecoes*). Recusar seria mais correto e seria outro
 *    produto.
 *
 * Por isso este arquivo NAO exporta validador nem guarda de tipo. Ele exporta a
 * lista, a ordem e as propriedades de cada estado de fabrica. O registro aberto
 * — aquele em que a extensao se inscreve — e de `plataforma/tipos-de-conteudo/`,
 * nao deste contexto.
 *
 * ── POR QUE OS 12, E NAO OS 8 "EDITORIAIS" ──────────────────────────────────
 *
 * `plan.md` conta `post_status` com **12 valores**, e sao 12 porque e **uma
 * coluna so**. Quatro deles (`request-*`) sao o ciclo de vida da solicitacao de
 * dado pessoal, que `target_architecture.md` poe em BC-06 e descreve como *"sem
 * intersecao com a maquina de `post_status`"*; `inherit` e o estado do anexo, de
 * BC-04 (BR-MIGRAR-002: *"anexo nunca e publicado"*); `trash` e a lixeira, da
 * feature 005. **Nenhum deles e desta feature, e todos sao do vocabulario** — e
 * omitir qualquer um faria esta lista mentir sobre a coluna que T002 vai gravar.
 * Esta feature mexe em `publish`, `future`, `draft`, `pending`, `private` e
 * `auto-draft`; os outros seis ela tem de conhecer sem tocar.
 *
 * O dono de cada estado nao esta gravado como campo porque o legado nao tem esse
 * campo: o registro de `register_post_status()` nao classifica por contexto, e
 * inventar a classificacao seria dado que o produto nao tem (P6). Fica na prosa.
 *
 * ── O QUE NAO ESTA AQUI ─────────────────────────────────────────────────────
 *
 * - **O rotulo de cada estado** ("Published", "Scheduled", "Pending"...). Eles
 *   sao texto traduzivel, com contexto de gettext (`'post status'` e
 *   `'request status'`, que existem justamente porque `pending` e `request-pending`
 *   colidem em ingles), e a traducao e de `plataforma/traducao/`, que por AD-08
 *   **nao ganha porta** e fica abaixo do contexto. Rotulo fixado aqui seria
 *   string de apresentacao dentro do dominio, que e o que REQ-161 pediria se
 *   nao tivesse ficado fora do pacote.
 * - **`_builtin`**, que vale `true` nos 12 e serve para separa-los dos
 *   registrados por extensao. Num tipo que so contem os de fabrica ele seria
 *   constante; quem precisar da distincao a tem pela presenca nesta lista.
 */

/**
 * Um dos 12 estados de fabrica. **O valor e a string do legado**, byte a byte,
 * porque e ela que vai para a coluna e e nela que a paridade e conferida.
 */
export type EstadoEditorial =
  | 'publish'
  | 'future'
  | 'draft'
  | 'pending'
  | 'private'
  | 'trash'
  | 'auto-draft'
  | 'inherit'
  | 'request-pending'
  | 'request-confirmed'
  | 'request-failed'
  | 'request-completed';

/**
 * Os 12 estados **na ordem em que o legado os registra**, de
 * `wp-includes/post.php:661` a `:813`.
 *
 * A ordem e observavel e por isso e dado, nao estilo: `$wp_post_statuses` e um
 * arranjo associativo alimentado por insercao (`:1535`), e `get_post_stati()`
 * devolve na ordem de registro — logo e esta a ordem em que o nucleo oferece os
 * estados a qualquer consumidor que itere o registro, inclusive o endpoint REST
 * de status (`wp-includes/rest-api/endpoints/class-wp-rest-post-statuses-controller.php`).
 */
export const ESTADOS_EDITORIAIS: readonly EstadoEditorial[] = Object.freeze([
  'publish',
  'future',
  'draft',
  'pending',
  'private',
  'trash',
  'auto-draft',
  'inherit',
  'request-pending',
  'request-confirmed',
  'request-failed',
  'request-completed',
] as const);

/**
 * As propriedades com que cada estado e registrado, **depois** dos defaults que
 * `register_post_status()` aplica (`wp-includes/post.php:1486` a `:1523`).
 *
 * Sao os valores EFETIVOS, e nao os literais da chamada, porque e o valor
 * efetivo que o resto do sistema le — `get_post_stati()` filtra por estes
 * campos, e e assim que `wp_insert_post()` descobre quais estados tem data
 * flutuante (`:4780`). A derivacao do legado, em uma linha cada:
 *
 * - quem nao declara nenhum dos quatro (`public`, `internal`, `protected`,
 *   `private`) nasce `internal` (`:1486`);
 * - `consultavelPeloPublico` default e `public` (`:1507`);
 * - `excluidoDaBusca` default e `internal` (`:1511`);
 * - `visivelNaListaDeTodos` e `visivelNaListaDeEstados` default sao o oposto de
 *   `internal` (`:1515` e `:1519`);
 * - `dataFlutuante` default e `false` (`:1523`).
 *
 * Nenhuma regra deste modulo le estes campos em T001. Eles estao aqui porque sao
 * o conteudo do registro no legado, e porque quem construir a consulta publica
 * (CA-2.3, CA-7.3, CA-11.2) tem de le-los de um lugar so em vez de rederivar.
 */
export interface PropriedadesDeEstadoEditorial {
  /** Aparece para o publico sem credencial. So `publish` e. */
  readonly publico: boolean;
  /** Uso interno: nao se escolhe na tela de edicao. */
  readonly interno: boolean;
  /** Protegido: existe na tela, nao no site. `future`, `draft` e `pending`. */
  readonly protegido: boolean;
  /** Privado: visivel a quem tem a capacidade de ler privado. So `private`. */
  readonly privado: boolean;
  /** Pode ser pedido pela consulta publica (`publicly_queryable`). */
  readonly consultavelPeloPublico: boolean;
  /** Fica fora da busca do site (`exclude_from_search`). */
  readonly excluidoDaBusca: boolean;
  /** Entra na lista "Todos" do painel (`show_in_admin_all_list`). */
  readonly visivelNaListaDeTodos: boolean;
  /** Entra na barra de contagem por estado (`show_in_admin_status_list`). */
  readonly visivelNaListaDeEstados: boolean;
  /**
   * Data flutuante (`date_floating`): a data do registro ainda nao foi
   * escolhida, e `post_date_gmt` fica na sentinela `'0000-00-00 00:00:00'`
   * (`wp-includes/post.php:4780` a `:4784`). Vale em `draft`, `pending` e
   * `auto-draft`, e em mais nenhum.
   */
  readonly dataFlutuante: boolean;
}

/** As propriedades de cada um dos 12, lidas do registro do legado. */
export const PROPRIEDADES_DO_ESTADO_EDITORIAL: Readonly<
  Record<EstadoEditorial, PropriedadesDeEstadoEditorial>
> = Object.freeze({
  /* `:661` — 'public' => true. O unico publico. */
  publish: Object.freeze({
    publico: true,
    interno: false,
    protegido: false,
    privado: false,
    consultavelPeloPublico: true,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: true,
    visivelNaListaDeEstados: true,
    dataFlutuante: false,
  }),
  /* `:675` — 'protected' => true. O agendado: data a frente, ainda nao publico. */
  future: Object.freeze({
    publico: false,
    interno: false,
    protegido: true,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: true,
    visivelNaListaDeEstados: true,
    dataFlutuante: false,
  }),
  /* `:689` — 'protected' e 'date_floating'. E o default da APLICACAO
     (BR-MIGRAR-001), e o default do DDL e `publish`: ver os dois constantes no
     fim deste arquivo. */
  draft: Object.freeze({
    publico: false,
    interno: false,
    protegido: true,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: true,
    visivelNaListaDeEstados: true,
    dataFlutuante: true,
  }),
  /* `:704` — 'protected' e 'date_floating'. O estado de US-7: em revisao. */
  pending: Object.freeze({
    publico: false,
    interno: false,
    protegido: true,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: true,
    visivelNaListaDeEstados: true,
    dataFlutuante: true,
  }),
  /* `:719` — 'private' => true. US-4: estado DISTINTO de publicado (CA-4.1),
     nao um publicado com atributo. */
  private: Object.freeze({
    publico: false,
    interno: false,
    protegido: false,
    privado: true,
    consultavelPeloPublico: false,
    excluidoDaBusca: false,
    visivelNaListaDeTodos: true,
    visivelNaListaDeEstados: true,
    dataFlutuante: false,
  }),
  /* `:733` — 'internal' => true, mas 'show_in_admin_status_list' => true
     explicito: a lixeira conta na barra de estados e some da lista "Todos". */
  trash: Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: true,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: true,
    dataFlutuante: false,
  }),
  /* `:748` — 'internal' e 'date_floating'. US-11: criado pelo ato de abrir o
     editor, e invisivel em qualquer listagem (CA-11.2) porque e o unico estado
     com os tres `false` de visibilidade. */
  'auto-draft': Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: true,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: false,
    dataFlutuante: true,
  }),
  /* `:758` — 'internal' => true COM 'exclude_from_search' => false explicito: e
     interno e ainda assim entra na busca, porque o anexo precisa ser
     encontravel. E a excecao que um porte "simplificado" apaga. */
  inherit: Object.freeze({
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
  /* `:768`, `:783`, `:798`, `:813` — os quatro da solicitacao de dado pessoal,
     todos 'internal' com 'exclude_from_search' => false. Ciclo de vida de BC-06
     dentro da mesma coluna. */
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
  ── OS DOIS DEFAULTS, QUE DIVERGEM DE PROPOSITO ─────────────────────────────

  BR-MIGRAR-001 (`P1`, 🟢) e o achado que a spec de paridade PT-002 existe para
  proteger: *"duas regras para a mesma coluna, dependendo de quem escreve"*. Os
  dois valores entram aqui como constante nomeada porque o P6 da constituicao
  pede que *"cada numero vive num ponto de configuracao nomeado, com o valor de
  fabrica do legado"* — e porque, deixados implicitos, o porte unifica os dois
  sem perceber. A Decisao 2 poe esta divergencia na area "efeito no banco".

  **T001 declara os dois e nao resolve nenhum.** Quem resolve e T005 (US-2), do
  lado da aplicacao, e T002, que escreve a estrutura com o default do DDL. Esta
  diferenca NAO e defeito a corrigir: `02-publicacao-e-agendamento-de-conteudo.feature`
  tem cenario dedicado a ela — *"a divergencia entre os dois defaults e identica
  nas duas metades"* — e o alvo, nas palavras de BR-MIGRAR-001, *"nao pode
  unificar os dois defaults"*.
*/

/**
 * O estado que a GRAVACAO POR APLICACAO assume quando ninguem informa estado:
 * `draft`.
 *
 * `$post_status = empty( $postarr['post_status'] ) ? 'draft' : $postarr['post_status'];`
 * — `wp-includes/post.php:4703`. E a metade "publicar e ato explicito" de US-2
 * (CA-2.1 e CA-2.2).
 */
export const ESTADO_PADRAO_DA_APLICACAO: EstadoEditorial = 'draft';

/**
 * O estado que o ARMAZENAMENTO assume quando a coluna nao e informada:
 * `publish`.
 *
 * `post_status varchar(20) NOT NULL default 'publish'` —
 * `wp-admin/includes/schema.php:167`. Quem insere linha direto na tabela publica
 * sem pedir, e isso e observavel: e o que o cenario da spec de paridade afirma
 * nas duas metades.
 *
 * Declarado aqui, no vocabulario, e **nao** como validacao: T002 e que emite a
 * estrutura, e e ela que tem de carregar este default no DDL.
 */
export const ESTADO_PADRAO_DO_ARMAZENAMENTO: EstadoEditorial = 'publish';
