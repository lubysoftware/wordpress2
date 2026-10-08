/**
 * Porta de cliente HTTP de saida do modulo de interacao publica (BC-03).
 *
 * O slot de tecnologia e `cliente-http`
 * (`.specify/specs/007-interacao-publica-e-moderacao/plan.md`), e e a PRIMEIRA
 * porta do plano de migracao escolhido. Este modulo faz chamada de saida por um
 * motivo que e regra de negocio, e nao detalhe de integracao: **a autorizacao do
 * pingback e a prova**. UC-17 poe isso na propria linha de autorizacao do caso
 * de uso — *"nenhuma credencial. A autorizacao do pingback e a prova: a pagina de
 * origem e buscada e tem de conter o link"* —, CA-15.1 e CA-15.2 cobram as duas
 * metades, e C8 (BR-MIGRAR-016) e o que decide o estado. Sem esta porta a
 * notificacao de link nao pode ser verificada, e o legado nunca aprova o que nao
 * verificou.
 *
 * 🔴 **O segundo uso desta porta esta em conflito registrado e NAO resolvido.**
 * US-16 e US-17 da `spec.md` consultam um servico externo de reputacao, e a
 * secao *Perguntas em aberto* da mesma spec registra que a resposta 13 de
 * `questions.md` o poe FORA do nucleo clonado — `discard_log.md` ja descartou a
 * regra C13 e o envio integral ao classificador por esse motivo. T001 nao
 * decide: declara a borda que o pingback exige de qualquer forma, e **nao**
 * declara nada especifico de classificador. Quem pegar T034 ou T036 le a
 * pergunta em aberto antes de escrever a primeira linha.
 *
 * **Falha e valor devolvido, nunca excecao.** `WP_Http::request()` devolve
 * `WP_Error`, e a implicacao 4 do paradigma poe isso no contrato: falha de
 * negocio e valor de retorno. Aqui a consequencia e direta — CA-16.2 manda que,
 * sem o servico, *"a decisao volta inteira para as regras locais, sem erro"*, e
 * UC-17 manda recusar o pingback cuja origem nao responde. Excecao atravessando
 * a cadeia de moderacao a interromperia, e AD-05 exige que quem encerra a
 * decisao seja uma ETAPA, nao um erro de transporte.
 *
 * **Nenhuma nova tentativa acontece dentro desta porta.** AD-06 e explicito:
 * *"nao ha broker, DLQ nem retry generico"*, e a politica de nova tentativa do
 * legado e escrita a mao onde ela existe. A reconsulta de CA-16.4 e politica de
 * quem chama, nao do transporte.
 *
 * **O metodo e sincrono por AD-04**, como as outras tres portas: a fronteira de
 * `await` fica em `adaptadores/`. Aqui isso e exigencia de AD-05, nao de estilo:
 * o passo 4 de UC-14 consulta o servico externo DENTRO da decisao, antes de o
 * estado inicial ser escolhido, e a resposta ao visitante tem de sair sincrona
 * com 409 ou 429 quando for o caso.
 *
 * ⚠️ **O que esta porta NAO declara, e e ausencia com motivo:** o disparo
 * deliberadamente NAO BLOQUEANTE do legado — tempo limite de 0,01 s, `blocking`
 * falso — nao esta aqui. Ele e do agendador e do loopback, que sao `BC-11`, e
 * AD-07 poe a FALHA dele como criterio de aceite daquele contexto. Nenhuma
 * chamada deste modulo e nao bloqueante no legado: a busca da pagina de origem
 * do pingback espera a resposta, porque e dela que sai a prova. Acrescentar o
 * campo aqui seria declarar superficie que este modulo nao usa.
 */

/**
 * O que sai numa chamada, com os nomes dos argumentos de `WP_Http::request()`
 * traduzidos. Os valores de fabrica citados sao os de
 * `wp-includes/class-wp-http.php`, e cada um deles e FILTRAVEL no legado
 * (BR-MIGRAR-108, `ESC-FILTRAVEL`): preservar o default filtravel e o porte.
 */
