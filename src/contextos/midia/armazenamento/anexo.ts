/**
 * A forma de armazenamento do anexo — `AGG-Anexo`, que e uma linha de `posts`.
 *
 * Primeira metade da entrega de **T002**: *"o anexo existe como registro de
 * conteudo com estado herdado"*. `satisfaz: — (infraestrutura)`: nenhum criterio
 * de aceite fecha aqui, e **nenhuma regra de negocio desta feature esta neste
 * arquivo**.
 *
 * ── TRES COLUNAS DE `posts` QUEREM DIZER OUTRA COISA NO ANEXO ──────────────
 *
 * A secao *Modelo de dados* do `plan.md` desta feature lista as tres, e o nome
 * de cada campo abaixo e o que ela diz: *"o tipo de midia numa coluna propria, o
 * endereco do arquivo no campo de identificador global, e a legenda da midia no
 * campo de resumo do conteudo"*. As tres sao preenchidas no mesmo lugar, quando
 * o anexo nasce (`wp-admin/includes/media.php:413` a `:419`):
 *
 * | coluna | no conteudo | no anexo | ancora |
 * |---|---|---|---|
 * | `post_mime_type` | vazia | o tipo real do arquivo | `media.php:414` |
 * | `guid` | o identificador global do conteudo | o **endereco do arquivo** | `media.php:415` |
 * | `post_excerpt` | o resumo | a **legenda** da midia | `media.php:419` |
 * | `post_content` | o corpo | a descricao da midia | `media.php:418` |
 * | `post_parent` | pagina mae | o **conteudo de destino** | `media.php:416` |
 *
 * `plan.md` resume a consequencia disso em uma frase, e ela e a razao de o anexo
 * nao ter tabela: *"o arquivo enviado e conteudo, nao entidade propria. E isso
 * que lhe da autor, data, metadado, classificacao e endpoint sem nada ter sido
 * escrito para ele"*.
 *
 * ── O ESTADO HERDADO, QUE E A OUTRA METADE DO TITULO DA TAREFA ─────────────
 *
 * `P2` (BR-MIGRAR-002) e literal: *"anexo nunca e 'publicado'. Status fora de
 * `inherit`, `private`, `trash`, `auto-draft` e reescrito para `inherit`: a
 * visibilidade do arquivo e a do post pai"*. O vocabulario esta aqui como
 * {@link ESTADO_HERDADO} e {@link ESTADOS_DE_ANEXO_ACEITOS}, porque e **forma**;
 * **a reescrita e de T005** (US-2, CA-2.2), porque e regra, e ela acontece num
 * lugar so no legado — `wp-includes/post.php:4705`, dentro de
 * `wp_insert_post()`, antes de qualquer coluna ser montada.
 *
 * ⚠️ E por isso que a leitura deste arquivo **nao** recusa nem corrige estado:
 * a reescrita e de gravacao, e a linha que ja esta `publish` no banco continua
 * sendo devolvida como esta. A assimetria e observavel e e do legado — ver
 * `leitura-de-linha.ts`.
 *
 * ── POR QUE NAO HA `inserir` NEM `atualizar` NESTE REPOSITORIO ─────────────
 *
 * **O legado tem um caminho de escrita so para a linha do anexo, e ele nao e
 * deste contexto.** `wp_insert_attachment()` (`wp-includes/post.php:6778`) nao
 * escreve nada: ela monta o pedido, forca `post_type = 'attachment'`
 * (`:6790`) e **delega para `wp_insert_post()`**, que e o caminho de BC-01. Os
 * quatro pontos de extensao do caminho de escrita — `wp_insert_post_empty_content`,
 * `wp_insert_post_parent`, `wp_insert_post_data` e `pre_post_insert` —, a
 * reescrita de `P2`, a unicidade do identificador na URL do anexo
 * (`:5598`) e a gravacao do `guid` (`:5121`) estao **todos** la. Um `inserir`
 * nascido aqui emitiria um comando que o legado nao emite e saltaria quatro
 * contratos publicos que o P2 da constituicao protege.
 *
 * Como a chamada de BC-04 para BC-01 e **ligacao tardia** (AD-10: *"toda chamada
 * BC para BC e resolvida no momento da chamada, por porta injetada"*, e a regra
 * de dependencia 3 proibe o `import`), quem declara essa ligacao e a tarefa que
 * grava — **T003** (US-1) —, do mesmo jeito que `ClassificacaoNaPublicacao` e
 * declarada no contexto da operacao em BC-01. T002 nao a declara porque T002 nao
 * grava linha de `posts`.
 *
 * **As duas consultas que estao aqui sao as duas que o caminho do anexo emite
 * sobre `posts` por conta propria**, e as duas estao dentro de
 * `wp_delete_attachment()`, que **nao** passa por `wp_delete_post()`:
 *
 * | o que | cadeia do legado | ancora |
 * |---|---|---|
 * | ler a linha | `SELECT * FROM $wpdb->posts WHERE ID = %d` | `wp-includes/post.php:6817` |
 * | apagar a linha | `$wpdb->delete( $wpdb->posts, array( 'ID' => $post_id ) )` | `wp-includes/post.php:6891` |
 *
 * ⚠️ **{@link RepositorioDeAnexos.apagar} e so a linha, e apagar anexo e
 * definitivo.** `R3` (BR-MIGRAR-032) e a resposta 9 de `questions.md`: *"apagar
 * midia e, por default, definitivo, sem aviso"*, e `REQ-051`, que pedia lixeira
 * para a midia, esta em `do-not-rewrite.md` — escopo recusado. A sequencia
 * inteira de `wp_delete_attachment()` atravessa quatro tabelas e o disco, e o
 * P5 da constituicao poe o conjunto exato do que sai e do que fica orfao no
 * contrato observavel: e de **T017** (US-8), com o cenario
 * `@cascata` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`. Um
 * `apagarEmCascata` nascido aqui esconderia justamente o que o P5 manda afirmar
 * por teste.
 */

