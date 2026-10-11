/**
 * A parte de taxonomia da consulta — `WP_Query::parse_tax_query()`
 * (`wp-includes/class-wp-query.php:1176-1421`) e o saneamento que
 * `WP_Tax_Query::__construct()` faz em cima dela
 * (`wp-includes/class-wp-tax-query.php:115-197`).
 *
 * Entrega de **T003** (US-1, CA-1.4). Esta aqui porque `parse_query` a chama em
 * `:971`, **dentro** do ramo de arquivo, e porque e o resultado dela que decide
 * tres dos seis predicados que ligam `is_archive`: o laco de `:973-990` le as
 * clausulas e liga `is_category`, `is_tag` ou `is_tax`. Sem ela, um endereco de
 * categoria seria indistinguivel de um endereco sem criterio nenhum — e e
 * exatamente isso que CA-1.4 cobra.
 *
 * ---
 *
 * ## Tres coisas do legado que a ordem deste arquivo preserva
 *
 * 1. **A clausula de `taxonomy` + `term` entra primeiro** (`:1183-1189`), antes
 *    do laco das taxonomias registradas. A ordem das clausulas e observavel: o
 *    laco de `parse_query` para na primeira que ligar o predicado, e o SQL
 *    montado adiante junta as clausulas na ordem em que elas estao.
 * 2. **`post_tag` e pulado no laco** (`:1192-1194`), com o comentario do legado
 *    dizendo por que: *"Handled further down in the `$query_vars['tag']`
 *    block"*. Um porte que o deixasse no laco produziria **duas** clausulas para
 *    a mesma etiqueta.
 * 3. **O bloco de categoria roda so quando a consulta nao e singular**
 *    (`:1243`, `! $this->is_singular`), e o de etiqueta tambem (`:1331`). E por
 *    isso que esta funcao recebe `singular` por argumento: no legado e o estado
 *    da instancia, ja decidido pelo bloco de `:891-900`.
 *
 * ## ⚠️ O que o `+` significa aqui, e por que ele chega do outro lado do modulo
 *
 * No laco das taxonomias registradas, `+` separa termos que tem de valer
 * **todos** — e por isso cada um vira uma clausula propria (`:1215-1224`),
 * enquanto a virgula produz **uma** clausula com todos os termos (`:1229`). E
 * `WP::parse_request()` prepara esse `+`: ele desfaz a decodificacao de URL que
 * transformou `+` em espaco, com `str_replace( ' ', '+', ... )`
 * (`class-wp.php:356-362`), o que esta portado em
 * `../traducao-de-endereco/criterios-diretos.ts`. As duas metades sao uma regra
 * so: sem a de la, `/etiqueta/a+b/` consultaria o termo `a b`.
 *
 * ## 🔴 O saneamento de identificador de termo e ligacao tardia, e e lacuna declarada
 *
 * O legado passa cada identificador por `sanitize_term_field( 'slug', $v, 0,
 * 'post_tag', 'db' )` (`:1336`, `:1343`, `:1347`) ou por
 * `sanitize_title_for_query()` (`:1391`, `:1401`). As duas disparam ponto de
 * extensao — `sanitize_term_field` com contexto `db` dispara `pre_term_slug` e
 * `pre_post_tag_slug` (`wp-includes/taxonomy.php:1846` e `:1849`) —, e P2 poe
 * argumento de ponto de extensao no contrato publico. Reproduzi-las aqui, sem
 * `plataforma/barramento/` e sem BC-02, seria inventar o contrato de outro.
 *
 * Entao elas chegam por {@link SaneamentoDeIdentificadorDeTermo}. **Ausente a
 * ligacao, o identificador e usado como veio** — e isso e divergencia de borda
 * declarada, nao decisao: aparece so em identificador com acento ou com
 * caractere que o saneamento trocaria. E a mesma lacuna que T002 registrou para
 * o `mangling` de `parse_str`, e e caso do oraculo executavel (`ESC-ORACULO`,
 * `BR-MIGRAR-116`).
 */

import {
  codificarValorDeUrl,
  decodificarUrl,
} from '../traducao-de-endereco/cadeia-de-consulta.js';
import type { ValorDaConsulta } from './criterios-da-consulta.js';
import type {
  RegistroDeTaxonomias,
  TaxonomiaConsultavel,
} from './registro-consultavel.js';
import {
  compararComoNoPhp,
  escalarComoNoPhp,
  inteiroAbsoluto,
  inteiroComoNoPhp,
  vazioComoNoPhp,
} from './semantica-de-php.js';

