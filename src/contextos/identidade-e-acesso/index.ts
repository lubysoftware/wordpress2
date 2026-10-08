/**
 * Modulo de identidade e acesso — BC-05 de `target_architecture.md`.
 *
 * Esqueleto da feature `001-identidade-e-acesso`, tarefa T001. O que existe
 * aqui e o que T001 entrega: o modulo carrega com as tres portas declaradas, e
 * **nenhuma regra de negocio implementada**. Conta, sessao, senha de aplicacao,
 * a matriz de papeis e a decisao de capacidade entram nas tarefas delas (T002 em
 * diante), e a leitura obrigatoria de cada uma esta em
 * `./README.md`.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e
 *   `target_architecture.md` repete que nenhum modulo pode guarda-los em estado
 *   de modulo. Por isso as portas chegam por argumento e nao existe instancia
 *   compartilhada neste arquivo: duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao envia e-mail ao ser criado. A ordem de arranque e contrato
 *   publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito na importacao e
 *   trabalho fora da ordem.
 */

import {
  criarArmazenamento,
  type Armazenamento,
  type OpcoesDeArmazenamento,
} from './armazenamento/index.js';
import type {
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
} from './portas/index.js';

import {
  autenticar,
  type CredenciaisDeEntrada,
  type OpcoesDeAutenticacao,
  type ResultadoDeAutenticacao,
} from './autenticacao/autenticar.js';
import type { ContextoDeAutenticacao } from './autenticacao/contexto-de-autenticacao.js';
import {
  sair,
  type ContextoDeSaida,
  type ResultadoDeSaida,
} from './sessao/saida.js';
import {
  sessaoDaRequisicao,
  type CredencialApresentada,
  type SessaoDaRequisicao,
} from './sessao/sessao-da-requisicao.js';
import {
  solicitarRedefinicaoDeSenha,
  type PedidoDeRedefinicao,
  type ResultadoDoPedidoDeRedefinicao,
} from './redefinicao-de-senha/pedido-de-redefinicao.js';
import {
  redefinirSenha,
  type EntradaDaRedefinicao,
  type ResultadoDaRedefinicao,
} from './redefinicao-de-senha/redefinir-senha.js';
import type {
  ContextoDaRedefinicaoDeSenha,
  ContextoDoPedidoDeRedefinicao,
} from './redefinicao-de-senha/contexto-de-redefinicao.js';
import type { ArmazenamentoDeSessoes } from './sessao/registro-de-sessoes.js';
import {
  cadastrar,
  type DadosDoCadastro,
  type ResultadoDoCadastro,
} from './cadastro/cadastrar.js';
import type { ContextoDeCadastro } from './cadastro/contexto-de-cadastro.js';
import {
  emitirCredencialDeAplicacao,
  type PedidoDeEmissao,
  type ResultadoDaEmissao,
} from './senha-de-aplicacao/emitir-credencial.js';
import {
  revogarCredencialDeAplicacao,
  type PedidoDeRevogacao,
  type ResultadoDaRevogacao,
} from './senha-de-aplicacao/revogar-credencial.js';
import type { ContextoDeSenhaDeAplicacao } from './senha-de-aplicacao/contexto-de-senha-de-aplicacao.js';
import type { ContextoDaAdministracaoDeContas } from './administracao-de-contas/contexto-de-administracao.js';
import {
  promoverContas,
  type PedidoDePromocaoDeContas,
  type ResultadoDaPromocaoDeContas,
} from './administracao-de-contas/promover-contas.js';
import {
  apagarContas,
  type PedidoDeExclusaoDeContas,
  type ResultadoDaExclusaoDeContas,
} from './administracao-de-contas/apagar-contas.js';
import {
  removerContasDoSite,
  type PedidoDeRemocaoDeContas,
  type ResultadoDaRemocaoDeContas,
} from './administracao-de-contas/remover-contas-do-site.js';
import {
  alterarContaPorAdministrador,
  criarContaPorAdministrador,
  type AlteracoesDaConta,
  type DadosDaContaNovaPorAdministrador,
  type ResultadoDaAlteracaoDeConta,
  type ResultadoDaCriacaoPorAdministrador,
} from './administracao-de-contas/conta-por-administrador.js';

export * from './portas/index.js';
export * from './armazenamento/index.js';

