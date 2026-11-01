/**
 * **CA-4.3** e **CA-4.4**: *"a diferenca entre descartar e apagar em definitivo e
 * visivel na tela antes da acao, nao depois"* e *"com a lixeira desligada, a tela
 * nao oferece acao de restaurar"*.
 *
 * Entrega de **T009** da feature `005-retencao-e-descarte` (US-4).
 *
 * ## A arvore nao monta HTML: a tela entra como dado
 *
 * `target_screens.md` poe `lista-de-conteudo` (`SCR-039`) e `editor-classico`
 * (`SCR-041`) em `raw-prose` com `compare: semantic-contract` — *"evento,
 * transicao, texto, estado"* — e `DEV-001` registra que **nenhuma das 113 telas
 * passou por adapter**. O que este arquivo entrega e o **contrato**: qual acao a
 * tela oferece, com que rotulo literal, para que acao de rota e com que nome de
 * `nonce`. Montar o `<a>` e da borda, e e ela que carrega a moldura do painel —
 * que `target_architecture.md` poe em BC-10, `telas-do-painel`, e nao aqui.
 *
 * Os rotulos ficam **em ingles, literais**, pela mesma razao de
 * `permissao-de-descarte.ts`: `EC-05` fixa que o `msgid` em ingles **e** a chave
 * do catalogo de gettext, e a secao 4 de cada tela de `target_screens.md` cobra
 * *"`diff` de string igual a zero"*.
 *
 * ---
 *
 * # CA-4.3: a diferenca aparece em TRES lugares, antes da acao
 *
 * Com a lixeira desligada, o mesmo pedido continua sendo um clique — mas o que a
 * tela oferece muda nos tres:
 *
 * | o que muda | com lixeira | sem lixeira | linha |
 * |---|---|---|---|
 * | o **rotulo** no editor | `Move to Trash` | `Delete permanently` | `wp-admin/includes/meta-boxes.php:367` e `:365` |
 * | o **rotulo** na linha da lista | `Trash` | `Delete Permanently` | `class-wp-posts-list-table.php:1628` e `:1638` |
 * | o **rotulo** da acao em massa | `Move to Trash` | `Delete permanently` | `class-wp-posts-list-table.php:448` e `:446` |
 * | a **acao da rota** e o **nonce** | `action=trash`, `trash-post_{id}` | `action=delete`, `delete-post_{id}` | `wp-includes/link-template.php:1577` e `:1590` |
 *
 * ⚠️ **`Delete permanently` e `Delete Permanently` sao duas chaves de catalogo
 * diferentes, e a diferenca e so a caixa do P.** O editor e a acao em massa usam
 * a minuscula (`meta-boxes.php:365`, `class-wp-posts-list-table.php:446`); a
 * acao da linha usa a maiuscula (`:1638`). Nao e descuido a corrigir: sao dois
 * `msgid` que o catalogo traduz separadamente, e unifica-los perderia uma das
 * traducoes e mudaria o texto de uma das telas. O mesmo vale para `Trash` na
 * linha, que e `_x( 'Trash', 'verb' )` — **com contexto de desambiguacao**, logo
 * uma terceira chave, diferente do `Trash` substantivo da barra de estados.
 *
 * ⚠️ **O rotulo e o endereco sao decididos em arquivos diferentes, por duas
 * leituras da mesma constante.** O editor escolhe o texto com
 * `! EMPTY_TRASH_DAYS` (`meta-boxes.php:364`) e chama
 * `get_delete_post_link( $post_id )` **sem forcar** (`:370`) — e a funcao
 * refaz a mesma pergunta por conta propria (`link-template.php:1577`). Os dois
 * concordam porque usam a mesma forma do operador; um porte que decidisse o
 * endereco por um caminho e o rotulo por outro produziria a tela que diz
 * *"Delete permanently"* e manda para `action=trash`.
 *
 * # CA-4.4: por que a tela nao oferece restaurar — e nao e pela constante
 *
 * Nenhuma das tres superficies le `EMPTY_TRASH_DAYS` para decidir se oferece
 * restaurar. O que elas leem e **o estado do registro**:
 *
 * - na linha da lista, `Restore` existe so quando
 *   `'trash' === $post->post_status` (`class-wp-posts-list-table.php:1614`);
 * - na acao em massa, so na **visao** da lixeira, `$this->is_trash` (`:437`);
 * - na barra de estados, o link da lixeira existe so quando a contagem daquele
 *   estado nao e vazia — `empty( $num_posts->$status_name )` (`:369`);
 * - no editor **nao existe restaurar em nenhum caso**, e a razao e outra tela:
 *   abrir para edicao um registro em `trash` morre em `wp_die` com **409** e
 *   *"You cannot edit this item because it is in the Trash. Please restore it and
 *   try again."* (`wp-admin/post.php:154`-`:155`).
 *
 * **Logo CA-4.4 e verdadeiro por consequencia, nao por regra**: com a lixeira
 * desligada nenhum registro chega ao estado `trash`, logo nenhuma linha oferece
 * `Restore`, a contagem do estado e zero e a barra nao mostra a lixeira. O porte
 * reproduz **o mecanismo** (a decisao pelo estado), e nao a frase do criterio: um
 * porte que escondesse o `Restore` testando a constante mudaria o comportamento
 * de uma instalacao que **ja tinha** conteudo na lixeira quando o prazo foi
 * zerado — ali o legado continua oferecendo restaurar linha por linha, e a
 * premissa do porte (*instalacao nova, sem dado a migrar*, respostas 1 a 5) nao
 * autoriza fechar esse caminho.
 *
 * # O que este arquivo NAO decide
 *
 * - **A capacidade.** As tres superficies ja estao dentro de
 *   `current_user_can( 'delete_post', $post->ID )`
 *   (`class-wp-posts-list-table.php:1613`, `meta-boxes.php:363`), e
 *   `get_delete_post_link()` pergunta **de novo** por conta propria, devolvendo
 *   `null` a quem nao pode (`link-template.php:1573`). E a mesma capacidade de
 *   US-1, e a decisao esta em `permissao-de-descarte.ts`: aqui ela chega como
 *   resposta, no campo `podeApagar`, porque quem monta a tela ja a perguntou.
 * - **A acao em massa `Bulk edit`** (`:440`) e a de restaurar em lote, que estao
 *   sob `edit_posts` e nao sob `delete_posts` (`:436` e `:444`) — as duas entram
 *   aqui so no que o descarte decide; o `Bulk edit` e de BC-01.
 * - **Os pontos de extensao que reescrevem estas listas**, que sao contrato
 *   publico (**P2**) e estao declarados em {@link GANCHOS_DAS_ACOES_NA_TELA}.
 * - **A confirmacao pedida ao ator** (CA-4.2), que esta em
 *   `aviso-de-exclusao-definitiva.ts` — e e **nenhuma**.
 */

