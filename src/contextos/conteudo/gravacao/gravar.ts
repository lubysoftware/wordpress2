/**
 * **US-2**: gravar conteudo, com o estado resolvido para rascunho quando ninguem
 * o informa — `wp_insert_post()` (`wp-includes/post.php:4598`).
 *
 * Entrega de **T005** da feature `002-autoria-e-publicacao`. E a operacao
 * *"gravar conteudo"* da tabela *Contratos* de `plan.md` — *"tipo, campos,
 * estado opcional"* → *"conteudo gravado com estado resolvido (rascunho quando
 * nada e informado)"* — e e a **segunda** regra de negocio deste modulo, depois
 * da publicacao de T003.
 *
 * ---
 *
 * # O portao que esta funcao nao tem, e por que nao tem
 *
 * `wp_insert_post()` **nao verifica capacidade nenhuma**. Nao e omissao do
 * porte: a funcao e chamada pelo painel, pela API REST, pelo XML-RPC, pela
 * publicacao por e-mail, pelo importador e pelo proprio nucleo quando cria o
 * rascunho automatico (`:8373`) — e cada uma dessas superficies decide a
 * permissao **antes** de chamar. O **P4** da constituicao pede *"declarar
 * permissao explicita em toda operacao exposta"* e, na mesma frase, *"preservar
 * o default de cada camada como ele e hoje, inclusive quando o default e
 * permissivo"*; e o achado de QA do proprio card diz qual e o default aqui:
 *
 * > Card `must` sem teste de erro: os tres criterios descrevem uma invariante de
 * > escrita e **nao ha entrada invalida nem permissao ausente propria deste
 * > card**. A recusa por falta de capacidade de publicar esta em REQ-019
 * > (UT-019-1).
 * > — `backlog/tests.md`, REQ-020
 *
 * E a unica decisao de capacidade que o caminho de gravacao tem — esvaziar o
 * identificador na URL de quem nao pode publicar (`:4731`-`:4739`) — e **T015**
 * (CA-7.4), nao esta aqui, e esta marcada na posicao exata do fluxo. Dar um
 * portao a esta funcao fecharia o sistema mais que o legado e quebraria tres
 * tarefas desta mesma feature.
 *
 * Mesmo desenho, e mesma razao, do par `publicar` / `transitarParaPublicado` de
 * T003: a operacao que **tem** ator declara a capacidade, a funcao do legado
 * declara que nao tem nenhuma.
 *
 * ---
 *
 * # Onde esta tarefa para, e por que exatamente ali
 *
 * `wp_insert_post()` tem 24 passos. Esta tarefa porta os que resolvem os campos
 * e escrevem a linha — do passo 1 ao 18 —, e **para antes do rabo de pontos de
 * extensao**. A fronteira nao e arbitraria: do passo 19 em diante o legado
 * dispara `wp_transition_post_status()`, que e a funcao que **T003 ja portou**
 * (`../publicacao/transicao-de-estado.ts`) e que precisa da fila agendada, do
 * endereco e dos dez pontos do contexto de publicacao. Emitir aqui **meia**
 * transicao — os interceptadores sem o ouvinte do nucleo, que e quem repoe o
 * `guid` e limpa o evento agendado — perderia os dois em silencio, que e
 * exatamente o erro que o cabecalho de `transicao-de-estado.ts` descreve.
 *
 * | # | passo | linha | aqui? |
 * |---|---|---|---|
 * | 1 | guardar o pedido cru para os filtros | `:4602` | **sim** |
 * | 2 | `get_current_user_id()` | `:4604` | **sim**, pelo ator do contexto |
 * | 3 | os 19 defaults, por `wp_parse_args()` | `:4606`-`:4628` | **sim** — 1ª barreira de US-2 |
 * | 4 | `sanitize_post( $postarr, 'db' )` | `:4632` | nao — 🔴 REQ-030 e os filtros `pre_*`, fora do pacote |
 * | 5 | inserir ou atualizar, e ler a linha anterior | `:4634`-`:4658` | **sim** |
 * | 6 | o tipo, o titulo, o corpo, o resumo e o identificador anterior | `:4660`-`:4671` | **sim** |
 * | 7 | o corpo vazio, e o filtro que o decide | `:4673`-`:4701` | **sim** |
 * | 8 | o **estado**, e a reescrita do anexo | `:4703`-`:4707` | **sim** — 2ª barreira de US-2 |
 * | 9 | a categoria padrao do caminho de gravacao | `:4709`-`:4724` | nao — BC-02 |
 * | 10 | o identificador vazio de quem nao pode publicar | `:4726`-`:4739` | nao — **T015** |
 * | 11 | o identificador derivado do titulo e sanitizado | `:4741`-`:4761` | nao — **T007** |
 * | 12 | as quatro colunas de data | `:4765`-`:4795` | **sim** |
 * | 13 | a comparacao de 60 segundos (publicado ⇄ agendado) | `:4797`-`:4809` | nao — **T013** |
 * | 14 | `comment_status`, `ping_status`, autor, pings, `import_id` | `:4811`-`:4828` | **sim** |
 * | 15 | ordem no menu, senha (e o esvaziamento de `private`), pai | `:4834`-`:4849` | **sim** |
 * | 16 | o filtro do pai, com o pedido resolvido | `:4851`-`:4868` | **sim** |
 * | 17 | o sufixo `__trashed`, na entrada e na saida da lixeira | `:4871`-`:4902` | nao — feature 005 |
 * | 18 | `wp_unique_post_slug()` | `:4906` | nao — **T007** |
 * | 19 | as 21 colunas, o emoji, o filtro de dados e o comando | `:4909`-`:5043` | **sim** (menos o emoji) |
 * | 20 | a segunda escrita do identificador | `:5045`-`:5051` | nao — **T007** |
 * | 21 | categorias, etiquetas, `tax_input`, `meta_input` | `:5053`-`:5115` | nao — BC-02 e quem precisar de metadado |
 * | 22 | o `guid` do conteudo novo | `:5117`-`:5121` | **sim** |
 * | 23 | arquivo do anexo, imagem destacada, modelo de pagina | `:5123`-`:5173` | nao — BC-04 e BC-07 |
 * | 24 | a transicao e a familia `save_post` | `:5175`-`:5312` | nao — ver acima |
 *
 * ## Os pontos do passo 24, declarados porque o P2 manda declarar
 *
 * Nenhum deles e emitido aqui, e todos sao contrato publico. A ordem e a do
 * legado, e o `$update` que cada um recebe e o mesmo booleano do passo 5:
 *
 * | ponto | tipo | argumentos | linha |
 * |---|---|---|---|
 * | `wp_transition_post_status` (os tres pontos dela) | — | `$data['post_status']`, `$previous_status`, `$post` | `:5177` |
 * | `edit_attachment` / `attachment_updated` / `add_attachment` | acao | `$post_id` · `$post_id`, `$post_after`, `$post_before` · `$post_id` | `:5186`-`:5208` |
 * | `edit_post_{$post->post_type}` e `edit_post` | acao | `$post_id`, `$post` | `:5228`, `:5238` |
 * | `post_updated` | acao | `$post_id`, `$post_after`, `$post_before` | `:5250` |
 * | `save_post_{$post->post_type}` e `save_post` | acao | `$post_id`, `$post`, `$update` | `:5269`, `:5280` |
 * | `wp_insert_post` | acao | `$post_id`, `$post`, `$update` | `:5291` |
 * | `wp_after_insert_post` | acao | `$post`, `$update`, `$post_before` | `:5294`, por `$fire_after_hooks` |
 *
 * ⚠️ **`post_updated` e o ponto onde o legado guarda a versao anterior**:
 * `wp_save_post_revision()` esta registrada nele com prioridade 10
 * (`wp-includes/default-filters.php:450`). E **T021** (US-10), e por isso a
 * versao nao aparece em nenhum passo desta lista: ela nao e codigo de
 * `wp_insert_post()`, e ouvinte de um ponto dela.
 *
 * ---
 *
 * # As leituras, que sao quatro, e a divergencia de cache que elas carregam
 *
 * | # | onde | linha | com cache do legado | sem cache (esta arvore) |
 * |---|---|---|---|---|
 * | 1 | `get_post( $post_id )` (`$post_before`) | `:4644` | consulta e popula | consulta |
 * | 2 | `get_post_field( 'guid', $post_id )` | `:4653` | acerta o cache | consulta |
 * | 3 | `get_post_field( 'post_status', $post_id )` | `:4654` | acerta o cache | consulta |
 * | 4 | `get_post_field( 'guid', $post_id )`, depois do comando | `:5117` | consulta (o cache foi esvaziado) | consulta |
 *
 * As tres primeiras so acontecem na **atualizacao**; a quarta sempre. **Isso nao
 * foi decidido aqui e nao precisa ser:** e a mesma divergencia que T002 declarou
 * no README deste modulo e que `publicar.ts` registrou para as tres leituras
 * dele — REQ-165 ficou fora do pacote, e a borda 5 de
 * `target_architecture.md` manda o cache **desligado nas duas metades** durante
 * a coexistencia, que e como a comparacao de paridade roda. As leituras estao
 * nos **mesmos pontos** do legado, de modo que o cache, quando existir, entra na
 * frente de cada uma sem mudar o que ela devolve.
 *
 * ---
 *
 * # Erro e valor, e os dois retornos do legado
 *
 * `wp_insert_post( $postarr, $wp_error )` devolve **o identificador, ou `0`, ou
 * um `WP_Error`** — e qual dos dois ultimos depende de um booleano do chamador.
 * {@link ResultadoDaGravacao} carrega os dois ao mesmo tempo: `conteudoId` e o
 * `0` e `erro` e o `WP_Error`, e quem chama le o que a superficie dele usa. E o
 * que `plan.md` manda: *"Erro e devolvido como valor, nao como excecao: e assim
 * no legado e e o que permite a um ponto de extensao inspecionar a falha"*.
 */

