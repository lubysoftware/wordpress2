/**
 * **CA-8.1, CA-8.2 e o censo de CA-8.4**: apagar um conteudo **reposiciona** os
 * filhos e os anexos no avo, em lugar de apaga-los.
 *
 * Entrega de **T017** da feature `005-retencao-e-descarte` (US-8). E a regra
 * `DB-TRG3` / BR-MIGRAR-079 — *"apagar reposiciona os filhos em vez de
 * apaga-los"* —, e e a razao de o **P5** da constituicao existir:
 * `target_data_model.md` poe esta linha como o **primeiro** dos tres motivos de
 * o esquema do legado nao ter chave estrangeira nenhuma, porque *"uma FK com
 * `ON DELETE CASCADE` os **apagaria**, mudando comportamento observavel"*.
 * Declarar a restricao "mais correta" no destino e a violacao que a tabela *Nao
 * negociavel* nomeia: *"apagar dado, ou declarar restricao no armazenamento que
 * mude a cascata observavel"*.
 *
 * ---
 *
 * # Os dois reposicionamentos sao o mesmo `UPDATE`, com tres diferencas
 *
 * No legado os dois saem do mesmo par de arranjos (`wp-includes/post.php:3894`):
 *
 * ```php
 * $parent_data  = array( 'post_parent' => $post->post_parent );  // o AVO
 * $parent_where = array( 'post_parent' => $post_id );            // quem morre
 * ```
 *
 * | | filhos (`:3897`-`:3910`) | anexos (`:3923`) |
 * |---|---|---|
 * | **condicao de tipo** | `is_post_type_hierarchical( $post->post_type )` | **nenhuma** |
 * | **leitura antes** | `SELECT *` dos filhos, e o `UPDATE` so sai se houver (`:3907`) | **nenhuma** |
 * | **tipo no `WHERE`** | o tipo **do registro apagado** | `'attachment'`, sempre |
 *
 * As tres diferencas sao efeito no banco, e a segunda e a mais facil de perder
 * num porte: **o `UPDATE` dos anexos sai mesmo quando o conteudo nao tem anexo
 * nenhum**, afetando zero linhas, enquanto o dos filhos **nao sai** quando nao
 * ha filho. Quem "otimizar" o segundo com uma leitura previa, ou quem acrescentar
 * a leitura ao primeiro, muda a sequencia de comandos que a area 3 da Decisao 2
 * de `parity_specs.md` compara (*"snapshot + sequencia de comandos"*, zero
 * divergencia) e o cenario `@composicao` de PT-003 (*"a sequencia de comandos
 * registrada e identica a do oraculo"*).
 *
 * **O avo pode ser `0`, e `0` nao e nulo.** `BR-MIGRAR-081` (`DB-SENT`) fixa que
 * ausencia de vinculo e escrita como `0` — *"logo `WHERE pai IS NULL` nunca
 * acusa orfao"*. Apagar um conteudo de primeiro nivel, portanto, poe os filhos
 * dele na **raiz**, e nao em um pai inexistente: a leitura e a mesma, e o
 * `UPDATE` grava `0`.
 *
 * ---
 *
 * # ⚠️ CA-8.4, e o que ele NAO pode significar
 *
 * **O criterio**: *"Nenhum registro fica apontando para um conteudo que nao
 * existe mais"*.
 *
 * Ele vale, e esta afirmado por teste, para **tudo o que a cascata cobre**: os
 * filhos do mesmo tipo e os anexos vao para o avo, as versoes anteriores vao em
 * cascata (CA-8.3), os comentarios, o metadado e os vinculos de termo das
 * taxonomias do tipo sao apagados. Depois de `wp_delete_post()`, no cenario de
 * US-8, nenhuma das quatro tabelas tem linha apontando para o identificador
 * apagado.
 *
 * **O que ele nao pode significar e "o legado nao deixa vinculo pendurado em
 * nenhum caso", porque deixa — e por escolha registrada.** O **P5** manda que o
 * teste da cascata afirme *"o conjunto exato do que sumiu e do que permaneceu,
 * **inclusive o que permaneceu orfao**"*; a Decisao 2 de `pending_decisions.md`
 * poe na area *"efeito no banco"* a *"cascata de exclusao das 7 etapas **e os
 * orfaos que o legado deixa de proposito**"*; e PT-003 repete, no cabecalho e em
 * dois cenarios, que o estado a comparar inclui os orfaos. Fechar esses casos
 * seria **acrescentar** limpeza que o legado nao tem, e cai na mesma linha da
 * tabela *Nao negociavel* que proibe mudar a cascata observavel.
 *
 * ## O censo, lido na arvore — tres grupos, e o terceiro nao e do legado
 *
 * | # | caso | por que o vinculo sobrevive | ancora |
 * |---|---|---|---|
 * | 1 | **filho de outro tipo** | o `SELECT` e o `UPDATE` filtram `post_type = $post->post_type`; filho de tipo diferente nao entra | `:3900`, `:3908` |
 * | 2 | **filho de tipo nao hierarquico** | o bloco inteiro e saltado quando `is_post_type_hierarchical()` e falso — e `post_parent` e gravavel em **qualquer** tipo (`wp_insert_post()` o le sem olhar hierarquia) | `:3897`, `:4845` |
 * | 3 | **vinculo de termo de taxonomia nao registrada no tipo** | o conjunto removido e `get_object_taxonomies( $post->post_type )`, nao "as taxonomias deste registro" | `:3892` |
 *
 * Os casos 1 e 2 sao **comportamento do legado** e estao reproduzidos: o teste de
 * US-8 afirma que a linha de outro tipo **continua** apontando para o
 * identificador apagado, porque e isso que o oraculo faz. O caso 3 e da etapa de
 * BC-02 e esta declarado em `contexto-de-exclusao.ts`.
 *
 * E ha um **quarto grupo, que nao e do legado e nao e desta regra**: as sete
 * escutas que o nucleo registra em `before_delete_post`, `delete_post` e
 * `deleted_post` — entre elas a que zera a opcao da pagina inicial, a que zera a
 * da politica de privacidade e a que apaga o item de menu — **nao rodam neste
 * alvo**, porque o barramento de pontos de extensao nao existe aqui (REQ-162,
 * `do-not-rewrite.md`). Enquanto ele nao existir, o alvo deixa pendurado o que o
 * legado desfaz. E **lacuna declarada do alvo**, nao paridade: o censo com
 * `arquivo:linha` esta em {@link GanchosDaExclusao}, e os pontos estao emitidos
 * na posicao exata para que ligar o barramento feche os quatro de uma vez.
 */

