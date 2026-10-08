/**
 * Os nomes das tres tabelas desta tarefa.
 *
 * Sao **tres**, e a conta sai do titulo de T002 — *"a forma de armazenamento de
 * rotulo, contexto e juncao"*: `terms` e o rotulo, `term_taxonomy` e o rotulo
 * **dentro de um contexto**, `term_relationships` e a juncao que classifica. A
 * secao *Modelo de dados* de `plan.md` abre com a mesma conta (*"Tres
 * estruturas, e a unica juncao N:M real do armazenamento do legado"*).
 *
 * As tres estao no bloco **ESCOPO POR SITE** do DDL
 * (`wp-admin/includes/schema.php:55`), logo as tres levam o prefixo **do site**
 * — numa rede, `wp_2_terms`. E por isso que a porta deste contexto declara um
 * prefixo so (ver `../portas/porta-de-dados.ts`): nenhuma tabela desta feature e
 * global.
 *
 * **Nao ha nome de tabela montado a mao fora deste arquivo.** A nota 3 de
 * `target_data_model.md` registra por que isso importa numa instalacao de rede:
 * *"o prefixo de tabela nao e so configuracao de conexao: ele e dado"*.
 *
 * ── O QUE NAO ESTA AQUI, UM POR UM ─────────────────────────────────────────
 *
 * - **`termmeta`.** E a quarta linha da tabela *Modelo de dados* do plano, com
 *   *"sem mudanca"* na coluna de transformacao, e **nao** e uma das tres
 *   estruturas que o titulo de T002 nomeia: e metadado **do rotulo**, nao da
 *   atribuicao. Fica registrada aqui a consequencia para quem a portar: no
 *   `$blog_tables` do legado o DDL de `termmeta` vem **antes** do de `terms`
 *   (`schema.php:56` contra `:65`), e `wp_delete_term()` apaga o metadado do
 *   rotulo antes de apagar o rotulo no contexto
 *   (`wp-includes/taxonomy.php:2188`). Quem a portar encaixa nessas posicoes.
 * - **`links`.** `target_data_model.md` poe `Marcador` em `AGG-Termo` e em
 *   BC-02, e e dela que vem o dono da coluna polimorfica da juncao — mas ela nao
 *   e estrutura de classificacao, e 🔴 *"nenhum modulo ativo"* e dono dela
 *   (`erd-complete.md` secao 8). A tabela permanece no esquema, sem
 *   transformacao, e nao e desta tarefa.
 * - **As quatro tabelas obsoletas**, que o legado **declara e nunca cria**
 *   (`wp-includes/class-wpdb.php:314` e `:351`). Duas delas sao exatamente os
 *   ancestrais desta juncao: `post2cat` e `link2cat` — as duas tabelas que
 *   `term_relationships` substituiu no esquema 5539, uma por tipo de objeto.
 *   ⚠️ **E e esse par que explica a coluna sem discriminador**: o legado fundiu
 *   duas juncoes especializadas numa generica e nao levou o discriminador. A
 *   declaracao das quatro e da camada de dados, nao deste contexto, e o alvo
 *   mantem a declaracao sem criar nenhuma.
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}terms` — o rotulo: nome, identificador na URL e agrupamento. 4 colunas. */
export function tabelaDeRotulos(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}terms`;
}

/** `{site}term_taxonomy` — o rotulo dentro de um contexto. 6 colunas. */
export function tabelaDeRotulosNoContexto(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}term_taxonomy`;
}

/** `{site}term_relationships` — a juncao que classifica. 3 colunas. */
export function tabelaDeVinculos(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}term_relationships`;
}
