/**
 * Resolver a credencial de integracao por precedencia declarada.
 *
 * Entrega de **T007** (US-3): CA-3.1, CA-3.2, CA-3.3 e CA-3.4, com I1
 * (BR-MIGRAR-068), I2 (BR-MIGRAR-069) e ADR-0012. Sao as tres funcoes de
 * `wp-includes/connectors.php` que o legado tem para isso, cada uma no seu
 * metodo de autenticacao:
 *
 * | legado | linha | aqui |
 * |---|---|---|
 * | `_wp_connectors_get_api_key_source()` | `:444` | {@link origemDaChaveDeApi} |
 * | `wp_connectors_parse_application_password_credentials()` | `:483` | {@link separarCredencialDePar} |
 * | `wp_connectors_get_application_password_credentials()` | `:522` | {@link resolverCredencialDePar} |
 *
 * ── O QUE O LEGADO FAZ, E QUE ESTE ARQUIVO REPRODUZ DE PROPOSITO ───────────
 *
 * 1. **A chave de API devolve a ORIGEM, nao o valor** (`:442`). Quem usa a
 *    chave le a fonte que lhe foi dita; e o que permite a tela dizer de onde
 *    ela veio sem mostra-la (CA-3.5, ADR-0012 *"a funcao devolve a fonte, nao o
 *    valor"*).
 * 2. **Com a credencial no ambiente, o banco nem e lido** (CA-3.2). `:449`
 *    retorna antes de `get_option()` em `:462`; a porta falsa de
 *    `../armazenamento/porta-falsa.ts` afirma isso com a lista de selecoes vazia.
 * 3. **Nada aqui grava.** O cenario de precedencia de `PT-017` cobra *"nenhuma
 *    das duas grava no banco a credencial que veio de fora dele"*, e a porta de
 *    dados desta tarefa so tem `selecionar`.
 * 4. **Degrau sem nome nao e consultado.** `'' !== $env_var_name` (`:446`) e
 *    `'' !== $constant_name` (`:454`): o conector que nao declara variavel de
 *    ambiente — o de filtragem de spam, I3 — comeca pela constante.
 * 5. **No par, a fonte malformada nao para a cadeia: avisa e cai para a
 *    proxima** (`:534` e `:557`). Na chave de API nao ha formato a conferir, e
 *    qualquer cadeia nao vazia vence.
 * 6. **⚠️ CA-3.4 no degrau do banco, como o legado o faz.** No ambiente e na
 *    constante, metade vazia esvazia as duas (`:490`). No banco **nao**: o
 *    arranjo guardado volta com a metade que tiver, e a origem e `'none'`
 *    (`:571` a `:577`). As duas sao *tratadas como ausentes* — origem `'none'`,
 *    e `isConnected` falso na tela (`:935`) —, mas o valor nao e zerado. Nenhum
 *    chamador do nucleo le a metade solta, e reproduzir e o que o P1 manda.
 *
 * ── O PONTO DE EXTENSAO, DECLARADO E NAO EMITIDO ───────────────────────────
 *
 * `_doing_it_wrong()` (`:534`, `:557`) dispara a acao `doing_it_wrong_run` e o
 * filtro `doing_it_wrong_trigger_error` de `wp-includes/functions.php`. O
 * barramento que os emitiria nao tem tarefa no pacote (REQ-162 esta em
 * `do-not-rewrite.md`), e o precedente da arvore e o de
 * `leitura-publica/macro-textual/registro-de-macros.ts`: o aviso sai como
 * {@link AvisoDeUsoIndevido} para um relator opcional, na mesma posicao do
 * fluxo, e **nenhuma decisao depende dele** (P7).
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import { aparaComoPhp, lerOpcao } from '../armazenamento/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  ORDEM_DE_PRECEDENCIA,
  valorDaConstante,
  valorDoAmbiente,
  type AutenticacaoDoConector,
  type FontesForaDoBanco,
  type OrigemDaCredencial,
} from './autenticacao-do-conector.js';

/**
 * Um aviso de uso indevido — o `_doing_it_wrong()` do legado.
 *
 * **Gemeo declarado** de `AvisoDeUsoIndevido` de
 * `leitura-publica/macro-textual/registro-de-macros.ts` e de
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts`, pelo mesmo motivo que
 * aqueles dois registram: o lugar desta estrutura e `plataforma/barramento/`,
 * que nao existe, e a regra de dependencia 3 proibe importar o outro contexto.
 */
export interface AvisoDeUsoIndevido {
  /** `__FUNCTION__` — a funcao que avisa, com o nome do legado. */
  readonly funcao: string;
  /** O texto do aviso, como o legado o monta. */
  readonly mensagem: string;
  /** A versao em que o aviso passou a existir, como o legado a declara. */
  readonly versao: string;
}

