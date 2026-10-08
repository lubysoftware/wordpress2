/**
 * `versoes/` — guardar versoes anteriores do conteudo editado.
 *
 * Entrega de **T021** da feature `002-autoria-e-publicacao` (US-10). Os casos de
 * uso que a tabela de rastreabilidade de `spec.md` liga a US-10 sao
 * [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md) e
 * [UC-07](../../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md),
 * e deles esta pasta cumpre as duas linhas de versao: a excecao de UC-07 —
 * *"O conteudo e uma revisao → `do_not_allow` para apagar — revisao nao se apaga
 * por capacidade"* — e as ancoras de `spec.md`,
 * `wp-includes/capabilities.php:108` e `wp-includes/default-constants.php:392`.
 * O arquivo do legado e `wp-includes/revision.php` (1.139 linhas).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-versao.ts` | o contexto, as tres gravacoes de ligacao tardia, os **dez** pontos de extensao e os **cinco** ouvintes de fabrica |
 * | `configuracao-de-versoes.ts` | **CA-10.2**: `WP_POST_REVISIONS`, o `true` que vira `-1`, e as tres bordas |
 * | `campos-da-versao.ts` | os tres campos de fabrica, a ordem contra os nove protegidos, e a copia |
 * | `mudanca-de-versao.ts` | a normalizacao de espaco em branco que decide se vale gravar |
 * | `metadado-versionado.ts` | os tres ouvintes de fabrica do metadado versionado (6.4) |
 * | `leitura-de-versoes.ts` | *"listar versoes"*, e as tres perguntas sobre uma linha de versao |
 * | `guardar-versao.ts` | **CA-10.1** e a poda de **CA-10.2** |
 * | `restaurar-versao.ts` | **CA-10.4** |
 * | `permissao-de-versao.ts` | **CA-10.3**, e as duas metades que nao sao a mesma regra |
 * | `us-10-versoes-anteriores.test.ts` | os quatro criterios, por efeito no banco e por sequencia de pontos |
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`), somado ao **valor devolvido pelo ponto de extensao, byte a
 * byte**, e a **ordem de emissao** deles. A spec de paridade da feature e
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 * e desta pasta sao dois dos onze cenarios:
 *
 * - *"A revisao e um conteudo filho e a exclusao do pai recorre sobre ela"*, na
 *   metade que esta pasta cumpre — a versao como conteudo filho, com estado
 *   herdado e vinculo pelo pai. A **outra** metade, a exclusao recursiva, e a
 *   feature 005 (`PT-003`);
 * - *"A ordem dos pontos de filtro na gravacao e a mesma nas duas metades"*, que
 *   e o que a suite desta pasta afirma com a sequencia de pontos — e vale aqui
 *   duas vezes, porque **criar versao e gravar conteudo** e portanto dispara a
 *   cadeia de gravacao inteira para a linha da versao.
 *
 * E uma linha do cenario do slug, que esta pasta depende de nao mudar: *"a
 * dispensa de unicidade vale tambem para pendente, rascunho automatico,
 * **revisao** e solicitacao de dado pessoal"* — e por ela que todas as versoes de
 * um conteudo tem o **mesmo** `post_name`.
 *
 * **Nenhum deles e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que esta
 * pasta faz, e o que o README do modulo manda fazer, e citar **arquivo e linha**
 * do legado em cada afirmacao, em vez de descrever comportamento de memoria.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | `wp_insert_post()` e `wp_update_post()`, que **criar e restaurar versao chamam** | **T005**, US-2 — chegam por `GravacaoNaVersao` |
 * | `wp_delete_post()`, que **a poda chama** | **feature 005** (`PT-003`), a exclusao em sete etapas |
 * | o salvamento automatico, que passa por `_wp_put_post_revision( …, true )` | **T023**, US-11 — e reusa `gravarVersaoDoConteudo()` |
 * | a trava de edicao e o nonce da tela de restauracao | BC-07 e `plataforma/` — declarados na posicao do fluxo |
 * | o registro de tipos (`post_type_supports`) e o de metadados (`register_meta`) | `plataforma/` — chegam por ligacao tardia |
 * | `wp_get_latest_revision_id_and_total_count()` e a contagem por `FOUND_ROWS()` | feature 004 e 015, com `WP_Query` |
 * | a tela de comparacao de versoes | BC-07, feature 009 |
 * | o cache de objeto e o barramento de pontos de extensao | REQ-165 e REQ-162, fora do pacote |
 * | a trilha de quem restaurou, alem do `_edit_last` que o legado grava | **ninguem deste pacote**: REQ-028 esta em `do-not-rewrite.md` |
 */

