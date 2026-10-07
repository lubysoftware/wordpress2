/**
 * A geracao de segredo do legado: o alfabeto e o sorteio, e nada mais.
 *
 * O cadastro gera **dois** segredos, e o legado gera os dois com a mesma funcao,
 * pedindo comprimentos diferentes e desligando os caracteres especiais nas duas
 * chamadas: a senha inicial da conta (CA-6.4, *"nenhuma senha definida pelo
 * titular"*) e a chave que acompanha o caminho de definicao de senha (CA-6.5).
 *
 * **O alfabeto e regra, nao detalhe.** Ele decide o conjunto de valores possiveis
 * e, com ele, o que uma extensao que leia o segredo recebe. Acrescentar simbolo
 * mudaria o conjunto; tirar digito, tambem.
 *
 * ⚠️ **A fonte de aleatoriedade chega por argumento** porque o **P4** e o **P6**
 * pedem teste com borda controlada, e porque um sorteio lido de dentro nao tem
 * como ser afirmado. O valor de fabrica e o sorteio criptografico do runtime; a
 * suite usa uma fonte determinista. Nenhum caminho deste modulo escolhe o
 * sorteio: quem compoe escolhe.
 */

import { randomInt } from 'node:crypto';

/**
 * O alfabeto das duas chamadas do cadastro: letra e digito, **sem** caractere
 * especial.
 *
 * O legado tem tres niveis de alfabeto — basico, com especiais e com especiais
 * extras — e as duas chamadas do cadastro pedem o basico. Os outros dois niveis
 * **nao estao aqui**: nenhuma regra deste pacote os alcanca, e escreve-los seria
 * comportamento sem teste. A ordem dos caracteres e a do legado, porque e ela que
 * liga cada numero sorteado a um caractere.
 */
export const ALFABETO_DE_SEGREDO =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Um sorteio de inteiro em `[0, limiteExclusivo)`.
 *
 * A assinatura e a do legado — ele sorteia um indice por caractere, e nao um
 * bloco de bytes de uma vez. A diferenca aparece no numero de chamadas, que a
 * suite afirma.
 */
export type FonteDeAleatoriedade = (limiteExclusivo: number) => number;

/** O sorteio de fabrica: o gerador criptografico do runtime. */
export const ALEATORIEDADE_DO_RUNTIME: FonteDeAleatoriedade = (
  limiteExclusivo,
) => randomInt(limiteExclusivo);

/**
 * Gera um segredo com o comprimento pedido.
 *
 * Comprimento zero ou negativo devolve o texto vazio **sem sortear nada**, que e o
 * que o laco do legado faz: ele nao valida o comprimento, so nao entra no laco.
 */
export function gerarSegredo(
  comprimento: number,
  aleatorio: FonteDeAleatoriedade,
  alfabeto: string = ALFABETO_DE_SEGREDO,
): string {
  let segredo = '';
  for (let posicao = 0; posicao < comprimento; posicao += 1) {
    segredo += alfabeto.charAt(aleatorio(alfabeto.length));
  }
  return segredo;
}
