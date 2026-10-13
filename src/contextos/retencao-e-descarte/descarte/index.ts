/**
 * `descarte/` — a area de comportamento do **descarte para a lixeira** (US-1) e
 * do **aviso de que apagar nao tem volta quando a lixeira esta desligada**
 * (US-4).
 *
 * As duas historias moram na mesma pasta porque `plan.md` as poe juntas na
 * secao *Sequencia* — *"o aviso de irreversibilidade (REQ-050) junto do
 * descarte"* — e porque as duas sao a mesma primeira linha de
 * `wp_trash_post()` lida de dois lados: US-1 do lado em que ha lixeira, US-4 do
 * lado em que nao ha.
 *
 * Entrega de **T003**: *"o comportamento de US-1 existe e os criterios CA-1.1,
 * CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo"*. Entrega de
 * **T009**: o mesmo para US-4 — **menos CA-4.2**, que esta parado por conflito
 * registrado (ver `aviso-de-exclusao-definitiva.ts`)
 * (`.specify/specs/005-retencao-e-descarte/tasks.md`).
 *
 * | arquivo | o que e | tarefa |
 * |---|---|---|
 * | `descartar-para-a-lixeira.ts` | a operacao e `wp_trash_post()`, com os doze passos na ordem do legado | T003 |
 * | `permissao-de-descarte.ts` | CA-1.3, CA-1.4 e CA-1.5 — a pergunta `delete_post`, e as tres superficies que recusam | T003 |
 * | `contexto-de-descarte.ts` | o que chega por argumento, e de quem cada peca e | T003 |
 * | `estado-de-lixeira.ts` | CA-1.2 — o estado `trash` como o legado o **registra** | T003 |
 * | `us-1-descartar-conteudo.test.ts` | os cinco criterios de US-1, e a sequencia de comandos que a area 3 da Decisao 2 compara | T003 |
 * | `lixeira-desligada.ts` | CA-4.1 — a pergunta *"ha lixeira?"* nas **tres** formas em que o legado a faz | **T009** |
 * | `acoes-de-descarte-na-tela.ts` | CA-4.3 e CA-4.4 — o que a tela oferece antes da acao, como **dado** | **T009** |
 * | `aviso-de-exclusao-definitiva.ts` | o que cada superficie diz ao ator, e a **PARADA de CA-4.2** | **T009** |
 * | `us-4-aviso-de-exclusao-definitiva.test.ts` | CA-4.1, CA-4.3 e CA-4.4, mais a ausencia que CA-4.2 contradiz | **T009** |
 *
 * **O que esta pasta nao tem, com a tarefa de cada um:** a suspensao dos
 * comentarios (T005), a restauracao (T007), a coleta do que venceu (T011), a
 * expiracao do rascunho automatico (T013), a tolerancia a inconsistencia (T015)
 * e o reparenteamento ao apagar em definitivo (T017). As duas que a operacao de
 * US-1 **chama** — a cascata de comentarios e a exclusao definitiva — entram
 * pelo contexto, na posicao exata do fluxo; ver `contexto-de-descarte.ts`.
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

export {
  lixeiraSuportadaNaApi,
  perguntasDaLixeiraDivergem,
} from './lixeira-desligada.js';

export {
  DESCRICAO_NA_LINHA,
  GANCHOS_DAS_ACOES_NA_TELA,
  ROTULO_DE_DESCARTE_EM_MASSA,
  ROTULO_DE_DESCARTE_NA_LINHA,
  ROTULO_DE_DESCARTE_NO_EDITOR,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_EM_MASSA,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR,
  ROTULO_DE_RESTAURACAO,
  acaoNoEditor,
  acoesEmMassa,
  acoesNaLinha,
  enderecoDeExclusao,
  type AcaoDeDescarte,
  type AcaoDeDescarteNaTela,
  type AcaoNaRotaDoPainel,
  type EnderecoDeExclusao,
  type RegistroNaTelaDeDescarte,
  type VisaoDaListaDeConteudo,
} from './acoes-de-descarte-na-tela.js';

export {
  CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  CONFIRMACAO_DE_EXCLUSAO_DE_MIDIA,
  CONFIRMACAO_PEDIDA_AO_ATOR,
  MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  confirmacaoDeExclusaoDeLink,
  ganchoDeSuporteALixeiraNaApi,
  recusaDeLixeiraNaoSuportadaNaApi,
  type RecusaDeLixeiraNaoSuportada,
  type SuperficieDoDescarte,
} from './aviso-de-exclusao-definitiva.js';
