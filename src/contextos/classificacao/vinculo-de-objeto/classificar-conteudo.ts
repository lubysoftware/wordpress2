/**
 * **CA-2.4** (*"So contextos declarados para aquele tipo de conteudo aceitam
 * vinculo"*) e o portao de **CA-2.2** — a operacao *"classificar conteudo"* da
 * tabela **Contratos** do `plan.md`, do jeito que um chamador a usa.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). E o
 * bloco de classificacao de `wp_insert_post()`
 * (`wp-includes/post.php:5053`-`:5109`), que e **onde os portoes do legado estao**
 * — e nao dentro de `wp_set_object_terms()`, que nao verifica nada (ver
 * `substituir-vinculos.ts`).
 *
 * | o que | no legado | criterio |
 * |---|---|---|
 * | o contexto se aplica ao tipo do objeto? | `is_object_in_taxonomy( $post_type, 'category' )`, `post.php:5054` e `:5058` | **CA-2.4** |
 * | o contexto esta registrado? | `get_taxonomy( $taxonomy )` mais `_doing_it_wrong` e `continue`, `:5094`-`:5097` | — |
 * | o ator pode atribuir rotulo naquele contexto? | `current_user_can( $taxonomy_obj->cap->assign_terms )`, `:5105` | passo 2 de UC-05 |
 * | a lista informada e normalizada por contexto | `wp_set_post_terms()`, `:5190` | **CA-2.2** |
 *
 * ---
 *
 * # AS TRES RECUSAS SAO SILENCIOSAS, e isso e regra e nao descuido
 *
 * Nenhum dos tres portoes do legado produz mensagem, excecao ou registro: dois
 * sao `if` que simplesmente nao chamam a atribuicao (`:5054` e `:5105`) e o
 * terceiro e um `_doing_it_wrong` — aviso de uso indevido para quem programa, nao
 * erro para quem usa — seguido de `continue` (`:5094`-`:5098`). O **P7** poe esse
 * silencio no contrato: *"preserve o modo de falha, inclusive o silencio"*, e
 * `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts` ja havia registrado a
 * mesma doutrina para a recusa de CA-1.4.
 *
 * Por isso esta operacao **nao devolve erro** nesses tres casos: devolve um
 * resultado que diz que nao classificou e por que. O motivo viaja para que CA-2.2
 * e CA-2.4 sejam afirmaveis por teste, e **nenhum ramo do fluxo o consulta**: o
 * chamador do legado nao recebe nada e segue adiante. O unico erro que esta
 * operacao propaga e o `invalid_taxonomy` de `wp_set_object_terms()`, que no
 * legado tambem e um `WP_Error` de verdade.
 *
 * ⚠️ **A ordem dos portoes e a do legado, e ela importa:** o tipo de objeto e
 * verificado **antes** da capacidade. Invertendo, um ator sem `assign_terms`
 * receberia o motivo da capacidade para um contexto que nem se aplica ao tipo
 * dele — e, pior, quem portasse a cobranca de capacidade para dentro de
 * `wp_set_object_terms()` cobraria capacidade em chamada que o nucleo faz sem
 * ator.
 *
 * # 🔴 O LIMITE DE CA-2.4, e por que ele nao e um portao a mais
 *
 * `is_object_in_taxonomy()` protege, no legado, **apenas** os dois caminhos
 * antigos de `wp_insert_post()`: `post_category` (`:5054`) e `tags_input`
 * (`:5058`). O caminho novo, o mapa `tax_input` (`:5090`-`:5109`), **nao** o
 * verifica: ele itera o que o chamador mandou, recusa so o contexto nao
 * registrado e cobra `assign_terms`. Logo, no legado, um `tax_input` com um
 * contexto registrado que **nao** se aplica ao tipo do conteudo e aceito, e a
 * linha e gravada.
 *
 * Quem o impede, na pratica, e a tela: `tax_input` e montado a partir de
 * `get_object_taxonomies( $post )` (`wp-admin/includes/post.php:582`-`:596` e
 * `wp-admin/includes/meta-boxes.php`), a API REST itera
 * `get_object_taxonomies( $this->post_type, 'objects' )`
 * (`class-wp-rest-posts-controller.php:1703`) e o XML-RPC recusa com erro 401
 * explicito — *"Sorry, one of the given taxonomies is not supported by the post
 * type"* (`class-wp-xmlrpc-server.php:1617`).
 *
 * **Esta operacao poe o portao, e a razao e o pacote de especificacao, nao o
 * gosto:** `plan.md` lista *"contexto nao declarado para aquele tipo de conteudo"*
 * na coluna de **erros** da operacao *"classificar conteudo"*, a pre-condicao de
 * UC-05 e *"a taxonomia esta registrada **e declarada para aquele tipo de
 * conteudo**"*, e CA-2.4 e um criterio de aceite. As tres superficies do legado
 * concordam com ele; o unico caminho que o contradiz e `wp_set_object_terms()`
 * chamada direto — e essa continua **sem** o portao, em `substituir-vinculos.ts`,
 * exatamente como no legado. Quem precisa do comportamento sem portao tem a
 * operacao de baixo; quem classifica conteudo passa por aqui.
 *
 * # ⚠️ O QUE ESTA OPERACAO NAO FAZ, e de quem e
 *
 * | o que | de quem e |
 * |---|---|
 * | aplicar o termo padrao quando a lista vem vazia (`post.php:5062`-`:5087` e `:5419`) | **T007** (US-3). O laco do legado roda **antes** desta chamada e e o que decide se a lista chega vazia ou com o padrao dentro |
 * | criar o rotulo informado por nome (`wp_insert_term()`) | **T009** (US-4), e a consequencia esta declarada em `rotulos-informados.ts` |
 * | o `array_filter` que o legado faz em `tax_input` antes do laco (`:5070` e `:5102`) | esta aqui, no normalizador: ver `rotulos-informados.ts`, {@link normalizarRotulosDoConteudo} |
 * | gravar o conteudo | BC-01. Esta operacao recebe o identificador de um objeto que **ja existe** |
 */

