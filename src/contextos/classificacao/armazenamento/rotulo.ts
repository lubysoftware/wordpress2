/**
 * **O rotulo** — a tabela `terms`, a primeira das tres estruturas de T002.
 *
 * `plan.md`, secao *Modelo de dados*, descreve o que ela guarda: *"o rotulo:
 * nome, identificador na URL (sem restricao de unicidade: a colisao e resolvida
 * em codigo) e agrupamento de sinonimos"*. E `target_data_model.md` diz o que
 * muda nela em uma palavra: **nenhuma**.
 *
 * ⚠️ **O rotulo e deliberadamente ignorante do contexto em que serve**, e essa
 * ignorancia e a feature inteira (`spec.md`, US-1). Nao ha coluna `taxonomy`
 * aqui, e e por isso que:
 *
 * - **CA-1.1** vale por construcao: um rotulo existe uma vez e pode pertencer a
 *   mais de um contexto ao mesmo tempo, porque o vinculo com o contexto e uma
 *   **outra** linha, em `term_taxonomy` (UC-05, *Fluxos alternativos*: *"Sistema
 *   grava uma linha em `terms` e duas em `term_taxonomy`"*);
 * - **CA-1.2** vale por construcao: renomear muda o nome em todos os contextos,
 *   porque o nome esta **so aqui** — um `UPDATE` nesta tabela e tudo o que
 *   `wp_update_term()` faz com o nome (`wp-includes/taxonomy.php:3414`);
 * - **CA-1.3** depende de uma leitura que **nao e deste arquivo**: apagar o
 *   rotulo de um contexto nao o apaga do outro porque o legado so apaga esta
 *   linha quando nenhum contexto mais a usa (`taxonomy.php:2214`, em
 *   `contarContextosDoRotulo` de `rotulo-no-contexto.ts`).
 *
 * As tres sao de **T003**, que implementa US-1. O que T002 entrega e a forma que
 * as torna possiveis — e nenhuma regra: este repositorio nao resolve colisao de
 * identificador, nao normaliza nome, nao recusa nome vazio e nao decide
 * agrupamento.
 *
 * ── O QUE UM PORTE BEM-INTENCIONADO MEXERIA, E FICA COMO ESTA ──────────────
 *
 * 1. **A escrita tem 3 colunas, nao 4, e a ordem delas e a do legado.**
 *    `wp_insert_term()` monta `$data` com `compact( 'name', 'slug', 'term_group' )`
 *    (`taxonomy.php:2611`) e `term_id` nao entra: e gerado pelo banco. O mesmo
 *    `compact` e o do `UPDATE` de `wp_update_term()` (`:3400`), com a mesma
 *    ordem. Reordenar por gosto produziria um comando diferente do do legado para
 *    o mesmo efeito, e a area 3 da Decisao 2 compara *"snapshot + sequencia de
 *    comandos"*.
 * 2. **`slug` nao tem unicidade, e nao ganha nenhuma.** `DB-UNIQ`
 *    (BR-MIGRAR-076) poe *"slug de termo"* na lista do que **o banco nao
 *    garante**: e verificacao de codigo, sujeita a corrida. A verificacao esta em
 *    {@link RepositorioDeRotulos.slugJaUsado}; o laco que acrescenta sufixo
 *    (`wp_unique_term_slug()`, `taxonomy.php:3136`) e regra, e e de T003/T009.
 * 3. **Nao ha validacao nenhuma na gravacao.** Nem tamanho de coluna, nem nome
 *    vazio, nem existencia do agrupamento. `DB-DEG` (BR-MIGRAR-083): escrita
 *    grande demais se degrada em silencio, e e a camada de dados que trunca.
 * 4. **`term_group` continua, inclusive sem chamador na tela.** E o agrupamento
 *    de sinonimos de `alias_of`, escrito por `wp_insert_term()` e
 *    `wp_update_term()` e lido por `SELECT MAX(term_group)`. A resposta 7 de
 *    `questions.md` fixa o precedente para colunas e funcoes assim: *"existir sem
 *    ser chamada e parte do que se clona"* (P8).
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * 🔴 O P2 da constituicao poe cada ponto de extensao no contrato publico, e nao
 * ha barramento de ganchos nesta arvore: `REQ-162` esta em `do-not-rewrite.md` na
 * coluna `bloqueado`, e **nenhuma tarefa deste pacote o constroi** — a mesma
 * ausencia esta registrada em `../README.md`, em `../registro/`, em
 * `plataforma/autorizacao/index.ts` e no `armazenamento/` de BC-01. O que esta
 * tarefa pode fazer sem decidir no lugar de ninguem e declarar, no arquivo que os
 * emitiria, quais sao e em que posicao do fluxo entram:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `wp_insert_term_data` | filtro | `$data`, `$taxonomy`, `$args` | **imediatamente antes** do `INSERT`, e o valor devolvido e o que vai gravado (`:2622`) |
 * | `edit_terms` | acao | `$term_id`, `$taxonomy`, `$args` | antes do `UPDATE` (`:2635`, `:3398`) |
 * | `wp_update_term_data` | filtro | `$data`, `$term_id`, `$taxonomy`, `$args` | **imediatamente antes** do `UPDATE` (`:3412`) |
 * | `edited_terms` | acao | `$term_id`, `$taxonomy`, `$args` | depois do `UPDATE` (`:2639`, `:3432`) |
 *
 * **Nenhum deles e emitido por este repositorio**, e a razao e de fronteira: quem
 * os emite e `wp_insert_term()` e `wp_update_term()`, que sao as operacoes de
 * criar e renomear — T003 e T009. Um repositorio que os disparasse os faria
 * disparar tambem no caminho de `wp_set_object_terms()`, que no legado passa por
 * `wp_insert_term()` e portanto **ja** os dispara uma vez.
 */

