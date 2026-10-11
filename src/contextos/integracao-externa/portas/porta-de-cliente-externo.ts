/**
 * Porta de cliente externo do modulo de integracao externa (BC-13).
 *
 * Tarefa **T001** da feature `014-integracao-externa`, cuja entrega e *"a porta
 * de cliente externo e a de envio de e-mail existem com uma implementacao cada,
 * e toda chamada de saida do sistema passa por elas, sem nenhuma politica de
 * prazo ou de repeticao definida"*. `satisfaz: — (infraestrutura)`: nenhum
 * criterio de aceite desta feature fecha aqui, e nenhuma regra de negocio esta
 * implementada.
 *
 * O slot de tecnologia e `cliente-http` (`plan.md`, secao Stack), e e a PRIMEIRA
 * porta do plano de migracao escolhido. A implementacao concreta — undici, como
 * o no desta tarefa declara — vive em `adaptadores/`, fora deste contexto: a
 * regra de dependencia 4 de `target_architecture.md` proibe
 * *"`contextos/` ou `plataforma/` para adaptador concreto ... So pela porta"*, e
 * BC-13 e descrito ali com essa divisao no nome: *"a politica mora aqui"*, o
 * adaptador fora, porque *"sem essa divisao, o contexto seria o unico com
 * dependencia de infraestrutura dentro de si"*. Ver `../README.md`.
 *
 * **Por que esta porta e mais larga que a de BC-03, que tem o mesmo nome.**
 * `contextos/interacao-publica/portas/porta-de-cliente-externo.ts` declara seis
 * campos e recusa de proposito o campo de chamada nao bloqueante, porque aquele
 * modulo faz UMA chamada: a busca da pagina de origem do pingback, que espera a
 * resposta porque e dela que sai a prova. Aqui a entrega de T001 e *"toda
 * chamada de saida do sistema passa por elas"*, e a borda precisa expressar as
 * 29 integracoes e 64 endpoints catalogados — inclusive o disparo
 * deliberadamente nao bloqueante do agendador (`wp-includes/cron.php:990` a
 * `:993`: tempo limite `0.01`, `blocking` falso, verificacao de certificado
 * desligada). A FALHA desse disparo e criterio de aceite de BC-11 (AD-07), nao
 * deste contexto; o que T001 faz e nao tornar o disparo inexpressivel. Os dois
 * arquivos divergem de proposito, e a regra de dependencia 3 proibe
 * compartilhar o tipo de qualquer forma.
 *
 * 🔴 **O conflito que atravessa esta feature inteira NAO e resolvido aqui.** A
 * primeira pergunta em aberto da `spec.md` (e a linha 173 de `index.md`): US-1
 * (REQ-149, `must`) exige em CA-1.1, CA-1.2 e CA-1.3 que nenhum endereco externo
 * seja escrito sem cifra, que uma verificacao automatizada falhe ao encontrar um
 * e que a falha de negociacao segura *"resulte em erro da chamada, registrado,
 * nunca em tentativa sem cifra"*. A resposta 12 de `questions.md` decidiu o
 * contrario, e `BR-MIGRAR-115` (`ESC-HTTP`) a registra: o rebaixamento
 * *"migra inteiro: 13 canais nascem em `http://` e 7 repetem a requisicao em
 * claro"*, como **divida herdada reproduzida de proposito**. E o mesmo conflito
 * do descarte REQ-150, agora numa historia obrigatoria, e a tabela *Nao
 * negociavel* da constituicao poe *"resolver um dos conflitos entre card `wont`
 * e resposta humana"* e *"fechar o rebaixamento para canal sem cifra"* fora do
 * que um agente decide.
 *
 * Esta porta foi desenhada para que as DUAS leituras continuem possiveis, e e so
 * isso que T001 entrega sobre o assunto:
 *
 * - **O esquema da URL atravessa como foi escrito.** A porta nao promove
 *   `http://` para `https://` e nao recusa `http://`. No legado a promocao e
 *   decisao do chamador, com o endereco em claro guardado para a repeticao:
 *   `$url = 'http://api.wordpress.org/core/version-check/1.7/?'...`,
 *   `$http_url = $url`, `$ssl = wp_http_supports( array( 'ssl' ) )`, e so
 *   entao `$url = set_url_scheme( $url, 'https' )`
 *   (`wp-includes/update.php:226` a `:231`).
 * - **A falha volta como valor.** A repeticao em claro do legado e
 *   `if ( $ssl && is_wp_error( $response ) ) { ... $response = wp_remote_post(
 *   $http_url, $options ); }` (`:248` a `:258`) — uma SEGUNDA chamada, escrita a
 *   mao pelo chamador. Se a falha fosse excecao, nem a repeticao de `ESC-HTTP`
 *   nem o erro que REQ-149 pede caberiam no mesmo contrato.
 *
 * Quem pegar T003 (US-1) le aquela pergunta em aberto antes da primeira linha, e
 * nao escolhe um dos lados: para e escreve.
 *
 * **Falha e valor devolvido, nunca excecao.** No legado `WP_Http::request()`
 * devolve `WP_Error` e o chamador decide; os identificadores que a arvore
 * analisada produz nesta borda sao tres, e estao em
 * {@link ResultadoExterno}. A implicacao 4 do paradigma poe isso no contrato
 * (*falha de negocio e valor de retorno*), e CA-5.3 cobra erro
 * *"identificavel"*, que e o codigo e nao a classe da excecao.
 *
 * **O metodo e sincrono por AD-04:** *"`adaptadores/` e assincrono;
 * `contextos/` e `plataforma/` sao sincronos"*. A fronteira de `await` fica no
 * adaptador.
 *
 * ⚠️ **O que esta porta NAO tem, e cada ausencia tem motivo:**
 *
 * - **Nenhum valor de fabrica, nenhuma constante e nenhum ponto de configuracao
 *   de prazo.** A entrega de T001 termina em *"sem nenhuma politica de prazo ou
 *   de repeticao definida"*, e o prazo e de **T011** (US-5, REQ-154). Os valores
 *   do legado estao citados campo por campo abaixo como FATO com ancora, para
 *   que T011 nao precise redescobri-los; nenhum deles e codigo aqui. O P6 exige
 *   que cada numero viva *"num ponto de configuracao nomeado, com o valor de
 *   fabrica do legado"* — e e T011 que cria esses pontos.
 * - **Nenhuma politica de nova tentativa.** AD-06 e literal: *"nao ha broker,
 *   DLQ nem retry generico"*, e a repeticao do legado e escrita a mao onde ela
 *   existe (os 7 pontos de `ESC-HTTP`). Uma repeticao dentro da porta tornaria
 *   invisivel justamente o que o cenario `@divida-herdada` de `PT-017` compara:
 *   *"o conjunto de canais que repete e identico nas duas"*.
 * - **Nenhum limite de taxa e nenhum disjuntor.** `REQ-160` esta em
 *   `do-not-rewrite.md` (escopo recusado), o P6 recusa numero que o legado nao
 *   tem, e o cenario `@divida-herdada` de `PT-017` cobra que *"nenhuma das duas
 *   aplica limite de taxa"*.
 * - **Nenhum registro.** O P7 permite acrescentar registro, mas *"nenhuma
 *   decisao do sistema pode passar a depender dele"*; quem quiser registro poe
 *   no adaptador, so como escrita. REQ-159 (o registro estruturado) e de outra
 *   feature, e a `spec.md` o marca *"fora desta feature"*.
 * - **Nenhuma validacao de destino.** E US-2 (REQ-151), tarefa **T005**. No
 *   legado a validacao e `wp_http_validate_url()`
 *   (`wp-includes/http.php:559`), com as portas permitidas `80`, `443` e `8080`
 *   pelo filtro `http_allowed_safe_ports` (`:660`), e o que a porta carrega e o
 *   ARGUMENTO que a liga ({@link PedidoExterno.recusarUrlInsegura}), nao a
 *   regra.
 * - **Nenhuma credencial.** A precedencia de credencial (I1, `ambiente` vence
 *   `constante`, que vence `banco`) e US-3, tarefa **T007**, e e ela que declara
 *   a porta de dados deste contexto quando precisar do valor guardado.
 */

