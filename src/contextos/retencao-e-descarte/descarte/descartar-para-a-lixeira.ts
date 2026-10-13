/**
 * **US-1**: descartar conteudo para a lixeira guardando o estado anterior e o
 * instante.
 *
 * Entrega de **T003** da feature `005-retencao-e-descarte`. Sao duas funcoes, e
 * a diferenca entre elas e a razao de as duas existirem — a mesma divisao que
 * `conteudo/publicacao/publicar.ts` fez em BC-01:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link descartar} | a operacao *"descartar para a lixeira"* da tabela *Contratos* de `plan.md` — a superficie | **sim**, CA-1.3, CA-1.4 e CA-1.5 |
 * | {@link descartarParaALixeira} | `wp_trash_post()` (`wp-includes/post.php:4084`) | **nao**, e e assim no legado |
 *
 * **`wp_trash_post()` nao tem portao, e isso e superficie publicada.** Ela e
 * funcao publica do nucleo, chamada pelo painel, pela API REST, pelo XML-RPC e
 * por `wp_delete_post()` — e por qualquer extensao. Dar-lhe um portao de
 * capacidade fecharia o sistema mais que o legado. O **P4** cobra *"declarar
 * permissao explicita em toda operacao exposta"* **e** *"preservar o default de
 * cada camada, inclusive quando o default e permissivo"*: as duas funcoes juntas
 * sao exatamente isso — a operacao declara a capacidade, a funcao do legado
 * declara que nao tem nenhuma.
 *
 * ---
 *
 * # A sequencia, que e o que esta tarefa entrega
 *
 * Os doze passos de `wp_trash_post()`, na ordem, com o que cada um emite:
 *
 * | # | passo | linha | emite |
 * |---|---|---|---|
 * | 1 | sem lixeira, apaga em definitivo e **para** | `:4085`-`:4086` | a exclusao definitiva (T017) |
 * | 2 | le o conteudo; sem linha, retorno silencioso | `:4089`-`:4092` | uma leitura |
 * | 3 | ja esta na lixeira, devolve `false` | `:4095` | **nada** |
 * | 4 | guarda o estado anterior em memoria | `:4099` | — |
 * | 5 | o filtro `pre_trash_post`; valor nao nulo **para** | `:4111`-`:4115` | **nada** |
 * | 6 | a acao `wp_trash_post` | `:4126` | — |
 * | 7 | grava o estado anterior como metadado (CA-1.1) | `:4128` | um `INSERT` |
 * | 8 | grava o instante do descarte (CA-1.1) | `:4129` | um `INSERT`, e uma leitura do relogio |
 * | 9 | grava o estado `trash` (CA-1.2) | `:4131` | o caminho de gravacao de BC-01 |
 * | 10 | gravacao falhou, devolve `false` — **e os marcadores ficam** | `:4138` | nada a mais |
 * | 11 | suspende os comentarios (US-2, T005) | `:4142` | a cascata |
 * | 12 | a acao `trashed_post`, e devolve o conteudo | `:4153` | — |
 *
 * Tres coisas nesta ordem nao sao arbitrarias e um porte as troca sem perceber:
 *
 * 1. **O filtro vem antes de qualquer escrita.** Interceptador que cancela o
 *    descarte cancela um descarte que **nao comecou**: nenhum marcador, nenhuma
 *    mudanca de estado, nenhuma cascata e nem a acao do passo 6. Disparar o
 *    filtro depois do marcador daria a uma extensao o poder de abortar um
 *    descarte pela metade.
 * 2. **Os marcadores sao gravados ANTES do estado.** E o passo 10 que torna isso
 *    observavel: se a gravacao do estado falha, os dois marcadores **ficam** no
 *    banco e o conteudo **nao** esta na lixeira — exatamente o estado
 *    inconsistente que `R6` manda a coleta tolerar (US-7, *"apaga so o metadado
 *    e segue"*). Nao ha transacao para desfazer: BR-MIGRAR-104 mede **zero**
 *    `START TRANSACTION` em 1.467 arquivos, e o **P5** poe a cascata no contrato
 *    observavel. Um porte que envolvesse isto numa transacao apagaria a
 *    inconsistencia que a historia US-7 existe para tolerar.
 * 3. **A cascata de comentarios vem depois do estado e antes da ultima acao.**
 *    Quem escuta `trashed_post` ve os comentarios ja suspensos; quem escuta
 *    `wp_trash_post` nao ve nem o marcador.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao monta o `UPDATE` do estado.** `wp_trash_post()` chama
 *   `wp_update_post()`, que delega a `wp_insert_post()` — o caminho de gravacao
 *   de BC-01, com `post_modified` reescrito e os pontos de extensao da gravacao
 *   disparando. A analise esta no cabecalho de `contexto-de-descarte.ts`, e e a
 *   razao de o passo 9 ser ligacao tardia.
 * - **Nao suspende comentario.** O passo 11 e **T005** (US-2): o estado de cada
 *   comentario agrupado no marcador `_wp_trash_meta_comments_status` (CA-2.2) e
 *   todos levados a `post-trashed` (CA-2.1). A **posicao** da chamada e desta
 *   tarefa, e esta afirmada por teste.
 * - **Nao apaga em definitivo.** O passo 1 delega, e quem o implementa e
 *   **T017** (US-8), com o reparenteamento de filhos e anexos ao avo
 *   (`:3908`). O que a tela mostra antes desta operacao e **T009** (US-4), em
 *   `acoes-de-descarte-na-tela.ts`: o rotulo, a acao da rota e o `nonce`
 *   **mudam** quando a lixeira esta desligada. ⚠️ **A frase de UC-09 *"nada na
 *   tela distingue os dois"* nao se confirma na arvore, e T009 a corrigiu com
 *   `arquivo:linha`** (`wp-admin/includes/meta-boxes.php:365`,
 *   `class-wp-posts-list-table.php:1638`,
 *   `wp-includes/link-template.php:1577`). O que se confirma e a outra metade —
 *   *"o ator nao e avisado da diferenca"*: **nenhuma confirmacao e pedida**, e e
 *   isso que colide com CA-4.2 e deixa aquele criterio parado; ver a caixa de
 *   PARADA de `aviso-de-exclusao-definitiva.ts`.
 * - **Nao restaura.** `wp_untrash_post()` (`:4168`) e **T007** (US-3), e o que
 *   ela faz com os marcadores que esta operacao grava e o oposto na ordem
 *   inversa — ver a tabela de `armazenamento/marcadores-de-lixeira.ts`.
 * - **Nao varre o que venceu.** A comparacao de prazo e **T011**, com o operador
 *   estritamente menor; ver o 🔴 de `armazenamento/marcadores-de-lixeira.ts`.
 * - **Nao desvia anexo.** A lixeira de midia exige `MEDIA_TRASH`, que nasce
 *   `false`, e a **resposta 9** de `questions.md` ja decidiu manter a exclusao de
 *   midia definitiva, sem lixeira e sem aviso (REQ-051 `bloqueado`).
 * - **Nao conta comentario.** `wp_update_post()` nao recalcula `comment_count`, e
 *   o descarte nao mexe nele: o contador de um conteudo na lixeira continua
 *   contando os comentarios que acabaram de sair do ar (`DB-TRG1`).
 */

