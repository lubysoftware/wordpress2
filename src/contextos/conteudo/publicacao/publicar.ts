/**
 * **US-1**: publicar conteudo proprio por ato explicito.
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao`. Sao duas funcoes, e
 * a diferenca entre elas e a razao de as duas existirem:
 *
 * | funcao | o que e no legado | verifica capacidade? |
 * |---|---|---|
 * | {@link publicar} | a operacao *"publicar"* da tabela *Contratos* de `plan.md` — a superficie | **sim**, CA-1.1 |
 * | {@link transitarParaPublicado} | `wp_publish_post()` (`wp-includes/post.php:5404`) | **nao**, e e assim no legado |
 *
 * **`wp_publish_post()` nao tem portao, e isso e superficie publicada.** Ela e
 * funcao publica do nucleo, chamada por `check_and_publish_future_post()` (onde
 * nao ha ator nenhum: o disparo vem da fila) e por qualquer extensao. Dar-lhe um
 * portao de capacidade fecharia o sistema mais que o legado e quebraria a
 * publicacao agendada de T013, em que ninguem esta autenticado. O **P4** cobra
 * *"declarar permissao explicita em toda operacao exposta"* e **preservar o
 * default de cada camada, inclusive quando o default e permissivo"* — e e
 * exatamente o que as duas funcoes juntas fazem: a operacao declara a
 * capacidade, a funcao do legado declara que nao tem nenhuma.
 *
 * ---
 *
 * # As leituras, que sao tres, e a divergencia de cache que elas carregam
 *
 * `wp_publish_post()` chama `get_post()` **duas** vezes e o ouvinte da transicao
 * uma terceira:
 *
 * | # | onde | linha | o que o legado faz |
 * |---|---|---|---|
 * | 1 | `$post = get_post( $post )` | `:5415` | com identificador, consulta; com o registro em maos, **nao consulta** |
 * | 2 | `$post_before = get_post( $post->ID )` | `:5417` | sempre com identificador |
 * | 3 | `get_the_guid( $post->ID )`, dentro do ouvinte | `:8159` | sempre com identificador, e **depois** de `clean_post_cache()` |
 *
 * **Com o cache do legado ligado**, 1 consulta e popula o cache, 2 acerta o
 * cache e nao consulta, `clean_post_cache()` esvazia a entrada e 3 consulta de
 * novo — **duas** consultas, e a segunda devolve a linha **ja atualizada**.
 * **Sem cache**, que e o estado desta arvore, saem **tres**.
 *
 * Isso **nao** foi decidido aqui, e nao precisa ser: e a mesma divergencia que
 * T002 declarou no README deste modulo e no cabecalho de
 * `armazenamento/metadado.ts` — REQ-165 (*"decidir se o cache de objeto nasce
 * persistente"*) ficou fora do pacote, e a borda 5 de `target_architecture.md`
 * manda o cache **desligado nas duas metades** durante a coexistencia, que e
 * como a comparacao de paridade roda. As tres leituras estao nos **mesmos
 * pontos** do legado, de modo que o cache, quando existir, entra na frente de
 * cada uma sem mudar o que elas devolvem.
 *
 * E a leitura 1 aceita `number` **ou** o registro, como `get_post()` do legado
 * aceita `int|WP_Post`: quem ja tem a linha em maos nao a le de novo, que e o
 * que a operacao {@link publicar} faz depois de ler para decidir a capacidade.
 *
 * ---
 *
 * # Os dois retornos silenciosos, e por que nenhum dos dois e erro
 *
 * ```php
 * $post = get_post( $post );
 * if ( ! $post )                              { return; }   // :5417
 * if ( 'publish' === $post->post_status )      { return; }   // :5412
 * ```
 *
 * O segundo e **P7 / BR-MIGRAR-007**, *"republicar e operacao nula: nenhum
 * gancho de transicao dispara"*, e e a historia **US-5** — cujos criterios
 * (CA-5.1 a CA-5.3) sao verificados por **T011**, nao por esta tarefa. A guarda
 * esta aqui porque ela e **a terceira linha de `wp_publish_post()`**: extrai-la
 * para outra tarefa produziria, no meio do caminho, uma publicacao que dispara a
 * transicao duas vezes — exatamente o que CA-1.2 (*"uma unica vez"*) e UT-019-8
 * cobram. A nota de compatibilidade da regra e literal: *"idempotencia por
 * guarda de estado, nao por chave de evento. No alvo, a guarda permanece
 * explicita"*.
 *
 * O primeiro e silencio puro: `wp_publish_post()` nao devolve erro e o
 * comentario de `check_and_publish_future_post()` o confirma — *"wp_publish_post()
 * returns no meaningful value"*. O **P7** manda preservar o modo de falha,
 * *"inclusive o silencio"*, e e por isso que {@link ResultadoDaPublicacao}
 * distingue os desfechos **sem** inventar mensagem para nenhum dos dois.
 *
 * ---
 *
 * # O que esta operacao NAO faz, e de quem e
 *
 * - **Nao cobra a unicidade do identificador na URL, e o legado tambem nao.**
 *   `wp_publish_post()` nao toca `post_name`: `wp_unique_post_slug()` e chamada
 *   de `wp_insert_post()` (`:5561`), no caminho de **gravacao**. Logo *"o slug do
 *   rascunho muda sozinho ao publicar"* (BR-MIGRAR-005, CA-3.2) acontece quando
 *   se publica **salvando**, e **nao** quando se publica por esta transicao —
 *   que e uma porta diferente, e nela o identificador duplicado sobrevive a
 *   publicacao. Quem pegar **T007** (US-3) precisa disso: sao dois caminhos, e
 *   so um deles cobra unicidade.
 * - **Nao resolve estado por data.** Publicado com data a frente virando
 *   agendado, e agendado com data no passado virando publicado, sao `:4798`-`:4808`,
 *   em `wp_insert_post()`: **T013** (US-6).
 * - **Nao grava `post_modified`.** `wp_publish_post()` atualiza **uma** coluna.
 * - **Nao notifica ninguem.** US-9 e T019, e `spec.md` registra que o caso de uso
 *   diz o contrario do criterio — a parada esta no cabecalho de
 *   `../portas/porta-de-email.ts` e no README deste modulo.
 * - **Nao guarda versao anterior.** `wp_save_post_revision()` e chamada de
 *   `wp_insert_post()`, nao daqui: **T021** (US-10).
 */

