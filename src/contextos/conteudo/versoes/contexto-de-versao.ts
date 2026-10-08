/**
 * O contexto de uma operacao de versao: tudo que US-10 precisa e que **nao e**
 * porta deste modulo.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Mesma forma
 * e mesmas razoes de `../publicacao/contexto-de-publicacao.ts`, e as duas valem
 * palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo** (AD-02, BR-MIGRAR-105,
 *   `EXT-CONTEXTO`): identidade, consulta corrente e conexao sao escopo de
 *   REQUISICAO, e nesta tarefa isso pesa duas vezes, porque a versao **fica com
 *   o autor de quem a gravou** (ver {@link ContextoDeVersao.ator});
 * - **as colaboracoes chegam aqui, e nao como porta** (AD-08, AD-10, regra de
 *   dependencia 3).
 *
 * ---
 *
 * # O achado que esta tarefa existe para proteger
 *
 * 🔴 **A versao que o legado grava a cada gravacao carrega o texto NOVO, nao o
 * antigo.** `wp_save_post_revision()` corre **depois** da escrita, le
 * `get_post( $post_id )` — logo o registro ja atualizado — e manda esse registro
 * para `_wp_put_post_revision()` (`wp-includes/revision.php:140` e `:217`). O
 * docblock da propria funcao diz a consequencia em uma linha: *"as every update
 * is a revision, and **the most recent revision always matches the current
 * post**"* (`:122`-`:123`).
 *
 * Em efeito no banco, com um conteudo criado com o corpo `A` e depois gravado
 * com `B` e com `C`:
 *
 * | # | acao | o que o legado deixa em `posts` |
 * |---|---|---|
 * | 1 | criar com `A` | o conteudo com `A`. **Nenhuma versao** — `wp_save_post_revision_on_insert()` desiste quando `$update` e falso (`:108`) |
 * | 2 | gravar `B` | o conteudo com `B`, e **uma** versao, com `B` |
 * | 3 | gravar `C` | o conteudo com `C`, e **duas** versoes, com `B` e com `C` |
 *
 * O corpo `A` **nao fica em versao nenhuma**: ele e perdido pela primeira
 * gravacao. E a versao criada no passo 2 nao e *"a versao anterior"* — e a
 * recem-gravada.
 *
 * **CA-10.1 diz outra coisa**: *"Cada gravacao de conteudo ja existente guarda a
 * **versao anterior**, vinculada ao conteudo"*. As duas leituras coincidem no
 * que o criterio cobra de verificavel — uma linha de versao por gravacao de
 * conteudo que ja existia, ligada ao conteudo pela auto-referencia, e texto
 * anterior recuperavel — e **divergem no conteudo da linha que cada gravacao
 * cria**. O mesmo vale para a segunda metade de CA-10.4 (*"guarda o corrente
 * como versao nova"*): a versao que a restauracao cria carrega o texto
 * **restaurado**, e o texto sobrescrito ja estava guardado como a versao mais
 * recente **antes** dela — e por isso que nada se perde, e nao porque a
 * restauracao guarde o que sobrescreveu.
 *
 * **T021 nao escolhe entre as duas leituras.** Ela reproduz o legado, que e o
 * que o **P1** manda (*"reproduza o comportamento observavel do sistema
 * analisado, inclusive quando ele parecer defeito"*), e registra a divergencia
 * de redacao aqui, no README do modulo e no cabecalho de `guardar-versao.ts`,
 * porque *"divergir exige uma decisao humana registrada, citada no codigo que
 * divergiu"* — e nenhuma existe: `pending_decisions.md` nao tem pergunta sobre
 * versao, e `target_business_rules.md` nao tem regra de versao alem da cascata
 * de exclusao (BR-MIGRAR-104) e da negacao de capacidade (BR-MIGRAR-091).
 * Mesmo precedente de T003 com CA-1.1.
 *
 * ---
 *
 * # As colaboracoes, e por que nenhuma e porta
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `wp_insert_post( $revisao, true )` (`:372`) | **T005** (US-2), o caminho de gravacao deste modulo | {@link GravacaoNaVersao.inserir} |
 * | `wp_update_post( $update )` (`:500`) | **T005** (US-2) | {@link GravacaoNaVersao.atualizar} |
 * | `wp_delete_post( $revision->ID )` (`:638`) | **feature 005** (`PT-003`), a exclusao em sete etapas | {@link GravacaoNaVersao.apagar} |
 * | `post_type_supports( $tipo, 'revisions' )` | `plataforma/tipos-de-conteudo/`, que **nao existe nesta arvore** | {@link ContextoDeVersao.suportaVersao} |
 * | `current_user_can( 'edit_post', $pai )` | `plataforma/autorizacao/` | {@link ContextoDeVersao.base} e {@link ContextoDeVersao.ator} |
 * | `get_registered_meta_keys()` com `revisions_enabled` | o registro de metadado, que **nao existe nesta arvore** | {@link ContextoDeVersao.metadadosVersionados} |
 *
 * ⚠️ **Guardar uma versao e gravar conteudo, e isso tem consequencia.** No
 * legado, `_wp_put_post_revision()` chama `wp_insert_post()`, logo criar uma
 * versao dispara **todos** os pontos de extensao do caminho de gravacao
 * (`wp_insert_post_data`, `save_post`, `wp_insert_post`, `wp_after_insert_post`
 * …) para a **linha da versao**. O cabecalho de `../armazenamento/conteudo.ts`
 * ja registrou isso ao explicar por que o repositorio nao os emite. Esta tarefa
 * **nao** reimplementa `wp_insert_post()`: ela a recebe por
 * {@link GravacaoNaVersao}, de ligacao tardia, e e por isso que
 * {@link GravacaoNaVersao.inserir} devolve erro **como valor** — e assim que
 * `wp_insert_post( $post, true )` devolve `WP_Error`, e e o que
 * `_wp_put_post_revision()` repassa ao chamador.
 *
 * ---
 *
 * # O que NAO esta neste contexto, e cada um tem motivo
 *
 * 1. **O relogio.** Nenhuma funcao deste caminho le o tempo:
 *    `_wp_post_revision_data()` copia `post_modified` e `post_modified_gmt` do
 *    **original** para `post_date` e `post_date_gmt` da versao
 *    (`wp-includes/revision.php:92`-`:93`), e quem resolve a data da linha nova
 *    e `wp_insert_post()`. Pedir a porta de relogio aqui convidaria a carimbar a
 *    versao com a hora corrente, que e **efeito no banco** e nao e o do legado.
 * 2. **O cache de objeto.** Nao ha cache nesta arvore (REQ-165 ficou fora do
 *    pacote), e a divergencia esta declarada no README do modulo. Ela custa
 *    leituras repetidas neste caminho, contadas uma a uma no cabecalho de
 *    `guardar-versao.ts`.
 * 3. **A trava de edicao e o nonce.** A tela de restauracao do legado confere as
 *    duas antes de restaurar (`wp-admin/revision.php:57` e `:62`), e nenhuma e
 *    desta feature: a trava e do editor e o nonce e de `plataforma/`. Ficam
 *    declaradas em `restaurar-versao.ts`, na posicao exata do fluxo.
 * 4. **A sanitizacao do corpo.** REQ-030 esta fora do pacote. Este caminho
 *    **copia** o corpo de uma linha de `posts` para outra, sem interpretar o
 *    conteudo dele: o unico lugar em que ele e tocado e a comparacao de mudanca,
 *    que normaliza espaco em branco para **decidir**, e nunca para gravar.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type {
  CamposDeConteudo,
  Conteudo,
  RepositorioDeConteudo,
  RepositorioDeMetadadosDeConteudo,
  RepositorioDeVersoes,
} from '../armazenamento/index.js';
import type { ConstantesDeVersao } from './configuracao-de-versoes.js';

/**
 * O que as operacoes de versao leem e gravam do armazenamento de T002.
 *
 * **As tres**, e nao so `posts`: a versao e linha de `posts` (`conteudo`), a
 * leitura pela auto-referencia tem nome proprio (`versoes`) e o metadado
 * versionado de 6.4 e copiado em `postmeta` (`metadados`) — ver
 * `metadado-versionado.ts`.
 */
