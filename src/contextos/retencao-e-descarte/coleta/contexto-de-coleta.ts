/**
 * O contexto de uma execucao da coleta: o que ela recebe por argumento, e de
 * quem cada peca e.
 *
 * Entrega de **T011** (US-5). Vale aqui a mesma razao de
 * `../descarte/contexto-de-descarte.ts`: o contexto chega **por argumento** e
 * nao pela composicao do modulo, porque conexao e consulta corrente sao escopo
 * de REQUISICAO (`EXT-CONTEXTO`, BR-MIGRAR-105) e porque as colaboracoes com
 * BC-01 e BC-03 sao de **ligacao tardia** (AD-10, regra de dependencia 3 de
 * `target_architecture.md`) — este arquivo nao importa `contextos/conteudo/`
 * nem `contextos/interacao-publica/` em lugar nenhum, e nao poderia.
 *
 * ── A COISA MAIS IMPORTANTE DESTE ARQUIVO: NAO HA ATOR ─────────────────────
 *
 * 🔴 **A coleta nao pergunta capacidade nenhuma, e a ausencia e declaracao, nao
 * esquecimento.** UC-11 e literal no campo *Autorizacao*: *"nenhuma. A coleta
 * roda sem usuario autenticado e sem verificacao de capacidade: **o prazo e a
 * autorizacao**"*. Por isso este contexto **nao** tem `base` nem `ator`, ao
 * contrario do de descarte — e e exatamente o que o **P4** da constituicao manda
 * escrever: ela e uma das operacoes que *"decidem acesso sem consultar
 * capacidade alguma"*, e *"uma matriz que ignore esses cinco descreve um sistema
 * mais fechado do que o real"*. `../index.ts` repete a declaracao na tabela de
 * permissoes do modulo.
 *
 * ── NAO HA PONTO DE EXTENSAO NESTA FUNCAO, E ISSO TAMBEM E ACHADO ──────────
 *
 * `wp_scheduled_delete()` (`wp-includes/functions.php:6974`-`:7014`) tem **zero**
 * `apply_filters` e **zero** `do_action`: nenhuma extensao consegue observar,
 * cancelar ou alterar a coleta. Por isso nao existe `GanchosDaColeta` aqui, ao
 * contrario de `GanchosDoDescarte`, que tem tres. Os pontos de extensao que uma
 * execucao de coleta dispara sao todos **de dentro** da exclusao definitiva
 * (`before_delete_post`, `pre_delete_post`, `delete_comment`, ...), e aquela e
 * ligacao tardia: eles pertencem a quem a implementa, nao a este contexto. Um
 * porte que acrescentasse um gancho de coleta inventaria contrato publico que o
 * legado nao tem, que e o erro que o **P2** proibe na direcao oposta.
 *
 * ── AS QUATRO LIGACOES TARDIAS, E O ARGUMENTO QUE CADA UMA RECEBE ──────────
 *
 * | peca | o que e no legado | de quem e |
 * |---|---|---|
 * | {@link ConteudoNaColeta} | `get_post( $post_id )` (`:6987`) | **BC-01** |
 * | {@link ComentarioNaColeta} | `get_comment( $comment_id )` (`:7005`) | **BC-03** |
 * | {@link ContextoDeColeta.exclusaoDefinitivaDeConteudo} | `wp_delete_post( $post_id )` (`:6993`) | **T017** (US-8) deste modulo |
 * | {@link ContextoDeColeta.exclusaoDefinitivaDeComentario} | `wp_delete_comment( $del_comment )` (`:7011`) | **BC-03** |
 */

import type {
  MarcadoresDeLixeira,
  MarcadoresDeLixeiraDoConteudo,
} from '../armazenamento/index.js';
import type { PrazoDeRetencao } from '../configuracao/index.js';
import type { PortaDeRelogio } from '../portas/index.js';
import type { VarreduraDoVencido } from './varredura-do-vencido.js';

/**
 * O registro como a coleta o le — **duas colunas**, e nao a linha inteira.
 *
 * `wp_scheduled_delete()` usa do conteudo exatamente `post_status` (`:6989`) e
 * do comentario exatamente `comment_approved` (`:7007`); o identificador ela ja
 * tem, da varredura. Declarar as 23 colunas de `{site}posts` ou as 15 de
 * `{site}comments` seria superficie que esta operacao nao consome — a mesma
 * recusa que `RegistroNoDescarte` fez em T003.
 *
 * ⚠️ **As duas colunas levam o MESMO byte para dizer "na lixeira", e sao
 * colunas diferentes.** `post_status` guarda `trash` e `comment_approved`
 * tambem — a coluna do comentario e a de *aprovacao*, e um dos valores dela e o
 * estado de lixeira. Por isso um unico campo `estado` serve os dois lados aqui:
 * a comparacao que o legado faz e a mesma, sobre a mesma cadeia.
 */
