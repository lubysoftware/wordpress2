/**
 * **CA-2.3**: *"A contagem de uso de cada termo afetado fica correta ao fim da
 * operacao"*.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). E o
 * passo 5 do fluxo principal de UC-05 — *"Sistema recalcula a contagem de uso de
 * cada termo afetado"* — e a pos-condicao que vem com ele.
 *
 * | aqui | no legado |
 * |---|---|
 * | {@link recontarUsoDosRotulos} | `wp_update_term_count()`, `wp-includes/taxonomy.php:3587`, sobre `wp_update_term_count_now()`, `:3625` |
 * | o criterio de conteudo | `_update_post_term_count()`, `:4193` |
 * | o criterio generico | `_update_generic_term_count()`, `:4272` |
 *
 * ---
 *
 * # UMA coluna, TRES caminhos de calculo, e quem escolhe
 *
 * `BR-MIGRAR-078` (`DB-TRG2`) e o aviso inteiro desta tarefa: *"a mesma coluna
 * `term_taxonomy.count` tem pelo menos duas definicoes de 'quantos'"*, e a
 * propria regra acrescenta a terceira — o `update_count_callback` que quem
 * registra o contexto declara, *"nao expressavel em SQL de jeito nenhum"*.
 *
 * A escolha **nao** e propriedade do registro e **nao** e propriedade da tabela:
 * ela e feita na hora de contar, em `wp_update_term_count_now()` (`:3625`), nesta
 * ordem:
 *
 * | # | pergunta | caminho |
 * |---|---|---|
 * | 1 | o contexto declara `update_count_callback`? | chama o retorno de chamada e **nao conta mais nada** (`:3630`) |
 * | 2 | *todos* os tipos de objeto do contexto sao tipo de conteudo registrado? | `_update_post_term_count()` — conta so `publish`, e anexo conta pelo pai |
 * | 3 | senao | `_update_generic_term_count()` — `COUNT(*)` da juncao, sem filtro |
 *
 * A pergunta 2 e `array_filter( $object_types, 'post_type_exists' ) ==
 * $object_types` (`:3637`), e e ela que faz `link_category` — cujo tipo de objeto
 * e `link` — cair no caminho 3. ⚠️ E **antes** dela o legado reescreve a lista:
 * todo tipo que comece com `attachment:` perde o sufixo (`:3632`-`:3635`), porque
 * `attachment:image` nao e tipo de conteudo registrado e sem o corte o contexto
 * inteiro cairia no criterio generico.
 *
 * # O criterio de conteudo e DOIS comandos, nao um
 *
 * `_update_post_term_count()` soma duas contagens, e cada uma e um comando que
 * so sai quando ha o que contar (`:4230` e `:4235`):
 *
 * 1. a de **anexo**, que existe porque anexo tem `post_status = 'inherit'` e
 *    conta pelo estado do **pai** (`:4232`);
 * 2. a dos outros tipos, filtrada por `post_type IN (...)` com os tipos que
 *    **existem** (`:4237`).
 *
 * As duas atravessam `posts`, que e BC-01, e chegam por ligacao tardia (AD-10) —
 * ver {@link ConteudoNaClassificacao} em `escopo-de-vinculo-de-objeto.ts`.
 *
 * # 🔴 O que esta tarefa NAO decidiu, e continua aberto
 *
 * A segunda *Pergunta em aberto* de `spec.md`: *"a contagem de uso de cada termo
 * e dado gravado e sai de sincronia quando alguem escreve na juncao por fora do
 * caminho normal. Recalcular na leitura e mais correto e muda o que a interface
 * devolve nesse caso de borda. Manter o valor gravado, com a possibilidade de
 * divergir, e o comportamento identico. **Ninguem decidiu**"*.
 *
 * **O que T005 faz e o que T002 fez:** grava o valor calculado na coluna, e
 * **nenhuma leitura recalcula**. `target_data_model.md` poe a divergencia como
 * estado normal — *"um sistema que os mantivesse sempre corretos teria
 * comportamento **diferente** do legado"*. A pergunta continua aberta.
 *
 * # ⚠️ O ADIAMENTO DA CONTAGEM ESTA NOMEADO E NAO CONSTRUIDO
 *
 * `wp_update_term_count()` consulta `wp_defer_term_counting()` (`:3557`) e, com o
 * adiamento ligado, **acumula** os identificadores por contexto num `static` e
 * devolve `true` sem contar; quem desliga o adiamento esvazia o acumulado
 * (`wp_update_term_count( null, null, true )`, `:3565`).
 *
 * Esta tarefa **nao porta** o adiamento, e a razao e dupla:
 *
 * 1. os dois `static` — `$_defer` em `wp_defer_term_counting()` e `$_deferred` em
 *    `wp_update_term_count()` — sao exatamente a travessia **D-A** de
 *    `parity_specs.md` (*"escopo de requisicao para escopo de processo"*), e
 *    `BR-MIGRAR-105` (`EXT-CONTEXTO`) manda que nada disso vire estado de modulo:
 *    quem o portar poe o acumulador no escopo da requisicao, ao lado do registro
 *    de contextos, e nao numa variavel de modulo;
 * 2. **nenhum chamador de US-2 o liga.** Quem liga e `wp_delete_post()`
 *    (`wp-includes/post.php:3925`, BC-01) e os importadores (BC-12), e com ele
 *    desligado — que e o **default de fabrica**, e o P6 fixa o default como a
 *    especificacao — o caminho desta funcao e identico ao do legado, comando por
 *    comando.
 *
 * A consequencia de nao o portar e declarada: enquanto nao existir, a contagem e
 * **sempre** imediata. Isso e uma garantia **mais forte** do que a do legado, e e
 * por isso que esta nota existe em vez de um silencio — `BR-MIGRAR-077` descreve o
 * mesmo adiamento do lado do contador de comentarios e chama a janela de
 * inconsistencia de observavel.
 *
 * ## Os pontos de extensao desta contagem, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` e **nenhuma
 * tarefa deste pacote constroi o barramento**; o **P2** poe cada ponto no
 * contrato publico *"com o nome, os argumentos, a ordem de disparo e a capacidade
 * de alterar o resultado"*. Os quatro desta funcao, na ordem em que disparam:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `update_post_term_count_statuses` | filtro | `$post_statuses`, `$taxonomy` | **antes** do laco, e decide quais estados contam (`:4221`) — e o unico que muda o numero |
 * | `update_term_count` | acao | `$tt_id`, `$taxonomy->name`, `$count` | depois de calcular, **antes** de gravar (`:4248`, `:4277`) |
 * | `edit_term_taxonomy` | acao | `$tt_id`, `$taxonomy->name`, `array()` | antes do `UPDATE` (`:4252`, `:4282`) |
 * | `edited_term_taxonomy` | acao | `$tt_id`, `$taxonomy->name`, `array()` | depois dele (`:4256`, `:4286`) |
 *
 * ⚠️ Os tres ultimos disparam **uma vez por identificador**, dentro do laco, e nao
 * uma vez para o lote: quem construir o barramento conta quantas vezes cada um
 * dispara.
 */

