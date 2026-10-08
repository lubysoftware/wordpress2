/**
 * **CA-3.4**: em conteudo pendente de quem nao pode publicar, o identificador na
 * URL fica vazio — `wp-includes/post.php:4726`-`:4739`.
 *
 * Entrega de **T007** da feature `002-autoria-e-publicacao` (US-3). A regra e
 * **BR-MIGRAR-004** (`P4`, confianca 🟢):
 *
 * > **Colaborador nao escolhe a URL do que esta em revisao.** Em `pending`, quem
 * > nao tem `publish_posts` tem o `post_name` esvaziado, para nao reservar slug
 * > sem poder publicar.
 * > — `target_business_rules.md`, BR-MIGRAR-004
 *
 * E a nota de migracao da propria regra diz por que ela mora **aqui**, na borda
 * de escrita, e nao numa tela: *"Depende de identidade corrente na borda de
 * escrita: carrega a implicacao 2 (contexto por requisicao explicito)"*. UC-06 a
 * descreve do lado de quem a sofre, e e literal sobre nao ser defeito: *"O slug
 * vazio e uma decisao de produto, nao um bug. Quem nao pode publicar nao reserva
 * endereco publico — e por isso o endereco final do texto so existe depois que
 * outra pessoa o aprova."*
 *
 * ---
 *
 * # Este e o UNICO portao de capacidade do caminho de gravacao
 *
 * `wp_insert_post()` nao verifica permissao para gravar — a analise esta no
 * cabecalho de `gravar.ts`, secao *"O portao que esta funcao nao tem"*, e o
 * achado de QA de REQ-020 a sustenta. O que existe e **esta** decisao, e ela nao
 * recusa a gravacao: ela **apaga um campo**. Um porte que a transformasse em
 * recusa fecharia o caminho que UC-06 descreve como o normal do colaborador.
 *
 * E e por causa dela que `base` entra em {@link ContextoDeGravacao} — o
 * cabecalho de `contexto-de-gravacao.ts` ja previa: *"a unica decisao de
 * capacidade do caminho de gravacao e a do identificador na URL
 * (`:4731`-`:4739`), e e ela que vai acrescentar `base` a este contexto quando
 * precisar"*.
 *
 * ---
 *
 * # Duas perguntas diferentes, e o comentario do legado diz por que
 *
 * > *For new posts check the primitive capability, for updates check the meta
 * > capability.*
 * > — `wp-includes/post.php:4729`
 *
 * | caminho | pergunta | o que ela resolve |
 * |---|---|---|
 * | **insercao** | `current_user_can( $post_type_object->cap->publish_posts )` | capacidade **primitiva**: nao ha linha, logo nao ha autoria nem estado a consultar |
 * | **atualizacao** | `current_user_can( 'publish_post', $post_id )` | **meta-capacidade**: passa por `map_meta_cap()`, que le o conteudo e resolve o nome do slot do tipo **daquela linha** |
 *
 * A diferenca e observavel em um caso: numa **insercao de tipo nao registrado**
 * o legado **conserva** o identificador. A condicao e
 * `! $update && $post_type_object && ! current_user_can( ... )`, e com
 * `$post_type_object` falso a conjuncao inteira cai — logo ninguem pergunta nada
 * e o campo fica como veio. Na **atualizacao** do mesmo tipo nao registrado a
 * resposta e a oposta: `map_meta_cap()` degrada para `edit_others_posts`
 * (`capabilities.php:421`), que o colaborador nao tem, e o identificador e
 * esvaziado. Duas portas, dois resultados, e os dois estao reproduzidos.
 *
 * ---
 *
 * # 🔴 O `case 'publish_post'` nao existia em `plataforma/autorizacao/`, e esta
 * tarefa NAO o moveu para la
 *
 * `target_architecture.md` poe os 86 `case` de `map_meta_cap()` em
 * `plataforma/autorizacao/`, e o README daquela pasta registra a divisao: o caso
 * de conteudo e o de conta estao la (features 001, T017 e T023), e *"os demais
 * chegam com a feature do objeto de cada um"*. `casoDeConteudo()` cobre as
 * familias de **editar**, **apagar** e **ler**; `publish_post` nao esta em
 * nenhuma das tres e nao estava em lugar nenhum.
 *
 * Ele e declarado aqui, na forma canonica de {@link CasoDeTraducao}, por duas
 * razoes:
 *
 * 1. **a regra de dependencia 2 proibe `plataforma/` importar `contextos/`**, e
 *    nao o contrario — logo um caso declarado aqui e consumivel la, por
 *    argumento, e um caso declarado la por esta tarefa decidiria no lugar da
 *    feature 001;
 * 2. **o caso e inseparavel do objeto dele.** Resolver `publish_post` exige ler
 *    o conteudo e o registro do tipo, que e exatamente o que este modulo tem em
 *    maos.
 *
 * ⚠️ **E e por isso que o fluxo nao depende de ele estar registrado na base.**
 * No legado `map_meta_cap()` tem os 86 casos **embutidos**: ninguem os registra,
 * e perguntar `publish_post` sempre resolve. Nesta arvore a lista chega por
 * `BaseDeAutorizacao.casosDeTraducao`, e uma composicao que a esquecesse faria a
 * traducao devolver a cadeia `publish_post` crua — que papel algum concede, logo
 * **negaria**, logo esvaziaria o identificador de um editor. Para que a decisao
 * nao dependa de quem monta o contexto, {@link podeReservarIdentificador}
 * acrescenta o proprio caso a lista que recebeu, no fim, onde ele nao desloca
 * nenhum caso que a base ja traga.
 */

