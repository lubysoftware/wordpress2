/**
 * A forma de armazenamento do metadado do comentario — a tabela `commentmeta`.
 *
 * A secao *Modelo de dados* do `plan.md` descreve esta tabela em duas colunas de
 * tabela, e as duas sao regra: guarda *"metadado, incluindo o estado anterior ao
 * descarte"*, e o que muda no modelo novo e **"sem mudanca"**.
 *
 * Em `commentmeta` a frase "sem mudanca" tem um peso que em `postmeta` nao tem:
 * e aqui que CA-11.1 e CA-11.2 moram. O descarte grava duas linhas e a
 * restauracao as le — `_wp_trash_meta_status` com o estado anterior e
 * `_wp_trash_meta_time` com o instante (`wp-includes/comment.php:1689` a
 * `:1692`) —, e a restauracao sem estado gravado **volta para a fila**, nao para
 * aprovado (`:1755` a `:1758`, CA-11.3). Ver {@link CHAVES_DO_DESCARTE}.
 *
 * ── CINCO COMPORTAMENTOS QUE SAO EFEITO NO BANCO, E ESTAO AQUI POR ISSO ────
 *
 * As quatro funcoes de metadado de comentario sao **repasse direto** para a
 * maquina generica de `wp-includes/meta.php`, com `'comment'` como tipo
 * (`comment.php:528`, `:552`, `:581`, `:624`): a tabela e `commentmeta`, a
 * coluna do objeto e `comment_id` e a do identificador e `meta_id` — `umeta_id`
 * e so de `usermeta` (`meta.php:216`). Logo os cinco comportamentos abaixo sao
 * os mesmos de `postmeta`, e estao reproduzidos aqui porque sao os desta tabela:
 *
 * 1. **A chave aceita repeticao.** Nada no esquema impede duas linhas com o
 *    mesmo `comment_id` e a mesma `meta_key` — as tres unicas garantias de
 *    unicidade do banco estao em outras tabelas (`DB-UNIQ`). Por isso a leitura
 *    devolve **lista**, e por isso `acrescentar` e `gravar` sao operacoes
 *    diferentes e nao uma so com bandeira.
 * 2. **Gravar valor identico nao escreve nada.** Quando existe exatamente uma
 *    linha com aquela chave e o valor e o mesmo, `update_metadata()` devolve
 *    `false` e **nenhum comando de escrita sai** (`meta.php:255` a `:263`). Um
 *    porte que sempre escrevesse mudaria o efeito no banco de toda requisicao
 *    que "salva sem mudar nada".
 * 3. **A escrita serializa quando o valor nao e escalar, e serializa de novo o
 *    texto que ja parece serializado.** E `maybe_serialize()`, e a dupla
 *    serializacao e observavel: BR-MIGRAR-082 (`DB-SER`) e literal — *"gravar a
 *    string `'a:1:{i:0;s:1:"b";}'` e le-la de volta devolve a string, nao o
 *    array"*. A regra mora em `plataforma/serializacao/talvez-serializar.ts`.
 * 4. **A exclusao por chave le os identificadores antes de apagar, e apaga por
 *    eles.** `delete_metadata()` faz `SELECT meta_id ...` e so entao
 *    `DELETE ... WHERE meta_id IN( ... )` (`meta.php:456` a `:514`). Dois
 *    comandos, nessa ordem, e **nenhum** quando o primeiro nao devolve linha.
 * 5. **Nao ha transacao** (BR-MIGRAR-104). Uma sequencia de escritas daqui pode
 *    falhar no meio e deixar estado parcial — e o estado parcial e a regra, nao
 *    o defeito. No descarte isso tem nome: `wp_trash_comment()` emite
 *    `delete`, `delete`, `add`, `add` em sequencia, sem nada que as agrupe.
 *
 * ── DUAS DIFERENCAS DELIBERADAS EM RELACAO AO GEMEO DE BC-01 ───────────────
 *
 * `armazenamento/metadado.ts` de BC-01 reproduz a mesma maquina, e este arquivo
 * **nao e copia dele**: duas condicoes que no gemeo viraram `=== undefined` sao, no
 * legado, testes de PHP com resultado diferente. As duas mudam qual comando sai,
 * logo as duas sao "efeito no banco" (Decisao 2, area 3):
 *
 * - **A clausula de valor na exclusao e um teste de tres valores**, nao a
 *   presenca do argumento: `'' !== $meta_value && null !== $meta_value && false
 *   !== $meta_value` (`meta.php:462`). Como `delete_comment_meta()` tem
 *   `$meta_value = ''` por default (`comment.php:552`), passar texto vazio e
 *   **nao passar nada** emitem a mesma consulta. Ver {@link valorEntraNaClausula}.
 * - **A comparacao de valor identico e desligada por `empty( $prev_value )`**,
 *   nao por ausencia (`meta.php:256`). `empty()` em PHP e verdadeiro para `''`,
 *   `0`, `0.0`, `false`, `null`, `'0'` e arranjo vazio — e `'0'` nessa lista e o
 *   caso que surpreende: pedir a atualizacao com valor anterior `'0'` se
 *   comporta como se nenhum valor anterior tivesse sido pedido. Ver
 *   {@link vazioComoNoPhp}.
 *
 * As duas funcoes ficam neste arquivo e nao em `plataforma/`: a regra de
 * dependencia 3 proibe um contexto importar outro, e ha uma `vazioComoNoPhp` em
 * `contextos/leitura-publica/consulta/semantica-de-php.ts` que **nao** pode ser
 * importada daqui. Descer para `plataforma/` e decisao de quem construir
 * `015-plataforma-transversal`, nao desta tarefa.
 *
 * ── UMA DIVERGENCIA DECLARADA, QUE NAO E DESTA TAREFA FECHAR ───────────────
 *
 * ⚠️ No legado, a leitura que alimenta a comparacao do item 2 passa pelo **cache
 * de objeto**: `get_metadata_raw()` chama `update_meta_cache()`, que carrega
 * *todas* as linhas daquele comentario de uma vez — `SELECT comment_id,
 * meta_key, meta_value FROM $table WHERE comment_id IN ($id_list) ORDER BY
 * meta_id ASC` (`meta.php:1204`) — e filtra a chave em memoria. Com o cache
 * quente, **nenhum** comando sai.
 *
 * {@link RepositorioDeMetadadosDeComentario.listar} reproduz essa cadeia, e
 * `valoresDe` filtra em memoria em vez de consultar por chave, exatamente como a
 * origem. O que **nao** existe nesta arvore e o cache: o slot `cache` do plano
 * recomenda cache por requisicao em memoria do processo, REQ-165 ficou fora do
 * pacote, e a borda 5 de `target_architecture.md` manda o cache **desligado nas
 * duas metades** durante a coexistencia. Logo o que este arquivo emite e a
 * sequencia de comandos do legado **com cache frio**, que e a mesma sequencia
 * que a comparacao de paridade vai ver, porque ela tambem roda com o cache
 * desligado — o `Contexto` de `PT-001` o exige: *"o cache de objeto desligado
 * nas duas metades"*.
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
import { tabelaDeMetadadosDeComentario } from './chaves-e-tabelas.js';
import {
  comoBruto,
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

const CODIFICADOR = new TextEncoder();

/**
 * As duas chaves que o descarte grava e a restauracao le, com o nome do legado.
 *
 * Estao nomeadas porque sao **o par que CA-11.1 cobra** — *"o descarte guarda o
 * estado anterior e o instante, junto do comentario"* — e porque o legado grava
 * as duas em dois caminhos: a lixeira (`comment.php:1691`) e o spam
 * (`:1807` a `:1810`), que apaga as duas antes e as grava de novo, exatamente como a
 * lixeira. O prefixo `_` e convencao do produto para metadado protegido, e nao
 * ha registro que o cobre: e nome, nao esquema.
 *
 * ⚠️ **Nao estao aqui como operacao.** Quem as grava e T024 (US-11), que tem de
 * emitir a sequencia `delete`, `delete`, `add`, `add` do legado — e nao um
 * `gravar`, que emitiria `UPDATE`. A terceira chave do assunto,
 * `_wp_trash_meta_comments_status`, nao esta nesta lista porque **nao e desta
 * tabela**: ela vive em `postmeta`, no conteudo (`wp-includes/post.php:4299`).
 */
