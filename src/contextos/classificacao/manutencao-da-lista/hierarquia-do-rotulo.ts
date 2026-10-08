/**
 * **CA-4.2**: *"Contexto hierarquico aceita termo pai e mantem a arvore;
 * contexto plano recusa hierarquia"*.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4). Sao duas
 * coisas, e a segunda e a que a tarefa mais facilmente erra:
 *
 * | aqui | o que e | no legado |
 * |---|---|---|
 * | {@link paiAceitoNoContexto} | **a regra de CA-4.2**: qual pai uma linha daquele contexto pode guardar | `is_taxonomy_hierarchical( $taxonomy )` |
 * | {@link reposicionarRotuloNaHierarquia} | mover um rotulo ja existente de pai — o comando `reposicionarNaHierarquia` de `AGG-Termo` | `wp_update_term()` pelo caminho do `parent` |
 *
 * A **arvore** vive em `term_taxonomy.parent`, como UC-08 escreve no fluxo
 * alternativo *Taxonomia hierarquica*: *"Sistema aceita o termo pai e mantem a
 * arvore em `term_taxonomy.parent`"*. E das duas regras de negocio que `spec.md`
 * lista em US-1, a segunda vale aqui pelo avesso: dos **oito** contextos do
 * nucleo **so `category` e hierarquico** (`../registro/contextos-do-nucleo.ts`,
 * com o comentario *"O UNICO hierarquico dos oito. CA-4.2 depende disso"*), e
 * UC-08 fecha a outra metade — *"Tags nao tem hierarquia e nao tem termo
 * padrao"*.
 *
 * ---
 *
 * # 🔴 ONDE O CONTEXTO PLANO RECUSA A HIERARQUIA, E O QUE ESTA TAREFA FEZ
 *
 * **A instalacao do legado nao esta no disco desta maquina** — e o limite que
 * T007 registrou e que continua valendo: nao ha `wp-includes/taxonomy.php` para
 * abrir, e `parity_specs.md` ja registrava que o oraculo **executavel** tambem
 * nao existe (`oracleAvailable: false`; levanta-lo e T001 da feature `015`). Logo
 * **o ponto exato em que o legado recusa a hierarquia num contexto plano nao pode
 * ser reconferido aqui**, e o pacote nao o diz. O que o pacote diz, nas quatro
 * fontes que tocam o assunto:
 *
 * | fonte | o que diz |
 * |---|---|
 * | `spec.md`, CA-4.2 | *"contexto plano **recusa** hierarquia"* |
 * | `plan.md`, tabela *Contratos* | poe *"hierarquia em contexto plano"* na coluna de **erros** de *criar ou renomear rotulo* |
 * | UC-08, *Fluxos alternativos* | *"Tags nao tem hierarquia e nao tem termo padrao"* |
 * | `../armazenamento/rotulo-no-contexto.ts` (T002, merged) | *"Contexto plano grava `0` em toda linha, porque a hierarquia e recusada antes da gravacao (CA-4.2, regra de T009)"* |
 *
 * As quatro concordam no **efeito no banco** — toda linha de um contexto plano
 * tem `parent = 0` — e **nenhuma diz se o chamador recebe um erro ou se o pai e
 * simplesmente descartado**. As duas leituras escrevem a **mesma linha**; o que
 * muda e so o valor devolvido.
 *
 * **Esta tarefa descarta o pai e grava `0`**, e nao devolve erro. Tres razoes, e
 * nenhuma delas e gosto:
 *
 * 1. **Devolver erro exigiria inventar um codigo de `WP_Error` que o pacote nao
 *    nomeia.** Os quatro codigos deste caminho estao em
 *    `../rotulo-e-contexto/erro-de-termo.ts`, transcritos do legado com as
 *    mensagens byte a byte, e nenhum deles e este. `EC-05` fixa que *"o `msgid`
 *    em ingles **E** a chave do catalogo"*, logo um codigo novo com uma mensagem
 *    escrita aqui seria uma chave de catalogo que o legado nao tem — e
 *    `../rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts` ja fixou a
 *    doutrina: *"o P8 proibe remover superficie; **nao autoriza acrescentar**"*.
 * 2. **Recusar e a direcao proibida.** A resposta 2 de `questions.md` proibe que
 *    o modelo novo *"recuse hoje o que o legado aceita"*, e esta arvore ja
 *    recusou tres atalhos pela mesma razao (`substituir-vinculos.ts`,
 *    `rotulos-informados.ts`, `tipos-de-objeto-do-contexto.ts`). Entre as duas
 *    leituras, **descartar e a unica que nao arrisca essa direcao**: ela aceita a
 *    chamada e produz a linha que o legado produziria.
 * 3. **A recusa de CA-4.1 tambem mora na superficie, e nao no nucleo.** Nesta
 *    mesma historia a capacidade e cobrada pela **tela**
 *    (`permissao-na-gestao-de-rotulos.ts`) porque a funcao do nucleo nao a cobra.
 *    A leitura que reconcilia as quatro fontes sem divergencia e a mesma:
 *    **a superficie recusa, o nucleo grava `0`** — a tela de um contexto plano
 *    nem oferece campo de pai. Esta tarefa nao afirma que e essa a leitura certa;
 *    ela registra que e a que nao decide nada.
 *
 * **Para quem tiver o oraculo:** confira se `wp_insert_term()` e
 * `wp_update_term()` devolvem `WP_Error` com pai em contexto plano, ou se forcam
 * `0`. Se devolverem erro, entra um codigo em `erro-de-termo.ts` **com o `msgid`
 * do legado** e os dois pontos de entrada deste arquivo passam a devolve-lo; o
 * efeito no banco nao muda. Ha teste com 🔴 no nome fixando o comportamento de
 * hoje, para que a troca nao passe em silencio.
 *
 * # O que esta operacao NAO faz do caminho do `parent`, e de quem e
 *
 * | passo do legado | ancora | por que nao aqui |
 * |---|---|---|
 * | a recusa `missing_parent`, com `term_exists( $parent )` | `:3310`-`:3312` (tabela de T003 em `../rotulo-e-contexto/renomear-rotulo.ts`) | passa por `WP_Term_Query`, que e da feature `015` (T007), e o `msgid` da recusa **nao e reconferivel nesta arvore**. `plan.md` **nao** a lista entre os erros do contrato. ⚠️ Consequencia declarada: um pai que nao existe e **aceito e gravado**, deixando orfao — e `target_data_model.md` poe `term_taxonomy.parent → terms.term_id` com *"integridade **nenhuma**"*, e o **P5** chama o orfao de estado normal |
 * | o filtro `wp_update_term_parent` | `:3363` | barramento: `REQ-162` esta em `do-not-rewrite.md`, coluna `bloqueado` (P2). Declarado abaixo |
 * | `wp_check_term_hierarchy_for_loops()` | `:5109` | ⚠️ o corpo dela **nao e legivel nesta arvore** e ela delega a `wp_find_hierarchy_loop()`, que e de `wp-includes/functions.php` — plataforma, e nao existe aqui. Nenhum documento do pacote a descreve. Escreve-la de memoria seria inventar regra. Consequencia declarada: um pai que fecha ciclo e **aceito**. ⚠️ Que o ciclo e estado alcancavel no legado esta registrado no pacote: `BR-DESCARTAR-007` descreve o laco infinito da exportacao *"com um ciclo de pais"* — ali o defeito foi **descartado de proposito** (lista fechada de tres), e esta tarefa nao estende esse descarte nem o reproduz: ela so nao inventa a deteccao |
 * | a divisao de rotulo compartilhado (`_split_shared_term()`) | `:3383` | 🔴 **conflito aberto**, descrito no cabecalho de `../rotulo-e-contexto/renomear-rotulo.ts` e no `README.md` deste modulo. Esta operacao esta no mesmo lugar do fluxo que a renomeacao, e nao decide nada |
 *
 * # ⚠️ DUAS PORTAS PARA A MESMA FUNCAO DO LEGADO, e a nota e para a proxima onda
 *
 * `wp_update_term()` e **uma** funcao. T003 portou o caminho do **nome**
 * (`../rotulo-e-contexto/renomear-rotulo.ts`, CA-1.2) e esta tarefa porta o
 * caminho do **pai** (CA-4.2), em arquivos diferentes, porque cada criterio e de
 * uma tarefa e o arquivo de T003 esta merged com a suite dele. Os dois emitem a
 * **mesma** sequencia de dois comandos, com as mesmas ancoras:
 *
 * | # | comando | ancora | o que muda entre os dois caminhos |
 * |---|---|---|---|
 * | 1 | `UPDATE terms SET name, slug, term_group WHERE term_id` | `:3414` | o caminho do nome escreve o nome novo; este escreve o gravado |
 * | 2 | `UPDATE term_taxonomy SET term_id, taxonomy, description, parent WHERE term_taxonomy_id` | `:3446` | o caminho do nome escreve o pai gravado; este escreve o pai novo |
 *
 * 🔴 **Isto e duplicacao de sequencia, e ela esta declarada e nao resolvida.** A
 * doutrina deste modulo e contra duas copias da mesma regra — *"duas copias da
 * mesma regra divergiriam na primeira mudanca"* (`../termo-padrao/index.ts`) —, e
 * o conserto certo e **uma** `atualizarRotulo()` com os dois argumentos, como no
 * legado. Esta tarefa nao o fez porque unificar significa reescrever a operacao
 * publicada de T003 e a suite dela, que e entrega de outra tarefa; quem unificar
 * ja tem as duas metades no mesmo modulo e as ancoras lado a lado.
 *
 * ## Os pontos de extensao deste caminho, declarados e nao emitidos
 *
 * 🔴 Mesma razao de sempre (`REQ-162` em `do-not-rewrite.md`, coluna
 * `bloqueado`; nenhuma tarefa deste pacote constroi o barramento), e o **P2** poe
 * cada ponto no contrato publico *"com o nome, os argumentos, a ordem de disparo
 * e a capacidade de alterar o resultado"*. Sao **os onze de
 * `wp_update_term()`**, ja inventariados por T003 na tabela de
 * `../rotulo-e-contexto/renomear-rotulo.ts`, e este caminho acrescenta **um**
 * deles a conta de quem o emitira: o primeiro, que no caminho do nome nao dispara
 * porque nao ha pai informado —
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `wp_update_term_parent` | filtro | `$parent`, `$term_id`, `$taxonomy`, `$parsed_args`, `$args` | antes da verificacao de duplicata (`:3363`) — ⚠️ **muda o pai que vai gravado** |
 */

