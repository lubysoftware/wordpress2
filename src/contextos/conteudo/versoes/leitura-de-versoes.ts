/**
 * As leituras de versao: *"listar versoes"* da tabela **Contratos** de
 * `plan.md`, e as tres perguntas que o legado faz sobre uma linha de versao.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Nada aqui
 * grava, e nada aqui decide permissao: as leituras que uma **operacao exposta**
 * faz declaram a capacidade em `permissao-de-versao.ts`, como o **P4** exige.
 *
 * | funcao desta pasta | o que e no legado |
 * |---|---|
 * | {@link versaoPorId} | `wp_get_post_revision()` (`wp-includes/revision.php:438`) |
 * | {@link paiDaVersao} | `wp_is_post_revision()` (`:311`) |
 * | {@link paiDoSalvamentoAutomaticoDaVersao} e {@link paiDoSalvamentoAutomatico} | `wp_is_post_autosave()` (`:329`), nas duas formas |
 * | {@link listarVersoes} | `wp_get_post_revisions()` (`:666`) |
 * | {@link ultimaVersaoQueNaoEAutomatica} | o laco de `wp_save_post_revision()` (`:163`-`:171`) |
 *
 * ---
 *
 * # As duas leituras que o legado repete, e a divergencia de cache que elas
 * carregam
 *
 * `wp_get_post_revisions()` abre com `$post = get_post( $post )` (`:667`)
 * **mesmo quando quem chama ja tem a linha em maos**, porque o legado a chama
 * com o identificador. Com o cache de objeto ligado essa segunda leitura acerta
 * o cache e nenhum comando sai; **sem cache, que e o estado desta arvore, sai um
 * `SELECT`**.
 *
 * Isso **nao** foi decidido aqui: e a mesma divergencia declarada no README
 * deste modulo, no cabecalho de `../armazenamento/metadado.ts` e no de
 * `../publicacao/publicar.ts` — REQ-165 ficou fora do pacote e a borda 5 de
 * `target_architecture.md` manda o cache **desligado nas duas metades** durante
 * a coexistencia, que e como a comparacao de paridade roda. A leitura fica no
 * **mesmo ponto** do legado, de modo que o cache, quando existir, entra na
 * frente dela sem mudar o que ela devolve.
 *
 * ---
 *
 * # O que esta pasta NAO tem, e de quem e
 *
 * - **`wp_get_latest_revision_id_and_total_count()`** (`:716`) devolve o
 *   identificador da mais recente **e a contagem total**, e a contagem sai de
 *   `$revision_query->found_posts` — isto e, do `SELECT FOUND_ROWS()` de
 *   `WP_Query`. Portar `WP_Query` e da feature 004 e da 015, e nenhum criterio
 *   de US-10 pede contagem. `../armazenamento/versao.ts` ja tem a metade que
 *   nao depende dela, `maisRecente()`, com o `posts_per_page => 1` anotado.
 * - **`wp_get_post_revisions_url()`** (`:762`) monta endereco de tela. E BC-07.
 * - **A cadeia de filtros de `WP_Query`.** O cabecalho de
 *   `../armazenamento/versao.ts` ja registra que a **cadeia** nao e a mesma, e
 *   que o legado, quando quer a lista crua, diz no comentario que esta fugindo
 *   dela (*"Do raw query. `wp_get_post_revisions()` is filtered"*,
 *   `wp-includes/post.php:3912`). O que estas leituras garantem e o conjunto de
 *   linhas e a ordem delas.
 */

import {
  eSalvamentoAutomatico,
  idDoOriginal,
  TIPO_DE_VERSAO,
  type Conteudo,
  type OrdemDasVersoes,
} from '../armazenamento/index.js';
import { versionamentoLigado } from './configuracao-de-versoes.js';
import type { ContextoDeVersao } from './contexto-de-versao.js';

