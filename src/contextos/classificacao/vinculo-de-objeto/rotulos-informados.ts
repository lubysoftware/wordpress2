/**
 * A lista de rotulos **como ela chega**, e o que o legado faz com cada item
 * antes de olhar o banco.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). Sao os
 * passos 1 e 3 do fluxo de UC-05 — *"Autor envia a lista de termos do
 * conteudo"*, *"Sistema cria os termos que ainda nao existem, se a taxonomia o
 * permitir ao ator"* —, e e aqui que **CA-2.2** se decide.
 *
 * | aqui | no legado |
 * |---|---|
 * | {@link normalizarRotulosDoConteudo} | `wp_set_post_terms()`, `wp-includes/post.php:5190` |
 * | {@link normalizarRotulosInformados} | o `empty`/`is_array` de `wp_set_object_terms()`, `wp-includes/taxonomy.php:2860`-`:2864` |
 * | {@link resolverRotuloInformado} | o `trim`, o `term_exists()` e o `is_int` de `wp_set_object_terms()`, `:2884`-`:2897` |
 *
 * ---
 *
 * # A normalizacao e por CONTEXTO, e isso e o que decide CA-2.2
 *
 * `wp_set_post_terms()` tem quatro linhas que mudam tudo (`post.php:5208`), com o
 * comentario do proprio legado por cima:
 *
 * ```php
 * /*
 *  * Hierarchical taxonomies must always pass IDs rather than names so that
 *  * children with the same names but different parents aren't confused.
 *  *\/
 * if ( is_taxonomy_hierarchical( $taxonomy ) ) {
 *     $terms = array_unique( array_map( 'intval', $terms ) );
 * }
 * ```
 *
 * Em **contexto hierarquico** — e `category` e o unico hierarquico dos oito do
 * nucleo — todo item vira inteiro. Um rotulo informado **por nome** vira `0`, e
 * `0` cai no `is_int` de `wp_set_object_terms()` e e **saltado sem criar nada**
 * (`taxonomy.php:2892`). E literalmente *"o rotulo desconhecido e ignorado, sem
 * criar nada"*, que e a segunda metade de **CA-2.2**.
 *
 * Em **contexto plano** o nome atravessa, e e `wp_set_object_terms()` que cria o
 * rotulo que nao existe (`:2896`), **sem verificar capacidade nenhuma**.
 *
 * # 🔴 ONDE A CAPACIDADE DE CRIAR TERMO E COBRADA NO LEGADO, E ONDE CA-2.2 A POE
 *
 * **CA-2.2** diz: *"Criar termo novo pela tela de edicao exige a capacidade de
 * criar termo daquele contexto; sem ela o rotulo desconhecido e ignorado, sem
 * criar nada"*. UC-05 repete, no passo 3 (*"exige `edit_terms` da taxonomia"*) e
 * na excecao (*"Ator sem `edit_terms` tenta criar termo novo | o termo nao e
 * criado e a atribuicao ignora o rotulo desconhecido"*).
 *
 * O que a leitura do legado mostra, por caminho:
 *
 * | caminho | onde | quem cobra |
 * |---|---|---|
 * | `wp_set_object_terms()` | `taxonomy.php:2851` | **ninguem**: nao ha `current_user_can` no corpo, e o nucleo a chama sem ator |
 * | criar categoria pela tela de edicao | `_wp_ajax_add_hierarchical_term()`, `wp-admin/includes/ajax-actions.php:613` | `$tax->cap->edit_terms`, com `wp_die( -1 )` |
 * | a propria caixa de categoria da tela | `wp-admin/includes/meta-boxes.php:676` | `$tax->cap->edit_terms` decide se o campo *"+ Adicionar"* existe |
 * | criar termo pela tela de lista | `wp_ajax_add_tag()`, `ajax-actions.php:1116` | `$tax->cap->edit_terms`, com `wp_die( -1 )` |
 * | nomear termo novo por XML-RPC | `class-wp-xmlrpc-server.php:1685` | `$tax->cap->edit_terms`, com erro 401 |
 * | a caixa de etiqueta da tela de edicao | `meta-boxes.php:582` e `:594` | `$tax->cap->assign_terms` — **e nao `edit_terms`** |
 *
 * As cinco primeiras linhas sao CA-2.2 na letra. A ultima **nao**: num contexto
 * plano, quem tem `assign_terms` cria rotulo novo digitando o nome, e
 * `assign_terms` de `post_tag` e `assign_post_tags`, que resolve para
 * `edit_posts` (`wp-includes/capabilities.php:757`-`:759`). Em papeis de fabrica
 * isso significa que **autor cria etiqueta e nao cria categoria** — `edit_terms`
 * de `post_tag` e `edit_post_tags`, que resolve para `manage_categories`
 * (`:749`-`:754`), e autor nao a tem.
 *
 * **Esta tarefa nao resolve a diferenca, e nao cobra `edit_terms` no caminho de
 * atribuicao.** Cobra-la faria o sistema novo recusar a etiqueta que o legado
 * cria para o autor, e o **P1** e a resposta 2 proibem *"recusar hoje o que o
 * legado aceita"*; a tabela *Nao negociavel* da constituicao poe mudar regra
 * documentada fora do alcance do agente. O que a tarefa faz e o que o legado faz:
 * em contexto hierarquico o nome e ignorado sem criar nada (CA-2.2 cumprido pelo
 * mecanismo do legado, e afirmado por teste), e em contexto plano a criacao
 * depende de `assign_terms`, como no legado.
 *
 * **Para quem decidir:** se a leitura certa for *"`edit_terms` tambem no caminho
 * de atribuicao"*, entra um portao em {@link resolverRotuloInformado} e **CA-2.2
 * passa a descrever um sistema mais fechado que o original** — a nota de UC-05
 * *"atribuir termo e poder de conteudo, nao de classificacao"* precisa de nova
 * redacao junto. Se for *"o legado manda"*, CA-2.2 fica como esta e vale como a
 * descricao do caminho hierarquico, que e o da tela de edicao de conteudo do tipo
 * padrao.
 *
 * # ⚠️ O ROTULO INFORMADO POR NOME NAO SE RESOLVE NESTA ARVORE
 *
 * `term_exists( $term, $taxonomy )` (`taxonomy.php:1605`) com cadeia tenta
 * **duas** consultas, nesta ordem: por apelido, com `sanitize_title( $term )`
 * (`:1663`), e por nome (`:1666`). As duas passam por `WP_Term_Query`, e
 * `sanitize_title()` **nao existe nesta arvore** — as duas ausencias foram
 * declaradas por T003 (`../rotulo-e-contexto/renomear-rotulo.ts` e
 * `resolucao-do-rotulo-no-contexto.ts`) e tem dono: T009 (US-4) e a camada de
 * dados por fragmento da feature 015 (T007). E criar o rotulo que nao existe e
 * `wp_insert_term()` (`:2458`), que e a operacao *"criar ou renomear rotulo"* da
 * tabela **Contratos** do `plan.md` e tambem e **T009**.
 *
 * Logo o item informado **por nome** chega aqui como
 * {@link ResolucaoDoRotulo} de situacao `'por-nome'`, e **nenhum comando e
 * emitido por ele**. A consequencia esta declarada, e e visivel por teste:
 *
 * - em contexto **hierarquico** nao ha consequencia alguma, porque a
 *   normalizacao ja transformou o nome em `0` antes de chegar aqui;
 * - em contexto **plano** o rotulo novo que o legado criaria **nao e criado**.
 *   Isso fecha com T009: quando `wp_insert_term()` existir, a situacao
 *   `'por-nome'` deixa de ser um desfecho e passa a ser a chamada que o legado
 *   faz em `:2896`. O ponto exato esta marcado no corpo de
 *   `substituir-vinculos.ts`.
 */