/** A taxonomia que o legado trata fora do laco, no bloco de `tag`. */
export const TAXONOMIA_DE_ETIQUETA = 'post_tag';

/** A taxonomia que o legado trata por nome nos blocos de `cat`. */
export const TAXONOMIA_DE_CATEGORIA = 'category';

/**
 * O operador de uma clausula — os cinco que
 * `wp-includes/class-wp-tax-query.php:108` aceita.
 *
 * Em texto do legado, e nao traduzido: ele vai para o SQL como palavra-chave, e
 * `sanitize_relation` e `get_sql_for_clause` comparam com estes literais.
 */
export type OperadorDeTaxonomia = 'IN' | 'NOT IN' | 'AND' | 'EXISTS' | 'NOT EXISTS';

/** O campo pelo qual os termos sao casados (`class-wp-tax-query.php:105`). */
export type CampoDeTermo = 'term_id' | 'slug' | 'name' | 'term_taxonomy_id';

/**
 * Uma clausula de taxonomia, **depois** do saneamento de
 * `WP_Tax_Query::sanitize_query()` (`class-wp-tax-query.php:136-197`).
 *
 * Os cinco campos sao os cinco `$defaults` de `:139-145`, e o saneamento os
 * preenche **sempre** — e e isso que faz o teste `isset( $tax_query['operator'] )`
 * de `class-wp-query.php:978` valer para toda clausula de primeira ordem.
 *
 * | aqui | legado |
 * |---|---|
 * | `taxonomia` | `taxonomy` |
 * | `termos` | `terms`, sempre arranjo (`:155`) |
 * | `campo` | `field`, default `term_id` |
 * | `operador` | `operator`, default `IN` |
 * | `incluirFilhos` | `include_children`, default `true` |
 */
export interface ClausulaDeTaxonomia {
  readonly taxonomia: string;
  readonly termos: readonly (string | number)[];
  readonly campo: CampoDeTermo;
  readonly operador: OperadorDeTaxonomia;
  readonly incluirFilhos: boolean;
}

/**
 * A consulta de taxonomia montada — o `WP_Query::$tax_query`.
 *
 * `relacao` e o `WP_Tax_Query::$relation`, que `parse_tax_query` nunca informa
 * (ele monta uma lista plana) e que portanto e sempre `AND` por aqui
 * (`class-wp-tax-query.php:119`). Esta declarada porque e propriedade publica
 * que extensao de terceiro le (P8), e porque o criterio `tax_query`, que pode
 * chegar pronto em `:1177`, pode traze-la.
 */
export interface ConsultaDeTaxonomia {
  readonly relacao: 'AND' | 'OR';
  readonly clausulas: readonly ClausulaDeTaxonomia[];
}

/** A consulta de taxonomia de quem nao consultou termo nenhum. */
export const SEM_TAXONOMIA: ConsultaDeTaxonomia = Object.freeze({
  relacao: 'AND' as const,
  clausulas: Object.freeze([]),
});

/**
 * O saneamento de identificador de termo, por ligacao tardia.
 *
 * Recebe o identificador e a taxonomia, e devolve o identificador saneado. Ver a
 * ultima secao do cabecalho deste arquivo: ausente, o valor e usado como veio.
 */
export type SaneamentoDeIdentificadorDeTermo = (
  identificador: string,
  taxonomia: string,
) => string;

/** O que a montagem da consulta de taxonomia recebe alem dos criterios. */
export interface EntradaDaConsultaDeTaxonomia {
  readonly taxonomias: RegistroDeTaxonomias;
  /** `$this->is_singular` — decide os blocos de `:1243` e `:1331`. */
  readonly singular: boolean;
  readonly saneamentoDeIdentificador?: SaneamentoDeIdentificadorDeTermo;
}

/** Os `$defaults` de `WP_Tax_Query::sanitize_query()` (`:139-145`). */
function sanearClausula(parcial: {
  taxonomia?: string;
  termos?: readonly (string | number)[] | string | number;
  campo?: CampoDeTermo;
  operador?: OperadorDeTaxonomia;
  incluirFilhos?: boolean;
}): ClausulaDeTaxonomia {
  const termos = parcial.termos;
  return Object.freeze({
    taxonomia: parcial.taxonomia ?? '',
    // `:155` — `(array) $cleaned_clause['terms']`: escalar vira arranjo de um.
    termos: Object.freeze(
      termos === undefined
        ? []
        : Array.isArray(termos)
          ? [...(termos as readonly (string | number)[])]
          : [termos as string | number],
    ),
    campo: parcial.campo ?? 'term_id',
    operador: parcial.operador ?? 'IN',
    incluirFilhos: parcial.incluirFilhos ?? true,
  });
}

