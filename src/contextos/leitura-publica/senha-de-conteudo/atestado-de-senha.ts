/**
 * O atestado de senha de conteudo: o cookie que o visitante leva do navegador —
 * `case 'postpass'` de `wp-login.php:760-792`, mais o nome do cookie em
 * `wp-includes/default-constants.php:249-254`.
 *
 * Entrega de **T013** (US-6, CA-6.2 e CA-6.3).
 *
 * ---
 *
 * ## Os tres fatos que a resposta 8 de `questions.md` manda preservar
 *
 * | fato | onde ele esta | o que um porte "limpo" faria |
 * |---|---|---|
 * | **dez dias**, no navegador | `wp-login.php:781`, filtravel por `post_password_expires` | encurtar, ou mover para sessao |
 * | **sem verificacao de idade no servidor** | `post_password_required()` nao le relogio nenhum | conferir a idade, e com isso inventar prazo de servidor |
 * | **sem limite de tentativa** | nao existe contador em lugar nenhum do fluxo | somar tentativa e bloquear |
 *
 * Os tres estao na tabela *Nao negociavel* da constituicao pela via do P6 —
 * *"introduzir limite de taxa, prazo de retencao ou qualquer numero que o legado
 * nao tem"* — e REQ-044, o card que pediria os tres numeros, esta em
 * `do-not-rewrite.md`: e escopo **recusado**, nao trabalho pendente.
 *
 * ## 🔴 O atestado e gravado sem conferir a senha, e isso e o mecanismo
 *
 * `wp-login.php:789` grava o cookie com o hash do que o visitante digitou **sem
 * comparar com nada**: a comparacao acontece depois, na leitura seguinte, dentro
 * de `post_password_required()`. Isso tem tres consequencias observaveis, e
 * nenhuma delas e defeito a corrigir:
 *
 * 1. senha errada **tambem** grava atestado (um atestado que nao confere);
 * 2. e e justamente a presenca desse atestado que faz o formulario voltar com
 *    *"Invalid password."* (`post-template.php:1789`), porque a deteccao de
 *    senha errada e *"veio do proprio endereco do conteudo **e** tem cookie"*;
 * 3. um atestado so vale por **senha**, nao por conteudo: ele nao carrega
 *    identificador nenhum, logo serve o corpo de **todo** conteudo que tenha a
 *    mesma senha. UC-02 registra o outro lado disso — *"uma senha por conteudo,
 *    nunca por pessoa... revogar o acesso de uma pessoa significa trocar a senha
 *    para todas"*.
 *
 * ## O que este arquivo nao faz
 *
 * Nao escreve cookie: {@link AtestadoParaGravar} e a **descricao** do cookie, e
 * quem o emite e a borda HTTP — AD-08 poe HTTP entre as cinco portas e AD-04 poe
 * a fronteira de efeito em `adaptadores/`. E a mesma divisao que
 * `contextos/identidade-e-acesso/sessao/saida.ts` fez com
 * `CredenciaisDoNavegador`: o contexto decide, a borda executa.
 *
 * ⚠️ **Nota para quem fechar aquela lacuna da feature 001.** `saida.ts` declarou
 * que *"quais cookies exatamente a limpeza cobre... nao esta registrado em
 * nenhum documento deste pacote"*. Um deles e este: `wp_clear_auth_cookie()`
 * limpa `wp-postpass_` junto com as credenciais de sessao
 * (`wp-includes/pluggable.php:1245-1246`, com o comentario *"Post password
 * cookie"*), com `COOKIEPATH` e `COOKIE_DOMAIN` e vencimento de um ano no
 * passado. Ou seja: **sair do sistema derruba o atestado de senha de conteudo**.
 * A linha fica registrada aqui porque a regra de dependencia 3 proibe este
 * contexto alcancar aquele, e o `nomeDoCookieDoAtestado` daqui e o nome que a
 * limpeza de la precisa.
 */

import { createHash } from 'node:crypto';

