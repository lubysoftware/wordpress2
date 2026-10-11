/**
 * A analise dos criterios numa consulta de conteudo — `WP_Query::parse_query()`
 * (`wp-includes/class-wp-query.php:811-1165`), que e a quarta referencia ao
 * legado do card REQ-038 e **o arquivo onde CA-1.4 se decide**.
 *
 * Entrega de **T003** (US-1, CA-1.2 e CA-1.4).
 *
 * ---
 *
 * ## A ordem das dezesseis etapas, que e contrato (BR-MIGRAR-106, `EXT-ORDEM`)
 *
 * | # | etapa | legado |
 * |---|---|---|
 * | 1 | preenche os 52 nomes ausentes | `:820` |
 * | 2 | as tres superficies que nao sao conteudo: robots, favicon, mapa do site | `:824-830` |
 * | 3 | normaliza os criterios, e o `p` invalido vira 404 | `:832-890` |
 * | 4 | **o ramo singular**: anexo, identificador, numero, pagina | `:891-900` |
 * | 5 | **o ramo de listagem**: busca, data, termo, autor, arquivo de tipo | `:902-1013` |
 * | 6 | formato e recorte: feed, incorporacao, notificacao, paginado, previa, painel | `:1015-1043` |
 * | 7 | `singular` pela primeira vez | `:1045` |
 * | 8 | feed de comentarios | `:1047-1049` |
 * | 9 | **`inicio`, que e o default quando nada mais casou** | `:1051-1055` |
 * | 10 | a correcao pela pagina da frente | `:1057-1077` |
 * | 11 | o objeto consultado, pelo identificador de pagina na URL | `:1079-1109` |
 * | 12 | a correcao pelo identificador de pagina | `:1111-1121` |
 * | 13 | saneia tipo e estado de conteudo | `:1123-1139` |
 * | 14 | `singular` pela segunda vez | `:1145` |
 * | 15 | o 404 que vem do criterio `error` | `:1148-1150` |
 * | 16 | incorporacao so sobrevive em singular ou em 404 | `:1152` |
 *
 * As etapas 7 e 14 calculam **a mesma coisa duas vezes**, e nao e redundancia: o
 * bloco de correcao das etapas 10 a 12 muda `is_page` e `is_single`, e o proprio
 * legado fecha o trecho com o comentario *"Done correcting `is_*` for
 * 'page_on_front' and 'page_for_posts'"*. Quem calculasse `singular` so no fim
 * quebraria a etapa 9, que o le.
 *
 * ## 🔴 Tres lugares em que a diferenca entre `$this->query` e `$query_vars` decide
 *
 * `parse_query` guarda duas copias: `$this->query`, que e o conjunto **como
 * chegou**, e `$this->query_vars`, que e o conjunto moldado. Tres testes leem a
 * primeira, e um porte que use a segunda muda o resultado:
 *
 * 1. `isset( $this->query['s'] )` (`:904`) — `?s=` com valor vazio **e** uma
 *    busca, porque a chave chegou. Em `$query_vars` o `s` existe sempre, posto
 *    por `fill_query_vars()`, logo o teste seria sempre verdadeiro e **toda**
 *    requisicao seria busca.
 * 2. `wp_parse_args( $this->query )` (`:1059`) — a correcao pela pagina da
 *    frente so vale se a requisicao nao trouxe **nada** alem de quatro nomes, e
 *    `$query_vars` tem 52 chaves.
 * 3. `isset( $_query['pagename'] ) && '' === $_query['pagename']` (`:1061`) — o
 *    comentario do legado explica: *"'pagename' can be set and empty depending
 *    on matched rewrite rules"*, ou seja uma regra de traducao pode produzir
 *    `pagename=` vazio, e isso **nao** conta como criterio.
 *
 * ## O que esta funcao nao faz
 *
 * Nao busca conteudo: quem o faz e `./consultar-conteudo.ts`, com o repositorio.
 * A unica leitura de conteudo daqui e a da etapa 11, `get_page_by_path()`, que o
 * legado faz **dentro** de `parse_query` (`:1080` e `:1085`) e que decide
 * predicado, nao resultado.
 */

