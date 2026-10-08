/**
 * **A juncao que classifica** — a tabela `term_relationships`, a terceira das
 * tres estruturas de T002, e a **unica juncao N:M real** do armazenamento do
 * legado.
 *
 * `plan.md`, secao *Modelo de dados*: *"a juncao que classifica, com chave
 * primaria composta de objeto e rotulo no contexto, mais uma ordem usada so por
 * menu"*. E `target_data_model.md` diz o que muda nela: **nenhuma**.
 *
 * ── A CHAVE COMPOSTA, QUE E A OUTRA METADE DA ENTREGA DE T002 ──────────────
 *
 * `PRIMARY KEY (object_id,term_taxonomy_id)` e **a unica chave primaria composta
 * do esquema** (`wp-admin/includes/schema.php:89`), e `target_data_model.md` a
 * chama de *"a unica garantia estrutural de vinculo nao duplicado"*. Tres
 * consequencias que o tipo deste arquivo carrega de proposito:
 *
 * 1. **A linha nao tem identificador proprio.** Nao ha `id` em {@link Vinculo}, e
 *    nao se acrescenta um: a identidade e {@link ChaveDoVinculo}, o par. Dar uma
 *    chave substituta a esta tabela mudaria o esquema (a unica PK composta
 *    deixaria de existir) e **permitiria duas linhas iguais**, que e exatamente o
 *    que a garantia impede.
 * 2. **Gravar o mesmo par duas vezes nao duplica.** E e com isso que o legado
 *    conta nas duas escritas: a insercao normal **le antes**
 *    (`wp-includes/taxonomy.php:2906`, em {@link RepositorioDeVinculos.existe}) e
 *    a escrita ordenada usa `ON DUPLICATE KEY UPDATE`
 *    ({@link RepositorioDeVinculos.gravarOrdem}), que **so funciona porque a
 *    chave composta existe**.
 * 3. **A ordem das colunas na chave decide o que e rapido.** Risco 4 de
 *    `plan.md`: *"nao existe indice isolado no objeto da juncao: a chave composta
 *    serve 'quais rotulos tem este objeto' e nao para o caminho inverso"*. O
 *    segundo indice (`KEY term_taxonomy_id`) e o que serve o caminho inverso, e os
 *    dois indices emitidos sao os dois do legado — ver `esquema.ts` sobre por que
 *    nenhum terceiro e acrescentado.
 *
 * ── O OBJETO E POLIMORFICO SEM DISCRIMINADOR, E CONTINUA SENDO ─────────────
 *
 * `object_id` recebe `posts.ID` **ou** `links.link_id`, e **nada na linha diz
 * qual** (`target_data_model.md`, secao *Relacionamentos*: duas relacoes
 * polimorficas, integridade *"nenhuma"*, nota *"sem discriminador"*). E o que da
 * dono a `link_category` entre os oito contextos do nucleo, e e o que justificou
 * fundir `taxonomias-e-termos` com `links-e-bookmarks` em BC-02
 * (`target_architecture.md` chama a fusao de *"contraintuitiva e necessaria"*,
 * porque separa-las *"deixaria a coluna polimorfica sem dono"*).
 *
 * 🔴 **Esta e a primeira das duas perguntas em aberto da `spec.md`, e T002 nao a
 * responde.** O que cada documento diz, porque a diferenca importa:
 *
 * | documento | o que diz |
 * |---|---|
 * | `plan.md`, *Modelo de dados* | *"O modelo novo precisa de discriminador; mante-lo como esta reproduz a ambiguidade"* |
 * | `plan.md`, risco 1 | o discriminador *"e decisao de modelo que a spec deixa em aberto, e a resposta 2 proibe que ela recuse hoje o que o legado aceita"* |
 * | `spec.md`, *Perguntas em aberto* | *"O modelo novo mantem a juncao generica ou a prende ao registro de conteudo?"* — **nao decidida** |
 * | `target_data_model.md`, item 2 de *O que seria modelado diferente, e nao e* | o discriminador e *"o conserto certo e a mudanca de esquema errada **nesta fase**"*, e a secao de origem fecha com *"zero colunas acrescentadas"* |
 * | `target_architecture.md`, AD-11 | nenhuma mudanca de esquema nesta fase |
 *
 * O que T002 faz, e e o unico caminho que nao decide nada: **a coluna fica como
 * esta** — um inteiro sem discriminador, que aceita conteudo e marcador —, o tipo
 * **nao** se chama `conteudoId` e **nao** e preso a BC-01, e nenhum metodo deste
 * repositorio pergunta que tipo de objeto e aquele. Prender o campo a conteudo
 * recusaria hoje o que o legado aceita, e a resposta 2 proibe; acrescentar coluna
 * mudaria o esquema, e a AD-11 proibe. A pergunta continua aberta, para quem
 * decide.
 *
 * ── A ORDEM QUE SO O MENU USA ──────────────────────────────────────────────
 *
 * `term_order` existe, e **a insercao normal nao a menciona**: `$wpdb->insert`
 * recebe so `object_id` e `term_taxonomy_id` (`taxonomy.php:2922`), e a coluna
 * recebe o `0` do DDL. Quem a escreve e o caminho de contexto **ordenavel**
 * (`$tax->sort`, nulo nos oito do nucleo — ver
 * `../registro/contexto-de-classificacao.ts`), com um unico comando de muitos
 * valores (`:2986`). A assimetria e observavel na sequencia de comandos, e por
 * isso sao dois metodos e nao um com parametro opcional.
 *
 * ── A LEITURA INVERSA: UM RECORTE DELA ENTROU COM T005 ─────────────────────
 *
 * "Quais rotulos tem este objeto" — a leitura com que US-2 descobre o que
 * substituir — **nao e uma cadeia que o legado monta de uma vez**: ela sai de
 * `WP_Term_Query`, que acrescenta ``INNER JOIN {$wpdb->term_relationships} AS tr
 * ON tr.term_taxonomy_id = tt.term_taxonomy_id`` (`class-wp-term-query.php:701`) e
 * `tr.object_id IN (...)` (`:602`) a uma consulta montada **por fragmento, com um
 * ponto de extensao entre os fragmentos** — `terms_clauses` e os demais, que o P2
 * poe no contrato publico.
 *
 * T002 deixou a leitura inteira de fora, e T005 trouxe **um recorte dela**:
 * {@link RepositorioDeVinculos.listarRotulosDoObjeto}, que e a cadeia que aquela
 * consulta produz para os **dois** conjuntos de argumentos que
 * `wp_set_object_terms()` passa, e nada alem deles. A razao de nao continuar
 * esperando T009 e que sem esta leitura **nao existe "substituir integralmente"**:
 * CA-2.1 depende de conhecer o conjunto anterior.
 *
 * ⚠️ O que o recorte **nao** e, e por isso ele nao substitui a consulta de termos
 * de T009 e da feature 015 (T007): nao aceita filtro por nome, apelido, pai,
 * hierarquia nem contagem, nao tem `number`/`offset`, nao monta fragmento e nao
 * tem onde encaixar `terms_clauses`. Quando a consulta por fragmento chegar, este
 * metodo passa a ser uma chamada a ela com esses argumentos — nao uma segunda
 * implementacao ao lado.
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * 🔴 Mesma razao de sempre (`REQ-162` em `do-not-rewrite.md`; nenhuma tarefa do
 * pacote constroi o barramento). Os quatro desta tabela, na ordem do legado:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `add_term_relationship` | acao | `$object_id`, `$tt_id`, `$taxonomy` | **imediatamente antes** do `INSERT`, uma vez por vinculo novo (`:2920`) |
 * | `added_term_relationship` | acao | `$object_id`, `$tt_id`, `$taxonomy` | imediatamente depois (`:2940`) |
 * | `delete_term_relationships` | acao | `$object_id`, `$tt_ids`, `$taxonomy` | antes do `DELETE`, **uma vez para o lote** (`:3086`) |
 * | `deleted_term_relationships` | acao | `$object_id`, `$tt_ids`, `$taxonomy` | depois dele, idem (`:3103`) |
 *
 * ⚠️ A assimetria entre "um por vinculo" e "um por lote" e do legado, e e
 * contrato: quem construir o barramento conta quantas vezes cada um dispara.
 */

