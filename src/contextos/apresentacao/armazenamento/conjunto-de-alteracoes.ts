/**
 * A forma de armazenamento do conjunto de alteracoes — `AGG-Changeset`, que e
 * uma linha de `{site}posts` com o conteudo em **JSON**.
 *
 * Primeira metade da entrega de **T002** da feature
 * `009-apresentacao-e-personalizacao`: *"o conjunto de alteracoes existe como
 * tipo de conteudo proprio"*. O registro do tipo esta em `tipo-do-conjunto.ts` e
 * a maquina de estado em `estado-do-conjunto.ts`; aqui estao a **linha**, o
 * **identificador** e o **valor gravado**.
 *
 * ── 🔴 O VALOR GRAVADO E JSON, E NAO O FORMATO SERIALIZADO DO PHP ──────────
 *
 * E a excecao desta feature e nao se descobre pelo nome da coluna: o conjunto
 * guarda os valores alterados em `post_content`, por
 * `wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT )`
 * (`class-wp-customize-manager.php:2921`), e os le de volta com
 * `json_decode( ..., true )` (`:1138`). As **outras** duas estruturas desta
 * feature — `theme_mods_{folha}` e a opcao de componentes por area — guardam
 * arranjo no formato nativo do PHP, e e por isso que `opcao.ts` importa
 * `plataforma/serializacao` e este arquivo **nao**.
 *
 * Quem trocar os dois perde bytes nas duas direcoes. E porque o criterio da area
 * 3 e *"snapshot + sequencia de comandos"* com **zero divergencia**
 * (`parity_specs.md`, Decisao 2), as duas opcoes do `json_encode` sao parte do
 * contrato e estao reproduzidas em {@link conteudoDoConjunto} — inclusive a que
 * **nao** foi passada, `JSON_UNESCAPED_UNICODE`, que e a que faz o legado gravar
 * `\u00e1` onde JavaScript gravaria o caractere cru.
 *
 * ── O QUE ESTE ARQUIVO NAO FAZ: CONSULTAR A LINHA ──────────────────────────
 *
 * **O legado nao le o conjunto por consulta propria: ele le por `WP_Query` e por
 * `get_post()`**, que sao o motor de consulta de `BC-01`.
 * `find_changeset_post_id()` monta estes criterios
 * (`class-wp-customize-manager.php:998`-`:1010`):
 *
 * | argumento | valor | o que decide |
 * |---|---|---|
 * | `post_type` | `customize_changeset` | o discriminador da tabela compartilhada |
 * | `post_status` | `get_post_stati()` — **todos** os registrados | o conjunto e achado em qualquer estado, inclusive na lixeira |
 * | `name` | o identificador (UUID) | e `post_name` que carrega a identidade, nao `ID` |
 * | `posts_per_page` | `1` | uma linha |
 * | `fields` | **ausente de proposito** | o comentario do legado diz por que: *"'fields'=>'ids' is not being used in order to cache the post object as it will be needed"* (`:1012`) |
 *
 * Reproduzir aqui a cadeia que `WP_Query` monta seria escrever um segundo motor
 * de consulta de `BC-01` dentro de `BC-07` — e a regra de dependencia 3 proibe o
 * `import` que o evitaria. Quem pegar **T003** declara a travessia por **ligacao
 * tardia** (AD-10), como `anexo.ts` de BC-04 fez com a insercao: *"T002 nao a
 * declara porque T002 nao grava linha de `posts`"*. O que T002 entrega e
 * {@link lerConjuntoDeAlteracoes}, que transforma a linha **em** conjunto sem
 * emitir consulta nenhuma.
 *
 * **A unica consulta que este contexto emite sobre `posts` por conta propria** e
 * a que {@link RepositorioDoConjunto.levarParaALixeira} reproduz:
 * `trash_changeset_post()` chama `$wpdb->update()` direto
 * (`class-wp-customize-manager.php:3105`) e **nao** passa por
 * `wp_trash_post()` — exatamente como `wp_delete_attachment()` nao passa por
 * `wp_delete_post()` em BC-04.
 */

