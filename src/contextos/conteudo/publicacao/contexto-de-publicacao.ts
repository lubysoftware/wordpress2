/**
 * O contexto de uma publicacao: tudo que US-1 precisa e que **nao e** porta
 * deste modulo.
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao` (US-1). Mesma forma
 * e mesmas razoes de
 * `contextos/identidade-e-acesso/administracao-de-contas/contexto-de-administracao.ts`
 * e de `plataforma/autorizacao/contexto-de-autorizacao.ts`, e as duas valem
 * palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 *   REQUISICAO, e a area 5 do criterio de paridade tem tolerancia **zero**.
 *   Nesta tarefa isso pesa: `02-publicacao-e-agendamento-de-conteudo.feature`
 *   tem cenario `@concorrencia` — *"duas gravacoes simultaneas de autores
 *   diferentes nao trocam de autoria"*, *"a decisao sobre o slug de cada um usa
 *   a capacidade de quem o gravou"*;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** AD-08
 *   fixa portas somente nas 5 bordas; AD-10 e a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"* e mandam
 *   resolver **toda** chamada entre contextos no momento da chamada.
 *
 * ---
 *
 * # Por que `wp_publish_post()` precisa de tres contextos alem do proprio
 *
 * A funcao do legado tem 40 linhas e atravessa quatro donos
 * (`wp-includes/post.php:5404`-`:5468`). O `plan.md` desta feature ja declara os
 * tres na secao *Sequencia*: *"Depende de 001 (identidade e autorizacao), de 003
 * (classificacao, pela regra do termo padrao aplicada na gravacao e na
 * publicacao) e de 011 (fila agendada, para a publicacao futura)"*.
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `current_user_can( $ptype->cap->publish_posts )` | `plataforma/autorizacao/` | {@link ContextoDePublicacao.base} e {@link ContextoDePublicacao.ator}, e a decisao vem de `perguntarPermissao()` — **import**, nao porta: a regra de dependencia 1 permite `contextos/` para `plataforma/` |
 * | `get_post_type_object()` | `plataforma/tipos-de-conteudo/`, que **nao existe nesta arvore** | {@link ContextoDePublicacao.tipoDeConteudo}, com o tipo que `plataforma/autorizacao/` ja declarou |
 * | `get_object_taxonomies()`, `get_the_terms()`, `get_option( 'default_category' )`, `wp_set_post_terms()` | BC-02, classificacao | {@link ClassificacaoNaPublicacao} |
 * | `wp_clear_scheduled_hook( 'publish_future_post', ... )` | BC-11, fila agendada (feature 011) | {@link FilaNaPublicacao} |
 * | `get_permalink()` | BC-07 / BC-08, `wp-includes/link-template.php:85` | {@link EnderecoDoConteudo} |
 *
 * **O tipo de conteudo reusa o tipo de `plataforma/autorizacao/`, e isso nao e
 * atalho.** `TipoDeConteudoNaAutorizacao` ja declara os dois campos que decidem
 * — o nome e o mapa `$post_type->cap` — e e o **mesmo** objeto do legado
 * (`get_post_type_object()`). Declarar um gemeo aqui faria duas leituras do
 * mesmo registro divergirem no dia em que uma das duas ganhasse um campo.
 *
 * ---
 *
 * # Tres coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **O relogio.** `wp_publish_post()` nao le o tempo: ele **nao** atualiza
 *    `post_modified` nem `post_modified_gmt`, e nao compara data nenhuma. A
 *    comparacao de data que decide agendado contra publicado esta em
 *    `wp_insert_post()` (`:4798`-`:4808`, T013) e a verificacao dupla em
 *    `check_and_publish_future_post()` (`:5482`, tambem T013). Pedir a porta de
 *    relogio aqui convidaria a tocar o carimbo de modificacao, que e **efeito no
 *    banco** (area 3 da Decisao 2) e que o legado nao toca neste caminho.
 * 2. **O cache de objeto.** `clean_post_cache( $post->ID )` roda entre o
 *    comando e a transicao (`:5450`), e nao ha cache nesta arvore — ver a
 *    divergencia declarada no README deste modulo e no cabecalho de
 *    `armazenamento/metadado.ts`. O ponto esta nomeado em
 *    `transicao-de-estado.ts`, no lugar exato do fluxo.
 * 3. **O corpo do conteudo.** Nada deste caminho le, filtra ou sanitiza
 *    `post_content`: `wp_publish_post()` nao toca a coluna. A sanitizacao e
 *    REQ-030, que ficou **fora do pacote** (`do-not-rewrite.md`) e esta na secao
 *    *Perguntas em aberto* de `spec.md` — e o passo 3 de UC-03 (*"sanitiza o
 *    corpo com kses, salvo se o ator tem HTML bruto liberado"*) acontece no
 *    caminho de **gravacao**, nao neste. Esta tarefa nao decide a sanitizacao de
 *    ninguem porque nao grava corpo nenhum.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
  TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { Conteudo, RepositorioDeConteudo } from '../armazenamento/index.js';

/**
 * O que a publicacao le e grava do armazenamento de T002.
 *
 * **So `posts`.** `wp_publish_post()` emite exatamente dois comandos de escrita
 * — o `UPDATE` do estado (`:5448`) e, dentro da transicao, o `UPDATE` do `guid`
 * quando ele esta vazio (`:8160`) — e nenhum deles toca `postmeta`. O que
 * escreve metadado neste caminho e `_publish_post_hook()`, um ouvinte declarado
 * e **nao** implementado aqui (ver `transicao-de-estado.ts`).
 */