import { lixeiraEstaLigada, type PrazoDeRetencao } from '../configuracao/index.js';
import { ESTADO_DE_LIXEIRA } from './estado-de-lixeira.js';

/** O que a tela oferece fazer com o registro. Tres, e nao mais. */
export type AcaoDeDescarte = 'restaurar' | 'descartar' | 'apagar-em-definitivo';

/**
 * O valor de `action` na rota do painel, que e o que a superficie despacha
 * (`wp-admin/post.php:250`, `:287` e `:316`).
 *
 * E **cadeia do legado**, nao nome traduzido: ela viaja na URL, esta no nome do
 * `nonce` e aparece no `aria-label` de nenhum deles. Renomear cai em **P8**.
 */
export type AcaoNaRotaDoPainel = 'untrash' | 'trash' | 'delete';

/** Uma acao oferecida na tela, com tudo o que a borda precisa para montar o link. */
export interface AcaoDeDescarteNaTela {
  readonly acao: AcaoDeDescarte;
  /** O rotulo literal, na chave do catalogo (ingles). */
  readonly rotulo: string;
  /**
   * O `aria-label` literal, ja com o titulo interpolado — o **nome acessivel**
   * da acao, que no legado e mais explicito que o rotulo e por isso tambem e
   * contrato de tela (`class-wp-posts-list-table.php:1619`, `:1627`, `:1637`).
   *
   * `null` onde o legado nao emite nenhum: o editor nao poe `aria-label` no
   * `submitdelete` (`meta-boxes.php:370`) e a acao em massa e um `<option>`.
   */
  readonly descricao: string | null;
  readonly acaoNaRota: AcaoNaRotaDoPainel;
  /**
   * O nome da acao do `nonce`, `"{acao}-post_{id}"`
   * (`link-template.php:1590`, `class-wp-posts-list-table.php:1617`).
   *
   * E contrato: ele muda o valor do campo oculto que o formulario envia, e a
   * secao 5 de cada tela de `target_screens.md` registra *"o nome da acao do
   * `nonce` e contrato"*. `null` na acao em massa, que usa um `nonce` de tela
   * (`bulk-posts`) e nao um por registro.
   */
  readonly nonce: string | null;
}

