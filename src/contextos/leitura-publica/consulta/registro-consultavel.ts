/**
 * Os registros de tipo de conteudo e de taxonomia, **como esta feature os le** —
 * o `get_post_types( array(), 'objects' )` e o
 * `get_taxonomies( array(), 'objects' )` que `WP::parse_request()` percorre em
 * `wp-includes/class-wp.php:313` e `:357`, e que `WP_Query::parse_query()` le de
 * novo em `wp-includes/class-wp-query.php:1004` e `:1191`.
 *
 * Entrega de **T003** (US-1, CA-1.1 e CA-1.4). T002 nomeou as quatro coisas que
 * faltavam na coleta de criterios e tres delas dependem destes dois registros;
 * a quarta, a colisao de identificador numerico, esta em
 * `../traducao-de-endereco/colisao-de-identificador-numerico.ts`.
 *
 * ---
 *
 * ## Por que estes registros chegam por argumento, e nao por `import`
 *
 * O dono deles e `plataforma/tipos-de-conteudo`, que **nao existe nesta arvore**
 * — a mesma ausencia que `contextos/conteudo/publicacao/contexto-de-publicacao.ts`
 * registra para `get_post_type_object()`. Logo eles sao **ligacao tardia**, como
 * o `PaginaNoCaminho` que T002 declarou: chegam no contexto da operacao e nunca
 * como estado de modulo, porque a lista de tipos registrados e escopo de
 * REQUISICAO (BR-MIGRAR-105, `EXT-CONTEXTO`) — `register_post_type()` roda no
 * arranque de cada requisicao e um ponto de extensao pode acrescentar tipo.
 *
 * ⚠️ **Registro ausente nao e registro vazio com outro nome, e aqui os dois
 * coincidem de proposito.** Com {@link REGISTRO_SEM_TIPOS}, nenhum nome de
 * criterio de tipo de conteudo e reconhecido e nenhum `post_type` sobrevive ao
 * filtro de visibilidade de `class-wp.php:377-387` — que e exatamente o que o
 * legado faz numa instalacao em que nenhum tipo foi registrado. Os cinco tipos
 * de fabrica (`post`, `page`, `attachment`, `revision`, `nav_menu_item`) nao
 * estao transcritos aqui porque quem os declara e `register_post_type()`, no
 * arranque, e a ordem do arranque e contrato publico (BR-MIGRAR-106): declarar
 * uma copia deles aqui seria este modulo decidir o arranque de outro.
 */

/**
 * Um tipo de conteudo, nos campos que a leitura publica consulta.
 *
 * Cinco campos, e cada um decide uma linha do legado:
 *
 * | campo | onde decide |
 * |---|---|
 * | `nome` | o valor que `post_type` recebe (`class-wp.php:315`) |
 * | `criterioProprio` | se o tipo tem nome de criterio, e qual (`:314` e `:315`) |
 * | `consultavelPublicamente` | o filtro de `:378` e metade de `is_post_type_viewable()` |
 * | `interno` e `publico` | a outra metade de `is_post_type_viewable()` (`post.php:2460`) |
 * | `temArquivo` | `is_post_type_archive` em `class-wp-query.php:1005` |
 */
export interface TipoDeConteudoConsultavel {
  /** `$post_type` — a chave do registro, e o valor que `post_type` recebe. */
  readonly nome: string;
  /**
   * `$t->query_var` — o nome de criterio proprio do tipo, ou texto vazio.
   *
   * O legado testa `&& $t->query_var` (`class-wp.php:314`), logo texto vazio
   * tira o tipo do mapa de criterios: `attachment` e `revision` entram no
   * registro e **nao** entram no mapa.
   */
  readonly criterioProprio: string;
  /** `$t->publicly_queryable`. */
  readonly consultavelPublicamente: boolean;
  /**
   * `$t->_builtin` — se o tipo e de fabrica.
   *
   * O nome do legado tem o sublinhado de propriedade interna, e ele importa:
   * `is_post_type_viewable()` e `publicly_queryable || ( _builtin && public )`
   * (`wp-includes/post.php:2460`), ou seja um tipo de fabrica publico e visivel
   * **mesmo sem** `publicly_queryable`.
   */
  readonly interno: boolean;
  /** `$t->public`. */
  readonly publico: boolean;
  /**
   * `$post_type_obj->has_archive` — se o tipo tem pagina de arquivo.
   *
   * No legado e `string|bool`, e o teste e `! empty()`
   * (`class-wp-query.php:1005`): texto vazio e `false` valem o mesmo.
   */
  readonly temArquivo: boolean;
}

