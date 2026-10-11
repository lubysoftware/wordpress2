/**
 * O contexto de uma consulta de conteudo: tudo que a etapa 3 de UC-01 precisa e
 * que **nao e** porta deste modulo.
 *
 * Entrega de **T003** (US-1). Mesma forma e mesmas razoes de
 * `contextos/conteudo/publicacao/contexto-de-publicacao.ts`:
 *
 * - **contexto por argumento, nao estado de modulo.** BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poe identidade, consulta corrente, conexao e requisicao no
 *   escopo da REQUISICAO. Nesta feature isso e mais grave do que parece: o
 *   vazamento apareceria como um visitante recebendo a pagina resolvida para
 *   outro, e o cenario `@concorrencia` de `PT-011` cobra exatamente isso —
 *   *"duas leituras que pedem recortes diferentes da mesma superficie... nenhuma
 *   contem elemento do recorte da outra"*;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** A regra
 *   de dependencia 3 de `target_architecture.md` proibe `contextos/<a>/`
 *   importar `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * # O que `WP::query_posts()` precisa de fora, e de quem e cada coisa
 *
 * | o que o legado chama | de quem e | como chega aqui |
 * |---|---|---|
 * | `get_post_types( array(), 'objects' )` | `plataforma/tipos-de-conteudo`, que **nao existe nesta arvore** | {@link ContextoDaConsulta.tiposDeConteudo} |
 * | `get_taxonomies( array(), 'objects' )` | BC-02, classificacao | {@link ContextoDaConsulta.taxonomias} |
 * | a consulta a `posts` | BC-01, conteudo | {@link ContextoDaConsulta.repositorio} |
 * | `get_page_by_path()` | BC-01 | {@link ContextoDaConsulta.conteudoPorCaminho} |
 * | `get_option( 'show_on_front' )` e as tres irmas | `plataforma/opcoes`, que tambem nao existe | {@link ContextoDaConsulta.configuracao} |
 * | `is_admin()` | `plataforma/rotas` | {@link ContextoDaConsulta.noPainel} |
 * | `wp_is_serving_rest_request()` | `plataforma/rotas` | {@link ContextoDaConsulta.servindoRequisicaoRest} |
 * | `is_user_member_of_blog()` | BC-06, rede | {@link ContextoDaConsulta.contaMembroDoSite} |
 * | `sanitize_term_field()` | BC-02 | {@link ContextoDaConsulta.saneamentoDeIdentificadorDeTermo} |
 *
 * # Tres coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **A autorizacao.** UC-01 e literal: *"nao ha verificacao de capacidade. O
 *    portao e o `post_status`"*. O portao e **T009** (US-4) e e ele que traz
 *    `plataforma/autorizacao/` para dentro desta feature — por `import`, que a
 *    regra de dependencia 1 permite, e nao por campo aqui. Pedir a matriz de
 *    capacidades em T003 convidaria a fechar a cara publica do produto.
 * 2. **O relogio.** A pos-condicao de UC-01 e *"nada muda no armazenamento"* e
 *    *"o contador de visualizacoes nao existe"*. `parse_query` nao le o tempo em
 *    nenhuma das suas 354 linhas: o recorte de data que ele monta vem **do
 *    endereco**, nunca de agora. Um relogio aqui abriria a porta para
 *    `post_date <= NOW()`, que e decisao do SQL de `get_posts()`.
 * 3. **O cache por requisicao.** O slot existe no `plan.md` desta feature e nao
 *    ha cache nesta arvore. `WP_Query` consulta o cache de objeto em
 *    `class-wp-query.php:3200` em diante, dentro de `get_posts()`, que e do
 *    repositorio: quem o implementar decide, e a resposta 1 de `questions.md` ja
 *    fixou que o default de fabrica **nao persiste nada entre requisicoes**.
 */

