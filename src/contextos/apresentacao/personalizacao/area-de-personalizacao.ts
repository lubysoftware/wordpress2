/**
 * A area da personalizacao — o Customizer do legado.
 *
 * Esqueleto de **T001** da feature `009-apresentacao-e-personalizacao`. **Nenhuma
 * regra de negocio esta implementada aqui.** O conjunto de alteracoes como tipo de
 * conteudo entra em **T002**; a pre-visualizacao em **T003** (US-1); a separacao
 * entre salvar e aplicar em **T005** (US-2); o relato do estado gravado em
 * **T007** (US-3); o agendamento em **T009** (US-4).
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
 * `nome` e a {@link LigacaoTardiaNoCiclo} para as outras duas areas. Nada mais, e
 * nada antes da tarefa de cada historia: e o que o **P4** cobra.
 */

import type {
  AreaDePersonalizacao,
  LigacaoTardiaNoCiclo,
} from '../ciclo-de-apresentacao.js';

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
  return { nome: 'personalizacao', noCiclo };
}
