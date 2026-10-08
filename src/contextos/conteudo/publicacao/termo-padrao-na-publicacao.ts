/**
 * **CA-1.4**: toda taxonomia que declare termo padrao fica com ao menos um termo
 * atribuido ao fim da publicacao.
 *
 * Entrega de **T003** da feature `002-autoria-e-publicacao` (US-1). E o laco de
 * `wp_publish_post()` (`wp-includes/post.php:5419`-`:5439`), com o comentario do
 * proprio legado por cima dele: *"Ensure at least one term is applied for
 * taxonomies with a default term."*
 *
 * A regra e `P3` / BR-MIGRAR-003, e `database/business-rules.md` §3.4 a chama de
 * *"a regra de negocio mais claramente de dominio em todo o modelo de dados"*.
 * A nota de compatibilidade da propria regra fecha a porta a qualquer atalho:
 * *"inexpressavel em DDL — e codigo nos dois lados. Nenhuma mudanca de paradigma
 * a afeta"*.
 *
 * ---
 *
 * # Os cinco ramos do laco, na ordem, e o que cada um salta
 *
 * | # | ramo | linha | efeito |
 * |---|---|---|---|
 * | 1 | nao e `category` **e** o registro nao declara termo padrao | `:5422`-`:5425` | salta a taxonomia |
 * | 2 | o conteudo **ja** tem termo naquela taxonomia | `:5427`-`:5429` | salta — *"Do not modify previously set terms"* |
 * | 3 | `category` le a opcao `default_category`; o resto le `default_term_{taxonomia}` | `:5431`-`:5435` | escolhe a chave |
 * | 4 | a opcao vale `0` | `:5436`-`:5437` | salta a taxonomia |
 * | 5 | atribui o termo | `:5438` | **escreve** |
 *
 * Tres coisas que um porte distraido faria diferente, e cada uma e efeito no
 * banco:
 *
 * 1. **`category` e excecao por NOME, nao por registro.** O ramo 1 e
 *    `if ( 'category' !== $taxonomy && empty( $tax_object->default_term ) )`:
 *    a categoria entra no laco **mesmo** sem `default_term` declarado, porque o
 *    padrao dela nao vive no registro, vive na opcao `default_category`, que o
 *    instalador semeia com `1`. `plataforma/autorizacao/traducao-de-conteudo.ts`
 *    tem o espelho desta assimetria do outro lado, e a nota de UC-03 a repete:
 *    *"regra P3; default_category nasce em 1"*.
 * 2. **Taxonomia que da erro e tratada como taxonomia que JA TEM termo.** Ver a
 *    nota de {@link ClassificacaoNaPublicacao} e de
 *    `TermosDoConteudoNaPublicacao`: `! empty()` sobre `WP_Error` e verdadeiro,
 *    logo o ramo 2 engole o erro e **nao** atribui o padrao. Tratar erro como
 *    "sem termos" atribuiria termo onde o legado nao atribui.
 * 3. **A ordem das taxonomias e a ordem dos comandos.** O laco segue a ordem em
 *    que `get_object_taxonomies()` as devolve, que e a ordem de registro, e a
 *    area 3 da Decisao 2 compara *"snapshot + sequencia de comandos"*.
 *
 * ---
 *
 * # O que este arquivo NAO faz
 *
 * - **Nao conta termo.** A recontagem de `term_taxonomy.count` acontece em
 *   `_update_term_count_on_transition_post_status()`, que e **outro** ouvinte da
 *   transicao, com prioridade 10 e dono em BC-02 — declarado, com os dois
 *   curto-circuitos dele, em `transicao-de-estado.ts`. `DB-TRG3`
 *   (BR-MIGRAR-079) registra que *"a mesma coluna tem pelo menos duas
 *   definicoes de quantos"*, e nenhuma delas e desta tarefa.
 * - **Nao cria termo.** O termo padrao e criado em `register_taxonomy()`
 *   (`wp-includes/taxonomy.php:540`-`:557`), que grava o identificador dele na
 *   opcao. Aqui so se **le** a opcao.
 * - **Nao protege o termo padrao.** *"O termo padrao da taxonomia e
 *   indestrutivel"* (BR-MIGRAR-091) e *"apagar um termo devolve o objeto ao
 *   termo padrao, se aquele era o unico"* (`DB-TRG4`, BR-MIGRAR-080) sao da
 *   feature 003, nao desta.
 * - **Nao aplica o padrao na GRAVACAO.** A regra `P3` tem duas metades:
 *   *"sem categoria e fora de `auto-draft`, recebe `default_category`"*
 *   (`wp-includes/post.php:4719`, caminho de gravacao) e *"na publicacao a regra
 *   se repete para toda taxonomia com termo padrao"* (`:5419`, este arquivo). A
 *   primeira e do caminho de T005; esta e a segunda.
 */

