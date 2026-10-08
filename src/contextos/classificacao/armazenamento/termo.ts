/**
 * **O termo** — a leitura fundida de `terms` com `term_taxonomy`, que e a forma
 * em que o legado devolve um rotulo e a forma em que `AGG-Termo` existe.
 *
 * Nao e uma quarta estrutura, e e por isso que este arquivo nao tem DDL nem nome
 * de tabela proprio: `target_domain_model.md` e literal — *"a fusao e do
 * **aggregate**, nao das tabelas: o esquema fica intacto (AD-11), e as duas
 * tabelas continuam existindo"*. O que existe aqui e a **consulta** que as junta,
 * que e a consulta do legado, e o tipo que ela devolve, que e o
 * `Termo` de `target_domain_model.md` com os nove campos que ele lista
 * (`termoId`, `taxonomiaId`, `nome`, `slug`, `taxonomia`, `descricao`, `paiId`,
 * `contador`, `grupo`).
 *
 * ── POR QUE A LEITURA DEVOLVE UMA LISTA, E NAO UM TERMO ────────────────────
 *
 * A cadeia do legado e `SELECT t.*, tt.* ... WHERE t.term_id = %d`
 * (`wp-includes/class-wp-term.php:132`), e o comentario imediatamente acima dela
 * diz por que ela nao tem `LIMIT 1`: *"Grab all matching terms, in case any are
 * shared between taxonomies."* **Um rotulo em dois contextos devolve duas
 * linhas** — e essa e a prova de CA-1.1 no armazenamento, e o que UC-05 descreve
 * em *O mesmo rotulo em duas taxonomias*: *"Sistema grava uma linha em `terms` e
 * duas em `term_taxonomy`"*.
 *
 * O que o legado faz **depois** com essas linhas e **regra, e nao esta aqui**:
 * escolher a do contexto pedido, devolver a unica quando ha so uma, e devolver
 * `WP_Error( 'ambiguous_term_id' )` quando o rotulo e compartilhado entre dois
 * contextos validos e ninguem disse qual (`:137` a `:169`), mais a recusa
 * `invalid_taxonomy` quando o contexto da linha nao esta registrado (`:173`).
 * Essas quatro saidas sao de **T003** (US-1): elas dependem do registro de
 * contextos, que e `../registro/`, e nao do banco. Um armazenamento que
 * escolhesse por conta propria esconderia a saida ambigua, que e observavel.
 *
 * ── AS DUAS LEITURAS QUE O LEGADO TEM E ESTA NAO E ─────────────────────────
 *
 * 🔴 **Nao esta aqui, e e declarado:**
 *
 * - **A consulta de termos por filtro** (nome, slug, pai, hierarquia, contagem,
 *   ordenacao) e `WP_Term_Query`, montada **por fragmento com ponto de extensao
 *   entre os fragmentos**. E a listagem de US-4 (T009) e a camada de dados da
 *   feature 015. Ver `vinculo.ts`, secao *A leitura inversa nao esta aqui*.
 * - **A confirmacao de duplicata de `wp_insert_term()`**, que tambem junta as
 *   duas tabelas: `SELECT t.term_id, t.slug, tt.term_taxonomy_id, tt.taxonomy
 *   FROM terms AS t INNER JOIN term_taxonomy AS tt ON ( tt.term_id = t.term_id )
 *   WHERE t.slug = %s AND tt.parent = %d AND tt.taxonomy = %s AND t.term_id < %d
 *   AND tt.term_taxonomy_id != %d` (`taxonomy.php:2664`). Ela **nao** e leitura de
 *   armazenamento: e o segundo passo de uma regra de criacao — o legado insere,
 *   **depois** pergunta se criou duplicata e, se criou, apaga as duas linhas que
 *   acabou de gravar e devolve o par antigo (`:2685` a `:2694`) —, e ela atravessa
 *   o filtro `wp_insert_term_duplicate_term_check` (`:2682`), que o P2 poe no
 *   contrato publico e permite **desligar a verificacao**. A regra e de T003/T009,
 *   com o filtro declarado na tarefa que a implementar.
 */

import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import {
  tabelaDeRotulos,
  tabelaDeRotulosNoContexto,
} from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto } from './leitura-de-linha.js';

