/**
 * **CA-1.3**: *"Remover o rotulo de um contexto nao o remove do outro"*.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo` (US-1). E o
 * **trecho final** de `wp_delete_term()` — `wp-includes/taxonomy.php:2200` a
 * `:2216` —, que e onde o criterio se decide:
 *
 * ```php
 * $wpdb->delete( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => $tt_id ) );
 * // ...
 * // Delete the term if no taxonomies use it.
 * if ( ! $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->term_taxonomy WHERE term_id = %d", $term ) ) ) {
 *     $wpdb->delete( $wpdb->terms, array( 'term_id' => $term ) );
 * }
 * ```
 *
 * **A linha de `terms` so morre se nenhum contexto mais a usar**, e a contagem e
 * feita **depois** do `DELETE` da linha de contexto — e por isso que o rotulo de
 * um contexto so desaparece inteiro e o rotulo de dois sobrevive. T002 ja havia
 * apontado esta leitura como a prova do criterio
 * (`../armazenamento/rotulo-no-contexto.ts`, em `contarContextosDoRotulo`: *"E a
 * leitura que faz CA-1.3 valer"*).
 *
 * ---
 *
 * # 🔴 ESTA OPERACAO NAO E `wp_delete_term()`, E NAO ESTA NA SUPERFICIE DO MODULO
 *
 * `wp_delete_term()` tem **oito** passos antes destes dois, e cada um tem dono
 * declarado abaixo. Esta funcao e o rabo da funcao, nao a funcao — e por isso
 * ela **nao** e exportada como operacao de `ModuloDeClassificacao` (`../index.ts`),
 * so como peca para a tarefa que montar a exclusao inteira:
 *
 * 1. **a protecao do termo padrao (`:2075`-`:2086`) e US-5, T011.** O legado
 *    recusa com `return 0` — *"Don't delete the default category"* — e
 *    `permissions.md` 5.2 poe a negacao acima de todo ator (*"a negacao vence
 *    ate o super administrador"*, ADR 0009). Publicar esta funcao como operacao
 *    do modulo **antes** de T011 publicaria um caminho que apaga o termo padrao
 *    de um contexto, e esse caminho **o legado nao tem**: a unica exclusao de
 *    termo que ele expoe e `wp_delete_term()`, que recusa. Quem monta a
 *    exclusao poe a guarda **antes** de chamar isto;
 * 2. **a cascata e US-4, T009.** Reposicionar os filhos no avo (`DB-TRG3`,
 *    BR-MIGRAR-079), devolver cada objeto ao termo padrao ou so remover o
 *    vinculo (`DB-TRG4`, BR-MIGRAR-080), apagar o metadado do rotulo e
 *    recalcular contagem. **Chamada sozinha, esta funcao deixa vinculo orfao em
 *    `term_relationships`** — e o escopo desta pasta nao tem a juncao, de
 *    proposito (`escopo-de-rotulo-e-contexto.ts`), para que o orfao nao seja
 *    produzido aqui por acidente e sim resolvido onde a cascata mora. A tag
 *    `@cascata` de `parity_specs.md` e obrigatoria em *"exclusao de conteudo e
 *    de termo"*, e e nessa tarefa que ela se cobra.
 *
 * ## Os oito passos que vem antes, e de quem sao
 *
 * | # | passo do legado | onde | de quem e |
 * |---|---|---|---|
 * | 1 | `term_exists( $term, $taxonomy )`, e `return false` se nao existe | `:2062`-`:2064` | **aqui**, por outro caminho — ver {@link removerRotuloDoContexto} |
 * | 2 | `default_category` / `default_term_{nome}`: `return 0` | `:2073`-`:2087` | **T011** (US-5, CA-5.1 e CA-5.2) — precisa da porta de opcoes, que chega com T007 |
 * | 3 | `$args['default']` e `force_default`, e a validacao do padrao informado | `:2089`-`:2098` | **T009** e **T011**: e o que decide entre "devolve ao padrao" e "so perde o vinculo" |
 * | 4 | acao `pre_delete_term` | `:2111` | barramento (REQ-162), declarado abaixo |
 * | 5 | reposicionar os filhos no avo, em contexto hierarquico | `:2114`-`:2147` | **T009** (CA-4.2) — `DB-TRG3`. A leitura e o `UPDATE` ja existem em `listarFilhosDoRotulo` e `reposicionarFilhos` |
 * | 6 | `$deleted_term = get_term( $term, $taxonomy )`, a copia que vai aos pontos de extensao | `:2149` | barramento: sem quem receber a copia, ler a linha de novo seria consulta sem efeito |
 * | 7 | cada objeto vinculado: padrao, ou remocao do vinculo | `:2152`-`:2183` | **T009** — `DB-TRG4`, e passa por `wp_set_object_terms()`, que e US-2 (T005) |
 * | 8 | apagar o metadado do rotulo (`termmeta`) | `:2188`-`:2191` | quem portar `termmeta` — T002 declarou a posicao em `../armazenamento/chaves-e-tabelas.ts` |
 *
 * E depois dos dois comandos: `clean_term_cache()` (`:2218`, sem cache nesta
 * arvore) e as duas acoes finais.
 *
 * ## Os pontos de extensao deste trecho, declarados e nao emitidos
 *
 * 🔴 `REQ-162` em `do-not-rewrite.md`, coluna `bloqueado`; nenhuma tarefa do
 * pacote constroi o barramento. Os quatro que cercam estes dois comandos, na
 * ordem do legado:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `delete_term_taxonomy` | acao | `$tt_id` | **imediatamente antes** do `DELETE` de `term_taxonomy` (`:2200`) |
 * | `deleted_term_taxonomy` | acao | `$tt_id` | imediatamente depois (`:2211`) — ⚠️ **antes** do `DELETE` de `terms`, nao depois |
 * | `delete_term` | acao | `$term`, `$tt_id`, `$taxonomy`, `$deleted_term`, `$object_ids` | depois da limpeza de cache (`:2235`) |
 * | `delete_{$taxonomy}` | acao | `$term`, `$tt_id`, `$deleted_term`, `$object_ids` | por ultimo (`:2256`) |
 *
 * Mais `pre_delete_term` (`$term`, `$taxonomy`, `:2111`) e o par
 * `edit_term_taxonomies` / `edited_term_taxonomies` do reposicionamento de
 * filhos (`:2131` e `:2146`), que `../armazenamento/rotulo-no-contexto.ts` ja
 * declarou e que sao de T009.
 */

