/**
 * O contexto da senha de conteudo: tudo que US-6 precisa e que **nao e** porta
 * deste modulo.
 *
 * Entrega de **T013** (US-6). Mesma forma e mesmas razoes de
 * `../consulta/contexto-da-consulta.ts`:
 *
 * - **contexto por argumento, nao estado de modulo.** BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poe identidade, consulta corrente, conexao e requisicao no
 *   escopo da REQUISICAO — e aqui isso e mais grave do que em qualquer outra
 *   area desta feature: o {@link ContextoDaSenhaDeConteudo.atestado} e o cookie
 *   de **um** visitante. Guardado no modulo, ele liberaria o corpo para o
 *   visitante seguinte;
 * - **as colaboracoes entre contextos chegam aqui, e nao como porta.** A regra
 *   de dependencia 3 de `target_architecture.md` proibe `contextos/<a>/`
 *   importar `contextos/<b>/` *"sempre, sem excecao"*.
 *
 * ---
 *
 * # O que o portao de senha precisa de fora, e de quem e cada coisa
 *
 * | o que o legado chama | onde | de quem e |
 * |---|---|---|
 * | `$_COOKIE[ 'wp-postpass_' . COOKIEHASH ]` | `post-template.php:890` e `:898` | da borda HTTP: cookie e cabecalho sao borda (AD-08) |
 * | `COOKIEHASH` | `default-constants.php:249-254` | `plataforma/opcoes` mais a borda: e `md5( get_site_option( 'siteurl' ) )` |
 * | `current_user_can( 'edit_post', $id )` | `class-wp-rest-posts-controller.php:204` e `:641` | `plataforma/autorizacao/`, por capacidade e **nunca** por nome de papel (P3) |
 * | `get_permalink( $post->ID )` | `post-template.php:1789` e `:1808` | `plataforma/rotas` mais BC-01 |
 * | `wp_get_raw_referer()` | `post-template.php:1789` | borda HTTP |
 * | `site_url( 'wp-login.php?action=postpass', 'login_post' )` | `post-template.php:1826` | `plataforma/opcoes` mais `plataforma/rotas` |
 * | `wp_is_block_theme()` | `post-template.php:1815` | `plataforma/tema`, feature 009 |
 * | `wp_style_is()` e `wp_enqueue_style()` | `post-template.php:1820-1822` | o registro de estilos, feature 009 |
 * | `is_admin()` | `post-template.php:124` | `plataforma/rotas` |
 * | `wp_rand()` | `post-template.php:1781` | `plataforma/`, e aqui injetavel para o teste |
 *
 * # Duas coisas que NAO estao neste contexto, e cada uma tem motivo
 *
 * 1. **O relogio, no lado da leitura.** A resposta 8 de `questions.md` fixa os
 *    tres fatos do atestado — *"dez dias no navegador, sem verificacao de idade
 *    no servidor, sem limite de tentativa"* —, e `post_password_required()` nao
 *    le tempo em nenhuma das suas 33 linhas. O relogio aparece **so** na
 *    gravacao, onde o legado o le (`wp-login.php:781`), e por isso ele e
 *    argumento de `gravarAtestadoDeSenha` e nao campo daqui: um relogio neste
 *    contexto convidaria a conferir a idade do atestado, que e justamente o
 *    numero que o legado nao tem (P6).
 * 2. **O contador de tentativa.** Nao existe no legado, e inventa-lo esta na
 *    tabela *Nao negociavel* da constituicao — *"introduzir limite de taxa,
 *    prazo de retencao ou qualquer numero que o legado nao tem"*. REQ-044, o
 *    card que pediria os tres numeros, esta em `do-not-rewrite.md`.
 */

import { randomInt } from 'node:crypto';

import {
  HASH_DO_ATESTADO_DO_NUCLEO,
  type HashDoAtestado,
} from './hash-do-atestado.js';