import {
  vinculoDaLinha,
  type ConteudoGravavel,
} from '../armazenamento/index.js';
import {
  aplicarDefaultsDoPedido,
  ehAnexo,
  resolverEstadoDeComentario,
  resolverEstadoDeNotificacao,
  resolverIdentificadorNaUrl,
  resolverSenhaDoConteudo,
} from './campos-na-gravacao.js';
import type {
  ColunasDaGravacao,
  ContextoDeGravacao,
  PedidoDeGravacao,
} from './contexto-de-gravacao.js';
import {
  resolverEstadoNaGravacao,
  resolverTipoNaGravacao,
} from './estado-na-gravacao.js';
import {
  resolverDataDaGravacao,
  resolverDataGmtDaGravacao,
  resolverModificacaoDaGravacao,
} from './data-na-gravacao.js';
import { RECURSOS_DO_CORPO_VAZIO } from './contexto-de-gravacao.js';
import { vazioComoNoPhp, verdadeiroComoNoPhp } from './verdade-de-php.js';

/**
 * `'new'` — o `$previous_status` de um conteudo que nao existia (`:4656`).
 *
 * **Nao e estado editorial**, e por isso nao esta no vocabulario de
 * `../estado-editorial.ts`: e um valor que so existe como argumento, e vai para
 * o ponto `transition_post_status` como `$old_status` (`:5177`) — o que faz
 * `new_to_draft` ser um nome de ponto real, que extensao registra. Fica
 * declarado aqui para que T013 e T015 nao o inventem diferente.
 */
