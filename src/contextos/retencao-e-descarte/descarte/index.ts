/**
 * `descarte/` — a area de comportamento do **descarte para a lixeira**, US-1.
 *
 * Entrega de **T003**: *"o comportamento de US-1 existe e os criterios CA-1.1,
 * CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo"*
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `descartar-para-a-lixeira.ts` | a operacao e `wp_trash_post()`, com os doze passos na ordem do legado |
 * | `permissao-de-descarte.ts` | CA-1.3, CA-1.4 e CA-1.5 — a pergunta `delete_post`, e as tres superficies que recusam |
 * | `contexto-de-descarte.ts` | o que chega por argumento, e de quem cada peca e |
 * | `estado-de-lixeira.ts` | CA-1.2 — o estado `trash` como o legado o **registra** |
 * | `us-1-descartar-conteudo.test.ts` | os cinco criterios, e a sequencia de comandos que a area 3 da Decisao 2 compara |
 *
 * **O que esta pasta nao tem, com a tarefa de cada um:** a suspensao dos
 * comentarios (T005), a restauracao (T007), o aviso de irreversibilidade
 * (T009), a coleta do que venceu (T011), a expiracao do rascunho automatico
 * (T013), a tolerancia a inconsistencia (T015) e o reparenteamento ao apagar em
 * definitivo (T017). As duas que esta operacao **chama** — a cascata de
 * comentarios e a exclusao definitiva — entram pelo contexto, na posicao exata
 * do fluxo; ver `contexto-de-descarte.ts`.
 */

export {
  descartar,
  descartarParaALixeira,
  type DesfechoDoDescarte,
  type PedidoDeDescarte,
  type ResultadoDoDescarte,
} from './descartar-para-a-lixeira.js';

export {
  CAPACIDADE_DE_DESCARTAR,
  CODIGO_DE_RECUSA_NA_API,
  CODIGO_DE_RECUSA_NA_API_DENTRO_DA_OPERACAO,
  CODIGO_HTTP_DE_CONTEUDO_INEXISTENTE_NO_PAINEL,
  CODIGO_HTTP_DE_RECUSA_NO_PAINEL,
  CODIGO_HTTP_DE_RECUSA_NO_XML_RPC,
  MENSAGEM_DE_CONTEUDO_INEXISTENTE_NO_PAINEL,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO,
  MENSAGEM_DE_RECUSA_NO_PAINEL,
  autorizarDescarte,
  codigoDeAutorizacaoExigida,
  type RecusaDoDescarte,
} from './permissao-de-descarte.js';

export type {
  ArmazenamentoNoDescarte,
  ConteudoNoDescarte,
  ContextoDeDescarte,
  ExclusaoDefinitivaNoDescarte,
  GanchosDoDescarte,
  RegistroNoDescarte,
  SuspensaoDeComentariosNoDescarte,
} from './contexto-de-descarte.js';

export {
  ESTADO_DE_LIXEIRA,
  PROPRIEDADES_DO_ESTADO_DE_LIXEIRA,
  type PropriedadesDoEstadoRegistrado,
} from './estado-de-lixeira.js';
