/**
 * O formato de esquema de rota — a declaracao que `register_rest_route()`
 * recebe e que `get_routes()` normaliza.
 *
 * Tarefa **T002** da feature `013-superficies-programaticas`, cuja entrega e
 * *"os dois formatos existem como declaracao, com validacao de parametro ainda
 * vazia, e o registro de uma rota sem declaracao de permissao reproduz o aviso
 * de uso indevido do legado"*. Este arquivo e o primeiro dos dois formatos; o
 * de operacao nomeada esta em `../operacao-nomeada/esquema-de-operacao-nomeada.ts`.
 * `satisfaz: — (infraestrutura)`: nenhum criterio de aceite.
 *
 * Este arquivo troca pela interface os dois `never` que **T001** deixou em
 * `./registro-de-rotas.ts` — era a primeira linha desta tarefa, e esta escrita
 * naquele arquivo.
 *
 * ---
 *
 * ## Onde esta declaracao vive no legado, e quem a le
 *
 * | o que | ancora | aqui |
 * |---|---|---|
 * | os argumentos de uma rota, como a funcao de registro os recebe | `wp-includes/rest-api.php:34` (`$args`) | {@link ArgumentosDaRota} |
 * | um tratador: metodo, funcao, permissao e esquema de argumento | `wp-includes/rest-api.php:107`-`:120` | {@link DeclaracaoDeRota} |
 * | o esquema de um argumento | `wp-includes/rest-api.php:2169` (as palavras-chave publicadas) | {@link EsquemaDeArgumento} |
 * | o tratador **depois** da normalizacao | `class-wp-rest-server.php:977`-`:1021` | {@link TratadorDeRota} |
 * | os cinco atalhos de metodo | `class-wp-rest-server.php:24`, `:32`, `:40`, `:48`, `:56` | {@link ATALHOS_DE_METODO} |
 *
 * ## A regra de idioma deste arquivo, porque ela nao e a do resto da arvore
 *
 * A convencao da arvore e traduzir o campo de uma declaracao — `register_taxonomy()`
 * tem `show_in_rest` e `DeclaracaoDeContexto` tem `mostrarNoRest`. Aqui ela vale
 * para o tratador ({@link DeclaracaoDeRota}: `metodos`, `funcao`, `permissao`,
 * `argumentos`), e **nao** vale dentro de {@link EsquemaDeValor}.
 *
 * O motivo e que as palavras-chave de esquema **saem na resposta com o nome que
 * tem**: `get_data_for_route()` copia o esquema do argumento para o indice com
 * `array_intersect_key( $opts, $allowed_schema_keywords )`
 * (`class-wp-rest-server.php:1686`), chave por chave, sem renomear nada. O
 * esquema declarado e o documento publicado — e CA-2.5 e CA-3.3 cobram
 * exatamente isso, *"o mesmo documento usado para validar e para publicar o
 * contrato"*. A **area 1** da Decisao 2 de `parity_specs.md` poe esta saida em
 * *byte a byte, zero divergencia*: traduzir `minItems` para `minimoDeItens`
 * seria uma tabela de traducao na borda e um jeito novo de errar.
 * `validate_callback` e `sanitize_callback` ficam no mesmo idioma por morarem no
 * mesmo objeto, apesar de nao serem publicados.
 *
 * ## 🔴 O que T002 encontrou e nao estava escrito em lugar nenhum
 *
 * 1. **`isset()` trata `null` como ausente, logo `permissao: null` TAMBEM
 *    avisa.** O legado pergunta `! isset( $arg_group['permission_callback'] )`
 *    (`rest-api.php:122`), e `isset()` e falso para nulo. Declarar a permissao
 *    como nula nao e declarar: e o mesmo caso de `I7`. Esta em
 *    {@link DeclaracaoDeRota.permissao} e tem teste.
 * 2. **O default de `methods` depende de POR ONDE a rota entrou.** A funcao de
 *    registro mescla `'methods' => 'GET'` (`rest-api.php:108`); o leitor
 *    `get_routes()` mescla `'methods' => ''` (`class-wp-rest-server.php:978`).
 *    Rota registrada pela funcao sem metodo declarado responde a `GET`; rota
 *    semeada direto no armazem, sem metodo, nao responde a nada e **desaparece
 *    do indice** (`:1707`, *"No methods supported, hide the route"*). Sao dois
 *    numeros de fabrica diferentes para o mesmo campo, e o **P6** manda cada um
 *    viver no seu ponto: {@link PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO} e
 *    {@link PADROES_DO_TRATADOR_NO_LEITOR}.
 * 3. **`required` tem duas formas no mesmo formato.** Como chave do argumento e
 *    `true`/`false` (`class-wp-rest-request.php:917`); dentro de um esquema de
 *    objeto e a **lista de nomes** do draft 4 (`rest-api.php` em
 *    `rest_validate_object_value_from_schema`, *"schema version 4"*), e o
 *    legado aceita as duas, uma por versao de draft, no mesmo campo. Ver
 *    {@link EsquemaDeValor.required}.
 * 4. **`show_in_index` presente e nulo esconde a rota.** `wp_parse_args()` e
 *    `array_merge( $defaults, $args )`: chave presente com nulo **sobrescreve**
 *    o default `true`, e o indice testa com `empty()` (`:1662`). E por isso que
 *    {@link normalizarTratador} pergunta se a chave existe em vez de usar `??`.
 */

