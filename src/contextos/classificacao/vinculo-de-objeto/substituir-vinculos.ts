/**
 * **CA-2.1**: *"A lista de termos enviada substitui integralmente os vinculos
 * daquele conteudo naquele contexto"*.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). E
 * `wp_set_object_terms()` (`wp-includes/taxonomy.php:2851`), que e a operacao
 * *"classificar conteudo"* da tabela **Contratos** do `plan.md` vista por dentro,
 * e sao os passos 4 e 5 do fluxo de UC-05.
 *
 * `plan.md` nao deixa margem: *"A substituicao integral da lista e contrato, nao
 * detalhe: enviar lista parcial remove o que nao veio"*. E o docblock do legado
 * diz o mesmo em duas linhas — *"Will replace all existing related terms in this
 * taxonomy"*, *"Passing an empty array will remove all related terms"*.
 *
 * ---
 *
 * # A SEQUENCIA DE COMANDOS, que e o que esta area compara
 *
 * O criterio de paridade desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e esta
 * operacao e a maior sequencia desta feature. Na ordem do legado:
 *
 * | # | o que | quando | anchor |
 * |---|---|---|---|
 * | 1 | o conjunto **anterior** de `term_taxonomy_id` | so se nao for acrescentar | `:2867` |
 * | 2 | por item: a leitura do par | por item que nao e vazio | `:2888` |
 * | 3 | por item: a leitura do vinculo existente | por item resolvido | `:2906` |
 * | 4 | por item: o `INSERT` do vinculo | so se o vinculo **nao** existia | `:2922` |
 * | 5 | a recontagem dos vinculos **novos** | so se houve algum | `:2946` |
 * | 6 | a traducao dos removidos para `term_id` | so se a diferenca nao e vazia | `:2954` |
 * | 7 | a remocao, que e outra operacao inteira | idem | `:2956` |
 * | 8 | o conjunto **final**, e o `INSERT` de ordem | so em contexto ordenavel | `:2970` e `:2986` |
 *
 * Tres coisas desta tabela que um porte faria diferente sem perceber, e as tres
 * sao observaveis:
 *
 * 1. **A recontagem do passo 5 e so dos vinculos NOVOS**, nao de todos os
 *    informados: `wp_update_term_count( $new_tt_ids, $taxonomy )`, e `$new_tt_ids`
 *    recebe apenas o que passou pelo `INSERT` (`:2938`). Recontar o que ja estava
 *    vinculado emitiria comando que o legado nao emite — e a contagem resultante
 *    seria a mesma, logo o defeito seria invisivel fora da sequencia.
 * 2. **A remocao recontar de novo, por dentro**: o passo 7 chama
 *    `wp_remove_object_terms()`, que tem a propria chamada de recontagem
 *    (`:3105`). Sao **duas** recontagens por operacao quando ha insercao e
 *    remocao, nao uma.
 * 3. **O passo 6 existe para desfazer o passo 1.** A diferenca e calculada em
 *    `term_taxonomy_id`, traduzida de volta para `term_id` por uma consulta
 *    (`:2954`) e so entao passada para a remocao, **que resolve cada `term_id`
 *    outra vez**. A volta e redundante e e do legado; encurta-la apagaria uma
 *    leitura da sequencia.
 *
 * # O que esta operacao NAO verifica, e isso e leitura e nao economia
 *
 * **Permissao exigida: nenhuma.** `wp_set_object_terms()` nao tem um
 * `current_user_can` no corpo, e o nucleo a chama **sem ator**: de
 * `wp_publish_post()` pelo laco do termo padrao (`wp-includes/post.php:5438`), de
 * `wp_insert_post()` (`:5054` e `:5106`) e da fila agendada, onde nao ha ninguem
 * autenticado. Quem cobra sao as superficies, e cada uma de um jeito:
 *
 * | superficie | onde | o que cobra |
 * |---|---|---|
 * | tela de edicao | `wp-includes/post.php:5105` | `$tax->cap->assign_terms`, por contexto, antes de chamar |
 * | API REST | `class-wp-rest-posts-controller.php:1730` | `assign_term` de **cada** termo informado que existe |
 * | XML-RPC | `class-wp-xmlrpc-server.php:1620` e `:1648` | `assign_terms` do contexto, e `edit_terms` para nomear termo novo |
 *
 * E **o contexto nao e verificado contra o tipo do objeto aqui**: a guarda e
 * `taxonomy_exists()` e nada mais (`:2856`). `is_object_in_taxonomy()` e cobrado
 * pelo chamador (`post.php:5054` e `:5058`), e e por isso que **CA-2.4** mora em
 * `classificar-conteudo.ts` e nao neste arquivo. Cobrar aqui recusaria o que o
 * legado aceita — por exemplo a classificacao de um marcador em `link_category`,
 * que e o dono da coluna polimorfica da juncao.
 *
 * ## Os pontos de extensao desta operacao, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` e **nenhuma
 * tarefa deste pacote constroi o barramento** (P2). Os desta operacao, na ordem,
 * com a contagem de disparos — que e metade do contrato:
 *
 * | ponto | tipo | argumentos | posicao e quantas vezes |
 * |---|---|---|---|
 * | `add_term_relationship` | acao | `$object_id`, `$tt_id`, `$taxonomy` | **imediatamente antes** de cada `INSERT`, uma vez por vinculo novo (`:2920`) |
 * | `added_term_relationship` | acao | `$object_id`, `$tt_id`, `$taxonomy` | imediatamente depois, idem (`:2940`) |
 * | `set_object_terms` | acao | `$object_id`, `$terms`, `$tt_ids`, `$taxonomy`, `$append`, `$old_tt_ids` | **uma vez**, no fim, e e o unico que ve o conjunto anterior (`:3007`) |
 *
 * Mais os quatro de `wp_remove_object_terms()` e da contagem, declarados nos
 * arquivos deles.
 */

