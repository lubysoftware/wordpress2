/**
 * Os nomes de tabela, de tipo de conteudo, de opcao e de modificacao de tema
 * desta feature — e nenhum nome se monta a mao fora daqui.
 *
 * Entrega de **T002** da feature `009-apresentacao-e-personalizacao`.
 * `satisfaz: — (infraestrutura)`: nenhum criterio de aceite fecha aqui, e
 * **nenhuma regra de negocio esta neste arquivo**.
 *
 * ## As duas tabelas, e por que nao ha uma terceira
 *
 * `target_data_model.md` poe `Changeset` em `{p}posts` com
 * `post_type='customize_changeset'` — uma das **seis** entidades de dominio que
 * compartilham a mesma tabela — e `Opcao` em `{p}options`. A nota da propria
 * tabela e a instrucao: *"Isso **nao** e erro de modelagem a corrigir — e a
 * forma do legado, e separa-las em tabelas proprias mudaria `erd-complete.md`
 * §3 e quebraria a coexistencia"*.
 *
 * | o que | onde | dono do aggregate |
 * |---|---|---|
 * | o conjunto de alteracoes | `{site}posts`, `post_type = 'customize_changeset'` | `AGG-Changeset`, **dividido** de `posts` |
 * | a configuracao do tema | `{site}options`, em cinco chaves mais a de modificacoes | `AGG-Tema`, **fundido** de `class-wp-theme.php` + `class-wp-theme-json.php` + `options` |
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL de `target_data_model.md`,
 * logo as duas levam o prefixo **do site** — que e o unico que
 * `portas/porta-de-dados.ts` declara, de proposito. O prefixo e dado, nao
 * configuracao de conexao (nota 3 de `target_data_model.md`), e um nome montado
 * no meio de uma consulta e a forma mais barata de trocar o tema de um site
 * pelo do outro.
 *
 * ## ⚠️ Nome de opcao e superficie publicada
 *
 * As chaves abaixo sao lidas e escritas por tema e por extensao de terceiro, e a
 * tabela *Nao negociavel* da constituicao poe *"renomear ou remover ponto de
 * extensao, rota, **opcao**, constante ou funcao publicada"* fora do alcance do
 * agente (**P8**). Cada uma carrega a ancora de onde foi lida, porque nenhuma
 * delas e nomeada em documento algum do pacote: elas vem do sistema analisado,
 * que o **P1** poe como a especificacao.
 *
 * ## O que NAO esta aqui
 *
 * - **O DDL das duas tabelas.** A borda 4 de `target_architecture.md` tem dono
 *   unico da evolucao de esquema — a metade PHP mantem `db_version` e *"a
 *   metade nova le e nunca escreve"* —, e AD-11 e literal: *"nenhuma mudanca de
 *   esquema e permitida nesta fase"*. Esta feature nao cria tabela e nao
 *   acrescenta coluna; `{p}posts` e `{p}options` chegam declarados pela feature
 *   que semeia a instalacao (`010-operacao-do-software`).
 * - **A chave da opcao de componentes por area** (`sidebars_widgets`). Ela e
 *   `AGG-AreaDeWidget` e nao `AGG-Tema`, e quem a declara e a tarefa que a usa
 *   — **T015** (US-7). O que esta aqui e a **modificacao de tema** de mesmo
 *   nome, que e outra coisa: ver {@link MODIFICACAO_DE_COMPONENTES_POR_AREA}.
 * - **O termo do menu e o item de menu.** Os dois nomes (`nav_menu` e
 *   `nav_menu_item`) sao de **T011** (US-5), e o termo e `BC-02`: o registro
 *   dele ja existe, merged, em `contextos/classificacao/registro/`.
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}posts` — o registro universal de conteudo, onde o conjunto e uma linha. */
export function tabelaDeConteudo(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}posts`;
}

/** `{site}options` — a configuracao do site, com 4 colunas e 3 indices. */
export function tabelaDeOpcoes(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}options`;
}

