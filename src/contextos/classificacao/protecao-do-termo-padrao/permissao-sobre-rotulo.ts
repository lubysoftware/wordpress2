/**
 * **CA-5.1** e **CA-5.2** na superficie que o usuario alcanca: os **tres portoes
 * de item** da tela de termos, que T009 deixou nomeados e atribuidos a esta
 * tarefa.
 *
 * Entrega de **T011** da feature `003-classificacao-do-conteudo` (US-5). E a
 * continuacao de `../manutencao-da-lista/permissao-na-gestao-de-rotulos.ts`, que
 * portou os portoes de **contexto** (`:26` e `:86`) e escreveu:
 *
 * > # 🔴 TRES PORTOES DA MESMA TELA NAO ESTAO AQUI, e sao de T011
 * > (...) As tres passam pelo `case` de `map_meta_cap()` que traduz capacidade
 * > **sobre um termo** (...) **Isso e US-5, T011**, e sao literalmente os
 * > criterios CA-5.1 e CA-5.2.
 *
 * | aqui | no legado | `msgid` |
 * |---|---|---|
 * | {@link permissaoDeApagarRotulo} | a checagem de `wp-admin/edit-tags.php:114` | *"Sorry, you are not allowed to delete this item."* (`:117`) |
 * | {@link permissaoDeApagarRotulosEmLote} | a acao em lote | *"Sorry, you are not allowed to delete these items."* (`:137`) |
 * | {@link permissaoDeEditarRotulo} | a gravacao da edicao de um termo | *"Sorry, you are not allowed to edit this item."* (`:173`) |
 *
 * As tres cadeias vem **byte a byte** da tabela *Mensagens literais* de `SCR-044`
 * em `target_screens.md`, com a linha de cada uma. `EC-05` fixa que *"o `msgid` em
 * ingles **E** a chave do catalogo"*: traduzir aqui trocaria a chave.
 *
 * ---
 *
 * # ⚠️ O PORTAO EM LOTE NAO E SOBRE O TERMO, e esta e uma correcao de leitura
 *
 * T009 escreveu que *"as tres passam pelo `case` de `map_meta_cap()` que traduz
 * capacidade sobre um termo"*. **Duas passam; a do lote nao**, e duas fontes do
 * pacote concordam nisso:
 *
 * 1. **UC-08, tabela de *Excecoes*,** distingue as duas recusas por nome: *"Apagar
 *    o termo padrao da taxonomia | `do_not_allow` (...)"* e *"Ator sem
 *    **`delete_terms`** | a acao em lote e recusada antes de tocar qualquer
 *    registro"*. `delete_terms`, no **plural**, e o nome que o contexto declara —
 *    e nao a capacidade sobre um objeto;
 * 2. **`SCR-044` § 6** conta *"**3** checagens `current_user_can()`, 3
 *    capacidades distintas"* e § *Capacidade exigida* nomeia as tres:
 *    `delete_term`, `edit_term`, `import`. Com a do lote sendo `delete_term`
 *    seriam **quatro** checagens com **tres** nomes; com ela sendo
 *    `$tax->cap->delete_terms` — uma propriedade, nao uma cadeia literal, logo
 *    nao nomeavel pela analise — a conta fecha exatamente.
 *
 * **A consequencia e observavel, e e o que `UT-037-4` cobra:** a acao em lote
 * **nao** consulta o termo padrao, logo o portao dela responde *"pode"* para um
 * lote que inclua a categoria padrao. O que protege o padrao nesse caminho e o
 * `return 0` de dentro de `wp_delete_term()` — item por item, sem ator — que e
 * `./termo-padrao-indestrutivel.ts`. Um porte que endurecesse o portao em lote
 * para negar o lote **inteiro** recusaria o que o legado aceita: no legado os
 * outros termos do lote **sao apagados**, e so o padrao sobrevive.
 *
 * O **P1** decide o lado sem que esta tarefa escolha: *"reproduza o comportamento
 * observavel do sistema analisado"*, e nenhuma decisao humana autoriza divergir.
 * A frase de T009 e prosa de uma onda anterior, nao documento do pacote.
 *
 * # Por que os portoes sao aqui, e nao dentro das operacoes
 *
 * Pela mesma razao, com as mesmas ancoras, que T003, T005 e T009 escreveram:
 * **nenhuma funcao de termo do nucleo verifica capacidade**. `wp_delete_term()`
 * nao tem `current_user_can` no corpo, e quem cobra sao as superficies — a tela,
 * a API REST, o XML-RPC —, cada uma a sua maneira. Verificar dentro de
 * {@link apagarRotuloDoContexto} recusaria o que o legado aceita: a chamada
 * interna do proprio nucleo, que acontece sem ninguem autenticado.
 *
 * # A ORDEM DOS PORTOES DA TELA, inteira
 *
 * Os portoes de item vem **depois** dos de contexto: a tela recusa em `:26` antes
 * de chegar ao `switch` das acoes. Quem compoe a tela chama nesta ordem, e este
 * arquivo **nao** os encadeia porque a tela e BC-10:
 *
 * | # | portao | de quem e |
 * |---|---|---|
 * | 1 | contexto registrado, visivel no painel, `manage_terms` (`:13`, `:23`, `:26`) | T009 |
 * | 2 | `edit_terms` para **criar** (`:86`) | T009 |
 * | 3 | `delete_term` sobre o item (`:114`), `$tax->cap->delete_terms` no lote (`:137`), `edit_term` sobre o item (`:173`) | **esta tarefa** |
 *
 * # O que NAO esta aqui, e de quem e
 *
 * | o que | por que | de quem e |
 * |---|---|---|
 * | *"You attempted to edit an item that does not exist. Perhaps it was deleted?"* (`:160`) | e o `case` de **navegacao** para a tela de edicao, que termina no redirecionamento de `:163` que `SCR-044` lista — nao e portao de capacidade, e um termo inexistente ja e negado por {@link permissaoDeEditarRotulo} | **BC-10**, com `SCR-045` |
 * | `import` | `SCR-044` a lista, e a tela a pergunta para decidir um **atalho de navegacao** — nao e portao de gestao de rotulo, como T009 ja havia registrado | a tela de importacao |
 * | a conferencia de origem da requisicao (`nonce`) das seis acoes | `SCR-044` § 5 conta as seis; o atestado de `nonce` e `plataforma/` e os prazos dele sao `P4`/`P6` | BC-10 e a feature `001` |
 * | a resposta HTTP e o HTML da recusa | as mensagens saem por `wp_die()` e `target_screens.md` as manda renderizar em `SCR-112`, *"com resposta HTTP propria"*. **Nenhum numero de resposta e declarado aqui**, porque o **P6** manda que onde esta tarefa nao pode conferir o numero ela nao o invente | **BC-10** (`plataforma/telas`) |
 */

