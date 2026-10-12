/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 * Entrega de **T002**. *satisfaz:* — (infraestrutura).
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (area 3 da Decisao 2 de
 * `parity_specs.md`) se aplica. Nesta feature a coluna lida e sempre a mesma,
 * `option_value`, e ela carrega **duas coisas diferentes**: a fila, que e
 * estrutura serializada, e a trava, que e texto de 22 casas decimais.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado, e nesta feature ela tem caso nomeado:
 * `_get_cron_array()` devolve a fila vazia quando o valor gravado **nao e
 * arranjo** (`wp-includes/cron.php:1263`-`1265`) — nao lanca, nao avisa e nao
 * apaga a linha estranha. Uma leitura que recusasse a linha mudaria isso.
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` dos outros contextos,
 * e a repeticao e obrigatoria, nao descuido.** A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e o tipo de coluna vem da porta de cada contexto. Um
 * auxiliar compartilhado teria de descer para `plataforma/`, que e onde a camada
 * de dados sera montada (feature `015`) — nao onde o contexto le a propria linha.
 */

import type { LinhaDeResultado, ValorDeColuna } from '../portas/index.js';

/**
 * O valor da coluna como ele chegou, para o codec ler — ou `null` quando a coluna
 * nao veio.
 *
 * Numero vira texto porque e o que o driver fez com uma coluna que o legado grava
 * como texto: a trava `'1700000000.1234560012817382812500'` cabe num numero deste
 * runtime so perdendo casas, e e a cadeia inteira que decide identidade.
 */
export function comoTextoOuBytes(
  valor: ValorDeColuna | undefined,
): string | Uint8Array | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  return typeof valor === 'number' ? String(valor) : valor;
}

/** O texto de uma coluna. Coluna ausente ou nula vira texto vazio, como no legado. */
export function comoTexto(valor: ValorDeColuna | undefined): string {
  const bruto = comoTextoOuBytes(valor);
  if (bruto === null) {
    return '';
  }
  return typeof bruto === 'string' ? bruto : DECODIFICADOR.decode(bruto);
}

export function primeiraLinha(
  linhas: readonly LinhaDeResultado[],
): LinhaDeResultado | null {
  return linhas.length === 0 ? null : (linhas[0] as LinhaDeResultado);
}

/**
 * Dois valores de coluna com os mesmos bytes?
 *
 * E a comparacao de `update_option()`
 * (`if ( $value === $old_value || maybe_serialize( $value ) === maybe_serialize( $old_value ) )`,
 * `wp-includes/option.php:923`), que decide entre **gravar e nao emitir comando
 * nenhum**. Em bytes, e nao em texto decodificado: a coluna pode guardar byte que
 * nenhuma decodificacao recupera, e comparar texto decodificado daria dois
 * valores diferentes por iguais — o que suprimiria uma escrita que o legado faz.
 */
export function mesmosBytes(
  gravado: string | Uint8Array,
  novo: string | Uint8Array,
): boolean {
  const aqui = typeof gravado === 'string' ? CODIFICADOR.encode(gravado) : gravado;
  const ali = typeof novo === 'string' ? CODIFICADOR.encode(novo) : novo;
  if (aqui.length !== ali.length) {
    return false;
  }
  for (let indice = 0; indice < aqui.length; indice += 1) {
    if (aqui[indice] !== ali[indice]) {
      return false;
    }
  }
  return true;
}

const CODIFICADOR = new TextEncoder();
const DECODIFICADOR = new TextDecoder();
