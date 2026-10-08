/**
 * **US-7**: submeter conteudo proprio para revisao de quem pode publicar.
 *
 * Entrega de **T015** da feature `002-autoria-e-publicacao`. Sao **duas**
 * funcoes, e a diferenca entre elas e a razao de as duas existirem — mesmo
 * desenho do par `publicar` / `transitarParaPublicado` de T003:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link submeterParaRevisao} | a operacao *"submeter para revisao"* da tabela *Contratos* de `plan.md`, que no legado e `edit_post()` (`wp-admin/includes/post.php:269`) mais `_wp_translate_postdata()` (`:21`) | **sim** — `edit_post` sobre o objeto, e e o erro *"sem permissao de editar"* do contrato |
 * | {@link atualizarConteudo} | `wp_update_post()` (`wp-includes/post.php:5327`) | **nao**, e e assim no legado |
 *
 * `wp_update_post()` **nao tem portao**, como `wp_insert_post()` nao tem: ela e
 * funcao publica do nucleo, chamada pelo painel, pela API REST, pelo XML-RPC,
 * pelo importador e por qualquer extensao, e **cada superficie decide a
 * permissao antes**. O **P4** cobra *"declarar permissao explicita em toda
 * operacao exposta"* e, na mesma frase, *"preservar o default de cada camada
 * como ele e hoje, inclusive quando o default e permissivo"* — e e o que as duas
 * funcoes juntas fazem.
 *
 * ---
 *
 * # A funcao que T005 nao portou, e que esta tarefa portou
 *
 * O README deste modulo registrou a ausencia e o dono: *"`wp_update_post()` nao
 * esta aqui. Ela nao e outra regra: e uma **mistura** — le a linha, sobrepoe o
 * pedido sobre ela e chama `wp_insert_post()`. (...) Quem a portar (T015 ou
 * T017, que a usam para devolver conteudo ao autor) encontra a resolucao de
 * estado pronta em `gravacao/estado-na-gravacao.ts`"*.
 *
 * Das **quatro** decisoes proprias dela, esta tarefa porta duas e declara duas:
 *
 * | decisao | linha | aqui? |
 * |---|---|---|
 * | a mistura `array_merge( $post, $postarr )`, com o pedido vencendo a linha | `:5367` | **sim** |
 * | o `$clear_date` dos estados de data flutuante | `:5356`-`:5372` | **sim** — ver {@link atualizarConteudo} |
 * | a delegacao do anexo a `wp_insert_attachment()` | `:5374`-`:5376` | nao — BC-04, feature 006 |
 * | o descarte de `tags_input` igual as etiquetas atuais | `:5378`-`:5390` | nao — BC-02 |
 *
 * E a lista de categorias de `:5348`-`:5354` e `:5368` tambem nao esta: ela e
 * BC-02, e o campo nao existe em {@link PedidoDeGravacao}.
 *
 * ---
 *
 * # As leituras, e a divergencia de cache que elas carregam
 *
 * | # | onde | linha | com cache do legado | sem cache (esta arvore) |
 * |---|---|---|---|---|
 * | 1 | `get_post( $post_id )`, em `edit_post()` | `:280` | consulta e popula | consulta |
 * | 2 | `get_post()`, dentro de `map_meta_cap()` pelo portao de `edit_post` | `capabilities.php:120` | acerta o cache | consulta |
 * | 3 | a mesma, pelo **segundo** portao de `edit_post` de `_wp_translate_postdata()` | `capabilities.php:120` | acerta o cache | consulta |
 * | 4 | `get_post_field( 'post_status', $post_id )` — o `$previous_status` | `:140` | acerta o cache | consulta |
 * | 5 | a mesma de 2, pela terceira pergunta de `edit_post` (a do rebaixamento) | `capabilities.php:120` | acerta o cache | consulta |
 * | 6 | `get_post( $postarr['ID'], ARRAY_A )`, em `wp_update_post()` | `:5335` | acerta o cache | consulta |
 * | 7+ | as nove leituras de `wp_insert_post()` | ver `../gravacao/gravar.ts` | — | — |
 *
 * **As seis estao nos mesmos pontos do legado**, inclusive as tres que sao a
 * mesma pergunta de capacidade feita tres vezes: no legado elas sao tres
 * chamadas a `current_user_can( 'edit_post', $post_id )`, em
 * `wp-admin/includes/post.php:294`, `:47` e `:156`. Reduzi-las a uma mudaria a
 * sequencia de comandos que a area 3 da Decisao 2 compara, e **nao** mudaria
 * resposta nenhuma — e por isso as tres estao aqui, com a terceira dentro da
 * resolucao de estado, onde o legado a faz.
 *
 * A divergencia de cache nao foi decidida aqui e nao precisa ser: REQ-165 ficou
 * fora do pacote, e a borda 5 de `target_architecture.md` manda o cache
 * **desligado nas duas metades** durante a coexistencia.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * A tabela de passos de {@link submeterParaRevisao} marca a posicao exata de
 * cada ausencia. Em resumo, por dono:
 *
 * | o que | linha | de quem |
 * |---|---|---|
 * | o aviso ao autor, ao editor ou a quem for | — | **ninguem aqui.** UC-06 e literal: *"Nenhuma notificacao sai daqui (...) A revisao depende de alguem abrir a tela"*. US-9 e T019, com a parada registrada |
 * | registrar **quem** decidiu a transicao | — | **ninguem**: REQ-028 esta em `do-not-rewrite.md` e nas *Perguntas em aberto* de `spec.md` |
 * | devolver o conteudo ao autor (o caminho de volta de UC-06) | — | **T017** (US-8, CA-8.4) |
 * | a atualizacao das versoes de conteudo antigo | `:302`-`:316` | ninguem: e rotina de **atualizacao de dado** de instalacao pre-3.6, e a resposta 2 fixa *"instalacao nova, sem dado a migrar"* |
 * | o seletor de visibilidade (`public`, `password`, `private`) | `:318`-`:332` | **T009** (US-4) |
 * | a montagem da data pelos seis campos do formulario | `:177`-`:219` | BC-10 (`painel/`). O `editarData` desta operacao e o `edit_date` que sai dali |
 * | formato de conteudo, metadado de formato e dado de audio/video | `:341`-`:378` | BC-07 e BC-04 |
 * | `meta`, `deletemeta` e `add_meta()` | `:380`-`:427`, `:459` | quem precisar de metadado: o repositorio de T002 esta pronto |
 * | o texto alternativo e os campos do anexo | `:429`-`:446` | BC-04 |
 * | `tax_input` e a categoria | `:448`-`:457`, `:221`-`:226` | BC-02 |
 * | `_edit_last`, `_fix_attachment_links()` e a trava de edicao | `:461`, `:479`, `:481` | BC-10 (`painel/`) |
 * | a segunda tentativa de gravacao com `strip_invalid_text_for_column()` | `:466`-`:476` | a camada de dados, feature 015 — a porta de T002 nao reporta a falha que a dispara |
 * | fixar e desafixar o conteudo (`sticky`) | `:483`-`:489` | BC-07 |
 * | a transicao de estado e a familia `save_post` | `wp-includes/post.php:5175` | ninguem deste pacote emite ponto: REQ-162 esta em `do-not-rewrite.md`. Estao declarados em `../gravacao/gravar.ts`, com nome, argumentos e posicao |
 */