export interface ArmazenamentoNaVersao {
  readonly conteudo: RepositorioDeConteudo;
  readonly metadados: RepositorioDeMetadadosDeConteudo;
  readonly versoes: RepositorioDeVersoes;
}

/**
 * `wp_insert_post( $postarr, true )` — o identificador gerado, ou o erro como
 * valor (`wp-includes/post.php:4598`).
 *
 * O `0` e desfecho do legado e nao e erro: `wp_insert_post()` devolve `0` quando
 * a insercao falha e `$wp_error` nao foi pedido, e `_wp_put_post_revision()`
 * documenta os dois no proprio retorno — *"`WP_Error` or 0 if error, new
 * revision ID if success"*.
 */
export type ResultadoDaInsercaoDeVersao =
  | { readonly ok: true; readonly id: number }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/**
 * As tres escritas de conteudo que este caminho faz **por outra tarefa**.
 *
 * Chegam como funcoes, e nao como porta, pelo mesmo argumento de
 * `EnderecoDoConteudo` em `../publicacao/contexto-de-publicacao.ts`: sao
 * colaboracoes de ligacao tardia (AD-10). Duas sao de **T005**, a gravacao
 * (US-2), e uma e da **feature 005**, a exclusao em sete etapas — e nenhuma das
 * tres existe nesta arvore, logo nenhuma e implementada aqui.
 *
 * **Reimplementa-las aqui seria construir meia US-2.** O caminho de gravacao
 * resolve 21 defaults de coluna, cobra a unicidade do identificador na URL
 * (dispensada em revisao, BR-MIGRAR-005), compara data para decidir estado e
 * dispara quatro pontos de extensao. Nada disso e de US-10, e tudo isso acontece
 * quando uma versao e criada.
 */
