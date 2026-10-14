/**
 * O contexto da visibilidade de um anexo: tudo que US-2 precisa e que **nao e**
 * regra desta pasta.
 *
 * Entrega de **T005** da feature `006-biblioteca-de-midia` (US-2). Mesma forma e
 * mesmas razoes de `../envio/contexto-de-envio.ts`, e as duas valem palavra por
 * palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 *   REQUISICAO;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** AD-08
 *   fixa portas somente nas 5 bordas; AD-10 e a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * # Por que a resolucao tem DOIS colaboradores, e nenhuma porta
 *
 * `get_post_status()` (`wp-includes/post.php:1290`) le duas coisas, e as duas
 * sao do **conteudo pai**, nao do anexo:
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `get_post( $post->post_parent )` (`:1308`, `:1313`, `:1322`) | BC-01, conteudo | {@link ConteudoNaVisibilidade.obterConteudo} |
 * | `get_post_meta( $post->post_parent, '_wp_trash_meta_status', true )` (`:1315`) | BC-05, retencao e descarte | {@link ConteudoNaVisibilidade.estadoAnteriorNaLixeira} |
 *
 * **Nenhuma das duas passa pelo armazenamento desta feature, e isso e
 * deliberado.** O `obterPorId` de `../armazenamento/anexo.ts` emite
 * `SELECT * FROM {site}posts WHERE ID = ?`, que e a consulta de
 * `wp_delete_attachment()` (`wp-includes/post.php:6817`) — **sem** `LIMIT`. O
 * `get_post()` que esta resolucao usa emite
 * `SELECT * FROM $wpdb->posts WHERE ID = %d LIMIT 1`
 * (`wp-includes/class-wp-post.php:289`). Sao duas cadeias diferentes para a
 * mesma leitura, e a area 3 da Decisao 2 de `parity_specs.md` compara
 * *"snapshot + sequencia de comandos"*: resolver o pai pelo repositorio daqui
 * emitiria uma consulta que o legado nao emite neste ponto.
 *
 * E a chave `_wp_trash_meta_status` nao e lida pelo `postmeta` deste modulo pelo
 * mesmo motivo com outro dono: ela e o marcador da lixeira de **conteudo**
 * (`MARCADOR_DE_ESTADO_ANTERIOR`, de `contextos/retencao-e-descarte/`), gravado
 * por `wp_trash_post()`, e o identificador que a le aqui e o do **pai**. O
 * precedente esta em `plataforma/autorizacao/conteudo-na-autorizacao.ts`, que
 * declara a mesma leitura como campo injetado —
 * `FonteDeConteudoNaAutorizacao.estadoAnteriorNaLixeira`, *"`get_post_meta(
 * $post->ID, '_wp_trash_meta_status', true )`"* — e nao como consulta propria.
 *
 * ---
 *
 * # A fronteira que `plataforma/autorizacao/` ja tinha nomeado
 *
 * `ConteudoNaAutorizacao.estadoParaLeitura` existe desde T017 da feature 001 com
 * este aviso no corpo:
 *
 * > ⚠️ **Para tudo o que nao e anexo, este campo e igual a `estado`**, e e a
 * > porta que o preenche. A diferenca existe porque `get_post_status()` resolve
 * > o estado de um anexo pelo conteudo pai (`inherit`, anexo solto, pai na
 * > lixeira), e essa resolucao e da biblioteca de midia — feature 006, nao esta.
 * > Declarar o campo aqui nomeia a fronteira; preenche-lo com `estado` e o que
 * > todo tipo que nao e anexo faz de qualquer forma.
 *
 * **T005 e quem preenche essa fronteira.** Quem compoe a requisicao resolve o
 * campo com `visibilidadeDoAnexo()` quando a linha e de `attachment`, e com a
 * propria coluna quando nao e — que e o que o legado faz, porque para os outros
 * 15 tipos do nucleo a funcao devolve `$post->post_status` sem tocar em nada.
 */

