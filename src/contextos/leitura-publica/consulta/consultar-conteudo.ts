/**
 * A consulta principal de uma leitura publica — a etapa 3 de `WP::main()`,
 * `WP::query_posts()` (`wp-includes/class-wp.php:701-705`) chamando
 * `WP_Query::query()` (`wp-includes/class-wp-query.php:3970-3975`), que por sua
 * vez e `parse_query()` mais `get_posts()`.
 *
 * Entrega de **T003** (US-1, CA-1.2 e CA-1.4).
 *
 * ---
 *
 * ## A ordem das cinco etapas de `get_posts()` que esta funcao preserva
 *
 * | # | etapa | legado |
 * |---|---|---|
 * | 1 | `parse_query()` — os criterios e os 30 predicados | `:1903` |
 * | 2 | o ponto de acao `pre_get_posts`, que **pode mudar os criterios** | `:1916` |
 * | 3 | preenche de novo, *"in case 'pre_get_posts' unset some vars"* | `:1922` |
 * | 4 | monta e executa a consulta | `:1947-3540`, aqui pelo repositorio |
 * | 5 | o ponto de filtro `the_posts`, que **substitui o resultado** | `:3641` |
 *
 * E depois delas, a contagem e o primeiro registro (`:3649` e `:3664`).
 *
 * ⚠️ **A etapa 2 nao reanalisa os predicados, e isso surpreende quem porta.**
 * `pre_get_posts` dispara **depois** de `parse_query`, logo uma extensao que
 * troque `post_type` ali muda a consulta e **nao** muda `is_post_type_archive`.
 * O proprio legado convive com isso: a unica coisa que ele refaz e o preenchimento
 * de `:1922` e o resumo de `:1939-1943`. Um porte que reanalisasse "para ficar
 * coerente" trocaria o predicado que o tema le.
 *
 * ## O que a etapa 4 **nao** monta aqui, e de quem e
 *
 * O SQL. Ele e do repositorio, por ligacao tardia — a razao inteira esta em
 * `./conteudo-consultado.ts`, e em uma linha: `posts` e tabela de BC-01 e a
 * regra de dependencia 3 proibe o `import`. Com isso, as tres tarefas que vem
 * depois pedem ao repositorio em lugar de montar SQL aqui:
 *
 * | tarefa | o que ela decide | o que ela acrescenta |
 * |---|---|---|
 * | **T007** (US-3) | o tamanho da pagina, que nasce em 10 (`schema.php:434`), e a pagina corrente | o total encontrado e o numero de paginas em `ResultadoDaConsulta` |
 * | **T009** (US-4) | a capacidade exigida por estado | o estado e o autor em `ConteudoConsultado`, e o recorte por estado nos criterios |
 * | **T013** (US-6) | o atestado de senha | a senha em `ConteudoConsultado` |
 *
 * ## 🔴 A consulta roda mesmo com a consulta ja marcada como 404
 *
 * `query()` chama `get_posts()` sem olhar `is_404`, e `get_posts()` nao tem
 * guarda nenhuma para ele: um endereco que nao casou regra de traducao vira
 * `error=404`, a etapa 15 de `parse_query` zera os predicados, e **a consulta
 * ainda vai ao banco** — com todos os predicados em falso, o que no legado
 * significa a consulta mais permissiva que o SQL monta. Nao ha nada a "otimizar"
 * aqui: pular a consulta mudaria quantos comandos a leitura emite, que e efeito
 * observavel pelo arnes de paridade.
 */

import {
  analisarConsulta,
  type AnaliseDaConsulta,
  type OpcoesDaAnalise,
} from './analisar-consulta.js';
import type { ConsultaDeTaxonomia } from './consulta-de-taxonomia.js';
import {
  REPOSITORIO_SEM_CONTEUDO,
  type ConteudoConsultado,
} from './conteudo-consultado.js';
import type { ContextoDaConsulta } from './contexto-da-consulta.js';
import {
  preencherCriterios,
  type CriteriosDaConsulta,
} from './criterios-da-consulta.js';
import {
  marcarNaoEncontrado,
  type TiposDeConsulta,
} from './tipo-de-consulta.js';

