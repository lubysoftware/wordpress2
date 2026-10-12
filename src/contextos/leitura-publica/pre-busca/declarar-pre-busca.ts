/**
 * A montagem e a saida da pre-busca: `wp_get_speculation_rules()`
 * (`wp-includes/speculative-loading.php:195-320`) e
 * `wp_print_speculation_rules()` (`:330-343`), que e a ancora que a `spec.md`
 * desta feature registra para US-7.
 *
 * Entrega de **T015** (US-7), e e aqui que os tres criterios de aceite fecham:
 *
 * | criterio | o que o afirma, e onde |
 * |---|---|
 * | CA-7.1 | a regra `main` declara o conjunto de destinos (`href_matches`) e a agressividade (`eagerness`) — {@link regrasDePreBusca} |
 * | CA-7.2 | os oito padroes de {@link caminhosExcluidosDaPreBusca}, mais os dois seletores de opt-out e o `rel=nofollow` |
 * | CA-7.3 | configuracao ausente e **nada impresso** — {@link declararPreBusca} com `emitida` falso |
 *
 * ---
 *
 * ## CA-7.2 ponto por ponto: o que fica fora, e por que cada coisa
 *
 * O criterio pede tres grupos — *"enderecos de administracao, de saida de
 * sessao e de acao com efeito"* —, e o legado os cobre por **quatro**
 * mecanismos diferentes, nao um:
 *
 * | o que o criterio pede | como o legado o tira | legado |
 * |---|---|---|
 * | administracao | o padrao `/wp-admin/*` no contexto `site` | `:208` |
 * | saida de sessao | o padrao `/wp-*.php` no contexto `site`, que pega `wp-login.php` — e a saida de sessao do legado e `wp-login.php?action=logout` | `:207` |
 * | acao com efeito, por endereco | a exclusao de consulta: **toda** consulta com enderecos amigaveis (`:222`), ou so a que contenha `nonce` sem eles (`:224`) | `:216-225` |
 * | acao com efeito, por marcacao | `a[rel~="nofollow"]`, mais `.no-{modo}` e `.no-{modo} a` | `:275-286` |
 *
 * ⚠️ **O `rel=nofollow` esta reinterpretado, e o comentario do legado assume
 * isso:** *"Also exclude rel=nofollow links, as certain plugins use that on
 * their links that perform an action"* (`:275`). O atributo significa "nao
 * transfira autoridade de link" para buscador, e aqui vale como "nao especule".
 * A analise que veio com o pacote marca o custo em 🟡 — um link
 * legitimamente `nofollow`, um patrocinado por exemplo, perde a pre-busca sem
 * que ninguem tenha pedido. **E regra do produto, nao defeito a corrigir** (P1).
 *
 * ⚠️ **O filtro nao consegue remover os oito.** Tres garantias, com os tres
 * comentarios numerados do legado em `:244-247`: `array_merge` poe as base
 * **primeiro**, `array_unique` nao deixa duplicar e `array_values` reindexa. E
 * o docblock do filtro avisa: *"WordPress always excludes certain path patterns
 * such as `/wp-login.php` and `/wp-admin/*`, and those cannot be modified using
 * the filter"* (`:233-234`). Portanto um interceptador que devolva lista vazia
 * **nao** abre a administracao para pre-busca.
 *
 * ## Onde este porte para, e por que para ali
 *
 * `wp_print_speculation_rules()` tem tres linhas de corpo (`:331-342`): pega as
 * regras, desiste se forem nulas, e **delega**. O que ela delega nao e desta
 * feature:
 *
 * | o que | legado | de quem e |
 * |---|---|---|
 * | `wp_json_encode( $regras, JSON_HEX_TAG \| JSON_UNESCAPED_SLASHES )` | `functions.php:4443` | `plataforma/`: tem limite de profundidade proprio e um saneamento de texto invalido (`_wp_json_sanity_check`) |
 * | `wp_print_inline_script_tag( $json, array( 'type' => ... ) )` | `script-loader.php:3079` e `:3021` | a borda de saida, com o filtro `wp_inline_script_attributes` e o `WP_HTML_Tag_Processor` |
 * | a posicao na pagina | `default-filters.php:367` — `add_action( 'wp_footer', ... )` | `plataforma/barramento/`, que nao existe nesta arvore |
 *
 * E a mesma fronteira que T005 declarou para o portao de inclusao de modelo, e
 * a mesma que o README do modulo declarou para `wp_get_nocache_headers()` —
 * *"`RespostaDaLeitura.semCache` so registra que o legado os manda; os valores
 * nao sao deste contexto"*. {@link DeclaracaoDaPreBusca} entrega a borda o que
 * ela precisa e **nada mais**: o valor a codificar, as duas bandeiras por nome,
 * o atributo do elemento, e o gancho com a prioridade em que isso acontece.
 */

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import {
  configuracaoDaPreBusca,
  type IntercepcaoDaConfiguracao,
  type ModoDePreBusca,
} from './configuracao-da-pre-busca.js';
import {
  contextoDaPreBuscaResolvido,
  type ContextoDaPreBusca,
} from './contexto-da-pre-busca.js';
import {
  contextosPadraoDoPrefixador,
  prefixarPadrao,
  type ContextoDePadrao,
  type ContextosDoPrefixador,
} from './padrao-de-endereco.js';
import {
  criarConjuntoDeRegrasDePreBusca,
  type CondicaoDeRegra,
  type ConjuntoDeRegrasDePreBusca,
  type RecusaDeRegra,
  type RegrasParaJson,
} from './regras-de-pre-busca.js';