export const CHAVES_DO_DESCARTE = Object.freeze({
  /** O valor de `comment_approved` antes do descarte. */
  estadoAnterior: '_wp_trash_meta_status',
  /** O instante do descarte, em segundos, como `time()` o devolve. */
  instante: '_wp_trash_meta_time',
} as const);

/**
 * Uma linha de `commentmeta` como a leitura em lote a devolve: **sem `meta_id`**.
 *
 * A ausencia e do legado, nao economia daqui: a consulta que alimenta o cache
 * pede tres colunas (`comment_id`, `meta_key`, `meta_value`) e o identificador
 * da linha nao esta entre elas. Quem precisa dele o pede por
 * {@link RepositorioDeMetadadosDeComentario.idsDeMetadados}, que e o que
 * `wp_delete_comment()` faz (`wp-includes/comment.php:1597`).
 */
export interface ValorDeMetadado {
  readonly comentarioId: number;
  readonly chave: string;
  /** O valor **como esta na coluna**: bytes ou texto, sem interpretacao. */
  readonly valor: ValorDeColuna;
}

/** Uma linha de `commentmeta` com as quatro colunas, lida pelo identificador dela. */
export interface MetadadoDeComentario extends ValorDeMetadado {
  readonly id: number;
}

/**
 * O que `gravar` informa de volta, nos tres casos da origem.
 *
 * `update_metadata()` devolve `int|bool`: o identificador novo quando a chave
 * nao existia e virou insercao, `true` quando atualizou, e `false` quando nao
 * gravou nada. Os tres sao distinguiveis aqui porque os tres sao **efeitos no
 * banco diferentes** — um insere, um atualiza, um nao emite comando.
 */
