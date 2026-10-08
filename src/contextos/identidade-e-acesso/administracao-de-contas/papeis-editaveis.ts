/**
 * Quais papeis o ator pode **dar**, e a pergunta que decide se um papel conserva
 * o poder de promover.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). Duas coisas
 * vivem aqui, e as duas sao leitura da matriz gravada — nenhuma e decisao de
 * capacidade:
 *
 * 1. `get_editable_roles()` (`wp-admin/includes/user.php:274`), que e a matriz
 *    inteira passada pelo ponto de extensao `editable_roles`;
 * 2. `WP_Role::has_cap()` (`wp-includes/class-wp-role.php`), que e como
 *    `wp-admin/users.php:152` pergunta se o papel novo do proprio ator conserva
 *    `promote_users`.
 *
 * ## ⚠️ O ponto de extensao daqui e o unico controle de delegacao do produto
 *
 * O comentario do legado em `get_editable_roles()` nao e documentacao, e a regra:
 * *"sem filtrar, qualquer um com a capacidade `edit_users` pode editar outros
 * para serem administradores, mesmo sendo apenas editores ou autores. Este filtro
 * permite ao administrador delegar a gestao de usuarios."* Ou seja: **de fabrica,
 * quem edita conta pode promover a qualquer papel**, inclusive ao de maior poder.
 * Reduzir isso no porte fecharia o sistema mais que o legado — que e o erro que
 * esta feature existe para nao cometer — e cairia na tabela *Nao negociavel* da
 * constituicao, que poe mudar regra de negocio documentada fora do alcance de
 * quem codifica.
 *
 * O **P2** poe o nome, os argumentos e a posicao do ponto no contrato publico, e
 * o barramento que o dispararia nao existe nesta arvore (`REQ-162` esta em
 * `do-not-rewrite.md`). Dai a forma: gancho opcional, e ausencia de gancho
 * reproduz o legado sem interceptador.
 */

import {
  capacidadesDoPapel,
  type Capacidade,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';

/**
 * O identificador que a tela de lote **inventa** para "nenhum papel neste site"
 * (`wp-admin/users.php:126`).
 *
 * O comentario do legado o chama pelo nome — *"Mock `none` as editable role"* —,
 * e ele nao existe na matriz: e acrescentado a lista de editaveis **depois** do
 * ponto de extensao e traduzido para cadeia vazia logo em seguida
 * (`users.php:134`). Duas consequencias observaveis saem disso:
 *
 * - um interceptador de `editable_roles` **nao consegue** remover `none`, porque
 *   ele entra depois; e
 * - uma instalacao que tenha um papel de verdade chamado `none` tem o nome
 *   dele sequestrado por esta acao.
 *
 * As duas sao do legado e estao reproduzidas.
 */
export const PAPEL_DE_NENHUM_PAPEL = 'none';

/** O nome exibido que o legado da ao papel inventado (`users.php:127`). */
export const NOME_EXIBIDO_DE_NENHUM_PAPEL = '&mdash; No role for this site &mdash;';

/** O ponto de extensao da lista de papeis editaveis. */
export interface GanchosDosPapeisEditaveis {
  /**
   * `editable_roles`: **filtro** sobre a matriz inteira, e **pode alterar o
   * resultado** — e o unico mecanismo de delegacao do produto (ver o cabecalho).
   *
   * Recebe os identificadores na ordem gravada e devolve os que ficam. No legado
   * o filtro recebe o mapa de papel para informacao de papel; aqui recebe os
   * identificadores, porque e so deles que as duas chamadas do legado se
   * servem — `empty( $editable_roles[ $role ] )` e `wp_dropdown_roles()`, que e
   * da borda.
   */
  readonly filtrarPapeisEditaveis?: (
    identificadores: readonly string[],
  ) => readonly string[];
  /**
   * `role_has_cap`: **filtro** sobre as capacidades **daquele** papel, antes de a
   * pergunta ser respondida.
   *
   * Dispara em `WP_Role::has_cap()`, logo vale tambem para a trava de CA-11.4:
   * um interceptador registrado aqui decide se o papel novo do proprio ator
   * conserva `promote_users`. Recebe as concessoes gravadas, a capacidade pedida
   * e o identificador do papel, na ordem do legado.
   */
  readonly filtrarCapacidadesDoPapel?: (
    capacidades: readonly { readonly capacidade: Capacidade; readonly concedida: boolean }[],
    capacidadePedida: Capacidade,
    papel: string,
  ) => readonly { readonly capacidade: Capacidade; readonly concedida: boolean }[];
}

/**
 * `get_editable_roles()` — a matriz gravada, na ordem, passada pelo filtro.
 *
 * Sem interceptador devolve **todos** os papeis: e o valor de fabrica, e e o que
 * o comentario do legado descreve como o estado em que qualquer um que edite
 * conta promove a administrador.
 */
export function papeisEditaveis(
  matriz: MatrizDePapeis,
  ganchos?: GanchosDosPapeisEditaveis,
): readonly string[] {
  const todos = matriz.map((papel) => papel.identificador);
  const filtrar = ganchos?.filtrarPapeisEditaveis;
  return filtrar === undefined ? todos : filtrar(todos);
}

/**
 * `WP_Role::has_cap( $cap )` — aquele papel concede aquela capacidade?
 *
 * **Olha so as capacidades daquele papel**, sem fundir papel nenhum e sem as
 * individuais da conta: e por isso que nao e a mesma pergunta que
 * `perguntarPermissao`. A comparacao do legado e `! empty( $capabilities[ $cap ] )`,
 * logo capacidade ausente e capacidade com valor falso respondem igual —
 * **nao concede** —, e e assim que esta escrito.
 *
 * ⚠️ **Papel que a matriz nao conhece responde `false`.** No legado a expressao e
 * `$wp_roles->role_objects[ $role ]->has_cap( ... )` sobre um indice que pode nao
 * existir, o que em PHP 8 e erro fatal. Um erro fatal nao e comportamento que se
 * clone: o resultado observavel mais proximo e *nao concede*, que e o que leva a
 * acao ao aviso `err_admin_role` em vez de a uma tela branca. Fecha contra o
 * oraculo (`ESC-ORACULO`, BR-MIGRAR-116). Na pratica o ramo e inalcancavel pela
 * tela, porque o papel pedido ja foi conferido contra
 * {@link papeisEditaveis} — que sai da propria matriz.
 */
export function papelConcede(
  matriz: MatrizDePapeis,
  papel: string,
  capacidade: Capacidade,
  ganchos?: GanchosDosPapeisEditaveis,
): boolean {
  const gravadas = capacidadesDoPapel(matriz, papel);
  const filtrar = ganchos?.filtrarCapacidadesDoPapel;
  const capacidades =
    filtrar === undefined ? gravadas : filtrar(gravadas, capacidade, papel);
  return capacidades.some(
    (concessao) => concessao.capacidade === capacidade && concessao.concedida,
  );
}

/**
 * A falsidade de PHP aplicada a um nome de papel — o `if ( ! $role )` de
 * `wp-admin/users.php:130`.
 *
 * Nao e zelo: `'0'` e **falso** em PHP, logo uma instalacao com um papel chamado
 * `0` nao consegue atribui-lo por esta acao, e a recusa e a de *"papel nao
 * permitido"*. Comparar so com cadeia vazia deixaria passar um caso que o legado
 * recusa.
 */
export function papelEhFalsoNoLegado(papel: string): boolean {
  return papel === '' || papel === '0';
}
