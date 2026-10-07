/**
 * O prazo da sessao **aplicado**: US-3, e os quatro critérios CA-3.1 a CA-3.4.
 *
 * T003 calculou o prazo do token (`autenticacao/prazos-de-sessao.ts`: 2 dias, e
 * 14 com lembranca) e parou ali, com a nota de entrega dizendo o porque: *"a
 * carencia de 12 horas nao esta aqui: ela nao entra no prazo do token, e
 * interpretar onde ela entra e a entrega de T007"*. Este arquivo e essa
 * interpretacao, e ela tem duas pontas, porque o legado escreve o numero numa e
 * o le na outra:
 *
 * | ponta | o que a carencia faz | critério |
 * |---|---|---|
 * | emissao | estende a vida da credencial do navegador, para que o navegador **continue mandando** o que ja venceu | CA-3.1, CA-3.2 |
 * | validacao | a sessao vencida ainda e aceita, enquanto a carencia nao esgota | CA-3.3, CA-3.4 |
 *
 * **Os tres numeros sao os de BR-MIGRAR-025 (`U5`)**, ancorados em
 * `wp-includes/pluggable.php:1082` (14 dias), `:1088` (as 12 horas) e `:1091`
 * (2 dias) — as tres linhas que `spec.md` lista como evidencia de US-3, e nada
 * alem delas. `target_domain_model.md` repete na invariante de `AGG-Sessao`:
 * *"dura 2 dias; com 'lembrar de mim', 14 — com 12 h de carencia"*.
 *
 * ---
 *
 * ⚠️ **UM PONTO FICA ABERTO, E NAO FOI ESCOLHIDO AQUI: a carencia vale para as
 * duas duracoes ou so para a estendida?**
 *
 * - `spec.md` CA-3.3 nao qualifica: *"ha 12 horas de carencia apos **o prazo**,
 *   durante as quais a sessao ainda e aceita"*. BR-MIGRAR-025, UC-19 e
 *   `target_domain_model.md` repetem a frase sem qualificar tambem.
 * - `parity_tests/06-autenticacao-e-sessao.feature` e mais fino, e aponta para
 *   outro lado: *"Dado uma entrada **sem** a opcao de lembrar / Quando o tempo
 *   avanca ate depois da duracao padrao / Entao as duas metades **recusam** a
 *   sessao / **Mas** uma entrada com a opcao de lembrar tem duracao estendida /
 *   Quando o tempo avanca ate dentro da carencia **da duracao estendida** /
 *   Entao as duas metades aceitam a sessao"*. Ali a carencia e da duracao
 *   estendida, e a recusa sem lembranca vem logo depois dos 2 dias.
 *
 * As duas leituras divergem **no efeito**, e a divergencia e exatamente a que o
 * P1 e a `spec.md` avisam que passa sem ninguem notar: a primeira aceita a
 * sessao por 2 dias e 12 horas sem lembranca, e portanto e **mais aberta** que a
 * segunda. Nenhum documento do pacote resolve, porque nenhum dos dois esta
 * errado de forma legivel: um nao qualifica e o outro qualifica.
 *
 * **O que esta tarefa fez, e o que ela nao fez.** Implementou o critério de
 * aceite como ele esta escrito — a carencia e do prazo, qualquer que seja ele —,
 * porque e CA-3.3 e CA-3.4 que T007 tem de fazer passar, e narrar a carencia
 * para a duracao estendida seria **estreitar um critério de aceite** por conta
 * propria. E deixou a outra leitura alcancavel sem alterar arquivo deste modulo:
 * `carencia: 0` na emissao sem lembranca reproduz exatamente o cenario de
 * paridade. A escolha entre as duas e conferencia contra o oraculo
 * (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe
 * (`oracleAvailable: false`), e esta registrada na nota de entrega de T007 no
 * `README.md` deste modulo.
 *
 * E o pacote registra **um** numero de carencia (12 h) e **uma** condicao (apos
 * o prazo). Se o oraculo mostrar que a carencia do legado depende do metodo da
 * requisicao ou da forma da credencial, e aqui que isso entra — nenhum numero
 * foi acrescentado por conta propria, porque o P6 recusa numero que o legado nao
 * tem e tambem numero que o pacote nao registra.
 */