export interface RegistroNaColeta {
  /** `$del_post->ID` ou `$del_comment->comment_ID`. */
  readonly id: number;
  /** `$del_post->post_status` ou `$del_comment->comment_approved`. */
  readonly estado: string;
}

/**
 * `get_post( $post_id )` (`wp-includes/functions.php:6987`), ou `null` quando a
 * linha nao existe.
 *
 * O `null` nao e erro: ele e **metade** da guarda de tolerancia de `R6`
 * (`! $del_post ||` em `:6989`) — marcador que aponta para um conteudo que nao
 * existe mais cai no mesmo ramo do marcador que aponta para um conteudo que saiu
 * da lixeira, e os dois tem **so o marcador** apagado.
 */
export interface ConteudoNaColeta {
  obterPorId(conteudoId: number): RegistroNaColeta | null;
}

/**
 * `get_comment( $comment_id )` (`wp-includes/functions.php:7005`,
 * `wp-includes/comment.php:271`), ou `null` quando a linha nao existe.
 *
 * E a fronteira com **BC-03** (`contextos/interacao-publica/`), por ligacao
 * tardia como a de BC-01: a regra de dependencia 3 proibe o `import`.
 */
export interface ComentarioNaColeta {
  obterPorId(comentarioId: number): RegistroNaColeta | null;
}

/**
 * `wp_delete_post( $post_id )` (`wp-includes/functions.php:6993`).
 *
 * ⚠️ **O segundo argumento NAO e passado, e a ausencia dele e a regra.**
 * `wp_delete_post( $post_id, $force_delete = false )` desviaria para a lixeira
 * se o registro **nao** estivesse em `trash` (`wp-includes/post.php:3851`-`:3855`:
 * `! $force_delete && ( 'post' === ... || 'page' === ... ) && 'trash' !==
 * get_post_status( $post_id ) && EMPTY_TRASH_DAYS`). A coleta chega aqui **so
 * depois** de confirmar `trash` no passo anterior, logo a guarda nao desvia e a
 * exclusao e definitiva **sem forcar**. Por isso este tipo nao tem parametro de
 * forca: passar `true` aqui mudaria o caminho do conteudo de tipo `attachment`,
 * que com forca falsa iria para `wp_delete_attachment( $id, false )` e com forca
 * verdadeira para `wp_delete_attachment( $id, true )` (`:3859`).
 *
 * E **distinto** de `ExclusaoDefinitivaNoDescarte` (T003), que e
 * `wp_delete_post( $post_id, true )`, com forca: ali o registro **nao** esta em
 * `trash` e sem forca ele voltaria para a lixeira. Mesma funcao do legado, dois
 * chamadores com argumentos diferentes — por isso dois tipos, e nao um
 * reaproveitado.
 *
 * Devolve se a linha foi apagada. ⚠️ **O legado ignora este retorno** (`:6993` e
 * uma expressao solta), e nenhum ramo da coleta depende dele. Ele viaja ate aqui
 * para a contagem de CA-5.5 e para nada mais — ver
 * `coletar-a-lixeira-vencida.ts`.
 *
 * **Quem a implementa e T017** (US-8): a cascata reparenteia filhos e anexos ao
 * avo em lugar de apaga-los (`wp-includes/post.php:3908`) e leva as versoes
 * anteriores em cascata. Declarar o ponto de delegacao agora, na posicao exata,
 * e o que impede que a ordem se perca depois.
 */
export type ExclusaoDeConteudoNaColeta = (conteudoId: number) => boolean;

/**
 * `wp_delete_comment( $del_comment )` (`wp-includes/functions.php:7011`).
 *
 * ⚠️ **Recebe o REGISTRO, nao o identificador**, e e a unica das quatro ligacoes
 * desta coleta que o faz: o laco do conteudo passa `$post_id` (`:6993`) e o do
 * comentario passa `$del_comment` (`:7011`), o objeto que acabou de ser lido.
 * `wp_delete_comment( $comment_id, $force_delete = false )`
 * (`wp-includes/comment.php:1566`) aceita os dois porque reabre com
 * `get_comment()`, mas a forma da chamada e observavel na sequencia de comandos
 * — passar o identificador aqui faria sair uma leitura que no legado nao sai.
 *
 * Como no conteudo, o segundo argumento **nao** e passado: a guarda de
 * `wp-includes/comment.php:1574` (`! $force_delete && EMPTY_TRASH_DAYS &&
 * ! in_array( wp_get_comment_status( $comment ), array( 'trash', 'spam' ), true )`)
 * nao desvia, porque o passo anterior confirmou `trash`.
 *
 * **Quem a implementa e BC-03**, por ligacao tardia: a exclusao do comentario
 * sobe os filhos um nivel, apaga o metadado linha por linha e recalcula a
 * contagem do conteudo. Nada disso e deste modulo.
 */
