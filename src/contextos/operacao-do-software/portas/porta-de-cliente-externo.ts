/**
 * Porta de cliente HTTP de saida do modulo de operacao do software (BC-11).
 *
 * Primeira das cinco bordas de AD-08, e a primeira porta do plano de migracao
 * por decisao registrada em `architectures.json`. O slot e `cliente-http`
 * (`plan.md`), recomendado como `undici`, e a razao registrada em
 * `tech-stack.json` diz exatamente o que esta porta tem de admitir: *"precisa
 * reproduzir requisicao nao bloqueante, TLS nao verificado e repeticao em claro
 * sem lutar contra a biblioteca"*.
 *
 * Esta feature usa a borda em tres papeis, e os tres estao nos casos de uso:
 *
 * 1. **Perguntar o que existe.** UC-33 passo 3 e UC-35 passo 2 consultam o
 *    servico de distribuicao (`wp-includes/update.php:246` para o nucleo, `:472`
 *    para plugins, `:758` para temas). CA-1.2 e CA-7.2 cobram isso.
 * 2. **Baixar o pacote.** UC-33 passo 4. E `download_url()`
 *    (`wp-admin/includes/file.php:1160`), que e {@link PortaDeClienteExterno.baixar}
 *    e nao {@link PortaDeClienteExterno.chamar} — ver o metodo.
 * 3. **Pedir a propria pagina de volta.** CA-14.3: o teste de requisicao do site
 *    para si mesmo *"e executado e o seu resultado e apresentado em primeiro
 *    lugar, porque sem ele nenhum trabalho agendado roda"*
 *    (`wp-admin/includes/class-wp-site-health.php:3303`).
 *
 * 🔴 **A repeticao em canal sem cifra atravessa esta porta, e e de proposito.**
 * `ESC-HTTP`/BR-MIGRAR-115 registra o rebaixamento como divida herdada
 * reproduzida por decisao (resposta 12 de `questions.md`), e a tabela *Nao
 * negociavel* da constituicao proibe fechar o rebaixamento sem decisao humana. O
 * caminho e literal no legado e esta **dentro desta feature**: a URL de consulta
 * nasce em `http://` (`wp-includes/update.php:226`), e promovida a `https` so se
 * o transporte suportar TLS (`:231`), e quando a chamada cifrada falha o legado
 * emite aviso e **repete a mesma chamada na URL em claro** (`:258`). A mesma
 * sequencia existe para plugins (`:484`) e para temas (`:770`).
 *
 * **A repeticao e politica de quem chama, nao desta porta.** AD-06 e explicito:
 * *"nao ha broker, DLQ nem retry generico"*, e a politica de nova tentativa do
 * legado e escrita a mao onde ela existe. Aqui isso importa duas vezes: a
 * repeticao em claro e um `if` do chamador, e `A6` da **exatamente uma** segunda
 * chance em uma hora, sem notificar — recuo exponencial de biblioteca sobrepoe as
 * duas e muda quantos e-mails o administrador recebe, que e o criterio de aceite
 * declarado de PT-013.
 *
 * **Falha e valor devolvido, nunca excecao.** `WP_Http::request()` devolve
 * `WP_Error`, e aqui a consequencia e direta: `A6` classifica
 * `download_failed` como falha **transitoria** e `A5` classifica a falha de
 * copia como **critica** (`class-wp-automatic-updater.php:855` e `:816`). A
 * classificacao e feita sobre um **codigo de erro**, logo o codigo tem de
 * atravessar a borda como dado. Excecao aqui apagaria a distincao de que
 * dependem CA-9.1, CA-9.2 e CA-9.3.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`. O passo 1 de UC-35 esta marcado `async` na tabela de sequencia
 * porque o **agendador** o aciona, nao porque a chamada devolva promessa: no
 * legado toda chamada de `wp_remote_*` e sincrona e bloqueante.
 *
 * ⚠️ **O disparo deliberadamente nao bloqueante NAO esta aqui.** Tempo limite de
 * 0,01 s e `blocking` falso sao do **disparo da fila agendada**, que e trabalho
 * da feature `011` (`plan.md`: *"a verificacao de atualizacao e a atualizacao
 * automatica sao trabalho agendado"*), e AD-07 poe a FALHA desse disparo como
 * criterio de aceite daquele contexto. Nenhuma das tres chamadas desta feature e
 * nao bloqueante: as duas de consulta esperam a resposta porque e dela que sai a
 * oferta, e a de loopback espera porque o resultado dela **e** o diagnostico. E
 * `stream` forca `blocking` a verdadeiro no proprio legado
 * (`wp-includes/class-wp-http.php:318`), logo o download tambem espera.
 * Acrescentar o campo aqui seria declarar superficie que este modulo nao usa.
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
   * repassado ao transporte. As tres chamadas desta feature usam `POST` para
   * consultar o servico de distribuicao e para o loopback de `wp-cron.php` — e o
   * comentario de `class-wp-site-health.php:3293` explica por que o loopback usa
   * `POST`: *"to cause the file to finish early without triggering cron jobs"*,
   * o que e divergencia **declarada no proprio legado** em relacao ao `GET` que
   * o disparo real usa.
   */
  readonly metodo: string;
  /** Cabecalhos por nome. Fabrica: nenhum. */
  readonly cabecalhos: Readonly<Record<string, string>>;
  /**
   * Cookies repassados, por nome.
   *
   * ⚠️ Existe porque os dois testes de loopback **reenviam os cookies do ator**:
   * `$cookies = wp_unslash( $_COOKIE )`
   * (`class-wp-site-health.php:3277` e `:2209`). E o que faz o site pedir a
   * propria pagina **como aquela pessoa**, e e fato observavel do diagnostico,
   * nao detalhe de transporte. As duas chamadas ao servico de distribuicao nao
   * passam cookie nenhum.
   */
  readonly cookies: Readonly<Record<string, string>>;
  /** Corpo, quando ha. Fabrica: nenhum. */
  readonly corpo: string | null;
  /**
   * Tempo limite. Fabrica: **5 s**, pelo filtro `http_request_timeout`
   * (`class-wp-http.php:181`).
   *
   * Os tres numeros desta feature sao outros, e cada um e lido do legado:
   * **3 s** na consulta de versao em requisicao comum e **30 s** quando ela roda
   * pela fila agendada (`wp-includes/update.php:237`, `$doing_cron ? 30 : 3`);
   * **10 s** nos dois testes de loopback (`class-wp-site-health.php:3278` e
   * `:2210`, com o comentario `// 10 seconds.`); e **300 s** no download do
   * pacote, que e o default do proprio `download_url()`
   * (`wp-admin/includes/file.php:1160`). O P6 cobra que cada um viva num ponto
   * nomeado com o valor de fabrica: nomea-los e de T002 em diante, porque T001
   * nao faz chamada nenhuma.
   */
  readonly tempoLimiteEmSegundos: number;
  /**
   * Quantos redirecionamentos seguir. Fabrica: **5**
   * (`class-wp-http.php:191`), e **0** quando o metodo e `HEAD` (`:240`).
   */
  readonly limiteDeRedirecionamentos: number;
  /**
   * Teto de bytes lidos do corpo da resposta, ou `null` para sem teto — que e a
   * fabrica (`class-wp-http.php:232`) e o que as tres chamadas desta feature
   * usam.
   */
  readonly limiteDeBytesDaResposta: number | null;
  /**
   * Identificacao do cliente. Fabrica: `WordPress/{versao}; {url do site}` pelo
   * filtro `http_headers_useragent` (`class-wp-http.php:211`). A consulta de
   * versao monta a mesma forma a mao (`wp-includes/update.php:238`).
   */
  readonly agenteDeUsuario: string;
  /**
   * Verificar o certificado do par. Fabrica: **true**
   * (`class-wp-http.php:228`).
   *
   * 🔴 **Nos dois testes de loopback desta feature o valor e `false`**, e nao por
   * descuido: o filtro `https_local_ssl_verify` nasce em `false`
   * (`class-wp-site-health.php:3291` e `:2231`). AD-09 manda o adaptador
   * **reproduzir** o modo de falha do legado, e a resposta 12 registra o
   * rebaixamento como divida herdada reproduzida de proposito. Nenhum codigo
   * deste modulo altera este campo; quem for escrever o adaptador le AD-09 antes.
   */
  readonly verificarCertificado: boolean;
  /**
   * Recusar URL que aponte para destino interno. Fabrica: **false**, pelo filtro
   * `http_request_reject_unsafe_urls` (`class-wp-http.php:221`) — e as quatro
   * funcoes `wp_safe_remote_*` forcam **true** (`wp-includes/http.php`).
   *
   * Aqui a diferenca e observavel e vai nos dois sentidos: o download do pacote
   * usa a variante segura (`wp_safe_remote_get`,
   * `wp-admin/includes/file.php:1177`), e o teste de loopback aponta **para
   * dentro** de proposito, o que so funciona porque ele usa a variante comum.
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
   * E `string` porque os corpos que esta feature le por {@link
   * PortaDeClienteExterno.chamar} sao texto: a oferta de versoes, serializada
   * pelo servico de distribuicao, e o corpo do loopback. O pacote, que e
   * binario, **nao passa por aqui** — ver {@link PortaDeClienteExterno.baixar}.
   */
  readonly corpo: string;
}

