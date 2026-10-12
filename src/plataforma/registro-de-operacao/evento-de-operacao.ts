/**
 * A forma do evento de operacao: **instante, origem, severidade e contexto**.
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * Os quatro campos vem palavra por palavra de CA-1.1 (*"todo erro tratado e toda
 * falha de integracao produzem registro com instante, origem, severidade e
 * contexto"*) e da tabela *Contratos* do `plan.md`. US-1 e **T003**.
 *
 * ---
 *
 * ## Este e o unico modulo desta feature que o legado nao tem
 *
 * O `plan.md`, secao *Modelo de dados*, e literal na linha dele: *"registro de
 * operacao — **nao existe**: zero arquivo de log na arvore, 49 chamadas de
 * registro de erro em 12 arquivos, e o unico historico persistente de falha e a
 * opcao de falha de atualizacao automatica"*. As tres medicoes foram conferidas
 * nesta tarefa contra o oraculo:
 *
 * - 49 chamadas de `error_log(` em 12 arquivos, e **nenhuma** num caminho de
 *   dominio: oito arquivos do produto (`wp-cron.php`, `xmlrpc.php`,
 *   `wp-includes/class-wpdb.php`, `wp-includes/deprecated.php`,
 *   `wp-includes/rss.php`, `wp-includes/class-pop3.php`,
 *   `wp-admin/includes/class-wp-automatic-updater.php`,
 *   `wp-admin/includes/class-wp-community-events.php`), tres de biblioteca
 *   vendorizada (PHPMailer, SimplePie) e um de extensao empacotada (Akismet,
 *   que `BR-DESCARTAR-001` poe fora do escopo);
 * - o unico historico que **sobrevive a requisicao** e a opcao
 *   `auto_core_update_failed`, gravada em
 *   `wp-admin/includes/class-wp-automatic-updater.php:838` com o pacote montado
 *   em `:826`, e apagada so pelo caminho da atualizacao manual
 *   (`wp-admin/includes/update-core.php:1922`);
 * - escrever em arquivo depende do modo de depuracao: `wp_debug_mode()`
 *   (`wp-includes/load.php:578`) so chama `ini_set( 'log_errors', 1 )` e
 *   `ini_set( 'error_log', $log_path )` (`:631`, `:632`) **dentro** de
 *   `if ( WP_DEBUG )` (`:613`), com o caminho de fabrica
 *   `WP_CONTENT_DIR . '/debug.log'` (`:623`). E o que CA-1.5 recusa, e e o que
 *   torna este modulo acrescimo e nao porte.
 *
 * Acrescentar registro **e permitido**, e o P7 da constituicao diz com que
 * limite: *"registro e diagnostico novos podem ser acrescentados, mas nenhuma
 * decisao do sistema pode passar a depender deles"*, e a forma de conferir e
 * *"o registro acrescentado e so escrita: nenhuma ramificacao do codigo testa o
 * resultado de escrever log"*. E dai que vem o contrato da porta: registrar nao
 * devolve nada, e nao falha.
 */

/**
 * Valor que um campo de contexto pode carregar.
 *
 * Escalar, de proposito: o slot `observabilidade` do `plan.md` recomenda
 * *"registro estruturado em linha JSON"*, e a razao registrada e que *"REQ-159
 * AC2 e AC3 juntos pedem registro estruturado COM redacao de campo sensivel, e
 * redacao embutida e a diferenca entre cumprir o criterio e abrir o vazamento"*.
 * Campo aninhado e onde dado pessoal entra sem ninguem ver.
 */
export type ValorDeContexto = string | number | boolean | null;

/**
 * A severidade do evento.
 *
 * ⚠️ **Nao e uniao fechada, e a abertura e deliberada.** O legado nao tem log,
 * logo nao tem escala de severidade de log para copiar. O unico vocabulario de
 * severidade da arvore e o da tela de saude do site — `'good'`,
 * `'recommended'`, `'critical'`
 * (`wp-admin/includes/class-wp-site-health.php:172`, docblock em `:192`) —, e
 * aquilo **nao e um registro**: UC-37 fecha com *"nada foi armazenado: o
 * diagnostico e calculado a cada visita"*. Fechar a uniao aqui seria eleger uma
 * escala que nenhum documento deste pacote declara, e a forma de fechar sem
 * decidir nada esta em `BR-MIGRAR-075`: *"toda enumeracao do modelo vive em
 * `varchar(20)` sem `ENUM` e sem `CHECK`... o conjunto documentado e piso, nao
 * teto"*.
 *
 * Qual conjunto o sistema novo usa e trabalho de T003, contra o oraculo.
 */
export type Severidade = string;

/**
 * A origem do evento: que parte do sistema o produziu.
 *
 * Tambem aberta, e pelo mesmo motivo — mais um: CA-1.2 exige consulta **por
 * origem**, logo a origem e chave de busca, e chave de busca que o nucleo
 * fechasse impediria extensao de registrar a dela. `ESC-FILTRAVEL`
 * (BR-MIGRAR-108): *"toda regra deste catalogo e um default FILTRAVEL"*.
 */
export type Origem = string;

/**
 * O evento, como CA-1.1 o nomeia.
 *
 * ⚠️ **O instante chega por argumento; nao ha porta de relogio.** AD-08 declara
 * **cinco** bordas — dados, HTTP, sistema de arquivos, cache de objeto e e-mail
 * — e relogio nao e uma delas. Quem registra sabe que hora e, e o P4 da
 * constituicao ja cobra *"teste por atestado que fixa prazo e forca, com relogio
 * controlado"*: instante como dado e o que torna isso possivel sem inventar uma
 * sexta porta.
 *
 * ⚠️ **Nao ha campo de prazo, de validade nem de expurgo.** Ver
 * `./README.md`, *O que ninguem decidiu*, item 1: a metade de CA-1.3 que pede
 * *"prazo de retencao declarado"* colide com `ESC-RETENCAO` (BR-MIGRAR-113) e
 * com a linha *"introduzir limite de taxa, prazo de retencao ou qualquer numero
 * que o legado nao tem"* da tabela *Nao negociavel*. T002 nao declara o numero e
 * nao declara o campo que o carregaria.
 */
export interface EventoDeOperacao {
  /** Quando aconteceu, em milissegundos desde a epoca. */
  readonly instante: number;
  /** Que parte do sistema produziu o evento. */
  readonly origem: Origem;
  /** Quao grave. Conjunto aberto — ver {@link Severidade}. */
  readonly severidade: Severidade;
  /**
   * O que mais precisa ser dito, em campos escalares nomeados.
   *
   * CA-1.3 manda que aqui **nao** entre credencial nem dado pessoal alem do
   * declarado. Que a redacao seja embutida e a razao da recomendacao do slot
   * `observabilidade`; implementa-la e T003.
   */
  readonly contexto: { readonly [chave: string]: ValorDeContexto | undefined };
}

/**
 * O recorte de uma consulta ao registro.
 *
 * Os tres filtros sao os de CA-1.2 — *"consultavel por periodo, por severidade e
 * por origem"* — e a linha *consultar o registro* da tabela *Contratos* do
 * `plan.md` repete os tres. Todos opcionais: recorte ausente significa **sem
 * filtro**, e nao recusa.
 */
export interface RecorteDeConsulta {
  /** Instante inicial, inclusive. */
  readonly de?: number;
  /** Instante final, inclusive. */
  readonly ate?: number;
  readonly severidade?: Severidade;
  readonly origem?: Origem;
}
