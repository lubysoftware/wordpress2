/**
 * `WP_Speculation_Rules` inteira — a estrutura que acumula as regras por modo,
 * as quatro validacoes de identificador, modo, agressividade e fonte, e a forma
 * em que ela sai para o navegador
 * (`wp-includes/class-wp-speculation-rules.php:16-299`).
 *
 * Entrega de **T015** (US-7). E o que CA-7.1 chama de *"declaracao"*: a
 * estrutura que diz **quais destinos** podem ser pre-buscados e **com que
 * agressividade**.
 *
 * ---
 *
 * ## Por que isto e um coletor mutavel, e nao um valor
 *
 * Porque a acao `wp_load_speculation_rules` recebe o objeto para **acrescentar**
 * regra (`speculative-loading.php:317`), e o docblock de `:186-187` declara que
 * e assim que se acrescenta: *"Additional speculation rules other than the
 * default rule from WordPress Core can be provided by using the
 * {@see 'wp_load_speculation_rules'} action and amending the passed
 * WP_Speculation_Rules object."* Um valor congelado tiraria do ponto de
 * extensao a capacidade de alterar o resultado, que e o que o **P2** cobra.
 *
 * ⚠️ E **nao** e estado de modulo: o coletor nasce dentro de
 * `wp_get_speculation_rules()` (`:262`), vive uma requisicao e morre com ela.
 * BR-MIGRAR-105 (`EXT-CONTEXTO`) continua respeitado — nada aqui e criado no
 * carregamento nem compartilhado entre composicoes.
 *
 * ## As dez recusas de `add_rule()` sao nove mensagens e uma unica forma
 *
 * `add_rule()` devolve **booleano** e nunca lanca: toda recusa e `false` mais um
 * `_doing_it_wrong()`. O aviso e da plataforma — o barramento que o dispara nao
 * existe nesta arvore —, e o que e observavel aqui e o retorno **e o fato de a
 * regra nao ter entrado**. {@link RecusaDeRegra} registra qual recusa foi, pela
 * mesma razao que `PassoDaProcura` registra a procura em T005: sem o registro,
 * nenhuma assercao distingue "recusou por identificador" de "recusou por modo",
 * e as duas sao posicoes diferentes do codigo. A divisao e a de
 * `contextos/classificacao/registro/registro-de-contextos.ts` — *"o aviso de
 * uso indevido e da plataforma; a recusa, que e o observavel, esta aqui"*.
 *
 * ## 🔴 Dois quirks que um porte "limpo" apaga em silencio
 *
 * 1. **Identificador de um caractere e invalido.** A expressao e
 *    `/^[a-z][a-z0-9_-]+$/` (`:255`), com `+` e nao `*`: `'main'` passa, `'a'`
 *    **nao**. Nenhum identificador do nucleo tem um caractere, e quem estende
 *    recebe `false` sem saber por que.
 * 2. **A expressao aceita uma quebra de linha no fim.** O `$` do dialeto do
 *    legado casa no fim do texto **ou imediatamente antes de uma quebra de
 *    linha final**, logo `"main\n"` e identificador valido e entra na estrutura
 *    com a quebra dentro. Esta reproduzido — ver {@link identificadorDeRegraValido}.
 */

import {
  agressividadeValida,
  fonteValida,
  modoValido,
  AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO,
} from './configuracao-da-pre-busca.js';

/**
 * Uma condicao de regra, nas quatro formas que o nucleo monta
 * (`speculative-loading.php:264-295`).
 *
 * | forma | o que e |
 * |---|---|
 * | `href_matches` | um padrao de endereco, ou uma lista deles |
 * | `selector_matches` | um seletor CSS, aplicado ao elemento do link |
 * | `not` | a negacao de outra condicao |
 * | `and` | a conjuncao de varias |
 *
 * ⚠️ A especificacao do navegador tem mais formas, e o legado **nao** valida
 * condicao nenhuma: `add_rule()` olha so `where`, `urls`, `source` e
 * `eagerness`. Uma condicao que o nucleo nao monta atravessa intacta, e e por
 * isso que {@link RegraDePreBusca} tem indice aberto.
 */
export type CondicaoDeRegra =
  | { readonly href_matches: string | readonly string[] }
  | { readonly selector_matches: string }
  | { readonly not: CondicaoDeRegra }
  | { readonly and: readonly CondicaoDeRegra[] };

/**
 * Uma regra — o `array<string, mixed>` de `add_rule()` (`:70`).
 *
 * Os quatro campos nomeados sao os que a validacao olha; o indice aberto e o
 * `mixed` do legado, e existe porque uma regra de terceiro com campo que o
 * nucleo nao conhece **entra** na estrutura e chega ao navegador.
 */