import {
  contextoDeSenhaResolvido,
  type ContextoDaSenhaDeConteudo,
} from './contexto-de-senha-de-conteudo.js';

/** O prefixo do nome do cookie de atestado (`wp-login.php:789`). */
export const PREFIXO_DO_COOKIE_DO_ATESTADO = 'wp-postpass_';

/** `DAY_IN_SECONDS` (`wp-includes/default-constants.php:160`). */
export const SEGUNDOS_EM_UM_DIA = 24 * 60 * 60;

/**
 * Os **dez dias** do atestado, em segundos (`wp-login.php:781`).
 *
 * E numero do legado com o valor de fabrica e o ponto de configuracao que o
 * altera em execucao, como o P6 exige: o ponto e
 * {@link FiltroDoPrazoDoAtestado}, e o docblock do legado diz o que o zero
 * significa — *"To turn this into a session cookie, return 0"*.
 */
export const PRAZO_DO_ATESTADO_EM_SEGUNDOS = 10 * SEGUNDOS_EM_UM_DIA;

/**
 * `COOKIEHASH` (`default-constants.php:249-254`): `md5( siteurl )`, e **texto
 * vazio** quando a instalacao nao tem `siteurl` gravado.
 *
 * O legado o define uma vez por requisicao, como constante, a partir de
 * `get_site_option( 'siteurl' )` — logo numa rede o atestado de um site nao vale
 * no outro, porque o nome do cookie muda.
 */
export function hashDoCookie(enderecoDoSite: string): string {
  if (enderecoDoSite === '') {
    return '';
  }
  return createHash('md5').update(enderecoDoSite, 'utf8').digest('hex');
}

/** O nome do cookie de atestado desta instalacao. */
export function nomeDoCookieDoAtestado(hashDaInstalacao: string): string {
  return PREFIXO_DO_COOKIE_DO_ATESTADO + hashDaInstalacao;
}

/**
 * O ponto de filtro `post_password_expires` (`wp-login.php:781`).
 *
 * Recebe o instante de vencimento **ja somado** — `time() + 10 dias` — e
 * substitui o valor. E o unico ponto de extensao deste fluxo, e e por ele que
 * uma instalacao troca os dez dias sem tocar no nucleo.
 */
export type FiltroDoPrazoDoAtestado = (vencimento: number) => number;

/** O esquema que o legado reconhece como cifrado em `wp-login.php:784`. */
export const ESQUEMA_CIFRADO = 'https';

/**
 * `COOKIEPATH` numa instalacao na raiz do dominio
 * (`default-constants.php:303-304`).
 *
 * O legado o calcula tirando `https?://dominio` da opcao `home` e somando `/`,
 * logo um site em subpasta tem `/subpasta/` e nao este valor. E o caminho que
 * decide onde o atestado viaja — e e o mesmo que a limpeza de
 * `wp_clear_auth_cookie()` usa (`pluggable.php:1246`).
 */
export const CAMINHO_DO_COOKIE_NA_RAIZ = '/';

/** `COOKIE_DOMAIN` (`default-constants.php:332-333`): nasce **vazio**. */
export const DOMINIO_DO_COOKIE_DE_FABRICA = '';

/**
 * O cookie a gravar, como a borda HTTP precisa dele.
 *
 * Os seis campos sao os seis argumentos de `setcookie()` em `wp-login.php:789`,
 * nessa ordem. ⚠️ **Nao ha um setimo**: o legado nao passa `httponly` nem
 * `samesite`, logo o cookie de atestado e legivel por JavaScript da pagina. Isso
 * esta aqui como fato do produto, nao como descuido a emendar — endurecer e
 * decisao separada e registrada (`parity_specs.md`, nota 3: os cinco atestados
 * sao `@divida-herdada`).
 */
