/**
 * Criar rotulo — a operacao *"criar ou renomear rotulo"* da tabela **Contratos**
 * de `plan.md`, pela metade que T003 nao portou, e o comando `criar` de
 * `AGG-Termo`.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4), e e
 * `wp_insert_term()` — `wp-includes/taxonomy.php:2458`, a ancora que `spec.md`
 * poe na terceira coluna de evidencia de US-4 e que UC-08 repete em *Implementado
 * em*. E o passo 4 do fluxo principal de UC-08: *"Sistema grava o rotulo e o
 * contexto em tabelas separadas"*, com a nota *"uma linha em `terms`, uma em
 * `term_taxonomy` por taxonomia"*.
 *
 * Os criterios que caem aqui:
 *
 * | criterio | o que decide nesta operacao |
 * |---|---|
 * | **CA-4.2** | o pai informado e gravado em contexto hierarquico e descartado em contexto plano — a regra esta em `./hierarquia-do-rotulo.ts` |
 * | **CA-4.5** | a linha de contexto nasce com `count = 0`, **explicito na insercao** e nao herdado do default do DDL ({@link CONTAGEM_INICIAL_DE_USO}) |
 * | **UT-036-6** | *"o estado de um termo e a existencia dele"*: `terms` nao tem coluna de estado, logo criar **e** a transicao de estado, e nao ha campo a ligar |
 *
 * ---
 *
 * # A SEQUENCIA DE COMANDOS, que e o que esta area compara
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e esta
 * operacao tem a sequencia mais contraintuitiva da feature: **o legado insere
 * primeiro e pergunta depois.** Na ordem dele:
 *
 * | # | o que | quando | ancora |
 * |---|---|---|---|
 * | 1 | `INSERT INTO terms (name, slug, term_group)` | sempre | `:2624` |
 * | 2 | `UPDATE terms SET slug` — a correcao do apelido vazio | so se o apelido resolvido ficou vazio | `:2636` |
 * | 3 | a leitura do par `(term_id, taxonomy)` | sempre | `:2643` |
 * | 4 | `INSERT INTO term_taxonomy (term_id, taxonomy, description, parent, count)` | so se o par nao existe | `:2652` |
 * | 5 | a confirmacao de duplicata | sempre | `:2664` |
 * | 6 | `DELETE FROM terms` e `DELETE FROM term_taxonomy` | so se a duplicata veio | `:2685` e `:2686` |
 *
 * Tres coisas desta tabela que um porte faria diferente sem perceber, e as tres
 * sao observaveis:
 *
 * 1. **O passo 3 nunca encontra nada no caminho normal**, e isso nao e defeito do
 *    porte: e leitura do legado, e T003 ja a havia registrado —
 *    *"`wp_insert_term()` **sempre insere uma linha nova em `terms`** e so depois
 *    procura o par `(term_id, taxonomy)` — com o identificador que acabou de
 *    gerar, de modo que a busca nunca encontra nada (`:2622`-`:2658`)"*
 *    (`../rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts`). A leitura **sai
 *    do mesmo jeito**, porque ela esta na sequencia; o ramo que devolve o par
 *    existente sem inserir (`:2650`) e alcancavel so por escrita direta no
 *    armazenamento, e esta portado porque *"existir sem ser chamado e parte do que
 *    se clona"* (resposta 7 de `questions.md`, P8).
 * 2. **O passo 5 e o que impede a duplicata, e ele e depois do `INSERT`.** Um
 *    porte que perguntasse antes emitiria dois comandos a menos no caminho de
 *    colisao e nenhum `DELETE` — e a diferenca aparece no identificador: o legado
 *    **consome** um `term_id` e um `term_taxonomy_id` do banco e depois os
 *    descarta, logo o proximo rotulo criado recebe identificador **maior** do que
 *    receberia. Isso e observavel, e e o que o item 1 de *O que um porte
 *    bem-intencionado mexeria* de `../armazenamento/rotulo.ts` protege.
 * 3. **O passo 6 apaga `terms` ANTES de `term_taxonomy`**, e a ordem e a do
 *    legado: `:2685` e a linha do rotulo e `:2686` a do contexto (as duas ancoras
 *    estao nos metodos `apagar` de `../armazenamento/rotulo.ts` e de
 *    `../armazenamento/rotulo-no-contexto.ts`, transcritas por T002). E o inverso
 *    da ordem da exclusao de verdade (`:2202` e depois `:2215`), e inverter
 *    qualquer uma das duas mudaria a sequencia.
 *
 * # ⚠️ O QUE ESTA OPERACAO NAO FAZ, E A CONSEQUENCIA DE CADA AUSENCIA
 *
 * **A instalacao do legado nao esta no disco desta maquina** — o limite que T007
 * registrou e que continua valendo (`oracleAvailable: false`, e nao ha
 * `wp-includes/taxonomy.php` para abrir). Tudo nesta operacao vem do pacote ou da
 * transcricao **merged** de T002 e T003, que a leram quando a arvore estava
 * legivel. O que elas nao transcreveram **nao esta aqui**, e cada ausencia vem com
 * a consequencia:
 *
 * | ausente | ancora | por que, e o que muda |
 * |---|---|---|
 * | `wp_unique_term_slug()` — o laco que acrescenta sufixo ao apelido | `:2609`, a funcao em `:3136` | T002 portou as **duas leituras** que ela usa ({@link RepositorioDeRotulos.slugJaUsado}, `:3188` e `:3190`) e chamou o laco de *"regra, e e de T003/T009"* — mas **o corpo do laco nao e legivel nesta arvore** e nenhum documento do pacote o descreve: nem o formato do sufixo, nem o ramo de contexto hierarquico. Escreve-lo de memoria seria inventar regra. ⚠️ **Consequencia:** o apelido informado e gravado como veio, sem sufixo. O caso de colisao **nao** fica sem rede: o passo 5 o apanha depois do `INSERT` e desfaz as duas insercoes, que e o que o legado faz quando o chamador informa apelido explicito |
 * | a derivacao do apelido a partir do nome (`sanitize_title()`) | `:2636` | `sanitize_title()` **nao existe nesta arvore**, e T003 ja havia declarado a mesma ausencia no ramo gemeo de `wp_update_term()` (`:3416`-`:3419`). Ela e cadeia de filtros mais `remove_accents()`, de `wp-includes/formatting.php` — plataforma, e nenhuma tarefa deste pacote a constroi. ⚠️ **Consequencia, e e a mesma que T003 declarou:** com apelido vazio a linha fica com `''`, que e **ausencia** (`DB-SENT`), e o `UPDATE` corretivo do passo 2 **nao e emitido** — ha teste com 🔴 no nome fixando isso |
 * | a recusa de **nome duplicado no mesmo nivel** | — | passa por `get_term_by( 'name', ... )`, que desde 4.4 e `WP_Term_Query` (`../armazenamento/termo.ts`), da feature `015` T007, e o `msgid` da recusa nao e reconferivel aqui. T003 listou-a entre o que `wp_insert_term()` inteira traz para T009, junto com o laco de sufixo e a confirmacao de duplicata; destas tres, **so a confirmacao tinha a cadeia transcrita**, e e a que entrou. ⚠️ **Consequencia:** dois rotulos de mesmo nome e apelidos diferentes, no mesmo nivel, sao aceitos |
 * | a recusa `missing_parent` | `:3310`-`:3312` no gemeo | ver a tabela de `./hierarquia-do-rotulo.ts`: `term_exists( $parent )` passa por `WP_Term_Query`, `plan.md` **nao** a lista entre os erros do contrato, e o orfao que ela deixaria e o estado que o **P5** chama de normal |
 * | o agrupamento de sinonimos (`alias_of`) | `:2537`, e `:3326`-`:3346` no gemeo | T003 atribuiu-o a T009 — *"e manutencao da lista, e a leitura ja existe em `maiorGrupoDeSinonimos`"* —, mas **nenhum criterio de US-4 o menciona** e nenhum caso de `UT-036-1` a `UT-036-7` o exercita. O que o legado faz com ele no corpo de `wp_insert_term()` nao e legivel nesta arvore: so se sabe que le `SELECT MAX(term_group)` e chama `wp_update_term()` de volta. ⚠️ **Consequencia:** o grupo de sinonimos nasce `0` ({@link SEM_GRUPO_DE_SINONIMOS}), que e o default do DDL e o valor do legado quando ninguem informa `alias_of` (`:2525`); quem portar o argumento porta o laco com ele |
 * | `db_insert_error` | `:2652` | T002 descreveu a recusa — *"um `WP_Error( 'db_insert_error' )` montado a partir do retorno falso de `$wpdb->insert`"* — e o `msgid` dela **nao e reconferivel nesta arvore**. `DB-DEG` (`BR-MIGRAR-083`) manda que *"a camada de dados **degrade**, nao que o dominio antecipe"*, e e o que esta operacao faz: ela devolve o par com o identificador que a porta informou, inclusive `0` |
 * | `termmeta` do argumento `meta_input` | — | metadado **do rotulo**, nao uma das tres estruturas de T002. A posicao em que a cascata o apaga esta declarada em `./apagar-rotulo-do-contexto.ts` |
 * | `clean_term_cache()` | — | nao ha cache nesta arvore (borda 5 de `target_architecture.md`, REQ-165 nao decidida) |
 *
 * ## Os pontos de extensao desta operacao, declarados e nao emitidos
 *
 * 🔴 `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado` e **nenhuma
 * tarefa deste pacote constroi o barramento**; o **P2** poe cada ponto no contrato
 * publico *"com o nome, os argumentos, a ordem de disparo e a capacidade de
 * alterar o resultado que ele tem hoje"*. Os desta operacao, com a fonte de cada
 * ancora:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `pre_insert_term` | filtro | `$term`, `$taxonomy`, `$args` | **antes** de tudo, e pode recusar a criacao devolvendo erro — nomeado por T003 em `../rotulo-e-contexto/index.ts`; a linha nao e reconferivel nesta arvore |
 * | `wp_insert_term_data` | filtro | `$data`, `$taxonomy`, `$args` | **imediatamente antes** do `INSERT` em `terms`, e o valor devolvido e o que vai gravado (`:2622`, de `../armazenamento/rotulo.ts`) |
 * | `edit_terms` | acao | `$term_id`, `$taxonomy`, `$args` | antes do `UPDATE` corretivo do apelido (`:2635`, idem) |
 * | `edited_terms` | acao | `$term_id`, `$taxonomy`, `$args` | depois dele (`:2639`, idem) |
 * | `wp_insert_term_duplicate_term_check` | filtro | `$duplicate_term`, `$term`, `$taxonomy`, `$args`, `$term_id` | entre a confirmacao de duplicata e o desfazimento (`:2682`, de `../armazenamento/termo.ts`) — ⚠️ **permite desligar a verificacao**, e com ela desligada as duas linhas novas **ficam** |
 * | `create_term` / `create_{$taxonomy}` | acao | `$term_id`, `$tt_id`, `$taxonomy`, `$args` | *"os dois `create_*`"* que T003 nomeou junto com `pre_insert_term`; as linhas nao sao reconferiveis nesta arvore |
 * | `term_id_filter` | filtro | `$term_id`, `$tt_id`, `$args` | ⚠️ **muda o identificador devolvido** ao chamador — o mesmo ponto que o gemeo emite em `:3497` |
 * | `created_term` / `created_{$taxonomy}` e `saved_term` / `saved_{$taxonomy}` | acao | `$term_id`, `$tt_id`, `$taxonomy`, `$args` (e `$update` **`false`** em `saved_*`) | por ultimo. ⚠️ No gemeo o `$update` e `true` **literal** (`:3538`), logo aqui e `false` literal: e por esse argumento que um interceptador distingue criacao de atualizacao |
 */

