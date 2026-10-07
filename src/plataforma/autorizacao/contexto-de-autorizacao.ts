/**
 * O contexto de uma pergunta de permissao: quem pergunta, com que matriz, em que
 * instalacao.
 *
 * **Tudo chega por argumento, e isso e a area 5 do critério de paridade.**
 * `EXT-CONTEXTO` (BR-MIGRAR-105) poe identidade no escopo da REQUISICAO, e a
 * implicacao 2 de `paradigm_decision.md` e o risco mais alto do catalogo de
 * descartes: *"se o mecanismo sair antes de o substituto entrar, duas requisicoes
 * concorrentes trocam de identidade entre si — e `current_user_can` aparece 1.279
 * vezes em 224 arquivos, com tres camadas paralelas de autorizacao, uma delas
 * falhando aberta. **Nenhum dos 985 testes apanha isso.**"*
 *
 * Dai a forma: nao existe `autorizacao.configurar(...)`, nao existe instancia
 * compartilhada e nao existe leitura de identidade "de fora". O cenario
 * `@composicao` de `07-autorizacao-por-capacidade.feature` cobra isso em uma
 * linha — *"nenhum ponto da politica le identidade de fora do contexto da
 * requisicao"* — e um contexto que chega por argumento nao tem como vazar.
 *
 * A mesma escolha, com a mesma justificativa, esta em
 * `contextos/identidade-e-acesso/autenticacao/contexto-de-autenticacao.ts`.
 */

import type {
  ConcessaoDeCapacidade,
  MatrizDePapeis,
} from './capacidade.js';
import type { ConstantesDoServidor } from './revogacao-por-constante.js';
import type { CasoDeTraducao } from './traducao-de-capacidade.js';

/**
 * Quem pergunta.
 *
 * `concessoes` e o conteudo cru da chave `{site}capabilities` daquela conta:
 * **papel e capacidade individual no mesmo mapa**, na ordem gravada. Nao e um
 * descuido de modelagem, e `PERM-2` (BR-MIGRAR-088) — e e por isso que *"um
 * usuario pode ter varios papeis, ou capacidade sem papel nenhum"* (`PERM-1`).
 * Separar os dois aqui obrigaria a decidir, fora do dado, o que e papel; quem
 * decide isso e a matriz, em `capacidades-do-ator.ts`.
 */
export interface AtorDeAutorizacao {
  /** `$user->ID`. `0` quando nao ha ninguem autenticado. */
  readonly contaId: number;
  /**
   * `$user->user_login`.
   *
   * Esta aqui por uma razao so, e ela e regra: **super administrador nao e
   * capacidade, e nome de login numa lista de rede** (`PERM-9`,
   * BR-MIGRAR-095). Nenhuma outra decisao deste modulo olha este campo.
   */
  readonly login: string;
  /** `$user->exists()`. Quem nao existe nao e super administrador. */
  readonly existe: boolean;
  /** O que `{site}capabilities` guarda, na ordem gravada. */
  readonly concessoes: readonly ConcessaoDeCapacidade[];
}

/**
 * O ator de uma requisicao sem ninguem autenticado.
 *
 * No legado ele nao e ausencia: `wp_get_current_user()` devolve um usuario de
 * `ID` 0, e `has_cap()` roda nele normalmente. A consequencia e observavel e esta
 * reproduzida: ele e negado em tudo, **menos** no que exige lista vazia e em
 * `exist`.
 */
export const ATOR_ANONIMO: AtorDeAutorizacao = {
  contaId: 0,
  login: '',
  existe: false,
  concessoes: [],
};

/**
 * O estado de rede, do ponto de vista desta pergunta.
 *
 * ⚠️ **Nada neste pacote escreve este estado**, como ja esta registrado em
 * `contexto-de-autenticacao.ts` para os eixos de supervisao do site: aqui ele e
 * **entrada**. A lista de super administradores e, no legado, uma opcao de rede
 * com **logins** — nao com identificadores e nao com capacidade (`PERM-9`).
 */
