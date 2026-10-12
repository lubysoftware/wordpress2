/**
 * A semantica do motor de expressao regular da linguagem de origem, e a das
 * tres funcoes de texto de que `wp-includes/shortcodes.php` depende —
 * `preg_quote`, a forma do arranjo de `preg_match`, `preg_replace_callback`,
 * `preg_split` com `PREG_SPLIT_DELIM_CAPTURE`, `strtr` com arranjo e
 * `stripcslashes`.
 *
 * Entrega de **T017** (US-8). Nenhuma delas esta em `wp-includes/`: as seis sao
 * do interpretador, e e a mesma fronteira que
 * `../consulta/semantica-de-php.ts` registra para `empty()` e o molde `(int)`,
 * e que `../traducao-de-endereco/cadeia-de-consulta.ts` registra para
 * `parse_str`. O corpo nao esta na arvore analisada, e a divergencia de borda so
 * aparece no oraculo executavel (`ESC-ORACULO`, `BR-MIGRAR-116`, resposta 16 —
 * T001 da feature `015`, `scripts/oraculo/`).
 *
 * ---
 *
 * ## Por que isto nao mora em `plataforma/utilitarios/`
 *
 * Porque a pasta nao existe, e criar camada e decisao de quem tiver as 15
 * features na mao. Sao agora **quatro** irmaos esperando a pasta —
 * `contextos/conteudo/gravacao/verdade-de-php.ts`, o gemeo dele em `BC-05`,
 * `../consulta/semantica-de-php.ts` e este — e nenhum deles importa o outro,
 * porque a regra de dependencia 3 de `target_architecture.md` proibe
 * `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*. Quando a
 * pasta existir os quatro descem juntos e nenhuma chamada muda de resultado.
 *
 * ## ⚠️ Os tres pontos em que PCRE e a expressao regular deste runtime divergem
 *
 * O porte de `get_shortcode_regex()` e de `get_html_split_regex()` atravessa
 * tres diferencas de motor, e cada uma esta resolvida num lugar declarado:
 *
 * | diferenca | onde aparece | como foi resolvida |
 * |---|---|---|
 * | **quantificador possessivo** (`*+`, `++`) | `[^\[]*+` e `(?:...)*+` do grupo 5 de `get_shortcode_regex`; o `++` da varredura de marcas; os tres de `get_html_split_regex` | cai para o guloso comum, pela prova abaixo |
 * | **subpadrao condicional** (`(?(?=...)A|B)`) | `get_html_split_regex`, duas vezes | reescrito como alternancia ordenada em `./html-do-corpo.ts`, onde esta a prova de equivalencia |
 * | **`\s` e `\S`** | `get_shortcode_atts_regex`, `wp_kses_hair_parse`, `wp_kses_attr_parse` | {@link ESPACO_DO_PCRE}, porque o `\s` deste runtime casa espaco Unicode e o de PCRE sem `/u` **nao** |
 *
 * ### A prova de que trocar `*+` por `*` nao muda resultado aqui
 *
 * O possessivo proibe o retrocesso. Ele so muda o resultado quando o retrocesso
 * levaria a um casamento que o possessivo recusa, e nos padroes daqui ele nunca
 * leva, por duas razoes que valem caso a caso:
 *
 * 1. **`[^X]*+` seguido de algo que exige `X`.** Devolver um caractere obriga o
 *    `X` a casar com um caractere que a classe negada acabou de aceitar, isto e,
 *    com um nao-`X`. Impossivel. Vale para `[^\[]*+` antes de `\[`, para
 *    `[^\]]*+` antes de `]` e para `[^\-]*+` antes de `-`.
 * 2. **`(?:\[(?!FIM)...)*+` seguido de `FIM`.** Cada volta comeca casando `\[`
 *    com a condicao `(?!FIM)` verdadeira naquela posicao. Devolver uma volta poe
 *    o motor exatamente naquela posicao e exige `FIM` ali — que a condicao
 *    negativa da propria volta acabou de negar. Impossivel. Vale para o grupo 5
 *    de `get_shortcode_regex` e para os dois lacos de `get_html_split_regex`,
 *    onde o que vem depois do laco e opcional e portanto nunca falha.
 *
 * O `++` da varredura de marcas (`@\[([^<>&/\[\]\x00-\x20=]++)@`,
 * `wp-includes/shortcodes.php:255`) e o caso trivial: nao ha nada depois dele no
 * padrao, logo nao ha o que retroceder.
 *
 * 🔴 **O que a prova NAO cobre e o custo.** O possessivo tambem existe por
 * desempenho, e sem ele um corpo patologico custa mais tempo neste runtime do
 * que no interpretador. Nao e comportamento observavel, e introduzir aqui um
 * teto de tamanho ou de tempo seria inventar numero que o legado nao tem (P6, e
 * a tabela *Nao negociavel* da constituicao). Fica declarado, nao resolvido.
 */

