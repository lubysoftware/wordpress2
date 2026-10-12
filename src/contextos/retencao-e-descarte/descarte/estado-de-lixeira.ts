/**
 * O estado `trash` como o legado o **registra**, que e a metade de **CA-1.2**
 * que nao e comando de banco: *"o conteudo descartado sai de toda consulta
 * publica e continua existindo"*.
 *
 * Entrega de **T003** (US-1). O criterio tem duas metades e elas sao decididas
 * em lugares diferentes, o que e a razao de este arquivo existir separado da
 * operacao:
 *
 * | metade de CA-1.2 | quem decide no legado | onde esta no alvo |
 * |---|---|---|
 * | *"continua existindo"* | `wp_update_post()` troca **uma coluna** e nenhum `DELETE` sai (`wp-includes/post.php:4131`) | `descartar-para-a-lixeira.ts`, e o teste afirma a sequencia de comandos |
 * | *"sai de toda consulta publica"* | o **registro** do estado, em `create_initial_post_types()` (`wp-includes/post.php:732`) | este arquivo: os campos efetivos do registro |
 *
 * ── POR QUE O NOME DO ESTADO APARECE EM TRES LUGARES DA ARVORE ──────────────
 *
 * A cadeia `trash` ja esta declarada em `plataforma/autorizacao/`
 * (`ESTADO_DE_LIXEIRA`, para o ramo de lixeira da traducao de capacidade) e no
 * vocabulario de BC-01 (`contextos/conteudo/estado-editorial.ts`, entre os 12 de
 * fabrica). Esta e a terceira, e **nenhuma das tres pode importar a outra sem
 * quebrar regra**:
 *
 * - de `contextos/conteudo/` para ca, a regra de dependencia 3 de
 *   `target_architecture.md` proibe *"sempre, sem excecao"*;
 * - de `plataforma/autorizacao/` para ca seria permitido pela regra 1, e e
 *   deliberadamente **nao** feito: ali a constante existe para **decidir
 *   capacidade** sobre quem ja esta na lixeira, e aqui ela e o **valor que vai
 *   para a coluna**. Pendurar a escrita no vocabulario do modulo de autorizacao
 *   acoplaria o caminho de gravacao a uma decisao que nao e dele — e o registro
 *   vivo de estados, que unificaria os tres, e `plataforma/tipos-de-conteudo/`,
 *   que **nao existe nesta arvore** (ver `presenca-em-consulta-publica.ts` de
 *   BC-01, que declara a mesma ausencia).
 *
 * As tres sao o **mesmo byte**, e e o byte que a paridade compara.
 */

/**
 * `trash` — o estado que o descarte grava na coluna
 * (`wp-includes/post.php:732`, `register_post_status( 'trash', ... )`).
 *
 * E o valor literal da coluna `post_status`, que `target_data_model.md` descreve
 * como `varchar(20)` **sem `ENUM` e sem `CHECK`**: nada no armazenamento impede
 * outro valor, e quem o cobra e o codigo. Renomear esta cadeia tornaria
 * invisivel a lixeira de toda instalacao existente, e cai em **P8**.
 */
export const ESTADO_DE_LIXEIRA = 'trash';

/**
 * Os campos do registro de um estado, com o nome que BC-01 ja lhes deu.
 *
 * ⚠️ **Esta interface repete `PropriedadesDeEstadoEditorial` de
 * `contextos/conteudo/estado-editorial.ts`, e a repeticao e obrigatoria** — a
 * regra de dependencia 3 proibe contexto importar contexto. Os nomes de campo
 * sao os mesmos de proposito: quem comparar os dois arquivos tem de ver o mesmo
 * registro, nao duas leituras diferentes dele.
 */