/** O registro, como a tela o conhece. */
export interface RegistroNaTelaDeDescarte {
  readonly id: number;
  /** A coluna de estado. `trash` e o que decide CA-4.4 — ver o cabecalho. */
  readonly estado: string;
  /** O titulo, que entra nos tres `aria-label`. */
  readonly titulo: string;
}

/*
  ── OS SEIS ROTULOS, CADA UM NA LINHA EM QUE FOI LIDO ────────────────────────

  Sao seis chaves de catalogo distintas para tres acoes, porque o legado as
  escreve em tres telas e nao reaproveita o texto. Ver o primeiro ⚠️ do
  cabecalho: a diferenca de caixa e de contexto NAO e descuido.
*/

/** `Move to Trash` — o editor (`wp-admin/includes/meta-boxes.php:367`). */
export const ROTULO_DE_DESCARTE_NO_EDITOR = 'Move to Trash';

/**
 * `Delete permanently` — o editor com a lixeira desligada
 * (`wp-admin/includes/meta-boxes.php:365`). **P minusculo.**
 */
export const ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR = 'Delete permanently';

/**
 * `Trash` — a linha da lista (`class-wp-posts-list-table.php:1628`).
 *
 * E `_x( 'Trash', 'verb' )`: **com contexto de desambiguacao**, logo uma chave
 * diferente do `Trash` substantivo que a barra de estados usa.
 */
export const ROTULO_DE_DESCARTE_NA_LINHA = 'Trash';

/**
 * `Delete Permanently` — a linha da lista
 * (`class-wp-posts-list-table.php:1638`). **P maiusculo.**
 */
export const ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA = 'Delete Permanently';

/**
 * `Restore` — a linha da lista (`class-wp-posts-list-table.php:1620`) e a acao
 * em massa na visao da lixeira (`:438`). O mesmo `msgid` nos dois.
 */
export const ROTULO_DE_RESTAURACAO = 'Restore';

/** `Move to Trash` — a acao em massa (`class-wp-posts-list-table.php:448`). */
export const ROTULO_DE_DESCARTE_EM_MASSA = 'Move to Trash';

/**
 * `Delete permanently` — a acao em massa na visao da lixeira **ou** com a
 * lixeira desligada (`class-wp-posts-list-table.php:446`). **P minusculo.**
 */
export const ROTULO_DE_EXCLUSAO_DEFINITIVA_EM_MASSA = 'Delete permanently';

/**
 * Os tres `aria-label` da linha, com o titulo interpolado como o legado o
 * interpola — entre as aspas curvas `&#8220;` e `&#8221;`, **sem escapar o
 * titulo aqui**: no legado quem escapa e `esc_attr()`, que e da borda.
 */
export const DESCRICAO_NA_LINHA = Object.freeze({
  /** `class-wp-posts-list-table.php:1619`. */
  restaurar: (titulo: string): string =>
    `Restore &#8220;${titulo}&#8221; from the Trash`,
  /** `class-wp-posts-list-table.php:1627`. */
  descartar: (titulo: string): string =>
    `Move &#8220;${titulo}&#8221; to the Trash`,
  /** `class-wp-posts-list-table.php:1637`. */
  apagarEmDefinitivo: (titulo: string): string =>
    `Delete &#8220;${titulo}&#8221; permanently`,
});

