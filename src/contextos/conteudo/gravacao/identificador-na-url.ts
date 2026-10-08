/**
 * **US-3**: o identificador na URL — derivado do titulo, sanitizado, e **unico
 * so a partir da publicacao**.
 *
 * Entrega de **T007** da feature `002-autoria-e-publicacao`. A regra e
 * **BR-MIGRAR-005** (`P5`, confianca 🟢), e o catalogo a escreve assim:
 *
 * > **Rascunho pode ter slug duplicado; publicado, nao.** A unicidade e
 * > dispensada em `draft`, `pending`, `auto-draft`, em revisao e no tipo
 * > `user_request`. Efeito observavel: o slug de um rascunho **muda sozinho** ao
 * > publicar.
 * > — `target_business_rules.md`, BR-MIGRAR-005
 *
 * E a nota de compatibilidade da mesma regra fecha a porta para a "correcao" que
 * um porte faria sem perceber: *"E atalho de desempenho com efeito observavel.
 * Um alvo que declare `UNIQUE` no slug **quebra** o produto: a dispensa e a
 * regra."* O risco 4 de `plan.md` repete em outra ordem: *"um porte que torne o
 * identificador unico desde o rascunho produz enderecos diferentes dos do
 * legado"*.
 *
 * ---
 *
 * # Os quatro criterios de US-3, e onde cada um se cumpre
 *
 * | criterio | o que o cumpre | ancora |
 * |---|---|---|
 * | **CA-3.1** *em rascunho, pendente e rascunho automatico, identificadores repetidos sao aceitos* | a dispensa de {@link identificadorUnico}, e a derivacao que **nao** acontece em {@link identificadorValido} | `:5561`-`:5565` e `:4745`-`:4750` |
 * | **CA-3.2** *na publicacao o identificador e tornado unico, e o conteudo responde nesse endereco* | {@link identificadorUnico} nos tres escopos, e a **segunda escrita** de `gravar.ts` | `:4906`, `:5047`-`:5052` |
 * | **CA-3.3** *o autor e informado quando o identificador muda na publicacao* | o par pedido/gravado que `gravar.ts` devolve, mais {@link identificadorDeAmostra} de `identificador-de-amostra.ts` | `wp-admin/includes/post.php:1479` |
 * | **CA-3.4** *em pendente de quem nao pode publicar o identificador fica vazio* | `permissao-do-identificador.ts` | `:4731`-`:4739` |
 *
 * ---
 *
 * # 🔴 O achado que decide esta tarefa: sao DOIS caminhos para publicado, e so
 * um cobra unicidade
 *
 * `wp_publish_post()` **nao toca `post_name`** — T003 ja o apurou e registrou no
 * README deste modulo. Quem cobra unicidade e `wp_unique_post_slug()`, chamada
 * de `wp_insert_post()` (`:4906`), isto e, no caminho de **gravacao**. Logo:
 *
 * - publicar **salvando** (`wp_insert_post()` com `post_status = 'publish'`)
 *   troca o identificador duplicado por um unico, e e ai que *"o slug do
 *   rascunho muda sozinho"* acontece;
 * - publicar pela **transicao** (`wp_publish_post()`, a operacao de T003) grava
 *   uma coluna so, e o identificador duplicado **sobrevive a publicacao**.
 *
 * Isto nao e inconsistencia a resolver: e o produto. Chamar
 * {@link identificadorUnico} de dentro de `publicar()` fecharia o duplicado que
 * o legado deixa passar, e o primeiro cenario `@critico` de `PT-002` compara o
 * resultado *"byte a byte nas duas"*.
 *
 * ---
 *
 * # A dispensa, que e a regra, e os CINCO casos dela
 *
 * `wp_unique_post_slug()` devolve o identificador **como veio**, sem consultar
 * nada, em cinco situacoes (`:5561`-`:5565` e `:5624`-`:5625`):
 *
 * | # | caso | por que |
 * |---|---|---|
 * | 1 | `draft` | o rascunho pode repetir: e o que US-2 grava |
 * | 2 | `pending` | o pendente de US-7 tambem, e o de colaborador vem **vazio** (CA-3.4) |
 * | 3 | `auto-draft` | o rascunho automatico de US-11 nasce antes de haver titulo |
 * | 4 | `inherit` **em** `revision` | versao e conteudo filho (US-10), e o nome dela e derivado do pai |
 * | 5 | tipo `user_request` | a solicitacao de dado pessoal de BC-06 usa o campo para outra coisa |
 * | 6 | tipo `nav_menu_item` | item de menu nao tem endereco proprio — e **depois** do ponto de extensao, e so no ramo hierarquico |
 *
 * Os casos 4, 5 e 6 **nao sao desta feature** e estao aqui porque sao linhas da
 * funcao portada: omitir qualquer um deles faria a funcao cobrar unicidade onde
 * o legado nao cobra, e as tres sao linhas de `wp-includes/post.php`, nao das
 * features de versao, de dado pessoal e de menu. Mesmo precedente do `inherit`
 * do anexo em `estado-na-gravacao.ts`.
 *
 * ---
 *
 * # Os TRES escopos de unicidade, que sao tres consultas diferentes
 *
 * | tipo | escopo | consulta |
 * |---|---|---|
 * | `attachment` | **toda** a tabela, qualquer tipo | `:5598` |
 * | hierarquico (pagina) | dentro do **mesmo pai**, e disputando com anexo | `:5632` |
 * | plano (conteudo em linha do tempo) | dentro do **proprio tipo** | `:5662` |
 *
 * O comentario do legado no ramo do meio e a regra: *"Pages are in a separate
 * namespace than posts so page slugs are allowed to overlap post slugs"*.
 * Unificar as tres numa consulta so — *"unico na tabela"* — seria mais simples e
 * mudaria o endereco de toda pagina cujo apelido coincide com o de um post.
 *
 * ## O que, alem da colisao, tambem forca o sufixo
 *
 * A colisao e **uma** das razoes. As outras, por ramo:
 *
 * | razao | anexo | hierarquico | plano |
 * |---|---|---|---|
 * | nome de feed (`feed`, `rdf`, `rss`, `rss2`, `atom`) | sim | sim | sim |
 * | a cadeia `embed` | sim | sim | sim |
 * | numero puro, com ou sem a base de paginacao (`page/2`) | — | sim | — |
 * | numero que colidiria com arquivo de data | — | — | sim |
 * | o ponto de extensao do ramo | sim | sim | sim |
 *
 * As tres primeiras sao endereco que o roteador do legado reserva: um conteudo
 * chamado `feed` seria lido como o feed do seu proprio pai.
 *
 * ---
 *
 * # Os CINCO pontos de extensao desta funcao, declarados porque o P2 manda
 *
 * Nenhum e emitido por barramento — REQ-162 esta em `do-not-rewrite.md` —, e
 * todos sao contrato publico, com nome, argumentos e posicao:
 *
 * | # | ponto | tipo | argumentos | linha |
 * |---|---|---|---|---|
 * | 1 | `pre_wp_unique_post_slug` | filtro | `null`, `$slug`, `$post_id`, `$post_status`, `$post_type`, `$post_parent` | `:5582` |
 * | 2 | `wp_unique_post_slug_is_bad_attachment_slug` | filtro | `false`, `$slug` | `:5609` |
 * | 3 | `wp_unique_post_slug_is_bad_hierarchical_slug` | filtro | `false`, `$slug`, `$post_type`, `$post_parent` | `:5645` |
 * | 4 | `wp_unique_post_slug_is_bad_flat_slug` | filtro | `false`, `$slug`, `$post_type` | `:5701` |
 * | 5 | `wp_unique_post_slug` | filtro | `$slug`, `$post_id`, `$post_status`, `$post_type`, `$post_parent`, `$original_slug` | `:5730` |
 *
 * ⚠️ **O ponto 1 curto-circuita a funcao inteira**, e o docblock do legado diz
 * como: *"Returning a non-null value will short-circuit the unique slug
 * generation, returning the passed value instead"*. E o teste e `null !==`, nao
 * a verdade de PHP: devolver `''` ou `false` **para** a geracao e grava esse
 * valor. Esta reproduzido como esta.
 *
 * ⚠️ **O ponto 1 vem DEPOIS da dispensa** (`:5561` antes de `:5582`): em
 * rascunho, pendente, rascunho automatico, versao e solicitacao de dado pessoal
 * ele **nao dispara**. Uma extensao que conte chamadas por ele conta menos em
 * rascunho — no legado tambem.
 *
 * ---
 *
 * # O que este arquivo NAO faz, e de quem e
 *
 * | ausencia | ancora | de quem e |
 * |---|---|---|
 * | `sanitize_title()` e `utf8_uri_encode()` | `formatting.php:2228` e `:1160` | `plataforma/formatacao/`, feature 015 — chegam por {@link TextoDoIdentificador} |
 * | `$wp_rewrite->feeds`, `$wp_rewrite->pagination_base` e `permalink_structure` | `class-wp-rewrite.php:342`, `:105` e a opcao | BC-07 / BC-08 — chegam por {@link ReescritaNaGravacao} |
 * | `is_post_type_hierarchical()` | `post.php:2202` | `plataforma/tipos-de-conteudo/`, que **nao existe nesta arvore** |
 * | o sufixo `__trashed`, que tambem mexe no identificador | `:4871`-`:4902` | feature 005 (`PT-003`) |
 * | `clean_post_cache()` depois da segunda escrita | `:5051` | ninguem: REQ-165 ficou fora do pacote |
 */