import { lixeiraEstaLigada } from '../configuracao/index.js';
import type {
  ContextoDeDescarte,
  RegistroNoDescarte,
} from './contexto-de-descarte.js';
import { ESTADO_DE_LIXEIRA } from './estado-de-lixeira.js';
import {
  autorizarDescarte,
  type RecusaDoDescarte,
} from './permissao-de-descarte.js';

/** O que aconteceu. Sete desfechos, e **nenhum deles e excecao**. */
export type DesfechoDoDescarte =
  /** O conteudo esta na lixeira, com os dois marcadores gravados. */
  | 'descartado'
  /**
   * Nao havia lixeira: a primeira linha apagou em definitivo
   * (`R1`/BR-MIGRAR-030, `:4085`). O ator **nao** foi avisado da diferenca, e e
   * assim no legado — US-4 / T009.
   */
  | 'apagado-em-definitivo'
  /** `get_post()` nao achou a linha: retorno silencioso do legado (`:4091`). */
  | 'inexistente'
  /** Ja estava na lixeira: `false`, sem emitir comando nenhum (`:4095`). */
  | 'ja-na-lixeira'
  /** O filtro `pre_trash_post` devolveu valor e o descarte nao comecou (`:4113`). */
  | 'interceptado'
  /**
   * A gravacao do estado falhou (`:4138`). ⚠️ **Os dois marcadores ficam
   * gravados** — ver o item 2 do cabecalho.
   */
  | 'nao-gravado'
  /** Sem `delete_post` daquele conteudo: CA-1.3, CA-1.4 ou CA-1.5. */
  | 'recusado';

