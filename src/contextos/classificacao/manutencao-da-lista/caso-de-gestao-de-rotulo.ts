/**
 * Os **cinco** atalhos de nomenclatura de capacidade que US-4 cobra: gerenciar,
 * editar e apagar rotulo resolvem todos para **uma** capacidade real.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4,
 * **CA-4.1**). E a regra de negocio que a propria `spec.md` lista em US-4 —
 * *"Cinco nomes de capacidade de taxonomia resolvem todos para a mesma
 * capacidade real"* —, o caso `UT-036-7` do catalogo e a primeira linha de
 * *Regras de negocio aplicadas* de UC-08:
 *
 * > `manage_post_tags`, `edit_categories`, `edit_post_tags`, `delete_categories`
 * > e `delete_post_tags` resolvem todas para `manage_categories`
 * > (`permissions.md` 5.4)
 *
 * `BR-MIGRAR-092` (`PERM-6`) conta os dez atalhos do sistema e diz que **cinco
 * deles sao estes**, com ancora em `wp-includes/capabilities.php:751`. UC-08 cita
 * a mesma linha em *Implementado em*, e a tabela de rastreabilidade de `spec.md`
 * a repete para US-5.
 *
 * ---
 *
 * # Por que este caso mora aqui, e nao em `plataforma/autorizacao/`
 *
 * `plataforma/autorizacao/index.ts` declarou a propria fronteira em T015 da
 * feature `001`: *"O que esta pasta nao tem, e de proposito: ... os dez atalhos
 * de nomenclatura de `PERM-6` (chegam com os casos deles)"*. E o gemeo deste
 * arquivo, `../vinculo-de-objeto/caso-de-atribuicao-de-rotulo.ts` (T005),
 * **nomeou esta tarefa por escrito**: *"cinco deles sao os nomes de taxonomia que
 * resolvem para `manage_categories` (`capabilities.php:749`-`:754`) — esses cinco
 * sao de T009, porque sao as capacidades de *gerenciar* a lista (UC-08,
 * CA-4.1)"*.
 *
 * Os dois casos desta feature sao **disjuntos**, e a divisao e a do legado:
 *
 * | caso | nomes | resolve para | tarefa |
 * |---|---|---|---|
 * | atribuir rotulo a um objeto | `assign_categories`, `assign_post_tags` | **`edit_posts`** | T005 |
 * | gerenciar, editar e apagar rotulo | os **cinco** deste arquivo | **`manage_categories`** | **T009** |
 *
 * ⚠️ **E e por causa dessa divisao que a linha de *Autorizacao* de UC-08 nao pode
 * ser lida ao pe da letra.** Ela diz *"as quatro capacidades da taxonomia
 * (`manage_terms`, `edit_terms`, `delete_terms`, `assign_terms`), que para
 * categorias e tags resolvem todas para `manage_categories`"* — e a quarta
 * **nao** resolve para `manage_categories`: `assign_categories` e
 * `assign_post_tags` caem em `edit_posts`, que e o atalho que T005 portou com a
 * ancora `capabilities.php:757`-`:759` e que UC-05 resume em uma frase
 * (*"atribuir termo e poder de conteudo, nao de classificacao"*). Achatar as
 * quatro no mesmo nome trancaria o autor fora da propria tela de edicao, que e a
 * assimetria que `../registro/contexto-de-classificacao.ts` registra no default
 * de `$tax->cap`.
 *
 * # Qual nome NAO esta nesta lista, e por que
 *
 * **`manage_categories` nao esta**, e a ausencia e a regra: ela e a capacidade
 * **real**, a que os cinco resolvem, e e ela que esta na matriz de papeis de
 * fabrica. `category` declara `manage_categories` em `manage_terms`
 * (`../registro/contextos-do-nucleo.ts`), logo esse nome atravessa a traducao
 * pelo `default:` de `traducao-de-capacidade.ts` — *"e por ele que uma capacidade
 * primitiva como `manage_options` atravessa a traducao sem mudanca"*.
 *
 * A conta fecha assim, e e ela que explica por que sao cinco e nao seis:
 *
 * | contexto | `manage_terms` | `edit_terms` | `delete_terms` |
 * |---|---|---|---|
 * | `category` | `manage_categories` — **real** | `edit_categories` — atalho | `delete_categories` — atalho |
 * | `post_tag` | `manage_post_tags` — atalho | `edit_post_tags` — atalho | `delete_post_tags` — atalho |
 *
 * ⚠️ **Sem este caso, ninguem gerencia a lista de etiquetas.** `manage_post_tags`
 * **nao e capacidade primitiva e nao esta em papel nenhum** da matriz de fabrica:
 * o `default:` da traducao devolveria o proprio nome pedido, a comparacao nao o
 * encontraria no mapa do ator e **todo mundo seria recusado, inclusive o
 * administrador**. E o mesmo defeito que `BR-MIGRAR-092` descreve e que
 * `caso-de-atribuicao-de-rotulo.ts` ja havia registrado para os outros dois
 * nomes.
 *
 * # Os outros nomes de capacidade de contexto nao estao aqui
 *
 * Um contexto registrado por extensao declara os nomes que quiser
 * (`../registro/contexto-de-classificacao.ts`), e eles passam pela traducao sem
 * atalho nenhum — e e isso que o legado faz. O colapso **nao** e aplicado no
 * registro, de proposito (ver o mesmo arquivo): quem o aplica e a traducao, e so
 * para os nomes que o legado lista. `nav_menu` declara `edit_theme_options` nas
 * quatro e `link_category` declara `manage_links`: as duas sao primitivas e
 * atravessam pelo `default:`.
 *
 * # 🔴 As capacidades sobre o OBJETO termo nao estao aqui, e sao de T011
 *
 * `map_meta_cap()` tem, alem destes cinco atalhos, o `case` que traduz a
 * capacidade **sobre um termo** — o `delete_term` e o `edit_term` que a tela pede
 * com o identificador do termo em maos (`target_screens.md`, `SCR-044`,
 * *"Capacidade exigida: `delete_term`, `edit_term`, `import`"*). Esse `case`
 * carrega a regra que `BR-MIGRAR-091` (`PERM-5`) poe em
 * `wp-includes/capabilities.php:738` — *"o **termo padrao da taxonomia e
 * indestrutivel**"* — e e **US-5, T011**: `CA-5.1` (*"apagar o termo declarado
 * como padrao de um contexto e recusado, para qualquer ator"*), `CA-5.2` (*"a
 * recusa vence inclusive o ator de maior poder"*) e o ADR 0009 que `spec.md` cita
 * nela.
 *
 * Porta-lo aqui seria decidir US-5 dentro de T009. O que esta tarefa faz e portar
 * **o atalho de nomenclatura** (`:751`), que e o que CA-4.1 e `UT-036-7` pedem, e
 * deixar o `case` de objeto para a tarefa que tem o criterio dele — ver
 * `permissao-na-gestao-de-rotulos.ts`, que declara quais portoes da tela
 * dependem dele.
 */