import type { AvisoDeUsoIndevido } from '../../../plataforma/autorizacao/index.js';

/**
 * Os cinco atalhos de metodo de `WP_REST_Server`, com o nome publicado de cada
 * um como chave.
 *
 * As chaves ficam em maiusculas e em ingles de proposito: `WP_REST_Server::EDITABLE`
 * e **constante publicada**, e a tabela *Nao negociavel* da constituicao poe
 * *"renomear ou remover ponto de extensao, rota, opcao, constante ou funcao
 * publicada"* fora do que este agente decide (P8).
 *
 * ⚠️ `EDITABLE` e `ALLMETHODS` sao **texto com virgula**, nao lista: e a forma
 * em que o legado os declara, e e `get_routes()` que os reparte
 * (`class-wp-rest-server.php:1008`-`:1021`). Reparti-los aqui mudaria o que
 * `rotas()` devolve para quem declarou o atalho.
 */
export const ATALHOS_DE_METODO = Object.freeze({
  /** `class-wp-rest-server.php:24`. */
  READABLE: 'GET',
  /** `class-wp-rest-server.php:32`. */
  CREATABLE: 'POST',
  /** `class-wp-rest-server.php:40` — tres metodos num texto so. */
  EDITABLE: 'POST, PUT, PATCH',
  /** `class-wp-rest-server.php:48`. */
  DELETABLE: 'DELETE',
  /** `class-wp-rest-server.php:56` — cinco metodos num texto so. */
  ALLMETHODS: 'GET, POST, PUT, PATCH, DELETE',
});

/**
 * Os sete tipos que o legado reconhece em `type`
 * (`rest-api.php:2244`, `$allowed_types`).
 */
export const TIPOS_RECONHECIDOS_NO_ESQUEMA = Object.freeze([
  'array',
  'object',
  'string',
  'number',
  'integer',
  'boolean',
  'null',
] as const);

/** Um dos sete de {@link TIPOS_RECONHECIDOS_NO_ESQUEMA}. */
export type TipoReconhecidoNoEsquema =
  (typeof TIPOS_RECONHECIDOS_NO_ESQUEMA)[number];

