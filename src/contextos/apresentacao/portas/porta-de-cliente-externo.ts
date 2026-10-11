/**
 * Porta de cliente HTTP de saida do modulo de apresentacao (BC-07).
 *
 * Entrega de **T001** da feature `009-apresentacao-e-personalizacao`, que a pede
 * pelo nome junto com a porta de dados. O slot de tecnologia e `cliente-http`
 * (`plan.md`, secao Stack), e e a **primeira** porta do plano de migracao
 * escolhido.
 *
 * ## Por que um modulo de aparencia tem chamada de saida — e ha exatamente UMA
 *
 * Em toda a area de apresentacao do legado existe **uma** chamada externa, e ela
 * e o catalogo de fontes:
 *
 * ```php
 * $response = wp_safe_remote_get( $url );
 * if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
 * ```
 * — `wp-includes/fonts/class-wp-font-collection.php:182`-`:183`
 *
 * E a historia **US-13**, e o criterio que depende desta porta e **CA-13.3**:
 * *"fonte vinda de catalogo externo tem o seu endereco de origem declarado, e o
 * endereco e validado antes de qualquer download"*. A validacao nao e invencao do
 * criterio: ela e o que a variante **segura** da funcao faz, e esta declarada em
 * {@link PedidoExterno.recusarUrlInsegura}.
 *
 * ⚠️ **Metade do comportamento de US-13 esta fora desta arvore**, e `spec.md` o
 * registra em *Perguntas em aberto* (lacuna L4): *"nenhum endereco de servico de
 * fonte aparece no codigo PHP: ele vem do catalogo em JSON, e o download e feito
 * pelo navegador"*. O que **esta** aqui e so o que o servidor faz: buscar o JSON
 * do catalogo. O download do arquivo de fonte **nao passa** por esta porta no
 * legado, e acrescentar superficie para ele seria inventar comportamento.
 *
 * ## O que esta porta NAO traz, e e ausencia com motivo
 *
 * - **Nenhum rebaixamento para canal sem cifra.** BR-MIGRAR-115 (`ESC-HTTP`) e a
 *   resposta 12 mandam preservar os **7 endpoints** que repetem a requisicao em
 *   claro quando o TLS falha — e **nenhum deles e desta feature**: eles vivem na
 *   atualizacao e na integracao externa (`BC-13`, `BC-11`). A unica chamada daqui
 *   usa o default `sslverify => true` (`wp-includes/class-wp-http.php:228`) e nao
 *   tem caminho de repeticao. Trazer o rebaixamento para ca por simetria com
 *   `BC-03` ou `BC-13` seria **acrescentar** divida herdada onde o legado nao a
 *   tem, que e violacao do **P1** na direcao menos obvia.
 * - **Nenhuma nova tentativa dentro da porta.** AD-06: *"nao ha broker, DLQ nem
 *   retry generico"*. O legado nao repete esta chamada: a resposta boa e guardada
 *   num transient de site e a ruim nao e guardada nenhuma
 *   (`class-wp-font-collection.php:179` e `:205`), logo a proxima requisicao
 *   tenta de novo por ausencia de cache, nao por politica de repeticao. Quem
 *   implementar T027 reproduz isso **ali**, com o prazo do legado.
 * - **Nenhum teto de bytes da resposta.** `limit_response_size` nasce `null`
 *   (`wp-includes/class-wp-http.php:232`) e esta chamada nao o altera. Declarar o
 *   campo aqui seria superficie que este modulo nao usa — ao contrario de
 *   `BC-03`, onde o pingback passa 150 KB e o numero muda o resultado.
 * - **Nenhum disparo nao bloqueante.** E do agendador e do loopback, que sao
 *   `BC-11`, e AD-07 poe a **falha** dele como criterio de aceite daquele
 *   contexto. A busca do catalogo espera a resposta: e dela que sai a lista.
 *
 * ## Falha e valor devolvido, nunca excecao
 *
 * `WP_Http::request()` devolve `WP_Error`, e a implicacao 4 do paradigma poe isso
 * no contrato: falha de negocio e valor de retorno. Aqui a cadeia inteira e de
 * valor — `load_from_url()` transforma o erro de transporte **e** o codigo HTTP
 * diferente de 200 no mesmo `WP_Error` de catalogo
 * (`class-wp-font-collection.php:183`-`:191`, o `if` e o `WP_Error` dele). Duas
 * consequencias que o **P7** cobra que fiquem escritas:
 *
 * 1. **Resposta que chegou com 301, 204 ou 500 e sucesso de transporte e falha de
 *    catalogo.** Por isso {@link ResultadoExterno} poe qualquer codigo em
 *    `completou: true`: quem decide o que 200 significa e **T027**, nao o
 *    transporte.
 * 2. **Catalogo que nao responde nao derruba a tela de fontes**, nao lanca e nao
 *    interrompe a resolucao de estilos. Excecao atravessando esta borda mudaria o
 *    resultado observavel de uma tela inteira.
 *
 * **O metodo e sincrono por AD-04**, como a porta de dados: a fronteira de `await`
 * fica em `adaptadores/`.
 */