import {
  colunaDoVinculo,
  DATA_SENTINELA,
  type Conteudo,
} from '../armazenamento/index.js';
import {
  ERROS_DA_GRAVACAO,
  ESTADOS_DE_DATA_FLUTUANTE,
  ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
  gravarConteudo,
  vazioComoNoPhp,
  type ContextoDeGravacao,
  type PedidoDeGravacao,
  type ResultadoDaGravacao,
} from '../gravacao/index.js';
import type { ContextoDeRevisao } from './contexto-de-revisao.js';
import {
  estadoDeComentarioNaSubmissao,
  estadoPedidoPelosBotoes,
  estadoSanitizadoDoPedido,
  resolverEstadoDaSubmissao,
  senhaNaSubmissao,
  type BotoesDoEditor,
} from './estado-na-submissao.js';
import {
  autorizarAutoriaDaSubmissao,
  autorizarSubmissao,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA,
  CODIGO_DE_CONTEUDO_INEXISTENTE,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA,
  MENSAGEM_DE_CONTEUDO_INEXISTENTE,
  podeEditarEsteConteudo,
  podePublicarEsteTipo,
  TIPO_DE_PAGINA,
  type RecusaDaRevisao,
} from './permissao-de-revisao.js';

/**
 * `inherit` — o estado que `edit_post()` descarta do pedido antes de qualquer
 * coisa (`wp-admin/includes/post.php:288`-`:290`).
 *
 * O painel nao deixa trocar o estado de um conteudo por `inherit`: a chave e
 * **removida**, e o conteudo fica com o estado que tinha. E a mesma postura de
 * tolerancia do estado nao registrado — descarta, nao recusa. O `inherit` do
 * anexo e BR-MIGRAR-002, e esta em `../gravacao/estado-na-gravacao.ts`.
 */