export {
  CAMPOS_VERSIONAVEIS_DE_FABRICA,
  camposDaRestauracao,
  camposDaVersaoFiltrados,
  camposVersionaveis,
} from './campos-da-versao.js';

export {
  CONSTANTE_DE_QUANTAS_VERSOES_GUARDAR,
  QUANTAS_VERSOES_GUARDAR_DE_FABRICA,
  SUPORTE_DE_VERSAO,
  VERSIONAMENTO_DESLIGADO,
  VERSOES_ILIMITADAS,
  inteiroDoPhp,
  limiteDaConstante,
  nomeDoPontoDeLimitePorTipo,
  quantasVersoesGuardar,
  versionamentoLigado,
  type ConstantesDeVersao,
  type ValorDeQuantasVersoesGuardar,
} from './configuracao-de-versoes.js';

export {
  OUVINTES_DE_FABRICA_DA_VERSAO,
  PONTO_DEPOIS_DE_INSERIR_CONTEUDO,
  PONTO_DE_CONTEUDO_ATUALIZADO,
  REGISTRO_DE_FABRICA_DA_VERSAO,
  type ArmazenamentoNaVersao,
  type CampoVersionavel,
  type ContextoDeVersao,
  type GanchosDaVersao,
  type GravacaoNaVersao,
  type OuvinteDeFabricaDaVersao,
  type RegistroDeOuvintesDaVersao,
  type ResultadoDaInsercaoDeVersao,
} from './contexto-de-versao.js';

export {
  CODIGO_DE_CONTEUDO_INVALIDO,
  CODIGO_DE_VERSAO_DE_VERSAO,
  MENSAGEM_DE_CONTEUDO_INVALIDO,
  MENSAGEM_DE_VERSAO_DE_VERSAO,
  apagarVersao,
  gravarVersaoDoConteudo,
  guardarVersao,
  guardarVersaoNaInsercao,
  type DesfechoDeGuardarVersao,
  type ErroDeVersao,
  type ResultadoDaGravacaoDeVersao,
  type ResultadoDeGuardarVersao,
} from './guardar-versao.js';

export {
  listarVersoes,
  paiDaVersao,
  paiDoSalvamentoAutomatico,
  paiDoSalvamentoAutomaticoDaVersao,
  ultimaVersaoQueNaoEAutomatica,
  versaoPorId,
  type OpcoesDaListaDeVersoes,
} from './leitura-de-versoes.js';

export {
  chavesDeMetadadoVersionado,
  copiarMetadado,
  guardarMetadadosVersionados,
  metadadoVersionadoMudou,
  restaurarMetadadosVersionados,
} from './metadado-versionado.js';

export {
  aparar,
  conteudoMudou,
  formaComparavel,
  normalizarEspacoEmBranco,
  talvezSerializarValor,
} from './mudanca-de-versao.js';

export {
  CAPACIDADE_DE_APAGAR_CONTEUDO,
  CAPACIDADE_DE_EDITAR_CONTEUDO,
  CAPACIDADE_DE_LER_CONTEUDO,
  CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO,
  CODIGO_DE_RECUSA_DE_LEITURA_DE_VERSOES,
  CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_PELO_PAI,
  MENSAGEM_DE_RECUSA_DE_LEITURA_DE_VERSOES,
  MENSAGEM_DE_RECUSA_DE_RESTAURACAO,
  autorizarExclusaoDeVersao,
  autorizarLeituraDeVersoes,
  autorizarRestauracaoDeVersao,
  type CodigoDeRecusaDeVersao,
  type RecusaDeVersao,
} from './permissao-de-versao.js';

export {
  CHAVE_DE_ULTIMA_EDICAO,
  restaurarConteudoDaVersao,
  restaurarVersao,
  type DesfechoDaRestauracao,
  type PedidoDeRestauracao,
  type ResultadoDaRestauracao,
} from './restaurar-versao.js';

export {
  listarVersoesDoConteudo,
  type PedidoDeListaDeVersoes,
  type ResultadoDaListaDeVersoes,
} from './listar-versoes.js';
