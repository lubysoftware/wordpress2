/**
 * As duas tabelas e os nove nomes de opcao desta tarefa.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`: *"os pontos de
 * configuracao que guardam falha de atualizacao automatica, politica de
 * atualizacao e sessao de recuperacao existem com os valores de fabrica do
 * legado e sao lidos e gravados pela porta de dados"*.
 *
 * **Nenhum nome de tabela e de opcao se monta a mao fora deste arquivo.** A nota
 * 3 de `target_data_model.md` registra por que isso importa: *"o prefixo de
 * tabela nao e so configuracao de conexao: ele e dado"*. Nesta feature ha um
 * segundo motivo, que e o achado de T001: **os dois prefixos sao usados, e por
 * tabelas diferentes**.
 *
 * | tabela | escopo | prefixo | quem mora nela |
 * |---|---|---|---|
 * | `options` | por site | **do site** | as 3 da politica, as 2 da recuperacao por site e a das extensoes pausadas |
 * | `sitemeta` | global | **base** | as 2 do estado de falha e as 2 do segredo de assinatura, **quando em rede** |
 *
 * ⚠️ **E as duas listas se cruzam, porque `get_site_option()` muda de tabela com
 * a instalacao.** Em site unico `get_network_option()` cai em `get_option()`
 * (`wp-includes/option.php:2086`), logo opcao de rede vive em `{site}options`;
 * em rede ela vive em `{base}sitemeta` (`:2095`). E a mesma opcao, com o mesmo
 * nome, em duas tabelas conforme a instalacao — ver `opcao.ts`.
 *
 * ── OS NOMES FICAM EM INGLES, E ISSO NAO E DESCUIDO ────────────────────────
 *
 * Nome de opcao e **dado gravado e contrato publico**: o ponto de extensao
 * `default_site_option_{$option}` e `pre_update_option_{$option}` carregam o
 * nome na propria composicao do gancho (`wp-includes/option.php:2083`,
 * `:901`), e extensao de terceiro se registra neles por cadeia literal.
 * Traduzir um destes nomes renomeia opcao publicada, que esta na tabela *Nao
 * negociavel* da constituicao. Vale a mesma regra que T001 aplicou aos quatro
 * transportes de arquivo.
 */

import type { PortaDeDados } from '../portas/index.js';

/**
 * `{site}options` — o bloco **ESCOPO POR SITE** do DDL
 * (`wp-admin/includes/schema.php:141`). 4 colunas: `option_id`,
 * `option_name varchar(191)`, `option_value longtext`,
 * `autoload varchar(20) NOT NULL default 'yes'`.
 */
