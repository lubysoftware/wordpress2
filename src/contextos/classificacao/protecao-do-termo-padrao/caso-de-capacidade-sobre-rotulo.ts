/**
 * **CA-5.2**: *"A recusa vence inclusive o ator de maior poder da instalacao"*.
 *
 * Entrega de **T011** da feature `003-classificacao-do-conteudo` (US-5). E o
 * `case` de `map_meta_cap()` que traduz capacidade **sobre um termo** — o que
 * T005 e T009 apontaram por escrito como sendo desta tarefa:
 *
 * > # 🔴 As capacidades sobre o OBJETO termo nao estao aqui, e sao de T011
 * > (...) Esse `case` carrega a regra que `BR-MIGRAR-091` (`PERM-5`) poe em
 * > `wp-includes/capabilities.php:738` — *"o **termo padrao da taxonomia e
 * > indestrutivel**"* — e e **US-5, T011**
 * > — `../manutencao-da-lista/caso-de-gestao-de-rotulo.ts`
 *
 * O mecanismo e o de **ADR 0009**, que `spec.md` cita na propria US-5, e o
 * trecho dele que decide esta historia esta na familia *Protecao de objeto* da
 * tabela de 40 pontos: *"termo padrao da taxonomia nao se apaga
 * (`:738`-`:744`)"*. O ADR e literal sobre por que isso nao e uma negacao
 * qualquer:
 *
 * > Criar uma **pseudocapacidade que ninguem pode possuir** — `do_not_allow` — e
 * > verifica-la **antes** do atalho do super admin. (...) Objetos estruturais
 * > ficam protegidos sem tabela de excecoes: revisao e termo padrao nao sao
 * > apagaveis por ninguem.
 *
 * ---
 *
 * # OS TRES VALORES, e este arquivo usa os tres
 *
 * `plataforma/autorizacao/traducao-de-capacidade.ts` fixou a convencao em T015, e
 * ADR 0009 manda replicar exatamente estes tres: *"nao dois"*.
 *
 * | devolve | significa | quando, aqui |
 * |---|---|---|
 * | `null` | *"nao e meu caso"* | a capacidade pedida nao e `edit_term` nem `delete_term` |
 * | `['do_not_allow']` | **negado, e nao se negocia** | termo que nao existe, contexto nao registrado, e **o termo padrao em `delete_term`** |
 * | a lista traduzida | o que o contexto declarou, ja resolvido | o caminho normal: `$tax->cap->{edit,delete}_terms` |
 *
 * ⚠️ **Lista vazia nao aparece aqui**, e a ausencia e afirmacao: `[]` significa
 * *"permitido"* (a pegadinha 2 de `permissions.md`, em `BR-MIGRAR-092`), e nenhum
 * ramo deste `case` permite sem exigir nada.
 *
 * # OS QUATRO RAMOS, na ordem do legado — e a ordem e a regra
 *
 * Cada ramo **para** o `case` (`break`, no legado), logo trocar dois de lugar
 * muda a resposta sem quebrar teste nenhum. A ordem:
 *
 * | # | ramo | o que devolve | por que aqui |
 * |---|---|---|---|
 * | 1 | `$term = get_term( (int) $args[0] )` nao devolveu um termo | `do_not_allow` | `PERM-5` / `PERM-4`: *"no mapeamento de capacidade, todo caminho de erro **fecha** a porta"* |
 * | 2 | o contexto do termo nao esta registrado (`! $tax`) | `do_not_allow` | idem, e e tambem de onde sai `$tax->cap` |
 * | 3 | **`delete_term` sobre o termo padrao do contexto** | `do_not_allow` | `:738`-`:744` — **CA-5.1** e **CA-5.2** |
 * | 4 | o caminho normal: `$taxo_cap = $cap . 's'`, e **recursao** | a lista de `$tax->cap->$taxo_cap`, traduzida | e por ela que `delete_post_tags` chega em `manage_categories` |
 *
 * **O ramo 3 e so de `delete_term`.** Editar o termo padrao e permitido, e
 * renomea-lo tambem: `CA-5.1` fala de apagar, `UC-08` fala de apagar, e a
 * pos-condicao e *"o termo padrao da taxonomia continua **existindo**"*. Um porte
 * que negasse `edit_term` no padrao trancaria a tela de edicao da categoria
 * "Uncategorized", que o legado abre.
 *
 * # POR QUE O RAMO 4 E RECURSAO, e nao uma consulta a mais
 *
 * No legado o ramo e literalmente `$caps = map_meta_cap( $tax->cap->$taxo_cap,
 * $user_id, $term_id )`: a funcao chama **a si mesma**, com o nome que o contexto
 * declarou. E e essa recursao que faz o atalho de nomenclatura funcionar — sem
 * ela, `post_tag` pediria `delete_post_tags`, que *"nao e capacidade primitiva e
 * nao esta em papel nenhum"*, e **todo mundo seria recusado, inclusive o
 * administrador** (`../manutencao-da-lista/caso-de-gestao-de-rotulo.ts`).
 *
 * {@link casosDaCapacidadeSobreRotulo} e a lista que reproduz essa recursao: ela
 * devolve este caso com uma funcao que traduz **na mesma lista**, com as quatro
 * constantes do dono do servidor na primeira posicao — a ordem que
 * `BR-MIGRAR-094` exige declarada e que `decisao-de-capacidade.ts` declara
 * (*"um caso de objeto nao consegue reabrir o que uma constante fechou"*).
 *
 * ⚠️ **Nenhum limite de profundidade foi acrescentado**, e a ausencia e o
 * **P6**: um contexto que declarasse `delete_terms: 'delete_term'` recursionaria
 * sem fim, e e o que o legado faz. Inventar aqui uma contagem de niveis seria
 * *"introduzir limite que o legado nao tem"*, que a tabela *Nao negociavel* poe
 * fora do alcance do agente.
 *
 * # 🔴 O QUE NAO FOI RECONFERIDO NO ORACULO
 *
 * **A instalacao do legado nao esta no disco desta maquina** — o limite que T007,
 * T009 e T010 registraram e que continua valendo (`oracleAvailable: false`, e nao
 * ha `wp-includes/capabilities.php` para abrir). Tudo aqui vem do pacote
 * (ADR 0009, `BR-MIGRAR-091`, `BR-MIGRAR-092`, UC-08, `target_screens.md`
 * `SCR-044`) ou da transcricao **merged** de T005, T009 e T015 da feature `001`.
 * Tres pontos ficaram marcados, e os tres tem teste:
 *
 * | ponto | o que esta tarefa fez | por que esse lado |
 * |---|---|---|
 * | **qual chave de opcao o `case` le.** O pacote diz *"o termo padrao da taxonomia"* e nao transcreve a leitura; a chave que a arvore conhece para esse valor e {@link chaveDoTermoPadrao}, ancorada em `taxonomy.php:2075`/`:2084` e `post.php:5432`/`:5434` | **le a chave do contexto**, a mesma do passo 2 da exclusao | ler uma segunda chave que o pacote nao nomeia inventaria nome de opcao, e nome de opcao e superficie publicada (P8, tabela *Nao negociavel*). Para `category` — o **unico** dos oito contextos do nucleo com padrao semeado (`BR-MIGRAR-084`) — a chave e a mesma nas duas leituras possiveis |
 * | **se o `case` tambem exige `default_term` declarado**, como o passo 2 da exclusao exige em `:2083` | **nao exige**: le a opcao sempre | UC-08 e `BR-MIGRAR-091` enunciam a negacao sem condicao, e a diferenca e inalcancavel: sem `default_term` declarado e fora de `category`, **ninguem grava** a opcao (`register_taxonomy()`, `taxonomy.php:543`), logo ela vale `0` e nao casa com nenhum rotulo |
 * | **o terceiro rotulo do `case`.** `map_meta_cap()` agrupa rotulos de capacidade por `case` em cascata, e `assign_term` seria o candidato natural a dividir este | **nao portado**: o `case` reconhece `edit_term` e `delete_term`, e so | o nome `assign_term` **nao aparece em nenhum documento do pacote** — `SCR-044` e `SCR-045` listam `delete_term` e `edit_term`, UC-08 lista os quatro nomes no **plural**, e nenhum criterio de US-5 o menciona. T003 ja havia fixado a doutrina: *"P8 proibe remover superficie; **nao autoriza acrescentar**"*. Se ele existir, entra com a feature que o cobrar, neste mesmo arquivo e por este mesmo caminho |
 *
 * ## Os pontos de extensao desta decisao
 *
 * Nenhum e deste arquivo: `map_meta_cap()` e o filtro `user_has_cap` sao emitidos
 * por `plataforma/autorizacao/`, e os dois estao declarados la (T015). O que vale
 * repetir e a **posicao** deles, porque e dela que CA-5.2 depende: a negacao e
 * verificada **antes** do atalho do super administrador e as duas sinteticas sao
 * aplicadas **depois** do ponto de extensao, *"logo nem conceder `do_not_allow`
 * por aqui funciona"*.
 */