import type { ParDoRotulo } from '../rotulo-e-contexto/index.js';
import type { EscopoDeVinculoDeObjeto } from './escopo-de-vinculo-de-objeto.js';

/**
 * Um item da lista informada, nas duas formas que o legado distingue **por
 * tipo**.
 *
 * ⚠️ A distincao e `is_int( $term )` (`taxonomy.php:2892`), e ela e por tipo e
 * nao por conteudo: a cadeia `'5'` **nao** e inteiro para o legado, e por isso ela
 * vai para a resolucao por apelido e por nome, e nao para a leitura por
 * identificador. Um porte que aceitasse cadeia numerica como identificador
 * deixaria de criar um rotulo chamado `5` que o legado cria.
 */
export type RotuloInformado = number | string;

/**
 * Se o chamador informou uma lista ou um escalar.
 *
 * E uma guarda escrita a mao, e nao `Array.isArray`, porque a lista e
 * `readonly`: `Array.isArray` promete `any[]`, que nao e o mesmo tipo, e a
 * estreita por caminho diferente do que este codigo precisa. {@link
 * RotuloInformado} nunca e objeto, logo `typeof` resolve sozinho.
 */
function ehLista(
  informados: readonly RotuloInformado[] | RotuloInformado,
): informados is readonly RotuloInformado[] {
  return typeof informados === 'object';
}