import type { ContextoDeClassificacao } from '../registro/index.js';
import { SEM_ROTULO_PAI } from '../armazenamento/index.js';
import {
  ehErroDeTermo,
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  obterTermo,
  type ErroDeTermo,
  type ParDoRotulo,
} from '../rotulo-e-contexto/index.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';

/**
 * **A regra de CA-4.2**, num lugar so: qual pai uma linha daquele contexto pode
 * guardar.
 *
 * Contexto hierarquico guarda o pai informado; contexto plano guarda
 * {@link SEM_ROTULO_PAI}, que e o `0` do DDL
 * (`wp-admin/includes/schema.php:79`) e e **sentinela, nao nulo** — `DB-SENT`
 * (`BR-MIGRAR-081`) e literal: *"`0` em coluna de referencia significa 'sem
 * vinculo', logo `WHERE pai IS NULL` nunca acusa orfao"*.
 *
 * Esta funcao e usada pelas **duas** operacoes que escrevem a coluna — criar
 * ({@link criarRotuloNoContexto}) e reposicionar
 * ({@link reposicionarRotuloNaHierarquia}) —, e e por isso que ela existe em vez
 * de um `if` repetido: CA-4.2 e **uma** regra, e duas copias dela divergiriam.
 *
 * Ver o bloco 🔴 do cabecalho sobre por que o pai de um contexto plano e
 * **descartado** em vez de recusado.
 */
