/**
 * A morada da trava do disparo: um transiente chamado `doing_cron`, que mora no
 * cache de objeto **ou** na tabela de opcoes. Entrega de **T002**.
 *
 * *satisfaz:* — (infraestrutura).
 *
 * Os numeros da trava estao em `../configuracao/trava-da-fila.ts` e a semantica
 * do valor em `../fila/trava-do-disparo.ts`. Aqui estao as quatro operacoes que o
 * legado faz com ela, e **so elas**:
 *
 * | operacao | o legado | ancora |
 * |---|---|---|
 * | ler desviando do cache | `_get_cron_lock()` | `wp-cron.php:64`-`82` |
 * | ler normalmente | `get_transient( 'doing_cron' )` | `wp-includes/option.php:1431`, chamado em `wp-cron.php:92` e `wp-includes/cron.php:915` |
 * | tomar | `set_transient( 'doing_cron', $chave )` | `wp-includes/option.php:1509`, chamado em `wp-includes/cron.php:943` e `:959`, `wp-cron.php:103` |
 * | liberar | `delete_transient( 'doing_cron' )` | `wp-includes/option.php:1380`, chamado em `wp-cron.php:202` |
 *
 * **Ela nao oferece "gravar se ausente"**, e a ausencia e deliberada:
 * `../portas/porta-de-cache.ts` ja registrou por que — *"oferecer seria entregar
 * exclusao real embrulhada em porta e deixar a divergencia passar sem decisao
 * humana"*. O risco 3 de `plan.md` e explicito: *"a trava nao e trava: e marcacao
 * otimista com prazo ... um evento que hoje roda duas vezes passa a rodar uma, e
 * isso e observavel"*. REQ-123 (US-2, **T005**) pede exclusao real; quem pegar
 * T005 le o risco 3 antes da primeira linha.
 *
 * ## As duas leituras sao DUAS, e a diferenca decide quem executa
 *
 * `_get_cron_lock()` nao usa `get_transient()`: ele le a trava **crua**, e em
 * cada ramo faz questao de passar por fora do cache de leitura. O comentario do
 * legado diz para que (`wp-cron.php:69`-`73`): *"Skip local cache and force
 * re-fetch of doing_cron transient in case another process updated the cache"*.
 *
 * - **com cache externo**, `wp_cache_get( 'doing_cron', 'transient', true )` — o
 *   terceiro argumento e `$force`;
 * - **sem cache externo**, uma consulta escrita a mao (`wp-cron.php:75`):
 *
 * ```php
 * $row = $wpdb->get_row( $wpdb->prepare(
 *     "SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1",
 *     '_transient_doing_cron'
 * ) );
 * ```
 *
 * O texto e reproduzido como esta, com o `LIMIT 1` e com o nome da linha
 * literal: `porta-de-dados.ts` registrou em T001 que *"o texto precisa poder ser
 * a MESMA string que o legado envia"* e que trocar por uma leitura "melhor" —
 * pelo cache, ou sem o `LIMIT` — muda exatamente o que o comentario do legado diz
 * estar evitando.
 *
 * ## O ramo do cache e observavel, e nao e decidido aqui
 *
 * `get_transient()`, `set_transient()` e `delete_transient()` abrem todos com a
 * mesma condicao (`wp-includes/option.php:1455`, `:1541`, `:1393`):
 *
 * ```php
 * if ( wp_using_ext_object_cache() || wp_installing() ) { ... cache ... }
 * else { ... a linha `_transient_` da tabela de opcoes ... }
 * ```
 *
 * A primeira metade chega por {@link PortaDeCache.externo}, que e fato da borda.
 * 🔴 **A segunda metade — `wp_installing()` — nao esta reproduzida aqui**, e a
 * ausencia e declarada e nao esquecida: nao existe instalador nesta arvore (o
 * arranque e a instalacao sao `015` e `010`), e inventar uma bandeira de
 * instalacao neste modulo seria declarar estado que o pacote nao deu a ele. A
 * consequencia e estreita e vale escrita: **durante a instalacao**, o legado
 * guarda a trava no cache de objeto mesmo sem cache externo. Quem construir o
 * arranque fecha isto passando o fato pela porta.
 *
 * ## O prazo: esta feature grava a trava SEM validade
 *
 * `set_transient( 'doing_cron', $doing_wp_cron )` e chamado **sem** o terceiro
 * argumento, logo `$expiration` e `0` — e a trava **nunca expira**. Os 60
 * segundos sao aritmetica feita na leitura, nao prazo de armazenamento. Duas
 * consequencias que esta porta reproduz:
 *
 * 1. no ramo de banco, a linha e gravada com carregamento automatico **ligado** e
 *    **nenhuma** linha de prazo (`wp-includes/option.php:1548`-`1554`);
 * 2. no ramo de cache, `wp_cache_set( ..., 0 )`, que e sem validade (`:1542`).
 *
 * E e por isso que a trava sobrevive a quem a tomou no caminho em que a execucao
 * e abandonada (`wp-cron.php:194`-`195`), que e o caminho que `plan.md` chama de
 * *"marcacao otimista com prazo"*.
 */

