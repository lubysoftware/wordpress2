/**
 * A familia de metadado do legado, com as tres operacoes que a lixeira usa.
 *
 * Nao e um repositorio por tabela: e **um** repositorio parametrizado pelo tipo
 * de metadado, porque e assim que o legado o escreve. `add_metadata()`,
 * `get_metadata()` e `delete_metadata()` recebem `$meta_type` e derivam dele a
 * tabela e a coluna (`wp-includes/meta.php:40`, `:601` e `:399`); `postmeta` e
 * `commentmeta` sao duas instancias da mesma rotina, nao duas rotinas. Escrever
 * dois repositorios aqui duplicaria a regra e abriria a porta para as duas
 * divergirem — que e justamente o que o legado nao faz.
 *
 * ── TRES OPERACOES, E E DE PROPOSITO QUE NAO SAO CINCO ─────────────────────
 *
 * O descarte, a restauracao, a coleta e a exclusao definitiva tocam o metadado
 * por exatamente tres caminhos: `add_*_meta()`, `get_*_meta( ..., true )` e
 * `delete_*_meta( $id, $chave )`. **Nenhum fluxo desta feature chama
 * `update_*_meta()`** — o comentario que vai da caixa de spam para a lixeira nao
 * atualiza o marcador, ele **apaga e acrescenta de novo**
 * (`wp-includes/comment.php:1689` a `:1692`), e essa sequencia de quatro
 * comandos e o que a paridade compara. Por isso `gravar`/`update_metadata` nao
 * existe neste arquivo: superficie que nenhum chamador desta feature usa nasce
 * sem teste de borda, e o **P6** cobra o contrario.
 *
 * Tambem nao existem aqui `obterPorId` nem `apagarPorId`. Eles pertencem a
 * exclusao em sete etapas, que apaga a linha de metadado **pelo `meta_id`**
 * (`wp-includes/post.php:3937`) — e essa cascata e de BC-01, nao desta feature
 * (PT-003, `03-exclusao-de-conteudo-em-sete-etapas.feature`).
 *
 * ── QUATRO COMPORTAMENTOS QUE SAO EFEITO NO BANCO ──────────────────────────
 *
 * 1. **A chave aceita repeticao, e a lixeira depende disso.** Nada no esquema
 *    impede duas linhas com o mesmo `post_id` e a mesma `meta_key`, e
 *    `add_post_meta()` sem `$unique` **sempre insere**. `wp_trash_post()` chama
 *    exatamente essa forma (`wp-includes/post.php:4128`): se um registro
 *    chegasse a lixeira duas vezes, ficariam duas linhas do mesmo marcador, a
 *    leitura devolveria a **primeira** e a coleta compararia **as duas**. Por
 *    isso a leitura devolve lista e {@link RepositorioDeMetadados.valorUnico}
 *    diz, no nome, que esta pegando uma.
 * 2. **A leitura e um comando so, e filtra a chave em memoria.**
 *    `get_metadata_raw()` nao consulta por chave: ele chama
 *    `update_meta_cache()`, que carrega **todas** as linhas daquele registro com
 *    `SELECT $column, meta_key, meta_value FROM $table WHERE $column IN
 *    ($id_list) ORDER BY meta_id ASC` (`wp-includes/meta.php:1204`), e so depois
 *    procura a chave. Ler dez marcadores de um registro e **um** `SELECT` no
 *    legado; um porte que consultasse por chave emitiria dez.
 * 3. **A exclusao por chave le os identificadores antes de apagar.**
 *    `delete_metadata()` faz `SELECT meta_id ... WHERE meta_key = %s AND
 *    $type_column = %d` e so entao `DELETE ... WHERE meta_id IN( ... )`
 *    (`wp-includes/meta.php:456` e `:514`). Dois comandos nessa ordem, e
 *    **nenhum** `DELETE` quando o primeiro nao devolve linha — que e o caso
 *    comum de US-7, o marcador que a coleta tenta apagar de um registro que
 *    outro caminho ja limpou.
 * 4. **Nao ha transacao** (BR-MIGRAR-104, zero `START TRANSACTION` em 1.467
 *    arquivos). A sequencia de quatro comandos do item 1 pode falhar no meio e
 *    deixar o registro com o marcador de estado e sem o de instante — estado
 *    parcial e a regra, nao o defeito, e e dele que CA-5.4 fala ao exigir
 *    retomada.
 *
 * ── A DIVERGENCIA DECLARADA: O CACHE NAO EXISTE NESTA ARVORE ───────────────
 *
 * ⚠️ No legado, a leitura do item 2 passa antes pelo **cache de objeto**:
 * `get_metadata_raw()` chama `wp_cache_get( $object_id, $meta_type . '_meta' )`
 * e so consulta o banco quando o cache esta frio (`wp-includes/meta.php:673`).
 * Com o cache quente, **nenhum** comando sai.
 *
 * O que este arquivo emite e a sequencia do legado **com cache frio**, e isso
 * nao e escolha: o slot `cache` de `plan.md` recomenda cache por requisicao em
 * memoria do processo, REQ-165 (*"decidir se o cache de objeto nasce
 * persistente"*) ficou fora do pacote, e o `Contexto` de PT-004 exige *"o cache
 * de objeto desligado nas duas metades"*. A comparacao de paridade roda com o
 * cache desligado, logo e esta a sequencia que ela vai ver.
 *
 * Pela mesma razao, `wp_cache_delete()` e `clean_comment_cache()` — que o legado
 * chama depois de cada escrita — nao tem contrapartida aqui.
 */