import {
  CONTAGEM_INICIAL_DE_USO,
  SEM_GRUPO_DE_SINONIMOS,
} from '../armazenamento/index.js';
import {
  erroDeTermo,
  MENSAGENS_DE_ERRO_DE_TERMO,
  type ErroDeTermo,
  type ParDoRotulo,
} from '../rotulo-e-contexto/index.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';
import { paiAceitoNoContexto } from './hierarquia-do-rotulo.js';

/**
 * O que se pede para criar um rotulo num contexto.
 *
 * Os tres primeiros campos sao os da coluna *entrada* do contrato de `plan.md` —
 * *"contexto, nome, pai opcional"* —, e os dois ultimos sao argumentos
 * publicados de `wp_insert_term()`, que o **P8** mantem em escopo.
 */
export interface PedidoDeCriacaoDeRotulo {
  /** O contexto de classificacao, por **nome**: a coluna `taxonomy` guarda isso. */
  readonly contexto: string;
  /** O nome do rotulo. Vazio, ou so espaco, e recusa (`empty_term_name`). */
  readonly nome: string;
  /**
   * `terms.slug` — o identificador na URL.
   *
   * ⚠️ **Ausente ou vazio grava `''`, e o legado nao faria isso.** Ele deriva o
   * apelido do nome por `sanitize_title()` e o torna unico por
   * `wp_unique_term_slug()`, e **nenhuma das duas existe nesta arvore**. Ver a
   * tabela de ausencias do cabecalho: o campo esta no tipo para que quem chama
   * possa informar o apelido ja resolvido, que e o que a tela de termos envia
   * (`target_screens.md`, `SCR-044` § 3, campo `slug` em
   * `wp-admin/edit-tags.php:470`).
   */
  readonly slug?: string;
  /**
   * `term_taxonomy.description` — por contexto, nao por rotulo, e `''` e
   * ausencia. Nao e serializado.
   */
  readonly descricao?: string;
  /**
   * O pai, em `terms.term_id` — **CA-4.2**.
   *
   * Em contexto plano e descartado; ver `./hierarquia-do-rotulo.ts`, que e onde a
   * regra mora, com o bloco 🔴 sobre por que descartar e nao recusar.
   */
  readonly rotuloPaiId?: number;
}