/**
 * Os pontos de extensao que reescrevem estas listas — **contrato publico (P2)**,
 * declarados aqui porque e este arquivo que os emitiria.
 *
 * | gancho | argumentos | posicao | linha |
 * |---|---|---|---|
 * | `post_row_actions` | `(acoes, post)` | **depois** de montadas todas as acoes da linha, so para tipo **nao** hierarquico | `class-wp-posts-list-table.php:1705` |
 * | `page_row_actions` | `(acoes, post)` | o mesmo, so para tipo **hierarquico** | `:1690` |
 * | `bulk_actions-{tela}` | `(acoes)` | depois de montada a lista em massa, com o identificador da tela no nome | `class-wp-list-table.php:598` |
 * | `get_delete_post_link` | `(link, post_id, force_delete)` | **depois** do `nonce`, e o valor dele **e** o endereco devolvido | `wp-includes/link-template.php:1590` |
 *
 * ⚠️ **Os dois primeiros sao exclusivos entre si**: o legado escolhe um pelo
 * `is_post_type_hierarchical()` (`:1676`) e **nunca dispara os dois**. Um porte
 * que disparasse ambos daria a uma extensao de pagina a chance de reescrever a
 * lista de um post.
 *
 * O barramento que os emite **nao existe nesta arvore** e nao e desta tarefa —
 * REQ-162 esta em `do-not-rewrite.md`, e a postura do pacote e declarar o ponto
 * no arquivo que o emitiria em vez de bloquear a tarefa.
 */
export const GANCHOS_DAS_ACOES_NA_TELA = Object.freeze({
  acoesDaLinhaDeTipoSimples: 'post_row_actions',
  acoesDaLinhaDeTipoHierarquico: 'page_row_actions',
  prefixoDasAcoesEmMassa: 'bulk_actions-',
  enderecoDeExclusao: 'get_delete_post_link',
});

/** O endereco da acao de exclusao, na forma em que a tela o usa. */
export interface EnderecoDeExclusao {
  readonly acaoNaRota: AcaoNaRotaDoPainel;
  readonly nonce: string;
}

/**
 * `get_delete_post_link()` — **o coracao de CA-4.3**
 * (`wp-includes/link-template.php:1556`).
 *
 * ```php
 * $action = ( $force_delete || ! EMPTY_TRASH_DAYS ) ? 'delete' : 'trash';
 * ```
 *
 * Devolve a acao da rota e o nome do `nonce`, que e o que muda **antes** da
 * acao; nao devolve URL, porque montar endereco e da borda (ver o cabecalho).
 * `null` a quem nao tem `delete_post`, que e o que a funcao do legado faz
 * (`:1573`) — e por isso a tela de quem nao pode apagar nao tem o link, nem com
 * a lixeira desligada.
 *
 * ⚠️ **`forcar` e o pedido de quem chama, e ele e OR, nao AND**: a linha da
 * lista pede `true` para a acao *"Delete Permanently"* (`:1635`) mesmo com a
 * lixeira ligada — e assim que um registro **que esta na lixeira** se apaga de
 * vez. Trocar o `||` por `&&` esconderia essa acao em toda instalacao com
 * lixeira.
 */
export function enderecoDeExclusao(
  registro: RegistroNaTelaDeDescarte,
  prazo: PrazoDeRetencao,
  opcoes: { readonly podeApagar: boolean; readonly forcar?: boolean },
): EnderecoDeExclusao | null {
  if (!opcoes.podeApagar) {
    return null;
  }

  const acaoNaRota: AcaoNaRotaDoPainel =
    opcoes.forcar === true || !lixeiraEstaLigada(prazo) ? 'delete' : 'trash';

  return { acaoNaRota, nonce: `${acaoNaRota}-post_${registro.id}` };
}

