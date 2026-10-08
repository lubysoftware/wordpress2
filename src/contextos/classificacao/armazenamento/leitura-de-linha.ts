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
 * dominio. Uma linha de `term_taxonomy` cujo `taxonomy` nenhum registro conhece e
 * lida como qualquer outra: quem decide o que fazer com contexto nao registrado e
 * o dominio, e o legado tolera a linha e recusa so no caminho que a consulta
 * (`class-wp-term.php:173`, `invalid_taxonomy`).
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-01 e de BC-05,
 * e a repeticao e obrigatoria, nao descuido.** A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e o tipo de coluna vem da porta de cada contexto. Um
 * helper compartilhado teria de descer para `plataforma/`, e `plataforma/` e onde
 * o SQL e montado por fragmento (015, T007) — nao onde o contexto le a propria
 * linha.
 *
 * ⚠️ **Nao ha `comoBruto` aqui, e a ausencia e leitura do esquema.** O gemeo de
 * BC-01 tem essa funcao porque `postmeta.meta_value` guarda valor serializado e o
 * codec precisa dos bytes crus. **Nenhuma das tres tabelas de T002 tem coluna
 * serializada**: a de BC-02 e `termmeta.meta_value` (`DB-SER`, BR-MIGRAR-082), que
 * nao e uma das tres. Quem portar `termmeta` acrescenta a funcao na tarefa dela.
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

export function primeiraLinha(
  linhas: readonly LinhaDeResultado[],
): LinhaDeResultado | null {
  return linhas.length === 0 ? null : (linhas[0] as LinhaDeResultado);
}

/**
 * O primeiro valor da primeira linha, **pela posicao e nao pelo nome**.
 *
 * E o `get_var()` do legado (`wp-includes/class-wpdb.php`), e e por posicao
 * porque duas consultas desta feature nao dao nome a coluna:
 * `SELECT COUNT(*) FROM $wpdb->term_taxonomy WHERE term_id = %d`
 * (`wp-includes/taxonomy.php:2214`) e
 * `SELECT MAX(term_group) FROM $wpdb->terms` (`:2537`). Depender do nome
 * obrigaria a trocar a cadeia por `COUNT(*) AS algo`, e a cadeia enviada e o que
 * o slot `persistencia` do plano manda poder ser *"a MESMA string que o legado
 * envia"*.
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
