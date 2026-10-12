/**
 * O contexto da pre-busca: tudo que `wp-includes/speculative-loading.php` le de
 * fora e que **nao e** porta deste modulo.
 *
 * Entrega de **T015** (US-7). Mesma forma e mesmas razoes de
 * `../consulta/contexto-da-consulta.ts` e `../apresentacao/contexto-da-apresentacao.ts`:
 *
 * - **contexto por argumento, nao estado de modulo** (BR-MIGRAR-105,
 *   `EXT-CONTEXTO`): quem esta autenticado, as opcoes do site e os caminhos da
 *   instalacao sao escopo de REQUISICAO, e nesta feature o vazamento apareceria
 *   como um visitante recebendo a declaracao resolvida para outro — que aqui
 *   seria pior do que receber a pagina errada, porque a declaracao e o que o
 *   navegador vai **buscar sozinho**;
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
 * | `is_user_logged_in()` (`:28`) | BC-01, identidade, feature 001 | {@link ContextoDaPreBusca.alguemAutenticado} |
 * | `get_option( 'permalink_structure' )` (`:28` e `:221`) | `plataforma/opcoes` | {@link ContextoDaPreBusca.configuracaoDoSite} |
 * | `home_url()`, `site_url()`, `content_url()`, `plugins_url()` (`class-wp-url-pattern-prefixer.php:113-117`) | idem | {@link ContextoDaPreBusca.caminhosDaInstalacao} |
 * | `wp_upload_dir()` (`:115`) | BC-04, midia | idem |
 * | `get_stylesheet_directory_uri()`, `get_template_directory_uri()` (`:118-119`) | `plataforma/tema`, feature 009 | idem |
 * | `getenv()` e `constant()` (`speculative-loading.php:163` e `:171`) | borda de implantacao | {@link ContextoDaPreBusca.variavelDeAmbiente} e {@link ContextoDaPreBusca.constante} |
 *
 * ## Quatro coisas que NAO estao aqui, e cada uma tem motivo
 *
 * 1. **A autorizacao.** UC-01: *"nao ha verificacao de capacidade"*. E
 *    `is_user_logged_in()` nao e uma: e a pergunta "ha alguem autenticado", que
 *    o legado usa para **desligar** a pre-busca, nunca para conceder acesso. A
 *    razao esta por extenso em `./configuracao-da-pre-busca.ts`.
 * 2. **O relogio.** `speculative-loading.php` nao le o tempo em nenhuma das
 *    suas 343 linhas, e a pos-condicao de UC-01 e *"nada muda no
 *    armazenamento"*. A pre-busca nao tem prazo, e inventar um seria introduzir
 *    numero que o legado nao tem (P6, tabela *Nao negociavel*).
 * 3. **O limite de quantos destinos sao declarados.** Nao existe: a regra do
 *    nucleo e um padrao (`/*` prefixado) com uma lista de excecoes, nao uma
 *    lista de destinos. P6 outra vez — *"onde o legado nao tem numero, o
 *    sistema novo tambem nao tem"*.
 * 4. **O cache.** Nenhuma das quatro funcoes guarda resultado. `permalink_structure`
 *    e lida duas vezes na mesma chamada (`:28` e `:221`) e o legado **nao**
 *    memoriza o valor entre as duas; reproduzi-lo com uma leitura so mudaria o
 *    numero de toques na opcao, que e observavel por quem filtra `option_*`.
 */

import {
  CONFIGURACAO_DE_FABRICA,
  type ConfiguracaoDoSiteNaConsulta,
} from '../consulta/contexto-da-consulta.js';
import type {
  LeituraDeAmbiente,
  LeituraDeConstante,
} from './configuracao-da-pre-busca.js';
import {
  CAMINHOS_SEM_PATH,
  type CaminhosDaInstalacao,
} from './padrao-de-endereco.js';

/**
 * O contexto completo da pre-busca.
 *
 * Todos os campos sao opcionais, e a ausencia de cada um tem significado
 * declarado — nenhum deles e "ainda nao implementado":
 *
 * | ausente | o que significa |
 * |---|---|
 * | `alguemAutenticado` | **falso**: ninguem autenticado, que e o visitante de UC-01 |
 * | `configuracaoDoSite` | os cinco valores de fabrica de uma instalacao nova de site unico — e com eles a pre-busca nasce **desligada** |
 * | `caminhosDaInstalacao` | os sete enderecos sem caminho; ver `CAMINHOS_SEM_PATH` |
 * | `variavelDeAmbiente` | `getenv()` nao existe no sistema (`function_exists` falso, `:162`) |
 * | `constante` | nenhuma das duas constantes esta definida |
 */
export interface ContextoDaPreBusca {
  /** `is_user_logged_in()` (`speculative-loading.php:28`). */
  readonly alguemAutenticado?: boolean;
  /**
   * As opcoes do site, das quais esta etapa le **uma**:
   * `ConfiguracaoDoSiteNaConsulta.formaDosEnderecos`.
   *
   * O tipo inteiro e reusado, e nao recortado, porque e o mesmo tipo que
   * `../consulta/` e `../apresentacao/` recebem: um recorte proprio faria tres
   * nomes para a mesma opcao, e a opcao e uma.
   */
  readonly configuracaoDoSite?: ConfiguracaoDoSiteNaConsulta;
  /** Os sete caminhos de `WP_URL_Pattern_Prefixer::get_default_contexts()`. */
  readonly caminhosDaInstalacao?: CaminhosDaInstalacao;
  readonly variavelDeAmbiente?: LeituraDeAmbiente;
  readonly constante?: LeituraDeConstante;
}

/** O contexto com todos os defaults da tabela acima resolvidos. */
export interface ContextoDaPreBuscaResolvido {
  readonly alguemAutenticado: boolean;
  readonly configuracaoDoSite: ConfiguracaoDoSiteNaConsulta;
  readonly caminhosDaInstalacao: CaminhosDaInstalacao;
  readonly variavelDeAmbiente: LeituraDeAmbiente;
  readonly constante: LeituraDeConstante;
}

/**
 * Resolve as ausencias do contexto nos defaults da tabela acima.
 *
 * Nao toca em colaborador nenhum: resolver o contexto e so amarrar
 * dependencias, como `contextoDaApresentacaoResolvido` faz com o dele.
 */
export function contextoDaPreBuscaResolvido(
  contexto: ContextoDaPreBusca = {},
): ContextoDaPreBuscaResolvido {
  return {
    alguemAutenticado: contexto.alguemAutenticado ?? false,
    configuracaoDoSite: contexto.configuracaoDoSite ?? CONFIGURACAO_DE_FABRICA,
    caminhosDaInstalacao: contexto.caminhosDaInstalacao ?? CAMINHOS_SEM_PATH,
    variavelDeAmbiente: contexto.variavelDeAmbiente ?? (() => undefined),
    constante: contexto.constante ?? (() => undefined),
  };
}
