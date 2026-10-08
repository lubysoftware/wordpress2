/**
 * As **tres** perguntas de capacidade da submissao para revisao: poder editar
 * aquele conteudo (**CA-7.1**), poder publicar aquele tipo (**CA-7.4** e
 * **CA-7.5**) e poder **ler** o pendente alheio (**CA-7.6**).
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao` (US-7). E a
 * declaracao de permissao que o **P4** cobra de *"toda operacao exposta"*, e
 * aqui ela e a do contrato de `plan.md`: a operacao *"submeter para revisao"*
 * tem como erro *"sem permissao de editar"*.
 *
 * ---
 *
 * # A autorizacao de UC-06 e uma frase, e ela nao e sobre o que FALTA
 *
 * > **Autorizacao:** `edit_posts` basta. O que falta ao colaborador e
 * > `publish_posts`, e e essa falta que define o caso.
 * > — [UC-06](../../../../.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md)
 *
 * As duas metades viram duas funcoes, e nao uma:
 *
 * | pergunta | funcao | o que ela decide |
 * |---|---|---|
 * | pode **editar** este conteudo? | {@link autorizarSubmissao} | se a submissao acontece. E **meta-capacidade** (`edit_post`), logo resolve por autoria e por estado |
 * | pode **publicar** este tipo? | {@link podePublicarEsteTipo} | o **estado** gravado (passo 4 de `estado-na-submissao.ts`) e o **identificador** reservado (`../gravacao/permissao-do-identificador.ts`) |
 *
 * ⚠️ **A segunda nao recusa nada.** Quem nao pode publicar **submete** — e isso
 * que UC-06 chama de *"o normal do colaborador"*. Transformar a falta de
 * `publish_posts` em recusa fecharia a historia inteira.
 *
 * ---
 *
 * # Por que `edit_posts` nao aparece aqui, e onde ele aparece
 *
 * UC-06 diz *"`edit_posts` basta"*, e a capacidade que o codigo pergunta na
 * **atualizacao** e `edit_post` **no singular, com o objeto**
 * (`wp-admin/includes/post.php:294` no painel,
 * `class-wp-rest-posts-controller.php:901` na API). O plural e a primitiva que
 * sai da traducao: `map_meta_cap()` resolve `edit_post` para `edit_posts` +
 * (`edit_others_posts` se nao e seu) + (`edit_published_posts` se ja esta
 * publicado) — `wp-includes/capabilities.php:108`-`:195`. Perguntar o plural
 * direto responderia *"sim"* a quem nao pode mexer no conteudo **daquele** autor
 * nem **naquele** estado, que e justamente o que CA-7.6 cobra do outro lado.
 *
 * O plural aparece em **um** lugar desta pasta, e e a tela da fila:
 * `edit.php:44` pergunta `$post_type_object->cap->edit_posts` **sem objeto**,
 * porque ali nao ha objeto nenhum — e uma listagem. Ver `fila-de-revisao.ts`.
 *
 * ---
 *
 * # O caso de traducao chega junto da pergunta, e a razao e a de T007
 *
 * No legado `map_meta_cap()` tem os 86 `case` **embutidos**: ninguem os
 * registra, e perguntar `edit_post` sempre resolve. Nesta arvore a lista chega
 * por `BaseDeAutorizacao.casosDeTraducao`, e uma composicao que a esquecesse
 * faria a traducao devolver a cadeia `edit_post` crua — que papel algum concede,
 * logo **negaria toda submissao, inclusive a de um administrador**. Por isso as
 * tres funcoes deste arquivo acrescentam {@link casoDeConteudo} a lista que
 * receberam, **no fim**, onde ele nao desloca nenhum caso que a base ja traga.
 * E a mesma costura, com a mesma justificativa, de
 * `podeReservarIdentificador()` em `../gravacao/permissao-do-identificador.ts`.
 */

