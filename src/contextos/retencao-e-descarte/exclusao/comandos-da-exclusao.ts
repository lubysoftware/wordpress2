/**
 * Os comandos que a exclusao definitiva emite **ela mesma**, crus, sobre as tres
 * tabelas que ela toca neste modulo.
 *
 * Entrega de **T017** da feature `005-retencao-e-descarte` (US-8). Este arquivo
 * nao tem regra de negocio nenhuma: ele e a forma dos comandos, do mesmo jeito
 * que `armazenamento/metadado.ts` e a forma do metadado. Quem ordena os passos e
 * decide o que cada um significa e `apagar-em-definitivo.ts`.
 *
 * ── POR QUE SAO COMANDOS CRUS, E NAO O CAMINHO DE GRAVACAO DE BC-01 ─────────
 *
 * O descarte de US-1 **nao** monta SQL: ele chama `wp_update_post()`, e por isso
 * `ConteudoNoDescarte.gravarEstado` e porta (ver a secao da descoberta em
 * `../descarte/contexto-de-descarte.ts`). `wp_delete_post()` e o oposto, e isso
 * e leitura da arvore e nao escolha daqui: ela fala com `$wpdb` **direto** em
 * cinco pontos — o `SELECT *` da linha (`wp-includes/post.php:3843`), a leitura
 * dos filhos (`:3900`), os dois `$wpdb->update()` do reposicionamento (`:3908` e
 * `:3923`), as tres leituras de dependencia (`:3913`, `:3927`, `:3937`) e o
 * `$wpdb->delete()` da linha (`:3969`). Nenhum deles passa por
 * `wp_update_post()`, e a diferenca e observavel: por `wp_update_post()` cada
 * filho reposicionado reescreveria `post_modified` e dispararia `save_post`,
 * `post_updated` e a transicao de estado — num `UPDATE` so, nenhum dos tres
 * acontece.
 *
 * ── O QUE ESTE ARQUIVO NAO TEM, E DE QUEM E ────────────────────────────────
 *
 * - **`get_post()` nao esta aqui.** A leitura desta cascata e o `SELECT *` cru
 *   de `:3843`; a leitura **filtrada e cacheada** e de BC-01 e chega por ligacao
 *   tardia (`ConteudoNoDescarte.obterPorId`). `wp_delete_post()` usa as duas, em
 *   posicoes diferentes — ver os passos 1 e 2 de `apagar-em-definitivo.ts`.
 * - **`wp_delete_comment()` nao esta aqui**, so o `SELECT comment_ID` que a
 *   precede. Ela e de BC-03, tem cascata propria (reposiciona as respostas no
 *   avo, `wp-includes/comment.php:1590`) e dois pontos de extensao proprios.
 * - **`delete_metadata_by_mid()` esta aqui, e em T002 ela nao estava.**
 *   `armazenamento/metadado.ts` declarou a ausencia com o motivo — *"eles
 *   pertencem a exclusao em sete etapas, que apaga a linha de metadado pelo
 *   `meta_id`"* — e esta e a tarefa daquela cascata. Fica no arquivo da cascata,
 *   e nao acrescentada ao repositorio de T002, para que a familia de metadado
 *   continue com a superficie que os fluxos de lixeira usam: a exclusao por
 *   **chave** (dois comandos) e a exclusao por **linha** (dois comandos
 *   diferentes) tem sequencias distintas, e misturar as duas num repositorio so
 *   convidaria a trocar uma pela outra.
 *
 * ── OS QUATRO PONTOS DE EXTENSAO DO METADADO, DECLARADOS E NAO EMITIDOS ─────
 *
 * `delete_metadata_by_mid( 'post', $mid )` dispara, nesta ordem
 * (`wp-includes/meta.php:1055` a `:1113`):
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `delete_post_metadata_by_mid` | filtro | `null`, `$meta_id` | antes de tudo; valor nao nulo curto-circuita e **nenhum comando sai** (`:1055`) |
 * | `delete_post_meta` | acao | `(array) $meta_id`, `$object_id`, `$meta_key`, `$meta_value` | depois da leitura, antes do `DELETE` (`:1066`) |
 * | `delete_postmeta` | acao | `$meta_id` | logo depois do anterior — o nome antigo (`:1085`) |
 * | `deleted_post_meta` / `deleted_postmeta` | acao | os mesmos | depois do `DELETE` (`:1095` e `:1113`) |
 *
 * Eles ficam **nomeados aqui e nao disparados**, como os de T002: o barramento
 * (`plataforma/barramento/`) nao existe nesta arvore — REQ-162 esta em
 * `do-not-rewrite.md` e nenhuma tarefa do pacote o constroi —, e ponto sem
 * interceptador e no-op no legado. Os pontos de `wp_delete_post()`, que
 * **mudam** o fluxo, sao outra historia e entram como campo opcional do contexto
 * (`GanchosDaExclusao`, em `contexto-de-exclusao.ts`).
 *
 * ── A FORMA DO COMANDO: SEM ACENTO GRAVE E COM MARCADOR `?` ────────────────
 *
 * O legado emite `$wpdb->update()` e `$wpdb->delete()`, que montam o identificador
 * entre acentos graves e o valor como `%d`/`%s`. Aqui o texto segue a forma que
 * `armazenamento/metadado.ts` e a de BC-01 ja usam — nome simples e marcador `?`
 * —, porque e o adaptador que fala o dialeto do driver (REQ-164 proibe
 * concatenacao, e a separacao texto/parametro e o que torna a proibicao
 * verificavel). O que a paridade compara e **o conjunto de linhas afetadas e a
 * ordem dos comandos**, que nao mudam com a grafia do identificador.
 *
 * Duas grafias **sao** copiadas de proposito, porque sao do texto e nao do
 * dialeto: o `post_type = 'revision'` literal dentro do SQL das versoes
 * (`:3914`, o legado nao o passa como parametro) e o **espaco sobrando** antes do
 * fim em `WHERE post_id = %d ` (`:3938`).
 */

