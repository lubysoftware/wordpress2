/**
 * Resolver o endereco pedido num conjunto de criterios de consulta — o
 * `WP::parse_request()` do legado (`wp-includes/class-wp.php:136`), que e o
 * passo 2 de UC-01.
 *
 * **Por que o conjunto vazio desta tarefa e o legado, e nao um esboco.** No
 * legado, todo o trabalho que recorta o caminho pedido, procura regra de
 * traducao, marca `error = '404'` e liga `did_permalink` esta dentro de um
 * `if ( ! empty( $rewrite ) )` (`wp-includes/class-wp.php:165`), e a tabela de
 * regras e lida logo antes (`:163`). **Sem tabela de regras, o legado nao deriva
 * criterio nenhum do caminho pedido e nao marca erro nenhum** — e e esse o
 * estado desta arvore, porque portar a tabela e T002, e coletar os criterios
 * diretos tambem.
 *
 * E e tambem o que `UT-038-2` vai cobrar — *"recusa inventar criterio para
 * endereco que nao casa com nenhuma regra"*: a resolucao nao adivinha
 * identificador a partir do texto do endereco. Nunca.
 *
 * **O que falta, nomeado, para quem pega T002 e T003:**
 *
 * | o que entra | onde esta no legado | tarefa |
 * |---|---|---|
 * | a tabela de regras como dado, e o casamento do caminho contra ela | `class-wp.php:163-298` | T002 |
 * | `error = '404'` como criterio quando ha tabela e nenhuma regra casa | `class-wp.php:167` e `:398-400` | T002 |
 * | a coleta dos criterios diretos, com a recusa 400 da divergencia | `class-wp.php:319-336` | T002 |
 * | o ponto de extensao `query_vars`, sobre a lista de nomes publicos | `class-wp.php:311` | T002 |
 * | os 25 nomes privados, que so entram por `extra_query_vars` | `class-wp.php:392-396` | T002 |
 * | os criterios de tipo de conteudo e de taxonomia, e os dois filtros de visibilidade | `class-wp.php:313-317` e `:356-389` | T003 |
 *
 * A tabela de regras **nao** e parametro desta funcao hoje, de proposito: a
 * forma dela e a entrega de T002 (*"as regras de traducao do legado estao
 * declaradas como dado, nao como codigo"*), e declarar a forma aqui, sem nada
 * que a leia, seria decidir a entrega da outra tarefa. O que o legado guarda e
 * um arranjo ordenado de padrao para consulta, e **a ordem e a regra**: ele para
 * na primeira que casa (`class-wp.php:261-263`).
 *
 * **Os pontos de extensao desta funcao sao contrato publico (P2), e tres deles
 * passam por aqui.** O barramento de ganchos (`plataforma/barramento/`) nao
 * existe nesta arvore, e inventa-lo em T001 seria decidir no lugar da feature
 * 015. Entao os interceptadores chegam por argumento, com o nome do legado, na
 * posicao do legado e com o retorno valendo — que e justamente o que o P2 manda
 * poder conferir: *"que ele dispara, com os argumentos declarados, na posicao
 * declarada do fluxo, e que um interceptador consegue alterar o resultado onde o
 * legado permite"*. Quando o barramento existir, e ele que passa a alimenta-los;
 * a forma do ponto nao muda.
 *
 * ⚠️ **A prioridade inteira nao esta aqui, e e lacuna declarada e nao decisao.**
 * AD-03 poe a ordem por prioridade no contrato, e o inventario de pontos de
 * extensao que o P2 exige — *"com nome, argumentos e ordem"* — nao existe neste
 * pacote (a mesma lacuna que `001-identidade-e-acesso` registrou na cadeia de
 * autenticacao). Dentro desta funcao a ordem e a do arranjo recebido; ordenar
 * por prioridade e de quem construir o barramento.
 */

import {
  CRITERIOS_VAZIOS,
  type CriteriosDeConsulta,
  type EnderecoPedido,
} from './endereco-pedido.js';

/**
 * O ponto de extensao `do_parse_request` (`wp-includes/class-wp.php:148`).
 *
 * Devolve valor, e o valor decide: qualquer retorno falso faz a resolucao **nao
 * acontecer** e `parse_request` devolver `false` — e, no legado, isso faz
 * `WP::main()` pular a consulta, o tratamento de situacao e o registro das
 * variaveis, indo direto para o envio de cabecalhos (`class-wp.php:822-830`).
 */
export type IntercepcaoDeResolucao = (
  resolver: boolean,
  pedido: EnderecoPedido,
) => boolean;

/**
 * O ponto de extensao `request` (`wp-includes/class-wp.php:409`).
 *
 * E o ultimo ponto em que os criterios mudam antes da consulta, e o retorno
 * **substitui** o conjunto.
 */
export type IntercepcaoDeCriterios = (
  criterios: CriteriosDeConsulta,
) => CriteriosDeConsulta;

/**
 * O ponto de acao `parse_request` (`wp-includes/class-wp.php:418`).
 *
 * Nao devolve valor: dispara depois de os criterios estarem resolvidos, e e o
 * ultimo passo da funcao. No legado ele recebe a instancia por referencia, o que
 * permite ao interceptador mexer no estado; aqui recebe a resolucao pronta e
 * congelada, e **nao** pode troca-la — quem quer trocar usa `request`, que e o
 * ponto que devolve valor. E a diferenca entre os 2.460 pontos de filtro e os
 * 1.068 de acao que BR-MIGRAR-102 poe no contrato.
 */