import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import { tabelaDeConteudo } from './chaves-e-tabelas.js';
import { ESTADO_NA_LIXEIRA } from './estado-do-conjunto.js';
import { comoInteiro, comoTexto } from './leitura-de-linha.js';

/**
 * `0000-00-00 00:00:00` — a sentinela de data, e aqui ela e **escrita de
 * proposito**.
 *
 * Ao aplicar, o legado zera as duas colunas de data em vez de gravar o instante:
 * `$post_array['post_date_gmt'] = '0000-00-00 00:00:00'` e o mesmo para
 * `post_date` (`class-wp-customize-manager.php:2939`-`:2940`), com o comentario
 * *"Reset post date to now if we are publishing"* — o efeito e que
 * `wp_update_post()` recalcula a data. ⚠️ O destino da sentinela e
 * `BR-HUMANA-003` e esta **pendente** (`target_data_model.md`); este arquivo
 * segue a premissa declarada la, que e manter a cadeia, e **nao decide nada**.
 */
export const DATA_SENTINELA = '0000-00-00 00:00:00';

/**
 * `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/` — a forma
 * do identificador, como `wp_is_uuid()` a cobra sem versao
 * (`wp-includes/functions.php:8137`).
 *
 * O legado chama `wp_is_uuid( $this->_changeset_uuid )` **sem** o segundo
 * argumento (`class-wp-customize-manager.php:534`), logo a versao **nao** e
 * verificada: um identificador que nao seja v4 passa, desde que tenha a forma.
 * Usar o regex estrito de v4 (`:8135`) recusaria identificador que o legado
 * aceita.
 */
export const FORMA_DO_IDENTIFICADOR_DO_CONJUNTO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * `wp_is_uuid( $uuid )` (`wp-includes/functions.php:8124`), sem versao.
 *
 * ⚠️ **Gerar identificador nao esta aqui**: `wp_generate_uuid4()` e fonte de
 * aleatoriedade, que e borda, e o legado o chama em cinco lugares — inclusive
 * para devolver um identificador **novo** na resposta de erro de quem tentou salvar
 * sobre um conjunto ja aplicado (`:2666`), que e RF-06 da unidade
 * `customize/changeset-do-customizer`. Quem construir essas operacoes (T003,
 * T005) resolve a borda na tarefa dela.
 */
export function identificadorDoConjuntoValido(identificador: string): boolean {
  return FORMA_DO_IDENTIFICADOR_DO_CONJUNTO.test(identificador);
}

/** Um valor de JSON, que e o que o conteudo do conjunto carrega. */
export type ValorDeJson =
  | null
  | boolean
  | number
  | string
  | readonly ValorDeJson[]
  | { readonly [chave: string]: ValorDeJson };

/**
 * Os dados do conjunto: um mapa de **identificador de configuracao** para os
 * parametros dela.
 *
 * **O mapa e a verdade e a visao tipada e somente leitura**, pela mesma razao
 * que `derivadas.ts` de BC-04 registra para o metadado de anexo: a estrutura e
 * **aberta**. O filtro `customize_changeset_save_data`
 * (`class-wp-customize-manager.php:2898`) existe para que *"plugins may amend
 * additional data (such as additional meta for settings) into the changeset"*, e
 * o legado preserva o que nao conhece — `array_merge( $data[ $id ],
 * $setting_params )` (`:2854`). Um tipo fechado aqui apagaria, na primeira
 * gravacao, o que uma extensao guardou.
 */
export interface DadosDoConjunto {
  readonly [identificadorDaConfiguracao: string]: ValorDeJson;
}

/** `theme_mod` — o tipo de configuracao cuja chave recebe prefixo. */
export const TIPO_DE_CONFIGURACAO_DE_MODIFICACAO = 'theme_mod';

/** `::` — o separador da chave prefixada (`:2841`). */
export const SEPARADOR_DA_CHAVE_PREFIXADA = '::';

