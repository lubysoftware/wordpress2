/**
 * O contexto das operacoes de menu — o que elas recebem da requisicao, do tema
 * e das ligacoes tardias com os dois contextos que guardam o menu.
 *
 * Entrega de **T011** da feature `009-apresentacao-e-personalizacao` (US-5,
 * *"Montar menu de navegacao com itens que apontam para conteudo,
 * classificacao ou endereco externo"*), CA-5.1 a CA-5.5.
 *
 * ## Por que o menu chega quase todo por argumento
 *
 * UC-30 e literal: *"o menu e um termo de taxonomia, cada item e um registro de
 * conteudo, e a ligacao com o tema e uma opcao. Tres mecanismos diferentes"*.
 * Dos tres, so o terceiro e deste contexto:
 *
 * | mecanismo | o que o legado chama | dono | como chega aqui |
 * |---|---|---|---|
 * | o menu | `get_term()`, `get_term_by()`, `wp_insert_term()`, `wp_update_term()`, `is_object_in_term()`, `wp_set_object_terms()`, `get_terms()` sobre `nav_menu` | `BC-02` (o registro de `nav_menu` ja existe, merged, em `contextos/classificacao/registro/contextos-do-nucleo.ts`) | {@link ClassificacaoNosMenus} |
 * | o item | `get_post()`, `get_post_type()`, `wp_insert_post()`, `wp_update_post()`, `wp_delete_post()`, `get_posts()`, `update_post_meta()`, `get_post_meta()`, `delete_post_meta()`, `wp_resolve_post_date()`, `get_post_type_object()` | `BC-01` | {@link ConteudoNosMenus} |
 * | a ligacao com o tema | `get_theme_mod( 'nav_menu_locations' )`, `set_theme_mod()` (`wp-includes/nav-menu.php:162`-`:163`) | **este contexto** — `armazenamento/configuracao-do-tema.ts`, de T002 | {@link ContextoDosMenus.configuracaoDoTema} |
 *
 * AD-10 e a regra de dependencia 3 proibem o `import` entre contextos
 * *"sempre, sem excecao"*; e a mesma forma de `contexto-da-personalizacao.ts`
 * (T003) e de `conteudo/publicacao/contexto-de-publicacao.ts`.
 *
 * ⚠️ **Os valores chegam ja sem barra invertida de escape**, como em T003. O
 * legado recebe `$_POST` com barra e cada funcao de destino a tira
 * (`wp_insert_post()` e `update_metadata()` aplicam `wp_unslash()`); a
 * comparacao de titulo de `wp_update_nav_menu_item()` faz o mesmo de forma
 * explicita (`wp-includes/nav-menu.php:514`). Desfazer o escape e da borda; as
 * ligacoes recebem o valor ja sem ele, e nao o desfazem de novo.
 */

