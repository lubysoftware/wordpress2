/**
 * O escopo das operacoes de US-2: tudo que classificar um objeto le e grava, e
 * **nada mais**.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo`. Mesma forma e
 * mesmas razoes de `../rotulo-e-contexto/escopo-de-rotulo-e-contexto.ts` e de
 * `../../conteudo/publicacao/contexto-de-publicacao.ts`:
 *
 * - **chega por argumento, nao e estado de modulo.** `BR-MIGRAR-105`
 *   (`EXT-CONTEXTO`) poe identidade, consulta corrente e conexao no escopo da
 *   REQUISICAO, e a dimensao **D-A** de `parity_specs.md` da nome ao risco. Aqui
 *   isso alcanca o registro de contextos, que no legado e a `global
 *   $wp_taxonomies`;
 * - **a colaboracao com outro contexto nao entra como porta.** AD-08 fixa portas
 *   somente nas cinco bordas, e AD-10 mais a regra de dependencia 3 proibem
 *   `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"* e mandam
 *   resolver **toda** chamada entre contextos no momento da chamada. E por isso
 *   que {@link ConteudoNaClassificacao} e uma interface declarada aqui e
 *   implementada em BC-01, do mesmo jeito que `ClassificacaoNaPublicacao` e
 *   declarada em BC-01 e implementada aqui.
 *
 * ---
 *
 * # Por que esta historia precisa das QUATRO pecas do armazenamento
 *
 * US-1 recebeu tres de quatro, e a ausencia da juncao era a afirmacao daquela
 * tarefa: *"US-1 nao escreve na juncao"*. US-2 **e** a juncao — `CA-2.1` e a
 * substituicao integral das linhas de `term_relationships` daquele objeto
 * naquele contexto —, logo as quatro entram, e a quarta e a razao da historia.
 *
 * # Por que a contagem precisa de BC-01, e nao de mais uma tabela
 *
 * `CA-2.3` e *"a contagem de uso de cada termo afetado fica correta ao fim da
 * operacao"*, e `BR-MIGRAR-078` (`DB-TRG2`) diz por que isso nao se resolve
 * dentro de BC-02: a **mesma** coluna `term_taxonomy.count` tem duas definicoes
 * de "quantos", e a de contexto de conteudo conta `posts` com
 * `post_status = 'publish'`, fazendo anexo contar pelo status do pai
 * (`wp-includes/taxonomy.php:4193`). `posts` e BC-01.
 *
 * Quem **escolhe** entre as duas e `wp_update_term_count_now()`
 * (`taxonomy.php:3625`), na hora de contar, perguntando se *todos* os tipos de
 * objeto do contexto sao tipo de conteudo registrado (`post_type_exists`) — e
 * `post_type_exists` tambem nao mora aqui: o registro de tipos de conteudo e
 * `plataforma/tipos-de-conteudo`, que **nao existe nesta arvore** (ver
 * `../../conteudo/publicacao/contexto-de-publicacao.ts`, que registrou a mesma
 * ausencia). As tres perguntas chegam, portanto, por ligacao tardia.
 *
 * # O que NAO esta neste escopo, e por que a ausencia e afirmacao
 *
 * | ausente | por que | de quem e |
 * |---|---|---|
 * | porta de opcoes | `default_category` e `default_term_{nome}` sao a regra do termo padrao, e nenhuma operacao de US-2 le opcao: quem aplica o padrao e `wp_insert_post()`/`wp_publish_post()`, **antes** de chamar a atribuicao | T007 (US-3) |
 * | criar rotulo (`wp_insert_term()`) | e a operacao *"criar ou renomear rotulo"* da tabela **Contratos** do `plan.md`, e `wp_set_object_terms()` a **chama**. Ver a declaracao em `rotulos-informados.ts` | T009 (US-4) |
 * | a consulta de termos por filtro (`WP_Term_Query`) e `term_exists()` | o recorte que US-2 precisava entrou em `../armazenamento/vinculo.ts`; o resto, inclusive a resolucao de rotulo por apelido ou nome, continua fora | T009 e feature 015 (T007) |
 * | cache de objeto | `wp_cache_delete( $object_id, $taxonomy . '_relationships' )` e `wp_cache_set_terms_last_changed()` fecham `wp_set_object_terms()` (`taxonomy.php:2992`-`:2993`) e `wp_remove_object_terms()` (`:3090`-`:3091`), e `clean_term_cache()` fecha a contagem (`:3648`). A borda 5 de `target_architecture.md` manda que **nenhuma** metade use cache durante a coexistencia | REQ-165, nao decidida |
 * | barramento de pontos de extensao | `REQ-162` esta em `do-not-rewrite.md` na coluna `bloqueado`, e **nenhuma tarefa deste pacote o constroi**. Cada ponto esta declarado no arquivo que o emitiria, com nome, argumentos e posicao (P2) | ninguem deste pacote |
 * | relogio e e-mail | nada em US-2 tem prazo e nada notifica ninguem | — |
 */

