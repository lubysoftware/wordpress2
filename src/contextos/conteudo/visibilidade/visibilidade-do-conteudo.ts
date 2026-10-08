/**
 * **CA-4.1**: escolher visibilidade privada grava um estado **distinto** de
 * publicado.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). O caso de
 * uso e [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md),
 * fluxo alternativo *"Publicar como privado"*, cujos tres passos sao exatamente
 * os tres criterios desta historia:
 *
 * > 1. Autor escolhe visibilidade privada
 * > 2. Sistema grava `private` em lugar de `publish`
 * > 3. O conteudo passa a exigir `read_private_posts` de quem o le
 *
 * ---
 *
 * # `private` nao e "publicado com um atributo": e um dos 12 estados
 *
 * O legado registra `private` por `register_post_status()`, com
 * `'private' => true` e **sem** `'public'`, em `wp-includes/post.php:718`-`:730`
 * — ao lado de `publish`, que tem `'public' => true` (`:661`). Sao dois valores
 * da mesma coluna `varchar(20)`, e nenhum dos dois e um sinalizador do outro.
 * O vocabulario, com as nove propriedades efetivas de cada estado, esta em
 * `../estado-editorial.ts` (entrega de T001); este arquivo tem a **regra** que
 * escolhe um deles.
 *
 * A consequencia que CA-4.1 cobra e observavel em uma coluna: depois de escolher
 * visibilidade privada, `posts.post_status` contem os bytes `private`, e nao
 * `publish`. E a consequencia de ser **estado** e nao atributo e o resto de
 * US-4: a propriedade `privado` do registro e o que faz a leitura exigir
 * `read_private_posts` (`leitura-de-conteudo-privado.ts`) e a ausencia da
 * propriedade `publico` e o que o tira da consulta publica
 * (`presenca-em-consulta-publica.ts`). Um porte que gravasse `publish` com uma
 * marca ao lado quebraria os tres criterios de uma vez, e **em silencio**.
 *
 * ---
 *
 * # Onde esta regra vive no legado: duas copias do mesmo `switch`
 *
 * A escolha de visibilidade **nao** e uma coluna: e um parametro de formulario
 * que e traduzido em colunas **antes** da gravacao. O legado tem o mesmo
 * `switch` escrito duas vezes, uma por superficie de escrita do painel:
 *
 * | superficie | onde | funcao |
 * |---|---|---|
 * | editar conteudo existente | `wp-admin/includes/post.php:318`-`:331` | `edit_post()` |
 * | criar conteudo novo | `wp-admin/includes/post.php:950`-`:964` | `wp_write_post()` |
 *
 * As duas copias sao identicas, linha a linha, e as duas rodam **antes** de
 * `_wp_translate_postdata()` e de `wp_insert_post()`. Por isso
 * {@link resolverVisibilidade} devolve campos e **nao** grava: no legado ela
 * tambem nao grava — ela prepara o arranjo que a gravacao vai escrever. Ver a
 * secao *O que T009 nao faz* no README deste modulo.
 *
 * ---
 *
 * # Os tres ramos, e os dois efeitos colaterais que ninguem adivinha
 *
 * ```php
 * switch ( $post_data['visibility'] ) {
 *     case 'public':
 *         $post_data['post_password'] = '';
 *         break;
 *     case 'password':
 *         unset( $post_data['sticky'] );
 *         break;
 *     case 'private':
 *         $post_data['post_status']   = 'private';
 *         $post_data['post_password'] = '';
 *         unset( $post_data['sticky'] );
 *         break;
 * }
 * ```
 *
 * 1. **Privado APAGA a senha de conteudo.** Os dois mecanismos sao exclusivos
 *    por construcao: privado e autorizacao por capacidade, senha de conteudo e
 *    um dos cinco atestados que decidem acesso **sem** consultar capacidade
 *    (BR-MIGRAR-098, `PERM-12`). Um porte que preservasse a senha deixaria no
 *    banco um valor que nenhuma leitura consulta — e, pior, que reapareceria se
 *    o conteudo voltasse a publico.
 * 2. **Privado e senha REMOVEM a fixacao no topo.** `unset( $post_data['sticky'] )`
 *    nao grava `false`: ele **retira o campo do arranjo**, e quem le o arranjo
 *    depois e `if ( ! empty( $post_data['sticky'] ) ) stick_post() else unstick_post()`
 *    (`wp-admin/includes/post.php:484`-`:488`). Campo ausente e vazio, logo o
 *    efeito e `unstick_post()` — e esse efeito so acontece para quem tem
 *    `edit_others_posts` **e** `publish_posts` (`:483`). A fixacao vive na opcao
 *    `sticky_posts`, que e de BC-07, e **nao** e desta feature: aqui o campo
 *    {@link CamposDaVisibilidade.mantemAFixacaoNoTopo} declara a decisao para
 *    quem a aplicar.
 * 3. **O ramo `public` nao grava estado nenhum.** Voltar de privado para publico
 *    pela tela de visibilidade **nao** poe `publish` na coluna: o estado vem dos
 *    botoes (`publish`, `saveasdraft`, `pending`) ou, na ausencia deles, do
 *    estado anterior (`wp-admin/includes/post.php:162`-`:164`). Por isso
 *    `estado` e `null` nos ramos `public` e `password`, e **nao** `publish`.
 * 4. **Valor fora dos tres nao faz nada.** O `switch` nao tem `default`, e
 *    `$post_data['visibility']` vem de formulario. {@link resolverVisibilidade}
 *    reproduz a ausencia de `default` em lugar de recusar: recusar seria mais
 *    correto e seria outro produto (**P1**).
 *
 * ---
 *
 * # 🔴 Duas regras de `private` que esta tarefa declara e NAO aplica
 *
 * As duas pertencem a `_wp_translate_postdata()`
 * (`wp-admin/includes/post.php:21`, com a resolucao de estado em `:107`-`:164`), que e o tradutor de pedido do
 * **painel** — a mesma funcao cujo rebaixamento T003 registrou e nao
 * reproduziu, pelo mesmo motivo: ela e superficie de escrita do painel, e o
 * caminho de gravacao desta feature e T005 / T015.
 *
 * 1. **O botao "Salvar como privado" grava `private` direto**
 *    (`:124`-`:126`): `saveasprivate` nao passa pelo `switch` de visibilidade.
 * 2. **O botao "Publicar" NAO sobrepoe `private`** (`:127`-`:131`): a condicao e
 *    `( ! isset( $post_data['post_status'] ) || 'private' !== $post_data['post_status'] )`,
 *    logo publicar um conteudo cuja visibilidade e privada o mantem privado. E a
 *    regra que torna *"publicar como privado"* um ato unico na tela, e e o que o
 *    titulo de US-4 descreve.
 *
 * O rebaixamento de quem nao pode publicar esta em
 * `permissao-de-conteudo-privado.ts`, com a mesma declaracao.
 */