/**
 * `customize_changeset` — o valor de `post_type` que faz da linha um conjunto de
 * alteracoes de aparencia.
 *
 * Registrado por `create_initial_post_types()`
 * (`wp-includes/post.php:220`-`:264`, o nome em `:221`). E discriminador em tres
 * lugares do proprio legado: a consulta que resolve o identificador
 * (`class-wp-customize-manager.php:1000`), a guarda de tipo depois do cache
 * (`:994`) e a recusa de ler dado de um registro de outro tipo (`:1136`).
 *
 * `spec.md` diz por que isto e a decisao central da feature: *"A alteracao de
 * aparencia e guardada como registro de conteudo, com tipo proprio, o que faz a
 * personalizacao herdar autor, data, revisao e agendamento sem nada ter sido
 * escrito para ela"*.
 */
export const TIPO_DO_CONJUNTO_DE_ALTERACOES = 'customize_changeset';

/**
 * `_customize_restore_dismissed` — o metadado que **descarta sem apagar**.
 *
 * Gravado por `dismiss_user_auto_draft_changesets()`
 * (`class-wp-customize-manager.php:1087`) e consultado por
 * `get_changeset_posts()` com `'compare' => 'NOT EXISTS'` (`:1059`). RF-03 da
 * unidade `customize/changeset-do-customizer` o nomeia: *"Changeset descartado
 * pelo usuario **nao e apagado**: recebe um metadado e e excluido das consultas
 * por uma condicao de inexistencia desse metadado"*.
 *
 * ⚠️ **A chave esta aqui; a escrita dela nao.** `update_post_meta()` e caminho
 * de `BC-01` e chega por ligacao tardia (AD-10), como o resto do que esta area
 * faz com `posts`. Quem listar os conjuntos do ator — **T003** (US-1) — e quem
 * declara a ligacao.
 */
export const CHAVE_DO_DESCARTE_DO_CONJUNTO = '_customize_restore_dismissed';

/**
 * `stylesheet` — a opcao com o tema ativo, que e o que **CA-8.3** chama de
 * *"configuracao do site"*.
 *
 * Lida em `get_theme_mods()` (`wp-includes/theme.php:1027`), em
 * `set_theme_mod()` (`:1123`), em `remove_theme_mod()` (`:1152`) e em
 * `remove_theme_mods()` (`:1163`); escrita por `switch_theme()` (`:803`). E o
 * valor que entra **dentro** do nome da opcao de modificacoes — ver
 * {@link opcaoDeModificacoesDoTema}.
 */
export const OPCAO_DA_FOLHA_DE_ESTILO = 'stylesheet';

/**
 * `template` — a opcao com o tema **pai**, que e o mesmo nome quando o tema nao
 * e filho.
 *
 * Escrita por `switch_theme()` em `wp-includes/theme.php:802`, uma linha antes
 * da folha de estilo. As duas sao gravadas em sequencia e **sem transacao**: o
 * legado mede zero `START TRANSACTION` em 1.467 arquivos (BR-MIGRAR-104), e
 * interrompida entre as duas a instalacao fica com tema pai novo e folha de
 * estilo velha. Isso e o legado, e `portas/porta-de-dados.ts` registra por que
 * envolver a troca numa transacao desfaria o estado de que **US-9** depende.
 */
export const OPCAO_DO_MODELO = 'template';

/**
 * `current_theme` — o **Nome** do tema ativo, nao o diretorio dele.
 *
 * Escrita por `switch_theme()` com `$new_theme->get( 'Name' )`
 * (`wp-includes/theme.php:815`) e lida nos dois lugares em que o legado procura
 * a opcao de modificacoes antiga (`:1031` e `:1166`). ⚠️ E a unica das cinco
 * cujo valor nao e um diretorio: o nome vem do cabecalho de `style.css` do
 * tema, que e dado do tema e nao do nucleo.
 */