/**
 * O valor de `type`.
 *
 * ⚠️ **Aceita texto fora dos sete de proposito.** No legado, `type` ausente ou
 * fora da lista **nao recusa**: emite aviso de uso indevido (`rest-api.php:2248`
 * e `:2267`) e cai no `default` do `switch`, que da o valor por valido
 * (`:2297`-`:2299`). Um alvo que fechasse a uniao nos sete tornaria aqueles dois
 * avisos **impossiveis de alcancar**, e aviso de uso indevido *"e observavel por
 * quem estende"* — e a mesma ressalva que BR-MIGRAR-091 registra em
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts`. Os sete continuam
 * aparecendo no completar do editor; a uniao so nao recusa o oitavo.
 */
export type NomeDeTipoNoEsquema = TipoReconhecidoNoEsquema | (string & {});

/**
 * Os cinco formatos que o legado interpreta (`rest-api.php:2320`-`:2345`).
 *
 * Fora destes cinco o `switch` nao tem `default`: formato desconhecido e
 * **ignorado**, nao recusado. Dai {@link EsquemaDeValor.format} tambem aceitar
 * texto aberto.
 */
export const FORMATOS_RECONHECIDOS_NO_ESQUEMA = Object.freeze([
  'hex-color',
  'date-time',
  'email',
  'ip',
  'uuid',
] as const);

/** Um dos cinco de {@link FORMATOS_RECONHECIDOS_NO_ESQUEMA}. */
export type FormatoReconhecidoNoEsquema =
  (typeof FORMATOS_RECONHECIDOS_NO_ESQUEMA)[number];

/** O valor de `format`. Ver a ressalva de {@link NomeDeTipoNoEsquema}. */
export type NomeDeFormatoNoEsquema = FormatoReconhecidoNoEsquema | (string & {});

/**
 * As 25 palavras-chave de esquema que o legado **publica ao cliente**, na ordem
 * em que `rest_get_allowed_schema_keywords()` as devolve (`rest-api.php:2169`-`:2197`).
 *
 * E a lista que `get_data_for_route()` usa para recortar o esquema do argumento
 * antes de publica-lo (`class-wp-rest-server.php:1656` e `:1686`), logo ela
 * decide o que aparece no mapa da superficie (**US-3**, T007) e o que fica so do
 * lado de dentro.
 *
 * ⚠️ **`required` nao esta nesta lista, e aparece no indice de qualquer forma**:
 * `get_data_for_route()` o acrescenta a mao, sempre, como booleano
 * (`$arg_data['required'] = ! empty( $opts['required'] );`, `:1687`) — logo
 * **toda** rota publica `required`, inclusive a que nao o declarou. Quem fechar
 * T007 reproduz o acrescimo; esta lista nao o tem porque o legado nao o tem.
 *
 * ⚠️ **E ponto de extensao.** `wp_json_schema_allowed_keywords`
 * (`wp-includes/json-schema.php:68`) recebe a lista e o perfil e pode devolver
 * outra — logo quem estende muda o que a superficie publica. Fica declarado
 * aqui, e nao implementado, porque o barramento de ganchos nao tem tarefa neste
 * pacote (REQ-162 esta em `do-not-rewrite.md`). O perfil `draft-04`, que
 * acrescenta `$schema`, `id`, `$ref`, `required`, `allOf`, `not`, `definitions`,
 * `dependencies` e `additionalItems` (`json-schema.php:37`-`:52`), e de quem
 * publicar esquema de operacao nomeada ao agente.
 */
export const PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS = Object.freeze([
  'title',
  'description',
  'default',
  'type',
  'format',
  'enum',
  'items',
  'properties',
  'additionalProperties',
  'patternProperties',
  'minProperties',
  'maxProperties',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'pattern',
  'minItems',
  'maxItems',
  'uniqueItems',
  'anyOf',
  'oneOf',
] as const);

/** Uma das 25 de {@link PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS}. */
export type PalavraChaveDeEsquemaPublicada =
  (typeof PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS)[number];

/**
 * O esquema de um valor — as palavras-chave de JSON Schema como o legado as
 * declara e as interpreta.
 *
 * Todo campo e opcional porque no legado todo campo e opcional: o esquema e um
 * vetor associativo, e o que falta simplesmente nao e conferido. Nenhum deles e
 * conferido **ainda** — a interpretacao e de **T005** (US-2), e a lista do que
 * ela deve cobrir esta em `./validacao-de-parametro.ts`.
 */
