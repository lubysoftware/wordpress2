/**
 * O **tipo de conteudo proprio** do conjunto de alteracoes, transcrito do
 * registro do legado — e a resolucao de capacidade que esse registro produz.
 *
 * Primeira metade da entrega de **T002** da feature
 * `009-apresentacao-e-personalizacao`: *"o conjunto de alteracoes existe como
 * tipo de conteudo proprio"*. A fonte e uma so e esta inteira em
 * `wp-includes/post.php:220`-`:264`, dentro de `create_initial_post_types()`.
 *
 * ## Por que a declaracao e DADO, e nao chamada de funcao
 *
 * Porque `register_post_type()` e caminho de `BC-01` e a regra de dependencia 3
 * proibe o `import` *"sempre, sem excecao"*. O que este arquivo entrega e a
 * **declaracao**, que e dado, para que a tarefa que a registrar a passe por
 * ligacao tardia (AD-10) ao registro de tipos de `BC-01` — `REG-TipoDeConteudo`
 * em `target_domain_model.md`, *"dividido de `posts-e-tipos-de-conteudo`"*. E a
 * mesma forma que `anexo.ts` de BC-04 usou para o pedido de insercao: *"isto e a
 * forma do pedido, nao de uma escrita deste repositorio"*.
 *
 * ⚠️ **A ordem de arranque importa aqui.** `create_initial_post_types()` roda no
 * arranque, antes de qualquer consulta, e `BR-MIGRAR-106` (`EXT-ORDEM`) poe a
 * ordem de carregamento em contrato publico — a tabela *Nao negociavel* da
 * constituicao lista *"mudar a ordem de carregamento do arranque"* entre as
 * decisoes que exigem humano. Por isso **nada aqui se registra sozinho**: a
 * constante e lida por quem monta o arranque, no momento em que ele monta.
 *
 * ## O que a declaracao diz, e o que cada campo custa se for "corrigido"
 *
 * | campo | valor | o que ele decide |
 * |---|---|---|
 * | `public` | `false` | o conjunto nao tem URL publica, nao aparece em consulta de visitante e nao tem tela de listagem |
 * | `_builtin` | `true` | e do nucleo; o proprio legado marca o campo como *"internal use only"* |
 * | `map_meta_cap` | `true` | a autorizacao sobre **objeto** e traduzida, e e isso que permite a concessao por filtro de UC-29 |
 * | `hierarchical` | `false` | nao usa `post_parent` — o conjunto nao tem pai, e a revisao de salvamento automatico usa a coluna por outro caminho (`class-wp-customize-manager.php:1131`-`:1134`) |
 * | `rewrite` / `query_var` | `false` | nao entra no roteamento nem na cadeia de consulta |
 * | `can_export` | `false` | **nao** sai na exportacao (UC-38), diferente de `custom_css`, que sai |
 * | `delete_with_user` | `false` | apagar a conta **nao** apaga o conjunto dela: ele fica orfao, e orfao e estado normal (**P5**) |
 * | `supports` | `title`, `author` | e de onde vem *"herdar autor"* de `spec.md`; e a **ausencia** de `revisions` e o que manda o conjunto aplicado para a lixeira (ver `estado-do-conjunto.ts`) |
 * | `capability_type` | `customize_changeset` | a base de que sairiam as 14 capacidades default — e **nenhuma delas sobrevive**, ver abaixo |
 *
 * `delete_with_user => false` merece a linha inteira do **P5**: *"mantenha, no
 * modelo novo, exatamente o que desaparece e o que fica orfao quando um registro
 * e apagado"*. Nenhuma chave estrangeira pode ser declarada aqui que mude isso.
 *
 * ## 🔴 As 15 capacidades, e por que a matriz de papeis nao basta
 *
 * O registro declara **15** capacidades e o legado resolveria **14** a partir de
 * `capability_type` (`get_post_type_capabilities()`, `wp-includes/post.php:2034`-`:2081`).
 * Como as 14 estao todas declaradas explicitamente, **nenhum default sobrevive**:
 * a resolucao e identica a declaracao, mais `create_posts`, que tambem esta
 * declarada. {@link capacidadesResolvidasDoConjunto} reproduz a fusao e
 * `armazenamento.test.ts` afirma que ela nao muda nada — e se um dia mudar, e
 * porque alguem mexeu na declaracao.
 *
 * Doze das quinze apontam para `customize`, uma para `read` e **uma para
 * `do_not_allow`**:
 *
 * - `read => 'read'` e a capacidade que todo mundo tem;
 * - `edit_published_posts => 'do_not_allow'` e a unica negacao, e e coerente com
 *   o ciclo de vida: depois de aplicado, o conjunto nao se edita — ele vai para a
 *   lixeira.
 *
 * ⚠️ **`customize` nao esta em papel algum como capacidade primitiva**: ela e
 * meta-capacidade, e `BR-MIGRAR-092` (`PERM-6`) a lista entre os *"dez atalhos
 * de nomenclatura"* — *"`customize` → `edit_theme_options`"*. E a **capacidade
 * de editar o conjunto** e concedida em execucao, por filtro
 * (`grant_edit_post_capability_for_changeset()`,
 * `class-wp-customize-manager.php:3239`, registrado em `:2966`). UC-29 diz o
 * preco de ignorar isso: *"quem migrar pela matriz de papeis produz um sistema em
 * que ninguem salva"*.
 *
 * **Nada disso e decidido aqui, e nao e por omissao:** a decisao de capacidade e
 * de `plataforma/autorizacao` (feature `001`), a traducao de `customize` e
 * `BR-MIGRAR-092`, e o mecanismo de concessao por filtro ja existe, merged, em
 * `plataforma/autorizacao/concessao-por-extensao.ts` (T019 da feature `001`).
 * `../README.md` registra a divisao: *"quem pegar **T005** declara a concessao
 * ali, e nao inventa uma matriz paralela aqui"*. O que este arquivo entrega e o
 * **nome** de cada capacidade do tipo, que e o que falta para aquela declaracao
 * poder ser escrita.
 *
 * ## Os rotulos
 *
 * Os 11 rotulos sao transcritos com o **texto de origem** que `__()` e `_x()`
 * recebem (`post.php:224`-`:234`), e nao traduzidos: o catalogo de traducao e
 * trabalho da feature `015` (T009), e `_x( 'Changesets', 'post type general
 * name' )` carrega **contexto** de traducao, que e parte da chave e nao
 * comentario. `get_post_type_labels()` preenche outros tantos por default, em
 * `BC-01`; o que esta aqui e o que o registro passa.
 */