/** O que a operacao devolve. */
export interface ResultadoDoDescarte {
  readonly desfecho: DesfechoDoDescarte;
  /** A recusa de permissao, ou `null`. Preenchida **so** no desfecho `recusado`. */
  readonly recusa: RecusaDoDescarte | null;
  /**
   * O conteudo **como o legado o devolve**, ou `null`.
   *
   * ⚠️ **Ele carrega o estado ANTERIOR, nao `trash`.** `wp_trash_post()`
   * termina em `return $post` (`:4155`), e `$post` e o registro lido no passo 2:
   * nada no caminho repassa o estado novo ao objeto em memoria. Logo quem chama
   * a operacao e le o estado do retorno, sem reconsultar, ve o conteudo como ele
   * era antes — e e isso que a API REST contorna reconsultando com
   * `get_post( $id )` depois (`class-wp-rest-posts-controller.php:1171`). E
   * observavel por extensao, e esta reproduzido.
   */
  readonly conteudo: RegistroNoDescarte | null;
  /**
   * **CA-1.1**, primeira metade: `$previous_status` (`:4099`) — o estado que
   * foi gravado no marcador `_wp_trash_meta_status`.
   */
  readonly estadoAnterior: string | null;
  /**
   * **CA-1.1**, segunda metade: o `time()` que foi gravado no marcador
   * `_wp_trash_meta_time` (`:4129`), em segundos inteiros.
   *
   * E este numero que a coleta de T011 compara com `meta_value < %d`, e e por
   * isso que ele sai no resultado: sem ele, a borda de UT-052-2 nao tem como ser
   * montada por quem testa.
   */
  readonly instanteDoDescarte: number | null;
  /** **CA-1.2**: `trash`, o estado gravado, ou `null` quando nada foi gravado. */
  readonly estadoGravado: string | null;
  /**
   * O que o filtro `pre_trash_post` devolveu, ou `null` quando ele nao
   * interceptou.
   *
   * No legado este valor **e** o retorno de `wp_trash_post()` (`:4114`), e por
   * isso ele viaja: a extensao que intercepta decide o que o chamador recebe.
   */
  readonly interceptacao: boolean | null;
  /**
   * Se a exclusao definitiva do passo 1 apagou a linha, ou `null` quando ela
   * nao foi acionada (isto e, quando havia lixeira).
   */
  readonly apagadoEmDefinitivo: boolean | null;
}

/** Quem se descarta. */
export interface PedidoDeDescarte {
  readonly conteudoId: number;
}

const SEM_DESCARTE = {
  recusa: null,
  conteudo: null,
  estadoAnterior: null,
  instanteDoDescarte: null,
  estadoGravado: null,
  interceptacao: null,
  apagadoEmDefinitivo: null,
} as const;