import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import { tabelaDeConteudo } from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto, primeiraLinha } from './leitura-de-linha.js';

/**
 * `inherit` — o estado com que o anexo vive.
 *
 * E o alvo da reescrita de `P2` e o valor que UC-12 poe na pos-condicao:
 * *"existe um registro de anexo em `inherit` apontando para o arquivo"*.
 * Significa *"a visibilidade e a do conteudo de destino"*, e e o que faz CA-2.4
 * — *"mudar a visibilidade do conteudo de destino muda a do anexo junto"* —
 * acontecer sem nenhuma escrita no anexo.
 */
export const ESTADO_HERDADO = 'inherit';

/**
 * Os quatro estados que o anexo pode ter, na ordem em que o legado os lista
 * (`wp-includes/post.php:4705`).
 *
 * A ordem e transcrita porque a lista e transcrita; ela nao e significativa no
 * `in_array()` do legado. O que e significativo e o conjunto: qualquer valor
 * fora dele vira {@link ESTADO_HERDADO} **na gravacao**, e `publish` nao esta
 * aqui — e esse o conteudo de `P2`.
 */
export const ESTADOS_DE_ANEXO_ACEITOS = [
  'inherit',
  'private',
  'trash',
  'auto-draft',
] as const;

export type EstadoDeAnexoAceito = (typeof ESTADOS_DE_ANEXO_ACEITOS)[number];

/**
 * `post_parent = 0`: anexo **sem** conteudo de destino, e nao nulo.
 *
 * `DB-SENT` (BR-MIGRAR-081): *"ausencia de vinculo e escrita como `0`"*, e a
 * consequencia esta nomeada junto — *"um `LEFT JOIN ... WHERE pai IS NULL`
 * **nao encontra orfao nenhum** neste banco"*. E a distincao que CA-2.3 cobra:
 * *"anexo sem conteudo de destino passa a ter visibilidade propria, declarada no
 * registro"*, que e o fluxo alternativo *Arquivo sem conteudo de destino* de
 * UC-12.
 */
export const SEM_CONTEUDO_DE_DESTINO = 0;

/**
 * A sentinela de data: o valor de fabrica das quatro colunas `datetime`.
 *
 * ⚠️ Nao e "data ausente": e o valor que o legado **deduz** de um registro cujo
 * estado tem data flutuante. 🔴 O destino dela e `BR-HUMANA-003` e esta
 * **pendente** (`target_data_model.md`); este arquivo segue a premissa declarada
 * la — manter a cadeia — e **nao decide nada**.
 */
export const DATA_SENTINELA = '0000-00-00 00:00:00';