import {
  talvezDesserializar,
  talvezSerializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import {
  COLUNA_DA_LINHA_DE_METADADO,
  colunaDoObjeto,
  tabelaDeMetadado,
  type TipoDeMetadado,
} from './chaves-e-tabelas.js';
import { comoBruto, comoInteiro, comoTexto } from './leitura-de-linha.js';

/**
 * Uma linha de metadado como a leitura em lote a devolve: **sem `meta_id`**.
 *
 * A ausencia e do legado, nao economia daqui: a consulta que alimenta o cache
 * pede tres colunas (`$column`, `meta_key`, `meta_value`) e o identificador da
 * linha nao esta entre elas, mesmo aparecendo no `ORDER BY`
 * (`wp-includes/meta.php:1204`).
 */
export interface ValorDeMetadado {
  /** O registro a que a linha pertence: `post_id` ou `comment_id`. */
  readonly objetoId: number;
  readonly chave: string;
  /** O valor **como esta na coluna**: bytes ou texto, sem interpretacao. */
  readonly valor: ValorDeColuna;
}

export interface RepositorioDeMetadados {
  /** `post` ou `comment` — o `$meta_type` desta instancia. */
  readonly tipo: TipoDeMetadado;
  /** `{site}postmeta` ou `{site}commentmeta`, com o prefixo do site. */
  readonly tabela: string;
  /** `post_id` ou `comment_id`. */
  readonly coluna: string;

  /**
   * Todas as linhas de um registro, na ordem de `meta_id`.
   *
   * E a cadeia de `update_meta_cache()` para um identificador
   * (`wp-includes/meta.php:1204`). O legado monta a lista do `IN` por
   * **concatenacao de inteiros**, que REQ-164 proibe; com marcador de parametro
   * a cadeia enviada e a mesma.
   *
   * A ordem nao e enfeite: ela decide qual linha vence quando a chave se repete
   * (item 1 do cabecalho).
   *
   * ⚠️ **Nao aplica a guarda de identificador zero**, e isso e fidelidade:
   * `update_meta_cache()` so faz `array_map( 'intval', ... )`
   * (`wp-includes/meta.php:1156`), e quem recusa o zero e o chamador
   * (`get_metadata_raw()`, `wp-includes/meta.php:633`). As leituras por chave
   * daqui passam pela guarda; esta nao.
   */
  listar(objetoId: number): readonly ValorDeMetadado[];

  /**
   * Os valores de uma chave, **filtrados em memoria** a partir de
   * {@link listar} — como `get_metadata_raw()` faz sobre o cache
   * (`wp-includes/meta.php:684`). Uma consulta, nao duas.
   *
   * Devolve os bytes da coluna, sem passar por `maybe_unserialize()`: quem quer
   * o valor interpretado usa {@link valorUnicoBruto}.
   */
  valoresDe(objetoId: number, chave: string): readonly ValorDeColuna[];

  /**
   * `get_metadata_raw( ..., single: true )`: o **primeiro** valor da chave,
   * depois de `maybe_unserialize()`, e `null` quando ela nao existe
   * (`wp-includes/meta.php:628`).
   *
   * O `null` cobre tambem o identificador que a guarda recusa. No legado os dois
   * casos tem retorno diferente — `false` para identificador invalido, `null`
   * para chave ausente —, e **nenhum chamador desta feature os distingue**: a
   * restauracao do comentario faz `(string) get_comment_meta( ... )`
   * (`wp-includes/comment.php:1755`), e `(string) false` e `(string) ''` sao a
   * mesma cadeia vazia. Os dois tambem sao iguais no que importa a paridade:
   * **nenhum dos dois emite comando**.
   */
  valorUnicoBruto(objetoId: number, chave: string): ValorPhp | null;

  /**
   * `get_metadata( ..., single: true )`: o mesmo de {@link valorUnicoBruto},
   * com o default no lugar do ausente (`wp-includes/meta.php:601`).
   *
   * O default e **texto vazio** quando se pede um valor so
   * (`get_metadata_default()`, `wp-includes/meta.php:713`) — e e por isso que
   * `! $previous_status` e verdadeiro para um conteudo na lixeira sem marcador,
   * que e o caso tolerado de UC-10 e a borda de UT-048-6.
   */
  valorUnico(objetoId: number, chave: string): ValorPhp;

  /**
   * `add_*_meta()` sem `$unique`: **sempre insere**, inclusive quando a chave ja
   * existe (`wp-includes/meta.php:130`).
   *
   * Devolve o identificador da linha nova, e `0` quando a guarda de
   * identificador recusou — caso em que **nenhum comando sai**.
   *
   * A forma com `$unique` nao existe aqui porque nenhum marcador de lixeira a
   * usa: as duas chamadas do descarte sao `add_post_meta( $post_id, $chave,
   * $valor )` com tres argumentos (`wp-includes/post.php:4128` e `:4129`).
   */
  acrescentar(objetoId: number, chave: string, valor: ValorPhp): number;

  /**
   * `delete_*_meta( $id, $chave )`: dois comandos, como no item 3 do cabecalho.
   *
   * Devolve as linhas apagadas, e `0` quando o `SELECT` nao encontrou nada —
   * caso em que o `DELETE` **nao sai**. O legado devolve `false` nesse ponto
   * (`wp-includes/meta.php:468`), e os chamadores desta feature ignoram o
   * retorno das quatro exclusoes de marcador.
   */
  apagar(objetoId: number, chave: string): number;
}

export function criarRepositorioDeMetadados(
  dados: PortaDeDados,
  tipo: TipoDeMetadado,
): RepositorioDeMetadados {
  const tabela = tabelaDeMetadado(dados, tipo);
  const coluna = colunaDoObjeto(tipo);
  const linha = COLUNA_DA_LINHA_DE_METADADO;

  function listar(objetoId: number): readonly ValorDeMetadado[] {
    // `array_map( 'intval', $object_ids )` e tudo o que `update_meta_cache()`
    // faz com o identificador. Ver a nota da interface.
    const id = Math.trunc(objetoId);
    return dados
      .selecionar({
        texto:
          `SELECT ${coluna}, meta_key, meta_value FROM ${tabela} ` +
          `WHERE ${coluna} IN (?) ORDER BY ${linha} ASC`,
        parametros: [id],
      })
      .map((bruta) => lerValorDeMetadado(bruta, coluna));
  }

  function valoresDe(
    objetoId: number,
    chave: string,
  ): readonly ValorDeColuna[] {
    const id = identificadorDoObjeto(objetoId);
    if (id === 0) {
      return [];
    }
    return listar(id)
      .filter((valor) => valor.chave === chave)
      .map((valor) => valor.valor);
  }

  function valorUnicoBruto(objetoId: number, chave: string): ValorPhp | null {
    const valores = valoresDe(objetoId, chave);
    if (valores.length === 0) {
      return null;
    }
    return valorDeMetadado(valores[0] as ValorDeColuna);
  }

  return {
    tipo,
    tabela,
    coluna,
    listar,
    valoresDe,
    valorUnicoBruto,

    valorUnico(objetoId, chave) {
      return valorUnicoBruto(objetoId, chave) ?? { tipo: 'texto', valor: '' };
    },

    acrescentar(objetoId, chave, valor) {
      const id = identificadorDoObjeto(objetoId);
      if (id === 0) {
        return 0;
      }
      const resultado = dados.escrever({
        texto:
          `INSERT INTO ${tabela} (${coluna}, meta_key, meta_value) ` +
          'VALUES (?, ?, ?)',
        parametros: [id, chave, paraColuna(valor)],
      });
      return resultado.idGerado ?? 0;
    },

    apagar(objetoId, chave) {
      const id = identificadorDoObjeto(objetoId);
      if (id === 0) {
        return 0;
      }

      // A ordem das condicoes e a do legado: `meta_key` primeiro, depois a
      // coluna do objeto, porque a segunda e concatenada a cadeia ja preparada
      // (`wp-includes/meta.php:456` e `:459`).
      const ids = dados
        .selecionar({
          texto:
            `SELECT ${linha} FROM ${tabela} ` +
            `WHERE meta_key = ? AND ${coluna} = ?`,
          parametros: [chave, id],
        })
        .map((bruta) => comoInteiro(bruta[linha]));

      if (ids.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto:
          `DELETE FROM ${tabela} ` +
          `WHERE ${linha} IN( ${ids.map(() => '?').join(',')} )`,
        parametros: ids,
      }).linhasAfetadas;
    },
  };
}