/**
 * **A acao do editor** — o `<div id="delete-action">` da caixa de publicacao
 * (`wp-admin/includes/meta-boxes.php:361`-`:372`).
 *
 * E **uma acao, ou nenhuma**: o editor nunca oferece duas, e **nunca oferece
 * restaurar** — ver CA-4.4 no cabecalho, e o `wp_die` de 409 em
 * `wp-admin/post.php:154`.
 *
 * ⚠️ **O editor nao forca a exclusao**, e e `get_delete_post_link()` quem
 * resolve o endereco pela propria leitura da constante (`meta-boxes.php:370`).
 * Logo, para um registro **que esta na lixeira** com a lixeira ligada, esta tela
 * ofereceria *"Move to Trash"* de novo — e o pedido morreria no passo 3 de
 * `descartar-para-a-lixeira.ts` (`ja-na-lixeira`, sem emitir comando). Na
 * pratica a tela nao abre, pelo 409; o que esta funcao reproduz e o **ramo**, nao
 * a tela composta.
 */
export function acaoNoEditor(
  registro: RegistroNaTelaDeDescarte,
  prazo: PrazoDeRetencao,
  opcoes: { readonly podeApagar: boolean },
): AcaoDeDescarteNaTela | null {
  const endereco = enderecoDeExclusao(registro, prazo, opcoes);
  if (endereco === null) {
    return null;
  }

  const semLixeira = !lixeiraEstaLigada(prazo);

  return {
    acao: semLixeira ? 'apagar-em-definitivo' : 'descartar',
    rotulo: semLixeira
      ? ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR
      : ROTULO_DE_DESCARTE_NO_EDITOR,
    // O `submitdelete` do editor nao leva `aria-label` (`:370`).
    descricao: null,
    acaoNaRota: endereco.acaoNaRota,
    nonce: endereco.nonce,
  };
}

/**
 * **As acoes da linha da lista** (`class-wp-posts-list-table.php:1613`-`:1642`),
 * na ordem em que o legado as insere no arranjo — e a ordem **e** a da tela.
 *
 * O legado monta tres ramos, e **dois deles podem valer ao mesmo tempo**:
 *
 * | ramo | condicao | linha |
 * |---|---|---|
 * | `Restore` | `'trash' === $post->post_status` | `:1614` |
 * | `Trash` | `elseif ( EMPTY_TRASH_DAYS )` — **so se nao estiver na lixeira** | `:1622` |
 * | `Delete Permanently` | `'trash' === $post->post_status \|\| ! EMPTY_TRASH_DAYS` | `:1632` |
 *
 * Donde os quatro estados possiveis da linha, que sao o que CA-4.3 e CA-4.4
 * afirmam juntos:
 *
 * | registro | lixeira | o que a linha oferece |
 * |---|---|---|
 * | fora da lixeira | ligada | **so** `Trash` |
 * | fora da lixeira | **desligada** | **so** `Delete Permanently` — e nenhum `Restore` |
 * | na lixeira | ligada | `Restore` **e** `Delete Permanently` |
 * | na lixeira | desligada | `Restore` **e** `Delete Permanently` (ver CA-4.4 no cabecalho: a decisao e do estado) |
 */
