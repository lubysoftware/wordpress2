/**
 * As duas tabelas desta feature, e as tres chaves de marcador que a lixeira
 * grava dentro delas.
 *
 * Entrega de **T002**: *"o estado anterior e o instante do descarte sao gravados
 * e lidos como metadado do registro, para conteudo e para comentario, pela porta
 * de dados"* (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * ## Nao ha tabela nova, e isso e decisao registrada
 *
 * A secao *Modelo de dados* de `plan.md` abre com a frase: *"Esta feature nao
 * acrescenta tabela: ela acrescenta **marcadores** em metadado e um prazo em
 * configuracao"*. Por isso este arquivo **nao** tem `esquema.ts` ao lado: o DDL
 * de `{p}postmeta` e da feature `002` (`armazenamento/esquema.ts` de BC-01) e o
 * de `{p}commentmeta` e de BC-03, e emitir DDL daqui criaria dois donos para a
 * mesma tabela.
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL de `target_data_model.md`,
 * logo as duas levam o prefixo **do site** — numa rede, `wp_7_postmeta` e
 * `wp_7_commentmeta`. O prefixo **base** nao esta na porta deste modulo de
 * proposito (ver `portas/porta-de-dados.ts`).
 *
 * ## O nome da tabela e DERIVADO, e e o legado que o deriva
 *
 * Nao e economia daqui escrever `${tipo}meta` em lugar das duas cadeias
 * literais: e o que `_get_meta_table()` faz, em uma linha —
 * `$table_name = $type . 'meta'` (`wp-includes/meta.php:1290`) — e e por isso
 * que a coluna do objeto tambem e derivada,
 * `sanitize_key( $meta_type . '_id' )` (`wp-includes/meta.php:59`).
 *
 * A derivacao tem uma consequencia que vale escrever: a coluna de `commentmeta`
 * e `comment_id` em **minuscula**, enquanto a chave primaria de `comments` e
 * `comment_ID`. As duas grafias convivem no legado porque uma vem do DDL e a
 * outra de `sanitize_key()`, que abaixa a caixa. `target_data_model.md:194`
 * confirma a coluna: `comment_id bigint(20) unsigned NOT NULL default '0'`.
 *
 * ## As tres chaves, e por que sao tres e nao duas
 *
 * `tasks.md` pede *"o estado anterior e o instante do descarte"*, que sao duas
 * chaves por registro. A terceira — `_wp_trash_meta_comments_status` — e o
 * mesmo marcador de **estado anterior**, so que *"para comentario"*: ele mora no
 * conteudo e guarda, agrupado, o estado de cada comentario (CA-2.2, *"guardado,
 * agrupado, junto do conteudo"*). E metadado do registro, gravado por
 * `add_post_meta()` como os outros dois (`wp-includes/post.php:4299`), e por
 * isso a forma dele e desta tarefa.
 *
 * O que **nao** e desta tarefa e a cascata que o preenche: ler os comentarios do
 * conteudo, grava-los em `post-trashed` e devolve-los em lote por estado e
 * **T005** (US-2).
 *
 * ## Nenhum nome de tabela e montado fora deste arquivo
 *
 * A nota 3 de `target_data_model.md` registra por que: *"o prefixo de tabela nao
 * e so configuracao de conexao: ele e dado"*. Numa instalacao de rede, um nome
 * montado no meio de uma consulta e a forma mais barata de apagar o conteudo de
 * um site ao coletar a lixeira de outro.
 */

import type { PortaDeDados } from '../portas/index.js';

/**
 * As duas familias de metadado que a lixeira toca, com o nome que o legado usa
 * como `$meta_type`.
 *
 * Sao cadeias do legado e nao traducao: elas entram na derivacao do nome da
 * tabela e no da coluna, e trocar `post` por `conteudo` trocaria o nome da
 * tabela consultada.
 */
export type TipoDeMetadado = 'post' | 'comment';

/** `post` — o metadado do conteudo, em `{site}postmeta`. */
export const METADADO_DE_CONTEUDO: TipoDeMetadado = 'post';

/** `comment` — o metadado do comentario, em `{site}commentmeta`. */
export const METADADO_DE_COMENTARIO: TipoDeMetadado = 'comment';

/**
 * `{site}postmeta` ou `{site}commentmeta`, derivada como `_get_meta_table()` a
 * deriva (`wp-includes/meta.php:1290`).
 */