export const ESTADO_ANTERIOR_DE_CONTEUDO_NOVO = 'new';

/**
 * Os codigos e os textos de erro desta funcao, **byte a byte** como o legado os
 * devolve.
 *
 * Sao superficie publicada (P8): a API REST e o XML-RPC repassam o codigo e a
 * mensagem ao cliente, e extensao compara `$erro->get_error_code()`. Por isso
 * cada um e constante nomeada, e nao literal no meio do fluxo.
 *
 * ⚠️ **Os dois ultimos pares nao sao alcancaveis nesta arvore, e estao aqui de
 * proposito.** O legado os devolve quando `$wpdb->update()` ou
 * `$wpdb->insert()` retorna `false` (`:4995` e `:5027`), e a porta de dados de
 * T002 **nao tem** esse `false`: `escrever()` devolve linhas afetadas e
 * identificador gerado. Quem construir a camada de dados (feature 015, T007)
 * liga a falha a estes codigos, e o ramo deixa de ser declaracao e passa a ser
 * caminho. Inventar aqui um erro de banco que a porta nao reporta seria decidir
 * no lugar dessa tarefa.
 */
export const ERROS_DA_GRAVACAO = Object.freeze({
  /** `:4648` — identificador informado que nao existe na tabela. */
  conteudoInexistente: Object.freeze({
    codigo: 'invalid_post',
    mensagem: 'Invalid post ID.',
  }),
  /** `:4697` — titulo, corpo e resumo vazios num tipo que suporta os tres. */
  corpoVazio: Object.freeze({
    codigo: 'empty_content',
    mensagem: 'Content, title, and excerpt are empty.',
  }),
  /** `:4773` — a data nao passou pelo calendario gregoriano. */
  dataInvalida: Object.freeze({
    codigo: 'invalid_date',
    mensagem: 'Invalid date.',
  }),
  /** `:5003` — falha do `UPDATE`. Nao alcancavel nesta arvore (ver acima). */
  falhaAoAtualizar: Object.freeze({
    codigo: 'db_update_error',
    mensagem: 'Could not update post in the database.',
  }),
  /** `:5001` — a mesma falha, com o texto do anexo. */
  falhaAoAtualizarAnexo: Object.freeze({
    codigo: 'db_update_error',
    mensagem: 'Could not update attachment in the database.',
  }),
  /** `:5036` — falha do `INSERT`. Nao alcancavel nesta arvore. */
  falhaAoInserir: Object.freeze({
    codigo: 'db_insert_error',
    mensagem: 'Could not insert post into the database.',
  }),
  /** `:5034` — a mesma falha, com o texto do anexo. */
  falhaAoInserirAnexo: Object.freeze({
    codigo: 'db_insert_error',
    mensagem: 'Could not insert attachment into the database.',
  }),
});