/**
 * A classe `\s` de PCRE **sem** o modificador `/u`, que e como o legado a usa.
 *
 * ⚠️ `\s` deste runtime casa espaco Unicode — `\u00a0`, `\u2000`, `\ufeff` e
 * mais quinze — e o de PCRE sem `/u` casa **somente** estes seis. A diferenca e
 * observavel em `shortcode_parse_atts`, onde o atributo
 * `[marca id=1\u2003chave=2]` tem, no interpretador, `1\u2003chave` como valor
 * de `id`, e teria `1` com o `\s` deste runtime.
 *
 * O `\x0b` (tabulacao vertical) entrou em `\s` na versao 8.34 do PCRE, anterior
 * a qualquer versao do interpretador que o legado aceita.
 */
export const ESPACO_DO_PCRE = ' \\t\\n\\r\\f\\x0b';

/** `[\s]` de PCRE. */
export const CLASSE_DE_ESPACO = `[${ESPACO_DO_PCRE}]`;

/** `[\S]` de PCRE. */
export const CLASSE_DE_NAO_ESPACO = `[^${ESPACO_DO_PCRE}]`;

/**
 * Os caracteres que `preg_quote()` protege, na lista da versao 8 do
 * interpretador.
 *
 * O `#` entrou na versao 7.3 e o `/` tambem; os demais estao ali desde sempre.
 * A lista importa porque o nome de uma marca **pode** conter quase todos eles:
 * `add_shortcode()` recusa somente `<>&/[]=` e os controles ate `\x20`
 * (`wp-includes/shortcodes.php:75`), logo `.`, `+`, `*`, `?`, `^`, `$`, `(`,
 * `)`, `{`, `}`, `!`, `|`, `:`, `-`, `#` e a propria barra invertida chegam a
 * `implode( '|', array_map( 'preg_quote', $tagnames ) )` (`:330`) e precisam
 * sair protegidos.
 */
const CARACTERES_PROTEGIDOS = '.\\+*?[^]$(){}=!<>|:-#/';

/**
 * `preg_quote( $texto )`.
 *
 * ⚠️ **A protecao sai na forma de PCRE, nao na forma deste runtime**, e os dois
 * concordam: `\=`, `\!`, `\<`, `\>`, `\:`, `\-`, `\#` e `\/` sao escapes de
 * identidade validos numa expressao regular **sem** a bandeira `u`, e nenhuma
 * expressao desta tarefa a usa. Com `u` eles seriam erro de sintaxe, e e por
 * isso que `./regex-de-macro.ts` nao a liga.
 *
 * O byte nulo vira `\000`, como no interpretador. Ele nao alcanca o nome de uma
 * marca — `\x00-\x20` esta entre os recusados —, e esta aqui porque
 * `preg_quote()` o trata assim e um porte que o perdesse mentiria sobre a
 * funcao.
 */
export function protegerParaRegex(texto: string): string {
  let saida = '';
  for (const caractere of texto) {
    if (caractere === '\0') {
      saida += '\\000';
      continue;
    }
    saida += CARACTERES_PROTEGIDOS.includes(caractere)
      ? `\\${caractere}`
      : caractere;
  }
  return saida;
}

/**
 * Um achado na forma do arranjo que `preg_match()` e `preg_replace_callback()`
 * entregam.
 *
 * Posicao ausente e `undefined`; posicao presente e sempre texto, inclusive
 * texto vazio. Ver {@link achadoComoNoPhp} para a regra que decide qual e qual,
 * que **nao** e a deste runtime.
 */