/**
 * A chave com que uma configuracao entra nos dados do conjunto.
 *
 * `if ( 'theme_mod' === $setting->type ) { $changeset_setting_id = sprintf(
 * '%s::%s', $this->get_stylesheet(), $setting_id ); }`
 * (`class-wp-customize-manager.php:2840`-`:2842`, e a mesma regra em `:2753`).
 *
 * RF-05 da unidade `customize/changeset-do-customizer` diz o que isso compra:
 * *"Indexar modificacoes de tema com a chave prefixada pela folha de estilo |
 * temas diferentes nao colidem"*, e a lacuna que ela fecha e nomeada como
 * *"colisao silenciosa entre temas"*. Configuracao que **nao** e modificacao de
 * tema entra com o identificador cru — e e por isso que a decisao e por tipo e
 * nao por chamador.
 */
export function chaveDaConfiguracaoNoConjunto(
  identificadorDaConfiguracao: string,
  tipoDaConfiguracao: string,
  folhaDeEstilo: string,
): string {
  return tipoDaConfiguracao === TIPO_DE_CONFIGURACAO_DE_MODIFICACAO
    ? `${folhaDeEstilo}${SEPARADOR_DA_CHAVE_PREFIXADA}${identificadorDaConfiguracao}`
    : identificadorDaConfiguracao;
}

/**
 * A visao tipada dos parametros de **uma** configuracao dentro do conjunto.
 *
 * Os quatro campos que o legado grava estao em
 * `class-wp-customize-manager.php:2861`-`:2873`: os tres que ele **sobrescreve
 * sempre** (`type`, `user_id`, `date_modified_gmt`), o `value`, e
 * `starter_content`, que e **removido** quando a gravacao nao e de conteudo
 * inicial (`:2871`-`:2872`).
 *
 * 🔴 **`temValor` nao e `valor !== null`.** O legado distingue *"a chave `value`
 * existe"* de *"a chave `value` nao existe"* com `array_key_exists`, em dois
 * lugares — ao decidir se o valor mudou (`:2742`-`:2746`) e ao aceitar dado do
 * cliente (`:2727`) —, e `null` **e** um valor legitimo: RF-14 da unidade e
 * literal, *"valor nulo **na entrada** da validacao e pulado: ausencia nao e
 * invalidez"*, e *"sanitizador que devolve nulo marca a configuracao como
 * **invalida**"*. Os dois nulos tem significados opostos, e colapsa-los inverte
 * o comportamento.
 */
export interface ParametrosDaConfiguracao {
  /** `array_key_exists( 'value', $params )` — ver a nota acima. */
  readonly temValor: boolean;
  /** `value`, ou `null` quando a chave nao existe (ver {@link temValor}). */
  readonly valor: ValorDeJson;
  /** `type` — `theme_mod`, `option` ou o que a configuracao declarar. */
  readonly tipo: string;
  /** `user_id` — a conta que fez **esta** alteracao, nao a autora do conjunto. */
  readonly contaId: number;
  /** `date_modified_gmt`, no formato do banco. */
  readonly modificadoEmGmt: string;
  /** `starter_content` — ausente na gravacao comum. */
  readonly conteudoInicial: boolean;
}

/** Os parametros de uma configuracao, lidos sem alterar o mapa. */
export function lerParametrosDaConfiguracao(
  entrada: ValorDeJson,
): ParametrosDaConfiguracao {
  const mapa: { readonly [chave: string]: ValorDeJson } =
    entrada !== null && typeof entrada === 'object' && !Array.isArray(entrada)
      ? (entrada as { readonly [chave: string]: ValorDeJson })
      : {};
  const valor = mapa['value'];
  const tipo = mapa['type'];
  const contaId = mapa['user_id'];
  const modificadoEmGmt = mapa['date_modified_gmt'];
  return {
    temValor: Object.prototype.hasOwnProperty.call(mapa, 'value'),
    valor: valor === undefined ? null : valor,
    tipo: typeof tipo === 'string' ? tipo : '',
    contaId: typeof contaId === 'number' ? contaId : 0,
    modificadoEmGmt:
      typeof modificadoEmGmt === 'string' ? modificadoEmGmt : '',
    conteudoInicial: mapa['starter_content'] === true,
  };
}