import {
  TIPO_DE_ANEXO,
  type ComandosDaExclusao,
  type RegistroNaExclusao,
} from './comandos-da-exclusao.js';
import type { ContextoDeExclusao } from './contexto-de-exclusao.js';

/** O que a terceira etapa da cascata fez — **CA-8.1**. */
export interface ReposicionamentoDeFilhos {
  /**
   * `is_post_type_hierarchical( $post->post_type )` (`:3897`): quando `false`, a
   * etapa inteira nao acontece e **nenhum comando sai** — nem a leitura.
   */
  readonly tipoHierarquico: boolean;
  /**
   * Os filhos **daquele tipo**, na ordem da leitura (`:3905`), ou lista vazia
   * quando a etapa nao aconteceu.
   *
   * Lista vazia com `tipoHierarquico` verdadeiro **tambem** e afirmacao: a
   * leitura saiu e o `UPDATE` nao.
   */
  readonly filhos: readonly number[];
  /** Se o `UPDATE` foi emitido: so quando a leitura devolveu linha (`:3907`). */
  readonly comandoEmitido: boolean;
  /** Linhas que o `UPDATE` afetou, e `0` quando ele nao saiu. */
  readonly linhasAfetadas: number;
  /** O novo pai dos filhos: `$post->post_parent`, que pode ser `0` (a raiz). */
  readonly avoId: number;
}

/**
 * **CA-8.1.** Os filhos do mesmo tipo passam a apontar para o avo
 * (`wp-includes/post.php:3897`-`:3910`).
 *
 * A ordem dos dois comandos e do legado e importa: a **leitura primeiro**,
 * porque e ela que decide se o `UPDATE` sai, e porque e a lista dela que o legado
 * usa no fim para limpar o cache de cada filho afetado (`:4000`-`:4004` — sem
 * cache nesta arvore, ver `armazenamento/metadado.ts`).
 */
export function reposicionarFilhosNoAvo(
  contexto: ContextoDeExclusao,
  comandos: ComandosDaExclusao,
  registro: RegistroNaExclusao,
): ReposicionamentoDeFilhos {
  const avoId = registro.paiId;

  if (!contexto.tipos.ehHierarquico(registro.tipo)) {
    return {
      tipoHierarquico: false,
      filhos: [],
      comandoEmitido: false,
      linhasAfetadas: 0,
      avoId,
    };
  }

  const filhos = comandos.listarFilhos(registro.id, registro.tipo);

  // `if ( $children )` (`:3907`): lista vazia e **nenhum `UPDATE`**. E a
  // diferenca em relacao aos anexos, que nao tem esta guarda.
  if (filhos.length === 0) {
    return {
      tipoHierarquico: true,
      filhos,
      comandoEmitido: false,
      linhasAfetadas: 0,
      avoId,
    };
  }

  return {
    tipoHierarquico: true,
    filhos,
    comandoEmitido: true,
    linhasAfetadas: comandos.reposicionarNoAvo(
      avoId,
      registro.id,
      registro.tipo,
    ),
    avoId,
  };
}

/**
 * **CA-8.2.** Os anexos passam a apontar para o avo — *"Point all attachments to
 * this post up one level"* (`wp-includes/post.php:3922`-`:3923`).
 *
 * ⚠️ **Sem condicao de tipo e sem leitura previa**: um comando, sempre, mesmo
 * quando o conteudo nao tem anexo e mesmo quando o tipo dele nao e hierarquico.
 * Devolve as linhas afetadas, que podem ser `0` — e `0` aqui significa *"o
 * comando saiu e nao achou nada"*, nao *"o comando nao saiu"*.
 */
export function reposicionarAnexosNoAvo(
  comandos: ComandosDaExclusao,
  registro: RegistroNaExclusao,
): number {
  return comandos.reposicionarNoAvo(
    registro.paiId,
    registro.id,
    TIPO_DE_ANEXO,
  );
}
