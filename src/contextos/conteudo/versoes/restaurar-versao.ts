/**
 * **CA-10.4**: *"Restaurar uma versao substitui o corpo corrente e guarda o
 * corrente como versao nova"*.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Sao duas
 * funcoes, e a diferenca entre elas e a mesma razao pela qual T003 entregou
 * duas:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link restaurarVersao} | a operacao *"restaurar"* da tabela *Contratos* de `plan.md` — a superficie | **sim** |
 * | {@link restaurarConteudoDaVersao} | `wp_restore_post_revision()` (`wp-includes/revision.php:476`) | **nao**, e e assim no legado |
 *
 * **`wp_restore_post_revision()` nao tem portao, e isso e superficie
 * publicada.** Ela e funcao publica do nucleo com **dois** chamadores que cobram
 * coisas diferentes antes de chama-la — a tela do painel
 * (`wp-admin/revision.php:71`) e o metodo `wp.restoreRevision` do XML-RPC
 * (`class-wp-xmlrpc-server.php:4845`) —, e qualquer extensao e um terceiro. O
 * **P4** cobra *"declarar permissao explicita em toda operacao exposta"* e
 * **preservar o default de cada camada**, e e o que as duas funcoes juntas
 * fazem: a operacao declara a capacidade, a funcao do legado declara que nao tem
 * nenhuma.
 *
 * ---
 *
 * # 🔴 A segunda metade de CA-10.4 nao acontece aqui, e nao acontece como o
 * criterio descreve
 *
 * *"(…) e guarda o corrente como versao nova"*. No legado, a versao nova **nao e
 * criada pela restauracao**: ela e criada pela **gravacao** que a restauracao
 * dispara. `wp_restore_post_revision()` chama `wp_update_post()` (`:499`), que
 * chama `wp_insert_post()`, que emite o ponto `wp_after_insert_post`, onde
 * `wp_save_post_revision_on_insert()` esta registrado em prioridade 9 — e e ele
 * que grava a versao.
 *
 * E o que essa versao carrega **nao e** o corpo corrente de antes da
 * restauracao: e o corpo **restaurado**, porque `wp_save_post_revision()` corre
 * depois da escrita e le a linha ja atualizada. O texto sobrescrito nao se perde
 * — ele ja estava guardado como a versao mais recente **antes** da restauracao,
 * pela invariante do legado de que *"the most recent revision always matches the
 * current post"*. A analise completa esta no cabecalho de
 * `contexto-de-versao.ts`, e o **P1** manda reproduzir, nao corrigir: esta tarefa
 * **nao escolhe** entre a redacao do criterio e o codigo lido.
 *
 * Consequencia pratica para quem compoe este modulo: **{@link GravacaoNaVersao.atualizar}
 * tem de ser a gravacao de verdade, com o ouvinte registrado.** Passar uma funcao
 * que so escreve a linha produz uma restauracao que nao versiona — e o criterio
 * cai sem que nada nesta pasta mude.
 *
 * ---
 *
 * # O que a restauracao escreve, e o que ela NAO escreve
 *
 * | escreve | nao escreve |
 * |---|---|
 * | os campos versionaveis, no **conteudo pai** (`:489`-`:498`) | o estado, o tipo, o identificador na URL e as datas do conteudo |
 * | o metadado `_edit_last`, com quem restaurou (`:505`) | nada na linha da **versao** — ela e so lida |
 * | o metadado versionado, pelo ouvinte do nucleo (`:518`) | o autor do conteudo |
 *
 * Um porte que escrevesse a linha inteira da versao de volta no conteudo poria
 * o conteudo em `inherit` com tipo `revision`, e o tiraria do ar. A razao de so
 * os campos versionaveis voltarem esta em `camposDaRestauracao()`, em
 * `campos-da-versao.ts`.
 *
 * ---
 *
 * # As duas guardas da tela que NAO estao aqui, e de quem sao
 *
 * `wp-admin/revision.php` confere mais duas coisas entre a capacidade e a
 * restauracao, e nenhuma e desta feature:
 *
 * | # | guarda | linha | de quem e |
 * |---|---|---|---|
 * | 1 | `wp_check_post_lock( $post->ID )` — *"Don't restore if the post is locked"* | `:57` | a trava de edicao do editor, BC-07 |
 * | 2 | `check_admin_referer( "restore-post_{$revision->ID}" )` | `:62` | o nonce, `plataforma/` |
 *
 * Ficam declaradas **na posicao exata do fluxo** dentro de
 * {@link restaurarVersao}, pela mesma regra que o **P4** aplica aos cinco
 * atestados: *"uma matriz que ignore esses cinco descreve um sistema mais fechado
 * do que o real"* — e aqui a omissao e no sentido contrario, o de descrever um
 * sistema mais **aberto**. Implementa-las aqui inventaria superficie de outra
 * feature; nao as nomear faria a ausencia parecer esquecimento.
 */