/**
 * O resultado de uma tentativa. Resposta HTTP de erro — 404, 500 — e
 * `completou: true` com o codigo dela: o que e `completou: false` e a chamada
 * que nao produziu resposta nenhuma.
 *
 * `codigoDeErro` existe porque `A5` e `A6` classificam a falha **por codigo**:
 * `incompatible_archive`, `download_failed`, `insane_distro` e `locked` sao
 * transitorios (`class-wp-automatic-updater.php:855`) e tudo o que acontece
 * depois do inicio da copia e critico (`:816`). Sem o codigo atravessando a
 * borda, CA-9.4 — *"a classificacao de cada tipo de falha e declarada em um
 * lugar so"* — nao tem o que classificar.
 */
export type ResultadoExterno =
  | { readonly completou: true; readonly resposta: RespostaExterna }
  | {
      readonly completou: false;
      readonly codigoDeErro: string;
      readonly motivo: string;
    };

/**
 * O resultado de um download. O corpo nao volta como valor: volta como arquivo.
 *
 * O caminho e o do arquivo temporario que o transporte escreveu, e quem recebe
 * **e dono dele** — o aviso esta na primeira linha de `download_url()`:
 * *"WARNING: The file is not automatically deleted, the script must delete or
 * move the file"* (`wp-admin/includes/file.php:1161`). E o que CA-5.2 cobra ao
 * exigir que *"o diretorio temporario e limpo em todo caminho de saida, inclusive
 * no de erro"*.
 */
