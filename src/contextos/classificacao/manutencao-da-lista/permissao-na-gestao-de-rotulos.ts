/**
 * **CA-4.1**: *"A tela exige a capacidade que o contexto declara para
 * gerencia-lo"*.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4). E o
 * portao de entrada da tela de termos — `wp-admin/edit-tags.php:26`, que
 * `spec.md` poe na primeira coluna de evidencia de US-4 —, mais o portao da acao
 * de criar (`:86`). E o passo 2 do fluxo principal de UC-08 (*"Sistema verifica a
 * capacidade de gerenciar aquela taxonomia"*) e as duas pre-condicoes dele:
 * *"a taxonomia esta registrada e visivel no painel"* e *"o ator tem a
 * capacidade declarada pela taxonomia"*.
 *
 * | aqui | no legado | mensagem |
 * |---|---|---|
 * | {@link permissaoDeGerenciarRotulos} | `wp-admin/edit-tags.php:13`, `:23`, `:26`-`:29` | as tres de `target_screens.md`, `SCR-044` § 4 |
 * | {@link permissaoDeCriarRotulo} | `wp-admin/edit-tags.php:86` | *"Sorry, you are not allowed to create terms in this taxonomy."* |
 *
 * ---
 *
 * # Por que o portao e aqui, e nao dentro das operacoes
 *
 * Porque e assim no legado, e as duas ondas anteriores ja o escreveram. **Nenhuma
 * funcao de termo do nucleo verifica capacidade:** `wp_update_term()` nao tem
 * `current_user_can` no corpo (T003, `../rotulo-e-contexto/renomear-rotulo.ts`),
 * `wp_set_object_terms()` e `wp_remove_object_terms()` tambem nao e o nucleo as
 * chama **sem ator** (T005, `../vinculo-de-objeto/substituir-vinculos.ts`), e
 * `wp_delete_term()` nao a verifica (ver `./apagar-rotulo-do-contexto.ts`). Quem
 * cobra sao as superficies, cada uma a sua maneira — e as tres ondas anteriores
 * apontaram **esta tarefa** como a dona da cobranca da tela:
 *
 * - *"Quem cobra e a tela de termos (`manage_terms`,
 *   `wp-admin/edit-tags.php:26`), que e **CA-4.1**, de T009"* (T003,
 *   `../index.ts`);
 * - *"A cobranca entra com a superficie: CA-4.1 em T009"* (T003,
 *   `renomear-rotulo.ts`);
 * - *"Isso e **CA-4.1**, de T009"* (T003, `remover-rotulo-do-contexto.ts`).
 *
 * Verificar dentro das operacoes recusaria o que o legado aceita — a chamada
 * interna do proprio nucleo, que acontece sem ninguem autenticado —, e o **P1**
 * proibe. Por isso este arquivo e **a unica coisa de US-4 que verifica
 * capacidade**, e as outras tres operacoes declaram sem verificar.
 *
 * # A ORDEM DOS TRES PORTOES e a do legado, e ela importa
 *
 * `target_screens.md` da a ordem pela linha de cada mensagem, e as duas
 * pre-condicoes de UC-08 a confirmam:
 *
 * | # | portao | o que recusa | ancora |
 * |---|---|---|---|
 * | 1 | o contexto esta registrado? | `'Invalid taxonomy.'` | `edit-tags.php:13` |
 * | 2 | o contexto e visivel no painel? | `'Sorry, you are not allowed to edit terms in this taxonomy.'` | `:23` |
 * | 3 | o ator tem `$tax->cap->manage_terms`? | `'You need a higher level of permission.'` + `'Sorry, you are not allowed to manage terms in this taxonomy.'` | `:28` e `:29` |
 *
 * Invertendo 2 e 3, um contexto invisivel ao painel recusaria por capacidade — e
 * `link_category`, que e **invisivel ao publico e visivel no painel**
 * (`../registro/contextos-do-nucleo.ts`), e exatamente o caso em que a diferenca
 * aparece.
 *
 * ⚠️ **O portao 2 nao e de capacidade, e a mensagem dele engana.** Ela fala de
 * *"edit terms"*, mas a condicao e de **visibilidade**, nao de poder: o legado
 * compara o contexto com a lista dos que declaram interface
 * (`mostrarNaInterface`, o `show_ui` de `register_taxonomy()`). Um porte que
 * lesse a mensagem em vez da condicao trocaria o portao por um
 * `current_user_can( $tax->cap->edit_terms )` e passaria a recusar quem o legado
 * aceita. A pre-condicao de UC-08 e que decide: *"a taxonomia esta registrada **e
 * visivel no painel**"*.
 *
 * # 🔴 TRES PORTOES DA MESMA TELA NAO ESTAO AQUI, e sao de T011
 *
 * `target_screens.md` lista, em `SCR-044`, as capacidades exigidas pela tela:
 * **`delete_term`, `edit_term`, `import`** — no **singular**, que e a forma de
 * capacidade **sobre um objeto**. Os tres portoes que as pedem sao:
 *
 * | acao | mensagem | ancora |
 * |---|---|---|
 * | apagar um termo | *"Sorry, you are not allowed to delete this item."* | `edit-tags.php:117` |
 * | apagar em lote | *"Sorry, you are not allowed to delete these items."* | `:137` |
 * | editar um termo | *"Sorry, you are not allowed to edit this item."* | `:173` |
 *
 * As tres passam pelo `case` de `map_meta_cap()` que traduz capacidade **sobre um
 * termo**, e esse `case` carrega a regra que `BR-MIGRAR-091` (`PERM-5`) poe em
 * `wp-includes/capabilities.php:738` — *"o **termo padrao da taxonomia e
 * indestrutivel**"*, com a negacao que *"vence ate o super administrador"*
 * (UC-08, *Excecoes*; ADR 0009). **Isso e US-5, T011**, e sao literalmente os
 * criterios CA-5.1 e CA-5.2.
 *
 * Porta-los aqui obrigaria a uma das duas coisas que esta tarefa nao pode fazer:
 * ou implementar a protecao do termo padrao, que e o criterio de outra tarefa, ou
 * perguntar `$tax->cap->delete_terms` direto e produzir um portao que responde
 * *"pode apagar"* para o termo padrao — exatamente o contrario de CA-5.1.
 *
 * ⚠️ E `import` e da tela de importacao, nao desta regra: a tela a pergunta para
 * decidir um atalho de navegacao. Nao e portao de gestao de rotulo.
 *
 * # As mensagens ficam em ingles, e vem byte a byte do pacote
 *
 * `EC-05` de `target_screens.md` fixa que *"o `msgid` em ingles **E** a chave do
 * catalogo"*: traduzir aqui trocaria a chave. E o § 4 de `SCR-044` e literal
 * sobre a comparacao — *"o principio 2 do SKILL preserva o texto **verbatim**, e
 * nenhuma revisao linguistica foi aprovada... `diff` de string tem de ser
 * zero"*. As quatro cadeias deste arquivo foram transcritas da tabela de
 * mensagens literais de `SCR-044`, com a linha de cada uma.
 *
 * ⚠️ **Quem renderiza a recusa nao e este arquivo.** As tres mensagens do portao
 * de entrada saem por `wp_die()` e `target_screens.md` as manda renderizar na
 * tela compartilhada `tela-de-erro-generica` (`SCR-112`), *"com resposta HTTP
 * propria"*. A resposta HTTP e o HTML sao de **BC-10** (`plataforma/telas`), e
 * nao estao nesta arvore: este arquivo devolve o codigo e o `msgid`, que e o que
 * uma tela precisa para montar os dois. **Nenhum numero de resposta HTTP e
 * declarado aqui**, porque o **P6** manda que onde esta tarefa nao pode conferir o
 * numero ela nao o invente.
 */