/** Quem recebe o aviso. Nao devolve nada, e e de proposito (P7). */
export type RelatorDeUsoIndevido = (aviso: AvisoDeUsoIndevido) => void;

/**
 * O que a resolucao do par precisa para avisar. Opcional por inteiro: ausente,
 * a resolucao decide igual (P7).
 *
 * `escaparHtml` e o `esc_html()` que o legado passa no nome da fonte antes do
 * `sprintf()` (`:539`, `:562`). E de `plataforma/formatacao/`, feature 015, e
 * entra por argumento como em `midia/envio/contexto-de-envio.ts`.
 */
export interface AvisosDaCredencial {
  readonly avisar: RelatorDeUsoIndevido;
  readonly escaparHtml: (texto: string) => string;
}

/** `__FUNCTION__` de `:535` e `:558`. */
export const FUNCAO_QUE_RESOLVE_O_PAR =
  'wp_connectors_get_application_password_credentials';

/** `'7.1.0'` — `:541` e `:564`. */
export const VERSAO_DO_AVISO_DE_PAR = '7.1.0';

/** O texto de `:538`, com `%s` no lugar do nome. */
export const MENSAGEM_DE_AMBIENTE_MALFORMADO =
  'The %s environment variable must contain application password credentials in "username:password" format.';

/** O texto de `:561`, com `%s` no lugar do nome. */
export const MENSAGEM_DE_CONSTANTE_MALFORMADA =
  'The %s constant must contain application password credentials in "username:password" format.';

/**
 * CA-3.1 e CA-3.2: de onde vem a chave de API de um conector —
 * `_wp_connectors_get_api_key_source( $setting_name, $env_var_name, $constant_name )`
 * (`connectors.php:444`).
 *
 * O degrau do banco compara com `''` estrito (`:463`), sobre o
 * `get_option( $setting_name, '' )` de `:462`: so a cadeia vazia — ou a opcao
 * ausente, que devolve o default `''` — da `'none'`. Opcao guardada como `false`
 * serializado, ou como arranjo, responde `'database'`; e o nome de opcao que
 * apara para vazio faz `get_option()` devolver `false` sem consulta
 * (`../armazenamento/opcao.ts`), que tambem nao e `''`.
 */
export function origemDaChaveDeApi(
  dados: PortaDeDados,
  fontes: FontesForaDoBanco,
  autenticacao: AutenticacaoDoConector,
): OrigemDaCredencial {
  const nomeDaVariavel = autenticacao.env_var_name ?? '';
  const nomeDaConstante = autenticacao.constant_name ?? '';

  for (const degrau of ORDEM_DE_PRECEDENCIA) {
    switch (degrau) {
      case 'env':
        if (nomeDaVariavel !== '' && valorDoAmbiente(fontes, nomeDaVariavel) !== undefined) {
          return 'env';
        }
        break;
      case 'constant':
        if (nomeDaConstante !== '' && valorDaConstante(fontes, nomeDaConstante) !== undefined) {
          return 'constant';
        }
        break;
      case 'database': {
        const leitura = lerOpcao(dados, autenticacao.setting_name ?? '');
        if (!leitura.existe) {
          // Nome recusado: `false`, que nao e `''`. Opcao ausente: o default `''`.
          if (leitura.nomeRecusado) {
            return 'database';
          }
          break;
        }
        if (!eCadeiaVazia(leitura.valor)) {
          return 'database';
        }
        break;
      }
    }
  }
  return 'none';
}

/** Uma metade do par: cadeia, ou bytes quando o banco guardou UTF-8 invalido. */
export type MetadeDaCredencial = string | Uint8Array;

/** O arranjo que `wp_connectors_parse_application_password_credentials()` devolve. */
export interface CredencialDePar {
  readonly username: string;
  readonly password: string;
}

/** As duas metades vazias — o retorno de `:491` a `:494`. */
export const CREDENCIAL_DE_PAR_VAZIA: CredencialDePar = Object.freeze({
  username: '',
  password: '',
});

/**
 * CA-3.3 e CA-3.4, I2: `wp_connectors_parse_application_password_credentials()`
 * (`connectors.php:483`).
 *
 * Divide no **primeiro** `:` (`strpos`, `:484`), para que o segredo possa
 * conter o separador; apara as duas metades com o `trim()` do PHP (`:487`,
 * `:488`) — o comentario do legado diz por que: valor vindo de arquivo ou
 * `.env` com espaco ou quebra de linha a solta; e, com qualquer metade vazia
 * depois de aparar, devolve as duas vazias (`:490`).
 *
 * `strpos` conta bytes e `indexOf` conta unidades de UTF-16; o resultado da
 * divisao e o mesmo porque `:` e ASCII e nenhum byte de caractere multibyte
 * em UTF-8 vale `0x3A`.
 */
