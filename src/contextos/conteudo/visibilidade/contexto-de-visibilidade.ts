/**
 * O contexto das decisoes de visibilidade: o que US-4 precisa e que **nao e**
 * porta deste modulo.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). Mesma forma
 * e mesmas razoes de `../publicacao/contexto-de-publicacao.ts`, e as duas valem
 * palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade e consulta no escopo da REQUISICAO, e a
 *   area 5 do criterio de paridade tem tolerancia **zero**. Nesta tarefa isso
 *   pesa duas vezes: a MESMA linha de conteudo e servida a um ator e negada a
 *   outro, e a decisao e so do ator da requisicao;
 * - **a decisao de capacidade chega por `import` de `plataforma/`, nao por
 *   porta.** A regra de dependencia 1 permite `contextos/` para `plataforma/`, e
 *   `target_architecture.md` poe em `plataforma/autorizacao/` *"a decisao de
 *   capacidade e a traducao de capacidade sobre objeto (`map_meta_cap`)"*.
 *
 * ---
 *
 * # Este contexto e MENOR que o da publicacao, e e de proposito
 *
 * As duas funcoes do legado que US-4 porta nao leem quase nada:
 *
 * | o que o legado le | onde | como chega aqui |
 * |---|---|---|
 * | `$post_type->cap->publish_posts` | `class-wp-rest-posts-controller.php:1576`, `wp-admin/includes/post.php:142` | {@link ContextoDeVisibilidade.tipoDeConteudo} |
 * | `current_user_can( ... )` | as mesmas duas linhas | {@link ContextoDeLeituraDeConteudo.base} e `.ator` |
 * | `current_user_can( 'read_post', $post->ID )` | `class-wp-query.php:3554` | as mesmas duas, com o caso de conteudo registrado em `base.casosDeTraducao` |
 *
 * **Nao ha porta de dados neste contexto, e a ausencia e a regra.** A leitura da
 * linha de conteudo que a decisao de leitura precisa e feita por
 * `FonteDeConteudoNaAutorizacao`, que o **caso de traducao** carrega
 * (`plataforma/autorizacao/conteudo-na-autorizacao.ts`): no legado o objeto do
 * `map_meta_cap()` sai de `get_post( $args[0] )` dentro do proprio mapeamento, e
 * nao de uma leitura do chamador. Pedir aqui uma segunda leitura produziria uma
 * consulta que o legado nao emite — e isso e efeito no banco (area 3 da
 * Decisao 2).
 *
 * **E nao ha relogio.** Nenhuma das regras de US-4 compara data: o estado
 * `private` **nao** tem data flutuante e **nao** passa pela comparacao que
 * produz o agendado — `wp_insert_post()` so troca `publish` por `future` e
 * `future` por `publish` (`wp-includes/post.php:4797`-`:4808`), logo conteudo
 * privado com data a frente continua privado. Quem fizer **T013** (US-6)
 * precisa disso: a comparacao de data nao alcanca este estado.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
  TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';

/**
 * O contexto de uma decisao de **leitura** de conteudo.
 *
 * {@link ContextoDeLeituraDeConteudo.base} e
 * {@link ContextoDeLeituraDeConteudo.ator} chegam separados de proposito, como
 * em `../publicacao/contexto-de-publicacao.ts`: a base e o que nao muda dentro
 * da requisicao (matriz gravada, rede, constantes, casos de traducao) e o ator e
 * quem le. Junta-los esconderia que a **mesma** base responde por atores
 * diferentes — que e exatamente o que CA-4.2 e CA-4.3 exercitam, e o que o
 * cenario `@concorrencia` de `PT-011` cobra (*"a resposta anonima nao contem
 * nada que so a autenticada veria"*).
 */
export interface ContextoDeLeituraDeConteudo {
  /**
   * A base da decisao de capacidade.
   *
   * ⚠️ **`base.casosDeTraducao` tem de carregar `casoDeConteudo()`** para que a
   * decisao de leitura funcione: e ele que resolve `read_post` em
   * `read_private_posts` (`plataforma/autorizacao/traducao-de-conteudo.ts`,
   * entrega de T017 da feature 001). Sem o caso registrado, `read_post` cai no
   * ramo final da traducao e e comparada como capacidade primitiva — que
   * ninguem tem concedida —, logo a porta fecha. Fechar e o lado seguro e
   * **nao** e o comportamento do legado: ali o caso esta sempre registrado,
   * porque `map_meta_cap()` e uma funcao e nao um registro opcional. Quem monta
   * o contexto da requisicao registra o caso uma vez, no arranque — e a ordem de
   * arranque e contrato publico (BR-MIGRAR-106, `EXT-ORDEM`).
   */
  readonly base: BaseDeAutorizacao;
  /** Quem le. O anonimo e `ATOR_ANONIMO`: existe como objeto, com `existe` falso. */
  readonly ator: AtorDeAutorizacao;
}

/**
 * O contexto de uma escolha de **visibilidade**.
 *
 * Acrescenta a leitura do registro do tipo, porque a capacidade exigida para
 * gravar `private` e um **slot** daquele tipo e nao uma cadeia fixa — ver
 * `permissao-de-conteudo-privado.ts`.
 */
export interface ContextoDeVisibilidade extends ContextoDeLeituraDeConteudo {
  /**
   * `get_post_type_object( $nome )`, ou `null` quando o tipo nao esta
   * registrado.
   *
   * `null` nao e caminho raro: e um dos tres ramos de erro de `PERM-4`
   * (BR-MIGRAR-090), e o que esta tarefa faz com ele esta em
   * `permissao-de-conteudo-privado.ts`.
   */
  readonly tipoDeConteudo: (nome: string) => TipoDeConteudoNaAutorizacao | null;
}