/**
 * Uma linha de `posts` lida como anexo, com as 23 colunas.
 *
 * `estado` e `tipo` sao `string` e **nao** os tipos fechados do vocabulario, e
 * isso e regra lida e nao preguica: as duas colunas sao `varchar(20)` sem `ENUM`
 * e sem `CHECK` (`DB-ENUM`, BR-MIGRAR-075), `register_post_status()` e
 * `register_post_type()` sao pontos de extensao publicos, e o legado **tolera**
 * valor nao registrado em vez de recusar. {@link EstadoDeAnexoAceito} descreve o
 * que `P2` admite **na gravacao**, nao o dominio da coluna.
 */
export interface Anexo {
  readonly id: number;
  /** `post_author` — a conta que enviou. Orfao e estado normal (P5). */
  readonly autorId: number;
  /** `post_date` — texto no formato do banco, podendo ser {@link DATA_SENTINELA}. */
  readonly data: string;
  readonly dataGmt: string;
  /** `post_content` — a descricao da midia. */
  readonly descricao: string;
  readonly titulo: string;
  /** `post_excerpt` — a **legenda** da midia (`plan.md`, Modelo de dados). */
  readonly legenda: string;
  /** `post_status` — {@link ESTADO_HERDADO} no anexo que passou pela gravacao. */
  readonly estado: string;
  readonly estadoDeComentario: string;
  readonly estadoDeNotificacao: string;
  /**
   * `post_password` — texto claro, com comparacao literal (`D6`,
   * BR-MIGRAR-044). No anexo e herdada do uso, nao do arquivo.
   */
  readonly senha: string;
  /** `post_name` — o identificador na URL. Vazio e ausencia (`DB-SENT`). */
  readonly identificadorNaUrl: string;
  readonly aPingar: string;
  readonly pingados: string;
  readonly modificadoEm: string;
  readonly modificadoEmGmt: string;
  readonly descricaoFiltrada: string;
  /**
   * `post_parent` — o **conteudo de destino**, ou {@link
   * SEM_CONTEUDO_DE_DESTINO}.
   *
   * E uma das tres semanticas da auto-referencia de `posts`, e aqui ela e
   * sempre a mesma, porque a linha e sempre de `attachment`: e a semantica que
   * `wp_delete_post()` pergunta com `AND post_type = 'attachment'`
   * (`wp-includes/post.php:3923`).
   */
  readonly conteudoDeDestino: number;
  /** `guid` — o **endereco do arquivo** (`plan.md`, Modelo de dados). */
  readonly endereco: string;
  readonly ordemNoMenu: number;
  /** `post_type` — {@link TIPO_DE_ANEXO} nesta linha. Lido, nao presumido. */
  readonly tipo: string;
  /** `post_mime_type` — o tipo real do arquivo, decidido no envio (CA-1.2). */
  readonly tipoMime: string;
  /**
   * `comment_count` — contador desnormalizado, lido aqui e escrito em lugar
   * nenhum deste modulo (`DB-TRG1`, BR-MIGRAR-077).
   */
  readonly contagemDeComentarios: number;
}

/**
 * Os campos que o caminho do anexo informa quando a linha nasce, na ordem em que
 * `media_handle_upload()` os monta (`wp-admin/includes/media.php:413` a `:419`).
 *
 * **Isto e a forma do pedido, nao de uma escrita deste repositorio.** O pedido
 * atravessa `wp_insert_attachment()` e e `wp_insert_post()` que grava — ver o
 * cabecalho deste arquivo. Esta aqui porque e a forma que T002 entrega e T003
 * preenche; os valores de cada campo (o titulo que vem do nome do arquivo ou do
 * EXIF, a legenda que vem da legenda EXIF, a descricao montada para audio) sao
 * regra de T003.
 *
 * Os dois ultimos campos nao sao colunas: sao campos do pedido que
 * `wp_insert_post()` consome para gravar **metadado**, e os dois sao opcionais
 * la, com o `! empty()` do legado decidindo (`wp-includes/post.php:5125` e
 * `:5129`).
 */
