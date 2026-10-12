/**
 * O catalogo de enderecos externos, como **dado declarado**.
 *
 * Tarefa **T002** da feature `014-integracao-externa`: *"os enderecos dos
 * servicos externos estao num registro unico e inspecionavel, com o esquema de
 * cada um explicito, de modo que a pergunta 'quantos canais nascem sem cifra'
 * tenha resposta por consulta e nao por varredura de codigo"*.
 * `satisfaz: — (infraestrutura)`.
 *
 * Nada aqui e comportamento: sao duas constantes congeladas. Criar o modulo nao
 * le este arquivo, e ler este arquivo nao faz chamada nenhuma — `EXT-ORDEM`
 * (BR-MIGRAR-106) poe a ordem de arranque no contrato publico e a tabela *Nao
 * negociavel* da constituicao repete (*"mudar a ordem de carregamento do
 * arranque"*), logo **nada se resolve no carregamento**.
 *
 * ## De onde vem este dado, e como se confere
 *
 * Cada linha foi lida na arvore analisada, com `grep -n` no oraculo e a ancora
 * conferida antes de ser escrita — e e a ancora que fica, nao a memoria de quem
 * leu. O recorte e o das **integracoes de saida**: a `spec.md` conta *"29
 * integracoes e 64 endpoints catalogados"*, e dessas 29, **19 sao de saida**
 * (15 `outbound` e as 4 `bidirectional`), com **50 linhas de endpoint**.
 *
 * A aritmetica deste arquivo, para que a contagem seja reproduzivel por quem
 * revisar:
 *
 * | | linhas |
 * |---|---|
 * | endpoints das 19 integracoes de saida | 50 |
 * | **menos** os 4 que sao de ENTRADA e nao enderecos de terceiro: o gatilho de webhook e o de alerta do servico de reputacao, `pingback.ping` recebido em `/xmlrpc.php` e o POST recebido em `/wp-trackback.php` | −4 |
 * | **mais** o feixe de loopback aberto: o artefato o conta em 3 linhas, e aqui sao 10 | +7 |
 * | **mais** o feixe dos feeds do painel aberto: 1 linha no artefato, 2 enderecos literais distintos, com filtro proprio cada | +1 |
 * | **total declarado aqui** | **54** |
 *
 * As duas aberturas tem motivo, e nenhuma delas e achado novo de comportamento:
 *
 * 1. **O feixe de loopback nao e uniforme no campo que mais importa.** Dentro
 *    daquelas 3 linhas convivem chamadas que **exigem** verificacao de
 *    certificado (`wp-admin/includes/upgrade.php:541`, `wp-admin/admin.php:84`,
 *    `wp-admin/includes/class-wp-site-health.php:3419`) e chamadas que a
 *    **desligam** pelo default `false` do filtro `https_local_ssl_verify`
 *    (`wp-includes/cron.php:993`,
 *    `wp-admin/includes/class-wp-site-health.php:2231`, `:3291`, `:3615`). Uma
 *    linha so teria de escolher um valor, e escolher seria afirmar errado sobre
 *    metade dos pontos.
 * 2. ⚠️ **Dois pontos de chamada de loopback nao estao em nenhuma linha do
 *    artefato**, e foram conferidos aqui: a varredura de erro fatal depois de
 *    editar arquivo de extensao (`wp-admin/includes/file.php:586` e `:588`) e a
 *    varredura depois de atualizacao automatica
 *    (`wp-admin/includes/class-wp-automatic-updater.php:1806` e `:1807`). Com
 *    elas, o default `false` de `https_local_ssl_verify` aparece em **6** pontos
 *    de chamada, e nao nos 4 que a analise registra. Nao reescrevi artefato
 *    nenhum: `.specify/` e pacote gerado, e o oraculo nao e desta arvore.
 *
 * ## A pergunta da entrega, respondida por consulta
 *
 * `./consultas.ts` tem as funcoes; o que vale registrar aqui e **o que o dado
 * diz**, com a conferencia que o produziu:
 *
 * - **13 canais nascem sem cifra no servico de infraestrutura.** E o numero que
 *   a regra de negocio de US-1 declara (*"treze endpoints do servico de
 *   infraestrutura sao escritos com esquema sem cifra e promovidos a cifrado
 *   apenas se o ambiente suportar"*) e que `BR-MIGRAR-115` repete. Conferido:
 *   `grep -rn "http://api.wordpress.org" wp-admin wp-includes` devolve **14**
 *   ocorrencias, das quais uma e docblock
 *   (`wp-includes/rest-api/endpoints/class-wp-rest-pattern-directory-controller.php:13`)
 *   — logo 13 literais em codigo. Os outros dois endpoints daquele servico
 *   nascem em `https://`: o de chaves de autenticacao
 *   (`wp-admin/setup-config.php:361`) e o teste de conectividade
 *   (`wp-admin/includes/class-wp-site-health.php:1344`).
 * - ⚠️ **"13" e a contagem daquele literal, nao a de todos os canais em claro da
 *   arvore.** O catalogo inteiro tem **21** enderecos que nascem sem cifra, e a
 *   diferenca esta enumerada na suite de T002, nome por nome: os 13 mais a
 *   sondagem de DNS curinga (`'http://' . $hostname`,
 *   `wp-admin/includes/schema.php:1163`), a caixa postal em `fsockopen()` cru na
 *   porta 110 (`wp-includes/class-pop3.php:100`), o sistema de arquivos remoto
 *   em FTP puro na porta 21
 *   (`wp-admin/includes/class-wp-filesystem-ftpext.php:135`) e os **5** do
 *   servico de reputacao, que vivem na extensao empacotada e por isso tem
 *   `fonte: 'extensao-empacotada'`. Nenhum desses seis desmente o 13: o 13
 *   continua exato no recorte em que foi medido, e e assim que a consulta o
 *   devolve.
 * - **7 canais do nucleo repetem a requisicao em claro** quando a cifrada falha,
 *   e o conjunto esta nos campos `repeteEmClaroNaFalha`. Com a extensao
 *   empacotada sao 11, e o cenario `@divida-herdada` de `PT-017` compara
 *   justamente *"o conjunto de canais que repete"*.
 *
 * 🔴 **T002 nao decide o que o sistema novo faz com esses 21.** Ver o cabecalho
 * de `./endereco-externo.ts`: REQ-149 e a resposta 12 mandam coisas opostas, e
 * os dois lados estao fora do que um agente decide. O que esta aqui e o dado com
 * ancora, na forma em que **qualquer** das duas decisoes se implementa sem
 * reabrir o catalogo.
 */

import type { EnderecoExterno, ServicoExterno } from './endereco-externo.js';

/**
 * Os 19 servicos de saida, com a criticidade que a analise do legado atribuiu e
 * a autenticacao **por nome**, nunca por valor.
 *
 * Os `id` sao os do artefato de analise de proposito: e por eles que uma linha
 * deste catalogo se rastreia ate a integracao de onde saiu.
 */