export interface GravacaoNaVersao {
  /**
   * `wp_insert_post( $revisao, true )` (`wp-includes/revision.php:372`).
   *
   * Recebe os campos **parciais** da versao, e isso e do legado:
   * `_wp_post_revision_data()` devolve nove chaves de 21
   * (`wp-includes/revision.php:75`-`:94`), e quem resolve as outras doze —
   * `post_author` entre elas — e `wp_insert_post()`. Ver a armadilha do autor no
   * cabecalho de `../armazenamento/versao.ts`.
   */
  inserir(campos: CamposDeConteudo): ResultadoDaInsercaoDeVersao;

  /**
   * `wp_update_post( $update )` (`wp-includes/revision.php:500`), com o
   * `$wp_error` **de fabrica**, que e `false`.
   *
   * Por isso o retorno e `number` e nao um resultado com erro: com
   * `$wp_error = false`, `wp_update_post()` devolve `0` na falha
   * (`wp-includes/post.php:5341`), e e esse `0` que
   * `wp_restore_post_revision()` repassa. Trocar por erro com texto inventaria
   * superficie.
   *
   * ⚠️ **E esta funcao que faz a segunda metade de CA-10.4 acontecer**, e nao
   * codigo desta pasta: e a cadeia `wp_update_post()` → `wp_insert_post()` →
   * ponto `wp_after_insert_post` → {@link OUVINTES_DE_FABRICA_DA_VERSAO} que
   * cria a versao nova. Quem compoe esta funcao tem de registrar o ouvinte
   * daquele ponto, ou a restauracao grava sem versionar.
   */
  atualizar(id: number, campos: CamposDeConteudo): number;

