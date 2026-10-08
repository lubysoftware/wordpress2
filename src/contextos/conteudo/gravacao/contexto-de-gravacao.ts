/**
 * O contexto de uma gravacao de conteudo: tudo que US-2 precisa e que **nao e**
 * porta deste modulo.
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao` (US-2). Mesma forma
 * e mesmas razoes de `../publicacao/contexto-de-publicacao.ts`, e as duas valem
 * palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 *   REQUISICAO, e a area 5 do critério de paridade tem tolerancia **zero**.
 *   Nesta tarefa isso pesa mais do que na anterior:
 *   `02-publicacao-e-agendamento-de-conteudo.feature` tem cenario
 *   `@concorrencia` que fala deste caminho pelo nome — *"duas gravacoes
 *   simultaneas de autores diferentes nao trocam de autoria"* —, e a autoria e
 *   justamente o default que esta gravacao resolve a partir do ator
 *   (`$postarr['post_author'] ?? $user_id`, `wp-includes/post.php:4824`);
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** AD-08
 *   fixa portas somente nas 5 bordas; AD-10 e a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"* e mandam
 *   resolver **toda** chamada entre contextos no momento da chamada.
 *
 * ---
 *
 * # Por que a gravacao precisa de cinco colaboradores, e nenhum e porta nova
 *
 * `wp_insert_post()` tem mais de 700 linhas (`wp-includes/post.php:4598`-`:5312`)
 * e atravessa meia dezena de donos. O que **esta** tarefa porta — a resolucao
 * dos campos e a escrita da linha — depende de cinco coisas de fora, e o que
 * cada uma e no legado:
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `get_current_user_id()` (`:4604`) | `plataforma/autorizacao/` + BC-05 | {@link ContextoDeGravacao.ator} |
 * | `current_time()`, `get_gmt_from_date()`, `get_date_from_gmt()` | `plataforma/` (opcao de fuso + formatacao) | {@link DatasDoSite} |
 * | `post_type_supports()` (`:4675`-`:4677`) | `plataforma/tipos-de-conteudo/`, que **nao existe nesta arvore** | {@link ContextoDeGravacao.suportaRecurso} |
 * | `get_default_comment_status()` (`:4816`, `:4825`) | BC-03, interacao publica (`wp-includes/comment.php:363`) | {@link ContextoDeGravacao.estadoPadraoDeComentario} |
 * | `get_permalink()` (`:5121`) | BC-07 / BC-08 | {@link EnderecoDoConteudo}, o **mesmo tipo** que T003 declarou |
 *
 * **`EnderecoDoConteudo` e importado de `../publicacao/`, e isso nao e atalho.**
 * E o mesmo `get_permalink()`, com o mesmo `false` do legado, no mesmo bounded
 * context — a regra de dependencia 3 proibe atravessar **contextos**, nao pastas
 * do mesmo contexto. Um gemeo declarado aqui faria as duas leituras divergirem
 * no dia em que uma das duas tratasse o `false` diferente.
 *
 * ---
 *
 * # Quatro coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **A porta de relogio.** Ela existe no modulo (T001) e esta tarefa **nao a
 *    usa**: as tres leituras de tempo do caminho de gravacao sao
 *    `current_time( 'mysql' )`, `current_time( 'mysql', true )` e
 *    `get_date_from_gmt()` — as duas primeiras dependem do **fuso do site**, que
 *    e opcao (`gmt_offset` / `timezone_string`) e nao relogio, e o cabecalho de
 *    `../portas/porta-de-relogio.ts` ja registrou que *"o fuso do site... chega
 *    pela porta de dados (via `plataforma/opcoes/`)"* e que *"porta nao
 *    formata"*. Por isso as quatro funcoes de data chegam como colaborador de
 *    ligacao tardia, e nao como porta: quem as implementa resolve fuso e
 *    formato, que e trabalho de `plataforma/`. A porta de relogio continua sendo
 *    de **T013**, que compara segundo inteiro em UTC (`:4798`-`:4808`).
 * 2. **A base de autorizacao.** Esta gravacao **nao decide capacidade nenhuma**,
 *    e o legado tambem nao: `wp_insert_post()` nao tem portao — ver a secao
 *    *"O portao que esta funcao nao tem"* em `gravar.ts`. A unica decisao de
 *    capacidade do caminho de gravacao e a do identificador na URL de quem nao
 *    pode publicar (`:4731`-`:4739`), que e **T015** (US-7, CA-7.4), e e ela que
 *    vai acrescentar `base` a este contexto quando precisar.
 * 3. **A classificacao.** `wp_set_post_categories()` (`:5053`), `tax_input`
 *    (`:5089`) e o termo padrao do caminho de gravacao (`:5063`-`:5087`) sao
 *    BC-02, e a metade deles que esta feature cobra — CA-1.4 — foi entregue por
 *    T003 em `../publicacao/termo-padrao-na-publicacao.ts`. A tabela do fim de
 *    `index.ts` diz, linha por linha, o que fica para quem.
 * 4. **O cache de objeto.** `clean_post_cache()` roda duas vezes neste caminho
 *    (`:5051` e `:5155`) e nao ha cache nesta arvore (REQ-165 ficou fora do
 *    pacote). Os pontos estao nomeados na posicao exata do fluxo em `gravar.ts`.
 */