/** Um erro desta funcao, como `WP_Error` o carrega: codigo e mensagem. */
export interface ErroDaGravacao {
  readonly codigo: string;
  readonly mensagem: string;
}

/** O que aconteceu. Quatro desfechos, e nenhum deles e excecao. */
export type DesfechoDaGravacao =
  /** A linha foi inserida. */
  | 'inserido'
  /** A linha existente foi reescrita. */
  | 'atualizado'
  /** `ID` informado e sem linha: `invalid_post` (`:4646`). */
  | 'inexistente'
  /** Titulo, corpo e resumo vazios, ou o filtro disse que sim (`:4695`). */
  | 'corpo-vazio'
  /** A data nao passou pela validacao (`:4771`). */
  | 'data-invalida';

/** O que a operacao devolve. */
export interface ResultadoDaGravacao {
  readonly desfecho: DesfechoDaGravacao;
  /**
   * O retorno do legado: o identificador gravado, ou **`0`** em qualquer um dos
   * tres desfechos de falha (`:4650`, `:4699`, `:4775`).
   */
  readonly conteudoId: number;
  /** O `WP_Error` do legado, ou `null`. Ver {@link ERROS_DA_GRAVACAO}. */
  readonly erro: ErroDaGravacao | null;
  /**
   * As 21 colunas **como foram gravadas** — isto e, depois do filtro de dados —,
   * ou `null` quando nenhum comando saiu.
   *
   * E este objeto que torna CA-2.1 e CA-2.2 afirmaveis sem reler o banco: o
   * valor de `post_status` aqui e o que foi para a coluna.
   */
  readonly colunas: ColunasDaGravacao | null;
  /**
   * `$previous_status` (`:4654`): o estado que a linha tinha, ou
   * {@link ESTADO_ANTERIOR_DE_CONTEUDO_NOVO} quando nao havia linha.
   *
   * Nao e consumido por nenhum ramo desta funcao: ele existe porque e o segundo
   * argumento da transicao do passo 24, e e o que T013 e T011 vao precisar.
   */
  readonly estadoAnterior: string;
  /** `$update` — se o caminho foi o de atualizacao. */
  readonly atualizacao: boolean;
  /**
   * O endereco gravado no `guid` do conteudo novo, ou `null` quando a coluna nao
   * foi tocada (`:5119`-`:5121`).
   *
   * `null` e o caminho normal de **toda atualizacao** e de todo conteudo novo que
   * ja trouxe `guid` no pedido.
   */
  readonly enderecoGravadoNoGuid: string | null;
}