/**
 * O ponto de acao `pre_get_posts` (`wp-includes/class-wp-query.php:1916`).
 *
 * No legado e `do_action_ref_array`, ou seja acao que recebe a instancia **por
 * referencia** — e e com ela que toda extensao de listagem publica mexe, com
 * `$query->set( 'posts_per_page', 5 )`. Por isso aqui ele **devolve os
 * criterios**: o P2 manda poder conferir *"que um interceptador consegue alterar
 * o resultado onde o legado permite"*, e aqui o legado permite.
 *
 * Os predicados chegam para leitura e **nao** sao alteraveis: no legado uma
 * extensao poderia escrever `$query->is_home = false`, mas nada no nucleo o faz
 * e `parse_query` nao e refeito. Quem precisar disso usa `parse_query`, que
 * dispara antes.
 */
export type IntercepcaoAntesDaConsulta = (
  criterios: CriteriosDaConsulta,
  tipos: TiposDeConsulta,
) => CriteriosDaConsulta;

/**
 * O ponto de filtro `the_posts` (`wp-includes/class-wp-query.php:3641`).
 *
 * **Substitui** a lista de registros, e e o ultimo ponto antes de a contagem e o
 * primeiro registro serem decididos — o legado recalcula os dois **depois** dele
 * (`:3649` e `:3664`), e e por isso que uma extensao que acrescente registro ali
 * muda `post_count` sem nenhum trabalho extra.
 *
 * No legado ele so dispara quando `suppress_filters` e falso (`:3631`), que e o
 * default (`:1979-1981`); a bandeira nao esta declarada aqui porque nenhum
 * caminho de leitura publica a liga.
 */
export type IntercepcaoDosConteudos = (
  conteudos: readonly ConteudoConsultado[],
) => readonly ConteudoConsultado[];

/** Os pontos de extensao desta funcao, na ordem em que disparam. */
export interface PontosDeExtensaoDaConsulta {
  /** `parse_query`, no fim da analise (`:1164`). */
  readonly aoAnalisar?: readonly ((analise: AnaliseDaConsulta) => void)[];
  /** `pre_get_posts`, depois da analise e antes da consulta (`:1916`). */
  readonly antesDeConsultar?: readonly IntercepcaoAntesDaConsulta[];
  /** `the_posts`, depois da consulta (`:3641`). */
  readonly sobreOsConteudos?: readonly IntercepcaoDosConteudos[];
}

/** O que a consulta de conteudo recebe alem dos criterios. */
export interface OpcoesDaConsultaDeConteudo {
  readonly contexto?: ContextoDaConsulta;
  readonly pontosDeExtensao?: PontosDeExtensaoDaConsulta;
}

/**
 * A consulta de conteudo, como o resto do atendimento a le.
 *
 * Os sete campos sao propriedades publicas de `WP_Query` que tema e extensao
 * leem (P8): `$query_vars`, as 30 `is_*`, `$tax_query`, `$posts`, `$post`,
 * `$post_count` e `$queried_object`.
 */
export interface ConsultaDeConteudo {
  /** `WP_Query::$query_vars`, depois de `pre_get_posts` e do repreenchimento. */
  readonly criterios: CriteriosDaConsulta;
  /** As 30 propriedades `is_*`, decididas por `parse_query`. */
  readonly tipos: TiposDeConsulta;
  /** `WP_Query::$tax_query`. */
  readonly taxonomia: ConsultaDeTaxonomia;
  /** `WP_Query::$posts`, na ordem em que o repositorio os devolveu. */
  readonly conteudos: readonly ConteudoConsultado[];
  /**
   * `WP_Query::$post` — o primeiro registro (`:3664`, `reset( $this->posts )`).
   *
   * Ausente quando a consulta nao encontrou nada: o legado tambem deixa a
   * propriedade **sem definir** nesse caso (`unset( $this->post )` em `:550`, e
   * `:3665-3668` nao a repoe). O ramo de paginacao de corpo de `handle_404`
   * depende dessa ausencia: `if ( $post && ... )` (`class-wp.php:763`).
   */
  readonly conteudo?: ConteudoConsultado;
  /** `WP_Query::$post_count` (`:3649`). */
  readonly contagem: number;
  /**
   * `WP_Query::$queried_object` — presente quando a consulta casou um objeto.
   *
   * Vem de `parse_query` no caminho de `pagename` e do repositorio nos outros.
   * E lido por `handle_404` no ramo de `class-wp.php:790`.
   */
  readonly objetoConsultado?: unknown;
}

