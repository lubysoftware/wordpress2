/**
 * O cookie da sessao de recuperacao: montar, assinar, ler, validar e apagar —
 * `WP_Recovery_Mode_Cookie_Service`
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php`).
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — **CA-12.2**
 * (*"abrir o caminho de recuperacao cria uma sessao propria, com prazo
 * declarado"*) e a semana de `A10` (UT-117-8, *"encerra a sessao ao fim de uma
 * semana"*).
 *
 * ## O formato, e por que a sessao e propria
 *
 * O valor e `base64( "recovery_mode|{iat}|{rand}|{assinatura}" )` (`:169`). O
 * `rand` sao 20 caracteres sem especiais (`:181`), e o **identificador da
 * sessao e `sha1( rand )`** (`:142`): cada abertura do caminho sorteia o seu, e
 * e esse identificador que entra no nome da opcao de extensoes pausadas. A
 * assinatura e `hash_hmac( 'sha1', ..., AUTH_KEY . AUTH_SALT )` (`:245`).
 *
 * ## Tres coisas que um porte perde
 *
 * 1. **A primeira parte nao e conferida.** A validacao separa as quatro
 *    partes e descarta a primeira sem olhar (`:92`): so a assinatura a protege,
 *    porque ela entra no texto assinado como a constante `recovery_mode`.
 * 2. **O prazo e lido de novo na validacao** (`:99`), com o valor do momento —
 *    ver `../configuracao/sessao-de-recuperacao.ts`.
 * 3. **Assinar pode gravar.** Sem `AUTH_KEY`/`AUTH_SALT` proprios, a chave e o
 *    sal saem das opcoes `recovery_mode_auth_key` e `recovery_mode_auth_salt`,
 *    e sao **gerados e gravados** na primeira assinatura (`:213`-`:241`) — que
 *    pode ser uma **validacao**. O sal tambem e trocado quando e igual a chave
 *    (`:228`).
 *
 * ⚠️ `base64_decode()` do legado e o modo **nao estrito**: caractere fora do
 * alfabeto e ignorado, e o enchimento tambem. A leitura abaixo faz o mesmo
 * antes de decodificar.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { SITE_UNICO } from '../armazenamento/index.js';
import {
  COMPRIMENTO_DO_ALEATORIO_DO_COOKIE,
  COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA,
  MARCA_ASSINADA_DO_COOKIE_DE_RECUPERACAO,
  PARTES_DO_COOKIE_DE_RECUPERACAO,
  PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS,
  SEGUNDOS_POR_DIA,
  type SessaoDeRecuperacao,
} from '../configuracao/index.js';
import type {
  ContextoDaRecuperacao,
  ErroDaRecuperacao,
  InstrucaoDeCookie,
} from './contexto-da-recuperacao.js';

/**
 * `YEAR_IN_SECONDS` (`wp-includes/default-constants.php:163`): o quanto o
 * cookie e jogado para o passado ao ser apagado (`:63`-`:64`). Vive aqui e nao
 * em `../configuracao/prazos.ts` porque e borda de cabecalho, como T002
 * registrou.
 */
export const SEGUNDOS_POR_ANO = 365 * SEGUNDOS_POR_DIA;

/** `'put your unique phrase here'` — o valor de fabrica de `wp-config-sample.php` (`:203`). */
export const FRASE_PADRAO_DE_CHAVE = 'put your unique phrase here';

/** `' '` — o valor com que o cookie e apagado (`:63`). */
export const VALOR_DO_COOKIE_APAGADO = ' ';

export const MENSAGEM_SEM_COOKIE = 'No cookie present.';
export const MENSAGEM_DE_FORMATO_INVALIDO = 'Invalid cookie format.';
export const MENSAGEM_DE_COOKIE_VENCIDO = 'Cookie expired.';
export const MENSAGEM_DE_COOKIE_INVALIDO = 'Invalid cookie.';

/** `apply_filters( 'recovery_mode_cookie_length', WEEK_IN_SECONDS )` (`:46` e `:99`). */
export function prazoDoCookie(contexto: ContextoDaRecuperacao): number {
  const aoDefinir = contexto.ganchos?.aoDefinirPrazoDoCookie;
  return aoDefinir === undefined
    ? PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS
    : aoDefinir(PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS);
}

