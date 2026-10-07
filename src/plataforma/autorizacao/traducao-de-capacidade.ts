/**
 * A traducao da capacidade pedida na lista de capacidades primitivas exigidas —
 * o `map_meta_cap()` do legado.
 *
 * `PERM-3` (BR-MIGRAR-089) e categorica: *"capacidade sobre objeto NAO e
 * verificada direto: e traduzida. `map_meta_cap()` devolve a lista de
 * capacidades primitivas necessarias, em 86 `case`. `edit_post` e a mais
 * verificada do sistema (104 chamadas) e NENHUMA delas pergunta por `edit_post`:
 * todas perguntam pelo que o mapeamento devolveu."* E `PERM-1`: e preciso ter
 * **todas** as devolvidas, nao qualquer uma.
 *
 * Duas convencoes do legado que este arquivo nao pode perder:
 *
 * - **Lista vazia significa PERMITIDO.** E a pegadinha 2 de `permissions.md`,
 *   citada em BR-MIGRAR-092: `edit_user` sobre si mesmo sai do `switch` sem
 *   acrescentar nada, e a comparacao sobre lista vazia e verdadeira. *"Um alvo
 *   que trate lista vazia como negacao tranca todo mundo fora do proprio
 *   perfil."* Quem implementa isso e a comparacao, em `decisao-de-capacidade.ts`;
 *   aqui o que importa e que devolver `[]` e **legitimo** e nao erro.
 * - **Todo caminho de erro FECHA a porta.** `PERM-4` (BR-MIGRAR-090): tres ramos
 *   tratam tipo ou estado nao registrado e todos degradam para a capacidade mais
 *   alta, com aviso — *"no resto do sistema, caminho de erro degrada para MENOS
 *   garantia; e a distincao que um porte precisa preservar"*. Um caso que nao
 *   reconhece a propria entrada devolve {@link CAPACIDADE_NEGADA}, nunca `[]`.
 *
 * ## O que esta aqui e o que nao esta
 *
 * Esta: a **forma** da traducao e a ordem em que os casos sao consultados.
 *
 * Os casos de objeto **sobre conteudo** — `edit_post`, `delete_post`, `read_post`,
 * o estado anterior do conteudo descartado, o objeto inexistente, a pagina inicial
 * e a de politica de privacidade — sao US-8 / **T017** e estao em
 * `traducao-de-conteudo.ts`. Dos 86 `case` do legado continuam fora os de termo,
 * comentario, metadado, senha de aplicacao e rede, cada um na feature do seu
 * objeto, e os dez atalhos de nomenclatura de `PERM-6` (BR-MIGRAR-092), que chegam
 * com os casos deles.
 *
 * O ponto de encaixe e {@link CasoDeTraducao}: um caso devolve `null` para dizer
 * *"nao e meu"* e a consulta continua. Quem declara a ORDEM e a decisao, nao
 * este arquivo — ver `decisao-de-capacidade.ts`, e a razao esta em
 * BR-MIGRAR-094: *"revogacao que vence concessao exige ordem de avaliacao
 * declarada no alvo — nao pode ser 'mais um filtro'"*.
 */

import type { Capacidade } from './capacidade.js';
import type { ConstantesDoServidor } from './revogacao-por-constante.js';

/**
 * O que um caso de traducao recebe.
 *
 * Os tres primeiros campos sao a assinatura do legado —
 * `map_meta_cap( $cap, $user_id, ...$args )`. A conta chega como identificador e
 * nao como objeto porque no legado tambem e assim: o mapeamento recebe o `ID` e
 * busca o que precisar.
 */
export interface PedidoDeTraducao {
  /** A capacidade pedida, como o chamador a pediu. */
  readonly capacidade: Capacidade;
  /** `$user_id` — de quem se pergunta. `0` para quem nao esta autenticado. */
  readonly contaId: number;
  /**
   * `...$args` — o objeto e o que mais o caso precisar, na ordem em que o
   * chamador os passou. Em `unknown` de proposito: cada caso conhece o seu
   * argumento, e o mapeamento nao conhece conteudo, termo nem comentario.
   */
  readonly argumentos: readonly unknown[];
  /** As quatro constantes do dono do servidor. Ver `revogacao-por-constante.ts`. */
  readonly constantes: ConstantesDoServidor;
  /**
   * `is_multisite()` — a instalacao e em rede?
   *
   * Esta aqui porque ha caso de traducao cuja **lista devolvida** depende do modo
   * de instalacao, e nao do ator: BR-MIGRAR-042 (`D4`) resolve
   * `manage_privacy_options` em `manage_network` em rede e em `manage_options`
   * fora dela, e a nota de paradigma da propria regra e *"o alvo precisa resolver
   * `MULTISITE` **antes** de autorizar"*. Acrescentado por **T017**, que precisa
   * da regra no ramo da pagina de politica de privacidade.
   *
   * E so o sinalizador, e nao o estado de rede inteiro: a lista de super
   * administradores e nome de login e pertence a decisao, nao a traducao
   * (`PERM-9`).
   */
  readonly emRede: boolean;
}

/**
 * Um caso da traducao: devolve a lista exigida, ou `null` quando a capacidade
 * pedida nao e dele.
 *
 * `null` e **nao e meu caso**; `[]` e **permitido**; `['do_not_allow']` e
 * **negado**. Os tres sao diferentes, e confundir os dois ultimos e o defeito
 * que BR-MIGRAR-092 e BR-MIGRAR-090 descrevem em sentidos opostos.
 */
export type CasoDeTraducao = (
  pedido: PedidoDeTraducao,
) => readonly Capacidade[] | null;

/**
 * Consulta os casos na ordem recebida e devolve o primeiro que reconhecer o
 * pedido; sem nenhum, devolve a propria capacidade pedida.
 *
 * O ramo final e o `default:` do legado — `$caps[] = $cap` —, e e por ele que
 * uma capacidade primitiva como `manage_options` atravessa a traducao sem
 * mudanca. Tambem e por ele que uma capacidade que ninguem declarou e **negada**
 * no fim: ela nao esta na matriz, logo a comparacao nao a encontra. Essa negacao
 * e do legado e nao se corrige aqui.
 */
export function traduzirCapacidade(
  pedido: PedidoDeTraducao,
  casos: readonly CasoDeTraducao[],
): readonly Capacidade[] {
  for (const caso of casos) {
    const exigidas = caso(pedido);
    if (exigidas !== null) {
      return exigidas;
    }
  }
  return [pedido.capacidade];
}