/**
 * `absint( $object_id )` e a guarda que vem depois dele:
 * `abs( (int) $maybeint )` (`wp-includes/load.php:1468`), e `if ( ! $object_id )
 * return false` (`wp-includes/meta.php:47` na escrita, `:633` na leitura e
 * `:406` na exclusao).
 *
 * ⚠️ **Identificador negativo nao e recusado: ele e espelhado.** `absint( -5 )`
 * e `5`, logo `add_post_meta( -5, ... )` grava o marcador no conteudo **5**. O
 * bloco de documentacao de `get_metadata_raw()` afirma o contrario — *"False for
 * an invalid `$object_id` (non-numeric, zero, or negative value)"* — e **o
 * codigo ganha**: o **P1** poe o comportamento observavel como especificacao,
 * nao a prosa que o acompanha. Fica reproduzido, e fica escrito, para que a
 * proxima tarefa nao o leia como defeito desta.
 */
function identificadorDoObjeto(objetoId: number): number {
  const inteiro = Math.trunc(objetoId);
  return Number.isNaN(inteiro) ? 0 : Math.abs(inteiro);
}

function lerValorDeMetadado(
  bruta: LinhaDeResultado,
  coluna: string,
): ValorDeMetadado {
  return {
    objetoId: comoInteiro(bruta[coluna]),
    chave: comoTexto(bruta['meta_key']),
    valor: comoBruto(bruta['meta_value']),
  };
}

