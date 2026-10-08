/**
 * Os casos de traducao de capacidade sobre **conta** — os cinco `case` de
 * `map_meta_cap()` que UC-24 cita pela ancora.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11), do lado da
 * plataforma. O encaixe e {@link CasoDeTraducao}, o mesmo que T015 deixou pronto
 * e que T017 usou para conteudo; a **ordem** em que este caso e consultado esta
 * declarada em `decisao-de-capacidade.ts` — depois das quatro constantes do dono
 * do servidor, que nenhum caso de objeto reabre.
 *
 * UC-24 aponta as cinco linhas: `wp-includes/capabilities.php:49`
 * (`remove_user`), `:57` (`promote_user` e `add_users`), `:70`/`:74`
 * (`edit_user` e `edit_users`), `:673` (`delete_user` e `delete_users`) e `:682`
 * (`create_users`). O que cada um devolve e o que esta abaixo, `case` por `case`.
 *
 * ---
 *
 * # As cinco linhas, e o que um porte perde em cada uma
 *
 * | capacidade pedida | devolve | o detalhe que se perde |
 * |---|---|---|
 * | `remove_user` | `remove_users` | **nega a si mesmo** a quem nao e super administrador, e **sem guarda de rede** |
 * | `promote_user`, `add_users` | `promote_users` | nada: e o `case` mais simples dos cinco |
 * | `edit_user` sobre si mesmo | **lista vazia** | lista vazia e **permitido**, e quem a trata como negacao tranca todo mundo fora do proprio perfil |
 * | `edit_user`, `edit_users` | `edit_users` | em rede, `manage_network_users` passa a ser exigida de **todos** |
 * | `delete_user`, `delete_users` | `delete_users` | em rede, so super administrador — e e o `case` que faz de `delete_users` a definicao de "super admin" fora dela |
 * | `create_users` | a propria | `N6`: em rede, a opcao `add_new_users` e quem libera |
 *
 * Tres coisas que estao aqui porque sao o legado, e que a intuicao desfaz:
 *
 * 1. **Lista vazia e PERMITIDO, e este arquivo e onde ela nasce.**
 *    BR-MIGRAR-092 (pegadinha 2 de `permissions.md`): *"`edit_user` sobre si
 *    mesmo sai do `switch` sem acrescentar nada, e a comparacao sobre lista vazia
 *    e verdadeira. Um alvo que trate lista vazia como negacao tranca todo mundo
 *    fora do proprio perfil."* UC-24 diz a consequencia no fluxo alternativo
 *    *"Editar o proprio perfil"*: *"qualquer conta edita o proprio perfil,
 *    inclusive um assinante"*.
 * 2. **`remove_user` nao tem guarda de rede, apesar do comentario.** O comentario
 *    do legado diz *"In multisite the user must be a super admin to remove
 *    themselves"* e a tabela de excecoes de UC-24 repete *"em multisite"* — mas a
 *    condicao escrita (`capabilities.php:49`-`:54`) **nao** consulta
 *    `is_multisite()`. Logo, fora da rede, remover a si mesmo tambem exige ser
 *    super administrador, que fora da rede e *quem tem `delete_users`*. Ver a nota
 *    🔴 do fim deste cabecalho.
 * 3. **A ordem de avaliacao do ramo de rede de `edit_user` e observavel.** A
 *    condicao e `( ( ! is_super_admin( $user_id ) && 'edit_user' === $cap &&
 *    is_super_admin( $args[0] ) ) || ! user_can( $user_id,
 *    'manage_network_users' ) )`: `user_can` so e chamada quando o primeiro grupo
 *    e falso, e `is_super_admin( $args[0] )` so quando os dois primeiros termos
 *    sao verdadeiros. Cada uma dessas chamadas e uma decisao de permissao
 *    aninhada, logo a ordem decide **quantas** perguntas saem — e `PERM-2` lembra
 *    que cada uma delas le metadado serializado. A expressao esta escrita abaixo
 *    com o mesmo curto-circuito, de proposito.
 *
 * ---
 *
 * # O que NAO esta aqui, e nao e omissao
 *
 * - **`manage_network_users` e as outras oito capacidades so de rede.**
 *   BR-MIGRAR-096 (`PERM-10`, confianca 🟡) registra que elas *"nao sao
 *   concedidas a papel algum"*, e `revogacao-por-constante.ts` ja declara o
 *   recorte de rede como nao portado. Este arquivo as **exige** onde o legado as
 *   exige; quem as concede e a rede, que nao e desta feature.
 * - **Os `case` de senha de aplicacao** (`create_app_password`,
 *   `list_app_passwords`, `edit_app_password`, …), que no legado resolvem para
 *   `edit_user` sobre a mesma conta. Sao US-10 / **T021**, e o encaixe e o mesmo
 *   {@link CasoDeTraducao}. `U6` (BR-MIGRAR-026) ja fixa a regra que eles
 *   reusam — *"sua administracao reusa a permissao de editar aquele usuario"* —, e
 *   este arquivo e o que torna esse reuso possivel sem copia.
 * - **`is_user_member_of_blog()`**, que decide se a conta pertence ao site. Ela
 *   **nao** e consultada por nenhum dos cinco `case`: quem a consulta e a tela
 *   (`wp-admin/users.php:161`), e ela chega pelo contexto da administracao, em
 *   `contextos/identidade-e-acesso/administracao-de-contas/`.
 *
 * ---
 *
 * # 🔴 Uma divergencia entre o texto de UC-24 e o codigo que ele aponta
 *
 * A tabela de excecoes de UC-24 escreve *"Remover a si mesmo do site, **em
 * multisite**, sem ser super administrador → `do_not_allow`"*, e o comentario do
 * proprio legado diz o mesmo. **A condicao na linha apontada nao tem o
 * `is_multisite()`**, e o **P1** manda reproduzir o comportamento observavel do
 * sistema analisado *"inclusive quando ele parecer defeito"*, com divergencia
 * exigindo decisao humana registrada. Nenhuma existe.
 *
 * Logo este arquivo reproduz **o codigo**, nao o comentario, e a consequencia
 * observavel esta declarada: numa instalacao de site unico, `remove_user` sobre a
 * propria conta e negado a quem nao tem `delete_users`. Como `remove_users` nao
 * esta em papel algum fora da rede, o caso e inalcancavel na pratica — e e
 * exatamente por isso que a divergencia nunca aparece numa tela. Fecha contra o
 * oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
 */