import type { Conteudo } from '../armazenamento/index.js';
import type { ContextoDePublicacao } from './contexto-de-publicacao.js';
import {
  autorizarPublicacao,
  type RecusaDaPublicacao,
} from './permissao-de-publicacao.js';
import {
  aplicarTermoPadrao,
  type TermoPadraoAtribuido,
} from './termo-padrao-na-publicacao.js';
import {
  ESTADO_PUBLICADO,
  transitarEstado,
  type EfeitosDaTransicao,
} from './transicao-de-estado.js';

/**
 * `$update` — o terceiro argumento de `save_post`, `save_post_{tipo}`,
 * `wp_insert_post` e `wp_after_insert_post` neste caminho.
 *
 * Vale **sempre `true`**: o legado passa o literal (`:5461`, `:5464`, `:5467`,
 * `:5468`), porque publicar e atualizar um registro que ja existia. Declarado
 * como constante para que nenhum ponto deste arquivo o passe diferente dos
 * outros.
 */
export const ATUALIZACAO_NA_PUBLICACAO = true;

/** O que aconteceu. Quatro desfechos, e nenhum deles e excecao. */
export type DesfechoDaPublicacao =
  /** O estado foi gravado e a transicao disparou uma vez. */
  | 'publicado'
  /** `get_post()` nao achou a linha: retorno silencioso do legado (`:5417`). */
  | 'inexistente'
  /** Ja estava publicado: operacao nula, sem transicao (P7, `:5412`). */
  | 'ja-publicado'
  /** Sem a capacidade de publicar aquele tipo (CA-1.1). */
  | 'recusado';