/** `is_cookie_set()` (`:24`-`:26`): o `! empty()` do PHP. */
export function cookieDefinido(contexto: ContextoDaRecuperacao): boolean {
  const valor = contexto.pedido.cookie;
  return valor !== undefined && valor !== '' && valor !== '0';
}

/**
 * `set_cookie()` (`:35`-`:55`): gera o valor, **depois** consulta o prazo, e
 * emite um cookie no `COOKIEPATH` e outro no `SITECOOKIEPATH` quando os dois
 * diferem. Seguro quando a requisicao e cifrada, e sempre so-HTTP.
 */
export function gravarCookie(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
): readonly InstrucaoDeCookie[] {
  const valor = gerarValorDoCookie(contexto, sessao);
  const expiraEm = contexto.instante() + prazoDoCookie(contexto);
  const { constantes } = contexto;

  const cookie = (caminho: string): InstrucaoDeCookie => ({
    nome: constantes.RECOVERY_MODE_COOKIE,
    valor,
    expiraEm,
    caminho,
    dominio: constantes.COOKIE_DOMAIN,
    seguro: contexto.pedido.cifrado,
    somenteHttp: true,
  });

  const cookies = [cookie(constantes.COOKIEPATH)];
  if (constantes.COOKIEPATH !== constantes.SITECOOKIEPATH) {
    cookies.push(cookie(constantes.SITECOOKIEPATH));
  }
  return cookies;
}

/**
 * `clear_cookie()` (`:62`-`:65`): **sempre dois**, mesmo com os caminhos
 * iguais, sem `secure` e sem `httponly`, com o valor `' '` e o prazo um ano no
 * passado.
 */
export function apagarCookie(
  contexto: ContextoDaRecuperacao,
): readonly InstrucaoDeCookie[] {
  const { constantes } = contexto;
  const cookie = (caminho: string): InstrucaoDeCookie => ({
    nome: constantes.RECOVERY_MODE_COOKIE,
    valor: VALOR_DO_COOKIE_APAGADO,
    expiraEm: contexto.instante() - SEGUNDOS_POR_ANO,
    caminho,
    dominio: constantes.COOKIE_DOMAIN,
    seguro: false,
    somenteHttp: false,
  });
  return [cookie(constantes.COOKIEPATH), cookie(constantes.SITECOOKIEPATH)];
}

/** `validate_cookie()` (`:76`-`:113`), sobre o cookie da requisicao. */
export function validarCookie(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
): true | ErroDaRecuperacao {
  const cookie = contexto.pedido.cookie;
  if (cookie === undefined || cookie === '' || cookie === '0') {
    return { codigo: 'no_cookie', mensagem: MENSAGEM_SEM_COOKIE };
  }

  const partes = partesDoCookie(cookie);
  if (partes === null) {
    return { codigo: 'invalid_format', mensagem: MENSAGEM_DE_FORMATO_INVALIDO };
  }
  const [, criadoEm, aleatorio, assinatura] = partes;

  // `ctype_digit()`: so algarismos, e ao menos um.
  if (!/^[0-9]+$/.test(criadoEm)) {
    return {
      codigo: 'invalid_created_at',
      mensagem: MENSAGEM_DE_FORMATO_INVALIDO,
    };
  }

  const prazo = prazoDoCookie(contexto);
  if (contexto.instante() > Number(criadoEm) + prazo) {
    return { codigo: 'expired', mensagem: MENSAGEM_DE_COOKIE_VENCIDO };
  }

  const assinado = `${MARCA_ASSINADA_DO_COOKIE_DE_RECUPERACAO}|${criadoEm}|${aleatorio}`;
  const esperado = assinar(contexto, sessao, assinado);
  if (!mesmoTextoEmTempoConstante(assinatura, esperado)) {
    return { codigo: 'signature_mismatch', mensagem: MENSAGEM_DE_COOKIE_INVALIDO };
  }

  return true;
}

/**
 * `get_session_id_from_cookie()` (`:126`-`:143`): `sha1()` do aleatorio. Le o
 * cookie de novo, como o legado — que o chama **depois** de validar.
 */