export interface EstadoDaRedeNaAutorizacao {
  /** A instalacao e em rede. Fora dela, o atalho do super admin nao existe. */
  readonly ativa: boolean;
  /** Os logins da lista de super administradores da rede. */
  readonly loginsDeSuperAdmin: readonly string[];
}

/** Site unico: sem rede, sem lista. E o valor de fabrica da instalacao. */
export const REDE_INATIVA_NA_AUTORIZACAO: EstadoDaRedeNaAutorizacao = {
  ativa: false,
  loginsDeSuperAdmin: [],
};

/**
 * Os pontos de extensao da decisao.
 *
 * Nomeados e opcionais pela mesma razao dos ganchos da entrada: o **P2** poe cada
 * um no contrato publico *"com o nome, os argumentos, a ordem de disparo e a
 * capacidade de alterar o resultado"*, e o barramento que os dispara
 * (`plataforma/barramento/`) nao existe nesta arvore. Ponto sem interceptador e,
 * no legado, um no-op.
 */
export interface GanchosDeAutorizacao {
  /**
   * `user_has_cap`: recebe o mapa de capacidades do ator e **pode alterar o
   * resultado**, concedendo ou retirando.
   *
   * **A posicao dele e regra, nao detalhe.** ADR-0009, garantia 2: o atalho do
   * super administrador roda **antes** deste ponto, *"logo nenhum plugin
   * consegue retirar poder do super admin por ali — so `do_not_allow` dentro de
   * `map_meta_cap()` o detem"*. E as duas sinteticas sao aplicadas **depois**,
   * logo nem conceder `do_not_allow` por aqui funciona. `decisao-de-capacidade.ts`
   * declara a ordem inteira, e ha teste para ela.
   *
   * Recebe os mesmos quatro argumentos do legado, na ordem: o mapa, a lista
   * exigida, os argumentos da pergunta e o ator.
   */
  readonly aoMontarCapacidadesDoAtor?: (
    capacidades: ReadonlyMap<string, boolean>,
    exigidas: readonly string[],
    argumentos: readonly unknown[],
    ator: AtorDeAutorizacao,
  ) => ReadonlyMap<string, boolean>;
}

/**
 * Tudo de que a decisao precisa **menos** quem pergunta.
 *
 * Existe separado porque CA-7.4 pergunta "quem tem esta capacidade": ali a mesma
 * base e exercitada com um ator por candidato, e so o ator muda.
 */
export interface BaseDeAutorizacao {
  /**
   * A matriz papel por capacidade **como esta gravada agora** (ADR-0001,
   * `PERM-13`). Quem a le do armazenamento e BC-05; aqui ela e dado de entrada.
   */
  readonly matriz: MatrizDePapeis;
  readonly rede: EstadoDaRedeNaAutorizacao;
  /** As quatro constantes do dono do servidor. Omitidas, valem as de fabrica. */
  readonly constantes?: ConstantesDoServidor;
  /**
   * Os casos de traducao de capacidade sobre objeto — os 86 `case` de `PERM-3`.
   *
   * O de conteudo e `casoDeConteudo( fonte )`, de `traducao-de-conteudo.ts`
   * (US-8 / T017): a resolucao por autoria e por estado do objeto. Os demais
   * chegam com a feature do objeto de cada um.
   *
   * A revogacao pelas quatro constantes **nao** entra por aqui: ela e a primeira
   * da ordem declarada e nao e substituivel — ver `decisao-de-capacidade.ts`.
   */
  readonly casosDeTraducao?: readonly CasoDeTraducao[];
  readonly ganchos?: GanchosDeAutorizacao;
}

/** A base, mais quem pergunta. */
export interface ContextoDeAutorizacao extends BaseDeAutorizacao {
  readonly ator: AtorDeAutorizacao;
}

/** Junta a base com um ator, para quem percorre candidatos (CA-7.4). */
export function comAtor(
  base: BaseDeAutorizacao,
  ator: AtorDeAutorizacao,
): ContextoDeAutorizacao {
  return { ...base, ator };
}
