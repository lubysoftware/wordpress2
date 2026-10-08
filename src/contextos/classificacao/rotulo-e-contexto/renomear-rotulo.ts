/**
 * **CA-1.2**: *"Renomear o rotulo muda o nome em todos os contextos em que ele
 * serve"*.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo` (US-1). E o
 * caminho do **nome** de `wp_update_term()` (`wp-includes/taxonomy.php:3262`), e
 * o criterio vale por onde o nome mora: a coluna `name` esta **so** em `terms`
 * (`../armazenamento/rotulo.ts`), e um `UPDATE` nela alcanca por construcao todos
 * os contextos daquele rotulo, porque a presenca em cada contexto e outra linha,
 * em `term_taxonomy`, que **nao** guarda nome.
 *
 * ---
 *
 * # Os dois comandos de uma renomeacao, e por que sao dois
 *
 * O legado emite **dois** `UPDATE` para renomear, e o segundo escreve valores
 * que nao mudaram:
 *
 * | # | comando | onde |
 * |---|---|---|
 * | 1 | `UPDATE terms SET name, slug, term_group WHERE term_id` | `taxonomy.php:3414`, com `compact( 'name', 'slug', 'term_group' )` |
 * | 2 | `UPDATE term_taxonomy SET term_id, taxonomy, description, parent WHERE term_taxonomy_id` | `:3446`, com `compact( 'term_id', 'taxonomy', 'description', 'parent' )` |
 *
 * O segundo sai **sempre**, inclusive quando so o nome mudou, porque o legado
 * monta `$args` por `array_merge( $term, $args )` (`:3288`) — os campos nao
 * informados chegam ao comando com o valor que ja estava gravado. Esta operacao
 * faz o mesmo, e nao "otimiza" o comando que nao muda nada: a area 3 da Decisao
 * 2 de `parity_specs.md` compara *"snapshot + sequencia de comandos"*, e omitir
 * o segundo `UPDATE` mudaria a sequencia **e** a ordem em que os dois pontos de
 * extensao de `term_taxonomy` disparam.
 *
 * # 🔴 A DIVERGENCIA QUE ESTA TAREFA NAO RESOLVE: o rotulo compartilhado
 *
 * Entre a leitura e o `UPDATE`, o legado chama **`_split_shared_term( $term_id,
 * $tt_id )`** (`:3383`). O que essa funcao faz quando o rotulo serve mais de um
 * contexto (`:4313`-`:4437`):
 *
 * 1. insere uma linha **nova** em `terms`, copia de nome, slug e grupo;
 * 2. aponta a linha de `term_taxonomy` daquele contexto para o `term_id` novo;
 * 3. reposiciona os filhos daquele contexto no `term_id` novo;
 * 4. grava o par antigo/novo na opcao `_split_terms` e, quando acaba o ultimo
 *    compartilhado, grava `finished_splitting_shared_terms`;
 * 5. dispara `split_shared_term`.
 *
 * E so **depois** disso que o `UPDATE` do nome acontece — sobre o rotulo **novo**.
 * O efeito observavel: **renomear um rotulo compartilhado nao propaga o nome
 * para o outro contexto; ele desfaz o compartilhamento.** O criterio CA-1.2 diz
 * o contrario, em todas as letras, e `UT-033-2` repete (*"propaga a renomeacao
 * do rotulo para todos os contextos em que ele serve"*).
 *
 * **As duas leituras coincidem em tudo que uma instalacao nova alcanca** — e e
 * por isso que esta tarefa entrega o criterio sem decidir a divergencia:
 *
 * - numa instalacao nova nenhuma operacao do legado cria rotulo compartilhado
 *   (o inventario esta em `resolucao-do-rotulo-no-contexto.ts`, secao *O estado
 *   que CA-1.1 descreve...*), e `upgrade_230()`, que criou esses dados no
 *   passado, esta entre os 38 portoes historicos de
 *   [`discard_log.md`](../../../../.specify/migration/discard_log.md);
 * - para o rotulo que serve **um** contexto — o unico que uma instalacao nova
 *   produz — `_split_shared_term()` devolve o proprio identificador na primeira
 *   guarda (`if ( ! $shared_tt_count ) { return $term_id; }`, `:4330`) e **nao
 *   emite comando nenhum**. O caminho desta operacao e, ali, identico ao do
 *   legado, comando por comando.
 *
 * Logo a divergencia so aparece sobre dado que so existe por escrita direta. O
 * que esta tarefa **nao** faz, e nao faz de proposito:
 *
 * - **nao porta a divisao.** Ela escreve em `options` (passo 4), e nao ha porta
 *   de opcoes nesta feature — a primeira chega com T007. Portar meia divisao,
 *   sem o registro do par, daria um sistema que divide e **esquece**, e
 *   `wp_get_split_term()` (`:4664`) existe para quem consulta esse registro;
 * - **nao "conserta" CA-1.2** fazendo o `UPDATE` propagar de proposito contra o
 *   legado. Com rotulo de um contexto so, propagar e o comportamento;
 * - **nao decide qual das duas vence.** O **P1** e literal: *"Divergir exige uma
 *   decisao humana registrada, citada no codigo que divergiu"*, e nenhuma
 *   existe. Nem `target_business_rules.md`, nem `parity_specs.md`, nem
 *   `discard_log.md`, nem `pending_decisions.md` mencionam rotulo compartilhado,
 *   divisao de rotulo ou `_split_shared_term` — a busca por `split`, `shared` e
 *   `ambiguous` nos 19 documentos de `.specify/migration/` nao devolve uma
 *   linha sobre isto. **E conflito aberto, nao decisao desta tarefa**, e o mesmo
 *   precedente de `../../conteudo/publicacao/permissao-de-publicacao.ts` com
 *   CA-1.1: registrar a divergencia de redacao em vez de inventar.
 *
 * **Para quem decidir:** se a resposta for *"o compartilhamento se preserva"*, a
 * divisao sai do escopo e esta operacao fica como esta. Se for *"o legado
 * manda"*, a divisao entra — com porta de opcoes, com `wp_get_split_term()`,
 * `wp_term_is_shared()` e `_wp_batch_split_terms()` (que e tarefa agendada,
 * BC-11) — e **CA-1.2 e UT-033-2 precisam de nova redacao**, porque passam a
 * descrever o oposto do comportamento.
 *
 * # O que mais nao esta aqui, e de quem e
 *
 * | passo do legado | onde | de quem e |
 * |---|---|---|
 * | `alias_of` e o grupo de sinonimos (`SELECT MAX(term_group)` + `wp_update_term()` recursivo) | `:3326`-`:3346` | T009 (US-4): e manutencao da lista, e a leitura ja existe em `maiorGrupoDeSinonimos` |
 * | o pai, e a recusa `missing_parent` | `:3310`-`:3312`, com `term_exists()` | T009 (CA-4.2): hierarquia, e `term_exists()` passa por `WP_Term_Query` |
 * | o filtro `wp_update_term_parent`, e a verificacao de laco na arvore | `:3363`, `wp_check_term_hierarchy_for_loops()` `:5109` | T009 |
 * | a recusa `duplicate_term_slug` e o laco de sufixo (`wp_unique_term_slug()`) | `:3365`-`:3377`, `:3136` | T009 — a leitura de duplicata e `get_term_by( 'slug', $slug, $taxonomy )`, que e **consulta de termos por filtro** (`WP_Term_Query`), de T009 e da feature 015. ⚠️ Enquanto ela nao existe, esta operacao **aceita** a renomeacao que o legado recusaria quando outro rotulo daquele contexto ja usa o mesmo slug — o banco nao garante unicidade de slug (`DB-UNIQ`), e a recusa e de codigo |
 * | o `UPDATE` extra de slug quando o slug resolvido fica vazio | `:3416`-`:3419` | T009 — depende de `sanitize_title( $name, $term_id )`, que nao existe nesta arvore. ⚠️ Com slug gravado vazio (`''` e ausencia, `DB-SENT`), o legado deriva um slug do nome e esta operacao regrava o vazio |
 * | `sanitize_term( $args, $taxonomy, 'db' )` e o par `wp_slash`/`wp_unslash` | `:3297`, `:3300` | o contexto `db` e **cadeia de filtros** (`pre_term_name`, `pre_{$taxonomy}_name`): barramento, REQ-162. Nenhum porte desta arvore trata barra invertida de entrada |
 * | `clean_term_cache( $term_id, $taxonomy )` | `:3499` | nao ha cache (borda 5, REQ-165) |
 *
 * ## Os pontos de extensao desta operacao, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` e **nenhuma
 * tarefa deste pacote constroi o barramento**; o **P2** poe cada ponto no
 * contrato publico *"com o nome, os argumentos, a ordem de disparo e a
 * capacidade de alterar o resultado"*. Os onze de `wp_update_term()`, na ordem
 * **exata** em que disparam — tres deles antes do primeiro comando:
 *
 * | # | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|---|
 * | 1 | `wp_update_term_parent` | filtro | `$parent`, `$term_id`, `$taxonomy`, `$parsed_args`, `$args` | antes da verificacao de duplicata (`:3363`) — T009 |
 * | 2 | `edit_terms` | acao | `$term_id`, `$taxonomy`, `$args` | depois da divisao, antes do `UPDATE` de `terms` (`:3398`) |
 * | 3 | `wp_update_term_data` | filtro | `$data`, `$term_id`, `$taxonomy`, `$args` | **imediatamente antes** do `UPDATE` de `terms`, e o valor devolvido e o que vai gravado (`:3412`) |
 * | 4 | `edited_terms` | acao | `$term_id`, `$taxonomy`, `$args` | depois do `UPDATE` de `terms` (`:3432`) |
 * | 5 | `edit_term_taxonomy` | acao | `$tt_id`, `$taxonomy`, `$args` | antes do `UPDATE` de `term_taxonomy` (`:3444`) |
 * | 6 | `edited_term_taxonomy` | acao | `$tt_id`, `$taxonomy`, `$args` | depois dele (`:3458`) |
 * | 7 | `edit_term` | acao | `$term_id`, `$tt_id`, `$taxonomy`, `$args` | `:3474` |
 * | 8 | `edit_{$taxonomy}` | acao | `$term_id`, `$tt_id`, `$args` | `:3494` |
 * | 9 | `term_id_filter` | filtro | `$term_id`, `$tt_id`, `$args` | `:3497` — ⚠️ **muda o identificador devolvido** ao chamador |
 * | 10 | `edited_term` / `edited_{$taxonomy}` | acao | `$term_id`, `$tt_id`, `$taxonomy`, `$args` | depois da limpeza de cache (`:3515`, `:3535`) |
 * | 11 | `saved_term` / `saved_{$taxonomy}` | acao | `$term_id`, `$tt_id`, `$taxonomy`, `true`, `$args` | por ultimo, com `$update = true` **literal** (`:3538`, `:3541`) |
 *
 * E, dentro da divisao que esta operacao nao porta, `split_shared_term`
 * (`$term_id`, `$new_term_id`, `$term_taxonomy_id`, `$taxonomy`, `:4433`).
 */