import {
  TRAVA_AUSENTE_NO_CACHE,
  TRAVA_AUSENTE_SEM_CACHE,
  type TravaLida,
} from '../fila/trava-do-disparo.js';
import type { PortaDeCache, PortaDeDados } from '../portas/index.js';
import {
  CARREGAMENTO_AUTOMATICO_LIGADO,
  GRUPO_DE_TRANSIENTE,
  NOME_DA_TRAVA,
  OPCAO_DA_TRAVA,
  OPCAO_DE_PRAZO_DA_TRAVA,
  tabelaDeOpcoes,
} from './chaves-e-tabelas.js';
import { comoTexto, mesmosBytes, primeiraLinha } from './leitura-de-linha.js';

/**
 * A validade com que esta feature grava a trava: **zero**, que e sem validade.
 *
 * Declarada como constante para que ninguem a confunda com os 60 segundos: sao
 * numeros de lugares diferentes, e os 60 segundos nunca chegam a borda do cache.
 */
export const SEM_VALIDADE = 0;

export interface RepositorioDaTrava {
  /**
   * `_get_cron_lock()` — a leitura que **desvia do cache** (`wp-cron.php:64`).
   *
   * E esta que decide, no legado, se a execucao continua: `:194` e `:201` a
   * chamam de novo depois de cada evento, porque a trava pode ter trocado de dono
   * no meio.
   */
  obterSemCache(): TravaLida;
  /** `get_transient( 'doing_cron' )` — a leitura normal (`wp-cron.php:92`). */
  obter(): TravaLida;
  /**
   * `set_transient( 'doing_cron', $chave )`, sem validade.
   *
   * Devolve se chegou a escrever. **Falso quando a chave gravada e a mesma**: a
   * recusa de `update_option()` a valor igual (`wp-includes/option.php:923`)
   * alcanca este caminho, e um processo que tenta tomar a trava que ja e dele nao
   * emite comando nenhum.
   */
  tomar(chave: string): boolean;
  /**
   * `delete_transient( 'doing_cron' )` (`wp-cron.php:202`).
   *
   * No legado a chamada **so acontece** se a trava ainda for a mesma (`:201`); a
   * condicao e de quem portar a execucao (**T003** e **T005**), e esta porta
   * apenas apaga.
   */
  liberar(): boolean;
}

