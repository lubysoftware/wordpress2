/**
 * Porta de cache de objeto do modulo de trabalho agendado.
 *
 * E uma das 5 portas de AD-08 (*"dados, HTTP, sistema de arquivos, cache de
 * objeto e e-mail"*) e o slot `cache` que `plan.md` lista para esta feature. A
 * recomendacao da pesquisa e `em-processo` — *"cache por requisicao, em memoria
 * do processo"* —, pela razao que o proprio `plan.md` escreve: *"a Pergunta 1 ja
 * respondeu o que REQ-165 pergunta: num clone do CMS o default de fabrica e a
 * especificacao, e o default de fabrica e nao persistir nada entre
 * requisicoes"*.
 *
 * ## Por que o trabalho agendado, entre todos, precisa desta porta
 *
 * Porque a trava do disparo **e** um transiente, e transiente no legado e a
 * mesma coisa guardada em **dois lugares diferentes**, conforme haja ou nao
 * cache externo. `get_transient()` (`wp-includes/option.php:1455`) e
 * `set_transient()` (`wp-includes/option.php:1541`) abrem os dois com a mesma
 * condicao:
 *
 * ```php
 * if ( wp_using_ext_object_cache() || wp_installing() ) {
 *     $value = wp_cache_get( $transient, 'transient' );
 * } else {
 *     // ... a linha `_transient_` da tabela de opcoes
 * }
 * ```
 *
 * Logo a trava desta feature mora no cache **ou** no banco, e o ramo e
 * observavel: com cache por requisicao, em memoria do processo, a trava **nao
 * sobrevive a requisicao que a tomou**, e o freio de 60 segundos passa a valer
 * apenas dentro de um processo. Com cache externo persistente, ele vale entre
 * processos. Os dois comportamentos sao do produto, e **qual deles e o default**
 * e decisao que esta porta nao toma: ver a secao 🔴 abaixo.
 *
 * ## A trava nao tem prazo gravado, e e por isso que esta porta tem `expiracao`
 *
 * O legado chama `set_transient( 'doing_cron', $doing_wp_cron )`
 * (`wp-includes/cron.php:943`, `:959`, `wp-cron.php:103`) — **sem o terceiro
 * argumento**, logo `$expiration` e `0`. Na forma de banco isso grava a opcao
 * com carregamento automatico e **nenhuma** linha de prazo
 * (`wp-includes/option.php:1548`-`1554`); na forma de cache, `wp_cache_set(
 * ..., 0 )`, que e sem validade.
 *
 * Quem le isso rapido conclui que a trava expira em 60 segundos. **Ela nao
 * expira nunca**: os 60 segundos e os 10 minutos sao **aritmetica** feita na
 * leitura (`wp-includes/cron.php:917` e `:922`), nao prazo de armazenamento. Um
 * adaptador que, por conta propria, desse validade a este registro mudaria o
 * comportamento no caminho em que o legado deixa a trava para tras — o caminho de
 * `wp-cron.php:194`, em que a execucao e abandonada e a trava **nao** e liberada.
 * O campo de expiracao existe nesta porta porque existe na borda; **esta feature
 * passa zero**, e por que ela passa zero esta escrito aqui para que T002 nao
 * invente outro valor.
 *
 * ## O desvio do cache, e por que esta porta NAO basta
 *
 * `_get_cron_lock()` (`wp-cron.php:64`) nao usa `get_transient()`. Ele le a
 * trava **cru**, e em cada ramo faz questao de passar por fora do cache de
 * leitura:
 *
 * - com cache externo, `wp_cache_get( 'doing_cron', 'transient', true )` — o
 *   terceiro argumento e `$force`, e o comentario diz para que
 *   (`wp-cron.php:69`-`73`): *"Skip local cache and force re-fetch of doing_cron
 *   transient in case another process updated the cache"*;
 * - sem cache externo, uma consulta `SELECT ... LIMIT 1` escrita a mao
 *   (`wp-cron.php:75`), que e por onde a {@link PortaDeDados} entra.
 *
 * As duas portas existem nesta feature por causa destas quatro linhas. Uma porta
 * so obrigaria um dos dois ramos a mentir, e o ramo que mentisse e o que decide
 * se dois processos executam o mesmo evento (US-2).
 *
 * ## 🔴 O que esta porta NAO decide
 *
 * - **Se o cache nasce persistente.** REQ-165 esta `bloqueado` e `plan.md`
 *   registra: *"`WP_Object_Cache` por padrao nao persiste nada entre
 *   requisicoes, e REQ-165 registra que ninguem decidiu se o sistema novo nasce
 *   persistente"*. A porta serve os dois: {@link PortaDeCache.externo} e o fato
 *   que o adaptador informa, e nenhum codigo deste modulo o define.
 * - **Se a trava e marcacao otimista ou exclusao real.** `plan.md` e explicito —
 *   *"nao e trava de verdade: e marcacao otimista com prazo. REQ-123 pede exclusao
 *   real, e isso e melhoria sobre o legado"* — e o risco 3 da mesma pagina
 *   lembra que *"um evento que hoje roda duas vezes passa a rodar uma, e isso e
 *   observavel"*. Esta porta oferece ler, gravar e remover, exatamente as tres
 *   operacoes que o legado faz; ela **nao** oferece gravar-se-ausente, porque
 *   oferecer seria entregar exclusao real embrulhada em porta e deixar a
 *   divergencia passar sem decisao humana.
 *
 * **Os metodos sao sincronos** (AD-04), como as outras tres portas deste modulo.
 */