import type {
  ClassificacaoNaPublicacao,
  ContextoDePublicacao,
} from './contexto-de-publicacao.js';

/**
 * `category` — a taxonomia que o laco trata por nome.
 *
 * O valor e a cadeia do legado, byte a byte, porque e ela que o `!==` compara.
 */
export const TAXONOMIA_DE_CATEGORIA = 'category';

/**
 * `default_category` — a opcao que guarda o termo padrao da categoria.
 *
 * Nome de opcao e **superficie publicada** (P8): extensao de terceiro o le e o
 * escreve, e renomea-lo quebraria codigo que o nucleo nao conhece. O valor de
 * fabrica e `1`, semeado pelo instalador — e por isso que a categoria
 * "Uncategorized" sobrevive a uma instalacao nova.
 */
export const OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA = 'default_category';

/**
 * `default_term_` — o prefixo da opcao de qualquer outra taxonomia
 * (`wp-includes/post.php:5434`).
 *
 * A concatenacao e crua no legado (`'default_term_' . $taxonomy`), sem apelidar
 * nem validar o nome: taxonomia com nome estranho produz chave de opcao
 * estranha, e e assim que `register_taxonomy()` a grava tambem
 * (`wp-includes/taxonomy.php:543`). Apelidar aqui produziria uma chave que o
 * registro nao escreveu.
 */
export const PREFIXO_DA_OPCAO_DE_TERMO_PADRAO = 'default_term_';

/**
 * A chave de opcao em que o termo padrao daquela taxonomia esta gravado.
 *
 * E **regra deste caminho**, nao detalhe de quem le opcao, e e por isso que ela
 * mora aqui e nao na porta: a escolha entre as duas chaves e o ramo 3 do laco.
 */
export function chaveDoTermoPadrao(taxonomia: string): string {
  return taxonomia === TAXONOMIA_DE_CATEGORIA
    ? OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA
    : `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${taxonomia}`;
}

/** Um termo padrao atribuido pela publicacao. */
export interface TermoPadraoAtribuido {
  readonly taxonomia: string;
  readonly termoId: number;
}

/**
 * Percorre as taxonomias do tipo e atribui o termo padrao onde o legado atribui.
 *
 * Devolve o que foi atribuido, **na ordem em que foi atribuido** — e a lista
 * vazia e afirmacao, nao ausencia: ela e o resultado de um conteudo que ja tinha
 * termo em toda taxonomia, que e um dos ramos de CA-1.4.
 *
 * ⚠️ **Roda ANTES do `UPDATE` do estado**, e isso e a ordem do legado
 * (`:5419` vem antes de `:5448`). A consequencia e observavel: no instante em
 * que o termo e atribuido, o conteudo **ainda nao esta publicado** — logo a
 * recontagem de termo que `_update_term_count_on_transition_post_status()` faz
 * depois ve a linha ja publicada **e** o vinculo ja gravado. Inverter as duas
 * metades mudaria a contagem que a listagem publica devolve.
 */
export function aplicarTermoPadrao(
  contexto: ContextoDePublicacao,
  conteudoId: number,
  tipoDoConteudo: string,
): readonly TermoPadraoAtribuido[] {
  const classificacao: ClassificacaoNaPublicacao = contexto.classificacao;
  const atribuidos: TermoPadraoAtribuido[] = [];

  for (const taxonomia of classificacao.taxonomiasDoTipo(tipoDoConteudo)) {
    // Ramo 1 (`:5422`): a categoria entra mesmo sem `default_term` declarado.
    if (
      taxonomia.nome !== TAXONOMIA_DE_CATEGORIA &&
      !taxonomia.declaraTermoPadrao
    ) {
      continue;
    }

    // Ramo 2 (`:5427`): *"Do not modify previously set terms"* — e o erro de
    // `get_the_terms()` cai aqui junto, porque `! empty( WP_Error )` e
    // verdadeiro no legado.
    const termos = classificacao.termosDoConteudo(conteudoId, taxonomia.nome);
    if (termos.erro || termos.termos.length > 0) {
      continue;
    }

    // Ramos 3 e 4 (`:5431`-`:5437`): a chave, e o `0` que desiste.
    const termoId = classificacao.opcaoDeTermoPadrao(
      chaveDoTermoPadrao(taxonomia.nome),
    );
    if (!termoId) {
      continue;
    }

    // Ramo 5 (`:5438`): escreve, e o retorno e ignorado (P7).
    classificacao.definirTermos(conteudoId, [termoId], taxonomia.nome);
    atribuidos.push({ taxonomia: taxonomia.nome, termoId });
  }

  return atribuidos;
}
