/**
 * A area da personalizacao — o Customizer do legado.
 *
 * Esqueleto de **T001** da feature `009-apresentacao-e-personalizacao`; o
 * conjunto de alteracoes como tipo de conteudo entrou em **T002**, e a
 * pre-visualizacao em **T003** (US-1) — as operacoes estao em
 * {@link OperacoesDaPersonalizacao}. A separacao entre salvar e aplicar e de
 * **T005** (US-2); o relato do estado gravado, de **T007** (US-3); o
 * agendamento, de **T009** (US-4).
 *
 * | o que esta area vai fazer | ancora no legado |
 * |---|---|
 * | portao de entrada, pela meta-capacidade `customize` | `wp-admin/customize.php:15` |
 * | criar o conjunto como rascunho automatico | `wp-includes/class-wp-customize-manager.php:1041` |
 * | salvar | `wp-includes/class-wp-customize-manager.php:2433` |
 * | recusar estado fora dos quatro aceitos | `wp-includes/class-wp-customize-manager.php:2479` |
 * | verificar **em separado** a capacidade de publicar | `wp-includes/class-wp-customize-manager.php:2483` |
 * | responder "publicado" com o registro na lixeira | `wp-includes/class-wp-customize-manager.php:2578` |
 * | gravar o registro do conjunto | `wp-includes/class-wp-customize-manager.php:2642` |
 *
 * ## Tres coisas que quem pegar a tarefa seguinte precisa saber antes de escrever
 *
 * 1. 🔴 **A resposta mente, e a mentira e o comportamento a portar.** Depois de
 *    aplicado, o conjunto vai para a **lixeira**, e a resposta ao ator diz
 *    **publicado** (`class-wp-customize-manager.php:2578`; UC-29, pos-condicoes:
 *    *"a resposta ao ator diz 'publicado' — e nao e o que esta gravado"*). US-3
 *    **nao** e um pedido para consertar isso: CA-3.1 cobra *"informa o estado real
 *    em que o conjunto ficou"* e CA-3.2 cobra que *"informa separadamente que os
 *    valores de aparencia foram aplicados"* — sao dois fatos, nao um. ⚠️ Mas
 *    CA-3.3 diz *"nenhuma resposta do sistema anuncia um estado diferente do
 *    gravado"*, e isso **contradiz palavra por palavra** o que UC-29 e
 *    `state-machines.md` §5 registram como o comportamento do legado, que o **P1**
 *    manda reproduzir. **T001 nao resolve**, e nem poderia: a constituicao poe
 *    *"mudar regra de negocio documentada em `domain.md`"* na tabela do que exige
 *    decisao humana. Quem pegar **T007** le a secao *O que ninguem decidiu* de
 *    `../README.md` antes da primeira linha.
 * 2. **A capacidade de editar o conjunto e concedida por filtro, em execucao** —
 *    `grant_edit_post_capability_for_changeset()` sobre `map_meta_cap`
 *    (`class-wp-customize-manager.php:3239`, registrado em `:2966` e removido em
 *    `:2973`), e nao esta em papel algum. UC-29 diz o preco de ignora-la: *"quem
 *    migrar pela matriz de papeis produz um sistema em que ninguem salva"*. CA-2.3
 *    pede que a permissao seja *"declarada na matriz, e nao concedida por caminho
 *    indireto"*, e **isso nao e conflito**: e o que o **P3** e a resposta 3 ja
 *    mandam fazer com as quatro capacidades que existem so por filtro — *"incluir
 *    explicitamente"*. O mecanismo ja esta construido e tem dono:
 *    `plataforma/autorizacao/concessao-por-extensao.ts`, entrega de T019 da
 *    feature `001`. Quem pegar **T005** declara a concessao **ali**, e nao
 *    inventa uma matriz paralela aqui.
 * 3. **O conjunto e conteudo, e o conteudo e outro contexto.** `AGG-Changeset` e
 *    `BC-07` por regra e `posts` por armazenamento
 *    (`target_domain_model.md`: *"a forma de armazenamento nao decidiu o contexto"*),
 *    logo tudo que esta area faz com estado, data, autor, revisao e agendamento
 *    atravessa `BC-01`. Isso entra como **campo do contexto da operacao**, por
 *    ligacao tardia — nunca como `import` no topo (AD-10, regra de dependencia 3,
 *    *"sempre, sem excecao"*). O ciclo medido `conteudo ↔ apresentacao` e **167
 *    contra 95**, o caso irredutivel do grafo dos 13 contextos.
 *
 * ## O que esta area entrega hoje
 *
 * `nome`, a {@link LigacaoTardiaNoCiclo} para as outras duas areas (T001), e as
 * operacoes de US-1 (T003), cada uma com a permissao declarada em
 * `permissoes` — o que o **P4** cobra.
 */

