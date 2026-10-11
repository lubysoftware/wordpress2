/**
 * A forma de armazenamento do comentario — a tabela `comments`,
 * `AGG-Comentario`.
 *
 * `target_data_model.md` diz o que muda nesta tabela em uma palavra: **nenhuma**
 * (*"`{p}comments` → `{p}comments`, transformacao nenhuma"*). Logo o trabalho
 * aqui nao e desenhar: e nao melhorar. Cinco coisas que um porte
 * bem-intencionado mexeria ficam exatamente como estao, e cada uma tem o seu
 * motivo medido:
 *
 * 1. **A escrita tem 14 colunas, nao 15, e a ordem delas e a do legado — e a
 *    ordem da insercao nao e a da atualizacao.** `wp_insert_comment()` monta
 *    `$compacted` comecando por **duas** colunas em arranjo literal e so depois
 *    soma o `compact()` (`wp-includes/comment.php:2179` a `:2197`), o que poe
 *    `comment_author_IP` na **segunda** posicao; `wp_update_comment()` monta a
 *    mesma lista de 14 em ordem alfabetica de origem, com o IP na **quinta**
 *    (`:2964` a `:2981`). Sao duas listas de verdade, e e por isso que
 *    {@link COLUNAS_DA_INSERCAO} e {@link COLUNAS_DA_ATUALIZACAO} existem
 *    separadas. `comment_ID` nao entra em nenhuma das duas: e gerado pelo banco.
 * 2. **A leitura e `SELECT *`.** E a cadeia que o legado envia
 *    (`wp-includes/class-wp-comment.php:268`), e nao e so fidelidade de forma:
 *    `DB-MIG` (BR-MIGRAR-085) registra que *"coluna criada por extensao
 *    permanece e nao aparece em `wp_get_db_schema()` — o DDL e o piso, nao o
 *    retrato"*. Uma lista explicita de colunas deixaria de fora a coluna que uma
 *    extensao acrescentou, que o legado devolve.
 * 3. **`comment_karma` e escrita, e isso NAO contradiz `DB-DEAD`.**
 *    BR-MIGRAR-086 e preciso: o nucleo *"nunca escreve nada alem de `0`"* — e
 *    escrever zero e escrever. A coluna esta nas duas listas de 14 porque esta
 *    nas duas do legado (`comment.php:2191` e `:2973`), tem formato `%d`
 *    declarado (`wp-includes/load.php:771`) e nenhuma decisao do nucleo a le. A
 *    resposta 7 de `questions.md` ja julgou este caso: *"existir sem ser chamada
 *    e parte do que se clona"*.
 * 4. **A data e literal, inclusive a sentinela.** As duas colunas `datetime` sao
 *    texto no formato do banco, e `'0000-00-00 00:00:00'` e o default das duas
 *    (`DB-SENT`, e `DATA_SENTINELA` em `vocabulario.ts`). ⚠️ Nesta tabela ela
 *    e **so** o default do DDL: nao existe aqui o `date_floating` de `posts`,
 *    que e quem a DEDUZ la. 🔴 O destino dela e `BR-HUMANA-003`, **pendente**, e
 *    este arquivo segue a premissa declarada e **nao decide nada por ninguem**.
 * 5. **Nao ha validacao nenhuma na gravacao.** Nem tamanho de coluna, nem
 *    dominio de `comment_approved`, nem existencia do conteudo comentado, do pai
 *    ou da conta. Os limites de coluna existem — estao declarados em
 *    `esquema.ts`, derivados do DDL como o legado os deriva — e a **recusa** e
 *    de T012 (US-5), do lado da aplicacao, porque `C10` e *"erro de usuario, nao
 *    truncamento"* e erro de usuario nasce de quem recebeu o formulario. Do lado
 *    do banco vale `DB-DEG` (BR-MIGRAR-083): escrita grande demais se degrada em
 *    silencio, e e isso que um repositorio sem guarda reproduz.
 *
 * ── A AUTO-REFERENCIA, QUE E A PARTE DESTA TAREFA QUE TEM CASCATA ──────────
 *
 * `comment_parent` encadeia resposta e tem **uma** semantica, ao contrario de
 * `posts.post_parent`, que tem tres. Mas ela carrega um efeito observavel que o
 * P5 poe no contrato e que o cenario `@cascata` de `PT-001` cobra textualmente
 * — *"apagar o comentario pai propaga para a arvore de respostas... as duas
 * metades deixam a mesma arvore no banco"*:
 *
 * **apagar um comentario SOBE as respostas dele um nivel.**
 * `wp_delete_comment()` le os filhos diretos e, se houver algum, reaponta todos
 * para o **avo** — o pai do apagado (`wp-includes/comment.php:1589` a `:1594`).
 * Nao e exclusao recursiva, nao e orfao e nao e `ON DELETE CASCADE`: e
 * reparenteamento, o mesmo gesto que `wp_delete_post()` faz com pagina filha e
 * anexo, e `target_data_model.md` nomeia esse gesto como o **primeiro** dos tres
 * motivos pelos quais a integridade referencial esta desativada no legado —
 * *"uma FK com `ON DELETE CASCADE` os apagaria, mudando comportamento
 * observavel"*.
 *
 * As duas pontas estao aqui como metodos **separados**
 * ({@link RepositorioDeComentarios.idsDeRespostasDiretas} e
 * {@link RepositorioDeComentarios.reparentearRespostas}), e a **ordem** entre
 * elas e de quem apaga, nao daqui — exatamente como `apagar` e so a linha. Ha
 * uma excecao de tipo que nao e desta tarefa: a nota editorial raiz **arrasta**
 * as respostas em vez de as subir (`comment.php:1653` e `:1706`, CA-14.5), e
 * quem decide entre os dois caminhos e a operacao de apagar, que le o tipo.
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * O P2 da constituicao poe cada ponto de extensao no contrato publico, e nao ha
 * barramento de ganchos nesta arvore: REQ-162 ficou fora do pacote
 * (`do-not-rewrite.md`) e **nenhuma tarefa deste pacote o constroi**. O que esta
 * tarefa pode fazer sem decidir no lugar de ninguem e declarar, no arquivo que
 * os emitiria, quais sao e em que posicao do fluxo entram. Os do caminho de
 * escrita e de exclusao, na ordem do legado:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `wp_insert_comment` | acao | `$id`, `$comment` | **depois** do comando, com a linha relida (`comment.php:2234`) |
 * | `wp_update_comment_data` | filtro | `$data`, `$comment`, `$commentarr` | imediatamente antes do `UPDATE`, e devolver erro **aborta** (`:2953`) |
 * | `edit_comment` | acao | `$comment_id`, `$data` | depois do `UPDATE` (`:3014`) |
 * | `delete_comment` / `deleted_comment` | acao | `$comment_id`, `$comment` | antes de reparentear e depois do `DELETE` (`:1587`, `:1615`) |
 * | `wp_set_comment_status` | acao | `$comment_id`, `$comment_status` | depois do `UPDATE` de estado, antes da transicao (`:2842`) |
 *
 * **Nenhum deles e emitido por este repositorio**, e a razao e de fronteira:
 * quem os emite e a operacao — T004 grava, T022 modera, T024 descarta —, e o
 * ultimo cenario de `PT-001` cobra *"a ordem em que os pontos de extensao sao
 * chamados e a mesma nas duas"*. Um repositorio que os disparasse os faria
 * disparar tambem nos caminhos que no legado passam por outra funcao e portanto
 * **nao** os disparam, ou os disparam uma vez so.
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import { tabelaDeComentarios } from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto, primeiraLinha } from './leitura-de-linha.js';

/**
 * Uma linha de `comments`, com as 15 colunas.
 *
 * O mapeamento campo ↔ coluna, que e o que faz esta interface conferivel contra
 * o DDL de `esquema.ts`:
 *
 * | campo | coluna | formato |
 * |---|---|---|
 * | `id` | `comment_ID` | `%d` |
 * | `conteudoId` | `comment_post_ID` | `%d` |
 * | `autor` | `comment_author` | `%s` |
 * | `autorEmail` | `comment_author_email` | `%s` |
 * | `autorUrl` | `comment_author_url` | `%s` |
 * | `autorIp` | `comment_author_IP` | `%s` |
 * | `data` | `comment_date` | `%s` |
 * | `dataGmt` | `comment_date_gmt` | `%s` |
 * | `texto` | `comment_content` | `%s` |
 * | `karma` | `comment_karma` | `%d` |
 * | `estado` | `comment_approved` | `%s` |
 * | `agente` | `comment_agent` | `%s` |
 * | `tipo` | `comment_type` | `%s` |
 * | `paiId` | `comment_parent` | `%d` |
 * | `contaId` | `user_id` | `%d` |
 *
 * Os cinco `%d` sao os de `wp-includes/load.php:746` a `:782`; todo o resto vai
 * como `%s`, **inclusive `comment_approved`** — e e por isso que o estado e
 * `'1'` e `'0'` com aspas, e nao numero.
 *
 * `estado` e `tipo` sao `string` e **nao** os tipos fechados de `vocabulario.ts`,
 * e isso e regra lida e nao preguica: as duas colunas sao `varchar(20)` sem
 * `ENUM` e sem `CHECK` (`DB-ENUM`), o tipo e aberto por escrito
 * (*"Custom comment types are possible"*) e o legado tolera o que nao conhece —
 * `comment_type` vazio e caso real. `EstadoDoComentario` e `TipoDeComentario`
 * descrevem o **vocabulario de fabrica**, nao o dominio da coluna.
 *
 * ⚠️ **`autorIp` e dado pessoal**, e a secao *Modelo de dados* do `plan.md` o
 * marca: e *"exportado e anonimizado pela feature 008"*. Nenhuma operacao desta
 * feature o anonimiza, e o `UPDATE` que o faz e de BC-06
 * (`wp-includes/comment.php:4382`).
 */