/**
 * O que sai numa chamada, com os nomes dos argumentos de `WP_Http::request()`
 * traduzidos. Os valores de fabrica citados sao os de
 * `wp-includes/class-wp-http.php`, e cada um deles e **filtravel** no legado
 * (BR-MIGRAR-108, `ESC-FILTRAVEL`): preservar o default filtravel e o porte.
 *
 * Nenhum numero de fabrica e escrito em codigo nesta tarefa, de proposito: o
 * **P6** quer cada numero *"num ponto de configuracao nomeado, com o valor de
 * fabrica do legado, e existe teste que afirma o valor e o efeito da borda"*, e
 * T001 nao entrega ponto de configuracao nenhum. Os valores estao citados em prosa
 * para que a tarefa que os for usar nao os invente.
 */
export interface PedidoExterno {
  readonly url: string;
  /**
   * Metodo HTTP. Fabrica: `GET` (`class-wp-http.php:171`).
   *
   * E `string`, e nao uniao fechada, porque no legado `method` e texto livre
   * repassado ao transporte. A unica chamada desta feature usa `GET`; fechar a
   * uniao aqui tornaria a porta mais estreita que a borda que ela representa.
   */
  readonly metodo: string;
  /** Cabecalhos por nome. Fabrica: nenhum, e esta chamada nao acrescenta nenhum. */
  readonly cabecalhos: Readonly<Record<string, string>>;
  /** Corpo, quando ha. Fabrica: nenhum. Esta chamada nao manda corpo. */
  readonly corpo: string | null;
  /**
   * Tempo limite. Fabrica: **5 s**, pelo filtro `http_request_timeout`
   * (`class-wp-http.php:181`). A busca do catalogo de fontes **nao** o altera,
   * logo e o default que vale — e e o mesmo default de 5 s cuja heranca a
   * **resposta 18** de `questions.md` dispensou **so** para o adaptador de IA, que
   * nao e desta feature. A divergencia autorizada e **uma** e nao se estende por
   * analogia (P1).
   */
  readonly tempoLimiteEmSegundos: number;
  /**
   * Quantos redirecionamentos seguir. Fabrica: **5**
   * (`class-wp-http.php:191`), e esta chamada nao o altera.
   */
  readonly limiteDeRedirecionamentos: number;
  /**
   * Identificacao do cliente. Fabrica:
   * `WordPress/{versao}; {url do site}`, pelo filtro `http_headers_useragent`
   * (`class-wp-http.php:211`). Esta chamada nao o altera.
   */
  readonly agenteDeUsuario: string;
  /**
   * Verificar o certificado do par. Fabrica: **true**
   * (`class-wp-http.php:228`), e esta chamada nao o altera.
   *
   * O campo existe porque AD-09 manda o adaptador **reproduzir** o modo de falha
   * do legado, e nao para ser desligado aqui: ver a secao *O que esta porta NAO
   * traz* no cabecalho deste arquivo.
   */
  readonly verificarCertificado: boolean;
  /**
   * Recusar URL que aponte para destino interno. Fabrica: **false**, pelo filtro
   * `http_request_reject_unsafe_urls` (`class-wp-http.php:221`) — e as quatro
   * funcoes `wp_safe_remote_*` forcam **true** (`wp-includes/http.php:82`).
   *
   * **A unica chamada desta feature usa a variante segura**
   * (`class-wp-font-collection.php:182`), logo o valor que o legado manda aqui e
   * `true`. E este campo que CA-13.3 cobra: *"o endereco e validado antes de
   * qualquer download"*. O endereco do catalogo vem de dado registrado por
   * terceiro, nao de constante do nucleo — passar `false` aqui faria o site emitir
   * requisicao para dentro da propria rede por ordem de quem registrou o
   * catalogo.
   */
  readonly recusarUrlInsegura: boolean;
}

/** A resposta de uma chamada que completou, qualquer que seja o codigo. */
export interface RespostaExterna {
  /** Codigo HTTP, como o transporte o devolveu. */
  readonly codigo: number;
  /** Cabecalhos da resposta, por nome em minusculas. */
  readonly cabecalhos: Readonly<Record<string, string>>;
  /**
   * Corpo lido.
   *
   * E `string` porque o unico corpo que este modulo le e texto: o JSON do
   * catalogo de fontes, decodificado em seguida
   * (`class-wp-font-collection.php:194`). Corpo binario nao e caso desta feature —
   * o arquivo de fonte nao e baixado pelo servidor —, e declarar bytes aqui seria
   * declarar superficie sem uso.
   */
  readonly corpo: string;
}

/**
 * O resultado de uma tentativa. Resposta HTTP de erro — 404, 500, e tambem 301 e
 * 204 — e `completou: true` com o codigo dela: o que e `completou: false` e a
 * chamada que **nao produziu resposta nenhuma**, que e o `is_wp_error()` do
 * legado.
 *
 * A separacao importa porque os dois casos **convergem** no legado: o passo
 * seguinte trata erro de transporte e codigo diferente de 200 com a mesma
 * mensagem (`class-wp-font-collection.php:183`). Quem implementar T027 reproduz
 * essa convergencia **ali**; a porta nao a antecipa, senao a informacao do codigo
 * se perde antes de alguem poder afirma-la num teste.
 */
export type ResultadoExterno =
  | { readonly completou: true; readonly resposta: RespostaExterna }
  | { readonly completou: false; readonly motivo: string };

export interface PortaDeClienteExterno {
  /** Faz a chamada. Nao lanca: a falha volta como `completou: false`. */
  chamar(pedido: PedidoExterno): ResultadoExterno;
}
