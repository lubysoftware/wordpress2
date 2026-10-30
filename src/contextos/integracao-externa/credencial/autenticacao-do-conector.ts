/**
 * A forma da autenticacao de um conector, as fontes de fora do banco e a ordem
 * de precedencia declarada.
 *
 * Entrega de **T007** (US-3), CA-3.1 e I3 (BR-MIGRAR-070). A precedencia e
 * BR-MIGRAR-068 (`I1`, ADR-0012): *"variavel de ambiente -> constante PHP ->
 * banco"*, lida em `wp-includes/connectors.php:444` a `:468` e repetida, na
 * mesma ordem, em `:522` a `:579`.
 *
 * ── POR QUE AS CHAVES FICAM COM O NOME DO LEGADO ───────────────────────────
 *
 * `method`, `setting_name`, `constant_name`, `env_var_name` e `credentials_url`
 * sao as chaves do arranjo `authentication` que uma extensao passa a
 * `WP_Connector_Registry::register()` (`class-wp-connector-registry.php:36` a
 * `:40`). E superficie que terceiro escreve, e o **P8** a poe no contrato
 * publico — o mesmo motivo pelo qual `ConstantesDoServidor`
 * (`plataforma/autorizacao/revogacao-por-constante.ts`) mantem o nome das
 * constantes. O mesmo vale para o nome de constante e de variavel de ambiente
 * que cada conector declara: `WPCOM_API_KEY` e escrito no arquivo de
 * configuracao de quem instala.
 *
 * ── O QUE NAO ESTA AQUI, E DE QUEM E ───────────────────────────────────────
 *
 * - **O registro de conectores** (`WP_Connector_Registry`, `wp_get_connectors()`,
 *   a acao `wp_connectors_init` de `connectors.php:276`) e a derivacao do nome
 *   de opcao quando o conector nao declara um (`class-wp-connector-registry.php:249`).
 *   Nenhuma tarefa de `tasks.md` o nomeia; ele aparece nos componentes internos
 *   de BC-13 em `target_architecture.md`. Esta area recebe a autenticacao **ja
 *   normalizada** pelo registro, como `_wp_connectors_get_connector_script_module_data()`
 *   a recebe de `wp_get_connectors()` (`connectors.php:910`).
 * - **Os nomes derivados dos provedores de IA** — `connectors_ai_{id}_api_key`
 *   e `{ID}_API_KEY` como constante e como variavel (`connectors.php:387` a
 *   `:398`). Sao do registro, e o conflito REQ-158 x resposta 18 sobre os tres
 *   conectores de IA esta aberto (`../README.md`).
 */

/** Os tres metodos que o registro aceita (`class-wp-connector-registry.php:202`). */
export type MetodoDeAutenticacao = 'api_key' | 'application_password' | 'none';

/**
 * O arranjo `authentication` de um conector registrado. Campo ausente e o
 * `?? ''` do legado.
 */
export interface AutenticacaoDoConector {
  readonly method: MetodoDeAutenticacao;
  /** O nome da opcao do site — o ultimo degrau da precedencia. */
  readonly setting_name?: string;
  /** O nome da constante da instalacao — o segundo degrau. */
  readonly constant_name?: string;
  /** O nome da variavel de ambiente — o primeiro degrau. */
  readonly env_var_name?: string;
  /** Onde obter a credencial; vai para a tela, nunca e chamado. */
  readonly credentials_url?: string;
}

/** O `type` de um conector: o registro so exige cadeia nao vazia. */
export type TipoDeConector = string;

/** O conector, no recorte que a precedencia e a tela de integracoes leem. */
export interface ConectorRegistrado {
  /** A chave do conector no registro (`'akismet'`, `'openai'`). */
  readonly id: string;
  readonly type: TipoDeConector;
  readonly authentication: AutenticacaoDoConector;
}

/**
 * I3 (BR-MIGRAR-070): o servico de filtragem de spam e registrado como conector
 * **no nucleo**, com opcao e constante (`connectors.php:226` a `:244`).
 *
 * *"O registro do conector e nucleo, o classificador e extensao"* — e por isso
 * que a declaracao migra mesmo com o classificador fora de escopo
 * (`discard_log.md`, resposta 13). Ficam fora deste recorte `name`,
 * `description` e `plugin` (com o `is_active` que testa `AKISMET_VERSION`,
 * `:234`): sao do registro e da tela inteira, nao da precedencia.
 *
 * ⚠️ Sem `env_var_name`: o legado nao declara variavel de ambiente para este
 * conector, logo o primeiro degrau **nao e consultado** para ele (`:446`). A
 * precedencia e identica para toda integracao (CA-3.1); o que muda de uma para
 * outra e quais degraus ela declarou.
 */
export const CONECTOR_DE_FILTRAGEM_DE_SPAM: ConectorRegistrado = Object.freeze({
  id: 'akismet',
  type: 'spam_filtering',
  authentication: Object.freeze({
    method: 'api_key',
    credentials_url: 'https://akismet.com/get/',
    setting_name: 'wordpress_api_key',
    constant_name: 'WPCOM_API_KEY',
  }),
});

/**
 * As duas fontes que ficam fora do banco, entregues pelo contexto da operacao.
 *
 * Chegam por argumento, e nao lidas do processo, por duas razoes: a arvore nao
 * le ambiente nem configuracao no carregamento (`EXT-ORDEM`), e o
 * `@concorrencia` de `PT-017` cobra *"dois sites da mesma instalacao com
 * credenciais de conector diferentes"* — a composicao de cada requisicao diz as
 * suas.
 */
export interface FontesForaDoBanco {
  /**
   * `getenv()`: o nome ausente e o `false` do legado. So conta valor que e
   * cadeia nao vazia (`connectors.php:448`).
   */
  readonly ambiente: { readonly [nome: string]: string | undefined };
  /**
   * As constantes definidas na instalacao: o nome ausente e o `! defined()`.
   * O valor e qualquer um, porque o legado testa `is_string()` (`:456`) — uma
   * constante definida como `true` existe e **nao** conta.
   */
  readonly constantes: { readonly [nome: string]: unknown };
}

/** O que `_wp_connectors_get_api_key_source()` devolve (`connectors.php:442`). */
export type OrigemDaCredencial = 'env' | 'constant' | 'database' | 'none';

/**
 * CA-3.1: *"a ordem de precedencia e declarada e identica para toda
 * integracao"*. As duas resolucoes de `./precedencia.ts` percorrem **esta**
 * lista, e nao uma ordem escrita em cada uma — e a observacao de BR-MIGRAR-068:
 * *"a precedencia tem de ser declarada no alvo, nao emergir da ordem de
 * carregamento"*. `'none'` nao e degrau: e o que sobra quando nenhum responde.
 */
export const ORDEM_DE_PRECEDENCIA: readonly Exclude<OrigemDaCredencial, 'none'>[] =
  Object.freeze(['env', 'constant', 'database']);

/** `getenv( $nome )` com o teste de `:448`: cadeia nao vazia, ou nada. */
export function valorDoAmbiente(
  fontes: FontesForaDoBanco,
  nome: string,
): string | undefined {
  if (!Object.hasOwn(fontes.ambiente, nome)) {
    return undefined;
  }
  const valor = fontes.ambiente[nome];
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}

/** `defined() && is_string( constant() ) && '' !==` — `:454` a `:456`. */
export function valorDaConstante(
  fontes: FontesForaDoBanco,
  nome: string,
): string | undefined {
  if (!Object.hasOwn(fontes.constantes, nome)) {
    return undefined;
  }
  const valor = fontes.constantes[nome];
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}