export interface ResultadoDaGravacaoDeMetadado {
  /** `false` e o caso 2 do cabecalho: valor identico, nenhuma escrita. */
  readonly gravou: boolean;
  /** O identificador da linha, quando a gravacao foi uma **insercao**. */
  readonly acrescentadoComId: number | null;
}

export interface RepositorioDeMetadadosDeComentario {
  /**
   * Todas as linhas de um comentario, na ordem de `meta_id`.
   *
   * `SELECT comment_id, meta_key, meta_value FROM {site}commentmeta WHERE
   * comment_id IN (?) ORDER BY meta_id ASC` — a cadeia de `update_meta_cache()`
   * (`wp-includes/meta.php:1204`) para um identificador. O legado monta a lista
   * do `IN` por **concatenacao de inteiros**, que REQ-164 proibe; com marcador
   * de parametro a cadeia enviada e a mesma.
   *
   * A ordem nao e enfeite: ela decide qual valor vence quando a chave se repete
   * e alguem pede "o valor" dela.
   */
  listar(comentarioId: number): readonly ValorDeMetadado[];
  /**
   * Os valores de uma chave, **filtrados em memoria** a partir de
   * {@link RepositorioDeMetadadosDeComentario.listar} — como
   * `get_metadata_raw()` faz sobre o cache (`wp-includes/meta.php:684`). Uma
   * consulta, nao duas.
   */
  valoresDe(comentarioId: number, chave: string): readonly ValorDeColuna[];
  /**
   * `add_comment_meta()`: **sempre insere**, inclusive quando a chave ja existe.
   *
   * Com `unico`, o legado pergunta antes — `SELECT COUNT(*) FROM $table WHERE
   * meta_key = %s AND comment_id = %d` (`wp-includes/meta.php:97`) — e **nao
   * insere** se ja houver linha, devolvendo `0`. A pergunta sai sempre que
   * `unico` e pedido, mesmo que ninguem va inserir.
   *
   * ⚠️ `unico` nao e detalhe: `wp_insert_comment()` grava o metadado que chega
   * junto do comentario com `unique = true` (`comment.php:2222`), ao contrario
   * de `wp_update_comment()`, que usa `update_comment_meta()` (`:2996`).
   */
  acrescentar(
    comentarioId: number,
    chave: string,
    valor: ValorPhp,
    unico?: boolean,
  ): number;
  /**
   * `update_comment_meta()`: insere se nao houver linha, atualiza **todas** as
   * linhas daquela chave se houver, e nao escreve nada se houver exatamente uma
   * com o mesmo valor.
   *
   * `valorAnterior` reproduz o `$prev_value`, com a semantica de `empty()` do
   * legado e nao com a de "argumento ausente": quando ele e informado **e nao e
   * vazio como no PHP**, a comparacao de valor identico nao acontece
   * (`meta.php:256`) e a atualizacao leva `meta_value` na condicao, atingindo so
   * as linhas que tem aquele valor (`:279`). Ver {@link vazioComoNoPhp}.
   */
  gravar(
    comentarioId: number,
    chave: string,
    valor: ValorPhp,
    valorAnterior?: ValorPhp,
  ): ResultadoDaGravacaoDeMetadado;
  /**
   * `delete_comment_meta()`: dois comandos, como no item 4 do cabecalho. Devolve
   * as linhas apagadas, e `0` quando nada foi encontrado — caso em que o
   * `DELETE` **nao sai**.
   *
   * A clausula de `meta_value` entra pelo teste de tres valores do legado, nao
   * pela presenca do argumento: ver {@link valorEntraNaClausula}.
   */
  apagar(comentarioId: number, chave: string, valor?: ValorPhp): number;
  /**
   * `SELECT meta_id FROM {site}commentmeta WHERE comment_id = ?` — a consulta
   * que `wp_delete_comment()` faz antes de apagar uma linha por vez
   * (`wp-includes/comment.php:1597`).
   */
  idsDeMetadados(comentarioId: number): readonly number[];
  /**
   * `SELECT * FROM {site}commentmeta WHERE meta_id = ?`
   * (`wp-includes/meta.php:861`).
   *
   * No legado esta leitura existe **para alimentar o gancho** que a exclusao por
   * identificador dispara antes de apagar: `delete_metadata_by_mid()` le a linha
   * e so depois a apaga. Os dois comandos, nessa ordem, sao o que o caminho de
   * exclusao emite — e e por isso que os dois sao metodos separados aqui: quem
   * ordena e o fluxo que apaga, nao o armazenamento.
   */
  obterPorId(metadadoId: number): MetadadoDeComentario | null;
  /** `DELETE FROM {site}commentmeta WHERE meta_id = ?` (`wp-includes/meta.php:1089`). */
  apagarPorId(metadadoId: number): number;
}