import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import {
  tabelaDeRotulos,
  tabelaDeRotulosNoContexto,
  tabelaDeVinculos,
} from './chaves-e-tabelas.js';
import { comoInteiro, primeiroValor } from './leitura-de-linha.js';

/**
 * `term_relationships.term_order` quando ninguem ordenou nada.
 *
 * Default do DDL (`term_order int(11) NOT NULL default 0`,
 * `wp-admin/includes/schema.php:88`), e e o valor com que **toda** linha nasce
 * pelo caminho normal, porque a insercao nao escreve a coluna. A ordem gravada
 * pelo caminho ordenado comeca em `1` (`++$term_order` sobre `0`,
 * `wp-includes/taxonomy.php:2968` e `:2981`) — e e o chamador que a decide, nao
 * este repositorio.
 */
export const SEM_ORDEM = 0;

/**
 * A identidade de uma linha da juncao: **o par**, e nada mais.
 *
 * Nao existe chave substituta nesta tabela, e `target_data_model.md` poe o par
 * entre parenteses na coluna PK de `VinculoObjetoTermo` exatamente por isso.
 */
export interface ChaveDoVinculo {
  /**
   * `object_id` — ⚠️ **polimorfico sem discriminador**: conteudo ou marcador.
   *
   * O nome e `objetoId`, e nao `conteudoId`, porque `link_category` se aplica a
   * `link` (ver o cabecalho, e `../registro/contextos-do-nucleo.ts`).
   */
  readonly objetoId: number;
  /**
   * `term_taxonomy_id` — o rotulo **no contexto**, nao o rotulo.
   *
   * ⚠️ E o ponto em que o risco 3 de `plan.md` morde: fundir fisicamente `terms`
   * com `term_taxonomy` *"muda o identificador que a juncao referencia"*, e a
   * decisao fundadora de retrocompatibilidade sugere que o ecossistema usa este
   * numero. A fusao e do aggregate, nao das tabelas, e este numero continua sendo
   * o `term_taxonomy_id` do legado.
   */
  readonly rotuloNoContextoId: number;
}

