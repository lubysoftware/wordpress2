/**
 * `abertura/` — abrir a solicitacao de dados pessoais, identificada pelo
 * **endereco de e-mail** e nao pela conta.
 *
 * Entrega de **T003** da feature `008-privacidade-e-dados-pessoais` (US-1):
 * *"o comportamento de US-1 existe e os criterios CA-1.1, CA-1.2, CA-1.3,
 * CA-1.4, CA-1.5 passam contra o sistema novo"*. O caso de uso e
 * [UC-25](../../../../.specify/use-cases/UC-25-abrir-solicitacao-de-dados-pessoais.md).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-abertura.ts` | os colaboradores de ligacao tardia: as duas leituras de conta (BC-05), a insercao (BC-01), os dois `WP_Query` (feature 004), os dois instantes e as quatro sanitizacoes |
 * | `permissao-de-abertura.ts` | **CA-1.1**: as capacidades de cada tela, o `wp_die()` de cada uma, e a divergencia 🔴 entre *"a acao pedida"* e o que o legado confere |
 * | `abrir-solicitacao.ts` | **CA-1.2**, **CA-1.3** e **CA-1.5**: `wp_create_user_request()` com os sete passos na ordem, os quatro erros e a duplicidade |
 * | `tela-de-abertura.ts` | **CA-1.1 aplicada**: o portao, o tratador da tela, os avisos acumulados e o ponto em que T005 encaixa o envio |
 * | `lista-de-solicitacoes.ts` | **CA-1.4**: `prepare_items()` e o dado da coluna de estado |
 * | `us-1-abrir-solicitacao.test.ts` | os cinco criterios de US-1, afirmados por efeito no banco e por sequencia de comandos |
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`): *"snapshot + sequencia de comandos"*, com zero
 * tolerancia. A spec de paridade e `PT-012`, e desta pasta sao duas metades de
 * dois cenarios:
 *
 * - **`@invariante` de `D1`** — *"as duas a gravam como conteudo do mesmo
 *   tipo"*, *"o campo que guarda o endereco do titular e o mesmo nas duas"*, *"o
 *   estado inicial gravado e o mesmo nas duas"* e *"nenhuma das duas cria tabela
 *   propria"*. T002 deixou os quatro afirmaveis pela forma; esta tarefa os torna
 *   afirmaveis pelo **pedido que atravessa a ligacao tardia**, que e o que o
 *   legado entrega a `wp_insert_post()`.
 * - **`@invariante` de `D2`** — *"nenhuma das duas exporta nem apaga nada"* e
 *   *"nenhuma das duas muda o estado da solicitacao"* **antes** da confirmacao.
 *   A primeira metade fecha aqui, com o registro de provedores intocado na
 *   abertura (CA-1.5); a segunda e de T005.
 *
 * ⚠️ **O que esta pasta NAO torna conferivel:** nada que dependa de chave, de
 * prazo ou de e-mail — a chave e gerada no **envio**, e o envio e T005. E o
 * cenario de concorrencia continua afirmado so pela composicao, como em T001 e
 * T002.
 */

export {
  DADOS_DO_PEDIDO_PADRAO,
  ERROS_DA_ABERTURA,
  ESTADOS_DE_SOLICITACAO_INCOMPLETA,
  ESTADO_PEDIDO_PADRAO,
  abrirSolicitacao,
  type ErroDaAbertura,
  type PedidoDeAbertura,
  type ResultadoDaAbertura,
} from './abrir-solicitacao.js';

export type {
  ChaveSanitizada,
  CodificacaoJson,
  ConferenciaDeEmail,
  ConsultaDeSolicitacoes,
  ContaDoTitular,
  ContaNaAbertura,
  ContextoDeAbertura,
  ConteudoNaPrivacidade,
  EmailSanitizado,
  PedidoDeInsercaoDaSolicitacao,
  RelogioNaAbertura,
  ResultadoDaConsultaDeSolicitacoes,
  ResultadoDaInsercaoDaSolicitacao,
  TextoSanitizado,
  VariaveisDaConsultaDeSolicitacoes,
} from './contexto-de-abertura.js';

export {
  ESTADO_QUALQUER_NA_LISTA,
  ITENS_POR_PAGINA_DA_LISTA,
  ORDENACAO_DA_LISTA,
  ORDENS_DA_LISTA,
  SUFIXO_DA_CHAVE_DE_PAGINACAO,
  estadoVisivelNaLista,
  itensPorPaginaDaLista,
  listarSolicitacoes,
  pontoDeItensPorPagina,
  type EstadoVisivelNaLista,
  type ItemDaListaDeSolicitacoes,
  type PedidoDaListaDeSolicitacoes,
  type ResultadoDaListaDeSolicitacoes,
} from './lista-de-solicitacoes.js';

export {
  ACAO_DA_SUPERFICIE,
  CAPACIDADES_POR_ACAO,
  CAPACIDADE_DE_APAGAR_CONTAS,
  CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  MENSAGEM_DE_APAGAMENTO_NAO_PERMITIDO,
  MENSAGEM_DE_EXPORTACAO_NAO_PERMITIDA,
  MENSAGEM_DE_RECUSA_DA_SUPERFICIE,
  RECUSA_PADRAO_DE_TELA,
  autorizarAbertura,
  type AutorizacaoNaAbertura,
  type DecisaoDaAbertura,
  type RecusaDaAbertura,
  type SuperficieDeAbertura,
} from './permissao-de-abertura.js';

export {
  ACOES_DA_TELA_DE_ABERTURA,
  AJUSTE_DO_ENDERECO,
  AJUSTE_DO_TIPO_DE_ACAO,
  ESTADO_PEDIDO_SEM_CONFIRMACAO,
  MENSAGENS_DA_TELA_DE_ABERTURA,
  NONCE_DA_TELA_DE_ABERTURA,
  abrirSolicitacaoPelaTela,
  type AvisoDaTela,
  type PedidoDaTelaDeAbertura,
  type ResultadoDaTelaDeAbertura,
} from './tela-de-abertura.js';
