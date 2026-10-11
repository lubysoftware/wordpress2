/**
 * Resolver o endereco pedido num conjunto de criterios de consulta — o
 * `WP::parse_request()` do legado (`wp-includes/class-wp.php:136`), que e o
 * passo 2 de UC-01.
 *
 * **O que esta funcao e, depois de T002.** Ela e a ORDEM das seis etapas do
 * `parse_request`, e nada mais: cada etapa mora no arquivo dela, em
 * `../traducao-de-endereco/`, e esta funcao as chama na posicao do legado.
 *
 * | # | etapa | onde | legado |
 * |---|---|---|---|
 * | 1 | o ponto de extensao que pode recusar a resolucao | aqui | `:148` |
 * | 2 | o `extra_query_vars`, arranjo ou texto | aqui, com `analisarCadeiaDeConsulta` | `:153-159` |
 * | 3 | a tabela de regras de traducao | `tabela-de-regras.ts`, pela fonte recebida | `:163` |
 * | 4 | o casamento do caminho pedido contra a tabela | `casar-endereco.ts` | `:165-298` |
 * | 5 | o ponto de extensao sobre a lista de nomes aceitos | `nomes-de-criterio.ts` | `:311` |
 * | 6 | a coleta das quatro fontes de criterio | `criterios-diretos.ts` | `:319-400` |
 *
 * Depois delas, os dois pontos de extensao do fim: `request`, que substitui os
 * criterios (`:409`), e `parse_request`, que so observa (`:418`).
 *
 * ---
 *
 * ## O que esta funcao deliberadamente NAO faz com o texto do endereco
 *
 * Ela **nao** analisa a parte de consulta da URI pedida. No legado, `$_GET` e
 * `$_POST` chegam prontos — o interpretador os monta antes de a primeira linha
 * rodar —, e `parse_request` so os **le** (`:322-333`). Por isso `/?p=42` nao
 * deriva criterio nenhum aqui se a borda HTTP nao tiver preenchido
 * `parametrosDeConsulta`: quem traduz texto de requisicao em arranjo e a borda, e
 * um porte que o fizesse aqui teria duas analises da mesma coisa, que divergem no
 * primeiro caractere escapado.
 *
 * ## O que falta, nomeado, para quem pega T003
 *
 * | o que entra | onde esta no legado | onde entra aqui |
 * |---|---|---|
 * | os criterios de tipo de conteudo | `:313-317` e `:349-352` | dentro do laco de `coletarCriterios` |
 * | o espaco de volta para `+` no criterio de taxonomia | `:356-362` | depois do laco |
 * | os dois filtros de visibilidade (taxonomia e tipo de conteudo) | `:364-389` | depois do laco |
 * | a colisao de identificador numerico com arquivo de data | `:390` | depois dos filtros |
 * | a consulta principal, que le estes criterios | `class-wp-query.php:811` | etapa 3 de `atender-leitura-publica.ts` |
 *
 * As quatro primeiras tem a posicao marcada em comentario no corpo de
 * `criterios-diretos.ts`, e nao no fim: BR-MIGRAR-106 (`EXT-ORDEM`) poe a ordem no
 * contrato publico.
 *
 * ## Os pontos de extensao desta funcao sao contrato publico (P2)
 *
 * Sao quatro, agora com o `query_vars` que T001 registrou como ainda sem lugar. O
 * barramento de ganchos (`plataforma/barramento/`) nao existe nesta arvore, e
 * inventa-lo aqui seria decidir no lugar da feature 015. Entao os interceptadores
 * chegam por argumento, com o nome do legado, na posicao do legado e com o
 * retorno valendo — que e o que o P2 manda poder conferir: *"que ele dispara, com
 * os argumentos declarados, na posicao declarada do fluxo, e que um interceptador
 * consegue alterar o resultado onde o legado permite"*. Quando o barramento
 * existir, e ele que passa a alimenta-los; a forma do ponto nao muda.
 *
 * ⚠️ **A prioridade inteira nao esta aqui, e e lacuna declarada e nao decisao.**
 * AD-03 poe a ordem por prioridade no contrato, e o inventario de pontos de
 * extensao que o P2 exige — *"com nome, argumentos e ordem"* — nao existe neste
 * pacote (a mesma lacuna que `001-identidade-e-acesso` registrou na cadeia de
 * autenticacao). Dentro desta funcao a ordem e a do arranjo recebido; ordenar
 * por prioridade e de quem construir o barramento.
 */