export interface PedidoExterno {
  readonly url: string;
  /**
   * Metodo HTTP. Fabrica: `GET` (`class-wp-http.php:171`).
   *
   * E `string`, e nao uniao fechada, porque no legado `method` e texto livre
   * repassado ao transporte. Este modulo usa `GET` (buscar a pagina de origem do
   * pingback, `class-wp-xmlrpc-server.php:7099`); fechar a uniao aqui tornaria a
   * porta mais estreita que a borda que ela representa.
   */
  readonly metodo: string;
  /** Cabecalhos por nome. Fabrica: nenhum. */
  readonly cabecalhos: Readonly<Record<string, string>>;
  /** Corpo, quando ha. Fabrica: nenhum. */
  readonly corpo: string | null;
  /**
   * Tempo limite. Fabrica: **5 s**, pelo filtro `http_request_timeout`
   * (`class-wp-http.php:181`). A busca da pagina de origem do pingback passa
   * **10 s** (`class-wp-xmlrpc-server.php:7090`).
   */
  readonly tempoLimiteEmSegundos: number;
  /**
   * Quantos redirecionamentos seguir. Fabrica: **5**
   * (`class-wp-http.php:191`). O pingback passa **0**
   * (`class-wp-xmlrpc-server.php:7091`), e isso e observavel: pagina de origem
   * que responde 301 nao produz prova.
   */
  readonly limiteDeRedirecionamentos: number;
  /**
   * Teto de bytes lidos do corpo da resposta, ou `null` para sem teto — que e a
   * fabrica (`class-wp-http.php:232`). O pingback passa **153600** (150 KB,
   * `class-wp-xmlrpc-server.php:7092`): a pagina de origem e lida ate ali e o
   * resto e descartado, logo um link que aparece depois do teto **nao** e prova.
   * Esquecer este numero muda o resultado de CA-15.1 em pagina grande.
   */
  readonly limiteDeBytesDaResposta: number | null;
  /**
   * Identificacao do cliente. Fabrica:
   * `WordPress/{versao}; {url do site}` pelo filtro `http_headers_useragent`
   * (`class-wp-http.php:211`). O pingback acrescenta
   * `; verifying pingback from {ip remoto}`
   * (`class-wp-xmlrpc-server.php:7093`), e o IP remoto vai tambem no cabecalho
   * `X-Pingback-Forwarded-For`.
   */
  readonly agenteDeUsuario: string;
  /**
   * Verificar o certificado do par. Fabrica: **true**
   * (`class-wp-http.php:228`).
   *
   * 🔴 O campo existe porque AD-09 manda o adaptador **reproduzir** o modo de
   * falha do legado, e BR-MIGRAR-115 (`ESC-HTTP`) registra o rebaixamento para
   * canal sem cifra como divida herdada reproduzida de proposito (resposta 12).
   * E o card REQ-085 da `spec.md` desta feature diz o CONTRARIO, com o conflito
   * registrado e nao resolvido na secao *Fora de escopo*. T001 nao resolve: o
   * campo permite as duas leituras, e nenhum codigo deste modulo o altera. Quem
   * for escrever o adaptador le aquele conflito primeiro.
   */
  readonly verificarCertificado: boolean;
  /**
   * Recusar URL que aponte para destino interno. Fabrica: **false**, pelo filtro
   * `http_request_reject_unsafe_urls` (`class-wp-http.php:221`) — e as quatro
   * funcoes `wp_safe_remote_*` forcam **true** (`wp-includes/http.php:53`).
   *
   * O pingback usa a variante segura (`wp_safe_remote_get`,
   * `class-wp-xmlrpc-server.php:7099`), e isso e observavel: UC-17 registra que
   * *"o pingback faz o site emitir requisicao por ordem de um desconhecido"*, e
   * e este campo que decide o que acontece quando o desconhecido aponta para
   * dentro da rede.
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
   * Corpo lido, ja respeitando {@link PedidoExterno.limiteDeBytesDaResposta}.
   *
   * E `string` porque os dois corpos que este modulo le sao texto: o HTML da
   * pagina de origem do pingback, de onde sai a prova, e a resposta do servico
   * de reputacao. Corpo binario nao e caso desta feature, e declarar bytes aqui
   * seria declarar superficie sem uso.
   */
  readonly corpo: string;
}

/**
 * O resultado de uma tentativa. Resposta HTTP de erro — 404, 500 — e
 * `completou: true` com o codigo dela: o que e `completou: false` e a chamada
 * que nao produziu resposta nenhuma.
 */
export type ResultadoExterno =
  | { readonly completou: true; readonly resposta: RespostaExterna }
  | { readonly completou: false; readonly motivo: string };

export interface PortaDeClienteExterno {
  /** Faz a chamada. Nao lanca: a falha volta como `completou: false`. */
  chamar(pedido: PedidoExterno): ResultadoExterno;
}