import type { ContextoDeClassificacao } from '../registro/index.js';
import type {
  ColaboracaoDoVinculo,
  EscopoDeVinculoDeObjeto,
} from './escopo-de-vinculo-de-objeto.js';

/**
 * Os estados de conteudo que entram na contagem do criterio de conteudo.
 *
 * O valor de fabrica do legado e **um** estado: `$post_statuses = array(
 * 'publish' )` (`wp-includes/taxonomy.php:4214`). O ponto de configuracao nomeado
 * que o **P6** exige e esta constante; o ponto que o altera em execucao e o filtro
 * `update_post_term_count_statuses` (`:4221`), declarado na tabela do cabecalho e
 * nao emitido.
 *
 * ⚠️ `'inherit'` **nao** esta aqui, e nao e esquecimento: anexo nao e contado por
 * estar em `inherit`, e sim pelo estado do **pai**, e essa consulta e a outra
 * ({@link ConteudoNaClassificacao.contarAnexosPublicados}).
 */
export const ESTADOS_CONTADOS_NO_CRITERIO_DE_CONTEUDO: readonly string[] = [
  'publish',
];

/**
 * O tipo de objeto que conta pelo estado do pai.
 *
 * A cadeia e a do legado byte a byte, porque e ela que `array_search` compara
 * (`wp-includes/taxonomy.php:4206`) e ela que vai no `post_type = 'attachment'`
 * da consulta (`:4232`).
 */
