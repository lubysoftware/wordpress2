/**
 * `wp_scheduled_delete()` — a coleta do que venceu na lixeira
 * (`wp-includes/functions.php:6974`).
 *
 * Entrega de **T011** (US-5): *"apagar conteudo vencido da lixeira por rotina
 * que nao depende de visita ao painel"*. Dos cinco criterios da historia, este
 * arquivo satisfaz **CA-5.2**, **CA-5.3** e **CA-5.4**; **CA-5.1** e **CA-5.5**
 * nao estao fechados e o motivo de cada um esta na secao 🔴 ao fim deste
 * cabecalho e em `../README.md`.
 *
 * ## Os nove passos, na ordem do legado
 *
 * | # | linha | o que acontece |
 * |---|---|---|
 * | 1 | `:6977` | `time()` **uma vez**, e `$delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )` |
 * | 2 | `:6979` | varre `{site}postmeta` por `meta_value < %d` — **CA-5.2** |
 * | 3 | `:6982` | `(int)` em cada identificador |
 * | 4 | `:6983` | identificador `0` e **saltado**, sem ler e sem apagar |
 * | 5 | `:6987` | `get_post( $post_id )` — a segunda leitura, por registro |
 * | 6 | `:6989` | **ou** so os dois marcadores sao apagados (`R6`), **ou** `wp_delete_post()` |
 * | 7 | `:6997` | varre `{site}commentmeta` pelo **mesmo** instante limite — **CA-5.3** |
 * | 8 | `:7000`-`:7005` | o mesmo `(int)`, o mesmo salto do zero, `get_comment()` |
 * | 9 | `:7007` | o mesmo ramo, com a ordem dos dois marcadores **invertida** |
 *
 * **T015** (US-7) acrescentou **CA-7.3** nos passos 6 e 9, como registro so de
 * escrita (`registro-de-inconsistencia.ts`): sem comando pela porta de dados, sem
 * ramo novo e sem efeito quando a colaboracao falta. Os passos continuam nove.
 *
 * ## Sete coisas que sao comportamento, e nao estilo
 *
 * 1. ⚠️ **O relogio e lido UMA vez, no passo 1.** As duas varreduras comparam o
 *    **mesmo** instante limite. Uma coleta que recalculasse `time()` antes do
 *    passo 7 moveria a propria borda no meio da execucao, e o conjunto de
 *    comentarios apagados deixaria de ser o conjunto do legado para a mesma
 *    entrada.
 * 2. **A ordem e conteudo primeiro, comentario depois, e e observavel.** Apagar
 *    um conteudo apaga os comentarios dele em cascata (dentro de
 *    `wp_delete_post()`), logo um comentario que estava na lixeira e cujo
 *    conteudo venceu **nao chega** ao laco do passo 9: ele ja nao existe. O
 *    comentario que chega e o que foi para a lixeira **por si**. Inverter os dois
 *    lacos mudaria qual exclusao emitiu qual cascata — e os pontos de extensao
 *    que cada uma dispara.
 * 3. ⚠️ **A ordem dos dois marcadores apagados e INVERTIDA entre os dois
 *    lacos.** Conteudo: estado (`:6990`) e depois instante (`:6991`).
 *    Comentario: instante (`:7008`) e depois estado (`:7009`). Nao ha razao
 *    legivel no legado — e assimetria de quem escreveu —, e sao **quatro
 *    comandos por registro** (`SELECT meta_id` + `DELETE` em cada chamada, ver
 *    `armazenamento/metadado.ts`), logo a ordem aparece inteira na sequencia que
 *    a area 3 da Decisao 2 de `parity_specs.md` compara. Normalizar as duas para
 *    a mesma ordem e divergencia sem referencia autorizada, que o **P1** recusa.
 * 4. **Nao ha transacao, e e disso que CA-5.4 vive.** BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` em 1.467 arquivos. Interrompida no meio, a coleta deixa
 *    **parte** apagada — e `../portas/porta-de-dados.ts` ja escreveu que *"esse e
 *    exatamente o estado que CA-5.4 manda poder retomar"*. Ver a secao
 *    **CA-5.4** abaixo.
 * 5. **Nao ha `try`/`catch` e nao ha captura de falha.** O legado nao tem
 *    nenhuma: a falha no meio aborta a requisicao que estava avancando a fila, e
 *    UC-11 registra o caso nas excecoes (*"a execucao e abandonada no meio"*).
 *    Envolver os lacos num `catch` que seguisse para o registro seguinte seria
 *    inventar resiliencia que o produto nao tem (**P7**).
 * 6. **Zero ponto de extensao.** Ver a secao correspondente de
 *    `contexto-de-coleta.ts`.
 * 7. **Nenhuma capacidade e perguntada.** UC-11: *"o prazo e a autorizacao"*.
 *    Ver a secao 🔴 de `contexto-de-coleta.ts`, que e onde o **P4** cobra a
 *    declaracao.
 *
 * ## CA-5.4 — por que a retomada funciona sem nada de novo
 *
 * *"Uma execucao interrompida no meio pode ser retomada sem apagar duas vezes
 * nem saltar registro"*. No legado isso nao e um mecanismo: e consequencia de
 * **o marcador ser a fila**.
 *
 * - A varredura do passo 2 nao olha `{site}posts`: ela olha o marcador
 *   `_wp_trash_meta_time`.
 * - `wp_delete_post()` apaga os dois marcadores **antes** de apagar a linha
 *   (`wp-includes/post.php:3889`-`:3890`), e o ramo de tolerancia do passo 6
 *   apaga os dois marcadores tambem.
 * - Logo, **todo registro que a coleta tratou perdeu o marcador**, e uma execucao
 *   seguinte varre exatamente o que falta: nem o que ja foi (ele nao tem mais
 *   marcador: **nao apaga duas vezes**), nem menos do que falta (quem ainda tem
 *   marcador entra na varredura: **nao salta registro**).
 *
 * E por isso que esta funcao **nao** guarda cursor, nem marca progresso, nem
 * recebe ponto de partida. Acrescentar qualquer um dos tres introduziria estado
 * que o legado nao tem, e seria a forma mais discreta de quebrar CA-5.4: um
 * cursor perdido na interrupcao salta registro, e um cursor gravado fora de
 * transacao apaga duas vezes.
 *
 * ## 🔴 O que esta tarefa NAO fechou, e nao podia
 *
 * **CA-5.1 — *"o agendamento da coleta existe numa instalacao nova, sem depender
 * de ninguem ter entrado no painel"* — e conflito aberto, e esta funcao nao o
 * resolve.** `spec.md` registra o conflito em *Perguntas em aberto*, a
 * constituicao poe *"resolver um dos conflitos entre card `wont` e resposta
 * humana"* na tabela do que exige decisao humana, e sao **quatro** registros
 * humanos do lado da paridade contra o criterio: a resposta 10 de
 * `questions.md`, o ADR-0006, BR-MIGRAR-034 e a resposta da Decisao 1 de
 * `pending_decisions.md` (*"agendador por requisicao ao proprio host, com a
 * consequencia de que site sem visita nao limpa a propria lixeira"*, na lista do
 * que a escolha **nao afrouxa**). PT-004 abre com o cenario, marcado `@critico`.
 * O que T011 fez: `agendamento-da-coleta.ts` porta o **corpo** do registro, que e
 * identico nos dois lados, e **ninguem neste modulo o chama** — o ponto de
 * chamada e a decisao que falta. Ver `../README.md`.
 *
 * **CA-5.5 — *"cada execucao registra quantos registros apagou"* — esta pela
 * metade, e de proposito.** O legado nao guarda registro nenhum de execucao
 * (UC-11, pos-condicoes: *"nenhum registro do que foi apagado foi guardado"*).
 * {@link ResultadoDaColeta.registrosApagados} devolve a contagem como **valor de
 * retorno**: nenhum comando sai para grava-la, nenhum ramo desta funcao a le, e
 * o **P7** permite exatamente isso (*"registro e diagnostico novos podem ser
 * acrescentados, mas nenhuma decisao do sistema pode passar a depender deles"*).
 * O que **nao** foi feito e o registro **persistido** que a palavra "registra"
 * pede: ele e divergencia de comportamento observavel, `spec.md` o declara como
 * *"divergencia a ser aceita explicitamente"*, essa aceitacao nao existe, e
 * `ESC-RETENCAO` (BR-MIGRAR-113) proibe inventar o prazo de retencao que o
 * registro novo precisaria. Gravar um e decidir no lugar de quem decide.
 */