import {
  CAPACIDADE_MAIS_ALTA,
  CAPACIDADE_NEGADA,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type CasoDeTraducao,
  type RelatorDeUsoIndevido,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { capacidadeDePublicar } from '../publicacao/index.js';

/**
 * `pending` — o **unico** estado em que esta decisao acontece (`:4731`).
 *
 * Fora dele nada e perguntado e nenhum identificador e esvaziado: quem grava
 * rascunho escolhe o apelido que quiser, porque o rascunho nao reserva endereco
 * de qualquer forma — ele nem tem identificador unico (CA-3.1, e a lista de
 * estados que dispensam a unicidade esta em `identificador-na-url.ts`).
 *
 * E a constante esta aqui, e nao no vocabulario de `../estado-editorial.ts`,
 * pelo mesmo precedente de `ESTADO_PRIVADO` em `campos-na-gravacao.ts`: no
 * vocabulario ha **vocabulario** e aqui ha **regra** — e esta e a comparacao que
 * decide se alguem perde o endereco escolhido.
 */
export const ESTADO_EM_REVISAO = 'pending';

/**
 * `publish_post` — a **meta-capacidade** que o caminho de atualizacao pergunta
 * (`:4736`).
 *
 * Nao e `publish_posts`, no plural, que e a primitiva do caminho de insercao: o
 * singular recebe o objeto e passa por `map_meta_cap()`
 * (`capabilities.php:382`), e e o plural que sai dele. Declarada como constante
 * porque e **nome publicado** (P8): extensao de terceiro pergunta por ela, e
 * interceptador de `map_meta_cap` compara a cadeia.
 */
export const CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO: Capacidade = 'publish_post';

/** O que o `case 'publish_post'` le do conteudo: so o tipo. */
export interface ConteudoNaPermissaoDePublicar {
  /** `$post->post_type` — o discriminador que diz qual slot perguntar. */
  readonly tipo: string;
}

/**
 * As duas leituras do `case 'publish_post'`.
 *
 * **E um recorte de `FonteDeConteudoNaAutorizacao`, de proposito**: aquela
 * interface tem sete metodos porque os casos de editar, apagar e ler precisam de
 * autoria, estado, lixeira e as tres paginas especiais do site. Este caso
 * precisa de dois, e exigir os sete faria toda composicao desta feature declarar
 * leituras que nenhum ramo desta tarefa consulta. A fonte completa **satisfaz**
 * esta, por forma, e pode ser passada onde ela e pedida.
 */
export interface FonteDaPermissaoDePublicar {
  /**
   * `get_post( $args[0] )` — o conteudo a que a pergunta se refere, ou `null`.
   *
   * A referencia chega em `unknown` porque e o `...$args` do chamador, como na
   * fonte completa: no legado ela pode ser identificador ou o proprio registro.
   * **Neste caminho e sempre o identificador** (`:4736` passa `$post_id`).
   */
  conteudo(referencia: unknown): ConteudoNaPermissaoDePublicar | null;

  /** `get_post_type_object( $nome )`, ou `null` quando o tipo nao esta registrado. */
  tipoDeConteudo(nome: string): TipoDeConteudoNaAutorizacao | null;
}

/**
 * O aviso de uso indevido do `case 'publish_post'` sem objeto
 * (`capabilities.php:384`-`:391`).
 *
 * **O texto e o do legado, em ingles**, pelo mesmo motivo registrado em
 * `../publicacao/permissao-de-publicacao.ts`: `EC-05` fixa que *"o `msgid` em
 * ingles E a chave do catalogo"*, logo traduzir aqui trocaria a chave. O `%s` do
 * legado e preenchido com o nome da capacidade entre `<code>`, como ele o
 * preenche.
 */
export const AVISO_DE_PUBLICACAO_SEM_OBJETO = Object.freeze({
  funcao: 'map_meta_cap',
  mensagem:
    'When checking for the <code>publish_post</code> capability, ' +
    'you must always check it against a specific post.',
  versao: '6.1.0',
});

/**
 * O aviso de tipo nao registrado do mesmo `case` (`capabilities.php:404`-`:415`).
 *
 * O legado preenche dois `%s`: o tipo e a capacidade. O primeiro e dado da
 * chamada, logo a mensagem e montada em {@link avisoDeTipoNaoRegistrado}.
 */
export const VERSAO_DO_AVISO_DE_TIPO_NAO_REGISTRADO = '4.4.0';

/** A mensagem do aviso de tipo nao registrado, com o tipo da chamada. */
export function avisoDeTipoNaoRegistrado(tipo: string): {
  readonly funcao: string;
  readonly mensagem: string;
  readonly versao: string;
} {
  return {
    funcao: 'map_meta_cap',
    mensagem:
      `The post type <code>${tipo}</code> is not registered, so it may not ` +
      'be reliable to check the capability ' +
      `<code>${CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO}</code> against a post ` +
      'of that type.',
    versao: VERSAO_DO_AVISO_DE_TIPO_NAO_REGISTRADO,
  };
}

/**
 * O `case 'publish_post'` de `map_meta_cap()` —
 * `wp-includes/capabilities.php:382`-`:423`.
 *
 * Os quatro ramos, na ordem do legado, e **todo caminho de erro fecha a porta**
 * ou a entrega a capacidade mais alta, que e a postura que
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts` registra para
 * BR-MIGRAR-091:
 *
 * | # | situacao | devolve | aviso |
 * |---|---|---|---|
 * | 1 | **sem objeto** (`! isset( $args[0] )`) | {@link CAPACIDADE_NEGADA} | sim, `6.1.0` |
 * | 2 | objeto informado e conteudo **inexistente** | {@link CAPACIDADE_NEGADA} | nao |
 * | 3 | tipo **nao registrado** | {@link CAPACIDADE_MAIS_ALTA} | sim, `4.4.0` |
 * | 4 | normal | o slot `publish_posts` **do tipo** | nao |
 *
 * ⚠️ **O ramo 3 nao nega: ele exige `edit_others_posts`.** E a *"capacidade mais
 * alta"* de UC-03, e a consequencia e que um editor **passa** por esse ramo e um
 * colaborador nao. Trocar por negacao fecharia uma porta a mais do que o legado
 * fecha.
 *
 * ⚠️ **`avisar` e opcional e nenhuma decisao depende dele** (**P7**: *"nenhuma
 * ramificacao do codigo testa o resultado de escrever log"*). Ausente, os ramos
 * de erro devolvem a mesma lista.
 */
export function capacidadesParaPublicarEsteConteudo(
  fonte: FonteDaPermissaoDePublicar,
  argumentos: readonly unknown[],
  avisar?: RelatorDeUsoIndevido,
): readonly Capacidade[] {
  // Ramo 1 (`:383`): `! isset( $args[0] )` — perguntar sem informar o objeto
  // nega, e e o que o cenario `@critico` de
  // `07-autorizacao-por-capacidade.feature` cobra para toda capacidade de
  // conteudo.
  if (argumentos.length === 0 || argumentos[0] === undefined || argumentos[0] === null) {
    avisar?.(AVISO_DE_PUBLICACAO_SEM_OBJETO);
    return [CAPACIDADE_NEGADA];
  }

  // Ramo 2 (`:397`-`:400`).
  const conteudo = fonte.conteudo(argumentos[0]);
  if (conteudo === null) {
    return [CAPACIDADE_NEGADA];
  }

  // Ramo 3 (`:403`-`:419`).
  const tipo = fonte.tipoDeConteudo(conteudo.tipo);
  if (tipo === null) {
    avisar?.(avisoDeTipoNaoRegistrado(conteudo.tipo));
    return [CAPACIDADE_MAIS_ALTA];
  }

  // Ramo 4 (`:422`). O slot pode nao existir num tipo que declarou o mapa a mao
  // — `plataforma/autorizacao/` registra que o mapa e **aberto** —, e ai nao ha
  // nome a perguntar: a porta fecha, como fecha em
  // `../publicacao/permissao-de-publicacao.ts`.
  return [capacidadeDePublicar(tipo) ?? CAPACIDADE_NEGADA];
}

/**
 * O mesmo caso, na forma que `BaseDeAutorizacao.casosDeTraducao` recebe.
 *
 * Devolve `null` para qualquer outra capacidade, que e como
 * `traduzirCapacidade()` sabe seguir para o caso seguinte. Exportado porque o
 * **P2** poe o contrato publico fora do alcance de quem codifica: quem montar a
 * autorizacao de uma requisicao desta instalacao registra este caso junto do de
 * conteudo e do de conta, e `publish_post` passa a resolver para qualquer
 * chamador — inclusive a API REST, que a pergunta em
 * `class-wp-rest-posts-controller.php`.
 */
export function casoDePublicacaoDeConteudo(
  fonte: FonteDaPermissaoDePublicar,
  avisar?: RelatorDeUsoIndevido,
): CasoDeTraducao {
  return (pedido) => {
    if (pedido.capacidade !== CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO) {
      return null;
    }
    return capacidadesParaPublicarEsteConteudo(
      fonte,
      pedido.argumentos,
      avisar,
    );
  };
}

/** O que a decisao de {@link identificadorDeQuemNaoPodePublicar} precisa. */
export interface ContextoDaPermissaoDoIdentificador {
  readonly base: BaseDeAutorizacao;
  readonly ator: AtorDeAutorizacao;
  readonly fonte: FonteDaPermissaoDePublicar;
  /** O relator de uso indevido, opcional — ver **P7**. */
  readonly avisar?: RelatorDeUsoIndevido;
}

/** O que o passo 10 do legado pergunta sobre o conteudo que esta sendo gravado. */
export interface PedidoDeReservaDeIdentificador {
  /** `$post_status` **resolvido**. Fora de `pending` nada acontece. */
  readonly estado: string;
  /** `$post_type` **resolvido** — e dele que sai o slot da capacidade. */
  readonly tipo: string;
  /** `$update`. Decide qual das duas perguntas e feita. */
  readonly atualizacao: boolean;
  /** `$post_id` — so e usado no caminho de atualizacao. */
  readonly conteudoId: number;
}

/**
 * **CA-3.4**: o identificador de quem nao pode publicar, em revisao, fica vazio
 * (`:4726`-`:4739`).
 *
 * Devolve o identificador **como deve ficar**: o informado, ou cadeia vazia.
 * Nunca lanca e nunca recusa a gravacao — a regra apaga um campo, e e so isso
 * que ela faz.
 *
 * ⚠️ **O `elseif` do legado e `elseif`, e nao um segundo `if`.** As duas
 * condicoes sao mutuamente exclusivas por `$update`, logo a diferenca nao e
 * alcancavel hoje; esta reproduzida na forma porque a primeira condicao tem
 * **tres** termos e a segunda **dois**, e e dessa assimetria que vem o caso do
 * tipo nao registrado (ver o cabecalho).
 */
export function identificadorDeQuemNaoPodePublicar(
  contexto: ContextoDaPermissaoDoIdentificador,
  pedido: PedidoDeReservaDeIdentificador,
  identificadorNaUrl: string,
): string {
  // `:4731` — fora de `pending` esta regra nao existe.
  if (pedido.estado !== ESTADO_EM_REVISAO) {
    return identificadorNaUrl;
  }

  // `:4732` — a leitura do registro do tipo acontece aqui, **dentro** do `if`:
  // gravar rascunho nao consulta o registro de tipos por este caminho.
  const tipo = contexto.fonte.tipoDeConteudo(pedido.tipo);

  if (!pedido.atualizacao) {
    // `:4734` — insercao: a primitiva, e com `$post_type_object` falso a
    // conjuncao inteira cai e o identificador **fica como veio**.
    if (tipo === null) {
      return identificadorNaUrl;
    }
    const capacidade = capacidadeDePublicar(tipo) ?? CAPACIDADE_NEGADA;
    return perguntarPermissao(
      comAtor(contexto.base, contexto.ator),
      capacidade,
    )
      ? identificadorNaUrl
      : '';
  }

  // `:4736` — atualizacao: a meta-capacidade.
  return podeReservarIdentificador(contexto, pedido.conteudoId)
    ? identificadorNaUrl
    : '';
}

/**
 * `current_user_can( 'publish_post', $post_id )` (`:4736`).
 *
 * A pergunta e feita pela **meta-capacidade**, com o argumento, e nao pela
 * primitiva ja resolvida — e a diferenca e observavel por extensao: o ponto
 * `user_has_cap` recebe `$args`, e uma extensao que decida por conteudo precisa
 * do identificador ali. Por isso o caso de traducao desta pasta e acrescentado
 * a lista da base **no momento da pergunta**, no fim, onde ele nao desloca
 * nenhum caso que a base ja traga. A razao esta no cabecalho deste arquivo.
 */
export function podeReservarIdentificador(
  contexto: ContextoDaPermissaoDoIdentificador,
  conteudoId: number,
): boolean {
  const caso =
    contexto.avisar === undefined
      ? casoDePublicacaoDeConteudo(contexto.fonte)
      : casoDePublicacaoDeConteudo(contexto.fonte, contexto.avisar);

  const base: BaseDeAutorizacao = {
    ...contexto.base,
    casosDeTraducao: [...(contexto.base.casosDeTraducao ?? []), caso],
  };

  return perguntarPermissao(
    comAtor(base, contexto.ator),
    CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO,
    conteudoId,
  );
}