export interface RegraDePreBusca {
  /** `'list'` ou `'document'`. Ausente, a fonte e implicita (ver `:116-117`). */
  readonly source?: string;
  /** A condicao, para fonte `document`. */
  readonly where?: CondicaoDeRegra;
  /** Os enderecos, para fonte `list`. */
  readonly urls?: readonly string[];
  /** A agressividade desta regra. */
  readonly eagerness?: string;
  readonly [campo: string]: unknown;
}

/**
 * O que `jsonSerialize()` devolve (`class-wp-speculation-rules.php:236-244`):
 * um mapa de `modo => lista de regras`, **sem** os identificadores.
 *
 * O comentario do legado diz por que os identificadores saem: *"Strip the IDs
 * for JSON output, since they are not relevant for the Speculation Rules API"*
 * (`:237`). Eles existem so para `has_rule()` recusar duplicata.
 *
 * ⚠️ **Mapa vazio nao sai como objeto vazio.** `array_map` sobre arranjo vazio
 * devolve arranjo vazio, e `json_encode( array() )` e `[]`, nao `{}`. O caso
 * nao e alcancavel por este modulo — `wp_get_speculation_rules()` sempre
 * acrescenta a regra `main` antes de devolver —, e a conversao em si e do
 * codificador, que e da plataforma. Ver `./declarar-pre-busca.ts`.
 */
export type RegrasParaJson = Readonly<
  Record<string, readonly RegraDePreBusca[]>
>;

/**
 * Por que `add_rule()` devolveu `false`, com a posicao de cada recusa.
 *
 * ⚠️ `'where-ou-urls'` cobre **duas** condicoes com **uma** mensagem, e e assim
 * no legado: nenhum dos dois campos, ou os dois juntos, caem no mesmo
 * `_doing_it_wrong()` de `:119-134`. Separa-los aqui inventaria uma distincao
 * que quem estende nao observa.
 */
export type MotivoDaRecusa =
  /** `! self::is_valid_mode( $mode )` (`:74-85`). */
  | 'modo-invalido'
  /** `! $this->is_valid_id( $id )` (`:87-98`). */
  | 'identificador-invalido'
  /** `$this->has_rule( $mode, $id )` (`:100-111`). */
  | 'identificador-repetido'
  /** Nenhum de `where`/`urls`, ou os dois (`:119-134`). */
  | 'where-ou-urls'
  /** `! self::is_valid_source( $rule['source'] )` (`:136-147`). */
  | 'fonte-invalida'
  /** Fonte `list` com `where` (`:149-161`). */
  | 'lista-com-where'
  /** Fonte `document` com `urls` (`:163-175`). */
  | 'documento-com-urls'
  /** `! self::is_valid_eagerness( $rule['eagerness'] )` (`:180-191`). */
  | 'agressividade-invalida'
  /** `where` mais `'immediate'` (`:193-204`). */
  | 'imediato-no-documento';

/**
 * Uma recusa registrada.
 *
 * **Nao e superficie do legado**: la a recusa e `false` mais um aviso de uso
 * indevido. E registro, e nenhuma decisao deste modulo o le — o **P7** fixa
 * esse limite: *"nenhuma decisao do sistema pode passar a depender"* do
 * diagnostico acrescentado.
 */
export interface RecusaDeRegra {
  readonly motivo: MotivoDaRecusa;
  readonly modo: string;
  readonly identificador: string;
}

/**
 * `WP_Speculation_Rules::is_valid_id( $id )` (`:254-256`).
 *
 * `/^[a-z][a-z0-9_-]+$/`, com os dois quirks do cabecalho deste arquivo: dois
 * caracteres no minimo, e uma quebra de linha final aceita porque o `$` do
 * dialeto do legado casa antes dela.
 */
export function identificadorDeRegraValido(identificador: string): boolean {
  return /^[a-z][a-z0-9_-]+\n?$/.test(identificador);
}

/** `isset( $rule[ $campo ] )` — campo ausente **ou** nulo. */
function campoDefinido(regra: RegraDePreBusca, campo: string): boolean {
  const valor = regra[campo];
  return valor !== undefined && valor !== null;
}

/** O coletor de regras, com a identidade que o ponto de extensao recebe. */
export interface ConjuntoDeRegrasDePreBusca {
  /**
   * `WP_Speculation_Rules::add_rule( $mode, $id, $rule )` (`:73-213`).
   *
   * Devolve `true` quando a regra entrou e `false` em cada uma das recusas de
   * {@link MotivoDaRecusa} — nunca lanca.
   */
  adicionarRegra(
    modo: string,
    identificador: string,
    regra: RegraDePreBusca,
  ): boolean;
  /** `WP_Speculation_Rules::has_rule( $mode, $id )` (`:224-226`). */
  temRegra(modo: string, identificador: string): boolean;
  /** `WP_Speculation_Rules::jsonSerialize()` (`:236-244`). */
  paraJson(): RegrasParaJson;
  /** As recusas, na ordem em que aconteceram. Ver {@link RecusaDeRegra}. */
  recusas(): readonly RecusaDeRegra[];
}