/** Os cinco erros de leitura do conteudo, com o codigo do legado. */
export type ErroDeLeituraDoConjunto =
  | 'empty_post_id'
  | 'missing_post'
  | 'wrong_post_type'
  | 'json_parse_error'
  | 'expected_array';

/** O resultado de {@link lerDadosDoConjunto}. */
export type LeituraDosDadosDoConjunto =
  | { readonly ok: true; readonly dados: DadosDoConjunto }
  | { readonly ok: false; readonly erro: ErroDeLeituraDoConjunto };

/**
 * `get_changeset_post_data()` a partir da coluna
 * (`class-wp-customize-manager.php:1138`-`:1146`).
 *
 * Dois dos cinco codigos de erro sao desta funcao — `json_parse_error` quando
 * `json_last_error()` acusa, e `expected_array` quando o JSON e valido mas nao e
 * arranjo (`"texto"`, `42`, `true`, `null`). Os outros tres (`empty_post_id`,
 * `missing_post`, `wrong_post_type`) sao sobre a **linha** e nao sobre a coluna:
 * eles estao no tipo porque quem resolver a linha por ligacao tardia precisa
 * devolve-los com o mesmo nome, e nome de erro e superficie (**P8**).
 *
 * ⚠️ **Lista de JSON passa.** `json_decode( '[1,2]', true )` devolve arranjo, e
 * `is_array()` aceita: o legado **nao** exige mapa. Por isso
 * {@link DadosDoConjunto} se le de lista como de mapa — uma lista simplesmente
 * nao tem identificador de configuracao nenhum.
 *
 * E ⚠️ **o `false` e a falha convergem para o mesmo lugar no chamador**:
 * `changeset_data()` descarta o erro e usa `array()` (`:1183`-`:1185`), logo
 * conteudo ilegivel se comporta como conjunto vazio. Quem construir T003 nao
 * transforma isso em excecao — e **P7**: *"preserve o modo de falha, inclusive o
 * silencio"*.
 */
export function lerDadosDoConjunto(conteudo: string): LeituraDosDadosDoConjunto {
  let analisado: unknown;
  try {
    // Coluna vazia cai aqui, e e `json_parse_error` — nao `expected_array`:
    // `json_decode( '' )` devolve nulo **com** erro de sintaxe, e e o erro que o
    // legado reporta (`:1139`-`:1142`). A ordem dos dois ramos e a dele.
    analisado = JSON.parse(conteudo);
  } catch {
    return { ok: false, erro: 'json_parse_error' };
  }
  if (analisado === null || typeof analisado !== 'object') {
    // `if ( ! is_array( $changeset_data ) ) { return new WP_Error(
    // 'expected_array' ); }` (`:1144`): JSON valido que nao e arranjo —
    // `"texto"`, `42`, `true`, `null`.
    return { ok: false, erro: 'expected_array' };
  }
  return { ok: true, dados: analisado as DadosDoConjunto };
}

