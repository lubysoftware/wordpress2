/**
 * **CA-1.1**: *"Um rotulo existe uma vez e pode pertencer a mais de um contexto
 * de classificacao ao mesmo tempo"*.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo` (US-1), e e a
 * leitura que T002 deixou nomeada para esta tarefa (`../armazenamento/termo.ts`,
 * secao *Por que a leitura devolve uma lista, e nao um termo*): *"Essas quatro
 * saidas sao de T003 (US-1): elas dependem do registro de contextos, que e
 * `../registro/`, e nao do banco"*.
 *
 * | aqui | no legado |
 * |---|---|
 * | {@link obterTermo} | `get_term( $term, $taxonomy )`, `wp-includes/taxonomy.php:977`, sobre `WP_Term::get_instance()`, `wp-includes/class-wp-term.php:111` |
 * | {@link sanitizarTermoCru} | `sanitize_term( $_term, $taxonomy, 'raw' )`, `taxonomy.php:1734`, no contexto `raw` de `sanitize_term_field()` (`:1786`) |
 *
 * ---
 *
 * # Por que esta leitura e a prova de CA-1.1
 *
 * O rotulo e **uma** linha de `terms`; a presenca dele num contexto e **uma**
 * linha de `term_taxonomy` por contexto. A consulta do legado nao tem `LIMIT 1`,
 * e o comentario imediatamente acima dela diz por que: *"Grab all matching
 * terms, in case any are shared between taxonomies."*
 * (`class-wp-term.php:131`). Logo **um rotulo em dois contextos devolve duas
 * linhas**, e o que este arquivo faz e exatamente o que o legado faz com elas:
 *
 * 1. **contexto pedido**: devolve a linha daquele contexto, se houver
 *    (`:138`-`:146`);
 * 2. **uma linha so**: e essa (`:147`-`:150`);
 * 3. **mais de uma, sem contexto pedido**: ignora as linhas cujo contexto
 *    ninguem registrou e, se sobrar **mais de uma valida**, devolve
 *    `ambiguous_term_id` (`:152`-`:164`). Se sobrar uma, e essa — *"If the term
 *    is shared only with invalid taxonomies, return the one valid term"*;
 * 4. **a linha escolhida nomeia contexto nao registrado**: `invalid_taxonomy`
 *    (`:172`-`:174`).
 *
 * As quatro saidas, mais os dois portoes de `get_term()` — identificador vazio e
 * contexto pedido nao registrado —, sao o contrato desta funcao.
 *
 * # 🔴 O estado que CA-1.1 descreve existe no esquema, e NENHUMA operacao do
 * legado 7.1.2 o cria
 *
 * Isto e leitura do codigo analisado, e vale escrever inteiro porque muda o que
 * um teste de US-1 pode afirmar:
 *
 * - `wp_insert_term()` **sempre insere uma linha nova em `terms`** e so depois
 *   procura o par `(term_id, taxonomy)` — com o identificador que acabou de
 *   gerar, de modo que a busca nunca encontra nada (`taxonomy.php:2622`-`:2658`).
 *   Nao ha, na funcao, nenhum caminho que reaproveite o `term_id` de um rotulo
 *   existente para um segundo contexto;
 * - `wp_set_object_terms()` resolve o rotulo por `term_exists( $term, $taxonomy )`
 *   (`:2888`), que e **por contexto**: um rotulo que exista so em `category`
 *   nao e encontrado ao classificar em `post_tag`, e a funcao cria outro
 *   (`:2894`);
 * - o rotulo compartilhado e, no legado de hoje, **dado herdado**: ele vinha de
 *   instalacoes anteriores a divisao de rotulos, e desde entao existe a
 *   maquinaria que o **desfaz** (`_split_shared_term()`, `:4313`;
 *   `_wp_batch_split_terms()`, `:4447`; `wp_term_is_shared()`, `:4689`). E o
 *   `upgrade_230()`, que criou esses dados, esta em
 *   [`discard_log.md`](../../../../.specify/migration/discard_log.md) entre os
 *   38 portoes historicos descartados.
 *
 * Logo o estado de CA-1.1 e **representavel e legivel** — e e por isso que esta
 * funcao tem os quatro ramos —, mas numa instalacao nova (Pergunta 2: *"partindo
 * de instalacao nova, sem dado a migrar"*) ele so aparece por escrita direta no
 * armazenamento, que e como o legado tambem o aceita. **Esta tarefa nao inventa
 * uma operacao que o crie**: inventa-la seria produzir comportamento que o
 * legado nao tem, e o P1 chama isso de divergencia, nao de melhoria. O que a
 * suite de US-1 faz e montar o estado pelo armazenamento de T002 — a linha no
 * banco — e afirmar a leitura, a renomeacao e a remocao sobre ela.
 *
 * # O que este arquivo nao faz do legado, e de quem e
 *
 * | passo do legado | onde | por que nao aqui |
 * |---|---|---|
 * | `wp_cache_get( $term_id, 'terms' )` e `wp_cache_add()` | `class-wp-term.php:124` e `:180` | nao ha cache nesta arvore (borda 5 de `target_architecture.md`, REQ-165 nao decidida). ⚠️ Note que o legado **nao guarda em cache rotulo compartilhado** (`if ( 1 === count( $terms ) )`): sem cache, o ramo e o mesmo para os dois |
 * | os filtros `get_term` e `get_{$taxonomy}` | `taxonomy.php:1021` e `:1040` | **P2**, contrato publico sem barramento para emitir (`REQ-162` em `do-not-rewrite.md`). Declarados abaixo, com argumentos e posicao |
 * | os contextos `edit`, `db`, `display`, `rss`, `attribute` e `js` de `sanitize_term()` | `taxonomy.php:1786`-`:1960` | cada um e uma **cadeia de filtros** mais `esc_html`/`esc_attr`: barramento (REQ-162) e escape de tela (BC-10). So o contexto `raw`, que nao filtra nada, e portado — ver {@link sanitizarTermoCru} |
 * | os ramos de objeto de `get_term()` (`$term instanceof WP_Term`, `is_object( $term )`) | `taxonomy.php:987`-`:995` | aceitam um termo ja lido no lugar do identificador. Nao ha objeto de termo circulando nesta arvore, e o ramo nao muda saida nenhuma: quem o portar, porta junto o `filter` do objeto |
 * | `get_term_by( $campo, $valor, $contexto )` | `taxonomy.php:1099` | e a leitura **por slug, nome ou `term_taxonomy_id`**, e desde 4.4 ela passa por `WP_Term_Query`. A consulta de termos por filtro e de **T009** e da camada de dados da feature 015 — ver `../armazenamento/termo.ts` |
 * | `wp_term_is_shared( $term_id )` | `taxonomy.php:4689` | le a opcao `finished_splitting_shared_terms` **antes** de contar, e devolve `false` sem consultar o banco quando ela esta gravada. Nao ha porta de opcoes nesta feature (T007 traz a primeira), e a contagem crua ja existe em `contarContextosDoRotulo` |
 *
 * ## Os pontos de extensao desta leitura, declarados e nao emitidos
 *
 * 🔴 Mesma razao de sempre (`REQ-162` em `do-not-rewrite.md`, coluna
 * `bloqueado`; nenhuma tarefa deste pacote constroi o barramento). Os dois desta
 * leitura, na ordem e com o que cada um pode mudar:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `get_term` | filtro | `$_term`, `$taxonomy` | depois da resolucao e **antes** da sanitizacao do contexto pedido (`taxonomy.php:1021`) |
 * | `get_{$taxonomy}` | filtro | `$_term`, `$taxonomy` | imediatamente depois, por contexto (`:1040`) |
 *
 * ⚠️ Os dois podem **trocar o tipo do valor devolvido**, e o legado conta com
 * isso: logo apos eles ha `if ( ! ( $_term instanceof WP_Term ) ) { return
 * $_term; }` (`:1044`), que devolve ao chamador o que o interceptador puser no
 * lugar. Quem construir o barramento encaixa os dois aqui **com** essa saida.
 */