import {
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
} from '../armazenamento/index.js';
import { instanteLimiteDeRetencao } from '../configuracao/index.js';
// `trash` vem de `descarte/estado-de-lixeira.ts`, dentro do MESMO contexto: a
// regra de dependencia 3 proibe contexto importar contexto, nao area importar
// area. E e o mesmo byte nas duas colunas que a coleta compara — `post_status` e
// `comment_approved` —, logo declarar uma quarta copia dele aqui seria a forma
// de as duas divergirem em silencio.
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import type { ContextoDeColeta } from './contexto-de-coleta.js';
import { registrarInconsistencia } from './registro-de-inconsistencia.js';

/**
 * O que uma execucao da coleta informa de volta.
 *
 * ⚠️ **No legado `wp_scheduled_delete()` devolve `void`**, e o barramento
 * descarta retorno de acao de qualquer forma
 * (`add_action( 'wp_scheduled_delete', 'wp_scheduled_delete' )`,
 * `wp-includes/default-filters.php:465`). Logo **nenhum consumidor do legado
 * observa este objeto**, e ele nao e divergencia de comportamento observavel: e
 * o que torna CA-5.2, CA-5.3 e CA-5.4 afirmaveis por teste, e a metade de CA-5.5
 * que o **P7** permite. Nada neste modulo ramifica sobre ele.
 */
