/**
 * `administracao-de-contas/` — criar, promover, rebaixar, desvincular e apagar
 * contas, verificando a permissao sobre **cada conta alvo**.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11), e e UC-24
 * inteiro menos o que pertence a outras features (ver a lista no fim).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-administracao.ts` | o contexto, a porta do acervo da conta e os onze pontos de extensao |
 * | `mensagens-da-administracao.ts` | as 14 recusas, os 8 avisos de lote e os bilhetes de tela, literais |
 * | `erro-da-administracao.ts` | a familia de erro de `edit_user()` — **outra** que a do cadastro aberto |
 * | `papeis-editaveis.ts` | `get_editable_roles()`, `WP_Role::has_cap()` e o papel inventado `none` |
 * | `papel-da-conta.ts` | `set_role()` e `remove_all_caps()`, com o curto-circuito e o nivel derivado |
 * | `permissao-sobre-conta.ts` | **CA-11.1**: a pergunta da acao e a pergunta por conta, e a costura com a plataforma |
 * | `promover-contas.ts` | o lote de papel: **CA-11.2** (e a divergencia dela), **CA-11.4**, **CA-11.5**, **CA-11.6** |
 * | `apagar-contas.ts` | o lote de exclusao e a **cascata** (P5): **CA-11.3** |
 * | `remover-contas-do-site.ts` | o lote de desvinculo — o unico em que **CA-11.2** e literal |
 * | `conta-por-administrador.ts` | `edit_user()`: criar e alterar, com o portao de papel e **CA-11.7** |
 * | `notificacoes-da-administracao.ts` | as tres mensagens de **CA-11.7**, e a quarta que o legado **nao** manda |
 *
 * E do outro lado, em `plataforma/autorizacao/`: `conta-na-autorizacao.ts` (a
 * porta das tres leituras) e `traducao-de-conta.ts` (os cinco `case` de conta,
 * inclusive a **lista vazia** de editar o proprio perfil). A divisao e a que
 * `target_architecture.md` faz em BC-05 e que T015 e T017 ja seguiram: a
 * **decisao** fica embaixo, o **dado** e o **fluxo de tela** ficam aqui.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de proposito
 *
 * - **O nonce das cinco acoes.** Nao e deste pacote; ver
 *   `permissao-sobre-conta.ts`, e o precedente de `../sessao/saida.ts`.
 * - **`posts`, `links` e o registro de tipo de conteudo.** Ficam atras da porta
 *   {@link AcervoDaConta}; o comentario **orfao** fica fora dela, e a ausencia e
 *   a regra (`target_data_model.md`).
 * - **O bloco de campos de perfil** que `edit_user()` grava. Mesma lacuna e mesmo
 *   precedente de `../cadastro/criacao-de-conta.ts`; declarada em
 *   `conta-por-administrador.ts`.
 * - **A acao `resetpassword` do lote** (`wp-admin/users.php:243`), que dispara o
 *   fluxo de US-4 para cada conta escolhida. Ela nao esta em UC-24 — nem no fluxo
 *   principal, nem na sequencia, nem nas excecoes —, nenhum criterio de US-11 a
 *   nomeia, e o que ela faz por conta e `retrieve_password()`, que e T009. O que
 *   ela acrescentaria aqui e so o laco e os avisos `resetpassword` e
 *   `err_admin_reset`. Fica **nomeada e nao construida**, com o custo declarado: e
 *   um laco sobre a operacao que ja existe.
 * - **Adicionar ao site uma conta que ja existe na rede** (`user-new.php:32`, a
 *   acao `adduser`). UC-24 a tem como fluxo alternativo, e ela grava em `signups`
 *   e chama `wpmu_signup_user()` — que e `REQ-129` a `REQ-131`, em
 *   `do-not-rewrite.md`. A **autorizacao** dela esta portada
 *   (`plataforma/autorizacao/traducao-de-conta.ts`, o `case` de `add_users` e o de
 *   `create_users` com `N6`); o fluxo, nao.
 * - **`primary_blog` e `source_domain`**, que `remove_user_from_blog()` mexe. Ver
 *   a nota 🔴 de `remover-contas-do-site.ts`.
 */