/** O teto de `wp_rand()` sem argumento (`wp-includes/pluggable.php:3016`). */
export const TETO_DO_SORTEIO = 4294967295;

/**
 * `current_user_can( 'edit_post', $id )` sobre o conteudo protegido.
 *
 * ⚠️ **O portao de senha nao chama isto, e e isso que CA-6.1 e UT-043-8
 * afirmam.** `post_password_required()` nao tem uma unica chamada de capacidade
 * (`post-template.php:882-915`), e BR-MIGRAR-098 (`PERM-12`) registra a senha de
 * conteudo entre os **cinco** pontos que decidem acesso sem consultar o modelo de
 * capacidades. Quem chama isto e o interceptador que a superficie REST instala
 * (`check_password_required`, `class-wp-rest-posts-controller.php:188-205`), que
 * e por onde CA-6.4 acontece — ver `./senha-exigida.ts`.
 */
export type PodeEditarConteudo = (idDoConteudo: number) => boolean;

/**
 * `get_permalink( $id )` — o endereco publico do conteudo.
 *
 * O formulario o usa em dois lugares: no campo `redirect_to`
 * (`post-template.php:1808`) e na comparacao com o remetente que detecta senha
 * errada (`:1789`). ⚠️ **Ausente, as duas coisas desaparecem** — o formulario sai
 * sem `redirect_to` e sem o aviso de senha invalida, que e exatamente o que o
 * legado faz quando o registro nao tem identificador (`! empty( $post->ID )` nas
 * duas linhas).
 */
export type EnderecoDoConteudo = (idDoConteudo: number) => string;

/**
 * `site_url( $caminho, $esquema )` (`post-template.php:1826`).
 *
 * O destino do formulario e `wp-login.php?action=postpass` no esquema
 * `login_post`, e os dois chegam por argumento porque a resolucao de esquema e
 * de `plataforma/opcoes`: o `login_post` escolhe HTTPS quando a instalacao forca
 * HTTPS no login, e essa escolha muda o atributo `secure` do atestado gravado
 * depois (`wp-login.php:783-787`).
 */
export type EnderecoDoSite = (caminho: string, esquema: string) => string;

/** O contexto completo da senha de conteudo. */
export interface ContextoDaSenhaDeConteudo {
  /**
   * O valor do cookie de atestado **como ele chegou**, ou ausente quando o
   * visitante nao mandou cookie nenhum.
   *
   * ⚠️ Escopo de REQUISICAO. E a distincao entre ausente e presente-mas-errado
   * que o legado observa: ausente devolve verdadeiro no segundo ramo
   * (`post-template.php:890-892`), presente e errado devolve verdadeiro no
   * quarto (`:902`) — e o formulario **so** mostra *"Invalid password."* no
   * segundo caso (`:1789`).
   *
   * No legado ele passa por `wp_unslash()` (`:898`), que nesta arvore e
   * identidade: nada aqui acrescenta barra invertida de entrada, e e a mesma
   * anotacao de `contextos/conteudo/gravacao/campos-na-gravacao.ts:54`.
   */
  readonly atestado?: string;
  /**
   * `COOKIEHASH` (`default-constants.php:249-254`): `md5( siteurl )`, ou **texto
   * vazio** quando a instalacao nao tem `siteurl` gravado — o legado define as
   * duas coisas, e a segunda e o ramo de `:254`.
   */
  readonly hashDoCookie?: string;
  readonly hashDoAtestado?: HashDoAtestado;
  readonly podeEditarConteudo?: PodeEditarConteudo;
  readonly enderecoDoConteudo?: EnderecoDoConteudo;
  /** `wp_get_raw_referer()` (`post-template.php:1789`). */
  readonly remetenteDaRequisicao?: string;
  readonly enderecoDoSite?: EnderecoDoSite;
  /**
   * `wp_is_block_theme()` (`post-template.php:1815`).
   *
   * **Nasce verdadeiro, e esse e o valor de fabrica** (P6): o instalador ativa
   * `WP_DEFAULT_THEME`, que e `twentytwentyfive`
   * (`default-constants.php:437`), e esse tema tem `templates/*.html`, logo
   * `wp_get_theme()->is_block_theme()` responde verdadeiro. ⚠️ O legado tem um
   * segundo caminho para o falso que **nao** e escolha de tema: chamada antes de
   * o diretorio de temas estar registrado devolve falso com aviso de uso indevido
   * (`theme.php:4364-4367`), e quem monta o arranque nao pode inverter essa
   * ordem.
   */
  readonly temaDeBlocos?: boolean;
  /** `wp_style_is( $apelido, 'registered' )` (`post-template.php:1820`). */
  readonly estiloRegistrado?: (apelido: string) => boolean;
  /** `wp_enqueue_style( $apelido )` (`post-template.php:1821`). */
  readonly enfileirarEstilo?: (apelido: string) => void;
  /** `is_admin()` (`post-template.php:124`). */
  readonly noPainel?: boolean;
  /**
   * `wp_rand()` (`post-template.php:1781`), e so quando o registro nao tem id.
   *
   * Sem argumento, o legado sorteia de 0 a 4.294.967.295 pelo gerador
   * criptografico do interpretador (`pluggable.php:3016`, `:3022-3024` e `:3037`),
   * e o default daqui faz o mesmo com o gerador do runtime. O valor aparece no
   * `id` do campo do formulario, logo e observavel — e e por isso que ele e
   * injetavel, e nao sorteado por dentro sem saida.
   */
  readonly numeroAleatorio?: () => number;
}