export interface ArmazenamentoNaPublicacao {
  readonly conteudo: RepositorioDeConteudo;
}

/**
 * Uma taxonomia como `get_object_taxonomies( $tipo, 'object' )` a devolve
 * (`wp-includes/taxonomy.php:784`).
 *
 * Dois campos, e os dois decidem o laco de CA-1.4.
 */
export interface TaxonomiaNaPublicacao {
  /** `$tax_object->name` — e e por **nome** que a categoria e excecao. */
  readonly nome: string;
  /**
   * `! empty( $tax_object->default_term )` — se o **registro** da taxonomia
   * declarou termo padrao.
   *
   * E so a verdade do campo que o legado testa aqui: o conteudo de
   * `default_term` (nome, apelido e descricao) e consumido em
   * `register_taxonomy()`, que cria o termo e grava o identificador dele na
   * opcao `default_term_{taxonomia}` (`wp-includes/taxonomy.php:540`-`:557`).
   * Logo quem publica le a **opcao**, nao o registro — e e por isso que este
   * campo e booleano e nao o objeto.
   */
  readonly declaraTermoPadrao: boolean;
}

/**
 * O que `get_the_terms()` devolve, nas **tres** formas que o legado distingue
 * (`wp-includes/category-template.php:1282`).
 *
 * ⚠️ **A forma de erro nao e um caminho raro: ela salta o conteudo.** O legado
 * escreve `if ( ! empty( get_the_terms( $post, $taxonomy ) ) ) { continue; }`
 * (`wp-includes/post.php:5427`), e `! empty()` sobre um objeto `WP_Error` e
 * **verdadeiro** — logo taxonomia invalida faz o laco **pular** a atribuicao do
 * termo padrao, exatamente como faz uma taxonomia que ja tem termo. Um porte que
 * tratasse erro como "sem termos" atribuiria o padrao onde o legado nao
 * atribui, e isso e efeito no banco.
 */
export type TermosDoConteudoNaPublicacao =
  | {
      readonly erro: false;
      /** Os identificadores dos termos daquela taxonomia; lista vazia e ausencia. */
      readonly termos: readonly number[];
    }
  | {
      readonly erro: true;
      /** O codigo do `WP_Error`, como `invalid_taxonomy`. */
      readonly codigo: string;
    };

/**
 * As quatro chamadas que `wp_publish_post()` faz a BC-02, declaradas aqui e
 * implementadas la.
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 */
export interface ClassificacaoNaPublicacao {
  /**
   * `get_object_taxonomies( $post->post_type, 'object' )`
   * (`wp-includes/post.php:5420`).
   *
   * **A ordem e a do registro das taxonomias, e e dado.** O legado itera um
   * arranjo associativo alimentado por insercao, logo a sequencia de comandos
   * que sai do laco segue essa ordem — e a area 3 da Decisao 2 compara
   * *"snapshot + sequencia de comandos"*. Devolver um conjunto sem ordem aqui
   * tornaria a sequencia nao reproduzivel.
   */
  taxonomiasDoTipo(tipo: string): readonly TaxonomiaNaPublicacao[];

  /** `get_the_terms( $post, $taxonomy )` (`:5427`). */
  termosDoConteudo(
    conteudoId: number,
    taxonomia: string,
  ): TermosDoConteudoNaPublicacao;