import {
  comAtor,
  perguntarPermissao,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDeClassificacao } from '../registro/index.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';
import { casoDeGestaoDeRotulo } from './caso-de-gestao-de-rotulo.js';
import type { ColaboracaoDaGestaoDaLista } from './escopo-de-manutencao-da-lista.js';

/**
 * As mensagens de recusa da tela de termos, **na forma em que o legado as
 * emite**.
 *
 * Transcritas da tabela *Mensagens literais* de `SCR-044` em
 * `target_screens.md`, com a linha de cada uma. Nenhuma e interpolada: o `msgid`
 * e a chave do catalogo.
 */
export const MENSAGENS_DA_TELA_DE_ROTULOS = {
  /** `wp-admin/edit-tags.php:13` — o contexto nao esta registrado. */
  contextoNaoRegistrado: 'Invalid taxonomy.',
  /**
   * `wp-admin/edit-tags.php:23` — o contexto **nao e visivel no painel**.
   *
   * ⚠️ A mensagem fala de *"edit terms"* e a condicao e de visibilidade. Ver o
   * cabecalho deste arquivo.
   */
  contextoForaDoPainel:
    'Sorry, you are not allowed to edit terms in this taxonomy.',
  /**
   * `wp-admin/edit-tags.php:28` — o titulo da recusa de capacidade, e o
   * **primeiro `<h1>` da tela** segundo `SCR-044` § 1.
   */
  tituloDaRecusaDeCapacidade: 'You need a higher level of permission.',
  /** `wp-admin/edit-tags.php:29` — o corpo da mesma recusa. */
  semCapacidadeDeGerenciar:
    'Sorry, you are not allowed to manage terms in this taxonomy.',
  /** `wp-admin/edit-tags.php:86` — a acao de criar, recusada. */
  semCapacidadeDeCriar:
    'Sorry, you are not allowed to create terms in this taxonomy.',
} as const;

