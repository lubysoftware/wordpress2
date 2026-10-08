/**
 * O erro do registro de contexto de classificacao: a forma que `WP_Error` tem
 * em `register_taxonomy()` e em `unregister_taxonomy()`.
 *
 * Mesma escolha de `../../identidade-e-acesso/cadastro/erro-de-cadastro.ts`, e
 * pela mesma razao: **e valor devolvido, nunca excecao.** O legado devolve
 * `WP_Error` nos dois pontos (`wp-includes/taxonomy.php:529` e `:609`), e quem
 * chama `register_taxonomy()` nao esta num `try` — esta no arranque, onde uma
 * excecao derrubaria a instalacao inteira em vez de recusar um registro.
 *
 * ## O codigo repetido com dois textos e do legado
 *
 * ⚠️ `invalid_taxonomy` cobre **dois** casos de `unregister_taxonomy()` com
 * mensagens diferentes: contexto inexistente (`:609`) e contexto do nucleo
 * (`:616`). Um porte que separasse os codigos produziria um sistema mais
 * informativo que o original, o que o **P1** trata como divergencia e nao como
 * melhoria. Por isso o codigo e um e a mensagem e que distingue.
 *
 * ## As mensagens ficam em ingles
 *
 * `EC-05` de `target_screens.md` fixa que *"o `msgid` em ingles E a chave do
 * catalogo"*: traduzir aqui trocaria a chave. O leitor de `.mo`/`.po` e T009 da
 * feature `015-plataforma-transversal`, e nenhuma destas mensagens passa por ele
 * nesta tarefa.
 */

/** Os codigos que o registro emite, com o nome que o legado lhes da. */
export type CodigoDeErroDeRegistro =
  /**
   * O nome do contexto esta vazio ou passa de
   * {@link LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO} bytes
   * (`wp-includes/taxonomy.php:527`).
   */
  | 'taxonomy_length_invalid'
  /**
   * `unregister_taxonomy()`: o contexto nao existe, **ou** existe e e do nucleo.
   * Ver a ressalva do cabecalho.
   */
  | 'invalid_taxonomy';

/**
 * As mensagens, na forma em que o legado as emite.
 *
 * `taxonomy_length_invalid` carrega os numeros `1` e `32` **dentro do `msgid`**,
 * e e assim no legado: mudar
 * {@link LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO} nao
 * muda a mensagem, porque a chave do catalogo e fixa. Interpolar o limite aqui
 * trocaria a chave e perderia a traducao — o mesmo caso dos `60` e `50` do
 * cadastro em BC-05.
 */
export const MENSAGENS_DE_ERRO_DE_REGISTRO = {
  /** `wp-includes/taxonomy.php:529`. */
  taxonomy_length_invalid:
    'Taxonomy names must be between 1 and 32 characters in length.',
  /** `wp-includes/taxonomy.php:609` — contexto inexistente. */
  invalid_taxonomy: 'Invalid taxonomy.',
  /** `wp-includes/taxonomy.php:616` — contexto do nucleo, mesmo codigo. */
  invalid_taxonomy_do_nucleo:
    'Unregistering a built-in taxonomy is not allowed.',
} as const;

/** O erro do registro. Equivale a um `WP_Error` com um codigo e uma mensagem. */
export interface ErroDeRegistro {
  readonly erroDeRegistro: true;
  readonly codigo: CodigoDeErroDeRegistro;
  readonly mensagem: string;
}

/** Monta o erro. */
export function erroDeRegistro(
  codigo: CodigoDeErroDeRegistro,
  mensagem: string,
): ErroDeRegistro {
  return { erroDeRegistro: true, codigo, mensagem };
}

/** Reconhece o erro no meio de um valor devolvido. */
export function ehErroDeRegistro(valor: unknown): valor is ErroDeRegistro {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeRegistro?: unknown }).erroDeRegistro === true
  );
}
