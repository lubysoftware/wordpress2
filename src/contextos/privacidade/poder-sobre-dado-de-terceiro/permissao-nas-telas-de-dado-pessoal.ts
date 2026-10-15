/**
 * Os portoes que **consomem** o poder do nivel mais alto: as tres telas de
 * privacidade do painel, e a soma que uma delas faz.
 *
 * Entrega de **T017** da feature `008-privacidade-e-dados-pessoais` (US-8,
 * `REQ-095`). `caso-de-poder-de-privacidade.ts` diz **em que** os tres nomes
 * resolvem; este arquivo diz **quem os pede**, e com que mensagem recusa. Sao os
 * quatro `if` de primeira linha do legado:
 *
 * | portao | capacidade exigida | ancora | tela |
 * |---|---|---|---|
 * | exportar dado pessoal | `export_others_personal_data` | `wp-admin/export-personal-data.php:12` | `SCR-080` |
 * | apagar dado pessoal | `erase_others_personal_data` **E** `delete_users` | `wp-admin/erase-personal-data.php:12` | `SCR-081` |
 * | configuracao de privacidade | `manage_privacy_options` | `wp-admin/options-privacy.php:12` | `SCR-092` |
 * | guia da politica de privacidade | `manage_privacy_options` | `wp-admin/privacy-policy-guide.php:12` | `SCR-093` |
 *
 * Os dois itens de menu pedem as mesmas capacidades (`wp-admin/menu.php:396`,
 * `:397` e `:413`), e as duas operacoes nomeadas que as telas chamam por
 * requisicao assincrona repetem a **mesma** composicao com outra mensagem
 * (`wp-admin/includes/ajax-actions.php:4996` e `:5187`) — ver
 * {@link MENSAGEM_DA_OPERACAO_NOMEADA}.
 *
 * ---
 *
 * # ⚠️ Apagar pede DUAS capacidades, e sao duas perguntas, nao uma lista
 *
 * ```php
 * // Both capabilities are required to avoid confusion, see `_wp_personal_data_removal_page()`.
 * if ( ! current_user_can( 'erase_others_personal_data' ) || ! current_user_can( 'delete_users' ) ) {
 * ```
 * (`wp-admin/includes/ajax-actions.php:5186`-`:5187`, e o mesmo `||` sem o
 * comentario em `wp-admin/erase-personal-data.php:12`.)
 *
 * UC-25 le isso na linha de *Autorizacao*: *"`erase_others_personal_data` mais
 * `delete_users` para apagar"*, e `SCR-081` registra as duas em *Capacidade
 * exigida*. Duas chamadas com `||` e **nao** uma lista de duas capacidades numa
 * chamada so, e a diferenca e observavel: `current_user_can()` dispara o ponto de
 * extensao `user_has_cap` **uma vez por chamada**, e o `||` do PHP curto-circuita
 * — quem nao tem a primeira nunca faz a segunda pergunta. Uma lista unica
 * dispararia o ponto uma vez e com outro conteudo, o que `P2` poe em
 * contrato publico. Por isso {@link permissaoDeApagarDadoDeTerceiro} pergunta
 * duas vezes, nesta ordem, e para na primeira recusa.
 *
 * ⚠️ `delete_users` **nao** passa pelo caso deste modulo: e capacidade primitiva,
 * esta na matriz de fabrica (`schema.php:869`, no administrador) e atravessa a
 * traducao pelo `default:`. Em rede ela tambem nao e recortada aqui — `PERM-10` e
 * a consequencia declarada em
 * `plataforma/autorizacao/revogacao-por-constante.ts`.
 *
 * # As mensagens ficam em ingles, e vem byte a byte
 *
 * `EC-05` de `target_screens.md`: *"o `msgid` em ingles **E** a chave do
 * catalogo"*. Traduzir aqui trocaria a chave do catalogo `gettext`. As tres
 * cadeias foram transcritas da tabela de mensagens literais de `SCR-080`,
 * `SCR-081` e `SCR-092`, e conferidas na arvore analisada.
 *
 * ⚠️ **Quem renderiza a recusa nao e este arquivo.** As tres saem por `wp_die()`
 * e `target_screens.md` as manda renderizar na tela compartilhada
 * `tela-de-erro-generica` (`SCR-112`); a resposta HTTP e o HTML sao de **BC-10**
 * (`plataforma/telas`), que nao esta nesta arvore. Aqui a recusa e **dado**:
 * motivo e `msgid`. **Nenhum numero de resposta HTTP e declarado**, porque o `P6`
 * manda nao inventar numero que esta tarefa nao pode conferir.
 */

