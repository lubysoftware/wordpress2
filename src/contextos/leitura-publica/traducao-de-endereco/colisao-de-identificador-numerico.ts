/**
 * A colisao entre identificador numerico e arquivo de data —
 * `wp_resolve_numeric_slug_conflicts()` (`wp-includes/rewrite.php:381-475`), que
 * `WP::parse_request()` chama em `wp-includes/class-wp.php:390`.
 *
 * Entrega de **T003** (US-1, CA-1.1): e a ultima das quatro coisas que T002
 * nomeou como pendentes na coleta de criterios, e a unica delas que mora em
 * arquivo proprio, porque no legado tambem e funcao propria e nao trecho de
 * `parse_request`.
 *
 * ---
 *
 * ## O problema, com o exemplo do proprio legado
 *
 * O comentario de `:363-365` e o melhor resumo: *"Permalinks of posts with
 * numeric slugs can sometimes look to WP_Query::parse_query() like a date
 * archive, as when your permalink structure is `/%year%/%postname%/` and a post
 * with post_name '05' has the URL `/2015/05/`"*. A regra de traducao casou
 * `year=2015` e `monthnum=05`, e os dois sao numeros validos — so que `05` era o
 * identificador do conteudo, nao o mes.
 *
 * Esta funcao **resolve a favor do conteudo**, e e a unica coisa em
 * `parse_request` que procura conteudo no banco. O legado explica por que ela
 * existe apesar de `wp_unique_post_slug()` ja prevenir o caso: *"The resolution
 * performed in this function is primarily for legacy content, as well as cases
 * when the admin has changed the site's permalink structure"* (`:370-373`) — ou
 * seja ela e P8 em estado puro, e sai do escopo deste porte so por decisao
 * humana.
 *
 * ## As quatro saidas sem efeito, e a ordem delas
 *
 * | # | sai quando | legado |
 * |---|---|---|
 * | 1 | nenhum dos tres criterios de data chegou | `:382-384` |
 * | 2 | a forma dos enderecos nao tem `%postname%` | `:388-392` |
 * | 3 | a posicao do identificador na forma nao cria colisao | `:400-411` |
 * | 4 | nao existe conteudo com aquele identificador | `:419-422` |
 *
 * E mais tres depois de achar o conteudo: a data do conteudo nao bate com a do
 * endereco (`:425-435`), o conteudo nao tem paginacao interna mas o endereco
 * pedia pagina (`:453-455`), e a pagina pedida passa do que o corpo tem
 * (`:458-460`).
 *
 * ⚠️ **O teste de posicao e `isset`, nao `! empty`.** `:401`, `:403` e `:405`
 * perguntam se a **chave existe** nos criterios, e o endereco `/2015/0/` produz
 * `monthnum=0`, que existe. Trocar por `! empty()` deixaria a colisao sem
 * resolver para todo identificador que o interpretador considera vazio — e `'0'`
 * e um identificador que `wp_unique_post_slug()` nunca impediu de existir.
 *
 * ## 🔴 Uma divergencia de tipo, declarada
 *
 * `:463` grava `$query_vars['page'] = $maybe_page`, que e **inteiro**, e
 * `ValorDeCriterio` — como T001 o declarou — e texto ou lista de texto. Aqui o
 * valor e gravado como texto. As tres leituras de `page` no nucleo convertem
 * antes de comparar (`(int) trim( $page, '/' )` em `class-wp.php:766-767`, e
 * `absint()` em `class-wp-query.php`), logo nenhuma decisao muda; o que muda e o
 * tipo do global que `WP::register_globals()` publica para o tema
 * (`class-wp.php:667`). E a mesma fronteira que T002 declarou para a chave
 * nomeada de `parse_str`, e alargar `ValorDeCriterio` e mudanca de contrato
 * mesclado — decisao de quem tiver o chamador que precise dela.
 */

import {
  MARCADOR_DE_PAGINA_NO_CORPO,
  TIPO_DE_CONTEUDO_SIMPLES,
  type ConteudoPorCaminho,
} from '../consulta/conteudo-consultado.js';
import type { CriteriosDeConsulta } from '../requisicao/endereco-pedido.js';
import { vazioNoLegado } from './casar-endereco.js';

/** O marcador de identificador na forma dos enderecos (`rewrite.php:388`). */
const MARCA_DO_IDENTIFICADOR = '%postname%';

/** O marcador de ano na forma dos enderecos (`rewrite.php:403`). */
const MARCA_DO_ANO = '%year%';

/** O marcador de mes na forma dos enderecos (`rewrite.php:405`). */
const MARCA_DO_MES = '%monthnum%';

/** Os tres criterios de data que podem colidir com um identificador. */
const CRITERIOS_DE_DATA: readonly string[] = Object.freeze([
  'year',
  'monthnum',
  'day',
]);

/** O que `preg_match( '/^([0-9]{4})\-([0-9]{2})/', $post->post_date )` casa. */
const ANO_E_MES_DA_DATA = /^([0-9]{4})-([0-9]{2})/;

/** O que esta resolucao precisa de fora. */
export interface EntradaDaColisaoDeIdentificador {
  /** `get_option( 'permalink_structure' )` (`rewrite.php:387`). */
  readonly formaDosEnderecos: string;
  /** `get_page_by_path( $valor, OBJECT, 'post' )` (`rewrite.php:419`). */
  readonly conteudoPorCaminho: ConteudoPorCaminho;
}

/** `(int)` do interpretador sobre o prefixo numerico de um texto. */
function inteiroDoPrefixo(texto: string): number {
  const achado = /^[+-]?[0-9]+/.exec(texto);
  return achado === null ? 0 : Number.parseInt(achado[0], 10);
}