export type AchadoDoPhp = readonly (string | undefined)[];

/**
 * Converte o achado deste runtime na forma do arranjo do interpretador.
 *
 * ⚠️ **As duas formas discordam, e a diferenca decide um argumento que todo
 * tratador de macro recebe.** PCRE devolve *"um mais que o maior grupo que foi
 * fixado"*, e um grupo que casou texto vazio **foi** fixado; o interpretador
 * entao preenche com texto vazio os grupos anteriores que nao participaram e
 * **nao inclui** os posteriores. Este runtime, ao contrario, devolve sempre
 * todas as posicoes, com `undefined` em cada grupo que nao participou.
 *
 * A consequencia em `do_shortcode_tag()`: o grupo 6 de `get_shortcode_regex()` e
 * `(\]?)`, que casa texto vazio em toda ocorrencia e portanto **sempre**
 * participa. Logo o grupo 5 nunca e posterior ao ultimo participante, e
 * `$content = $m[5] ?? null` (`wp-includes/shortcodes.php:432`) devolve **texto
 * vazio**, e nao nulo, para `[marca]` e para `[marca /]`. O `?? null` daquela
 * linha e, no interpretador, codigo morto — e um tratador que teste
 * `null === $content` nunca ve verdade.
 *
 * 🔴 **E o unico ponto desta tarefa em que a paridade esta derivada e nao
 * conferida.** A derivacao esta escrita acima, e o que a confirma caso a caso e
 * o oraculo executavel da resposta 16 (`scripts/oraculo/`): um tratador que
 * registre `var_export( $content )` para `[marca]` encerra a questao. Ate la o
 * porte segue a **semantica** da linha, nao um palpite sobre a saida dela, que e
 * o que esta funcao existe para preservar.
 */
export function achadoComoNoPhp(achado: RegExpExecArray): AchadoDoPhp {
  let ultimoFixado = 0;
  for (let indice = achado.length - 1; indice > 0; indice -= 1) {
    if (achado[indice] !== undefined) {
      ultimoFixado = indice;
      break;
    }
  }

  const arranjo: (string | undefined)[] = [];
  for (let indice = 0; indice < achado.length; indice += 1) {
    arranjo.push(indice <= ultimoFixado ? (achado[indice] ?? '') : undefined);
  }
  return Object.freeze(arranjo);
}

/**
 * `preg_match_all( $padrao, $texto, $match, PREG_SET_ORDER )`.
 *
 * Um arranjo por ocorrencia, cada um na forma do interpretador
 * ({@link achadoComoNoPhp}). Usada uma vez nesta tarefa, por
 * `shortcode_parse_atts()` (`wp-includes/shortcodes.php:617`), onde a forma do
 * arranjo e o que decide qual dos seis ramos de `:619-631` vale.
 *
 * O valor de verdade que o legado testa em `:617` — `preg_match_all` devolve o
 * numero de ocorrencias, e zero e falso — e o comprimento deste arranjo.
 */
export function acharTodosComoNoPhp(
  expressao: RegExp,
  texto: string,
): readonly AchadoDoPhp[] {
  const global = new RegExp(
    expressao.source,
    expressao.flags.includes('g') ? expressao.flags : `${expressao.flags}g`,
  );

  const achados: AchadoDoPhp[] = [];
  let achado = global.exec(texto);
  while (achado !== null) {
    achados.push(achadoComoNoPhp(achado));
    if (achado[0] === '') {
      global.lastIndex += 1;
    }
    achado = global.exec(texto);
  }
  return Object.freeze(achados);
}

/** O que `preg_replace_callback()` devolve, com o `$count` por referencia. */
export interface SubstituicaoComCallback {
  readonly texto: string;
  /** O `&$count` de `preg_replace_callback` — quantas ocorrencias trocaram. */
  readonly trocas: number;
}