/*
  ── DUAS `Conta`, E A ESCOLHA NÃO É DE QUEM FEZ O MERGE ─────────────────────

  T002 escreveu `armazenamento/conta.ts` e T003 escreveu
  `conta/leitura-de-conta.ts`, as duas modelando a MESMA entidade — a linha de
  `wp_users` — com campos parecidos e não iguais. Não é conflito de merge: é
  trabalho duplicado, porque a worktree da T003 nasceu da main antes de a T002
  existir. Qual das duas representações fica, e o que acontece com os
  consumidores da outra, é decisão de produto, e ela está registrada para uma
  pessoa tomar.

  Até ela ser tomada, o barril reexporta a `Conta` do ARMAZENAMENTO, que é a
  que a porta de dados usa, e a da leitura entra pelo caminho dela
  (`./conta/leitura-de-conta.js`) para nada sumir. Ambiguidade de barril não é
  o defeito; o defeito é haver duas.
*/
export * from './conta/leitura-de-conta.js';
/* Export EXPLÍCITO ganha do `export *`, e é ele que desfaz a ambiguidade sem
   esconder nenhum dos dois: `Conta` é a do armazenamento, que é a que a porta
   de dados usa, e a da leitura sai com o nome dela ao lado. */
export type { Conta } from './armazenamento/conta.js';
export type { Conta as ContaDaLeitura } from './conta/leitura-de-conta.js';
export * from './sessao/registro-de-sessoes.js';
/*
  T015 (US-7) sai SO pelo barril, e nao como operacao do modulo composto, e a
  razao e a divisao que `target_architecture.md` faz nesta area: a **decisao** de
  capacidade mora em `plataforma/autorizacao/` e o que pertence a BC-05 e o
  **dado** do papel. O que este contexto acrescenta e a costura entre os dois —
  um adaptador de leitura, nao um passo de fluxo. Por-lo na interface do modulo o
  faria parecer operacao exposta, e a operacao "perguntar permissao" da tabela
  Contratos do `plan.md` nao e deste modulo: e da plataforma, que fica abaixo de
  todo contexto porque e chamada 1.279 vezes em 224 arquivos.
*/
export * from './autorizacao/fonte-de-papeis.js';
/*
  As duas operacoes de BR-MIGRAR-111 saem SO por aqui, e nao como operacao do
  modulo composto: no legado elas sao funcoes globais alcancaveis por qualquer
  extensao e **sem nenhum chamador** no produto. Exportar e preservar a
  superficie (P8); por-las na composicao as faria parecer passo de fluxo.
*/
export * from './sessao/encerramento-de-sessao.js';
export * from './sessao/saida.js';
export * from './sessao/expiracao-de-sessao.js';
export * from './sessao/sessao-da-requisicao.js';
export * from './autenticacao/autenticar.js';
export * from './autenticacao/cadeia-de-autenticacao.js';
export * from './autenticacao/contexto-de-autenticacao.js';
export * from './autenticacao/erro-de-autenticacao.js';
export * from './autenticacao/normalizacao-de-credencial.js';
export * from './autenticacao/prazos-de-sessao.js';
export * from './autenticacao/verificacao-de-senha.js';
export * from './redefinicao-de-senha/chave-de-redefinicao.js';
export * from './redefinicao-de-senha/contas-para-redefinicao.js';
export * from './redefinicao-de-senha/contexto-de-redefinicao.js';
export * from './redefinicao-de-senha/erro-de-redefinicao.js';
export * from './redefinicao-de-senha/geracao-de-hash-de-senha.js';
export * from './redefinicao-de-senha/pedido-de-redefinicao.js';
export * from './redefinicao-de-senha/redefinir-senha.js';
/*
  US-5 / T011 sai SO pelo barril, e nao como operacao do modulo composto: a
  tabela *Contratos* de `plan.md` nomeia a operacao *"pedir redefinicao de
  senha"*, que e de T009 (US-4) e nao existe nesta arvore. O que T011 entrega e
  o passo 3 de UC-20 — o envio e o relato da falha dele —, e por-lo na
  composicao o faria parecer a operacao inteira. Quem pegar T009 o compoe.

  🔴 Ele carrega um conflito nao resolvido entre a spec e a analise do legado:
  ver a PARADA no cabecalho de
  `recuperacao-de-senha/envio-do-email-de-redefinicao.ts` antes de compor.
*/
export * from './recuperacao-de-senha/envio-do-email-de-redefinicao.js';
export * from './autenticacao/geracao-de-hash-de-senha.js';
export * from './cadastro/atribuicao-de-papel.js';
export * from './cadastro/cadastrar.js';
export * from './cadastro/chave-de-redefinicao.js';
export * from './cadastro/configuracao-de-cadastro.js';
export * from './cadastro/contexto-de-cadastro.js';
export * from './cadastro/criacao-de-conta.js';
export * from './cadastro/erro-de-cadastro.js';
export * from './cadastro/geracao-de-segredo.js';
export * from './cadastro/notificacao-de-conta-nova.js';
export * from './cadastro/validacao-de-cadastro.js';
/*
  T021 (US-10) sai pelo barril E pela composicao, e as duas coisas tem motivo. As
  DUAS OPERACOES entram em `ModuloDeIdentidadeEAcesso` porque a tabela *Contratos*
  de `plan.md` as lista como operacao desta feature, com entrada, saida e erro
  proprios — e porque esta e a primeira operacao do modulo que EXIGE capacidade,
  logo a declaracao de permissao que o P4 cobra tem de aparecer na interface, ao
  lado das quatro que declaram "nenhuma".

  O CASO DE TRADUCAO das seis capacidades sai so pelo barril, como `fonte-de-papeis`:
  ele e costura de autorizacao, nao passo de fluxo, e quem o consome e quem monta o
  contexto de autorizacao da requisicao.
*/
export * from './senha-de-aplicacao/autorizacao-de-senha-de-aplicacao.js';
export * from './senha-de-aplicacao/contexto-de-senha-de-aplicacao.js';
export * from './senha-de-aplicacao/emitir-credencial.js';
export * from './senha-de-aplicacao/erro-de-senha-de-aplicacao.js';
export * from './senha-de-aplicacao/geracao-de-credencial.js';
export * from './senha-de-aplicacao/revogar-credencial.js';
/*
  T023 (US-11) sai pelo barril E pela composicao, e a diferenca com T015 e o
  motivo: ali o que BC-05 acrescentava era **leitura de dado** para uma decisao
  que mora na plataforma; aqui sao **cinco operacoes de fluxo**, com escrita, com
  cascata e com envio de e-mail — exatamente a forma das outras seis operacoes
  desta interface. A decisao de capacidade continua fora: o que entrou em
  `plataforma/autorizacao/` foi so a traducao dos `case` de conta, que e decisao e
  por isso ficou la.
*/
export * from './administracao-de-contas/index.js';

