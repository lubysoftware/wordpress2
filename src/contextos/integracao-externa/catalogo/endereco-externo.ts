/**
 * A forma de uma linha do catalogo de enderecos externos.
 *
 * Tarefa **T002** da feature `014-integracao-externa`, cuja entrega e *"os
 * enderecos dos servicos externos estao num registro unico e inspecionavel, com
 * o esquema de cada um explicito, de modo que a pergunta 'quantos canais nascem
 * sem cifra' tenha resposta por consulta e nao por varredura de codigo"*.
 * `satisfaz: — (infraestrutura)`: nenhum criterio de aceite desta feature fecha
 * aqui, e **nenhuma regra de negocio esta implementada**. O que ha e dado
 * transcrito do legado, com ancora por linha, e os tipos que o tornam
 * consultavel pelo `tsc`.
 *
 * O `plan.md` da feature diz, na tabela de modelo de dados, exatamente o que
 * esta tarefa muda:
 *
 * > | catalogo de servicos externos | espalhado pelo codigo, com o endereco
 * > escrito em cada ponto de chamada | a tarefa T002 de `tasks.md` o transforma
 * > em dado declarado, para que "quantos canais nascem sem cifra" seja consulta
 * > e nao varredura |
 *
 * ## 🔴 Este arquivo NAO resolve o conflito de REQ-149, e foi desenhado para nao o resolver
 *
 * A primeira *Pergunta em aberto* da `spec.md` (linha 173 de `index.md`) e um
 * conflito entre **duas decisoes humanas em sentidos opostos**: US-1 (REQ-149,
 * `must`) exige em CA-1.1 que *"nenhum endereco de servico externo e escrito com
 * esquema sem cifra no codigo"*, e a resposta 12 decidiu manter o rebaixamento,
 * registrada em `BR-MIGRAR-115` (`ESC-HTTP`) — *"13 canais nascem em `http://` e
 * 7 repetem a requisicao em claro"*, como **divida herdada reproduzida de
 * proposito**. A tabela *Nao negociavel* da constituicao poe os dois lados fora
 * do que um agente decide: *"resolver um dos conflitos entre card `wont` e
 * resposta humana"* e *"fechar o rebaixamento para canal sem cifra"*.
 *
 * O catalogo fica de fora da briga porque **declara o esquema como um FATO do
 * legado, em campo proprio, e nao monta URL para ninguem**:
 *
 * - {@link EnderecoExterno.enderecoNoLegado} e o endereco **como o legado o
 *   escreve**, com o esquema que esta no arquivo citado. Nao e "o endereco que o
 *   sistema novo usa": nao ha, nesta tarefa, nenhum codigo que chame nenhum
 *   deles.
 * - {@link EnderecoExterno.cifraDeNascimento} e a leitura desse fato, e e por
 *   ela que a pergunta da entrega se responde por consulta.
 * - {@link EnderecoExterno.promovidoSeOAmbienteSuportar} e
 *   {@link EnderecoExterno.repeteEmClaroNaFalha} separam as duas metades de
 *   `ESC-HTTP`, que no legado sao codigo diferente em linhas diferentes: a
 *   promocao e `set_url_scheme( $url, 'https' )` sob
 *   `wp_http_supports( array( 'ssl' ) )`, e a repeticao e uma SEGUNDA chamada
 *   escrita a mao no `is_wp_error`.
 *
 * Quem pegar **T003** le a pergunta em aberto antes da primeira linha e **nao
 * escolhe um dos lados**: para e escreve. Com este catalogo, qualquer um dos
 * dois lados se implementa lendo o mesmo dado — promover tudo, ou reproduzir o
 * que esta declarado — e e so isso que T002 entrega sobre o assunto.
 *
 * ⚠️ **Nada aqui e a verificacao automatizada de CA-1.2.** Aquele criterio pede
 * uma verificacao que *"varre o codigo e falha quando encontra endereco externo
 * sem cifra"*, e e ela que esta no centro do conflito: com o catalogo como esta,
 * ela falharia em 13 linhas que a resposta 12 manda manter. As consultas de
 * `./consultas.ts` **listam e contam**, e nao reprovam nada.
 */