import { CAPACIDADE_NEGADA, type Capacidade } from './capacidade.js';
import type { FonteDeContaNaAutorizacao } from './conta-na-autorizacao.js';
import type { CasoDeTraducao, PedidoDeTraducao } from './traducao-de-capacidade.js';

/** `remove_user` — a meta-capacidade de desvincular a conta **deste** site. */
export const CAPACIDADE_DE_REMOCAO_DE_CONTA: Capacidade = 'remove_user';

/** `remove_users` — a primitiva que `remove_user` exige. */
export const CAPACIDADE_DE_REMOCAO_DE_CONTAS: Capacidade = 'remove_users';

/**
 * Os dois nomes pedidos que caem no `case` de promover.
 *
 * `add_users` compartilha o `case` com `promote_user` e nao e engano de leitura:
 * no legado, acrescentar uma conta existente a um site **e** promover.
 */
export const CAPACIDADES_DE_PROMOCAO_DE_CONTA: readonly Capacidade[] = [
  'promote_user',
  'add_users',
];

/** `promote_users` — a primitiva que promover exige. */
export const CAPACIDADE_DE_PROMOCAO_DE_CONTAS: Capacidade = 'promote_users';

/** `edit_user` — a forma **sobre objeto**, a unica que reconhece "si mesmo". */
export const CAPACIDADE_DE_EDICAO_DE_CONTA: Capacidade = 'edit_user';

/** Os dois nomes pedidos que caem no `case` de editar conta. */
export const CAPACIDADES_DE_EDICAO_DE_CONTA: readonly Capacidade[] = [
  CAPACIDADE_DE_EDICAO_DE_CONTA,
  'edit_users',
];

/** `edit_users` — a primitiva que editar conta exige. */
export const CAPACIDADE_DE_EDICAO_DE_CONTAS: Capacidade = 'edit_users';