/** Um dos sete pares de `$base_href_exclude_paths` (`:206-214`). */
export interface ExclusaoDeFabrica {
  /** O padrao, como o legado o escreve. */
  readonly padrao: string;
  /** O contexto com que ele e prefixado. */
  readonly contexto: ContextoDePadrao;
}

/**
 * As sete exclusoes de fabrica, **como dado** e na ordem de `:206-214`.
 *
 * A ordem chega ao navegador: `href_exclude_paths` e uma lista, e nada a
 * reordena. Declara-las como dado e o que torna CA-7.2 inspecionavel sem
 * executar a montagem — e e a mesma escolha de T002 para a tabela de regras de
 * traducao de endereco.
 */
export const EXCLUSOES_DE_FABRICA: readonly ExclusaoDeFabrica[] = Object.freeze(
  [
    Object.freeze({ padrao: '/wp-*.php', contexto: 'site' as const }),
    Object.freeze({ padrao: '/wp-admin/*', contexto: 'site' as const }),
    Object.freeze({ padrao: '/*', contexto: 'uploads' as const }),
    Object.freeze({ padrao: '/*', contexto: 'content' as const }),
    Object.freeze({ padrao: '/*', contexto: 'plugins' as const }),
    Object.freeze({ padrao: '/*', contexto: 'template' as const }),
    Object.freeze({ padrao: '/*', contexto: 'stylesheet' as const }),
  ],
);

/**
 * A oitava exclusao quando os enderecos amigaveis estao ligados (`:222`):
 * **qualquer** endereco com consulta.
 *
 * O comentario do legado da a razao: *"If pretty permalinks are enabled,
 * exclude any URLs with query parameters"* (`:217`). Num endereco amigavel, a
 * consulta sinaliza acao ou filtro.
 */
export const EXCLUSAO_DE_CONSULTA_COM_ENDERECO_AMIGAVEL = '/*\\?(.+)';

/**
 * A oitava exclusao quando eles estao desligados (`:224`): so o endereco cuja
 * consulta contenha a palavra `nonce`.
 *
 * *"Otherwise, exclude specifically the URLs with a `_wpnonce` query parameter
 * or any other query parameter containing the word `nonce`"* (`:218-219`).
 * Excluir toda consulta ali desligaria a pre-busca por completo, porque sem
 * enderecos amigaveis **todo** endereco tem consulta.
 *
 * ⚠️ **Casa por subcadeia, e a analise registra o custo:** um parametro chamado
 * `announce` ou `pronounce` tambem casa. Exclui a mais, nao a menos.
 *
 * 🔴 **E este ramo nao e alcancavel na instalacao de fabrica**: sem enderecos
 * amigaveis a configuracao e ausente e a montagem nem comeca. Ele so roda
 * quando um interceptador forca a configuracao — ver
 * `./configuracao-da-pre-busca.ts`.
 */