/** Por que a tela de termos recusou. Sao os tres `if` do legado, nomeados. */
export type MotivoDaRecusaDaTelaDeRotulos =
  /** `! $tax` (`wp-admin/edit-tags.php:13`). */
  | 'contexto-nao-registrado'
  /**
   * O contexto nao esta entre os que declaram interface de painel
   * (`wp-admin/edit-tags.php:23`).
   */
  | 'contexto-fora-do-painel'
  /** `! current_user_can( $tax->cap->manage_terms )` (`:26`). */
  | 'sem-capacidade-de-gerenciar'
  /** `! current_user_can( $tax->cap->edit_terms )` (`:86`). */
  | 'sem-capacidade-de-criar';

/** A recusa, com o que uma tela precisa para renderiza-la. */
export interface RecusaDaTelaDeRotulos {
  readonly motivo: MotivoDaRecusaDaTelaDeRotulos;
  /**
   * O `msgid` que o legado emite — chave do catalogo, nao texto final.
   *
   * Ver {@link MENSAGENS_DA_TELA_DE_ROTULOS}.
   */
  readonly mensagem: string;
  /**
   * O titulo que acompanha a mensagem, quando o legado emite dois.
   *
   * ⚠️ So a recusa de capacidade do portao de entrada tem titulo
   * (`edit-tags.php:28`), e e por isso que este campo e opcional em vez de
   * carregar cadeia vazia nos outros tres: cadeia vazia nao e `msgid` nenhum, e o
   * catalogo nao tem entrada para ela.
   */
  readonly titulo?: string;
}

/** O desfecho de um portao da tela: o contexto resolvido, ou a recusa. */
export type ResultadoDaGestaoDaLista =
  | {
      readonly permitido: true;
      /** O contexto resolvido, que a tela usa para montar o resto. */
      readonly contexto: ContextoDeClassificacao;
    }
  | { readonly permitido: false; readonly recusa: RecusaDaTelaDeRotulos };

/** Monta a recusa com o `msgid` que o motivo carrega. */
function recusar(
  motivo: MotivoDaRecusaDaTelaDeRotulos,
  mensagem: string,
  titulo?: string,
): ResultadoDaGestaoDaLista {
  return {
    permitido: false,
    recusa:
      titulo === undefined
        ? { motivo, mensagem }
        : { motivo, mensagem, titulo },
  };
}

/**
 * Pergunta a capacidade que o contexto declara, **com o atalho dos cinco nomes**.
 *
 * O caso de traducao e acrescentado aos que o chamador trouxe, e nao os
 * substitui: ele e disjunto de todos os outros do pacote (ver
 * `caso-de-gestao-de-rotulo.ts`). E a mesma composicao que
 * `../vinculo-de-objeto/classificar-conteudo.ts` faz com o caso de atribuicao, e
 * pela mesma razao — o caso e deste modulo, nao do chamador.
 */
function podeNoContexto(
  colaboracao: ColaboracaoDaGestaoDaLista,
  capacidade: string,
): boolean {
  const autorizacao = comAtor(
    {
      ...colaboracao.base,
      casosDeTraducao: [
        ...(colaboracao.base.casosDeTraducao ?? []),
        casoDeGestaoDeRotulo,
      ],
    },
    colaboracao.ator,
  );

  return perguntarPermissao(autorizacao, capacidade);
}

/**
 * O portao de entrada da tela de termos — **CA-4.1**.
 *
 * **Permissao exigida: `$tax->cap->manage_terms`, o
 * `capacidades.gerenciarRotulos` do contexto, e ela E verificada aqui.** E a
 * unica operacao de US-4 que verifica capacidade, e verifica porque e aqui que o
 * legado a verifica (`wp-admin/edit-tags.php:26`). Para `category` ela e
 * `manage_categories`, que e primitiva; para `post_tag` e `manage_post_tags`, que
 * **resolve** para `manage_categories` pelo caso deste modulo — sem ele, ninguem
 * gerenciaria etiquetas, nem o administrador (`caso-de-gestao-de-rotulo.ts`).
 *
 * **Nao toca o banco**: os tres portoes leem o registro desta requisicao e a
 * matriz que chegou por argumento. A recusa de UC-08 e *"antes de tocar qualquer
 * registro"*, e e o que este arquivo cumpre.
 *
 * Devolve o contexto resolvido quando permite, porque e isso que a tela faz com
 * ele em seguida (`$tax` atravessa `edit-tags.php` inteiro, de `:44` ao fim).
 */
