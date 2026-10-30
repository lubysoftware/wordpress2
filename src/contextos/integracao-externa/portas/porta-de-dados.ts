/**
 * Porta de dados do modulo de integracao externa (BC-13).
 *
 * Entrega de **T007** (US-3): o ultimo degrau da precedencia de credencial de
 * conector (`I1`, BR-MIGRAR-068) e o valor guardado no banco —
 * `get_option( $setting_name, '' )` em `wp-includes/connectors.php:462` e
 * `get_option( $auth['setting_name'] ?? '', array() )` em `:570`. Foi para esta
 * tarefa que `portas/index.ts` reservou a porta desde T001.
 *
 * A forma e a MESMA que BC-01, BC-05 e BC-11 declaram nas portas deles, e isso
 * nao e copia por descuido: AD-10 proibe um contexto importar outro no topo do
 * modulo, e AD-08 poe a porta no contexto que a CONSOME.
 *
 * **So leitura.** T007 nao grava nada: resolver credencial e ler tres fontes e
 * dizer de qual veio. O cenario de precedencia de `PT-017` cobra justamente que
 * *"nenhuma das duas grava no banco a credencial que veio de fora dele"*, e uma
 * porta sem `escrever` torna isso verdade por construcao. Quem precisar gravar
 * (T009, US-4: *"toda credencial de integracao e rotacionavel"*) acrescenta o
 * metodo — o precedente desta arvore e declarar superficie na tarefa que a
 * exercita, como BC-05 fez com o prefixo base.
 *
 * Sem transacao (BR-MIGRAR-104) e sincrona (AD-04), pelos mesmos motivos das
 * outras portas de dados desta arvore.
 */

/** Valor que pode ocupar um marcador de consulta. */
export type ValorDeParametro = string | number | null | Uint8Array;

/** Valor que uma coluna devolve. O formato serializado e bytes, nao objeto. */
export type ValorDeColuna = string | number | null | Uint8Array;

/** Consulta parametrizada: o texto do SQL e os valores viajam separados. */
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

export interface PortaDeDados {
  /**
   * Prefixo das tabelas desta instalacao (o `$wpdb->prefix` do legado). A
   * credencial de conector e opcao do SITE, em `{site}options`: e o que faz o
   * `@concorrencia` de `PT-017` valer — *"dois sites da mesma instalacao com
   * credenciais de conector diferentes"*.
   */
  readonly prefixoDeTabela: string;

  /** Le linhas. */
  selecionar(consulta: Consulta): readonly LinhaDeResultado[];
}
