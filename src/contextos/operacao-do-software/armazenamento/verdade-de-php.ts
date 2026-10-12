/**
 * A verdade de PHP de um valor lido do banco, numa funcao nomeada.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`. Existe porque
 * **tres decisoes desta feature sao tomadas com a verdade de PHP de um valor de
 * opcao, e nao com a forma dele**:
 *
 * 1. `if ( $failure_data )` decide se o registro de falha e consultado
 *    (`wp-admin/includes/class-core-upgrader.php:325`). Registro gravado como
 *    arranjo vazio seria **falso** e o portao nao olharia nada.
 * 2. `! empty( $failure_data['critical'] )` decide o **congelamento** de `A5`
 *    (`class-core-upgrader.php:327`, e `wp-admin/includes/update.php:868` para o
 *    aviso da tela). A chave vale `true` quando gravada, logo o que esta funcao
 *    cobre e o caso em que ela **nao** esta: registro nao critico nao tem a
 *    chave, e a ausencia e falsa.
 * 3. `! get_site_option( 'auto_core_update_failed' )` decide se a falha
 *    transitoria ganha a segunda chance de `A6`
 *    (`class-wp-automatic-updater.php:856`) — e opcao ausente e opcao gravada
 *    com valor falso dao **o mesmo resultado** ali.
 *
 * E a quarta, na recuperacao: `if ( ! $last_sent || time() > $last_sent + $rate_limit )`
 * (`wp-includes/class-wp-recovery-mode-email-service.php:57`) decide o aviso
 * diario de `A10` com a verdade de `recovery_mode_email_last_sent`. Um marcador
 * gravado com instante `0` e **falso**, e o aviso sai como se nunca tivesse
 * saido.
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
 * **Por que nao reusar o gemeo de BC-06.** `contextos/midia/armazenamento/verdade-de-php.ts`
 * declara a mesma regra, com a mesma justificativa (P1), para outro caminho. A
 * regra de dependencia 3 de `target_architecture.md` proibe `contextos/<a>/`
 * importar `contextos/<b>/` *"sempre, sem excecao"*, logo o reuso teria de
 * descer para `plataforma/utilitarios/` (regra de dependencia 5: *"funcao pura
 * mora em `utilitarios/`"*), pasta que ainda nao existe nesta arvore. Quando
 * existir, as duas descem juntas e nenhuma chamada muda de resultado.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';

/**
 * `if ( $valor )` do PHP, para um valor lido da coluna ou pronto para gravar.
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
