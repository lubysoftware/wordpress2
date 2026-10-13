/**
 * `post-trashed` — o estado de suspensao em cascata —, e **CA-2.4**: o
 * vocabulario que a API de estado aceita, do qual ele nao faz parte.
 *
 * Entrega de **T005** (US-2). O criterio e literal: *"esse estado de suspensao
 * nao e alcancavel pela interface de moderacao: so pela cascata"*. Ele tem duas
 * metades, decididas em lugares diferentes:
 *
 * | metade de CA-2.4 | quem decide no legado | onde esta no alvo |
 * |---|---|---|
 * | *"so pela cascata"* | `$wpdb->update` de `wp_trash_post_comments()` e o unico escritor do valor no nucleo (`wp-includes/post.php:4302`) | `suspender-comentarios.ts` |
 * | *"nao e alcancavel pela interface de moderacao"* | o `switch` de `wp_set_comment_status()`, que devolve `false` para qualquer nome fora de quatro (`wp-includes/comment.php:2798`-`:2815`) | este arquivo |
 *
 * ── O QUE ESTE ARQUIVO NAO E: A OPERACAO DE MODERACAO ───────────────────────
 *
 * `wp_set_comment_status()` **nao e desta feature**. Ela e de BC-03, feature
 * `007-interacao-publica-e-moderacao`, US-10 — *"moderar a fila de comentarios
 * como transicao de estado"* —, e e la que os pontos de extensao da transicao, o
 * recalculo de contador e a notificacao vivem (ver a tabela de
 * `armazenamento/comentarios-do-conteudo.ts`). Construi-la aqui criaria um
 * segundo dono da mesma funcao publicada, que e o que o **P8** recusa.
 *
 * O que este arquivo declara e **so o vocabulario**, que e o unico fato que
 * CA-2.4 cobra desta tarefa: o conjunto de nomes aceitos e o valor em que cada
 * um resolve. E a mesma divisao que `descarte/estado-de-lixeira.ts` fez com o
 * registro de `trash`, que tambem e dado de outro contexto lido deste lado.
 *
 * ⚠️ **A coluna nao impede nada.** `comment_approved` e `varchar(20)` sem `ENUM`
 * e sem `CHECK` (`DB-ENUM`, `target_data_model.md:179`): `post-trashed` cabe nela
 * e e gravado nela. O que o torna inalcancavel pela moderacao e o `default:
 * return false` do `switch`, nao o armazenamento — e e por isso que a cascata
 * consegue grava-lo escrevendo na coluna direto.
 *
 * ── ⚠️ A CONTAGEM DA REGRA DE NEGOCIO NAO FECHA, E T005 NAO A RESOLVEU ──────
 *
 * US-2 carrega a regra *"Dois estados de comentario nao sao alcancaveis pela API
 * de status"*, e a fonte dela nomeia **um**. O pacote a cita assim:
 *
 * > *"Dois estados nao sao alcancaveis pela API de status (state-machines.md
 * > secao 2)"* — `.specify/use-cases/UC-16-moderar-a-fila-de-comentarios.md:94`
 *
 * > *"Estado pedido fora dos **quatro** aceitos | `wp_set_comment_status()`
 * > devolve falso. **`post-trashed`** so e gravado pela cascata de lixeira do
 * > conteudo, nunca pela interface"* — o mesmo arquivo, `:81`
 *
 * A secao 2 de `state-machines.md`, no espolio da reversa, repete o titulo e
 * nomeia na evidencia **um** estado so: `post-trashed`.
 *
 * A maquina daquela secao tem cinco estados — `'0'`, `'1'`, `spam`, `trash` e
 * `post-trashed` — e o `switch` aceita **quatro** deles, logo o censo fecha em
 * **um** inalcancavel, nao dois. A frase do titulo e a evidencia que ela cita
 * discordam, e o catalogo de testes herdou o titulo: UT-048-5 pede *"cada um dos
 * **dois** estados inalcancaveis"* (`backlog/tests.md:749`) sem dizer quais.
 *
 * **T005 nao escolheu o segundo nome, e nao precisou**: o que o legado faz e
 * recusar **tudo** o que nao esta no vocabulario, e e isso que
 * {@link estadoAceitoPelaApiDeEstado} reproduz — a recusa nao e uma lista de
 * nomes proibidos, e o complemento de uma lista de nomes aceitos. CA-2.4, que e
 * o criterio desta tarefa, fala de **um** estado e esta satisfeito.
 *
 * 🔴 **Quem precisa do segundo nome e T006**, que transcreve UT-048-5 do
 * catalogo e nao pode reconstrui-lo. A pergunta vai para o README deste modulo,
 * secao *O que ninguem decidiu*: ela e de quem escreveu a regra, nao de quem
 * porta — o **P1** poe o comportamento observavel como especificacao, e o
 * comportamento observavel aqui e o `switch`.
 */

