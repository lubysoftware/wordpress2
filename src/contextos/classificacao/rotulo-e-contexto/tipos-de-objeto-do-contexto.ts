/**
 * **CA-1.4**: *"Contexto de classificacao e declarado e diz a quais tipos de
 * conteudo se aplica"*.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo` (US-1). Sao as
 * duas funcoes publicadas do legado que leem a declaracao pelo outro lado — do
 * **tipo de objeto** para o contexto:
 *
 * | aqui | no legado |
 * |---|---|
 * | {@link contextosDoTipoDeObjeto} | `get_object_taxonomies( $tipo, 'objects' )`, `wp-includes/taxonomy.php:311` |
 * | {@link nomesDosContextosDoTipoDeObjeto} | `get_object_taxonomies( $tipo )`, mesma funcao com `$output = 'names'` |
 * | {@link contextoAceitaTipoDeObjeto} | `is_object_in_taxonomy( $tipo, $contexto )`, `:5015` |
 *
 * A **declaracao** em si e de T001 (`../registro/contexto-de-classificacao.ts`,
 * campo `tiposDeObjeto`, o `$object_type` de `register_taxonomy()`). O que esta
 * tarefa acrescenta e a pergunta inversa, que e a que decide vinculo.
 *
 * ---
 *
 * # Por que "tipo de objeto" e nao "tipo de conteudo"
 *
 * ⚠️ O criterio escreve *"tipos de conteudo"* e o legado fala **objeto**, e a
 * diferenca tem dono: `link_category` se aplica a `link`, que **nao e
 * conteudo**. E dessa coluna polimorfica que vem a fusao de BC-02
 * (`target_architecture.md` chama a fusao de *"contraintuitiva e necessaria"*,
 * porque separa-la *"deixaria a coluna polimorfica sem dono"*), e e a Pergunta 2
 * que proibe que o modelo novo *"recuse hoje o que o legado aceita"*. Por isso
 * o parametro destas tres funcoes se chama `tipoDeObjeto`, aceita `'link'` como
 * aceita `'post'`, e nenhuma delas consulta registro de tipo de conteudo.
 *
 * **Isto nao e divergencia de comportamento, e so de vocabulario**: a leitura
 * que o criterio descreve — *"so contextos declarados para aquele tipo aceitam
 * vinculo"* — e exatamente o que `is_object_in_taxonomy()` responde. A escolha
 * de palavra esta registrada aqui para que a proxima onda nao "conserte" o nome
 * e, com ele, o alcance.
 *
 * # A recusa de CA-1.4 e SILENCIOSA, e isso e regra
 *
 * `UT-033-4` chama este caso de *"recusa o vinculo em tipo de conteudo que o
 * contexto nao declara"*, e a palavra "recusa" nao significa erro: no legado
 * **nao ha mensagem, nao ha excecao e nao ha registro**. Os dois chamadores
 * decidem com um `if` e seguem adiante:
 *
 * ```php
 * if ( is_object_in_taxonomy( $post_type, 'category' ) ) {
 *     wp_set_post_categories( $post_id, $post_category );
 * }
 * if ( isset( $postarr['tags_input'] ) && is_object_in_taxonomy( $post_type, 'post_tag' ) ) {
 *     wp_set_post_tags( $post_id, $postarr['tags_input'] );
 * }
 * ```
 * (`wp-includes/post.php:5053` e `:5057`.)
 *
 * O P7 da constituicao poe esse silencio no contrato — *"preserve o modo de
 * falha, inclusive o silencio"*. Logo estas funcoes devolvem **booleano e
 * lista**, nunca erro: quem recusa e quem pergunta. A terceira recusa do mesmo
 * laco, a do contexto **nao registrado**, tambem e silenciosa e e de outra
 * forma — `_doing_it_wrong()` mais `continue` (`post.php:5091`-`:5098`) —, e e
 * do caminho de gravacao de conteudo (BC-01) e de US-2.
 *
 * # 🔴 O ramo de anexo nao esta aqui, e e declarado
 *
 * `get_object_taxonomies()` comeca com um ramo que esta tarefa **nao** porta
 * (`:312`-`:317`):
 *
 * ```php
 * if ( is_object( $object_type ) ) {
 *     if ( 'attachment' === $object_type->post_type ) {
 *         return get_attachment_taxonomies( $object_type, $output );
 *     }
 *     $object_type = $object_type->post_type;
 * }
 * ```
 *
 * Ele aceita **a linha de `posts`** no lugar do nome do tipo e, para anexo,
 * desvia para `get_attachment_taxonomies()` (`wp-includes/media.php`), que le o
 * tipo MIME do arquivo e devolve contextos por `attachment:image`,
 * `attachment:audio` e afins. Isso atravessa `posts` e o metadado do anexo —
 * **BC-01 e BC-03**, por ligacao tardia (AD-10) — e a regra de dependencia 3
 * proibe o atalho. Aqui as funcoes recebem **nome de tipo**, que e a forma com
 * que os dois chamadores de `wp_insert_post()` as chamam, e o ramo de objeto
 * fica declarado para quem portar a ingestao de midia.
 *
 * # As duas funcoes de mutacao da declaracao, e de quem sao
 *
 * `register_taxonomy_for_object_type()` (`:768`) e
 * `unregister_taxonomy_for_object_type()` (`:810`) acrescentam e removem tipo de
 * objeto de um contexto **ja registrado**, em execucao. Sao API publica, logo o
 * **P8** as mantem em escopo — *"nao remova funcao... Retrocompatibilidade e
 * restricao absoluta"* —, mas elas escrevem no registro e nao sao lidas por
 * nenhum dos criterios de US-1 a US-5: pertencem a superficie de
 * `../registro/registro-de-contextos.ts`, onde as outras cinco moram. Ficam
 * declaradas aqui para que quem as portar as ponha la, e nao numa segunda
 * copia do registro.
 */

