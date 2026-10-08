/**
 * **US-5**: tratar a republicacao do que ja esta publicado como operacao sem
 * efeito.
 *
 * Entrega de **T011** da feature `002-autoria-e-publicacao`. A regra e
 * **BR-MIGRAR-007** (`P7`, *"republicar e operacao nula"*), ancorada em
 * `wp-includes/post.php:5413`, que e a mesma linha que a tabela de
 * rastreabilidade de `spec.md` da a US-5, e e o fluxo alternativo
 * *"Conteudo ja estava publicado"* de
 * [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md):
 * *"`wp_publish_post()` retorna sem efeito. Nenhum gancho de transicao dispara:
 * republicar e operacao nula"*.
 *
 * ```php
 * function wp_publish_post( $post ) {          // :5404
 *     global $wpdb;
 *     $post = get_post( $post );               // :5407  — a leitura 1
 *     if ( ! $post )                 { return; } // :5409 — o outro silencio
 *     if ( 'publish' === $post->post_status ) {  // :5413 — ESTA regra
 *         return;                                // :5414
 *     }
 *     ...
 * ```
 *
 * **A guarda ja existia:** ela e a terceira linha de `wp_publish_post()` e
 * chegou com T003, porque sem ela a transicao de US-1 dispararia duas vezes e
 * CA-1.2 (*"uma unica vez"*) cairia. O que **T011** faz e o que o README do
 * modulo registrou como pendente: dar nome a regra, no arquivo que a emite, e
 * afirmar os tres criterios de US-5 contra o sistema novo
 * (`us-5-republicacao-nula.test.ts`). Nenhum comportamento muda nesta tarefa, e
 * isso e o esperado: o **P1** poe o legado como especificacao, e a regra do
 * legado ja estava reproduzida.
 *
 * ---
 *
 * # O que "sem efeito" quer dizer, criterio por criterio
 *
 * | criterio | o que NAO acontece | onde estaria no legado |
 * |---|---|---|
 * | **CA-5.1** *"retorna sucesso sem alterar o registro"* | nenhum `UPDATE` sai, nem da coluna de estado nem do `guid`; a segunda leitura (`$post_before`) e a terceira (o `guid`) nao saem | `:5446`, `:8160`, `:5417`, `:8159` |
 * | **CA-5.2** *"nenhuma transicao de estado e disparada"* | nenhum dos tres pontos de `wp_transition_post_status()` dispara — nem `transition_post_status`, nem `publish_to_publish`, nem `publish_{tipo}` — e o ouvinte do nucleo nao roda | `:5452`, `:5922`, `:5940`, `:5980`, `:8154` |
 * | **CA-5.3** *"nenhuma notificacao, nenhum agendamento e nenhuma automacao"* | o termo padrao nao e consultado nem atribuido; a fila nao e tocada; `_publish_post_hook()` nao roda, logo `_pingme` e `_encloseme` nao sao gravados e `do_pings` nao e agendado | `:5420`-`:5443`, `:8189`, `:8220`-`:8249` |
 *
 * **CA-5.3 nao e uma lista de omissoes: e uma consequencia de CA-5.2.** Tudo o
 * que a publicacao automatiza no legado pende de um dos pontos da transicao —
 * `_publish_post_hook` em `publish_post` com prioridade 5
 * (`wp-includes/default-filters.php:447`) grava dois metadados e **agenda**
 * `do_pings`; `_update_term_count_on_transition_post_status` em
 * `transition_post_status` com prioridade 10 (`:449`) reconta termo; e o aviso ao
 * autor de **US-9** (T019) pende da mesma transicao. Nenhum deles dispara aqui
 * porque a transicao nao acontece — que e, literalmente, o que a historia pede:
 * *"poder repetir a chamada sem disparar notificacao ou automacao duas vezes"*.
 *
 * E **CA-5.1 chama isso de "sucesso"** porque no legado nao ha o que chamar de
 * falha: `wp_publish_post()` nao devolve valor nenhum em **nenhum** dos dois
 * caminhos, e o unico chamador do nucleo escreve isso no comentario antes da
 * chamada — *"wp_publish_post() returns no meaningful value"*
 * (`wp-includes/post.php:5502`). Logo "sucesso sem efeito" e observavel como
 * **ausencia de recusa somada a ausencia de efeito**, e nao como um codigo novo:
 * inventar aqui um erro, um aviso ou um numero de HTTP para a republicacao seria
 * inventar superficie que o legado nao tem (**P8**). O que o resultado da
 * operacao distingue — o desfecho `ja-publicado` de {@link ResultadoDaPublicacao}
 * — e diagnostico acrescentado, e o **P7** o permite com uma condicao que este
 * arquivo cumpre: *"nenhuma decisao do sistema pode passar a depender deles"*.
 *
 * ---
 *
 * # A guarda e por ESTADO, e o `===` e literal
 *
 * A nota de compatibilidade de BR-MIGRAR-007 e o unico lugar do pacote que diz
 * como a regra se porta, e ela e explicita: *"idempotencia por guarda de estado,
 * nao por chave de evento. No alvo, a guarda permanece explicita: um emissor de
 * evento idempotente por ID disparia o gancho, e aqui ele **nao** dispara"*. E
 * por isso que esta regra e uma comparacao de estado dentro da operacao, e nao
 * desduplicacao na fila, no barramento ou numa chave de requisicao.
 *
 * E a comparacao e com **um** dos 12 estados de fabrica, byte a byte. Os outros
 * 11 transitam, inclusive os tres que um porte distraido leria como "ja
 * publicado":
 *
 * | estado | o que a guarda faz | por que importa |
 * |---|---|---|
 * | `publish` | **desiste** | a regra |
 * | `private` | transita | e conteudo publicado com visibilidade privada (US-4), e no legado `private` para `publish` **dispara** a transicao — e e justamente ela que o ponto depreciado `private_to_published` escuta (`:8171`) |
 * | `future` | transita | e o caminho normal da publicacao agendada (US-6): a fila chama `wp_publish_post()` para sair de `future` |
 * | `trash` | transita | o legado nao protege a lixeira nesta porta; quem restaura e a feature 005, e esta funcao nao sabe disso |
 *
 * Tratar `private` ou `future` como "ja publicado" aqui romperia US-4 e US-6 em
 * silencio, e nenhuma das duas tem como notar: a diferenca e um gancho que nao
 * dispara.
 *
 * ---
 *
 * # ⚠️ A nulidade e DESTA porta, e nao do caminho de gravacao
 *
 * Esta e a leitura que um porte "idempotente por fora" erra, e ela e verificavel
 * linha a linha no legado: `wp_insert_post()` chama
 * `wp_transition_post_status( $data['post_status'], $previous_status, $post )`
 * **sem comparar os dois estados** (`:5176`), e o proprio docblock do terceiro
 * ponto avisa que ele dispara *"both when a post is first transitioned to that
 * status from something else, as well as upon subsequent post updates (old and
 * new status are both the same)"* (`:5965`-`:5968`). Isto e: **salvar de novo um
 * conteudo publicado dispara `publish_to_publish` e `publish_{tipo}` no legado**,
 * e com eles `_publish_post_hook()` de novo.
 *
 * Portanto:
 *
 * - a operacao nula vale para **publicar** — `wp_publish_post()`, que e a
 *   operacao `publicar` da tabela *Contratos* do plano e a ancora `:5413` que o
 *   pacote da a US-5;
 * - ela **nao** vale para **gravar** (`wp_insert_post()` / `wp_update_post()`),
 *   que e o caminho de T005, T007 e T013. Fazer o caminho de gravacao desistir
 *   quando o estado nao muda seria "melhorar" o legado — some com dois pontos de
 *   extensao que extensao de terceiro escuta, e cai no **P1** e na linha *"mudar
 *   regra de negocio documentada"* da tabela de nao negociaveis.
 *
 * A historia US-5 e escrita na voz do integrador — *"para poder repetir a chamada
 * sem disparar notificacao ou automacao duas vezes"* — e quem ler so essa frase
 * pode esperar que **qualquer** pedido repetido de publicacao seja nulo,
 * inclusive o `POST` da API que grava. **Nao e**, e os tres criterios de aceite
 * nao pedem que seja: eles falam de *"pedir a publicacao"*, a rastreabilidade
 * aponta `:5413`, BR-MIGRAR-007 aponta `:5413` e o cenario `@idempotencia` de
 * `02-publicacao-e-agendamento-de-conteudo.feature` descreve esta porta. T011
 * implementa a regra na ancora que o pacote da e **nao estende a nulidade ao
 * caminho de gravacao** — estender seria divergir do legado sem decisao humana;
 * a observacao fica registrada aqui para quem construir a superficie REST, que e
 * onde a diferenca aparece.
 *
 * ---
 *
 * # Quem chega a esta guarda, e quem nunca chega
 *
 * `wp_publish_post()` tem **um** chamador no nucleo —
 * `check_and_publish_future_post()` (`:5503`) — e ele **nunca** aciona esta
 * regra, porque desiste antes, no seu proprio portao: `if ( 'future' !==
 * $post->post_status ) { return; }` (`:5489`), que e a verificacao dupla de
 * BR-MIGRAR-006 (T013). Ou seja: pela fila, um conteudo ja publicado para no
 * portao de `future`; por esta porta, ele para nesta guarda. **Os dois silencios
 * existem, sao de donos diferentes e nenhum dos dois registra erro** — o cenario
 * de paridade do agendamento cobra exatamente isso (*"nenhuma das duas publica"*,
 * *"nenhuma das duas registra erro"*).
 *
 * Quem chega aqui, entao, e: a operacao {@link publicar} (a superficie de US-1),
 * uma extensao que chame a funcao publica direto — que no legado e um caminho
 * sem portao algum, por desenho — e T013 quando a verificacao dupla deixar
 * passar.
 */

import { ESTADO_PUBLICADO } from './transicao-de-estado.js';

/**
 * `if ( 'publish' === $post->post_status )` — a guarda de `:5413`.
 *
 * Devolve `true` quando pedir a publicacao daquele conteudo e **operacao sem
 * efeito**: o chamador desiste ali, sem ler mais nada, sem escrever e sem
 * disparar ponto de extensao nenhum.
 *
 * Recebe `string`, e nao `EstadoEditorial`, porque e o que a coluna devolve: o
 * vocabulario fechado de `../estado-editorial.ts` cobre os 12 de fabrica, e
 * `posts.post_status` e `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`) —
 * estado registrado por extensao, ou escrito direto na tabela, chega aqui como
 * texto qualquer. O legado compara do mesmo jeito, e para qualquer valor que nao
 * seja `publish` a resposta e a mesma: **transita**.
 */
export function ehRepublicacaoNula(estado: string): boolean {
  return estado === ESTADO_PUBLICADO;
}