/** O que os tres desfechos de falha tem em comum: nada foi gravado. */
const SEM_GRAVACAO = {
  conteudoId: 0,
  colunas: null,
  enderecoGravadoNoGuid: null,
} as const;

/**
 * **A operacao de US-2.** Grava o conteudo, resolvendo o estado para rascunho
 * quando o pedido nao o informa.
 *
 * **Permissao exigida: nenhuma, como no legado** — ver a secao *"O portao que
 * esta funcao nao tem"* no cabecalho deste arquivo, e o achado de QA de REQ-020
 * que a sustenta.
 *
 * A ordem dos passos e a do legado, e ela esta numerada na tabela do cabecalho.
 * Os passos que **nao** sao desta tarefa aparecem como comentario na posicao
 * exata em que o legado os tem: ausencia marcada e conferivel, ausencia
 * silenciosa e divergencia.
 */
export function gravarConteudo(
  contexto: ContextoDeGravacao,
  pedidoCru: PedidoDeGravacao,
): ResultadoDaGravacao {
  // Passo 3 (`:4628`): os 19 defaults, que **preenchem** a chave ausente e nao
  // resolvem nada — a primeira das duas barreiras de US-2. O objeto e o que
  // dois pontos de extensao recebem como `$postarr`.
  const pedido = aplicarDefaultsDoPedido(contexto, pedidoCru);
  const ganchos = contexto.ganchos;
  const repositorio = contexto.armazenamento.conteudo;

  // Passo 4 (`:4632`): `sanitize_post( $postarr, 'db' )`. Nao portado — 🔴
  // REQ-030 esta fora do pacote e os filtros `pre_*` por campo dependem do
  // barramento (REQ-162, tambem fora). Declarado em `campos-na-gravacao.ts`.

  // Passo 5 (`:4634`-`:4658`). `! empty( $postarr['ID'] )`: `0` e ausencia, logo
  // gravar com `ID = 0` insere.
  const atualizacao = !vazioComoNoPhp(pedidoCru.id);
  // `$post_id = 0` e, no ramo de atualizacao, `$post_id = $postarr['ID']`
  // (`:4635` e `:4643`). Fora dele o `?? 0` nao e alcancado com outro valor:
  // `vazioComoNoPhp` ja garantiu que ausencia e zero caem no mesmo lugar.
  const conteudoIdPedido = pedidoCru.id ?? 0;

  // Leitura 1 (`:4644`).
  const anterior = atualizacao ? repositorio.obterPorId(conteudoIdPedido) : null;
  if (atualizacao && anterior === null) {
    // ⚠️ `$update` ja vale `true` aqui (`:4640`, antes da leitura), e
    // `$previous_status` nunca e calculado neste ramo: o legado volta em
    // `:4650`. O sentinela de conteudo novo ocupa o campo porque ele e tipo, e
    // nenhum ramo o consulta.
    return {
      desfecho: 'inexistente',
      ...SEM_GRAVACAO,
      erro: ERROS_DA_GRAVACAO.conteudoInexistente,
      estadoAnterior: ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
      atualizacao,
    };
  }

  // Leituras 2 e 3 (`:4653` e `:4654`), que no legado sao duas chamadas a
  // `get_post_field()` — ver a tabela de leituras no cabecalho.
  //
  // ⚠️ Na atualizacao o `guid` do PEDIDO e descartado: o legado reatribui
  // `$guid` com o valor gravado, logo a coluna e reescrita com ela mesma e
  // ninguem muda `guid` por esta porta.
  const guid = atualizacao
    ? (repositorio.obterPorId(conteudoIdPedido)?.guid ?? '')
    : (pedido.guid ?? '');
  const estadoAnterior = atualizacao
    ? (repositorio.obterPorId(conteudoIdPedido)?.estado ?? '')
    : ESTADO_ANTERIOR_DE_CONTEUDO_NOVO;

  // Passo 6 (`:4660`-`:4671`). O tipo e resolvido **antes** do filtro do corpo
  // vazio, porque e ele que decide a primeira condicao de `$maybe_empty`.
  const tipo = resolverTipoNaGravacao(pedido.tipo);
  const titulo = pedido.titulo ?? '';
  const corpo = pedido.corpo ?? '';
  const resumo = pedido.resumo ?? '';
  const identificadorNaUrl = resolverIdentificadorNaUrl(
    pedidoCru,
    anterior === null ? null : anterior.identificadorNaUrl,
  );

  // Passo 7 (`:4673`-`:4701`): o corpo vazio. As tres comparacoes de texto sao
  // a falsidade de PHP (`! $post_content`), logo `'0'` conta como vazio; e as
  // tres perguntas de suporte sao `post_type_supports()`, que o contexto
  // responde.
  const corpoVazio =
    !ehAnexo(tipo) &&
    vazioComoNoPhp(corpo) &&
    vazioComoNoPhp(titulo) &&
    vazioComoNoPhp(resumo) &&
    RECURSOS_DO_CORPO_VAZIO.every((recurso) =>
      contexto.suportaRecurso(tipo, recurso),
    );

  const filtroDeCorpoVazio = ganchos?.filtrarCorpoVazio;
  const vereditoDoCorpoVazio =
    filtroDeCorpoVazio === undefined
      ? corpoVazio
      : filtroDeCorpoVazio(corpoVazio, pedido);

  if (verdadeiroComoNoPhp(vereditoDoCorpoVazio)) {
    return {
      desfecho: 'corpo-vazio',
      ...SEM_GRAVACAO,
      erro: ERROS_DA_GRAVACAO.corpoVazio,
      estadoAnterior,
      atualizacao,
    };
  }

  // Passo 8 (`:4703`-`:4707`): **a regra de US-2** — a segunda barreira, o
  // `empty()`, mais a reescrita do anexo. A analise inteira esta em
  // `estado-na-gravacao.ts`, e a posicao e esta: **depois** do filtro do corpo
  // vazio, que por isso ve o estado como o pedido o trouxe.
  const estado = resolverEstadoNaGravacao(tipo, pedido.estado);

  // Passo 9 (`:4709`-`:4724`): a categoria padrao do caminho de gravacao
  // (BR-MIGRAR-003). BC-02, e a metade de CA-1.4 que esta feature cobra foi
  // entregue por T003 em `../publicacao/termo-padrao-na-publicacao.ts`.

  // Passo 10 (`:4726`-`:4739`): o identificador vazio de quem nao pode
  // publicar (CA-7.4). **T015** — e e aqui que a `base` de autorizacao entra no
  // contexto.

  // Passo 11 (`:4741`-`:4761`): o identificador derivado do titulo e
  // sanitizado, com a dispensa em `draft`, `pending` e `auto-draft` (CA-3.1).
  // **T007** — ver o aviso em `resolverIdentificadorNaUrl`.

  // Passo 12 (`:4765`-`:4795`): as quatro colunas de data.
  const data = resolverDataDaGravacao(
    contexto.datas,
    ganchos,
    pedido.data,
    pedido.dataGmt,
  );
  if (data === false) {
    return {
      desfecho: 'data-invalida',
      ...SEM_GRAVACAO,
      erro: ERROS_DA_GRAVACAO.dataInvalida,
      estadoAnterior,
      atualizacao,
    };
  }

  const dataGmt = resolverDataGmtDaGravacao(
    contexto.datas,
    estado,
    data,
    pedido.dataGmt,
  );
  const { modificadoEm, modificadoEmGmt } = resolverModificacaoDaGravacao(
    contexto.datas,
    atualizacao,
    data,
    dataGmt,
  );

  // Passo 13 (`:4797`-`:4809`): a comparacao de 60 segundos que troca
  // `publish` por `future` e `future` por `publish` (CA-6.1 e CA-6.2).
  // **T013**, e e o unico passo desta funcao que le a porta de relogio.

  // Passo 14 (`:4811`-`:4828`).
  const estadoDeComentario = resolverEstadoDeComentario(
    contexto,
    tipo,
    atualizacao,
    pedido,
  );
  const estadoDeNotificacao = resolverEstadoDeNotificacao(
    contexto,
    tipo,
    pedido,
  );
  const autorId = pedido.autorId ?? contexto.ator.contaId;
  // `isset( $postarr['to_ping'] ) ? sanitize_trackback_urls( ... ) : ''`
  // (`:4826`). A sanitizacao e de `plataforma/formatacao` e esta declarada em
  // `campos-na-gravacao.ts`: o valor passa como veio.
  // Depois dos defaults o `isset()` do legado e sempre verdadeiro, e e por isso
  // que a leitura e do pedido com defaults, nao do cru.
  const aPingar = pedido.aPingar ?? '';
  const pingados = pedido.pingados ?? '';
  const idSugerido = pedido.idSugerido ?? 0;

  // Passo 15 (`:4834`-`:4849`).
  const ordemNoMenu = pedido.ordemNoMenu ?? 0;
  const senha = resolverSenhaDoConteudo(estado, pedido);
  const paiPedido = pedido.paiId ?? 0;

  // Passo 16 (`:4851`-`:4868`): o filtro do pai, que recebe o pedido **com os
  // defaults aplicados e os campos resolvidos**, mais a chave `ID`.
  const pedidoResolvido: PedidoDeGravacao = {
    ...pedido,
    id: conteudoIdPedido,
    estadoDeComentario,
    estadoDeNotificacao,
    autorId,
    aPingar,
    pingados,
    senha,
    ordemNoMenu,
    data,
    dataGmt,
    guid,
    idSugerido,
  };
  const filtroDoPai = ganchos?.filtrarPaiDoConteudo;
  const paiId =
    filtroDoPai === undefined
      ? paiPedido
      : filtroDoPai(paiPedido, conteudoIdPedido, pedidoResolvido, pedidoCru);

  // Passo 17 (`:4871`-`:4902`): o sufixo `__trashed`, na entrada e na saida da
  // lixeira, e o metadado `_wp_desired_post_slug`. Feature 005 (`PT-003`).

  // Passo 18 (`:4906`): `wp_unique_post_slug()`. **T007**, e T003 ja apurou que
  // esta e a UNICA porta do legado que cobra unicidade — `wp_publish_post()`
  // nao toca `post_name`.

  // Passo 19 (`:4909`-`:4932`): as 21 colunas, na ordem do `compact()`.
  const colunasResolvidas: ColunasDaGravacao = {
    post_author: autorId,
    post_date: data,
    post_date_gmt: dataGmt,
    post_content: corpo,
    post_content_filtered: pedido.corpoFiltrado ?? '',
    post_title: titulo,
    post_excerpt: resumo,
    post_status: estado,
    post_type: tipo,
    comment_status: estadoDeComentario,
    ping_status: estadoDeNotificacao,
    post_password: senha,
    post_name: identificadorNaUrl,
    to_ping: aPingar,
    pinged: pingados,
    post_modified: modificadoEm,
    post_modified_gmt: modificadoEmGmt,
    post_parent: paiId,
    menu_order: ordemNoMenu,
    post_mime_type: pedido.tipoMime ?? '',
    guid,
  };

  // `wp_encode_emoji()` nas tres colunas de texto (`:4936`-`:4945`): depende do
  // charset **da coluna**, logo e da camada de dados. Declarado em
  // `campos-na-gravacao.ts`.

  // O filtro de dados (`:4947`-`:4978`): **dois** pontos, e o `if` que escolhe
  // entre eles e por tipo resolvido. O valor devolvido e o que vai gravado.
  const filtroDeDados = ehAnexo(tipo)
    ? ganchos?.filtrarDadosDoAnexo
    : ganchos?.filtrarDadosDoConteudo;
  const colunas =
    filtroDeDados === undefined
      ? colunasResolvidas
      : filtroDeDados(colunasResolvidas, pedido, pedidoCru, atualizacao);

  // `wp_unslash( $data )` (`:4980`): identidade nesta arvore — ver
  // `campos-na-gravacao.ts`.

  let conteudoId: number;
  if (atualizacao) {
    ganchos?.antesDeAtualizar?.(conteudoIdPedido, colunas);
    repositorio.atualizar(conteudoIdPedido, camposDoRepositorio(colunas));
    conteudoId = conteudoIdPedido;
  } else {
    // `import_id` (`:5009`-`:5015`): o identificador sugerido entra na coluna
    // `ID` **se nao estiver ocupado**, e a pergunta e a do legado.
    const idDisponivel =
      !vazioComoNoPhp(idSugerido) && !repositorio.existeId(idSugerido);

    ganchos?.antesDeInserir?.(colunas);
    conteudoId = idDisponivel
      ? repositorio.inserir(camposDoRepositorio(colunas), idSugerido)
      : repositorio.inserir(camposDoRepositorio(colunas));
  }

  // Passo 20 (`:5045`-`:5051`): a segunda escrita do identificador, quando ele
  // ficou vazio e o estado nao dispensa unicidade. **T007**.

  // Passo 21 (`:5053`-`:5115`): categorias, etiquetas, `tax_input` e
  // `meta_input`. BC-02, e o metadado de quem precisar dele.

  // Passo 22 (`:5117`-`:5121`): o `guid` do conteudo novo. A leitura 4 passa
  // pelo banco porque no legado ela passa por `get_post()` com o cache daquela
  // linha recem-invalidado.
  const guidGravado = repositorio.obterPorId(conteudoId)?.guid ?? '';
  let enderecoGravadoNoGuid: string | null = null;
  if (!atualizacao && guidGravado === '') {
    const endereco = contexto.enderecoDoConteudo(conteudoId);
    // `get_permalink()` devolve `false` quando o identificador e vazio, e o
    // `$wpdb->update()` do legado coage `false` para cadeia vazia. A coercao
    // esta reproduzida em vez de escondida — mesma nota de
    // `../publicacao/transicao-de-estado.ts`.
    enderecoGravadoNoGuid = endereco === false ? '' : endereco;
    repositorio.atualizar(conteudoId, { guid: enderecoGravadoNoGuid });
  }

  // Passo 23 (`:5123`-`:5173`): arquivo e contexto do anexo, imagem destacada e
  // modelo de pagina. BC-04 e BC-07.

  // `clean_post_cache( $post_id )` e `get_post( $post_id )` (`:5155`-`:5157`):
  // nao ha cache nesta arvore, e a releitura serve aos pontos do passo 24.

  // Passo 24 (`:5175`-`:5312`): a transicao de estado e a familia `save_post`.
  // Nao emitidos aqui — a tabela do cabecalho declara cada um, com argumentos,
  // posicao e dono, e a secao *"Onde esta tarefa para"* diz por que a fronteira
  // cai antes deles.

  return {
    desfecho: atualizacao ? 'atualizado' : 'inserido',
    conteudoId,
    erro: null,
    colunas,
    estadoAnterior,
    atualizacao,
    enderecoGravadoNoGuid,
  };
}

