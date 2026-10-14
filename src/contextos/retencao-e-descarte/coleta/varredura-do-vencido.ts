/**
 * A varredura do que venceu: as **duas** consultas que a coleta da lixeira
 * emite, e nada mais.
 *
 * Entrega de **T011** (US-5), e a peca que **T002 deliberadamente nao fez** e
 * deixou nomeada: *"a unica comparacao de prazo do legado e `SELECT post_id FROM
 * postmeta WHERE meta_key = '_wp_trash_meta_time' AND meta_value < %d` ... ela
 * atravessa **todos** os registros, nao e o marcador 'do registro' que T002
 * entrega ... Ela e de T011"* (`../README.md`).
 *
 * ## Por que ela esta em `coleta/` e nao em `armazenamento/`
 *
 * `armazenamento/` e a entrega fechada de **T002** e e a forma do marcador **de
 * um registro**: `add`, `get` e `delete` por identificador. Esta varredura nao e
 * do registro — ela **nao recebe identificador nenhum** e devolve o conjunto que
 * o prazo selecionou. Ela e o primeiro passo do comportamento de US-5, e a
 * convencao da arvore poe comportamento em pasta de area
 * (`<area>/` com `index.ts` de barril). Deixa-la em `armazenamento/` tambem
 * faria duas ondas editarem o mesmo barril sem necessidade.
 *
 * ## A consulta e a do legado, inclusive no que ela tem de estranho
 *
 * `wp-includes/functions.php:6979` (conteudo) e `:6997` (comentario):
 *
 * ```php
 * $posts_to_delete = $wpdb->get_results( $wpdb->prepare(
 *   "SELECT post_id FROM $wpdb->postmeta
 *     WHERE meta_key = '_wp_trash_meta_time' AND meta_value < %d",
 *   $delete_timestamp ), ARRAY_A );
 * ```
 *
 * Quatro coisas dessa cadeia sao comportamento, nao estilo:
 *
 * 1. ⚠️ **O operador e `<`, estritamente menor.** O registro descartado
 *    **exatamente** no instante limite ainda **nao** vence — e a borda que
 *    CA-5.2 cobra em UT-052-2 (*"poupa o que esta no limite"*) e que PT-004
 *    cobra em *"o tempo avanca ate um dia antes do prazo / entao nenhuma das
 *    duas o apaga"*. `configuracao/prazo-de-retencao.ts` ja escreveu o aviso
 *    para esta tarefa: trocar por `<=` e mudanca de comportamento observavel.
 * 2. **A comparacao e numerica sobre coluna de TEXTO.** `meta_value` e
 *    `longtext` (`target_data_model.md`), e `< %d` faz o MySQL coagir cada
 *    valor para numero com a coercao frouxa — digitos iniciais, resto ignorado.
 *    Marcador com lixo no fim ainda compara; marcador vazio compara como `0` e
 *    **vence sempre**. Nao e tolerancia inventada aqui: e a tolerancia que
 *    decide quais linhas a coleta apaga, e `armazenamento/leitura-de-linha.ts`
 *    ja a escreveu em `comoInteiro` pelo mesmo motivo.
 * 3. **Nao ha `ORDER BY` e nao ha `LIMIT`.** A ordem e a que o banco devolver, e
 *    a varredura carrega o conjunto **inteiro** de uma vez. Acrescentar paginacao
 *    ou ordem seria inventar comportamento: num site com lixeira grande o legado
 *    carrega tudo, e e disso que vem o caso de execucao interrompida de CA-5.4.
 * 4. **A chave do marcador vai na cadeia como literal, nao como parametro.** No
 *    legado ela nao tem `%s`: ela esta escrita dentro do SQL, e so o instante e
 *    preparado. Aqui a cadeia e montada com a constante do modulo, do mesmo jeito
 *    que o nome da tabela — nenhum dado de fora entra por concatenacao, que e o
 *    que REQ-164 proibe, e o texto enviado continua sendo o do legado.
 *
 * ## O que esta varredura NAO e
 *
 * - **Nao e a expiracao do rascunho automatico** (US-6, T013). Aquela nao olha
 *   marcador nenhum: e `SELECT ID FROM {p}posts WHERE post_status = 'auto-draft'
 *   AND DATE_SUB( NOW(), INTERVAL 7 DAY ) > post_date`
 *   (`wp-includes/post.php:8377`), com o prazo cravado no SQL e comparado com o
 *   relogio do **banco**. Ver a secao 🔴 de `../portas/porta-de-relogio.ts`.
 * - **Nao e o leitor `instanteDoDescarte()` de T002.** Aquele le o marcador de
 *   **um** registro, e T002 escreveu que ele *"nao substitui a varredura:
 *   filtrar em memoria mudaria o conjunto de linhas apagadas"*. Nenhuma funcao
 *   deste arquivo o usa.
 */

