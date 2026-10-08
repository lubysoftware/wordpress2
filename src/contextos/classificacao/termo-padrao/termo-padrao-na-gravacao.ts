/**
 * **CA-3.1** (*"conteudo gravado sem termo informado num contexto que declara
 * termo padrao recebe o padrao"*), **CA-3.3** (*"conteudo em rascunho automatico
 * nao recebe o padrao: ainda nao e conteudo"*) e **CA-3.4** (*"ao fim de qualquer
 * gravacao, nenhum conteudo do tipo padrao esta sem classificacao"*).
 *
 * Entrega de **T007** da feature `003-classificacao-do-conteudo` (US-3). E a
 * metade de `wp_insert_post()` que a regra `P3` ocupa, e BC-01 ja havia dito, por
 * escrito, que ela e desta feature: *"`wp_set_post_categories()` (`:5053`),
 * `tax_input` (`:5089`) e o termo padrao do caminho de gravacao (`:5063`-`:5087`)
 * sao BC-02"* (`../../conteudo/gravacao/contexto-de-gravacao.ts`). A outra metade
 * da regra — *"na publicacao a regra se repete"* — e **CA-3.2**, e esta em
 * `classificacao-na-publicacao.ts`.
 *
 * | o que | no legado | criterio |
 * |---|---|---|
 * | a categoria padrao do tipo `post` | `post.php:4719` | **CA-3.1**, **CA-3.4**, `UT-035-5` |
 * | o laco dos demais contextos que declaram padrao | `post.php:5062`-`:5087` | **CA-3.1** |
 * | o `auto-draft` que salta os dois | o `!==` de `:4719` e o `if` que abre o laco | **CA-3.3** |
 *
 * ---
 *
 * # SAO DOIS CAMINHOS, e eles nao se parecem
 *
 * A regra tem **duas** metades na gravacao, com mecanismos diferentes, e tratar as
 * duas como uma e o jeito mais rapido de aplicar a categoria padrao a `page`:
 *
 * | | caminho da **categoria** | caminho dos **demais contextos** |
 * |---|---|---|
 * | o que o dispara | o tipo do objeto ser **`post`**, por igualdade de cadeia | o contexto **declarar** `default_term` no registro |
 * | de onde vem o padrao | a opcao `default_category` | a opcao `default_term_{nome}` |
 * | alcanca os oito do nucleo? | so `category` | **nenhum**: `rotuloPadrao` e nulo nos oito |
 * | por qual porta grava | `wp_set_post_categories()`, que **nao cobra capacidade** | o bloco de `tax_input`, que cobra `assign_terms` (`:5105`) |
 *
 * ⚠️ **A ultima linha e a mais consequente, e e ela que explica por que CA-3.2
 * existe.** O termo padrao de um contexto que nao e `category` passa pelo portao
 * de `assign_terms`, logo um ator sem essa capacidade grava conteudo **sem** o
 * padrao; o laco da publicacao, que roda **sem ator**, e o que apanha esse caso
 * depois (`../vinculo-de-objeto/substituir-vinculos.ts` registra que o nucleo
 * chama a atribuicao sem ator exatamente em `post.php:5438`). Fundir os dois
 * caminhos num so — com portao ou sem — mudaria um dos dois.
 *
 * ⚠️ **E o caminho da categoria nao consulta o registro.** O legado compara
 * `'post' === $post_type`, e nao pergunta se `category` declara padrao (ela nao
 * declara) nem se o tipo esta registrado. Por isso este arquivo tambem nao
 * pergunta: trocar a igualdade por uma consulta ao registro faria a categoria
 * padrao deixar de ser aplicada, porque **nenhum** dos oito contextos do nucleo
 * declara `default_term`.
 *
 * # Este arquivo decide a lista; quem grava sao as operacoes de US-2
 *
 * No legado o laco do termo padrao **nao grava nada**: ele reescreve
 * `$post_category` e `$postarr['tax_input']`, e a escrita acontece depois, nos
 * dois blocos que T005 portou. `../vinculo-de-objeto/classificar-conteudo.ts` ja
 * havia registrado essa divisao de maos: *"o laco do legado roda **antes** desta
 * chamada e e o que decide se a lista chega vazia ou com o padrao dentro"*.
 *
 * E por isso que esta tarefa entrega **duas** funcoes e nao uma:
 * {@link resolverTermoPadraoNaGravacao} e o laco — puro quanto a escrita, e e ele
 * que um chamador que monte a propria gravacao usa — e
 * {@link aplicarTermoPadraoNaGravacao} e o laco **mais** a passagem pela porta
 * certa de cada caminho, que e o que torna CA-3.1 e CA-3.4 afirmaveis por *"efeito
 * no banco"*, que e o criterio desta area (area 3 da Decisao 2 de
 * `parity_specs.md`).
 *
 * # 🔴 O QUE NAO FOI RECONFERIDO NO ORACULO, e por que isto esta escrito aqui
 *
 * **A instalacao do legado nao esta no disco desta maquina.** `README.md` deste
 * modulo afirma *"a arvore 7.1.2 analisada esta no disco"*, e isso **nao e mais
 * verdade nesta arvore de trabalho**: nao ha `wp-includes/post.php` para abrir, e
 * `parity_specs.md` ja registrava que o oraculo **executavel** tambem nao existe
 * (`oracleAvailable: false`; levanta-lo e T001 da feature `015`). Logo esta tarefa
 * foi escrita sobre tres fontes, e **nenhuma delas e memoria**:
 *
 * 1. o pacote: `BR-MIGRAR-003` (`P3`), com as duas ancoras; `UC-05` (fluxo
 *    alternativo *"nenhum termo informado"* e a excecao do `auto-draft`); `UC-03`
 *    (passo 5 e a pos-condicao *"toda taxonomia com termo padrao tem ao menos um
 *    termo atribuido"*); `spec.md` (CA-3.1 a CA-3.4) e `backlog/tests.md`
 *    (`UT-035-1` a `UT-035-5`);
 * 2. a transcricao **merged** do laco da publicacao, com os cinco ramos e as
 *    linhas, que T003 de BC-01 deixou em
 *    `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`;
 * 3. as ancoras que T005 e BC-01 deixaram para o bloco da gravacao
 *    (`post.php:5062`-`:5087` aqui, `:5063`-`:5087` em BC-01 — as duas ondas
 *    divergem em uma linha, e nenhuma das duas pode ser reconferida hoje).
 *
 * **Dois pontos ficam para quem tiver o oraculo, e os dois estao marcados no
 * corpo:** (a) se `post.php:4719` testa a opcao antes de usa-la, como o ramo 4 do
 * laco da publicacao testa — aqui ela e testada, porque a alternativa **remove**
 * classificacao que o legado preserva, e o P5 poe a cascata observavel fora do
 * alcance do agente; e (b) se a ordem interna do laco de `:5062`-`:5087` e a
 * implementada — lista informada vence, depois vinculos existentes, depois a
 * opcao. A ordem implementada e a unica que satisfaz CA-3.1 **e** nao apaga termo
 * ja atribuido, que e o ramo 2 do laco da publicacao (*"Do not modify previously
 * set terms"*) lido no caminho gemeo.
 *
 * # O que este arquivo NAO faz
 *
 * - **Nao grava conteudo.** O objeto **ja existe**: `wp_insert_post()` chega aqui
 *   depois do `INSERT` em `posts`, e `posts` e BC-01.
 *   {@link PedidoDeTermoPadraoNaGravacao} recebe o identificador, o tipo e o
 *   estado por argumento (AD-10).
 * - **Nao cria o rotulo padrao.** Quem o cria e o instalador (*"a instalacao nova
 *   cria o rotulo padrao do contexto de categoria, como o instalador do legado
 *   faz"*, `plan.md` § *Migracao de dados*) e `register_taxonomy()`, para quem
 *   declara `default_term` (`taxonomy.php:539`-`:558`). Aqui a opcao so e **lida**.
 * - **Nao protege o termo padrao de ser apagado.** *"O termo padrao do contexto e
 *   indestrutivel"* e **US-5**, T011; *"apagar um termo devolve o objeto ao termo
 *   padrao, se aquele era o unico"* (`DB-TRG4`, `BR-MIGRAR-080`) e **CA-4.4**,
 *   T009. As duas vao chamar {@link chaveDoTermoPadrao} e
 *   {@link OpcoesNaClassificacao}, que e a razao de os dois nascerem publicados.
 * - **Nao reconta termo.** A contagem sai por dentro das operacoes de US-2
 *   (`../vinculo-de-objeto/contagem-de-uso.ts`), como no legado.
 */

