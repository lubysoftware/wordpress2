/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (Decisao 2, area 3) se
 * aplica.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado — *"escrita invalida nao falha, ela se
 * degrada"* —, logo nenhuma leitura daqui recusa linha por tamanho, formato ou
 * dominio. Uma linha com `post_status` que nenhum registro conhece e lida como
 * qualquer outra, que e o que o legado faz (UC-03, *Excecoes*: o mapeamento de
 * capacidade **degrada**, a leitura nao recusa).
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-05, e a
 * repeticao e obrigatoria, nao descuido.** A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e o tipo de coluna vem da porta de cada contexto.
 * Um helper compartilhado teria de descer para `plataforma/`, e `plataforma/` e
 * onde o SQL e montado por fragmento (015, T007) — nao onde o contexto le a
 * propria linha.
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

/** Inteiro de uma coluna. Coluna ausente, nula ou ilegivel vira `0`. */
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

/**
 * O primeiro valor da primeira linha, **pela posicao e nao pelo nome**.
 *
 * E o `get_var()` do legado (`wp-includes/class-wpdb.php`), e e por posicao
 * porque a consulta que mais o usa aqui nao da nome a coluna:
 * `SELECT COUNT(*) FROM $table ...` (`wp-includes/meta.php:96`). Depender do
 * nome obrigaria a trocar a cadeia por `COUNT(*) AS algo`, e a cadeia enviada e
 * o que o slot `persistencia` do plano manda poder ser *"a MESMA string que o
 * legado envia"*.
 */
export function primeiroValor(
  linhas: readonly LinhaDeResultado[],
): ValorDeColuna {
  const linha = primeiraLinha(linhas);
  if (linha === null) {
    return null;
  }
  const valores = Object.values(linha);
  return valores.length === 0 ? null : (valores[0] ?? null);
}