/**
 * De onde vem a declaracao do endereco: o nucleo clonado ou uma extensao que o
 * legado empacota.
 *
 * 🔴 O campo existe por causa da **quarta** pergunta em aberto da `spec.md`: *"o
 * servico externo de reputacao aparece nas integracoes desta feature, e a
 * resposta 13 o poe fora do nucleo clonado, como extensao empacotada. Isso muda
 * o que esta feature precisa entregar, e a decisao de escopo nao esta registrada
 * em card nenhum"*. T002 **nao decide** o escopo: declara os enderecos daquele
 * servico com `fonte: 'extensao-empacotada'` e os deixa separaveis por consulta,
 * de modo que quem responder a pergunta nao precise reabrir o catalogo — so
 * filtra. Omiti-los seria ter decidido pelo descarte; declara-los como nucleo
 * seria ter decidido pelo contrario.
 */
export type FonteDoEndereco = 'nucleo' | 'extensao-empacotada';

/**
 * O protocolo em que o canal fala.
 *
 * `'http'` cobre tambem o que viaja DENTRO de HTTP, e e assim no legado: a
 * notificacao de agregador e o pingback sao XML-RPC sobre
 * `wp_safe_remote_post` (`wp-includes/class-wp-http-ixr-client.php:92`), e o
 * consumo de oEmbed e `wp_safe_remote_get`
 * (`wp-includes/class-wp-oembed.php:634`). Separar "XML-RPC" de "HTTP" aqui
 * inventaria uma distincao que o cliente do legado nao faz.
 *
 * Os outros quatro existem porque **o canal sem cifra do legado nao e so
 * `http://`**: a caixa postal e `fsockopen()` cru
 * (`wp-includes/class-pop3.php:100`) e o sistema de arquivos remoto nasce em FTP
 * puro na porta 21 (`wp-admin/includes/class-wp-filesystem-ftpext.php:135`).
 * Um catalogo que so soubesse falar de esquema de URL esconderia dois dos cinco
 * achados de seguranca que BC-13 existe para *"auditar de uma vez"*
 * (`target_architecture.md`, BC-13).
 */
export type ProtocoloDeSaida =
  | 'http'
  | 'pop3'
  | 'smtp-local'
  | 'ftp'
  | 'ssh2'
  | 'mysql';

/**
 * O esquema com que o canal **nasce**, que e a pergunta da entrega.
 *
 * - `'sem-cifra'`: o legado escreve o endereco em claro — `http://` literal, ou
 *   um protocolo sem TLS. E o conjunto que a consulta
 *   {@link ../consultas.canaisQueNascemSemCifra} devolve.
 * - `'cifrado'`: o legado escreve o endereco com cifra, `https://` literal ou
 *   TLS exigido pelo protocolo.
 * - `'do-dado'`: **o esquema nao esta no codigo.** Vem da resposta de outro
 *   servico, do valor de uma opcao, do conteudo do site, do tema ou da URL do
 *   proprio site. Dizer `'sem-cifra'` ou `'cifrado'` aqui seria afirmar sobre
 *   dado de instalacao, que esta tarefa nao tem.
 * - `'sem-endereco-no-codigo'`: nao ha endereco a classificar. Sao dois casos, e
 *   os dois sao fato do legado: o transporte de e-mail de fabrica e
 *   `$phpmailer->isMail()`, a funcao `mail()` do PHP, sem endereco
 *   (`wp-includes/pluggable.php:505`); e a URL base dos conectores de modelo de
 *   linguagem e **metodo abstrato sem implementacao nesta arvore**
 *   (`wp-includes/php-ai-client/src/Providers/ApiBasedImplementation/AbstractApiProvider.php:28`).
 */
export type CifraDeNascimento =
  | 'sem-cifra'
  | 'cifrado'
  | 'do-dado'
  | 'sem-endereco-no-codigo';

/**
 * Onde o endereco esta escrito. E o que separa *"endereco no codigo"* de
 * *"endereco que chega como dado"*, e e a distincao de que US-2 depende
 * (*"validar o destino de toda requisicao de saida cuja URL vem de dado"*).
 *
 * `'padrao-de-opcao'` e o caso mais incomodo do legado e tem regra de negocio
 * propria em US-8: *"o endereco do servico de notificacao e valor padrao de uma
 * opcao semeada na instalacao"* — publicar num site de fabrica avisa um terceiro
 * sem ninguem ter escolhido isso (`wp-admin/includes/schema.php:450`).
 */
