/**
 * O portao da senha de conteudo — `post_password_required()`
 * (`wp-includes/post-template.php:882-915`), que e o fluxo principal de UC-02 e
 * o que decide, em toda superficie, se o corpo sai ou nao.
 *
 * Entrega de **T013** (US-6, CA-6.2, CA-6.3 e CA-6.4).
 *
 * ---
 *
 * ## 🔴 Este portao nao pergunta capacidade nenhuma, e isso e a regra
 *
 * As 33 linhas de `post_password_required()` nao tem uma unica chamada de
 * `current_user_can()`. BR-MIGRAR-098 (`PERM-12`) poe a senha de conteudo entre
 * os **cinco** atestados que decidem acesso **sem** consultar o modelo de
 * capacidades, o P4 da constituicao repete os cinco, e `parity_specs.md` avisa
 * que *"quem portar lendo `permissions.md` produz um sistema mais fechado que o
 * legado"*. UT-043-8 do catalogo afirma exatamente isto.
 *
 * Consequencia que surpreende quem porta, e que **nao** se corrige: na cara
 * publica do site, quem pode editar o conteudo **tambem** ve o formulario de
 * senha. Nao ha ramo de capacidade neste arquivo do legado — nem para o autor,
 * nem para o administrador.
 *
 * ## Onde CA-6.4 acontece, entao
 *
 * *"Quem pode editar o conteudo ve o corpo sem informar a senha"* existe no
 * legado em **um** mecanismo, e ele e um ponto de extensao deste portao: a
 * superficie REST instala `check_password_required()` como filtro de
 * `post_password_required` (`class-wp-rest-posts-controller.php:455`, `:607` e
 * `:1994`), e esse filtro responde `! current_user_can( 'edit_post', $id )`
 * (`:204`). Quem decide se o filtro e instalado e
 * `can_access_password_content()` (`:629-653`), com duas portas: contexto de
 * **edicao** mais a capacidade de editar, ou a senha informada **no proprio
 * pedido** e conferida literalmente contra a coluna.
 *
 * Os dois estao portados aqui — {@link acessoAoCorpoProtegidoNoPedido} e
 * {@link filtroDeSenhaDoPedidoRest} — e nao na superficie que os instala, por
 * duas razoes: a superficie REST nao existe nesta arvore, e o P2 poe *"o nome, os
 * argumentos, a ordem de disparo e a capacidade de alterar o resultado"* de cada
 * ponto no contrato do ponto. Sem eles, CA-6.4 nao teria como ser afirmada.
 *
 * ⚠️ **E a diferenca de superficie e observavel, nao detalhe de implementacao.**
 * No pedido REST em contexto de edicao quem pode editar recebe o corpo; na
 * pagina publica a mesma conta recebe o formulario. Um porte que "unificasse"
 * isso num ramo de capacidade dentro do portao mudaria a saida publica de toda
 * instalacao em que um editor esta autenticado — e divergir do observavel exige
 * decisao humana registrada e citada no codigo (P1). Nao ha nenhuma.
 */

import { timingSafeEqual } from 'node:crypto';

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import {
  contextoDeSenhaResolvido,
  type ContextoDaSenhaDeConteudo,
} from './contexto-de-senha-de-conteudo.js';
import { PREFIXO_DO_ATESTADO } from './hash-do-atestado.js';

/**
 * O conteudo, nos **dois** campos que o portao le.
 *
 * E o recorte minimo de proposito: `post_password_required()` le
 * `$post->post_password` e, no caminho do interceptador, `$post->ID` — e nada
 * mais. Com o recorte minimo, BC-07 (o comentario) e BC-08 (o mapa do site e o
 * feed) chamam este portao por **ligacao tardia** com a linha que tiverem em
 * maos, sem ter de montar um `ConteudoConsultado` inteiro — que a regra de
 * dependencia 3 nem deixaria eles importarem.
 *
 * Os nomes sao os de `contextos/conteudo/armazenamento/conteudo.ts`, e por isso
 * `ConteudoConsultado` satisfaz esta forma sem conversao.
 */
export interface ConteudoProtegido {
  /** `ID`. */
  readonly id: number;
  /**
   * `post_password` — **texto claro, com comparacao literal**.
   *
   * BR-MIGRAR-044 (`D6`) poe o texto claro como desenho do produto e nao
   * descuido: *"e senha de acesso a conteudo, nao de conta, e precisa poder ser
   * exibida a quem edita"*. ⚠️ `BR-HUMANA-009` esta **PENDENTE** e pergunta
   * exatamente isto — texto claro, hash, ou cifrado com chave da instalacao. Este
   * porte reproduz o observavel, que e a opcao (a), porque nenhuma decisao humana
   * autorizou divergir (P1); as opcoes (b) e (c) mudam o produto e nao sao
   * escolha de agente de codificacao.
   */
  readonly senha: string;
}

