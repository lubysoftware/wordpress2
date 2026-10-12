/**
 * `SM-CHANGESET` — a maquina de estado do conjunto de alteracoes, que e **propria
 * e nao tem intersecao com a do conteudo editorial**.
 *
 * Primeira metade da entrega de **T002** da feature
 * `009-apresentacao-e-personalizacao`: *"o conjunto de alteracoes existe como
 * tipo de conteudo proprio"*. Este arquivo e o **vocabulario e as transicoes**;
 * `tipo-do-conjunto.ts` e o registro do tipo e `conjunto-de-alteracoes.ts` e a
 * linha.
 *
 * `BR-MIGRAR-101` (`SM-CHANGESET`): *"O changeset do Customizer e um post com
 * regras proprias de ciclo de vida, separado do conteudo que ele altera: a
 * personalizacao em andamento e dado persistido antes de ser aplicada"*. E
 * `BR-MIGRAR-100` (`SM-ALL`) exige que as nove maquinas *"migrem INTEIRAS, COM
 * OS GATILHOS DE CADA TRANSICAO"*.
 *
 * ## Por que o vocabulario inteiro entra em T002, e nao na tarefa de cada historia
 *
 * Porque e **ele** que o cenario de paridade compara, e ele e indivisivel.
 * `PT-019`, cenario *"O changeset do personalizador e conteudo com ciclo de vida
 * proprio"* (`@paridade @critico @invariante`):
 *
 * > *Entao as duas o gravam na mesma tabela do conteudo editorial · E as duas
 * > usam **um conjunto de estados proprio, diferente do editorial** · Quando uma
 * > transicao valida no conteudo editorial e tentada no changeset · Entao as duas
 * > a recusam, ou as duas a aceitam, da mesma forma · E **nenhuma das duas aplica
 * > a maquina editorial ao changeset***
 *
 * O `README.md` deste modulo ja registrou, em T001, que *"a metade de PT-019 que
 * depende de T001 e nenhuma: o esqueleto nao tem estado a transicionar. Ela
 * comeca a ser conferivel em T002, quando o conjunto de alteracoes passa a
 * existir como tipo de conteudo"*. E este arquivo.
 *
 * ## O que esta aqui e o que NAO esta
 *
 * Esta: os cinco estados, o subconjunto aceito **na escrita**, o destino depois
 * de aplicado e o grafo de transicoes de `state-machines.md` §5.
 *
 * Nao esta, e cada ausencia tem tarefa:
 *
 * | o que | de quem e | por que nao e forma |
 * |---|---|---|
 * | recusar o estado pedido fora dos quatro | **T003** (CA-1.6) | e decisao sobre entrada do cliente, com erro nomeado (`class-wp-customize-manager.php:2479`-`:2481`) |
 * | verificar **em separado** a capacidade de publicar | **T005** (CA-2.1) | e autorizacao, e `plan.md` a chama de *"o contrato central da feature"* |
 * | reescrever `publish` com data futura para `future` | **T009** (CA-4.1) | e regra de agendamento (`:2706`), e depende do relogio |
 * | relatar o estado gravado | **T007** (US-3) | 🔴 CA-3.3 **contradiz** o legado, e o conflito esta aberto — ver `../README.md` § *O que ninguem decidiu*, item 1 |
 * | executar a ida para a lixeira | **T005** e **T007** | o comando esta em `conjunto-de-alteracoes.ts`; **quando** emiti-lo e regra |
 *
 * ## ⚠️ Nenhum prazo nasce aqui
 *
 * O conjunto nao aplicado e coletado pela varredura de rascunho automatico do
 * **conteudo** — `wp_delete_auto_drafts()`, cujos **7 dias** a constituicao lista
 * entre os numeros do produto e que moram na feature `005` (T013), nao aqui. O
 * cenario `@invariante` de `PT-019` cobra exatamente isso: *"o changeset
 * abandonado segue a politica de retencao do legado, nem mais nem menos... e
 * nenhuma das duas acrescenta prazo que o legado nao tem"*. O **P6** e a tabela
 * *Nao negociavel* poem *"introduzir limite de taxa, prazo de retencao ou
 * qualquer numero que o legado nao tem"* fora do alcance do agente, e por isso
 * **nao existe numero neste arquivo**.
 */

