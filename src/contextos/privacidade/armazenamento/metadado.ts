/**
 * A borda de `{site}postmeta` — as tres primitivas de par chave e valor que o
 * caminho da privacidade usa, e **nenhuma a mais**.
 *
 * Entrega de **T002** da feature `008-privacidade-e-dados-pessoais`: e por
 * aqui que os dois instantes da solicitacao — confirmacao e conclusao — sao
 * *"lidos e gravados pela porta de dados"*. Os nomes das chaves estao em
 * `./chaves-e-tabelas.ts`; quem decide **quando** gravar cada uma e a tarefa da
 * historia dela (T005, T011, T013).
 *
 * **Por que a tabela de metadado aparece de novo neste contexto.** Nao e
 * duplicacao por descuido: `target_data_model.md` poe `MetadadoDeConteudo` com
 * dono *"o aggregate possuidor"* e lista `BC-01 / BC-04 / BC-06 / BC-07`, logo a
 * sobreposicao e do dado. A regra de dependencia 3 de `target_architecture.md`
 * proibe `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*, e a
 * porta de dados de cada contexto e a dele — o mesmo preco que
 * `../portas/porta-de-dados.ts` ja declara ao redeclarar a porta. Este arquivo
 * e o irmao de `contextos/midia/armazenamento/metadado.ts`, com **tres** metodos
 * em vez de nove: ver a secao final.
 *
 * ── TRES COMPORTAMENTOS QUE SAO EFEITO NO BANCO, E ESTAO AQUI POR ISSO ─────
 *
 * 1. **A chave aceita repeticao.** Nada no esquema impede duas linhas com o
 *    mesmo `post_id` e a mesma `meta_key` — as tres unicas garantias de
 *    unicidade do banco estao em outras tabelas (`DB-UNIQ`, BR-MIGRAR-076). Por
 *    isso {@link RepositorioDeMetadados.listar} devolve **lista** e a leitura
 *    unica devolve a primeira na ordem de `meta_id`.
 * 2. **Gravar valor identico nao escreve nada — e "identico" e o `===` do PHP.**
 *    Quando existe exatamente uma linha com aquela chave e o valor e o mesmo,
 *    `update_metadata()` devolve `false` e **nenhum comando de escrita sai**
 *    (`wp-includes/meta.php:255` a `:263`). A comparacao e feita **depois** de
 *    `maybe_unserialize` sobre o lido e **antes** de `maybe_serialize` sobre o
 *    novo (`:257` e `:271`), logo e igualdade entre valores do PHP e nao entre
 *    bytes — e por isso ela funciona para arranjo, que e o caso de
 *    `_export_data_raw` em T011.
 *
 *    ⚠️ **E por isso ela NAO dispara para os dois instantes desta feature.** A
 *    coluna devolve numero como **texto** — o docblock de `get_metadata()` e
 *    literal, *"numbers (both integer and float) are returned as strings"*
 *    (`wp-includes/meta.php:598`) — e `update_post_meta` recebe `time()`, que e
 *    **inteiro** (`user.php:4256`, `privacy-tools.php:55`). O `===` compara tipo
 *    antes de valor, a comparacao e falsa, e o `UPDATE` sai **mesmo quando o
 *    instante gravado e exatamente o mesmo**. Um porte que comparasse por
 *    coercao suprimiria um comando que o legado emite, e a area 3 da Decisao 2
 *    compara *"snapshot + sequencia de comandos"* com zero tolerancia. A
 *    idempotencia que o cenario `@idempotencia` de `PT-012` cobra vem de outro
 *    lugar — do estado da solicitacao e das duas chaves `_wp_*_notified` —,
 *    nao daqui.
 * 3. **Nao ha transacao** (BR-MIGRAR-104: zero `START TRANSACTION` e zero
 *    `COMMIT` em 1.467 arquivos). E nesta feature a ausencia tem nome: o
 *    instante de confirmacao e gravado **antes** da mudanca de estado
 *    (`wp-includes/user.php:4256` e `:4257`), em comandos separados, e o mesmo
 *    vale para o de conclusao (`wp-admin/includes/privacy-tools.php:55` e
 *    `:57`). Entre os dois comandos existe um estado em que o instante esta
 *    gravado e o estado nao mudou, e ele e observavel. Envolver os dois em
 *    transacao mudaria isso; e a assimetria exata de `D3b`, que **e** um unico
 *    `UPDATE` porque ali os dois valores estao na mesma tabela.
 *
 * ── UMA DIVERGENCIA DECLARADA, QUE NAO E DESTA TAREFA FECHAR ───────────────
 *
 * ⚠️ No legado a leitura passa pelo **cache de objeto**: `get_metadata_raw()`
 * chama `update_meta_cache()`, que carrega *todas* as linhas daquele conteudo de
 * uma vez — `SELECT post_id, meta_key, meta_value FROM $table WHERE $column IN
 * ($id_list) ORDER BY meta_id ASC` (`wp-includes/meta.php:1204`) — e filtra a
 * chave em memoria. Com o cache quente, **nenhum** comando sai, e e por isso que
 * `new WP_User_Request( $post )` emite **uma** consulta de metadado e nao duas,
 * mesmo chamando `get_post_meta` duas vezes
 * (`wp-includes/class-wp-user-request.php:117` e `:118`).
 *
 * {@link RepositorioDeMetadados.listar} reproduz essa cadeia e
 * {@link RepositorioDeMetadados.valoresDe} filtra em memoria, exatamente como a
 * origem — e e por isso que `./solicitacao.ts` chama `listar` **uma vez** e le
 * as duas chaves do resultado. O que **nao** existe nesta arvore e o cache: a
 * borda 5 de `target_architecture.md` manda o cache de objeto **desligado nas
 * duas metades** durante a coexistencia, e o Contexto de `PT-012` repete — *"o
 * cache de objeto desligado nas duas metades"*.
 *
 * ── POR QUE TRES METODOS, E NAO OS NOVE DE BC-04 ──────────────────────────
 *
 * O caminho da privacidade chama exatamente tres funcoes de metadado, e nenhuma
 * outra: `get_post_meta( ..., true )`, `update_post_meta()` e
 * `delete_post_meta()`. **Nao** ha `add_post_meta` e **nao** ha nenhuma das
 * funcoes por identificador de linha. Declarar `acrescentar`, `obterPorId` ou
 * `apagarPorId` aqui seria oferecer comando que este contexto nunca emite, e a
 * area 3 da Decisao 2 compara *"snapshot + sequencia de comandos"*.
 */