import {
  ehErroDeTermo,
  type ErroDeTermo,
} from './erro-de-termo.js';
import type { EscopoDeRotuloEContexto } from './escopo-de-rotulo-e-contexto.js';
import { obterTermo } from './resolucao-do-rotulo-no-contexto.js';

/** O que se pede: o rotulo, e de qual contexto ele sai. */
export interface PedidoDeRemocaoDoContexto {
  /** `terms.term_id` — o rotulo. */
  readonly rotuloId: number;
  /** O contexto de onde ele sai. Os outros contextos do rotulo nao sao tocados. */
  readonly contexto: string;
}

/**
 * O desfecho, nas formas que `wp_delete_term()` devolve — menos uma.
 *
 * `true` removeu; `false` o par nao existe (ou o contexto nao esta registrado);
 * erro e repasse.
 *
 * ⚠️ **O `0` do legado nao esta aqui**, e a ausencia e declaracao: ele e a
 * recusa de apagar o termo padrao (`:2077` e `:2086`), que e **US-5, T011**, e
 * que acontece **antes** deste trecho. Quem montar `wp_delete_term()` acrescenta
 * esse desfecho no lugar dele.
 */
export type ResultadoDaRemocaoDoContexto = boolean | ErroDeTermo;

/**
 * Remove a presenca do rotulo num contexto, e apaga o rotulo **somente** se
 * nenhum contexto mais o usar — `wp_delete_term()`, `:2200` a `:2216`.
 *
 * **Permissao declarada: a capacidade que o contexto declara em
 * `capacidades.apagarRotulos` (`$tax->cap->delete_terms`), e ela NAO e
 * verificada aqui** — pela mesma razao, com as mesmas ancoras, de
 * `renomear-rotulo.ts`: `wp_delete_term()` nao tem `current_user_can` no corpo,
 * e quem cobra e a tela (`wp-admin/edit-tags.php:91`, a acao em lote recusada
 * *"antes de tocar qualquer registro"* de UC-08) e a API REST. Isso e **CA-4.1**,
 * de T009.
 *
 * ⚠️ E leia o bloco 🔴 do cabecalho antes de chamar esta funcao: ela **nao**
 * cobra a protecao do termo padrao (US-5) e **nao** faz a cascata (US-4).
 */