export type ExclusaoDeComentarioNaColeta = (
  comentario: RegistroNaColeta,
) => boolean;

/**
 * O que a coleta le e apaga do armazenamento de T002.
 *
 * **As duas familias, e so os dois marcadores de cada uma.** O ramo de
 * tolerancia apaga `_wp_trash_meta_status` e `_wp_trash_meta_time`
 * (`wp-includes/functions.php:6990`-`:6991` no conteudo, `:7008`-`:7009` no
 * comentario) e **nunca** toca
 * `_wp_trash_meta_comments_status` — o marcador agrupado de CA-2.2 nao entra em
 * varredura nenhuma da coleta, como `armazenamento/chaves-e-tabelas.ts` ja
 * registrou: *"a terceira chave nao entra nessas duas varreduras no legado"*.
 *
 * O tipo de `marcadoresDoConteudo` e o completo porque e o que
 * `criarArmazenamentoDeRetencao()` devolve; estreita-lo aqui obrigaria o
 * chamador a construir um objeto so para esta operacao.
 */
export interface ArmazenamentoNaColeta {
  readonly marcadoresDoConteudo: MarcadoresDeLixeiraDoConteudo;
  readonly marcadoresDoComentario: MarcadoresDeLixeira;
}

/**
 * O contexto de uma execucao da coleta.
 *
 * **Nao tem `base` nem `ator`** — ver a secao 🔴 do cabecalho deste arquivo.
 */
export interface ContextoDeColeta {
  /**
   * O prazo de retencao **desta instalacao** (T001).
   *
   * ⚠️ **A coleta nao pergunta se a lixeira esta ligada.**
   * `wp_scheduled_delete()` nao testa `EMPTY_TRASH_DAYS` por verdade: ela so o
   * usa na aritmetica de `:6977`. Com o prazo em **zero** o instante limite cai
   * no **proprio agora**, e todo marcador gravado antes deste instante vence —
   * o que no legado alcanca justamente o conteudo que foi para a lixeira
   * **antes** de alguem desligar a lixeira. UC-11 registra o caso como excecao
   * (*"nada chega a lixeira para coletar: a exclusao ja foi definitiva em
   * UC-09"*), e e verdade para o que chega **depois**; o que ja estava la
   * continua sendo coletado. Nenhuma guarda foi acrescentada: o legado nao tem
   * nenhuma (P1).
   *
   * E com prazo **negativo** o limite cai no **futuro** e tudo vence de imediato
   * — a consequencia que `configuracao/prazo-de-retencao.ts` anunciou
   * (*"valor negativo nao desliga a lixeira ... o instante limite cai no
   * futuro"*) aparece aqui, e tambem sem guarda.
   */
  readonly prazoDeRetencao: PrazoDeRetencao;

  /**
   * `time()` do passo 1 (`wp-includes/functions.php:6977`), em segundos
   * inteiros UTC.
   *
   * **E lido UMA vez por execucao**, antes das duas varreduras: as duas
   * comparam o **mesmo** instante limite, e nao um recalculado entre elas. Uma
   * coleta longa nao move a propria borda, e e por isso que o relogio e lido no
   * passo 1 e nao dentro de cada laco.
   */
  readonly relogio: PortaDeRelogio;

  /** As duas consultas do prazo. Ver `varredura-do-vencido.ts`. */
  readonly varredura: VarreduraDoVencido;

  readonly armazenamento: ArmazenamentoNaColeta;

  /** `get_post()`. Ver {@link ConteudoNaColeta}. */
  readonly conteudo: ConteudoNaColeta;

  /** `get_comment()`. Ver {@link ComentarioNaColeta}. */
  readonly comentario: ComentarioNaColeta;

  /** `wp_delete_post( $post_id )`. Ver {@link ExclusaoDeConteudoNaColeta}. */
  readonly exclusaoDefinitivaDeConteudo: ExclusaoDeConteudoNaColeta;

  /** `wp_delete_comment( $del_comment )`. Ver {@link ExclusaoDeComentarioNaColeta}. */
  readonly exclusaoDefinitivaDeComentario: ExclusaoDeComentarioNaColeta;
}