/*
  ── DOIS NOMES QUE COLIDEM NO BARRIL, E NENHUM DOS DOIS SOME ────────────────

  `destinoDeRetorno` e `primeiroCodigoDeErro` existem nas DUAS familias, com o
  mesmo nome e proposito paralelo: uma na entrada (US-1) e uma no cadastro
  (US-6). A colisao e simetria, nao descuido — manter o mesmo nome nos dois
  arquivos e o que faz a leitura de um ensinar a leitura do outro, e renomear
  dentro de um deles esconderia o paralelo.

  O barril desfaz a ambiguidade do mesmo jeito que ja desfez a das duas `Conta`,
  logo acima: export EXPLICITO ganha do `export *`, o nome nu fica com a familia
  mais antiga e a outra sai com o nome dela ao lado. Nada deixa de ser
  alcancavel, e cada funcao continua alcancavel tambem pelo caminho dela
  (`./cadastro/cadastrar.js`, `./cadastro/erro-de-cadastro.js`).
*/
export { destinoDeRetorno } from './autenticacao/autenticar.js';
export { destinoDeRetorno as destinoDeRetornoDoCadastro } from './cadastro/cadastrar.js';
export { primeiroCodigoDeErro } from './autenticacao/erro-de-autenticacao.js';
export { primeiroCodigoDeErro as primeiroCodigoDeErroDeCadastro } from './cadastro/erro-de-cadastro.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeIdentidadeEAcesso {
  readonly dados: PortaDeDados;
  readonly email: PortaDeEmail;
  readonly relogio: PortaDeRelogio;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha duas coisas: as portas, de T001, e o armazenamento, de T002.
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | `autenticar` | US-1 | T003 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `sair` | US-2 | T005 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `sessaoDaRequisicao` | US-3 | T007 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `solicitarRedefinicaoDeSenha` | US-4 | T009 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `redefinirSenha` | US-4 | T009 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `cadastrar` | US-6 | T013 | **nenhuma capacidade**, declarada (ver abaixo) |
 * | `emitirCredencialDeAplicacao` | US-10 | T021 | **`edit_user` daquela conta** (CA-10.4) |
 * | `revogarCredencialDeAplicacao` | US-10 | T021 | **`edit_user` daquela conta** (CA-10.4) |
 * | `promoverContas` | US-11 | T023 | `promote_users`, e `promote_user` por conta alvo |
 * | `apagarContas` | US-11 | T023 | `delete_users`, e `delete_user` por conta alvo |
 * | `removerContasDoSite` | US-11 | T023 | `remove_users`, e `remove_user` por conta alvo |
 * | `criarContaPorAdministrador` | US-11 | T023 | `create_users`, mais `promote_users` so para o papel |
 * | `alterarContaPorAdministrador` | US-11 | T023 | `edit_user` sobre aquela conta |
 *
 * As cinco de T023 sao as **primeiras** operacoes desta interface que exigem
 * capacidade, e as cinco exigem **duas** — a da acao e a da conta alvo, uma a uma
 * (CA-11.1). As seis anteriores declaram *"nenhuma capacidade"* porque o legado
 * nao exige nenhuma nelas; estas declaram as duas porque ele exige as duas.
 */