export const TIPO_DE_OBJETO_DE_ANEXO = 'attachment';

/**
 * O separador de um tipo de objeto qualificado, como `attachment:image`.
 *
 * Aparece em dois lugares do caminho da contagem, e os dois cortam no primeiro
 * `:` e ficam com a parte da esquerda: `wp_update_term_count_now()` antes de
 * perguntar se o tipo existe (`:3633`) e `_update_post_term_count()` antes de
 * deduplicar a lista (`:4199`).
 */
export const SEPARADOR_DE_TIPO_QUALIFICADO = ':';

/**
 * `list( $object_type ) = explode( ':', $object_type )` — a parte antes do
 * primeiro separador.
 *
 * ⚠️ As duas chamadas do legado **nao** sao iguais e a diferenca e observavel:
 * `wp_update_term_count_now()` corta **so** quando o tipo comeca com
 * `attachment:` (`str_starts_with`, `:3632`), e `_update_post_term_count()` corta
 * **sempre** (`:4199`). Portar as duas como uma faria um tipo chamado `a:b` virar
 * `a` na escolha do criterio, que no legado nao vira.
 */
function antesDoSeparador(tipo: string): string {
  const posicao = tipo.indexOf(SEPARADOR_DE_TIPO_QUALIFICADO);
  return posicao === -1 ? tipo : tipo.slice(0, posicao);
}

/**
 * A lista de tipos como `wp_update_term_count_now()` a reescreve antes de
 * escolher o criterio (`:3631`-`:3635`).
 *
 * So o prefixo `attachment:` e cortado, e o `&$object_type` do legado e
 * referencia: a lista reescrita e a que a comparacao usa.
 */
function tiposParaAEscolhaDoCriterio(
  tiposDeObjeto: readonly string[],
): readonly string[] {
  const prefixo = `${TIPO_DE_OBJETO_DE_ANEXO}${SEPARADOR_DE_TIPO_QUALIFICADO}`;
  return tiposDeObjeto.map((tipo) =>
    tipo.startsWith(prefixo) ? antesDoSeparador(tipo) : tipo,
  );
}

/**
 * Qual dos tres caminhos de `DB-TRG2` vale para aquele contexto — a pergunta de
 * `wp_update_term_count_now()`, nomeada para que ela seja afirmavel por teste.
 *
 * `'retorno-de-chamada'` e o caminho 1 e nao e executavel nesta arvore: ver
 * {@link recontarUsoDosRotulos}.
 */
export type CriterioDeContagem =
  | 'retorno-de-chamada'
  | 'conteudo'
  | 'generico';

/**
 * A escolha do criterio, isolada da contagem.
 *
 * `array_filter( $object_types, 'post_type_exists' ) == $object_types` (`:3637`):
 * **todos** os tipos tem de ser tipo de conteudo registrado. Lista vazia satisfaz
 * a comparacao no legado — `array_filter( array() ) == array()` e verdadeiro —,
 * logo um contexto sem tipo de objeto declarado cai no criterio de **conteudo**,
 * que entao nao emite comando nenhum porque nao ha tipo para filtrar. As duas
 * coisas sao do legado e as duas estao afirmadas por teste.
 */