import { TIPO_DE_ANEXO, TIPO_DE_VERSAO } from '../armazenamento/index.js';
import type { RepositorioDeConteudo } from '../armazenamento/index.js';
import { ESTADO_HERDADO_DO_ANEXO } from './estado-na-gravacao.js';
import { vazioComoNoPhp, verdadeiroComoNoPhp } from './verdade-de-php.js';

/* ── O VOCABULARIO DESTA REGRA ─────────────────────────────────────────────── */

/**
 * Os tres estados que **dispensam** a unicidade e aceitam identificador vazio
 * (`:4746`, `:5047` e `:5561`).
 *
 * A mesma lista aparece **tres** vezes no legado, com `in_array( ..., true )`
 * nas tres, e por isso ela e constante e nao literal repetido: as tres tem de
 * mudar juntas ou nenhuma muda. Sao exatamente os estados de US-2 (`draft`),
 * US-7 (`pending`) e US-11 (`auto-draft`) — e e essa coincidencia que a prosa de
 * `spec.md` chama de *"a unicidade e dispensada antes disso"*.
 *
 * ⚠️ **Nao e a lista dos estados de data flutuante**, mesmo sendo os mesmos tres
 * valores: aquela esta em `data-na-gravacao.ts`, vem do campo `date_floating` do
 * registro de estado (`../estado-editorial.ts`) e muda quando uma extensao
 * registra estado proprio. Esta e literal no codigo da funcao e nao muda com
 * registro nenhum. Duas listas iguais hoje, de donos diferentes.
 */
export const ESTADOS_QUE_DISPENSAM_IDENTIFICADOR: readonly string[] =
  Object.freeze(['draft', 'pending', 'auto-draft']);

/**
 * `user_request` — o tipo cuja unicidade e dispensada inteira (`:5562`).
 *
 * E a solicitacao de dado pessoal, de BC-06, que guarda no campo o e-mail
 * pedido em vez de um endereco. `target_architecture.md` descreve o ciclo dela
 * como *"sem intersecao com a maquina de `post_status`"*, e esta linha e a prova
 * de que ela tambem nao tem endereco.
 */
export const TIPO_DE_SOLICITACAO_DE_DADO_PESSOAL = 'user_request';

/**
 * `nav_menu_item` — o tipo hierarquico que devolve o identificador sem consultar
 * nada (`:5624`-`:5625`).
 *
 * ⚠️ **A dispensa dele e mais tarde que as outras cinco**, e isso e observavel:
 * ela esta **depois** do ponto `pre_wp_unique_post_slug` e **dentro** do ramo
 * hierarquico, logo item de menu dispara o ponto 1 e os outros cinco casos nao.
 * Reproduzido na posicao, e nao agrupado com a lista de cima.
 */