export interface Comentario {
  readonly id: number;
  /** `comment_post_ID` — o conteudo comentado. Sem chave estrangeira (P5). */
  readonly conteudoId: number;
  readonly autor: string;
  readonly autorEmail: string;
  readonly autorUrl: string;
  /** `comment_author_IP` — dado pessoal; a anonimizacao e da feature 008. */
  readonly autorIp: string;
  /** `comment_date` — texto no formato do banco, podendo ser a sentinela. */
  readonly data: string;
  /** `comment_date_gmt` — idem, e e **esta** que a janela de vazao compara (T008). */
  readonly dataGmt: string;
  /** `comment_content` — o corpo, ja sanitizado na escrita pelo caminho de aplicacao. */
  readonly texto: string;
  /** `comment_karma` — coluna morta: escrita sempre com `0`, lida por ninguem. */
  readonly karma: number;
  /**
   * `comment_approved` — um dos cinco de `vocabulario.ts`, ou o que uma extensao
   * gravou. Booleano e maquina de estados na mesma coluna.
   */
  readonly estado: string;
  /** `comment_agent` — a identificacao do navegador. `C6` a varre (CA-4.4). */
  readonly agente: string;
  /** `comment_type` — `''` tambem ocorre, e e lido como esta. */
  readonly tipo: string;
  /** `comment_parent` — a auto-referencia. `0` e primeiro nivel (`SEM_RESPOSTA`). */
  readonly paiId: number;
  /** `user_id` — o vinculo **opcional** com conta. `0` e anonimo legitimo (`SEM_CONTA`). */
  readonly contaId: number;
}