export interface ModuloDeIdentidadeEAcesso {
  readonly nome: 'identidade-e-acesso';
  readonly portas: PortasDeIdentidadeEAcesso;
  /**
   * A forma de armazenamento de conta, perfil, sessao e definicao de papel
   * (T002). Le e grava **somente** pela porta de dados.
   */
  readonly armazenamento: Armazenamento;

  /**
   * Autentica a conta por login **ou** e-mail e senha (US-1, T003).
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto.** O P4 manda
   * declarar permissao explicita em toda operacao exposta e preservar o default
   * de cada camada *"inclusive quando o default e permissivo"*. Aqui o default e
   * aberto por regra lida do legado: UC-19 fixa que *"nenhuma capacidade e
   * exigida para entrar: o papel decide o que a pessoa faz depois, nao se ela
   * entra"*, e o cenario de paridade da tela de login cobra que *"nenhuma das
   * duas exige capacidade que o legado nao exige"*. Acrescentar verificacao aqui
   * fecharia o sistema mais que o legado, que e o erro que esta feature existe
   * para nao cometer.
   *
   * O contexto chega por argumento, e nao pela composicao, porque identidade e
   * estado de rede sao escopo de REQUISICAO (AD-02, BR-MIGRAR-105).
   */
  autenticar(
    credenciais: CredenciaisDeEntrada,
    contexto: ContextoDeAutenticacao,
    opcoes?: OpcoesDeAutenticacao,
  ): ResultadoDeAutenticacao;

  /**
   * Encerra a sessao corrente sem afetar as outras sessoes da conta (US-2, T005).
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto.** Sair nao pergunta
   * capacidade no legado: quem sai e a propria conta. O que guarda a **rota** de
   * saida e um atestado, nao uma capacidade — a conferencia de nonce, de que
   * `SCR-004` (*"You are attempting to log out of %s"*) e a tela de falha. O
   * nonce nao e deste pacote: nenhuma tarefa de `tasks.md` o entrega, e
   * acrescenta-lo aqui fecharia superficie sem ninguem ter decidido (P4).
   *
   * O contexto chega por argumento pelo mesmo motivo de `autenticar`:
   * identidade e token corrente sao escopo de REQUISICAO (AD-02,
   * BR-MIGRAR-105).
   *
   * As duas operacoes de encerramento que BR-MIGRAR-111 manda portar
   * **definidas e sem chamador** NAO estao nesta interface, e e de proposito:
   * elas saem pelo barril, como as funcoes globais que sao no legado, e nenhum
   * fluxo deste pacote as invoca.
   */
  sair(contexto: ContextoDeSaida): ResultadoDeSaida;