export const TIPO_DE_ITEM_DE_MENU = 'nav_menu_item';

/**
 * `embed` — a cadeia que nenhum identificador pode ser (`:5612`, `:5648` e
 * `:5704`).
 *
 * E endereco reservado do roteador: `/{conteudo}/embed/` serve a incorporacao
 * oEmbed, que `integrations.md` conta entre as 7 superficies produzidas.
 */
export const IDENTIFICADOR_RESERVADO_DE_INCORPORACAO = 'embed';

/**
 * `200` — o tamanho maximo do identificador na geracao do sufixo (`:5617`,
 * `:5654` e `:5710`).
 *
 * **E numero do legado, e vive aqui com o valor de fabrica, como o P6 pede.**
 * Nao e o tamanho da coluna: `posts.post_name` e `varchar(200)`
 * (`../armazenamento/esquema.ts`), e os dois coincidem **de proposito** — o
 * truncamento existe para que o sufixo caiba sem a coluna degradar em silencio
 * (`DB-DEG`, BR-MIGRAR-083).
 *
 * ⚠️ O legado nao trunca o identificador **sem** sufixo: `sanitize_title()` ja o
 * limita a 200 por `utf8_uri_encode( $title, 200 )`, e e so na alternativa
 * numerada que `_truncate_post_slug()` entra, com `200 - (strlen($sufixo) + 1)`.
 */
export const TAMANHO_MAXIMO_DO_IDENTIFICADOR = 200;

/**
 * `2` — o primeiro sufixo que a alternativa recebe (`:5615`, `:5652`, `:5708`).
 *
 * Nao e `1`: o segundo `titulo` do site e `titulo-2`, e e por isso que o
 * endereco que o autor viu some sem aviso. Numero de fabrica, declarado (P6).
 */
export const PRIMEIRO_SUFIXO_DO_IDENTIFICADOR = 2;

/* ── OS COLABORADORES, QUE NAO SAO PORTA ──────────────────────────────────── */

/**
 * O contexto em que `sanitize_title()` e chamada, **com os nomes do legado**
 * (`formatting.php:2228`).
 *
 * Os dois que esta tarefa usa sao `save` e `old-save`, e a diferenca entre eles
 * **nao e cosmetica**: `'save' === $context` decide se `remove_accents()` roda
 * (`:2231`) e decide o bloco de substituicoes de
 * `sanitize_title_with_dashes()` (`:2300`). Logo `old-save` e uma sanitizacao
 * **diferente**, nao a mesma com outro nome — e e exatamente por isso que o
 * legado a usa para reconhecer identificador gravado por versao antiga.
 *
 * `display` e `query` entram na uniao porque sao os outros dois contextos que o
 * legado conhece (`sanitize_title_for_query()`, `:2263`), e quem implementar a
 * funcao precisa saber que sao quatro. Nenhum dos dois e usado aqui.
 */
export type ContextoDeSanitizacaoDeTitulo =
  | 'save'
  | 'old-save'
  | 'display'
  | 'query';

/**
 * As duas funcoes de texto que o identificador precisa, declaradas aqui e
 * implementadas em `plataforma/formatacao/`.
 *
 * **Chegam como colaborador de ligacao tardia, e nao como porta**, pela mesma
 * razao e com as mesmas palavras de {@link DatasDoSite} em
 * `contexto-de-gravacao.ts`: AD-08 fixa portas somente nas 5 bordas, e as duas
 * sao de `plataforma/`, que por AD-08 **nao ganha porta**. A pasta nao existe
 * nesta arvore e a feature dela e a 015; declarar a forma aqui e o que permite a
 * esta tarefa existir sem decidir no lugar dela.
 *
 * ⚠️ **Nao as implemente "o suficiente".** `sanitize_title()` do legado e
 * `remove_accents()` mais a cadeia de filtros cujo interceptador de fabrica e
 * `sanitize_title_with_dashes()` (`default-filters.php:309`, prioridade 10, tres
 * argumentos) — 80 linhas que preservam octeto escapado, derrubam caixa com
 * `mb_strtolower`, convertem seis entidades HTML em hifen e **apagam** 30
 * sequencias percent-codificadas, uma a uma. O identificador gravado e comparado
 * **byte a byte** contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116), e uma versao
 * aproximada produz endereco diferente para todo titulo com acento, aspa curva
 * ou travessao.
 */
export interface TextoDoIdentificador {
  /**
   * `sanitize_title( $title, $fallback_title, $context )` —
   * `formatting.php:2228`.
   *
   * O segundo argumento e a **reserva**: o valor devolvido quando a sanitizacao
   * resulta em cadeia vazia ou `false` (`:2246`-`:2248`). Nos tres usos desta
   * feature ele e `''` duas vezes (`:4747` e `:4753`) e o **identificador do
   * conteudo** uma (`:5048`) — e nesse caso o legado passa um **numero**, que a
   * funcao devolve como numero e o `$wpdb` coage para texto na coluna. A coercao
   * esta feita no chamador, e nao escondida aqui.
   */
  sanitizarTitulo(
    titulo: string,
    reserva: string,
    contexto: ContextoDeSanitizacaoDeTitulo,
  ): string;

  /**
   * `utf8_uri_encode( $utf8_string, $length, true )` — `formatting.php:1160`.
   *
   * Usada em **um** lugar: o truncamento do identificador que ja vem
   * percent-codificado (`_truncate_post_slug()`, `:5751`). O terceiro argumento
   * do legado (`$encode_ascii_characters`) e sempre `true` ali, e por isso nao
   * viaja.
   *
   * ⚠️ O `$length` conta **octetos do resultado codificado**, nao caracteres, e
   * a funcao para antes de estourar em vez de cortar no meio de um caractere
   * (`:1178`-`:1180`). Um `substring` de JavaScript no lugar disso corta por
   * unidade de UTF-16 e produz outro identificador.
   */
  codificarEmUtf8NaUrl(texto: string, tamanho: number): string;
}