/**
 * As 14 colunas que a gravacao escreve, todas obrigatorias.
 *
 * Sao obrigatorias porque `wp_insert_comment()` resolve default para todas antes
 * de montar o comando (`wp-includes/comment.php:2161` a `:2177`): o que chega ao
 * banco pelo caminho de aplicacao nunca omite coluna. A **omissao** — o caminho
 * em que o default do DDL vale — e a insercao direta na tabela, que nao e metodo
 * deste repositorio: e o DDL, declarado em `esquema.ts`.
 *
 * ⚠️ **Os defaults nao estao aqui, e nao e esquecimento.** Dois deles leem o
 * relogio (`current_time('mysql')` e `get_gmt_from_date()`), o que e porta, e a
 * tabela toda tem uma assimetria que vale registrada porque e observavel:
 *
 * | coluna | teste do legado | efeito de receber `''` |
 * |---|---|---|
 * | `comment_type` | `empty()` (`:2174`) | vira `'comment'` |
 * | `comment_approved` | `! isset()` (`:2172`) | **permanece `''`** |
 * | as outras doze | `! isset()` | permanece `''` ou `0` |
 *
 * Quem resolve default e a operacao de gravar — T004 (US-1) —, e e ela que tem
 * de reproduzir essa diferenca entre `empty()` e `isset()`. Um default aplicado
 * aqui o aplicaria tambem a quem passou o valor de proposito.
 */