export function permissaoDeGerenciarRotulos(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaGestaoDaLista,
  contexto: string,
): ResultadoDaGestaoDaLista {
  // 1. `$tax = get_taxonomy( $taxonomy ); if ( ! $tax ) { wp_die( ... ) }`
  //    (`wp-admin/edit-tags.php:13`).
  const registrado = escopo.contextos.obter(contexto);
  if (registrado === null) {
    return recusar(
      'contexto-nao-registrado',
      MENSAGENS_DA_TELA_DE_ROTULOS.contextoNaoRegistrado,
    );
  }

  // 2. O contexto tem de declarar interface de painel (`:23`). E a pre-condicao
  //    *"visivel no painel"* de UC-08, e **nao** e capacidade — ver o cabecalho.
  if (!registrado.mostrarNaInterface) {
    return recusar(
      'contexto-fora-do-painel',
      MENSAGENS_DA_TELA_DE_ROTULOS.contextoForaDoPainel,
    );
  }

  // 3. `if ( ! current_user_can( $tax->cap->manage_terms ) )` (`:26`), com o
  //    titulo e o corpo que o legado emite juntos (`:28` e `:29`).
  if (!podeNoContexto(colaboracao, registrado.capacidades.gerenciarRotulos)) {
    return recusar(
      'sem-capacidade-de-gerenciar',
      MENSAGENS_DA_TELA_DE_ROTULOS.semCapacidadeDeGerenciar,
      MENSAGENS_DA_TELA_DE_ROTULOS.tituloDaRecusaDeCapacidade,
    );
  }

  return { permitido: true, contexto: registrado };
}

/**
 * O portao da acao de **criar** rotulo pela tela — `wp-admin/edit-tags.php:86`.
 *
 * **Permissao exigida: `$tax->cap->edit_terms`, o `capacidades.editarRotulos` do
 * contexto, e ela E verificada aqui.** Para `category` e `edit_categories` e para
 * `post_tag` e `edit_post_tags`: **as duas resolvem para `manage_categories`**
 * pelo caso deste modulo, e e por isso que em papeis de fabrica **autor nao cria
 * categoria** — a consequencia que `../vinculo-de-objeto/rotulos-informados.ts`
 * descreve no bloco 🔴 dela.
 *
 * ⚠️ **Este portao e da tela, e nao do caminho de atribuir rotulo.** O bloco 🔴 de
 * `rotulos-informados.ts` inventariou os **cinco** lugares em que o legado cobra
 * `edit_terms` — e todos estao no caminho que **cria** o termo pela interface
 * (`ajax-actions.php:613` e `:1116`, `meta-boxes.php:676`,
 * `class-wp-xmlrpc-server.php:1685`, e esta tela) — e mostrou que **no caminho de
 * atribuicao ele nao existe**: `wp_set_object_terms()` chama `wp_insert_term()`
 * direto, sem `current_user_can`. T005 deixou a diferenca registrada e **nao
 * resolvida**, e esta tarefa nao a resolve tampouco: ela porta o portao **da
 * tela**, que e o que CA-4.1 pede, e nao acrescenta portao nenhum ao caminho de
 * atribuicao.
 *
 * O portao de entrada vem **antes** deste no legado — a tela recusa em `:26`
 * antes de chegar ao `case 'add-tag'` de `:81` —, e quem compoe a tela chama os
 * dois nessa ordem. Este arquivo nao os encadeia porque a tela e BC-10.
 */
export function permissaoDeCriarRotulo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaGestaoDaLista,
  contexto: string,
): ResultadoDaGestaoDaLista {
  const registrado = escopo.contextos.obter(contexto);
  if (registrado === null) {
    return recusar(
      'contexto-nao-registrado',
      MENSAGENS_DA_TELA_DE_ROTULOS.contextoNaoRegistrado,
    );
  }

  // `if ( ! current_user_can( $tax->cap->edit_terms ) ) { wp_die( ... ) }`
  // (`wp-admin/edit-tags.php:86`).
  if (!podeNoContexto(colaboracao, registrado.capacidades.editarRotulos)) {
    return recusar(
      'sem-capacidade-de-criar',
      MENSAGENS_DA_TELA_DE_ROTULOS.semCapacidadeDeCriar,
    );
  }

  return { permitido: true, contexto: registrado };
}