import {
  comAtor,
  perguntarPermissao,
} from '../../../plataforma/autorizacao/index.js';
import {
  contextoAceitaTipoDeObjeto,
  ehErroDeTermo,
  type ErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import { casoDeAtribuicaoDeRotulo } from './caso-de-atribuicao-de-rotulo.js';
import type {
  ColaboracaoDaClassificacao,
  EscopoDeVinculoDeObjeto,
} from './escopo-de-vinculo-de-objeto.js';
import {
  normalizarRotulosDoConteudo,
  type RotuloInformado,
} from './rotulos-informados.js';
import {
  substituirVinculosDoObjeto,
  type PedidoDeVinculo,
} from './substituir-vinculos.js';

/** O que se pede para classificar um conteudo num contexto. */
export interface PedidoDeClassificacao {
  /** O objeto que recebe a classificacao. Ele **ja existe**: esta operacao nao grava conteudo. */
  readonly objetoId: number;
  /**
   * O tipo do objeto — `$post_type` no legado.
   *
   * ⚠️ **"Objeto", nao "conteudo"**, pela mesma razao de sempre:
   * `link_category` se aplica a `link`. Ver
   * `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`.
   */
  readonly tipoDeObjeto: string;
  readonly contexto: string;
  /** A lista informada, nas formas que `wp_set_post_terms()` aceita. */
  readonly rotulos: readonly RotuloInformado[] | RotuloInformado;
  /** `$append`. Default `false`, que e o de `wp_set_post_terms()`. */
  readonly acrescentar?: boolean;
}

/**
 * Por que a classificacao nao aconteceu, nos casos em que o legado **nao emite
 * comando e nao diz nada**.
 *
 * Nao sao codigos de `WP_Error`: nao existe `WP_Error` nenhum nestes caminhos do
 * legado. Sao os tres `if` dele, nomeados.
 */
export type MotivoDeRecusaSilenciosa =
  /** `is_object_in_taxonomy()` devolveu falso (`post.php:5054`) — **CA-2.4**. */
  | 'tipo-de-objeto-nao-declarado'
  /** `get_taxonomy()` devolveu `false`: `_doing_it_wrong` e `continue` (`:5094`). */
  | 'contexto-nao-registrado'
  /** `current_user_can( $tax->cap->assign_terms )` devolveu falso (`:5105`). */
  | 'sem-capacidade-de-atribuir';

/** O desfecho de classificar: o que foi vinculado, a recusa silenciosa, ou o erro. */
export type ResultadoDaClassificacao =
  | {
      readonly classificado: true;
      /** Os `term_taxonomy_id` afetados, como `wp_set_object_terms()` os devolve. */
      readonly rotulosNoContextoIds: readonly number[];
    }
  | {
      readonly classificado: false;
      readonly motivo: MotivoDeRecusaSilenciosa;
    }
  | ErroDeTermo;

/**
 * Classifica um conteudo num contexto declarado para o tipo dele.
 *
 * **Permissao exigida: a que o contexto declara em `capacidades.atribuirRotulos`
 * (`$tax->cap->assign_terms`), e ela E verificada aqui** — ao contrario de
 * `renomearRotulo` (T003) e de {@link substituirVinculosDoObjeto}, que declaram
 * sem verificar porque as funcoes do legado tambem nao verificam. Aqui a
 * verificacao existe porque e aqui que o legado a tem: `if ( current_user_can(
 * $taxonomy_obj->cap->assign_terms ) )` (`wp-includes/post.php:5105`).
 *
 * Para `category` e `post_tag` essa capacidade e `assign_categories` e
 * `assign_post_tags`, que resolvem para **`edit_posts`**: quem pode escrever pode
 * classificar (UC-05). A traducao entra por
 * {@link casoDeAtribuicaoDeRotulo}, que esta operacao acrescenta aos casos
 * declarados pelo chamador — e nao substitui: o caso e disjunto dos demais, e a
 * razao de ele ser deste modulo e nao do chamador esta no cabecalho daquele
 * arquivo.
 */
export function classificarConteudo(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDaClassificacao,
  pedido: PedidoDeClassificacao,
): ResultadoDaClassificacao {
  // 1. **CA-2.4**, e vem primeiro: `is_object_in_taxonomy( $post_type, $tax )`
  //    (`post.php:5054`). A recusa e silenciosa.
  if (
    !contextoAceitaTipoDeObjeto(escopo, pedido.tipoDeObjeto, pedido.contexto)
  ) {
    return { classificado: false, motivo: 'tipo-de-objeto-nao-declarado' };
  }

  // 2. `$taxonomy_obj = get_taxonomy( $taxonomy ); if ( ! $taxonomy_obj ) { ... }`
  //    (`:5092`-`:5098`). Na pratica o passo 1 ja barra o contexto nao
  //    registrado — ele nao aparece em `get_object_taxonomies()` —, e o portao
  //    continua aqui porque no legado ele e outro `if`, com outro motivo, e
  //    porque e ele que carrega o aviso de uso indevido.
  const registrado = escopo.contextos.obter(pedido.contexto);
  if (registrado === null) {
    return { classificado: false, motivo: 'contexto-nao-registrado' };
  }

  // 3. `if ( current_user_can( $taxonomy_obj->cap->assign_terms ) )` (`:5105`).
  const autorizacao = comAtor(
    {
      ...colaboracao.base,
      casosDeTraducao: [
        ...(colaboracao.base.casosDeTraducao ?? []),
        casoDeAtribuicaoDeRotulo,
      ],
    },
    colaboracao.ator,
  );

  if (
    !perguntarPermissao(autorizacao, registrado.capacidades.atribuirRotulos)
  ) {
    return { classificado: false, motivo: 'sem-capacidade-de-atribuir' };
  }

  // 4. `wp_set_post_terms( $post_id, $tags, $taxonomy )` (`:5106`): a
  //    normalizacao depende do contexto ser hierarquico, e e ela que decide
  //    **CA-2.2** — ver `rotulos-informados.ts`.
  const pedidoDeVinculo: PedidoDeVinculo = {
    objetoId: pedido.objetoId,
    contexto: pedido.contexto,
    rotulos: normalizarRotulosDoConteudo(
      registrado.hierarquico,
      pedido.rotulos,
    ),
    acrescentar: pedido.acrescentar ?? false,
  };

  const resultado = substituirVinculosDoObjeto(
    escopo,
    colaboracao,
    pedidoDeVinculo,
  );

  if (ehErroDeTermo(resultado)) {
    // `invalid_taxonomy` — o unico `WP_Error` deste caminho, e ele nao e
    // alcancavel depois do passo 2. Repassado em vez de engolido, porque
    // `wp_insert_post()` tambem nao o inventa nem o esconde: ele simplesmente
    // ignora o retorno de `wp_set_post_terms()`.
    return resultado;
  }

  return { classificado: true, rotulosNoContextoIds: resultado };
}