export type ObservadorDaResolucao = (resolucao: ResolucaoDeEndereco) => void;

/** Os pontos de extensao desta funcao, na ordem em que disparam. */
export interface PontosDeExtensaoDaResolucao {
  /** `do_parse_request`, antes de tudo. */
  readonly antesDeResolver?: readonly IntercepcaoDeResolucao[];
  /** `request`, depois da coleta e antes de a resolucao ficar pronta. */
  readonly sobreOsCriterios?: readonly IntercepcaoDeCriterios[];
  /** `parse_request`, por ultimo. */
  readonly depoisDeResolver?: readonly ObservadorDaResolucao[];
}

/** O que a resolucao recebe alem do endereco. */
export interface OpcoesDaResolucao {
  readonly pontosDeExtensao?: PontosDeExtensaoDaResolucao;
}

/**
 * O resultado da resolucao.
 *
 * Os cinco campos sao os do legado, e estao aqui porque sao **superficie
 * publicada**: `WP::$query_vars`, `$request`, `$matched_rule`, `$matched_query`
 * e `$did_permalink` sao propriedades publicas que extensao de terceiro le, e o
 * retorno booleano de `parse_request` existe desde a versao 6.0.0. O P8 proibe
 * sumir com qualquer um deles, e e por isso que os cinco estao declarados antes
 * de existir quem os preencha com outra coisa.
 */
export interface ResolucaoDeEndereco {
  /**
   * O retorno de `parse_request`: falso **so** quando `do_parse_request`
   * curto-circuitou.
   */
  readonly resolvida: boolean;
  /** `WP::$query_vars`. */
  readonly criterios: CriteriosDeConsulta;
  /**
   * `WP::$request` — o caminho pedido, depois do recorte.
   *
   * Vazio sem tabela de regras: o legado so o preenche dentro do bloco de
   * casamento (`class-wp.php:217`).
   */
  readonly caminhoDaRequisicao: string;
  /** `WP::$matched_rule` — o padrao que casou, vazio quando nenhum casou. */
  readonly regraCasada: string;
  /** `WP::$matched_query` — a consulta da regra que casou. */
  readonly consultaCasada: string;
  /**
   * `WP::$did_permalink` — se a resolucao passou pelo caminho de endereco
   * amigavel.
   *
   * Falso sem tabela de regras, porque o legado o liga **dentro** do bloco
   * (`class-wp.php:168`) e o desliga de novo quando o caminho pedido e vazio ou
   * e o proprio script (`:296`).
   */
  readonly permalinkResolvido: boolean;
}

/** A resolucao que nao aconteceu, porque `do_parse_request` recusou. */
const RESOLUCAO_RECUSADA: ResolucaoDeEndereco = Object.freeze({
  resolvida: false,
  criterios: CRITERIOS_VAZIOS,
  caminhoDaRequisicao: '',
  regraCasada: '',
  consultaCasada: '',
  permalinkResolvido: false,
});

/**
 * Resolve o endereco pedido em criterios de consulta.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto.** O P4 manda declarar
 * permissao explicita em toda operacao exposta e preservar o default de cada
 * camada *"inclusive quando o default e permissivo"*. UC-01 e literal: *"nao ha
 * verificacao de capacidade. O portao e o `post_status`"* — e o portao do
 * `post_status` e US-4, em T009. Quem puser verificacao de capacidade aqui fecha
 * a cara publica do produto, que e o que esta feature existe para entregar.
 */
export function resolverEndereco(
  pedido: EnderecoPedido,
  opcoes: OpcoesDaResolucao = {},
): ResolucaoDeEndereco {
  const pontos = opcoes.pontosDeExtensao ?? {};

  // `do_parse_request`: cada interceptador recebe o valor corrente, e o retorno
  // do ultimo e o que vale — como em `apply_filters` (`class-wp.php:148`).
  let resolver = true;
  for (const intercepcao of pontos.antesDeResolver ?? []) {
    resolver = intercepcao(resolver, pedido);
  }
  if (!resolver) {
    return RESOLUCAO_RECUSADA;
  }

  // Aqui entra T002: o recorte do caminho, o casamento contra a tabela de regras
  // e, quando a tabela existe e nenhuma regra casa, o criterio `error` em
  // `'404'`. Sem tabela, o legado chega ao fim da funcao com o conjunto vazio.
  let criterios: CriteriosDeConsulta = CRITERIOS_VAZIOS;

  // `request`: o retorno substitui o conjunto (`class-wp.php:409`).
  for (const intercepcao of pontos.sobreOsCriterios ?? []) {
    criterios = intercepcao(criterios);
  }

  const resolucao: ResolucaoDeEndereco = Object.freeze({
    resolvida: true,
    criterios,
    caminhoDaRequisicao: '',
    regraCasada: '',
    consultaCasada: '',
    permalinkResolvido: false,
  });

  // `parse_request`: ponto de acao, por ultimo e sem retorno (`class-wp.php:418`).
  for (const observador of pontos.depoisDeResolver ?? []) {
    observador(resolucao);
  }

  return resolucao;
}
