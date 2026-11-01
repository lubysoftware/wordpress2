/**
 * `restauracao/` — a area de comportamento da **restauracao de conteudo da
 * lixeira como rascunho** (US-3).
 *
 * Entrega de **T007**: *"o comportamento de US-3 existe e os criterios CA-3.1,
 * CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema novo"*
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * **Por que pasta propria.** `wp_untrash_post()` nao chama o descarte nem a
 * exclusao, nao le prazo nem relogio e tem quatro pontos de extensao proprios:
 * dentro de `descarte/`, o contexto dela herdaria campos que o legado nao usa.
 *
 * | arquivo | o que e | criterio |
 * |---|---|---|
 * | `restaurar-da-lixeira.ts` | a operacao e `wp_untrash_post()`, os treze passos na ordem | CA-3.3, CA-3.4 |
 * | `estado-na-restauracao.ts` | o default `draft`/`inherit`, e `wp_untrash_post_set_previous_status()` | CA-3.1, CA-3.2 |
 * | `permissao-de-restauracao.ts` | `delete_post`, resolvida pelo estado anterior, e as quatro superficies | CA-3.5 |
 * | `contexto-de-restauracao.ts` | o que chega por argumento, e os quatro pontos de extensao | — |
 * | `us-3-restaurar-conteudo.test.ts` | os cinco criterios, e a sequencia de comandos | — |
 *
 * **O que esta pasta nao tem:** a devolucao dos comentarios (T005, ligada por
 * `cascataNaRestauracao()`) e a resolucao do estado do anexo na leitura, que e de
 * BC-01.
 */

export {
  restaurar,
  restauradoNaVisaoDoChamador,
  restaurarDaLixeira,
  type DesfechoDaRestauracaoDoConteudo,
  type PedidoDeRestauracao,
  type ResultadoDaRestauracaoDoConteudo,
} from './restaurar-da-lixeira.js';

export {
  ESTADO_DE_RASCUNHO,
  ESTADO_HERDADO,
  estadoAnteriorNaRestauracao,
  estadoPadraoDaRestauracao,
} from './estado-na-restauracao.js';

export {
  CAPACIDADE_DE_RESTAURAR,
  CODIGO_HTTP_DE_CONTEUDO_INEXISTENTE_NA_RESTAURACAO,
  CODIGO_HTTP_DE_FALHA_AO_RESTAURAR_NO_PAINEL,
  CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  MENSAGEM_DE_CONTEUDO_INEXISTENTE_NA_RESTAURACAO,
  MENSAGEM_DE_FALHA_AO_RESTAURAR_NO_PAINEL,
  MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  autorizarRestauracao,
  type RecusaDaRestauracao,
} from './permissao-de-restauracao.js';

export type {
  ArmazenamentoNaRestauracao,
  ConteudoNaRestauracao,
  ContextoDeRestauracao,
  GanchosDaRestauracao,
  RegistroNaRestauracao,
  RestauracaoDeComentariosNaRestauracao,
} from './contexto-de-restauracao.js';