export const ESTADO_DESCARTADO_NA_EDICAO = 'inherit';

/** Quem se submete, e com que campos. */
export interface PedidoDeSubmissao {
  /**
   * `post_ID` — **a entrada do contrato de `plan.md`**: *"submeter para revisao
   * | identificador"*.
   *
   * E sempre uma atualizacao: `edit_post()` so existe para conteudo que ja tem
   * linha, e o rascunho automatico que o editor cria ao abrir a tela (US-11,
   * T023) e o que garante que ela exista desde antes da primeira tecla.
   */
  readonly conteudoId: number;

  /**
   * Os campos que a submissao carrega — o `$_POST` do editor, menos os botoes.
   *
   * Todo campo e opcional, e a ausencia de cada um e regra: o que nao vem e o
   * que a linha gravada ja tem, pela mistura de {@link atualizarConteudo}.
   */
  readonly campos?: PedidoDeGravacao;

  /** Os cinco botoes do editor (`:121`-`:137`). */
  readonly botoes?: BotoesDoEditor;

  /**
   * `post_author_override` (`:79`-`:80`).
   *
   * O seletor de autor do editor, que o painel so renderiza para quem tem
   * `edit_others_posts`. `! empty()` no legado, logo `0` e ausencia.
   */
  readonly autorEscolhido?: number;

  /**
   * `edit_date` — se a data foi escolhida a mao no formulario (`:179` e `:184`).
   *
   * Quem resolve os seis campos de data da tela e BC-10; o que chega aqui e o
   * booleano que sai dali, e ele tem **um** efeito nesta operacao: desligar o
   * `$clear_date` de `wp_update_post()` (`:5359`). Ver {@link atualizarConteudo}.
   */
  readonly editarData?: boolean;
}

/** O que aconteceu. Quatro desfechos, e nenhum deles e excecao. */
export type DesfechoDaSubmissao =
  /** A linha foi reescrita com o estado resolvido. */
  | 'submetido'
  /** `ID` informado e sem linha: o legado morre no painel e devolve 404 na API. */
  | 'inexistente'
  /** Sem a capacidade de editar aquele conteudo, ou de mexer no alheio. */
  | 'recusado'
  /** A gravacao recusou por conta dela — corpo vazio, data invalida. */
  | 'nao-gravado';

/** O que a operacao devolve. */
export interface ResultadoDaSubmissao {
  readonly desfecho: DesfechoDaSubmissao;
  /** A recusa, ou `null`. Preenchida nos desfechos `recusado` e `inexistente`. */
  readonly recusa: RecusaDaRevisao | null;
  /**
   * O estado **pedido**, depois da sanitizacao e dos botoes e **antes** do
   * rebaixamento — ou `null` quando nada foi decidido.
   *
   * E o par de {@link ResultadoDaSubmissao.estado} que torna CA-7.1 afirmavel
   * sem reler o banco: pedir `publish` e gravar `pending` e a regra, e os dois
   * valores ficam visiveis.
   */
  readonly estadoPedido: string | null;
  /**
   * O estado **resolvido por esta operacao** — o que o pedido traduzido leva a
   * gravacao —, ou `null` quando nada foi decidido.
   *
   * ⚠️ **Nao e sempre o valor da coluna**, e o caso em que os dois diferem e
   * regra: pedido com a chave de estado **presente e vazia** atravessa os cinco
   * passos intacto (`isset()` e verdadeiro para `''` e para `'0'`) e e a
   * segunda barreira de US-2 que o resolve, em `wp_insert_post()` (`:4703`) —
   * logo aqui ele vale `''` e na coluna vale `draft`. O valor gravado esta em
   * `gravacao.colunas.post_status`, e os dois juntos sao o que torna essa
   * passagem conferivel.
   */
  readonly estado: string | null;
  /** Se o estado pedido foi rebaixado por falta da capacidade de publicar. */
  readonly rebaixado: boolean;
  /** O resultado da gravacao, com as 21 colunas como foram gravadas, ou `null`. */
  readonly gravacao: ResultadoDaGravacao | null;
}

const SEM_SUBMISSAO = {
  estadoPedido: null,
  estado: null,
  rebaixado: false,
  gravacao: null,
} as const;

