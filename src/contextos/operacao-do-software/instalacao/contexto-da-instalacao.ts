/**
 * O contexto das operacoes de instalacao e atualizacao de extensao — o que
 * elas recebem da requisicao, do ambiente e das ligacoes tardias com o que nao
 * e de US-1.
 *
 * Entrega de **T003** da feature `010-operacao-do-software` (US-1, *"Instalar e
 * atualizar extensao a partir do catalogo ou de arquivo enviado"*), CA-1.1 a
 * CA-1.7.
 *
 * ## Por que o `run()` do legado chega como ligacao tardia
 *
 * `WP_Upgrader::run()` (`wp-admin/includes/class-wp-upgrader.php`) e o
 * caminho inteiro de aplicar um pacote: conectar ao sistema de arquivos, baixar,
 * verificar a assinatura, descompactar, por em manutencao, limpar o destino,
 * copiar, restaurar a copia de seguranca quando a copia falha e limpar a area
 * temporaria. **Cada um desses passos e criterio de aceite de OUTRA historia
 * desta feature**, e cada uma tem a sua tarefa, que depende desta:
 *
 * | passo de `run()` | historia | tarefa |
 * |---|---|---|
 * | `download_package()` com a verificacao de assinatura | US-2 | T005 (🔴 conflito registrado) |
 * | `maintenance_mode()` | US-4 | T009 (🔴 conflito #4 do README) |
 * | `fs_connect()`, `install_package()`, `clear_destination()`, a copia de seguranca e a limpeza | US-5 | T011 |
 *
 * Por isso o que esta tarefa porta e a **camada de cima**: a tela
 * (`wp-admin/update.php`), a consulta ao catalogo (`plugins_api()` e
 * `themes_api()`) e os metodos publicos de `Plugin_Upgrader` e
 * `Theme_Upgrader` (`install()`, `upgrade()`, `bulk_upgrade()`) — qual pacote,
 * para qual destino, com qual `hook_extra`, com qual permissao, e o que fazer
 * com o resultado de cada item. O `run()` chega por {@link ExecucaoDoPacote}, e
 * as tarefas acima o constroem atras dessa interface sem mudar a tela.
 *
 * O mesmo vale para o envio: `File_Upload_Upgrader`
 * (`wp-admin/includes/class-file-upload-upgrader.php`) grava o arquivo como
 * **anexo** (`wp_insert_attachment()`, `:110`) e agenda a limpeza na fila
 * (`wp_schedule_single_event()`, `:113`) — anexo e de BC-03 e fila e da feature
 * `011`, e a regra de dependencia 3 proibe o `import`. Chega por
 * {@link RecepcaoDoPacoteEnviado}.
 *
 * ⚠️ **Os valores chegam ja sem barra invertida de escape**, como em BC-09. O
 * legado le `$_GET['plugins']` com `stripslashes()` (`update.php:35`) porque
 * `wp_magic_quotes()` as poe; desfazer o escape e da borda.
 */