/** O que a operacao devolve. */
export interface ResultadoDaPublicacao {
  readonly desfecho: DesfechoDaPublicacao;
  /** A recusa de CA-1.1, ou `null`. Preenchida **so** no desfecho `recusado`. */
  readonly recusa: RecusaDaPublicacao | null;
  /**
   * O conteudo **como o legado o deixa em memoria** ao fim da operacao, ou
   * `null` quando a linha nao existe.
   *
   * ⚠️ So o estado muda no objeto. O legado escreve `$post->post_status =
   * 'publish'` (`:5451`) e **nao** repassa ao objeto o `guid` que o ouvinte da
   * transicao acabou de gravar na coluna — logo quem le este registro depois da
   * operacao, sem reconsultar, ve o `guid` antigo. E observavel por extensao, e
   * esta reproduzido.
   */
  readonly conteudo: Conteudo | null;
  /** `$old_status` (`:5450`), ou `null` quando nao houve transicao. */
  readonly estadoAnterior: string | null;
  /**
   * **CA-1.3**, *"endereco definitivo"*: `get_permalink()` do conteudo
   * publicado, ou `false`.
   *
   * E o passo 7 de UC-03 — *"Sistema devolve o conteudo publicado com o endereco
   * definitivo"*. No legado quem resolve o endereco para devolver e a
   * **superficie** (o campo `link` da resposta REST, o redirecionamento do
   * painel), e nao `wp_publish_post()`, que nao devolve nada; por isso ele e
   * resolvido em {@link publicar} e nao em {@link transitarParaPublicado}.
   */
  readonly endereco: string | false;
  /** **CA-1.4**: o que foi atribuido, na ordem. Lista vazia e afirmacao. */
  readonly termosPadraoAtribuidos: readonly TermoPadraoAtribuido[];
  /** Os efeitos do ouvinte do nucleo (CA-1.3 e CA-1.5), ou `null`. */
  readonly efeitosDaTransicao: EfeitosDaTransicao | null;
}

/** Quem se publica. */
export interface PedidoDePublicacao {
  readonly conteudoId: number;
}

const SEM_PUBLICACAO = {
  recusa: null,
  conteudo: null,
  estadoAnterior: null,
  endereco: false,
  termosPadraoAtribuidos: [],
  efeitosDaTransicao: null,
} as const;

/**
 * **A operacao de US-1.** Publica o conteudo, exigindo a capacidade de publicar
 * aquele tipo.
 *
 * **Permissao exigida: a capacidade de publicar daquele tipo de conteudo**
 * (`$post_type->cap->publish_posts`), decidida em
 * `permissao-de-publicacao.ts` — CA-1.1. Nao e uma cadeia fixa: e o slot do
 * registro do tipo, e e por isso que publicar pagina exige `publish_pages` sem
 * um unico `if` sobre o nome `page`.
 *
 * A ordem dos tres passos e a das superficies do legado, e ela importa:
 *
 * 1. **ler o conteudo.** E preciso para saber o **tipo**, e o tipo e quem diz
 *    qual capacidade perguntar. E a leitura 1 de `wp_publish_post()`, feita aqui
 *    uma vez e repassada adiante como registro — nao como identificador — para
 *    que a funcao do legado nao a repita;
 * 2. **perguntar a capacidade** (CA-1.1). Vem antes da guarda de P7 porque e
 *    assim nas superficies: `handle_status_param()` recusa durante a validacao
 *    do pedido, **antes** de qualquer escrita
 *    (`class-wp-rest-posts-controller.php:1349`);
 * 3. **transitar**, que e `wp_publish_post()` inteira.
 *
 * ⚠️ **Conteudo inexistente e recusado ANTES da capacidade**, e isso e do
 * legado: sem linha nao ha tipo, logo nao ha nome de capacidade a perguntar. A
 * negacao por ausencia de objeto e a mesma postura que
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts` registra para
 * BR-MIGRAR-091 — *"verificar capacidade de post sem informar o objeto devolve
 * `do_not_allow`"*: todo caminho de erro da autorizacao fecha a porta. Aqui a
 * porta fecha com o desfecho silencioso do legado, que e `inexistente`, e nao
 * com uma recusa de texto que o legado nao tem.
 */