import {
  comoInteiro,
  comoTexto,
  METADADO_DE_CONTEUDO,
  primeiraLinha,
  tabelaDeComentarios,
  tabelaDeConteudo,
  tabelaDeMetadado,
} from '../armazenamento/index.js';
import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';

/**
 * `revision` — o tipo das versoes anteriores, cravado **dentro** do SQL de
 * `:3914`.
 *
 * ⚠️ Repete `TIPO_DE_REVISAO` de `plataforma/autorizacao/` e o vocabulario de
 * BC-01 pela razao de sempre: a regra de dependencia 3 proibe contexto importar
 * contexto, e importar da plataforma penduraria a cadeia que vai para **dentro
 * do texto de uma consulta** num modulo de decisao de capacidade. E o mesmo byte
 * nos tres lugares, e e o byte que a paridade compara — ver a nota de
 * `../descarte/estado-de-lixeira.ts`.
 */
export const TIPO_DE_VERSAO_ANTERIOR = 'revision';

/**
 * `attachment` — o tipo dos anexos, que e o segundo `$wpdb->update()` do
 * reposicionamento (`:3923`) e o desvio de `:3858`.
 */
export const TIPO_DE_ANEXO = 'attachment';

/**
 * A linha de `{site}posts` como **esta cascata** a le: quatro colunas das 23.
 *
 * Sao exatamente as quatro que `wp_delete_post()` usa do `$post` que ela leu:
 * `ID` (`:3969`), `post_type` (`:3852`, `:3858`, `:3892`, `:3897`, `:3900`),
 * `post_status` — pela leitura filtrada, ver o passo 2 — e `post_parent`, que e
 * **o avo** e portanto o valor que CA-8.1 e CA-8.2 gravam (`:3894`).
 *
 * ⚠️ **`paiId` e o pai do registro que esta sendo apagado**, isto e, o avo dos
 * filhos dele. O nome fica do ponto de vista da linha lida, como no legado
 * (`$post->post_parent`), e nao do ponto de vista do filho: trocar para `avoId`
 * aqui faria a leitura divergir da do oraculo na hora de conferir caso a caso.
 */
export interface RegistroNaExclusao {
  /** `posts.ID`. */
  readonly id: number;
  /** `posts.post_type`. */
  readonly tipo: string;
  /** `posts.post_status`, como a coluna o traz. */
  readonly estado: string;
  /** `posts.post_parent` — **o avo** dos filhos e dos anexos deste registro. */
  readonly paiId: number;
}

/** Os comandos crus da cascata, sobre a porta de dados deste modulo. */
export interface ComandosDaExclusao {
  /** `{site}posts`. */
  readonly tabelaDeConteudo: string;
  /** `{site}comments`. */
  readonly tabelaDeComentarios: string;
  /** `{site}postmeta`. */
  readonly tabelaDeMetadado: string;

