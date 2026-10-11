/**
 * A forma de um provedor de dado pessoal: o que um exportador e um apagador
 * declaram, e o que cada um devolve por pagina.
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`, metade da
 * entrega *"e o registro de provedores de dado pessoal vazio e inspecionavel"*.
 * `satisfaz: — (infraestrutura)`: percorrer os provedores e de **T011** (US-5) e
 * **T013** (US-6); aqui so a forma do que sera percorrido.
 *
 * **Isto e contrato publico, nao detalhe de implementacao.** `plan.md` poe o
 * registro na tabela de modelo de dados como *"registro em memoria, povoado por
 * ponto de extensao: cada modulo e cada extensao declara o que sabe exportar e
 * apagar"* e conclui: *"e ponto de extensao e portanto e produto (P2 da
 * constituicao)"*. O P2 manda preservar *"o nome, os argumentos, a ordem de
 * disparo e a capacidade de alterar o resultado"*, e os nomes do legado sao
 * `wp_privacy_personal_data_exporters` e `wp_privacy_personal_data_erasers`
 * (`wp-includes/default-filters.php:455` a `:458`).
 *
 * ## Os argumentos, lidos da chamada do legado
 *
 * O chamador faz `call_user_func( $callback, $email_address, $page )` —
 * `wp-admin/includes/ajax-actions.php:5102` para exportar e `:5292` para apagar.
 * Dois argumentos, nesta ordem, e a **pagina comeca em 1**: o laco do navegador
 * abre com `doNextExport( 1, 1 )` (`wp-admin/js/privacy-tools.js:159`).
 *
 * ⚠️ **O laco de paginas e do lado do cliente no legado, e isso muda o desenho de
 * T011.** `doNextExport( exporterIndex, pageIndex )`
 * (`wp-admin/js/privacy-tools.js:118`) chama o servidor uma vez por pagina e
 * decide sozinho se avanca a pagina (`:142`) ou passa ao provedor seguinte
 * (`:146`), com `exportersCount` vindo de um atributo da tela (`:67`). O servidor
 * e **sem memoria entre paginas**: cada chamada e um processo novo que reconstroi
 * o registro e acumula o resultado em metadado da solicitacao
 * (`_export_data_raw`, `wp-admin/includes/privacy-tools.php:807` e `:818`). CA-5.6
 * — *"uma execucao interrompida pode ser retomada do ponto em que parou"* — e
 * consequencia desse acumulo, nao de estado em memoria. Quem pegar T011 decide
 * onde o laco mora **depois** de ler isso; T001 nao decide, e nao precisa.
 *
 * ## A chave do registro, e por que ela nao e so um rotulo
 *
 * Cada provedor entra sob uma chave (`wordpress-user`, `wordpress-comments`,
 * `wordpress-media`), e o chamador acha o provedor da vez **por posicao**:
 * `$exporter_keys = array_keys( $exporters ); $exporter_key = $exporter_keys[ $exporter_index - 1 ]`
 * (`ajax-actions.php:5067` e `:5068`). Logo a **ordem do registro e observavel**,
 * e a chave aparece nas mensagens de erro do legado. Ver
 * `./registro-de-provedores.ts`, que trata a ordem.
 */

/**
 * Um par nome/valor dentro de um item exportado — o `array( 'name' => ..., 'value' => ... )`
 * do legado (`wp-includes/user.php:4215` e `:4216`).
 */
export interface CampoExportado {
  readonly nome: string;
  readonly valor: string;
}

/**
 * Um dado exportado, na forma exata que o acumulador do legado espera ler:
 * `group_id`, `group_label`, `group_description` opcional, `item_id` e `data`
 * (`wp-admin/includes/privacy-tools.php:834` a `:857`).
 *
 * Os quatro identificadores viajam **em cada dado**, e nao num envelope por
 * grupo, porque e assim que o legado agrupa: ele varre a lista plana e monta os
 * grupos por `group_id`, fundindo item com item de mesmo `item_id`. Quem
 * reagrupar aqui mudaria a ordem das chaves do relatorio, que e observavel.
 */
export interface DadoExportado {
  readonly identificadorDoGrupo: string;
  readonly rotuloDoGrupo: string;
  /** `group_description`: ausente quando o provedor nao o informa. */
  readonly descricaoDoGrupo?: string;
  readonly identificadorDoItem: string;
  readonly campos: readonly CampoExportado[];
}