import {
  comAtor,
  perguntarPermissao,
  type Capacidade,
  type ContextoDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
  CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  casoDePoderDePrivacidade,
} from './caso-de-poder-de-privacidade.js';

/**
 * `delete_users` — a segunda capacidade que o portao de apagar exige.
 *
 * Primitiva, concedida ao administrador pela rotina de povoamento
 * (`wp-admin/includes/schema.php:869`). Fora de uma instalacao em rede ela e
 * tambem a definicao de super administrador (`PERM-9`), e quem a trata assim e
 * `plataforma/autorizacao/decisao-de-capacidade.ts` — nao este arquivo.
 */
export const CAPACIDADE_DE_APAGAR_CONTAS: Capacidade = 'delete_users';

/**
 * As mensagens de recusa, **na forma em que o legado as emite**: `msgid`, nao
 * texto final.
 */
export const MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL = {
  /** `wp-admin/export-personal-data.php:13`. */
  semPoderDeExportar:
    'Sorry, you are not allowed to export personal data on this site.',
  /** `wp-admin/erase-personal-data.php:13`. */
  semPoderDeApagar:
    'Sorry, you are not allowed to erase personal data on this site.',
  /**
   * `wp-admin/options-privacy.php:13`, e a **mesma** cadeia em
   * `wp-admin/privacy-policy-guide.php:13`.
   */
  semPoderDeAdministrarPrivacidade:
    'Sorry, you are not allowed to manage privacy options on this site.',
} as const;

/**
 * A mensagem que as **operacoes nomeadas** emitem no lugar das tres de cima.
 *
 * `wp-admin/includes/ajax-actions.php:4997` e `:5188`, por
 * `wp_send_json_error()` e nao por `wp_die()`. A composicao de capacidades e
 * identica a das telas; o que muda e a mensagem, generica, e a forma da resposta
 * — que e de **BC-11** (`superficies-programaticas`) e nao desta tarefa. Fica
 * declarada aqui para quem portar aquela borda nao redescobrir a diferenca.
 */
export const MENSAGEM_DA_OPERACAO_NOMEADA =
  'Sorry, you are not allowed to perform this action.';

/** Por que o portao de privacidade recusou. Um por `if` do legado. */
export type MotivoDaRecusaDeDadoPessoal =
  /** `! current_user_can( 'export_others_personal_data' )`. */
  | 'sem-poder-de-exportar'
  /** `! current_user_can( 'erase_others_personal_data' )`. */
  | 'sem-poder-de-apagar'
  /**
   * `! current_user_can( 'delete_users' )` — a **segunda** pergunta do portao de
   * apagar, e um motivo proprio porque e um `current_user_can()` proprio.
   */
  | 'sem-poder-de-apagar-contas'
  /** `! current_user_can( 'manage_privacy_options' )`. */
  | 'sem-poder-de-administrar-privacidade';

/** A recusa, com o que uma tela precisa para renderiza-la. */
export interface RecusaDeDadoPessoal {
  readonly motivo: MotivoDaRecusaDeDadoPessoal;
  /** O `msgid` que o legado emite. Ver {@link MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL}. */
  readonly mensagem: string;
}