/**
 * Uma taxonomia, nos campos que a leitura publica consulta.
 *
 * `hierarquicaNoEndereco` e o `$t->rewrite['hierarchical']` que
 * `parse_tax_query` testa antes de reduzir o valor ao ultimo segmento do caminho
 * (`class-wp-query.php:1202-1204`) — e e por isso que `/pai/filho/` numa
 * taxonomia hierarquica consulta o termo `filho`.
 */
export interface TaxonomiaConsultavel {
  /** `$taxonomy` — a chave do registro. */
  readonly nome: string;
  /** `$t->query_var`, ou texto vazio quando a taxonomia nao tem criterio. */
  readonly criterioProprio: string;
  /** `$t->publicly_queryable`. */
  readonly consultavelPublicamente: boolean;
  /** `! empty( $t->rewrite['hierarchical'] )`. */
  readonly hierarquicaNoEndereco: boolean;
}

/**
 * De onde vem a lista de tipos de conteudo registrados.
 *
 * Funcao, e nao valor, pela mesma razao de `FonteDeRegrasDeTraducao`: o legado
 * chama `get_post_types()` naquela posicao do fluxo, e a lista pode ter mudado
 * desde o arranque.
 *
 * ⚠️ **A ordem e a do registro**, que no legado e a ordem de insercao do arranjo
 * `$wp_post_types`. Ela e observavel: dois tipos que declarem o **mesmo**
 * `query_var` colidem no mapa de `class-wp.php:315`, e vence o ultimo.
 */
export type RegistroDeTiposDeConteudo = () => readonly TipoDeConteudoConsultavel[];

/** De onde vem a lista de taxonomias registradas, com a ordem do registro. */
export type RegistroDeTaxonomias = () => readonly TaxonomiaConsultavel[];

/** O registro de uma instalacao em que nenhum tipo de conteudo foi declarado. */
export const REGISTRO_SEM_TIPOS: RegistroDeTiposDeConteudo = () => [];

/** O registro de uma instalacao em que nenhuma taxonomia foi declarada. */
export const REGISTRO_SEM_TAXONOMIAS: RegistroDeTaxonomias = () => [];

/** Um registro fixo de tipos de conteudo, na ordem recebida. */
export function registroDeTipos(
  tipos: readonly TipoDeConteudoConsultavel[],
): RegistroDeTiposDeConteudo {
  const fixo = Object.freeze([...tipos]);
  return () => fixo;
}

/** Um registro fixo de taxonomias, na ordem recebida. */
export function registroDeTaxonomias(
  taxonomias: readonly TaxonomiaConsultavel[],
): RegistroDeTaxonomias {
  const fixo = Object.freeze([...taxonomias]);
  return () => fixo;
}

/**
 * `is_post_type_viewable()` (`wp-includes/post.php:2447-2477`).
 *
 * A conta e `publicly_queryable || ( _builtin && public )` (`:2460`). O ponto de
 * extensao `is_post_type_viewable` fica de fora desta funcao e nao e lacuna: o
 * legado exige `true ===` do retorno dele — *"Non-boolean values (even falsey
 * and truthy values) will result in the function returning false"* —, e quem
 * alimenta ponto de extensao neste modulo e o chamador, por argumento, enquanto
 * `plataforma/barramento/` nao existe.
 */
export function tipoDeConteudoVisivel(tipo: TipoDeConteudoConsultavel): boolean {
  return tipo.consultavelPublicamente || (tipo.interno && tipo.publico);
}

/**
 * O mapa de nome de criterio para nome de tipo de conteudo —
 * `$post_type_query_vars` de `wp-includes/class-wp.php:313-317`.
 *
 * Monta-se **antes** do laco da coleta, e a condicao e dupla: o tipo tem de ser
 * visivel **e** ter nome de criterio proprio.
 */
export function criteriosDeTipoDeConteudo(
  registro: RegistroDeTiposDeConteudo,
): ReadonlyMap<string, string> {
  const mapa = new Map<string, string>();
  for (const tipo of registro()) {
    if (tipoDeConteudoVisivel(tipo) && tipo.criterioProprio !== '') {
      mapa.set(tipo.criterioProprio, tipo.nome);
    }
  }
  return mapa;
}

/**
 * Os nomes dos tipos de conteudo consultaveis publicamente —
 * `get_post_types( array( 'publicly_queryable' => true ) )` de
 * `wp-includes/class-wp.php:378`.
 *
 * ⚠️ Este filtro **nao** e `is_post_type_viewable()`: ele le so
 * `publicly_queryable`. A diferenca e observavel — um tipo de fabrica publico
 * sem `publicly_queryable` e *visivel* e **nao** e *consultavel*, e o
 * `post_type` dele e descartado dos criterios em `:382`.
 */
export function tiposConsultaveisPublicamente(
  registro: RegistroDeTiposDeConteudo,
): readonly string[] {
  return registro()
    .filter((tipo) => tipo.consultavelPublicamente)
    .map((tipo) => tipo.nome);
}
