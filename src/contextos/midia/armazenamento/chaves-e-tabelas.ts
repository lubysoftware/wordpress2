/**
 * Os nomes das duas tabelas e das cinco chaves de metadado desta feature.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`. `satisfaz: —
 * (infraestrutura)`: nenhum criterio de aceite fecha aqui.
 *
 * **O anexo nao tem tabela.** `target_data_model.md` poe `Anexo` em
 * `{p}posts` com `post_type='attachment'`, como uma das **seis** entidades de
 * dominio que compartilham a mesma tabela, e diz o que fazer com isso: *"Isso
 * **nao** e erro de modelagem a corrigir — e a forma do legado, e separa-las em
 * tabelas proprias mudaria `erd-complete.md` §3 e quebraria a coexistencia"*. A
 * secao *Modelo de dados* do `plan.md` desta feature repete pelo lado do
 * produto: *"o arquivo enviado e conteudo, nao entidade propria. E isso que lhe
 * da autor, data, metadado, classificacao e endpoint sem nada ter sido escrito
 * para ele"*.
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL, logo as duas levam o
 * prefixo **do site**. A porta deste modulo nao declara prefixo base de
 * proposito (ver `portas/porta-de-dados.ts`): nenhuma tabela desta feature e
 * global.
 *
 * **Nao ha nome montado a mao fora deste arquivo**, pelo mesmo motivo que a
 * nota 3 de `target_data_model.md` registra: *"o prefixo de tabela nao e so
 * configuracao de conexao: ele e dado"*. Um nome montado no meio de uma
 * consulta e a forma mais barata de gravar o anexo de um site na tabela de
 * outro.
 *
 * ── AS CINCO CHAVES, E POR QUE O NOME DE CADA UMA E CONTRATO ───────────────
 *
 * As cinco sao `meta_key` de `{site}postmeta`, e o **nome** de cada uma e
 * contrato publico (P8): extensao, tema e cliente REST leem estas chaves pelo
 * nome. Nenhuma delas e nomeada em documento algum do pacote de specs — elas
 * vem do sistema analisado, que o P1 poe como a especificacao —, e por isso cada
 * uma carrega a ancora de onde foi lida.
 *
 * ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────
 *
 * - **O DDL das duas tabelas.** A borda 4 de `target_architecture.md` tem
 *   **dono unico da evolucao de esquema** — a metade PHP mantem `db_version` e
 *   *"a metade nova **le e nunca escreve**"* —, e AD-11 e literal: *"nenhuma
 *   mudanca de esquema e permitida nesta fase"*. Esta feature nao cria tabela e
 *   nao acrescenta coluna: as duas tabelas e o DDL delas ja chegam declarados
 *   pela feature que semeia a instalacao (`010-operacao-do-software`). Uma
 *   segunda copia da cadeia aqui seria um segundo contrato para o mesmo
 *   `CREATE TABLE`, e e a cadeia que `DB-MIG` (BR-MIGRAR-085) compara.
 * - ⚠️ **E vale registrar o default que o DDL carrega, porque ele vale para o
 *   anexo tambem:** `post_status varchar(20) NOT NULL default 'publish'`
 *   (`wp-admin/includes/schema.php:167`). A reescrita de `P2`
 *   (BR-MIGRAR-002) acontece no caminho de **aplicacao**
 *   (`wp-includes/post.php:4705`), nao no banco — logo uma linha de `attachment`
 *   inserida direto na tabela, sem informar o estado, nasce `publish`, que e
 *   exatamente o estado que `P2` diz que o anexo nunca tem. Isso e o legado, nao
 *   e defeito a consertar, e nenhum caminho deste modulo insere linha direto
 *   (ver `anexo.ts`).
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}posts` — o registro universal de conteudo, onde o anexo e uma linha. */
export function tabelaDeConteudo(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}posts`;
}

/** `{site}postmeta` — a extensao aberta em par chave e valor, com 4 colunas. */
export function tabelaDeMetadadosDeConteudo(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}postmeta`;
}

/**
 * `attachment` — o valor de `post_type` que faz da linha um anexo.
 *
 * Registrado por `create_initial_post_types()` (`wp-includes/post.php:93`). E
 * discriminador: e por ele que `wp_delete_post()` distingue a semantica de
 * `post_parent` (`wp-includes/post.php:3923`) e por ele que
 * `wp_delete_attachment()` recusa uma linha que nao seja anexo
 * (`wp-includes/post.php:6825`).
 */
export const TIPO_DE_ANEXO = 'attachment';

/**
 * `_wp_attached_file` — o caminho do arquivo **relativo a area de envios**.
 *
 * Gravada por `update_attached_file()` (`wp-includes/post.php:902`) e lida por
 * `get_attached_file()` (`wp-includes/post.php:846`). Nao e o endereco publico e
 * nao e caminho absoluto: a absolutizacao e a relativizacao sao do chamador —
 * ver `metadado-de-anexo.ts`.
 */
export const CHAVE_DO_ARQUIVO_ANEXADO = '_wp_attached_file';

/**
 * `_wp_attachment_metadata` — o metadado que **descreve as derivadas**.
 *
 * E a metade desta tarefa que a linha de `tasks.md` nomeia por extenso. Lida por
 * `wp_get_attachment_metadata()` (`wp-includes/post.php:7114`) e gravada por
 * `wp_update_attachment_metadata()` (`wp-includes/post.php:7175`). O valor e um
 * arranjo serializado no formato do legado: ver `derivadas.ts`.
 */
export const CHAVE_DO_METADADO_DE_ANEXO = '_wp_attachment_metadata';

/**
 * `_wp_attachment_backup_sizes` — os arquivos que a edicao de imagem guardou.
 *
 * Lida em `wp_delete_attachment()` (`wp-includes/post.php:6851`) e no editor de
 * imagem (`wp-admin/includes/image-edit.php:33`, `:818`), gravada em
 * `:892`, `:1143`. E o que CA-7.3 chama de *"identificavel como backup"* e o que
 * CA-8.2 manda apagar junto. A forma esta em `derivadas.ts`; as regras de
 * quando gravar e com que nome sao de T015.
 */
export const CHAVE_DOS_TAMANHOS_DE_BACKUP = '_wp_attachment_backup_sizes';

/**
 * `_wp_attachment_image_alt` — o texto alternativo da imagem.
 *
 * Gravada por `media_handle_upload()` **so quando ha texto**
 * (`wp-admin/includes/media.php:431`, dentro de `if ( trim( $alt ) )`), o que
 * significa que a chave **nao existe** no anexo sem texto alternativo. A
 * diferenca entre "chave ausente" e "chave com texto vazio" e efeito no banco.
 */
export const CHAVE_DO_TEXTO_ALTERNATIVO = '_wp_attachment_image_alt';

/**
 * `_wp_attachment_context` — de que tela o anexo nasceu.
 *
 * Gravada por `wp_insert_post()` com `add_post_meta( ..., true )` — unica —
 * e **so quando o pedido traz o campo** (`wp-includes/post.php:5130`). O legado
 * a usa para distinguir o anexo criado pela personalizacao do enviado pelo ator.
 */
export const CHAVE_DO_CONTEXTO_DO_ANEXO = '_wp_attachment_context';
