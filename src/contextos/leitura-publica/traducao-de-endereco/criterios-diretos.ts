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
 *
 * Essa linha merece a explicacao inteira, porque parece omissao: `:338-347`
 * converte cada valor escalar com `(string)`, inclusive dentro de arranjo, e
 * `ValorDeCriterio` — como T001 o declarou — ja e `string` ou lista de `string`.
 * A conversao nao tem o que converter. O que o tipo de T001 descarta junto e o
 * `empty( '0' )` de `:338`, que faz o legado **pular** a conversao de um valor
 * `'0'`: pular a conversao de um texto que ja e texto nao tem efeito observavel.
 *
 * ⚠️ O `empty()` de `:338` **nao** e so sobre a conversao: o mapeamento de
 * criterio de tipo de conteudo de `:349-352` esta **dentro** dele. Logo
 * `?livro=0` nao vira `post_type=livro`, e `?livro=x` vira. Esse aninhamento e
 * facil de perder quando se le o trecho como duas regras separadas.
 *
 * ## ✅ As quatro coisas que T002 deixou nomeadas, e que T003 trouxe
 *
 * | o que | legado | onde esta |
 * |---|---|---|
 * | criterio de tipo de conteudo (`post_type` e `name` a partir do nome do tipo) | `:313-317` e `:349-352` | aqui, com o registro de `../consulta/registro-consultavel.ts` |
 * | espaco de volta para `+` no criterio de taxonomia | `:356-362` | aqui, {@link desfazerEspacoDeTaxonomia} |
 * | tirar taxonomia e tipo de conteudo nao consultaveis publicamente | `:364-389` | aqui, {@link filtrarTaxonomiaNaoConsultavel} e {@link filtrarTipoDeConteudoNaoConsultavel} |
 * | resolver identificador numerico que colide com arquivo de data | `:390` | `./colisao-de-identificador-numerico.ts` |
 *
 * As quatro estao **nas posicoes do legado**, e nao no fim: BR-MIGRAR-106
 * (`EXT-ORDEM`) poe a ordem no contrato publico, e a tabela *Nao negociavel* da
 * constituicao tira essa decisao das maos do agente. A sequencia e: o laco, o
 * espaco de taxonomia, os dois filtros de visibilidade, a colisao de
 * identificador, os nomes privados e o `error` — seis passos, nesta ordem.
 *
 * ## Por que os tres colaboradores chegam num contexto, e nao em tres campos
 *
 * `../consulta/contexto-da-consulta.ts` declara o contexto que a etapa 3 do
 * atendimento usa, e `parse_request` le um **subconjunto** dele: os dois
 * registros, o `is_admin()`, a forma dos enderecos e o `get_page_by_path()`. Sao
 * os mesmos valores, lidos duas vezes no mesmo fluxo do legado — e um contexto
 * so garante que as duas leituras concordem. Declarar campos separados aqui
 * permitiria uma composicao em que `parse_request` e `parse_query` enxergam
 * registros diferentes, que e um estado que o legado nao tem.
 */

import {
  contextoResolvido,
  type ContextoDaConsulta,
  type ContextoDaConsultaResolvido,
} from '../consulta/contexto-da-consulta.js';
import {
  criteriosDeTipoDeConteudo,
  tiposConsultaveisPublicamente,
} from '../consulta/registro-consultavel.js';
import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import type {
  CriteriosDeConsulta,
  ValorDeCriterio,
} from '../requisicao/endereco-pedido.js';
import { resolverColisaoDeIdentificadorNumerico } from './colisao-de-identificador-numerico.js';
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
  /**
   * O contexto de onde saem os dois registros, o `is_admin()`, a forma dos
   * enderecos e o `get_page_by_path()` — ver a ultima secao do cabecalho.
   *
   * Ausente, os registros estao vazios: nenhum criterio de tipo de conteudo e
   * reconhecido, nenhum espaco de taxonomia e desfeito, **nenhum `post_type`
   * sobrevive ao filtro de `:377-387`** e a colisao de identificador numerico
   * nao se resolve. Nao e omissao: e o que o legado faz numa instalacao em que
   * nada foi registrado.
   */
  readonly contexto?: ContextoDaConsulta;
}

/**
 * `:356-362` — *"Convert urldecoded spaces back into '+'"*.
 *
 * O caminho do endereco chegou decodificado, e `+` ja virou espaco: sem desfazer
 * isso, `/etiqueta/a+b/` consultaria o termo `a b` em lugar dos termos `a` e `b`
 * — que e o significado que `parse_tax_query` da ao `+`
 * (`class-wp-query.php:1215-1224`).
 *
 * ⚠️ O teste e `isset`, e nao `! empty`: um criterio de taxonomia com o valor
 * `'0'` tambem passa por aqui. E `str_replace` com arranjo como assunto troca
 * em **cada** elemento, o que esta reproduzido.
 */
function desfazerEspacoDeTaxonomia(
  criterios: Record<string, ValorDeCriterio>,
  contexto: ContextoDaConsultaResolvido,
): void {
  for (const taxonomia of contexto.taxonomias()) {
    const nome = taxonomia.criterioProprio;
    if (nome === '') {
      continue;
    }
    const valor = criterios[nome];
    if (valor === undefined) {
      continue;
    }
    criterios[nome] =
      typeof valor === 'string'
        ? valor.replaceAll(' ', '+')
        : valor.map((parte) => parte.replaceAll(' ', '+'));
  }
}