export function criarRepositorioDeMetadadosDeComentario(
  dados: PortaDeDados,
): RepositorioDeMetadadosDeComentario {
  const tabela = tabelaDeMetadadosDeComentario(dados);

  function listar(comentarioId: number): readonly ValorDeMetadado[] {
    return dados
      .selecionar({
        texto:
          `SELECT comment_id, meta_key, meta_value FROM ${tabela} ` +
          'WHERE comment_id IN (?) ORDER BY meta_id ASC',
        parametros: [comentarioId],
      })
      .map(lerValorDeMetadado);
  }

  function valoresDe(
    comentarioId: number,
    chave: string,
  ): readonly ValorDeColuna[] {
    return listar(comentarioId)
      .filter((linha) => linha.chave === chave)
      .map((linha) => linha.valor);
  }

  function idsDe(comentarioId: number, chave: string): number[] {
    return dados
      .selecionar({
        texto: `SELECT meta_id FROM ${tabela} WHERE meta_key = ? AND comment_id = ?`,
        parametros: [chave, comentarioId],
      })
      .map((linha) => comoInteiro(linha['meta_id']));
  }

  function inserir(
    comentarioId: number,
    chave: string,
    valor: ValorPhp,
  ): number {
    const resultado = dados.escrever({
      texto:
        `INSERT INTO ${tabela} (comment_id, meta_key, meta_value) VALUES (?, ?, ?)`,
      parametros: [comentarioId, chave, paraColuna(valor)],
    });
    return resultado.idGerado ?? 0;
  }

  return {
    listar,
    valoresDe,

    acrescentar(comentarioId, chave, valor, unico = false) {
      if (unico) {
        const quantas = comoInteiro(
          primeiroValor(
            dados.selecionar({
              texto: `SELECT COUNT(*) FROM ${tabela} WHERE meta_key = ? AND comment_id = ?`,
              parametros: [chave, comentarioId],
            }),
          ),
        );
        if (quantas > 0) {
          return 0;
        }
      }
      return inserir(comentarioId, chave, valor);
    },

    gravar(comentarioId, chave, valor, valorAnterior) {
      // A comparacao de valor identico so acontece quando o valor anterior e
      // VAZIO COMO NO PHP — e nao quando o argumento falta —, e so quando a
      // chave existe UMA vez (`meta.php:256` a `:263`).
      if (valorAnterior === undefined || vazioComoNoPhp(valorAnterior)) {
        const existentes = valoresDe(comentarioId, chave);
        if (
          existentes.length === 1 &&
          mesmoValor(existentes[0] as ValorDeColuna, valor)
        ) {
          return { gravou: false, acrescentadoComId: null };
        }
      }

      const ids = idsDe(comentarioId, chave);
      if (ids.length === 0) {
        // `update_metadata()` delega para `add_metadata()`, sem `unique`:
        // insere mesmo que outra chave igual apareca entre os dois comandos.
        const id = inserir(comentarioId, chave, valor);
        return { gravou: id !== 0, acrescentadoComId: id };
      }

      const parametros: ValorDeParametro[] = [
        paraColuna(valor),
        comentarioId,
        chave,
      ];
      let condicao = 'WHERE comment_id = ? AND meta_key = ?';
      if (valorAnterior !== undefined && !vazioComoNoPhp(valorAnterior)) {
        condicao += ' AND meta_value = ?';
        parametros.push(paraColuna(valorAnterior));
      }

      const resultado = dados.escrever({
        texto: `UPDATE ${tabela} SET meta_value = ? ${condicao}`,
        parametros,
      });
      return {
        gravou: resultado.linhasAfetadas > 0,
        acrescentadoComId: null,
      };
    },

    apagar(comentarioId, chave, valor) {
      const parametros: ValorDeParametro[] = [chave, comentarioId];
      let texto = `SELECT meta_id FROM ${tabela} WHERE meta_key = ? AND comment_id = ?`;
      if (valor !== undefined && valorEntraNaClausula(valor)) {
        texto += ' AND meta_value = ?';
        parametros.push(paraColuna(valor));
      }

      const ids = dados
        .selecionar({ texto, parametros })
        .map((linha) => comoInteiro(linha['meta_id']));

      if (ids.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto:
          `DELETE FROM ${tabela} ` +
          `WHERE meta_id IN( ${ids.map(() => '?').join(', ')} )`,
        parametros: ids,
      }).linhasAfetadas;
    },

    idsDeMetadados(comentarioId) {
      return dados
        .selecionar({
          texto: `SELECT meta_id FROM ${tabela} WHERE comment_id = ?`,
          parametros: [comentarioId],
        })
        .map((linha) => comoInteiro(linha['meta_id']));
    },

    obterPorId(metadadoId) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE meta_id = ?`,
          parametros: [metadadoId],
        }),
      );
      if (linha === null) {
        return null;
      }
      return { id: comoInteiro(linha['meta_id']), ...lerValorDeMetadado(linha) };
    },

    apagarPorId(metadadoId) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE meta_id = ?`,
        parametros: [metadadoId],
      }).linhasAfetadas;
    },
  };
}