/**
 * `auto-draft` — o conjunto recem-criado, que o legado cria **para o ator sem o
 * ator pedir** (`state-machines.md` §5;
 * `class-wp-customize-manager.php:2931`).
 *
 * 🔴 **Nao e pedivel pelo cliente**, e isso e **CA-1.6**: *"o estado de rascunho
 * automatico nao pode ser pedido por quem chama a API"*. A guarda esta na lista
 * de {@link ESTADOS_ACEITOS_NA_ESCRITA}, que simplesmente **nao o contem** — e e
 * assim que o legado o nega: nao por ramo proprio, mas por ausencia na lista
 * (`:2479`). UC-29 diz a mesma coisa na sequencia: *"cria o conjunto de
 * alteracoes como rascunho automatico | o cliente **nao pode** pedir esse
 * status"*.
 *
 * E tambem o estado com que o **anexo enviado dentro da personalizacao** nasce,
 * *"para ser coletado se o conjunto for abandonado"* (CA-1.5, UC-29) — o unico
 * uso de rascunho automatico em anexo no sistema, que e de `BC-04` e nao daqui.
 */
export const ESTADO_DE_RASCUNHO_AUTOMATICO = 'auto-draft';

/** `draft` — salvo como rascunho, retomavel (CA-1.3). */
export const ESTADO_GUARDADO = 'draft';

/** `pending` — aguardando quem possa aplicar (CA-2.2). */
export const ESTADO_AGUARDANDO_REVISAO = 'pending';

/** `future` — agendado para uma data futura (CA-4.1). */
export const ESTADO_AGENDADO = 'future';

/** `publish` — aplicado ao site (CA-3.2). */
export const ESTADO_APLICADO = 'publish';

/**
 * `trash` — onde o conjunto **aplicado** termina.
 *
 * 🔴 E a frase que UC-29 poe nas pos-condicoes: *"o conjunto de alteracoes
 * aplicado esta na lixeira, nao publicado · a resposta ao ator diz 'publicado' —
 * e nao e o que esta gravado"*. O **P1** manda reproduzir, e **T002 nao resolve
 * o conflito com CA-3.3**: ele esta registrado em `../README.md`.
 *
 * ⚠️ **A ida para a lixeira e condicional, e a condicao e o proprio registro do
 * tipo.** `_wp_customize_publish_changeset()` so a executa quando as revisoes
 * estao desligadas para aquele registro — `if ( ! wp_revisions_enabled(
 * $changeset_post ) )` (`wp-includes/theme.php:3703`) —, e
 * `customize_changeset` declara `supports => array( 'title', 'author' )`
 * (`wp-includes/post.php:244`), **sem** `revisions`. Logo, na instalacao de
 * fabrica, a condicao e verdadeira e o conjunto aplicado vai para a lixeira. O
 * comentario do legado explica por que: *"When a changeset post is published,
 * however, it would no longer get cleaned out. This is a problem when the
 * changeset posts are never displayed anywhere, since they would just be
 * endlessly piling up"*.
 */
export const ESTADO_NA_LIXEIRA = 'trash';

/**
 * Os cinco estados da maquina, na ordem de `state-machines.md` §5.
 *
 * `trash` **nao** esta aqui, e a ausencia e a do legado: a tabela de estados
 * aceitos da §5 lista cinco, e a lixeira aparece so como destino no diagrama
 * (`publish --> trash : aplicado, changeset descartado`). E tambem o que a
 * coluna de estado do legado permite — `varchar(20)` sem `ENUM` e sem `CHECK`
 * (`DB-ENUM`, BR-MIGRAR-075) —, logo este conjunto descreve a maquina, nao o
 * dominio da coluna.
 */
export const ESTADOS_DO_CONJUNTO = [
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  ESTADO_GUARDADO,
  ESTADO_AGUARDANDO_REVISAO,
  ESTADO_AGENDADO,
  ESTADO_APLICADO,
] as const;

export type EstadoDoConjunto = (typeof ESTADOS_DO_CONJUNTO)[number];

/**
 * Os **quatro** estados que a escrita aceita, na ordem literal do legado
 * (`class-wp-customize-manager.php:2479`:
 * `array( 'draft', 'pending', 'publish', 'future' )`).
 *
 * `state-machines.md` §5 registra a regra em uma linha: *"A escrita so aceita
 * quatro status; `auto-draft` **nao** pode ser pedido pelo cliente"*. A ordem e
 * transcrita porque a lista e transcrita; ela nao e significativa no
 * `in_array()`. O que e significativo e o conjunto, e o que **falta** nele.
 *
 * ⚠️ No legado a lista e a **segunda** metade de um `&&`: antes dela vem
 * `! get_post_status_object( $changeset_status )`, isto e, o estado tem de estar
 * **registrado** no sistema de estados de `BC-01`. As duas condicoes recusam com
 * o mesmo erro (`bad_customize_changeset_status`, 400), e quem reproduzir so a
 * lista aceita o mesmo conjunto: `draft`, `pending`, `publish` e `future` sao
 * todos estados registrados do nucleo. A diferenca aparece se uma extensao
 * remover um estado registrado — caso em que o legado recusa um dos quatro. Quem
 * pegar **T003** declara a travessia para o registro de estados de BC-01 por
 * ligacao tardia (AD-10), como esta area faz com todo o resto de `posts`.
 */
