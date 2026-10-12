/**
 * A trava do disparo como **valor**: a chave de 22 casas, a leitura dela e as
 * duas decisoes que o legado toma com ela — parte da entrega de **T002**.
 *
 * *satisfaz:* — (infraestrutura).
 *
 * Os dois numeros moram em `../configuracao/trava-da-fila.ts`, que e o ponto de
 * configuracao nomeado que o **P6** cobra. Aqui esta o que nao e numero: a forma
 * textual da chave, a conversao do que foi lido e a composicao das duas
 * decisoes — porque no legado elas sao **duas**, com aritmetica diferente, e
 * unifica-las apaga comportamento.
 *
 * ## A trava e identidade TEXTUAL, e isso decide quem executa
 *
 * A trava nao e comparada como numero em lugar nenhum do caminho de execucao:
 * ela e comparada como texto, com `!==` e `===`
 * (`wp-cron.php:113`, `:194`, `:201`). O valor gravado e
 * `sprintf( '%.22F', microtime( true ) )` (`wp-cron.php:101`,
 * `wp-includes/cron.php:942` e `:958`), isto e **22 casas decimais**, e e essa
 * cadeia que tem de bater byte a byte entre quem tomou a trava e quem a confere.
 *
 * `wp-includes/cron.php:973` chama a chave pelo nome na documentacao do ponto de
 * extensao `cron_request`: *"The Unix timestamp (UTC) of the cron lock with
 * microseconds"*. Ela viaja na URL do disparo
 * (`add_query_arg( 'doing_wp_cron', $doing_wp_cron, ... )`, `:961`) e volta pelo
 * parametro de consulta (`wp-cron.php:105`) — logo a formatacao e **contrato
 * entre dois processos**, nao detalhe interno.
 *
 * ## As 22 casas: medidas contra o oraculo, nao supostas
 *
 * `porta-de-relogio.ts` registrou em T001 a pergunta que T001 nao respondia:
 * *"quantas casas significativas o relogio deste runtime oferece nao e o que
 * `microtime()` oferece ... quem escrever o adaptador confere a formatacao contra
 * o oraculo antes de afirmar paridade"*. A metade da pergunta que e **formatacao**
 * esta conferida, no oraculo executavel da resposta 16 (`scripts/oraculo`, PHP
 * 8.3), com `sprintf( '%.22F', $v )` contra `Number.prototype.toFixed( 22 )`:
 *
 * | valor | `sprintf( '%.22F' )` no oraculo | `toFixed( 22 )` neste runtime |
 * |---|---|---|
 * | `1700000000.123456` | `1700000000.1234560012817382812500` | **igual** |
 * | `1700000000` | `1700000000.0000000000000000000000` | **igual** |
 * | `1700000000.5` | `1700000000.5000000000000000000000` | **igual** |
 * | `0.1` | `0.1000000000000000055511` | **igual** |
 * | `1.0E-7` | `0.0000001000000000000000` | **igual** |
 *
 * As duas formatacoes imprimem a expansao decimal do mesmo `double`, arredondada
 * na 22a casa, e e por isso que coincidem — `%.22F` nao e sensivel a locale (e o
 * `F` maiusculo que garante isso) e `toFixed` e exato por especificacao para ate
 * 100 casas. A metade da pergunta que continua **aberta** e a outra: *quantas
 * casas o relogio informa*. `microtime( true )` tem resolucao de microssegundo;
 * o que a porta deste modulo devolve depende do adaptador, e duas chaves iguais
 * porque o relogio truncou sao duas chaves que se confundem. Isso e do adaptador
 * (feature `015`), e continua registrado.
 *
 * ⚠️ `toFixed` muda de forma acima de `1e21` (passa a notacao exponencial, pela
 * regra de `ToString`). Instante Unix nao chega perto, e o legado tambem nao
 * trata o caso.
 */

import {
  TRAVA_DA_FILA_DE_FABRICA,
  travaBloqueiaNovoDisparo,
  travaDepoisDoDescarteDeAdiantada,
  type TravaDaFila,
} from '../configuracao/index.js';

/** As casas decimais da chave da trava: o `22` de `'%.22F'`. */
export const CASAS_DECIMAIS_DA_CHAVE_DA_TRAVA = 22;