export interface AtestadoParaGravar {
  /** `'wp-postpass_' . COOKIEHASH`. */
  readonly nome: string;
  /** O hash do que o visitante digitou — **nao** a senha, e nao o resultado de conferencia. */
  readonly valor: string;
  /** O instante de vencimento, em segundos, depois do filtro. Zero = cookie de sessao. */
  readonly vencimento: number;
  /** `COOKIEPATH` (`default-constants.php:303-304`). */
  readonly caminho: string;
  /** `COOKIE_DOMAIN` (`default-constants.php:332-333`), que nasce vazio. */
  readonly dominio: string;
  /** `$secure`, decidido pelo **esquema do destino** (`wp-login.php:783-787`). */
  readonly somenteCifrado: boolean;
}

/** O que o envio do formulario de senha traz, e para onde ele volta. */
export interface EnvioDeSenhaDeConteudo {
  /**
   * O campo `post_password` do formulario, **como chegou**.
   *
   * Ausente quando o campo nao veio, e {@link ValorNaoTextual} quando veio em
   * forma que nao e texto — `post_password[]=x` produz arranjo no interpretador,
   * e o legado testa `is_string()` (`wp-login.php:763`).
   */
  readonly senhaInformada?: string | ValorNaoTextual;
  /**
   * `$_POST['redirect_to'] ?? wp_get_referer()` (`wp-login.php:761`).
   *
   * ⚠️ A precedencia e esta: o campo do formulario **vence** o remetente, e o
   * `??` do legado so cai no remetente quando o campo esta ausente — campo
   * presente e vazio continua vencendo, e com ele o destino e vazio.
   */
  readonly destino?: string;
  /** `wp_get_referer()`, usado so quando o campo `redirect_to` esta ausente. */
  readonly remetente?: string;
}

/**
 * A marca de um valor que chegou e **nao** e texto.
 *
 * Existe porque o ramo de `wp-login.php:763` so e observavel se a forma nao
 * textual for representavel: sem ela, `?post_password[]=x` seria indistinguivel
 * de campo ausente, e os dois casos do legado desembocam no mesmo redirecionamento
 * — mas por motivos diferentes, e o catalogo de testes separa os dois.
 */
export interface ValorNaoTextual {
  readonly textual: false;
}

/** O valor nao textual, para quem monta o envio. */
export const VALOR_NAO_TEXTUAL: ValorNaoTextual = Object.freeze({
  textual: false,
});

/** O que a gravacao do atestado produz. */
export interface ResultadoDaGravacaoDoAtestado {
  /**
   * O cookie a gravar, ou **ausente** quando o legado nao grava nenhum — que e o
   * ramo de `wp-login.php:763-766`, campo ausente ou nao textual.
   */
  readonly cookie?: AtestadoParaGravar;
  /**
   * O destino do redirecionamento (`wp_safe_redirect( $redirect_to )`), que
   * acontece nos **dois** caminhos: com cookie (`:791`) e sem (`:764`).
   */
  readonly destino: string;
}

/** O que {@link gravarAtestadoDeSenha} recebe alem do envio. */
export interface OpcoesDaGravacaoDoAtestado {
  readonly contexto?: ContextoDaSenhaDeConteudo;
  /**
   * `time()` em segundos (`wp-login.php:781`).
   *
   * E o **unico** relogio deste fluxo, e ele e argumento: nada aqui le o tempo do
   * sistema por conta propria, e a leitura do atestado nao recebe relogio nenhum
   * (ver `./senha-exigida.ts`).
   */
  readonly agora: number;
  /** `COOKIEPATH` (`default-constants.php:303-304`). */
  readonly caminhoDoCookie?: string;
  /** `COOKIE_DOMAIN` (`default-constants.php:332-333`): nasce vazio. */
  readonly dominioDoCookie?: string;
  /** `post_password_expires`, na ordem em que os interceptadores foram dados. */
  readonly filtrosDoPrazo?: readonly FiltroDoPrazoDoAtestado[];
}

