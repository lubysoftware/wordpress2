/**
 * O prazo do token que a entrada abre.
 *
 * **Por que este arquivo existe em T003 e nao em T007.** Abrir sessao exige um
 * instante de expiracao: no legado o prazo e escolhido **na entrada**, conforme
 * a conta ter pedido para ser lembrada, e passado ja calculado para quem cria o
 * token. CA-1.1 cobra a criacao do token, logo o prazo entra aqui por
 * necessidade, nao por antecipacao.
 *
 * **O que NAO esta aqui, e e de T007 (US-3).** Aplicar o prazo: recusar a sessao
 * vencida, aceitar dentro da carencia de 12 horas, tratar a requisicao como
 * anonima depois dela (CA-3.1 a CA-3.4) — e os testes de borda que o P6 cobra,
 * *"no ultimo instante aceita, um instante depois recusa"*. A carencia nao esta
 * declarada neste arquivo de proposito: ela nao entra no prazo do token, e
 * interpretar onde ela entra e a entrega de T007.
 *
 * Os dois numeros sao de BR-MIGRAR-025 (`U5`), que acrescenta o detalhe que um
 * porte perde: *"sem 'lembrar', o cookie e de sessao, mas o token ainda expira
 * em 2 dias"*. UC-19 repete por outras palavras — *"fechar o navegador nao
 * encerra a sessao do lado do servidor"*. Sao duas coisas diferentes e so uma
 * delas e este arquivo: aqui mora o prazo do **token**.
 */

/** Segundos numa hora, como o legado os declara. */
export const SEGUNDOS_POR_HORA = 3600;

/** Segundos num dia, como o legado os declara. */
export const SEGUNDOS_POR_DIA = 86400;

/**
 * O ponto de configuracao nomeado do prazo do token, com os valores de fabrica
 * do legado, como o P6 exige.
 *
 * E filtravel no legado — o prazo passa por um ponto de extensao que recebe a
 * conta e a opcao de lembranca —, e BR-MIGRAR-108 (`ESC-FILTRAVEL`) poe isso no
 * contrato: *"toda regra deste catalogo e um default FILTRAVEL, e preservar isso
 * e o porte"*. Por isso o calculo abaixo recebe os prazos por argumento em vez
 * de ler a constante direto.
 */
export interface PrazosDoTokenDeSessao {
  /** 2 dias: a entrada sem pedir lembranca. */
  readonly semLembrar: number;
  /** 14 dias: a entrada com lembranca. */
  readonly comLembrar: number;
}

export const PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA: PrazosDoTokenDeSessao = {
  semLembrar: 2 * SEGUNDOS_POR_DIA,
  comLembrar: 14 * SEGUNDOS_POR_DIA,
};

/**
 * O instante em que o token aberto agora vence.
 *
 * Soma sobre o relogio em segundos inteiros UTC, que e a unidade da
 * `PortaDeRelogio` — e a unidade e regra, nao gosto: o legado faz essa
 * aritmetica sobre segundos inteiros, e milissegundo aqui seria precisao que o
 * produto nao tem.
 */
export function expiracaoDoToken(
  agoraEmSegundos: number,
  lembrar: boolean,
  prazos: PrazosDoTokenDeSessao = PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA,
): number {
  return agoraEmSegundos + (lembrar ? prazos.comLembrar : prazos.semLembrar);
}
