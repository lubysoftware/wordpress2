/**
 * **US-8**: apagar um conteudo em definitivo, reparenteando filhos e anexos.
 *
 * Entrega de **T017** da feature `005-retencao-e-descarte`. Sao duas funcoes, e
 * a divisao e a mesma que T003 fez para o descarte e que BC-01 fez para a
 * publicacao:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link apagarEmDefinitivo} | a acao `delete` do painel (`wp-admin/post.php:316`-`:340`) — a superficie | **sim**, `delete_post` do registro |
 * | {@link apagarConteudo} | `wp_delete_post()` (`wp-includes/post.php:3834`) | **nao**, e e assim no legado |
 *
 * `wp_delete_post()` e funcao publica e sem portao, chamada pelo painel, pela
 * API REST, pelo XML-RPC, pela coleta da lixeira (`wp_scheduled_delete()`, US-5)
 * e por `wp_trash_post()` quando nao ha lixeira. Dar-lhe um portao fecharia o
 * sistema mais que o legado; o **P4** cobra as duas coisas ao mesmo tempo —
 * *"declarar permissao explicita em toda operacao exposta"* e *"preservar o
 * default de cada camada, inclusive quando o default e permissivo"*.
 *
 * ---
 *
 * # A sequencia: tres desvios, sete etapas, um `DELETE`
 *
 * ## Os desvios, que acontecem ANTES de qualquer escrita
 *
 * | # | passo | linha | o que emite |
 * |---|---|---|---|
 * | 0 | `(int)` e `$post_id <= 0`: `_doing_it_wrong` e `false` | `:3837`-`:3841` | **nada** |
 * | 1 | o `SELECT *` cru da linha; sem linha, retorno silencioso | `:3843`-`:3847` | uma leitura |
 * | 2 | sem forca, tipo `post` ou `page`, estado diferente de `trash` **e** havendo lixeira: vai para a lixeira | `:3851`-`:3856` | `wp_trash_post()` inteira |
 * | 3 | tipo `attachment`: vai para `wp_delete_attachment()` | `:3858`-`:3860` | a exclusao de midia (BC-06) |
 * | 4 | o filtro `pre_delete_post`; valor nao nulo **para** | `:3871`-`:3874` | **nada** |
 * | 5 | a acao `before_delete_post` | `:3887` | — |
 *
 * ## As sete etapas de `EXT-EXCLUSAO` (BR-MIGRAR-104), atravessando 4 tabelas
 *
 * | etapa | o que faz | linha | tabela | comandos |
 * |---|---|---|---|---|
 * | 1 | apaga os dois marcadores de lixeira | `:3889`-`:3890` | `postmeta` | 2 a 4 (`SELECT` + `DELETE` por chave, e o `DELETE` so se houver) |
 * | 2 | remove os vinculos de termo das taxonomias **do tipo** | `:3892` | `term_relationships` | BC-02 |
 * | 3 | **CA-8.1** os filhos do mesmo tipo vao para o avo | `:3897`-`:3910` | `posts` | 1 ou 2 |
 * | 4 | **CA-8.3** as versoes anteriores vao em cascata, **recursivamente** | `:3913`-`:3920` | `posts` | 1 + a cascata de cada versao |
 * | 5 | **CA-8.2** os anexos vao para o avo | `:3923` | `posts` | **1, sempre** |
 * | 6 | os comentarios sao apagados com forca, contagem adiada | `:3925`-`:3935` | `comments` | 1 + BC-03 por comentario |
 * | 7 | toda linha de metadado morre pelo `meta_id` | `:3937`-`:3942` | `postmeta` | 1 + 2 por linha |
 *
 * E depois: as acoes `delete_post_{tipo}` e `delete_post` (`:3956`, `:3967`), o
 * `DELETE` da linha (`:3969`), as acoes `deleted_post_{tipo}` e `deleted_post`
 * (`:3985`, `:3996`), a limpeza de cache (`:3998`, inexistente nesta arvore), o
 * cancelamento do agendamento de publicacao futura (`:4006`) e `after_delete_post`
 * (`:4019`).
 *
 * ## Cinco coisas nesta ordem que um porte troca sem perceber
 *
 * 1. **Nao ha transacao, e a interrupcao no meio e comportamento.**
 *    BR-MIGRAR-104 mede **zero** `START TRANSACTION` em 1.467 arquivos.
 *    Interrompida na terceira etapa, a exclusao deixa os filhos ja
 *    reposicionados e o resto de pe — e PT-003 tem cenario `@critico` para
 *    exatamente isso (*"interromper a exclusao no meio deixa o MESMO estado
 *    parcial nas duas metades"*). Envolver as sete etapas numa transacao apagaria
 *    o cenario.
 * 2. **O `DELETE` da linha e o OITAVO comando, nao o primeiro.** Quando ele
 *    falha (`:3970`), as sete etapas **ja aconteceram e nao sao desfeitas**: o
 *    conteudo fica sem comentario, sem metadado, sem vinculo de termo e com os
 *    filhos ja no avo. E o desfecho {@link DesfechoDaExclusao} `nao-apagado`.
 * 3. **A etapa 4 e recursiva, e passa por esta mesma funcao.** O legado o diz na
 *    linha de cima: *"Use wp_delete_post (via wp_delete_post_revision) again.
 *    Ensures any meta/misplaced data gets cleaned up"* (`:3917`). Cada versao
 *    anterior roda as sete etapas dela — inclusive o `UPDATE` de anexos da etapa
 *    5, que sai **tambem para cada versao**. Um porte que apagasse as versoes com
 *    um `DELETE ... WHERE post_parent = ? AND post_type = 'revision'` emitiria
 *    **um** comando no lugar de dezenas e deixaria o metadado das versoes orfao.
 * 4. **Os dois desvios vem antes do filtro.** Interceptador de `pre_delete_post`
 *    nunca ve um pedido que virou descarte nem um pedido de anexo.
 * 5. **A etapa 1 apaga por chave e a etapa 7 apaga por linha.** Os dois
 *    marcadores de lixeira, portanto, passam **duas vezes** pelo caminho: na
 *    primeira etapa por `delete_post_meta()` e na setima junto com todo o resto
 *    — onde ja nao existem. Nao e redundancia a limpar: sao sequencias de
 *    comandos diferentes, e a area 3 da Decisao 2 compara a sequencia.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao apaga midia.** O desvio de `:3858` delega, e a **resposta 9** de
 *   `questions.md` ja decidiu o comportamento: apagar midia e definitivo, sem
 *   lixeira e sem aviso (REQ-051 `bloqueado`). Ver
 *   {@link ExclusaoDeAnexoNaExclusao}.
 * - **Nao recalcula contador de termo nem de comentario.** Os tres contadores
 *   desnormalizados (`DB-TRG1`, `DB-TRG2`) sao de BC-02 e BC-03 e chegam de
 *   dentro das colaboracoes das etapas 2 e 6 — o cenario dos *"tres contadores"*
 *   de PT-003 se confere do lado deles.
 * - **Nao avisa ninguem.** Nenhuma confirmacao e pedida em nenhuma superficie de
 *   conteudo antes desta operacao: e o que CA-4.2 afirma, em
 *   `../descarte/aviso-de-exclusao-definitiva.ts`.
 * - **Nao limpa cache** (`:3998`-`:4004`): nao ha cache de objeto nesta arvore,
 *   e a borda 5 de `target_architecture.md` manda mante-lo desligado nas duas
 *   metades durante a coexistencia.
 */

