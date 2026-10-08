/**
 * Porta de dados do modulo de classificacao (BC-02).
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/003-classificacao-do-conteudo/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * A forma e a MESMA que BC-05 declarou em T001
 * (`../../identidade-e-acesso/portas/porta-de-dados.ts`), e a repeticao e
 * exigida, nao descuido: a regra de dependencia 3 de `target_architecture.md`
 * proibe `contextos/<a>/` importar `contextos/<b>/` por `import` no topo do
 * modulo, *"sempre, sem excecao"*. A porta pertence ao modulo que a consome
 * (regra 4), e a camada de dados compartilhada e T007 da feature
 * `015-plataforma-transversal` — nao existe nesta arvore.
 *
 * Tres ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** `target_business_rules.md` BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e
 *    `target_data_model.md` e literal: *"NAO EXISTE E NAO PASSA A EXISTIR"*.
 *    Aqui isso pesa mais do que em BC-05, porque a operacao central desta
 *    feature e uma substituicao integral de vinculos seguida de recalculo de
 *    contador (UC-05 passos 4 e 5): envolve-la numa transacao esconderia o
 *    estado intermediario, que BR-MIGRAR-077 e BR-MIGRAR-078 poem no
 *    observavel.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5), e das tres garantias
 *    reais do esquema **duas** sao desta feature: o `UNIQUE (term_id, taxonomy)`
 *    de `term_taxonomy` e a PK composta `(object_id, term_taxonomy_id)` de
 *    `term_relationships` (`target_data_model.md`,
 *    `wp-admin/includes/schema.php:82` e `:89`). Quem as declara e T002; esta
 *    porta nao conhece tabela nenhuma.
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
 * O texto precisa poder ser a MESMA string que o legado envia (`plan.md`, slot
 * `persistencia`). Nesta feature o caso que cobra isso e a leitura da juncao:
 * `term_relationships` **nao tem indice isolado em `object_id`** — a PK composta
 * serve "quais rotulos tem este objeto" e nao o caminho inverso (risco 4 de
 * `plan.md`). A consulta lenta e a do legado, e a porta nao a reescreve.
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
   * Esta na porta porque e fato da borda, nao regra. **As cinco tabelas deste
   * contexto sao todas por site** — `{p}terms`, `{p}term_taxonomy`,
   * `{p}term_relationships`, `{p}termmeta` e `{p}links`
   * (`target_data_model.md`, linhas 79 a 83) —, logo aqui basta um prefixo.
   *
   * E a diferenca com BC-05, que precisou de dois: la `users` e `usermeta` sao
   * globais e ficam no prefixo base. Nenhuma tabela desta feature e global, e
   * por isso `prefixoBaseDeTabela` **nao** aparece nesta porta. Se alguma tarefa
   * desta feature precisar ler conta ou conteudo, a travessia e por ligacao
   * tardia (AD-10), nao por nome de tabela de outro contexto.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