function lerValorDeMetadado(linha: LinhaDeResultado): ValorDeMetadado {
  return {
    comentarioId: comoInteiro(linha['comment_id']),
    chave: comoTexto(linha['meta_key']),
    valor: comoBruto(linha['meta_value']),
  };
}

/**
 * O valor lido de volta, como `get_comment_meta()` o devolve:
 * `maybe_unserialize()` aplicado ao que estava na coluna
 * (`wp-includes/functions.php:653`).
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
 * `empty()` do PHP sobre um {@link ValorPhp}.
 *
 * Vale **verdadeiro** para `null`, `false`, `0`, `0.0`, `''`, `'0'` e arranjo
 * vazio. A entrada `'0'` e a que surpreende, e e a que importa aqui: ela faz
 * `update_comment_meta( $id, $chave, $novo, '0' )` se comportar como se nenhum
 * valor anterior tivesse sido pedido — a comparacao de valor identico volta a
 * acontecer e o `UPDATE` sai **sem** a clausula de `meta_value`.
 *
 * Nao e o mesmo teste de {@link valorEntraNaClausula}, e as duas divergem em
 * quatro valores: `'0'`, `0`, `0.0` e arranjo vazio sao vazios aqui e entram na
 * clausula la.
 */
export function vazioComoNoPhp(valor: ValorPhp): boolean {
  switch (valor.tipo) {
    case 'nulo':
      return true;
    case 'booleano':
      return !valor.valor;
    case 'inteiro':
    case 'decimal':
      return valor.valor === 0;
    case 'texto': {
      const texto = textoDoValor(valor.valor);
      return texto === '' || texto === '0';
    }
    case 'arranjo':
      return valor.entradas.length === 0;
  }
}