export const ESTADOS_ACEITOS_NA_ESCRITA = [
  ESTADO_GUARDADO,
  ESTADO_AGUARDANDO_REVISAO,
  ESTADO_APLICADO,
  ESTADO_AGENDADO,
] as const;

export type EstadoAceitoNaEscrita = (typeof ESTADOS_ACEITOS_NA_ESCRITA)[number];

/**
 * As transicoes do diagrama de `state-machines.md` §5, uma a uma.
 *
 * E este conjunto que o cenario `@paridade @critico @invariante` de `PT-019`
 * compara — *"o conjunto de transicoes permitidas e identico nas duas"* — e e
 * por isso que ele e **dado declarado** e nao sequencia de `if` espalhada pelas
 * operacoes. O gatilho de cada uma e o nome que o diagrama lhe da, e e ele que
 * `BR-MIGRAR-100` manda preservar.
 *
 * ⚠️ **`publish → trash` esta na lista e nao e transicao pedida por ator**: ela e
 * consequencia da aplicacao (ver {@link ESTADO_NA_LIXEIRA}), e o legado a executa
 * com uma escrita direta na tabela — nao pelo caminho de gravacao de `BC-01`
 * (`class-wp-customize-manager.php:3105`).
 */
export const TRANSICOES_DO_CONJUNTO = [
  { de: null, para: ESTADO_DE_RASCUNHO_AUTOMATICO, gatilho: 'abrir a personalizacao' },
  { de: ESTADO_DE_RASCUNHO_AUTOMATICO, para: ESTADO_GUARDADO, gatilho: 'salvar rascunho' },
  { de: ESTADO_DE_RASCUNHO_AUTOMATICO, para: ESTADO_APLICADO, gatilho: 'publicar' },
  { de: ESTADO_GUARDADO, para: ESTADO_AGUARDANDO_REVISAO, gatilho: 'enviar para revisao' },
  { de: ESTADO_AGUARDANDO_REVISAO, para: ESTADO_GUARDADO, gatilho: 'devolver' },
  { de: ESTADO_GUARDADO, para: ESTADO_AGENDADO, gatilho: 'agendar' },
  { de: ESTADO_AGUARDANDO_REVISAO, para: ESTADO_APLICADO, gatilho: 'aprovar' },
  { de: ESTADO_AGENDADO, para: ESTADO_APLICADO, gatilho: 'a data chegou' },
  { de: ESTADO_APLICADO, para: ESTADO_NA_LIXEIRA, gatilho: 'aplicado, conjunto descartado' },
] as const;

/** Uma transicao declarada em {@link TRANSICOES_DO_CONJUNTO}. */
export interface TransicaoDoConjunto {
  /** O estado de partida, ou `null` para a criacao. */
  readonly de: string | null;
  readonly para: string;
  /** O nome que `state-machines.md` §5 da ao gatilho. */
  readonly gatilho: string;
}

/**
 * Se a transicao esta no grafo declarado.
 *
 * **Nao decide nada sobre permissao, data nem estado pedido pelo cliente**: as
 * tres sao de outras tarefas (ver a tabela do cabecalho). Esta funcao responde a
 * pergunta que `PT-019` faz — *"uma transicao valida no conteudo editorial e
 * tentada no changeset: as duas a recusam, ou as duas a aceitam"* —, e o caso
 * mais claro dela e `publish → draft`, que o conteudo editorial permite
 * (despublicar) e que esta maquina **nao tem**.
 */
export function transicaoPermitida(de: string | null, para: string): boolean {
  return TRANSICOES_DO_CONJUNTO.some(
    (transicao) => transicao.de === de && transicao.para === para,
  );
}

/** Se o estado e um dos quatro que a escrita aceita. */
export function estadoAceitoNaEscrita(
  estado: string,
): estado is EstadoAceitoNaEscrita {
  return (ESTADOS_ACEITOS_NA_ESCRITA as readonly string[]).includes(estado);
}