/**
 * `preg_replace_callback( $padrao, $callback, $texto, -1, $count )`.
 *
 * Troca todas as ocorrencias, da esquerda para a direita e sem sobreposicao,
 * entregando ao tratador o arranjo na forma do interpretador
 * ({@link achadoComoNoPhp}).
 *
 * A expressao chega **sem** a bandeira `g`: esta funcao a clona com ela, porque
 * `lastIndex` compartilhado entre chamadas e estado que o laco de
 * `do_shortcodes_in_html_tags()` atravessaria — ele chama a mesma expressao uma
 * vez por elemento e uma vez por atributo (`wp-includes/shortcodes.php:506`,
 * `:537` e `:544`).
 *
 * O avanco forcado no achado de tamanho zero nao e alcancavel por nenhum padrao
 * desta tarefa, porque todos exigem `[` ou `<`; esta aqui para que a funcao nao
 * possa girar sem fim se alguem a reusar.
 */
export function substituirComCallback(
  expressao: RegExp,
  texto: string,
  tratar: (achado: AchadoDoPhp) => string,
): SubstituicaoComCallback {
  const global = new RegExp(
    expressao.source,
    expressao.flags.includes('g') ? expressao.flags : `${expressao.flags}g`,
  );

  let saida = '';
  let posicao = 0;
  let trocas = 0;
  let achado = global.exec(texto);

  while (achado !== null) {
    saida += texto.slice(posicao, achado.index);
    saida += tratar(achadoComoNoPhp(achado));
    posicao = achado.index + achado[0].length;
    trocas += 1;

    if (achado[0] === '') {
      global.lastIndex += 1;
    }
    achado = global.exec(texto);
  }

  return { texto: saida + texto.slice(posicao), trocas };
}

/**
 * `preg_split( $padrao, $texto, -1, PREG_SPLIT_DELIM_CAPTURE )`.
 *
 * A expressao precisa ter **um** grupo de captura, que e o caso de
 * `get_html_split_regex()`, e esse grupo precisa participar em toda ocorrencia —
 * sem isso o `split` deste runtime deixaria `undefined` no meio do arranjo, que
 * e o que o tipo de retorno promete nao ter.
 *
 * Sem `PREG_SPLIT_NO_EMPTY`: o texto vazio entre dois delimitadores, e nas duas
 * pontas, **fica** no arranjo. Os dois motores concordam nisso, e e o que
 * `do_shortcodes_in_html_tags()` depende para remontar o corpo com
 * `implode( '', $textarr )` (`wp-includes/shortcodes.php:568`).
 */
export function separarComDelimitador(
  expressao: RegExp,
  texto: string,
): readonly string[] {
  return texto.split(expressao).map((pedaco) => pedaco ?? '');
}

/**
 * `strtr( $texto, $pares )` — a forma com arranjo, que **nao** e uma sequencia
 * de substituicoes.
 *
 * A regra do interpretador: uma passada so, da esquerda para a direita; em cada
 * posicao tenta a **chave mais longa** primeiro; o que foi escrito nao e
 * reexaminado. Uma cadeia de `replaceAll` e diferente em dois pontos — ela
 * reexamina o que escreveu, e aplica as chaves na ordem do arranjo e nao por
 * tamanho.
 *
 * Nos tres usos desta tarefa (`wp-includes/shortcodes.php:467`, `:472` e `:576`)
 * as duas formas dao o mesmo resultado, porque nenhuma saida contem alguma
 * chave. O porte fiel esta aqui de todo modo: a equivalencia e propriedade
 * daqueles tres pares, nao da funcao, e o proximo par que alguem acrescentar nao
 * a tem de graca.
 */
export function traduzirComoNoPhp(
  texto: string,
  pares: ReadonlyMap<string, string>,
): string {
  const chaves = [...pares.keys()]
    .filter((chave) => chave !== '')
    .sort((primeira, segunda) => segunda.length - primeira.length);
  if (chaves.length === 0) {
    return texto;
  }

  let saida = '';
  let posicao = 0;
  while (posicao < texto.length) {
    const casada = chaves.find((chave) => texto.startsWith(chave, posicao));
    if (casada === undefined) {
      saida += texto[posicao];
      posicao += 1;
      continue;
    }
    saida += pares.get(casada) as string;
    posicao += casada.length;
  }
  return saida;
}