/**
 * O que sai numa chamada, com os 18 argumentos de `WP_Http::request()`
 * traduzidos (`wp-includes/class-wp-http.php:171` a `:232`).
 *
 * **Todo campo e obrigatorio**, e isso e a unica propriedade de politica que
 * T001 fixa: um pedido nao pode herdar valor por omissao. E o que CA-5.1 cobra
 * (*"toda chamada de saida declara o seu prazo de espera; nenhuma herda um valor
 * global por omissao"*) e o que CA-2.1 cobra para a validacao de destino
 * (*"nao validar exige declaracao explicita no ponto de chamada"*). Campo
 * obrigatorio e como "declaracao explicita" se torna verificavel pelo `tsc`, que
 * e o portao desta arvore.
 *
 * Cada valor de fabrica citado e FILTRAVEL no legado (BR-MIGRAR-108,
 * `ESC-FILTRAVEL`), e o P2 poe o ponto de extensao no contrato publico:
 * preservar o default filtravel e o porte. O nome do filtro vai junto do valor
 * para que a tarefa que criar o ponto de configuracao use o nome do legado.
 */
export interface PedidoExterno {
  /**
   * O endereco, com o esquema que o chamador escreveu.
   *
   * 🔴 A porta nao toca neste campo. Ver o cabecalho deste arquivo: e aqui que
   * o conflito REQ-149 x resposta 12 ficaria resolvido por acidente se a porta
   * promovesse ou recusasse esquema.
   */
  readonly url: string;

