/**
 * A auto-referencia de `posts.post_parent`, nas **tres** relacoes que ela e.
 *
 * E a entrega que T002 nomeia por extenso — *"incluindo a auto-referencia que
 * liga filho, anexo e versao ao registro pai"* — e a secao *Modelo de dados* do
 * plano diz por que ela nao continua sendo uma coluna so:
 *
 * > **`post_parent` precisa virar tres relacionamentos**: pagina mae, conteudo
 * > anfitriao de anexo e conteudo original de versao. Mante-lo como uma coluna
 * > so reproduz a ambiguidade.
 *
 * `target_data_model.md` mede a mesma coisa na linha de relacionamentos:
 * *"`posts.post_parent` → `posts.ID`, N:1 auto-referencia, integridade
 * **nenhuma**, **3 semanticas** na mesma coluna: pagina filha, anexo e revisao.
 * `0` = ausencia"*.
 *
 * ── O DISCRIMINADOR NAO E INVENCAO: E COMO O LEGADO LE A COLUNA ─────────────
 *
 * Quem separa as tres semanticas e o **`post_type` da linha filha**, e isso esta
 * em um lugar so, visivel de uma vez: `wp_delete_post()` faz **tres** consultas
 * sobre a mesma coluna, uma por semantica, e cada uma se distingue apenas pelo
 * tipo que pede.
 *
 * | semantica | como o legado a pergunta | ancora |
 * |---|---|---|
 * | pagina mae | `WHERE post_parent = %d AND post_type = %s`, com o tipo do proprio pai, e **so se o tipo e hierarquico** | `wp-includes/post.php:3899` |
 * | original da versao | `WHERE post_parent = %d AND post_type = 'revision'` | `wp-includes/post.php:3913` |
 * | anfitriao do anexo | `UPDATE ... WHERE post_parent = %d AND post_type = 'attachment'` | `wp-includes/post.php:3923` |
 *
 * As tres no mesmo lugar tambem mostram que a cascata **nao e uniforme**, e o P5
 * da constituicao poe isso no contrato: pagina filha e anexo sao
 * **reparenteados para o avo**, e a versao e **apagada**. Essa diferenca e de
 * quem apaga (a feature 005), nao deste arquivo — aqui ha so a leitura da
 * coluna.
 *
 * ── O `0` E AUSENCIA, E ISSO TEM CONSEQUENCIA DE CONSULTA ──────────────────
 *
 * `DB-SENT` (BR-MIGRAR-081): *"ausencia de vinculo e escrita como `0`"*, e a
 * consequencia esta nomeada no mesmo lugar — *"um `LEFT JOIN ... WHERE pai IS
 * NULL` **nao encontra orfao nenhum** neste banco"*. Por isso
 * {@link SEM_PAI} e `0` e nao `null`, e por isso {@link VinculoComOPai} tem um
 * caso proprio para a ausencia: num tipo opcional, `0` e `undefined` acabariam
 * confundidos no primeiro `if`.
 *
 * ── O QUE ESTE ARQUIVO NAO DECIDE ──────────────────────────────────────────
 *
 * Nao ha validacao de ciclo, nao ha verificacao de existencia do pai e nao ha
 * recusa de vinculo incoerente. O legado nao tem nenhuma das tres no
 * armazenamento: a prevencao de laco de hierarquia e um **ponto de filtro**
 * (`wp_insert_post_parent`, `wp-includes/post.php:4868`), que e contrato publico
 * (P2), e orfao e estado normal (P5). Recusar aqui fecharia o produto.
 */

/** `post_parent = 0`: ausencia de vinculo, e nao nulo. */
export const SEM_PAI = 0;

/**
 * `attachment` — o tipo que faz a coluna significar *"conteudo anfitriao"*.
 *
 * O valor e declarado aqui porque e **discriminador de uma coluna desta
 * tabela**, e nao porque este contexto conheca anexo: o anexo e de BC-04
 * (`target_architecture.md`), e BR-MIGRAR-002 (*"anexo nunca e publicado"*) e
 * regra de la. Registrado no legado por `create_initial_post_types()`
 * (`wp-includes/post.php:93`).
 */
export const TIPO_DE_ANEXO = 'attachment';

/**
 * `revision` — o tipo que faz a coluna significar *"conteudo original"*.
 *
 * Registrado por `create_initial_post_types()` (`wp-includes/post.php:129`) com
 * `public => false` e `_builtin => true`. A secao *Modelo de dados* do plano:
 * versoes *"continuam sendo conteudo, nao tabela propria"*.
 */
export const TIPO_DE_VERSAO = 'revision';

/**
 * A coluna `post_parent` lida como o que ela e, caso a caso.
 *
 * Os quatro casos sao fechados porque o legado tem quatro: a ausencia e as tres
 * semanticas da tabela de cima. Nao existe quinta — e se um tipo registrado por
 * extensao gravar a coluna, ele cai em `pagina-mae`, que e exatamente como o
 * legado o trata (o unico leitor generico da coluna e `get_children()`,
 * `wp-includes/post.php:999`, que nao pergunta o tipo do filho).
 */
export type VinculoComOPai =
  | { readonly tipo: 'sem-pai' }
  /** Pagina mae: o pai hierarquico do conteudo, lido pelo tipo do pai. */
  | { readonly tipo: 'pagina-mae'; readonly id: number }
  /** Conteudo anfitriao: a linha de `attachment` aponta para quem a hospeda. */
  | { readonly tipo: 'anfitriao-do-anexo'; readonly id: number }
  /** Conteudo original: a linha de `revision` aponta para o que ela versiona. */
  | { readonly tipo: 'original-da-versao'; readonly id: number };

/**
 * O vinculo de uma linha, a partir do tipo **dela** e do valor da coluna.
 *
 * `tipoDoFilho` e `string` e nao uma enumeracao fechada porque
 * `register_post_type()` e ponto de extensao publico: um tipo de terceiro nao e
 * invalido, e `DB-ENUM` (BR-MIGRAR-075) poe o conjunto documentado como *"piso,
 * nao teto"*.
 */
export function vinculoDaLinha(
  tipoDoFilho: string,
  colunaPai: number,
): VinculoComOPai {
  if (colunaPai === SEM_PAI) {
    return { tipo: 'sem-pai' };
  }
  if (tipoDoFilho === TIPO_DE_VERSAO) {
    return { tipo: 'original-da-versao', id: colunaPai };
  }
  if (tipoDoFilho === TIPO_DE_ANEXO) {
    return { tipo: 'anfitriao-do-anexo', id: colunaPai };
  }
  return { tipo: 'pagina-mae', id: colunaPai };
}

/**
 * O valor que vai para a coluna. O caminho de volta, e ele e total: as tres
 * semanticas gravam o identificador e a ausencia grava `0`.
 *
 * E porque este par e total que a linha lida pode guardar **so** o vinculo, sem
 * carregar tambem o inteiro cru: nenhum dos dois lados perde informacao.
 */
export function colunaDoVinculo(vinculo: VinculoComOPai): number {
  return vinculo.tipo === 'sem-pai' ? SEM_PAI : vinculo.id;
}