/**
 * O que a unicidade le da reescrita de endereco — `$wp_rewrite` e a opcao da
 * estrutura de links.
 *
 * **Sao leituras, e por isso sao funcoes e nao valores.** No legado as tres
 * acontecem **dentro** de `wp_unique_post_slug()`, a cada chamada
 * (`:5591`, `:5649` e `:5673`): a estrutura de links e opcao gravada, e o objeto
 * de reescrita e global reconstruido no arranque. Congela-las no momento de
 * montar o contexto faria duas chamadas da mesma requisicao divergirem de duas
 * do legado depois de `update_option( 'permalink_structure' )`.
 *
 * Nenhuma delas e porta: sao de BC-07 / BC-08, por ligacao tardia (AD-10).
 */
export interface ReescritaNaGravacao {
  /**
   * `$wp_rewrite->feeds` — `class-wp-rewrite.php:342`.
   *
   * De fabrica sao cinco: `feed`, `rdf`, `rss`, `rss2`, `atom`. A lista e
   * filtravel e cresce com extensao, e o legado se defende de ela nao ser
   * arranjo (`:5592`-`:5594`); aqui o tipo ja garante a forma.
   */
  feeds(): readonly string[];

  /**
   * `$wp_rewrite->pagination_base` — `class-wp-rewrite.php:105`, de fabrica
   * `page`.
   *
   * Entra **so** no ramo hierarquico, dentro da expressao
   * `@^(page)?\d+$@` (`:5649`): uma pagina chamada `2` ou `page2` colidiria com
   * a paginacao da propria arvore.
   */
  baseDePaginacao(): string;

  /**
   * `get_option( 'permalink_structure' )` — a estrutura de links, texto vazio
   * numa instalacao nova.
   *
   * Entra **so** no ramo plano, e so para identificador numerico (`:5673`). Em
   * instalacao de fabrica a opcao e vazia, logo nao ha `%postname%`, logo
   * **nenhum numero colide** — e e por isso que a conferencia deste ramo precisa
   * declarar a estrutura em vez de supo-la.
   */
  estruturaDeLinks(): string;
}

/* ── PASSO 11: O IDENTIFICADOR DERIVADO E SANITIZADO ──────────────────────── */

/** O que {@link identificadorValido} precisa saber, com os nomes do legado. */
export interface PedidoDeIdentificadorValido {
  /** `$post_name` como chegou ao passo 11 — ver `campos-na-gravacao.ts`. */
  readonly identificadorNaUrl: string;
  /** `$post_title`, cru. A derivacao usa o titulo, nao o corpo. */
  readonly titulo: string;
  /** `$post_status` **resolvido** (`estado-na-gravacao.ts`). */
  readonly estado: string;
  /** `$update` — se o caminho e o de atualizacao. */
  readonly atualizacao: boolean;
  /** `$post_id`. Lido so na atualizacao, e so depois da primeira comparacao. */
  readonly conteudoId: number;
}

/**
 * **Passo 11** (`:4741`-`:4763`): *"Create a valid post name. Drafts and pending
 * posts are allowed to have an empty post name."*
 *
 * Os dois ramos, e o que decide entre eles e `empty()` — logo o identificador
 * `'0'` cai no ramo da derivacao, como se nao tivesse sido informado:
 *
 * 1. **vazio**: fora de `draft`, `pending` e `auto-draft`, deriva do **titulo**
 *    (`sanitize_title( $post_title )`); nos tres, fica vazio. **E esta a metade
 *    de CA-3.1 que nao e unicidade**: o rascunho nao ganha endereco nenhum, e e
 *    por isso que o dele *"muda sozinho"* — na publicacao ele deixa de ser
 *    vazio;
 * 2. **informado**: sanitiza. Na **atualizacao**, antes disso, reconhece o
 *    identificador gravado por versao antiga do legado e o **conserva**.
 *
 * ## O ramo de compatibilidade, que e o unico lugar desta tarefa com tres
 * condicoes em `&&`
 *
 * ```php
 * $check_name = sanitize_title( $post_name, '', 'old-save' );
 * if ( $update
 *     && strtolower( urlencode( $post_name ) ) === $check_name
 *     && get_post_field( 'post_name', $post_id ) === $check_name
 * ) { $post_name = $check_name; }
 * ```
 *
 * O que ele reconhece: um identificador que **ja esta gravado** exatamente como
 * a sanitizacao antiga o produziria, e que nao mudou. Conservar e o que impede
 * uma atualizacao qualquer de reescrever o endereco de conteudo antigo — que
 * seria quebra de link silenciosa, a mesma que CA-3.3 existe para evitar.
 *
 * ⚠️ **O curto-circuito do `&&` e observavel, e por isso esta reproduzido:** a
 * terceira condicao e uma **leitura** (`get_post_field`), e ela so acontece
 * quando as duas primeiras passam. Avaliar as tres sempre acrescentaria uma
 * consulta por gravacao de conteudo existente, e a area 3 da Decisao 2 compara
 * *"snapshot + **sequencia de comandos**"*.
 */
export function identificadorValido(
  texto: TextoDoIdentificador,
  repositorio: RepositorioDeConteudo,
  pedido: PedidoDeIdentificadorValido,
): string {
  // `:4745` — `empty( $post_name )`, logo `'0'` conta como vazio.
  if (vazioComoNoPhp(pedido.identificadorNaUrl)) {
    // `:4746`-`:4750`. CA-3.1: nos tres estados o identificador fica vazio, e e
    // dessa ausencia que o "muda sozinho" da publicacao nasce.
    return ESTADOS_QUE_DISPENSAM_IDENTIFICADOR.includes(pedido.estado)
      ? ''
      : texto.sanitizarTitulo(pedido.titulo, '', 'save');
  }

  // `:4753` — a sanitizacao antiga, calculada **antes** do `if`, como no legado.
  const identificadorAntigo = texto.sanitizarTitulo(
    pedido.identificadorNaUrl,
    '',
    'old-save',
  );

  // `:4755`-`:4758`, com o curto-circuito preservado: a leitura e a terceira
  // condicao, e nao acontece quando a segunda falha.
  if (
    pedido.atualizacao &&
    urlencodeComoNoPhp(pedido.identificadorNaUrl).toLowerCase() ===
      identificadorAntigo &&
    (repositorio.obterPorId(pedido.conteudoId)?.identificadorNaUrl ?? '') ===
      identificadorAntigo
  ) {
    return identificadorAntigo;
  }

  // `:4761` — conteudo novo, ou identificador que mudou.
  return texto.sanitizarTitulo(pedido.identificadorNaUrl, '', 'save');
}