export type ResultadoDeDownload =
  | { readonly completou: true; readonly caminho: string }
  | {
      readonly completou: false;
      readonly codigoDeErro: string;
      readonly motivo: string;
    };

export interface PortaDeClienteExterno {
  /** Faz a chamada. Nao lanca: a falha volta como `completou: false`. */
  chamar(pedido: PedidoExterno): ResultadoExterno;

  /**
   * Baixa o conteudo da URL para o caminho informado (o `stream`/`filename` de
   * `WP_Http`, usado por `download_url()`).
   *
   * ⚠️ **Esta operacao escreve em disco sem passar pela porta de sistema de
   * arquivos, e a assimetria e do legado.** `download_url()` chama
   * `wp_safe_remote_get` com `'stream' => true` e `'filename' => $tmpfname`
   * (`wp-admin/includes/file.php:1177` a `:1184`), e e o **transporte HTTP** que
   * grava o arquivo; depois o legado o apaga com `unlink()` direto (`:1187`,
   * `:1353`), nao com `$wp_filesystem->delete()`. E observavel: o arquivo
   * temporario nasce com a identidade do processo, nao com a da credencial de
   * FTP ou de SSH que o `WP_Filesystem` usaria — e e por isso que uma instalacao
   * que precisa de credencial remota ainda consegue baixar, e so falha ao
   * **aplicar**. Separar as duas aqui mantem essa diferenca portavel; unifica-las
   * atras da porta de arquivos a apagaria.
   *
   * ⚠️ **Nao verifica assinatura.** `download_url()` recebe
   * `$signature_verification` e no legado ele chega **falso** no caminho padrao;
   * mesmo quando chega verdadeiro, `wp_trusted_keys()` devolve lista vazia desde
   * 1 de abril de 2021 (`wp-admin/includes/file.php:1548`, com o
   * `// TODO: Add key #2 with longer expiration.` ao lado, em `:1553`) e a falha
   * e rebaixada a aviso pelo filtro `wp_signature_softfail`, que nasce
   * verdadeiro (`:1348`), com o caso *"sem assinatura"* silenciado fora do modo
   * de depuracao (`class-wp-upgrader.php:858`). 🔴 **Isto e o conflito mais
   * consequente do pacote e nao esta resolvido:** US-2 exige a verificacao, a
   * resposta 11 e o ADR 0010 mandam manter a tolerancia, e a `spec.md` registra o
   * conflito na secao *Perguntas em aberto*. T001 nao decide: a porta nao tem
   * campo de assinatura nem de veredito, porque declarar um dos dois seria tomar
   * o lado. Quem pegar T005 le aquela pergunta antes da primeira linha.
   */
  baixar(pedido: PedidoExterno, destino: string): ResultadoDeDownload;
}
