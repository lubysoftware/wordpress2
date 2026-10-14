/**
 * O contexto da abertura: os colaboradores que chegam por argumento, e nenhum
 * por `import`.
 *
 * Entrega de **T003** da feature `008-privacidade-e-dados-pessoais` (US-1),
 * *"abrir solicitacao de dados pessoais identificada pelo endereco de e-mail"*.
 * Satisfaz **CA-1.1** a **CA-1.5** junto com os outros arquivos desta pasta;
 * este declara a forma de tudo o que a operacao precisa e nao tem.
 *
 * O caso de uso e
 * [UC-25](../../../../.specify/use-cases/UC-25-abrir-solicitacao-de-dados-pessoais.md),
 * que a tabela de rastreabilidade de `spec.md` liga a US-1 (*"REQ-086 · UC-25 ·
 * `domain.md §2.5` (D1) · `domain.md §2.5` (D2)"*).
 *
 * ---
 *
 * # Por que TUDO o que e de outro contexto esta aqui como campo
 *
 * A regra de dependencia 3 de `target_architecture.md` e literal:
 * *"`contextos/<a>/` para `contextos/<b>/` por `import` no topo do modulo:
 * proibido sempre, sem excecao"*, e AD-10 poe *"toda chamada BC para BC"* em
 * ligacao tardia. `wp_create_user_request()` toca **tres** contextos alem deste,
 * e nenhum deles pode ser importado:
 *
 * | o que o legado chama | ancora | de quem e | chega por |
 * |---|---|---|---|
 * | `sanitize_email()`, `is_email()`, `sanitize_key()`, `sanitize_text_field()` | `wp-includes/formatting.php:3831`, `:3613`, `:2191`, `:2057` | `plataforma/formatacao/`, feature 015 | {@link ContextoDeAbertura.sanitizarEmail} e as tres irmas |
 * | `wp_json_encode()` | `wp-includes/functions.php:4443` | idem | {@link ContextoDeAbertura.codificarJson} |
 * | `get_user_by( 'email', ... )` e `get_user_by( 'login', ... )` | `wp-includes/user.php:4820` e `wp-admin/includes/privacy-tools.php:130` | BC-05 | {@link ContaNaAbertura} |
 * | `wp_insert_post( ..., true )` | `wp-includes/user.php:4841` | BC-01 | {@link ConteudoNaPrivacidade} |
 * | `new WP_Query( ... )` | `wp-includes/user.php:4824` e `class-wp-privacy-requests-table.php:397` | BC-02 / feature 004 | {@link ConsultaDeSolicitacoes} |
 * | `current_time( 'mysql' )` nas duas formas | `wp-includes/user.php:4849` e `:4850` | `plataforma/`, feature 015 | {@link RelogioNaAbertura} |
 *
 * ⚠️ **Nenhum destes e porta do modulo.** As quatro portas de T001 sao as
 * bordas de AD-08 mais o relogio; estes sao colaboracoes entre modulos do mesmo
 * processo, e o precedente e o mesmo de `ClassificacaoNaPublicacao` em BC-01, de
 * `ConteudoNaMidia` em BC-04 e de `ChaveSanitizada` em
 * `contextos/conteudo/revisao/`.
 *
 * ---
 *
 * # ⚠️ A porta de dados deste modulo NAO e tocada pela abertura
 *
 * Isto nao e consequencia do desenho: e medida. T002 registrou que uma busca por
 * `$wpdb` em `wp-admin/includes/privacy-tools.php` devolve **zero** ocorrencias e
 * que a regiao de privacidade de `wp-includes/user.php` (`:3950` a `:5150`)
 * devolve **zero** — o caminho da privacidade do legado **nao emite comando
 * proprio**. As duas unicas coisas que a abertura faz com o banco sao a consulta
 * de duplicidade e a insercao, e as duas passam por modulo de outro contexto.
 *
 * Consequencia conferivel, e a suite a afirma: a porta falsa de dados sai da
 * abertura com `selecoes` e `escritas` **vazias**. Lista vazia e afirmacao, nao
 * ausencia (`parity_specs.md`, area 3 da Decisao 2: *"snapshot + sequencia de
 * comandos"*). Quem gravar daqui emite um comando que o legado nao emite.
 *
 * A **lista** (CA-1.4) e o oposto, e pelo mesmo motivo: ela chama
 * `wp_get_user_request()` por linha (`class-wp-privacy-requests-table.php:401`),
 * que e leitura deste contexto e sai pela porta deste modulo.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { ArmazenamentoDePrivacidade, ValorJson } from '../armazenamento/index.js';

/**
 * `sanitize_email( $email_address )` (`wp-includes/formatting.php:3831`), o
 * primeiro comando de `wp_create_user_request` (`wp-includes/user.php:4805`).
 *
 * Chega por argumento, e **nao** e implementada nesta pasta, pelo mesmo motivo
 * e com o mesmo aviso de `sanitize_key()` em
 * `contextos/conteudo/revisao/contexto-de-revisao.ts`: ela e de
 * `plataforma/formatacao/` (feature 015), tem ponto de extensao proprio
 * (`sanitize_email`, `:3904`) e uma versao aproximada mudaria **qual** endereco
 * e aceito — isto e, mudaria o conjunto de titulares com solicitacao valida.
 */