/**
 * O desfecho da criacao: o par, ou o erro — **nunca excecao**.
 *
 * E a mesma forma de retorno de `wp_update_term()` ({@link ParDoRotulo}, T003),
 * e e assim no legado: *"e o mesmo par de `wp_insert_term()`, e e por isso que o
 * legado trata as duas como a mesma forma de retorno"*.
 *
 * ⚠️ O par devolvido **pode ser o de outro rotulo**: quando a confirmacao de
 * duplicata acusa colisao, o legado apaga as duas linhas que acabou de gravar e
 * devolve o par **antigo** (`:2685` a `:2694`). Quem chama nao distingue os dois
 * casos, e no legado tambem nao distingue.
 */
export type ResultadoDaCriacaoDeRotulo = ParDoRotulo | ErroDeTermo;

/**
 * Cria um rotulo num contexto — `wp_insert_term()`.
 *
 * **Permissao declarada: a capacidade que o contexto declara em
 * `capacidades.editarRotulos` (`$tax->cap->edit_terms`), e ela NAO e verificada
 * aqui.**
 *
 * E a declaracao que o **P4** cobra, e ela e desta forma porque e assim no
 * legado: `wp_insert_term()` nao tem `current_user_can` no corpo, e o nucleo a
 * chama **sem ator** de dentro de `wp_set_object_terms()`
 * (`wp-includes/taxonomy.php:2896`) e de `register_taxonomy()`, quando o contexto
 * declara `default_term` (`:539`-`:558`). O bloco 🔴 de
 * `../vinculo-de-objeto/rotulos-informados.ts` inventariou os **cinco** lugares
 * em que o legado cobra `edit_terms`, e **todos** estao na superficie que cria
 * pela interface; no caminho de atribuicao ele nao existe, e *"autor cria etiqueta
 * e nao cria categoria"* e consequencia disso.
 *
 * Verificar aqui recusaria a etiqueta que o legado cria para o autor — a direcao
 * que o **P1** e a resposta 2 proibem. Quem cobra e a tela, e o portao dela e
 * {@link permissaoDeCriarRotulo} (`./permissao-na-gestao-de-rotulos.ts`,
 * **CA-4.1**, `wp-admin/edit-tags.php:86`).
 */
