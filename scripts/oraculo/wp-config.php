<?php
/**
 * Tarefa: T001 de `015-plataforma-transversal` — a instalacao executavel do
 * legado como oraculo de paridade. Satisfaz: — (infraestrutura).
 *
 * E o `wp-config-sample.php` da arvore de 7.1.2 com os valores preenchidos, e
 * NADA mais. E o que `risk_register.md` RISK-022 pede ("wp-config.php com os
 * valores declarados") e e a primeira das quatro causas do
 * `oracleAvailable: false` do manifest de telas.
 *
 * O que foi preenchido, e de onde vem o valor:
 *
 *   DB_CHARSET  `utf8mb4`  — `wp-config-sample.php:35`
 *   DB_COLLATE  vazio      — `wp-config-sample.php:38` ("don't change this if in doubt")
 *   sais        fixos      — RISK-006: a chave do HMAC do cookie embute 4
 *                            caracteres do hash da senha (`wp-includes/pluggable.php:855-867`),
 *                            e o nonce amarra tick, acao, usuario e token. Sal
 *                            que muda a cada subida torna o oraculo
 *                            irreproduzivel justamente na area de sessao
 *   $table_prefix `wp_`    — `wp-config-sample.php:74`
 *   WP_DEBUG    `false`    — `wp-config-sample.php:88`. NAO se liga: a resposta
 *                            11 registra que o caso "pacote sem assinatura" e
 *                            silenciado FORA do modo de depuracao, logo ligar
 *                            depuracao muda o observavel que o porte copia
 *
 * O que NAO foi acrescentado, de proposito:
 *
 *   WP_SITEURL / WP_HOME          fixar os dois tira o endereco da tela de
 *                                 opcoes; a instalacao nova grava o que o
 *                                 pedido disser, e e isso que o oraculo faz
 *   DISALLOW_FILE_MODS            desligaria UC-33 e UC-34, que sao escopo
 *   AUTOMATIC_UPDATER_DISABLED    idem; a atualizacao automatica e comportamento
 *                                 a reproduzir, inclusive o rebaixamento para
 *                                 canal sem cifra da resposta 12
 *   WP_CACHE / object-cache.php   cache de objeto persistente fica DESLIGADO
 *                                 (RISK-009), e a ausencia do arquivo e a forma
 *                                 de o desligar: e drop-in por presenca de
 *                                 arquivo (`domain.md` secao 1.6)
 *
 * As credenciais de banco sao lidas do ambiente porque quem as declara e o
 * `compose.yml`; os valores de fabrica desta receita estao no `README.md` ao
 * lado. Nao ha usuario real nem dado real neste ambiente, e a porta esta presa a
 * 127.0.0.1: estes sais e estas senhas sao de referencia e nao servem a mais
 * nada.
 *
 * @package WordPress
 */

// ** Database settings ** //
define( 'DB_NAME', getenv( 'ORACULO_BANCO_NOME' ) ?: 'oraculo' );
define( 'DB_USER', getenv( 'ORACULO_BANCO_USUARIO' ) ?: 'oraculo' );
define( 'DB_PASSWORD', getenv( 'ORACULO_BANCO_SENHA' ) ?: 'oraculo' );
define( 'DB_HOST', 'banco' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts. Fixos por decisao (RISK-006).
 */
define( 'AUTH_KEY',         'c8f6OiNNgGU4pB9/72LryeguCmVN5xStMVGTpOXjpFDjhagP6uKTtt91p8CrLol9' );
define( 'SECURE_AUTH_KEY',  'kSPADqFLxvsyEAud+ovaN1weAtxlqxgoMAOWuSR6jJdziwromhtez/q2qBQd6I3b' );
define( 'LOGGED_IN_KEY',    'WrAxOiuIepLx1XIT13wHWBksaco/+1PWFZPP+e3Gq6WbvLvx+oa4Xpb4z+nRvJSw' );
define( 'NONCE_KEY',        'Q5/k6LhiDPJafPVOno1G5428R+qIEi6JJGwwzFKqUWNCGiQDYjsOJdTg1TkgfPnE' );
define( 'AUTH_SALT',        'fwr9zNFm7rmHqZxjrrmkViSnTMBwYlPwPH446fJZtigNG5AGBXQbzOvw1Yjb5dHL' );
define( 'SECURE_AUTH_SALT', 'K7k2Pkd3ogQZI8uvLXhHtLdTIa+4jjxWz/LrGH5Z3KwMF6kJ0BaAq0RbOYvli8S7' );
define( 'LOGGED_IN_SALT',   'dOoe39d/2YAGxxMkheY+XmTlMzTbuA3JB5ebwfOlzDyYP7PShrrAS31Lo1RaOICT' );
define( 'NONCE_SALT',       'AkoiY9SrWrHV2QbjFMLjeAhNiN8GXEigpoTH4+w9y7wfyqZhn9QoJj4AYtaunx+C' );
/**#@-*/

$table_prefix = 'wp_';

define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