export interface PropriedadesDoEstadoRegistrado {
  /** `public` — aparece para quem nao tem credencial. */
  readonly publico: boolean;
  /** `internal` — uso interno: nao se escolhe na tela de edicao. */
  readonly interno: boolean;
  /** `protected` — existe na tela, nao no site. */
  readonly protegido: boolean;
  /** `private` — visivel a quem tem a capacidade de ler privado. */
  readonly privado: boolean;
  /** `publicly_queryable` — pode ser pedido pela consulta publica. */
  readonly consultavelPeloPublico: boolean;
  /** `exclude_from_search` — fica fora da busca do site. */
  readonly excluidoDaBusca: boolean;
  /** `show_in_admin_all_list` — entra na lista "Todos" do painel. */
  readonly visivelNaListaDeTodos: boolean;
  /** `show_in_admin_status_list` — entra na barra de contagem por estado. */
  readonly visivelNaListaDeEstados: boolean;
  /** `date_floating` — a data do registro ainda nao foi escolhida. */
  readonly dataFlutuante: boolean;
}

/**
 * **CA-1.2.** O registro do estado `trash`, com os valores **efetivos** —
 * depois dos defaults que `register_post_status()` aplica.
 *
 * A chamada do legado declara **tres** coisas e deixa o resto para o default
 * (`wp-includes/post.php:732`-`:745`):
 *
 * ```php
 * register_post_status(
 *     'trash',
 *     array(
 *         'label'                     => _x( 'Trash', 'post status' ),
 *         'internal'                  => true,
 *         '_builtin'                  => true,
 *         'label_count'               => _n_noop( ... ),
 *         'show_in_admin_status_list' => true,
 *     )
 * );
 * ```
 *
 * E a derivacao de cada campo efetivo, uma linha cada
 * (`wp-includes/post.php:1486` a `:1523`):
 *
 * | campo | de onde sai | valor |
 * |---|---|---|
 * | `publico` | nao declarado, e `internal` esta declarado | `false` |
 * | `interno` | declarado | `true` |
 * | `protegido` / `privado` | nao declarados | `false` |
 * | `consultavelPeloPublico` | default e `public` (`:1507`) | `false` |
 * | `excluidoDaBusca` | default e `internal` (`:1511`) | **`true`** |
 * | `visivelNaListaDeTodos` | default e o oposto de `internal` (`:1515`) | **`false`** |
 * | `visivelNaListaDeEstados` | **declarado explicito**, contra o default (`:1519`) | **`true`** |
 * | `dataFlutuante` | default (`:1523`) | `false` |
 *
 * **As tres linhas em negrito sao CA-1.2, e a quarta e o motivo de ela nao ser
 * "invisivel em tudo":** o descartado sai da consulta publica, sai da busca e
 * sai da lista "Todos" do painel, **e aparece na barra de contagem por
 * estado** — e e por essa barra que a pessoa chega a lixeira para restaurar
 * (US-3). Um porte que tratasse `internal` como "esconde em tudo" apagaria o
 * link da lixeira do painel.
 *
 * ⚠️ **A clausula da consulta publica NAO esta aqui, e nao e deste modulo.** Ela
 * e montada a partir do registro de estados pela consulta principal
 * (`class-wp-query.php:2738`, `get_post_stati( array( 'public' => true ) )`), que
 * e a feature **004** (`contextos/leitura-publica/`); a regra do lado de BC-01
 * esta em `conteudo/visibilidade/presenca-em-consulta-publica.ts`. O que este
 * arquivo entrega e **o dado do registro** que faz as duas excluirem `trash`
 * sem nenhum `if` sobre o nome do estado: `trash` nao tem `public`, logo nao
 * entra na lista; nao tem `private`, logo nao entra nem para quem esta
 * autenticado; e o sitemap pede `publish` por nome, logo nunca o alcanca.
 */
export const PROPRIEDADES_DO_ESTADO_DE_LIXEIRA: PropriedadesDoEstadoRegistrado =
  Object.freeze({
    publico: false,
    interno: true,
    protegido: false,
    privado: false,
    consultavelPeloPublico: false,
    excluidoDaBusca: true,
    visivelNaListaDeTodos: false,
    visivelNaListaDeEstados: true,
    dataFlutuante: false,
  });