import type { ConteudoPorCaminho, RepositorioDeConteudoPublico } from './conteudo-consultado.js';
import type { SaneamentoDeIdentificadorDeTermo } from './consulta-de-taxonomia.js';
import {
  REGISTRO_SEM_TAXONOMIAS,
  REGISTRO_SEM_TIPOS,
  type RegistroDeTaxonomias,
  type RegistroDeTiposDeConteudo,
} from './registro-consultavel.js';

/**
 * As quatro opcoes do site que `parse_query` le, com o valor de fabrica de cada
 * uma.
 *
 * As quatro decidem **so** a correcao de predicados de `class-wp-query.php:1057-1121`
 * — o bloco que o proprio legado abre e fecha com comentario, *"Correct `is_*`
 * for 'page_on_front' and 'page_for_posts'"*. Com os valores de fabrica, o bloco
 * inteiro nao tem efeito: `show_on_front` nasce em `'posts'`
 * (`wp-admin/includes/schema.php:476`) e as tres paginas nascem em zero (`:518`,
 * `:519` e `:536`).
 *
 * E o quinto campo, a forma dos enderecos, e lido por `parse_query` em `:1083` e
 * por `wp_resolve_numeric_slug_conflicts()` em `wp-includes/rewrite.php:387`.
 */
export interface ConfiguracaoDoSiteNaConsulta {
  /**
   * `get_option( 'show_on_front' )` — `'posts'` ou `'page'`.
   *
   * Valor de fabrica: `'posts'` (`schema.php:476`).
   */
  readonly mostrarNaFrente: string;
  /** `get_option( 'page_on_front' )`. Fabrica: 0 (`schema.php:519`). */
  readonly paginaDaFrente: number;
  /** `get_option( 'page_for_posts' )`. Fabrica: 0 (`schema.php:518`). */
  readonly paginaDeConteudos: number;
  /**
   * `get_option( 'wp_page_for_privacy_policy' )`. Fabrica: 0 (`schema.php:536`).
   */
  readonly paginaDePoliticaDePrivacidade: number;
  /**
   * `get_option( 'permalink_structure' )`.
   *
   * Fabrica em site unico: **texto vazio** (`schema.php:443`); em rede,
   * `'/%year%/%monthnum%/%day%/%postname%/'` (`:576`). E a mesma opcao que
   * decide se existe tabela de regras de traducao — ver
   * `../traducao-de-endereco/tabela-de-regras.ts`.
   */
  readonly formaDosEnderecos: string;
}

/** O valor que `show_on_front` tem quando a frente e uma pagina estatica. */
export const FRENTE_COMO_PAGINA = 'page';

/**
 * A configuracao de uma instalacao nova de site unico, com os cinco valores de
 * fabrica (P6: *"todo prazo, contagem e limite vem do legado, com o valor de
 * fabrica"*).
 */
export const CONFIGURACAO_DE_FABRICA: ConfiguracaoDoSiteNaConsulta =
  Object.freeze({
    mostrarNaFrente: 'posts',
    paginaDaFrente: 0,
    paginaDeConteudos: 0,
    paginaDePoliticaDePrivacidade: 0,
    formaDosEnderecos: '',
  });

/**
 * `is_user_member_of_blog( $conta )`
 * (`wp-includes/user.php`, chamado em `wp-includes/class-wp.php:788`).
 *
 * Decide **uma** coisa, e e no terceiro ramo de `handle_404`: *"Don't 404 for
 * authors without posts as long as they matched an author on this site"*. Logo
 * um arquivo de autor que existe e nao publicou nada responde 200, e um arquivo
 * de autor que nao existe responde 404 — e essa diferenca e observavel por
 * buscador.
 *
 * ⚠️ **Ausente, a resposta e nao**, e essa e a resposta do legado para uma conta
 * que nao e membro. A consequencia esta registrada no README do modulo.
 */
export type ContaMembroDoSite = (conta: number) => boolean;