export function criterioDeContagem(
  contexto: ContextoDeClassificacao,
  colaboracao: ColaboracaoDoVinculo,
): CriterioDeContagem {
  // `if ( ! empty( $taxonomy->update_count_callback ) )` (`:3630`).
  if (contexto.callbackDeContagem !== '') {
    return 'retorno-de-chamada';
  }

  const tipos = tiposParaAEscolhaDoCriterio(contexto.tiposDeObjeto);
  const todosSaoConteudo = tipos.every((tipo) =>
    colaboracao.conteudo.tipoDeConteudoEhRegistrado(tipo),
  );

  return todosSaoConteudo ? 'conteudo' : 'generico';
}

/**
 * `_update_post_term_count()` (`:4193`) — o criterio de contexto de conteudo.
 *
 * A reescrita da lista e a do legado, na ordem dele: corta **todo** sufixo
 * qualificado (`:4199`), deduplica (`:4203`), retira `attachment` e guarda que
 * ele estava la (`:4206`-`:4210`), e filtra o que sobrou por tipo existente
 * (`:4212`).
 */
function contarPeloCriterioDeConteudo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoVinculo,
  contexto: ContextoDeClassificacao,
  rotulosNoContextoIds: readonly number[],
): void {
  const semSufixo = contexto.tiposDeObjeto.map(antesDoSeparador);
  const unicos = [...new Set(semSufixo)];

  // `$check_attachments = array_search( 'attachment', $object_types, true )`, e o
  // `unset` que vem depois: anexo sai da lista e ganha a propria consulta.
  const temAnexo = unicos.includes(TIPO_DE_OBJETO_DE_ANEXO);
  const tipos = unicos
    .filter((tipo) => tipo !== TIPO_DE_OBJETO_DE_ANEXO)
    .filter((tipo) => colaboracao.conteudo.tipoDeConteudoEhRegistrado(tipo));

  for (const rotuloNoContextoId of rotulosNoContextoIds) {
    // `$count = 0` por identificador, e as duas contagens SOMAM (`:4226`).
    let contagem = 0;

    if (temAnexo) {
      contagem += colaboracao.conteudo.contarAnexosPublicados(
        rotuloNoContextoId,
        ESTADOS_CONTADOS_NO_CRITERIO_DE_CONTEUDO,
      );
    }

    // `if ( $object_types )` (`:4235`): lista vazia nao emite o segundo comando.
    if (tipos.length > 0) {
      contagem += colaboracao.conteudo.contarConteudoPublicado(
        rotuloNoContextoId,
        tipos,
        ESTADOS_CONTADOS_NO_CRITERIO_DE_CONTEUDO,
      );
    }

    escopo.armazenamento.rotulosNoContexto.atualizarContagemDeUso(
      rotuloNoContextoId,
      contagem,
    );
  }
}

/**
 * `_update_generic_term_count()` (`:4272`) — o criterio de quem nao e so
 * conteudo.
 *
 * `COUNT(*)` da juncao, **sem filtro nenhum**, um comando por identificador, e o
 * `UPDATE` em seguida. E o caminho de `link_category`, e e o unico dos dois que
 * nao sai de BC-02.
 */
function contarPeloCriterioGenerico(
  escopo: EscopoDeVinculoDeObjeto,
  rotulosNoContextoIds: readonly number[],
): void {
  for (const rotuloNoContextoId of rotulosNoContextoIds) {
    const contagem =
      escopo.armazenamento.vinculos.contarObjetosDoRotuloNoContexto(
        rotuloNoContextoId,
      );
    escopo.armazenamento.rotulosNoContexto.atualizarContagemDeUso(
      rotuloNoContextoId,
      contagem,
    );
  }
}