export type EmailSanitizado = (email: string) => string;

/**
 * `is_email( $email_address )` (`wp-includes/formatting.php:3613`).
 *
 * ⚠️ **Devolve o endereco, nao um booleano**, e a assinatura do legado e
 * `string|false`: o docblock diz *"Valid email address on success, false on
 * failure"*. A abertura so a usa em `! is_email( ... )` (`user.php:4808`), mas o
 * retorno e superficie publicada (P8) e o filtro `is_email` pode devolver outro
 * valor — por isso a forma fica como la.
 *
 * O proprio legado declara os limites dela no docblock: *"Does not grok i18n
 * domains. Not RFC compliant."* Reproduzir uma validacao melhor aqui aceitaria
 * endereco que o legado recusa.
 */
export type ConferenciaDeEmail = (email: string) => string | false;

/**
 * `sanitize_key( $action_name )` (`wp-includes/formatting.php:2191`), o segundo
 * comando da abertura (`wp-includes/user.php:4806`).
 *
 * E ela que abaixa a caixa e descarta o que nao e `[a-z0-9_\-]`, e e por isso
 * que `Export_Personal_Data` **nao** cai em `invalid_action`: vira
 * `export_personal_data` antes da comparacao.
 */
export type ChaveSanitizada = (chave: string) => string;

/**
 * `sanitize_text_field()` (`wp-includes/formatting.php:2057`), as duas leituras
 * do formulario da tela (`wp-admin/includes/privacy-tools.php:111` e `:112`).
 *
 * Esta separada de {@link ChaveSanitizada} porque no legado sao funcoes
 * diferentes com resultados diferentes sobre a mesma entrada: a tela sanitiza
 * **texto** e a funcao da API sanitiza **chave**, logo `type_of_action` passa
 * pelas duas, em ordem.
 */
export type TextoSanitizado = (texto: string) => string;

/**
 * `wp_json_encode( $request_data )` (`wp-includes/functions.php:4443`), o valor
 * que vai para `post_content` (`wp-includes/user.php:4846`).
 *
 * ⚠️ **Chega por argumento porque os bytes da coluna estao no contrato e
 * `JSON.stringify` nao produz os mesmos.** `wp_json_encode` chama
 * `json_encode( $value, 0, 512 )`, e com `$flags = 0` o PHP **escapa a barra**
 * (`/` vira `\/`) e **escapa todo caractere fora de ASCII** (`\uXXXX`); o
 * codificador do runtime nao faz nem uma coisa nem outra. `DB-SER`
 * (BR-MIGRAR-082) poe os bytes no contrato, e T002 deixou as duas diferencas
 * declaradas e nao resolvidas no cabecalho de
 * `../armazenamento/solicitacao.ts` — profundidade maxima de 512 e inteiro
 * grande virando decimal — para *"quem gravar dado auxiliar"*, que e esta
 * tarefa. Esta e a decisao: **nao se decide aqui**, declara-se a borda, porque
 * o codificador e de `plataforma/` (feature 015) e uma segunda derivacao
 * divergiria da primeira.
 *
 * ⚠️ **Devolve `false` onde o legado devolve `false`**: `wp_json_encode`
 * desiste depois da verificacao de sanidade (`:4454`). O caminho da tela nunca
 * chega la — ele passa `array()`, que codifica para `[]` nas duas linguagens —,
 * e o ramo existe porque o parametro e publico.
 */
export type CodificacaoJson = (valor: ValorJson) => string | false;

/**
 * Uma conta como a abertura a le. **Dois campos, e nada mais** — e o recorte de
 * `WP_User` que os dois caminhos do legado tocam.
 */
