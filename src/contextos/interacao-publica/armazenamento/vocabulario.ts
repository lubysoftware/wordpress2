/**
 * O vocabulario de **estado** e de **tipo** do comentario, e os dois zeros que
 * sao vinculo ausente.
 *
 * Entrega de T002 de `007-interacao-publica-e-moderacao`: *"a estrutura de
 * comentario existe com o vocabulario de estado e de tipo do legado, a
 * auto-referencia que encadeia respostas e o vinculo opcional com conta"*. Aqui
 * ha **vocabulario, nao regra**: nenhuma transicao, nenhuma decisao de cascata,
 * nenhuma contagem e nenhum default resolvido. A cascata que escolhe o estado
 * inicial e T003 e T010, a transicao e T022 (US-10), a lixeira e T024 (US-11) e
 * o contador e T026 (US-12).
 *
 * ── A COLUNA QUE E BOOLEANO E MAQUINA DE ESTADOS AO MESMO TEMPO ────────────
 *
 * `state-machines.md` §2 abre com a frase que explica o nome irregular desta
 * coluna: *"uma coluna que e booleano e maquina de estados ao mesmo tempo:
 * `'1'` e `'0'` convivem com tres estados nomeados"*. E a secao *Modelo de
 * dados* do `plan.md` diz o que o alvo faz com isso: *"o modelo novo precisa
 * dos cinco valores, porque o ultimo e o que permite restaurar o conteudo e
 * devolver cada comentario ao estado anterior"*.
 *
 * Por isso o campo da linha se chama `estado`, e nao `aprovado` como a tabela de
 * entidades de `target_domain_model.md` o nomeia: com `'spam'` dentro,
 * `aprovado` mente sobre o proprio valor. A **coluna** continua
 * `comment_approved`, byte a byte, e o mapeamento esta na tabela de
 * `comentario.ts`. E a mesma escolha que `../../conteudo/estado-editorial.ts`
 * fez em BC-01 ao chamar `post_status` de `estado`.
 *
 * ── O QUE "FECHADO" SIGNIFICA AQUI, E O QUE NAO PODE SIGNIFICAR ────────────
 *
 * Os dois tipos abaixo sao fechados sobre o **vocabulario de fabrica** — o que
 * o nucleo escreve e le. Fechado **nao** e validacao da coluna, e as razoes sao
 * as mesmas tres de BC-01, medidas:
 *
 * 1. `comment_approved` e `comment_type` sao `varchar(20)` **sem `ENUM` e sem
 *    `CHECK`** (`target_data_model.md`, `DB-ENUM` / BR-MIGRAR-075, que nomeia
 *    as duas colunas: *"as 9 maquinas de estado sao validadas na aplicacao, e
 *    isso e o que o alvo reproduz"*).
 * 2. O tipo e aberto por escrito: `class-wp-comment.php:177` diz *"Custom
 *    comment types are possible"*, e o filtro `get_comment_type`
 *    (`wp-includes/comment-template.php:1175`) deixa um terceiro reescrever o
 *    valor devolvido. Ponto de extensao e contrato publico (P2).
 * 3. O legado **tolera** o que nao conhece em vez de recusar: um comentario
 *    gravado antes da versao 5.5 pode ter `comment_type` **vazio**, e
 *    `get_comment_type()` normaliza isso **na leitura** em vez de consertar o
 *    dado (`comment-template.php:1161`). Ver {@link tipoNormalizado}.
 *
 * Logo este arquivo **nao exporta validador nem guarda de tipo**, e nenhum
 * metodo de `comentario.ts` recusa linha por estado ou tipo desconhecido.
 */

/**
 * Um dos cinco valores que o nucleo escreve em `comment_approved`. **O valor e
 * a string do legado**, byte a byte, porque e ela que vai para a coluna e e
 * nela que a paridade e conferida (`state-machines.md` §2, *Estados*).
 */
export type EstadoDoComentario = '1' | '0' | 'spam' | 'trash' | 'post-trashed';

/**
 * Os cinco **na ordem em que `state-machines.md` §2 os tabela**: aprovado, na
 * fila, spam, lixeira, conteudo na lixeira.
 *
 * A ordem aqui e documental e nao e observavel — ao contrario da ordem da
 * cascata, que **e** a regra (T003) e por isso nao esta neste arquivo.
 */
export const ESTADOS_DO_COMENTARIO: readonly EstadoDoComentario[] =
  Object.freeze(['1', '0', 'spam', 'trash', 'post-trashed'] as const);

