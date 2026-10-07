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

export * from './portas/index.js';

export * from './conta/leitura-de-conta.js';
export * from './sessao/registro-de-sessoes.js';
export * from './autenticacao/autenticar.js';
export * from './autenticacao/cadeia-de-autenticacao.js';
export * from './autenticacao/contexto-de-autenticacao.js';
export * from './autenticacao/erro-de-autenticacao.js';
export * from './autenticacao/normalizacao-de-credencial.js';
export * from './autenticacao/prazos-de-sessao.js';
export * from './autenticacao/verificacao-de-senha.js';

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
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | `autenticar` | US-1 | T003 | **nenhuma capacidade**, declarada (ver abaixo) |
 */
export interface ModuloDeIdentidadeEAcesso {
  readonly nome: 'identidade-e-acesso';
  readonly portas: PortasDeIdentidadeEAcesso;

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
}

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
): ModuloDeIdentidadeEAcesso {
  return {
    nome: 'identidade-e-acesso',
    portas,
    autenticar,
  };
}