import type { EstadoEditorial } from '../estado-editorial.js';

/**
 * `private` — o estado que a visibilidade privada grava.
 *
 * Declarado aqui, e nao em `../estado-editorial.ts`, pela mesma razao que
 * `ESTADO_PUBLICADO` esta em `../publicacao/transicao-de-estado.ts`: la ha
 * **vocabulario** e aqui ha **regra**. E este valor que o `switch` do legado
 * atribui (`wp-admin/includes/post.php:327`) e e ele que vai para a coluna.
 *
 * **O mesmo nome e o mesmo valor** de `ESTADO_PRIVADO` em
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts`, e as duas declaracoes
 * existem porque a regra de dependencia 2 proibe `plataforma/` importar
 * `contextos/` e a 3 proibe o inverso para contextos irmaos. Divergir os dois
 * valores quebraria CA-4.2 sem quebrar teste nenhum de nenhum dos dois lados —
 * por isso ha, na suite de T009, uma afirmacao que compara os dois.
 */
export const ESTADO_PRIVADO: EstadoEditorial = 'private';

/**
 * As tres visibilidades que a tela oferece, **na ordem dos `case` do legado**
 * (`wp-admin/includes/post.php:319`-`:331`).
 *
 * Nao e enumeracao da coluna: nao existe coluna `visibility`. E o vocabulario de
 * um parametro de formulario, e e por isso que {@link resolverVisibilidade}
 * aceita `string` e nao este tipo — ver o item 4 do cabecalho.
 */