/**
 * **A operacao de US-7.** Submete o conteudo para revisao, gravando o estado
 * `pending`.
 *
 * **Permissao exigida: a capacidade de editar AQUELE conteudo** (`edit_post`,
 * com o objeto), somada a de mexer em conteudo alheio quando o autor do pedido
 * nao e quem pede — `permissao-de-revisao.ts`. E o erro que o contrato de
 * `plan.md` declara: *"sem permissao de editar"*.
 *
 * **A capacidade de publicar nao e exigida: ela e PERGUNTADA.** A falta dela nao
 * recusa nada — ela decide duas coisas, e as duas sao criterios desta historia:
 * o estado gravado (**CA-7.1**, passo 8) e o identificador na URL esvaziado
 * (**CA-7.4**, que acontece dentro da gravacao, no passo 10 de
 * `../gravacao/gravar.ts`).
 *
 * Os passos sao os do legado, na ordem dele, com o dono de cada ausencia:
 *
 * | # | passo | linha | aqui? |
 * |---|---|---|---|
 * | 1 | ler a linha | `:280` | **sim** |
 * | 2 | o tipo e o tipo MIME vem da **linha**, nao do pedido | `:282`-`:283` | **sim** |
 * | 3 | o estado do pedido sanitizado, e `inherit` descartado | `:285`-`:291` | **sim** |
 * | 4 | o portao de `edit_post` | `:294`-`:300` | **sim** |
 * | 5 | a atualizacao das versoes de conteudo antigo | `:302`-`:316` | nao — ver o cabecalho |
 * | 6 | o seletor de visibilidade | `:318`-`:332` | nao — **T009** |
 * | 7 | `_wp_translate_postdata()`: o **segundo** portao de `edit_post` e o autor | `:47`-`:105` | **sim** |
 * | 8 | `_wp_translate_postdata()`: o **estado**, com o rebaixamento | `:107`-`:163` | **sim** — **CA-7.1** |
 * | 9 | a senha de quem nao pode publicar, e os dois estados de comentario | `:165`-`:175` | **sim** |
 * | 10 | a data dos seis campos do formulario, e a categoria | `:177`-`:226` | nao — BC-10 e BC-02 |
 * | 11 | `_wp_get_allowed_postdata()`: `meta_input`, `file` e `guid` fora | `:250`, `:338` | **sim** |
 * | 12 | formato, metadado, anexo, taxonomia, `_edit_last` | `:341`-`:461` | nao — ver o cabecalho |
 * | 13 | `wp_update_post()` | `:463` | **sim** — {@link atualizarConteudo} |
 * | 14 | a segunda tentativa, a trava e o conteudo fixado | `:466`-`:489` | nao — ver o cabecalho |
 */