export interface EsquemaDeValor {
  /** Rotulo do campo. So documenta; nenhuma regra o le. */
  readonly title?: string;
  /** Descricao do campo. So documenta. */
  readonly description?: string;
  /**
   * O valor que a requisicao recebe quando o parametro nao vem.
   *
   * ⚠️ No despacho, `default` **nao** e aplicado pela validacao: e colhido dos
   * `args` do tratador casado e posto na requisicao antes de tudo. E **T003**.
   */
  readonly default?: unknown;
  /** Ver {@link NomeDeTipoNoEsquema}. Lista significa "um destes". */
  readonly type?: NomeDeTipoNoEsquema | readonly NomeDeTipoNoEsquema[];
  /** Ver {@link NomeDeFormatoNoEsquema}. */
  readonly format?: NomeDeFormatoNoEsquema;
  /** Os valores aceitos. O legado so o confere quando nao esta vazio (`:2306`). */
  readonly enum?: readonly unknown[];
  /** O esquema de cada item, quando `type` e `array`. */
  readonly items?: EsquemaDeValor;
  /** O esquema de cada propriedade conhecida, quando `type` e `object`. */
  readonly properties?: Readonly<Record<string, EsquemaDeValor>>;
  /**
   * `false` recusa propriedade nao declarada; um esquema a confere contra ele.
   * Ausente **permite** qualquer propriedade extra, sem conferir.
   */
  readonly additionalProperties?: boolean | EsquemaDeValor;
  /** Esquema por expressao regular de nome de propriedade. */
  readonly patternProperties?: Readonly<Record<string, EsquemaDeValor>>;
  readonly minProperties?: number;
  readonly maxProperties?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  /** Booleano, como no draft 4: torna {@link EsquemaDeValor.minimum} exclusivo. */
  readonly exclusiveMinimum?: boolean;
  /** Booleano, como no draft 4: torna {@link EsquemaDeValor.maximum} exclusivo. */
  readonly exclusiveMaximum?: boolean;
  readonly multipleOf?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly uniqueItems?: boolean;
  readonly anyOf?: readonly EsquemaDeValor[];
  readonly oneOf?: readonly EsquemaDeValor[];
  /**
   * 🔴 **As duas formas de `required`, e o legado aceita as duas.**
   *
   * - `true` na propria propriedade e a forma do draft 3, e e tambem a forma que
   *   o despacho le para o parametro de topo
   *   (`class-wp-rest-request.php:917`: `isset( $arg['required'] ) && true ===
   *   $arg['required']` — **identidade com `true`**, logo `'1'` nao exige).
   * - lista de nomes dentro do esquema do objeto e a forma do draft 4, e o
   *   legado a prefere quando esta presente (`rest_validate_object_value_from_schema`,
   *   comentario *"schema version 4"*), caindo na forma do draft 3 so no `elseif`.
   *
   * Um porte que escolhesse uma das duas recusaria esquema que hoje passa.
   */
  readonly required?: boolean | readonly string[];
}

/**
 * A requisicao que chega ao tratador — `WP_REST_Request`.
 *
 * ⚠️ **E `never` porque T002 nao define a requisicao: T003 define.** Pelo mesmo
 * motivo que `DeclaracaoDeRota` era `never` em T001: enquanto a forma nao
 * existe, o compilador nao deixa ninguem **chamar** o que a recebe, e ao mesmo
 * tempo aceita qualquer funcao de um argumento como declaracao — `never` e
 * atribuivel a qualquer parametro. Declarar rota hoje compila; despachar, nao.
 *
 * Trocar este `never` pela interface e a primeira linha de T003 (CA-1.1).
 */
export type RequisicaoDeRota = never;