import { lixeiraEstaLigada } from '../configuracao/index.js';
import {
  descartarParaALixeira,
  ESTADO_DE_LIXEIRA,
  type ExclusaoDefinitivaNoDescarte,
  type ResultadoDoDescarte,
} from '../descarte/index.js';
import {
  criarComandosDaExclusao,
  TIPO_DE_ANEXO,
  type RegistroNaExclusao,
} from './comandos-da-exclusao.js';
import type { ContextoDeExclusao } from './contexto-de-exclusao.js';
import {
  autorizarExclusao,
  type RecusaDaExclusao,
} from './permissao-de-exclusao.js';
import {
  reposicionarAnexosNoAvo,
  reposicionarFilhosNoAvo,
  type ReposicionamentoDeFilhos,
} from './reposicionamento-no-avo.js';

/**
 * Os **dois** tipos que o legado manda para a lixeira quando ninguem pediu forca
 * (`wp-includes/post.php:3852`).
 *
 * ⚠️ **A lista e literal e fechada, e isso tem consequencia:** um tipo de
 * terceiro — mesmo um que declare `'supports' => trash` ou que apareca na
 * lixeira do painel — pedido sem forca vai **direto** para a exclusao
 * definitiva. A lixeira do legado e privilegio de `post` e `page`, cravado em
 * duas cadeias.
 */