/**
 * `post-trashed` — o estado em que a cascata poe **todos** os comentarios do
 * conteudo descartado (`wp-includes/post.php:4302`).
 *
 * Nao e "lixeira de comentario": `trash` e o estado do comentario descartado
 * **por si**, pela moderacao, e carrega os seus proprios marcadores em
 * `{site}commentmeta` (`wp-includes/comment.php:1691`). `post-trashed` nao
 * carrega marcador nenhum — a memoria dele mora no **conteudo**, agrupada
 * (CA-2.2). Confundir os dois faria a restauracao do conteudo devolver
 * comentario que a moderacao tinha descartado de proposito.
 *
 * `class-wp-comment.php:158` o documenta como um dos cinco valores de
 * `comment_approved`, com a glosa *"set for every comment on a post that is
 * moved to the trash"*.
 */
export const ESTADO_DE_SUSPENSAO_EM_CASCATA = 'post-trashed';

/**
 * `'0'` — a fila de moderacao, e o destino de quem perdeu a memoria.
 *
 * E o valor que a restauracao escreve quando o estado guardado e, ele mesmo,
 * `post-trashed`: *"Confidence check. This shouldn't happen."*
 * (`wp-includes/post.php:4362`-`:4364`). E tambem o que `wp_untrash_comment()`
 * escreve quando o marcador do comentario esta vazio
 * (`wp-includes/comment.php:1756`-`:1758`) — as duas metades da regra *"se o
 * estado anterior nao estiver gravado, o comentario restaurado volta para a fila
 * de moderacao"*, que e a borda de UT-048-6.
 *
 * E cadeia, nao numero: a coluna e `varchar(20)` e o legado compara com
 * `'post-trashed' === $status` e atribui `'0'`.
 */
export const ESTADO_DA_FILA_DE_MODERACAO = '0';

/**
 * O `switch` de `wp_set_comment_status()`, como tabela
 * (`wp-includes/comment.php:2798`-`:2815`).
 *
 * Sao **seis nomes** que resolvem em **quatro valores**: `hold` e `'0'` caem no
 * mesmo `'0'`, `approve` e `'1'` caem no mesmo `'1'`. A distincao importa porque
 * o nome e o que a superficie envia e o valor e o que vai para a coluna — e
 * porque o docblock da funcao declara so quatro (*"either 'hold', 'approve',
 * 'spam', or 'trash'"*) enquanto o codigo aceita seis. **O codigo ganha** (P1).
 *
 * ⚠️ `approve` tem efeito a mais que nenhum outro ramo tem: ele registra
 * `wp_new_comment_notify_postauthor` no ponto de acao antes de a gravacao
 * acontecer (`:2806`). O efeito e de BC-03; aqui fica so o registro de que o
 * ramo nao e simetrico aos outros.
 */
export const VOCABULARIO_DA_API_DE_ESTADO: Readonly<Record<string, string>> =
  Object.freeze({
    hold: ESTADO_DA_FILA_DE_MODERACAO,
    '0': ESTADO_DA_FILA_DE_MODERACAO,
    approve: '1',
    '1': '1',
    spam: 'spam',
    trash: 'trash',
  });

/**
 * **CA-2.4.** O valor que a API de estado gravaria para o nome pedido, e `null`
 * quando ela recusa o pedido — que e o `return false` do `default`
 * (`wp-includes/comment.php:2814`-`:2815`).
 *
 * `null` e nao `false` porque o que o legado devolve ali e o **mesmo** `false`
 * que ele devolve quando o `UPDATE` falha (`:2824`), e os dois casos nao sao o
 * mesmo fato: um e *"este estado nao existe para mim"* e o outro e *"o banco
 * recusou"*. O chamador do legado nao os distingue, e quem portar a operacao
 * inteira (BC-03, feature `007`) decide como os devolve; o que esta afirmado
 * aqui e so o primeiro.
 *
 * **Nada e gravado quando a resposta e `null`** — a recusa acontece antes do
 * `clone get_comment()` (`:2818`), logo nem leitura sai. E a metade *"o estado
 * permanece"* que o catalogo pede em UT-048-4.
 */
export function estadoAceitoPelaApiDeEstado(pedido: string): string | null {
  return VOCABULARIO_DA_API_DE_ESTADO[pedido] ?? null;
}

/**
 * Se o nome pedido chega a coluna pela API de estado.
 *
 * `alcancavelPelaApiDeEstado( ESTADO_DE_SUSPENSAO_EM_CASCATA )` e **`false`**, e
 * e essa a afirmacao de CA-2.4. Note que ela e verdadeira sobre o **nome**:
 * `post-trashed` nao e aceito como pedido, embora o valor `'0'` — o destino de
 * quem o perdeu — seja alcancavel por `hold`.
 */
export function alcancavelPelaApiDeEstado(pedido: string): boolean {
  return estadoAceitoPelaApiDeEstado(pedido) !== null;
}