export {
  OPCOES_DA_ADMINISTRACAO_DE_FABRICA,
  type AcervoDaConta,
  type ArmazenamentoDaAdministracaoDeContas,
  type ContextoDaAdministracaoDeContas,
  type GanchosDaAdministracaoDeContas,
  type ModoDeNotificacaoDeContaNova,
  type OpcoesDaAdministracaoDeContas,
} from './contexto-de-administracao.js';

export {
  AVISOS_DA_ADMINISTRACAO,
  AVISO_DE_OPCAO_DE_EXCLUSAO_AUSENTE,
  BILHETES_COMPLEMENTARES_DA_ADMINISTRACAO,
  BILHETES_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
  TITULO_DE_PERMISSAO_INSUFICIENTE,
  type AvisoDaAdministracao,
  type CodigoDeRecusa,
  type MotivoDeRecusaDaAdministracao,
  type RecusaDaAdministracao,
} from './mensagens-da-administracao.js';

export {
  MENSAGENS_DE_ERRO_DA_ADMINISTRACAO,
  codigosDeErroDaAdministracao,
  erroDaAdministracao,
  temAlgumErroDaAdministracao,
  type CodigoDeErroDaAdministracao,
  type ErroDaAdministracao,
  type ItemDeErroDaAdministracao,
} from './erro-da-administracao.js';

export {
  NOME_EXIBIDO_DE_NENHUM_PAPEL,
  PAPEL_DE_NENHUM_PAPEL,
  papeisEditaveis,
  papelConcede,
  papelEhFalsoNoLegado,
  type GanchosDosPapeisEditaveis,
} from './papeis-editaveis.js';

export {
  CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR,
  chavesDaAutorizacaoDaConta,
  contaEhMembroDoSite,
  definirPapel,
  papeisDaConta,
  removerTodasAsCapacidades,
  type ArmazenamentoDoPapelDaConta,
  type ChavesDaAutorizacaoDaConta,
  type GanchosDoPapelDaConta,
  type ResultadoDaDefinicaoDePapel,
  type ResultadoDaRemocaoDeCapacidades,
} from './papel-da-conta.js';

export {
  atorDaAdministracao,
  atorEhSuperAdmin,
  autorizacaoDoAtor,
  baseDeAutorizacaoDaAdministracao,
  podeNaAdministracao,
  podeSobreConta,
} from './permissao-sobre-conta.js';

export {
  promoverContas,
  type ContaComPapelDefinido,
  type ContaSaltadaNaPromocao,
  type DesfechoDaPromocao,
  type MotivoDeSaltoNaPromocao,
  type PedidoDePromocaoDeContas,
  type ResultadoDaPromocaoDeContas,
} from './promover-contas.js';

export {
  apagarConta,
  apagarContas,
  contaTemConteudo,
  type ContaApagada,
  type ContaSaltadaNaExclusao,
  type DesfechoDaExclusao,
  type EscolhaDeExclusao,
  type MotivoDeSaltoNaExclusao,
  type OpcaoDeExclusaoDeConta,
  type PedidoDeExclusaoDeContas,
  type ResultadoDaExclusaoDeContas,
} from './apagar-contas.js';

export {
  MENSAGEM_DE_CONTA_INEXISTENTE,
  removerContaDoSite,
  removerContasDoSite,
  type ContaRemovidaDoSite,
  type DesfechoDaRemocao,
  type PedidoDeRemocaoDeContas,
  type ResultadoDaRemocaoDeContas,
} from './remover-contas-do-site.js';

export {
  alterarContaPorAdministrador,
  criarContaPorAdministrador,
  type AlteracoesDaConta,
  type DadosDaContaNovaPorAdministrador,
  type ResultadoDaAlteracaoDeConta,
  type ResultadoDaCriacaoPorAdministrador,
} from './conta-por-administrador.js';

export {
  CORPO_DE_EMAIL_ALTERADO,
  CORPO_DE_SENHA_ALTERADA,
  FIM_DE_LINHA_DA_CONTA_NOVA,
  FIM_DE_LINHA_DO_AVISO_DE_ALTERACAO,
  MENSAGENS_DA_ADMINISTRACAO_POR_EMAIL,
  mensagemDeContaNovaAoAdministrador,
  mensagemDeEmailAlterado,
  mensagemDeSenhaAlterada,
  type DadosDoAvisoDeAlteracao,
  type DadosDoAvisoDeContaNova,
  type GanchosDasMensagensDaAdministracao,
} from './notificacoes-da-administracao.js';
