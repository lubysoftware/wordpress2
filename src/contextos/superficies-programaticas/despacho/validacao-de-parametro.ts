/**
 * A validacao de parametro — **declarada e vazia**, que e o que **T002** entrega:
 * *"os dois formatos existem como declaracao, com validacao de parametro ainda
 * vazia"*.
 *
 * Tarefa **T002** da feature `013-superficies-programaticas`.
 * `satisfaz: — (infraestrutura)`. **Quem a preenche e T005** (US-2), e os cinco
 * criterios dela estao na tabela abaixo.
 *
 * ---
 *
 * ## Vazia, e nao "permissiva": a diferenca esta no retorno
 *
 * Uma funcao que devolvesse "valido" sem conferir nada seria uma mentira que
 * T003 poderia acreditar. {@link ConferenciaDeParametros} tem por isso um campo
 * {@link ConferenciaDeParametros.conferido}, e enquanto T005 nao chega ele e
 * **`false`** — quem usar o resultado sem olha-lo esta usando uma conferencia
 * que nao aconteceu. O teste desta tarefa afirma exatamente isso.
 *
 * Nao e cautela de estilo: o **P4** da constituicao cobra que *"toda operacao
 * exposta nova nasce com declaracao explicita de permissao"*, e esta camada e a
 * que vem **depois** do portao (etapa 4 do fluxo de `UC-44`, depois da etapa 3).
 * Validacao que se da por feita e a forma mais barata de passar parametro nao
 * conferido para dentro.
 *
 * ## O que T005 tem de cobrir, com a ancora de cada parte
 *
 * | criterio | o que e | ancora no legado |
 * |---|---|---|
 * | CA-2.1 | conferir tipo, formato e limites **antes** de a rota executar | `class-wp-rest-request.php:903` (`has_valid_params`) |
 * | CA-2.2 | 400 nomeando o campo e o motivo | `rest-api.php:2221` (`rest_validate_value_from_schema`), que carrega `array( 'param' => $param )` no erro |
 * | CA-2.3 | sanitizar **depois** de validar e antes de executar | `class-wp-rest-request.php:833` (`sanitize_params`), e o acrescimo de `rest_parse_request_arg` em `:859` |
 * | CA-2.4 | parametro nao declarado nao chega a execucao | `class-wp-rest-request.php:808` (`get_attributes`) e o recorte por `args` |
 * | CA-2.5 | o esquema que valida e o que publica | `class-wp-rest-server.php:1686`, e a lista de `rest-api.php:2169` |
 *
 * E as tres ordens que nao se pode trocar, porque sao observaveis:
 *
 * 1. **Obrigatoriedade antes de tudo.** O parametro ausente e declarado
 *    obrigatorio recusa antes de qualquer `validate_callback`
 *    (`class-wp-rest-request.php:917`), e a comparacao e **identidade com
 *    `true`**: `required: 1` nao exige nada.
 * 2. **A conferencia de cada parametro antes da conferencia do tratador.** O
 *    `validate_callback` do tratador inteiro roda depois, sobre a requisicao
 *    (`:974`), e **tambem aceita `false`** como recusa, *"for parity with the
 *    per-arg validate_callback"* (`:982`).
 * 3. **Sanitizacao depois de validacao.** Sao dois metodos e duas passagens
 *    (`:833` e `:903`), nao uma.
 *
 * ## O que nao entra aqui
 *
 * O `default` do esquema **nao** e aplicado por esta camada: ele e colhido dos
 * argumentos do tratador casado e posto na requisicao antes do portao de
 * permissao, e e **T003**. Aplicar default aqui mudaria o que o
 * `permission_callback` ve.
 */

import type { EsquemaDeArgumento, EsquemaDosArgumentos } from './esquema-de-rota.js';

/**
 * Um parametro recusado: o campo e o motivo, que e o que CA-2.2 cobra.
 *
 * O legado carrega o nome do parametro **dentro** do erro, em
 * `array( 'param' => $param )`, e e dele que a resposta 400 monta a lista de
 * campos invalidos. Quem fechar T005 confere a forma da resposta contra o
 * oraculo: a **area 1** de `parity_specs.md` poe o corpo do erro em byte a byte.
 */
export interface ParametroRecusado {
  /** O nome do parametro, como ele chegou na requisicao. */
  readonly nome: string;
  /** O codigo do legado — `rest_invalid_param`, `rest_missing_callback_param`, ... */
  readonly codigo: string;
  /** A mensagem, no idioma do catalogo: ingles, que e a chave (`EC-05`). */
  readonly mensagem: string;
}

/**
 * O resultado de conferir os parametros de uma requisicao contra o esquema
 * declarado da rota.
 *
 * ⚠️ **{@link ConferenciaDeParametros.conferido} e `false` em T002.** Ver o
 * cabecalho: "vazia" e uma propriedade do retorno, nao uma frase de comentario.
 */
export interface ConferenciaDeParametros {
  /**
   * `true` quando a conferencia realmente aconteceu.
   *
   * 🔴 Em T002 e sempre `false`: nenhum parametro foi conferido, e
   * {@link ConferenciaDeParametros.recusados} esta vazia por isso, nao por
   * aprovacao. **T005** passa a devolver `true`.
   */
  readonly conferido: boolean;
  /** Os parametros recusados, na ordem em que o legado os encontra. */
  readonly recusados: readonly ParametroRecusado[];
}

/**
 * Confere os parametros de uma requisicao contra o esquema declarado — **e, em
 * T002, nao confere nada**.
 *
 * Devolve `{ conferido: false, recusados: [] }` para toda entrada. A assinatura
 * e a que T005 mantem; o corpo e o que T005 escreve.
 *
 * @param valores Os parametros como chegaram, por nome.
 * @param esquema O `args` do tratador casado — o **mesmo** documento que o mapa
 *   da superficie publica (CA-2.5).
 */
export function conferirParametros(
  valores: Readonly<Record<string, unknown>>,
  esquema: EsquemaDosArgumentos,
): ConferenciaDeParametros {
  // T002 nao le nenhum dos dois, e os nomes ficam para que a assinatura que
  // T005 herda seja a final. `void` em vez de `_` porque `noUnusedParameters`
  // nao esta ligado nesta arvore e o nome documenta o contrato.
  void valores;
  void esquema;

  return { conferido: false, recusados: [] };
}

/**
 * Confere **um** valor contra **um** esquema — e, em T002, nao confere nada.
 *
 * E o `rest_validate_value_from_schema( $value, $args, $param )` do legado
 * (`rest-api.php:2221`), com a mesma ordem de parametros. Devolve a mesma forma
 * de {@link conferirParametros} para que T005 possa compor as duas sem trocar
 * assinatura.
 */
export function conferirValor(
  valor: unknown,
  esquema: EsquemaDeArgumento,
  nome: string,
): ConferenciaDeParametros {
  void valor;
  void esquema;
  void nome;

  return { conferido: false, recusados: [] };
}