export function publicar(
  contexto: ContextoDePublicacao,
  pedido: PedidoDePublicacao,
): ResultadoDaPublicacao {
  // Passo 1: a leitura 1 de `wp_publish_post()` (`:5415`).
  const conteudo = contexto.armazenamento.conteudo.obterPorId(pedido.conteudoId);
  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_PUBLICACAO };
  }

  // Passo 2: CA-1.1.
  const recusa = autorizarPublicacao(contexto, conteudo.tipo);
  if (recusa !== null) {
    return { desfecho: 'recusado', ...SEM_PUBLICACAO, recusa, conteudo };
  }

  // Passo 3: `wp_publish_post()`, com o registro em maos — logo sem reler.
  const publicacao = transitarParaPublicado(contexto, conteudo);
  if (publicacao.desfecho !== 'publicado') {
    return publicacao;
  }

  // Passo 7 de UC-03: devolve o conteudo publicado **com o endereco
  // definitivo**. Quem o resolve no legado e a superficie, nao
  // `wp_publish_post()`.
  return {
    ...publicacao,
    endereco: contexto.enderecoDoConteudo(pedido.conteudoId),
  };
}

/**
 * `wp_publish_post()` — a transicao para publicado, **sem portao de
 * capacidade** (`wp-includes/post.php:5404`).
 *
 * Exportada porque e **superficie publicada** (P8) e porque ela tem um segundo
 * chamador no legado que nao e uma superficie com ator:
 * `check_and_publish_future_post()`, disparada pela fila (`:5503`) — T013. Quem
 * chama esta funcao direto esta no mesmo lugar em que uma extensao do legado
 * esta: sem verificacao, por desenho.
 *
 * Aceita `number` ou o proprio registro, como `get_post()` aceita
 * `int|WP_Post`: so a primeira forma consulta.
 *
 * Os sete passos, na ordem do legado:
 *
 * | # | passo | linha |
 * |---|---|---|
 * | 1 | ler o conteudo; sem linha, retorno silencioso | `:5415`-`:5417` |
 * | 2 | ja publicado, retorno silencioso (P7) | `:5412` |
 * | 3 | ler o conteudo **anterior**, para o ultimo ponto | `:5417` |
 * | 4 | o termo padrao de cada taxonomia (CA-1.4) | `:5419`-`:5439` |
 * | 5 | `UPDATE` de **uma** coluna (CA-1.2) | `:5448` |
 * | 6 | a transicao: tres pontos, cadeia por prioridade (CA-1.2, CA-1.3, CA-1.5) | `:5452` |
 * | 7 | os cinco pontos de edicao e gravacao, e o de depois de inserir | `:5455`-`:5468` |
 */