import type { OrdemDaLeituraInversa } from '../armazenamento/index.js';
import {
  ehErroDeTermo,
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  obterTermo,
  type ErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import { recontarUsoDosRotulos } from './contagem-de-uso.js';
import type {
  ColaboracaoDoVinculo,
  EscopoDeVinculoDeObjeto,
} from './escopo-de-vinculo-de-objeto.js';
import { removerVinculosDoObjeto } from './remover-vinculos.js';
import {
  normalizarRotulosInformados,
  resolverRotuloInformado,
  type RotuloInformado,
} from './rotulos-informados.js';

/**
 * A primeira posicao que a escrita ordenada grava.
 *
 * O numero e do legado e e explicito: `++$term_order` sobre um `$term_order`
 * que nasce `0` (`wp-includes/taxonomy.php:2968` e `:2981`), logo o primeiro
 * vinculo da lista recebe `1` e nao `0` — e `0` e o valor de quem **nunca** passou
 * por este caminho ({@link SEM_ORDEM} em `../armazenamento/vinculo.ts`). O ponto
 * de configuracao nomeado que o **P6** exige e esta constante; o teste de borda
 * esta na suite de US-2.
 */
export const PRIMEIRA_ORDEM_DO_VINCULO = 1;

/**
 * `wp_get_object_terms( $object_id, $taxonomy, array( 'fields' => 'tt_ids', ... ) )`
 * — a leitura inversa, **com os dois passos que o legado tem**.
 *
 * A consulta devolve `term_id` e nao `term_taxonomy_id` (ver
 * {@link RepositorioDeVinculos.listarRotulosDoObjeto} em
 * `../armazenamento/vinculo.ts`), e e `populate_terms()` que completa cada termo
 * com `get_term( $term_id )` — **sem contexto** — e `format_terms()` que entao le
 * `term_taxonomy_id` de cada um (`class-wp-term-query.php:1123` e `:989`).
 *
 * Por isso o segundo passo aqui e {@link obterTermo}, que e o `get_term()` que
 * T003 portou, e nao uma segunda leitura do par: e dele que vem o comportamento
 * que um atalho perderia — `populate_terms()` **descarta** o que nao e termo
 * (`:1141`), logo um rotulo compartilhado entre dois contextos validos, que faz
 * `get_term()` devolver `ambiguous_term_id`, **desaparece do conjunto anterior** e
 * portanto nao entra na diferenca nem e removido. O mesmo vale para a linha cujo
 * contexto nenhum registro conhece, que devolve `invalid_taxonomy`.
 *
 * ⚠️ **A diferenca de sequencia e de cache, e e declarada.** O legado completa os
 * termos em **um** comando (`_prime_term_caches()`, `taxonomy.php:4165`) e depois
 * le cada um do cache; sem cache nesta arvore (borda 5 de
 * `target_architecture.md`, REQ-165 nao decidida), `obterTermo` emite a leitura
 * fundida **uma vez por rotulo**. O conjunto resultante e o mesmo; a contagem de
 * comandos nao. E a mesma ausencia que `../rotulo-e-contexto/` declarou em todas
 * as operacoes de US-1.
 */
function rotulosNoContextoDoObjeto(
  escopo: EscopoDeVinculoDeObjeto,
  objetoId: number,
  contexto: string,
  ordem: OrdemDaLeituraInversa,
): readonly number[] {
  const identificadores: number[] = [];

  for (const rotuloId of escopo.armazenamento.vinculos.listarRotulosDoObjeto(
    objetoId,
    contexto,
    ordem,
  )) {
    const lido = obterTermo(escopo, rotuloId);
    if (lido === null || ehErroDeTermo(lido)) {
      continue;
    }
    identificadores.push(lido.rotuloNoContextoId);
  }

  return identificadores;
}

/** O que se pede para classificar um objeto. */
export interface PedidoDeVinculo {
  /**
   * `term_relationships.object_id` — ⚠️ **objeto, nao conteudo**: conteudo ou
   * marcador, sem discriminador. Ver `../armazenamento/vinculo.ts`.
   */
  readonly objetoId: number;
  /** A lista informada, nas formas que {@link RotuloInformado} aceita. */
  readonly rotulos: readonly RotuloInformado[] | RotuloInformado;
  /** O contexto de classificacao, por nome. */
  readonly contexto: string;
  /**
   * `$append` — acrescentar em vez de substituir. Default `false`, que e o do
   * legado e o que CA-2.1 descreve.
   *
   * Com `true` o legado **nao le o conjunto anterior**, **nao remove nada** e
   * **nao grava ordem**: as tres coisas estao dentro de `if ( ! $append )`
   * (`:2866`, `:2949` e `:2965`). Esta no tipo porque e parametro publicado (P8),
   * e tem teste proprio, porque a diferenca e de tres comandos.
   */
  readonly acrescentar?: boolean;
}

/**
 * O que a operacao devolve: os `term_taxonomy_id` dos rotulos **afetados**, ou o
 * erro.
 *
 * E o `$tt_ids` do legado (`:3009`), e ele **nao** e o conjunto final de
 * vinculos: e a lista do que foi informado e resolvido, na ordem em que foi
 * informado, incluindo o que ja estava vinculado. Quem quer o conjunto final le a
 * juncao.
 */
export type ResultadoDoVinculo = readonly number[] | ErroDeTermo;

/**
 * Substitui integralmente os vinculos de um objeto num contexto —
 * `wp_set_object_terms()`.
 *
 * **Permissao exigida: nenhuma** — ver a secao do cabecalho. Erro: apenas
 * `invalid_taxonomy`, e e o unico que o legado devolve antes de tocar o banco.
 */
export function substituirVinculosDoObjeto(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoVinculo,
  pedido: PedidoDeVinculo,
): ResultadoDoVinculo {
  // `$object_id = (int) $object_id` (`:2854`), antes de tudo.
  const objetoId = Math.trunc(pedido.objetoId);
  const acrescentar = pedido.acrescentar ?? false;

  // `if ( ! taxonomy_exists( $taxonomy ) )` (`:2856`).
  if (!escopo.contextos.existe(pedido.contexto)) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  const informados = normalizarRotulosInformados(pedido.rotulos);

  // 1. O conjunto anterior, **so** quando nao e acrescentar (`:2866`-`:2878`).
  //    Com `$append` o legado nao emite esta leitura: `$old_tt_ids = array()`.
  const rotulosNoContextoAnteriores = acrescentar
    ? []
    : rotulosNoContextoDoObjeto(escopo, objetoId, pedido.contexto, 'nenhuma');

  const afetados: number[] = [];
  const novos: number[] = [];

  // 2. O laco do legado (`:2883`-`:2943`), item por item e na ordem informada.
  for (const informado of informados) {
    const resolucao = resolverRotuloInformado(
      escopo,
      informado,
      pedido.contexto,
    );

    if (resolucao.situacao === 'vazio' || resolucao.situacao === 'inexistente') {
      // `continue` do legado, nos dois casos (`:2885` e `:2893`).
      continue;
    }

    if (resolucao.situacao === 'por-nome') {
      // 🔴 Aqui o legado chama `wp_insert_term( $term, $taxonomy )` (`:2896`) e,
      // se ela devolver `WP_Error`, **interrompe a operacao inteira** devolvendo
      // o erro (`:2899`-`:2901`). Nem `term_exists()` nem `wp_insert_term()`
      // existem nesta arvore — as duas sao de T009 e da feature 015, e a analise
      // esta no cabecalho de `rotulos-informados.ts`. Enquanto nao existirem, o
      // rotulo informado por nome e saltado, e **nenhum comando sai por ele**.
      continue;
    }

    const { rotuloNoContextoId } = resolucao.par;
    afetados.push(rotuloNoContextoId);

    // 3. `if ( $wpdb->get_var( ... ) ) { continue; }` (`:2906`): o vinculo que ja
    //    existe nao e inserido de novo, e nao conta como novo.
    if (
      escopo.armazenamento.vinculos.existe({ objetoId, rotuloNoContextoId })
    ) {
      continue;
    }

    // 4. `$wpdb->insert( ... )` (`:2922`), com DUAS colunas: `term_order` nao e
    //    mencionada e recebe o `0` do DDL.
    escopo.armazenamento.vinculos.inserir({ objetoId, rotuloNoContextoId });
    novos.push(rotuloNoContextoId);
  }

  // 5. `if ( $new_tt_ids ) { wp_update_term_count( $new_tt_ids, $taxonomy ); }`
  //    (`:2945`): so os NOVOS, e nao os afetados.
  if (novos.length > 0) {
    recontarUsoDosRotulos(escopo, colaboracao, novos, pedido.contexto);
  }

  // 6 e 7. A diferenca, a volta para `term_id` e a remocao (`:2949`-`:2962`).
  if (!acrescentar) {
    const paraRemover = rotulosNoContextoAnteriores.filter(
      (id) => !afetados.includes(id),
    );

    if (paraRemover.length > 0) {
      const rotulosParaRemover =
        escopo.armazenamento.rotulosNoContexto.listarRotulosPorIdsNoContexto(
          pedido.contexto,
          paraRemover,
        );

      const removida = removerVinculosDoObjeto(escopo, colaboracao, {
        objetoId,
        rotulos: rotulosParaRemover,
        contexto: pedido.contexto,
      });

      // `if ( is_wp_error( $remove ) ) { return $remove; }` (`:2959`). A remocao
      // devolve `false` quando nao havia o que remover, e `false` **nao** e erro:
      // o legado segue adiante com ele.
      if (typeof removida !== 'boolean') {
        return removida;
      }
    }
  }

  // 8. O ramo ordenavel: `if ( ! $append && isset( $t->sort ) && $t->sort )`
  //    (`:2965`). ⚠️ Nulo nos oito contextos do nucleo, logo este ramo e **codigo
  //    sem chamador de fabrica** — portado porque existir sem ser chamado e parte
  //    do que se clona (resposta 7 de `questions.md`, P8).
  const registrado = escopo.contextos.obter(pedido.contexto);
  if (!acrescentar && registrado !== null && registrado.ordenar === true) {
    // A segunda leitura inversa, e ela **nao** pede `orderby => none`: cai no
    // default `name` (`:2970`-`:2975`). Ver `OrdemDaLeituraInversa`.
    const rotulosNoContextoFinais = rotulosNoContextoDoObjeto(
      escopo,
      objetoId,
      pedido.contexto,
      'nome',
    );

    // `foreach ( $tt_ids as $tt_id ) { if ( in_array( $tt_id, $final_tt_ids ) ) }`
    // (`:2979`): a ordem e a dos **informados**, filtrada por quem sobreviveu.
    let ordem = PRIMEIRA_ORDEM_DO_VINCULO - 1;
    const ordenados = afetados
      .filter((id) => rotulosNoContextoFinais.includes(id))
      .map((rotuloNoContextoId) => {
        ordem += 1;
        return { rotuloNoContextoId, ordem };
      });

    // Lista vazia nao emite comando: `if ( $values )` (`:2985`).
    escopo.armazenamento.vinculos.gravarOrdem(objetoId, ordenados);
  }

  // `wp_cache_delete( $object_id, $taxonomy . '_relationships' )` e
  // `wp_cache_set_terms_last_changed()` (`:2992`-`:2993`) — nao ha cache nesta
  // arvore (borda 5 de `target_architecture.md`, REQ-165 nao decidida).

  // `return $tt_ids` (`:3009`).
  return afetados;
}