import type { Termo } from '../armazenamento/index.js';
import {
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  type ErroDeTermo,
} from './erro-de-termo.js';
import type { EscopoDeRotuloEContexto } from './escopo-de-rotulo-e-contexto.js';

/**
 * O que a leitura de um rotulo devolve, nas tres formas que o legado distingue.
 *
 * `null` e o `false` de `WP_Term::get_instance()` traduzido por `get_term()`
 * (`taxonomy.php:1001`-`:1002`: `elseif ( ! $_term ) { return null; }`), e e
 * **diferente** de erro: rotulo que nao existe nao e falha.
 */
export type RotuloLido = Termo | null | ErroDeTermo;

/**
 * `(int)` com o piso em zero dos campos inteiros, que e tudo o que o contexto
 * `raw` de `sanitize_term_field()` faz (`taxonomy.php:1787`-`:1799`).
 *
 * ⚠️ **O piso e observavel**, e nao e defensividade: `terms.term_group` e
 * `term_taxonomy.count` sao `bigint(10)` **com sinal** no DDL
 * (`wp-admin/includes/schema.php:69` e `:81`) e nada impede um numero negativo
 * gravado por fora. O legado devolve `0` nesse caso, para os seis campos
 * inteiros que ele lista — e uma leitura que devolvesse `-1` mostraria na
 * interface um numero que o legado nunca mostra.
 */