/** Um rotulo declarado, com o contexto de traducao quando ha um. */
export interface RotuloDeclarado {
  /** O texto de origem, exatamente como `__()`/`_x()` o recebe. */
  readonly texto: string;
  /** O contexto de `_x()`, ausente quando a chamada e `__()`. */
  readonly contexto?: string;
}

/** A declaracao de um tipo de conteudo, na forma em que o legado a passa. */
export interface TipoDeConteudoDeclarado {
  /** O primeiro argumento de `register_post_type()`. */
  readonly nome: string;
  readonly rotulos: Readonly<Record<string, RotuloDeclarado>>;
  /** `public`. */
  readonly publico: boolean;
  /** `_builtin`. */
  readonly doNucleo: boolean;
  /** `map_meta_cap`. */
  readonly traduzCapacidadeSobreObjeto: boolean;
  /** `hierarchical`. */
  readonly hierarquico: boolean;
  /** `rewrite`. */
  readonly reescritaDeEndereco: boolean;
  /** `query_var`. */
  readonly variavelDeConsulta: boolean;
  /** `can_export`. */
  readonly exportavel: boolean;
  /** `delete_with_user`. */
  readonly apagaComAConta: boolean;
  /** `supports`, na ordem do legado. */
  readonly suporta: readonly string[];
  /** `capability_type`. */
  readonly baseDeCapacidade: string;
  /** `capabilities`, na ordem do legado. */
  readonly capacidades: Readonly<Record<string, string>>;
}

/**
 * O registro de `customize_changeset`, transcrito campo por campo de
 * `wp-includes/post.php:220`-`:264`.
 *
 * Nenhum campo foi acrescentado e nenhum foi omitido: o que nao esta aqui nao
 * esta la. Em particular **nao** ha `show_ui`, `show_in_menu`, `show_in_rest`,
 * `rest_base` nem `labels` de lista — e a ausencia de `show_in_rest` e o que
 * mantem o conjunto fora da API REST, diferente de `nav_menu_item` e de
 * `wp_global_styles`, que a declaram.
 */