export interface ResultadoDaColeta {
  /**
   * O `$delete_timestamp` do passo 1 (`wp-includes/functions.php:6977`), lido
   * uma vez e usado nas duas varreduras.
   */
  readonly instanteLimite: number;
  /**
   * O que a varredura de `{site}postmeta` devolveu, **na ordem do banco e com o
   * zero incluido** — o `$posts_to_delete` do legado depois do `(int)`.
   *
   * O zero esta aqui porque a guarda que o salta e do laco, nao da consulta
   * (ver `varredura-do-vencido.ts`): sem ele, "a coleta leu N linhas e tratou
   * N-1" deixaria de ser afirmavel.
   */
  readonly conteudosVarridos: readonly number[];
  /** O mesmo, para `{site}commentmeta` (`$comments_to_delete`). */
  readonly comentariosVarridos: readonly number[];
  /**
   * Quantos conteudos a exclusao definitiva informou ter apagado.
   *
   * E **o retorno que o legado ignora** (`:6993` e expressao solta). Contar aqui
   * nao muda ramo nenhum — ver CA-5.5 no cabecalho.
   */
  readonly conteudosApagados: number;
  /** O mesmo, para comentarios (`:7011`). */
  readonly comentariosApagados: number;
  /**
   * **CA-5.5, a metade que o P7 permite:** a soma dos dois, como **valor de
   * retorno** e nao como registro gravado. Nenhum comando sai para persisti-la.
   */
  readonly registrosApagados: number;
}

/**
 * **A operacao de US-5.** `wp_scheduled_delete()`, com os nove passos na ordem
 * do legado.
 *
 * **Permissao exigida: NENHUMA.** UC-11, campo *Autorizacao*: *"a coleta roda sem
 * usuario autenticado e sem verificacao de capacidade: o prazo e a
 * autorizacao"*. A declaracao esta no contexto, que nao tem ator, e na tabela de
 * permissoes de `../index.ts` — e esta escrita porque o **P4** manda que a
 * operacao que decide acesso sem consultar capacidade esteja nomeada, e nao
 * omitida.
 *
 * ⚠️ **Quem dispara esta funcao nao esta decidido** — e o conflito de CA-5.1, na
 * secao 🔴 do cabecalho deste arquivo. O que esta funcao faz quando chamada e o
 * que o legado faz; **quando** ela e chamada e decisao humana que falta.
 */