export function submeterParaRevisao(
  contexto: ContextoDeRevisao,
  pedido: PedidoDeSubmissao,
): ResultadoDaSubmissao {
  const repositorio = contexto.armazenamento.conteudo;
  const campos = pedido.campos ?? {};

  // Passo 1 (`:280`), leitura 1.
  const anterior = repositorio.obterPorId(pedido.conteudoId);
  if (anterior === null) {
    // No painel `$post->post_type` de `null` mata a requisicao (`:282`), e na
    // API o mesmo identificador devolve `rest_post_invalid_id` com 404
    // (`class-wp-rest-posts-controller.php:555`). A porta fechada e o unico
    // resultado que as duas leituras compartilham, e e o que esta operacao
    // devolve — mesmo precedente do desfecho `inexistente` de T003.
    return {
      desfecho: 'inexistente',
      ...SEM_SUBMISSAO,
      recusa: {
        codigo: CODIGO_DE_CONTEUDO_INEXISTENTE,
        mensagem: MENSAGEM_DE_CONTEUDO_INEXISTENTE,
        codigoHttp: 404,
      },
    };
  }

  // Passo 2 (`:282`-`:283`): o tipo e o tipo MIME sao os **da linha**. E
  // observavel: por esta porta ninguem troca o tipo de um conteudo existente,
  // mesmo mandando `post_type` no pedido.
  const tipo = anterior.tipo;
  const tipoMime = anterior.tipoMime;

  // Passo 3 (`:285`-`:291`).
  const estadoDoPedido = estadoDescartandoHeranca(
    campos.estado,
    contexto.sanitizarChave,
  );

  // Passo 4 (`:294`-`:300`), leitura 2.
  const recusaDeEdicao = autorizarSubmissao(contexto, anterior);
  if (recusaDeEdicao !== null) {
    return { desfecho: 'recusado', ...SEM_SUBMISSAO, recusa: recusaDeEdicao };
  }

  // Passo 5 (`:302`-`:316`): `_wp_upgrade_revisions_of_post()`. Nao portado —
  // e rotina de atualizacao de dado anterior a 3.6, e nao ha dado a migrar
  // (resposta 2 de `questions.md`).

  // Passo 6 (`:318`-`:332`): o `switch` de `visibility`, que grava `private` e
  // esvazia a senha. **T009** (US-4).

  // Passo 7a (`:47`-`:52`), leitura 3: o **segundo** portao de `edit_post`.
  //
  // ⚠️ **Nao alcancavel depois do passo 4, e esta aqui de proposito** — mesmo
  // precedente dos dois ultimos pares de `ERROS_DA_GRAVACAO`. No legado sao
  // duas perguntas identicas em funcoes diferentes, e a segunda tem **outra
  // mensagem**: quem chega a `_wp_translate_postdata()` por outra porta (um
  // chamador que nao seja `edit_post()`) recebe o texto de autoria alheia, e
  // nao o de `:298`. A pergunta sai porque ela e uma leitura na sequencia de
  // comandos; a mensagem fica porque ela e superficie publicada.
  if (!podeEditarEsteConteudo(contexto, pedido.conteudoId)) {
    return {
      desfecho: 'recusado',
      ...SEM_SUBMISSAO,
      recusa: recusaDeAutoriaDoTraduzido(tipo),
    };
  }

  // Passo 7b (`:69`-`:105`): o autor do pedido, e o portao de autoria alheia —
  // o que faz esta historia ser sobre conteudo **proprio**.
  const autorDoPedido = autorDaSubmissao(contexto, pedido, campos);
  const recusaDeAutoria = autorizarAutoriaDaSubmissao(
    contexto,
    tipo,
    autorDoPedido,
  );
  if (recusaDeAutoria !== null) {
    return { desfecho: 'recusado', ...SEM_SUBMISSAO, recusa: recusaDeAutoria };
  }

  // Passo 8 (`:107`-`:163`): **CA-7.1**.
  const estadoSanitizado = estadoSanitizadoDoPedido(
    estadoDoPedido,
    contexto.sanitizarChave,
    (nome) => contexto.fonteDeConteudo.estadoDeConteudo(nome) !== null,
  );
  const estadoPedido = estadoPedidoPelosBotoes(pedido.botoes, estadoSanitizado);

  // `:139`-`:140`, leitura 4: o `$previous_status` sai de uma segunda consulta,
  // e nao do registro que o passo 1 leu. Esta aqui, e nao reaproveitado, pelo
  // mesmo motivo das tres leituras seguidas de `../gravacao/gravar.ts`: a
  // posicao e o numero de consultas sao o que a area 3 da Decisao 2 compara.
  const estadoAnterior = repositorio.obterPorId(pedido.conteudoId)?.estado ?? '';

  // `:142` e `:154`: a primitiva de publicar daquele tipo. Perguntada **uma**
  // vez e usada nos dois ramos, como no legado — la sao duas chamadas a
  // `current_user_can()`, que nao emitem consulta porque a primitiva nao tem
  // objeto.
  const podePublicar = podePublicarEsteTipo(contexto, tipo);

  const { estado, rebaixado } = resolverEstadoDaSubmissao({
    estadoPedido,
    estadoAnterior,
    podePublicar,
    // `:156`, leitura 5: a terceira pergunta de `edit_post`, e a unica que muda
    // de resposta pelo estado da linha. So e avaliada no ramo que a usa — aqui
    // ela e avaliada sempre, e a diferenca nao e observavel: ela nao escreve.
    podeEditarEsteConteudo: podeEditarEsteConteudo(contexto, pedido.conteudoId),
  });

  // Passo 9 (`:165`-`:175`).
  const senha = senhaNaSubmissao(campos.senha, podePublicar);
  const estadoDeComentario = estadoDeComentarioNaSubmissao(
    campos.estadoDeComentario,
  );
  const estadoDeNotificacao = estadoDeComentarioNaSubmissao(
    campos.estadoDeNotificacao,
  );

  // Passo 10 (`:177`-`:226`): a data do formulario e a categoria. BC-10 e
  // BC-02. O `edit_date` que sai dali chega por `pedido.editarData`.

  // Passo 11 (`:250` e `:338`): `_wp_get_allowed_postdata()` retira tres
  // chaves do pedido — `meta_input`, `file` e `guid`. As duas primeiras nao
  // existem em `PedidoDeGravacao`; a terceira existe, e e retirada aqui. O
  // efeito e observavel: **nao ha caminho pelo painel que escreva `guid`**, e
  // `wp_insert_post()` reforca isso descartando o `guid` do pedido em toda
  // atualizacao (`../gravacao/gravar.ts`, leitura 2).
  // ⚠️ A senha entra **retirada** do pedido e reposta so quando passa: o legado
  // faz `unset( $post_data['post_password'] )` (`:166`), e espalhar o pedido
  // inteiro por cima deixaria a senha descartada voltar pela chave original.
  const { senha: _senhaPedida, ...camposSemSenha } = campos;

  const traduzido: PedidoDeGravacao = semGuid({
    ...camposSemSenha,
    id: pedido.conteudoId,
    tipo,
    tipoMime,
    estado,
    autorId: autorDoPedido,
    estadoDeComentario,
    estadoDeNotificacao,
    ...(senha === undefined ? {} : { senha }),
  });

  // Passo 12 (`:341`-`:461`): formato, metadado, anexo, taxonomia e
  // `_edit_last`. Ver a tabela do cabecalho.

  // Passo 13 (`:463`): `wp_update_post()`.
  const gravacao = atualizarConteudo(
    contexto,
    traduzido,
    pedido.editarData === true,
  );

  // Passo 14 (`:466`-`:489`): a segunda tentativa de gravacao, a correcao dos
  // vinculos de anexo, a trava de edicao e o conteudo fixado.

  return {
    desfecho: gravacao.desfecho === 'atualizado' ? 'submetido' : 'nao-gravado',
    recusa: null,
    estadoPedido: estadoPedido ?? null,
    estado,
    rebaixado,
    gravacao,
  };
}