/**
 * `wp_get_post_revision( $post )` — a linha, **se** ela for de versao
 * (`wp-includes/revision.php:438`-`:462`).
 *
 * Devolve `null` nos dois casos do legado, e eles sao diferentes entre si e
 * indistinguiveis no retorno: a linha nao existe, ou existe e **nao e** de
 * versao. O legado devolve `$revision` (que e `null`) no primeiro e `null`
 * literal no segundo — o mesmo valor, de proposito.
 *
 * ⚠️ **A pergunta e pelo tipo da linha, e nao pelo nome dela.** Uma linha de
 * `post_type = 'revision'` com `post_name` fora da convencao continua sendo
 * versao aqui, e e assim que o legado trata a linha historica `{id}-autosave`
 * sem o `-v1` que `_wp_upgrade_revisions_of_post()` renomeia — ver
 * {@link eSalvamentoAutomatico} em `../armazenamento/versao.ts`.
 */
export function versaoPorId(
  contexto: ContextoDeVersao,
  versaoId: number,
): Conteudo | null {
  const linha = contexto.armazenamento.conteudo.obterPorId(versaoId);
  if (linha === null) {
    return null;
  }
  return linha.tipo === TIPO_DE_VERSAO ? linha : null;
}

/**
 * `wp_is_post_revision( $post )` — o identificador do conteudo original, ou
 * `false` (`wp-includes/revision.php:311`-`:319`).
 *
 * O `false` **nao** foi trocado por `null`: no legado ele e o valor que separa
 * *"nao e versao"* de *"e versao do conteudo 0"*, e o `0` acontece — e a versao
 * orfa, que o **P5** trata como estado normal (ver
 * `plataforma/autorizacao/traducao-de-conteudo.ts`, que a faz fechar a porta).
 */
export function paiDaVersao(
  contexto: ContextoDeVersao,
  versaoId: number,
): number | false {
  const versao = versaoPorId(contexto, versaoId);
  return versao === null ? false : idDoOriginal(versao);
}

/**
 * `wp_is_post_autosave( $post )` com o **registro em maos** — o identificador do
 * original quando a linha e salvamento automatico, ou `false`
 * (`wp-includes/revision.php:329`-`:341`).
 *
 * A pergunta e `str_contains( $post->post_name,
 * "{$post->post_parent}-autosave" )`, e e **conter** e nao **ser** — a razao
 * esta no cabecalho de {@link eSalvamentoAutomatico}, em
 * `../armazenamento/versao.ts`.
 *
 * ⚠️ **Existe separada da que le porque o legado chama as duas formas, e a
 * diferenca e um comando.** A tela de restauracao passa o **objeto** —
 * `! wp_is_post_autosave( $revision )` (`wp-admin/revision.php:52`) —, e
 * `get_post()` com objeto **nao consulta**; o XML-RPC tambem passa o objeto
 * (`class-wp-xmlrpc-server.php:4827`). Chamar a forma que le nesses dois pontos
 * acrescentaria um `SELECT` que o legado nao emite, e o criterio desta area e
 * *"efeito no banco: snapshot + sequencia de comandos"*.
 */
export function paiDoSalvamentoAutomaticoDaVersao(versao: Conteudo): number | false {
  if (versao.tipo !== TIPO_DE_VERSAO) {
    return false;
  }
  const pai = idDoOriginal(versao);
  return eSalvamentoAutomatico(versao.identificadorNaUrl, pai) ? pai : false;
}

/**
 * A mesma pergunta pelo identificador, que **le a linha**: a forma que
 * `wp_is_post_autosave( $post_id )` tem quando quem chama nao tem o registro.
 */
export function paiDoSalvamentoAutomatico(
  contexto: ContextoDeVersao,
  versaoId: number,
): number | false {
  const versao = versaoPorId(contexto, versaoId);
  return versao === null ? false : paiDoSalvamentoAutomaticoDaVersao(versao);
}