export interface ComentarioGravavel {
  readonly conteudoId: number;
  readonly autor: string;
  readonly autorEmail: string;
  readonly autorUrl: string;
  readonly autorIp: string;
  readonly data: string;
  readonly dataGmt: string;
  readonly texto: string;
  readonly karma: number;
  readonly estado: string;
  readonly agente: string;
  readonly tipo: string;
  readonly paiId: number;
  readonly contaId: number;
}

/** Os mesmos campos, um a um opcionais: omitir e nao tocar na coluna. */
export type CamposDeComentario = {
  readonly [Campo in keyof ComentarioGravavel]?: ComentarioGravavel[Campo];
};

export interface RepositorioDeComentarios {
  /**
   * `SELECT * FROM {site}comments WHERE comment_ID = ? LIMIT 1`
   * (`wp-includes/class-wp-comment.php:268`).
   */
  obterPorId(id: number): Comentario | null;
  /**
   * Os identificadores das respostas **diretas** de um comentario.
   *
   * `SELECT comment_ID FROM {site}comments WHERE comment_parent = ?`, a consulta
   * que `wp_delete_comment()` faz **antes** de reparentear
   * (`wp-includes/comment.php:1590`). E so um nivel: o legado nao desce a arvore
   * aqui, porque subir o nivel dos filhos diretos ja reata a arvore inteira.
   *
   * ⚠️ Devolve lista, e a lista **vazia e resposta**: e ela que faz o legado nao
   * emitir o `UPDATE` de reparenteamento (`:1591`, `if ( ! empty( $children ) )`).
   */
  idsDeRespostasDiretas(comentarioId: number): readonly number[];
  /**
   * Sobe as respostas de um comentario um nivel.
   *
   * `UPDATE {site}comments SET comment_parent = ? WHERE comment_parent = ?`
   * (`wp-includes/comment.php:1592`), com o novo pai sendo o **pai do comentario
   * que sai**. Devolve as linhas afetadas.
   *
   * E **um** comando para toda a ninhada, nao um por filho: o legado nao itera,
   * e a sequencia de comandos e o que a area 3 da Decisao 2 compara. Quem chama
   * decide se chama — a condicao esta em {@link idsDeRespostasDiretas}.
   */
  reparentearRespostas(comentarioId: number, novoPaiId: number): number;
  /**
   * Insere a linha e devolve o identificador gerado.
   *
   * Escreve as 14 colunas de {@link COLUNAS_DA_INSERCAO}, nessa ordem. Nao ha
   * `idSugerido` como em `posts`: `wp_insert_comment()` nao tem equivalente do
   * `import_id`, e o identificador vem sempre do banco (`comment.php:2203`).
   */
  inserir(campos: ComentarioGravavel): number;
  /**
   * `UPDATE {site}comments SET ... WHERE comment_ID = ?`, na ordem de
   * {@link COLUNAS_DA_ATUALIZACAO}. Devolve as linhas afetadas.
   *
   * **Serve as duas escritas de atualizacao do legado, e nao por economia.**
   * `wp_update_comment()` manda as 14 (`comment.php:2983`) e
   * `wp_set_comment_status()` manda **uma**, `comment_approved`
   * (`:2820`); com os campos omitidos fora do comando, informar so `estado`
   * produz exatamente a cadeia da segunda. Por isso nao existe aqui um
   * `atualizarEstado`: ele emitiria a mesma coisa com outro nome, e a transicao
   * — com o estado anterior, os apelidos `hold`/`approve` e os ganchos — e T022.
   */
  atualizar(id: number, campos: CamposDeComentario): number;
  /**
   * `DELETE FROM {site}comments WHERE comment_ID = ?`
   * (`wp-includes/comment.php:1602`).
   *
   * **E so a linha.** A exclusao do legado tem quatro passos nesta ordem —
   * reparentear as respostas, ler os identificadores do metadado, apagar cada
   * metadado um por um, apagar a linha —, e `EXT-EXCLUSAO` (BR-MIGRAR-104) poe a
   * sequencia inteira no comportamento observavel. Um `apagarEmCascata` nascido
   * aqui esconderia justamente o que o P5 manda afirmar por teste: *"o conjunto
   * exato do que sumiu e do que permaneceu, inclusive o que permaneceu orfao"*.
   */
  apagar(id: number): number;
}