function inteiroCruDoTermo(valor: number): number {
  // `$value = (int) $value; if ( $value < 0 ) { $value = 0; }`
  return valor < 0 ? 0 : valor;
}

/**
 * `sanitize_term( $termo, $contexto, 'raw' )` — a unica das sete formas de
 * sanitizacao que esta tarefa porta.
 *
 * No contexto `raw` o legado **nao filtra e nao escapa nada**: a funcao coage os
 * seis campos inteiros (`parent`, `term_id`, `count`, `term_group`,
 * `term_taxonomy_id`, `object_id`) e devolve os de texto como estao
 * (`taxonomy.php:1798`: `if ( 'raw' === $context ) { return $value; }`). E por
 * isso que e portavel inteira aqui: ela nao atravessa barramento nenhum.
 *
 * O `filter = 'raw'` que o legado grava no objeto nao viaja: ele existe para que
 * `WP_Term::filter()` saiba se precisa re-sanitizar, e `{@link Termo}` nao tem
 * esse campo porque nao ha os outros seis contextos nesta arvore.
 */
export function sanitizarTermoCru(termo: Termo): Termo {
  return {
    ...termo,
    rotuloId: inteiroCruDoTermo(termo.rotuloId),
    rotuloNoContextoId: inteiroCruDoTermo(termo.rotuloNoContextoId),
    rotuloPaiId: inteiroCruDoTermo(termo.rotuloPaiId),
    contagemDeUso: inteiroCruDoTermo(termo.contagemDeUso),
    grupoDeSinonimos: inteiroCruDoTermo(termo.grupoDeSinonimos),
  };
}

/**
 * Le um rotulo, opcionalmente dentro de um contexto — `get_term()` sobre
 * `WP_Term::get_instance()`.
 *
 * **Permissao exigida: nenhuma.** E leitura, e o legado nao verifica capacidade
 * em `get_term()` nem em `WP_Term::get_instance()`: quem cobra e a superficie
 * que pede (a tela de termos cobra `manage_terms`, `wp-admin/edit-tags.php:26`,
 * e isso e **CA-4.1**, de T009). Declara-la aqui recusaria leitura que o legado
 * faz em pagina publica, inclusive sem ninguem autenticado — o **P4** manda
 * declarar a permissao de toda operacao exposta, e a declaracao desta e que ela
 * nao tem.
 *
 * Contexto ausente e contexto `''` sao a **mesma coisa**, como no legado: o
 * `$taxonomy` do legado nasce `''` e as duas guardas que o consultam sao
 * `if ( $taxonomy && ... )` (`taxonomy.php:982`) e `if ( $taxonomy )`
 * (`class-wp-term.php:138`) — cadeia vazia e falsa nas duas.
 */
