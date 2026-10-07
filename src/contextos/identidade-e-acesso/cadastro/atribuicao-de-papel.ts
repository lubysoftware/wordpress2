/**
 * A atribuicao de papel a uma conta — o `atribuirPapel` de `AGG-Conta`, na fatia
 * que o cadastro usa.
 *
 * > ⚠️ **A decisao de capacidade nao mora aqui, e nunca vai morar.**
 * > `target_architecture.md` divide BC-05 em dois, e o `README.md` deste modulo
 * > repete: *"o dado do papel pertence a este modulo; a decisao de capacidade fica
 * > em `plataforma/autorizacao/`, porque e chamada 1.279 vezes em 224 arquivos"*.
 * > Este arquivo **grava dado**. Ele nao responde "pode".
 *
 * > ⚠️ **T015 (US-7) e T023 (US-11) sao as donas da administracao de papel**, e
 * > nenhuma das duas fechou. Esta e a fatia minima que CA-6.4 exige — *"a conta
 * > criada recebe o papel padrao de menor poder"* —, e e ela que resolve o ponto que
 * > T002 deixou nomeado em `../armazenamento/chaves-e-tabelas.ts`: *"[a chave
 * > `{site}user_level`] aqui so tem **nome**: quem a deriva e quem a escreve e a
 * > tarefa da atribuicao de papel, nao esta"*.
 *
 * ## As duas escritas, e por que a ordem delas e contrato
 *
 * O legado grava **duas** chaves de metadado, nesta ordem:
 *
 * 1. `{site}capabilities` — o mapa serializado com o papel;
 * 2. `{site}user_level` — o nivel numerico **derivado** do que a conta passou a ter.
 *
 * A ordem e observavel porque nao ha transacao (BR-MIGRAR-104, e
 * `../portas/porta-de-dados.ts` registra *"uma sequencia de escritas daqui pode
 * falhar no meio e deixar estado parcial — e o estado parcial e a regra, nao o
 * defeito"*). Invertendo a ordem, a conta que falhar no meio fica com nivel e sem
 * papel em vez de com papel e sem nivel. A suite afirma a ordem.
 *
 * ## 🟢 Por que isto NAO decide o conflito REQ-017
 *
 * T002 travou a matriz de fabrica num argumento obrigatorio porque as
 * pseudocapacidades de nivel numerico (`level_0` a `level_10`) estao em disputa
 * entre o card `REQ-017` e a resposta 5 — e `../armazenamento/matriz-de-fabrica.ts`
 * registra, entre as consequencias que o card nao menciona, que *"a chave
 * `{site}user_level` do metadado e **derivada** dessas capacidades, e o card nao diz
 * o que acontece com ela"*.
 *
 * **Este arquivo deriva o nivel em vez de tabela-lo**, e e por isso que ele funciona
 * nos dois lados sem escolher nenhum:
 *
 * | lado do conflito | o que a matriz tem para `subscriber` | nivel derivado |
 * |---|---|---|
 * | `legado-integral` | `read`, `level_0` | `0` |
 * | `req-017-sem-niveis` | `read` | `0` |
 *
 * Os dois dao `0`, porque a reducao **comeca** em zero. Para o papel padrao de
 * fabrica a decisao e indiferente; para qualquer outro papel o valor sai da matriz
 * que a instalacao gravou, que e exatamente onde a decisao vai morar quando alguem
 * a tomar. Escrever uma tabela de nivel aqui seria escolher um lado.
 */

import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';

/**
 * O padrao que reconhece uma pseudocapacidade de nivel numerico.
 *
 * E o do legado, com as duas particularidades dele: aceita **`10`**, e ignora caixa.
 * `level_11` nao casa; `LEVEL_3` casa.
 */
export const PADRAO_DE_NIVEL_NUMERICO = /^level_(10|[0-9])$/i;

/**
 * O nivel de um conjunto de nomes de capacidade: o **maior** nivel presente, ou
 * zero.
 *
 * ⚠️ **Decide pelo nome presente, nao pela concessao.** No legado a reducao percorre
 * as **chaves** do mapa de capacidades, e o mapa mistura concedida e negada — logo
 * uma capacidade `level_7` **negada** ainda levanta o nivel para 7. Filtrar por
 * concedida aqui produziria nivel menor que o do oraculo para toda conta com
 * negacao explicita, e a negacao explicita e `ADR-0009`, nao caso de borda.
 */
export function nivelDasCapacidades(nomes: readonly string[]): number {
  let maior = 0;
  for (const nome of nomes) {
    const casamento = PADRAO_DE_NIVEL_NUMERICO.exec(nome);
    if (casamento === null) {
      continue;
    }
    const nivel = Number.parseInt(casamento[1] as string, 10);
    if (nivel > maior) {
      maior = nivel;
    }
  }
  return maior;
}

/**
 * Os nomes que a conta passa a ter depois de receber **somente** aquele papel.
 *
 * Sao o nome do papel **mais** as capacidades que a definicao gravada da a ele — e o
 * nome do papel entra porque no legado ele vai para o mesmo mapa que as capacidades,
 * e e dai que vem a regra de BR-MIGRAR-087: *"uma conta pode ter capacidade sem papel
 * nenhum"*. Papel que a definicao nao conhece contribui so com o proprio nome, como
 * no legado: o papel e gravado de todo jeito.
 */
export function nomesDaContaComPapel(
  papeis: RepositorioDePapeis,
  papel: string,
): readonly string[] {
  const definicao = papeis.obterDefinicao();
  const entrada = definicao?.interpretado?.find(
    (candidata) => candidata.identificador === papel,
  );
  const capacidades = entrada?.papel.capacidades ?? [];
  return [...capacidades.map((concessao) => concessao.capacidade), papel];
}

/** O que a atribuicao informa de volta. */
export interface ResultadoDaAtribuicaoDePapel {
  readonly papel: string;
  readonly nivel: number;
  /** Chegou a escrever `{site}capabilities`? */
  readonly capacidadesGravadas: boolean;
  /** Chegou a escrever `{site}user_level`? */
  readonly nivelGravado: boolean;
}

/**
 * Da a conta **exatamente** aquele papel, e nenhum outro.
 *
 * Substitui o conjunto em vez de somar, que e o que o legado faz: ele remove os
 * papeis antigos do mapa antes de por o novo. Para uma conta recem-criada nao ha o
 * que remover, e e por isso que esta fatia serve ao cadastro sem resolver o caso
 * geral — **promover e rebaixar e T023**, com os criterios de CA-11.4 a CA-11.6 que
 * esta tarefa nao tem como fazer passar.
 */
export function atribuirPapel(
  papeis: RepositorioDePapeis,
  contaId: number,
  papel: string,
): ResultadoDaAtribuicaoDePapel {
  const capacidadesGravadas = papeis.gravarCapacidadesDaConta(contaId, [
    { capacidade: papel, concedida: true },
  ]);

  const nivel = nivelDasCapacidades(nomesDaContaComPapel(papeis, papel));
  const nivelGravado = papeis.gravarNivelDaConta(contaId, nivel);

  return { papel, nivel, capacidadesGravadas, nivelGravado };
}
