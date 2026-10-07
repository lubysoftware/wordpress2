/**
 * As tres operacoes de encerramento do registro de sessoes — `encerrar`,
 * `encerrarOutras` e `encerrarTodas`, os tres comandos que
 * `target_domain_model.md` lista para `AGG-Sessao` ao lado de `abrir` e
 * `renovar`.
 *
 * Entrega de **T005** (US-2). O que esta aqui e o efeito no **registro**; o
 * fluxo de saida do produto — que tambem limpa a credencial do navegador e torna
 * a identidade corrente anonima — esta em `saida.ts`.
 *
 * | criterio de US-2 | onde |
 * |---|---|
 * | CA-2.1 *"destroi apenas o token da sessao corrente"* | `encerrarSessao` |
 * | CA-2.1 *"limpa as credenciais guardadas no navegador"* | `saida.ts` |
 * | CA-2.2 *"outra sessao continua autenticando"* | `encerrarSessao` + `sessaoEstaAberta` |
 * | CA-2.3 *"requisicao com o token destruido e tratada como anonima"* | `sessaoEstaAberta` + `saida.ts` |
 *
 * **Duas destas operacoes nascem sem nenhum chamador, e e de proposito.**
 * BR-MIGRAR-111 (`ESC-SESSAO`) manda portar `wp_destroy_other_sessions()` e
 * `wp_destroy_all_sessions()` *"definidas e sem chamador, como estao hoje"*
 * (`wp-includes/user.php:3725` e `:3738`), citando a resposta 7 de
 * `questions.md` — *"existir sem ser chamada e parte do que se clona"*. O
 * cenario de paridade da area cobra exatamente isso: *"as duas operacoes existem
 * no sistema novo / nenhum caminho de uso do produto as invoca, como no oraculo
 * / quando elas sao invocadas diretamente, o efeito no banco e identico ao do
 * oraculo"* (`parity_tests/06-autenticacao-e-sessao.feature`). Logo elas sao
 * **exportadas** — no legado sao funcoes globais, alcancaveis por qualquer
 * extensao — e **nenhum** fluxo deste pacote as chama. Acrescentar chamador e
 * mudanca de comportamento, nao conserto.
 *
 * **O que este arquivo NAO faz, e por que:**
 *
 * - **nao descarta sessao vencida.** O filtro do que venceu mora na LEITURA do
 *   mapa no legado, precisa do relogio, e os 2 dias, os 14 e as 12 horas de
 *   carencia sao `U5` (BR-MIGRAR-025) — entrega de T007, com o teste de borda que
 *   o P6 cobra. Quando esse filtro entrar na leitura, as funcoes daqui passam a
 *   ver o mapa ja filtrado, e gravar de volta passa a podar o que venceu, como no
 *   legado. Nada aqui precisa mudar para isso acontecer;
 * - **nao revoga nada por troca de senha.** `ESC-SESSAO` e explicito, e REQ-008
 *   esta em `do-not-rewrite.md`: trocar a senha nao revoga sessao, e o registro
 *   do token sobrevive e acumula;
 * - **nao limita quantidade e nao poda por conta propria.** Encerrar remove **a**
 *   entrada pedida e nada mais.
 */

import {
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
  type Sessao,
} from './registro-de-sessoes.js';

/**
 * A sessao gravada sob aquele token, ou `null`.
 *
 * O legado tem o par: uma operacao devolve o registro e a outra devolve so o
 * booleano. As duas estao aqui porque as duas sao alcancaveis de fora, e porque
 * e pelo booleano que CA-2.3 se afirma.
 */
export function sessaoDoToken(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
  token: string,
): Sessao | null {
  if (token === '') {
    return null;
  }
  return armazenamento.ler(idDaConta)[resumoDoTokenDeSessao(token)] ?? null;
}

/**
 * Se aquele token ainda abre sessao (CA-2.2 e CA-2.3).
 *
 * ⚠️ **Isto nao e a validacao da credencial do navegador.** Aqui se pergunta ao
 * registro; conferir o cookie, o fragmento de 4 caracteres do hash da senha na
 * chave do HMAC e a carencia de 12 horas e US-3 / T007. Um token encerrado
 * reprova nas duas pontas, e e por isso que CA-2.3 ja se afirma por aqui.
 */
export function sessaoEstaAberta(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
  token: string,
): boolean {
  return sessaoDoToken(armazenamento, idDaConta, token) !== null;
}

/**
 * Encerra **uma** sessao: a daquele token, e nenhuma outra (CA-2.1, CA-2.2).
 *
 * Grava o mapa de volta **sempre**, inclusive quando o token nao estava la, e
 * isso e deliberado: no legado o encerramento remove a chave de um mapa e manda
 * o mapa inteiro para a gravacao, que e quem decide se alguma coisa chega ao
 * banco — gravar valor identico **nao escreve nada** (ver
 * `armazenamento/perfil.ts`) e conjunto vazio **apaga a linha de metadado** (ver
 * `armazenamento/sessao.ts`). Essas duas regras sao efeito no banco, que e o
 * criterio de paridade desta area; reproduzi-las aqui, decidindo por conta
 * propria quando nao gravar, duplicaria a decisao em dois lugares.
 *
 * A ordem das entradas restantes e preservada: o mapa gravado e serializado como
 * arranjo, e arranjo tem ordem — o valor gravado e comparado byte a byte.
 *
 * Devolve se havia sessao com aquele token. O legado nao devolve nada; este valor
 * existe para o relato de `sair` e **nao** decide nada aqui.
 */
export function encerrarSessao(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
  token: string,
): boolean {
  const resumo = resumoDoTokenDeSessao(token);
  const abertas = armazenamento.ler(idDaConta);
  const havia = abertas[resumo] !== undefined;

  const restantes: Record<string, Sessao> = { ...abertas };
  delete restantes[resumo];
  armazenamento.gravar(idDaConta, restantes);

  return havia;
}

/**
 * Encerra todas as sessoes da conta **menos** a daquele token.
 *
 * ⚠️ **Definida e sem nenhum chamador, de proposito** — ver o cabecalho deste
 * arquivo, BR-MIGRAR-111 e a resposta 7.
 *
 * O legado tem dois ramos: quando o token mantido ainda abre sessao, grava o
 * mapa com essa unica entrada; quando nao abre, encerra **todas**. O filtro
 * abaixo produz os dois: token conhecido deixa uma entrada, token desconhecido
 * deixa o mapa vazio — e mapa vazio apaga a linha de metadado, que e o mesmo
 * efeito no banco de encerrar todas. Um ramo explicito aqui nao mudaria nenhum
 * dos dois resultados.
 */
export function encerrarOutrasSessoes(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
  tokenMantido: string,
): void {
  const mantida = sessaoDoToken(armazenamento, idDaConta, tokenMantido);

  const restante: MapaDeSessoes =
    mantida === null
      ? {}
      : { [resumoDoTokenDeSessao(tokenMantido)]: mantida };

  armazenamento.gravar(idDaConta, restante);
}

/**
 * Encerra todas as sessoes da conta.
 *
 * ⚠️ **Definida e sem nenhum chamador, de proposito** — ver o cabecalho deste
 * arquivo, BR-MIGRAR-111 e a resposta 7.
 *
 * Mapa vazio **apaga a linha de metadado** em lugar de gravar arranjo vazio: a
 * diferenca aparece no banco, e a decisao e de `armazenamento/sessao.ts`.
 */
export function encerrarTodasAsSessoes(
  armazenamento: ArmazenamentoDeSessoes,
  idDaConta: number,
): void {
  armazenamento.gravar(idDaConta, {});
}