  /**
   * `SELECT * FROM {site}posts WHERE ID = ?` (`wp-includes/post.php:3843`), ou
   * `null` quando a linha nao existe.
   *
   * **E o `SELECT *` cru, e nao `get_post()`.** O legado le a linha por `$wpdb`
   * e so depois a normaliza com `get_post( $post )` (`:3849`), que neste alvo e
   * trabalho de BC-01; o que esta cascata precisa da linha sao as quatro colunas
   * de {@link RegistroNaExclusao}.
   */
  lerRegistro(conteudoId: number): RegistroNaExclusao | null;

  /**
   * Os filhos **daquele tipo**:
   * `SELECT * FROM {site}posts WHERE post_parent = ? AND post_type = ?`
   * (`wp-includes/post.php:3899`-`:3902`).
   *
   * Devolve os identificadores. O legado pede `*` e guarda as linhas inteiras
   * para limpar o cache de cada filho no fim (`:4000`-`:4004`); sem cache nesta
   * arvore, o que sobra da lista e a **condicao** do `UPDATE` seguinte — lista
   * vazia, nenhum `UPDATE` sai (`:3907`).
   *
   * ⚠️ **O filtro de tipo e o do registro apagado**, e e dele que sai o primeiro
   * orfao que o legado deixa de proposito: filho de **outro** tipo nao entra
   * nesta lista e nao e reposicionado. Ver o censo de CA-8.4 em
   * `reposicionamento-no-avo.ts`.
   */
  listarFilhos(conteudoId: number, tipo: string): readonly number[];

  /**
   * **CA-8.1 e CA-8.2.**
   * `UPDATE {site}posts SET post_parent = ? WHERE post_parent = ? AND post_type = ?`
   * (`wp-includes/post.php:3908` para os filhos, `:3923` para os anexos).
   *
   * E **um** comando para todas as linhas, e os dois do legado sao a mesma
   * chamada com `post_type` diferente: `$parent_data` e
   * `array( 'post_parent' => $post->post_parent )` e `$parent_where` e
   * `array( 'post_parent' => $post_id )`, somado ao tipo com o `+` de arranjo do
   * PHP (`:3894`-`:3895`).
   *
   * Devolve as linhas afetadas.
   */
  reposicionarNoAvo(avoId: number, paiApagadoId: number, tipo: string): number;

  /**
   * **CA-8.3.**
   * `SELECT ID FROM {site}posts WHERE post_parent = ? AND post_type = 'revision'`
   * (`wp-includes/post.php:3913`-`:3915`).
   *
   * O comentario do legado na linha de cima diz por que a consulta e crua:
   * *"Do raw query. wp_get_post_revisions() is filtered"* — a leitura publica de
   * versoes passa por ponto de extensao e por `wp_revisions_enabled()`, e **uma
   * instalacao com versoes desligadas deixaria versoes para tras** se a cascata
   * usasse aquela funcao. Trocar esta consulta pela funcao filtrada e a troca que
   * CA-8.3 perde.
   */
  listarVersoes(conteudoId: number): readonly number[];

  /**
   * `SELECT comment_ID FROM {site}comments WHERE comment_post_ID = ?
   * ORDER BY comment_ID DESC` (`wp-includes/post.php:3927`-`:3929`).
   *
   * ⚠️ **A ordem decrescente e observavel.** Respostas tem identificador maior
   * que a pergunta, logo elas sao apagadas **antes**; e como `wp_delete_comment()`
   * reposiciona as respostas de quem ela apaga no avo
   * (`wp-includes/comment.php:1590`), a ordem decide se aquele `UPDATE` de
   * reposicionamento chega a sair. Com `ASC` a conversa inteira seria
   * reposicionada antes de morrer.
   */
  listarComentarios(conteudoId: number): readonly number[];

  /**
   * `SELECT meta_id FROM {site}postmeta WHERE post_id = ? `
   * (`wp-includes/post.php:3937`-`:3939`, com o espaco sobrando).
   *
   * ⚠️ **Nao e a exclusao por chave de T002.** Aqui o legado apaga **toda** linha
   * de metadado do registro, uma por uma, pelo `meta_id`; a exclusao por chave
   * (`delete_post_meta`) e outra sequencia, e os dois marcadores de lixeira ja
   * foram apagados por ela na primeira etapa (`:3889`-`:3890`) — logo eles
   * aparecem **duas vezes** no caminho, e na segunda ja nao existem.
   */
  listarLinhasDeMetadado(conteudoId: number): readonly number[];