export const EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL =
  '/*\\?*(^|&)*nonce*=*';

/** O padrao que **inclui** tudo no mesmo site (`:267`). */
export const PADRAO_DO_PROPRIO_SITE = '/*';

/**
 * O seletor dos links que a marcacao tira da pre-busca (`:278`).
 *
 * Ver a nota ⚠️ do cabecalho: o atributo esta reinterpretado de proposito.
 */
export const SELETOR_SEM_SEGUIR = 'a[rel~="nofollow"]';

/** O identificador da regra que o nucleo acrescenta (`:300`). */
export const IDENTIFICADOR_DA_REGRA_DO_NUCLEO = 'main';

/** `'document'` — a fonte da regra do nucleo (`:302`). */
export const FONTE_DA_REGRA_DO_NUCLEO = 'document';

/**
 * O gancho em que a declaracao e impressa, com a prioridade
 * (`wp-includes/default-filters.php:367`:
 * `add_action( 'wp_footer', 'wp_print_speculation_rules' )`).
 *
 * Declarado aqui, no arquivo que o emitiria, porque `plataforma/barramento/`
 * nao existe nesta arvore e a ordem de disparo e contrato publico (P2,
 * BR-MIGRAR-106). ⚠️ **A posicao e observavel:** no rodape, a declaracao
 * aparece depois de todo link do corpo da pagina.
 */
export const GANCHO_DA_DECLARACAO = 'wp_footer';
/** A prioridade default de `add_action` — ver {@link GANCHO_DA_DECLARACAO}. */
export const PRIORIDADE_DA_DECLARACAO = 10;

/** `array( 'type' => 'speculationrules' )` (`:341`). */
export const TIPO_DO_ELEMENTO_DE_SAIDA = 'speculationrules';

/**
 * As duas bandeiras de `wp_json_encode` (`:339`), **por nome**.
 *
 * Saem como dado porque a codificacao e da plataforma e as bandeiras nao sao:
 * sem elas a borda produziria outro texto para o mesmo valor, e o que chega ao
 * navegador e o texto. `JSON_HEX_TAG` escapa `<` e `>`; `JSON_UNESCAPED_SLASHES`
 * deixa a barra como esta — e e a barra que aparece em todo padrao de caminho.
 */
export const BANDEIRAS_DA_CODIFICACAO: readonly string[] = Object.freeze([
  'JSON_HEX_TAG',
  'JSON_UNESCAPED_SLASHES',
]);

/**
 * O filtro `wp_speculation_rules_href_exclude_paths` (`:241`).
 *
 * Recebe a lista acumulada — que no legado comeca **vazia**, e nao com as sete
 * base (`:241`, `array()`) — e o modo.
 *
 * ⚠️ **Recebe e devolve `unknown`, e isso e o contrato de `apply_filters`.** O
 * valor passado ao interceptador seguinte e o que o anterior devolveu, **sem
 * conversao**: o `(array)` de `:241` roda uma vez, no fim da cadeia, e o
 * `array_filter( ..., 'is_string' )` de `:242` depois dele. Logo um
 * interceptador que devolva texto entrega texto ao seguinte, e so no fim o
 * valor e embrulhado. Converter a cada passo mudaria o que o segundo
 * interceptador ve.
 */
export type IntercepcaoDeCaminhosExcluidos = (
  caminhos: unknown,
  modo: ModoDePreBusca,
) => unknown;

/**
 * A acao `wp_load_speculation_rules` (`:317`).
 *
 * Recebe o coletor **mutavel** para acrescentar regra com `adicionarRegra()`.
 * Nao devolve valor: e acao, nao filtro.
 */
export type ObservadorDasRegras = (
  regras: ConjuntoDeRegrasDePreBusca,
) => void;