/**
 * `wp_basename( $caminho )` (`wp-includes/formatting.php:5758-5760`).
 *
 * `urldecode( basename( str_replace( array( '%2F', '%5C' ), '/', urlencode(
 * $path ) ) ) )` — o rodeio pela codificacao existe para que a funcao trate
 * caminho com byte que o `basename` do interpretador recortaria errado conforme
 * a localizacao. As duas pontas da codificacao vem de
 * `../traducao-de-endereco/cadeia-de-consulta.ts`, que e onde elas ja estao
 * portadas.
 */
function ultimoSegmentoDoCaminho(caminho: string): string {
  const codificado = codificarValorDeUrl(caminho)
    .replaceAll('%2F', '/')
    .replaceAll('%5C', '/');
  const segmentos = codificado.split('/');
  const ultimo = segmentos[segmentos.length - 1] ?? '';
  return decodificarUrl(ultimo);
}

/** `explode( ',', $x )` com `array_map( 'trim', ... )` (`:1209-1211`). */
function separarPorVirgulaERecortar(valor: string): string[] {
  return valor.split(',').map((parte) => parte.trim());
}

/** `sort()` sem bandeira, com a comparacao regular do interpretador. */
function ordenarComoNoPhp(valores: readonly string[]): string[] {
  return [...valores].sort(compararComoNoPhp);
}

/** `array_map( 'absint', array_unique( (array) $x ) )` com `sort()`. */
function inteirosUnicosOrdenados(valor: ValorDaConsulta): number[] {
  const lista = escalarComoNoPhp(valor) ? [valor] : valor;
  const unicos = [...new Set(lista)];
  return unicos.map(inteiroAbsoluto).sort(compararComoNoPhp);
}

/**
 * O valor de um criterio como texto.
 *
 * 🔴 **Arranjo e juntado com virgula, e no legado ele seguiria como arranjo.** Os
 * dois pontos em que isso aparece sao `taxonomy` e `term` (`:1183-1189`), que no
 * legado entram na clausula como chegaram — um `term` em arranjo produziria
 * `terms => array( array( ... ) )`, que `CriteriosDaConsulta` nao representa.
 * Nenhuma regra de traducao do nucleo produz arranjo nestes dois criterios:
 * `taxonomy=$matches[1]` e `term=$matches[2]` sao sempre texto
 * (`wp-includes/class-wp-rewrite.php:920-922`). A forma com arranjo e caso do
 * oraculo executavel (`ESC-ORACULO`), como as outras tres bordas que T002
 * declarou.
 */
function comoTexto(valor: ValorDaConsulta | undefined): string {
  if (valor === undefined) {
    return '';
  }
  return escalarComoNoPhp(valor) ? String(valor) : valor.join(',');
}

/**
 * O laco das taxonomias registradas — `class-wp-query.php:1191-1234`.
 *
 * Devolve as clausulas e, quando houve reducao ao ultimo segmento do caminho
 * (`:1202-1204`), o valor novo do criterio: no legado `$query_vars` e referencia
 * e a reducao e **gravada de volta**, o que o SQL adiante le.
 */
function clausulasDasTaxonomiasRegistradas(
  criterios: Record<string, ValorDaConsulta>,
  taxonomias: readonly TaxonomiaConsultavel[],
): ClausulaDeTaxonomia[] {
  const clausulas: ClausulaDeTaxonomia[] = [];

  for (const taxonomia of taxonomias) {
    if (taxonomia.nome === TAXONOMIA_DE_ETIQUETA) {
      continue;
    }

    const nomeDoCriterio = taxonomia.criterioProprio;
    if (nomeDoCriterio === '') {
      continue;
    }

    const valor = criterios[nomeDoCriterio];
    if (vazioComoNoPhp(valor) || valor === undefined) {
      continue;
    }

    // `:1202-1204` — so texto, e so em taxonomia hierarquica no endereco.
    let atual = valor;
    if (typeof atual === 'string' && taxonomia.hierarquicaNoEndereco) {
      atual = ultimoSegmentoDoCaminho(atual);
      criterios[nomeDoCriterio] = atual;
    }

    // `:1208-1213` — arranjo vem como esta; texto vira lista por virgula. Os
    // dois sao ordenados e juntados de novo com virgula.
    const partes = escalarComoNoPhp(atual)
      ? separarPorVirgulaERecortar(String(atual))
      : atual.map(String);
    const termo = ordenarComoNoPhp(partes).join(',');

    if (termo.includes('+')) {
      // `:1215-1224` — uma clausula por termo: todos tem de valer.
      for (const parte of termo.split(/[+]+/)) {
        clausulas.push(
          sanearClausula({
            taxonomia: taxonomia.nome,
            campo: 'slug',
            termos: [parte],
          }),
        );
      }
    } else {
      // `:1226-1231` — uma clausula com todos os termos.
      clausulas.push(
        sanearClausula({
          taxonomia: taxonomia.nome,
          campo: 'slug',
          termos: termo.split(/[,]+/),
        }),
      );
    }
  }

  return clausulas;
}

