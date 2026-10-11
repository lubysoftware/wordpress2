/**
 * A borda de `{site}postmeta` — as primitivas de par chave e valor que o
 * metadado do anexo usa.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`: e por estas
 * primitivas que *"o metadado que descreve as derivadas e gravado e lido pela
 * porta de dados"*. As operacoes com nome de negocio — metadado de derivadas,
 * arquivo anexado, tamanhos de backup — estao em `metadado-de-anexo.ts`, uma
 * camada acima; aqui ha so a tabela.
 *
 * **Por que a tabela de metadado aparece de novo neste contexto.** Nao e
 * duplicacao por descuido: `wp_update_attachment_metadata()` e
 * `update_attached_file()` **sao** `update_post_meta()`
 * (`wp-includes/post.php:7175` e `:902`), logo o anexo nao tem borda de
 * metadado propria no legado. A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e a porta de dados de cada contexto e a dele — o
 * mesmo preco que `portas/porta-de-dados.ts` ja declara ao redeclarar a porta.
 * `target_data_model.md` registra a mesma sobreposicao do lado do dado:
 * `MetadadoDeConteudo` tem como dono *"o aggregate possuidor"*, e os contextos
 * listados sao `BC-01 / BC-04 / BC-06 / BC-07`.
 *
 * ── CINCO COMPORTAMENTOS QUE SAO EFEITO NO BANCO, E ESTAO AQUI POR ISSO ────
 *
 * 1. **A chave aceita repeticao.** Nada no esquema impede duas linhas com o
 *    mesmo `post_id` e a mesma `meta_key` — as tres unicas garantias de
 *    unicidade do banco estao em outras tabelas (`DB-UNIQ`, BR-MIGRAR-076). Por
 *    isso a leitura devolve **lista**, e por isso {@link
 *    RepositorioDeMetadados.acrescentar} e {@link
 *    RepositorioDeMetadados.gravar} sao operacoes diferentes.
 * 2. **Gravar valor identico nao escreve nada.** Quando existe exatamente uma
 *    linha com aquela chave e o valor e o mesmo, `update_metadata()` devolve
 *    `false` e **nenhum comando de escrita sai** (`wp-includes/meta.php:255` a
 *    `:263`). Isso e visivel nesta feature a cada derivada: `_wp_make_subsizes()`
 *    grava o metadado **depois de cada tamanho** (`image.php:496`), e um porte
 *    que sempre escrevesse emitiria um `UPDATE` a mais por derivada. A
 *    comparacao e feita sobre o valor **antes** de serializar, com a igualdade
 *    estrita da origem (ver {@link mesmoValor}).
 * 3. **A escrita serializa quando o valor nao e escalar, e serializa de novo o
 *    texto que ja parece serializado.** E `maybe_serialize()`, e a dupla
 *    serializacao e observavel: BR-MIGRAR-082 (`DB-SER`) e literal — *"gravar a
 *    string `'a:1:{i:0;s:1:"b";}'` e le-la de volta devolve a string, nao o
 *    array"*. A regra mora em `plataforma/serializacao/talvez-serializar.ts`.
 * 4. **A exclusao por chave le os identificadores antes de apagar, e apaga por
 *    eles.** `delete_metadata()` faz `SELECT $id_column ...` e so entao
 *    `DELETE ... WHERE meta_id IN( ... )` (`wp-includes/meta.php:456` a
 *    `:514`). Dois comandos, nessa ordem, e **nenhum** quando o primeiro nao
 *    devolve linha.
 * 5. **Nao ha transacao** (BR-MIGRAR-104). Uma sequencia de escritas daqui pode
 *    falhar no meio e deixar estado parcial — e aqui o estado parcial e a
 *    regra, nao o defeito: e exatamente o metadado com derivada faltando que
 *    `M4` (BR-MIGRAR-060) produz, e o cenario `@divida-herdada` do teste de
 *    paridade cobra que *"o metadado gravado omite o tamanho que falhou,
 *    igualmente nas duas"*.
 *
 * ── UMA DIVERGENCIA DECLARADA, QUE NAO E DESTA TAREFA FECHAR ───────────────
 *
 * ⚠️ No legado, a leitura que alimenta a comparacao do item 2 passa pelo **cache
 * de objeto**: `get_metadata_raw()` chama `update_meta_cache()`, que carrega
 * *todas* as linhas daquele conteudo de uma vez — `SELECT post_id, meta_key,
 * meta_value FROM $table WHERE $column IN ($id_list) ORDER BY meta_id ASC`
 * (`wp-includes/meta.php:1204`) — e filtra a chave em memoria. Com o cache
 * quente, **nenhum** comando sai.
 *
 * {@link RepositorioDeMetadados.listar} reproduz essa cadeia e {@link
 * RepositorioDeMetadados.valoresDe} filtra em memoria, exatamente como a origem.
 * O que **nao** existe nesta arvore e o cache: a borda 5 de
 * `target_architecture.md` manda o cache de objeto **desligado nas duas
 * metades** durante a coexistencia, e o contexto do cenario de paridade desta
 * feature repete — *"o cache de objeto desligado nas duas metades"*. Logo o que
 * este arquivo emite e a sequencia de comandos do legado **com cache frio**, que
 * e a mesma que a comparacao vai ver.
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
import { tabelaDeMetadadosDeConteudo } from './chaves-e-tabelas.js';
import {
  comoBruto,
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

const CODIFICADOR = new TextEncoder();

/**
 * O que a leitura unica devolve quando a chave **nao existe**.
 *
 * `get_metadata_raw()` devolve `null` para chave ausente
 * (`wp-includes/meta.php:692`), e `get_metadata()` troca por
 * `get_metadata_default()`, que e **cadeia vazia** quando se pediu um valor so
 * (`wp-includes/meta.php:713` a `:714`). E por isso que `wp_get_attachment_metadata()`
 * consegue decidir com `! is_array( $data )`: o que chega la na ausencia e `''`,
 * nao arranjo vazio.
 *
 * ⚠️ Nao confundir com **chave presente e coluna nula**, que devolve
 * {@link ValorPhp} nulo. Os dois casos sao distinguiveis aqui porque sao
 * distinguiveis la.
 */