/** Os pontos de extensao desta operacao, na ordem em que disparam. */
export interface PontosDaPreBusca {
  /** `wp_speculation_rules_configuration` (`:62`), antes de tudo. */
  readonly sobreAConfiguracao?: readonly IntercepcaoDaConfiguracao[];
  /** `wp_speculation_rules_href_exclude_paths` (`:241`). */
  readonly sobreOsCaminhosExcluidos?: readonly IntercepcaoDeCaminhosExcluidos[];
  /** `wp_load_speculation_rules` (`:317`), com a regra do nucleo ja dentro. */
  readonly aoCarregarAsRegras?: readonly ObservadorDasRegras[];
}

/** O que a pre-busca recebe. */
export interface OpcoesDaPreBusca {
  readonly contexto?: ContextoDaPreBusca;
  readonly pontosDeExtensao?: PontosDaPreBusca;
}

/**
 * `array_unique()` com a comparacao de texto do legado, preservando a primeira
 * ocorrencia.
 */
function semRepetidos(caminhos: readonly string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const caminho of caminhos) {
    if (!vistos.has(caminho)) {
      vistos.add(caminho);
      saida.push(caminho);
    }
  }
  return saida;
}

/**
 * A lista final de caminhos excluidos — `:206-260` inteiro.
 *
 * Os oito de fabrica primeiro, na ordem de {@link EXCLUSOES_DE_FABRICA} mais a
 * exclusao de consulta que a forma dos enderecos escolhe, e depois o que o
 * filtro acrescentou, cada item prefixado pelo contexto **default** (`home`,
 * `:254`) e sem repetidos.
 */
export function caminhosExcluidosDaPreBusca(
  contextos: ContextosDoPrefixador,
  formaDosEnderecos: string,
  modo: ModoDePreBusca,
  intercepcoes: readonly IntercepcaoDeCaminhosExcluidos[] = [],
): readonly string[] {
  // `:206-214`.
  const base = EXCLUSOES_DE_FABRICA.map((exclusao) =>
    prefixarPadrao(contextos, exclusao.padrao, exclusao.contexto),
  );

  // `:221-225`, com a verdade do interpretador: texto vazio e `'0'` sao falsos.
  base.push(
    prefixarPadrao(
      contextos,
      vazioComoNoPhp(formaDosEnderecos)
        ? EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL
        : EXCLUSAO_DE_CONSULTA_COM_ENDERECO_AMIGAVEL,
    ),
  );

  // `apply_filters( 'wp_speculation_rules_href_exclude_paths', array(), $mode )`
  // (`:241`) — comeca VAZIA, nao com as base, e cada interceptador recebe o que
  // o anterior devolveu, sem conversao.
  let doFiltro: unknown = Object.freeze([]);
  for (const intercepcao of intercepcoes) {
    doFiltro = intercepcao(doFiltro, modo);
  }

  // `(array) $valor` (`:241`) mais `array_filter( ..., 'is_string' )` (`:242`):
  // o que nao e texto desaparece sem aviso. 🔴 O molde `(array)` de objeto
  // devolve as propriedades dele no interpretador de origem, e aqui ele
  // embrulha o objeto num item; o caso e do oraculo executavel
  // (`ESC-ORACULO`, resposta 16), e nenhum dos dois produz texto, logo o
  // `array_filter` seguinte descarta os dois.
  const comoLista: readonly unknown[] = Array.isArray(doFiltro)
    ? doFiltro
    : doFiltro === null || doFiltro === undefined
      ? []
      : [doFiltro];
  const doFiltroPrefixados = comoLista
    .filter((item): item is string => typeof item === 'string')
    .map((item) => prefixarPadrao(contextos, item));

  // `array_values( array_unique( array_merge( base, filtro ) ) )` (`:248-260`):
  // as base primeiro, e por isso nenhum filtro as remove.
  return Object.freeze(semRepetidos([...base, ...doFiltroPrefixados]));
}

