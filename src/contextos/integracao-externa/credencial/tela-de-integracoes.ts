/**
 * O que a tela de integracoes diz da credencial de cada conector.
 *
 * Entrega de **T007** (US-3): CA-3.2 (*"isso e visivel na tela de
 * integracoes"*) e CA-3.5 (*"a tela de integracoes diz, para cada uma, de onde
 * a credencial corrente veio — sem mostrar o valor"*). E o arranjo
 * `authentication` que `_wp_connectors_get_connector_script_module_data()`
 * monta para cada conector (`wp-includes/connectors.php:911` a `:936`) e entrega
 * ao modulo de script da tela pelo filtro
 * `script_module_data_options-connectors-wp-admin` (`:965`).
 *
 * As chaves sao as do legado (`method`, `settingName`, `credentialsUrl`,
 * `keySource`, `isConnected`): e o contrato com o script da tela, e a tela entra
 * como dado — a arvore nao monta marcacao.
 *
 * **Sem valor, por construcao.** Nenhum campo deste objeto carrega a
 * credencial: o legado expoe a origem (`keySource`) e o booleano de conexao, e
 * so. O que a tela mostra da chave guardada vem por outro caminho — a resposta
 * de `/wp/v2/settings`, mascarada por `_wp_connectors_rest_settings_dispatch()`
 * (`:697`) —, que e US-4 (CA-4.3) e T009, nao esta tarefa.
 *
 * ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────
 *
 * - **O resto do conector na tela** — `name`, `description`, `logoUrl`, `type`,
 *   `plugin` com `isInstalled`/`isActivated` (`:938` a `:956`), a ordenacao por
 *   `ksort()` (`:960`) e `isFileModDisabled` (`:962`). Dependem do registro de
 *   conectores e de `validate_plugin()`, e nenhum deles diz de onde a credencial
 *   veio. Quem portar a tela inteira compoe esta funcao conector a conector.
 * - **O filtro `script_module_data_options-connectors-wp-admin`**, que roda
 *   sobre o arranjo inteiro: pertence a montagem da tela (P2, declarado aqui com
 *   nome e posicao — depois de montado o arranjo, antes de entregue ao script).
 */

import type { Capacidade } from '../../../plataforma/autorizacao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import type {
  ConectorRegistrado,
  FontesForaDoBanco,
  MetodoDeAutenticacao,
  OrigemDaCredencial,
} from './autenticacao-do-conector.js';
import {
  origemDaChaveDeApi,
  resolverCredencialDePar,
  type AvisosDaCredencial,
} from './precedencia.js';

/**
 * A consulta ao registro do cliente de IA que a tela faz para conector do tipo
 * `ai_provider` (`:922`):
 * `$registry->hasProvider( $id ) && $registry->isProviderConfigured( $id )`.
 *
 * **Ligacao tardia.** O cliente de IA e componente interno de BC-13 sem tarefa
 * em `tasks.md`, e o conflito REQ-158 x resposta 18 esta aberto: chega pelo
 * contexto da operacao, nunca por `import`. Excecao lancada vira `false`
 * (`:923`, `:924`), e isso e reproduzido aqui.
 */
export interface RegistroDeProvedoresDeIa {
  temProvedor(idDoConector: string): boolean;
  provedorConfigurado(idDoConector: string): boolean;
}

/** O tipo que muda a regra de `isConnected` (`:920`). */
export const TIPO_PROVEDOR_DE_IA = 'ai_provider';

/** O arranjo `authentication` de um conector, como a tela o recebe. */
export type AutenticacaoNaTela =
  | { readonly method: 'none' }
  | {
      readonly method: Exclude<MetodoDeAutenticacao, 'none'>;
      readonly settingName: string;
      readonly credentialsUrl: string | null;
      readonly keySource: OrigemDaCredencial;
      readonly isConnected: boolean;
    };

/**
 * O que a tela precisa alem do conector. `avisos` e o mesmo de
 * `./precedencia.ts`: a tela resolve o par pelo mesmo caminho, logo avisa pelo
 * mesmo caminho.
 */