import {
  comAtor,
  perguntarPermissao,
} from '../../../plataforma/autorizacao/index.js';
import {
  MENSAGENS_DA_TELA_DE_ROTULOS,
  type ColaboracaoDaGestaoDaLista,
} from '../manutencao-da-lista/index.js';
import { podeNoContexto } from '../manutencao-da-lista/permissao-na-gestao-de-rotulos.js';
import type { EscopoDeVinculoDeObjeto } from '../vinculo-de-objeto/index.js';
import {
  CAPACIDADE_DE_APAGAR_O_ROTULO,
  CAPACIDADE_DE_EDITAR_O_ROTULO,
  casosDaCapacidadeSobreRotulo,
} from './caso-de-capacidade-sobre-rotulo.js';
import type { ColaboracaoDaProtecaoDoTermoPadrao } from './escopo-de-protecao-do-termo-padrao.js';

/**
 * As mensagens de recusa dos tres portoes de item, **na forma em que o legado as
 * emite**.
 *
 * Transcritas da tabela *Mensagens literais* de `SCR-044` em
 * `target_screens.md`, com a linha de cada uma. Nenhuma e interpolada, e nenhuma
 * nomeia o termo: o legado nao poe o nome do item na recusa, e acrescenta-lo
 * mudaria o `msgid`.
 */
export const MENSAGENS_DOS_PORTOES_DE_ITEM = {
  /** `wp-admin/edit-tags.php:117` — apagar um termo, recusado. */
  semCapacidadeDeApagarOItem: 'Sorry, you are not allowed to delete this item.',
  /** `wp-admin/edit-tags.php:137` — a acao em lote, recusada. */
  semCapacidadeDeApagarOsItens:
    'Sorry, you are not allowed to delete these items.',
  /** `wp-admin/edit-tags.php:173` — editar um termo, recusado. */
  semCapacidadeDeEditarOItem: 'Sorry, you are not allowed to edit this item.',
} as const;