  /**
   * `(int) get_option( $chave, 0 )` — a opcao que guarda o termo padrao
   * (`:5432` e `:5434`).
   *
   * A **chave** nao e parametro da porta por acidente: quem a monta e
   * `chaveDoTermoPadrao()`, em `termo-padrao-na-publicacao.ts`, porque a escolha
   * entre `default_category` e `default_term_{taxonomia}` e **regra deste
   * caminho** e nao detalhe de quem le opcao. A conversao para inteiro e a que o
   * legado faz, e `0` e o valor de fabrica que faz o laco desistir.
   */
  opcaoDeTermoPadrao(chave: string): number;

  /**
   * `wp_set_post_terms( $post->ID, array( $default_term_id ), $taxonomy )`
   * (`:5438`).
   *
   * **Nao devolve nada, e e de proposito.** No legado a funcao devolve
   * `array|false|WP_Error` e `wp_publish_post()` **ignora** o retorno: falha de
   * atribuicao de termo nao interrompe a publicacao e nao e registrada. E o P7
   * — *"preserve o modo de falha, inclusive o silencio"* —, e quem consumir esta
   * porta pode registrar o motivo, mas **nenhuma ramificacao do fluxo pode
   * passar a depender dele**.
   *
   * O terceiro argumento do legado (`$append`) nao viaja: no unico chamador
   * deste caminho ele vale `false`, e a substituicao integral e o que o laco
   * precisa.
   */
  definirTermos(
    conteudoId: number,
    termos: readonly number[],
    taxonomia: string,
  ): void;
}

/**
 * `publish_future_post` — o gancho do evento de publicacao agendada.
 *
 * E contrato publico (P2, P8): nenhuma extensao de terceiro encontra um gancho
 * renomeado, e este e escutado por `check_and_publish_future_post()`
 * (`wp-includes/default-filters.php:357`). O nome fica declarado aqui para que
 * T013 (US-6), que o **agenda**, nao o invente diferente de quem o **limpa**.
 */
export const GANCHO_DE_PUBLICACAO_AGENDADA = 'publish_future_post';

/**
 * A unica coisa que esta feature pede a fila agendada no caminho de publicacao:
 * **limpar** o evento pendente daquele conteudo (CA-1.5).
 *
 * **Por que fila e porta, e nao consulta pela porta de dados:** no legado a fila
 * **e** uma linha de `options` (`wp-includes/cron.php`), logo seria tecnicamente
 * possivel trata-la como dado deste modulo. Nao e. O dono do formato da fila, da
 * trava e do disparo e BC-11, e esta feature e **cliente** dele — mesma postura,
 * com as mesmas palavras, de
 * `contextos/retencao-e-descarte/portas/porta-de-fila-agendada.ts`.
 *
 * ## O que esta porta deliberadamente NAO tem
 *
 * - **Nao agenda.** `wp_schedule_single_event()` entra em T013 (US-6), que e
 *   quem poe o evento na fila (`_future_post_hook()`,
 *   `wp-includes/post.php:8205`). Dar aqui o metodo de agendar convidaria T003 a
 *   reproduzir meia US-6.
 * - **Nao dispara e nao executa.** AD-07 e literal: *"o disparo nao bloqueante
 *   tem de **falhar**, e o criterio de aceite e a falha"*. Nenhum metodo desta
 *   porta permite que este modulo avance a fila.
 * - **Nao tem trava e nao tem prazo.** Os numeros da fila (60 segundos de
 *   transiente, 10 minutos de `WP_CRON_LOCK_TIMEOUT`) sao da feature 011, e o P6
 *   manda que cada numero viva no ponto de configuracao da tarefa que o
 *   implementa.
 */
export interface FilaNaPublicacao {
  /**
   * `wp_clear_scheduled_hook( $hook, $args )` (`wp-includes/cron.php:701`), que
   * devolve quantos eventos foram desagendados, ou `false`.
   *
   * **O argumento viaja, e ele e parte da identidade do evento.** O legado
   * identifica um evento por gancho **mais** o arranjo de argumentos, e aqui o
   * arranjo e `array( $post->ID )` (`wp-includes/post.php:8189`): limpar sem o
   * identificador apagaria o evento de **todo** conteudo agendado do site.
   *
   * **O retorno e ignorado pelo chamador do legado**, e esta tarefa o ignora
   * tambem na decisao — ele entra no resultado da operacao apenas para que
   * CA-1.5 seja afirmavel por teste, e nenhum ramo do fluxo o consulta (P7).
   */
  limparGancho(gancho: string, argumentos: readonly unknown[]): number | false;
}