/**
 * A funcao da rota — `callback`.
 *
 * Devolve `unknown` porque o legado devolve qualquer coisa e envelopa depois:
 * `rest_ensure_response()` aceita `WP_REST_Response`, `WP_Error` ou dado cru. O
 * envelope e **T003** (CA-1.4).
 */
export type FuncaoDaRota = (requisicao: RequisicaoDeRota) => unknown;

/**
 * A declaracao de permissao da rota — `permission_callback`.
 *
 * Devolve `unknown` por um motivo de paridade, nao de preguica: o legado aceita
 * booleano, `WP_Error` e qualquer valor coagivel, e e **T003** que fixa como
 * cada retorno vira 401, 403 ou passagem. Fechar a uniao aqui decidiria, uma
 * tarefa antes, um comportamento que a camada ainda nao tem.
 */
export type PermissaoDaRota = (requisicao: RequisicaoDeRota) => unknown;

/**
 * A validacao do tratador inteiro — `$attributes['validate_callback']`
 * (`class-wp-rest-request.php:974`).
 *
 * Recebe a requisicao, e nao um parametro: e a conferencia que olha a
 * combinacao de parametros, depois da conferencia de cada um. Quem a executa e
 * **T005**.
 */
export type ValidacaoDaRequisicao = (requisicao: RequisicaoDeRota) => unknown;

/**
 * A conferencia de um argumento — `validate_callback` do proprio argumento
 * (`class-wp-rest-request.php:948`).
 *
 * A ordem dos tres parametros e a do legado: valor, requisicao, nome.
 */
export type ValidacaoDeArgumento = (
  valor: unknown,
  requisicao: RequisicaoDeRota,
  nome: string,
) => unknown;

/**
 * A sanitizacao de um argumento — `sanitize_callback`
 * (`class-wp-rest-request.php:868`).
 *
 * ⚠️ **Argumento com `type` e sem `sanitize_callback` ganha um**:
 * `rest_parse_request_arg` (`:859`). Logo "sem sanitizacao declarada" nao
 * significa "sem sanitizacao" — significa a do tipo. Quem fechar T005 reproduz o
 * acrescimo, que e o que faz CA-2.3 (*"a sanitizacao acontece depois da
 * validacao"*) valer para argumento que ninguem sanitizou a mao.
 */
export type SanitizacaoDeArgumento = (
  valor: unknown,
  requisicao: RequisicaoDeRota,
  nome: string,
) => unknown;

/**
 * O esquema de um argumento da rota: o esquema do valor, mais as duas funcoes
 * que o despacho procura nele.
 *
 * As duas funcoes **nao** sao publicadas no mapa da superficie: nao estao em
 * {@link PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS}, e o recorte de
 * `get_data_for_route()` as deixa de fora.
 */
export interface EsquemaDeArgumento extends EsquemaDeValor {
  readonly validate_callback?: ValidacaoDeArgumento;
  readonly sanitize_callback?: SanitizacaoDeArgumento;
}

/** Os argumentos de um tratador, por nome. */
export type EsquemaDosArgumentos = Readonly<Record<string, EsquemaDeArgumento>>;

/**
 * **O formato de esquema de rota**: um tratador, como o legado o declara em
 * `$arg_group` (`rest-api.php:113`-`:151`).
 *
 * Uma rota tem uma **lista** destes, e e a lista que `rotas()` devolve para o
 * caminho. Casar o metodo com um deles e **T003** (CA-1.1).
 */
export interface DeclaracaoDeRota {
  /**
   * Os metodos HTTP que este tratador atende.
   *
   * Tres formas, todas do legado (`class-wp-rest-server.php:1008`-`:1014`):
   * texto (uma virgula separa mais de um — e assim que
   * {@link ATALHOS_DE_METODO} viaja), lista de textos, ou o mapa ja normalizado.
   * `null` cai no `else` do legado e vale **nenhum metodo**, o que esconde a
   * rota do indice.
   */
  readonly metodos?:
    | string
    | readonly string[]
    | MetodosNormalizados
    | null;

