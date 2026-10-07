/**
 * O modelo de valor do formato serializado do legado.
 *
 * Por que existe uma uniao marcada em vez de usar o valor nativo deste runtime:
 * o criterio de aceite deste formato e **byte a byte** (`DB-SER`,
 * BR-MIGRAR-082, e a Decisao 2 de `parity_specs.md` poe a escrita no banco na
 * area "efeito no banco"), e o cenario de paridade
 * `15-fronteira-do-banco-e-codec-serialize.feature` e literal: *"nenhuma das
 * duas normaliza, reordena nem reindexa a estrutura"*. Tres fatos do formato de
 * origem nao cabem no valor nativo daqui:
 *
 * 1. **inteiro e decimal sao tipos diferentes**, e `1` e `1.0` produzem bytes
 *    diferentes (`i:1;` contra `d:1;`). Em JavaScript sao o mesmo numero.
 * 2. **a chave de arranjo e inteiro ou texto**, e a diferenca aparece nos bytes
 *    (`i:5;` contra `s:1:"5";`).
 * 3. **a ordem de insercao e observavel**: a definicao dos papeis e construida
 *    por concessoes sucessivas, e a ordem em que elas aconteceram e a ordem em
 *    que os bytes saem. Um dicionario que reordenasse chaves mudaria o valor
 *    gravado na coluna.
 *
 * Por isso a estrutura e uma **lista ordenada de entradas**, e nao um mapa.
 *
 * Onde isto mora, e por que nao mora no contexto: `target_architecture.md`
 * atribui o *codec* do formato a `plataforma/opcoes/` ("Opcoes e as 4 familias
 * de metadado, com o codec de `serialize()` do PHP"). A regra de dependencia 2
 * proibe `plataforma/` importar `contextos/`, logo o codec **nao pode** nascer
 * dentro de `contextos/identidade-e-acesso/`: quando `plataforma/opcoes/` for
 * construida, ela precisa poder adota-lo sem importar contexto nenhum. O que
 * esta aqui e o codec e so ele; o registro de opcoes e as quatro familias de
 * metadado continuam sendo trabalho de quem construir aquele modulo.
 */

/** Um valor do formato, com o tipo de origem preservado. */
export type ValorPhp =
  | { readonly tipo: 'nulo' }
  | { readonly tipo: 'booleano'; readonly valor: boolean }
  | { readonly tipo: 'inteiro'; readonly valor: number }
  | { readonly tipo: 'decimal'; readonly valor: number }
  | { readonly tipo: 'texto'; readonly valor: string | Uint8Array }
  | { readonly tipo: 'arranjo'; readonly entradas: readonly EntradaDeArranjo[] };

/**
 * Chave de arranjo: inteiro ou texto, e as duas saem em bytes diferentes.
 *
 * O texto e `string` quando os bytes sao UTF-8 valido e `Uint8Array` quando nao
 * sao — o formato de origem guarda cadeia de bytes, nao cadeia de caracteres, e
 * a coluna pode carregar bytes que nenhuma decodificacao recupera.
 */
export type ChaveDeArranjo =
  | { readonly tipo: 'inteiro'; readonly valor: number }
  | { readonly tipo: 'texto'; readonly valor: string | Uint8Array };

export interface EntradaDeArranjo {
  readonly chave: ChaveDeArranjo;
  readonly valor: ValorPhp;
}

export const NULO: ValorPhp = { tipo: 'nulo' };

export function booleano(valor: boolean): ValorPhp {
  return { tipo: 'booleano', valor };
}

export function inteiro(valor: number): ValorPhp {
  return { tipo: 'inteiro', valor };
}

export function decimal(valor: number): ValorPhp {
  return { tipo: 'decimal', valor };
}

export function texto(valor: string | Uint8Array): ValorPhp {
  return { tipo: 'texto', valor };
}

export function arranjo(entradas: readonly EntradaDeArranjo[]): ValorPhp {
  return { tipo: 'arranjo', entradas };
}

/**
 * Arranjo com chave de texto, na ordem dada.
 *
 * A chave passa pela mesma normalizacao que o arranjo de origem aplica no
 * momento da insercao: chave de texto que seja a representacao decimal canonica
 * de um inteiro vira chave inteira, e e por isso que `array('5' => 'x')` sai
 * como `a:1:{i:5;s:1:"x";}`. Ver {@link normalizarChaveDeTexto}.
 */
export function arranjoPorNome(
  pares: readonly (readonly [string, ValorPhp])[],
): ValorPhp {
  return {
    tipo: 'arranjo',
    entradas: pares.map(([nome, valor]) => ({
      chave: normalizarChaveDeTexto(nome),
      valor,
    })),
  };
}

/** Arranjo de lista: chaves inteiras de `0` a `n-1`, como o formato as emite. */
export function lista(valores: readonly ValorPhp[]): ValorPhp {
  return {
    tipo: 'arranjo',
    entradas: valores.map((valor, indice) => ({
      chave: { tipo: 'inteiro', valor: indice },
      valor,
    })),
  };
}

const INTEIRO_CANONICO = /^(0|-?[1-9][0-9]*)$/;
const MAIOR_INTEIRO = 9223372036854775807n;
const MENOR_INTEIRO = -9223372036854775808n;

/**
 * A regra de normalizacao de chave do arranjo de origem, reproduzida.
 *
 * Vira inteiro so a representacao decimal canonica dentro da faixa do inteiro
 * de 64 bits: `"5"` sim, `"05"` nao, `"-3"` sim, `"+3"` nao, `" 5"` nao,
 * `"5.0"` nao — e um decimal de 64 digitos (o resumo de um token de sessao, por
 * exemplo) tambem nao, por estourar a faixa. Fora da faixa a chave **continua**
 * texto, que e exatamente o que o formato de origem faz.
 */
export function normalizarChaveDeTexto(nome: string): ChaveDeArranjo {
  if (!INTEIRO_CANONICO.test(nome)) {
    return { tipo: 'texto', valor: nome };
  }
  const comoInteiro = BigInt(nome);
  if (comoInteiro > MAIOR_INTEIRO || comoInteiro < MENOR_INTEIRO) {
    return { tipo: 'texto', valor: nome };
  }
  return { tipo: 'inteiro', valor: Number(comoInteiro) };
}

/** O nome da chave como texto, para quem le uma estrutura de chave nomeada. */
export function nomeDaChave(chave: ChaveDeArranjo): string {
  if (chave.tipo === 'inteiro') {
    return String(chave.valor);
  }
  return typeof chave.valor === 'string'
    ? chave.valor
    : new TextDecoder().decode(chave.valor);
}