/**
 * A linha de `posts` no recorte que a resolucao de visibilidade le — quatro
 * colunas, e nenhuma delas e o texto.
 *
 * E `$post` de `get_post_status()`, e **nao e so o anexo**: a recursao de
 * `:1322` chama a mesma funcao para o **pai**, que e conteudo de qualquer tipo.
 * E por isso que {@link tipo} e lido e nao presumido.
 *
 * ⚠️ O `Anexo` de `../armazenamento/anexo.ts` e atribuivel a esta forma sem
 * conversao nenhuma — os quatro campos tem o mesmo nome la. Isso e de
 * proposito: quem ja leu o anexo pelo
 * armazenamento de T002 passa o registro direto, sem segunda leitura e sem
 * mapeamento, e o teste desta tarefa afirma essa atribuicao.
 */
export interface RegistroNaVisibilidade {
  /** `$post->ID`. */
  readonly id: number;
  /**
   * `$post->post_type`.
   *
   * Comparado com `attachment` por **nome** nos dois ramos (`:1303` e `:1325`),
   * e nao por registro de tipo: e o discriminador `TIPO_DE_ANEXO`.
   */
  readonly tipo: string;
  /**
   * `$post->post_status` **cru**, como esta na coluna.
   *
   * E a entrada da resolucao, nunca a saida: `varchar(20)` sem `ENUM` e sem
   * `CHECK` (`DB-ENUM`, BR-MIGRAR-075), logo qualquer valor cabe aqui —
   * inclusive `publish`, que uma linha inserida direto na tabela recebe do
   * default do DDL (`wp-admin/includes/schema.php:167`).
   */
  readonly estado: string;
  /**
   * `$post->post_parent` — o conteudo de destino, ou `SEM_CONTEUDO_DE_DESTINO`.
   *
   * O nome e o de `Anexo.conteudoDeDestino` porque nos **dois** ramos que o leem
   * a linha e sempre de `attachment`, e nessa linha `post_parent` e o conteudo
   * que carrega o arquivo (ver `../armazenamento/anexo.ts`).
   */
  readonly conteudoDeDestino: number;
}

/**
 * As duas leituras que a resolucao faz **do pai**, declaradas aqui e
 * implementadas fora deste contexto (ligacao tardia, AD-10).
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 */
export interface ConteudoNaVisibilidade {
  /**
   * `get_post( $id )` — a leitura normalizada, de BC-01
   * (`wp-includes/class-wp-post.php:289`).
   *
   * Devolve `null` onde o legado devolve `false`: identificador inexistente, e
   * tambem o `0`. Mesma convencao de `ConteudoNaMidia.obterDestino` em
   * `../envio/contexto-de-envio.ts`.
   *
   * ⚠️ **E chamada mais de uma vez para o mesmo identificador, de proposito.**
   * Ver a contagem de leituras no cabecalho de `visibilidade-de-anexo.ts`: no
   * legado as repetidas saem do cache de objeto da requisicao, e o
   * `Contexto` de `PT-014` poe *"o cache de objeto desligado nas duas
   * metades"* — logo a sequencia de chamadas e observavel e e reproduzida como
   * esta.
   */
  obterConteudo(conteudoId: number): RegistroNaVisibilidade | null;

  /**
   * `get_post_meta( $id, '_wp_trash_meta_status', true )` (`:1315`) — o estado
   * que o conteudo tinha **antes** de ir para a lixeira.
   *
   * Devolve `''` quando a chave nao existe, que e o que a leitura unica do
   * legado devolve (`AUSENTE_NA_LEITURA_UNICA`, de
   * `../armazenamento/metadado.ts`). O vazio **nao** e erro: e o caso que o
   * legado trata com *"Assume publish as above"* (`:1318`).
   *
   * E chamada **so** no ramo da lixeira, e so depois de a resolucao do pai ter
   * devolvido `trash`.
   */
  estadoAnteriorNaLixeira(conteudoId: number): string;
}

/**
 * O contexto da resolucao de visibilidade.
 *
 * Um colaborador so, e nenhuma porta: esta operacao nao toca disco, nao abre
 * imagem, nao le opcao e nao pergunta capacidade. Chega por **argumento**, e nao
 * pela composicao, pela razao do cabecalho deste arquivo.
 */
export interface ContextoDeVisibilidade {
  /** As duas leituras do conteudo pai (ligacao tardia, AD-10). */
  readonly conteudo: ConteudoNaVisibilidade;
}