  /**
   * Resolve a sessao desta requisicao pelo prazo, ou a trata como anonima
   * (US-3, T007 — CA-3.3 e CA-3.4).
   *
   * **Permissao exigida: nenhuma, e a declaracao e o ponto.** Esta operacao
   * **produz** a identidade que as decisoes de capacidade vao usar; exigir
   * capacidade dela seria circular, e no legado a validacao da credencial nao
   * consulta capacidade nenhuma. O P4 manda declarar a permissao de toda
   * operacao exposta *"inclusive quando o default e permissivo"*, e aqui o
   * default aberto e regra lida do legado, nao omissao.
   *
   * O armazenamento e o relogio chegam por argumento, e nao pela composicao,
   * pelo mesmo motivo de `autenticar`: identidade e escopo de REQUISICAO
   * (AD-02, BR-MIGRAR-105), e o cenario de concorrencia de
   * `parity_tests/06-autenticacao-e-sessao.feature` tem tolerancia zero.
   */
  sessaoDaRequisicao(
    armazenamento: ArmazenamentoDeSessoes,
    credencial: CredencialApresentada,
    agoraEmSegundos: number,
    carencia?: number,
  ): SessaoDaRequisicao;

  /**
   * Pede a redefinicao de senha por chave enviada ao e-mail da conta (US-4,
   * T009 — passos 1 a 3 de UC-20).
   *
   * **Permissao exigida: nenhuma, e aqui a declaracao vale dobrado.** A chave de
   * redefinicao e **um dos cinco atestados** que o P4 da constituicao manda nao
   * esconder: *"cinco atestados decidem acesso sem consultar capacidade alguma
   * ... chave de redefinicao de senha de 24 horas apagada no primeiro acesso ...
   * uma matriz que ignore esses cinco descreve um sistema mais fechado do que o
   * real"*. UC-20 diz o mesmo pelo campo *Autorizacao*: *"a posse do e-mail e a
   * autorizacao — nao ha capacidade envolvida"*. Exigir capacidade aqui trancaria
   * justamente quem nao consegue entrar.
   *
   * O contexto chega por argumento, como em `autenticar`: identidade e estado de
   * requisicao sao escopo de REQUISICAO (AD-02, BR-MIGRAR-105).
   */
  solicitarRedefinicaoDeSenha(
    pedido: PedidoDeRedefinicao,
    contexto: ContextoDoPedidoDeRedefinicao,
  ): ResultadoDoPedidoDeRedefinicao;

  /**
   * Grava a senha nova contra a chave apresentada (US-4, T009 — passos 4 a 7 de
   * UC-20).
   *
   * **Permissao exigida: nenhuma, pelo mesmo motivo acima** — e com um segundo
   * motivo proprio: quem redefine a senha nao esta autenticado, logo nao ha
   * identidade sobre a qual perguntar capacidade. O prazo de 24 horas e a
   * conferencia da chave **sao** o controle de acesso desta operacao.
   */
  redefinirSenha(
    entrada: EntradaDaRedefinicao,
    contexto: ContextoDaRedefinicaoDeSenha,
  ): ResultadoDaRedefinicao;

   /**
   * Cadastra o visitante quando o cadastro aberto esta ligado (US-6, T013).
   *
   * **Permissao exigida: nenhuma capacidade, e a declaracao e o ponto.** UC-21 poe
   * na propria linha de autorizacao do caso de uso que quem autoriza e a **opcao**
   * `users_can_register` — *"que nasce desligada; sem ela, este caso de uso nao
   * existe na instalacao"* — e `target_screens.md` repete para a tela: *"nenhuma
   * checagem `current_user_can()` neste arquivo"*. O ator e o **visitante**, que por
   * definicao nao tem papel: exigir capacidade aqui tornaria o cadastro aberto
   * impossivel.
   *
   * E a unica operacao deste modulo cuja porta **nasce fechada**, e isso tambem e
   * declaracao: o P4 manda preservar o default de cada camada, e aqui o default e
   * `false` por `U1` (BR-MIGRAR-021). Nas outras tres o default e aberto, e a
   * declaracao serve para que ninguem o feche sem decidir.
   *
   * O contexto chega por argumento, e nao pela composicao, pelo mesmo motivo de
   * `autenticar`: identidade, opcao da instalacao e estado de rede sao escopo de
   * REQUISICAO (AD-02, BR-MIGRAR-105).
   */
  cadastrar(
    dados: DadosDoCadastro,
    contexto: ContextoDeCadastro,
  ): ResultadoDoCadastro;