import {
  casarEndereco,
  coletarCriterios,
  fonteFixaDeRegras,
  nomesPublicosFiltrados,
  analisarCadeiaDeConsulta,
  TABELA_SEM_REGRAS,
  vazioNoLegado,
  type FonteDeRegrasDeTraducao,
  type IntercepcaoDeNomesDeCriterio,
} from '../traducao-de-endereco/index.js';
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
  /**
   * `query_vars`, sobre a **lista de nomes** aceitos, depois do casamento de
   * regra e antes da coleta (`class-wp.php:311`).
   */
  readonly sobreOsNomesDeCriterio?: readonly IntercepcaoDeNomesDeCriterio[];
  /** `request`, depois da coleta e antes de a resolucao ficar pronta. */
  readonly sobreOsCriterios?: readonly IntercepcaoDeCriterios[];
  /** `parse_request`, por ultimo. */
  readonly depoisDeResolver?: readonly ObservadorDaResolucao[];
}

/** O que a resolucao recebe alem do endereco. */
export interface OpcoesDaResolucao {
  /**
   * O `$extra_query_vars` de `parse_request( $extra_query_vars = '' )`
   * (`class-wp.php:136`), que no legado chega de `WP::main( $query_args )`
   * (`:819` e `:822`).
   *
   * Arranjo ou texto, como no legado (`:153-159`): texto e analisado com
   * `parse_str`, e texto vazio vale como arranjo vazio. E a **unica** fonte dos
   * 26 nomes privados de criterio (`:392-396`), logo e por aqui que o nucleo
   * monta consulta que o visitante nao consegue pedir.
   */
  readonly criteriosExtras?: CriteriosDeConsulta | string;
  /**
   * De onde vem a tabela de regras de traducao — o
   * `$wp_rewrite->wp_rewrite_rules()` de `class-wp.php:163`.
   *
   * Ausente, a tabela e vazia, que e o estado de fabrica de uma instalacao nova
   * de site unico (`wp-admin/includes/schema.php:443`): o bloco de casamento nao
   * roda e todo criterio vem dos parametros da requisicao. Ver
   * `../traducao-de-endereco/tabela-de-regras.ts`.
   */
  readonly fonteDeRegras?: FonteDeRegrasDeTraducao;
  readonly pontosDeExtensao?: PontosDeExtensaoDaResolucao;
}

/**
 * O resultado da resolucao.
 *
 * Os cinco campos sao os do legado, e estao aqui porque sao **superficie
 * publicada**: `WP::$query_vars`, `$request`, `$matched_rule`, `$matched_query`
 * e `$did_permalink` sao propriedades publicas que extensao de terceiro le, e o
 * retorno booleano de `parse_request` existe desde a versao 6.0.0. O P8 proibe
 * sumir com qualquer um deles.
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
   * `WP::$request` — o caminho pedido, depois do recorte (`class-wp.php:217`).
   *
   * Vazio sem tabela de regras: o legado so o preenche dentro do bloco de
   * casamento.
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
 * `:153-159` — o `extra_query_vars` chega como arranjo ou como texto.
 *
 * O legado so analisa o texto quando ele **nao e vazio** no sentido do
 * interpretador, e `empty()` ali tambem cobre o digito zero.
 */