/**
 * `new WP_Speculation_Rules()` (`speculative-loading.php:262`).
 *
 * Nasce vazia: `$rules_by_mode = array()` (`:26`).
 */
export function criarConjuntoDeRegrasDePreBusca(): ConjuntoDeRegrasDePreBusca {
  /**
   * `$rules_by_mode` — um mapa de `modo => (identificador => regra)`.
   *
   * ⚠️ A ordem de insercao e preservada nos dois niveis, e ela **chega ao
   * navegador**: `jsonSerialize()` nao ordena nada. No interpretador de origem
   * isso e a ordem do arranjo; aqui e a do `Map`.
   */
  const regrasPorModo = new Map<string, Map<string, RegraDePreBusca>>();
  const recusas: RecusaDeRegra[] = [];

  function recusar(
    motivo: MotivoDaRecusa,
    modo: string,
    identificador: string,
  ): false {
    recusas.push(Object.freeze({ motivo, modo, identificador }));
    return false;
  }

  function temRegra(modo: string, identificador: string): boolean {
    return regrasPorModo.get(modo)?.has(identificador) ?? false;
  }

  return {
    temRegra,

    adicionarRegra(modo, identificador, regra) {
      // `:74-85`.
      if (!modoValido(modo)) {
        return recusar('modo-invalido', modo, identificador);
      }
      // `:87-98`.
      if (!identificadorDeRegraValido(identificador)) {
        return recusar('identificador-invalido', modo, identificador);
      }
      // `:100-111`.
      if (temRegra(modo, identificador)) {
        return recusar('identificador-repetido', modo, identificador);
      }

      // `:119-134` — "either a 'where' key or a 'urls' key, but not both".
      const temWhere = campoDefinido(regra, 'where');
      const temUrls = campoDefinido(regra, 'urls');
      if (temWhere === temUrls) {
        return recusar('where-ou-urls', modo, identificador);
      }

      // `:135-176` — o bloco inteiro so roda com `source` informado, e e por
      // isso que uma regra SEM `source` nao e checada contra `where`/`urls`: a
      // fonte fica implicita, como o comentario de `:116-117` declara.
      if (campoDefinido(regra, 'source')) {
        const fonte = regra.source;
        // 🔴 `is_valid_source()` declara `string $source` e o legado nao declara
        // tipos estritos: numero e booleano sao CONVERTIDOS para texto antes da
        // comparacao e caem nesta mesma recusa (`'0'` e `'1'` nao estao na
        // lista), mas arranjo e objeto sao erro fatal do interpretador, nao
        // recusa. Aqui os tres casos sao recusa; o erro fatal e do oraculo
        // executavel (`ESC-ORACULO`, resposta 16).
        if (typeof fonte !== 'string' || !fonteValida(fonte)) {
          return recusar('fonte-invalida', modo, identificador);
        }
        if (fonte === 'list' && temWhere) {
          return recusar('lista-com-where', modo, identificador);
        }
        if (fonte === 'document' && temUrls) {
          return recusar('documento-com-urls', modo, identificador);
        }
      }

      // `:178-205`.
      if (campoDefinido(regra, 'eagerness')) {
        if (!agressividadeValida(regra.eagerness)) {
          return recusar('agressividade-invalida', modo, identificador);
        }
        if (temWhere && regra.eagerness === AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO) {
          return recusar('imediato-no-documento', modo, identificador);
        }
      }

      // `:207-212`.
      let doModo = regrasPorModo.get(modo);
      if (doModo === undefined) {
        doModo = new Map<string, RegraDePreBusca>();
        regrasPorModo.set(modo, doModo);
      }
      doModo.set(identificador, regra);
      return true;
    },

    paraJson() {
      const saida: Record<string, readonly RegraDePreBusca[]> = {};
      for (const [modo, doModo] of regrasPorModo) {
        // `array_filter( $this->rules_by_mode )` (`:242`): modo sem regra
        // nenhuma e arranjo vazio, que e falso, e sai do resultado.
        if (doModo.size === 0) {
          continue;
        }
        // `array_values( $rules )` (`:240`) — os identificadores saem.
        saida[modo] = Object.freeze([...doModo.values()]);
      }
      return Object.freeze(saida);
    },

    recusas() {
      return Object.freeze([...recusas]);
    },
  };
}
