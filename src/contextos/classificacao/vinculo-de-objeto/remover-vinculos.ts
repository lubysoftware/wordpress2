/**
 * A outra metade de **CA-2.1**: o que a lista enviada **nao** trouxe sai.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). E
 * `wp_remove_object_terms()` (`wp-includes/taxonomy.php:3038`), que e a operacao
 * *"remover vinculo"* da tabela **Contratos** do `plan.md` — *"identificador do
 * conteudo, contexto, rotulo | vinculo removido, contagens atualizadas | erros:
 * nenhum"*.
 *
 * Ela e chamada de **dois** lugares, e os dois importam para a sequencia:
 * de dentro de `wp_set_object_terms()`, com a diferenca entre o conjunto anterior
 * e o informado (`:2956`), e direto por quem quer tirar um rotulo de um conteudo
 * (`wp_remove_object_terms()` e API publica, P8).
 *
 * ---
 *
 * # A sequencia, e os tres pontos em que ela NAO emite comando
 *
 * | # | o que | quando | anchor |
 * |---|---|---|---|
 * | 1 | por item: a leitura do par | por item que nao e vazio | `:3058` |
 * | 2 | o `DELETE` do lote, **num comando so** | so se sobrou identificador | `:3088` |
 * | 3 | a recontagem dos removidos | idem | `:3105` |
 *
 * O `DELETE` e **um comando para a lista inteira**, com `term_taxonomy_id IN
 * (...)`, e nao um por vinculo: a sequencia de comandos e observavel, e a area 3
 * da Decisao 2 de `parity_specs.md` a compara.
 *
 * E as tres ausencias de comando sao parte do contrato: nada sai quando o contexto
 * nao esta registrado (devolve erro antes), quando a lista chega vazia, e quando
 * nenhum item da lista resolveu — nesse ultimo caso a funcao devolve `false`
 * (`:3110`), que **nao e erro** e e o que `wp_set_object_terms()` deixa passar
 * adiante.
 *
 * # ⚠️ Uma degradacao do legado que esta portada como degradacao
 *
 * O laco do legado (`:3053`-`:3071`) tem um ramo que nao faz o que parece:
 *
 * ```php
 * $term_info = term_exists( $term, $taxonomy );
 * if ( ! $term_info ) {
 *     // Skip if a non-existent term ID is passed.
 *     if ( is_int( $term ) ) {
 *         continue;
 *     }
 * }
 * // ... sem else:
 * $tt_ids[] = $term_info['term_taxonomy_id'];
 * ```
 *
 * Para um rotulo informado **por nome** que nao existe, `$term_info` e `null` e a
 * execucao **cai na linha de baixo**: o legado le `['term_taxonomy_id']` de
 * `null`, o que em PHP 8 e um aviso e produz `null`, e **acrescenta `null` ao
 * lote**. O `DELETE` resultante compara `term_taxonomy_id` com cadeia vazia e nao
 * encontra linha nenhuma, mas o comando **sai** e a recontagem **roda**. Nao ha
 * `is_int` protegendo o caminho do nome porque, no legado, a remocao por nome e
 * usada por quem ja sabe que o nome existe.
 *
 * Esta operacao **nao reproduz o aviso nem o `null` no lote**, e a razao e que ela
 * nao tem como chegar ali: {@link resolverRotuloInformado} devolve `'por-nome'`
 * para toda cadeia, porque `term_exists()` por apelido e por nome nao existe nesta
 * arvore (ver `rotulos-informados.ts`). Quando a resolucao por nome chegar com
 * T009, **este ramo e que tem de decidir**: o legado degrada, e `DB-DEG`
 * (BR-MIGRAR-083) manda reproduzir a degradacao, nao consertar. Fica declarado
 * aqui para que a tarefa que o alcancar nao o "limpe" por simetria com
 * `wp_set_object_terms()`, que nesse mesmo ponto **cria** o termo.
 *
 * ## Os pontos de extensao desta operacao, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` (P2). Os dois
 * desta operacao disparam **uma vez para o lote**, e nao um por vinculo — a
 * assimetria com os dois de `wp_set_object_terms()` e do legado e e contrato:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `delete_term_relationships` | acao | `$object_id`, `$tt_ids`, `$taxonomy` | antes do `DELETE`, uma vez (`:3086`) |
 * | `deleted_term_relationships` | acao | `$object_id`, `$tt_ids`, `$taxonomy` | depois dele, uma vez (`:3103`) |
 */

