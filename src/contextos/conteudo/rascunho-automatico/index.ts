/**
 * `rascunho-automatico/` — reservar o registro ao abrir o editor, antes de
 * qualquer digitacao.
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao` (US-11), e e
 * `get_default_post_to_edit( $tipo, true )`
 * (`wp-admin/includes/post.php:758`) mais as tres regras que mantem o estado
 * `auto-draft` do jeito que ele e: invisivel, impedido na API de escrita e alvo
 * do salvamento automatico. O caso de uso e o unico que a tabela de
 * rastreabilidade de `spec.md` liga a US-11 —
 * [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md), cuja
 * primeira pre-condicao e literal: *"o registro existe, ainda que como
 * `auto-draft` criado pelo ato de abrir o editor"*.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-rascunho-automatico.ts` | o contexto, o gancho e a recorrencia da coleta, a fila, os quatro pontos de extensao e o ramo da funcao que **nao** grava |
 * | `permissao-do-editor.ts` | **CA-11.1**: as **duas** capacidades do tipo, e as tres superficies que recusam diferente |
 * | `visibilidade-do-rascunho-automatico.ts` | **CA-11.2**: as tres barreiras da invisibilidade, as seis exclusoes literais e as 🔴 duas excecoes |
 * | `estado-pedido-pela-api.ts` | **CA-11.3**: a enumeracao derivada do registro, o atalho de atualizacao e a 🔴 superficie que aceita |
 * | `salvamento-automatico.ts` | **CA-11.4**: `AUTOSAVE_INTERVAL`, a borda do intervalo e para onde a escrita vai |
 * | `abrir-editor.ts` | a operacao, os nove passos com o dono de cada um, e os erros como valor |
 * | `us-11-rascunho-automatico.test.ts` | os quatro criterios, afirmados por efeito no banco e por sequencia de pontos |
 *
 * ---
 *
 * # As duas regras de negocio de US-11, e onde cada uma esta
 *
 * `spec.md` lista duas em *"Regras de negocio que valem aqui"*:
 *
 * | regra | onde ela esta |
 * |---|---|
 * | *"Auto-draft e rascunho criado pelo ato de abrir o editor, antes de qualquer digitacao"* | `abrir-editor.ts` — e o *"antes de qualquer digitacao"* e a separacao entre `gravado` e `paraOFormulario` |
 * | *"`AUTOSAVE_INTERVAL` define de quanto em quanto tempo o editor salva sozinho"* | `salvamento-automatico.ts`, num ponto de configuracao nomeado com teste de borda (P6) |
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * A tabela de passos do cabecalho de `abrir-editor.ts` tem a lista completa, com
 * a linha do legado de cada um. Em resumo, por dono:
 *
 * | o que | de quem |
 * |---|---|
 * | os seis testes de `backlog/tests.md` (UT-031-1 a UT-031-6) | **T024**, a tarefa `[P]` que roda em paralelo com esta |
 * | as quatro envolturas que chamam a operacao: a tela de conteudo novo, o rascunho rapido do painel e os dois metodos de XML-RPC | BC-09 (`ESC-SUPERFICIES`) — as quatro estao nomeadas, com o que cada uma acrescenta, em `contexto-de-rascunho-automatico.ts` |
 * | o formato de conteudo aplicado ao registro novo | BC-02 (`set_post_format()`), BC-07 (suporte do tema) e `plataforma/tipos-de-conteudo/` (suporte do tipo) |
 * | as seis consultas que excluem `auto-draft` por nome | BC-09 (duas telas), REQ-120 (tres de exportacao, em `do-not-rewrite.md`) e BC-07 (reescrita de endereco) |
 * | o portao de `post_status` da consulta publica | T009 da feature 004 (`contextos/leitura-publica/`) |
 * | a expiracao em 7 dias, e a execucao da coleta | feature 005, T013 (`R4` / BR-MIGRAR-033) — esta tarefa **agenda** o evento, e nao o executa |
 * | a versao de salvamento automatico por conta | **T021** (US-10): `salvamento-automatico.ts` nomeia o destino e nao o constroi |
 * | a leitura da trava de edicao | BC-09 (`wp_check_post_lock()`), com a janela de 150 s que e numero de outra tarefa |
 * | o laco do salvamento automatico no cliente (cronometro, batimento, comparacao de texto) | `ESC-CLIENTE` (BR-MIGRAR-117) — adotado como esta, nao reescrito |
 * | emitir `wp_after_insert_post` e os tres filtros do formulario | ninguem deste pacote emite ponto: REQ-162 esta em `do-not-rewrite.md`. Declarados em `contexto-de-rascunho-automatico.ts`, com nome, argumentos e posicao |
 * | o escape de `esc_html()` nas tres entradas de requisicao | `plataforma/formatacao/`, feature 015 — os valores chegam ja escapados |
 * | o cache de objeto | REQ-165, fora do pacote |
 *
 * ---
 *
 * # 🔴 As tres coisas que esta tarefa declarou e NAO decidiu
 *
 * Nenhuma delas foi resolvida aqui, e as tres estao no codigo com ancora, porque
 * o **P1** exige decisao humana registrada para divergir e nenhuma existe:
 *
 * 1. **CA-11.2 diz *"listagem alguma"*, e o legado tem duas excecoes** — o
 *    personalizador torna o estado consultavel em execucao, e a **consulta**
 *    REST o aceita de quem pode editar. Em
 *    `visibilidade-do-rascunho-automatico.ts`.
 * 2. **CA-11.3 diz que o estado *"nao pode ser pedido"*, e o XML-RPC `wp_newPost`
 *    o aceita** — porque a guarda dele pergunta se o estado **existe no
 *    registro**, e `auto-draft` existe. Em `estado-pedido-pela-api.ts`.
 * 3. **Esta operacao nao esta na tabela *Contratos* de `plan.md`**, e a entrega
 *    de T023 a exige de qualquer forma. Em `abrir-editor.ts`.
 *
 * E uma quarta, que **nao e desta tarefa e passa por ela**: o conflito entre
 * BR-MIGRAR-034 (*"a coleta so e agendada por visita ao painel"*) e CA-6.4 da
 * feature 005 (*"o agendamento nao depende de alguem ter aberto a tela de
 * edicao"*). T023 reproduz o ponto de agendamento que o legado tem aqui, o que
 * **nao** fecha nenhum dos dois lados — a razao esta em `FilaNoEditor`.
 */