/** O bloco de categoria — `class-wp-query.php:1236-1322`. */
function clausulasDeCategoria(
  criterios: Record<string, ValorDaConsulta>,
  singular: boolean,
): ClausulaDeTaxonomia[] {
  const clausulas: ClausulaDeTaxonomia[] = [];

  // `:1237-1239` — arranjo de `cat` vira texto com virgula.
  const cat = criterios['cat'];
  if (cat !== undefined && !escalarComoNoPhp(cat)) {
    criterios['cat'] = cat.join(',');
  }

  // `:1243-1279`.
  if (!vazioComoNoPhp(criterios['cat']) && !singular) {
    // `:1247-1250` — o `urldecode` aqui e do legado, e vem **depois** do
    // `preg_replace` de `:846`: um `%2C` ja foi descartado la, logo este
    // `urldecode` so tem efeito sobre valor que nao passou por `parse_request`.
    const lista = decodificarUrl(comoTexto(criterios['cat']))
      .split(/[,\s]+/)
      .map((parte) => inteiroComoNoPhp(parte))
      .sort((a, b) => a - b);
    criterios['cat'] = lista.join(',');

    const dentro = lista.filter((valor) => valor > 0);
    const fora = lista.filter((valor) => valor < 0).map(Math.abs);

    if (dentro.length > 0) {
      clausulas.push(
        sanearClausula({
          taxonomia: TAXONOMIA_DE_CATEGORIA,
          termos: dentro,
          campo: 'term_id',
          incluirFilhos: true,
        }),
      );
    }
    if (fora.length > 0) {
      clausulas.push(
        sanearClausula({
          taxonomia: TAXONOMIA_DE_CATEGORIA,
          termos: fora,
          campo: 'term_id',
          operador: 'NOT IN',
          incluirFilhos: true,
        }),
      );
    }
  }

  // `:1281-1288` — um `category__and` de UM elemento e dobrado em
  // `category__in`, porque "e" com um termo so e "em".
  const categoriaE = criterios['category__and'];
  if (!vazioComoNoPhp(categoriaE) && categoriaE !== undefined) {
    const lista = escalarComoNoPhp(categoriaE) ? [categoriaE] : categoriaE;
    if (lista.length === 1) {
      const dentro = criterios['category__in'];
      const acumulado = dentro === undefined || escalarComoNoPhp(dentro) ? [] : [...dentro];
      acumulado.push(inteiroAbsoluto(lista[0] as string | number));
      criterios['category__in'] = acumulado;
      delete criterios['category__and'];
    }
  }

  // `:1290-1299`.
  const dentro = criterios['category__in'];
  if (!vazioComoNoPhp(dentro) && dentro !== undefined) {
    const lista = inteirosUnicosOrdenados(dentro);
    criterios['category__in'] = lista;
    clausulas.push(
      sanearClausula({
        taxonomia: TAXONOMIA_DE_CATEGORIA,
        termos: lista,
        campo: 'term_id',
        incluirFilhos: false,
      }),
    );
  }

  // `:1301-1310` — ⚠️ esta clausula **nao** declara `field`, logo ela fica com o
  // default `term_id` do saneamento. E assim no legado.
  const fora = criterios['category__not_in'];
  if (!vazioComoNoPhp(fora) && fora !== undefined) {
    const lista = inteirosUnicosOrdenados(fora);
    criterios['category__not_in'] = lista;
    clausulas.push(
      sanearClausula({
        taxonomia: TAXONOMIA_DE_CATEGORIA,
        termos: lista,
        operador: 'NOT IN',
        incluirFilhos: false,
      }),
    );
  }

  // `:1312-1322` — o que sobrou de `category__and`, com mais de um elemento.
  const restanteE = criterios['category__and'];
  if (!vazioComoNoPhp(restanteE) && restanteE !== undefined) {
    const lista = inteirosUnicosOrdenados(restanteE);
    criterios['category__and'] = lista;
    clausulas.push(
      sanearClausula({
        taxonomia: TAXONOMIA_DE_CATEGORIA,
        termos: lista,
        campo: 'term_id',
        operador: 'AND',
        incluirFilhos: false,
      }),
    );
  }

  return clausulas;
}