import {
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  type ErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import { recontarUsoDosRotulos } from './contagem-de-uso.js';
import type {
  ColaboracaoDoVinculo,
  EscopoDeVinculoDeObjeto,
} from './escopo-de-vinculo-de-objeto.js';
import {
  resolverRotuloInformado,
  type RotuloInformado,
} from './rotulos-informados.js';

/** O que se pede para remover vinculos de um objeto num contexto. */
export interface PedidoDeRemocaoDeVinculo {
  /** `term_relationships.object_id` — objeto, nao conteudo. */
  readonly objetoId: number;
  /**
   * Os rotulos a remover, por **identificador de rotulo** (`term_id`) e nao por
   * identificador no contexto.
   *
   * E assim que `wp_set_object_terms()` a chama: ele calcula a diferenca em
   * `term_taxonomy_id`, traduz de volta para `term_id` (`:2954`) e passa os
   * `term_id`, que esta operacao resolve **outra vez** para `term_taxonomy_id`.
   * A volta e do legado; ver a nota em
   * `../armazenamento/rotulo-no-contexto.ts`.
   */
  readonly rotulos: readonly RotuloInformado[];
  readonly contexto: string;
}

/**
 * O desfecho: `true` quando o `DELETE` saiu, `false` quando nao havia o que
 * remover, ou o erro.
 *
 * Os tres sao os tres retornos do legado (`bool|WP_Error`), e `false` **nao e
 * erro**: e o `return false` de `:3110`, que `wp_set_object_terms()` recebe e
 * ignora. Um porte que unificasse `false` com erro interromperia a substituicao
 * integral no caso em que o legado a conclui.
 */
export type ResultadoDaRemocaoDeVinculo = boolean | ErroDeTermo;

/**
 * Remove vinculos de um objeto num contexto — `wp_remove_object_terms()`.
 *
 * **Permissao exigida: nenhuma**, pelo mesmo motivo de
 * `substituir-vinculos.ts`: a funcao do legado nao verifica capacidade e e
 * chamada pelo nucleo sem ator. Quem cobra e a superficie — a API REST pergunta
 * `assign_term` de cada termo (`class-wp-rest-posts-controller.php:1730`), e o
 * XML-RPC pergunta `assign_terms` do contexto (`:2679`).
 */
export function removerVinculosDoObjeto(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoVinculo,
  pedido: PedidoDeRemocaoDeVinculo,
): ResultadoDaRemocaoDeVinculo {
  // `$object_id = (int) $object_id` (`:3041`).
  const objetoId = Math.trunc(pedido.objetoId);

  // `if ( ! taxonomy_exists( $taxonomy ) )` (`:3043`).
  if (!escopo.contextos.existe(pedido.contexto)) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  const rotulosNoContexto: number[] = [];

  for (const informado of pedido.rotulos) {
    const resolucao = resolverRotuloInformado(
      escopo,
      informado,
      pedido.contexto,
    );

    // `'' === trim( $term )` e o `is_int` do identificador inexistente saem com
    // `continue` (`:3054` e `:3061`); a cadeia que nao resolve cai na degradacao
    // declarada no cabecalho, e nesta arvore nao chega aqui.
    if (resolucao.situacao !== 'resolvido') {
      continue;
    }

    rotulosNoContexto.push(resolucao.par.rotuloNoContextoId);
  }

  // `if ( $tt_ids )` (`:3073`): sem identificador, nenhum comando sai e a funcao
  // devolve `false` (`:3110`).
  if (rotulosNoContexto.length === 0) {
    return false;
  }

  const removidas = escopo.armazenamento.vinculos.apagar(
    objetoId,
    rotulosNoContexto,
  );

  // `wp_cache_delete( $object_id, $taxonomy . '_relationships' )` e
  // `wp_cache_set_terms_last_changed()` (`:3090`-`:3091`) — nao ha cache nesta
  // arvore.

  // `wp_update_term_count( $tt_ids, $taxonomy )` (`:3105`) — **depois** do
  // `DELETE`, e e por isso que a contagem nova ja nao conta a linha apagada.
  recontarUsoDosRotulos(
    escopo,
    colaboracao,
    rotulosNoContexto,
    pedido.contexto,
  );

  // `return (bool) $deleted` (`:3107`): o legado devolve a verdade do que o
  // comando informou, e `0` linha afetada devolve `false` **mesmo tendo emitido o
  // comando e recontado**.
  return removidas !== 0;
}