/** Por que um portao de item recusou. Sao os tres `if` do legado, nomeados. */
export type MotivoDaRecusaSobreORotulo =
  /**
   * `! current_user_can( 'delete_term', $tag_ID )` (`:114`).
   *
   * ⚠️ **E este o motivo que o termo padrao produz**, e tambem o que um termo
   * inexistente produz: os dois caminham pelo mesmo `case` e os dois terminam em
   * `do_not_allow`. O legado nao os distingue na interface, e distinguir aqui
   * inventaria uma mensagem que o catalogo nao tem.
   */
  | 'sem-capacidade-de-apagar-o-item'
  /** `! current_user_can( $tax->cap->delete_terms )` no lote (`:137`). */
  | 'sem-capacidade-de-apagar-os-itens'
  /** `! current_user_can( 'edit_term', $tag_ID )` (`:173`). */
  | 'sem-capacidade-de-editar-o-item'
  /**
   * `! $tax` — o contexto nao esta registrado, e so o portao do lote o alcanca.
   *
   * O `msgid` dele e o de `:13` (*"Invalid taxonomy."*), que T009 ja transcreveu
   * em `MENSAGENS_DA_TELA_DE_ROTULOS`: na tela a recusa acontece la, no portao de
   * entrada, muito antes do `switch` das acoes. Repeti-lo aqui com outro texto
   * inventaria uma entrada de catalogo.
   */
  | 'contexto-nao-registrado';

/** A recusa, com o que uma tela precisa para renderiza-la. */
export interface RecusaSobreORotulo {
  readonly motivo: MotivoDaRecusaSobreORotulo;
  /** O `msgid` que o legado emite — chave do catalogo, nao texto final. */
  readonly mensagem: string;
}

/**
 * O desfecho de um portao de item: permitido, ou a recusa.
 *
 * ⚠️ **Nao devolve o termo**, e a diferenca com {@link ResultadoDaGestaoDaLista}
 * de T009 e do legado: os portoes de contexto devolvem `$tax` porque a tela o
 * usa de `:44` ao fim; os de item nao leem o termo para a tela — a leitura que o
 * `case` de capacidade faz e **de dentro da decisao**, e o que a tela faz em
 * seguida e chamar a operacao com o identificador que ja tinha.
 */
export type ResultadoSobreORotulo =
  | { readonly permitido: true }
  | { readonly permitido: false; readonly recusa: RecusaSobreORotulo };

/** Monta a recusa com o `msgid` que o motivo carrega. */
function recusar(
  motivo: MotivoDaRecusaSobreORotulo,
  mensagem: string,
): ResultadoSobreORotulo {
  return { permitido: false, recusa: { motivo, mensagem } };
}

/**
 * Pergunta uma capacidade **sobre o termo**, com o `case` deste modulo ligado.
 *
 * O caso e acrescentado aos que o chamador trouxe e nao os substitui — a mesma
 * composicao, com a mesma razao, que T005 e T009 fizeram: o caso e **deste
 * modulo**, nao do chamador. Ver {@link casosDaCapacidadeSobreRotulo} para a
 * ordem e para a recursao.
 */
function podeSobreORotulo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaProtecaoDoTermoPadrao,
  capacidade: string,
  rotuloId: number,
): boolean {
  const autorizacao = comAtor(
    {
      ...colaboracao.base,
      casosDeTraducao: casosDaCapacidadeSobreRotulo(
        escopo,
        colaboracao.opcoes,
        colaboracao.base.casosDeTraducao ?? [],
      ),
    },
    colaboracao.ator,
  );

  // O identificador do termo e o `...$args` da pergunta — `$args[0]` do `case`.
  return perguntarPermissao(autorizacao, capacidade, rotuloId);
}

/**
 * O portao de **apagar um termo** pela tela — a checagem de
 * `wp-admin/edit-tags.php:114`, com o `msgid` de `:117`.
 *
 * **Permissao exigida: `delete_term` sobre aquele termo, e ela E verificada
 * aqui.** E a capacidade no **singular**, logo ela passa pelo `case` de
 * `map_meta_cap()` que carrega *"o termo padrao da taxonomia e indestrutivel"* —
 * e e dai que vem **CA-5.1** e **CA-5.2** nesta superficie: nem o administrador
 * nem o super administrador da rede passam por este portao quando o termo e o
 * padrao do contexto dele.
 *
 * ⚠️ **Le o termo, e por isso toca o banco** — e a diferenca com os tres portoes
 * de T009, que *"nao tocam o banco"*. A leitura e a de `get_term( $term_id )`
 * (sem contexto pedido), que o proprio `case` do legado emite, e ela sai **antes**
 * de qualquer decisao: capacidade sobre objeto nao se decide sem o objeto.
 *
 * ⚠️ **O contexto nao e argumento**, e isso e do legado: o `case` resolve a
 * taxonomia **a partir do termo**, nao da tela. Um termo de `post_tag` pedido pela
 * tela de `category` e decidido pelas capacidades de `post_tag`.
 */