import {
  montarConsultaDeTaxonomia,
  SEM_TAXONOMIA,
  TAXONOMIA_DE_CATEGORIA,
  TAXONOMIA_DE_ETIQUETA,
  type ConsultaDeTaxonomia,
} from './consulta-de-taxonomia.js';
import {
  TIPO_DE_CONTEUDO_SIMPLES,
  TIPO_PADRAO_DE_CAMINHO,
  type ConteudoConsultado,
} from './conteudo-consultado.js';
import {
  contextoResolvido,
  FRENTE_COMO_PAGINA,
  type ContextoDaConsulta,
  type ContextoDaConsultaResolvido,
} from './contexto-da-consulta.js';
import {
  normalizarCriterios,
  preencherCriterios,
  sanearTipoEEstado,
  type CriteriosDaConsulta,
  type ValorDaConsulta,
} from './criterios-da-consulta.js';
import {
  dataValidaComoNoPhp,
  diferenteDeVazioComoNoPhp,
  escalarComoNoPhp,
  iguaisComoNoPhp,
  inteiroComoNoPhp,
  vazioComoNoPhp,
} from './semantica-de-php.js';
import {
  marcarNaoEncontrado,
  TIPOS_DE_CONSULTA_ZERADOS,
  type TiposDeConsulta,
} from './tipo-de-consulta.js';

/** O tipo de conteudo que a etapa 11 trata de forma propria (`:1082`). */
const TIPO_DE_ANEXO = 'attachment';

/**
 * Os quatro nomes que **nao** tiram a requisicao da pagina da frente
 * (`:1067`).
 *
 * Sao os de paginacao e previa: pedir a pagina 2 da frente continua sendo a
 * frente.
 */
const NOMES_QUE_NAO_SAEM_DA_FRENTE: readonly string[] = Object.freeze([
  'preview',
  'page',
  'paged',
  'cpage',
]);

/** O que `/^[^%]*%(?:postname)%/` casa em `permalink_structure` (`:1083`). */
const FORMA_QUE_COMECA_PELO_IDENTIFICADOR = /^[^%]*%(?:postname)%/;

/** O marcador que `str_contains( $feed, 'comments-' )` procura (`:1040`). */
const PREFIXO_DE_FEED_DE_COMENTARIOS = 'comments-';

/**
 * O resultado da analise.
 *
 * Os cinco campos sao propriedades publicas de `WP_Query` que extensao de
 * terceiro e tema leem (P8): `$query_vars`, as 30 `is_*`, `$tax_query`,
 * `$queried_object` e `$queried_object_id`.
 */
export interface AnaliseDaConsulta {
  /** `WP_Query::$query_vars`, depois das dezesseis etapas. */
  readonly criterios: CriteriosDaConsulta;
  /** As 30 propriedades `is_*`. */
  readonly tipos: TiposDeConsulta;
  /** `WP_Query::$tax_query`. */
  readonly taxonomia: ConsultaDeTaxonomia;
  /**
   * `WP_Query::$queried_object`, **so** quando a etapa 11 o resolveu.
   *
   * `parse_query` o preenche em um unico caminho, o de `pagename` (`:1080`); nos
   * outros, `get_queried_object()` o resolve sob demanda depois da consulta
   * (`:3988`), e ai ele e do repositorio.
   */
  readonly objetoConsultado?: ConteudoConsultado;
  /** `WP_Query::$queried_object_id`. */
  readonly objetoConsultadoId?: number;
}

/** O que a analise recebe alem dos criterios. */
export interface OpcoesDaAnalise {
  readonly contexto?: ContextoDaConsulta;
  /**
   * O ponto de acao `parse_query` (`class-wp-query.php:1164`).
   *
   * Dispara por ultimo, depois das dezesseis etapas, e nao devolve valor. No
   * legado recebe a instancia por referencia; aqui recebe a analise pronta e
   * congelada, pela mesma razao do ponto `parse_request`.
   */
  readonly aoAnalisar?: readonly ((analise: AnaliseDaConsulta) => void)[];
}

