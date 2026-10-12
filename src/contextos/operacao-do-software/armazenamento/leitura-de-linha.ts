/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`.
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (Decisao 2 de
 * `parity_specs.md`) se aplica.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado — *"escrita invalida nao falha, ela se
 * degrada"* —, e nesta feature isso tem um caso com nome: o registro de falha
 * critica e lido por `! empty( $failed['critical'] )` e por
 * `isset( $failed['attempted'] )` (`wp-admin/includes/update.php:868` e `:869`),
 * nunca por validacao de forma. Um registro truncado continua sendo lido.
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-01, BC-02,
 * BC-05 e BC-06, e a repeticao e obrigatoria, nao descuido.** A regra de
 * dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 * `contextos/<b>/` *"sempre, sem excecao"*, e o tipo de coluna vem da porta de
 * cada contexto. Um helper compartilhado teria de descer para `plataforma/`, e
 * e o mesmo preco que `portas/porta-de-dados.ts` declara ao redeclarar a porta.
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

/** O valor da coluna como esta, sem interpretacao: o que o codec vai ler. */
export function comoBruto(valor: ValorDeColuna | undefined): ValorDeColuna {
  return valor === undefined ? null : valor;
}

/**
 * A primeira linha, ou `null`.
 *
 * E o `get_row()` do legado, e a distincao importa: `get_option()` usa
 * `get_row()` e nao `get_var()` **de proposito**, com o comentario no codigo —
 * *"Has to be get_row() instead of get_var() because of funkiness with 0,
 * false, null values"* (`wp-includes/option.php:208`). O que decide se a opcao
 * existe e **a linha ter voltado**, nao o valor dela ser util: uma opcao
 * gravada com cadeia vazia **existe**, e `opcao.ts` depende disso para escolher
 * entre `INSERT` e `UPDATE`.
 */
export function primeiraLinha(
  linhas: readonly LinhaDeResultado[],
): LinhaDeResultado | null {
  return linhas.length === 0 ? null : (linhas[0] as LinhaDeResultado);
}