/** Uma linha de `term_relationships`, com as 3 colunas. */
export interface Vinculo extends ChaveDoVinculo {
  /** `term_order` — usada so por menu de navegacao. {@link SEM_ORDEM}. */
  readonly ordem: number;
}

/** Um vinculo com a posicao que o chamador decidiu, para a escrita ordenada. */
export interface VinculoOrdenado {
  readonly rotuloNoContextoId: number;
  readonly ordem: number;
}

/**
 * As **duas** ordenacoes que a leitura inversa tem no legado, e so elas.
 *
 * Nao e opcao de conveniencia: sao os dois conjuntos de argumentos com que
 * `wp_set_object_terms()` chama `wp_get_object_terms()`, e a diferenca entre eles
 * e observavel na cadeia enviada.
 *
 * | valor | de onde vem | o que a cadeia ganha |
 * |---|---|---|
 * | `'nenhuma'` | `'orderby' => 'none'` na leitura do conjunto anterior (`wp-includes/taxonomy.php:2866`) | nada: `parse_orderby()` devolve cadeia vazia e o `ORDER BY` **nao e emitido** (`class-wp-term-query.php:936` e `:450`) |
 * | `'nome'` | a leitura do conjunto final do ramo ordenado (`:2977`), que **nao** passa `orderby` e cai no default `'name'` (`class-wp-term-query.php:200`) | `ORDER BY t.name ASC` (`:925` e `:746`) |
 */
export type OrdemDaLeituraInversa = 'nenhuma' | 'nome';