/** Os 30 predicados, na forma mutavel que as dezesseis etapas precisam. */
type TiposMutaveis = { -readonly [chave in keyof TiposDeConsulta]: boolean };

/** Etapa 2 — `:824-830`. A cadeia e `elseif`: so uma das tres liga. */
function marcarSuperficiesQueNaoSaoConteudo(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
): void {
  if (!vazioComoNoPhp(criterios['robots'])) {
    tipos.robots = true;
  } else if (!vazioComoNoPhp(criterios['favicon'])) {
    tipos.favicon = true;
  } else if (!vazioComoNoPhp(criterios['sitemap'])) {
    tipos.mapaDoSite = true;
  }
}

/** Etapa 4 — `:891-900`. A cadeia e `elseif`, e a ordem dela e a precedencia. */
function marcarRamoSingular(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
): boolean {
  // `:891-893` — anexo. O teste do primeiro e `'' !== `, logo `attachment=0`
  // conta; o do segundo e `! empty()`, logo `attachment_id=0` nao conta.
  if (
    String(criterios['attachment'] ?? '') !== '' ||
    !vazioComoNoPhp(criterios['attachment_id'])
  ) {
    tipos.unico = true;
    tipos.anexo = true;
    return true;
  }
  // `:894-895` — identificador na URL.
  if (String(criterios['name'] ?? '') !== '') {
    tipos.unico = true;
    return true;
  }
  // `:896-897` — identificador numerico. Aqui `p` ja e numero, e zero e falso.
  if (!vazioComoNoPhp(criterios['p'])) {
    tipos.unico = true;
    return true;
  }
  // `:898-900` — pagina. Note que o legado **desliga** `is_single` aqui, mesmo
  // sabendo que ele nao foi ligado: e defensivo e esta reproduzido.
  if (
    String(criterios['pagename'] ?? '') !== '' ||
    !vazioComoNoPhp(criterios['page_id'])
  ) {
    tipos.pagina = true;
    tipos.unico = false;
    return true;
  }
  return false;
}

/** Etapa 5, parte de data — `:908-968`. */
function marcarRecorteDeData(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
): void {
  // `:908-921` — os tres de hora, cada um ligando `is_time` e `is_date`. O teste
  // e `'' !== `, e e por isso que `normalizarCriterios` guarda vazio em lugar de
  // zero para os quatro nomes de hora.
  for (const nome of ['second', 'minute', 'hour']) {
    if (criterios[nome] !== '') {
      tipos.hora = true;
      tipos.data = true;
    }
  }

  // `:923-933` — o dia, com a validacao de calendario. O `sprintf` de `:925`
  // monta a data so para entregar ao ponto de extensao `wp_checkdate`
  // (`wp-includes/functions.php:7541`) como `$source_date`: nenhuma decisao do
  // legado le esse texto, e por isso ele nao aparece aqui.
  const dia = criterios['day'];
  if (!vazioComoNoPhp(dia) && !tipos.data) {
    const mes = criterios['monthnum'];
    const ano = criterios['year'];
    if (
      !vazioComoNoPhp(mes) &&
      !vazioComoNoPhp(ano) &&
      !dataValidaComoNoPhp(mes, dia, ano)
    ) {
      criterios['error'] = '404';
    } else {
      tipos.dia = true;
      tipos.data = true;
    }
  }

  // `:935-944` — o mes, com o teto 12. Mes 13 e 404, e nao mes ignorado.
  const mes = criterios['monthnum'];
  if (!vazioComoNoPhp(mes) && !tipos.data) {
    if (escalarComoNoPhp(mes) && inteiroComoNoPhp(mes) > 12) {
      criterios['error'] = '404';
    } else {
      tipos.mes = true;
      tipos.data = true;
    }
  }

  // `:946-951` — o ano.
  if (!vazioComoNoPhp(criterios['year']) && !tipos.data) {
    tipos.ano = true;
    tipos.data = true;
  }

  // `:953-964` — o `m` compacto, decidido pelo **tamanho** do texto: mais de 9
  // digitos e hora, mais de 7 e dia, mais de 5 e mes, o resto e ano. E a unica
  // vez em que o legado liga `is_date` **antes** de olhar se ja estava ligado.
  const compacto = String(criterios['m'] ?? '');
  if (!vazioComoNoPhp(criterios['m'])) {
    tipos.data = true;
    if (compacto.length > 9) {
      tipos.hora = true;
    } else if (compacto.length > 7) {
      tipos.dia = true;
    } else if (compacto.length > 5) {
      tipos.mes = true;
    } else {
      tipos.ano = true;
    }
  }

  // `:966-968` — a semana liga `is_date` e nenhum recorte.
  if (!vazioComoNoPhp(criterios['w'])) {
    tipos.data = true;
  }
}