export function criarRotuloNoContexto(
  escopo: EscopoDeVinculoDeObjeto,
  pedido: PedidoDeCriacaoDeRotulo,
): ResultadoDaCriacaoDeRotulo {
  // 1. `if ( ! taxonomy_exists( $taxonomy ) )`.
  //
  //    ⚠️ A guarda e a mesma de `wp_update_term()` (`:3266`), de
  //    `wp_set_object_terms()` (`:2856`) e de `wp_remove_object_terms()`
  //    (`:3043`), as tres transcritas por T003 e T005 — **a linha dela dentro de
  //    `wp_insert_term()` nao e reconferivel nesta arvore**. Sem ela, esta
  //    operacao gravaria uma linha de `term_taxonomy` nomeando contexto que
  //    nenhum registro conhece: a linha **tolerada** de que fala
  //    `../armazenamento/rotulo-no-contexto.ts`, que no legado so aparece por
  //    escrita direta.
  const registrado = escopo.contextos.obter(pedido.contexto);
  if (registrado === null) {
    return erroDeTermo(
      'invalid_taxonomy',
      MENSAGENS_DE_ERRO_DE_TERMO.invalid_taxonomy,
    );
  }

  // 2. `if ( '' === trim( $name ) )` (`:2486`), a mesma recusa, com o mesmo
  //    codigo e a mesma mensagem, que o gemeo tem em `:3308` — as duas ancoras
  //    estao em `../rotulo-e-contexto/erro-de-termo.ts`.
  //
  //    No legado o nome passa antes por `sanitize_term( ..., 'db' )`, que e
  //    cadeia de filtros (REQ-162), e a verificacao acontece **depois** dela: um
  //    interceptador que esvazie o nome cai nesta mesma recusa.
  const nome = pedido.nome.trim();
  if (nome === '') {
    return erroDeTermo(
      'empty_term_name',
      MENSAGENS_DE_ERRO_DE_TERMO.empty_term_name,
    );
  }

  // 3. O filtro `pre_insert_term` (que pode recusar), `wp_unique_term_slug()`
  //    (`:2609`) e o laco de `alias_of` (`:2537`) — **nao portados**, cada um com
  //    a razao e a consequencia na tabela do cabecalho.
  const slug = pedido.slug ?? '';
  const descricao = pedido.descricao ?? '';

  // 4. **CA-4.2**: contexto plano guarda `0`. A regra mora em
  //    `./hierarquia-do-rotulo.ts`, e nao aqui, porque ela e a **mesma** nas duas
  //    operacoes que escrevem a coluna.
  const rotuloPaiId = paiAceitoNoContexto(registrado, pedido.rotuloPaiId);

  // 5. `INSERT INTO terms (name, slug, term_group) VALUES (?, ?, ?)` (`:2624`),
  //    com as **tres** colunas na ordem do `compact( 'name', 'slug',
  //    'term_group' )` de `:2611`, e com o filtro `wp_insert_term_data` (`:2622`)
  //    imediatamente antes — declarado, nao emitido.
  //
  //    O grupo nasce `0` (`:2525`), que e o default do DDL e o valor do legado
  //    quando ninguem informa `alias_of`.
  const rotuloId = escopo.armazenamento.rotulos.inserir({
    nome,
    slug,
    grupoDeSinonimos: SEM_GRUPO_DE_SINONIMOS,
  });

  // 6. `UPDATE terms SET slug WHERE term_id` (`:2636`), entre as acoes
  //    `edit_terms` (`:2635`) e `edited_terms` (`:2639`) — o ramo do apelido
  //    vazio, que o comentario do proprio legado chama de *"seems unreachable"*
  //    (`../armazenamento/rotulo.ts`).
  //
  //    ⚠️ **Nao e emitido, e a ausencia e declarada**: o valor que ele gravaria e
  //    `sanitize_title( $name, $term_id )`, e `sanitize_title()` nao existe nesta
  //    arvore. Emitir o `UPDATE` com o mesmo `''` seria um comando que nao muda
  //    nada; emiti-lo com um apelido derivado aqui seria inventar a derivacao. Ha
  //    teste com 🔴 no nome fixando que a linha fica com `''`.

  // 7. A leitura do par `(term_id, taxonomy)` (`:2643`), que no caminho normal
  //    **nao encontra nada** porque o identificador acabou de ser gerado — ver o
  //    item 1 do cabecalho. A cadeia e a de `idDoRotuloNoContexto`, identica a de
  //    `wp_update_term()` em `:3380`.
  const parExistente =
    escopo.armazenamento.rotulosNoContexto.idDoRotuloNoContexto(
      rotuloId,
      pedido.contexto,
    );

  if (parExistente !== null) {
    // `if ( ! empty( $tt_id ) ) { return array( 'term_id' => $term_id,
    // 'term_taxonomy_id' => $tt_id ); }` (`:2650`): devolve o par existente
    // **sem inserir nada** e sem confirmar duplicata.
    return { rotuloId, rotuloNoContextoId: parExistente };
  }

  // 8. `INSERT INTO term_taxonomy (term_id, taxonomy, description, parent, count)
  //    VALUES (?, ?, ?, ?, ?)` (`:2652`), com `count = 0` **explicito** — o
  //    legado o acrescenta depois do `compact`, e por isso ele e a ultima coluna
  //    do comando ({@link CONTAGEM_INICIAL_DE_USO}). A contagem nasce zero porque
  //    um rotulo novo nao classifica nada: e **CA-4.5** no instante zero.
  const rotuloNoContextoId = escopo.armazenamento.rotulosNoContexto.inserir({
    rotuloId,
    contexto: pedido.contexto,
    descricao,
    rotuloPaiId,
  });

  // 9. A confirmacao de duplicata (`:2664`), **depois** das duas insercoes, e o
  //    filtro `wp_insert_term_duplicate_term_check` (`:2682`) entre ela e o
  //    desfazimento — declarado, nao emitido. Com o filtro desligado, as duas
  //    linhas novas ficariam.
  const duplicata = escopo.armazenamento.termos.confirmarDuplicata({
    slug,
    rotuloPaiId,
    contexto: pedido.contexto,
    rotuloId,
    rotuloNoContextoId,
  });

  if (duplicata !== null) {
    // 10. `$wpdb->delete( $wpdb->terms, ... )` (`:2685`) e
    //     `$wpdb->delete( $wpdb->term_taxonomy, ... )` (`:2686`), **nesta
    //     ordem** — o inverso da ordem da exclusao de verdade. O legado desfaz o
    //     que acabou de gravar e devolve o par **antigo** (`:2694`).
    escopo.armazenamento.rotulos.apagar(rotuloId);
    escopo.armazenamento.rotulosNoContexto.apagar(rotuloNoContextoId);

    return {
      rotuloId: duplicata.rotuloId,
      rotuloNoContextoId: duplicata.rotuloNoContextoId,
    };
  }

  // 11. `clean_term_cache()` — sem cache nesta arvore. As acoes `create_term`,
  //     `create_{$taxonomy}`, `created_term`, `created_{$taxonomy}`, `saved_term`
  //     e `saved_{$taxonomy}`, mais o filtro `term_id_filter` — declaradas na
  //     tabela do cabecalho, nao emitidas.
  return { rotuloId, rotuloNoContextoId };
}