import {
  talvezDesserializar,
  talvezSerializar,
  type ChaveDeArranjo,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import { tabelaDeMetadadosDeConteudo } from './chaves-e-tabelas.js';
import { comoBruto, comoInteiro, comoTexto } from './leitura-de-linha.js';

const DECODIFICADOR = new TextDecoder();

/**
 * O que a leitura unica devolve quando a chave **nao existe**.
 *
 * `get_metadata_raw()` devolve `null` para chave ausente
 * (`wp-includes/meta.php:692`), e `get_metadata()` troca por
 * `get_metadata_default()`, que e **cadeia vazia** quando se pediu um valor so
 * (`wp-includes/meta.php:713` a `:714`).
 *
 * E e disso que os dois instantes da solicitacao dependem: `WP_User_Request`
 * aplica `(int)` ao resultado (`class-wp-user-request.php:117` e `:118`), e
 * `(int) ''` e **`0`**. Ou seja, **a ausencia do metadado e indistinguivel do
 * instante zero** no objeto que o legado monta — ver
 * `./solicitacao.ts`.
 */
export const AUSENTE_NA_LEITURA_UNICA: ValorPhp = { tipo: 'texto', valor: '' };

/**
 * Uma linha de `postmeta` como a leitura em lote a devolve: **sem `meta_id`**.
 *
 * A ausencia e do legado: a consulta que alimenta o cache pede tres colunas
 * (`post_id`, `meta_key`, `meta_value`) e o identificador da linha nao esta
 * entre elas.
 */
export interface ValorDeMetadado {
  readonly conteudoId: number;
  readonly chave: string;
  /** O valor **como esta na coluna**: bytes ou texto, sem interpretacao. */
  readonly valor: ValorDeColuna;
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
   * Os valores de uma chave, **filtrados em memoria** a partir de linhas ja
   * lidas — como `get_metadata_raw()` faz sobre o cache
   * (`wp-includes/meta.php:684` a `:690`).
   *
   * Recebe as linhas em vez de consultar: e assim que duas chaves saem de **uma**
   * consulta, que e o que o construtor de `WP_User_Request` faz.
   */
  valoresDe(
    linhas: readonly ValorDeMetadado[],
    chave: string,
  ): readonly ValorDeColuna[];
  /**
   * O **primeiro** valor de uma chave, desserializado — o
   * `get_post_meta( ..., true )` (`wp-includes/meta.php:686`).
   *
   * Chave ausente devolve {@link AUSENTE_NA_LEITURA_UNICA}. Chave repetida
   * devolve a primeira linha na ordem de `meta_id`, que e a ordem de
   * {@link RepositorioDeMetadados.listar}.
   */
  valorUnico(linhas: readonly ValorDeMetadado[], chave: string): ValorPhp;
  /**
   * `update_post_meta()`: insere se nao houver linha, atualiza **todas** as
   * linhas daquela chave se houver, e nao escreve nada se houver exatamente uma
   * com o mesmo valor (item 2 do cabecalho).
   *
   * A sequencia de comandos e a do legado, e ela **le antes de escrever**: a
   * leitura que alimenta a comparacao de valor identico
   * (`wp-includes/meta.php:257`), depois `SELECT meta_id ...`
   * (`:265`), e so entao `INSERT` ou `UPDATE`.
   */
  gravar(
    conteudoId: number,
    chave: string,
    valor: ValorPhp,
  ): ResultadoDaGravacaoDeMetadado;
  /**
   * `delete_post_meta()`: **dois** comandos, nessa ordem — `SELECT meta_id ...`
   * e `DELETE ... WHERE meta_id IN( ... )` (`wp-includes/meta.php:456` a
   * `:514`) —, e **nenhum** quando o primeiro nao devolve linha.
   *
   * Devolve as linhas apagadas. E a primitiva de `_export_data_raw` e
   * `_export_data_grouped`, que sao de T011; esta aqui porque e a terceira das
   * tres funcoes de metadado que este contexto chama, e porque o `DELETE` que
   * nao sai e afirmacao, nao ausencia.
   */
  apagar(conteudoId: number, chave: string): number;
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
    linhas: readonly ValorDeMetadado[],
    chave: string,
  ): readonly ValorDeColuna[] {
    return linhas
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

  return {
    listar,
    valoresDe,

    valorUnico(linhas, chave) {
      const valores = valoresDe(linhas, chave);
      if (valores.length === 0) {
        return AUSENTE_NA_LEITURA_UNICA;
      }
      return valorDeMetadado(valores[0] as ValorDeColuna);
    },

    gravar(conteudoId, chave, valor) {
      // A comparacao de valor identico so acontece quando a chave existe UMA
      // vez, e e feita sobre o valor ANTES de serializar, com a igualdade
      // estrita da origem (`wp-includes/meta.php:255` a `:263`).
      const existentes = valoresDe(listar(conteudoId), chave);
      if (
        existentes.length === 1 &&
        mesmoValor(existentes[0] as ValorDeColuna, valor)
      ) {
        return { gravou: false, acrescentadoComId: null };
      }

      const ids = idsDe(conteudoId, chave);
      if (ids.length === 0) {
        // `update_metadata()` delega para `add_metadata()`, sem `unique`:
        // insere mesmo que outra linha igual apareca entre os dois comandos.
        const resultado = dados.escrever({
          texto: `INSERT INTO ${tabela} (post_id, meta_key, meta_value) VALUES (?, ?, ?)`,
          parametros: [conteudoId, chave, paraColuna(valor)],
        });
        const id = resultado.idGerado ?? 0;
        return { gravou: id !== 0, acrescentadoComId: id };
      }

      return {
        gravou:
          dados.escrever({
            texto: `UPDATE ${tabela} SET meta_value = ? WHERE post_id = ? AND meta_key = ?`,
            parametros: [paraColuna(valor), conteudoId, chave],
          }).linhasAfetadas > 0,
        acrescentadoComId: null,
      };
    },

    apagar(conteudoId, chave) {
      const ids = idsDe(conteudoId, chave);
      if (ids.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto:
          `DELETE FROM ${tabela} ` +
          `WHERE meta_id IN( ${ids.map(() => '?').join(',')} )`,
        parametros: ids,
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
 * Se o valor que esta na coluna e o mesmo que se quer gravar.
 *
 * A comparacao do legado e `$old_value[0] === $meta_value`
 * (`wp-includes/meta.php:259`), **depois** de `maybe_unserialize` sobre o valor
 * lido e **antes** de `maybe_serialize` sobre o novo: e igualdade estrita entre
 * valores do PHP, nao entre bytes. Reproduzi-la sobre bytes mudaria o resultado
 * para todo valor nao escalar.
 */
function mesmoValor(naColuna: ValorDeColuna, aGravar: ValorPhp): boolean {
  return identicoComoNoPhp(valorDeMetadado(naColuna), aGravar);
}

/**
 * O `===` do PHP entre dois valores do formato.
 *
 * Para escalar e comparacao de tipo e de valor, sem coercao — e e por isso que
 * `1` e `'1'` sao **diferentes** aqui, como no PHP. Para arranjo, o `===`
 * compara par por par **na mesma ordem**, com a chave e o valor tambem por
 * `===` — e e essa a parte que importa fora de T002: `_export_data_raw` (T011)
 * guarda arranjo, e sem a comparacao estrutural toda gravacao de pagina
 * emitiria um `UPDATE` que o legado nao emite quando a pagina nao trouxe dado
 * novo.
 */
function identicoComoNoPhp(esquerda: ValorPhp, direita: ValorPhp): boolean {
  if (esquerda.tipo !== direita.tipo) {
    return false;
  }
  if (esquerda.tipo === 'nulo' || direita.tipo === 'nulo') {
    return true;
  }
  if (esquerda.tipo === 'texto' && direita.tipo === 'texto') {
    return textoDoValor(esquerda.valor) === textoDoValor(direita.valor);
  }
  if (esquerda.tipo === 'arranjo' && direita.tipo === 'arranjo') {
    if (esquerda.entradas.length !== direita.entradas.length) {
      return false;
    }
    return esquerda.entradas.every((entrada, indice) => {
      const outra = direita.entradas[indice] as EntradaDeArranjo;
      return (
        mesmaChave(entrada.chave, outra.chave) &&
        identicoComoNoPhp(entrada.valor, outra.valor)
      );
    });
  }
  if (esquerda.tipo === 'arranjo' || direita.tipo === 'arranjo') {
    return false;
  }
  return esquerda.valor === direita.valor;
}

/** Duas chaves de arranjo, com a distincao entre inteiro e texto preservada. */
function mesmaChave(esquerda: ChaveDeArranjo, direita: ChaveDeArranjo): boolean {
  if (esquerda.tipo !== direita.tipo) {
    return false;
  }
  if (esquerda.tipo === 'texto' && direita.tipo === 'texto') {
    return textoDoValor(esquerda.valor) === textoDoValor(direita.valor);
  }
  return esquerda.valor === direita.valor;
}

/** Os bytes de um valor de texto como cadeia, para a comparacao estrita. */
function textoDoValor(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : DECODIFICADOR.decode(valor);
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
 *   produz no marcador `%s`. E a forma com que `_wp_admin_notified` e
 *   `_wp_user_notified` sao gravadas (`wp-includes/user.php:4474` e `:4745`),
 *   as duas com `true` — logo a coluna guarda `'1'`, e e por isso que o legado
 *   as le com `(bool)`.
 * - **inteiro e decimal** vao como numero, e a coercao de formato por coluna e
 *   da camada de dados (`DB-DEG`). E a forma dos dois instantes desta feature:
 *   `time()` e inteiro.
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