/**
 * O que um provedor devolve quando o provedor **falhou**.
 *
 * No legado e um `WP_Error`, e o chamador o traduz em resposta de erro
 * (`ajax-actions.php:5104`, `:5294`). Entra como variante de valor, e nunca como
 * excecao, por AD-06 — *"falha de negocio e VALOR DE RETORNO, nao excecao"*
 * (cabecalho de `parity_tests/12-solicitacao-de-dado-pessoal.feature`).
 *
 * 🔴 **O que o legado faz com esta falha contradiz CA-5.3, e T001 nao resolve.**
 * O chamador responde `wp_send_json_error` e o laco do navegador **para**:
 * `if ( ! response.success ) { ... onExportFailure( response.data ); return; }`
 * (`wp-admin/js/privacy-tools.js:135` a `:138`). CA-5.3 e a tabela de excecoes de
 * UC-27 dizem que *"um provedor que falha e reportado e nao interrompe os
 * demais"*. A divergencia esta registrada em `../README.md`; ela e de **T011**.
 */
export interface FalhaDoProvedor {
  readonly falhou: true;
  /** A mensagem que o provedor informou, que e o que a tela mostra. */
  readonly mensagem: string;
}

/** Uma pagina de exportacao, com a declaracao de que o provedor terminou. */
export interface PaginaExportada {
  readonly falhou: false;
  /** O `data` da resposta: pode vir vazio numa pagina que nao achou nada. */
  readonly dados: readonly DadoExportado[];
  /**
   * O `done` da resposta (`ajax-actions.php:5129`). **Nao e sucesso**: e o
   * provedor dizendo que nao tem mais pagina. CA-5.2 e literal — *"cada provedor
   * de dados e chamado por pagina e declara se terminou"*.
   */
  readonly terminou: boolean;
}

export type RespostaDeExportacao = PaginaExportada | FalhaDoProvedor;

/**
 * Uma pagina de apagamento.
 *
 * 🔴 **`itensRemovidos` e `itensRetidos` sao BOOLEANOS, e isso contraria a
 * redacao de CA-6.2 em tres documentos do pacote.** No legado os dois campos sao
 * declarados `@type bool` — *"Whether items were actually removed or not"* e
 * *"Whether items were retained or not"* (`ajax-actions.php:5385` e `:5386`) —,
 * o apagador do nucleo devolve `false`/`true` (`wp-includes/comment.php:4314` a
 * `:4398`) e o laco do navegador os acumula como booleanos
 * (`wp-admin/js/privacy-tools.js:246`, `hasRemoved` e `hasRetained`).
 * CA-6.2, o fluxo alternativo de UC-27 e `UT-091-2` dizem *"quantos itens
 * removeu e quantos nao pode remover"*.
 *
 * T001 segue o legado porque o **P1** manda: *"o comportamento observavel do
 * legado e a especificacao... divergir exige uma decisao humana registrada,
 * citada no codigo que divergiu"*, e nenhuma das tres divergencias autorizadas e
 * esta. A divergencia esta registrada em `../README.md` para quem decide, e
 * **T013** nao fecha CA-6.2 ao pe da letra sem essa decisao.
 */
export interface PaginaApagada {
  readonly falhou: false;
  /** `items_removed`: houve remocao nesta pagina. */
  readonly itensRemovidos: boolean;
  /** `items_retained`: algo ficou, e por isso ha mensagem. */
  readonly itensRetidos: boolean;
  /**
   * `messages`: o motivo declarado pelo provedor para o que ficou. E deste campo
   * que sai o relatorio de CA-6.3.
   */
  readonly mensagens: readonly string[];
  /** O `done` da resposta: o provedor nao tem mais pagina. */
  readonly terminou: boolean;
}

export type RespostaDeApagamento = PaginaApagada | FalhaDoProvedor;

/**
 * Um exportador registrado — o `array( 'exporter_friendly_name' => ..., 'callback' => ... )`
 * do legado (`wp-includes/user.php:4026` a `:4029`).
 *
 * As duas validacoes que o legado faz sobre esta forma estao no tipo: a ausencia
 * do nome amigavel e a ausencia do callback sao erros nomeados
 * (`ajax-actions.php:5078` e `:5087`), e aqui sao impossiveis por construcao.
 */
export interface ExportadorDeDadoPessoal {
  /** `exporter_friendly_name`: aparece na tela e nas mensagens de erro. */
  readonly nomeAmigavel: string;
  /** O `callback`, com os dois argumentos do legado e a pagina comecando em 1. */
  exportar(enderecoDeEmail: string, pagina: number): RespostaDeExportacao;
}

/**
 * Um apagador registrado — o `array( 'eraser_friendly_name' => ..., 'callback' => ... )`
 * do legado (`wp-includes/comment.php:4283` a `:4286`).
 */
export interface ApagadorDeDadoPessoal {
  /** `eraser_friendly_name`. */
  readonly nomeAmigavel: string;
  /** O `callback`, com os dois argumentos do legado e a pagina comecando em 1. */
  apagar(enderecoDeEmail: string, pagina: number): RespostaDeApagamento;
}
