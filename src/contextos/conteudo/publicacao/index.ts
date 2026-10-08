/**
 * `publicacao/` — levar o conteudo ao publico por ato explicito.
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao` (US-1), e e UC-03
 * menos o que pertence a outras historias (ver a lista no fim).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-publicacao.ts` | o contexto, as duas portas de ligacao tardia e os **dez** pontos de extensao |
 * | `permissao-de-publicacao.ts` | **CA-1.1**: a capacidade do tipo, as recusas literais e a divergencia de redacao do criterio |
 * | `termo-padrao-na-publicacao.ts` | **CA-1.4**: os cinco ramos do laco de termo padrao, e a categoria como excecao por nome |
 * | `transicao-de-estado.ts` | **CA-1.2**, **CA-1.3** e **CA-1.5**: os tres pontos, a cadeia por prioridade e o ouvinte do nucleo |
 * | `publicar.ts` | a operacao e `wp_publish_post()` — as duas, e a razao de serem duas |
 * | `us-1-publicar-conteudo.test.ts` | os cinco criterios, afirmados por efeito no banco e por sequencia de pontos |
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2), somado ao
 * **valor devolvido pelo ponto de extensao, byte a byte**, e a **ordem de
 * emissao** deles. A spec de paridade e
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 * e desta pasta sao tres dos onze cenarios:
 *
 * - *"Nenhuma transicao para publicado acontece por efeito colateral"*;
 * - *"Conteudo do tipo padrao sempre recebe a categoria padrao"*, na metade
 *   *"e na publicacao a regra se repete para toda taxonomia que tenha termo
 *   padrao"*;
 * - *"Republicar e operacao nula e nenhum gancho de transicao dispara"*;
 * - e o ultimo, *"a ordem dos pontos de filtro na gravacao e a mesma nas duas
 *   metades"*, que e o que a suite desta pasta afirma com a sequencia de pontos.
 *
 * **Nenhum deles e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que
 * esta pasta faz, e o que o README deste modulo manda fazer, e citar **arquivo e
 * linha** do legado em cada afirmacao, em vez de descrever comportamento de
 * memoria.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o estado resolvido na gravacao (o `draft` que divide com o `publish` do DDL) | **T005**, US-2 |
 * | a unicidade do identificador na URL, que `wp_publish_post()` **nao** cobra | **T007**, US-3 |
 * | o estado `private` como visibilidade | **T009**, US-4 |
 * | os criterios da republicacao nula — a guarda esta aqui, as afirmacoes nao | **T011**, US-5 |
 * | o agendamento, a comparacao de data e a verificacao dupla | **T013**, US-6 |
 * | o rebaixamento para `pending` de quem nao pode publicar | **T015**, US-7 |
 * | a soma de capacidade sobre conteudo alheio | **T017**, US-8 |
 * | a notificacao ao autor — e a parada registrada sobre ela | **T019**, US-9 |
 * | a versao anterior | **T021**, US-10 |
 * | o rascunho automatico | **T023**, US-11 |
 * | a sanitizacao do corpo (REQ-030), o formato do corpo (REQ-032) e a trilha editorial (REQ-028) | **ninguem deste pacote** — `do-not-rewrite.md` e as *Perguntas em aberto* de `spec.md` |
 * | o cache de objeto, o barramento de pontos de extensao e a fila agendada | REQ-165, REQ-162 e a feature 011 |
 */

export {
  GANCHO_DE_PUBLICACAO_AGENDADA,
  type ArmazenamentoNaPublicacao,
  type ClassificacaoNaPublicacao,
  type ContextoDePublicacao,
  type EnderecoDoConteudo,
  type FilaNaPublicacao,
  type GanchosDaPublicacao,
  type TaxonomiaNaPublicacao,
  type TermosDoConteudoNaPublicacao,
} from './contexto-de-publicacao.js';

export {
  CAPACIDADE_DE_PUBLICAR,
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO,
  MENSAGEM_DE_RECUSA_DE_PUBLICACAO,
  autorizarPublicacao,
  capacidadeDePublicar,
  codigoDeAutorizacaoExigida,
  type CodigoDeRecusaDaPublicacao,
  type RecusaDaPublicacao,
} from './permissao-de-publicacao.js';

export {
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  TAXONOMIA_DE_CATEGORIA,
  aplicarTermoPadrao,
  chaveDoTermoPadrao,
  type TermoPadraoAtribuido,
} from './termo-padrao-na-publicacao.js';

export {
  ESTADO_PUBLICADO,
  PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
  PRIORIDADE_DO_OUVINTE_DO_NUCLEO,
  nomeDoPontoDeEstadoDoTipo,
  nomeDoPontoDeParaEstado,
  transitarEstado,
  type EfeitosDaTransicao,
  type TransicaoDeEstado,
} from './transicao-de-estado.js';

export {
  ATUALIZACAO_NA_PUBLICACAO,
  publicar,
  transitarParaPublicado,
  type DesfechoDaPublicacao,
  type PedidoDePublicacao,
  type ResultadoDaPublicacao,
} from './publicar.js';