export const SERVICOS_EXTERNOS: readonly ServicoExterno[] = Object.freeze([
  {
    id: 'api-wordpress-org',
    nome: 'API de infraestrutura do WordPress.org',
    criticidade: 'media',
    fonte: 'nucleo',
    autenticacao:
      'nenhuma. A identificacao e o user-agent WordPress/<versao>; <url do site> e, na consulta de versao, os cabecalhos wp_install e wp_blog',
    ancoras: ['wp-includes/update.php:238'],
  },
  {
    id: 'downloads-wordpress-org',
    nome: 'Distribuicao de pacotes do WordPress.org',
    criticidade: 'alta',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-admin/includes/file.php:1177'],
  },
  {
    id: 's-w-org-cdn',
    nome: 'Rede de distribuicao de recursos estaticos (s.w.org)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/formatting.php:6032', 'wp-includes/fonts.php:269'],
  },
  {
    id: 'secure-gravatar-com',
    nome: 'Gravatar (avatar por hash de e-mail)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/link-template.php:4605'],
  },
  {
    id: 'akismet',
    nome: 'Servico externo de reputacao de comentario',
    criticidade: 'media',
    fonte: 'extensao-empacotada',
    autenticacao:
      'chave de API pela opcao wordpress_api_key ou pela constante WPCOM_API_KEY, declaradas no registro de conector do nucleo',
    ancoras: [
      'wp-includes/connectors.php:226',
      'wp-includes/connectors.php:241',
      'wp-includes/connectors.php:242',
    ],
  },
  {
    id: 'oembed-provedores',
    nome: 'Provedores de oEmbed (consumo)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/class-wp-oembed.php:56'],
  },
  {
    id: 'provedores-de-ia',
    nome: 'Provedores de modelo de linguagem',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao:
      'chave de API pela opcao connectors_ai_{anthropic|google|openai}_api_key, pela constante ou pela variavel de ambiente de mesmo nome em maiusculas, nesta precedencia invertida',
    ancoras: [
      'wp-includes/connectors.php:290',
      'wp-includes/connectors.php:444',
    ],
  },
  {
    id: 'servidor-de-email-saida',
    nome: 'Servidor de e-mail de saida',
    criticidade: 'alta',
    fonte: 'nucleo',
    autenticacao:
      'nenhuma no nucleo: o transporte de fabrica e a funcao de correio do proprio runtime do legado, sem credencial. Credencial de SMTP so existe se uma extensao reconfigurar o remetente',
    ancoras: [
      'wp-includes/pluggable.php:505',
      'wp-includes/pluggable.php:622',
    ],
  },
  {
    id: 'caixa-postal-pop3',
    nome: 'Caixa postal POP3 (publicar conteudo por e-mail)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao:
      'usuario e senha em texto puro, pelos comandos USER e PASS, com as opcoes mailserver_url, mailserver_port, mailserver_login e mailserver_pass. APOP existe na classe e vem desligado',
    ancoras: ['wp-mail.php:61', 'wp-includes/class-pop3.php:43'],
  },
  {
    id: 'pingback',
    nome: 'Notificacao de link entre sites (pingback)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/comment.php:3593'],
  },
  {
    id: 'trackback',
    nome: 'Notificacao de link entre sites (trackback)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/comment.php:3672'],
  },
  {
    id: 'rpc-pingomatic-com',
    nome: 'Servico de notificacao de atualizacao do site',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-admin/includes/schema.php:450'],
  },
  {
    id: 'feeds-wordpress-org',
    nome: 'Feeds de noticias do WordPress.org no painel',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-admin/includes/dashboard.php:1563'],
  },
  {
    id: 'loopback-do-proprio-site',
    nome: 'O proprio site (loopback)',
    criticidade: 'alta',
    fonte: 'nucleo',
    autenticacao:
      'nenhum segredo persistente: nonce de sessao nos testes assincronos e o valor de doing_wp_cron como chave compartilhada da trava do agendador',
    ancoras: ['wp-includes/cron.php:961'],
  },
  {
    id: 'estilos-de-editor-remotos',
    nome: 'Folhas de estilo remotas declaradas pelo tema',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-includes/block-editor.php:776'],
  },
  {
    id: 'sondagem-de-dns-curinga',
    nome: 'Sondagem de DNS curinga (instalacao de rede)',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao: 'nenhuma',
    ancoras: ['wp-admin/includes/schema.php:1163'],
  },
  {
    id: 'banco-mysql-mariadb',
    nome: 'Banco de dados',
    criticidade: 'alta',
    fonte: 'nucleo',
    autenticacao:
      'usuario e senha pelas constantes DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_CHARSET e DB_COLLATE',
    ancoras: ['wp-config-sample.php:24'],
  },
  {
    id: 'sistema-de-arquivos-remoto',
    nome: 'Sistema de arquivos remoto',
    criticidade: 'media',
    fonte: 'nucleo',
    autenticacao:
      'constantes FTP_HOST, FTP_USER, FTP_PASS, FTP_PUBKEY, FTP_PRIKEY, FTP_SSH, FTP_SSL e FS_METHOD, ou o formulario do painel protegido pelo nonce filesystem-credentials. A opcao ftp_credentials guarda so host e usuario',
    ancoras: [
      'wp-admin/includes/file.php:2440',
      'wp-admin/includes/file.php:2495',
    ],
  },
  {
    id: 'proxy-http-de-saida',
    nome: 'Proxy HTTP de saida',
    criticidade: 'baixa',
    fonte: 'nucleo',
    autenticacao:
      'usuario e senha pelas constantes WP_PROXY_USERNAME e WP_PROXY_PASSWORD, no cabecalho Proxy-Authorization',
    ancoras: ['wp-includes/class-wp-http-proxy.php:58'],
  },
]);

/**
 * As 54 linhas do catalogo.
 *
 * A ordem e a dos servicos acima, e ela nao e contrato de nada: as consultas
 * filtram, nunca dependem de posicao. Dentro de cada servico, a ordem e a do
 * artefato de analise, para que a conferencia linha a linha seja possivel.
 */
