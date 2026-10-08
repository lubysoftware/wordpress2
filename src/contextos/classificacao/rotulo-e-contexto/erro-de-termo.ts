/**
 * O erro do caminho do termo: a forma que `WP_Error` tem em `get_term()`, em
 * `WP_Term::get_instance()` e em `wp_update_term()`.
 *
 * Mesma escolha de `../registro/erro-de-registro.ts` e de
 * `../../identidade-e-acesso/cadastro/erro-de-cadastro.ts`, e pela mesma razao:
 * **e valor devolvido, nunca excecao.** `plan.md` desta feature fixa a forma na
 * secao *Contratos* — a coluna de erros lista o que cada operacao **devolve** —
 * e no legado quem chama `get_term()` nao esta num `try`: esta num laco de
 * tela, ou dentro de `wp_delete_term()`, que repassa o erro adiante
 * (`wp-includes/taxonomy.php:2066`).
 *
 * ## Por que estes codigos nao moram em `../registro/erro-de-registro.ts`
 *
 * Sao duas familias de erro com um codigo em comum e consequencias diferentes.
 * `erro-de-registro.ts` cobre o que `register_taxonomy()` e
 * `unregister_taxonomy()` recusam — nome de contexto invalido, contexto
 * inexistente, contexto do nucleo. Aqui o assunto e **o rotulo dentro de um
 * contexto**: o identificador vazio, o contexto nao registrado **da linha
 * lida**, o rotulo compartilhado entre dois contextos validos e o nome vazio na
 * renomeacao.
 *
 * ⚠️ `invalid_taxonomy` aparece nas duas, com a **mesma** mensagem
 * (`'Invalid taxonomy.'`) e por motivos diferentes: no registro e o contexto que
 * se tentou remover; aqui e o contexto que a linha de `term_taxonomy` nomeia e
 * que **nenhum registro conhece** (`wp-includes/class-wp-term.php:173`) — a
 * linha tolerada de que fala `../armazenamento/rotulo-no-contexto.ts`. Um porte
 * que unificasse as duas familias num tipo so teria de escolher uma mensagem
 * para `ambiguous_term_id` e perderia o `dado` que o legado carrega.
 *
 * ## As mensagens ficam em ingles
 *
 * `EC-05` de `target_screens.md` fixa que *"o `msgid` em ingles E a chave do
 * catalogo"*: traduzir aqui trocaria a chave. O leitor de `.mo`/`.po` e T009 da
 * feature `015-plataforma-transversal`.
 */

/** Os codigos que o caminho do termo emite, com o nome que o legado lhes da. */
export type CodigoDeErroDeTermo =
  /**
   * `get_term()` com identificador vazio: `empty( $term )`
   * (`wp-includes/taxonomy.php:979`). Tambem e o `! $term` de
   * `wp_update_term()` (`:3279`), que e outro caso com o mesmo codigo — ver
   * {@link MENSAGENS_DE_ERRO_DE_TERMO}.
   */
  | 'invalid_term'
  /**
   * O contexto pedido nao esta registrado (`:983`), **ou** o contexto da linha
   * lida nao esta (`class-wp-term.php:173`).
   */
  | 'invalid_taxonomy'
  /**
   * O rotulo serve mais de um contexto **valido** e ninguem disse qual
   * (`class-wp-term.php:160`). E o unico codigo deste arquivo que carrega
   * {@link ErroDeTermo.dado}.
   */
  | 'ambiguous_term_id'
  /**
   * Renomear para nome vazio: `'' === trim( $name )`
   * (`wp-includes/taxonomy.php:3308`, e o mesmo em `wp_insert_term()`,
   * `:2486`).
   */
  | 'empty_term_name';

/**
 * As mensagens, na forma em que o legado as emite.
 *
 * ⚠️ **`ambiguous_term_id` nao termina em ponto, e as outras tres terminam.**
 * E assim no legado (`class-wp-term.php:160`), e o `msgid` e a chave do
 * catalogo: acrescentar o ponto por simetria trocaria a chave e perderia a
 * traducao. O mesmo cuidado que `../registro/erro-de-registro.ts` tem com os
 * numeros dentro do `msgid`.
 */
export const MENSAGENS_DE_ERRO_DE_TERMO = {
  /** `wp-includes/taxonomy.php:979` e `:3279`. */
  invalid_term: 'Empty Term.',
  /** `wp-includes/taxonomy.php:983` e `class-wp-term.php:173`. */
  invalid_taxonomy: 'Invalid taxonomy.',
  /** `wp-includes/class-wp-term.php:160` — **sem ponto final**. */
  ambiguous_term_id: 'Term ID is shared between multiple taxonomies',
  /** `wp-includes/taxonomy.php:3308`. */
  empty_term_name: 'A name is required for this term.',
} as const;

/** O erro do caminho do termo. Equivale a um `WP_Error` com codigo, mensagem e dado. */
export interface ErroDeTermo {
  readonly erroDeTermo: true;
  readonly codigo: CodigoDeErroDeTermo;
  readonly mensagem: string;
  /**
   * O terceiro argumento de `WP_Error`, que o legado preenche **so** em
   * `ambiguous_term_id`, com o identificador do rotulo
   * (`class-wp-term.php:160`).
   *
   * E `null` nos outros tres porque o legado nao passa nada — e `WP_Error` sem
   * dado devolve cadeia vazia em `get_error_data()`. Carregar o identificador
   * aqui nao e enfeite: e o que permite a quem chama saber **qual** rotulo
   * precisa de desambiguacao sem repetir a leitura.
   */
  readonly dado: number | null;
}

/** Monta o erro. */
export function erroDeTermo(
  codigo: CodigoDeErroDeTermo,
  mensagem: string,
  dado: number | null = null,
): ErroDeTermo {
  return { erroDeTermo: true, codigo, mensagem, dado };
}

/** Reconhece o erro no meio de um valor devolvido. */
export function ehErroDeTermo(valor: unknown): valor is ErroDeTermo {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeTermo?: unknown }).erroDeTermo === true
  );
}