/**
 * A consulta depois de `WP_Query::set_404()`
 * (`wp-includes/class-wp-query.php:1843-1859`).
 *
 * ⚠️ **`set_404()` faz mais do que marcar: ele zera os 29 predicados** e repoe
 * `is_feed` (`:1846-1849`). Existe porque `WP::handle_404()` o chama **depois**
 * da consulta (`class-wp.php:800`), e a etapa 5 do atendimento
 * (`register_globals`) publica para o tema o estado **ja zerado**: um endereco
 * que era `is_single` e virou 404 deixa de ser `is_single`, e o tema que
 * perguntar vai ouvir nao.
 *
 * T001 nomeou este zeramento como pertencente a T003 no cabecalho de
 * `../requisicao/situacao-da-resposta.ts`, *"nao a este arquivo, que ainda nao
 * tem predicado algum para zerar"*. Mora aqui, e nao la, porque quem muda e a
 * consulta: `handle_404` nao tem estado proprio.
 *
 * Os registros **nao** sao descartados: `set_404()` nao toca `$this->posts`.
 * Isso importa para o ramo 2 de `handle_404`, que 404a um endereco cujo conteudo
 * existe — depois dele, a consulta esta marcada **e** com registro em maos, que
 * e exatamente o que o legado entrega ao tema.
 */
export function consultaMarcadaComoNaoEncontrada(
  consulta: ConsultaDeConteudo,
): ConsultaDeConteudo {
  return Object.freeze({
    ...consulta,
    tipos: marcarNaoEncontrado(consulta.tipos),
  });
}

/**
 * Executa a consulta principal a partir dos criterios resolvidos.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E a mesma
 * declaracao das outras operacoes desta feature, e o motivo e UC-01: *"nao ha
 * verificacao de capacidade. O portao e o `post_status`"*. O portao chega em
 * T009, **dentro** do recorte que esta funcao entrega ao repositorio — nao aqui.
 */
export function consultarConteudo(
  criteriosResolvidos: CriteriosDaConsulta,
  opcoes: OpcoesDaConsultaDeConteudo = {},
): ConsultaDeConteudo {
  const pontos = opcoes.pontosDeExtensao ?? {};

  // Etapa 1 (`:1903`).
  const opcoesDaAnalise: OpcoesDaAnalise = {
    ...(opcoes.contexto === undefined ? {} : { contexto: opcoes.contexto }),
    ...(pontos.aoAnalisar === undefined
      ? {}
      : { aoAnalisar: pontos.aoAnalisar }),
  };
  const analise = analisarConsulta(criteriosResolvidos, opcoesDaAnalise);

  // Etapa 2 (`:1916`) — cada interceptador recebe o que o anterior devolveu.
  let criterios = analise.criterios;
  for (const intercepcao of pontos.antesDeConsultar ?? []) {
    criterios = intercepcao(criterios, analise.tipos);
  }

  // Etapa 3 (`:1922`) — repreenche, porque a etapa 2 pode ter tirado nome.
  criterios = Object.freeze(preencherCriterios(criterios));

  // Etapa 4 (`:1947-3540`) — o repositorio. Os predicados vao com os criterios
  // porque metade das decisoes de `get_posts()` le predicado, e nao criterio.
  const repositorio = opcoes.contexto?.repositorio ?? REPOSITORIO_SEM_CONTEUDO;
  const resultado = repositorio(criterios, analise.tipos);

  // Etapa 5 (`:3641`) — `the_posts` substitui a lista.
  let conteudos = resultado.conteudos;
  for (const intercepcao of pontos.sobreOsConteudos ?? []) {
    conteudos = intercepcao(conteudos);
  }

  // `:3648-3668` — a contagem e o primeiro registro saem da lista **depois** do
  // ponto de filtro, e a ausencia de primeiro registro e significativa.
  const primeiro = conteudos[0];

  // `parse_query` resolve o objeto consultado so no caminho de `pagename`; nos
  // outros, `get_queried_object()` o resolve depois da consulta (`:3988`), e ai
  // ele vem do repositorio.
  const objetoConsultado =
    analise.objetoConsultado ?? resultado.objetoConsultado;

  return Object.freeze({
    criterios,
    tipos: analise.tipos,
    taxonomia: analise.taxonomia,
    conteudos: Object.freeze([...conteudos]),
    ...(primeiro === undefined ? {} : { conteudo: primeiro }),
    contagem: conteudos.length,
    ...(objetoConsultado === undefined ? {} : { objetoConsultado }),
  });
}
