/**
 * A area de credencial composta sobre a porta de dados. Entrega de **T007**
 * (US-3).
 *
 * So amarra a porta: as funcoes de `./precedencia.ts` e de
 * `./tela-de-integracoes.ts` recebem a porta por argumento, e esta area a
 * fecha uma vez, na composicao. As fontes de fora do banco **nao** sao fechadas
 * aqui — chegam a cada chamada, do contexto da operacao, porque sao da
 * requisicao (o `@concorrencia` de `PT-017`).
 */

import type { PortaDeDados } from '../portas/index.js';
import type {
  AutenticacaoDoConector,
  ConectorRegistrado,
  FontesForaDoBanco,
  OrigemDaCredencial,
} from './autenticacao-do-conector.js';
import {
  origemDaChaveDeApi,
  resolverCredencialDePar,
  type AvisosDaCredencial,
  type CredencialDeParResolvida,
} from './precedencia.js';
import {
  autenticacaoNaTela,
  type AutenticacaoNaTela,
  type ContextoDaTelaDeIntegracoes,
} from './tela-de-integracoes.js';

export interface AreaDeCredencial {
  /** `_wp_connectors_get_api_key_source()` — `connectors.php:444`. */
  origemDaChaveDeApi(
    fontes: FontesForaDoBanco,
    autenticacao: AutenticacaoDoConector,
  ): OrigemDaCredencial;
  /** `wp_connectors_get_application_password_credentials()` — `connectors.php:522`. */
  resolverCredencialDePar(
    fontes: FontesForaDoBanco,
    autenticacao: AutenticacaoDoConector,
    avisos?: AvisosDaCredencial,
  ): CredencialDeParResolvida;
  /** O `$auth_out` da tela de integracoes — `connectors.php:912`. */
  autenticacaoNaTela(
    conector: ConectorRegistrado,
    contexto: ContextoDaTelaDeIntegracoes,
  ): AutenticacaoNaTela;
}

export function criarAreaDeCredencial(dados: PortaDeDados): AreaDeCredencial {
  return {
    origemDaChaveDeApi: (fontes, autenticacao) =>
      origemDaChaveDeApi(dados, fontes, autenticacao),
    resolverCredencialDePar: (fontes, autenticacao, avisos) =>
      resolverCredencialDePar(dados, fontes, autenticacao, avisos),
    autenticacaoNaTela: (conector, contexto) =>
      autenticacaoNaTela(dados, conector, contexto),
  };
}