function criteriosExtrasDe(
  informados: CriteriosDeConsulta | string | undefined,
): CriteriosDeConsulta {
  if (informados === undefined) {
    return CRITERIOS_VAZIOS;
  }
  if (typeof informados !== 'string') {
    return informados;
  }
  return vazioNoLegado(informados)
    ? CRITERIOS_VAZIOS
    : analisarCadeiaDeConsulta(informados);
}

/**
 * Resolve o endereco pedido em criterios de consulta.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto.** O P4 manda declarar
 * permissao explicita em toda operacao exposta e preservar o default de cada
 * camada *"inclusive quando o default e permissivo"*. UC-01 e literal: *"nao ha
 * verificacao de capacidade. O portao e o `post_status`"* — e o portao do
 * `post_status` e US-4, em T009. Quem puser verificacao de capacidade aqui fecha
 * a cara publica do produto, que e o que esta feature existe para entregar.
 *
 * @throws {RecusaDeVariavelDivergente} quando o mesmo nome de criterio chega
 * pelo corpo e pela consulta da requisicao com valores diferentes: o legado
 * encerra a requisicao com `wp_die( ..., 400 )` (`class-wp.php:322-329`).
 */
export function resolverEndereco(
  pedido: EnderecoPedido,
  opcoes: OpcoesDaResolucao = {},
): ResolucaoDeEndereco {
  const pontos = opcoes.pontosDeExtensao ?? {};

  // Etapa 1 — `do_parse_request`: cada interceptador recebe o valor corrente, e
  // o retorno do ultimo e o que vale, como em `apply_filters` (`:148`).
  let resolver = true;
  for (const intercepcao of pontos.antesDeResolver ?? []) {
    resolver = intercepcao(resolver, pedido);
  }
  if (!resolver) {
    return RESOLUCAO_RECUSADA;
  }

  // Etapa 2 (`:153-159`).
  const criteriosExtras = criteriosExtrasDe(opcoes.criteriosExtras);

  // Etapa 3 (`:163`) — uma chamada por requisicao, nesta posicao. A fonte pode
  // reconstruir e gravar a tabela, e e por isso que ela e funcao e nao valor.
  const fonte = opcoes.fonteDeRegras ?? fonteFixaDeRegras(TABELA_SEM_REGRAS);
  const tabela = fonte();

  // Etapa 4 (`:165-298`).
  const casamento = casarEndereco(pedido, tabela);

  // Etapa 5 (`:311`).
  const nomesPublicos = nomesPublicosFiltrados(
    pontos.sobreOsNomesDeCriterio ?? [],
  );

  // Etapa 6 (`:319-400`) — as quatro fontes, na precedencia do legado.
  let criterios = coletarCriterios({
    nomesPublicos,
    criteriosExtras,
    parametrosDeCorpo: pedido.parametrosDeCorpo ?? CRITERIOS_VAZIOS,
    parametrosDeConsulta: casamento.parametrosDeConsulta,
    ...(casamento.criteriosDaRegra === undefined
      ? {}
      : { criteriosDaRegra: casamento.criteriosDaRegra }),
    ...(casamento.erro === undefined ? {} : { erro: casamento.erro }),
  });

  // `request`: o retorno substitui o conjunto (`:409`).
  for (const intercepcao of pontos.sobreOsCriterios ?? []) {
    criterios = intercepcao(criterios);
  }

  const resolucao: ResolucaoDeEndereco = Object.freeze({
    resolvida: true,
    criterios,
    caminhoDaRequisicao: casamento.caminhoDaRequisicao,
    regraCasada: casamento.regraCasada,
    consultaCasada: casamento.consultaCasada,
    permalinkResolvido: casamento.permalinkResolvido,
  });

  // `parse_request`: ponto de acao, por ultimo e sem retorno (`:418`).
  for (const observador of pontos.depoisDeResolver ?? []) {
    observador(resolucao);
  }

  return resolucao;
}
