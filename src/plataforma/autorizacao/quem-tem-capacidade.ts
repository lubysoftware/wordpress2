/**
 * CA-7.4 — *"e possivel responder, por consulta ao armazenamento, quem tem uma
 * capacidade dada"*.
 *
 * E o criterio desta historia que mais parece contrariar o legado, e nao
 * contraria: o que `permissions.md` registra na pegadinha 5 — citada por US-7 — e
 * que **nenhuma consulta SQL responde "quem e administrador"**, porque a
 * autorizacao mora num valor serializado e nenhum indice a alcanca. A resposta
 * existe; o que nao existe e um indice. O `plan.md` desta feature e literal:
 * *"normalizar isso e permitido; mudar o que a interface de papeis devolve,
 * nao"* — e T002 escolheu nao normalizar, deixando a busca por texto com curinga
 * como esta no legado.
 *
 * Logo a resposta se monta em **dois passos**, e eles estao separados de proposito:
 *
 * 1. {@link candidatosComCapacidade} — o que o **armazenamento** alcanca: as contas
 *    cujo valor serializado menciona um papel que concede a capacidade, ou a
 *    propria capacidade. E uma busca por **nome**, nao por valor.
 * 2. {@link quemTemCapacidade} — o que a **decisao** confirma: cada candidato
 *    atravessa `perguntarPermissao` inteiro.
 *
 * O segundo passo nao e zelo: sem ele a resposta mentiria em tres casos que o
 * legado produz todo dia — capacidade gravada com valor `false` (o nome esta no
 * texto, a concessao nao existe), papel que **nega** a capacidade, e capacidade
 * fechada por `do_not_allow`, que vence qualquer concessao (CA-7.3). Uma lista que
 * ignorasse isso diria que alguem pode o que o sistema lhe nega.
 *
 * ## Duas ausencias declaradas
 *
 * - **A busca nao alcanca o que chega por ponto de extensao.** Capacidade
 *   concedida no `user_has_cap` nao esta gravada em lugar nenhum, logo nao esta no
 *   texto que o `LIKE` percorre. No legado e igual, e e por isso que as quatro
 *   capacidades de `PERM-7` (BR-MIGRAR-093) nao aparecem em consulta alguma —
 *   elas sao US-9 / T019.
 * - **O pacote nao documenta a consulta de usuarios por capacidade do legado.**
 *   `plan.md` e `PERM-2` documentam a busca por **papel**; se o legado, na mesma
 *   versao, responde "quem tem a capacidade X" sem confirmar cada candidato, a
 *   lista dele e mais longa que esta — e a diferenca fecha contra o oraculo
 *   executavel (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe. Os
 *   dois passos estao expostos separados exatamente para que essa conferencia nao
 *   precise reescrever nada.
 */

import { papeisQueConcedem, type Capacidade } from './capacidade.js';
import {
  comAtor,
  type BaseDeAutorizacao,
} from './contexto-de-autorizacao.js';
import { perguntarPermissao } from './decisao-de-capacidade.js';
import {
  atorDeAutorizacao,
  type FonteDeAutorizacao,
} from './fonte-de-autorizacao.js';

/**
 * Os candidatos que o armazenamento alcanca, em ordem crescente de identificador.
 *
 * A ordem e desta funcao, nao do banco: o legado nao declara ordem para esta
 * busca, e devolver a ordem de chegada de duas consultas faria o resultado
 * depender de qual papel foi procurado primeiro.
 */
export function candidatosComCapacidade(
  capacidade: Capacidade,
  base: BaseDeAutorizacao,
  fonte: FonteDeAutorizacao,
): readonly number[] {
  const nomes = [
    ...papeisQueConcedem(base.matriz, capacidade),
    // A propria capacidade: uma conta pode te-la sem papel nenhum (`PERM-1`).
    capacidade,
  ];

  const encontrados = new Set<number>();
  for (const nome of nomes) {
    for (const contaId of fonte.contasComNomeNasCapacidades(nome)) {
      encontrados.add(contaId);
    }
  }

  return [...encontrados].sort((um, outro) => um - outro);
}

/**
 * Quem tem a capacidade, pela mesma decisao que toda outra pergunta usa.
 *
 * Nao recebe o ator: ele e construido por candidato. E por isso que
 * {@link BaseDeAutorizacao} existe separada do contexto — a matriz, a rede, as
 * constantes e os ganchos sao os mesmos para todos, e so a identidade muda.
 */
export function quemTemCapacidade(
  capacidade: Capacidade,
  base: BaseDeAutorizacao,
  fonte: FonteDeAutorizacao,
): readonly number[] {
  return candidatosComCapacidade(capacidade, base, fonte).filter((contaId) =>
    perguntarPermissao(
      comAtor(base, atorDeAutorizacao(contaId, fonte)),
      capacidade,
    ),
  );
}