/**
 * O valor lido de volta, como `get_*_meta()` o devolve: `maybe_unserialize()`
 * aplicado ao que estava na coluna (`wp-includes/functions.php:653`).
 *
 * Fica fora do tipo da linha de proposito. O criterio de paridade desta area e
 * **byte a byte no que foi gravado**, e a linha carrega os bytes; a
 * interpretacao e um passo a mais, que quem le pede quando precisa.
 */
export function valorDeMetadado(valor: ValorDeColuna): ValorPhp {
  if (valor === null) {
    return { tipo: 'nulo' };
  }
  if (typeof valor === 'number') {
    // Coluna `longtext` nao chega como numero em driver nenhum, mas a porta
    // admite o tipo: o legado trataria o valor como a cadeia decimal dele.
    return talvezDesserializar(String(valor));
  }
  return talvezDesserializar(valor);
}

/**
 * O valor como parametro de coluna, depois de `maybe_serialize()`.
 *
 * As coercoes de escalar sao as do legado no ponto em que o valor encontra a
 * coluna: nulo vira `NULL` de verdade (`meta_value` e a unica coluna anulavel da
 * familia, e `_insert_replace_helper()` troca o formato do campo quando o valor
 * e nulo, `wp-includes/class-wpdb.php:2602`), booleano vira `'1'` e `''`, e
 * numero vai como numero. O caso `arranjo` e inalcancavel — `talvezSerializar()`
 * o transformou em texto antes —, e segue tratado para que a funcao seja total.
 *
 * O instante do descarte passa por aqui como **inteiro**: `time()` nao e
 * serializado por `maybe_serialize()`, e o que chega a coluna `longtext` e a
 * cadeia decimal dele. E essa cadeia que `meta_value < %d` vai comparar na
 * coleta.
 */
function paraColuna(valor: ValorPhp): ValorDeParametro {
  const resolvido = talvezSerializar(valor);

  switch (resolvido.tipo) {
    case 'nulo':
      return null;
    case 'booleano':
      return resolvido.valor ? '1' : '';
    case 'inteiro':
    case 'decimal':
      return resolvido.valor;
    case 'texto':
      return resolvido.valor;
    case 'arranjo':
      return null;
  }
}
