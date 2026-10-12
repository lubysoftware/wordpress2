/**
 * Onde a fila e a trava moram: a tabela, os nomes de opcao, a chave de cache e o
 * valor de carregamento automatico. Entrega de **T002**.
 *
 * *satisfaz:* — (infraestrutura).
 *
 * **Esta feature nao tem tabela.** `plan.md` abre a secao *Modelo de dados*
 * dizendo o que o legado tem: a fila e *"uma unica linha de configuracao"*. Sao
 * **duas linhas** da tabela de opcoes, e nenhum DDL — nada aqui cria tabela,
 * porque nada aqui tem tabela a criar.
 *
 * | linha | o que e | onde o legado a toca |
 * |---|---|---|
 * | `cron` | a fila inteira, um arranjo serializado | `_get_cron_array()` (`wp-includes/cron.php:1262`), `_set_cron_array()` (`:1304`) |
 * | `_transient_doing_cron` | a trava do disparo, quando nao ha cache externo | `_get_cron_lock()` (`wp-cron.php:75`), `set_transient( 'doing_cron', ... )` (`wp-includes/cron.php:959`) |
 *
 * A terceira linha — `_transient_timeout_doing_cron` — **nunca existe nesta
 * feature**, e o nome esta declarado aqui porque `delete_transient()` o apaga de
 * qualquer forma (`wp-includes/option.php:1396` e `:1401`). Ver
 * {@link OPCAO_DE_PRAZO_DA_TRAVA}.
 *
 * ## Escopo por site, e por que nao ha prefixo base
 *
 * A tabela de opcoes e de escopo **por site**: `target_data_model.md` a poe entre
 * as de *"ESCOPO POR SITE"*, com `{p}` no site principal e `{p}<blog_id>_` nos
 * demais. Logo cada site da rede tem a **sua** fila e a **sua** trava, e o
 * prefixo que importa e o unico que a porta declara
 * ({@link PortaDeDados.prefixoDeTabela}). O prefixo base serve `users` e
 * `usermeta`, que nao sao desta feature — ver `../portas/porta-de-dados.ts`.
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}options` — por site. Guarda as duas linhas desta feature. */
export function tabelaDeOpcoes(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}options`;
}

/** `cron` — a opcao em que a fila inteira mora. */
export const OPCAO_DA_FILA = 'cron';

/**
 * `doing_cron` — o nome do transiente da trava, como o legado o escreve em
 * `set_transient()`, `get_transient()` e `delete_transient()`
 * (`wp-includes/cron.php:943`, `:959`, `wp-cron.php:92`, `:103`, `:202`).
 *
 * E o nome **sem** prefixo: e a API de transiente que acrescenta `_transient_`
 * ao gravar na tabela de opcoes (`wp-includes/option.php:1545`), e e o nome cru
 * que vai ao cache de objeto (`:1542`).
 */
export const NOME_DA_TRAVA = 'doing_cron';

/**
 * `_transient_doing_cron` — a linha de opcao da trava, no ramo sem cache externo.
 *
 * O nome aparece **literal** no legado, dentro da consulta escrita a mao de
 * `_get_cron_lock()` (`wp-cron.php:75`), e e ali que ele tem de bater byte a
 * byte.
 */
export const OPCAO_DA_TRAVA = `_transient_${NOME_DA_TRAVA}`;

/**
 * `_transient_timeout_doing_cron` — a linha de prazo que **esta feature nunca
 * grava**.
 *
 * `set_transient( 'doing_cron', $v )` e chamado sem o terceiro argumento, logo
 * `$expiration` e `0`, e o ramo que gravaria o prazo nao roda
 * (`wp-includes/option.php:1550`-`1553`). A linha so aparece aqui porque
 * `delete_transient()` tenta apaga-la sempre que a linha principal foi apagada
 * (`:1400`-`:1402`) — e essa tentativa **emite comando**, que e efeito no banco
 * (area 3 da Decisao 2 de `parity_specs.md`).
 */
export const OPCAO_DE_PRAZO_DA_TRAVA = `_transient_timeout_${NOME_DA_TRAVA}`;

/**
 * `transient` — o grupo do cache de objeto em que a trava mora quando o cache e
 * externo (`wp-includes/option.php:1456` e `:1542`, `wp-cron.php:73`).
 */
export const GRUPO_DE_TRANSIENTE = 'transient';

/**
 * `on` — o valor da coluna de carregamento automatico que esta feature grava.
 *
 * Os dois caminhos chegam nele por decisao explicita do legado, e nao por
 * omissao: a fila e gravada com `update_option( 'cron', $cron, true )`
 * (`wp-includes/cron.php:1304`) e a trava com `add_option( ..., true )`
 * (`wp-includes/option.php:1549` e `:1554`), e
 * `wp_determine_option_autoload_value()` traduz o booleano verdadeiro em `'on'`
 * (`:1309`-`:1310`).
 *
 * **E observavel**, e nao detalhe de esquema: e o que poe as duas linhas entre as
 * opcoes que **toda** requisicao carrega de uma vez
 * (`SELECT option_name, option_value FROM {site}options WHERE autoload IN (...)`,
 * `wp-includes/option.php:627`), e dai depende o custo e o momento da leitura.
 */
export const CARREGAMENTO_AUTOMATICO_LIGADO = 'on';