  /**
   * Metodo HTTP. Fabrica: `GET` (`class-wp-http.php:171`).
   *
   * E `string`, e nao uniao fechada, porque no legado `method` e texto livre
   * repassado ao transporte, e o adaptador de IA o copia do pedido PSR-7
   * (`wp-includes/ai-client/adapters/class-wp-ai-client-http-client.php:135`).
   */
  readonly metodo: string;

  /**
   * Versao do protocolo. Fabrica: `'1.0'`, pelo filtro `http_request_version`
   * (`class-wp-http.php:201`).
   *
   * Nao e campo decorativo: a arvore analisada o sobrescreve em tres lugares —
   * `'1.0'` nas duas notificacoes de link (`wp-includes/comment.php:3209` e
   * `:3231`), `'1.1'` no painel (`wp-admin/admin.php:88`) e a versao do pedido
   * PSR-7 no adaptador de IA (`class-wp-ai-client-http-client.php:137`).
   */
  readonly versaoDoProtocolo: string;

  /** Cabecalhos por nome. Fabrica: nenhum (`class-wp-http.php:223`). */
  readonly cabecalhos: Readonly<Record<string, string>>;

  /**
   * Cookies por nome. Fabrica: nenhum (`class-wp-http.php:224`).
   *
   * **Nenhuma chamada do nucleo desta versao define cookie de saida** —
   * conferido na arvore analisada, zero ocorrencia de `'cookies' =>` fora da
   * propria camada de transporte. O campo existe porque o argumento e publico e
   * o P8 recusa remover superficie publicada; a forma rica do legado
   * (`WP_Http_Cookie`, com prazo, caminho e dominio) nao esta declarada, e quem
   * portar um caminho que precise dela acrescenta aqui, com a ancora.
   */
  readonly cookies: Readonly<Record<string, string>>;

  /**
   * Corpo, ou `null` para sem corpo — que e a fabrica
   * (`class-wp-http.php:225`).
   */
  readonly corpo: string | null;

