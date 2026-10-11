/**
 * A coleta dos criterios, com ou sem endereco amigavel — o trecho
 * `wp-includes/class-wp.php:319-400` de `WP::parse_request()`.
 *
 * E a frase que fecha a entrega de T002: *"a mesma consulta pode ser montada
 * pelo endereco amigavel ou pelos criterios diretos"*. E ela nao e uma
 * conveniencia do porte: e **o mesmo laco** do legado, e e por isso que CA-1.2 de
 * US-1 pode existir — *"os mesmos criterios podem ser informados diretamente,
 * sem endereco amigavel, e produzem o mesmo resultado"*. A regra de traducao
 * casada entra neste laco como a **ultima** das quatro fontes, e e so isso que
 * ela e.
 *
 * ---
 *
 * ## A precedencia e de quatro fontes, e a terceira e a quarta nao sao a mesma
 *
 * Para cada nome publico, nesta ordem (`:320-336`):
 *
 * | # | fonte | legado | de quem vem |
 * |---|---|---|---|
 * | 1 | `extra_query_vars` | `:320-321` | de quem chama `parse_request`, nunca da rede |
 * | 2 | corpo da requisicao | `:330-331` | do visitante |
 * | 3 | consulta da requisicao | `:332-333` | do visitante |
 * | 4 | a regra de traducao casada | `:334-335` | da tabela de regras |
 *
 * O corpo vence a consulta, e nao o contrario. E a regra casada e a mais fraca
 * das quatro: um `?p=7` na requisicao **vence** o `p=$matches[1]` que o endereco
 * amigavel produziu. Inverter essa ordem troca qual conteudo a pagina mostra para
 * um endereco que tem as duas coisas.
 *
 * ## ⚠️ O caso em que o legado recusa a requisicao com 400
 *
 * Entre as fontes 1 e 2 ha uma guarda (`:322-329`): se o **mesmo nome** chega
 * pelo corpo **e** pela consulta com valores diferentes, o legado nao escolhe —
 * ele encerra a requisicao com `wp_die( ..., 400 )`. E uma recusa de requisicao,
 * nao um erro de valor: nada depois dela acontece, nem a coleta dos nomes
 * seguintes, nem a consulta, nem os pontos de extensao `request` e
 * `parse_request`. Por isso {@link RecusaDeVariavelDivergente} e lancada e nao
 * devolvida — devolve-la deixaria o laco seguir e produziria criterios que o
 * legado nunca produz.
 *
 * A comparacao e `!==` (`:323`), ou seja **identica**: tipo, valor e, em arranjo,
 * tambem a ordem. Valores iguais nos dois lados nao recusam nada.
 *
 * ## O que esta coleta deliberadamente NAO faz
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | converter escalar em texto | `:338-347` | ninguem: e inalcancavel sob o tipo que T001 declarou — ver abaixo |
 * | criterio de tipo de conteudo (`post_type` e `name` a partir do nome do tipo) | `:313-317` e `:349-352` | **T003**, que traz o registro de tipos |
 * | espaco de volta para `+` no criterio de taxonomia | `:356-362` | **T003** |
 * | tirar taxonomia e tipo de conteudo nao consultaveis publicamente | `:364-389` | **T003** (sao os *"dois filtros de visibilidade"* que T001 nomeou) |
 * | resolver identificador numerico que colide com arquivo de data | `:390` | **T003**: `wp_resolve_numeric_slug_conflicts` (`wp-includes/rewrite.php:381`) le a forma dos enderecos **e** procura conteudo, duas coisas que este modulo nao tem |
 *
 * A primeira linha merece a explicacao inteira, porque parece omissao: `:338-347`
 * converte cada valor escalar com `(string)`, inclusive dentro de arranjo, e
 * `ValorDeCriterio` — como T001 o declarou — ja e `string` ou lista de `string`.
 * A conversao nao tem o que converter. O que o tipo de T001 descarta junto e o
 * `empty( '0' )` de `:338`, que faz o legado **pular** a conversao de um valor
 * `'0'`: pular a conversao de um texto que ja e texto nao tem efeito observavel.
 *
 * As quatro linhas de T003 tem a **posicao** marcada no corpo da funcao, e nao o
 * fim: BR-MIGRAR-106 (`EXT-ORDEM`) poe a ordem no contrato publico, e a tabela
 * *Nao negociavel* da constituicao tira essa decisao das maos do agente.
 */