/**
 * Um rotulo **dentro de um contexto**, como a leitura fundida o devolve.
 *
 * Os nove campos sao os nove de `Termo` em `target_domain_model.md`, na ordem em
 * que ele os lista. Os quatro primeiros vem de `terms`, os cinco ultimos de
 * `term_taxonomy` — e a divisao continua visivel de proposito, porque e ela que
 * explica por que renomear alcanca todos os contextos (CA-1.2) e remover de um
 * contexto nao alcanca o outro (CA-1.3).
 */
export interface Termo {
  /** `terms.term_id` — o rotulo. */
  readonly rotuloId: number;
  /** `term_taxonomy.term_taxonomy_id` — **o que a juncao referencia**. */
  readonly rotuloNoContextoId: number;
  /** `terms.name` — compartilhado por todos os contextos do rotulo. */
  readonly nome: string;
  /** `terms.slug` — idem, e sem unicidade no banco. */
  readonly slug: string;
  /** `term_taxonomy.taxonomy` — o **nome** do contexto. */
  readonly contexto: string;
  /** `term_taxonomy.description` — por contexto, nao por rotulo. */
  readonly descricao: string;
  /** `term_taxonomy.parent` — ⚠️ aponta para `terms.term_id`. */
  readonly rotuloPaiId: number;
  /** `term_taxonomy.count` — gravada, com dois criterios de calculo. */
  readonly contagemDeUso: number;
  /** `terms.term_group` — agrupamento de sinonimos, do rotulo. */
  readonly grupoDeSinonimos: number;
}

export interface LeituraDeTermos {
  /**
   * **Todas** as linhas de um rotulo, uma por contexto em que ele serve.
   *
   * `SELECT t.*, tt.* FROM {site}terms AS t INNER JOIN {site}term_taxonomy AS tt
   * ON t.term_id = tt.term_id WHERE t.term_id = ?`
   * (`wp-includes/class-wp-term.php:132`).
   *
   * **`SELECT t.*, tt.*` e nao uma lista de colunas**, e isso e fidelidade com
   * consequencia: `DB-MIG` (BR-MIGRAR-085) registra que *"coluna criada por
   * extensao permanece e nao aparece em `wp_get_db_schema()` — o DDL e o piso, nao
   * o retrato"*. Uma lista explicita deixaria de fora a coluna que uma extensao
   * acrescentou, que o legado devolve. {@link lerTermo} le as nove que o nucleo
   * conhece e ignora o resto, sem recusar a linha.
   *
   * ⚠️ `tt.term_id` **sobrescreve** `t.term_id` no resultado do legado, porque as
   * duas tabelas tem coluna de mesmo nome e `tt.*` vem depois. Os dois valores sao
   * iguais pela clausula de juncao, logo o efeito e nenhum — mas e por isso que
   * `rotuloId` e lido da coluna `term_id` e nao de duas.
   */
  obterPorRotulo(rotuloId: number): readonly Termo[];
}

export function criarLeituraDeTermos(dados: PortaDeDados): LeituraDeTermos {
  const tabelaDoRotulo = tabelaDeRotulos(dados);
  const tabelaDoContexto = tabelaDeRotulosNoContexto(dados);

  return {
    obterPorRotulo(rotuloId) {
      return dados
        .selecionar({
          texto:
            `SELECT t.*, tt.* FROM ${tabelaDoRotulo} AS t ` +
            `INNER JOIN ${tabelaDoContexto} AS tt ON t.term_id = tt.term_id ` +
            `WHERE t.term_id = ?`,
          parametros: [rotuloId],
        })
        .map(lerTermo);
    },
  };
}

/** A linha fundida como {@link Termo}, sem interpretar nada alem do tipo. */
export function lerTermo(linha: LinhaDeResultado): Termo {
  return {
    rotuloId: comoInteiro(linha['term_id']),
    rotuloNoContextoId: comoInteiro(linha['term_taxonomy_id']),
    nome: comoTexto(linha['name']),
    slug: comoTexto(linha['slug']),
    contexto: comoTexto(linha['taxonomy']),
    descricao: comoTexto(linha['description']),
    rotuloPaiId: comoInteiro(linha['parent']),
    contagemDeUso: comoInteiro(linha['count']),
    grupoDeSinonimos: comoInteiro(linha['term_group']),
  };
}
