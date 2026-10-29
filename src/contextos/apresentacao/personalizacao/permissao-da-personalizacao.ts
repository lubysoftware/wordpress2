/**
 * A permissao da personalizacao: o caso `customize` da traducao de capacidade,
 * e a declaracao explicita de permissao de cada operacao de US-1 (**P4**).
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao` —
 * **CA-1.4**, *"A aplicacao exige a capacidade declarada de administrar a
 * aparencia"*, e a regra *"A personalizacao resolve para a capacidade de
 * administrar aparencia"* de US-1.
 *
 * ## O caso `customize`
 *
 * `map_meta_cap()` tem o caso literal (`wp-includes/capabilities.php:698`-`:700`):
 *
 * ```php
 * case 'customize':
 *     $caps[] = 'edit_theme_options';
 *     break;
 * ```
 *
 * E um dos *"dez atalhos de nomenclatura"* de `PERM-6` (BR-MIGRAR-092), e
 * `plataforma/autorizacao/traducao-de-capacidade.ts` registra que esses atalhos
 * *"chegam com os casos deles"*, pelo ponto de encaixe `casosDeTraducao`. Sem
 * ele a pergunta `customize` cai no ramo final — `$caps[] = $cap` — e e negada a
 * todo mundo, porque `customize` nao esta em papel nenhum.
 *
 * ## 🔴 Por que TODA verificacao de US-1 vira `customize`
 *
 * O tipo `customize_changeset` declara doze das quinze capacidades como
 * `customize` (`wp-includes/post.php:246`-`:262`, transcrito em
 * `armazenamento/tipo-do-conjunto.ts`), e o Customizer pergunta pelo **nome
 * resolvido**, nao pela meta-capacidade:
 *
 * | onde | o que o legado pergunta | o que isso e |
 * |---|---|---|
 * | `wp-admin/customize.php:15`, `class-wp-customize-manager.php:519` | `current_user_can( 'customize' )` | abrir a tela |
 * | `class-wp-customize-manager.php:2450` | `->cap->create_posts` | `customize` — criar o conjunto |
 * | `wp-admin/customize.php:31`, `class-wp-customize-manager.php:2454` | `->cap->edit_post, $id` | `customize` — editar o conjunto existente |
 * | `class-wp-customize-manager.php:2483` | `->cap->publish_posts` | `customize` — publicar ou agendar |
 *
 * Logo as quatro chegam ao mesmo `edit_theme_options`, e e isso que CA-1.4
 * chama de *"a capacidade declarada de administrar a aparencia"*. ⚠️ Elas
 * continuam sendo **quatro verificacoes em quatro pontos**, e e essa separacao
 * que **T005** (US-2, CA-2.1) explora: uma extensao que mude a declaracao do
 * tipo ou o mapeamento separa salvar de aplicar sem tocar este arquivo.
 *
 * O objeto **viaja** na verificacao de edicao (`$changeset_post->ID`), como no
 * legado; o caso `customize` o ignora, que e o que `map_meta_cap()` faz.
 */

import {
  perguntarPermissao,
  type CasoDeTraducao,
  type ContextoDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { capacidadesResolvidasDoConjunto } from '../armazenamento/index.js';

/** `customize` — a meta-capacidade da personalizacao. */
export const CAPACIDADE_DE_PERSONALIZAR = 'customize';

/** `edit_theme_options` — a capacidade primitiva que `customize` exige. */
export const CAPACIDADE_DE_ADMINISTRAR_A_APARENCIA = 'edit_theme_options';

/** O caso `customize` de `map_meta_cap()` (`wp-includes/capabilities.php:698`). */
export const casoDaPersonalizacao: CasoDeTraducao = (pedido) =>
  pedido.capacidade === CAPACIDADE_DE_PERSONALIZAR
    ? [CAPACIDADE_DE_ADMINISTRAR_A_APARENCIA]
    : null;

/**
 * `current_user_can( $capacidade, ...$argumentos )` com o caso `customize`
 * entre os casos de traducao.
 *
 * O caso entra **antes** dos que a base trouxer, e a ordem nao muda resultado:
 * nenhum outro caso do legado reconhece `customize`. A revogacao pelas quatro
 * constantes continua primeiro, porque quem a poe e a decisao
 * (`decisao-de-capacidade.ts`), nao a lista.
 */
export function perguntarNaPersonalizacao(
  autorizacao: ContextoDeAutorizacao,
  capacidade: string,
  ...argumentos: readonly unknown[]
): boolean {
  const casos = autorizacao.casosDeTraducao ?? [];
  return perguntarPermissao(
    casos.includes(casoDaPersonalizacao)
      ? autorizacao
      : { ...autorizacao, casosDeTraducao: [casoDaPersonalizacao, ...casos] },
    capacidade,
    ...argumentos,
  );
}

/** A capacidade que o tipo do conjunto declara para um papel do registro. */
function capacidadeDoTipo(nome: string): string {
  return capacidadesResolvidasDoConjunto()[nome] as string;
}

/**
 * A permissao declarada de cada operacao de US-1, como o **P4** cobra: *"toda
 * operacao exposta nova nasce com declaracao explicita de permissao"*.
 *
 * Os valores sao **lidos da declaracao do tipo** (`create_posts`, `edit_post`,
 * `publish_posts`), e nao escritos de novo aqui, porque e assim que o legado os
 * le — `get_post_type_object( 'customize_changeset' )->cap->...`.
 */
export const PERMISSOES_DA_PERSONALIZACAO = {
  /** Abrir a tela, ou ver a previa autenticado (`customize.php:15`). */
  abrir: CAPACIDADE_DE_PERSONALIZAR,
  /** Gravar um conjunto que ainda nao existe (`:2450`). */
  criarConjunto: capacidadeDoTipo('create_posts'),
  /** Gravar sobre um conjunto existente, com o objeto (`:2454`). */
  editarConjunto: capacidadeDoTipo('edit_post'),
  /** Pedir `publish` ou `future` (`:2483`). */
  aplicarConjunto: capacidadeDoTipo('publish_posts'),
} as const;
