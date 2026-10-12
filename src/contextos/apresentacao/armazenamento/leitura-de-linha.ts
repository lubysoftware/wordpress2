/**
 * Leitura de coluna, com a tolerancia que a borda exige e nenhuma a mais.
 *
 * Entrega de **T002** da feature `009-apresentacao-e-personalizacao`.
 *
 * O driver pode devolver a mesma coluna como texto, como numero ou como bytes,
 * conforme o tipo e o tamanho. Normalizar isso **na leitura** e diferente de
 * normalizar o dado: o byte gravado continua sendo o que foi gravado, e e sobre
 * ele que o criterio de paridade *"efeito no banco"* (Decisao 2 de
 * `parity_specs.md`, area 3) se aplica. Nesta feature a area 3 e nomeada por
 * `LACUNA-IN-12`: *"trocar o tema ativo **escreve opcao** — e area 3"*.
 *
 * ⚠️ **`option_value` e `longtext NOT NULL` e carrega estrutura serializada**
 * (`target_data_model.md`, DDL de `{p}options`), logo ela e lida por
 * {@link comoBruto} e nao por {@link comoTexto}: quem a interpreta e o *codec*
 * de `plataforma/serializacao`, que trabalha em bytes porque o formato de
 * origem guarda cadeia de bytes e nao cadeia de caracteres. Decodificar antes
 * do *codec* perderia o byte que nenhuma decodificacao recupera.
 *
 * O que estas funcoes **nao** fazem: validar. `DB-DEG` (BR-MIGRAR-083) manda
 * reproduzir a degradacao do legado — *"escrita invalida nao falha, ela se
 * degrada"* —, logo nenhuma leitura daqui recusa linha por tamanho, formato ou
 * dominio. Uma linha de `customize_changeset` com `post_status = 'publish'` e
 * `post_content` que nao e JSON e lida como qualquer outra: a recusa do estado
 * e da escrita (`class-wp-customize-manager.php:2479`) e a do JSON invalido e
 * um erro nomeado de leitura (`:1141`), nao uma guarda de coluna.
 *
 * **Este arquivo repete `armazenamento/leitura-de-linha.ts` de BC-01, BC-03,
 * BC-04 e BC-05, e a repeticao e obrigatoria, nao descuido.** A regra de
 * dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 * `contextos/<b>/` *"sempre, sem excecao"*, e o tipo de coluna vem da porta de
 * cada contexto. Um helper compartilhado teria de descer para `plataforma/`, e
 * e a feature `015` (T007) que decide isso. E o mesmo preco que
 * `portas/porta-de-dados.ts` declara ao redeclarar a porta.
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

/** O valor da coluna como esta, sem interpretacao: o que o *codec* vai ler. */
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
 * E o `get_var()` do legado (`wp-includes/class-wpdb.php`), e e ele que
 * `update_option()` usa para reler a carga automatica
 * (`wp-includes/option.php:953`). Por posicao porque a cadeia enviada e o que o
 * slot `persistencia` do plano manda poder ser *"a MESMA string que o legado
 * envia"*: depender do nome obrigaria a reescrever a consulta.
 *
 * ⚠️ `get_option()` **nao** usa `get_var()`, e o proprio legado explica por que
 * num comentario (`wp-includes/option.php:208`): *"Has to be get_row() instead
 * of get_var() because of funkiness with 0, false, null values"*. Linha ausente
 * e linha com valor vazio sao dois estados diferentes, e e essa distincao que
 * `get_theme_mods()` consome — ver `opcao.ts`.
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