import type {
  Capacidade,
  CasoDeTraducao,
} from '../../../plataforma/autorizacao/index.js';

/**
 * `manage_post_tags` — o nome que `post_tag` declara em `manage_terms`
 * (`../registro/contextos-do-nucleo.ts`, de `wp-includes/taxonomy.php:86`).
 */
export const CAPACIDADE_DE_GERENCIAR_ETIQUETAS: Capacidade = 'manage_post_tags';

/** `edit_categories` — o `edit_terms` de `category` (`taxonomy.php:63`). */
export const CAPACIDADE_DE_EDITAR_CATEGORIAS: Capacidade = 'edit_categories';

/** `edit_post_tags` — o `edit_terms` de `post_tag` (`taxonomy.php:86`). */
export const CAPACIDADE_DE_EDITAR_ETIQUETAS: Capacidade = 'edit_post_tags';

/** `delete_categories` — o `delete_terms` de `category` (`taxonomy.php:63`). */
export const CAPACIDADE_DE_APAGAR_CATEGORIAS: Capacidade = 'delete_categories';

/** `delete_post_tags` — o `delete_terms` de `post_tag` (`taxonomy.php:86`). */
export const CAPACIDADE_DE_APAGAR_ETIQUETAS: Capacidade = 'delete_post_tags';

/**
 * `manage_categories` — a capacidade **real** em que os cinco caem.
 *
 * E primitiva e esta na matriz de papeis de fabrica; e tambem o que `category`
 * declara em `manage_terms`, e por isso ela **nao** entra na lista de atalhos
 * (ver a tabela do cabecalho).
 */
export const CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO: Capacidade =
  'manage_categories';

/** Os cinco nomes que este caso reconhece, e so eles. */
export const CAPACIDADES_DE_GESTAO_DE_ROTULO: readonly Capacidade[] = [
  CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
  CAPACIDADE_DE_EDITAR_CATEGORIAS,
  CAPACIDADE_DE_EDITAR_ETIQUETAS,
  CAPACIDADE_DE_APAGAR_CATEGORIAS,
  CAPACIDADE_DE_APAGAR_ETIQUETAS,
];

/**
 * O caso de traducao: cinco nomes para `manage_categories`, e `null` para todo o
 * resto.
 *
 * `null` e *"nao e meu caso"* e e diferente de `[]`, que e *"permitido"*, e de
 * `['do_not_allow']`, que e *"negado"* — ver
 * `plataforma/autorizacao/traducao-de-capacidade.ts`. Devolver `[]` aqui
 * permitiria a todos gerenciar a lista de etiquetas, que e a pegadinha 2 de
 * `permissions.md` lida ao contrario.
 *
 * A **posicao** deste caso na ordem declarada nao muda decisao nenhuma, e isso e
 * verificavel: ele reconhece exatamente cinco nomes e nenhum outro caso do pacote
 * os trata, logo ele e disjunto de todos. `BR-MIGRAR-094` exige que a ordem seja
 * declarada no alvo, e ela esta em
 * `plataforma/autorizacao/decisao-de-capacidade.ts`: as quatro constantes do dono
 * do servidor **sempre primeiro**, depois os casos que o contexto trouxer.
 */
export const casoDeGestaoDeRotulo: CasoDeTraducao = (pedido) => {
  if (!CAPACIDADES_DE_GESTAO_DE_ROTULO.includes(pedido.capacidade)) {
    return null;
  }
  return [CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO];
};