  /**
   * A funcao que atende. O default da funcao de registro e `null`
   * (`rest-api.php:109`), e rota com funcao nula **fica registrada**.
   */
  readonly funcao?: FuncaoDaRota | null;

  /**
   * 🔴 **A declaracao de permissao, e o ponto desta tarefa.**
   *
   * Ausente **ou nula**, o registro pela funcao de `register_rest_route()`
   * emite o aviso de uso indevido de `rest-api.php:122`-`:133` e **registra a
   * rota do mesmo jeito**. E `I7` / BR-MIGRAR-074, e e a camada de autorizacao
   * que falha **ABERTA** — ver {@link avisoDePermissaoNaoDeclarada} e
   * `./registro-de-rota-de-api.ts`.
   *
   * Nula conta como ausente porque `isset()` e falso para nulo. Tem teste.
   */
  readonly permissao?: PermissaoDaRota | null;

  /** O esquema de cada argumento. Default `{}` nas duas camadas de default. */
  readonly argumentos?: EsquemaDosArgumentos;

  /**
   * `accept_json`. Default `false` no leitor (`class-wp-rest-server.php:979`).
   * Presente e nulo continua nulo — ver {@link normalizarTratador}.
   */
  readonly aceitarJson?: boolean | null;

  /** `accept_raw`. Default `false` no leitor (`:980`). */
  readonly aceitarBruto?: boolean | null;

  /**
   * `show_in_index`. Default `true` no leitor (`:981`), e e o unico default
   * verdadeiro dos cinco: tratador escondido **nao entra** no mapa da
   * superficie, e se todos os tratadores de um caminho estiverem escondidos a
   * rota inteira desaparece dele (`:1662` e `:1707`).
   */
  readonly mostrarNoIndice?: boolean | null;

  /**
   * `allow_batch` **do tratador**, que vence o da rota
   * (`class-wp-rest-server.php:1671`: `$callback['allow_batch'] ?? $allow_batch`).
   * O nucleo declara `{ v1: true }` (`class-wp-rest-posts-controller.php:48`).
   */
  readonly permitirLote?: unknown;

  /**
   * `validate_callback` **do tratador** — ver {@link ValidacaoDaRequisicao}.
   * Nao confundir com o de cada argumento.
   */
  readonly validacao?: ValidacaoDaRequisicao;
}

/**
 * `methods` depois da normalizacao: mapa de metodo em maiusculas para `true`
 * (`class-wp-rest-server.php:1016`-`:1021`).
 *
 * E mapa, e nao lista, porque o legado usa a chave — `array_keys()` e o que o
 * indice publica (`:1666`), e declarar `GET` duas vezes nao produz `GET` duas
 * vezes na resposta.
 */
export type MetodosNormalizados = Readonly<Record<string, true>>;

/**
 * O tratador **como `rotas()` o devolve**: os cinco defaults do leitor
 * aplicados e os metodos repartidos.
 *
 * E o mesmo vetor do legado, normalizado no lugar (`:985`-`:1022`). Aqui e um
 * tipo proprio para que T003 nao precise reabrir as tres formas de `metodos`.
 */
export interface TratadorDeRota extends DeclaracaoDeRota {
  readonly metodos: MetodosNormalizados;
  readonly argumentos: EsquemaDosArgumentos;
  readonly aceitarJson: boolean | null;
  readonly aceitarBruto: boolean | null;
  readonly mostrarNoIndice: boolean | null;
}

