/**
 * A forma da consulta: o texto do SQL e os valores viajam **separados**.
 *
 * Tarefa **T002** da feature `015-plataforma-transversal`, cuja entrega e
 * *"registro de operacao, traducao, sanitizacao e camada de dados carregam como
 * modulos proprios, com as portas declaradas e nenhuma regra implementada"*.
 * `satisfaz: — (infraestrutura)`: nenhum criterio de aceite, nenhuma regra. A
 * camada de dados de US-3 (REQ-164) e **T007**.
 *
 * Os nomes deste arquivo nao foram escolhidos aqui: `Consulta`,
 * `ValorDeParametro`, `LinhaDeResultado` e `ResultadoDeEscrita` sao os que as
 * features `004`, `005`, `006`, `007`, `011`, `013` e `014` ja declararam, cada
 * uma na porta de dados do seu contexto — por exemplo
 * `contextos/superficies-programaticas/portas/porta-de-dados.ts`, que ja aponta
 * para ca: *"construir a camada de dados que o confere e trabalho da feature
 * `015-plataforma-transversal`; esta porta so declara a forma"*. Repetir o
 * vocabulario e o que permite a T007 **convergir** as portas de contexto em vez
 * de inventar uma terceira forma.
 *
 * **Por que a separacao entre texto e parametro e a forma, e nao uma preferencia
 * de estilo.** No legado o par e `prepare()` mais `query()`:
 * `wp-includes/class-wpdb.php:1458` recebe o texto com marcador e os valores, e
 * `:2214` recebe a string final. Desde a 6.2 ha marcador de **identificador**
 * (`%i`, declarado em `:1402` e datado em `:1442`), o que significa que nome de
 * tabela e de coluna tambem tem marcador — e e isso que torna a concatenacao
 * desnecessaria mesmo no caso que no legado era o pretexto dela (`:656` registra
 * o uso *"before %i was supported"*).
 *
 * ⚠️ **O texto precisa poder ser a MESMA string que o legado envia.** E a razao
 * escrita no slot `persistencia` do `plan.md`: *"com o criterio de identico a
 * consulta precisa poder ser a MESMA string que o legado envia, inclusive o
 * `LIKE` com curinga nos dois lados sobre texto serializado que e como se
 * descobre quem e administrador"*. Logo esta forma **nao** e um construtor de
 * consulta: e um par texto/valores, e quem quiser gerar o texto gera.
 */

/** Valor que pode ocupar um marcador de parametro. */
export type ValorDeParametro = string | number | null | Uint8Array;

/**
 * Valor que uma coluna devolve.
 *
 * Bytes, nao objeto: as quatro familias de coluna de texto longo guardam
 * estrutura serializada (`DB-SER`, BR-MIGRAR-082), e desserializar e trabalho de
 * `plataforma/serializacao/`, que ja existe nesta arvore. A camada de dados
 * entrega o que o banco devolveu.
 */
export type ValorDeColuna = string | number | null | Uint8Array;

/**
 * Consulta parametrizada.
 *
 * Os valores vao na ordem em que os marcadores aparecem no texto, como em
 * `prepare()` (`wp-includes/class-wpdb.php:1458`).
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

/**
 * O que uma escrita informa de volta.
 *
 * ⚠️ **Nao ha campo de erro, e a ausencia e a regra.** `DB-DEG`
 * (BR-MIGRAR-083): *"escrita invalida nao falha, ela se degrada"* — o legado
 * trunca pelo tamanho real da coluna (`wp-includes/class-wpdb.php:2993`),
 * **remove** o caractere que o charset nao comporta (`:3823`) e coage o formato
 * conforme `%d`/`%f`/`%s` (`:2879`), tudo em silencio. Declarar erro de escrita
 * aqui convidaria a reproduzir um modo de falha que o legado nao tem.
 */
export interface ResultadoDeEscrita {
  readonly linhasAfetadas: number;
  /** Chave gerada pelo banco, quando a escrita gerou uma. */
  readonly idGerado: number | null;
}