/**
 * O que vai para `post_content`:
 * `wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT )`
 * (`class-wp-customize-manager.php:2921`).
 *
 * As tres decisoes de byte, cada uma observavel na coluna:
 *
 * 1. **`JSON_PRETTY_PRINT`** — recuo de **quatro** espacos e `": "` depois da
 *    chave, que e o que PHP emite e o que `JSON.stringify(v, null, 4)` tambem
 *    emite. O comentario do legado diz que o outro flag e *"only to improve
 *    readability as slashes needn't be escaped in storage"*.
 * 2. **`JSON_UNESCAPED_SLASHES`** — `/` sai cru. JavaScript tambem nao o escapa,
 *    logo nao ha nada a fazer; esta escrito porque, **sem** o flag, PHP
 *    escaparia, e um porte que "normalize" isto para `\/` divergiria.
 * 3. 🔴 **`JSON_UNESCAPED_UNICODE` NAO foi passado**, logo PHP escapa todo
 *    caractere fora de ASCII como `\uXXXX`, em **minusculas**, e com par
 *    *surrogate* fora do BMP. JavaScript nao escapa nada disso por default, e e
 *    a unica das tres que exige codigo: {@link escaparForaDeAscii}. Um titulo de
 *    menu acentuado dentro do conjunto e o caso comum.
 *
 * ⚠️ **Mapa vazio sai como `[]`, nao como `{}`.** No legado `$data` nasce
 * `array()` (`:2813`-`:2816`) e PHP serializa arranjo vazio como lista, logo o conjunto
 * sem alteracao nenhuma grava `[]` — que `json_decode(..., true)` le de volta
 * como arranjo vazio. Emitir `{}` seria divergir no primeiro byte do conteudo do
 * conjunto recem-salvo.
 *
 * Dois limites registrados, nenhum dos dois alcancado pelo dado desta feature e
 * nenhum dos dois decidido aqui: o analisador do PHP tem profundidade maxima de
 * aninhamento, que e propriedade do runtime e nao linha de codigo do legado; e
 * identificador de configuracao que seja **a representacao decimal de um
 * inteiro** sai antes dos outros em JavaScript, porque chave inteira e ordenada
 * numericamente no objeto — a mesma armadilha que
 * `plataforma/serializacao.normalizarChaveDeTexto` documenta para o outro
 * formato. Nenhuma configuracao do nucleo tem identificador assim.
 */
export function conteudoDoConjunto(dados: DadosDoConjunto): string {
  if (Object.keys(dados).length === 0) {
    return '[]';
  }
  return escaparForaDeAscii(JSON.stringify(dados, null, 4));
}

/**
 * O escape de nao-ASCII que `json_encode()` aplica sem
 * `JSON_UNESCAPED_UNICODE`.
 *
 * Por unidade de codigo UTF-16, que e exatamente como PHP emite o par
 * *surrogate* para caractere fora do BMP, e com digito hexadecimal em
 * **minusculas**, que e o que PHP usa. Aplica-se ao texto ja codificado: nenhum
 * caractere fora de ASCII pode aparecer na saida de `JSON.stringify` fora do
 * conteudo de uma cadeia.
 */
export function escaparForaDeAscii(json: string): string {
  let saida = '';
  for (let indice = 0; indice < json.length; indice += 1) {
    const unidade = json.charCodeAt(indice);
    saida +=
      unidade > 0x7f
        ? `\\u${unidade.toString(16).padStart(4, '0')}`
        : json.charAt(indice);
  }
  return saida;
}

/**
 * Uma linha de `posts` lida como conjunto de alteracoes, com as 23 colunas.
 *
 * `estado` e `tipo` sao `string` e **nao** os tipos fechados do vocabulario, pela
 * mesma razao que `anexo.ts` de BC-04 declara: as duas colunas sao `varchar(20)`
 * sem `ENUM` e sem `CHECK` (`DB-ENUM`, BR-MIGRAR-075), e o legado **tolera**
 * valor nao registrado em vez de recusar. `EstadoAceitoNaEscrita` descreve o que
 * a escrita admite, nao o dominio da coluna.
 */