export const TIPO_DECLARADO_DO_CONJUNTO: TipoDeConteudoDeclarado = {
  nome: 'customize_changeset',
  rotulos: {
    name: { texto: 'Changesets', contexto: 'post type general name' },
    singular_name: { texto: 'Changeset', contexto: 'post type singular name' },
    add_new: { texto: 'Add Changeset' },
    add_new_item: { texto: 'Add Changeset' },
    new_item: { texto: 'New Changeset' },
    edit_item: { texto: 'Edit Changeset' },
    view_item: { texto: 'View Changeset' },
    all_items: { texto: 'All Changesets' },
    search_items: { texto: 'Search Changesets' },
    not_found: { texto: 'No changesets found.' },
    not_found_in_trash: { texto: 'No changesets found in Trash.' },
  },
  publico: false,
  doNucleo: true,
  traduzCapacidadeSobreObjeto: true,
  hierarquico: false,
  reescritaDeEndereco: false,
  variavelDeConsulta: false,
  exportavel: false,
  apagaComAConta: false,
  suporta: ['title', 'author'],
  baseDeCapacidade: 'customize_changeset',
  capacidades: {
    create_posts: 'customize',
    delete_others_posts: 'customize',
    delete_post: 'customize',
    delete_posts: 'customize',
    delete_private_posts: 'customize',
    delete_published_posts: 'customize',
    edit_others_posts: 'customize',
    edit_post: 'customize',
    edit_posts: 'customize',
    edit_private_posts: 'customize',
    edit_published_posts: 'do_not_allow',
    publish_posts: 'customize',
    read: 'read',
    read_post: 'customize',
    read_private_posts: 'customize',
  },
};

/**
 * `get_post_type_capabilities()` (`wp-includes/post.php:2034`-`:2081`), para uma
 * declaracao.
 *
 * A fusao e: **oito** defaults a partir da base singular/plural, mais **seis**
 * que `map_meta_cap` acrescenta, sobrescritos pelas capacidades declaradas, e
 * `create_posts` caindo em `edit_posts` quando nao esta declarada. A base plural
 * e a singular com `s` no fim (`:2036`) — `customize_changeset` e
 * `customize_changesets` —, porque a declaracao passa uma cadeia e nao um par.
 *
 * ⚠️ O que esta funcao **nao** faz: registrar as meta-capacidades no mapa global
 * (`_post_type_meta_capabilities()`, `:2077`). Esse mapa e o que a traducao de
 * capacidade sobre objeto consulta, e ele mora em `plataforma/autorizacao`, nao
 * aqui.
 */
export function capacidadesResolvidas(
  declaracao: TipoDeConteudoDeclarado,
): Readonly<Record<string, string>> {
  const singular = declaracao.baseDeCapacidade;
  const plural = `${declaracao.baseDeCapacidade}s`;

  const defaults: Record<string, string> = {
    // Capacidades sobre objeto (`post.php:2044`-`:2046`).
    edit_post: `edit_${singular}`,
    read_post: `read_${singular}`,
    delete_post: `delete_${singular}`,
    // Primitivas usadas fora da traducao (`:2048`-`:2052`).
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    delete_posts: `delete_${plural}`,
    publish_posts: `publish_${plural}`,
    read_private_posts: `read_private_${plural}`,
  };

  if (declaracao.traduzCapacidadeSobreObjeto) {
    // Primitivas usadas DENTRO da traducao (`post.php:2057`-`:2064`).
    Object.assign(defaults, {
      read: 'read',
      delete_private_posts: `delete_private_${plural}`,
      delete_published_posts: `delete_published_${plural}`,
      delete_others_posts: `delete_others_${plural}`,
      edit_private_posts: `edit_private_${plural}`,
      edit_published_posts: `edit_published_${plural}`,
    });
  }

  const resolvidas: Record<string, string> = {
    ...defaults,
    ...declaracao.capacidades,
  };

  // `if ( ! isset( $capabilities['create_posts'] ) ) { ... = $capabilities['edit_posts']; }`
  // (`post.php:2071`-`:2073`).
  if (resolvidas['create_posts'] === undefined) {
    resolvidas['create_posts'] = resolvidas['edit_posts'] as string;
  }

  return resolvidas;
}

/** As capacidades resolvidas do conjunto de alteracoes. */
export function capacidadesResolvidasDoConjunto(): Readonly<
  Record<string, string>
> {
  return capacidadesResolvidas(TIPO_DECLARADO_DO_CONJUNTO);
}
