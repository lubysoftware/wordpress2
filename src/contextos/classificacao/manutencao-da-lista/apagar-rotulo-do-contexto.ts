/**
 * **CA-4.3** (*"Apagar um termo em uso remove o vinculo e nao apaga o
 * conteudo"*), **CA-4.4** (*"Conteudo que fica sem termo algum num contexto com
 * padrao recebe o padrao"*) e a metade de **CA-4.5** que a exclusao decide (*"A
 * contagem de uso dos termos afetados fica correta ao fim da operacao"*).
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4), e e a
 * **cascata** de `wp_delete_term()` — os oito passos que T003 inventariou com
 * dono em `../rotulo-e-contexto/remover-rotulo-do-contexto.ts` e deixou para esta
 * tarefa. E o fluxo alternativo *Apagar um termo que tem conteudo* de UC-08, nas
 * duas linhas dele:
 *
 * > 1. O conteudo **nao** e apagado: perde a relacao
 * > 2. Se o conteudo ficar sem nenhum termo e a taxonomia tiver termo padrao, o
 * >    padrao e atribuido
 *
 * E a regra de negocio e `BR-MIGRAR-080` (`DB-TRG4`), com ancora em
 * `wp-includes/taxonomy.php:2152`, que `target_domain_model.md` poe entre as
 * **quatro invariantes de `AGG-Termo`**:
 *
 * > **Apagar um termo devolve o objeto ao termo padrao, se aquele era o unico.**
 * > Cada objeto vinculado e reprocessado: se era o unico termo do objeto naquela
 * > taxonomia e a taxonomia tem termo padrao (`default_category`, semeada com
 * > `1`), o objeto recebe o padrao; senao perde so aquele termo.
 *
 * `BR-MIGRAR-080` fecha com a frase que explica por que esta operacao e desta
 * feature e nao de BC-01: *"e o par de `P3` (publicacao): as duas metades da
 * mesma invariante, uma na escrita e outra na exclusao"*. A primeira metade e
 * **US-3**, T007.
 *
 * ---
 *
 * # 🔴 ESTA OPERACAO NAO ESTA NA SUPERFICIE DO MODULO, E A RAZAO E T011
 *
 * T003 nao publicou `removerRotuloDoContexto` como operacao de
 * `ModuloDeClassificacao` e escreveu por que, em duas razoes:
 *
 * > 1. **a protecao do termo padrao (`:2075`-`:2086`) e US-5, T011.** (...)
 * >    Publicar esta funcao como operacao do modulo **antes** de T011 publicaria
 * >    um caminho que apaga o termo padrao de um contexto, e esse caminho **o
 * >    legado nao tem** (...)
 * > 2. **a cascata e US-4, T009.** (...)
 *
 * **Esta tarefa fecha a razao 2 e nao a razao 1**, e por isso a funcao continua
 * **exportada e nao publicada**. Fecha-la seria implementar `CA-5.1` (*"apagar o
 * termo declarado como padrao de um contexto e recusado, para qualquer ator"*) e
 * `CA-5.2` (*"a recusa vence inclusive o ator de maior poder"*), que sao os
 * criterios de **T011**, cuja propria linha em `tasks.md` depende desta. A tabela
 * *Nao negociavel* da constituicao poe *"apagar dado"* fora do alcance do agente,
 * e publicar aqui um caminho que destroi a categoria padrao e exatamente isso.
 *
 * ⚠️ **E ha uma consequencia concreta da ausencia do passo 2, que vale escrever
 * para quem pegar T011:** sem ele, quando o rotulo apagado **e** o termo padrao do
 * contexto, o laco de `DB-TRG4` resolve o padrao para o proprio rotulo que esta
 * sendo apagado e **reatribui o objeto ao termo que vai desaparecer em
 * seguida** — deixando o vinculo orfao que o **P5** manda afirmar por teste. No
 * legado isso e inalcancavel, porque o passo 2 recusa antes. T011 fecha o caso
 * com um `if`, e ele vai **antes** do passo 3 desta funcao.
 *
 * # OS DEZ PASSOS, e o dono de cada um
 *
 * A ordem e a de `wp_delete_term()`, e ela esta transcrita na tabela de T003 em
 * `../rotulo-e-contexto/remover-rotulo-do-contexto.ts`. O que esta tarefa
 * acrescenta e o corpo dos passos 3, 5, 7 e a chamada do trecho final:
 *
 * | # | passo | ancora | onde esta |
 * |---|---|---|---|
 * | 1 | `term_exists( $term, $taxonomy )`, e `false` se nao existe | `:2062`-`:2064` | **aqui** |
 * | 2 | `default_category` / `default_term_{nome}`: `return 0` | `:2073`-`:2087` | 🔴 **T011** — ver o bloco acima |
 * | 3 | `$args['default']` e `force_default`, e a validacao do padrao informado | `:2089`-`:2098` | **aqui** |
 * | 4 | acao `pre_delete_term` | `:2111` | declarada abaixo, sem barramento |
 * | 5 | reposicionar os filhos no **avo**, em contexto hierarquico | `:2114`-`:2147` | **aqui** |
 * | 6 | `$deleted_term = get_term( ... )`, a copia que vai aos pontos de extensao | `:2149` | nao emitida: sem quem receber a copia, ler a linha de novo seria consulta sem efeito (razao de T003) |
 * | 7 | cada objeto vinculado: padrao, ou remocao do vinculo | `:2152`-`:2183` | **aqui** |
 * | 8 | apagar o metadado do rotulo (`termmeta`) | `:2188`-`:2191` | nao portado: `termmeta` nao e uma das tres estruturas de T002, e a posicao esta declarada em `../armazenamento/chaves-e-tabelas.ts` |
 * | 9 | o trecho final: `DELETE` da linha de contexto, a contagem, e o `DELETE` **condicional** do rotulo | `:2200`-`:2216` | **T003**, e esta funcao o **chama** |
 * | 10 | `clean_term_cache()` e as duas acoes finais | `:2218`, `:2235`, `:2256` | declaradas abaixo |
 *
 * ## O passo 5 reposiciona no AVO, e nao apaga
 *
 * `BR-MIGRAR-079` (`DB-TRG3`), com ancora em `wp-includes/taxonomy.php:2132`:
 * *"**Apagar reposiciona os filhos em vez de apaga-los.** Post hierarquico, anexo
 * do post, comentario e termo hierarquico tem o pai trocado pelo **avo**"*. E a
 * nota de paradigma da regra e o aviso inteiro deste passo: *"**`ON DELETE
 * CASCADE` ingenuo no destino muda o produto**"*.
 *
 * Duas coisas do legado, preservadas:
 *
 * 1. **o avo e o pai do rotulo apagado**, lido da linha dele — e por isso o
 *    reposicionamento vem **depois** da resolucao do par e **antes** do `DELETE`;
 * 2. **a leitura dos filhos nao filtra por contexto e o `UPDATE` filtra**, e a
 *    assimetria e do legado. T002 a declarou no metodo: *"a lista de filhos cujo
 *    cache sera limpo inclui rotulo de outro contexto que **nao** foi
 *    reposicionado"*.
 *
 * ⚠️ **A leitura dos filhos e emitida e o resultado dela nao e consumido, e isso
 * e deliberado.** No legado ela e `$edit_tt_ids`, o argumento das duas acoes do
 * passo (`edit_term_taxonomies`, `:2131`, e `edited_term_taxonomies`, `:2146`) e
 * da limpeza de cache — e **nenhum dos tres existe nesta arvore** (`REQ-162` e
 * `REQ-165`). O comando sai porque a area 3 da Decisao 2 compara *"snapshot +
 * sequencia de comandos"* e ele e um comando distinto, com conjunto de linhas
 * proprio; o que nao existe e quem o receba. Compare com o passo 6 (`:2149`), que
 * **nao** e emitido: ali o legado re-le a **mesma** linha que ja esta em maos, e
 * T003 ja havia decidido que *"sem quem receber a copia, ler a linha de novo seria
 * consulta sem efeito"*. A diferenca entre os dois casos e essa, e nao o gosto.
 *
 * ## O passo 7 e CA-4.3 e CA-4.4 ao mesmo tempo, e grava pelas operacoes de US-2
 *
 * T003 ja havia escrito que ele *"passa por `wp_set_object_terms()`, que e US-2
 * (T005)"*, e e isso que faz as duas metades valerem de uma vez:
 *
 * - **CA-4.3**: o `DELETE` alcanca **so** `term_relationships`. Nenhum comando
 *   desta funcao toca `posts` — nem poderia: `posts` e BC-01 e a regra de
 *   dependencia 3 proibe a travessia por `import`. *"O conteudo nao e apagado:
 *   perde a relacao"* (UC-08);
 * - **CA-4.4**: quando o rotulo apagado era o **unico** do objeto naquele
 *   contexto e o contexto tem termo padrao, a lista que vai para a substituicao e
 *   `[padrao]` — e e a substituicao integral que troca um vinculo pelo outro;
 * - **CA-4.5**: a contagem sai **por dentro** da substituicao e da remocao, como
 *   no legado, nos dois criterios de `DB-TRG2`. Esta funcao nao reconta por conta
 *   propria, e nao deve: recontar de fora emitiria comando que o legado nao emite.
 *
 * ⚠️ **A recusa de UC-08 e silenciosa nos dois lados.** *"Apagar classificacao nao
 * apaga conteudo, e isso e silencioso. O conteudo perde a relacao e, se tinha so
 * aquele termo, ganha o termo padrao **sem avisar ninguem**"* — e a nota 🟡 de *O
 * que um porte precisa saber* de UC-08, e o **P7** a poe no contrato.
 *
 * # 🔴 O QUE NAO FOI RECONFERIDO NO ORACULO
 *
 * **A instalacao do legado nao esta no disco desta maquina** — o limite que T007
 * registrou e que continua valendo (`oracleAvailable: false`, e nao ha
 * `wp-includes/taxonomy.php` para abrir). Tudo aqui vem do pacote
 * (`BR-MIGRAR-079`, `BR-MIGRAR-080`, UC-08, `spec.md`, `plan.md`) ou da
 * transcricao **merged** de T002 e T003. Dois pontos que o pacote **nao**
 * especifica ficaram marcados, e os dois tem teste:
 *
 * | ponto | o que esta tarefa fez | por que esse lado |
 * |---|---|---|
 * | o que o passo 3 faz com um padrao informado que **nao existe** naquele contexto (`:2089`-`:2098`, que T003 descreve como *"a validacao do padrao informado"*) | **descarta o padrao informado** e volta para o da opcao | validar e o que a palavra *"validacao"* diz, e aceitar um padrao inexistente faria a substituicao integral resolver um rotulo que nao existe e **remover** o vinculo em vez de troca-lo — o oposto de CA-4.4, e *"apagar dado"* esta fora do alcance do agente |
 * | o `orderby` da leitura inversa do passo 7 | **nao emite `ORDER BY`** (`'nenhuma'`), como a leitura do conjunto anterior de `wp_set_object_terms()` (`:2866`) | o conjunto de linhas e o mesmo nas duas ordenacoes, porque o que se faz com ele e `count()` e diferenca de conjunto; a unica coisa que muda e o texto da clausula. Ver {@link OrdemDaLeituraInversa} |
 *
 * ## Os pontos de extensao desta cascata, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` e **nenhuma
 * tarefa deste pacote constroi o barramento** (P2). Os desta funcao, na ordem do
 * legado — os quatro do trecho final estao declarados por T003 em
 * `../rotulo-e-contexto/remover-rotulo-do-contexto.ts`:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `pre_delete_term` | acao | `$term`, `$taxonomy` | antes de tudo (`:2111`) |
 * | `edit_term_taxonomies` | acao | `$edit_tt_ids` | antes do `UPDATE` que reposiciona os filhos (`:2131`) |
 * | `edited_term_taxonomies` | acao | `$edit_tt_ids` | depois dele (`:2146`) |
 * | `delete_term_relationships` / `deleted_term_relationships` | acao | `$object_id`, `$tt_ids`, `$taxonomy` | dentro de cada `wp_remove_object_terms()` do passo 7, **uma vez por lote** — declarados em `../vinculo-de-objeto/remover-vinculos.ts` |
 * | `delete_term` | acao | `$term`, `$tt_id`, `$taxonomy`, `$deleted_term`, `$object_ids` | depois da limpeza de cache (`:2235`) — ⚠️ recebe **a copia do passo 6 e a lista de objetos alcancados**, que e por que os dois existem |
 * | `delete_{$taxonomy}` | acao | `$term`, `$tt_id`, `$deleted_term`, `$object_ids` | por ultimo (`:2256`) |
 */