/**
 * O que a trava guardada informa.
 *
 * A distincao entre ausencia e valor e do legado, nao conforto de tipo, e os dois
 * ramos de ausencia tambem: `_get_cron_lock()` nasce com `$value = 0` e devolve
 * esse `0` quando a linha nao existe (`wp-cron.php:67` e `:81`), enquanto no ramo
 * de cache externo ele devolve o que `wp_cache_get()` devolveu, que e `false` na
 * falta (`wp-cron.php:73`, `wp-includes/cache.php:151`). Nenhum dos dois e
 * identico a chave alguma, logo a diferenca nao muda a comparacao de `:194`; ela
 * fica declarada porque **e** a forma do legado, e porque `(float) false` e
 * `(float) 0` sao o mesmo zero que a aritmetica da trava usa.
 */
export type TravaLida =
  | { readonly presente: true; readonly chave: string }
  | { readonly presente: false; readonly valorDoLegado: 0 | false };

/** A ausencia, na forma em que `_get_cron_lock()` a devolve sem cache externo. */
export const TRAVA_AUSENTE_SEM_CACHE: TravaLida = Object.freeze({
  presente: false,
  valorDoLegado: 0,
});

/** A ausencia, na forma em que uma leitura por cache a devolve. */
export const TRAVA_AUSENTE_NO_CACHE: TravaLida = Object.freeze({
  presente: false,
  valorDoLegado: false,
});

/**
 * A chave da trava para um instante: o `sprintf( '%.22F', microtime( true ) )` do
 * legado (`wp-cron.php:101`, `wp-includes/cron.php:942` e `:958`).
 */
export function chaveDaTrava(instanteEmSegundosFracionarios: number): string {
  return instanteEmSegundosFracionarios.toFixed(
    CASAS_DECIMAIS_DA_CHAVE_DA_TRAVA,
  );
}

/**
 * Duas chaves de trava sao a mesma? — o `===` de `wp-cron.php:201`, e o `!==` de
 * `:113` e `:194` pela negativa.
 *
 * Comparacao de **texto**, e e ela que esta no legado: um porte que comparasse os
 * numeros daria por iguais duas chaves que diferem na 17a casa, e e justamente
 * nessa casa que dois processos se distinguem.
 */
export function mesmaChaveDeTrava(aqui: TravaLida, chave: string): boolean {
  return aqui.presente && aqui.chave === chave;
}

/**
 * `if ( $valor )` do PHP para o valor lido da trava — a guarda de
 * `wp-cron.php:98`.
 *
 * A trava e texto, e os unicos textos falsos no PHP sao o vazio e o de um byte
 * `0x30`. A tabela completa esta em `contextos/midia/armazenamento/verdade-de-php.ts`
 * e em `contextos/conteudo/gravacao/verdade-de-php.ts`; **a repeticao e
 * obrigatoria, nao descuido** — a regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e quando `plataforma/utilitarios/` existir as copias
 * descem juntas sem nenhuma chamada mudar de resultado. Esta copia atende
 * {@link TravaLida}, que e a forma que a borda desta feature traz.
 *
 * Ausencia e falsa nos dois ramos: `0` e `false` sao os dois falsos.
 */
export function travaEhVerdadeiraNoPhp(lida: TravaLida): boolean {
  if (!lida.presente) {
    return false;
  }
  return lida.chave !== '' && lida.chave !== '0';
}

/**
 * A trava como numero: o `(float)` do PHP sobre o que foi lido
 * (`wp-includes/cron.php:915`).
 *
 * `(float)` de texto no PHP le o **prefixo numerico** e ignora o resto, sem
 * lancar; texto sem prefixo numerico vale zero. Conferido no oraculo:
 *
 * | valor | `(float)` no oraculo |
 * |---|---|
 * | `"1700000000.1234567165374755859375"` | `1700000000.1234567` |
 * | `false` | `0` |
 * | `""` | `0` |
 * | `"abc"` | `0` |
 * | `"12abc"` | `12` |
 * | `"1e3"` | `1000` |
 * | `" 7"` | `7` |
 *
 * `Number.parseFloat` deste runtime faz a mesma leitura de prefixo — inclusive o
 * espaco a esquerda e a notacao exponencial — e devolve `NaN` onde o PHP devolve
 * zero; e so esse caso que a funcao traduz. Note que `Number( texto )` **nao**
 * serviria: ele recusa a cadeia inteira em `"12abc"`, onde o PHP devolve 12.
 */