/** O estado aprovado e visivel. E tambem o default do DDL desta coluna. */
export const ESTADO_APROVADO = '1';
/** O estado na fila de moderacao. */
export const ESTADO_NA_FILA = '0';
/** O estado de spam. */
export const ESTADO_SPAM = 'spam';
/** O estado de lixeira do proprio comentario. */
export const ESTADO_NA_LIXEIRA = 'trash';
/**
 * O estado que o comentario recebe quando **o conteudo** foi para a lixeira.
 *
 * E o quinto valor, e e o que o `plan.md` chama de *"conteudo na lixeira"*. Ele
 * **nao e alcancavel pela interface**: `wp_set_comment_status()` aceita quatro
 * entradas e devolve `false` para qualquer outra (`wp-includes/comment.php:2814`
 * — ver {@link ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO}). Quem o grava e a cascata
 * de lixeira do conteudo, em lote
 * (`UPDATE {site}comments SET comment_approved = 'post-trashed' WHERE
 * comment_post_ID = ?`, `wp-includes/post.php:4302`), e a restauracao devolve
 * cada comentario agrupado por estado, com `post-trashed` inesperado virando
 * `'0'` e o comentario *"Confidence check. This shouldn't happen."*
 * (`wp-includes/post.php:4362` a `:4367`).
 *
 * ⚠️ **As duas consultas em lote nao estao neste armazenamento, e a ausencia e
 * deliberada.** Elas sao disparadas pela lixeira do **conteudo**, que e da
 * feature `005-retencao-e-descarte`, e o estado anterior de cada comentario e
 * gravado em `_wp_trash_meta_comments_status` do **post**, nao do comentario
 * (`wp-includes/post.php:4299`). Quem as escrever precisa de ligacao tardia
 * para BC-03 (AD-10), nao de um metodo nascido aqui sem chamador.
 */
export const ESTADO_CONTEUDO_NA_LIXEIRA = 'post-trashed';

/**
 * Os quatro estados que `wp_set_comment_status()` aceita, e portanto os unicos
 * alcancaveis pela interface de moderacao (`wp-includes/comment.php:2798` a
 * `:2816`).
 *
 * CA-10.2 e CA-10.3 vivem deste conjunto — *"so esses quatro estados sao
 * alcancaveis pela interface"* e *"estado pedido fora dos aceitos e recusado"* —
 * e a transicao em si e T022. O que esta aqui e o **conjunto**, nao a traducao
 * dos apelidos (`hold`, `approve`) nem o `false` de recusa: essas duas sao o
 * corpo da operacao de moderar.
 */
export const ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO: readonly EstadoDoComentario[] =
  Object.freeze([
    ESTADO_NA_FILA,
    ESTADO_APROVADO,
    ESTADO_SPAM,
    ESTADO_NA_LIXEIRA,
  ] as const);

/**
 * Um dos quatro tipos que o nucleo escreve em `comment_type`
 * (`wp-includes/class-wp-comment.php:174` a `:188`).
 *
 * `'note'` e o tipo mais atipico, e o `plan.md` o descreve: *"exige login, e
 * excluida da contagem, e autorizada pela capacidade de editar o conteudo e nao
 * pela de moderar, so aceita tipos de conteudo que declarem suporte, e apagar a
 * nota raiz arrasta as respostas"*. UC-18 e mais direto: *"a tabela de
 * comentarios ganhou um uso que nao e comentario... quem migrar modelando
 * 'comentario' como interacao publica perde esta funcionalidade inteira"*.
 */
export type TipoDeComentario = 'comment' | 'pingback' | 'trackback' | 'note';

/** Os quatro, na ordem em que `class-wp-comment.php:177` os lista. */
export const TIPOS_DE_COMENTARIO: readonly TipoDeComentario[] = Object.freeze([
  'comment',
  'pingback',
  'trackback',
  'note',
] as const);

/** Comentario humano. E tambem o default do DDL e o da aplicacao. */
export const TIPO_COMENTARIO = 'comment';
/** Notificacao de link **com** prova de origem (`C8`, ADR-0003). US-15. */
export const TIPO_PINGBACK = 'pingback';
/**
 * Notificacao de link **sem** prova de origem.
 *
 * 🔴 **REQ-081 descarta este protocolo e a resposta 14 contradiz o descarte**, e
 * o conflito esta registrado na secao *Fora de escopo* da `spec.md`, nao
 * resolvido. O valor esta aqui porque e vocabulario da coluna — uma interacao
 * ja gravada com ele precisa continuar legivel, que e o segundo item do *"como
 * conferir que ficou fora"* do proprio card: *"interacoes ja gravadas por esse
 * protocolo continuam legiveis, e sao identificaveis como de origem nao
 * verificada"*. Declarar o valor **nao** decide o conflito: nenhuma operacao
 * deste modulo o escreve, e T032 e quem encosta nele.
 */
export const TIPO_TRACKBACK = 'trackback';
/** Nota editorial interna. US-14, `C12`. */
export const TIPO_NOTA_EDITORIAL = 'note';

