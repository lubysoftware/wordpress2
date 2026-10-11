/**
 * A area dos componentes de area — os widgets em sidebars do legado.
 *
 * Esqueleto de **T001** da feature `009-apresentacao-e-personalizacao`. **Nenhuma
 * regra de negocio esta implementada aqui.** Organizar os componentes entra em
 * **T015** (US-7) e a preservacao na troca de tema em **T019** (US-9).
 *
 * | o que esta area vai fazer | ancora no legado |
 * |---|---|
 * | portao de entrada, por `edit_theme_options` | `wp-admin/widgets.php:15` |
 * | conferir o token de salvar ou remover componente | `wp-admin/widgets-form.php:126` |
 * | gravar o mapa de areas | `wp-admin/widgets-form.php:199` · `wp-includes/widgets.php:1094`, `:1104` |
 * | conferir o token de limpar os inativos | `wp-admin/widgets-form.php:206` |
 * | remapear o que ficou sem area para os inativos | `wp-includes/widgets.php:1305`, `:1327` |
 * | guardar o mapa do tema que saiu, como theme mod | `wp-includes/widgets.php:1499` · `wp-includes/theme.php:775`-`:782` |
 *
 * ## Tres coisas que quem pegar a tarefa seguinte precisa saber antes de escrever
 *
 * 1. **Componente e area vivem em CONFIGURACAO, nao em tabela** (`domain.md` §1.3,
 *    UC-31), e `target_domain_model.md` registra `AGG-AreaDeWidget` como
 *    **dividido de `options`** — o aggregate *"encapsula a invariante **sem mudar
 *    isso**"*. O mapa inteiro e um valor serializado numa linha
 *    (`sidebars_widgets`, `wp-includes/widgets.php:1094`), e o formato dele e o
 *    nativo do PHP, nao JSON (`plan.md`, slot
 *    `serializacao-de-valor-persistido`; `plataforma/serializacao`). Criar tabela
 *    de widget e a modelagem "mais correta" que o **P5** recusa.
 * 2. 🔴 **A preservacao na troca de tema depende de guardar o mapa do tema
 *    ANTERIOR**, e e o risco 5 de `plan.md`: *"e a parte que mais quebra em porte,
 *    porque so aparece na segunda troca de tema"*. O legado grava esse mapa como
 *    theme mod com um instante junto — `{ time, data }`
 *    (`wp-includes/theme.php:775`-`:782`) —, e `retrieve_widgets()`
 *    (`wp-includes/widgets.php:1327`) e quem remapeia. CA-9.2 cobra que *"a
 *    configuracao do tema anterior permanece guardada e nao e apagada"* e CA-9.3
 *    que voltar exige **acao explicita**: UC-31 e a fonte dessas duas — *"nada e
 *    apagado, e nada volta sozinho se o tema anterior voltar"*.
 * 3. **A area de inativos e deposito sem retencao, e isso e proposital.** UC-31:
 *    *"guarda o que sobrou de todo tema ja usado, indefinidamente, e so uma acao
 *    manual a limpa"*. O identificador dela e fixo
 *    (`wp-includes/widgets.php:1075`-`:1077`). ⚠️ **O P6 proibe inventar prazo
 *    aqui**: *"nenhum prazo de retencao e declarado"* para o que o legado nao
 *    declara, e a tabela *Nao negociavel* da constituicao poe *"introduzir limite
 *    de taxa, prazo de retencao ou qualquer numero que o legado nao tem"* entre as
 *    decisoes que exigem humano. Quem pegar T015 implementa CA-7.4 como **acao**,
 *    nunca como coleta por prazo.
 *
 * ## ⚠️ Esta area nao tem cenario de paridade de fluxo, e isso esta registrado
 *
 * UC-31 e um dos quatro casos de uso que `parity_specs.md` conta fora dos 43 com
 * cenario de fluxo. `LACUNA-IN-12`: *"nenhum cenario verifica o efeito no banco de
 * reordenar um menu ou mover um widget"*. O oraculo desta area, para T015 e T019,
 * e o contrato de tela mais os casos do catalogo `backlog/tests.md` (UT-102-1 a
 * UT-102-6 e UT-103-1 a UT-103-5, nas tarefas `[P]` T016 e T020).
 *
 * ## O que esta area entrega hoje
 *
 * `nome` e a {@link LigacaoTardiaNoCiclo} para as outras duas areas. Nada mais, e
 * nada antes da tarefa de cada historia (**P4**).
 */

import type {
  AreaDeComponentesDeArea,
  LigacaoTardiaNoCiclo,
} from '../ciclo-de-apresentacao.js';

/**
 * Cria a area, sem resolver nada.
 *
 * A ligacao chega por argumento e **nao e chamada aqui**. Ver
 * `../ciclo-de-apresentacao.ts`.
 */
export function criarAreaDeComponentesDeArea(
  noCiclo: LigacaoTardiaNoCiclo,
): AreaDeComponentesDeArea {
  return { nome: 'componentes-de-area', noCiclo };
}