import type {
  LeituraDeTermos,
  RepositorioDeRotulos,
  RepositorioDeRotulosNoContexto,
  RepositorioDeVinculos,
} from '../armazenamento/index.js';
import type { RegistroDeContextos } from '../registro/index.js';
import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';

/**
 * O que US-2 le e grava do armazenamento de T002: **as quatro pecas**.
 *
 * E estruturalmente compativel com o `ArmazenamentoDeClassificacao` que
 * `../armazenamento/index.ts` compoe, de proposito: quem tem o modulo passa o
 * modulo. O tipo e declarado por extenso,
 * e nao por apelido, pela mesma razao que `ArmazenamentoNaSeparacao`: o que esta
 * aqui e o que a historia **usa**, e isso e verificavel pelo compilador.
 */
export interface ArmazenamentoNoVinculo {
  /** `{site}terms` — lido pela resolucao do rotulo informado. */
  readonly rotulos: RepositorioDeRotulos;
  /** `{site}term_taxonomy` — a contagem gravada mora aqui (CA-2.3). */
  readonly rotulosNoContexto: RepositorioDeRotulosNoContexto;
  /** `{site}term_relationships` — **a historia**: e esta tabela que CA-2.1 substitui. */
  readonly vinculos: RepositorioDeVinculos;
  /** A leitura fundida das duas primeiras, que e a forma de `AGG-Termo`. */
  readonly termos: LeituraDeTermos;
}

/**
 * As tres perguntas que a contagem de uso faz a BC-01, declaradas aqui e
 * implementadas la (AD-10, ligacao tardia).
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 *
 * ⚠️ **Nenhuma delas e opcional, e nenhuma tem default.** Um default aqui
 * escolheria por conta propria entre os dois criterios de `DB-TRG2` — que e
 * exatamente a decisao que `BR-MIGRAR-078` descreve como *"o contador que mais
 * facilmente se unifica por engano"*.
 */
export interface ConteudoNaClassificacao {
  /**
   * `post_type_exists( $tipo )` (`wp-includes/post.php:1757`), que e o que
   * decide qual dos dois criterios de contagem vale
   * (`wp-includes/taxonomy.php:3637`).
   *
   * E chamada **uma vez por tipo de objeto do contexto**, e e por isso que ela e
   * um predicado e nao uma lista: o legado usa `array_filter( $object_types,
   * 'post_type_exists' )` e compara o resultado com a lista inteira.
   */
  tipoDeConteudoEhRegistrado(tipo: string): boolean;

  /**
   * O `COUNT(*)` de `_update_post_term_count()` para os tipos que **nao** sao
   * anexo (`wp-includes/taxonomy.php:4237`):
   *
   * `SELECT COUNT(*) FROM term_relationships, posts WHERE posts.ID =
   * term_relationships.object_id AND post_status IN ('publish') AND post_type IN
   * (...) AND term_taxonomy_id = %d`
   *
   * A consulta atravessa `posts`, logo o comando sai de BC-01 e **nao** desta
   * porta de dados. Os estados chegam por argumento porque eles sao filtraveis
   * no legado (`update_post_term_count_statuses`, `:4221`) e quem os resolve e
   * a contagem, nao quem conta.
   */
  contarConteudoPublicado(
    rotuloNoContextoId: number,
    tipos: readonly string[],
    estados: readonly string[],
  ): number;