/**
 * Uma opcao **da** rota, nao de um tratador: no legado e qualquer chave **nao
 * numerica** de `$route_args`, que `get_routes()` retira da lista de tratadores
 * e move para `$this->route_options[ $route ]`
 * (`class-wp-rest-server.php:998`-`:1002`).
 *
 * O valor e aberto porque no legado e aberto — quem registra pode por o que
 * quiser. As tres que o nucleo usa:
 *
 * | chave | valor | quem le |
 * |---|---|---|
 * | `namespace` | texto | estampado por `registrar()` (`:926`), lido pelo indice (`:1645`) |
 * | `schema` | funcao sem argumento | chamada pelo indice **so** com `context=help` (`:1651`-`:1653`) |
 * | `allow_batch` | `{ v1: true }` no nucleo | default do caminho, que o tratador pode vencer (`:1649`, `:1671`) |
 *
 * ⚠️ `namespace` e opcao da rota **por acidente de implementacao, e e
 * observavel**: `register_route()` o estampa dentro dos argumentos, e como nao e
 * chave numerica o leitor o move junto com as outras. E por ele que o recorte
 * por espaco de nome funciona — ver `./registro-de-rotas.ts`.
 */
export type DeclaracaoDeOpcaoDeRota = unknown;

/** As opcoes **declaradas** de uma rota, por nome. */
export type OpcoesDeclaradasDaRota = Readonly<
  Record<string, DeclaracaoDeOpcaoDeRota>
>;

/** O nome da opcao em que `registrar()` estampa o espaco de nome (`:926`). */
export const OPCAO_DO_ESPACO_DE_NOME = 'namespace';

/**
 * Os argumentos de uma rota: a lista de tratadores e as opcoes da rota.
 *
 * ⚠️ **No legado os dois chegam no MESMO vetor**, separados so pelo tipo da
 * chave: numerica e tratador, qualquer outra e opcao da rota
 * (`class-wp-rest-server.php:996`-`:1002`). Aqui eles chegam separados, e a
 * razao e que um objeto de TypeScript nao tem chave numerica implicita — mas a
 * **consequencia observavel** daquela mistura e preservada em
 * `./registro-de-rotas.ts`: a opcao so existe para quem pergunta **depois** de
 * `rotas()` ter sido chamada, porque e o leitor que faz a separacao.
 */
export interface ArgumentosDaRota {
  /** As chaves numericas de `$route_args`, na ordem. */
  readonly tratadores: readonly DeclaracaoDeRota[];
  /** As chaves nao numericas de `$route_args`. */
  readonly opcoes?: OpcoesDeclaradasDaRota;
}

/**
 * Os defaults que a **funcao de registro** mescla em cada tratador
 * (`rest-api.php:107`-`:111`).
 *
 * Sao tres, e o de `methods` e `'GET'`. Ver o achado 2 do cabecalho: nao sao os
 * mesmos do leitor.
 */
export const PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO = Object.freeze({
  metodos: 'GET',
  funcao: null,
  argumentos: Object.freeze({}) as EsquemaDosArgumentos,
});

/**
 * Os defaults que o **leitor** mescla em cada tratador
 * (`class-wp-rest-server.php:977`-`:983`).
 *
 * Sao cinco, e o de `methods` e texto vazio. Ver o achado 2 do cabecalho.
 */
export const PADROES_DO_TRATADOR_NO_LEITOR = Object.freeze({
  metodos: '',
  aceitarJson: false,
  aceitarBruto: false,
  mostrarNoIndice: true,
  argumentos: Object.freeze({}) as EsquemaDosArgumentos,
});

/**
 * Reparte `methods` no mapa de metodos
 * (`class-wp-rest-server.php:1007`-`:1021`).
 *
 * Texto separado por virgula, lista, ou mapa ja repartido. Qualquer outra coisa
 * — inclusive `null` — vale **nenhum metodo**, que e o `else` de `:1012`. Cada
 * nome passa por `strtoupper( trim( ... ) )`.
 */