/** O valor de um criterio como texto, para esta resolucao. */
function textoDoCriterio(valor: CriteriosDeConsulta[string]): string {
  if (valor === undefined) {
    return '';
  }
  return typeof valor === 'string' ? valor : (valor[0] ?? '');
}

/** `substr_count( $corpo, '<!--nextpage-->' ) + 1` (`rewrite.php:450`). */
function paginasNoCorpo(corpo: string): number {
  return corpo.split(MARCADOR_DE_PAGINA_NO_CORPO).length;
}

/**
 * Resolve a colisao, devolvendo os criterios **novos** quando houve colisao e os
 * mesmos criterios quando nao houve.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4): e a mesma
 * declaracao das outras operacoes desta feature. ⚠️ Esta funcao **le conteudo
 * sem olhar estado**, e e assim no legado — `get_page_by_path()` com o terceiro
 * argumento `'post'` nao filtra por `post_status`. O portao de `post_status`
 * (T009) age na consulta principal, nao aqui: um rascunho com identificador
 * numerico **resolve** a colisao a favor dele e a consulta seguinte e que nao o
 * devolve. Confundir as duas coisas trocaria o endereco que a listagem de data
 * responde.
 */
export function resolverColisaoDeIdentificadorNumerico(
  criterios: CriteriosDeConsulta,
  entrada: EntradaDaColisaoDeIdentificador,
): CriteriosDeConsulta {
  // `:382-384` — saida 1.
  if (!CRITERIOS_DE_DATA.some((nome) => criterios[nome] !== undefined)) {
    return criterios;
  }

  // `:387-392` — saida 2. `array_filter` sem callback tira o segmento vazio
  // **e** o segmento `'0'`, que e o `empty()` do interpretador.
  const marcas = entrada.formaDosEnderecos
    .split('/')
    .filter((segmento) => !vazioNoLegado(segmento));
  const posicao = marcas.indexOf(MARCA_DO_IDENTIFICADOR);
  if (posicao === -1) {
    return criterios;
  }

  // `:400-411` — saida 3. As tres condicoes sao `isset`, e a segunda e a
  // terceira exigem `$postname_index` **truthy**, ou seja a posicao zero cai so
  // na primeira.
  const anterior = posicao > 0 ? marcas[posicao - 1] : undefined;
  let comparar = '';
  if (
    posicao === 0 &&
    (criterios['year'] !== undefined || criterios['monthnum'] !== undefined)
  ) {
    comparar = 'year';
  } else if (
    posicao > 0 &&
    anterior === MARCA_DO_ANO &&
    (criterios['monthnum'] !== undefined || criterios['day'] !== undefined)
  ) {
    comparar = 'monthnum';
  } else if (
    posicao > 0 &&
    anterior === MARCA_DO_MES &&
    criterios['day'] !== undefined
  ) {
    comparar = 'day';
  }
  if (comparar === '') {
    return criterios;
  }

  // `:413-422` — saida 4. O valor e o do criterio que colide, ou texto vazio.
  const valor = textoDoCriterio(criterios[comparar]);
  const conteudo = entrada.conteudoPorCaminho(valor, TIPO_DE_CONTEUDO_SIMPLES);
  if (conteudo === undefined) {
    return criterios;
  }

  // `:425-435` — a data do conteudo tem de bater com a do endereco. O `preg_match`
  // so e consultado quando a data do conteudo esta no formato do banco: data
  // sentinela (`0000-00-00 00:00:00`) casa `0000-00` e segue para a comparacao.
  const daData = ANO_E_MES_DA_DATA.exec(conteudo.data);
  if (
    daData !== null &&
    criterios['year'] !== undefined &&
    (comparar === 'monthnum' || comparar === 'day')
  ) {
    if (
      inteiroDoPrefixo(textoDoCriterio(criterios['year'])) !==
      Number.parseInt(daData[1] as string, 10)
    ) {
      return criterios;
    }
    if (
      comparar === 'day' &&
      criterios['monthnum'] !== undefined &&
      inteiroDoPrefixo(textoDoCriterio(criterios['monthnum'])) !==
        Number.parseInt(daData[2] as string, 10)
    ) {
      return criterios;
    }
  }

  // `:441-448` — o segmento seguinte ao identificador pode ser a pagina interna.
  let candidataDePagina = '';
  if (comparar === 'year' && criterios['monthnum'] !== undefined) {
    candidataDePagina = textoDoCriterio(criterios['monthnum']);
  } else if (comparar === 'monthnum' && criterios['day'] !== undefined) {
    candidataDePagina = textoDoCriterio(criterios['day']);
  }
  // `:448` — o comentario do legado nomeia o defeito que esse `trim` fechou:
  // *"Bug found in #11694 - 'page' was returning '/4'"*.
  const pagina = inteiroDoPrefixo(
    candidataDePagina.replace(/^\/+/, '').replace(/\/+$/, ''),
  );

  // `:450-460` — as duas saidas por paginacao de corpo.
  const paginas = paginasNoCorpo(conteudo.corpo);
  if (paginas === 1 && pagina !== 0) {
    return criterios;
  }
  if (paginas > 1 && pagina > paginas) {
    return criterios;
  }

  // `:462-474` — houve colisao: a pagina interna entra, os tres criterios de
  // data saem e o identificador do conteudo entra.
  const resolvidos: Record<string, CriteriosDeConsulta[string]> = {
    ...criterios,
  };
  resolvidos['page'] = String(pagina);
  for (const nome of CRITERIOS_DE_DATA) {
    delete resolvidos[nome];
  }
  resolvidos['name'] = conteudo.identificadorNaUrl;

  return resolvidos;
}