export function transitarParaPublicado(
  contexto: ContextoDePublicacao,
  referencia: number | Conteudo,
): ResultadoDaPublicacao {
  // Passo 1 (`:5415`). Com o registro em maos o legado nao consulta.
  const conteudo =
    typeof referencia === 'number'
      ? contexto.armazenamento.conteudo.obterPorId(referencia)
      : referencia;

  if (conteudo === null) {
    return { desfecho: 'inexistente', ...SEM_PUBLICACAO };
  }

  // Passo 2 (`:5412`): P7 / BR-MIGRAR-007. Nada e lido, nada e escrito e
  // **nenhum ponto de extensao dispara** — e a ausencia do ponto que e
  // observavel por quem escuta transicao. Criterios em T011 (US-5).
  if (conteudo.estado === ESTADO_PUBLICADO) {
    return { desfecho: 'ja-publicado', ...SEM_PUBLICACAO, conteudo };
  }

  // Passo 3 (`:5417`): a leitura 2. Vem ANTES do `UPDATE`, e e so por isso que
  // ela carrega o estado antigo para o ultimo ponto de extensao.
  const conteudoAnterior = contexto.armazenamento.conteudo.obterPorId(
    conteudo.id,
  );

  // Passo 4 (`:5419`): CA-1.4, e tambem antes do `UPDATE`.
  const termosPadraoAtribuidos = aplicarTermoPadrao(
    contexto,
    conteudo.id,
    conteudo.tipo,
  );

  // Passo 5 (`:5448`): UMA coluna. Nem `post_modified`, nem `post_name`, nem
  // `comment_count` — ver o que esta operacao nao faz, no cabecalho.
  contexto.armazenamento.conteudo.atualizar(conteudo.id, {
    estado: ESTADO_PUBLICADO,
  });

  // `clean_post_cache( $post->ID )` (`:5450`): nao ha cache nesta arvore. Fica
  // nomeado nesta posicao porque e ela que faz a leitura 3 do ouvinte da
  // transicao ir ao banco em vez de ao cache.

  // `:5450`-`:5451`: o estado antigo guardado e o novo aplicado **em memoria**.
  const estadoAnterior = conteudo.estado;
  const conteudoPublicado: Conteudo = { ...conteudo, estado: ESTADO_PUBLICADO };

  // Passo 6 (`:5452`): CA-1.2, e dentro dela CA-1.3 e CA-1.5.
  const efeitosDaTransicao = transitarEstado(contexto, {
    estadoNovo: ESTADO_PUBLICADO,
    estadoAnterior,
    conteudo: conteudoPublicado,
  });

  // Passo 7 (`:5455`-`:5468`): cinco pontos na ordem, e o ultimo depois de
  // tudo. Os comentarios do legado em cada um sao `/** This action is documented
  // in wp-includes/post.php */`: sao os MESMOS pontos do caminho de gravacao, e
  // e por isso que extensao que escuta gravacao escuta publicacao tambem.
  const ganchos = contexto.ganchos;
  ganchos?.aoEditarConteudoDoTipo?.(
    `edit_post_${conteudoPublicado.tipo}`,
    conteudoPublicado.id,
    conteudoPublicado,
  );
  ganchos?.aoEditarConteudo?.(conteudoPublicado.id, conteudoPublicado);
  ganchos?.aoGravarConteudoDoTipo?.(
    `save_post_${conteudoPublicado.tipo}`,
    conteudoPublicado.id,
    conteudoPublicado,
    ATUALIZACAO_NA_PUBLICACAO,
  );
  ganchos?.aoGravarConteudo?.(
    conteudoPublicado.id,
    conteudoPublicado,
    ATUALIZACAO_NA_PUBLICACAO,
  );
  ganchos?.aoInserirConteudo?.(
    conteudoPublicado.id,
    conteudoPublicado,
    ATUALIZACAO_NA_PUBLICACAO,
  );

  // `wp_after_insert_post( $post, true, $post_before )` (`:5468`), que por sua
  // vez dispara o ponto `wp_after_insert_post` (`:6008`). Recebe o registro, e
  // nao o identificador, logo **nao** consulta de novo.
  ganchos?.depoisDeInserirConteudo?.(
    conteudoPublicado.id,
    conteudoPublicado,
    ATUALIZACAO_NA_PUBLICACAO,
    conteudoAnterior,
  );

  return {
    desfecho: 'publicado',
    recusa: null,
    conteudo: conteudoPublicado,
    estadoAnterior,
    // `wp_publish_post()` nao resolve endereco. Quem o resolve e {@link publicar}.
    endereco: false,
    termosPadraoAtribuidos,
    efeitosDaTransicao,
  };
}