export interface PedidoDeAnexo {
  /** `post_mime_type`. */
  readonly tipoMime: string;
  /** `guid` — o endereco do arquivo. */
  readonly endereco: string;
  /** `post_parent` — {@link SEM_CONTEUDO_DE_DESTINO} quando nao ha destino. */
  readonly conteudoDeDestino: number;
  readonly titulo: string;
  /** `post_content`. */
  readonly descricao: string;
  /** `post_excerpt` — a legenda. */
  readonly legenda: string;
  /**
   * `file` — o caminho do arquivo, que vira `_wp_attached_file`
   * (`wp-includes/post.php:5126`). Campo do pedido, nao coluna.
   */
  readonly arquivo?: string;
  /**
   * `context` — de que tela o anexo nasceu, que vira `_wp_attachment_context`
   * (`wp-includes/post.php:5130`). Campo do pedido, nao coluna.
   */
  readonly contexto?: string;
}

export interface RepositorioDeAnexos {
  /**
   * `SELECT * FROM {site}posts WHERE ID = ?` — a leitura crua que
   * `wp_delete_attachment()` faz antes de qualquer decisao
   * (`wp-includes/post.php:6817`).
   *
   * E `SELECT *` e nao lista de colunas pelo mesmo motivo que em BC-01:
   * `DB-MIG` (BR-MIGRAR-085) registra que *"coluna criada por extensao
   * permanece e nao aparece em `wp_get_db_schema()` — o DDL e o piso, nao o
   * retrato"*. Uma lista explicita deixaria de fora a coluna que uma extensao
   * acrescentou, que o legado devolve.
   *
   * ⚠️ **Nao filtra por tipo.** O legado le a linha primeiro e **so depois**
   * recusa o que nao e anexo (`:6825`), e a ordem importa: a consulta sai
   * mesmo quando o identificador e de um conteudo comum. Quem precisa da recusa
   * compara {@link Anexo.tipo} com `TIPO_DE_ANEXO`.
   */
  obterPorId(id: number): Anexo | null;
  /**
   * `DELETE FROM {site}posts WHERE ID = ?` — o `$wpdb->delete()` de
   * `wp_delete_attachment()` (`wp-includes/post.php:6891`). Devolve as linhas
   * afetadas.
   *
   * **Isto e definitivo e e so a linha.** Ver o cabecalho deste arquivo: a
   * cascata e de T017, e `R3` recusa lixeira.
   */
  apagar(id: number): number;
}

export function criarRepositorioDeAnexos(
  dados: PortaDeDados,
): RepositorioDeAnexos {
  const tabela = tabelaDeConteudo(dados);

  return {
    obterPorId(id) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE ID = ?`,
          parametros: [id],
        }),
      );
      return linha === null ? null : lerAnexo(linha);
    },

    apagar(id) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE ID = ?`,
        parametros: [id],
      }).linhasAfetadas;
    },
  };
}

/**
 * A linha como {@link Anexo}, sem interpretar nada alem do tipo da coluna.
 *
 * Nao ha traducao de valor nenhuma: nem estado reescrito, nem endereco resolvido,
 * nem tipo MIME conferido contra a lista de tipos permitidos (CA-1.2, que e de
 * T003). O que entra na coluna sai da coluna.
 */
export function lerAnexo(linha: LinhaDeResultado): Anexo {
  return {
    id: comoInteiro(linha['ID']),
    autorId: comoInteiro(linha['post_author']),
    data: comoTexto(linha['post_date']),
    dataGmt: comoTexto(linha['post_date_gmt']),
    descricao: comoTexto(linha['post_content']),
    titulo: comoTexto(linha['post_title']),
    legenda: comoTexto(linha['post_excerpt']),
    estado: comoTexto(linha['post_status']),
    estadoDeComentario: comoTexto(linha['comment_status']),
    estadoDeNotificacao: comoTexto(linha['ping_status']),
    senha: comoTexto(linha['post_password']),
    identificadorNaUrl: comoTexto(linha['post_name']),
    aPingar: comoTexto(linha['to_ping']),
    pingados: comoTexto(linha['pinged']),
    modificadoEm: comoTexto(linha['post_modified']),
    modificadoEmGmt: comoTexto(linha['post_modified_gmt']),
    descricaoFiltrada: comoTexto(linha['post_content_filtered']),
    conteudoDeDestino: comoInteiro(linha['post_parent']),
    endereco: comoTexto(linha['guid']),
    ordemNoMenu: comoInteiro(linha['menu_order']),
    tipo: comoTexto(linha['post_type']),
    tipoMime: comoTexto(linha['post_mime_type']),
    contagemDeComentarios: comoInteiro(linha['comment_count']),
  };
}