/**
 * As 14 colunas na ordem em que **a insercao** as monta
 * (`wp-includes/comment.php:2179` a `:2197`).
 *
 * A ordem e observavel: ela e a ordem dos campos no comando que sai, e a area 3
 * da Decisao 2 compara *"snapshot + sequencia de comandos"*. E ela e irregular
 * de propriedade do legado — `comment_post_ID` e `comment_author_IP` vem num
 * arranjo literal **antes** do `compact()`, o que as poe nas duas primeiras
 * posicoes e deixa `comment_author` na terceira. Reordenar por gosto —
 * alfabetico, ou "igual a atualizacao" — produziria um comando diferente do do
 * legado para o mesmo efeito.
 */
export const COLUNAS_DA_INSERCAO: readonly (readonly [
  keyof ComentarioGravavel,
  string,
])[] = Object.freeze([
  ['conteudoId', 'comment_post_ID'],
  ['autorIp', 'comment_author_IP'],
  ['autor', 'comment_author'],
  ['autorEmail', 'comment_author_email'],
  ['autorUrl', 'comment_author_url'],
  ['data', 'comment_date'],
  ['dataGmt', 'comment_date_gmt'],
  ['texto', 'comment_content'],
  ['karma', 'comment_karma'],
  ['estado', 'comment_approved'],
  ['agente', 'comment_agent'],
  ['tipo', 'comment_type'],
  ['paiId', 'comment_parent'],
  ['contaId', 'user_id'],
] as const);

/**
 * As mesmas 14 colunas na ordem em que **a atualizacao** as monta
 * (`wp-includes/comment.php:2964` a `:2979`).
 *
 * `wp_update_comment()` declara `$keys` a mao e corta o resto com
 * `wp_array_slice_assoc()` (`:2981`), e a ordem resultante e a de `$keys`: aqui
 * `comment_author_IP` esta na **quinta** posicao, e nao na segunda. As duas
 * listas tem o mesmo conteudo e ordens diferentes, e as duas sao do legado.
 */
export const COLUNAS_DA_ATUALIZACAO: readonly (readonly [
  keyof ComentarioGravavel,
  string,
])[] = Object.freeze([
  ['conteudoId', 'comment_post_ID'],
  ['autor', 'comment_author'],
  ['autorEmail', 'comment_author_email'],
  ['autorUrl', 'comment_author_url'],
  ['autorIp', 'comment_author_IP'],
  ['data', 'comment_date'],
  ['dataGmt', 'comment_date_gmt'],
  ['texto', 'comment_content'],
  ['karma', 'comment_karma'],
  ['estado', 'comment_approved'],
  ['agente', 'comment_agent'],
  ['tipo', 'comment_type'],
  ['paiId', 'comment_parent'],
  ['contaId', 'user_id'],
] as const);