export const TIPOS_COM_DESVIO_PARA_A_LIXEIRA: readonly string[] = [
  'post',
  'page',
];

/**
 * O texto de `_doing_it_wrong()` quando o identificador nao e maior que zero
 * (`wp-includes/post.php:3839`), com a versao `6.9.0` que o acompanha.
 *
 * **E aviso, nao excecao**, e o retorno e `false` — P7: *"preserve o modo de
 * falha, inclusive o silencio"*. Fica como valor no resultado para que a borda
 * seja afirmavel sem que nada no fluxo dependa de ter sido escrito.
 */
export const MENSAGEM_DE_USO_INDEVIDO = 'The post ID must be greater than 0.';

/** O que aconteceu. Oito desfechos, e **nenhum deles e excecao**. */
export type DesfechoDaExclusao =
  /** A linha morreu, e as sete etapas rodaram antes. */
  | 'apagado'
  /**
   * `$post_id <= 0`: `_doing_it_wrong` e `false`, **sem emitir comando**
   * (`:3838`).
   */
  | 'identificador-invalido'
  /** O `SELECT *` nao achou a linha: retorno silencioso (`:3845`). */
  | 'inexistente'
  /** O desvio de `:3851` levou o pedido para a lixeira. O resultado dela viaja. */
  | 'descartado-para-a-lixeira'
  /** O desvio de `:3858`: era anexo, e quem decide e `wp_delete_attachment()`. */
  | 'anexo'
  /** O filtro `pre_delete_post` devolveu valor e nada aconteceu (`:3872`). */
  | 'interceptado'
  /**
   * O `DELETE` da linha nao afetou linha nenhuma (`:3970`). ⚠️ **As sete etapas
   * ja aconteceram** — ver o item 2 do cabecalho.
   */
  | 'nao-apagado'
  /** Sem `delete_post` daquele conteudo, na superficie que pergunta. */
  | 'recusado';