/**
 * `get_permalink( $conteudoId )` — o endereco do conteudo
 * (`wp-includes/link-template.php:85`), com o `false` do legado preservado.
 *
 * Chega como funcao, e nao como porta, porque e **outro contexto** e a chamada e
 * de ligacao tardia (AD-10): a resolucao de endereco depende da estrutura de
 * links, do tipo de conteudo e, para o tipo padrao com `%category%`, dos termos
 * do proprio conteudo. Nada disso e desta feature.
 *
 * O `false` nao foi trocado por `null` de proposito: no legado ele acontece
 * quando `empty( $post->ID )`, e e o valor que `$wpdb->update()` coage para
 * cadeia vazia ao gravar o `guid`. Trocar o tipo esconderia essa coercao.
 */
export type EnderecoDoConteudo = (conteudoId: number) => string | false;

/**
 * Os pontos de extensao que a publicacao atravessa.
 *
 * Nomeados e opcionais pela mesma razao dos ganchos da autorizacao: o **P2** poe
 * cada um no contrato publico *"com o nome, os argumentos, a ordem de disparo e
 * a capacidade de alterar o resultado que ele tem hoje"*, e o barramento que os
 * dispara (`plataforma/barramento/`) **nao existe nesta arvore** — REQ-162 esta
 * em `do-not-rewrite.md` e nenhuma tarefa deste pacote o constroi. Ponto sem
 * interceptador e, no legado, um no-op.
 *
 * **A ordem de disparo e a regra, e ela esta em `transicao-de-estado.ts` e em
 * `publicar.ts`, afirmada por teste** — o ultimo cenario de
 * `02-publicacao-e-agendamento-de-conteudo.feature` cobra exatamente isto: *"a
 * sequencia de chamadas registrada e identica nas duas metades"*.
 *
 * Um ponto e **filtro** e os outros nove sao **acao**: so
 * {@link GanchosDaPublicacao.filtrarGuid} devolve valor, e e por isso que ele e
 * o unico que pode mudar o resultado.
 */
export interface GanchosDaPublicacao {
  /**
   * `transition_post_status` — **acao**, tres argumentos, na ordem `novo`,
   * `anterior`, `conteudo` (`wp-includes/post.php:5921`).
   *
   * ⚠️ **Este interceptador entra DEPOIS do ouvinte do nucleo.** O nucleo
   * registra `_transition_post_status` com prioridade **5**
   * (`wp-includes/default-filters.php:448`) e `add_action` sem prioridade entra
   * em **10**, logo o que este interceptador ve quando roda e um conteudo cujo
   * `guid` ja foi reposto e cujo evento agendado ja foi limpo. A lista completa
   * dos ouvintes de fabrica, com prioridade e dono, esta em
   * `transicao-de-estado.ts`.
   */
  readonly aoTransitarEstado?: (
    estadoNovo: string,
    estadoAnterior: string,
    conteudo: Conteudo,
  ) => void;

  /**
   * `{$old_status}_to_{$new_status}` — **acao**, um argumento (`:5938`).
   *
   * O nome e dinamico e e isso que o torna util: `draft_to_publish` dispara so
   * na primeira publicacao daquele rascunho. Recebe o **nome montado** junto do
   * conteudo para que quem registrar o barramento nao o remonte diferente.
   */
  readonly aoTransitarDeParaEstado?: (gancho: string, conteudo: Conteudo) => void;

  /**
   * `{$new_status}_{$post->post_type}` — **acao**, tres argumentos (`:5975`).
   *
   * ⚠️ O docblock do legado avisa o que um porte "limpa" por engano: este ponto
   * dispara *"both when a post is first transitioned to that status from
   * something else, as well as upon subsequent post updates (old and new status
   * are both the same)"*. Quem quer so a primeira vez usa
   * `transition_post_status`, nao este. Nesta operacao os dois estados nunca
   * sao iguais, porque a guarda de P7 ja desistiu antes.
   */
  readonly aoEntrarNoEstadoDoTipo?: (
    gancho: string,
    conteudoId: number,
    conteudo: Conteudo,
    estadoAnterior: string,
  ) => void;

  /**
   * `get_the_guid` — **filtro**, dois argumentos, e o **unico ponto deste
   * caminho que muda o resultado** (`wp-includes/post-template.php:235`).
   *
   * Quem o intercepta decide se o `guid` conta como vazio, logo decide se o
   * `UPDATE` do endereco sai ou nao. Um porte que lesse a coluna direto, sem
   * passar por aqui, gravaria endereco onde o legado nao grava.
   */
  readonly filtrarGuid?: (guid: string, conteudoId: number) => string;

