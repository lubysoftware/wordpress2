/**
 * **US-4**: publicar conteudo como privado, visivel so a quem tem a permissao
 * declarada.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao`. Esta e a operacao
 * da historia: ela recebe a visibilidade escolhida, cobra a permissao que ela
 * exige e devolve os campos que a gravacao vai escrever.
 *
 * ---
 *
 * # Por que ela NAO grava, e por que isso nao e meia entrega
 *
 * No legado nao existe funcao que leve conteudo a privado — nao ha
 * `wp_private_post()`. O privado chega a coluna por **duas** pecas, as duas sem
 * escrita, as duas rodando **antes** de `wp_insert_post()`:
 *
 * | peca | onde | o que faz |
 * |---|---|---|
 * | o `switch` de visibilidade | `wp-admin/includes/post.php:318`-`:331` e `:950`-`:964` | poe `private` em `$post_data['post_status']`, apaga a senha e retira a fixacao |
 * | `handle_status_param()` | `class-wp-rest-posts-controller.php:1569`-`:1583` | devolve o estado, ou um erro quando falta a capacidade |
 *
 * Quem escreve e `wp_insert_post()` (`wp-includes/post.php:4598`), com **um**
 * `UPDATE` de 21 colunas que ela mesma resolve — e esse caminho e **T005** (US-2)
 * em diante, com a unicidade do identificador em T007 e a comparacao de data em
 * T013. `tasks.md` nao da nenhum deles a T009, e `plan.md` poe a gravacao
 * **antes** do conteudo privado na *Sequencia* interna da feature.
 *
 * Emitir aqui um `UPDATE` de duas colunas pareceria mais completo e seria uma
 * divergencia medida: a area 3 da Decisao 2 compara *"snapshot + sequencia de
 * comandos"*, e o legado nao tem, neste caminho, um comando de duas colunas. A
 * forma honesta e a do legado — resolver e devolver —, e e por isso que
 * {@link ResultadoDaVisibilidade.campos} e um `CamposDeConteudo` de
 * `armazenamento/conteudo.ts`: o mesmo tipo que a gravacao consome, pronto para
 * ser passado adiante sem traducao.
 *
 * **A suite de T009 fecha o circuito**: ela leva os campos resolvidos ao
 * repositorio real de T002 e afirma, no comando que sai, que `post_status`
 * carrega os bytes `private` e nao `publish` (CA-4.1).
 *
 * ---
 *
 * # A ordem dos dois passos, e ela e das superficies
 *
 * 1. **resolver a visibilidade** (`visibilidade-do-conteudo.ts`). Vem primeiro
 *    porque e o `switch` que **produz** o estado pedido: no painel ele roda
 *    antes de `_wp_translate_postdata()` (`wp-admin/includes/post.php:334`), e
 *    e o estado ja reescrito que o portao ve.
 * 2. **cobrar a permissao** (`permissao-de-conteudo-privado.ts`), e **somente
 *    quando o estado resolvido e `private`**. Os ramos `public` e `password` nao
 *    tem portao proprio no `switch`, e inventar um aqui fecharia uma porta que o
 *    legado deixa aberta (**P4**: *"preserve o default de cada camada, inclusive
 *    quando o default e permissivo"*).
 *
 * ⚠️ **A senha de conteudo tem portao proprio, e ele nao e desta tarefa.** No
 * painel, `post_password` e descartado de quem nao pode publicar
 * (`wp-admin/includes/post.php:166`-`:168`), o que vale para os tres ramos do
 * `switch` e nao so para o privado. E a senha de conteudo de **US-6 da feature
 * 004** (REQ-044, em `do-not-rewrite.md`), e um dos cinco atestados de
 * `PERM-12`; aqui ela aparece apenas como o `''` que o ramo privado grava.
 */

import type { CamposDeConteudo } from '../armazenamento/index.js';
import type { RecusaDaPublicacao } from '../publicacao/index.js';
import type { ContextoDeVisibilidade } from './contexto-de-visibilidade.js';
import { autorizarConteudoPrivado } from './permissao-de-conteudo-privado.js';
import {
  ESTADO_PRIVADO,
  resolverVisibilidade,
  type CamposDaVisibilidade,
} from './visibilidade-do-conteudo.js';

/** O que se escolhe. */
export interface PedidoDeVisibilidade {
  /**
   * O tipo de conteudo, pelo nome — e dele que sai o nome da capacidade.
   *
   * Nunca a cadeia `publish_posts`: ver
   * `permissao-de-conteudo-privado.ts`.
   */
  readonly tipoDeConteudo: string;
  /**
   * `$post_data['visibility']` — `public`, `password` ou `private`.
   *
   * `string` e nao {@link Visibilidade} porque no legado o valor vem de
   * formulario sem validacao, e porque o `switch` nao tem `default`.
   */
  readonly visibilidade: string;
}

