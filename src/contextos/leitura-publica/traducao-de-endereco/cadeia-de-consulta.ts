/**
 * A cadeia de consulta de uma regra de traducao, e as quatro operacoes de texto
 * que a transformam em criterios — o trecho `class-wp.php:270-278` do legado:
 *
 * ```php
 * $query = preg_replace( '!^.+\?!', '', $query );
 * $query = addslashes( WP_MatchesMapRegex::apply( $query, $matches ) );
 * $this->matched_query = $query;
 * parse_str( $query, $perma_query_vars );
 * ```
 *
 * Quatro funcoes, quatro responsabilidades, e nenhuma delas e "parse de URL":
 * {@link aplicarCasamentos} (`WP_MatchesMapRegex`, que usa `urlencode`),
 * {@link adicionarBarras} (`addslashes`), {@link analisarCadeiaDeConsulta}
 * (`parse_str`) e {@link decodificarUrl} (`urldecode`, usada tambem na segunda
 * tentativa de casamento, `class-wp.php:239`).
 *
 * ---
 *
 * ## 🔴 Onde o oraculo acaba, e isto precisa estar escrito
 *
 * `urlencode`, `urldecode`, `addslashes` e `parse_str` sao funcoes do
 * **interpretador**, nao do sistema analisado: nao ha linha de
 * `wp-includes/` para citar, porque o corpo delas nao esta nesta arvore. O que
 * esta transcrito aqui e o comportamento documentado de cada uma, e e exatamente
 * o ponto em que a instalacao de referencia executavel (`ESC-ORACULO`,
 * `BR-MIGRAR-116`, resposta 16 — T001 da feature `015`) deixa de ser luxo: uma
 * divergencia de borda aqui nao aparece em nenhum teste desta arvore, aparece
 * como um endereco com acento resolvendo para outro conteudo.
 *
 * Tres fronteiras declaradas, com a consequencia de cada uma:
 *
 * 1. **O legado opera em bytes; este porte opera em texto.** `urlencode` e
 *    `urldecode` do interpretador percorrem byte a byte, e um `%XX` que nao forme
 *    UTF-8 valido sobrevive como byte cru numa string PHP. Aqui ele e decodificado
 *    como UTF-8 tolerante, e byte invalido vira `U+FFFD`. E a mesma fronteira que
 *    `plataforma/serializacao` registra, e o valor so volta a ser bytes na porta
 *    de dados.
 * 2. **O `mangling` de nome de `parse_str` nao e verificavel aqui.** Ponto, espaco
 *    e colchete no nome de um parametro recebem tratamento do interpretador, e so
 *    os dois primeiros estao documentados sem ambiguidade (viram `_`). O colchete
 *    sem par esta marcado no corpo de {@link analisarCadeiaDeConsulta}.
 * 3. **Arranjo com chave nomeada nao e representavel** em `CriteriosDeConsulta`,
 *    que T001 declarou como `string | string[]` — e declarou com razao: a
 *    conversao de escalar do legado (`class-wp.php:338-347`) desce **um** nivel
 *    so. Uma regra de traducao que usasse `nome[chave]=` perde esse criterio
 *    aqui. Nenhuma regra do nucleo usa essa forma; a de colchete vazio
 *    (`nome[]=`), que produz lista, esta reproduzida.
 */

import type {
  CriteriosDeConsulta,
  ValorDeCriterio,
} from '../requisicao/endereco-pedido.js';

/** Os caracteres que `urlencode` nao escapa: alfanumerico mais `-`, `_` e `.`. */
const LITERAL_EM_URLENCODE = /^[A-Za-z0-9_.-]$/;

/** Dois digitos hexadecimais, o que `%` precisa ter a frente para decodificar. */
const PAR_HEXADECIMAL = /^[0-9A-Fa-f]{2}$/;

/**
 * O `urlencode` do interpretador, usado por `WP_MatchesMapRegex::callback()`
 * (`wp-includes/class-wp-matchesmapregex.php:88`).
 *
 * Nao e `encodeURIComponent`: a diferenca esta em sete caracteres — espaco vira
 * `+` (e nao `%20`), e `!`, `~`, `*`, `'`, `(` e `)` sao escapados. Trocar um
 * pelo outro muda a consulta que a regra produz para qualquer conteudo com esses
 * caracteres no identificador.
 */