export function sessaoDoCookie(
  contexto: ContextoDaRecuperacao,
): string | ErroDaRecuperacao {
  const cookie = contexto.pedido.cookie;
  if (cookie === undefined || cookie === '' || cookie === '0') {
    return { codigo: 'no_cookie', mensagem: MENSAGEM_SEM_COOKIE };
  }
  const partes = partesDoCookie(cookie);
  if (partes === null) {
    return { codigo: 'invalid_format', mensagem: MENSAGEM_DE_FORMATO_INVALIDO };
  }
  return createHash('sha1').update(partes[2], 'latin1').digest('hex');
}

/**
 * `parse_cookie()` (`:153`-`:162`): `base64_decode()`, `explode( '|' )` e
 * exatamente quatro partes. O texto decodificado fica em `latin1`, um
 * caractere por byte, como a cadeia do PHP.
 */
function partesDoCookie(
  cookie: string,
): readonly [string, string, string, string] | null {
  const limpo = cookie.replace(/[^A-Za-z0-9+/]/g, '');
  const decodificado = Buffer.from(limpo, 'base64').toString('latin1');
  const partes = decodificado.split('|');
  if (partes.length !== PARTES_DO_COOKIE_DE_RECUPERACAO) {
    return null;
  }
  const [marca = '', criadoEm = '', aleatorio = '', assinatura = ''] = partes;
  return [marca, criadoEm, aleatorio, assinatura];
}

/**
 * `generate_cookie()` (`:180`-`:185`). O instante e o aleatorio sao sorteados
 * **antes** de assinar, nesta ordem.
 */
function gerarValorDoCookie(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
): string {
  const assinado = `${MARCA_ASSINADA_DO_COOKIE_DE_RECUPERACAO}|${contexto.instante()}|${contexto.gerarSenha(COMPRIMENTO_DO_ALEATORIO_DO_COOKIE, false, false)}`;
  const assinatura = assinar(contexto, sessao, assinado);
  return Buffer.from(`${assinado}|${assinatura}`, 'latin1').toString('base64');
}

/**
 * `recovery_mode_hash( $data )` (`:200`-`:246`).
 *
 * A opcao e de rede (`get_site_option()`), lida em **site unico**: o modo so
 * inicializa fora de rede (`wp-settings.php:573`), logo e ai que este caminho
 * roda.
 */
function assinar(
  contexto: ContextoDaRecuperacao,
  sessao: SessaoDeRecuperacao,
  dado: string,
): string {
  const { constantes } = contexto;
  const padroes = [FRASE_PADRAO_DE_CHAVE];
  if (
    constantes.frasePadraoTraduzida !== undefined &&
    constantes.frasePadraoTraduzida !== FRASE_PADRAO_DE_CHAVE
  ) {
    padroes.push(constantes.frasePadraoTraduzida);
  }

  let chave: string;
  if (
    constantes.AUTH_KEY === undefined ||
    padroes.includes(constantes.AUTH_KEY)
  ) {
    const gravada = sessao.lerChaveDeAssinatura(SITE_UNICO);
    if (gravada === null || gravada === '0') {
      chave = contexto.gerarSenha(COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA, true, true);
      sessao.gravarChaveDeAssinatura(SITE_UNICO, chave);
    } else {
      chave = gravada;
    }
  } else {
    chave = constantes.AUTH_KEY;
  }

  let sal: string;
  if (
    constantes.AUTH_SALT === undefined ||
    padroes.includes(constantes.AUTH_SALT) ||
    constantes.AUTH_SALT === chave
  ) {
    const gravado = sessao.lerSalDeAssinatura(SITE_UNICO);
    if (gravado === null || gravado === '0') {
      sal = contexto.gerarSenha(COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA, true, true);
      sessao.gravarSalDeAssinatura(SITE_UNICO, sal);
    } else {
      sal = gravado;
    }
  } else {
    sal = constantes.AUTH_SALT;
  }

  return createHmac('sha1', Buffer.from(chave + sal, 'utf8'))
    .update(dado, 'latin1')
    .digest('hex');
}

/** `hash_equals( $conhecido, $calculado )`. */
function mesmoTextoEmTempoConstante(conhecido: string, calculado: string): boolean {
  const a = Buffer.from(conhecido, 'latin1');
  const b = Buffer.from(calculado, 'latin1');
  return a.length === b.length && timingSafeEqual(a, b);
}