/**
 * **A operacao de US-1.** Descarta o conteudo, exigindo `delete_post` daquele
 * registro.
 *
 * **Permissao exigida: `delete_post` do conteudo** — a meta-capacidade com o
 * objeto, resolvida por autoria e estado (CA-1.3), negada sobre versao anterior
 * (CA-1.4) e trocada ou somada nas paginas de funcao especial (CA-1.5). A
 * decisao esta em `permissao-de-descarte.ts`, que **pergunta** em lugar de
 * cravar a regra.
 *
 * A ordem dos tres passos e a das superficies do legado
 * (`wp-admin/post.php:250`-`:274`, `class-wp-rest-posts-controller.php:1065`), e
 * ela importa:
 *
 * 1. **ler o conteudo.** O painel recusa com **410** o que nao existe mais
 *    *antes* de perguntar capacidade (`:253`), e a API resolve a linha na guarda
 *    de rota (`:1066`). Sem linha nao ha o que descartar — e a autorizacao
 *    negaria de todo modo, porque objeto inexistente devolve `do_not_allow`
 *    (BR-MIGRAR-091);
 * 2. **perguntar a capacidade** (CA-1.3, CA-1.4, CA-1.5);
 * 3. **descartar**, que e `wp_trash_post()` inteira.
 *
 * ⚠️ **O passo 3 recebe o IDENTIFICADOR, e nao o registro ja lido, de
 * proposito.** No legado as tres superficies chamam `wp_trash_post( $post_id )`
 * com um inteiro, e a funcao **le de novo** (`:4089`) — logo sem cache de objeto
 * saem **duas** leituras da mesma linha. Passar o registro aqui economizaria uma
 * consulta que o legado faz, e a contagem de comandos e o que a area 3 da
 * Decisao 2 compara. E a mesma divergencia de cache que o README deste modulo ja
 * declarou: REQ-165 ficou fora do pacote e a borda 5 de
 * `target_architecture.md` manda o cache **desligado nas duas metades** durante
 * a coexistencia.
 */
export function descartar(
  contexto: ContextoDeDescarte,
  pedido: PedidoDeDescarte,
): ResultadoDoDescarte {
  // Passo 1: a leitura da superficie (`wp-admin/post.php:253`).
  const conteudo = contexto.conteudo.obterPorId(pedido.conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_DESCARTE };
  }

  // Passo 2: CA-1.3, CA-1.4 e CA-1.5.
  const recusa = autorizarDescarte(contexto, pedido.conteudoId);
  if (recusa !== null) {
    return { desfecho: 'recusado', ...SEM_DESCARTE, recusa, conteudo };
  }

  // Passo 3: `wp_trash_post( $post_id )`, com o identificador — ver o ⚠️.
  return descartarParaALixeira(contexto, pedido.conteudoId);
}

/**
 * `wp_trash_post()` — o descarte, **sem portao de capacidade**
 * (`wp-includes/post.php:4084`).
 *
 * Exportada porque e **superficie publicada** (P8) e porque ela tem, no legado,
 * um chamador que nao e superficie com ator: `wp_delete_post()` desvia para ca
 * quando nao ha forca, o tipo e `post` ou `page` e ha lixeira
 * (`:3851`-`:3856`). Quem chama esta funcao direto esta no mesmo lugar em que
 * uma extensao do legado esta: sem verificacao, por desenho.
 *
 * Os doze passos estao na tabela do cabecalho deste arquivo.
 */