export function paiAceitoNoContexto(
  contexto: ContextoDeClassificacao,
  rotuloPaiId: number | undefined,
): number {
  if (!contexto.hierarquico) {
    return SEM_ROTULO_PAI;
  }
  if (rotuloPaiId === undefined) {
    return SEM_ROTULO_PAI;
  }
  // `(int) $args['parent']`: o legado coage antes de comparar, e negativo nao e
  // tratado (a coluna e `unsigned` no DDL, e `DB-DEG` manda que a camada de
  // dados degrade, nao que o dominio antecipe).
  return Math.trunc(rotuloPaiId);
}

/** O que se pede para mover um rotulo de pai. */
export interface PedidoDeReposicionamento {
  /** `terms.term_id` — o rotulo, nao o rotulo no contexto. */
  readonly rotuloId: number;
  /**
   * O contexto em que a arvore e mantida.
   *
   * ⚠️ **A hierarquia e por contexto**, e isso e a feature: o mesmo rotulo pode
   * ter pai em `category` e nenhum em outro contexto, porque o pai e coluna de
   * `term_taxonomy` e nao de `terms`. E por isso que este campo e obrigatorio.
   */
  readonly contexto: string;
  /**
   * O pai novo, em `terms.term_id`. {@link SEM_ROTULO_PAI} tira o rotulo da
   * arvore.
   *
   * ⚠️ **Aponta para `terms.term_id` e nao para `term_taxonomy.term_taxonomy_id`**,
   * e isso e o erro do legado portado de proposito: `plan.md` o descreve —
   * *"o pai referencia o rotulo, nao o rotulo no contexto, o que obriga a voltar
   * de um para o outro a cada nivel da arvore"* — e T002 nao o corrigiu, pela
   * AD-11 e pelo *"zero colunas acrescentadas"* de `target_data_model.md`. Ver
   * `../armazenamento/rotulo-no-contexto.ts`.
   */
  readonly rotuloPaiId: number;
}

