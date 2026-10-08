/**
 * O que o mapeamento de capacidade sobre **conta** le de fora, declarado como
 * porta.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11), do lado da
 * plataforma. Mesma forma e mesma razao de `conteudo-na-autorizacao.ts` (T017):
 * os cinco `case` de conta do `map_meta_cap()` consultam estado que nao esta no
 * pedido, e a regra de dependencia 2 de `target_architecture.md` proibe
 * `plataforma/` importar `contextos/`. Logo a interface e **declarada aqui
 * embaixo** e **implementada em cima**, em
 * `contextos/identidade-e-acesso/administracao-de-contas/`.
 *
 * Tres perguntas, e nenhuma a mais — sao exatamente as tres chamadas que os
 * `case` de conta fazem (`wp-includes/capabilities.php:49`-`:79` e `:673`-`:689`):
 * `is_super_admin()`, `user_can()` e `get_site_option( 'add_new_users' )`.
 */

import type { Capacidade } from './capacidade.js';

/**
 * As tres leituras que os `case` de conta fazem.
 *
 * ⚠️ **Nenhuma delas e opcional, e nenhuma tem valor padrao.** Um padrao
 * silencioso aqui decidiria autorizacao de rede sem ninguem ver — e o recorte de
 * rede e justamente onde `PERM-10` (BR-MIGRAR-096) avisa que *"quem reimplementar
 * multisite precisa replicar o recorte, nao so a tabela de sites"*.
 */
export interface FonteDeContaNaAutorizacao {
  /**
   * `is_super_admin( $id )` — `capabilities.php:1177`.
   *
   * **Sao duas definicoes, e so uma vale por instalacao** (`PERM-9`,
   * BR-MIGRAR-095): em rede, o login esta na lista de super administradores;
   * fora dela, a conta tem `delete_users`. Quem implementa esta porta tem as duas
   * ja resolvidas em `decisao-de-capacidade.ts`, pela funcao `ehSuperAdmin` de
   * la — e e isso que o adaptador liga aqui, em vez de reimplementar a escolha.
   *
   * 🔴 **`contaId === 0` nao e "ninguem", e isso e quirk do legado reproduzido.**
   * A assinatura do legado e `is_super_admin( $user_id = false )`, e o primeiro
   * ramo e `if ( ! $user_id )` — falsidade de PHP. Logo `is_super_admin( 0 )`
   * responde **pelo usuario corrente da requisicao**, nao por uma conta
   * inexistente. O ramo e alcancavel: o `case` de `edit_user` avalia
   * `is_super_admin( $args[0] )` com o argumento **ausente** quando a capacidade
   * pedida e `edit_user` sem objeto. O adaptador reproduz isso respondendo pelo
   * ator do contexto, e a conferencia fecha contra o oraculo (`ESC-ORACULO`,
   * BR-MIGRAR-116).
   */
  ehSuperAdmin(contaId: number): boolean;

  /**
   * `user_can( $id, $cap )` — a pergunta de permissao sobre **outra** conta.
   *
   * O `case` de `edit_user` a faz por `manage_network_users`, e e a unica
   * chamada de permissao aninhada dos cinco `case`. Ela e a propria decisao
   * rodando com outro ator, e nao uma consulta ao armazenamento: quem a
   * implementa monta o ator daquela conta e chama a decisao de novo.
   */
  temCapacidade(contaId: number, capacidade: Capacidade): boolean;

  /**
   * `get_site_option( 'add_new_users' )` — a opcao **de rede** de `N6`.
   *
   * BR-MIGRAR-066 (`N6`, confianca 🟢): *"criar usuario na rede e permissao de
   * rede, salvo opcao explicita. `create_users` so passa para quem nao e super
   * admin se `add_new_users` estiver ligada"*. UC-24 repete no fluxo alternativo
   * de rede.
   *
   * **Devolve booleano e nao o valor gravado** porque a comparacao do legado e
   * por verdade de PHP (`elseif ( is_super_admin( $user_id ) || get_site_option(
   * 'add_new_users' ) )`), e a conversao e da borda: `'0'` gravado e **falso**
   * para o legado, e um porte que comparasse com cadeia vazia abriria a rede.
   */
  adicaoDeContaLiberadaNaRede(): boolean;
}
