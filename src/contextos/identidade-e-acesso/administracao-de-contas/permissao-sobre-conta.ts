/**
 * A pergunta de permissao da administracao de contas — **duas vezes**, e e CA-11.1.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). Dois papeis
 * neste arquivo:
 *
 * 1. **a costura** que liga a traducao dos `case` de conta (que mora em
 *    `plataforma/autorizacao/`, T023) ao dado de BC-05, na unica direcao que a
 *    regra de dependencia 2 de `target_architecture.md` permite. E a mesma
 *    costura que `../autorizacao/fonte-de-papeis.ts` fez para T015, um nivel
 *    acima: ali a fonte entrega **concessao gravada**, aqui ela entrega
 *    **decisao sobre outra conta**;
 * 2. **a forma da pergunta dupla** de UC-24, passos 3 e 4: *"Sistema verifica a
 *    capacidade da acao e o nonce da tela"*, e so depois *"Sistema verifica a
 *    capacidade sobre **aquela** conta, uma a uma"*.
 *
 * ---
 *
 * # Por que sao duas perguntas, e nao uma
 *
 * A nota de sequencia de UC-24 responde em uma linha: *"`promote_user` e
 * `delete_user` sao meta-capacidades, resolvidas por objeto"*. A primeira
 * pergunta e pela **primitiva do lote** (`promote_users`, `delete_users`,
 * `remove_users`, `edit_users`, `create_users`); a segunda e pela
 * **meta-capacidade sobre cada conta** (`promote_user`, `delete_user`,
 * `remove_user`, `edit_user`), que a traducao de `traducao-de-conta.ts` resolve e
 * que pode devolver `do_not_allow` por motivos que a primeira nao ve: ser super
 * administrador, ser a propria conta, estar em rede.
 *
 * Fundir as duas num unico laco sobre as contas **mudaria o resultado**: no
 * legado a primeira falha devolve a tela de erro sem olhar conta nenhuma, e o
 * numero de perguntas emitidas e parte do efeito — cada uma delas le metadado
 * serializado (`PERM-2`).
 *
 * ---
 *
 * # ⚠️ O nonce do passo 3 nao esta aqui, e nao e esquecimento
 *
 * UC-24 poe `check_admin_referer()` no mesmo passo da capacidade, e as quatro
 * acoes do legado o conferem (`bulk-users`, `delete-users`, `remove-users`,
 * `add-user`, `create-user`). **O nonce nao e deste pacote**: nenhuma tarefa de
 * `tasks.md` o entrega, o **P4** o lista entre os cinco atestados que decidem
 * acesso fora do modelo de capacidades, e `../sessao/saida.ts` ja registrou a
 * mesma ausencia com a mesma razao — *"acrescenta-lo aqui fecharia superficie sem
 * ninguem ter decidido (P4)"*. A conferencia e da borda que expor a acao, e o
 * **P4** cobra dela a declaracao explicita.
 */