/**
 * As quatro — ou cinco — condicoes da regra do nucleo, combinadas por `and`
 * (`:264-296`).
 *
 * ⚠️ **A quinta so existe em `prerender`** (`:290-296`): com esse modo, a classe
 * `.no-prefetch` **tambem** exclui, *"because it's part of 'prerender'"*.
 * Pre-renderizar implica pre-buscar, logo quem optou por nao ser pre-buscado
 * nao deve ser pre-renderizado — e um porte que montasse so as quatro
 * especularia links que o legado nao especula.
 */
export function condicoesDaRegraDoNucleo(
  contextos: ContextosDoPrefixador,
  caminhosExcluidos: readonly string[],
  modo: ModoDePreBusca,
): readonly CondicaoDeRegra[] {
  const condicoes: CondicaoDeRegra[] = [
    // `:266-268` — inclui tudo no mesmo site.
    { href_matches: prefixarPadrao(contextos, PADRAO_DO_PROPRIO_SITE) },
    // `:270-274` — menos os caminhos excluidos.
    { not: { href_matches: caminhosExcluidos } },
    // `:276-280` — menos `rel=nofollow`.
    { not: { selector_matches: SELETOR_SEM_SEGUIR } },
    // `:282-286` — menos o opt-out por classe, inclusive via elemento pai.
    { not: { selector_matches: `.no-${modo}, .no-${modo} a` } },
  ];

  // `:290-296`.
  if (modo === 'prerender') {
    condicoes.push({ not: { selector_matches: '.no-prefetch, .no-prefetch a' } });
  }

  return Object.freeze(condicoes);
}

/**
 * `wp_get_speculation_rules()` (`:195-320`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4) — UC-01 nao
 * verifica capacidade, e `is_user_logged_in()` nao e uma verificacao de
 * capacidade (a razao esta em `./configuracao-da-pre-busca.ts`).
 *
 * Devolve ausencia no lugar do `null` de `:198`, que e a pre-busca desligada.
 */
export function regrasDePreBusca(
  opcoes: OpcoesDaPreBusca = {},
): ConjuntoDeRegrasDePreBusca | undefined {
  const contexto = contextoDaPreBuscaResolvido(opcoes.contexto);
  const pontos = opcoes.pontosDeExtensao ?? {};

  const configuracao = configuracaoDaPreBusca(
    {
      alguemAutenticado: contexto.alguemAutenticado,
      formaDosEnderecos: contexto.configuracaoDoSite.formaDosEnderecos,
      variavelDeAmbiente: contexto.variavelDeAmbiente,
      constante: contexto.constante,
    },
    pontos.sobreAConfiguracao,
  );

  // `if ( null === $configuration ) { return null; }` (`:197-199`).
  if (configuracao === undefined) {
    return undefined;
  }

  const contextos = contextosPadraoDoPrefixador(contexto.caminhosDaInstalacao);
  const caminhosExcluidos = caminhosExcluidosDaPreBusca(
    contextos,
    contexto.configuracaoDoSite.formaDosEnderecos,
    configuracao.modo,
    pontos.sobreOsCaminhosExcluidos,
  );

  const regras = criarConjuntoDeRegrasDePreBusca();

  // `:298-308`. A ordem dos campos e a do legado — `source`, `where`,
  // `eagerness` — e ela chega ao navegador, porque nada reordena o valor entre
  // aqui e a codificacao.
  regras.adicionarRegra(configuracao.modo, IDENTIFICADOR_DA_REGRA_DO_NUCLEO, {
    source: FONTE_DA_REGRA_DO_NUCLEO,
    where: {
      and: condicoesDaRegraDoNucleo(
        contextos,
        caminhosExcluidos,
        configuracao.modo,
      ),
    },
    eagerness: configuracao.agressividade,
  });

  // `do_action( 'wp_load_speculation_rules', $speculation_rules )` (`:317`),
  // DEPOIS de a regra do nucleo entrar: quem estende encontra `main` ja dentro
  // e nao pode substitui-la, porque `has_rule` recusa o identificador repetido.
  for (const observador of pontos.aoCarregarAsRegras ?? []) {
    observador(regras);
  }

  return regras;
}