/** O bloco de etiqueta — `class-wp-query.php:1324-1409`. */
function clausulasDeEtiqueta(
  criterios: Record<string, ValorDaConsulta>,
  singular: boolean,
  sanear: SaneamentoDeIdentificadorDeTermo,
): ClausulaDeTaxonomia[] {
  const clausulas: ClausulaDeTaxonomia[] = [];

  // `:1325-1327`.
  const etiqueta = criterios['tag'];
  if (etiqueta !== undefined && !escalarComoNoPhp(etiqueta)) {
    criterios['tag'] = etiqueta.join(',');
  }

  // `:1331-1351` — o terceiro termo da condicao e `$this->query_vars_changed`,
  // que `parse_query` liga em `:822` e so desliga em `:1155`: dentro de
  // `parse_query` ele e sempre verdadeiro, e por isso nao e argumento aqui.
  const valor = comoTexto(criterios['tag']);
  if (valor !== '' && !singular) {
    if (valor.includes(',')) {
      // `:1332-1339` — virgula e "qualquer um destes".
      const acumulado = [...listaDeTexto(criterios['tag_slug__in'])];
      for (const parte of valor.split(/[,\r\n\t ]+/)) {
        acumulado.push(sanear(parte, TAXONOMIA_DE_ETIQUETA));
      }
      criterios['tag_slug__in'] = ordenarComoNoPhp(acumulado);
    } else if (/[+\r\n\t ]+/.test(valor) || !vazioComoNoPhp(criterios['cat'])) {
      // `:1340-1345` — `+`, espaco em branco, **ou** a presenca de `cat`:
      // "todos estes". A terceira condicao e a que surpreende, e e do legado.
      const acumulado = [...listaDeTexto(criterios['tag_slug__and'])];
      for (const parte of valor.split(/[+\r\n\t ]+/)) {
        acumulado.push(sanear(parte, TAXONOMIA_DE_ETIQUETA));
      }
      criterios['tag_slug__and'] = acumulado;
    } else {
      // `:1346-1350` — um termo so.
      const saneado = sanear(valor, TAXONOMIA_DE_ETIQUETA);
      criterios['tag'] = saneado;
      criterios['tag_slug__in'] = ordenarComoNoPhp([
        ...listaDeTexto(criterios['tag_slug__in']),
        saneado,
      ]);
    }
  }

  // `:1353-1359` — ⚠️ sem `field`, logo `term_id`.
  //
  // 🔴 O escalar e exigido aqui e o legado nao o exige: `absint( array )` e erro
  // de tipo no interpretador da versao 8, ou seja a requisicao **morre**. Este
  // porte salta a clausula em lugar de derrubar a requisicao, e a divergencia
  // esta declarada no README do modulo: nenhuma regra de traducao do nucleo
  // produz `tag_id` em arranjo, e so `?tag_id[]=` chega assim.
  const identificador = criterios['tag_id'];
  if (
    !vazioComoNoPhp(identificador) &&
    identificador !== undefined &&
    escalarComoNoPhp(identificador)
  ) {
    const inteiro = inteiroAbsoluto(identificador);
    criterios['tag_id'] = inteiro;
    clausulas.push(
      sanearClausula({ taxonomia: TAXONOMIA_DE_ETIQUETA, termos: inteiro }),
    );
  }

  // `:1361-1388` — os tres por identificador, todos sem `field`.
  for (const [nome, operador] of [
    ['tag__in', undefined],
    ['tag__not_in', 'NOT IN'],
    ['tag__and', 'AND'],
  ] as const) {
    const bruto = criterios[nome];
    if (vazioComoNoPhp(bruto) || bruto === undefined) {
      continue;
    }
    const lista = inteirosUnicosOrdenados(bruto);
    criterios[nome] = lista;
    clausulas.push(
      sanearClausula({
        taxonomia: TAXONOMIA_DE_ETIQUETA,
        termos: lista,
        ...(operador === undefined ? {} : { operador }),
      }),
    );
  }

  // `:1390-1409` — os dois por identificador na URL, com `field` declarado.
  for (const [nome, operador] of [
    ['tag_slug__in', undefined],
    ['tag_slug__and', 'AND'],
  ] as const) {
    const bruto = criterios[nome];
    if (vazioComoNoPhp(bruto) || bruto === undefined) {
      continue;
    }
    const unicos = [...new Set(listaDeTexto(bruto))].map((parte) =>
      sanear(parte, TAXONOMIA_DE_ETIQUETA),
    );
    const lista = ordenarComoNoPhp(unicos);
    criterios[nome] = lista;
    clausulas.push(
      sanearClausula({
        taxonomia: TAXONOMIA_DE_ETIQUETA,
        termos: lista,
        campo: 'slug',
        ...(operador === undefined ? {} : { operador }),
      }),
    );
  }

  return clausulas;
}