/**
 * Valor que esta feature guarda no cache.
 *
 * E `string` porque e o que ela guarda: a trava, que o legado grava como texto
 * de 22 casas decimais (`sprintf( '%.22F', microtime( true ) )`,
 * `wp-includes/cron.php:958`). A ausencia **nao** e um valor — ela chega como
 * {@link ResultadoDeCache} com `encontrado: false`.
 *
 * O cache de objeto do produto guarda qualquer valor serializavel, e a uniao
 * completa pertence a quem construir o cache da plataforma (REQ-170, feature
 * `015`). Declarar aqui mais do que esta feature usa seria declarar superficie
 * sem uso.
 */
export type ValorDeCache = string;

/**
 * O que uma leitura de cache informa.
 *
 * A separacao entre "nao achei" e "achei isto" e do legado, nao conforto de
 * tipo: `wp_cache_get()` recebe `&$found` por referencia exatamente para
 * distinguir os dois (`wp-includes/cache.php:151`), porque o valor guardado pode
 * ser falso. Nesta feature a distincao decide o primeiro ramo de
 * `_get_cron_lock()`, que devolve `0` quando nao ha trava e o texto dela quando
 * ha (`wp-cron.php:67`, `:81`).
 */
export type ResultadoDeCache =
  | { readonly encontrado: true; readonly valor: ValorDeCache }
  | { readonly encontrado: false };

export interface PortaDeCache {
  /**
   * Se este cache e externo ao processo — o `wp_using_ext_object_cache()` do
   * legado (`wp-includes/load.php:810`).
   *
   * Esta na porta porque e fato da borda, nao regra: e o adaptador que sabe se
   * ha um substituto de cache instalado, e e este fato que escolhe, em
   * `get_transient()` e em `_get_cron_lock()`, entre o cache e a tabela de
   * opcoes. Quem portar a trava em T002 reproduz o ramo; quem compoe o modulo
   * informa o fato.
   */
  readonly externo: boolean;

  /**
   * Le uma chave de um grupo.
   *
   * `forcar` e o `$force` de `wp_cache_get()`: busca de novo em vez de devolver
   * o que o cache local desta requisicao ja tem. `_get_cron_lock()` passa
   * **verdadeiro**, e o comentario do legado explica que e para enxergar a trava
   * que outro processo tomou.
   */
  obter(chave: string, grupo: string, forcar: boolean): ResultadoDeCache;

  /**
   * Grava uma chave num grupo.
   *
   * `expiracaoEmSegundos` zero e **sem validade**, que e o que esta feature
   * passa — ver a secao sobre a trava no cabecalho deste arquivo.
   */
  gravar(
    chave: string,
    valor: ValorDeCache,
    grupo: string,
    expiracaoEmSegundos: number,
  ): void;

  /**
   * Apaga uma chave de um grupo.
   *
   * E o `delete_transient( 'doing_cron' )` do fim da execucao
   * (`wp-cron.php:202`), que no legado acontece **so** se a trava ainda for a
   * mesma (`wp-cron.php:201`). A condicao e de quem portar a execucao; a porta
   * apenas apaga.
   */
  remover(chave: string, grupo: string): void;
}