/** Etapa 5, parte de termo — `:971-991`. */
function marcarRecorteDeTermo(
  taxonomia: ConsultaDeTaxonomia,
  tipos: TiposMutaveis,
): void {
  for (const clausula of taxonomia.clausulas) {
    // `:978` — `isset( $tax_query['operator'] ) && 'NOT IN' !== ...`. O
    // saneamento de `WP_Tax_Query` preenche `operator` em toda clausula de
    // primeira ordem, logo o `isset` e sempre verdadeiro aqui e o que decide e
    // so a exclusao: uma clausula de exclusao **nao** liga predicado.
    if (clausula.operador === 'NOT IN') {
      continue;
    }
    if (clausula.taxonomia === TAXONOMIA_DE_CATEGORIA) {
      tipos.categoria = true;
    } else if (clausula.taxonomia === TAXONOMIA_DE_ETIQUETA) {
      tipos.etiqueta = true;
    } else {
      tipos.taxonomia = true;
    }
  }
}

/** Etapa 5, parte de autor e de arquivo de tipo — `:993-1012`. */
function marcarAutorEArquivoDeTipo(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
  contexto: ContextoDaConsultaResolvido,
): void {
  // `:993-997` — a comparacao e fraca (`'0' == $autor`), logo `'00'` e `'0.0'`
  // tambem desligam o arquivo de autor.
  const autor = criterios['author'];
  const autorVazio =
    vazioComoNoPhp(autor) ||
    (escalarComoNoPhp(autor) && iguaisComoNoPhp('0', autor));
  tipos.autor = !autorVazio;

  // `:999-1001`.
  if (String(criterios['author_name'] ?? '') !== '') {
    tipos.autor = true;
  }

  // `:1003-1008` — so para `post_type` escalar: um arranjo de tipos nao tem
  // pagina de arquivo.
  const tipoDeConteudo = criterios['post_type'];
  if (!vazioComoNoPhp(tipoDeConteudo) && escalarComoNoPhp(tipoDeConteudo)) {
    const nome = String(tipoDeConteudo);
    const registrado = contexto
      .tiposDeConteudo()
      .find((candidato) => candidato.nome === nome);
    if (registrado?.temArquivo === true) {
      tipos.arquivoDeTipoDeConteudo = true;
    }
  }

  // `:1010-1012` — os seis que ligam `is_archive`.
  if (
    tipos.arquivoDeTipoDeConteudo ||
    tipos.data ||
    tipos.autor ||
    tipos.categoria ||
    tipos.etiqueta ||
    tipos.taxonomia
  ) {
    tipos.arquivo = true;
  }
}

/** Etapa 6 — `:1015-1043`. */
function marcarFormatoERecorte(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
  noPainel: boolean,
): void {
  if (diferenteDeVazioComoNoPhp(criterios['feed'])) {
    tipos.feed = true;
  }
  if (diferenteDeVazioComoNoPhp(criterios['embed'])) {
    tipos.incorporacao = true;
  }
  if (diferenteDeVazioComoNoPhp(criterios['tb'])) {
    tipos.notificacaoDeLink = true;
  }
  // `:1027-1029` — paginado e a partir da **segunda** pagina.
  const pagina = criterios['paged'];
  if (
    diferenteDeVazioComoNoPhp(pagina) &&
    escalarComoNoPhp(pagina) &&
    inteiroComoNoPhp(pagina) > 1
  ) {
    tipos.paginado = true;
  }
  if (diferenteDeVazioComoNoPhp(criterios['preview'])) {
    tipos.previa = true;
  }
  if (noPainel) {
    tipos.painel = true;
  }

  // `:1040-1043` — o feed de comentarios chega com prefixo no nome do formato, e
  // o legado o **reescreve**, ligando `withcomments` de tabela.
  const formato = String(criterios['feed'] ?? '');
  if (formato.includes(PREFIXO_DE_FEED_DE_COMENTARIOS)) {
    criterios['feed'] = formato.replaceAll(PREFIXO_DE_FEED_DE_COMENTARIOS, '');
    criterios['withcomments'] = 1;
  }
}