/**
 * `:364-374` — taxonomia nao consultavel publicamente sai dos criterios, **e so
 * fora do painel**.
 *
 * O comentario do legado diz o que o codigo faz e o proprio codigo diz por que
 * basta testar o criterio `taxonomy`: *"Non-publicly queryable taxonomies cannot
 * register custom query vars. See register_taxonomy()"*. Logo a unica porta de
 * entrada delas e o par `taxonomy` + `term`, e os dois saem juntos.
 */
function filtrarTaxonomiaNaoConsultavel(
  criterios: Record<string, ValorDeCriterio>,
  contexto: ContextoDaConsultaResolvido,
): void {
  if (contexto.noPainel) {
    return;
  }
  for (const taxonomia of contexto.taxonomias()) {
    if (taxonomia.consultavelPublicamente) {
      continue;
    }
    if (criterios['taxonomy'] === taxonomia.nome) {
      delete criterios['taxonomy'];
      delete criterios['term'];
    }
  }
}

/**
 * `:376-387` — o `post_type` pedido tem de ser consultavel publicamente.
 *
 * Duas formas, e as duas sao do legado: em texto, o tipo que nao esta na lista e
 * **descartado** (`unset`, `:382`); em arranjo, a lista e **intersectada**
 * (`:385`), ou seja sobram os que passam e o criterio continua existindo mesmo
 * vazio.
 *
 * ⚠️ Este filtro **nao** roda so fora do painel: diferente do de taxonomia, ele
 * nao tem guarda de `is_admin()`. E assim no legado, e o comentario de `:376`
 * fala de *"publicly queried post_types"* sem qualificar onde.
 *
 * ⚠️ E o criterio e `publicly_queryable`, e nao `is_post_type_viewable()`: um
 * tipo de fabrica publico sem `publicly_queryable` e visivel e **nao** e
 * consultavel. Ver `../consulta/registro-consultavel.ts`.
 */
function filtrarTipoDeConteudoNaoConsultavel(
  criterios: Record<string, ValorDeCriterio>,
  contexto: ContextoDaConsultaResolvido,
): void {
  const pedido = criterios['post_type'];
  if (pedido === undefined) {
    return;
  }
  const consultaveis = tiposConsultaveisPublicamente(contexto.tiposDeConteudo);
  if (typeof pedido === 'string') {
    if (!consultaveis.includes(pedido)) {
      delete criterios['post_type'];
    }
  } else {
    criterios['post_type'] = pedido.filter((nome) => consultaveis.includes(nome));
  }
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
  const contexto = contextoResolvido(entrada.contexto);

  // A ordem de insercao e a da lista publica, depois a da privada, depois
  // `error`: e ela que `WP::build_query_string()` percorre em
  // `wp-includes/class-wp.php:612` para montar `WP::$query_string`, que e
  // argumento de ponto de extensao.
  const criterios: Record<string, ValorDeCriterio> = {};

  // `:313-317` — o mapa de nome de criterio para tipo de conteudo, montado
  // ANTES do laco, com a condicao dupla do legado (visivel e com criterio
  // proprio).
  const tipoPorCriterio = criteriosDeTipoDeConteudo(contexto.tiposDeConteudo);

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

    // `:338` — o bloco de conversao, e o mapeamento de tipo de conteudo que
    // mora DENTRO dele.
    const coletado = criterios[nome];
    if (coletado !== undefined && !vazioComoNoPhp(coletado)) {
      // `:339-347` — a conversao de escalar em texto e inalcancavel sob o tipo
      // de T001. Ver o cabecalho.

      // `:349-352` — o criterio proprio de um tipo de conteudo preenche DOIS
      // criterios: o tipo e o identificador na URL. E e por isso que
      // `?livro=dom-casmurro` e `?post_type=livro&name=dom-casmurro` resolvem
      // para a mesma consulta, que e o CA-1.2 de US-1.
      const tipoDeConteudo = tipoPorCriterio.get(nome);
      if (tipoDeConteudo !== undefined) {
        criterios['post_type'] = tipoDeConteudo;
        criterios['name'] = coletado;
      }
    }
  }

  // `:356-362`.
  desfazerEspacoDeTaxonomia(criterios, contexto);

  // `:364-374`.
  filtrarTaxonomiaNaoConsultavel(criterios, contexto);

  // `:376-387`.
  filtrarTipoDeConteudoNaoConsultavel(criterios, contexto);

  // `:390` — a colisao de identificador numerico com arquivo de data. Devolve
  // um conjunto novo quando houve colisao, porque ela **tira** tres criterios.
  const apos = resolverColisaoDeIdentificadorNumerico(criterios, {
    formaDosEnderecos: contexto.configuracao.formaDosEnderecos,
    conteudoPorCaminho: contexto.conteudoPorCaminho,
  });
  if (apos !== criterios) {
    for (const nome of Object.keys(criterios)) {
      delete criterios[nome];
    }
    Object.assign(criterios, apos);
  }

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