export function coletarALixeiraVencida(
  contexto: ContextoDeColeta,
): ResultadoDaColeta {
  // Passo 1 (`:6977`): o relogio, UMA vez, e a aritmetica de T001. As duas
  // varreduras usam este mesmo numero — ver o item 1 do cabecalho.
  const instanteLimite = instanteLimiteDeRetencao(
    contexto.relogio.agoraEmSegundos(),
    contexto.prazoDeRetencao,
  );

  const marcadoresDoConteudo = contexto.armazenamento.marcadoresDoConteudo;
  const marcadoresDoComentario = contexto.armazenamento.marcadoresDoComentario;

  // Passo 2 (`:6979`): CA-5.2, a varredura do conteudo.
  const conteudosVarridos = contexto.varredura.conteudosVencidos(instanteLimite);

  let conteudosApagados = 0;
  for (const conteudoId of conteudosVarridos) {
    // Passo 4 (`:6983`): `if ( ! $post_id ) { continue; }`. Nada e lido e nada e
    // apagado para o identificador zero — e um `continue`, nao um `break`.
    if (conteudoId === 0) {
      continue;
    }

    // Passo 5 (`:6987`): `get_post()`, por registro. Sem cache de objeto e uma
    // leitura por linha varrida, e e essa a contagem que a paridade compara (a
    // borda 5 de `target_architecture.md` manda o cache desligado nas duas
    // metades durante a coexistencia).
    const registro = contexto.conteudo.obterPorId(conteudoId);

    // Passo 6 (`:6989`): a guarda de `R6` / BR-MIGRAR-035 — *"se o registro
    // marcado como 'na lixeira desde' nao esta mais em `trash`, a rotina apaga
    // so o metadado e segue"*. As duas metades da condicao caem no mesmo ramo:
    // registro inexistente e registro fora da lixeira.
    //
    // Este ramo e tambem CA-7.1 e CA-7.2 de **US-7 / T015**: nao ha como porta-lo
    // em outro lugar, porque ele e uma das duas pernas do `if` desta funcao.
    if (registro === null || registro.estado !== ESTADO_DE_LIXEIRA) {
      // `:6990` e depois `:6991`: estado, entao instante. A ordem e invertida no
      // laco do comentario — ver o item 3 do cabecalho.
      marcadoresDoConteudo.apagarEstadoAnterior(conteudoId);
      marcadoresDoConteudo.apagarInstanteDoDescarte(conteudoId);
      // CA-7.3, **depois** dos dois marcadores: e o que faz o evento significar
      // "tratada". Uma interrupcao entre os dois deixa o registro na varredura
      // seguinte, e so entao ele e escrito — uma vez, como CA-5.4 pede.
      registrarInconsistencia(contexto.registroDeInconsistencia, {
        tipo: METADADO_DE_CONTEUDO,
        registroId: conteudoId,
        estadoEncontrado: registro?.estado ?? null,
      });
      continue;
    }

    // Passo 6, outro ramo (`:6993`): `wp_delete_post( $post_id )`, **sem
    // forcar** — ver `ExclusaoDeConteudoNaColeta`.
    if (contexto.exclusaoDefinitivaDeConteudo(conteudoId)) {
      conteudosApagados += 1;
    }
  }

  // Passo 7 (`:6997`): CA-5.3, *"a coleta apaga, pelo mesmo criterio, os
  // comentarios descartados"* — o **mesmo** instante limite do passo 1, sobre
  // `{site}commentmeta`.
  const comentariosVarridos =
    contexto.varredura.comentariosVencidos(instanteLimite);

  let comentariosApagados = 0;
  for (const comentarioId of comentariosVarridos) {
    // Passo 8 (`:7001`).
    if (comentarioId === 0) {
      continue;
    }

    // Passo 8 (`:7005`): `get_comment()`.
    const registro = contexto.comentario.obterPorId(comentarioId);

    // Passo 9 (`:7007`): a mesma guarda de `R6`, sobre `comment_approved`.
    if (registro === null || registro.estado !== ESTADO_DE_LIXEIRA) {
      // `:7008` e depois `:7009`: instante, entao estado. **Invertido** em
      // relacao ao conteudo, e preservado assim de proposito.
      marcadoresDoComentario.apagarInstanteDoDescarte(comentarioId);
      marcadoresDoComentario.apagarEstadoAnterior(comentarioId);
      // CA-7.3, pelo mesmo motivo do laco do conteudo.
      registrarInconsistencia(contexto.registroDeInconsistencia, {
        tipo: METADADO_DE_COMENTARIO,
        registroId: comentarioId,
        estadoEncontrado: registro?.estado ?? null,
      });
      continue;
    }

    // Passo 9, outro ramo (`:7011`): `wp_delete_comment( $del_comment )` — com o
    // **registro**, nao com o identificador. Ver
    // `ExclusaoDeComentarioNaColeta`.
    if (contexto.exclusaoDefinitivaDeComentario(registro)) {
      comentariosApagados += 1;
    }
  }

  return {
    instanteLimite,
    conteudosVarridos,
    comentariosVarridos,
    conteudosApagados,
    comentariosApagados,
    registrosApagados: conteudosApagados + comentariosApagados,
  };
}