import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import { tabelaDeRotulos } from './chaves-e-tabelas.js';
import {
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

/**
 * `terms.term_group` quando o rotulo nao esta agrupado com nenhum sinonimo.
 *
 * E o default do DDL (`term_group bigint(10) NOT NULL default 0`,
 * `wp-admin/includes/schema.php:69`) e e sentinela, nao ausencia: `DB-SENT`
 * (BR-MIGRAR-081) registra que o esquema **evita `NULL`** e que `0` em coluna de
 * referencia significa "sem vinculo", *"logo `WHERE pai IS NULL` nunca acusa
 * orfao"*. O valor e o de fabrica do legado, como o P6 exige, e o teste de borda
 * esta em `armazenamento.test.ts`.
 */
export const SEM_GRUPO_DE_SINONIMOS = 0;

/** Uma linha de `terms`, com as 4 colunas. */
export interface Rotulo {
  /** `term_id` — a chave que a juncao **nao** referencia. Ver `vinculo.ts`. */
  readonly id: number;
  /** `name` — o nome, e ele vive **so aqui**: e o que faz CA-1.2 valer. */
  readonly nome: string;
  /**
   * `slug` — o identificador na URL.
   *
   * **Sem unicidade no banco** (`DB-UNIQ`), e `''` e ausencia (`DB-SENT`). O
   * legado grava vazio e **corrige depois**, com um `UPDATE` em seguida ao
   * `INSERT` (`taxonomy.php:2630` a `:2639`), e o comentario dele diz que o
   * caminho *"seems unreachable"* — portado assim mesmo, porque o `UPDATE` extra
   * e observavel na sequencia de comandos.
   */
  readonly slug: string;
  /** `term_group` — o agrupamento de sinonimos. {@link SEM_GRUPO_DE_SINONIMOS}. */
  readonly grupoDeSinonimos: number;
}

/**
 * As 3 colunas que a gravacao escreve, todas obrigatorias.
 *
 * Sao obrigatorias porque `wp_insert_term()` resolve default para as tres antes
 * de montar o comando: `$term_group` nasce `0` (`taxonomy.php:2525`) e `$slug`
 * passa por `wp_unique_term_slug()` (`:2609`). A **omissao** — o caminho em que o
 * default do DDL vale — e a insercao direta na tabela, que nao e metodo deste
 * repositorio: e o DDL, declarado em `esquema.ts`.
 */
export interface RotuloGravavel {
  readonly nome: string;
  readonly slug: string;
  readonly grupoDeSinonimos: number;
}

/** Os mesmos campos, um a um opcionais: omitir e nao tocar na coluna. */
export type CamposDoRotulo = {
  readonly [Campo in keyof RotuloGravavel]?: RotuloGravavel[Campo];
};

export interface RepositorioDeRotulos {
  /**
   * `SELECT t.* FROM {site}terms t WHERE t.term_id = ?`
   * (`wp-includes/taxonomy.php:4344`).
   *
   * E a leitura do rotulo **sem contexto nenhum**, que no legado so aparece no
   * caminho de divisao de rotulo compartilhado. A leitura normal e a fundida, em
   * `termo.ts`, porque quem consulta classificacao quer o rotulo **dentro de um
   * contexto**.
   */
  obterPorId(id: number): Rotulo | null;
  /**
   * Se o identificador na URL ja esta em uso, opcionalmente ignorando um rotulo.
   *
   * As duas cadeias do legado, escolhidas pelo mesmo `if`
   * (`wp-includes/taxonomy.php:3188` e `:3190`):
   *
   * - `SELECT slug FROM {site}terms WHERE slug = ? AND term_id != ?`
   * - `SELECT slug FROM {site}terms WHERE slug = ?`
   *
   * ⚠️ **Isto e leitura, nao garantia.** `DB-UNIQ` poe o identificador de termo
   * entre as unicidades *"sujeitas a corrida"*: entre esta leitura e o `INSERT`
   * cabe outra requisicao, e o banco **aceita** as duas linhas. Reproduzir a
   * corrida e o comportamento; fechar com `UNIQUE` e mudanca de efeito no banco
   * que BR-MIGRAR-076 manda decidir *"por coluna, nao por varredura"*.
   */
  slugJaUsado(slug: string, excetoId?: number): boolean;
  /**
   * `SELECT MAX(term_group) FROM {site}terms`
   * (`wp-includes/taxonomy.php:2537` e `:3336`).
   *
   * Devolve o maior agrupamento gravado, ou `0` quando a tabela esta vazia — o
   * `+ 1` que cria o grupo novo e do chamador, como no legado, porque e ele que
   * decide se um sinonimo entra em grupo existente ou abre um.
   */
  maiorGrupoDeSinonimos(): number;
  /**
   * `INSERT INTO {site}terms (name, slug, term_group) VALUES (?, ?, ?)`
   * (`wp-includes/taxonomy.php:2624`), e devolve o `term_id` gerado.
   */
  inserir(campos: RotuloGravavel): number;
  /**
   * `UPDATE {site}terms SET ... WHERE term_id = ?`. Devolve as linhas afetadas.
   *
   * Os dois usos do legado passam por aqui: o `UPDATE` das tres colunas de
   * `wp_update_term()` (`:3414`) e o **de uma so**, que corrige o identificador
   * na URL depois do `INSERT` (`:2636` e `:3418`) — por isso os campos sao
   * opcionais um a um.
   */
  atualizar(id: number, campos: CamposDoRotulo): number;
  /**
   * `DELETE FROM {site}terms WHERE term_id = ?`
   * (`wp-includes/taxonomy.php:2215` e `:2685`).
   *
   * **E so a linha.** Apagar um rotulo no legado e uma cascata de varios passos
   * atravessando as quatro tabelas de `AGG-Termo`, e **so o ultimo passo chega
   * aqui** — e so se nenhum contexto mais usar o rotulo (`:2214`). O P5 da
   * constituicao manda afirmar por teste *"o conjunto exato do que sumiu e do que
   * permaneceu, inclusive o que permaneceu orfao"*: a cascata inteira e de T009 e
   * T011, com a tag `@cascata` que `parity_specs.md` exige em *"exclusao de
   * conteudo e de termo"*. Um `apagarEmCascata` nascido aqui esconderia
   * justamente o que ha para afirmar.
   */
  apagar(id: number): number;
}

/**
 * As 3 colunas na **ordem do `compact()`** de `wp_insert_term()`
 * (`wp-includes/taxonomy.php:2611`) e de `wp_update_term()` (`:3400`) — a mesma
 * nos dois.
 */
const COLUNAS_GRAVAVEIS: readonly (readonly [keyof RotuloGravavel, string])[] = [
  ['nome', 'name'],
  ['slug', 'slug'],
  ['grupoDeSinonimos', 'term_group'],
];

export function criarRepositorioDeRotulos(
  dados: PortaDeDados,
): RepositorioDeRotulos {
  const tabela = tabelaDeRotulos(dados);

  return {
    obterPorId(id) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT t.* FROM ${tabela} t WHERE t.term_id = ?`,
          parametros: [id],
        }),
      );
      return linha === null ? null : lerRotulo(linha);
    },

    slugJaUsado(slug, excetoId) {
      const consulta =
        excetoId === undefined
          ? {
              texto: `SELECT slug FROM ${tabela} WHERE slug = ?`,
              parametros: [slug],
            }
          : {
              texto: `SELECT slug FROM ${tabela} WHERE slug = ? AND term_id != ?`,
              parametros: [slug, excetoId],
            };
      // `if ( $wpdb->get_var( $query ) )`: o legado decide pela verdade do valor
      // devolvido, e identificador vazio nunca chega aqui.
      return comoTexto(primeiroValor(dados.selecionar(consulta))) !== '';
    },

    maiorGrupoDeSinonimos() {
      return comoInteiro(
        primeiroValor(
          dados.selecionar({
            texto: `SELECT MAX(term_group) FROM ${tabela}`,
            parametros: [],
          }),
        ),
      );
    },

    inserir(campos) {
      const colunas: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_GRAVAVEIS) {
        colunas.push(coluna);
        parametros.push(campos[campo]);
      }

      const resultado = dados.escrever({
        texto:
          `INSERT INTO ${tabela} (${colunas.join(', ')}) ` +
          `VALUES (${colunas.map(() => '?').join(', ')})`,
        parametros,
      });
      return resultado.idGerado ?? 0;
    },

    atualizar(id, campos) {
      const nomes: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_GRAVAVEIS) {
        const valor = campos[campo];
        if (valor === undefined) {
          continue;
        }
        nomes.push(`${coluna} = ?`);
        parametros.push(valor);
      }
      if (nomes.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto: `UPDATE ${tabela} SET ${nomes.join(', ')} WHERE term_id = ?`,
        parametros: [...parametros, id],
      }).linhasAfetadas;
    },

    apagar(id) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE term_id = ?`,
        parametros: [id],
      }).linhasAfetadas;
    },
  };
}

/** A linha como {@link Rotulo}, sem interpretar nada alem do tipo da coluna. */
export function lerRotulo(linha: LinhaDeResultado): Rotulo {
  return {
    id: comoInteiro(linha['term_id']),
    nome: comoTexto(linha['name']),
    slug: comoTexto(linha['slug']),
    grupoDeSinonimos: comoInteiro(linha['term_group']),
  };
}
