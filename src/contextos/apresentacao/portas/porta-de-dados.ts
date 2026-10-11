/**
 * Porta de dados do modulo de apresentacao (BC-07).
 *
 * Entrega de **T001** da feature `009-apresentacao-e-personalizacao`, que a pede
 * pelo nome: *"com as portas de dados e de cliente externo declaradas"*. E a
 * unica porta deste modulo para o banco: nenhuma regra desta feature fala com o
 * driver, e nenhuma consulta e montada por concatenacao (`plan.md` secao Stack,
 * slot `persistencia`; REQ-164).
 *
 * ## O que as tres areas do ciclo leem e gravam — e sao TRES mecanismos, nao um
 *
 * `plan.md` secao *Modelo de dados* chama isso de *"a modelagem mais surpreendente
 * do produto"*, e UC-30 repete: *"tres mecanismos diferentes para uma coisa que
 * parece uma lista"*. Esta porta so declara a forma; quem monta os nomes e **T002**.
 *
 * | o que | onde mora no legado | ancora |
 * |---|---|---|
 * | conjunto de alteracoes (changeset) | `posts` com `post_type='customize_changeset'` | `wp-includes/post.php:221` |
 * | valores de aparencia aplicados | opcao `theme_mods_{stylesheet}` | `wp-includes/theme.php:1028`, `:1125` |
 * | menu de navegacao | **termo** de uma taxonomia (`nav_menu`) | `wp-includes/nav-menu.php:418` |
 * | item de menu | `posts` de tipo `nav_menu_item`, com a **hierarquia em metadado** | `wp-includes/nav-menu.php:589` |
 * | posicao de menu declarada pelo tema | theme mod `nav_menu_locations`, dentro de `theme_mods_{stylesheet}` | `wp-includes/nav-menu.php:162`-`:163` |
 * | componentes por area | opcao `sidebars_widgets` | `wp-includes/widgets.php:1094`, `:1104` |
 * | mapa do tema anterior | theme mod `sidebars_widgets` do tema que saiu | `wp-includes/widgets.php:1499` |
 *
 * 🔴 **A hierarquia do item de menu vive em METADADO, nao na coluna de pai do
 * conteudo** (`_menu_item_menu_item_parent`, `wp-includes/nav-menu.php:589`). E o
 * risco 3 de `plan.md`: *"um porte que 'corrija' isso muda o que extensao de menu
 * le"*. Quem implementar T011 le essa linha antes de escolher a coluna.
 *
 * ## Cinco ausencias desta interface, cada uma lida do sistema analisado
 *
 * 1. **Nao ha tabela nova a declarar, e isso e a regra.** Componente e area
 *    *"vivem em opcoes, nao em tabela"* (`domain.md` §1.3, UC-31), o changeset e
 *    um `post` e o menu e termo mais `posts`. `target_domain_model.md` registra
 *    `AGG-AreaDeWidget` como **dividido** de `options` e `AGG-MenuDeNavegacao`
 *    como **fundido** de duas tabelas de dois contextos. Modelar uma tabela de
 *    menu ou de widget e a "correcao" que o **P5** e o risco do ERD existem para
 *    impedir.
 * 2. **Nao ha transacao, e nesta feature isso tem consequencia observavel.**
 *    BR-MIGRAR-104 mede zero `START TRANSACTION` e zero `COMMIT` em 1.467
 *    arquivos. `switch_theme()` grava opcao por opcao em sequencia
 *    (`wp-includes/theme.php:777` a `:861`) e, interrompida no meio, deixa
 *    **parte** gravada — e e justamente de guardar o mapa do tema anterior que
 *    US-9 depende (risco 5 de `plan.md`: *"so aparece na segunda troca de tema"*).
 *    Envolver a troca numa transacao desfaria o estado que CA-9.2 descreve.
 * 3. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas tem 59
 *    indices e zero chave estrangeira (**P5**). Aqui a consequencia e direta e e
 *    uma historia inteira: *"item que aponta para conteudo apagado permanece no
 *    menu e aponta para o nada; nenhuma rotina limpa itens orfaos"* (US-6, UC-30).
 *    Declarar a cascata "mais correta" apagaria o item e tornaria CA-6.1 e CA-6.2
 *    inverificaveis.
 * 4. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`: `contextos/` e `plataforma/` sao sincronos. Promessa aqui
 *    contaminaria o chamador e mudaria a ordem de emissao, que AD-03 poe no
 *    contrato observavel — e nesta feature a emissao e HTML de tema.
 * 5. **Nao ha `prefixoBaseDeTabela`.** O legado tem **dois** prefixos, e tudo que
 *    as tres areas de T001 tocam esta no **do site**: `target_data_model.md` poe
 *    `options`, `posts`, `postmeta`, `terms`, `term_taxonomy` e
 *    `term_relationships` entre as tabelas de *"ESCOPO POR SITE"*. ⚠️ Ha **um**
 *    uso de escopo de rede nesta feature, e ele nao e de T001: o catalogo de
 *    fontes guarda a resposta externa num *transient de SITE*
 *    (`wp-includes/fonts/class-wp-font-collection.php:179` e `:205`), que em rede
 *    e `sitemeta`. Quem pegar **T027** (US-13) acrescenta o prefixo base **ali**;
 *    declara-lo agora seria superficie que este modulo nao usa.
 *
 * ## Duas notas para T002, que e quem da forma a isto
 *
 * - **O marcador de carga automatica da opcao e efeito no banco.** Ao trocar de
 *   tema, o legado liga a carga automatica do `theme_mods_` do tema novo e a
 *   desliga do antigo, numa chamada so (`wp-includes/theme.php:857`-`:861`). Isso
 *   e a **area 3** do critario de paridade (*efeito de escrita*), nao detalhe de
 *   desempenho. T001 nao declara o campo porque nao grava opcao nenhuma; T002
 *   precisa dele.
 * - **A apresentacao e lida em TODA requisicao.** UC-31: *"widget, area, tema
 *   ativo e menu sao todos opcoes... a aparencia do site faz parte do que e lido
 *   antes de qualquer consulta de conteudo"*. O cache de objeto que absorve isso e
 *   porta de AD-08 e **nao** foi pedido por T001; ele entra quando alguma tarefa
 *   desta feature precisar dele, e `plan.md` ja registra o slot (`cache`,
 *   recomendacao `em-processo`, porque o default de fabrica nao persiste nada
 *   entre requisicoes).
 *
 * **Esta interface e deliberadamente a mesma forma das portas de dados de
 * `conteudo`, `classificacao`, `leitura-publica` e `retencao-e-descarte`, e a
 * duplicacao e a regra, nao descuido.** AD-10 proibe contexto importar contexto no
 * topo do modulo, e a regra de dependencia 4 poe a porta no modulo que a
 * **consome**, nao no adaptador que a implementa. Um adaptador so satisfaz todas
 * por forma. A camada de dados de verdade e trabalho da feature `015`
 * (`015-plataforma-transversal`, T007); enquanto ela nao existe, cada contexto
 * declara a sua.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e essa
 * separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia. Nesta feature isso
 * tem um caso concreto desde a primeira tarefa: `theme_mods_{stylesheet}` poe o
 * identificador do tema **dentro do nome da opcao**
 * (`wp-includes/theme.php:1028`), logo a chave e montada a partir de dado e nao e
 * constante — e o valor dela e um vetor serializado pelo formato nativo do PHP,
 * nao JSON (`plan.md`, slot `serializacao-de-valor-persistido`).
 */
export interface Consulta {
  /** SQL com marcadores de parametro, na mesma forma que o legado envia. */
  readonly texto: string;
  /** Valores dos marcadores, na ordem em que aparecem no texto. */
  readonly parametros: readonly ValorDeParametro[];
}

/** Uma linha devolvida por leitura, com as colunas como o banco as nomeia. */
export interface LinhaDeResultado {
  readonly [coluna: string]: ValorDeColuna | undefined;
}

/** O que uma escrita informa de volta. */
export interface ResultadoDeEscrita {
  readonly linhasAfetadas: number;
  /** Chave gerada pelo banco, quando a escrita gerou uma. */
  readonly idGerado: number | null;
}

export interface PortaDeDados {
  /**
   * Prefixo das tabelas deste site (o `$wpdb->prefix` do legado).
   *
   * Esta na porta porque e fato da borda, nao regra: numa rede o identificador do
   * site entra **dentro** do nome da tabela (`{p}7_options`,
   * `target_data_model.md`), e nenhuma consulta deste modulo se monta sem ele. E
   * CA-8.5 depende de a rede ser visivel: *"em instalacao em rede, a troca e poder
   * de rede"*.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