/** `intval()`: inteiro pela parte numerica inicial, e `0` quando nao ha nenhuma. */
function comoInteiroDoLegado(valor: RotuloInformado): number {
  if (typeof valor === 'number') {
    return Math.trunc(valor);
  }
  const numero = Number.parseInt(valor, 10);
  return Number.isNaN(numero) ? 0 : numero;
}

/**
 * `empty( $terms )` sobre o que o chamador informou
 * (`wp-includes/taxonomy.php:2860` e `wp-includes/post.php:5198`).
 *
 * ⚠️ **A cadeia `'0'` conta como vazia**, e o numero `0` tambem: em PHP
 * `empty( '0' )` e verdadeiro. A consequencia e observavel e e usada pela
 * propria tela: `wp_set_object_terms( $id, 0, $tax )` **remove todos** os
 * vinculos daquele contexto, e e por isso que a caixa de categoria envia um
 * campo oculto com valor `0` *"to allow for an empty term set to be sent"*
 * (`wp-admin/includes/meta-boxes.php:661`).
 */
function vazioNoSentidoDoLegado(
  informados: readonly RotuloInformado[] | RotuloInformado,
): boolean {
  if (ehLista(informados)) {
    return informados.length === 0;
  }
  if (typeof informados === 'string') {
    return informados === '' || informados === '0';
  }
  return informados === 0;
}

/**
 * `wp_set_object_terms()`, linhas `:2860`-`:2864`: o que nao e lista vira lista
 * de um, e o que e vazio vira lista vazia.
 *
 * Lista vazia **nao e caminho de erro**: e o pedido de remover tudo daquele
 * contexto, e o docblock do legado o diz em uma linha — *"Passing an empty array
 * will remove all related terms"*.
 */
export function normalizarRotulosInformados(
  informados: readonly RotuloInformado[] | RotuloInformado,
): readonly RotuloInformado[] {
  if (vazioNoSentidoDoLegado(informados)) {
    return [];
  }
  return ehLista(informados) ? informados : [informados];
}

/**
 * Os caracteres que `wp_set_post_terms()` retira das pontas antes de separar por
 * virgula: `" \n\t\r\0\x0B,"` (`wp-includes/post.php:5206`).
 *
 * E a mesma lista do `trim` de `taxonomy_meta_box_sanitize_cb_input()`
 * (`wp-admin/includes/post.php:2278`), virgula inclusive — e e a virgula no fim
 * que faz `"a,b,"` virar dois itens e nao tres.
 */
const PONTAS_APARADAS_DA_LISTA = ' \n\t\r\0\u000b,';

/** `trim( $terms, " \n\t\r\0\x0B," )`, que apara **qualquer** um desses dos dois lados. */
function apararPontas(texto: string): string {
  let inicio = 0;
  let fim = texto.length;
  while (
    inicio < fim &&
    PONTAS_APARADAS_DA_LISTA.includes(texto.charAt(inicio))
  ) {
    inicio += 1;
  }
  while (fim > inicio && PONTAS_APARADAS_DA_LISTA.includes(texto.charAt(fim - 1))) {
    fim -= 1;
  }
  return texto.slice(inicio, fim);
}

/**
 * `wp_set_post_terms()` — a normalizacao que depende do contexto ser
 * hierarquico.
 *
 * Tres coisas do legado, na ordem dele:
 *
 * 1. vazio vira lista vazia (`post.php:5198`), com a pegadinha do `'0'` descrita
 *    em {@link vazioNoSentidoDoLegado};
 * 2. cadeia e separada por virgula depois de aparar as pontas (`:5201`-`:5206`);
 * 3. **contexto hierarquico** passa tudo por `intval` e deduplica (`:5212`).
 *
 * ⚠️ **O separador do passo 2 e traduzivel no legado e aqui nao e.** O legado le
 * `_x( ',', 'tag delimiter' )` e, se o idioma usa outro caractere, troca-o por
 * virgula antes de separar (`:5202`-`:5205`). O catalogo gettext e T009 da feature
 * 015 e nao existe nesta arvore, logo so o separador do idioma de origem — a
 * virgula — e reconhecido. A consequencia e declarada: numa instalacao traduzida
 * com separador proprio, uma lista digitada com ele chega como **um** item.
 *
 * ⚠️ **`array_unique` depois de `intval` e so no ramo hierarquico**, e a
 * assimetria e do legado: em contexto plano `['a','a']` segue com dois itens, e e
 * a leitura de vinculo existente que impede a segunda insercao.
 */