/** O que a exclusao devolve. */
export interface ResultadoDaExclusao {
  readonly desfecho: DesfechoDaExclusao;
  /** A recusa de permissao, ou `null`. Preenchida **so** no desfecho `recusado`. */
  readonly recusa: RecusaDaExclusao | null;
  /**
   * A linha lida no passo 1, ou `null`.
   *
   * ⚠️ **E o registro como ele era**, inclusive o `paiId` que virou o pai dos
   * filhos. `wp_delete_post()` termina em `return $post` (`:4021`) com esse mesmo
   * objeto: quem chama e le o retorno ve o conteudo que **nao existe mais**, e e
   * assim que a API REST monta o campo `previous` da resposta de exclusao
   * (`class-wp-rest-posts-controller.php:1136`).
   */
  readonly registro: RegistroNaExclusao | null;
  /** O texto de `_doing_it_wrong`, so no desfecho `identificador-invalido`. */
  readonly usoIndevido: string | null;
  /** O resultado do descarte, so no desfecho `descartado-para-a-lixeira`. */
  readonly descarte: ResultadoDoDescarte | null;
  /** O que `wp_delete_attachment()` devolveu, so no desfecho `anexo`. */
  readonly anexoApagado: boolean | null;
  /** O que o filtro devolveu, so no desfecho `interceptado`. */
  readonly interceptacao: boolean | null;
  /** **CA-8.1**: a terceira etapa. `null` quando a cascata nao chegou nela. */
  readonly filhos: ReposicionamentoDeFilhos | null;
  /**
   * **CA-8.2**: as linhas que o `UPDATE` de anexos afetou, e `null` quando a
   * cascata nao chegou na quinta etapa.
   *
   * `0` significa *"o comando saiu e nao achou anexo"*, que e diferente de
   * `null`.
   */
  readonly anexosReposicionados: number | null;
  /** **CA-8.3**: as versoes que a leitura de `:3913` encontrou. */
  readonly versoesEncontradas: readonly number[];
  /** **CA-8.3**: as versoes cuja exclusao em cascata terminou em `apagado`. */
  readonly versoesApagadas: readonly number[];
  /** Os comentarios lidos em `:3927`, na ordem decrescente do legado. */
  readonly comentariosApagados: readonly number[];
  /** As linhas de `{site}postmeta` apagadas pelo `meta_id` (etapa 7). */
  readonly linhasDeMetadadoApagadas: readonly number[];
  /** Linhas que o `DELETE` da linha afetou, ou `null` se ele nao saiu. */
  readonly linhasApagadas: number | null;
}

/** Quem se apaga, e com qual sinalizador. */
export interface PedidoDeExclusao {
  readonly conteudoId: number;
  /**
   * O `$force_delete` de `wp_delete_post()`.
   *
   * **E obrigatorio de proposito**, porque as superficies do legado passam
   * valores diferentes e a diferenca e observavel:
   *
   * | superficie | o que passa | consequencia |
   * |---|---|---|
   * | painel, acao `delete` | `true` (`wp-admin/post.php:336`) | apaga mesmo com lixeira ligada |
   * | API REST, `DELETE` com `force=true` | `true` (`class-wp-rest-posts-controller.php:1137`) | idem |
   * | XML-RPC `wp.deletePost` | **nada**, isto e `false` (`class-wp-xmlrpc-server.php:1886`) | **o cliente pede exclusao e recebe lixeira** |
   * | coleta da lixeira (US-5) | `true` (`wp-includes/functions.php:6993`) | o vencido morre |
   * | `wp_trash_post()` sem lixeira | `true` (`:4086`) | CA-4.1 |
   *
   * Um default aqui esconderia a terceira linha, que e a unica em que o nome da
   * operacao e o desfecho dela nao coincidem.
   */
  readonly forcar: boolean;
}

const SEM_CASCATA = {
  recusa: null,
  registro: null,
  usoIndevido: null,
  descarte: null,
  anexoApagado: null,
  interceptacao: null,
  filhos: null,
  anexosReposicionados: null,
  versoesEncontradas: [],
  versoesApagadas: [],
  comentariosApagados: [],
  linhasDeMetadadoApagadas: [],
  linhasApagadas: null,
} as const;

