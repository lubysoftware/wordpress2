/**
 * **O rotulo dentro de um contexto** — a tabela `term_taxonomy`, a segunda das
 * tres estruturas de T002.
 *
 * `plan.md`, secao *Modelo de dados*: *"o rotulo **dentro de um contexto**: o
 * nome do contexto, a descricao, o pai e a contagem de uso"*. E
 * `target_data_model.md` diz o que muda nela: **nenhuma** — com a ressalva
 * explicita de que *"a fusao com `terms` e do **aggregate**, nao da tabela"*.
 *
 * ⚠️ **O contexto e guardado por NOME, nao por identificador.** A coluna
 * `taxonomy` e `varchar(32)` e recebe `'category'`, `'post_tag'`, `'nav_menu'`.
 * Nao ha tabela de contextos, e nao ha como haver: os oito do nucleo sao
 * declaracao em codigo, refeita a cada requisicao por
 * `create_initial_taxonomies()` (`wp-includes/taxonomy.php:25`), e uma extensao
 * registra o nono em execucao. E por isso que uma linha desta tabela pode
 * apontar para um contexto que **nenhum registro conhece** — e o legado tolera a
 * linha, recusando so na leitura (`class-wp-term.php:173`, `invalid_taxonomy`).
 * Declarar chave estrangeira para uma tabela de contextos seria inventar a
 * tabela e recusar hoje o que o legado aceita.
 *
 * ── A UNICIDADE DE ROTULO POR CONTEXTO, QUE E METADE DA ENTREGA DE T002 ────
 *
 * `UNIQUE KEY term_id_taxonomy (term_id,taxonomy)` e **uma das tres garantias de
 * unicidade do banco inteiro** (`DB-UNIQ`, BR-MIGRAR-076) e a primeira
 * invariante de `AGG-Termo` em `target_domain_model.md` — *"e o que **impede** o
 * mesmo termo duas vezes na mesma taxonomia"*. Ela existe em **dois** lugares, e
 * os dois sao necessarios:
 *
 * 1. no DDL, declarada (`esquema.ts`, `wp-admin/includes/schema.php:82`) — e o
 *    banco que a cobra;
 * 2. no caminho de aplicacao, que **le antes de inserir**:
 *    {@link RepositorioDeRotulosNoContexto.idDoRotuloNoContexto} e a cadeia que
 *    `wp_insert_term()` envia antes de gravar, e se ela devolver algo o legado
 *    **devolve o par existente sem inserir nada**
 *    (`wp-includes/taxonomy.php:2643` a `:2650`).
 *
 * **Este repositorio nao acrescenta uma terceira cobranca.** Ele nao recusa a
 * segunda insercao do mesmo par: quem recusa e o banco, e a recusa do legado e
 * um `WP_Error( 'db_insert_error' )` montado a partir do retorno falso de
 * `$wpdb->insert` (`:2652`). Validar aqui mudaria o momento e a forma da recusa,
 * e `DB-DEG` (BR-MIGRAR-083) manda que a camada de dados **degrade**, nao que o
 * dominio antecipe.
 *
 * ── A HIERARQUIA ATRAVESSA A TABELA ERRADA, E CONTINUA ATRAVESSANDO ────────
 *
 * `term_taxonomy.parent` referencia **`terms.term_id`**, nao
 * `term_taxonomy.term_taxonomy_id` (`target_data_model.md`, secao
 * *Relacionamentos*: *"`term_taxonomy.parent` → `terms.term_id`, N:1 hierarquia,
 * integridade **nenhuma**"*). E por isso que o campo aqui se chama
 * `rotuloPaiId` e nao `paiId`: o nome curto esconde exatamente o erro que
 * `plan.md` descreve — *"o pai referencia o rotulo, nao o rotulo no contexto, o
 * que obriga a voltar de um para o outro a cada nivel da arvore"*.
 *
 * 🔴 **O plano chama de interno e invisivel corrigir isso, e esta tarefa nao
 * corrige.** Tres documentos dizem por que: `target_data_model.md` fecha a secao
 * de origem com *"**zero tabelas acrescentadas, zero colunas acrescentadas, zero
 * indices acrescentados**"*; a AD-11 de `target_architecture.md` nao permite
 * mudanca de esquema nesta fase; e a fusao fisica de `terms` com `term_taxonomy`
 * — que e o que tornaria a correcao natural — esta no item 3 de *O que seria
 * modelado diferente, e nao e*. O risco 3 de `plan.md` observa que a fusao *"muda
 * o identificador que a juncao referencia"* e que a decisao fundadora de
 * retrocompatibilidade sugere que o ecossistema usa esse identificador. A coluna
 * continua guardando `term_id`, e a troca de um para o outro, se um dia
 * acontecer, e decisao de quem decide esquema.
 *
 * ── A CONTAGEM DE USO: UMA COLUNA, DUAS DEFINICOES DE "QUANTOS" ────────────
 *
 * `count` e **dado gravado**, nao calculado na leitura, e `BR-MIGRAR-078`
 * (`DB-TRG2`) conta duas definicoes de "quantos" na mesma coluna:
 * `_update_post_term_count()` conta so `post_status = 'publish'` **e faz anexo
 * contar pelo status do pai** (`taxonomy.php:4193`), e
 * `_update_generic_term_count()` e `COUNT(*)` sem filtro (`:4272`). Um terceiro
 * caminho e o `update_count_callback` que o contexto declara, que a propria regra
 * chama de *"nao expressavel em SQL de jeito nenhum"*.
 *
 * **Quem escolhe entre os dois nao e esta tabela nem o registro do contexto:** e
 * `wp_update_term_count_now()` (`:3625`), **na hora de contar**, perguntando se
 * *todos* os tipos de objeto do contexto sao tipo de conteudo registrado
 * (`post_type_exists`) — leitura de `plataforma/tipos-de-conteudo`, por ligacao
 * tardia (AD-10). O que T002 entrega e a coluna, a escrita dela
 * ({@link RepositorioDeRotulosNoContexto.atualizarContagemDeUso}) e o criterio
 * generico, que e leitura de uma tabela so (`vinculo.ts`,
 * `contarObjetosDoRotuloNoContexto`). O criterio de conteudo atravessa `posts`,
 * que e BC-01, e e da tarefa que implementar a contagem — CA-2.3 e CA-4.5.
 *
 * 🔴 **E a segunda pergunta em aberto da `spec.md` bate aqui:** *"a contagem de
 * uso de cada termo e dado gravado e sai de sincronia quando alguem escreve na
 * juncao por fora do caminho normal. Recalcular na leitura e mais correto e muda
 * o que a interface devolve nesse caso de borda... **Ninguem decidiu**"*. Esta
 * tarefa **le e grava o valor gravado**, que e o comportamento identico, e
 * `target_data_model.md` registra a consequencia como estado normal: os
 * contadores desnormalizados *"**podem divergir**, e a divergencia e estado
 * normal... Um sistema que os mantivesse sempre corretos teria comportamento
 * **diferente** do legado"*. Nao ha leitura que recalcule neste arquivo, e a
 * ausencia e a resposta de nao decidir.
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * 🔴 Pela mesma razao de sempre (`REQ-162` em `do-not-rewrite.md`, nenhuma tarefa
 * do pacote constroi o barramento), os seis desta tabela ficam declarados aqui,
 * na ordem do legado, para que a tarefa que construir o barramento os encaixe na
 * posicao que **e** o contrato (P2):
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `edit_term_taxonomies` | acao | `$edit_tt_ids` | antes do `UPDATE` que reposiciona os filhos (`:2131`) |
 * | `edited_term_taxonomies` | acao | `$edit_tt_ids` | depois dele (`:2146`) |
 * | `edit_term_taxonomy` | acao | `$tt_id`, `$taxonomy`, `$args` | antes do `UPDATE` de `wp_update_term()` (`:3444`) e antes de cada `UPDATE` de contagem (`:4252`, `:4282`) |
 * | `edited_term_taxonomy` | acao | `$tt_id`, `$taxonomy`, `$args` | depois deles (`:3458`, `:4256`, `:4286`) |
 * | `delete_term_taxonomy` | acao | `$tt_id` | antes do `DELETE` (`:2200`) |
 * | `deleted_term_taxonomy` | acao | `$tt_id` | depois dele (`:2211`) |
 */