export interface RepositorioDeVinculos {
  /**
   * Se o par ja esta gravado:
   * `SELECT term_taxonomy_id FROM {site}term_relationships WHERE object_id = ?
   * AND term_taxonomy_id = ?` (`wp-includes/taxonomy.php:2906`).
   *
   * E a leitura com que `wp_set_object_terms()` decide **nao** inserir e nao
   * emitir os dois pontos de extensao do vinculo — o `continue` dele. Portanto o
   * numero de vezes que `add_term_relationship` dispara depende desta leitura, e
   * e por isso que ela e metodo e nao detalhe de `inserir`.
   */
  existe(chave: ChaveDoVinculo): boolean;
  /**
   * Os **rotulos** que um objeto tem naquele contexto, pela cadeia que
   * `WP_Term_Query` monta para os argumentos de `wp_set_object_terms()`:
   *
   * `SELECT t.term_id FROM {site}terms AS t INNER JOIN {site}term_taxonomy AS tt
   * ON t.term_id = tt.term_id INNER JOIN {site}term_relationships AS tr ON
   * tr.term_taxonomy_id = tt.term_taxonomy_id WHERE tt.taxonomy IN (?) AND
   * tr.object_id IN (?)`
   *
   * Os fragmentos, um por um: o `SELECT t.term_id` do ramo `default` de
   * `$selects` (`class-wp-term-query.php:671`), a juncao com `term_taxonomy`
   * (`:698`), a juncao com `term_relationships` que **so** existe quando ha
   * `object_ids` (`:701`), `tt.taxonomy IN (...)` (`:457`), `tr.object_id IN
   * (...)` (`:602`) e o `ORDER BY` de {@link OrdemDaLeituraInversa} (`:746`).
   *
   * ⚠️ **Devolve `term_id`, nao `term_taxonomy_id`, e isso e do legado.** O campo
   * pedido e `tt_ids`, mas a consulta **nao o seleciona**: ela traz `t.term_id`, o
   * legado completa os termos (`_prime_term_caches()`, `taxonomy.php:4165`, e
   * `populate_terms()`, `class-wp-term-query.php:1123`) e so entao
   * `format_terms()` le `term_taxonomy_id` de cada termo completo (`:989`). A
   * consequencia **nao** e cosmetica e cabe a quem chama reproduzi-la: um rotulo
   * compartilhado entre dois contextos faz `get_term( $term_id )` devolver
   * `ambiguous_term_id`, e `populate_terms()` **descarta** o que nao for termo
   * (`:1141`) — logo ele desaparece do conjunto anterior. Selecionar
   * `tt.term_taxonomy_id` aqui o manteria, e seria comportamento que o legado nao
   * tem.
   *
   * ⚠️ **Duas diferencas de texto com o legado, as duas declaradas.** A lista `IN`
   * e um marcador por item, e nao concatenacao, porque REQ-164 a proibe — o mesmo
   * desvio, pela mesma razao, de {@link RepositorioDeVinculos.apagar}. E o legado
   * emite `SELECT $distinct $fields` com `$distinct` vazio, e monta o comando com
   * quebras de linha e tabulacao entre as clausulas (`:752`-`:757`): o conjunto de
   * linhas e o mesmo, o espaco em branco nao.
   */
  listarRotulosDoObjeto(
    objetoId: number,
    contexto: string,
    ordem?: OrdemDaLeituraInversa,
  ): readonly number[];
  /**
   * Os objetos vinculados a um rotulo no contexto:
   * `SELECT object_id FROM {site}term_relationships WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:2152`).
   *
   * E a leitura que abre a cascata de `wp_delete_term()`, e `BR-MIGRAR-080`
   * (`DB-TRG4`) descreve o que o legado faz com cada linha devolvida: *"se era o
   * unico termo do objeto naquela taxonomia e a taxonomia tem termo padrao, o
   * objeto recebe o padrao; senao perde so aquele termo"*. A regra e de T009 e
   * T011 (US-4 e US-5); a leitura e daqui.
   */
  listarObjetosDoRotuloNoContexto(rotuloNoContextoId: number): readonly number[];
  /**
   * `SELECT COUNT(*) FROM {site}term_relationships WHERE term_taxonomy_id = ?`
   * (`wp-includes/taxonomy.php:4276`).
   *
   * ⚠️ **E um dos dois criterios de contagem, nao "a" contagem.** Este e o
   * generico (`_update_generic_term_count()`): `COUNT(*)` **sem filtro**, que e o
   * que `link_category` usa. O criterio de conteudo conta so `post_status =
   * 'publish'` e faz anexo contar pelo status do pai, atravessando `posts`
   * (`:4232` e `:4237`) — outra tabela, outro contexto (BC-01), e a travessia e por
   * ligacao tardia (AD-10). Quem escolhe entre os dois e
   * `wp_update_term_count_now()` na hora de contar (`:3625`), e a escolha e da
   * tarefa da contagem, nao desta. Ver `rotulo-no-contexto.ts`.
   */
  contarObjetosDoRotuloNoContexto(rotuloNoContextoId: number): number;
  /**
   * `INSERT INTO {site}term_relationships (object_id, term_taxonomy_id) VALUES
   * (?, ?)` (`wp-includes/taxonomy.php:2922`).
   *
   * **Duas colunas, nao tres**: `term_order` nao e mencionada e recebe o `0` do
   * DDL. A lista de colunas do comando e afirmada por teste, porque e ela que a
   * area 3 da Decisao 2 compara.
   */
  inserir(chave: ChaveDoVinculo): number;
  /**
   * A escrita ordenada, num comando so:
   * `INSERT INTO {site}term_relationships (object_id, term_taxonomy_id,
   * term_order) VALUES (?, ?, ?), ... ON DUPLICATE KEY UPDATE term_order =
   * VALUES(term_order)` (`wp-includes/taxonomy.php:2986`).
   *
   * Tres coisas do legado, preservadas:
   *
   * 1. **Um comando para a lista inteira**, e nao um por vinculo — a sequencia de
   *    comandos e observavel;
   * 2. **`ON DUPLICATE KEY UPDATE`**, que atualiza a ordem do vinculo que ja
   *    existe em vez de falhar: e a chave composta de novo;
   * 3. **a ordem vem do chamador.** No legado e `++$term_order` sobre a lista
   *    final, filtrada por quais vinculos sobreviveram (`:2968` a `:2983`) — essa
   *    decisao e de quem classifica, nao do armazenamento.
   *
   * Lista vazia **nao emite comando**, como no legado (`if ( $values )`), e isso
   * e afirmavel: a ausencia de escrita e parte do contrato.
   */
  gravarOrdem(objetoId: number, vinculos: readonly VinculoOrdenado[]): number;
  /**
   * `DELETE FROM {site}term_relationships WHERE object_id = ? AND
   * term_taxonomy_id IN (?, ...)` (`wp-includes/taxonomy.php:3088`).
   *
   * Lista vazia **nao emite comando** e devolve `0`: no legado o `if ( $tt_ids )`
   * sai com `false` sem tocar o banco, e sem emitir os dois pontos de extensao do
   * lote.
   *
   * ⚠️ **A unica diferenca de texto com o legado esta aqui, e e deliberada.** O
   * legado monta a lista `IN` por concatenacao, com cada identificador **entre
   * apostrofos** — `$in_tt_ids = "'" . implode( "', '", $tt_ids ) . "'"`
   * (`:3074`) — e so depois passa `object_id` por marcador. REQ-164 (`must`) exige
   * que *"nenhuma consulta seja montada por concatenacao"*, logo aqui a lista e um
   * marcador por item. O conjunto de linhas afetadas e o mesmo: `term_taxonomy_id`
   * e `bigint`, e a comparacao com o literal textual do legado coage para numero.
   */
  apagar(objetoId: number, rotulosNoContextoIds: readonly number[]): number;
}