import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';
import type { MapaDeSessoes, Sessao } from './registro-de-sessoes.js';

/**
 * A carencia, no valor de fabrica do legado: 12 horas.
 *
 * Ponto de configuracao nomeado, como o P6 exige — *"cada numero vive num ponto
 * de configuracao nomeado, com o valor de fabrica do legado, e existe teste que
 * afirma o valor e o efeito da borda"*. O teste de borda esta na suite desta
 * tarefa: no ultimo instante aceita, um instante depois recusa.
 *
 * **Ela nao e ponto de extensao, e a diferenca com o prazo do token e regra.**
 * BR-MIGRAR-108 (`ESC-FILTRAVEL`) poe o prazo do token atras de um ponto de
 * extensao que recebe a conta e a opcao de lembranca, e por isso
 * `expiracaoDoToken` recebe os prazos por argumento. Para a carencia o pacote
 * **nao registra ponto de extensao nenhum**: as 12 horas sao literal da funcao
 * que grava a credencial (`pluggable.php:1088`). Logo ela chega por argumento
 * para ser configuravel e testavel na borda, nao para anunciar um ponto de
 * extensao que o pacote nao documenta.
 */
export const CARENCIA_DE_SESSAO_DE_FABRICA = 12 * SEGUNDOS_POR_HORA;

/**
 * As tres situacoes em que uma sessao gravada pode estar, para o relogio de
 * agora.
 *
 * `na-carencia` **e aceita** (CA-3.3) e e um estado proprio porque ele e
 * observavel: no legado a sessao que passou do prazo e ainda e aceita marca a
 * requisicao, e quem consome essa marca mostra a entrada de novo em lugar de
 * deixar o trabalho cair. O que exatamente consome a marca nao esta registrado
 * neste pacote, e por isso aqui ela e **devolvida** e nada neste modulo decide
 * com ela — o P7 e literal: observabilidade nova nao muda o fluxo.
 */
export type SituacaoDaSessao = 'valida' | 'na-carencia' | 'vencida';

/**
 * O ultimo instante em que a sessao ainda e aceita: o prazo dela, mais a
 * carencia.
 *
 * Soma sobre segundos inteiros UTC, que e a unidade da `PortaDeRelogio` e a
 * unidade em que o legado faz esta aritmetica.
 */
export function limiteDeAceitacao(
  sessao: Sessao,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): number {
  return sessao.expiraEm + carencia;
}

/**
 * Em que situacao a sessao esta.
 *
 * **As duas bordas sao inclusivas, e isso e comportamento, nao gosto.** No
 * legado a comparacao do prazo gravado e *"vence quando o instante gravado for
 * **menor** que agora"*, logo no instante exato do prazo a sessao ainda vale. O
 * P6 cobra as duas pontas: *"no ultimo instante aceita, um instante depois
 * recusa"*.
 */
export function situacaoDaSessao(
  sessao: Sessao,
  agoraEmSegundos: number,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): SituacaoDaSessao {
  if (agoraEmSegundos <= sessao.expiraEm) {
    return 'valida';
  }
  if (agoraEmSegundos <= limiteDeAceitacao(sessao, carencia)) {
    return 'na-carencia';
  }
  return 'vencida';
}

/** A sessao ainda e aceita — valida ou na carencia (CA-3.3). */
export function sessaoAceita(
  sessao: Sessao,
  agoraEmSegundos: number,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): boolean {
  return situacaoDaSessao(sessao, agoraEmSegundos, carencia) !== 'vencida';
}