  /**
   * `wp_delete_post( $revision->ID )` (`wp-includes/revision.php:638`), com o
   * `$force_delete` **de fabrica**, que e `false`.
   *
   * ⚠️ **E `false` e a versao e apagada de verdade de qualquer forma**, porque o
   * desvio para a lixeira do legado cobre so dois tipos: `if ( ! $force_delete
   * && ( 'post' === $post->post_type || 'page' === $post->post_type ) ... )`
   * (`wp-includes/post.php:3851`). `revision` nao esta ali, logo nao ha lixeira
   * de versao — o que o controlador REST de versoes diz com a propria mensagem,
   * *"Revisions do not support trashing"*
   * (`class-wp-rest-revisions-controller.php:514`).
   *
   * Devolve se a exclusao aconteceu, que e o `if ( $delete )` que decide se o
   * ponto `wp_delete_post_revision` dispara (`wp-includes/revision.php:640`).
   */
  apagar(id: number): boolean;
}

/**
 * Um dos ouvintes que o nucleo registra nos pontos deste caminho.
 */
export interface OuvinteDeFabricaDaVersao {
  readonly ponto: string;
  readonly ouvinte: string;
  readonly prioridade: number;
  readonly argumentos: number;
  readonly dono: string;
}

/**
 * Os **cinco** ouvintes que o **proprio nucleo** registra nos pontos deste
 * caminho, com a prioridade de cada um
 * (`wp-includes/default-filters.php:445`, `:446`, `:800`, `:803` e `:809`).
 *
 * Declarados como dado pela mesma razao de `PRIORIDADE_DO_OUVINTE_DO_NUCLEO` em
 * `../publicacao/transicao-de-estado.ts`: sem barramento nesta arvore (REQ-162
 * esta em `do-not-rewrite.md`), a prioridade e cumprida pela **posicao** no
 * fluxo, e o numero fica declarado para quem construir o barramento registrar
 * cada ouvinte no lugar certo.
 *
 * ⚠️ **Os dois primeiros sao um par com guarda cruzada, e e ele que decide
 * QUANDO a versao e gravada.** Em 6.4.0 o nucleo passou a versionar **depois**
 * de termos e metadados — *"Saves revisions for a post after all changes have
 * been made"* (`wp-includes/revision.php:99`) — e para nao versionar duas vezes
 * cada ouvinte pergunta pelo outro:
 *
 * - `wp_save_post_revision_on_insert()` desiste se `! has_action(
 *   'post_updated', 'wp_save_post_revision' )` (`:112`);
 * - `wp_save_post_revision()` desiste se `doing_action( 'post_updated' ) &&
 *   has_action( 'wp_after_insert_post', 'wp_save_post_revision_on_insert' )`
 *   (`:136`).
 *
 * Com os dois registrados — **que e a instalacao de fabrica** — a versao e
 * gravada no ponto `wp_after_insert_post`, e a chamada que chega por
 * `post_updated` nao grava nada. Um porte que versionasse em `post_updated`
 * gravaria a versao **antes** dos termos e dos metadados do conteudo, e a
 * comparacao de mudanca de metadado versionado de
 * `wp_check_revisioned_meta_fields_have_changed()` passaria a ler o estado
 * errado. E e por isso que o estado do registro chega por
 * {@link ContextoDeVersao.registro} em vez de ser presumido.
 */
export const OUVINTES_DE_FABRICA_DA_VERSAO: readonly OuvinteDeFabricaDaVersao[] =
  Object.freeze([
    Object.freeze({
      ponto: 'wp_after_insert_post',
      ouvinte: 'wp_save_post_revision_on_insert',
      prioridade: 9,
      argumentos: 3,
      dono: 'BC-01, conteudo — implementado aqui',
    }),
    Object.freeze({
      ponto: 'post_updated',
      ouvinte: 'wp_save_post_revision',
      prioridade: 10,
      argumentos: 1,
      dono: 'BC-01, conteudo — implementado aqui',
    }),
    Object.freeze({
      ponto: 'wp_save_post_revision_post_has_changed',
      ouvinte: 'wp_check_revisioned_meta_fields_have_changed',
      prioridade: 10,
      argumentos: 3,
      dono: 'BC-01, conteudo — implementado aqui',
    }),
    Object.freeze({
      ponto: '_wp_put_post_revision',
      ouvinte: 'wp_save_revisioned_meta_fields',
      prioridade: 10,
      argumentos: 2,
      dono: 'BC-01, conteudo — implementado aqui',
    }),
    Object.freeze({
      ponto: 'wp_restore_post_revision',
      ouvinte: 'wp_restore_post_revision_meta',
      prioridade: 10,
      argumentos: 2,
      dono: 'BC-01, conteudo — implementado aqui',
    }),
  ]);

