/**
 * O token de sessao que a entrada bem-sucedida cria (CA-1.1).
 *
 * > ⚠️ **A forma de armazenamento da sessao e de T002**, que nao fechou quando
 * > T003 foi escrita. A divisao aqui e a que `target_architecture.md` sugere por
 * > outro motivo: o **comportamento** de abrir sessao e desta tarefa, porque o
 * > token e a credencial que CA-1.1 exige; a **forma gravada** fica atras de
 * > `ArmazenamentoDeSessoes`, porque ela vive em metadado serializado
 * > (`AGG-Sessao` e *"dividido de `usermeta`"*) e o codec do formato
 * > serializado e da fronteira do banco (`DB-SER`, BR-MIGRAR-082). T002 implementa
 * > o armazenamento; nada aqui serializa nada.
 *
 * **O registro de token acumula, e isso e criterio de aceite.** BR-MIGRAR-111
 * (`ESC-SESSAO`) e explicito: trocar a senha nao revoga nada, *"o registro do
 * token sobrevive em `usermeta` e acumula"*, e o criterio de aceite *"tem de
 * verificar o acumulo, nao a limpeza"*. Logo abrir sessao **soma** ao mapa; nao
 * substitui, nao poda e nao limita quantidade. REQ-008, que pediria a revogacao,
 * esta `bloqueado` e `do-not-rewrite.md` o poe fora do pacote.
 *
 * O encerramento da sessao corrente (US-2 / T005) e as duas operacoes que
 * existem **sem nenhum chamador** (BR-MIGRAR-111: *"existir sem ser chamada e
 * parte do que se clona"*) sao das tarefas delas.
 *
 * **T007 acrescentou a poda do que venceu a `abrir`**, e so ela. O motivo esta
 * em `armazenamento/sessao.ts`, que registrou a divisao: *"o legado filtra o que
 * venceu NA LEITURA, e esse filtro precisa do relogio"*, e `abrir` le o mapa
 * antes de regravar — logo a gravacao do legado sai sem o que ja nao e aceito.
 * A criterio de paridade desta area e **efeito no banco**, com tolerancia zero
 * (`parity_specs.md`, area 3): deixar no registro o que o legado tira seria
 * divergencia de escrita, nao sujeira interna. Ver `expiracao-de-sessao.ts`.
 */

import { createHash, randomInt } from 'node:crypto';

import {
  CARENCIA_DE_SESSAO_DE_FABRICA,
  sessoesAceitas,
} from './expiracao-de-sessao.js';

/**
 * Uma sessao gravada, com os campos que `target_domain_model.md` lista para
 * `AGG-Sessao`: token, instante de expiracao, endereco, agente e conta.
 *
 * O token **nao** fica aqui: o que se guarda e o resumo dele, e o valor em claro
 * existe uma vez so, no retorno de `abrir`. Guardar o token em claro no mapa
 * daria, a quem lesse o metadado, a credencial de todas as sessoes.
 */
export interface Sessao {
  /** `expiration` do legado: segundos inteiros UTC. */
  readonly expiraEm: number;
  /** `login` do legado: o instante em que a sessao foi aberta. */
  readonly abertaEm: number;
  /** `ip` do legado. Ausente quando a requisicao nao informa endereco. */
  readonly endereco?: string;
  /** `ua` do legado. Ausente quando a requisicao nao informa agente. */
  readonly agente?: string;
}

/** O mapa de sessoes de uma conta, indexado pelo resumo do token. */
export type MapaDeSessoes = Readonly<Record<string, Sessao>>;

/**
 * O armazenamento do mapa, que T002 implementa sobre `usermeta`.
 *
 * Sincrono por AD-04. Le e grava o mapa inteiro porque e assim que o legado o
 * trata: um unico metadado serializado por conta, lido e reescrito por inteiro —
 * e e desse fato que vem o acumulo de BR-MIGRAR-111.
 */
export interface ArmazenamentoDeSessoes {
  ler(idDaConta: number): MapaDeSessoes;
  gravar(idDaConta: number, sessoes: MapaDeSessoes): void;
}

/**
 * O alfabeto e o comprimento do token gerado.
 *
 * ⚠️ **Nenhum dos dois esta registrado neste pacote.** Eles reproduzem o gerador
 * do legado, chamado sem caractere especial, e por isso ficam aqui como ponto de
 * configuracao nomeado, para serem conferidos contra o oraculo
 * (`ESC-ORACULO`) junto com o resto. O P6 cobra o valor de fabrica e o teste de
 * borda; o valor de fabrica esta nomeado, e a conferencia contra o legado
 * executavel e de T001 da feature 015.
 */
export const COMPRIMENTO_DO_TOKEN_DE_SESSAO = 43;
export const ALFABETO_DO_TOKEN_DE_SESSAO =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Gera o token em claro. E a unica vez que ele existe fora do navegador. */
export function gerarTokenDeSessao(): string {
  let token = '';
  for (let i = 0; i < COMPRIMENTO_DO_TOKEN_DE_SESSAO; i += 1) {
    token += ALFABETO_DO_TOKEN_DE_SESSAO[
      randomInt(ALFABETO_DO_TOKEN_DE_SESSAO.length)
    ];
  }
  return token;
}

/**
 * O resumo do token, que e a chave do mapa gravado.
 *
 * Importado tambem por quem valida a sessao (US-3 / T007): as duas pontas tem de
 * usar a mesma funcao, ou a sessao aberta nao e encontrada.
 */
export function resumoDoTokenDeSessao(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** O que a requisicao informa sobre quem esta abrindo a sessao. */
export interface OrigemDaSessao {
  readonly endereco?: string;
  readonly agente?: string;
}

/** O que `abrir` devolve: o token em claro e o instante em que ele vence. */
export interface SessaoAberta {
  readonly token: string;
  readonly expiraEm: number;
}

/**
 * Abre uma sessao: soma uma entrada ao mapa da conta e devolve o token em claro.
 *
 * `expiraEm` chega calculado de fora, porque quem decide o prazo e a entrada
 * (ver `prazos-de-sessao.ts`) e quem **aplica** o prazo e US-3 / T007.
 */
export function abrirSessao(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
  expiraEm: number,
  agoraEmSegundos: number,
  origem: OrigemDaSessao = {},
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): SessaoAberta {
  const sessao: Sessao = {
    expiraEm,
    abertaEm: agoraEmSegundos,
    ...(origem.endereco === undefined ? {} : { endereco: origem.endereco }),
    ...(origem.agente === undefined ? {} : { agente: origem.agente }),
  };

  const token = gerarTokenDeSessao();

  // Soma, nunca substitui: BR-MIGRAR-111 poe o acumulo no criterio de aceite.
  // O que sai do mapa aqui sai pelo RELOGIO e por nada mais (T007): o acumulo
  // que `ESC-SESSAO` manda preservar e o das sessoes que continuam aceitas, em
  // dispositivos diferentes, e trocar a senha nao tira nenhuma delas.
  const anteriores = sessoesAceitas(
    armazenamento.ler(idDaConta),
    agoraEmSegundos,
    carencia,
  );
  armazenamento.gravar(idDaConta, {
    ...anteriores,
    [resumoDoTokenDeSessao(token)]: sessao,
  });

  return { token, expiraEm };
}