/**
 * O ponto de filtro `post_password_required`
 * (`post-template.php:887`, `:892` e `:914`).
 *
 * ⚠️ **Dispara nos tres caminhos, e e por isso que o legado repete a chamada
 * tres vezes** com o comentario *"This filter is documented in
 * wp-includes/post-template.php"* nas duas primeiras. Um porte que o aplicasse
 * so no fim deixaria o conteudo **sem** senha fora do alcance do filtro — e e
 * justamente nesse caminho que a superficie REST o usa para liberar o corpo.
 *
 * Recebe o valor corrente e o registro, e **substitui** o resultado.
 */
export type FiltroDeSenhaExigida = (
  exigida: boolean,
  conteudo: ConteudoProtegido,
) => boolean;

/** O que o portao recebe alem do conteudo. */
export interface OpcoesDoPortaoDeSenha {
  readonly contexto?: ContextoDaSenhaDeConteudo;
  /** `post_password_required`, na ordem em que os interceptadores foram dados. */
  readonly filtros?: readonly FiltroDeSenhaExigida[];
}

/** Aplica a cadeia do ponto de filtro, cada um sobre o que o anterior devolveu. */
function filtrado(
  exigida: boolean,
  conteudo: ConteudoProtegido,
  filtros: readonly FiltroDeSenhaExigida[],
): boolean {
  let valor = exigida;
  for (const filtro of filtros) {
    valor = filtro(valor, conteudo);
  }
  return valor;
}

/**
 * `post_password_required( $post )`.
 *
 * **Permissao exigida: nenhuma capacidade, e aqui a declaracao e mais do que
 * formalidade** (P4) — ver o cabecalho deste arquivo. O que decide e o atestado,
 * e so ele.
 *
 * Os quatro ramos, na ordem do legado:
 *
 * | # | condicao | resultado | legado |
 * |---|---|---|---|
 * | 1 | `empty( $post->post_password )` | **nao** exige, e passa pelo filtro | `:885-888` |
 * | 2 | cookie de atestado ausente | **exige**, e passa pelo filtro | `:890-893` |
 * | 3 | atestado que nao comeca em `$P$B` | **exige**, sem conferir | `:899-900` |
 * | 4 | o resto | exige se a conferencia falhar | `:902` |
 *
 * ⚠️ **O ramo 1 usa `empty()`, e com ele a senha `'0'` nao protege nada.** Um
 * conteudo gravado com a senha literal `'0'` serve o corpo a todo mundo, porque
 * `empty( '0' )` e verdadeiro no interpretador. E quirk do legado, esta
 * reproduzido por {@link vazioComoNoPhp}, e "arrumar" muda o que uma instalacao
 * existente entrega.
 *
 * ⚠️ **Nenhum dos quatro ramos le relogio.** A resposta 8 de `questions.md`
 * manda preservar os tres fatos do atestado — dez dias no navegador, **sem
 * verificacao de idade no servidor**, sem limite de tentativa —, e a ausencia de
 * tempo nesta assinatura e o que torna o segundo fato conferivel.
 */
export function senhaDoConteudoExigida(
  conteudo: ConteudoProtegido,
  opcoes: OpcoesDoPortaoDeSenha = {},
): boolean {
  const contexto = contextoDeSenhaResolvido(opcoes.contexto);
  const filtros = opcoes.filtros ?? [];

  // Ramo 1 (`:885-888`).
  if (vazioComoNoPhp(conteudo.senha)) {
    return filtrado(false, conteudo, filtros);
  }

  // Ramo 2 (`:890-893`) — `isset( $_COOKIE[...] )`.
  const atestado = contexto.atestado;
  if (atestado === undefined) {
    return filtrado(true, conteudo, filtros);
  }

  // Ramo 3 (`:899-900`) — `str_starts_with( $hash, '$P$B' )`. Nao e so forma: um
  // atestado em qualquer outro formato e recusado **sem** chegar a conferencia.
  let exigida = true;
  if (atestado.startsWith(PREFIXO_DO_ATESTADO)) {
    // Ramo 4 (`:902`) — e a ordem dos argumentos e a do legado: a senha gravada
    // primeiro, o valor do cookie depois.
    exigida = !contexto.hashDoAtestado.conferir(conteudo.senha, atestado);
  }

  return filtrado(exigida, conteudo, filtros);
}

/** A capacidade que o interceptador do pedido REST pergunta. */
export const CAPACIDADE_DE_EDITAR_CONTEUDO = 'edit_post';

/**
 * O valor de `context` que abre o corpo a quem pode editar
 * (`class-wp-rest-posts-controller.php:640`).
 */
export const CONTEXTO_DE_EDICAO = 'edit';

/**
 * O pedido, nos dois campos que `can_access_password_content()` le
 * (`class-wp-rest-posts-controller.php:629-653`).
 */
export interface PedidoDeConteudoProtegido {
  /** `$request['context']` — `'view'`, `'embed'` ou `'edit'`. */
  readonly contexto: string;
  /**
   * `$request['password']` — a senha informada **no proprio pedido**, sem cookie.
   *
   * E o segundo caminho de atestado do legado, e ele nao grava nada: vale para
   * aquele pedido e acaba com ele.
   */
  readonly senhaInformada?: string;
}