import type { ContextoDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type { LeiturasDaPermissao } from './permissao-da-instalacao.js';

/**
 * Um `WP_Error` deste caminho: o codigo, a mensagem e o dado.
 *
 * O codigo atravessa como dado porque `A5` e `A6` classificam a falha por ele
 * (`class-wp-automatic-updater.php:816` e `:855`), e o lote desta tarefa produz
 * dois deles proprios: `incompatible_wp_required_version` e
 * `incompatible_php_required_version`.
 */
export interface ErroDeInstalacao {
  readonly codigo: string;
  readonly mensagem: string;
  readonly dado?: unknown;
}

/**
 * O resultado de um item: `true | false | WP_Error`, como o legado devolve.
 *
 * `false` **nao e o mesmo que erro**, e o lote depende disso: e o que `run()`
 * devolve quando `fs_connect()` falha e a tela de credencial foi desenhada, e e
 * o unico resultado que **interrompe** o lote (`class-plugin-upgrader.php:400`,
 * *"Prevent credentials auth screen from displaying multiple times"*). Um
 * `WP_Error` fica no item e o lote segue.
 */
export type ResultadoDaExecucao = true | false | ErroDeInstalacao;

/** `'plugin'` ou `'theme'`: o `type` do `hook_extra` e de `upgrader_process_complete`. */
export type TipoDeExtensao = 'plugin' | 'theme';

/**
 * O `temp_backup` do `hook_extra` de atualizacao — a copia de seguranca que
 * T011 restaura quando a copia falha (CA-5.3).
 */
export interface CopiaDeSegurancaDaExecucao {
  readonly slug: string;
  readonly src: string;
  readonly dir: 'plugins' | 'themes';
}

/**
 * O `hook_extra` que o legado passa a `run()`, com os nomes dele: e repassado
 * intacto a `upgrader_pre_install`, `upgrader_post_install`,
 * `upgrader_clear_destination` e `upgrader_install_package_result`, logo e
 * contrato publico (P2).
 */
export interface ExtraDaExecucao {
  readonly plugin?: string;
  readonly theme?: string;
  readonly type?: TipoDeExtensao;
  readonly action?: 'install' | 'update';
  readonly temp_backup?: CopiaDeSegurancaDaExecucao;
}

/**
 * Os argumentos de `run()`, com os nomes do legado.
 *
 * `filtrosAcoplados` nomeia os metodos que o legado pendura em filtros **em
 * volta** daquela chamada e tira logo depois (`add_filter( ...,
 * array( $this, 'check_package' ) )` e afins): quem implementa `run()` precisa
 * saber quais estao ativos, e eles mudam de uma chamada para outra. Os nomes
 * sao os dos metodos do legado.
 */
export interface OpcoesDaExecucao {
  readonly tipo: TipoDeExtensao;
  /** `package` — URL do catalogo ou caminho local do arquivo enviado. */
  readonly package: string;
  readonly destination: string;
  /**
   * `clear_destination`. Na instalacao e o `overwrite_package`, que e `false`
   * ou o texto `'update-plugin'`/`'downgrade-plugin'` (e os de tema): o legado
   * passa o texto adiante sem converter (`class-plugin-upgrader.php:139`).
   */
  readonly clear_destination: boolean | string;
  readonly clear_working: boolean;
  /** `is_multi` — so o lote passa, e passa `true`. */
  readonly is_multi?: true;
  readonly hook_extra: ExtraDaExecucao;
  readonly filtrosAcoplados: readonly string[];
}

/**
 * O que acontece depois de `run()` e que nao e de US-1, por metodo do legado.
 *
 * - `install()`: `wp_clean_plugins_cache()` / `wp_clean_themes_cache()` e, com
 *   sobrescrita, a acao `upgrader_overwrote_package`
 *   (`class-plugin-upgrader.php:156`-`:170`, `class-theme-upgrader.php:270`-`:275`);
 * - `upgrade()`: a limpeza de cache e a retirada do item de
 *   `auto_plugin_theme_update_emails` (`class-plugin-upgrader.php:255`-`:266`),
 *   que e o estado de aviso de US-10;
 * - `bulk_upgrade()`: a limpeza de cache, `upgrader_process_complete` com
 *   `bulk => true` e a mesma retirada, so dos itens que deram certo
 *   (`class-plugin-upgrader.php:406`-`:445`).
 *
 * So e chamado quando o legado chega la: `install()` e `upgrade()` saem antes
 * se o resultado for falso ou erro (`:151`, `:250`).
 */
export type ConclusaoDaExecucao =
  | {
      readonly metodo: 'install';
      readonly tipo: TipoDeExtensao;
      readonly package: string;
      readonly overwrite_package: false | string;
    }
  | {
      readonly metodo: 'upgrade';
      readonly tipo: TipoDeExtensao;
      readonly item: string;
    }
  | {
      readonly metodo: 'bulk_upgrade';
      readonly tipo: TipoDeExtensao;
      readonly itens: readonly string[];
      readonly resultados: ReadonlyMap<string, ResultadoDaExecucao>;
    };

/**
 * A ligacao tardia com o `run()` do legado e com os dois passos que o lote
 * chama direto (`fs_connect()` e `maintenance_mode()`). Ver o cabecalho.
 */
export interface ExecucaoDoPacote {
  /** `WP_Upgrader::run( $options )`. */
  rodar(opcoes: OpcoesDaExecucao): ResultadoDaExecucao;
  /** `WP_Upgrader::fs_connect( $directories )` — `false` desenha a tela de credencial. */
  conectar(pastas: readonly string[]): boolean;
  /** `WP_Upgrader::maintenance_mode( $enable )`. */
  manutencao(ligar: boolean): void;
  /** O que o legado faz depois de `run()`. */
  concluir(conclusao: ConclusaoDaExecucao): void;
}

/**
 * Uma entrada de `get_site_transient( 'update_plugins' )->response` (objeto) ou
 * de `'update_themes'` (arranjo). So os campos que este caminho le.
 *
 * `requires` e `requires_php` ausentes ou nulos sao o `! isset()` do legado.
 */
export interface OfertaDeAtualizacao {
  readonly package: string;
  readonly requires?: string | null;
  readonly requires_php?: string | null;
}

/**
 * O que o ambiente responde a este caminho.
 *
 * As duas comparacoes sao `is_wp_version_compatible()` e
 * `is_php_version_compatible()` (`wp-includes/functions.php:9123` e `:9156`),
 * e chegam prontas: comparar versao e regra de US-3 (T007), e esta tarefa so as
 * chama onde o lote do legado as chama.
 */
export interface AmbienteDaInstalacao {
  /** `wp_get_wp_version()`. */
  readonly versaoDoNucleo: string;
  /** `PHP_VERSION`, como o ambiente a declara. */
  readonly versaoDoPhp: string;
  nucleoCompativel(exigida: string): boolean;
  phpCompativel(exigida: string): boolean;
  /** `get_user_locale()`. */
  readonly idiomaDoAtor: string;
  /** `home_url( '/' )`. */
  readonly enderecoDoSite: string;
  /** `wp_http_supports( array( 'ssl' ) )`. */
  readonly suportaTls: boolean;
  /** `wp_is_json_request()` — decide o aviso de TLS de `plugins_api()`. */
  readonly pedidoJson: boolean;
  /** `wp_doing_ajax()` — decide o aviso de TLS de `themes_api()`. */
  readonly pedidoAjax: boolean;
}

/** As pastas que o caminho de instalacao le, como o legado as define. */
export interface PastasDaInstalacao {
  /** `WP_CONTENT_DIR`. */
  readonly conteudo: string;
  /** `WP_PLUGIN_DIR`. */
  readonly plugins: string;
  /** `get_theme_root()` sem argumento — onde tema novo e instalado. */
  readonly temas: string;
  /** `get_theme_root( $tema )` — a raiz em que aquele tema esta. */
  raizDoTema(tema: string): string;
}

/**
 * O pacote recebido por `File_Upload_Upgrader( $form, $urlholder )`: o caminho
 * local (`package`), o nome do arquivo (`filename`) e o anexo (`id`, `0` quando
 * o pacote veio por nome e nao por anexo, `:132`).
 */
export interface PacoteEnviado {
  readonly package: string;
  readonly filename: string;
  readonly id: number;
}

/** A ligacao tardia com `File_Upload_Upgrader`. Ver o cabecalho. */
export interface RecepcaoDoPacoteEnviado {
  /**
   * O construtor. A recusa e um dos `wp_die()` dele — *"Please select a
   * file"*, o erro do envio ou *"Incompatible Archive."* (`:57` a `:136`) —, e
   * chega com a mensagem que o legado mostraria.
   */
  receber(
    formulario: 'pluginzip' | 'themezip',
    campo: 'package',
  ):
    | { readonly recebido: true; readonly pacote: PacoteEnviado }
    | { readonly recebido: false; readonly mensagem: string };
  /** `cleanup()` — apaga o anexo, ou o arquivo quando nao ha anexo (`:148`-`:155`). */
  limpar(pacote: PacoteEnviado): void;
}

/**
 * Uma acao depois da instalacao, como dado: a tela monta o link.
 *
 * O endereco e o caminho que o legado passa a `wp_nonce_url()`, a
 * `admin_url()` ou a `self_admin_url()`, com `&` e nao `&amp;` — o legado
 * escreve `&amp;` porque o texto vai direto para o atributo HTML, e escapar e da
 * borda.
 */
export interface AcaoDepoisDeInstalar {
  readonly rotulo: string;
  readonly endereco: string;
  /** Como a borda resolve o endereco: relativo a tela, `admin_url()` ou `self_admin_url()`. */
  readonly base: 'relativo' | 'admin_url' | 'self_admin_url';
  /** A acao do token embutido no endereco por `wp_nonce_url()`, quando ha. */
  readonly token: string | null;
}

/**
 * Os pontos de extensao deste caminho. Nomeados e opcionais pela mesma razao
 * dos de BC-05 e BC-09: o barramento que os dispara nao existe nesta arvore
 * (`REQ-162` esta em `do-not-rewrite.md`), e ponto sem interceptador e no-op no
 * legado. Os nomes de filtro do legado estao em cada campo (P2).
 */
export interface GanchosDaInstalacao {
  /** `plugins_api_args` (`plugin-install.php:129`). */
  readonly aoMontarConsultaDePlugin?: (
    argumentos: ArgumentosDoCatalogo,
    acao: string,
  ) => ArgumentosDoCatalogo;
  /** `plugins_api` (`:145`) — `false` deixa a consulta seguir. */
  readonly aoConsultarCatalogoDePlugins?: (
    resultado: false,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => AtalhoDoCatalogo;
  /** `plugins_api_result` (`:230`). */
  readonly aoReceberCatalogoDePlugins?: (
    resultado: RespostaDoCatalogo,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => RespostaDoCatalogo;
  /** `themes_api_args` (`wp-admin/includes/theme.php:511`). */
  readonly aoMontarConsultaDeTema?: (
    argumentos: ArgumentosDoCatalogo,
    acao: string,
  ) => ArgumentosDoCatalogo;
  /** `themes_api` (`:514`) — valor falso no sentido do PHP deixa a consulta seguir. */
  readonly aoConsultarCatalogoDeTemas?: (
    resultado: false,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => AtalhoDoCatalogo;
  /** `themes_api_result` (`theme.php:634`). */
  readonly aoReceberCatalogoDeTemas?: (
    resultado: RespostaDoCatalogo,
    acao: string,
    argumentos: ArgumentosDoCatalogo,
  ) => RespostaDoCatalogo;
  /**
   * `install_plugin_complete_actions`
   * (`class-plugin-installer-skin.php:178`): recebe as acoes, a informacao do
   * catalogo (vazia no envio) e o arquivo do plugin.
   */
  readonly aoListarAcoesDepoisDeInstalarPlugin?: (
    acoes: ReadonlyMap<string, AcaoDepoisDeInstalar>,
    informacao: unknown,
    arquivoDoPlugin: string,
  ) => ReadonlyMap<string, AcaoDepoisDeInstalar>;
  /**
   * `set_url_scheme` (`wp-includes/link-template.php:3965`), na promocao da URL
   * do catalogo para `https`: recebe a URL, o protocolo aplicado e o pedido.
   */
  readonly aoDefinirProtocoloDaUrl?: (
    url: string,
    protocolo: string,
    pedido: string,
  ) => string;
  /** `update-custom_{$action}` (`update.php:370`): a acao que a tela nao conhece. */
  readonly aoReceberAcaoPersonalizada?: (acao: string) => void;
}

/** Um valor de `$args` da consulta ao catalogo, na forma que `_http_build_query()` aceita. */
export type ValorDoCatalogo =
  | string
  | number
  | boolean
  | null
  | { readonly [chave: string]: ValorDoCatalogo };

/** O objeto `$args` de `plugins_api()`/`themes_api()`, na ordem de insercao. */
export type ArgumentosDoCatalogo = { readonly [chave: string]: ValorDoCatalogo };

/**
 * O que a consulta ao catalogo devolve: a informacao decodificada ou o
 * `WP_Error` (`plugins_api_failed`, `themes_api_failed`).
 *
 * `informacao` e `unknown` porque o legado devolve o que o servico mandou,
 * convertido em objeto: quem le o campo e quem decide o que fazer com ele, e a
 * tela le `download_link`, `name` e `version`.
 */
export type RespostaDoCatalogo =
  | { readonly ok: true; readonly informacao: unknown }
  | { readonly ok: false; readonly erro: ErroDeInstalacao };

/** O que um interceptador do atalho devolve: `false` segue para a rede. */
export type AtalhoDoCatalogo = false | RespostaDoCatalogo;

/** Tudo o que as operacoes de US-1 recebem por chamada. */
export interface ContextoDaInstalacao extends LeiturasDaPermissao {
  /** Quem pergunta, e a base de autorizacao. */
  readonly autorizacao: ContextoDeAutorizacao;
  /**
   * `wp_verify_nonce( $valor, $acao )` — o prazo do token e de BC-05 (feature
   * 001). Falso recusa, e o legado nao distingue vencido de ausente aqui.
   */
  verificarNonce(acao: string, valor: string | undefined): boolean;
  readonly ambiente: AmbienteDaInstalacao;
  readonly pastas: PastasDaInstalacao;
  /** `get_site_transient( 'update_plugins' )->response`, lida uma vez por operacao. */
  ofertasDePlugins(): ReadonlyMap<string, OfertaDeAtualizacao>;
  /** `get_site_transient( 'update_themes' )->response`. */
  ofertasDeTemas(): ReadonlyMap<string, OfertaDeAtualizacao>;
  /** `is_plugin_active( $plugin )`. */
  pluginAtivo(plugin: string): boolean;
  /** `get_stylesheet()`. */
  readonly folhaDeEstiloAtiva: string;
  /** `get_template()`. */
  readonly modeloAtivo: string;
  readonly execucao: ExecucaoDoPacote;
  readonly recepcao: RecepcaoDoPacoteEnviado;
  /**
   * `wp_trigger_error( $funcao, $mensagem, $nivel )` — o aviso da repeticao em
   * canal sem cifra. E so escrita (P7): nenhum ramo deste caminho olha o que
   * ela fez. O nivel depende de `headers_sent()` e `WP_DEBUG`, que sao da borda.
   */
  dispararErro(funcao: string, mensagem: string): void;
  readonly ganchos?: GanchosDaInstalacao;
}