/** Os dois nomes pedidos que caem no `case` de apagar conta. */
export const CAPACIDADES_DE_EXCLUSAO_DE_CONTA: readonly Capacidade[] = [
  'delete_user',
  'delete_users',
];

/**
 * `delete_users` — a primitiva que apagar conta exige.
 *
 * ⚠️ E a **mesma** capacidade que, fora de uma instalacao de rede, define "super
 * administrador" (`PERM-9`, e a pre-condicao de UC-24: *"fora de multisite,
 * `delete_users` e tambem o que define super admin"*). O nome aparece duas vezes
 * no sistema com dois papeis, e `decisao-de-capacidade.ts` declara o segundo.
 */
export const CAPACIDADE_DE_EXCLUSAO_DE_CONTAS: Capacidade = 'delete_users';

/** `create_users` — a unica dos cinco que e primitiva e meta ao mesmo tempo. */
export const CAPACIDADE_DE_CRIACAO_DE_CONTAS: Capacidade = 'create_users';

/**
 * `manage_network_users` — a capacidade de rede que o `case` de editar exige de
 * **todos** numa instalacao de rede.
 *
 * Uma das nove que BR-MIGRAR-096 declara **nao concedidas a papel algum**: em
 * rede, portanto, ninguem edita conta alheia pelo painel do site sem que a rede
 * conceda. E o que `PERM-10` resume por *"o administrador de um site e um editor
 * com configuracao: perde arquivo, extensao, **identidade**, idioma e HTML bruto"*.
 */
export const CAPACIDADE_DE_ADMINISTRACAO_DE_CONTAS_DA_REDE: Capacidade =
  'manage_network_users';

/**
 * `$args[0]` como identificador inteiro, ou `null` quando o argumento nao veio.
 *
 * A distincao entre **ausente** e **zero** importa: o legado testa `isset(
 * $args[0] )` antes de comparar, e `is_super_admin( 0 )` tem um significado
 * proprio (ver {@link FonteDeContaNaAutorizacao.ehSuperAdmin}). Valor que nao
 * converte para numero vira `0`, como o `(int)` de PHP.
 */
function alvoInformado(argumentos: readonly unknown[]): number | null {
  if (argumentos.length === 0 || argumentos[0] === undefined) {
    return null;
  }
  const alvo = Number(argumentos[0]);
  return Number.isFinite(alvo) ? Math.trunc(alvo) : 0;
}

/**
 * `case 'remove_user'` — `capabilities.php:49`.
 *
 * Sem guarda de rede, de proposito: ver a nota 🔴 do cabecalho.
 */
function remocaoDeConta(
  pedido: PedidoDeTraducao,
  fonte: FonteDeContaNaAutorizacao,
): readonly Capacidade[] {
  const alvo = alvoInformado(pedido.argumentos);
  if (
    alvo !== null &&
    pedido.contaId === alvo &&
    !fonte.ehSuperAdmin(pedido.contaId)
  ) {
    return [CAPACIDADE_NEGADA];
  }
  return [CAPACIDADE_DE_REMOCAO_DE_CONTAS];
}

/**
 * `case 'edit_user'` e `case 'edit_users'` — `capabilities.php:70`-`:79`.
 *
 * Os quatro ramos, na ordem do legado, e **nenhum deles comuta**:
 *
 * 1. conta inexistente (`$user_id < 1`) nega — e o comentario do legado e a
 *    propria regra: *"Non-existent users can't edit users, not even
 *    themselves"*. Vem **antes** do ramo de si mesmo, logo o ator anonimo, que
 *    tem identificador `0`, nao edita o "proprio" perfil;
 * 2. `edit_user` sobre si mesmo devolve **lista vazia**, que e permitido;
 * 3. em rede, ou editar um super administrador sem ser um, ou nao ter
 *    `manage_network_users`, nega;
 * 4. no resto, `edit_users`.
 */