/** `post_updated` — o nome do ponto que a guarda cruzada consulta. */
export const PONTO_DE_CONTEUDO_ATUALIZADO = 'post_updated';

/** `wp_after_insert_post` — o ponto em que a instalacao de fabrica versiona. */
export const PONTO_DEPOIS_DE_INSERIR_CONTEUDO = 'wp_after_insert_post';

/**
 * O estado do registro de ganchos que a guarda cruzada le — `has_action()`.
 *
 * **Omitido, valem os dois registrados**, porque e assim que uma instalacao de
 * fabrica se comporta. Nao e atalho de teste que os dois possam faltar:
 * `remove_action()` existe no legado e e superficie publicada, e o cenario
 * `@substituicao` de `09-contrato-de-extensao-por-filtro.feature` cobra
 * justamente a metade sem extensao registrada.
 */
export interface RegistroDeOuvintesDaVersao {
  /** `has_action( 'wp_after_insert_post', 'wp_save_post_revision_on_insert' )`. */
  readonly ouvinteDeInsercao: boolean;
  /** `has_action( 'post_updated', 'wp_save_post_revision' )`. */
  readonly ouvinteDeAtualizacao: boolean;
}

/** O registro de fabrica: os dois ouvintes do par estao registrados. */
export const REGISTRO_DE_FABRICA_DA_VERSAO: RegistroDeOuvintesDaVersao =
  Object.freeze({ ouvinteDeInsercao: true, ouvinteDeAtualizacao: true });

/**
 * Um campo versionavel como o legado o declara: **nome de coluna** e rotulo
 * traduzivel (`wp-includes/revision.php:31`-`:35`).
 *
 * O rotulo viaja porque ele faz parte do valor que o ponto de extensao
 * `_wp_post_revision_fields` recebe e devolve — e e o que a tela de comparacao
 * do painel usa como titulo de cada bloco
 * (`wp-admin/includes/revision.php:69`). Nenhuma decisao deste caminho le o
 * rotulo; retirar o campo da forma do ponto estreitaria o contrato publico (P2).
 */
export interface CampoVersionavel {
  /** O nome da coluna de `posts`, como a extensao o declara. */
  readonly coluna: string;
  /** O rotulo traduzivel, em ingles, que e a chave do catalogo (`EC-05`). */
  readonly rotulo: string;
}

/**
 * Os pontos de extensao que as operacoes de versao atravessam — **dez**, e
 * cinco deles mudam o resultado.
 *
 * Nomeados e opcionais pela mesma razao dos dez de `../publicacao/`: o **P2** poe
 * cada ponto no contrato publico *"com o nome, os argumentos, a ordem de disparo
 * e a capacidade de alterar o resultado que ele tem hoje"*, e o barramento que
 * os dispara nao existe nesta arvore. Ponto sem interceptador e, no legado, um
 * no-op.
 *
 * | # | ponto | tipo | onde dispara |
 * |---|---|---|---|
 * | 1 | `_wp_post_revision_fields` | **filtro** | antes de os nove nomes protegidos serem removidos (`:54`) |
 * | 2 | `wp_save_post_revision_check_for_changes` | **filtro** | decide se a comparacao de mudanca acontece (`:186`) |
 * | 3 | `wp_save_post_revision_post_has_changed` | **filtro** | decide se a versao e gravada (`:208`) |
 * | 4 | `wp_revisions_to_keep` | **filtro** | sobre o valor da constante (`:835`) |
 * | 5 | `wp_{tipo}_revisions_to_keep` | **filtro** | depois do 4, e sobrepoe os dois (`:855`) |
 * | 6 | `wp_post_revision_meta_keys` | **filtro** | a lista de metadados versionados (`:598`) |
 * | 7 | `_wp_put_post_revision` | acao | depois de a versao existir (`:387`) |
 * | 8 | `wp_save_post_revision_revisions_before_deletion` | **filtro** | sobre a lista que a poda vai cortar (`:240`) |
 * | 9 | `wp_delete_post_revision` | acao | depois de a versao ser apagada (`:649`) |
 * | 10 | `wp_restore_post_revision` | acao | depois de o conteudo ser restaurado (`:517`) |
 */