  /**
   * Tempo limite, em segundos.
   *
   * Fabrica: **5 s**, pelo filtro `http_request_timeout`
   * (`class-wp-http.php:181`). ⚠️ T001 **nao** declara esse 5 em codigo: a
   * entrega desta tarefa e *"sem nenhuma politica de prazo"*, e o prazo e de
   * **T011** (US-5). Os numeros que a arvore analisada ja escreve, para quem
   * pegar T011: `30` quando a verificacao de versao roda no agendador e `3`
   * quando nao (`wp-includes/update.php:237`), `300` no download de pacote
   * (`wp-admin/includes/file.php:1160`), `10` na prova do pingback
   * (`wp-includes/class-wp-xmlrpc-server.php:7090`) e `0.01` no disparo do
   * agendador (`wp-includes/cron.php:990`).
   *
   * 🔴 **E por este campo que passa a unica divergencia autorizada desta
   * feature**, e ela tem de ser citada no codigo que divergir (P1). A resposta
   * 18 manda *"definir o tempo limite no adaptador PSR-18 em vez de herdar o
   * default de 5 s"*, e `discard_log.md` registra a CORRECAO de premissa que
   * estreita o conserto: na arvore analisada o construtor de prompt ja usa
   * `$default_timeout = 30.0`
   * (`wp-includes/ai-client/class-wp-ai-client-prompt-builder.php:193`), e o
   * adaptador so define `timeout` quando recebe opcoes de requisicao
   * (`class-wp-ai-client-http-client.php:142` a `:144`) — logo os 5 s valem
   * apenas para o caminho SEM opcoes. T001 nao exerce a divergencia; ela e de
   * T011.
   */
  readonly tempoLimiteEmSegundos: number;

  /**
   * Quantos redirecionamentos seguir. Fabrica: **5**, pelo filtro
   * `http_request_redirection_count` (`class-wp-http.php:191`).
   *
   * Uma sutileza do legado que nao esta nesta porta e e fato: com metodo `HEAD`
   * o default cai para **0** (`class-wp-http.php:239` e `:240`). E regra do
   * default, logo e de quem portar os defaults (T011), e nao da borda.
   */
  readonly limiteDeRedirecionamentos: number;

  /**
   * Identificacao do cliente. Fabrica:
   * `WordPress/{versao}; {url do site}`, pelo filtro `http_headers_useragent`
   * (`class-wp-http.php:211`).
   */
  readonly agenteDeUsuario: string;

  /**
   * Recusar URL que aponte para destino interno. Fabrica: **false**, pelo filtro
   * `http_request_reject_unsafe_urls` (`class-wp-http.php:221`).
   *
   * **O default do legado e nao validar, e isso e a regra de negocio que US-2
   * registra:** *"a diferenca entre a API validada e a nao validada e um
   * argumento, e o default e nao validar"*. As quatro funcoes `wp_safe_remote_*`
   * forcam `true` com uma linha (`$args['reject_unsafe_urls'] = true;`,
   * `wp-includes/http.php:53`). A inversao que CA-2.1 pede — validar por padrao,
   * com recusa explicita no ponto de chamada — e de **T005**, nao desta tarefa;
   * campo obrigatorio apenas garante que ninguem o omita sem dizer.
   */
  readonly recusarUrlInsegura: boolean;

  /**
   * Esperar a resposta. Fabrica: **true** (`class-wp-http.php:222`).
   *
   * ⚠️ Existe por causa de UM chamador, e por causa de AD-07. O disparo do
   * agendador passa `false` com tempo limite `0.01`
   * (`wp-includes/cron.php:990` e `:991`), e a decisao arquitetural diz que
   * *"o disparo nao bloqueante tem de FALHAR, e o critario de aceite e a
   * falha"*, porque `R5` e o ADR-0006 dependem disso: um site que ninguem
   * administra nunca executa a propria limpeza. Em PHP o disparo aborta a
   * requisicao de saida; num runtime de laco de eventos a requisicao pode
   * COMPLETAR, e e assim que um porte conserta por acidente o que o produto faz.
   *
   * Reproduzir isso e do adaptador e de BC-11. O que esta porta tem de garantir
   * e que a chamada seja expressavel e que a resposta dela atravesse: com
   * `blocking` falso o legado devolve resposta com `code` e `message`
   * **`false`** e corpo vazio (`class-wp-http.php:446` a `:456`) — e e por isso
   * que {@link RespostaExterna.codigo} admite `false`.
   */
  readonly bloqueante: boolean;

  /**
   * Pedir compressao no envio. Fabrica: **false** (`class-wp-http.php:226`).
   *
   * Nenhuma chamada do nucleo desta versao o define (zero ocorrencia de
   * `'compress' =>` fora da camada de transporte). Esta aqui pelo P8: argumento
   * publicado nao se remove.
   */
  readonly comprimirPedido: boolean;