import {
  erroDeTermo,
  ehErroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  type ErroDeTermo,
} from './erro-de-termo.js';
import type { EscopoDeRotuloEContexto } from './escopo-de-rotulo-e-contexto.js';
import { obterTermo } from './resolucao-do-rotulo-no-contexto.js';

/** O que se pede para renomear: o rotulo, o contexto por onde se edita, o nome. */
export interface PedidoDeRenomeacao {
  /** `terms.term_id` — o rotulo, nao o rotulo no contexto. */
  readonly rotuloId: number;
  /**
   * O contexto por onde a renomeacao e feita.
   *
   * ⚠️ **Nao e o alvo da mudanca, e e obrigatorio.** O nome nao pertence ao
   * contexto, mas `wp_update_term()` exige a taxonomia no primeiro portao
   * (`:3266`) e usa-a para achar o `term_taxonomy_id` do segundo `UPDATE`. E
   * tambem o que faz da renomeacao uma operacao **por contexto** no legado, que
   * e a raiz da divergencia descrita no cabecalho.
   */
  readonly contexto: string;
  /** O nome novo. Vazio, ou so espaco, e recusa (`empty_term_name`). */
  readonly nome: string;
}

/**
 * O par que `wp_update_term()` devolve: `array( 'term_id', 'term_taxonomy_id' )`
 * (`:3543`).
 *
 * E o mesmo par de `wp_insert_term()`, e e por isso que o legado trata as duas
 * como a mesma forma de retorno.
 */
