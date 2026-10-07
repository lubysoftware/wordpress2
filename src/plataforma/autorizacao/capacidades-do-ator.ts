/**
 * O mapa de capacidades do ator — o `allcaps` do legado.
 *
 * `PERM-1` (BR-MIGRAR-087), na letra: *"`allcaps` funde as capacidades de **cada**
 * papel do usuario e sobrepoe as individuais; um usuario pode ter varios papeis,
 * ou capacidade sem papel nenhum"*. ADR-0001 aponta as linhas
 * (`class-wp-user.php:533`-`:538`) e repete a ordem: primeiro os papeis, na ordem
 * em que aparecem, depois as individuais por cima.
 *
 * Tres detalhes de mecanismo que decidem o resultado, e nenhum deles e visivel em
 * quem le so a tabela de papeis:
 *
 * 1. **O que e papel decide-se pela MATRIZ, nao por uma lista no codigo.** O
 *    legado filtra as chaves da chave `{site}capabilities` por
 *    `WP_Roles::is_role()`. Isso e CA-7.1 em mecanismo: nenhum nome de papel
 *    aparece em decisao nenhuma, porque quem diz que um nome e papel e o dado.
 * 2. **O filtro olha a CHAVE, nao o valor.** `array_filter( array_keys( $caps ),
 *    'is_role' )`: um papel gravado com valor `false` continua sendo papel do
 *    ator, e as capacidades dele continuam entrando no mapa. ⚠️ Mecanismo lido do
 *    legado e **nao documentado nome por nome neste pacote**; a confirmacao e
 *    contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116). A escolha oposta — exigir
 *    valor verdadeiro — produziria um sistema **mais fechado** que o legado, que
 *    e o erro que esta feature existe para nao cometer.
 * 3. **O nome do papel sobra no mapa como se fosse capacidade.** A sobreposicao
 *    final e `array_merge( $allcaps, $caps )`, e `$caps` tem o papel como chave.
 *    Logo perguntar por um nome de papel responde "sim" no legado. Isto **nao**
 *    e o sistema comparando nome de papel (CA-7.1): e o dado do ator contendo o
 *    nome, e nenhuma decisao daqui o consulta. Esta reproduzido de proposito
 *    (**P1**) e ha teste fixando-o, para que ninguem o "conserte" sem decisao
 *    humana.
 *
 * `Map` e nao objeto porque a posicao da chave e a semantica de `array_merge` do
 * legado: `Map.set` de chave existente **troca o valor e mantem a posicao**, que
 * e exatamente o que o PHP faz. A posicao importa para quem percorre o mapa num
 * ponto de extensao.
 */

import {
  capacidadesDoPapel,
  temPapel,
  type MatrizDePapeis,
} from './capacidade.js';
import type { AtorDeAutorizacao } from './contexto-de-autorizacao.js';

/**
 * Os papeis do ator: as chaves da autorizacao gravada que a matriz reconhece
 * como papel, na ordem gravada.
 */
export function papeisDoAtor(
  ator: AtorDeAutorizacao,
  matriz: MatrizDePapeis,
): readonly string[] {
  return ator.concessoes
    .filter((concessao) => temPapel(matriz, concessao.capacidade))
    .map((concessao) => concessao.capacidade);
}

/**
 * O mapa de capacidades do ator, antes do ponto de extensao e antes das duas
 * sinteticas.
 *
 * Quem aplica `exist` e `do_not_allow` e a decisao, nesta ordem e **depois** do
 * ponto de extensao: ver `decisao-de-capacidade.ts`. Devolver o mapa sem elas e o
 * que permite ao interceptador ver o mesmo valor que o legado lhe entrega.
 */
export function capacidadesDoAtor(
  ator: AtorDeAutorizacao,
  matriz: MatrizDePapeis,
): ReadonlyMap<string, boolean> {
  const capacidades = new Map<string, boolean>();

  for (const papel of papeisDoAtor(ator, matriz)) {
    for (const concessao of capacidadesDoPapel(matriz, papel)) {
      capacidades.set(concessao.capacidade, concessao.concedida);
    }
  }

  // As individuais por cima — e o nome do papel vem junto, ver o item 3.
  for (const concessao of ator.concessoes) {
    capacidades.set(concessao.capacidade, concessao.concedida);
  }

  return capacidades;
}
