/**
 * Porta de dados do modulo de operacao do software (BC-11).
 *
 * Segunda das cinco bordas de AD-08 (`target_architecture.md`), e a unica porta
 * deste modulo para o banco: nenhuma regra desta feature fala com o driver e
 * nenhuma consulta e montada por concatenacao (`plan.md`, slot `persistencia`;
 * REQ-164).
 *
 * A interface e deliberadamente a MESMA forma que BC-05 e BC-03 declaram nas
 * portas deles, e isso nao e copia por descuido: AD-10 proibe um contexto
 * importar outro no topo do modulo, e AD-08 poe a porta no contexto que a
 * CONSOME. Importar a porta de identidade daqui criaria exatamente a ligacao
 * horizontal que a regra de dependencia 3 recusa.
 *
 * **Por que o SQL atravessa esta porta como texto, e nao como construtor de
 * consulta tipado.** Nesta feature a exigencia tem um caso que nenhuma outra
 * tem: a evolucao de esquema do legado e **comparacao de estrutura**, nao
 * historico de migracoes (`DB-MIG`/BR-MIGRAR-085). `dbDelta()` le a estrutura
 * real com `DESCRIBE` e `SHOW INDEX`, compara com o DDL desejado e emite **so os
 * `ALTER TABLE` necessarios** (`wp-admin/includes/schema.php:36`,
 * `wp-admin/includes/upgrade.php:2936`). Leitura de estrutura e emissao de DDL
 * passam pelos mesmos dois metodos desta porta porque, no legado, passam pelo
 * mesmo `$wpdb`. Um construtor tipado esconderia a comparacao — e a comparacao
 * **e** o mecanismo que T013 porta.
 *
 * Tres ausencias desta interface sao deliberadas, e cada uma e regra lida do
 * sistema analisado:
 *
 * 1. **Nao ha transacao.** BR-MIGRAR-104 mede zero `START TRANSACTION` e zero
 *    `COMMIT` em 1.467 arquivos. Aqui isso tem efeito proprio: `DB-MIG` registra
 *    que a migracao do legado **nao tem rollback, so avanca**, e CA-6.3 cobra
 *    que a migracao que falha no meio deixe o banco "em estado declarado". Uma
 *    porta com transacao convidaria a envolver a migracao, e o estado declarado
 *    deixaria de ser o do legado — que e o meio da migracao, aplicado em parte.
 * 2. **Nao ha metodo de esquema nem de restricao.** AD-11 proibe mudanca de
 *    esquema nesta fase, e o P5 poe a cascata observavel no contrato. DDL, quando
 *    T013 o emitir, e texto como qualquer outro comando: e assim que o legado o
 *    emite.
 * 3. **Os metodos sao sincronos.** AD-04 fixa a fronteira de `await` em
 *    `adaptadores/`. Nesta feature isso e mais que estilo: o portao de ambiente
 *    de `A4` le a versao do banco (`$wpdb->db_version()`,
 *    `wp-admin/includes/class-wp-automatic-updater.php:285`) DENTRO da decisao
 *    de atualizar, antes de qualquer download, e o cenario de paridade de PT-013
 *    cobra que "nenhuma das duas tenta e falha: as duas recusam antes".
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
 * `persistencia`). Nesta feature o caso que fixa a exigencia e o `DESCRIBE`/
 * `SHOW INDEX` de `dbDelta()`: sao comandos sem parametro nenhum cujo resultado
 * decide quais `ALTER TABLE` saem, e o criterio de aceite desta area e
 * *"efeito no banco"* (Decisao 2 de `parity_specs.md`) — efeito no banco inclui
 * **qual comando saiu**.
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
   * Esta na porta porque e fato da borda, nao regra. E o prefixo em que vive a
   * tabela `options`, de onde sai a politica de atualizacao por site e a versao
   * de esquema (`db_version`, semeada por `populate_options()`,
   * `wp-admin/includes/schema.php`).
   */
  readonly prefixoDeTabela: string;

  /**
   * Prefixo base da instalacao (o `$wpdb->base_prefix` do legado).
   *
   * **Sao dois prefixos, e nao um, porque o legado tem dois** — e nesta feature
   * a diferenca nao e detalhe: o unico historico persistente de falha do sistema
   * inteiro e gravado com `update_site_option( 'auto_core_update_failed', ... )`
   * (`wp-admin/includes/class-wp-automatic-updater.php:838` e `:873`), e o
   * registro de aviso ja enviado com `auto_core_update_notified` (`:861`). Em
   * rede, opcao de rede vive em `sitemeta`, que e **global** e fica sempre no
   * prefixo base; em site unico os dois prefixos sao iguais, e e por isso que a
   * diferenca passa despercebida ate a primeira rede.
   *
   * Derivar um do outro por corte de texto nao funciona: um prefixo base pode,
   * ele mesmo, terminar em digito e sublinhado.
   *
   * Os dois campos nascem juntos aqui — diferente de BC-05, onde T001 declarou
   * so o do site e T002 acrescentou o base — porque a opcao de rede e o estado
   * central desta feature, e T002 daqui a le e grava na primeira linha que
   * escrever.
   */
  readonly prefixoBaseDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];

  /** Grava, e informa quantas linhas mudaram e a chave gerada, se houve. */
  escrever(consulta: Consulta): ResultadoDeEscrita;
}
