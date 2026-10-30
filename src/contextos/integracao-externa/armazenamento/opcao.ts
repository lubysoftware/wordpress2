/**
 * A leitura de opcao nomeada que a precedencia de credencial consome.
 *
 * Entrega de **T007** (US-3). E o `get_option()` do legado no recorte que
 * `wp-includes/connectors.php` usa: ler **uma** opcao pelo nome, com o valor
 * depois de `maybe_unserialize()`.
 *
 * ⚠️ **Isto nao e o registro de opcoes do alvo.** `target_architecture.md`
 * atribui `REG-Opcao` a `plataforma/opcoes/`, que **nao existe nesta arvore** —
 * BC-11 registrou a mesma ausencia em `operacao-do-software/armazenamento/opcao.ts`
 * e fez o mesmo recorte. Quando `plataforma/opcoes/` nascer, este arquivo e o que
 * desce, e nenhum chamador de `../credencial/` muda.
 *
 * ── O QUE ESTA AQUI DO `get_option()` ──────────────────────────────────────
 *
 * 1. **O nome e aparado, e nome vazio devolve `false` SEM ir ao banco**
 *    (`wp-includes/option.php:81` a `:87`). Esta aqui, e nao no registro, porque
 *    muda o resultado da precedencia: `_wp_connectors_get_api_key_source()`
 *    compara o valor lido com `''` (`connectors.php:463`), e `false` **nao e**
 *    `''` — logo um nome de opcao que apara para vazio, ou que e `'0'` (que o
 *    `empty()` do PHP tambem recusa), responde **`'database'`** sem consulta
 *    nenhuma. O registro de conectores so exige nome nao vazio
 *    (`class-wp-connector-registry.php:238`), e nao apara, logo o caso e
 *    alcancavel por quem registrar um conector. Reproduzido como
 *    {@link OPCAO_COM_NOME_RECUSADO}.
 * 2. **Um `SELECT`, e a linha decide se a opcao existe**
 *    (`wp-includes/option.php:206`). Com o cache de objeto desligado — que e o
 *    que o `Contexto:` de `PT-017` exige nas duas metades — e uma ida ao banco,
 *    o mesmo recorte de BC-11.
 *
 * ── O QUE NAO ESTA AQUI, E DE QUEM E ───────────────────────────────────────
 *
 * - **Os pontos de extensao de opcao** (`pre_option_{$option}`, `pre_option`,
 *   `default_option_{$option}`, `option_{$option}` — `option.php:132`, `:150`,
 *   `:199` e `:256`). Pertencem a `REG-Opcao`, e o P2 os preserva no modulo que os
 *   emite. Declara-los aqui criaria ponto de extensao com dois donos.
 * - **O redirecionamento das duas chaves obsoletas** (`blacklist_keys` e
 *   `comment_whitelist`, `option.php:93`), com o `_deprecated_argument()`. E do
 *   registro, e nenhum conector do nucleo tem opcao com esses nomes.
 * - **`alloptions` e `notoptions`**: caminhos de cache, que com o cache
 *   desligado viram a mesma ida ao banco.
 */

import {
  talvezDesserializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { PortaDeDados, ValorDeColuna } from '../portas/index.js';

/**
 * O resultado de uma leitura de opcao, com os TRES desfechos do legado.
 *
 * - `existe: true` — a linha voltou, e o valor e o da coluna desserializado.
 * - `existe: false` — a linha nao voltou; o legado devolve o default do
 *   chamador, e cada chamador de `../credencial/` aplica o seu (`''` em
 *   `connectors.php:462`, `array()` em `:570`).
 * - `nomeRecusado: true` — o nome aparou para vazio; o legado devolve `false`
 *   **ignorando o default** e sem consulta (ver o cabecalho).
 */
export type LeituraDeOpcao =
  | { readonly existe: true; readonly valor: ValorPhp }
  | { readonly existe: false; readonly nomeRecusado: false }
  | { readonly existe: false; readonly nomeRecusado: true };

export const OPCAO_AUSENTE: LeituraDeOpcao = {
  existe: false,
  nomeRecusado: false,
};

export const OPCAO_COM_NOME_RECUSADO: LeituraDeOpcao = {
  existe: false,
  nomeRecusado: true,
};

/** `{site}options` — por site. */
export function tabelaDeOpcoes(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}options`;
}

/**
 * Os caracteres que o `trim()` do PHP remove sem segundo argumento: espaco,
 * tabulacao, nova linha, retorno, NUL e tabulacao vertical. `String.prototype.trim`
 * remove outro conjunto (inclui espacos Unicode e nao inclui NUL), e a diferenca
 * e observavel no nome da opcao e na credencial `usuario:senha`.
 */
const BRANCOS_DO_TRIM_DO_PHP = ' \t\n\r\0\x0B';

/** `trim()` do PHP, sem segundo argumento. */
export function aparaComoPhp(valor: string): string {
  let inicio = 0;
  let fim = valor.length;
  while (inicio < fim && BRANCOS_DO_TRIM_DO_PHP.includes(valor[inicio] as string)) {
    inicio += 1;
  }
  while (fim > inicio && BRANCOS_DO_TRIM_DO_PHP.includes(valor[fim - 1] as string)) {
    fim -= 1;
  }
  return valor.slice(inicio, fim);
}

/** O valor lido da coluna, depois de `maybe_unserialize()`. */
function valorDaOpcao(valor: ValorDeColuna | undefined): ValorPhp {
  if (valor === null || valor === undefined) {
    return { tipo: 'nulo' };
  }
  if (typeof valor === 'number') {
    return talvezDesserializar(String(valor));
  }
  return talvezDesserializar(valor);
}

/** `get_option()` no recorte do cabecalho. */
export function lerOpcao(dados: PortaDeDados, nome: string): LeituraDeOpcao {
  const aparado = aparaComoPhp(nome);
  // `empty()` do PHP sobre cadeia: verdadeiro para '' e para '0'.
  if (aparado === '' || aparado === '0') {
    return OPCAO_COM_NOME_RECUSADO;
  }

  const linhas = dados.selecionar({
    texto: `SELECT option_value FROM ${tabelaDeOpcoes(dados)} WHERE option_name = ? LIMIT 1`,
    parametros: [aparado],
  });
  const linha = linhas[0];
  if (linha === undefined) {
    return OPCAO_AUSENTE;
  }
  return { existe: true, valor: valorDaOpcao(linha['option_value']) };
}