/**
 * As 21 colunas na forma que o repositorio de T002 recebe.
 *
 * A unica traducao e a da coluna do pai, que vira o vinculo das **tres**
 * semanticas — e ela precisa do tipo da propria linha para saber qual delas esta
 * ali, que e exatamente como `../armazenamento/conteudo.ts` a le de volta.
 */
function camposDoRepositorio(colunas: ColunasDaGravacao): ConteudoGravavel {
  return {
    autorId: colunas.post_author,
    data: colunas.post_date,
    dataGmt: colunas.post_date_gmt,
    corpo: colunas.post_content,
    corpoFiltrado: colunas.post_content_filtered,
    titulo: colunas.post_title,
    resumo: colunas.post_excerpt,
    estado: colunas.post_status,
    tipo: colunas.post_type,
    estadoDeComentario: colunas.comment_status,
    estadoDeNotificacao: colunas.ping_status,
    senha: colunas.post_password,
    identificadorNaUrl: colunas.post_name,
    aPingar: colunas.to_ping,
    pingados: colunas.pinged,
    modificadoEm: colunas.post_modified,
    modificadoEmGmt: colunas.post_modified_gmt,
    vinculo: vinculoDaLinha(colunas.post_type, colunas.post_parent),
    ordemNoMenu: colunas.menu_order,
    tipoMime: colunas.post_mime_type,
    guid: colunas.guid,
  };
}
