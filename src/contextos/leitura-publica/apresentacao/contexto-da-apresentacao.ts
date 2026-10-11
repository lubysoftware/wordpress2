/**
 * O contexto da escolha de apresentacao: tudo que `template-loader.php` e
 * `wp-includes/template.php` leem de fora e que **nao e** porta deste modulo.
 *
 * Entrega de **T005** (US-2). Mesma forma e mesmas razoes de
 * `../consulta/contexto-da-consulta.ts`:
 *
 * - **contexto por argumento, nao estado de modulo** (BR-MIGRAR-105,
 *   `EXT-CONTEXTO`): tema ativo, opcoes do site e registros de tipo sao escopo
 *   de REQUISICAO, e nesta feature o vazamento apareceria como um visitante
 *   recebendo a pagina de outro;
 * - **as colaboracoes entre contextos chegam aqui**, porque a regra de
 *   dependencia 3 de `target_architecture.md` proibe `contextos/<a>/` importar
 *   `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * ## O que esta etapa precisa de fora, e de quem e cada coisa
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `get_stylesheet_directory()`, `get_template_directory()`, `file_exists()` | `plataforma/tema`, feature 009 | {@link ContextoDaApresentacao.tema} |
 * | `get_post_type_object()` (`template.php:182`) | `plataforma/tipos-de-conteudo` | {@link ContextoDaApresentacao.tiposDeConteudo} |
 * | `get_option( 'show_on_front' )` e `page_on_front` (`class-wp-query.php:4498-4501`) | `plataforma/opcoes` | {@link ContextoDaApresentacao.configuracao} |
 * | `get_page_by_path()` (`class-wp-query.php:4606`) | BC-01 | {@link ContextoDaApresentacao.conteudoPorCaminho} |
 * | `get_page_template_slug()` (`template.php:473` e `:559`) | BC-01, pelo metadado `_wp_page_template` | {@link ContextoDaApresentacao.modeloDeclaradoNoConteudo} |
 * | `get_post_format()` (`template.php:608`) | BC-02, pela taxonomia `post_format` | {@link ContextoDaApresentacao.formatoDoConteudo} |
 * | `get_userdata()` (`class-wp.php:681`) | BC-01, feature 001 | {@link ContextoDaApresentacao.dadosDaConta} |
 * | `wp_using_themes()` (`load.php:1763`) | `plataforma/rotas`, pela constante `WP_USE_THEMES` | {@link ContextoDaApresentacao.usandoTemas} |
 * | `$_SERVER['REQUEST_METHOD']` (`template-loader.php:36`) | borda HTTP | {@link ContextoDaApresentacao.metodoHttp} |
 *
 * ## Tres coisas que NAO estao aqui, e cada uma tem motivo
 *
 * 1. **A autorizacao.** UC-01: *"nao ha verificacao de capacidade"*. O unico
 *    lugar em que `template-loader.php` pergunta capacidade e **depois** da
 *    escolha, no ramo em que nenhum modelo pode ser incluido e quem pode trocar
 *    tema recebe os erros do tema (`:133-137`, `current_user_can(
 *    'switch_themes' )`). Esse ramo e da inclusao, nao da escolha — ver
 *    `./escolher-apresentacao.ts`.
 * 2. **O relogio.** `template-loader.php` nao le o tempo em nenhuma das suas 140
 *    linhas, e a pos-condicao de UC-01 e *"nada muda no armazenamento"*.
 * 3. **O cache.** `locate_template()` pergunta ao sistema de arquivos a cada
 *    candidato, sem cache nenhum; `wp_normalize_path()` tem o seu, estatico e
 *    por processo (`functions.php:2197`), e num processo por requisicao ele nasce
 *    e morre com a resposta. Reproduzi-lo aqui nao muda resultado e guardaria
 *    estado de modulo onde BR-MIGRAR-105 nao o admite.
 */

import type { ConteudoPorCaminho } from '../consulta/conteudo-consultado.js';
import {
  CONFIGURACAO_DE_FABRICA,
  type ConfiguracaoDoSiteNaConsulta,
} from '../consulta/contexto-da-consulta.js';
import {
  REGISTRO_SEM_TIPOS,
  type RegistroDeTiposDeConteudo,
} from '../consulta/registro-consultavel.js';
import { TEMA_SEM_MODELOS, type TemaAtivo } from './tema-ativo.js';

/**
 * `get_page_template_slug( $conteudo )`
 * (`wp-includes/post-template.php:1904-1918`).
 *
 * Devolve o metadado `_wp_page_template` do conteudo, **cru**: o tratamento de
 * `'default'` e de valor vazio e do nucleo e esta em
 * `./hierarquia-de-modelos.ts`, na posicao de `:1913-1915`.
 *
 * Recebe o identificador, e nao o registro, porque e assim que o legado consulta
 * — `get_post_meta( $post->ID, '_wp_page_template', true )` (`:1911`).
 *
 * ⚠️ **Ausente, o conteudo nao declara modelo**, e isso e o estado de fabrica de
 * todo conteudo: o metadado e gravado pela tela de edicao, e numa instalacao
 * nova nenhuma linha de `postmeta` o tem.
 */
export type ModeloDeclaradoNoConteudo = (idDoConteudo: number) => string;

/**
 * `get_post_format( $conteudo )`
 * (`wp-includes/post-formats.php:17-37`).
 *
 * Devolve o identificador do formato **sem** o prefixo `post-format-`
 * (`:36`), ou texto vazio quando o conteudo nao tem formato — que e o `false`
 * das tres saidas de `:21`, `:25` e `:31`. No unico ponto de chamada desta
 * feature o teste e `if ( $post_format )` (`template.php:609`), e `false` e
 * texto vazio valem o mesmo ali.
 *
 * ⚠️ **Ausente, nenhum conteudo tem formato**, que e o estado de fabrica: a
 * taxonomia `post_format` nasce sem termo, e `post_type_supports( 'post',
 * 'post-formats' )` depende do tema declarar o suporte.
 */