export function travaComoDecimalDoPhp(lida: TravaLida): number {
  if (!lida.presente) {
    return 0;
  }
  const numero = Number.parseFloat(lida.chave);
  return Number.isNaN(numero) ? 0 : numero;
}

/**
 * Se a trava guardada impede **emitir** um novo disparo — as linhas `:915`-`:924`
 * de `wp-includes/cron.php`, na ordem em que elas acontecem.
 *
 * ```php
 * $lock = (float) get_transient( 'doing_cron' );
 *
 * if ( $lock > $gmt_time + 10 * MINUTE_IN_SECONDS ) {
 *     $lock = 0;
 * }
 *
 * // Don't run if another process is currently running it or more than once every 60 sec.
 * if ( $lock + WP_CRON_LOCK_TIMEOUT > $gmt_time ) {
 *     return false;
 * }
 * ```
 *
 * **Esta funcao nao dispara nada, e isso e deliberado.** Emitir o disparo e
 * `spawn_cron()` inteiro, que e **T003** (US-1) e esta no conflito aberto que
 * `spec.md` registra: CA-1.2 exige que o gatilho **nao** seja a requisicao do
 * proprio site para si mesmo, e a resposta 10 de `questions.md` manda manter
 * exatamente isso. O que T002 entrega e a trava — o freio —, que e a parte que
 * sobrevive aos dois lados da decisao: os dois lados precisam dela, e `plan.md`
 * diz isso por escrito (*"a trava de concorrencia (REQ-123) e a parte que
 * sobrevive aos dois lados da decisao"*).
 */
export function travaImpedeEmitirDisparo(
  lida: TravaLida,
  agoraEmSegundosFracionarios: number,
  trava: TravaDaFila = TRAVA_DA_FILA_DE_FABRICA,
): boolean {
  const comDescarte = travaDepoisDoDescarteDeAdiantada(
    travaComoDecimalDoPhp(lida),
    agoraEmSegundosFracionarios,
    trava,
  );
  return travaBloqueiaNovoDisparo(
    comDescarte,
    agoraEmSegundosFracionarios,
    trava,
  );
}

/**
 * Se a trava guardada impede **tomar** a trava no endpoint da fila — a linha
 * `wp-cron.php:98`.
 *
 * ```php
 * // Called from external script/job. Try setting a lock.
 * if ( $doing_cron_transient && ( $doing_cron_transient + WP_CRON_LOCK_TIMEOUT > $gmt_time ) ) {
 *     return;
 * }
 * ```
 *
 * 🔴 **Nao e a mesma conta de {@link travaImpedeEmitirDisparo}, e as duas
 * diferencas sao observaveis:**
 *
 * 1. **nao ha descarte de trava adiantada.** Uma trava gravada com meia hora de
 *    adiantamento libera o emissor (que a descarta) e continua travando o
 *    endpoint (que nao a descarta) — em `wp-cron.php` ela so deixa de travar
 *    quando o relogio a alcanca;
 * 2. **a guarda e a verdade do PHP sobre o TEXTO**, nao a conversao para numero.
 *    A trava gravada como `'0'` ou `''` e falsa aqui e passa; em
 *    `wp-includes/cron.php:915` ela vale zero e tambem passa — neste par as duas
 *    coincidem, e e a soma seguinte (`texto + 60`, com coercao numerica do PHP)
 *    que torna o resto equivalente.
 *
 * Esta funcao e chamada no caminho de **execucao** (T003/T005); T002 a declara
 * junto com a outra para que ninguem as unifique mais tarde "porque sao a mesma
 * trava".
 */
export function travaImpedeTomarNoEndpoint(
  lida: TravaLida,
  agoraEmSegundosFracionarios: number,
  trava: TravaDaFila = TRAVA_DA_FILA_DE_FABRICA,
): boolean {
  if (!travaEhVerdadeiraNoPhp(lida)) {
    return false;
  }
  return travaBloqueiaNovoDisparo(
    travaComoDecimalDoPhp(lida),
    agoraEmSegundosFracionarios,
    trava,
  );
}