/**
 * Etapa 10 — `:1057-1077`, a correcao pela pagina da frente.
 *
 * Le `$this->query`, o conjunto **como chegou**, e nao os criterios moldados —
 * ver a terceira secao do cabecalho.
 */
function corrigirPelaPaginaDaFrente(
  criteriosOriginais: CriteriosDaConsulta,
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
  contexto: ContextoDaConsultaResolvido,
): void {
  const { configuracao } = contexto;
  if (
    !tipos.inicio ||
    configuracao.mostrarNaFrente !== FRENTE_COMO_PAGINA ||
    configuracao.paginaDaFrente === 0
  ) {
    return;
  }

  const original: Record<string, ValorDaConsulta> = { ...criteriosOriginais } as Record<
    string,
    ValorDaConsulta
  >;
  // `:1061-1063` — `pagename` vazio nao conta, porque uma regra de traducao pode
  // te-lo produzido vazio.
  if ('pagename' in original && original['pagename'] === '') {
    delete original['pagename'];
  }
  // `:1065`.
  delete original['embed'];

  const nomes = Object.keys(original);
  const sobra = nomes.filter(
    (nome) => !NOMES_QUE_NAO_SAEM_DA_FRENTE.includes(nome),
  );
  if (nomes.length > 0 && sobra.length > 0) {
    return;
  }

  // `:1068-1075`.
  tipos.pagina = true;
  tipos.inicio = false;
  criterios['page_id'] = configuracao.paginaDaFrente;
  if (!vazioComoNoPhp(criterios['paged'])) {
    criterios['page'] = criterios['paged'] as ValorDaConsulta;
    delete criterios['paged'];
  }
}

/** O que a etapa 11 resolveu. */
interface ObjetoDaEtapaOnze {
  readonly objeto: ConteudoConsultado | undefined;
  readonly id: number | undefined;
}

/** Etapa 11 — `:1079-1109`, o objeto consultado pelo identificador na URL. */
function resolverObjetoDoIdentificadorDePagina(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
  contexto: ContextoDaConsultaResolvido,
): ObjetoDaEtapaOnze {
  const caminho = String(criterios['pagename'] ?? '');
  if (caminho === '') {
    return { objeto: undefined, id: undefined };
  }

  let objeto = contexto.conteudoPorCaminho(caminho, TIPO_PADRAO_DE_CAMINHO);

  // `:1082-1092` — o caminho casou um anexo, e a forma dos enderecos comeca pelo
  // identificador: procura-se um conteudo simples com o mesmo identificador, e
  // achando, ele **vence** o anexo e a consulta deixa de ser de pagina.
  if (
    objeto !== undefined &&
    objeto.tipo === TIPO_DE_ANEXO &&
    FORMA_QUE_COMECA_PELO_IDENTIFICADOR.test(contexto.configuracao.formaDosEnderecos)
  ) {
    const simples = contexto.conteudoPorCaminho(caminho, TIPO_DE_CONTEUDO_SIMPLES);
    if (simples !== undefined) {
      objeto = simples;
      tipos.pagina = false;
      tipos.unico = true;
    }
  }

  // `:1094-1098` — sem objeto, a propriedade some; ela nao vira zero.
  const id = objeto === undefined ? undefined : objeto.id;

  // `:1100-1104` — a pagina declarada como listagem **nao** e pagina: ela e o
  // inicio, e e so aqui que `is_posts_page` liga.
  const { configuracao } = contexto;
  if (
    configuracao.mostrarNaFrente === FRENTE_COMO_PAGINA &&
    id !== undefined &&
    iguaisComoNoPhp(configuracao.paginaDeConteudos, id)
  ) {
    tipos.pagina = false;
    tipos.inicio = true;
    tipos.paginaDeConteudos = true;
  }

  // `:1106-1108` — a politica de privacidade nao depende de `show_on_front`.
  if (
    id !== undefined &&
    iguaisComoNoPhp(configuracao.paginaDePoliticaDePrivacidade, id)
  ) {
    tipos.politicaDePrivacidade = true;
  }

  return { objeto, id };
}