import type { ContextoDeClassificacao } from '../registro/index.js';
import type { EscopoDeRotuloEContexto } from './escopo-de-rotulo-e-contexto.js';

/**
 * Os contextos registrados que se aplicam ao tipo (ou a qualquer um dos tipos)
 * informado — `get_object_taxonomies( $tipo, 'objects' )`.
 *
 * **A ordem e a do registro, e ela e dado.** O legado itera
 * `$wp_taxonomies`, que e um arranjo associativo alimentado por insercao, logo
 * a sequencia de comandos que sai de qualquer laco sobre este resultado segue
 * essa ordem — e a area 3 da Decisao 2 de `parity_specs.md` compara *"snapshot
 * + sequencia de comandos"*. `../../conteudo/publicacao/contexto-de-publicacao.ts`
 * registra a mesma observacao do lado de quem consome, no laco do termo padrao.
 *
 * ⚠️ **O legado devolve um mapa com o nome na chave**, e aqui o retorno e uma
 * lista. O mapa do PHP preserva ordem de insercao e o nome esta dentro de cada
 * contexto ({@link ContextoDeClassificacao.nome}), logo nada do observavel se
 * perde — e uma lista nao convida a quem le a depender de ordem de chave, que
 * em JavaScript nao e a mesma coisa que no PHP.
 *
 * Lista de tipos vazia devolve lista vazia, como `array_intersect` com arranjo
 * vazio devolve vazio.
 */
export function contextosDoTipoDeObjeto(
  escopo: EscopoDeRotuloEContexto,
  tipoDeObjeto: string | readonly string[],
): readonly ContextoDeClassificacao[] {
  // `$object_type = (array) $object_type;` (`:320`): cadeia unica vira lista de
  // um.
  const tipos = typeof tipoDeObjeto === 'string' ? [tipoDeObjeto] : tipoDeObjeto;

  // `array_intersect( $object_type, (array) $tax_obj->object_type )` (`:325`):
  // basta UM tipo em comum, e o laco corre o registro na ordem de insercao.
  return escopo.contextos
    .listar()
    .filter((contexto) =>
      contexto.tiposDeObjeto.some((declarado) => tipos.includes(declarado)),
    );
}

/**
 * Os **nomes** dos contextos que se aplicam ao tipo —
 * `get_object_taxonomies( $tipo )`, que e o default `$output = 'names'`.
 *
 * E a forma que `is_object_in_taxonomy()` consome e a que quase todo chamador
 * do legado usa. Duas funcoes em vez de um parametro `$output` porque em
 * TypeScript o tipo do retorno nao pode depender do valor de uma cadeia sem
 * sobrecarga — e a sobrecarga esconderia que **sao dois contratos publicos**
 * com o mesmo corpo.
 */
export function nomesDosContextosDoTipoDeObjeto(
  escopo: EscopoDeRotuloEContexto,
  tipoDeObjeto: string | readonly string[],
): readonly string[] {
  return contextosDoTipoDeObjeto(escopo, tipoDeObjeto).map(
    (contexto) => contexto.nome,
  );
}

/**
 * Se aquele tipo de objeto aceita vinculo naquele contexto —
 * `is_object_in_taxonomy( $object_type, $taxonomy )` (`:5015`).
 *
 * **E a decisao de CA-1.4**, e ela e booleana por projeto: ver *A recusa de
 * CA-1.4 e SILENCIOSA* no cabecalho deste arquivo.
 *
 * ⚠️ A guarda `if ( empty( $taxonomies ) ) { return false; }` (`:5017`) e
 * **redundante** no legado — `in_array` sobre lista vazia ja devolve falso — e
 * esta portada assim mesmo: ela e o primeiro `return` da funcao e esta tarefa
 * nao reescreve o que o legado escreveu, mesmo quando a reescrita seria
 * equivalente. Compare com o `if ( ! empty( $tt_id ) )` que
 * `../armazenamento/rotulo-no-contexto.ts` porta pela mesma razao.
 *
 * O contexto **nao** precisa estar registrado para a resposta ser falsa: um
 * contexto que ninguem registrou nao aparece em
 * {@link nomesDosContextosDoTipoDeObjeto} e portanto nao esta na lista. E a
 * mesma recusa, pelo mesmo caminho, e e por isso que o legado nao chama
 * `taxonomy_exists()` aqui.
 */
export function contextoAceitaTipoDeObjeto(
  escopo: EscopoDeRotuloEContexto,
  tipoDeObjeto: string,
  contexto: string,
): boolean {
  const nomes = nomesDosContextosDoTipoDeObjeto(escopo, tipoDeObjeto);

  if (nomes.length === 0) {
    return false;
  }

  // `in_array( $taxonomy, $taxonomies, true )` (`:5020`): comparacao estrita.
  return nomes.includes(contexto);
}