import type {
  CriteriosDeConsulta,
  ValorDeCriterio,
} from '../requisicao/endereco-pedido.js';
import {
  NOMES_PRIVADOS_DE_CRITERIO,
  NOMES_PUBLICOS_DE_CRITERIO,
} from './nomes-de-criterio.js';
import type { CriteriosDaRegra } from './tabela-de-regras.js';

/** O texto de `wp_die()` em `wp-includes/class-wp.php:326`. */
export const MENSAGEM_DE_VARIAVEL_DIVERGENTE =
  'A variable mismatch has been detected.';

/**
 * O titulo de `wp_die()` em `wp-includes/class-wp.php:327`.
 *
 * Fica em ingles de proposito: `EC-05` de `target_screens.md` fixa que o texto
 * ingles **e** a chave do catalogo de traducao, e traduzir aqui trocaria a chave.
 */
export const TITULO_DE_VARIAVEL_DIVERGENTE =
  'Sorry, you are not allowed to view this item.';

/** O codigo que `wp_die()` declara em `wp-includes/class-wp.php:328`. */
export const CODIGO_DE_VARIAVEL_DIVERGENTE = 400;

/**
 * A recusa de `:322-329`: o mesmo nome de criterio chegou pelo corpo e pela
 * consulta da requisicao com valores diferentes.
 *
 * Encerra a requisicao. O codigo e o texto sao os do legado; quem os transforma
 * em resposta HTTP e a borda, como `plataforma/telas` faz com as outras recusas
 * de `wp_die()`.
 *
 * `nomeDoCriterio` nao existe no legado e **nao e saida**: e diagnostico, que o
 * **P7** permite acrescentar desde que nenhuma decisao passe a depender dele.
 * Nenhuma passa — a recusa e a mesma para qualquer nome.
 */
export class RecusaDeVariavelDivergente extends Error {
  readonly titulo = TITULO_DE_VARIAVEL_DIVERGENTE;
  readonly codigoHttp = CODIGO_DE_VARIAVEL_DIVERGENTE;
  readonly nomeDoCriterio: string;

  constructor(nomeDoCriterio: string) {
    super(MENSAGEM_DE_VARIAVEL_DIVERGENTE);
    this.name = 'RecusaDeVariavelDivergente';
    this.nomeDoCriterio = nomeDoCriterio;
  }
}

/** Reconhece a recusa sem depender da identidade da classe. */
export function ehRecusaDeVariavelDivergente(
  valor: unknown,
): valor is RecusaDeVariavelDivergente {
  return valor instanceof RecusaDeVariavelDivergente;
}

/**
 * O `!==` do legado sobre valor de criterio (`wp-includes/class-wp.php:323`).
 *
 * Texto compara com texto; lista compara com lista, elemento a elemento **e na
 * ordem**; texto e lista nunca sao identicos.
 */
function mesmoValor(primeiro: ValorDeCriterio, segundo: ValorDeCriterio): boolean {
  if (typeof primeiro === 'string' || typeof segundo === 'string') {
    return primeiro === segundo;
  }
  if (primeiro.length !== segundo.length) {
    return false;
  }
  return primeiro.every((valor, indice) => valor === segundo[indice]);
}