export type Visibilidade = 'public' | 'password' | 'private';

/** As tres, na ordem do `switch`. */
export const VISIBILIDADES: readonly Visibilidade[] = Object.freeze([
  'public',
  'password',
  'private',
] as const);

/**
 * O que o `switch` do legado decide: duas colunas e um efeito fora da linha.
 *
 * `null` significa *"o legado nao toca este campo neste ramo"*, e nao *"grava
 * vazio"*. A distincao e observavel: no legado o campo simplesmente nao e
 * atribuido no arranjo, logo quem grava usa o valor que ja estava la.
 */
export interface CamposDaVisibilidade {
  /**
   * `$post_data['post_status']` — preenchido **so** no ramo `private`.
   *
   * Nos outros dois e `null`: ver o item 3 do cabecalho.
   */
  readonly estado: EstadoEditorial | null;
  /**
   * `$post_data['post_password']` — a cadeia vazia dos ramos `public` e
   * `private`, e `null` no ramo `password`.
   *
   * Cadeia vazia e ausencia de senha em `posts.post_password` (`DB-SENT`), e a
   * senha e texto claro por desenho (BR-MIGRAR-044, `D6`). Ver o item 1 do
   * cabecalho.
   */
  readonly senha: string | null;
  /**
   * Se a fixacao no topo **sobrevive** a escolha.
   *
   * `false` reproduz o `unset( $post_data['sticky'] )` dos ramos `password` e
   * `private`, cujo efeito a jusante e `unstick_post()`. A aplicacao e de BC-07
   * (a opcao `sticky_posts`) e nao desta feature — ver o item 2 do cabecalho.
   */
  readonly mantemAFixacaoNoTopo: boolean;
}

/** O ramo sem efeito: o que o `switch` sem `default` faz com valor desconhecido. */
const SEM_EFEITO: CamposDaVisibilidade = Object.freeze({
  estado: null,
  senha: null,
  mantemAFixacaoNoTopo: true,
});

/**
 * **CA-4.1.** Traduz a visibilidade escolhida nos campos que a gravacao vai
 * escrever — o `switch` de `wp-admin/includes/post.php:318`-`:331`, byte a
 * byte.
 *
 * Aceita `string` e nao {@link Visibilidade} porque no legado o valor vem de
 * `$_POST` sem validacao, e porque o `switch` **nao tem `default`**: valor fora
 * dos tres devolve {@link SEM_EFEITO}, que e a ausencia de atribuicao do legado.
 *
 * **Nao grava, e e assim no legado tambem.** Quem escreve e o caminho de
 * gravacao (`wp_insert_post()`, `wp-includes/post.php:4598`), que e **T005** em
 * diante — e e por isso que esta funcao devolve campos em vez de emitir comando.
 * Emitir aqui um `UPDATE` de duas colunas produziria uma sequencia de comandos
 * que o legado nao tem: ali o `UPDATE` e **um**, com as 21 colunas que
 * `wp_insert_post()` resolve (`armazenamento/conteudo.ts`), e a area 3 da
 * Decisao 2 compara *"snapshot + sequencia de comandos"*.
 */
export function resolverVisibilidade(visibilidade: string): CamposDaVisibilidade {
  switch (visibilidade) {
    // `:320`-`:322`: apaga a senha e NAO toca no estado nem na fixacao.
    case 'public':
      return Object.freeze({
        estado: null,
        senha: '',
        mantemAFixacaoNoTopo: true,
      });

    // `:323`-`:325`: so retira a fixacao.
    case 'password':
      return Object.freeze({
        estado: null,
        senha: null,
        mantemAFixacaoNoTopo: false,
      });

    // `:326`-`:330`: os tres efeitos juntos. E o ramo de US-4.
    case 'private':
      return Object.freeze({
        estado: ESTADO_PRIVADO,
        senha: '',
        mantemAFixacaoNoTopo: false,
      });

    // Sem `default` no legado: nada e atribuido.
    default:
      return SEM_EFEITO;
  }
}