export interface ContaDoTitular {
  /** `$user->ID`, que vira `post_author` (`wp-includes/user.php:4821`). */
  readonly id: number;
  /**
   * `$user->user_email`, que a tela usa quando quem abre informou o **login**
   * em vez do endereco (`wp-admin/includes/privacy-tools.php:139`).
   */
  readonly enderecoDeEmail: string;
}

/**
 * As duas leituras de conta da abertura, declaradas aqui e implementadas em
 * BC-05.
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 *
 * ⚠️ As duas leem a tabela **global** `users`, que e o motivo pelo qual a porta
 * de dados deste modulo nao declara o prefixo base — a razao inteira esta no
 * cabecalho de `../portas/porta-de-dados.ts`. Montar aqui uma consulta a
 * `users` seria montar o nome de uma tabela global que este modulo nao escreve.
 */
export interface ContaNaAbertura {
  /**
   * `get_user_by( 'email', $email_address )` (`wp-includes/user.php:4820`).
   *
   * Devolve `null` onde o legado devolve `false`, e **o `null` nao e erro**: e
   * o titular sem conta no site, que e exatamente CA-1.3. Quem chama o traduz
   * em {@link SEM_CONTA}, como `$user && ! is_wp_error( $user ) ? $user->ID : 0`
   * faz em `:4821`.
   */
  obterPorEmail(enderecoDeEmail: string): ContaDoTitular | null;

  /**
   * `get_user_by( 'login', $username_or_email_address )`
   * (`wp-admin/includes/privacy-tools.php:130`).
   *
   * **So a tela usa**, e so quando o que foi informado nao e um endereco. O
   * legado confere `! $user instanceof WP_User` (`:131`), que e o `null` aqui.
   */
  obterPorLogin(login: string): ContaDoTitular | null;
}

/**
 * As oito chaves que `wp_create_user_request` entrega a `wp_insert_post`
 * (`wp-includes/user.php:4842` a `:4851`), **com os nomes do legado**.
 *
 * Os nomes nao sao traduzidos pelo mesmo motivo das 21 colunas de
 * `ColunasDaGravacao` em BC-01: eles sao **superficie publicada** (P8), e os
 * cinco pontos de extensao que `wp_insert_post` dispara recebem este arranjo
 * com estas chaves — `wp_insert_post_data` (`wp-includes/post.php:4978`) e
 * `pre_post_update` (`:4993`) leem `post_status` e `post_name` por esses nomes.
 *
 * ⚠️ **Sao oito, e as treze colunas restantes nao estao aqui**: quem as resolve
 * e `wp_insert_post`, com os defaults dele, e e por isso que a gravacao e dele.
 * A tabela das seis colunas que querem dizer outra coisa na solicitacao esta em
 * `../armazenamento/solicitacao.ts`.
 */
export interface PedidoDeInsercaoDaSolicitacao {
  /** A conta do titular, ou `0` quando ele nao tem conta (`:4843`). */
  readonly post_author: number;
  /** A **acao pedida** — *"Action name stored in post_name column"* (`:4844`). */
  readonly post_name: string;
  /** O **endereco do titular** — *"Email address stored in post_title column"* (`:4845`). */
  readonly post_title: string;
  /** O dado auxiliar do pedido, em JSON (`:4846`). */
  readonly post_content: string;
  /** `'request-' . $status` (`:4847`). */
  readonly post_status: string;
  /** `user_request` (`:4848`). */
  readonly post_type: string;
  /** `current_time( 'mysql', false )` — hora **local** do site (`:4849`). */
  readonly post_date: string;
  /** `current_time( 'mysql', true )` — hora **GMT** (`:4850`). */
  readonly post_date_gmt: string;
}

/**
 * O que `wp_insert_post( ..., true )` devolve — `int|WP_Error`
 * (`wp-includes/user.php:4841` com `$wp_error = true` em `:4852`).
 *
 * O segundo argumento do legado e `true`, logo a falha volta como **erro com
 * codigo e texto**, e nao como `0`. A forma e a mesma de
 * `ResultadoDaInsercaoDeAnexo` em BC-04, pela mesma razao.
 *
 * ⚠️ `solicitacaoId` pode ser `0` com `inserido: true`, e o ramo nao e
 * decorativo: a tela do legado tem um `elseif ( ! $request_id )` proprio
 * (`wp-admin/includes/privacy-tools.php:154`) com texto proprio. P8 e P7 mandam
 * clonar o que existe sem ser alcancado.
 */