export interface ConjuntoDeAlteracoes {
  readonly id: number;
  /** `post_author` — de onde vem *"herdar autor"*. Orfao e estado normal (P5). */
  readonly autorId: number;
  /** `post_date` — pode ser {@link DATA_SENTINELA}. */
  readonly data: string;
  readonly dataGmt: string;
  /** `post_content` — o **JSON** das alteracoes. Ver {@link lerDadosDoConjunto}. */
  readonly conteudo: string;
  /** `post_title` — o titulo que o ator pode dar ao conjunto (`:2922`-`:2924`). */
  readonly titulo: string;
  readonly resumo: string;
  /** `post_status` — um dos cinco de `estado-do-conjunto.ts`, ou `trash`. */
  readonly estado: string;
  readonly estadoDeComentario: string;
  readonly estadoDeNotificacao: string;
  readonly senha: string;
  /**
   * `post_name` — **o identificador (UUID) do conjunto**, e nao um identificador
   * legivel.
   *
   * E a decisao que a unidade `customize/changeset-do-customizer` chama de *"a
   * decisao arquitetural mais economica do modulo"*: *"alteracoes pendentes
   * vivem num post de tipo proprio identificado por **UUID**, o que da
   * versionamento, agendamento e lock sem mecanismo novo"*. Um filtro do proprio
   * legado existe so para impedir que a coluna seja perdida quando um
   * colaborador salva como pendente
   * (`_wp_customize_changeset_filter_insert_post_data`,
   * `wp-includes/theme.php:3722`).
   */
  readonly identificador: string;
  readonly aPingar: string;
  readonly pingados: string;
  readonly modificadoEm: string;
  readonly modificadoEmGmt: string;
  readonly conteudoFiltrado: string;
  /**
   * `post_parent` — `0` no conjunto, e **o conjunto** na revisao dele.
   *
   * O tipo nao e hierarquico (`tipo-do-conjunto.ts`), logo o conjunto nao tem
   * pai; a coluna so e lida quando a linha e uma **revisao** de salvamento
   * automatico, e ai ela aponta para o conjunto (`:1131`-`:1134`). E uma das
   * tres semanticas da auto-referencia de `posts`.
   */
  readonly paiId: number;
  readonly endereco: string;
  readonly ordemNoMenu: number;
  /** `post_type` — `customize_changeset` nesta linha. Lido, nao presumido. */
  readonly tipo: string;
  readonly tipoMime: string;
  readonly contagemDeComentarios: number;
}

/**
 * Os campos que `save_changeset_post()` informa quando a linha nasce ou muda
 * (`class-wp-customize-manager.php:2919`-`:2952`).
 *
 * **Isto e a forma do pedido, nao de uma escrita deste repositorio.** O pedido
 * atravessa `wp_insert_post()`, `wp_update_post()` ou
 * `wp_create_post_autosave()`, que sao caminho de `BC-01` — com os pontos de
 * extensao, a geracao de revisao e o `wp_slash()` que eles carregam. Esta aqui
 * porque e a forma que T002 entrega e **T005** preenche.
 *
 * As tres regras de data do legado (`:2937`-`:2952`) **nao** estao nesta
 * estrutura, porque sao regra e nao forma, e cada uma e de uma tarefa: aplicar
 * zera as duas colunas para {@link DATA_SENTINELA}; agendar grava a data pedida
 * em GMT e a local traduzida; e salvar sobre rascunho automatico **empurra a
 * data para agora e deixa a de GMT vazia**, de proposito, *"preserving it from
 * garbage-collection via wp_delete_auto_drafts()"*.
 */
export interface PedidoDoConjunto {
  /** `ID` — ausente quando a linha nasce (`:2927`-`:2931`). */
  readonly id?: number;
  /** `post_type` — informado **so** na insercao. */
  readonly tipo?: string;
  /** `post_name` — o identificador, informado **so** na insercao. */
  readonly identificador?: string;
  /** `post_status`. */
  readonly estado?: string;
  /** `post_title` — informado so quando o ator deu um titulo. */
  readonly titulo?: string;
  /** `post_content` — ver {@link conteudoDoConjunto}. */
  readonly conteudo: string;
  /** `post_date`. */
  readonly data?: string;
  /** `post_date_gmt`. */
  readonly dataGmt?: string;
  /**
   * `edit_date` — `true` na atualizacao, *"Prevent date clearing"* (`:2975`).
   *
   * Nao e coluna: e campo do pedido que `wp_update_post()` consome. Esta aqui
   * porque sem ele a atualizacao do conjunto perderia a data, que e o oposto do
   * que o legado faz.
   */
  readonly preservarData?: boolean;
}