import {
  colunaDoObjeto,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
  comoInteiro,
  tabelaDeMetadado,
  type TipoDeMetadado,
} from '../armazenamento/index.js';
import type { Consulta, PortaDeDados } from '../portas/index.js';

/**
 * A consulta de varredura de uma das duas familias, montada e nao emitida.
 *
 * Exportada porque o criterio de paridade desta area e *"snapshot + sequencia de
 * comandos"* (area 3 da Decisao 2 de `parity_specs.md`): a cadeia enviada e o
 * que se compara contra o oraculo, e compara-la sem emitir comando e o que
 * torna a conferencia barata.
 */
export function consultaDeVencidos(
  dados: PortaDeDados,
  tipo: TipoDeMetadado,
  instanteLimite: number,
): Consulta {
  const tabela = tabelaDeMetadado(dados, tipo);
  const coluna = colunaDoObjeto(tipo);

  return {
    texto:
      `SELECT ${coluna} FROM ${tabela} ` +
      `WHERE meta_key = '${MARCADOR_DO_INSTANTE_DO_DESCARTE}' ` +
      'AND meta_value < ?',
    parametros: [instanteLimite],
  };
}

/**
 * Os identificadores que o prazo selecionou, **na ordem em que o banco os
 * devolveu** e com o `(int)` que o legado aplica
 * (`wp-includes/functions.php:6982` e `:7000`).
 *
 * ⚠️ **O zero NAO e filtrado aqui**, e isso e deliberado. No legado a guarda
 * `if ( ! $post_id ) { continue; }` esta **dentro do laco** (`:6983`, `:7001`),
 * depois da consulta — logo o conjunto varrido e uma coisa e o conjunto
 * percorrido e outra. Filtrar aqui apagaria essa diferenca, e e ela que faz
 * `conteudosVarridos` do resultado da coleta ser o `$posts_to_delete` do legado
 * e nao uma versao limpa dele.
 */
export function varrerVencidos(
  dados: PortaDeDados,
  tipo: TipoDeMetadado,
  instanteLimite: number,
): readonly number[] {
  const coluna = colunaDoObjeto(tipo);

  return dados
    .selecionar(consultaDeVencidos(dados, tipo, instanteLimite))
    .map((linha) => comoInteiro(linha[coluna]));
}

/**
 * As duas varreduras da coleta, sobre a porta de dados desta composicao.
 *
 * Chega ao {@link ContextoDeColeta} por argumento, como o armazenamento de T002
 * chega ao descarte: numa rede o identificador do site entra **dentro** do nome
 * da tabela, logo guardar a porta em estado de modulo faria a coleta de um site
 * varrer a lixeira de outro (`EXT-CONTEXTO`, BR-MIGRAR-105).
 */
export interface VarreduraDoVencido {
  /** `SELECT post_id FROM {site}postmeta ...` (`wp-includes/functions.php:6979`). */
  conteudosVencidos(instanteLimite: number): readonly number[];
  /** `SELECT comment_id FROM {site}commentmeta ...` (`:6997`). */
  comentariosVencidos(instanteLimite: number): readonly number[];
}

export function criarVarreduraDoVencido(
  dados: PortaDeDados,
): VarreduraDoVencido {
  return {
    conteudosVencidos(instanteLimite) {
      return varrerVencidos(dados, METADADO_DE_CONTEUDO, instanteLimite);
    },
    comentariosVencidos(instanteLimite) {
      return varrerVencidos(dados, METADADO_DE_COMENTARIO, instanteLimite);
    },
  };
}