export const CATALOGO_DE_ENDERECOS_EXTERNOS: readonly EnderecoExterno[] =
  Object.freeze([
    // ---------------------------------------------------------------------
    // api.wordpress.org — 15 enderecos, 13 deles em claro.
    //
    // O padrao dos 13 e sempre o mesmo, e quem portar vai reconhece-lo: o
    // endereco nasce em `http://`, e guardado em `$http_url`, e promovido com
    // `set_url_scheme( $url, 'https' )` quando
    // `wp_http_supports( array( 'ssl' ) )`, e em 7 dos 13 e repetido em claro
    // dentro de um `if ( $ssl && is_wp_error( ... ) )`.
    // ---------------------------------------------------------------------
    {
      id: 'wporg-core-version-check',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/version-check/1.7/',
      metodo: 'POST',
      paraQue:
        'descobre se ha versao nova do nucleo e quais pacotes baixar; leva na consulta o numero de sites, de usuarios, as extensoes do runtime e as tabelas em MyISAM',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['core_version_check_query_args'],
      ancoras: [
        'wp-includes/update.php:209',
        'wp-includes/update.php:226',
        'wp-includes/update.php:231',
        'wp-includes/update.php:246',
        'wp-includes/update.php:248',
        'wp-includes/update.php:258',
      ],
      nota: 'O aviso que acompanha o rebaixamento e emitido com severidade de nota fora do modo de depuracao (`:256`), logo e invisivel na pratica.',
    },
    {
      id: 'wporg-plugins-update-check',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/plugins/update-check/1.1/',
      metodo: 'POST',
      paraQue:
        'envia a lista completa de extensoes instaladas, com versao, e recebe as atualizacoes disponiveis',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/update.php:464',
        'wp-includes/update.php:469',
        'wp-includes/update.php:472',
        'wp-includes/update.php:474',
        'wp-includes/update.php:484',
      ],
      nota: null,
    },
    {
      id: 'wporg-themes-update-check',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/themes/update-check/1.1/',
      metodo: 'POST',
      paraQue:
        'envia os temas instalados e o tema ativo, e recebe as atualizacoes disponiveis',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/update.php:750',
        'wp-includes/update.php:755',
        'wp-includes/update.php:758',
        'wp-includes/update.php:760',
        'wp-includes/update.php:770',
      ],
      nota: null,
    },
    {
      id: 'wporg-plugins-info',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/plugins/info/1.2/',
      metodo: 'GET',
      paraQue: 'ficha de uma extensao do diretorio, para a tela de instalacao',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/plugin-install.php:149',
        'wp-admin/includes/plugin-install.php:161',
        'wp-admin/includes/plugin-install.php:168',
        'wp-admin/includes/plugin-install.php:170',
        'wp-admin/includes/plugin-install.php:183',
      ],
      nota: null,
    },
    {
      id: 'wporg-themes-info',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/themes/info/1.2/',
      metodo: 'GET',
      paraQue: 'ficha de um tema do diretorio',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/theme.php:541',
        'wp-admin/includes/theme.php:553',
        'wp-admin/includes/theme.php:560',
        'wp-admin/includes/theme.php:562',
        'wp-admin/includes/theme.php:574',
      ],
      nota: null,
    },
    {
      id: 'wporg-translations',
      servico: 'api-wordpress-org',
      enderecoNoLegado:
        'http://api.wordpress.org/translations/<core|plugins|themes>/1.0/',
      metodo: 'POST',
      paraQue:
        'lista os pacotes de traducao disponiveis para nucleo, extensao ou tema',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/translation-install.php:53',
        'wp-admin/includes/translation-install.php:57',
        'wp-admin/includes/translation-install.php:73',
        'wp-admin/includes/translation-install.php:75',
        'wp-admin/includes/translation-install.php:86',
      ],
      nota: 'O tipo entra no caminho do endereco, logo um endereco por tipo; o artefato conta uma linha so, e esta linha a preserva.',
    },
    {
      id: 'wporg-core-checksums',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/checksums/1.0/',
      metodo: 'GET',
      paraQue:
        'as somas de verificacao dos arquivos do nucleo, que e o que detectaria arquivo de nucleo alterado',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/update.php:132',
        'wp-admin/includes/update.php:138',
        'wp-admin/includes/update.php:145',
        'wp-admin/includes/update.php:147',
        'wp-admin/includes/update.php:158',
      ],
      nota: '🔴 E este o endereco que o terceiro criterio do descarte REQ-150 singulariza (*"a consulta de integridade dos proprios arquivos, em particular, nao tem caminho sem cifra"*), e e sobre ele que o cenario `@divida-herdada` de `PT-017` diz que as duas metades *"obtem as somas por canal em texto claro"*. Conflito registrado, nao resolvido.',
    },
    {
      id: 'wporg-secret-key-salt',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'https://api.wordpress.org/secret-key/1.1/salt/',
      metodo: 'GET',
      paraQue:
        'gera as 8 chaves e sais de autenticacao para a configuracao da instalacao',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/setup-config.php:361',
        'wp-admin/includes/network.php:560',
      ],
      nota: 'E um dos dois enderecos deste servico que ja nascem cifrados. Quando a chamada falha, o instalador gera os 8 valores localmente (`wp-admin/includes/network.php:561`): a integracao e conveniencia, nao dependencia.',
    },
    {
      id: 'wporg-patterns',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/patterns/1.0/',
      metodo: 'GET',
      paraQue:
        'padroes de bloco do diretorio, servidos ao editor por uma rota local que existe para nao entregar o endereco de quem edita ao terceiro',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/rest-api/endpoints/class-wp-rest-pattern-directory-controller.php:117',
        'wp-includes/rest-api/endpoints/class-wp-rest-pattern-directory-controller.php:119',
        'wp-includes/rest-api/endpoints/class-wp-rest-pattern-directory-controller.php:130',
      ],
      nota: '⚠️ A 14a ocorrencia do literal `http://api.wordpress.org` nesta arvore esta no docblock deste mesmo arquivo (`:13`), e e por isso que o `grep` devolve 14 e os canais sao 13.',
    },
    {
      id: 'wporg-core-importers',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/importers/1.1/',
      metodo: 'GET',
      paraQue: 'lista de importadores populares exibida na tela de importacao',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/import.php:149',
        'wp-admin/includes/import.php:154',
        'wp-admin/includes/import.php:157',
      ],
      nota: 'Quando a resposta nao e lista, o legado cai para uma lista fixa de 6 importadores embutida no proprio arquivo (`:184`).',
    },
    {
      id: 'wporg-core-credits',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/credits/1.1/',
      metodo: 'GET',
      paraQue: 'lista de contribuidores da tela Sobre',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/credits.php:35',
        'wp-admin/includes/credits.php:39',
        'wp-admin/includes/credits.php:42',
      ],
      nota: 'A versao e o idioma vao na propria cadeia do endereco, interpolados no literal (`:35`).',
    },
    {
      id: 'wporg-core-browse-happy',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/browse-happy/1.1/',
      metodo: 'POST',
      paraQue:
        'classifica o navegador de quem esta no painel para decidir o aviso de navegador obsoleto',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/dashboard.php:1835',
        'wp-admin/includes/dashboard.php:1842',
        'wp-admin/includes/dashboard.php:1845',
      ],
      nota: null,
    },
    {
      id: 'wporg-core-serve-happy',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/core/serve-happy/1.0/',
      metodo: 'GET',
      paraQue: 'diz se a versao do runtime do servidor e obsoleta ou insegura',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/misc.php:1588',
        'wp-admin/includes/misc.php:1591',
        'wp-admin/includes/misc.php:1596',
      ],
      nota: null,
    },
    {
      id: 'wporg-events',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'http://api.wordpress.org/events/1.0/',
      metodo: 'GET',
      paraQue:
        'eventos da comunidade perto de quem esta no painel; leva o endereco de rede do cliente, reduzido a identificador de rede',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/class-wp-community-events.php:101',
        'wp-admin/includes/class-wp-community-events.php:106',
        'wp-admin/includes/class-wp-community-events.php:109',
      ],
      nota: '⚠️ A analise do legado afirma que os 13 canais em claro sao *"os treze primeiros endpoints da tabela"* daquele documento, o que incluiria o endereco de sais e deixaria este de fora. Conferido pelo literal: este esta entre os 13, e o de sais nao — ele nasce em `https://`.',
    },
    {
      id: 'wporg-raiz-conectividade',
      servico: 'api-wordpress-org',
      enderecoNoLegado: 'https://api.wordpress.org',
      metodo: 'GET',
      paraQue:
        'teste de conectividade com o servico de infraestrutura, no diagnostico do site',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: ['wp-admin/includes/class-wp-site-health.php:1344'],
      nota: '⚠️ O artefato de analise poe nesta mesma linha a ancora `wp-admin/includes/class-wp-debug-data.php:276`. Conferido: aquela chamada e para `https://wordpress.org`, **outro host**, tambem cifrado, tambem sem validacao de destino. Fica a ancora dos dois aqui porque o endereco do segundo nao tem linha propria no artefato.',
    },

    // ---------------------------------------------------------------------
    // downloads.wordpress.org — 2 enderecos, nenhum literal no codigo.
    // ---------------------------------------------------------------------
    {
      id: 'downloads-pacote',
      servico: 'downloads-wordpress-org',
      enderecoNoLegado: '<url de pacote vinda da resposta do servico> (.zip)',
      metodo: 'GET',
      paraQue:
        'baixa o pacote de nucleo, extensao, tema ou idioma para arquivo temporario',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'resposta-de-outro-servico',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: ['wp-admin/includes/file.php:1177'],
      nota: 'O esquema nao esta no codigo: o endereco vem do campo de pacotes da resposta da consulta de versao, que por sua vez chega por canal que pode ter sido rebaixado. E o caminho por onde o codigo do proprio sistema e substituido.',
    },
    {
      id: 'downloads-assinatura',
      servico: 'downloads-wordpress-org',
      enderecoNoLegado: '<url do pacote>.sig',
      metodo: 'GET',
      paraQue:
        'busca a assinatura do pacote quando o cabecalho de assinatura nao vem na resposta',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'resposta-de-outro-servico',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['wp_signature_url', 'wp_signature_hosts'],
      ancoras: [
        'wp-admin/includes/file.php:1294',
        'wp-admin/includes/file.php:1316',
        'wp-admin/includes/file.php:1319',
      ],
      nota: '🔴 A verificacao so e tentada para tres hosts (`:1287`) e **nao pode mais suceder** nesta arvore: a lista de chaves confiaveis devolve lista vazia desde 2021-04-01. A resposta 11 manda manter a tolerancia, e *"exigir assinatura verificada de pacote"* esta na tabela *Nao negociavel*.',
    },

    // ---------------------------------------------------------------------
    // s.w.org — 2 enderecos, os dois cifrados, um deles buscado pelo navegador.
    // ---------------------------------------------------------------------
    {
      id: 'swo-emoji',
      servico: 's-w-org-cdn',
      enderecoNoLegado: 'https://s.w.org/images/core/emoji/17.0.2/72x72/',
      metodo: 'GET',
      paraQue:
        'imagens de emoji; o servidor so imprime o endereco e o navegador de quem visita e que busca',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: ['emoji_url', 'emoji_svg_url'],
      ancoras: [
        'wp-includes/formatting.php:6032',
        'wp-includes/formatting.php:6050',
        'wp-includes/formatting.php:6157',
      ],
      nota: 'Nao e chamada de saida do servidor: nenhuma porta de cliente externo participa. Esta no catalogo porque e endereco de terceiro que o sistema declara, e porque o ponto de extensao que o altera e contrato publico (P2).',
    },
    {
      id: 'swo-colecao-de-fontes',
      servico: 's-w-org-cdn',
      enderecoNoLegado:
        'https://s.w.org/images/fonts/wp-7.1/collections/google-fonts-with-preview.json',
      metodo: 'GET',
      paraQue: 'catalogo da colecao de fontes oferecida na biblioteca de fontes',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/fonts.php:269',
        'wp-includes/fonts/class-wp-font-collection.php:182',
      ],
      nota: null,
    },

    // ---------------------------------------------------------------------
    // Gravatar — 1 endereco, cifrado, buscado pelo navegador.
    // ---------------------------------------------------------------------
    {
      id: 'gravatar-avatar',
      servico: 'secure-gravatar-com',
      enderecoNoLegado: 'https://secure.gravatar.com/avatar/<hash do e-mail>',
      metodo: 'GET',
      paraQue: 'foto de perfil de autor e de quem comenta',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: ['get_avatar_url', 'pre_get_avatar_data'],
      ancoras: [
        'wp-includes/link-template.php:4548',
        'wp-includes/link-template.php:4605',
      ],
      nota: 'O esquema e sempre cifrado, com comentario no codigo explicando por que (`:4599`). Como no emoji, o servidor monta e o navegador busca.',
    },

    // ---------------------------------------------------------------------
    // Servico de reputacao — 6 enderecos de saida, 5 deles em claro.
    //
    // 🔴 OS SEIS ESTAO NA EXTENSAO EMPACOTADA, NAO NO NUCLEO. A quarta
    // pergunta em aberto da `spec.md` poe para uma pessoa decidir se este
    // servico fica dentro ou fora do nucleo clonado (resposta 13 o poe fora,
    // como extensao empacotada, e nenhum card registra a decisao de escopo).
    // T002 declara o que o legado escreve, com `fonte: 'extensao-empacotada'`,
    // e deixa a separacao a uma consulta: nem omitir (decidir pelo descarte)
    // nem declarar como nucleo (decidir pelo contrario).
    //
    // As duas linhas de ENTRADA deste servico — o gatilho de webhook e o de
    // alerta — nao estao aqui: sao rotas DESTE sistema, nao enderecos de
    // terceiro. Ver a aritmetica no cabecalho.
    // ---------------------------------------------------------------------
    {
      id: 'reputacao-comment-check',
      servico: 'akismet',
      enderecoNoLegado: 'http://rest.akismet.com/1.1/comment-check',
      metodo: 'POST',
      paraQue: 'classifica um comentario submetido',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: ['akismet_request_args', 'akismet_ua'],
      ancoras: [
        'wp-content/plugins/akismet/class.akismet.php:553',
        'wp-content/plugins/akismet/class.akismet.php:1823',
        'wp-content/plugins/akismet/class.akismet.php:1841',
        'wp-content/plugins/akismet/class.akismet.php:1866',
      ],
      nota: '🔴 Duas coisas, e as duas tem decisao humana. A primeira: a resposta 13 autoriza **minimizacao** do que este endereco recebe, e e a unica excecao de conteudo declarada em `parity_specs.md` — o legado envia todo campo de texto do corpo e todo cabecalho do ambiente, exceto o cookie. A segunda: depois de uma falha de canal seguro, o rebaixamento aqui **dura por tempo** (24 h, `:1834` e `:1883`), e nao por tentativa — e e estado por site, que `EXT-CONTEXTO` e o cenario `@concorrencia` de `PT-017` proibem vazar de um site para o outro.',
    },
    {
      id: 'reputacao-submit-spam-e-ham',
      servico: 'akismet',
      enderecoNoLegado:
        'http://rest.akismet.com/1.1/submit-spam e http://rest.akismet.com/1.1/submit-ham',
      metodo: 'POST',
      paraQue: 'reporta ao servico uma classificacao corrigida por uma pessoa',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: ['akismet_request_args'],
      ancoras: [
        'wp-content/plugins/akismet/class.akismet.php:1348',
        'wp-content/plugins/akismet/class.akismet.php:1417',
        'wp-content/plugins/akismet/class.akismet.php:1823',
      ],
      nota: null,
    },
    {
      id: 'reputacao-verify-key',
      servico: 'akismet',
      enderecoNoLegado: 'http://rest.akismet.com/1.1/verify-key',
      metodo: 'POST',
      paraQue: 'valida a chave de API informada no painel',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: ['akismet_request_args'],
      ancoras: [
        'wp-content/plugins/akismet/class.akismet.php:195',
        'wp-content/plugins/akismet/class.akismet.php:1823',
      ],
      nota: null,
    },
    {
      id: 'reputacao-painel-e-ciclo-da-chave',
      servico: 'akismet',
      enderecoNoLegado:
        'http://rest.akismet.com/1.1/{get-stats|get-subscription|verify-wpcom-key|deactivate|token}',
      metodo: 'POST',
      paraQue:
        'estatisticas, dados da assinatura, troca de chave, desativacao e obtencao de token',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: true,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: ['akismet_request_args'],
      ancoras: [
        'wp-content/plugins/akismet/class.akismet.php:179',
        'wp-content/plugins/akismet/class.akismet.php:221',
        'wp-content/plugins/akismet/class.akismet.php:254',
        'wp-content/plugins/akismet/class.akismet-admin.php:1021',
        'wp-content/plugins/akismet/class.akismet-admin.php:1078',
      ],
      nota: 'Os cinco caminhos atravessam a mesma funcao de envio, logo tem o mesmo esquema de nascimento e a mesma repeticao: o feixe do artefato e fiel aqui.',
    },
    {
      id: 'reputacao-compatible-plugins',
      servico: 'akismet',
      enderecoNoLegado: 'https://rest.akismet.com/1.2/compatible-plugins',
      metodo: 'GET',
      paraQue: 'lista de extensoes compativeis exibida no painel do servico',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: [],
      ancoras: [
        'wp-content/plugins/akismet/class-akismet-compatible-plugins.php:26',
        'wp-content/plugins/akismet/class-akismet-compatible-plugins.php:158',
      ],
      nota: 'Nao passa pela funcao de envio com rebaixamento: e constante cifrada, chamada direto.',
    },
    {
      id: 'reputacao-teste-de-conectividade',
      servico: 'akismet',
      enderecoNoLegado:
        'https://rest.akismet.com/1.1/test, ou http://rest.akismet.com/1.1/test quando o ambiente nao suporta canal seguro',
      metodo: 'GET',
      paraQue: 'teste de conectividade do painel do servico',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: true,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'extensao-empacotada',
      pontosDeExtensao: [],
      ancoras: [
        'wp-content/plugins/akismet/class.akismet-admin.php:929',
        'wp-content/plugins/akismet/class.akismet-admin.php:931',
      ],
      nota: 'A forma e outra — **dois literais num `if`/`else`** sobre o suporte a canal seguro, em vez de promocao do esquema — e o efeito observavel e o mesmo dos 13: em claro quando o ambiente nao suporta. Por isso `sem-cifra` com promocao, e nao `cifrado`.',
    },

    // ---------------------------------------------------------------------
    // Provedores de oEmbed — 2 linhas: a lista declarada e a descoberta.
    // ---------------------------------------------------------------------
    {
      id: 'oembed-provedor-declarado',
      servico: 'oembed-provedores',
      enderecoNoLegado: '<endereco do provedor, da lista declarada no codigo>',
      metodo: 'GET',
      paraQue:
        'transforma um endereco colado no editor na representacao incorporavel',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['oembed_providers', 'oembed_fetch_url'],
      ancoras: [
        'wp-includes/class-wp-oembed.php:56',
        'wp-includes/class-wp-oembed.php:232',
        'wp-includes/class-wp-oembed.php:605',
        'wp-includes/class-wp-oembed.php:634',
      ],
      nota: '⚠️ Contagem conferida nesta arvore, porque o catalogo afirma `cifrado` para um conjunto e nao para um endereco: a lista do construtor (`:56` a `:116`) tem **59 padroes de endereco** e **36 enderecos de provedor distintos**, e **nenhum** deles nasce em claro — zero endereco de provedor em esquema aberto naquele trecho. O artefato de analise registra *"33 endpoints distintos em 60 padroes"*; nao reescrevi o artefato, e os 36 e os 59 sao o que o `php` em disco tem. A lista inteira e filtravel por `oembed_providers`, logo e dado em execucao, nao politica deste modulo — e e por isso que ela nao esta copiada aqui linha a linha.',
    },
    {
      id: 'oembed-descoberta',
      servico: 'oembed-provedores',
      enderecoNoLegado: '<qualquer endereco colado, quando nenhum provedor casa>',
      metodo: 'GET',
      paraQue:
        'busca a pagina e procura nela a declaracao de oEmbed, quando o endereco nao casa com provedor conhecido',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'conteudo-do-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['oembed_remote_get_args'],
      ancoras: [
        'wp-includes/class-wp-oembed.php:493',
        'wp-includes/class-wp-oembed.php:496',
        'wp-includes/class-wp-oembed.php:509',
        'wp-includes/class-wp-oembed.php:512',
      ],
      nota: 'Endereco vindo de dado, e por isso com as duas contencoes do legado: a variante validada do cliente e teto de 150 KB de resposta (`:496`).',
    },

    // ---------------------------------------------------------------------
    // Provedores de modelo de linguagem — 1 linha, sem endereco no codigo.
    // ---------------------------------------------------------------------
    {
      id: 'ia-provedor-sem-endereco',
      servico: 'provedores-de-ia',
      enderecoNoLegado: null,
      metodo: 'POST',
      paraQue:
        'geracao de texto e de imagem; os tres conectores estao declarados e nenhum provedor que os execute existe nesta arvore',
      protocolo: 'http',
      cifraDeNascimento: 'sem-endereco-no-codigo',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'sem-endereco-no-codigo',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/connectors.php:290',
        'wp-includes/connectors.php:307',
        'wp-includes/connectors.php:319',
        'wp-includes/php-ai-client/src/Providers/ApiBasedImplementation/AbstractApiProvider.php:28',
        'wp-includes/ai-client/adapters/class-wp-ai-client-http-client.php:132',
      ],
      nota: '🔴 Terceira pergunta em aberto desta feature, e conflito registrado: o descarte REQ-158 manda nao portar as tres declaracoes sem provedor; a resposta 18 manda porta-las *"como o nucleo as traz"*, com o provedor fora de escopo. O cenario `@invariante` de `PT-017` cobra o lado da resposta 18. A linha esta aqui com `enderecoNoLegado: null` porque a URL base e metodo abstrato: declarar endereco seria inventar o que a analise nao encontrou (`payload nao encontrado no codigo`). Os enderecos de obtencao de credencial que o registro de conector traz (`:299`, `:311`, `:323`) sao link de tela, nao canal, e por isso nao sao linha deste catalogo.',
    },

    // ---------------------------------------------------------------------
    // E-mail de saida — 1 linha, sem endereco no codigo.
    // ---------------------------------------------------------------------
    {
      id: 'email-de-saida',
      servico: 'servidor-de-email-saida',
      enderecoNoLegado: null,
      metodo: 'sendmail local, pela funcao de correio do runtime',
      paraQue:
        'toda notificacao do sistema: redefinicao de senha, chave de modo de recuperacao, moderacao, confirmacao de privacidade, cadastro e aviso de atualizacao',
      protocolo: 'smtp-local',
      cifraDeNascimento: 'sem-endereco-no-codigo',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'sem-endereco-no-codigo',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: ['phpmailer_init', 'wp_mail', 'wp_mail_failed'],
      ancoras: [
        'wp-includes/pluggable.php:505',
        'wp-includes/pluggable.php:622',
      ],
      nota: 'O transporte de fabrica nao tem endereco nem credencial: e a funcao de correio do proprio runtime do legado. SMTP so existe se uma extensao reconfigurar o remetente no ponto de extensao `phpmailer_init` (`:622`), e e por isso que o `plan.md` chama este slot de *"o unico em que idêntico e impossivel por AUSENCIA DE PRIMITIVA"*. O canal declarado e a falha visivel sao US-6, tarefa T013.',
    },

    // ---------------------------------------------------------------------
    // Caixa postal POP3 — 1 linha, sem cifra em nenhum ponto.
    // ---------------------------------------------------------------------
    {
      id: 'caixa-postal',
      servico: 'caixa-postal-pop3',
      enderecoNoLegado: '<mailserver_url>:<mailserver_port, 110 de fabrica>',
      metodo: 'USER / PASS / LIST / RETR / DELE / QUIT',
      paraQue: 'le a caixa postal e transforma cada mensagem em conteudo',
      protocolo: 'pop3',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'valor-de-opcao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      // `'wp-mail.php'` e, de fato, o nome do ponto de extensao: o legado o
      // dispara assim, com a propria excecao de convencao de nome anotada ao
      // lado (`wp-mail.php:29`).
      pontosDeExtensao: [
        'enable_post_by_email_configuration',
        'wp-mail.php',
        'wp_mail_original_content',
      ],
      nota: '🔴 Segunda pergunta em aberto desta feature. Nao ha caminho de TLS em lugar nenhum daquele arquivo: a conexao e socket cru, e usuario e senha vao em texto puro nos comandos USER e PASS. A senha fica em texto puro na opcao `mailserver_pass`, o que REQ-153 (US-4) proibe; o descarte REQ-157 tiraria o caminho de escopo, e as respostas 10 e 19 o contradizem por consequencia, porque mandam preservar a trava de cinco minutos **daquele** caminho. T002 declara o canal; quem fecha T009 nao decide o conflito.',
      ancoras: [
        'wp-mail.php:14',
        'wp-mail.php:20',
        'wp-mail.php:29',
        'wp-mail.php:61',
        'wp-includes/class-pop3.php:43',
        'wp-includes/class-pop3.php:100',
        'wp-admin/includes/schema.php:426',
        'wp-admin/includes/schema.php:429',
      ],
    },

    // ---------------------------------------------------------------------
    // Pingback — 2 linhas de saida (a descoberta e a chamada).
    // ---------------------------------------------------------------------
    {
      id: 'pingback-descoberta',
      servico: 'pingback',
      enderecoNoLegado: '<endereco citado no conteudo>',
      metodo: 'HEAD, depois GET',
      paraQue:
        'procura no site citado o cabecalho ou a declaracao que diz onde notificar',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'conteudo-do-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/comment.php:3184',
        'wp-includes/comment.php:3205',
        'wp-includes/comment.php:3227',
      ],
      nota: 'Duas chamadas por destino: primeiro sem corpo (`:3205`), e so depois com corpo (`:3227`), se o tipo de conteudo valer a pena (`:3222`).',
    },
    {
      id: 'pingback-notificacao',
      servico: 'pingback',
      enderecoNoLegado: '<endereco de notificacao descoberto no site citado>',
      metodo: 'XML-RPC pingback.ping',
      paraQue: 'avisa o site citado de que este conteudo o citou',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'conteudo-do-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['wp_http_ixr_client_headers', 'pre_ping'],
      ancoras: [
        'wp-includes/comment.php:3581',
        'wp-includes/comment.php:3593',
        'wp-includes/comment.php:3611',
        'wp-includes/class-wp-http-ixr-client.php:81',
        'wp-includes/class-wp-http-ixr-client.php:92',
      ],
      nota: 'O esquema vem do endereco descoberto. ⚠️ Com endereco sem esquema, o cliente de XML-RPC monta `://host/` e nenhuma chamada sai: o esquema **nao** tem valor de fabrica naquele caminho (`class-wp-http-ixr-client.php:26` e `:62`), ao contrario do caminho em que o endereco vem partido em host e caminho, que assume claro (`:40`).',
    },

    // ---------------------------------------------------------------------
    // Trackback — 1 linha de saida.
    // ---------------------------------------------------------------------
    {
      id: 'trackback-notificacao',
      servico: 'trackback',
      enderecoNoLegado: '<endereco de trackback informado no conteudo>',
      metodo: 'POST',
      paraQue: 'notifica outro site de uma citacao, no protocolo antigo',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'conteudo-do-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      // Nenhum. Conferido: os dois pontos de extensao com `trackback` no nome
      // (`pre_trackback_post` e `trackback_post`, `wp-trackback.php:121` e
      // `:178`) sao da superficie de ENTRADA, e o envio nao tem nenhum.
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/comment.php:3656',
        'wp-includes/comment.php:3672',
        'wp-includes/comment.php:3679',
      ],
      nota: '⚠️ E a unica integracao de saida desta arvore com repeticao de fato, e a repeticao **nao** e de canal: em falha a funcao devolve vazio (`:3675`) e o destino **permanece** na coluna de pendentes, que so e limpa quando um envio conclui (`:3679`). Nenhuma politica de repeticao nasce em T002; a observacao esta aqui porque quem ler `repeteEmClaroNaFalha: false` precisa saber que ha outra repeticao, de outra natureza.',
    },

    // ---------------------------------------------------------------------
    // Servico de notificacao de atualizacao — 1 linha, e a unica semeada.
    // ---------------------------------------------------------------------
    {
      id: 'notificacao-de-atualizacao',
      servico: 'rpc-pingomatic-com',
      enderecoNoLegado: 'https://rpc.pingomatic.com/',
      metodo: 'XML-RPC weblogUpdates.extendedPing',
      paraQue: 'anuncia a agregadores que o site publicou algo novo',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'padrao-de-opcao',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['option_ping_sites', 'privacy_ping_filter'],
      ancoras: [
        'wp-admin/includes/schema.php:450',
        'wp-includes/comment.php:3412',
        'wp-includes/comment.php:3690',
        'wp-includes/comment.php:3702',
        'wp-includes/class-wp-http-ixr-client.php:92',
        'wp-includes/default-filters.php:300',
      ],
      nota: '🔴 **E o unico endereco de terceiro que vem semeado na instalacao**, e e a regra de negocio que US-8 registra: *"publicar num site de fabrica avisa um terceiro sem ninguem ter escolhido isso"*. ⚠️ Dois fatos conferidos que valem para quem fechar T017: nesta versao o valor de fabrica **nasce cifrado** (`schema.php:450`), e a lista **nao** nasce vazia, o que toca CA-8.2 em cheio; e o envio passa pela variante **validada** do cliente (`class-wp-http-ixr-client.php:92`), ao contrario do que a analise do legado afirma em prosa (*"o codigo envia sem validar"*). O destino e editavel por quem administra, e o esquema passa a ser o que a pessoa digitar.',
    },

    // ---------------------------------------------------------------------
    // Feeds de noticias do painel — 2 enderecos literais, 1 linha no artefato.
    // ---------------------------------------------------------------------
    {
      id: 'feed-de-noticias-primario',
      servico: 'feeds-wordpress-org',
      enderecoNoLegado: 'https://wordpress.org/news/feed/',
      metodo: 'GET',
      paraQue: 'alimenta o painel de eventos e noticias',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['dashboard_primary_feed'],
      ancoras: [
        'wp-admin/includes/dashboard.php:1563',
        'wp-includes/feed.php:804',
        'wp-includes/class-wp-simplepie-file.php:69',
      ],
      nota: 'Todo feed consumido por este caminho passa pela variante validada do cliente, inclusive o que uma extensao configurar.',
    },
    {
      id: 'feed-de-noticias-secundario',
      servico: 'feeds-wordpress-org',
      enderecoNoLegado: 'https://planet.wordpress.org/feed/',
      metodo: 'GET',
      paraQue: 'o segundo feed do painel de eventos e noticias',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['dashboard_secondary_feed'],
      ancoras: [
        'wp-admin/includes/dashboard.php:1601',
        'wp-admin/includes/dashboard.php:1603',
        'wp-includes/class-wp-simplepie-file.php:69',
      ],
      nota: 'Linha propria, e nao feixe com o primario: sao dois enderecos literais distintos, com ponto de extensao distinto cada.',
    },

    // ---------------------------------------------------------------------
    // Loopback — 10 linhas. A integracao mais critica e, no artefato, a mais
    // compactada: 3 linhas para pontos de chamada que divergem exatamente no
    // campo de verificacao de certificado.
    // ---------------------------------------------------------------------
    {
      id: 'loopback-disparo-do-agendador',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<site_url>/wp-cron.php?doing_wp_cron=<chave>',
      metodo: 'POST',
      paraQue:
        'dispara a fila agendada sem bloquear a resposta a quem esta visitando',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['cron_request', 'https_local_ssl_verify'],
      ancoras: [
        'wp-includes/cron.php:961',
        'wp-includes/cron.php:984',
        'wp-includes/cron.php:993',
        'wp-includes/cron.php:999',
      ],
      nota: '🔴 **A integracao mais critica do sistema, e a falha dela e silenciosa por projeto** — a chamada e deliberadamente nao bloqueante, e AD-07 diz que *"o disparo nao bloqueante tem de FALHAR, e o critério de aceite e a falha"*. O prazo e a nao-bloqueancia sao de T011 e do adaptador, nao deste catalogo; o que esta aqui e o endereco, a origem dele e o fato de a verificacao de certificado vir desligada pelo default do filtro.',
    },
    {
      id: 'loopback-deteccao-de-https',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<home_url com o esquema forcado a https>/',
      metodo: 'GET',
      paraQue:
        'descobre se o site responde em canal seguro e se a resposta e mesmo dele',
      protocolo: 'http',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'repete-sem-verificar',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/https-detection.php:113',
        'wp-includes/https-detection.php:124',
        'wp-includes/https-detection.php:152',
      ],
      nota: '⚠️ O **unico** ponto da arvore em que o rebaixamento nao e de esquema e sim de verificacao: tenta com certificado verificado e, se falhar, repete a MESMA chamada sem verificar, registrando o motivo (`:124`). E `ESC-HTTP` no outro eixo, e por isso tem valor proprio no campo.',
    },
    {
      id: 'loopback-teste-do-diagnostico',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<home_url>/',
      metodo: 'GET',
      paraQue: 'o teste de loopback do diagnostico do site',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['https_local_ssl_verify'],
      ancoras: [
        'wp-admin/includes/class-wp-site-health.php:3615',
        'wp-admin/includes/class-wp-site-health.php:3634',
      ],
      nota: 'O proprio codigo admite em comentario que o protocolo esta implementado mais de uma vez (`:3622`).',
    },
    {
      id: 'loopback-teste-do-agendador',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<site_url>/wp-cron.php',
      metodo: 'POST',
      paraQue: 'o teste do agendador do diagnostico do site',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['https_local_ssl_verify'],
      ancoras: [
        'wp-admin/includes/class-wp-site-health.php:3291',
        'wp-admin/includes/class-wp-site-health.php:3303',
      ],
      nota: null,
    },
    {
      id: 'loopback-teste-de-cache-de-pagina',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<home_url>/?context=edit',
      metodo: 'GET',
      paraQue: 'o teste de cache de pagina do diagnostico do site',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['https_local_ssl_verify'],
      ancoras: [
        'wp-admin/includes/class-wp-site-health.php:2231',
        'wp-admin/includes/class-wp-site-health.php:2233',
      ],
      nota: null,
    },
    {
      id: 'loopback-execucao-assincrona-dos-testes',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<admin_url>/admin-ajax.php',
      metodo: 'POST',
      paraQue: 'executa os testes do diagnostico fora da requisicao da tela',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: ['wp-admin/includes/class-wp-site-health.php:3419'],
      nota: 'Aqui a verificacao de certificado **nao** e desligada: o chamador nao passa o argumento, logo vale o default do cliente. E uma das linhas pelas quais o feixe do artefato nao podia ter um valor so.',
    },
    {
      id: 'loopback-verificacao-de-permalinks',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<endereco de teste do proprio site>',
      metodo: 'GET',
      paraQue:
        'confere, pelo cabecalho de notificacao de link, se o site serve enderecos amigaveis',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: ['wp-admin/includes/upgrade.php:541'],
      nota: 'O comentario do legado explica por que e requisicao com corpo e nao sem: ha servidor que bloqueia a forma sem corpo (`:538`).',
    },
    {
      id: 'loopback-atualizacao-de-banco',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<admin_url>/upgrade.php?step=1',
      metodo: 'GET',
      paraQue: 'dispara a atualizacao de banco depois de uma atualizacao',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['after_mu_upgrade'],
      ancoras: ['wp-admin/admin.php:84', 'wp-admin/network/upgrade.php:87'],
      nota: null,
    },
    {
      id: 'loopback-varredura-de-erro-fatal-apos-edicao',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<endereco do proprio site, com os parametros da varredura>',
      metodo: 'GET',
      paraQue:
        'depois de editar arquivo de extensao ou de tema pelo painel, busca a propria pagina para ver se o site quebrou',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['https_local_ssl_verify'],
      ancoras: [
        'wp-admin/includes/file.php:586',
        'wp-admin/includes/file.php:588',
        'wp-admin/includes/file.php:617',
      ],
      nota: '⚠️ Ponto de chamada que **nao** esta em nenhuma linha do artefato de analise. Conferido aqui: a edicao e revertida quando a chamada nao encontra o marcador que a propria pagina deveria imprimir (`:592` e `:603`), e sao **duas** chamadas quando a primeira passa — a segunda busca a pagina inicial *"para ver se quem visita levou tela branca"* (`:613` a `:617`), com os mesmos argumentos.',
    },
    {
      id: 'loopback-varredura-de-erro-fatal-apos-atualizacao',
      servico: 'loopback-do-proprio-site',
      enderecoNoLegado: '<home_url>/ com os parametros da varredura',
      metodo: 'GET',
      paraQue:
        'depois de uma atualizacao automatica, busca a propria pagina para ver se o site quebrou',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'url-do-proprio-site',
      verificacaoDeCertificado: 'desligada',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: ['https_local_ssl_verify'],
      ancoras: [
        'wp-admin/includes/class-wp-automatic-updater.php:1806',
        'wp-admin/includes/class-wp-automatic-updater.php:1807',
      ],
      nota: '⚠️ O segundo ponto de chamada de loopback ausente do artefato. Com ele e com o anterior, o default desligado do filtro de verificacao local aparece em **6** pontos de chamada, e nao nos 4 registrados.',
    },

    // ---------------------------------------------------------------------
    // Estilos de editor remotos — 1 linha, e um dos 5 achados de seguranca.
    // ---------------------------------------------------------------------
    {
      id: 'estilo-de-editor-remoto',
      servico: 'estilos-de-editor-remotos',
      enderecoNoLegado: '<qualquer endereco http(s) declarado pelo tema>',
      metodo: 'GET',
      paraQue:
        'baixa a folha de estilo e embute o corpo dela na configuracao do editor',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'declarado-pelo-tema',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-includes/block-editor.php:775',
        'wp-includes/block-editor.php:776',
        'wp-includes/block-editor.php:777',
      ],
      nota: '🔴 E a regra de negocio que US-2 registra: *"a busca de folha de estilo remota declarada pelo tema usa a variante nao validada, sem validacao de endereco e sem limite de tamanho de resposta"*. O esquema vem do tema, e a expressao que o aceita admite tambem endereco sem esquema (`~^(https?:)?//~`, `:775`). O estilo so entra quando a chamada nao falha (`:777`), e **nao existe ramo de erro**: o silencio e a ausencia do `else`, e e silencio que o P7 manda preservar.',
    },

    // ---------------------------------------------------------------------
    // Sondagem de DNS curinga — 1 linha, em claro, e sem promocao.
    // ---------------------------------------------------------------------
    {
      id: 'sondagem-de-dns-curinga',
      servico: 'sondagem-de-dns-curinga',
      enderecoNoLegado: 'http://<seis caracteres aleatorios>.<dominio>',
      metodo: 'GET',
      paraQue:
        'verifica se o DNS curinga esta configurado, antes de habilitar subdominios na instalacao de rede',
      protocolo: 'http',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'literal-no-codigo',
      verificacaoDeCertificado: 'exigida',
      validacaoDeDestino: 'nao-validada',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/schema.php:1162',
        'wp-admin/includes/schema.php:1163',
        'wp-admin/includes/schema.php:1177',
      ],
      nota: '⚠️ **O 14o canal em claro do nucleo, e ele nao esta nos 13.** O esquema e literal e **nao** ha promocao a canal seguro neste ponto — e a diferenca em relacao aos 13, que todos tem o par de linhas de promocao. Esta de fora daquela contagem porque o 13 conta o literal do servico de infraestrutura, e este endereco e do dominio da propria rede. Falhar aqui so muda o texto de um aviso de tela (`:1176` e `:1177`).',
    },

    // ---------------------------------------------------------------------
    // Banco de dados — 1 linha, por constante.
    // ---------------------------------------------------------------------
    {
      id: 'banco-de-dados',
      servico: 'banco-mysql-mariadb',
      enderecoNoLegado: '<DB_HOST>/<DB_NAME>',
      metodo: 'SQL',
      paraQue:
        'onde todo o estado do sistema vive: conteudo, contas, opcoes, metadados, comentarios e termos',
      protocolo: 'mysql',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'constante-de-configuracao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-config-sample.php:24',
        'wp-includes/class-wpdb.php:1990',
        'wp-includes/class-wpdb.php:2053',
      ],
      nota: 'Esta no catalogo porque a analise do legado poe o banco **fora** da fronteira do sistema: e armazenamento de terceiro na perspectiva do codigo. ⚠️ O codigo nao configura canal seguro para esta conexao em ponto nenhum (zero ocorrencia de `MYSQLI_CLIENT_SSL` e de `ssl_set` em `class-wpdb.php`), logo a cifra e do ambiente e nao do produto — e por isso `do-dado`, e nao `sem-cifra`.',
    },

    // ---------------------------------------------------------------------
    // Sistema de arquivos remoto — 3 linhas, e e por aqui que o codigo do
    // proprio sistema e substituido.
    // ---------------------------------------------------------------------
    {
      id: 'arquivos-remotos-ftp',
      servico: 'sistema-de-arquivos-remoto',
      enderecoNoLegado: '<FTP_HOST>:<porta, 21 de fabrica>',
      metodo: 'FTP',
      paraQue:
        'escrever no diretorio do site quando o runtime nao tem permissao direta: instalar e atualizar nucleo, extensao e tema',
      protocolo: 'ftp',
      cifraDeNascimento: 'sem-cifra',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'constante-de-configuracao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: ['filesystem_method'],
      ancoras: [
        'wp-admin/includes/class-wp-filesystem-ftpext.php:135',
        'wp-admin/includes/class-ftp-pure.php:49',
      ],
      nota: '⚠️ Quando o remoto entra, **o canal de fabrica e FTP puro**: nome e senha de uma conta com escrita no diretorio do site atravessam a rede em claro, a menos que uma das duas constantes de canal seguro esteja definida. O modo de fabrica e escrita direta (`wp-admin/includes/file.php:2273`), logo este canal so aparece quando aquela falha.',
    },
    {
      id: 'arquivos-remotos-ftps',
      servico: 'sistema-de-arquivos-remoto',
      enderecoNoLegado:
        '<FTP_HOST>, so quando FTP_SSL esta definida e a extensao de FTP do runtime esta carregada',
      metodo: 'FTP com TLS',
      paraQue: 'o mesmo que o anterior, com canal seguro',
      protocolo: 'ftp',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'constante-de-configuracao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/class-wp-filesystem-ftpext.php:132',
        'wp-admin/includes/class-wp-filesystem-ftpext.php:133',
        'wp-admin/includes/file.php:2476',
      ],
      nota: 'Nao e promocao do canal anterior: e outra implementacao, escolhida por constante. Por isso duas linhas, e `promovidoSeOAmbienteSuportar: false` nas duas.',
    },
    {
      id: 'arquivos-remotos-ssh2',
      servico: 'sistema-de-arquivos-remoto',
      enderecoNoLegado: '<FTP_HOST>:<porta, 22 de fabrica>',
      metodo: 'SSH2/SFTP',
      paraQue: 'o mesmo, por SSH, com senha ou par de chaves',
      protocolo: 'ssh2',
      cifraDeNascimento: 'cifrado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'constante-de-configuracao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: [],
      ancoras: [
        'wp-admin/includes/class-wp-filesystem-ssh2.php:172',
        'wp-admin/includes/class-wp-filesystem-ssh2.php:174',
      ],
      nota: '⚠️ Cifrado, e **sem autenticar o servidor**: a chave de host so e fixada quando quem configura a fornece, e sem ela nao e verificada (`:172` a `:174`). E o mesmo padrao do canal seguro sem verificacao de certificado, em outro protocolo.',
    },

    // ---------------------------------------------------------------------
    // Proxy de saida — 1 linha, e o ponto unico por onde todas passam.
    // ---------------------------------------------------------------------
    {
      id: 'proxy-de-saida',
      servico: 'proxy-http-de-saida',
      enderecoNoLegado: '<WP_PROXY_HOST>:<WP_PROXY_PORT>',
      metodo: 'CONNECT',
      paraQue:
        'encaminha toda requisicao de saida do sistema, exceto os destinos isentos',
      protocolo: 'http',
      cifraDeNascimento: 'do-dado',
      promovidoSeOAmbienteSuportar: false,
      repeteEmClaroNaFalha: false,
      origemDoEndereco: 'constante-de-configuracao',
      verificacaoDeCertificado: 'nao-se-aplica',
      validacaoDeDestino: 'nao-se-aplica',
      fonte: 'nucleo',
      pontosDeExtensao: ['pre_http_send_through_proxy'],
      ancoras: [
        'wp-includes/class-wp-http-proxy.php:58',
        'wp-includes/class-wp-http-proxy.php:85',
        'wp-includes/class-wp-http.php:342',
      ],
      nota: 'Nao e integracao de negocio: e o ponto unico por onde todas as outras passam quando as duas constantes estao definidas, e portanto o ponto unico de falha de todas elas. ⚠️ Nenhuma dessas constantes tem valor conhecido nesta arvore: nao ha arquivo de configuracao.',
    },
  ]);
