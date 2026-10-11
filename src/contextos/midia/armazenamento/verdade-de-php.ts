/**
 * A verdade de PHP de um valor serializado, numa funcao nomeada.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`. Existe por uma razao
 * de uma linha: **`wp_update_attachment_metadata()` decide entre gravar e
 * APAGAR a linha de metadado com um `if ( $data )`**
 * (`wp-includes/post.php:7174`), e `$data` ali e um arranjo — e **arranjo vazio
 * e falso no PHP**. Logo gravar metadado vazio **apaga** a chave
 * `_wp_attachment_metadata` em vez de gravar `a:0:{}`, e isso e efeito no banco
 * (area 3 da Decisao 2 de `parity_specs.md`).
 *
 * | valor | verdade do PHP | `Boolean(valor)` deste runtime |
 * |---|---|---|
 * | `array()` | **falso** | **verdadeiro** — DIVERGE |
 * | `''` | falso | falso — igual |
 * | `'0'` | **falso** | **verdadeiro** — DIVERGE |
 * | `'0.0'` | verdadeiro | verdadeiro — igual |
 * | `0` / `0.0` | falso | falso — igual |
 * | `null` | falso | falso — igual |
 *
 * As duas linhas que DIVERGEM sao alcancaveis por aqui: a do arranjo vazio pelo
 * caminho acima, e a do `'0'` por `update_attached_file()`, que decide entre
 * gravar e apagar `_wp_attached_file` com `if ( $file )`
 * (`wp-includes/post.php:901`) — um caminho relativo que seja a cadeia `'0'`
 * apaga a chave em vez de gravar.
 *
 * **Por que nao reusar o gemeo de BC-01.** `contextos/conteudo/gravacao/verdade-de-php.ts`
 * ja declara a mesma regra, com a mesma justificativa (P1). A regra de
 * dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 * `contextos/<b>/` *"sempre, sem excecao"*, logo o reuso teria de descer para
 * `plataforma/` — e o cabecalho do gemeo ja registra o destino: quando
 * `plataforma/utilitarios/` existir (regra de dependencia 5: *"funcao pura mora
 * em `utilitarios/`"*), as duas descem juntas e nenhuma chamada muda de
 * resultado. O gemeo de BC-01 aceita `string | number | undefined`, que e o que
 * o pedido de gravacao de conteudo traz; este aceita {@link ValorPhp}, que e o
 * que a coluna de metadado traz.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';

/**
 * `if ( $valor )` do PHP, para um valor lido ou pronto para gravar na coluna.
 *
 * Texto compara em bytes porque o valor da coluna e cadeia de bytes, nao cadeia
 * de caracteres (ver `plataforma/serializacao/valor-php.ts`): os unicos dois
 * textos falsos sao o vazio e o de um byte `0x30`.
 */
export function verdadeiroComoNoPhp(valor: ValorPhp): boolean {
  switch (valor.tipo) {
    case 'nulo':
      return false;
    case 'booleano':
      return valor.valor;
    case 'inteiro':
    case 'decimal':
      return valor.valor !== 0;
    case 'texto':
      return textoVerdadeiro(valor.valor);
    case 'arranjo':
      return valor.entradas.length > 0;
  }
}

function textoVerdadeiro(valor: string | Uint8Array): boolean {
  if (typeof valor === 'string') {
    return valor !== '' && valor !== '0';
  }
  if (valor.length === 0) {
    return false;
  }
  return !(valor.length === 1 && valor[0] === 0x30);
}