import { inteiro } from '../../../plataforma/serializacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import { camposDaRestauracao, camposVersionaveis } from './campos-da-versao.js';
import { versionamentoLigado } from './configuracao-de-versoes.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';
import {
  paiDoSalvamentoAutomaticoDaVersao,
  versaoPorId,
} from './leitura-de-versoes.js';
import { restaurarMetadadosVersionados } from './metadado-versionado.js';
import {
  autorizarRestauracaoDeVersao,
  type RecusaDeVersao,
} from './permissao-de-versao.js';

/**
 * `_edit_last` — a chave de metadado em que a restauracao grava **quem
 * restaurou** (`wp-includes/revision.php:505`).
 *
 * O nome e do legado e nao se traduz: o **P8** poe superficie publicada no
 * contrato publico, e esta chave e lida pela trava de edicao e pela coluna
 * *"Ultima edicao"* do painel.
 *
 * ⚠️ **E o unico registro que a restauracao deixa de quem agiu**, e ele e
 * sobrescrito pela edicao seguinte. UC-07 ja registra a ausencia maior — *"nenhum
 * registro de quem aprovou foi gravado"* —, e REQ-028 (*"registrar quem decidiu
 * cada transicao de estado editorial"*) ficou **fora do pacote**: nao se decide
 * nada sobre trilha editorial aqui.
 */
export const CHAVE_DE_ULTIMA_EDICAO = '_edit_last';

/** O que aconteceu ao pedir a restauracao. */
export type DesfechoDaRestauracao =
  /** O conteudo foi atualizado com os campos da versao. */
  | 'restaurado'
  /** A linha nao existe, ou nao e de versao (`:477`-`:481`). */
  | 'versao-inexistente'
  /** O conteudo pai nao existe (`wp-admin/revision.php:46`). */
  | 'conteudo-inexistente'
  /** Sem `edit_post` do conteudo pai. */
  | 'recusado'
  /**
   * Versionamento desligado e a versao **nao** e salvamento automatico
   * (`wp-admin/revision.php:52`).
   */
  | 'versionamento-desligado'
  /** Nenhum campo versionavel sobreviveu ao filtro: o `false` do legado (`:494`). */
  | 'sem-campo-a-restaurar'
  /** `wp_update_post()` devolveu `0` (`:501`). */
  | 'gravacao-falhou';

/** O que a restauracao devolve. */
export interface ResultadoDaRestauracao {
  readonly desfecho: DesfechoDaRestauracao;
  /**
   * `$post_id` — o identificador do **conteudo**, nao o da versao, porque e o
   * que `wp_restore_post_revision()` devolve (`:520`). `null` nos desfechos em
   * que o legado devolve `null`, `false` ou `0`.
   */
  readonly conteudoId: number | null;
  /** A recusa de capacidade, ou `null`. Preenchida **so** em `recusado`. */
  readonly recusa: RecusaDeVersao | null;
  /**
   * As chaves de metadado versionado que o ouvinte do nucleo percorreu, na
   * ordem.
   *
   * Mesma regra dos campos equivalentes de `guardar-versao.ts`: efeito exposto
   * para ser afirmavel por teste, e consultado por ramo nenhum (P7).
   */
  readonly metadadosRestaurados: readonly string[];
}

const SEM_RESTAURACAO = {
  conteudoId: null,
  recusa: null,
  metadadosRestaurados: [],
} as const;

/** Quem se restaura. */
export interface PedidoDeRestauracao {
  readonly versaoId: number;
}

