/**
 * Porta de dados do modulo de conteudo (BC-01).
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/002-autoria-e-publicacao/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * **Esta porta repete a forma da porta de dados de BC-05, e isso nao e
 * duplicacao a remover.** A regra de dependencia 3 de `target_architecture.md`
 * proibe `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*, e a
 * AD-08 poe a porta junto de quem a consome. Um tipo compartilhado entre os dois
 * contextos teria de descer para `plataforma/`, e e `plataforma/dados/` que vai
 * montar o SQL por fragmento — nao declarar a porta dos contextos.
 *
 * Tres ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** `target_business_rules.md` BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e o P5 da
 *    constituicao poe a cascata de apagamento no contrato observavel. Nesta
 *    feature isso tem consequencia direta: `target_architecture.md` AD-01 e
 *    AD-11 dizem que as 7 etapas da exclusao de conteudo ficam inteiras dentro
 *    de BC-01, na mesma pilha, *"sem compensacao a escrever porque nao ha passo
 *    remoto"*. Uma porta com transacao convidaria a envolver a sequencia que no
 *    legado roda sem protecao, e mudaria o que fica orfao.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5), e `posts.post_parent`
 *    carrega TRES semanticas numa coluna so, com `0` significando ausencia
 *    (`target_data_model.md`). REQ-169, que pediria a integridade declarada,
 *    ficou fora do pacote (`do-not-rewrite.md`). O caso mais caro esta
 *    catalogado: `wp_delete_post()` **reparenteia** pagina filha e anexo para o
 *    avo (`wp-includes/post.php:3908` e `:3923`), e uma chave com
 *    `ON DELETE CASCADE` os apagaria.
 * 3. **Os metodos sao sincronos.** AD-04 de `target_architecture.md` fixa a
 *    fronteira de `await` em `adaptadores/`: `contextos/` e `plataforma/` sao
 *    sincronos, e a I/O e resolvida antes de entrar no dominio ou exposta por
 *    fachada sincrona. Promessa aqui contaminaria o chamador e mudaria a ordem
 *    de emissao, que AD-03 poe no contrato.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada: o texto do SQL e os valores viajam separados, e e
 * essa separacao que faz a concatenacao desnecessaria.
 *
 * O texto precisa poder ser a MESMA string que o legado envia. Nesta feature o
 * caso que cobra isso e o indice `type_status_date (post_type, post_status,
 * post_date, ID)`, que `target_data_model.md` chama de *"o indice de toda
 * listagem"*: a ordem das colunas na clausula e o que o decide, e o legado conta
 * com ele.
 *
 * Como conferir que nenhuma consulta e montada por concatenacao e trabalho da
 * feature 015 (`015-plataforma-transversal`, T007), que constroi a camada de
 * dados. Esta porta so declara a forma.
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
   * Esta na porta porque e fato da borda, nao regra. As duas tabelas desta
   * feature — `posts` e `postmeta` — estao no bloco *"ESCOPO POR SITE"* de
   * `target_data_model.md`, logo numa rede elas carregam o identificador do site
   * no proprio nome (`wp_2_posts`), e nenhum nome de tabela deste modulo se
   * monta sem este prefixo.
   *
   * **O prefixo BASE nao esta aqui, e a ausencia e de proposito.** Ele e o que
   * localiza as tabelas globais (`users`, `usermeta`), que nao sao desta
   * feature: o autor do conteudo e dado de BC-05, alcancado por ligacao tardia
   * (AD-10), e nao por consulta deste modulo. Quem precisar de tabela global
   * acrescenta o campo na tarefa dele, como T002 de BC-05 fez — e nao deriva um
   * prefixo do outro por corte de texto, porque um prefixo base pode, ele mesmo,
   * terminar em digito e sublinhado.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