export type ResultadoDaInsercaoDaSolicitacao =
  | { readonly inserido: true; readonly solicitacaoId: number }
  | {
      readonly inserido: false;
      readonly codigo: string;
      readonly mensagem: string;
    };

/**
 * A chamada que a abertura faz a BC-01, declarada aqui e implementada la.
 *
 * ⚠️ **E esta a ligacao que T002 deixou nomeada para esta tarefa.** O cabecalho
 * de `../armazenamento/solicitacao.ts` registra a razao com as tres medidas: o
 * comando do legado tem **21 colunas**, reescreve `post_modified` — de onde sai
 * o prazo de 24 horas de T005 — e dispara **cinco** pontos de extensao
 * publicos. Um `INSERT` nascido neste contexto nao seria o comando do legado em
 * nenhuma das tres contas.
 */
export interface ConteudoNaPrivacidade {
  /** `wp_insert_post( $postarr, true )` (`wp-includes/user.php:4841`). */
  inserirSolicitacao(
    pedido: PedidoDeInsercaoDaSolicitacao,
  ): ResultadoDaInsercaoDaSolicitacao;
}

/**
 * As variaveis de consulta que os dois `WP_Query` desta tarefa montam —
 * `wp-includes/user.php:4825` a `:4834` (duplicidade) e
 * `wp-admin/includes/class-wp-privacy-requests-table.php:370` a `:395` (lista).
 *
 * **Os nomes das chaves sao os do legado**, e pelo mesmo motivo de
 * {@link PedidoDeInsercaoDaSolicitacao}: extensao de terceiro intercepta
 * `pre_get_posts` e le `post_status`, `post_name__in` e `fields` por esses
 * nomes.
 *
 * Os campos opcionais sao os que **um** dos dois usa e o outro nao: a
 * duplicidade nao pagina e a lista nao filtra por titulo.
 */
export interface VariaveisDaConsultaDeSolicitacoes {
  /** `post_type` — sempre `user_request` nas duas (`user.php:4826`). */
  readonly post_type: string;
  /** `post_name__in` — a acao pedida, em arranjo de um (`:4827`). */
  readonly post_name__in: readonly string[];
  /** `post_status` — arranjo de dois na duplicidade, `'any'` ou um nome na lista. */
  readonly post_status: string | readonly string[];
  /** `title` — o endereco do titular. **So** a duplicidade (`:4828`). */
  readonly title?: string;
  /** `fields` — `'ids'`. **So** a duplicidade (`:4833`). */
  readonly fields?: string;
  /** `posts_per_page` — so a lista (`class-wp-privacy-requests-table.php:373`). */
  readonly posts_per_page?: number;
  /** `offset` — so a lista (`:374`). */
  readonly offset?: number;
  /** `s` — a busca da tela, cadeia vazia quando nao ha (`:376`). */
  readonly s?: string;
  /** `orderby` — `post_title` ou `post_date`, so quando a tela pede (`:385`). */
  readonly orderby?: string;
  /** `order` — `ASC` ou `DESC`, so quando a tela pede (`:389`). */
  readonly order?: string;
}

/**
 * O que a consulta devolve, no recorte que esta tarefa le.
 *
 * `totalEncontrado` e o `$requests_query->found_posts`, isto e, o
 * `SELECT FOUND_ROWS()` que `WP_Query` emite depois da consulta principal — a
 * duplicidade decide **so** por ele (`user.php:4837`) e a lista o usa para
 * paginar (`class-wp-privacy-requests-table.php:408`).
 */
export interface ResultadoDaConsultaDeSolicitacoes {
  /** Os identificadores, na ordem em que a consulta os devolveu. */
  readonly ids: readonly number[];
  /** `found_posts`. */
  readonly totalEncontrado: number;
}

/**
 * `new WP_Query( $args )` — a consulta, que **nao** e implementada aqui.
 *
 * Duas razoes, as mesmas que `ConsultaDeConteudo` de
 * `contextos/conteudo/revisao/contexto-de-revisao.ts` registra:
 *
 * 1. **no legado esta funcao tambem nao escreve SQL.** `wp_create_user_request`
 *    monta um arranjo e entrega; o `WHERE`, o `ORDER BY`, o
 *    `SQL_CALC_FOUND_ROWS` e o `SELECT FOUND_ROWS()` sao de
 *    `WP_Query::get_posts()` (`wp-includes/class-wp-query.php:2651` em diante).
 *    Uma segunda montagem do mesmo clausulado divergiria da primeira;
 * 2. **`WP_Query` e da feature 004** (`contextos/leitura-publica/consulta/`), e
 *    a cadeia de filtros dela e contrato publico (P2).
 *
 * O que **esta** nesta pasta e o que o legado decide antes de consultar: quais
 * variaveis, com quais valores, e o que se faz com a resposta.
 */