import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import {
  tabelaDeRotulos,
  tabelaDeRotulosNoContexto,
} from './chaves-e-tabelas.js';
import {
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

/**
 * `term_taxonomy.parent` quando o rotulo nao tem pai naquele contexto.
 *
 * Default do DDL (`parent bigint(20) unsigned NOT NULL default 0`,
 * `wp-admin/includes/schema.php:79`) e **sentinela**, nao nulo: `DB-SENT`
 * (BR-MIGRAR-081) e literal — *"`0` em coluna de referencia significa 'sem
 * vinculo', logo `WHERE pai IS NULL` nunca acusa orfao"*. Contexto plano grava
 * `0` em toda linha, porque a hierarquia e recusada antes da gravacao (CA-4.2,
 * regra de T009).
 */
export const SEM_ROTULO_PAI = 0;

/**
 * `term_taxonomy.count` com que uma linha nova nasce.
 *
 * O numero e do legado, e ele e **explicito na insercao**, nao herdado do default
 * do DDL: `wp_insert_term()` monta `compact( 'term_id', 'taxonomy',
 * 'description', 'parent' ) + array( 'count' => 0 )`
 * (`wp-includes/taxonomy.php:2652`). Os dois caminhos gravam `0`, e portar os
 * dois importa porque e a **lista de colunas do comando** que a area 3 da
 * Decisao 2 compara.
 */
export const CONTAGEM_INICIAL_DE_USO = 0;

/** Uma linha de `term_taxonomy`, com as 6 colunas. */
export interface RotuloNoContexto {
  /**
   * `term_taxonomy_id` — **o identificador que a juncao referencia**, e nao o do
   * rotulo. E o que faz a mesma juncao servir o mesmo rotulo em dois contextos
   * sem ambiguidade.
   */
  readonly id: number;
  /** `term_id` — o rotulo, em `terms`. Sem integridade declarada (P5). */
  readonly rotuloId: number;
  /** `taxonomy` — o **nome** do contexto, nao um identificador. */
  readonly contexto: string;
  /** `description` — `longtext NOT NULL`, e `''` e ausencia. Nao e serializado. */
  readonly descricao: string;
  /** `parent` — ⚠️ aponta para `terms.term_id`. {@link SEM_ROTULO_PAI}. */
  readonly rotuloPaiId: number;
  /** `count` — contagem **gravada**, com dois criterios de calculo (`DB-TRG2`). */
  readonly contagemDeUso: number;
}

/**
 * As 4 colunas que a gravacao escreve.
 *
 * Sao **4 de 6**: `term_taxonomy_id` e gerado pelo banco, e `count` nao entra
 * neste tipo porque nao e campo de quem cria um rotulo no contexto — e contador
 * mantido por outro caminho, com metodo proprio
 * ({@link RepositorioDeRotulosNoContexto.atualizarContagemDeUso}). A insercao
 * acrescenta `count = 0` por conta propria, como o legado faz
 * ({@link CONTAGEM_INICIAL_DE_USO}).
 */
export interface RotuloNoContextoGravavel {
  readonly rotuloId: number;
  readonly contexto: string;
  readonly descricao: string;
  readonly rotuloPaiId: number;
}

/** Os mesmos campos, um a um opcionais: omitir e nao tocar na coluna. */
export type CamposDoRotuloNoContexto = {
  readonly [Campo in keyof RotuloNoContextoGravavel]?: RotuloNoContextoGravavel[Campo];
};

/** O par `(term_id, term_taxonomy_id)` de um filho, como `wp_delete_term()` o le. */
export interface FilhoNaHierarquia {
  readonly rotuloId: number;
  readonly rotuloNoContextoId: number;
}

export interface RepositorioDeRotulosNoContexto {
  /**
   * `SELECT * FROM {site}term_taxonomy WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:4368`).
   */
  obterPorId(id: number): RotuloNoContexto | null;
  /**
   * O identificador do rotulo **naquele** contexto, ou `null` se o par nao
   * existe — **a leitura da unicidade** (ver o cabecalho).
   *
   * A cadeia e a do legado, com a juncao que ela tem e na ordem em que ela esta
   * (`wp-includes/taxonomy.php:2643` e `:3380`, identicas):
   * `SELECT tt.term_taxonomy_id FROM {site}term_taxonomy AS tt INNER JOIN
   * {site}terms AS t ON tt.term_id = t.term_id WHERE tt.taxonomy = ? AND
   * t.term_id = ?`.
   *
   * ⚠️ A juncao com `terms` e **redundante** — `term_taxonomy.term_id` responderia
   * sozinha — e e portada assim porque e a cadeia que o legado envia, e o slot
   * `persistencia` de `plan.md` pede que a consulta possa ser *"a MESMA string que
   * o legado envia"*. Ela tem efeito: o par so e encontrado se a linha de `terms`
   * **existir**, o que num banco sem chave estrangeira nao e garantido.
   */
  idDoRotuloNoContexto(rotuloId: number, contexto: string): number | null;
  /**
   * Em quantos contextos o rotulo serve:
   * `SELECT COUNT(*) FROM {site}term_taxonomy WHERE term_id = ?`
   * (`wp-includes/taxonomy.php:2214` e `:4696`).
   *
   * **E a leitura que faz CA-1.3 valer** — *"remover o rotulo de um contexto nao
   * o remove do outro"*: `wp_delete_term()` so apaga a linha de `terms` se esta
   * contagem der zero (`:2214` a `:2216`). A regra e de T009/T011; a leitura e
   * daqui.
   */
  contarContextosDoRotulo(rotuloId: number): number;
  /**
   * Os nomes dos contextos em que o rotulo serve:
   * `SELECT taxonomy FROM {site}term_taxonomy WHERE term_id = ?`
   * (`wp-includes/taxonomy.php:4395`).
   */
  listarContextosDoRotulo(rotuloId: number): readonly string[];
  /**
   * O caminho de volta, de rotulo-no-contexto para rotulo, **naquele** contexto:
   * `SELECT tt.term_id FROM {site}term_taxonomy AS tt WHERE tt.taxonomy = ? AND
   * tt.term_taxonomy_id IN (?, ...)` (`wp-includes/taxonomy.php:2954`).
   *
   * Acrescentado por **T005**, e o motivo de ele existir e uma volta que o legado
   * da de proposito: `wp_set_object_terms()` calcula a diferenca em
   * `term_taxonomy_id`, traduz **de volta** para `term_id` com esta cadeia e so
   * entao chama `wp_remove_object_terms()`, que resolve cada `term_id` outra vez
   * para `term_taxonomy_id` (`:2950`-`:2958`). Encurtar o caminho — passar os
   * `term_taxonomy_id` direto para a remocao — deixaria de emitir esta leitura e
   * mudaria a sequencia de comandos, que e o que a area 3 da Decisao 2 de
   * `parity_specs.md` compara.
   *
   * Lista vazia **nao emite comando** e devolve lista vazia: no legado a cadeia
   * so e montada dentro de `if ( $delete_tt_ids )` (`:2952`).
   *
   * ⚠️ A lista `IN` e um marcador por item, e nao a concatenacao com apostrofos
   * do legado (`:2953`), porque REQ-164 proibe concatenacao — o mesmo desvio
   * declarado em `vinculo.ts`, com a mesma consequencia nenhuma sobre o conjunto
   * devolvido.
   */
  listarRotulosPorIdsNoContexto(
    contexto: string,
    rotulosNoContextoIds: readonly number[],
  ): readonly number[];
  /**
   * Os filhos diretos de um rotulo, em **todos** os contextos:
   * ``SELECT term_id, term_taxonomy_id FROM {site}term_taxonomy WHERE `parent` = ?``
   * (`wp-includes/taxonomy.php:2121`).
   *
   * ⚠️ Repare que o legado **nao filtra por contexto nesta leitura**, e filtra no
   * `UPDATE` que vem depois ({@link reposicionarFilhos}). A assimetria e dele, e
   * tem consequencia observavel: a lista de filhos cujo cache sera limpo inclui
   * rotulo de outro contexto que **nao** foi reposicionado. O acento grave em
   * `` `parent` `` tambem e dele (`parent` nao e palavra reservada; o legado a
   * cita assim mesmo).
   */
  listarFilhosDoRotulo(rotuloPaiId: number): readonly FilhoNaHierarquia[];
  /**
   * Os identificadores dos filhos de um rotulo **naquele** contexto:
   * `SELECT term_taxonomy_id FROM {site}term_taxonomy WHERE parent = ? AND
   * taxonomy = ?` (`wp-includes/taxonomy.php:4371`).
   */
  idsDeFilhosNoContexto(
    rotuloPaiId: number,
    contexto: string,
  ): readonly number[];
  /**
   * `INSERT INTO {site}term_taxonomy (term_id, taxonomy, description, parent,
   * count) VALUES (?, ?, ?, ?, ?)` (`wp-includes/taxonomy.php:2652`), com
   * `count = 0`. Devolve o `term_taxonomy_id` gerado.
   */
  inserir(campos: RotuloNoContextoGravavel): number;
  /**
   * `UPDATE {site}term_taxonomy SET ... WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:3446`).
   *
   * O legado escreve as **quatro** colunas de uma vez, com `compact( 'term_id',
   * 'taxonomy', 'description', 'parent' )`, inclusive as que nao mudaram. Os
   * campos aqui sao opcionais um a um para servir tambem a troca de pai sozinha,
   * e o teste afirma a lista de colunas do comando nos dois casos.
   */
  atualizar(id: number, campos: CamposDoRotuloNoContexto): number;
  /**
   * `UPDATE {site}term_taxonomy SET count = ? WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:4253` e `:4283`).
   *
   * **Grava o numero que o chamador calculou**, e nao calcula nada: qual dos dois
   * criterios de `DB-TRG2` vale e decidido na hora de contar, fora desta tabela
   * (ver o cabecalho).
   */
  atualizarContagemDeUso(id: number, contagem: number): number;
  /**
   * Reposiciona os filhos de um rotulo num contexto:
   * `UPDATE {site}term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?`
   * (`wp-includes/taxonomy.php:2133`).
   *
   * E o `DB-TRG3` (BR-MIGRAR-079) desta tabela — *"apagar reposiciona os filhos
   * em vez de apaga-los"*, e o neto passa a apontar para o avo. O P5 da
   * constituicao poe isso no observavel e a `@cascata` de `parity_specs.md` o
   * cobra; a sequencia que decide **quando** chamar isto e de T009/T011.
   */
  reposicionarFilhos(
    rotuloPaiAtual: number,
    rotuloPaiNovo: number,
    contexto: string,
  ): number;
  /**
   * `DELETE FROM {site}term_taxonomy WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:2202` e `:2686`).
   *
   * **E so a linha** — e e esta linha, e nao a de `terms`, que desfaz a presenca
   * do rotulo num contexto. O rotulo sobrevive em `terms` enquanto outro contexto
   * o usar (CA-1.3).
   */
  apagar(id: number): number;
}

/**
 * As 4 colunas na **ordem do `compact()`** de `wp_insert_term()`
 * (`wp-includes/taxonomy.php:2652`) e de `wp_update_term()` (`:3446`) — a mesma
 * nos dois, com `count` acrescentado so na insercao.
 */
const COLUNAS_GRAVAVEIS: readonly (readonly [
  keyof RotuloNoContextoGravavel,
  string,
])[] = [
  ['rotuloId', 'term_id'],
  ['contexto', 'taxonomy'],
  ['descricao', 'description'],
  ['rotuloPaiId', 'parent'],
];

export function criarRepositorioDeRotulosNoContexto(
  dados: PortaDeDados,
): RepositorioDeRotulosNoContexto {
  const tabela = tabelaDeRotulosNoContexto(dados);
  const tabelaDoRotulo = tabelaDeRotulos(dados);

  return {
    obterPorId(id) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE term_taxonomy_id = ?`,
          parametros: [id],
        }),
      );
      return linha === null ? null : lerRotuloNoContexto(linha);
    },

    idDoRotuloNoContexto(rotuloId, contexto) {
      const valor = primeiroValor(
        dados.selecionar({
          texto:
            `SELECT tt.term_taxonomy_id FROM ${tabela} AS tt ` +
            `INNER JOIN ${tabelaDoRotulo} AS t ON tt.term_id = t.term_id ` +
            `WHERE tt.taxonomy = ? AND t.term_id = ?`,
          parametros: [contexto, rotuloId],
        }),
      );
      // `if ( ! empty( $tt_id ) )`: o legado trata ausencia e zero do mesmo
      // jeito, e `term_taxonomy_id` comeca em 1.
      const id = comoInteiro(valor);
      return id === 0 ? null : id;
    },

    contarContextosDoRotulo(rotuloId) {
      return comoInteiro(
        primeiroValor(
          dados.selecionar({
            texto: `SELECT COUNT(*) FROM ${tabela} WHERE term_id = ?`,
            parametros: [rotuloId],
          }),
        ),
      );
    },

    listarContextosDoRotulo(rotuloId) {
      return dados
        .selecionar({
          texto: `SELECT taxonomy FROM ${tabela} WHERE term_id = ?`,
          parametros: [rotuloId],
        })
        .map((linha) => comoTexto(linha['taxonomy']));
    },

    listarRotulosPorIdsNoContexto(contexto, rotulosNoContextoIds) {
      if (rotulosNoContextoIds.length === 0) {
        return [];
      }

      return dados
        .selecionar({
          texto:
            `SELECT tt.term_id FROM ${tabela} AS tt ` +
            `WHERE tt.taxonomy = ? AND tt.term_taxonomy_id IN (` +
            `${rotulosNoContextoIds.map(() => '?').join(', ')})`,
          parametros: [contexto, ...rotulosNoContextoIds],
        })
        .map((linha) => comoInteiro(linha['term_id']));
    },

    listarFilhosDoRotulo(rotuloPaiId) {
      return dados
        .selecionar({
          texto: `SELECT term_id, term_taxonomy_id FROM ${tabela} WHERE \`parent\` = ?`,
          parametros: [rotuloPaiId],
        })
        .map((linha) => ({
          rotuloId: comoInteiro(linha['term_id']),
          rotuloNoContextoId: comoInteiro(linha['term_taxonomy_id']),
        }));
    },

    idsDeFilhosNoContexto(rotuloPaiId, contexto) {
      return dados
        .selecionar({
          texto: `SELECT term_taxonomy_id FROM ${tabela} WHERE parent = ? AND taxonomy = ?`,
          parametros: [rotuloPaiId, contexto],
        })
        .map((linha) => comoInteiro(linha['term_taxonomy_id']));
    },

    inserir(campos) {
      const colunas: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_GRAVAVEIS) {
        colunas.push(coluna);
        parametros.push(campos[campo]);
      }
      // `+ array( 'count' => 0 )`: o legado o acrescenta depois do `compact`, e
      // por isso `count` e a ultima coluna do comando.
      colunas.push('count');
      parametros.push(CONTAGEM_INICIAL_DE_USO);

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
        texto: `UPDATE ${tabela} SET ${nomes.join(', ')} WHERE term_taxonomy_id = ?`,
        parametros: [...parametros, id],
      }).linhasAfetadas;
    },

    atualizarContagemDeUso(id, contagem) {
      return dados.escrever({
        texto: `UPDATE ${tabela} SET count = ? WHERE term_taxonomy_id = ?`,
        parametros: [contagem, id],
      }).linhasAfetadas;
    },

    reposicionarFilhos(rotuloPaiAtual, rotuloPaiNovo, contexto) {
      return dados.escrever({
        texto: `UPDATE ${tabela} SET parent = ? WHERE parent = ? AND taxonomy = ?`,
        parametros: [rotuloPaiNovo, rotuloPaiAtual, contexto],
      }).linhasAfetadas;
    },

    apagar(id) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE term_taxonomy_id = ?`,
        parametros: [id],
      }).linhasAfetadas;
    },
  };
}

/** A linha como {@link RotuloNoContexto}, sem interpretar nada alem do tipo. */
export function lerRotuloNoContexto(linha: LinhaDeResultado): RotuloNoContexto {
  return {
    id: comoInteiro(linha['term_taxonomy_id']),
    rotuloId: comoInteiro(linha['term_id']),
    contexto: comoTexto(linha['taxonomy']),
    descricao: comoTexto(linha['description']),
    rotuloPaiId: comoInteiro(linha['parent']),
    contagemDeUso: comoInteiro(linha['count']),
  };
}