export function normalizarMetodos(
  metodos: DeclaracaoDeRota['metodos'],
): MetodosNormalizados {
  let nomes: readonly string[];

  if (typeof metodos === 'string') {
    nomes = metodos.split(',');
  } else if (Array.isArray(metodos)) {
    nomes = metodos as readonly string[];
  } else if (metodos !== null && typeof metodos === 'object') {
    // O mapa ja repartido tambem e `is_array()` no legado, e e por ai que o
    // tratador normalizado atravessa uma segunda chamada a `rotas()` sem mudar.
    nomes = Object.keys(metodos);
  } else {
    nomes = [];
  }

  const repartidos: Record<string, true> = {};
  for (const nome of nomes) {
    repartidos[nome.trim().toUpperCase()] = true;
  }
  return repartidos;
}

/**
 * Aplica em um tratador os cinco defaults do leitor e reparte os metodos
 * (`class-wp-rest-server.php:985`-`:1022`).
 *
 * ⚠️ **Pergunta se a chave existe, e nao se o valor e nulo**, porque
 * `wp_parse_args()` e `array_merge( $defaults, $args )`: chave presente com
 * nulo **sobrescreve** o default. E o achado 4 do cabecalho, e o caso que ele
 * cobre — `mostrarNoIndice: null` esconder a rota — tem teste.
 */
export function normalizarTratador(
  tratador: DeclaracaoDeRota,
): TratadorDeRota {
  const padroes = PADROES_DO_TRATADOR_NO_LEITOR;

  return {
    ...tratador,
    metodos: normalizarMetodos(
      'metodos' in tratador ? (tratador.metodos ?? null) : padroes.metodos,
    ),
    argumentos:
      'argumentos' in tratador
        ? (tratador.argumentos ?? padroes.argumentos)
        : padroes.argumentos,
    aceitarJson:
      'aceitarJson' in tratador
        ? (tratador.aceitarJson ?? null)
        : padroes.aceitarJson,
    aceitarBruto:
      'aceitarBruto' in tratador
        ? (tratador.aceitarBruto ?? null)
        : padroes.aceitarBruto,
    mostrarNoIndice:
      'mostrarNoIndice' in tratador
        ? (tratador.mostrarNoIndice ?? null)
        : padroes.mostrarNoIndice,
  };
}

/**
 * O aviso de uso indevido da rota sem declaracao de permissao
 * (`rest-api.php:122`-`:133`).
 *
 * **O texto e o do legado, em ingles**, pela mesma razao registrada em
 * `contextos/classificacao/registro/erro-de-registro.ts`: `EC-05` fixa que *"o
 * `msgid` em ingles E a chave do catalogo"*, logo traduzir aqui trocaria a
 * chave. Os tres `%s` do legado sao o caminho completo, o nome do argumento que
 * falta e o nome da funcao que libera — os dois ultimos sao **literais no
 * legado**, e por isso entram ja preenchidos; o primeiro e dado da chamada e e
 * montado por {@link avisoDePermissaoNaoDeclarada}.
 *
 * 🔴 **O texto ensina a liberacao explicita, e isso e contrato documentado para
 * quem estende** (BR-MIGRAR-074, *Compatibilidade com paradigma alvo*). Quem
 * reescrever a mensagem para algo mais severo muda o produto.
 */
export const VERSAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA = '5.5.0';

/** A funcao que o legado nomeia no aviso — `__FUNCTION__` em `:124`. */
export const FUNCAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA =
  'register_rest_route';

/**
 * Monta o aviso de {@link VERSAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA} para um
 * caminho.
 *
 * @param caminhoSemBarra O `$clean_namespace . '/' . trim( $route, '/' )` de
 *   `:128` — **sem** a barra inicial, diferente do caminho com que a rota e
 *   registrada em `:153`. A diferenca e do legado e esta no teste.
 */
export function avisoDePermissaoNaoDeclarada(
  caminhoSemBarra: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA,
    mensagem:
      `The REST API route definition for <code>${caminhoSemBarra}</code> is ` +
      'missing the required <code>permission_callback</code> argument. For ' +
      'REST API routes that are intended to be public, use ' +
      '<code>__return_true</code> as the permission callback.',
    versao: VERSAO_DO_AVISO_DE_PERMISSAO_NAO_DECLARADA,
  };
}