/**
 * O mapa sem o que deixou de ser aceito.
 *
 * **Este filtro e o que T002 deixou nomeado para esta tarefa.**
 * `armazenamento/sessao.ts` diz, na propria nota de entrega, que ela *"nao
 * descarta sessao vencida: o legado filtra o que venceu na leitura, e esse
 * filtro precisa do relogio; os 2 dias, os 14 e as 12 horas de carencia sao
 * `U5` (BR-MIGRAR-025) e entram em T007, com teste de borda"*.
 *
 * **E ele usa a MESMA carencia da validacao, de proposito.** Um porte que
 * filtrasse pelo prazo cru e validasse com carencia nunca acharia a sessao que
 * esta na carencia, e CA-3.3 falharia por um caminho que nenhum teste de prazo
 * apanha — a sessao nao apareceria como vencida, apareceria como inexistente.
 * As duas pontas chamam esta funcao ou `situacaoDaSessao`, nunca uma comparacao
 * a mao.
 *
 * **O que isto NAO e:** revogacao. `ESC-SESSAO` (BR-MIGRAR-111) manda o registro
 * de token **acumular** e sobreviver a troca de senha, e nada aqui olha senha:
 * o unico motivo de uma entrada sair do mapa e o relogio ter passado do limite
 * de aceitacao dela.
 */
export function sessoesAceitas(
  sessoes: MapaDeSessoes,
  agoraEmSegundos: number,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): MapaDeSessoes {
  const aceitas: Record<string, Sessao> = {};
  for (const [resumo, sessao] of Object.entries(sessoes)) {
    if (sessaoAceita(sessao, agoraEmSegundos, carencia)) {
      aceitas[resumo] = sessao;
    }
  }
  return aceitas;
}

/**
 * A credencial que o navegador guarda, e por quanto tempo (CA-3.1, CA-3.2).
 *
 * **O prazo da credencial e o prazo do token sao coisas diferentes**, e esse e o
 * detalhe que UC-19 manda um porte nao perder: *"sem 'lembrar de mim' o cookie e
 * de sessao, mas o token no servidor ainda vale 2 dias: fechar o navegador nao
 * encerra a sessao do lado do servidor"*. BR-MIGRAR-025 repete. Por isso sao
 * dois valores e nao um: o do token sai de `expiracaoDoToken`, o da credencial
 * sai daqui.
 *
 * `de-sessao` nao e "sem prazo": e a credencial que o navegador descarta quando
 * fecha, que no legado e o que `pluggable.php:1091` grava ao nao pedir prazo
 * nenhum. Nada deste modulo monta cabecalho — ver a nota de escopo abaixo.
 */
export type CredencialDoNavegador =
  | { readonly tipo: 'de-sessao' }
  | { readonly tipo: 'com-prazo'; readonly expiraEm: number };

/**
 * Decide o prazo da credencial do navegador a partir do prazo do token.
 *
 * Com lembranca, a credencial vive **a carencia inteira a mais** que o token, e
 * o legado diz no comentario por que: para que o navegador continue mandando a
 * credencial depois de o prazo ser alcancado, que e o que torna a carencia de
 * `situacaoDaSessao` alcancavel. Sem lembranca, a credencial e de sessao.
 *
 * ⚠️ **O que esta funcao decide e so o prazo.** O nome da credencial, o formato
 * do valor e a chave do HMAC que embute o fragmento de 4 caracteres do hash da
 * senha **nao estao aqui**, e a ausencia e de escopo, nao esquecimento: a
 * ancora deles e `wp-includes/pluggable.php:855`–`:867`
 * (`target_domain_model.md`, `AGG-Sessao`; `gaps.md` A-05) e **nenhuma dessas
 * linhas e evidencia de US-3** — as de US-3 sao `:1082`, `:1088` e `:1091`, as
 * tres do prazo. Somado a isso, o fragmento tem dois ramos conforme o formato do
 * hash e o hash corrente depende da primitiva de bcrypt, que e adaptador e nao
 * existe nesta arvore. O risco 3 de `plan.md` descreve exatamente essa costura —
 * *"e o tipo de detalhe que um porte perde sem o teste notar, porque o login
 * continua funcionando"* — e ela fica **nomeada** aqui para a tarefa que a
 * construir, em vez de aproximada agora.
 */
export function credencialDoNavegador(
  expiracaoDoToken: number,
  lembrar: boolean,
  carencia: number = CARENCIA_DE_SESSAO_DE_FABRICA,
): CredencialDoNavegador {
  if (!lembrar) {
    return { tipo: 'de-sessao' };
  }
  return { tipo: 'com-prazo', expiraEm: expiracaoDoToken + carencia };
}