export function descartarParaALixeira(
  contexto: ContextoDeDescarte,
  conteudoId: number,
): ResultadoDoDescarte {
  // Passo 1 (`:4085`): a primeira linha, e ela decide tudo. `R1`/BR-MIGRAR-030
  // — prazo zero nao e "lixeira vazia", e "nao ha lixeira": o mesmo pedido
  // passa a apagar em definitivo. Valor NEGATIVO nao desliga, porque em PHP
  // `! -1` e falso; ver `configuracao/prazo-de-retencao.ts`.
  if (!lixeiraEstaLigada(contexto.prazoDeRetencao)) {
    return {
      desfecho: 'apagado-em-definitivo',
      ...SEM_DESCARTE,
      apagadoEmDefinitivo: contexto.exclusaoDefinitiva(conteudoId),
    };
  }

  // Passo 2 (`:4089`): a segunda leitura da mesma linha. Sem linha, silencio
  // (P7): o legado devolve o proprio `$post` nulo, sem erro.
  const conteudo = contexto.conteudo.obterPorId(conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_DESCARTE };
  }

  // Passo 3 (`:4095`): ja na lixeira e `false`, e **nada e emitido**. E por
  // causa desta guarda que o conteudo nunca grava marcador duas vezes — e e a
  // diferenca em relacao ao comentario, que apaga os marcadores antes de
  // gravar porque pode chegar da caixa de spam com eles (ver a tabela de
  // `armazenamento/marcadores-de-lixeira.ts`).
  if (conteudo.estado === ESTADO_DE_LIXEIRA) {
    return { desfecho: 'ja-na-lixeira', ...SEM_DESCARTE, conteudo };
  }

  // Passo 4 (`:4099`).
  const estadoAnterior = conteudo.estado;

  // Passo 5 (`:4111`): o unico ponto deste caminho que muda o resultado.
  const interceptacao =
    contexto.ganchos?.filtrarDescarte?.(null, conteudo, estadoAnterior) ?? null;
  if (interceptacao !== null) {
    return {
      desfecho: 'interceptado',
      ...SEM_DESCARTE,
      conteudo,
      estadoAnterior,
      interceptacao,
    };
  }

  // Passo 6 (`:4126`): a acao de mesmo nome da funcao, antes de qualquer
  // escrita.
  contexto.ganchos?.antesDeDescartar?.(conteudoId, estadoAnterior);

  // Passo 7 (`:4128`): CA-1.1, o estado anterior. `add_post_meta()` sem
  // `$unique`: insercao, sempre.
  const marcadores = contexto.armazenamento.marcadoresDoConteudo;
  marcadores.acrescentarEstadoAnterior(conteudoId, estadoAnterior);

  // Passo 8 (`:4129`): CA-1.1, o instante. O relogio e lido **aqui**, depois do
  // primeiro `INSERT`, porque no legado `time()` e o argumento da segunda
  // chamada — a ordem das duas escritas e dos efeitos entre elas e observavel.
  const instanteDoDescarte = contexto.relogio.agoraEmSegundos();
  marcadores.acrescentarInstanteDoDescarte(conteudoId, instanteDoDescarte);

  // Passo 9 (`:4131`): CA-1.2, o estado `trash` pelo caminho de gravacao de
  // BC-01. Ver a secao da descoberta em `contexto-de-descarte.ts`.
  const gravado = contexto.conteudo.gravarEstado(conteudoId, ESTADO_DE_LIXEIRA);

  // Passo 10 (`:4138`): a verdade de PHP sobre o retorno — `0` e falha. Os dois
  // marcadores do passo 7 e do passo 8 **permanecem gravados**, e e esse o
  // estado que `R6` manda a coleta tolerar (US-7). Nao ha transacao.
  if (gravado === 0) {
    return {
      desfecho: 'nao-gravado',
      ...SEM_DESCARTE,
      conteudo,
      estadoAnterior,
      instanteDoDescarte,
    };
  }

  // Passo 11 (`:4142`): o passo 5 de UC-09, que e US-2 / T005. O retorno e
  // ignorado no legado, e nenhum ramo depende dele.
  contexto.suspenderComentarios(conteudoId);

  // Passo 12 (`:4153`): a ultima acao, com os comentarios ja suspensos.
  contexto.ganchos?.depoisDeDescartar?.(conteudoId, estadoAnterior);

  return {
    desfecho: 'descartado',
    recusa: null,
    // `return $post` (`:4155`): o registro do passo 2, com o estado ANTERIOR.
    // Ver o ⚠️ de `ResultadoDoDescarte.conteudo`.
    conteudo,
    estadoAnterior,
    instanteDoDescarte,
    estadoGravado: ESTADO_DE_LIXEIRA,
    interceptacao: null,
    apagadoEmDefinitivo: null,
  };
}