  /**
   * Emite uma credencial de aplicacao, exibindo o segredo uma unica vez (US-10,
   * T021 — passos 1 a 4 de UC-22).
   *
   * **Permissao exigida: `edit_user` da conta alvo, e e a primeira operacao deste
   * modulo que exige capacidade.** A linha *Autorizacao* de UC-22 e literal —
   * *"`edit_user` daquele usuario. As seis capacidades de senha de aplicacao
   * resolvem todas para isso: quem pode editar a conta administra as credenciais
   * dela"* — e CA-10.4 cobra exatamente isso. A capacidade **pedida** e
   * `create_app_password`: a traducao dela esta em
   * `senha-de-aplicacao/autorizacao-de-senha-de-aplicacao.js`, e quem compoe tem
   * de registra-la nos casos de traducao do contexto de autorizacao.
   *
   * A segunda pre-condicao de UC-22 — *"a conexao e segura, ou a instalacao
   * dispensou o requisito"* — **nao** e cobrada aqui: no legado quem a cobra e a
   * camada de rota, e o slot `framework-http` esta em aberto. A consequencia esta
   * declarada no cabecalho de
   * `senha-de-aplicacao/contexto-de-senha-de-aplicacao.ts`.
   *
   * O contexto chega por argumento, e nao pela composicao, pelo mesmo motivo de
   * `autenticar` — e aqui com uma razao a mais: ele carrega a autorizacao da
   * requisicao, que e o estado que `EXT-CONTEXTO` (BR-MIGRAR-105) mais proibe
   * guardar.
   */
  emitirCredencialDeAplicacao(
    pedido: PedidoDeEmissao,
    contexto: ContextoDeSenhaDeAplicacao,
  ): ResultadoDaEmissao;

  /**
   * Revoga uma credencial de aplicacao (US-10, T021 — fluxo *Revogar uma senha* de
   * UC-22).
   *
   * **Permissao exigida: a mesma, `edit_user` da conta alvo.** UC-22 e explicito —
   * *"a capacidade exigida continua sendo `edit_user` daquele usuario"* —, e a
   * capacidade pedida e `delete_app_password`.
   *
   * 🔴 A metade de CA-10.3 que fala em *"deixar de autenticar"* nao e verificavel
   * neste pacote: quem autentica com a credencial e `REQ-012`, que nao entrou (ver
   * o cabecalho de `senha-de-aplicacao/revogar-credencial.ts` e o risco 2 de
   * `plan.md`).
   */
  revogarCredencialDeAplicacao(
    pedido: PedidoDeRevogacao,
    contexto: ContextoDeSenhaDeAplicacao,
  ): ResultadoDaRevogacao;
  /**
   * Promove, rebaixa ou tira o papel das contas escolhidas (US-11, T023).
   *
   * **Permissao exigida: `promote_users` para a acao e `promote_user` para cada
   * conta alvo**, nessa ordem (CA-11.1, e os passos 3 e 4 de UC-24). E a primeira
   * operacao desta interface cuja declaracao de permissao nao e *"nenhuma"*.
   *
   * O contexto chega por argumento pelo mesmo motivo de `autenticar` — AD-02 e
   * BR-MIGRAR-105 —, e aqui com um peso extra: a permissao e perguntada **uma
   * vez por conta alvo**, e um ator guardado em estado de modulo trocaria de
   * identidade no meio do lote.
   *
   * ⚠️ O nonce `bulk-users` do passo 3 de UC-24 **nao** e deste pacote; ver
   * `administracao-de-contas/permissao-sobre-conta.ts`.
   */
  promoverContas(
    pedido: PedidoDePromocaoDeContas,
    contexto: ContextoDaAdministracaoDeContas,
  ): ResultadoDaPromocaoDeContas;

  /**
   * Apaga as contas escolhidas, com a cascata de cada uma (US-11, T023).
   *
   * **Permissao exigida: `delete_users` para a acao e `delete_user` para cada
   * conta alvo** — e, **antes das duas**, a escolha entre reatribuir e apagar o
   * conteudo (CA-11.3). A inversao de ordem e do legado e esta declarada em
   * `administracao-de-contas/apagar-contas.ts`.
   *
   * O que desaparece e o que fica **orfao** esta no contrato observavel pelo
   * **P5**, e a cascata inteira esta declarada naquele arquivo, com teste.
   */
  apagarContas(
    pedido: PedidoDeExclusaoDeContas,
    contexto: ContextoDaAdministracaoDeContas,
  ): ResultadoDaExclusaoDeContas;