export interface GanchosDaVersao {
  /**
   * `_wp_post_revision_fields` — **filtro**, dois argumentos (`$fields`,
   * `$post`) (`wp-includes/revision.php:54`).
   *
   * ⚠️ **A ordem e a regra, e ela derrota o interceptador em nove nomes.** O
   * legado aplica este filtro e **depois** remove `ID`, `post_name`,
   * `post_parent`, `post_date`, `post_date_gmt`, `post_status`, `post_type`,
   * `comment_count` e `post_author` da lista, com o comentario *"WP uses these
   * internally either in versioning or elsewhere - they cannot be versioned"*
   * (`:57`). Logo declarar um dos nove aqui **nao** o versiona. Os nove estao em
   * `COLUNAS_NAO_VERSIONAVEIS`, em `../armazenamento/versao.ts`.
   *
   * ⚠️ **No legado a lista de fabrica e `static`**, montada uma vez por
   * requisicao e **reatribuida com o valor filtrado** (`:23` e `:54`): a partir
   * da segunda chamada, o ponto recebe o que ele mesmo devolveu antes. Nao e
   * reproduzido aqui porque estado de modulo e exatamente o que `EXT-CONTEXTO`
   * (BR-MIGRAR-105) proibe, e porque um filtro idempotente — que e o caso de
   * todo filtro que acrescenta ou remove nome — produz o mesmo resultado nas
   * duas formas. A divergencia cabe em uma linha: um interceptador que
   * **acumulasse** (acrescentar um nome novo a cada chamada) cresceria no legado
   * e nao aqui. Fica declarada, e nao resolvida: resolve-la seria decidir pela
   * memoizacao em contexto de requisicao, que e do barramento.
   */
  readonly filtrarCamposVersionaveis?: (
    campos: readonly CampoVersionavel[],
    conteudo: Conteudo,
  ) => readonly CampoVersionavel[];

  /**
   * `wp_save_post_revision_check_for_changes` — **filtro**, tres argumentos
   * (`$check_for_changes`, `$latest_revision`, `$post`), de fabrica `true`
   * (`wp-includes/revision.php:186`).
   *
   * Devolver falso faz o legado gravar versao **mesmo sem mudanca nenhuma** —
   * *"This filter can override that so a revision is saved even if nothing has
   * changed"*.
   */
  readonly filtrarConferirMudanca?: (
    conferir: boolean,
    ultimaVersao: Conteudo,
    conteudo: Conteudo,
  ) => boolean;

  /**
   * `wp_save_post_revision_post_has_changed` — **filtro**, tres argumentos
   * (`$post_has_changed`, `$latest_revision`, `$post`)
   * (`wp-includes/revision.php:208`).
   *
   * ⚠️ **Este interceptador entra DEPOIS do ouvinte do nucleo.**
   * `wp_check_revisioned_meta_fields_have_changed()` esta registrado aqui com
   * prioridade 10 (`default-filters.php:800`) e `add_filter` sem prioridade
   * entra em 10 tambem, logo o do nucleo — registrado no arranque — corre
   * primeiro. O valor que chega a este interceptador **ja** carrega a resposta
   * sobre metadado versionado. Ver `metadado-versionado.ts`.
   *
   * O legado coage o retorno com `(bool)`, e e por isso que o tipo aqui e
   * `boolean` e nao `unknown`.
   */
  readonly filtrarConteudoMudou?: (
    mudou: boolean,
    ultimaVersao: Conteudo,
    conteudo: Conteudo,
  ) => boolean;