export function removerRotuloDoContexto(
  escopo: EscopoDeRotuloEContexto,
  pedido: PedidoDeRemocaoDoContexto,
): ResultadoDaRemocaoDoContexto {
  // Passo 1, primeira metade: contexto nao registrado devolve `false`, e nao
  // erro. No legado o caminho e indireto e vale escrever: `term_exists()` chama
  // `get_terms()`, que devolve `WP_Error( 'invalid_taxonomy' )` para taxonomia
  // nao registrada; `term_exists()` traduz erro em `null` (`:1670`:
  // `if ( empty( $terms ) || is_wp_error( $terms ) ) { return null; }`); e
  // `wp_delete_term()` traduz `null` em `false` (`:2063`).
  if (!escopo.contextos.existe(pedido.contexto)) {
    return false;
  }

  // Passo 1, segunda metade: achar o par `(term_id, term_taxonomy_id)`.
  //
  // ⚠️ **Diferenca de cadeia declarada.** O legado chega ao par por
  // `term_exists( $term, $taxonomy )`, que desde 6.0 passa por `get_terms()` e
  // portanto por `WP_Term_Query` — a consulta de termos por filtro, que e de
  // T009 e da camada de dados da feature 015, e que
  // `../armazenamento/termo.ts` proibe de transcrever em versao simplificada
  // ("seria a forma mais barata de perder o contrato"). Esta operacao usa a
  // leitura de `get_term()`, que o proprio `wp_delete_term()` tambem envia duas
  // vezes mais adiante (`:2115` e `:2149`): mesma tabela, mesma juncao, cadeia
  // que o legado envia.
  const termo = obterTermo(escopo, pedido.rotuloId, pedido.contexto);

  // `if ( is_wp_error( $ids ) ) { return $ids; }` (`:2066`). Em 7.1.2
  // `term_exists()` nunca produz erro — ela o traduz em `null` —, logo este ramo
  // e inalcancavel no legado, e esta portado assim mesmo: a resposta 7 de
  // `questions.md` fixa que *"existir sem ser chamada e parte do que se clona"*
  // (P8).
  if (ehErroDeTermo(termo)) {
    return termo;
  }

  // `if ( ! $ids ) { return false; }` (`:2063`): o rotulo nao existe, ou nao
  // serve este contexto.
  if (termo === null) {
    return false;
  }

  // Acao `delete_term_taxonomy` (`:2200`) — declarada, sem barramento.

  // `$wpdb->delete( $wpdb->term_taxonomy, array( 'term_taxonomy_id' => $tt_id ) )`
  // (`:2202`). **E este comando que desfaz a presenca no contexto**, e e so
  // este: o rotulo continua em `terms`.
  escopo.armazenamento.rotulosNoContexto.apagar(termo.rotuloNoContextoId);

  // Acao `deleted_term_taxonomy` (`:2211`) — declarada. Repare que ela dispara
  // ANTES do `DELETE` de `terms`.

  // `if ( ! $wpdb->get_var( "SELECT COUNT(*) ... WHERE term_id = %d" ) )`
  // (`:2214`): a contagem e **depois** do `DELETE` acima, e e ela que decide se
  // o rotulo sobrevive. E a frase de CA-1.3 em SQL.
  const contextosRestantes =
    escopo.armazenamento.rotulosNoContexto.contarContextosDoRotulo(
      pedido.rotuloId,
    );

  if (contextosRestantes === 0) {
    // `$wpdb->delete( $wpdb->terms, array( 'term_id' => $term ) )` (`:2215`).
    escopo.armazenamento.rotulos.apagar(pedido.rotuloId);
  }

  // `clean_term_cache( $term, $taxonomy )` (`:2218`) — sem cache nesta arvore.
  // Acoes `delete_term` (`:2235`) e `delete_{$taxonomy}` (`:2256`) — declaradas.

  // `return true` (`:2258`).
  return true;
}