/** Os oito escapes de uma letra que `php_stripcslashes` reconhece, na ordem dela. */
const ESCAPES_DE_C: ReadonlyMap<string, string> = new Map([
  ['n', '\n'],
  ['r', '\r'],
  ['a', '\u0007'],
  ['t', '\t'],
  ['v', '\u000b'],
  ['b', '\b'],
  ['f', '\f'],
  ['\\', '\\'],
]);

const DIGITO_HEXADECIMAL = /^[0-9a-fA-F]$/;
const DIGITO_OCTAL = /^[0-7]$/;

/**
 * `stripcslashes( $texto )`, que `shortcode_parse_atts()` aplica a **todo** valor
 * de atributo (`wp-includes/shortcodes.php:620`, `:622`, `:624`, `:626`, `:628`
 * e `:630`).
 *
 * A ordem das decisoes e a de `php_stripcslashes`, e as tres ultimas sao as que
 * um porte "limpo" erra:
 *
 * | entrada | saida | por que |
 * |---|---|---|
 * | `\n` `\r` `\a` `\t` `\v` `\b` `\f` `\\` | o caractere de controle | os oito casos nomeados |
 * | `\x41` | `A` | hexadecimal, **ate dois** digitos |
 * | `\x` sem digito | `x` | o `case 'x'` cai no default, que varre octal e nao acha nenhum |
 * | `\101` | `A` | **octal**, ate tres digitos, e e o default e nao um caso proprio |
 * | `\777` | `\u00ff` | o molde `(char)` corta em um byte |
 * | `\q` | `q` | o default sem digito octal devolve o proprio caractere, sem a barra |
 * | `\` no fim do texto | `\` | `source + 1 < end` falha e a barra sobrevive |
 *
 * 🔴 **O hexadecimal e o octal produzem BYTE no interpretador e unidade de
 * codigo aqui.** `\xc3` e um byte 0xc3 la, que num corpo em UTF-8 e meio
 * caractere; aqui e `U+00C3`, que e um caractere inteiro. Reproduzir o byte
 * exigiria carregar o corpo como octeto em vez de texto, o que e decisao da
 * borda e nao desta tarefa (o slot `analise-de-html` do
 * [plano](../../../../.specify/specs/004-leitura-publica/plan.md) ainda nao esta
 * escolhido). Para todo valor em ASCII — que e o alcance de `\x` e `\0` num
 * atributo escrito a mao — as duas formas coincidem. O caso de divergencia e do
 * oraculo executavel.
 */
export function textoSemBarraDeC(texto: string): string {
  let saida = '';
  let indice = 0;

  while (indice < texto.length) {
    const atual = texto[indice] as string;
    if (atual !== '\\' || indice + 1 >= texto.length) {
      saida += atual;
      indice += 1;
      continue;
    }

    indice += 1;
    const escapado = texto[indice] as string;

    const nomeado = ESCAPES_DE_C.get(escapado);
    if (nomeado !== undefined) {
      saida += nomeado;
      indice += 1;
      continue;
    }

    if (
      escapado === 'x' &&
      indice + 1 < texto.length &&
      DIGITO_HEXADECIMAL.test(texto[indice + 1] as string)
    ) {
      let digitos = texto[indice + 1] as string;
      indice += 2;
      if (
        indice < texto.length &&
        DIGITO_HEXADECIMAL.test(texto[indice] as string)
      ) {
        digitos += texto[indice] as string;
        indice += 1;
      }
      saida += String.fromCharCode(Number.parseInt(digitos, 16));
      continue;
    }

    // O `default` de `php_stripcslashes`: varre octal a partir do proprio
    // caractere escapado, e devolve o caractere cru quando nao ha digito algum.
    // E aqui que o `case 'x'` sem digito hexadecimal cai.
    let octal = '';
    while (
      indice < texto.length &&
      octal.length < 3 &&
      DIGITO_OCTAL.test(texto[indice] as string)
    ) {
      octal += texto[indice] as string;
      indice += 1;
    }
    if (octal !== '') {
      saida += String.fromCharCode(Number.parseInt(octal, 8) & 0xff);
      continue;
    }
    saida += escapado;
    indice += 1;
  }

  return saida;
}