export function normalizarRotulosDoConteudo(
  hierarquico: boolean,
  informados: readonly RotuloInformado[] | RotuloInformado,
): readonly RotuloInformado[] {
  if (vazioNoSentidoDoLegado(informados)) {
    return [];
  }

  const lista: readonly RotuloInformado[] = ehLista(informados)
    ? informados
    : typeof informados === 'string'
      ? apararPontas(informados).split(',')
      : [informados];

  if (!hierarquico) {
    return lista;
  }

  return [...new Set(lista.map(comoInteiroDoLegado))];
}

/**
 * O desfecho de resolver **um** item da lista informada.
 *
 * Os quatro sao os quatro caminhos do legado, e cada um tem consequencia
 * diferente na sequencia de comandos — e por isso que sao quatro e nao um
 * booleano.
 */
export type ResolucaoDoRotulo =
  /** O par existe naquele contexto. */
  | { readonly situacao: 'resolvido'; readonly par: ParDoRotulo }
  /** `'' === trim( $term )`: o item e saltado antes de qualquer leitura (`:2884`). */
  | { readonly situacao: 'vazio' }
  /**
   * Identificador que nao existe naquele contexto: *"Skip if a non-existent term
   * ID is passed"* (`:2891`-`:2893`). **Nao cria nada e nao e erro.**
   */
  | { readonly situacao: 'inexistente' }
  /**
   * 🔴 Informado por nome: no legado iria para `term_exists()` por apelido e por
   * nome e, falhando as duas, para `wp_insert_term()`. Nenhuma das tres existe
   * nesta arvore — ver o cabecalho deste arquivo.
   */
  | { readonly situacao: 'por-nome'; readonly nome: string };

/**
 * Resolve um item informado no par `(rotulo, rotulo no contexto)`.
 *
 * A ordem e a do legado: apara e salta o vazio **antes** de ler o banco, e so
 * entao pergunta pelo par.
 *
 * ⚠️ **A leitura do par nao e a cadeia que `term_exists()` envia, e a diferenca e
 * declarada.** `term_exists()` com identificador monta `WP_Term_Query` com
 * `include => array( $term )`, `number => 1` e `fields => all`, o que produz uma
 * consulta sobre `terms` com juncao em `term_taxonomy`, `ORDER BY t.term_id ASC`
 * e `LIMIT 1`, e **depois** completa o termo
 * (`class-wp-term-query.php`, e `taxonomy.php:1650`-`:1652`). Aqui a leitura e
 * `idDoRotuloNoContexto`, que e a cadeia que `wp_insert_term()` e
 * `wp_update_term()` enviam para perguntar exatamente o mesmo par
 * (`taxonomy.php:2643` e `:3380`, identicas). **O conjunto devolvido e o mesmo**
 * — o par existe ou nao existe naquele contexto —, o texto da cadeia nao. A
 * consulta por fragmento chega com T009 e com a feature 015, e e ela que fecha
 * esta diferenca.
 */
export function resolverRotuloInformado(
  escopo: EscopoDeVinculoDeObjeto,
  informado: RotuloInformado,
  contexto: string,
): ResolucaoDoRotulo {
  // `if ( '' === trim( $term ) ) { continue; }` (`:2884`). O legado aplica `trim`
  // ao valor como cadeia, logo o numero `0` **nao** cai aqui: `trim( 0 )` e `'0'`.
  if (String(informado).trim() === '') {
    return { situacao: 'vazio' };
  }

  if (typeof informado === 'string') {
    return { situacao: 'por-nome', nome: informado };
  }

  const rotuloId = Math.trunc(informado);

  // `if ( is_int( $term ) ) { if ( 0 === $term ) { return 0; } ... }`
  // (`taxonomy.php:1650`-`:1652`): o zero sai de `term_exists()` **sem consultar
  // o banco**, e o `0` devolvido e falso para o `if ( ! $term_info )` logo
  // adiante — logo o item cai no `continue` do identificador inexistente.
  //
  // ⚠️ Nao e defensividade: e o caminho normal da caixa de categoria da tela,
  // que envia um campo oculto com valor `0` (`meta-boxes.php:661`), e e o valor
  // em que um rotulo informado por nome se transforma em contexto hierarquico
  // ({@link normalizarRotulosDoConteudo}). Sem esta guarda sairia uma leitura
  // que o legado nao emite.
  if (rotuloId === 0) {
    return { situacao: 'inexistente' };
  }

  const rotuloNoContextoId =
    escopo.armazenamento.rotulosNoContexto.idDoRotuloNoContexto(
      rotuloId,
      contexto,
    );

  if (rotuloNoContextoId === null) {
    return { situacao: 'inexistente' };
  }

  return { situacao: 'resolvido', par: { rotuloId, rotuloNoContextoId } };
}