/** O que aconteceu. Dois desfechos, e nenhum deles e excecao. */
export type DesfechoDaVisibilidade =
  /** A visibilidade foi resolvida nos campos a gravar. */
  | 'resolvida'
  /** Sem a capacidade de publicar aquele tipo (CA-4.1). */
  | 'recusada';

/** O que a operacao devolve. */
export interface ResultadoDaVisibilidade {
  readonly desfecho: DesfechoDaVisibilidade;
  /**
   * A recusa, ou `null`. Preenchida **so** no desfecho `recusada`.
   *
   * E a mesma forma da recusa de publicacao, com o mesmo codigo
   * (`rest_cannot_publish`) e o texto do `case 'private'` — ver
   * `permissao-de-conteudo-privado.ts`. `plan.md` fixa a forma na secao
   * *Contratos*: *"erro e devolvido como valor, nao como excecao"*.
   */
  readonly recusa: RecusaDaPublicacao | null;
  /**
   * Os campos que a gravacao vai escrever, no tipo que ela consome.
   *
   * Objeto **vazio** significa *"nada a mudar nesta linha"*, e e o que o ramo
   * `password` e o valor desconhecido produzem: no legado o `switch` nao
   * atribui nada ali. Na recusa tambem e vazio — o estado pedido nao chega a
   * coluna nenhuma.
   */
  readonly campos: CamposDeConteudo;
  /**
   * A decisao sobre a fixacao no topo, que **nao** e coluna de `posts`.
   *
   * Viaja fora de {@link campos} porque o efeito dela e em `sticky_posts`, uma
   * opcao de BC-07, e nao em `posts` — ver o item 2 do cabecalho de
   * `visibilidade-do-conteudo.ts`.
   */
  readonly visibilidadeResolvida: CamposDaVisibilidade;
}

/** Nada a mudar, e nada recusado. */
const SEM_CAMPOS: CamposDeConteudo = Object.freeze({});

/**
 * **A operacao de US-4.** Resolve a visibilidade escolhida nos campos a gravar,
 * exigindo a capacidade de publicar aquele tipo quando a escolha e privada.
 *
 * **Permissao exigida: a capacidade de publicar daquele tipo de conteudo**
 * (`$post_type->cap->publish_posts`), e **somente** quando a visibilidade
 * resolve em `private` — CA-4.1. Nao e uma cadeia fixa: e o slot do registro do
 * tipo, e e por isso que tornar uma pagina privada exige `publish_pages` sem um
 * unico `if` sobre o nome `page`.
 *
 * Os campos de `posts` que saem daqui sao **dois**, e sao os dois que o `switch`
 * do legado atribui: o estado e a senha. Omitir um campo e **nao tocar na
 * coluna**, como `CamposDeConteudo` declara — e e isso que distingue o ramo
 * `public`, que apaga a senha e nao mexe no estado, do ramo `private`, que mexe
 * nos dois.
 */
export function escolherVisibilidade(
  contexto: ContextoDeVisibilidade,
  pedido: PedidoDeVisibilidade,
): ResultadoDaVisibilidade {
  // Passo 1: o `switch` de `wp-admin/includes/post.php:318`-`:331`.
  const visibilidadeResolvida = resolverVisibilidade(pedido.visibilidade);

  // Passo 2: CA-4.1, e so para o ramo privado. Os outros dois nao tem portao no
  // legado — ver a ordem dos dois passos, no cabecalho.
  if (visibilidadeResolvida.estado === ESTADO_PRIVADO) {
    const recusa = autorizarConteudoPrivado(contexto, pedido.tipoDeConteudo);
    if (recusa !== null) {
      return {
        desfecho: 'recusada',
        recusa,
        campos: SEM_CAMPOS,
        visibilidadeResolvida,
      };
    }
  }

  return {
    desfecho: 'resolvida',
    recusa: null,
    campos: camposDeConteudo(visibilidadeResolvida),
    visibilidadeResolvida,
  };
}

/**
 * Os campos de `posts` que a visibilidade decide, no tipo que a gravacao
 * consome.
 *
 * `null` em {@link CamposDaVisibilidade} significa *"o legado nao toca este
 * campo"*, e aqui isso vira **ausencia da chave** — que e o que
 * `CamposDeConteudo` define como "nao tocar na coluna"
 * (`armazenamento/conteudo.ts`). Traduzir `null` para `''` publicaria conteudo
 * privado como publicado no ramo `public`, e apagaria senha no ramo `password`.
 */
function camposDeConteudo(
  visibilidade: CamposDaVisibilidade,
): CamposDeConteudo {
  const campos: { estado?: string; senha?: string } = {};
  if (visibilidade.estado !== null) {
    campos.estado = visibilidade.estado;
  }
  if (visibilidade.senha !== null) {
    campos.senha = visibilidade.senha;
  }
  return Object.freeze(campos);
}