/**
 * `wp_update_post()` — a mistura da linha com o pedido, **sem portao de
 * capacidade** (`wp-includes/post.php:5327`).
 *
 * Exportada porque e **superficie publicada** (P8) e porque ela tem outros
 * chamadores no legado que nao sao esta operacao — a API REST, o XML-RPC, o
 * importador e **T017**, que a usa para devolver o conteudo ao autor (CA-8.4).
 * Quem a chama direto esta no mesmo lugar em que uma extensao do legado esta:
 * sem verificacao, por desenho.
 *
 * Os quatro passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | ler a linha; sem linha, `invalid_post` e nada e gravado | `:5335`-`:5342` |
 * | 2 | o `$clear_date` — **calculado antes da mistura, sobre o estado ANTIGO** | `:5356`-`:5364` |
 * | 3 | a mistura: o pedido vence a linha, chave por chave | `:5367` |
 * | 4 | `wp_insert_post()` | `:5392` |
 *
 * ⚠️ **O `$clear_date` e a razao de esta funcao precisar do relogio**, e o que
 * ele faz surpreende: um conteudo em estado de **data flutuante** (`draft`,
 * `pending`, `auto-draft`) cuja coluna GMT esta na sentinela, atualizado **sem**
 * `edit_date`, recebe `post_date = agora`. Isto e, **a data de um rascunho
 * caminha a cada salvamento**, e so para de caminhar quando alguem escolhe a
 * data a mao ou quando o conteudo sai dos estados flutuantes. O comentario do
 * legado diz a intencao — *"Drafts shouldn't be assigned a date unless
 * explicitly done so by the user"* — e o efeito e o que a coluna mostra.
 *
 * ⚠️ **A mistura usa o PEDIDO como vencedor, e isso vale tambem para
 * `post_author`**: ver o aviso em {@link autorDaSubmissao}.
 *
 * `editarData` chega como **argumento**, e no legado ele e a chave
 * `$postarr['edit_date']` (`:5359`). A diferenca de forma e deliberada:
 * `edit_date` nao e coluna, e sim campo de formulario que atravessa a funcao, e
 * {@link PedidoDeGravacao} e a lista das 21 colunas mais o `import_id`. Omitir o
 * argumento reproduz o pedido que **nao** traz a chave, que e o caminho de todo
 * chamador que nao e o editor classico — a API REST entre eles.
 */
