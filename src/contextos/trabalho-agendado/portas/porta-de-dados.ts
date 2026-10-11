/**
 * Porta de dados do modulo de trabalho agendado.
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/011-trabalho-agendado/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164). E uma das 5 portas de AD-08.
 *
 * ## Por que esta feature precisa de banco, se "nao tem tabela"
 *
 * `plan.md` abre a secao *Modelo de dados* dizendo o que o legado tem: a fila e
 * **uma unica linha** de configuracao. Nao ha tabela desta feature — ha **duas
 * linhas** da tabela de opcoes, e as duas sao lidas e escritas por aqui:
 *
 * | linha | o que e | onde o legado a toca |
 * |---|---|---|
 * | `cron` | a fila inteira, um arranjo serializado | `_get_cron_array()` (`wp-includes/cron.php:1262`), `_set_cron_array()` (`wp-includes/cron.php:1304`) |
 * | `_transient_doing_cron` | a trava do disparo | `_get_cron_lock()` (`wp-cron.php:75`), `set_transient( 'doing_cron', ... )` (`wp-includes/cron.php:959`) |
 *
 * **A fila e gravada com carregamento automatico ligado**, e isso e observavel:
 * `update_option( 'cron', $cron, true )` (`wp-includes/cron.php:1304`) poe a fila
 * entre as opcoes que toda requisicao carrega. Quem portar a gravacao em T002
 * reproduz o terceiro argumento, porque dele depende o custo e o momento da
 * leitura.
 *
 * **A trava e lida por uma consulta escrita a mao que desvia do cache**, e o
 * texto dela e literal (`wp-cron.php:75`):
 *
 * ```php
 * $row = $wpdb->get_row( $wpdb->prepare(
 *     "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1",
 *     '_transient_doing_cron'
 * ) );
 * ```
 *
 * O comentario que a precede diz por que ela existe (`wp-cron.php:69`-`73`):
 * *"Skip local cache and force re-fetch of doing_cron transient in case another
 * process updated the cache"*. E a razao de esta porta e a
 * {@link PortaDeCache} existirem as duas nesta feature, e nao uma no lugar da
 * outra — ver a secao *O desvio do cache* de `porta-de-cache.ts`.
 *
 * ## Quatro ausencias deliberadas, cada uma lida do sistema analisado
 *
 * 1. **Nao ha transacao, e aqui isso E o contrato, nao uma omissao.**
 *    BR-MIGRAR-104 mede zero `START TRANSACTION` e zero `COMMIT` em 1.467
 *    arquivos. A consequencia nesta feature esta escrita no risco 2 de
 *    `plan.md`: *"a fila e uma linha so de configuracao. Dois processos que a
 *    leiam e regravem ao mesmo tempo perdem evento, e e exatamente o que a trava
 *    fraca do legado nao impede"*. Envolver a leitura e a regravacao da fila numa
 *    transacao, ou trocar a regravacao por `UPDATE` condicional, **conserta** essa
 *    perda — e consertar e divergir (P1). Quem precisar de exclusao real le o
 *    risco 3 de `plan.md` antes: *"construir exclusao real e melhoria, e melhoria
 *    e divergencia"*. E le a nota 1 de `target_business_rules.md`, que trata o
 *    caso por nome: a rubrica de descarte por paradigma usa como exemplo-padrao
 *    a trava pessimista e a transacao em torno do fluxo, e *"aqui nao existe
 *    nenhum dos dois ... os unicos freios de concorrencia sao travas de tempo —
 *    60 s no `wp-cron.php` e 5 min no `wp-mail.php` — e as duas sao
 *    **observaveis**, logo migram (a Pergunta 10 manda preservar as duas pelo
 *    numero)"*.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** 18 tabelas, 59
 *    indices, zero chave estrangeira (P5). A fila guarda nome de gancho que nao
 *    aponta para nada declarado: evento de gancho que ninguem mais registra fica
 *    na fila, vence, e dispara para plateia vazia. E estado normal do produto.
 * 3. **Os metodos sao sincronos** (AD-04): `adaptadores/` e assincrono,
 *    `contextos/` e `plataforma/` sao sincronos. Promessa aqui contaminaria o
 *    chamador, e nesta feature ha um agravante — AD-07 avisa que numa runtime
 *    assincrona *"o laco de eventos continua vivo depois da resposta e a
 *    requisicao pode COMPLETAR"*, que e justamente o que nao pode acontecer.
 * 4. **Nao ha `prefixoBaseDeTabela`.** A tabela de opcoes e de escopo **por
 *    site** — `target_data_model.md` a poe entre as de *"ESCOPO POR SITE"*, com
 *    `{p}` no site principal e `{p}<blog_id>_` nos demais —, logo cada site da
 *    rede tem a **sua** fila e a **sua** trava. O prefixo base serve `users` e
 *    `usermeta`, que nao sao desta feature.
 *
 * **Esta interface repete a forma da porta de dados dos outros contextos, e a
 * duplicacao e a regra, nao descuido.** A regra de dependencia 3 proibe contexto
 * importar contexto no topo do modulo, e a 4 poe a porta no modulo que a
 * **consome**, nao no adaptador que a implementa. Um unico adaptador satisfaz
 * todas por forma. A camada de dados de verdade e trabalho da feature `015`
 * (`015-plataforma-transversal`); enquanto ela nao existe, cada contexto declara
 * a sua.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e essa
 * separacao que faz a concatenacao desnecessaria.
 *
 * **O texto precisa poder ser a MESMA string que o legado envia.** Nesta feature
 * o caso concreto e a leitura da trava, que no legado e uma consulta escrita a
 * mao com `LIMIT 1` (`wp-cron.php:75`) e nao a leitura normal de opcao. Trocar
 * por uma leitura "melhor" — pelo cache, ou sem o `LIMIT` — muda exatamente o
 * que o comentario do legado diz estar evitando.
 */
export interface Consulta {
  /** SQL com marcadores de parametro, na mesma forma que o legado envia. */
  readonly texto: string;
  /** Valores dos marcadores, na ordem em que aparecem no texto. */
  readonly parametros: readonly ValorDeParametro[];
}

/** Uma linha devolvida por leitura, com as colunas como o banco as nomeia. */
export interface LinhaDeResultado {
  readonly [coluna: string]: ValorDeColuna | undefined;
}

/** O que uma escrita informa de volta. */
export interface ResultadoDeEscrita {
  readonly linhasAfetadas: number;
  /** Chave gerada pelo banco, quando a escrita gerou uma. */
  readonly idGerado: number | null;
}

export interface PortaDeDados {
  /**
   * Prefixo das tabelas deste site (o `$wpdb->prefix` do legado).
   *
   * Esta na porta porque e fato da borda, nao regra: numa rede o identificador
   * do site entra **dentro** do nome da tabela, logo a fila de um site e outra
   * linha, em outra tabela, que a do site vizinho.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