export const OPCAO_DO_NOME_DO_TEMA = 'current_theme';

/**
 * `template_root` e `stylesheet_root` — as raizes, gravadas **so** quando ha
 * mais de um diretorio de temas registrado, e **apagadas** quando ha um
 * (`wp-includes/theme.php:805`-`:812`).
 *
 * O par e um `if` com `delete_option()` no `else`, nao um valor opcional: a
 * instalacao normal, com um diretorio so, **apaga as duas opcoes a cada troca
 * de tema**. Apagar opcao que nao existe nao emite `DELETE` nenhum — ver
 * `opcao.ts`.
 */
export const OPCAO_DA_RAIZ_DO_MODELO = 'template_root';

/** Par de {@link OPCAO_DA_RAIZ_DO_MODELO} (`wp-includes/theme.php:807`). */
export const OPCAO_DA_RAIZ_DA_FOLHA_DE_ESTILO = 'stylesheet_root';

/**
 * `theme_switched` — a folha de estilo do tema que **saiu**
 * (`wp-includes/theme.php:840`).
 *
 * E o sinal de que a proxima requisicao tem trabalho de troca a terminar, e e
 * reescrita para `false` quando esse trabalho termina (`:3519`). Quem o le e o
 * remapeamento de componentes — **T019** (US-9) —, nao esta tarefa.
 */
export const OPCAO_DO_TEMA_ANTERIOR = 'theme_switched';

/**
 * `theme_switch_menu_locations` — as posicoes de menu do tema que saiu, copiadas
 * da modificacao de tema para uma opcao **com carga automatica ligada**
 * (`wp-includes/theme.php:786`: `update_option( ..., $nav_menu_locations, true )`).
 *
 * E a unica das escritas de `switch_theme()` que pede carga automatica
 * explicitamente, e e por isso que o terceiro argumento de
 * {@link RepositorioDeOpcoes.gravar} existe. Serve **CA-5.4** — *"a associacao
 * e configuracao do site"* — do outro lado da troca.
 */
export const OPCAO_DAS_POSICOES_DE_MENU_NA_TROCA = 'theme_switch_menu_locations';

/**
 * `theme_switched_via_customizer` — marca que a troca veio da personalizacao
 * (`class-wp-customize-manager.php:2914`).
 *
 * E escrita **entre** `switch_theme()` e a gravacao do conjunto, dentro de
 * `save_changeset_post()`, e e um dos lugares em que o ciclo medido
 * `personalizacao ↔ componentes de area` aparece no banco. A decisao de
 * escreve-la e de **T005** (US-2); o nome e daqui.
 */
export const OPCAO_DE_TROCA_PELA_PERSONALIZACAO = 'theme_switched_via_customizer';

/**
 * `theme_mods_` — o prefixo da opcao que guarda **a configuracao do tema**, com
 * a folha de estilo dentro do nome (`wp-includes/theme.php:1028`).
 *
 * E a metade de T002 que a linha de `tasks.md` nomeia: *"a configuracao
 * declarada pelo tema e lida como dado, pela porta de dados, com a mesma forma
 * do legado"*. UC-32 e quem diz qual e a forma — *"a configuracao do tema
 * anterior permanece **nas opcoes**, nao apagada"* —, e e dessa frase que
 * **CA-9.2** e **CA-10.3** saem.
 */
export const PREFIXO_DA_OPCAO_DE_MODIFICACOES = 'theme_mods_';

/**
 * `theme_mods_{folha-de-estilo}` — a chave montada a partir de dado.
 *
 * `portas/porta-de-dados.ts` ja havia registrado o caso em T001: *"poe o
 * identificador do tema **dentro** do nome da opcao, logo a chave e montada a
 * partir de dado e nao e constante"*. A consequencia e a invariante do produto:
 * dois temas nunca colidem, e trocar de tema **nao apaga** a configuracao de
 * nenhum dos dois.
 */