export type ConsultaDeSolicitacoes = (
  variaveis: VariaveisDaConsultaDeSolicitacoes,
) => ResultadoDaConsultaDeSolicitacoes;

/**
 * `current_time( 'mysql', $gmt )` nas duas formas
 * (`wp-includes/user.php:4849` e `:4850`).
 *
 * ⚠️ **Nao e a porta de relogio deste modulo, e a diferenca e medida.**
 * `PortaDeRelogio.agoraEmSegundos()` e `time()`: segundo inteiro em UTC, que e
 * o que os **prazos** desta feature comparam. O que a abertura precisa e texto
 * no formato do banco em **dois fusos**, e `current_time( 'mysql' )` o produz
 * com `wp_timezone()` — isto e, com as opcoes `timezone_string` e `gmt_offset`
 * (`wp-includes/functions.php:88` e `:89`). Derivar o segundo do primeiro
 * exigiria ler opcao por uma porta que este modulo nao tem, e **inventaria o
 * fuso**. Mesma decisao, e mesma razao, de `RelogioNoEnvio` em
 * `contextos/midia/envio/contexto-de-envio.ts`.
 *
 * Nenhum prazo sai daqui: a abertura **nao** tem prazo. O prazo de 24 horas e
 * contado de `post_modified_gmt`, que `wp_insert_post` escreve, e a conferencia
 * e de T005.
 */
export interface RelogioNaAbertura {
  /** `current_time( 'mysql', false )` — `AAAA-MM-DD HH:MM:SS` no fuso do site. */
  agoraNoFormatoDoBanco(): string;
  /** `current_time( 'mysql', true )` — o mesmo formato, em UTC. */
  agoraNoFormatoDoBancoEmGmt(): string;
}

/**
 * O contexto da operacao.
 *
 * Chega por argumento, e **nao** pela composicao do modulo, pelos dois motivos
 * que BC-04 registra na operacao dele: identidade, matriz de papeis e estado de
 * rede sao escopo de **requisicao** (AD-02, BR-MIGRAR-105), e a colaboracao com
 * os outros contextos e ligacao tardia (AD-10).
 */
export interface ContextoDeAbertura {
  /** A base da decisao de capacidade: matriz, rede e pontos de extensao. */
  readonly base: BaseDeAutorizacao;
  /** Quem esta abrindo. A abertura e a **unica** operacao desta feature com ator. */
  readonly ator: AtorDeAutorizacao;
  /**
   * O armazenamento de T002. **So a lista o usa** (CA-1.4), para
   * `wp_get_user_request()` por linha
   * (`class-wp-privacy-requests-table.php:401`); a abertura nao le nem grava
   * por ele — ver o cabecalho.
   */
  readonly armazenamento: ArmazenamentoDePrivacidade;
  /** As duas leituras de conta (BC-05). */
  readonly conta: ContaNaAbertura;
  /** A insercao da linha (BC-01). */
  readonly conteudo: ConteudoNaPrivacidade;
  /** Os dois `WP_Query` (feature 004). */
  readonly consultarSolicitacoes: ConsultaDeSolicitacoes;
  /** Os dois instantes no formato do banco. */
  readonly relogio: RelogioNaAbertura;
  /** `sanitize_email()`. */
  readonly sanitizarEmail: EmailSanitizado;
  /** `is_email()`. */
  readonly ehEmail: ConferenciaDeEmail;
  /** `sanitize_key()`. */
  readonly sanitizarChave: ChaveSanitizada;
  /** `sanitize_text_field()`. */
  readonly sanitizarTexto: TextoSanitizado;
  /** `wp_json_encode()`. */
  readonly codificarJson: CodificacaoJson;
  /**
   * `get_user_option( '{acao}_requests_per_page' )`, a opcao **por conta** que a
   * tela grava (`class-wp-list-table.php:991`).
   *
   * Opcional porque no legado ela quase nunca existe: a opcao e gravada so
   * quando quem olha muda a paginacao na aba de opcoes de tela. Ausente, zero e
   * negativo caem no valor de fabrica — ver `ITENS_POR_PAGINA_DA_LISTA` em
   * `./lista-de-solicitacoes.ts`.
   */
  readonly itensPorPaginaDaConta?: number;
}