  /**
   * `private_to_published` — **acao depreciada** desde 2.3.0, um argumento
   * (`wp-includes/post.php:8171`).
   *
   * ⚠️ O nome mente e o nome e contrato: ele dispara em **toda** entrada em
   * publicado a partir de qualquer estado que nao seja publicado, nao so a
   * partir de privado. A analise completa, com a razao pela qual ele nao se
   * remove (P8, e a resposta 7 de `questions.md`), esta em
   * `transicao-de-estado.ts`, na constante
   * `PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO`.
   */
  readonly aoEntrarEmPublicadoPeloPontoDepreciado?: (
    gancho: string,
    conteudoId: number,
  ) => void;

  /** `edit_post_{$post->post_type}` — **acao**, dois argumentos (`:5455`). */
  readonly aoEditarConteudoDoTipo?: (
    gancho: string,
    conteudoId: number,
    conteudo: Conteudo,
  ) => void;

  /** `edit_post` — **acao**, dois argumentos (`:5458`). */
  readonly aoEditarConteudo?: (conteudoId: number, conteudo: Conteudo) => void;

  /**
   * `save_post_{$post->post_type}` — **acao**, tres argumentos (`:5461`).
   *
   * O terceiro argumento e `$update`, e aqui ele vale **sempre `true`**: o
   * legado passa o literal `true` neste caminho, porque publicar e atualizar um
   * registro que ja existia.
   */
  readonly aoGravarConteudoDoTipo?: (
    gancho: string,
    conteudoId: number,
    conteudo: Conteudo,
    atualizacao: boolean,
  ) => void;

  /** `save_post` — **acao**, tres argumentos (`:5464`). */
  readonly aoGravarConteudo?: (
    conteudoId: number,
    conteudo: Conteudo,
    atualizacao: boolean,
  ) => void;

  /**
   * `wp_insert_post` — **acao**, tres argumentos (`:5467`).
   *
   * ⚠️ O nome engana e e contrato publico: este ponto dispara **tambem** quando
   * ninguem inseriu nada. `wp_publish_post()` o dispara com `$update = true`, e
   * extensao que conte insercao por ele conta publicacao junto — no legado
   * tambem.
   */
  readonly aoInserirConteudo?: (
    conteudoId: number,
    conteudo: Conteudo,
    atualizacao: boolean,
  ) => void;

  /**
   * `wp_after_insert_post` — **acao**, quatro argumentos (`:6008`).
   *
   * E o ultimo do caminho, e o quarto argumento e o que o torna diferente dos
   * outros: o conteudo **como estava antes** da publicacao. E por isso que
   * `wp_publish_post()` le a linha uma segunda vez **antes** do `UPDATE`
   * (`:5417`) — ver a nota de leituras em `publicar.ts`.
   */
  readonly depoisDeInserirConteudo?: (
    conteudoId: number,
    conteudo: Conteudo,
    atualizacao: boolean,
    conteudoAnterior: Conteudo | null,
  ) => void;
}

/**
 * O contexto de uma operacao de publicacao.
 *
 * {@link ContextoDePublicacao.base} e {@link ContextoDePublicacao.ator} chegam
 * separados de proposito, como em `contexto-de-administracao.ts`: a base e o que
 * nao muda dentro da requisicao (matriz gravada, rede, constantes, casos de
 * traducao) e o ator e quem publica. Junta-los esconderia que a **mesma** base
 * responde por atores diferentes, que e o que o cenario de concorrencia de
 * `PT-002` exercita.
 */
export interface ContextoDePublicacao {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /** Quem publica. */
  readonly ator: AtorDeAutorizacao;

  readonly armazenamento: ArmazenamentoNaPublicacao;
  readonly classificacao: ClassificacaoNaPublicacao;
  readonly fila: FilaNaPublicacao;

  /**
   * `get_post_type_object( $nome )`, ou `null` quando o tipo nao esta
   * registrado.
   *
   * `null` nao e caminho raro: e um dos tres ramos de erro de `PERM-4`
   * (BR-MIGRAR-090), e o que esta operacao faz com ele esta em
   * `permissao-de-publicacao.ts`.
   */
  readonly tipoDeConteudo: (nome: string) => TipoDeConteudoNaAutorizacao | null;

  readonly enderecoDoConteudo: EnderecoDoConteudo;

  readonly ganchos?: GanchosDaPublicacao;
}