export function separarCredencialDePar(valor: string): CredencialDePar {
  const separador = valor.indexOf(':');
  if (separador === -1) {
    return CREDENCIAL_DE_PAR_VAZIA;
  }
  const username = aparaComoPhp(valor.slice(0, separador));
  const password = aparaComoPhp(valor.slice(separador + 1));
  if (username === '' || password === '') {
    return CREDENCIAL_DE_PAR_VAZIA;
  }
  return { username, password };
}

/** O arranjo que `wp_connectors_get_application_password_credentials()` devolve. */
export interface CredencialDeParResolvida {
  readonly username: MetadeDaCredencial;
  readonly password: MetadeDaCredencial;
  readonly source: OrigemDaCredencial;
}

/**
 * CA-3.1, CA-3.2 e CA-3.4: `wp_connectors_get_application_password_credentials( $auth )`
 * (`connectors.php:522`).
 *
 * Ambiente e constante precisam carregar o par inteiro como `usuario:senha`; o
 * que nao separa avisa (quando ha relator) e cai para o degrau seguinte. O
 * banco guarda o par como arranjo com `username` e `password`
 * (`get_option( $auth['setting_name'] ?? '', array() )`, `:570`), e cada metade
 * so conta se for cadeia (`:571`, `:572`). Ver o item 6 do cabecalho para o que
 * o degrau do banco faz com a metade solta.
 */
export function resolverCredencialDePar(
  dados: PortaDeDados,
  fontes: FontesForaDoBanco,
  autenticacao: AutenticacaoDoConector,
  avisos?: AvisosDaCredencial,
): CredencialDeParResolvida {
  const nomeDaVariavel = autenticacao.env_var_name ?? '';
  const nomeDaConstante = autenticacao.constant_name ?? '';

  for (const degrau of ORDEM_DE_PRECEDENCIA) {
    switch (degrau) {
      case 'env': {
        const valor = nomeDaVariavel === '' ? undefined : valorDoAmbiente(fontes, nomeDaVariavel);
        if (valor !== undefined) {
          const par = separarCredencialDePar(valor);
          if (par.username !== '' && par.password !== '') {
            return { ...par, source: 'env' };
          }
          avisarParMalformado(avisos, MENSAGEM_DE_AMBIENTE_MALFORMADO, nomeDaVariavel);
        }
        break;
      }
      case 'constant': {
        const valor = nomeDaConstante === '' ? undefined : valorDaConstante(fontes, nomeDaConstante);
        if (valor !== undefined) {
          const par = separarCredencialDePar(valor);
          if (par.username !== '' && par.password !== '') {
            return { ...par, source: 'constant' };
          }
          avisarParMalformado(avisos, MENSAGEM_DE_CONSTANTE_MALFORMADA, nomeDaConstante);
        }
        break;
      }
      case 'database': {
        const leitura = lerOpcao(dados, autenticacao.setting_name ?? '');
        // Ausente: o default `array()`. Nome recusado: `false`. Nos dois, nada.
        const guardado = leitura.existe ? leitura.valor : undefined;
        const username = metadeGuardada(guardado, 'username');
        const password = metadeGuardada(guardado, 'password');
        return {
          username,
          password,
          source: !metadeVazia(username) && !metadeVazia(password) ? 'database' : 'none',
        };
      }
    }
  }
  // Inalcancavel: o degrau do banco sempre responde. Mantido para o tipo.
  return { ...CREDENCIAL_DE_PAR_VAZIA, source: 'none' };
}

function avisarParMalformado(
  avisos: AvisosDaCredencial | undefined,
  modelo: string,
  nome: string,
): void {
  if (avisos === undefined) {
    return;
  }
  avisos.avisar({
    funcao: FUNCAO_QUE_RESOLVE_O_PAR,
    mensagem: modelo.replace('%s', avisos.escaparHtml(nome)),
    versao: VERSAO_DO_AVISO_DE_PAR,
  });
}

/** `'' === $valor`, sobre o valor que `get_option()` devolveu. */
function eCadeiaVazia(valor: ValorPhp): boolean {
  return valor.tipo === 'texto' && metadeVazia(valor.valor);
}

function metadeVazia(metade: MetadeDaCredencial): boolean {
  return metade.length === 0;
}

/**
 * `is_array( $stored ) && isset( $stored[$campo] ) && is_string( $stored[$campo] ) ? ... : ''`
 * (`:571`, `:572`). Chave repetida no arranjo: vale a ultima, como no
 * `unserialize()` do PHP.
 */
function metadeGuardada(
  guardado: ValorPhp | undefined,
  campo: 'username' | 'password',
): MetadeDaCredencial {
  if (guardado === undefined || guardado.tipo !== 'arranjo') {
    return '';
  }
  let achado: ValorPhp | undefined;
  for (const entrada of guardado.entradas) {
    if (entrada.chave.tipo === 'texto' && entrada.chave.valor === campo) {
      achado = entrada.valor;
    }
  }
  return achado !== undefined && achado.tipo === 'texto' ? achado.valor : '';
}