/**
 * **A operacao de US-8.** Apaga o conteudo, exigindo `delete_post` daquele
 * registro — a acao `delete` do painel (`wp-admin/post.php:316`-`:340`).
 *
 * **Permissao exigida: `delete_post` do conteudo**, a **mesma** que o descarte
 * pergunta: no legado nao existe capacidade separada para a exclusao
 * irreversivel. Ver `permissao-de-exclusao.ts`.
 *
 * A ordem dos tres passos e a do painel, e ela importa:
 *
 * 1. **ler o conteudo** — o painel recusa com **410** (*"This item has already
 *    been deleted."*) antes de perguntar capacidade (`:319`-`:321`). Sem linha
 *    nao ha o que apagar, e a autorizacao negaria de todo modo: objeto
 *    inexistente devolve `do_not_allow` (BR-MIGRAR-091);
 * 2. **perguntar a capacidade** (`:328`);
 * 3. **apagar**, que e `wp_delete_post()` inteira.
 *
 * ⚠️ **O passo 3 recebe o IDENTIFICADOR, e nao o registro ja lido.** No legado o
 * painel chama `wp_delete_post( $post_id, true )` com um inteiro e a funcao **le
 * de novo** (`:3843`) — logo, sem cache de objeto, saem **duas** leituras da
 * mesma linha, e elas nao sao a mesma consulta: a do painel e `get_post()` e a
 * de dentro e `SELECT *` cru. Passar o registro aqui economizaria uma consulta
 * que o legado faz, e a contagem de comandos e o que a area 3 da Decisao 2
 * compara. E a mesma divergencia de cache que T003 declarou.
 */
export function apagarEmDefinitivo(
  contexto: ContextoDeExclusao,
  pedido: PedidoDeExclusao,
): ResultadoDaExclusao {
  // Passo 1: a leitura da superficie — `get_post()`, por ligacao tardia
  // (`wp-admin/post.php:319`).
  const conteudo = contexto.conteudo.obterPorId(pedido.conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_CASCATA };
  }

  // Passo 2: `current_user_can( 'delete_post', $post_id )` (`:328`).
  const recusa = autorizarExclusao(contexto, pedido.conteudoId);
  if (recusa !== null) {
    return { desfecho: 'recusado', ...SEM_CASCATA, recusa };
  }

  // Passo 3: `wp_delete_post( $post_id, $force )`, com o identificador.
  return apagarConteudo(contexto, pedido.conteudoId, pedido.forcar);
}

/**
 * `wp_delete_post()` — a exclusao, **sem portao de capacidade**
 * (`wp-includes/post.php:3834`).
 *
 * Exportada porque e **superficie publicada** (P8) e porque no legado ela tem
 * chamadores que nao sao superficie com ator: `wp_trash_post()` quando nao ha
 * lixeira (`:4086`), `wp_delete_post_revision()` (`wp-includes/revision.php:638`)
 * e a coleta da lixeira (`wp-includes/functions.php:6993`, US-5). Quem a chama
 * direto esta no mesmo lugar em que uma extensao do legado esta: sem verificacao,
 * por desenho.
 *
 * Os desvios e as sete etapas estao na tabela do cabecalho deste arquivo.
 */
