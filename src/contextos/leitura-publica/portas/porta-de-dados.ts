/**
 * Porta de dados do modulo de leitura publica.
 *
 * E a unica porta deste modulo para o banco: nenhuma regra desta feature fala
 * com o driver, e nenhuma consulta e montada por concatenacao
 * (`.specify/specs/004-leitura-publica/plan.md`, secao Stack, slot
 * `persistencia`; REQ-164).
 *
 * **Por que este modulo declara a sua propria porta, com a mesma forma da de
 * `identidade-e-acesso`.** A regra de dependencia 3 de `target_architecture.md`
 * proibe, sem excecao, `contextos/<a>/` importar `contextos/<b>/` no topo do
 * modulo; e a regra 4 poe a porta no modulo que a CONSOME, nao no adaptador que
 * a implementa. Logo a duplicacao da forma e exigida pelo desenho, nao
 * descuido: a camada de dados unica que as duas resolvem e trabalho da feature
 * 015 (`015-plataforma-transversal`, T007), e e ela que vai satisfazer as duas
 * portas com um adaptador so.
 *
 * Quatro decisoes desta interface, cada uma lida do sistema analisado:
 *
 * 1. **Ha `escrever`, mesmo numa feature de leitura, e e por uma regra do
 *    legado.** A pos-condicao de UC-01 diz *"nada muda no armazenamento"* e
 *    *"o contador de visualizacoes nao existe"* — e isso vale para o conteudo
 *    e para a visita. Mas a tabela de regras de traducao de endereco e um
 *    CACHE gravado na configuracao do site, e o legado o reconstroi **durante
 *    uma leitura publica**, quando a opcao esta vazia:
 *    `WP_Rewrite::wp_rewrite_rules()` chama `refresh_rewrite_rules()`, que
 *    termina em `update_option( 'rewrite_rules', ... )`
 *    (`wp-includes/class-wp-rewrite.php:1493-1523`). Uma porta somente de
 *    leitura obrigaria T002 a escolher entre quebrar a regra ou refazer esta
 *    interface. Nada em T001 chama nenhum dos dois metodos.
 * 2. **Nao ha transacao.** BR-MIGRAR-104 mede zero `START TRANSACTION` e zero
 *    `COMMIT` em 1.467 arquivos, e o P5 da constituicao poe a cascata de
 *    apagamento no contrato observavel. Uma porta com transacao convidaria a
 *    envolver uma sequencia que no legado roda sem protecao.
 * 3. **Nao ha chave estrangeira nem restricao a declarar.** As 18 tabelas do
 *    legado tem 59 indices e zero chave estrangeira (P5, BR-MIGRAR-104), e
 *    REQ-169, que pediria a restricao, esta em `do-not-rewrite.md`.
 * 4. **Os metodos sao sincronos.** AD-04 de `target_architecture.md` fixa a
 *    fronteira de `await` em `adaptadores/`: `contextos/` e `plataforma/` sao
 *    sincronos. Promessa aqui contaminaria o chamador e mudaria a ordem de
 *    emissao, que AD-03 poe no contrato.
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
 * `persistencia`; BR-MIGRAR-088).
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
   * Esta na porta porque e fato da borda, nao regra — e esta feature precisa
   * dele desde a primeira consulta: a tabela de regras de traducao de endereco
   * mora na opcao `rewrite_rules`, e `options` e tabela **por site**. Numa rede,
   * cada site tem a sua tabela de regras, e o identificador do site entra no
   * nome da tabela (BR-MIGRAR-088).
   *
   * O `base_prefix` do legado — o prefixo das tabelas **globais**, `users` e
   * `usermeta` — nao esta declarado aqui de proposito: nenhuma consulta de T001
   * existe, e a primeira desta feature a tocar tabela global e a do arquivo de
   * autor (US-1). E a tarefa que a montar que o acrescenta, como T002 de
   * `001-identidade-e-acesso` fez com o dela. Ampliar a porta na tarefa que
   * precisa nao e refazer o esqueleto.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /**
   * Grava, e informa quantas linhas mudaram e a chave gerada, se houve.
   *
   * O unico uso desta feature e a reconstrucao do cache de regras de traducao
   * de endereco (item 1 do cabecalho deste arquivo). Conteudo, metadado e
   * contador de leitura **nao** se escrevem aqui: UC-01 fixa que a leitura nao
   * deixa rastro.
   */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