export function atualizarConteudo(
  contexto: ContextoDeGravacao,
  pedido: PedidoDeGravacao,
  editarData = false,
): ResultadoDaGravacao {
  const conteudoId = pedido.id ?? 0;

  // Passo 1 (`:5335`-`:5342`), leitura 6. O erro e o **mesmo** par que
  // `wp_insert_post()` devolve para identificador inexistente (`:4648`), e e
  // por isso que ele vem de `ERROS_DA_GRAVACAO` em vez de ser escrito de novo.
  const anterior = contexto.armazenamento.conteudo.obterPorId(conteudoId);
  if (anterior === null) {
    return {
      desfecho: 'inexistente',
      conteudoId: 0,
      erro: ERROS_DA_GRAVACAO.conteudoInexistente,
      colunas: null,
      // `$previous_status` nunca e calculado neste ramo do legado: a funcao
      // volta em `:5341`. O sentinela de conteudo novo ocupa o campo porque ele
      // e tipo, e nenhum ramo o consulta — mesma nota de `../gravacao/gravar.ts`.
      estadoAnterior: ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
      atualizacao: true,
      enderecoGravadoNoGuid: null,
      identificadorPedido: '',
      identificadorNaUrl: '',
    };
  }

  // Passo 2 (`:5356`-`:5364`): o estado comparado e o **da linha**, antes da
  // mistura. `empty( $postarr['edit_date'] )` e o segundo termo.
  const reporADataDoRascunho =
    ESTADOS_DE_DATA_FLUTUANTE.includes(anterior.estado) &&
    !editarData &&
    anterior.dataGmt === DATA_SENTINELA;

  // Passo 3 (`:5367`): `array_merge( $post, $postarr )` — o pedido vence a
  // linha, **chave por chave**. Chave ausente conserva o valor gravado, e e por
  // isso que submeter sem informar corpo nao apaga o corpo.
  const misturado: PedidoDeGravacao = {
    ...camposDaLinhaGravada(anterior),
    ...semAusentes(pedido),
    id: conteudoId,
  };

  // `:5369`-`:5372`: a data reposta entra **depois** da mistura, logo ela vence
  // o que o pedido trouxe. A coluna GMT vai **vazia** e nao com a sentinela: e
  // `wp_insert_post()` que a resolve de novo para a sentinela, porque o estado
  // continua flutuante (`../gravacao/data-na-gravacao.ts`).
  const pedidoFinal: PedidoDeGravacao = reporADataDoRascunho
    ? {
        ...misturado,
        data: contexto.datas.agoraNoFusoDoSite(),
        dataGmt: '',
      }
    : misturado;

  // `:5374`-`:5376`: `wp_insert_attachment()` para anexo — BC-04.
  // `:5378`-`:5390`: o descarte de `tags_input` igual as etiquetas — BC-02.

  // Passo 4 (`:5392`).
  return gravarConteudo(contexto, pedidoFinal);
}

/**
 * `$post_data['post_author']` resolvido (`:69`-`:85`).
 *
 * Os tres ramos do legado, na ordem: o seletor de autor, o campo `post_author`
 * do formulario e, por fim, quem esta pedindo. Os dois primeiros sao `! empty()`,
 * logo `0` cai para o seguinte.
 *
 * ⚠️ **No painel este valor SOBREPOE o autor da linha**, e isso e quirk do
 * legado, nao desta porta: `_wp_translate_postdata()` sempre devolve a chave
 * preenchida, e `wp_update_post()` faz o pedido vencer a linha (`:5367`). Um
 * editor que salve o texto de outra pessoa **por um formulario que nao carregue
 * `post_author`** passa a constar como autor — e e por isso que o editor
 * classico sempre envia o campo para quem pode trocar o autor. Quem pegar
 * **T017** encontra este aviso aqui: **CA-8.2** (*"a publicacao mantem o autor
 * original gravado"*) passa por esta linha, e pela API REST ela nao passa,
 * porque la a chave so existe quando o cliente a envia
 * (`class-wp-rest-posts-controller.php:1398`).
 *
 * Nesta historia o efeito e nenhum: quem submete conteudo **proprio** ja e o
 * autor da linha, e quem submete o de outra pessoa foi recusado no passo 7b.
 */
export function autorDaSubmissao(
  contexto: ContextoDeRevisao,
  pedido: PedidoDeSubmissao,
  campos: PedidoDeGravacao,
): number {
  // `:79`-`:80`: `! empty( $post_data['post_author_override'] )`.
  const escolhido = pedido.autorEscolhido;
  if (escolhido !== undefined && escolhido !== 0) {
    return escolhido;
  }
  // `:82`-`:83`: `! empty( $post_data['post_author'] )`.
  const doPedido = campos.autorId;
  if (doPedido !== undefined && doPedido !== 0) {
    return doPedido;
  }
  // `:85`: `(int) $post_data['user_ID']`, que e `get_current_user_id()` (`:77`).
  return contexto.ator.contaId;
}