/* ── PASSO 18 E 20: A UNICIDADE ───────────────────────────────────────────── */

/**
 * Os cinco pontos de extensao de `wp_unique_post_slug()`.
 *
 * Opcionais e nomeados pela mesma razao dos seis de `contexto-de-gravacao.ts`: o
 * **P2** poe cada um no contrato publico *"com o nome, os argumentos, a ordem de
 * disparo e a capacidade de alterar o resultado"*, e o barramento que os
 * dispararia nao existe nesta arvore (REQ-162, `do-not-rewrite.md`). Ponto sem
 * interceptador e, no legado, um no-op.
 *
 * **Os cinco sao filtro**, e os cinco podem mudar o endereco do conteudo. A
 * tabela com nome, argumentos e linha de cada um esta no cabecalho deste
 * arquivo.
 */
export interface GanchosDoIdentificadorUnico {
  /**
   * `pre_wp_unique_post_slug` — **filtro**, seis argumentos (`:5582`).
   *
   * Devolver qualquer coisa que **nao seja `null`** curto-circuita a funcao e
   * grava o valor devolvido. O teste do legado e `null !== $override_slug`, e
   * **nao** a verdade de PHP: `''` e `false` tambem param a geracao. Por isso o
   * retorno e `string | null` e o `null` significa *"siga"*.
   */
  readonly filtrarIdentificadorAntesDaUnicidade?: (
    identificadorDeSubstituicao: null,
    identificadorNaUrl: string,
    conteudoId: number,
    estado: string,
    tipo: string,
    paiId: number,
  ) => string | null;

  /**
   * `wp_unique_post_slug_is_bad_attachment_slug` — **filtro**, dois argumentos
   * (`:5609`).
   */
  readonly filtrarIdentificadorRuimDeAnexo?: (
    ruim: boolean,
    identificadorNaUrl: string,
  ) => unknown;

  /**
   * `wp_unique_post_slug_is_bad_hierarchical_slug` — **filtro**, quatro
   * argumentos (`:5645`).
   */
  readonly filtrarIdentificadorRuimHierarquico?: (
    ruim: boolean,
    identificadorNaUrl: string,
    tipo: string,
    paiId: number,
  ) => unknown;

  /**
   * `wp_unique_post_slug_is_bad_flat_slug` — **filtro**, tres argumentos
   * (`:5701`).
   */
  readonly filtrarIdentificadorRuimPlano?: (
    ruim: boolean,
    identificadorNaUrl: string,
    tipo: string,
  ) => unknown;

  /**
   * `wp_unique_post_slug` — **filtro**, seis argumentos, e e o **ultimo** da
   * funcao (`:5730`).
   *
   * O sexto argumento e o identificador **como entrou**, antes do sufixo: e o
   * unico ponto deste caminho que recebe as duas versoes, e e por ele que uma
   * extensao sabe que o endereco mudou.
   */
  readonly filtrarIdentificadorUnico?: (
    identificadorNaUrl: string,
    conteudoId: number,
    estado: string,
    tipo: string,
    paiId: number,
    identificadorOriginal: string,
  ) => string;
}

/** O que a unicidade precisa saber, com os nomes do legado (`:5560`). */
export interface PedidoDeIdentificadorUnico {
  /** `$slug` — o identificador desejado. */
  readonly identificadorNaUrl: string;
  /** `$post_id` — `0` na insercao, porque a linha ainda nao existe. */
  readonly conteudoId: number;
  /** `$post_status` resolvido. */
  readonly estado: string;
  /** `$post_type` resolvido. */
  readonly tipo: string;
  /** `$post_parent` — a coluna crua, e nao o vinculo nomeado de T002. */
  readonly paiId: number;
}

/** O que a unicidade le de fora: a tabela, a reescrita e o registro de tipos. */
export interface ContextoDoIdentificadorUnico {
  readonly texto: TextoDoIdentificador;
  readonly repositorio: RepositorioDeConteudo;
  readonly reescrita: ReescritaNaGravacao;
  /**
   * `is_post_type_hierarchical( $tipo )` — `wp-includes/post.php:2202`.
   *
   * Decide entre o ramo do meio e o ultimo, e por isso decide **o escopo da
   * unicidade**. No legado a resposta vem do registro do tipo
   * (`$post_type->hierarchical`), que e de `plataforma/tipos-de-conteudo/` — e
   * **tipo nao registrado devolve `false`**, caindo no ramo plano, em vez de
   * recusar. Quem implementar reproduz isso devolvendo `false`, nao lancando.
   */
  readonly tipoEHierarquico: (tipo: string) => boolean;
  readonly ganchos?: GanchosDoIdentificadorUnico;
}

/**
 * `wp_unique_post_slug( $slug, $post_id, $post_status, $post_type, $post_parent )`
 * — **CA-3.2**, e a dispensa de **CA-3.1** (`wp-includes/post.php:5560`).
 *
 * Exportada porque e **superficie publicada** (P8): e funcao publica do nucleo,
 * chamada de `wp_insert_post()` (`:4906` e `:5048`), do painel
 * (`wp-admin/includes/post.php:1507`, o endereco de amostra que CA-3.3 usa) e de
 * qualquer extensao.
 *
 * A ordem dos passos e a do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | a dispensa: cinco casos, sem consultar nada | `:5561`-`:5565` |
 * | 2 | o ponto que curto-circuita | `:5582`-`:5585` |
 * | 3 | a lista de feeds | `:5591` |
 * | 4 | o ramo do tipo: anexo, hierarquico ou plano | `:5596`, `:5623`, `:5660` |
 * | 5 | o ponto final, que recebe o original junto | `:5730` |
 */