  /**
   * `wp_revisions_to_keep` — **filtro**, dois argumentos (`$num`, `$post`)
   * (`wp-includes/revision.php:835`).
   *
   * *"Overrides the value of WP_POST_REVISIONS"* — e e por isso que o numero de
   * fabrica e um **default filtravel** e nao uma garantia (P2).
   */
  readonly filtrarQuantasVersoesGuardar?: (
    quantas: number,
    conteudo: Conteudo,
  ) => number;

  /**
   * `wp_{$post->post_type}_revisions_to_keep` — **filtro**, dois argumentos,
   * **nome dinamico** (`wp-includes/revision.php:855`).
   *
   * *"Overrides both the value of WP_POST_REVISIONS and the
   * `wp_revisions_to_keep` filter"*, e nao por autoridade: por **posicao**,
   * porque corre depois. Recebe o nome montado junto para que quem registrar o
   * barramento nao o remonte diferente.
   */
  readonly filtrarQuantasVersoesGuardarDoTipo?: (
    ponto: string,
    quantas: number,
    conteudo: Conteudo,
  ) => number;

  /**
   * `wp_post_revision_meta_keys` — **filtro**, dois argumentos (`$keys`,
   * `$post_type`) (`wp-includes/revision.php:598`).
   */
  readonly filtrarChavesDeMetadadoVersionado?: (
    chaves: readonly string[],
    tipo: string,
  ) => readonly string[];

  /**
   * `_wp_put_post_revision` — **acao**, dois argumentos (`$revision_id`,
   * `$post_id`) (`wp-includes/revision.php:387`).
   *
   * ⚠️ Entra **depois** do ouvinte do nucleo, `wp_save_revisioned_meta_fields()`
   * em prioridade 10 (`default-filters.php:803`): o que este interceptador ve e
   * uma versao cujo metadado versionado ja foi copiado.
   *
   * O segundo argumento e `$post['post_parent']` da **linha da versao**, isto e,
   * o identificador do conteudo original — e nao o da versao.
   */
  readonly aoGuardarVersao?: (versaoId: number, conteudoId: number) => void;

  /**
   * `wp_save_post_revision_revisions_before_deletion` — **filtro**, dois
   * argumentos (`$revisions`, `$post_id`) (`wp-includes/revision.php:240`).
   *
   * ⚠️ **A lista chega em ordem CRESCENTE de data**, porque a consulta da poda
   * pede `'order' => 'ASC'` (`:229`), e e a posicao na lista que decide o que
   * sai: o legado corta `array_slice( $revisions, 0, $delete )`. Um
   * interceptador que reordenasse a lista mudaria **quais** versoes somem.
   */
  readonly filtrarVersoesAntesDaExclusao?: (
    versoes: readonly Conteudo[],
    conteudoId: number,
  ) => readonly Conteudo[];

  /**
   * `wp_delete_post_revision` — **acao**, dois argumentos (`$revision_id`,
   * `$revision`) (`wp-includes/revision.php:649`).
   *
   * So dispara quando a exclusao aconteceu: `if ( $delete )` (`:640`).
   */
  readonly aoApagarVersao?: (versaoId: number, versao: Conteudo) => void;

  /**
   * `wp_restore_post_revision` — **acao**, dois argumentos (`$post_id`,
   * `$revision['ID']`) (`wp-includes/revision.php:517`).
   *
   * ⚠️ Entra **depois** do ouvinte do nucleo, `wp_restore_post_revision_meta()`
   * em prioridade 10 (`default-filters.php:809`), que **apaga** o metadado
   * versionado do conteudo e o recopia da versao.
   */
  readonly aoRestaurarVersao?: (conteudoId: number, versaoId: number) => void;
}

