/**
 * `exclusao/` — a area de comportamento da **exclusao definitiva**, com o
 * reposicionamento de filhos e anexos no avo (US-8).
 *
 * Entrega de **T017**: *"o comportamento de US-8 existe e os criterios CA-8.1,
 * CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo"*
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * **Por que pasta propria, e nao dentro de `descarte/`.** As duas areas sao duas
 * funcoes do legado que **chamam uma a outra**, e cada uma tem o seu mundo:
 * `wp_trash_post()` nao monta SQL nenhum e vive de dois marcadores e de uma
 * gravacao por ligacao tardia; `wp_delete_post()` monta nove comandos crus sobre
 * tres tabelas e tem oito pontos de extensao proprios. Juntar as duas numa pasta
 * so misturaria os contextos e esconderia qual ponto de extensao pertence a
 * qual pedido. O ciclo entre elas nao vira `import` circular: daqui para
 * `../descarte/` ha `import`, e de la para ca ha **campo do contexto**
 * (`ExclusaoDefinitivaNoDescarte`, declarado por T003 e fechado aqui por
 * {@link exclusaoDefinitivaDe}).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `apagar-em-definitivo.ts` | a operacao, e `wp_delete_post()` — tres desvios, sete etapas e um `DELETE` |
 * | `reposicionamento-no-avo.ts` | **CA-8.1**, **CA-8.2** e o censo de **CA-8.4** |
 * | `comandos-da-exclusao.ts` | os comandos crus das sete etapas, sobre `{site}posts`, `{site}comments` e `{site}postmeta` |
 * | `contexto-de-exclusao.ts` | o que chega por argumento, de quem cada peca e, e os oito pontos de extensao |
 * | `permissao-de-exclusao.ts` | `delete_post` — a **mesma** capacidade do descarte — e os textos proprios da acao `delete` |
 * | `us-8-reparentar-filhos-e-anexos.test.ts` | os quatro criterios, a sequencia de comandos e os orfaos que o legado deixa |
 *
 * **O que esta pasta nao tem:** a exclusao de **midia** (desviada para BC-06 no
 * passo 3, e decidida pela resposta 9), a coleta do que venceu (T011, que e quem
 * chama esta operacao por prazo), a restauracao (T007) e o aviso ao ator — que
 * **nao existe no legado** e cujo criterio, CA-4.2, continua parado em
 * `../descarte/aviso-de-exclusao-definitiva.ts`.
 */

export {
  MENSAGEM_DE_USO_INDEVIDO,
  TIPOS_COM_DESVIO_PARA_A_LIXEIRA,
  apagadoNaVisaoDoChamador,
  apagarConteudo,
  apagarEmDefinitivo,
  exclusaoDefinitivaDe,
  type DesfechoDaExclusao,
  type PedidoDeExclusao,
  type ResultadoDaExclusao,
} from './apagar-em-definitivo.js';

export {
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO_ANTERIOR,
  criarComandosDaExclusao,
  lerRegistroNaExclusao,
  type ComandosDaExclusao,
  type RegistroNaExclusao,
} from './comandos-da-exclusao.js';

export type {
  ClassificacaoNaExclusao,
  ComentariosNaExclusao,
  ContextoDeExclusao,
  ExclusaoDeAnexoNaExclusao,
  GanchosDaExclusao,
  LimpezaDePublicacaoAgendada,
  TiposNaExclusao,
  VersoesNaExclusao,
} from './contexto-de-exclusao.js';

export {
  CAPACIDADE_DE_APAGAR,
  CODIGO_DE_FALHA_DE_EXCLUSAO_NA_API,
  CODIGO_DE_RECUSA_DE_EXCLUSAO_NA_API,
  CODIGO_HTTP_DE_CONTEUDO_JA_APAGADO_NO_PAINEL,
  CODIGO_HTTP_DE_FALHA_AO_APAGAR_NO_PAINEL,
  CODIGO_HTTP_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  MENSAGEM_DE_CONTEUDO_JA_APAGADO_NO_PAINEL,
  MENSAGEM_DE_FALHA_AO_APAGAR_ANEXO_NO_PAINEL,
  MENSAGEM_DE_FALHA_AO_APAGAR_NO_PAINEL,
  MENSAGEM_DE_FALHA_DE_EXCLUSAO_NA_API,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_NO_PAINEL,
  autorizarExclusao,
  type RecusaDaExclusao,
} from './permissao-de-exclusao.js';

export {
  reposicionarAnexosNoAvo,
  reposicionarFilhosNoAvo,
  type ReposicionamentoDeFilhos,
} from './reposicionamento-no-avo.js';