  /**
   * `delete_metadata_by_mid( 'post', $mid )` (`wp-includes/meta.php:1013`), que
   * sao **dois** comandos: `SELECT * FROM {site}postmeta WHERE meta_id = ?`
   * (`:861`) e `DELETE FROM {site}postmeta WHERE meta_id = ?` (`:1089`).
   *
   * Devolve se a linha foi apagada. **Linha ausente nao emite `DELETE`** (`:1120`
   * devolve `false`) e identificador menor ou igual a zero **nao emite nem o
   * `SELECT`** (`:1022`-`:1024`) — o mesmo "nenhum comando" que a porta falsa de
   * T002 existe para afirmar.
   */
  apagarLinhaDeMetadado(metaId: number): boolean;

  /**
   * `DELETE FROM {site}posts WHERE ID = ?` (`wp-includes/post.php:3969`).
   *
   * Devolve as linhas afetadas, e **`0` e falha** para quem o le: a guarda do
   * legado e `if ( ! $result ) return false` (`:3970`), com os sete passos
   * anteriores **ja executados e sem desfazer**.
   */
  apagarRegistro(conteudoId: number): number;
}

export function criarComandosDaExclusao(
  dados: PortaDeDados,
): ComandosDaExclusao {
  const conteudo = tabelaDeConteudo(dados);
  const comentarios = tabelaDeComentarios(dados);
  const metadado = tabelaDeMetadado(dados, METADADO_DE_CONTEUDO);

  return {
    tabelaDeConteudo: conteudo,
    tabelaDeComentarios: comentarios,
    tabelaDeMetadado: metadado,

    lerRegistro(conteudoId) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${conteudo} WHERE ID = ?`,
          parametros: [conteudoId],
        }),
      );
      return linha === null ? null : lerRegistroNaExclusao(linha);
    },

    listarFilhos(conteudoId, tipo) {
      return dados
        .selecionar({
          texto: `SELECT * FROM ${conteudo} WHERE post_parent = ? AND post_type = ?`,
          parametros: [conteudoId, tipo],
        })
        .map((linha) => comoInteiro(linha['ID']));
    },

    reposicionarNoAvo(avoId, paiApagadoId, tipo) {
      return dados.escrever({
        texto:
          `UPDATE ${conteudo} SET post_parent = ? ` +
          'WHERE post_parent = ? AND post_type = ?',
        parametros: [avoId, paiApagadoId, tipo],
      }).linhasAfetadas;
    },

    listarVersoes(conteudoId) {
      return dados
        .selecionar({
          // A cadeia do tipo e literal no legado, e nao parametro (`:3914`).
          texto:
            `SELECT ID FROM ${conteudo} ` +
            `WHERE post_parent = ? AND post_type = '${TIPO_DE_VERSAO_ANTERIOR}'`,
          parametros: [conteudoId],
        })
        .map((linha) => comoInteiro(linha['ID']));
    },

    listarComentarios(conteudoId) {
      return dados
        .selecionar({
          texto:
            `SELECT comment_ID FROM ${comentarios} ` +
            'WHERE comment_post_ID = ? ORDER BY comment_ID DESC',
          parametros: [conteudoId],
        })
        .map((linha) => comoInteiro(linha['comment_ID']));
    },

    listarLinhasDeMetadado(conteudoId) {
      return dados
        .selecionar({
          // O espaco antes do fim e do legado (`:3938`).
          texto: `SELECT meta_id FROM ${metadado} WHERE post_id = ? `,
          parametros: [conteudoId],
        })
        .map((linha) => comoInteiro(linha['meta_id']));
    },

    apagarLinhaDeMetadado(metaId) {
      // `floor( $meta_id ) != $meta_id` e `$meta_id <= 0` recusam **antes** de
      // consultar (`wp-includes/meta.php:1017` e `:1022`): nenhum comando sai.
      if (!Number.isInteger(metaId) || metaId <= 0) {
        return false;
      }

      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${metadado} WHERE meta_id = ?`,
          parametros: [metaId],
        }),
      );
      if (linha === null) {
        return false;
      }

      return (
        dados.escrever({
          texto: `DELETE FROM ${metadado} WHERE meta_id = ?`,
          parametros: [metaId],
        }).linhasAfetadas > 0
      );
    },

    apagarRegistro(conteudoId) {
      return dados.escrever({
        texto: `DELETE FROM ${conteudo} WHERE ID = ?`,
        parametros: [conteudoId],
      }).linhasAfetadas;
    },
  };
}

/** A linha de `{site}posts` nas quatro colunas que a cascata usa. */
export function lerRegistroNaExclusao(
  linha: LinhaDeResultado,
): RegistroNaExclusao {
  return {
    id: comoInteiro(linha['ID']),
    tipo: comoTexto(linha['post_type']),
    estado: comoTexto(linha['post_status']),
    paiId: comoInteiro(linha['post_parent']),
  };
}