export function opcaoDeModificacoesDoTema(folhaDeEstilo: string): string {
  return `${PREFIXO_DA_OPCAO_DE_MODIFICACOES}${folhaDeEstilo}`;
}

/**
 * `mods_` — a localizacao **antiga** da mesma configuracao, por **Nome** de tema
 * (`wp-includes/theme.php:1036`, com o comentario `// Deprecated location.`).
 *
 * ⚠️ **Ela nao e codigo morto: e lida em dois caminhos e apagada em dois.**
 * `get_theme_mods()` recorre a ela quando a opcao nova nao existe (`:1036`),
 * `remove_theme_mods()` apaga as duas (`:1163` e `:1171`) e `switch_theme()`
 * semeia a opcao nova com o valor dela (`:820`). O **P8** e a resposta 14 poem
 * isso em contrato — *"o descarte vale como nao mudar, nunca como nao portar"*
 * —, e numa instalacao nova (resposta 2: *"nada vem do sistema velho"*) a opcao
 * simplesmente nao existe, o que e um estado, nao uma ausencia de codigo.
 */
export const PREFIXO_DA_OPCAO_DE_MODIFICACOES_ANTIGA = 'mods_';

/** `mods_{Nome do tema}` (`wp-includes/theme.php:1036` e `:1171`). */
export function opcaoDeModificacoesAntiga(nomeDoTema: string): string {
  return `${PREFIXO_DA_OPCAO_DE_MODIFICACOES_ANTIGA}${nomeDoTema}`;
}

/**
 * `nav_menu_locations` — a modificacao de tema que liga menu a posicao
 * declarada pelo tema (`wp-includes/nav-menu.php:162`-`:163`,
 * `wp-includes/theme.php:785`).
 *
 * E **chave dentro** do valor de {@link opcaoDeModificacoesDoTema}, nao opcao
 * propria, e e isso que faz CA-5.4 ser verdade sem tabela nova. Quem a le e
 * escreve e **T011** (US-5); o nome e daqui porque `switch_theme()` tambem a
 * le, e a troca de tema e outra tarefa (**T017**).
 */
export const MODIFICACAO_DE_POSICOES_DE_MENU = 'nav_menu_locations';

/**
 * `sidebars_widgets` — a modificacao de tema que guarda **o mapa do tema que
 * saiu**, com um instante junto (`wp-includes/theme.php:775`-`:782`:
 * `array( 'time' => time(), 'data' => $_sidebars_widgets )`).
 *
 * 🔴 **Nao confundir com a opcao de mesmo nome.** A **opcao**
 * `sidebars_widgets` e o mapa **corrente** (`wp-includes/widgets.php:1094`) e e
 * `AGG-AreaDeWidget`, de **T015**; a **modificacao de tema** de mesmo nome e a
 * copia do mapa anterior, lida por `retrieve_widgets()`
 * (`wp-includes/widgets.php:1327`) e removida por `switch_theme()` quando a
 * troca vem da personalizacao (`wp-includes/theme.php:831`). E o risco 5 de
 * `plan.md`: *"e a parte que mais quebra em porte, porque so aparece na segunda
 * troca de tema"*.
 */
export const MODIFICACAO_DE_COMPONENTES_POR_AREA = 'sidebars_widgets';

/**
 * `wp_classic_sidebars` — as areas registradas, guardadas como modificacao
 * **so** quando o tema novo e tema de blocos
 * (`wp-includes/theme.php:836`-`:837`).
 *
 * E guarda para um caminho que esta feature nao tem ainda: quem le e o lado de
 * blocos. Esta nomeada porque `switch_theme()` a escreve, e omiti-la faria a
 * troca de tema emitir uma escrita a menos do que o legado emite.
 */
export const MODIFICACAO_DE_AREAS_CLASSICAS = 'wp_classic_sidebars';