/**
 * O desfecho do reposicionamento: o par, ou o erro — **nunca excecao**.
 *
 * E a mesma forma de {@link ResultadoDaRenomeacao} (T003), porque e a mesma
 * funcao do legado: *"e o mesmo par de `wp_insert_term()`, e e por isso que o
 * legado trata as duas como a mesma forma de retorno"* ({@link ParDoRotulo}).
 */
export type ResultadoDoReposicionamento = ParDoRotulo | ErroDeTermo;

/**
 * Move um rotulo de pai naquele contexto — `wp_update_term()` pelo caminho do
 * `parent`, e o comando `reposicionarNaHierarquia` de `AGG-Termo`
 * (`target_domain_model.md`).
 *
 * **Permissao declarada: a capacidade que o contexto declara em
 * `capacidades.editarRotulos` (`$tax->cap->edit_terms`), e ela NAO e verificada
 * aqui** — exatamente como em {@link renomearRotulo} (T003), e pela mesma razao:
 * `wp_update_term()` nao tem `current_user_can` no corpo, e o nucleo a chama **sem
 * ator** em `register_taxonomy()` e em `wp_set_object_terms()`. Quem cobra e a
 * tela (`wp-admin/edit-tags.php:173`, que e o portao declarado em
 * `permissao-na-gestao-de-rotulos.ts`) e a API REST. Verificar aqui recusaria o
 * que o legado aceita (P1).
 *
 * Em contexto **plano** o pai informado e descartado e a linha fica com `0` — ver
 * o bloco 🔴 do cabecalho.
 */