import {
  classificarConteudo,
  normalizarRotulosInformados,
  substituirVinculosDoObjeto,
  type EscopoDeVinculoDeObjeto,
  type MotivoDeRecusaSilenciosa,
  type RotuloInformado,
} from '../vinculo-de-objeto/index.js';
import { CONTEXTO_DE_CATEGORIA } from '../registro/index.js';
import {
  contextoAceitaTipoDeObjeto,
  contextosDoTipoDeObjeto,
  ehErroDeTermo,
  type ErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import {
  chaveDoTermoPadrao,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  SEM_TERMO_PADRAO,
  TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
} from './chave-do-termo-padrao.js';
import type { ColaboracaoDoTermoPadrao } from './escopo-de-termo-padrao.js';

/** A lista informada para um contexto, nas formas que o legado aceita. */
export type ListaInformada = readonly RotuloInformado[] | RotuloInformado;

/** O que se pede ao laco do termo padrao de uma gravacao. */
export interface PedidoDeTermoPadraoNaGravacao {
  /**
   * `term_relationships.object_id` — o objeto que **ja existe**.
   *
   * ⚠️ "Objeto", nao "conteudo", pela razao de sempre nesta feature: a coluna e
   * polimorfica. Ver `../armazenamento/vinculo.ts`.
   */
  readonly objetoId: number;
  /**
   * O tipo do objeto — `$post_type`. A comparacao com
   * {@link TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO} e por igualdade de cadeia, como no
   * legado.
   */
  readonly tipoDeObjeto: string;
  /**
   * O estado resolvido da gravacao — `$post_status`.
   *
   * Chega por argumento porque `posts` e BC-01 e a regra de dependencia 3 proibe
   * a travessia por `import`. **E o estado JA RESOLVIDO**, nao o informado: no
   * legado o laco le `$post_status` depois de `wp_insert_post()` o ter decidido
   * (a regra `P1`, *"publicar e ato explicito"*, e de BC-01 e roda antes).
   * Informar o estado cru faria a gravacao de um rascunho sem estado declarado
   * cair no ramo errado de **CA-3.3**.
   */
  readonly estado: string;
  /**
   * `$post_category` — a lista do caminho antigo da categoria
   * (`post.php:5053`).
   *
   * Ausente e lista vazia sao a **mesma coisa** aqui, e e isso que o legado faz:
   * o ramo e `empty( $post_category ) || 0 === count( ... ) || ! is_array( ... )`.
   */
  readonly categorias?: ListaInformada;
  /**
   * `$postarr['tax_input']` — o mapa de contexto para lista
   * (`post.php:5089`).
   *
   * Contexto ausente do mapa e contexto com lista vazia sao tratados igual, como
   * no legado: o laco pergunta `empty( $postarr['tax_input'][ $taxonomy ] )`.
   */
  readonly rotulosPorContexto?: Readonly<Record<string, ListaInformada>>;
}

/**
 * De onde saiu a lista que o laco decidiu — e **nao** e cosmetico: cada origem
 * corresponde a um ramo diferente do legado, e os tres emitem sequencias de
 * comandos diferentes.
 */
export type OrigemDaListaDoTermoPadrao =
  /** A opcao do termo padrao foi lida e aplicada. E **CA-3.1**. */
  | 'termo-padrao'
  /**
   * O objeto **ja tinha** termo naquele contexto e a lista informada veio vazia,
   * logo o conjunto existente e reafirmado em vez de apagado.
   *
   * E o gemeo do ramo 2 do laco da publicacao (*"Do not modify previously set
   * terms"*, `post.php:5427`-`:5429`), e e o ramo que impede que uma gravacao sem
   * `tax_input` limpe a classificacao do conteudo.
   */
  | 'vinculos-existentes';

/** A porta por onde o legado grava cada uma das duas metades. */
export type PortaDaEscritaDoTermoPadrao =
  /** `wp_set_post_categories()` (`post.php:5053`): **sem** cobranca de capacidade. */
  | 'categoria'
  /** O bloco de `tax_input` (`:5089`): cobra `assign_terms` (`:5105`). */
  | 'mapa-de-contextos';

/** Uma lista que o laco do termo padrao decidiu, antes de qualquer escrita. */
export interface ListaDoTermoPadrao {
  readonly contexto: string;
  /** Os identificadores de rotulo que a lista passa a conter. */
  readonly rotulos: readonly number[];
  readonly origem: OrigemDaListaDoTermoPadrao;
  readonly porta: PortaDaEscritaDoTermoPadrao;
}

/** O desfecho de gravar uma das listas que o laco decidiu. */
export type ResultadoDaEscritaDoTermoPadrao =
  | {
      readonly aplicado: true;
      /** Os `term_taxonomy_id` afetados, como a atribuicao os devolve. */
      readonly rotulosNoContextoIds: readonly number[];
    }
  | {
      readonly aplicado: false;
      /**
       * A recusa **silenciosa** do portao de `tax_input`. So acontece na porta
       * `mapa-de-contextos`, e no legado nao produz mensagem nem registro (P7).
       */
      readonly motivo: MotivoDeRecusaSilenciosa;
    }
  | ErroDeTermo;

/** Uma lista decidida pelo laco, com o que a escrita dela devolveu. */
export interface AplicacaoDoTermoPadrao extends ListaDoTermoPadrao {
  readonly resultado: ResultadoDaEscritaDoTermoPadrao;
}

/**
 * `array_filter()` sem retorno de chamada sobre a lista informada: cai tudo que o
 * PHP considera falso.
 *
 * E o *"Filter out empty terms"* que o laco faz antes de perguntar se a lista
 * esta vazia. ⚠️ **A cadeia `'0'` cai junto com o numero `0`**, porque
 * `empty( '0' )` e verdadeiro em PHP — a mesma pegadinha que
 * `../vinculo-de-objeto/rotulos-informados.ts` documenta, e que e usada de
 * proposito pela caixa de categoria da tela, que envia um campo oculto com valor
 * `0` *"to allow for an empty term set to be sent"* (`meta-boxes.php:661`).
 */
function filtrarVazios(
  informados: readonly RotuloInformado[],
): readonly RotuloInformado[] {
  return informados.filter((item) =>
    typeof item === 'number' ? item !== 0 : item !== '' && item !== '0',
  );
}

/** A lista informada para um contexto, normalizada e sem os vazios. */
function informadaPara(
  pedido: PedidoDeTermoPadraoNaGravacao,
  contexto: string,
): readonly RotuloInformado[] {
  const informada = pedido.rotulosPorContexto?.[contexto];
  if (informada === undefined) {
    return [];
  }
  return filtrarVazios(normalizarRotulosInformados(informada));
}

/**
 * O laco do termo padrao de uma gravacao: decide as listas e **nao grava nada**.
 *
 * **Permissao exigida: nenhuma** — e isso e leitura do legado, nao economia. O
 * laco nao tem `current_user_can` em nenhum dos dois caminhos: quem cobra
 * `assign_terms` e o bloco que **grava** o mapa de contextos (`:5105`), e por isso
 * a capacidade aparece em {@link aplicarTermoPadraoNaGravacao} e nao aqui. O
 * caminho da categoria nao cobra nada em lugar nenhum.
 *
 * Devolve **somente o que o laco decidiu**, na ordem em que o legado decide: a
 * categoria primeiro (`:4719` vem antes de `:5062`), depois os demais contextos na
 * ordem de registro — que e a ordem em que
 * {@link contextosDoTipoDeObjeto} os devolve e, portanto, a ordem dos comandos
 * (area 3 da Decisao 2 de `parity_specs.md` compara *"snapshot + sequencia de
 * comandos"*). Lista vazia e afirmacao: e o resultado de **CA-3.3** e de um
 * conteudo que ja veio classificado.
 */
export function resolverTermoPadraoNaGravacao(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoTermoPadrao,
  pedido: PedidoDeTermoPadraoNaGravacao,
): readonly ListaDoTermoPadrao[] {
  const decididas: ListaDoTermoPadrao[] = [];
  const emRascunhoAutomatico = pedido.estado === ESTADO_DE_RASCUNHO_AUTOMATICO;

  /*
   * 1. O caminho da categoria — `P3` na letra, `post.php:4719`.
   *
   *    `if ( 'post' === $post_type && 'auto-draft' !== $post_status )`, com o
   *    comentario do legado por cima: *"'post' requires at least one category"*.
   *    As duas condicoes sao **CA-3.4** e **CA-3.3**, e a lista vazia e **CA-3.1**.
   *
   *    ⚠️ Repare no que NAO esta nesta condicao: nao se pergunta ao registro se
   *    `category` declara padrao (ela nao declara), nem se o contexto se aplica ao
   *    tipo (`is_object_in_taxonomy`, que e o portao de CA-2.4 e que a **escrita**
   *    cobra, nao o laco).
   */
  const categorias = filtrarVazios(
    normalizarRotulosInformados(pedido.categorias ?? []),
  );

  if (
    categorias.length === 0 &&
    pedido.tipoDeObjeto === TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO &&
    !emRascunhoAutomatico
  ) {
    const rotuloPadraoId = colaboracao.opcoes.identificadorDoTermoPadrao(
      OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    );

    /*
     * 🔴 **O teste da opcao e o ponto (a) do bloco do cabecalho.** O ramo 4 do
     * laco da publicacao desiste quando a opcao vale `0` (`:5436`-`:5437`,
     * transcrito por BC-01), e aqui ele desiste tambem. A alternativa —
     * aplicar `[0]` sem testar — faria a substituicao integral de US-2 resolver
     * `0` como identificador inexistente e **remover todos** os vinculos de
     * `category` daquele conteudo, que e o oposto do que CA-3.4 cobra. A tabela
     * *Nao negociavel* poe *"apagar dado, ou declarar restricao no armazenamento
     * que mude a cascata observavel"* fora do alcance do agente, e o P5 manda
     * manter *"exatamente o que desaparece e o que fica"*: na duvida entre
     * desistir e apagar, desistir e o unico lado que nao decide nada.
     */
    if (rotuloPadraoId !== SEM_TERMO_PADRAO) {
      decididas.push({
        contexto: CONTEXTO_DE_CATEGORIA,
        rotulos: [rotuloPadraoId],
        origem: 'termo-padrao',
        porta: 'categoria',
      });
    }
  }

  /*
   * 2. O laco dos demais contextos — `post.php:5062`-`:5087`, inteiro dentro de
   *    `if ( 'auto-draft' !== $post_status )`. **CA-3.3 e este `if`**, e e por
   *    isso que ele envolve o laco em vez de aparecer dentro dele: em rascunho
   *    automatico **nenhuma** leitura sai, nem a da juncao nem a da opcao.
   */
  if (emRascunhoAutomatico) {
    return decididas;
  }

  for (const contexto of contextosDoTipoDeObjeto(
    escopo,
    pedido.tipoDeObjeto,
  )) {
    // `if ( ! empty( $tax_object->default_term ) )`: o laco so olha contexto que
    // **declarou** padrao no registro — e nenhum dos oito do nucleo declarou, o
    // que faz deste ramo codigo sem chamador de fabrica. Portado porque existir
    // sem ser chamado e parte do que se clona (resposta 7 de `questions.md`, P8),
    // e porque e por aqui que entra o contexto registrado por uma extensao.
    if (contexto.rotuloPadrao === null) {
      continue;
    }

    // *"Passed custom taxonomy list overwrites the existing list if not empty"*:
    // a lista informada vence, e o laco nao toca naquele contexto.
    if (informadaPara(pedido, contexto.nome).length > 0) {
      continue;
    }

    /*
     * `wp_get_object_terms( $post_id, $taxonomy, array( 'fields' => 'ids' ) )`:
     * o conjunto que o objeto **ja tem**. Se ha algum e a lista informada veio
     * vazia, e ele que vale — o gemeo do ramo 2 do laco da publicacao.
     *
     * ⚠️ **Uma diferenca declarada, e ela e a mesma que T005 declarou.** O legado
     * completa cada termo por `populate_terms()`, que **descarta** o que
     * `get_term()` nao resolve — um rotulo compartilhado entre dois contextos
     * devolve `ambiguous_term_id` e desaparece do conjunto. Esta leitura e a
     * cadeia de um comando so (`listarRotulosDoObjeto`) e **nao** reproduz o
     * descarte. O limite e o de T003: nenhuma operacao do legado 7.1.2 cria
     * rotulo compartilhado (o inventario esta em
     * `../rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts`), logo o caso so
     * se alcanca por escrita direta no armazenamento. A questao inteira esta
     * aberta no `README.md` deste modulo, item 3 de *O que ninguem decidiu*.
     */
    const existentes = escopo.armazenamento.vinculos.listarRotulosDoObjeto(
      pedido.objetoId,
      contexto.nome,
    );

    if (existentes.length > 0) {
      decididas.push({
        contexto: contexto.nome,
        rotulos: existentes,
        origem: 'vinculos-existentes',
        porta: 'mapa-de-contextos',
      });
      continue;
    }

    // `$default_term_id = get_option( 'default_term_' . $taxonomy )`, e o
    // `if ( ! empty( $default_term_id ) )` que vem com ele.
    const rotuloPadraoId = colaboracao.opcoes.identificadorDoTermoPadrao(
      chaveDoTermoPadrao(contexto.nome),
    );

    if (rotuloPadraoId === SEM_TERMO_PADRAO) {
      continue;
    }

    decididas.push({
      contexto: contexto.nome,
      rotulos: [rotuloPadraoId],
      origem: 'termo-padrao',
      porta: 'mapa-de-contextos',
    });
  }

  return decididas;
}

/**
 * O laco **mais** a escrita de cada lista pela porta que o legado usa para ela —
 * e e esta funcao que torna **CA-3.1** e **CA-3.4** afirmaveis por *"efeito no
 * banco"*.
 *
 * **Permissao declarada: depende da porta, e a assimetria e do legado:**
 *
 * | porta | no legado | permissao | portao de tipo (CA-2.4) |
 * |---|---|---|---|
 * | `categoria` | `wp_set_post_categories()` (`post.php:5053`) | **nenhuma**: a funcao nao tem `current_user_can` e o nucleo a chama sem ator | **sim**, e e o `if` que guarda a chamada |
 * | `mapa-de-contextos` | o bloco de `tax_input` (`:5089`-`:5109`) | `$tax->cap->assign_terms`, **verificada** (`:5105`) — e a recusa e silenciosa | **sim**, por dentro de {@link classificarConteudo} |
 *
 * E por isso que a segunda metade passa por {@link classificarConteudo} (que tem
 * os tres portoes de US-2) e a primeira por {@link substituirVinculosDoObjeto}
 * com **um** portao escrito a mao: o do tipo de objeto, sem o da capacidade.
 * Trocar as portas em qualquer direcao muda quem consegue classificar.
 *
 * ⚠️ **O retorno do legado e ignorado nos dois caminhos**, e aqui ele viaja so
 * para que os criterios sejam afirmaveis por teste: **nenhum ramo deste fluxo o
 * consulta**, que e o que o **P7** cobra.
 */
export function aplicarTermoPadraoNaGravacao(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoTermoPadrao,
  pedido: PedidoDeTermoPadraoNaGravacao,
): readonly AplicacaoDoTermoPadrao[] {
  const aplicadas: AplicacaoDoTermoPadrao[] = [];

  for (const lista of resolverTermoPadraoNaGravacao(
    escopo,
    colaboracao,
    pedido,
  )) {
    aplicadas.push({
      ...lista,
      resultado:
        lista.porta === 'categoria'
          ? escreverPelaCategoria(escopo, colaboracao, pedido, lista)
          : escreverPeloMapaDeContextos(escopo, colaboracao, pedido, lista),
    });
  }

  return aplicadas;
}

/**
 * `if ( is_object_in_taxonomy( $post_type, 'category' ) ) { wp_set_post_categories(
 * $post_id, $post_category ); }` (`post.php:5053`).
 *
 * **Um portao, e nao dois:** o tipo de objeto e verificado — e **CA-2.4**, o
 * mesmo `if` que `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`
 * transcreveu —, e a capacidade **nao**, porque `wp_set_post_categories()` nao tem
 * `current_user_can` no corpo e o nucleo a chama sem ator.
 *
 * ⚠️ **O portao fica na escrita, nao na decisao, e a posicao e a do legado:** o
 * laco resolve `$post_category` em `:4719`, **antes** do `INSERT` em `posts`, e o
 * `if` aparece so em `:5053`. Logo a opcao e lida mesmo quando o vinculo nao sera
 * gravado — e a leitura da opcao e observavel na sequencia de comandos de quem
 * implementar `plataforma/opcoes/` sobre a porta de dados.
 *
 * De fabrica este portao sempre passa, porque `category` declara `post` entre os
 * tipos de objeto dela (`../registro/contextos-do-nucleo.ts`) e o laco so chega
 * aqui com o tipo `post`. Ele existe para o caso em que uma extensao redeclara
 * `category` com outro tipo — `register_taxonomy()` substitui o anterior, como o
 * legado faz —, e tem teste.
 */
function escreverPelaCategoria(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoTermoPadrao,
  pedido: PedidoDeTermoPadraoNaGravacao,
  lista: ListaDoTermoPadrao,
): ResultadoDaEscritaDoTermoPadrao {
  if (!contextoAceitaTipoDeObjeto(escopo, pedido.tipoDeObjeto, lista.contexto)) {
    // A recusa e **silenciosa**: o legado nao chama a atribuicao e segue adiante,
    // sem mensagem, sem excecao e sem registro (P7).
    return { aplicado: false, motivo: 'tipo-de-objeto-nao-declarado' };
  }

  const resultado = substituirVinculosDoObjeto(escopo, colaboracao, {
    objetoId: pedido.objetoId,
    contexto: lista.contexto,
    rotulos: lista.rotulos,
    acrescentar: false,
  });

  return ehErroDeTermo(resultado)
    ? resultado
    : { aplicado: true, rotulosNoContextoIds: resultado };
}

/**
 * O bloco de `tax_input` (`post.php:5089`-`:5109`), que e a operacao que T005
 * portou.
 *
 * ⚠️ **A capacidade e cobrada aqui, e ela pode recusar o termo padrao.** Um ator
 * sem `$tax->cap->assign_terms` do contexto grava conteudo **sem** o padrao, em
 * silencio, e e o laco da publicacao (**CA-3.2**) que apanha o caso depois,
 * porque ele roda sem ator.
 */
function escreverPeloMapaDeContextos(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoTermoPadrao,
  pedido: PedidoDeTermoPadraoNaGravacao,
  lista: ListaDoTermoPadrao,
): ResultadoDaEscritaDoTermoPadrao {
  const resultado = classificarConteudo(escopo, colaboracao, {
    objetoId: pedido.objetoId,
    tipoDeObjeto: pedido.tipoDeObjeto,
    contexto: lista.contexto,
    rotulos: lista.rotulos,
    acrescentar: false,
  });

  if (ehErroDeTermo(resultado)) {
    return resultado;
  }

  return resultado.classificado
    ? { aplicado: true, rotulosNoContextoIds: resultado.rotulosNoContextoIds }
    : { aplicado: false, motivo: resultado.motivo };
}