/**
 * O tipo como o legado o devolve na **leitura**: `''` vira `'comment'`.
 *
 * `get_comment_type()` (`wp-includes/comment-template.php:1161`) faz
 * exatamente isto, e o comentario do legado explica por que:
 * *"Comments created before 5.5.0 may store an empty string rather than
 * 'comment', so this cannot be relied upon to be non-empty"*. A normalizacao e
 * **na leitura e em memoria** — o dado gravado continua vazio, e nenhuma
 * escrita o conserta.
 *
 * Fica fora do tipo da linha de proposito, como `valorDeMetadado` em
 * `metadado.ts`: a linha carrega o byte que esta na coluna, e a interpretacao e
 * um passo a mais que quem le pede quando precisa. Os dois estados existem e os
 * dois importam, porque uma consulta por `comment_type = 'comment'` **nao**
 * encontra a linha vazia que esta funcao normalizaria.
 *
 * ⚠️ O filtro `get_comment_type` dispara **depois** desta normalizacao e pode
 * trocar o valor; ele nao e emitido aqui, porque nao ha barramento de ganchos
 * nesta arvore (REQ-162 em `do-not-rewrite.md`).
 */
export function tipoNormalizado(tipo: string): string {
  return tipo === '' ? TIPO_COMENTARIO : tipo;
}

/**
 * A sentinela de data: o valor de fabrica das duas colunas `datetime` desta
 * tabela, e de dez no esquema todo.
 *
 * ⚠️ Nao e "data ausente": `DB-SENT` (BR-MIGRAR-081) poe as dez colunas no
 * contrato porque a sentinela *"carrega significado de negocio"* e **nenhuma
 * restricao a distingue de valor legitimo**. Em `comments` ela e so o default do
 * DDL — nao ha, nesta tabela, o equivalente ao `date_floating` de `posts`, que
 * e quem a DEDUZ la. 🔴 O destino dela e `BR-HUMANA-003`, **pendente**; este
 * arquivo segue a premissa declarada por `target_data_model.md` (manter a
 * cadeia) e **nao decide nada por ninguem**.
 */
export const DATA_SENTINELA = '0000-00-00 00:00:00';

/**
 * `comment_parent = 0` — o comentario nao responde a nenhum outro.
 *
 * E **zero, nao `NULL`**, e isso e regra do esquema e nao gosto:
 * `target_data_model.md` § *Restricoes*, *Nulidade*, e literal — *"ausencia de
 * vinculo e escrita como `0`"* — e tira dali a consequencia que um porte
 * descobre tarde: *"um `LEFT JOIN ... WHERE pai IS NULL` **nao encontra orfao
 * nenhum** neste banco"*. A coluna e `bigint(20) unsigned NOT NULL default
 * '0'`, logo nao existe linha com pai nulo para encontrar.
 *
 * A auto-referencia tem **uma** semantica aqui, ao contrario de
 * `posts.post_parent`, que tem tres (pagina filha, anexo e versao): ela encadeia
 * a resposta. Mas a profundidade e **arbitraria no banco**
 * (`target_data_model.md` § *Relacoes*): o limite de 5 niveis de CA-7.2 e
 * verificacao de aplicacao, de T016, e nada no esquema o cobra.
 */
export const SEM_RESPOSTA = 0;

/**
 * `user_id = 0` — o comentario nao tem conta vinculada, e **isso nao e erro**.
 *
 * `target_data_model.md` § *Relacoes* marca esta como a unica relacao
 * **opcional** das 24, com duas notas no mesmo campo: *"`0` e anonimo
 * legitimo"* e *"orfao e estado normal"*. As duas sao comportamento a
 * reproduzir, e a segunda tem cenario de paridade proprio no `@invariante` de
 * `PT-001`: *"apagar a conta nao apaga comentario... o vinculo com a conta
 * apagada fica no mesmo estado nas duas"*. O motivo esta em
 * `erd-complete.md` §9 risco 2 e e deliberado: preservar o historico da
 * discussao.
 *
 * E por isso que **nenhum metodo deste armazenamento confere a existencia da
 * conta**, e por isso que uma chave estrangeira aqui mudaria o observavel — o
 * que cai na tabela *Nao negociavel* da constituicao (P5, e a resposta 2).
 */
export const SEM_CONTA = 0;

/** Se o comentario e de primeiro nivel: `comment_parent` em {@link SEM_RESPOSTA}. */
export function eDePrimeiroNivel(paiId: number): boolean {
  return paiId === SEM_RESPOSTA;
}

/**
 * Se o comentario e anonimo: `user_id` em {@link SEM_CONTA}.
 *
 * ⚠️ Anonimo **nao** quer dizer sem nome: `comment_author` e
 * `comment_author_email` ficam na propria linha e sao o par que `C7` usa para
 * reconhecer o autor ja aprovado. `data_migration_plan.md` chama isso de
 * *"campos de autor duplicados na propria linha"*, e o `plan.md` avisa que um
 * modelo com restricao obrigatoria mudaria o que acontece com eles.
 */
export function eAnonimo(contaId: number): boolean {
  return contaId === SEM_CONTA;
}