/**
 * O contexto com as ausencias resolvidas.
 *
 * O significado de cada ausencia esta declarado no campo correspondente da
 * interface acima, e **nenhuma delas e "ainda nao implementado"**.
 */
export interface ContextoDaSenhaResolvido {
  readonly atestado: string | undefined;
  readonly hashDoCookie: string;
  readonly hashDoAtestado: HashDoAtestado;
  readonly podeEditarConteudo: PodeEditarConteudo;
  readonly enderecoDoConteudo: EnderecoDoConteudo;
  readonly remetenteDaRequisicao: string;
  readonly enderecoDoSite: EnderecoDoSite;
  readonly temaDeBlocos: boolean;
  readonly estiloRegistrado: (apelido: string) => boolean;
  readonly enfileirarEstilo: (apelido: string) => void;
  readonly noPainel: boolean;
  readonly numeroAleatorio: () => number;
}

/**
 * Resolve as ausencias do contexto.
 *
 * Nao toca em colaborador nenhum: resolver o contexto e so amarrar dependencias,
 * como `contextoResolvido` faz em `../consulta/contexto-da-consulta.ts`.
 */
export function contextoDeSenhaResolvido(
  contexto: ContextoDaSenhaDeConteudo = {},
): ContextoDaSenhaResolvido {
  return {
    atestado: contexto.atestado,
    hashDoCookie: contexto.hashDoCookie ?? '',
    hashDoAtestado: contexto.hashDoAtestado ?? HASH_DO_ATESTADO_DO_NUCLEO,
    podeEditarConteudo: contexto.podeEditarConteudo ?? (() => false),
    enderecoDoConteudo: contexto.enderecoDoConteudo ?? (() => ''),
    remetenteDaRequisicao: contexto.remetenteDaRequisicao ?? '',
    enderecoDoSite: contexto.enderecoDoSite ?? ((caminho) => caminho),
    temaDeBlocos: contexto.temaDeBlocos ?? true,
    estiloRegistrado: contexto.estiloRegistrado ?? (() => false),
    enfileirarEstilo: contexto.enfileirarEstilo ?? (() => undefined),
    noPainel: contexto.noPainel ?? false,
    numeroAleatorio:
      contexto.numeroAleatorio ?? (() => randomInt(0, TETO_DO_SORTEIO + 1)),
  };
}