export {
  ESTADO_DO_EDITOR_SEM_REGISTRO,
  GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
  ID_DO_EDITOR_SEM_REGISTRO,
  RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO,
  type ContextoDoEditor,
  type EventoRecorrenteNoEditor,
  type FilaNoEditor,
  type GanchosDoEditor,
  type PedidoDeAberturaDoEditor,
} from './contexto-de-rascunho-automatico.js';

export {
  CAPACIDADE_DE_CRIAR,
  CAPACIDADE_DE_EDITAR,
  CODIGO_HTTP_DE_RECUSA_DO_EDITOR,
  MENSAGEM_DE_RECUSA_DO_EDITOR,
  MENSAGEM_DE_RECUSA_DO_EDITOR_POR_XML_RPC,
  TITULO_DE_RECUSA_DO_EDITOR,
  autorizarAberturaDoEditor,
  capacidadesDeAbrirOEditor,
  type RecusaDoEditor,
} from './permissao-do-editor.js';

export {
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  EXCECOES_DECLARADAS_A_INVISIBILIDADE,
  EXCLUSOES_LITERAIS_DE_LISTAGEM,
  estadoApareceEmConsultaPublica,
  estadoApareceEmListagemDoPainel,
} from './visibilidade-do-rascunho-automatico.js';

export {
  CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO,
  CODIGO_DE_PARAMETRO_INVALIDO,
  CODIGO_HTTP_DE_PARAMETRO_INVALIDO,
  ESTADOS_REGISTRADOS_DE_FABRICA,
  MENSAGEM_DE_ESTADO_FORA_DA_ENUMERACAO,
  MENSAGEM_DE_ESTADO_FORA_DE_UM_UNICO_VALOR,
  MENSAGEM_DE_PARAMETRO_INVALIDO,
  PARAMETRO_DE_ESTADO,
  SUPERFICIES_DO_ESTADO_PEDIDO,
  estadoPodeSerPedidoPelaApi,
  estadosPedveisPelaApi,
  mensagemDeEstadoForaDaEnumeracao,
  recusaDeEstadoPedidoPelaApi,
  reescreverEstadoPedidoNoPainel,
  type EstadoRegistrado,
  type RecusaDeEstadoPedido,
} from './estado-pedido-pela-api.js';

export {
  ESTADOS_SOBRESCRITOS_PELO_SALVAMENTO_AUTOMATICO,
  INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA,
  MINUTO_EM_SEGUNDOS,
  PROXIMO_SALVAMENTO_QUANDO_O_INTERVALO_NAO_E_NUMERO,
  SUPERFICIES_DO_SALVAMENTO_AUTOMATICO,
  destinoDoSalvamentoAutomatico,
  intervaloDeSalvamentoAutomatico,
  intervaloPublicadoAoCliente,
  podeSalvarAutomaticamente,
  proximoSalvamentoAutomatico,
  type ConstantesDoSalvamentoAutomatico,
  type DestinoDoSalvamentoAutomatico,
  type PedidoDeSalvamentoAutomatico,
} from './salvamento-automatico.js';

export {
  ESTADO_COM_QUE_O_EDITOR_RESERVA,
  RECURSO_DE_TITULO,
  TITULO_DO_RASCUNHO_AUTOMATICO,
  abrirEditor,
  type ConteudoParaOFormulario,
  type DesfechoDaAberturaDoEditor,
  type ResultadoDaAberturaDoEditor,
} from './abrir-editor.js';