export function tabelaDeOpcoesDoSite(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}options`;
}

/**
 * `{base}sitemeta` — a tabela **global** da rede
 * (`wp-admin/includes/schema.php:290`). 4 colunas: `meta_id`,
 * `site_id bigint`, `meta_key varchar(255) default NULL`,
 * `meta_value longtext` — **sem** coluna de autocarregamento, que e a
 * assimetria que `opcao.ts` reproduz.
 *
 * Leva o prefixo **base** porque e global: numa rede, `wp_sitemeta` e nao
 * `wp_2_sitemeta`. Em site unico os dois prefixos sao iguais e a diferenca
 * passa despercebida — e e por isso que `portas/porta-de-dados.ts` declara os
 * dois campos desde T001.
 */
export function tabelaDeOpcoesDeRede(dados: PortaDeDados): string {
  return `${dados.prefixoBaseDeTabela}sitemeta`;
}

/**
 * `auto_core_update_failed` — **o unico historico persistente de falha do
 * sistema inteiro.**
 *
 * UC-35 e literal: *"Nao ha log, nao ha tabela: e a unica memoria de operacao
 * que este sistema tem"*. Opcao **de rede**
 * (`wp-admin/includes/class-wp-automatic-updater.php:838` e `:873`), lida em
 * quatro lugares (`class-core-upgrader.php:324`,
 * `class-wp-automatic-updater.php:856`, `wp-admin/includes/update.php:857`,
 * `class-wp-site-health-auto-updates.php:171`) e apagada em um
 * (`wp-admin/includes/update-core.php:1922`).
 */
export const OPCAO_DE_FALHA_DA_ATUALIZACAO = 'auto_core_update_failed';

/**
 * `auto_core_update_notified` — o registro de aviso ja enviado, que `A7`
 * consulta antes de enviar outro.
 *
 * Opcao **de rede**, gravada em `class-wp-automatic-updater.php:899` e lida em
 * dois lugares, com condicoes **diferentes**: `:313` compara e-mail e versao, e
 * `:861` compara e-mail, versao **e tipo**. A diferenca e de T021, nao desta
 * tarefa; o nome e a forma sao daqui.
 */
export const OPCAO_DE_AVISO_DA_ATUALIZACAO = 'auto_core_update_notified';

/** `auto_update_core_dev` (`wp-admin/includes/class-core-upgrader.php:288`). */
export const OPCAO_DE_ATUALIZACAO_DE_DESENVOLVIMENTO = 'auto_update_core_dev';

/** `auto_update_core_minor` (`wp-admin/includes/class-core-upgrader.php:289`). */
export const OPCAO_DE_ATUALIZACAO_MENOR = 'auto_update_core_minor';

/** `auto_update_core_major` (`wp-admin/includes/class-core-upgrader.php:290`). */
export const OPCAO_DE_ATUALIZACAO_MAIOR = 'auto_update_core_major';

/**
 * `recovery_keys` — o conjunto de chaves de recuperacao emitidas, por token.
 *
 * Opcao **por site** e com autocarregamento **desligado**:
 * `update_option( $this->option_name, $keys, false )`
 * (`wp-includes/class-wp-recovery-mode-key-service.php:191`).
 */
export const OPCAO_DE_CHAVES_DE_RECUPERACAO = 'recovery_keys';

/**
 * `recovery_mode_email_last_sent` — o marcador do aviso diario de `A10`,
 * gravado **antes** do envio.
 *
 * Opcao **por site**, e a constante que a nomeia e publica:
 * `WP_Recovery_Mode_Email_Service::RATE_LIMIT_OPTION`
 * (`wp-includes/class-wp-recovery-mode-email-service.php:17`).
 */
export const OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO =
  'recovery_mode_email_last_sent';

/**
 * `recovery_mode_auth_key` — a chave de assinatura do cookie de recuperacao,
 * gerada e gravada **quando a instalacao nao declarou `AUTH_KEY`**, ou quando a
 * declarou com a frase de exemplo do arquivo de configuracao
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php:214` e `:222`).
 *
 * Opcao **de rede**.
 */
export const OPCAO_DA_CHAVE_DE_ASSINATURA_DE_RECUPERACAO =
  'recovery_mode_auth_key';

/**
 * `recovery_mode_auth_salt` — o sal da mesma assinatura, com a mesma regra e um
 * terceiro caso: tambem e gerado quando `AUTH_SALT` e **igual** a chave
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php:228` e `:237`).
 *
 * Opcao **de rede**.
 */
export const OPCAO_DO_SAL_DE_ASSINATURA_DE_RECUPERACAO =
  'recovery_mode_auth_salt';

/**
 * O sufixo do nome da opcao que guarda as extensoes pausadas
 * (`wp-includes/class-wp-paused-extensions-storage.php:224`).
 *
 * 🔴 **O nome desta opcao carrega o identificador da sessao, e e esse detalhe
 * que faz o modo de recuperacao ser usavel em producao.** UC-36 o poe entre as
 * tres coisas que um porte precisa saber: *"o nome da opcao que guarda as
 * extensoes pausadas carrega o identificador da sessao. E o que permite
 * consertar um site em producao sem que o visitante veja a diferenca — e o
 * detalhe que mais facilmente se perde num porte"*. E CA-12.3 e a cobranca
 * disso: *"a extensao responsavel esta pausada apenas para quem esta na
 * sessao"*.
 *
 * Se a pausa fosse opcao de nome fixo, ela valeria para o site, e o visitante
 * veria a obra.
 */
export const SUFIXO_DA_OPCAO_DE_EXTENSOES_PAUSADAS = '_paused_extensions';

/**
 * `{sessao}_paused_extensions` — a opcao da sessao de recuperacao informada.
 *
 * O identificador e `sha1()` do aleatorio do cookie
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php:142`), logo 40
 * caracteres, e o nome resultante tem 58 — dentro do `varchar(191)` da coluna.
 *
 * Sessao vazia **nao tem nome de opcao**: o legado devolve cadeia vazia em
 * `get_option_name()` quando o modo nao esta ativo ou o identificador esta
 * vazio (`class-wp-paused-extensions-storage.php:214` a `:221`), e toda
 * operacao de pausa desiste ali, **sem tocar o banco**. Quem chama este nome
 * decide antes se ha sessao; ver `../configuracao/sessao-de-recuperacao.ts`.
 */
export function nomeDaOpcaoDeExtensoesPausadas(sessaoId: string): string {
  return `${sessaoId}${SUFIXO_DA_OPCAO_DE_EXTENSOES_PAUSADAS}`;
}