export function acoesNaLinha(
  registro: RegistroNaTelaDeDescarte,
  prazo: PrazoDeRetencao,
  opcoes: { readonly podeApagar: boolean },
): readonly AcaoDeDescarteNaTela[] {
  if (!opcoes.podeApagar) {
    // `:1613`: sem `delete_post` nenhuma das tres acoes e montada.
    return [];
  }

  const naLixeira = registro.estado === ESTADO_DE_LIXEIRA;
  const comLixeira = lixeiraEstaLigada(prazo);
  const acoes: AcaoDeDescarteNaTela[] = [];

  if (naLixeira) {
    // `:1615`-`:1621`: o `untrash` e o unico dos tres que nao passa por
    // `get_delete_post_link()` — ele monta o proprio endereco e o proprio
    // `nonce` (`:1617`).
    acoes.push({
      acao: 'restaurar',
      rotulo: ROTULO_DE_RESTAURACAO,
      descricao: DESCRICAO_NA_LINHA.restaurar(registro.titulo),
      acaoNaRota: 'untrash',
      nonce: `untrash-post_${registro.id}`,
    });
  } else if (comLixeira) {
    // `:1623`-`:1629`: sem forcar, logo o endereco e `action=trash`.
    const endereco = enderecoDeExclusao(registro, prazo, opcoes);
    if (endereco !== null) {
      acoes.push({
        acao: 'descartar',
        rotulo: ROTULO_DE_DESCARTE_NA_LINHA,
        descricao: DESCRICAO_NA_LINHA.descartar(registro.titulo),
        acaoNaRota: endereco.acaoNaRota,
        nonce: endereco.nonce,
      });
    }
  }

  if (naLixeira || !comLixeira) {
    // `:1633`-`:1639`: **com** forcar — ver o ⚠️ de `enderecoDeExclusao`.
    const endereco = enderecoDeExclusao(registro, prazo, {
      ...opcoes,
      forcar: true,
    });
    if (endereco !== null) {
      acoes.push({
        acao: 'apagar-em-definitivo',
        rotulo: ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA,
        descricao: DESCRICAO_NA_LINHA.apagarEmDefinitivo(registro.titulo),
        acaoNaRota: endereco.acaoNaRota,
        nonce: endereco.nonce,
      });
    }
  }

  return acoes;
}

/** O que a visao da lista sabe de si quando monta as acoes em massa. */
export interface VisaoDaListaDeConteudo {
  /** `$this->is_trash` (`class-wp-posts-list-table.php:437`). */
  readonly naVisaoDeLixeira: boolean;
  /** `current_user_can( $post_type_obj->cap->edit_posts )` (`:436`). */
  readonly podeEditarEmLote: boolean;
  /** `current_user_can( $post_type_obj->cap->delete_posts )` (`:444`). */
  readonly podeApagarEmLote: boolean;
}

/**
 * **As acoes em massa de descarte** (`class-wp-posts-list-table.php:432`-`:452`).
 *
 * ⚠️ **Duas capacidades diferentes, e nao e a de US-1.** Restaurar em lote esta
 * sob `delete_posts`? **Nao**: esta sob **`edit_posts`** (`:436`), enquanto
 * descartar e apagar em lote estao sob `delete_posts` (`:444`). As duas sao
 * capacidades **do tipo**, nao a meta-capacidade `delete_post` **do registro** —
 * a tela em massa nao tem registro para perguntar sobre, e e por isso que a
 * recusa por registro so acontece depois, em `wp-admin/edit.php:123`.
 *
 * `Bulk edit` (`:440`) **nao entra aqui**: e de BC-01, e esta funcao devolve so
 * o que o descarte decide. Quem montar a lista completa concatena as duas.
 */
export function acoesEmMassa(
  prazo: PrazoDeRetencao,
  visao: VisaoDaListaDeConteudo,
): readonly { readonly acao: AcaoDeDescarte; readonly rotulo: string }[] {
  const acoes: { readonly acao: AcaoDeDescarte; readonly rotulo: string }[] = [];

  // `:434`-`:440`: `Restore` em lote **so** na visao da lixeira, sob `edit_posts`.
  if (visao.podeEditarEmLote && visao.naVisaoDeLixeira) {
    acoes.push({ acao: 'restaurar', rotulo: ROTULO_DE_RESTAURACAO });
  }

  if (visao.podeApagarEmLote) {
    // `:445`: a mesma condicao da linha — visao de lixeira OU lixeira desligada.
    if (visao.naVisaoDeLixeira || !lixeiraEstaLigada(prazo)) {
      acoes.push({
        acao: 'apagar-em-definitivo',
        rotulo: ROTULO_DE_EXCLUSAO_DEFINITIVA_EM_MASSA,
      });
    } else {
      acoes.push({ acao: 'descartar', rotulo: ROTULO_DE_DESCARTE_EM_MASSA });
    }
  }

  return acoes;
}