export function criarRepositorioDeVinculos(
  dados: PortaDeDados,
): RepositorioDeVinculos {
  const tabela = tabelaDeVinculos(dados);
  const tabelaDoRotulo = tabelaDeRotulos(dados);
  const tabelaDoContexto = tabelaDeRotulosNoContexto(dados);

  return {
    existe(chave) {
      const valor = primeiroValor(
        dados.selecionar({
          texto:
            `SELECT term_taxonomy_id FROM ${tabela} ` +
            `WHERE object_id = ? AND term_taxonomy_id = ?`,
          parametros: [chave.objetoId, chave.rotuloNoContextoId],
        }),
      );
      // `if ( $wpdb->get_var( ... ) )`: o legado decide pela verdade do valor, e
      // `term_taxonomy_id` nunca e `0` numa linha gravada.
      return comoInteiro(valor) !== 0;
    },

    listarRotulosDoObjeto(objetoId, contexto, ordem = 'nenhuma') {
      // `$this->sql_clauses['orderby'] = $orderby ? "$orderby $order" : ''`
      // (`class-wp-term-query.php:746`): com `orderby => none` a clausula nao
      // existe, e e por isso que a concatenacao e condicional e nao um default.
      const ordenacao = ordem === 'nome' ? ' ORDER BY t.name ASC' : '';

      return dados
        .selecionar({
          texto:
            `SELECT t.term_id FROM ${tabelaDoRotulo} AS t ` +
            `INNER JOIN ${tabelaDoContexto} AS tt ON t.term_id = tt.term_id ` +
            `INNER JOIN ${tabela} AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id ` +
            `WHERE tt.taxonomy IN (?) AND tr.object_id IN (?)${ordenacao}`,
          parametros: [contexto, objetoId],
        })
        .map((linha) => comoInteiro(linha['term_id']));
    },

    listarObjetosDoRotuloNoContexto(rotuloNoContextoId) {
      return dados
        .selecionar({
          texto: `SELECT object_id FROM ${tabela} WHERE term_taxonomy_id = ?`,
          parametros: [rotuloNoContextoId],
        })
        .map((linha) => comoInteiro(linha['object_id']));
    },

    contarObjetosDoRotuloNoContexto(rotuloNoContextoId) {
      return comoInteiro(
        primeiroValor(
          dados.selecionar({
            texto: `SELECT COUNT(*) FROM ${tabela} WHERE term_taxonomy_id = ?`,
            parametros: [rotuloNoContextoId],
          }),
        ),
      );
    },

    inserir(chave) {
      return dados.escrever({
        texto: `INSERT INTO ${tabela} (object_id, term_taxonomy_id) VALUES (?, ?)`,
        parametros: [chave.objetoId, chave.rotuloNoContextoId],
      }).linhasAfetadas;
    },

    gravarOrdem(objetoId, vinculos) {
      if (vinculos.length === 0) {
        return 0;
      }

      const parametros: ValorDeParametro[] = [];
      for (const vinculo of vinculos) {
        parametros.push(objetoId, vinculo.rotuloNoContextoId, vinculo.ordem);
      }

      return dados.escrever({
        texto:
          `INSERT INTO ${tabela} (object_id, term_taxonomy_id, term_order) VALUES ` +
          `${vinculos.map(() => '(?, ?, ?)').join(',')} ` +
          `ON DUPLICATE KEY UPDATE term_order = VALUES(term_order)`,
        parametros,
      }).linhasAfetadas;
    },

    apagar(objetoId, rotulosNoContextoIds) {
      if (rotulosNoContextoIds.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto:
          `DELETE FROM ${tabela} WHERE object_id = ? AND term_taxonomy_id IN (` +
          `${rotulosNoContextoIds.map(() => '?').join(', ')})`,
        parametros: [objetoId, ...rotulosNoContextoIds],
      }).linhasAfetadas;
    },
  };
}

/** A linha como {@link Vinculo}, sem interpretar nada alem do tipo da coluna. */
export function lerVinculo(linha: LinhaDeResultado): Vinculo {
  return {
    objetoId: comoInteiro(linha['object_id']),
    rotuloNoContextoId: comoInteiro(linha['term_taxonomy_id']),
    ordem: comoInteiro(linha['term_order']),
  };
}