/**
 * O esquema do destino, como `parse_url( $destino, PHP_URL_SCHEME )` o le
 * (`wp-login.php:784`).
 *
 * Devolve texto vazio quando o destino nao declara esquema — endereco relativo,
 * que e o que `get_permalink()` **nao** produz, mas que um `redirect_to` forjado
 * produz. ⚠️ A consequencia esta no legado: destino sem esquema grava o atestado
 * **sem** a marca de cifrado, e ele passa a viajar em canal sem cifra. O
 * rebaixamento para canal sem cifra esta na tabela *Nao negociavel* (resposta
 * 12): nao se fecha aqui.
 */
export function esquemaDoDestino(destino: string): string {
  const casado = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(destino);
  return casado?.[1]?.toLowerCase() ?? '';
}

/**
 * `case 'postpass'` — grava o atestado e manda o visitante de volta.
 *
 * **Permissao exigida: nenhuma capacidade, e a declaracao e o ponto** (P4). Nao
 * ha conta envolvida: o ator de UC-02 e o visitante, e o atestado e um dos cinco
 * mecanismos que decidem acesso sem consultar o modelo de capacidades.
 *
 * Os passos, na ordem do legado:
 *
 * | # | passo | legado |
 * |---|---|---|
 * | 1 | o destino: o campo `redirect_to`, ou o remetente | `:761` |
 * | 2 | campo ausente ou nao textual: **redireciona sem gravar nada** | `:763-766` |
 * | 3 | o vencimento: agora mais dez dias, pelo filtro `post_password_expires` | `:781` |
 * | 4 | a marca de cifrado, pelo **esquema do destino** | `:783-787` |
 * | 5 | o cookie, com o hash do que foi digitado — **sem conferir** | `:789` |
 * | 6 | o redirecionamento | `:791` |
 *
 * ⚠️ **O passo 5 nao sabe se a senha esta certa, e o passo 3 vem antes dele.**
 * Nao ha ramo de erro neste fluxo: senha certa e senha errada produzem o
 * **mesmo** cookie, com o mesmo prazo, e a diferenca aparece so na leitura
 * seguinte. E assim que CA-6.3 funciona.
 */
export function gravarAtestadoDeSenha(
  envio: EnvioDeSenhaDeConteudo,
  opcoes: OpcoesDaGravacaoDoAtestado,
): ResultadoDaGravacaoDoAtestado {
  const contexto = contextoDeSenhaResolvido(opcoes.contexto);

  // Passo 1 (`:761`) — e a precedencia e a do `??`: ausente cai no remetente,
  // presente e vazio nao cai.
  const destino = envio.destino ?? envio.remetente ?? '';

  // Passo 2 (`:763-766`).
  const informada = envio.senhaInformada;
  if (informada === undefined || typeof informada !== 'string') {
    return Object.freeze({ destino });
  }

  // Passo 3 (`:781`) — o filtro recebe o vencimento ja somado.
  let vencimento = opcoes.agora + PRAZO_DO_ATESTADO_EM_SEGUNDOS;
  for (const filtro of opcoes.filtrosDoPrazo ?? []) {
    vencimento = filtro(vencimento);
  }

  // Passo 4 (`:783-787`) — destino vazio da falso, que e o `else` do legado.
  const somenteCifrado =
    destino === '' ? false : esquemaDoDestino(destino) === ESQUEMA_CIFRADO;

  // Passo 5 (`:789`) — `wp_unslash()` e identidade nesta arvore, como em
  // `contextos/conteudo/gravacao/campos-na-gravacao.ts:54`.
  const cookie: AtestadoParaGravar = {
    nome: nomeDoCookieDoAtestado(contexto.hashDoCookie),
    valor: contexto.hashDoAtestado.gerar(informada),
    vencimento,
    caminho: opcoes.caminhoDoCookie ?? CAMINHO_DO_COOKIE_NA_RAIZ,
    dominio: opcoes.dominioDoCookie ?? DOMINIO_DO_COOKIE_DE_FABRICA,
    somenteCifrado,
  };

  // Passo 6 (`:791`).
  return Object.freeze({ cookie, destino });
}