/** Etapa 12 — `:1111-1121`, a mesma correcao pelo identificador numerico. */
function corrigirPeloIdentificadorDePagina(
  criterios: Record<string, ValorDaConsulta>,
  tipos: TiposMutaveis,
  contexto: ContextoDaConsultaResolvido,
): void {
  const identificador = criterios['page_id'];
  if (vazioComoNoPhp(identificador) || !escalarComoNoPhp(identificador)) {
    return;
  }

  const { configuracao } = contexto;
  if (
    configuracao.mostrarNaFrente === FRENTE_COMO_PAGINA &&
    iguaisComoNoPhp(configuracao.paginaDeConteudos, identificador)
  ) {
    tipos.pagina = false;
    tipos.inicio = true;
    tipos.paginaDeConteudos = true;
  }

  if (iguaisComoNoPhp(configuracao.paginaDePoliticaDePrivacidade, identificador)) {
    tipos.politicaDePrivacidade = true;
  }
}

/**
 * Analisa os criterios numa consulta de conteudo.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-01 e
 * literal — *"nao ha verificacao de capacidade. O portao e o `post_status`"* — e
 * o portao de `post_status` e T009, dentro do repositorio. Quem puser
 * verificacao aqui fecha a cara publica do produto.
 *
 * Os criterios chegam congelados e saem congelados: o molde acontece numa copia,
 * porque no legado `$query_vars` e propriedade de instancia e a instancia morre
 * com a requisicao (BR-MIGRAR-105).
 */
