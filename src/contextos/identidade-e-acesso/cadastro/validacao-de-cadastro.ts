/**
 * As validacoes do cadastro: `U2` e `U3`, com a contagem de caractere que o
 * legado usa.
 *
 * **Nada aqui le o banco e nada aqui escreve.** Sao funcoes sobre texto, e e por
 * isso que a borda do limite — *"no ultimo instante aceita, um instante depois
 * recusa"*, o teste que o **P6** exige — e afirmavel sem porta nenhuma.
 *
 * ⚠️ **A contagem e por caractere, nao por byte, e a diferenca e observavel.** O
 * legado conta com a funcao multibyte: um login de 60 caracteres acentuados tem
 * 60 caracteres e mais de 60 bytes, e passa. Contar `length` de JavaScript nao
 * seria nem uma coisa nem outra — e contagem de unidade UTF-16, que difere das
 * duas fora do plano basico. Por isso {@link contarCaracteres} percorre os pontos
 * de codigo.
 */

import {
  sanitizarLogin,
  type RemocaoDeAcentos,
} from '../autenticacao/normalizacao-de-credencial.js';

/**
 * Conta caracteres como a contagem multibyte do legado: **pontos de codigo**.
 *
 * `'ação'.length` e 4, e `[...'ação'].length` tambem; mas um emoji conta 2 na
 * primeira e 1 na segunda, e e a segunda que corresponde ao legado.
 */
export function contarCaracteres(texto: string): number {
  return [...texto].length;
}

/** Passou do limite? E o unico predicado de tamanho deste modulo. */
export function excedeComprimento(texto: string, limite: number): boolean {
  return contarCaracteres(texto) > limite;
}

/**
 * O login enviado, sanitizado em modo **nao estrito** — e o que o legado grava e
 * o que ele compara com a lista de proibidos.
 */
export function sanitizarLoginDoCadastro(
  loginEnviado: string,
  removerAcentos: RemocaoDeAcentos,
): string {
  return sanitizarLogin(loginEnviado, removerAcentos, false);
}

/**
 * O login enviado e valido?
 *
 * A regra do legado e uma comparacao, nao uma lista: **o login e valido quando a
 * sanitizacao estrita nao muda nada nele**. Logo a pergunta se faz sobre o texto
 * **cru**, nao sobre o sanitizado — comparar o sanitizado consigo mesmo daria
 * sempre verdadeiro e o erro de caractere ilegal nunca apareceria.
 *
 * E por isso que o erro `invalid_username` existe mesmo havendo sanitizacao: a
 * sanitizacao diz o que seria gravado, e esta comparacao diz se o que foi digitado
 * e aceitavel. Um porte que gravasse o sanitizado sem comparar aceitaria
 * `jo<b>ao</b>` como `joao`, que o legado recusa.
 */
export function loginEnviadoEhValido(
  loginEnviado: string,
  removerAcentos: RemocaoDeAcentos,
): boolean {
  return sanitizarLogin(loginEnviado, removerAcentos, true) === loginEnviado;
}

/**
 * O login esta na lista de proibidos? (`U3`, CA-6.6)
 *
 * **A comparacao ignora caixa nas duas pontas**, e isso e regra: o legado
 * minuscula o login e cada item da lista antes de comparar, logo uma extensao que
 * proiba `Admin` tambem proibe `admin` e `ADMIN`. Comparar sem minuscular deixaria
 * passar a variacao de caixa, o que abriria o sistema.
 *
 * A lista chega por argumento porque ela e **ponto de extensao**, nao opcao: ver
 * `configuracao-de-cadastro.ts` e `contexto-de-cadastro.ts`.
 */
export function loginEstaProibido(
  login: string,
  loginsProibidos: readonly string[],
): boolean {
  const alvo = login.toLowerCase();
  return loginsProibidos.some((proibido) => proibido.toLowerCase() === alvo);
}

/**
 * O apelido derivado do login — `user_nicename`, o identificador do autor na URL.
 *
 * Dois passos, nesta ordem, e nenhum deles e deste contexto limitado:
 *
 * 1. **a conversao para identificador de URL** chega por {@link ApelidoDeTexto},
 *    porque ela usa a tabela de equivalencia de caractere do slot
 *    `analise-e-sanitizacao-de-html` do plano, que vive em `plataforma/` — a mesma
 *    razao pela qual `removerAcentos` chega por argumento em
 *    `../autenticacao/normalizacao-de-credencial.ts`, e a ligacao tardia que AD-10
 *    manda usar (*"toda chamada BC→BC e resolvida no momento da chamada"*);
 * 2. **a sanitizacao estrita** por cima, que e do legado e e deste modulo.
 *
 * ⚠️ **Nao trunca, e e isso que `U2` cobra.** BR-MIGRAR-022 e literal — *"login ate
 * 60 caracteres, apelido ate 50 — e os dois sao **erro, nao truncamento**"* — e
 * CA-6.2 repete com a palavra "silencioso". Quem derivar o apelido cortando o
 * login em 50 faz o erro de apelido virar inalcancavel, e o critério de aceite
 * deixa de ter o que afirmar.
 */
export type ApelidoDeTexto = (texto: string) => string;

export function apelidoDoLogin(
  login: string,
  apelidoDeTexto: ApelidoDeTexto,
  removerAcentos: RemocaoDeAcentos,
): string {
  return sanitizarLogin(apelidoDeTexto(login), removerAcentos, true);
}