export type OrigemDoEndereco =
  | 'literal-no-codigo'
  | 'padrao-de-opcao'
  | 'valor-de-opcao'
  | 'constante-de-configuracao'
  | 'resposta-de-outro-servico'
  | 'conteudo-do-site'
  | 'declarado-pelo-tema'
  | 'url-do-proprio-site'
  | 'sem-endereco-no-codigo';

/**
 * O que o legado faz com o certificado do par naquele canal. E o **segundo eixo**
 * de `ESC-HTTP`, independente do esquema, e sem ele o catalogo responderia
 * "cifrado" sobre canal que nao autentica ninguem.
 *
 * - `'exigida'`: vale o default `sslverify => true`
 *   (`wp-includes/class-wp-http.php:228`).
 * - `'desligada'`: o chamador passa o default do filtro
 *   `https_local_ssl_verify`, que e **false**. Sao quatro pontos, todos de
 *   chamada ao proprio site: `wp-includes/cron.php:993`,
 *   `wp-admin/includes/class-wp-site-health.php:2231`, `:3291` e `:3615`.
 * - `'repete-sem-verificar'`: a deteccao de HTTPS tenta com verificacao e, se
 *   falhar, **repete a mesma chamada sem verificar**, registrando
 *   `'ssl_verification_failed'` (`wp-includes/https-detection.php:113` e
 *   `:124`). E rebaixamento sem trocar o esquema.
 * - `'nao-se-aplica'`: canal que nao negocia TLS, ou que nao tem endereco.
 */
export type VerificacaoDeCertificado =
  | 'exigida'
  | 'desligada'
  | 'repete-sem-verificar'
  | 'nao-se-aplica';

/**
 * Se aquele ponto de chamada do legado usa a variante **validada** do cliente.
 *
 * E dado, nao regra: a regra e US-2 (REQ-151), tarefa **T005**, e a propria
 * `spec.md` registra que *"no legado, a diferenca entre a API validada e a nao
 * validada e um argumento, e o default e nao validar"* — as quatro funcoes
 * `wp_safe_remote_*` forcam `reject_unsafe_urls` com uma linha
 * (`wp-includes/http.php:53`). Esta coluna existe porque CA-2.4 cobra
 * *"uma verificacao automatizada [que] lista os pontos de chamada que optaram
 * por nao validar"*, e essa lista e **consulta ao catalogo**, nao varredura de
 * codigo. Quem fecha T005 le daqui; T002 nao recusa nada.
 */
export type ValidacaoDeDestino = 'validada' | 'nao-validada' | 'nao-se-aplica';

/** Criticidade da integracao, como a analise do legado a classificou. */
export type CriticidadeDoServico = 'alta' | 'media' | 'baixa';

/**
 * Uma linha do catalogo: **um endereco de saida**, com o esquema explicito.
 *
 * A granularidade e a do artefato de analise que o pacote conta na `spec.md`
 * (*"sao 29 integracoes e 64 endpoints catalogados"*): uma linha por *endpoint*
 * de integracao de saida, com o texto do endereco transcrito e nao reescrito.
 * Manter a granularidade e o que torna a contagem **reproduzivel** por quem
 * revisar — ver a aritmetica em `./catalogo-de-enderecos.ts`.
 *
 * **Todo campo e obrigatorio.** E a mesma propriedade que T001 fixou na porta: o
 * que nao se declara, nao se herda em silencio. Num catalogo isso vale dobrado,
 * porque campo ausente viraria "nao sei" indistinguivel de "nao se aplica" — e e
 * exatamente a diferenca entre as duas que este arquivo precisa preservar
 * ({@link CifraDeNascimento} tem um valor para cada).
 */
export interface EnderecoExterno {
  /** Identificador estavel da linha, em kebab-case. Unico no catalogo. */
  readonly id: string;

  /** O {@link ServicoExterno.id} a que esta linha pertence. */
  readonly servico: string;