  /**
   * Descomprimir a resposta. Fabrica: **true** (`class-wp-http.php:227`).
   * Tambem sem chamador no nucleo desta versao, e tambem presente pelo P8.
   */
  readonly descomprimirResposta: boolean;

  /**
   * Verificar o certificado do par. Fabrica: **true**
   * (`class-wp-http.php:228`), com dois filtros que o alteram: `https_ssl_verify`
   * (`class-wp-http.php:393`) e `https_local_ssl_verify` para chamada ao proprio
   * site, cujo default e **false** — e e esse que o agendador usa
   * (`wp-includes/cron.php:993`) e o diagnostico de cache de pagina tambem
   * (`wp-admin/includes/class-wp-site-health.php:3615`).
   *
   * 🔴 O campo nao resolve o conflito de REQ-149: desligar a verificacao e
   * `ESC-HTTP` em outro eixo, e AD-09 manda o adaptador **reproduzir** o modo de
   * falha. Nenhum codigo deste modulo o altera.
   */
  readonly verificarCertificado: boolean;

  /**
   * Pacote de autoridades a usar, ou `null` para o do legado — que e
   * `ABSPATH . WPINC . '/certificates/ca-bundle.crt'`
   * (`class-wp-http.php:229`).
   *
   * `null` aqui nao e prazo herdado: e o arquivo que o legado embarca, e nenhuma
   * chamada do nucleo desta versao o sobrescreve (zero ocorrencia de
   * `'sslcertificates' =>`). Qual arquivo responde a `null` e fato do adaptador,
   * nao politica deste contexto.
   */
  readonly certificadosDeAutoridade: string | null;

  /**
   * Gravar a resposta em arquivo em vez de devolve-la no corpo. Fabrica:
   * **false** (`class-wp-http.php:230`).
   *
   * E o caminho do download de pacote, que e o maior consumidor de chamada de
   * saida do sistema: `download_url()` passa `'stream' => true` com
   * `'filename' => $tmpfname` (`wp-admin/includes/file.php:1181` e `:1182`).
   * Duas consequencias observaveis, as duas do legado: com `stream` ligado o
   * `blocking` e forcado a `true` (`class-wp-http.php:318`), e o corpo da
   * resposta chega vazio porque os bytes foram para o arquivo.
   */
  readonly gravarEmArquivo: boolean;

  /**
   * Caminho do arquivo de destino quando {@link gravarEmArquivo} esta ligado, ou
   * `null` — que e a fabrica (`class-wp-http.php:231`).
   *
   * O legado resolve o `null` sozinho (`get_temp_dir() . basename( $url )`,
   * `class-wp-http.php:312` a `:314`) e devolve erro quando a pasta nao e
   * gravavel, com o identificador `http_request_failed` (`:320`). Nenhuma das
   * duas coisas e desta porta: o nome chega decidido, como na porta de sistema
   * de arquivos de BC-04.
   */
  readonly nomeDeArquivo: string | null;

  /**
   * Teto de bytes lidos do corpo da resposta, ou `null` para sem teto — que e a
   * fabrica (`class-wp-http.php:232`).
   *
   * **E observavel, e e numero do legado:** 150 KB na prova do pingback
   * (`class-wp-xmlrpc-server.php:7092`), 150 KB no oEmbed
   * (`class-wp-oembed.php:496`), 150 KB na leitura de detalhes de URL
   * (`class-wp-rest-url-details-controller.php:238`) e 10 KB na leitura de
   * assinatura de pacote (`wp-admin/includes/file.php:1322`). Um link que
   * aparece depois do teto **nao** e prova, e CA-2.3 cobra o teto declarado em
   * toda resposta — a regra e de T005, o campo e de T001.
   */
  readonly limiteDeBytesDaResposta: number | null;
}

/**
 * A resposta de uma chamada que completou, qualquer que seja o codigo. Os campos
 * sao os do arranjo que `WP_Http::request()` devolve
 * (`class-wp-http.php:446` a `:456` no caso nao bloqueante, e
 * `class-wp-http-requests-response.php:185` a `:196` no caso normal, que e o
 * `to_array()` do envelope de resposta).
 */