export function identificadorUnico(
  contexto: ContextoDoIdentificadorUnico,
  pedido: PedidoDeIdentificadorUnico,
): string {
  const { identificadorNaUrl, conteudoId, estado, tipo, paiId } = pedido;

  // Passo 1 (`:5561`-`:5565`): a dispensa, que e a regra. Cinco casos, e
  // **nenhum ponto de extensao dispara neles** — ver o aviso no cabecalho.
  if (
    ESTADOS_QUE_DISPENSAM_IDENTIFICADOR.includes(estado) ||
    (estado === ESTADO_HERDADO_DO_ANEXO && tipo === TIPO_DE_VERSAO) ||
    tipo === TIPO_DE_SOLICITACAO_DE_DADO_PESSOAL
  ) {
    return identificadorNaUrl;
  }

  const ganchos = contexto.ganchos;

  // Passo 2 (`:5582`-`:5585`): `null !==`, e nao a verdade de PHP.
  const substituicao = ganchos?.filtrarIdentificadorAntesDaUnicidade?.(
    null,
    identificadorNaUrl,
    conteudoId,
    estado,
    tipo,
    paiId,
  );
  if (substituicao !== undefined && substituicao !== null) {
    return substituicao;
  }

  // `:5589` — guardado agora, para o ultimo ponto receber as duas versoes.
  const identificadorOriginal = identificadorNaUrl;

  // Passo 3 (`:5591`): e uma leitura, a cada chamada.
  const feeds = contexto.reescrita.feeds();
  const repositorio = contexto.repositorio;

  let identificador = identificadorNaUrl;

  if (tipo === TIPO_DE_ANEXO) {
    // Ramo 1 (`:5596`): o anexo e unico em TODA a tabela, qualquer tipo.
    const emUso = repositorio.identificadorDeAnexoEmUso(
      identificador,
      conteudoId,
    );
    const ruim = ganchos?.filtrarIdentificadorRuimDeAnexo?.(
      false,
      identificador,
    );

    if (
      verdadeiroComoNoPhp(emUso) ||
      feeds.includes(identificador) ||
      identificador === IDENTIFICADOR_RESERVADO_DE_INCORPORACAO ||
      verdadeiroComoNoPhp(ruim)
    ) {
      identificador = alternativaNumerada(contexto, identificador, (tentativa) =>
        repositorio.identificadorDeAnexoEmUso(tentativa, conteudoId),
      );
    }
  } else if (contexto.tipoEHierarquico(tipo)) {
    // Ramo 2 (`:5623`): a pagina e unica dentro da PROPRIA arvore, e disputa com
    // anexo. O comentario do legado e a regra: *"Pages are in a separate
    // namespace than posts so page slugs are allowed to overlap post slugs"*.

    // `:5624`-`:5625`: a sexta dispensa, e ela e **depois** do ponto 1.
    if (tipo === TIPO_DE_ITEM_DE_MENU) {
      return identificador;
    }

    const emUso = repositorio.identificadorHierarquicoEmUso(
      identificador,
      tipo,
      conteudoId,
      paiId,
    );
    const ruim = ganchos?.filtrarIdentificadorRuimHierarquico?.(
      false,
      identificador,
      tipo,
      paiId,
    );

    if (
      verdadeiroComoNoPhp(emUso) ||
      feeds.includes(identificador) ||
      identificador === IDENTIFICADOR_RESERVADO_DE_INCORPORACAO ||
      colideComAPaginacao(contexto.reescrita.baseDePaginacao(), identificador) ||
      verdadeiroComoNoPhp(ruim)
    ) {
      identificador = alternativaNumerada(contexto, identificador, (tentativa) =>
        repositorio.identificadorHierarquicoEmUso(
          tentativa,
          tipo,
          conteudoId,
          paiId,
        ),
      );
    }
  } else {
    // Ramo 3 (`:5660`): o conteudo em linha do tempo e unico dentro do proprio
    // tipo — logo pagina e post podem repetir o endereco entre si.
    const emUso = repositorio.identificadorPlanoEmUso(
      identificador,
      tipo,
      conteudoId,
    );

    // `:5665` — `get_post( $post_id )`, **sem condicao**: esta leitura acontece
    // em toda gravacao que chega a este ramo, inclusive quando o identificador
    // nao e numerico e o resultado dela nao e consultado. Reproduzida na
    // posicao, porque a sequencia de comandos e o que a Decisao 2 compara.
    const conteudo = repositorio.obterPorId(conteudoId);

    const colideComArquivoDeData = colideComArquivoDeDataDoSite(
      contexto,
      identificador,
      tipo,
      conteudo === null ? null : conteudo.identificadorNaUrl,
    );

    const ruim = ganchos?.filtrarIdentificadorRuimPlano?.(
      false,
      identificador,
      tipo,
    );

    if (
      verdadeiroComoNoPhp(emUso) ||
      feeds.includes(identificador) ||
      identificador === IDENTIFICADOR_RESERVADO_DE_INCORPORACAO ||
      colideComArquivoDeData ||
      verdadeiroComoNoPhp(ruim)
    ) {
      identificador = alternativaNumerada(contexto, identificador, (tentativa) =>
        repositorio.identificadorPlanoEmUso(tentativa, tipo, conteudoId),
      );
    }
  }

  // Passo 5 (`:5730`).
  const filtroFinal = ganchos?.filtrarIdentificadorUnico;
  return filtroFinal === undefined
    ? identificador
    : filtroFinal(
        identificador,
        conteudoId,
        estado,
        tipo,
        paiId,
        identificadorOriginal,
      );
}