  /**
   * Desvincula as contas escolhidas deste site (US-11, T023).
   *
   * **Permissao exigida: `remove_users` para a acao e `remove_user` para cada
   * conta alvo** — e aqui, e **so** aqui, a conta sem permissao e **saltada** e
   * as demais prosseguem (CA-11.2). A diferenca entre as tres acoes em lote esta
   * declarada em `administracao-de-contas/promover-contas.ts`.
   *
   * Existe **somente** em instalacao de rede: fora dela a operacao recusa com
   * 400, porque desvincular identidade global de um site e conceito de rede.
   */
  removerContasDoSite(
    pedido: PedidoDeRemocaoDeContas,
    contexto: ContextoDaAdministracaoDeContas,
  ): ResultadoDaRemocaoDeContas;

  /**
   * Cria conta pelo painel, e notifica (US-11, T023 — CA-11.7).
   *
   * **Permissao exigida: `create_users`**. O papel escolhido exige
   * `promote_users` **em separado**, e quem nao a tem nao recebe recusa: o papel
   * e ignorado e vale o padrao da instalacao. Reproduzido do legado, e declarado
   * em `administracao-de-contas/conta-por-administrador.ts`.
   *
   * ⚠️ `create_users` **nao** e primitiva em rede: `N6` (BR-MIGRAR-066) a faz
   * depender de ser super administrador ou da opcao de rede `add_new_users`, e a
   * traducao esta em `plataforma/autorizacao/traducao-de-conta.ts`.
   */
  criarContaPorAdministrador(
    dados: DadosDaContaNovaPorAdministrador,
    contexto: ContextoDaAdministracaoDeContas,
  ): ResultadoDaCriacaoPorAdministrador;

  /**
   * Altera senha, e-mail e papel de uma conta pelo painel (US-11, T023).
   *
   * **Permissao exigida: `edit_user` sobre aquela conta** — e e a capacidade que
   * a traducao resolve com **lista vazia** quando a conta e a propria, o que e
   * *permitido*: *"qualquer conta edita o proprio perfil, inclusive um
   * assinante"* (UC-24).
   *
   * As duas mensagens de CA-11.7 saem daqui, para o endereco **anterior**.
   * Trocar o **papel** nao envia nada, e a razao esta em
   * `administracao-de-contas/notificacoes-da-administracao.ts`.
   */
  alterarContaPorAdministrador(
    contaId: number,
    alteracoes: AlteracoesDaConta,
    contexto: ContextoDaAdministracaoDeContas,
  ): ResultadoDaAlteracaoDeConta;
}

/** O que a instalacao informa ao modulo. Ver `armazenamento/index.ts`. */
export type OpcoesDeIdentidadeEAcesso = OpcoesDeArmazenamento;

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-DESCARTAR-009
 * descarta a redefinicao de funcao global e as 176 guardas `function_exists`, e
 * `target_business_rules.md` BR-MIGRAR-103 (`EXT-SUBST`) poe no lugar o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de
 * `pending_decisions.md` fixou "nenhum framework opinativo... sem container de
 * DI, sem ORM, sem ciclo de vida de framework", porque a ordem de arranque do
 * legado e contrato publico e framework com ciclo de vida proprio disputa com
 * ela.
 */
export function criarModuloDeIdentidadeEAcesso(
  portas: PortasDeIdentidadeEAcesso,
  opcoes: OpcoesDeIdentidadeEAcesso = {},
): ModuloDeIdentidadeEAcesso {
  return {
    nome: 'identidade-e-acesso',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui, que e o que `EXT-ORDEM` cobra e o que `modulo.test.ts` afirma.
    armazenamento: criarArmazenamento(portas.dados, opcoes),
    autenticar,
    sair,
    sessaoDaRequisicao,
    solicitarRedefinicaoDeSenha,
    redefinirSenha,
    cadastrar,
    emitirCredencialDeAplicacao,
    revogarCredencialDeAplicacao,
    promoverContas,
    apagarContas,
    removerContasDoSite,
    criarContaPorAdministrador,
    alterarContaPorAdministrador,
  };
}