/**
 * Recalcula e grava a contagem de uso dos rotulos informados —
 * `wp_update_term_count()` sobre `wp_update_term_count_now()`.
 *
 * **Permissao exigida: nenhuma**, e isso e leitura do legado e nao economia: as
 * duas funcoes nao verificam capacidade, e sao chamadas de dentro de
 * `wp_set_object_terms()` e de `wp_remove_object_terms()`, que tambem nao
 * verificam, e **sem ator** quando quem chama e o nucleo. Declara-la aqui
 * recusaria a recontagem que o legado faz na publicacao agendada, onde nao ha
 * ninguem autenticado.
 *
 * Devolve `false` quando nao ha o que contar — o `if ( empty( $terms ) ) { return
 * false; }` de `wp_update_term_count()` (`:3597`) — e `true` quando contou, que e
 * o retorno literal de `wp_update_term_count_now()` (`:3650`). O retorno **e
 * ignorado** pelos dois chamadores do legado, e nenhum ramo desta implementacao o
 * consulta (P7).
 *
 * ⚠️ **Contexto nao registrado nao e recusa: e `null` virando lista vazia.**
 * `wp_update_term_count_now()` faz `$taxonomy = get_taxonomy( $taxonomy )` e
 * segue (`:3627`); com `false` ali, `! empty( $taxonomy->update_count_callback )`
 * e falso, `(array) $taxonomy->object_type` e **lista vazia** e a comparacao de
 * `array_filter` passa — logo o legado cai no criterio de **conteudo** com zero
 * tipos e grava `count = 0` em cada identificador. E o que esta funcao faz, e e um
 * daqueles casos em que o legado nao falha: ele zera.
 *
 * ⚠️ **O caminho 1 de `DB-TRG2` nao e executavel nesta arvore.** O
 * `update_count_callback` do legado e **nome de funcao PHP**, e o registro o
 * guarda como cadeia (`../registro/contexto-de-classificacao.ts`,
 * `callbackDeContagem`, vazio nos oito do nucleo). Com um nome declarado, o legado
 * delega a contagem inteira ao retorno de chamada e **nao emite comando proprio**:
 * e o que esta funcao reproduz — ela nao conta e nao grava. Inventar um
 * despachante de nome de funcao aqui seria inventar o barramento que `REQ-162`
 * poe fora de escopo.
 */
export function recontarUsoDosRotulos(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoVinculo,
  rotulosNoContextoIds: readonly number[],
  contexto: string,
): boolean {
  // `if ( empty( $terms ) ) { return false; }` (`:3597`). Vem ANTES da consulta
  // ao adiamento e antes de resolver o contexto: lista vazia nao toca em nada.
  if (rotulosNoContextoIds.length === 0) {
    return false;
  }

  // `$terms = array_map( 'intval', $terms )` (`:3626`).
  const ids = rotulosNoContextoIds.map((id) => Math.trunc(id));

  const registrado = escopo.contextos.obter(contexto);

  if (registrado === null) {
    // Ver a nota de contexto nao registrado no cabecalho desta funcao: o legado
    // cai no criterio de conteudo com zero tipos, e grava zero.
    for (const rotuloNoContextoId of ids) {
      escopo.armazenamento.rotulosNoContexto.atualizarContagemDeUso(
        rotuloNoContextoId,
        0,
      );
    }
    return true;
  }

  switch (criterioDeContagem(registrado, colaboracao)) {
    case 'retorno-de-chamada':
      // `call_user_func( $taxonomy->update_count_callback, ... )` (`:3631`) — e
      // o legado nao conta nada depois disso.
      break;
    case 'conteudo':
      contarPeloCriterioDeConteudo(escopo, colaboracao, registrado, ids);
      break;
    case 'generico':
      contarPeloCriterioGenerico(escopo, ids);
      break;
  }

  // `clean_term_cache( $terms, '', false )` (`:3648`) — nao ha cache nesta
  // arvore (borda 5 de `target_architecture.md`, REQ-165 nao decidida).

  return true;
}