export interface RespostaExterna {
  /**
   * Codigo HTTP, ou **`false`** quando a chamada foi nao bloqueante: o legado
   * devolve `'response' => array( 'code' => false, 'message' => false )`
   * (`class-wp-http.php:450` a `:453`).
   *
   * Este `false` e o que torna a falha do disparo do agendador observavel sem
   * ser erro, que e exatamente o estado que AD-07 manda preservar. Quem o
   * trocar por `0` ou por `null` muda o que o chamador compara.
   */
  readonly codigo: number | false;

  /**
   * A frase de estado que acompanha o codigo (`'OK'`, `'Not Found'`), ou
   * `false` no mesmo caso nao bloqueante acima. E o que
   * `wp_remote_retrieve_response_message()` devolve, e ela chega ao chamador
   * tal como veio.
   */
  readonly mensagemDoEstado: string | false;

  /** Cabecalhos da resposta, por nome em minusculas. */
  readonly cabecalhos: Readonly<Record<string, string>>;

  /**
   * Corpo lido, ja respeitando {@link PedidoExterno.limiteDeBytesDaResposta}.
   *
   * E `string` porque e string no legado, e o caminho binario nao passa por
   * aqui: o pacote vai para arquivo por {@link PedidoExterno.gravarEmArquivo} e
   * o chamador le {@link nomeDeArquivo}. Vazio quando a chamada foi nao
   * bloqueante (`class-wp-http.php:449`).
   */
  readonly corpo: string;

  /** Cookies devolvidos, por nome. Fabrica da resposta: nenhum. */
  readonly cookies: Readonly<Record<string, string>>;

  /**
   * Caminho do arquivo gravado, quando houve gravacao, ou `null`.
   *
   * ⚠️ O arranjo do legado tem um sexto campo, `http_response`, com o objeto do
   * transporte, e o ponto de filtro `http_response`
   * (`class-wp-http.php:468`) o entrega as extensoes. Ele **nao** esta
   * declarado aqui: e a instancia da biblioteca de transporte do legado, e
   * declarar objeto de adaptador na porta quebraria a regra de dependencia 4.
   * Fica registrado para quem revisar a superficie do ponto de filtro, que o P2
   * poe no contrato publico.
   */
  readonly nomeDeArquivo: string | null;
}

/**
 * O resultado de uma tentativa.
 *
 * Resposta HTTP de erro — 404, 500 — e `completou: true` com o codigo dela: o
 * que e `completou: false` e a chamada que nao produziu resposta nenhuma, que no
 * legado e `WP_Error`. A distincao e a mesma que o chamador do legado faz com
 * `is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code(
 * $response )` (`wp-includes/update.php:261`), e ela importa porque a repeticao
 * em claro de `ESC-HTTP` so acontece no primeiro caso (`:248`).
 *
 * O `codigo` da falha e `string`, e nao uniao fechada, por duas razoes: os tres
 * identificadores que esta borda produz na arvore analisada sao
 * `http_request_failed` (`class-wp-http.php:295`, `:320`, `:425`, `:1070`),
 * `http_request_not_executed` (`:303`, o caso de
 * `WP_HTTP_BLOCK_EXTERNAL`/`WP_ACCESSIBLE_HOSTS`, `:895`) e `http_failure`
 * (`:603`); e o ponto de extensao `pre_http_request` (`:277`) permite a uma
 * extensao curto-circuitar a chamada devolvendo um erro com identificador
 * proprio, o que o P2 poe no contrato publico. Fechar a uniao recusaria o que o
 * legado aceita.
 */
export type ResultadoExterno =
  | { readonly completou: true; readonly resposta: RespostaExterna }
  | {
      readonly completou: false;
      readonly codigo: string;
      readonly mensagem: string;
    };

export interface PortaDeClienteExterno {
  /**
   * Faz UMA chamada. Nao lanca: a falha volta como `completou: false`.
   *
   * Uma, e nao "uma com repeticao": a repeticao do legado e uma segunda chamada
   * escrita pelo chamador (`wp-includes/update.php:258`), e AD-06 recusa retry
   * de infraestrutura.
   */
  chamar(pedido: PedidoExterno): ResultadoExterno;
}