/**
 * O contexto de uma operacao de versao.
 *
 * {@link ContextoDeVersao.base} e {@link ContextoDeVersao.ator} chegam separados
 * de proposito, como em `../publicacao/contexto-de-publicacao.ts`: a base e o
 * que nao muda dentro da requisicao e o ator e quem age.
 */
export interface ContextoDeVersao {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /**
   * Quem age — e nesta tarefa ele decide **dado gravado**, nao so permissao.
   *
   * ⚠️ Duas escritas o leem: `post_author` da linha da versao, que
   * `wp_insert_post()` resolve com `get_current_user_id()` porque `post_author`
   * e um dos nove nomes que o legado **se recusa** a copiar do original (ver o
   * cabecalho de `../armazenamento/versao.ts`); e o metadado `_edit_last`, que a
   * restauracao grava (`wp-includes/revision.php:507`).
   */
  readonly ator: AtorDeAutorizacao;

  readonly armazenamento: ArmazenamentoNaVersao;
  readonly gravacao: GravacaoNaVersao;

  /**
   * `post_type_supports( $tipo, 'revisions' )`.
   *
   * O registro de tipos e `plataforma/tipos-de-conteudo/`, que **nao existe
   * nesta arvore** — mesma fronteira que `tipoDeConteudo` em
   * `../publicacao/contexto-de-publicacao.ts` nomeia. Chega como pergunta, e nao
   * como objeto de tipo, porque e so isto que este caminho pergunta ao
   * registro: ele nao le capacidade, nao le rotulo e nao le visibilidade.
   *
   * ⚠️ **Nao ha default**, e a ausencia dele e deliberada: presumir `true`
   * versionaria tipo que o legado nao versiona, e presumir `false` desligaria o
   * versionamento de `post` e de `page`, que o legado registra com suporte
   * (`wp-includes/post.php:49` e `:84`).
   */
  readonly suportaVersao: (tipo: string) => boolean;

  /**
   * As chaves de metadado que o registro declarou com `revisions_enabled`
   * (`register_meta`, `wp-includes/meta.php:1452`).
   *
   * **Omitida, a lista e vazia**, e isso e um estado do legado e nao um atalho:
   * o default de `register_meta` e `'revisions_enabled' => false`, logo um tipo
   * sem nenhum metadado declarado produz lista vazia e todo este ramo e um
   * no-op. Ver a nota sobre `footnotes` em `metadado-versionado.ts`.
   */
  readonly metadadosVersionados?: (tipo: string) => readonly string[];

  /** `WP_POST_REVISIONS`. Omitida, vale o valor de fabrica. */
  readonly constantes?: ConstantesDeVersao;

  /** `has_action()`. Omitido, valem os dois ouvintes do par registrados. */
  readonly registro?: RegistroDeOuvintesDaVersao;

  /**
   * `doing_action()` — o ponto que esta em curso, quando algum esta.
   *
   * Existe por uma guarda so, e ela e a do par: `doing_action( 'post_updated' )`
   * (`wp-includes/revision.php:136`).
   */
  readonly pontoEmCurso?: string;

  /**
   * `defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE` — a constante que o
   * salvamento automatico define na requisicao
   * (`wp-admin/includes/post.php:2155`).
   *
   * ⚠️ **E a primeira guarda de `wp_save_post_revision()`** (`:131`): durante um
   * salvamento automatico nenhuma versao comum e gravada. O rascunho automatico
   * tem caminho proprio — `_wp_put_post_revision( $post_data, true )`
   * (`wp-admin/includes/post.php:2022`) —, e e **T023** (US-11).
   */
  readonly salvamentoAutomaticoEmCurso?: boolean;

  readonly ganchos?: GanchosDaVersao;
}