export interface RepositorioDoConjunto {
  /**
   * `UPDATE {site}posts SET post_status = 'trash' WHERE ID = ?` — a escrita que
   * `trash_changeset_post()` faz **direto na tabela**
   * (`class-wp-customize-manager.php:3105`).
   *
   * ⚠️ **E so a coluna de estado.** A sequencia inteira de
   * `trash_changeset_post()` tem, alem dela, dois metadados
   * (`_wp_trash_meta_status` e `_wp_trash_meta_time`, `:3101`-`:3102`), oito
   * pontos de extensao, o descarte dos comentarios e um ramo que **apaga em vez
   * de descartar** quando a lixeira esta desligada (`if ( ! EMPTY_TRASH_DAYS )`,
   * `:3082`). Nada disso esta aqui, e por tres motivos diferentes:
   *
   * - os dois metadados sao `add_post_meta()`, caminho de `BC-01`;
   * - o numero da lixeira (**30 dias**, e `0` desligando-a) e da feature `005`,
   *   e o **P6** proibe redeclara-lo — *"onde o legado nao tem numero, o sistema
   *   novo tambem nao tem"*, e onde tem, ele tem **um** lugar;
   * - **quando** emitir este comando e regra de T005/T007, e esta amarrada ao
   *   conflito de CA-3.3 que `../README.md` registra como aberto.
   *
   * Devolve as linhas afetadas, como as escritas de BC-04.
   */
  levarParaALixeira(id: number): number;
}

export function criarRepositorioDoConjunto(
  dados: PortaDeDados,
): RepositorioDoConjunto {
  const tabela = tabelaDeConteudo(dados);

  return {
    levarParaALixeira(id) {
      return dados.escrever({
        texto: `UPDATE ${tabela} SET post_status = ? WHERE ID = ?`,
        parametros: [ESTADO_NA_LIXEIRA, id],
      }).linhasAfetadas;
    },
  };
}

/**
 * A linha como {@link ConjuntoDeAlteracoes}, sem interpretar nada alem do tipo
 * da coluna.
 *
 * Nao ha traducao de valor nenhuma: o estado nao e validado contra a maquina, o
 * identificador nao e conferido contra {@link FORMA_DO_IDENTIFICADOR_DO_CONJUNTO}
 * e o conteudo **nao** e analisado como JSON. O que entra na coluna sai da
 * coluna — e as tres guardas acontecem nos lugares em que o legado as faz, que
 * sao outros.
 */
export function lerConjuntoDeAlteracoes(
  linha: LinhaDeResultado,
): ConjuntoDeAlteracoes {
  return {
    id: comoInteiro(linha['ID']),
    autorId: comoInteiro(linha['post_author']),
    data: comoTexto(linha['post_date']),
    dataGmt: comoTexto(linha['post_date_gmt']),
    conteudo: comoTexto(linha['post_content']),
    titulo: comoTexto(linha['post_title']),
    resumo: comoTexto(linha['post_excerpt']),
    estado: comoTexto(linha['post_status']),
    estadoDeComentario: comoTexto(linha['comment_status']),
    estadoDeNotificacao: comoTexto(linha['ping_status']),
    senha: comoTexto(linha['post_password']),
    identificador: comoTexto(linha['post_name']),
    aPingar: comoTexto(linha['to_ping']),
    pingados: comoTexto(linha['pinged']),
    modificadoEm: comoTexto(linha['post_modified']),
    modificadoEmGmt: comoTexto(linha['post_modified_gmt']),
    conteudoFiltrado: comoTexto(linha['post_content_filtered']),
    paiId: comoInteiro(linha['post_parent']),
    endereco: comoTexto(linha['guid']),
    ordemNoMenu: comoInteiro(linha['menu_order']),
    tipo: comoTexto(linha['post_type']),
    tipoMime: comoTexto(linha['post_mime_type']),
    contagemDeComentarios: comoInteiro(linha['comment_count']),
  };
}
