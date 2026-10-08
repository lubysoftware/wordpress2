/**
 * O escopo das operacoes de US-1: tudo que a separacao entre rotulo e contexto
 * le e grava, e **nada mais**.
 *
 * Entrega de **T003** da feature `003-classificacao-do-conteudo`. Mesma forma e
 * mesmas razoes de `../../conteudo/publicacao/contexto-de-publicacao.ts` e de
 * `plataforma/autorizacao/contexto-de-autorizacao.ts`:
 *
 * - **chega por argumento, nao e estado de modulo.** `BR-MIGRAR-105`
 *   (`EXT-CONTEXTO`) poe identidade, consulta corrente e conexao no escopo da
 *   REQUISICAO, e a dimensao **D-A** de `parity_specs.md` da nome ao risco:
 *   *"escopo de requisicao para escopo de processo"*. Aqui isso alcanca o
 *   registro de contextos, que no legado e a `global $wp_taxonomies` e que
 *   `../index.ts` cria **dentro** da composicao;
 * - **a colaboracao com outro contexto nao entra aqui.** Nada de US-1 le
 *   `posts`, `links`, opcao ou conta: a regra de dependencia 3 de
 *   `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 *   *"sempre, sem excecao"*, e nenhuma das quatro operacoes desta pasta precisa
 *   atravessar.
 *
 * ---
 *
 * # O que NAO esta neste escopo, e por que a ausencia e afirmacao
 *
 * | ausente | por que | de quem e |
 * |---|---|---|
 * | `vinculos` (`term_relationships`) | **US-1 nao escreve na juncao.** Vincular objeto a rotulo e US-2, e a remocao do vinculo na exclusao de um rotulo e a cascata de US-4 e US-5. A ausencia desta porta e o que impede esta pasta de virar meia `wp_set_object_terms()` | T005, T009, T011 |
 * | porta de opcoes | `default_category` e `default_term_{nome}` sao as opcoes da regra do termo padrao, e `finished_splitting_shared_terms` e a do rotulo compartilhado. Nenhuma das quatro operacoes de US-1 le opcao | T007 (US-3), e ver `renomear-rotulo.ts` |
 * | cache de objeto | `clean_term_cache()` roda em tres pontos do caminho de US-1, e a borda 5 de `target_architecture.md` manda que **nenhuma** metade use cache durante a coexistencia. Os tres pontos estao nomeados no lugar do fluxo | REQ-165, nao decidida |
 * | barramento de pontos de extensao | `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado`, e **nenhuma tarefa deste pacote o constroi**. Cada ponto esta declarado no arquivo que o emitiria, com nome, argumentos e posicao (P2) | ninguem deste pacote |
 * | relogio e e-mail | nada em US-1 tem prazo e nada notifica ninguem — a mesma conta que `../README.md` fez para T001 | — |
 */

import type {
  LeituraDeTermos,
  RepositorioDeRotulos,
  RepositorioDeRotulosNoContexto,
} from '../armazenamento/index.js';
import type { RegistroDeContextos } from '../registro/index.js';

/**
 * O que US-1 le e grava do armazenamento de T002: **tres das quatro pecas**.
 *
 * A quarta, `vinculos`, fica fora de proposito — ver a tabela do cabecalho.
 * Declarar o tipo estreito e o que faz a ausencia ser verificavel pelo
 * compilador em vez de ser so uma frase: nenhuma funcao desta pasta **pode**
 * tocar a juncao.
 */
export interface ArmazenamentoNaSeparacao {
  /** `{site}terms` — e onde o nome vive, que e o que faz CA-1.2 valer. */
  readonly rotulos: RepositorioDeRotulos;
  /** `{site}term_taxonomy` — e onde a presenca num contexto vive (CA-1.3). */
  readonly rotulosNoContexto: RepositorioDeRotulosNoContexto;
  /** A leitura fundida das duas, que e a forma em que `AGG-Termo` existe. */
  readonly termos: LeituraDeTermos;
}

/**
 * O escopo de uma operacao de US-1.
 *
 * E estruturalmente compativel com o modulo composto (`ModuloDeClassificacao`,
 * em `../index.ts`), de proposito: quem tem o modulo
 * passa o modulo, e quem testa passa um escopo montado a mao. Duas composicoes
 * de sites diferentes nao se enxergam, porque nenhuma das duas esta aqui — o
 * escopo e argumento.
 */
export interface EscopoDeRotuloEContexto {
  /**
   * O `$wp_taxonomies` desta requisicao.
   *
   * **Entra porque tres das quatro operacoes de US-1 perguntam ao registro, e
   * nao ao banco**: o contexto de classificacao nao e entidade gravada, e a
   * coluna `term_taxonomy.taxonomy` guarda o **nome** dele (ver
   * `../armazenamento/rotulo-no-contexto.ts`). E por isso que
   * `taxonomy_exists()` e uma leitura de memoria, e que uma linha pode nomear
   * contexto que ninguem registrou.
   */
  readonly contextos: RegistroDeContextos;
  readonly armazenamento: ArmazenamentoNaSeparacao;
}
