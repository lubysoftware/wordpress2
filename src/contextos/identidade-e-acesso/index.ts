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
import type { ArmazenamentoDeSessoes } from './sessao/registro-de-sessoes.js';
import {
  cadastrar,
  type DadosDoCadastro,
  type ResultadoDoCadastro,
} from './cadastro/cadastrar.js';
import type { ContextoDeCadastro } from './cadastro/contexto-de-cadastro.js';

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
 * | `cadastrar` | US-6 | T013 | **nenhuma capacidade**, declarada (ver abaixo) |
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
    cadastrar,
  };
}