export function criarRepositorioDaTrava(
  dados: PortaDeDados,
  cache: PortaDeCache,
): RepositorioDaTrava {
  const tabela = tabelaDeOpcoes(dados);

  /**
   * A linha da trava, pelo texto que o legado envia.
   *
   * O mesmo texto serve as duas leituras: `_get_cron_lock()` o escreve a mao com
   * `LIMIT 1` (`wp-cron.php:75`) e `get_option()` monta o mesmo
   * (`wp-includes/option.php:206`). Devolve `null` quando nao ha linha.
   */
  function lerLinhaDaTrava(): string | null {
    const linha = primeiraLinha(
      dados.selecionar({
        texto: `SELECT option_value FROM ${tabela} WHERE option_name = ? LIMIT 1`,
        parametros: [OPCAO_DA_TRAVA],
      }),
    );
    if (linha === null) {
      return null;
    }
    const valor = linha['option_value'];
    // `is_object( $row )` (`wp-cron.php:76`): a linha existir basta, e o valor
    // dela vai como esta — inclusive vazio.
    return valor === undefined ? '' : comoTexto(valor);
  }

  function lerDoCache(forcar: boolean): TravaLida {
    const lido = cache.obter(NOME_DA_TRAVA, GRUPO_DE_TRANSIENTE, forcar);
    return lido.encontrado
      ? { presente: true, chave: lido.valor }
      : TRAVA_AUSENTE_NO_CACHE;
  }

  return {
    obterSemCache() {
      if (cache.externo) {
        // O terceiro argumento e `$force`, e o legado passa VERDADEIRO
        // (`wp-cron.php:73`): e assim que ele enxerga a trava que outro processo
        // tomou dentro da mesma requisicao.
        return lerDoCache(true);
      }
      const gravada = lerLinhaDaTrava();
      return gravada === null
        ? TRAVA_AUSENTE_SEM_CACHE
        : { presente: true, chave: gravada };
    },

    obter() {
      if (cache.externo) {
        return lerDoCache(false);
      }
      // 🔴 O ramo do prazo de `get_transient()` (`wp-includes/option.php:1459`-
      // `1473`) NAO roda para esta trava, e e por isso que nenhuma consulta a
      // `_transient_timeout_doing_cron` sai daqui: a trava e gravada com
      // carregamento automatico ligado, logo `isset( $alloptions[ $opcao ] )` e
      // verdadeiro e o legado pula a verificacao de prazo. Emitir a consulta do
      // prazo seria emitir comando que o legado nao emite.
      const gravada = lerLinhaDaTrava();
      return gravada === null
        ? TRAVA_AUSENTE_NO_CACHE
        : { presente: true, chave: gravada };
    },

    tomar(chave) {
      if (cache.externo) {
        cache.gravar(
          NOME_DA_TRAVA,
          chave,
          GRUPO_DE_TRANSIENTE,
          SEM_VALIDADE,
        );
        return true;
      }

      const gravada = lerLinhaDaTrava();

      if (gravada === null) {
        // `false === get_option( $transient_option )` (`:1548`) leva a
        // `add_option( $opcao, $valor, '', true )` (`:1554`), e e dali que vem o
        // carregamento automatico ligado.
        const resultado = dados.escrever({
          texto:
            `INSERT INTO ${tabela} (option_name, option_value, autoload) VALUES (?, ?, ?)` +
            ' ON DUPLICATE KEY UPDATE option_name = VALUES(option_name),' +
            ' option_value = VALUES(option_value), autoload = VALUES(autoload)',
          parametros: [OPCAO_DA_TRAVA, chave, CARREGAMENTO_AUTOMATICO_LIGADO],
        });
        return resultado.linhasAfetadas > 0;
      }

      if (mesmosBytes(gravada, chave)) {
        return false;
      }

      const resultado = dados.escrever({
        texto: `UPDATE ${tabela} SET option_value = ? WHERE option_name = ?`,
        parametros: [chave, OPCAO_DA_TRAVA],
      });
      return resultado.linhasAfetadas > 0;
    },

    liberar() {
      if (cache.externo) {
        cache.remover(NOME_DA_TRAVA, GRUPO_DE_TRANSIENTE);
        return true;
      }

      // `delete_option()` le o `autoload` da linha ANTES de apagar, e desiste sem
      // emitir `DELETE` quando a linha nao existe (`wp-includes/option.php:1215`-
      // `1218`). A consulta nao tem `LIMIT`, e a coluna lida e outra: nao e a
      // mesma consulta da leitura da trava.
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT autoload FROM ${tabela} WHERE option_name = ?`,
          parametros: [OPCAO_DA_TRAVA],
        }),
      );
      if (linha === null) {
        return false;
      }

      const apagada = dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE option_name = ?`,
        parametros: [OPCAO_DA_TRAVA],
      });
      if (apagada.linhasAfetadas === 0) {
        return false;
      }

      // `if ( $result ) { delete_option( $option_timeout ); }` (`:1400`-`:1402`):
      // o legado tenta apagar a linha de prazo **sempre**, e nesta feature ela
      // nunca existe — logo sai a leitura e nao sai o `DELETE`. E comando emitido,
      // e por isso esta aqui.
      const prazo = primeiraLinha(
        dados.selecionar({
          texto: `SELECT autoload FROM ${tabela} WHERE option_name = ?`,
          parametros: [OPCAO_DE_PRAZO_DA_TRAVA],
        }),
      );
      if (prazo !== null) {
        dados.escrever({
          texto: `DELETE FROM ${tabela} WHERE option_name = ?`,
          parametros: [OPCAO_DE_PRAZO_DA_TRAVA],
        });
      }

      return true;
    },
  };
}