/** O valor de um criterio como lista de texto, para os acumuladores de etiqueta. */
function listaDeTexto(valor: ValorDaConsulta | undefined): readonly string[] {
  if (valor === undefined) {
    return [];
  }
  return escalarComoNoPhp(valor) ? [String(valor)] : valor.map(String);
}

/**
 * Monta a consulta de taxonomia a partir dos criterios —
 * `WP_Query::parse_tax_query()` (`class-wp-query.php:1176-1421`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4), como as outras
 * operacoes desta feature: UC-01 nao verifica capacidade nenhuma, e a
 * visibilidade de taxonomia nao e capacidade — ela e o filtro de
 * `class-wp.php:364-374`, portado em `../traducao-de-endereco/criterios-diretos.ts`.
 *
 * Os criterios chegam como `Record` mutavel porque no legado `$query_vars` e
 * **referencia** (`:1174`, `&$query_vars`) e seis blocos gravam de volta nele.
 * Um porte que copiasse o arranjo perderia a reducao de caminho de `:1203`, a
 * reordenacao de `cat` de `:1250` e os cinco acumuladores de etiqueta.
 *
 * O ponto de acao `parse_tax_query` (`:1420`) nao dispara aqui: ele e disparado
 * por quem chama, como os outros pontos deste modulo.
 */
export function montarConsultaDeTaxonomia(
  criterios: Record<string, ValorDaConsulta>,
  entrada: EntradaDaConsultaDeTaxonomia,
): ConsultaDeTaxonomia {
  const sanear =
    entrada.saneamentoDeIdentificador ?? ((identificador: string) => identificador);

  const clausulas: ClausulaDeTaxonomia[] = [];

  // `:1177-1181` — o criterio `tax_query`, quando ele chegou pronto, seria a
  // semente desta lista, e esta posicao e a dele.
  //
  // 🔴 Lacuna declarada: clausula e arranjo de arranjo, e `ValorDaConsulta` —
  // escalar ou lista de escalar — nao a representa. Nenhum caminho de leitura
  // publica a produz: `tax_query` nao e nome publico nem privado de criterio
  // (`class-wp.php:18` e `:28`), logo nao chega pela rede, e quem o informa e
  // `WP_Query` chamado por dentro com arranjo nativo. Alargar o tipo e de quem
  // tiver esse chamador, e e a mesma razao pela qual T002 deixou a chave nomeada
  // de fora de `CriteriosDeConsulta`.

  // `:1183-1189` — a clausula de `taxonomy` + `term`, antes do laco.
  const taxonomia = criterios['taxonomy'];
  const termo = criterios['term'];
  if (
    !vazioComoNoPhp(taxonomia) &&
    !vazioComoNoPhp(termo) &&
    taxonomia !== undefined &&
    termo !== undefined
  ) {
    clausulas.push(
      sanearClausula({
        taxonomia: comoTexto(taxonomia),
        termos: [comoTexto(termo)],
        campo: 'slug',
      }),
    );
  }

  clausulas.push(
    ...clausulasDasTaxonomiasRegistradas(criterios, entrada.taxonomias()),
  );
  clausulas.push(...clausulasDeCategoria(criterios, entrada.singular));
  clausulas.push(...clausulasDeEtiqueta(criterios, entrada.singular, sanear));

  // `:1411` — `new WP_Tax_Query( $tax_query )`, que nao recebe `relation`.
  return Object.freeze({
    relacao: 'AND' as const,
    clausulas: Object.freeze(clausulas),
  });
}