import type { ContextoDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type {
  RepositorioDaConfiguracaoDoTema,
  RepositorioDeOpcoes,
} from '../armazenamento/index.js';

/**
 * Um termo como `WP_Term` o expoe — o menu (`nav_menu`) ou a classificacao para
 * a qual um item aponta.
 */
export interface TermoNosMenus {
  readonly termoId: number;
  readonly termoTaxonomiaId: number;
  readonly contextoDeClassificacao: string;
  readonly nome: string;
  readonly slug: string;
  readonly descricao: string;
  readonly pai: number;
  /** `$term->count` — `wp_get_nav_menu_items()` so consulta quando e positivo. */
  readonly contagem: number;
}

/** `array( 'term_id', 'term_taxonomy_id' )` ou o `WP_Error`. */
export type ResultadoDoTermo =
  | { readonly ok: true; readonly termoId: number; readonly termoTaxonomiaId: number }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/** O `$args` que `wp_update_nav_menu_object()` monta (`nav-menu.php:318`-`:323`). */
export interface ArgumentosDoTermoDoMenu {
  readonly descricao: string;
  readonly pai: number;
  /** `'slug' => null` — o legado deixa a classificacao derivar do nome. */
  readonly slug: null;
}

/**
 * A ligacao tardia com `BC-02`.
 *
 * Cada metodo e **a funcao inteira do legado**, com as guardas dela: por
 * exemplo, `get_term_by()` com nome vazio devolve `false` sem consultar
 * (`wp-includes/taxonomy.php:1107`-`:1113`), e quem implementar a ligacao e que
 * reproduz isso, nao este contexto.
 */
export interface ClassificacaoNosMenus {
  /**
   * `get_term( $id, $contexto )`, com `WP_Term::get_instance()` por baixo: o
   * identificador ja chega convertido por `(int)`, e `0` devolve `null` sem
   * consultar (`wp-includes/class-wp-term.php:119`-`:122`). `null` tambem
   * quando o termo existe em outro contexto, ou quando o contexto nao existe
   * (o `WP_Error` de `get_term()`, que nenhum chamador daqui distingue).
   *
   * ⚠️ Com o contexto **vazio** o legado nao confere contexto nenhum
   * (`if ( $taxonomy && ! taxonomy_exists( $taxonomy ) )`) e acha o termo pelo
   * identificador, em qualquer contexto — e o caso do item `taxonomy` gravado
   * sem `menu-item-object`.
   */
  termo(id: number, contextoDeClassificacao: string): TermoNosMenus | null;
  /** `get_term_by( $campo, $valor, $contexto )`. */
  termoPor(
    campo: 'slug' | 'name',
    valor: string,
    contextoDeClassificacao: string,
  ): TermoNosMenus | null;
  /** `wp_insert_term( $nome, $contexto, $args )`. */
  inserirTermo(
    nome: string,
    contextoDeClassificacao: string,
    argumentos: ArgumentosDoTermoDoMenu & { readonly nome: string },
  ): ResultadoDoTermo;
  /** `wp_update_term( $id, $contexto, $args )`. */
  atualizarTermo(
    id: number,
    contextoDeClassificacao: string,
    argumentos: ArgumentosDoTermoDoMenu & { readonly nome: string },
  ): ResultadoDoTermo;
  /** `is_object_in_term( $objeto, $contexto, $termo )`. */
  objetoNoTermo(
    objetoId: number,
    contextoDeClassificacao: string,
    termoId: number,
  ): boolean;
  /** `wp_set_object_terms( $objeto, array( $termo ), $contexto )`. */
  definirTermosDoObjeto(
    objetoId: number,
    termoIds: readonly number[],
    contextoDeClassificacao: string,
  ): { readonly ok: true } | { readonly ok: false; readonly codigo: string; readonly mensagem: string };
  /**
   * `wp_get_nav_menus( array( 'fields' => 'ids' ) )` — `get_terms()` de
   * `nav_menu` com `hide_empty => false` e `orderby => 'name'`
   * (`wp-includes/nav-menu.php:644`-`:663`). O filtro `wp_get_nav_menus`
   * (`:662`) roda dentro da ligacao.
   */
  idsDosMenus(): readonly number[];
  /**
   * `wp_defer_term_counting( $adiar )`: a tela adia a recontagem dos termos
   * enquanto grava os itens, e a recontagem sai toda no `false`
   * (`wp-admin/includes/nav-menu.php:1437`, `:1509`). A contagem e de `BC-02`.
   */
  adiarContagem(adiar: boolean): void;
}

/** O que um item de menu le do conteudo para o qual aponta. */
export interface ConteudoReferidoNoMenu {
  readonly id: number;
  readonly tipo: string;
  readonly titulo: string;
  readonly paiId: number;
}

/**
 * Uma linha de `wp_get_nav_menu_items()`: o identificador e a ordem gravada em
 * `menu_order`. A renumeracao de 1 a n que a funcao faz **depois** da consulta
 * e deste contexto (`item-de-menu.ts`), porque e ela que decide a posicao do
 * item novo.
 */
export interface LinhaDeItemDoMenu {
  readonly id: number;
  readonly ordemNoMenu: number;
}

/**
 * O `$post` que `wp_update_nav_menu_item()` monta (`nav-menu.php:525`-`:538`,
 * `:544`-`:545`, `:608`-`:609`), com os nomes de coluna do legado.
 */
export interface PedidoDoItemDeMenu {
  readonly ID: number;
  readonly menu_order: number;
  readonly ping_status: 0;
  readonly post_content: string;
  readonly post_excerpt: string;
  readonly post_parent: number;
  readonly post_title: string;
  readonly post_type: 'nav_menu_item';
  readonly post_status: 'publish' | 'draft';
  /** Ausente quando `wp_resolve_post_date()` devolve `false` (`:535`-`:538`). */
  readonly post_date?: string;
}

/** `wp_insert_post( ..., true )` / `wp_update_post( ..., true )`. */
export type ResultadoDaGravacaoDoItem =
  | { readonly ok: true; readonly id: number }
  | { readonly ok: false; readonly codigo: string; readonly mensagem: string };

/**
 * O valor de um metadado de item: texto, ou a lista de classes, que
 * `update_post_meta()` grava serializada (`nav-menu.php:594`-`:596`).
 */
export type ValorDeMetadadoDoItem = string | readonly string[];

/** A ligacao tardia com `BC-01`. */
export interface ConteudoNosMenus {
  /** `get_post_type( $id )` — `null` quando o conteudo nao existe. */
  tipoDoConteudo(id: number): string | null;
  /** `get_post( $id )` — `null` para `0` e para o que nao existe. */
  conteudo(id: number): ConteudoReferidoNoMenu | null;
  /**
   * `get_post_type_object( $nome )->labels->archives`, ou `null` quando o tipo
   * nao esta registrado (`nav-menu.php:506`-`:511`).
   */
  rotuloDeArquivoDoTipo(nome: string): string | null;
  /**
   * A consulta de `wp_get_nav_menu_items()` (`nav-menu.php:723`-`:745`):
   * `post_type => 'nav_menu_item'`, a classificacao pelo `term_taxonomy_id` do
   * menu, `nopaging`, e os estados e a ordenacao pedidos — `menu_order` e o
   * padrao, `ID` e o que a tela usa ao gravar (`wp-admin/includes/nav-menu.php:1403`-`:1411`).
   */
  itensDoMenu(
    termoTaxonomiaId: number,
    estados: readonly string[],
    ordenarPor: 'menu_order' | 'ID',
  ): readonly LinhaDeItemDoMenu[];
  /** `wp_resolve_post_date( $data, $data_gmt )` — `false` para data invalida. */
  resolverData(data: string, dataGmt: string): string | false;
  /** `wp_insert_post( $post, true, $fire_after_hooks )`. */
  inserir(
    pedido: PedidoDoItemDeMenu,
    dispararGanchosPosteriores: boolean,
  ): ResultadoDaGravacaoDoItem;
  /** `wp_update_post( $post, true )`. */
  atualizar(pedido: PedidoDoItemDeMenu): ResultadoDaGravacaoDoItem;
  /**
   * `wp_delete_post( $id )`, sem forcar. Para `nav_menu_item` isso **apaga**:
   * a lixeira so vale para `post` e `page` (`wp-includes/post.php`, em
   * `wp_delete_post()`).
   */
  apagar(id: number): void;
  /** `update_post_meta( $id, $chave, $valor )`. */
  definirMetadado(id: number, chave: string, valor: ValorDeMetadadoDoItem): void;
  /** `get_post_meta( $id, $chave )` nao vazio — o arranjo de valores tem algum. */
  temMetadado(id: number, chave: string): boolean;
  /** `delete_post_meta( $id, $chave )`. */
  apagarMetadado(id: number, chave: string): void;
}

export interface ContextoDosMenus {
  /** Quem pergunta, e a base de autorizacao. */
  readonly autorizacao: ContextoDeAutorizacao;
  /** `get_stylesheet()` do tema ativo — a folha que nomeia `theme_mods_{folha}`. */
  readonly folhaDeEstilo: string;
  /**
   * A configuracao do tema, de T002. `nav_menu_locations` e **chave dentro**
   * de `theme_mods_{folha}`, e `nav_menu_options` e opcao propria.
   */
  readonly configuracaoDoTema: Pick<
    RepositorioDaConfiguracaoDoTema,
    'modificacao' | 'definirModificacao'
  > & {
    readonly opcoes: Pick<RepositorioDeOpcoes, 'lerComoNoLegado' | 'gravar'>;
  };
  readonly classificacao: ClassificacaoNosMenus;
  readonly conteudo: ConteudoNosMenus;
  /**
   * `get_registered_nav_menus()` (`wp-includes/nav-menu.php:149`-`:152`): as
   * posicoes que o tema declarou por `register_nav_menus()`, **na ordem do
   * registro**, com a descricao. E dado do tema, nao do banco: o registro mora
   * em global, e quem o monta e o arranque do tema.
   */
  readonly posicoesDeclaradas: readonly (readonly [string, string])[];
  /**
   * `current_theme_supports( $recurso )`. `register_nav_menus()` acrescenta
   * `menus` por conta propria (`nav-menu.php:93`), logo tema que declara posicao
   * suporta `menus`.
   */
  temaSuporta(recurso: string): boolean;
  /** `wp_verify_nonce( $valor, $acao )` — a metade de `check_admin_referer()` que decide. */
  verificarNonce(acao: string, valor: string | undefined): boolean;
  /** `sanitize_key()`. */
  sanitizarChave(valor: string): string;
  /** `sanitize_html_class()`. */
  sanitizarClasseHtml(valor: string): string;
  /** `sanitize_url()`. */
  sanitizarEndereco(valor: string): string;
  /** `esc_html()`. */
  escaparHtml(valor: string): string;
  /** `time()` — o instante que vai para `_menu_item_orphaned`. */
  agora(): number;
}

/** `empty()` do PHP sobre um campo de formulario: ausente, `''` ou `'0'`. */
export function vazioNoPhp(valor: string | undefined): boolean {
  return valor === undefined || valor === '' || valor === '0';
}

/** O prefixo numerico que `(int)` consome, com o espaco inicial que ele aceita. */
const PREFIXO_NUMERICO =
  /^[ \t\n\r\v\f]*([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)/;

/**
 * `(int) $valor`: le o prefixo numerico e para no primeiro caractere que nao
 * serve — `'12abc'` da 12, `'abc'` da 0, `'3.9'` da 3. E a gemea de
 * `inteiroComoNoPhp` de `BC-06`, repetida pela regra de dependencia 3.
 */
export function inteiroNoPhp(valor: string | number | undefined): number {
  if (valor === undefined) {
    return 0;
  }
  if (typeof valor === 'number') {
    return Math.trunc(valor);
  }
  const achado = PREFIXO_NUMERICO.exec(valor);
  if (achado === null) {
    return 0;
  }
  const numero = Number(achado[1]);
  return Number.isFinite(numero) ? Math.trunc(numero) : 0;
}

/** `absint( $valor )` — `abs( (int) $valor )` (`wp-includes/load.php:1468`). */
export function inteiroAbsolutoNoPhp(valor: string | number | undefined): number {
  return Math.abs(inteiroNoPhp(valor));
}

/** `trim()` do PHP: so espaco, tab, quebras, `\0` e `\x0B`. */
export function aparadoNoPhp(valor: string): string {
  return valor.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
}