export function reposicionarRotuloNaHierarquia(
  escopo: EscopoDeVinculoDeObjeto,
  pedido: PedidoDeReposicionamento,
): ResultadoDoReposicionamento {
  // 1. `if ( ! taxonomy_exists( $taxonomy ) )` (`:3266`).
  const registrado = escopo.contextos.obter(pedido.contexto);
  if (registrado === null) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  // 2. `$term = get_term( $term_id, $taxonomy )` (`:3272`), com as duas saidas
  //    que o legado distingue: erro repassado (`:3275`) e rotulo inexistente
  //    (`:3279`), que vira `invalid_term` e NAO `null`.
  const termo = obterTermo(escopo, pedido.rotuloId, pedido.contexto);

  if (ehErroDeTermo(termo)) {
    return termo;
  }

  if (termo === null) {
    return erroDeTermo('invalid_term', MENSAGENS_DE_ERRO_DE_TERMO.invalid_term);
  }

  // 3. `if ( '' === trim( $name ) )` (`:3307`-`:3308`). O portao continua valendo
  //    neste caminho porque o legado monta `$args` por
  //    `array_merge( $term, $args )` (`:3288`): quem informa so o pai chega a
  //    esta verificacao com o nome **gravado**. Um nome vazio no banco — `''` e
  //    ausencia, `DB-SENT` — recusa o reposicionamento, e isso e do legado.
  if (termo.nome.trim() === '') {
    return erroDeTermo(
      'empty_term_name',
      MENSAGENS_DE_ERRO_DE_TERMO.empty_term_name,
    );
  }

  // 4. `missing_parent` (`:3310`-`:3312`), o filtro `wp_update_term_parent`
  //    (`:3363`) e `wp_check_term_hierarchy_for_loops()` (`:5109`) — **nao
  //    portados**, cada um com a razao e a consequencia na tabela do cabecalho.

  // 5. **CA-4.2**: contexto plano guarda `0`.
  const rotuloPaiId = paiAceitoNoContexto(registrado, pedido.rotuloPaiId);

  // 6. O legado le o `term_taxonomy_id` de novo, com a cadeia dele, mesmo tendo
  //    o termo em maos (`:3380`) — e e essa leitura que alimenta o comando 2.
  const rotuloNoContextoId =
    escopo.armazenamento.rotulosNoContexto.idDoRotuloNoContexto(
      pedido.rotuloId,
      pedido.contexto,
    ) ?? 0;

  // 7. `_split_shared_term( $term_id, $tt_id )` (`:3383`) — NAO portada, mesma
  //    divergencia aberta que T003 declarou. Nada e decidido aqui.

  // 8. `UPDATE terms SET name, slug, term_group WHERE term_id` (`:3414`), com os
  //    tres valores **que ja estavam gravados**: no caminho do pai nenhum deles
  //    muda, e o comando sai do mesmo jeito porque `$args` os traz do
  //    `array_merge`. Omiti-lo mudaria a sequencia de comandos, que e o que a
  //    area 3 da Decisao 2 de `parity_specs.md` compara.
  escopo.armazenamento.rotulos.atualizar(pedido.rotuloId, {
    nome: termo.nome,
    slug: termo.slug,
    grupoDeSinonimos: termo.grupoDeSinonimos,
  });

  // 9. `UPDATE term_taxonomy SET term_id, taxonomy, description, parent WHERE
  //    term_taxonomy_id` (`:3446`) — as quatro colunas, e e **aqui** que a
  //    arvore se mantem (UC-08: *"mantem a arvore em `term_taxonomy.parent`"*).
  escopo.armazenamento.rotulosNoContexto.atualizar(rotuloNoContextoId, {
    rotuloId: pedido.rotuloId,
    contexto: pedido.contexto,
    descricao: termo.descricao,
    rotuloPaiId,
  });

  // 10. `return array( 'term_id' => $term_id, 'term_taxonomy_id' => $tt_id )`
  //     (`:3543`). O `term_id` devolvido e o que o filtro `term_id_filter`
  //     tiver deixado (`:3497`) — sem barramento, e o mesmo que entrou.
  return { rotuloId: pedido.rotuloId, rotuloNoContextoId };
}