/** As opcoes de {@link listarVersoes}, com os defaults do legado. */
export interface OpcoesDaListaDeVersoes {
  /**
   * `'order'` — de fabrica `DESC` (`wp-includes/revision.php:674`).
   *
   * A poda de `wp_save_post_revision()` e o **unico** chamador do nucleo que
   * pede `ASC` (`:229`), e ela precisa: e a ordem crescente que poe a versao
   * mais antiga na frente da lista que vai ser cortada.
   */
  readonly ordem?: OrdemDasVersoes;
  /**
   * `'check_enabled'` — de fabrica `true` (`wp-includes/revision.php:676`).
   *
   * ⚠️ **Com ele, a lista vem vazia SEM consultar o banco** quando o
   * versionamento esta desligado (`:680`). Tres chamadores do legado o pedem
   * `false` de proposito, porque querem a lista mesmo assim: o endpoint de
   * salvamento automatico (`class-wp-rest-autosaves-controller.php:326`), o
   * changeset do customizador (`class-wp-customize-manager.php:3627`) e a acao
   * de ajax do editor (`wp-admin/includes/ajax-actions.php:3603`). Trocar o
   * default por `false` fariam os tres parecerem iguais ao caminho comum, e o
   * comando que sai deixaria de ser o do legado.
   */
  readonly conferirSeLigado?: boolean;
}

/**
 * `wp_get_post_revisions( $post, $args )` — as versoes de um conteudo
 * (`wp-includes/revision.php:666`-`:700`).
 *
 * Os quatro passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | ler o conteudo; sem linha, ou com `ID` vazio, **lista vazia** | `:667`-`:671` |
 * | 2 | com `check_enabled`, versionamento desligado devolve **lista vazia sem consultar** | `:680` |
 * | 3 | `get_children()` com os tres criterios e os dois de ordem | `:693` |
 * | 4 | lista falsa vira lista vazia | `:695` |
 *
 * O passo 4 nao tem efeito em TypeScript — a consulta devolve arranjo e nunca
 * `false` —, e esta anotado porque e a terceira vez que o legado normaliza o
 * mesmo vazio neste caminho, e porque e o que faz a funcao **nunca** devolver
 * erro: quem consome esta leitura nao distingue *"conteudo inexistente"* de
 * *"nenhuma versao"*, e isso e observavel.
 */
export function listarVersoes(
  contexto: ContextoDeVersao,
  conteudoId: number,
  opcoes: OpcoesDaListaDeVersoes = {},
): readonly Conteudo[] {
  // Passo 1 (`:667`): a leitura que o legado repete. Ver a nota de cache no
  // cabecalho — com cache ligado, nenhum comando sai daqui.
  const conteudo = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return [];
  }

  // Passo 2 (`:680`): sem consultar o banco.
  if (
    (opcoes.conferirSeLigado ?? true) &&
    !versionamentoLigado(contexto, conteudo)
  ) {
    return [];
  }

  // Passo 3 (`:693`).
  return contexto.armazenamento.versoes.listar(conteudo.id, opcoes.ordem);
}

/**
 * A ultima versao que **nao** e salvamento automatico — o laco de
 * `wp_save_post_revision()` (`wp-includes/revision.php:163`-`:171`).
 *
 * ```php
 * foreach ( $revisions as $revision ) {
 *     if ( str_contains( $revision->post_name, "{$revision->post_parent}-revision" ) ) {
 *         $latest_revision = $revision;
 *         break;
 *     }
 * }
 * ```
 *
 * ⚠️ **A pergunta aqui e por `-revision`, e nao a negacao de `-autosave`**, e as
 * duas nao sao a mesma: uma linha de versao cujo `post_name` nao siga nenhuma
 * das duas convencoes — o que acontece com a linha historica que
 * `_wp_upgrade_revisions_of_post()` existe para renomear (`:1071`) — **nao** e
 * escolhida por este laco, e portanto nao serve de base para a comparacao de
 * mudanca. O efeito observavel e que, nesse caso, o legado grava versao nova sem
 * comparar nada. Inverter para *"a primeira que nao e salvamento automatico"*
 * mudaria isso em silencio.
 *
 * E **a lista tem de chegar em ordem decrescente**, porque o `break` toma a
 * primeira que encontra: a ordem e que faz dela a *"latest"*. Devolve `null`
 * quando nenhuma linha da lista e versao comum — inclusive quando a lista esta
 * vazia, que e o `if ( $revisions )` de `:164`.
 */
export function ultimaVersaoQueNaoEAutomatica(
  versoes: readonly Conteudo[],
): Conteudo | null {
  for (const versao of versoes) {
    const marca = `${String(idDoOriginal(versao))}-revision`;
    if (versao.identificadorNaUrl.includes(marca)) {
      return versao;
    }
  }
  return null;
}
