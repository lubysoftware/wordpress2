/**
 * O contexto de uma tentativa de entrada: tudo que a entrada precisa e que **nao
 * e** porta deste modulo.
 *
 * **Por que contexto por argumento, e nao estado de modulo.** AD-02 e
 * BR-MIGRAR-105 (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da
 * REQUISICAO, e a implicacao 2 de `paradigm_decision.md` e chamada ali de *"a
 * mais grave da travessia"*: numa runtime longo-viva, identidade em estado de
 * modulo faz duas requisicoes concorrentes trocarem de identidade entre si. A
 * area 5 do critério de paridade existe por isso — *"estado entre requisicoes
 * concorrentes: teste proprio, fora dos UCs"*, com tolerancia **zero, sem
 * excecao**. Um contexto que chega por argumento nao tem como vazar entre
 * requisicoes.
 *
 * **Por que os ganchos e as colaboracoes chegam aqui, e nao como porta.** AD-08
 * fixa portas somente nas 5 bordas e recusa explicitamente dar porta ao
 * barramento de ganchos; AD-10 manda resolver toda chamada entre contextos **no
 * momento da chamada**. Logo o que vem de fora deste contexto limitado chega por
 * argumento, com ligacao tardia, e o barramento de `plataforma/barramento/`
 * (feature 015) ocupa os pontos nomeados abaixo quando existir.
 */

import type { PortaDeRelogio } from '../portas/index.js';
import type { Conta } from '../conta/leitura-de-conta.js';
import type { LeituraDeConta } from '../conta/leitura-de-conta.js';
import type { ArmazenamentoDeSessoes } from '../sessao/registro-de-sessoes.js';
import type { ErroDeAutenticacao } from './erro-de-autenticacao.js';
import type { RemocaoDeAcentos } from './normalizacao-de-credencial.js';
import type { PrazosDoTokenDeSessao } from './prazos-de-sessao.js';
import type { VerificadorDeSenha } from './verificacao-de-senha.js';

/**
 * O estado da rede, do ponto de vista desta requisicao.
 *
 * ⚠️ **Nada neste pacote escreve este estado.** Supervisionar o site da rede por
 * eixos independentes e REQ-133, que ficou na coluna `backlog` e esta em
 * `do-not-rewrite.md`. Logo aqui ele e **entrada**, lida de fora: esta tarefa
 * reproduz a recusa que CA-1.5 cobra, nao o mecanismo que marca o site.
 *
 * Os eixos sao ortogonais, nao estados de uma maquina: UC-43 e literal — *"um
 * site pode estar arquivado E marcado como spam ao mesmo tempo, e os dois
 * produzem a mesma resposta ao visitante"*.
 */
export interface EstadoDaRede {
  /** A instalacao e em rede. Fora da rede, nada daqui decide nada. */
  readonly ativa: boolean;
  /** O site corrente esta arquivado. */
  readonly siteArquivado: boolean;
  /** O site corrente esta marcado como spam. */
  readonly siteMarcadoComoSpam: boolean;
}

/** O estado de rede de uma instalacao de site unico: nada marcado. */
export const REDE_INATIVA: EstadoDaRede = {
  ativa: false,
  siteArquivado: false,
  siteMarcadoComoSpam: false,
};

/**
 * Os pontos de extensao que a entrada atravessa, fora da cadeia.
 *
 * Estao aqui **nomeados e opcionais** porque P2 poe cada um no contrato publico,
 * com *"o nome, os argumentos, a ordem de disparo e a capacidade de alterar o
 * resultado"*, e porque o barramento que os dispara nao existe nesta arvore. Um
 * ponto sem interceptador registrado e, no legado, um no-op — logo a ausencia
 * aqui reproduz o legado, e nao o enfraquece.
 */
export interface GanchosDaEntrada {
  /**
   * `wp_login`: dispara **depois** de a credencial ser aceita. Recebe o login e
   * a conta. Nao altera o resultado.
   */
  readonly aoEntrar?: (login: string, conta: Conta) => void;
  /**
   * `wp_login_failed`: dispara quando a entrada falha, **menos** nos dois
   * codigos de campo vazio (ver `CODIGOS_QUE_NAO_ANUNCIAM_FALHA`). Recebe o
   * identificador tentado e o erro. Nao altera o resultado.
   */
  readonly aoFalharEntrada?: (
    identificador: string,
    erro: ErroDeAutenticacao,
  ) => void;
}

/**
 * O contexto de uma tentativa de entrada.
 *
 * Deliberadamente sem `portas.dados`: a cadeia nao fala com o banco, fala com
 * `LeituraDeConta`. Quem compoe resolve a leitura sobre a porta.
 */
export interface ContextoDeAutenticacao {
  readonly relogio: PortaDeRelogio;
  readonly contas: LeituraDeConta;
  readonly sessoes: ArmazenamentoDeSessoes;
  readonly verificadorDeSenha: VerificadorDeSenha;

  /**
   * A remocao de acentos da sanitizacao de conta. Chega por argumento porque a
   * tabela de caractere e de `plataforma/` — ver `normalizacao-de-credencial.ts`.
   */
  readonly removerAcentos: RemocaoDeAcentos;

  readonly rede: EstadoDaRede;

  /**
   * A URL do pedido de senha perdida, que o legado concatena nas duas mensagens
   * de senha incorreta. Vem de fora porque e da tela, nao do dominio
   * (`target_screens.md`, `SCR-002`).
   */
  readonly urlDeSenhaPerdida: string;

  /**
   * O destino padrao quando a entrada nao pede nenhum: o painel (CA-1.1).
   * Vem de fora porque a URL do painel e da instalacao.
   */
  readonly urlDoPainel: string;

  /** O que a requisicao informa sobre a origem, para gravar na sessao. */
  readonly origem?: { readonly endereco?: string; readonly agente?: string };

  /** Os prazos do token. Omitido, valem os de fabrica. */
  readonly prazosDoToken?: PrazosDoTokenDeSessao;

  /**
   * A carencia da sessao, em segundos (US-3 / T007). Omitida, vale a de fabrica:
   * 12 horas, de BR-MIGRAR-025 (`U5`).
   *
   * Chega por aqui porque a entrada decide as duas coisas que a carencia toca —
   * o prazo da credencial do navegador e a poda do que o registro de token ja
   * nao aceita. Ver `../sessao/expiracao-de-sessao.ts`, onde o numero e
   * declarado e onde esta registrado o ponto que o pacote deixou aberto sobre o
   * alcance dela.
   */
  readonly carenciaDeSessao?: number;

  readonly ganchos?: GanchosDaEntrada;
}