function edicaoDeConta(
  pedido: PedidoDeTraducao,
  fonte: FonteDeContaNaAutorizacao,
): readonly Capacidade[] {
  if (pedido.contaId < 1) {
    return [CAPACIDADE_NEGADA];
  }

  const alvo = alvoInformado(pedido.argumentos);
  const sobreObjeto = pedido.capacidade === CAPACIDADE_DE_EDICAO_DE_CONTA;

  // Lista vazia significa PERMITIDO. Ver o item 1 do cabecalho.
  if (sobreObjeto && alvo !== null && pedido.contaId === alvo) {
    return [];
  }

  if (
    pedido.emRede &&
    // O curto-circuito e o do legado, e ele decide quantas decisoes aninhadas
    // saem. Ver o item 3 do cabecalho.
    ((!fonte.ehSuperAdmin(pedido.contaId) &&
      sobreObjeto &&
      fonte.ehSuperAdmin(alvo ?? 0)) ||
      !fonte.temCapacidade(
        pedido.contaId,
        CAPACIDADE_DE_ADMINISTRACAO_DE_CONTAS_DA_REDE,
      ))
  ) {
    return [CAPACIDADE_NEGADA];
  }

  return [CAPACIDADE_DE_EDICAO_DE_CONTAS];
}

/**
 * `case 'delete_user'` e `case 'delete_users'` — `capabilities.php:673`.
 *
 * Em rede, **so super administrador apaga identidade**, e o comentario do legado
 * diz por que: a identidade e global. UC-24 repete na tabela de excecoes —
 * *"apagar identidade e poder de rede, porque a identidade e global"*. Note que o
 * ramo **nao** olha o alvo: nao e "nao pode apagar aquele", e "nao pode apagar".
 */
function exclusaoDeConta(
  pedido: PedidoDeTraducao,
  fonte: FonteDeContaNaAutorizacao,
): readonly Capacidade[] {
  if (pedido.emRede && !fonte.ehSuperAdmin(pedido.contaId)) {
    return [CAPACIDADE_NEGADA];
  }
  return [CAPACIDADE_DE_EXCLUSAO_DE_CONTAS];
}

/**
 * `case 'create_users'` — `capabilities.php:682`, a ancora de `N6`
 * (BR-MIGRAR-066).
 *
 * Fora da rede a capacidade atravessa a traducao sem mudanca, como qualquer
 * primitiva; em rede ela passa a depender de **duas** coisas, nesta ordem: ser
 * super administrador, ou a rede ter ligado `add_new_users`.
 */
function criacaoDeContas(
  pedido: PedidoDeTraducao,
  fonte: FonteDeContaNaAutorizacao,
): readonly Capacidade[] {
  if (!pedido.emRede) {
    return [pedido.capacidade];
  }
  if (
    fonte.ehSuperAdmin(pedido.contaId) ||
    fonte.adicaoDeContaLiberadaNaRede()
  ) {
    return [pedido.capacidade];
  }
  return [CAPACIDADE_NEGADA];
}

/**
 * O caso de traducao de capacidade sobre conta, ligado a uma fonte.
 *
 * Devolve `null` para toda capacidade que nao e de conta — e nesse caso a
 * consulta segue para os casos seguintes, exatamente como o `switch` do legado
 * segue para o `case` seguinte.
 */
export function casoDeConta(fonte: FonteDeContaNaAutorizacao): CasoDeTraducao {
  return (pedido) => {
    if (pedido.capacidade === CAPACIDADE_DE_REMOCAO_DE_CONTA) {
      return remocaoDeConta(pedido, fonte);
    }
    if (CAPACIDADES_DE_PROMOCAO_DE_CONTA.includes(pedido.capacidade)) {
      return [CAPACIDADE_DE_PROMOCAO_DE_CONTAS];
    }
    if (CAPACIDADES_DE_EDICAO_DE_CONTA.includes(pedido.capacidade)) {
      return edicaoDeConta(pedido, fonte);
    }
    if (CAPACIDADES_DE_EXCLUSAO_DE_CONTA.includes(pedido.capacidade)) {
      return exclusaoDeConta(pedido, fonte);
    }
    if (pedido.capacidade === CAPACIDADE_DE_CRIACAO_DE_CONTAS) {
      return criacaoDeContas(pedido, fonte);
    }
    return null;
  };
}