export function apagarConteudo(
  contexto: ContextoDeExclusao,
  conteudoId: number,
  forcar: boolean,
): ResultadoDaExclusao {
  // Passo 0 (`:3837`-`:3841`): `(int) $post_id` e a guarda. O aviso de uso
  // indevido nao interrompe nada no legado — ele escreve e a funcao devolve
  // `false`, sem comando nenhum.
  const id = Number.isFinite(conteudoId) ? Math.trunc(conteudoId) : 0;
  if (id <= 0) {
    return {
      desfecho: 'identificador-invalido',
      ...SEM_CASCATA,
      usoIndevido: MENSAGEM_DE_USO_INDEVIDO,
    };
  }

  const comandos = criarComandosDaExclusao(contexto.dados);

  // Passo 1 (`:3843`): o `SELECT *` cru. Sem linha, silencio (P7): o legado
  // devolve o proprio `$post` nulo, sem erro e sem mensagem.
  const registro = comandos.lerRegistro(id);
  if (registro === null) {
    return { desfecho: 'inexistente', ...SEM_CASCATA };
  }

  // Passo 2 (`:3851`-`:3856`): o desvio para a lixeira, com o curto-circuito do
  // `&&` preservado — a leitura do estado **so** acontece quando nao ha forca e
  // o tipo e `post` ou `page`, e o prazo so e consultado depois dela.
  if (!forcar && TIPOS_COM_DESVIO_PARA_A_LIXEIRA.includes(registro.tipo)) {
    // `get_post_status( $post_id )` (`:3853`) e a leitura **filtrada**, de
    // BC-01, e nao a coluna que acabou de ser lida: num anexo ela resolveria o
    // estado pelo pai, e o ponto de extensao `post_status` pode troca-la. Linha
    // ausente devolve `false` no legado, e `'trash' !== false` e verdadeiro.
    const estadoFiltrado = contexto.conteudo.obterPorId(id)?.estado ?? null;
    if (
      estadoFiltrado !== ESTADO_DE_LIXEIRA &&
      lixeiraEstaLigada(contexto.prazoDeRetencao)
    ) {
      return {
        desfecho: 'descartado-para-a-lixeira',
        ...SEM_CASCATA,
        registro,
        descarte: descartarParaALixeira(contexto, id),
      };
    }
  }

  // Passo 3 (`:3858`-`:3860`): anexo e outra funcao, e outra feature. A
  // **resposta 9** ja decidiu o que ela faz.
  if (registro.tipo === TIPO_DE_ANEXO) {
    return {
      desfecho: 'anexo',
      ...SEM_CASCATA,
      registro,
      anexoApagado: contexto.exclusaoDeAnexo(id, forcar),
    };
  }

  // Passo 4 (`:3871`): o unico ponto deste caminho que muda o resultado, e ele
  // vem **depois** dos dois desvios.
  const interceptacao =
    contexto.ganchos?.filtrarExclusao?.(null, registro, forcar) ?? null;
  if (interceptacao !== null) {
    return {
      desfecho: 'interceptado',
      ...SEM_CASCATA,
      registro,
      interceptacao,
    };
  }

  // Passo 5 (`:3887`): a acao antes da primeira etapa. E aqui que o nucleo zera
  // as opcoes de pagina inicial e de politica de privacidade — ver o 🔴 de
  // `GanchosDaExclusao`.
  contexto.ganchos?.antesDaExclusao?.(id, registro);

  // ── As sete etapas ────────────────────────────────────────────────────────

  // Etapa 1 (`:3889`-`:3890`): os dois marcadores, por **chave**, na ordem
  // estado e depois instante. Sao os mesmos que T003 grava.
  const marcadores = contexto.armazenamento.marcadoresDoConteudo;
  marcadores.apagarEstadoAnterior(id);
  marcadores.apagarInstanteDoDescarte(id);

  // Etapa 2 (`:3892`): os vinculos de termo das taxonomias **do tipo**. As duas
  // colaboracoes com BC-02 numa linha, como no legado.
  contexto.classificacao.removerVinculosDeTermo(
    id,
    contexto.classificacao.taxonomiasDoTipo(registro.tipo),
  );

  // Etapa 3 (`:3897`-`:3910`): **CA-8.1**.
  const filhos = reposicionarFilhosNoAvo(contexto, comandos, registro);

  // Etapa 4 (`:3913`-`:3920`): **CA-8.3**, e e recursiva.
  const versoesEncontradas = comandos.listarVersoes(id);
  const versoesApagadas: number[] = [];
  for (const versaoId of versoesEncontradas) {
    if (apagarVersao(contexto, versaoId)) {
      versoesApagadas.push(versaoId);
    }
  }

  // Etapa 5 (`:3923`): **CA-8.2**. Um comando, sempre — sem leitura antes e sem
  // condicao de tipo.
  const anexosReposicionados = reposicionarAnexosNoAvo(comandos, registro);

  // Etapa 6 (`:3925`-`:3935`): os comentarios, com a contagem adiada em volta.
  contexto.comentarios.adiarContagem(true);
  const comentariosApagados = comandos.listarComentarios(id);
  for (const comentarioId of comentariosApagados) {
    // `wp_delete_comment( $comment_id, true )`: **sempre com forca**, mesmo com
    // a lixeira ligada.
    contexto.comentarios.apagarComentario(comentarioId);
  }
  contexto.comentarios.adiarContagem(false);

  // Etapa 7 (`:3937`-`:3942`): toda linha de metadado, pelo `meta_id`.
  const linhasDeMetadado = comandos.listarLinhasDeMetadado(id);
  const linhasDeMetadadoApagadas: number[] = [];
  for (const metaId of linhasDeMetadado) {
    if (comandos.apagarLinhaDeMetadado(metaId)) {
      linhasDeMetadadoApagadas.push(metaId);
    }
  }

  const cascata = {
    registro,
    filhos,
    anexosReposicionados,
    versoesEncontradas,
    versoesApagadas,
    comentariosApagados,
    linhasDeMetadadoApagadas,
  } as const;

  // (`:3956`, `:3967`): as duas acoes com a linha **ainda de pe** e as
  // dependencias ja mortas. O nome da primeira carrega o tipo.
  contexto.ganchos?.antesDeApagarALinhaDoTipo?.(id, registro);
  contexto.ganchos?.antesDeApagarALinha?.(id, registro);

  // (`:3969`-`:3971`): o oitavo comando, e a verdade de PHP sobre o retorno de
  // `$wpdb->delete()` — `0` e falha. As sete etapas **nao sao desfeitas**.
  const linhasApagadas = comandos.apagarRegistro(id);
  if (linhasApagadas === 0) {
    return {
      desfecho: 'nao-apagado',
      ...SEM_CASCATA,
      ...cascata,
      linhasApagadas,
    };
  }

  // (`:3985`, `:3996`): as duas acoes de depois.
  contexto.ganchos?.depoisDeApagarALinhaDoTipo?.(id, registro);
  contexto.ganchos?.depoisDeApagarALinha?.(id, registro);

  // (`:3998`-`:4004`): `clean_post_cache()` do registro e de cada filho lido na
  // etapa 3. Sem cache de objeto nesta arvore — ver o cabecalho.

  // (`:4006`): o agendamento de publicacao futura, **depois** do `DELETE`.
  contexto.limparPublicacaoAgendada(id);

  // (`:4019`): o ultimo ponto, e so entao `return $post`.
  contexto.ganchos?.aoFimDaExclusao?.(id, registro);

  return {
    desfecho: 'apagado',
    ...SEM_CASCATA,
    ...cascata,
    linhasApagadas,
  };
}

