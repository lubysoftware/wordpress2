/**
 * Os **dois** atalhos de nomenclatura de capacidade que US-2 cobra: atribuir
 * rotulo e poder de **conteudo**, nao de classificacao.
 *
 * Entrega de **T005** da feature `003-classificacao-do-conteudo` (US-2). E a
 * linha de *Autorizacao* de UC-05, literal: *"`assign_categories` e
 * `assign_post_tags` resolvem para `edit_posts` — atribuir termo e poder de
 * conteudo, nao de classificacao"*, com a anchor
 * `wp-includes/capabilities.php:757`-`:759`:
 *
 * ```php
 * case 'assign_categories':
 * case 'assign_post_tags':
 *     $caps[] = 'edit_posts';
 *     break;
 * ```
 *
 * ---
 *
 * # Por que este caso mora aqui, e nao em `plataforma/autorizacao/`
 *
 * `plataforma/autorizacao/index.ts` declara a propria fronteira: *"O que esta
 * pasta nao tem, e de proposito: ... os dez atalhos de nomenclatura de `PERM-6`
 * (chegam com os casos deles)"*. `BR-MIGRAR-092` (`PERM-6`) conta os dez, e cinco
 * deles sao os nomes de taxonomia que resolvem para `manage_categories`
 * (`capabilities.php:749`-`:754`) — **esses cinco sao de T009**, porque sao as
 * capacidades de *gerenciar* a lista (UC-08, CA-4.1). Os dois daqui sao os de
 * *atribuir*, e sao os que esta historia pergunta.
 *
 * ⚠️ **Sem este caso, ninguem classifica nada.** `assign_categories` nao e
 * capacidade primitiva e **nao esta em papel nenhum** da matriz de fabrica: o
 * ramo `default:` da traducao devolveria o proprio nome pedido
 * (`../../../plataforma/autorizacao/traducao-de-capacidade.ts`), a comparacao nao
 * o encontraria no mapa do ator e **todo mundo seria recusado**, inclusive o
 * administrador. E o defeito que `BR-MIGRAR-092` descreve de ponta a ponta.
 *
 * # A posicao na ordem nao muda decisao nenhuma, e isso e verificavel
 *
 * `BR-MIGRAR-094` exige que a ordem de avaliacao seja declarada no alvo, e ela e
 * declarada em `decisao-de-capacidade.ts`: as quatro constantes do dono do
 * servidor **sempre primeiro**, depois os casos que o contexto trouxer. Este caso
 * reconhece **exatamente dois nomes** e devolve `null` para todo o resto, logo ele
 * e disjunto de qualquer outro caso do pacote: nenhum dos 86 `case` do legado
 * trata `assign_categories` duas vezes. Declara-lo duas vezes na mesma lista
 * tambem nao muda nada — o primeiro que reconhece responde.
 *
 * # Os outros nomes de capacidade de contexto NAO estao aqui
 *
 * Um contexto registrado por extensao declara os nomes que quiser
 * (`../registro/contexto-de-classificacao.ts`), e eles passam pela traducao sem
 * atalho nenhum — e e isso que o legado faz. O colapso dos cinco nomes de
 * categoria e etiqueta **nao e aplicado no registro** de proposito (ver o mesmo
 * arquivo): quem o aplica e a traducao, e so para os nomes que o legado lista.
 */

import type {
  Capacidade,
  CasoDeTraducao,
} from '../../../plataforma/autorizacao/index.js';

/**
 * `assign_categories` — o nome que `category` declara em `assign_terms`
 * (`wp-includes/taxonomy.php:78`).
 */
export const CAPACIDADE_DE_ATRIBUIR_CATEGORIA: Capacidade = 'assign_categories';

/**
 * `assign_post_tags` — o nome que `post_tag` declara em `assign_terms`
 * (`wp-includes/taxonomy.php:102`).
 */
export const CAPACIDADE_DE_ATRIBUIR_ETIQUETA: Capacidade = 'assign_post_tags';

/**
 * `edit_posts` — a capacidade primitiva em que os dois caem.
 *
 * ⚠️ E a assimetria que `../registro/contexto-de-classificacao.ts` registra no
 * default de `$tax->cap`: tres das quatro capacidades de um contexto caem em
 * `manage_categories` e a quarta cai aqui. *"Um default uniforme trancaria o autor
 * fora da propria tela de edicao"*.
 */
export const CAPACIDADE_DE_EDITAR_CONTEUDO: Capacidade = 'edit_posts';

/** Os dois nomes que este caso reconhece, e so eles. */
export const CAPACIDADES_DE_ATRIBUICAO_DE_ROTULO: readonly Capacidade[] = [
  CAPACIDADE_DE_ATRIBUIR_CATEGORIA,
  CAPACIDADE_DE_ATRIBUIR_ETIQUETA,
];

/**
 * O caso de traducao: dois nomes para `edit_posts`, e `null` para todo o resto.
 *
 * `null` e *"nao e meu caso"* e e diferente de `[]`, que e *"permitido"*, e de
 * `['do_not_allow']`, que e *"negado"* — ver `traducao-de-capacidade.ts`.
 */
export const casoDeAtribuicaoDeRotulo: CasoDeTraducao = (pedido) => {
  if (!CAPACIDADES_DE_ATRIBUICAO_DE_ROTULO.includes(pedido.capacidade)) {
    return null;
  }
  return [CAPACIDADE_DE_EDITAR_CONTEUDO];
};