/**
 * Pergunta uma capacidade **com o caso deste modulo** acrescentado aos que o
 * chamador trouxe.
 *
 * O caso e acrescentado e nao substitui: ele e disjunto de todos os outros do
 * pacote, com a unica sobreposicao declarada em `caso-de-poder-de-privacidade.ts`
 * — `traducaoDePrivacidade`, que devolve a mesma lista pela mesma funcao. E a
 * mesma composicao que `contextos/classificacao` faz com os casos dela, e pela
 * mesma razao: o caso e deste modulo, nao do chamador. Sem ele o `default:` da
 * traducao negaria ate o administrador.
 *
 * Exportada porque os tres portoes **e** a borda que ainda nao existe compoem a
 * pergunta do mesmo jeito, e duas composicoes da mesma pergunta divergiriam no
 * dia em que uma delas ganhasse um caso.
 */
export function podeComOPoderDePrivacidade(
  contexto: ContextoDeAutorizacao,
  capacidade: Capacidade,
): boolean {
  const autorizacao = comAtor(
    {
      ...contexto,
      casosDeTraducao: [
        ...(contexto.casosDeTraducao ?? []),
        casoDePoderDePrivacidade,
      ],
    },
    contexto.ator,
  );

  return perguntarPermissao(autorizacao, capacidade);
}

/** Monta a recusa com o `msgid` do motivo. */
function recusar(
  motivo: MotivoDaRecusaDeDadoPessoal,
  mensagem: string,
): RecusaDeDadoPessoal {
  return { motivo, mensagem };
}

/**
 * O portao da tela de exportacao — `wp-admin/export-personal-data.php:12`.
 *
 * Devolve `null` quando permite, que e o que o legado faz: o `if` nao e tomado e
 * a tela segue. Nada e lido, gravado nem exportado aqui — a recusa de UC-25 e
 * *"a tela nem abre: a verificacao e a primeira linha"*.
 */
export function permissaoDeExportarDadoDeTerceiro(
  contexto: ContextoDeAutorizacao,
): RecusaDeDadoPessoal | null {
  if (
    !podeComOPoderDePrivacidade(
      contexto,
      CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
    )
  ) {
    return recusar(
      'sem-poder-de-exportar',
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeExportar,
    );
  }
  return null;
}

/**
 * O portao da tela de apagamento — `wp-admin/erase-personal-data.php:12`.
 *
 * **Duas perguntas, nesta ordem, com curto-circuito na primeira recusa.** Ver o
 * cabecalho: o `||` do legado e observavel pelo numero de disparos do ponto de
 * extensao. As duas recusas emitem a **mesma** mensagem — e uma `wp_die()` so —,
 * e por isso o motivo e o que as distingue.
 */
export function permissaoDeApagarDadoDeTerceiro(
  contexto: ContextoDeAutorizacao,
): RecusaDeDadoPessoal | null {
  if (
    !podeComOPoderDePrivacidade(contexto, CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO)
  ) {
    return recusar(
      'sem-poder-de-apagar',
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
    );
  }

  if (!podeComOPoderDePrivacidade(contexto, CAPACIDADE_DE_APAGAR_CONTAS)) {
    return recusar(
      'sem-poder-de-apagar-contas',
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
    );
  }

  return null;
}

/**
 * O portao das duas telas de configuracao de privacidade —
 * `wp-admin/options-privacy.php:12` e `wp-admin/privacy-policy-guide.php:12`.
 *
 * Uma funcao para as duas telas porque no legado o `if` e identico, linha por
 * linha, com a mesma mensagem. E o mesmo nome que
 * `wp-admin/includes/class-wp-privacy-policy-content.php:325` pergunta antes de
 * decidir se mostra o aviso de politica desatualizada — aquele caminho nao
 * recusa, apenas cala, e e de outra tarefa.
 */
export function permissaoDeAdministrarPrivacidade(
  contexto: ContextoDeAutorizacao,
): RecusaDeDadoPessoal | null {
  if (
    !podeComOPoderDePrivacidade(
      contexto,
      CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
    )
  ) {
    return recusar(
      'sem-poder-de-administrar-privacidade',
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeAdministrarPrivacidade,
    );
  }
  return null;
}