export type FormatoDoConteudo = (idDoConteudo: number) => string;

/**
 * `get_userdata( $id )` (`wp-includes/pluggable.php`), chamada por
 * `WP::register_globals()` em `wp-includes/class-wp.php:681`.
 *
 * `unknown` pelo mesmo motivo de `ResultadoDaConsulta.objetoConsultado`: o
 * global `$authordata` e publicado para o tema ler, e **nada neste modulo le o
 * conteudo dele**. Quem le e o tema, na feature 009.
 *
 * ⚠️ **Ausente, nenhuma conta e encontrada**, que e o `false` de `get_userdata`
 * para identificador que nao existe — e o legado publica esse `false` no global
 * sem testar.
 */
export type DadosDaConta = (id: number) => unknown;

/**
 * O contexto completo da escolha de apresentacao.
 *
 * Todos os campos sao opcionais, e a ausencia de cada um tem significado
 * declarado — nenhum deles e "ainda nao implementado":
 *
 * | ausente | o que significa |
 * |---|---|
 * | `tema` | nenhum arquivo de modelo existe; ver `TEMA_SEM_MODELOS` |
 * | `tiposDeConteudo` | nenhum tipo registrado: `is_post_type_archive` nao resolve objeto de tipo e a regra de arquivo de tipo devolve vazio (`template.php:183-185`) |
 * | `configuracao` | os cinco valores de fabrica de uma instalacao nova de site unico |
 * | `conteudoPorCaminho` | nenhuma pagina casa o caminho, que e o que o legado faz quando a pagina nao existe |
 * | `modeloDeclaradoNoConteudo` | nenhum conteudo declara modelo proprio |
 * | `formatoDoConteudo` | nenhum conteudo tem formato |
 * | `dadosDaConta` | nenhuma conta e encontrada |
 * | `usandoTemas` | **verdadeiro**: `index.php` define `WP_USE_THEMES` (`index.php:14`), e toda leitura publica entra por ele |
 * | `metodoHttp` | `GET` |
 */
export interface ContextoDaApresentacao {
  readonly tema?: TemaAtivo;
  readonly tiposDeConteudo?: RegistroDeTiposDeConteudo;
  readonly configuracao?: ConfiguracaoDoSiteNaConsulta;
  readonly conteudoPorCaminho?: ConteudoPorCaminho;
  readonly modeloDeclaradoNoConteudo?: ModeloDeclaradoNoConteudo;
  readonly formatoDoConteudo?: FormatoDoConteudo;
  readonly dadosDaConta?: DadosDaConta;
  /**
   * `wp_using_themes()` — `defined( 'WP_USE_THEMES' ) && WP_USE_THEMES`
   * (`wp-includes/load.php:1771`).
   *
   * ⚠️ Decide **duas** coisas em posicoes diferentes de `template-loader.php`: o
   * ponto de acao `template_redirect`, no comeco (`:7-24`), e o laco de modelos
   * inteiro (`:65`). As quatro superficies do meio — robots, favicon, feed e
   * notificacao de link — rodam **nos dois casos**, e o comentario do legado diz
   * por que: *"Process feeds and trackbacks even if not using themes"* (`:40`).
   */
  readonly usandoTemas?: boolean;
  /**
   * `$_SERVER['REQUEST_METHOD']` (`template-loader.php:36`).
   *
   * Lido uma vez, para a saida antecipada de requisicao `HEAD`.
   */
  readonly metodoHttp?: string;
}

/** O contexto com todos os defaults da tabela acima resolvidos. */
export interface ContextoDaApresentacaoResolvido {
  readonly tema: TemaAtivo;
  readonly tiposDeConteudo: RegistroDeTiposDeConteudo;
  readonly configuracao: ConfiguracaoDoSiteNaConsulta;
  readonly conteudoPorCaminho: ConteudoPorCaminho;
  readonly modeloDeclaradoNoConteudo: ModeloDeclaradoNoConteudo;
  readonly formatoDoConteudo: FormatoDoConteudo;
  readonly dadosDaConta: DadosDaConta;
  readonly usandoTemas: boolean;
  readonly metodoHttp: string;
}

/** O metodo de uma leitura publica quando ninguem informa outro. */
export const METODO_PADRAO = 'GET';

/**
 * Resolve as ausencias do contexto nos defaults da tabela acima.
 *
 * Nao toca em colaborador nenhum: resolver o contexto e so amarrar
 * dependencias, como `contextoResolvido` de `../consulta/` faz com o dela.
 */
export function contextoDaApresentacaoResolvido(
  contexto: ContextoDaApresentacao = {},
): ContextoDaApresentacaoResolvido {
  return {
    tema: contexto.tema ?? TEMA_SEM_MODELOS,
    tiposDeConteudo: contexto.tiposDeConteudo ?? REGISTRO_SEM_TIPOS,
    configuracao: contexto.configuracao ?? CONFIGURACAO_DE_FABRICA,
    conteudoPorCaminho: contexto.conteudoPorCaminho ?? (() => undefined),
    modeloDeclaradoNoConteudo: contexto.modeloDeclaradoNoConteudo ?? (() => ''),
    formatoDoConteudo: contexto.formatoDoConteudo ?? (() => ''),
    dadosDaConta: contexto.dadosDaConta ?? (() => undefined),
    usandoTemas: contexto.usandoTemas ?? true,
    metodoHttp: contexto.metodoHttp ?? METODO_PADRAO,
  };
}