export interface ParDoRotulo {
  readonly rotuloId: number;
  readonly rotuloNoContextoId: number;
}

/** O desfecho da renomeacao: o par, ou o erro — **nunca excecao**. */
export type ResultadoDaRenomeacao = ParDoRotulo | ErroDeTermo;

/**
 * Renomeia o rotulo — `wp_update_term()` pelo caminho do nome.
 *
 * **Permissao declarada: a capacidade que o contexto declara em
 * `capacidades.editarRotulos` (`$tax->cap->edit_terms`), e ela NAO e verificada
 * aqui.**
 *
 * E a declaracao que o **P4** cobra, e ela e desta forma porque e assim no
 * legado: `wp_update_term()` **nao verifica capacidade nenhuma**
 * (`wp-includes/taxonomy.php:3262`, sem um `current_user_can` no corpo). Quem
 * cobra sao as superficies, cada uma a sua maneira:
 *
 * | superficie | onde | o que faz |
 * |---|---|---|
 * | tela de termos | `wp-admin/edit-tags.php:26` e `:112` | `wp_die()` antes de chegar a funcao — e **CA-4.1**, de T009 |
 * | API REST | `class-wp-rest-terms-controller.php`, `update_item_permissions_check()` | devolve erro de permissao com a capacidade meta `edit_term` |
 * | nucleo | `register_taxonomy()`, `wp_set_object_terms()` | **nenhuma**: chamam sem ator e sem verificacao |
 *
 * Verificar aqui recusaria o que o legado aceita — a chamada interna do proprio
 * nucleo, que acontece sem ninguem autenticado — e o **P1** proibe. A cobranca
 * entra com a superficie que a faz: CA-4.1 (T009) para a tela, e a capacidade
 * de criar termo de CA-2.2 (T005) para o caminho de classificar conteudo.
 *
 * Os cinco nomes que colapsam em `manage_categories` (`permissions.md` 5.4,
 * UC-08) **nao** sao achatados no registro, de proposito — ver
 * `../registro/contexto-de-classificacao.ts`.
 */