export function permissaoDeApagarRotulo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaProtecaoDoTermoPadrao,
  rotuloId: number,
): ResultadoSobreORotulo {
  if (
    !podeSobreORotulo(
      escopo,
      colaboracao,
      CAPACIDADE_DE_APAGAR_O_ROTULO,
      rotuloId,
    )
  ) {
    return recusar(
      'sem-capacidade-de-apagar-o-item',
      MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOItem,
    );
  }

  return { permitido: true };
}

/**
 * O portao de **editar um termo** pela tela — o `msgid` de
 * `wp-admin/edit-tags.php:173`.
 *
 * **Permissao exigida: `edit_term` sobre aquele termo, e ela E verificada
 * aqui.** Passa pelo **mesmo** `case` do portao de apagar, e e por isso que ele e
 * desta tarefa — mas **nao** carrega a protecao do termo padrao: o ramo de
 * `:738`-`:744` e so de `delete_term`. Editar e renomear o termo padrao e
 * permitido, e a pos-condicao de UC-08 e que ele *"continua existindo"*, nao que
 * ele e imutavel.
 *
 * ⚠️ Um termo que **nao existe** e recusado por aqui, com esta mensagem: no
 * legado a checagem de capacidade vem antes da leitura do termo neste `case`, e o
 * `case` de capacidade devolve `do_not_allow` para objeto inexistente (`PERM-5`).
 * A outra mensagem — *"You attempted to edit an item that does not exist"*
 * (`:160`) — e do `case` de **navegacao**, e nao deste portao.
 */
export function permissaoDeEditarRotulo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaProtecaoDoTermoPadrao,
  rotuloId: number,
): ResultadoSobreORotulo {
  if (
    !podeSobreORotulo(
      escopo,
      colaboracao,
      CAPACIDADE_DE_EDITAR_O_ROTULO,
      rotuloId,
    )
  ) {
    return recusar(
      'sem-capacidade-de-editar-o-item',
      MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeEditarOItem,
    );
  }

  return { permitido: true };
}

/**
 * O portao da **acao em lote** — o `msgid` de `wp-admin/edit-tags.php:137`.
 *
 * **Permissao exigida: `$tax->cap->delete_terms`, o `capacidades.apagarRotulos`
 * do contexto, e ela E verificada aqui.** E a capacidade no **plural**, sobre o
 * contexto e **sem termo em maos** — ver a correcao de leitura no cabecalho deste
 * arquivo. Para `category` e `delete_categories` e para `post_tag` e
 * `delete_post_tags`: as duas resolvem para `manage_categories` pelo caso de
 * T009, e sem ele ninguem apagaria etiqueta em lote, nem o administrador.
 *
 * **Nao toca o banco, e nao le a opcao do termo padrao**: a recusa de UC-08 e
 * *"antes de tocar qualquer registro"*, e e literalmente o que este portao
 * cumpre. Por isso ele pede a colaboracao **estreita** de T009, sem `opcoes` — a
 * ausencia e verificavel pelo compilador.
 *
 * ⚠️ **Passar este portao nao apaga o termo padrao.** Quem o protege no caminho
 * do lote e o `return 0` de dentro de `apagarRotuloDoContexto()`, item por item:
 * no legado o lote e um `foreach` de `wp_delete_term()`, e os outros termos do
 * lote **sao** apagados.
 */
export function permissaoDeApagarRotulosEmLote(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaGestaoDaLista,
  contexto: string,
): ResultadoSobreORotulo {
  // `$tax = get_taxonomy( $taxonomy ); if ( ! $tax )` (`:13`), que na tela vem
  // muito antes, no portao de entrada de T009. Aqui ele existe porque e de onde
  // sai `$tax->cap->delete_terms`, e nao ha capacidade a perguntar sem ele.
  const registrado = escopo.contextos.obter(contexto);
  if (registrado === null) {
    return recusar(
      'contexto-nao-registrado',
      MENSAGENS_DA_TELA_DE_ROTULOS.contextoNaoRegistrado,
    );
  }

  if (!podeNoContexto(colaboracao, registrado.capacidades.apagarRotulos)) {
    return recusar(
      'sem-capacidade-de-apagar-os-itens',
      MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOsItens,
    );
  }

  return { permitido: true };
}