import { removerRotuloDoContexto } from '../rotulo-e-contexto/remover-rotulo-do-contexto.js';
import {
  ehErroDeTermo,
  obterTermo,
  type ErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import { substituirVinculosDoObjeto } from '../vinculo-de-objeto/index.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';
import {
  chaveDoTermoPadrao,
  SEM_TERMO_PADRAO,
} from '../termo-padrao/index.js';
import type { ColaboracaoDaExclusaoDeRotulo } from './escopo-de-manutencao-da-lista.js';

/** O que se pede para apagar um rotulo de um contexto. */
export interface PedidoDeExclusaoDeRotulo {
  /** `terms.term_id` — o rotulo. Os outros contextos dele nao sao tocados. */
  readonly rotuloId: number;
  /** O contexto de onde ele sai, por nome. */
  readonly contexto: string;
  /**
   * `$args['default']` — o rotulo que recebe os objetos orfanados, no lugar do
   * que a opcao do contexto guarda (`:2089`-`:2098`).
   *
   * ⚠️ **E validado**: um padrao informado que nao existe naquele contexto e
   * **descartado**, e vale o da opcao. Ver a tabela 🔴 do cabecalho.
   */
  readonly rotuloPadraoId?: number;
  /**
   * `$args['force_default']` — aplica o padrao **mesmo** quando o objeto tem
   * outros termos naquele contexto.
   *
   * Com `false`, que e o default, vale `DB-TRG4` na letra: so o objeto que ficaria
   * **sem termo algum** recebe o padrao. T003 descreveu o par como *"o que decide
   * entre 'devolve ao padrao' e 'so perde o vinculo'"*.
   */
  readonly forcarPadrao?: boolean;
}

/**
 * O desfecho, nas formas que `wp_delete_term()` devolve — menos uma.
 *
 * `true` apagou; `false` o par nao existe (ou o contexto nao esta registrado);
 * erro e repasse.
 *
 * ⚠️ **O `0` do legado nao esta aqui**, e a ausencia e a mesma que T003 declarou
 * em `../rotulo-e-contexto/remover-rotulo-do-contexto.ts`: ele e a recusa de
 * apagar o termo padrao (`:2077` e `:2086`), que e **US-5, T011**, e que acontece
 * **antes** do passo 3 desta funcao. Quem fechar T011 acrescenta esse desfecho.
 */
export type ResultadoDaExclusaoDeRotulo = boolean | ErroDeTermo;

/**
 * Qual rotulo recebe os objetos que ficariam sem termo — o passo 3.
 *
 * A ordem e a do legado: a opcao do contexto primeiro (o passo 2 ja a le, para a
 * protecao que e de T011), e o `$args['default']` informado **por cima**, se
 * existir naquele contexto.
 *
 * ⚠️ A chave da opcao e montada por {@link chaveDoTermoPadrao} — `default_category`
 * para `category`, `default_term_{nome}` para os demais —, e **a escolha entre as
 * duas e regra deste caminho, nao detalhe de quem le opcao**: e a mesma divisao
 * que T007 fixou para a regra `P3`. Os dois mecanismos de "padrao" do legado nao
 * se confundem aqui: o argumento `default_term` de `register_taxonomy()` e **nulo
 * nos oito contextos do nucleo**, e o que esta funcao le e a **opcao gravada**.
 */
function rotuloPadraoDoContexto(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaExclusaoDeRotulo,
  pedido: PedidoDeExclusaoDeRotulo,
): number {
  const daOpcao = colaboracao.opcoes.identificadorDoTermoPadrao(
    chaveDoTermoPadrao(pedido.contexto),
  );

  if (pedido.rotuloPadraoId === undefined) {
    return daOpcao;
  }

  // A validacao do padrao informado (`:2089`-`:2098`): ele tem de existir
  // **naquele contexto**. A cadeia e a de `idDoRotuloNoContexto`, a mesma que
  // `wp_insert_term()` e `wp_update_term()` enviam para perguntar o par
  // (`:2643` e `:3380`). Ver a tabela 🔴 do cabecalho sobre o lado escolhido.
  const informado = Math.trunc(pedido.rotuloPadraoId);
  const par = escopo.armazenamento.rotulosNoContexto.idDoRotuloNoContexto(
    informado,
    pedido.contexto,
  );

  return par === null ? daOpcao : informado;
}

/**
 * Apaga um rotulo de um contexto, com a cascata inteira — `wp_delete_term()`.
 *
 * **Permissao declarada: a capacidade que o contexto declara em
 * `capacidades.apagarRotulos` (`$tax->cap->delete_terms`), e ela NAO e verificada
 * aqui** — pela mesma razao, com as mesmas ancoras, de T003: `wp_delete_term()`
 * nao tem `current_user_can` no corpo, e quem cobra e a tela
 * (`wp-admin/edit-tags.php:117` para um item e `:137` para a acao em lote, *"antes
 * de tocar qualquer registro"*, UC-08) e a API REST. Os dois portoes da tela
 * passam pelo `case` de capacidade **sobre o termo**, que carrega a protecao do
 * termo padrao e e **T011** — ver `./permissao-na-gestao-de-rotulos.ts`.
 *
 * ⚠️ **Leia o bloco 🔴 do cabecalho antes de publicar esta funcao**: ela faz a
 * cascata de US-4 e **nao** cobra a protecao do termo padrao (US-5, T011).
 */
export function apagarRotuloDoContexto(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaExclusaoDeRotulo,
  pedido: PedidoDeExclusaoDeRotulo,
): ResultadoDaExclusaoDeRotulo {
  // Passo 1, primeira metade: contexto nao registrado devolve `false`, e nao
  // erro — o caminho indireto que T003 transcreveu (`term_exists()` traduz o erro
  // de taxonomia invalida em `null` em `:1670`, e `wp_delete_term()` traduz
  // `null` em `false` em `:2063`).
  const registrado = escopo.contextos.obter(pedido.contexto);
  if (registrado === null) {
    return false;
  }

  // Passo 1, segunda metade: achar o par `(term_id, term_taxonomy_id)`, pela
  // leitura de `get_term()` — a mesma substituicao de cadeia que T003 declarou
  // (o legado chega ao par por `term_exists()`, que passa por `WP_Term_Query`).
  const termo = obterTermo(escopo, pedido.rotuloId, pedido.contexto);

  // `if ( is_wp_error( $ids ) ) { return $ids; }` (`:2066`).
  if (ehErroDeTermo(termo)) {
    return termo;
  }

  // `if ( ! $ids ) { return false; }` (`:2063`).
  if (termo === null) {
    return false;
  }

  // Passo 2 (`:2073`-`:2087`) — 🔴 **NAO IMPLEMENTADO: e US-5, T011.** E aqui que
  // o legado recusa apagar o termo padrao do contexto, com `return 0`, e a
  // negacao *"vence ate o super administrador"*. Ver o bloco 🔴 do cabecalho.

  // Passo 3: quem recebe os objetos orfanados.
  const rotuloPadraoId = rotuloPadraoDoContexto(escopo, colaboracao, pedido);
  const forcarPadrao = pedido.forcarPadrao ?? false;

  // Passo 4: acao `pre_delete_term` (`:2111`) — declarada, sem barramento.

  // Passo 5: `DB-TRG3`. So em contexto hierarquico, e o pai novo dos filhos e o
  // pai do rotulo apagado — o **avo**.
  if (registrado.hierarquico) {
    // `SELECT term_id, term_taxonomy_id FROM term_taxonomy WHERE `parent` = ?`
    // (`:2121`), que **nao filtra por contexto** — a assimetria do legado.
    //
    // ⚠️ O resultado nao e consumido, e a razao esta no cabecalho: no legado ele
    // e `$edit_tt_ids`, que alimenta as duas acoes deste passo e a limpeza de
    // cache, e nenhuma das tres existe nesta arvore. O comando sai porque ele e
    // parte da sequencia.
    escopo.armazenamento.rotulosNoContexto.listarFilhosDoRotulo(
      pedido.rotuloId,
    );

    // Acao `edit_term_taxonomies` (`:2131`) — declarada.

    // `UPDATE term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?`
    // (`:2133`), que **filtra** por contexto. O `UPDATE` sai mesmo quando a
    // leitura nao trouxe filho nenhum: no legado ele nao esta dentro de
    // `if ( $children )`, e e por isso que a sequencia tem o comando sempre que
    // o contexto e hierarquico.
    escopo.armazenamento.rotulosNoContexto.reposicionarFilhos(
      pedido.rotuloId,
      termo.rotuloPaiId,
      pedido.contexto,
    );

    // Acao `edited_term_taxonomies` (`:2146`) — declarada.
  }

  // Passo 6: `$deleted_term = get_term( $term, $taxonomy )` (`:2149`) — nao
  // emitido, pela razao de T003: sem quem receber a copia, ler a linha de novo
  // seria consulta sem efeito.

  // Passo 7: `DB-TRG4`, objeto por objeto.
  //
  // `SELECT object_id FROM term_relationships WHERE term_taxonomy_id = ?`
  // (`:2152`) — a leitura que abre a cascata.
  const objetosAlcancados =
    escopo.armazenamento.vinculos.listarObjetosDoRotuloNoContexto(
      termo.rotuloNoContextoId,
    );

  for (const objetoId of objetosAlcancados) {
    // `wp_get_object_terms( $object_id, $taxonomy, array( 'fields' => 'ids' ) )`:
    // os rotulos que o objeto tem **naquele** contexto, em `term_id`.
    const rotulosDoObjeto =
      escopo.armazenamento.vinculos.listarRotulosDoObjeto(
        objetoId,
        pedido.contexto,
      );

    // `DB-TRG4` na letra: *"se era o unico termo do objeto naquela taxonomia e a
    // taxonomia tem termo padrao, o objeto recebe o padrao; senao perde so
    // aquele termo"*. `force_default` antecipa o primeiro ramo.
    const unicoTermoDoObjeto = rotulosDoObjeto.length === 1;
    const temPadrao = rotuloPadraoId !== SEM_TERMO_PADRAO;

    const rotulos =
      temPadrao && (forcarPadrao || unicoTermoDoObjeto)
        ? [rotuloPadraoId]
        : rotulosDoObjeto.filter((rotulo) => rotulo !== pedido.rotuloId);

    // `wp_set_object_terms( $object_id, $terms, $taxonomy )`: a substituicao
    // integral de US-2, que remove o que a lista nao trouxe e **reconta**
    // (CA-4.5). O conteudo nao e tocado — CA-4.3.
    substituirVinculosDoObjeto(escopo, colaboracao, {
      objetoId,
      contexto: pedido.contexto,
      rotulos,
    });
  }

  // Passo 8: apagar o metadado do rotulo (`:2188`-`:2191`) — `termmeta` nao e
  // uma das tres estruturas de T002, e a posicao esta declarada em
  // `../armazenamento/chaves-e-tabelas.ts`.

  // Passo 9: o trecho final (`:2200`-`:2216`), que e a entrega de T003 e de onde
  // **CA-1.3** se decide. Chamado, e nao recopiado: duas copias da mesma regra
  // divergiriam na primeira mudanca.
  //
  // ⚠️ **Diferenca de sequencia declarada.** No legado este caminho emite a
  // leitura do termo **tres** vezes — `:2062` (por `term_exists()`, que e outra
  // cadeia), `:2115` e `:2149` —; aqui ela sai **duas**: uma na resolucao do par,
  // acima, e uma dentro do trecho final reusado. O conjunto de linhas e o mesmo e
  // a decisao nao muda; as posicoes nao coincidem com as do legado.
  const removido = removerRotuloDoContexto(escopo, {
    rotuloId: pedido.rotuloId,
    contexto: pedido.contexto,
  });

  // Passo 10: `clean_term_cache()` (`:2218`) — sem cache nesta arvore. Acoes
  // `delete_term` (`:2235`) e `delete_{$taxonomy}` (`:2256`) — declaradas, e as
  // duas recebem `$object_ids`, que e `objetosAlcancados`.

  // `return true` (`:2258`). O trecho final devolve `true` ou `false`, e o erro
  // dele e inalcancavel aqui porque o par ja foi resolvido acima.
  return removido;
}
