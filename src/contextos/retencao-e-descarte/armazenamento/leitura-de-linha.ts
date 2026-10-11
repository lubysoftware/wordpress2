/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (area 3 da Decisao 2 de
 * `parity_specs.md`) se aplica.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado, logo nenhuma leitura daqui recusa linha por
 * tamanho, formato ou dominio. Nesta feature isso tem um caso concreto e
 * nomeado: US-7 e `R6` mandam a coleta **tolerar** o estado inconsistente —
 * marcador que aponta para registro que nao esta mais na lixeira — *"apaga so o
 * metadado e segue"*. Uma leitura que recusasse a linha estranha mataria a
 * historia antes de ela comecar.
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-01, e a
 * repeticao e obrigatoria, nao descuido.** A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e o tipo de coluna vem da porta de cada contexto. Um
 * helper compartilhado teria de descer para `plataforma/`, e `plataforma/` e
 * onde a camada de dados sera montada (feature `015`, T007) — nao onde o
 * contexto le a propria linha.
 */

import type { LinhaDeResultado, ValorDeColuna } from '../portas/index.js';

const DECODIFICADOR = new TextDecoder();

/** Texto de uma coluna. Coluna ausente ou nula vira texto vazio, como no legado. */
export function comoTexto(valor: ValorDeColuna | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number') {
    return String(valor);
  }
  return DECODIFICADOR.decode(valor);
}

/**
 * Inteiro de uma coluna. Coluna ausente, nula ou ilegivel vira `0`.
 *
 * `Number.parseInt` le os digitos iniciais e ignora o resto, que e a mesma
 * coercao frouxa que o `(int)` do PHP faz e a mesma que o MySQL aplica ao
 * comparar `meta_value < %d` sobre uma coluna de texto
 * (`wp-includes/functions.php:6979`). Nao e tolerancia inventada aqui: e a
 * tolerancia que decide quais linhas a coleta apaga.
 */
export function comoInteiro(valor: ValorDeColuna | undefined): number {
  if (typeof valor === 'number') {
    return valor;
  }
  const texto = comoTexto(valor);
  if (texto === '') {
    return 0;
  }
  const numero = Number.parseInt(texto, 10);
  return Number.isNaN(numero) ? 0 : numero;
}

/** O valor da coluna como esta, sem interpretacao: o que o codec vai ler. */
export function comoBruto(valor: ValorDeColuna | undefined): ValorDeColuna {
  return valor === undefined ? null : valor;
}

export function primeiraLinha(
  linhas: readonly LinhaDeResultado[],
): LinhaDeResultado | null {
  return linhas.length === 0 ? null : (linhas[0] as LinhaDeResultado);
}