/**
 * **A operacao de US-10.** Restaura a versao, exigindo a capacidade de editar o
 * conteudo pai.
 *
 * **Permissao exigida: `edit_post` do conteudo pai**, decidida em
 * `permissao-de-versao.ts`. E meta-capacidade, logo resolve por autoria e por
 * estado do conteudo — um autor restaura versao do que e dele, um editor
 * restaura versao do que e de outro (CA-8.1, que e US-8).
 *
 * Os passos sao os de `wp-admin/revision.php:36`-`:71`, na ordem — **e a ordem
 * e observavel**, porque decide qual recusa o ator recebe:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | a linha tem de ser de versao | `:37`-`:40` |
 * | 2 | `edit_post` do **pai** | `:42` |
 * | 3 | o conteudo pai tem de existir | `:46` |
 * | 4 | versionamento ligado **ou** a versao e salvamento automatico | `:52` |
 * | 5 | a trava de edicao — **declarada, de BC-07** | `:57` |
 * | 6 | o nonce — **declarado, de `plataforma/`** | `:62` |
 * | 7 | `wp_restore_post_revision()` | `:71` |
 *
 * ⚠️ **O passo 2 vem ANTES do passo 3**, e e por isso que a capacidade e
 * perguntada com o identificador do pai lido da **versao** e nao do registro do
 * pai: quando o pai nao existe, a autorizacao ja foi consultada e devolveu
 * `do_not_allow` por objeto inexistente (`BR-MIGRAR-091`), o que faz a tela sair
 * no passo 2 e nao no 3. Inverter os dois trocaria a recusa de lugar.
 *
 * ⚠️ **O passo 4 e uma disjuncao, e a metade esquecida e a que importa**: `!
 * wp_revisions_enabled( $post ) && ! wp_is_post_autosave( $revision )`. Com o
 * versionamento **desligado**, o painel ainda restaura **salvamento
 * automatico** — e tem de restaurar, porque o rascunho automatico e o unico
 * jeito de recuperar o que o editor salvou sozinho, e US-11 o cria mesmo com
 * `WP_POST_REVISIONS` em zero. Um porte que recusasse tudo com versionamento
 * desligado perderia essa recuperacao.
 *
 * ⚠️ **O XML-RPC guarda o contrario, e esta tarefa nao o implementa**:
 * `wp.restoreRevision` **recusa** salvamento automatico com 404 — `if (
 * wp_is_post_autosave( $revision ) ) return new IXR_Error( 404, 'Invalid post
 * ID.' )` (`class-wp-xmlrpc-server.php:4827`) — e **nao** tem a disjuncao do
 * passo 4: ele recusa com 401 quando o versionamento esta desligado, ponto. As
 * duas superficies divergem **no legado**, e esta operacao reproduz a do painel,
 * que e a que o editor usa e a que CA-10.4 descreve. A do XML-RPC fica
 * declarada aqui, com as duas linhas, para quem portar aquela superficie.
 */
export function restaurarVersao(
  contexto: ContextoDeVersao,
  pedido: PedidoDeRestauracao,
): ResultadoDaRestauracao {
  // Passo 1 (`:37`).
  const versao = versaoPorId(contexto, pedido.versaoId);
  if (versao === null) {
    return { desfecho: 'versao-inexistente', ...SEM_RESTAURACAO };
  }

  const paiId =
    versao.vinculo.tipo === 'original-da-versao' ? versao.vinculo.id : 0;

  // Passo 2 (`:42`): e ANTES de o pai ser lido.
  const recusa = autorizarRestauracaoDeVersao(contexto, paiId);
  if (recusa !== null) {
    return { desfecho: 'recusado', ...SEM_RESTAURACAO, recusa };
  }

  // Passo 3 (`:46`).
  const pai = contexto.armazenamento.conteudo.obterPorId(paiId);
  if (pai === null) {
    return { desfecho: 'conteudo-inexistente', ...SEM_RESTAURACAO };
  }

  // Passo 4 (`:52`): a disjuncao, com as duas metades. A tela passa o **objeto**
  // a `wp_is_post_autosave()`, logo nao ha releitura aqui — ver
  // `paiDoSalvamentoAutomaticoDaVersao()`.
  if (
    !versionamentoLigado(contexto, pai) &&
    paiDoSalvamentoAutomaticoDaVersao(versao) === false
  ) {
    return { desfecho: 'versionamento-desligado', ...SEM_RESTAURACAO };
  }

  // Passo 5 (`:57`): `wp_check_post_lock( $post->ID )`, a trava de edicao. E de
  // BC-07 e nao existe nesta arvore — ver o cabecalho.
  // Passo 6 (`:62`): `check_admin_referer( "restore-post_{$revision->ID}" )`, o
  // nonce. E de `plataforma/` e nao existe nesta arvore.

  // Passo 7 (`:71`): **pelo identificador**, e a releitura que isso custa e do
  // legado, nao deste porte. A tela escreve `wp_restore_post_revision(
  // $revision->ID )`, e nao `( $revision )`, logo `wp_get_post_revision()` torna
  // a ler a linha — com o cache ligado, acerta o cache. Passar o registro aqui
  // economizaria um `SELECT` que o legado emite, e a area 3 da Decisao 2 compara
  // *"snapshot + sequencia de comandos"*.
  return restaurarConteudoDaVersao(contexto, versao.id);
}