/**
 * `wp_delete_post_revision( $revision_id )` — a quarta etapa, uma versao por
 * vez (`wp-includes/revision.php:631`).
 *
 * Tres passos, e o primeiro e um portao: `wp_get_post_revision()` devolve `null`
 * para linha que nao e do tipo `revision`, e nesse caso **nada acontece**.
 * Depois vem `wp_delete_post( $revision->ID )` — **sem forca**, e nao faz
 * diferenca, porque `revision` nao esta entre os dois tipos que desviam para a
 * lixeira — e, **so se ela deu certo**, a acao de mesmo nome da funcao (`:649`).
 *
 * Devolve se a versao foi apagada.
 *
 * ⚠️ **Uma versao cujo `post_parent` apontasse para ela mesma faria esta
 * recursao nao terminar**, no legado como aqui: a leitura de `:3913` a
 * devolveria de novo a cada volta. O legado nao tem guarda, e acrescentar uma
 * aqui seria divergir do observavel (P1) — o estado nao e alcancavel pelos
 * caminhos de escrita de versao, que gravam o pai como o conteudo versionado.
 */
function apagarVersao(
  contexto: ContextoDeExclusao,
  versaoId: number,
): boolean {
  const versao = contexto.versoes.obterVersao(versaoId);
  if (versao === null) {
    return false;
  }

  const resultado = apagarConteudo(contexto, versao.id, false);
  const apagada = resultado.desfecho === 'apagado';

  if (apagada) {
    contexto.ganchos?.depoisDeApagarVersao?.(versao.id, versao);
  }

  return apagada;
}