import type { AtorDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type { RepositorioDeConteudo } from '../armazenamento/index.js';
import type { EnderecoDoConteudo } from '../publicacao/index.js';

/**
 * O que a gravacao le e grava do armazenamento de T002.
 *
 * **So `posts`.** As escritas em `postmeta` deste caminho — `meta_input`
 * (`:5111`), `_wp_page_template` (`:5169`), `_wp_attachment_context` (`:5131`) e
 * a imagem destacada (`:5147`) — tem dono fora desta tarefa, e estao na tabela
 * do fim de `index.ts`. Nenhuma delas e condicao de CA-2.1, CA-2.2 ou CA-2.3.
 */
export interface ArmazenamentoNaGravacao {
  readonly conteudo: RepositorioDeConteudo;
}

/**
 * As quatro funcoes de data que o caminho de gravacao usa, declaradas aqui e
 * implementadas em `plataforma/`.
 *
 * **Sao quatro porque o legado chama quatro, e cada uma tem um fuso diferente.**
 * Trocar qualquer uma pela outra muda o valor gravado em coluna `datetime`, que
 * e efeito no banco (area 3 da Decisao 2):
 *
 * | # | funcao do legado | ancora | o que devolve |
 * |---|---|---|---|
 * | 1 | `current_time( 'mysql' )` | `:4790`, `wp-includes/functions.php:102` | agora, **no fuso do site** |
 * | 2 | `current_time( 'mysql', true )` | `:4791` | agora, em **UTC** |
 * | 3 | `get_date_from_gmt( $gmt )` | `:5528`, `functions.php:4044` | a data informada em UTC, **convertida para o fuso do site** |
 * | 4 | `get_gmt_from_date( $data )` | `:4781`, `functions.php:4011` | a data informada no fuso do site, **convertida para UTC** |
 *
 * ⚠️ **O fuso do site nao e um deslocamento fixo.** `wp_timezone()` prefere
 * `timezone_string` (um nome de zona, com horario de verao) e so cai em
 * `gmt_offset` quando ele nao existe (`functions.php:170`-`:204`), e as duas
 * opcoes nascem da instalacao. Quem implementar esta interface com soma de
 * segundos acerta o site de fuso fixo e erra o de zona nomeada duas vezes por
 * ano — e a Decisao 2 compara **byte a byte** o que foi gravado.
 *
 * **Nenhum formato e parametro.** As quatro devolvem e recebem o formato do
 * banco (`Y-m-d H:i:s`), porque e ele que vai para a coluna; `current_time()`
 * aceita outros formatos no legado que este caminho nao usa.
 */
export interface DatasDoSite {
  /** `current_time( 'mysql' )` — agora, no fuso do site. */
  agoraNoFusoDoSite(): string;
  /** `current_time( 'mysql', true )` — agora, em UTC. */
  agoraEmUtc(): string;
  /** `get_date_from_gmt( $dataGmt )` — de UTC para o fuso do site. */
  deUtcParaOFusoDoSite(dataGmt: string): string;
  /** `get_gmt_from_date( $data )` — do fuso do site para UTC. */
  doFusoDoSiteParaUtc(data: string): string;
}

/**
 * Os recursos de tipo que esta gravacao pergunta, pelos nomes do legado.
 *
 * Sao os tres de `$maybe_empty` (`:4675`-`:4677`), e nao ha um quarto: o
 * `thumbnail` de `:5139` e da imagem destacada, que nao e desta tarefa.
 */
export const RECURSOS_DO_CORPO_VAZIO = Object.freeze([
  'editor',
  'title',
  'excerpt',
] as const);

/**
 * `comment`, `pingback` e `trackback` — os tres valores que
 * `get_default_comment_status()` distingue no segundo argumento
 * (`wp-includes/comment.php:363`).
 *
 * O caminho de gravacao usa dois: a omissao (`comment`) para `comment_status` e
 * `pingback` para `ping_status`. `trackback` entra aqui porque o legado trata os
 * dois ultimos **no mesmo `case`**, e quem implementar a funcao precisa saber
 * que sao tres entradas e duas saidas.
 */
export type TipoDeComentarioNaGravacao = 'comment' | 'pingback' | 'trackback';

/**
 * As 21 colunas resolvidas, **com os nomes do legado**, na ordem do `compact()`
 * de `:4912`-`:4932`.
 *
 * Os nomes sao os do banco, e nao os do armazenamento de T002, por uma razao de
 * contrato: este objeto e o `$data` que os filtros de dados recebem e devolvem,
 * e extensao de terceiro o indexa por `post_status`, `post_name`,
 * `post_date_gmt`. Renomear as chaves aqui quebraria todo interceptador do ponto
 * mais usado deste caminho — e o **P2** poe os argumentos de cada ponto no
 * contrato publico.
 *
 * `post_parent` e `menu_order` sao numero e o resto e texto, como o `(int)` do
 * legado produz (`:4835`, `:4846`).
 */
export interface ColunasDaGravacao {
  readonly post_author: number;
  readonly post_date: string;
  readonly post_date_gmt: string;
  readonly post_content: string;
  readonly post_content_filtered: string;
  readonly post_title: string;
  readonly post_excerpt: string;
  readonly post_status: string;
  readonly post_type: string;
  readonly comment_status: string;
  readonly ping_status: string;
  readonly post_password: string;
  readonly post_name: string;
  readonly to_ping: string;
  readonly pinged: string;
  readonly post_modified: string;
  readonly post_modified_gmt: string;
  readonly post_parent: number;
  readonly menu_order: number;
  readonly post_mime_type: string;
  readonly guid: string;
}

/**
 * O pedido de gravacao — o `$postarr` de `wp_insert_post()`.
 *
 * **Todo campo e opcional, e a ausencia de cada um e regra.** O legado resolve
 * default para 19 chaves em `:4606`-`:4625` e depois volta a perguntar por
 * algumas delas com `empty()`, `isset()` ou `??` — tres perguntas diferentes,
 * com tres respostas diferentes para o mesmo valor. A resolucao esta em
 * `campos-na-gravacao.ts`, campo por campo, com a ancora de cada um.
 *
 * ⚠️ **`null` e ausencia aqui, e isso e fidelidade.** No legado as tres
 * perguntas tratam `null` como ausencia (`isset( null )` e falso, `null ?? $x` e
 * `$x`, `empty( null )` e verdadeiro), logo `undefined` cobre os dois casos sem
 * perder nada. O que **nao** se pode confundir com ausencia e a cadeia vazia e o
 * `'0'`: eles sao presentes para `isset()` e vazios para `empty()`, e e dessa
 * diferenca que sai metade do comportamento deste caminho.
 */
export interface PedidoDeGravacao {
  /**
   * `ID` — **a chave que decide entre inserir e atualizar** (`:4639`).
   *
   * A pergunta do legado e `! empty( $postarr['ID'] )`, logo `0` e ausencia:
   * gravar com `ID = 0` **insere**. E quirk reproduzido, nao limpeza pendente.
   */
  readonly id?: number;
  /** `post_author` — `?? get_current_user_id()` (`:4824`). */
  readonly autorId?: number;
  /** `post_date` — texto no fuso do site, resolvido em `data-na-gravacao.ts`. */
  readonly data?: string;
  /** `post_date_gmt` — texto em UTC, e e **esta** que decide a sentinela. */
  readonly dataGmt?: string;
  /** `post_content` — o corpo. 🔴 A sanitizacao dele e REQ-030, fora do pacote. */
  readonly corpo?: string;
  readonly corpoFiltrado?: string;
  readonly titulo?: string;
  readonly resumo?: string;
  /**
   * `post_status` — **o campo desta tarefa**.
   *
   * Omitir, ou informar vazio, grava `draft` (CA-2.1). A regra inteira, com as
   * duas barreiras que o legado tem para ela, esta em `estado-na-gravacao.ts`.
   */
  readonly estado?: string;
  /** `post_type` — `empty()` cai em `'post'` (`:4660`). */
  readonly tipo?: string;
  /** `comment_status` — `empty()` cai no default **do tipo**, ou em `closed`. */
  readonly estadoDeComentario?: string;
  /** `ping_status` — `empty()` cai no default de `pingback` do tipo. */
  readonly estadoDeNotificacao?: string;
  /** `post_password` — texto claro (BR-MIGRAR-044), esvaziado em `private`. */
  readonly senha?: string;
  /**
   * `post_name` — o identificador na URL.
   *
   * ⚠️ Esta tarefa **nao** o sanitiza e **nao** cobra unicidade: as duas sao
   * T007 (US-3). Ver a tabela do fim de `index.ts`.
   */
  readonly identificadorNaUrl?: string;
  readonly aPingar?: string;
  readonly pingados?: string;
  /** `post_parent` — o inteiro cru; vira o vinculo de T002 na escrita. */
  readonly paiId?: number;
  readonly ordemNoMenu?: number;
  readonly tipoMime?: string;
  readonly guid?: string;
  /**
   * `import_id` — o identificador sugerido (`:5009`-`:5015`).
   *
   * So vale na insercao, e so se o identificador nao estiver ocupado. O legado o
   * pergunta com `! empty()`, logo `0` e ausencia.
   */
  readonly idSugerido?: number;
}

/**
 * Os pontos de extensao que **esta tarefa atravessa**.
 *
 * Nomeados e opcionais pela mesma razao dos dez de T003: o **P2** poe cada um no
 * contrato publico *"com o nome, os argumentos, a ordem de disparo e a
 * capacidade de alterar o resultado que ele tem hoje"*, e o barramento que os
 * dispara (`plataforma/barramento/`) **nao existe nesta arvore** — REQ-162 esta
 * em `do-not-rewrite.md` e nenhuma tarefa deste pacote o constroi. Ponto sem
 * interceptador e, no legado, um no-op.
 *
 * **Quatro dos seis sao filtro, e e por isso que eles podem mudar o que vai para
 * a coluna.** O ultimo cenario de `02-publicacao-e-agendamento-de-conteudo.feature`
 * e exatamente sobre eles: *"a ordem dos pontos de filtro na gravacao e a mesma
 * nas duas metades"*, *"o valor que cada ponto recebe e identico byte a byte"* e
 * *"o valor final gravado e o do ultimo ponto da cadeia nas duas"*.
 *
 * | # | ponto | tipo | posicao |
 * |---|---|---|---|
 * | 1 | `wp_insert_post_empty_content` | filtro | antes de qualquer resolucao de estado (`:4695`) |
 * | 2 | `wp_checkdate` | filtro | dentro de `wp_resolve_post_date()` (`functions.php:7541`) |
 * | 3 | `wp_insert_post_parent` | filtro | depois de montar os campos, antes do identificador na URL (`:4868`) |
 * | 4 | `wp_insert_post_data` / `wp_insert_attachment_data` | filtro | **imediatamente antes** do comando (`:4978` / `:4961`) |
 * | 5 | `pre_post_update` | acao | entre o filtro 4 e o `UPDATE` (`:4993`) |
 * | 6 | `pre_post_insert` | acao | entre o filtro 4 e o `INSERT` (`:5025`) |
 *
 * **O rabo de pontos do caminho de gravacao — a transicao de estado e a familia
 * `save_post` — NAO esta aqui, e nao e esquecimento.** Ele esta declarado, com
 * nome, argumentos e posicao, na tabela do fim de `index.ts`, junto do dono de
 * cada um. A razao de a fronteira desta tarefa cair antes dele esta em
 * `gravar.ts`, secao *"Onde esta tarefa para, e por que exatamente ali"*.
 */
export interface GanchosDaGravacao {
  /**
   * `wp_insert_post_empty_content` — **filtro**, dois argumentos (`:4695`).
   *
   * ⚠️ **Este ponto curto-circuita a gravacao inteira**, e o docblock do legado
   * o diz: *"Returning a truthy value from the filter will effectively
   * short-circuit the new post being inserted and return 0"*. Recebe o valor
   * calculado em `:4673`-`:4677` e o pedido como ele chegou.
   *
   * O retorno e `unknown` de proposito: no legado a condicao e a **verdade de
   * PHP** do que o filtro devolveu (`if ( apply_filters( ... ) )`), nao um
   * booleano. Quem o intercepta pode devolver `1`, `'sim'` ou um objeto, e os
   * tres sao verdadeiros la. A conversao esta em `verdade-de-php.ts`, num lugar
   * so.
   */
  readonly filtrarCorpoVazio?: (
    corpoVazio: boolean,
    pedido: PedidoDeGravacao,
  ) => unknown;

  /**
   * `wp_checkdate` — **filtro**, dois argumentos
   * (`wp-includes/functions.php:7541`).
   *
   * Quem o intercepta decide se a data informada e valida, logo decide se a
   * gravacao acontece: data invalida e um dos dois retornos de erro desta funcao
   * (`:4771`-`:4777`). Recebe o veredito do calendario gregoriano e a data como
   * texto.
   */
  readonly filtrarDataValida?: (valida: boolean, data: string) => unknown;

  /**
   * `wp_insert_post_parent` — **filtro**, quatro argumentos (`:4868`).
   *
   * E o ponto que o legado usa para *"check for and prevent hierarchy loops"*, e
   * a prevencao de laco **nao esta no nucleo**: ela e o interceptador. Por isso
   * `../armazenamento/vinculo-com-o-pai.ts` nao valida ciclo nenhum, e o
   * cabecalho dele registra a razao.
   *
   * O terceiro argumento e `$new_postarr` — o pedido **ja com os defaults
   * aplicados e os campos resolvidos**, mais a chave `ID` (`:4851`-`:4856`) —, e
   * o quarto e o pedido no mais intocado. Sao dois objetos diferentes de
   * proposito, e o legado passa os dois.
   */
  readonly filtrarPaiDoConteudo?: (
    paiId: number,
    conteudoId: number,
    pedidoResolvido: PedidoDeGravacao,
    pedido: PedidoDeGravacao,
  ) => number;

  /**
   * `wp_insert_post_data` — **filtro**, quatro argumentos (`:4978`).
   *
   * E **o** ponto desta tarefa: o valor que ele devolve e o que vai gravado,
   * coluna por coluna. Recebe as 21 colunas resolvidas, o pedido com defaults, o
   * pedido **cru** e se e atualizacao.
   *
   * ⚠️ **Anexo passa por outro ponto, nao por este** — ver
   * {@link GanchosDaGravacao.filtrarDadosDoAnexo}. Um porte que disparasse o
   * mesmo nome nos dois casos faria extensao de anexo rodar em post e
   * vice-versa.
   */
  readonly filtrarDadosDoConteudo?: (
    dados: ColunasDaGravacao,
    pedido: PedidoDeGravacao,
    pedidoCru: PedidoDeGravacao,
    atualizacao: boolean,
  ) => ColunasDaGravacao;

  /**
   * `wp_insert_attachment_data` — **filtro**, quatro argumentos (`:4961`).
   *
   * O par do de cima para `post_type = 'attachment'`. O anexo e BC-04 e nao e
   * desta feature; o **ponto** esta aqui porque o `if` que escolhe entre os dois
   * esta nesta funcao, e omiti-lo faria o anexo passar pelo filtro errado.
   */
  readonly filtrarDadosDoAnexo?: (
    dados: ColunasDaGravacao,
    pedido: PedidoDeGravacao,
    pedidoCru: PedidoDeGravacao,
    atualizacao: boolean,
  ) => ColunasDaGravacao;

  /** `pre_post_update` — **acao**, dois argumentos (`:4993`). */
  readonly antesDeAtualizar?: (
    conteudoId: number,
    dados: ColunasDaGravacao,
  ) => void;

  /**
   * `pre_post_insert` — **acao**, um argumento (`:5025`).
   *
   * E novo nesta versao do legado (`@since 6.9.0`) e por isso nao tem par
   * historico com o de cima: ele recebe **so** os dados, porque na insercao
   * ainda nao existe identificador.
   */
  readonly antesDeInserir?: (dados: ColunasDaGravacao) => void;
}

/**
 * O contexto de uma gravacao.
 *
 * {@link ContextoDeGravacao.ator} chega separado do resto pela mesma razao que
 * em `../publicacao/contexto-de-publicacao.ts`: ele e o que muda entre duas
 * requisicoes do mesmo processo, e e o cenario `@concorrencia` de `PT-002` que
 * cobra isso.
 */
export interface ContextoDeGravacao {
  /**
   * Quem grava — `wp_get_current_user()`.
   *
   * **O unico campo lido e `contaId`**, e e ele o `$user_id` de `:4604`, usado
   * como default de `post_author` em `:4824`. O ator inteiro viaja, e nao so o
   * numero, porque a decisao de capacidade do identificador na URL
   * (`:4731`-`:4739`, T015) e sobre **este** ator: quem a escrever nao precisa
   * mudar a forma do contexto, so ler o que ja esta nele.
   *
   * ⚠️ `contaId` igual a `0` nao e erro: e o ator anonimo, e no legado
   * `get_current_user_id()` devolve `0` fora de requisicao autenticada — a fila
   * agendada e a publicacao por e-mail gravam conteudo assim. A coluna aceita, e
   * `post_author = 0` e orfao, que o P5 trata como estado normal.
   */
  readonly ator: AtorDeAutorizacao;

  readonly armazenamento: ArmazenamentoNaGravacao;
  readonly datas: DatasDoSite;

  /**
   * `post_type_supports( $tipo, $recurso )` — `wp-includes/post.php:2235`.
   *
   * Os tres recursos que este caminho pergunta estao em
   * {@link RECURSOS_DO_CORPO_VAZIO}, e as tres perguntas decidem **se a linha
   * existe**: sem elas, `$maybe_empty` seria falso e conteudo vazio entraria no
   * banco onde o legado recusa.
   *
   * ⚠️ **No legado isto e tolerante, nao validante:** tipo nao registrado faz
   * `get_post_type_object()` devolver `null`, e `post_type_supports()` devolve
   * `false` — logo tipo desconhecido **grava**, em vez de ser recusado. Quem
   * implementar esta funcao reproduz isso devolvendo `false`, nao lancando.
   */
  readonly suportaRecurso: (tipo: string, recurso: string) => boolean;

  /**
   * `get_default_comment_status( $tipo, $tipoDeComentario )` —
   * `wp-includes/comment.php:363`.
   *
   * Tres ramos no legado, e o primeiro e por **nome**: `page` e sempre
   * `closed`; o tipo que declara o recurso (`comments` ou `trackbacks`) cai na
   * opcao (`default_comment_status` / `default_ping_status`, as duas `open` de
   * fabrica); o resto e `closed`. E o retorno passa pelo filtro
   * `get_default_comment_status`, que e ponto de extensao publico.
   *
   * Chega como funcao, e nao resolvida nesta tarefa, porque os tres ramos leem
   * **opcao** e **registro de tipo**, que sao de BC-03 e de
   * `plataforma/tipos-de-conteudo/`.
   */
  readonly estadoPadraoDeComentario: (
    tipo: string,
    tipoDeComentario: TipoDeComentarioNaGravacao,
  ) => string;

  /**
   * `get_permalink( $conteudoId )` (`:5121`), com o `false` do legado.
   *
   * Usado em um lugar so deste caminho: o `guid` de conteudo **novo** cujo
   * `guid` ficou vazio. A razao de ser funcao, e nao porta, esta no tipo — que e
   * o de T003, importado em vez de reescrito.
   */
  readonly enderecoDoConteudo: EnderecoDoConteudo;

  readonly ganchos?: GanchosDaGravacao;
}
