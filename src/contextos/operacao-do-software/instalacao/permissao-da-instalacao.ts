/**
 * A permissao de instalar e atualizar extensao: os dois `case` de
 * `map_meta_cap()` que US-1 exercita, a declaracao explicita de permissao de
 * cada acao da tela (**P4**) e os tokens de cada acao.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` (US-1) — **CA-1.1**
 * (*"a acao exige a capacidade declarada e a confirmacao do token da tela"*),
 * **CA-1.3** (o envio *"resolve para a de instalar"*), **CA-1.4** (*"ativar o
 * plugin depois de instalar exige uma capacidade distinta"*), **CA-1.6** (a
 * proibicao de modificar arquivos nega a toda conta) e **CA-1.7** (*"em
 * instalacao em rede, a acao e poder de rede"*), mais a regra *"as capacidades
 * de instalacao sao exclusivas do papel de administracao, e em rede sao negadas
 * a quem nao administra a rede"*.
 *
 * ## O primeiro `case` (`wp-includes/capabilities.php:619`-`:642`)
 *
 * ```php
 * case 'update_plugins': case 'delete_plugins': case 'install_plugins':
 * case 'upload_plugins': case 'update_themes': case 'delete_themes':
 * case 'install_themes': case 'upload_themes': case 'update_core':
 *     if ( ! wp_is_file_mod_allowed( 'capability_update_core' ) ) {
 *         $caps[] = 'do_not_allow';
 *     } elseif ( is_multisite() && ! is_super_admin( $user_id ) ) {
 *         $caps[] = 'do_not_allow';
 *     } elseif ( 'upload_themes' === $cap ) {
 *         $caps[] = 'install_themes';
 *     } elseif ( 'upload_plugins' === $cap ) {
 *         $caps[] = 'install_plugins';
 *     } else {
 *         $caps[] = $cap;
 *     }
 * ```
 *
 * Tres coisas deste bloco decidem US-1, e cada uma e um criterio:
 *
 * 1. **`upload_plugins` e `upload_themes` nao estao em papel nenhum**: a matriz
 *    de fabrica so tem as de instalar. Sem este caso, a pergunta cai no ramo
 *    final de `traduzirCapacidade()` e e negada a todo mundo — e enviar pacote
 *    deixaria de existir. E CA-1.3.
 * 2. **Em rede, quem nao e super administrador recebe `do_not_allow`**, e isso
 *    acontece *dentro do mapeamento*, logo nenhuma concessao individual nem o
 *    ponto `user_has_cap` reabre: `do_not_allow` e removido do mapa no passo 6
 *    da decisao. O super administrador passa pelo atalho do passo 2, que so
 *    olha se a lista contem `do_not_allow`. E CA-1.7 e a segunda metade da
 *    regra.
 * 3. **`wp_is_file_mod_allowed( 'capability_update_core' )`** e o filtro
 *    `file_mod_allowed` sobre `! defined( 'DISALLOW_FILE_MODS' ) ||
 *    ! DISALLOW_FILE_MODS` (`wp-includes/load.php:1838`). E CA-1.6.
 *
 * ## 🔴 O filtro `file_mod_allowed` so FECHA aqui, nunca reabre
 *
 * A constante ja e lida pela plataforma, **antes** deste caso:
 * `plataforma/autorizacao/revogacao-por-constante.ts` poe as nove capacidades
 * deste bloco em `DISALLOW_FILE_MODS` e e o primeiro passo da ordem declarada
 * (`decisao-de-capacidade.ts`). No legado a constante e so o **valor padrao**
 * do filtro: um interceptador de `file_mod_allowed` que devolva `true` com a
 * constante ligada **reabre** as nove. Neste porte ele nao consegue, porque a
 * revogacao da plataforma ja devolveu `do_not_allow` antes de este caso ser
 * consultado.
 *
 * O caminho inverso funciona e esta aqui: sem a constante, um interceptador que
 * devolva `false` fecha as nove, exatamente como no legado. A divergencia e da
 * plataforma (T015 da feature 001, que tratou as quatro constantes como
 * revogacao incondicional) e **nao e desta tarefa corrigi-la**: mexer na ordem
 * da decisao muda todas as capacidades que ela alcanca, inclusive as de
 * edicao de arquivo, que nao sao de US-1. Fica registrada em `../README.md`.
 *
 * ## O segundo `case` (`wp-includes/capabilities.php:654`-`:666`)
 *
 * ```php
 * case 'activate_plugins': case 'deactivate_plugins':
 * case 'activate_plugin': case 'deactivate_plugin':
 *     $caps[] = 'activate_plugins';
 *     if ( is_multisite() ) {
 *         // update_, install_, and delete_ are handled above with is_super_admin().
 *         $menu_perms = get_site_option( 'menu_items', array() );
 *         if ( empty( $menu_perms['plugins'] ) ) {
 *             $caps[] = 'manage_network_plugins';
 *         }
 *     }
 * ```
 *
 * E CA-1.4: *"ativar o plugin depois de instalar exige uma capacidade distinta
 * da de instalar"*, e o fluxo alternativo de UC-33 que diz *"em rede, soma-se
 * `manage_network_plugins` se o menu de plugins nao foi liberado por site"*.
 * Note o comentario do proprio legado: ativar **nao** passa por
 * `is_super_admin()`, ao contrario de instalar. Em rede, um administrador de
 * site ativa plugin se a rede liberou o menu, e nunca instala.
 *
 * `menu_items` e opcao de **rede** gravada pela tela de configuracao da rede,
 * que nao e deste contexto: chega por {@link LeiturasDaPermissao}, e so e lida
 * em rede, como no legado.
 */