/**
 * O resultado **como o chamador do legado o ve**: um booleano.
 *
 * `wp_delete_post()` devolve `WP_Post|false|null`, e as tres superficies do
 * legado colapsam os tres com `if ( ! $result )` — o painel
 * (`wp-admin/post.php:336`), a API REST
 * (`class-wp-rest-posts-controller.php:1176`) e o XML-RPC
 * (`class-wp-xmlrpc-server.php:1888`). Esta funcao e esse colapso, e e ela que
 * faz a ponte com {@link ExclusaoDefinitivaNoDescarte}, que T003 declarou como
 * booleano por este mesmo motivo.
 *
 * | desfecho | o que o legado devolve | booleano |
 * |---|---|---|
 * | `apagado` | `$post` | `true` |
 * | `identificador-invalido`, `inexistente`, `nao-apagado`, `recusado` | `false` ou `null` | `false` |
 * | `interceptado` | o valor do filtro | o valor do filtro |
 * | `anexo` | o retorno de `wp_delete_attachment()` | ele mesmo |
 * | `descartado-para-a-lixeira` | o retorno de `wp_trash_post()` | o dele, colapsado igual |
 */
export function apagadoNaVisaoDoChamador(
  resultado: ResultadoDaExclusao,
): boolean {
  switch (resultado.desfecho) {
    case 'apagado':
      return true;
    case 'interceptado':
      return resultado.interceptacao === true;
    case 'anexo':
      return resultado.anexoApagado === true;
    case 'descartado-para-a-lixeira':
      return descarteNaVisaoDoChamador(resultado.descarte);
    default:
      return false;
  }
}

/**
 * O mesmo colapso para o retorno de `wp_trash_post()`, que e o que o passo 2
 * devolve.
 *
 * `descartado` devolve `$post` (verdadeiro); `ja-na-lixeira` e `nao-gravado`
 * devolvem `false`; `inexistente` devolve `null`; `interceptado` devolve o valor
 * do filtro; e `apagado-em-definitivo` devolve o que a exclusao devolveu — que e
 * a volta da mesma recursao, e e por isso que este caso existe.
 */
function descarteNaVisaoDoChamador(
  descarte: ResultadoDoDescarte | null,
): boolean {
  if (descarte === null) {
    return false;
  }
  switch (descarte.desfecho) {
    case 'descartado':
      return true;
    case 'interceptado':
      return descarte.interceptacao === true;
    case 'apagado-em-definitivo':
      return descarte.apagadoEmDefinitivo === true;
    default:
      return false;
  }
}

/**
 * A ligacao tardia que T003 declarou, fechada: o
 * `wp_delete_post( $post_id, true )` a que a **primeira linha** do descarte
 * delega (`wp-includes/post.php:4086`).
 *
 * ⚠️ **As duas funcoes do legado chamam uma a outra, e este helper e o ponto em
 * que o ciclo se fecha sem `import` circular**: `apagarConteudo()` chama
 * `descartarParaALixeira()` por `import` (passo 2, mesma pasta de modulo), e o
 * descarte chama a exclusao por **campo do contexto**. Nao ha recursao infinita
 * porque o desvio de `:3851` exige lixeira ligada e o de `:4085` exige lixeira
 * desligada: nenhuma instalacao satisfaz os dois.
 *
 * Quem compoe o contexto escreve:
 *
 * ```ts
 * const contexto: ContextoDeExclusao = {
 *   ...resto,
 *   exclusaoDefinitiva: (conteudoId) => exclusaoDefinitivaDe(contexto)(conteudoId),
 * };
 * ```
 */
export function exclusaoDefinitivaDe(
  contexto: ContextoDeExclusao,
): ExclusaoDefinitivaNoDescarte {
  return (conteudoId) =>
    apagadoNaVisaoDoChamador(apagarConteudo(contexto, conteudoId, true));
}