export function analisarConsulta(
  criteriosOriginais: CriteriosDaConsulta,
  opcoes: OpcoesDaAnalise = {},
): AnaliseDaConsulta {
  const contexto = contextoResolvido(opcoes.contexto);

  // Etapa 1 (`:820`).
  const criterios = preencherCriterios(criteriosOriginais);
  const tipos: TiposMutaveis = { ...TIPOS_DE_CONSULTA_ZERADOS };

  // Etapa 2 (`:824-830`).
  marcarSuperficiesQueNaoSaoConteudo(criterios, tipos);

  // Etapa 3 (`:832-890`).
  normalizarCriterios(criterios);

  // Etapa 4 (`:891-900`).
  const singularCasou = marcarRamoSingular(criterios, tipos);

  // Etapa 5 (`:902-1013`) — **so** quando nenhum ramo singular casou.
  let taxonomia: ConsultaDeTaxonomia = SEM_TAXONOMIA;
  if (!singularCasou) {
    // `:904-906` — le o conjunto COMO CHEGOU: `?s=` vazio e busca.
    if ('s' in criteriosOriginais) {
      tipos.busca = true;
    }
    marcarRecorteDeData(criterios, tipos);

    // `:971` — `parse_tax_query` roda aqui, dentro do ramo de listagem, e por
    // isso um endereco singular nao monta clausula de termo nenhuma.
    taxonomia = montarConsultaDeTaxonomia(criterios, {
      taxonomias: contexto.taxonomias,
      // ⚠️ `parse_tax_query` le `$this->is_singular`, e aqui ele ainda esta no
      // valor de `init_query_flags()`: quem o calcula e `:1045`, **depois**.
      // Logo, chamado de `parse_query`, ele e sempre falso — o que faz sentido,
      // porque esta chamada so acontece dentro do ramo de listagem. Derivar
      // `unico || pagina || anexo` aqui daria o mesmo valor e esconderia que o
      // legado le o predicado que ainda nao foi decidido.
      singular: tipos.singular,
      ...(opcoes.contexto?.saneamentoDeIdentificadorDeTermo === undefined
        ? {}
        : {
            saneamentoDeIdentificador:
              opcoes.contexto.saneamentoDeIdentificadorDeTermo,
          }),
    });
    marcarRecorteDeTermo(taxonomia, tipos);
    marcarAutorEArquivoDeTipo(criterios, tipos, contexto);
  }

  // Etapa 6 (`:1015-1043`).
  marcarFormatoERecorte(criterios, tipos, contexto.noPainel);

  // Etapa 7 (`:1045`).
  tipos.singular = tipos.unico || tipos.pagina || tipos.anexo;

  // Etapa 8 (`:1047-1049`) — o feed de comentarios de um conteudo singular e o
  // default: basta nao recusa-lo.
  if (
    tipos.feed &&
    (!vazioComoNoPhp(criterios['withcomments']) ||
      (vazioComoNoPhp(criterios['withoutcomments']) && tipos.singular))
  ) {
    tipos.feedDeComentarios = true;
  }

  // Etapa 9 (`:1051-1055`) — `inicio` e o que **sobra**. E por isso que o
  // conjunto vazio de criterios, que e o que uma instalacao nova produz para
  // `/`, resolve para a listagem inicial e nao para 404.
  if (
    !(
      tipos.singular ||
      tipos.arquivo ||
      tipos.busca ||
      tipos.feed ||
      (contexto.servindoRequisicaoRest && contexto.consultaPrincipal) ||
      tipos.notificacaoDeLink ||
      tipos.naoEncontrado ||
      tipos.painel ||
      tipos.robots ||
      tipos.favicon ||
      tipos.mapaDoSite
    )
  ) {
    tipos.inicio = true;
  }

  // Etapa 10 (`:1057-1077`).
  corrigirPelaPaginaDaFrente(criteriosOriginais, criterios, tipos, contexto);

  // Etapa 11 (`:1079-1109`).
  const objetoDaPagina = resolverObjetoDoIdentificadorDePagina(
    criterios,
    tipos,
    contexto,
  );

  // Etapa 12 (`:1111-1121`).
  corrigirPeloIdentificadorDePagina(criterios, tipos, contexto);

  // Etapa 13 (`:1123-1139`).
  sanearTipoEEstado(criterios);

  // `:1141-1143` — a pagina de listagem sem `withcomments` explicito **desliga**
  // o feed de comentarios que a etapa 8 pode ter ligado.
  if (tipos.paginaDeConteudos && vazioComoNoPhp(criterios['withcomments'])) {
    tipos.feedDeComentarios = false;
  }

  // Etapa 14 (`:1145`).
  tipos.singular = tipos.unico || tipos.pagina || tipos.anexo;

  // Etapa 15 (`:1148-1150`) — o criterio `error` em `'404'` marca a consulta, e
  // e **este** o caminho de 404 que nao passa pelos tres ramos de
  // `handle_404`. A comparacao e fraca no legado (`'404' == $error`).
  let tiposFinais: TiposDeConsulta = tipos;
  const erro = criterios['error'];
  if (erro !== undefined && escalarComoNoPhp(erro) && iguaisComoNoPhp('404', erro)) {
    tiposFinais = marcarNaoEncontrado(tipos);
  }

  // Etapa 16 (`:1152`) — roda DEPOIS do 404, e aceita o 404 como motivo.
  tiposFinais = Object.freeze({
    ...tiposFinais,
    incorporacao:
      tiposFinais.incorporacao &&
      (tiposFinais.singular || tiposFinais.naoEncontrado),
  });

  const analise: AnaliseDaConsulta = Object.freeze({
    criterios: Object.freeze(criterios),
    tipos: tiposFinais,
    taxonomia,
    ...(objetoDaPagina.objeto === undefined
      ? {}
      : { objetoConsultado: objetoDaPagina.objeto }),
    ...(objetoDaPagina.id === undefined ? {} : { objetoConsultadoId: objetoDaPagina.id }),
  });

  // `:1164` — o ponto de acao `parse_query`, por ultimo e sem retorno.
  for (const observador of opcoes.aoAnalisar ?? []) {
    observador(analise);
  }

  return analise;
}