export function obterTermo(
  escopo: EscopoDeRotuloEContexto,
  rotuloId: number,
  contexto?: string,
): RotuloLido {
  // `if ( empty( $term ) ) { return new WP_Error( 'invalid_term', ... ) }`
  // (`taxonomy.php:978`). Zero cai aqui; negativo **nao** cai, e segue para a
  // consulta, que nao devolve linha — e o `! $term_id` de
  // `class-wp-term.php:120`, que devolve `false`, logo `null`.
  if (rotuloId === 0 || Number.isNaN(rotuloId)) {
    return erroDeTermo('invalid_term', MENSAGENS_DE_ERRO_DE_TERMO.invalid_term);
  }

  const contextoPedido =
    contexto === undefined || contexto === '' ? null : contexto;

  // `if ( $taxonomy && ! taxonomy_exists( $taxonomy ) )` (`:982`).
  if (contextoPedido !== null && !escopo.contextos.existe(contextoPedido)) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  // `WP_Term::get_instance( $term, $taxonomy )` (`:996`). Sem cache nesta
  // arvore, a condicao `if ( ! $_term || ... )` de `class-wp-term.php:127` e
  // sempre verdadeira: a leitura vai ao banco.
  const linhas = escopo.armazenamento.termos.obterPorRotulo(rotuloId);

  // `if ( ! $terms ) { return false; }` (`class-wp-term.php:133`), e `get_term()`
  // traduz o `false` em `null` (`taxonomy.php:1001`).
  if (linhas.length === 0) {
    return null;
  }

  let escolhida: Termo | null = null;

  if (contextoPedido !== null) {
    // `if ( $taxonomy ) { foreach ... if ( $taxonomy === $match->taxonomy ) }`
    // (`class-wp-term.php:138`-`:146`): a PRIMEIRA linha daquele contexto, e o
    // `break` importa porque a unicidade `(term_id, taxonomy)` e do banco, nao
    // desta leitura.
    for (const linha of linhas) {
      if (linha.contexto === contextoPedido) {
        escolhida = linha;
        break;
      }
    }
  } else if (linhas.length === 1) {
    // `elseif ( 1 === count( $terms ) ) { $_term = reset( $terms ); }` (`:147`).
    escolhida = linhas[0] ?? null;
  } else {
    // O rotulo e compartilhado entre contextos (`:152`-`:164`). O legado
    // **ignora** as linhas de contexto nao registrado e so acusa ambiguidade se
    // sobrar mais de uma valida: "If the term is shared only with invalid
    // taxonomies, return the one valid term."
    for (const linha of linhas) {
      if (!escopo.contextos.existe(linha.contexto)) {
        continue;
      }
      if (escolhida !== null) {
        return erroDeTermo(
          'ambiguous_term_id',
          MENSAGENS_DE_ERRO_DE_TERMO.ambiguous_term_id,
          rotuloId,
        );
      }
      escolhida = linha;
    }
  }

  // `if ( ! $_term ) { return false; }` (`:167`): contexto pedido que o rotulo
  // nao serve, e rotulo compartilhado so entre contextos invalidos, caem aqui.
  if (escolhida === null) {
    return null;
  }

  // `if ( ! taxonomy_exists( $_term->taxonomy ) )` (`:172`). Com contexto
  // pedido a guarda ja passou acima; ela pega o caminho da linha unica, que e a
  // linha tolerada de que fala `../armazenamento/rotulo-no-contexto.ts`.
  if (!escopo.contextos.existe(escolhida.contexto)) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  // `sanitize_term( $_term, $_term->taxonomy, 'raw' )` (`:176`).
  return sanitizarTermoCru(escolhida);
}

/**
 * ⚠️ **Nao existe aqui uma funcao "contextos em que o rotulo serve", e a
 * ausencia e deliberada.** A pergunta e de CA-1.1, mas o legado ja a responde
 * por duas cadeias que T002 portou — `SELECT COUNT(*) FROM term_taxonomy WHERE
 * term_id` (`taxonomy.php:2214`, em `contarContextosDoRotulo`) e `SELECT
 * taxonomy FROM term_taxonomy WHERE term_id` (`:4395`, em
 * `listarContextosDoRotulo`). Uma terceira funcao, sobre a leitura fundida,
 * seria uma segunda forma de perguntar a mesma coisa com outra consulta: nao
 * esta no legado e nao se inventa (P8 proibe remover superficie; nao autoriza
 * acrescentar). Quem precisa da lista usa as de `../armazenamento/`.
 */