/**
 * O laco `do ... while` dos tres ramos (`:5615`-`:5621`, `:5652`-`:5658`,
 * `:5708`-`:5714`).
 *
 * E o mesmo laco nos tres, com a consulta de cada um, e e ele que produz o
 * `-2`, `-3`, `-4` do endereco que o autor nao escolheu. Tres coisas que ele faz
 * e que uma reescrita "mais limpa" perderia:
 *
 * 1. **o sufixo comeca em `2`**, nao em `1`;
 * 2. **o truncamento desconta o tamanho do sufixo em DIGITOS**
 *    (`200 - ( strlen( $suffix ) + 1 )`): ao passar de `-9` para `-10` o
 *    identificador base encolhe um caractere, e o endereco do centesimo
 *    homonimo nao e o do nono com outro numero;
 * 3. **a condicao de parada e a verdade de PHP do valor devolvido**, e nao
 *    *"nao achou linha"*: um identificador gravado como `'0'` para o laco.
 *
 * ⚠️ **O legado nao tem teto de tentativa aqui, e nao se inventa um.** O P6 e
 * literal: *"introduzir limite, prazo ou contagem que o legado nao tem e
 * violacao"*. O laco para quando a consulta nao acha mais nada, e e isso.
 */
function alternativaNumerada(
  contexto: ContextoDoIdentificadorUnico,
  identificadorNaUrl: string,
  emUso: (tentativa: string) => string | null,
): string {
  let sufixo = PRIMEIRO_SUFIXO_DO_IDENTIFICADOR;
  let tentativa: string;

  do {
    tentativa = `${truncarIdentificador(
      contexto.texto,
      identificadorNaUrl,
      TAMANHO_MAXIMO_DO_IDENTIFICADOR - (String(sufixo).length + 1),
    )}-${sufixo}`;
    sufixo += 1;
  } while (verdadeiroComoNoPhp(emUso(tentativa)));

  return tentativa;
}

/**
 * `_truncate_post_slug( $slug, $length )` —
 * `wp-includes/post.php:5745`.
 *
 * Privada no legado (`@access private`) e privada aqui. Os tres ramos dela, e o
 * que cada um pressupoe:
 *
 * 1. **cabe**: devolve como esta, menos os hifens do fim;
 * 2. **nao cabe e nao tem octeto escapado** (`urldecode( $slug ) === $slug`):
 *    corta por **byte** (`substr`). E seguro ali porque, nesse ramo, o
 *    identificador nao tem percent-escape e portanto nao tem caractere
 *    multibyte — `sanitize_title_with_dashes()` ja codificou tudo que nao e
 *    ASCII;
 * 3. **nao cabe e tem octeto escapado**: `utf8_uri_encode()` sobre o decodificado,
 *    que para antes de estourar o tamanho em vez de cortar no meio de um
 *    caractere.
 *
 * O `rtrim( $slug, '-' )` final vale nos **tres** ramos, inclusive no primeiro:
 * um identificador que termina em hifen perde o hifen mesmo sem truncamento, e e
 * por isso que `titulo-` mais sufixo da `titulo-2` e nao `titulo--2`.
 */
function truncarIdentificador(
  texto: TextoDoIdentificador,
  identificadorNaUrl: string,
  tamanho: number,
): string {
  let identificador = identificadorNaUrl;

  if (tamanhoEmOctetos(identificador) > tamanho) {
    const decodificado = urldecodeComoNoPhp(identificador);
    identificador =
      decodificado === identificador
        ? recortarOctetos(identificador, tamanho)
        : texto.codificarEmUtf8NaUrl(decodificado, tamanho);
  }

  return removerHifensDoFim(identificador);
}

/**
 * Se o identificador numerico colidiria com a paginacao da arvore —
 * `preg_match( "@^($wp_rewrite->pagination_base)?\d+$@", $slug )` (`:5649`).
 *
 * A base de paginacao entra na expressao **sem escape** no legado, e aqui
 * tambem: uma base com caractere especial de expressao regular produziria no
 * legado uma expressao diferente, e reproduzir o escape seria divergir. O valor
 * de fabrica e `page`, logo `2` e `page2` colidem e `pagina2` nao.
 */
function colideComAPaginacao(
  baseDePaginacao: string,
  identificadorNaUrl: string,
): boolean {
  return new RegExp(`^(${baseDePaginacao})?\\d+$`).test(identificadorNaUrl);
}

/**
 * Se o identificador numerico colidiria com um arquivo de data
 * (`:5667`-`:5690`).
 *
 * Tres condicoes antes de qualquer leitura de opcao, e as tres sao do legado:
 *
 * 1. o tipo e **`post`** — o unico que tem arquivo de data;
 * 2. o conteudo **nao existe** ou o identificador **mudou** (`! $post ||
 *    $post->post_name !== $slug`): o que ja esta gravado com esse endereco o
 *    conserva, e e por isso que a colisao e verificada so para endereco novo;
 * 3. o identificador e **so digitos**, e o numero nao e zero — `if ( $slug_num )`
 *    descarta `'0'`, `'00'` e `'0000'`, que sao numericos e valem zero.
 *
 * Os tres casos de colisao, com as palavras do comentario do legado: numero na
 * **primeira** posicao da estrutura pode ser ano; numero **depois de `%year%`** e
 * menor que 13 pode ser mes; numero **depois de `%monthnum%`** e menor que 32
 * pode ser dia.
 *
 * ⚠️ **`array_search()` devolve a posicao ou `false`, e o legado usa as duas**:
 * `0 === $postname_index` e a primeira posicao, e `$postname_index` sozinho e a
 * **verdade de PHP** do indice — logo a posicao `0` e falsa nos dois ramos
 * seguintes, e ausencia (`false`) tambem. Com `indexOf` isso vira `-1`, que e
 * verdadeiro: a conversao esta feita aqui, e nao herdada.
 */