/**
 * `wp_restore_post_revision( $revision )` — a restauracao, **sem portao de
 * capacidade** (`wp-includes/revision.php:476`-`:521`).
 *
 * Aceita o identificador **ou** a propria linha, como `wp_get_post_revision()`
 * aceita `int|WP_Post`: so a primeira forma consulta.
 *
 * Os seis passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | a linha tem de ser de versao | `:477`-`:481` |
 * | 2 | os campos a restaurar: os versionaveis da propria versao | `:483`-`:492` |
 * | 3 | lista vazia devolve `false` | `:494` |
 * | 4 | o alvo e o **pai**, e `wp_update_post()` grava | `:498`-`:503` |
 * | 5 | `_edit_last` com quem restaurou | `:505` |
 * | 6 | o ponto `wp_restore_post_revision` | `:517` |
 *
 * ⚠️ **O `$fields` opcional do legado nao viaja**, e a ausencia e deliberada: a
 * assinatura e `wp_restore_post_revision( $revision, $fields = null )` e *"can
 * restore a past revision using all fields of the post revision, **or only
 * selected fields**"* — e **nenhum** dos tres chamadores do legado o informa
 * (`wp-admin/revision.php:71`, `class-wp-xmlrpc-server.php:4845`, e o
 * `do_action` nao conta). Acrescenta-lo aqui seria portar superficie que o
 * produto tem e ninguem usa; **declara-lo e o que o P8 pede**, e quem precisar
 * dele passa a lista por {@link GanchosDaVersao.filtrarCamposVersionaveis}, que
 * e o caminho que o legado deixa aberto para o mesmo efeito.
 *
 * ⚠️ **O passo 5 grava `_edit_last` mesmo quando quem restaurou e anonimo**: o
 * legado escreve `get_current_user_id()`, que vale `0` fora de sessao, e
 * `update_post_meta()` grava o `0`. Nao ha guarda, e o `0` e observavel na coluna
 * *"Ultima edicao"* do painel. Reproduzido (P1).
 */
export function restaurarConteudoDaVersao(
  contexto: ContextoDeVersao,
  referencia: number | Conteudo,
): ResultadoDaRestauracao {
  // Passo 1 (`:477`): com o registro em maos, o legado nao consulta — mas ele
  // **confere o tipo** nas duas formas, porque `wp_get_post_revision()` o
  // confere sempre.
  const versao =
    typeof referencia === 'number'
      ? versaoPorId(contexto, referencia)
      : referencia;

  if (versao === null || versao.tipo !== TIPO_DA_VERSAO) {
    return { desfecho: 'versao-inexistente', ...SEM_RESTAURACAO };
  }

  // Passo 2 (`:483`): os campos versionaveis, lidos **da versao**. O
  // `_wp_post_revision_fields( $revision )` do legado recebe a versao, e nao o
  // conteudo — e e isso que `camposVersionaveis` recebe aqui.
  const atualizacao = camposDaRestauracao(
    versao,
    camposVersionaveis(contexto, versao),
  );

  // Passo 3 (`:494`): o `false` do legado, que nao e erro e nao e sucesso.
  if (Object.keys(atualizacao).length === 0) {
    return { desfecho: 'sem-campo-a-restaurar', ...SEM_RESTAURACAO };
  }

  // Passo 4 (`:498`): o alvo e o PAI. O `wp_slash()` da linha seguinte do legado
  // nao viaja — escapar e da camada de dados.
  const paiId =
    versao.vinculo.tipo === 'original-da-versao' ? versao.vinculo.id : 0;
  const conteudoId = contexto.gravacao.atualizar(paiId, atualizacao);

  // `:501`: `if ( ! $post_id || is_wp_error( $post_id ) ) { return $post_id; }`.
  // Com o `$wp_error` de fabrica, `wp_update_post()` devolve `0` na falha — e e
  // esse `0` que para o fluxo **antes** de `_edit_last` e antes do ponto.
  if (conteudoId === 0) {
    return { desfecho: 'gravacao-falhou', ...SEM_RESTAURACAO };
  }

  // Passo 5 (`:505`): `update_post_meta( $post_id, '_edit_last',
  // get_current_user_id() )`.
  contexto.armazenamento.metadados.gravar(
    conteudoId,
    CHAVE_DE_ULTIMA_EDICAO,
    inteiro(contexto.ator.contaId),
  );

  // Passo 6 (`:517`): o ouvinte do nucleo, prioridade 10, **antes** do
  // interceptador de terceiro.
  const metadadosRestaurados = restaurarMetadadosVersionados(
    contexto,
    conteudoId,
    versao.id,
  );
  contexto.ganchos?.aoRestaurarVersao?.(conteudoId, versao.id);

  return {
    desfecho: 'restaurado',
    conteudoId,
    recusa: null,
    metadadosRestaurados,
  };
}

/**
 * `revision` — o tipo que o passo 1 confere nas duas formas de referencia.
 *
 * Gemeo do de `guardar-versao.ts`, e pelo mesmo motivo: e o valor que **esta**
 * comparacao compara. O nome canonico esta em `TIPO_DE_VERSAO`, em
 * `../armazenamento/vinculo-com-o-pai.ts`, e os dois sao a mesma cadeia —
 * afirmado por teste.
 */
const TIPO_DA_VERSAO = 'revision';