import {
  CAPACIDADE_NEGADA,
  revogacaoPorConstante,
  traduzirCapacidade,
  type Capacidade,
  type CasoDeTraducao,
  type PedidoDeTraducao,
} from '../../../plataforma/autorizacao/index.js';
import { casoDeGestaoDeRotulo } from '../manutencao-da-lista/index.js';
import type {
  CapacidadesDoContexto,
  ContextoDeClassificacao,
} from '../registro/index.js';
import { ehErroDeTermo, obterTermo } from '../rotulo-e-contexto/index.js';
import {
  chaveDoTermoPadrao,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';

/**
 * `edit_term` — editar **este** termo (`wp-admin/edit-tags.php:173`,
 * `wp-admin/term.php`).
 *
 * No singular, que e a forma de capacidade **sobre um objeto**: ela so se
 * pergunta com o identificador do termo em maos. `SCR-044` e `SCR-045` a listam
 * em *Capacidade exigida*.
 */
export const CAPACIDADE_DE_EDITAR_O_ROTULO: Capacidade = 'edit_term';

/**
 * `delete_term` — apagar **este** termo (`wp-admin/edit-tags.php:117`).
 *
 * E a unica das duas que carrega a protecao do termo padrao, e e por isso que
 * `CA-5.1` e `CA-5.2` se decidem nela.
 */
export const CAPACIDADE_DE_APAGAR_O_ROTULO: Capacidade = 'delete_term';

/**
 * `$taxo_cap = $cap . 's'` — de qual nome declarado pelo contexto cada capacidade
 * sobre o termo depende.
 *
 * No legado e concatenacao de cadeia sobre propriedade dinamica
 * (`$tax->cap->$taxo_cap`); aqui e um mapa explicito porque
 * {@link CapacidadesDoContexto} tem campos nomeados, escolha que T001 fez e
 * justificou. **Este mapa e tambem o teste de pertinencia do `case`**: nome que
 * ele nao conhece nao e deste caso, e a traducao continua nos outros.
 */
const NOME_DECLARADO_PELO_CONTEXTO: Readonly<
  Record<Capacidade, (capacidades: CapacidadesDoContexto) => Capacidade>
> = {
  [CAPACIDADE_DE_EDITAR_O_ROTULO]: (capacidades) => capacidades.editarRotulos,
  [CAPACIDADE_DE_APAGAR_O_ROTULO]: (capacidades) => capacidades.apagarRotulos,
};

/** As capacidades sobre o objeto termo que este caso reconhece, e so elas. */
export const CAPACIDADES_SOBRE_O_ROTULO: readonly Capacidade[] = Object.keys(
  NOME_DECLARADO_PELO_CONTEXTO,
);

/** `(int) $args[0]`: ausente, ou de outro tipo, vale `0` — e `0` nao e termo. */
function rotuloInformado(argumentos: readonly unknown[]): number {
  const argumento = argumentos[0];
  return typeof argumento === 'number' ? Math.trunc(argumento) : 0;
}

/**
 * O `case` de capacidade sobre um termo — `wp-includes/capabilities.php`, o
 * trecho que termina imediatamente antes dos cinco nomes de `:749`-`:754`.
 *
 * **Le o termo e o registro; nao decide nada sobre ator.** Quem decide e
 * `perguntarPermissao()`, e a unica coisa que este caso faz e dizer **o que** se
 * exige — inclusive a pseudocapacidade que ninguem pode ter.
 *
 * O `recursao` e `map_meta_cap()` chamando a si mesma: ver
 * {@link casosDaCapacidadeSobreRotulo}, que e quem o liga.
 */
export function casoDeCapacidadeSobreRotulo(
  escopo: EscopoDeVinculoDeObjeto,
  opcoes: OpcoesNaClassificacao,
  recursao: (pedido: PedidoDeTraducao) => readonly Capacidade[],
): CasoDeTraducao {
  return (pedido) => {
    const nomeDeclarado = NOME_DECLARADO_PELO_CONTEXTO[pedido.capacidade];

    // `default:` do legado: a capacidade pedida nao e deste `case`.
    if (nomeDeclarado === undefined) {
      return null;
    }

    // Ramo 1: `$term = get_term( (int) $args[0] )`, e
    // `if ( ! $term instanceof WP_Term ) { $caps[] = 'do_not_allow'; break; }`.
    //
    // ⚠️ As **tres** saidas nao-termo de `obterTermo()` caem aqui, e as tres
    // caem no legado tambem: `invalid_term` (identificador zero), `null` (nao
    // existe) e `ambiguous_term_id` (rotulo compartilhado entre contextos, que
    // T003 inventariou). Nenhuma delas e `WP_Term`.
    const rotulo = obterTermo(escopo, rotuloInformado(pedido.argumentos));
    if (rotulo === null || ehErroDeTermo(rotulo)) {
      return [CAPACIDADE_NEGADA];
    }

    // Ramo 2: `$tax = get_taxonomy( $term->taxonomy ); if ( ! $tax ) { ... }`.
    // Aqui ele e tambem a leitura de `$tax->cap`, que o ramo 4 usa.
    const contexto: ContextoDeClassificacao | null = escopo.contextos.obter(
      rotulo.contexto,
    );
    if (contexto === null) {
      return [CAPACIDADE_NEGADA];
    }

    // Ramo 3 (`:738`-`:744`): **o termo padrao do contexto e indestrutivel**, e
    // a negacao vence o atalho do super administrador (ADR 0009).
    if (pedido.capacidade === CAPACIDADE_DE_APAGAR_O_ROTULO) {
      const padraoDoContexto = opcoes.identificadorDoTermoPadrao(
        chaveDoTermoPadrao(contexto.nome),
      );
      if (padraoDoContexto === rotulo.rotuloId) {
        return [CAPACIDADE_NEGADA];
      }
    }

    // Ramo 4: `$caps = map_meta_cap( $tax->cap->$taxo_cap, $user_id, $term_id )`
    // — a recursao, com o termo como unico argumento, como no legado.
    return recursao({
      ...pedido,
      capacidade: nomeDeclarado(contexto.capacidades),
      argumentos: [rotulo.rotuloId],
    });
  };
}

/**
 * A lista de casos de traducao com o `case` do termo dentro, e com a **recursao**
 * que o ramo 4 dele precisa.
 *
 * A ordem declarada, que e o que `BR-MIGRAR-094` cobra:
 *
 * 1. o `case` de capacidade sobre o **termo** — o unico que pode devolver
 *    `do_not_allow` por causa do termo padrao;
 * 2. o atalho dos **cinco nomes** de `PERM-6`
 *    (`../manutencao-da-lista/caso-de-gestao-de-rotulo.ts`), que e onde a
 *    recursao do ramo 4 aterra;
 * 3. os casos que o chamador trouxer.
 *
 * As quatro constantes do dono do servidor **nao** entram nesta lista: elas sao a
 * primeira posicao da ordem e `capacidadesExigidas()` as prepoe sempre. A
 * recursao daqui faz o mesmo, de proposito — no legado ela e a **mesma** funcao,
 * logo passa pelos mesmos `case`.
 *
 * ⚠️ **A lista se referencia a si mesma, e isso e o legado e nao um truque:**
 * `map_meta_cap()` e recursiva (`$caps = map_meta_cap( ... )` dentro do proprio
 * `switch`). A alternativa seria resolver `$tax->cap->delete_terms` por um
 * caminho **diferente** do que toda capacidade percorre, e ai um atalho de
 * nomenclatura — ou uma constante do dono do servidor — deixaria de valer num
 * caminho e valeria no outro.
 */
export function casosDaCapacidadeSobreRotulo(
  escopo: EscopoDeVinculoDeObjeto,
  opcoes: OpcoesNaClassificacao,
  outrosCasos: readonly CasoDeTraducao[] = [],
): readonly CasoDeTraducao[] {
  const casos: CasoDeTraducao[] = [];

  const recursao = (pedido: PedidoDeTraducao): readonly Capacidade[] =>
    traduzirCapacidade(pedido, [revogacaoPorConstante, ...casos]);

  casos.push(
    casoDeCapacidadeSobreRotulo(escopo, opcoes, recursao),
    casoDeGestaoDeRotulo,
    ...outrosCasos,
  );

  return casos;
}