/**
 * **Passo 3** de {@link submeterParaRevisao} (`:285`-`:291`): o estado do pedido
 * sanitizado, com `inherit` descartado.
 *
 * `edit_post()` faz isto **antes** do portao de capacidade, e por isso a ordem
 * aqui e a mesma: um pedido com `post_status: 'inherit'` chega ao portao sem
 * estado nenhum, e sai dele conservando o estado da linha.
 */
function estadoDescartandoHeranca(
  estadoPedido: string | undefined,
  sanitizarChave: (valor: string) => string,
): string | undefined {
  // `! empty( $post_data['post_status'] )` (`:285`), com o `empty()` do legado.
  // Chave presente e vazia nao entra no bloco e **continua presente**, com o
  // valor que tinha — a mesma distincao de `estadoSanitizadoDoPedido()`, e pela
  // mesma razao.
  if (estadoPedido === undefined || vazioComoNoPhp(estadoPedido)) {
    return estadoPedido;
  }
  const estado = sanitizarChave(estadoPedido);
  return estado === ESTADO_DESCARTADO_NA_EDICAO ? undefined : estado;
}

/**
 * A recusa do **segundo** portao de `edit_post` (`:47`-`:52`).
 *
 * Os textos e os codigos sao os de autoria alheia, e nao os de `:296`-`:298`:
 * sao dois `WP_Error` diferentes para a mesma pergunta, em duas funcoes
 * diferentes. Ver o aviso do passo 7a.
 */
function recusaDeAutoriaDoTraduzido(tipoDoConteudo: string): RecusaDaRevisao {
  const ehPagina = tipoDoConteudo === TIPO_DE_PAGINA;
  return {
    codigo: ehPagina
      ? CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA
      : CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA,
    mensagem: ehPagina
      ? MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_EM_PAGINA
      : MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA,
    codigoHttp: null,
  };
}

/**
 * As 21 colunas da linha gravada, na forma de pedido — o `get_post( $id,
 * ARRAY_A )` que a mistura usa como base (`:5335`).
 *
 * `post_modified` e `comment_count` **nao** entram, e nao e esquecimento:
 * `wp_insert_post()` reescreve a modificacao com o instante atual em toda
 * atualizacao (`:4786`-`:4789`) e nunca escreve o contador, que e
 * desnormalizado e tem dono em BC-03 (`DB-TRG1`). Pos-los aqui faria a mistura
 * carregar valor que o passo seguinte descarta.
 */
function camposDaLinhaGravada(anterior: Conteudo): PedidoDeGravacao {
  return {
    id: anterior.id,
    autorId: anterior.autorId,
    data: anterior.data,
    dataGmt: anterior.dataGmt,
    corpo: anterior.corpo,
    corpoFiltrado: anterior.corpoFiltrado,
    titulo: anterior.titulo,
    resumo: anterior.resumo,
    estado: anterior.estado,
    tipo: anterior.tipo,
    estadoDeComentario: anterior.estadoDeComentario,
    estadoDeNotificacao: anterior.estadoDeNotificacao,
    senha: anterior.senha,
    identificadorNaUrl: anterior.identificadorNaUrl,
    aPingar: anterior.aPingar,
    pingados: anterior.pingados,
    paiId: colunaDoVinculo(anterior.vinculo),
    ordemNoMenu: anterior.ordemNoMenu,
    tipoMime: anterior.tipoMime,
    guid: anterior.guid,
  };
}

/**
 * O pedido sem as chaves ausentes — o que `array_merge()` considera **presente**.
 *
 * No PHP a chave ausente nao entra na mistura e a chave presente entra, mesmo
 * valendo `null`. Aqui `undefined` **e** a ausencia, por decisao declarada em
 * `PedidoDeGravacao` (*"`null` e ausencia aqui, e isso e fidelidade"*), e por
 * isso ela e retirada antes do espalhamento: sem isto, um pedido construido com
 * a chave explicitamente ausente apagaria o valor gravado, que e o oposto do
 * que o legado faz.
 */
function semAusentes(pedido: PedidoDeGravacao): PedidoDeGravacao {
  const presentes = Object.entries(pedido).filter(
    ([, valor]) => valor !== undefined,
  );
  return Object.fromEntries(presentes) as PedidoDeGravacao;
}

/** `array_diff_key( $post_data, array_flip( array( ..., 'guid' ) ) )` (`:250`). */
function semGuid(pedido: PedidoDeGravacao): PedidoDeGravacao {
  const { guid: _guid, ...resto } = pedido;
  return resto;
}