/** `hash_equals( $a, $b )` — comparacao de tempo constante, como em `:652`. */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  const primeiro = Buffer.from(a, 'utf8');
  const segundo = Buffer.from(b, 'utf8');
  if (primeiro.length !== segundo.length) {
    return false;
  }
  return timingSafeEqual(primeiro, segundo);
}

/**
 * `can_access_password_content( $post, $request )`
 * (`class-wp-rest-posts-controller.php:629-653`).
 *
 * Decide se a superficie REST instala o interceptador. Os quatro ramos, na ordem
 * do legado:
 *
 * | # | condicao | resultado | legado |
 * |---|---|---|---|
 * | 1 | `empty( $post->post_password )` | **falso** — *"No filter required"* | `:630-633` |
 * | 2 | contexto `edit` **e** capacidade de editar | verdadeiro | `:639-644` |
 * | 3 | pedido sem senha | falso — *"No password, no auth"* | `:647-649` |
 * | 4 | senha do pedido igual a gravada, por `hash_equals` | o resultado da comparacao | `:652` |
 *
 * ⚠️ O ramo 4 compara **texto claro com texto claro** (D6), e e a prova de que a
 * coluna nao pode virar hash sem mudar o produto: um hash tornaria esta
 * comparacao impossivel sem o algoritmo do cliente. ⚠️ E o ramo 3 usa `empty()`,
 * logo a senha `'0'` informada no pedido nunca e conferida.
 */
export function acessoAoCorpoProtegidoNoPedido(
  conteudo: ConteudoProtegido,
  pedido: PedidoDeConteudoProtegido,
  contexto: ContextoDaSenhaDeConteudo = {},
): boolean {
  const resolvido = contextoDeSenhaResolvido(contexto);

  // Ramo 1 (`:630-633`).
  if (vazioComoNoPhp(conteudo.senha)) {
    return false;
  }

  // Ramo 2 (`:639-644`) — a capacidade, e nunca o nome do papel (P3).
  if (
    pedido.contexto === CONTEXTO_DE_EDICAO &&
    resolvido.podeEditarConteudo(conteudo.id)
  ) {
    return true;
  }

  // Ramo 3 (`:647-649`).
  const informada = pedido.senhaInformada;
  if (informada === undefined || vazioComoNoPhp(informada)) {
    return false;
  }
  // Daqui para baixo a senha informada existe e nao e vazia no sentido do
  // interpretador, que e o que o ramo 3 garantiu.

  // Ramo 4 (`:652`).
  return iguaisEmTempoConstante(conteudo.senha, informada);
}

/** O que {@link filtroDeSenhaDoPedidoRest} precisa para decidir. */
export interface OpcoesDoFiltroDoPedidoRest {
  /**
   * `$this->password_check_passed` (`class-wp-rest-posts-controller.php:40` e
   * `:1992`): os identificadores cuja senha **ja** foi conferida e aprovada
   * neste pedido.
   *
   * ⚠️ Escopo de PEDIDO, nao de processo: no legado e propriedade de instancia do
   * controlador, que vive uma requisicao. Um conjunto compartilhado entre pedidos
   * liberaria o corpo de um visitante para outro.
   */
  readonly aprovados?: ReadonlySet<number>;
  readonly contexto?: ContextoDaSenhaDeConteudo;
}

/**
 * `check_password_required( $required, $post )`
 * (`class-wp-rest-posts-controller.php:188-205`), como interceptador do ponto
 * {@link FiltroDeSenhaExigida}.
 *
 * | # | condicao | resultado | legado |
 * |---|---|---|---|
 * | 1 | o portao ja nao exigia | devolve o que recebeu | `:189-191` |
 * | 2 | sem registro | devolve o que recebeu | `:195-197` |
 * | 3 | identificador ja aprovado neste pedido | **falso** — *"Password previously checked and approved"* | `:199-202` |
 * | 4 | o resto | `! current_user_can( 'edit_post', $id )` | `:204` |
 *
 * O ramo 2 nao tem contraparte aqui: {@link ConteudoProtegido} e obrigatorio
 * nesta assinatura, e o `get_post()` que podia falhar no legado acontece antes,
 * fora deste ponto.
 */
export function filtroDeSenhaDoPedidoRest(
  opcoes: OpcoesDoFiltroDoPedidoRest = {},
): FiltroDeSenhaExigida {
  const aprovados = opcoes.aprovados ?? new Set<number>();
  const resolvido = contextoDeSenhaResolvido(opcoes.contexto);

  return (exigida, conteudo) => {
    // Ramo 1 (`:189-191`).
    if (!exigida) {
      return exigida;
    }
    // Ramo 3 (`:199-202`).
    if (aprovados.has(conteudo.id)) {
      return false;
    }
    // Ramo 4 (`:204`).
    return !resolvido.podeEditarConteudo(conteudo.id);
  };
}