/**
 * O que `wp_print_speculation_rules()` entrega a borda de saida.
 *
 * Ver *"Onde este porte para"*, no cabecalho deste arquivo: a codificacao em
 * JSON e a montagem do elemento nao sao desta feature, e os campos abaixo sao
 * exatamente os argumentos com que o legado as chama.
 *
 * ⚠️ **O que esta estrutura NAO tem, de proposito: a configuracao que valeu.**
 * `wp_print_speculation_rules()` nao a enxerga — `wp_get_speculation_rules()` a
 * consome e devolve so o objeto de regras (`:196-202` e `:319`). O modo e a
 * chave de {@link DeclaracaoDaPreBusca.conteudo} e a agressividade e o campo
 * `eagerness` da regra; deriva-los num campo proprio aqui seria inventar uma
 * leitura que o legado nao faz, e ela ficaria errada no instante em que um
 * terceiro acrescentasse regra em outro modo. Quem precisa da configuracao
 * chama `configuracaoDaPreBusca()`, que e a funcao que o legado tambem publica.
 */
export interface DeclaracaoDaPreBusca {
  /**
   * Falso quando a pre-busca esta desligada, e e **a entrega de CA-7.3**:
   * `wp_print_speculation_rules()` retorna em `:333` sem imprimir nada, logo a
   * declaracao nao aparece na pagina — nao aparece **vazia**, nao aparece.
   */
  readonly emitida: boolean;
  /** O valor que `wp_json_encode` recebe (`:337-338`). Ausente quando nada sai. */
  readonly conteudo?: RegrasParaJson;
  /** Os atributos do elemento (`:341`). Vazio quando nada sai. */
  readonly atributos: Readonly<Record<string, string>>;
  /** As duas bandeiras de codificacao (`:339`), por nome. */
  readonly bandeirasDaCodificacao: readonly string[];
  /**
   * As recusas de `adicionarRegra`, se houver. Ver `RecusaDeRegra`.
   *
   * ⚠️ Com a pre-busca ligada esta lista **sempre** esta vazia para a regra do
   * nucleo, que e valida por construcao; ela so enche quando um observador de
   * `wp_load_speculation_rules` tenta acrescentar regra invalida.
   */
  readonly recusas: readonly RecusaDeRegra[];
}

/** A declaracao de quem esta com a pre-busca desligada. */
const NADA_DECLARADO: DeclaracaoDaPreBusca = Object.freeze({
  emitida: false,
  atributos: Object.freeze({}),
  bandeirasDaCodificacao: BANDEIRAS_DA_CODIFICACAO,
  recusas: Object.freeze([]),
});

/**
 * `wp_print_speculation_rules()` (`:330-343`).
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4).
 *
 * ⚠️ **Nao e etapa de `WP::main()` nem de `template-loader.php`**, e isso e
 * fidelidade e nao desenho: a funcao e pendurada em `wp_footer`
 * (`default-filters.php:367`) e roda quando o tema emite o rodape — isto e
 * depois de tudo que esta operacao enxerga. E por isso que ela e operacao
 * propria do modulo, pela mesma razao que `escolherApresentacao` o e.
 */
export function declararPreBusca(
  opcoes: OpcoesDaPreBusca = {},
): DeclaracaoDaPreBusca {
  const regras = regrasDePreBusca(opcoes);

  // `if ( null === $speculation_rules ) { return; }` (`:332-334`).
  if (regras === undefined) {
    return NADA_DECLARADO;
  }

  // `wp_json_encode( $speculation_rules, ... )` (`:337-338`): o que o
  // codificador recebe e o `jsonSerialize()` do objeto, e e esse valor que sai
  // daqui para a borda.
  return Object.freeze({
    emitida: true,
    conteudo: regras.paraJson(),
    atributos: Object.freeze({ type: TIPO_DO_ELEMENTO_DE_SAIDA }),
    bandeirasDaCodificacao: BANDEIRAS_DA_CODIFICACAO,
    recusas: regras.recusas(),
  });
}
