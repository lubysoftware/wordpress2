/**
 * Porta de dados do modulo de identidade e acesso (BC-05).
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/001-identidade-e-acesso/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * Tres ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** `target_business_rules.md` BR-MIGRAR-104 mede zero
 *    `START TRANSACTION` e zero `COMMIT` em 1.467 arquivos, e o P5 da
 *    constituicao poe a cascata de apagamento no contrato observavel. Uma porta
 *    com transacao convidaria a envolver uma sequencia que no legado roda sem
 *    protecao, o que mudaria o que fica orfao.
 * 2. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5), e a unicidade de
 *    `user_login` e de `user_email` e conferida em codigo, nao no armazenamento
 *    (BR-MIGRAR-022). REQ-010, que pediria a restricao, ficou `bloqueado`: o
 *    plano desta feature e explicito em nao declara-la.
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
 * O texto precisa poder ser a MESMA string que o legado envia, inclusive o
 * `LIKE` com curinga nos dois lados sobre texto serializado, que e como se
 * descobre quem e administrador (`plan.md`, slot `persistencia`;
 * BR-MIGRAR-088).
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
   * Esta na porta porque e fato da borda, nao regra: a autorizacao mora na
   * chave `{prefixo}capabilities` de `usermeta` e a definicao dos papeis na
   * opcao `{prefixo}user_roles`, logo o identificador do site entra DENTRO do
   * nome da chave (BR-MIGRAR-088). Nenhuma chave deste modulo se monta sem ele.
   */
  readonly prefixoDeTabela: string;

  /**
   * Prefixo base da instalacao (o `$wpdb->base_prefix` do legado).
   *
   * **Sao dois prefixos, e nao um, porque o legado tem dois.** Numa rede, o
   * prefixo do site carrega o identificador dele (`wp_2_`) e e com ele que se
   * montam as tabelas por site e os nomes de chave; mas `users` e `usermeta`
   * sao **globais** e ficam sempre no prefixo base (`wp_users`, `wp_usermeta`)
   * — e a tabela de entidades de `target_data_model.md` as poe em "escopo
   * global, sempre no prefixo base, sem numero de site". Derivar um do outro
   * por corte de texto nao funciona: um prefixo base pode, ele mesmo, terminar
   * em digito e sublinhado.
   *
   * Em instalacao de site unico os dois sao iguais, e e por isso que a diferenca
   * passa despercebida ate a primeira rede.
   *
   * Acrescentado em T002, que e a primeira tarefa a montar nome de tabela: T001
   * declarou a porta antes de existir consulta.
   */
  readonly prefixoBaseDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