export const AUSENTE_NA_LEITURA_UNICA: ValorPhp = { tipo: 'texto', valor: '' };

/**
 * Uma linha de `postmeta` como a leitura em lote a devolve: **sem `meta_id`**.
 *
 * A ausencia e do legado: a consulta que alimenta o cache pede tres colunas
 * (`post_id`, `meta_key`, `meta_value`) e o identificador da linha nao esta
 * entre elas. Quem precisa dele o pede por {@link
 * RepositorioDeMetadados.idsDeMetadados}, que e o que `wp_delete_attachment()`
 * faz (`wp-includes/post.php:6884`).
 */
export interface ValorDeMetadado {
  readonly conteudoId: number;
  readonly chave: string;
  /** O valor **como esta na coluna**: bytes ou texto, sem interpretacao. */
  readonly valor: ValorDeColuna;
}

/** Uma linha de `postmeta` com as quatro colunas, lida pelo identificador dela. */
export interface MetadadoDeConteudo extends ValorDeMetadado {
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

export interface RepositorioDeMetadados {
  /**
   * Todas as linhas de um conteudo, na ordem de `meta_id` — a cadeia de
   * `update_meta_cache()` (`wp-includes/meta.php:1204`) para um identificador.
   *
   * O legado monta a lista do `IN` por **concatenacao de inteiros**, que
   * REQ-164 proibe; com marcador de parametro a cadeia enviada e a mesma.
   *
   * A ordem nao e enfeite: ela decide qual valor vence quando a chave se repete
   * e alguem pede "o valor" dela.
   */
  listar(conteudoId: number): readonly ValorDeMetadado[];
  /**
   * Os valores de uma chave, **filtrados em memoria** a partir de {@link
   * listar} — como `get_metadata_raw()` faz sobre o cache
   * (`wp-includes/meta.php:684` a `:690`). Uma consulta, nao duas.
   */
  valoresDe(conteudoId: number, chave: string): readonly ValorDeColuna[];
  /**
   * O **primeiro** valor da chave, desserializado — o `get_post_meta( ..., true )`
   * (`wp-includes/meta.php:686`).
   *
   * Chave ausente devolve {@link AUSENTE_NA_LEITURA_UNICA}. Chave repetida
   * devolve a primeira linha na ordem de `meta_id`, que e a ordem de {@link
   * listar}.
   */
  valorUnico(conteudoId: number, chave: string): ValorPhp;
  /**
   * `add_post_meta()`: **sempre insere**, inclusive quando a chave ja existe.
   *
   * Com `unico`, o legado pergunta antes — `SELECT COUNT(*) FROM $table WHERE
   * meta_key = %s AND $column = %d` (`wp-includes/meta.php:97`) — e **nao
   * insere** se ja houver linha, devolvendo `0`. A pergunta sai sempre que
   * `unico` e pedido, mesmo que ninguem va inserir. E com `unico` que o legado
   * grava `_wp_attachment_context` (`wp-includes/post.php:5130`).
   */
  acrescentar(
    conteudoId: number,
    chave: string,
    valor: ValorPhp,
    unico?: boolean,
  ): number;
  /**
   * `update_post_meta()`: insere se nao houver linha, atualiza **todas** as
   * linhas daquela chave se houver, e nao escreve nada se houver exatamente uma
   * com o mesmo valor (item 2 do cabecalho).
   *
   * `valorAnterior` reproduz o `$prev_value`: quando informado, a comparacao de
   * valor identico **nao acontece** (`if ( empty( $prev_value ) )`,
   * `wp-includes/meta.php:256`) e a atualizacao leva `meta_value` na condicao,
   * atingindo so as linhas que tem aquele valor.
   */
  gravar(
    conteudoId: number,
    chave: string,
    valor: ValorPhp,
    valorAnterior?: ValorPhp,
  ): ResultadoDaGravacaoDeMetadado;
  /**
   * `delete_post_meta()`: dois comandos, como no item 4 do cabecalho. Devolve as
   * linhas apagadas, e `0` quando nada foi encontrado — caso em que o `DELETE`
   * **nao sai**.
   */
  apagar(conteudoId: number, chave: string, valor?: ValorPhp): number;
  /**
   * `SELECT meta_id FROM {site}postmeta WHERE post_id = ? ` — a consulta que
   * `wp_delete_attachment()` faz antes de apagar uma linha por vez
   * (`wp-includes/post.php:6884`).
   *
   * ⚠️ O espaco antes do fecho da cadeia e do legado, e esta aqui de proposito:
   * o texto do comando e o que a area 3 da Decisao 2 compara.
   */
  idsDeMetadados(conteudoId: number): readonly number[];
  /**
   * `SELECT * FROM {site}postmeta WHERE meta_id = ?`
   * (`wp-includes/meta.php:861`).
   *
   * No legado esta leitura existe **para alimentar o gancho** que a exclusao por
   * identificador dispara antes de apagar: `delete_metadata_by_mid()` le a linha
   * e so depois a apaga. Os dois comandos, nessa ordem, sao o que o laco de
   * `wp_delete_attachment()` emite por linha de metadado — e e por isso que os
   * dois sao metodos separados aqui: quem ordena e o fluxo que apaga (T017).
   */
  obterPorId(metadadoId: number): MetadadoDeConteudo | null;
  /** `DELETE FROM {site}postmeta WHERE meta_id = ?` (`wp-includes/meta.php:1089`). */
  apagarPorId(metadadoId: number): number;
}

export function criarRepositorioDeMetadados(
  dados: PortaDeDados,
): RepositorioDeMetadados {
  const tabela = tabelaDeMetadadosDeConteudo(dados);

  function listar(conteudoId: number): readonly ValorDeMetadado[] {
    return dados
      .selecionar({
        texto:
          `SELECT post_id, meta_key, meta_value FROM ${tabela} ` +
          'WHERE post_id IN (?) ORDER BY meta_id ASC',
        parametros: [conteudoId],
      })
      .map(lerValorDeMetadado);
  }

  function valoresDe(
    conteudoId: number,
    chave: string,
  ): readonly ValorDeColuna[] {
    return listar(conteudoId)
      .filter((linha) => linha.chave === chave)
      .map((linha) => linha.valor);
  }

  function idsDe(conteudoId: number, chave: string): number[] {
    return dados
      .selecionar({
        texto: `SELECT meta_id FROM ${tabela} WHERE meta_key = ? AND post_id = ?`,
        parametros: [chave, conteudoId],
      })
      .map((linha) => comoInteiro(linha['meta_id']));
  }

  function inserir(conteudoId: number, chave: string, valor: ValorPhp): number {
    const resultado = dados.escrever({
      texto: `INSERT INTO ${tabela} (post_id, meta_key, meta_value) VALUES (?, ?, ?)`,
      parametros: [conteudoId, chave, paraColuna(valor)],
    });
    return resultado.idGerado ?? 0;
  }

  return {
    listar,
    valoresDe,

    valorUnico(conteudoId, chave) {
      const valores = valoresDe(conteudoId, chave);
      if (valores.length === 0) {
        return AUSENTE_NA_LEITURA_UNICA;
      }
      return valorDeMetadado(valores[0] as ValorDeColuna);
    },

    acrescentar(conteudoId, chave, valor, unico = false) {
      if (unico) {
        const quantas = comoInteiro(
          primeiroValor(
            dados.selecionar({
              texto: `SELECT COUNT(*) FROM ${tabela} WHERE meta_key = ? AND post_id = ?`,
              parametros: [chave, conteudoId],
            }),
          ),
        );
        if (quantas > 0) {
          return 0;
        }
      }
      return inserir(conteudoId, chave, valor);
    },

    gravar(conteudoId, chave, valor, valorAnterior) {
      // A comparacao de valor identico so acontece quando nao ha valor
      // anterior informado, e so quando a chave existe UMA vez.
      if (valorAnterior === undefined) {
        const existentes = valoresDe(conteudoId, chave);
        if (
          existentes.length === 1 &&
          mesmoValor(existentes[0] as ValorDeColuna, valor)
        ) {
          return { gravou: false, acrescentadoComId: null };
        }
      }

      const ids = idsDe(conteudoId, chave);
      if (ids.length === 0) {
        // `update_metadata()` delega para `add_metadata()`, sem `unique`:
        // insere mesmo que outra chave igual apareca entre os dois comandos.
        const id = inserir(conteudoId, chave, valor);
        return { gravou: id !== 0, acrescentadoComId: id };
      }

      const parametros: ValorDeParametro[] = [
        paraColuna(valor),
        conteudoId,
        chave,
      ];
      let condicao = 'WHERE post_id = ? AND meta_key = ?';
      if (valorAnterior !== undefined) {
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

    apagar(conteudoId, chave, valor) {
      const parametros: ValorDeParametro[] = [chave, conteudoId];
      let texto = `SELECT meta_id FROM ${tabela} WHERE meta_key = ? AND post_id = ?`;
      if (valor !== undefined) {
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

    idsDeMetadados(conteudoId) {
      return dados
        .selecionar({
          texto: `SELECT meta_id FROM ${tabela} WHERE post_id = ? `,
          parametros: [conteudoId],
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
      return {
        id: comoInteiro(linha['meta_id']),
        ...lerValorDeMetadado(linha),
      };
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
    conteudoId: comoInteiro(linha['post_id']),
    chave: comoTexto(linha['meta_key']),
    valor: comoBruto(linha['meta_value']),
  };
}

/**
 * O valor lido de volta, como `get_post_meta()` o devolve: `maybe_unserialize()`
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
 * As quatro coercoes de escalar sao as do legado no ponto em que o valor
 * encontra a coluna:
 *
 * - **nulo** vira `NULL` de verdade: `_insert_replace_helper()` troca o formato
 *   do campo por `'NULL'` quando o valor e nulo
 *   (`wp-includes/class-wpdb.php:2601`), e `meta_value` e a unica coluna
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
 * (`wp-includes/meta.php:256` a `:262`).
 *
 * Tres consequencias do `===` que um `==` ou um `JSON.stringify` perderiam:
 * inteiro e decimal **nao** sao iguais (`1 !== 1.0`), arranjo e igual so com as
 * mesmas chaves **na mesma ordem** e com os mesmos tipos, e texto compara byte a
 * byte — por isso a comparacao de texto aqui e feita em bytes, nao em `string`.
 *
 * ⚠️ A regra do arranjo e o que faz a gravacao do metadado de derivadas pular o
 * `UPDATE` quando nada mudou: duas derivadas com os mesmos campos **em ordem
 * diferente** sao valores diferentes, e o legado escreveria.
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

function mesmosBytes(a: string | Uint8Array, b: string | Uint8Array): boolean {
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