/**
 * O nome de coluna do legado como campo gravavel, ou `null` quando a coluna nao
 * e escrita pelo caminho de aplicacao.
 *
 * Existe porque os pontos de extensao desta tabela falam por **nome de coluna**:
 * `wp_update_comment_data` (`comment.php:2953`) recebe e devolve o arranjo
 * `$data` com as chaves `comment_*`, e uma extensao que troque
 * `$data['comment_approved']` ali muda o que vai gravado. Sem esta traducao o
 * ponto de extensao existiria sem *"a capacidade de alterar o resultado que ele
 * tem hoje"*, que e o que o **P2** poe na tabela *Nao negociavel*.
 *
 * `comment_ID` devolve `null` porque nao e gravavel.
 */
export function campoDaColuna(coluna: string): keyof ComentarioGravavel | null {
  for (const [campo, nome] of COLUNAS_DA_INSERCAO) {
    if (nome === coluna) {
      return campo;
    }
  }
  return null;
}

export function criarRepositorioDeComentarios(
  dados: PortaDeDados,
): RepositorioDeComentarios {
  const tabela = tabelaDeComentarios(dados);

  return {
    obterPorId(id) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE comment_ID = ? LIMIT 1`,
          parametros: [id],
        }),
      );
      return linha === null ? null : lerComentario(linha);
    },

    idsDeRespostasDiretas(comentarioId) {
      return dados
        .selecionar({
          texto: `SELECT comment_ID FROM ${tabela} WHERE comment_parent = ?`,
          parametros: [comentarioId],
        })
        .map((linha) => comoInteiro(linha['comment_ID']));
    },

    reparentearRespostas(comentarioId, novoPaiId) {
      return dados.escrever({
        texto: `UPDATE ${tabela} SET comment_parent = ? WHERE comment_parent = ?`,
        parametros: [novoPaiId, comentarioId],
      }).linhasAfetadas;
    },

    inserir(campos) {
      const colunas: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_DA_INSERCAO) {
        colunas.push(coluna);
        parametros.push(campos[campo]);
      }

      const consulta: Consulta = {
        texto:
          `INSERT INTO ${tabela} (${colunas.join(', ')}) ` +
          `VALUES (${colunas.map(() => '?').join(', ')})`,
        parametros,
      };
      return dados.escrever(consulta).idGerado ?? 0;
    },

    atualizar(id, campos) {
      const nomes: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_DA_ATUALIZACAO) {
        const valor = campos[campo];
        if (valor === undefined) {
          continue;
        }
        nomes.push(`${coluna} = ?`);
        parametros.push(valor);
      }
      if (nomes.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto: `UPDATE ${tabela} SET ${nomes.join(', ')} WHERE comment_ID = ?`,
        parametros: [...parametros, id],
      }).linhasAfetadas;
    },

    apagar(id) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE comment_ID = ?`,
        parametros: [id],
      }).linhasAfetadas;
    },
  };
}

/**
 * A linha como {@link Comentario}, sem interpretar nada alem do tipo da coluna.
 *
 * Nao ha traducao nenhuma aqui — nem o `''` de `comment_type` viraria
 * `'comment'`, porque essa normalizacao e da **leitura do legado em memoria** e
 * nao do dado (ver `tipoNormalizado` em `vocabulario.ts`). O que entra em
 * `estado` e o byte que esta na coluna, que e o que o criterio *"efeito no
 * banco"* compara.
 */
export function lerComentario(linha: LinhaDeResultado): Comentario {
  return {
    id: comoInteiro(linha['comment_ID']),
    conteudoId: comoInteiro(linha['comment_post_ID']),
    autor: comoTexto(linha['comment_author']),
    autorEmail: comoTexto(linha['comment_author_email']),
    autorUrl: comoTexto(linha['comment_author_url']),
    autorIp: comoTexto(linha['comment_author_IP']),
    data: comoTexto(linha['comment_date']),
    dataGmt: comoTexto(linha['comment_date_gmt']),
    texto: comoTexto(linha['comment_content']),
    karma: comoInteiro(linha['comment_karma']),
    estado: comoTexto(linha['comment_approved']),
    agente: comoTexto(linha['comment_agent']),
    tipo: comoTexto(linha['comment_type']),
    paiId: comoInteiro(linha['comment_parent']),
    contaId: comoInteiro(linha['user_id']),
  };
}