export function codificarValorDeUrl(valor: string): string {
  let saida = '';
  for (const byte of new TextEncoder().encode(valor)) {
    const caractere = String.fromCharCode(byte);
    if (LITERAL_EM_URLENCODE.test(caractere)) {
      saida += caractere;
    } else if (byte === 0x20) {
      saida += '+';
    } else {
      saida += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return saida;
}

/**
 * O `urldecode` do interpretador, usado na **segunda** tentativa de casamento de
 * cada regra (`wp-includes/class-wp.php:239`).
 *
 * Duas propriedades que nao sao de `decodeURIComponent` e que importam:
 *
 * - `+` vira espaco;
 * - sequencia `%` malformada **nao e erro**: fica literal. `decodeURIComponent`
 *   lancaria, e um porte que a usasse derrubaria a requisicao em vez de nao
 *   casar regra nenhuma — que e o que o legado faz com `/50%-off/`.
 */
export function decodificarUrl(texto: string): string {
  const bytes: number[] = [];
  const codificador = new TextEncoder();

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i] as string;

    if (caractere === '+') {
      bytes.push(0x20);
      continue;
    }

    if (caractere === '%' && PAR_HEXADECIMAL.test(texto.slice(i + 1, i + 3))) {
      bytes.push(Number.parseInt(texto.slice(i + 1, i + 3), 16));
      i += 2;
      continue;
    }

    for (const byte of codificador.encode(caractere)) {
      bytes.push(byte);
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * O `addslashes` do interpretador (`wp-includes/class-wp.php:273`).
 *
 * Escapa apostrofo, aspas, barra invertida e o byte nulo. E heranca das
 * `magic quotes`, e **e observavel**: o identificador `o-grande-o'brien` chega
 * aos criterios como `o-grande-o\'brien`, e e com a barra que a consulta vai ao
 * banco. Tirar a barra "porque nao faz sentido" muda o que a consulta procura.
 */
export function adicionarBarras(texto: string): string {
  let saida = '';
  for (const caractere of texto) {
    if (caractere === "'" || caractere === '"' || caractere === '\\') {
      saida += `\\${caractere}`;
    } else if (caractere === '\0') {
      saida += '\\0';
    } else {
      saida += caractere;
    }
  }
  return saida;
}

/** O que `WP_MatchesMapRegex` procura: `$matches[N]` com `N` comecando em 1. */
const REFERENCIA_DE_CASAMENTO = /\$matches\[[1-9]+[0-9]*\]/g;

/** `'$matches['.length` — o deslocamento do `substr` de `callback()`. */
const INICIO_DO_INDICE = 9;

/**
 * `WP_MatchesMapRegex::apply()`
 * (`wp-includes/class-wp-matchesmapregex.php:65` e `:86-89`).
 *
 * Substitui `$matches[N]` pelo grupo N do casamento, **codificado em URL**.
 * Tres detalhes do legado que mudam o resultado:
 *
 * 1. O padrao e `(\$matches\[[1-9]+[0-9]*\])`: o indice **comeca em 1**, logo
 *    `$matches[0]` nao e referencia e fica literal na consulta.
 * 2. Indice sem grupo correspondente vira **texto vazio**, nao erro — e o
 *    `isset()` de `:88`.
 * 3. O grupo que casou vazio e o grupo que nao casou produzem a mesma coisa (texto
 *    vazio), e e isso que faz os dois dialetos de expressao regular concordarem:
 *    o interpretador do legado preenche grupo interno nao casado com `''`, este
 *    runtime devolve ausencia, e o `isset()` iguala os dois.
 */
export function aplicarCasamentos(
  consulta: string,
  casamentos: readonly (string | undefined)[],
): string {
  return consulta.replace(REFERENCIA_DE_CASAMENTO, (referencia) => {
    const indice = Number.parseInt(
      referencia.slice(INICIO_DO_INDICE, -1),
      10,
    );
    const valor = casamentos[indice];
    return valor === undefined ? '' : codificarValorDeUrl(valor);
  });
}

/**
 * O `mangling` documentado de nome de parametro: ponto e espaco viram `_`.
 *
 * `parse_str( 'Meu Valor=1', $r )` devolve a chave `Meu_Valor`.
 */
function nomeNormalizado(nome: string): string {
  return nome.replace(/[. ]/g, '_');
}

/**
 * `parse_str()` (`wp-includes/class-wp.php:278`, e tambem `:158` quando
 * `extra_query_vars` chega como texto).
 *
 * Traduz a cadeia de consulta nos criterios. O que esta reproduzido:
 *
 * - separacao por `&`, com segmento vazio ignorado (`a=1&&b=2` da dois
 *   criterios);
 * - corte no **primeiro** `=`; par sem `=` vale como valor vazio;
 * - `urldecode` no nome e no valor, logo `+` e espaco e `%XX` e byte;
 * - `nome[]=` acumula lista, e acumular sobre um valor que ja era texto o
 *   **substitui** por lista de um elemento, como o interpretador faz;
 * - ponto e espaco no nome viram `_`.
 *
 * ⚠️ **Colchete sem par** (`nome[=1`) fica no nome como veio. A forma exata do
 * `mangling` desse caso mora no interpretador e nao nesta arvore (ver fronteira 2
 * do cabecalho do arquivo); nenhuma regra do nucleo a produz.
 *
 * 🔴 **Chave nomeada** (`nome[chave]=1`) e descartada: `CriteriosDeConsulta`, como
 * T001 a declarou, nao a representa (fronteira 3 do cabecalho).
 */
export function analisarCadeiaDeConsulta(cadeia: string): CriteriosDeConsulta {
  const criterios: Record<string, ValorDeCriterio> = {};

  for (const par of cadeia.split('&')) {
    if (par === '') {
      continue;
    }

    const corte = par.indexOf('=');
    const nome = decodificarUrl(corte === -1 ? par : par.slice(0, corte));
    const valor = decodificarUrl(corte === -1 ? '' : par.slice(corte + 1));

    const abre = nome.indexOf('[');
    const fecha = abre === -1 ? -1 : nome.indexOf(']', abre);

    if (abre === -1 || fecha === -1) {
      criterios[nomeNormalizado(nome)] = valor;
      continue;
    }

    if (fecha !== abre + 1) {
      // Chave nomeada: nao representavel. Ver o cabecalho.
      continue;
    }

    const base = nomeNormalizado(nome.slice(0, abre));
    const corrente = criterios[base];
    // Acumular sobre texto o substitui por lista; acumular sobre lista anexa.
    const lista =
      corrente === undefined || typeof corrente === 'string'
        ? []
        : [...corrente];
    lista.push(valor);
    criterios[base] = lista;
  }

  return criterios;
}
