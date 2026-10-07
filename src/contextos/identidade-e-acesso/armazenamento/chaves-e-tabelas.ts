/**
 * Os nomes: tabelas, chaves de metadado e nome de opcao.
 *
 * Isto nao e configuracao: **e dado**. A nota 3 de `target_data_model.md` diz
 * por que, em uma linha: *"a referencia ao site mora DENTRO do texto da
 * `meta_key` — `{p}2_capabilities`. Logo o prefixo de tabela nao e so
 * configuracao de conexao: ele e dado, e aparece dentro de valores."* Montar
 * qualquer um destes nomes a mao, espalhado pelo modulo, e a forma mais barata
 * de produzir uma instalacao de rede em que uma conta le a autorizacao de outro
 * site.
 *
 * As duas familias nao usam o mesmo prefixo, e a diferenca e regra:
 *
 * - `users` e `usermeta` sao **globais** e ficam no prefixo **base**;
 * - `options` e **por site** e fica no prefixo **do site**;
 * - as chaves de metadado de autorizacao levam o prefixo **do site** dentro do
 *   nome (BR-MIGRAR-088), e a de sessao **nao leva prefixo nenhum**.
 */

import type { PortaDeDados } from '../portas/index.js';

/** Os dois prefixos da instalacao, lidos da porta. */
export interface Prefixos {
  /** `$wpdb->base_prefix` — tabelas globais. */
  readonly base: string;
  /** `$wpdb->prefix` / `get_blog_prefix()` — tabelas por site e nomes de chave. */
  readonly doSite: string;
}

export function prefixosDe(dados: PortaDeDados): Prefixos {
  return { base: dados.prefixoBaseDeTabela, doSite: dados.prefixoDeTabela };
}

/** `{base}users` — global, as 10 colunas (ou 12, na variante de rede). */
export function tabelaDeContas(prefixos: Prefixos): string {
  return `${prefixos.base}users`;
}

/** `{base}usermeta` — global. Guarda perfil, autorizacao e sessao. */
export function tabelaDeMetadadosDeConta(prefixos: Prefixos): string {
  return `${prefixos.base}usermeta`;
}

/** `{site}options` — por site. Guarda a definicao dos papeis. */
export function tabelaDeOpcoes(prefixos: Prefixos): string {
  return `${prefixos.doSite}options`;
}

/**
 * `{site}capabilities` — onde a autorizacao mora (BR-MIGRAR-088, `PERM-2`).
 *
 * O arranjo guardado nesta chave mistura **papel e capacidade individual** no
 * mesmo mapa de nome para booleano: e por isso que uma conta pode ter
 * capacidade sem papel nenhum (BR-MIGRAR-087).
 */
export function chaveDeCapacidades(prefixos: Prefixos): string {
  return `${prefixos.doSite}capabilities`;
}

/**
 * `{site}user_level` — o nivel numerico derivado das pseudocapacidades.
 *
 * ⚠️ **Esta chave esta dentro do conflito que T002 nao resolve** (REQ-017
 * contra a resposta 5): o valor dela e derivado das capacidades `level_0` a
 * `level_10`, e se elas saem da matriz nao ha decisao registrada sobre o que
 * acontece com a chave. Aqui ela so tem **nome**: quem a deriva e quem a
 * escreve e a tarefa da atribuicao de papel, nao esta. Ver
 * `matriz-de-fabrica.ts`.
 */
export function chaveDeNivel(prefixos: Prefixos): string {
  return `${prefixos.doSite}user_level`;
}

/**
 * `session_tokens` — **sem prefixo**, e isso nao e esquecimento.
 *
 * A sessao e da conta, nao do site: numa rede a mesma sessao vale em todos os
 * sites, enquanto a autorizacao muda de chave a cada site. Prefixar esta chave
 * daria a cada site uma sessao propria, que e comportamento que o legado nao
 * tem (`wp-includes/class-wp-session-tokens.php`).
 */
export const CHAVE_DE_TOKENS_DE_SESSAO = 'session_tokens';

/**
 * `{site}user_roles` — o nome da opcao em que a definicao dos papeis e gravada.
 *
 * ADR-0001: a definicao e **dado gravado**, nao codigo. O nome carrega o
 * prefixo do site porque cada site da rede tem a sua propria definicao.
 */
export function opcaoDeDefinicaoDePapeis(prefixos: Prefixos): string {
  return `${prefixos.doSite}user_roles`;
}
