/**
 * A sessao desta requisicao, ou nenhuma: CA-3.3 e CA-3.4.
 *
 * > *"CA-3.4 Passada a carencia, a requisicao e tratada como anonima e a
 * > autenticacao e exigida de novo"* — `spec.md`, US-3.
 *
 * **Anonima aqui e um valor devolvido, nao uma excecao e nao um redirecionamento.**
 * No legado a validacao da credencial devolve **falso** e a conta corrente passa
 * a ser a conta zero; quem decide pedir a entrada de novo e a camada acima, e ela
 * nao e deste modulo. Devolver o motivo em vez de so `null` e o que permite a
 * essa camada reproduzir a reacao do legado sem adivinhar por que a sessao caiu.
 *
 * **Nada aqui e estado de modulo, e isso e pre-requisito, nao estilo.** AD-02 e
 * BR-MIGRAR-105 (`EXT-CONTEXTO`) poem a identidade no escopo da REQUISICAO, e o
 * cenario de concorrencia de `parity_tests/06-autenticacao-e-sessao.feature` tem
 * tolerancia **zero, sem excecao**: *"duas sessoes concorrentes nao trocam de
 * identidade entre si"* e *"a identidade nao sobrevive ao fim da requisicao no
 * processo longo-vivo"*. Esta funcao nao guarda nada entre chamadas: recebe a
 * credencial, le o armazenamento que lhe foi passado e devolve. Duas chamadas
 * concorrentes nao tem onde se cruzar.
 *
 * **O que esta funcao NAO confere.** A integridade da credencial — o HMAC cuja
 * chave embute o fragmento de 4 caracteres do hash da senha
 * (`pluggable.php:855`–`:867`). Ela confere o que US-3 cobra, que e **prazo**:
 * a credencial apresentada aponta para uma sessao gravada, e essa sessao ainda e
 * aceita pelo relogio. A conferencia de integridade e uma camada acima desta e
 * esta nomeada em `expiracao-de-sessao.ts`; quem a construir chama esta funcao
 * depois de validar o HMAC, nao em lugar dela.
 */

import {
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type Sessao,
} from './registro-de-sessoes.js';
import {
  CARENCIA_DE_SESSAO_DE_FABRICA,
  situacaoDaSessao,
} from './expiracao-de-sessao.js';

/**
 * O que a requisicao apresenta: a conta e o token em claro.
 *
 * A conta chega identificada porque e assim que a credencial do legado a carrega
 * — o valor da credencial nomeia a conta e o token, e o mapa de sessoes e por
 * conta. O token chega **em claro**, porque o que esta gravado e o resumo dele
 * (ver `registro-de-sessoes.ts`): quem leu o banco nao tem o que apresentar aqui.
 */
export interface CredencialApresentada {
  readonly idDaConta: number;
  readonly token: string;
}

/**
 * Por que a requisicao e anonima.
 *
 * Os dois motivos sao distintos no legado — a credencial que aponta para token
 * que nao existe e a credencial cujo prazo esgotou caem em pontos de extensao
 * diferentes —, e por isso nao sao colapsados num `null`. O **efeito** dos dois e
 * o mesmo e CA-3.4 cobra o efeito: a requisicao e tratada como anonima.
 *
 * ⚠️ Os **nomes** desses pontos de extensao nao estao registrados em nenhum
 * documento deste pacote, e nao foram inventados aqui: o P2 cobra *"o nome, os
 * argumentos, a ordem de disparo"* de cada ponto, e nome adivinhado e contrato
 * publico errado. O que esta tarefa entrega e a distincao de estado que eles
 * precisam; o registro dos nomes e do inventario de pontos de extensao que o P2
 * pede como artefato versionado.
 */
export type MotivoDeRequisicaoAnonima =
  /** A credencial nao apresentou token: nao ha o que validar. */
  | 'sem-credencial'
  /** O token apresentado nao esta no registro da conta. */
  | 'sessao-desconhecida'
  /** O token esta no registro, e o relogio passou do prazo mais a carencia. */
  | 'sessao-vencida';

export type SessaoDaRequisicao =
  | {
      readonly reconhecida: true;
      readonly idDaConta: number;
      readonly resumoDoToken: string;
      readonly sessao: Sessao;
      /**
       * A sessao passou do prazo e esta sendo aceita pela carencia (CA-3.3).
       *
       * Devolvido e nao consumido: o P7 manda preservar o modo de falha e proibe
       * que *"nenhuma decisao do sistema passe a depender"* de observabilidade
       * acrescentada. Nada deste modulo ramifica neste campo.
       */
      readonly naCarencia: boolean;
    }
  | {
      readonly reconhecida: false;
      readonly motivo: MotivoDeRequisicaoAnonima;
    };

/**
 * Resolve a sessao desta requisicao pelo prazo (CA-3.3, CA-3.4).
 *
 * A leitura e do mapa **cru**, e nao do mapa filtrado por
 * `sessoesAceitas`, de proposito: filtrar primeiro tornaria a sessao vencida
 * indistinguivel da inexistente, e o legado distingue as duas. O filtro existe
 * para a gravacao, que e onde ele muda o banco.
 */
export function sessaoDaRequisicao(
  armazenamento: ArmazenamentoDeSessoes,
  credencial: CredencialApresentada,
  agoraEmSegundos: number,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): SessaoDaRequisicao {
  if (credencial.token === '') {
    return { reconhecida: false, motivo: 'sem-credencial' };
  }

  const resumoDoToken = resumoDoTokenDeSessao(credencial.token);
  const sessao = armazenamento.ler(credencial.idDaConta)[resumoDoToken];

  if (sessao === undefined) {
    return { reconhecida: false, motivo: 'sessao-desconhecida' };
  }

  const situacao = situacaoDaSessao(sessao, agoraEmSegundos, carencia);
  if (situacao === 'vencida') {
    return { reconhecida: false, motivo: 'sessao-vencida' };
  }

  return {
    reconhecida: true,
    idDaConta: credencial.idDaConta,
    resumoDoToken,
    sessao,
    naCarencia: situacao === 'na-carencia',
  };
}

/** A requisicao e anonima: nenhuma decisao de autorizacao e feita por conta. */
export function requisicaoEhAnonima(resolucao: SessaoDaRequisicao): boolean {
  return !resolucao.reconhecida;
}