import type {
  AreaDePersonalizacao,
  LigacaoTardiaNoCiclo,
} from '../ciclo-de-apresentacao.js';
import {
  abrirPersonalizacao,
  type ResultadoDaAbertura,
  type AberturaDaPersonalizacao,
} from './abrir-a-personalizacao.js';
import {
  pedidoDoAnexoNaPersonalizacao,
  type AnexoDeConteudoInicial,
  type PedidoDoAnexoNaPersonalizacao,
} from './anexo-na-personalizacao.js';
import type {
  ContextoDaPersonalizacao,
  PedidoDaPersonalizacao,
} from './contexto-da-personalizacao.js';
import {
  gravarSemAplicar,
  validarPedidoDeGravacao,
  type PedidoDeGravacaoSemAplicar,
  type ResultadoDaGravacaoSemAplicar,
  type ResultadoDaValidacaoDaGravacao,
} from './gravar-o-conjunto.js';
import { PERMISSOES_DA_PERSONALIZACAO } from './permissao-da-personalizacao.js';
import { pedirPrevia, type ResultadoDaPrevia } from './valores-da-previa.js';

/**
 * As operacoes de US-1 (T003). O contexto chega por argumento em todas, porque
 * identidade, requisicao e as ligacoes com `BC-01` sao escopo de REQUISICAO
 * (AD-02) e de ligacao tardia (AD-10).
 */
export interface OperacoesDaPersonalizacao {
  /**
   * A permissao de cada operacao, lida da declaracao do tipo. Todas resolvem em
   * `edit_theme_options` na instalacao de fabrica — ver
   * `permissao-da-personalizacao.ts`.
   */
  readonly permissoes: typeof PERMISSOES_DA_PERSONALIZACAO;

  /**
   * Abrir a personalizacao (CA-1.1, retomar de CA-1.3). **Permissao exigida:
   * `customize`** na tela; fora dela, `customize` **ou** o identificador de um
   * conjunto existente — *"the UUID serves as a secret key"*. Nao grava nada.
   */
  abrir(
    contexto: ContextoDaPersonalizacao,
    pedido: PedidoDaPersonalizacao,
  ): ResultadoDaAbertura;

  /**
   * O estado personalizado da requisicao de previa (CA-1.2). **Permissao
   * exigida: a de {@link abrir}**; os valores enviados sem gravar exigem, alem
   * dela, um dos nonces de previa ou de gravacao. Nao grava nada.
   */
  pedirPrevia(
    contexto: ContextoDaPersonalizacao,
    pedido: PedidoDaPersonalizacao,
  ): ResultadoDaPrevia;

  /**
   * As guardas do pedido de gravacao (CA-1.4, CA-1.6). **Permissao exigida:
   * sessao, o nonce de gravacao, `create_posts` ou `edit_post` do tipo, e
   * `publish_posts` do tipo para `publish`/`future`.**
   */
  validarPedidoDeGravacao(
    contexto: ContextoDaPersonalizacao,
    pedido: PedidoDaPersonalizacao,
    abertura: AberturaDaPersonalizacao | null,
  ): ResultadoDaValidacaoDaGravacao;

  /**
   * Gravar sem aplicar (CA-1.3). **Permissao exigida: a que
   * {@link validarPedidoDeGravacao} conferiu**, mais a capacidade de cada
   * configuracao gravada.
   */
  gravarSemAplicar(
    contexto: ContextoDaPersonalizacao,
    pedido: PedidoDeGravacaoSemAplicar,
  ): ResultadoDaGravacaoSemAplicar;

  /**
   * O pedido do anexo que nasce como rascunho automatico (CA-1.5). **Nenhuma
   * permissao**: e dado; quem o insere e a ingestao de `BC-04`.
   */
  pedidoDoAnexo(
    anexo: AnexoDeConteudoInicial,
    folhaDeEstilo: string,
  ): PedidoDoAnexoNaPersonalizacao;
}

/**
 * Cria a area, sem resolver nada.
 *
 * A ligacao chega por argumento e **nao e chamada aqui**: no instante desta
 * chamada as outras duas areas ainda nao existem. Ver
 * `../ciclo-de-apresentacao.ts`.
 */
export function criarAreaDePersonalizacao(
  noCiclo: LigacaoTardiaNoCiclo,
): AreaDePersonalizacao {
  return {
    nome: 'personalizacao',
    noCiclo,
    permissoes: PERMISSOES_DA_PERSONALIZACAO,
    abrir: abrirPersonalizacao,
    pedirPrevia,
    validarPedidoDeGravacao,
    gravarSemAplicar,
    pedidoDoAnexo: pedidoDoAnexoNaPersonalizacao,
  };
}