/**
 * O contexto completo de uma consulta de conteudo.
 *
 * Todos os campos sao opcionais, e a ausencia de cada um tem significado
 * declarado — nenhum deles e "ainda nao implementado":
 *
 * | ausente | o que significa |
 * |---|---|
 * | `tiposDeConteudo` | nenhum tipo registrado: nenhum `post_type` sobrevive ao filtro de `class-wp.php:377-387` |
 * | `taxonomias` | nenhuma taxonomia registrada: nenhuma clausula de termo, e `is_category`/`is_tag`/`is_tax` ficam falsos |
 * | `repositorio` | a consulta nao encontra conteudo, que e o estado de `posts` sem linha que casa |
 * | `conteudoPorCaminho` | nenhuma pagina casa o caminho, que e o que o legado faz quando a pagina nao existe |
 * | `configuracao` | os cinco valores de fabrica de uma instalacao nova de site unico |
 * | `noPainel` | a consulta nao roda no painel, que e o caso de toda leitura publica |
 * | `servindoRequisicaoRest` | a requisicao nao e da API, idem |
 * | `consultaPrincipal` | **verdadeiro**: `WP::query_posts()` consulta sempre a principal (`class-wp.php:704`, `$wp_the_query`) |
 * | `contaMembroDoSite` | nenhuma conta e membro |
 * | `saneamentoDeIdentificadorDeTermo` | o identificador e usado como veio — lacuna declarada, ver `./consulta-de-taxonomia.ts` |
 */
export interface ContextoDaConsulta {
  readonly tiposDeConteudo?: RegistroDeTiposDeConteudo;
  readonly taxonomias?: RegistroDeTaxonomias;
  readonly repositorio?: RepositorioDeConteudoPublico;
  readonly conteudoPorCaminho?: ConteudoPorCaminho;
  readonly configuracao?: ConfiguracaoDoSiteNaConsulta;
  /** `is_admin()` — `class-wp.php:364` e `class-wp-query.php:1036`. */
  readonly noPainel?: boolean;
  /** `wp_is_serving_rest_request()` — `class-wp-query.php:1052`. */
  readonly servindoRequisicaoRest?: boolean;
  /** `$this->is_main_query()` — `class-wp-query.php:1052`. */
  readonly consultaPrincipal?: boolean;
  readonly contaMembroDoSite?: ContaMembroDoSite;
  readonly saneamentoDeIdentificadorDeTermo?: SaneamentoDeIdentificadorDeTermo;
}

/** O contexto com todos os defaults declarados acima resolvidos. */
export interface ContextoDaConsultaResolvido {
  readonly tiposDeConteudo: RegistroDeTiposDeConteudo;
  readonly taxonomias: RegistroDeTaxonomias;
  readonly conteudoPorCaminho: ConteudoPorCaminho;
  readonly configuracao: ConfiguracaoDoSiteNaConsulta;
  readonly noPainel: boolean;
  readonly servindoRequisicaoRest: boolean;
  readonly consultaPrincipal: boolean;
  readonly contaMembroDoSite: ContaMembroDoSite;
}

/**
 * Resolve as ausencias do contexto nos defaults da tabela acima.
 *
 * Nao toca em colaborador nenhum: resolver o contexto e so amarrar
 * dependencias, como `criarModuloDeLeituraPublica` faz com as portas.
 */
export function contextoResolvido(
  contexto: ContextoDaConsulta = {},
): ContextoDaConsultaResolvido {
  return {
    tiposDeConteudo: contexto.tiposDeConteudo ?? REGISTRO_SEM_TIPOS,
    taxonomias: contexto.taxonomias ?? REGISTRO_SEM_TAXONOMIAS,
    conteudoPorCaminho: contexto.conteudoPorCaminho ?? (() => undefined),
    configuracao: contexto.configuracao ?? CONFIGURACAO_DE_FABRICA,
    noPainel: contexto.noPainel ?? false,
    servindoRequisicaoRest: contexto.servindoRequisicaoRest ?? false,
    consultaPrincipal: contexto.consultaPrincipal ?? true,
    contaMembroDoSite: contexto.contaMembroDoSite ?? (() => false),
  };
}