export function renomearRotulo(
  escopo: EscopoDeRotuloEContexto,
  pedido: PedidoDeRenomeacao,
): ResultadoDaRenomeacao {
  // 1. `if ( ! taxonomy_exists( $taxonomy ) )` (`:3266`).
  if (!escopo.contextos.existe(pedido.contexto)) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  // 2. `$term = get_term( $term_id, $taxonomy )` (`:3272`), com as duas saidas
  // que o legado distingue: erro repassado (`:3275`) e rotulo inexistente
  // (`:3279`), que vira `invalid_term` e NAO `null`.
  const termo = obterTermo(escopo, pedido.rotuloId, pedido.contexto);

  if (ehErroDeTermo(termo)) {
    return termo;
  }

  if (termo === null) {
    return erroDeTermo('invalid_term', MENSAGENS_DE_ERRO_DE_TERMO.invalid_term);
  }

  // 3. `if ( '' === trim( $name ) )` (`:3307`). No legado o nome passa antes por
  // `sanitize_term( ..., 'db' )`, que e cadeia de filtros (REQ-162), e a
  // verificacao acontece DEPOIS dela: um interceptador que esvazie o nome cai
  // nesta mesma recusa. Ver a tabela do cabecalho.
  const nome = pedido.nome.trim();
  if (nome === '') {
    return erroDeTermo(
      'empty_term_name',
      MENSAGENS_DE_ERRO_DE_TERMO.empty_term_name,
    );
  }

  // 4. O legado le o `term_taxonomy_id` de novo, com a cadeia dele, mesmo tendo
  // o termo em maos (`:3380`) — e e essa leitura que alimenta os comandos
  // seguintes. A cadeia e a de `idDoRotuloNoContexto`
  // (`../armazenamento/rotulo-no-contexto.ts`), identica a de `wp_insert_term()`.
  const rotuloNoContextoId =
    escopo.armazenamento.rotulosNoContexto.idDoRotuloNoContexto(
      pedido.rotuloId,
      pedido.contexto,
    ) ?? 0;

  // 5. `_split_shared_term( $term_id, $tt_id )` (`:3383`) — NAO portada. Com
  // rotulo de um contexto so ela devolve o identificador e nao emite comando
  // nenhum (`:4330`); com rotulo compartilhado ela divide, e e a divergencia
  // declarada no cabecalho deste arquivo. Nada e decidido aqui.

  // 6. `UPDATE terms SET name, slug, term_group WHERE term_id` (`:3414`), com o
  // slug e o grupo **que ja estavam gravados**: no legado eles chegam ao comando
  // por `array_merge( $term, $args )` quando o chamador nao os informa, e so o
  // nome mudou.
  escopo.armazenamento.rotulos.atualizar(pedido.rotuloId, {
    nome,
    slug: termo.slug,
    grupoDeSinonimos: termo.grupoDeSinonimos,
  });

  // 7. `UPDATE term_taxonomy SET term_id, taxonomy, description, parent WHERE
  // term_taxonomy_id` (`:3446`) — as quatro colunas, com os valores que nao
  // mudaram. Sai sempre, e e por isso que a sequencia tem dois comandos.
  escopo.armazenamento.rotulosNoContexto.atualizar(rotuloNoContextoId, {
    rotuloId: pedido.rotuloId,
    contexto: pedido.contexto,
    descricao: termo.descricao,
    rotuloPaiId: termo.rotuloPaiId,
  });

  // 8. `return array( 'term_id' => $term_id, 'term_taxonomy_id' => $tt_id )`
  // (`:3543`). O `term_id` devolvido e o que o filtro `term_id_filter` tiver
  // deixado (`:3497`) — sem barramento, e o mesmo que entrou.
  return { rotuloId: pedido.rotuloId, rotuloNoContextoId };
}