function colideComArquivoDeDataDoSite(
  contexto: ContextoDoIdentificadorUnico,
  identificadorNaUrl: string,
  tipo: string,
  identificadorGravado: string | null,
): boolean {
  if (tipo !== TIPO_PADRAO_DO_ARQUIVO_DE_DATA) {
    return false;
  }
  if (identificadorGravado !== null && identificadorGravado === identificadorNaUrl) {
    return false;
  }
  if (!/^[0-9]+$/.test(identificadorNaUrl)) {
    return false;
  }

  // `:5670`-`:5672` — `(int) $slug`, e `if ( $slug_num )` descarta o zero.
  const numero = Number.parseInt(identificadorNaUrl, 10);
  if (numero === 0) {
    return false;
  }

  // `:5673`-`:5674` — `array_filter` descarta o fragmento vazio, logo as barras
  // do inicio e do fim da estrutura nao contam como posicao.
  const estrutura = contexto.reescrita
    .estruturaDeLinks()
    .split('/')
    .filter((fragmento) => fragmento !== '');
  const posicao = estrutura.indexOf(MARCA_DO_IDENTIFICADOR_NA_ESTRUTURA);

  // `:5683` — a primeira posicao pode ser ano.
  if (posicao === 0) {
    return true;
  }
  // `:5684`-`:5685` — `$postname_index &&` e a verdade de PHP: posicao 0 ja saiu
  // acima, e ausencia (`false` no legado, `-1` aqui) nao entra.
  if (posicao < 1) {
    return false;
  }

  const anterior = estrutura[posicao - 1];
  return (
    (anterior === MARCA_DE_ANO_NA_ESTRUTURA && numero < 13) ||
    (anterior === MARCA_DE_MES_NA_ESTRUTURA && numero < 32)
  );
}

/**
 * `post` — o unico tipo com arquivo de data, e por isso o unico em que um
 * identificador numerico colide (`:5669`).
 *
 * E o mesmo valor de `TIPO_PADRAO_DA_GRAVACAO`, em `estado-na-gravacao.ts`, e
 * **nao** e importado dele de proposito: la o literal responde *"o tipo que a
 * gravacao assume quando ninguem informa"* e aqui responde *"o tipo que tem
 * arquivo de data"*. Sao duas perguntas diferentes sobre o mesmo nome, e um dia
 * uma pode mudar sem a outra.
 */
const TIPO_PADRAO_DO_ARQUIVO_DE_DATA = 'post';

/** `%postname%` — a marca do identificador na estrutura de links (`:5674`). */
const MARCA_DO_IDENTIFICADOR_NA_ESTRUTURA = '%postname%';
/** `%year%` (`:5684`). */
const MARCA_DE_ANO_NA_ESTRUTURA = '%year%';
/** `%monthnum%` (`:5685`). */
const MARCA_DE_MES_NA_ESTRUTURA = '%monthnum%';

/* ── AS QUATRO FUNCOES DE TEXTO DA LINGUAGEM DE ORIGEM ────────────────────── */

/*
  Estas quatro sao semantica da LINGUAGEM, nao formatacao do site, e e por isso
  que elas ficam aqui em vez de em {@link TextoDoIdentificador}: `urlencode`,
  `urldecode`, `strlen` e `substr` sao primitivas do PHP, e as quatro divergem do
  equivalente obvio deste runtime. Mesmo precedente, e mesma nota, de
  `verdade-de-php.ts`: quando `plataforma/utilitarios/` existir (regra de
  dependencia 5 de `target_architecture.md`), as cinco descem juntas e nenhuma
  chamada muda de resultado.
*/

/**
 * `urlencode( $texto )` do PHP.
 *
 * ⚠️ **Nao e `encodeURIComponent`**, e as diferencas alcancam identificador real:
 * o PHP codifica o **espaco como `+`**, e escapa `!`, `'`, `(`, `)`, `*` e `~`,
 * que o `encodeURIComponent` deixa passar. Os unicos nao escapados sao letra,
 * digito, `-`, `_` e `.`.
 *
 * O uso aqui e uma comparacao (`:4756`), logo cada divergencia conservaria um
 * identificador que o legado reescreveria, ou o contrario.
 */
export function urlencodeComoNoPhp(texto: string): string {
  const escapados = /[^A-Za-z0-9\-_.]/g;
  return texto.replace(escapados, (caractere) => {
    if (caractere === ' ') {
      return '+';
    }
    return [...new TextEncoder().encode(caractere)]
      .map((octeto) => `%${octeto.toString(16).toUpperCase().padStart(2, '0')}`)
      .join('');
  });
}

/**
 * `urldecode( $texto )` do PHP.
 *
 * Decodifica `%XX` e o `+` como espaco, e — ao contrario de
 * `decodeURIComponent` — **nao lanca** em sequencia malformada: ela fica como
 * esta. O uso aqui e a comparacao `$decoded_slug === $slug` de
 * `_truncate_post_slug()`, que decide entre cortar por byte e recodificar; uma
 * excecao ali trocaria truncamento por falha de gravacao.
 */
export function urldecodeComoNoPhp(texto: string): string {
  const octetos: number[] = [];
  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i] as string;
    const escape = caractere === '%' ? texto.slice(i + 1, i + 3) : '';

    if (/^[0-9A-Fa-f]{2}$/.test(escape)) {
      octetos.push(Number.parseInt(escape, 16));
      i += 2;
      continue;
    }
    if (caractere === '+') {
      octetos.push(0x20);
      continue;
    }
    octetos.push(...new TextEncoder().encode(caractere));
  }
  return new TextDecoder().decode(new Uint8Array(octetos));
}

/** `strlen( $texto )` — **octetos**, e nao caracteres. */
function tamanhoEmOctetos(texto: string): number {
  return new TextEncoder().encode(texto).length;
}

/**
 * `substr( $texto, 0, $tamanho )` — recorte por **octeto**.
 *
 * O ramo do legado que a usa pressupoe texto sem percent-escape e portanto sem
 * caractere multibyte (ver {@link truncarIdentificador}); o recorte por octeto
 * esta reproduzido de qualquer forma, porque e o que o legado faz quando a
 * pressuposicao nao vale.
 */
function recortarOctetos(texto: string, tamanho: number): string {
  const octetos = new TextEncoder().encode(texto);
  if (octetos.length <= tamanho) {
    return texto;
  }
  return new TextDecoder().decode(octetos.slice(0, tamanho));
}

/** `rtrim( $texto, '-' )`. */
function removerHifensDoFim(texto: string): string {
  let fim = texto.length;
  while (fim > 0 && texto[fim - 1] === '-') {
    fim -= 1;
  }
  return texto.slice(0, fim);
}