  /**
   * O endereco **como o legado o escreve**, ou `null` quando nao ha endereco no
   * codigo.
   *
   * 🔴 Texto, e nao URL montada: onde o legado escreve um pedaco e completa com
   * dado, o pedaco esta aqui entre `<` e `>` como o artefato de analise o
   * escreve (`'<FTP_HOST>:<porta, 21 por padrao>'`). Quem transformar isto em
   * requisicao monta o endereco no ponto de chamada, com o esquema que a decisao
   * humana de REQ-149 mandar — e e por isso que este campo **nao** se chama
   * "url".
   */
  readonly enderecoNoLegado: string | null;

  /**
   * Metodo ou comando, transcrito do legado (`'GET'`, `'POST'`,
   * `'XML-RPC weblogUpdates.extendedPing'`, `'USER / PASS / LIST / RETR /
   * DELE / QUIT'`).
   *
   * E `string` livre pela mesma razao que o campo `metodo` da porta e
   * (`portas/porta-de-cliente-externo.ts`): no legado `method` e texto
   * repassado ao transporte, e aqui ha canal que nao e HTTP.
   */
  readonly metodo: string;

  /** Para que o legado faz esta chamada. */
  readonly paraQue: string;

  readonly protocolo: ProtocoloDeSaida;

  /** O esquema com que o canal nasce. E a coluna da pergunta da entrega. */
  readonly cifraDeNascimento: CifraDeNascimento;

  /**
   * Se o legado promove o endereco a cifrado quando o ambiente suporta.
   *
   * No legado e sempre o mesmo par de linhas: `wp_http_supports( array( 'ssl' ) )`
   * e `set_url_scheme( $url, 'https' )`. A regra de negocio de US-1 e literal
   * sobre isto: *"treze endpoints do servico de infraestrutura sao escritos com
   * esquema sem cifra e promovidos a cifrado apenas se o ambiente suportar"*.
   */
  readonly promovidoSeOAmbienteSuportar: boolean;

  /**
   * Se o legado **repete a chamada em claro** quando a primeira, cifrada, falha.
   *
   * Sao os 7 pontos de `ESC-HTTP` no nucleo, e a repeticao e sempre uma segunda
   * chamada escrita a mao sob `if ( $ssl && is_wp_error( ... ) )`. O cenario
   * `@divida-herdada` de `PT-017` compara *"o conjunto de canais que repete"*, e
   * e esta coluna que o responde.
   */
  readonly repeteEmClaroNaFalha: boolean;

  readonly origemDoEndereco: OrigemDoEndereco;
  readonly verificacaoDeCertificado: VerificacaoDeCertificado;
  readonly validacaoDeDestino: ValidacaoDeDestino;
  readonly fonte: FonteDoEndereco;

  /**
   * Os pontos de extensao que alteram **este endereco** ou o canal dele, pelo
   * nome do legado.
   *
   * O P2 da constituicao poe o ponto de extensao no contrato publico — *"e
   * produto, nao acidente de implementacao"* — e `INT-6` da analise do legado
   * registra que *"todo contrato aqui e filtravel"*. Guardar o nome junto do
   * endereco e o que permite a quem portar cada chamada declarar o ponto com o
   * nome que o legado usa, em vez de inventar um.
   */
  readonly pontosDeExtensao: readonly string[];

  /**
   * Onde cada afirmacao desta linha se confere, em `arquivo:linha` da arvore
   * analisada. Nunca vazio.
   */
  readonly ancoras: readonly string[];

  /** O que mais precisa ficar dito sobre esta linha, ou `null`. */
  readonly nota: string | null;
}

/** O servico a que um ou mais enderecos pertencem. */
export interface ServicoExterno {
  readonly id: string;
  readonly nome: string;
  readonly criticidade: CriticidadeDoServico;
  readonly fonte: FonteDoEndereco;

  /**
   * Como o servico se autentica, em uma linha, **sem nenhum valor de
   * credencial**.
   *
   * A resolucao da credencial e US-3, tarefa **T007**, e a proibicao de guarda-la
   * em texto recuperavel e US-4, tarefa **T009**. Aqui so o **nome** da opcao,
   * da constante ou da variavel de ambiente — que e o que a analise do legado
   * tambem fez: *"nenhuma credencial real foi encontrada comitada nesta arvore:
   * sete segredos foram registrados por nome apenas"* (regra de negocio de
   * US-4).
   */
  readonly autenticacao: string;

  readonly ancoras: readonly string[];
}