export function tabelaDeMetadado(
  dados: PortaDeDados,
  tipo: TipoDeMetadado,
): string {
  return `${dados.prefixoDeTabela}${tipo}meta`;
}

/**
 * A coluna que liga a linha de metadado ao registro: `post_id` ou
 * `comment_id`.
 *
 * E `sanitize_key( $meta_type . '_id' )` (`wp-includes/meta.php:59`), e a caixa
 * baixa e o que faz `comment_id` ser diferente de `comments.comment_ID`.
 */
export function colunaDoObjeto(tipo: TipoDeMetadado): string {
  return `${tipo}_id`;
}

/**
 * A coluna que identifica a **linha** de metadado, e nao o registro.
 *
 * E `$id_column` de `delete_metadata()` e de `update_meta_cache()`:
 * `( 'user' === $meta_type ) ? 'umeta_id' : 'meta_id'`
 * (`wp-includes/meta.php:417` e `:1202`). Nenhuma das duas familias desta
 * feature e `user`, logo e sempre `meta_id` — e a excecao fica escrita aqui para
 * que ninguem a redescubra ao reaproveitar este arquivo.
 */
export const COLUNA_DA_LINHA_DE_METADADO = 'meta_id';

/**
 * `_wp_trash_meta_status` — o estado que o registro tinha antes do descarte.
 *
 * Gravado no descarte (`wp-includes/post.php:4128` para conteudo,
 * `wp-includes/comment.php:1691` para comentario) e **lido em quatro lugares**,
 * que e o que faz dele mais do que memoria: a restauracao o le para o ponto de
 * extensao (`wp-includes/post.php:4181`), o mapeamento de capacidade o le para
 * decidir a autorizacao sobre quem esta na lixeira
 * (`wp-includes/capabilities.php:154` e `:257`, e e o CA-3.5), o anexo o le no
 * **pai** para resolver a propria visibilidade (`wp-includes/post.php:1315`) e a
 * tela de moderacao o le para saber se o comentario estava aprovado
 * (`wp-admin/includes/class-wp-comments-list-table.php:924`).
 */
export const MARCADOR_DE_ESTADO_ANTERIOR = '_wp_trash_meta_status';

/**
 * `_wp_trash_meta_time` — o instante do descarte, em segundos.
 *
 * Gravado com `time()` (`wp-includes/post.php:4129`,
 * `wp-includes/comment.php:1692`) e **nunca lido por registro**: o unico leitor
 * do legado o compara **dentro do SQL**, com
 * `meta_value < %d` sobre a coluna de texto
 * (`wp-includes/functions.php:6979` e `:6997`).
 *
 * ⚠️ O operador e **estritamente menor**: o registro descartado exatamente no
 * instante limite ainda **nao** vence, que e a borda de UT-052-2. A comparacao e
 * a varredura sao de **T011**, nao desta tarefa — ver o cabecalho de
 * `marcadores-de-lixeira.ts`.
 */
export const MARCADOR_DO_INSTANTE_DO_DESCARTE = '_wp_trash_meta_time';

/**
 * `_wp_trash_meta_comments_status` — o estado anterior de **cada comentario**,
 * agrupado, no metadado do conteudo.
 *
 * Gravado pela cascata (`wp-includes/post.php:4299`), lido pela restauracao
 * (`wp-includes/post.php:4340`) e apagado por ela depois de usar
 * (`wp-includes/post.php:4372`). Nao existe em `commentmeta`: e **chave de
 * conteudo**, e e esse detalhe que CA-2.2 chama de *"agrupado, junto do
 * conteudo"*.
 */
export const MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS =
  '_wp_trash_meta_comments_status';

/**
 * Os tres marcadores, na ordem em que o legado os nomeia.
 *
 * Existe para que a coleta e a exclusao definitiva possam percorre-los sem
 * repetir a lista: `wp_scheduled_delete()` apaga dois deles por registro
 * inconsistente (`wp-includes/functions.php:6990` e `:7008`), e
 * `wp_delete_post()` apaga os mesmos dois antes de apagar a linha
 * (`wp-includes/post.php:3889`). A terceira chave **nao** entra nessas duas
 * varreduras no legado, e por isso esta lista nao e "o que apagar": e o
 * vocabulario.
 */
export const MARCADORES_DE_LIXEIRA = [
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
] as const;
