/**
 * Quem pode o que no modo de recuperacao: a declaracao explicita de cada
 * operacao (**P4**) e os dois `case` de `map_meta_cap()` de retomar extensao.
 *
 * Entrega de **T025** da feature `010-operacao-do-software` — **CA-12.7**
 * (*"existe conta capaz de retomar extensao pausada numa instalacao de
 * fabrica"*).
 *
 * ## Nenhuma das tres operacoes de US-12 pergunta capacidade
 *
 * E o que a constituicao chama de atestado fora das camadas (P4), e UC-36 o
 * poe na linha *Autorizacao*. Declarar as tres como `null` **e** a declaracao
 * explicita: nao e esquecimento, e o legado.
 *
 * | operacao | o que prova o acesso | legado |
 * |---|---|---|
 * | tratar o erro fatal | nada: roda no desligamento da requisicao | `class-wp-fatal-error-handler.php:31` |
 * | abrir o caminho | a chave de recuperacao do aviso (T027 verifica) | `class-wp-recovery-mode-link-service.php:86` |
 * | sair | o token `exit_recovery_mode` | `class-wp-recovery-mode.php:242` |
 *
 * ## Retomar e capacidade, e de fabrica ela so existe por concessao
 *
 * `resume_plugin` e `resume_theme` sao meta-capacidades que viram
 * `resume_plugins` e `resume_themes` (`wp-includes/capabilities.php:667`-`:672`),
 * e essas duas **nao estao em papel nenhum**: o nucleo as concede no ponto
 * `user_has_cap`, com prioridade `1`, a quem tem `activate_plugins` e
 * `switch_themes` (`wp_maybe_grant_resume_extensions_caps()`,
 * `capabilities.php:1325`, registrado em `default-filters.php:772`). A
 * concessao ja esta na plataforma
 * (`plataforma/autorizacao/concessao-por-extensao.ts`, T019 da feature `001`)
 * e entra em toda decisao de fabrica; o que esta aqui sao os dois `case`, para
 * que a pergunta pela meta-capacidade chegue a ela.
 *
 * Note que **sair da recuperacao retoma todas sem perguntar** (`A12`): a
 * capacidade so e exigida para retomar **uma** pela tela de plugins ou de temas,
 * que e de BC-10.
 */

import {
  perguntarPermissao,
  type Capacidade,
  type CasoDeTraducao,
  type ContextoDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { ACAO_DE_SAIR_DA_RECUPERACAO } from '../configuracao/index.js';

/** `'resume_plugin'` — a meta-capacidade de retomar um plugin (`capabilities.php:667`). */
export const CAPACIDADE_DE_RETOMAR_PLUGIN = 'resume_plugin';
/** `'resume_plugins'` — a primitiva que nenhum papel concede (`:668`). */
export const CAPACIDADE_DE_RETOMAR_PLUGINS = 'resume_plugins';
/** `'resume_theme'` (`:670`). */
export const CAPACIDADE_DE_RETOMAR_TEMA = 'resume_theme';
/** `'resume_themes'` (`:671`). */
export const CAPACIDADE_DE_RETOMAR_TEMAS = 'resume_themes';

/** As operacoes de US-12, com o nome que este modulo lhes da. */
export type OperacaoDaRecuperacao =
  | 'tratar-erro-fatal'
  | 'abrir-caminho-de-recuperacao'
  | 'sair-da-recuperacao';

/** A declaracao de permissao de uma operacao: capacidade (nenhuma) e atestado. */
export interface PermissaoDaRecuperacao {
  readonly capacidade: null;
  readonly atestado: 'nenhum' | 'chave-de-recuperacao' | 'token';
  /** A acao do token, quando o atestado e token. */
  readonly acaoDoToken: string | null;
}

/** A declaracao explicita do P4, uma por operacao. Ver o cabecalho. */
export const PERMISSOES_DA_RECUPERACAO: Readonly<
  Record<OperacaoDaRecuperacao, PermissaoDaRecuperacao>
> = {
  'tratar-erro-fatal': { capacidade: null, atestado: 'nenhum', acaoDoToken: null },
  'abrir-caminho-de-recuperacao': {
    capacidade: null,
    atestado: 'chave-de-recuperacao',
    acaoDoToken: null,
  },
  'sair-da-recuperacao': {
    capacidade: null,
    atestado: 'token',
    acaoDoToken: ACAO_DE_SAIR_DA_RECUPERACAO,
  },
};

/** Os dois `case` de `map_meta_cap()` (`capabilities.php:667`-`:672`). */
export const casoDaRecuperacao: CasoDeTraducao = (pedido) => {
  if (pedido.capacidade === CAPACIDADE_DE_RETOMAR_PLUGIN) {
    return [CAPACIDADE_DE_RETOMAR_PLUGINS];
  }
  if (pedido.capacidade === CAPACIDADE_DE_RETOMAR_TEMA) {
    return [CAPACIDADE_DE_RETOMAR_TEMAS];
  }
  return null;
};

/** `current_user_can( $capacidade, ...$argumentos )` com os dois `case` acima. */
export function perguntarNaRecuperacao(
  autorizacao: ContextoDeAutorizacao,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): boolean {
  return perguntarPermissao(
    {
      ...autorizacao,
      casosDeTraducao: [casoDaRecuperacao, ...(autorizacao.casosDeTraducao ?? [])],
    },
    capacidade,
    ...argumentos,
  );
}