/** As fontes da coleta, na forma em que a resolucao as tem. */
export interface EntradaDaColeta {
  /** A lista de nomes publicos, **depois** do ponto de extensao `query_vars`. */
  readonly nomesPublicos?: readonly string[];
  readonly nomesPrivados?: readonly string[];
  /** `WP::$extra_query_vars` — o argumento de `parse_request`. */
  readonly criteriosExtras?: CriteriosDeConsulta;
  /** O arranjo do corpo da requisicao. */
  readonly parametrosDeCorpo?: CriteriosDeConsulta;
  /** O arranjo da consulta da requisicao, ja sem o `error` que o casamento tirou. */
  readonly parametrosDeConsulta?: CriteriosDeConsulta;
  /** `$perma_query_vars` — os criterios da regra de traducao casada. */
  readonly criteriosDaRegra?: CriteriosDaRegra;
  /** `$error`, quando o casamento o deixou de pe. */
  readonly erro?: string;
}

/**
 * Coleta os criterios de consulta.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4): e a mesma
 * declaracao das outras operacoes desta feature, e por UC-01 ser literal sobre
 * nao verificar capacidade nenhuma na leitura publica.
 *
 * @throws {RecusaDeVariavelDivergente} quando o mesmo nome chega pelo corpo e
 * pela consulta da requisicao com valores diferentes (`:322-329`).
 */
export function coletarCriterios(
  entrada: EntradaDaColeta = {},
): CriteriosDeConsulta {
  const nomesPublicos = entrada.nomesPublicos ?? NOMES_PUBLICOS_DE_CRITERIO;
  const nomesPrivados = entrada.nomesPrivados ?? NOMES_PRIVADOS_DE_CRITERIO;
  const extras = entrada.criteriosExtras ?? {};
  const corpo = entrada.parametrosDeCorpo ?? {};
  const consulta = entrada.parametrosDeConsulta ?? {};
  const daRegra = entrada.criteriosDaRegra;

  // A ordem de insercao e a da lista publica, depois a da privada, depois
  // `error`: e ela que `WP::build_query_string()` percorre em
  // `wp-includes/class-wp.php:612` para montar `WP::$query_string`, que e
  // argumento de ponto de extensao.
  const criterios: Record<string, ValorDeCriterio> = {};

  // `:319-336`.
  for (const nome of nomesPublicos) {
    const extra = extras[nome];
    const doCorpo = corpo[nome];
    const daConsulta = consulta[nome];

    if (extra !== undefined) {
      criterios[nome] = extra;
    } else if (
      doCorpo !== undefined &&
      daConsulta !== undefined &&
      !mesmoValor(daConsulta, doCorpo)
    ) {
      throw new RecusaDeVariavelDivergente(nome);
    } else if (doCorpo !== undefined) {
      criterios[nome] = doCorpo;
    } else if (daConsulta !== undefined) {
      criterios[nome] = daConsulta;
    } else {
      const valorDaRegra = daRegra?.[nome];
      if (valorDaRegra !== undefined) {
        criterios[nome] = valorDaRegra;
      }
    }

    // `:338-347` (conversao de escalar) e `:349-352` (criterio de tipo de
    // conteudo) entram AQUI, dentro do laco. A conversao e inalcancavel sob o
    // tipo de T001; o criterio de tipo de conteudo e T003. Ver o cabecalho.
  }

  // `:356-362`, `:364-389` e `:390` — taxonomia, os dois filtros de
  // visibilidade e a colisao de identificador numerico com arquivo de data —
  // entram AQUI, nesta ordem, e sao T003.

  // `:392-396` — os nomes privados, e **so** de `extra_query_vars`.
  for (const nome of nomesPrivados) {
    const extra = extras[nome];
    if (extra !== undefined) {
      criterios[nome] = extra;
    }
  }

  // `:398-400` — o erro entra por ultimo, e por isso ele vence qualquer `error`
  // que a requisicao tenha trazido.
  if (entrada.erro !== undefined) {
    criterios['error'] = entrada.erro;
  }

  return criterios;
}