import {
  casoDeConteudo,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import {
  capacidadeDePublicar,
  codigoDeAutorizacaoExigida,
  ESTADO_PUBLICADO,
} from '../publicacao/index.js';
import type { ContextoDeRevisao } from './contexto-de-revisao.js';

/**
 * `edit_post` — a **meta-capacidade** que a atualizacao pergunta, com o
 * identificador do conteudo.
 *
 * Nome publicado (P8): extensao de terceiro pergunta por ele e interceptador de
 * `map_meta_cap` compara a cadeia. E a mesma constante que
 * `plataforma/autorizacao/traducao-de-conteudo.ts` conhece como `edit_post`, e
 * ela e declarada aqui pelo mesmo motivo de `CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO`
 * em `../gravacao/permissao-do-identificador.ts`: o nome entra na pergunta que
 * **esta** operacao faz, e tem de ser legivel no arquivo que a faz.
 */
export const CAPACIDADE_DE_EDITAR_ESTE_CONTEUDO: Capacidade = 'edit_post';

/**
 * `read_post` — a meta-capacidade de **ler** aquele conteudo
 * (`wp-includes/capabilities.php:308`).
 *
 * E a pergunta de **CA-7.6**, e o ramo dela que importa a esta historia e
 * `capabilities.php:369`-`:380`: estado nao publico e nao privado faz a leitura
 * cair **inteira** na resolucao de edicao — `$caps = map_meta_cap( 'edit_post',
 * ... )`. *"Quem pode editar um rascunho pode ve-lo, e ninguem mais."*
 */
export const CAPACIDADE_DE_LER_ESTE_CONTEUDO: Capacidade = 'read_post';

/**
 * `page` — o unico nome de tipo que o painel compara literalmente neste caminho
 * (`wp-admin/includes/post.php:295` e `:933`).
 *
 * ⚠️ **E comparacao por nome, e e do legado.** Toda a decisao de capacidade
 * passa pelo registro do tipo (P3), e ainda assim a **mensagem** de recusa do
 * painel e escolhida por `'page' === $post_data['post_type']`. Reproduzir isso e
 * reproduzir o texto que o usuario le; resolve-lo pelo registro produziria uma
 * terceira mensagem que o legado nao tem.
 */
export const TIPO_DE_PAGINA = 'page';

/** O codigo HTTP que a recusa declara, como em `../publicacao/`. */
export type CodigoDeRecusaDaRevisao = 401 | 403 | 404 | null;

/**
 * Uma recusa da revisao, devolvida **como valor**.
 *
 * Mesma forma de `RecusaDaPublicacao`, e pela mesma razao registrada em
 * `plan.md`: *"Erro e devolvido como valor, nao como excecao: e assim no legado
 * e e o que permite a um ponto de extensao inspecionar a falha"*.
 */
export interface RecusaDaRevisao {
  /** O codigo de erro do legado. */
  readonly codigo: string;
  /** O texto do legado, em ingles — ver a nota de catalogo abaixo. */
  readonly mensagem: string;
  readonly codigoHttp: CodigoDeRecusaDaRevisao;
}

/*
  ── OS TEXTOS SAO OS DO LEGADO, EM INGLES, E FECHAM CONTRA O ORACULO ────────

  Mesma postura de `../publicacao/permissao-de-publicacao.ts`: `EC-05` fixa que
  *"o `msgid` em ingles E a chave do catalogo"*, logo traduzir aqui trocaria a
  chave. Cada texto foi lido na linha citada.

  E aqui ha um detalhe que a publicacao nao tinha: **as duas superficies dizem a
  MESMA frase para conteudo** — `wp_die( 'Sorry, you are not allowed to edit
  this post.' )` no painel (`wp-admin/includes/post.php:298`) e o erro
  `rest_cannot_edit` com o mesmo texto na API
  (`class-wp-rest-posts-controller.php:904`). O que difere e a forma: o painel
  **mata a requisicao** sem codigo HTTP declarado, a API devolve o par
  codigo/estado. Por isso a recusa de pagina tem `codigoHttp` nulo: ela so
  existe no painel, e o painel nao declara numero nenhum ali.
*/

/** `Sorry, you are not allowed to edit this post.` — as duas superficies (`:298`, `:904`). */
export const MENSAGEM_DE_RECUSA_DE_EDICAO =
  'Sorry, you are not allowed to edit this post.';

/**
 * `Sorry, you are not allowed to edit this page.` — **so** o painel (`:296`).
 *
 * A API nao tem este texto: o controlador de `page` e o mesmo de `post` e a
 * mensagem dele e uma so. E por isso que esta constante existe separada e sai
 * com `codigoHttp` nulo.
 */
export const MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA =
  'Sorry, you are not allowed to edit this page.';

/** `rest_cannot_edit` — o codigo da API para a recusa de editar (`:903`). */
export const CODIGO_DE_RECUSA_DE_EDICAO = 'rest_cannot_edit';

/**
 * Os dois codigos de erro do painel para **autoria alheia**
 * (`wp-admin/includes/post.php:91`-`:103`).
 *
 * ⚠️ **No painel o codigo de erro E o nome da capacidade**, e os dois nomes sao
 * os de `edit_others_*`: o legado os usa como codigo de `WP_Error`, nao como
 * pergunta. A API tem um codigo proprio para o mesmo caso,
 * `rest_cannot_edit_others` (`class-wp-rest-posts-controller.php:911`), com
 * outro texto.
 */
export const CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA = 'edit_others_posts';
export const CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA = 'edit_others_pages';

/** `Sorry, you are not allowed to edit posts as this user.` (`:94`). */
export const MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA =
  'Sorry, you are not allowed to edit posts as this user.';

/** `Sorry, you are not allowed to edit pages as this user.` (`:92`). */
export const MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA =
  'Sorry, you are not allowed to edit pages as this user.';

/** `edit_others_posts` — o slot que a autoria alheia pergunta (`:70`). */
export const CAPACIDADE_DE_EDITAR_ALHEIO = 'edit_others_posts';

/** `rest_post_invalid_id` e `Invalid post ID.`, com 404 (`:555`-`:557`). */
export const CODIGO_DE_CONTEUDO_INEXISTENTE = 'rest_post_invalid_id';
export const MENSAGEM_DE_CONTEUDO_INEXISTENTE = 'Invalid post ID.';

/** `rest_forbidden` e o texto generico do servidor REST (`class-wp-rest-server.php:1266`). */
export const CODIGO_DE_RECUSA_DE_LEITURA = 'rest_forbidden';
export const MENSAGEM_DE_RECUSA_DE_LEITURA =
  'Sorry, you are not allowed to do that.';

/**
 * A base da pergunta, com o caso de traducao de conteudo acrescentado no fim.
 *
 * Ver *"O caso de traducao chega junto da pergunta"*, no cabecalho.
 */
function baseComCasoDeConteudo(contexto: ContextoDeRevisao): BaseDeAutorizacao {
  const caso =
    contexto.avisarUsoIndevido === undefined
      ? casoDeConteudo(contexto.fonteDeConteudo)
      : casoDeConteudo(contexto.fonteDeConteudo, contexto.avisarUsoIndevido);

  return {
    ...contexto.base,
    casosDeTraducao: [...(contexto.base.casosDeTraducao ?? []), caso],
  };
}

/**
 * `current_user_can( 'edit_post', $post_id )` — a meta-capacidade, com o objeto
 * (`wp-admin/includes/post.php:294`).
 *
 * Exportada porque **duas** decisoes diferentes a perguntam, e as duas sao do
 * legado: o portao desta operacao (`:294`) e a segunda condicao do rebaixamento
 * de estado (`:156`, *"or to resave published posts"*). No legado sao duas
 * chamadas a mesma funcao, e aqui sao duas chamadas a esta.
 */
export function podeEditarEsteConteudo(
  contexto: ContextoDeRevisao,
  conteudoId: number,
): boolean {
  return perguntarPermissao(
    comAtor(baseComCasoDeConteudo(contexto), contexto.ator),
    CAPACIDADE_DE_EDITAR_ESTE_CONTEUDO,
    conteudoId,
  );
}

/**
 * `current_user_can( $ptype->cap->publish_posts )` — a **primitiva**, sem
 * objeto (`wp-admin/includes/post.php:142` e `:154`).
 *
 * E a mesma pergunta de CA-1.1, feita pelo mesmo caminho — o slot do registro
 * do tipo, resolvido por `capacidadeDePublicar()` de T003. Tipo nao registrado,
 * ou tipo cujo mapa nao declara o slot, devolve `false`: **a porta fecha**, que
 * e a postura que `plataforma/autorizacao/` registra para BR-MIGRAR-091 e o que
 * `../publicacao/permissao-de-publicacao.ts` ja faz com os mesmos dois ramos.
 *
 * ⚠️ **No caminho de atualizacao o legado pergunta a primitiva aqui e a
 * meta-capacidade `publish_post` no esvaziamento do identificador** (`:4736`,
 * T007). Sao duas perguntas diferentes sobre a mesma ideia, nas duas pontas do
 * mesmo salvamento, e as duas estao reproduzidas onde o legado as faz. Unificar
 * as duas mudaria a resposta para tipo nao registrado — ver a tabela de *"Duas
 * perguntas diferentes"* em `../gravacao/permissao-do-identificador.ts`.
 */
export function podePublicarEsteTipo(
  contexto: ContextoDeRevisao,
  tipoDoConteudo: string,
): boolean {
  const capacidade = capacidadeDePublicar(contexto.tipoDeConteudo(tipoDoConteudo));
  if (capacidade === null) {
    return false;
  }
  return perguntarPermissao(
    comAtor(contexto.base, contexto.ator),
    capacidade,
  );
}

/**
 * **CA-7.1**, primeira metade: a submissao exige poder **editar** aquele
 * conteudo.
 *
 * Devolve `null` quando autorizada — mesma forma das guardas de T003 e de
 * `administracao-de-contas/`.
 *
 * A mensagem e escolhida pelo **nome** do tipo, como o painel a escolhe
 * (`:295`-`:299`), e o codigo e o da API, que e a unica superficie que declara
 * um: ver a nota de catalogo acima.
 */
export function autorizarSubmissao(
  contexto: ContextoDeRevisao,
  conteudo: Conteudo,
): RecusaDaRevisao | null {
  if (podeEditarEsteConteudo(contexto, conteudo.id)) {
    return null;
  }
  return recusaDeEdicao(contexto.ator, conteudo.tipo);
}

/**
 * **CA-7.1**, segunda metade: submeter conteudo de **outra pessoa** exige a
 * capacidade de mexer em conteudo alheio (`wp-admin/includes/post.php:88`-`:105`).
 *
 * E o que faz esta historia ser sobre *"conteudo **proprio**"*: a condicao do
 * legado e `$post_data['post_author'] !== $post_data['user_ID'] && !
 * current_user_can( $ptype->cap->edit_others_posts )`, e o `user_ID` ali e
 * sempre `get_current_user_id()` (`:77`).
 *
 * ⚠️ **A pergunta e sobre o autor que o PEDIDO carrega, nao sobre o da linha.**
 * No painel o formulario envia `post_author`, e e ele que `wp_update_post()`
 * sobrepoe a linha depois. A resolucao desse valor esta em
 * `submeter-para-revisao.ts`, com o aviso de qual quirk ela reproduz.
 *
 * ⚠️ **O slot e perguntado sem objeto, e por isso nao e `edit_post`.** O legado
 * le `$ptype->cap->edit_others_posts` do registro do tipo e pergunta a
 * primitiva: um autor que submete o proprio texto nao passa por aqui, e um
 * editor passa.
 */
export function autorizarAutoriaDaSubmissao(
  contexto: ContextoDeRevisao,
  tipoDoConteudo: string,
  autorDoPedido: number,
): RecusaDaRevisao | null {
  if (autorDoPedido === contexto.ator.contaId) {
    return null;
  }

  const tipo = contexto.tipoDeConteudo(tipoDoConteudo);
  const capacidade = tipo?.capacidades[CAPACIDADE_DE_EDITAR_ALHEIO] ?? null;
  const permitido =
    capacidade !== null &&
    perguntarPermissao(comAtor(contexto.base, contexto.ator), capacidade);

  if (permitido) {
    return null;
  }

  const ehPagina = tipoDoConteudo === TIPO_DE_PAGINA;
  return {
    codigo: ehPagina
      ? CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA
      : CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
    mensagem: ehPagina
      ? MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA
      : MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
    // O painel devolve `WP_Error` sem estado HTTP, e `write_post()` o
    // transforma em `wp_die()` (`:1004`). A API, para o mesmo caso, usa
    // `rest_cannot_edit_others` com o codigo de autorizacao exigida.
    codigoHttp: null,
  };
}

/**
 * **CA-7.6**: ler o conteudo pendente de outra pessoa exige poder **edita-lo** —
 * `check_read_permission()` (`class-wp-rest-posts-controller.php:1784`) sobre o
 * `case 'read_post'` de `map_meta_cap()` (`wp-includes/capabilities.php:308`).
 *
 * Os tres ramos do legado que esta historia alcanca, na ordem:
 *
 * | # | condicao | resultado | linha |
 * |---|---|---|---|
 * | 1 | `'publish' === $post->post_status` | **le**, sem perguntar nada | `:1791` |
 * | 2 | `current_user_can( 'read_post', $post->ID )` | a meta-capacidade decide | `:1791` |
 * | 3 | o estado registrado e `public` | **le** | `:1795`-`:1798` |
 *
 * O ramo 1 e curto-circuito e vem **antes** da capacidade: conteudo publicado e
 * legivel por qualquer um, inclusive anonimo, sem passar pela traducao. O ramo 3
 * repete a mesma ideia para estado de extensao que se declare publico — e o
 * `case 'read_post'` ja o consulta por dentro (`capabilities.php:369`), o que
 * faz os dois concordarem.
 *
 * Para o estado desta historia a resposta vem do ramo 2, e ela e a frase de
 * UC-06: *"`read_post` de status nao publico cai em `edit_post`, logo ler o
 * rascunho de outro exige poder edita-lo — o que o colaborador nao tem"*.
 *
 * ## O que esta funcao NAO tem, e de quem e
 *
 * - **`check_is_post_type_allowed()`** (`:1786`), que exige `show_in_rest` do
 *   tipo: e a superficie REST, BC-09;
 * - **os dois ramos de `inherit`** (`:1801`-`:1814`), que resolvem a leitura do
 *   anexo pelo conteudo pai: BC-04, feature 006. A ausencia deles aqui e a mesma
 *   fronteira que `plataforma/autorizacao/conteudo-na-autorizacao.ts` declara no
 *   campo `estadoParaLeitura`;
 * - **a senha de conteudo** (`:594`-`:603`), que e UC-02 e nao e capacidade:
 *   nenhum dos cinco atestados do **P4** e decidido aqui.
 */
export function autorizarLeituraEmRevisao(
  contexto: ContextoDeRevisao,
  conteudo: Conteudo,
): RecusaDaRevisao | null {
  // Ramo 1 (`:1791`): o curto-circuito do publicado, antes de qualquer
  // pergunta de capacidade.
  if (conteudo.estado === ESTADO_PUBLICADO) {
    return null;
  }

  // Ramo 2 (`:1791`): a meta-capacidade, com o objeto.
  const podeLer = perguntarPermissao(
    comAtor(baseComCasoDeConteudo(contexto), contexto.ator),
    CAPACIDADE_DE_LER_ESTE_CONTEUDO,
    conteudo.id,
  );
  if (podeLer) {
    return null;
  }

  // Ramo 3 (`:1795`-`:1798`): estado registrado como publico le mesmo sem a
  // capacidade. Estado nao registrado devolve `null` na fonte e cai na recusa,
  // como o `$post_status_obj &&` do legado.
  if (contexto.fonteDeConteudo.estadoDeConteudo(conteudo.estado)?.publico === true) {
    return null;
  }

  return {
    codigo: CODIGO_DE_RECUSA_DE_LEITURA,
    mensagem: MENSAGEM_DE_RECUSA_DE_LEITURA,
    codigoHttp: codigoDeAutorizacaoExigida(contexto.ator),
  };
}

/** A recusa de editar, com o texto que a superficie do legado escolhe pelo tipo. */
function recusaDeEdicao(
  ator: AtorDeAutorizacao,
  tipoDoConteudo: string,
): RecusaDaRevisao {
  if (tipoDoConteudo === TIPO_DE_PAGINA) {
    return {
      codigo: CODIGO_DE_RECUSA_DE_EDICAO,
      mensagem: MENSAGEM_DE_RECUSA_DE_EDICAO_DE_PAGINA,
      codigoHttp: null,
    };
  }
  return {
    codigo: CODIGO_DE_RECUSA_DE_EDICAO,
    mensagem: MENSAGEM_DE_RECUSA_DE_EDICAO,
    codigoHttp: codigoDeAutorizacaoExigida(ator),
  };
}
