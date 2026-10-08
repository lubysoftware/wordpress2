/**
 * Porta de dados do modulo de interacao publica (BC-03).
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/007-interacao-publica-e-moderacao/plan.md`, secao Stack,
 * slot `persistencia`; REQ-164).
 *
 * A interface e deliberadamente a MESMA forma que `BC-05` declara na porta dele,
 * e isso nao e copia por descuido: AD-10 de `target_architecture.md` proibe um
 * contexto importar outro no topo do modulo, e AD-08 poe a porta no contexto que
 * a CONSOME. Importar a porta de identidade daqui criaria exatamente a ligacao
 * horizontal que a regra de dependencia recusa.
 *
 * Tres ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** `target_business_rules.md` BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e o `plan.md` desta
 *    feature repete a medicao. O P5 da constituicao poe a cascata de apagamento
 *    no contrato observavel, e o cenario *"Apagar o comentario pai propaga para
 *    a arvore de respostas"* de
 *    `.specify/migration/parity_tests/01-cascata-de-moderacao-de-comentario.feature`
 *    afirma o estado que SOBRA no banco. Uma porta com transacao convidaria a
 *    envolver uma sequencia que no legado roda sem protecao.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira, e aqui isso tem um efeito
 *    com nome: **comentario orfao e estado normal** — apagar a conta nao toca
 *    nos comentarios dela (P5, e o cenario `@invariante` do mesmo arquivo de
 *    paridade). AD-11 ainda proibe mudanca de esquema nesta fase.
 * 3. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`: `contextos/` e `plataforma/` sao sincronos. Aqui isso e
 *    mais que estilo — AD-05 exige que a cascata de moderacao seja **cadeia
 *    sincrona de curto-circuito**, devolvendo 409 e 429 na MESMA resposta, e a
 *    implicacao 3 do paradigma avisa que assincronia nessa cadeia devolve 202 e
 *    perde a regra. Duas etapas da cascata leem o banco no meio da decisao (C7
 *    le comentario aprovado anterior; C1 procura a duplicata), logo a I/O e
 *    resolvida pela porta, sincronamente, de dentro da cadeia.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e
 * essa separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia — o `plan.md`
 * desta feature e literal: *"a consulta precisa poder ser a MESMA string que o
 * legado envia"*. Nesta feature a exigencia tem um caso proprio: a consulta de
 * duplicata de `wp-includes/comment.php:752` e montada em TRES pedacos, e o
 * pedaco do e-mail **so entra quando o e-mail nao e vazio**, o que muda a
 * consulta emitida (`comment_author_email` deixa de ser comparado). O criterio
 * de aceite desta area e *"efeito no banco"* (Decisao 2 de `parity_specs.md`),
 * e efeito no banco inclui qual comando saiu.
 */
export interface Consulta {
  /** SQL com marcadores de parametro, na mesma forma que o legado envia. */
  readonly texto: string;
  /** Valores dos marcadores, na ordem em que aparecem no texto. */
  readonly parametros: readonly ValorDeParametro[];
}

/** Uma linha devolvida por leitura, com as colunas como o banco as nomeia. */
export interface LinhaDeResultado {
  readonly [coluna: string]: ValorDeColuna | undefined;
}

/** O que uma escrita informa de volta. */
export interface ResultadoDeEscrita {
  readonly linhasAfetadas: number;
  /** Chave gerada pelo banco, quando a escrita gerou uma. */
  readonly idGerado: number | null;
}

export interface PortaDeDados {
  /**
   * Prefixo das tabelas desta instalacao (o `$wpdb->prefix` do legado).
   *
   * Esta na porta porque e fato da borda, nao regra. As tres tabelas que este
   * modulo le ou escreve — `comments`, `commentmeta` e, para resolver o autor do
   * conteudo comentado, `posts` — sao **por site**, logo todas vivem neste
   * prefixo.
   *
   * ⚠️ **O prefixo BASE nao esta aqui, e e falta prevista.** `users` e
   * `usermeta` sao globais e vivem sempre no prefixo base
   * (`target_data_model.md`), e C7 (BR-MIGRAR-015) resolve o autor por e-mail
   * na tabela global antes de procurar o comentario aprovado anterior. T001 nao
   * monta nome de tabela nenhum; quem precisar do prefixo base acrescenta o
   * campo na tarefa que precisar, como T002 de BC-05 fez com nota no proprio
   * campo. Derivar um prefixo do outro por corte de texto nao funciona: um
   * prefixo base pode, ele mesmo, terminar em digito e sublinhado.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