/**
 * Se a clausula `AND meta_value = %s` entra na consulta de exclusao.
 *
 * E o teste literal de `delete_metadata()`, feito **depois** de
 * `maybe_serialize()`: `'' !== $meta_value && null !== $meta_value && false !==
 * $meta_value` (`wp-includes/meta.php:462`). Sao tres valores, comparados com
 * `!==`, logo `'0'` e `0` **entram** na clausula.
 *
 * Como `delete_comment_meta()` declara `$meta_value = ''` por default
 * (`wp-includes/comment.php:552`), nao passar valor e passar texto vazio
 * produzem a **mesma** consulta — e e por isso que este teste existe em lugar de
 * olhar se o argumento chegou.
 */
export function valorEntraNaClausula(valor: ValorPhp): boolean {
  const resolvido = talvezSerializar(valor);
  switch (resolvido.tipo) {
    case 'nulo':
      return false;
    case 'booleano':
      return resolvido.valor;
    case 'texto':
      return textoDoValor(resolvido.valor) !== '';
    case 'inteiro':
    case 'decimal':
      return true;
    case 'arranjo':
      // Inalcancavel: `talvezSerializar` transformou o arranjo em texto.
      return true;
  }
}

/**
 * O valor como parametro de coluna, depois de `maybe_serialize()`.
 *
 * As quatro coercoes de escalar sao as do legado no ponto em que o valor
 * encontra a coluna, e nao invencao daqui:
 *
 * - **nulo** vira `NULL` de verdade: `_insert_replace_helper()` troca o formato
 *   do campo por `'NULL'` quando o valor e nulo
 *   (`wp-includes/class-wpdb.php:2602`), e `meta_value` e a unica coluna
 *   anulavel da familia.
 * - **booleano** vira `'1'` e `''`, que e a cadeia que o `(string)` do PHP
 *   produz no marcador `%s`.
 * - **inteiro e decimal** vao como numero, e a coercao de formato por coluna e
 *   da camada de dados (`DB-DEG`).
 * - **arranjo** nao chega aqui como arranjo: `talvezSerializar()` o transformou
 *   em texto antes. O caso segue tratado para que a funcao seja total.
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

/**
 * A igualdade que o legado usa na comparacao de valor identico: `===` do PHP
 * entre o valor **desserializado** da coluna e o valor novo, antes de serializar
 * (`wp-includes/meta.php:255` a `:263`).
 *
 * Tres consequencias do `===`, que um `==` ou um `JSON.stringify` perderiam:
 * inteiro e decimal **nao** sao iguais (`1 !== 1.0`), arranjo e igual so com as
 * mesmas chaves **na mesma ordem** e com os mesmos tipos, e texto compara byte a
 * byte — por isso a comparacao de texto aqui e feita em bytes, nao em `string`.
 */
function mesmoValor(gravado: ValorDeColuna, novo: ValorPhp): boolean {
  return iguais(valorDeMetadado(gravado), novo);
}

function iguais(a: ValorPhp, b: ValorPhp): boolean {
  if (a.tipo !== b.tipo) {
    return false;
  }
  switch (a.tipo) {
    case 'nulo':
      return true;
    case 'booleano':
      return a.valor === (b as typeof a).valor;
    case 'inteiro':
    case 'decimal':
      return a.valor === (b as typeof a).valor;
    case 'texto':
      return mesmosBytes(a.valor, (b as typeof a).valor);
    case 'arranjo': {
      const outro = (b as typeof a).entradas;
      if (a.entradas.length !== outro.length) {
        return false;
      }
      return a.entradas.every((entrada, indice) => {
        const par = outro[indice] as (typeof outro)[number];
        if (entrada.chave.tipo !== par.chave.tipo) {
          return false;
        }
        const mesmaChave =
          entrada.chave.tipo === 'inteiro'
            ? entrada.chave.valor === par.chave.valor
            : mesmosBytes(
                entrada.chave.valor,
                par.chave.valor as string | Uint8Array,
              );
        return mesmaChave && iguais(entrada.valor, par.valor);
      });
    }
  }
}

/** Bytes de um texto do codec como `string`, para os testes de vazio do PHP. */
function textoDoValor(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : new TextDecoder().decode(valor);
}

function mesmosBytes(
  a: string | Uint8Array,
  b: string | Uint8Array,
): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  const bytesA = typeof a === 'string' ? CODIFICADOR.encode(a) : a;
  const bytesB = typeof b === 'string' ? CODIFICADOR.encode(b) : b;
  if (bytesA.length !== bytesB.length) {
    return false;
  }
  return bytesA.every((byte, indice) => byte === bytesB[indice]);
}