import {
  atorDeAutorizacao,
  casoDeConta,
  comAtor,
  ehSuperAdmin,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type ContextoDeAutorizacao,
  type FonteDeAutorizacao,
  type FonteDeContaNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { criarFonteDeAutorizacao } from '../autorizacao/fonte-de-papeis.js';
import type { ContextoDaAdministracaoDeContas } from './contexto-de-administracao.js';

/**
 * A base da decisao **com** os `case` de conta encaixados.
 *
 * O encaixe e recursivo de proposito, e e assim no legado: `map_meta_cap()` do
 * `case` de `edit_user` chama `user_can()`, que chama `has_cap()`, que chama
 * `map_meta_cap()` de novo. A ligacao abaixo e tardia — a fonte fecha sobre a
 * base que esta sendo construida — exatamente para que essa reentrada caia nos
 * mesmos casos, em vez de cair num contexto sem eles.
 *
 * ⚠️ **Os casos de conta entram DEPOIS dos que a base ja trouxer.** A consulta
 * de `traduzirCapacidade` para no primeiro caso que reconhece o pedido, e a
 * ordem declarada em `decisao-de-capacidade.ts` poe as quatro constantes do dono
 * do servidor antes de tudo. Nenhuma capacidade de conta esta no alcance dessas
 * constantes, logo a posicao relativa entre o caso de conta e o de conteudo nao
 * decide nada hoje — mas ela e ordem, e ordem e contrato (BR-MIGRAR-094). Fica
 * declarada: **por ultimo**, como um `case` acrescentado no fim do `switch`.
 */
export function baseDeAutorizacaoDaAdministracao(
  contexto: ContextoDaAdministracaoDeContas,
): BaseDeAutorizacao {
  const fonteDeDados: FonteDeAutorizacao = criarFonteDeAutorizacao(
    contexto.armazenamento,
  );

  const fonteDeConta: FonteDeContaNaAutorizacao = {
    ehSuperAdmin(contaId) {
      return ehSuperAdmin(contextoDaConta(contaId));
    },
    temCapacidade(contaId, capacidade) {
      return perguntarPermissao(contextoDaConta(contaId), capacidade);
    },
    adicaoDeContaLiberadaNaRede() {
      return contexto.opcoes.adicaoDeContaLiberadaNaRede;
    },
  };

  const base: BaseDeAutorizacao = {
    ...contexto.base,
    casosDeTraducao: [
      ...(contexto.base.casosDeTraducao ?? []),
      casoDeConta(fonteDeConta),
    ],
  };

  /**
   * A mesma base com **outro** ator — e e isto que `is_super_admin( $id )` e
   * `user_can( $id, $cap )` sao no legado: a decisao rodando com outra
   * identidade.
   *
   * `contaId` zero devolve o ator **do contexto**, e nao o anonimo: e o ramo
   * `if ( ! $user_id )` de `is_super_admin()`, declarado em
   * {@link FonteDeContaNaAutorizacao.ehSuperAdmin}.
   */
  function contextoDaConta(contaId: number): ContextoDeAutorizacao {
    if (contaId === 0) {
      return comAtor(base, contexto.ator);
    }
    return comAtor(base, atorDeAutorizacao(contaId, fonteDeDados));
  }

  return base;
}

/** O contexto de autorizacao de quem administra, com os `case` de conta prontos. */
export function autorizacaoDoAtor(
  contexto: ContextoDaAdministracaoDeContas,
): ContextoDeAutorizacao {
  return comAtor(baseDeAutorizacaoDaAdministracao(contexto), contexto.ator);
}

/**
 * `current_user_can( $cap, ...$args )` dentro da administracao.
 *
 * Existe para que nenhuma das acoes monte o contexto de autorizacao a mao: montar
 * duas vezes, com e sem os `case` de conta, produziria duas respostas para a
 * mesma pergunta — que e a classe de defeito que o cenario `@composicao` de
 * `parity_tests/07-autorizacao-por-capacidade.feature` cobra (*"toda decisao e
 * identica a do oraculo"*).
 */
export function podeNaAdministracao(
  contexto: ContextoDaAdministracaoDeContas,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): boolean {
  return perguntarPermissao(autorizacaoDoAtor(contexto), capacidade, ...argumentos);
}

/**
 * A pergunta de permissao sobre **uma** conta alvo, reusando a base ja montada.
 *
 * Recebe o contexto de autorizacao em vez do contexto da administracao porque o
 * laco de CA-11.1 pergunta N vezes: montar a base dentro do laco releria a matriz
 * a cada conta, o que muda o numero de consultas emitidas — e o criterio desta
 * area e efeito no banco.
 */
export function podeSobreConta(
  autorizacao: ContextoDeAutorizacao,
  capacidade: Capacidade,
  contaId: number,
): boolean {
  return perguntarPermissao(autorizacao, capacidade, contaId);
}

/** O ator da administracao e super administrador nesta instalacao? */
export function atorEhSuperAdmin(
  contexto: ContextoDaAdministracaoDeContas,
): boolean {
  return ehSuperAdmin(autorizacaoDoAtor(contexto));
}

/**
 * Quem administra, como ator de autorizacao, montado a partir do armazenamento.
 *
 * Atalho para quem compoe a operacao na borda: o ator do contexto e **dado de
 * requisicao** e o legado o monta de `wp_get_current_user()`. Aqui ele e
 * argumento, e esta funcao e a unica forma suportada de deriva-lo do
 * armazenamento sem duplicar a leitura de `{site}capabilities`.
 */
export function atorDaAdministracao(
  contaId: number,
  armazenamento: ContextoDaAdministracaoDeContas['armazenamento'],
): AtorDeAutorizacao {
  return atorDeAutorizacao(contaId, criarFonteDeAutorizacao(armazenamento));
}