  /**
   * O **outro** `COUNT(*)` da mesma funcao, que existe so para anexo
   * (`:4232`), e e a metade mais facil de perder:
   *
   * `SELECT COUNT(*) FROM term_relationships, posts p1 WHERE p1.ID =
   * term_relationships.object_id AND ( post_status IN ('publish') OR (
   * post_status = 'inherit' AND post_parent > 0 AND ( SELECT post_status FROM
   * posts WHERE ID = p1.post_parent ) IN ('publish') ) ) AND post_type =
   * 'attachment' AND term_taxonomy_id = %d`
   *
   * ⚠️ **Anexo conta pelo estado do PAI**, porque o estado dele e `inherit`
   * (`BR-MIGRAR-078`). As duas contagens sao **somadas**, e por isso sao dois
   * comandos e nao um: o legado emite o primeiro so se o contexto tiver anexo
   * entre os tipos e o segundo so se sobrar algum tipo depois de tirar anexo.
   */
  contarAnexosPublicados(
    rotuloNoContextoId: number,
    estados: readonly string[],
  ): number;
}

/**
 * O escopo de uma operacao de US-2: o registro desta requisicao e o
 * armazenamento desta composicao.
 *
 * E estruturalmente compativel com o modulo composto
 * (`ModuloDeClassificacao`, em `../index.ts`), como o escopo de US-1: quem tem o
 * modulo passa o modulo, e quem testa passa um escopo montado a mao.
 */
export interface EscopoDeVinculoDeObjeto {
  /**
   * O `$wp_taxonomies` desta requisicao.
   *
   * Entra porque **toda** operacao de US-2 comeca por `taxonomy_exists()`
   * (`wp-includes/taxonomy.php:2856` e `:3043`) e porque e o registro que diz
   * quais tipos de objeto o contexto declara (CA-2.4), se ele e hierarquico, se
   * ele e ordenavel e qual e o nome da capacidade de atribuir.
   */
  readonly contextos: RegistroDeContextos;
  readonly armazenamento: ArmazenamentoNoVinculo;
}

/**
 * O que **nao** vem da composicao e tem de chegar por chamada: a colaboracao com
 * BC-01.
 *
 * Separado de {@link EscopoDeVinculoDeObjeto} de proposito. O escopo e desta
 * composicao e vive a requisicao inteira; a colaboracao e de quem chama, e e ela
 * que muda quando a mesma operacao e chamada pela tela, pela API REST ou pelo
 * proprio nucleo sem ator nenhum.
 */
export interface ColaboracaoDoVinculo {
  readonly conteudo: ConteudoNaClassificacao;
}

/**
 * A colaboracao de quem classifica **em nome de alguem**: a de cima, mais o ator
 * e a base da decisao de capacidade.
 *
 * Os dois chegam separados, como em `contexto-de-publicacao.ts`: a base e o que
 * nao muda dentro da requisicao (matriz gravada, rede, constantes, casos de
 * traducao) e o ator e quem classifica. Junta-los esconderia que a **mesma** base
 * responde por atores diferentes.
 *
 * ⚠️ **Nem toda operacao de US-2 pede isto, e a diferenca e do legado:**
 * `wp_set_object_terms()` e `wp_remove_object_terms()` **nao verificam capacidade
 * nenhuma** e sao chamadas pelo nucleo sem ator; quem cobra e a superficie. Ver
 * `substituir-vinculos.ts` e `classificar-conteudo.ts`.
 */
export interface ColaboracaoDaClassificacao extends ColaboracaoDoVinculo {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /** Quem classifica. `ATOR_ANONIMO` para quem nao esta autenticado. */
  readonly ator: AtorDeAutorizacao;
}