import {
  CAPACIDADE_NEGADA,
  ehSuperAdmin,
  perguntarPermissao,
  type Capacidade,
  type CasoDeTraducao,
  type ContextoDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';

/** `install_plugins`. */
export const CAPACIDADE_DE_INSTALAR_PLUGINS: Capacidade = 'install_plugins';
/** `update_plugins`. */
export const CAPACIDADE_DE_ATUALIZAR_PLUGINS: Capacidade = 'update_plugins';
/** `upload_plugins` — resolve para `install_plugins` (`capabilities.php:638`). */
export const CAPACIDADE_DE_ENVIAR_PLUGINS: Capacidade = 'upload_plugins';
/** `install_themes`. */
export const CAPACIDADE_DE_INSTALAR_TEMAS: Capacidade = 'install_themes';
/** `update_themes`. */
export const CAPACIDADE_DE_ATUALIZAR_TEMAS: Capacidade = 'update_themes';
/** `upload_themes` — resolve para `install_themes` (`capabilities.php:636`). */
export const CAPACIDADE_DE_ENVIAR_TEMAS: Capacidade = 'upload_themes';
/** `activate_plugin` — a meta-capacidade que a tela de instalacao pergunta. */
export const CAPACIDADE_DE_ATIVAR_PLUGIN: Capacidade = 'activate_plugin';
/** `activate_plugins` — a primitiva para a qual as quatro de ativacao resolvem. */
export const CAPACIDADE_DE_ATIVAR_PLUGINS: Capacidade = 'activate_plugins';
/** `manage_network_plugins` — o que a rede soma quando nao liberou o menu. */
export const CAPACIDADE_DE_ADMINISTRAR_PLUGINS_DA_REDE: Capacidade =
  'manage_network_plugins';

/**
 * As nove do primeiro `case`, na ordem do legado (`capabilities.php:619`-`:627`).
 *
 * `delete_*` e `update_core` entram porque estao no mesmo `case`, e separa-los
 * faria a tarefa de apagar extensao (fora desta feature) e a de atualizar o
 * nucleo (T015) redeclararem o mesmo bloco com risco de divergir.
 */
export const CAPACIDADES_DE_MODIFICAR_ARQUIVO: readonly Capacidade[] = [
  'update_plugins',
  'delete_plugins',
  'install_plugins',
  'upload_plugins',
  'update_themes',
  'delete_themes',
  'install_themes',
  'upload_themes',
  'update_core',
];

/** As quatro do segundo `case` (`capabilities.php:654`-`:657`). */
export const CAPACIDADES_DE_ATIVACAO: readonly Capacidade[] = [
  'activate_plugins',
  'deactivate_plugins',
  'activate_plugin',
  'deactivate_plugin',
];

/** O contexto do `wp_is_file_mod_allowed()` deste bloco (`capabilities.php:632`). */
export const CONTEXTO_DA_MODIFICACAO_DE_ARQUIVO = 'capability_update_core';

/**
 * O que os dois `case` leem alem da pergunta. As duas leituras sao funcoes
 * porque o legado so as faz quando o ramo chega nelas.
 */
export interface LeiturasDaPermissao {
  /**
   * `file_mod_allowed` — recebe o valor padrao (`! DISALLOW_FILE_MODS`) e o
   * contexto, e devolve o permitido. Ausente, vale o padrao (P2: ponto sem
   * interceptador e no-op).
   */
  readonly aoPerguntarSeModificaArquivo?: (
    permitido: boolean,
    contexto: string,
  ) => boolean;
  /**
   * `! empty( get_site_option( 'menu_items', array() )['plugins'] )` — a rede
   * liberou o menu de plugins aos sites. So consultada em rede.
   */
  menuDePluginsLiberadoNosSites(): boolean;
}

/**
 * `wp_is_file_mod_allowed( $contexto )` (`wp-includes/load.php:1829`-`:1839`).
 *
 * O padrao e calculado aqui a partir das constantes da base, que e a mesma
 * fonte que a plataforma le.
 */
export function modificacaoDeArquivoPermitida(
  autorizacao: ContextoDeAutorizacao,
  leituras: LeiturasDaPermissao,
  contexto: string,
): boolean {
  const padrao = autorizacao.constantes?.DISALLOW_FILE_MODS !== true;
  const filtro = leituras.aoPerguntarSeModificaArquivo;
  return filtro === undefined ? padrao : filtro(padrao, contexto);
}

/**
 * Os dois `case` de US-1, como {@link CasoDeTraducao}.
 *
 * E fabrica, e nao constante como `casoDaPersonalizacao` em BC-09, porque o
 * primeiro `case` pergunta `is_super_admin( $user_id )` e o segundo le
 * `menu_items`: os dois dependem da requisicao. `ehSuperAdmin` so e chamado em
 * rede — e o `is_multisite() &&` do legado —, e em rede ele nao volta a
 * perguntar permissao, logo nao ha recursao.
 */
export function casoDaInstalacao(
  autorizacao: ContextoDeAutorizacao,
  leituras: LeiturasDaPermissao,
): CasoDeTraducao {
  return (pedido) => {
    if (CAPACIDADES_DE_MODIFICAR_ARQUIVO.includes(pedido.capacidade)) {
      if (
        !modificacaoDeArquivoPermitida(
          autorizacao,
          leituras,
          CONTEXTO_DA_MODIFICACAO_DE_ARQUIVO,
        )
      ) {
        return [CAPACIDADE_NEGADA];
      }
      if (pedido.emRede && !ehSuperAdmin(autorizacao)) {
        return [CAPACIDADE_NEGADA];
      }
      if (pedido.capacidade === CAPACIDADE_DE_ENVIAR_TEMAS) {
        return [CAPACIDADE_DE_INSTALAR_TEMAS];
      }
      if (pedido.capacidade === CAPACIDADE_DE_ENVIAR_PLUGINS) {
        return [CAPACIDADE_DE_INSTALAR_PLUGINS];
      }
      return [pedido.capacidade];
    }

    if (CAPACIDADES_DE_ATIVACAO.includes(pedido.capacidade)) {
      const exigidas: Capacidade[] = [CAPACIDADE_DE_ATIVAR_PLUGINS];
      if (pedido.emRede && !leituras.menuDePluginsLiberadoNosSites()) {
        exigidas.push(CAPACIDADE_DE_ADMINISTRAR_PLUGINS_DA_REDE);
      }
      return exigidas;
    }

    return null;
  };
}

/**
 * `current_user_can( $capacidade, ...$argumentos )` com os dois `case` de US-1
 * entre os casos de traducao.
 *
 * O caso entra **antes** dos que a base trouxer; nenhum outro caso do legado
 * reconhece estas treze capacidades, logo a posicao nao muda resultado. A
 * revogacao pelas constantes continua primeiro, porque quem a poe e a decisao.
 */
export function perguntarNaInstalacao(
  autorizacao: ContextoDeAutorizacao,
  leituras: LeiturasDaPermissao,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): boolean {
  return perguntarPermissao(
    {
      ...autorizacao,
      casosDeTraducao: [
        casoDaInstalacao(autorizacao, leituras),
        ...(autorizacao.casosDeTraducao ?? []),
      ],
    },
    capacidade,
    ...argumentos,
  );
}

/**
 * As acoes de `wp-admin/update.php` que US-1 porta, com o nome do legado — e o
 * valor do parametro `action`, logo contrato publico (P8).
 */
export type AcaoDaTelaDeAtualizacao =
  | 'update-selected'
  | 'upgrade-plugin'
  | 'install-plugin'
  | 'upload-plugin'
  | 'upgrade-theme'
  | 'update-selected-themes'
  | 'install-theme'
  | 'upload-theme';

/**
 * A permissao declarada de cada acao, como o **P4** cobra, com a linha de
 * `update.php` que a pergunta. E a capacidade **pedida**; o que ela exige
 * depois da traducao e {@link casoDaInstalacao}.
 *
 * ⚠️ **O lote pergunta UMA vez** (`:28` e `:233`), antes de qualquer item, e
 * `bulk_upgrade()` nao pergunta de novo por item — e CA-1.5.
 */
export const PERMISSOES_DA_INSTALACAO: Readonly<
  Record<AcaoDaTelaDeAtualizacao, Capacidade>
> = {
  'update-selected': CAPACIDADE_DE_ATUALIZAR_PLUGINS, // :28
  'upgrade-plugin': CAPACIDADE_DE_ATUALIZAR_PLUGINS, // :56
  'install-plugin': CAPACIDADE_DE_INSTALAR_PLUGINS, // :106
  'upload-plugin': CAPACIDADE_DE_ENVIAR_PLUGINS, // :151
  'upgrade-theme': CAPACIDADE_DE_ATUALIZAR_TEMAS, // :210
  'update-selected-themes': CAPACIDADE_DE_ATUALIZAR_TEMAS, // :233
  'install-theme': CAPACIDADE_DE_INSTALAR_TEMAS, // :261
  'upload-theme': CAPACIDADE_DE_ENVIAR_TEMAS, // :303
};

/**
 * A acao do token de cada acao da tela, com a linha do `check_admin_referer()`.
 * O campo e o padrao, `_wpnonce`, nas oito. As que levam o item no nome recebem
 * o plugin ou o tema **ja tratado** pela tela (`trim()` e `urldecode()`,
 * `update.php:23`-`:24`).
 */
export function acaoDoToken(
  acao: AcaoDaTelaDeAtualizacao,
  plugin: string,
  tema: string,
): string {
  switch (acao) {
    case 'update-selected':
      return 'bulk-update-plugins'; // :32
    case 'upgrade-plugin':
      return `upgrade-plugin_${plugin}`; // :60
    case 'install-plugin':
      return `install-plugin_${plugin}`; // :112
    case 'upload-plugin':
      return 'plugin-upload'; // :155
    case 'upgrade-theme':
      return `upgrade-theme_${tema}`; // :214
    case 'update-selected-themes':
      return 'bulk-update-themes'; // :237
    case 'install-theme':
      return `install-theme_${tema}`; // :267
    case 'upload-theme':
      return 'theme-upload'; // :307
  }
}

/** O campo do pedido que carrega o token: o padrao de `check_admin_referer()`. */
export const CAMPO_DO_TOKEN = '_wpnonce';

/** `update.php:29` e `:57`. */
export const MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_PLUGINS =
  'Sorry, you are not allowed to update plugins for this site.';
/** `update.php:107` e `:152` — a mesma para instalar e para enviar. */
export const MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_PLUGINS =
  'Sorry, you are not allowed to install plugins on this site.';
/** `update.php:211` e `:234`. */
export const MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_TEMAS =
  'Sorry, you are not allowed to update themes for this site.';
/** `update.php:262` e `:304` — a mesma para instalar e para enviar. */
export const MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_TEMAS =
  'Sorry, you are not allowed to install themes on this site.';

/** A mensagem do `wp_die()` de cada acao quando a capacidade falta. */
export function mensagemSemPermissao(acao: AcaoDaTelaDeAtualizacao): string {
  switch (acao) {
    case 'update-selected':
    case 'upgrade-plugin':
      return MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_PLUGINS;
    case 'install-plugin':
    case 'upload-plugin':
      return MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_PLUGINS;
    case 'upgrade-theme':
    case 'update-selected-themes':
      return MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_TEMAS;
    case 'install-theme':
    case 'upload-theme':
      return MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_TEMAS;
  }
}

/** O titulo de `wp_nonce_ays()` para toda acao que nao e `log-out` (`functions.php:3729`). */
export const TITULO_DE_TOKEN_VENCIDO = 'An error occurred.';

/** A mensagem de `wp_nonce_ays()` para toda acao que nao e `log-out` (`functions.php:3749`). */
export const MENSAGEM_DE_TOKEN_VENCIDO = 'The link you followed has expired.';