export interface ContextoDaTelaDeIntegracoes {
  readonly fontes: FontesForaDoBanco;
  readonly provedoresDeIa: RegistroDeProvedoresDeIa;
  readonly avisos?: AvisosDaCredencial;
}

/**
 * CA-3.2 e CA-3.5: o `$auth_out` de um conector (`connectors.php:912` a `:936`).
 *
 * Para `api_key`, a origem e a de {@link origemDaChaveDeApi}; `isConnected` e
 * *"origem diferente de `'none'`"* (`:927`), salvo no provedor de IA, em que
 * e o registro do cliente de IA quem responde (`:922`) — a origem continua
 * sendo dita, independente dele. Para `application_password`, origem e
 * conexao saem da mesma resolucao (`:930` a `:935`).
 */
export function autenticacaoNaTela(
  dados: PortaDeDados,
  conector: ConectorRegistrado,
  contexto: ContextoDaTelaDeIntegracoes,
): AutenticacaoNaTela {
  const autenticacao = conector.authentication;

  if (autenticacao.method === 'api_key') {
    const keySource = origemDaChaveDeApi(dados, contexto.fontes, autenticacao);
    return {
      method: 'api_key',
      settingName: autenticacao.setting_name ?? '',
      credentialsUrl: autenticacao.credentials_url ?? null,
      keySource,
      isConnected:
        conector.type === TIPO_PROVEDOR_DE_IA
          ? provedorConectado(contexto.provedoresDeIa, conector.id)
          : keySource !== 'none',
    };
  }

  if (autenticacao.method === 'application_password') {
    const credencial = resolverCredencialDePar(
      dados,
      contexto.fontes,
      autenticacao,
      contexto.avisos,
    );
    return {
      method: 'application_password',
      settingName: autenticacao.setting_name ?? '',
      credentialsUrl: autenticacao.credentials_url ?? null,
      keySource: credencial.source,
      isConnected: credencial.username.length > 0 && credencial.password.length > 0,
    };
  }

  return { method: 'none' };
}

function provedorConectado(
  registro: RegistroDeProvedoresDeIa,
  idDoConector: string,
): boolean {
  try {
    return registro.temProvedor(idDoConector) && registro.provedorConfigurado(idDoConector);
  } catch {
    return false;
  }
}

/** As duas operacoes de US-3, com o nome que este modulo lhes da. */
export type OperacaoDaCredencial = 'resolver-credencial' | 'ver-origem-na-tela';

/** A declaracao de permissao de uma operacao (P4). */
export interface PermissaoDaCredencial {
  /** `null` quando o legado nao pergunta capacidade nenhuma. */
  readonly capacidade: Capacidade | null;
  /** Onde o legado decide, ou por que nao decide. */
  readonly ancora: string;
}

/**
 * P4: a declaracao explicita de permissao das duas operacoes.
 *
 * - **Resolver** nao pergunta capacidade: quem resolve e o sistema, no `init`
 *   (`_wp_connectors_pass_default_keys_to_ai_client()`, `connectors.php:854` e
 *   `:891`), ou a tela, depois da verificacao dela. Acrescentar uma fecharia o
 *   sistema mais que o original.
 * - **Ver a origem na tela** exige `manage_options`: o item de menu
 *   (`wp-admin/menu.php:407`) e a propria tela, que responde 403 sem ela
 *   (`wp-admin/options-connectors.php:13`). A verificacao e da borda que servir
 *   a tela; a capacidade e declarada aqui, onde nasce o dado.
 */
export const PERMISSOES_DA_CREDENCIAL: Readonly<
  Record<OperacaoDaCredencial, PermissaoDaCredencial>
> = Object.freeze({
  'resolver-credencial': {
    capacidade: null,
    ancora: 'wp-includes/connectors.php:891 (init, sem ator)',
  },
  'ver-origem-na-tela': {
    capacidade: 'manage_options',
    ancora: 'wp-admin/options-connectors.php:13',
  },
});
